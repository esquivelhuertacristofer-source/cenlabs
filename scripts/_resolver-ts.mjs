/**
 * Gancho de resolución para correr fuentes TypeScript de `src/` desde un script
 * suelto de Node.
 *
 * Node 22 sabe quitar los tipos (`--experimental-strip-types`) pero no sabe
 * completar la extensión: dentro del código de la plataforma los imports son
 * `./decir`, como los escribe Next, y aquí hay que volverlos `./decir.ts`.
 * También resuelve el alias `@/` a `src/`.
 *
 * Existe para que la lógica que comparten el navegador y los scripts de build
 * —`src/lib/voz/`— viva en UN solo archivo en vez de estar copiada a mano en
 * los dos lados, que es como se acaban desincronizando.
 *
 *   node --experimental-strip-types --import ./scripts/_resolver-ts.mjs script.mjs
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)));

register(
  'data:text/javascript,' + encodeURIComponent(`
    import { existsSync } from 'node:fs';
    import { fileURLToPath } from 'node:url';
    const SRC = ${JSON.stringify(pathToFileURL(RAIZ + '/src/').href)};
    export async function resolve(especificador, contexto, siguiente) {
      let e = especificador;
      if (e.startsWith('@/')) e = SRC + e.slice(2);
      if ((e.startsWith('.') || e.startsWith('file:')) && !/\\.[a-z]+$/i.test(e)) {
        const base = new URL(e, contexto.parentURL);
        for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx', '.js']) {
          const prueba = new URL(base.href + ext);
          if (existsSync(fileURLToPath(prueba))) return siguiente(prueba.href, contexto);
        }
      }
      return siguiente(e, contexto);
    }
  `),
);
