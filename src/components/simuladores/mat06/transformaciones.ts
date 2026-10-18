/**
 * mat06/transformaciones.ts — la matemática del taller de transformaciones (módulo puro,
 * sin three ni React: lo prueban jest y lo leen la escena, el reloj y el dock).
 *
 * Convención: matrices 3×3 en COORDENADAS HOMOGÉNEAS, por filas,
 *
 *        ⎡ a  b  tx ⎤        (x, y) ↦ (a·x + b·y + tx,  c·x + d·y + ty)
 *   M =  ⎢ c  d  ty ⎥
 *        ⎣ 0  0  1  ⎦        el bloque 2×2 [[a, b], [c, d]] es la parte lineal.
 *
 * El producto se lee de derecha a izquierda: en T·R la figura se GIRA primero y se
 * TRASLADA después. det M = det del bloque 2×2 = factor de área con signo (negativo:
 * la orientación se invierte).
 *
 * Cada transformación del taller se recorre de forma CONTINUA de la identidad (t = 0) a
 * su matriz final (t = 1) por su camino natural: traslación t·v, giro t·θ alrededor del
 * centro, homotecia de razón 1 + t·(k − 1) (los vértices avanzan por los rayos desde el
 * centro) y la reflexión como medio giro en el espacio alrededor del eje (la pieza se
 * voltea). La sombra ortogonal de ese medio giro sobre el plano es la matriz
 * I − (1 − cos φ)·n·nᵀ, con det = cos φ: pasa por 0 justo cuando la pieza está de canto.
 */

export type P2 = [number, number];
/** Matriz 3×3 homogénea por filas. */
export type Mat3 = number[][];

const RAD = Math.PI / 180;
/** Ceros de redondeo (p. ej. cos 90° = 6e−17) se escriben como 0. */
const limpio = (v: number) => (Math.abs(v) < 1e-12 ? 0 : v);

// ───────────────────────────── álgebra 3×3 ─────────────────────────────

export function identidad(): Mat3 {
  return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
}

/** Producto A·B (3×3). */
export function mul2(A: Mat3, B: Mat3): Mat3 {
  const C: Mat3 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    let s = 0;
    for (let k = 0; k < 3; k++) s += A[i][k] * B[k][j];
    C[i][j] = s;
  }
  return C;
}

/** Producto de varias matrices, de izquierda a derecha: mul(A, B, C) = A·B·C (C actúa primero). */
export function mul(...ms: Mat3[]): Mat3 {
  return ms.reduce((acc, m) => mul2(acc, m), identidad());
}

/** Imagen del punto p: M·(x, y, 1). */
export function aplicar(M: Mat3, p: P2): P2 {
  const [x, y] = p;
  return [M[0][0] * x + M[0][1] * y + M[0][2], M[1][0] * x + M[1][1] * y + M[1][2]];
}

/** Imagen de un polígono. */
export function transformar(M: Mat3, poli: readonly P2[]): P2[] {
  return poli.map((p) => aplicar(M, p));
}

/** Determinante del bloque lineal 2×2 (= det de la 3×3 afín). */
export function det2(M: Mat3): number {
  return M[0][0] * M[1][1] - M[0][1] * M[1][0];
}

/** Determinante completo 3×3 (regla de Sarrus). */
export function det3(M: Mat3): number {
  return (
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
    - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
    + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0])
  );
}

/** Inversa 3×3 por la adjunta; null si det = 0 (la figura se aplasta: no hay vuelta atrás). */
export function inversa(M: Mat3): Mat3 | null {
  const d = det3(M);
  if (Math.abs(d) < 1e-14) return null;
  const c = (i: number, j: number) => {
    const f = [0, 1, 2].filter((k) => k !== i), g = [0, 1, 2].filter((k) => k !== j);
    const m = M[f[0]][g[0]] * M[f[1]][g[1]] - M[f[0]][g[1]] * M[f[1]][g[0]];
    return ((i + j) % 2 ? -1 : 1) * m;
  };
  const R: Mat3 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i][j] = c(j, i) / d;
  return R;
}

export function casiIgual(A: Mat3, B: Mat3, eps = 1e-9): boolean {
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (Math.abs(A[i][j] - B[i][j]) > eps) return false;
  return true;
}

