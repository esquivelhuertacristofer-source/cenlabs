/**
 * mat09/banco.ts — cotas del banco de integración (módulo puro, 1 u = 1 cm) y el paso de
 * coordenadas de la función a coordenadas de la escena.
 *
 *   Sobre un zócalo de grafito: una regla de aluminio (el eje x, de a a b) en la que se apoyan
 *   las columnas de cristal; detrás, una placa de vidrio ahumado con la retícula grabada; a la
 *   derecha, la probeta donde se vierte el área. El cero de la probeta está a la altura del
 *   cero de la función y su escala ocupa el mismo alto que el área de trazado.
 */
import type { Curva } from './riemann';

/** Ancho del área de trazado: el intervalo [a, b] ocupa exactamente esto. */
export const ANCHO_PLOT = 56;
/** Alto del área de trazado: y de 0 a yMax. */
export const ALTO_PLOT = 30;
/** Zócalo y regla. */
export const ALTO_ZOCALO = 3.6;
export const ALTO_REGLA = 1.6;
/** y = 0 de la función: la cara de arriba de la regla. */
export const Y_BASE = ALTO_ZOCALO + ALTO_REGLA;
/** x de la escena donde está x = a. */
export const X_IZQ = -36;
export const X_DER = X_IZQ + ANCHO_PLOT;
/** Profundidad de las columnas; su cara de delante y el plano de la curva. */
export const FONDO_COL = 2.6;
export const Z_FRENTE = FONDO_COL / 2;
export const Z_CURVA = Z_FRENTE + 0.32;
/** Hueco entre columnas (cada lado), como fracción del ancho, con tope en cm. */
export const HUECO_FRAC = 0.035;
export const HUECO_MAX = 0.09;

/** Placa de vidrio del fondo (con su margen izquierdo para los números de y). */
export const GROSOR_VIDRIO = 0.7;
export const Z_PLACA = -Z_FRENTE - 2.4;
export const PLACA = (() => {
  const x0 = X_IZQ - 5.2, x1 = X_DER + 1.6;
  const y0 = Y_BASE - 0.6, y1 = Y_BASE + ALTO_PLOT + 2.2;
  return { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
})();
export const MARCO = { ancho: 1.0, fondo: 1.7 };
/** Postes del soporte (a los lados de la placa). */
export const X_POSTE_IZQ = PLACA.x0 - MARCO.ancho - 1.1;
export const X_POSTE_DER = PLACA.x1 + MARCO.ancho + 1.1;
export const ALTO_POSTE = PLACA.y1 + MARCO.ancho + 0.6;

/** Probeta: radio interior y de pared, alto de la escala y del vidrio. */
export const R_PROBETA = 2.45;
export const PARED_PROBETA = 0.22;
export const X_PROBETA = X_POSTE_DER + 7.6;
export const Z_PROBETA = 0.8;
export const ALTO_VIDRIO_PROBETA = ALTO_PLOT + 3.4;
/** Pie hexagonal de la probeta: apoya en el zócalo y deja el fondo interior en Y_BASE. */
export const ALTO_PIE = ALTO_REGLA - 0.55;

/** Zócalo: del poste izquierdo a la probeta. */
export const ZOCALO = { x0: X_POSTE_IZQ - 2.6, x1: X_PROBETA + 7.2, fondo: 16, z: -1.2 };

/** Paso de coordenadas de la función a la escena para una curva. */
export interface Mapa {
  X: (x: number) => number;
  Y: (y: number) => number;
  /** inversa de X */
  xDe: (X: number) => number;
  /** cm de escena por unidad de x y de y */
  sx: number;
  sy: number;
  /** y de la escena del nivel `s` (unidades de área) en la probeta */
  nivel: (s: number) => number;
}

export function mapa(c: Curva): Mapa {
  const sx = ANCHO_PLOT / (c.b - c.a);
  const sy = ALTO_PLOT / c.yMax;
  return {
    X: (x) => X_IZQ + (x - c.a) * sx,
    Y: (y) => Y_BASE + y * sy,
    xDe: (X) => c.a + (X - X_IZQ) / sx,
    sx, sy,
    nivel: (s) => Y_BASE + (Math.max(0, s) / c.escalaProbeta) * ALTO_PLOT,
  };
}

/** Hueco a cada lado de una columna de ancho `w` (cm de escena). */
export const hueco = (w: number) => Math.min(HUECO_MAX, w * HUECO_FRAC);
