/**
 * bio07/neuro.ts — la física del lab de sistema nervioso (módulo PURO, sin three).
 *
 * 1. Membrana de HODGKIN–HUXLEY (1952) con la convención moderna (reposo −65 mV):
 *      C·dV/dt = I_est − g_Na·m³h·(V − E_Na) − g_K·n⁴·(V − E_K) − g_L·(V − E_L)
 *    con las tasas α/β originales y el factor de temperatura φ = 3^((T − 6,3)/10).
 *    Se usa a 18,5 °C, la temperatura con la que Hodgkin y Huxley calcularon su
 *    potencial de acción propagado (18,8 m/s; medido 21,2 m/s). A 37 °C el modelo
 *    del calamar deja de disparar (bloqueo por calor): se declara en la ficha.
 *
 * 2. CABLE (ecuación del cable discretizada, método de Hines): compartimentos con
 *    membrana HH unidos por la resistencia axial R_i. Tres fibras:
 *      · amielínica: membrana HH continua → v ∝ √d;
 *      · mielínica: nodos de Ranvier HH (densidad de canales ×κ) e internodos
 *        pasivos cubiertos por N lamelas (C y G divididas por 2N) → conducción
 *        saltatoria, v ∝ D (internodo ≈ 100·D);
 *      · desmielinizada: la misma fibra con un tercio de las lamelas.
 *    Integración: Rush–Larsen para m, h, n y Euler implícito para V (incondicionalmente
 *    estable), como hace NEURON.
 *
 * 3. MOTONEURONA α (un compartimento HH) excitada por la corriente sináptica de la
 *    descarga Ia (función alfa): PEPS subumbral o potencial de acción.
 *
 * 4. CRONOGRAMA del arco reflejo y EMG del cuádriceps a partir de la latencia que da
 *    el dominio (src/domain/biologia.ts): L = d/v + t_sinapsis + t_placa.
 *
 * Unidades: mV, ms, µA, µF, mS, cm (internas); µm y m/s en las interfaces.
 */

// ═════════════════════════════ 1. HODGKIN–HUXLEY ═════════════════════════════

export const HH = {
  C: 1,          // µF/cm²
  gNa: 120,      // mS/cm²
  gK: 36,
  gL: 0.3,
  ENa: 50,       // mV
  EK: -77,
  EL: -54.387,   // así el reposo queda en −65 mV
  Vreposo: -65,
} as const;

/** Temperatura de trabajo del lab (°C): la del cálculo de propagación de HH (1952). */
export const T_LAB = 18.5;

/** Factor de temperatura de las cinéticas: φ = 3^((T − 6,3)/10). */
export const phiT = (T: number) => Math.pow(3, (T - 6.3) / 10);

/** x/(eˣ − 1) sin singularidad en x = 0. */
const vtrap = (x: number) => (Math.abs(x) < 1e-6 ? 1 - x / 2 : x / Math.expm1(x));

/** Tasas (ms⁻¹) a 6,3 °C con u = V + 65 (despolarización desde el reposo). */
export function tasas(V: number) {
  const u = V + 65;
  return {
    am: vtrap((25 - u) / 10),               // 0,1·(25 − u)/(e^((25−u)/10) − 1)
    bm: 4 * Math.exp(-u / 18),
    ah: 0.07 * Math.exp(-u / 20),
    bh: 1 / (Math.exp((30 - u) / 10) + 1),
    an: 0.1 * vtrap((10 - u) / 10),         // 0,01·(10 − u)/(e^((10−u)/10) − 1)
    bn: 0.125 * Math.exp(-u / 80),
  };
}

/** Compuertas en el estado estacionario de V. */
export function compuertasInf(V: number) {
  const r = tasas(V);
  return { m: r.am / (r.am + r.bm), h: r.ah / (r.ah + r.bh), n: r.an / (r.an + r.bn) };
}

/** Corrientes iónicas (µA/cm², positivas hacia fuera) con densidad ×k. */
export function corrientes(V: number, m: number, h: number, n: number, k = 1) {
  const INa = k * HH.gNa * m * m * m * h * (V - HH.ENa);
  const IK = k * HH.gK * n * n * n * n * (V - HH.EK);
  const IL = k * HH.gL * (V - HH.EL);
  return { INa, IK, IL };
}

