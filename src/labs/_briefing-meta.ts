/**
 * src/labs/_briefing-meta.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * API pública del mapa MÍNIMO de briefings: sólo lo que el SERVIDOR necesita.
 *
 * El briefing completo de cada lab ya no viaja como código: vive en
 * `public/labs-data/briefing/<id>.json` y el cliente lo pide al montar (ver
 * `src/data/briefingConfigs.ts`). Pero `generateMetadata()` corre en el worker,
 * antes de que exista un cliente, y necesita el título y la descripción para el
 * `<title>` y la `<meta name="description">`.
 *
 * Así que de los 885 KB de prosa el worker se queda con estos tres campos por lab
 * (~40 KB en total). Es la única parte del briefing que sigue siendo código, y lo
 * es porque su salida tiene que estar en el HTML que devuelve el servidor.
 *
 * Lo genera scripts/gen-lab-briefings.mjs a partir de src/labs/<id>/briefing.ts.
 */
import { BRIEFING_META } from './_briefing-meta.generated';

export interface BriefingMeta {
  titulo: string;
  subtitulo: string;
  /** `bienvenida.substring(0, 160)`: el respaldo de la meta description. */
  bienvenidaCorta: string;
}

export { BRIEFING_META };
