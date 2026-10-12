import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';
import { PUREZA_REQUERIDA_Q10, VOL_REQUERIDO_Q10 } from '@/domain/quimica';

// Mismos umbrales que el validador: 50 mL de destilado con ≥ 85 % v/v acumulado.
export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { destilacion } = s;
  const vol = destilacion?.volDestilado || 0;
  const pur = destilacion?.purezaDestilado || 0;
  return [
      { label: 'Ebullición controlada',      current: (destilacion?.tasa || 0) > 0 ? 1 : 0,               target: 1,                     completed: (destilacion?.tasa || 0) > 0 || vol > 0 },
      { label: 'Recuperación de Solvente',   current: Math.min(VOL_REQUERIDO_Q10, Math.round(vol)),       target: VOL_REQUERIDO_Q10,     completed: vol >= VOL_REQUERIDO_Q10 },
      { label: 'Pureza del destilado (% v/v)', current: parseFloat(pur.toFixed(1)),                        target: PUREZA_REQUERIDA_Q10,  completed: destilacion?.status === 'success' },
    ];
}
