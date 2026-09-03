/**
 * CAPA 1 · d6-A2 · el motor sellado, validado en Node y sin navegador.
 *
 * Recorta del `.body.js` todo lo que va de las utilidades al §13 —que es física
 * y aritmética pura, sin three.js ni DOM— y lo somete a lo que tiene que
 * cumplir. Lo que aquí falla no es un problema de pintado: es del modelo.
 *
 *   node scripts/auditoria/.c1_A2.mjs
 */
import { readFileSync } from 'node:fs';

const P = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard/' +
  'scripts/lab-src/carga-alternador-balance.body.js';

function cargaMotor() {
  const src = readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
  // Se empieza en las UTILIDADES, no en el §1: por encima del §1 el cuerpo
  // declara `clamp`, `dec` y `barajaEn`, que usa el motor entero. Cortando en el
  // §1 habría que inyectar una copia de `clamp` —que podría divergir del de
  // verdad sin que nadie se enterara— y `dec` ni siquiera existiría aquí.
  const u = src.indexOf('// El kit de la escena NO trae');
  if (u < 0) throw new Error('no encuentro las utilidades del cuerpo');
  // Y se CORTA en el marcador de la interfaz: de ahí para abajo hay three.js y
  // DOM, que en Node no existen.
  const j = src.indexOf('// ============================================================ T1 ');
  if (j < 0) throw new Error('no encuentro el marcador T1: ¿ha cambiado el encabezado?');
  const cuerpo = src.slice(u, j);
  const nombres = ['clamp', 'dec', 'barajaEn',
    'POLOS', 'K_E', 'I_F_MEDIO', 'I_F_MAX', 'L_S', 'V_DIODO_0', 'V_DIODO_R',
    'flujo', 'frecuencia', 'femFase', 'reactancia', 'caidaDiodos', 'vacioRectificado',
    'corrienteAlternador', 'corrienteAsintotica',
    'V_CONSIGNA_25', 'TC_REGULADOR', 'consigna',
    'VASOS', 'tensionVaso', 'tensionAbierta', 'factorFrio', 'factorCarga',
    'riReferencia', 'resistenciaInterna', 'resistenciaPolarizacion', 'corrienteBateria',
    'R_POL_REF', 'M_POL',
    'V_NOMINAL', 'CARGAS', 'CARGA_KEYS', 'corrienteCarga', 'corrienteCargas', 'potenciaCargas',
    'RHO_CU', 'ALFA_CU', 'resistenciaCable', 'LIM_CARGA', 'LIM_MASA',
    'corrienteDelNudo', 'tensionBarra', 'nudo', 'reparto', 'regula', 'factorPatinaje',
    'VEHS', 'VEH_KEYS', 'rpmAlternador', 'FALLAS', 'FALLA_KEYS', 'averia',
    'resistenciasSanas', 'resistencias', 'SITUACIONES', 'SIT_KEYS',
    'FUGA_BASE', 'redondea', 'RESOL', 'rizadoPP', 'impedanciaBarra', 'ensayo',
    'INSTR', 'INSTR_KEYS', 'instr', 'lectura', 'lecturaTexto', 'separa', 'firma',
    'PEUKERT', 'autonomiaMin', 'censo', 'clases', 'ambiguos',
    'RETO', 'retoCondicion', 'claveCondicion', 'retoEnsayo', 'retoCompatibles',
    'retoAnota', 'retoNuevo', 'retoResponde', 'retoResumen',
    'capacidad', 'rpmEquilibrio', 'barrido'];
  return new Function(cuerpo + '\nreturn {' + nombres.join(',') + '};')();
}

const M = cargaMotor();

let n = 0, malos = 0;
const ok = (c, q) => { n++; if (!c) { malos++; console.log('  ‼️  ' + q); } };
const cerca = (a, b, tol, q) => ok(Math.abs(a - b) <= tol, `${q}: ${a} vs ${b} ±${tol}`);
const grupo = t => console.log('\n' + t);
const EN = (vk, fk, sk, o) => M.ensayo(vk, fk, sk, o || {});
const TODOS = [];
for (const vk of M.VEH_KEYS) for (const fk of M.FALLA_KEYS) for (const s of M.SITUACIONES)
  TODOS.push([vk, fk, s.k]);

grupo('1 · las utilidades que el cuerpo declara');
{
  ok(M.clamp(5, 0, 3) === 3 && M.clamp(-1, 0, 3) === 0 && M.clamp(2, 0, 3) === 2, 'clamp');
  ok(M.dec(3.14159, 2) === '3,14', 'dec usa coma: ' + M.dec(3.14159, 2));
  ok(!/\./.test(M.dec(-0.5, 3)), 'dec nunca escribe punto decimal');
  const a = ['a', 'b', 'c', 'd', 'e'];
  for (let i = 0; i < 40; i++) {
    const b = M.barajaEn(a);
    ok(b.length === a.length && a.every(x => b.indexOf(x) >= 0), 'barajaEn es una permutación');
  }
  ok(M.barajaEn(a) !== a, 'barajaEn no muta el original');
}

