/**
 * qmi10/columna.ts — LA FÍSICA de la columna de platos (módulo puro: sin three ni React).
 *
 * La columna del lab: 5 platos de campanas de burbujeo (numerados desde ARRIBA), alimentación
 * en el plato 3, condensador total con divisor de reflujo arriba y un hervidor (balón con manta)
 * abajo, que es una etapa de equilibrio más. 5 platos + hervidor = 6 etapas.
 *
 *  · EQUILIBRIO LÍQUIDO–VAPOR
 *      - Hexano–heptano: mezcla ideal (ley de Raoult). Presiones de vapor de Antoine; la
 *        curva y*(x) usa la VOLATILIDAD RELATIVA constante α = media geométrica de α en los dos
 *        puntos de ebullición (2,47): y = αx / (1 + (α − 1)x). Las temperaturas de burbuja y de
 *        rocío salen de Raoult con Antoine, exactas.
 *      - Etanol–agua: NO es ideal (azeótropo en x = 0,894). Se usan los MISMOS datos
 *        experimentales (Carey y Lewis, Perry) que el validador del dominio (`@/domain/quimica`).
 *  · FLUJOS (derrame molar constante, alimentación líquida saturada q = 1):
 *      V̄ = Q/λ (el calor del hervidor), V = V̄ + (1 − q)F, D = V/(R + 1), L = R·D,
 *      L̄ = L + qF, B = F − D. A reflujo total no entra ni sale nada: L = V.
 *  · McCABE–THIELE: rectas de operación y_{n+1} = R/(R+1)·x_n + x_D/(R+1) (rectificación) e
 *      y_{n+1} = (L̄/V̄)·x_n − B·x_B/V̄ (agotamiento); la recta q (vertical en x = z si q = 1).
 *      `regimen()` resuelve la columna REAL (6 etapas fijas): busca x_D tal que la escalera
 *      escalonada desde arriba caiga en la x_B que exige el balance F·z = D·x_D + B·x_B.
 *  · Fenske (etapas mínimas a reflujo total), Underwood (reflujo mínimo) y el reflujo mínimo
 *      geométrico (pellizco: la recta de operación toca la curva de equilibrio).
 *  · DINÁMICA DE PLATOS (`ColumnaDinamica`): balance de cada etapa con su retención,
 *      M·dx/dt = entra − sale, integrado con RK4. Su estado estacionario ES la escalera de
 *      McCabe–Thiele (se prueba con jest); con ella el color de los platos viaja cuando el
 *      alumno cambia el reflujo o el calor.
 *  · RETO: el perfil de la columna del reto sale del modelo del dominio sin tocarlo
 *      (`composicionDestilado` con N_ef = `etapasEfectivas(tasa)`).
 */
import {
  yEquilibrio, tBurbuja as tBurbujaEtanolAgua, composicionDestilado, etapasEfectivas, fraccionMolarDesdeVolumenes,
} from '@/domain/quimica';

// ───────────────────────────── la columna ─────────────────────────────

/** Platos reales de campana de burbujeo (desde arriba). */
export const N_PLATOS = 5;
/** Plato de alimentación (desde arriba). */
export const PLATO_ALIMENTACION = 3;
/** Etapas de equilibrio de la columna: los platos y el hervidor. */
export const ETAPAS = N_PLATOS + 1;
/** Presión de trabajo (mmHg): la columna está abierta a la atmósfera por el condensador. */
export const P_MMHG = 760;
/** Alimentación líquida saturada (precalentada a su punto de burbuja). */
export const Q_ALIMENTACION = 1;
/** Manta de 1 L: potencia útil del hervidor (W). */
export const Q_MIN = 80;
export const Q_MAX = 300;
/** Divisor de reflujo: R = t_retorno / t_toma. */
export const R_MIN = 1;
export const R_MAX = 15;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// ───────────────────────────── Antoine (mmHg, °C) ─────────────────────────────

