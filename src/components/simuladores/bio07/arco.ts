/**
 * bio07/arco.ts — la física del ARCO REFLEJO rotuliano (módulo puro, sin three).
 *
 *  · Forma del PA propagado: lo que ve un nodo de Ranvier de la fibra Aα sana (cable
 *    HH de neuro.ts). Un PA que se propaga conserva la forma: en cada punto de una
 *    fibra, V(t) = V_PA(t − t₀ − s/v). La escena colorea así las fibras del arco.
 *  · Motoneurona α: un compartimento HH con la corriente sináptica (función alfa) de
 *    la descarga Ia. Registro intracelular: PEPS o PEPS + PA.
 *  · Cronograma: L = d/v + t_sinapsis + t_placa (la latencia la da el dominio).
 *  · EMG del cuádriceps (Hermite–Rodríguez) y sacudida del músculo.
 */
import {
  HH, crearCable, nodoEn, estimuloSoma, pasoCable, integrarHH, type TrazaHH,
} from './neuro';

// ═════════════════════════════ FORMA DEL PA PROPAGADO ═════════════════════════════

export interface FormaPA {
  /** τ inicial (ms, relativo al cruce de −20 mV) y paso */
  tau0: number; dtau: number;
  V: Float32Array;
  /** densidades de corriente en el nodo, mA/cm² (I_Na < 0: entra) */
  INa: Float32Array; IK: Float32Array;
  /** pico de |I_Na| y de I_K, para normalizar */
  picoNa: number; picoK: number;
}

let formaCache: FormaPA | null = null;
/**
 * PA propagado tal como lo ve un nodo de la fibra Aα sana (12 µm, mielínica, 18,5 °C):
 * V(τ), I_Na(τ) e I_K(τ) para τ ∈ [−0,4, 4] ms (τ = 0 en el cruce de −20 mV).
 */
export function formaPA(): FormaPA {
  if (formaCache) return formaCache;
  const c = crearCable({ tipo: 'mielinica', D: 12, largo: 12, conSoma: false });
  const iN = nodoEn(c, 6);
  const amp = estimuloSoma(c);
  const dt = 0.002;
  const reg: { t: number; V: number; INa: number; IK: number }[] = [];
  const A = c.area[iN]; // cm²
  while (c.t < 6) {
    pasoCable(c, dt, (t) => (t >= 0.1 && t < 0.2 ? amp : 0));
    reg.push({ t: c.t, V: c.V[iN], INa: c.INa[iN] / A / 1000, IK: c.IK[iN] / A / 1000 });
  }
  const t0 = c.tCruce[iN];
  const tau0 = -0.4, dtau = 0.01, n = Math.round((4 - tau0) / dtau) + 1;
  const V = new Float32Array(n), INa = new Float32Array(n), IK = new Float32Array(n);
  let picoNa = 0, picoK = 0;
  for (let j = 0; j < n; j++) {
    const t = t0 + tau0 + j * dtau;
    const k = Math.min(reg.length - 2, Math.max(0, Math.floor((t - reg[0].t) / dt)));
    const f = Math.min(1, Math.max(0, (t - reg[k].t) / dt));
    V[j] = reg[k].V + (reg[k + 1].V - reg[k].V) * f;
    INa[j] = reg[k].INa + (reg[k + 1].INa - reg[k].INa) * f;
    IK[j] = reg[k].IK + (reg[k + 1].IK - reg[k].IK) * f;
    picoNa = Math.max(picoNa, -INa[j]); picoK = Math.max(picoK, IK[j]);
  }
  formaCache = { tau0, dtau, V, INa, IK, picoNa, picoK };
  return formaCache;
}

/** Valor de la forma del PA en τ (ms desde el cruce): antes, reposo; después, la cola. */
export function muestraPA(f: FormaPA, tau: number): { V: number; INa: number; IK: number } {
  const u = (tau - f.tau0) / f.dtau;
  if (u <= 0) return { V: HH.Vreposo, INa: 0, IK: 0 };
  const n = f.V.length;
  if (u >= n - 1) return { V: f.V[n - 1], INa: f.INa[n - 1], IK: f.IK[n - 1] };
  const k = Math.floor(u), r = u - k;
  return { V: f.V[k] + (f.V[k + 1] - f.V[k]) * r, INa: f.INa[k] + (f.INa[k + 1] - f.INa[k]) * r, IK: f.IK[k] + (f.IK[k + 1] - f.IK[k]) * r };
}

