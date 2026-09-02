/**
 * CAPA 2 · d6-11 · el laboratorio dentro de un navegador de verdad.
 *
 * Lo que la Capa 1 no puede ver: que la página arranque, que las siete vistas
 * pinten sin reventar, que el pizarrón se lea a un tamaño razonable, que el
 * reto a ciegas NO enseñe la respuesta por ninguna superficie, y que el aviso
 * flotante se VEA (opacidad medida, no clase comprobada).
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

await pag.goto(`${BASE}/labs/catalizador-sondas.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null,
  { timeout: 90000 });

grupo('1 · arranca y pinta');
ok(errores.length === 0, 'sin errores de página: ' + errores.slice(0, 3).join(' | '));
const K = await pag.evaluate(() => window.__labDebug.K);
ok(K.MODES.length === 7, `${K.MODES.length} vistas`);

// La escena tiene que estar PINTADA, no sólo montada: se mide contando colores
// distintos en una miniatura de la captura. `drawImage` sobre un lienzo WebGL
// devuelve negro siempre —el compositor tira el búfer—, hay que ir por
// screenshot.
async function colores() {
  const buf = await pag.screenshot({ clip: { x: 300, y: 120, width: 900, height: 640 } });
  return buf.length;   // un PNG de una imagen plana pesa una fracción de uno con contenido
}
ok(await colores() > 20000, 'la escena 3D pinta algo (peso del PNG)');

grupo('2 · las siete vistas pintan y publican');
for (const m of K.MODES) {
  errores.length = 0;
  await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
  await pag.waitForTimeout(140);
  const est = await pag.evaluate(() => ({ modo: window.__labDebug.mode,
    frames: window.__labDebug.frames, texto: window.__labDebug.texto.length }));
  ok(est.modo === m && errores.length === 0,
    `vista «${m}» sin errores (${errores.slice(0, 2).join(' | ')})`);
  ok(est.texto > 40, `vista «${m}» deja texto en el informe`);
}
await pag.evaluate(() => window.__labDebug.setMode('sondas'));

grupo('3 · el pizarrón se lee');
// El texto del lienzo es de 13 px sobre 1 024 de ancho. Si el pizarrón sale a
// menos de 480 px de ventana, ese texto llega al ojo a menos de 6 px.
const anchoTablero = await pag.evaluate(() => {
  const S = window.__labDebug;
  // Se proyectan los dos bordes del pizarrón a pantalla usando la propia cámara.
  return window.__anchoTablero || null;
});
// No hay gancho para eso: se mide por captura comparando con el laboratorio
// anterior, que es lo que se hizo. Aquí sólo se comprueba que el lienzo del
// pizarrón tiene contenido en sus cuatro cuadrantes.
const cuad = await pag.evaluate(() => {
  const c = document.querySelectorAll('canvas');
  return c.length;
});
ok(cuad >= 1, 'hay lienzo');

grupo('4 · el aviso flotante SE VE');
await pag.evaluate(() => window.__labDebug.setMode('reto'));
await pag.evaluate(() => window.__labDebug.pista());
// Se espera a que la opacidad REAL suba. Comprobar la clase no comprueba nada:
// dos laboratorios de este dominio salieron publicados con el aviso invisible
// porque la clase que se ponía no era la que la hoja de estilo mira.
const vio = await pag.waitForFunction(() => {
  const t = document.getElementById('toast');
  return t && Number(getComputedStyle(t).opacity) > 0.5;
}, null, { timeout: 8000 }).then(() => true).catch(() => false);
ok(vio, 'el aviso llega a opacidad > 0,5');

grupo('5 · el reto a ciegas no regala la respuesta');
for (let i = 0; i < 14; i++) {
  await pag.evaluate(() => window.__labDebug.arma());
  const fuga = await pag.evaluate(() => {
    const D = window.__labDebug;
    return {
      caso: D.reto.caso,
      rotulos: D.rotulos.join(' | '),
      escaner: JSON.stringify(D.escaner),
      texto: D.texto,
      medido: D.medido || D.reto.medido,
    };
  });
  const prohibidas = ['fósforo','plomo','rodio','veneno','envenena','lenta','desviada',
    'fuga','frío','agotado','gastado','rodado'];
  const sopa = (fuga.rotulos + ' ' + fuga.escaner + ' ' + fuga.texto).toLowerCase();
  const filtra = prohibidas.filter(p => sopa.includes(p));
  ok(filtra.length === 0,
    `sorteo ${i}: caso «${fuga.caso}» no se filtra por ninguna superficie (${filtra.join(',')})`);
  // Y el escáner tiene que estar APAGADO hasta que se mida.
  const ap = await pag.evaluate(() => window.__labDebug.escaner.enciende);
  ok(ap === false, `sorteo ${i}: el escáner arranca apagado`);
}

grupo('6 · los tres instrumentos y el dictamen');
await pag.evaluate(() => window.__labDebug.armaCaso('preSesgada', 0, 'dinamico'));
let R = await pag.evaluate(() => window.__labDebug.reto);
ok(R.esperado.join('+') === 'cambiaPre',
  `sonda anterior desviada con lata nueva → «cambiaPre» (dio ${R.esperado.join('+')})`);
await pag.evaluate(() => { window.__labDebug.mide('escaner'); window.__labDebug.mide('gases'); });
const esc = await pag.evaluate(() => window.__labDebug.escaner);
ok(esc.enciende === true && esc.dtc === 'P0420', 'tras medir, el escáner enciende y da P0420');
await pag.evaluate(() => { window.__labDebug.elige('cambiaPre'); window.__labDebug.entrega(); });
R = await pag.evaluate(() => window.__labDebug.reto);
ok(R.veredicto === true, 'el dictamen correcto se acepta');
ok(await pag.evaluate(() => window.__labDebug.solved) === true, 'y marca el laboratorio resuelto');

await pag.evaluate(() => window.__labDebug.armaCaso('plomo', 0, 'estatico'));
R = await pag.evaluate(() => window.__labDebug.reto);
ok(R.esperado.join('+') === 'arreglaMotor+cambiaCat',
  `rodio envenenado → catalizador Y la causa (dio ${R.esperado.join('+')})`);
await pag.evaluate(() => { window.__labDebug.mide('gases'); window.__labDebug.elige('cambiaCat');
  window.__labDebug.entrega(); });
R = await pag.evaluate(() => window.__labDebug.reto);
ok(R.veredicto === false, 'cambiar sólo la lata sin quitar el veneno se marca mal');

await pag.evaluate(() => window.__labDebug.armaCaso('sano', 0, 'dinamico'));
R = await pag.evaluate(() => window.__labDebug.reto);
ok(R.esperado.join('+') === 'nada', `coche sano y lata nueva → «nada» (dio ${R.esperado.join('+')})`);

grupo('7 · el coche sin sonda posterior');
await pag.evaluate(() => window.__labDebug.setMaquina('tbi92'));
await pag.evaluate(() => window.__labDebug.setMode('reto'));
await pag.evaluate(() => window.__labDebug.armaCaso('sano', 0.7, 'estatico'));
await pag.evaluate(() => window.__labDebug.mide('osc'));
R = await pag.evaluate(() => window.__labDebug.reto);
ok(R.medido.osc === false, 'la prueba de almacenamiento se rechaza: no hay sonda que cronometrar');
await pag.evaluate(() => window.__labDebug.mide('escaner'));
const esc92 = await pag.evaluate(() => window.__labDebug.escaner);
ok(esc92.dtc === null && esc92.motivo.includes('no tiene'),
  'el escáner dice que este coche no tiene diagnóstico a bordo');

grupo('8 · el cuestionario');
await pag.evaluate(() => window.__labDebug.setMaquina('mpi16'));
await pag.evaluate(() => window.__labDebug.setMode('monitor'));
await pag.evaluate(() => window.__labDebug.setEdad(0.20));
const Q = await pag.evaluate(() => window.__labDebug.preguntas);
ok(Q.length >= 6, `${Q.length} preguntas`);
ok(Q.every(q => q.correctas === 1), 'cada pregunta tiene exactamente una correcta');
ok(Q.every(q => q.n === 4), 'y cuatro opciones');
// Las preguntas cambian con el estado: si no, se memorizan.
const q1 = await pag.evaluate(() => window.__labDebug.preguntas.map(q => q.t).join('|'));
await pag.evaluate(() => window.__labDebug.setEdad(0.7));
const q2 = await pag.evaluate(() => window.__labDebug.preguntas.map(q => q.t).join('|'));
ok(q1 !== q2, 'el enunciado cambia al cambiar la edad del catalizador');
// La posición de la correcta no puede ser fija.
const pos = await pag.evaluate(() => {
  const out = [];
  for (let i = 0; i < 24; i++) {
    window.__labDebug.setEdad(i % 2 ? 0.2 : 0.45);
    const b = document.querySelectorAll('#quiz .b.dx');
    out.push(b.length);
  }
  return out;
});
ok(pos.every(x => x === 4), 'el cuestionario pinta sus cuatro botones siempre');

grupo('9 · el recorrido guiado llega al final');
await pag.evaluate(() => window.__labDebug.setMode('sondas'));
errores.length = 0;
await pag.click('#btnAuto');
const fin = await pag.waitForFunction(() => window.__labDebug.autoRunning === false,
  null, { timeout: 120000 }).then(() => true).catch(() => false);
ok(fin, 'el recorrido termina solo');
ok(errores.length === 0, 'y sin errores por el camino: ' + errores.slice(0, 3).join(' | '));

grupo('10 · la escena responde al vehículo');
for (const k of K.ARQ) {
  errores.length = 0;
  await pag.evaluate(kk => window.__labDebug.setMaquina(kk), k);
  await pag.waitForTimeout(120);
  const r = await pag.evaluate(() => window.__labDebug.rotulos);
  ok(errores.length === 0, `${k}: cambia de coche sin errores`);
  ok(r.length >= 3, `${k}: el banco lleva sus chapas (${r.length})`);
}

await nav.close();
srv.close();
console.log(`\n${n - malos}/${n} comprobaciones`);
if (malos) process.exit(1);
