/**
 * mat09/riemann.ts — LA MATEMÁTICA del lab de las sumas de Riemann (módulo puro: sin three ni React).
 *
 *  - Las curvas del banco con su primitiva F (F′ = f) y las derivadas f′ y f‴ que piden los
 *    términos de Euler–Maclaurin: tres de exploración y la del reto, que delega en el dominio
 *    (`fM9`, `sumaRiemannM9`, `INTEGRAL_EXACTA_M9`: la MISMA función que usa el validador).
 *  - Las cinco reglas sobre la partición uniforme de [a, b] en n tramos de ancho Δx = (b − a)/n:
 *      izquierda      Δx·Σ f(xᵢ)            i = 0 … n−1
 *      derecha        Δx·Σ f(xᵢ)            i = 1 … n
 *      punto medio    Δx·Σ f(xᵢ + Δx/2)
 *      trapecios      Δx·[f(x₀)/2 + Σ f(xᵢ) + f(xₙ)/2]
 *      Simpson        (Δx/3)·[f(x₀) + 4Σ f(x_impar) + 2Σ f(x_par) + f(xₙ)]   (n par)
 *  - Cada regla es la integral EXACTA de un perfil por tramos: escalones (rectángulos), rectas
 *    (trapecios) o parábolas por tres nodos (Simpson). Ese perfil es lo que la escena levanta
 *    como columnas de cristal, así que la suma de las áreas de las columnas ES la suma de la regla.
 *  - Error E = S − I y su término principal (Euler–Maclaurin, D_k = f⁽ᵏ⁾(b) − f⁽ᵏ⁾(a)):
 *      izquierda/derecha  ∓(Δx/2)·D₀ + (Δx²/12)·D₁ − (Δx⁴/720)·D₃        → orden 1
 *      trapecios          (Δx²/12)·D₁ − (Δx⁴/720)·D₃                      → orden 2
 *      punto medio        −(Δx²/24)·D₁ + (7Δx⁴/5760)·D₃                   → orden 2
 *      Simpson            (Δx⁴/180)·D₃                                     → orden 4
 *  - Orden de convergencia MEDIDO: pendiente del ajuste por mínimos cuadrados de log|E| frente
 *    a log Δx con n = 16 … 1024 (el tramo asintótico del gráfico del dock).
 */
import { fM9, sumaRiemannM9, INTEGRAL_EXACTA_M9, A_M9, B_M9, TOLERANCIA_M9, N_MIN_M9, N_MAX_M9, errorRelativoM9, type MetodoM9 } from '@/domain/matematicas';

export type Metodo = MetodoM9 | 'trapecio' | 'simpson';
export type IdFuncion = 'onda' | 'exponencial' | 'cubica';
export type IdCurva = IdFuncion | 'reto';

/** Orden de presentación (dock, selector, leyendas). */
export const METODOS: Metodo[] = ['izquierda', 'derecha', 'punto_medio', 'trapecio', 'simpson'];
/** Los métodos que puede pedir el reto (los del store). */
export const METODOS_RETO: MetodoM9[] = ['izquierda', 'punto_medio', 'derecha'];
export const NOMBRE_METODO: Record<Metodo, string> = {
  izquierda: 'Izquierda', derecha: 'Derecha', punto_medio: 'Medio', trapecio: 'Trapecios', simpson: 'Simpson',
};
/** Orden de convergencia teórico (E ∝ Δxᵖ). */
export const ORDEN_TEORICO: Record<Metodo, number> = { izquierda: 1, derecha: 1, punto_medio: 2, trapecio: 2, simpson: 4 };
/** Color de cada método (escena y dock). */
export const COLOR_METODO: Record<Metodo, string> = {
  izquierda: '#5aa2ff', derecha: '#ff9a4d', punto_medio: '#3fe0a3', trapecio: '#b79bff', simpson: '#ffd55c',
};

