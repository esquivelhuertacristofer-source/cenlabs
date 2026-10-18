/**
 * mat05/trigonometria.ts — LA MATEMÁTICA del círculo trigonométrico (módulo puro, sin
 * three ni React). La escena 3D, el dock y la barra de lecturas salen de aquí, y la
 * prueba `src/__tests__/mat05-trigonometria.test.ts` lo comprueba número a número.
 *
 *  · Definición GEOMÉTRICA: el punto P(θ) del círculo de radio 1 es (cos θ, sen θ);
 *    sen θ es su altura, cos θ su abscisa y tan θ la ordenada del punto donde la recta
 *    OP corta la tangente al círculo en (1, 0). Identidad pitagórica: x² + y² = 1.
 *  · Cuadrantes, signos y ÁNGULO DE REFERENCIA (el agudo que OP forma con el eje x).
 *  · Radianes: θ(rad) = θ(°)·π/180; en un círculo de radio 1 el ángulo en radianes
 *    ES la longitud del arco. La onda «desenrolla» ese arco sobre su eje horizontal.
 *  · SÍNTESIS DE FOURIER: las ondas cuadrada, triangular y en diente de sierra como
 *    suma de senos b_k·sen(kθ) (coeficientes en forma cerrada) y su representación
 *    con epiciclos: cada armónico es un punto que gira k veces más rápido; la altura
 *    del último es la suma parcial S_N(θ).
 */

export const GRADO = Math.PI / 180;
export const aRad = (g: number) => g * GRADO;
export const aGrados = (r: number) => r / GRADO;
/** Ángulo en [0, 360). */
export const norm360 = (g: number) => ((g % 360) + 360) % 360;

/** Cerca de los ejes (en grados) la escena y el dock tratan el ángulo como cuadrantal. */
const EPS_EJE = 1e-9;
/** Por debajo de este |cos θ| la tangente se declara indefinida (asíntota). */
export const EPS_TAN = 1e-9;

export type Cuadrante = 0 | 1 | 2 | 3 | 4;
export type Signo = -1 | 0 | 1;

export interface LecturaTrig {
  /** grados en [0, 360) */
  grados: number;
  /** radianes en [0, 2π) */
  rad: number;
  /** cos θ: la abscisa del punto */
  cos: number;
  /** sen θ: la altura del punto */
  sen: number;
  /** tan θ = sen/cos; null en las asíntotas (90°, 270°) */
  tan: number | null;
  /** 1–4, o 0 si el punto está sobre un eje */
  cuadrante: Cuadrante;
  /** ángulo de referencia (°): el agudo entre OP y el eje x */
  referencia: number;
  signos: { sen: Signo; cos: Signo; tan: Signo | null };
  /** sen²θ + cos²θ (identidad pitagórica) */
  pitagoras: number;
}

const signo = (v: number, eps = 1e-12): Signo => (v > eps ? 1 : v < -eps ? -1 : 0);

/** Cuadrante del ángulo (en grados); 0 sobre los ejes. */
export function cuadranteDe(gradosIn: number): Cuadrante {
  const g = norm360(gradosIn);
  if (Math.abs(g % 90) < EPS_EJE || Math.abs((g % 90) - 90) < EPS_EJE) return 0;
  return (Math.floor(g / 90) + 1) as Cuadrante;
}

/** Ángulo de referencia (°) en [0, 90]. */
export function referenciaDe(gradosIn: number): number {
  const g = norm360(gradosIn);
  if (g <= 90) return g;
  if (g <= 180) return 180 - g;
  if (g <= 270) return g - 180;
  return 360 - g;
}

/** La lectura completa del círculo para un ángulo en grados. */
export function leer(gradosIn: number): LecturaTrig {
  const g = norm360(gradosIn);
  const r = aRad(g);
  const c = Math.cos(r), s = Math.sin(r);
  const tan = Math.abs(c) < EPS_TAN ? null : s / c;
  // signos con los ejes exactos: sen 180° = 1,2·10⁻¹⁶ en coma flotante, pero su signo es 0
  const q = cuadranteDe(g);
  const sS = q === 0 ? signo(s, 1e-9) : signo(s);
  const sC = q === 0 ? signo(c, 1e-9) : signo(c);
  return {
    grados: g, rad: r, cos: c, sen: s, tan, cuadrante: q, referencia: referenciaDe(g),
    signos: { sen: sS, cos: sC, tan: tan == null ? null : signo(sS * sC) },
    pitagoras: s * s + c * c,
  };
}

// ───────────────────────────── geometría que dibuja la escena ─────────────────────────────

export type P2 = [number, number];

export interface GeometriaTrig {
  /** el punto P = (cos θ, sen θ) */
  P: P2;
  /** radio O → P */
  radio: [P2, P2];
  /** coseno: O → (cos θ, 0) */
  coseno: [P2, P2];
  /** seno: (cos θ, 0) → P */
  seno: [P2, P2];
  /** tangente: (1, 0) → T = (1, tan θ), o null en las asíntotas */
  tangente: [P2, P2] | null;
  /** recta OP prolongada hasta T (desde P, pasando por O si hace falta) */
  secante: [P2, P2] | null;
}

