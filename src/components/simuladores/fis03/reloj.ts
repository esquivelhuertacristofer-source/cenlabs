/**
 * fis03/reloj.ts — EL RELOJ ÚNICO del péndulo (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dtReal)` una vez por cuadro (useFrame de prioridad −1, antes de
 * dibujar): el tiempo de modelo avanza dtReal·factor (cámara lenta rotulada), se integra la
 * ecuación completa con RK4 en subpasos de ≤ 1 ms y se publica el estado de ESE cuadro. El
 * péndulo 3D, el fantasma lineal, la estela, la fotopuerta, el cronómetro, el dock (θ(t),
 * fase, T(θ₀)) y las cifras leen este mismo objeto.
 *
 * Cronómetro: mide TIEMPO DE MODELO (no el del reloj de pared), así que un cuadro lento o
 * la cámara lenta no falsean la medida; el error que queda es el del dedo del alumno.
 */
import {
  DetectorPasos, H_MAX, energias, lineal, pasoRK4, periodoExacto, periodoPequeno,
  type EstadoPendulo, type ParamsPendulo,
} from './pendulo';

/** Factores de cámara lenta (s de modelo por s de pantalla). */
export const LENTOS = [1, 1 / 2, 1 / 4] as const;
export const rotuloLento = (f: number) => (f >= 0.999 ? '×1' : `×1/${Math.round(1 / f)}`);

/** Muestreo de la historia (s de modelo) y su capacidad (≈ 27 s). */
export const DT_HIST = 1 / 150;
const CAP = 4096;
/** Medidas T(θ₀) que se guardan como mucho. */
const MAX_MEDIDAS = 90;

export interface ConfigPendulo extends ParamsPendulo {
  /** ángulo de suelta (rad) */
  theta0: number;
  /** radio de la esfera (m): el haz queda tapado mientras |L·sen θ| < r */
  r: number;
  /** false: la mano lo sujeta en θ₀ */
  suelto: boolean;
}

export interface MedidaPeriodo {
  /** amplitud media del periodo medido (rad) */
  amp: number;
  /** T medido / T₀ de esa longitud y esa g */
  razon: number;
  /** T medido (s) */
  T: number;
}

export interface LecturaPendulo {
  /** último periodo de la fotopuerta (s) o NaN */
  T: number;
  /** oscilaciones completas desde el primer paso por el haz */
  n: number;
  /** amplitud actual (rad): el último extremo, o θ₀ si aún no hay */
  amp: number;
  /** T₀ = 2π√(L/g) (s) */
  T0: number;
  /** T exacto (elíptico) a la amplitud actual sin amortiguar (s) */
  Texacto: number;
  /** cinética y potencial por unidad de masa, y la energía de la suelta (J/kg) */
  K: number; U: number; E0: number;
  bloqueada: boolean;
}

export class RelojPendulo {
  c: ConfigPendulo;
  e: EstadoPendulo;
  /** t de modelo de la última suelta (el t = 0 del péndulo lineal) */
  tSuelta = 0;
  factor = 1;
  pausa = false;
  /** sube con cada cuadro integrado o cambio */
  version = 0;
  /** historia: t, θ real, θ lineal, ω real, ω lineal (anillo) */
  readonly ht = new Float64Array(CAP);
  readonly hth = new Float32Array(CAP);
  readonly hlin = new Float32Array(CAP);
  readonly hw = new Float32Array(CAP);
  readonly hwl = new Float32Array(CAP);
  hn = 0;
  hi = 0;
  private tUlt = -Infinity;
  /** fotopuerta */
  readonly foto = new DetectorPasos();
  /** último instante (t de modelo) con el haz tapado */
  tBloqueo = -Infinity;
  /** extremos: los dos últimos |θ| en que ω cambió de signo */
  private extremos: [number, number] = [NaN, NaN];
  private nExtremos = 0;
  /** medidas T(θ₀) de la fotopuerta */
  medidas: MedidaPeriodo[] = [];
  /** cronómetro en tiempo de modelo */
  crono = { corriendo: false, inicio: 0, acumulado: 0 };
  /** reloj de pared del último paso (ms): el cronómetro interpola entre cuadros */
  private pared = 0;
  private subs = new Set<() => void>();

