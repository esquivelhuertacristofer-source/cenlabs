/**
 * Escribe `src/lib/voz/hecha.ts` leyendo lo que DE VERDAD hay en disco.
 *
 * La página nunca debe pedir un archivo que no existe. Y no basta con «tiene
 * carpeta»: un lab al que le falte una frase suelta deja a la locutora callada
 * en mitad del párrafo delante del grupo, que es peor que no tener bocina. Así
 * que un lab entra sólo si están TODOS sus clips, contados contra la misma
 * fuente con la que se grabaron.
 *
 * Va la lista de LABS, no la de los 6 668 clips: los clips de un lab se generan
 * todos de una vez desde el mismo briefing, así que o están todos o no está
 * ninguno, y meter 6 668 cadenas en el paquete que baja el navegador serían
 * ~180 KB para decir algo que se dice con 3.
 *
 *   npm run voz:manifiesto
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VOZ = join(RAIZ, 'public', 'assets', 'voz');
const FUENTE = join(RAIZ, 'zz-voz.json');
const SALIDA = join(RAIZ, 'src', 'lib', 'voz', 'hecha.ts');

if (!existsSync(FUENTE)) {
  console.error('Falta zz-voz.json. Corre antes:  npm run voz:extraer');
  process.exit(1);
}

/* Cuántos clips DEBE tener cada lab, según la misma lista con la que se
   grabaron. Sin este contraste, «tiene 40 archivos» no dice nada. */
const esperados = new Map();
for (const f of JSON.parse(readFileSync(FUENTE, 'utf8'))) {
  esperados.set(f.carpeta, (esperados.get(f.carpeta) ?? 0) + 1);
}

const completos = [];
const incompletos = [];
const hayCarpeta = existsSync(VOZ);
for (const [lab, debe] of [...esperados.entries()].sort()) {
  const dir = join(VOZ, lab);
  const hay = hayCarpeta && existsSync(dir)
    ? readdirSync(dir).filter((n) => n.endsWith('.mp3')).length
    : 0;
  if (hay >= debe) completos.push(lab);
  else incompletos.push(`${lab} ${hay}/${debe}`);
}

writeFileSync(SALIDA, `/**
 * GENERADO POR \`scripts/voz/manifiesto-voz.mjs\`. No editar a mano.
 *
 * Los labs cuya portada de misión ya está grabada con la voz de la plataforma
 * (\`es-MX-DaliaNeural\`). Un lab entra aquí sólo si tiene TODAS sus frases:
 * media portada con voz es una bocina que a veces enmudece delante del grupo.
 *
 * Para regenerar todo:  npm run voz
 */

const CON_VOZ: ReadonlySet<string> = new Set([
${completos.map((c) => `  '${c}',`).join('\n')}
]);

/** ¿Se puede escuchar la portada de misión de este lab? */
export function tieneVoz(labId: string): boolean {
  return CON_VOZ.has(labId);
}

/** Cuántos labs se pueden escuchar. Para el contador de avance del panel. */
export const LABS_CON_VOZ = CON_VOZ.size;
`, 'utf8');

console.log(`src/lib/voz/hecha.ts  ${completos.length} labs completos de ${esperados.size}`);
if (incompletos.length) {
  console.log(`  fuera por incompletos (${incompletos.length}):`);
  for (const i of incompletos.slice(0, 12)) console.log('   ', i);
  if (incompletos.length > 12) console.log(`    … y ${incompletos.length - 12} más`);
}
