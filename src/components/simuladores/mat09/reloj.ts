/**
 * mat09/reloj.ts — EL RELOJ ÚNICO del banco de integración (módulo puro, sin three ni React).
 *
 * La escena llama a `paso(dt)` una vez por cuadro (useFrame de prioridad −1, antes de dibujar).
 * El reloj decide qué columnas se ven y a qué altura, cuánto se ha vertido en la probeta y qué n
 * manda. La escena, el dock y la barra de lecturas leen el MISMO objeto en ese cuadro (comparando
 * `version`): columnas, nivel de la probeta, cifras y gráficas coinciden.
 *
 * Coreografía de la exploración (estado inicial, «n crece solo»):
 *   llenar    un barrido recorre [a, b]: cada columna sube al pasar y su área f(x*)·Δx se vierte
 *             en la probeta (nivel = Σ crecimientoᵢ·Aᵢ, la suma parcial exacta)
 *   sostener  pausa con la suma completa
 *   partir    n se duplica: cada columna se parte en dos y sus techos van a sus nuevas alturas;
 *             la probeta pasa de Sₙ a S₂ₙ
 *   final     al llegar a n = 128, se sostiene y luego se vacía (vaciar) y vuelve a n = 2.
 *
 * Las transiciones son de forma: las columnas nuevas parten del perfil que se veía (muestreado en
 * sus tres nodos) y llegan al de la regla. Las cifras (Sₙ, error) son siempre las de la n nueva.
 */
import { columnas, suma, nEfectivo, areaColumna, type Curva, type Metodo, type Columna } from './riemann';

export type ModoM9 = 'explorar' | 'reto';
export type Fase = 'llenar' | 'sostener' | 'partir' | 'final' | 'vaciar' | 'quieto';

export const N_AUTO_INICIO = 2;
export const N_AUTO_TOPE = 128;
export const N_MAX_EXPLORAR = 256;
/** Capacidad de la escena (columnas instanciadas). */
export const MAX_COLUMNAS = 256;
/** s que tarda el barrido en recorrer [a, b] */
export const T_LLENAR = 2.6;
export const T_PARTIR = 0.9;
export const T_SOSTENER = 1.05;
export const T_FINAL = 2.6;
export const T_VACIAR = 1.4;
/** transición de un cambio a mano (n o método) */
export const T_MANO = 0.45;
/** reto: «Animar n» sube n de uno en uno con este paso */
export const T_PASO_SUBIR = 0.07;

const suave = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const facil = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Brillo extra de la columna que se está vertiendo (0 fuera de (0, 1,5)). */
const pulso = (t: number) => (t > 0 && t < 1.5 ? Math.sin((Math.PI * t) / 1.5) : 0);

export interface LecturaM9 {
  modo: ModoM9;
  metodo: Metodo;
  fase: Fase;
  /** n efectivo (Simpson: par) */
  n: number;
  /** columnas dibujadas (Simpson: n/2 paneles) */
  nCols: number;
  h: number;
  /** Sₙ de la regla con la n actual */
  suma: number;
  /** lo que marca la probeta en este cuadro (unidades de área) */
  nivel: number;
  /** cifra principal: durante el llenado, lo vertido; si no, Sₙ */
  sumaMostrada: number;
  exacta: number;
  error: number;
  errorRel: number;
  /** x (de la función) del frente del barrido, o null si no hay barrido */
  xBarrido: number | null;
}

export class RelojRiemann {
  curva: Curva;
  modo: ModoM9;
  metodo: Metodo;
  n: number;
  /** exploración: n crece solo, en bucle */
  auto: boolean;
  pausa = false;
  fase: Fase = 'llenar';
  tf = 0;
  /** columnas destino (las de la regla con la n actual) */
  cols: Columna[];
  /** de dónde parte la transición (mismas posiciones que `cols`) */
  private desde: Columna[];
  private dur = T_PARTIR;
  /** columnas ya vertidas (fraccionario) */
  barrido = 0;
  nivel = 0;
  private nivelDesde = 0;
  sumaN: number;
  /** reto: «Animar n» */
  subiendo = false;
  private nHasta = 0;
  private alTerminar: ((n: number) => void) | null = null;
  version = 0;
  /** cambia cuando cambian las posiciones de las columnas (otra n, otro método u otra curva) */
  versionCols = 0;