export interface Antoine { A: number; B: number; C: number }
/** Lange's Handbook (Dean): n-hexano (−25 a 92 °C) y n-heptano (−2 a 124 °C). */
export const ANTOINE: Record<'hexano' | 'heptano', Antoine> = {
  hexano: { A: 6.87601, B: 1171.17, C: 224.41 },
  heptano: { A: 6.89677, B: 1264.9, C: 216.544 },
};
/** Presión de vapor (mmHg) a T (°C). */
export const presionVapor = (c: Antoine, T: number) => 10 ** (c.A - c.B / (T + c.C));
/** Temperatura (°C) a la que la presión de vapor vale P (mmHg). */
export const tSaturacion = (c: Antoine, P = P_MMHG) => c.B / (c.A - Math.log10(P)) - c.C;

/** Raíz de una función monótona en [a, b] por bisección (60 iteraciones: el ulp de double). */
function biseccion(f: (t: number) => number, a: number, b: number, iter = 64): number {
  let fa = f(a);
  for (let i = 0; i < iter; i++) {
    const m = 0.5 * (a + b);
    const fm = f(m);
    if ((fm > 0) === (fa > 0)) { a = m; fa = fm; } else b = m;
    if (b - a < 1e-13) break;
  }
  return 0.5 * (a + b);
}

/** Temperatura de burbuja de Raoult: x·P₁(T) + (1 − x)·P₂(T) = P. */
export function tBurbujaRaoult(x: number, l: Antoine, p: Antoine, P = P_MMHG): number {
  const a = tSaturacion(l, P) - 1, b = tSaturacion(p, P) + 1;
  return biseccion((T) => x * presionVapor(l, T) + (1 - x) * presionVapor(p, T) - P, a, b);
}
/** Temperatura de rocío de Raoult: y·P/P₁(T) + (1 − y)·P/P₂(T) = 1. */
export function tRocioRaoult(y: number, l: Antoine, p: Antoine, P = P_MMHG): number {
  const a = tSaturacion(l, P) - 1, b = tSaturacion(p, P) + 1;
  return biseccion((T) => 1 - (y * P / presionVapor(l, T) + (1 - y) * P / presionVapor(p, T)), a, b);
}
/** y de Raoult exacta (con la α de la temperatura de burbuja): sólo para medir la simplificación. */
export function yRaoult(x: number, l: Antoine, p: Antoine, P = P_MMHG): number {
  const T = tBurbujaRaoult(x, l, p, P);
  return (x * presionVapor(l, T)) / P;
}

/** α de Raoult a una temperatura: P₁/P₂. */
export const alfaRaoult = (T: number, l: Antoine, p: Antoine) => presionVapor(l, T) / presionVapor(p, T);
/** α constante del lab: media geométrica de α en los dos puntos de ebullición normales. */
export const ALFA_HEXANO_HEPTANO = Math.sqrt(
  alfaRaoult(tSaturacion(ANTOINE.hexano), ANTOINE.hexano, ANTOINE.heptano) * alfaRaoult(tSaturacion(ANTOINE.heptano), ANTOINE.hexano, ANTOINE.heptano),
);

/** Curva de equilibrio de volatilidad relativa constante. */
export const yAlfa = (x: number, alfa: number) => (alfa * x) / (1 + (alfa - 1) * x);
/** Su inversa: x = y / (α − (α − 1)y). */
export const xAlfa = (y: number, alfa: number) => y / (alfa - (alfa - 1) * y);

// ───────────────────────────── mezclas ─────────────────────────────

export type IdMezcla = 'hexanoHeptano' | 'etanolAgua';

export interface Mezcla {
  id: IdMezcla;
  nombre: string;
  ligero: string;
  pesado: string;
  /** y*(x): fracción molar del ligero en el vapor en equilibrio */
  yEq: (x: number) => number;
  /** x*(y): la inversa */
  xEq: (y: number) => number;
  tBurbuja: (x: number) => number;
  tRocio: (y: number) => number;
  /** α constante (sólo la mezcla ideal) */
  alfa: number | null;
  /** composición del azeótropo (si lo hay): la columna no lo cruza */
  azeotropo: number | null;
  /** calor latente molar para el derrame molar constante (J/mol) */
  lambda: number;
  /** volúmenes molares a 20 °C (mL/mol): ligero, pesado */
  vMolar: [number, number];
  /** alimentación (mol/h) y su composición */
  F: number;
  z: number;
  /** retenciones de líquido (mL) en la cabeza, en cada plato y en el hervidor */
  retencion: { cabeza: number; plato: number; hervidor: number };
}

