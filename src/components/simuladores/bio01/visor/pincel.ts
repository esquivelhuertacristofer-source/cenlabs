/**
 * bio01/visor/pincel.ts — tipos y utilidades de dibujo del campo ocular.
 *
 * Todas las capas dibujan en MICRÓMETROS: el lienzo llega ya transformado
 * (escala `s` px/µm y origen en la esquina de la tesela). Los colores se pintan
 * con `multiply`, como la luz transmitida: donde dos células teñidas se montan,
 * absorben las dos.
 */
import type { Rect } from '@/domain/microscopia/preparaciones';

export type G = CanvasRenderingContext2D;

export interface Vista {
  /** ventana de mundo (µm) que hay que cubrir */
  rect: Rect;
  /** px de dispositivo por µm */
  s: number;
  semilla: number;
}

/** Capa fija de una preparación: se dibuja por teselas y se guarda en caché. */
export interface CapaFija {
  id: string;
  /** altura de la capa respecto del plano principal (µm): cada capa se enfoca aparte */
  z: number;
  dibujar: (g: G, v: Vista) => void;
}

/** Capa viva: se simula y se redibuja en cada cuadro. */
export interface CapaViva<E = unknown> {
  z: number;
  crear: (semilla: number) => E;
  paso: (estado: E, dt: number) => void;
  dibujar: (g: G, v: Vista, estado: E, t: number) => void;
}

export interface Preparacion {
  /** color del campo vacío con la lámpara en su punto */
  fondo: string;
  capas: CapaFija[];
  viva?: CapaViva;
}

export const TAU = Math.PI * 2;
export const rgba = (r: number, g: number, b: number, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;
export const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
export const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Camino cerrado y suave por una lista de puntos (curvas cuadráticas por los puntos medios). */
export function caminoSuave(g: G, pts: ArrayLike<number>, n = pts.length / 2): void {
  const x = (i: number) => pts[(((i % n) + n) % n) * 2], y = (i: number) => pts[(((i % n) + n) % n) * 2 + 1];
  g.moveTo((x(n - 1) + x(0)) / 2, (y(n - 1) + y(0)) / 2);
  for (let i = 0; i < n; i++) g.quadraticCurveTo(x(i), y(i), (x(i) + x(i + 1)) / 2, (y(i) + y(i + 1)) / 2);
  g.closePath();
}

/** Camino abierto y suave. */
export function trazoSuave(g: G, pts: ArrayLike<number>, n = pts.length / 2): void {
  g.moveTo(pts[0], pts[1]);
  for (let i = 1; i < n - 1; i++) g.quadraticCurveTo(pts[i * 2], pts[i * 2 + 1], (pts[i * 2] + pts[i * 2 + 2]) / 2, (pts[i * 2 + 1] + pts[i * 2 + 3]) / 2);
  g.lineTo(pts[(n - 1) * 2], pts[(n - 1) * 2 + 1]);
}

/** Mancha irregular: radio modulado por `f(k)` ∈ [0,1) en `n` vértices. */
export function mancha(g: G, cx: number, cy: number, r: number, n: number, irregular: number, f: (k: number) => number, rot = 0, aplast = 1): void {
  const pts = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    const a = rot + (k / n) * TAU, rr = r * (1 + (f(k) - 0.5) * 2 * irregular);
    pts[k * 2] = cx + Math.cos(a) * rr; pts[k * 2 + 1] = cy + Math.sin(a) * rr * aplast;
  }
  caminoSuave(g, pts, n);
}

export function circulo(g: G, x: number, y: number, r: number): void {
  g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
}

/** Grosor mínimo visible: nunca por debajo de `px` píxeles de dispositivo. */
export const grosor = (um: number, s: number, px = 0.7) => Math.max(um, px / s);