export interface Curva {
  id: IdCurva;
  /** nombre corto para el selector */
  nombre: string;
  /** f(x) = … (barra y dock) */
  formula: string;
  f: (x: number) => number;
  /** primitiva: F′ = f */
  F: (x: number) => number;
  d1: (x: number) => number;
  d3: (x: number) => number;
  a: number;
  b: number;
  /** ∫ₐᵇ f(x) dx = F(b) − F(a) */
  exacta: number;
  /** alto del área de trazado del banco: y de 0 a yMax */
  yMax: number;
  /** fondo de escala de la probeta (en unidades de área) */
  escalaProbeta: number;
}

// ───────────────────────────── formato ─────────────────────────────

const MENOS = '−';
/** Cifra con coma decimal y signo menos tipográfico (−0 se escribe 0). */
export function num(x: number, d = 2): string {
  if (!Number.isFinite(x)) return '—';
  const s = Math.abs(x).toFixed(d).replace('.', ',');
  return (x < 0 && Number(Math.abs(x).toFixed(d)) !== 0 ? MENOS : '') + s;
}
/** Cifra con signo explícito (+ o −). */
export function numSigno(x: number, d = 2): string {
  const s = num(x, d);
  return s.startsWith(MENOS) || Number(Math.abs(x).toFixed(d)) === 0 ? s : `+${s}`;
}
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
/** 10ⁿ con el exponente en superíndice. */
export const pot10 = (n: number) => (n === 0 ? '1' : n === 1 ? '10' : `10${String(n).split('').map((ch) => SUP[ch] ?? ch).join('')}`);
/** Notación científica corta con coma: 3,2·10⁻⁵. */
export function cientifica(x: number, d = 1): string {
  if (!Number.isFinite(x)) return '—';
  if (x === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -2 && e <= 3) return num(x, Math.max(0, d + 1 - e));
  const m = x / 10 ** e;
  return `${num(m, d)}·${pot10(e)}`;
}
/** Lee un número escrito con coma o punto decimal («43,33» o «43.33»); NaN si no lo es. */
export function leerDecimal(t: string): number {
  const s = t.trim().replace(/\s/g, '').replace(MENOS, '-').replace(',', '.');
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(s)) return NaN;
  return Number(s);
}

// ───────────────────────────── curvas ─────────────────────────────

const coseno10 = Math.cos(10);

export const FUNCIONES: Record<IdFuncion, Curva> = {
  onda: {
    id: 'onda', nombre: 'onda', formula: 'f(x) = 1,2 + 0,25x + sen x',
    // una onda que sube: f(b) − f(a) = 1,956 pesa más que el término en Δx² y el orden 1 se ve limpio
    f: (x) => 1.2 + 0.25 * x + Math.sin(x),
    F: (x) => 1.2 * x + 0.125 * x * x - Math.cos(x),
    d1: (x) => 0.25 + Math.cos(x),
    d3: (x) => -Math.cos(x),
    a: 0, b: 10,
    // F(10) − F(0) = 12 + 12,5 − cos 10 + 1
    exacta: 25.5 - coseno10,
    yMax: 5, escalaProbeta: 40,
  },
  exponencial: {
    id: 'exponencial', nombre: 'eˣᐟ⁴', formula: 'f(x) = e^(x/4)',
    f: (x) => Math.exp(x / 4),
    F: (x) => 4 * Math.exp(x / 4),
    d1: (x) => Math.exp(x / 4) / 4,
    d3: (x) => Math.exp(x / 4) / 64,
    a: 0, b: 10,
    exacta: 4 * (Math.exp(2.5) - 1),
    yMax: 14, escalaProbeta: 80,
  },
  cubica: {
    id: 'cubica', nombre: 'cúbica', formula: 'f(x) = 3 + 0,03(x−1)(x−4,5)(x−8,5)',
    // (x−1)(x−4,5)(x−8,5) = x³ − 14x² + 51,25x − 38,25; su integral en [0, 10] es 40/3.
    // Sin simetría: f′(10) ≠ f′(0), así que trapecios y punto medio NO son exactos (orden 2) y Simpson sí.
    f: (x) => 3 + 0.03 * (x - 1) * (x - 4.5) * (x - 8.5),
    F: (x) => 3 * x + 0.03 * (x ** 4 / 4 - (14 / 3) * x ** 3 + (51.25 / 2) * x * x - 38.25 * x),
    d1: (x) => 0.03 * (3 * x * x - 28 * x + 51.25),
    d3: () => 0.03 * 6,
    a: 0, b: 10,
    exacta: 30 + 0.03 * (40 / 3),
    yMax: 6, escalaProbeta: 50,
  },
};
export const IDS_FUNCION: IdFuncion[] = ['onda', 'exponencial', 'cubica'];

