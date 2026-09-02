/**
 * Cuánto mide el pizarrón en pantalla, vehículo por vehículo y vista por vista.
 * Es la comprobación que en el laboratorio anterior se quedó sin hacer «porque
 * no hay gancho para eso»: ahora lo hay.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB = join(RAIZ, 'public');
const TIPOS = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp', '.png':'image/png' };
const srv = createServer(async (q, r) => {
  let c = null;
  try { c = await readFile(join(PUB, decodeURIComponent(q.url.split('?')[0]))); } catch { c = null; }
  if (!c) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(q.url)] || 'application/octet-stream' });
  r.end(c);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
await pag.goto(`${BASE}/labs/${process.argv[2] || 'common-rail-precalentamiento'}.html`,
  { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null, { timeout: 90000 });

const K = await pag.evaluate(() => window.__labDebug.K);
let peor = 1e9, peorQ = '';
for (const v of K.ARQ) {
  await pag.evaluate(k => window.__labDebug.setMaquina(k), v);
  const fila = [];
  for (const m of K.MODES) {
    await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
    await pag.waitForTimeout(120);
    const w = await pag.evaluate(() => window.__labDebug.anchoTableroPx);
    fila.push(`${m} ${Math.round(w)}`);
    if (w < peor) { peor = w; peorQ = v + '/' + m; }
  }
  console.log(v.padEnd(8) + fila.join('  ·  '));
}
console.log(`\nel más pequeño: ${Math.round(peor)} px en ${peorQ}`);
await nav.close(); srv.close();
