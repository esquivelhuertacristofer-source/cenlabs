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

/**
 * Deriva un `Record<id, valor>` de un campo del registro, para los facades de
 * datos. Omite los ids cuyo campo es `undefined` (p.ej. `objetivos` opcional),
 * de modo que el spread `{ ...LEGACY, ...fromRegistry('x') }` no sobrescriba con
 * huecos. Con el registro vacío devuelve `{}` ⇒ el facade == legacy.
 */
export function fromRegistry<K extends keyof LabModule>(
  key: K
): Record<string, NonNullable<LabModule[K]>> {
  const out: Record<string, NonNullable<LabModule[K]>> = {};
  for (const [id, lab] of Object.entries(LABS)) {
    const value = lab[key];
    if (value !== undefined) out[id] = value as NonNullable<LabModule[K]>;
  }
  return out;
}

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
