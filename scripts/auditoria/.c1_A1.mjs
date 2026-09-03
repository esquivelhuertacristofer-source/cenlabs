/**
 * CAPA 1 · d6-A1 · el motor sellado, validado en Node y sin navegador.
 *
 * Recorta del `.body.js` todo lo que va del §1 al §12 —que es física y
 * aritmética pura, sin three.js ni DOM— y lo somete a lo que tiene que cumplir.
 * Lo que aquí falla no es un problema de pintado: es un problema de modelo.
 *
 *   node scripts/auditoria/.c1_A1.mjs
 */
import { readFileSync } from 'node:fs';

const P = 'c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard/' +
  'scripts/lab-src/arranque-caidas-de-tension.body.js';

function cargaMotor() {
  const src = readFileSync(P, 'utf8').replace(/\r\n/g, '\n');
  const i = src.indexOf('//  §1 · LA BATERÍA');
  if (i < 0) throw new Error('no encuentro el §1: ¿ha cambiado el encabezado?');
  // Y se CORTA en el marcador de la interfaz: de ahí para abajo hay three.js y
  // DOM, que en Node no existen. Sin este corte, el troceador se traía la escena
  // entera y reventaba con `THREE is not defined` en cuanto se escribió la
  // primera vista —o sea, en cuanto el lab dejó de ser sólo física.
  const j = src.indexOf('T1 · FORMATOS');
  if (j < 0) throw new Error('no encuentro el marcador T1: ¿ha cambiado el encabezado?');
  // Se empieza en las UTILIDADES, no en el §1: por encima del §1 el cuerpo
  // declara `clamp`, `dec` y `barajaEn`, que usa el motor entero. Cortando en el
  // §1 había que inyectar una copia de `clamp` —que podía divergir del de
  // verdad sin que nadie se enterara— y `dec` ni siquiera existía aquí.
  const u = src.indexOf('// El kit de la escena NO trae');
  if (u < 0 || u > i) throw new Error('no encuentro las utilidades del cuerpo');
  const cuerpo = src.slice(u, src.lastIndexOf('// ====', j));
  const nombres = ['VASOS', 'tensionVaso', 'DVDT_VASO', 'tensionAbierta', 'factorFrio',
    'factorCarga', 'K_ARRHENIUS', 'POLARIZA', 'T_CCA', 'V_CCA', 'riReferencia',
    'resistenciaInterna', 'ccaReal', 'RHO_CU', 'ALFA_CU', 'resistenciaCable', 'TRAMOS',
    'TRAMO_KEYS', 'ARRANQUE', 'RELACION', 'viscosidadRel', 'parCompresion', 'parFriccion',
    'parArrastre', 'resistenciaCircuito', 'corrienteA', 'parEntregado', 'regimenArrastre',
    'VEHS', 'VEH_KEYS', 'ACEITES', 'ACEITE_KEYS', 'FALLAS', 'FALLA_KEYS', 'averia',
    'resistenciasSanas', 'resistencias', 'ESCENARIOS', 'ESC_KEYS', 'LIM_CONEXION',
    'LIM_POSITIVO', 'LIM_MASA', 'EXCESO_CABLE', 'ensayo', 'veredictoCaidas', 'censo',
    'indistinguibles', 'INSTR', 'INSTR_KEYS', 'RESOL', 'cuantiza', 'lecturaInstr',
    'compatibles', 'informacionDe', 'retoResoluble', 'casosResolubles', 'dec'];
  return new Function(cuerpo + '\nreturn {' + nombres.join(',') + '};')();
}

const M = cargaMotor();

let n = 0, malos = 0;
const ok = (c, q) => { n++; if (!c) { malos++; console.log('  ‼️  ' + q); } };
const cerca = (a, b, tol, q) => ok(Math.abs(a - b) <= tol, `${q}: ${a} vs ${b} ±${tol}`);
const grupo = t => console.log('\n' + t);

const P0 = o => Object.assign({ TC: 20, soc: 1.00, aceite: 's5w30', falla: 'sano' }, o || {});
const EN = (v, o) => M.ensayo(v, P0(o));