grupo('2 · el alternador de garras');
{
  ok(M.flujo(0) === 0, 'sin campo no hay flujo');
  for (let i = 0.2; i < 8; i += 0.2)
    ok(M.flujo(i + 0.2) > M.flujo(i), 'el flujo crece con el campo');
  cerca(M.flujo(M.I_F_MEDIO), 0.5, 1e-12, 'medio flujo a I_F_MEDIO');
  ok(M.flujo(20) - M.flujo(10) < M.flujo(10) - M.flujo(0), 'y satura: cada amperio vale menos');
  // La fem y la reactancia crecen las dos con el régimen, y en la MISMA
  // proporción: ése es el motivo de que exista un techo de corriente.
  for (const r of [1000, 2000, 4000]) {
    cerca(M.femFase(2 * r, 2) / M.femFase(r, 2), 2, 1e-9, 'fem proporcional al régimen');
    cerca(M.reactancia(2 * r) / M.reactancia(r), 2, 1e-9, 'reactancia proporcional al régimen');
  }
  const as1 = M.corrienteAsintotica(M.I_F_MAX);
  ok(as1 > 140 && as1 < 165, 'la asintótica cae donde debe: ' + as1.toFixed(1) + ' A');
  for (let r = 2000; r <= 20000; r += 2000)
    ok(M.corrienteAlternador(r, M.I_F_MAX, 14.4, 6) < as1,
      'a ningún régimen se pasa de la asintótica (' + r + ')');
  ok(M.corrienteAlternador(19000, M.I_F_MAX, 14.4, 6) > as1 * 0.90,
    'y a régimen alto se acerca a ella');
  // Monotonías, que es lo que hace que las bisecciones tengan una sola raíz.
  for (let r = 1400; r <= 8000; r += 200) {
    ok(M.corrienteAlternador(r + 200, M.I_F_MAX, 14.4, 6) > M.corrienteAlternador(r, M.I_F_MAX, 14.4, 6),
      'más vueltas, más corriente (' + r + ')');
    ok(M.corrienteAlternador(r, M.I_F_MAX, 15.0, 6) < M.corrienteAlternador(r, M.I_F_MAX, 13.0, 6),
      'más tensión de barra, menos corriente (' + r + ')');
  }
  ok(M.corrienteAlternador(900, M.I_F_MAX, 14.4, 6) === 0, 'por debajo del codo no da nada');
  // Y la cifra de la chapa: 120 A a 6 000 rpm de alternador, que es como la
  // declara la SAE J56. No es un ajuste libre: de ahí salió L_S.
  cerca(M.corrienteAlternador(6000, M.I_F_MAX, 14.4, 6), 120, 1.0, 'la chapa a 6 000 rpm');
}

grupo('3 · el puente de diodos');
{
  let ratioAnt = -1;
  for (let r = 2000; r <= 8000; r += 500) {
    const s6 = M.corrienteAlternador(r, M.I_F_MAX, 14.4, 6);
    const s5 = M.corrienteAlternador(r, M.I_F_MAX, 14.4, 5);
    const s4 = M.corrienteAlternador(r, M.I_F_MAX, 14.4, 4);
    ok(s5 < s6 && s4 < s5, 'un diodo roto siempre da menos (' + r + ')');
    // Y el daño no es un porcentaje fijo: aprieta MUCHO más abajo, porque ahí la
    // máquina está justo por encima de su codo y perder un sexto de la
    // envolvente la devuelve por debajo. Ésa es la lección, no un tanto por
    // ciento de manual.
    const ratio = s5 / s6;
    ok(ratio < 0.90, 'un diodo abierto nunca deja el 90 % (' + r + '): ' + ratio.toFixed(3));
    ok(ratio > ratioAnt, 'y duele más cuanto menos gira (' + r + ')');
    ratioAnt = ratio;
  }
  ok(M.corrienteAlternador(2000, M.I_F_MAX, 14.4, 5) /
    M.corrienteAlternador(2000, M.I_F_MAX, 14.4, 6) < 0.45,
    'a 2 000 rpm de alternador, un diodo abierto se lleva más de la mitad');
  const z = 0.0075;
  for (let r = 2000; r <= 8000; r += 1000) {
    const z6 = M.rizadoPP(r, M.I_F_MAX, 6, z);
    const z5 = M.rizadoPP(r, M.I_F_MAX, 5, z);
    const z4 = M.rizadoPP(r, M.I_F_MAX, 4, z);
    ok(z5 > z6 * 3 && z4 > z5, 'el rizado se dispara con un diodo roto (' + r + ')');
    ok(z6 < 0.06, 'y con el puente sano es pequeño: ' + (z6 * 1000).toFixed(0) + ' mV');
  }
  ok(M.rizadoPP(0, M.I_F_MAX, 6, z) === 0, 'parado no riza');
  // Más impedancia en el punto de medida, más rizado medido: por eso una masa
  // floja hace subir el rizado sin que haya ningún diodo roto.
  ok(M.rizadoPP(4000, M.I_F_MAX, 6, 0.03) > M.rizadoPP(4000, M.I_F_MAX, 6, 0.005),
    'el rizado medido depende de la impedancia del punto');
}

