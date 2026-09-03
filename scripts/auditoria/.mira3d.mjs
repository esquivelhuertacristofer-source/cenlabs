/**
 * Mira el 3D de cualquier laboratorio: pantalla entera y un recorte del centro
 * de la escena, sin depender de `__labDebug`. Los laboratorios viejos no lo
 * tienen, y son justo los que hay que mirar.
 *   node scripts/auditoria/.mira3d.mjs <slug> [<slug>...]
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB = join(RAIZ, 'public');
const OUT = 'C:/Users/crist/AppData/Local/Temp/claude/c--Users-crist--gemini-antigravity-scratch-Proyecto-LABS/686fb186-9010-4099-80c9-f72bf4cb4265/scratchpad/mira3d';
const TIPOS = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp',
  '.png':'image/png', '.mp3':'audio/mpeg' };
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
for (const slug of process.argv.slice(2)) {
  const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = [];
  pag.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  try {
    await pag.goto(`${BASE}/labs/${slug}.html`, { waitUntil: 'load', timeout: 90000 });
    // Casi todos los laboratorios viejos abren con una portada que tapa la
    // escena. Se entra por el primer botón que diga «comenzar», «empezar» o
    // «entrar»; si no hay ninguno, es que la escena ya está a la vista.
    // El texto de la portada lo escribe el JS, así que no se puede buscar en el
    // archivo: hay que buscarlo en el DOM ya montado. Se pulsa de verdad, no se
    // esconde la capa, porque en varios laboratorios ese clic es lo que arranca
    // la escena.
    await pag.waitForTimeout(1400);
    await pag.evaluate(() => {
      const re = /comenzar|empezar|iniciar|entrar|arrancar/i;
      const cand = [...document.querySelectorAll('button,.btn,a,[role="button"]')]
        .filter(e => re.test(e.textContent || '') && e.offsetParent !== null);
      if (cand.length) cand[cand.length - 1].click();
      document.querySelectorAll('.intro,.splash,.portada').forEach(e => e.classList.add('hide'));
    });
    // Sin `__labDebug` no hay señal de «ya pinté»: se le dan unos segundos, que
    // es de sobra para el primer fotograma incluso con SwiftShader.
    await pag.waitForTimeout(3200);
    await pag.screenshot({ path: join(OUT, slug + '.png') });
    // El recorte del centro-derecha, que es donde estos laboratorios ponen la
    // escena. A tamaño real se ve si una pieza es una pieza o es un ladrillo.
    await pag.screenshot({ path: join(OUT, slug + '__cerca.png'),
      clip: { x: 500, y: 200, width: 900, height: 600 } });
    // Y con el despiece abierto, si el laboratorio tiene uno: es la vista en la
    // que se ven las piezas que en el conjunto quedan tapadas.
    const hay = await pag.evaluate(() => {
      const b = [...document.querySelectorAll('button,.btn,[role="button"]')]
        .find(e => /despiece|explode|separar/i.test(e.textContent || ''));
      if (!b) return false; b.click(); return true;
    });
    if (hay) {
      await pag.waitForTimeout(1800);
      await pag.screenshot({ path: join(OUT, slug + '__despiece.png'),
        clip: { x: 380, y: 180, width: 1120, height: 640 } });
    }
    console.log('  ' + slug.padEnd(26) + (errs.length ? '‼ ' + errs[0] : 'ok'));
  } catch (e) { console.log('  ' + slug.padEnd(26) + '‼ ' + String(e).slice(0, 90)); }
  await pag.close();
}
await nav.close(); srv.close();
console.log('→ ' + OUT);
