/**
 * CAPA 1 · d6-14 · el motor sellado, sin navegador.
 *
 * Recorta del `.body.js` el bloque que va de «§1 · AIRE HÚMEDO» hasta la
 * cabecera de la interfaz, lo evalúa con `new Function()` y comprueba lo que
 * este laboratorio AFIRMA. No es una prueba de que el código corra: es una
 * prueba de que la física y la aritmética que enseña se sostienen.
 *
 *   node scripts/auditoria/.c1_124.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const SRC = join(RAIZ, 'scripts/lab-src/dinamometro-par-potencia-correccion.body.js');
const src = readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const marca = src.indexOf('//  §1 · AIRE');
const i0 = src.lastIndexOf('// ===', marca);
const i1 = src.indexOf('// ============================================================ T1 ');
if (marca < 0 || i1 < 0) { console.log('‼️  no encuentro los límites del motor sellado'); process.exit(1); }

const EXPORTA = ['R_SECO','R_VAPOR','presionISA','pSat','presionSeca','densidadAire',
  'LIM_NORMA','ETA_MEC_NORMA','BRUTA_EXTRA','NORMAS','NORMA_KEYS','fMotorDiesel',
  'cfDieselISO','cfModelo85','parFriccion','parIndicadoRef','razonCarga','parNeto',
  'cfVerdadero','BANCOS','BANCO_KEYS','R_RODILLO','J_RODILLO','inerciaConocida',
  'inerciaConocidaEnCiguenal','parArrastre','parPerdidas','deslizamiento','calentamiento',
  'fraccionRobada','aceleracionMotor','ARQ','ARQ_KEYS','FALLAS','FALLA_KEYS','averia',
  'PERDIDAS','PERD_KEYS','ESCENARIOS','ESC_KEYS','condiciones','estacionDice','evalua',
  'curva','censo','desaceleracion'];
const M = new Function(`
  "use strict";
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  ${src.slice(i0, i1)}
  return { ${EXPORTA.join(', ')} };
`)();

let n = 0, malos = 0;
const ok = (c, q) => { n++; if (!c) { malos++; console.log('  ‼️  ' + q); } };
const cerca = (a, b, tol, q) => ok(Math.abs(a - b) <= tol, `${q}: ${a} vs ${b} ±${tol}`);
const grupo = t => console.log('\n' + t);
/** La configuración por defecto: rodillos de inercia, la marcha típica del
 *  coche, desaceleración libre, SAE J1349, primera pasada, nivel del mar. */
const P = (e, o) => Object.assign({ banco:'inercia', norma:'j1349', perdidas:'coastdown',
  marcha:e.marchaTipica, pasada:1, alt:0, TC:25, hr:0.40, falla:'sano' }, o || {});
const EV = (e, o) => M.evalua(e, Object.assign(P(e, o), { rpm: (o && o.rpm) || e.rpmPar }));
const PICO = (e, o) => { const C = M.curva(e, P(e, o));
  return M.evalua(e, Object.assign(P(e, o), { rpm: C.corrMax.rpm })); };
const NA = M.ARQ.na16, TB = M.ARQ.turbo14, TD = M.ARQ.tdi20, V8 = M.ARQ.v8na;

grupo('1 · el aire húmedo');
cerca(M.presionISA(0), 101325, 1, 'presión a 0 m');
cerca(M.presionISA(2240) / 1000, 77.15, 0.5, 'presión a 2 240 m (kPa)');
cerca(M.presionISA(2660) / 1000, 73.19, 0.5, 'presión a 2 660 m (kPa)');
ok(M.presionISA(3500) < M.presionISA(2240), 'la presión baja con la altura');
// Magnus: a 0 °C el vapor satura a 6,11 hPa; a 100 °C, a 1 013 hPa.
cerca(M.pSat(0) / 100, 6.11, 0.05, 'presión de saturación a 0 °C (hPa)');
cerca(M.pSat(20) / 100, 23.4, 0.4, 'presión de saturación a 20 °C (hPa)');
cerca(M.pSat(100) / 100, 1013, 12, 'presión de saturación a 100 °C (hPa)');
ok(M.pSat(40) > M.pSat(25) && M.pSat(25) > M.pSat(5), 'la saturación crece con la temperatura');
// La presión seca es la total MENOS el vapor, y el vapor pesa de verdad: en un
// día caluroso y húmedo al nivel del mar se lleva casi 60 hPa.
cerca((101325 - M.presionSeca(101325, 40, 0.80)) / 100, 59.1, 1.5,
  'el vapor a 40 °C y 80 % (hPa)');
ok(M.presionSeca(101325, 25, 0.40) < 101325, 'la presión seca es menor que la total');
cerca(M.presionSeca(101325, 25, 0), 101325, 1, 'sin humedad, seca = total');
// El aire húmedo pesa MENOS que el seco: el vapor tiene 18 g/mol y el aire 29.
ok(M.densidadAire(101325, 25, 0.80) < M.densidadAire(101325, 25, 0),
  'el aire húmedo pesa menos que el seco');
cerca(M.densidadAire(101325, 15, 0), 1.225, 0.003, 'densidad ISA al nivel del mar');
ok(M.densidadAire(73190, 25, 0.4) < M.densidadAire(101325, 25, 0.4),
  'en altura el aire pesa menos');

