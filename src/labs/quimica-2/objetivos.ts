import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Volumen Constante (L)',  current: gases?.V || 0,  target: 10,                  completed: Math.abs((gases?.V || 0) - 10) < 0.1 },
      { label: 'Presión Objetivo (atm)', current: gases?.P || 0,  target: gases?.pTarget || 2, completed: Math.abs((gases?.P || 0) - (gases?.pTarget || 2)) < 0.1 },
      { label: 'Integridad de Cámara',   current: gases?.P || 0,  target: 7.0,                 completed: (gases?.P || 0) < 7.0 },
    ];
}