grupo('1 · la batería en circuito abierto');
{
  for (const soc of [0, 0.25, 0.5, 0.75, 1]) {
    const v = M.tensionVaso(soc);
    ok(v >= 1.95 && v <= 2.10, `vaso al ${soc * 100} %: ${v.toFixed(3)} V`);
  }
  cerca(M.tensionVaso(1) * M.VASOS, 12.60, 1e-9, 'llena, seis vasos dan 12,60 V');
  cerca(M.tensionVaso(0) * M.VASOS, 11.70, 1e-9, 'vacía, 11,70 V');
  // Un vaso en corto se ve SIN arrancar. Es la única avería que se ve así.
  const sana = M.tensionAbierta({ cca: 640, vasosMuertos: 0 }, 1, 25);
  const rota = M.tensionAbierta({ cca: 640, vasosMuertos: 1 }, 1, 25);
  cerca(sana - rota, M.tensionVaso(1), 1e-9, 'un vaso en corto se lleva su vaso entero');
  // Y la temperatura casi no la mueve, que es justo lo que la hace engañosa.
  const fria = M.tensionAbierta({ cca: 640 }, 1, -18);
  ok(Math.abs(sana - fria) < 0.10,
    `de 25 a −18 °C la tensión en reposo sólo cae ${((sana - fria) * 1000).toFixed(0)} mV`);
  ok(fria < sana, 'aunque cae, no sube');
}

grupo('2 · el CCA de la etiqueta es el ancla, y se recupera exacto');
{
  // Ésta es la comprobación que sostiene todo el §1: la resistencia interna NO
  // se inventa, se deduce de la definición de la SAE J537. Si el modelo es
  // consistente, aplicándole a la batería sana el ensayo de la norma tiene que
  // salir EXACTAMENTE el CCA del que se dedujo.
  for (const k of M.VEH_KEYS) {
    const v = M.VEHS[k];
    cerca(M.ccaReal(v.bat, 1), v.bat.cca, 1e-6, `${v.corto}: el CCA se recupera`);
  }
  // Y la definición: a −18 °C, con esa corriente, la tensión cae justo a 7,2 V.
  for (const k of M.VEH_KEYS) {
    const v = M.VEHS[k];
    const E0 = M.tensionAbierta(v.bat, 1, M.T_CCA);
    const Ri = M.resistenciaInterna(v.bat, 1, M.T_CCA) * M.POLARIZA;
    cerca(E0 - Ri * v.bat.cca, M.V_CCA, 1e-6, `${v.corto}: a su CCA se queda en 7,2 V`);
  }
  // Media batería da mucho menos de medio CCA: no es proporcional.
  for (const k of M.VEH_KEYS) {
    const v = M.VEHS[k];
    const mitad = M.ccaReal(v.bat, 0.5) / v.bat.cca;
    ok(mitad > 0.55 && mitad < 0.85,
      `${v.corto}: al 50 % de carga quedan el ${(mitad * 100).toFixed(0)} % del CCA`);
  }
}

grupo('3 · el frío, sin cambios de signo');
{
  // La forma de Arrhenius no puede ser negativa NUNCA. Una recta ajustada al
  // mismo punto se hacía negativa por encima de 68 °C, y eso es resistencia
  // interna negativa: un modelo que se rompe donde nadie mira.
  for (let T = -40; T <= 120; T += 2)
    ok(M.factorFrio(T) > 0, `factorFrio(${T}) sigue siendo positivo`);
  for (let T = -40; T < 120; T += 2)
    ok(M.factorFrio(T) > M.factorFrio(T + 2), `y baja de ${T} a ${T + 2} °C`);
  cerca(M.factorFrio(25), 1, 1e-9, 'a 25 °C vale 1: es la referencia');
  cerca(M.factorFrio(-18), 2.0, 0.02, 'y a −18 °C la resistencia interna se DOBLA');
  ok(M.factorFrio(90) > 0.3, 'con el vano motor a 90 °C sigue siendo un número creíble');
}

grupo('4 · el estado de carga');
{
  for (let s = 0.15; s <= 1.0001; s += 0.05)
    ok(M.factorCarga(s) >= 1 - 1e-12, `factorCarga(${s.toFixed(2)}) nunca baja de 1`);
  for (let s = 0.20; s <= 1.0; s += 0.05)
    ok(M.factorCarga(s - 0.05) > M.factorCarga(s), `descargarse cuesta resistencia (${s.toFixed(2)})`);
  cerca(M.factorCarga(1), 1, 1e-9, 'llena, factor 1');
  ok(M.factorCarga(0) === M.factorCarga(0.15), 'por debajo del 15 % se satura y no se va a infinito');
}