  constructor(c: ConfigPendulo) {
    this.c = { ...c };
    this.e = { t: 0, theta: c.theta0, omega: 0 };
  }

  suscribir(f: () => void): () => void { this.subs.add(f); return () => { this.subs.delete(f); }; }
  avisar() { this.version++; this.subs.forEach((f) => f()); }

  get T0() { return periodoPequeno(this.c.L, this.c.g); }

  /** Ventana de θ(t) (s de modelo): unos tres periodos, entre 5 y 16 s. */
  get ventana() {
    const T = periodoExacto(this.c.L, this.c.g, Math.min(this.c.theta0, 179 * Math.PI / 180));
    return Math.min(16, Math.max(5, 3.2 * T));
  }

  /** Cambia mandos. L, g, θ₀ o r nuevos sueltan de nuevo (o dejan la mano en el θ₀ nuevo). */
  fijar(cambios: Partial<ConfigPendulo>) {
    const n = { ...this.c, ...cambios };
    const k = (Object.keys(n) as (keyof ConfigPendulo)[]);
    if (k.every((x) => n[x] === this.c[x])) return;
    const reinicia = n.L !== this.c.L || n.g !== this.c.g || n.theta0 !== this.c.theta0 || n.r !== this.c.r || (n.suelto && !this.c.suelto);
    this.c = n;
    if (reinicia || !n.suelto) this.soltar();
    this.avisar();
  }

  /** Suelta (o sujeta, si `suelto` es false) desde θ₀ en reposo. Borra la historia: es un ensayo nuevo. */
  soltar() {
    this.e = { t: this.e.t, theta: this.c.theta0, omega: 0 };
    this.tSuelta = this.e.t;
    this.foto.reiniciar();
    this.extremos = [NaN, NaN]; this.nExtremos = 0;
    this.hn = 0; this.hi = 0; this.tUlt = -Infinity;
    this.muestrear();
  }

  /** Estado inicial vivo: suelta e integra `segundos` para que las gráficas ya tengan historia. */
  arrancar(segundos: number) {
    this.soltar();
    this.integrar(segundos);
    this.avisar();
  }

  /** Avanza dtReal segundos de pantalla. */
  paso(dtReal: number) {
    this.pared = typeof performance !== 'undefined' ? performance.now() : 0;
    if (this.pausa || !(dtReal > 0)) return;
    this.integrar(Math.min(dtReal, 0.1) * this.factor);
    this.avisar();
  }

  /** Integra `dt` s de modelo con fotopuerta, extremos, medidas e historia. */
  integrar(dt: number) {
    if (!(dt > 0)) return;
    const n = Math.max(1, Math.ceil(dt / H_MAX));
    const h = dt / n;
    const { c, e } = this;
    for (let i = 0; i < n; i++) {
      if (!c.suelto) {
        // la mano lo sujeta: el tiempo corre, el péndulo no
        e.t += h; e.theta = c.theta0; e.omega = 0;
        this.muestrear();
        continue;
      }
      const t0 = e.t, th0 = e.theta, w0 = e.omega;
      pasoRK4(e, c, h);
      // extremo: ω cambia de signo (|θ| en el extremo, interpolado)
      if ((w0 > 0 && e.omega <= 0) || (w0 < 0 && e.omega >= 0)) {
        const f = w0 / (w0 - e.omega);
        const thx = Math.abs(th0 + (e.theta - th0) * f);
        this.extremos[0] = this.extremos[1]; this.extremos[1] = thx; this.nExtremos++;
      }
      // fotopuerta
      if (Math.abs(c.L * Math.sin(e.theta)) < c.r) this.tBloqueo = e.t;
      if (this.foto.registrar(t0, th0, e.t, e.theta)) this.medir();
      this.muestrear();
    }
  }

  /** Guarda la medida T(θ₀) del periodo que acaba de completar la fotopuerta. */
  private medir() {
    const T = this.foto.periodo;
    if (!(T > 0)) return;
    const amp = this.nExtremos >= 2 ? (this.extremos[0] + this.extremos[1]) / 2 : this.c.theta0;
    const m: MedidaPeriodo = { amp, razon: T / this.T0, T };
    const u = this.medidas[this.medidas.length - 1];
    // en régimen sin amortiguar el punto se repite: se sustituye en vez de amontonar
    if (u && Math.abs(u.amp - amp) < 0.0035 && Math.abs(u.razon - m.razon) < 2e-4) this.medidas[this.medidas.length - 1] = m;
    else {
      this.medidas.push(m);
      if (this.medidas.length > MAX_MEDIDAS) this.medidas.shift();
    }
  }

