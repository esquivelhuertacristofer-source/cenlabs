/**
 * src/labs/_catalogo.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API pública del registro de CATÁLOGO (metadatos de presentación por lab). Las
 * páginas de catálogo por categoría (src/app/alumno/laboratorio/<cat>/page.tsx,
 * "use client") importan `catalogoDeCategoria` desde aquí — nunca del .generated.
 *
 * Es un registro LIVIANO a propósito: cada src/labs/<id>/catalogo.ts sólo importa
 * el TIPO CatalogoEntry (import type, se borra en runtime), así que su grafo de
 * módulos es puro string data. Mantenerlo SEPARADO de LABS (_registry.ts) evita
 * que una página cliente arrastre los datos pesados del lab al bundle
 * (contenido/briefing/tutorSteps/quiz). Misma idea que la separación
 * datos ↔ componentes descrita en _types.ts.
 */
import { CATALOGO } from './_catalogo.generated';
import { categoriaDeId, ordenDeId } from './_types';
import type { CatalogoEntry, Categoria } from './_types';

export { CATALOGO };

/** Entrada de catálogo enriquecida con el `id` y su `orden` dentro de la categoría. */
export type CatalogoItem = CatalogoEntry & { id: string; orden: number };

/** Labs de una categoría que tienen catálogo, ordenados por su número. */
export function catalogoDeCategoria(categoria: Categoria): CatalogoItem[] {
  return Object.entries(CATALOGO)
    .filter(([id]) => categoriaDeId(id) === categoria)
    .map(([id, entry]) => ({ ...entry, id, orden: ordenDeId(id) }))
    .sort((a, b) => a.orden - b.orden);
}
