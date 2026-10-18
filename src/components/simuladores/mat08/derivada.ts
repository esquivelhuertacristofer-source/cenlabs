/**
 * mat08/derivada.ts — LA MATEMÁTICA del lab de la derivada (módulo puro: sin three ni React).
 *
 *  - Las curvas del banco con sus derivadas analíticas f′, f″ y f‴: cuatro de
 *    exploración y la del cohete del reto, que delega en el dominio
 *    (`posicionM8`, `velocidadM8`, `aceleracionM8`: la MISMA función del validador).
 *  - Cocientes incrementales: hacia delante (f(x+h) − f(x))/h y centrado
 *    (f(x+h) − f(x−h))/(2h).
 *  - Error de truncamiento (Taylor): delante ≈ (h/2)·f″(x) → O(h); centrado ≈ (h²/6)·f‴(x)
 *    → O(h²). En doble precisión aparece además el redondeo ≈ ε·|f(x)|/h, que manda
 *    para h pequeño: es la «V» del gráfico log–log del dock.
 *  - Orden de convergencia MEDIDO: pendiente del ajuste por mínimos cuadrados de
 *    log|error| frente a log h en el tramo de truncamiento (10⁻³ ≤ h ≤ 10⁻¹).
 *  - Puntos críticos (f′ = 0, clasificados por el signo de f″) e inflexiones (f″
 *    cambia de signo), por muestreo y bisección.
 */
import { posicionM8, velocidadM8, aceleracionM8, T_MAX_M8, type CoheteM8 } from '@/domain/matematicas';

export type IdFuncion = 'cubica' | 'seno' | 'exponencial' | 'campana';
export type IdCurva = IdFuncion | 'cohete';
export type Metodo = 'adelante' | 'centrada';

export interface Curva {
  id: IdCurva;
  /** nombre corto para el selector */
  nombre: string;
  /** variable independiente: x en la exploración, t (s) en el cohete */
  v: 'x' | 't';
  /** f(x) = … (texto para la barra y el dock) */
  formula: string;
  /** f′(x) = … (en el reto sólo se enseña tras validar) */
  formulaD: string;
  f: (x: number) => number;
  d1: (x: number) => number;
  d2: (x: number) => number;
  d3: (x: number) => number;
  dominio: [number, number];
  /**
   * Rango fijo del panel de f′. En el reto es fijo y NO depende de m: un eje ajustado a
   * v(t) pondría su máximo (la incógnita) en el borde del panel.
   */
  rangoDFijo?: [number, number];
  /** unidades de f y de f′ (vacías en la exploración) */
  uF: string;
  uD: string;
}

// ───────────────────────────── formato ─────────────────────────────

const MENOS = '−';
/** Cifra con coma decimal y signo menos tipográfico. */
export function num(x: number, d = 2): string {
  if (!Number.isFinite(x)) return '—';
  const s = Math.abs(x).toFixed(d).replace('.', ',');
  return (x < 0 && Number(Math.abs(x).toFixed(d)) !== 0 ? MENOS : '') + s;
}

// ───────────────────────────── curvas ─────────────────────────────

export const FUNCIONES: Record<IdFuncion, Curva> = {
  cubica: {
    id: 'cubica', nombre: 'x³/3 − x', v: 'x',
    formula: 'f(x) = x³/3 − x', formulaD: 'f′(x) = x² − 1',
    f: (x) => x ** 3 / 3 - x, d1: (x) => x * x - 1, d2: (x) => 2 * x, d3: () => 2,
    dominio: [-2.5, 2.5], uF: '', uD: '',
  },
  seno: {
    id: 'seno', nombre: 'sen x', v: 'x',
    formula: 'f(x) = sen x', formulaD: 'f′(x) = cos x',
    f: Math.sin, d1: Math.cos, d2: (x) => -Math.sin(x), d3: (x) => -Math.cos(x),
    dominio: [-Math.PI, Math.PI], uF: '', uD: '',
  },
  exponencial: {
    id: 'exponencial', nombre: 'eˣ', v: 'x',
    formula: 'f(x) = eˣ', formulaD: 'f′(x) = eˣ',
    f: Math.exp, d1: Math.exp, d2: Math.exp, d3: Math.exp,
    dominio: [-3, 1.6], uF: '', uD: '',
  },
  campana: {
    id: 'campana', nombre: 'e^(−x²)', v: 'x',
    formula: 'f(x) = e^(−x²)', formulaD: 'f′(x) = −2x·e^(−x²)',
    f: (x) => Math.exp(-x * x),
    d1: (x) => -2 * x * Math.exp(-x * x),
    d2: (x) => (4 * x * x - 2) * Math.exp(-x * x),
    d3: (x) => (-8 * x ** 3 + 12 * x) * Math.exp(-x * x),
    dominio: [-2.5, 2.5], uF: '', uD: '',
  },
};
export const IDS_FUNCION: IdFuncion[] = ['cubica', 'seno', 'exponencial', 'campana'];

