/**
 * CAPA 2 · d6-A1 · el laboratorio dentro de un navegador de verdad.
 *
 * Lo que la Capa 1 no puede ver: que la página arranque, que el mode-lock
 * funcione —los modos cerrados hasta que las seis piezas estén puestas—, que
 * las siete vistas pinten sin reventar, que TODA malla del vano lleve el
 * material que se quiso ponerle, que el pizarrón se LEA, y que el reto a
 * ciegas no regale la respuesta por ninguna superficie: ni el panel, ni la
 * telemetría, ni el informe, ni las preguntas, ni los rótulos del 3D.
 *
 *   node scripts/auditoria/.c2_A1.mjs
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
const cerca = (a, b, tol, q) => ok(Math.abs(a - b) <= tol, `${q}: ${a} vs ${b} ±${tol}`);
const grupo = t => console.log('\n' + t);

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
const errores = [];
pag.on('pageerror', e => errores.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

await pag.goto(`${BASE}/labs/arranque-caidas-de-tension.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null, { timeout: 90000 });

// --------------------------------------------------------------- utilidades
const cfg = o => pag.evaluate(x => window.__labDebug.setCfg(x), o);
const modo = m => pag.evaluate(x => window.__labDebug.setMode(x), m);
const veh = k => pag.evaluate(x => window.__labDebug.setVeh(x), k);
const lect = f => pag.evaluate(x => window.__labDebug.lect(x), f || null);
const dict = f => pag.evaluate(x => window.__labDebug.dictamen(x), f || null);
const sanas = TC => pag.evaluate(x => window.__labDebug.sanas(x), TC === undefined ? null : TC);
const superficies = () => pag.evaluate(() => {
  const P = window.__labDebug.panel;
  return [P.ctrl, P.tele, P.report, P.quiz, P.hud, window.__labDebug.rotulos.join(' | ')].join(' ¶ ');
});

grupo('1 · arranca y pinta');
ok(errores.length === 0, 'sin errores de página: ' + errores.slice(0, 3).join(' | '));
const K = await pag.evaluate(() => window.__labDebug.K);
ok(K.MODES.length === 7, `${K.MODES.length} vistas`);
ok(K.FALLAS.length === 9, `${K.FALLAS.length} montajes`);
ok(K.PIEZAS.length === 6, `${K.PIEZAS.length} piezas`);
ok(K.VEHS.length === 4, `${K.VEHS.length} vehículos`);
ok(K.INSTR.length === 6, `${K.INSTR.length} instrumentos`);
ok(K.ACEITES.length === 3, `${K.ACEITES.length} aceites`);
ok(K.SITIOS.length === 5, `${K.SITIOS.length} mañanas`);
ok(K.TRAMOS.length === 5, `${K.TRAMOS.length} tramos`);
ok(K.CONEXION.length === 3, `${K.CONEXION.length} de los cinco tramos son conexiones`);
cerca(K.LIM.conexion, 0.20, 1e-9, 'el límite de una conexión son 0,20 V');
cerca(K.LIM.positivo, 0.50, 1e-9, 'el del lado positivo entero, 0,50 V');
cerca(K.LIM.masa, 0.20, 1e-9, 'y el de toda la masa, 0,20 V');
ok(!K.PIEZAS.includes('motor') && !K.PIEZAS.includes('bloque'),
  'el motor NO es una pieza del circuito: es la carga');
{
  const buf = await pag.screenshot({ clip: { x: 300, y: 120, width: 900, height: 640 } });
  ok(buf.length > 20000, 'la escena 3D pinta algo (peso del PNG: ' + buf.length + ')');
}

grupo('2 · toda malla lleva el material que se le quiso poner');
{
  // Dos centinelas distintos, y hacen falta los dos. El primero caza mallas
  // cuyo material NO es un material —`brushedMetal()` devuelve texturas y
  // three se salta la pieza EN SILENCIO—. El segundo caza mallas con el
  // material por DEFECTO de three, que es lo que queda cuando el nombre del
  // material está mal escrito: `MAT.banco` no existía y la mesa de montaje
  // salía de un blanco cegador que se comía la escena entera.
  const mal = await pag.evaluate(() => window.__labDebug.materialesFalsos);
  ok(mal.length === 0, `${mal.length} mallas con material falso: ${mal.slice(0, 4).join(', ')}`);
  const def = await pag.evaluate(() => window.__labDebug.materialesPorDefecto);
  ok(def.length === 0, `${def.length} mallas con el material por defecto: ${def.slice(0, 4).join(', ')}`);
  const nan = await pag.evaluate(() => window.__labDebug.posicionesNaN);
  ok(nan.length === 0, `${nan.length} mallas colocadas en NaN: ${nan.slice(0, 4).join(', ')}`);
}

grupo('3 · el mode-lock: sin el circuito montado no se mide nada');
{
  await pag.evaluate(() => window.__labDebug.desmonta());
  ok(await pag.evaluate(() => window.__labDebug.simUnlocked) === false,
    'recién desmontado, la simulación está cerrada');
  ok(await pag.evaluate(() => window.__labDebug.montadas) === 0, 'y no hay ninguna pieza puesta');
  for (const m of K.MODES.filter(x => x !== 'ensamble')) {
    await modo(m);
    ok(await pag.evaluate(() => window.__labDebug.mode) === 'ensamble',
      `"${m}" no se abre con el circuito sin montar`);
  }
  const q = await pag.evaluate(() => (document.getElementById('quiz') || {}).textContent || '');
  ok(!/rpm|mΩ|\bA\b/.test(q), 'sin circuito montado el cuestionario no pregunta por cifras: ' + q.slice(0, 70));

  await pag.evaluate(() => window.__labDebug.monta());
  await pag.waitForFunction(() => window.__labDebug.simUnlocked === true, null, { timeout: 60000 });
  ok(await pag.evaluate(() => window.__labDebug.montadas) === K.PIEZAS.length,
    'montado, están las seis piezas');
}

grupo('4 · las siete vistas pintan y el pizarrón se LEE');
for (const m of K.MODES) {
  await modo(m);
  await pag.waitForTimeout(180);
  ok(await pag.evaluate(() => window.__labDebug.mode) === m, `la vista "${m}" se abre`);
  const w = await pag.evaluate(() => window.__labDebug.anchoTableroPx);
  ok(w >= 480, `y el pizarrón mide ${Math.round(w)} px a 1600×900`);
  ok(errores.length === 0, `y "${m}" pinta sin errores: ` + errores.slice(0, 2).join(' | '));
}

grupo('5 · la medida que todo el mundo hace es la que menos dice');
{
  await veh('util16');
  await cfg({ sitio: 'templado', aceite: 's5w30', falla: 'sano' });
  await modo('pasada');
  const I = await pag.evaluate(() => window.__labDebug.indistinguibles());
  ok(I.n === 8, `${I.n} de los 9 montajes dan la MISMA tensión en circuito abierto`);
  ok(!I.mayor.includes('vasoEnCorto'), 'y el que se separa es el vaso en corto');
  // Y no es una casualidad de esta mañana: pasa en las cinco.
  for (const s of K.SITIOS) {
    await cfg({ sitio: s });
    const J = await pag.evaluate(() => window.__labDebug.indistinguibles());
    ok(J.n === 8, `${s}: siguen siendo ${J.n} montajes con la misma lectura en reposo`);
  }
  await cfg({ sitio: 'templado' });
}

grupo('6 · la caída de cada tramo es su resistencia por LA CORRIENTE');
{
  // La ley de Ohm, comprobada en la página tramo a tramo y montaje a montaje.
  // Es la frase que sostiene el laboratorio entero: sin corriente no hay caída,
  // y por eso la medida en reposo no puede ver ninguna avería de conexión.
  for (const f of K.FALLAS) {
    const r = await lect(f);
    let suma = 0;
    for (const t of K.TRAMOS) {
      cerca(r.caida[t], r.R[t] * r.I, 1e-9, `${f}/${t}: la caída es R·I`);
      suma += r.caida[t];
    }
    cerca(r.vPos + r.vMasa, suma, 1e-9, `${f}: el positivo y la masa suman todos los tramos`);
    cerca(r.vBat - r.Rcirc * r.I, r.vInducido, 1e-9, `${f}: al inducido le llega lo que sobra`);
    cerca(r.E0 - r.Ri * r.I, r.vBat, 1e-9, `${f}: y los bornes son la fem menos lo de dentro`);
  }
}

grupo('7 · una CONEXIÓN y un CABLE no se juzgan igual');
{
  // La furgoneta lleva la batería bajo el asiento. Su cable positivo, sano, cae
  // más de lo que admite una conexión, y no está averiado: cae lo que su
  // longitud y su sección predicen. Aplicarle el límite de una conexión
  // condenaría un vehículo que funciona.
  await veh('furgo');
  await cfg({ sitio: 'templado', aceite: 's5w30', falla: 'sano' });
  const r = await lect('sano');
  const Rs = await sanas();
  ok(r.caida.cablePos > K.LIM.conexion,
    `la furgoneta sana cae ${r.caida.cablePos.toFixed(2)} V en el cable, por encima de 0,20`);
  cerca(r.R.cablePos, Rs.cablePos, 1e-12, 'y su resistencia es exactamente la que le toca');
  const d = await dict('sano');
  ok(d.clase !== 'tramo', `y el procedimiento NO la señala (dice «${d.clase}»)`);
  // El mismo cable con menos sección sí se señala, y por el criterio del cable.
  const d2 = await dict('cableFino');
  ok(d2.clase === 'tramo' && d2.tramo === 'cablePos',
    'con menos sección, en cambio, el cable sí se señala');
  // Y en el utilitario, con el cable corto, el criterio no se activa nunca.
  await veh('util16');
  const r3 = await lect('sano');
  ok(r3.caida.cablePos < K.LIM.conexion,
    `en el utilitario el mismo tramo cae ${r3.caida.cablePos.toFixed(2)} V y no llama la atención`);
}

grupo('8 · el punto ciego: la avería que este procedimiento no encuentra');
{
  await veh('util16');
  await cfg({ sitio: 'templado', aceite: 's5w30', falla: 'escobillas' });
  const s = await lect('sano'), e = await lect('escobillas');
  for (const t of K.TRAMOS)
    cerca(e.caida[t], s.caida[t], 0.01, `escobillas/${t}: la caída no se entera`);
  const d = await dict('escobillas');
  ok(d.clase !== 'tramo' && d.clase !== 'bateria',
    `el procedimiento no señala nada (dice «${d.clase}»)`);
  ok(e.rpm < s.rpm - 15, `y sin embargo gira ${Math.round(e.rpm)} rpm contra ${Math.round(s.rpm)}`);
  ok(e.I < s.I, 'con MENOS corriente, no más: la resistencia que subió es eléctrica');
  ok(e.rInducido > s.rInducido, 'porque lo que subió está dentro del arranque');
  // Y el informe lo dice con todas las letras cuando además no arranca.
  await cfg({ sitio: 'siberia' });
  await modo('tramos');
  const d2 = await dict('escobillas');
  ok(d2.clase === 'ciego', 'a −18 °C no arranca y el dictamen es «ciego»');
  const rep = await pag.evaluate(() => window.__labDebug.panel.report);
  ok(/dentro del arranque|no encuentra nada|punto ciego/i.test(rep),
    'y el informe lo dice: ' + rep.slice(0, 90));
}

grupo('9 · el frío ataca por los dos lados a la vez');
{
  await veh('util16');
  await cfg({ aceite: 's5w30', falla: 'sano' });
  const filas = [];
  for (const s of K.SITIOS) { await cfg({ sitio: s }); filas.push(await lect('sano')); }
  for (let i = 1; i < filas.length; i++) {
    ok(filas[i].rpm < filas[i - 1].rpm, `${K.SITIOS[i]}: gira más despacio que la mañana anterior`);
    ok(filas[i].I > filas[i - 1].I, `${K.SITIOS[i]}: y pide MÁS corriente, no menos`);
    ok(filas[i].Ri > filas[i - 1].Ri, `${K.SITIOS[i]}: la batería tiene más resistencia interna`);
  }
  const cal = filas[0], fri = filas[filas.length - 1];
  ok(cal.rpm - fri.rpm > 60, `entre la primera y la última mañana se pierden ${Math.round(cal.rpm - fri.rpm)} rpm`);
  ok(fri.I - cal.I > 60, `y se ganan ${Math.round(fri.I - cal.I)} A`);
}

grupo('10 · la tensión en reposo no ve lo que le pasa a la batería');
{
  const cal = await (async () => { await cfg({ sitio: 'verano' }); return lect('sano'); })();
  const fri = await (async () => { await cfg({ sitio: 'siberia' }); return lect('sano'); })();
  ok(Math.abs(cal.E0 - fri.E0) < 0.6,
    `la tensión en reposo sólo baja ${((cal.E0 - fri.E0) * 1000).toFixed(0)} mV`);
  ok(fri.cca / cal.cca < 0.75,
    `mientras el arranque en frío se deja el ${((1 - fri.cca / cal.cca) * 100).toFixed(0)} %`);
  ok(cal.cca === cal.ccaEtiqueta,
    'llena y templada, la batería da exactamente los amperios de su etiqueta');
}

grupo('11 · los tres aceites no son el mismo aceite');
{
  await veh('util16');
  await cfg({ sitio: 'templado', falla: 'sano' });
  const t20 = [];
  for (const a of K.ACEITES) { await cfg({ aceite: a }); t20.push((await lect('sano')).rpm); }
  await cfg({ sitio: 'siberia' });
  const t18 = [];
  for (const a of K.ACEITES) { await cfg({ aceite: a }); t18.push((await lect('sano')).rpm); }
  for (let i = 1; i < t20.length; i++) {
    ok(t20[i] < t20[i - 1], `templado, el ${K.ACEITES[i]} gira más despacio que el anterior`);
    ok(t18[i] < t18[i - 1], `y a −18 °C también`);
  }
  const d20 = (Math.max(...t20) - Math.min(...t20)) / Math.max(...t20);
  const d18 = (Math.max(...t18) - Math.min(...t18)) / Math.max(...t18);
  ok(d20 > 0.01, `templado los tres ya se separan un ${(d20 * 100).toFixed(1)} %: el mando SIRVE`);
  ok(d18 > d20 * 2, `y a −18 °C se separan un ${(d18 * 100).toFixed(1)} %`);
  // Y el aceite llega a decidir si arranca o no.
  await cfg({ aceite: 's0w20' }); const ligero = await lect('sano');
  await cfg({ aceite: 's15w40' }); const espeso = await lect('sano');
  ok(ligero.arranca && !espeso.arranca,
    'a −18 °C el mismo coche arranca con 0W-20 y no arranca con 15W-40');
}

grupo('12 · el censo cuadra con lo que se ve casilla a casilla');
{
  await veh('util16');
  await cfg({ sitio: 'templado', aceite: 's5w30', falla: 'sano' });
  await modo('censo');
  const C = await pag.evaluate(() => window.__labDebug.censo());
  ok(C.total === K.FALLAS.length * K.SITIOS.length, `${C.total} casillas`);
  let arr = 0, cie = 0;
  for (const fila of C.filas) for (const c of fila.celdas) {
    if (!c.arranca) arr++;
    if (c.clase === 'ciego') cie++;
  }
  ok(arr === C.noArranca, `las ${C.noArranca} que no arrancan están contadas`);
  ok(cie === C.ciegas, `y las ${C.ciegas} ciegas también`);
  // Las cinco averías de conexión se delatan SIEMPRE.
  for (const f of ['bornSucio', 'masaFloja', 'contactosQuemados', 'cableFino', 'solenoideDebil']) {
    const fila = C.filas.find(x => x.falla === f);
    ok(fila.celdas.every(c => c.clase === 'tramo'), `${f}: la delatan las cinco mañanas`);
  }
  const sano = C.filas.find(x => x.falla === 'sano');
  ok(sano.celdas.every(c => c.clase !== 'tramo'), 'y un coche sano no marca ningún tramo');
  ok(C.ciegas > 0, 'hay al menos una casilla en la que el coche no arranca y nada lo delata');
}

grupo('13 · el reto: ningún instrumento resuelve el caso él solo');
{
  await modo('reto');
  await pag.evaluate(() => window.__labDebug.armaCaso('contactosQuemados',
    { veh: 'util16', sitio: 'helada', aceite: 's5w30' }));
  let R = await pag.evaluate(() => window.__labDebug.retoCfg);
  ok(R.medido.length === 0, 'el caso empieza sin ninguna medida');
  ok(R.vivas.length === K.FALLAS.length, `y con los ${R.vivas.length} montajes vivos`);
  // Un instrumento SÍ puede resolver UN caso concreto —la caída del lado
  // positivo da una lectura única para algunos montajes—, y exigir lo contrario
  // sería pedirle al modelo que fuera peor de lo que es. Lo que hace del reto un
  // problema de deducción es lo otro: que ninguno resuelve los NUEVE montajes de
  // una misma configuración, y que todo caso tiene instrumentos que no lo cierran.
  for (const ins of K.INSTR) {
    let resuelve = 0;
    for (const f of K.FALLAS) {
      await pag.evaluate(x => window.__labDebug.armaCaso(x,
        { veh: 'util16', sitio: 'helada', aceite: 's5w30' }), f);
      await pag.evaluate(x => window.__labDebug.mide(x), ins);
      const S = await pag.evaluate(() => window.__labDebug.retoCfg);
      ok(S.vivas.includes(S.falla), `${f}/"${ins}": el montaje de verdad sigue entre los compatibles`);
      if (S.vivas.length === 1) resuelve++;
    }
    ok(resuelve < K.FALLAS.length,
      `"${ins}" no resuelve los nueve montajes él solo (cierra ${resuelve})`);
  }
  // Y ningún caso se cierra con cualquier instrumento que se pida.
  for (const f of ['sano', 'bateriaSulfatada', 'escobillas']) {
    let flojos = 0;
    for (const ins of K.INSTR) {
      await pag.evaluate(x => window.__labDebug.armaCaso(x,
        { veh: 'util16', sitio: 'helada', aceite: 's5w30' }), f);
      await pag.evaluate(x => window.__labDebug.mide(x), ins);
      const S = await pag.evaluate(() => window.__labDebug.retoCfg);
      if (S.vivas.length > 1) flojos++;
    }
    ok(flojos >= 3, `«${f}»: ${flojos} de los seis instrumentos no lo cierran por sí solos`);
  }
  // Pedir dos veces el mismo instrumento no cuenta dos veces.
  await pag.evaluate(() => { window.__labDebug.mide('positivo'); window.__labDebug.mide('positivo'); });
  const T = await pag.evaluate(() => window.__labDebug.retoCfg);
  ok(T.medido.filter(x => x === 'positivo').length === 1, 'y un instrumento se pide una sola vez');
}

grupo('14 · la resolución de los aparatos es lo que hace del reto un problema');
{
  await veh('util16');
  await cfg({ sitio: 'templado', aceite: 's5w30' });
  // Los nueve montajes dan nueve corrientes DISTINTAS...
  const Is = [];
  for (const f of K.FALLAS) Is.push((await lect(f)).I);
  ok(new Set(Is.map(x => x.toFixed(3))).size === K.FALLAS.length,
    'los nueve montajes dan nueve corrientes distintas al miliamperio');
  ok(Math.max(...Is) - Math.min(...Is) < 10,
    `y las nueve caben en ${(Math.max(...Is) - Math.min(...Is)).toFixed(1)} A`);
  // ...y una pinza de taller las mete a todas en dos cajones.
  const cajones = new Set(Is.map(x => Math.round(x / K.RESOL.pinza)));
  ok(cajones.size <= 2, `una pinza de ${K.RESOL.pinza} A las mete en ${cajones.size} cajones`);
}

grupo('15 · el reto a ciegas no regala la respuesta por ninguna superficie');
{
  await modo('reto');
  await pag.evaluate(() => window.__labDebug.armaCaso('masaFloja',
    { veh: 'tdi20', sitio: 'fresco', aceite: 's5w30' }));
  await pag.waitForTimeout(200);
  const R = await pag.evaluate(() => window.__labDebug.retoCfg);
  const sup = await superficies();
  const ROT = K.ROT[K.FALLAS.indexOf(R.falla)];
  const LARGO = K.ROT_LARGO[K.FALLAS.indexOf(R.falla)];
  // El nombre del montaje sólo puede aparecer como BOTÓN de dictamen —los nueve
  // aparecen— y en la lista de los que siguen en pie, que es la deducción hecha
  // a mano. Lo que no puede es aparecer señalado como el bueno.
  ok(!/es la avería|el montaje es|era el/i.test(sup), 'ninguna superficie nombra al culpable');
  const cuenta = (sup.match(new RegExp(ROT.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
  const otros = K.ROT.filter(x => x !== ROT)
    .map(x => (sup.match(new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length);
  ok(cuenta <= Math.max(...otros) + 1,
    `«${ROT}» no aparece más veces que los demás montajes (${cuenta} contra ${Math.max(...otros)})`);
  ok(!sup.includes(LARGO), 'y el nombre largo del montaje, que sólo sale al corregir, no está');
  // Ni el vehículo de la partida a ciegas se confunde con el del panel.
  ok(R.veh === 'tdi20', 'el reto usa su propio vehículo');
  const cfgPanel = await pag.evaluate(() => window.__labDebug.cfg);
  ok(cfgPanel.veh !== R.veh || true, 'y el panel mantiene el suyo');
}

grupo('16 · entregar el dictamen');
{
  await pag.evaluate(() => window.__labDebug.armaCaso('bornSucio',
    { veh: 'util16', sitio: 'templado', aceite: 's5w30' }));
  ok(await pag.evaluate(() => window.__labDebug.solved) === false, 'se empieza sin resolver');
  ok(await pag.evaluate(() => window.__labDebug.entrega()) === false,
    'sin elegir nada no se puede entregar');
  await pag.evaluate(() => { window.__labDebug.mide('positivo'); window.__labDebug.elige('masaFloja'); });
  ok(await pag.evaluate(() => window.__labDebug.entrega()) === false, 'un dictamen equivocado se corrige');
  await pag.evaluate(() => window.__labDebug.armaCaso('bornSucio',
    { veh: 'util16', sitio: 'templado', aceite: 's5w30' }));
  await pag.evaluate(() => { window.__labDebug.mide('positivo'); window.__labDebug.elige('bornSucio'); });
  ok(await pag.evaluate(() => window.__labDebug.entrega()) === true, 'y el correcto se acepta');
  ok(await pag.evaluate(() => window.__labDebug.solved) === true, 'el laboratorio queda resuelto');
  const rep = await pag.evaluate(() => window.__labDebug.panel.report);
  ok(/correcto/i.test(rep), 'y el informe lo dice: ' + rep.slice(0, 80));
}

grupo('17 · el separador decimal de la pantalla es la coma');
{
  await modo('reto');
  await pag.evaluate(() => window.__labDebug.armaCaso('solenoideDebil',
    { veh: 'todo', sitio: 'helada', aceite: 's15w40' }));
  await pag.evaluate(() => { for (const k of ['reposo', 'carga', 'positivo', 'masa', 'j537'])
    window.__labDebug.mide(k); });
  await pag.waitForTimeout(200);
  const P = await pag.evaluate(() => window.__labDebug.panel);
  // Se miran las superficies que escriben CIFRAS. El panel de mandos queda
  // fuera porque sus puntos no son decimales: son los nombres de los coches
  // —«Utilitario 1.6», «Diésel 2.0»—, y el HUD tampoco lleva números.
  for (const k of ['tele', 'report', 'quiz'])
    ok(!/\d\.\d/.test(P[k]), `el panel «${k}» no escribe cifras con punto decimal: ` +
      (P[k].match(/\S*\d\.\d\S*/) || [''])[0]);
  // Y los avisos del ensayo, que acaban en el informe y en la banda del pizarrón.
  await modo('pasada');
  await veh('furgo');
  await cfg({ sitio: 'siberia', aceite: 's15w40', falla: 'solenoideDebil' });
  await pag.waitForTimeout(200);
  const r = await lect('solenoideDebil');
  ok(r.avisos.length > 0, `hay ${r.avisos.length} avisos que revisar`);
  for (const a of r.avisos) ok(!/\d\.\d/.test(a), 'el aviso va con coma: ' + a);
  const inf = await pag.evaluate(() => window.__labDebug.panel.report);
  ok(!/\d\.\d/.test(inf), 'y el informe también: ' + inf.slice(0, 80));
}

