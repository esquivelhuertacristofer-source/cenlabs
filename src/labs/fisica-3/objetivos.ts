import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Configuración de Longitud', current: pendulo?.longitud > 0 ? 1 : 0,          target: 1, completed: pendulo?.longitud > 0 },
      { label: 'Sincronización de MAS',     current: pendulo?.oscilando ? 1 : 0,             target: 1, completed: pendulo?.oscilando },
      { label: 'Certificación Gravimétrica',current: pendulo?.resultado === 'exito' ? 1 : 0, target: 1, completed: pendulo?.resultado === 'exito' },
    ];
}