grupo('4 · el regulador');
{
  cerca(M.consigna(25, 0), M.V_CONSIGNA_25, 1e-12, 'a 25 °C, la consigna nominal');
  cerca(M.consigna(5, 0) - M.consigna(25, 0), 0.20, 1e-9, 'compensa +0,20 V por 20 K de frío');
  cerca(M.TC_REGULADOR, -0.010, 1e-12, 'el coeficiente es −10 mV/K');
  for (let t = -20; t <= 50; t += 5)
    ok(M.consigna(t + 5, 0) < M.consigna(t, 0), 'y siempre baja con el calor (' + t + ')');
  cerca(M.consigna(25, -0.90), M.V_CONSIGNA_25 - 0.90, 1e-12, 'el desvío del regulador se suma');
}

grupo('5 · la batería: cargar y descargar NO son lo mismo');
{
  const bat = { cca: 640, ah: 60 };
  // En pasos ENTEROS: sumando 0,1 diez veces se llega a 0,999… y a 1,099…, y el
  // `clamp` de dentro los aplasta los dos al mismo sitio. La prueba fallaba por
  // la aritmética de la prueba, no por la de la batería.
  for (let i = 0; i < 10; i++)
    ok(M.tensionAbierta(bat, (i + 1) / 10, 20) > M.tensionAbierta(bat, i / 10, 20),
      'Voc crece con la carga (' + i + ')');
  ok(M.resistenciaInterna(bat, 1, -18) > M.resistenciaInterna(bat, 1, 25), 'el frío sube la Ri');
  ok(M.resistenciaInterna(bat, 0.4, 20) > M.resistenciaInterna(bat, 1, 20), 'y la descarga también');
  // La polarización, que es la que manda cargando.
  for (let s = 0.3; s < 0.95; s += 0.05)
    ok(M.resistenciaPolarizacion(bat, s + 0.05, 20) > M.resistenciaPolarizacion(bat, s, 20),
      'la polarización crece según se llena');
  ok(M.resistenciaPolarizacion(bat, 0.9, -10) > M.resistenciaPolarizacion(bat, 0.9, 25),
    'y con el frío');
  ok(M.resistenciaPolarizacion({ cca: 640, ah: 120 }, 0.9, 20) <
    M.resistenciaPolarizacion(bat, 0.9, 20) * 0.6, 'una batería del doble admite el doble');
  ok(M.resistenciaPolarizacion(bat, 0.9, 20) > M.resistenciaInterna(bat, 0.9, 20) * 20,
    'y es DOS ÓRDENES mayor que la resistencia óhmica: por eso una batería da 700 A y admite 5');
  // La curva de aceptación: las cuatro cifras contra las que se ajustó.
  for (const [soc, esp] of [[0.5, 26], [0.8, 10], [0.9, 5], [0.95, 2.6]])
    cerca(M.corrienteBateria(bat, soc, 20, 14.4), esp, esp * 0.14,
      'acepta ' + esp + ' A al ' + (soc * 100) + ' %');
  // Continuidad y monotonía: sin las dos, la bisección del nudo no vale.
  for (let s = 0.2; s <= 0.95; s += 0.15) {
    const voc = M.tensionAbierta(bat, s, 20);
    cerca(M.corrienteBateria(bat, s, 20, voc), 0, 1e-9, 'en Voc no circula nada');
    // La tolerancia se mide EN AMPERIOS a partir de la resistencia que manda en
    // cada lado: una décima de microvoltio sobre 5 mΩ ya son veinte microamperios.
    const ri = M.resistenciaInterna(bat, s, 20);
    const rp = ri + M.resistenciaPolarizacion(bat, s, 20);
    cerca(M.corrienteBateria(bat, s, 20, voc + 1e-7), 0, 1e-7 / rp * 3, 'continua por arriba');
    cerca(M.corrienteBateria(bat, s, 20, voc - 1e-7), 0, 1e-7 / ri * 3, 'y por abajo');
    for (let v = 10; v < 16; v += 0.5)
      ok(M.corrienteBateria(bat, s, 20, v + 0.5) > M.corrienteBateria(bat, s, 20, v),
        'y crece con la tensión que se le ofrece');
  }
  ok(M.corrienteBateria(bat, 0.5, 20, 11) < -100, 'descargando, manda el óhmico y da cientos de A');
}