/**
 * La curva del reto: f(x) = 0,1x² + 1 en [0, 10] (la MISMA del validador). La escala de la probeta
 * es fija (80) y no depende de la integral: una escala ajustada a I la delataría.
 */
export const CURVA_RETO: Curva = {
  id: 'reto', nombre: 'reto', formula: 'f(x) = 0,1x² + 1',
  f: fM9,
  F: (x) => x ** 3 / 30 + x,
  d1: (x) => 0.2 * x,
  d3: () => 0,
  a: A_M9, b: B_M9,
  exacta: INTEGRAL_EXACTA_M9,
  yMax: 12, escalaProbeta: 80,
};

// ───────────────────────────── las cinco reglas ─────────────────────────────

/** Simpson necesita un número PAR de tramos: un n impar se sube al par siguiente. */
export const nEfectivo = (n: number, m: Metodo) => {
  const k = Math.max(1, Math.round(n));
  return m === 'simpson' ? 2 * Math.ceil(k / 2) : k;
};

/** Suma de la regla `m` con n tramos. En la curva del reto, izquierda/derecha/medio salen del dominio. */
export function suma(c: Curva, n: number, m: Metodo): number {
  const N = nEfectivo(n, m);
  if (c.id === 'reto' && (m === 'izquierda' || m === 'derecha' || m === 'punto_medio')) return sumaRiemannM9(N, m);
  const h = (c.b - c.a) / N;
  const x = (i: number) => c.a + i * h;
  let s = 0;
  switch (m) {
    case 'izquierda': for (let i = 0; i < N; i++) s += c.f(x(i)); return s * h;
    case 'derecha': for (let i = 1; i <= N; i++) s += c.f(x(i)); return s * h;
    case 'punto_medio': for (let i = 0; i < N; i++) s += c.f(c.a + (i + 0.5) * h); return s * h;
    case 'trapecio': for (let i = 1; i < N; i++) s += c.f(x(i)); return h * (s + (c.f(c.a) + c.f(c.b)) / 2);
    case 'simpson': {
      for (let i = 1; i < N; i++) s += (i % 2 ? 4 : 2) * c.f(x(i));
      return (h / 3) * (s + c.f(c.a) + c.f(c.b));
    }
  }
}

/** E = S − I (con signo: positivo si la regla se pasa). */
export const errorSuma = (c: Curva, n: number, m: Metodo) => suma(c, n, m) - c.exacta;
export const errorRelativo = (c: Curva, n: number, m: Metodo) => Math.abs(errorSuma(c, n, m)) / Math.abs(c.exacta);

/** Término principal del error (Euler–Maclaurin) hasta Δx⁴. */
export function errorAsintotico(c: Curva, n: number, m: Metodo): number {
  const h = (c.b - c.a) / nEfectivo(n, m);
  const D0 = c.f(c.b) - c.f(c.a), D1 = c.d1(c.b) - c.d1(c.a), D3 = c.d3(c.b) - c.d3(c.a);
  const t = (h * h / 12) * D1 - (h ** 4 / 720) * D3;
  switch (m) {
    case 'izquierda': return -(h / 2) * D0 + t;
    case 'derecha': return (h / 2) * D0 + t;
    case 'trapecio': return t;
    case 'punto_medio': return -(h * h / 24) * D1 + (7 * h ** 4 / 5760) * D3;
    case 'simpson': return (h ** 4 / 180) * D3;
  }
}

/** Pendiente de la recta de mínimos cuadrados de (xs, ys). */
export function pendienteMC(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  return sxy / sxx;
}