/** Rango fijo del panel de v(t) en el reto (cubre todos los cohetes del sorteo, k = 0,1 y 1,2 ≤ m ≤ 1,8). */
export const RANGO_V_RETO: [number, number] = [-8, 12];

/** Coeficiente con coma y sin ceros de más (0,1 · 1,35). */
const coef = (c: number) => String(Number(c.toFixed(4))).replace('.', ',');

/** La curva del reto: s(t) = −k·t³ + m·t² en [0, 10] s (la misma del validador). */
export function curvaCohete(c: CoheteM8): Curva {
  return {
    id: 'cohete', nombre: 'Cohete', v: 't',
    formula: `s(t) = −${coef(c.k)}·t³ + ${coef(c.m)}·t²`,
    formulaD: `v(t) = −${coef(3 * c.k)}·t² + ${coef(2 * c.m)}·t`,
    f: (t) => posicionM8(c, t),
    d1: (t) => velocidadM8(c, t),
    d2: (t) => aceleracionM8(c, t),
    d3: () => -6 * c.k,
    dominio: [0, T_MAX_M8],
    rangoDFijo: RANGO_V_RETO,
    uF: 'm', uD: 'm/s',
  };
}

// ───────────────────────────── cocientes incrementales ─────────────────────────────

/** (f(x+h) − f(x))/h: la pendiente de la secante PQ. Vale también con h < 0. */
export const cocienteAdelante = (f: (x: number) => number, x: number, h: number) => (f(x + h) - f(x)) / h;
/** (f(x+h) − f(x−h))/(2h): la secante simétrica alrededor de x. */
export const cocienteCentrado = (f: (x: number) => number, x: number, h: number) => (f(x + h) - f(x - h)) / (2 * h);

export function cociente(c: Curva, x: number, h: number, m: Metodo): number {
  return m === 'centrada' ? cocienteCentrado(c.f, x, h) : cocienteAdelante(c.f, x, h);
}

/** |cociente − f′(x)|: el error real, con el redondeo de la máquina incluido. */
export function errorDerivada(c: Curva, x: number, h: number, m: Metodo): number {
  return Math.abs(cociente(c, x, h, m) - c.d1(x));
}

/** Término principal del error de truncamiento (Taylor): (h/2)f″ + (h²/6)f‴ delante; (h²/6)f‴ centrado. */
export function errorTaylor(c: Curva, x: number, h: number, m: Metodo): number {
  return m === 'centrada' ? Math.abs((h * h / 6) * c.d3(x)) : Math.abs((h / 2) * c.d2(x) + (h * h / 6) * c.d3(x));
}

/** Pasos h del barrido del gráfico log–log: de 10⁻¹² a 10⁰ cada cuarto de década. */
export const H_BARRIDO: number[] = Array.from({ length: 49 }, (_, i) => 10 ** (-12 + i * 0.25));
/** Filas de la tabla h → pendiente. */
export const H_TABLA = [1, 0.1, 0.01, 0.001, 0.0001] as const;

/** Error en cada h del barrido (los ceros exactos se dejan en 10⁻¹⁷ para el eje logarítmico). */
export function barridoError(c: Curva, x: number, m: Metodo): { h: number; e: number }[] {
  return H_BARRIDO.map((h) => ({ h, e: Math.max(1e-17, errorDerivada(c, x, h, m)) }));
}

/** Pendiente de la recta de mínimos cuadrados de (xs, ys). */
export function pendienteMC(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  return sxy / sxx;
}

/**
 * Orden de convergencia medido: pendiente de log₁₀|error| frente a log₁₀ h entre hMin y
 * hMax (tramo de truncamiento: por debajo de ~10⁻⁵ empieza a mandar el redondeo).
 * null si el error es nulo en el tramo (la fórmula es exacta para esa curva).
 */
export function ordenMedido(c: Curva, x: number, m: Metodo, hMin = 1e-3, hMax = 1e-1, n = 9): number | null {
  const lx: number[] = [], ly: number[] = [];
  for (let i = 0; i < n; i++) {
    const h = hMin * (hMax / hMin) ** (i / (n - 1));
    const e = errorDerivada(c, x, h, m);
    if (!(e > 1e-14)) return null;
    lx.push(Math.log10(h)); ly.push(Math.log10(e));
  }
  return pendienteMC(lx, ly);
}

// ───────────────────────────── puntos notables ─────────────────────────────