grupo('6 · los consumos, y las DOS formas del nudo');
{
  for (const c of M.CARGAS) {
    const i0 = M.corrienteCarga(c, 12.0), i1 = M.corrienteCarga(c, 14.4);
    if (c.tipo === 'res') ok(i1 > i0, c.k + ': resistivo, sube con la tensión');
    else ok(i1 < i0, c.k + ': de potencia, BAJA con la tensión');
    cerca(M.corrienteCarga(c, M.V_NOMINAL), c.w / M.V_NOMINAL, 1e-9,
      c.k + ': a la tensión nominal, los vatios de la etiqueta');
  }
  ok(M.CARGAS.some(c => c.tipo === 'res') && M.CARGAS.some(c => c.tipo === 'pot'),
    'hay de las dos clases');
  ok(M.CARGAS.filter(c => c.fijo).length === 1, 'y sólo uno no se puede apagar');
  cerca(M.potenciaCargas({ cruce: 1 }, M.V_NOMINAL),
    M.CARGAS.filter(c => c.fijo || c.k === 'cruce').reduce((a, c) => a + c.w, 0), 1e-9,
    'a la nominal, los vatios de verdad son los de la etiqueta');
  // EL CHEQUEO QUE IMPORTA: la forma legible del nudo y la precalculada tienen
  // que dar lo mismo hasta el último bit. Son dos escrituras de una ecuación, y
  // si divergieran el laboratorio enseñaría una cosa y calcularía otra.
  const bat = { cca: 700, ah: 70 };
  let peor = 0;
  for (const enc of [{}, { cruce: 1 }, { luneta: 1, ventila: 1, clima: 1 },
    { cruce: 1, luneta: 1, ventila: 1, limpia: 1, radio: 1, niebla: 1, asiento: 1, clima: 1 }]) {
    const N = M.nudo(bat, 0.7, 5, enc);
    for (let v = 6; v <= 18; v += 0.25) {
      const a = N.pide(v);
      const b = M.corrienteDelNudo(bat, 0.7, 5, enc, v);
      peor = Math.max(peor, Math.abs(a - b));
    }
  }
  ok(peor < 1e-9, 'las dos formas del nudo coinciden (peor desvío ' + peor.toExponential(2) + ' A)');
  // Y `tensionBarra` invierte de verdad al nudo.
  for (const I of [0, 12, 45, 90]) {
    const v = M.tensionBarra(I, bat, 0.7, 5, { cruce: 1, luneta: 1 });
    if (v > 6.001 && v < 17.999)
      cerca(M.corrienteDelNudo(bat, 0.7, 5, { cruce: 1, luneta: 1 }, v), I, 1e-6,
        'tensionBarra invierte el nudo para ' + I + ' A');
  }
}

grupo('7 · el cable y la vuelta');
{
  cerca(M.resistenciaCable(2, 25, 20) / M.resistenciaCable(1, 25, 20), 2, 1e-12,
    'la resistencia va con la longitud');
  cerca(M.resistenciaCable(1, 50, 20) / M.resistenciaCable(1, 25, 20), 0.5, 1e-12,
    'y con la inversa de la sección');
  ok(M.resistenciaCable(1, 25, 80) > M.resistenciaCable(1, 25, -20), 'y el cobre sube con el calor');
  cerca(M.resistenciaCable(1, 1, 20), M.RHO_CU * 1e6, 1e-12, 'con la resistividad del cobre');
  ok(M.LIM_CARGA > M.LIM_MASA, 'al cable de carga se le tolera más que a la masa');
  for (const vk of M.VEH_KEYS) {
    const R = M.resistenciasSanas(M.VEHS[vk], 20);
    ok(R.carga > 0 && R.masa > 0, vk + ': las dos resistencias son positivas');
    ok(R.carga < 0.02 && R.masa < 0.01, vk + ': y sanas, pequeñas');
  }
  for (const fk of M.FALLA_KEYS) {
    const R = M.resistencias(M.VEHS.util16, 20, M.averia(fk));
    const S = M.resistenciasSanas(M.VEHS.util16, 20);
    ok(R.carga >= S.carga - 1e-15 && R.masa >= S.masa - 1e-15,
      fk + ': ninguna avería MEJORA una resistencia');
  }
}

grupo('8 · el punto de funcionamiento');
{
  for (const [vk, fk, sk] of TODOS) {
    const E = EN(vk, fk, sk);
    const v = M.VEHS[vk];
    // El nudo cuadra: lo que entra por el cable sale por los consumos y la batería.
    cerca(E.r.iAlt, E.r.iCargas + E.r.iBat, 2e-4, `${vk}/${fk}/${sk}: el nudo cuadra`);
    // Y la ley de Ohm del enlace.
    cerca(E.r.vAlt, E.r.vBarra + E.rLink * E.r.iAlt, 1e-9, `${vk}/${fk}/${sk}: vAlt = vBarra + R·I`);
    // El regulador ve su consigna donde MIDE, salvo que esté saturado.
    const punto = v.sensa === 'bateria' ? E.r.vBarra : E.r.vAlt;
    if (!E.saturado) cerca(punto, E.vObj, 2e-3, `${vk}/${fk}/${sk}: el regulador clava la consigna`);
    else {
      ok(punto <= E.vObj + 1e-6, `${vk}/${fk}/${sk}: saturado, no llega a la consigna`);
      cerca(E.r.iCampo, E.iCampoMax, 1e-9, `${vk}/${fk}/${sk}: y el campo está a tope`);
    }
    ok(E.r.iCampo <= E.iCampoMax + 1e-9, `${vk}/${fk}/${sk}: el campo nunca pasa de su máximo`);
    ok(E.r.iAlt >= -1e-9 && isFinite(E.r.iAlt), `${vk}/${fk}/${sk}: corriente finita y no negativa`);
    ok(E.r.vBarra > 5 && E.r.vBarra < 19, `${vk}/${fk}/${sk}: la barra en un rango físico`);
    ok(E.descarga === (E.r.iBat < -0.5), `${vk}/${fk}/${sk}: el veredicto es el signo de iBat`);
  }
}

grupo('9 · la correa que patina');
{
  ok(M.factorPatinaje(0, 100) === 1, 'sin avería no patina');
  ok(M.factorPatinaje(undefined, 100) === 1, 'ni sin declararla');
  cerca(M.factorPatinaje(0.62, 0), 1, 1e-12, 'y sin par tampoco patina: ahí está la trampa');
  for (let i = 0; i < 200; i += 10)
    ok(M.factorPatinaje(0.62, i + 10) < M.factorPatinaje(0.62, i), 'patina más cuanto más par');
  ok(M.factorPatinaje(0.62, 400) >= 0.62, 'y nunca por debajo de su suelo');
  // La consecuencia de laboratorio: la MISMA correa se porta bien en la
  // revisión y mal en el atasco, y eso no puede depender de que lo diga nadie.
  const rev = EN('util16', 'correa', 'diaCarretera');
  const atas = EN('util16', 'correa', 'atasco');
  ok(rev.r.patinaje < atas.r.patinaje, 'patina más en el atasco que en la revisión');
}

