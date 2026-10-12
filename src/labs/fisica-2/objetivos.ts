import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';
import { dinamicaPlano } from '@/domain/fisica';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const p = s.planoInclinado;
  const prediccion = !!p?.ensayo;
  const enMovimiento = prediccion && dinamicaPlano(p.ensayo).estado !== 'reposo';
  return [
      { label: 'Predicción Registrada',  current: prediccion ? 1 : 0,               target: 1, completed: prediccion },
      { label: 'Bloque en Movimiento',   current: enMovimiento ? 1 : 0,             target: 1, completed: enMovimiento },
      { label: 'Certificación Dinámica', current: p?.resultado === 'exito' ? 1 : 0, target: 1, completed: p?.resultado === 'exito' },
    ];
}
