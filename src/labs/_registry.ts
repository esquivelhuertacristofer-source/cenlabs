/**
 * src/labs/_registry.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API pública del registro de DATOS de labs. Los facades de datos
 * (briefingConfigs, simuladoresData, tutorSteps, quizQuestions, labObjetivos)
 * importan `LABS` desde aquí — nunca desde el archivo .generated directamente.
 *
 * Server-safe: no arrastra ningún componente cliente (ver _types.ts).
 */
import { LABS } from './_registry.generated';
import { categoriaDeId, ordenDeId } from './_types';
import type { Categoria, LabModule } from './_types';

export { LABS };

/** Todos los labs de una categoría, ordenados por su número dentro de ella. */
export function labsByCategoria(categoria: Categoria): LabModule[] {
  return Object.values(LABS)
    .filter((lab) => categoriaDeId(lab.id) === categoria)
    .sort((a, b) => ordenDeId(a.id) - ordenDeId(b.id));
}

/** Ids presentes en el registro (los ya migrados a carpeta). */
export function labIds(): string[] {
  return Object.keys(LABS);
}
