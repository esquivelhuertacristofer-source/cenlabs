const mount=document.getElementById('stage');
// Estas cifras sólo valen para el primer fotograma: en cuanto la escena arranca
// el encuadre se CALCULA con camConjunto(), porque depende del largo de la línea
// de escape y de la forma de la ventana y no puede estar escrito a mano.
const S=createStage(mount,{cam:[2.4,3.2,5.0],target:[-1.3,1.7,-0.9],
  bgTop:'#0f1a20',bgBot:'#05070b',bloom:0.22,minD:2.4,maxD:38});
const {scene}=S;
const synth=makeSynth({type:'sawtooth',type2:'sine',filterFreq:1020,Q:0.80});
// `clamp` NO se declara aquí: lo declara el motor sellado que se empalma justo
// debajo, y declararlo dos veces es un SyntaxError que mata la página entera
// antes de que exista window.__labDebug.
const el=id=>document.getElementById(id);
const TINTA='#e8eef6', CIAN='#5ad1e6', OK_HEX='#7cd992', WARN_HEX='#e9c46a',
      BAD_HEX='#ff6b6b', GRIS='#7b8697', VIO='#b48ce0', NARANJA='#f0a05a',
      AZUL='#6ea8fe', ROSA='#f28dbb';

// ============================================================================
//  d6-11 · EFICIENCIA DEL CATALIZADOR Y SONDAS DE OXÍGENO — MOTOR SELLADO
//
//  QUÉ SE MIDE
//  Un catalizador de tres vías con dos sondas de oxígeno, la anterior y la
//  posterior, y TRES instrumentos que dicen cada uno lo suyo sobre la misma
//  lata: el monitor del ordenador de a bordo (que acaba en P0420 o en nada), la
//  prueba intrusiva de almacenamiento (que da un tiempo en segundos) y el
//  analizador de gases de cola (que da el veredicto de la NOM-041).
//
//  LA TESIS
//  El monitor NO mide lo que la ley mide. La ley mide hidrocarburos por el tubo
//  de escape; el monitor mide cuánto oxígeno guarda el cerio del recubrimiento.
//  Son dos magnitudes distintas que envejecen juntas —de esa correlación vive el
//  monitor— y el laboratorio existe para enseñar las celdas donde la correlación
//  se rompe, en las dos direcciones.
//
//  EL MODELO DE INGENIERÍA
//  Se integra el ciclo límite del lazo cerrado paso a paso, no se escribe su
//  resultado. El ordenador rampa la mezcla, la sonda anterior la ve con retardo
//  de transporte y con su propia constante de tiempo, el ordenador invierte la
//  rampa al cruzar 0,45 V, y de ahí salen solos el periodo y la amplitud. El
//  almacén de oxígeno es un integrador con rodilla de ruptura: mientras no está
//  lleno se traga el vaivén y la sonda posterior no ve nada; cuando se satura,
//  el oxígeno pasa. La razón de índices, el periodo, la amplitud, el tiempo de
//  ruptura y las tres eficacias de conversión SALEN de esa integración.
//
//  LA TRAMPA
//  El umbral del monitor no es una constante física: es un número CALIBRADO
//  para que salte donde el HC de cola llega a 1,5 veces el límite de la norma,
//  que es lo que la reglamentación de diagnóstico a bordo exige. De ahí salen
//  las dos consecuencias que este laboratorio enseña sin decirlas:
//   · entre 1,0 y 1,5 veces el límite el coche REPRUEBA la verificación con el
//     testigo apagado, y eso no es una avería: es el diseño;
//   · cualquier avería que mueva una de las dos curvas sin mover la otra rompe
//     la calibración, y hay averías que mueven cada una.
//  De 45 celdas (9 averías × 5 edades) el ordenador se equivoca en 20.
//
//  FUENTES
//  · NOM-041-SEMARNAT-2015 — TABLA 1 (dinámico) y TABLA 2 (estático); los
//    límites y los cortes de año se transcriben del laboratorio d6-10, que los
//    contrastó línea por línea.
//  · NOM-047-SEMARNAT-2014 — puntos de prueba del método estático y dinámico.
//  · NOM-167-SEMARNAT-2017 — verificación por sistema de diagnóstico a bordo
//    para modelos 2006 y posteriores: monitores completos y ausencia de códigos
//    de emisiones, en lugar de medir gases. Es la norma que hace que este
//    monitor SEA el examen.
//  · SAE J1979 / ISO 15031-5 — modo $01 PID $01 (estado de monitores) y modo
//    $06 (resultados de las pruebas no continuas del monitor del catalizador).
//  · SAE J2012 / ISO 15031-6 — P0420 y P0430 (eficiencia por debajo del umbral,
//    bancos 1 y 2); P2270/P2271 (señal de la sonda posterior clavada).
//
//  LO QUE NO MODELA, y se declara
//  · La química del catalizador es una VENTANA de eficacia contra λ y una curva
//    de encendido contra temperatura, no un mecanismo de reacción. No hay
//    difusión en el poro, ni cinética de Langmuir-Hinshelwood, ni frente de
//    reacción viajando por el monolito.
//  · El almacén de oxígeno es un solo depósito con una rodilla de exponente 6.
//    Un catalizador real tiene cerio de varias clases con velocidades distintas,
//    y el frente de saturación avanza a lo largo de la lata.
//  · Los gases de motor (CO, HC y NOx a la entrada) son fijos por arquetipo. En
//    lazo cerrado y a λ ≈ 1 eso es defendible —lo que cambia es el catalizador—,
//    pero no vale fuera de esa hipótesis. Para ver los gases de motor moverse
//    con la mezcla está el laboratorio d6-10, que sí resuelve el balance de
//    átomos de la cámara.
//  · La corrección por humedad de los NOx y el reparto del HC entre especies:
//    igual que en d6-10, el HC es un solo número en base hexano.
//  · La temperatura del catalizador es un dato del punto de trabajo, no sale de
//    un balance térmico de la lata.
//  · No hay filtro de partículas ni catalizador de almacenamiento de NOx: esto
//    es un tres vías de gasolina estequiométrica.
// ============================================================================

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ============================================================================
// 1 · EL GASTO DE GASES
// ============================================================================
// Todo lo demás cuelga de aquí: cuánto oxígeno le llega al almacén por segundo
// es lo que decide si el almacén aguanta el vaivén o se satura.
const RHO_AIRE = 1.184;    // g/L de aire a 25 °C y 101,3 kPa
const RHO_ESC = 0.50;      // g/L de gas de escape a ~700 K
const ETA_VOL = 0.85;      // rendimiento volumétrico, constante
const Y_O2 = 0.232;        // fracción MÁSICA de oxígeno en el aire seco

// La carga entra dos veces y no es un error: es la presión del colector, que
// baja la densidad de lo que entra al cilindro. Un motor estrangulado no traga
// menos aire sólo por girar despacio.
function flujoAire(e, rpm, carga) {
  return e.cilindrada * (rpm / 120) * ETA_VOL * RHO_AIRE * carga;
}

// ============================================================================
// 2 · EL RETARDO DEL LAZO CERRADO
// ============================================================================
// El ciclo límite no lo pone una frecuencia escrita a mano: lo pone el tiempo
// que tarda una decisión del ordenador en llegar a la sonda. Dos sumandos: los
// ciclos del motor entre inyección y escape, y el viaje del gas por el colector.
const V_ESC_PRE = 1.05;         // L de colector hasta la sonda, para 1,6 L
const CICLOS_RETARDO = 1.4;
function retardoLazo(e, rpm, carga) {
  const m = Math.max(0.4, flujoAire(e, rpm, carga));
  return CICLOS_RETARDO * (120 / rpm) + (V_ESC_PRE * e.cilindrada / 1.6) * RHO_ESC / m;
}
const TAU_SONDA = 0.09;         // s de la sonda nueva
// La ganancia del integrador sube con las vueltas: un motor rápido tiene menos
// retardo, y con la misma ganancia la oscilación se haría inútilmente pequeña.
const G_INT_REF = 0.10, RPM_REF = 2500;
function gananciaInt(rpm) { return G_INT_REF * Math.sqrt(clamp(rpm, 400, 6500) / RPM_REF); }

// ============================================================================
// 3 · LA SONDA DE CIRCONIO
// ============================================================================
// Una celda de Nernst de banda estrecha: casi un escalón. Fuera de ±0,5 % de λ
// no informa de nada, y por eso NO se puede usar para medir una mezcla: sólo
// para saber de qué lado del estequiométrico se está.
const V_RICA = 0.84, V_POBRE = 0.06, V_UMBRAL = 0.45, W_NERNST = 0.0022;
function nernst(lam) {
  return V_POBRE + (V_RICA - V_POBRE) / (1 + Math.exp((lam - 1) / W_NERNST));
}
// El gas que SALE del catalizador viene equilibrado: el desplazamiento del gas
// de agua deja hidrógeno, y el circonio es hipersensible al hidrógeno porque
// difunde más deprisa que el resto hasta el electrodo. Por eso una sonda
// posterior sana vive ARRIBA, sobre 0,6-0,8 V, y quieta. No es un defecto de la
// sonda: es la firma de que el catalizador está trabajando.
const SESGO_H2 = 0.0048;

// ============================================================================
// 4 · EL ALMACÉN DE OXÍGENO
// ============================================================================
// El cerio del recubrimiento guarda oxígeno cuando la mezcla va pobre
// (Ce₂O₃ + ½O₂ → 2CeO₂) y lo suelta cuando va rica. Ése es el amortiguador que
// aplana la señal de atrás, y es lo único que el monitor sabe medir.
//
// La capacidad se ancla en la prueba que se hace de verdad: se fuerza pobre y se
// cronometra hasta que la sonda posterior cae. Un catalizador nuevo en marcha
// mínima da entre 2 y 8 s; con 0,095 g de O₂ por litro de cilindrada este modelo
// da 3,5 s, dentro de esa horquilla.
const OSC_POR_LITRO = 0.095;
// La rodilla. Con exponente 6 el almacén no deja pasar casi nada hasta el 80 %
// de lleno y después rompe deprisa, que es la forma que tienen las trazas
// reales. Con exponente 1 el almacén sería un filtro de primer orden y la sonda
// posterior de un catalizador sano nunca estaría plana.
const P_RUPTURA = 6;

// ============================================================================
// 5 · LA CONVERSIÓN
// ============================================================================
// La ventana es la misma que la del laboratorio d6-10, a propósito: es el mismo
// catalizador visto desde el otro lado, y dos ventanas distintas para la misma
// lata serían dos físicas distintas en la misma plataforma.
const LAM_OX = 0.985, LAM_RED = 1.020, W_CAT = 0.005;
const ETA_OX = 0.985, ETA_RED = 0.975;
// Encendido: temperaturas de media conversión, catalizador nuevo. El CO enciende
// antes que el HC y el NOx va el último. Un catalizador frío no convierte, por
// sano que esté, y eso NO lo ve ningún monitor de eficiencia.
const T50_CO = 503, T50_HC = 543, T50_NOX = 553, W_T = 26;
function fT(T, t50) { return 1 / (1 + Math.exp(-(T - t50) / W_T)); }
function etaOx(lam) { return ETA_OX / (1 + Math.exp(-(lam - LAM_OX) / W_CAT)); }
function etaRed(lam) { return ETA_RED / (1 + Math.exp((lam - LAM_RED) / W_CAT)); }

// ============================================================================
// 6 · EL ENVEJECIMIENTO
// ============================================================================
// UN solo mando mueve las cuatro saludes, porque en una lata real caen juntas.
// El cerio sinteriza antes que el platino: por eso el almacén se va mucho antes
// que la conversión, y de esa diferencia —de que el almacén avise ANTES— vive
// todo el monitor. Los tres exponentes son la forma de esa carrera.
function envejece(a) {
  a = clamp(a, 0, 1);
  return {
    ceria: Math.pow(1 - a, 3.5),
    saludOx: 1 - 0.75 * Math.pow(a, 1.6),
    saludRed: 1 - 0.88 * Math.pow(a, 1.4),
    dT50: 105 * Math.pow(a, 1.3),
  };
}

// ============================================================================
// 7 · LA INTEGRACIÓN DEL CICLO LÍMITE
// ============================================================================
// El corazón. Nada de lo que sale de aquí está escrito en ningún sitio: el
// periodo, la amplitud, la razón de índices y las tres eficacias se obtienen
// integrando. Los primeros 8 s se tiran: el almacén arranca a medias y hay que
// dejarlo llegar a su régimen antes de medir nada.
const DT = 0.004, T_SIM = 26, T_ASIENTA = 8;
// Mientras el monitor corre, el ordenador ENSANCHA la oscilación a propósito:
// con la de trabajo la ruptura no se distingue del ruido. El precio es que el
// coche contamina algo más justo mientras se comprueba, y por eso el monitor
// corre una vez por viaje y no todo el rato.
const FORZADO = 2.6;

function simula(e, P, F = {}) {
  const rpm = P.rpm, carga = P.carga;
  const mAire = flujoAire(e, rpm, carga);
  const tauPre = TAU_SONDA + (F.tauPre || 0);
  const tauPost = TAU_SONDA + (F.tauPost || 0);
  const ret = retardoLazo(e, rpm, carga);
  const tau = ret + tauPre;
  const g = gananciaInt(rpm) * (F.forzado || 1);
  const C = Math.max(1e-5, OSC_POR_LITRO * e.cilindrada * (F.ceria === undefined ? 1 : F.ceria));
  const T = e.tCat + (F.dTcat || 0);
  const so = F.saludOx === undefined ? 1 : F.saludOx;
  const sr = F.saludRed === undefined ? 1 : F.saludRed;
  const dT50 = F.dT50 || 0;
  const vPreOff = F.vPreOff || 0;
  const fuga = F.fugaAire || 0;

  const nRet = Math.max(1, Math.round(ret / DT));
  const buf = new Float64Array(nRet).fill(1);
  let ib = 0, lamCmd = 1, signo = 1;
  let vPre = nernst(1), vPost = nernst(1), th = 0.5;
  let swPre = 0, swPost = 0;
  let prevPre = vPre + vPreOff > V_UMBRAL, prevPost = vPost > V_UMBRAL;
  let sCO = 0, sHC = 0, sNOx = 0, n = 0, sumLam = 0;
  let mnPost = 9, mxPost = -9, mnPre = 9, mxPre = -9, sumVPost = 0;
  let sTh = 0, mnTh = 9, mxTh = -9;
  const serPre = [], serPost = [], pts = [];

  const nPasos = Math.round(T_SIM / DT);
  for (let k = 0; k < nPasos; k++) {
    const t = k * DT, vivo = t > T_ASIENTA;
    lamCmd = clamp(lamCmd + signo * g * DT, 0.86, 1.14);
    buf[ib] = lamCmd; ib = (ib + 1) % nRet;
    const lamPre = buf[ib];                       // lo que llega a la sonda AHORA

    const vPreReal = nernst(lamPre);
    vPre += (vPreReal - vPre) * (1 - Math.exp(-DT / tauPre));
    // Lo que el ordenador LEE, que no tiene por qué ser lo que la sonda vive.
    const vPreLeido = vPre + vPreOff;
    const arribaPre = vPreLeido > V_UMBRAL;
    if (vivo && arribaPre !== prevPre) swPre++;
    prevPre = arribaPre;
    signo = arribaPre ? +1 : -1;                  // la ve rica → manda empobrecer

    // El almacén, y lo que se le escapa.
    const dev = lamPre - 1;
    let lamInt;
    if (dev > 0) {
      const q = Y_O2 * mAire * dev, f = Math.pow(th, P_RUPTURA);
      th = clamp(th + q * (1 - f) * DT / C, 0, 1);
      lamInt = 1 + dev * f;
    } else {
      const d = Y_O2 * mAire * (-dev), f = Math.pow(1 - th, P_RUPTURA);
      th = clamp(th - d * (1 - f) * DT / C, 0, 1);
      lamInt = 1 + dev * f;
    }
    // Lo que la sonda posterior VE. El hidrógeno sólo llega hasta ella si NO hay
    // oxígeno libre allí: en cuanto el almacén se satura y el oxígeno rompe, el
    // propio catalizador se lo quema y el sesgo se cae. Por eso la señal de
    // atrás no baja poco a poco: se desploma.
    const act = clamp(etaOx(lamInt) * fT(T, T50_CO + dT50) * so, 0, 1);
    const gH2 = 1 / (1 + Math.exp((lamInt - 1) / (2 * W_NERNST)));
    const lamVisto = lamInt - SESGO_H2 * act * gH2 + fuga;

    vPost += (nernst(lamVisto) - vPost) * (1 - Math.exp(-DT / tauPost));
    const arribaPost = vPost > V_UMBRAL;
    if (vivo && arribaPost !== prevPost) swPost++;
    prevPost = arribaPost;

    if (vivo) {
      // La eficacia se evalúa con el λ INTERNO, no con el de entrada: el almacén
      // es lo que mantiene al catalizador dentro de su ventana mientras la
      // mezcla oscila fuera de ella. Ésta es la razón de que un motor oscile a
      // propósito en vez de quedarse quieto en λ = 1.
      sCO += etaOx(lamInt) * fT(T, T50_CO + dT50) * so;
      sHC += etaOx(lamInt) * fT(T, T50_HC + dT50) * so;
      sNOx += etaRed(lamInt) * fT(T, T50_NOX + dT50) * sr;
      n++;
      mnPost = Math.min(mnPost, vPost); mxPost = Math.max(mxPost, vPost);
      mnPre = Math.min(mnPre, vPre); mxPre = Math.max(mxPre, vPre);
      sumVPost += vPost; sumLam += lamPre;
      serPre.push(vPre); serPost.push(vPost);
      sTh += th; mnTh = Math.min(mnTh, th); mxTh = Math.max(mxTh, th);
      if (k % 10 === 0) pts.push({ t: t - T_ASIENTA, lamPre, lamInt, lamVisto,
        vPre: vPreLeido, vPost, th });
    }
  }
  const dur = T_SIM - T_ASIENTA;
  // El índice de actividad se mide contra la media de CADA señal, no contra el
  // umbral. Una sonda posterior sana vive en 0,63 V y quieta: medirla contra
  // 0,45 le atribuiría una actividad que no tiene, y el índice de un catalizador
  // nuevo saldría 0,57 en vez de 0,04.
  const med = a => a.reduce((x, y) => x + y, 0) / a.length;
  const desv = a => { const m = med(a); return med(a.map(x => Math.abs(x - m))); };
  const iPre = desv(serPre), iPost = desv(serPost);
  return {
    mAire, tau, ret, g, C, ampLam: g * tau, periodo: 4 * tau,
    nSwPre: swPre, nSwPost: swPost,
    razon: swPre > 0 ? swPost / swPre : 0,
    indice: iPre > 1e-6 ? iPost / iPre : 0,
    actPre: iPre, actPost: iPost,
    fPre: swPre / 2 / dur,
    ampPre: mxPre - mnPre, ampPost: mxPost - mnPost,
    vPostMed: sumVPost / n, vPostMin: mnPost, vPostMax: mxPost,
    lamMed: sumLam / n,
    thMed: sTh / n, thMin: mnTh, thMax: mxTh, dTh: mxTh - mnTh,
    etaCO: sCO / n, etaHC: sHC / n, etaNOx: sNOx / n,
    pts,
  };
}

