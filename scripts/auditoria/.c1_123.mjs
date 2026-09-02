/**
 * CAPA 1 · d6-13 · el motor sellado, sin navegador.
 *
 * Recorta del `.body.js` publicado el bloque que va de «1 · EL AIRE» hasta la
 * cabecera de la interfaz, lo evalúa con `new Function()` y comprueba lo que
 * este laboratorio AFIRMA. No es una prueba de que el código corra: es una
 * prueba de que la física que enseña se sostiene.
 *
 *   node scripts/auditoria/.c1_123.mjs
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const SRC = join(RAIZ, 'scripts/lab-src/sobrealimentacion-turbo-intercooler.body.js');
const src = readFileSync(SRC, 'utf8');
const i0 = src.indexOf('// 1 · EL AIRE');
const i1 = src.indexOf('// ============================================================ T1 ');
if (i0 < 0 || i1 < 0) { console.log('‼️  no encuentro los límites del motor sellado'); process.exit(1); }

const EXPORTA = ['densidad','presionAmbiente','correGasto','correVel','piMax','mChoke',
  'mBombeo','piDe','uPara','etaComp','T2de','potenciaComp','epsilonIC','dpIC','dpFiltro',
  'etaVol','gastoAire','fiTobera','presionDelante','potenciaTurbina','equilibraEje','T3de',
  'Tcompresion','Tdetona','piMaxDetona','caminoAire','resuelve','paresDe','transitorio',
  'averia','regimenes','evalua','dtcDe','curva','censo','ARQ','ARQ_KEYS','FALLAS',
  'FALLA_KEYS','DTC_ROT','R_AIRE','CP_AIRE','K_AIRE','CP_ESC','K_ESC','P_REF','T_REF',
  'N_POLI','T_TRANS','DT_TRANS'];
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
const A = (m, o) => M.evalua(m, Object.assign({ rpm: m.rpmPar, carga: 1 }, o || {}));
const E = M.ARQ.gas14t, D = M.ARQ.die20t, DEP = M.ARQ.gas20bi, V8 = M.ARQ.die66t;

grupo('1 · el aire y la atmósfera');
cerca(M.K_AIRE, 0.2857, 0.0002, 'γ−1/γ del aire');
cerca(M.K_ESC, 0.2481, 0.0002, 'γ−1/γ del escape');
cerca(M.densidad(101325, 288.15), 1.225, 0.002, 'densidad ISA al nivel del mar');
cerca(M.presionAmbiente(0), 101325, 1, 'presión ambiente a 0 m');
// Atmósfera estándar: 2 240 m (Ciudad de México) → 77,0 kPa; 2 660 m → 73,2 kPa.
cerca(M.presionAmbiente(2240) / 1000, 77.0, 0.6, 'presión a 2 240 m (kPa)');
cerca(M.presionAmbiente(2660) / 1000, 73.2, 0.6, 'presión a 2 660 m (kPa)');
cerca(M.presionAmbiente(3500) / 1000, 65.8, 0.8, 'presión a 3 500 m (kPa)');
ok(M.presionAmbiente(3500) < M.presionAmbiente(2240), 'la presión baja con la altura');

grupo('2 · el mapa del compresor');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  // La relación máxima crece con la velocidad y vale la del catálogo en u=1.
  cerca(M.piMax(e, 1), e.piMax, 1e-9, `${e.corto}: π máx en u=1`);
  ok(M.piMax(e, 0.5) < M.piMax(e, 1), `${e.corto}: π máx crece con u`);
  cerca(M.mChoke(e, 1), e.mChoke, 1e-9, `${e.corto}: bloqueo en u=1`);
  // El rendimiento máximo del mapa es el del catálogo y cae al alejarse.
  let mej = 0;
  for (let i = 0; i <= 60; i++) for (let j = 0; j <= 40; j++) {
    const u = 0.2 + 0.9 * j / 40, m = M.mChoke(e, u) * (0.05 + 1.1 * i / 60);
    mej = Math.max(mej, M.etaComp(e, m, u));
  }
  cerca(mej, e.etaMax, 0.006, `${e.corto}: mejor rendimiento del mapa`);
  // La elipse: en el bloqueo la relación cae a 1, y crece hacia gastos bajos.
  for (const u of [0.4, 0.7, 1.0]) {
    cerca(M.piDe(e, M.mChoke(e, u), u), 1, 0.02, `${e.corto} u=${u}: π en el bloqueo`);
    ok(M.piDe(e, M.mChoke(e, u) * 0.3, u) > M.piDe(e, M.mChoke(e, u) * 0.9, u),
      `${e.corto} u=${u}: π crece al bajar el gasto`);
  }
  // La línea de bombeo sube con la relación de presiones: si fuera una fracción
  // fija del bloqueo, un motor pequeño muy soplado aparecería bombeando siempre.
  ok(M.mBombeo(e, 2.4) > M.mBombeo(e, 1.4), `${e.corto}: la línea de bombeo sube con π`);
  cerca(M.mBombeo(e, 1), 0, 1e-9, `${e.corto}: sin presión no hay bombeo`);
  // Invertir el mapa devuelve la velocidad que produce esa pareja.
  for (const u of [0.5, 0.8]) {
    const m = M.mChoke(e, u) * 0.6, pi = M.piDe(e, m, u);
    cerca(M.uPara(e, m, pi), u, 0.01, `${e.corto}: uPara invierte piDe en u=${u}`);
  }
  ok(M.uPara(e, e.mChoke * 0.6, e.piMax * 1.4) === null,
    `${e.corto}: una relación inalcanzable devuelve null`);
}

grupo('3 · el gasto corregido, que es lo que hace universal un mapa');
// A las condiciones de referencia el gasto corregido ES el gasto.
cerca(M.correGasto(0.1, M.P_REF, M.T_REF), 0.1, 1e-9, 'corrección neutra en la referencia');
// Más frío o más presión de entrada ⇒ menos gasto corregido para el mismo gasto.
ok(M.correGasto(0.1, M.P_REF, 250) < 0.1, 'aire frío baja el gasto corregido');
ok(M.correGasto(0.1, 77000, M.T_REF) > 0.1, 'menos presión sube el gasto corregido');

grupo('4 · el intercooler: enfría Y estorba');
{
  const F = {};
  // Más gasto ⇒ menos efectividad y más pérdida de carga. Las dos a la vez.
  ok(M.epsilonIC(E, 0.10, 60, F) < M.epsilonIC(E, 0.04, 60, F), 'más gasto, menos efectividad');
  ok(M.dpIC(E, 0.10, F) > M.dpIC(E, 0.04, F), 'más gasto, más pérdida de carga');
  ok(M.epsilonIC(E, 0.06, 110, F) > M.epsilonIC(E, 0.06, 20, F), 'más marcha, más efectividad');
  ok(M.epsilonIC(E, 0.06, 60, { sinIC: true }) === 0, 'sin intercooler la efectividad es 0');
  ok(M.dpIC(E, 0.06, { sinIC: true }) === 0, 'sin intercooler no hay pérdida de carga');
  ok(M.epsilonIC(E, 0.06, 60, { icSucio: true }) < M.epsilonIC(E, 0.06, 60, F),
    'el intercooler sucio enfría menos');
  ok(M.dpIC(E, 0.06, { icSucio: true }) > M.dpIC(E, 0.06, F),
    'y además estorba más: las dos cosas a la vez');
  ok(M.dpFiltro(E, 0.06, { filtroSucio: true }) > 5 * M.dpFiltro(E, 0.06, F),
    'el filtro saturado estorba mucho más');
  // Efectividad-NTU: entre 0 y 1, y creciente con el NTU (aquí, con el tamaño).
  const e2 = Object.assign({}, E, { icNTU: E.icNTU * 3 });
  ok(M.epsilonIC(e2, 0.06, 60, F) > M.epsilonIC(E, 0.06, 60, F), 'más NTU, más efectividad');
  ok(M.epsilonIC(e2, 0.06, 60, F) <= 0.96, 'la efectividad no pasa de 0,96');
}

grupo('5 · la turbina y la descarga, dos toberas en paralelo');
{
  // Ley de tobera: más área ⇒ menos presión delante para el mismo gasto.
  const p1 = M.presionDelante(7.4e-6, 0.06, 1100, 101325);
  const p2 = M.presionDelante(7.4e-6 * 2, 0.06, 1100, 101325);
  ok(p2 < p1, 'más área, menos contrapresión');
  ok(p1 > 101325, 'delante de la turbina hay más presión que detrás');
  // Y el gasto que sale de esa presión es el que se metió.
  const m = 7.4e-6 * p1 / Math.sqrt(1100) * M.fiTobera(p1 / 101325);
  cerca(m, 0.06, 1e-4, 'la tobera devuelve el gasto que se le dio');
  cerca(M.fiTobera(1.0001), 0, 0.02, 'sin salto de presión no pasa gasto');
  ok(M.fiTobera(3) > M.fiTobera(1.5), 'la función de gasto crece con la relación');
  // El equilibrio del eje: la apertura que iguala las dos potencias.
  const EJ = M.equilibraEje(E, 0.062, 1120, 101325, 5000, 0.68, {});
  ok(!EJ.faltaPotencia, 'a plena carga el eje se equilibra');
  cerca(EJ.Pt, 5000, 60, 'la turbina da lo que el compresor pide');
  ok(EJ.x > 0 && EJ.x < 1, 'la apertura de la descarga está entre 0 y 1');
  // Con la descarga forzada la apertura es la forzada y se declara.
  ok(M.equilibraEje(E, 0.062, 1120, 101325, 5000, 0.68, { wgAbierta: true }).x === 1,
    'pegada abierta ⇒ apertura 1');
  ok(M.equilibraEje(E, 0.062, 1120, 101325, 5000, 0.68, { wgPegada: true }).x === 0,
    'pegada cerrada ⇒ apertura 0');
  // Con una potencia imposible se declara que falta, no se inventa.
  ok(M.equilibraEje(E, 0.010, 900, 101325, 40000, 0.68, {}).faltaPotencia === true,
    'si la turbina no llega, se declara');
  // Más apertura ⇒ menos gasto por la turbina ⇒ menos potencia.
  const a = M.equilibraEje(E, 0.062, 1120, 101325, 1e9, 0.68, { wgPegada: true });
  const b = M.equilibraEje(E, 0.062, 1120, 101325, 1e9, 0.68, { wgAbierta: true });
  ok(b.Pt < a.Pt, 'abrir la descarga le quita potencia a la turbina');
  ok(b.p3 < a.p3, 'y también baja la contrapresión');
}

grupo('6 · la detonación y el control de picado');
cerca(M.Tdetona(E, 87), 720, 0.5, 'umbral con 87 octanos');
cerca(M.Tdetona(E, 95), 779.2, 0.5, 'umbral con 95 octanos');
ok(M.Tdetona(D, 87) > 1e8, 'un diésel no tiene umbral de detonación');
ok(M.Tcompresion(E, 313) > 313, 'comprimir calienta');
cerca(M.Tcompresion(E, 313), 313 * Math.pow(E.rc, M.N_POLI - 1), 1e-6, 'relación politrópica');
ok(M.Tcompresion(DEP, 313) < M.Tcompresion(E, 313),
  'menos relación de compresión, menos temperatura final');
ok(M.piMaxDetona(E, 298, 95, 0.85, 0.72) > M.piMaxDetona(E, 298, 87, 0.85, 0.72),
  'más octanaje admite más presión');
ok(M.piMaxDetona(E, 298, 91, 0.85, 0.72) > M.piMaxDetona(E, 298, 91, 0, 0.72),
  'el intercooler admite más presión que no tenerlo');
ok(M.piMaxDetona(D, 298, 87, 0, 0.5) > 1e8, 'en diésel no hay límite de picado');

grupo('7 · el punto de funcionamiento del 1.4 T de referencia');
{
  const V = A(E);
  cerca(V.soplado / 1e5, 1.00, 0.02, 'soplado (bar)');
  cerca(V.pAdm / 1e5, 1.98, 0.03, 'presión de colector (bar abs)');
  cerca(V.TAdm - 273.15, 40, 2, 'temperatura de admisión (°C)');
  cerca(V.T2 - 273.15, 117, 4, 'temperatura a la salida del compresor (°C)');
  cerca(V.rhoAdm, 2.211, 0.02, 'densidad en el colector');
  cerca(V.rhoSinIC, 1.774, 0.02, 'densidad si no se enfriara');
  cerca(V.pi, 2.00, 0.03, 'relación de presiones');
  cerca(V.nTurbo, 168899, 2500, 'vueltas del turbo');
  cerca(V.par, 250.7, 4, 'par (N·m)');
  cerca(V.pot, 63.0, 1.5, 'potencia (kW)');
  cerca(V.pEsc / 1e5, 2.04, 0.04, 'contrapresión antes de la turbina');
  cerca(V.T3 - 273.15, 846, 12, 'temperatura antes de la turbina (°C)');
  cerca(V.eps, 0.84, 0.02, 'efectividad del intercooler');
  cerca(V.xWG, 0.09, 0.03, 'apertura de la descarga');
  // El eje está EQUILIBRADO: es lo que la vista afirma, y se comprueba.
  cerca(V.Pt, V.Pc, Math.max(60, V.Pc * 0.01), 'la turbina da lo que el compresor pide');
  ok(!V.detona && !V.bombeo && !V.bloqueo && !V.sobreVel && !V.sobrePresion,
    'el motor sano no está en ningún límite');
  ok(V.dtc === null, 'y no hay código');
  // La presión media efectiva, que es la cifra comparable.
  cerca(4 * Math.PI * V.par / (E.cilindrada * 1e-3) / 1e5, 22.5, 0.5, 'pme (bar)');
}

grupo('8 · los cuatro motores caen donde caen los reales');
{
  const esperado = {
    gas14t: { par: 260, rpmPar: 1495, pot: 104.2, pme: 23.3 },
    die20t: { par: 326, rpmPar: 1485, pot: 102.4, pme: 20.5 },
    gas20bi: { par: 452, rpmPar: 1637, pot: 205.1, pme: 28.4 },
    die66t: { par: 1087, rpmPar: 1282, pot: 277.8, pme: 20.7 },
  };
  for (const k of M.ARQ_KEYS) {
    const e = M.ARQ[k], C = M.curva(e, {}), x = esperado[k];
    cerca(C.parMax.par, x.par, Math.max(6, x.par * 0.03), `${e.corto}: par máximo`);
    cerca(C.parMax.rpm, x.rpmPar, 220, `${e.corto}: régimen de par máximo`);
    cerca(C.potMax.pot, x.pot, Math.max(3, x.pot * 0.03), `${e.corto}: potencia máxima`);
    const pme = 4 * Math.PI * C.parMax.par / (e.cilindrada * 1e-3) / 1e5;
    cerca(pme, x.pme, 0.8, `${e.corto}: pme`);
    // Ningún motor SANO puede estar bombeando o detonando a plena carga: si lo
    // estuviera, sería un desajuste del modelo y no una lección.
    ok(!C.pts.some(p => p.bombeo), `${e.corto}: el motor sano nunca bombea`);
    ok(!C.pts.some(p => p.detona), `${e.corto}: el motor sano nunca detona`);
    // El par máximo llega ANTES que la potencia máxima. Siempre.
    ok(C.parMax.rpm < C.potMax.rpm, `${e.corto}: el par pico va antes que la potencia pico`);
    // Y la pme de un turbo de calle vive entre 18 y 32 bar.
    ok(pme > 18 && pme < 32, `${e.corto}: pme dentro de lo que existe (${pme.toFixed(1)})`);
  }
}

grupo('9 · LA TESIS: el intercooler no es un accesorio');
{
  // Gasolina: la presión NO baja y el par se hunde, porque el picado recorta.
  const a = A(E), b = A(E, { falla: 'sinIC' });
  ok(b.TAdm > a.TAdm + 25, 'sin intercooler el aire llega mucho más caliente');
  ok(b.rhoAdm < a.rhoAdm * 0.75, 'y la densidad se hunde');
  ok(b.limitadoDeton, 'en gasolina el control de picado recorta la consigna');
  ok(b.soplado < a.soplado * 0.45, `y el soplado baja de ${(a.soplado/1e5).toFixed(2)} a ${(b.soplado/1e5).toFixed(2)} bar`);
  cerca(b.par, 148.9, 5, 'par sin intercooler (N·m)');
  ok(b.par < a.par * 0.65, 'el par cae más de un tercio');
  // Diésel: la presión SE MANTIENE y el par cae igualmente, sólo por densidad.
  const c = A(D), d = A(D, { falla: 'sinIC' });
  ok(!d.limitadoDeton, 'en diésel no hay control de picado que recorte');
  cerca(d.pAdm, c.pAdm, c.pAdm * 0.03, 'y la presión de colector se mantiene');
  ok(d.par < c.par * 0.80, `y aun así pierde el par: ${c.par.toFixed(1)} → ${d.par.toFixed(1)}`);
  cerca(d.TAdm - 273.15, 150, 6, 'temperatura de admisión del diésel sin intercooler (°C)');
  // El octanaje manda de verdad cuando el picado está mandando.
  const o87 = A(E, { falla: 'sinIC', octanaje: 87 });
  const o95 = A(E, { falla: 'sinIC', octanaje: 95 });
  ok(o87.soplado < b.soplado && b.soplado < o95.soplado,
    'con el picado mandando, más octanaje deja más presión');
  // Y cuando NO manda, el octanaje no cambia nada. Eso también hay que decirlo.
  ok(Math.abs(A(E, { octanaje: 87 }).par - A(E, { octanaje: 95 }).par) < 0.5,
    'con margen de sobra, el octanaje no cambia el par');
}

grupo('10 · la altura: el turbo compensa y lo paga en el eje');
for (const e of [E, D]) {
  const llano = A(e), alto = A(e, { alt: 2660 });
  ok(alto.pAmb < llano.pAmb * 0.78, `${e.corto}: en Toluca hay bastante menos aire`);
  cerca(alto.pAdm, llano.pAdm, llano.pAdm * 0.03,
    `${e.corto}: mantiene la presión ABSOLUTA de colector`);
  ok(alto.soplado > llano.soplado * 1.2, `${e.corto}: para eso sube el soplado`);
  ok(alto.nTurbo > llano.nTurbo * 1.25, `${e.corto}: y el eje gira mucho más deprisa`);
  ok(alto.par > llano.par * 0.90,
    `${e.corto}: pierde menos del 10 % (${((1 - alto.par / llano.par) * 100).toFixed(1)} %)`);
  // Y a 3 500 m el mapa se acaba: eso tiene que NOTARSE.
  const tope = A(e, { alt: 3500 });
  ok(tope.par < alto.par, `${e.corto}: a 3 500 m ya pierde más`);
  ok(tope.avisos.length > 0, `${e.corto}: y el banco lo dice (${tope.avisos.join(', ')})`);
}
// Un atmosférico perdería en proporción a la presión: el turbo, no. Se compara
// contra la caída de densidad ambiente, que es la referencia honesta.
{
  const llano = A(E), alto = A(E, { alt: 2660 });
  const caidaAtmosferica = 1 - alto.pAmb / llano.pAmb;
  const caidaTurbo = 1 - alto.par / llano.par;
  ok(caidaTurbo < caidaAtmosferica / 3,
    `el turbo pierde menos de un tercio de lo que perdería un atmosférico ` +
    `(${(caidaTurbo * 100).toFixed(1)} % contra ${(caidaAtmosferica * 100).toFixed(1)} %)`);
}

grupo('11 · las nueve averías del 1.4 T');
{
  const sano = A(E);
  const V = {}; for (const k of M.FALLA_KEYS) V[k] = A(E, { falla: k });
  // sin intercooler
  ok(V.sinIC.par < sano.par * 0.65, 'sin intercooler: −40 % de par');
  // intercooler sucio: enfría menos Y estorba más
  ok(V.icSucio.TAdm > sano.TAdm + 10, 'intercooler sucio: el aire llega más caliente');
  ok(V.icSucio.pAdm < sano.pAdm, 'y además llega con menos presión');
  ok(V.icSucio.dtc === null, 'y no hay código');
  // filtro sucio: NO cuesta par, cuesta eje y margen
  ok(Math.abs(V.filtroSucio.par / sano.par - 1) < 0.04, 'filtro sucio: apenas cuesta par');
  ok(V.filtroSucio.nTurbo > sano.nTurbo * 1.03, 'pero el eje gira más deprisa');
  ok(V.filtroSucio.margenBombeo < sano.margenBombeo, 'y el margen de bombeo se estrecha');
  ok(V.filtroSucio.p1 < sano.p1, 'porque la presión de entrada baja');
  ok(V.filtroSucio.pi > sano.pi, 'y el compresor tiene que comprimir más');
  // fuga de carga: el compresor sopla lo mismo y al colector no llega
  cerca(V.fugaCarga.soplado, sano.soplado, sano.soplado * 0.05,
    'fuga de carga: el compresor sopla lo mismo');
  ok(V.fugaCarga.pAdm < sano.pAdm * 0.85, 'y al colector le llega bastante menos');
  ok(V.fugaCarga.par < sano.par * 0.80, 'con eso pierde más de un 20 % de par');
  ok(V.fugaCarga.dtc === null, 'y el ordenador no dice nada');
  // descarga abierta: no hay presión y sí hay código
  ok(V.wgAbierta.soplado < 0.05e5, 'descarga abierta: no hay soplado');
  ok(V.wgAbierta.dtc === 'P0299', 'y sale P0299');
  ok(!V.wgAbierta.bombeo && !V.wgAbierta.bloqueo,
    'y NO se afirma bombeo ni bloqueo donde no hay mapa');
  ok(V.wgAbierta.margenBombeo === null, 'ni margen de bombeo');
  // descarga cerrada: se pasa de todo
  ok(V.wgPegada.soplado > E.sopladoMax, 'descarga cerrada: pasa del soplado máximo');
  ok(V.wgPegada.sobrePresion, 'y se declara la sobrepresión');
  ok(V.wgPegada.nTurbo > E.nMax, 'el eje pasa de sus vueltas máximas');
  ok(V.wgPegada.sobreVel, 'y se declara');
  ok(V.wgPegada.dtc === 'P0234', 'sale P0234');
  ok(V.wgPegada.par > sano.par, 'y el par SUBE: por eso la avería tarda en descubrirse');
  // escape tapado: contrapresión arriba, par abajo, sin código
  ok(V.escapeTapado.pEsc > sano.pEsc * 1.20, 'escape tapado: sube la contrapresión');
  ok(V.escapeTapado.par < sano.par * 0.95, 'y baja el par');
  ok(V.escapeTapado.dtc === null, 'sin código');
  cerca(V.escapeTapado.soplado, sano.soplado, sano.soplado * 0.03,
    'con el MISMO soplado que el motor sano');
  // turbo gastado: sale más caliente para la misma presión
  ok(V.turboGastado.pEsc > sano.pEsc * 1.15,
    'turbo gastado: la turbina necesita más salto para lo mismo');
  ok(V.turboGastado.par < sano.par * 0.98, 'y el par baja');
}

grupo('12 · el filtro sucio contra el manguito reventado: el mismo soplado');
{
  const a = A(E, { falla: 'filtroSucio' }), b = A(E, { falla: 'fugaCarga' });
  cerca(a.soplado, b.soplado, 0.03e5, 'los dos dan el mismo bar de soplado');
  ok(Math.abs(a.par - b.par) > 50, 'y sin embargo el par se diferencia en más de 50 N·m');
  ok(a.dtc === null && b.dtc === null, 'y ninguno de los dos da código');
  ok(Math.abs(a.pAdm - b.pAdm) > 0.30e5,
    'lo que los separa es el manómetro DEL COLECTOR, no el del turbo');
}

grupo('13 · el escape tapado sopla ANTES, y eso es contraintuitivo');
{
  const lo = Math.round(E.rpmPar * 0.75);
  const s = M.transitorio(E, lo, {}, {});
  const t = M.transitorio(E, lo, M.averia('escapeTapado'), {});
  ok(t.tSopla !== null && s.tSopla !== null, 'los dos llegan a la consigna');
  ok(t.tSopla < s.tSopla, `el escape tapado sopla antes (${t.tSopla.toFixed(2)} s contra ${s.tSopla.toFixed(2)})`);
  ok(A(E, { falla: 'escapeTapado' }).par < A(E).par, 'y aun así pierde par');
}

grupo('14 · el transitorio del eje');
for (const e of [E, D, DEP, V8]) {
  const lo = Math.round(e.rpmPar * 0.75);
  const T = M.transitorio(e, lo, {}, {});
  ok(T.tSopla !== null, `${e.corto}: llega a la consigna a ${lo} rpm`);
  ok(T.tSopla > 0.05 && T.tSopla < 2.5, `${e.corto}: el retardo es de un orden creíble (${T.tSopla.toFixed(2)} s)`);
  ok(T.sobreimpulso > 0.05 && T.sobreimpulso < 0.60,
    `${e.corto}: el sobreimpulso es real y acotado (${(T.sobreimpulso * 100).toFixed(0)} %)`);
  // El transitorio TIENE que acabar donde el régimen permanente dice.
  const V = M.evalua(e, { rpm: lo, carga: 1 });
  cerca(T.sopladoFin, V.soplado, Math.max(0.06e5, V.soplado * 0.06),
    `${e.corto}: el transitorio acaba en el punto de régimen`);
  cerca(T.nFin, V.nTurbo, Math.max(6000, V.nTurbo * 0.06),
    `${e.corto}: y con las vueltas del punto de régimen`);
  // Y el eje del motor sano NO se pasa de vueltas.
  ok(T.nFin <= e.nMax * 1.02, `${e.corto}: el eje sano no se pasa de vueltas`);
  // Con el turbo gastado, siempre tarda más (o no llega).
  const G = M.transitorio(e, lo, M.averia('turboGastado'), {});
  ok(G.tSopla === null || G.tSopla > T.tSopla * 1.2,
    `${e.corto}: el turbo gastado tarda mucho más`);
  // Con la descarga pegada cerrada, el eje se dispara.
  const P = M.transitorio(e, lo, M.averia('wgPegada'), {});
  ok(P.sopladoPico > T.sopladoPico, `${e.corto}: pegada cerrada, más presión`);
  ok(P.nFin > T.nFin * 1.05, `${e.corto}: y el eje acaba mucho más rápido`);
  // Que se PASE de vueltas depende del régimen: a un régimen bajo pasa poco gas
  // por la turbina y el eje se asienta por debajo del límite aunque la descarga
  // esté cerrada. Donde tiene que pasarse es arriba, y ahí se comprueba.
  const PA = M.transitorio(e, e.rpmPar, M.averia('wgPegada'), {});
  ok(PA.nFin > e.nMax, `${e.corto}: a ${e.rpmPar} rpm, pegada cerrada, el eje se pasa`);
  // Con la descarga pegada abierta no llega nunca.
  const AB = M.transitorio(e, lo, M.averia('wgAbierta'), {});
  ok(AB.tSopla === null, `${e.corto}: pegada abierta, no llega nunca`);
}

grupo('15 · el ambiente');
{
  // Calor: menos densidad, menos par. Frío: al revés.
  const frio = A(E, { Tamb: 5 }), calor = A(E, { Tamb: 40 });
  ok(frio.par > A(E).par && A(E).par > calor.par, 'más calor, menos par');
  ok(frio.TAdm < calor.TAdm, 'y el aire de admisión sigue al ambiente');
  // Marcha: el intercooler enfría mejor cuanto más deprisa se va.
  const ciudad = A(E, { vAire: 20 }), carretera = A(E, { vAire: 110 });
  ok(ciudad.eps < carretera.eps, 'en ciudad el intercooler enfría menos');
  ok(ciudad.TAdm > carretera.TAdm, 'y el aire llega más caliente');
  ok(ciudad.par < carretera.par, 'y por eso se pierde par en el atasco');
}

grupo('16 · el censo: lo que el ordenador NO ve');
for (const e of [E, D, DEP, V8]) {
  const C = M.censo(e, {});
  ok(C.total === 45, `${e.corto}: 45 casillas (9 averías × 5 regímenes)`);
  ok(C.conAviso >= 28, `${e.corto}: la mayoría de las casillas tienen síntoma (${C.conAviso})`);
  ok(C.mudo >= 10, `${e.corto}: y hay muchas mudas (${C.mudo})`);
  ok(C.mudo < C.conAviso, `${e.corto}: pero no todas`);
  // El motor sano no tiene ni un síntoma en ninguna casilla.
  const s = C.filas.find(f => f.falla === 'sano');
  ok(s.celdas.every(c => !c.nota), `${e.corto}: el motor sano no da síntoma en ningún régimen`);
  ok(s.celdas.every(c => !c.dtc), `${e.corto}: ni código`);
  // Las dos averías de la descarga SIEMPRE dan código: son las dos de presión.
  // La sobrepresión se vigila siempre; la presión baja sólo por encima del
  // régimen de soplado, porque por debajo ningún turbo sano llega a la consigna.
  {
    const f = C.filas.find(x => x.falla === 'wgPegada');
    ok(f.celdas.every(c => c.dtc === 'P0234'),
      `${e.corto}: pegada cerrada da P0234 en los cinco regímenes`);
    const g = C.filas.find(x => x.falla === 'wgAbierta');
    const conCodigo = g.celdas.filter(c => c.dtc === 'P0299').length;
    ok(conCodigo >= 3, `${e.corto}: pegada abierta da P0299 en ${conCodigo} de 5 regímenes`);
    ok(g.celdas.every(c => c.nota), `${e.corto}: y hay síntoma en los cinco`);
  }
  // Y el escape tapado NUNCA lo da: respeta la presión y estropea lo demás.
  const t = C.filas.find(x => x.falla === 'escapeTapado');
  ok(t.celdas.every(c => !c.dtc), `${e.corto}: el escape tapado no da código nunca`);
}

grupo('17 · los códigos, que sólo hablan de presión');
ok(Object.keys(M.DTC_ROT).length >= 2, 'hay al menos dos códigos declarados');
{
  const V = A(E);
  ok(M.dtcDe(E, Object.assign({}, V, { soplado: E.sopladoObj * 0.5, carga: 1 })) === 'P0299',
    'poca presión ⇒ P0299');
  // Y por debajo del régimen de soplado, NO: ahí ni un turbo sano llega.
  ok(M.dtcDe(E, Object.assign({}, V, { soplado: 0, carga: 1, rpm: Math.round(E.rpmPar * 0.6) })) === null,
    'por debajo del régimen de soplado el diagnóstico está inhabilitado');
  ok(M.dtcDe(E, Object.assign({}, V, { soplado: E.sopladoMax * 1.2, carga: 1, rpm: Math.round(E.rpmPar * 0.6) })) === 'P0234',
    'la sobrepresión, en cambio, se vigila a cualquier régimen');
  ok(M.dtcDe(E, Object.assign({}, V, { soplado: E.sopladoMax * 1.2, carga: 1 })) === 'P0234',
    'demasiada presión ⇒ P0234');
  ok(M.dtcDe(E, Object.assign({}, V, { soplado: E.sopladoObj, carga: 1 })) === null,
    'la consigna exacta no da código');
  // A carga parcial no se exige la consigna de plena carga: si se exigiera, el
  // banco daría P0299 al ralentí, que es absurdo.
  ok(M.dtcDe(E, Object.assign({}, V, { soplado: 0, carga: 0.2 })) === null,
    'a carga parcial baja no se exige presión');
}

grupo('18 · la carga: el mando que no es una avería');
{
  const plena = A(E, { carga: 1 }), media = A(E, { carga: 0.5 });
  ok(media.par < plena.par, 'menos carga, menos par');
  ok(media.soplado < plena.soplado, 'y menos soplado');
  ok(media.dtc === null, 'sin código: pedir menos no es una avería');
}

grupo('19 · las averías no se pisan entre sí');
{
  // Cada avería tiene que producir una firma distinta en el conjunto de las
  // cuatro cifras que un banco puede medir. Si dos coincidieran, el reto tendría
  // una pareja indistinguible con TODOS los instrumentos, y eso hay que saberlo.
  const firma = V => [V.soplado, V.pAdm, V.TAdm, V.par, V.pEsc, V.nTurbo]
    .map(x => Math.round(x * 100) / 100).join('|');
  const vistas = new Map();
  for (const k of M.FALLA_KEYS) {
    const f = firma(A(E, { falla: k }));
    ok(!vistas.has(f), `${k} y ${vistas.get(f)} tienen la MISMA firma completa`);
    vistas.set(f, k);
  }
}

grupo('20 · lo que ninguna cifra puede ser');
for (const k of M.ARQ_KEYS) {
  const e = M.ARQ[k];
  for (const f of M.FALLA_KEYS) {
    for (const rpm of M.regimenes(e).map(r => r.rpm)) {
      const V = M.evalua(e, { falla: f, rpm, carga: 1 });
      const campos = { soplado: V.soplado, pAdm: V.pAdm, TAdm: V.TAdm, T2: V.T2, T3: V.T3,
        par: V.par, pot: V.pot, m: V.m, pEsc: V.pEsc, Pc: V.Pc, Pt: V.Pt, pi: V.pi };
      for (const [nom, val] of Object.entries(campos))
        ok(isFinite(val), `${e.corto}/${f}/${rpm}: ${nom} no es finito (${val})`);
      ok(V.par >= 0, `${e.corto}/${f}/${rpm}: el par no puede ser negativo`);
      ok(V.TAdm >= V.Tamb - 1, `${e.corto}/${f}/${rpm}: el intercooler no enfría por debajo del ambiente`);
      ok(V.T2 >= V.Tamb - 1, `${e.corto}/${f}/${rpm}: comprimir no puede enfriar`);
      ok(V.pAdm > 0 && V.pEsc > 0, `${e.corto}/${f}/${rpm}: presiones positivas`);
      ok(V.m >= 0, `${e.corto}/${f}/${rpm}: el gasto no puede ser negativo`);
      ok(V.pi >= 1, `${e.corto}/${f}/${rpm}: el compresor no puede bajar la presión`);
      ok(V.xWG >= 0 && V.xWG <= 1, `${e.corto}/${f}/${rpm}: la apertura está entre 0 y 1`);
    }
  }
}

console.log(`\n${n - malos}/${n} comprobaciones`);
process.exit(malos ? 1 : 0);