grupo('5 · el cobre');
{
  // Resistividad por longitud y sección, con su coeficiente de temperatura. Y
  // el cobre conduce MEJOR en frío, que es lo contrario de la batería.
  cerca(M.resistenciaCable(1, 1, 20), M.RHO_CU * 1e6, 1e-12, 'un metro de 1 mm² a 20 °C');
  const r1 = M.resistenciaCable(2, 25, 20), r2 = M.resistenciaCable(4, 25, 20);
  cerca(r2, r1 * 2, 1e-12, 'el doble de largo, el doble de resistencia');
  const r3 = M.resistenciaCable(2, 50, 20);
  cerca(r3, r1 / 2, 1e-12, 'el doble de sección, la mitad');
  ok(M.resistenciaCable(2, 25, -18) < r1, 'y en frío el cobre conduce MEJOR que la batería');
  cerca(M.resistenciaCable(2, 25, 20 + 1 / M.ALFA_CU), r1 * 2, 1e-9,
    'el coeficiente de temperatura es el que dice ser');
}

grupo('6 · una conexión y un cable NO se juzgan igual');
{
  const con = M.TRAMOS.filter(t => t.conexion), cab = M.TRAMOS.filter(t => !t.conexion);
  ok(con.length === 3, `${con.length} conexiones`);
  ok(cab.length === 2, `${cab.length} cables`);
  ok(M.TRAMOS.every(t => typeof t.masa === 'boolean'), 'cada tramo dice si es de masa');
  ok(M.TRAMOS.filter(t => t.masa).length === 2, 'la masa son dos tramos');
  ok(!M.TRAMO_KEYS.includes('escobillas'),
    'el inducido NO está en la lista: es la carga, no un tramo');
  // Y la razón por la que hay dos criterios: la furgoneta sana cae por encima
  // del límite de una conexión sin tener nada roto.
  const f = M.VEHS.furgo, u = M.VEHS.util16;
  const rf = EN(f), ru = EN(u);
  ok(rf.caida.cablePos > M.LIM_CONEXION,
    `la furgoneta sana cae ${rf.caida.cablePos.toFixed(2)} V en su cable: más que una conexión`);
  ok(ru.caida.cablePos < M.LIM_CONEXION, 'y el utilitario sano no');
  // Y la razón es la longitud, no una avería: el cable de la furgoneta mide tres
  // metros y medio contra poco más de uno del utilitario, y su resistencia sana
  // es la que sale de esa longitud y esa sección. (La aserción anterior aquí era
  // `x === undefined || true`, que es cierta pase lo que pase y no comprobaba nada.)
  ok(f.largoPos > u.largoPos * 2.5,
    `el cable de la furgoneta mide ${f.largoPos} m contra ${u.largoPos} del utilitario`);
  cerca(M.resistenciasSanas(f, 20).cablePos,
    M.resistenciaCable(f.largoPos, f.seccPos, 20), 1e-12,
    'y su resistencia sana es exactamente la de su longitud y su sección');
  ok(M.veredictoCaidas(rf, M.resistenciasSanas(f, 20)).clase !== 'tramo',
    'y aun así el veredicto NO la marca: a un cable se le exige lo suyo');
}

grupo('7 · el punto de funcionamiento es un CRUCE, no una cifra');
{
  for (const k of M.VEH_KEYS) {
    const v = M.VEHS[k], r = EN(v);
    const ace = M.ACEITES.s5w30;
    const R = M.resistencias(v, 20, M.averia('sano'));
    const Rext = M.resistenciaCircuito(R) + M.ARRANQUE.Ri;
    const da = M.parEntregado(r.E0, r.Ri, Rext, r.rpm);
    const de = M.parArrastre(v, ace, 20, r.rpm);
    cerca(da, de, 0.5, `${v.corto}: en el cruce los dos pares coinciden`);
    // Y es un cruce de verdad: por debajo manda el arranque y por encima el motor.
    ok(M.parEntregado(r.E0, r.Ri, Rext, r.rpm * 0.7) > M.parArrastre(v, ace, 20, r.rpm * 0.7),
      `${v.corto}: por debajo del cruce el arranque puede`);
    ok(M.parEntregado(r.E0, r.Ri, Rext, r.rpm * 1.3) < M.parArrastre(v, ace, 20, r.rpm * 1.3),
      `${v.corto}: y por encima ya no`);
  }
  // La fuerza contraelectromotriz es lo que limita: a régimen cero la corriente
  // es la de rotor bloqueado, y es MUCHO mayor que la de arrastre.
  for (const k of M.VEH_KEYS) {
    const v = M.VEHS[k], r = EN(v);
    const R = M.resistencias(v, 20, M.averia('sano'));
    const Rext = M.resistenciaCircuito(R) + M.ARRANQUE.Ri;
    const bloq = M.corrienteA(r.E0, r.Ri, Rext, 0);
    ok(bloq > r.I * 1.8, `${v.corto}: bloqueado pide ${Math.round(bloq)} A contra ${Math.round(r.I)} girando`);
    ok(bloq > 500 && bloq < 1000, `${v.corto}: y esa corriente es creíble (${Math.round(bloq)} A)`);
  }
}

