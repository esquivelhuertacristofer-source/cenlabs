/**
 * fis06/reloj.ts — EL RELOJ ÚNICO del tanque (módulo puro: sin three ni React).
 *
 * La escena llama a `avanzar(dtPared)` una vez por cuadro, ANTES de dibujar (useFrame de
 * prioridad negativa): el tiempo de modelo avanza dtPared·factor (cámara lenta rotulada),
 * se integra el cuerpo (flotacion.ts), la superficie (ondas.ts) y se guarda la muestra de ESE
 * instante. El dock y las lecturas leen el mismo objeto (suscripción), así que escena,
 * gráfica, barras y cifras salen del mismo estado del modelo.
 *
 * Hay un reloj por modo: el de la exploración (el bloque libre) y el del reto (el cilindro
 * problema colgado del dinamómetro).
 */
import {
  avanzar, estadoSoltar, montajeReto, reposoColgado, soporteParaInmersion, volumen,
  AREA_TANQUE, type Estado, type Liquido, type Montaje,
} from './flotacion';
import { Ondas, type Huella } from './ondas';

/** Factores de cámara lenta (s de modelo por s de pared). */
export const LENTOS = [1, 1 / 4, 1 / 10] as const;
export type Lento = (typeof LENTOS)[number];
export const rotuloLento = (f: number) => (f >= 0.999 ? '×1' : `×1/${Math.round(1 / f)}`);

/** Ventana de la gráfica (s de modelo) y periodo de muestreo. */
export const VENTANA = 3;
const DT_MUESTRA = 0.004;
const N_HIST = Math.ceil(VENTANA / DT_MUESTRA) + 8;
/** Velocidad máxima del soporte del dinamómetro (m/s de modelo). */
export const V_SOPORTE = 0.08;

type Sub = () => void;

export class RelojTanque {
  m: Montaje;
  s: Estado;
  ondas: Ondas;
  factor: number = LENTOS[1];
  pausa = false;
  /** sube con cada cuadro integrado o cambio de montaje */
  version = 0;
  /** sube cuando el cuerpo se suelta de nuevo o cambia el montaje (la gráfica se limpia) */
  generacion = 0;
  /** altura objetivo del soporte del dinamómetro (reto) */
  soporteObjetivo: number | null = null;
  /** velocidad actual del soporte (m/s de modelo) */
  vSoporte = 0;
  // historia (anillo): t, altura de G respecto al nivel, ángulo, T, E, N
  readonly hT = new Float64Array(N_HIST);
  readonly hZ = new Float64Array(N_HIST);
  readonly hTh = new Float64Array(N_HIST);
  readonly hTen = new Float64Array(N_HIST);
  readonly hE = new Float64Array(N_HIST);
  readonly hN = new Float64Array(N_HIST);
  nHist = 0;
  cabeza = 0;
  private proxMuestra = 0;
  private vAnterior = 0;
  private subs = new Set<Sub>();

  constructor(m: Montaje, s: Estado, dxOndas: number) {
    this.m = m;
    this.s = s;
    this.ondas = new Ondas(dxOndas);
    this.ondas.fijarLiquido(m.liq);
    this.vAnterior = s.V;
    this.anotar(true);
  }

  /** Cambia el montaje y el estado de golpe (cuerpo nuevo, líquido nuevo, soltar de nuevo). */
  reiniciar(m: Montaje, s: Estado, calmar = false) {
    const liquidoNuevo = m.liq !== this.m.liq;
    this.m = m;
    this.s = s;
    this.vAnterior = s.V;
    this.ondas.fijarLiquido(m.liq);
    if (calmar || liquidoNuevo) this.ondas.calmar();
    this.soporteObjetivo = m.colgado ? m.ySoporte : null;
    this.vSoporte = 0;
    this.nHist = 0; this.cabeza = 0; this.proxMuestra = 0;
    this.generacion++;
    this.anotar(true);
    this.version++;
    this.avisar();
  }

  private anotar(forzar = false) {
    const s = this.s;
    if (!forzar && s.t < this.proxMuestra) return;
    this.proxMuestra = s.t + DT_MUESTRA;
    const i = this.cabeza;
    this.hT[i] = s.t; this.hZ[i] = s.y - s.ys; this.hTh[i] = s.th;
    this.hTen[i] = s.T; this.hE[i] = s.E; this.hN[i] = s.N;
    this.cabeza = (i + 1) % N_HIST;
    this.nHist = Math.min(N_HIST, this.nHist + 1);
  }

