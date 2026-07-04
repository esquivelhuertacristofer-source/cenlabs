/**
 * GOLDEN MASTER — datos de los labs
 * ─────────────────────────────────────────────────────────────────────────────
 * Congela la salida serializada de los 5 stores de datos tal como los expone la
 * capa de facades (Fase 1). Con el registro `src/labs/{id}/` vacío, esta salida
 * ES la legacy pura; a medida que migremos labs a carpetas (Fase 3) y retiremos
 * los monolitos (Fase 4), el facade debe seguir produciendo EXACTAMENTE lo mismo.
 *
 * Cualquier diferencia byte a byte hace fallar el snapshot ⇒ es la red de
 * seguridad que prueba que cada migración es un cambio de forma, no de contenido.
 *
 * Regla: NUNCA actualizar estos snapshots (`jest -u`) al migrar un lab. Si el
 * snapshot cambia durante una migración, es un BUG en la migración, no en el test.
 * Solo se regeneran cuando cambia intencionalmente el contenido de un lab.
 *
 * Nota: se snapshotea `ALL_QUIZZES` CRUDO (no `getQuizForPractice`, que baraja
 * con Fisher-Yates y no es determinista).
 */
import { ALL_BRIEFING_CONFIGS } from '@/data/briefingConfigs';
import { MASTER_DATA } from '@/data/simuladoresData';
import { ALL_TUTOR_STEPS } from '@/data/tutorSteps';
import { ALL_QUIZZES } from '@/data/quizQuestions';
import { getLabObjetivos, type ObjetivosState } from '@/data/labObjetivos';

// Estado fijo y rico que dispara las ramas `completed:true` de cada caso del
// switch de getLabObjetivos, para que el golden caracterice la lógica completa.
const STATE: ObjetivosState = {
  pActual: 6, nActual: 6, eActual: 6,
  targetZ: 6, targetA: 12, targetCharge: 0,
  gases: { V: 10, P: 2, pTarget: 2 },
  balanceo: { isBalanced: true, masaReactivos: 100, masaProductos: 100, reaccionActual: 1, reacciones: [1, 2, 3, 4, 5, 6] },
  limitante: { status: 'success', reaccionActual: 2, reacciones: [1, 2, 3, 4] },
  soluciones: { matraz: { polvo: 7.305, agua: 250 }, mRequerida: 7.305, vTarget: 250, status: 'success' },
  solubilidad: { temp: 50, status: 'success' },
  titulacion: { purgada: true, indicador: true, status: 'success' },
  equilibrio: { jeringas: [{ ubicacion: 'caliente' }, { ubicacion: 'hielo' }], status: 'success' },
  celda: { puenteSalino: true, cablesConectados: true, voltaje: 1.1 },
  destilacion: { tempMezcla: 80, volDestilado: 55 },
  tiroParabolico: { disparando: true, resultado: 'exito', angulo: 45 },
  planoInclinado: { angulo: 30, coefRozamiento: 0.2, resultado: 'exito' },
  pendulo: { longitud: 1, oscilando: true, resultado: 'exito' },
  hooke: { masa: 2, estiramiento: 0.5, resultado: 'exito' },
};

// Universo de ids: la unión de todo lo que exponga cualquiera de los stores.
const ALL_IDS = Array.from(
  new Set([
    ...Object.keys(ALL_BRIEFING_CONFIGS),
    ...Object.keys(MASTER_DATA),
    ...Object.keys(ALL_TUTOR_STEPS),
    ...Object.keys(ALL_QUIZZES),
  ]),
).sort();

describe('golden master — stores de datos (invariante ante la migración a src/labs)', () => {
  it('inventario de ids es estable', () => {
    expect(ALL_IDS).toMatchSnapshot();
  });

  it('ALL_BRIEFING_CONFIGS', () => {
    expect(ALL_BRIEFING_CONFIGS).toMatchSnapshot();
  });

  it('MASTER_DATA (simuladoresData)', () => {
    expect(MASTER_DATA).toMatchSnapshot();
  });

  it('ALL_TUTOR_STEPS', () => {
    expect(ALL_TUTOR_STEPS).toMatchSnapshot();
  });

  it('ALL_QUIZZES (crudo, sin barajar)', () => {
    expect(ALL_QUIZZES).toMatchSnapshot();
  });

  it('getLabObjetivos por id (con estado fijo)', () => {
    const salida: Record<string, ReturnType<typeof getLabObjetivos>> = {};
    for (const id of ALL_IDS) salida[id] = getLabObjetivos(id, STATE);
    expect(salida).toMatchSnapshot();
  });
});
