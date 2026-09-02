/**
 * ¿EL PUENTE HABLA DE VERDAD?
 *
 * Las pruebas de `src/__tests__/puente.test.ts` cubren el lado del shell —qué se
 * hace con un mensaje— pero no que el mensaje SALGA. Eso sólo se sabe metiendo
 * el lab en un iframe de verdad y escuchando desde fuera, que es exactamente lo
 * que pasa en producción y lo único que demuestra que `window.__labDebug` está
 * publicando lo que creemos.
 *
 * Comprueba tres cosas por lab, y son tres fallos distintos:
 *   · que llegue el `listo`      — el puente se cargó y la escena montó
 *   · que llegue algún `avance`  — el sondeo funciona
 *   · qué COBERTURA declara      — si el lab publica su estado o sólo su recorrido
 *
 * Lo tercero es el dato que importa para el panel del profesor: dice de cuántos
 * labs se puede sacar una nota de logro y de cuántos sólo de participación.
 *
 *   node scripts/auditoria/comprueba-puente.mjs               los 121
 *   node scripts/auditoria/comprueba-puente.mjs --solo buck
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
const soloArg = args.indexOf('--solo');
const SOLO = soloArg >= 0 ? args[soloArg + 1].split(',') : null;
const A_LA_VEZ = Number(process.env.PUENTE_A_LA_VEZ ?? 3);
/** Lo que se le da a un lab para montar y mandar su primer avance. */
const PLAZO_MS = Number(process.env.PUENTE_PLAZO_MS ?? 40000);

const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2',
  '.json': 'application/json' };

/* La página anfitriona hace de shell: mete el lab en un iframe y apunta todo lo
   que le llega, igual que MecanicaShellClient. Se sirve desde el MISMO origen
   porque el puente manda a `location.origin` y no a un comodín. */
const ANFITRION = (slug) => `<!doctype html><meta charset="utf-8"><title>anfitrion</title>
<body style="margin:0">
<script>
  window.__recibido = [];
  addEventListener('message', (e) => {
    if (e.origin !== location.origin) return;
    if (e.data && e.data.fuente === 'cen-lab') window.__recibido.push(e.data);
  });
</script>
<iframe src="/labs/${slug}" style="width:1280px;height:800px;border:0"></iframe>
</body>`;

const servidor = createServer(async (req, res) => {
  const ruta = decodeURIComponent(req.url.split('?')[0]);
  const anfitrion = ruta.match(/^\/anfitrion\/(.+)$/);
  if (anfitrion) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(ANFITRION(anfitrion[1]));
    return;
  }
  try {
    res.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] ?? 'application/octet-stream' });
    res.end(await readFile(join(PUBLICO, ruta)));
  } catch { res.writeHead(404); res.end('404'); }
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}`;

let labs = (await readdir(join(PUBLICO, 'labs'))).filter((n) => n.endsWith('.html')).sort();
if (SOLO) labs = labs.filter((n) => SOLO.some((s) => n.includes(s)));

console.log(`${labs.length} labs · ${BASE}\n`);
const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--disable-gpu-sandbox'] });
const informe = [];

async function revisa(archivo) {
  const ctx = await navegador.newContext({ viewport: { width: 1300, height: 850 } });
  const pagina = await ctx.newPage();
  let fila = { lab: archivo, listo: false, avances: 0, cobertura: null, error: null };
  try {
    await pagina.goto(`${BASE}/anfitrion/${archivo}`, { waitUntil: 'domcontentloaded', timeout: PLAZO_MS });
    // Se espera al primer `avance`, no a un plazo: es la señal de que el sondeo
    // ya vio el estado del lab al menos una vez.
    await pagina.waitForFunction(
      () => window.__recibido.some((m) => m.tipo === 'avance'),
      null, { timeout: PLAZO_MS },
    ).catch(() => {});
    const recibido = await pagina.evaluate(() => window.__recibido);
    fila.listo = recibido.some((m) => m.tipo === 'listo');
    fila.avances = recibido.filter((m) => m.tipo === 'avance').length;
    const ultimo = [...recibido].reverse().find((m) => m.tipo === 'avance');
    fila.cobertura = ultimo?.cobertura ?? null;
  } catch (e) {
    fila.error = String(e.message).slice(0, 110);
  }
  await ctx.close();

  const ok = fila.listo && fila.avances > 0;
  informe.push(fila);
  console.log(`${ok ? '  ok' : ' ‼️ '} ${archivo.padEnd(50)} ${
    ok ? (fila.cobertura === 'completa' ? 'evaluable' : 'sólo participación')
      : (fila.error ?? `listo=${fila.listo} avances=${fila.avances}`)}`);
}

const cola = [...labs];
await Promise.all(Array.from({ length: A_LA_VEZ }, async () => {
  for (let n = cola.shift(); n; n = cola.shift()) await revisa(n);
}));
await navegador.close();
servidor.close();

informe.sort((a, b) => a.lab.localeCompare(b.lab));
const hablan = informe.filter((f) => f.listo && f.avances > 0);
const evaluables = hablan.filter((f) => f.cobertura === 'completa');
console.log(`\n${hablan.length}/${informe.length} labs reportan · ${evaluables.length} dan nota de logro · ${hablan.length - evaluables.length} sólo participación`);

await mkdir(join(AQUI, '.salida'), { recursive: true });
await writeFile(join(AQUI, '.salida', 'puente.json'), JSON.stringify(informe, null, 1), 'utf8');
console.log('informe en scripts/auditoria/.salida/puente.json');
