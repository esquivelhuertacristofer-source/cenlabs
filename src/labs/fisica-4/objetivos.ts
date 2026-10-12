import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const h = s.hooke;
  const est = new Set((h?.estatica ?? []).map((m: { m: number }) => m.m)).size;
  const din = new Set((h?.dinamica ?? []).map((m: { m: number }) => m.m)).size;
  return [
      { label: 'Método Estático',          current: Math.min(est, 2), target: 2, completed: est >= 2 },
      { label: 'Método Dinámico',          current: Math.min(din, 3), target: 3, completed: din >= 3 },
      { label: 'Certificación de Rigidez', current: h?.resultado === 'exito' ? 1 : 0, target: 1, completed: h?.resultado === 'exito' },
    ];
}
