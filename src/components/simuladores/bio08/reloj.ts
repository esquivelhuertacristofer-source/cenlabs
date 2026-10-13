/**
 * bio08/reloj.ts — EL reloj cardiaco (sin three).
 *
 * Un solo tiempo del paciente (ms) que avanza con el cuadro de la escena × la
 * velocidad de reproducción (cámara lenta rotulada). Cada 2 ms de paciente escribe
 * el dipolo D(t) en un búfer circular; de ahí leen, en el mismo cuadro, la tira de
 * ECG del dock (cualquier derivación es D·û) y el lazo vectorcardiográfico. La
 * escena lee del mismo reloj el tiempo del ciclo y el mapeo del latido en curso.
 *
 * El nodo SA manda: un cambio de FC (un fármaco) se aplica al empezar el latido
 * siguiente, como en el corazón.
 */
import { mapear, dipolo, DPA, type Mapeo, type FuenteDipolo, type Activacion } from './electro';
import type { V3 } from './anatomia';

export const PASO_MS = 2;
/** Historia guardada (ms de paciente): de sobra para la tira más ancha. */
export const HISTORIA_MS = 14000;
const N = HISTORIA_MS / PASO_MS;

export type ActividadReloj = Pick<Activacion, 'aMax' | 'vMin' | 'vMax' | 'rMin' | 'rMax' | 'tLlegadaAV'>;
export interface ModeloReloj { fuente: FuenteDipolo; K: number; act: ActividadReloj; tauMedioV: number; rhoMedioV: number }

/** Velocidades de reproducción ofrecidas (fracción del tiempo real). */
export const VELOCIDADES = [1, 1 / 3, 1 / 10] as const;

export class RelojCardiaco {
  modelo: ModeloReloj | null = null;
  /** ms del paciente desde el inicio de la onda P del latido en curso (continuo) */
  tCiclo = 0;
  rr: number;
  rrObjetivo: number;
  mapeo: Mapeo | null = null;
  latido = 0;
  /** ms de paciente transcurridos (para el desplazamiento del papel) */
  tPaciente = 0;
  velocidad: number = 1 / 3;
  pausa = false;
  /** búfer circular de D (x, y, z) cada PASO_MS */
  readonly muestras = new Float32Array(N * 3);
  escritas = 0;
  readonly D: V3 = [0, 0, 0];
  private resto = 0;
  private subs = new Set<() => void>();

  constructor(bpm: number) {
    this.rr = 60000 / bpm;
    this.rrObjetivo = this.rr;
  }

  fijarModelo(m: ModeloReloj) {
    this.modelo = m;
    this.mapeo = mapear(this.rr, m.act);
  }
  fijarFC(bpm: number) { this.rrObjetivo = 60000 / Math.max(20, Math.min(250, bpm)); }

  /** Avanza `dtReal` ms de reloj de pared (respeta pausa y velocidad). */
  avanzar(dtReal: number) {
    if (this.pausa) { this.avisar(); return; }
    this.correr(Math.min(dtReal, 100) * this.velocidad);
  }
  /** Avanza `ms` de paciente aunque esté en pausa (paso a paso). */
  paso(ms: number) { this.correr(ms); }

  private correr(msPaciente: number) {
    let restante = msPaciente + this.resto;
    while (restante >= PASO_MS) {
      restante -= PASO_MS;
      this.tCiclo += PASO_MS;
      this.tPaciente += PASO_MS;
      if (this.tCiclo >= this.rr) {
        this.tCiclo -= this.rr;
        this.rr = this.rrObjetivo;
        this.latido++;
        if (this.modelo) this.mapeo = mapear(this.rr, this.modelo.act);
      }
      this.escribir();
    }
    this.resto = restante;
    this.avisar();
  }

  private escribir() {
    const m = this.modelo, mp = this.mapeo;
    const o = (this.escritas % N) * 3;
    if (m && mp) {
      dipolo(m.fuente, mp, this.tCiclo, m.K, this.D);
      this.muestras[o] = this.D[0]; this.muestras[o + 1] = this.D[1]; this.muestras[o + 2] = this.D[2];
    } else { this.muestras[o] = 0; this.muestras[o + 1] = 0; this.muestras[o + 2] = 0; }
    this.escritas++;
  }

