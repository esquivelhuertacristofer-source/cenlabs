/**
 * Sonda de escena: abre un laboratorio, ejecuta el JS que se le pase y devuelve
 * lo que valga. Sirve para preguntarle a la escena qué tiene dentro cuando la
 * foto sale negra y no hay ningún error en consola.
 *   node scripts/auditoria/.sonda3d.mjs <slug> "<expresión>"
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const PUB = join('c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard', 'public');
const TIPOS = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp',
  '.png':'image/png', '.mp3':'audio/mpeg' };
const srv = createServer(async (q, r) => {
  let c = null;
  try { c = await readFile(join(PUB, decodeURIComponent(q.url.split('?')[0]))); } catch {}
  if (!c) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(q.url)] || 'application/octet-stream' });
  r.end(c);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

const [slug, expr] = process.argv.slice(2);
const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
pag.on('pageerror', e => console.log('‼ ' + String(e).slice(0, 200)));
pag.on('console', m => { if (m.type() === 'error') console.log('· ' + m.text().slice(0, 200)); });
await pag.goto(`${BASE}/labs/${slug}.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForTimeout(1500);
await pag.evaluate(() => {
  const re = /comenzar|empezar|iniciar|entrar|arrancar/i;
  const c = [...document.querySelectorAll('button,.btn,a,[role="button"]')]
    .filter(e => re.test(e.textContent || '') && e.offsetParent !== null);
  if (c.length) c[c.length - 1].click();
});
await pag.waitForTimeout(2500);
console.log(JSON.stringify(await pag.evaluate(expr), null, 1));
await pag.waitForTimeout(900);
await pag.screenshot({ path: 'C:/Users/crist/AppData/Local/Temp/claude/c--Users-crist--gemini-antigravity-scratch-Proyecto-LABS/686fb186-9010-4099-80c9-f72bf4cb4265/scratchpad/mira3d/_sonda.png' });
await nav.close(); srv.close();
