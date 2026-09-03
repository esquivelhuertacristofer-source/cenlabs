/**
 * El camino del alumno, pulsando los botones de verdad: portada, montaje pieza a
 * pieza en orden, las tres fases y el diagnóstico. Lo que se comprueba aquí es
 * que el motor nuevo no ha roto nada de lo que ya funcionaba.
 *   node scripts/auditoria/.c2_motor.mjs
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
  const ruta = decodeURIComponent(q.url.split('?')[0]);
  let c = null;
  try { c = await readFile(join(PUB, ruta)); } catch { c = null; }
  if (!c) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' });
  r.end(c);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
let errores = [];
pag.on('pageerror', e => errores.push(String(e).slice(0, 180)));
pag.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text().slice(0, 160)); });

let n = 0, malos = 0;
const ok = (c, q) => { n++; if (!c) { malos++; console.log('  ‼️  ' + q); } };
const grupo = t => console.log('\n' + t);
const ev = (f, a) => pag.evaluate(f, a);
/** Pulsa el primer elemento visible cuyo texto case. Es como toca un dedo. */
const toca = (re) => pag.evaluate(r => {
  const rx = new RegExp(r, 'i');
  const c = [...document.querySelectorAll('button,.btn,a,[role="button"]')]
    .filter(e => rx.test(e.textContent || '') && e.offsetParent !== null);
  if (!c.length) return false;
  c[c.length - 1].click(); return true;
}, re.source || re);

grupo('1 · arranca y la portada se quita');
await pag.goto(`${BASE}/labs/motor-combustion.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForTimeout(1600);
ok(errores.length === 0, 'sin errores al cargar: ' + errores.slice(0, 2).join(' | '));
ok(await toca(/comenzar/), 'hay botón de comenzar');
await pag.waitForTimeout(1800);
ok(await ev(() => !!window.__labDebug), 'el asidero de pruebas está');
ok((await ev(() => window.__labDebug.montadas)).length === 0, 'nada montado todavía');

grupo('2 · las cuatro piezas se montan EN ORDEN, con los botones');
// Los rótulos de los botones no son «instalar X»: son los que el laboratorio
// escribe, y hay que buscarlos por lo que ponen de verdad. Un botón que no se
// encuentra no falla: hace que se compruebe el paso siguiente sobre un montaje
// a medias, y entonces falla otra cosa y se busca donde no es.
for (const [re, k] of [[/instalar bloque/, 'block'], [/instalar cig/, 'crank'],
                       [/insertar 4 pistones/, 'pistons'], [/montar culata/, 'head']]) {
  errores = [];
  ok(await toca(re), 'aparece el botón de ' + k);
  await pag.waitForTimeout(1700);
  ok((await ev(() => window.__labDebug.montadas)).includes(k), k + ': queda montada');
  ok(errores.length === 0, k + ': sin errores — ' + errores.slice(0, 2).join(' | '));
}
ok((await ev(() => window.__labDebug.montadas)).length === 4, 'las cuatro montadas');
ok((await ev(() => window.__labDebug.piezasNaN)).length === 0, 'ninguna posición NaN');

grupo('3 · el mecanismo cierra: el pie de cada biela cae sobre su bulón');
await ev(() => window.__labDebug.corre(2500));
for (const r of [800, 2000, 4500]) {
  await ev(x => window.__labDebug.corre(x), r);
  await pag.waitForTimeout(900);
  const sueltas = await ev(() => window.__labDebug.bielasSueltas);
  ok(sueltas.length === 0, r + ' rpm: bielas despegadas — ' + sueltas.join(', '));
}
// Y a lo largo de una vuelta entera, no sólo en los tres instantes en que
// caiga la captura: el pie de la biela puede cerrar en el punto muerto y
// despegarse a media carrera, que es donde la biela va más tumbada.
{
  const malas = [];
  for (let i = 0; i < 16; i++) {
    await pag.waitForTimeout(120);
    const s = await ev(() => window.__labDebug.bielasSueltas);
    if (s.length) malas.push(s.join(','));
  }
  ok(malas.length === 0, 'y en toda la vuelta: ' + malas.slice(0, 3).join(' | '));
}

grupo('4 · el cigüeñal gira y los pistones se mueven');
await ev(() => window.__labDebug.corre(3000));
await pag.waitForTimeout(1200);
const a1 = await ev(() => window.__labDebug.anguloCigueñal);
await pag.waitForTimeout(700);
const a2 = await ev(() => window.__labDebug.anguloCigueñal);
ok(a1 !== a2, 'el ángulo del cigüeñal avanza: ' + a1.toFixed(0) + ' → ' + a2.toFixed(0));
ok((await ev(() => window.__labDebug.rpm)) > 100, 'y el motor coge vueltas');

grupo('5 · las tres fases se recorren sin romper nada');
for (const re of [/fundamento/, /diagnóstico|diagnostico/]) {
  errores = [];
  await toca(re);
  await pag.waitForTimeout(1500);
  ok(errores.length === 0, re.source + ': sin errores — ' + errores.slice(0, 2).join(' | '));
}
ok((await ev(() => window.__labDebug.piezasNaN)).length === 0, 'sigue sin NaN al final');

console.log('\n' + (n - malos) + '/' + n + ' comprobaciones');
await nav.close(); srv.close();
process.exit(malos ? 1 : 0);
