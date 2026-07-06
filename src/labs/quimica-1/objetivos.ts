import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Número Atómico (Z)',  current: pActual,            target: targetZ,            completed: pActual === targetZ },
      { label: 'Masa Atómica (A)',    current: pActual + nActual,  target: targetA,            completed: (pActual + nActual) === targetA },
      { label: 'Carga Neta',          current: pActual - eActual,  target: targetCharge,       completed: (pActual - eActual) === targetCharge },
    ];
}
