/** Humo · d6-A1: ¿arranca, monta y pinta las siete vistas sin reventar? */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB = join(RAIZ, 'public');
const TIPOS = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp', '.png':'image/png' };
const srv = createServer(async (q, r) => {
  const ruta = decodeURIComponent(q.url.split('?')[0]);
  let cuerpo = null;
  try { cuerpo = await readFile(join(PUB, ruta)); } catch { cuerpo = null; }
  if (!cuerpo) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' });
  r.end(cuerpo);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
const errores = [];
pag.on('pageerror', e => errores.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

await pag.goto(`${BASE}/labs/arranque-caidas-de-tension.html`, { waitUntil: 'load', timeout: 90000 });
try {
  await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null, { timeout: 45000 });
} catch (e) {
  console.log('NO ARRANCA. Errores:');
  console.log(errores.join('\n') || '(ninguno)');
  await nav.close(); srv.close(); process.exit(1);
}
console.log('arranca ·', errores.length, 'errores');
if (errores.length) console.log(errores.slice(0, 6).join('\n'));

const K = await pag.evaluate(() => window.__labDebug.K);
console.log('vistas', K.MODES.length, '· averías', K.FALLAS.length, '· piezas', K.PIEZAS.length,
  '· vehículos', K.VEHS.length, '· instrumentos', K.INSTR.length);

const mal = await pag.evaluate(() => window.__labDebug.materialesFalsos);
console.log('materiales falsos:', mal.length, mal.slice(0, 5).join(', '));
const def0 = await pag.evaluate(() => window.__labDebug.materialesPorDefecto);
console.log('materiales por defecto:', def0.length, def0.slice(0, 5).join(', '));

console.log('montadas antes:', await pag.evaluate(() => window.__labDebug.montadas));
await pag.evaluate(() => window.__labDebug.monta());
await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });
console.log('montado · simUnlocked =', await pag.evaluate(() => window.__labDebug.simUnlocked));

for (const m of K.MODES) {
  errores.length = 0;
  await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
  await pag.waitForTimeout(200);
  const modo = await pag.evaluate(() => window.__labDebug.mode);
  const ancho = await pag.evaluate(() => window.__labDebug.anchoTableroPx);
  console.log(`  ${m.padEnd(12)} modo=${modo.padEnd(12)} pizarrón=${ancho.toFixed(0)} px  errores=${errores.length}`,
    errores.length ? errores[0].slice(0, 160) : '');
}

const m2 = await pag.evaluate(() => window.__labDebug.materialesFalsos);
console.log('materiales falsos tras montar:', m2.length, m2.slice(0, 6).join(', '));
const nan = await pag.evaluate(() => window.__labDebug.posicionesNaN);
console.log('posiciones NaN:', nan.length, nan.slice(0, 6).join(', '));
const def = await pag.evaluate(() => window.__labDebug.materialesPorDefecto);
console.log('materiales por defecto:', def.length, def.slice(0, 6).join(', '));

for (const v of K.VEHS) {
  errores.length = 0;
  await pag.evaluate(vv => window.__labDebug.setVeh(vv), v);
  await pag.waitForTimeout(200);
  const a = await pag.evaluate(() => window.__labDebug.anchoTableroPx);
  const n = await pag.evaluate(() => window.__labDebug.posicionesNaN.length);
  console.log(`  ${v.padEnd(8)} pizarrón=${a.toFixed(0)} px  NaN=${n}  errores=${errores.length}`,
    errores.length ? errores[0].slice(0, 160) : '');
}

await nav.close(); srv.close();