grupo('2 · las cinco normas');
ok(M.NORMA_KEYS.length === 5, `${M.NORMA_KEYS.length} normas`);
ok(M.LIM_NORMA[0] === 0.93 && M.LIM_NORMA[1] === 1.07, 'el intervalo es 0,93–1,07');
for (const k of M.NORMA_KEYS) {
  const N = M.NORMAS[k];
  ok(typeof N.cf === 'function', `${k}: tiene fórmula`);
  ok(N.rot.length > 4 && N.nota.length > 40, `${k}: se explica`);
  // En SUS PROPIAS condiciones de referencia el factor tiene que valer 1: si no,
  // la norma se contradice a sí misma.
  if (N.pRef !== null) cerca(N.cf(N.pRef, N.TRef), 1, 1e-9, `${k}: cf = 1 en su referencia`);
  // Menos presión pide más corrección; más temperatura, también. La observada
  // no corrige nada, así que no tiene monotonía que comprobar.
  if (k !== 'observada') {
    ok(N.cf(80000, 298.15) > N.cf(101325, 298.15), `${k}: menos presión, más factor`);
    ok(N.cf(99000, 313.15) > N.cf(99000, 283.15), `${k}: más calor, más factor`);
  }
}
ok(M.NORMAS.observada.cf(1, 1) === 1, 'la observada no corrige nada');
ok(M.NORMAS.j607.bruta === true, 'la J607 es potencia bruta');
ok(M.NORMAS.j1349.acota && M.NORMAS.iso1585.acota, 'las dos modernas acotan');
ok(!M.NORMAS.din70020.acota, 'la DIN no publica intervalo');
cerca(M.BRUTA_EXTRA, 0.12, 1e-9, 'el sobrecoste declarado de la bruta');
// La DIN referencia aire MÁS FRÍO y MÁS DENSO que las modernas, así que su
// número de referencia sale más alto para el mismo motor.
{
  const pd = M.presionSeca(101325, 25, 0.40), T = 298.15;
  ok(M.NORMAS.din70020.cf(pd, T) > M.NORMAS.j1349.cf(pd, T),
    'la DIN corrige más que la J1349 en el mismo aire');
}

grupo('3 · la SAE J1349 ES la tangente del modelo del 85 %');
cerca(M.ETA_MEC_NORMA, 0.85, 1e-9, 'la hipótesis de rendimiento mecánico');
cerca(M.cfModelo85(1), 1, 1e-12, 'la curva pasa por (1, 1)');
// La derivada de 0,85·D/(1 − 0,15·D) en D = 1 vale 0,85/0,7225 = 1,17647…, que
// redondeado es el 1,18 de la norma. Ésa es la única razón de que 1,18 y −0,18
// no sean números arbitrarios.
{
  const h = 1e-6, der = (M.cfModelo85(1 + h) - M.cfModelo85(1 - h)) / (2 * h);
  cerca(der, 1.176, 0.002, 'la pendiente de la curva en D = 1');
  cerca(Math.round(der * 100) / 100, 1.18, 1e-9, 'redondeada, es el 1,18 de la norma');
}
// Dentro del intervalo la recta y la curva no se separan ni medio por ciento.
for (const D of [0.93, 0.97, 1.00, 1.03, 1.07]) {
  const recta = 1.18 * D - 0.18;
  ok(Math.abs(recta / M.cfModelo85(D) - 1) < 0.005,
    `dentro del intervalo (D=${D}) la recta y la curva coinciden`);
}
// Fuera, se separan, y esa separación crece.
{
  const e137 = Math.abs((1.18 * 1.37 - 0.18) / M.cfModelo85(1.37) - 1);
  const e150 = Math.abs((1.18 * 1.50 - 0.18) / M.cfModelo85(1.50) - 1);
  ok(e137 > 0.01, `a D = 1,37 la recta ya se separa el ${(e137 * 100).toFixed(2)} %`);
  ok(e150 > e137, 'y la separación crece con D');
}
ok(M.cfModelo85(1.37) > 1.18 * 1.37 - 0.18, 'la recta se queda CORTA fuera del intervalo');

grupo('4 · el factor para diésel de la ISO 1585');
ok(M.fMotorDiesel(30) === 0.3, 'poco cargado: f_m = 0,3');
ok(M.fMotorDiesel(80) === 1.2, 'muy cargado: f_m = 1,2 (el tope de la tabla)');
cerca(M.fMotorDiesel(50), 0.036 * 50 - 1.14, 1e-12, 'en la banda, la recta de la tabla');
ok(M.fMotorDiesel(45) < M.fMotorDiesel(60), 'f_m crece con el combustible por ciclo');
ok(M.ARQ.tdi20.qc > 65, 'un diésel moderno va por ENCIMA de la banda de la tabla');
{
  const pd = M.presionSeca(73190, 18, 0.40), T = 291.15;
  const dies = M.cfDieselISO(pd, T, 87), gas = M.NORMAS.iso1585.cf(pd, T);
  ok(dies > 1.30 && dies < 1.55, `el factor diésel en Toluca vale ${dies.toFixed(3)}`);
  ok(Math.abs(dies / gas - 1) < 0.05, 'y se parece mucho al de gasolina: tampoco salva al turbo');
  cerca(M.cfDieselISO(99000, 298.15, 87), 1, 1e-9, 'vale 1 en la referencia');
}