// ============================================================================
// 8 · LA PRUEBA INTRUSIVA DE ALMACENAMIENTO
// ============================================================================
// La única de las tres que mide directamente lo que las otras infieren: se
// vacía el almacén, se fuerza pobre y se cronometra hasta que la sonda posterior
// cae por debajo de 0,45 V. El resultado es un tiempo, y ese tiempo es
// proporcional a la capacidad dividida por el caudal de oxígeno sobrante — por
// eso el mismo catalizador da cuatro veces más segundos en marcha mínima que en
// crucero, y por eso la prueba se hace en marcha mínima.
const LAM_INTRUSIVO = 1.05, T_INTRUSIVO_MAX = 20;
function pruebaOSC(e, P, F = {}) {
  const mAire = flujoAire(e, P.rpm, P.carga);
  const C = Math.max(1e-5, OSC_POR_LITRO * e.cilindrada * (F.ceria === undefined ? 1 : F.ceria));
  const tauPost = TAU_SONDA + (F.tauPost || 0);
  const T = e.tCat + (F.dTcat || 0), so = F.saludOx === undefined ? 1 : F.saludOx;
  const dT50 = F.dT50 || 0, fuga = F.fugaAire || 0;
  const dev = LAM_INTRUSIVO - 1, q = Y_O2 * mAire * dev;
  let th = 0, vPost = nernst(1 - SESGO_H2), t = 0;
  const pts = [];
  while (t < T_INTRUSIVO_MAX) {
    const f = Math.pow(th, P_RUPTURA);
    th = clamp(th + q * (1 - f) * DT / C, 0, 1);
    const lamInt = 1 + dev * f;
    const act = clamp(etaOx(lamInt) * fT(T, T50_CO + dT50) * so, 0, 1);
    const gH2 = 1 / (1 + Math.exp((lamInt - 1) / (2 * W_NERNST)));
    vPost += (nernst(lamInt - SESGO_H2 * act * gH2 + fuga) - vPost) * (1 - Math.exp(-DT / tauPost));
    t += DT;
    if (Math.round(t / DT) % 25 === 0) pts.push({ t, th, vPost });
    if (vPost < V_UMBRAL) return { t, roto: true, C, q, pts };
  }
  return { t: T_INTRUSIVO_MAX, roto: false, C, q, pts };
}

// ============================================================================
// 9 · EL DICTAMEN DEL ORDENADOR DE A BORDO
// ============================================================================
// El umbral NO es una constante física. Es el número que hace que el monitor
// salte donde el HC de cola llega a 1,5 veces el límite de la NOM-041, que es lo
// que exige la reglamentación de diagnóstico a bordo. Está calibrado contra la
// ley, y por eso cualquier avería que mueva una de las dos curvas sin mover la
// otra rompe la calibración.
const INDICE_UMBRAL = 0.32;
const RAZON_UMBRAL = 0.20;
// Antes que el de eficiencia corre el de RACIONALIDAD: una sonda posterior
// clavada en un lado no informa de nada, y acusar de catalizador a una sonda
// muda sería mandar a cambiar la pieza cara. Tres desenlaces, no dos.
const V_PIN_POBRE = 0.25, V_PIN_RICA = 0.80;
const DTC_ROT = {
  P0420: 'P0420 · eficiencia del catalizador por debajo del umbral (banco 1)',
  P0430: 'P0430 · eficiencia del catalizador por debajo del umbral (banco 2)',
  P2270: 'P2270 · señal de la sonda posterior clavada en pobre (banco 1)',
  P2271: 'P2271 · señal de la sonda posterior clavada en rica (banco 1)',
};

// ============================================================================
// 10 · LOS GASES DE MOTOR Y LA COLA
// ============================================================================
// Los gases de ENTRADA son fijos por arquetipo: en lazo cerrado y a λ ≈ 1 lo que
// cambia de un caso a otro es el catalizador, no la cámara. Fuera de esa
// hipótesis esto no vale, y para verla caer está d6-10.
function cola(e, r) {
  return {
    CO: e.CO0 * (1 - r.etaCO),
    HC: e.HC0 * (1 - r.etaHC),
    NOx: e.NOx0 * (1 - r.etaNOx),
  };
}
const DIL_MIN = 13, DIL_MAX = 16.5;
const TABLA1 = [   // NOM-041 num. 4.2.1, método dinámico
  { hasta: 1990, rot: '1990 y anteriores', HC: 350, CO: 2.5, O2: 2.0, NOx: 2500 },
  { hasta: Infinity, rot: '1991 y posteriores', HC: 100, CO: 1.0, O2: 2.0, NOx: 1500 },
];
const TABLA2 = [   // NOM-041 num. 4.2.2, método estático
  { hasta: 1993, rot: '1993 y anteriores', HC: 400, CO: 3.0, O2: 2.0, NOx: null },
  { hasta: Infinity, rot: '1994 y posteriores', HC: 100, CO: 1.0, O2: 2.0, NOx: null },
];
function limites(metodo, anio) {
  const T = metodo === 'dinamico' ? TABLA1 : TABLA2;
  const f = T.find(r => anio <= r.hasta) || T[T.length - 1];
  return { ...f, tabla: metodo === 'dinamico' ? 'TABLA 1' : 'TABLA 2' };
}
function juzgaCola(e, c, metodo) {
  const L = limites(metodo, e.anio), m = [];
  if (c.HC > L.HC) m.push('HC');
  if (c.CO > L.CO) m.push('CO');
  if (L.NOx !== null && c.NOx > L.NOx) m.push('NOx');
  return m;
}

// ============================================================================
// 11 · LOS VEHÍCULOS
// ============================================================================
// El de 1992 está aquí por una razón: NO tiene sonda posterior, así que no tiene
// monitor y físicamente no puede encender un P0420. Es el testigo que prueba la
// tesis — para ese coche el único instrumento disponible es el tubo de escape.
const ARQ = {
  mpi16: {
    key: 'mpi16', corto: 'MPI 1.6', nombre: 'Compacto 1.6 L de inyección multipunto, 2012',
    cilindrada: 1.6, anio: 2012, tCat: 780, bancos: 1, sdb: true, sondaPost: true,
    CO0: 0.80, HC0: 750, NOx0: 1800,
    rpm: 2500, carga: 0.35, ralenti: 750, cargaRal: 0.22,
  },
  v6_35: {
    key: 'v6_35', corto: 'V6 3.5', nombre: 'Camioneta V6 3.5 L de dos bancos, 2008',
    cilindrada: 3.5, anio: 2008, tCat: 800, bancos: 2, sdb: true, sondaPost: true,
    CO0: 0.95, HC0: 820, NOx0: 2100,
    rpm: 2400, carga: 0.38, ralenti: 700, cargaRal: 0.24,
  },
  gdi20: {
    key: 'gdi20', corto: 'GDI 2.0', nombre: 'Sedán 2.0 L de inyección directa, 2019',
    cilindrada: 2.0, anio: 2019, tCat: 830, bancos: 1, sdb: true, sondaPost: true,
    CO0: 0.62, HC0: 640, NOx0: 2400,
    rpm: 2600, carga: 0.32, ralenti: 720, cargaRal: 0.20,
  },
  tbi92: {
    key: 'tbi92', corto: 'TBI 1.8', nombre: 'Sedán 1.8 L de cuerpo de aceleración, 1992',
    cilindrada: 1.8, anio: 1992, tCat: 700, bancos: 1, sdb: false, sondaPost: false,
    CO0: 1.35, HC0: 1150, NOx0: 1500,
    rpm: 2500, carga: 0.35, ralenti: 850, cargaRal: 0.26,
  },
};
const ARQ_KEYS = Object.keys(ARQ);

// ============================================================================
// 12 · LAS AVERÍAS
// ============================================================================
// Ninguna de estas nueve es «el catalizador está malo»: eso lo pone el mando de
// la edad, que es independiente. Estas son las cosas que se meten ENTRE el
// catalizador y el juicio que se hace sobre él.
const FALLAS = {
  sano: { rot: 'nada más que la edad', corto: 'sólo la edad', f: {},
    pista: 'Lo que se vea aquí es únicamente lo que la edad del catalizador hace.' },
  preLenta: { rot: 'sonda ANTERIOR lenta', corto: 'anterior lenta', f: { tauPre: 0.46 },
    pista: 'Mira el PERIODO de la señal de delante. Una sonda lenta alarga el ciclo, y un ciclo largo mete más oxígeno de una vez.' },
  preSesgada: { rot: 'sonda ANTERIOR con desviación a rica', corto: 'anterior desviada', f: { vPreOff: 0.10 },
    pista: 'La sonda de delante miente por 0,1 V. El ordenador la cree, empobrece de más, y el almacén se queda lleno para siempre.' },
  postLenta: { rot: 'sonda POSTERIOR lenta', corto: 'posterior lenta', f: { tauPost: 1.10 },
    pista: 'La señal de atrás está PLANA, pero no porque el catalizador la aplane: porque la sonda ya no responde. Los dos instrumentos que pasan por ella se equivocan igual.' },
  fugaChica: { rot: 'fuga de escape pequeña tras el catalizador', corto: 'fuga pequeña', f: { fugaAire: 0.0022 },
    pista: 'Entra aire entre el catalizador y la sonda de atrás. El aire cancela el sesgo de hidrógeno y deja la señal justo encima del umbral, donde cualquier rizo la cruza.' },
  fugaGrande: { rot: 'fuga de escape grande tras el catalizador', corto: 'fuga grande', f: { fugaAire: 0.008 },
    pista: 'Mucha más agua que la anterior: la señal de atrás no oscila, se CLAVA abajo. Y una señal clavada tiene su propio código.' },
  frio: { rot: 'catalizador por debajo de su encendido', corto: 'catalizador frío', f: { dTcat: -330 },
    pista: 'La lata no ha llegado a su temperatura. No convierte nada, y el almacén sigue entero: el monitor no tiene de qué quejarse.' },
  fosforo: { rot: 'envenenamiento por fósforo (consumo de aceite)', corto: 'fósforo', f: { saludOx: 0.30, saludRed: 0.24, dT50: 54 },
    pista: 'El fósforo del aceite tapa los metales preciosos y deja el cerio casi entero. La conversión se cae, el almacén no.' },
  plomo: { rot: 'envenenamiento del rodio (combustible con plomo)', corto: 'plomo · rodio', f: { saludRed: 0.08 },
    pista: 'El rodio es el metal del NOx y el primero que se envenena. Mira el NOx de cola y después mira contra qué método se está juzgando el coche.' },
};
const FALLA_KEYS = Object.keys(FALLAS);
const EDADES = [
  { a: 0.00, rot: 'nuevo', km: 0 },
  { a: 0.20, rot: 'rodado', km: 60000 },
  { a: 0.30, rot: 'medio', km: 105000 },
  { a: 0.45, rot: 'gastado', km: 160000 },
  { a: 0.70, rot: 'agotado', km: 240000 },
];

// ============================================================================
// 13 · LO QUE SE MIDE DE UN COCHE
// ============================================================================
// Una sola función junta las tres medidas. De aquí cuelga TODO lo que la pantalla
// enseña: si la regla viviera en dos sitios, uno de los dos acabaría enseñando
// una cifra que el otro no reconoce.
function condiciones(e, F) {
  return Object.assign({}, envejece(F.edad === undefined ? 0 : F.edad),
    FALLAS[F.falla || 'sano'].f);
}
function puntoCrucero(e) { return { rpm: e.rpm, carga: e.carga, rot: 'crucero' }; }
function puntoRalenti(e) { return { rpm: e.ralenti, carga: e.cargaRal, rot: 'marcha mínima' }; }

function evalua(e, F) {
  const C = condiciones(e, F);
  const P = puntoCrucero(e);
  const trabajo = simula(e, P, C);                                  // como circula
  const prueba = simula(e, P, Object.assign({}, C, { forzado: FORZADO })); // como se comprueba
  const osc = pruebaOSC(e, puntoRalenti(e), C);
  const gases = cola(e, trabajo);

  // El dictamen del ordenador. Si el coche no tiene sonda posterior no hay
  // monitor que valga: no es que pase, es que no existe.
  let dtc = null, motivo = 'nada que declarar';
  if (!e.sondaPost) { dtc = null; motivo = 'sin sonda posterior: este coche no tiene monitor de catalizador'; }
  else if (prueba.vPostMed < V_PIN_POBRE) { dtc = 'P2270'; motivo = 'la sonda posterior no se mueve de pobre'; }
  else if (prueba.vPostMed > V_PIN_RICA) { dtc = 'P2271'; motivo = 'la sonda posterior no se mueve de rica'; }
  else if (prueba.indice > INDICE_UMBRAL) {
    dtc = 'P0420'; motivo = 'el índice de la sonda posterior rebasó el umbral';
  }
  const din = juzgaCola(e, gases, 'dinamico'), est = juzgaCola(e, gases, 'estatico');
  return {
    cond: C, trabajo, prueba, osc, gases, dtc, motivo,
    din, est,
    apruebaDin: din.length === 0, apruebaEst: est.length === 0,
    // La comparación que es el laboratorio entero: qué dice la máquina contra
    // qué dice la ley. Con el método dinámico, que es el que mira los tres gases.
    acusa: dtc === 'P0420',
    sucio: din.length > 0,
    falsoPositivo: dtc === 'P0420' && din.length === 0,
    falsoNegativo: dtc !== 'P0420' && din.length > 0,
    // Y la banda que la propia reglamentación deja abierta: el monitor se
    // calibra a 1,5 veces el límite, así que entre 1,0 y 1,5 el coche reprueba
    // con el testigo apagado y eso NO es una avería.
    enLaBanda: gases.HC > limites('dinamico', e.anio).HC
      && gases.HC <= 1.5 * limites('dinamico', e.anio).HC,
  };
}

// ============================================================================
// 14 · EL CENSO
// ============================================================================
// Nueve averías por cinco edades. Que las celdas equivocadas EXISTAN y se puedan
// contar es el resultado más incómodo de esta práctica, y no está escrito en
// ningún sitio: sale de recorrer la rejilla.
function censo(e) {
  const filas = [];
  let fp = 0, fn = 0, total = 0;
  for (const k of FALLA_KEYS) {
    const celdas = EDADES.map(E => {
      const V = evalua(e, { edad: E.a, falla: k });
      total++;
      if (V.falsoPositivo) fp++;
      if (V.falsoNegativo) fn++;
      return { edad: E.a, rot: E.rot, dtc: V.dtc, din: V.din.slice(),
        fp: V.falsoPositivo, fn: V.falsoNegativo, HC: V.gases.HC, NOx: V.gases.NOx,
        indice: V.prueba.indice };
    });
    filas.push({ falla: k, rot: FALLAS[k].rot, corto: FALLAS[k].corto, celdas,
      fp: celdas.filter(c => c.fp).length, fn: celdas.filter(c => c.fn).length });
  }
  return { filas, fp, fn, total, mal: fp + fn };
}

// ============================================================ T1 · FORMATOS, ESTADO Y MATERIALES

// El separador de millares es U+202F, un espacio fino que no rompe línea. NO se
// usa en años: «2 012» no es un año, es un error de formato.
const NBSP=' ';
function num(x,d=1){
  if(x===null||x===undefined||!isFinite(x)) return '—';
  const s=Math.abs(x).toFixed(d), p=s.split('.');
  let ent=p[0], out='';
  while(ent.length>3){ out=NBSP+ent.slice(-3)+out; ent=ent.slice(0,-3); }
  out=ent+out;
  return (x<0?'−':'')+out+(p[1]?','+p[1]:'');
}
const volt=(x,d=2)=>num(x,d)+NBSP+'V';
const seg=(x,d=2)=>num(x,d)+NBSP+'s';
const ppm=(x,d=0)=>num(x,d)+NBSP+'ppm';
const pcv=(x,d=2)=>num(x,d)+NBSP+'%';
const pcc=(x,d=0)=>num(x,d)+NBSP+'%';
const gram=(x,d=3)=>num(x,d)+NBSP+'g';
const gps=(x,d=1)=>num(x,d)+NBSP+'g/s';
const rpmT=x=>num(x,0)+NBSP+'rpm';
const kel=(x,d=0)=>num(x,d)+NBSP+'K';
const cel=(x,d=0)=>num(x,d)+NBSP+'°C';
const hz=(x,d=2)=>num(x,d)+NBSP+'Hz';
const kmF=x=>num(x,0)+NBSP+'km';
const lamF=(x,d=3)=>x===null?'—':num(x,d);
const anioF=x=>String(Math.round(x));
const corta=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;

const GAS_ROT={CO:'CO',HC:'HC',NOx:'NOx'};
const GAS_COL={CO:BAD_HEX,HC:NARANJA,NOx:VIO};
function gasF(g,v){ return g==='CO'?pcv(v,3):ppm(v,0); }
const MET_ROT={estatico:'método estático',dinamico:'método dinámico'};
const MET_CORTO={estatico:'estático',dinamico:'dinámico'};

// ------------------------------------------------------------------- estado
const G={
  modo:'sondas', maq:'mpi16', edad:0.00, falla:'sano',
  metodo:'dinamico', punto:'crucero', gasCola:'HC',
  resuelto:false,
};
const MQ=()=>ARQ[G.maq];
const FL=()=>FALLAS[G.falla];
const EDAD_ROT=a=>(EDADES.find(E=>Math.abs(E.a-a)<1e-6)||{rot:'a medida',km:Math.round(a*340000)});

// --------------------------------------------------------------------- memo
// Cada `evalua` son dos integraciones de 6 500 pasos más la intrusiva. Sin
// memorizar, repintar el pizarrón a cada fotograma tira la página al suelo.
const MEMO=new Map();
function memo(k,fn){ if(!MEMO.has(k)) MEMO.set(k,fn()); return MEMO.get(k); }
function invalida(){ MEMO.clear(); }
function EV(){ return EV_DE(G.edad,G.falla); }
function EV_DE(a,f){ return memo('v|'+G.maq+'|'+a+'|'+f,()=>evalua(MQ(),{edad:a,falla:f})); }
function CENSO(){ return memo('c|'+G.maq,()=>censo(MQ())); }
function PUNTO(){ return G.punto==='ralenti'?puntoRalenti(MQ()):puntoCrucero(MQ()); }
// La traza que se ENSEÑA depende del punto elegido; la del dictamen es siempre
// la de crucero, que es donde el monitor está habilitado. No son la misma, y
// mezclarlas sería enseñar un veredicto que no corresponde a la gráfica.
function TRAZA(forzado){
  return memo('t|'+G.maq+'|'+G.edad+'|'+G.falla+'|'+G.punto+'|'+(forzado?1:0),()=>{
    const C=condiciones(MQ(),{edad:G.edad,falla:G.falla});
    return simula(MQ(),PUNTO(),forzado?Object.assign({},C,{forzado:FORZADO}):C);
  });
}
function OSC_AQUI(){
  return memo('o|'+G.maq+'|'+G.edad+'|'+G.falla+'|'+G.punto,()=>
    pruebaOSC(MQ(),PUNTO(),condiciones(MQ(),{edad:G.edad,falla:G.falla})));
}

// ---------------------------------------------------------------- veredictos
function veredicto(){
  const V=EV();
  if(V.dtc==='P0420'||V.dtc==='P0430') return {nivel:'bad',rot:'EL ORDENADOR ACUSA AL CATALIZADOR'};
  if(V.dtc) return {nivel:'warn',rot:'EL ORDENADOR ACUSA A LA SONDA POSTERIOR'};
  if(!MQ().sondaPost) return {nivel:'warn',rot:'ESTE COCHE NO TIENE MONITOR'};
  return {nivel:'ok',rot:'EL ORDENADOR NO TIENE NADA QUE DECLARAR'};
}

// ---------------------------------------------------------------- materiales
const rub={roughness:0.86,metalness:0.04};
const plas={roughness:0.42,metalness:0.16};
const std=o=>new THREE.MeshStandardMaterial(o);
// OJO: `brushedMetal()` NO devuelve un material, devuelve el juego de texturas
// (map, roughnessMap, normalMap). Pasárselo tal cual a un Mesh no da ningún
// error —three comprueba `material.visible===true` y, al ser undefined, SE SALTA
// la pieza en silencio—: la malla existe, no se ve, y no hay prueba numérica que
// se entere. Aquí dejaba sin dibujar las columnas del elevador, sus largueros y
// el pie del escáner. Se envuelve en un material de verdad.
const MAT={
  acero:std(Object.assign({},brushedMetal(),
    {color:0xb9c4cf,roughness:0.42,metalness:0.78})),
  crom:std({color:0xd8e2ec,roughness:0.18,metalness:0.92}),
  tubo:std({color:0x8d99a6,roughness:0.44,metalness:0.72}),
  lata:std({color:0xa9b6c2,roughness:0.30,metalness:0.86}),
  caja:std({color:0x1c2531,...plas}),
  chasis:std({color:0x2d3a4b,roughness:0.34,metalness:0.28}),
  goma:std({color:0x14181e,...rub}),
  sonda:std({color:0x6b7480,roughness:0.38,metalness:0.70}),
  cable:std({color:0x161b22,...rub}),
  ok:std({color:0x1a3a26,emissive:0x2fbf62,emissiveIntensity:1.5}),
  bad:std({color:0x3a1a1e,emissive:0xff4d5e,emissiveIntensity:1.5}),
  avi:std({color:0x3a3116,emissive:0xe9c46a,emissiveIntensity:1.4}),
  apag:std({color:0x232a33,roughness:0.6,metalness:0.1}),
};