// ═════════════════════════════ MOTONEURONA α (PEPS → PA) ═════════════════════════════

/** Retardo de liberación del transmisor (ms) desde que la descarga Ia llega al botón. */
export const RETARDO_LIBERACION = 0.3;
/** Constante de tiempo de la corriente sináptica (función alfa), ms. */
export const TAU_SINAPSIS = 0.1;

/** Corriente sináptica alfa (µA/cm²) con pico A en s = TAU_SINAPSIS. */
export const corrienteSinaptica = (A: number, s: number) => (s <= 0 ? 0 : A * (s / TAU_SINAPSIS) * Math.exp(1 - s / TAU_SINAPSIS));

/** Instante (ms) en que la traza cruza −20 mV subiendo, o Infinity. */
export function cruceSubida(tr: TrazaHH, umbral = -20): number {
  for (let i = 1; i < tr.V.length; i++) {
    if (tr.V[i - 1] < umbral && tr.V[i] >= umbral) return tr.t[i - 1] + (tr.t[i] - tr.t[i - 1]) * ((umbral - tr.V[i - 1]) / (tr.V[i] - tr.V[i - 1]));
  }
  return Infinity;
}

const calibMN = new Map<number, { Ath: number; Asupra: number }>();
/**
 * A_th: la corriente sináptica mínima que hace disparar a la motoneurona. A_supra: la de
 * la descarga Ia de un golpe por encima del umbral del reflejo, la que lleva la
 * motoneurona a −20 mV justo al final del retardo central.
 */
export function calibrarMotoneurona(retardoCentral: number) {
  const c0 = calibMN.get(retardoCentral);
  if (c0) return c0;
  const cruce = (A: number) => cruceSubida(integrarHH({ tFin: 6, dt: 0.002, estimulo: (t) => corrienteSinaptica(A, t - 0.5) })) - 0.5;
  let lo = 0, hi = 10;
  while (!Number.isFinite(cruce(hi))) hi *= 2;
  while (hi - lo > 1e-4 * hi) { const m = (lo + hi) / 2; if (Number.isFinite(cruce(m))) hi = m; else lo = m; }
  const Ath = hi;
  const objetivo = retardoCentral - RETARDO_LIBERACION;
  let a = Ath * 1.001, b = Ath * 60;
  for (let i = 0; i < 50; i++) { const m = (a + b) / 2; if (cruce(m) > objetivo) a = m; else b = m; }
  const r = { Ath, Asupra: (a + b) / 2 };
  calibMN.set(retardoCentral, r);
  return r;
}

/** Amplitud de la corriente sináptica de un golpe: por debajo del umbral nunca pasa del 66 % de A_th. */
export function amplitudSinaptica(supra: boolean, fuerza: number, retardoCentral: number): number {
  const { Ath, Asupra } = calibrarMotoneurona(retardoCentral);
  return supra ? Asupra : Ath * (0.3 + 0.36 * Math.min(1, Math.max(0, fuerza) / 35));
}

export type RegistroMN = TrazaHH;
/**
 * Registro intracelular de la motoneurona en un golpe (t = 0 cuando la descarga Ia llega
 * a los botones; la traza va de −0,5 a 5 ms). Por debajo del umbral del reflejo: un PEPS
 * que crece con la fuerza sin acercarse nunca al umbral (no delata dónde está); por
 * encima: el PA, que cruza −20 mV al final del retardo central.
 */
export function registroMotoneurona(supra: boolean, fuerza: number, retardoCentral: number): RegistroMN {
  const A = amplitudSinaptica(supra, fuerza, retardoCentral);
  const t0 = -0.5;
  const tr = integrarHH({ tFin: 5.5, dt: 0.002, estimulo: (t) => corrienteSinaptica(A, t + t0 - RETARDO_LIBERACION) });
  for (let i = 0; i < tr.t.length; i++) tr.t[i] += t0;
  return tr;
}

// ═════════════════════════════ CRONOGRAMA, EMG Y SACUDIDA ═════════════════════════════