// ───────────────────────────── las transformaciones ─────────────────────────────

/** Traslación de vector v = (vx, vy). */
export function traslacion(vx: number, vy: number): Mat3 {
  return [[1, 0, vx], [0, 1, vy], [0, 0, 1]];
}

/** Giro de θ grados (positivo = antihorario) alrededor del centro c: T(c)·R(θ)·T(−c). */
export function rotacion(grados: number, c: P2 = [0, 0]): Mat3 {
  const r = grados * RAD, co = limpio(Math.cos(r)), si = limpio(Math.sin(r));
  // (I − R)·c es la columna de traslación que deja fijo el centro
  return [[co, -si, c[0] - co * c[0] + si * c[1]], [si, co, c[1] - si * c[0] - co * c[1]], [0, 0, 1]];
}

/**
 * Reflexión en la recta que pasa por p con dirección α grados (0° = horizontal):
 * parte lineal [[cos 2α, sen 2α], [sen 2α, −cos 2α]] = I − 2·n·nᵀ, n = (−sen α, cos α).
 */
export function reflexion(alfaGrados: number, p: P2 = [0, 0]): Mat3 {
  const a = 2 * alfaGrados * RAD, co = limpio(Math.cos(a)), si = limpio(Math.sin(a));
  return [[co, si, p[0] - co * p[0] - si * p[1]], [si, -co, p[1] - si * p[0] + co * p[1]], [0, 0, 1]];
}

/** Homotecia de centro c y razón k: P′ = c + k·(P − c). Con k < 0 la figura pasa al otro lado del centro. */
export function homotecia(k: number, c: P2 = [0, 0]): Mat3 {
  return [[k, 0, (1 - k) * c[0]], [0, k, (1 - k) * c[1]], [0, 0, 1]];
}

/** M = T·R·S del reto (primero escala, luego gira alrededor del pivote, al final traslada). */
export function trs(tx: number, ty: number, grados: number, s: number): Mat3 {
  return mul(traslacion(tx, ty), rotacion(grados), homotecia(s));
}

/** Vector normal unitario de un eje de dirección α grados. */
export function normalEje(alfaGrados: number): P2 {
  const a = alfaGrados * RAD;
  return [-Math.sin(a), Math.cos(a)];
}

/**
 * Proyección ortogonal sobre el plano del medio giro de φ = π·t alrededor del eje:
 * T(p)·[I − (1 − cos φ)·n·nᵀ]·T(−p). En t = 0 es I; en t = 1, la reflexión; det = cos φ.
 */
export function sombraVolteo(alfaGrados: number, p: P2, t: number): Mat3 {
  const [nx, ny] = normalEje(alfaGrados);
  const f = 1 - Math.cos(Math.PI * t);
  const a = 1 - f * nx * nx, b = -f * nx * ny, d = 1 - f * ny * ny;
  return [[a, b, p[0] - a * p[0] - b * p[1]], [b, d, p[1] - b * p[0] - d * p[1]], [0, 0, 1]];
}

// ───────────────────────────── geometría de la pieza ─────────────────────────────

/**
 * La pieza del taller y del reto (unidades de la pieza, pivote en (0, 0)): una placa
 * asimétrica, ala izquierda larga y derecha corta, para que el giro y la reflexión se
 * lean sin ambigüedad (no tiene ningún eje de simetría).
 */
export const PIEZA: readonly P2[] = [
  [0, 1.8], [0.5, 0.45], [1.25, -0.4], [0.42, -0.42], [0.46, -1.3],
  [0, -0.95], [-0.46, -1.3], [-0.42, -0.5], [-2.0, -0.95], [-0.5, 0.45],
];

/** Vértices que siguen el dock y la escena: punta A, ala corta B, ala larga C y el pivote P. */
export const PUNTOS_CLAVE: readonly { id: 'A' | 'B' | 'C' | 'P'; p: P2 }[] = [
  { id: 'A', p: [0, 1.8] }, { id: 'B', p: [1.25, -0.4] }, { id: 'C', p: [-2.0, -0.95] }, { id: 'P', p: [0, 0] },
];

