/**
 * src/labs/_types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Contrato compartido para el modelo de "un lab = una carpeta autocontenida".
 *
 * Se separan DOS contratos a propósito:
 *   - LabModule     → SOLO datos (server-safe). Alimenta los facades de datos
 *                     (ALL_BRIEFING_CONFIGS, MASTER_DATA, ALL_TUTOR_STEPS,
 *                     ALL_QUIZZES, getLabObjetivos).
 *   - LabComponents → SOLO los dynamic() de Piloto/Bitácora (client-only).
 *                     Alimenta los facades de componentes (PILOTO_REGISTRY,
 *                     BITACORA_REGISTRY).
 *
 * ¿Por qué la separación? La página [id]/page.tsx es un Server Component que
 * importa ALL_BRIEFING_CONFIGS. Si el registro de datos arrastrara los
 * next/dynamic de los componentes cliente, esos bundles entrarían al grafo del
 * servidor. Manteniéndolos en registros distintos, los datos quedan puros.
 *
 * `categoria` y `orden` NO son campos: se derivan del `id` (`quimica-1` →
 * categoría 'quimica', orden 1), igual que ya hace todo el código existente
 * (id.split('-')[0]). Menos boilerplate y cero riesgo de orden duplicado.
 */
import type { BriefingConfig }             from '@/components/MissionBriefing';
import type { SimuladorContenido }         from '@/data/simuladoresData';
import type { TutorStep }                  from '@/components/DrQuantumTutor';
import type { Question }                   from '@/components/LabQuiz';
import type { Objetivo, ObjetivosState }   from '@/data/labObjetivos';
import type { ComponentType }              from 'react';

export type Categoria =
  | 'quimica'
  | 'fisica'
  | 'matematicas'
  | 'biologia'
  | 'mecanica';

/** Datos autocontenidos de un lab (server-safe: sin componentes cliente). */
export interface LabModule {
  /** Identidad canónica, p.ej. 'quimica-1'. Debe coincidir con el nombre de la carpeta. */
  id: string;
  contenido: SimuladorContenido;
  briefing: BriefingConfig;
  tutorSteps: TutorStep[];
  quiz: Question[];
  /** Opcional: solo ~14 labs definen objetivos hoy. */
  objetivos?: (state: ObjetivosState) => Objetivo[];
}

/** Componentes pesados (client-only) de un lab: resultado de dynamic(). */
export interface LabComponents {
  Piloto: ComponentType<any>;
  Bitacora: ComponentType<any>;
}

/** Deriva la categoría a partir del id ('quimica-1' → 'quimica'). */
export function categoriaDeId(id: string): Categoria {
  return id.split('-')[0] as Categoria;
}

/** Deriva el orden dentro de la categoría a partir del id ('quimica-7' → 7). */
export function ordenDeId(id: string): number {
  return parseInt(id.split('-')[1] ?? '0', 10) || 0;
}