/** Azeótropo etanol–agua a 1 atm (último punto de la tabla del dominio). */
export const AZEOTROPO_ETANOL = 0.8943;

/** x*(y) del etanol–agua invirtiendo la tabla del dominio (monótona hasta el azeótropo). */
function xEqEtanolAgua(y: number): number {
  if (y <= 0) return 0;
  if (y >= AZEOTROPO_ETANOL) return AZEOTROPO_ETANOL;
  return biseccion((x) => yEquilibrio(x) - y, 0, AZEOTROPO_ETANOL);
}

/** Retenciones (mL): cabeza del divisor, líquido de un plato DN80 (π·4²·1,2 cm³) y el hervidor. */
const RETENCION = { cabeza: 12, plato: 60, hervidor: 450 };

export const MEZCLAS: Record<IdMezcla, Mezcla> = {
  hexanoHeptano: {
    id: 'hexanoHeptano', nombre: 'Hexano–heptano', ligero: 'hexano', pesado: 'heptano',
    yEq: (x) => yAlfa(clamp01(x), ALFA_HEXANO_HEPTANO),
    xEq: (y) => xAlfa(clamp01(y), ALFA_HEXANO_HEPTANO),
    tBurbuja: (x) => tBurbujaRaoult(clamp01(x), ANTOINE.hexano, ANTOINE.heptano),
    tRocio: (y) => tRocioRaoult(clamp01(y), ANTOINE.hexano, ANTOINE.heptano),
    alfa: ALFA_HEXANO_HEPTANO, azeotropo: null,
    // ΔH_vap en el punto de ebullición: 28,85 y 31,77 kJ/mol (NIST)
    lambda: 30300,
    // 86,18 g/mol ÷ 0,6548 g/mL y 100,20 ÷ 0,6837
    vMolar: [131.6, 146.6],
    F: 24, z: 0.45,
    retencion: RETENCION,
  },
  etanolAgua: {
    id: 'etanolAgua', nombre: 'Etanol–agua', ligero: 'etanol', pesado: 'agua',
    yEq: (x) => yEquilibrio(clamp01(x)),
    xEq: (y) => xEqEtanolAgua(y),
    tBurbuja: (x) => tBurbujaEtanolAgua(clamp01(x)),
    // el vapor y está en equilibrio con el líquido x*(y): comparten temperatura en la tabla
    tRocio: (y) => tBurbujaEtanolAgua(xEqEtanolAgua(y)),
    alfa: null, azeotropo: AZEOTROPO_ETANOL,
    // ΔH_vap: etanol 38,56 y agua 40,65 kJ/mol; con 40 kJ/mol el derrame molar es casi constante
    lambda: 40000,
    // los mismos del dominio: 46,07/0,789 y 18,015/0,998
    vMolar: [58.39, 18.05],
    F: 50, z: 0.15,
    retencion: RETENCION,
  },
};
export const MEZCLAS_LISTA: IdMezcla[] = ['hexanoHeptano', 'etanolAgua'];

/** Volumen molar de la mezcla líquida (mL/mol), mezcla ideal. */
export const volumenMolar = (m: Mezcla, x: number) => x * m.vMolar[0] + (1 - x) * m.vMolar[1];

// ───────────────────────────── flujos ─────────────────────────────

export interface Operacion {
  /** relación de reflujo L/D (con `total` se ignora) */
  R: number;
  /** calor del hervidor (W) */
  Q: number;
  /** reflujo total: no entra alimentación ni sale producto */
  total: boolean;
}

/** Flujos molares (mol/h) con derrame molar constante. */
export interface Flujos { F: number; D: number; B: number; L: number; V: number; Lb: number; Vb: number }

