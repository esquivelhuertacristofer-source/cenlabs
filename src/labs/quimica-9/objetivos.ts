import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Cierre del Circuito',         current: celda?.puenteSalino ? 1 : 0,      target: 1, completed: celda?.puenteSalino },
      { label: 'Diferencia de Potencial',     current: celda?.cablesConectados ? 1 : 0,  target: 1, completed: celda?.cablesConectados },
      { label: 'Eficiencia Energética (V+)',  current: celda?.voltaje > 0 ? 1 : 0,       target: 1, completed: celda?.voltaje > 0 },
    ];
}
