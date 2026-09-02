/**
 * BARRIDO DE RUNTIME DE LOS LABS ESTÁTICOS.
 *
 * Las pruebas de jest comprueban el CATÁLOGO —que el título esté, que el archivo
 * exista— pero ninguna abre el lab. Un lab puede estar perfectamente registrado y
 * pintar una pantalla negra: los errores de `three`, los `undefined is not a
 * function` del body y los 404 de las fichas sólo aparecen cuando un navegador de
 * verdad ejecuta el módulo. Eso es lo que hace esto.
 *
 * Por cada lab abre la página en Chromium, espera a que el módulo arranque y
 * apunta TRES cosas distintas, que fallan por razones distintas:
 *
 *   errores    excepciones no capturadas y console.error del propio lab
 *   faltantes  peticiones que respondieron 404 (fichas, texturas, portadas)
 *   escena     si el canvas acabó pintando algo o se quedó en negro
 *
 * El canvas se mide, no se supone: se leen los píxeles y se cuenta cuántos
 * colores distintos hay. Una pantalla negra tiene uno.
 *
 *   node scripts/auditoria/barrido-labs.mjs                 los 121
 *   node scripts/auditoria/barrido-labs.mjs --solo buck,zener
 *   node scripts/auditoria/barrido-labs.mjs --sin-red       simula escuela sin CDN
 */
import { createServer } from 'node:http';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(AQUI, '..', '..');
const PUBLICO = join(RAIZ, 'public');

const args = process.argv.slice(2);
const SIN_RED = args.includes('--sin-red');
const soloArg = args.find((a) => a.startsWith('--solo'));
const SOLO = soloArg ? (soloArg.includes('=') ? soloArg.split('=')[1] : args[args.indexOf(soloArg) + 1]).split(',') : null;

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };

/* Servidor mínimo sobre public/. Los labs usan importmap + <script type="module">,
   que el navegador bloquea bajo file:// — tiene que ser HTTP sí o sí. */
const servidor = createServer(async (req, res) => {
  const ruta = decodeURIComponent(req.url.split('?')[0]);
  try {
    const cuerpo = await readFile(join(PUBLICO, ruta));
    res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] ?? 'application/octet-stream' });
    res.end(cuerpo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404');
  }
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;

let labs = (await readdir(join(PUBLICO, 'labs')))
  .filter((n) => n.endsWith('.html'))
  .sort();
if (SOLO) labs = labs.filter((n) => SOLO.some((s) => n.includes(s)));

console.log(`${labs.length} labs · ${BASE}${SIN_RED ? ' · SIN RED (CDN bloqueado)' : ''}\n`);

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--disable-gpu-sandbox'] });
const informe = [];

/* CUATRO A LA VEZ. Un lab de estos monta una escena de three.js entera y aqui
   se rasteriza por software (SwiftShader), asi que cada uno tarda entre diez y
   treinta segundos: en fila india los 121 son mas de una hora. Cuatro es donde
   deja de mejorar en una maquina de escritorio y empieza a falsear los tiempos
   de carga por competir entre si. */
const A_LA_VEZ = Number(process.env.BARRIDO_A_LA_VEZ ?? 4);

/* CUÁNTO SE LE DA A UN LAB PARA ABRIR. Treinta segundos parecían de sobra para
   un archivo servido desde la propia máquina, y con la máquina libre lo son.
   Con carga —el barrido compitiendo con otra cosa— diecinueve labs agotaron ese
   plazo a la vez, todos con el mismo síntoma, y al repetirlos en limpio
   abrieron. O sea que ese número no medía el lab: medía la máquina. Se sube a
   noventa para que un informe rojo signifique algo. */
const ESPERA_MS = Number(process.env.BARRIDO_ESPERA_MS ?? 90000);

/* Cuánto se espera a que la escena aparezca de verdad. Ver la nota junto a la
   medición: el plazo fijo anterior producía falsos negativos. */
const ESPERA_PINTADO_MS = Number(process.env.BARRIDO_PINTADO_MS ?? 45000);

