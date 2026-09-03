/**
 * Apunta la camara de un laboratorio a donde se le diga y guarda la foto.
 *   node scripts/auditoria/.enfoca.mjs <slug> <x> <y> <z> <tx> <ty> <tz> <salida.png>
 * Oculta los sprites (las etiquetas flotantes tapan justo la pieza que se mira)
 * y suelta el limite de distancia de la orbita, que en varios labs impide
 * acercarse.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
const PUB = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard/public';
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.woff2': 'font/woff2', '.webp': 'image/webp',
  '.png': 'image/png', '.mp3': 'audio/mpeg' };
const srv = createServer(async (q, r) => {
  let c = null;
  try { c = await readFile(join(PUB, decodeURIComponent(q.url.split('?')[0]))); } catch { c = null; }
  if (!c) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(q.url)] || 'application/octet-stream' });
  r.end(c);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const B = `http://127.0.0.1:${srv.address().port}`;
const [slug, salida, clic, js] = process.argv.slice(2);
const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await nav.newPage({ viewport: { width: 1600, height: 900 } });
p.on('pageerror', e => console.log('  ‼', e.message));
await p.goto(`${B}/labs/${slug}.html`, { waitUntil: 'load', timeout: 90000 });
await p.waitForFunction(() => window.__diag3d, null, { timeout: 90000 });
await p.waitForTimeout(1200);
if (clic) { for (const c of clic.split('|')) { await p.click(c); await p.waitForTimeout(400); } }
if (js) { await p.evaluate(js); await p.waitForTimeout(300); }
await p.waitForTimeout(1400);   // deja que la camara del modo inicial llegue
await p.screenshot({ path: salida });
await nav.close(); srv.close();
console.log('→', salida);