  // ── lo que se ve en este cuadro (columna i) ──
  vx0 = new Float64Array(MAX_COLUMNAS);
  vx1 = new Float64Array(MAX_COLUMNAS);
  vq0 = new Float64Array(MAX_COLUMNAS);
  vqm = new Float64Array(MAX_COLUMNAS);
  vq1 = new Float64Array(MAX_COLUMNAS);
  /** brillo: 0 sin verter, 1 vertida, > 1 mientras se vierte */
  vluz = new Float64Array(MAX_COLUMNAS);
  nVista = 0;

  constructor(curva: Curva, modo: ModoM9, metodo: Metodo, n: number) {
    this.curva = curva;
    this.modo = modo;
    this.metodo = metodo;
    this.n = nEfectivo(n, metodo);
    this.auto = modo === 'explorar';
    this.cols = columnas(curva, this.n, metodo);
    this.desde = this.cols;
    this.sumaN = suma(curva, this.n, metodo);
    this.irA('llenar');
    this.calcularVista();
  }

  get h() { return (this.curva.b - this.curva.a) / this.n; }

  // ───────────────────────────── el paso del reloj ─────────────────────────────

  /** Avanza dt segundos de pantalla. Devuelve true si algo visible cambió. */
  paso(dtReal: number): boolean {
    if (this.pausa || !(dtReal > 0)) return false;
    const dt = Math.min(dtReal, 0.1);
    const f0 = this.fase, b0 = this.barrido, t0 = this.tf, nv0 = this.nivel;
    this.tf += dt;
    switch (this.fase) {
      case 'llenar': {
        const nc = this.cols.length;
        this.barrido += (dt * nc) / T_LLENAR;
        if (this.barrido >= nc + 1.5) { this.barrido = nc + 1.5; this.irA(this.auto ? 'sostener' : 'quieto'); }
        break;
      }
      case 'sostener':
        if (this.tf >= T_SOSTENER) {
          if (!this.auto) this.irA('quieto');
          else if (this.n < N_AUTO_TOPE) this.cambiarN(Math.min(N_AUTO_TOPE, this.n * 2), T_PARTIR);
          else this.irA('final');
        }
        break;
      case 'partir':
        if (this.tf >= this.dur) {
          this.desde = this.cols;
          if (this.subiendo && this.n < this.nHasta) this.cambiarN(this.n + 1, T_PASO_SUBIR);
          else if (this.subiendo) { this.subiendo = false; this.irA('quieto'); this.alTerminar?.(this.n); this.alTerminar = null; }
          else this.irA(this.auto ? 'sostener' : 'quieto');
        }
        break;
      case 'final':
        if (this.tf >= T_FINAL) { this.nivelDesde = this.nivel; this.irA('vaciar'); }
        break;
      case 'vaciar':
        if (this.tf >= T_VACIAR) {
          this.n = nEfectivo(N_AUTO_INICIO, this.metodo);
          this.cols = columnas(this.curva, this.n, this.metodo);
          this.desde = this.cols;
          this.sumaN = suma(this.curva, this.n, this.metodo);
          this.versionCols++;
          this.irA('llenar');
        }
        break;
      case 'quieto':
        break;
    }
    this.calcularVista();
    const cambio = f0 !== this.fase || b0 !== this.barrido || (this.fase !== 'quieto' && t0 !== this.tf) || nv0 !== this.nivel;
    if (cambio) this.version++;
    return cambio;
  }

  private irA(f: Fase) {
    this.fase = f;
    this.tf = 0;
    if (f === 'llenar') { this.barrido = 0; this.nivel = 0; }
  }

