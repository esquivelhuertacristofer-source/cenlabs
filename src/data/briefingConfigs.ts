import { BriefingConfig } from '@/components/MissionBriefing';
import { fromRegistry } from '@/labs/_registry';

/**
 * Facade de las configuraciones de briefing de TODOS los labs.
 *
 * Ya NO hay datos inline aquí: cada lab define su briefing en
 * src/labs/<id>/briefing.ts y el codegen lo agrega al registro LABS. Este facade
 * sólo proyecta el campo `briefing` de ese registro (fromRegistry omite los
 * undefined, así que un lab sin briefing no ensuciaría el resultado).
 *
 * Hasta la migración, este archivo contenía LEGACY_ALL_BRIEFING_CONFIGS con los
 * 10 briefings de mecánica hardcodeados. Se movieron VERBATIM a cada
 * src/labs/mecanica-N/briefing.ts; la prueba de que el traslado fue idéntico es
 * que el snapshot de data-stores.golden NO cambió al borrar el bloque LEGACY.
 */
export const ALL_BRIEFING_CONFIGS: Record<string, BriefingConfig> = fromRegistry('briefing');
