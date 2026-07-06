import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Calibración de Bureta',   current: titulacion?.purgada ? 1 : 0,            target: 1, completed: titulacion?.purgada },
      { label: 'Sensibilidad Visual',      current: titulacion?.indicador ? 1 : 0,          target: 1, completed: titulacion?.indicador },
      { label: 'Certificación de Ma',      current: titulacion?.status === 'success' ? 1 : 0, target: 1, completed: titulacion?.status === 'success' },
    ];
}