  /**
   * Calcula las columnas de este cuadro y el nivel de la probeta. El nivel es SIEMPRE la suma de
   * las áreas de las columnas tal como se ven (crecimiento × área), salvo en las transiciones,
   * donde va de Sₙ a la S nueva con la misma curva de tiempo que los techos.
   */
  private calcularVista() {
    const nc = Math.min(MAX_COLUMNAS, this.cols.length);
    this.nVista = nc;
    const enLlenado = this.fase === 'llenar';
    const enPartir = this.fase === 'partir';
    const u = enPartir ? facil(this.tf / this.dur) : 1;
    const g = this.fase === 'vaciar' ? 1 - suave(this.tf / T_VACIAR) : 1;
    let nivel = 0;
    for (let i = 0; i < nc; i++) {
      const k = this.cols[i], d = enPartir ? this.desde[i] ?? k : k;
      const gi = enLlenado ? suave(this.barrido - i) : g;
      this.vx0[i] = k.x0; this.vx1[i] = k.x1;
      this.vq0[i] = gi * (d.q0 + (k.q0 - d.q0) * u);
      this.vqm[i] = gi * (d.qm + (k.qm - d.qm) * u);
      this.vq1[i] = gi * (d.q1 + (k.q1 - d.q1) * u);
      this.vluz[i] = enLlenado ? Math.min(1, Math.max(0, this.barrido - i)) + 0.9 * pulso(this.barrido - i) : g;
      if (enLlenado) nivel += gi * areaColumna(k);
    }
    if (enLlenado) this.nivel = nivel;
    else if (enPartir) this.nivel = this.nivelDesde + (this.sumaN - this.nivelDesde) * u;
    else if (this.fase === 'vaciar') this.nivel = this.nivelDesde * g;
    else this.nivel = this.sumaN;
  }

