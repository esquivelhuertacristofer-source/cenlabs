/**
 * mat08/banco.ts — cotas del banco de trazado (módulo puro, 1 u = 1 cm) y el paso de
 * coordenadas de la función a coordenadas de la escena.
 *
 *   Dos placas de vidrio ahumado grabado sobre un zócalo, una encima de otra y con el
 *   MISMO eje horizontal: arriba f(x), abajo f′(x). La curva es un tubo de neón que
 *   flota delante del vidrio; la secante, la tangente y las guías son haces de luz.
 */
import type { Rangos } from './derivada';

/** Ancho del área de trazado (el dominio de x ocupa exactamente esto). */
export const ANCHO_PLOT = 56;
/** Alto del área de trazado de f y de f′. */
export const ALTO_F = 24;
export const ALTO_D = 12;
/** Márgenes del vidrio alrededor del área de trazado (abajo caben los números de x). */
export const MARGEN = { izq: 5.0, der: 2.0, abajo: 3.4, arriba: 1.9 };
/** Grosor del vidrio y profundidad del marco. */
export const GROSOR_VIDRIO = 0.8;
export const MARCO = { ancho: 1.1, fondo: 1.9 };
/** Altura del zócalo y hueco entre placas. */
export const ALTO_ZOCALO = 3.6;
export const HUECO = 4.2;
/** z de las curvas, los haces y las cuentas (por delante del vidrio). */
export const Z_TRAZO = 1.15;
/** z de la cara grabada del vidrio. */
export const Z_GRABADO = GROSOR_VIDRIO / 2 + 0.012;

export interface Placa {
  /** centro del vidrio */
  cx: number; cy: number;
  /** tamaño del vidrio */
  w: number; h: number;
  /** área de trazado en la escena */
  x0: number; x1: number; y0: number; y1: number;
}

function placa(yBase: number, altoPlot: number): Placa {
  const w = ANCHO_PLOT + MARGEN.izq + MARGEN.der;
  const h = altoPlot + MARGEN.abajo + MARGEN.arriba;
  const x0 = -ANCHO_PLOT / 2, x1 = ANCHO_PLOT / 2;
  const cx = x0 - MARGEN.izq + w / 2;
  const y0 = yBase + MARGEN.abajo;
  return { cx, cy: yBase + h / 2, w, h, x0, x1, y0, y1: y0 + altoPlot };
}

/** Placa de f′ (abajo) y de f (arriba). */
export const PLACA_D = placa(ALTO_ZOCALO + 2.2, ALTO_D);
export const PLACA_F = placa(PLACA_D.cy + PLACA_D.h / 2 + HUECO, ALTO_F);

/** Postes del soporte y zócalo. */
export const X_POSTE = PLACA_F.cx + PLACA_F.w / 2 + MARCO.ancho + 1.0;
export const X_POSTE_IZQ = PLACA_F.cx - PLACA_F.w / 2 - MARCO.ancho - 1.0;
export const ALTO_POSTE = PLACA_F.cy + PLACA_F.h / 2 + MARCO.ancho + 0.6;
export const ZOCALO = { x0: X_POSTE_IZQ - 2.6, x1: X_POSTE + 2.6, fondo: 15 };

/** Torre de lanzamiento del reto: a la derecha del soporte. */
export const X_TORRE = X_POSTE + 6.2;
export const ALTO_TORRE = PLACA_F.y1 + 13;

/** Paso de coordenadas de la función a la escena para unos rangos dados. */
export interface Mapa {
  X: (x: number) => number;
  YF: (y: number) => number;
  YD: (y: number) => number;
  /** inversa de X (para el ratón y las pruebas) */
  xDe: (X: number) => number;
  /** escala: u de escena por unidad de x, de f y de f′ */
  sx: number; sf: number; sd: number;
}

export function mapa(r: Rangos): Mapa {
  const sx = ANCHO_PLOT / (r.x[1] - r.x[0]);
  const sf = ALTO_F / (r.f[1] - r.f[0]);
  const sd = ALTO_D / (r.d[1] - r.d[0]);
  return {
    X: (x) => PLACA_F.x0 + (x - r.x[0]) * sx,
    YF: (y) => PLACA_F.y0 + (y - r.f[0]) * sf,
    YD: (y) => PLACA_D.y0 + (y - r.d[0]) * sd,
    xDe: (X) => r.x[0] + (X - PLACA_F.x0) / sx,
    sx, sf, sd,
  };
}

/**
 * Recorta la recta que pasa por (px, py) con pendiente `m` (en la escena) al rectángulo
 * [x0, x1] × [y0, y1]. Devuelve los dos extremos o null si no lo cruza.
 */
export function recortarRecta(px: number, py: number, m: number, x0: number, x1: number, y0: number, y1: number): [[number, number], [number, number]] | null {
  // parámetro u a lo largo de (1, m)/|(1, m)|
  const L = Math.hypot(1, m), dx = 1 / L, dy = m / L;
  let u0 = -Infinity, u1 = Infinity;
  const corta = (p: number, d: number, lo: number, hi: number) => {
    if (Math.abs(d) < 1e-12) return p >= lo && p <= hi;
    let a = (lo - p) / d, b = (hi - p) / d;
    if (a > b) [a, b] = [b, a];
    u0 = Math.max(u0, a); u1 = Math.min(u1, b);
    return u0 <= u1;
  };
  if (!corta(px, dx, x0, x1) || !corta(py, dy, y0, y1)) return null;
  return [[px + u0 * dx, py + u0 * dy], [px + u1 * dx, py + u1 * dy]];
}
