/**
 * SACA A LOS LABS DE INTERNET: TRAE AL REPO EL MOTOR 3D Y LA TIPOGRAFÍA.
 *
 * EL PROBLEMA QUE RESUELVE. Los 121 labs 3D cargan su motor de
 * `cdn.jsdelivr.net` en tiempo de ejecución:
 *
 *     "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js"
 *
 * Eso significa que un salón sin internet, o con el filtro de la escuela
 * bloqueando dominios que no estén en su lista, o con jsdelivr caído, no ve un
 * error: ve 121 pantallas negras. Y no hay nada en la plataforma que avise —el
 * HTML carga, el CSS pinta, y el `<script type="module">` simplemente no llega
 * a ejecutarse—. Para una plataforma que va a operar en escuelas, esa es la
 * diferencia entre «funciona» y «funciona si hay internet».
 *
 * POR QUÉ 0.160.0 Y NO LA QUE ESTÁ EN `node_modules`. Ahí hay una 0.184.0, que
 * es la que usan los simuladores React de biología. Los labs estáticos se
 * escribieron y se verificaron uno por uno contra la 0.160, y entre esas dos
 * versiones three cambió el manejo de espacios de color, partió el build en
 * `three.core.js` y tocó el pipeline de postproceso. Cambiarlas de versión de
 * paso, mientras se arregla otra cosa, es meter 121 regresiones a ciegas.
 * Se congela la versión que está probada; subirla es un trabajo aparte, con su
 * propio barrido.
 *
 * QUÉ BAJA. El build más los ONCE módulos de `examples/jsm` que los labs
 * importan, y la clausura de lo que esos módulos importan a su vez —un
 * `EffectComposer` arrastra `Pass.js`, `ShaderPass.js` y varios shaders—. Se
 * sigue la cadena leyendo los `import` de cada archivo, no adivinando.
 *
 * LA TIPOGRAFÍA VA EN EL MISMO VIAJE. Los labs piden «Outfit» a
 * `fonts.googleapis.com`. Sin internet eso no deja la pantalla negra —cae al
 * `system-ui` del final de la pila— pero cambia el aspecto de los 121 labs
 * según dónde se abran, y en un proyector delante de un grupo eso se nota. Son
 * seis archivos woff2 y pesan menos que una portada.
 *
 *   node scripts/vendor-labs.mjs              baja y reescribe los labs
 *   node scripts/vendor-labs.mjs --comprueba  sólo dice si queda algo externo
 */
import { mkdir, writeFile, readFile, readdir, access } from 'node:fs/promises';
import { join, dirname, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const LABS = join(RAIZ, 'public', 'labs');

/** La versión contra la que están verificados los 121 labs. No se sube de paso. */
export const VERSION = '0.160.0';
const ORIGEN = `https://cdn.jsdelivr.net/npm/three@${VERSION}`;
const DESTINO = join(LABS, 'vendor', `three@${VERSION}`);

/** Lo que la página pondrá en su importmap una vez traído todo. */
export const IMPORTMAP = `<script type="importmap">
{ "imports": {
  "three": "/labs/vendor/three@${VERSION}/build/three.module.min.js",
  "three/addons/": "/labs/vendor/three@${VERSION}/examples/jsm/"
}}
</script>`;

/* Las rutas relativas a la raíz del paquete. Las de addons son sólo las
   ENTRADAS: lo que ellas importen se descubre siguiendo la cadena. */
const ENTRADAS = [
  'build/three.module.min.js',
  'examples/jsm/controls/OrbitControls.js',
  'examples/jsm/environments/RoomEnvironment.js',
  'examples/jsm/geometries/RoundedBoxGeometry.js',
  'examples/jsm/objects/Reflector.js',
  'examples/jsm/postprocessing/EffectComposer.js',
  'examples/jsm/postprocessing/RenderPass.js',
  'examples/jsm/postprocessing/OutputPass.js',
  'examples/jsm/postprocessing/UnrealBloomPass.js',
  'examples/jsm/postprocessing/SMAAPass.js',
  'examples/jsm/postprocessing/GTAOPass.js',
  'examples/jsm/postprocessing/BokehPass.js',
];

const COMPRUEBA = process.argv.includes('--comprueba');
const hay = (p) => access(p).then(() => true, () => false);

/** Los `import`/`export … from` RELATIVOS de un módulo. Los bare los cubre el importmap. */
function relativosDe(fuente) {
  const rutas = new Set();
  const re = /(?:^|[\s;}])(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]/g;
  for (const m of fuente.matchAll(re)) if (m[1].startsWith('.')) rutas.add(m[1]);
  // `import 'x.js'` sin bindings, que los shaders usan poco pero existe.
  for (const m of fuente.matchAll(/import\s*['"](\.[^'"]+)['"]/g)) rutas.add(m[1]);
  return [...rutas];
}

async function traer() {
  const pendientes = [...ENTRADAS];
  const vistos = new Set();
  let bajados = 0;
  let saltados = 0;

  while (pendientes.length) {
    const rel = posix.normalize(pendientes.shift());
    if (vistos.has(rel)) continue;
    vistos.add(rel);

    const destino = join(DESTINO, rel);
    let fuente;
    if (await hay(destino)) {
      fuente = await readFile(destino, 'utf8');
      saltados += 1;
    } else {
      if (COMPRUEBA) {
        console.error(`  FALTA ${rel}`);
        continue;
      }
      const r = await fetch(`${ORIGEN}/${rel}`);
      if (!r.ok) throw new Error(`${r.status} al bajar ${rel}`);
      fuente = await r.text();
      await mkdir(dirname(destino), { recursive: true });
      await writeFile(destino, fuente, 'utf8');
      bajados += 1;
      if (bajados % 10 === 0) console.log(`  ${bajados} archivos…`);
    }
    // El build minificado no arrastra nada; los addons sí.
    if (rel.startsWith('examples/')) {
      for (const r of relativosDe(fuente)) pendientes.push(posix.join(posix.dirname(rel), r));
    }
  }
  return { total: vistos.size, bajados, saltados };
}

