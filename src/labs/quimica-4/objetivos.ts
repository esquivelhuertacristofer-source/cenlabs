import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

// Los dos últimos solo se marcan al validar: marcarlos al elegir revelaría la respuesta.
export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { limitante } = s;
  const r = limitante?.respuesta;
  const registrada = r?.limitanteIdx != null && r?.exceso != null;
  const ok = limitante?.status === 'success';
  return [
      { label: 'Respuesta registrada', current: registrada ? 1 : 0, target: 1, completed: registrada },
      { label: 'Reactivo Limitante',   current: ok ? 1 : 0,         target: 1, completed: ok },
      { label: 'Cálculo de Exceso',    current: ok ? 1 : 0,         target: 1, completed: ok },
    ];
}