  /** Tiempo del ciclo con la fracción de paso pendiente (para animar sin saltos). */
  get tCicloSuave() { return Math.min(this.rr, this.tCiclo + this.resto); }

  /** Muestra k-ésima hacia atrás (0 = la más reciente); null si aún no existe. */
  muestra(k: number, out: V3): V3 | null {
    if (k >= this.escritas || k >= N) return null;
    const o = (((this.escritas - 1 - k) % N) + N) % N * 3;
    out[0] = this.muestras[o]; out[1] = this.muestras[o + 1]; out[2] = this.muestras[o + 2];
    return out;
  }

  suscribir(fn: () => void) { this.subs.add(fn); return () => { this.subs.delete(fn); }; }
  private avisar() { this.subs.forEach((f) => f()); }
}

// ───────────────────────────── tiempos y mecánica ─────────────────────────────

/** Proceso de cada vértice o tramo: 1 = aurícula, 2 = ventrículo (como TEJIDO). */
export function tiemposDominio(tauBruto: number, rhoBruto: number, proc: number, m: Mapeo, act: ActividadReloj): [number, number] {
  if (proc === 1) return [tauBruto * m.kA, rhoBruto * m.kA];
  const sV = m.vDep[1] / (act.vMax - act.vMin), sR = m.vRep[1] / (act.rMax - act.rMin);
  return [m.vDep[0] + (tauBruto - act.vMin) * sV, m.vRep[0] + (rhoBruto - act.rMin) * sR];
}
/** Tiempo del dominio de un punto del sistema de conducción (A: desde SA; AV: fracción; V: desde His). */
export function tiempoConduccion(t: number, proceso: 'A' | 'AV' | 'V', m: Mapeo): number {
  if (proceso === 'A') return t * m.kA;
  if (proceso === 'AV') return m.tAV + (m.tHis - m.tAV) * t;
  return m.tHis + t * m.kV;
}

/** Parámetros de la mecánica esquemática (ms del dominio). */
export const MECANICA = { retardoV: 25, retardoA: 20, subidaV: 110, subidaA: 70, relajaV: 120, relajaA: 70 };
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Contracción 0..1 de un punto con tiempos del dominio τ, ρ (incluye la cola del latido anterior). */
export function contraccion(t: number, tau: number, rho: number, proc: number, rr: number): number {
  const v = proc === 2;
  const re = v ? MECANICA.retardoV : MECANICA.retardoA, sube = v ? MECANICA.subidaV : MECANICA.subidaA, rel = v ? MECANICA.relajaV : MECANICA.relajaA;
  const c = (x: number) => sm(tau + re, tau + re + sube, x) * (1 - sm(rho + 10, rho + 10 + rel, x));
  return Math.max(c(t), c(t + rr));
}

/**
 * Válvulas a partir de la contracción ventricular media: las AV se cierran en
 * cuanto el ventrículo empieza a contraerse; las sigmoideas abren con la eyección
 * y cierran cuando empieza la relajación. 1 = abierta.
 */
export function valvulas(t: number, m: Mapeo, mod: Pick<ModeloReloj, 'act' | 'tauMedioV' | 'rhoMedioV'>): { av: number; sigmoidea: number; cV: number; cA: number } {
  const [tau, rho] = tiemposDominio(mod.tauMedioV, mod.rhoMedioV, 2, m, mod.act);
  const cV = contraccion(t, tau, rho, 2, m.rr);
  const tauA = mod.act.aMax * 0.5;
  const cA = contraccion(t, tauA * m.kA, (tauA + DPA.auricular) * m.kA, 1, m.rr);
  const av = 1 - sm(0.06, 0.16, cV);
  // antes de la contracción de este latido, lo que queda es la relajación del anterior
  const relaja = t < tau ? 1 : sm(rho + 5, rho + 25, t);
  const sigmoidea = sm(0.38, 0.52, cV) * (1 - relaja);
  return { av, sigmoidea, cV, cA };
}
