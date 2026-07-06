import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Homogeneidad Térmica', current: solubilidad?.temp || 0,                    target: 50, completed: (solubilidad?.temp || 0) > 40 },
      { label: 'Punto de Saturación',  current: solubilidad?.status === 'success' ? 1 : 0, target: 1,  completed: solubilidad?.status === 'success' },
      { label: 'Análisis de Fase',     current: solubilidad?.status === 'success' ? 1 : 0, target: 1,  completed: solubilidad?.status === 'success' },
    ];
}