// ============================================================ T2 · PIZARRÓN
// Un lienzo 2D de 1024×768 pegado a un panel 3D. Se llama `bcv` y no `cv`
// porque `cv` ya es la fábrica de lienzos del kit de la escena: reusar ese
// nombre rompe la página entera antes de que arranque nada.
const BW=1024, BH=768;
const bcv=document.createElement('canvas'); bcv.width=BW; bcv.height=BH;
const bx=bcv.getContext('2d');
const btex=new THREE.CanvasTexture(bcv);
btex.colorSpace=THREE.SRGBColorSpace;

const board=new THREE.Group();
scene.add(board);
// El tamaño del pizarrón se elige por lo que MIDE EN PANTALLA, no por lo que
// parece razonable en metros: la textura tiene 1 024 px de ancho, y si el
// pizarrón sale a 420 px de ventana el texto de 13 px llega al ojo a 5 y no se
// lee. Aquí el banco es una línea de escape sobre un elevador —más estrecha que
// el coche entero del laboratorio anterior—, así que el pizarrón puede crecer.
const BW3=8.40, BH3=6.06, BY3=3.26;
function colocaTablero(d){
  board.rotation.y=0.70;
  // Se pega al borde IZQUIERDO real del banco, descontando su propio medio ancho
  // proyectado sobre el eje X. Partir de un «ancho total» inventado deja un metro
  // de hueco entre los dos y echa el banco fuera del cuadro.
  // El hueco entre el borde del pizarrón y el banco no es decorativo: los
  // rótulos del banco son sprites que sobresalen de la pieza que nombran, y con
  // menos de un metro la chapa de «sonda anterior» se pinta encima del marco.
  const medio=(BW3/2+0.13)*Math.cos(board.rotation.y);
  board.position.set(d.xIzq-1.05-medio,0,0.95);
}
function puntosClave(){
  const d=dims(MQ());
  const a=BW3/2, mx=a*Math.cos(board.rotation.y), mz=a*Math.sin(board.rotation.y);
  const y0=BY3-BH3/2, y1=BY3+BH3/2, bp=board.position;
  return [
    [bp.x-mx,y0,bp.z+mz],[bp.x+mx,y0,bp.z-mz],
    [bp.x-mx,y1,bp.z+mz],[bp.x+mx,y1,bp.z-mz],
    // Los extremos REALES del banco: el colector, las dos sondas, la lata, la
    // cola del escape y lo alto del escáner. Sin el borde del escáner aquí, la
    // cámara lo deja debajo del panel de mandos y el encuadre parece bueno hasta
    // que se mira la pantalla.
    [d.xCol,d.yTubo+0.34,0.10],[d.xCol,0.05,-0.50],
    [d.xCola,d.yTubo+0.12,0.10],[d.xCola,0.05,-0.50],
    [d.xPre,d.yTubo+0.54,0],[d.xPost,d.yTubo+0.54,0],
    [d.xLata,d.yTubo+0.38,0.36],[d.xLata,d.yTubo-0.38,-0.36],
    [d.xEsc,1.74,d.zEsc],[d.xEsc-0.44,0.05,d.zEsc-0.30],[d.xEsc+0.44,0.05,d.zEsc+0.30],
    [d.centro,d.yElev+0.44,0.64],[d.centro,0.05,-0.64],
  ].map(p=>new THREE.Vector3(...p));
}
// La franja de pantalla que de verdad se ve: el HUD tapa la izquierda y el panel
// de mandos tapa la derecha. Encuadrar contra el ancho completo del lienzo mete
// casi cuatro décimas del banco DEBAJO de los paneles.
function zonaUtil(){
  const rM=mount.getBoundingClientRect();
  const W=rM.width||1600, H=rM.height||900;
  let x0=0, x1=W;
  const h=el('hud'), p=el('panel');
  if(h){ const r=h.getBoundingClientRect();
    if(r.width>0&&r.right-rM.left<W*0.60) x0=Math.max(x0,r.right-rM.left+18); }
  if(p){ const r=p.getBoundingClientRect();
    if(r.width>0&&r.left-rM.left>W*0.40) x1=Math.min(x1,r.left-rM.left-18); }
  // En una pantalla estrecha los paneles no dejan hueco: entonces se usa todo el
  // lienzo, porque la alternativa es alejar la cámara hasta que no se lea nada.
  if(x1-x0<W*0.34){ x0=0; x1=W; }
  return { W, H, x0, x1 };
}
function camConjunto(margen){
  const d=dims(MQ()), Z=zonaUtil();
  const asp=clamp(Z.W/Math.max(1,Z.H),0.60,2.60);
  const m=(margen===undefined?1:margen);
  const TV=0.4142, TH=TV*asp;                    // tangentes del medio ángulo
  const nx0=(2*Z.x0/Z.W-1)/m, nx1=(2*Z.x1/Z.W-1)/m, ny=0.94/m;
  const pts=puntosClave();
  const mx=1.86*Math.cos(board.rotation.y);
  let off=(((board.position.x-mx)+d.xDer)/2-board.position.x)/Math.cos(board.rotation.y);
  const proy=(dist,o)=>{
    const c=camTablero(dist,o);
    const p=new THREE.Vector3(c[0][0],c[0][1],c[0][2]);
    const q=new THREE.Vector3(c[1][0],c[1][1],c[1][2]);
    const f=q.clone().sub(p).normalize();
    const r=new THREE.Vector3().crossVectors(f,new THREE.Vector3(0,1,0)).normalize();
    const u=new THREE.Vector3().crossVectors(r,f).normalize();
    let a=Infinity,b=-Infinity,vy=0,zs=0,n=0,malo=false;
    for(const v0 of pts){
      const v=v0.clone().sub(p), z=v.dot(f);
      if(z<=0.2){ malo=true; continue; }
      a=Math.min(a,(v.dot(r)/z)/TH); b=Math.max(b,(v.dot(r)/z)/TH);
      vy=Math.max(vy,Math.abs((v.dot(u)/z)/TV)); zs+=z; n++;
    }
    return { a, b, vy, z:n?zs/n:1, malo };
  };
  const cabe=(dist,o)=>{ const e=proy(dist,o); return !e.malo&&e.a>=nx0&&e.b<=nx1&&e.vy<=ny; };
  let dist=26;
  for(let it=0;it<7;it++){
    // Menor distancia que mete todos los puntos clave dentro de la franja útil.
    if(cabe(26,off)){
      let lo=3, hi=26;
      for(let k=0;k<26;k++){ const mid=(lo+hi)/2; if(cabe(mid,off)) hi=mid; else lo=mid; }
      dist=hi;
    }else dist=26;
    // Y después se centra el contenido DENTRO de esa franja, no dentro del
    // lienzo: si no, el banco queda pegado al panel de mandos.
    const e=proy(dist,off);
    const dn=(nx0+nx1)/2-(e.a+e.b)/2;
    if(Math.abs(dn)<0.012) break;
    off-=dn*TH*e.z;
  }
  return camTablero(dist,off);
}
function camTablero(d,off){
  const c=board.position.clone(); c.y=BY3;
  const n=new THREE.Vector3(Math.sin(board.rotation.y),0,Math.cos(board.rotation.y));
  const dd=d||5.85;
  // La altura sube con la distancia: con una altura fija, alejarse deja la vista
  // casi horizontal y el elevador se ve de canto.
  const p=c.clone().addScaledVector(n,dd); p.y=BY3+0.13*dd;
  const tg=new THREE.Vector3(Math.cos(board.rotation.y),0,-Math.sin(board.rotation.y));
  const dx=(off===undefined)?-0.42:off;
  p.addScaledVector(tg,dx); c.addScaledVector(tg,dx);
  return [[p.x,p.y,p.z],[c.x,c.y,c.z]];
}
{
  const marco=roundedBox(BW3+0.26,BH3+0.24,0.10,std({...plas,metalness:0.30,roughness:0.58}),0.05);
  marco.position.y=BY3; board.add(marco);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(BW3,BH3),
    new THREE.MeshBasicMaterial({map:btex,toneMapped:false}));
  pl.position.set(0,BY3,0.056); board.add(pl);
  // Las patas se separan con el ancho del pizarrón, no con un número escrito a
  // mano: si el pizarrón crece y ellas no, quedan dos palos en mitad del marco.
  const pie=Math.max(0.10,BY3-BH3/2-0.12);
  for(const sx of [-1,1]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,pie,16),MAT.acero);
    p.position.set(sx*BW3*0.42,pie/2,0); p.castShadow=true; board.add(p);
  }
}

// ------------------------------------------------------------- primitivas 2D
function bg(){
  const g=bx.createLinearGradient(0,0,0,BH);
  g.addColorStop(0,'#0d131c'); g.addColorStop(1,'#070a10');
  bx.fillStyle=g; bx.fillRect(0,0,BW,BH);
}
function texto(t,x,y,o){
  o=o||{};
  const s=o.s||16, w=o.b?'700':'400', it=o.it?'italic ':'';
  bx.font=it+w+' '+s+'px '+(o.mono?'ui-monospace,Menlo,Consolas,monospace':'Inter,system-ui,sans-serif');
  bx.fillStyle=o.c||TINTA; bx.textAlign=o.al||'left'; bx.textBaseline='alphabetic';
  bx.fillText(t,x,y);
}
function linea(pts,c,w,dash){
  if(pts.length<2) return;
  bx.save(); bx.strokeStyle=c; bx.lineWidth=w||2; bx.lineJoin='round'; bx.lineCap='round';
  if(dash) bx.setLineDash(dash);
  bx.beginPath(); bx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) bx.lineTo(pts[i][0],pts[i][1]);
  bx.stroke(); bx.restore();
}
function wrapText(t,x,y,w,lh,o){
  o=o||{};
  const s=o.s||14;
  bx.font=(o.b?'700 ':'400 ')+s+'px Inter,system-ui,sans-serif';
  bx.fillStyle=o.c||'#9aa6b6'; bx.textAlign='left'; bx.textBaseline='alphabetic';
  let ln='', yy=y;
  for(const p of t.split(' ')){
    const test=ln?ln+' '+p:p;
    if(bx.measureText(test).width>w&&ln){ bx.fillText(ln,x,yy); yy+=lh; ln=p; }
    else ln=test;
  }
  if(ln){ bx.fillText(ln,x,yy); yy+=lh; }
  return yy;
}
function rpanel(x,y,w,h,c,bd,rad){
  const r=Math.min(rad===undefined?10:rad, w/2, h/2);
  bx.save(); bx.beginPath();
  bx.moveTo(x+r,y); bx.arcTo(x+w,y,x+w,y+h,r); bx.arcTo(x+w,y+h,x,y+h,r);
  bx.arcTo(x,y+h,x,y,r); bx.arcTo(x,y,x+w,y,r); bx.closePath();
  bx.fillStyle=c||'rgba(255,255,255,0.035)'; bx.fill();
  if(bd){ bx.strokeStyle=bd; bx.lineWidth=1.4; bx.stroke(); }
  bx.restore();
}
function chk(x,y,ok){
  bx.save(); bx.lineWidth=2.6; bx.lineCap='round';
  bx.strokeStyle=ok?OK_HEX:'#3a4658';
  bx.beginPath(); bx.arc(x,y,9,0,Math.PI*2); bx.stroke();
  if(ok){ bx.beginPath(); bx.moveTo(x-4.5,y); bx.lineTo(x-1,y+3.6); bx.lineTo(x+4.8,y-4); bx.stroke(); }
  bx.restore();
}
function tabla(x,y,cols,rows,o){
  o=o||{};
  const rh=o.rh||26, fs=o.s||14, gap=o.gap===undefined?14:o.gap;
  const ancho=cols.reduce((a,c)=>a+c.w+gap,0)-gap;
  let cx=x;
  cols.forEach(c=>{ texto(c.t,c.al==='right'?cx+c.w:cx,y,{s:fs,b:true,c:'#9aa6b6',al:c.al||'left'}); cx+=c.w+gap; });
  linea([[x,y+8],[x+ancho,y+8]],'#243043',1.2);
  rows.forEach((r,i)=>{
    const yy=y+rh*(i+1)+6;
    if(r.hl){ bx.save(); bx.fillStyle=r.hl; bx.fillRect(x-6,yy-rh+9,ancho+12,rh); bx.restore(); }
    let px=x;
    cols.forEach((c,j)=>{
      const cell=r.v[j];
      const val=Array.isArray(cell)?cell[0]:cell, col=Array.isArray(cell)?cell[1]:(r.c||TINTA);
      texto(val,c.al==='right'?px+c.w:px,yy,{s:fs,c:col,al:c.al||'left',mono:c.mono,b:r.b});
      px+=c.w+gap;
    });
  });
  return y+rh*(rows.length+1)+6;
}
// Título que se encoge hasta caber: cambiar de vehículo cambia la longitud del
// rótulo, y un rótulo largo se monta encima del de al lado sin avisar.
function textoFit(t,x,y,maxW,o){
  o=o||{};
  let s=o.s||16;
  while(s>11){
    bx.font=(o.b?'700 ':'400 ')+s+'px Inter,system-ui,sans-serif';
    if(bx.measureText(t).width<=maxW) break;
    s-=0.5;
  }
  texto(t,x,y,Object.assign({},o,{s:s}));
}
function etiqueta(t,x,y,c,al){
  bx.font='400 12px Inter,system-ui,sans-serif';
  const w=bx.measureText(t).width+16, x0=(al==='right')?x-w:x;
  rpanel(x0,y-14,w,20,'rgba(8,12,18,0.80)',null,6);
  texto(t,x0+8,y,{s:12,c:c||TINTA});
}
function leyenda(x,y,items){
  bx.font='400 13px Inter,system-ui,sans-serif';
  const w=Math.max.apply(null,items.map(it=>bx.measureText(it[0]).width))+48;
  rpanel(x-10,y-19,w,items.length*22+8,'rgba(8,12,18,0.80)','#1e2836',8);
  let yy=y;
  items.forEach(it=>{
    bx.save(); bx.strokeStyle=it[1]; bx.lineWidth=3.2; bx.lineCap='round';
    if(it[2]) bx.setLineDash(it[2]);
    bx.beginPath(); bx.moveTo(x,yy-4); bx.lineTo(x+26,yy-4); bx.stroke(); bx.restore();
    texto(it[0],x+34,yy,{s:13,c:'#c3ccd8'});
    yy+=22;
  });
  return yy;
}
// Recorta al rectángulo de la gráfica. Sin esto, una curva que se sale por
// arriba se pinta sobre la cabecera y nadie lo nota.
function enCaja(P,fn){ bx.save(); bx.beginPath(); bx.rect(P.x,P.y,P.w,P.h); bx.clip(); fn(); bx.restore(); }

function ejes(P,x0,x1,y0,y1,rx,ry,fx,fy,nx,ny){
  const X=v=>P.x+(v-x0)/(x1-x0)*P.w;
  const Y=v=>P.y+P.h-(v-y0)/(y1-y0)*P.h;
  bx.save(); bx.strokeStyle='#1d2735'; bx.lineWidth=1;
  for(let i=0;i<=nx;i++){ const v=x0+(x1-x0)*i/nx, xx=X(v);
    bx.beginPath(); bx.moveTo(xx,P.y); bx.lineTo(xx,P.y+P.h); bx.stroke();
    if(fx) texto(fx(v),xx,P.y+P.h+19,{s:12,c:'#7b8697',al:'center'}); }
  for(let i=0;i<=ny;i++){ const v=y0+(y1-y0)*i/ny, yy=Y(v);
    bx.beginPath(); bx.moveTo(P.x,yy); bx.lineTo(P.x+P.w,yy); bx.stroke();
    if(fy) texto(fy(v),P.x-9,yy+4,{s:12,c:'#7b8697',al:'right'}); }
  bx.restore();
  bx.save(); bx.strokeStyle='#3a4658'; bx.lineWidth=1.5; bx.strokeRect(P.x,P.y,P.w,P.h); bx.restore();
  if(rx) texto(rx,P.x+P.w/2,P.y+P.h+44,{s:13,c:'#9aa6b6',al:'center'});
  if(ry){ bx.save(); bx.translate(P.x-58,P.y+P.h/2); bx.rotate(-Math.PI/2);
    texto(ry,0,0,{s:13,c:'#9aa6b6',al:'center'}); bx.restore(); }
  return {X:X,Y:Y};
}
function serieXY(M,pts,c,w,dash){ linea(pts.map(p=>[M.X(p[0]),M.Y(p[1])]),c,w,dash); }
function punteo(M,x,y,c,r){
  bx.save(); bx.fillStyle=c; bx.beginPath(); bx.arc(M.X(x),M.Y(y),r||4.5,0,Math.PI*2); bx.fill(); bx.restore();
}
// Línea de referencia horizontal. Si el nivel cae fuera del recuadro NO se
// pinta: una línea de límite dibujada sobre el borde miente sobre dónde está.
function nivel(P,M,v,c,rot,dash){
  const yy=M.Y(v);
  if(yy<P.y-1||yy>P.y+P.h+1) return;
  linea([[P.x,yy],[P.x+P.w,yy]],c,1.6,dash||[7,5]);
  if(rot) etiqueta(rot,P.x+P.w-8,yy-6,c,'right');
}
function nivelV(P,M,v,c,rot,dash){
  const xx=M.X(v);
  if(xx<P.x-1||xx>P.x+P.w+1) return;
  linea([[xx,P.y],[xx,P.y+P.h]],c,1.6,dash||[7,5]);
  if(rot) etiqueta(rot,xx+6,P.y+16,c);
}
// Cabecera común: toda vista dice qué coche, con qué edad de catalizador y con
// qué avería se está mirando. Una cifra sin su configuración al lado no
// significa nada, y aquí hay cuatro mandos que la cambian.
function cabVehiculo(){
  const e=MQ(), E=EDAD_ROT(G.edad);
  return e.corto+' · '+anioF(e.anio)+' · '+(e.sondaPost?'dos sondas':'una sonda, sin monitor')+
    ' · catalizador '+E.rot+' ('+kmF(E.km)+')';
}
function cabPunto(){
  const e=MQ(), P=PUNTO(), L=limites(G.metodo,e.anio);
  return P.rot+' '+rpmT(P.rpm)+' / carga '+pcc(P.carga*100)+
    '  ·  '+L.tabla+' «'+L.rot+'»  ·  HC ≤ '+num(L.HC,0)+', CO ≤ '+num(L.CO,1)+
    (L.NOx===null?', sin límite de NOx':', NOx ≤ '+num(L.NOx,0));
}
// En el reto a ciegas la cabecera NO puede decir qué avería está puesta ni qué
// edad tiene el catalizador: las dos cosas SON la respuesta.
function cabecera(t,sub){
  const ciego=(G.modo==='reto');
  const e=MQ();
  const l1=ciego
    ? e.corto+' · '+anioF(e.anio)+' · '+(e.sondaPost?'dos sondas':'una sonda, sin monitor')+' · catalizador: por determinar'
    : cabVehiculo();
  const l2=ciego?cabPunto()+'  ·  avería: por determinar':cabPunto()+'  ·  '+FL().rot;
  texto(l1,BW-42,44,{s:13,c:ciego?WARN_HEX:CIAN,al:'right'});
  texto(l2,BW-42,68,{s:13,c:ciego?WARN_HEX:'#8c98a9',al:'right'});
  // El ancho que le queda al título es el que NO ocupa la línea del vehículo, y
  // se mide de verdad: escribir un ancho fijo deja el título montado encima del
  // rótulo en cuanto el nombre del coche es largo.
  bx.font='400 13px Inter,system-ui,sans-serif';
  const libre=Math.max(240,(BW-42-bx.measureText(l1).width-24)-42);
  textoFit(t,42,50,libre,{s:26,b:true});
  wrapText(sub,42,92,BW-84,18,{s:13,c:'#8c98a9'});
  linea([[42,116],[BW-42,116]],'#1e2836',1.4);
}
// Banda de veredicto al pie. La altura se MIDE a partir del texto que va a
// llevar: una banda de altura fija recorta su tercera línea, el texto existe
// pero no se ve, y ninguna prueba numérica puede darse cuenta.
function lineasDe(t,w,s){
  bx.font='400 '+s+'px Inter,system-ui,sans-serif';
  let n=1, ln='';
  for(const p of String(t).split(' ')){
    const test=ln?ln+' '+p:p;
    if(bx.measureText(test).width>w&&ln){ n++; ln=p; } else ln=test;
  }
  return n;
}
function banda(y,niv,rot,txt){
  const SZ=12.5, LH=17, W=BW-120;
  const h=Math.max(60, 32+lineasDe(txt,W,SZ)*LH+10);
  const yy=Math.min(y, BH-14-h);
  const col=niv==='bad'?BAD_HEX:(niv==='warn'?WARN_HEX:OK_HEX);
  const fondo=niv==='bad'?'rgba(255,107,107,0.10)':(niv==='warn'?'rgba(233,196,106,0.10)':'rgba(124,217,146,0.10)');
  rpanel(42,yy,BW-84,h,fondo,col,10);
  texto(rot,60,yy+24,{s:14,b:true,c:col});
  wrapText(txt,60,yy+44,W,LH,{s:SZ,c:'#c3ccd8'});
  return yy+h;
}