grupo('5 · los cuatro vehículos, al cigüeñal y en referencia');
const ESPERA = {
  na16:   { par:[145, 175], pot:[80, 95],   pme:[10.5, 13.0], rpmPar:[3500, 4500] },
  turbo14:{ par:[240, 285], pot:[95, 120],  pme:[20, 26],     rpmPar:[2000, 3000] },
  tdi20:  { par:[300, 350], pot:[90, 115],  pme:[18, 23],     rpmPar:[1600, 2400] },
  v8na:   { par:[480, 560], pot:[280, 330], pme:[11, 14],     rpmPar:[3700, 4700] },
};
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k], lim = ESPERA[k];
  let parMax = { v: 0 }, potMax = { v: 0 };
  for (let rpm = e.rpmRal; rpm <= e.rpmMax; rpm += 25) {
    const par = M.parNeto(e, rpm, 99000, 298.15), pot = par * rpm * Math.PI / 30;
    if (par > parMax.v) parMax = { v: par, rpm };
    if (pot > potMax.v) potMax = { v: pot, rpm };
  }
  const pme = parMax.v * 4 * Math.PI / (e.cilindrada * 1e-3) / 1e5;
  ok(parMax.v >= lim.par[0] && parMax.v <= lim.par[1],
    `${e.corto}: par máximo ${parMax.v.toFixed(1)} N·m en [${lim.par}]`);
  ok(potMax.v / 1000 >= lim.pot[0] && potMax.v / 1000 <= lim.pot[1],
    `${e.corto}: potencia máxima ${(potMax.v / 1000).toFixed(1)} kW en [${lim.pot}]`);
  ok(pme >= lim.pme[0] && pme <= lim.pme[1],
    `${e.corto}: pme ${pme.toFixed(1)} bar en [${lim.pme}]`);
  ok(parMax.rpm >= lim.rpmPar[0] && parMax.rpm <= lim.rpmPar[1],
    `${e.corto}: el par pico cae en ${parMax.rpm} rpm`);
  ok(parMax.rpm < potMax.rpm, `${e.corto}: el par pico llega antes que la potencia pico`);
  ok(e.nota.length > 60, `${e.corto}: se explica para qué está en el laboratorio`);
  ok(e.relaciones.length >= 5, `${e.corto}: tiene caja de al menos cinco marchas`);
  ok(e.marchaTipica < e.relaciones.length, `${e.corto}: la marcha típica existe`);
}
ok(M.ARQ.v8na.masa > 1600 && M.ARQ.na16.masa < 1600,
  'el V8 es de tracción trasera y el 1.6 delantera');

grupo('6 · la fricción NO escala con la densidad, y ahí está todo');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  ok(M.parFriccion(e, e.rpmMax) > M.parFriccion(e, e.rpmRal),
    `${e.corto}: la fricción crece con las vueltas`);
  // El par indicado en referencia es su máximo justo en rpmPar.
  cerca(M.parIndicadoRef(e, e.rpmPar), e.parIndMax, 1e-9, `${e.corto}: indicado máximo en rpmPar`);
  ok(M.parIndicadoRef(e, e.rpmMax) < e.parIndMax, `${e.corto}: el indicado cae arriba`);
  // La hipótesis de la norma: la fricción vale en torno al 15 % del indicado.
  const f = M.parFriccion(e, e.rpmPar) / M.parIndicadoRef(e, e.rpmPar);
  ok(f > 0.08 && f < 0.20, `${e.corto}: la fricción es el ${(f * 100).toFixed(1)} % del indicado`);
}

grupo('7 · un atmosférico obedece a la densidad y un turbo se defiende');
{
  const pdT = M.presionSeca(M.presionISA(2660), 18, 0.40), TT = 291.15;
  const bruta = (pdT / TT) / (99000 / 298.15);
  for (const k of ['na16', 'v8na']) {
    const e = M.ARQ[k];
    cerca(M.razonCarga(e, pdT, TT, 99000, 298.15), bruta, 1e-9,
      `${e.corto}: la carga es EXACTAMENTE el cociente de densidades secas`);
  }
  for (const k of ['turbo14', 'tdi20']) {
    const e = M.ARQ[k];
    const r = M.razonCarga(e, pdT, TT, 99000, 298.15);
    ok(r > bruta + 0.15, `${e.corto}: en Toluca conserva ${(r * 100).toFixed(1)} % contra ${(bruta * 100).toFixed(1)} %`);
    ok(r < 1, `${e.corto}: y aun así pierde algo — el aire sale más caliente`);
  }
  // En la referencia, la carga vale 1 para todos: si no, el motor no da su
  // propio par de catálogo en sus propias condiciones.
  for (const k of M.ARQ_KEYS)
    cerca(M.razonCarga(M.ARQ[k], 99000, 298.15, 99000, 298.15), 1, 1e-9,
      `${M.ARQ[k].corto}: carga = 1 en referencia`);
}

