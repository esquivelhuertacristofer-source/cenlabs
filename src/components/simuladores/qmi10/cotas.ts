/**
 * qmi10/cotas.ts — cotas del montaje (módulo puro: lo usan el reloj y la escena).
 *
 * Escala del kit: 1 u = 10 cm; la mesa en y = 0; +Z mira al alumno; el eje de la columna en
 * x = z = 0. La columna es de vidrio DN80 (Ø interior 8 cm) con 5 platos de campanas de
 * burbujeo de acero inoxidable, separados 6,5 cm; cada plato va pinzado entre dos bridas.
 * La escena la corta en MEDIA SECCIÓN por el plano z = 0 (se conserva la mitad trasera).
 */
import { N_PLATOS } from './columna';
import { defProbeta } from '../_kit/perfiles';

export type V3 = [number, number, number];

// ───────────────────────────── hervidor ─────────────────────────────

/** Gato de laboratorio y manta de 1 L. */
export const GATO = { alto: 0.45, ancho: 1.4, fondo: 1.2 };
/** Balón de 1 L: radio interior del bulbo, pared, cuello NS 29 y centro del bulbo. */
export const BALON = {
  rInt: 0.63, pared: 0.016, rCuelloInt: 0.145, yCentro: 1.17, yBoca: 2.2,
};
export const MANTA = { yBase: GATO.alto, rExt: 0.82, alto: 0.47, rCazo: 0.68 };

/** Altura (sobre el fondo interior del bulbo) que alcanza `mL` en la esfera: V = πh²(3R − h)/3. */
export function alturaEnEsfera(mL: number, R = BALON.rInt): number {
  const V = Math.max(0, mL) / 1000; // u³ (1 u³ = 1 L)
  const Vmax = (4 / 3) * Math.PI * R ** 3;
  if (V >= Vmax) return 2 * R;
  let a = 0, b = 2 * R;
  for (let i = 0; i < 60; i++) {
    const h = 0.5 * (a + b);
    if ((Math.PI * h * h * (3 * R - h)) / 3 < V) a = h; else b = h;
  }
  return 0.5 * (a + b);
}
/** y del mundo de la superficie del líquido del hervidor. */
export const ySuperficieBalon = (mL: number) => BALON.yCentro - BALON.rInt + alturaEnEsfera(mL);

// ───────────────────────────── columna ─────────────────────────────

export const COL = {
  rInt: 0.4,
  rExt: 0.43,
  /** brida inferior (unión con el adaptador del balón) y superior */
  yBase: 2.45,
  yTope: 6.15,
  espaciado: 0.65,
  /** cubierta del plato 5 (el de abajo) */
  yPlatoInferior: 2.95,
  /** bridas QVF */
  bridaREx: 0.6,
  bridaAlto: 0.075,
  /** vertedero: cuerda a 0,27 del eje, 1,2 cm de alto; el faldón baja hasta 3,5 mm del plato de abajo */
  xVertedero: 0.27,
  hVertedero: 0.12,
  holguraFaldon: 0.035,
  /** líquido sobre el plato (vertedero + cresta de Francis) y altura del líquido retenido en la bajante */
  hLiquido: 0.135,
  hBajante: 0.27,
  /** campana: tubo de subida y casquete con ranuras */
  rCampana: 0.065,
  rChimenea: 0.034,
  hCampana: 0.17,
};

/** y de la cubierta del plato n (1 = el de arriba). */
export const yPlato = (n: number) => COL.yPlatoInferior + (N_PLATOS - n) * COL.espaciado;
/** Lado del vertedero del plato n (+1 = derecha, −1 = izquierda): alternan. */
export const ladoVertedero = (n: number) => (n % 2 === 1 ? 1 : -1);
/** Campanas de cada plato: tres cortadas por el plano (z = 0) y dos enteras detrás. */
export const CAMPANAS: [number, number][] = [[-0.16, 0], [0, 0], [0.16, 0], [-0.085, -0.205], [0.085, -0.205]];

// ───────────────────────────── cabeza y condensador ─────────────────────────────

export const CABEZA = {
  /** reducción DN80 → DN40 */
  yReduccion: 6.4,
  rInt: 0.19,
  rExt: 0.205,
  yTope: 7.4,
  /** pivote del embudo oscilante y su boca */
  yEmbudo: 6.95,
  /** salida lateral de toma de destilado: arranca en y y baja con este ángulo */
  ySalida: 6.7,
  anguloSalida: (24 * Math.PI) / 180,
  /** vaina del termómetro de resistencia (Pt100): punta en el vapor */
  puntaTermometro: [-0.06, 7.22, -0.02] as V3,
};
export const CONDENSADOR = { yBase: 7.4, yTope: 9.35, rCamisa: 0.235, rSerpentin: 0.14, rTubo: 0.026, vueltas: 9 };
/** Punta de goteo del condensador (donde cae el condensado al embudo). */
export const PUNTA_CONDENSADOR: V3 = [0, 7.32, 0];
/** Boca del embudo y salidas: de reflujo (abajo, a la columna) y de toma (al brazo lateral). */
export const EMBUDO = { boca: [0, CABEZA.yEmbudo + 0.1, 0] as V3, largo: 0.24, angulo: 0.42 };

// ───────────────────────────── receptor ─────────────────────────────

export const PROBETA = defProbeta(250);
/** El receptor (probeta de 250 mL) en una repisa del bastidor, a la derecha. */
export const RECEPTOR = { x: 1.75, z: 0, yRepisa: 2.7 };
/** Codo del brazo de toma (baja con `anguloSalida` desde la cabeza y gira a vertical sobre el receptor). */
export const Y_CODO_TOMA = CABEZA.ySalida - (RECEPTOR.x - CABEZA.rExt) * Math.tan(CABEZA.anguloSalida);
/** Final del brazo de toma: la punta de goteo sobre la boca del receptor. */
export const PUNTA_TOMA: V3 = [RECEPTOR.x, RECEPTOR.yRepisa + PROBETA.altura + 0.16, RECEPTOR.z];
/** Superficie del destilado en el receptor (mundo). */
export const ySuperficieReceptor = (mL: number) => RECEPTOR.yRepisa + PROBETA.alturaParaVolumen(Math.max(0.01, mL));

// ───────────────────────────── alimentación y bastidor ─────────────────────────────

/** Boquilla de alimentación: entra por la izquierda al plato 3 (zona de entrada). */
export const BOQUILLA_ALIM: V3 = [-COL.rExt - 0.02, 0, -0.12];
export const BOMBA = { pos: [-1.65, 0, 0.55] as V3, ancho: 0.62, alto: 0.42, fondo: 0.5 };
export const FRASCO_ALIM = { pos: [-2.35, 0, -0.35] as V3, r: 0.42, alto: 1.15 };
export const BASTIDOR = { x: 0.98, z: -0.78, alto: 9.9 };
export const CONTROL = { pos: [1.05, 0, 1.0] as V3, ancho: 0.95, alto: 0.42, fondo: 0.6 };