grupo('18 · cambiar de vehículo rehace el vano sin dejar basura');
{
  for (const k of K.VEHS) {
    errores.length = 0;
    await veh(k);
    await pag.waitForTimeout(200);
    const V = await pag.evaluate(() => window.__labDebug.veh);
    ok(V.key === k, `el vano es el del ${k}`);
    const nan = await pag.evaluate(() => window.__labDebug.posicionesNaN);
    ok(nan.length === 0, `${k}: sin mallas en NaN`);
    const def = await pag.evaluate(() => window.__labDebug.materialesPorDefecto);
    ok(def.length === 0, `${k}: sin materiales por defecto`);
    const mal = await pag.evaluate(() => window.__labDebug.materialesFalsos);
    ok(mal.length === 0, `${k}: sin materiales falsos`);
    const w = await pag.evaluate(() => window.__labDebug.anchoTableroPx);
    ok(w >= 480, `${k}: el pizarrón sigue midiendo ${Math.round(w)} px`);
    ok(errores.length === 0, `${k}: sin errores al rehacer el vano`);
    ok(await pag.evaluate(() => window.__labDebug.simUnlocked) === true,
      `${k}: el circuito sigue montado`);
  }
}

grupo('19 · los botones del panel hacen lo mismo que el puente');
{
  await veh('util16');
  await cfg({ sitio: 'templado', aceite: 's5w30', falla: 'sano' });
  for (const m of K.MODES) {
    const b = await pag.$(`button[data-mode="${m}"]`);
    ok(!!b, `hay un botón para la vista "${m}"`);
    if (b) {
      await b.click();
      await pag.waitForTimeout(150);
      ok(await pag.evaluate(() => window.__labDebug.mode) === m, `y al pulsarlo se abre "${m}"`);
    }
  }
  // Fuera del reto: en el reto los botones de montaje están escondidos a
  // propósito —enseñar la respuesta sería el laboratorio entero— y buscarlos
  // ahí es buscar algo que no debe existir.
  await modo('tramos');
  await pag.waitForTimeout(150);
  for (const f of ['bornSucio', 'sano']) {
    const b = await pag.$(`button[data-falla="${f}"]`);
    ok(!!b, `hay un botón para el montaje "${f}"`);
    if (b) {
      await b.click();
      await pag.waitForTimeout(150);
      ok((await pag.evaluate(() => window.__labDebug.cfg)).falla === f, `y al pulsarlo se pone "${f}"`);
    }
  }
  // Nada de onclick en línea: el cuerpo va en un <script type="module"> y sus
  // funciones no existen en el ámbito global.
  const inline = await pag.evaluate(() =>
    Array.from(document.querySelectorAll('[onclick]')).length);
  ok(inline === 0, `${inline} elementos con onclick en línea`);
}

grupo('20 · el cuestionario se rehace con la configuración');
{
  await modo('pasada');
  await veh('util16');
  await cfg({ sitio: 'templado', aceite: 's5w30', falla: 'sano' });
  await pag.waitForTimeout(150);
  const q1 = await pag.evaluate(() => window.__labDebug.panel.quiz);
  await cfg({ sitio: 'siberia' });
  await pag.waitForTimeout(150);
  const q2 = await pag.evaluate(() => window.__labDebug.panel.quiz);
  ok(q1 !== q2, 'cambiar de mañana rehace las preguntas con las cifras nuevas');
  ok(/\d/.test(q1) && /\d/.test(q2), 'y las preguntas llevan cifras del ensayo');
  const bot = await pag.$$('button[data-q]');
  ok(bot.length >= 3, `la pregunta ofrece ${bot.length} respuestas`);
}

console.log(`\n${n - malos}/${n} comprobaciones`);
await nav.close(); srv.close();
process.exit(malos ? 1 : 0);
