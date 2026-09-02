/**
 * SACA DE LOS 160 BRIEFINGS TODO LO QUE HAY QUE DECIR EN VOZ ALTA.
 *
 * No decide nada: la decisión de qué se narra, con qué nombre y con qué papel
 * está en `src/lib/voz/claves.ts`, que es el mismo archivo que usa el navegador
 * para saber qué MP3 pedir. Esto sólo recorre los briefings publicados y
 * escribe la lista que consume `narrar.py`.
 *
 * Emite también el RITMO de cada clip, ya resuelto. Así el narrador no tiene
 * copia propia de la tabla de papeles: si la tuviera, cambiar la dirección de
 * un papel serían dos ediciones en dos lenguajes y la segunda se olvida.
 *
 *   npm run voz:extraer
 *   node --experimental-strip-types scripts/voz/extraer-voz.mjs > zz-voz.json
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { clipsDeBriefing, ritmoDe } from '../../src/lib/voz/claves';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const BRIEFINGS = join(RAIZ, 'public', 'labs-data', 'briefing');

const salida = [];
for (const archivo of readdirSync(BRIEFINGS).filter((n) => n.endsWith('.json')).sort()) {
  const carpeta = archivo.replace(/\.json$/, '');
  const briefing = JSON.parse(readFileSync(join(BRIEFINGS, archivo), 'utf8'));
  for (const { clave, texto, papel } of clipsDeBriefing(briefing)) {
    salida.push({ carpeta, clave, texto, papel, ritmo: ritmoDe(papel) });
  }
}

process.stdout.write(JSON.stringify(salida, null, 1));
