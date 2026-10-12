import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const t = s.tiroParabolico;
  const disparo = !!(t?.disparando || t?.resultado || (t?.disparos ?? 0) > 0);
  // El muro se libra cuando el último disparo aterrizó (acierto o fallo), no contra el muro.
  const muro = t?.resultado === 'exito' || t?.resultado === 'fallo';
  const impacto = (t?.aciertos ?? 0) > 0 || t?.resultado === 'exito';
  return [
      { label: 'Primer Disparo',       current: disparo ? 1 : 0, target: 1, completed: disparo },
      { label: 'Muro Superado',        current: muro ? 1 : 0,    target: 1, completed: muro },
      { label: 'Impacto Confirmado',   current: impacto ? 1 : 0, target: 1, completed: impacto },
    ];
}