grupo('8 · el factor VERDADERO, y dónde la norma acierta y dónde no');
{
  const casos = [[0, 25, 0.40], [0, 40, 0.80], [0, 5, 0.20], [2240, 22, 0.45], [2660, 18, 0.40]];
  for (const [alt, TC, hr] of casos) {
    const pd = M.presionSeca(M.presionISA(alt), TC, hr), T = TC + 273.15;
    const cfN = M.NORMAS.j1349.cf(pd, T);
    for (const k of M.ARQ_KEYS) {
      const e = M.ARQ[k];
      const v = M.cfVerdadero(e, e.rpmPar, pd, T, 99000, 298.15);
      ok(v !== null && isFinite(v) && v > 0.5 && v < 2.5,
        `${e.corto} @${alt} m: el factor verdadero (${v && v.toFixed(3)}) es un número sensato`);
      const err = cfN / v - 1;
      if (!e.sobrealimentado) {
        // Para un atmosférico la fórmula acierta INCLUSO muy fuera de su
        // intervalo. El intervalo no está ahí porque la fórmula se rompa.
        //
        // El residuo de hasta un 4 % no es ruido: la densidad va con 1/T y la
        // norma va con 1/√T. Ese exponente es un AJUSTE sobre ensayos, no una
        // deducción, y se le nota en los días muy calurosos y muy fríos.
        ok(Math.abs(err) < 0.05,
          `${e.corto} @${alt} m: la J1349 acierta al ${(err * 100).toFixed(1)} %`);
      } else if (alt > 1500) {
        // Para un turbo, en altura, se inventa una tercera parte de la potencia.
        ok(err > 0.20,
          `${e.corto} @${alt} m: la J1349 se pasa un ${(err * 100).toFixed(1)} %`);
      }
    }
  }
  // Y en la referencia el factor verdadero vale 1 para todos.
  for (const k of M.ARQ_KEYS)
    cerca(M.cfVerdadero(M.ARQ[k], M.ARQ[k].rpmPar, 99000, 298.15, 99000, 298.15), 1, 1e-9,
      `${M.ARQ[k].corto}: el factor verdadero vale 1 en la referencia`);
}

grupo('9 · los tres bancos');
ok(M.BANCO_KEYS.length === 3, `${M.BANCO_KEYS.length} bancos`);
ok(M.BANCOS.motor.rueda === false, 'el banco de motor no pasa por la rueda');
ok(M.BANCOS.inercia.inercia === true && M.BANCOS.freno.inercia === false,
  'sólo el de inercia mide una derivada');
ok(M.BANCOS.freno.sostiene && M.BANCOS.motor.sostiene && !M.BANCOS.inercia.sostiene,
  'los que miden con célula sostienen el régimen');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  const mo = PICO(e, { banco: 'motor' }).potCorr;
  const fr = PICO(e, { banco: 'freno' }).potCorr;
  const ie = PICO(e, { banco: 'inercia' }).potCorr;
  ok(mo > fr && fr > ie, `${e.corto}: motor > freno > inercia (${(mo/1000).toFixed(1)} / ${(fr/1000).toFixed(1)} / ${(ie/1000).toFixed(1)} kW)`);
  ok(mo / ie - 1 < 0.14, `${e.corto}: y la diferencia es del ${((mo/ie-1)*100).toFixed(1)} %, no un abismo`);
}

grupo('10 · la inercia del propio motor, y por qué la marcha cambia el número');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  ok(M.fraccionRobada(e, 0, 'freno') === 0, `${e.corto}: un banco que sostiene no roba nada`);
  ok(M.fraccionRobada(e, 0, 'motor') === 0, `${e.corto}: un banco de motor tampoco`);
  let ant = Infinity;
  for (let m = 0; m < e.relaciones.length; m++) {
    const f = M.fraccionRobada(e, m, 'inercia');
    ok(f > 0 && f < 0.45, `${e.corto} ${m + 1}ª: roba ${(f * 100).toFixed(1)} %`);
    ok(f < ant, `${e.corto}: la marcha ${m + 1}ª roba menos que la anterior`);
    ant = f;
  }
  const f0 = M.fraccionRobada(e, 0, 'inercia');
  const fn = M.fraccionRobada(e, e.relaciones.length - 1, 'inercia');
  ok(f0 / fn > 8, `${e.corto}: de primera a última hay un factor ${(f0 / fn).toFixed(1)}`);
  // Y la fracción NO depende del par: sale sólo de las dos inercias.
  const jc = M.inerciaConocidaEnCiguenal(e, 2);
  cerca(M.fraccionRobada(e, 2, 'inercia'), e.jMotor / (e.jMotor + jc), 1e-12,
    `${e.corto}: la fracción es J_motor/(J_motor+J_conocida) y nada más`);
  // La inercia conocida está referida al rodillo y NO lleva la masa del coche:
  // el coche está amarrado y no acelera.
  ok(M.inerciaConocida(e) > M.J_RODILLO && M.inerciaConocida(e) < M.J_RODILLO + 8,
    `${e.corto}: la inercia conocida es el rodillo más las ruedas, sin la masa del coche`);
}
// Y el número publicado sube con la marcha, que es el resultado que nadie cree.
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  let ant = -Infinity;
  for (let m = 0; m < e.relaciones.length; m++) {
    const p = M.curva(e, P(e, { marcha: m })).corrMax.potCorr;
    ok(p > ant, `${e.corto}: en ${m + 1}ª publica más que en la anterior`);
    ant = p;
  }
}

