import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

// Mismos pasos que exige el validador: disolver en caliente, enfriar en hielo y
// obtener cristales.
export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { solubilidad } = s;
  const enHielo = solubilidad?.ubicacion === 'hielo' && (solubilidad?.temp ?? 99) <= 10;
  return [
      { label: 'Disolución en caliente', current: solubilidad?.disueltoEnCaliente ? 1 : 0, target: 1,  completed: !!solubilidad?.disueltoEnCaliente },
      { label: 'Enfriado en hielo (°C)', current: solubilidad?.temp || 0,                  target: 10, completed: enHielo },
      { label: 'Cristalización',         current: solubilidad?.status === 'success' ? 1 : 0, target: 1, completed: solubilidad?.status === 'success' },
    ];
}