  private muestrear() {
    const e = this.e;
    if (e.t - this.tUlt < DT_HIST - 1e-9) return;
    this.tUlt = e.t;
    const l = this.lineal();
    this.ht[this.hi] = e.t; this.hth[this.hi] = e.theta; this.hw[this.hi] = e.omega;
    this.hlin[this.hi] = l.theta; this.hwl[this.hi] = l.omega;
    this.hi = (this.hi + 1) % CAP;
    this.hn = Math.min(CAP, this.hn + 1);
  }

  /** Estado del péndulo lineal (fantasma) en el t de modelo actual (o en `t`). */
  lineal(t = this.e.t): { theta: number; omega: number } {
    if (!this.c.suelto) return { theta: this.c.theta0, omega: 0 };
    return lineal(t - this.tSuelta, this.c.theta0, this.c);
  }

  /** Muestra k-ésima de la historia (0 = la más antigua). */
  muestra(k: number): { t: number; th: number; lin: number; w: number; wl: number } {
    const j = (this.hi - this.hn + k + CAP * 2) % CAP;
    return { t: this.ht[j], th: this.hth[j], lin: this.hlin[j], w: this.hw[j], wl: this.hwl[j] };
  }

  /** θ real interpolado en el instante t (dentro de la historia); NaN si no la hay. */
  thetaEn(t: number): number {
    if (this.hn === 0) return NaN;
    const idx = (k: number) => (this.hi - this.hn + k + CAP * 2) % CAP;
    const t0 = this.ht[idx(0)];
    if (t < t0) return NaN;
    if (t >= this.e.t) return this.e.theta;
    const k = Math.min(this.hn - 2, Math.max(0, Math.floor((t - t0) / DT_HIST)));
    // la historia es casi equiespaciada: se corrige con una búsqueda corta
    let a = k;
    while (a > 0 && this.ht[idx(a)] > t) a--;
    while (a < this.hn - 2 && this.ht[idx(a + 1)] <= t) a++;
    const ia = idx(a), ib = idx(Math.min(this.hn - 1, a + 1));
    const ta = this.ht[ia], tb = this.ht[ib];
    if (!(tb > ta)) return this.hth[ia];
    return this.hth[ia] + ((this.hth[ib] - this.hth[ia]) * (t - ta)) / (tb - ta);
  }

  // ── cronómetro ──
  /** Tiempo de modelo «ahora», interpolado desde el último cuadro (para los clics). */
  private ahora(): number {
    if (this.pausa || typeof performance === 'undefined' || this.pared === 0) return this.e.t;
    return this.e.t + Math.min(0.1, Math.max(0, (performance.now() - this.pared) / 1000)) * this.factor;
  }
  cronoAlternar() {
    const t = this.ahora();
    if (this.crono.corriendo) { this.crono.acumulado += t - this.crono.inicio; this.crono.corriendo = false; }
    else { this.crono.inicio = t; this.crono.corriendo = true; }
    this.avisar();
  }
  cronoReiniciar() { this.crono = { corriendo: false, inicio: 0, acumulado: 0 }; this.avisar(); }
  /** Segundos medidos. */
  cronoLeer(): number {
    return this.crono.acumulado + (this.crono.corriendo ? Math.max(0, this.e.t - this.crono.inicio) : 0);
  }

  /** Amplitud actual (rad). */
  get amplitud(): number { return this.nExtremos >= 1 ? this.extremos[1] : this.c.theta0; }

  /** Lo que marcan los instrumentos en este cuadro. */
  lectura(): LecturaPendulo {
    const { c, e } = this;
    const { K, U } = energias(e.theta, e.omega, c);
    const amp = this.amplitud;
    return {
      T: this.foto.periodo,
      n: this.foto.oscilaciones,
      amp,
      T0: this.T0,
      Texacto: periodoExacto(c.L, c.g, amp),
      K, U, E0: energias(c.theta0, 0, c).U,
      bloqueada: c.suelto && e.t - this.tBloqueo < 1e-9,
    };
  }
}