async function revisa(archivo) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 800 } });
  const pagina = await ctx.newPage();

  const errores = [];
  const faltantes = [];
  pagina.on('pageerror', (e) => errores.push(String(e.message).slice(0, 160)));
  pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text().slice(0, 160)); });
  pagina.on('response', (r) => { if (r.status() === 404) faltantes.push(new URL(r.url()).pathname); });
  pagina.on('requestfailed', (r) => faltantes.push('SIN RESPUESTA ' + new URL(r.url()).pathname));

  // El modo --sin-red corta SOLO lo externo: el aula que tiene la plataforma en
  // la red local pero el CDN bloqueado por el filtro de la escuela.
  if (SIN_RED) await ctx.route('**/*', (ruta) => (new URL(ruta.request().url()).hostname === '127.0.0.1' ? ruta.continue() : ruta.abort()));

  let escena = null;
  try {
    await pagina.goto(`${BASE}/labs/${archivo}`, { waitUntil: 'domcontentloaded', timeout: ESPERA_MS });
    await pagina.waitForTimeout(SIN_RED ? 1200 : 2500);

    const hayCanvas = await pagina.evaluate(() => !!document.querySelector('canvas'));
    /* LA ESCENA SE MIDE POR CAPTURA, NO LEYENDO EL CANVAS. Un `drawImage` sobre
       un canvas de WebGL devuelve negro salvo que el contexto se haya creado con
       `preserveDrawingBuffer`, que ninguno de estos labs hace ni debe hacer: el
       navegador tira el buffer en cuanto compone el cuadro. La captura de
       Playwright pasa por el compositor, que es donde la imagen sí existe.

       Y SE ESPERA A QUE PINTE, no un plazo fijo. Con un plazo fijo de seis
       segundos este barrido declaró «canvas en negro» un lab que estaba
       perfecto: sólo tardaba más en montar su escena rasterizada por software.
       Ahora se vuelve a mirar hasta que haya imagen de verdad, y sólo se declara
       negro lo que sigue vacío al agotar el plazo. */
    let colores = -1;
    if (hayCanvas) {
      const limite = Date.now() + ESPERA_PINTADO_MS;
      do {
        const png = await pagina.screenshot({ type: 'png' });
        colores = await pagina.evaluate(async (b64) => {
          const img = new Image();
          img.src = 'data:image/png;base64,' + b64;
          await img.decode();
          const m = document.createElement('canvas');
          m.width = 48; m.height = 30;
          const g = m.getContext('2d');
          g.drawImage(img, 0, 0, 48, 30);
          const d = g.getImageData(0, 0, 48, 30).data;
          const vistos = new Set();
          for (let i = 0; i < d.length; i += 4) vistos.add(`${d[i] >> 3},${d[i + 1] >> 3},${d[i + 2] >> 3}`);
          return vistos.size;
        }, png.toString('base64'));
        if (colores > 3) break;
        await pagina.waitForTimeout(1500);
      } while (Date.now() < limite);
    }
    escena = { hayCanvas, colores, debug: await pagina.evaluate(() => typeof window.__labDebug === 'object') };
  } catch (e) {
    errores.push('NAVEGACIÓN: ' + String(e.message).slice(0, 120));
  }

  const unicos = [...new Set(errores)];
  const faltantesU = [...new Set(faltantes)];
  const negro = escena?.hayCanvas && escena.colores >= 0 && escena.colores <= 3;
  const ok = unicos.length === 0 && faltantesU.length === 0 && escena?.hayCanvas && !negro;

  informe.push({ lab: archivo, ok, errores: unicos, faltantes: faltantesU, escena });
  const marca = ok ? '  ok' : ' ‼️ ';
  const detalle = [
    !escena?.hayCanvas ? 'SIN CANVAS' : negro ? `CANVAS EN NEGRO (${escena.colores} colores)` : null,
    unicos.length ? `${unicos.length} error(es)` : null,
    faltantesU.length ? `${faltantesU.length} faltante(s)` : null,
  ].filter(Boolean).join(' · ');
  console.log(`${marca} ${archivo.padEnd(52)} ${detalle}`);
  if (!ok) {
    for (const e of unicos.slice(0, 3)) console.log(`        ✗ ${e}`);
    for (const f of faltantesU.slice(0, 3)) console.log(`        ⌀ ${f}`);
  }
  await ctx.close();
}

const cola = [...labs];
await Promise.all(Array.from({ length: A_LA_VEZ }, async () => {
  for (let n = cola.shift(); n; n = cola.shift()) await revisa(n);
}));
informe.sort((a, b) => a.lab.localeCompare(b.lab));

await navegador.close();
servidor.close();

const rotos = informe.filter((i) => !i.ok);
console.log(`\n${informe.length - rotos.length} sanos · ${rotos.length} con hallazgos`);

await mkdir(join(AQUI, '.salida'), { recursive: true });
const nombre = SIN_RED ? 'barrido-sin-red.json' : 'barrido.json';
await writeFile(join(AQUI, '.salida', nombre), JSON.stringify(informe, null, 1), 'utf8');
console.log(`informe en scripts/auditoria/.salida/${nombre}`);