/** Particiones del ajuste del orden (tramo asintótico, lejos del redondeo de la máquina). */
export const N_ORDEN = [16, 32, 64, 128, 256, 512, 1024];
/** Simpson llega antes al redondeo (E ∝ Δx⁴): su ajuste se queda en n ≤ 256. */
export const N_ORDEN_SIMPSON = [16, 32, 64, 128, 256];

/**
 * Orden de convergencia medido: pendiente de log₁₀|E| frente a log₁₀ Δx (n = 16 … 1024; Simpson, 16 … 256).
 * null si el error es nulo a la precisión de la máquina (la regla es exacta para esa curva).
 */
export function ordenMedido(c: Curva, m: Metodo, ns: number[] = m === 'simpson' ? N_ORDEN_SIMPSON : N_ORDEN): number | null {
  const lx: number[] = [], ly: number[] = [];
  for (const n of ns) {
    const e = Math.abs(errorSuma(c, n, m));
    if (!(e > 1e-12 * Math.abs(c.exacta))) return null;
    lx.push(Math.log10((c.b - c.a) / nEfectivo(n, m))); ly.push(Math.log10(e));
  }
  return pendienteMC(lx, ly);
}

/** El menor n del deslizador del reto (4 … 100) que cumple la tolerancia del método. Sólo se enseña tras validar. */
export function nMinimoReto(m: MetodoM9): number | null {
  for (let n = N_MIN_M9; n <= N_MAX_M9; n++) if (errorRelativoM9(n, m) < TOLERANCIA_M9[m]) return n;
  return null;
}

// ───────────────────────────── el perfil por tramos (las columnas) ─────────────────────────────

/**
 * Una columna: el tramo [x0, x1] con su techo cuadrático por los nodos (x0, q0), (xm, qm), (x1, q1),
 * xm = (x0 + x1)/2. Rectángulo: q0 = qm = q1 = f(x*). Trapecio: qm = (q0 + q1)/2. Simpson: la
 * parábola por f(x₂ₖ), f(x₂ₖ₊₁), f(x₂ₖ₊₂) sobre un panel de ancho 2Δx.
 */
export interface Columna { x0: number; x1: number; q0: number; qm: number; q1: number }

/** Área bajo el techo de una columna (Simpson es exacto para parábolas): (x1 − x0)(q0 + 4qm + q1)/6. */
export const areaColumna = (k: Columna) => ((k.x1 - k.x0) * (k.q0 + 4 * k.qm + k.q1)) / 6;

/** Altura del techo de la columna en x (interpolación de Lagrange por los tres nodos). */
export function techo(k: Columna, x: number): number {
  const u = (x - k.x0) / (k.x1 - k.x0);
  return k.q0 * (1 - u) * (1 - 2 * u) + k.qm * 4 * u * (1 - u) + k.q1 * u * (2 * u - 1);
}
/** Pendiente del techo en x (para las normales de la escena y las pruebas). */
export function pendienteTecho(k: Columna, x: number): number {
  const w = k.x1 - k.x0, u = (x - k.x0) / w;
  return (k.q0 * (4 * u - 3) + k.qm * (4 - 8 * u) + k.q1 * (4 * u - 1)) / w;
}

/** Las columnas de la regla `m` con n tramos (Simpson: n/2 paneles). */
export function columnas(c: Curva, n: number, m: Metodo): Columna[] {
  const N = nEfectivo(n, m);
  const h = (c.b - c.a) / N;
  const out: Columna[] = [];
  if (m === 'simpson') {
    for (let k = 0; k < N; k += 2) {
      const x0 = c.a + k * h, x1 = c.a + (k + 2) * h;
      out.push({ x0, x1, q0: c.f(x0), qm: c.f(c.a + (k + 1) * h), q1: c.f(x1) });
    }
    return out;
  }
  for (let i = 0; i < N; i++) {
    const x0 = c.a + i * h, x1 = c.a + (i + 1) * h;
    if (m === 'trapecio') {
      const q0 = c.f(x0), q1 = c.f(x1);
      out.push({ x0, x1, q0, qm: (q0 + q1) / 2, q1 });
    } else {
      const xe = m === 'izquierda' ? x0 : m === 'derecha' ? x1 : (x0 + x1) / 2;
      const q = c.f(xe);
      out.push({ x0, x1, q0: q, qm: q, q1: q });
    }
  }
  return out;
}

