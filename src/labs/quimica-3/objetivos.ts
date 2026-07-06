import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Equilibrio Atómico', current: balanceo?.isBalanced ? 1 : 0,        target: 1,                          completed: balanceo?.isBalanced || false },
      { label: 'Ley de Lavoisier',   current: balanceo?.masaReactivos || 0,        target: balanceo?.masaProductos || 0, completed: Math.abs((balanceo?.masaReactivos || 0) - (balanceo?.masaProductos || 0)) < 0.01 },
      { label: 'Nivel de Reactor',   current: (balanceo?.reaccionActual || 0) + 1, target: balanceo?.reacciones?.length || 6, completed: false },
    ];
}