  /** Altura del perfil que se ve ahora en x (para empezar una transición desde él). */
  perfilVisto(x: number, lado: 1 | -1 = 1): number {
    const n = this.nVista;
    if (n === 0) return 0;
    // búsqueda binaria de la columna que contiene x (con el lado para los bordes)
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (lado > 0 ? this.vx1[mid] <= x : this.vx1[mid] < x) lo = mid + 1; else hi = mid;
    }
    const i = lo;
    const x0 = this.vx0[i], x1 = this.vx1[i];
    const t = Math.min(1, Math.max(0, (x - x0) / (x1 - x0)));
    return this.vq0[i] * (1 - t) * (1 - 2 * t) + this.vqm[i] * 4 * t * (1 - t) + this.vq1[i] * t * (2 * t - 1);
  }

  /** Pasa a n (y/o a otro método ya fijado) con una transición de forma de `dur` segundos. */
  private cambiarN(nNuevo: number, dur: number) {
    const nuevo = columnas(this.curva, nNuevo, this.metodo);
    this.desde = nuevo.map((k) => {
      const w = k.x1 - k.x0, e = w * 1e-6;
      return { x0: k.x0, x1: k.x1, q0: this.perfilVisto(k.x0 + e, 1), qm: this.perfilVisto((k.x0 + k.x1) / 2, 1), q1: this.perfilVisto(k.x1 - e, -1) };
    });
    this.nivelDesde = this.nivel;
    this.cols = nuevo;
    this.n = nNuevo;
    this.sumaN = suma(this.curva, nNuevo, this.metodo);
    this.barrido = nuevo.length + 1.5;
    this.dur = dur;
    this.versionCols++;
    this.irA('partir');
    this.calcularVista();
    this.version++;
  }

  // ───────────────────────────── mandos ─────────────────────────────

  /** El alumno fija n: se para el bucle y las columnas van a la nueva partición. */
  setN(n: number, dur = T_MANO) {
    const nn = nEfectivo(Math.max(1, Math.min(N_MAX_EXPLORAR, n)), this.metodo);
    this.auto = false;
    this.subiendo = false;
    if (nn === this.n && this.fase !== 'llenar' && this.fase !== 'vaciar') return;
    this.cambiarN(nn, dur);
  }

  /** Otra regla: los techos van del perfil de la anterior al de la nueva (el bucle sigue). */
  setMetodo(m: Metodo) {
    if (m === this.metodo) return;
    this.metodo = m;
    this.cambiarN(nEfectivo(this.n, m), T_MANO);
  }

  /** Otra curva (u otra visita al reto): la probeta se vacía y las columnas vuelven a subir. */
  setCurva(c: Curva, n?: number) {
    this.curva = c;
    if (n !== undefined) this.n = nEfectivo(n, this.metodo);
    else if (this.auto) this.n = nEfectivo(N_AUTO_INICIO, this.metodo);
    this.cols = columnas(c, this.n, this.metodo);
    this.desde = this.cols;
    this.sumaN = suma(c, this.n, this.metodo);
    this.subiendo = false;
    this.versionCols++;
    this.irA('llenar');
    this.calcularVista();
    this.version++;
  }

  /** Exploración: n crece solo (×2 hasta 128, y vuelta a empezar). */
  setAuto(on: boolean) {
    this.auto = on;
    this.subiendo = false;
    if (on && (this.fase === 'quieto' || this.fase === 'sostener')) {
      if (this.n >= N_AUTO_TOPE) { this.nivelDesde = this.nivel; this.irA('vaciar'); }
      else { this.irA('sostener'); this.tf = T_SOSTENER * 0.5; }
    }
    if (!on && (this.fase === 'final' || this.fase === 'sostener')) this.irA('quieto');
    if (!on && this.fase === 'vaciar') { this.irA('quieto'); this.calcularVista(); }
    this.version++;
  }

  /** Reto: n sube de uno en uno hasta `hasta`; al llegar (o al detener) se avisa con la n final. */
  subirHasta(hasta: number, alTerminar: (n: number) => void) {
    this.auto = false;
    if (this.n >= hasta) { alTerminar(this.n); return; }
    this.subiendo = true;
    this.nHasta = hasta;
    this.alTerminar = alTerminar;
    this.cambiarN(this.n + 1, T_PASO_SUBIR);
  }
  /** Detiene la subida y devuelve la n alcanzada. */
  detenerSubida(): number {
    this.subiendo = false;
    this.alTerminar = null;
    return this.n;
  }

  /** Vuelve a verter desde cero (las columnas suben otra vez con su barrido). */
  rellenar() {
    this.subiendo = false;
    this.irA('llenar');
    this.calcularVista();
    this.version++;
  }

  /** Movimiento reducido: todo quieto, columnas completas y la probeta llena. */
  estatico(n = 16) {
    this.auto = false;
    this.subiendo = false;
    this.n = nEfectivo(n, this.metodo);
    this.cols = columnas(this.curva, this.n, this.metodo);
    this.desde = this.cols;
    this.sumaN = suma(this.curva, this.n, this.metodo);
    this.versionCols++;
    this.fase = 'quieto';
    this.tf = 0;
    this.barrido = this.cols.length + 1.5;
    this.calcularVista();
    this.version++;
  }

  // ───────────────────────────── lectura del cuadro ─────────────────────────────

  lectura(): LecturaM9 {
    const c = this.curva, e = this.sumaN - c.exacta;
    const nc = this.cols.length;
    const xb = this.fase === 'llenar' && this.barrido < nc ? c.a + (c.b - c.a) * Math.min(1, this.barrido / nc) : null;
    return {
      modo: this.modo, metodo: this.metodo, fase: this.fase,
      n: this.n, nCols: nc, h: this.h,
      suma: this.sumaN, nivel: this.nivel,
      sumaMostrada: this.fase === 'llenar' ? this.nivel : this.sumaN,
      exacta: c.exacta, error: e, errorRel: Math.abs(e) / Math.abs(c.exacta),
      xBarrido: xb,
    };
  }
}
