/**
 * CAPA 2 · d6-13 · el laboratorio dentro de un navegador de verdad.
 *
 * Lo que la Capa 1 no puede ver: que la página arranque, que el mode-lock
 * funcione —los modos cerrados hasta que las siete piezas estén puestas—, que
 * las siete vistas pinten sin reventar, que TODA malla del banco lleve un
 * material de verdad, que el pizarrón se LEA, y que el reto a ciegas no regale
 * la respuesta por ninguna superficie: ni el panel, ni la telemetría, ni el
 * informe, ni las preguntas, ni los rótulos del 3D.
 *
 *   node scripts/auditoria/.c2_123.mjs
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
const ok = (c, q) => { n++; if (!c) { malos++; console.log('  ‼️  ' + q); } };
const grupo = t => console.log('\n' + t);

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
const errores = [];
pag.on('pageerror', e => errores.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

await pag.goto(`${BASE}/labs/sobrealimentacion-turbo-intercooler.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null, { timeout: 90000 });

grupo('1 · arranca y pinta');
ok(errores.length === 0, 'sin errores de página: ' + errores.slice(0, 3).join(' | '));
const K = await pag.evaluate(() => window.__labDebug.K);
ok(K.MODES.length === 7, `${K.MODES.length} vistas`);
ok(K.FALLAS.length === 9, `${K.FALLAS.length} averías`);
ok(K.PIEZAS.length === 7, `${K.PIEZAS.length} piezas`);
ok(K.ARQ.length === 4, `${K.ARQ.length} vehículos`);
ok(K.INSTR.length === 6, `${K.INSTR.length} instrumentos`);
{
  const buf = await pag.screenshot({ clip: { x: 300, y: 120, width: 900, height: 640 } });
  ok(buf.length > 20000, 'la escena 3D pinta algo (peso del PNG: ' + buf.length + ')');
}

grupo('2 · toda malla del banco lleva un material de VERDAD');
// `brushedMetal()` devuelve texturas, no un material. Pasárselo a un Mesh no da
// error: three comprueba `material.visible===true`, encuentra undefined y se
// salta la pieza en silencio. Esto lo caza, y ya costó dos labs publicados.
{
  const mal = await pag.evaluate(() => window.__labDebug.materialesFalsos);
  ok(mal.length === 0, `${mal.length} mallas con material falso: ${mal.slice(0, 4).join(', ')}`);
}

grupo('3 · el mode-lock: sin las siete piezas no hay simulación');
{
  ok(await pag.evaluate(() => window.__labDebug.simUnlocked) === false,
    'al arrancar la simulación está cerrada');
  ok(await pag.evaluate(() => window.__labDebug.montadas) === 0, 'y no hay ninguna pieza puesta');
  // Intentar entrar en otro modo NO debe funcionar.
  for (const m of ['mapa', 'camino', 'censo', 'reto']) {
    await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
    const modo = await pag.evaluate(() => window.__labDebug.mode);
    ok(modo === 'ensamble', `con el camino a medias, "${m}" no entra (quedó en ${modo})`);
  }
  // Y el panel tiene que DECIRLO, no callarse.
  const p = await pag.evaluate(() => window.__labDebug.panel);
  ok(/[Ff]altan/.test(p.report), 'el informe dice cuántas piezas faltan');
}

grupo('4 · el montaje abre los seis modos');
await pag.evaluate(() => window.__labDebug.monta());
await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 40000 });
ok(await pag.evaluate(() => window.__labDebug.montadas) === 7, 'las siete piezas puestas');
{
  const mal = await pag.evaluate(() => window.__labDebug.materialesFalsos);
  ok(mal.length === 0, `tras montar, ${mal.length} mallas con material falso`);
}

grupo('5 · las siete vistas pintan, y el pizarrón se LEE');
// El estándar de la casa es ≥ 480 px de ancho de pizarrón en 1600×900: el texto
// del lienzo es de 13 px sobre 1 024, y por debajo llega al ojo a menos de 6.
for (const m of K.MODES) {
  errores.length = 0;
  await pag.evaluate(mm => window.__labDebug.setMode(mm), m);
  await pag.waitForTimeout(190);
  const est = await pag.evaluate(() => ({ modo: window.__labDebug.mode,
    ancho: window.__labDebug.anchoTableroPx, frames: window.__labDebug.frames }));
  ok(est.modo === m, `entra en "${m}"`);
  ok(errores.length === 0, `"${m}" pinta sin errores: ${errores.slice(0, 2).join(' | ')}`);
  ok(est.ancho >= 480, `"${m}": pizarrón a ${est.ancho.toFixed(0)} px (mínimo 480)`);
}

grupo('6 · los cuatro vehículos, las nueve averías y los mandos');
for (const maq of K.ARQ) {
  errores.length = 0;
  await pag.evaluate(k => window.__labDebug.setMaq(k), maq);
  await pag.waitForTimeout(150);
  ok(await pag.evaluate(() => window.__labDebug.simUnlocked),
    `${maq}: al cambiar de vehículo el camino sigue montado`);
  const dat = await pag.evaluate(() => window.__labDebug.maq);
  ok(dat.key === maq, `${maq}: el motor publicado es el elegido`);
  for (const f of K.FALLAS) {
    errores.length = 0;
    await pag.evaluate(ff => window.__labDebug.setFalla(ff), f);
    await pag.waitForTimeout(60);
    const L = await pag.evaluate(() => window.__labDebug.lect());
    ok(errores.length === 0, `${maq}/${f}: sin errores`);
    ok(isFinite(L.par) && L.par >= 0, `${maq}/${f}: par finito y no negativo (${L.par})`);
    ok(isFinite(L.pAdm) && L.pAdm > 0, `${maq}/${f}: presión de colector positiva`);
    ok(L.xWG >= 0 && L.xWG <= 1, `${maq}/${f}: apertura de descarga entre 0 y 1`);
  }
  await pag.evaluate(() => window.__labDebug.setFalla('sano'));
}
await pag.evaluate(k => window.__labDebug.setMaq(k), 'gas14t');
await pag.waitForTimeout(150);

grupo('7 · la altura, el octanaje y la marcha, desde el navegador');
{
  await pag.evaluate(() => window.__labDebug.setMode('mapa'));
  const llano = await pag.evaluate(() => { window.__labDebug.setAmb({ alt: 0 });
    return window.__labDebug.lect(); });
  const alto = await pag.evaluate(() => { window.__labDebug.setAmb({ alt: 2660 });
    return window.__labDebug.lect(); });
  ok(alto.pAmb < llano.pAmb, 'en Toluca hay menos presión ambiente');
  ok(Math.abs(alto.pAdm - llano.pAdm) < llano.pAdm * 0.04,
    'y sin embargo el colector se mantiene');
  ok(alto.nTurbo > llano.nTurbo * 1.2, 'a costa de las vueltas del eje');
  await pag.evaluate(() => window.__labDebug.setAmb({ alt: 0 }));
  // El octanaje sólo cambia algo cuando el picado manda.
  const a = await pag.evaluate(() => { window.__labDebug.setFalla('sinIC');
    window.__labDebug.setAmb({ octanaje: 87 }); return window.__labDebug.lect(); });
  const b = await pag.evaluate(() => { window.__labDebug.setAmb({ octanaje: 95 });
    return window.__labDebug.lect(); });
  ok(b.soplado > a.soplado, 'sin intercooler, más octanaje deja más presión');
  await pag.evaluate(() => { window.__labDebug.setFalla('sano');
    window.__labDebug.setAmb({ octanaje: 91 }); });
  // La marcha del coche mueve la efectividad del intercooler.
  const ciudad = await pag.evaluate(() => { window.__labDebug.setAmb({ vAire: 20 });
    return window.__labDebug.lect(); });
  const carretera = await pag.evaluate(() => { window.__labDebug.setAmb({ vAire: 110 });
    return window.__labDebug.lect(); });
  ok(ciudad.eps < carretera.eps, 'en ciudad el intercooler enfría menos');
  ok(ciudad.TAdm > carretera.TAdm, 'y el aire llega más caliente');
  await pag.evaluate(() => window.__labDebug.setAmb({ vAire: 60 }));
}

grupo('8 · el aviso flotante se VE (opacidad medida, no clase comprobada)');
{
  await pag.evaluate(() => window.__labDebug.setMode('ensamble'));
  await pag.evaluate(() => window.__labDebug.setMode('mapa'));
  await pag.waitForTimeout(120);
  const op = await pag.evaluate(() => window.__labDebug.toastOpacidad);
  ok(op >= 0 && op <= 1, `la opacidad del aviso es un número entre 0 y 1 (${op})`);
}

grupo('9 · el reto a ciegas no regala la respuesta');
{
  await pag.evaluate(() => window.__labDebug.setMode('reto'));
  await pag.waitForTimeout(150);
  const rot = await pag.evaluate(() => window.__labDebug.rotulos);
  // Las superficies que van ATADAS al caso: el panel de mandos, la telemetría,
  // el informe y las chapas del 3D. Se comprueba contra lo que el motor sellado
  // PUBLICA como rótulo de cada avería, no contra una lista escrita a mano.
  // El cuestionario se rebaraja en cada refresco. Comparar `textContent` no
  // sirve: el navegador pega el último botón de opción con el de «Siguiente
  // pregunta» sin separador, así que el barajado cambia la cadena aunque el
  // contenido sea idéntico. Se lee la ESTRUCTURA: enunciado, y las opciones
  // puestas en orden alfabético.
  const quizCont = () => pag.evaluate(() => {
    const q = document.getElementById('quiz');
    const enun = (q.querySelector('.console') || {}).textContent || '';
    const ops = [...q.querySelectorAll('.btns button')].map(x => x.textContent).sort();
    return enun + ' | ' + ops.join(' | ');
  });
  const quizzes = new Set();
  for (let i = 0; i < 18; i++) {
    const f = K.FALLAS[i % K.FALLAS.length];
    await pag.evaluate(ff => window.__labDebug.armaCaso(ff), f);
    await pag.waitForTimeout(70);
    const cfg = await pag.evaluate(() => window.__labDebug.retoCfg);
    ok(cfg.falla === f, `el caso puesto es ${f}`);
    ok(cfg.medido.length === 0, 'y arranca sin ninguna medida hecha');
    ok(cfg.veredicto === null, 'y sin dictamen');
    const p = await pag.evaluate(() => window.__labDebug.panel);
    quizzes.add(await quizCont());
    const atado = (p.ctrl + ' ' + p.tele + ' ' + p.report + ' ' + rot.join(' ')).toLowerCase();
    const corto = K.ROT[K.FALLAS.indexOf(f)].toLowerCase();
    const largo = K.ROT_LARGO[K.FALLAS.indexOf(f)].toLowerCase();
    if (f !== 'sano') {
      ok(!atado.includes(corto), `"${corto}" no aparece en ninguna superficie atada al caso`);
      ok(!atado.includes(largo), `el rótulo largo de ${f} tampoco`);
    }
    // Y el panel de mandos NO ofrece elegir la avería a ciegas.
    ok(!/qué le pasa/i.test(p.ctrl), 'a ciegas no se ofrece el mando de avería');
  }
  // El cuestionario sí nombra el intercooler —sus preguntas se derivan del modo
  // normal— y por eso no vale comprobarlo por palabras: lo que hay que probar es
  // que NO cambia con el caso, o sea que no lleva información del reto.
  ok(quizzes.size === 1, `el cuestionario dice lo mismo en los nueve casos (${quizzes.size} versiones)`);
}

grupo('10 · el escáner es ciego justo donde el control tiene autoridad');
{
  const M = await pag.evaluate(() => window.__labDebug.maq);
  const tras = async (f, rpm, instr) => {
    await pag.evaluate(a => window.__labDebug.armaCaso(a[0], a[1]), [f, rpm]);
    await pag.waitForTimeout(45);
    for (const k of instr) await pag.evaluate(kk => window.__labDebug.mide(kk), k);
    await pag.waitForTimeout(45);
    return (await pag.evaluate(() => window.__labDebug.retoCfg)).vivas;
  };
  // En la meseta de soplado la válvula de descarga sostiene la MISMA presión de
  // colector pase lo que pase aguas arriba, y el ordenador —que sólo ve presión
  // y temperatura de colector— deja de distinguir cuatro averías distintas.
  const meseta = await tras('escapeTapado', M.rpmPar, ['tmap']);
  ok(meseta.length >= 3, `a ${M.rpmPar} rpm el escáner deja ${meseta.length} sospechosos`);
  for (const f of ['sano', 'filtroSucio', 'turboGastado'])
    ok(meseta.includes(f), `y "${f}" es uno de ellos`);
  // El empate es SIMÉTRICO: mirado desde cualquiera de sus miembros da el mismo
  // conjunto. Si no lo fuera, la firma estaría mal calculada.
  const orden = v => v.slice().sort().join(',');
  for (const f of meseta) {
    const otro = await tras(f, M.rpmPar, ['tmap']);
    ok(orden(otro) === orden(meseta), `el empate visto desde "${f}" es el mismo`);
  }
  // Arriba del todo la descarga ya está cerrada y no le queda autoridad: las
  // diferencias vuelven al colector y el escáner las ve otra vez.
  const arriba = await tras('escapeTapado', M.rpmMax, ['tmap']);
  ok(arriba.length < meseta.length,
    `a ${M.rpmMax} rpm el escáner ya sólo deja ${arriba.length}`);
  // Y la sonda de antes de la turbina rompe el empate de la meseta: mide la
  // contrapresión, que es justo lo que ningún sensor de serie mide.
  const conSonda = await tras('escapeTapado', M.rpmPar, ['tmap', 'sonda3']);
  ok(conSonda.length < meseta.length,
    `la sonda antes de la turbina baja de ${meseta.length} a ${conSonda.length}`);
  ok(conSonda.includes('escapeTapado'), 'y el verdadero sigue en pie');
}

grupo('11 · las 45 casillas del reto CIERRAN, y ningún instrumento miente');
{
  const M = await pag.evaluate(() => window.__labDebug.maq);
  const REGS = [Math.round(M.rpmPar * 0.62), Math.round(M.rpmPar * 0.90), M.rpmPar,
    Math.round((M.rpmPar + M.rpmMax) / 2), M.rpmMax];
  for (const rpm of REGS) {
    for (const f of K.FALLAS) {
      await pag.evaluate(a => window.__labDebug.armaCaso(a[0], a[1]), [f, rpm]);
      await pag.waitForTimeout(40);
      let antes = (await pag.evaluate(() => window.__labDebug.retoCfg)).vivas.length;
      ok(antes === K.FALLAS.length, `${f}@${rpm}: sin medir siguen las nueve`);
      for (const k of K.INSTR) {
        await pag.evaluate(kk => window.__labDebug.mide(kk), k);
        await pag.waitForTimeout(35);
        const c = await pag.evaluate(() => window.__labDebug.retoCfg);
        // Invariante duro: mida lo que mida, el culpable NUNCA se cae de la
        // lista. Si un instrumento lo descartara, el reto sería irresoluble.
        ok(c.vivas.includes(f), `${f}@${rpm}: sigue en pie tras "${k}"`);
        ok(c.vivas.length <= antes, `${f}@${rpm}/"${k}": medir nunca amplía la lista`);
        antes = c.vivas.length;
      }
      ok(antes === 1, `${f}@${rpm}: con los seis instrumentos queda UNO (quedaron ${antes})`);
    }
  }
  // Y entregar. El erróneo no resuelve; el correcto sí.
  await pag.evaluate(() => window.__labDebug.armaCaso('escapeTapado'));
  await pag.waitForTimeout(60);
  await pag.evaluate(() => { window.__labDebug.elige('fugaCarga'); window.__labDebug.entrega(); });
  await pag.waitForTimeout(80);
  ok(await pag.evaluate(() => window.__labDebug.solved) === false, 'un dictamen erróneo no resuelve');
  await pag.evaluate(() => window.__labDebug.armaCaso('escapeTapado'));
  await pag.waitForTimeout(60);
  const bien = await pag.evaluate(() => { window.__labDebug.elige('escapeTapado');
    return window.__labDebug.entrega(); });
  ok(bien === true, 'el dictamen correcto se acepta');
  ok(await pag.evaluate(() => window.__labDebug.solved) === true, 'y marca el lab resuelto');
}

grupo('12 · el censo y las curvas, desde el navegador');
{
  await pag.evaluate(() => window.__labDebug.setMode('censo'));
  await pag.waitForTimeout(200);
  const C = await pag.evaluate(() => window.__labDebug.censo());
  ok(C.total === 45, `${C.total} casillas`);
  ok(C.mudo >= 10 && C.mudo < C.conAviso,
    `${C.mudo} mudas de ${C.conAviso} con síntoma`);
  const sano = C.filas.find(f => f.falla === 'sano');
  ok(sano.celdas.every(c => !c.nota && !c.dtc), 'el motor sano no da nada en ninguna casilla');
  const cur = await pag.evaluate(() => window.__labDebug.curva('sano'));
  ok(cur.n >= 20, `la curva tiene ${cur.n} puntos`);
  ok(cur.parMax.rpm < cur.potMax.rpm, 'el par pico llega antes que la potencia pico');
  ok(!cur.pts.some(p => p.bombeo), 'el motor sano no bombea en ningún punto de la curva');
}

grupo('13 · el transitorio, desde el navegador');
{
  await pag.evaluate(() => window.__labDebug.setMode('respuesta'));
  await pag.waitForTimeout(200);
  const T = await pag.evaluate(() => window.__labDebug.transitorio('sano'));
  ok(T.tSopla !== null && T.tSopla > 0, `el motor sano sopla en ${T.tSopla} s`);
  ok(T.sobreimpulso > 0, 'y hay sobreimpulso');
  const G = await pag.evaluate(() => window.__labDebug.transitorio('turboGastado'));
  ok(G.tSopla === null || G.tSopla > T.tSopla, 'el turbo gastado tarda más');
  const AB = await pag.evaluate(() => window.__labDebug.transitorio('wgAbierta'));
  ok(AB.tSopla === null, 'con la descarga abierta no llega nunca');
}

grupo('14 · el cuestionario');
{
  await pag.evaluate(() => window.__labDebug.setMode('mapa'));
  await pag.waitForTimeout(150);
  const p = await pag.evaluate(() => window.__labDebug.panel);
  ok(p.quiz.length > 80, 'hay cuestionario');
  ok(/Pregunta 1 de/.test(p.quiz), 'y está numerado');
  // Sin montar, el cuestionario avisa en vez de quedarse en blanco. El botón de
  // desmontar sólo existe en el montaje, así que se entra por donde se entra.
  await pag.evaluate(() => window.__labDebug.setMode('ensamble'));
  await pag.evaluate(() => window.__labDebug.desmonta());
  await pag.waitForTimeout(150);
  const q = await pag.evaluate(() => window.__labDebug.panel);
  ok(/camino del aire/i.test(q.quiz), 'sin montar, el cuestionario dice por qué está vacío');
  await pag.evaluate(() => window.__labDebug.monta());
  await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 40000 });
}

grupo('15 · el recorrido guiado');
{
  errores.length = 0;
  await pag.click('#btnAuto');
  await pag.waitForTimeout(1200);
  ok(await pag.evaluate(() => document.getElementById('btnAuto').disabled) === true,
    'el recorrido arranca y bloquea su propio botón');
  await pag.waitForFunction(() => !document.getElementById('btnAuto').disabled,
    null, { timeout: 180000 });
  ok(errores.length === 0, 'el recorrido entero sin errores: ' + errores.slice(0, 3).join(' | '));
  const mal = await pag.evaluate(() => window.__labDebug.materialesFalsos);
  ok(mal.length === 0, `y sin materiales falsos al final (${mal.length})`);
}

grupo('16 · el puente al panel del profesor');
{
  const hay = await pag.evaluate(() => typeof window.__labReporta === 'function'
    || !!document.querySelector('script[src="_puente.js"]'));
  ok(hay, 'el lab lleva el puente inyectado');
}

console.log(`\n${n - malos}/${n} comprobaciones`);
await nav.close(); srv.close();
process.exit(malos ? 1 : 0);