// La columna derecha del pizarrón. Las gráficas llegan hasta x = 694 y el margen
// del tablero está en 982, así que TODA tabla de la derecha vive entre esos dos
// números. Escribir anchos a mano en cada vista deja las tablas cortadas por el
// borde, y eso sólo se ve mirando la pantalla.
const DER_X=708, DER_W=274;
function tablaDer(y,rot,rows,o){
  o=o||{};
  const nv=rot.length-1;
  const wv=nv===1?110:(nv===2?76:56), gap=8;
  const w0=DER_W-(wv+gap)*nv;
  const cols=[{t:rot[0]||'',w:w0}];
  for(let i=0;i<nv;i++) cols.push({t:rot[i+1]||'',w:wv,al:'right'});
  // Una fila con menos celdas que columnas pinta «undefined» en la última, y eso
  // pasa desapercibido en cualquier prueba numérica: se rellena aquí.
  rows.forEach(r=>{ while(r.v.length<cols.length) r.v.push(''); });
  return tabla(DER_X,y,cols,rows,Object.assign({rh:25,s:13,gap:gap},o));
}

// ============================================================ T2b · LAS VISTAS

// El barrido de edad que necesitan las vistas del monitor. Se memoriza: son 34
// integraciones y recorrerlas a cada repintado tira los fotogramas al suelo.
const NEDAD=19;
function barridoEdad(){
  return memo('be|'+G.maq+'|'+G.falla,()=>{
    const e=MQ(), out=[];
    for(let i=0;i<NEDAD;i++){
      const a=i/(NEDAD-1)*0.85;
      const V=evalua(e,{edad:a,falla:G.falla});
      out.push({a:a, indice:V.prueba.indice, HC:V.gases.HC, CO:V.gases.CO, NOx:V.gases.NOx,
        osc:V.osc.t, ceria:V.cond.ceria, dtc:V.dtc,
        etaCO:V.trabajo.etaCO, etaHC:V.trabajo.etaHC, etaNOx:V.trabajo.etaNOx});
    }
    return out;
  });
}

// ---------------------------------------------------------------- 1 · sondas
function vistaSondas(){
  const e=MQ(), T=TRAZA(false), V=EV(), P=PUNTO();
  cabecera('LAS DOS SONDAS, TRABAJANDO',
    'La de delante oscila porque el ordenador la hace oscilar: rampa la mezcla y da media vuelta cada vez que la sonda cruza '+volt(V_UMBRAL)+'. La de detrás sólo debería mirar. Cuanto más se parezca a la de delante, menos catalizador queda en medio.');

  const P1={x:96,y:146,w:580,h:222};
  const M1=ejes(P1,0,18,0,1.0,'segundos','tensión de la sonda (V)',
    v=>num(v,0),v=>num(v,1),6,5);
  nivel(P1,M1,V_UMBRAL,'#4a5668','umbral del ordenador '+volt(V_UMBRAL),[6,5]);
  enCaja(P1,()=>{
    serieXY(M1,T.pts.map(p=>[p.t,p.vPre]),CIAN,2.0);
    serieXY(M1,T.pts.map(p=>[p.t,p.vPost]),NARANJA,2.4);
  });
  leyenda(P1.x+16,P1.y+26,[['sonda anterior',CIAN],['sonda posterior',NARANJA]]);

  // El λ que hay detrás de esas dos señales. Sin esto la sonda parece la causa
  // de la oscilación, y es la consecuencia.
  const P2={x:96,y:434,w:580,h:142};
  const M2=ejes(P2,0,18,0.955,1.045,'segundos','λ',v=>num(v,0),v=>num(v,3),6,3);
  nivel(P2,M2,1,'#4a5668',null,[4,4]);
  enCaja(P2,()=>{
    serieXY(M2,T.pts.map(p=>[p.t,p.lamPre]),CIAN,1.8);
    serieXY(M2,T.pts.map(p=>[p.t,p.lamInt]),OK_HEX,2.2);
  });
  leyenda(P2.x+16,P2.y+24,[['λ que ENTRA al catalizador',CIAN],['λ DENTRO, tras el almacén',OK_HEX]]);

  let y=146;
  y=tablaDer(y,['el ciclo límite',''],[
    {v:['retardo del lazo',seg(T.ret)]},
    {v:['+ respuesta de la sonda',seg(T.tau-T.ret)]},
    {v:['= retardo total τ',seg(T.tau)],b:true,c:CIAN},
    {v:['periodo ≈ 4τ',seg(T.periodo)]},
    {v:['frecuencia medida',hz(T.fPre)]},
    {v:['amplitud de λ','±'+num(T.ampLam,4)]},
  ]);
  y=tablaDer(y+18,['la sonda posterior',''],[
    {v:['media',volt(T.vPostMed)]},
    {v:['recorrido',volt(T.ampPost)]},
    {v:['índice de actividad',num(T.indice,3)],b:true,
      c:T.indice>INDICE_UMBRAL?BAD_HEX:OK_HEX},
    {v:['umbral del monitor',num(INDICE_UMBRAL,2)],c:GRIS},
  ]);
  const plana=T.ampPost<0.08;
  banda(Math.max(y+22,626),plana?'ok':'bad',
    plana?'LA DE DETRÁS NO SE ENTERA':'LA DE DETRÁS ESTÁ COPIANDO A LA DE DELANTE',
    plana
      ? 'La mezcla que entra oscila ±'+num(T.ampLam,4)+' y la sonda posterior se queda en '+volt(T.vPostMed)+' con '+volt(T.ampPost)+' de recorrido. No es que la sonda esté sorda: es que el oxígeno que sobra en cada media oscilación se lo queda el cerio del recubrimiento y no llega hasta ella. Y esos '+volt(T.vPostMed)+' tampoco son casualidad — el gas que sale del catalizador viene equilibrado y lleva hidrógeno, que el circonio lee como mezcla rica. Una sonda posterior ALTA Y QUIETA es la firma de que la lata trabaja.'
      : 'La sonda posterior recorre '+volt(T.ampPost)+' y cruza el umbral '+num(T.nSwPost,0)+' veces en '+seg(18,0)+'. Lo que entra ya no se queda dentro: el almacén se satura antes de que acabe la media oscilación y el oxígeno sale por el otro lado. Ojo con la conclusión, sin embargo: esto dice que el ALMACÉN se acabó, no todavía que el catalizador no convierta.');
}

// --------------------------------------------------------------- 2 · almacén
function vistaAlmacen(){
  const T=TRAZA(false), TF=TRAZA(true), V=EV();
  cabecera('EL ALMACÉN DE OXÍGENO',
    'El cerio del recubrimiento guarda oxígeno cuando la mezcla va pobre y lo suelta cuando va rica. Ése es el amortiguador, y es LO ÚNICO que el monitor sabe medir. Mientras no se llena, por detrás no sale nada.');

  const P1={x:96,y:146,w:580,h:216};
  const M1=ejes(P1,0,18,0,1,'segundos','llenado del almacén Θ',
    v=>num(v,0),v=>num(v,1),6,4);
  nivel(P1,M1,1,BAD_HEX,'lleno: el oxígeno pasa',[6,4]);
  nivel(P1,M1,0,BAD_HEX,'vacío: el CO pasa',[6,4]);
  enCaja(P1,()=>{
    serieXY(M1,T.pts.map(p=>[p.t,p.th]),AZUL,2.2);
    serieXY(M1,TF.pts.map(p=>[p.t,p.th]),VIO,1.8,[6,4]);
  });
  leyenda(P1.x+16,P1.y+26,[['circulando',AZUL],['durante la prueba del monitor',VIO,[6,4]]]);

  // Cuánto se escapa: la rodilla de ruptura, que es lo que hace que la señal de
  // atrás no baje poco a poco sino de golpe.
  const P2={x:96,y:428,w:580,h:148};
  const M2=ejes(P2,0,1,0,100,'llenado Θ','fracción que se ESCAPA (%)',
    v=>num(v,1),v=>num(v,0),5,4);
  const rot=[]; for(let i=0;i<=120;i++){ const th=i/120; rot.push([th,100*Math.pow(th,P_RUPTURA)]); }
  enCaja(P2,()=>{
    serieXY(M2,rot,NARANJA,2.4);
    // Dónde vive este catalizador en esa curva.
    linea([[M2.X(T.thMin),M2.Y(0)],[M2.X(T.thMin),M2.Y(100)]],'#2a3546',1.2,[3,4]);
    linea([[M2.X(T.thMax),M2.Y(0)],[M2.X(T.thMax),M2.Y(100)]],'#2a3546',1.2,[3,4]);
    bx.save(); bx.fillStyle='rgba(110,168,254,0.10)';
    bx.fillRect(M2.X(T.thMin),P2.y,M2.X(T.thMax)-M2.X(T.thMin),P2.h); bx.restore();
  });
  etiqueta('donde vive este catalizador',M2.X(T.thMin)+8,P2.y+22,AZUL);

  let y=146;
  const C=V.cond;
  y=tablaDer(y,['la lata',''],[
    {v:['capacidad nueva',gram(OSC_POR_LITRO*MQ().cilindrada)]},
    {v:['cerio que queda',pcc(C.ceria*100)]},
    {v:['capacidad de hoy',gram(V.trabajo.C)],b:true,c:CIAN},
  ]);
  y=tablaDer(y+16,['por media oscilación',''],[
    {v:['gasto de aire',gps(V.trabajo.mAire)]},
    {v:['O₂ que sobra',gram(Y_O2*V.trabajo.mAire*V.trabajo.ampLam*V.trabajo.tau,4)]},
    {v:['Θ mínimo',num(T.thMin,2)]},
    {v:['Θ máximo',num(T.thMax,2)]},
    {v:['recorrido ΔΘ',num(T.dTh,2)],b:true,
      c:T.dTh>0.7?BAD_HEX:(T.dTh>0.4?WARN_HEX:OK_HEX)},
  ]);
  const sat=T.dTh>0.7;
  banda(Math.max(y+22,626),sat?'bad':'ok',
    sat?'EL ALMACÉN LLEGA A LOS TOPES':'EL ALMACÉN TRABAJA EN LA ZONA PLANA',
    sat
      ? 'Θ recorre '+num(T.dTh,2)+' de su carrera y toca los dos extremos. En cuanto llega arriba, la curva de abajo dice que se escapa el '+pcc(100*Math.pow(T.thMax,P_RUPTURA))+' de lo que entra, y eso es lo que la sonda de atrás ve. Fíjate en la forma de esa curva: no es una recta. Hasta el 80 % de lleno no se escapa casi nada y a partir de ahí se rompe deprisa, y por eso la señal de atrás no se degrada poco a poco — está plana hasta que un día deja de estarlo.'
      : 'Θ se mueve sólo '+num(T.dTh,2)+' alrededor de la mitad, y en esa zona la curva de abajo vale prácticamente cero: no se escapa nada. Sube la edad del catalizador y verás que la carrera de Θ crece —el mismo oxígeno en un depósito más pequeño llena más— hasta que toca los topes. Nada de esto está escrito: sale de dividir el oxígeno que sobra en cada media oscilación entre lo que la lata todavía es capaz de guardar.');
}

// --------------------------------------------------------------- 3 · prueba
function vistaPrueba(){
  const e=MQ(), O=OSC_AQUI(), V=EV();
  const oR=memo('or|'+G.maq+'|'+G.edad+'|'+G.falla,()=>pruebaOSC(e,puntoRalenti(e),V.cond));
  const oC=memo('oc|'+G.maq+'|'+G.edad+'|'+G.falla,()=>pruebaOSC(e,puntoCrucero(e),V.cond));
  cabecera('LA PRUEBA QUE MIDE EL ALMACÉN DIRECTAMENTE',
    'Se vacía la lata, se fuerza la mezcla a λ '+lamF(LAM_INTRUSIVO,2)+' y se cronometra hasta que la sonda de atrás cae. El resultado es un TIEMPO, y ese tiempo es la capacidad dividida entre el oxígeno que entra por segundo. Es la única de las tres medidas que no infiere nada.');

  const tMax=Math.max(1.2,Math.min(9,Math.max(oR.t,oC.t)*1.25));
  const P1={x:96,y:146,w:580,h:224};
  const M1=ejes(P1,0,tMax,0,1.0,'segundos desde que se fuerza pobre','tensión de la sonda posterior (V)',
    v=>num(v,1),v=>num(v,1),6,5);
  nivel(P1,M1,V_UMBRAL,'#4a5668','se declara la ruptura en '+volt(V_UMBRAL),[6,5]);
  enCaja(P1,()=>{
    serieXY(M1,oR.pts.map(p=>[p.t,p.vPost]),OK_HEX,2.4);
    serieXY(M1,oC.pts.map(p=>[p.t,p.vPost]),NARANJA,2.4);
    if(oR.roto){ linea([[M1.X(oR.t),P1.y],[M1.X(oR.t),P1.y+P1.h]],OK_HEX,1.4,[4,4]); }
    if(oC.roto){ linea([[M1.X(oC.t),P1.y],[M1.X(oC.t),P1.y+P1.h]],NARANJA,1.4,[4,4]); }
  });
  if(oR.roto) etiqueta(seg(oR.t),M1.X(oR.t)+6,P1.y+22,OK_HEX);
  if(oC.roto) etiqueta(seg(oC.t),M1.X(oC.t)+6,P1.y+44,NARANJA);
  leyenda(P1.x+P1.w-206,P1.y+26,[['en marcha mínima',OK_HEX],['en crucero',NARANJA]]);

  const P2={x:96,y:436,w:580,h:140};
  const M2=ejes(P2,0,tMax,0,1,'segundos','llenado Θ',v=>num(v,1),v=>num(v,1),6,4);
  enCaja(P2,()=>{
    serieXY(M2,oR.pts.map(p=>[p.t,p.th]),OK_HEX,2.2);
    serieXY(M2,oC.pts.map(p=>[p.t,p.th]),NARANJA,2.2);
  });

  const qR=Y_O2*flujoAire(e,e.ralenti,e.cargaRal)*(LAM_INTRUSIVO-1);
  const qC=Y_O2*flujoAire(e,e.rpm,e.carga)*(LAM_INTRUSIVO-1);
  let y=146;
  y=tablaDer(y,['','mínima','crucero'],[
    {v:['aire',num(flujoAire(e,e.ralenti,e.cargaRal),1),num(flujoAire(e,e.rpm,e.carga),1)]},
    {v:['O₂ sobrante g/s',num(qR,3),num(qC,3)]},
    {v:['tiempo medido',oR.roto?num(oR.t,2):'>20',oC.roto?num(oC.t,2):'>20'],b:true,c:CIAN},
  ]);
  y=tablaDer(y+16,['la cuenta',''],[
    {v:['capacidad C',gram(O.C)]},
    {v:['C ÷ O₂ en mínima',seg(O.C/qR)]},
    {v:['razón mínima/crucero',num(oR.t/Math.max(0.001,oC.t),2)+' ×'],b:true},
  ]);
  const razon=oR.t/Math.max(0.001,oC.t);
  banda(Math.max(y+22,626), oR.roto&&oR.t<0.8?'bad':(oR.roto&&oR.t<2?'warn':'ok'),
    'EL MISMO CATALIZADOR DA '+num(razon,1)+' VECES MÁS SEGUNDOS EN MARCHA MÍNIMA',
    'Y no porque en mínima esté mejor: porque le entra '+num(qC/qR,1)+' veces menos oxígeno por segundo. El tiempo es capacidad ENTRE caudal, así que un número de segundos no significa nada si no se dice a qué régimen se tomó. Por eso la prueba se hace siempre en marcha mínima —donde se estira y se distingue— y por eso una lata nueva da '+
      (EDAD_ROT(G.edad).rot==='nuevo'?seg(oR.t):'del orden de tres segundos y medio')+
      ' mientras una agotada da décimas. Cuidado con una cosa: esta medida también entra por la sonda posterior. Si esa sonda va lenta, este cronómetro miente igual que el monitor.');
}