export function flujos(m: Mezcla, op: Operacion): Flujos {
  const Vb = (op.Q * 3600) / m.lambda;
  if (op.total) return { F: 0, D: 0, B: 0, L: Vb, V: Vb, Lb: Vb, Vb };
  const q = Q_ALIMENTACION;
  const V = Vb + (1 - q) * m.F;
  const D = V / (op.R + 1);
  const L = V - D;
  const Lb = L + q * m.F;
  const B = m.F - D;
  return { F: m.F, D, B, L, V, Lb, Vb };
}

// ───────────────────────────── rectas de McCabe–Thiele ─────────────────────────────

export interface Recta { m: number; b: number }
/** Rectificación: pendiente R/(R+1) y ordenada x_D/(R+1); pasa por (x_D, x_D). */
export const rectaRectificacion = (R: number, xD: number): Recta => ({ m: R / (R + 1), b: xD / (R + 1) });
/** Agotamiento: pendiente L̄/V̄; pasa por (x_B, x_B). */
export const rectaAgotamiento = (f: Flujos, xB: number): Recta => ({ m: f.Lb / f.Vb, b: (-f.B * xB) / f.Vb });
export const enRecta = (r: Recta, x: number) => r.m * x + r.b;
/** Punto de corte de las dos rectas (sobre la recta q). */
export function corteRectas(a: Recta, b: Recta): [number, number] {
  const x = (b.b - a.b) / (a.m - b.m);
  return [x, enRecta(a, x)];
}

// ───────────────────────────── la columna en régimen ─────────────────────────────

export interface Regimen {
  flujos: Flujos;
  xD: number;
  xB: number;
  /** líquido que sale de cada plato (1..N, índice 0 = plato 1) */
  x: number[];
  /** vapor que sale de cada plato */
  y: number[];
  /** vapor que sale del hervidor */
  yB: number;
  /** x del hervidor por la escalera menos la del balance (≈ 0) */
  residuo: number;
}

/** Escalera desde arriba con x_D supuesto: composiciones de cada etapa. */
function escalonarColumna(m: Mezcla, fl: Flujos, xD: number, xB: number, N: number, f: number) {
  const x: number[] = [], y: number[] = [];
  let yv = xD; // condensador total: el vapor del plato 1 tiene la composición del destilado
  for (let n = 1; n <= N; n++) {
    y.push(yv);
    const xn = m.xEq(clamp01(yv));
    x.push(xn);
    yv = n < f ? (fl.L * xn + fl.D * xD) / fl.V : (fl.Lb * xn - fl.B * xB) / fl.Vb;
  }
  const yB = yv;
  const xR = m.xEq(clamp01(yB));
  return { x, y, yB, xR };
}

/**
 * La columna real (N platos + hervidor) en régimen permanente con alimentación: x_D es la
 * raíz de x_hervidor(x_D) − x_B(x_D) = 0, con x_B = (F·z − D·x_D)/B. La función es creciente
 * en x_D: bisección en el intervalo que deja x_B entre 0 y 1.
 */
export function regimen(m: Mezcla, op: Operacion, N = N_PLATOS, f = PLATO_ALIMENTACION): Regimen {
  if (op.total) throw new Error('regimen(): a reflujo total el perfil depende del inventario; usa regimenTotal()');
  const fl = flujos(m, op);
  const { F, D, B } = fl;
  const z = m.z;
  const xBde = (xD: number) => (F * z - D * xD) / B;
  let lo = Math.max(0, (F * z - B) / D), hi = Math.min(1, (F * z) / D);
  if (m.azeotropo !== null) hi = Math.min(hi, m.azeotropo);
  const res = (xD: number) => escalonarColumna(m, fl, xD, xBde(xD), N, f).xR - xBde(xD);
  let rlo = res(lo);
  for (let i = 0; i < 200 && hi - lo > 1e-15; i++) {
    const mid = 0.5 * (lo + hi);
    const r = res(mid);
    if ((r > 0) === (rlo > 0)) { lo = mid; rlo = r; } else hi = mid;
  }
  const xD = 0.5 * (lo + hi);
  const xB = xBde(xD);
  const e = escalonarColumna(m, fl, xD, xB, N, f);
  return { flujos: fl, xD, xB, x: e.x, y: e.y, yB: e.yB, residuo: e.xR - xB };
}