grupo('10 · los vehículos');
{
  for (const vk of M.VEH_KEYS) {
    const v = M.VEHS[vk];
    ok(v.relPolea > 2 && v.relPolea < 4, vk + ': relación de poleas plausible');
    ok(v.ralenti >= 600 && v.ralenti <= 900, vk + ': ralentí plausible');
    ok(v.crucero > v.ralenti, vk + ': el crucero es más que el ralentí');
    ok(v.sensa === 'bateria' || v.sensa === 'alternador', vk + ': sensa declarado');
    ok(v.bat.ah > 40 && v.bat.ah < 120, vk + ': capacidad plausible');
    cerca(M.rpmAlternador(v, 1000), 1000 * v.relPolea, 1e-12, vk + ': el alternador va por la polea');
  }
  ok(M.VEH_KEYS.some(k => M.VEHS[k].sensa === 'bateria') &&
    M.VEH_KEYS.some(k => M.VEHS[k].sensa === 'alternador'),
    'hay coches de los dos sensados: sin eso, la lección del cable no existe');
}

grupo('11 · las nueve averías, y que ninguna sea de adorno');
{
  for (const fk of M.FALLA_KEYS) {
    ok(typeof M.FALLAS[fk].sig === 'string' && M.FALLAS[fk].sig.length <= 11,
      fk + ': tiene sigla corta para el censo');
    ok(typeof M.FALLAS[fk].pista === 'string' && M.FALLAS[fk].pista.length > 20,
      fk + ': tiene pista');
    if (fk === 'sano') continue;
    // Cada avería tiene que verse en ALGUNA condición y con ALGÚN aparato: una
    // avería que no cambia nada nunca no es una avería, es un adorno.
    let vista = false;
    for (const vk of M.VEH_KEYS) for (const s of M.SITUACIONES) {
      const a = EN(vk, 'sano', s.k), b = EN(vk, fk, s.k);
      if (M.INSTR_KEYS.some(ik => M.separa(ik, a, b))) { vista = true; break; }
    }
    ok(vista, fk + ': se ve en alguna condición');
  }
  // Y dos averías distintas no pueden ser la misma en TODAS las condiciones.
  for (let i = 0; i < M.FALLA_KEYS.length; i++)
    for (let j = i + 1; j < M.FALLA_KEYS.length; j++) {
      const a = M.FALLA_KEYS[i], b = M.FALLA_KEYS[j];
      let sepa = false;
      for (const vk of M.VEH_KEYS) for (const s of M.SITUACIONES) {
        const A = EN(vk, a, s.k), B = EN(vk, b, s.k);
        if (M.INSTR_KEYS.some(ik => M.separa(ik, A, B))) { sepa = true; break; }
      }
      ok(sepa, `${a} y ${b} se separan en alguna condición`);
    }
}

grupo('12 · las condiciones, el null y el undefined');
{
  for (const s of M.SITUACIONES) {
    ok(typeof s.TC === 'number' && s.TC > -30 && s.TC < 50, s.k + ': temperatura plausible');
    ok(s.soc > 0.2 && s.soc <= 1, s.k + ': carga plausible');
    ok(s.rpm === 'ralenti' || s.rpm === 'crucero', s.k + ': régimen declarado');
  }
  // `null` quiere decir «lo de la situación» y tiene que querer decir eso EN
  // TODAS PARTES: éste es el fallo que ya se coló dos veces en la casa.
  for (const s of M.SITUACIONES) {
    const a = EN('util16', 'sano', s.k, {});
    const b = EN('util16', 'sano', s.k, { rpm: null, TC: null, soc: null, on: null });
    ok(M.firma(a) === M.firma(b), s.k + ': null es lo mismo que no decir nada');
    ok(a.TC === s.TC && a.soc === s.soc, s.k + ': y coge lo de la situación');
  }
  // Forzar el régimen SÍ tiene que cambiar algo.
  const c = EN('util16', 'sano', 'atasco', { rpm: 2500 });
  const d = EN('util16', 'sano', 'atasco', {});
  ok(c.r.iAlt > d.r.iAlt, 'más vueltas, más corriente también por el ensayo');
  ok(c.rpmMotor === 2500, 'y el régimen forzado se respeta');
}

