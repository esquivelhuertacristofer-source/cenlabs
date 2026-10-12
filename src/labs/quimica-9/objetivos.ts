import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { celda } = s;
  const cerrado = !!(celda?.puenteSalino && celda?.cablesConectados);
  return [
      { label: 'Cierre del Circuito',          current: cerrado ? 1 : 0,                       target: 1, completed: cerrado },
      { label: 'Lectura positiva (COM al ánodo)', current: (celda?.voltaje ?? 0) > 0 ? 1 : 0,   target: 1, completed: cerrado && (celda?.voltaje ?? 0) > 0 },
      { label: 'Ánodo y cátodo identificados', current: celda?.status === 'success' ? 1 : 0,   target: 1, completed: celda?.status === 'success' },
    ];
}
