/**
 * bio08/calibrador.ts — el calibrador de la tira (módulo puro, sin React ni lienzo).
 *
 * Dos marcas sobre el papel milimetrado. Lo ÚNICO que lee es la distancia entre ellas,
 * dicha como la diría el papel: milisegundos del paciente (25 mm/s) y cuadros grandes
 * (5 mm = 0,2 s). A propósito NO convierte a frecuencia: pasar del intervalo R-R a los
 * latidos por minuto es justo el cálculo que le toca al alumno.
 */

/** Velocidad del papel (mm por segundo del paciente) y ganancia (mm por mV). */
export const MM_POR_S = 25;
export const MM_POR_MV = 10;
/** Lado del cuadro grande del papel (mm): 0,2 s × 0,5 mV. */
export const MM_CUADRO_GRANDE = 5;
/** Resolución de las marcas: un cuarto de milímetro = 10 ms. */
export const PASO_FINO_MM = 0.25;

export interface LecturaCalibrador {
  /** separación de las marcas en milímetros de papel */
  mm: number;
  /** la misma separación en milisegundos del paciente */
  ms: number;
  /** y en cuadros grandes (de 5 mm) */
  cuadrosGrandes: number;
  /** lo que se enseña en pantalla */
  texto: string;
}

const coma = (x: number, d: number) => x.toFixed(d).replace('.', ',');

/** Lleva una posición a la rejilla fina y la deja dentro del papel visible [0, maxMm]. */
export function ajustarMarca(mm: number, maxMm: number): number {
  const tope = Math.max(0, Math.floor(maxMm / PASO_FINO_MM) * PASO_FINO_MM);
  const q = Math.round(mm / PASO_FINO_MM) * PASO_FINO_MM;
  return Math.min(tope, Math.max(0, Number.isFinite(q) ? q : 0));
}

/** Lectura del calibrador: sólo el intervalo (ms y cuadros). Nunca una frecuencia. */
export function leerCalibrador(mmA: number, mmB: number): LecturaCalibrador {
  const mm = Math.abs(mmA - mmB);
  const ms = Math.round((mm / MM_POR_S) * 1000);
  const cuadrosGrandes = mm / MM_CUADRO_GRANDE;
  return { mm, ms, cuadrosGrandes, texto: `${ms} ms · ${coma(cuadrosGrandes, 2)} cuadros grandes` };
}

/**
 * Teclado de una marca: ← → mueven 1 mm (40 ms); con Mayús, un cuadro grande (5 mm);
 * con Alt, el paso fino (0,25 mm = 10 ms); Inicio y Fin la llevan a los extremos.
 * Devuelve la posición nueva, o null si la tecla no es del calibrador.
 */
export function moverMarca(mm: number, tecla: string, mod: { shift?: boolean; alt?: boolean }, maxMm: number): number | null {
  const paso = mod.alt ? PASO_FINO_MM : mod.shift ? MM_CUADRO_GRANDE : 1;
  switch (tecla) {
    case 'ArrowLeft': case 'ArrowDown': return ajustarMarca(mm - paso, maxMm);
    case 'ArrowRight': case 'ArrowUp': return ajustarMarca(mm + paso, maxMm);
    case 'PageDown': return ajustarMarca(mm - MM_CUADRO_GRANDE, maxMm);
    case 'PageUp': return ajustarMarca(mm + MM_CUADRO_GRANDE, maxMm);
    case 'Home': return 0;
    case 'End': return ajustarMarca(maxMm, maxMm);
    default: return null;
  }
}