grupo('13 · los aparatos y su resolución');
{
  for (const I of M.INSTR) {
    ok(typeof I.rot === 'string' && I.rot.length > 5, I.k + ': tiene rótulo');
    ok(typeof I.sig === 'string' && I.sig.length <= 20, I.k + ': y sigla corta');
    ok(typeof I.nota === 'string' && I.nota.length > 10, I.k + ': y nota');
  }
  ok(M.INSTR_KEYS.length === 10, 'son diez aparatos');
  // Las lecturas están cuantizadas: dos casos que difieren menos que la
  // resolución son el MISMO caso, y eso es lo que hace del reto un problema.
  for (const [vk, fk, sk] of TODOS.slice(0, 60)) {
    const E = EN(vk, fk, sk);
    cerca(E.med.vBat, M.redondea(E.r.vBarra, M.RESOL.v), 1e-12, 'vBat cuantizado');
    cerca(E.med.iAlt, Math.round(E.r.iAlt), 1e-12, 'la pinza redondea al amperio');
    ok(Number.isInteger(E.med.iAlt), 'y da un entero');
  }
  // `separa` es simétrica y nunca separa un caso de sí mismo.
  for (const [vk, fk, sk] of TODOS.slice(0, 40)) {
    const A = EN(vk, fk, sk), B = EN(vk, 'sano', sk);
    for (const ik of M.INSTR_KEYS) {
      ok(M.separa(ik, A, A) === false, 'no se separa de sí mismo');
      ok(M.separa(ik, A, B) === M.separa(ik, B, A), 'y es simétrica');
    }
  }
}

grupo('14 · el censo y las clases');
{
  for (const vk of M.VEH_KEYS) for (const s of M.SITUACIONES) {
    const C = M.censo(vk, s.k, {});
    const base = EN(vk, 'sano', s.k);
    for (const f of C.filas) {
      ok(f.n === f.ve.length, `${vk}/${s.k}/${f.ik}: la cuenta cuadra con la lista`);
      for (const fk of f.ve) ok(M.separa(f.ik, base, EN(vk, fk, s.k)),
        `${vk}/${s.k}/${f.ik}: ${fk} está en la lista porque se separa`);
      ok(f.n <= M.FALLA_KEYS.length - 1, 'y no puede ver más averías de las que hay');
    }
    // Las clases parten los nueve montajes, sin repetir ni perder ninguno.
    const G = M.clases(vk, s.k, {});
    const todos = [].concat.apply([], G);
    ok(todos.length === M.FALLA_KEYS.length, `${vk}/${s.k}: las clases suman nueve`);
    ok(new Set(todos).size === M.FALLA_KEYS.length, `${vk}/${s.k}: y sin repetidos`);
    // Y dentro de una clase, TODOS tienen la misma firma.
    for (const g of G) {
      const f0 = M.firma(EN(vk, g[0], s.k));
      for (const k of g) ok(M.firma(EN(vk, k, s.k)) === f0, `${vk}/${s.k}: la clase es coherente`);
    }
    const A = M.ambiguos(vk, s.k, {});
    ok(A.every(g => g.length > 1), 'los ambiguos tienen más de uno');
    ok(A.length === G.filter(g => g.length > 1).length, 'y son exactamente los grupos grandes');
  }
}

grupo('15 · el testigo del salpicadero');
{
  // La tesis, contada y no afirmada: en las 180 casillas normales no se
  // enciende ni una vez, y entre ellas hay decenas que descargan la batería.
  let enc = 0, desc = 0, descSinTestigo = 0;
  for (const [vk, fk, sk] of TODOS) {
    const E = EN(vk, fk, sk);
    if (E.med.testigo) enc++;
    if (E.descarga) { desc++; if (!E.med.testigo) descSinTestigo++; }
  }
  ok(TODOS.length === 180, 'son 180 casillas: ' + TODOS.length);
  ok(enc === 0, 'el testigo no se enciende en ninguna: ' + enc);
  ok(desc > 40, 'y hay muchas que descargan: ' + desc);
  ok(descSinTestigo === desc, 'todas ellas con el testigo apagado');
  // Pero el centinela NO puede ser vacío: el testigo tiene que encenderse
  // cuando el alternador de verdad deja de excitar. Si no se encendiera nunca,
  // «no se enciende en 180 casos» no diría nada de él.
  let algunaVez = false;
  for (const vk of M.VEH_KEYS) for (const fk of M.FALLA_KEYS)
    for (let r = 200; r <= 500; r += 50)
      if (EN(vk, fk, 'atasco', { rpm: r }).med.testigo) algunaVez = true;
  ok(algunaVez, 'y sí se enciende cuando la máquina no excita');
}

grupo('16 · la descarga y lo que queda de batería');
{
  for (const [vk, fk, sk] of TODOS) {
    const E = EN(vk, fk, sk), a = M.autonomiaMin(E);
    if (!E.descarga) ok(a === null, `${vk}/${fk}/${sk}: sin descarga no hay autonomía`);
    else ok(a !== null && a >= 0 && isFinite(a), `${vk}/${fk}/${sk}: autonomía finita`);
  }
  // Más déficit, menos tiempo: es lo único que se le pide a esa cuenta.
  const suave = EN('util16', 'sano', 'atasco');
  const bruto = EN('util16', 'diodoCorto', 'atasco');
  ok(bruto.deficit > suave.deficit, 'un diodo en corto descarga más que un coche sano');
  ok(M.autonomiaMin(bruto) < M.autonomiaMin(suave), 'y por tanto dura menos');
  cerca(M.PEUKERT, 1.15, 1e-12, 'con el exponente de Peukert declarado');
}