/** Los segmentos de la construcción geométrica, en unidades del círculo (r = 1). */
export function geometria(gradosIn: number): GeometriaTrig {
  const l = leer(gradosIn);
  const P: P2 = [l.cos, l.sen];
  const T: P2 | null = l.tan == null ? null : [1, l.tan];
  return {
    P,
    radio: [[0, 0], P],
    coseno: [[0, 0], [l.cos, 0]],
    seno: [[l.cos, 0], P],
    tangente: T ? [[1, 0], T] : null,
    secante: T ? [P, T] : null,
  };
}

// ───────────────────────────── radianes «bonitos» ─────────────────────────────

const mcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : mcd(b, a % b));

/**
 * Forma exacta en múltiplos de π para los múltiplos enteros de 15° («7π/6»); null si no
 * lo es. 0 → «0» y 360 → «2π».
 */
export function radianesExactos(gradosIn: number): string | null {
  const g = Math.round(gradosIn);
  if (Math.abs(gradosIn - g) > 1e-9 || g % 15 !== 0) return null;
  if (g === 0) return '0';
  const d = mcd(g, 180);
  const p = g / d, q = 180 / d;
  const num = p === 1 ? 'π' : `${p}π`;
  return q === 1 ? num : `${num}/${q}`;
}

/** Valores exactos de los ángulos notables del primer cuadrante (la tabla del dock). */
export const NOTABLES: { g: number; sen: string; cos: string; tan: string }[] = [
  { g: 0, sen: '0', cos: '1', tan: '0' },
  { g: 30, sen: '1/2', cos: '√3/2', tan: '√3/3' },
  { g: 45, sen: '√2/2', cos: '√2/2', tan: '1' },
  { g: 60, sen: '√3/2', cos: '1/2', tan: '√3' },
  { g: 90, sen: '1', cos: '0', tan: '∞' },
];

/** Valor numérico de una forma exacta de la tabla («√3/2» → 0,866…). */
export function valorExacto(t: string): number {
  if (t === '∞') return Infinity;
  const neg = t.startsWith('−') || t.startsWith('-');
  const s = neg ? t.slice(1) : t;
  const [a, b] = s.split('/');
  const num = a.startsWith('√') ? Math.sqrt(Number(a.slice(1))) : Number(a);
  const v = b ? num / Number(b) : num;
  return neg ? -v : v;
}

// ───────────────────────────── síntesis de Fourier ─────────────────────────────

export type Forma = 'cuadrada' | 'triangular' | 'sierra';
export const FORMAS: Forma[] = ['cuadrada', 'triangular', 'sierra'];

/** Un término b·sen(kθ) de la serie. */
export interface Termino { k: number; b: number }

/**
 * Coeficiente b_k de la serie de senos (periodo 2π, amplitud 1):
 *   cuadrada   f = signo(sen θ)          b_k = 4/(πk)                     (k impar)
 *   triangular f = (2/π)·arcsen(sen θ)   b_k = 8/(π²k²)·(−1)^((k−1)/2)    (k impar)
 *   sierra     f = θ/π en (−π, π)        b_k = 2/(πk)·(−1)^(k+1)          (todo k)
 */
export function coeficiente(forma: Forma, k: number): number {
  if (!(k >= 1) || !Number.isInteger(k)) return 0;
  if (forma === 'sierra') return ((k % 2 === 1 ? 1 : -1) * 2) / (Math.PI * k);
  if (k % 2 === 0) return 0;
  if (forma === 'cuadrada') return 4 / (Math.PI * k);
  return ((((k - 1) / 2) % 2 === 0 ? 1 : -1) * 8) / (Math.PI * Math.PI * k * k);
}

/** Los N primeros términos NO nulos de la serie. */
export function terminos(forma: Forma, N: number): Termino[] {
  const out: Termino[] = [];
  for (let k = 1; out.length < N && k < 100000; k++) {
    const b = coeficiente(forma, k);
    if (b !== 0) out.push({ k, b });
  }
  return out;
}