// -------------------------------------------------------------- 4 · ventana
function vistaVentana(){
  const e=MQ(), V=EV(), C=V.cond, T=V.trabajo;
  cabecera('DÓNDE CONVIERTE, Y DÓNDE NO',
    'Dos condiciones a la vez y ninguna es el almacén: hace falta estar dentro de una ventana de mezcla estrechísima Y por encima de la temperatura de encendido. El monitor no mide ninguna de las dos.');

  // Izquierda: la ventana contra λ.
  const P1={x:96,y:150,w:290,h:296};
  const M1=ejes(P1,0.96,1.04,0,100,'λ dentro del catalizador','conversión (%)',
    v=>num(v,2),v=>num(v,0),4,5);
  const co=[],hc=[],nox=[];
  for(let i=0;i<=140;i++){
    const l=0.96+0.08*i/140;
    co.push([l,100*etaOx(l)*fT(e.tCat+(C.dTcat||0),T50_CO+(C.dT50||0))*(C.saludOx===undefined?1:C.saludOx)]);
    hc.push([l,100*etaOx(l)*fT(e.tCat+(C.dTcat||0),T50_HC+(C.dT50||0))*(C.saludOx===undefined?1:C.saludOx)]);
    nox.push([l,100*etaRed(l)*fT(e.tCat+(C.dTcat||0),T50_NOX+(C.dT50||0))*(C.saludRed===undefined?1:C.saludRed)]);
  }
  enCaja(P1,()=>{
    serieXY(M1,co,GAS_COL.CO,2.2); serieXY(M1,hc,GAS_COL.HC,2.2); serieXY(M1,nox,GAS_COL.NOx,2.2);
    nivelV(P1,M1,1,'#4a5668',null,[4,4]);
    bx.save(); bx.fillStyle='rgba(90,209,230,0.10)';
    bx.fillRect(M1.X(1-T.ampLam),P1.y,M1.X(1+T.ampLam)-M1.X(1-T.ampLam),P1.h); bx.restore();
  });
  etiqueta('lo que oscila la mezcla',M1.X(1+T.ampLam)+6,P1.y+20,CIAN);
  leyenda(P1.x+14,P1.y+26,[['CO',GAS_COL.CO],['HC',GAS_COL.HC],['NOx',GAS_COL.NOx]]);

  // Derecha: el encendido contra temperatura.
  const P2={x:452,y:150,w:224,h:296};
  const M2=ejes(P2,350,850,0,100,'temperatura de la lata (K)','',
    v=>num(v,0),null,4,5);
  const eco=[],ehc=[],enox=[];
  for(let i=0;i<=120;i++){
    const T2=350+500*i/120;
    eco.push([T2,100*fT(T2,T50_CO+(C.dT50||0))*(C.saludOx===undefined?1:C.saludOx)*etaOx(1)]);
    ehc.push([T2,100*fT(T2,T50_HC+(C.dT50||0))*(C.saludOx===undefined?1:C.saludOx)*etaOx(1)]);
    enox.push([T2,100*fT(T2,T50_NOX+(C.dT50||0))*(C.saludRed===undefined?1:C.saludRed)*etaRed(1)]);
  }
  enCaja(P2,()=>{
    serieXY(M2,eco,GAS_COL.CO,2.2); serieXY(M2,ehc,GAS_COL.HC,2.2); serieXY(M2,enox,GAS_COL.NOx,2.2);
    nivelV(P2,M2,e.tCat+(C.dTcat||0),CIAN,null,[5,4]);
  });
  etiqueta('está a '+kel(e.tCat+(C.dTcat||0)),M2.X(e.tCat+(C.dTcat||0))-6,P2.y+P2.h-14,CIAN,'right');

  const lim=limites(G.metodo,e.anio);
  let y=150;
  y=tablaDer(y,['conversión','%'],[
    {v:['CO',num(100*T.etaCO,1)],c:GAS_COL.CO},
    {v:['HC',num(100*T.etaHC,1)],c:GAS_COL.HC},
    {v:['NOx',num(100*T.etaNOx,1)],c:GAS_COL.NOx},
  ]);
  y=tablaDer(y+14,['por el tubo','medido','límite'],[
    {v:['CO %',num(V.gases.CO,3),num(lim.CO,1)],c:V.din.includes('CO')?BAD_HEX:TINTA},
    {v:['HC ppm',num(V.gases.HC,0),num(lim.HC,0)],c:V.din.includes('HC')?BAD_HEX:TINTA},
    {v:['NOx ppm',num(V.gases.NOx,0),lim.NOx===null?'—':num(lim.NOx,0)],
      c:V.din.includes('NOx')?BAD_HEX:TINTA},
  ]);
  const efNox=T.etaNOx, efOx=T.etaCO;
  const divorcio=Math.abs(efNox-efOx)>0.25;
  banda(Math.max(y+22,516), V.din.length?'bad':'ok',
    divorcio
      ? 'LOS TRES GASES NO SE CAEN JUNTOS'
      : (V.din.length?'POR EL TUBO SALE MÁS DE LO QUE LA NORMA ADMITE':'LOS TRES DENTRO DE LÍMITE'),
    divorcio
      ? 'Convierte el '+pcc(100*ox)+' del CO y el '+pcc(100*nox)+' del NOx. No son el mismo trabajo ni lo hace el mismo metal: oxidar CO e hidrocarburos lo hacen el platino y el paladio y necesita oxígeno; reducir el NOx lo hace el RODIO y necesita justo lo contrario. Por eso la ventana es tan estrecha —hay que hacer las dos cosas a la vez— y por eso hay venenos que se llevan una y dejan la otra. Mira ahora contra qué método se está juzgando este coche: si es el estático, el NOx ni siquiera tiene límite.'
      : 'A '+kel(e.tCat+(C.dTcat||0))+' y con la mezcla oscilando ±'+num(T.ampLam,4)+' alrededor de uno, la lata convierte '+pcc(100*T.etaCO)+' del CO, '+pcc(100*T.etaHC)+' de los hidrocarburos y '+pcc(100*T.etaNOx)+' del NOx. Baja la temperatura por debajo del encendido y las tres curvas se caen a la vez sin que el almacén pierda ni un gramo de capacidad: un catalizador frío no convierte y NO enciende ningún código de eficiencia.');
}

// -------------------------------------------------------------- 5 · monitor
function vistaMonitor(){
  const e=MQ(), V=EV(), B=barridoEdad(), lim=limites('dinamico',e.anio);
  cabecera('EL UMBRAL NO ES FÍSICA: ES UNA CALIBRACIÓN',
    'El monitor mide oxígeno guardado y la ley mide hidrocarburos por el tubo. El umbral es el número que hace que las dos cosas salten en el mismo sitio — y ese sitio es 1,5 veces el límite de la norma, no el límite.');

  const P1={x:96,y:150,w:580,h:308};
  const M1=ejes(P1,0,0.85,0,1.0,'edad del catalizador','índice de la sonda posterior',
    v=>num(v,1),v=>num(v,1),5,5);
  nivel(P1,M1,INDICE_UMBRAL,BAD_HEX,'umbral '+num(INDICE_UMBRAL,2),[6,5]);
  enCaja(P1,()=>{
    serieXY(M1,B.map(p=>[p.a,p.indice]),NARANJA,2.6);
    // El HC de cola en el mismo cuadro, con su propia escala.
    const hcMax=Math.max(300,1.7*lim.HC);
    serieXY(M1,B.map(p=>[p.a,clamp(p.HC/hcMax,0,1.02)]),AZUL,2.2,[7,4]);
    const yLim=M1.Y(lim.HC/hcMax), y15=M1.Y(1.5*lim.HC/hcMax);
    linea([[P1.x,yLim],[P1.x+P1.w,yLim]],AZUL,1.3,[3,4]);
    linea([[P1.x,y15],[P1.x+P1.w,y15]],AZUL,1.3,[3,4]);
    punteo(M1,G.edad,clamp(V.prueba.indice,0,1.02),CIAN,5.5);
  });
  const hcMax=Math.max(300,1.7*lim.HC);
  etiqueta('límite de la norma '+num(lim.HC,0)+' ppm',P1.x+10,M1.Y(lim.HC/hcMax)-6,AZUL);
  etiqueta('1,5 × el límite: aquí se calibra',P1.x+10,M1.Y(1.5*lim.HC/hcMax)-6,AZUL);
  leyenda(P1.x+P1.w-238,P1.y+26,[['índice del monitor',NARANJA],['HC por el tubo',AZUL,[7,4]]]);

  // La banda que la reglamentación deja abierta a propósito.
  let a0=null,a1=null;
  for(const p of B){ if(p.HC>lim.HC&&a0===null) a0=p.a; if(p.indice>INDICE_UMBRAL&&a1===null) a1=p.a; }
  if(a0!==null&&a1!==null&&a1>a0){
    bx.save(); bx.fillStyle='rgba(233,196,106,0.13)';
    bx.fillRect(M1.X(a0),P1.y,M1.X(a1)-M1.X(a0),P1.h); bx.restore();
    etiqueta('reprueba con el testigo apagado',M1.X(a0)+6,P1.y+P1.h-12,WARN_HEX);
  }

  let y=150;
  const T=V.prueba;
  y=tablaDer(y,['este coche, ahora',''],[
    {v:['índice medido',num(T.indice,3)],b:true,c:T.indice>INDICE_UMBRAL?BAD_HEX:OK_HEX},
    {v:['umbral',num(INDICE_UMBRAL,2)],c:GRIS},
    {v:['sonda posterior media',volt(T.vPostMed)]},
    {v:['almacenamiento',V.osc.roto?seg(V.osc.t):'> 20 s']},
  ]);
  y=tablaDer(y+14,['veredicto',''],[
    {v:['código',V.dtc||'ninguno'],b:true,c:V.dtc?BAD_HEX:OK_HEX},
    {v:['testigo de averías',V.dtc?'ENCENDIDO':'apagado'],c:V.dtc?BAD_HEX:OK_HEX},
    {v:['NOM-041 '+MET_CORTO[G.metodo],
      (G.metodo==='dinamico'?V.apruebaDin:V.apruebaEst)?'aprueba':'RECHAZA'],b:true,
      c:(G.metodo==='dinamico'?V.apruebaDin:V.apruebaEst)?OK_HEX:BAD_HEX},
  ]);
  const desac=V.falsoPositivo||V.falsoNegativo;
  banda(Math.max(y+20,522), desac?'bad':(V.enLaBanda?'warn':'ok'),
    V.falsoPositivo?'EL ORDENADOR ACUSA A UN CATALIZADOR QUE ESTÁ LIMPIO'
      :(V.falsoNegativo?'EL COCHE CONTAMINA Y EL ORDENADOR NO DICE NADA'
      :(V.enLaBanda?'REPRUEBA, Y EL TESTIGO ESTÁ APAGADO POR DISEÑO':'LOS DOS INSTRUMENTOS DICEN LO MISMO')),
    V.falsoPositivo
      ? 'Índice '+num(T.indice,3)+', por encima del umbral: P0420. Y por el tubo salen '+ppm(V.gases.HC)+' de hidrocarburos con el límite en '+ppm(lim.HC)+'. El catalizador está bien; lo que está mal es alguna de las cosas que hay ENTRE el catalizador y el juicio que se hace sobre él. Cambiarlo costaría lo que cuesta y el código volvería.'
      : V.falsoNegativo
      ? 'No hay código, el testigo está apagado, y por el tubo salen '+ppm(V.gases.HC)+' de hidrocarburos y '+ppm(V.gases.NOx)+' de NOx. El monitor mide el almacén de oxígeno, y en este caso el almacén está intacto mientras lo que convierte NO lo está. La correlación en la que el monitor se apoya se ha roto, y el monitor no tiene forma de enterarse.'
      : V.enLaBanda
      ? 'Por el tubo salen '+ppm(V.gases.HC)+' con el límite en '+ppm(lim.HC)+': el coche reprueba. Y el testigo está apagado, porque el monitor está calibrado a '+ppm(1.5*lim.HC)+' y todavía no ha llegado. Esa franja amarilla NO es una avería del sistema: es lo que la reglamentación de diagnóstico a bordo pide, y existe en todos los coches. Un coche puede reprobar la verificación con el tablero limpio, y esto es por qué.'
      : 'Índice '+num(T.indice,3)+' contra un umbral de '+num(INDICE_UMBRAL,2)+', y '+ppm(V.gases.HC)+' de HC contra un límite de '+ppm(lim.HC)+'. Sube la edad y verás las dos curvas cruzar sus rayas casi a la vez: eso no es una coincidencia física, es que el umbral se ELIGIÓ para que pasara. Mueve ahora una avería que toque sólo una de las dos y mira cómo se separan.');
}

// ---------------------------------------------------------------- 6 · censo
function vistaCenso(){
  const e=MQ(), C=CENSO();
  cabecera('LAS 45 CELDAS',
    'Nueve averías por cinco edades de catalizador. Arriba lo que dice el ordenador, abajo lo que dice la NOM-041 por el método dinámico. Las celdas donde no coinciden son las que este laboratorio existe para enseñar.');

  const X0=196, Y0=166, CW=148, CH=46;
  // Cabecera de columnas.
  EDADES.forEach((E,j)=>{
    texto(E.rot,X0+CW*j+CW/2,Y0-24,{s:13,b:true,c:'#9aa6b6',al:'center'});
    texto(kmF(E.km),X0+CW*j+CW/2,Y0-8,{s:11,c:'#5f6b7c',al:'center'});
  });
  C.filas.forEach((f,i)=>{
    const yy=Y0+CH*i;
    texto(corta(f.corto,17),X0-12,yy+CH/2+4,{s:12.5,c:'#c3ccd8',al:'right'});
    f.celdas.forEach((c,j)=>{
      const xx=X0+CW*j;
      const mal=c.fp||c.fn;
      rpanel(xx+3,yy+3,CW-6,CH-6,
        c.fp?'rgba(255,107,107,0.20)':(c.fn?'rgba(233,196,106,0.17)':'rgba(255,255,255,0.030)'),
        mal?(c.fp?BAD_HEX:WARN_HEX):'#1c2635',7);
      texto(c.dtc||'—',xx+CW/2,yy+21,{s:12,b:true,al:'center',
        c:c.dtc==='P0420'?BAD_HEX:(c.dtc?WARN_HEX:'#5f6b7c')});
      texto(c.din.length?c.din.join('+'):'aprueba',xx+CW/2,yy+38,
        {s:11.5,al:'center',c:c.din.length?NARANJA:OK_HEX});
    });
  });
  // Marca dónde está el coche que se está mirando.
  {
    const j=EDADES.findIndex(E=>Math.abs(E.a-G.edad)<1e-6);
    const i=FALLA_KEYS.indexOf(G.falla);
    if(j>=0&&i>=0){
      bx.save(); bx.strokeStyle=CIAN; bx.lineWidth=2.2;
      bx.strokeRect(X0+CW*j+1,Y0+CH*i+1,CW-2,CH-2); bx.restore();
    }
  }
  const y=Y0+CH*C.filas.length+16;
  texto('rojo: el ordenador acusa y por el tubo no sale nada     ·     ámbar: por el tubo sale de más y el ordenador calla',
    42,y+4,{s:12,c:'#7b8697'});
  // Un coche SIN monitor no se equivoca: es que no opina. Contar sus celdas
  // sucias como fallos del ordenador sería acusar a un sistema que no existe, y
  // el número que sale —38 de 45— parecería un desastre cuando lo que dice es
  // otra cosa: que para ese coche el escáner no es una fuente de información.
  if(!e.sondaPost)
    banda(y+16,'warn','ESTE COCHE NO TIENE MONITOR: NO SE EQUIVOCA, NO OPINA',
      'Todas las casillas de arriba están vacías porque sin sonda posterior no hay nada que comparar. En '+num(C.fn,0)+' de las '+num(C.total,0)+' celdas el coche reprueba por el tubo, y en ninguna de ellas habría un código que avisara. Para un vehículo así el escáner no es una segunda opinión: es un instrumento que no existe, y el analizador de gases es toda la evidencia disponible. Compáralo con los otros tres del banco, donde el ordenador sí opina — y a veces se equivoca.');
  else
    banda(y+16, C.mal>0?'bad':'ok',
      'DE '+num(C.total,0)+' CELDAS, EL ORDENADOR SE EQUIVOCA EN '+num(C.mal,0),
      num(C.fp,0)+' veces acusa a un catalizador que por el tubo va limpio, y '+num(C.fn,0)+' veces se calla con un coche que reprueba. Ninguno de esos dos números está escrito en el modelo: salen de recorrer la rejilla y comparar los dos veredictos celda por celda. La conclusión práctica no es que el monitor sea malo —acierta en '+num(C.total-C.mal,0)+' de '+num(C.total,0)+'—, sino que un P0420 es una PISTA sobre el almacén de oxígeno, no un diagnóstico sobre el catalizador. Y que la ausencia de código no es un certificado de nada.');
}

// ----------------------------------------------------------------- 7 · reto
function vistaReto(){
  const e=MQ();
  cabecera('DIAGNÓSTICO A CIEGAS',
    'Llega un coche. No se dice qué tiene ni qué edad tiene su catalizador. Están los tres instrumentos: el escáner, la prueba de almacenamiento y el analizador de gases. Con ellos hay que decidir qué hay que cambiar.');

  if(!RETO.medido.escaner&&!RETO.medido.osc&&!RETO.medido.gases){
    rpanel(96,180,BW-192,300,'rgba(255,255,255,0.030)','#1e2836',12);
    texto('No hay ninguna medida todavía.',BW/2,268,{s:20,b:true,al:'center'});
    wrapText('Los tres instrumentos están en el panel de la derecha. Cada uno cuesta lo que cuesta en tiempo de taller, y cada uno enseña una cosa distinta. Empieza por el que quieras.',
      BW/2-260,300,520,22,{s:14,al:'left'});
    texto('Y una advertencia: dos de los tres pasan por la sonda posterior.',BW/2,392,
      {s:14,b:true,al:'center',c:WARN_HEX});
    banda(500,'warn','TRES INSTRUMENTOS, TRES COSAS DISTINTAS',
      'El escáner dice qué códigos hay guardados y qué índice midió el monitor. La prueba de almacenamiento cronometra cuánto oxígeno guarda la lata. El analizador mide lo que sale por el tubo, que es lo único que la ley juzga. Si los tres coincidieran no haría falta este laboratorio.');
    return;
  }

  const V=RETO.V, y0=170;
  let y=y0;
  const filas=[];
  if(RETO.medido.escaner){
    filas.push({v:['código guardado',V.dtc||'ninguno'],b:true,
      c:V.dtc==='P0420'?BAD_HEX:(V.dtc?WARN_HEX:OK_HEX)});
    filas.push({v:['índice del monitor',num(V.prueba.indice,3)],
      c:V.prueba.indice>INDICE_UMBRAL?BAD_HEX:TINTA});
    filas.push({v:['sonda posterior, media',volt(V.prueba.vPostMed)]});
    filas.push({v:['sonda posterior, recorrido',volt(V.prueba.ampPost)]});
    filas.push({v:['sonda anterior, periodo',seg(V.trabajo.periodo)]});
  }
  if(RETO.medido.osc)
    filas.push({v:['almacenamiento en mínima',V.osc.roto?seg(V.osc.t):'> 20 s'],b:true,c:CIAN});
  if(RETO.medido.gases){
    const lim=limites(G.metodo,e.anio);
    filas.push({v:['CO por el tubo',pcv(V.gases.CO,3)+'  (≤ '+num(lim.CO,1)+')'],
      c:V.din.includes('CO')?BAD_HEX:TINTA});
    filas.push({v:['HC por el tubo',ppm(V.gases.HC)+'  (≤ '+num(lim.HC,0)+')'],
      c:V.din.includes('HC')?BAD_HEX:TINTA});
    filas.push({v:['NOx por el tubo',ppm(V.gases.NOx)+
      (lim.NOx===null?'  (sin límite)':'  (≤ '+num(lim.NOx,0)+')')],
      c:V.din.includes('NOx')?BAD_HEX:TINTA});
  }
  const cols=[{t:'lo que has medido',w:420},{t:'',w:250,al:'right'}];
  y=tabla(100,y,cols,filas,{rh:31,s:15,gap:16});

  // Si ya midió el escáner, se le enseña la traza: es lo que un osciloscopio da.
  if(RETO.medido.escaner){
    const T=V.trabajo;
    const P1={x:100,y:Math.max(y+20,430),w:BW-200,h:150};
    if(P1.y+P1.h<BH-120){
      const M1=ejes(P1,0,18,0,1.0,'segundos','V',v=>num(v,0),v=>num(v,1),6,4);
      nivel(P1,M1,V_UMBRAL,'#4a5668',null,[6,5]);
      enCaja(P1,()=>{
        serieXY(M1,T.pts.map(p=>[p.t,p.vPre]),CIAN,1.8);
        serieXY(M1,T.pts.map(p=>[p.t,p.vPost]),NARANJA,2.2);
      });
      leyenda(P1.x+14,P1.y+24,[['anterior',CIAN],['posterior',NARANJA]]);
      y=P1.y+P1.h+56;
    }
  }
  if(RETO.veredicto)
    banda(Math.max(y,BH-160),RETO.veredicto.ok?'ok':'bad',
      RETO.veredicto.ok?'ACERTASTE':'FALLASTE',RETO.veredicto.texto);
}

// ================================== T3 · EL BANCO: LA LÍNEA DE ESCAPE EN ALTO
// La escena no es decorado: es el argumento. Lo que este laboratorio discute es
// dónde está cada sonda y qué hay entre ellas, y eso hay que VERLO — la de
// delante en el colector, la lata en medio, la de detrás pasada la lata, y el
// agujero por el que entra aire cuando lo hay.

// El aviso flotante. La clase es `show`, NO `on`: la única regla que la hoja de
// estilo declara sobre el aviso es `.toast.show{opacity:1}`, y `.toast` nace con
// `opacity:0`. Con cualquier otra clase el texto se escribe, el elemento existe,
// no salta ningún error y NADIE LO VE NUNCA.
let TOAST=null;
function showToast(html,ms){
  const c=el('toast'); if(!c) return;
  c.innerHTML=html; c.classList.add('show');
  if(TOAST) clearTimeout(TOAST);
  TOAST=setTimeout(()=>c.classList.remove('show'),ms||2600);
}

const pon=(o,p)=>{ o.position.set(p[0],p[1],p[2]); return o; };
// Los rótulos vienen escalados para un banco mayor que éste, así que hay que
// encogerlos. Y cada uno deja su texto en ROTULOS: un sprite es una textura y de
// una textura no se lee texto, así que ésta es la única forma de comprobar desde
// fuera lo que las chapas del banco DICEN — y de que el 3D no regale la
// respuesta del reto.
const ESC_ROT=0.88;
let ROTULOS=[];
const rot3=(t,c,p)=>{ ROTULOS.push(t); const s=pon(labelSprite(t,c),p);
  s.scale.multiplyScalar(ESC_ROT); return s; };