/** Avance exacto (Rush–Larsen) de una compuerta con α, β constantes durante dt. */
const avanzaCompuerta = (x: number, a: number, b: number, dt: number) => {
  const s = a + b;
  const inf = a / s;
  return inf + (x - inf) * Math.exp(-dt * s);
};

/** Estímulo rectangular: amplitud en µA/cm² (membrana aislada) o µA (cable). */
export interface Pulso { t: number; dur: number; amp: number }
const corrienteDe = (pulsos: readonly Pulso[], t: number) => {
  let I = 0;
  for (const p of pulsos) if (t >= p.t && t < p.t + p.dur) I += p.amp;
  return I;
};

export interface TrazaHH {
  dt: number;
  t: Float64Array;
  V: Float64Array;
  INa: Float64Array;
  IK: Float64Array;
  m: Float64Array;
  h: Float64Array;
  n: Float64Array;
}

/**
 * Membrana aislada (space clamp) de HH: RK4 con paso dt (ms). `estimulo(t)` en µA/cm².
 * Devuelve la traza muestreada en cada paso.
 */
export function integrarHH(opts: {
  tFin: number; dt?: number; T?: number; estimulo: (t: number) => number; V0?: number;
}): TrazaHH {
  const dt = opts.dt ?? 0.005;
  const phi = phiT(opts.T ?? T_LAB);
  const N = Math.round(opts.tFin / dt) + 1;
  const out: TrazaHH = {
    dt, t: new Float64Array(N), V: new Float64Array(N), INa: new Float64Array(N), IK: new Float64Array(N),
    m: new Float64Array(N), h: new Float64Array(N), n: new Float64Array(N),
  };
  let V = opts.V0 ?? HH.Vreposo;
  let { m, h, n } = compuertasInf(V);
  const f = (t: number, y: [number, number, number, number]): [number, number, number, number] => {
    const [v, mm, hh, nn] = y;
    const r = tasas(v);
    const { INa, IK, IL } = corrientes(v, mm, hh, nn);
    return [
      (opts.estimulo(t) - INa - IK - IL) / HH.C,
      phi * (r.am * (1 - mm) - r.bm * mm),
      phi * (r.ah * (1 - hh) - r.bh * hh),
      phi * (r.an * (1 - nn) - r.bn * nn),
    ];
  };
  for (let i = 0; i < N; i++) {
    const t = i * dt;
    const c = corrientes(V, m, h, n);
    out.t[i] = t; out.V[i] = V; out.INa[i] = c.INa; out.IK[i] = c.IK; out.m[i] = m; out.h[i] = h; out.n[i] = n;
    const y: [number, number, number, number] = [V, m, h, n];
    const k1 = f(t, y);
    const k2 = f(t + dt / 2, y.map((v, j) => v + (dt / 2) * k1[j]) as typeof y);
    const k3 = f(t + dt / 2, y.map((v, j) => v + (dt / 2) * k2[j]) as typeof y);
    const k4 = f(t + dt, y.map((v, j) => v + dt * k3[j]) as typeof y);
    V += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    m += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    h += (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    n += (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
  }
  return out;
}

/** Máximo de un tramo de la traza (valor e índice). */
export function maximo(a: ArrayLike<number>, i0 = 0, i1 = a.length) {
  let v = -Infinity, k = i0;
  for (let i = i0; i < i1; i++) if (a[i] > v) { v = a[i]; k = i; }
  return { v, k };
}

/** ¿Dispara? Un PA de HH cruza 0 mV; un potencial local no pasa de ≈ −50 mV. */
export const disparo = (tr: TrazaHH, i0 = 0, i1 = tr.V.length) => maximo(tr.V, i0, i1).v > 0;

/**
 * Umbral de corriente (µA/cm²) de un pulso rectangular de duración `dur` (ms) por
 * bisección sobre «¿cruza 0 mV?». Precisión relativa 1e-4.
 */
export function umbralPulso(dur: number, T = T_LAB): number {
  const prueba = (amp: number) => disparo(integrarHH({ tFin: dur + 8, T, estimulo: (t) => (t >= 1 && t < 1 + dur ? amp : 0) }));
  let lo = 0, hi = 5;
  while (!prueba(hi)) hi *= 2;
  while (hi - lo > 1e-4 * hi) { const m = (lo + hi) / 2; if (prueba(m)) hi = m; else lo = m; }
  return hi;
}

// ═════════════════════════════ 2. CABLE ═════════════════════════════

export type TipoFibra = 'mielinica' | 'desmielinizada' | 'amielinica';

export interface ParamFibra {
  tipo: TipoFibra;
  /** diámetro externo de la fibra, µm (con mielina; sin mielina es el del axón) */
  D: number;
  /** longitud del tramo de axón simulado, mm */
  largo: number;
  /** resistividad del axoplasma, Ω·cm */
  Ri?: number;
  T?: number;
  /** con soma y cono de motoneurona (por defecto) o axón desnudo estimulado por un extremo */
  conSoma?: boolean;
}

/** Tipos de compartimento del cable. */
export const SOMA = 0, CONO = 1, NODO = 2, INTERNODO = 3, AXON = 4, TERMINAL = 5;

/** Geometría y parámetros de la fibra del banco (se citan en la ficha). */
export const FIBRA = {
  /** relación g = d_axón / D (Rushton; 0,6–0,7 en fibras periféricas) */
  g: 0.7,
  /** internodo = 100·D (Hursh 1939, Rushton 1951) */
  internodoPorD: 100,
  /** longitud del nodo de Ranvier, µm */
  nodo: 1,
  /** lamelas de mielina por µm de espesor (periodo ≈ 16 nm → 62 por µm) */
  lamelasPorUm: 62,
  /** fracción de lamelas que conserva la fibra desmielinizada */
  fraccionDesmielinizada: 1 / 3,
  /** densidad de canales del nodo y del cono respecto a la membrana del calamar */
  kNodo: 20,
  /** conductancia de fuga de cada membrana de la vaina (mS/cm²) */
  gLamela: 1,
  /** resistividad del axoplasma de mamífero, Ω·cm */
  Ri: 70,
  /** soma de la motoneurona α: diámetro, µm */
  soma: 50,
  /** cono axónico + segmento inicial: longitud, µm */
  cono: 40,
} as const;

/** Un compartimento del cable. */
interface Comp { tipo: number; x: number; len: number; diam: number; area: number; c: number; k: number; gPas: number }

export interface Cable {
  param: Required<ParamFibra>;
  n: number;
  tipo: Uint8Array;
  /** posición del centro de cada compartimento a lo largo del axón, mm (0 = unión soma–cono) */
  x: Float64Array;
  area: Float64Array; // cm²
  cap: Float64Array;  // µF
  k: Float64Array;    // densidad HH (0 = pasivo)
  gPas: Float64Array; // mS (pasivos)
  gAx: Float64Array;  // mS, entre i e i+1
  V: Float64Array;
  m: Float64Array; h: Float64Array; n_: Float64Array;
  /** corrientes del último paso, µA (positivas hacia fuera) */
  INa: Float64Array; IK: Float64Array;
  /** carga de Na⁺ que entró en el último PA por compartimento (nC), para las partículas */
  qNa: Float64Array;
  /** instante en que cada compartimento cruzó −20 mV subiendo (ms; −1 = aún no) */
  tCruce: Float64Array;
  t: number;
  phi: number;
  /** índices de los nodos (o de los compartimentos de membrana activa a lo largo del axón) */
  nodos: number[];
  /** escala de la vaina por internodo, para la geometría */
  internodos: { x0: number; x1: number }[];
  // trabajo del algoritmo de Thomas
  a: Float64Array; b: Float64Array; cc: Float64Array; d: Float64Array;
}

/** Número de lamelas de la vaina para la fibra (0 si no tiene). */
export function lamelas(p: Pick<ParamFibra, 'tipo' | 'D'>): number {
  if (p.tipo === 'amielinica') return 0;
  const espesor = (p.D * (1 - FIBRA.g)) / 2; // µm
  const N = Math.round(espesor * FIBRA.lamelasPorUm);
  return p.tipo === 'desmielinizada' ? Math.max(1, Math.round(N * FIBRA.fraccionDesmielinizada)) : N;
}

/**
 * Construye el cable: soma → cono/segmento inicial → axón (nodos + internodos, o
 * membrana continua) → terminal. Compartimentos de ≤ 20 µm en la membrana activa y
 * 10 por internodo.
 */
export function crearCable(param: ParamFibra): Cable {
  const p: Required<ParamFibra> = { Ri: FIBRA.Ri, T: T_LAB, conSoma: true, ...param };
  const comps: Comp[] = [];
  const cm = 1e-4; // µm → cm
  const dAx = p.tipo === 'amielinica' ? p.D : p.D * FIBRA.g; // µm
  const membrana = (tipo: number, x: number, len: number, diam: number, k: number): Comp => {
    const area = Math.PI * diam * cm * len * cm;
    return { tipo, x, len, diam, area, c: HH.C * area, k, gPas: 0 };
  };
  if (p.conSoma) {
    // soma (esfera) en x = −r
    const rs = FIBRA.soma / 2;
    const aSoma = 4 * Math.PI * (rs * cm) ** 2;
    comps.push({ tipo: SOMA, x: -rs / 1000, len: FIBRA.soma, diam: FIBRA.soma, area: aSoma, c: HH.C * aSoma, k: 1, gPas: 0 });
    // cono axónico y segmento inicial (densidad de nodo), 4 compartimentos que adelgazan
    const nCono = 4;
    for (let i = 0; i < nCono; i++) {
      const len = FIBRA.cono / nCono;
      const diam = dAx + (12 - dAx) * (1 - (i + 0.5) / nCono) * 0.6;
      comps.push(membrana(CONO, ((i + 0.5) * len) / 1000, len, Math.max(dAx, diam), FIBRA.kNodo));
    }
  }
  const x0 = p.conSoma ? FIBRA.cono : 0; // µm
  const largoUm = p.largo * 1000;
  const internodos: { x0: number; x1: number }[] = [];
  if (p.tipo === 'amielinica') {
    // λ/40 por compartimento: la discretización escala con λ ∝ √d (error de v < 0,5 %)
    const dx = Math.min(100, lambdaReposo(dAx, p.Ri) * 1e4 / 40); // µm
    const n = Math.ceil(largoUm / dx);
    for (let i = 0; i < n; i++) comps.push(membrana(AXON, (x0 + (i + 0.5) * dx) / 1000, dx, dAx, 1));
  } else {
    const Lint = FIBRA.internodoPorD * p.D; // µm
    const N = lamelas(p);
    const nInt = Math.max(1, Math.floor(largoUm / (Lint + FIBRA.nodo)));
    let x = x0;
    for (let j = 0; j < nInt; j++) {
      // nodo de Ranvier y, detrás, el internodo: 10 compartimentos pasivos bajo la vaina
      comps.push(membrana(NODO, (x + FIBRA.nodo / 2) / 1000, FIBRA.nodo, dAx, FIBRA.kNodo));
      x += FIBRA.nodo;
      const sub = 10;
      const ini = x;
      for (let i = 0; i < sub; i++) {
        const len = Lint / sub;
        const c = membrana(INTERNODO, (x + len / 2) / 1000, len, dAx, 0);
        c.c = (HH.C / (2 * N)) * c.area;           // 2N membranas en serie
        c.gPas = (FIBRA.gLamela / (2 * N)) * c.area;
        comps.push(c);
        x += len;
      }
      internodos.push({ x0: ini / 1000, x1: x / 1000 });
    }
    // último nodo antes del terminal
    comps.push(membrana(NODO, (x + FIBRA.nodo / 2) / 1000, FIBRA.nodo, dAx, FIBRA.kNodo));
  }
  // terminal (sin mielina, densidad de nodo): 3 compartimentos y extremo sellado
  const xT = comps[comps.length - 1].x * 1000 + comps[comps.length - 1].len / 2;
  for (let i = 0; i < 3; i++) comps.push(membrana(TERMINAL, (xT + (i + 0.5) * 10) / 1000, 10, dAx, FIBRA.kNodo));

  const n = comps.length;
  const c: Cable = {
    param: p, n,
    tipo: new Uint8Array(n), x: new Float64Array(n), area: new Float64Array(n), cap: new Float64Array(n),
    k: new Float64Array(n), gPas: new Float64Array(n), gAx: new Float64Array(Math.max(0, n - 1)),
    V: new Float64Array(n), m: new Float64Array(n), h: new Float64Array(n), n_: new Float64Array(n),
    INa: new Float64Array(n), IK: new Float64Array(n), qNa: new Float64Array(n), tCruce: new Float64Array(n).fill(-1),
    t: 0, phi: phiT(p.T), nodos: [], internodos,
    a: new Float64Array(n), b: new Float64Array(n), cc: new Float64Array(n), d: new Float64Array(n),
  };
  const ini = compuertasInf(HH.Vreposo);
  for (let i = 0; i < n; i++) {
    const q = comps[i];
    c.tipo[i] = q.tipo; c.x[i] = q.x; c.area[i] = q.area; c.cap[i] = q.c; c.k[i] = q.k; c.gPas[i] = q.gPas;
    c.V[i] = HH.Vreposo; c.m[i] = ini.m; c.h[i] = ini.h; c.n_[i] = ini.n;
    if (q.tipo === NODO || q.tipo === AXON) c.nodos.push(i);
  }
  // resistencia axial entre centros: R_i·(ℓ/2)/(π r²) a cada lado (el soma se trata como un nudo)
  const Rmedio = (q: Comp) => (q.tipo === SOMA ? 0 : (p.Ri * (q.len * cm / 2)) / (Math.PI * (q.diam * cm / 2) ** 2));
  for (let i = 0; i < n - 1; i++) {
    const R = Rmedio(comps[i]) + Rmedio(comps[i + 1]); // Ω
    c.gAx[i] = 1000 / R; // mS
  }
  // los internodos en reposo exacto: la fuga de la vaina va a −65 mV (E de la vaina = reposo)
  return c;
}

/** Corriente inyectada en el soma (µA) en el instante t. */
export type Inyeccion = (t: number) => number;

/**
 * Un paso de dt (ms): Rush–Larsen para las compuertas y Euler implícito para V
 * (sistema tridiagonal resuelto con Thomas).
 */
export function pasoCable(c: Cable, dt: number, inyeccion: Inyeccion) {
  const { n, V, m, h, n_: nn, k, cap, gPas, gAx, a, b, cc, d, phi } = c;
  const tNuevo = c.t + dt;
  for (let i = 0; i < n; i++) {
    let gEff = gPas[i], IE = gPas[i] * HH.Vreposo; // fuga de la vaina hacia el reposo
    if (k[i] > 0) {
      const r = tasas(V[i]);
      m[i] = avanzaCompuerta(m[i], phi * r.am, phi * r.bm, dt);
      h[i] = avanzaCompuerta(h[i], phi * r.ah, phi * r.bh, dt);
      nn[i] = avanzaCompuerta(nn[i], phi * r.an, phi * r.bn, dt);
      const A = c.area[i] * k[i];
      const gNa = HH.gNa * m[i] ** 3 * h[i] * A, gK = HH.gK * nn[i] ** 4 * A, gL = HH.gL * A;
      gEff += gNa + gK + gL;
      IE += gNa * HH.ENa + gK * HH.EK + gL * HH.EL;
    }
    // C/dt·(V' − V) = IE − gEff·V' + Σ g_ax (V'_j − V'_i) + I_iny
    b[i] = cap[i] / dt + gEff;
    d[i] = (cap[i] / dt) * V[i] + IE + (i === 0 ? inyeccion(tNuevo) : 0);
    a[i] = 0; cc[i] = 0;
  }
  for (let i = 0; i < n - 1; i++) {
    const g = gAx[i];
    b[i] += g; b[i + 1] += g;
    cc[i] = -g; a[i + 1] = -g;
  }
  // Thomas
  for (let i = 1; i < n; i++) {
    const w = a[i] / b[i - 1];
    b[i] -= w * cc[i - 1];
    d[i] -= w * d[i - 1];
  }
  const Vant = c.d; // reutilizamos d para la solución
  Vant[n - 1] = d[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; i--) Vant[i] = (d[i] - cc[i] * Vant[i + 1]) / b[i];
  for (let i = 0; i < n; i++) {
    const vPrev = V[i];
    V[i] = Vant[i];
    if (k[i] > 0) {
      const A = c.area[i] * k[i];
      c.INa[i] = HH.gNa * m[i] ** 3 * h[i] * A * (V[i] - HH.ENa);
      c.IK[i] = HH.gK * nn[i] ** 4 * A * (V[i] - HH.EK);
      if (c.INa[i] < 0) c.qNa[i] += -c.INa[i] * dt; // µA·ms = nC
    } else { c.INa[i] = 0; c.IK[i] = 0; }
    if (vPrev < -20 && V[i] >= -20) c.tCruce[i] = tNuevo - dt * ((V[i] + 20) / Math.max(1e-9, V[i] - vPrev));
  }
  c.t = tNuevo;
}

/** Devuelve el cable al reposo (y borra cruces y cargas). */
export function reposoCable(c: Cable) {
  const ini = compuertasInf(HH.Vreposo);
  c.V.fill(HH.Vreposo); c.m.fill(ini.m); c.h.fill(ini.h); c.n_.fill(ini.n);
  c.INa.fill(0); c.IK.fill(0); c.qNa.fill(0); c.tCruce.fill(-1); c.t = 0;
}

/** Índice del compartimento activo (nodo o membrana) más cercano a x (mm). */
export function nodoEn(c: Cable, x: number): number {
  let mejor = c.nodos[0], dmin = Infinity;
  for (const i of c.nodos) { const dd = Math.abs(c.x[i] - x); if (dd < dmin) { dmin = dd; mejor = i; } }
  return mejor;
}

/**
 * Velocidad de conducción (m/s) medida como en el laboratorio: dos electrodos al 30 %
 * y al 80 % del axón; v = Δx/Δt entre sus cruces de −20 mV. Estímulo: pulso de 0,1 ms
 * en el soma, 3 veces el necesario para disparar con holgura.
 */
export function medirVelocidad(param: ParamFibra, dt = 0.001): { v: number; dx: number; dtCruce: number; bloqueo: boolean } {
  const c = crearCable(param);
  const iA = nodoEn(c, param.largo * 0.3), iB = nodoEn(c, param.largo * 0.8);
  const amp = estimuloSoma(c);
  const tMax = 2 + (param.largo / 0.5) * 1.2 + 4; // de sobra hasta para 0,5 m/s
  while (c.t < tMax && c.tCruce[iB] < 0) pasoCable(c, dt, (t) => (t >= 0.2 && t < 0.3 ? amp : 0));
  if (c.tCruce[iA] < 0 || c.tCruce[iB] < 0) return { v: 0, dx: c.x[iB] - c.x[iA], dtCruce: Infinity, bloqueo: true };
  const dx = c.x[iB] - c.x[iA]; // mm
  const dtc = c.tCruce[iB] - c.tCruce[iA]; // ms
  return { v: dx / dtc, dx, dtCruce: dtc, bloqueo: false }; // mm/ms = m/s
}

/**
 * Corriente (µA) de un pulso de 0,1 ms en el compartimento 0 que dispara con holgura:
 * con soma, ≈ 3 veces la carga C·15 mV del soma; sin soma, la de una longitud λ de
 * axón llevada a +30 mV (λ = √(d·R_m/(4·R_i)), R_m de reposo ≈ 1,5 kΩ·cm²).
 */
export function estimuloSoma(c: Pick<Cable, 'area' | 'tipo' | 'param'>): number {
  if (c.tipo[0] === SOMA) return (3 * HH.C * c.area[0] * 15) / 0.1;
  const p = c.param;
  const dAx = (p.tipo === 'amielinica' ? p.D : p.D * FIBRA.g) * 1e-4; // cm
  return (2 * Math.PI * dAx * lambdaReposo(p.tipo === 'amielinica' ? p.D : p.D * FIBRA.g, p.Ri) * HH.C * 30) / 0.1;
}

/** Constante de espacio en reposo (cm) de un axón desnudo de diámetro d (µm): λ = √(d·R_m/(4·R_i)). */
export function lambdaReposo(dUm: number, Ri: number): number {
  const ini = compuertasInf(HH.Vreposo);
  const g = HH.gL + HH.gK * ini.n ** 4 + HH.gNa * ini.m ** 3 * ini.h; // mS/cm²
  const Rm = 1000 / g; // Ω·cm²
  return Math.sqrt((dUm * 1e-4 * Rm) / (4 * Ri));
}