grupo('11 · las pérdidas, y lo que NINGÚN método devuelve');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  const F = M.averia('sano');
  ok(e.etaTrans > 0.90 && e.etaTrans < 0.98, `${e.corto}: rendimiento de transmisión razonable`);
  ok(M.parArrastre(e, 100, F) > M.parArrastre(e, 20, F), `${e.corto}: el arrastre crece con la velocidad`);
  // La parte proporcional NO la ve una desaceleración con el gas cortado.
  ok(M.parPerdidas(e, 100, 1000, F) > M.parArrastre(e, 100, F),
    `${e.corto}: la pérdida total es mayor que el arrastre`);
  cerca(M.parPerdidas(e, 100, 0, F), M.parArrastre(e, 100, F), 1e-12,
    `${e.corto}: con par cero, total = arrastre (eso es una desaceleración libre)`);
  const D = M.desaceleracion(e, P(e));
  ok(D !== null, `${e.corto}: hay desaceleración en rodillos`);
  const pico = D.pts.reduce((a, b) => b.potRueda > a.potRueda ? b : a, D.pts[0]);
  ok(pico.frac > 0.11 && pico.frac < 0.22,
    `${e.corto}: la pérdida en el pico es ${(pico.frac * 100).toFixed(1)} %`);
  ok(D.fracMax / D.fracMin > 1.35,
    `${e.corto}: la pérdida NO es constante: va de ${(D.fracMin*100).toFixed(1)} % a ${(D.fracMax*100).toFixed(1)} %`);
  ok(pico.fracArr < pico.frac, `${e.corto}: la desaceleración mide menos que la pérdida real`);
  ok(pico.frac - pico.fracArr > 0.02,
    `${e.corto}: y lo que nadie devuelve son ${((pico.frac - pico.fracArr) * 100).toFixed(1)} puntos`);
  ok(M.desaceleracion(e, P(e, { banco: 'motor' })) === null,
    `${e.corto}: un banco de motor no tiene transmisión que medir`);
}

grupo('12 · el calor que se acumula');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  const sano = M.averia('sano'), sinV = M.averia('sinVentilador');
  ok(M.calentamiento(e, 1, sano, 'inercia') === 0, `${e.corto}: la primera pasada bien montada no calienta`);
  ok(M.calentamiento(e, 3, sinV, 'inercia') > M.calentamiento(e, 1, sinV, 'inercia'),
    `${e.corto}: sin ventilador, cada pasada calienta más`);
  ok(M.calentamiento(e, 3, sinV, 'inercia') > M.calentamiento(e, 3, sano, 'inercia'),
    `${e.corto}: sin ventilador se calienta más que con él`);
  ok(M.calentamiento(e, 3, sinV, 'freno') > M.calentamiento(e, 3, sinV, 'inercia'),
    `${e.corto}: un banco que sostiene la carga calienta más`);
  // La serie converge: el cuarto también evacúa.
  const d9 = M.calentamiento(e, 9, sinV, 'inercia'), d5 = M.calentamiento(e, 5, sinV, 'inercia');
  ok(d9 - d5 < (M.calentamiento(e, 2, sinV, 'inercia') - M.calentamiento(e, 1, sinV, 'inercia')),
    `${e.corto}: el calentamiento converge, no crece sin fin`);
  ok(d9 < 40, `${e.corto}: y el techo es ${d9.toFixed(1)} K, no un disparate`);
  // Y se nota en el número publicado.
  const p1 = PICO(e, { falla: 'sinVentilador', pasada: 1 }).potCorr;
  const p5 = PICO(e, { falla: 'sinVentilador', pasada: 5 }).potCorr;
  ok(p5 < p1, `${e.corto}: sin ventilador, la quinta pasada publica menos que la primera`);
  ok(p1 / p5 - 1 < 0.10, `${e.corto}: y la caída es del ${((p1/p5-1)*100).toFixed(1)} %, no un desplome`);
}

grupo('13 · el deslizamiento, y por qué el banco lo cambia todo');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  const sano = M.averia('sano');
  ok(M.deslizamiento(e, 0, sano, 'inercia') === 0, `${e.corto}: sin par no hay patinaje`);
  ok(M.deslizamiento(e, e.parRuedaRef, sano, 'inercia') > 0, `${e.corto}: con par sí`);
  ok(M.deslizamiento(e, e.parRuedaRef * 2, sano, 'inercia') >
     M.deslizamiento(e, e.parRuedaRef, sano, 'inercia'), `${e.corto}: crece con el par`);
  for (const f of ['neumaticoFlojo', 'rodilloSucio', 'amarreFlojo']) {
    ok(M.deslizamiento(e, e.parRuedaRef, M.averia(f), 'inercia') >
       M.deslizamiento(e, e.parRuedaRef, sano, 'inercia'),
      `${e.corto}: "${f}" patina más que un montaje sano`);
  }
  // ÉSTA es la que separa dos averías que si no serían la misma: un freno que
  // sostiene la carga le da al coche tiempo de caminarse sobre unos amarres
  // flojos, y un barrido de inercia de ocho segundos no.
  const aI = M.deslizamiento(e, e.parRuedaRef, M.averia('amarreFlojo'), 'inercia');
  const aF = M.deslizamiento(e, e.parRuedaRef, M.averia('amarreFlojo'), 'freno');
  ok(aF > aI * 1.8, `${e.corto}: los amarres flojos patinan mucho más en el banco de freno`);
  const rI = M.deslizamiento(e, e.parRuedaRef, M.averia('rodilloSucio'), 'inercia');
  const rF = M.deslizamiento(e, e.parRuedaRef, M.averia('rodilloSucio'), 'freno');
  cerca(rI, rF, 1e-12, `${e.corto}: el rodillo sucio patina igual en los dos bancos`);
}