// Las cotas salen del motor: una línea de escape de 3,5 L no mide lo que una de
// 1,6. Lo que NO puede pasar es que el banco crezca tanto que el pizarrón se
// quede en un rincón, así que el largo crece poco con la cilindrada.
function dims(e){
  // El banco se dibuja a escala DIDÁCTICA, no de taller: un tubo de escape de
  // verdad tiene 5 cm de radio y a la distancia a la que la cámara tiene que
  // ponerse para meter el pizarrón sale a dos píxeles. Lo que aquí importa es
  // que se vea dónde está cada sonda respecto de la lata, y para eso la línea
  // se acorta y se engorda. Las proporciones ENTRE piezas sí se respetan.
  const largo=2.50+e.cilindrada*0.16;
  const lata=0.70+e.cilindrada*0.050;
  const xCol=-largo/2, xCola=largo/2;
  const xLata=xCol+largo*0.40;
  const xPre=xLata-lata/2-0.34, xPost=xLata+lata/2+0.34;
  const xSil=xCol+largo*0.80;
  return { largo, lata, xCol, xCola, xLata, xPre, xPost, xSil,
    yTubo:1.00, yElev:1.74, rTubo:0.085+e.cilindrada*0.010, rLata:0.24+e.cilindrada*0.030,
    xEsc:xCola+0.92, zEsc:-0.80,
    centro:0, xIzq:xCol-0.50, xDer:xCola+1.45 };
}

/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={aluminio:MAT.lata, acero:MAT.acero, cobre:MAT.crom, cromo:MAT.crom,
  chapa:MAT.acero, hierro:MAT.tubo, negro:MAT.cable, goma:MAT.goma,
  blanco:MAT.crom, ceramica:MAT.crom};
/* Una pieza EN CORTE deja ver el REVÉS de su pared del fondo: con una sola cara
   se vuelve transparente por el lado abierto y desaparece al mirarla de frente. */
const corte=(m)=>{ const c=m.clone(); c.side=THREE.DoubleSide; c.__propio=true; return c; };
let banco=null, catM=null, ledEsc=null, humoM=null, fugaM=null;
let preM=null, postM=null;
function construyeBanco(){
  if(banco){ scene.remove(banco); banco.traverse(o=>{
    if(o.geometry) o.geometry.dispose();
    // El material de la lata es propio de ESTA construcción y se muta por
    // fotograma; los del mapa MAT son compartidos y no se tocan aquí.
    if(o.material&&o.material.__propio) o.material.dispose();
  }); }
  banco=new THREE.Group(); scene.add(banco);
  ROTULOS=[];
  catM=null; ledEsc=null; humoM=null; fugaM=null; preM=null; postM=null;
  const e=MQ(), d=dims(e), V=EV();

  // ---- el suelo del taller y las columnas del elevador
  {
    const suelo=new THREE.Mesh(new THREE.PlaneGeometry(26,20),
      std({color:0x161b22,roughness:0.96,metalness:0.02}));
    suelo.rotation.x=-Math.PI/2; suelo.position.y=-0.01; suelo.receiveShadow=true;
    banco.add(suelo);
    for(const sx of [-1,1]) for(const sz of [-1,1]){
      const c=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.11,d.yElev,14),MAT.acero);
      c.position.set(d.centro+sx*(d.largo*0.42),d.yElev/2,sz*0.86);
      c.castShadow=true; banco.add(c);
    }
    // El coche va en alto sobre DOS LARGUEROS, no sobre una chapa maciza: una
    // chapa tapa la línea de escape entera desde el encuadre que este
    // laboratorio necesita, y lo que hay que ver es justo lo que hay debajo.
    for(const sz of [-1,1]){
      const lg=roundedBox(d.largo*1.02,0.12,0.20,MAT.chasis,0.05);
      lg.position.set(d.centro,d.yElev,sz*0.82); lg.castShadow=true; banco.add(lg);
    }
    for(let i=0;i<3;i++){
      const tr=roundedBox(0.16,0.10,1.64,MAT.acero,0.03);
      tr.position.set(d.centro+(i-1)*d.largo*0.40,d.yElev-0.01,0); banco.add(tr);
    }
  }

  // ---- la línea de escape, una por banco
  const zBancos=e.bancos===2?[-0.46,0.46]:[0];
  zBancos.forEach((zb,ib)=>{
    const tub=(x0,x1,z)=>{
      const L=Math.abs(x1-x0);
      const m=new THREE.Mesh(new THREE.CylinderGeometry(d.rTubo,d.rTubo,L,20),MAT.tubo);
      m.rotation.z=Math.PI/2; m.position.set((x0+x1)/2,d.yTubo,z);
      m.castShadow=true; banco.add(m); return m;
    };
    // colector
    {
      const col=roundedBox(0.36,0.44,0.52,MAT.acero,0.06);
      col.position.set(d.xCol,d.yTubo+0.14,zb); col.castShadow=true; banco.add(col);
      for(let i=0;i<3;i++){
        const r=new THREE.Mesh(new THREE.CylinderGeometry(0.048,0.048,0.36,12),MAT.acero);
        r.position.set(d.xCol-0.05+i*0.07,d.yTubo+0.46,zb-0.15+i*0.15);
        banco.add(r);
      }
    }
    tub(d.xCol+0.16,d.xLata-d.lata/2,zb);
    tub(d.xLata+d.lata/2,d.xSil-0.34,zb);
    // la lata
    {
      /* LA LATA, EN CORTE. Cerrada es un bote, y un bote no dice por qué
         convierte ni por qué se estropea. Abierta se ve el MONOLITO: un panal
         de miles de canales rectos que da una superficie enorme sin ahogar el
         escape. Cuando se sobrecalienta, esos canales se cierran —y eso es
         exactamente lo que el laboratorio pide diagnosticar—. */
      const cuerpo=new THREE.Mesh(P3.revolucion([
        [d.rLata*0.94,-d.lata/2],[d.rLata,-d.lata/2],
        [d.rLata,d.lata/2],[d.rLata*0.94,d.lata/2]],
        {seg:30,fase:Math.PI*0.29,arco:Math.PI*1.42}),corte(MAT.lata));
      cuerpo.rotation.z=Math.PI/2; cuerpo.position.set(d.xLata,d.yTubo,zb);
      cuerpo.castShadow=true; banco.add(cuerpo);
      for(const s of [-1,1]){
        const c=new THREE.Mesh(new THREE.ConeGeometry(d.rLata,0.26,26,1,true),MAT.lata);
        c.rotation.z=s*Math.PI/2; c.position.set(d.xLata+s*(d.lata/2+0.13),d.yTubo,zb);
        banco.add(c);
      }
      // El panal, visible por el corte. Su material es PROPIO: se le cambia el
      // brillo por fotograma según si la lata está encendida, y mutar uno
      // compartido teñiría media escena.
      const mp=std({color:0x2a3038,roughness:0.92,metalness:0.02});
      mp.__propio=true;
      const panal=P3.monolito({ceramica:mp,acero:MAT.lata},
        {r:d.rLata*0.90,largo:d.lata*0.92,celdas:11,carcasa:false});
      panal.rotation.y=Math.PI/2; panal.position.set(d.xLata,d.yTubo,zb);
      banco.add(panal);
      // `catM` sólo tiene que llevar el material: todas las paredes comparten
      // `mp`, así que repintarlo por una de ellas las repinta todas.
      if(ib===0) panal.traverse(o=>{ if(o.isMesh && !catM) catM=o; });
    }
    // el silenciador y la cola
    {
      const sil=roundedBox(0.72,0.34,0.46,MAT.lata,0.14);
      sil.position.set(d.xSil,d.yTubo,zb); sil.castShadow=true; banco.add(sil);
      tub(d.xSil+0.34,d.xCola,zb);
      const p=new THREE.Mesh(new THREE.CylinderGeometry(d.rTubo*1.35,d.rTubo*1.25,0.18,20),MAT.crom);
      p.rotation.z=Math.PI/2; p.position.set(d.xCola+0.06,d.yTubo,zb); banco.add(p);
    }
    // las dos sondas
    const sonda=(x,rot,col)=>{
      const g=new THREE.Group();
      /* LA SONDA, con su tubo de protección ranurado: el gas tiene que llegar
         al elemento de circonio, pero el elemento no puede recibir el chorro
         directo ni el agua de condensación. Esas ranuras SON la pieza. */
      const so=P3.sondaLambda({...MATP,acero:MAT.sonda,negro:MAT.cable,cromo:MAT.crom},
        {d:0.16,largo:0.62});
      so.position.y=0.30; so.traverse(o=>{if(o.isMesh)o.castShadow=true;}); g.add(so);
      g.position.set(x,d.yTubo+d.rTubo,zb);
      g.castShadow=true; banco.add(g);
      if(ib===0) banco.add(rot3(rot,col,[x,d.yTubo+0.62,zb]));
      return g;
    };
    const p1=sonda(d.xPre,'sonda anterior',CIAN);
    const p2=e.sondaPost?sonda(d.xPost,'sonda posterior',NARANJA):null;
    if(ib===0){ preM=p1; postM=p2; }
    if(ib===0){
      banco.add(rot3(e.bancos===2?'catalizador · banco 1':'catalizador de tres vías',
        OK_HEX,[d.xLata,d.yTubo-0.52,zb]));
      if(!e.sondaPost)
        banco.add(rot3('sin sonda posterior: no hay monitor',WARN_HEX,[d.xPost,d.yTubo+0.54,zb]));
    }
    // La fuga, cuando la hay: un agujero entre la lata y la sonda de detrás. Se
    // ve porque es exactamente lo que el laboratorio discute.
    if(ib===0&&(G.falla==='fugaChica'||G.falla==='fugaGrande')&&G.modo!=='reto'){
      const r=G.falla==='fugaGrande'?0.048:0.026;
      const ag=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),
        std({color:0x0a0d12,roughness:1,metalness:0}));
      ag.position.set((d.xLata+d.lata/2+d.xPost)/2,d.yTubo-d.rTubo*0.7,zb);
      banco.add(ag);
      const mm=std({color:0xbfd6e6,transparent:true,opacity:0.22,roughness:1,metalness:0});
      mm.__propio=true;
      fugaM=new THREE.Mesh(new THREE.ConeGeometry(r*2.6,0.30,12,1,true),mm);
      fugaM.position.set(ag.position.x,d.yTubo-0.22,zb);
      fugaM.rotation.x=Math.PI; banco.add(fugaM);
    }
  });

  // ---- el escáner sobre su pie
  {
    const pie=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.26,0.06,20),MAT.acero);
    pie.position.set(d.xEsc,0.03,d.zEsc); banco.add(pie);
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,1.24,14),MAT.acero);
    mast.position.set(d.xEsc,0.65,d.zEsc); banco.add(mast);
    const caja=roundedBox(0.50,0.62,0.10,MAT.caja,0.04);
    caja.position.set(d.xEsc,1.42,d.zEsc); caja.rotation.y=-0.5;
    caja.castShadow=true; banco.add(caja);
    const pan=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.50),
      new THREE.MeshBasicMaterial({map:panTex,toneMapped:false}));
    pan.position.set(d.xEsc+0.052*Math.cos(-0.5),1.42,d.zEsc-0.052*Math.sin(-0.5));
    pan.rotation.y=-0.5; banco.add(pan);
    ledEsc=new THREE.Mesh(new THREE.SphereGeometry(0.030,14,10),MAT.apag);
    ledEsc.position.set(d.xEsc-0.19*Math.cos(-0.5),1.72,d.zEsc+0.19*Math.sin(-0.5));
    banco.add(ledEsc);
    banco.add(rot3('escáner de diagnóstico',CIAN,[d.xEsc,1.92,d.zEsc]));
  }

  // ---- el humo de la cola, tan opaco como sucio salga
  {
    const sucio=clamp(V.gases.HC/900,0.02,1);
    const mh=std({color:0x9aa6b6,transparent:true,opacity:0.10+0.26*sucio,
      roughness:1,metalness:0});
    mh.__propio=true;
    humoM=new THREE.Mesh(new THREE.ConeGeometry(0.16,0.70,14,1,true),mh);
    humoM.rotation.z=-Math.PI/2;
    humoM.position.set(d.xCola+0.46,d.yTubo,zBancos[0]);
    humoM.visible=true; banco.add(humoM);
  }
  colocaTablero(d);
}

// ---- la pantalla del escáner, en su propio lienzo
const panCv=document.createElement('canvas'); panCv.width=512; panCv.height=608;
const panCtx=panCv.getContext('2d');
const panTex=new THREE.CanvasTexture(panCv);
panTex.colorSpace=THREE.SRGBColorSpace;
let panFirma='';
function pintaPanel(){
  if(!panCtx) return;
  const W=512,H=608,c=panCtx;
  const P=publicaEscaner();
  const firma=JSON.stringify(P);
  if(firma===panFirma) return;
  panFirma=firma;
  c.fillStyle='#060a0f'; c.fillRect(0,0,W,H);
  c.strokeStyle='#16202c'; c.lineWidth=1; c.strokeRect(8,8,W-16,H-16);
  c.textAlign='left';
  if(!P.enciende){
    c.fillStyle='#9aa6b6'; c.font='600 22px Inter,system-ui,sans-serif';
    c.textAlign='center'; c.fillText('escáner en espera',W/2,H/2-10);
    c.font='500 16px Inter,system-ui,sans-serif';
    c.fillText('conéctalo para leer los códigos',W/2,H/2+22);
    c.textAlign='left'; panTex.needsUpdate=true; return;
  }
  c.fillStyle='#7b8697'; c.font='600 15px Inter,system-ui,sans-serif';
  c.fillText('MODO $03 · CÓDIGOS GUARDADOS',24,44);
  c.font='700 30px Inter,system-ui,sans-serif';
  c.fillStyle=P.dtc?(P.dtc.charAt(1)==='0'&&P.dtc.slice(0,5)!=='P2270'?'#ff6b6b':'#e9c46a'):'#7cd992';
  c.fillText(P.dtc||'sin códigos',24,86);
  c.font='500 14px Inter,system-ui,sans-serif'; c.fillStyle='#9aa6b6';
  c.fillText(P.motivo,24,112);

  c.strokeStyle='#16202c'; c.beginPath(); c.moveTo(24,134); c.lineTo(W-24,134); c.stroke();
  c.fillStyle='#7b8697'; c.font='600 15px Inter,system-ui,sans-serif';
  c.fillText('MODO $06 · MONITOR DEL CATALIZADOR',24,164);
  let y=200;
  const fila=(r,v,col)=>{
    c.fillStyle='#9aa6b6'; c.font='500 16px Inter,system-ui,sans-serif'; c.fillText(r,26,y);
    c.fillStyle=col||'#e8eef6'; c.font='700 18px Inter,system-ui,sans-serif';
    c.textAlign='right'; c.fillText(v,W-26,y); c.textAlign='left';
    y+=34;
  };
  fila('índice medido',P.indice,P.malIndice?'#ff6b6b':'#7cd992');
  fila('límite',P.umbral,'#7b8697');
  fila('sonda posterior, media',P.vPost);
  fila('sonda posterior, recorrido',P.ampPost);
  fila('sonda anterior, periodo',P.periodo);
  y+=6;
  c.strokeStyle='#16202c'; c.beginPath(); c.moveTo(24,y-16); c.lineTo(W-24,y-16); c.stroke();
  c.fillStyle='#7b8697'; c.font='600 15px Inter,system-ui,sans-serif';
  c.fillText('MODO $01 PID $01 · MONITORES',24,y+8); y+=42;
  for(const m of P.monitores){
    c.fillStyle=m[1]?'#7cd992':'#e9c46a'; c.font='700 15px Inter,system-ui,sans-serif';
    c.fillText(m[1]?'✓':'·',26,y);
    c.fillStyle='#9aa6b6'; c.font='500 15px Inter,system-ui,sans-serif';
    c.fillText(m[0],50,y);
    c.textAlign='right'; c.fillStyle=m[1]?'#7cd992':'#e9c46a';
    c.fillText(m[1]?'completo':'incompleto',W-26,y); c.textAlign='left';
    y+=26;
  }
  panTex.needsUpdate=true;
}

let RELOJ=0, PINTADAS=0;
function pinta3D(dt){
  RELOJ+=dt; PINTADAS++;
  const V=EV();
  if(ledEsc) ledEsc.material=!publicaEscaner().enciende?MAT.apag
    :(V.dtc?(V.dtc==='P0420'||V.dtc==='P0430'?MAT.bad:MAT.avi):MAT.ok);
  if(humoM){
    humoM.material.opacity=(0.10+0.26*clamp(V.gases.HC/900,0.02,1))*(0.78+0.22*Math.sin(RELOJ*3.1));
    humoM.scale.y=1+0.10*Math.sin(RELOJ*2.3);
  }
  if(fugaM) fugaM.material.opacity=0.16+0.10*Math.sin(RELOJ*4.2);
  if(catM){
    // La lata se pone al rojo cuando ha encendido. Se muta con setHex, no con un
    // THREE.Color nuevo: esto corre en cada fotograma.
    const enc=(MQ().tCat+(V.cond.dTcat||0))>T50_CO+(V.cond.dT50||0);
    catM.material.emissive.setHex(enc?0x3a1e08:0x000000);
    catM.material.emissiveIntensity=enc?0.55:0;
  }
  pintaPanel();
}

// =========================================== T4a · HUD, MANDOS Y TELEMETRÍA
const MODES=['sondas','almacen','prueba','ventana','monitor','censo','reto'];
// Rótulos CORTOS para la barra de vistas: con los largos la fila envuelve y los
// botones dejan de medir lo mismo.
const MODE_META={
  sondas:  ['· sondas',   'LAS DOS SEÑALES'],
  almacen: ['· almacén',  'EL DEPÓSITO DE OXÍGENO'],
  prueba:  ['· prueba',   'CUÁNTO GUARDA, EN SEGUNDOS'],
  ventana: ['· ventana',  'DÓNDE CONVIERTE'],
  monitor: ['· monitor',  'EL UMBRAL CONTRA LA LEY'],
  censo:   ['· censo',    'LAS 45 CELDAS'],
  reto:    ['· reto',     'DIAGNÓSTICO A CIEGAS'],
};
const HUD_TXT={
  sondas:'La de delante oscila porque el ordenador la hace oscilar. La de detrás sólo mira. Sube la edad del catalizador y mira cuál de las dos cambia.',
  almacen:'El cerio guarda oxígeno y lo suelta. Mientras el depósito no se llena, por detrás no sale nada — y ésa es la única razón de que la señal de atrás esté plana.',
  prueba:'Se fuerza pobre y se cronometra. El mismo catalizador da cuatro veces más segundos en marcha mínima que en crucero, y eso no es una opinión: es capacidad entre caudal.',
  ventana:'Oxidar pide oxígeno y reducir pide lo contrario, y el rodio es el metal del NOx. Por eso hay venenos que se llevan un gas y dejan los otros dos.',
  monitor:'El umbral está elegido para que salte donde el HC llega a 1,5 veces el límite. Mira la franja donde el coche ya reprueba y el testigo sigue apagado.',
  censo:'Nueve averías por cinco edades. Cuenta las celdas donde el ordenador y la norma no dicen lo mismo.',
  reto:'Llega un coche y no se dice qué tiene. Tres instrumentos, y dos de los tres pasan por la misma sonda.',
};
function pintaHUD(){
  const m=MODE_META[G.modo]||MODE_META.sondas;
  el('hud').innerHTML='<h1>Catalizador · '+m[1]+'</h1><p>'+HUD_TXT[G.modo]+'</p>';
}

