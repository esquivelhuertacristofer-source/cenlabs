/**
 * CAPA 2 · d6-14 · el laboratorio dentro de un navegador de verdad.
 *
 * Lo que la Capa 1 no puede ver: que la página arranque, que el mode-lock
 * funcione —los modos cerrados hasta que las seis piezas estén puestas—, que
 * las siete vistas pinten sin reventar, que TODA malla de la célula lleve un
 * material de verdad, que el pizarrón se LEA, y que el reto a ciegas no regale
 * la respuesta por ninguna superficie: ni el panel, ni la telemetría, ni el
 * informe, ni las preguntas, ni los rótulos del 3D.
 *
 *   node scripts/auditoria/.c2_124.mjs
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

await pag.goto(`${BASE}/labs/dinamometro-par-potencia-correccion.html`, { waitUntil: 'load', timeout: 90000 });
await pag.waitForFunction(() => window.__labDebug && window.__labDebug.frames > 3, null, { timeout: 90000 });

// --------------------------------------------------------------- utilidades
const D = (f, ...a) => pag.evaluate(([s, args]) =>
  // eslint-disable-next-line no-new-func
  new Function('L', 'a', `return (${s})(L, ...a)`)(window.__labDebug, args),
  [f.toString(), a]);
const cfg = o => pag.evaluate(x => window.__labDebug.setCfg(x), o);
const modo = m => pag.evaluate(x => window.__labDebug.setMode(x), m);
const maq = k => pag.evaluate(x => window.__labDebug.setMaq(x), k);
const falla = f => pag.evaluate(x => window.__labDebug.setFalla(x), f);
const lect = (f, rpm) => pag.evaluate(([a, b]) => window.__labDebug.lect(a, b), [f || null, rpm === undefined ? null : rpm]);
const cur = f => pag.evaluate(x => window.__labDebug.curva(x), f || null);
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
ok(K.ARQ.length === 4, `${K.ARQ.length} vehículos`);
ok(K.INSTR.length === 6, `${K.INSTR.length} instrumentos`);
ok(K.NORMAS.length === 5, `${K.NORMAS.length} normas`);
ok(K.BANCOS.length === 3, `${K.BANCOS.length} bancos`);
ok(K.PERDIDAS.length === 3, `${K.PERDIDAS.length} métodos de pérdidas`);
ok(K.SITIOS.length === 5, `${K.SITIOS.length} emplazamientos`);
cerca(K.LIM[0], 0.93, 1e-9, 'el intervalo empieza en 0,93');
cerca(K.LIM[1], 1.07, 1e-9, 'y acaba en 1,07');
{
  const buf = await pag.screenshot({ clip: { x: 300, y: 120, width: 900, height: 640 } });
  ok(buf.length > 20000, 'la escena 3D pinta algo (peso del PNG: ' + buf.length + ')');
}

grupo('2 · toda malla de la célula lleva un material de VERDAD');
// `brushedMetal()` devuelve texturas, no un material. Pasárselo a un Mesh no da
// error: three comprueba `material.visible===true`, encuentra undefined y se
// salta la pieza en silencio. Ya costó dos labs publicados con piezas invisibles.
{
  const mal = await pag.evaluate(() => window.__labDebug.materialesFalsos);
  ok(mal.length === 0, `${mal.length} mallas con material falso: ${mal.slice(0, 4).join(', ')}`);
}

grupo('3 · el mode-lock: sin la célula montada no se mide nada');
{
  await pag.evaluate(() => window.__labDebug.desmonta());
  ok(await pag.evaluate(() => window.__labDebug.simUnlocked) === false,
    'recién desmontada, la simulación está cerrada');
  ok(await pag.evaluate(() => window.__labDebug.montadas) === 0, 'y no hay ninguna pieza puesta');
  for (const m of K.MODES.filter(x => x !== 'ensamble')) {
    await modo(m);
    ok(await pag.evaluate(() => window.__labDebug.mode) === 'ensamble',
      `"${m}" no se abre con la célula sin montar`);
  }
  // Y el cuestionario tampoco puede seguir mostrando las preguntas del ensayo
  // que acaba de desaparecer: el banco de preguntas está en caché.
  const q = await pag.evaluate(() => (document.getElementById('quiz') || {}).textContent || '');
  ok(!/kW|N·m|factor/.test(q), 'sin célula montada el cuestionario no pregunta por cifras: ' + q.slice(0, 70));

  await pag.evaluate(() => window.__labDebug.monta());
  await pag.waitForFunction(() => window.__labDebug.simUnlocked === true, null, { timeout: 60000 });
  ok(await pag.evaluate(() => window.__labDebug.montadas) === K.PIEZAS.length,
    'montada, están las seis piezas');
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

grupo('5 · el aire húmedo, en la página de verdad');
{
  // A 40 °C y 80 % de humedad AL NIVEL DEL MAR el vapor se lleva 59 hPa y el
  // factor de la J1349 ya se sale de su propio intervalo. Sin humedad, no.
  const F = await pag.evaluate(() => window.__labDebug.factores(0, 40, 0.80));
  const S = await pag.evaluate(() => window.__labDebug.factores(0, 40, 0));
  cerca(F.p / 100, 1013.25, 0.1, 'al nivel del mar el barómetro marca 1 013 hPa');
  cerca(F.pd / 100, 954.3, 0.2, 'y la presión SECA se queda en 954 hPa');
  cerca((S.pd - F.pd) / 100, 59.0, 0.2, 'el vapor se lleva 59 hPa');
  ok(F.j1349 > K.LIM[1], `el factor pide ${F.j1349.toFixed(4)}: fuera del intervalo sin salir del mar`);
  ok(S.j1349 < K.LIM[1], `y el mismo día sin humedad se queda dentro (${S.j1349.toFixed(4)})`);
  ok(S.j1349 < 1.01, 'de hecho casi no corrige: la humedad sola explica toda la excursión');
  // Y contra la intuición, el aire húmedo pesa MENOS.
  const A = await pag.evaluate(() => [
    window.__labDebug.factores(0, 25, 0).pd, window.__labDebug.factores(0, 25, 1).pd]);
  ok(A[1] < A[0], 'más humedad, menos presión seca');
}

grupo('6 · la recta de la norma es la TANGENTE del modelo exacto');
{
  // La separación entre la recta 1,18·D − 0,18 y la curva 0,85·D/(1 − 0,15·D) es
  // CONTINUA: justo al otro lado del límite todavía es ínfima, así que exigir un
  // salto en el borde sería inventarse un escalón que no existe. Lo que sí se
  // puede exigir es lo que de verdad pasa: dentro del intervalo la recta sirve,
  // y la separación CRECE sin parar según D se aleja de 1.
  const casos = [];
  for (const [alt, TC, hr] of [[0, 25, 0.4], [0, 15, 0.3], [0, 5, 0.2], [1000, 20, 0.5],
                               [2240, 22, 0.45], [2660, 18, 0.4], [3500, 12, 0.3], [4500, 8, 0.25]]) {
    const F = await pag.evaluate(([a1, b1, c1]) => window.__labDebug.factores(a1, b1, c1), [alt, TC, hr]);
    casos.push({ alt, D: F.D, sep: Math.abs(F.j1349 / F.modelo85 - 1),
      dentro: F.D >= K.LIM[0] && F.D <= K.LIM[1] });
  }
  for (const c of casos.filter(x => x.dentro))
    ok(c.sep < 0.0015, `D=${c.D.toFixed(3)} (dentro): se separan ${(c.sep * 100).toFixed(3)} %`);
  ok(casos.some(c => c.dentro), 'hay casos dentro del intervalo');
  // Monotonía por encima de 1: cuanto más alto, más se separan.
  const arriba = casos.filter(c => c.D > 1).sort((x, y) => x.D - y.D);
  for (let i = 1; i < arriba.length; i++)
    ok(arriba[i].sep > arriba[i - 1].sep,
      `D=${arriba[i].D.toFixed(3)} se separa más que D=${arriba[i - 1].D.toFixed(3)}`);
  const lejos = arriba[arriba.length - 1];
  ok(lejos.D > 1.45, `a ${lejos.alt} m el factor pediría D=${lejos.D.toFixed(3)}`);
  ok(lejos.sep > 0.02, `y allí la recta ya se ha ido un ${(lejos.sep * 100).toFixed(2)} % de la curva`);
  // El borde del intervalo es el último sitio donde la recta todavía sirve.
  const borde = casos.filter(c => c.dentro).sort((x, y) => y.sep - x.sep)[0];
  ok(Math.min(Math.abs(borde.D - K.LIM[0]), Math.abs(borde.D - K.LIM[1])) < 0.06,
    `y el peor caso de dentro (D=${borde.D.toFixed(3)}) está pegado a un borde`);
}

grupo('7 · el mismo coche, el mismo día, cinco números');
{
  await maq('turbo14');
  await cfg({ banco: 'motor', perdidas: 'ninguna', sitio: 'toluca', falla: 'sano', rpm: null });
  const cvs = {};
  for (const nk of K.NORMAS) {
    await cfg({ norma: nk });
    const C = await cur();
    await cfg({ rpm: C.corrMax.rpm });
    const V = await lect();
    cvs[nk] = V.potCorr / 735.5;
    await cfg({ rpm: null });
  }
  const vals = Object.values(cvs);
  const disp = Math.max(...vals) - Math.min(...vals);
  ok(disp > 70, `en Toluca las cinco normas se separan ${disp.toFixed(0)} CV sobre la misma pasada`);
  ok(cvs.observada === Math.min(...vals), 'la medida sin corregir es la más baja');
  ok(cvs.j607 === Math.max(...vals), 'y la J607 «bruta» la más alta: no lleva ni auxiliares ni escape');
  ok(cvs.j607 / cvs.j1349 > 1.08, 'la bruta añade más del 8 % sobre la neta del mismo día');
}

grupo('8 · el intervalo no protege de lo que de verdad rompe la corrección');
{
  // Para un ATMOSFÉRICO la fórmula acierta incluso muy fuera de su intervalo.
  // Lo que la rompe es un motor que se DEFIENDE de las condiciones.
  const err = {};
  for (const k of ['na16', 'turbo14']) {
    await maq(k);
    await cfg({ banco: 'motor', perdidas: 'ninguna', norma: 'j1349', sitio: 'toluca', falla: 'sano', rpm: null });
    const C = await cur();
    await cfg({ rpm: C.corrMax.rpm });
    const V = await lect();
    err[k] = V.error;
    ok(V.fuera === true, `${k}: a 2 660 m el factor se sale del intervalo`);
    await cfg({ rpm: null });
  }
  ok(Math.abs(err.na16) < 0.05, `el atmosférico sigue acertando al ${(err.na16 * 100).toFixed(1)} % fuera del intervalo`);
  ok(err.turbo14 > 0.30, `y al turbo se le regala un ${(err.turbo14 * 100).toFixed(1)} % inventado`);
  ok(err.turbo14 > Math.abs(err.na16) * 5, 'la altura no rompe la fórmula: la rompe el turbo');
}

grupo('9 · los tres bancos miden cosas distintas, y lo enseñan');
{
  await maq('v8na');
  const pub = {};
  for (const b of K.BANCOS) {
    await cfg({ banco: b, norma: 'j1349', sitio: 'mar25', falla: 'sano',
      perdidas: b === 'motor' ? 'ninguna' : 'coastdown', rpm: null });
    const C = await cur();
    await cfg({ rpm: C.corrMax.rpm });
    pub[b] = (await lect()).potCorr;
    await cfg({ rpm: null });
  }
  ok(pub.motor > pub.freno && pub.freno > pub.inercia,
    `el banco de motor publica más que el de freno y éste más que el de inercia: ${
      Object.entries(pub).map(([k, v]) => k + ' ' + (v / 1000).toFixed(1)).join(' · ')}`);
  // La célula descalibrada MIENTE en los bancos que tienen célula, y en el de
  // inercia es literalmente muda: ahí no hay célula que descalibrar.
  for (const b of K.BANCOS) {
    await cfg({ banco: b, perdidas: b === 'motor' ? 'ninguna' : 'coastdown', rpm: null });
    const C = await cur(); await cfg({ rpm: C.corrMax.rpm });
    const sano = (await lect('sano')).potCorr;
    const mala = (await lect('celulaDescalibrada')).potCorr;
    if (b === 'inercia') cerca(mala, sano, 1e-6, 'en el banco de inercia la célula descalibrada no cambia NADA');
    else ok(mala / sano - 1 > 0.04, `en el banco "${b}" la célula descalibrada cuesta un ${((mala / sano - 1) * 100).toFixed(1)} %`);
    await cfg({ rpm: null });
  }
  // Y el captador de vueltas al doble no cambia ni un vatio: la potencia sale de
  // la energía, no de las vueltas. Lo único que delata es la hoja impresa.
  await cfg({ banco: 'inercia', perdidas: 'coastdown', rpm: null });
  const C2 = await cur(); await cfg({ rpm: C2.corrMax.rpm });
  const s2 = await lect('sano'), d2 = await lect('captadorDoble');
  cerca(d2.potCorr, s2.potCorr, 1e-6, 'el captador doble no cambia la potencia');
  cerca(d2.rpmHoja, s2.rpmHoja * 2, 1, 'pero la hoja sale con el doble de vueltas');
  ok(d2.rpmImposible && !s2.rpmImposible, 'y por eso el eje de la hoja se sale del corte del motor');
  await cfg({ rpm: null });
}

grupo('10 · la marcha cambia la cifra, y la culpa es de la inercia del motor');
{
  await maq('v8na');
  await cfg({ banco: 'inercia', norma: 'j1349', sitio: 'mar25', falla: 'sano', perdidas: 'coastdown', rpm: null });
  const pot = [];
  for (let m = 1; m <= 5; m++) {
    await cfg({ marcha: m });
    const C = await cur(); await cfg({ rpm: C.corrMax.rpm });
    pot.push((await lect()).potCorr);
    await cfg({ rpm: null });
  }
  for (let i = 1; i < pot.length; i++)
    ok(pot[i] > pot[i - 1], `la ${i + 1}.ª publica más que la ${i}.ª (${(pot[i] / 1000).toFixed(1)} kW)`);
  ok(pot[0] / pot[4] - 1 < -0.10, `entre 1.ª y 5.ª hay un ${((1 - pot[0] / pot[4]) * 100).toFixed(1)} % de diferencia`);
  await cfg({ marcha: null });
}

grupo('11 · las pérdidas, y lo que la desaceleración NO puede ver');
{
  for (const k of K.ARQ) {
    await maq(k);
    await cfg({ banco: 'inercia', norma: 'j1349', sitio: 'mar25', falla: 'sano', perdidas: 'coastdown', rpm: null });
    const Dz = await pag.evaluate(() => window.__labDebug.decel());
    ok(Dz && Dz.n > 8, `${k}: la costera tiene ${Dz ? Dz.n : 0} puntos`);
    ok(Dz.fracMin > 0.08 && Dz.fracMax < 0.26,
      `${k}: las pérdidas van del ${(Dz.fracMin * 100).toFixed(1)} % al ${(Dz.fracMax * 100).toFixed(1)} %`);
    // Y restar la costera deja SIEMPRE una cifra corta: el rendimiento de
    // engrane sólo se manifiesta cuando pasa par, y con el gas cortado no pasa.
    const C = await cur(); await cfg({ rpm: C.corrMax.rpm });
    const V = await lect();
    ok(V.error < -0.03 && V.error > -0.15,
      `${k}: con la costera restada todavía falta un ${(V.error * 100).toFixed(1)} %`);
    await cfg({ rpm: null });
  }
  // Y en el banco de inercia NUNCA se publica de más por este camino.
  ok(true, '(las tres comprobaciones anteriores por motor)');
}

grupo('12 · el calentamiento: la quinta pasada da menos que la primera');
{
  await maq('turbo14');
  await cfg({ banco: 'inercia', norma: 'j1349', sitio: 'mar25', falla: 'sano', perdidas: 'coastdown', rpm: null });
  const p = [];
  for (const k of [1, 2, 3, 4, 5]) {
    await cfg({ pasada: k });
    const C = await cur(); await cfg({ rpm: C.corrMax.rpm });
    p.push((await lect()).potCorr); await cfg({ rpm: null });
  }
  for (let i = 1; i < p.length; i++)
    ok(p[i] <= p[i - 1] + 1, `la pasada ${i + 1} no da más que la ${i}`);
  ok(p[0] - p[4] > 500, `entre la primera y la quinta se pierden ${((p[0] - p[4]) / 1000).toFixed(2)} kW sin tocar nada`);
  // Y sin ventilador el efecto es mayor, porque la admisión sube más.
  const sinV = await lect('sinVentilador');
  const sano = await lect('sano');
  ok(sinV.TAdmC > sano.TAdmC + 5, `sin ventilador la admisión sube ${(sinV.TAdmC - sano.TAdmC).toFixed(1)} K`);
  await cfg({ pasada: 1 });
}

grupo('13 · la avería más peligrosa es la que MEJORA el número');
{
  await maq('turbo14');
  await cfg({ banco: 'inercia', norma: 'j1349', sitio: 'toluca', perdidas: 'coastdown', rpm: null });
  const C = await cur('sano'); await cfg({ rpm: C.corrMax.rpm });
  const sano = await lect('sano'), rota = await lect('sinEstacion');
  ok(sano.error > 0.15, `bien montado, en Toluca el turbo publica un ${(sano.error * 100).toFixed(1)} % de más`);
  ok(Math.abs(rota.error) < Math.abs(sano.error),
    `con la estación rota el error BAJA a ${(rota.error * 100).toFixed(1)} %`);
  ok(rota.potCorr < sano.potCorr, 'y el número publicado se acerca al verdadero');
  // Y de propina apaga la única alarma que había.
  ok(sano.fuera === true, 'bien montado salta el aviso de «fuera de norma»');
  ok(rota.fuera === false, 'y con la estación rota NO salta: la avería apaga su propia alarma');
  ok(rota.avisos.some(a => /estaci/i.test(a)), 'aunque sí avisa de que la estación no responde');
  ok(rota.est.veraz === false, 'y la estación se declara no veraz');
  await cfg({ rpm: null });
}

grupo('14 · la descomposición del error, en la página');
{
  // (1 + suelo) · (1 + montaje) · (1 + cuenta) = 1 + total, en los cinco sitios
  // y en los nueve montajes, sobre el banco donde el suelo es mayor.
  await maq('turbo14');
  await cfg({ banco: 'inercia', norma: 'j1349', perdidas: 'coastdown', rpm: null });
  for (const s of K.SITIOS) {
    await cfg({ sitio: s, rpm: null });
    const C = await cur('sano'); await cfg({ rpm: C.corrMax.rpm });
    const base = (await lect('sano')).pisoBanco;
    for (const f of K.FALLAS) {
      const V = await lect(f);
      cerca((1 + V.pisoBanco) * (1 + V.errMedida) * (1 + V.errCuenta) - 1, V.error, 1e-9,
        `${s}/${f}: la descomposición cierra`);
      cerca(V.pisoBanco, base, 1e-9, `${s}/${f}: el suelo es el mismo, es la máquina`);
    }
    await cfg({ rpm: null });
  }
}

grupo('15 · el censo de 45 casillas dice cosas distintas por columna');
{
  await modo('censo');
  await pag.waitForTimeout(200);
  const C = await pag.evaluate(() => window.__labDebug.censo());
  ok(C.total === 45, `${C.total} casillas: nueve montajes por cinco emplazamientos`);
  ok(C.filas.length === 9, `${C.filas.length} filas`);
  ok(C.piso.length === 5, `y un suelo de banco por columna`);
  ok(C.piso.every(v => v < -0.03 && v > -0.15), 'el suelo del banco de inercia está entre el 3 y el 15 %');
  ok(C.fuera > 0 && C.fuera < C.total, `${C.fuera} casillas con el factor fuera de norma`);
  ok(C.porMedida > 0, `${C.porMedida} con culpa del montaje`);
  ok(C.porCuenta > 0, `${C.porCuenta} con culpa de la cuenta`);
  // En altura el factor se sale SIEMPRE... salvo con la estación rota, que es lo
  // que la hace peligrosa: la avería apaga el aviso.
  for (const f of C.filas) {
    const alt = f.celdas.filter(c => (c.sitio === 'cdmx' || c.sitio === 'toluca') && c.fuera).length;
    if (f.falla === 'sinEstacion') ok(alt === 0, 'con la estación rota el aviso de fuera de norma NO salta en altura');
    else ok(alt === 2, `${f.falla}: en altura el factor se sale de la norma`);
  }
  const peligro = C.filas.find(f => f.falla === 'amarreFlojo');
  ok(peligro.celdas.every(c => c.peligro), 'los amarres flojos son PELIGRO en las cinco columnas');
  ok(C.filas.filter(f => f.falla !== 'amarreFlojo').every(f => f.celdas.every(c => !c.peligro)),
    'y ninguna otra avería lo es');
  const w = await pag.evaluate(() => window.__labDebug.anchoTableroPx);
  ok(w >= 480, `el censo cabe en el pizarrón (${Math.round(w)} px)`);
}

grupo('16 · el cuestionario se rebaraja y no filtra la respuesta');
{
  // El cuestionario se rebaraja en cada refresco. Comparar `textContent` no
  // sirve: el navegador pega el último botón de opción con el de «Siguiente
  // pregunta» sin separador. Se lee la ESTRUCTURA.
  const quizCont = () => pag.evaluate(() => {
    const q = document.getElementById('quiz');
    const enun = (q.querySelector('.console') || {}).textContent || '';
    const ops = [...q.querySelectorAll('.btns button')].map(x => x.textContent);
    return { enun: enun, ops: ops, clave: enun + ' | ' + ops.slice().sort().join(' | ') };
  });
  await modo('barrido');
  await maq('turbo14');
  // Las preguntas salen del ENSAYO, no de la vista: cambian cuando cambia la
  // configuración, que es lo único de lo que pueden depender.
  const vistas = new Set();
  for (const c of [{ norma: 'j1349', sitio: 'mar25', banco: 'motor', perdidas: 'ninguna' },
                   { norma: 'j607', sitio: 'toluca', banco: 'inercia', perdidas: 'coastdown' },
                   { norma: 'din70020', sitio: 'cdmx', banco: 'freno', perdidas: 'regla15' },
                   { norma: 'observada', sitio: 'mar5s', banco: 'inercia', perdidas: 'ninguna' }]) {
    await cfg(Object.assign({ falla: 'sano', rpm: null }, c));
    await pag.waitForTimeout(120);
    vistas.add((await quizCont()).clave);
  }
  ok(vistas.size >= 3, `el cuestionario se rehace con el ensayo (${vistas.size} versiones distintas de 4)`);
  const uno = [...vistas][0];
  ok(uno.includes('|'), 'y cada pregunta trae sus opciones');
  ok(!/correcta|respuesta es|✔/i.test(uno), 'sin marcar cuál es la buena');
  // Y el barajado existe de verdad: con la MISMA configuración, el orden de las
  // opciones cambia entre refrescos aunque el conjunto sea el mismo.
  {
    await cfg({ norma: 'j1349', sitio: 'mar25', banco: 'inercia', perdidas: 'coastdown', falla: 'sano', rpm: null });
    const claves = new Set(), ordenes = new Set();
    for (let i = 0; i < 14; i++) {
      await pag.evaluate(() => window.__labDebug.setFalla('sano'));
      const q = await quizCont();
      claves.add(q.clave); ordenes.add(q.ops.join('·'));
    }
    ok(claves.size === 1, `la pregunta es la misma (${claves.size} conjunto de opciones)`);
    ok(ordenes.size > 1, `y el orden de las opciones se baraja (${ordenes.size} órdenes en 14 refrescos)`);
  }
  // El botón de «siguiente» recorre el banco entero y vuelve al principio.
  {
    const n0 = await pag.evaluate(() => (document.querySelector('#quiz .lt') || {}).textContent || '');
    const total = Number((n0.match(/de (\d+)/) || [])[1] || 0);
    ok(total >= 5, `el banco tiene ${total} preguntas`);
    const enun = new Set();
    for (let i = 0; i < total; i++) {
      enun.add((await quizCont()).enun);
      await pag.evaluate(() => document.querySelector('[data-qnext]').click());
      await pag.waitForTimeout(60);
    }
    ok(enun.size === total, `y las ${total} son distintas entre sí (${enun.size})`);
  }
}

grupo('17 · el reto a ciegas no regala la respuesta por NINGUNA superficie');
{
  await modo('reto');
  await pag.waitForTimeout(250);
  const R0 = await pag.evaluate(() => window.__labDebug.retoCfg);
  ok(R0.vivas.length >= 2, `el reto deja ${R0.vivas.length} sospechosos en pie`);
  ok(R0.elegido === null && R0.veredicto === null, 'y empieza sin elegir y sin veredicto');
  // El caso se arma a mano para poder probar TODAS las averías, no sólo la que
  // el azar haya sacado.
  for (const f of K.FALLAS) {
    await pag.evaluate(x => window.__labDebug.armaCaso(x, { maq: 'turbo14', sitio: 'toluca', banco: 'inercia' }), f);
    await pag.waitForTimeout(90);
    const rot = K.ROT[K.FALLAS.indexOf(f)], rotL = K.ROT_LARGO[K.FALLAS.indexOf(f)];
    const sup = await superficies();
    // Los rótulos de las averías están en los BOTONES de elección, así que lo que
    // no puede aparecer es el rótulo LARGO, que es el que describe la avería.
    ok(!sup.includes(rotL), `"${f}": el rótulo largo no se filtra ("${rotL}")`);
    ok(rot.length > 0, `"${f}": tiene rótulo corto`);
  }
  // Y midiendo instrumentos se llega al veredicto correcto.
  await pag.evaluate(() => window.__labDebug.armaCaso('rodilloSucio', { maq: 'v8na', sitio: 'mar25', banco: 'inercia' }));
  for (const i of K.INSTR) await pag.evaluate(x => window.__labDebug.mide(x), i);
  await pag.evaluate(() => window.__labDebug.elige('rodilloSucio'));
  const bien = await pag.evaluate(() => window.__labDebug.entrega());
  ok(bien === true, 'con la respuesta correcta el reto se da por bueno');
  ok(await pag.evaluate(() => window.__labDebug.solved) === true, 'y el lab queda resuelto');
  const w = await pag.evaluate(() => window.__labDebug.anchoTableroPx);
  ok(w >= 480, `el reto cabe en el pizarrón (${Math.round(w)} px)`);
  ok(errores.length === 0, 'y el reto entero sin errores: ' + errores.slice(0, 2).join(' | '));
}

grupo('18 · el recorrido guiado, entero');
{
  await pag.evaluate(() => document.getElementById('btnAuto').click());
  await pag.waitForTimeout(1200);
  ok(await pag.evaluate(() => document.getElementById('btnAuto').disabled) === true,
    'el recorrido arranca y bloquea su propio botón');
  await pag.waitForFunction(() => !document.getElementById('btnAuto').disabled,
    null, { timeout: 240000 });
  ok(errores.length === 0, 'el recorrido entero sin errores: ' + errores.slice(0, 3).join(' | '));
  const mal = await pag.evaluate(() => window.__labDebug.materialesFalsos);
  ok(mal.length === 0, `y sin materiales falsos al final (${mal.length})`);
}

grupo('19 · el puente al panel del profesor');
{
  const hay = await pag.evaluate(() => typeof window.__labReporta === 'function'
    || !!document.querySelector('script[src="_puente.js"]'));
  ok(hay, 'el lab lleva el puente inyectado');
}

console.log(`\n${n - malos}/${n} comprobaciones`);
await nav.close(); srv.close();
process.exit(malos ? 1 : 0);