/** Los nodos donde la regla evalúa f (rectángulos: x*; trapecios y Simpson: la malla). */
export function nodos(c: Curva, n: number, m: Metodo): number[] {
  const N = nEfectivo(n, m);
  const h = (c.b - c.a) / N;
  if (m === 'trapecio' || m === 'simpson') return Array.from({ length: N + 1 }, (_, i) => c.a + i * h);
  const off = m === 'izquierda' ? 0 : m === 'derecha' ? 1 : 0.5;
  return Array.from({ length: N }, (_, i) => c.a + (i + off) * h);
}

/** Suma de las áreas de las columnas barridas hasta `k` (fraccionario): el nivel de la probeta. */
export function sumaParcial(cols: Columna[], k: number): number {
  let s = 0;
  const kk = Math.max(0, Math.min(cols.length, k));
  const ent = Math.floor(kk);
  for (let i = 0; i < ent; i++) s += areaColumna(cols[i]);
  if (ent < cols.length) s += (kk - ent) * areaColumna(cols[ent]);
  return s;
}

/**
 * Lo que sobra y lo que falta: ∫ max(techo − f, 0) y ∫ max(f − techo, 0) por Simpson compuesto
 * con `porColumna` subtramos en cada columna. Su diferencia es E = S − I.
 */
export function sobraFalta(c: Curva, cols: Columna[], porColumna = 32): { sobra: number; falta: number } {
  let sobra = 0, falta = 0;
  const K = porColumna % 2 ? porColumna + 1 : porColumna;
  for (const k of cols) {
    const h = (k.x1 - k.x0) / K;
    let sp = 0, sn = 0;
    for (let j = 0; j <= K; j++) {
      const x = k.x0 + j * h, d = techo(k, x) - c.f(x);
      const w = j === 0 || j === K ? 1 : j % 2 ? 4 : 2;
      if (d > 0) sp += w * d; else sn -= w * d;
    }
    sobra += (h / 3) * sp; falta += (h / 3) * sn;
  }
  return { sobra, falta };
}

// ───────────────────────────── barrido para el dock ─────────────────────────────

/** Las n del gráfico log–log (1 … 1024, en escala logarítmica cada cuarto de octava). */
export const N_BARRIDO: number[] = (() => {
  const s = new Set<number>();
  for (let i = 0; i <= 40; i++) s.add(Math.round(2 ** (i / 4)));
  return [...s].sort((a, b) => a - b);
})();

/** |E| para cada n del barrido (los ceros exactos quedan fuera: no caben en un eje logarítmico). */
export function barridoError(c: Curva, m: Metodo, ns: number[] = N_BARRIDO): { n: number; e: number }[] {
  const out: { n: number; e: number }[] = [];
  const vistos = new Set<number>();
  for (const n0 of ns) {
    const n = nEfectivo(n0, m);
    if (vistos.has(n)) continue;
    vistos.add(n);
    const e = Math.abs(errorSuma(c, n, m));
    if (e > 1e-13 * Math.abs(c.exacta)) out.push({ n, e });
  }
  return out;
}

/** Marcas «redondas» (1, 2, 5 × 10ⁿ) dentro de [a, b]. */
export function marcas(a: number, b: number, n = 5): number[] {
  const bruto = (b - a) / Math.max(1, n);
  const p = 10 ** Math.floor(Math.log10(bruto));
  let paso = 10 * p;
  for (const k of [1, 2, 2.5, 5, 10]) if (k * p >= bruto - 1e-12) { paso = k * p; break; }
  const out: number[] = [];
  for (let v = Math.ceil(a / paso - 1e-9) * paso; v <= b + 1e-9; v += paso) out.push(Math.abs(v) < paso * 1e-9 ? 0 : Number(v.toFixed(10)));
  return out;
}
