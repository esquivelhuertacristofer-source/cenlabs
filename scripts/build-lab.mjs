/**
 * scripts/build-lab.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Construye un lab 3D estático (public/labs/<out>.html) a partir de:
 *   1. Un DONOR: lab 3D existente cuyo framework (CSS + importmap + helpers de
 *      texturas/escena/picker/synth, líneas previas al marcador "LAB —") se
 *      reutiliza byte a byte. El framework es idéntico en todos los labs del
 *      molde; el donor canónico es escaner-obd.html.
 *   2. Un BODY: scripts/lab-src/<body>.js con el código específico del lab
 *      (escena, física, HUD, panel, interacción). Es la FUENTE DE VERDAD del
 *      lab: se edita el body y se re-corre este script, nunca el HTML generado.
 *   3. Un CONFIG: scripts/lab-src/<id>.json con títulos y fichas.
 *
 * Uso:
 *   node scripts/build-lab.mjs <id>            # lee scripts/lab-src/<id>.json
 *
 * Config JSON:
 *   {
 *     "donor": "escaner-obd.html",             // en public/labs/
 *     "out": "multimetro.html",                // en public/labs/
 *     "title": "CEN Labs · … — Laboratorio 3D",
 *     "lt": "… · …",                           // texto del topbar
 *     "inspectHint": "👆 Toca …",
 *     "body": "multimetro.body.js",            // en scripts/lab-src/
 *     "fichas": ["_ficha-tecnica.js", "_ficha-multimetro.js"]
 *   }
 *
 * Garantías (el script falla en vez de generar HTML corrupto):
 *   - el marcador de corte del donor existe y es único;
 *   - cada swap (title / lt / inspectHint) reemplaza EXACTAMENTE 1 ocurrencia;
 *   - el body no contiene "</script" (rompería el <script type="module">).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const LABS_PUB = join(ROOT, 'public', 'labs');
const LAB_SRC = join(__dirname, 'lab-src');

function fail(msg) {
  console.error(`\n✗ build-lab: ${msg}\n`);
  process.exit(1);
}

const id = process.argv[2];
if (!id) fail('Falta el <id>. Uso: node scripts/build-lab.mjs <id>');

const cfgPath = join(LAB_SRC, `${id}.json`);
if (!existsSync(cfgPath)) fail(`No existe ${cfgPath}`);
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));

for (const k of ['donor', 'out', 'title', 'lt', 'inspectHint', 'body', 'fichas']) {
  if (!cfg[k]) fail(`Config ${id}.json: falta el campo "${k}".`);
}

const donorPath = join(LABS_PUB, cfg.donor);
if (!existsSync(donorPath)) fail(`Donor no encontrado: ${donorPath}`);
const donor = readFileSync(donorPath, 'utf8');

const bodyPath = join(LAB_SRC, cfg.body);
if (!existsSync(bodyPath)) fail(`Body no encontrado: ${bodyPath}`);
const body = readFileSync(bodyPath, 'utf8');

// El </script del framework queda ANTES del corte; el body vive dentro del
// <script type="module"> abierto, así que no puede cerrarlo él mismo.
if (/<\/script/i.test(body)) fail(`El body ${cfg.body} contiene "</script" — cerraría el módulo del framework.`);

// ─── 1. Cortar el framework del donor ────────────────────────────────────────
// El marcador es la cabecera del bloque específico del lab del donor. El
// framework compartido es TODO lo anterior (CSS, importmap, texturas,
// createStage, roundedBox, pickerFor, labelSprite, makeSynth).
const MARKER = '/* ============================================================\n   LAB — ';
const first = donor.indexOf(MARKER);
if (first === -1) fail(`El donor ${cfg.donor} no contiene el marcador "LAB — ".`);
if (donor.indexOf(MARKER, first + 1) !== -1) fail(`Marcador "LAB — " duplicado en el donor.`);
let html = donor.slice(0, first);

// ─── 2. Swaps de identidad (exactamente 1 ocurrencia cada uno) ───────────────
function swapOne(label, re, replacement) {
  const matches = html.match(new RegExp(re.source, re.flags + 'g')) || [];
  if (matches.length !== 1) fail(`Swap "${label}": esperaba 1 ocurrencia, hallé ${matches.length}.`);
  html = html.replace(re, replacement);
}
swapOne('title', /<title>[^<]*<\/title>/, `<title>${cfg.title}</title>`);
swapOne('lt', /<div class="lt">[^<]*<\/div>/, `<div class="lt">${cfg.lt}</div>`);
swapOne('inspectHint', /<div class="inspectHint">[^<]*<\/div>/, `<div class="inspectHint">${cfg.inspectHint}</div>`);

// ─── 3. Ensamblar body + cierre ──────────────────────────────────────────────
const fichaTags = cfg.fichas.map((f) => `  <script src="${f}"></script>`).join('\n');
html += body
  + (body.endsWith('\n') ? '' : '\n')
  + '</script>\n'
  + '  <!-- Ficha técnica · Capa B del molde de lab 3D (componente compartido + contenido del lab) -->\n'
  + fichaTags + '\n'
  + '</body>\n'
  + '</html>\n';

const outPath = join(LABS_PUB, cfg.out);
writeFileSync(outPath, html, 'utf8');
const kb = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(1);
console.log(`✓ public/labs/${cfg.out} generado (${kb} KiB) — donor: ${cfg.donor}, body: ${cfg.body}`);

// Aviso si alguna ficha referenciada aún no existe (no es fatal: se crea después).
for (const f of cfg.fichas) {
  if (!existsSync(join(LABS_PUB, f))) console.warn(`⚠  Ficha referenciada aún no existe: public/labs/${f}`);
}
