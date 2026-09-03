/**
 * Mira el motor de «Arma y entiende un motor de combustión»: la mesa de piezas,
 * el montaje pieza a pieza y el motor en marcha, de cerca.
 *   node scripts/auditoria/.shot_motor.mjs
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB = join(RAIZ, 'public');
const OUT = 'C:/Users/crist/AppData/Local/Temp/claude/c--Users-crist--gemini-antigravity-scratch-Proyecto-LABS/686fb186-9010-4099-80c9-f72bf4cb4265/scratchpad/motor';
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
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
pag.on('pageerror', e => errs.push(String(e).slice(0, 200)));
pag.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 160)); });
await pag.goto(`${BASE}/labs/motor-combustion.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForTimeout(1500);
await pag.evaluate(() => {
  const re = /comenzar/i;
  [...document.querySelectorAll('button,.btn,a,[role="button"]')]
    .filter(e => re.test(e.textContent || '')).pop()?.click();
});
await pag.waitForTimeout(2400);

const foto = async (n, clip) => {
  await pag.screenshot({ path: join(OUT, n + '.png'), ...(clip ? { clip } : {}) });
  console.log('  ' + n + '.png');
};
const VANO = { x: 420, y: 120, width: 1100, height: 720 };

await foto('00_mesa');
// Se montan las cuatro piezas por el mismo camino que usa el botón.
for (const [k, n] of [['block', '10_bloque'], ['crank', '20_cigüeñal'],
                      ['pistons', '30_pistones'], ['head', '40_culata']]) {
  await pag.evaluate(x => window.__labDebug.arma(x), k);
  await pag.waitForTimeout(1600);
  await foto(n, VANO);
}
await pag.evaluate(() => window.__labDebug.mira(4.4, 3.4, 7.6, 0, 1.5, 0));
await pag.waitForTimeout(500);
await foto('41_pantalla');
await foto('42_tres_cuartos', VANO);
await pag.evaluate(() => window.__labDebug.mira(0.3, 2.2, 6.6, 0, 1.6, 0));
await pag.waitForTimeout(400);
await foto('43_frente', VANO);
await pag.evaluate(() => window.__labDebug.mira(2.2, 1.6, 5.2, 0, 1.2, 0));
await pag.waitForTimeout(400);
await foto('44_bajo', VANO);
console.log('  bielas sueltas:', JSON.stringify(await pag.evaluate(() => window.__labDebug.bielasSueltas)));
// Y en marcha, para ver articular las bielas.
await pag.evaluate(() => window.__labDebug.corre(3000));
for (let i = 0; i < 3; i++) {
  await pag.waitForTimeout(700);
  await foto('5' + i + '_marcha', VANO);
}
console.log(errs.length ? '‼ ' + [...new Set(errs)].slice(0, 5).join('\n‼ ') : 'sin errores');
console.log('→ ' + OUT);
await nav.close(); srv.close();