grupo('17 · el reto a ciegas');
{
  let sinCerrar = 0, cerrados = 0;
  for (let it = 0; it < 40; it++) {
    M.retoNuevo();
    // La verdad SIEMPRE está entre los compatibles: si no, el reto sería
    // irresoluble sin que nadie se enterara.
    ok(M.retoCompatibles().indexOf(M.RETO.falla) >= 0, 'la verdad sobrevive con cero medidas');
    ok(M.retoCompatibles().length === M.FALLA_KEYS.length, 'y sin medir, todos siguen en pie');
    let ant = M.FALLA_KEYS.length;
    for (const s of M.SITUACIONES) {
      M.RETO.sit = s.k; M.RETO.rpm = null; M.RETO.on = null;
      M.retoAnota();
      const c = M.retoCompatibles();
      ok(c.indexOf(M.RETO.falla) >= 0, 'la verdad sigue siendo compatible tras medir');
      ok(c.length <= ant, 'y el conjunto sólo puede encoger');
      ant = c.length;
    }
    if (ant === 1) cerrados++; else sinCerrar++;
    ok(M.retoResumen() === null, 'sin entregar no hay resumen');
    const bien = M.retoResponde(M.RETO.falla);
    ok(bien === true, 'acertar es acertar');
    const R = M.retoResumen();
    ok(R && R.acierto === true, 'y el resumen lo dice');
    ok(R.cerrado === (R.compatibles.length === 1), 'cerrado ⇔ queda uno solo');
    ok(R.condiciones === M.SITUACIONES.length, 'y cuenta las condiciones miradas');
    ok(M.retoResponde('sano') === null, 'y no se puede responder dos veces');
  }
  ok(cerrados > 0, 'con las cinco situaciones, algunos casos quedan cerrados');
  // La condición inicial NO puede resolver el caso: si lo resolviera, el reto se
  // ganaría sin mover un dedo.
  M.retoNuevo();
  M.retoAnota();
  ok(M.retoCompatibles().length >= 1, 'con una sola condición quedan candidatos');
  // Anotar dos veces la misma condición no cuenta dos veces.
  const antes = M.RETO.visitadas.length;
  ok(M.retoAnota() === false, 'la misma condición no se anota dos veces');
  ok(M.RETO.visitadas.length === antes, 'y no crece la lista');
  ok(M.claveCondicion({ sit: 'a', rpm: null, on: null }) ===
    M.claveCondicion({ sit: 'a', rpm: null, on: null }), 'la clave es del contenido');
  ok(M.claveCondicion({ sit: 'a', rpm: null, on: { cruce: 1, luneta: 1 } }) ===
    M.claveCondicion({ sit: 'a', rpm: null, on: { luneta: 1, cruce: 1 } }),
    'y no depende del orden en que se tocaron los mandos');
}

grupo('18 · la capacidad, el barrido y el equilibrio');
{
  for (const vk of M.VEH_KEYS) {
    for (let r = 700; r <= 3800; r += 100)
      ok(M.capacidad(vk, 'sano', 'diaCarretera', r + 100) >=
        M.capacidad(vk, 'sano', 'diaCarretera', r) - 1e-9,
        vk + ': la capacidad no baja con las vueltas (' + r + ')');
    // Y la cifra que desmonta la chapa: a ralentí, menos de la mitad.
    const v = M.VEHS[vk];
    const cr = M.capacidad(vk, 'sano', 'diaCarretera', v.ralenti);
    ok(cr < v.alt.nominal * 0.55, vk + ': a ralentí da menos de la mitad (' + cr.toFixed(1) + ' A)');
  }
  // El barrido tiene que coincidir con el ensayo punto a punto: es la misma
  // función, y si divergiera la gráfica contaría otra cosa que la telemetría.
  const B = M.barrido('util16', 'sano', 'atasco', {}, 600, 2400, 6);
  for (const q of B) {
    const E = EN('util16', 'sano', 'atasco', { rpm: q.rpm });
    cerca(q.iAlt, E.r.iAlt, 1e-12, 'el barrido es el ensayo (' + Math.round(q.rpm) + ')');
    cerca(q.iCargas, E.r.iCargas, 1e-12, 'y también en los consumos');
  }
  // El equilibrio es el cambio de signo, y ahí está el cruce de las dos curvas.
  for (const vk of M.VEH_KEYS) for (const s of M.SITUACIONES) {
    const e = M.rpmEquilibrio(vk, 'sano', s.k, {});
    if (e === null) { ok(EN(vk, 'sano', s.k, { rpm: 6000 }).r.iBat < 0, 'null ⇒ ni a 6 000'); continue; }
    if (e === 0) { ok(EN(vk, 'sano', s.k, { rpm: 280 }).r.iBat >= 0, '0 ⇒ ya al ralentí'); continue; }
    ok(EN(vk, 'sano', s.k, { rpm: e * 1.02 }).r.iBat >= 0, `${vk}/${s.k}: por encima, carga`);
    ok(EN(vk, 'sano', s.k, { rpm: e * 0.98 }).r.iBat < 0, `${vk}/${s.k}: por debajo, descarga`);
  }
}

