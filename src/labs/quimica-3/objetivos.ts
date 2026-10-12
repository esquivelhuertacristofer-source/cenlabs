import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';
import { REACCIONES_REQUERIDAS_Q3 } from '@/domain/quimica';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { balanceo } = s;
  const completadas = balanceo?.reaccionesCompletadas?.length || 0;
  return [
      { label: 'Equilibrio Atómico', current: balanceo?.isBalanced ? 1 : 0,        target: 1,                          completed: balanceo?.isBalanced || false },
      { label: 'Ley de Lavoisier',   current: balanceo?.masaReactivos || 0,        target: balanceo?.masaProductos || 0, completed: Math.abs((balanceo?.masaReactivos || 0) - (balanceo?.masaProductos || 0)) < 0.01 },
      { label: 'Reacciones balanceadas', current: completadas, target: REACCIONES_REQUERIDAS_Q3, completed: completadas >= REACCIONES_REQUERIDAS_Q3 },
    ];
}