grupo('14 · la estación dice lo que dice, no lo que hay');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  for (const sitio of M.ESCENARIOS) {
    const o = { alt: sitio.alt, TC: sitio.TC, hr: sitio.hr };
    const sano = EV(e, Object.assign({}, o, { falla: 'sano' }));
    ok(sano.est.veraz, `${e.corto} @${sitio.k}: con estación, dice la verdad`);
    cerca(sano.est.p, sano.pAmb, 1, `${e.corto} @${sitio.k}: y mide la presión que hay`);
    const sin = EV(e, Object.assign({}, o, { falla: 'sinEstacion' }));
    ok(!sin.est.veraz, `${e.corto} @${sitio.k}: sin estación, avisa de que no`);
    cerca(sin.est.p, 101325, 1, `${e.corto} @${sitio.k}: y suelta los valores guardados`);
    ok(sin.avisos.some(a => /estaci\u00f3n/i.test(a)),
      `${e.corto} @${sitio.k}: y lo dice en pantalla`);
  }
  // El ventilador averiado calienta la admisión; el que recircula, además,
  // engaña al termómetro, que es una avería distinta con el mismo síntoma.
  const sv = EV(e, { falla: 'sinVentilador', pasada: 3 });
  const ar = EV(e, { falla: 'aireRecirculado', pasada: 3 });
  ok(sv.dTsoak > 0 && ar.dTsoak > 0, `${e.corto}: los dos calientan la admisión`);
  ok(ar.est.TC > sv.est.TC,
    `${e.corto}: con aire recirculado la estación lee el aire caliente y sin ventilador no`);
  ok(sv.est.TC < sv.TAdmC, `${e.corto}: sin ventilador, la estación se queda corta`);
}

grupo('15 · el captador y la célula: dos averías que no tocan la potencia');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  const sano = EV(e), cap = EV(e, { falla: 'captadorDoble' });
  cerca(cap.potCorr, sano.potCorr, 1e-9, `${e.corto}: el captador doble NO cambia la potencia`);
  cerca(cap.rpmHoja, sano.rpmHoja * 2, 1e-9, `${e.corto}: pero dobla el eje de vueltas`);
  cerca(cap.parHoja, sano.parHoja / 2, 1e-6, `${e.corto}: y parte el par de la hoja por la mitad`);
  // El eje doblado se sale de la escala en el pico de POTENCIA, que es de donde
  // sale la cifra que se publica; en el de par todavía cabe, y por eso una hoja
  // con el captador mal puesto puede parecer normal si sólo se mira abajo.
  const capP = PICO(e, { falla: 'captadorDoble' });
  ok(capP.rpmImposible, `${e.corto}: en el pico de potencia la hoja se sale del corte`);
  ok(!PICO(e).rpmImposible, `${e.corto}: la hoja sana no`);
  ok(!cap.rpmImposible || e.rpmPar * 2 > e.rpmMax * 1.08,
    `${e.corto}: y abajo, en el pico de par, todavía puede pasar desapercibida`);
  // La célula de carga no existe en un banco de inercia.
  const cI = EV(e, { falla: 'celulaDescalibrada', banco: 'inercia' });
  cerca(cI.potCorr, EV(e, { banco: 'inercia' }).potCorr, 1e-9,
    `${e.corto}: la célula descalibrada es INVISIBLE en un banco de inercia`);
  for (const b of ['freno', 'motor']) {
    const cB = EV(e, { falla: 'celulaDescalibrada', banco: b });
    ok(cB.potCorr > EV(e, { banco: b }).potCorr,
      `${e.corto}: y sí se ve en el banco "${b}"`);
  }
}

grupo('16 · los tres métodos de pérdidas');
ok(M.PERD_KEYS.length === 3, `${M.PERD_KEYS.length} métodos`);
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  const nin = PICO(e, { perdidas: 'ninguna' });
  const coa = PICO(e, { perdidas: 'coastdown' });
  const r15 = PICO(e, { perdidas: 'regla15' });
  ok(nin.potCorr < coa.potCorr && nin.potCorr < r15.potCorr,
    `${e.corto}: publicar la de rueda es lo más bajo`);
  cerca(nin.devuelto, 0, 1e-12, `${e.corto}: y no devuelve nada`);
  cerca(r15.potPub, r15.potLeida / 0.85, 1e-9, `${e.corto}: la regla del 15 % es dividir por 0,85`);
  ok(coa.devuelto > 0, `${e.corto}: la desaceleración devuelve algo`);
  // Ninguno de los tres acierta, y el que más se acerca depende del coche: por
  // eso la regla del 15 % sigue viva.
  ok(nin.error < -0.10, `${e.corto}: en rueda se queda muy corto (${(nin.error*100).toFixed(1)} %)`);
  ok(Math.abs(coa.error) < 0.12, `${e.corto}: la desaceleración se acerca (${(coa.error*100).toFixed(1)} %)`);
  // En un banco de motor no hay nada que devolver, decida lo que decida.
  for (const p of M.PERD_KEYS)
    cerca(M.evalua(e, Object.assign(P(e, { banco: 'motor', perdidas: p }), { rpm: e.rpmPar })).potPub,
      M.evalua(e, Object.assign(P(e, { banco: 'motor', perdidas: 'ninguna' }), { rpm: e.rpmPar })).potPub,
      1e-9, `${e.corto}: en banco de motor el método "${p}" da igual`);
}

