import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';
import { TOLERANCIA_Q2_ATM } from '@/domain/quimica';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { gases } = s;
  const P = gases?.P || 0;
  const pTarget = gases?.pTarget || 2;
  return [
      { label: 'Presión Objetivo (atm)', current: P, target: pTarget, completed: Math.abs(P - pTarget) < TOLERANCIA_Q2_ATM },
      { label: 'Presión Certificada',    current: gases?.status === 'success' ? 1 : 0, target: 1, completed: gases?.status === 'success' },
      { label: 'Integridad de Cámara',   current: P, target: 7.0, completed: P < 7.0 && !gases?.isExploded },
    ];
}
