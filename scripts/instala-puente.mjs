/**
 * Pone `_puente.js` en los 121 labs, y comprueba que sigue puesto.
 *
 * El puente es lo que hace que un lab de mecánica deje rastro (ver
 * `public/labs/_puente.js`). Va como `<script>` clásico al final del cuerpo,
 * detrás de las fichas, por dos razones: no es un módulo —no necesita
 * `importmap` ni `type="module"`— y tiene que cargar DESPUÉS de que el lab haya
 * tenido ocasión de definir `window.__labDebug`.
 *
 * Es idempotente: un lab que ya lo tiene no se toca. Los labs nuevos lo heredan
 * del donor a través de `build-lab.mjs`, así que esto sólo hace falta para los
 * que ya existían y como red de seguridad.
 *
 *   node scripts/instala-puente.mjs              lo instala donde falte
 *   node scripts/instala-puente.mjs --comprueba  falla si falta en alguno
 */
import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const LABS = join(RAIZ, 'public', 'labs');
const COMPRUEBA = process.argv.includes('--comprueba');

export const ETIQUETA = '  <!-- Puente con la plataforma · reporta avance al shell (ver _puente.js) -->\n'
  + '  <script src="_puente.js"></script>\n';

await access(join(LABS, '_puente.js')).catch(() => {
  console.error('No existe public/labs/_puente.js');
  process.exit(1);
});

const labs = (await readdir(LABS)).filter((n) => n.endsWith('.html'));
const sin = [];
let puestos = 0;

for (const n of labs) {
  const ruta = join(LABS, n);
  const html = await readFile(ruta, 'utf8');
  if (html.includes('_puente.js')) continue;

  if (COMPRUEBA) { sin.push(n); continue; }

  /* Antes de `</body>`, que es después de las fichas. Si un lab no tuviera
     `</body>` —no debería, los genera todos build-lab.mjs— se deja como está y
     se avisa, en vez de pegar el script en un sitio cualquiera. */
  if (!html.includes('</body>')) { sin.push(n); continue; }
  await writeFile(ruta, html.replace('</body>', ETIQUETA + '</body>'), 'utf8');
  puestos += 1;
}

if (COMPRUEBA) {
  if (sin.length) {
    console.error(`‼️  ${sin.length} lab(s) sin puente: ${sin.slice(0, 6).join(', ')}${sin.length > 6 ? '…' : ''}`);
    process.exit(1);
  }
  console.log(`Los ${labs.length} labs llevan el puente.`);
  process.exit(0);
}

console.log(`puente instalado en ${puestos} lab(s); ${labs.length - puestos - sin.length} ya lo tenían`);
if (sin.length) console.error(`  sin </body>, no tocados: ${sin.join(', ')}`);