grupo('8 · el ensayo sano, en las cinco mañanas');
{
  for (const k of M.VEH_KEYS) {
    const v = M.VEHS[k];
    let rpmAnt = Infinity, iAnt = 0;
    for (const E of M.ESCENARIOS.slice().sort((a, b) => b.TC - a.TC)) {
      const r = EN(v, { TC: E.TC, soc: E.soc });
      ok(r.rpm < rpmAnt, `${v.corto} @${E.k}: cuanto más frío, más despacio (${r.rpm.toFixed(0)} rpm)`);
      ok(r.I > iAnt, `${v.corto} @${E.k}: y más corriente (${r.I.toFixed(0)} A)`);
      ok(r.vBat < r.E0, `${v.corto} @${E.k}: con carga la tensión SIEMPRE baja`);
      rpmAnt = r.rpm; iAnt = r.I;
    }
  }
  // El utilitario con la batería llena arranca hasta el último escenario.
  const u = M.VEHS.util16;
  for (const E of M.ESCENARIOS)
    ok(EN(u, { TC: E.TC, soc: E.soc }).arranca, `el utilitario sano arranca en "${E.k}"`);
}

grupo('9 · LA TESIS: en reposo casi todas son la misma');
{
  for (const k of M.VEH_KEYS) {
    const v = M.VEHS[k];
    const I = M.indistinguibles(v, P0());
    ok(I.n === M.FALLA_KEYS.length - 1,
      `${v.corto}: ${I.n} de ${M.FALLA_KEYS.length} dan la misma tensión en reposo`);
    ok(!I.mayor.includes('vasoEnCorto'), `${v.corto}: la única que se ve es el vaso en corto`);
    ok(I.mayor.includes('sano') && I.mayor.includes('bateriaSulfatada')
      && I.mayor.includes('masaFloja'),
      `${v.corto}: un coche sano, una batería gastada y una masa floja marcan lo MISMO`);
  }
}

grupo('10 · cada avería toca lo que tiene que tocar, y sólo eso');
{
  const v = M.VEHS.util16;
  const sano = EN(v);
  for (const f of M.FALLA_KEYS) {
    if (f === 'sano') continue;
    const r = EN(v, { falla: f });
    ok(r.rpm < sano.rpm, `"${f}": el régimen baja (${r.rpm.toFixed(0)} contra ${sano.rpm.toFixed(0)})`);
    // Ninguna avería puede hacer que el coche gire MÁS deprisa.
    ok(r.rpm <= sano.rpm + 1e-9, `"${f}": y desde luego no sube`);
  }
  // Las de resistencia de tramo tocan SU tramo y ninguno más.
  const mapa = { bornSucio: 'bornePos', masaFloja: 'masaChasis',
    contactosQuemados: 'solenoide', solenoideDebil: 'solenoide', cableFino: 'cablePos' };
  for (const f in mapa) {
    const R0 = M.resistencias(v, 20, M.averia('sano'));
    const R1 = M.resistencias(v, 20, M.averia(f));
    for (const t of M.TRAMO_KEYS) {
      if (t === mapa[f]) ok(R1[t] > R0[t] * 1.2, `"${f}" sube la resistencia de ${t}`);
      else cerca(R1[t], R0[t], 1e-12, `"${f}" no toca ${t}`);
    }
  }
  // Y las de la batería y del arranque no tocan NINGÚN tramo.
  for (const f of ['bateriaSulfatada', 'vasoEnCorto', 'escobillas']) {
    const R0 = M.resistencias(v, 20, M.averia('sano'));
    const R1 = M.resistencias(v, 20, M.averia(f));
    for (const t of M.TRAMO_KEYS) cerca(R1[t], R0[t], 1e-12, `"${f}" no toca ${t}`);
  }
}