// --- el panel de mandos -----------------------------------------------------
el('panel').innerHTML=
  '<h4>Banco de catalizadores</h4>'+
  '<div id="ctrl"></div>'+
  '<div id="retobox" style="display:none">'+
    '<div class="gl" style="margin:9px 0 4px"><span>Instrumentos</span></div>'+
    '<div class="modebar">'+
      '<button class="b auto" id="btnEscaner">Escáner</button>'+
      '<button class="b auto" id="btnOsc">Almacenamiento</button>'+
      '<button class="b auto" id="btnGases">Gases de cola</button>'+
    '</div>'+
    '<div class="gl" style="margin:10px 0 4px"><span>Tu dictamen: qué hay que hacer</span></div>'+
    '<div class="btns" id="dxreto"></div>'+
    '<div class="modebar" style="margin-top:8px">'+
      '<button class="b" id="btnPista">Pista</button>'+
      '<button class="b on" id="btnEntrega">Entregar dictamen</button>'+
      '<button class="b" id="btnOtro">Otro coche</button>'+
    '</div>'+
  '</div>'+
  '<div id="tele"></div>'+
  '<div class="console" id="report"></div>'+
  '<div class="modebar" style="margin-top:10px">'+
    '<button class="b auto" id="btnAuto">▶︎ Recorrido guiado</button>'+
  '</div>'+
  '<h4 class="sec">Comprueba lo que has leído</h4>'+
  '<div id="quiz"></div>';

// Reparto uniforme en filas de como mucho cuatro: nueve opciones en filas de
// cuatro dejan 4/4/1 y la última fila estira un botón de punta a punta. Con el
// reparto uniforme salen 3/3/3 y todos miden lo mismo.
function fila(rot,attr,ops,cur){
  const filas=Math.max(1,Math.ceil(ops.length/4));
  let h='<div class="gl" style="margin:9px 0 4px"><span>'+rot+'</span></div>';
  let i=0;
  for(let f=0;f<filas;f++){
    const n=Math.ceil((ops.length-i)/(filas-f));
    h+='<div class="modebar">'+ops.slice(i,i+n).map(o=>
      '<button class="b'+(String(o[0])===String(cur)?' on':'')+'" '+attr+'="'+o[0]+'">'+o[1]+'</button>'
    ).join('')+'</div>';
    i+=n;
  }
  return h;
}
function syncCtrl(){
  const ciego=(G.modo==='reto');
  let h=fila('Vista','data-mode',MODES.map(m=>[m,MODE_META[m][0]]),G.modo);
  h+=fila('Vehículo','data-maq',ARQ_KEYS.map(k=>[k,ARQ[k].corto]),G.maq);
  // A ciegas NO se ofrecen ni la edad ni la avería: las dos SON la respuesta.
  if(!ciego){
    h+=fila('Edad del catalizador','data-edad',
      EDADES.map(E=>[E.a.toFixed(2),E.rot]),G.edad.toFixed(2));
    h+=fila('Qué más pasa','data-falla',
      FALLA_KEYS.map(k=>[k,corta(FALLAS[k].corto,16)]),G.falla);
  }
  h+=fila('Punto de trabajo','data-punto',
    [['crucero','crucero'],['ralenti','marcha mínima']],G.punto);
  h+=fila('Método de verificación','data-met',
    [['dinamico','dinámico'],['estatico','estático']],G.metodo);
  el('ctrl').innerHTML=h;
  el('retobox').style.display=ciego?'block':'none';
}

// --------------------------------------------- lo que el ESCÁNER publica
// Una sola función decide qué enseña el escáner, y de ella cuelgan la pantalla
// del 3D, el piloto y la lectura del reto. Si la regla viviera en dos sitios,
// uno de los dos acabaría enseñando de más.
function publicaEscaner(){
  const e=MQ();
  if(G.modo==='reto'&&!RETO.medido.escaner)
    return {enciende:false};
  const V=(G.modo==='reto')?RETO.V:EV();
  if(!e.sondaPost)
    return {enciende:true, dtc:null, motivo:'este coche no tiene sistema de diagnóstico a bordo',
      indice:'—', umbral:'—', vPost:'—', ampPost:'—', periodo:'—',
      malIndice:false, monitores:[['catalizador · no existe',false]]};
  return {enciende:true, dtc:V.dtc, motivo:V.motivo,
    indice:num(V.prueba.indice,3), umbral:num(INDICE_UMBRAL,2),
    vPost:volt(V.prueba.vPostMed), ampPost:volt(V.prueba.ampPost),
    periodo:seg(V.trabajo.periodo),
    malIndice:V.prueba.indice>INDICE_UMBRAL,
    monitores:[
      ['catalizador',true],
      ['sondas de oxígeno',true],
      ['calefactores de sonda',true],
      ['fallo de encendido',true],
    ]};
}

// ----------------------------------------------------------------- telemetría
const gl=(l,v,c)=>'<div class="g"><div class="gl"><span>'+l+'</span><b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div></div>';
function pintaTele(){
  const e=MQ(), V=EV(), lim=limites(G.metodo,e.anio);
  let h='';
  if(G.modo==='reto'){
    // A ciegas sólo se enseña lo que ya se ha medido. Ni la edad, ni la avería,
    // ni nada que las delate.
    h+=gl('Vehículo',e.corto+' · '+anioF(e.anio));
    h+=gl('Método',MET_ROT[G.metodo]);
    h+=gl('Sonda posterior',e.sondaPost?'sí':'NO');
    const W=RETO.V;
    if(RETO.medido.escaner){
      h+=gl('Código',W.dtc||'ninguno',W.dtc?'bad':'good');
      h+=gl('Índice del monitor',num(W.prueba.indice,3),
        W.prueba.indice>INDICE_UMBRAL?'bad':'good');
      h+=gl('Periodo de la anterior',seg(W.trabajo.periodo));
    }
    if(RETO.medido.osc) h+=gl('Almacenamiento',W.osc.roto?seg(W.osc.t):'> 20 s');
    if(RETO.medido.gases){
      h+=gl('CO',pcv(W.gases.CO,3),W.din.includes('CO')?'bad':'good');
      h+=gl('HC',ppm(W.gases.HC),W.din.includes('HC')?'bad':'good');
      h+=gl('NOx',ppm(W.gases.NOx),W.din.includes('NOx')?'bad':'good');
    }
    el('tele').innerHTML=h; return;
  }
  const T=V.trabajo;
  h+=gl('Catalizador',EDAD_ROT(G.edad).rot+' · '+kmF(EDAD_ROT(G.edad).km));
  h+=gl('Cerio que queda',pcc(V.cond.ceria*100));
  h+=gl('Capacidad de oxígeno',gram(T.C));
  h+=gl('Almacenamiento medido',V.osc.roto?seg(V.osc.t):'> 20 s');
  h+=gl('Índice de la posterior',num(V.prueba.indice,3),
    V.prueba.indice>INDICE_UMBRAL?'bad':'good');
  h+=gl('Código del ordenador',V.dtc||'ninguno',V.dtc?'bad':'good');
  h+=gl('Conversión CO / HC / NOx',
    num(100*T.etaCO,0)+' / '+num(100*T.etaHC,0)+' / '+num(100*T.etaNOx,0)+' %');
  h+=gl('CO por el tubo',pcv(V.gases.CO,3),V.din.includes('CO')?'bad':'good');
  h+=gl('HC por el tubo',ppm(V.gases.HC)+' / '+num(lim.HC,0),
    (G.metodo==='dinamico'?V.din:V.est).includes('HC')?'bad':'good');
  h+=gl('NOx por el tubo',ppm(V.gases.NOx)+(lim.NOx===null?' / sin límite':' / '+num(lim.NOx,0)),
    (G.metodo==='dinamico'?V.din:V.est).includes('NOx')?'bad':'good');
  h+=gl('NOM-041 '+MET_CORTO[G.metodo],
    (G.metodo==='dinamico'?V.apruebaDin:V.apruebaEst)?'aprueba':'RECHAZA',
    (G.metodo==='dinamico'?V.apruebaDin:V.apruebaEst)?'good':'bad');
  el('tele').innerHTML=h;
}

function pintaInforme(){
  if(G.modo==='reto'){ pintaReto(); return; }
  const e=MQ(), V=EV(), ver=veredicto();
  let h='<b>'+e.nombre+'.</b> ';
  h+='Catalizador '+EDAD_ROT(G.edad).rot+', '+FL().rot+'. ';
  if(!e.sondaPost)
    h+='Sin sonda posterior no hay monitor de catalizador: para este coche el único instrumento que existe es el tubo de escape.';
  else if(V.falsoPositivo)
    h+='<b class="bad">El ordenador acusa</b> a un catalizador que por el tubo va limpio: '+ppm(V.gases.HC)+' de HC con el límite en '+num(limites('dinamico',e.anio).HC,0)+'.';
  else if(V.falsoNegativo)
    h+='<b class="bad">El ordenador calla</b> y por el tubo salen '+ppm(V.gases.HC)+' de HC y '+ppm(V.gases.NOx)+' de NOx.';
  else if(V.enLaBanda)
    h+='<b class="warn">Reprueba con el testigo apagado.</b> El monitor está calibrado a '+ppm(1.5*limites('dinamico',e.anio).HC)+' y todavía no ha llegado.';
  else
    h+='Los dos instrumentos coinciden: '+(V.dtc?'código '+V.dtc+' y ':'sin código y ')+
      ((G.metodo==='dinamico'?V.apruebaDin:V.apruebaEst)?'aprueba':'rechaza')+' por el '+MET_ROT[G.metodo]+'.';
  el('report').innerHTML=h;
}

function afterEdit(){
  invalida(); construyeBanco(); pintaTablero(); pintaTele(); pintaInforme();
  syncCtrl(); pintaPregunta();
}
function cambiaMaquina(k){
  if(!ARQ[k]) return;
  G.maq=k; G.resuelto=false;
  if(G.modo==='reto') armaReto();
  afterEdit(); refrescaPregunta();
  const t=camConjunto(MARGEN[G.modo]||1.00); S.moveTo(t[0],t[1],0.9);
}
// El encuadre es lo único que cambia de un modo a otro, y sólo para acercarse un
// poco cuando la vista lleva mucho texto.
const MARGEN={sondas:1.00, almacen:0.99, prueba:0.99, ventana:0.98,
  monitor:0.97, censo:0.95, reto:0.97};
function setMode(m){
  // Al salir del reto sin haber entregado, el coche vuelve a estar como estaba:
  // si no, la avería del caso se queda puesta y la siguiente vista la enseña con
  // nombre y apellidos.
  const salgo=(G.modo==='reto'&&m!=='reto'&&!RETO.veredicto);
  G.modo=m;
  if(salgo){ G.edad=RETO.antes.edad; G.falla=RETO.antes.falla; G.metodo=RETO.antes.metodo;
    RETO.caso=null; invalida(); }
  if(m==='reto') armaReto();
  pintaHUD(); afterEdit(); refrescaPregunta();
  const t=camConjunto(MARGEN[m]||1.00); S.moveTo(t[0],t[1],1.1);
}
const VISTAS={
  sondas:vistaSondas, almacen:vistaAlmacen, prueba:vistaPrueba, ventana:vistaVentana,
  monitor:vistaMonitor, censo:vistaCenso, reto:vistaReto,
};
function pintaTablero(){
  bg();
  (VISTAS[G.modo]||vistaSondas)();
  btex.needsUpdate=true;
}

// ============================== T4b · RETO, CUESTIONARIO, RECORRIDO Y ARRANQUE
const RETO={caso:null, V:null, sel:[], veredicto:null, pistas:0,
  medido:{escaner:false,osc:false,gases:false},
  antes:{edad:0,falla:'sano',metodo:'dinamico'}};

// La prueba de almacenamiento sólo se distingue de «bien» si supera este tiempo.
// Es el mismo número con el que un taller decide, y sale de la propia física:
// una lata nueva da tres segundos y medio en marcha mínima y una agotada, una
// décima. Un segundo y medio parte esa horquilla por su mitad geométrica.
const OSC_SANO = 1.5;

function barajaEn(a){                       // Fisher-Yates, para que la posición
  for(let i=a.length-1;i>0;i--){            // de la respuesta no sea la pista
    const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t;
  }
  return a;
}

const DX_OPS=[
  ['nada','no hay nada que cambiar'],
  ['cambiaCat','cambiar el catalizador'],
  ['cambiaPre','cambiar la sonda ANTERIOR'],
  ['cambiaPost','cambiar la sonda POSTERIOR'],
  ['selaFuga','sellar la fuga de escape'],
  ['arreglaMotor','arreglar lo que envenena la lata'],
  ['termostato','que el motor llegue a temperatura'],
];
function pintaDxReto(){
  el('dxreto').innerHTML=DX_OPS.map(o=>
    '<button class="b'+(RETO.sel.indexOf(o[0])>=0?' on':'')+'" data-dx="'+o[0]+'">'+o[1]+'</button>').join('');
}
function eligeDx(k){
  if(G.modo!=='reto'||RETO.veredicto) return;
  // «No hay nada que cambiar» es exclusivo de todo lo demás.
  if(k==='nada') RETO.sel=RETO.sel.indexOf(k)>=0?[]:[k];
  else{
    RETO.sel=RETO.sel.filter(x=>x!=='nada');
    RETO.sel=RETO.sel.indexOf(k)>=0?RETO.sel.filter(x=>x!==k):RETO.sel.concat([k]);
  }
  pintaDxReto(); pintaTablero(); pintaReto();
}

// Los casos: no toda avería tiene sentido con toda edad. Se sortea la pareja y
// se guarda; ni la edad ni la avería se enseñan en ninguna superficie.
function armaReto(){
  RETO.antes={edad:G.edad,falla:G.falla,metodo:G.metodo};
  const e=MQ();
  const fallas=FALLA_KEYS.filter(k=>e.sondaPost||['sano','frio','fosforo','plomo'].indexOf(k)>=0);
  RETO.caso=fallas[Math.floor(Math.random()*fallas.length)];
  const edad=EDADES[Math.floor(Math.random()*EDADES.length)].a;
  G.falla=RETO.caso; G.edad=edad;
  G.metodo=Math.random()<0.5?'dinamico':'estatico';
  RETO.V=evalua(e,{edad:edad,falla:RETO.caso});
  RETO.sel=[]; RETO.veredicto=null; RETO.pistas=0;
  RETO.medido={escaner:false,osc:false,gases:false};
  G.resuelto=false;
  invalida(); pintaDxReto();
}
function mide(cual){
  if(G.modo!=='reto'||RETO.veredicto) return;
  if(cual==='osc'&&!MQ().sondaPost){
    showToast('<b>No se puede</b><br>La prueba de almacenamiento se cronometra con la sonda posterior, y este coche no la tiene. Te queda un instrumento.',4200);
    return;
  }
  if(RETO.medido[cual]) return;
  RETO.medido[cual]=true;
  synth.beep(cual==='gases'?520:600,0.10,0.05);
  panFirma='';                    // la pantalla del escáner tiene que repintarse
  pintaTablero(); pintaTele(); pintaReto();
}

// Lo que había que contestar. Sale del ESTADO del coche, no de una lista escrita
// a mano al lado de cada avería.
function esperadoReto(){
  const V=RETO.V, C=V.cond, s=[];
  const frio=(C.dTcat||0)<-100;
  const sucio=V.din.length>0;
  // La lata se cambia cuando por el tubo sale de más y NO es por temperatura.
  if(sucio&&!frio) s.push('cambiaCat');
  if(frio) s.push('termostato');
  // Si la conversión se cayó pero el almacén sigue entero, no es edad: es un
  // veneno, y tiene una causa aguas arriba. Cambiar la lata sin quitarla mata la
  // nueva en unos miles de kilómetros.
  if(sucio&&!frio&&C.ceria>0.70) s.push('arreglaMotor');
  if((C.tauPre||0)>0||(C.vPreOff||0)!==0) s.push('cambiaPre');
  if((C.tauPost||0)>0) s.push('cambiaPost');
  if((C.fugaAire||0)>0) s.push('selaFuga');
  if(!s.length) s.push('nada');
  return s.sort();
}
function pintaReto(){
  const e=MQ();
  let h='<b>Coche en el elevador:</b> '+e.nombre+'. ';
  h+='Se verifica por el '+MET_ROT[G.metodo]+'. ';
  const n=(RETO.medido.escaner?1:0)+(RETO.medido.osc?1:0)+(RETO.medido.gases?1:0);
  if(RETO.veredicto)
    h+=(RETO.veredicto.ok?'<b class="good">Acertaste.</b> ':'<b class="bad">Fallaste.</b> ')+RETO.veredicto.texto;
  else if(n===0) h+='No has medido nada todavía. Los tres instrumentos están arriba.';
  else h+='Llevas '+num(n,0)+' de 3 instrumentos. Recuerda que puedes pedir los tres, y que dos de ellos leen por la MISMA sonda: si esa sonda miente, los dos mienten igual.';
  el('report').innerHTML=h;
}
function pistaReto(){
  if(G.modo!=='reto'||RETO.veredicto) return;
  RETO.pistas++;
  const p=[
    'Lo primero no es el código: es el tubo. Si por el tubo sale menos de lo que la norma admite, no hay catalizador que cambiar por mucho que el escáner se queje.',
    'Una sonda posterior sana vive ALTA y quieta, sobre 0,6 V. Si la ves en 0,45 o más abajo sin oscilar, algo la está empujando hacia pobre — y el catalizador no hace eso.',
    'El almacenamiento y el índice del monitor leen los DOS por la sonda posterior. Si esos dos dicen que todo va bien y el analizador de gases dice que no, el que miente no es el analizador.',
    'Si la conversión se ha caído pero el almacén sigue dando sus segundos, eso no es edad: el cerio y los metales preciosos se van juntos con los años. Es un veneno, y viene de algún sitio.',
    'Con el método estático el NOx no tiene límite ninguno. Un catalizador que haya perdido sólo el rodio pasa esa prueba entera sin que salte nada.',
  ][Math.min(RETO.pistas-1,4)];
  showToast('<b>Pista '+RETO.pistas+'</b><br>'+p,5600);
}
function entregaReto(){
  if(G.modo!=='reto'||!RETO.sel.length) return;
  const n=(RETO.medido.escaner?1:0)+(RETO.medido.osc?1:0)+(RETO.medido.gases?1:0);
  if(n===0){ showToast('<b>Todavía no has medido nada</b><br>Usa al menos un instrumento antes de dictaminar.',3400); return; }
  const esp=esperadoReto(), dado=RETO.sel.slice().sort();
  const ok=esp.join('|')===dado.join('|');
  const V=RETO.V, e=MQ(), lim=limites(G.metodo,e.anio);
  const rotDx=k=>{ const f=DX_OPS.filter(o=>o[0]===k)[0]; return f?f[1]:k; };
  let t='Era <b>'+FALLAS[RETO.caso].rot+'</b>, con el catalizador '+EDAD_ROT(G.edad).rot+
    ' ('+kmF(EDAD_ROT(G.edad).km)+'). ';
  t+='El escáner tenía '+(V.dtc?'un '+V.dtc:'cero códigos')+' y el índice del monitor en '+
    num(V.prueba.indice,3)+' contra un umbral de '+num(INDICE_UMBRAL,2)+'. ';
  t+='La prueba de almacenamiento daba '+(V.osc.roto?seg(V.osc.t):'más de 20 s')+
    ' y por el tubo salían '+ppm(V.gases.HC)+' de HC, '+pcv(V.gases.CO,3)+' de CO y '+
    ppm(V.gases.NOx)+' de NOx, contra '+lim.tabla+' «'+lim.rot+'». ';
  t+='Lo correcto era «'+esp.map(rotDx).join(' + ')+'». ';
  if(V.falsoPositivo)
    t+='Fíjate en lo que pasó: el ordenador acusó al catalizador y el catalizador estaba limpio. ';
  else if(V.falsoNegativo)
    t+='Fíjate en lo que pasó: el ordenador no dijo nada y el coche reprueba. ';
  else if(V.enLaBanda)
    t+='Y ojo: reprueba con el testigo apagado, porque el monitor se calibra a '+ppm(1.5*lim.HC)+' y no a '+ppm(lim.HC)+'. Eso no era una avería del sistema. ';
  if(!e.sondaPost)
    t+='Este coche no tiene sonda posterior: no hay monitor que valga y el único instrumento era el analizador. ';
  if(!V.apruebaEst!==!V.apruebaDin)
    t+='Por el otro método este mismo coche '+((G.metodo==='dinamico'?V.apruebaEst:V.apruebaDin)?'APROBARÍA':'también rechazaría')+'. ';
  if(!ok) t+='Habías dicho «'+dado.map(rotDx).join(' + ')+'».';
  if(RETO.pistas) t+=' Con '+num(RETO.pistas,0)+' pista'+(RETO.pistas>1?'s':'')+'.';
  if(n<3) t+=' Y con '+num(n,0)+' de los 3 instrumentos.';
  RETO.veredicto={ok:ok,texto:t};
  G.resuelto=ok;
  synth.beep(ok?720:220,0.14,0.08);
  pintaReto(); pintaTablero(); pintaTele();
}