/**
 * Reflujo total (columna cerrada): las rectas se funden con la diagonal (y_{n+1} = x_n) y el
 * perfil lo fija el inventario de ligero Σ Mᵢ·xᵢ (mol), que la dinámica conserva.
 */
export function regimenTotal(m: Mezcla, Q: number, retenciones: Float64Array | number[], inventario: number, N = N_PLATOS) {
  const fl = flujos(m, { R: Infinity, Q, total: true });
  const perfil = (xD: number) => {
    const x: number[] = [], y: number[] = [];
    let yv = xD;
    for (let n = 1; n <= N; n++) { y.push(yv); const xn = m.xEq(clamp01(yv)); x.push(xn); yv = xn; }
    const xB = m.xEq(clamp01(yv));
    let I = retenciones[0] * xD + retenciones[N + 1] * xB;
    for (let n = 1; n <= N; n++) I += retenciones[n] * x[n - 1];
    return { x, y, xB, yB: yv, I };
  };
  const hi0 = m.azeotropo ?? 1;
  const xD = biseccion((v) => perfil(v).I - inventario, 0, hi0, 200);
  const p = perfil(xD);
  return { flujos: fl, xD, xB: p.xB, x: p.x, y: p.y, yB: p.yB };
}

// ───────────────────────────── Fenske, Underwood y el pellizco ─────────────────────────────

/** Etapas mínimas (reflujo total, α constante): ln[(x_D/(1−x_D))·((1−x_B)/x_B)] / ln α. */
export const fenske = (xD: number, xB: number, alfa: number) => Math.log((xD * (1 - xB)) / ((1 - xD) * xB)) / Math.log(alfa);

/**
 * Underwood para una mezcla binaria: θ entre 1 y α tal que α·z/(α − θ) + (1 − z)/(1 − θ) = 1 − q,
 * y R_min + 1 = α·x_D/(α − θ) + (1 − x_D)/(1 − θ).
 */
export function underwood(alfa: number, z: number, xD: number, q = Q_ALIMENTACION): { theta: number; Rmin: number } {
  const g = (t: number) => (alfa * z) / (alfa - t) + (1 - z) / (1 - t) - (1 - q);
  // g es creciente entre los polos 1 y α
  const eps = 1e-12 * alfa;
  const theta = biseccion(g, 1 + eps, alfa - eps, 200);
  const Rmin = (alfa * xD) / (alfa - theta) + (1 - xD) / (1 - theta) - 1;
  return { theta, Rmin };
}

/**
 * Reflujo mínimo geométrico (q = 1): la pendiente mínima de la recta de rectificación que no
 * corta la curva de equilibrio entre x = z y x_D, s = máx (x_D − y*(x))/(x_D − x), y
 * R_min = s/(1 − s). En una mezcla ideal el máximo está en x = z (pellizco en la recta q);
 * en el etanol–agua puede ser un pellizco TANGENTE cerca del azeótropo.
 */
export function reflujoMinimo(m: Mezcla, xD: number, z: number): { Rmin: number; xPellizco: number } {
  const g = (x: number) => (xD - m.yEq(x)) / (xD - x);
  let best = g(z), xb = z;
  const n = 4000;
  for (let i = 1; i < n; i++) {
    const x = z + ((xD - z) * i) / n;
    if (xD - x < 1e-9) break;
    const v = g(x);
    if (v > best) { best = v; xb = x; }
  }
  // refinado por sección áurea alrededor del mejor (si no está en el borde)
  if (xb > z) {
    let a = Math.max(z, xb - (xD - z) / n), b = Math.min(xD - 1e-9, xb + (xD - z) / n);
    const k = (Math.sqrt(5) - 1) / 2;
    for (let i = 0; i < 80; i++) {
      const c = b - k * (b - a), d = a + k * (b - a);
      if (g(c) > g(d)) b = d; else a = c;
    }
    const xm = 0.5 * (a + b);
    if (g(xm) > best) { best = g(xm); xb = xm; }
  }
  return { Rmin: best / (1 - best), xPellizco: xb };
}

