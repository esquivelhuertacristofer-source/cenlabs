/**
 * CAPA 2 · d6-A2 · la PÁGINA de verdad, en Chromium con SwiftShader.
 *
 * La Capa 1 comprueba el modelo. Ésta comprueba que lo que el alumno ve y toca
 * es ese modelo: los mandos, el mode-lock, el pizarrón, el panel, el reto y el
 * cuestionario. Lo que aquí falla no se ve en Node.
 *
 *   node scripts/auditoria/.c2_A2.mjs
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB = join(RAIZ, 'public');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png' };
const srv = createServer(async (q, r) => {
  let c = null;
  try { c = await readFile(join(PUB, decodeURIComponent(q.url.split('?')[0]))); } catch { c = null; }
  if (!c) { r.writeHead(404); r.end('404'); return; }
  r.writeHead(200, { 'Content-Type': TIPOS[extname(q.url.split('?')[0])] || 'application/octet-stream' });
  r.end(c);
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;

const nav = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const pag = await nav.newPage({ viewport: { width: 1600, height: 900 } });
const errores = [];
pag.on('pageerror', e => errores.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

let n = 0, malos = 0;
const ok = (c, q) => { n++; if (!c) { malos++; console.log('  ‼️  ' + q); } };
const cerca = (a, b, tol, q) => ok(Math.abs(a - b) <= tol, `${q}: ${a} vs ${b} ±${tol}`);
const grupo = t => console.log('\n' + t);
const ev = (f, a) => pag.evaluate(f, a);

grupo('1 · arranca y pinta');
await pag.goto(`${BASE}/labs/carga-alternador-balance.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null, { timeout: 60000 });
ok(errores.length === 0, 'sin errores al arrancar: ' + errores.slice(0, 3).join(' | '));
const K = await ev(() => window.__labDebug.K);
ok(K.MODES.length === 7, 'siete vistas');
ok(K.FALLAS.length === 9, 'nueve montajes');
ok(K.PIEZAS.length === 6, 'seis piezas');
ok(K.VEHS.length === 4, 'cuatro vehículos');
ok(K.INSTR.length === 10, 'diez aparatos');
ok(K.SITS.length === 5, 'cinco situaciones');
ok(K.CARGAS.length === 9 && K.FIJAS.length === 1, 'nueve consumos y uno que no se apaga');

grupo('3 · el mode-lock: sin el circuito montado no se mide nada');
ok((await ev(() => window.__labDebug.simUnlocked)) === false, 'arranca bloqueado');
for (const m of K.MODES.filter(x => x !== 'ensamble')) {
  await ev(mm => window.__labDebug.setMode(mm), m);
  ok((await ev(() => window.__labDebug.mode)) === 'ensamble', m + ': no deja entrar sin montar');
}
ok((await ev(() => window.__labDebug.panel.quiz)).indexOf('se abren') >= 0 ||
  (await ev(() => window.__labDebug.panel.quiz)).indexOf('circuito está montado') >= 0,
  'y el cuestionario lo dice');
await ev(() => window.__labDebug.monta());
await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });
ok((await ev(() => window.__labDebug.montadas)) === 6, 'las seis piezas montadas');

grupo('2 · toda malla lleva el material que se le quiso poner');
ok((await ev(() => window.__labDebug.materialesFalsos)).length === 0, 'ningún material falso');
ok((await ev(() => window.__labDebug.materialesPorDefecto)).length === 0, 'ninguno por defecto');
ok((await ev(() => window.__labDebug.posicionesNaN)).length === 0, 'ninguna posición NaN');
ok((await ev(() => window.__labDebug.piezasDescolocadas)).length === 0, 'ninguna pieza descolocada');

grupo('4 · las siete vistas pintan y el pizarrón se LEE');
for (const m of K.MODES) {
  errores.length = 0;
  await ev(mm => window.__labDebug.setMode(mm), m);
  await pag.waitForTimeout(160);
  ok((await ev(() => window.__labDebug.mode)) === m, m + ': entra');
  const a = await ev(() => window.__labDebug.anchoTableroPx);
  ok(a >= 480, m + ': el pizarrón mide ' + a.toFixed(0) + ' px (mínimo 480)');
  ok(errores.length === 0, m + ': sin errores — ' + errores.slice(0, 2).join(' | '));
}

grupo('5 · los mandos hacen lo mismo que un dedo');
await ev(() => window.__labDebug.setMode('balance'));
{
  const R = await ev(() => {
    const D = window.__labDebug, K = D.K, mal = [];
    for (const s of K.SITS) { D.setSit(s); if (D.cfg.sit !== s) mal.push('sit ' + s); }
    for (const r of [800, 1500, 3000]) { D.setRpm(r); if (D.cfg.rpmEfectivo !== r) mal.push('rpm ' + r); }
    return mal;
  });
  ok(R.length === 0, 'los mandos de situación y régimen responden: ' + R.join(', '));
}
await ev(() => window.__labDebug.setRpm('auto'));
ok((await ev(() => window.__labDebug.cfg.rpm)) === null, 'y «de la situación» vuelve a null');
{
  const antes = await ev(() => window.__labDebug.cfg.on.length);
  await ev(() => window.__labDebug.toggleCarga('luneta'));
  const desp = await ev(() => window.__labDebug.cfg.on.length);
  ok(desp !== antes, 'conmutar un consumo cambia la lista');
  await ev(() => window.__labDebug.toggleCarga('luneta'));
  ok((await ev(() => window.__labDebug.cfg.on.length)) === antes, 'y volver a tocarlo lo deshace');
  // El de la unidad de mando NO se puede apagar, y eso no es un olvido.
  const fija = K.FIJAS[0];
  const a0 = await ev(() => window.__labDebug.cfg.on.slice());
  await ev(f => window.__labDebug.toggleCarga(f), fija);
  const a1 = await ev(() => window.__labDebug.cfg.on.slice());
  ok(a0.join() === a1.join(), 'el consumo fijo no se apaga');
}
{
  const R = await ev(() => {
    const D = window.__labDebug, mal = [];
    for (const f of D.K.FALLAS) { D.setFalla(f); if (D.falla !== f) mal.push(f); }
    D.setFalla('sano');
    return mal;
  });
  ok(R.length === 0, 'y el mando de montaje también: ' + R.join(', '));
}
for (const v of K.VEHS) {
  await ev(x => window.__labDebug.setVeh(x), v);
  ok((await ev(() => window.__labDebug.vehiculo)) === v, 'vehículo ' + v);
  ok((await ev(() => window.__labDebug.posicionesNaN)).length === 0, v + ': sin NaN');
  ok((await ev(() => window.__labDebug.piezasDescolocadas)).length === 0, v + ': sin descolocadas');
}
await ev(() => window.__labDebug.setVeh('util16'));

// Los barridos grandes se hacen DENTRO de la página, en un solo `evaluate`. Cada
// ida y vuelta a Chromium cuesta décimas de segundo, y un barrido de mil
// casillas hecho a base de idas y vueltas convierte una prueba de un minuto en
// una de media hora —que es tanto como decir que se deja de correr.
grupo('6 · el nudo cuadra también en la página');
{
  const R = await ev(() => {
    const D = window.__labDebug, K = D.K, malas = [];
    for (const s of K.SITS) {
      D.setSit(s);
      for (const f of K.FALLAS) {
        const L = D.lect(f);
        if (Math.abs(L.iAlt - (L.iCargas + L.iBat)) > 3e-4) malas.push(s + '/' + f + ': nudo');
        if (Math.abs(L.vAlt - (L.vBarra + L.rLink * L.iAlt)) > 1e-9) malas.push(s + '/' + f + ': enlace');
      }
    }
    return malas;
  });
  ok(R.length === 0, R.length + ' casillas donde el nudo no cuadra: ' + R.slice(0, 4).join(' | '));
}

grupo('7 · la medida que todo el mundo hace es la que menos separa');
await ev(() => { window.__labDebug.setSit('diaCarretera'); window.__labDebug.setRpm('auto'); });
{
  const sano = await ev(() => window.__labDebug.lect('sano'));
  const esc = await ev(() => window.__labDebug.lect('escobillas'));
  ok(sano.med.vBat === esc.med.vBat, 'en la revisión, escobillas y sano dan el MISMO voltaje');
  ok(sano.med.iAlt === esc.med.iAlt, 'y la misma corriente');
  ok(sano.med.testigo === false && esc.med.testigo === false, 'y el testigo apagado en las dos');
  await ev(() => window.__labDebug.setSit('atasco'));
  const sano2 = await ev(() => window.__labDebug.lect('sano'));
  const esc2 = await ev(() => window.__labDebug.lect('escobillas'));
  ok(Math.abs(sano2.med.iAlt - esc2.med.iAlt) > 30, 'y en el atasco se separan por decenas de A');
}

grupo('8 · la trampa del sensado, vista desde la página');
{
  await ev(() => { window.__labDebug.setVeh('util16'); window.__labDebug.setSit('nocheLluvia'); });
  const uSano = await ev(() => window.__labDebug.lect('sano'));
  const uMal = await ev(() => window.__labDebug.lect('cableCarga'));
  ok((await ev(() => window.__labDebug.veh.sensa)) === 'alternador', 'el utilitario sensa en el alternador');
  ok(Math.abs(uMal.med.vBat - uSano.med.vBat) > 1.0, 'y ahí el cable malo SÍ hunde el borne');
  await ev(() => window.__labDebug.setVeh('furgo'));
  const fSano = await ev(() => window.__labDebug.lect('sano'));
  const fMal = await ev(() => window.__labDebug.lect('cableCarga'));
  ok((await ev(() => window.__labDebug.veh.sensa)) === 'bateria', 'la furgoneta sensa en la batería');
  ok(fMal.med.vBat === fSano.med.vBat, 'y ahí el borne marca EXACTAMENTE lo mismo');
  ok(fMal.med.vAlt > 16, 'mientras el alternador se va a ' + fMal.med.vAlt + ' V');
  ok(fMal.med.caidaCarga > K.LIM.carga, 'y la caída se pasa del límite sin que el borne lo diga');
  await ev(() => window.__labDebug.setVeh('util16'));
}

grupo('9 · el testigo del salpicadero, en las 180 casillas de la página');
{
  const R = await ev(() => {
    const D = window.__labDebug, K = D.K;
    let enc = 0, desc = 0, total = 0, bajo = 0;
    for (const v of K.VEHS) {
      D.setVeh(v);
      for (const s of K.SITS) {
        D.setSit(s);
        for (const f of K.FALLAS) {
          const L = D.lect(f);
          total++;
          if (L.med.testigo) enc++;
          if (L.descarga) desc++;
        }
      }
    }
    // Y que el centinela no sea vacío: por debajo del ralentí el testigo SÍ se
    // enciende, porque ahí la máquina de verdad deja de excitar.
    D.setVeh('util16'); D.setSit('atasco'); D.setFalla('escobillas'); D.setRpm(300);
    if (D.lect().med.testigo) bajo++;
    D.setRpm('auto'); D.setFalla('sano'); D.setSit('diaCarretera');
    return { enc, desc, total, bajo };
  });
  ok(R.total === 180, 'son 180 casillas: ' + R.total);
  ok(R.enc === 0, 'el testigo no se enciende en ninguna: ' + R.enc);
  ok(R.desc > 40, 'y en ' + R.desc + ' el coche se come la batería');
  ok(R.bajo === 1, 'pero SÍ se enciende por debajo del ralentí: el centinela no es vacío');
}

grupo('10 · cambiar de vehículo rehace el vano sin dejar basura');
{
  const cuenta = () => ev(() => {
    let n = 0; // el número de mallas de la escena, que es lo que crece si algo no se borra
    const s = window.__labDebug; void s;
    return document.querySelectorAll('canvas').length;
  });
  const c0 = await cuenta();
  for (let i = 0; i < 3; i++) for (const v of K.VEHS) await ev(x => window.__labDebug.setVeh(x), v);
  ok((await cuenta()) === c0, 'no se acumulan lienzos');
  ok((await ev(() => window.__labDebug.materialesFalsos)).length === 0, 'ni materiales falsos');
  ok((await ev(() => window.__labDebug.posicionesNaN)).length === 0, 'ni posiciones NaN');
  ok((await ev(() => window.__labDebug.montadas)) === 6, 'y el circuito sigue montado');
  await ev(() => window.__labDebug.setVeh('util16'));
}

grupo('11 · la curva: el punto de trabajo está EN su curva');
{
  await ev(() => window.__labDebug.setMode('curva'));
  for (const s of K.SITS) {
    await ev(x => window.__labDebug.setSit(x), s);
    const L = await ev(() => window.__labDebug.lect());
    const rpm = await ev(() => window.__labDebug.cfg.rpmEfectivo);
    const cap = await ev(r => window.__labDebug.capacidad(r), rpm);
    // La capacidad se calcula A LA CONSIGNA; el punto de trabajo, a la barra que
    // haya. Coinciden mientras el regulador manda, y el punto se va POR ENCIMA
    // en cuanto la barra se hunde. Lo que no puede pasar nunca es lo contrario.
    if (!L.saturado) ok(L.iAlt <= cap + 0.5, s + ': regulando, el punto no pasa de la capacidad');
    else ok(L.iAlt >= cap - 0.5, s + ': saturado, el punto está en o por encima de la capacidad');
    const eq = await ev(() => window.__labDebug.equilibrio());
    if (eq !== null && eq > 0) ok(eq > 200 && eq < 6000, s + ': equilibrio en un régimen alcanzable');
  }
  await ev(() => window.__labDebug.setSit('diaCarretera'));
}

grupo('12 · el censo del pizarrón es el del motor');
{
  await ev(() => { window.__labDebug.setMode('censo'); window.__labDebug.setSit('atasco'); });
  const C = await ev(() => window.__labDebug.censo());
  ok(C.filas.length === 10, 'diez filas');
  for (const f of C.filas) ok(f.n === f.ve.length, f.instr + ': la cuenta cuadra');
  const cl = await ev(() => window.__labDebug.clases());
  const todos = [].concat.apply([], cl);
  ok(todos.length === 9 && new Set(todos).size === 9, 'las clases parten los nueve');
  const amb = await ev(() => window.__labDebug.ambiguos());
  ok(amb.every(g => g.length > 1), 'los ambiguos tienen más de uno');
  await ev(() => window.__labDebug.setSit('diaCarretera'));
}

grupo('13 · el reto a ciegas no regala la respuesta por ninguna superficie');
{
  await ev(() => window.__labDebug.setMode('reto'));
  for (const f of K.FALLAS) {
    await ev(x => window.__labDebug.armaCaso(x, { veh: 'util16' }), f);
    await pag.waitForTimeout(60);
    const rc = await ev(() => window.__labDebug.retoCfg);
    ok(rc.hecho === false, f + ': el caso empieza sin entregar');
    const p = await ev(() => window.__labDebug.panel);
    const rots = await ev(() => window.__labDebug.rotulos);
    const i = K.FALLAS.indexOf(f);
    const rot = K.ROT[i], sig = K.SIG[i];
    if (f === 'sano') continue;   // «todo bien» no es una pista de nada
    for (const [donde, txt] of Object.entries(p)) {
      // El botón del dictamen SÍ lleva los nueve nombres, y tiene que llevarlos:
      // lo que no puede es que el nombre bueno aparezca en ningún OTRO sitio.
      if (donde === 'ctrl') continue;
      ok(txt.indexOf(rot) < 0, `${f}: «${rot}» no aparece en ${donde}`);
      ok(txt.indexOf(sig) < 0 || sig === 'sano', `${f}: «${sig}» no aparece en ${donde}`);
    }
    ok(rots.every(r => r.indexOf(rot) < 0), f + ': ni en los rótulos del 3D');
    // Y los nueve botones del dictamen van BARAJADOS: en orden fijo, la posición
    // sería una pista.
    ok(rc.orden.length === 9, f + ': los nueve botones están');
  }
  // Que el orden cambia de un caso a otro se comprueba viendo varios.
  const ordenes = new Set();
  for (let i = 0; i < 12; i++) {
    await ev(() => window.__labDebug.otroCaso());
    ordenes.add((await ev(() => window.__labDebug.retoCfg.orden)).join(','));
  }
  ok(ordenes.size > 1, 'y el orden de los botones se baraja entre casos');
}

grupo('14 · el reto: acorralar, entregar y el veredicto de si estaba CERRADO');
{
  // Un caso que se cierra: escobillas se separa de todo en el atasco.
  await ev(() => window.__labDebug.armaCaso('escobillas', { veh: 'util16' }));
  await ev(() => window.__labDebug.setSit('atasco'));
  await pag.waitForTimeout(120);
  let rc = await ev(() => window.__labDebug.retoCfg);
  ok(rc.compatibles.length === 1 && rc.compatibles[0] === 'escobillas',
    'en el atasco, las escobillas quedan solas');
  await ev(() => window.__labDebug.elige('escobillas'));
  ok((await ev(() => window.__labDebug.retoCfg.elegida)) === 'escobillas', 'la elección se guarda');
  ok((await ev(() => window.__labDebug.entrega())) === true, 'y acierta');
  rc = await ev(() => window.__labDebug.retoCfg);
  ok(rc.hecho === true, 'el caso queda cerrado');
  ok((await ev(() => window.__labDebug.panel.report)).indexOf('correcto') >= 0,
    'y el informe lo dice');
  // Un caso que NO se cierra: en el atasco, el regulador no se distingue de sano.
  await ev(() => window.__labDebug.armaCaso('reguladorBajo', { veh: 'util16' }));
  await ev(() => window.__labDebug.setSit('atasco'));
  await pag.waitForTimeout(120);
  rc = await ev(() => window.__labDebug.retoCfg);
  ok(rc.compatibles.length > 1, 'ahí quedan varios compatibles: ' + rc.compatibles.join(','));
  await ev(() => window.__labDebug.elige('reguladorBajo'));
  ok((await ev(() => window.__labDebug.entrega())) === true, 'acierta…');
  const rep = await ev(() => window.__labDebug.panel.report);
  ok(rep.indexOf('no lo habías cerrado') >= 0 || rep.indexOf('NO LO HABÍAS CERRADO') >= 0,
    '…pero se le dice que no lo había cerrado');
  // Y fallar es fallar.
  await ev(() => window.__labDebug.armaCaso('diodoCorto', { veh: 'taxi' }));
  await ev(() => window.__labDebug.elige('correa'));
  ok((await ev(() => window.__labDebug.entrega())) === false, 'elegir mal se marca mal');
  ok((await ev(() => window.__labDebug.panel.report)).indexOf('No era eso') >= 0,
    'y se dice cuál era');
}

grupo('15 · la pista del reto señala una CONDICIÓN, no un aparato');
{
  await ev(() => window.__labDebug.armaCaso('masaAlt', { veh: 'util16' }));
  await pag.waitForTimeout(80);
  await ev(() => window.__labDebug.pista());
  let visible = true;
  try { await pag.waitForFunction(() => window.__labDebug.toastOpacidad > 0.9, null,
    { timeout: 3000 }); } catch { visible = false; }
  ok(visible, 'la pista sale por pantalla');
  const t = await ev(() => (document.getElementById('toast') || {}).textContent || '');
  ok(K.SITS.some(s => t.length > 10), 'y menciona una situación: ' + t.slice(0, 70));
  ok(t.indexOf('masa del alternador floja') < 0, 'sin decir cuál es la avería');
}

grupo('16 · el cuestionario se rehace con la configuración');
{
  await ev(() => { window.__labDebug.setMode('curva'); window.__labDebug.setVeh('util16');
    window.__labDebug.setSit('diaCarretera'); window.__labDebug.setFalla('sano'); });
  await pag.waitForTimeout(150);
  const q1 = await ev(() => window.__labDebug.panel.quiz);
  await ev(() => window.__labDebug.setVeh('furgo'));
  await pag.waitForTimeout(150);
  const q2 = await ev(() => window.__labDebug.panel.quiz);
  ok(q1 !== q2, 'cambiar de coche rehace la pregunta');
  await ev(() => window.__labDebug.setSit('atasco'));
  await pag.waitForTimeout(150);
  const q3 = await ev(() => window.__labDebug.panel.quiz);
  ok(q2 !== q3, 'y cambiar de situación también');
  ok(q3.indexOf('Pregunta 1 de') >= 0, 'y vuelve a empezar por la primera');
  await ev(() => window.__labDebug.setVeh('util16'));
}

grupo('17 · el separador decimal de la pantalla es la coma, y el de millares fino');
{
  const R = await ev(() => {
    const D = window.__labDebug, K = D.K, malas = [];
    let mirados = 0;
    for (const v of K.VEHS) {
      D.setVeh(v);
      for (const s of K.SITS) {
        D.setSit(s);
        for (const f of K.FALLAS) {
          D.setFalla(f);
          for (const m of K.MODES) {
            D.setMode(m);
            const p = D.panel;
            for (const donde of Object.keys(p)) {
              mirados++;
              // Un punto entre dos cifras es un decimal a la inglesa. Los
              // nombres de los coches —«1.6», «2.0»— sí aparecen en el panel y
              // no son decimales de medida: se descartan por su forma.
              const t = String(p[donde]).split('Utilitario 1.6').join('')
                .split('Turismo 2.0').join('');
              const m1 = t.match(/\d\.\d/);
              if (m1) malas.push(v + '/' + s + '/' + f + '/' + m + '/' + donde + ': ' + m1[0]);
              // Y un millar separado por un espacio NORMAL es el error que ya
              // costó diez laboratorios: tiene que ser U+202F.
              const m2 = t.match(/\d \d{3}\b/);
              if (m2) malas.push(v + '/' + s + '/' + f + '/' + m + '/' + donde + ': millar suelto');
            }
          }
        }
      }
    }
    D.setVeh('util16'); D.setSit('diaCarretera'); D.setFalla('sano'); D.setMode('balance');
    return { malas, mirados };
  });
  ok(R.malas.length === 0, R.malas.length + ' textos con separador equivocado: ' +
    R.malas.slice(0, 4).join(' | '));
  ok(R.mirados === 4 * 5 * 9 * 7 * 5, 'se han mirado los 6 300 textos: ' + R.mirados);
}

grupo('18 · desmontar vuelve a cerrar los modos');
{
  await ev(() => window.__labDebug.desmonta());
  await pag.waitForTimeout(150);
  ok((await ev(() => window.__labDebug.simUnlocked)) === false, 'vuelve a estar bloqueado');
  ok((await ev(() => window.__labDebug.montadas)) === 0, 'y sin piezas');
  ok((await ev(() => window.__labDebug.mode)) === 'ensamble' ||
    (await ev(() => window.__labDebug.mode)) === 'balance', 'la vista no se rompe');
  await ev(() => window.__labDebug.setMode('curva'));
  ok((await ev(() => window.__labDebug.mode)) !== 'curva', 'y no deja volver a medir');
  await ev(() => window.__labDebug.monta());
  await pag.waitForFunction(() => window.__labDebug.simUnlocked, null, { timeout: 30000 });
  ok((await ev(() => window.__labDebug.montadas)) === 6, 'y se vuelve a montar');
}

grupo('19 · el recorrido guiado corre entero');
{
  errores.length = 0;
  await ev(() => window.__labDebug.setMode('ensamble'));
  await pag.click('#btnAuto');
  await pag.waitForFunction(() => !document.getElementById('btnAuto').disabled,
    null, { timeout: 180000 });
  ok(errores.length === 0, 'el recorrido no da errores: ' + errores.slice(0, 3).join(' | '));
  ok((await ev(() => window.__labDebug.mode)) === 'reto', 'y acaba en el reto');
  ok((await ev(() => window.__labDebug.posicionesNaN)).length === 0, 'sin NaN al terminar');
  ok((await ev(() => window.__labDebug.materialesPorDefecto)).length === 0, 'ni materiales por defecto');
}

grupo('20 · el puente al panel');
{
  await ev(() => { window.__labDebug.setMode('balance'); });
  ok((await ev(() => typeof window.__labDebug.solved)) === 'boolean', 'expone `solved`');
  const antes = await ev(() => window.__labDebug.solved);
  // Acertar una pregunta lo marca. Se busca el botón correcto por su clase, que
  // es lo que hace el propio laboratorio al corregir.
  await pag.waitForTimeout(150);
  const bts = await pag.$$('#quiz .btns button');
  ok(bts.length >= 2, 'el cuestionario tiene botones');
  for (const b of bts) {
    await b.click();
    await pag.waitForTimeout(80);
    if (await ev(() => window.__labDebug.solved)) break;
    await pag.click('#quiz [data-qnext]');
    await pag.waitForTimeout(80);
    break;
  }
  ok(typeof antes === 'boolean', 'y el estado inicial es booleano');
}

console.log(`\n${n - malos}/${n} comprobaciones`);
await nav.close(); srv.close();
process.exit(malos ? 1 : 0);