/** La onda que la serie quiere construir (en el salto, el punto medio: 0). */
export function ondaObjetivo(forma: Forma, theta: number): number {
  const t = ((theta % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); // [0, 2π)
  if (forma === 'cuadrada') {
    if (t === 0 || Math.abs(t - Math.PI) < 1e-15) return 0;
    return t < Math.PI ? 1 : -1;
  }
  if (forma === 'triangular') return (2 / Math.PI) * Math.asin(Math.max(-1, Math.min(1, Math.sin(t))));
  // sierra: θ/π en (−π, π), periódica; en θ = π el salto vale 0
  if (Math.abs(t - Math.PI) < 1e-15) return 0;
  return (t < Math.PI ? t : t - 2 * Math.PI) / Math.PI;
}

/** Suma parcial S_N(θ) = Σ b_k·sen(kθ). */
export function sumaParcial(ts: Termino[], theta: number): number {
  let s = 0;
  for (const t of ts) s += t.b * Math.sin(t.k * theta);
  return s;
}

/** Un eslabón de la cadena de epiciclos: círculo de centro c y radio r, con su punta. */
export interface Epiciclo { c: P2; r: number; ang: number; punta: P2; k: number; sentido: 1 | -1 }

/**
 * Sentido de giro de cada fasor. La altura de la punta es la misma girando en un sentido
 * (ángulo kθ) o en el otro (ángulo π − kθ): sen(π − kθ) = sen(kθ). Lo que cambia es la
 * abscisa, ±b·cos(kθ). En la cuadrada y la triangular se alternan los sentidos: así la
 * abscisa de la punta es la MISMA onda en coseno (acotada por Gibbs) en vez de la serie
 * conjugada, que crece como ln N; la punta dibuja un cuadrado o un rombo. En la sierra se
 * deja un solo sentido: su abscisa crece como (2/π)·ln N, pero hacia la izquierda (θ = π).
 */
export function sentidosDe(forma: Forma, n: number): (1 | -1)[] {
  return Array.from({ length: n }, (_, j) => (forma === 'sierra' || j % 2 === 0 ? 1 : -1));
}

/**
 * Cadena de epiciclos: el término b·sen(kθ) es la ALTURA de un punto que gira en un
 * círculo de radio |b| (ángulo kθ, o π − kθ si gira al revés; +π si b < 0). Se encadenan:
 * cada círculo se centra en la punta del anterior, y la altura de la última punta es S_N(θ).
 */
export function epiciclos(ts: Termino[], theta: number, sentidos?: (1 | -1)[]): Epiciclo[] {
  const out: Epiciclo[] = [];
  let cx = 0, cy = 0;
  ts.forEach((t, j) => {
    const r = Math.abs(t.b);
    const s = sentidos?.[j] ?? 1;
    const ang = (s > 0 ? t.k * theta : Math.PI - t.k * theta) + (t.b < 0 ? Math.PI : 0);
    const px = cx + r * Math.cos(ang), py = cy + r * Math.sin(ang);
    out.push({ c: [cx, cy], r, ang, punta: [px, py], k: t.k, sentido: s });
    cx = px; cy = py;
  });
  return out;
}

/** Potencia media de la onda, (1/2π)·∫₀^{2π} f² dθ: 1 la cuadrada, 1/3 la triangular y la sierra. */
export function potencia(forma: Forma): number {
  return forma === 'cuadrada' ? 1 : 1 / 3;
}

/**
 * Error cuadrático medio de S_N frente a la onda, exacto por Parseval:
 * ‖f − S_N‖²_rms = P − Σ b_k²/2.
 */
export function errorRMS(forma: Forma, N: number): number {
  const ts = terminos(forma, N);
  const e2 = potencia(forma) - ts.reduce((a, t) => a + (t.b * t.b) / 2, 0);
  return Math.sqrt(Math.max(0, e2));
}

/** Máximo de S_N en un periodo, muestreado (el «sobreimpulso» de Gibbs en la cuadrada y la sierra). */
export function maximoSuma(forma: Forma, N: number, muestras = 6000): number {
  const ts = terminos(forma, N);
  let m = -Infinity;
  for (let i = 0; i <= muestras; i++) m = Math.max(m, sumaParcial(ts, (2 * Math.PI * i) / muestras));
  return m;
}

/** Integral seno, Si(x) = ∫₀ˣ sen t / t dt (serie de potencias; |x| ≤ 10 de sobra). */
export function integralSeno(x: number): number {
  let s = 0, t = x, n = 0;
  while (Math.abs(t) > 1e-18 && n < 200) {
    s += t / (2 * n + 1);
    n++;
    t *= -(x * x) / ((2 * n) * (2 * n + 1));
  }
  return s;
}

/** Límite de Wilbraham–Gibbs: máx S_N de la cuadrada → (2/π)·Si(π) ≈ 1,17898 (un 8,95 % del salto). */
export const GIBBS = (2 / Math.PI) * integralSeno(Math.PI);

/** Fórmula de la serie, para el dock. */
export const FORMULA_SERIE: Record<Forma, string> = {
  cuadrada: '(4/π)·Σ sen(kθ)/k, k impar',
  triangular: '(8/π²)·Σ (−1)^((k−1)/2)·sen(kθ)/k², k impar',
  sierra: '(2/π)·Σ (−1)^(k+1)·sen(kθ)/k',
};
export const NOMBRE_FORMA: Record<Forma, string> = { cuadrada: 'Cuadrada', triangular: 'Triangular', sierra: 'Diente de sierra' };