  /** Recorre la historia de la más vieja a la más nueva. */
  forEach(fn: (t: number, z: number, th: number, T: number, E: number, N: number) => void) {
    const n = this.nHist;
    const ini = (this.cabeza - n + N_HIST) % N_HIST;
    for (let q = 0; q < n; q++) {
      const i = (ini + q) % N_HIST;
      fn(this.hT[i], this.hZ[i], this.hTh[i], this.hTen[i], this.hE[i], this.hN[i]);
    }
  }

  /** Huella del cuerpo en la superficie (para las ondas). */
  huella(): Huella {
    const { c } = this.m, s = this.s;
    if (!s.corta) return null;
    if (c.forma === 'cilindro') return { tipo: 'disco', r: c.r };
    return { tipo: 'rect', x1: s.x1, x2: s.x2, z1: -c.L / 2, z2: c.L / 2 };
  }

  /** Avanza dtModelo segundos de modelo en trozos (la gráfica muestrea dentro). */
  integrar(dtModelo: number) {
    let resta = dtModelo;
    while (resta > 1e-9) {
      const h = Math.min(resta, DT_MUESTRA);
      // soporte del dinamómetro: se desliza hacia su objetivo con velocidad limitada y suave
      if (this.m.colgado && this.soporteObjetivo !== null) {
        const d = this.soporteObjetivo - this.m.ySoporte;
        const vObj = Math.max(-V_SOPORTE, Math.min(V_SOPORTE, d * 6));
        this.vSoporte += (vObj - this.vSoporte) * Math.min(1, h * 14);
        if (Math.abs(d) < 1e-6 && Math.abs(this.vSoporte) < 1e-5) { this.m.ySoporte = this.soporteObjetivo; this.vSoporte = 0; }
      }
      avanzar(this.m, this.s, h, this.m.colgado ? this.vSoporte : 0);
      const dV = this.s.V - this.vAnterior;
      this.vAnterior = this.s.V;
      this.ondas.paso(h, this.huella(), dV);
      this.anotar();
      resta -= h;
    }
  }

  avanzar(dtPared: number) {
    if (this.pausa || !(dtPared > 0)) { this.avisar(); return; }
    this.integrar(Math.min(0.05, dtPared) * this.factor);
    this.version++;
    this.avisar();
  }

  /** Cambia la resolución de la superficie (calidad alta 5 mm, media 1 cm). */
  resolucionOndas(dx: number) {
    if (Math.abs(this.ondas.dx - dx) < 1e-9) return;
    this.ondas = new Ondas(dx);
    this.ondas.fijarLiquido(this.m.liq);
    this.version++;
  }

  /** Nivel medio del líquido (m) sin cuerpo y con el volumen sumergido actual. */
  get nivel() { return this.s.ys; }
  get fraccionSumergida() { return this.s.V / volumen(this.m.c); }
  /** Subida del nivel por el volumen desalojado (m). */
  get subidaNivel() { return this.s.V / AREA_TANQUE; }

  suscribir(fn: Sub) { this.subs.add(fn); return () => { this.subs.delete(fn); }; }
  private avisar() { this.subs.forEach((f) => f()); }
}

// ───────────────────────────── constructores ─────────────────────────────

/** Reloj de la exploración: el bloque recién soltado sobre el líquido. */
export function relojExploracion(m: Montaje, dxOndas: number): RelojTanque {
  return new RelojTanque(m, estadoSoltar(m), dxOndas);
}

/** Reloj del reto: el cilindro problema colgado y en reposo con la inmersión `f`. */
export function relojReto(rho: number, V: number, liq: Liquido, f: number, dxOndas: number): RelojTanque {
  const m = montajeReto(rho, V, liq, f);
  const r = new RelojTanque(m, reposoColgado(m, f), dxOndas);
  r.soporteObjetivo = m.ySoporte;
  r.factor = LENTOS[0];
  return r;
}

/** Lleva el soporte del reto hacia la inmersión `f` (se desliza; el cilindro lo sigue colgado). */
export function fijarInmersion(r: RelojTanque, f: number) {
  r.soporteObjetivo = soporteParaInmersion(r.m.c, r.m.liq, f, r.m.Vagua, r.m.kMuelle);
}