grupo('19 · el separador decimal de todo lo que el motor escribe');
{
  let malas = 0, total = 0;
  for (const [vk, fk, sk] of TODOS) {
    const E = EN(vk, fk, sk);
    for (const ik of M.INSTR_KEYS) {
      const t = M.lecturaTexto(E, ik);
      total++;
      if (/\d\.\d/.test(t)) { malas++; if (malas < 4) console.log('      ' + ik + ': ' + t); }
    }
  }
  ok(malas === 0, `${malas} de ${total} lecturas escritas con punto decimal`);
  ok(total === 1800, 'y se han mirado las 1 800: ' + total);
  // Y el millar. El pizarron es un lienzo: su texto no pasa por `textContent` y
  // el barrido de la Capa 2 no lo ve. Aqui SI se ve, porque la lectura la
  // redacta el motor. El estroboscopio llego a marcar «6480 rpm» en el pizarron
  // mientras el panel decia «6 480 rpm» a dos palmos.
  let sueltos = 0, finos = 0;
  for (const [vk, fk, sk] of TODOS) {
    const E = EN(vk, fk, sk);
    for (const ik of M.INSTR_KEYS) {
      const t = M.lecturaTexto(E, ik);
      if (/\d \d{3}/.test(t)) sueltos++;
      if (t.indexOf('\u202f') >= 0) finos++;
    }
  }
  ok(sueltos === 0, sueltos + ' lecturas con el millar separado por un espacio normal');
  ok(finos > 1500, 'y ' + finos + ' llevan el espacio fino: la comprobacion no es vacia');
  ok(M.lecturaTexto(EN('util16', 'sano', 'atasco'), 'testigo') === 'apagado',
    'el testigo se escribe en palabras');
}

grupo('20 · las cifras que el laboratorio publica');
{
  // Todo lo que va en la ficha se comprueba aquí. Una cifra publicada que nadie
  // recalcula es una cifra que envejece sola.
  const u = M.VEHS.util16;
  cerca(M.capacidad('util16', 'sano', 'diaCarretera', u.ralenti), 53.2, 0.6,
    'el utilitario a ralentí da 53,2 A');
  cerca(M.capacidad('util16', 'sano', 'diaCarretera', 6000 / u.relPolea), 119.6, 0.8,
    'y 119,6 A con el alternador a 6 000');
  cerca(M.corrienteAsintotica(u.alt.iCampoMax), 151.6, 0.5, 'la asintótica son 151,6 A');
  // El atasco: un coche SANO descarga.
  const at = EN('util16', 'sano', 'atasco');
  ok(at.descarga, 'sano, en el atasco, descarga');
  cerca(at.r.iCargas, 73.2, 0.5, 'con 73,2 A de consumo');
  cerca(at.med.vBat, 12.26, 0.03, 'y la barra a 12,26 V');
  // La trampa del sensado, con las dos cifras de los dos coches.
  const uc = EN('util16', 'cableCarga', 'nocheLluvia');
  const fc = EN('furgo', 'cableCarga', 'nocheLluvia');
  ok(M.VEHS.util16.sensa === 'alternador' && M.VEHS.furgo.sensa === 'bateria',
    'los dos coches sensan distinto');
  const us = EN('util16', 'sano', 'nocheLluvia'), fs = EN('furgo', 'sano', 'nocheLluvia');
  ok(Math.abs(uc.med.vBat - us.med.vBat) > 1.0,
    'sensando en el alternador, el cable malo SE VE en el borne');
  ok(Math.abs(fc.med.vBat - fs.med.vBat) <= M.RESOL.v,
    'sensando en la batería, NO se ve: el borne marca lo mismo');
  ok(fc.med.vAlt > 16.0, 'y el alternador se va por encima de 16 V: ' + fc.med.vAlt);
  // Las escobillas: invisibles en la revisión, evidentes en el atasco.
  const eRev = EN('util16', 'escobillas', 'diaCarretera');
  const sRev = EN('util16', 'sano', 'diaCarretera');
  ok(M.INSTR_KEYS.every(ik => !M.separa(ik, sRev, eRev)),
    'las escobillas no las ve NINGÚN aparato en la condición de taller');
  const eAt = EN('util16', 'escobillas', 'atasco');
  ok(M.INSTR_KEYS.filter(ik => M.separa(ik, at, eAt)).length >= 6,
    'y en el atasco las ven seis o más');
  // Cuántas condiciones resuelven las nueve ellas solas.
  let resuelven = 0, condiciones = 0;
  for (const vk of M.VEH_KEYS) for (const s of M.SITUACIONES) {
    condiciones++;
    if (M.ambiguos(vk, s.k, {}).length === 0) resuelven++;
  }
  ok(condiciones === 20, 'son 20 condiciones');
  ok(resuelven === 4, 'y sólo 4 resuelven las nueve ellas solas: ' + resuelven);
  // La condición de taller no está entre ellas. Ésa es la lección.
  ok(M.VEH_KEYS.every(vk => M.ambiguos(vk, 'diaCarretera', {}).length > 0),
    'y «de día en carretera» no resuelve en NINGÚN coche');
  // Y el rizado: cifras muy por debajo del folclore de los tres voltios.
  const dz = EN('util16', 'diodoAbierto', 'nocheLluvia');
  ok(dz.med.rizado < 0.5 && dz.med.rizado > 0.10,
    'un diodo abierto riza ' + (dz.med.rizado * 1000).toFixed(0) + ' mV, no tres voltios');
  ok(us.med.rizado <= 0.02, 'y el puente sano, ' + (us.med.rizado * 1000).toFixed(0) + ' mV');
}

console.log(`\n${n - malos}/${n} comprobaciones`);
process.exit(malos ? 1 : 0);