// ───────────────────────────── escalera de diseño ─────────────────────────────

export interface Escalera {
  /** vértices de la escalera: (x_D, x_D), (x₁, y₁), (x₁, y₂), (x₂, y₂)… */
  vertices: [number, number][];
  /** etapas teóricas (la última, fraccionaria por interpolación lineal en x) */
  etapas: number;
  /** etapa en la que se cambia de recta (la de alimentación óptima) */
  alimentacion: number;
}

/**
 * Escalera de McCabe–Thiele para separar x_D / x_B con reflujo R y alimentación de
 * composición z (q = 1): cambia a la recta de agotamiento al pasar el corte de las rectas
 * (alimentación óptima). `total` = reflujo total (la diagonal). Si un pellizco la detiene,
 * devuelve `etapas = Infinity`.
 */
export function escalera(m: Mezcla, xD: number, xB: number, R: number, z: number, total = false, maxEtapas = 400): Escalera {
  const rec = rectaRectificacion(R, xD);
  // la recta de agotamiento pasa por (x_B, x_B) y por el corte con la recta q (x = z)
  const yq = enRecta(rec, z);
  const ago: Recta = { m: (yq - xB) / (z - xB), b: xB - ((yq - xB) / (z - xB)) * xB };
  const v: [number, number][] = [[xD, xD]];
  let y = xD, xPrev = xD, alim = 0;
  for (let n = 1; n <= maxEtapas; n++) {
    const x = m.xEq(clamp01(y));
    v.push([x, y]);
    if (x <= xB + 1e-15) {
      const frac = (xPrev - xB) / (xPrev - x);
      return { vertices: v, etapas: n - 1 + frac, alimentacion: alim || n };
    }
    if (Math.abs(x - xPrev) < 1e-13) break; // pellizco: la escalera ya no avanza
    let yn: number;
    if (total) yn = x;
    else if (x > z) yn = enRecta(rec, x);
    else { if (!alim) alim = n; yn = enRecta(ago, x); }
    v.push([x, yn]);
    xPrev = x;
    y = yn;
  }
  return { vertices: v, etapas: Infinity, alimentacion: alim };
}

// ───────────────────────────── dinámica de platos ─────────────────────────────

/**
 * La columna con retención de líquido en cada etapa (índice 0 = cabeza: condensado del
 * divisor; 1..N = platos; N + 1 = hervidor), derrame molar constante y etapas ideales.
 * Retenciones fijas en mol (las de la composición de régimen al montar la mezcla).
 */
export class ColumnaDinamica {
  readonly N: number;
  readonly f: number;
  m: Mezcla;
  op: Operacion;
  fl: Flujos;
  x: Float64Array;
  M: Float64Array;
  /** tiempo simulado (s) */
  t = 0;
  private k: Float64Array[];
  private tmp: Float64Array;
  private yv: Float64Array;
  private hMax = 1;

  constructor(m: Mezcla, op: Operacion, N = N_PLATOS, f = PLATO_ALIMENTACION) {
    this.N = N; this.f = f;
    this.m = m; this.op = { ...op };
    this.fl = flujos(m, op);
    const n = N + 2;
    this.x = new Float64Array(n);
    this.M = new Float64Array(n);
    this.k = [0, 1, 2, 3].map(() => new Float64Array(n));
    this.tmp = new Float64Array(n);
    this.yv = new Float64Array(n);
    this.montar(m, op);
  }

  /** Mezcla nueva: retenciones en mol y la columna ya en régimen. */
  montar(m: Mezcla, op: Operacion) {
    this.m = m;
    const r = regimen(m, { ...op, total: false, R: Number.isFinite(op.R) ? op.R : R_MAX });
    const comp = [r.xD, ...r.x, r.xB];
    const N = this.N;
    for (let i = 0; i < N + 2; i++) {
      const mL = i === 0 ? m.retencion.cabeza : i === N + 1 ? m.retencion.hervidor : m.retencion.plato;
      this.M[i] = mL / volumenMolar(m, comp[i]);
      this.x[i] = comp[i];
    }
    this.t = 0;
    this.ajustar(op);
    if (op.total) this.irARegimen();
  }

