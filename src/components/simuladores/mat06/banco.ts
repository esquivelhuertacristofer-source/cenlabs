/**
 * mat06/banco.ts — cotas del taller de transformaciones (módulo puro). 1 u de la escena =
 * 1 unidad de la rejilla (un cuadro).
 *
 *  - Placa de vidrio ahumado vertical (plano z = 0 es su cara grabada) con la rejilla
 *    [−10, 10]² grabada y un margen para las cifras; marco de aluminio y pie de grafito.
 *  - Las piezas de vidrio flotan delante de la placa (`HOVER`); su sombra ortogonal se
 *    dibuja sobre el vidrio. En el reto flotan más pegadas (paralaje menor que la tolerancia).
 */
import type { Caja, P2 } from './transformaciones';

/** Colores de la escena y del dock: figura cian, imagen ámbar, rama R·T magenta, dorso violeta. */
export const COLOR = {
  original: '#38d9f5', imagen: '#ffb43a', rama2: '#ff4fa3', dorso: '#b18cff',
  objetivo: '#e8f1f8', exito: '#34d399', eje: '#c9b8ff', vector: '#f4f7fb', rayo: '#ffe2a8',
  A: '#ff7a59', B: '#5ee6a0', C: '#6fb6ff', P: '#ffffff',
} as const;

/** La rejilla grabada va de −RANGO a RANGO en x y en y. */
export const RANGO = 10;
/** Placa de vidrio: lado (u), grosor y marco. */
export const PLACA = { lado: 23.2, grosor: 0.32, marco: 0.62, fondoMarco: 0.9 } as const;
/** Grosor de las piezas de vidrio. */
export const GROSOR_PIEZA = 0.2;
/** Altura de las piezas sobre el vidrio: taller y reto. */
export const HOVER = { explorar: 0.5, reto: 0.16 } as const;
/** z de la sombra, del grabado y de los haces que van pegados al vidrio. */
export const Z = { grabado: 0.004, huella: 0.02, haz: 0.05 } as const;
/** Pie: zócalo de grafito bajo la placa y dos postes. */
export const PIE = { alto: 1.4, fondo: 6, yBase: -(23.2 / 2) - 0.62 - 3.2 } as const;

/** Encuadre: el cuadro mínimo que se enseña (u) y el margen alrededor de lo que importa. */
export const ENCUADRE = { minAncho: 12, minAlto: 9, margen: 1.3 } as const;

/**
 * Caja del plano que debe verse: la de lo que importa, con margen, al menos del tamaño
 * mínimo y sin salirse de la placa.
 */
export function cajaEncuadre(c: Caja, extra: P2[] = []): Caja {
  let { x0, x1, y0, y1 } = c;
  for (const [x, y] of extra) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  x0 -= ENCUADRE.margen; x1 += ENCUADRE.margen; y0 -= ENCUADRE.margen; y1 += ENCUADRE.margen;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const w = Math.max(ENCUADRE.minAncho, x1 - x0), h = Math.max(ENCUADRE.minAlto, y1 - y0);
  const lim = PLACA.lado / 2;
  const sx = Math.min(lim, w / 2), sy = Math.min(lim, h / 2);
  const ccx = Math.min(lim - sx, Math.max(-lim + sx, cx)), ccy = Math.min(lim - sy, Math.max(-lim + sy, cy));
  return { x0: ccx - sx, x1: ccx + sx, y0: ccy - sy, y1: ccy + sy };
}
