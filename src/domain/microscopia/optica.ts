/**
 * Óptica del microscopio de campo claro (BIO-01). Funciones puras, en micrómetros.
 *
 * Modelo (lo que se enseña en el laboratorio y lo que usan el visor y el juez):
 *   · aumento total      M = objetivo × ocular (10×)
 *   · campo visual       ⌀ = número de campo (18 mm) / aumento del objetivo
 *   · resolución         d = 1,22·λ / (AN_obj + AN_cond)   →  0,61·λ/AN con el
 *                        diafragma abierto del todo (AN_cond = AN_obj, Rayleigh)
 *   · profundidad campo  PdC = n·λ / AN²   (AN de trabajo = media objetivo/condensador)
 *   · desenfoque         círculo de confusión c = 2·(|Δz| − PdC/2)·tan(asin(AN/n))
 *   · contraste          cae al abrir el diafragma (deslumbramiento) y sube al cerrarlo
 *
 * Simplificaciones declaradas: λ fija en 550 nm; el objetivo de 100× usado en seco
 * se modela con AN efectiva 0,85 más una aberración esférica fija; la PdC ignora la
 * acomodación del ojo; el contraste es una recta empírica, no una MTF.
 */
import type { ObjetivoMagB1 } from '@/store/types';

export const LAMBDA_UM = 0.55;
export const AUMENTO_OCULAR = 10;
export const NUMERO_CAMPO_MM = 18;
/** Índices de refracción del medio entre el cubreobjetos y la lente frontal. */
export const N_AIRE = 1;
export const N_ACEITE = 1.515;
/** Una unidad del tornillo de enfoque (macro: 1 unidad; micro: décimas de unidad) son 10 µm. */
export const UM_POR_UNIDAD_ENFOQUE = 10;
/** Apertura del diafragma del condensador, como fracción de la apertura del objetivo. */
export const APERTURA_MIN = 0.2;
export const APERTURA_MAX = 1;

export interface ObjetivoOptico {
  mag: ObjetivoMagB1;
  /** apertura numérica grabada en el objetivo */
  an: number;
  inmersion: boolean;
  /** distancia de trabajo (mm) */
  dtMm: number;
  /** color del anillo (código ISO 8578) */
  anillo: string;
}

export const OBJETIVOS_OPTICOS: Record<ObjetivoMagB1, ObjetivoOptico> = {
  4: { mag: 4, an: 0.1, inmersion: false, dtMm: 18.5, anillo: '#c62828' },
  10: { mag: 10, an: 0.25, inmersion: false, dtMm: 10.6, anillo: '#f2c200' },
  40: { mag: 40, an: 0.65, inmersion: false, dtMm: 0.6, anillo: '#1e5fb3' },
  100: { mag: 100, an: 1.25, inmersion: true, dtMm: 0.13, anillo: '#f1f1ee' },
};
export const MAGS: readonly ObjetivoMagB1[] = [4, 10, 40, 100];

const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

export const aumentoTotal = (mag: ObjetivoMagB1): number => mag * AUMENTO_OCULAR;

/** Diámetro del campo visual en µm. */
export const campoUm = (mag: number): number => (NUMERO_CAMPO_MM * 1000) / mag;

/** AN con la que trabaja de verdad el objetivo: el de inmersión, sin aceite, no pasa de ≈ 0,85. */
export function anEfectiva(mag: ObjetivoMagB1, aceite: boolean): number {
  const o = OBJETIVOS_OPTICOS[mag];
  return o.inmersion && !aceite ? Math.min(o.an, 0.85) : o.an;
}

export const indiceMedio = (mag: ObjetivoMagB1, aceite: boolean): number =>
  OBJETIVOS_OPTICOS[mag].inmersion && aceite ? N_ACEITE : N_AIRE;

/** AN del cono de luz que deja pasar el diafragma del condensador. */
export function anCondensador(mag: ObjetivoMagB1, aceite: boolean, apertura: number): number {
  return anEfectiva(mag, aceite) * limitar(apertura, APERTURA_MIN, APERTURA_MAX);
}

/** Distancia mínima resoluble (µm). Con apertura = 1 es 0,61·λ/AN. */
export function resolucionUm(mag: ObjetivoMagB1, aceite: boolean, apertura = 1): number {
  return (1.22 * LAMBDA_UM) / (anEfectiva(mag, aceite) + anCondensador(mag, aceite, apertura));
}

/** AN de trabajo (media de objetivo y condensador): gobierna la profundidad de campo. */
export function anTrabajo(mag: ObjetivoMagB1, aceite: boolean, apertura = 1): number {
  return (anEfectiva(mag, aceite) + anCondensador(mag, aceite, apertura)) / 2;
}

/** Profundidad de campo (µm): espesor de la preparación que se ve nítido a la vez. */
export function profundidadCampoUm(mag: ObjetivoMagB1, aceite: boolean, apertura = 1): number {
  const an = anTrabajo(mag, aceite, apertura);
  return (indiceMedio(mag, aceite) * LAMBDA_UM) / (an * an);
}

/** Diámetro del círculo de confusión (µm, en la preparación) para un error de enfoque dz (µm). */
export function desenfoqueUm(dzUm: number, mag: ObjetivoMagB1, aceite: boolean, apertura = 1): number {
  const n = indiceMedio(mag, aceite);
  const seno = Math.min(0.95, anTrabajo(mag, aceite, apertura) / n);
  const exceso = Math.max(0, Math.abs(dzUm) - profundidadCampoUm(mag, aceite, apertura) / 2);
  return 2 * exceso * Math.tan(Math.asin(seno));
}

/** Aberración esférica (µm de círculo de confusión) del objetivo de inmersión usado en seco. */
export const ABERRACION_SIN_ACEITE_UM = 1.1;
export const sinAceite = (mag: ObjetivoMagB1, aceite: boolean): boolean => OBJETIVOS_OPTICOS[mag].inmersion && !aceite;

/**
 * Contraste relativo de la imagen (1 = neutro). Diafragma abierto del todo: la luz
 * parásita lava la imagen; cerrado: mucho contraste, pero peor resolución.
 */
export function contrasteRelativo(apertura: number): number {
  return 1.45 - 0.6 * limitar(apertura, APERTURA_MIN, APERTURA_MAX);
}

/** Valor «redondo» (1-2-5) de la barra de escala: el mayor que no pasa del 22 % del campo. */
export function barraEscalaUm(mag: number): number {
  const tope = campoUm(mag) * 0.22;
  let mejor = 1;
  for (let e = 0; e <= 4; e++) for (const m of [1, 2, 5]) {
    const v = m * 10 ** e;
    if (v <= tope) mejor = v;
  }
  return mejor;
}

/** Lado (µm) del marco de conteo: un tercio del diámetro del campo. */
export const ladoMarcoUm = (mag: number): number => campoUm(mag) / 3;

/** Recorrido de la platina (µm) a cada lado del centro de la preparación. */
export const RECORRIDO_PLATINA_UM = 1200;