grupo('17 · la descomposición del error');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  for (const sitio of ['mar25', 'toluca']) {
    const S = M.ESCENARIOS.find(x => x.k === sitio);
    for (const f of M.FALLA_KEYS) {
      const V = PICO(e, { falla: f, alt: S.alt, TC: S.TC, hr: S.hr });
      ok(V.error !== null && isFinite(V.error), `${e.corto}/${f}@${sitio}: hay error total`);
      ok(V.pisoBanco !== null && isFinite(V.pisoBanco), `${e.corto}/${f}@${sitio}: hay suelo de banco`);
      ok(V.errMedida !== null && isFinite(V.errMedida), `${e.corto}/${f}@${sitio}: hay error de montaje`);
      ok(V.errCuenta !== null && isFinite(V.errCuenta), `${e.corto}/${f}@${sitio}: hay error de cuenta`);
      // El total tiene que ser EXACTAMENTE la composición de los tres. Si no lo
      // fuera, la vista del censo estaría contando un cuento.
      const compuesto = (1 + V.pisoBanco) * (1 + V.errMedida) * (1 + V.errCuenta) - 1;
      ok(Math.abs(compuesto - V.error) < 1e-9,
        `${e.corto}/${f}@${sitio}: suelo × montaje × cuenta = total`);
      ok(['ninguna', 'medida', 'cuenta', 'ambas'].includes(V.culpa),
        `${e.corto}/${f}@${sitio}: la culpa está clasificada`);
    }
    // Un montaje sano no tiene culpa de montaje: es la definición.
    cerca(PICO(e, { falla: 'sano', alt: S.alt, TC: S.TC, hr: S.hr }).errMedida, 0, 1e-12,
      `${e.corto}@${sitio}: el montaje sano no cuesta nada por encima del suelo`);
  }
}
// Y el suelo del banco NO depende del montaje: es la máquina. Se compara EN EL
// MISMO RÉGIMEN, porque el suelo sí depende del punto de funcionamiento —el
// arrastre crece con la velocidad— y cada avería mueve el pico de la curva.
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  for (const rpm of [Math.round(e.rpmPar * 0.7), e.rpmPar, Math.round(e.rpmMax * 0.9)]) {
    const base = EV(e, { falla: 'sano', rpm: rpm }).pisoBanco;
    for (const f of M.FALLA_KEYS)
      cerca(EV(e, { falla: f, rpm: rpm }).pisoBanco, base, 1e-9,
        `${e.corto} @${rpm}: el suelo del banco es el mismo con "${f}"`);
  }
}

grupo('18 · el censo');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  const C = M.censo(e, P(e));
  ok(C.total === 45, `${e.corto}: ${C.total} casillas`);
  ok(C.filas.length === 9, `${e.corto}: nueve montajes`);
  ok(C.filas[0].celdas.length === 5, `${e.corto}: cinco sitios`);
  ok(C.piso.length === 5, `${e.corto}: el suelo del banco, sitio a sitio`);
  ok(C.peligro === 5, `${e.corto}: los amarres flojos son peligro en los cinco sitios`);
  // A partir de cierta altitud, TODAS las casillas se salen del intervalo de la
  // norma, y ésa es la lección de la vista.
  for (const f of C.filas) {
    const n2 = f.celdas.filter(c => (c.sitio === 'cdmx' || c.sitio === 'toluca') && c.fuera).length;
    if (f.falla === 'sinEstacion')
      // La estación averiada corrige con los valores guardados del nivel del mar,
      // así que el factor sale cerca de 1 y NO salta el aviso de fuera de norma.
      // La avería apaga la única señal que avisaba de que el número no vale.
      ok(n2 === 0, `${e.corto}: con la estación rota el aviso de fuera de norma NO salta`);
    else
      ok(n2 === 2, `${e.corto}/${f.falla}: en altura el factor se sale de la norma`);
  }
  ok(C.porCuenta > C.porMedida,
    `${e.corto}: manda la cuenta (${C.porCuenta}) sobre el montaje (${C.porMedida})`);
  ok(C.porMedida >= 5, `${e.corto}: y el montaje también cuesta en ${C.porMedida} casillas`);
  for (const f of C.filas) for (const c of f.celdas) {
    ok(isFinite(c.error) && Math.abs(c.error) < 1.2, `${e.corto}/${f.falla}/${c.sitio}: error acotado`);
    ok(c.pot > 0 && c.ref > 0, `${e.corto}/${f.falla}/${c.sitio}: potencias positivas`);
  }
}
// La estación averiada en altura publica un número MUY distinto del bien
// montado, y para un turbo lo publica MEJOR: no corregir se parece más a la
// verdad que corregir con la fórmula de un atmosférico.
{
  const o = { alt: 2660, TC: 18, hr: 0.40 };
  for (const k of ['turbo14', 'tdi20']) {
    const e = M.ARQ[k];
    const bien = PICO(e, Object.assign({ falla: 'sano' }, o));
    const rota = PICO(e, Object.assign({ falla: 'sinEstacion' }, o));
    ok(bien.error > 0.15, `${e.corto}: bien montado en Toluca se pasa un ${(bien.error*100).toFixed(1)} %`);
    ok(Math.abs(rota.error) < Math.abs(bien.error),
      `${e.corto}: y con la estación ROTA el número se acerca más a la verdad`);
  }
  for (const k of ['na16', 'v8na']) {
    const e = M.ARQ[k];
    const bien = PICO(e, Object.assign({ falla: 'sano' }, o));
    const rota = PICO(e, Object.assign({ falla: 'sinEstacion' }, o));
    ok(Math.abs(rota.error) > Math.abs(bien.error),
      `${e.corto}: en un atmosférico, en cambio, la estación rota EMPEORA el número`);
  }
}