/** Ceros de g en (a, b): cambio de signo en una malla fina y bisección (60 pasos). */
export function ceros(g: (x: number) => number, a: number, b: number, n = 600): number[] {
  const out: number[] = [];
  const empuja = (x: number) => { if (!out.some((y) => Math.abs(y - x) < 1e-7 * (b - a))) out.push(x); };
  let x0 = a, g0 = g(a);
  for (let i = 1; i <= n; i++) {
    const x1 = a + ((b - a) * i) / n, g1 = g(x1);
    if (g0 === 0) empuja(x0);
    else if (g1 !== 0 && Math.sign(g0) !== Math.sign(g1)) {
      let lo = x0, hi = x1, glo = g0;
      for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2, gm = g(mid);
        if (gm === 0) { lo = hi = mid; break; }
        if (Math.sign(gm) === Math.sign(glo)) { lo = mid; glo = gm; } else hi = mid;
      }
      empuja((lo + hi) / 2);
    }
    x0 = x1; g0 = g1;
  }
  // sólo los interiores (los extremos del dominio no son puntos críticos)
  const marg = 1e-6 * (b - a);
  return out.filter((x) => x > a + marg && x < b - marg).sort((p, q) => p - q);
}

export interface PuntoNotable { x: number; tipo: 'max' | 'min' | 'silla' | 'inflexion' }

/** f′(x) = 0: máximo si f″ < 0, mínimo si f″ > 0. */
export function puntosCriticos(c: Curva): PuntoNotable[] {
  const [a, b] = c.dominio;
  return ceros(c.d1, a, b).map((x) => {
    const s = c.d2(x);
    return { x, tipo: s < -1e-9 ? 'max' : s > 1e-9 ? 'min' : 'silla' };
  });
}

/** f″ cambia de signo: la concavidad se invierte y f′ tiene un extremo. */
export function inflexiones(c: Curva): PuntoNotable[] {
  const [a, b] = c.dominio;
  const d = (b - a) * 1e-4;
  return ceros(c.d2, a, b)
    .filter((x) => Math.sign(c.d2(x - d)) !== Math.sign(c.d2(x + d)))
    .map((x) => ({ x, tipo: 'inflexion' as const }));
}

// ───────────────────────────── rangos de los paneles ─────────────────────────────

/** Paso «redondo» (1, 2, 5 × 10ⁿ) para unas `n` divisiones de `rango`. */
export function pasoRedondo(rango: number, n = 5): number {
  const bruto = rango / Math.max(1, n);
  const p = 10 ** Math.floor(Math.log10(bruto));
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= bruto - 1e-12) return k * p;
  return 10 * p;
}

/** Marcas redondas dentro de [a, b]. */
export function marcas(a: number, b: number, n = 5): number[] {
  const p = pasoRedondo(b - a, n);
  const out: number[] = [];
  for (let v = Math.ceil(a / p - 1e-9) * p; v <= b + 1e-9; v += p) out.push(Math.abs(v) < p * 1e-9 ? 0 : Number(v.toFixed(10)));
  return out;
}

/** Mínimo y máximo de g en [a, b] por muestreo. */
export function extremos(g: (x: number) => number, a: number, b: number, n = 400): [number, number] {
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i <= n; i++) { const y = g(a + ((b - a) * i) / n); lo = Math.min(lo, y); hi = Math.max(hi, y); }
  return [lo, hi];
}

/** Rango vertical de un panel: los extremos con un 7 % de aire, incluyendo el 0 si se pide. */
export function rangoPanel(lo: number, hi: number, conCero: boolean): [number, number] {
  if (conCero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  const aire = Math.max(1e-6, (hi - lo) * 0.07);
  return [lo - aire, hi + aire];
}

export interface Rangos { x: [number, number]; f: [number, number]; d: [number, number] }

/** Rangos de los dos paneles para una curva. El de f′ es fijo en el reto (no regala la incógnita). */
export function rangosCurva(c: Curva): Rangos {
  const [a, b] = c.dominio;
  const [fl, fh] = extremos(c.f, a, b);
  const rf = rangoPanel(fl, fh, c.id === 'cohete');
  if (c.id === 'cohete') rf[0] = 0; // la rampa de lanzamiento: s = 0 en el borde
  const rd = c.rangoDFijo ?? (() => { const [dl, dh] = extremos(c.d1, a, b); return rangoPanel(dl, dh, true); })();
  return { x: [a, b], f: rf, d: rd };
}

/** Prefijo común de dos cadenas: las cifras del cociente que ya coinciden con el límite. */
export function prefijoComun(a: string, b: string): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

/** g de la gravedad estándar (m/s²), para el empuje del cohete: a + g por unidad de masa. */
export const G_ESTANDAR = 9.80665;