grupo('11 · la ley de Ohm cierra: nada se pierde por el camino');
{
  for (const k of M.VEH_KEYS) for (const E of M.ESCENARIOS) for (const f of M.FALLA_KEYS) {
    const v = M.VEHS[k], r = EN(v, { TC: E.TC, soc: E.soc, falla: f });
    // La suma de las caídas de los tramos es la caída del circuito.
    let s = 0; for (const t of M.TRAMO_KEYS) s += r.caida[t];
    cerca(s, r.vPos + r.vMasa, 1e-9, `${k}/${E.k}/${f}: positivo + masa = todos los tramos`);
    cerca(s, r.Rcirc * r.I, 1e-9, `${k}/${E.k}/${f}: y eso es R·I`);
    // Y el balance completo: la fem se reparte entre la batería, el circuito y
    // el inducido. Si esto no cierra, el modelo pierde energía en algún sitio.
    cerca(r.E0, r.Ri * r.I + r.Rcirc * r.I + r.caidaInducido + (r.vInducido - r.caidaInducido),
      1e-9, `${k}/${E.k}/${f}: el balance de tensiones cierra`);
    cerca(r.vBat, r.E0 - r.Ri * r.I, 1e-9, `${k}/${E.k}/${f}: la tensión de bornes`);
    cerca(r.vInducido, r.vBat - r.Rcirc * r.I, 1e-9, `${k}/${E.k}/${f}: y lo que llega al inducido`);
    ok(r.vInducido <= r.vBat + 1e-9, `${k}/${E.k}/${f}: al inducido nunca le llega MÁS que a los bornes`);
    ok(r.I >= 0, `${k}/${E.k}/${f}: la corriente no es negativa`);
    ok(r.rpm >= 0, `${k}/${E.k}/${f}: el régimen tampoco`);
  }
}

grupo('12 · los aceites se ordenan, y el frío los separa');
{
  for (const k of M.VEH_KEYS) {
    const v = M.VEHS[k];
    // Templados casi no se distinguen; a −18 °C son otro mundo.
    const t20 = M.ACEITE_KEYS.map(a => EN(v, { TC: 20, aceite: a }).rpm);
    const t18 = M.ACEITE_KEYS.map(a => EN(v, { TC: -18, soc: 1, aceite: a }).rpm);
    const disp = (x) => (Math.max(...x) - Math.min(...x)) / Math.max(...x);
    ok(disp(t20) < disp(t18),
      `${v.corto}: los tres aceites se separan más en frío (${(disp(t20) * 100).toFixed(1)} % contra ${(disp(t18) * 100).toFixed(1)} %)`);
    for (let i = 1; i < t18.length; i++)
      ok(t18[i] < t18[i - 1], `${v.corto}: a −18 °C, más espeso, más despacio`);
  }
  // La escala está referida al 5W-30 a 20 °C, y SÓLO él vale 1 ahí. Exigir que
  // los tres valieran 1 en la referencia —que es lo que decía esta comprobación
  // antes— era exigir que los tres aceites fueran el mismo aceite templado, y
  // eso es justo el error que tapaba: el mando existía y no movía ni una rpm.
  cerca(M.viscosidadRel(M.ACEITES.s5w30, 20), 1, 1e-12, '5W-30: es la referencia de la escala');
  // Y están ordenados A CUALQUIER TEMPERATURA, no sólo en el frío: el segundo
  // número del grado SAE es la viscosidad en caliente, así que dos grados
  // distintos se diferencian siempre.
  for (const TC of [100, 40, 20, 0, -18, -30]) {
    const v = M.ACEITE_KEYS.map(a => M.viscosidadRel(M.ACEITES[a], TC));
    for (let i = 1; i < v.length; i++)
      ok(v[i] > v[i - 1], `${TC} °C: ${M.ACEITE_KEYS[i]} es más espeso que ${M.ACEITE_KEYS[i - 1]} (${v[i].toFixed(3)} > ${v[i - 1].toFixed(3)})`);
  }
  // Y la separación entre el más ligero y el más espeso CRECE al enfriarse.
  const razon = (TC) => M.viscosidadRel(M.ACEITES.s15w40, TC) / M.viscosidadRel(M.ACEITES.s0w20, TC);
  for (const [a, b] of [[100, 20], [20, 0], [0, -18], [-18, -30]])
    ok(razon(b) > razon(a),
      `de ${a} a ${b} °C la distancia entre el 0W-20 y el 15W-40 crece (${razon(a).toFixed(2)} → ${razon(b).toFixed(2)})`);
}

