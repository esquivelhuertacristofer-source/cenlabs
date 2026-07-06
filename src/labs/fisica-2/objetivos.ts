import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Configuración del Plano',    current: planoInclinado?.angulo > 0 ? 1 : 0,                  target: 1, completed: planoInclinado?.angulo > 0 },
      { label: 'Análisis de Rozamiento',    current: (planoInclinado?.coefRozamiento || 0) > 0 ? 1 : 0,  target: 1, completed: (planoInclinado?.coefRozamiento || 0) > 0 },
      { label: 'Certificación Dinámica',    current: planoInclinado?.resultado === 'exito' ? 1 : 0,       target: 1, completed: planoInclinado?.resultado === 'exito' },
    ];
}
