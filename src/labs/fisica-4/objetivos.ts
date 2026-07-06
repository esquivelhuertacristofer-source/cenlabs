import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Prueba de Carga Estática',  current: hooke?.masa > 0 ? 1 : 0,                       target: 1, completed: hooke?.masa > 0 },
      { label: 'Análisis de Compresión',    current: (hooke?.estiramiento || 0) !== 0 ? 1 : 0,      target: 1, completed: (hooke?.estiramiento || 0) !== 0 },
      { label: 'Certificación de Rigidez',  current: hooke?.resultado === 'exito' ? 1 : 0,          target: 1, completed: hooke?.resultado === 'exito' },
    ];
}
