/**
 * bio07/banco.ts — el BANCO DE LA NEURONA en vivo (módulo puro, sin three).
 *
 * Una motoneurona α con su axón de 10 mm (cable HH de neuro.ts): pulso de corriente en
 * el soma por la pipeta A, registro en un nodo por la pipeta B. Guarda el barrido del
 * osciloscopio (disparado por el estímulo) y mide la velocidad entre el primer nodo y
 * el de la pipeta B. La escena (color de la membrana, iones) y el dock (trazas, v) leen
 * ESTE objeto en el mismo cuadro: un solo reloj (t, ms de modelo).
 */
import {
  HH, FIBRA, SOMA, AXON, TERMINAL, T_LAB, crearCable, pasoCable, reposoCable, nodoEn, lambdaReposo,
  type Cable, type ParamFibra, type TipoFibra,
} from './neuro';

export interface ConfigBanco {
  tipo: TipoFibra;
  /** diámetro de la fibra, µm */
  D: number;
  /** amplitud del pulso de estímulo en el soma, nA */
  estimulo: number;
  /** segundo pulso igual a los `doble` ms (0 = sin segundo pulso) */
  doble: number;
}

/** Longitud de axón dibujada y simulada, mm. */
export const LARGO_BANCO = 10;
/** Duración del pulso de estímulo, ms. */
export const DUR_ESTIMULO = 0.2;
/** Muestreo de la traza del banco, ms. */
export const PASO_TRAZA = 0.005;
/** Diámetros ofrecidos, µm. */
export const DIAMETROS = [2, 4, 8, 12, 16] as const;

/**
 * Velocidad (m/s) que dan las leyes de escala ancladas a las medidas del cable (las
 * comprueba la prueba): amielínica 0,609·√D; mielínica 2,40·D; desmielinizada 1,17·D.
 */
export const V_REF = { mielinica: 2.405, desmielinizada: 1.172, amielinica: 0.6095 } as const;
export function velocidadEsperada(tipo: TipoFibra, D: number): number {
  return tipo === 'amielinica' ? V_REF.amielinica * Math.sqrt(D) : V_REF[tipo] * D;
}

/**
 * Cable del banco: como crearCable, pero la membrana continua no pasa de `maxComp`
 * compartimentos (λ/40 si cabe; si no, largo/maxComp: error de v < 3 %).
 */
export function crearCableBanco(param: ParamFibra, maxComp = 420): Cable {
  if (param.tipo !== 'amielinica') return crearCable(param);
  const lam = lambdaReposo(param.D, param.Ri ?? FIBRA.Ri) * 1e4; // µm
  const dx = Math.max(lam / 40, (param.largo * 1000) / maxComp);
  return crearCableDx(param, dx);
}

/** Cable con membrana continua troceada a `dx` µm (soma + cono + axón + terminal). */
function crearCableDx(param: ParamFibra, dx: number): Cable {
  const p: Required<ParamFibra> = { Ri: FIBRA.Ri, T: T_LAB, conSoma: true, ...param };
  const cabeza = crearCable({ ...p, tipo: 'amielinica', largo: 0.0001 });
  const nCab = p.conSoma ? 5 : 0;
  const nAx = Math.ceil((p.largo * 1000) / dx);
  const n = nCab + nAx + 3;
  const cm = 1e-4;
  const c: Cable = {
    ...cabeza, param: p, n,
    tipo: new Uint8Array(n), x: new Float64Array(n), area: new Float64Array(n), cap: new Float64Array(n),
    k: new Float64Array(n), gPas: new Float64Array(n), gAx: new Float64Array(n - 1),
    V: new Float64Array(n), m: new Float64Array(n), h: new Float64Array(n), n_: new Float64Array(n),
    INa: new Float64Array(n), IK: new Float64Array(n), qNa: new Float64Array(n), tCruce: new Float64Array(n).fill(-1),
    nodos: [], internodos: [],
    a: new Float64Array(n), b: new Float64Array(n), cc: new Float64Array(n), d: new Float64Array(n),
  };
  const diam: number[] = [], len: number[] = [];
  for (let i = 0; i < nCab; i++) {
    c.tipo[i] = cabeza.tipo[i]; c.x[i] = cabeza.x[i]; c.area[i] = cabeza.area[i]; c.cap[i] = cabeza.cap[i]; c.k[i] = cabeza.k[i];
    const l = i === 0 ? FIBRA.soma : FIBRA.cono / 4;
    len.push(l);
    diam.push(i === 0 ? FIBRA.soma : cabeza.area[i] / (Math.PI * l * cm) / cm);
  }
  const x0 = nCab ? FIBRA.cono : 0;
  for (let j = 0; j < nAx + 3; j++) {
    const i = nCab + j;
    const ax = j < nAx;
    const l = ax ? dx : 10;
    const xc = ax ? x0 + (j + 0.5) * dx : x0 + nAx * dx + (j - nAx + 0.5) * 10;
    c.tipo[i] = ax ? AXON : TERMINAL; c.x[i] = xc / 1000;
    c.area[i] = Math.PI * p.D * cm * l * cm; c.cap[i] = HH.C * c.area[i]; c.k[i] = ax ? 1 : FIBRA.kNodo;
    diam.push(p.D); len.push(l);
    if (ax) c.nodos.push(i);
  }
  const medio = (i: number) => (c.tipo[i] === SOMA ? 0 : (p.Ri * (len[i] * cm / 2)) / (Math.PI * (diam[i] * cm / 2) ** 2));
  for (let i = 0; i < n - 1; i++) c.gAx[i] = 1000 / (medio(i) + medio(i + 1));
  reposoCable(c);
  return c;
}

