import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Estabilidad Térmica',        current: destilacion?.tempMezcla > 75 ? 1 : 0,                            target: 1,  completed: destilacion?.tempMezcla > 75 },
      { label: 'Recuperación de Solvente',   current: Math.min(50, Math.round(destilacion?.volDestilado || 0)),         target: 50, completed: destilacion?.volDestilado >= 50 },
      { label: 'Certificación de Pureza',    current: destilacion?.volDestilado > 50 ? 1 : 0,                          target: 1,  completed: destilacion?.volDestilado > 50 },
    ];
}
