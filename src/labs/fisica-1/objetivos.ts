import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Estabilidad de Lanzamiento', current: tiroParabolico?.disparando || !!tiroParabolico?.resultado ? 1 : 0, target: 1, completed: tiroParabolico?.disparando || !!tiroParabolico?.resultado },
      { label: 'Precisión Balística',        current: tiroParabolico?.resultado === 'exito' ? 1 : 0,                     target: 1, completed: tiroParabolico?.resultado === 'exito' },
      { label: 'Optimización de Alcance',    current: tiroParabolico?.angulo === 45 ? 1 : 0,                             target: 1, completed: tiroParabolico?.angulo === 45 },
    ];
}
