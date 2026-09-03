/**
 * Sonda de ENSAMBLE: abre un laboratorio, pulsa el boton que se le diga (el de
 * armado automatico), espera a que termine y ejecuta la expresion que se le
 * pase. Sirve para mirar los laboratorios de molde E+S, cuyo 3D no se ve hasta
 * que la maquina esta montada.
 *   node scripts/auditoria/.arma3d.mjs <slug> <idBoton> <msEspera> "<expresion>"
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

const [slug, boton, ms, expr] = process.argv.slice(2);
const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
pag.on('pageerror', e => console.log('‼ ' + String(e).slice(0, 200)));
pag.on('console', m => { if (m.type() === 'error') console.log('· ' + m.text().slice(0, 200)); });
await pag.goto(`${BASE}/labs/${slug}.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForTimeout(1600);
await pag.evaluate((id) => { const b = document.getElementById(id); if (b) b.click(); }, boton);
await pag.waitForTimeout(Number(ms) || 12000);
if (expr) console.log(JSON.stringify(await pag.evaluate(expr), null, 1));
await pag.waitForTimeout(900);
await pag.screenshot({ path: 'C:/Users/crist/AppData/Local/Temp/claude/c--Users-crist--gemini-antigravity-scratch-Proyecto-LABS/686fb186-9010-4099-80c9-f72bf4cb4265/scratchpad/mira3d/_sonda.png' });
await nav.close(); srv.close();