grupo('13 · el censo');
{
  for (const k of M.VEH_KEYS) {
    const v = M.VEHS[k], C = M.censo(v, P0());
    ok(C.total === M.FALLA_KEYS.length * M.ESCENARIOS.length,
      `${v.corto}: ${C.total} casillas`);
    ok(C.filas.length === M.FALLA_KEYS.length, `${v.corto}: una fila por montaje`);
    ok(C.porTramo + C.porBateria + C.ciegas + C.alLimite <= C.total,
      `${v.corto}: las clases no se solapan de más`);
    // Las cinco averías de tramo se delatan SIEMPRE, en las cinco mañanas.
    for (const f of ['bornSucio', 'masaFloja', 'contactosQuemados', 'cableFino', 'solenoideDebil']) {
      const fila = C.filas.find(x => x.falla === f);
      ok(fila.celdas.every(c => c.clase === 'tramo'),
        `${v.corto}/${f}: el procedimiento la señala en las cinco mañanas`);
    }
    // Y un coche sano nunca se marca como avería de tramo ni de batería.
    const s = C.filas.find(x => x.falla === 'sano');
    ok(s.celdas.every(c => c.clase !== 'tramo'), `${v.corto}: un coche sano no marca ningún tramo`);
  }
}

grupo('14 · el punto ciego, contado y no afirmado');
{
  let ciegas = 0, total = 0;
  for (const k of M.VEH_KEYS) {
    const C = M.censo(M.VEHS[k], P0());
    ciegas += C.ciegas; total += C.total;
    // Y el invariante que de verdad importa, que es más fuerte que enumerar
    // averías a mano: una casilla sólo puede salir ciega si la avería NO vive en
    // ningún tramo. Un procedimiento de caídas de tensión únicamente encuentra
    // lo que cae en algún tramo; lo demás sólo lo puede descartar.
    for (const fila of C.filas) for (const c of fila.celdas) if (c.clase === 'ciego') {
      const F = M.FALLAS[fila.falla];
      ok(!F.R && !F.seccion,
        `${k}: la casilla ciega es "${fila.falla}", y no toca ningún tramo`);
    }
  }
  ok(ciegas > 0, `${ciegas} de ${total} casillas son punto ciego del procedimiento`);
  ok(ciegas < total * 0.15, 'pero son pocas: el procedimiento sirve casi siempre');
  // «Al límite» NO es «ciega»: si el montaje está sano no hay nada que encontrar.
  for (const k of M.VEH_KEYS) {
    const C = M.censo(M.VEHS[k], P0());
    for (const fila of C.filas) for (const c of fila.celdas) {
      if (c.clase === 'limite') ok(fila.falla === 'sano', `${k}: «al límite» sólo con el coche sano`);
      if (c.clase === 'ciego') ok(fila.falla !== 'sano', `${k}: «ciega» nunca con el coche sano`);
    }
  }
}

