import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Reactivo Limitante', current: limitante?.status === 'success' ? 1 : 0,    target: 1,                               completed: limitante?.status === 'success' },
      { label: 'Cálculo de Exceso',  current: limitante?.status === 'success' ? 1 : 0,    target: 1,                               completed: limitante?.status === 'success' },
      { label: 'Fase de Síntesis',   current: (limitante?.reaccionActual || 0) + 1,       target: limitante?.reacciones?.length || 4, completed: false },
    ];
}
