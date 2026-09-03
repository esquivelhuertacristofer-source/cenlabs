/**
 * Busca la pieza culpable de que un fotograma salga negro. Oculta todos los
 * hijos de un grupo, los va enseñando de uno en uno y mide cuánta luz queda en
 * la imagen. Una foto negra pesa cuatro veces menos que una con escena: el peso
 * del PNG basta como fotómetro y ahorra cargar la página una vez por pieza.
 *   node scripts/auditoria/.culpable.mjs <slug> <grupo>
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const PUB = join('c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard', 'public');
const T = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp', '.mp3':'audio/mpeg' };
const srv = createServer(async (q, r) => {
  let c = null;
  try { c = await readFile(join(PUB, decodeURIComponent(q.url.split('?')[0]))); } catch {}
  if (!c) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': T[extname(q.url)] || 'application/octet-stream' }); r.end(c);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const [slug, grupo] = process.argv.slice(2);
const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
pag.on('pageerror', e => console.log('‼ ' + String(e).slice(0, 160)));
await pag.goto(`http://127.0.0.1:${srv.address().port}/labs/${slug}.html`, { waitUntil: 'load' });
await pag.waitForTimeout(1500);
await pag.evaluate(() => {
  const re = /comenzar|empezar|iniciar|entrar|arrancar/i;
  const c = [...document.querySelectorAll('button,.btn,a,[role="button"]')]
    .filter(e => re.test(e.textContent || '') && e.offsetParent !== null);
  if (c.length) c[c.length - 1].click();
});
await pag.waitForTimeout(2500);

const n = await pag.evaluate(g => window.__test.hijos(g).length, grupo);
const luz = async () => (await pag.screenshot({ clip: { x: 400, y: 60, width: 1200, height: 840 } })).length;
await pag.evaluate(g => window.__test.hijos(g).forEach((_, i) => window.__test.verHijo(g, i, false)), grupo);
await pag.waitForTimeout(2200);
const base = await luz();
console.log('todos ocultos: ' + base);
for (let i = 0; i < n; i++) {
  await pag.evaluate(([g, k, n2]) => {
    for (let j = 0; j < n2; j++) window.__test.verHijo(g, j, j === k);
  }, [grupo, i, n]);
  await pag.waitForTimeout(2200);
  const l = await luz();
  const nom = await pag.evaluate(([g, k]) => window.__test.hijos(g)[k], [grupo, i]);
  console.log(String(i).padStart(2) + ' ' + nom.padEnd(38) + String(l).padStart(8) +
    (l < base * 0.55 ? '   <<< APAGA LA ESCENA' : ''));
}
await nav.close(); srv.close();