grupo('15 · el reto tiene solución, y no una trivial');
{
  const casos = M.casosResolubles();
  const tot = M.VEH_KEYS.length * M.ESCENARIOS.length * M.ACEITE_KEYS.length * M.FALLA_KEYS.length;
  ok(casos.length > tot * 0.8, `${casos.length} de ${tot} casos tienen una sola respuesta`);
  ok(casos.length < tot, 'y no todos: los del punto ciego no la tienen');
  // Los que no se resuelven son EXACTAMENTE los del punto ciego, y por parejas.
  const sin = [];
  for (const vk of M.VEH_KEYS) for (const E of M.ESCENARIOS) for (const a of M.ACEITE_KEYS)
    for (const f of M.FALLA_KEYS)
      if (!M.retoResoluble(M.VEHS[vk], { TC: E.TC, soc: E.soc, aceite: a }, f))
        sin.push({ vk, e: E.k, a, f });
  // ENUMERAR los montajes que no se resuelven es frágil: la lista cambió en
  // cuanto la furgoneta llevó la sección de cable que le toca. Lo que se exige
  // es el invariante, que es más fuerte: todo caso sin solución pertenece a un
  // grupo de montajes MUTUAMENTE indistinguibles con los seis instrumentos, y
  // la relación es simétrica. Si A no se distingue de B, B tampoco de A, y las
  // dos casillas tienen que estar en la lista.
  const clave = (x) => [x.vk, x.e, x.a].join('|');
  const enLista = new Set(sin.map(x => clave(x) + '|' + x.f));
  for (const x of sin) {
    const v = M.VEHS[x.vk], E = M.ESCENARIOS.find(e => e.k === x.e);
    const P = { TC: E.TC, soc: E.soc, aceite: x.a };
    const r = M.ensayo(v, Object.assign({}, P, { falla: x.f }));
    const med = {};
    for (const k of M.INSTR_KEYS) med[k] = M.lecturaInstr(k, r, v);
    const grupo = M.compatibles(v, P, med);
    ok(grupo.length >= 2, `${clave(x)}/${x.f}: sin solución porque hay ${grupo.length} montajes idénticos`);
    ok(grupo.includes(x.f), `${clave(x)}/${x.f}: el montaje real está entre los compatibles`);
    for (const g of grupo)
      ok(enLista.has(clave(x) + '|' + g),
        `${clave(x)}: «${g}» también está sin solución — la indistinguibilidad es simétrica`);
  }
  // Y el grupo más numeroso es el punto ciego del procedimiento: «todo bien»
  // contra «escobillas gastadas», que es de lo que trata el laboratorio.
  const cuenta = {};
  for (const x of sin) cuenta[x.f] = (cuenta[x.f] || 0) + 1;
  ok((cuenta.sano || 0) > 0 && cuenta.sano === (cuenta.escobillas || 0),
    `«todo bien» y «escobillas gastadas» se confunden en las mismas ${cuenta.sano} casillas`);

  // NINGÚN instrumento resuelve el caso él solo. Si uno lo hiciera, el reto
  // sería una adivinanza con la respuesta escrita en una sola pantalla.
  for (const vk of M.VEH_KEYS) {
    const v = M.VEHS[vk], p = { TC: -7, soc: 0.75, aceite: 's5w30' };
    for (const ins of M.INSTR_KEYS) {
      let resuelve = 0;
      for (const f of M.FALLA_KEYS) {
        const r = M.ensayo(v, Object.assign({}, p, { falla: f }));
        const med = {}; med[ins] = M.lecturaInstr(ins, r, v);
        if (M.compatibles(v, p, med).length === 1) resuelve++;
      }
      ok(resuelve < M.FALLA_KEYS.length,
        `${v.corto}: "${ins}" no resuelve los nueve casos él solo (${resuelve})`);
    }
  }
  // Cada instrumento tiene que servir para algo, pero NO en todas partes. Y esa
  // distinción no es una concesión: la pinza amperimétrica es inútil en siete de
  // las veinte situaciones porque en un punto de funcionamiento templado la
  // fuerza contraelectromotriz se autorregula y las nueve averías caen en el
  // mismo escalón de 25 A. Un instrumento que no distingue nada tampoco miente:
  // sencillamente no es el instrumento de ese día.
  for (const ins of M.INSTR_KEYS) {
    let sirve = 0, sitios = 0;
    for (const vk of M.VEH_KEYS) for (const E of M.ESCENARIOS) {
      const v = M.VEHS[vk], p = { TC: E.TC, soc: E.soc, aceite: 's5w30' };
      sitios++;
      for (const f of M.FALLA_KEYS) {
        const i = M.informacionDe(ins, v, p, {}, f);
        if (i.despues < i.antes) { sirve++; break; }
      }
    }
    ok(sirve >= sitios / 2, `"${ins}" descarta algo en ${sirve} de ${sitios} situaciones`);
  }
  // Y el caso concreto, escrito para que no se pierda: con el utilitario a −7 °C
  // las NUEVE averías dan la misma lectura de pinza.
  {
    const v = M.VEHS.util16, p = { TC: -7, soc: 0.75, aceite: 's5w30' };
    const lects = new Set(M.FALLA_KEYS.map(f =>
      M.lecturaInstr('pinza', M.ensayo(v, Object.assign({}, p, { falla: f })), v)));
    ok(lects.size === 1,
      `a −7 °C la pinza da la misma cifra para las nueve averías (${[...lects][0]})`);
    // Porque la corriente de verdad SÍ cambia, pero por debajo de lo que el
    // aparato resuelve. El modelo no está plano: el aparato no llega.
    const crudas = new Set(M.FALLA_KEYS.map(f =>
      M.ensayo(v, Object.assign({}, p, { falla: f })).I.toFixed(3)));
    ok(crudas.size === M.FALLA_KEYS.length,
      'y sin embargo las nueve corrientes son distintas: es la resolución, no el modelo');
  }
}

