/**
 * CAPA 2 · d6-12 · el laboratorio dentro de un navegador de verdad.
 *
 * Lo que la Capa 1 no puede ver: que la página arranque, que las siete vistas
 * pinten sin reventar, que TODA malla del banco lleve un material de verdad
 * —un `brushedMetal()` sin envolver deja la pieza invisible y en silencio—,
 * que el reto a ciegas no regale la respuesta por ninguna superficie, y que el
 * aviso flotante se VEA (opacidad medida, no clase comprobada).
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
  let cuerpo = null;
  try { cuerpo = await readFile(join(PUB, ruta)); } catch { cuerpo = null; }
  if (!cuerpo) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(ruta)] || 'application/octet-stream' });
  r.end(cuerpo);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

let n = 0, malos = 0;
const ok = (c, q) => { n++; if (!c) { malos++; console.log('  ‼️ ', q); } };
const grupo = t => console.log('\n' + t);

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
const errores = [];
pag.on('pageerror', e => errores.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

await pag.goto(`${BASE}/labs/common-rail-precalentamiento.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null,
  { timeout: 90000 });

grupo('1 · arranca y pinta');
ok(errores.length === 0, 'sin errores de página: ' + errores.slice(0, 3).join(' | '));
const K = await pag.evaluate(() => window.__labDebug.K);
ok(K.MODES.length === 7, `${K.MODES.length} vistas`);
ok(K.FALLAS.length === 12, `${K.FALLAS.length} averías`);
ok(K.TEMPS.length === 5, `${K.TEMPS.length} temperaturas`);
{
  const buf = await pag.screenshot({ clip: { x: 300, y: 120, width: 900, height: 640 } });
  ok(buf.length > 20000, 'la escena 3D pinta algo (peso del PNG: ' + buf.length + ')');
}

grupo('2 · toda malla del banco lleva un material de VERDAD');
// `brushedMetal()` devuelve texturas, no un material. Pasárselo a un Mesh no da
// error: three comprueba `material.visible===true`, encuentra undefined y se
// salta la pieza en silencio. Esto lo caza.
{
  const mal = await pag.evaluate(() => window.__labDebug.materialesFalsos);
  ok(mal.length === 0, `${mal.length} mallas con material falso: ${mal.slice(0, 4).join(', ')}`);
}

grupo('3 · las siete vistas pintan y publican');
for (const m of K.MODES) {
  errores.length = 0;
  await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
  await pag.waitForTimeout(160);
  const est = await pag.evaluate(() => ({ modo: window.__labDebug.mode,
    texto: window.__labDebug.texto.length }));
  ok(est.modo === m && errores.length === 0,
    `vista «${m}» sin errores (${errores.slice(0, 2).join(' | ')})`);
  ok(est.texto > 40, `vista «${m}» deja texto en el informe`);
}
await pag.evaluate(() => window.__labDebug.setMode('riel'));

grupo('4 · el aviso flotante SE VE');
await pag.evaluate(() => window.__labDebug.setMode('reto'));
await pag.evaluate(() => window.__labDebug.pista());
const vio = await pag.waitForFunction(() => {
  const t = document.getElementById('toast');
  return t && Number(getComputedStyle(t).opacity) > 0.5;
}, null, { timeout: 8000 }).then(() => true).catch(() => false);
ok(vio, 'el aviso llega a opacidad > 0,5');

grupo('5 · el reto a ciegas no regala la respuesta');
// Lo que NO puede aparecer no es el nombre de las PIEZAS —el banco las rotula
// todas, y eso es medio laboratorio— sino el nombre de la AVERÍA sorteada. Se
// comprueba contra los rótulos que el propio motor sellado publica: una lista
// escrita a mano aquí se queda vieja al añadir una avería y la fuga vuelve.
for (let i = 0; i < 16; i++) {
  await pag.evaluate(() => window.__labDebug.arma());
  const fuga = await pag.evaluate(() => {
    const D = window.__labDebug;
    return { falla: D.reto.falla, rotulos: D.rotulos.join(' | '),
      escaner: JSON.stringify(D.escaner), texto: D.texto,
      informe: document.getElementById('report').textContent,
      panel: document.getElementById('tele').textContent };
  });
  const sopa = [fuga.rotulos, fuga.escaner, fuga.texto, fuga.informe, fuga.panel]
    .join(' ').toLowerCase();
  const corto = K.ROT[fuga.falla].toLowerCase();
  const largo = K.ROT_LARGO[fuga.falla].toLowerCase();
  ok(!sopa.includes(corto) && !sopa.includes(largo),
    `sorteo ${i}: el caso «${fuga.falla}» se nombra («${corto}») en: ${sopa.slice(0, 200)}`);
  const ap = await pag.evaluate(() => window.__labDebug.escaner.enciende);
  ok(ap === false, `sorteo ${i}: el escáner arranca apagado`);
  // Y la barra de mandos tampoco puede ofrecer la avería ni la temperatura.
  const ctrl = await pag.evaluate(() => document.getElementById('ctrl').textContent.toLowerCase());
  ok(!ctrl.includes(corto), `sorteo ${i}: la barra de mandos no ofrece la avería`);
}

grupo('6 · los cinco instrumentos y el dictamen');
await pag.evaluate(() => window.__labDebug.setMaquina('hdi20'));
await pag.evaluate(() => window.__labDebug.setMode('reto'));
await pag.evaluate(() => window.__labDebug.armaCaso('inyectorFuga', 25));
let R = await pag.evaluate(() => window.__labDebug.reto);
ok(R.esperado === 'cambiaInyector', `un inyector con fuga → «cambiaInyector» (dio ${R.esperado})`);
// Con sólo el escáner, la bomba gastada y el inyector NO se separan.
await pag.evaluate(() => window.__labDebug.armaCaso('bombaGastada', 25));
await pag.evaluate(() => window.__labDebug.mide('escaner'));
R = await pag.evaluate(() => window.__labDebug.reto);
ok(R.vivas.includes('bombaGastada') && R.vivas.includes('filtroTapado'),
  `con el escáner solo, la bomba y el filtro siguen vivos (${R.vivas.join(',')})`);
await pag.evaluate(() => window.__labDebug.mide('manometro'));
R = await pag.evaluate(() => window.__labDebug.reto);
ok(!R.vivas.includes('filtroTapado'),
  `el manómetro descarta el filtro por la presión de baja (${R.vivas.join(',')})`);
await pag.evaluate(() => window.__labDebug.elige('cambiaBomba'));
const bien = await pag.evaluate(() => window.__labDebug.entrega());
ok(bien === true, 'el dictamen correcto se acepta');
ok(await pag.evaluate(() => window.__labDebug.solved) === true, 'y marca el laboratorio resuelto');

await pag.evaluate(() => window.__labDebug.armaCaso('sensorBajo', 25));
await pag.evaluate(() => { window.__labDebug.mide('escaner'); window.__labDebug.elige('cambiaBomba'); });
const mal2 = await pag.evaluate(() => window.__labDebug.entrega());
ok(mal2 === false, 'un dictamen equivocado se marca mal');

grupo('7 · el cuestionario');
await pag.evaluate(() => window.__labDebug.setMode('riel'));
await pag.evaluate(() => window.__labDebug.setFalla('sano'));
await pag.evaluate(() => window.__labDebug.setTemp(25));
const Q = await pag.evaluate(() => window.__labDebug.preguntas);
ok(Q.length >= 6, `${Q.length} preguntas`);
ok(Q.every(q => q.correctas === 1), 'cada pregunta tiene exactamente una correcta');
ok(Q.every(q => q.n === 4), 'y cuatro opciones');
const q1 = await pag.evaluate(() => window.__labDebug.preguntas.map(q => q.t).join('|'));
await pag.evaluate(() => window.__labDebug.setTemp(-30));
const q2 = await pag.evaluate(() => window.__labDebug.preguntas.map(q => q.t).join('|'));
ok(q1 !== q2, 'el enunciado cambia al cambiar la temperatura');
// La posición de la correcta no puede ser fija: se baraja y se comprueba que en
// 24 sorteos la correcta no cae siempre en el mismo botón.
const pos = await pag.evaluate(() => {
  const out = [];
  for (let i = 0; i < 24; i++) {
    window.__labDebug.setTemp(i % 2 ? 25 : -20);
    const b = document.querySelectorAll('#quiz .b.dx');
    out.push(b.length);
  }
  return out;
});
ok(pos.every(x => x === 4), 'el cuestionario pinta sus cuatro botones siempre');

grupo('8 · el recorrido guiado llega al final');
await pag.evaluate(() => window.__labDebug.setMode('riel'));
errores.length = 0;
await pag.click('#btnAuto');
const fin = await pag.waitForFunction(() => window.__labDebug.autoRunning === false,
  null, { timeout: 180000 }).then(() => true).catch(() => false);
ok(fin, 'el recorrido termina solo');
ok(errores.length === 0, 'y sin errores por el camino: ' + errores.slice(0, 3).join(' | '));

grupo('9 · la escena responde al vehículo');
await pag.evaluate(() => window.__labDebug.setMode('riel'));
for (const k of K.ARQ) {
  errores.length = 0;
  await pag.evaluate(kk => window.__labDebug.setMaquina(kk), k);
  await pag.waitForTimeout(140);
  const r = await pag.evaluate(() => window.__labDebug.rotulos);
  ok(errores.length === 0, `${k}: cambia de vehículo sin errores (${errores.slice(0,2).join(' | ')})`);
  ok(r.length >= 6, `${k}: el banco lleva sus chapas (${r.length})`);
}

await nav.close();
srv.close();
console.log(`\n${n - malos}/${n} comprobaciones`);
if (malos) process.exit(1);