  /** Cambia el reflujo o el calor (la columna se va al régimen nuevo con su dinámica). */
  ajustar(op: Operacion) {
    this.op = { ...op };
    this.fl = flujos(this.m, op);
    // paso de integración: un cuarto de la constante de tiempo más corta
    const fs = this.fl, h = 3600;
    const N = this.N;
    let tau = Infinity;
    tau = Math.min(tau, this.M[0] / Math.max(1e-9, fs.V / h));
    for (let n = 1; n <= N; n++) {
      const Lout = n < this.f ? fs.L : fs.Lb, Vout = n <= this.f ? fs.V : fs.Vb;
      tau = Math.min(tau, this.M[n] / Math.max(1e-9, (Lout + Vout * 2) / h));
    }
    tau = Math.min(tau, this.M[N + 1] / Math.max(1e-9, (fs.Vb * 2 + fs.B) / h));
    this.hMax = Math.max(0.01, 0.2 * tau);
  }

  /** Salta al régimen de la operación actual (sin transitorio). */
  irARegimen() {
    const N = this.N;
    if (this.op.total) {
      const r = regimenTotal(this.m, this.op.Q, this.M, this.inventario(), N);
      this.x[0] = r.xD; for (let n = 1; n <= N; n++) this.x[n] = r.x[n - 1]; this.x[N + 1] = r.xB;
      return;
    }
    const r = regimen(this.m, this.op, N, this.f);
    this.x[0] = r.xD; for (let n = 1; n <= N; n++) this.x[n] = r.x[n - 1]; this.x[N + 1] = r.xB;
  }

  /** Moles de ligero retenidos en toda la columna. */
  inventario() {
    let I = 0;
    for (let i = 0; i < this.x.length; i++) I += this.M[i] * this.x[i];
    return I;
  }

  /** dx/dt (1/s) de cada etapa. */
  derivadas(x: Float64Array, dx: Float64Array) {
    const { N, f, M, m } = this;
    const h = 3600;
    const F = this.fl.F / h, D = this.fl.D / h, B = this.fl.B / h, L = this.fl.L / h, V = this.fl.V / h, Lb = this.fl.Lb / h, Vb = this.fl.Vb / h;
    const z = m.z;
    const yv = this.yv;
    for (let i = 1; i <= N + 1; i++) yv[i] = m.yEq(x[i]);
    // cabeza: entra el vapor del plato 1, sale el condensado (reflujo + destilado)
    dx[0] = (V * (yv[1] - x[0])) / M[0];
    for (let n = 1; n <= N; n++) {
      const Lin = n <= f ? L : Lb;
      const Lout = n < f ? L : Lb;
      const Vin = n < f ? V : Vb;
      const Vout = n <= f ? V : Vb;
      const xin = x[n - 1];
      let ac = Lin * xin + Vin * yv[n + 1] - Lout * x[n] - Vout * yv[n];
      if (n === f) ac += F * z;
      dx[n] = ac / M[n];
    }
    dx[N + 1] = (Lb * x[N] - Vb * yv[N + 1] - B * x[N + 1]) / M[N + 1];
    void D;
  }

