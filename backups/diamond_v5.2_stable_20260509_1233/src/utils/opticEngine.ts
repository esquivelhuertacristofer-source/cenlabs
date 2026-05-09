/**
 * Motor Matemático Óptico (BIO-01)
 * Implementa las leyes fundamentales de la microscopía óptica:
 * Límite de resolución, Número de Abbe, y Profundidad de campo.
 */

// Las especificaciones reales de los objetivos típicos en los microscopios de laboratorio:
export type ObjetivoMagnification = 4 | 10 | 40 | 100;

export interface ObjectiveSpecs {
  mag: ObjetivoMagnification;
  na: number;           // Apertura Numérica (Numerical Aperture)
  wd: number;           // Working Distance en mm
  dof: number;          // Depth of Field (micrones aproximados)
  fov: number;          // Field of View en mm (basado en ocular FN 20)
  colorRing: string;    // Color estándar ISO del anillo del objetivo
}

export const OBJECTIVES: Record<ObjetivoMagnification, ObjectiveSpecs> = {
  4:   { mag: 4,   na: 0.10, wd: 18.5, dof: 55.0,  fov: 5.0,  colorRing: '#ef4444' }, // Rojo
  10:  { mag: 10,  na: 0.25, wd: 10.6, dof: 8.5,   fov: 2.0,  colorRing: '#eab308' }, // Amarillo
  40:  { mag: 40,  na: 0.65, wd: 0.6,  dof: 1.0,   fov: 0.5,  colorRing: '#3b82f6' }, // Azul
  100: { mag: 100, na: 1.25, wd: 0.13, dof: 0.19,  fov: 0.2,  colorRing: '#ffffff' }, // Blanco (Inmersión en aceite)
};

export const CONSTANTES_OPTICAS = {
  LONGITUD_ONDA_NM: 550, // Luz verde-amarilla (centro del espectro visible, usado estándar)
  AUMENTO_OCULAR: 10,     // Aumento estándar del ocular
};

/**
 * Límite de Resolución (Fórmula de Abbe)
 * Retorna el límite de resolución (d) en nanómetros.
 * d = λ / (2 * NA)
 * Si es 100x y no tiene aceite, el NA (que idealmente es 1.25) se asume truncado a 0.85 (NA aproximado del aire puro),
 * destrozando la resolución.
 */
export const calculateAbbeLimit = (na: number, is100x: boolean = false, isOilApplied: boolean = false): number => {
  let effectiveNA = na;
  if (is100x && !isOilApplied) {
    effectiveNA = Math.min(na, 0.85); // El NA muere en la refracción del aire
  }
  if (effectiveNA <= 0) return Infinity;
  return CONSTANTES_OPTICAS.LONGITUD_ONDA_NM / (2 * effectiveNA);
};

/**
 * Función central de evaluación del Enfoque.
 * Retorna un valor de "blur" en píxeles de CSS basado en la diferencia
 * entre la posición Z del usuario y el foco ideal, ponderado por la
 * profundidad de campo (DOF) del objetivo activo.
 * 
 * A mayor aumento, el DOF es menor, por lo que el enfoque debe ser mucho más preciso.
 */
export const calculateFocusBlur = (currentZ: number, targetZ: number, dof: number): number => {
  // Absoluta diferencia de enfoque
  const diff = Math.abs(currentZ - targetZ);
  
  // Si estamos dentro de la profundidad de campo, la imagen está nítida.
  if (diff <= dof / 2) return 0;

  // Fuera del DOF, la imagen se desenfoca.
  // El factor de desenfoque es inversamente proporcional al DOF.
  // Una diferencia de 5 en un objetivo con DOF 0.19 generará un blur INMENSO.
  const blurBase = (diff - (dof / 2)) * (1 / dof);
  
  // Capamos el blur máximo a 30px param que no sea una pantalla negra.
  return Math.min(30, blurBase * 2);
};

/**
 * Calcula la Magnificación Total
 */
export const calculateTotalMagnification = (objMag: number): number => {
  return objMag * CONSTANTES_OPTICAS.AUMENTO_OCULAR;
};
