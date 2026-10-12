import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const p = s.pendulo;
  const muestras: { L: number; m: number }[] = p?.muestras ?? [];
  const Ls = new Set(muestras.map((m) => m.L)).size;
  const masaIndep = muestras.some((a) => muestras.some((b) => a.L === b.L && a.m !== b.m));
  return [
      { label: 'Longitudes Medidas',        current: Math.min(Ls, 3),            target: 3, completed: Ls >= 3 },
      { label: 'Independencia de la Masa',  current: masaIndep ? 1 : 0,          target: 1, completed: masaIndep },
      { label: 'Certificación Gravimétrica',current: p?.resultado === 'exito' ? 1 : 0, target: 1, completed: p?.resultado === 'exito' },
    ];
}