grupo('16 · la resolución de los aparatos');
{
  // Las lecturas se publican con la resolución del aparato, no con la del
  // modelo. Sin eso, la pinza sola identificaba las nueve averías.
  for (const k in M.RESOL) ok(M.RESOL[k] > 0, `"${k}" tiene una resolución declarada`);
  ok(M.INSTR_KEYS.every(k => M.RESOL[k] !== undefined), 'todos los instrumentos la tienen');
  cerca(M.cuantiza(12.537, 0.05), 12.55, 1e-9, 'cuantiza al escalón más cercano');
  cerca(M.cuantiza(233, 25), 225, 1e-9, 'y con la pinza, a 25 A');
  ok(M.cuantiza(0, 25) === 0, 'el cero se queda en cero');
  // Y toda lectura es una cadena, no un número: es lo que se ve en pantalla.
  const r = EN(M.VEHS.util16);
  for (const k of M.INSTR_KEYS) {
    const l = M.lecturaInstr(k, r, M.VEHS.util16);
    ok(typeof l === 'string' && l.length > 3, `"${k}" da una lectura legible: ${l}`);
  }
}

grupo('17 · lo que ninguna cifra puede ser');
{
  for (const k of M.VEH_KEYS) for (const E of M.ESCENARIOS) for (const a of M.ACEITE_KEYS)
    for (const f of M.FALLA_KEYS) {
      const v = M.VEHS[k];
      const r = M.ensayo(v, { TC: E.TC, soc: E.soc, aceite: a, falla: f });
      for (const [nom, x] of Object.entries({ E0: r.E0, Ri: r.Ri, I: r.I, rpm: r.rpm,
        vBat: r.vBat, vPos: r.vPos, vMasa: r.vMasa, cca: r.cca }))
        ok(isFinite(x) && !isNaN(x), `${k}/${E.k}/${a}/${f}: ${nom} es un número`);
      ok(r.E0 > 8 && r.E0 < 13.2, `${k}/${E.k}/${a}/${f}: la fem es de una batería de 12 V`);
      ok(r.Ri > 0, `${k}/${E.k}/${a}/${f}: la resistencia interna es positiva`);
      ok(r.I < 1000, `${k}/${E.k}/${a}/${f}: la corriente no se dispara (${r.I.toFixed(0)} A)`);
      ok(r.rpm < 400, `${k}/${E.k}/${a}/${f}: ni el régimen (${r.rpm.toFixed(0)} rpm)`);
      ok(typeof r.arranca === 'boolean', `${k}/${E.k}/${a}/${f}: «arranca» es sí o no`);
      ok(Array.isArray(r.avisos), `${k}/${E.k}/${a}/${f}: los avisos son una lista`);
    }
}

grupo('18 · el separador decimal es la coma, no el punto');
{
  // Los avisos y las lecturas son las dos únicas cadenas que el motor sellado
  // redacta para que las lea una persona, y las dos acaban en pantalla al lado
  // de cifras formateadas con coma. Salían con punto —«0.44 V»— y no había nada
  // que lo impidiera: es el mismo error de locale que costó el d4-05.
  const PUNTO = /\d\.\d/;
  for (const k of M.VEH_KEYS) for (const E of M.ESCENARIOS) for (const a of M.ACEITE_KEYS)
    for (const f of M.FALLA_KEYS) {
      const v = M.VEHS[k], P = { TC: E.TC, soc: E.soc, aceite: a };
      const r = M.ensayo(v, Object.assign({}, P, { falla: f }));
      for (const av of r.avisos)
        ok(!PUNTO.test(av), `${k}/${E.k}/${a}/${f}: el aviso va con coma — «${av}»`);
      for (const ins of M.INSTR_KEYS) {
        const l = M.lecturaInstr(ins, r, v);
        ok(!PUNTO.test(l), `${k}/${E.k}/${a}/${f}: "${ins}" va con coma — «${l}»`);
      }
    }
  // Y `dec` hace lo que dice, incluido el redondeo.
  ok(M.dec(0.2, 2) === '0,20', 'dec rellena los decimales que faltan');
  ok(M.dec(12.594, 1) === '12,6', 'dec redondea');
  ok(M.dec(-0.5, 1) === '-0,5', 'y respeta el signo');
}

console.log(`\n${n - malos}/${n} comprobaciones`);
process.exit(malos ? 1 : 0);