const cacheUmbral = new Map<string, number>();
/**
 * Umbral (nA) del pulso de DUR_ESTIMULO en el soma, con el mismo cable, el mismo paso
 * (2 µs) y el mismo criterio que el banco («el soma pasa de 0 mV»): bisección al 0,5 %.
 */
export function umbralBanco(tipo: TipoFibra, D: number): number {
  const clave = `${tipo}:${D}`;
  const c0 = cacheUmbral.get(clave);
  if (c0 !== undefined) return c0;
  const c = crearCableBanco({ tipo, D, largo: LARGO_BANCO });
  const prueba = (nA: number) => {
    reposoCable(c);
    let max = -100;
    while (c.t < 1.6) {
      pasoCable(c, 0.002, (t) => (t > 0.1 && t <= 0.1 + DUR_ESTIMULO ? nA * 1e-3 : 0));
      if (c.V[0] > max) max = c.V[0];
      if (max > 0) return true;
    }
    return false;
  };
  let lo = 0, hi = 2;
  while (!prueba(hi)) hi *= 2;
  while (hi - lo > 0.005 * hi) { const m = (lo + hi) / 2; if (prueba(m)) hi = m; else lo = m; }
  cacheUmbral.set(clave, hi);
  return hi;
}

/** Carga (nC) que mueve un PA completo en un compartimento: ≈ 1,6 veces C·ΔV con ΔV = 100 mV (solapamiento de I_Na e I_K). */
const cargaRef = (c: Cable, i: number) => 1.6 * c.cap[i] * 100 * 1e-3;

/**
 * El banco. `t` del cable = reloj único (ms de modelo). La pipeta A estimula y registra
 * en el soma; la pipeta B registra en el nodo (o el punto de membrana) al 85 % del axón.
 */
export class BancoNeurona {
  cfg: ConfigBanco;
  cable!: Cable;
  /** índice del compartimento bajo la pipeta B y del primer nodo */
  iB = 0;
  iN1 = 0;
  /** inicio del barrido en curso (ms de modelo; −1 = ninguno) y su duración */
  t0Barrido = -1;
  durBarrido = 3;
  /** traza del barrido: V y densidades de corriente del soma (pipeta A, mA/cm²) y V del nodo B */
  readonly capacidad = 4000;
  VA = new Float32Array(this.capacidad);
  VB = new Float32Array(this.capacidad);
  INaA = new Float32Array(this.capacidad);
  IKA = new Float32Array(this.capacidad);
  muestras = 0;
  /** instantes de los pulsos del barrido (relativos a t0Barrido) */
  pulsos: number[] = [];
  /** umbral del soma (nA) para el pulso de DUR_ESTIMULO */
  umbral = 1;
  /** carga de K⁺ que salió en el barrido (nC) por compartimento */
  qK = new Float64Array(0);
  /** carga de referencia de un PA por compartimento (nC), para las partículas */
  qRef = new Float64Array(0);
  /** velocidad medida en el barrido (m/s) o null */
  vMedida: number | null = null;
  /** ¿disparó el soma? ¿llegó el PA al terminal? (ms de modelo o −1) */
  disparos = 0;
  llegadaTerminal = -1;
  /** cuántas veces ha cambiado la fibra (la escena rehace la geometría) */
  versionFibra = 0;

  constructor(cfg: ConfigBanco) {
    this.cfg = { ...cfg };
    this.rehacer();
  }

  private rehacer() {
    const c = crearCableBanco({ tipo: this.cfg.tipo, D: this.cfg.D, largo: LARGO_BANCO });
    this.cable = c;
    this.iB = nodoEn(c, LARGO_BANCO * 0.85);
    this.iN1 = c.nodos[0];
    this.umbral = umbralBanco(this.cfg.tipo, this.cfg.D);
    this.qK = new Float64Array(c.n);
    this.qRef = new Float64Array(c.n);
    for (let i = 0; i < c.n; i++) this.qRef[i] = c.k[i] > 0 ? cargaRef(c, i) : 1;
    this.t0Barrido = -1; this.muestras = 0; this.pulsos = []; this.vMedida = null; this.disparos = 0; this.llegadaTerminal = -1;
    this.durBarrido = this.duracionBarrido();
    this.versionFibra++;
  }