/** Área con signo (fórmula del cordón de zapato): > 0 si los vértices giran antihorario. */
export function areaConSigno(poli: readonly P2[]): number {
  let s = 0;
  for (let i = 0; i < poli.length; i++) {
    const [x0, y0] = poli[i], [x1, y1] = poli[(i + 1) % poli.length];
    s += x0 * y1 - x1 * y0;
  }
  return s / 2;
}

export function distancia(p: P2, q: P2): number {
  return Math.hypot(p[0] - q[0], p[1] - q[1]);
}

export function centroide(poli: readonly P2[]): P2 {
  let x = 0, y = 0;
  for (const p of poli) { x += p[0]; y += p[1]; }
  return [x / poli.length, y / poli.length];
}

export interface Caja { x0: number; x1: number; y0: number; y1: number }
export function cajaDe(puntos: readonly P2[], previa?: Caja): Caja {
  const c: Caja = previa ? { ...previa } : { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  for (const [x, y] of puntos) { c.x0 = Math.min(c.x0, x); c.x1 = Math.max(c.x1, x); c.y0 = Math.min(c.y0, y); c.y1 = Math.max(c.y1, y); }
  return c;
}

// ───────────────────────────── el taller (exploración) ─────────────────────────────

export type TipoT = 'rotacion' | 'reflexion' | 'homotecia' | 'traslacion' | 'composicion';
/** Orden del recorrido automático. */
export const TIPOS: readonly TipoT[] = ['rotacion', 'reflexion', 'homotecia', 'traslacion', 'composicion'];
export const NOMBRE_TIPO: Record<TipoT, string> = {
  rotacion: 'Rotación', reflexion: 'Reflexión', homotecia: 'Homotecia', traslacion: 'Traslación', composicion: 'Composición',
};

export type Centro = 'O' | 'C';
export interface ParamsT {
  /** vector de traslación */
  vx: number; vy: number;
  /** ángulo de giro (°, antihorario) */
  theta: number;
  /** dirección del eje de reflexión (°); el eje pasa por el origen */
  alfa: number;
  /** razón de la homotecia */
  k: number;
  /** centro del giro y de la homotecia: el origen O o el punto C */
  centro: Centro;
}

/** El punto C del taller (pivote de latón): centro alternativo de giros y homotecias. */
export const PUNTO_C: P2 = [0, -0.5];
/** Dónde está la figura original del taller: pivote en (−3, 1,5), sin giro, tamaño 1. */
export const POSE_ORIGINAL = { tx: -3, ty: 1.5, rot: 0, s: 1 } as const;
export const M_ORIGINAL: Mat3 = trs(POSE_ORIGINAL.tx, POSE_ORIGINAL.ty, POSE_ORIGINAL.rot, POSE_ORIGINAL.s);
/** La figura original del taller, en coordenadas del plano. */
export const ORIGINAL: readonly P2[] = transformar(M_ORIGINAL, PIEZA);

/** Cada estación del taller guarda sus propios mandos; éstos son los de partida. */
export const PARAMS_INICIALES: Record<TipoT, ParamsT> = {
  rotacion: { vx: 6, vy: -3, theta: -90, alfa: 60, k: -1.5, centro: 'C' },
  reflexion: { vx: 6, vy: -3, theta: -90, alfa: 60, k: -1.5, centro: 'O' },
  homotecia: { vx: 6, vy: -3, theta: -90, alfa: 60, k: -1.5, centro: 'C' },
  traslacion: { vx: 6, vy: -3, theta: -90, alfa: 60, k: -1.5, centro: 'O' },
  composicion: { vx: 2.5, vy: 3, theta: -90, alfa: 60, k: -1.5, centro: 'O' },
};
/**
 * Rangos de los mandos del taller: con ellos la imagen cabe SIEMPRE en la rejilla
 * [−10, 10]² de la placa (lo comprueba jest barriendo todos los valores).
 */
export const RANGOS = {
  vx: { min: -5, max: 8, paso: 0.5 },
  vy: { min: -8, max: 6, paso: 0.5 },
  /** en la composición el vector es más corto: el giro ya aleja la figura hasta 5 u del centro */
  vComp: { min: -3.5, max: 3.5, paso: 0.5 },
  theta: { min: -180, max: 180, paso: 15 },
  alfa: { min: 0, max: 165, paso: 15 },
  k: { min: -2, max: 2, paso: 0.25 },
} as const;

export const centroDe = (p: ParamsT): P2 => (p.centro === 'C' ? PUNTO_C : [0, 0]);

/**
 * Matriz final de la transformación del taller. En la composición es la rama `rama`:
 * 0 → T·R (primero gira, luego traslada) y 1 → R·T (primero traslada, luego gira).
 */
export function matrizFinal(tipo: TipoT, p: ParamsT, rama: 0 | 1 = 0): Mat3 {
  const c = centroDe(p);
  switch (tipo) {
    case 'traslacion': return traslacion(p.vx, p.vy);
    case 'rotacion': return rotacion(p.theta, c);
    case 'reflexion': return reflexion(p.alfa);
    case 'homotecia': return homotecia(p.k, c);
    case 'composicion': {
      const R = rotacion(p.theta, c), T = traslacion(p.vx, p.vy);
      return rama === 0 ? mul(T, R) : mul(R, T);
    }
  }
}

/**
 * La matriz plana de la pose en el instante t ∈ [0, 1] (0 = identidad, 1 = final).
 * Composición: la primera mitad aplica el primer factor y la segunda, el segundo.
 */
export function matrizEn(tipo: TipoT, p: ParamsT, t: number, rama: 0 | 1 = 0): Mat3 {
  const c = centroDe(p);
  const u = Math.min(1, Math.max(0, t));
  switch (tipo) {
    case 'traslacion': return traslacion(u * p.vx, u * p.vy);
    case 'rotacion': return rotacion(u * p.theta, c);
    case 'reflexion': return sombraVolteo(p.alfa, [0, 0], u);
    case 'homotecia': return homotecia(1 + u * (p.k - 1), c);
    case 'composicion': {
      const a = Math.min(1, 2 * u), b = Math.max(0, 2 * u - 1);
      if (rama === 0) return mul(traslacion(b * p.vx, b * p.vy), rotacion(a * p.theta, c));
      return mul(rotacion(b * p.theta, c), traslacion(a * p.vx, a * p.vy));
    }
  }
}

/**
 * Pose 3D (matriz 4×4 por COLUMNAS, como la usa three) de una pieza dibujada en el plano
 * z = 0 de la pieza, cuando su matriz plana actual es la del instante t. Para todas las
 * transformaciones salvo la reflexión es la matriz plana con z intacta; la reflexión es
 * el medio giro de φ = σ·π·t alrededor del eje (σ hace que el lado del centroide suba
 * hacia la cámara) más una elevación que mantiene toda la pieza delante del vidrio.
 * `base` es la matriz plana de la pieza ANTES de transformar (su colocación original).
 */
export function pose3D(tipo: TipoT, p: ParamsT, t: number, base: Mat3, hover: number, rama: 0 | 1 = 0): number[] {
  const u = Math.min(1, Math.max(0, t));
  if (tipo !== 'reflexion') {
    let M = mul(matrizEn(tipo, p, u, rama), base);
    // homotecia que pasa por razón 0: la pose dibujada no se aplasta del todo (normal nula = pantalla negra)
    const d = det2(M);
    if (Math.abs(d) < 4e-4) {
      const c = centroDe(p);
      const s = 1 + u * (p.k - 1);
      M = mul(homotecia(s >= 0 ? 0.02 : -0.02, c), base);
    }
    return embeber(M, hover);
  }
  return poseVolteo(p.alfa, [0, 0], u, base, hover);
}

/** 3×3 plana → 4×4 por columnas (z sin cambios, desplazada `z`). */
export function embeber(M: Mat3, z = 0): number[] {
  return [
    M[0][0], M[1][0], 0, 0,
    M[0][1], M[1][1], 0, 0,
    0, 0, 1, 0,
    M[0][2], M[1][2], z, 1,
  ];
}

/** Signo del volteo: el lado del eje donde queda el centroide de la figura sube hacia la cámara. */
export function signoVolteo(alfaGrados: number, p: P2, poli: readonly P2[]): 1 | -1 {
  const [nx, ny] = normalEje(alfaGrados);
  const [cx, cy] = centroide(poli);
  return nx * (cx - p[0]) + ny * (cy - p[1]) >= 0 ? 1 : -1;
}

/** Elevación máxima necesaria (en sen φ = 1) para que ningún vértice cruce detrás del vidrio. */
export function elevacionVolteo(alfaGrados: number, p: P2, poli: readonly P2[]): number {
  const [nx, ny] = normalEje(alfaGrados);
  const s = signoVolteo(alfaGrados, p, poli);
  let m = 0;
  for (const [x, y] of poli) m = Math.max(m, -s * (nx * (x - p[0]) + ny * (y - p[1])));
  return m;
}

/**
 * Medio giro en 3D alrededor de la recta (por p, dirección α) aplicado a la pieza ya colocada
 * por `base`: R_u(σ·π·t) por Rodrigues, con la elevación L·sen(π·t) en z.
 */
export function poseVolteo(alfaGrados: number, p: P2, t: number, base: Mat3, hover: number): number[] {
  const poli = transformar(base, PIEZA);
  const sg = signoVolteo(alfaGrados, p, poli);
  const L = elevacionVolteo(alfaGrados, p, poli);
  const phi = sg * Math.PI * t;
  const a = alfaGrados * RAD;
  const ux = Math.cos(a), uy = Math.sin(a);
  const c = Math.cos(phi), s = Math.sin(phi), k = 1 - c;
  // Rodrigues con u = (ux, uy, 0)
  const R = [
    [c + ux * ux * k, ux * uy * k, uy * s],
    [ux * uy * k, c + uy * uy * k, -ux * s],
    [-uy * s, ux * s, c],
  ];
  // rotación alrededor de la recta por p: x′ = p + R·(x − p); z elevada
  const tx = p[0] - (R[0][0] * p[0] + R[0][1] * p[1]);
  const ty = p[1] - (R[1][0] * p[0] + R[1][1] * p[1]);
  const tz = -(R[2][0] * p[0] + R[2][1] * p[1]) + L * Math.sin(Math.PI * t) + hover;
  // componer con la colocación plana `base` (afín en el plano, z intacta)
  const B = base;
  const m3 = (i: number, j: number) => R[i][0] * B[0][j] + R[i][1] * B[1][j];
  const tr = (i: number) => R[i][0] * B[0][2] + R[i][1] * B[1][2];
  return [
    m3(0, 0), m3(1, 0), m3(2, 0), 0,
    m3(0, 1), m3(1, 1), m3(2, 1), 0,
    R[0][2], R[1][2], R[2][2], 0,
    tr(0) + tx, tr(1) + ty, tr(2) + tz, 1,
  ];
}

/** Aplica una 4×4 por columnas a un punto (x, y, z). */
export function aplicar4(m: readonly number[], x: number, y: number, z = 0): [number, number, number] {
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
}

// ───────────────────────────── formato ─────────────────────────────

const MENOS = '−';
/** Cifra con coma decimal y signo menos tipográfico. */
export function num(x: number, d = 2, signo = false): string {
  if (!Number.isFinite(x)) return '—';
  const abs = Math.abs(x).toFixed(d);
  const cero = Number(abs) === 0;
  const cuerpo = abs.replace('.', ',');
  return (x < 0 && !cero ? MENOS : signo && !cero ? '+' : '') + cuerpo;
}

/** Cifra con los decimales justos (hasta `d`): 2 → «2», 1,5 → «1,5», 0,25 → «0,25». */
export function numCorto(x: number, d = 2): string {
  const r = Number(x.toFixed(d));
  const dec = Math.abs(r - Math.round(r)) < 1e-9 ? 0 : Math.abs(r * 10 - Math.round(r * 10)) < 1e-9 ? 1 : d;
  return num(r, dec);
}

/** Rótulo corto de la transformación: «R(−90°) · centro C», «S(eje 60°)»… */
export function rotuloTransformacion(tipo: TipoT, p: ParamsT): string {
  switch (tipo) {
    case 'traslacion': return `T(${numCorto(p.vx)}; ${numCorto(p.vy)})`;
    case 'rotacion': return `R(${numCorto(p.theta, 0)}°) · centro ${p.centro}`;
    case 'reflexion': return `Reflexión · eje a ${numCorto(p.alfa, 0)}°`;
    case 'homotecia': return `H(k = ${numCorto(p.k)}) · centro ${p.centro}`;
    case 'composicion': return `T(${numCorto(p.vx)}; ${numCorto(p.vy)}) y R(${numCorto(p.theta, 0)}°)`;
  }
}