  /** Integra `dt` segundos simulados (RK4 con subpasos). */
  integrar(dt: number) {
    let resto = dt;
    const n = this.x.length;
    const [k1, k2, k3, k4] = this.k;
    const s = this.tmp, x = this.x;
    while (resto > 1e-12) {
      const h = Math.min(resto, this.hMax);
      this.derivadas(x, k1);
      for (let i = 0; i < n; i++) s[i] = x[i] + 0.5 * h * k1[i];
      this.derivadas(s, k2);
      for (let i = 0; i < n; i++) s[i] = x[i] + 0.5 * h * k2[i];
      this.derivadas(s, k3);
      for (let i = 0; i < n; i++) s[i] = x[i] + h * k3[i];
      this.derivadas(s, k4);
      for (let i = 0; i < n; i++) x[i] = clamp01(x[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
      resto -= h;
      this.t += h;
    }
  }

  /** Vapor que sale de cada etapa (1..N + 1); y[0] = la del condensado (no hay vapor). */
  vapores(): number[] {
    const out = [this.x[0]];
    for (let i = 1; i < this.x.length; i++) out.push(this.m.yEq(this.x[i]));
    return out;
  }
}

// ───────────────────────────── el reto (modelo del dominio) ─────────────────────────────

export interface PerfilReto {
  /** fracción molar de etanol en el matraz */
  xPot: number;
  /** etapas efectivas del modelo del dominio (matraz incluido) */
  Nef: number;
  /** vapor que llega a la cabeza = composición del destilado que se forma */
  yD: number;
  /** eficiencia global de los 5 platos: (N_ef − 1)/5 */
  eficiencia: number;
  /** líquido y vapor de cada plato (índice 0 = plato 1, el de arriba) */
  x: number[];
  y: number[];
}

/**
 * El perfil de la columna del RETO sin tocar su modelo: el dominio aproxima la columna a
 * reflujo total con N_ef = 1 + 3·e^(−q/1,5) etapas (matraz incluido) y da la composición del
 * vapor tras s etapas, Y(s) = `composicionDestilado(x_matraz, s)` (la última, fraccionaria).
 * Los 5 platos reales reparten las N_ef − 1 etapas de la columna (eficiencia global): el plato
 * k (desde abajo) devuelve vapor Y(1 + k·E) y, a reflujo total, su líquido es el vapor que le
 * llega, Y(1 + (k − 1)·E). Arriba, Y(N_ef) es EXACTAMENTE el destilado del dominio.
 */
export function perfilReto(volEtanol: number, volAgua: number, tasa: number, N = N_PLATOS): PerfilReto {
  const xPot = fraccionMolarDesdeVolumenes(volEtanol, volAgua);
  const Nef = etapasEfectivas(tasa);
  const E = (Nef - 1) / N;
  const x: number[] = [], y: number[] = [];
  // del plato de arriba (k = N) al de abajo (k = 1)
  for (let k = N; k >= 1; k--) {
    y.push(k === N ? composicionDestilado(xPot, Nef) : composicionDestilado(xPot, 1 + k * E));
    x.push(composicionDestilado(xPot, 1 + (k - 1) * E));
  }
  return { xPot, Nef, yD: composicionDestilado(xPot, Nef), eficiencia: E, x, y };
}

// ───────────────────────────── el código de color ─────────────────────────────

type RGB3 = [number, number, number];
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const gam = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function aOklab([r, g, b]: RGB3): RGB3 {
  const R = lin(r), G = lin(g), B = lin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function deOklab([L, a, b]: RGB3): RGB3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [clamp01(gam(R)), clamp01(gam(G)), clamp01(gam(B))];
}
/**
 * Paradas del código, del menos volátil al más volátil: ámbar → oro → verde → azul cielo.
 * Cuatro tonos bien separados (no un beige intermedio): cada plato se distingue del vecino.
 */
const PARADAS: RGB3[] = ([[0.95, 0.45, 0.12], [0.96, 0.78, 0.22], [0.4, 0.84, 0.52], [0.24, 0.68, 0.98]] as RGB3[]).map(aOklab);

/**
 * Color de composición (sRGB 0–1): CÓDIGO, no color real (los dos líquidos son incoloros).
 * x = fracción molar del componente más volátil. Interpolado en OKLab.
 */
export function colorComposicion(x: number): RGB3 {
  const n = PARADAS.length - 1;
  const t = clamp01(x) * n;
  const i = Math.min(n - 1, Math.floor(t)), u = t - i;
  const a = PARADAS[i], b = PARADAS[i + 1];
  return deOklab([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]);
}
/** El mismo color en CSS. */
export function cssComposicion(x: number, alfa = 1): string {
  const [r, g, b] = colorComposicion(x).map((c) => Math.round(c * 255));
  return alfa >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alfa})`;
}
