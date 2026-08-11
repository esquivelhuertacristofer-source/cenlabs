import { BriefingConfig } from '@/components/MissionBriefing';

/**
 * Acceso a la portada de misión (briefing) de un lab.
 *
 * Ya NO hay un mapa con los 160 briefings cargados de golpe. Cada uno se publica
 * como activo estático en `public/labs-data/briefing/<id>.json` (lo genera
 * scripts/gen-lab-briefings.mjs a partir de src/labs/<id>/briefing.ts, que sigue
 * siendo el origen de la verdad) y se pide UNO, el del lab que se abre.
 *
 * ¿Por qué? El worker de Cloudflare inlinea en un solo archivo todo lo alcanzable
 * desde el código, y el plan gratuito lo topa en 3 MiB comprimidos. Los shells
 * (MecanicaShellClient, SimuladorClient) importaban el registro ENTERO para leer
 * UNA entrada, así que los 823 KB de prosa de los 160 labs viajaban al servidor —
 * dos veces, por el SSR de los componentes cliente— y el 2026-08-11 el despliegue
 * reventó por 58 KiB. La prosa no se ejecuta: no tiene por qué ser código.
 *
 * Cloudflare sirve estos JSON desde el borde sin invocar al worker.
 *
 * El servidor no usa este módulo: `generateMetadata` lee `BRIEFING_META`
 * (@/labs/_briefing-meta), que son sólo los tres campos del `<head>`.
 */

/** Ruta pública del briefing de un lab. Mismo esquema que emite el codegen. */
export const briefingUrl = (id: string) => `/labs-data/briefing/${encodeURIComponent(id)}.json`;

/**
 * Ya resueltos: volver a un lab en la misma sesión no vuelve a pedir la red.
 * Sólo se guardan los ACIERTOS. Cachear un fallo dejaría al alumno sin portada
 * para el resto de la sesión por un corte de red de un segundo; sin cachearlo,
 * volver a entrar al lab reintenta.
 */
const cache = new Map<string, BriefingConfig>();
/** En vuelo: dos componentes que piden el mismo id comparten una sola petición. */
const enVuelo = new Map<string, Promise<BriefingConfig | null>>();

async function pide(id: string): Promise<BriefingConfig | null> {
  try {
    const res = await fetch(briefingUrl(id), { cache: 'force-cache' });
    if (!res.ok) return null;
    return (await res.json()) as BriefingConfig;
  } catch {
    // Sin red o JSON corrupto. Devolver null y dejar que el llamador decida es
    // mejor que propagar: el lab en sí (un HTML en un <iframe>) sigue siendo
    // utilizable aunque falte su portada.
    return null;
  }
}

/**
 * Carga el briefing de `id`; si ese lab no tiene (o falla la petición), cae al de
 * `respaldoId`. El respaldo replica lo que hacían los shells cuando leían el mapa
 * completo: `ALL_BRIEFING_CONFIGS[id] ?? ALL_BRIEFING_CONFIGS['mecanica-1']`.
 *
 * Devuelve `null` si tampoco hay respaldo: el llamador debe tratarlo (no renderizar
 * MissionBriefing, que da por hecho un config).
 */
export async function cargaBriefing(
  id: string,
  respaldoId?: string
): Promise<BriefingConfig | null> {
  const cfg = await unaVez(id);
  if (cfg) return cfg;
  if (respaldoId && respaldoId !== id) return unaVez(respaldoId);
  return null;
}

function unaVez(id: string): Promise<BriefingConfig | null> {
  const ya = cache.get(id);
  if (ya) return Promise.resolve(ya);
  const yaVa = enVuelo.get(id);
  if (yaVa) return yaVa;
  const p = pide(id).then((cfg) => {
    if (cfg) cache.set(id, cfg);
    enVuelo.delete(id);
    return cfg;
  });
  enVuelo.set(id, p);
  return p;
}