// ---------------------------------------------------------------- cuestionario
// Las preguntas se DERIVAN del estado: cambiar de coche, de edad o de avería
// cambia las respuestas, así que no se pueden memorizar.
function preguntas(){
  const e=MQ(), V=EV(), C=CENSO(), T=V.trabajo, lim=limites(G.metodo,e.anio);
  const q=[];
  q.push({t:'Con esta configuración la sonda posterior vive en '+volt(T.vPostMed)+
      ' de media. ¿Por qué una sonda posterior sana se queda ALTA en vez de en el umbral?',
    ops:[
      ['Porque el gas que sale del catalizador viene equilibrado y lleva hidrógeno, y el circonio lee el hidrógeno como mezcla rica',true],
      ['Porque el catalizador calienta el gas y una sonda caliente da más tensión',false],
      ['Porque la sonda posterior lleva otra calibración de fábrica',false],
      ['Porque el silenciador frena el gas y baja la presión del oxígeno',false],
    ]});
  q.push({t:'La prueba de almacenamiento da '+(V.osc.roto?seg(V.osc.t):'más de 20 s')+
      ' en marcha mínima. Si la misma prueba se hiciera en crucero, ¿qué saldría?',
    ops:[
      ['Bastante menos tiempo, porque el tiempo es la capacidad dividida entre el oxígeno que entra por segundo',true],
      ['Lo mismo: la capacidad de la lata no depende del régimen',false],
      ['Más tiempo, porque en crucero el catalizador está más caliente y guarda mejor',false],
      ['No se puede hacer en crucero',false],
    ]});
  q.push({t:'El umbral del monitor está en '+num(INDICE_UMBRAL,2)+'. ¿De dónde sale ese número?',
    ops:[
      ['Se elige para que el monitor salte donde el HC de cola llega a 1,5 veces el límite de la norma',true],
      ['Es la mitad exacta del recorrido de la sonda, por simetría',false],
      ['Lo fija el fabricante de la sonda según su hoja de datos',false],
      ['Es una constante física del cerio del recubrimiento',false],
    ]});
  q.push({t:'De las '+num(C.total,0)+' celdas del censo de este coche, el ordenador se equivoca en '+
      num(C.mal,0)+'. ¿Qué conclusión práctica se saca?',
    ops:[
      ['Que un P0420 es una pista sobre el almacén de oxígeno, no un diagnóstico sobre el catalizador',true],
      ['Que el monitor está mal diseñado y no debería usarse',false],
      ['Que hay que cambiar el catalizador siempre que salte el código',false],
      ['Que el analizador de gases y el escáner miden lo mismo con distinta precisión',false],
    ]});
  if(!e.sondaPost)
    q.push({t:'Este coche es de '+anioF(e.anio)+' y no tiene sonda posterior. ¿Qué le pasa al monitor del catalizador?',
      ops:[
        ['No existe: sin esa sonda no hay nada que comparar, y el único instrumento que queda es el tubo de escape',true],
        ['Funciona igual usando sólo la sonda anterior',false],
        ['Funciona pero con menos precisión',false],
        ['Lo suple el sensor de temperatura del escape',false],
      ]});
  else
    q.push({t:'El coche va a '+ppm(V.gases.HC)+' de HC con el límite en '+ppm(lim.HC)+
        ' y el ordenador dice «'+(V.dtc||'ningún código')+'». ¿Qué se hace con eso?',
      ops:[
        [V.falsoNegativo
          ? 'Se cambia lo que haga falta: el tubo manda, y la ausencia de código no certifica nada'
          : (V.falsoPositivo
            ? 'Se busca qué hay entre el catalizador y el juicio, porque por el tubo no sale nada de más'
            : 'Se toman los dos como coherentes y se actúa sobre lo que los dos señalan'),true],
        ['Se hace caso al escáner, que es el instrumento más moderno',false],
        ['Se borra el código y se vuelve a medir dentro de unos días',false],
        ['Se cambia el catalizador, que es lo que el código nombra',false],
      ]});
  q.push({t:'Con esta lata la conversión va '+num(100*T.etaCO,0)+' % de CO y '+
      num(100*T.etaNOx,0)+' % de NOx. ¿Por qué pueden ir tan distintas?',
    ops:[
      ['Porque oxidar y reducir son trabajos opuestos y los hacen metales distintos: platino y paladio uno, rodio el otro',true],
      ['Porque el NOx se mide con más error que el CO',false],
      ['Porque el NOx sale del motor mucho después que el CO',false],
      ['Porque el cerio sólo ayuda a la oxidación',false],
    ]});
  q.push({t:'El almacén de oxígeno recorre ΔΘ = '+num(T.dTh,2)+' en cada oscilación. Si se rebaja la edad del catalizador, ¿qué le pasa a ese recorrido?',
    ops:[
      ['Se hace más pequeño: el mismo oxígeno cabe en un depósito mayor',true],
      ['Se hace más grande, porque un catalizador nuevo reacciona más deprisa',false],
      ['No cambia: lo fija la amplitud de la oscilación del ordenador',false],
      ['Cambia sólo si además se cambia el régimen',false],
    ]});
  return q;
}
let QI=0, QSEL=null, QCACHE=null;
function bancoQ(){
  if(!QCACHE){ QCACHE=preguntas();
    QCACHE.forEach(q=>{ q.baraja=barajaEn(q.ops.map(o=>({o:o}))); }); }
  return QCACHE;
}
function refrescaPregunta(){ QCACHE=null; QI=0; QSEL=null; pintaPregunta(); }
function pintaPregunta(){
  const B=bancoQ(); if(!B.length){ el('quiz').innerHTML=''; return; }
  const q=B[QI%B.length];
  let h='<div class="lt">Pregunta '+((QI%B.length)+1)+' de '+B.length+'</div>';
  h+='<div class="console">'+q.t+'</div>';
  h+='<div class="btns">'+q.baraja.map((b,i)=>{
    const bien=b.o[1];
    // Antes de contestar, ninguna opción va marcada: marcar la correcta de
    // salida sería regalar la respuesta. Después, la correcta se pinta verde
    // —esté o no elegida— y la elegida por error, roja.
    const cls=QSEL===null?'':(bien?' right':(i===QSEL?' wrong':''));
    return '<button class="b dx'+cls+'" data-q="'+i+'">'+b.o[0]+'</button>';
  }).join('')+'</div>';
  h+='<div class="modebar" style="margin-top:8px"><button class="b" data-qnext="1">Siguiente pregunta</button></div>';
  el('quiz').innerHTML=h;
}
function pregunta(i){
  const B=bancoQ(), q=B[QI%B.length];
  if(QSEL!==null) return;
  QSEL=i;
  synth.beep(q.baraja[i].o[1]?700:210,0.10,0.06);
  pintaPregunta();
}

// ------------------------------------------------------------ recorrido guiado
let AUTO=null;
function paraAuto(){ if(AUTO){ clearTimeout(AUTO); AUTO=null; } el('btnAuto').disabled=false; }
function runAuto(){
  paraAuto();
  el('btnAuto').disabled=true;
  const pasos=[
    ()=>{ cambiaMaquina('mpi16'); G.edad=0.00; G.falla='sano'; G.punto='crucero';
      G.metodo='dinamico'; setMode('sondas');
      showToast('<b>Las dos sondas</b><br>La de delante oscila una vez por segundo. La de detrás está quieta y arriba. Ésa es la firma de un catalizador que trabaja.',3800); },
    ()=>{ G.edad=0.45; afterEdit();
      showToast('<b>El mismo coche con 160 000 km</b><br>La de delante hace exactamente lo mismo. La de detrás ha empezado a copiarla.',3800); },
    ()=>{ G.edad=0.00; setMode('almacen');
      showToast('<b>Por qué estaba plana</b><br>El cerio se traga el oxígeno que sobra en cada media oscilación. Mira la carrera de Θ: apenas se mueve.',3800); },
    ()=>{ G.edad=0.45; afterEdit();
      showToast('<b>Y por qué dejó de estarlo</b><br>El mismo oxígeno en un depósito más pequeño. Θ toca los topes, y en los topes el oxígeno sale por el otro lado.',4000); },
    ()=>{ G.edad=0.00; setMode('prueba');
      showToast('<b>Medirlo directamente</b><br>Se fuerza pobre y se cronometra. Fíjate en los dos tiempos: el mismo catalizador, cuatro veces más segundos en marcha mínima.',4000); },
    ()=>{ setMode('ventana');
      showToast('<b>Guardar no es convertir</b><br>Convertir pide estar dentro de una ventana estrechísima y por encima de la temperatura de encendido. El monitor no mide ninguna de las dos.',4000); },
    ()=>{ setMode('monitor');
      showToast('<b>El umbral</b><br>No es una constante física. Es el número que hace que el monitor salte donde el HC llega a 1,5 veces el límite de la norma.',4000); },
    ()=>{ G.edad=0.30; afterEdit();
      showToast('<b>La franja amarilla</b><br>Aquí el coche ya reprueba la verificación y el testigo sigue apagado. No es una avería: es lo que la reglamentación pide.',4200); },
    ()=>{ G.edad=0.00; G.falla='preSesgada'; afterEdit();
      showToast('<b>Un P0420 con la lata nueva</b><br>La sonda de DELANTE miente por una décima de voltio. El ordenador la cree, empobrece de más, y el almacén se queda lleno para siempre.',4200); },
    ()=>{ G.falla='fosforo'; afterEdit();
      showToast('<b>Y el caso contrario</b><br>El fósforo del aceite tapa los metales y deja el cerio entero. La conversión se hunde, el almacén no, y el ordenador no tiene de qué quejarse.',4200); },
    ()=>{ G.falla='plomo'; G.metodo='estatico'; afterEdit();
      showToast('<b>El rodio</b><br>Es el metal del NOx y el primero que se envenena. Mira el HC: perfecto. Y por el método estático el NOx no tiene límite ninguno.',4200); },
    ()=>{ G.metodo='dinamico'; afterEdit();
      showToast('<b>El otro método sí lo caza</b><br>Mismo coche, mismo catalizador, otra tabla. El veredicto cambia sin que nadie toque el vehículo.',4000); },
    ()=>{ G.falla='postLenta'; G.edad=0.70; setMode('prueba');
      showToast('<b>Cuando el instrumento es el que falla</b><br>La sonda de atrás va lenta. El monitor y el cronómetro leen los dos por ella, así que los dos dicen que todo está bien.',4400); },
    ()=>{ setMode('censo');
      showToast('<b>La cuenta</b><br>Nueve averías por cinco edades. Cuenta las celdas donde el ordenador y la norma no dicen lo mismo.',3800); },
    ()=>{ cambiaMaquina('tbi92'); G.edad=0.45; G.falla='sano'; afterEdit();
      showToast('<b>Y un 1992</b><br>Sin sonda posterior no hay monitor. Para este coche el único instrumento que existe es el tubo de escape.',4000); },
    ()=>{ cambiaMaquina('mpi16'); setMode('reto');
      showToast('<b>Tu turno</b><br>Llega un coche y no se dice qué tiene. Tres instrumentos, y dos de los tres leen por la misma sonda.',4000); },
  ];
  let i=0;
  const tic=()=>{ if(i>=pasos.length){ paraAuto(); return; } pasos[i++](); AUTO=setTimeout(tic,3400); };
  tic();
}

// ------------------------------------------------------------------- sucesos
// Un ÚNICO despachador delegado. Nada de onclick en el HTML generado: el cuerpo
// del laboratorio va dentro de un <script type="module"> y sus funciones no
// existen en el ámbito global, así que un onclick inline no encuentra nada.
document.addEventListener('click',ev=>{
  const b=ev.target.closest('button'); if(!b) return;
  const id=b.id;
  if(id==='btnAuto'){ runAuto(); return; }
  if(id==='btnEscaner'){ mide('escaner'); return; }
  if(id==='btnOsc'){ mide('osc'); return; }
  if(id==='btnGases'){ mide('gases'); return; }
  if(id==='btnPista'){ pistaReto(); return; }
  if(id==='btnEntrega'){ entregaReto(); return; }
  if(id==='btnOtro'){ paraAuto(); armaReto(); afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.mode){ paraAuto(); setMode(b.dataset.mode); return; }
  if(b.dataset.maq){ paraAuto(); cambiaMaquina(b.dataset.maq); return; }
  if(b.dataset.edad!==undefined){ paraAuto(); G.edad=Number(b.dataset.edad); G.resuelto=false;
    afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.falla){ paraAuto(); G.falla=b.dataset.falla; G.resuelto=false;
    afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.punto){ paraAuto(); G.punto=b.dataset.punto; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.met){ paraAuto(); G.metodo=b.dataset.met; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.dx){ eligeDx(b.dataset.dx); return; }
  if(b.dataset.q!==undefined){ pregunta(Number(b.dataset.q)); return; }
  if(b.dataset.qnext){ QI++; QSEL=null; pintaPregunta(); return; }
});
document.addEventListener('keydown',ev=>{
  if(ev.target&&/^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return;
  const i=Number(ev.key);
  if(i>=1&&i<=MODES.length){ paraAuto(); setMode(MODES[i-1]); }
});

// ------------------------------------------------------------------- depuración
// Superficie mínima y estable para la Capa 2. Todo lo que publica sale del motor
// sellado por el mismo camino que la pantalla.
window.__labDebug={
  get mode(){ return G.modo; },
  get solved(){ return G.resuelto; },
  get maquina(){ return G.maq; },
  get edad(){ return G.edad; },
  get falla(){ return G.falla; },
  get metodo(){ return G.metodo; },
  get punto(){ return G.punto; },
  get frames(){ return PINTADAS; },
  get cabecera(){ return cabVehiculo()+' | '+cabPunto(); },
  get maq(){ const e=MQ(); return {key:e.key, corto:e.corto, nombre:e.nombre, anio:e.anio,
    cilindrada:e.cilindrada, bancos:e.bancos, sdb:e.sdb, sondaPost:e.sondaPost,
    tCat:e.tCat, rpm:e.rpm, carga:e.carga, ralenti:e.ralenti,
    CO0:e.CO0, HC0:e.HC0, NOx0:e.NOx0}; },
  // Lo que se está mirando ahora mismo, con sus tres medidas.
  get lect(){ const V=EV(); const emp=r=>({indice:r.indice, razon:r.razon,
    actPre:r.actPre, actPost:r.actPost, vPostMed:r.vPostMed, ampPost:r.ampPost,
    ampPre:r.ampPre, nSwPre:r.nSwPre, nSwPost:r.nSwPost, fPre:r.fPre,
    periodo:r.periodo, tau:r.tau, ret:r.ret, ampLam:r.ampLam, mAire:r.mAire, C:r.C,
    thMed:r.thMed, thMin:r.thMin, thMax:r.thMax, dTh:r.dTh,
    etaCO:r.etaCO, etaHC:r.etaHC, etaNOx:r.etaNOx, n:r.pts.length});
    return {edad:G.edad, falla:G.falla, cond:Object.assign({},V.cond),
      trabajo:emp(V.trabajo), prueba:emp(V.prueba),
      osc:{t:V.osc.t, roto:V.osc.roto, C:V.osc.C, q:V.osc.q, n:V.osc.pts.length},
      gases:{CO:V.gases.CO, HC:V.gases.HC, NOx:V.gases.NOx},
      dtc:V.dtc, motivo:V.motivo, din:V.din.slice(), est:V.est.slice(),
      apruebaDin:V.apruebaDin, apruebaEst:V.apruebaEst,
      acusa:V.acusa, sucio:V.sucio,
      falsoPositivo:V.falsoPositivo, falsoNegativo:V.falsoNegativo,
      enLaBanda:V.enLaBanda,
      limDin:limites('dinamico',MQ().anio), limEst:limites('estatico',MQ().anio)}; },
  // Lo que la pantalla del escáner PUBLICA de verdad. Es la superficie por la
  // que un reto a ciegas se escapa, así que se comprueba desde fuera.
  get escaner(){ return publicaEscaner(); },
  // Lo que las chapas del banco DICEN: de una textura no se lee texto, y el 3D
  // también puede regalar la respuesta.
  get rotulos(){ return ROTULOS.slice(); },
  get censo(){ const C=CENSO(); return {total:C.total, fp:C.fp, fn:C.fn, mal:C.mal,
    filas:C.filas.map(f=>({falla:f.falla, fp:f.fp, fn:f.fn,
      celdas:f.celdas.map(c=>({edad:c.edad, dtc:c.dtc, din:c.din.slice(),
        fp:c.fp, fn:c.fn, HC:c.HC, NOx:c.NOx, indice:c.indice}))}))}; },
  get barrido(){ return barridoEdad().map(p=>({a:p.a, indice:p.indice, HC:p.HC,
    NOx:p.NOx, osc:p.osc, ceria:p.ceria, dtc:p.dtc})); },
  get reto(){ return {caso:RETO.caso, edad:G.edad, metodo:G.metodo,
    medido:Object.assign({},RETO.medido), sel:RETO.sel.slice(),
    esperado:RETO.V?esperadoReto():null,
    veredicto:RETO.veredicto?RETO.veredicto.ok:null, pistas:RETO.pistas}; },
  get preguntas(){ return preguntas().map(q=>({t:q.t, n:q.ops.length,
    correctas:q.ops.filter(o=>o[1]).length})); },
  get texto(){ return el('report').textContent+' || '+el('tele').textContent; },
  get autoRunning(){ return AUTO!==null; },
  // Constantes del motor sellado, para que la Capa 2 no las escriba a mano.
  get K(){ return {INDICE_UMBRAL:INDICE_UMBRAL, RAZON_UMBRAL:RAZON_UMBRAL,
    FORZADO:FORZADO, OSC_POR_LITRO:OSC_POR_LITRO, P_RUPTURA:P_RUPTURA,
    V_UMBRAL:V_UMBRAL, SESGO_H2:SESGO_H2, LAM_INTRUSIVO:LAM_INTRUSIVO,
    OSC_SANO:OSC_SANO, EDADES:EDADES.slice(), FALLAS:FALLA_KEYS.slice(),
    MODES:MODES.slice(), ARQ:ARQ_KEYS.slice(), DX:DX_OPS.map(o=>o[0])}; },
  setMaquina(k){ cambiaMaquina(k); },
  setEdad(a){ G.edad=a; G.resuelto=false; afterEdit(); refrescaPregunta(); },
  setFalla(k){ G.falla=k; G.resuelto=false; afterEdit(); refrescaPregunta(); },
  setPunto(p){ G.punto=p; afterEdit(); refrescaPregunta(); },
  setMetodo(m){ G.metodo=m; afterEdit(); refrescaPregunta(); },
  setMode(m){ setMode(m); },
  mide(c){ mide(c); },
  elige(k){ eligeDx(k); },
  entrega(){ entregaReto(); },
  pista(){ pistaReto(); },
  arma(){ armaReto(); afterEdit(); refrescaPregunta(); },
  // Para poder poner un caso concreto del reto sin depender del azar.
  armaCaso(falla,edad,met){ armaReto(); RETO.caso=falla; G.falla=falla;
    if(edad!==undefined) G.edad=edad;
    if(met) G.metodo=met;
    RETO.V=evalua(MQ(),{edad:G.edad,falla:falla});
    RETO.sel=[]; RETO.veredicto=null; RETO.pistas=0;
    RETO.medido={escaner:false,osc:false,gases:false};
    invalida(); afterEdit(); refrescaPregunta(); },
};

// ------------------------------------------------------------------- arranque
pintaHUD();
construyeBanco();
syncCtrl();
pintaTablero();
pintaTele();
pintaInforme();
pintaDxReto();
refrescaPregunta();
S.setAnimate(dt=>pinta3D(dt));
S.start();
{ const t=camConjunto(MARGEN.sondas); S.moveTo(t[0],t[1],0.01); }
addEventListener('resize',()=>S.resize());