  /** Lo que dura el barrido: hasta que el PA llega al terminal y repolariza, o el segundo pulso. */
  private duracionBarrido() {
    const v = velocidadEsperada(this.cfg.tipo, this.cfg.D);
    const llegada = 0.4 + LARGO_BANCO / v;
    return Math.min(19, Math.max(2.5, llegada + 1.4, (this.cfg.doble || 0) + 2.4));
  }

  /** Cambia la fibra (rehace el cable) o sólo el estímulo. */
  configurar(cfg: Partial<ConfigBanco>) {
    const antes = this.cfg;
    this.cfg = { ...this.cfg, ...cfg };
    if (this.cfg.tipo !== antes.tipo || this.cfg.D !== antes.D) this.rehacer();
    else this.durBarrido = this.duracionBarrido();
  }

  /** Empieza un barrido: pulso ya (y el segundo, si toca). */
  estimular() {
    const c = this.cable;
    this.t0Barrido = c.t;
    this.pulsos = [0.1];
    if (this.cfg.doble > 0) this.pulsos.push(0.1 + this.cfg.doble);
    this.durBarrido = this.duracionBarrido();
    this.muestras = 0;
    c.qNa.fill(0); this.qK.fill(0); c.tCruce.fill(-1);
    this.vMedida = null; this.disparos = 0; this.llegadaTerminal = -1;
  }

  /** Corriente inyectada en el soma (µA) en el instante t (del final del paso). */
  private readonly iny = (t: number) => {
    if (this.t0Barrido < 0) return 0;
    const s = t - this.t0Barrido;
    let I = 0;
    for (const p of this.pulsos) if (s > p && s <= p + DUR_ESTIMULO) I += this.cfg.estimulo * 1e-3; // nA → µA
    return I;
  };

  /**
   * ¿Pasa algo rápido? Densidad de I_Na por unidad de densidad de canales (µA/cm²) en el
   * punto más activo, o un pulso en curso. Por encima de ≈ 5 conviene la cámara lenta.
   */
  actividad(): number {
    const c = this.cable;
    let a = -c.INa[0] / c.area[0];
    for (const i of c.nodos) { const dens = -c.INa[i] / (c.area[i] * Math.max(1, c.k[i])); if (dens > a) a = dens; }
    const s = c.t - this.t0Barrido;
    if (this.t0Barrido >= 0 && this.pulsos.some((p) => s >= p - 0.03 && s < p + DUR_ESTIMULO + 0.03)) a = Math.max(a, 50);
    return a;
  }

  /** Avanza `ms` de modelo con pasos ≤ dtMax (implícito: estable con cualquier paso). */
  avanzar(ms: number, dtMax = 0.002) {
    const c = this.cable;
    let resto = ms;
    while (resto > 1e-9) {
      const dt = Math.min(dtMax, resto);
      const vSomaAntes = c.V[0];
      pasoCable(c, dt, this.iny);
      for (let i = 0; i < c.n; i++) if (c.IK[i] > 0) this.qK[i] += c.IK[i] * dt;
      if (vSomaAntes < 0 && c.V[0] >= 0) this.disparos++;
      resto -= dt;
      this.registrar();
    }
  }

  private registrar() {
    const c = this.cable;
    if (this.t0Barrido < 0) return;
    const s = c.t - this.t0Barrido;
    while (this.muestras < this.capacidad && this.muestras * PASO_TRAZA <= Math.min(s, this.durBarrido)) {
      const k = this.muestras++;
      this.VA[k] = c.V[0];
      this.VB[k] = c.V[this.iB];
      const A = c.area[0];
      this.INaA[k] = c.INa[0] / A / 1000;
      this.IKA[k] = c.IK[0] / A / 1000;
    }
    const tB = c.tCruce[this.iB], t1 = c.tCruce[this.iN1];
    if (this.vMedida === null && tB > 0 && t1 > 0 && tB > t1) this.vMedida = (c.x[this.iB] - c.x[this.iN1]) / (tB - t1);
    const iT = c.n - 1;
    if (this.llegadaTerminal < 0 && c.tCruce[iT] > 0) this.llegadaTerminal = c.tCruce[iT];
  }

  /** ¿Terminó el barrido? */
  get barridoTerminado() { return this.t0Barrido >= 0 && this.cable.t - this.t0Barrido > this.durBarrido; }
  /** ¿El cable volvió al reposo? (todo dentro de ±1,5 mV de −65) */
  get enReposo() { const V = this.cable.V; for (let i = 0; i < V.length; i++) if (Math.abs(V[i] - HH.Vreposo) > 1.5) return false; return true; }
}
