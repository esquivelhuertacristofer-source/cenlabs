/**
 * Saca el muestrario de piezas: la rejilla entera y, si se le pide, un primer
 * plano de una casilla. Es la forma de mirar la biblioteca sin abrir ningún
 * laboratorio, y de comparar un antes y un después sin ruido alrededor.
 *   node scripts/auditoria/.muestrario.mjs [x y z tx ty tz nombre]
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB = join(RAIZ, 'public');
const OUT = 'C:/Users/crist/AppData/Local/Temp/claude/c--Users-crist--gemini-antigravity-scratch-Proyecto-LABS/686fb186-9010-4099-80c9-f72bf4cb4265/scratchpad/piezas';
const TIPOS = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp', '.png':'image/png' };
const srv = createServer(async (q, r) => {
  const ruta = decodeURIComponent(q.url.split('?')[0]);
  let c = null;
  try { c = await readFile(join(PUB, ruta)); } catch { c = null; }
  if (!c) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' });
  r.end(c);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;
await mkdir(OUT, { recursive: true });

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 1000 } });
const errs = [];
pag.on('pageerror', e => errs.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await pag.goto(`${BASE}/labs/_muestrario.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__listo, null, { timeout: 60000 });
await pag.waitForTimeout(700);

const a = process.argv.slice(2);
if (a.length >= 6) {
  await pag.evaluate(v => window.__cam(...v), a.slice(0, 6).map(Number));
  await pag.waitForTimeout(500);
  const n = a[6] || 'cerca';
  await pag.screenshot({ path: join(OUT, n + '.png') });
  console.log('  ' + n + '.png');
} else {
  await pag.screenshot({ path: join(OUT, 'rejilla.png') });
  console.log('  rejilla.png');
}
console.log(errs.length ? '‼ ' + errs.slice(0, 4).join('\n‼ ') : 'sin errores');
console.log('→ ' + OUT);
await nav.close(); srv.close();