/** Cambia el importmap de un lab. Devuelve `false` si ya estaba local. */
function reescribe(html) {
  const re = /<script type="importmap">[\s\S]*?<\/script>/;
  const actual = html.match(re);
  if (!actual) return null;              // este HTML no es un lab 3D
  if (actual[0] === IMPORTMAP) return false;
  if (!actual[0].includes('cdn.jsdelivr.net')) return false;
  return html.replace(re, IMPORTMAP);
}


/* ─── LA TIPOGRAFÍA ──────────────────────────────────────────────────────────
   Google Fonts responde un CSS distinto según el `User-Agent`: al navegador
   moderno le manda woff2 y a uno viejo, ttf. Se pide con un UA moderno a
   propósito, se bajan los woff2 y se reescribe el CSS apuntando a la copia
   local. El `unicode-range` de cada @font-face se conserva tal cual: es lo que
   hace que el navegador baje sólo el trozo del alfabeto que la página usa. */
const FUENTE_URL = 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap';
const UA_MODERNO = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const FUENTE_DIR = join(LABS, 'vendor', 'outfit');

/** El `<link>` local que sustituye a los tres del encabezado. */
export const ENLACE_FUENTE = '<link href="/labs/vendor/outfit/outfit.css" rel="stylesheet">';

async function traerFuente() {
  const cssLocal = join(FUENTE_DIR, 'outfit.css');
  if (await hay(cssLocal)) return { archivos: 0, yaEstaba: true };
  if (COMPRUEBA) { console.error('  FALTA vendor/outfit/outfit.css'); return { archivos: 0, yaEstaba: false }; }

  const r = await fetch(FUENTE_URL, { headers: { 'User-Agent': UA_MODERNO } });
  if (!r.ok) throw new Error(`${r.status} al pedir el CSS de Outfit`);
  let css = await r.text();

  await mkdir(FUENTE_DIR, { recursive: true });
  const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((m) => m[1]))];
  for (const url of urls) {
    const nombre = url.split('/').pop();
    const f = await fetch(url);
    if (!f.ok) throw new Error(`${f.status} al bajar ${nombre}`);
    await writeFile(join(FUENTE_DIR, nombre), Buffer.from(await f.arrayBuffer()));
    css = css.split(url).join(`./${nombre}`);
  }
  await writeFile(cssLocal, css, 'utf8');
  return { archivos: urls.length, yaEstaba: false };
}

/**
 * Cambia por el enlace local los tres `<link>` del encabezado: los dos
 * `preconnect` —que sin CDN sólo sirven para que el navegador intente abrir una
 * conexión que no va a ninguna parte— y la hoja de estilo de la fuente.
 */
const RE_FUENTE = new RegExp(
  [
    '[ \\t]*<link rel="preconnect" href="https://fonts\\.googleapis\\.com">\\s*\\n',
    '[ \\t]*<link rel="preconnect" href="https://fonts\\.gstatic\\.com" crossorigin>\\s*\\n',
    '[ \\t]*<link href="https://fonts\\.googleapis\\.com/css2[^"]*" rel="stylesheet">',
  ].join(''),
);

function reescribeFuente(html) {
  if (html.includes('/labs/vendor/outfit/outfit.css')) return null;
  if (!RE_FUENTE.test(html)) return null;
  return html.replace(RE_FUENTE, ENLACE_FUENTE);
}

const { total, bajados, saltados } = await traer();
console.log(`three@${VERSION}: ${total} módulos (${bajados} bajados, ${saltados} ya estaban)`);

const fuente = await traerFuente();
console.log(fuente.yaEstaba ? 'Outfit: ya estaba' : `Outfit: ${fuente.archivos} woff2 bajados`);

if (COMPRUEBA) {
  const labs = (await readdir(LABS)).filter((n) => n.endsWith('.html'));
  /* Cualquier host externo cuenta, no sólo jsdelivr: la promesa que se está
     comprobando es «este lab arranca sin internet», y una la rompe igual que
     tres. */
  const RE_EXTERNO = /https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)/;
  const fuera = [];
  for (const n of labs) {
    if (RE_EXTERNO.test(await readFile(join(LABS, n), 'utf8'))) fuera.push(n);
  }
  if (fuera.length) {
    console.error(`\n‼️  ${fuera.length} lab(s) siguen pidiendo algo a internet para arrancar: ${fuera.slice(0, 5).join(', ')}…`);
    process.exit(1);
  }
  console.log(`Los ${labs.length} labs arrancan sin internet.`);
  process.exit(0);
}

const labs = (await readdir(LABS)).filter((n) => n.endsWith('.html'));
let tocados = 0;
let conFuente = 0;
for (const n of labs) {
  const ruta = join(LABS, n);
  let html = await readFile(ruta, 'utf8');
  let cambiado = false;

  const conMotor = reescribe(html);
  if (conMotor) { html = conMotor; cambiado = true; tocados += 1; }

  const conTipo = reescribeFuente(html);
  if (conTipo) { html = conTipo; cambiado = true; conFuente += 1; }

  if (cambiado) await writeFile(ruta, html, 'utf8');
}
console.log(`importmap reescrito en ${tocados} de ${labs.length} labs`);
console.log(`tipografía local en ${conFuente} de ${labs.length} labs`);
