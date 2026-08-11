/**
 * src/labs/_types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Contrato compartido para el modelo de "un lab = una carpeta autocontenida".
 *
 * Se separan DOS contratos a propósito:
 *   - LabModule     → SOLO datos (server-safe). Alimenta los facades de datos
 *                     (MASTER_DATA, ALL_TUTOR_STEPS, ALL_QUIZZES, getLabObjetivos).
 *   - LabComponents → SOLO los dynamic() de Piloto/Bitácora (client-only).
 *                     Alimenta los facades de componentes (PILOTO_REGISTRY,
 *                     BITACORA_REGISTRY).
 *
 * ¿Por qué la separación? La página [id]/page.tsx es un Server Component. Si el
 * registro de datos arrastrara los next/dynamic de los componentes cliente, esos
 * bundles entrarían al grafo del servidor. Manteniéndolos en registros distintos,
 * los datos quedan puros.
 *
 * `categoria` y `orden` NO son campos: se derivan del `id` (`quimica-1` →
 * categoría 'quimica', orden 1), igual que ya hace todo el código existente
 * (id.split('-')[0]). Menos boilerplate y cero riesgo de orden duplicado.
 */
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

/**
 * Datos autocontenidos de un lab (server-safe: sin componentes cliente).
 *
 * DOS clases de lab conviven en este contrato:
 *   - Labs "2.5D" (química/física/matemáticas/biología): definen `contenido`,
 *     `tutorSteps` y `quiz` — el simulador es React (Piloto/Bitácora) y el
 *     alumno resuelve un quiz.
 *   - Labs "iframe 3D" (mecánica): el simulador es un HTML three.js embebido por
 *     `<iframe>` (ver CatalogoEntry.simuladorHtml). NO tienen contenido/tutor/quiz,
 *     por eso esos campos son opcionales. `fromRegistry` ya omite los `undefined`,
 *     así que un lab iframe no ensucia MASTER_DATA / ALL_TUTOR_STEPS / ALL_QUIZZES:
 *     su `index.ts` sólo declara el `id`, que es lo que lo da de alta en LABS.
 *
 * `briefing` NO es un campo de este contrato, aunque todo lab tenga uno. La
 * portada de misión es prosa —no se ejecuta, no se ramifica, sólo se lee— y el
 * worker de Cloudflare inlinea en un solo archivo todo lo que sea alcanzable
 * desde el código: los 160 briefings eran 823 KB dentro de un worker topado en
 * 3 MiB comprimidos. Así que `src/labs/<id>/briefing.ts` sigue siendo el origen
 * de la verdad, pero se PUBLICA como activo estático en
 * `public/labs-data/briefing/<id>.json` (ver scripts/gen-lab-briefings.mjs) y el
 * cliente lo pide al montar. Ver `_briefing-meta.ts` y `@/data/briefingConfigs`.
 */
export interface LabModule {
  /** Identidad canónica, p.ej. 'quimica-1'. Debe coincidir con el nombre de la carpeta. */
  id: string;
  /** Solo labs 2.5D (React): datos del simulador. Ausente en labs iframe 3D. */
  contenido?: SimuladorContenido;
  /** Solo labs 2.5D (React): pasos del tutor. Ausente en labs iframe 3D. */
  tutorSteps?: TutorStep[];
  /** Solo labs 2.5D (React): preguntas del quiz. Ausente en labs iframe 3D. */
  quiz?: Question[];
  /** Opcional: solo ~14 labs definen objetivos hoy. */
  objetivos?: (state: ObjetivosState) => Objetivo[];
}

/** Componentes pesados (client-only) de un lab: resultado de dynamic(). */
export interface LabComponents {
  Piloto: ComponentType<any>;
  Bitacora: ComponentType<any>;
}

/**
 * Metadatos de presentación de un lab para la página de catálogo de su categoría
 * (src/app/alumno/laboratorio/<cat>/page.tsx). Vive en un registro APARTE de
 * LabModule (CATALOGO, ver _catalogo.ts): cada src/labs/<id>/catalogo.ts sólo
 * importa este tipo (import type, se borra en runtime), así el registro es puro
 * string data. Separarlo de LabModule evita que una página "use client" arrastre
 * los datos pesados del lab (contenido/tutorSteps/quiz) al bundle.
 *
 * `id` y `orden` NO son campos: se derivan del nombre de la carpeta (ver
 * CatalogoItem en _catalogo.ts), igual que en LabModule.
 */
export interface CatalogoEntry {
  /** Módulo/pestaña dentro de la categoría, p.ej. 'Estequiometría'. */
  modulo: string;
  titulo: string;
  duracion: string;
  teoria: string;
  /** 'activo' | 'completado' | 'propuesto' … (controla el estilo de la ficha). */
  estado: string;
  /** Marca la práctica sugerida/destacada de la categoría. */
  destacada?: boolean;
  /**
   * Solo labs iframe 3D (mecánica): ruta pública del HTML three.js que el shell
   * embebe por `<iframe>` (p.ej. '/labs/motor-electrico.html'). Vive aquí — en el
   * registro LIVIANO client-safe — a propósito: el shell (MecanicaShellClient,
   * "use client") lo lee sin arrastrar datos pesados, y así NO toca BriefingConfig
   * (que está congelado byte-a-byte por el golden de los briefings).
   */
  simuladorHtml?: string;
}

/** Deriva la categoría a partir del id ('quimica-1' → 'quimica'). */
export function categoriaDeId(id: string): Categoria {
  return id.split('-')[0] as Categoria;
}

/** Deriva el orden dentro de la categoría a partir del id ('quimica-7' → 7). */
export function ordenDeId(id: string): number {
  return parseInt(id.split('-')[1] ?? '0', 10) || 0;
}
