/**
 * El renderizador de fichas concatenaba `s5.modela` con `+`. Con un array eso da
 * una tira separada por comas y sin viñetas, y d6-13 era la ÚNICA de las 125
 * fichas que pasaba arrays: nadie más podía notarlo. Esto comprueba las dos
 * formas —texto y lista— en la página de verdad.
 *
 *   node scripts/auditoria/.ficha_s5.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const PUB = join('c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard', 'public');
const TIPOS = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css',
  '.json':'application/json', '.woff2':'font/woff2', '.webp':'image/webp', '.png':'image/png' };
const srv = createServer(async (q, r) => {
  let c = null;
  try { c = await readFile(join(PUB, decodeURIComponent(q.url.split('?')[0]))); } catch {}
  if (!c) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(q.url)] || 'application/octet-stream' });
  r.end(c);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

let n = 0, malos = 0;
const ok = (c, q) => { n++; if (!c) { malos++; console.log('  ‼️  ' + q); } };

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
for (const [lab, forma] of [
  ['dinamometro-par-potencia-correccion.html', 'lista'],
  ['sobrealimentacion-turbo-intercooler.html', 'lista'],
  ['gases-verificacion.html', 'texto'],
]) {
  const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
  const err = [];
  pag.on('pageerror', e => err.push(String(e)));
  await pag.goto(`${BASE}/labs/${lab}`, { waitUntil: 'load', timeout: 90000 });
  await pag.waitForSelector('#fichaFab', { timeout: 60000 });
  await pag.click('#fichaFab');
  await pag.waitForSelector('#fichaCard', { timeout: 20000 });
  const r = await pag.evaluate(() => {
    const card = document.getElementById('fichaCard');
    const hs = [...card.querySelectorAll('.fh')].map(x => x.textContent);
    const i = hs.findIndex(h => /^5 ·/.test(h));
    const nodos = [...card.children];
    const cab = nodos.find(x => x.classList.contains('fh') && /^5 ·/.test(x.textContent));
    const tras = [];
    for (let k = nodos.indexOf(cab) + 1; k < nodos.length; k++) {
      if (nodos[k].classList.contains('fh')) break;
      tras.push({ tag: nodos[k].tagName, li: nodos[k].querySelectorAll('li').length,
        txt: nodos[k].textContent.slice(0, 160) });
    }
    return { hay: i >= 0, tras: tras };
  });
  ok(r.hay, `${lab}: la ficha tiene sección 5`);
  const uls = r.tras.filter(x => x.tag === 'UL');
  const ps = r.tras.filter(x => x.tag === 'P');
  if (forma === 'lista') {
    ok(uls.length === 2, `${lab}: la sección 5 pinta DOS listas (${uls.length})`);
    ok(uls.every(u => u.li >= 5), `${lab}: y cada lista tiene sus viñetas (${uls.map(u => u.li).join('/')})`);
    ok(ps.every(p => p.txt.length < 40), `${lab}: los párrafos son sólo los rótulos`);
    ok(!r.tras.some(x => /,[A-ZÁÉÍÓÚ]/.test(x.txt)),
      `${lab}: sin la tira pegada por comas — «${(r.tras.find(x => /,[A-ZÁÉÍÓÚ]/.test(x.txt)) || {}).txt || ''}»`);
  } else {
    ok(uls.length === 0 && ps.length === 2, `${lab}: la forma de TEXTO sigue dando dos párrafos (${ps.length}p/${uls.length}ul)`);
    ok(ps.every(p => p.txt.length > 60), `${lab}: y con su texto dentro`);
  }
  ok(err.length === 0, `${lab}: sin errores al abrir la ficha: ` + err.slice(0, 2).join(' | '));
  await pag.close();
}
console.log(`\n${n - malos}/${n} comprobaciones`);
await nav.close(); srv.close();
process.exit(malos ? 1 : 0);
