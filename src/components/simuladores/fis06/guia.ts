/**
 * fis06/guia.ts — la franja «Ahora te toca» (módulo puro, sin React).
 *
 * Dice qué sigue según LO QUE EL ALUMNO YA HIZO (lecturas registradas, densidad escrita),
 * nunca según la respuesta: no recibe la densidad del sólido ni nada que salga de ella.
 */

/** Lo único que mira la guía del reto: qué pasos ha dado ya el alumno. */
export interface AvanceReto {
  lecturaAire: number | null;
  lecturaFluido: number | null;
  densidadAlumno: number | null;
}

/** Paso del reto en curso (1: pesar en aire · 2: pesar sumergido · 3: calcular · 4: comprobar). */
export function pasoReto(a: AvanceReto): 1 | 2 | 3 | 4 {
  if (a.lecturaAire === null) return 1;
  if (a.lecturaFluido === null) return 2;
  if (a.densidadAlumno === null || !Number.isFinite(a.densidadAlumno)) return 3;
  return 4;
}

export const GUIA_RETO: Record<1 | 2 | 3 | 4, string> = {
  1: 'con el cilindro fuera del líquido (0 %), registra el peso en aire.',
  2: 'sumérgelo del todo (100 %) y registra el peso sumergido.',
  3: 'la diferencia es el empuje: calcula la densidad y escríbela.',
  4: 'comprueba tu análisis; si falla, revisa la cuenta.',
};

export const guiaReto = (a: AvanceReto): string => GUIA_RETO[pasoReto(a)];

/** Guía de la exploración: qué mirar con el cuerpo elegido (lo que se ve, no una respuesta de reto). */
export function guiaExplorar(flota: boolean, estable: boolean): string {
  if (!flota) return 'se hunde: el empuje no alcanza al peso. Prueba otro líquido.';
  if (!estable) return 'de canto vuelca y queda tumbado. Compara con otro líquido.';
  return 'flota: el empuje iguala al peso. Cambia bloque o líquido y compara.';
}