grupo('19 · el mismo coche, el mismo día, cinco números');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  for (const sitio of ['mar25', 'toluca']) {
    const S = M.ESCENARIOS.find(x => x.k === sitio);
    const vals = M.NORMA_KEYS.map(nk =>
      PICO(e, { norma: nk, alt: S.alt, TC: S.TC, hr: S.hr }).potCorr);
    const min = Math.min(...vals), max = Math.max(...vals);
    ok(max > min, `${e.corto}@${sitio}: las cinco normas NO dan lo mismo`);
    if (sitio === 'toluca')
      ok(max / min > 1.30,
        `${e.corto}@Toluca: del más bajo al más alto hay un ${((max/min-1)*100).toFixed(0)} %`);
    else
      ok(max / min < 1.25, `${e.corto}@mar: al nivel del mar la diferencia es pequeña`);
    // La bruta siempre publica más que la neta con el mismo factor.
    const j607 = PICO(e, { norma: 'j607', alt: S.alt, TC: S.TC, hr: S.hr });
    const din = PICO(e, { norma: 'din70020', alt: S.alt, TC: S.TC, hr: S.hr });
    ok(j607.potCorr > din.potCorr,
      `${e.corto}@${sitio}: la bruta de la J607 publica más que la neta de la DIN`);
  }
}

grupo('20 · lo que ninguna cifra puede ser');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  for (const b of M.BANCO_KEYS) for (const f of M.FALLA_KEYS) for (const nk of M.NORMA_KEYS) {
    const V = EV(e, { banco: b, falla: f, norma: nk });
    for (const [campo, v] of Object.entries(V)) {
      if (v === null || typeof v !== 'number') continue;
      ok(isFinite(v), `${e.corto}/${b}/${f}/${nk}: ${campo} es finito`);
    }
    ok(V.parCig >= 0, `${e.corto}/${b}/${f}/${nk}: el par al cigüeñal no es negativo`);
    ok(V.potCorr > 0, `${e.corto}/${b}/${f}/${nk}: la potencia publicada es positiva`);
    ok(V.cf > 0.5 && V.cf < 2.2, `${e.corto}/${b}/${f}/${nk}: el factor es un factor`);
    ok(V.slip >= 0 && V.slip <= 0.20, `${e.corto}/${b}/${f}/${nk}: el patinaje está acotado`);
    ok(V.robada >= 0 && V.robada < 0.45, `${e.corto}/${b}/${f}/${nk}: lo robado está acotado`);
    ok(V.pd > 0 && V.pd <= V.pAmb, `${e.corto}/${b}/${f}/${nk}: la presión seca es parte de la total`);
    ok(V.TAdmC >= -30 && V.TAdmC < 120, `${e.corto}/${b}/${f}/${nk}: la admisión es aire, no plasma`);
    ok(Array.isArray(V.avisos), `${e.corto}/${b}/${f}/${nk}: los avisos son una lista`);
  }
  // Las curvas no tienen agujeros.
  const C = M.curva(e, P(e));
  ok(C.pts.length === 28, `${e.corto}: la curva tiene 28 puntos`);
  for (const p of C.pts) {
    ok(isFinite(p.potCorr) && p.potCorr >= 0, `${e.corto}: la curva no tiene agujeros`);
    ok(p.rpm >= e.rpmRal * 0.5 && p.rpm <= e.rpmMax, `${e.corto}: la curva vive dentro del régimen`);
  }
}
// Todas las averías se explican, y todos los rótulos son distintos.
ok(M.FALLA_KEYS.length === 9, `${M.FALLA_KEYS.length} montajes`);
{
  const cortos = new Set(), largos = new Set();
  for (const k of M.FALLA_KEYS) {
    const F = M.FALLAS[k];
    ok(F.rot.length > 8 && F.corto.length > 3 && F.pista.length > 12, `${k}: se explica`);
    cortos.add(F.corto); largos.add(F.rot);
  }
  ok(cortos.size === 9 && largos.size === 9, 'los nueve rótulos son distintos');
}
ok(M.ESC_KEYS.length === 5, `${M.ESC_KEYS.length} sitios`);
{
  const dentro = M.ESCENARIOS.filter(S => {
    const pd = M.presionSeca(M.presionISA(S.alt), S.TC, S.hr), cf = M.NORMAS.j1349.cf(pd, S.TC + 273.15);
    return cf >= 0.93 && cf <= 1.07;
  }).length;
  // Y son DOS, no tres: un día caluroso y húmedo AL NIVEL DEL MAR ya saca a la
  // SAE J1349 de su propio intervalo, porque el vapor de agua se lleva sesenta
  // hectopascales de presión seca. No hace falta subir a ninguna montaña.
  ok(dentro === 2, `de los cinco sitios, ${dentro} caen dentro del intervalo de la norma`);
  {
    const S = M.ESCENARIOS.find(x => x.k === 'mar40h');
    const pd = M.presionSeca(M.presionISA(S.alt), S.TC, S.hr);
    const cf = M.NORMAS.j1349.cf(pd, S.TC + 273.15);
    ok(cf > M.LIM_NORMA[1] && cf < 1.10,
      `un día de 40 °C y 80 % al nivel del mar ya pide ${cf.toFixed(3)}: fuera del intervalo`);
    const seco = M.NORMAS.j1349.cf(M.presionSeca(M.presionISA(0), S.TC, 0), S.TC + 273.15);
    ok(seco < M.LIM_NORMA[1],
      `y el mismo día SIN humedad se queda dentro (${seco.toFixed(3)}): la culpa es del vapor`);
  }
}

console.log(`\n${n - malos}/${n} comprobaciones`);
process.exit(malos ? 1 : 0);