export interface Cronograma {
  /** latencia golpe → EMG (ms) */
  L: number;
  /** conducción total d/v (ms) */
  conduccion: number;
  /** llegada de la descarga Ia a los botones de la médula (ms) */
  llegadaMedula: number;
  /** disparo de la motoneurona (ms) */
  disparoMN: number;
  /** llegada del PA motor a la placa (ms) */
  llegadaPlaca: number;
  /** respuesta muscular (EMG) = L */
  respuesta: number;
}

/**
 * Tiempos del arco a partir de la latencia L del dominio, L = d/v + t_sinapsis + t_placa,
 * con la conducción repartida a partes iguales entre la vía aferente Ia y la eferente α
 * (los dos tramos del recorrido miden lo mismo).
 */
export function cronograma(L: number, tSinapsis: number, tPlaca: number): Cronograma {
  const conduccion = Math.max(0, L - tSinapsis - tPlaca);
  const llegadaMedula = conduccion / 2;
  const disparoMN = llegadaMedula + tSinapsis;
  const llegadaPlaca = disparoMN + conduccion / 2;
  return { L, conduccion, llegadaMedula, disparoMN, llegadaPlaca, respuesta: llegadaPlaca + tPlaca };
}

/** Ruido determinista en [−1, 1] para el instante t (ms), cuantizado a 0,05 ms. */
function ruido(t: number, s: number) {
  const k = Math.floor(t * 20) + s * 7919;
  const x = Math.sin(k * 12.9898 + s * 78.233) * 43758.5453;
  return 2 * (x - Math.floor(x)) - 1;
}

/** Unidades motoras del EMG: [retraso respecto a L (ms), ancho (ms), amplitud (mV), orden HR]. */
const UNIDADES: readonly (readonly [number, number, number, 1 | 2])[] = [
  [0.0, 1.5, 1.0, 1], [0.35, 1.8, 0.85, 2], [0.6, 1.4, 0.7, 1], [0.9, 2.0, 0.9, 2], [1.2, 1.6, 0.6, 1],
  [1.5, 2.2, 0.75, 2], [1.9, 1.7, 0.5, 1], [2.3, 2.0, 0.45, 2], [2.8, 1.9, 0.35, 1],
];

/**
 * EMG de superficie del cuádriceps (mV): ruido de base (±25 µV), artefacto mecánico del
 * golpe y, si hay respuesta, la suma de potenciales de unidad motora con funciones de
 * Hermite–Rodríguez (Lo Conte et al., 1994) de orden 1 (bifásico) y 2 (trifásico),
 * escalonados por la dispersión de las velocidades de las fibras. La primera unidad
 * despega del ruido en t = L (el flanco visible empieza 2,2 semianchos antes de su centro).
 */
export function emg(t: number, L: number | null, semilla = 1): number {
  let v = 0.025 * ruido(t, semilla);
  if (t >= 0 && t < 4) v += 0.22 * Math.sin(t * 6.3) * Math.exp(-t * 1.4) * (1 - Math.exp(-t * 8)); // artefacto del martillo
  if (L === null) return v;
  for (const [o, w, a, orden] of UNIDADES) {
    const sw = w * 0.5;
    const c = L + o + 2.2 * sw;
    const x = (t - c) / sw;
    if (Math.abs(x) > 2.2) continue;
    const g = Math.exp(-x * x);
    v += orden === 1 ? -2.9 * a * x * g : 2.0 * a * (1 - 2 * x * x) * g;
  }
  return v;
}

/** Ventana del EMG (ms) según la latencia que hay que ver: la menor de 40/80/160/250 que deja 18 ms tras ella. */
export function ventanaEMG(latencia: number | null): number {
  const necesario = (latencia ?? 0) + 18;
  for (const v of [40, 80, 160, 250]) if (necesario <= v) return v;
  return 250;
}

/** Tiempo de contracción del cuádriceps (ms) para la sacudida. */
export const T_CONTRACCION = 70;
/** Sacudida del cuádriceps (0–1): función alfa con tiempo de contracción T_c tras 2 ms de acoplamiento. */
export function sacudida(t: number, L: number | null): number {
  if (L === null) return 0;
  const s = t - L - 2;
  if (s <= 0) return 0;
  return (s / T_CONTRACCION) * Math.exp(1 - s / T_CONTRACCION);
}
