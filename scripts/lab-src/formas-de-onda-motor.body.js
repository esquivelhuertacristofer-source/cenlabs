/* ============================================================
   LAB — FORMAS DE ONDA DE LOS SENSORES DEL MOTOR
   (Dominio D6 · motor de combustión interna · práctica d6-08)

   Qué se mide y con qué
     · Con el osciloscopio: la señal del captador de cigüeñal diente a
       diente, la del árbol de levas en un segundo canal, las tres rectas
       de los sensores de tensión y la onda eléctrica del inyector con su
       joroba de cierre.
     · Con el escáner: los datos en directo y los códigos de avería, que es
       lo que hay en cualquier taller.
     · Con el multímetro: la tensión de un sensor con el motor quieto.
     · Y con la llave de contacto: si el motor arranca o no arranca, que es
       una medida y de las más baratas.

   La tesis de la práctica
     El escáner no es un osciloscopio lento: es un MUESTREADOR. Lee un dato
     cada ochenta milisegundos y entre lectura y lectura no sabe nada. Un
     hueco en la pista del acelerador que dura doce milisegundos lo caza el
     quince por ciento de las veces —hacen falta diecinueve pisotones para
     estar seguro al noventa y cinco por ciento—, y barriendo despacio el
     mismo escáner lo caza SIEMPRE. La forma de la onda dice cosas que
     ningún número del escáner contiene, y lo que hay que aprender no es a
     leer una pantalla: es a saber qué instrumento puede ver qué.

   Fuentes de referencia
     · Captadores de reluctancia variable y de efecto Hall, rueda fónica,
       sensores de posición y de presión de colector, medidor de masa de
       aire de hilo caliente e inyectores de mando por saturación — Robert
       Bosch GmbH, «Automotive Handbook».
     · SAE J1979 / ISO 15031-5, modos 01 y 06: de ahí sale el ritmo al que
       un escáner refresca un dato en directo.
     · ISO 15031-6 / SAE J2012 para los códigos.
     · Manual de taller del fabricante — única fuente de la rueda fónica,
       del entrehierro y del inyector de un motor concreto. Los cuatro
       motores de este banco NO son comerciales.

   Modelo de ingeniería
     · La centralita encuentra el hueco de referencia midiendo la RAZÓN
       entre periodos de diente consecutivos. Esa razón no depende del
       régimen —es un cociente de tiempos del mismo giro— y de ella sale
       todo el margen de diseño de la rueda: en una de 60−2 el hueco abre
       una razón de 3 y un diente roto abre una de 2, con el umbral en
       medio; en una de 36−1 los dos abren una razón de 2 y no hay margen.
     · El captador inductivo da una tensión proporcional al régimen, así
       que la señal más débil de la vida del motor es la del arranque. Ahí
       es donde un entrehierro grande deja de dar el umbral, y por eso hay
       coches que no arrancan y funcionan perfectamente en cuanto arrancan.
     · La probabilidad de que un muestreador de periodo Ts cace una ventana
       de duración tau vale exactamente tau/Ts mientras tau sea menor que
       Ts. No es una estimación: es el número de muestras que caben dentro.
   ============================================================ */
const mount=document.getElementById('stage');
// Estas seis cifras sólo valen para el primer fotograma: en cuanto la escena
// arranca, el encuadre se CALCULA con camConjunto() y se aplica de golpe, porque
// depende del ancho del banco y de la forma de la ventana y no puede estar
// escrito a mano en ningún sitio.
const S=createStage(mount,{cam:[2.0,3.0,4.6],target:[-1.4,1.7,-0.9],bgTop:'#0f1a23',bgBot:'#05070b',bloom:0.20,minD:2.4,maxD:36});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:1020,Q:0.72});
const el=id=>document.getElementById(id);
// `clamp` NO se declara aquí: lo declara el motor sellado unas líneas más abajo
// y declararlo dos veces es un SyntaxError que mata la página entera antes de
// que exista window.__labDebug.

// ============================================================================
// MOTOR SELLADO — copiado tal cual del fichero de Capa 1, sin tocar una sola
// cifra: lo unico que cambia es que se le quitan los `export`. Cualquier numero
// que aparezca en el pizarron, en la telemetria, en el informe o en el
// cuestionario sale de aqui. La interfaz no recalcula nada por su cuenta.
// ============================================================================

// ============================================================================
//  MOTOR SELLADO — d6-08 · FORMAS DE ONDA DE LOS SENSORES DEL MOTOR
//
//  Este archivo es la UNICA fuente de cifras del laboratorio. La interfaz no
//  recalcula nada: pide y formatea. Si una cifra de la ficha, del pizarron, del
//  informe o del cuestionario no sale de aqui, esa cifra esta inventada.
//
//  Que se modela y de donde sale:
//    · Rueda fonica de 60 menos 2 y de 36 menos 1, con su hueco de referencia y
//      la RAZON entre periodos de diente consecutivos con la que la centralita
//      lo encuentra. El umbral de razon es un valor DECLARADO de este banco.
//    · Captador de reluctancia variable: su tension crece con el REGIMEN y se
//      hunde con el entrehierro. La ley del entrehierro es una potencia
//      AJUSTADA, no una deduccion de primeros principios, y se declara asi.
//      Sensor de efecto Hall: amplitud fija hasta que deja de conmutar.
//    · Sincronizacion cigueñal-arbol: el arbol gira a la MITAD, asi que un
//      diente saltado en su rueda vale 720/Z grados de CIGUEÑAL.
//    · Sensores de tension —mariposa, presion de colector, hilo caliente— con su
//      recta de calibracion, su alimentacion de 5 V comun, su masa comun y el
//      rizado de la admision, cuya frecuencia es la de aspiracion del motor.
//    · Onda electrica del inyector: subida exponencial contra L/R, pico
//      inductivo al cortar el mando y JOROBA DE CIERRE de la aguja, que es lo
//      unico que dice si la aguja se esta pegando.
//    · MUESTREO: la probabilidad de que un instrumento que mira cada Ts segundos
//      cace una ventana de fallo de duracion tau. Es exacta, no una estimacion.
//
//  Fuentes de referencia: Robert Bosch GmbH, «Automotive Handbook» (captadores
//  de reluctancia variable y de efecto Hall, rueda fonica, sensores de posicion
//  y de presion de colector, medidor de masa de aire de hilo caliente,
//  inyectores de mando por saturacion); SAE J1979 / ISO 15031-5 modos 01 y 06
//  (datos en directo y su refresco); ISO 15031-6 / SAE J2012 (codigos);
//  manual de taller del fabricante, unica fuente de la rueda fonica, del
//  entrehierro y del inyector de un motor concreto.
// ============================================================================

const DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// ============================================================================
//  1 · LA RUEDA FONICA Y EL CAPTADOR DE CIGUEÑAL
//
//  La rueda lleva N posiciones de diente repartidas en una vuelta de cigueñal y
//  le faltan H seguidas. Ese hueco es la REFERENCIA: la centralita no sabe donde
//  esta el motor hasta que lo encuentra, y lo encuentra midiendo la razon entre
//  el periodo del hueco y el del diente anterior.
// ============================================================================

// Angulo que ocupa cada posicion de diente, en grados de cigueñal.
const pasoDiente = e => 360 / e.dientes;

// Las posiciones de diente que EXISTEN. Se quitan tanto el hueco de fabrica
// como los dientes que la averia se lleva, porque la centralita no puede
// distinguir un diente roto de un pulso que no le llego: los dos son un flanco
// que no aparece.
function dientesPresentes(e, F = {}) {
  const rotos = new Set(F.dientesRotos || []);
  const out = [];
  for (let i = 0; i < e.dientes; i++) {
    const enHueco = i >= e.dienteHueco && i < e.dienteHueco + e.faltan;
    if (enHueco || rotos.has(i)) continue;
    out.push({ i, ang: i * pasoDiente(e) });
  }
  return out;
}

// Periodos entre flancos consecutivos, en segundos, para una vuelta completa a
// regimen constante. El periodo de UN paso de diente es lo que tarda el
// cigueñal en girar ese angulo.
function periodosDiente(e, rpm, F = {}) {
  const D = dientesPresentes(e, F);
  const tVuelta = 60 / rpm;
  const out = [];
  for (let k = 0; k < D.length; k++) {
    const a0 = D[k].ang, a1 = (k + 1 < D.length) ? D[k + 1].ang : D[0].ang + 360;
    out.push({ desde: D[k].i, ang: a0, T: (a1 - a0) / 360 * tVuelta, pasos: (a1 - a0) / pasoDiente(e) });
  }
  return out;
}

// La razon entre cada periodo y el anterior. La centralita busca las que pasan
// de su umbral: ahi cree que esta el hueco de referencia. La razon NO depende
// del regimen, porque es un cociente de tiempos del mismo giro.
function razones(e, rpm, F = {}) {
  const P = periodosDiente(e, rpm, F);
  return P.map((p, k) => ({ ...p, razon: p.T / P[(k - 1 + P.length) % P.length].T }));
}
const razonesOrd = (e, F = {}) => razones(e, 1000, F).map(r => r.razon).sort((a, b) => b - a);
const razonMax = (e, F = {}) => razonesOrd(e, F)[0];
// La segunda razon mas grande es la que dice si queda MARGEN. En una rueda de
// 60 menos 2 el hueco vale 3 y un diente roto vale 2, con el umbral en 2,5 en
// medio: la centralita distingue uno de otro. En una de 36 menos 1 el hueco
// vale 2 y un diente roto vale 2 tambien: no hay margen ninguno.
const razonSegunda = (e, F = {}) => razonesOrd(e, F)[1];

// Cuantos huecos de referencia CREE ver la centralita en una vuelta. Con la
// rueda sana tiene que ser exactamente uno. Si fueran dos, se sincronizaria en
// el sitio equivocado; si fueran cero, no sabria donde esta el motor.
function huecosDetectados(e, F = {}) {
  return razones(e, 1000, F).filter(r => r.razon >= e.umbralRazon).length;
}
const sincroniza = (e, F = {}) => huecosDetectados(e, F) === 1;

// --- amplitud de la señal -----------------------------------------------
// Reluctancia variable: la tension es la derivada del flujo, asi que crece con
// el REGIMEN y se hunde al separar el captador de la rueda. El exponente del
// entrehierro es un valor AJUSTADO de este banco, no una deduccion: la ley real
// depende de la geometria del captador y esta en su hoja de datos.
const EXP_ENTREHIERRO = 1.6;
const RPM_ARRANQUE = 220;
const entrehierroDe = (e, F = {}) => e.entrehierro * (F.entrehierroMul === undefined ? 1 : F.entrehierroMul);
function ampCkp(e, rpm, F = {}) {
  const g = entrehierroDe(e, F);
  if (e.tipoCkp === 'hall') return g > e.entrehierroMax ? 0 : e.vHall;
  return e.kCkp * (rpm / 1000) * Math.pow(e.entrehierro / g, EXP_ENTREHIERRO);
}

// Un pico de ruido acoplado sobre la señal cuenta como un diente FALSO solo si
// pasa del umbral del comparador de entrada. Hay una chispa por cilindro cada
// dos vueltas, asi que se cuentan por ciclo completo de 720 grados.
//
// Un diente falso ACORTA dos periodos; nunca alarga ninguno. Por eso jamas
// dispara el detector de referencia —que busca razones GRANDES— y la centralita
// se sigue sincronizando: lo que rompe es la cuenta angular y la deteccion de
// fallo de encendido, que mira diente a diente.
const pulsosFalsos = (e, F = {}) => ((F.ruidoV || 0) >= e.umbralCkp ? e.nCil : 0);
const hayRuido = (F = {}) => (F.ruidoV || 0) > 0;

// Con el motor de arranque el cigueñal gira diez veces mas despacio que a
// ralenti. Para un captador inductivo eso es diez veces menos señal, y ahi es
// donde un entrehierro grande deja de dar el umbral: el motor gira y NO
// arranca, y si arranca —empujado, o a la decima— funciona sin una queja.
const pasaUmbral = (e, rpm, F = {}) => ampCkp(e, rpm, F) >= e.umbralCkp;
const arranca = (e, F = {}) => pasaUmbral(e, RPM_ARRANQUE, F) && sincroniza(e, F);
const sostiene = (e, F = {}) => pasaUmbral(e, e.ralenti, F) && sincroniza(e, F);

// Forma de un diente en el captador inductivo, normalizada para que su recorrido
// de PICO A PICO valga exactamente la amplitud que declara ampCkp(). Sin
// normalizar, el osciloscopio enseñaria un 7 % menos de lo que dice la
// telemetria y las dos cifras se contradirian sin que ninguna prueba numerica
// pudiera darse cuenta: las dos saldrian de este archivo.
const FORMA_VR = 0.5 / ((1 / Math.sqrt(4.4)) * Math.exp(-0.5));

// Traza de la señal del cigueñal en voltios contra tiempo. El inductivo da una
// onda que cruza por cero en el centro de cada diente; el Hall, un cuadrado.
function trazaCkp(e, rpm, o = {}) {
  const F = o.falla ? FALLAS[o.falla] : (o.F || {});
  const vueltas = o.vueltas === undefined ? 1 : o.vueltas;
  const n = o.n === undefined ? 1400 : o.n;
  const tVuelta = 60 / rpm, dur = tVuelta * vueltas;
  const D = dientesPresentes(e, F);
  const amp = ampCkp(e, rpm, F);
  const paso = pasoDiente(e);
  const off = F.offsetV || 0;
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = dur * k / n;
    const ang = (t / tVuelta * 360) % 360;
    let v = 0;
    for (const d of D) {
      let da = ang - d.ang;
      da = ((da + 180) % 360 + 360) % 360 - 180;
      if (Math.abs(da) > paso * 0.9) continue;
      const u = da / (paso * 0.5);
      v += e.tipoCkp === 'hall'
        ? (Math.abs(u) < 0.5 ? amp : 0)
        : amp * FORMA_VR * (-u) * Math.exp(-2.2 * u * u);
    }
    if (F.ruidoV) {
      const fase = (t * (rpm / 60 / 2 * e.nCil)) % 1;
      if (fase < 0.02) v += F.ruidoV * Math.sin(fase / 0.02 * Math.PI);
    }
    pts.push({ t, ang, v: v + off });
  }
  return { pts, amp, dur, tVuelta, umbral: e.umbralCkp, off, paso };
}

// ============================================================================
//  2 · EL ARBOL DE LEVAS Y LA SINCRONIZACION
//
//  El arbol gira a la MITAD que el cigueñal, asi que su señal identifica en cual
//  de las dos vueltas esta el motor. Un diente saltado en su rueda dentada NO
//  vale un diente de cigueñal: vale 720/Z grados de CIGUEÑAL, y eso hay que
//  medirlo con dos canales, porque no hay ningun dato en directo que lo diga.
// ============================================================================

const gradosPorDienteArbol = e => 720 / e.dientesArbol;
const faseCmp = (e, F = {}) => e.faseCmpNominal + (F.dientesArbolSaltados || 0) * gradosPorDienteArbol(e);
const desfaseCmp = (e, F = {}) => faseCmp(e, F) - e.faseCmpNominal;
const hayCmp = (e, F = {}) => !F.sinCmp;

// ============================================================================
//  3 · LOS SENSORES DE TENSION
//
//  Tres rectas de calibracion colgando de la MISMA alimentacion de 5 V y de la
//  MISMA masa. Casi todo lo que les pasa se ve en la recta: un desplazamiento,
//  un cambio de pendiente o un hueco. El escaner enseña un punto de esa recta.
//
//  Una resistencia en la masa comun SUMA la misma tension a las tres señales.
//  Una caida en el cable de alimentacion las MULTIPLICA a las tres por el mismo
//  factor. Con una sola lectura son la misma averia; con los dos extremos del
//  recorrido, no.
// ============================================================================

const V_REF = 5.0;
const vAlim = (F = {}) => V_REF * (F.vAlimMul === undefined ? 1 : F.vAlimMul);
const kAlim = F => vAlim(F) / V_REF;

function vTps(e, acel, F = {}) {
  const a = clamp(acel, 0, 1);
  if (F.tpsHueco) {
    const [a0, a1] = F.tpsHueco;
    if (a >= a0 && a <= a1) return F.offsetV || 0;      // pista abierta: se cae a masa
  }
  return (e.tpsMin + (e.tpsMax - e.tpsMin) * a) * kAlim(F) + (F.offsetV || 0);
}
const anchoHueco = (F = {}) => (F.tpsHueco ? F.tpsHueco[1] - F.tpsHueco[0] : 0);

// Presion de colector. A mariposa cerrada la depresion crece con el regimen,
// porque los pistones bombean mas y la mariposa deja pasar lo mismo. Abrir la
// mariposa la lleva hacia la atmosferica.
function presionColector(e, rpm, acel) {
  const min = clamp(e.mapRalenti * Math.pow(e.ralenti / Math.max(rpm, 1), 0.34), 0.10, e.pAtm);
  return clamp(min + (e.pAtm - min) * Math.pow(clamp(acel, 0, 1), 0.62), 0.10, e.pAtm);
}
// Amplitud del rizado de la admision. Cae con la carga porque a mariposa
// abierta el colector es un deposito grande y quieto.
const rizadoMap = (e, acel, F = {}) =>
  (F.sinRizado ? 0 : e.mapRizado) * (1 - clamp(acel, 0, 1) * 0.85);
// Frecuencia del rizado: una aspiracion por cilindro cada dos vueltas.
const fAspiracion = (e, rpm) => rpm / 60 / 2 * e.nCil;

function vMap(e, rpm, acel, F = {}, t) {
  const p = F.mapFijo === undefined ? presionColector(e, rpm, acel) : F.mapFijo;
  const base = (e.mapV0 + (e.mapV1 - e.mapV0) * (p - e.mapP0) / (e.mapP1 - e.mapP0)) * kAlim(F) + (F.offsetV || 0);
  if (t === undefined) return base;
  return base + rizadoMap(e, acel, F) * Math.sin(2 * Math.PI * fAspiracion(e, rpm) * t);
}

// Hilo caliente: la tension va con la RAIZ del gasto, porque el puente mantiene
// constante la temperatura del hilo y lo que se lleva el aire va con la raiz de
// su velocidad. `gastoMax` es el gasto a pleno gas y regimen maximo.
const gastoAire = (e, rpm, acel) =>
  e.gastoMax * (presionColector(e, rpm, acel) / e.pAtm) * (rpm / e.rpmMax);
const rizadoMaf = (e, acel, F = {}) =>
  (F.sinRizado ? 0 : e.mafRizado) * (1 - clamp(acel, 0, 1) * 0.7);
function vMaf(e, rpm, acel, F = {}, t) {
  const m = gastoAire(e, rpm, acel) * (F.mafMul === undefined ? 1 : F.mafMul);
  const base = (e.mafV0 + (e.mafV1 - e.mafV0) * Math.sqrt(clamp(m / e.gastoMax, 0, 1))) * kAlim(F) + (F.offsetV || 0);
  if (t === undefined) return base;
  return base + rizadoMaf(e, acel, F) * Math.sin(2 * Math.PI * fAspiracion(e, rpm) * t + 0.8);
}

// ============================================================================
//  4 · LA ONDA ELECTRICA DEL INYECTOR
//
//  Mientras el transistor conduce, la corriente sube contra L/R. Al cortar, la
//  energia de la bobina tiene que salir por algun sitio y aparece el pico
//  inductivo, recortado por el propio circuito de mando. Y en la bajada de ese
//  pico hay una JOROBA pequeña: es la aguja sentandose, porque al moverse
//  cambia la inductancia. Esa joroba es lo unico que dice si la aguja se pega, y
//  no hay ningun dato en directo del escaner que la contenga.
// ============================================================================

function ondaInyector(e, o = {}) {
  const F = o.falla ? FALLAS[o.falla] : (o.F || {});
  const vBat = o.vBat === undefined ? 13.8 : o.vBat;
  const tOrden = o.tOrden === undefined ? 3.2 : o.tOrden;          // ms
  const n = o.n === undefined ? 1000 : o.n;
  const dur = o.dur === undefined ? tOrden + 3.2 : o.dur;          // ms
  const tau = e.inyL / e.inyR;                                     // ms (mH / ohm)
  const iFin = vBat / e.inyR;
  const tCierre = e.inyCierre * (F.cierreMul === undefined ? 1 : F.cierreMul);
  const pts = [];
  for (let k = 0; k <= n; k++) {
    const t = dur * k / n;
    let v, i;
    if (t < tOrden) {
      i = iFin * (1 - Math.exp(-t / tau));
      v = e.inyCaida;                                              // saturacion del transistor
    } else {
      const dt = t - tOrden;
      i = 0;
      v = vBat + e.inyPico * Math.exp(-dt / e.inyTauPico)
        + e.inyJoroba * Math.exp(-Math.pow((dt - tCierre) / e.inyAnchoJoroba, 2));
    }
    pts.push({ t, v, i });
  }
  return {
    pts, tau, iFin, tCierre, tOrden, dur, vBat,
    iCorte: iFin * (1 - Math.exp(-tOrden / tau)),
    tApertura: e.inyApertura,
    iApertura: iFin * (1 - Math.exp(-e.inyApertura / tau)),
  };
}

// ============================================================================
//  5 · EL MUESTREO: QUE PROBABILIDAD HAY DE CAZAR UN FALLO
//
//  Un escaner no es un osciloscopio lento: es un MUESTREADOR. Lee un dato cada
//  Ts segundos y entre lectura y lectura no sabe nada. Con una ventana de fallo
//  de duracion tau y un muestreador de periodo Ts cuya fase es cualquiera, el
//  numero de muestras que caen dentro vale cero o uno mientras tau < Ts, y la
//  probabilidad de que valga uno es EXACTAMENTE tau/Ts. No es una estimacion.
// ============================================================================

function pCaza(tau, Ts) {
  if (!(tau > 0)) return 0;
  if (!(Ts > 0)) return 1;
  return Math.min(1, tau / Ts);
}
const pCazaN = (tau, Ts, N) => 1 - Math.pow(1 - pCaza(tau, Ts), Math.max(0, N));
function repeticionesPara(tau, Ts, conf) {
  const p = pCaza(tau, Ts);
  if (p <= 0) return Infinity;
  if (p >= 1) return 1;
  return Math.ceil(Math.log(1 - conf) / Math.log(1 - p));
}
// El hueco de la pista dura lo que dura recorrerlo: su ancho por el tiempo que
// tarda el pie en barrer el acelerador entero.
const duracionHueco = (F, tBarrido) => anchoHueco(F) * tBarrido;

// Periodos DECLARADOS de este banco, en segundos. El del escaner es el de un
// dato en directo del modo 01 leido por el enlace serie; el del osciloscopio en
// barrido continuo es el de su refresco de pantalla; y el osciloscopio ARMADO
// en disparo unico no muestrea: espera al suceso y lo caza siempre.
const TS_ESCANER = 0.080;
const TS_OSC_CONT = 0.020;
const CONFIANZA = 0.95;
const T_PISOTON = 0.30;
const T_BARRIDO_LENTO = 5.0;
const BARRIDOS = [0.30, 0.80, 2.0, 5.0];

// ============================================================================
//  6 · LAS AVERIAS
//
//  Cada averia se declara por lo que CAMBIA fisicamente, nunca por su sintoma.
//  El sintoma lo tiene que sacar el modelo.
//
//  El banco CONGELA las averias intermitentes en su instante malo. En el coche
//  aparecen y desaparecen; aqui estan siempre, para que las cifras sean
//  repetibles. Lo que si se modela es la probabilidad de cazarlas.
// ============================================================================

const FALLAS = {
  sano: { rot: 'Sin avería',
    nota: 'La rueda fónica está entera, el entrehierro es el de fábrica, las tres rectas de calibración pasan por donde deben y la aguja del inyector se sienta a tiempo.' },
  dienteRoto: { dientesRotos: [17], rot: 'Un diente de la rueda fónica roto',
    nota: 'Falta UN pulso por vuelta y la razón que abre ese hueco no llega al umbral, así que la centralita sigue sincronizando bien. El régimen del escáner sale perfecto —se promedia sobre la vuelta entera— y la detección de fallo de encendido, que mira diente a diente, se vuelve loca.' },
  entrehierro: { entrehierroMul: 2.25, rot: 'Captador de cigüeñal flojo: entrehierro grande',
    nota: 'La misma avería mecánica tiene tres desenlaces según el captador. En uno inductivo la señal se hunde y con el motor de arranque no llega al umbral: gira y no arranca, y si arranca empujado funciona sin una queja. En uno de efecto Hall, o sigue conmutando exactamente igual o deja de conmutar del todo.' },
  ckpIntermit: { dientesRotos: [8, 9, 22], rot: 'Conector del cigüeñal intermitente',
    nota: 'Pierde pulsos sueltos. Dos seguidos abren un hueco IDÉNTICO al de referencia, así que la centralita cree ver dos referencias por vuelta y ya no sabe dónde está el motor. Ningún dato en directo lo enseña: hay que mirar pulso a pulso.' },
  cmpDesfasado: { dientesArbolSaltados: 1, rot: 'Correa saltada un diente en el árbol',
    nota: 'El árbol gira a la mitad, así que un diente de su rueda vale 720/Z grados de CIGÜEÑAL. La distribución se va y ningún dato en directo dice cuánto: hay que medir la fase con dos canales.' },
  cmpMuerto: { sinCmp: true, rot: 'Sensor del árbol de levas sin señal',
    nota: 'El motor arranca igual —la centralita prueba una sincronía y si falla prueba la otra—, pero tarda más y pierde la inyección secuencial. El escáner sí da un código; lo que no da es por qué.' },
  tpsPista: { tpsHueco: [0.42, 0.46], rot: 'Pista del acelerador gastada',
    nota: 'Un hueco estrecho en mitad del recorrido. En los dos extremos el sensor está perfecto, así que el multímetro lo da por bueno; y el hueco dura tan poco en un pisotón que casi nunca cae una lectura dentro.' },
  alimBaja: { vAlimMul: 0.82, rot: 'Caída en el cable de alimentación de 5 V',
    nota: 'El pin de referencia de la centralita sigue leyendo 5,00 V; a los sensores les llegan 4,10. Toda recta que cuelgue de esa alimentación se MULTIPLICA por el mismo factor, y los tres sensores mienten a la vez.' },
  masaAlta: { offsetV: 0.62, rot: 'Masa de sensores con resistencia',
    nota: 'La corriente de retorno cae sobre esa resistencia y toda señal referida a esa masa SUMA la misma tensión. Los tres sensores mienten a la vez y la línea de cero del osciloscopio ya no está en cero.' },
  mapManguera: { mapFijo: 1.013, sinRizado: true, rot: 'Manguera del colector rajada',
    nota: 'El sensor mide la atmósfera en vez del colector: tensión alta, plana y SIN rizado. La ausencia de rizado es el dato, y ningún número del escáner la contiene.' },
  mafSucio: { mafMul: 0.72, rot: 'Hilo caliente sucio',
    nota: 'Sub-declara el gasto de aire con la forma intacta: la recta sigue siendo una recta, sólo que más baja. Es la avería que NO se ve en la forma de la onda, y por eso hace falta comparar contra el valor esperado.' },
  apantallado: { ruidoV: 1.8, rot: 'Apantallamiento del cable roto',
    nota: 'El encendido acopla picos sobre la señal del cigüeñal, sincronizados con la chispa. Si un pico supera el umbral del comparador, la centralita cuenta dientes que no existen.' },
  inyPegado: { cierreMul: 2.0, rot: 'Aguja del inyector pegajosa',
    nota: 'La joroba de cierre se retrasa: la aguja tarda más en sentarse y el inyector entrega de más al final del pulso. No hay dato en directo que lo contenga.' },
};
const FALLA_KEYS = Object.keys(FALLAS);

// ============================================================================
//  7 · ARQUETIPOS
//
//  Cuatro motores con gestion distinta. Sus cotas caen dentro de las bandas
//  publicadas para su familia, pero NO son modelos comerciales: la rueda fonica,
//  el entrehierro y el inyector de un motor concreto estan en su manual de
//  taller y en ningun otro sitio.
// ============================================================================

const mk = m => ({
  pAtm: 1.013, rpmMax: 6500, umbralRazon: 2.5,
  tpsMin: 0.55, tpsMax: 4.45,
  mapP0: 0.15, mapP1: 1.05, mapV0: 0.30, mapV1: 4.70, mapRizado: 0.22,
  mafV0: 0.90, mafV1: 4.60, mafRizado: 0.16,
  // El pico inductivo se extingue en unas decimas de milisegundo; la aguja
  // tarda cerca de un milisegundo en sentarse. Por eso la joroba de cierre cae
  // sobre la COLA del pico, ya casi plana, y por eso se ve.
  inyR: 12.4, inyL: 22.0, inyCaida: 0.9, inyPico: 52, inyTauPico: 0.32,
  inyJoroba: 3.4, inyAnchoJoroba: 0.10, inyCierre: 1.15, inyApertura: 0.85,
  ...m,
});

const ARQ = {
  g16: mk({ key: 'g16', nombre: 'Gasolina 1.6 · 4 cil · rueda 60−2, captador inductivo', corto: '1.6 inductivo',
    nCil: 4, ralenti: 780, dientes: 60, faltan: 2, dienteHueco: 57, tipoCkp: 'inductivo',
    kCkp: 6.2, entrehierro: 0.80, entrehierroMax: 2.2, umbralCkp: 0.45,
    dientesArbol: 40, faseCmpNominal: 96, mapRalenti: 0.32, gastoMax: 90 }),
  g20: mk({ key: 'g20', nombre: 'Gasolina 2.0 · 4 cil · rueda 36−1, sensor de efecto Hall', corto: '2.0 Hall',
    nCil: 4, ralenti: 720, dientes: 36, faltan: 1, dienteHueco: 34, tipoCkp: 'hall',
    vHall: 5.0, entrehierro: 1.10, entrehierroMax: 2.4, umbralCkp: 2.0,
    // Su hueco de referencia es de UN diente, asi que abre una razon de 2 y el
    // umbral tiene que bajar por debajo. Y por debajo de 2 tambien cae la razon
    // que abre un diente ROTO: esta rueda no tiene margen ninguno.
    umbralRazon: 1.6,
    dientesArbol: 36, faseCmpNominal: 108, mapRalenti: 0.30, gastoMax: 112,
    tpsMin: 0.50, tpsMax: 4.50, inyR: 14.2, inyL: 25.5 }),
  t12: mk({ key: 't12', nombre: 'Gasolina 1.2 · 3 cil · rueda 60−2, captador inductivo', corto: '1.2 tres cil.',
    nCil: 3, ralenti: 820, dientes: 60, faltan: 2, dienteHueco: 57, tipoCkp: 'inductivo',
    kCkp: 5.4, entrehierro: 0.70, entrehierroMax: 2.0, umbralCkp: 0.50,
    dientesArbol: 32, faseCmpNominal: 84, mapRalenti: 0.34, gastoMax: 68,
    mapRizado: 0.30, mafRizado: 0.22, inyR: 11.8, inyL: 19.5, inyCierre: 1.02 }),
  v6: mk({ key: 'v6', nombre: 'Gasolina 3.5 V6 · rueda 60−2, sensor de efecto Hall', corto: '3.5 V6 Hall',
    nCil: 6, ralenti: 680, dientes: 60, faltan: 2, dienteHueco: 57, tipoCkp: 'hall',
    vHall: 5.0, entrehierro: 1.00, entrehierroMax: 2.3, umbralCkp: 2.0,
    dientesArbol: 44, faseCmpNominal: 72, mapRalenti: 0.28, gastoMax: 175,
    mapRizado: 0.16, inyR: 13.6, inyL: 24.0, inyCierre: 1.30 }),
};
const ARQ_KEYS = Object.keys(ARQ);

const REGIMENES = [220, 800, 1500, 2500, 4000, 6000];
const ACELERACIONES = [0, 0.2, 0.45, 0.7, 1];

// ============================================================================
//  8 · ESCENARIOS, PROTOCOLO, CODIGOS Y CENSO
// ============================================================================

const ESCEN = {
  sano:         { rot: 'Sistema sano', falla: 'sano', clave: 'nada que reparar' },
  dienteRoto:   { rot: 'Un diente de la rueda fónica roto', falla: 'dienteRoto', clave: 'rueda fónica' },
  entrehierro:  { rot: 'Captador de cigüeñal flojo', falla: 'entrehierro', clave: 'captador de cigüeñal' },
  ckpIntermit:  { rot: 'Conector del cigüeñal intermitente', falla: 'ckpIntermit', clave: 'captador de cigüeñal' },
  cmpDesfasado: { rot: 'Correa saltada un diente', falla: 'cmpDesfasado', clave: 'sincronización' },
  cmpMuerto:    { rot: 'Sensor del árbol sin señal', falla: 'cmpMuerto', clave: 'sincronización' },
  tpsPista:     { rot: 'Pista del acelerador gastada', falla: 'tpsPista', clave: 'posición de mariposa' },
  alimBaja:     { rot: 'Caída en la alimentación de 5 V', falla: 'alimBaja', clave: 'alimentación y masa' },
  masaAlta:     { rot: 'Masa de sensores con resistencia', falla: 'masaAlta', clave: 'alimentación y masa' },
  mapManguera:  { rot: 'Manguera del colector rajada', falla: 'mapManguera', clave: 'presión de colector' },
  mafSucio:     { rot: 'Hilo caliente sucio', falla: 'mafSucio', clave: 'medición de aire' },
  apantallado:  { rot: 'Apantallamiento del cable roto', falla: 'apantallado', clave: 'cableado y apantallamiento' },
  inyPegado:    { rot: 'Aguja del inyector pegajosa', falla: 'inyPegado', clave: 'inyector' },
};
const ESCEN_KEYS = Object.keys(ESCEN);
const FAMILIAS = [...new Set(ESCEN_KEYS.map(k => ESCEN[k].clave))];

// Los tres puntos del protocolo. El primero —girando con el arranque— es el que
// separa las averias que solo se ven cuando la señal es mas debil.
const PUNTOS = [
  { k: 'arranque', rot: 'girando con el motor de arranque', rpm: RPM_ARRANQUE, acel: 0 },
  { k: 'ralenti', rot: 'a ralentí', ral: true, acel: 0 },
  { k: 'carga', rot: '2 500 rpm al 45 % de acelerador', rpm: 2500, acel: 0.45 },
];

// Umbrales DECLARADOS con los que la centralita de este banco decide que un
// sensor no cuadra. Son los de su autodiagnostico, no los de la fisica.
const UMBRAL_TPS_V = 0.40;      // V de desviacion a mariposa cerrada
const UMBRAL_MAP_V = 1.00;      // V de desviacion a ralenti
const UMBRAL_MAF_REL = 0.15;    // desviacion relativa contra el modelo carga-regimen
const UMBRAL_FASE = 5;          // grados de cigueñal

function codigos(e, F = {}) {
  const c = [];
  if (!pasaUmbral(e, RPM_ARRANQUE, F) || !sincroniza(e, F)) c.push('P0335');
  if (dientesPresentes(e, F).length < dientesPresentes(e, {}).length || pulsosFalsos(e, F) > 0) c.push('P0300');
  if (!hayCmp(e, F)) c.push('P0340');
  if (hayCmp(e, F) && Math.abs(desfaseCmp(e, F)) > UMBRAL_FASE) c.push('P0016');
  if (Math.abs(vTps(e, 0, F) - vTps(e, 0, {})) > UMBRAL_TPS_V) c.push('P0121');
  if (Math.abs(vMap(e, e.ralenti, 0, F) - vMap(e, e.ralenti, 0, {})) > UMBRAL_MAP_V) c.push('P0106');
  const mr = vMaf(e, 2500, 0.45, {});
  if (Math.abs(vMaf(e, 2500, 0.45, F) - mr) / mr > UMBRAL_MAF_REL) c.push('P0101');
  return [...new Set(c)].sort();
}
const CODIGO_ROT = {
  P0016: 'P0016 · correlación cigüeñal-árbol',
  P0101: 'P0101 · rendimiento del medidor de masa de aire',
  P0106: 'P0106 · rendimiento del sensor de presión de colector',
  P0121: 'P0121 · rendimiento del circuito de mariposa',
  P0300: 'P0300 · fallo de encendido sin cilindro identificado',
  P0335: 'P0335 · circuito del sensor de cigüeñal',
  P0340: 'P0340 · circuito del sensor de árbol de levas',
};

function lecturas(e, esc) {
  const E = ESCEN[esc], F = FALLAS[E.falla];
  const pts = PUNTOS.map(P => {
    const rpm = P.ral ? e.ralenti : P.rpm;
    return {
      k: P.k, rot: P.rot, rpm, acel: P.acel,
      ampCkp: ampCkp(e, rpm, F), ampSano: ampCkp(e, rpm, {}), pasa: pasaUmbral(e, rpm, F),
      vTps: vTps(e, P.acel, F), vMap: vMap(e, rpm, P.acel, F), vMaf: vMaf(e, rpm, P.acel, F),
      vTpsSano: vTps(e, P.acel, {}), vMapSano: vMap(e, rpm, P.acel, {}), vMafSano: vMaf(e, rpm, P.acel, {}),
      rizado: rizadoMap(e, P.acel, F), rizadoSano: rizadoMap(e, P.acel, {}),
      fRizado: fAspiracion(e, rpm),
    };
  });
  const oi = ondaInyector(e, { F });
  return {
    esc, rot: E.rot, clave: E.clave, falla: E.falla,
    pts, arranca: arranca(e, F), sostiene: sostiene(e, F), sincroniza: sincroniza(e, F),
    huecos: huecosDetectados(e, F), razonMax: razonMax(e, F), razonSegunda: razonSegunda(e, F),
    razonSanaMax: razonMax(e, {}), razonSanaSegunda: razonSegunda(e, {}),
    pulsos: dientesPresentes(e, F).length, pulsosSano: dientesPresentes(e, {}).length,
    falsos: pulsosFalsos(e, F), ruidoV: F.ruidoV || 0, entrehierro: entrehierroDe(e, F),
    desfase: hayCmp(e, F) ? desfaseCmp(e, F) : null, hayCmp: hayCmp(e, F),
    tCierre: oi.tCierre, tCierreSano: e.inyCierre,
    vTpsAbre: vTps(e, 1, F), vTpsAbreSano: vTps(e, 1, {}),
    anchoHueco: anchoHueco(F), ruido: F.ruidoV || 0, offset: F.offsetV || 0,
    vAlim: vAlim(F), codigos: codigos(e, F),
    tHueco: duracionHueco(F, T_PISOTON),
    pPisoton: pCaza(duracionHueco(F, T_PISOTON), TS_ESCANER),
    pBarridoLento: pCaza(duracionHueco(F, T_BARRIDO_LENTO), TS_ESCANER),
    repPisoton: repeticionesPara(duracionHueco(F, T_PISOTON), TS_ESCANER, CONFIANZA),
  };
}

// Las trece observaciones. Las que llevan `taller: true` se hacen con lo que hay
// en cualquier taller —escaner, multimetro y la llave de contacto—; las otras
// piden osciloscopio, y una de ellas, dos canales. Por eso valen aparte.
const OBS = [
  { k: 'arranque', rot: '¿Arranca el motor?', res: 1, uni: '', taller: true },
  { k: 'codigo', rot: 'Códigos de avería en el escáner', res: 1, uni: '', taller: true },
  { k: 'tpsCerr', rot: 'Tensión del acelerador cerrado (multímetro)', res: 0.1, uni: 'V', taller: true },
  { k: 'tpsAbre', rot: 'Tensión del acelerador a fondo (multímetro)', res: 0.1, uni: 'V', taller: true },
  { k: 'barrido', rot: 'Barrido LENTO del acelerador con el escáner', res: 1, uni: '', taller: true },
  { k: 'mapRal', rot: 'Tensión del sensor de presión a ralentí (multímetro)', res: 0.1, uni: 'V', taller: true },
  { k: 'mafCarga', rot: 'Tensión del hilo caliente en carga (multímetro)', res: 0.1, uni: 'V', taller: true },
  { k: 'forma', rot: 'Forma de la onda del cigüeñal (osciloscopio)', res: 1, uni: '', taller: false },
  { k: 'amplitud', rot: 'Amplitud del cigüeñal al arranque (osciloscopio)', res: 0.2, uni: 'V', taller: false },
  { k: 'cero', rot: 'Línea de cero de la señal (osciloscopio)', res: 0.1, uni: 'V', taller: false },
  { k: 'rizado', rot: 'Rizado de la admisión a ralentí (osciloscopio)', res: 0.05, uni: 'V', taller: false },
  { k: 'fase', rot: 'Fase cigüeñal-árbol (osciloscopio de 2 canales)', res: 2, uni: '°', taller: false },
  { k: 'cierre', rot: 'Joroba de cierre del inyector (osciloscopio)', res: 0.1, uni: 'ms', taller: false },
];
const cuant = (x, r) => Math.round(x / r) * r;

function firmaObs(e, L, sub) {
  return sub.map(m => {
    switch (m.k) {
      case 'arranque': return L.arranca ? '1' : '0';
      case 'codigo': return L.codigos.length ? L.codigos.join('+') : '-';
      // El multimetro da UN numero con el pedal QUIETO: por eso un hueco
      // estrecho en mitad del recorrido no aparece nunca en estas dos.
      case 'tpsCerr': return cuant(L.pts[1].vTps, m.res).toFixed(1);
      case 'tpsAbre': return cuant(L.vTpsAbre, m.res).toFixed(1);
      // El barrido lento del escaner: con el hueco durando mas que el periodo
      // de muestreo, lo caza SIEMPRE.
      case 'barrido': return L.pBarridoLento >= 1 ? 'hueco' : '-';
      case 'mapRal': return cuant(L.pts[1].vMap, m.res).toFixed(1);
      case 'mafCarga': return cuant(L.pts[2].vMaf, m.res).toFixed(1);
      // El osciloscopio SIEMPRE ve el ruido acoplado, pase o no del umbral del
      // comparador. Que ese ruido rompa algo es otra cuestion, y depende del
      // captador.
      case 'forma': return `${L.pulsos}/${L.falsos}/${L.razonMax.toFixed(1)}/${L.ruidoV > 0 ? 'r' : '-'}`;
      case 'amplitud': return cuant(L.pts[0].ampCkp, m.res).toFixed(1);
      case 'cero': return cuant(L.offset, m.res).toFixed(1);
      case 'rizado': return cuant(L.pts[1].rizado, m.res).toFixed(2);
      case 'fase': return L.desfase === null ? 'sin señal' : cuant(L.desfase, m.res).toFixed(0);
      case 'cierre': return cuant(L.tCierre, m.res).toFixed(1);
      default: return '?';
    }
  }).join('|');
}

function censoSub(e) {
  const cache = ESCEN_KEYS.map(k => ({ k, L: lecturas(e, k) }));
  const out = [];
  for (let m = 1; m < (1 << OBS.length); m++) {
    const sub = OBS.filter((_, i) => m & (1 << i));
    const grupos = new Map();
    for (const { k, L } of cache) {
      const f = firmaObs(e, L, sub);
      if (!grupos.has(f)) grupos.set(f, []);
      grupos.get(f).push({ k, clave: L.clave });
    }
    let conflictos = 0, enConflicto = 0;
    for (const g of grupos.values()) {
      if (new Set(g.map(x => x.clave)).size > 1) { conflictos++; enConflicto += g.length; }
    }
    out.push({ mask: m, sub, clases: grupos.size, n: cache.length,
      conflictos, enConflicto, resueltos: cache.length - enConflicto });
  }
  out.sort((a, b) => (b.resueltos - a.resueltos) || (a.sub.length - b.sub.length) || (b.clases - a.clases));
  return out;
}

// Un escenario solo puede salir en el reto si en ESTA maquina deja alguna huella
// con TODAS las observaciones sobre la mesa. Un captador de efecto Hall que
// sigue conmutando igual con el doble de entrehierro no deja ninguna, y ofrecer
// ese caso seria pedir que se adivine.
function distinguible(e, esc) {
  if (esc === 'sano') return false;
  return firmaObs(e, lecturas(e, esc), OBS) !== firmaObs(e, lecturas(e, 'sano'), OBS);
}
const casosReto = e => ESCEN_KEYS.filter(k => distinguible(e, k));
const casosMudos = e => ESCEN_KEYS.filter(k => k !== 'sano' && !distinguible(e, k));

// ============================================================================
// T1 · FORMATO, ESTADO Y CAPA DE MEMORIA
// ============================================================================

// Espacio fino no separable: el mismo que usa el resto del dominio D6. Nunca se
// llama a toLocaleString, que en este navegador formatea a la inglesa.
const NBSP=' ';
function num(x,d=1){
  if(x===null||x===undefined) return '—';
  if(!isFinite(x)) return x>0?'∞':'—';
  const s=Math.abs(x).toFixed(d);
  const [ent,dec]=s.split('.');
  let e=''; for(let i=0;i<ent.length;i++){ if(i>0 && (ent.length-i)%3===0) e+=NBSP; e+=ent[i]; }
  return (x<0?'−':'')+e+(dec?','+dec:'');
}
const volt=(x,d=2)=>num(x,d)+NBSP+'V';
const mili=(x,d=2)=>num(x,d)+NBSP+'ms';
const amp=(x,d=3)=>num(x,d)+NBSP+'A';
const bar=(x,d=3)=>num(x,d)+NBSP+'bar';
const gs=(x,d=1)=>num(x,d)+NBSP+'g/s';
const pc=(x,d=1)=>num(x,d)+NBSP+'%';
const rpmT=x=>num(x,0)+NBSP+'rpm';
const gra=(x,d=1)=>num(x,d)+NBSP+'°';
const mm=(x,d=2)=>num(x,d)+NBSP+'mm';
const hz=(x,d=1)=>num(x,d)+NBSP+'Hz';
// El desfase se escribe SIEMPRE con signo: adelantado y retrasado son averías
// distintas y un «18 °» a secas no dice de qué lado.
const firm=(x,d=1)=>(x>=0?'+':'')+num(x,d)+NBSP+'°';

// --- estado observable ------------------------------------------------------
const G={
  maq:'g16',          // clave de ARQ
  esc:'sano',         // clave de ESCEN
  rpm:800,            // régimen al que se mira la señal
  acel:0.30,          // posición del acelerador, 0..1
  canal:'ckp',        // qué señal enseña el osciloscopio en el modo de sensores
  barrido:0.30,       // segundos en recorrer el acelerador entero
  modo:'sensores',
  resuelto:false
};
const MQ=()=>ARQ[G.maq];
const FALLA=()=>ESCEN[G.esc].falla;
const FA=()=>FALLAS[FALLA()];
const OBS_TALLER=OBS.filter(o=>o.taller);
const OBS_OSC=OBS.filter(o=>!o.taller);

// Con el motor de arranque el régimen NO es el del mando: lo impone el motor de
// arranque. Mirar la señal «a 220 rpm con el acelerador a fondo» sería mirar un
// punto que no existe en ningún coche.
const rpmVista=()=>G.rpm;
const enArranque=()=>G.rpm<=RPM_ARRANQUE;

// --- capa de memoria --------------------------------------------------------
// `trazaCkp` recorre mil cuatrocientos puntos y `censoSub` recorre 8 191
// subconjuntos: los dos se piden varias veces por repintado. Se cachean por
// firma EXACTA de los argumentos; si cambia un solo dígito se recalcula. Nunca
// se reutiliza una cifra «parecida».
const MEMO=new Map();
function memo(k,fn){ if(MEMO.has(k)) return MEMO.get(k); const v=fn(); MEMO.set(k,v); return v; }
function invalida(){ MEMO.clear(); }

function TRZ(o={}){
  const rpm=o.rpm===undefined?rpmVista():o.rpm;
  const esc=o.esc===undefined?G.esc:o.esc;
  const n=o.n===undefined?1400:o.n;
  return memo(`t|${G.maq}|${esc}|${rpm}|${n}`,
    ()=>trazaCkp(MQ(),rpm,{falla:ESCEN[esc].falla,n}));
}
function INY(o={}){
  const esc=o.esc===undefined?G.esc:o.esc;
  return memo(`i|${G.maq}|${esc}`,()=>ondaInyector(MQ(),{falla:ESCEN[esc].falla}));
}
function LECT(){ return LECT_DE(G.esc); }
function LECT_DE(esc){ return memo(`l|${G.maq}|${esc}`,()=>lecturas(MQ(),esc)); }
function CENSO(){ return memo(`n|${G.maq}`,()=>censoSub(MQ())); }
function RETO_CASOS(){ return memo(`r|${G.maq}`,()=>casosReto(MQ())); }
function MUDOS(){ return memo(`m|${G.maq}`,()=>casosMudos(MQ())); }
// Las familias que se ofrecen en el diagnóstico a ciegas salen de los casos que
// ESTA máquina puede plantear, no del catálogo entero: ofrecer una familia que
// nunca puede ser la correcta es pedir que se adivine.
function FAMILIAS_RETO(){ return memo(`f|${G.maq}`,()=>[...new Set(RETO_CASOS().map(k=>ESCEN[k].clave))]); }

// ============================================================================
// VEREDICTOS
//
// Se evalúan SEPARADOS a propósito, porque el laboratorio demuestra que no son
// equivalentes: hay averías que el escáner declara con un código, hay averías
// que el escáner no puede ver de ninguna manera, y hay una avería que en una de
// las cuatro máquinas no deja huella en NINGÚN instrumento del banco.
// ============================================================================

function veredicto(){
  const L=LECT(), S=LECT_DE('sano');
  return {
    L, S,
    arranca:L.arranca, sostiene:L.sostiene, sincroniza:L.sincroniza,
    // La señal más débil de la vida del motor es la del arranque, y por eso hay
    // averías que sólo se ven ahí.
    debilArranque:!L.pts[0].pasa,
    debilRalenti:!L.pts[1].pasa,
    faltanPulsos:L.pulsos<L.pulsosSano,
    hayFalsos:L.falsos>0,
    hayRuido:L.ruidoV>0,
    desfasado:L.desfase!==null&&Math.abs(L.desfase)>UMBRAL_FASE,
    sinCmp:!L.hayCmp,
    huecoPista:L.anchoHueco>0,
    escala:Math.abs(L.vAlim-V_REF)>1e-9,
    cero:Math.abs(L.offset)>1e-9,
    cierreTarde:L.tCierre>L.tCierreSano+1e-9,
    dtc:L.codigos,
    malo:!L.arranca||!L.sincroniza||L.pulsos<L.pulsosSano||L.falsos>0||L.ruidoV>0
      ||(L.desfase!==null&&Math.abs(L.desfase)>UMBRAL_FASE)||!L.hayCmp
      ||L.anchoHueco>0||Math.abs(L.vAlim-V_REF)>1e-9||Math.abs(L.offset)>1e-9
      ||L.tCierre>L.tCierreSano+1e-9||Math.abs(L.pts[2].vMaf-S.pts[2].vMaf)>1e-9
      ||Math.abs(L.pts[1].vMap-S.pts[1].vMap)>1e-9
  };
}

// Con qué se confunde ESTA avería si sólo se tiene el taller corriente, y qué
// observación de osciloscopio la separa. No se afirma: se calcula comparando
// firmas de observación contra los otros doce escenarios.
function veredictoEngano(){
  const e=MQ(), L=LECT();
  const fT=firmaObs(e,L,OBS_TALLER);
  const gemelos=ESCEN_KEYS.filter(k=>k!==G.esc&&firmaObs(e,LECT_DE(k),OBS_TALLER)===fT);
  const fTodo=firmaObs(e,L,OBS);
  const mudos=ESCEN_KEYS.filter(k=>k!==G.esc&&firmaObs(e,LECT_DE(k),OBS)===fTodo);
  // Qué medida de osciloscopio separa a esta avería de cada uno de sus gemelos.
  const separan=OBS_OSC.filter(m=>gemelos.every(k=>firmaObs(e,LECT_DE(k),[m])!==firmaObs(e,L,[m])));
  return {
    fT, gemelos, mudos, separan,
    limpio:L.codigos.length===0,
    // El escáner sale impecable y aun así el motor tiene algo. Es el hallazgo
    // que la práctica quiere que quede escrito.
    engana:L.codigos.length===0&&G.esc!=='sano',
    // Y el caso extremo: ni con todo el banco se separa de otro escenario.
    ciego:mudos.length>0,
    nivel:(mudos.length>0)?'bad':(gemelos.length>0?'warn':'good')
  };
}

// Lo que el escáner puede sacar de la pista gastada con un solo pisotón, y lo
// que hace falta para estar seguro. Todo sale del motor sellado.
function veredictoCaza(){
  const F=FA(), ancho=anchoHueco(F);
  const tau=duracionHueco(F,G.barrido);
  const pE=pCaza(tau,TS_ESCANER), pO=pCaza(tau,TS_OSC_CONT);
  return {
    ancho, tau, pE, pO,
    repE:repeticionesPara(tau,TS_ESCANER,CONFIANZA),
    repO:repeticionesPara(tau,TS_OSC_CONT,CONFIANZA),
    // El barrido a partir del cual el escáner ya no puede fallar: aquel en el
    // que el hueco dura tanto como su periodo de muestreo.
    tSeguro:ancho>0?TS_ESCANER/ancho:null,
    hay:ancho>0
  };
}

// --- materiales -------------------------------------------------------------
// El donante ya define castAluminum/brushedMetal/rubber/techPlastic. Aquí sólo
// van los que este laboratorio necesita. std() se llama en forma de objeto para
// que componga con los spreads.
const std=o=>new THREE.MeshStandardMaterial(o);
const emis=(hex,i)=>std({color:hex,emissive:hex,emissiveIntensity:i,roughness:0.42,metalness:0.10});
const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.09,0.10,0.12), rub=rubber();

const AZUL='#8AB4F8', NARANJA='#F2A65A', OK_HEX='#7CD992', BAD_HEX='#ff6b6b',
      WARN_HEX='#E9C46A', VIO='#C08CF8', GRIS='#8f97a5', CIAN='#5BD4E5',
      TINTA='#dbe4f0', AMBAR='#E0A33E', ROSA='#EF8FB4';

const MAT={
  bloque: std({...alu, color:0x6b727b, metalness:0.55, roughness:0.72}),
  culata: std({...alu, color:0x79808a, metalness:0.50, roughness:0.66}),
  acero:  std({...brush, metalness:1.0, roughness:0.32}),
  crom:   std({...brush, metalness:1.0, roughness:0.16}),
  banco:  std({...plas, metalness:0.20, roughness:0.62}),
  caja:   std({...plas, metalness:0.24, roughness:0.54}),
  goma:   std({...rub, color:0x141a22, roughness:0.96, metalness:0.0}),
  ok:     emis(0x7CD992,1.3),
  bad:    emis(0xff6b6b,1.5),
  avi:    emis(0xE9C46A,1.4),
};
const MAT_DIENTE=std({color:0x8a929c,metalness:0.88,roughness:0.34});
const MAT_TUBO  =std({color:0x2a333f,metalness:0.55,roughness:0.58});
const MAT_MANG  =std({...rub, color:0x181e26, roughness:0.94, metalness:0.0});
const MAT_INY   =std({color:0x2b333d,metalness:0.35,roughness:0.52});
const MAT_CABLE =std({color:0x1b222c,metalness:0.20,roughness:0.78});
const MAT_PANT  =std({color:0x0a1016,metalness:0.10,roughness:0.30});

// Un color por señal, y el MISMO en la escena, en el osciloscopio, en el
// pizarrón y en la leyenda, para que nadie tenga que traducir entre vistas.
const COL_SEN={ckp:CIAN, cmp:VIO, tps:NARANJA, map:AZUL, maf:OK_HEX, iny:ROSA};
const ROT_SEN={ckp:'cigüeñal', cmp:'árbol de levas', tps:'posición de mariposa',
  map:'presión de colector', maf:'masa de aire', iny:'mando del inyector'};
const CANALES=['ckp','cmp','tps','map','maf','iny'];
const hex6=n=>'#'+n.toString(16).padStart(6,'0');
const colHex=s=>parseInt(String(COL_SEN[s]).slice(1),16);

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
// Cotas del pizarrón. Es GRANDE a propósito: los paneles de la interfaz tapan
// cuatro décimas del ancho de la pantalla, y con un pizarrón pequeño la única
// forma de que el banco entrara en el hueco que queda era alejarse tanto que el
// texto del tablero dejaba de leerse. Aquí la práctica está en el tablero.
const BW3=5.60, BH3=4.04, BY3=2.25;
function colocaTablero(d){
  board.rotation.y=0.70;
  // El pizarrón se pega al borde IZQUIERDO real del banco, descontando su propio
  // medio ancho proyectado sobre el eje X. Colocarlo a partir de un «ancho
  // total» inventado deja un metro de mesa vacía entre los dos y echa el banco
  // fuera del cuadro.
  const medio=(BW3/2+0.13)*Math.cos(board.rotation.y);
  board.position.set(d.xIzq-0.70-medio,0,0.95);
}
// Encuadre que mete el pizarrón Y el banco. La distancia NO se calcula con una
// regla de tres sobre el ancho: se PRUEBA contra el tronco de visión punto por
// punto y se busca la menor que los mete todos. Repartir el ancho como si todo
// estuviera a la misma profundidad deja al banco —que está mucho más cerca de la
// cámara que el pizarrón— ocupando tres cuartos del cuadro mientras el pizarrón
// se queda en un rincón, y eso sólo se ve mirando la pantalla.
function puntosClave(){
  const d=dims(MQ());
  const a=BW3/2, mx=a*Math.cos(board.rotation.y), mz=a*Math.sin(board.rotation.y);
  const y0=BY3-BH3/2, y1=BY3+BH3/2, bp=board.position;
  return [
    [bp.x-mx,y0,bp.z+mz],[bp.x+mx,y0,bp.z-mz],
    [bp.x-mx,y1,bp.z+mz],[bp.x+mx,y1,bp.z-mz],
    // Los OCHO extremos reales del banco. Sin el borde derecho aquí, la cámara
    // no sabe dónde acaba el banco y deja el osciloscopio —y medio motor— debajo
    // del panel de mandos: sale un encuadre que parece bueno hasta que se mira.
    [d.xIzq,0.10,0.28],[d.xIzq,2.66,-0.30],
    [d.xDer,0.10,0.28],[d.xDer,1.44,-0.78],
    [d.xDer,0.10,-1.12],[d.centro,2.66,-0.22],
    [d.xR,2.66,-0.22],[d.centro,0.10,0.28],
  ].map(p=>new THREE.Vector3(...p));
}
// La franja de pantalla que de verdad se ve. El HUD tapa la izquierda y el panel
// de mandos tapa la derecha: encuadrar contra el ancho completo del lienzo mete
// casi cuatro décimas del banco DEBAJO de los paneles, y desde fuera parece que
// la cámara está mal cuando lo que está mal es la cuenta.
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
  // lienzo y que los paneles tapen lo que tapen, porque la alternativa es alejar
  // la cámara hasta que no se lea nada.
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
    const [P,C]=camTablero(dist,o);
    const p=new THREE.Vector3(...P), c=new THREE.Vector3(...C);
    const f=c.clone().sub(p).normalize();
    const r=new THREE.Vector3().crossVectors(f,new THREE.Vector3(0,1,0)).normalize();
    const u=new THREE.Vector3().crossVectors(r,f).normalize();
    let a=Infinity,b=-Infinity,vy=0,zs=0,n=0,malo=false;
    for(const q of pts){
      const v=q.clone().sub(p), z=v.dot(f);
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
// Encuadre del pizarrón: se calcula desde su propia transformada, no con
// coordenadas escritas a mano, porque el pizarrón se mueve con el ancho del
// banco y unas coordenadas fijas lo dejan medio fuera de cuadro en cuanto se
// cambia de arquetipo.
function camTablero(d,off){
  const c=board.position.clone(); c.y=BY3;
  const n=new THREE.Vector3(Math.sin(board.rotation.y),0,Math.cos(board.rotation.y));
  const dd=d||5.85;
  // La altura sube con la distancia. Con una altura fija, alejarse deja la vista
  // casi horizontal y la mesa se ve de canto.
  const p=c.clone().addScaledVector(n,dd); p.y=BY3+0.13*dd;
  // El HUD tapa la franja izquierda de la pantalla, así que por omisión se apunta
  // un poco a la izquierda del centro del pizarrón para que el pizarrón caiga a
  // su derecha. Con un desplazamiento POSITIVO el pizarrón se corre hacia la
  // izquierda y el banco —que está a su derecha— entra en el cuadro.
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
  const pie=BY3-BH3/2-0.12;
  for(const sx of [-1,1]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,pie,16),MAT.acero);
    p.position.set(sx*2.36,pie/2,0); p.castShadow=true; board.add(p);
  }
}

// ------------------------------------------------------------- primitivas 2D
function bg(){
  const g=bx.createLinearGradient(0,0,0,BH);
  g.addColorStop(0,'#0d131c'); g.addColorStop(1,'#070a10');
  bx.fillStyle=g; bx.fillRect(0,0,BW,BH);
}
function texto(t,x,y,o={}){
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
function wrapText(t,x,y,w,lh,o={}){
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
function tabla(x,y,cols,rows,o={}){
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
// Título que se encoge hasta caber: cambiar de máquina cambia la longitud del
// rótulo, y un rótulo largo se monta encima del de al lado sin avisar.
function textoFit(t,x,y,maxW,o={}){
  let s=o.s||16;
  while(s>11){
    bx.font=(o.b?'700 ':'400 ')+s+'px Inter,system-ui,sans-serif';
    if(bx.measureText(t).width<=maxW) break;
    s-=0.5;
  }
  texto(t,x,y,Object.assign({},o,{s}));
}
function etiqueta(t,x,y,c,al){
  bx.font='400 12px Inter,system-ui,sans-serif';
  const w=bx.measureText(t).width+16, x0=(al==='right')?x-w:x;
  rpanel(x0,y-14,w,20,'rgba(8,12,18,0.80)',null,6);
  texto(t,x0+8,y,{s:12,c:c||TINTA});
}
function leyenda(x,y,items){
  bx.font='400 13px Inter,system-ui,sans-serif';
  const w=Math.max(...items.map(it=>bx.measureText(it[0]).width))+48;
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
// Recorta al rectángulo de la gráfica. Sin esto, una barra o una curva que se
// sale por arriba se pinta sobre la cabecera y nadie lo nota.
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
  return {X,Y};
}
function serieXY(M,pts,c,w,dash){ linea(pts.map(p=>[M.X(p[0]),M.Y(p[1])]),c,w,dash); }
function punteo(M,x,y,c,r){
  bx.save(); bx.fillStyle=c; bx.beginPath(); bx.arc(M.X(x),M.Y(y),r||4.5,0,Math.PI*2); bx.fill(); bx.restore();
}
// Línea de referencia horizontal. Si el nivel cae fuera del recuadro no se
// pinta: una línea de límite dibujada sobre el borde miente sobre dónde está.
function nivel(P,M,v,c,rot,dash){
  const yy=M.Y(v);
  if(yy<P.y-1||yy>P.y+P.h+1) return;
  linea([[P.x,yy],[P.x+P.w,yy]],c,1.6,dash||[7,5]);
  if(rot) etiqueta(rot,P.x+P.w-8,yy-6,c,'right');
}
// Cabecera común: toda vista dice qué motor y en qué punto de trabajo se está
// mirando. Una cifra sin su configuración al lado no significa nada, y aquí hay
// cinco mandos que la cambian.
function cabMaquina(){
  const e=MQ();
  return e.corto+' · rueda '+e.dientes+'−'+e.faltan+' · captador '+
    (e.tipoCkp==='hall'?'de efecto Hall':'inductivo')+' · '+e.nCil+NBSP+'cil.';
}
function cabPunto(){
  return (enArranque()?'girando con el motor de arranque · ':'')+rpmT(rpmVista())+
    ' · acelerador '+pc(G.acel*100,0)+' · barrido del pedal '+num(G.barrido,2)+NBSP+'s';
}
// En el diagnóstico a ciegas la cabecera NO puede decir qué avería está puesta:
// decirlo delataría la respuesta antes de tomar la primera medida.
function cabecera(t,sub){
  const ciego=(G.modo==='reto');
  const l1=cabMaquina();
  const l2=cabPunto()+(ciego?'  ·  avería: por determinar':'');
  texto(l1,BW-42,44,{s:13,c:CIAN,al:'right'});
  texto(l2,BW-42,68,{s:13,c:ciego?WARN_HEX:'#8c98a9',al:'right'});
  // El ancho que le queda al título es el que NO ocupa la línea de la máquina, y
  // se mide de verdad: escribir un ancho fijo deja el título montado encima del
  // rótulo del motor en cuanto la pregunta es larga.
  bx.font='400 13px Inter,system-ui,sans-serif';
  const libre=Math.max(240,(BW-42-bx.measureText(l1).width-24)-42);
  textoFit(t,42,50,libre,{s:26,b:true});
  wrapText(sub,42,92,BW-84,18,{s:13,c:'#8c98a9'});
  linea([[42,116],[BW-42,116]],'#1e2836',1.4);
}
// Banda de veredicto al pie del pizarrón. La altura se MIDE a partir del texto
// que va a llevar: una banda de altura fija recorta su tercera línea y el texto
// existe pero no se ve, y ninguna prueba numérica puede darse cuenta.
function lineasDe(t,w,s){
  bx.font='400 '+s+'px Inter,system-ui,sans-serif';
  let n=1, ln='';
  for(const p of String(t).split(' ')){
    const test=ln?ln+' '+p:p;
    if(bx.measureText(test).width>w&&ln){ n++; ln=p; } else ln=test;
  }
  return n;
}
function banda(y,nivel,rot,txt){
  const SZ=12.5, LH=17, W=BW-120;
  const h=Math.max(60, 32+lineasDe(txt,W,SZ)*LH+10);
  const yy=Math.min(y, BH-14-h);
  const col=nivel==='bad'?BAD_HEX:(nivel==='warn'?WARN_HEX:OK_HEX);
  const fondo=nivel==='bad'?'rgba(255,107,107,0.10)':(nivel==='warn'?'rgba(233,196,106,0.10)':'rgba(124,217,146,0.10)');
  rpanel(42,yy,BW-84,h,fondo,col,10);
  texto(rot,60,yy+24,{s:14,b:true,c:col});
  wrapText(txt,60,yy+44,W,LH,{s:SZ,c:'#c3ccd8'});
  return yy+h;
}

// ============================================================ T2b · VISTAS
// Rótulos cortos. Los largos se salen de una columna de tabla y de un botón, y
// eso no se ve escribiendo el número: se ve mirando la pantalla.
const OBS_CORTO={
  arranque:'¿arranca?', codigo:'códigos', tpsCerr:'V acel. cerrado', tpsAbre:'V acel. a fondo',
  barrido:'barrido lento', mapRal:'V presión ralentí', mafCarga:'V aire en carga',
  forma:'forma de la onda', amplitud:'amplitud al arranque', cero:'línea de cero',
  rizado:'rizado', fase:'fase cig.-árbol', cierre:'joroba de cierre'
};
const ESC_CORTO={
  sano:'sano', dienteRoto:'diente roto', entrehierro:'entrehierro', ckpIntermit:'conector',
  cmpDesfasado:'correa', cmpMuerto:'árbol mudo', tpsPista:'pista gastada',
  alimBaja:'alimentación', masaAlta:'masa', mapManguera:'manguera', mafSucio:'hilo sucio',
  apantallado:'apantallado', inyPegado:'aguja pegada'
};

// --- trazas que pinta cada canal -------------------------------------------
// Todas salen del motor sellado. Ninguna vista dibuja una curva «parecida».
function serieCanal(k,esc){
  const e=MQ(), F=FALLAS[ESCEN[esc||G.esc].falla], rpm=rpmVista();
  if(k==='ckp'){
    const T=TRZ({esc:esc||G.esc});
    return { pts:T.pts.map(p=>[p.ang,p.v]), x0:0, x1:360, rx:'ángulo de cigüeñal  (°)',
      ry:'tensión  (V)', y0:null, y1:null, uni:'V' };
  }
  if(k==='cmp'){
    // El árbol da un pulso por CICLO, así que su ventana es de 720°. El pulso
    // se sitúa en la fase que declara el motor sellado.
    const fase=faseCmp(e,F), hay=hayCmp(e,F), anc=26, alt=5.0;
    const pts=[];
    for(let a=0;a<=720;a+=2){
      let v=0;
      if(hay){ const d=((a-fase+360)%720)-360; if(Math.abs(d)<anc/2) v=alt; }
      pts.push([a,v]);
    }
    return { pts, x0:0, x1:720, rx:'ángulo de cigüeñal  (°)', ry:'tensión  (V)', y0:-0.4, y1:5.6, uni:'V' };
  }
  if(k==='tps'){
    const pts=[];
    for(let i=0;i<=400;i++){ const a=i/400; pts.push([a*100,vTps(e,a,F)]); }
    return { pts, x0:0, x1:100, rx:'recorrido del acelerador  (%)', ry:'tensión  (V)', y0:-0.3, y1:5.4, uni:'V' };
  }
  if(k==='map'||k==='maf'){
    const T=2/Math.max(1e-6,fAspiracion(e,rpm)), pts=[];
    for(let i=0;i<=400;i++){ const t=T*i/400;
      pts.push([t*1000, k==='map'?vMap(e,rpm,G.acel,F,t):vMaf(e,rpm,G.acel,F,t)]); }
    return { pts, x0:0, x1:T*1000, rx:'tiempo  (ms)', ry:'tensión  (V)', y0:null, y1:null, uni:'V' };
  }
  const O=INY({esc:esc||G.esc});
  return { pts:O.pts.map(p=>[p.t,p.v]), x0:0, x1:O.dur, rx:'tiempo desde la orden  (ms)',
    ry:'tensión  (V)', y0:null, y1:null, uni:'V', O };
}
// Banda vertical automática con margen, para que una curva nunca toque el borde.
function bandaY(pts,y0,y1){
  if(y0!==null&&y0!==undefined&&y1!==null&&y1!==undefined) return [y0,y1];
  let a=Infinity,b=-Infinity;
  for(const p of pts){ a=Math.min(a,p[1]); b=Math.max(b,p[1]); }
  if(!isFinite(a)||!isFinite(b)||b-a<1e-9){ a=(a||0)-1; b=(b||0)+1; }
  const m=(b-a)*0.14;
  return [a-m,b+m];
}
// Ventana del canal en el recuadro pequeño. La señal del cigüeñal a vuelta
// entera son 58 dientes en 272 píxeles: un peine en el que no se distingue nada.
// Se enseña el tramo que contiene el hueco, que es lo que hay que mirar.
function ventanaMini(k){
  if(k!=='ckp') return null;
  const e=MQ(), paso=pasoDiente(e), a=e.dienteHueco*paso;
  return [Math.max(0,a-paso*9), Math.min(360,a+paso*(e.faltan+4))];
}
function miniOsc(P,k,tit,val,col){
  rpanel(P.x-20,P.y-34,P.w+40,P.h+80,'rgba(255,255,255,0.028)','#1c2534',10);
  const s=serieCanal(k), V=ventanaMini(k);
  const [y0,y1]=bandaY(s.pts,s.y0,s.y1);
  const x0=V?V[0]:s.x0, x1=V?V[1]:s.x1;
  // El valor se ancla al borde DERECHO del recuadro y el título al izquierdo, y
  // el título se encoge con el ancho que le deja el valor: anclarlo fuera del
  // recuadro lo montaba encima del título del recuadro siguiente.
  bx.font='700 13px Inter,system-ui,sans-serif';
  const wv=bx.measureText(val).width;
  texto(val,P.x+P.w,P.y-14,{s:13,b:true,c:TINTA,al:'right'});
  textoFit(tit,P.x,P.y-14,Math.max(60,P.w-wv-14),{s:13,b:true,c:col});
  const M=ejes(P,x0,x1,y0,y1,null,null,v=>num(v,0),v=>num(v,1),4,3);
  enCaja(P,()=>serieXY(M,s.pts,col,2.0));
  texto(V?'ángulo alrededor del hueco  (°)':s.rx,P.x+P.w/2,P.y+P.h+30,{s:11,c:'#7b8697',al:'center'});
  return M;
}

// ---------------------------------------------------------------- 1 · sensores
function vistaSensores(){
  const e=MQ(), L=LECT(), rpm=rpmVista();
  cabecera('Las seis señales del motor, a la vez',
    'Cada recuadro es un canal del osciloscopio en el punto de trabajo de arriba. Lo que hay que leer no es sólo el número: es la FORMA. '+
    'Dos averías pueden dar el mismo número y ondas distintas, y ahí es donde el escáner se queda ciego.');
  const W=272, H=132, GX=32, GY=104, X0=62, Y0=178;
  const val={
    ckp:volt(ampCkp(e,rpm,FA()),2)+' pico',
    cmp:L.hayCmp?('fase '+num(faseCmp(e,FA()),1)+NBSP+'°'):'sin señal',
    tps:volt(vTps(e,G.acel,FA()),2),
    map:volt(vMap(e,rpm,G.acel,FA()),2),
    maf:volt(vMaf(e,rpm,G.acel,FA()),2),
    iny:'cierra a '+mili(L.tCierre,2)
  };
  CANALES.forEach((k,i)=>{
    const cx=X0+(i%3)*(W+GX), cy=Y0+Math.floor(i/3)*(H+GY);
    miniOsc({x:cx,y:cy,w:W,h:H},k,ROT_SEN[k],val[k],COL_SEN[k]);
  });
  // Qué se ve y qué NO se ve desde aquí.
  const E=veredictoEngano();
  let rot, txt;
  if(G.esc==='sano'){
    rot='Las seis señales están donde deben';
    txt='Ésta es la referencia contra la que se comparan las doce averías del banco. Conviene mirarla antes que ninguna otra: sin saber cómo es una onda sana, '+
      'ninguna onda averiada dice nada. El captador '+(e.tipoCkp==='hall'?'de efecto Hall da un cuadrado de '+volt(e.vHall,1)+' que no cambia con el régimen':
      'inductivo da una onda que cruza por cero en el centro de cada diente y cuya altura sube con el régimen')+'.';
  }else if(E.limpio){
    rot='El escáner sale limpio y el motor tiene una avería';
    txt='No hay ningún código. Con el taller corriente esta avería se confunde con '+
      (E.gemelos.length?E.gemelos.map(k=>ESC_CORTO[k]).join(', '):'ninguna otra')+
      (E.separan.length?'; la separa '+E.separan.map(m=>OBS_CORTO[m.k]).join(' o ')+'.':'.');
  }else{
    rot='El escáner declara: '+L.codigos.map(c=>CODIGO_ROT[c]).join('  ·  ');
    txt='Un código dice en qué CIRCUITO hay algo raro, no qué le pasa. '+
      (E.gemelos.length?'Con el taller corriente esta avería sigue confundiéndose con '+E.gemelos.map(k=>ESC_CORTO[k]).join(', ')+
        (E.separan.length?', y la separa '+E.separan.map(m=>OBS_CORTO[m.k]).join(' o ')+'.':'.')
        :'Aquí el taller corriente ya la separa de las otras doce.');
  }
  banda(660,E.nivel,rot,txt);
}

// ------------------------------------------------------------------ 2 · rueda
function vistaRueda(){
  const e=MQ(), L=LECT(), rpm=rpmVista();
  cabecera('La rueda fónica: el hueco, la razón y el margen',
    'La centralita no sabe dónde está el motor hasta que encuentra el hueco de referencia, y lo encuentra midiendo la RAZÓN entre periodos de diente '+
    'consecutivos. Esa razón no depende del régimen: es un cociente de tiempos del mismo giro.');
  const T=TRZ({n:2600});
  const serie=T.pts.map(p=>[p.ang,p.v]);
  let [y0,y1]=bandaY(serie,null,null);
  // El umbral del comparador tiene que caber SIEMPRE en el recuadro: justamente
  // cuando la señal se hunde por debajo de él —que es el caso que esta vista
  // enseña— la banda automática lo deja fuera y desaparece la comparación.
  y0=Math.min(y0,-e.umbralCkp*1.20); y1=Math.max(y1,e.umbralCkp*1.20);
  const paso=pasoDiente(e), aH=e.dienteHueco*paso;
  const V0=Math.max(0,aH-paso*9), V1=Math.min(360,aH+paso*(e.faltan+4));
  // Zoom sobre el hueco. Los cincuenta y ocho dientes de una vuelta en seiscientos
  // píxeles son un peine en el que no se distingue nada, y lo que hay que
  // aprender a mirar es precisamente el hueco.
  const P={x:96,y:150,w:598,h:172};
  const M=ejes(P,V0,V1,y0,y1,null,'tensión  (V)',v=>num(v,0),v=>num(v,1),6,4);
  enCaja(P,()=>{
    serieXY(M,serie,COL_SEN.ckp,2.2);
    // El umbral del comparador se pinta SIEMPRE que caiga dentro: si no cabe, no
    // se pinta, porque una línea de límite dibujada sobre el borde miente.
    nivel(P,M,e.umbralCkp,WARN_HEX,'umbral del comparador '+volt(e.umbralCkp,2));
    if(T.off>1e-9) nivel(P,M,T.off,GRIS,'línea de cero desplazada',[3,4]);
  });
  etiqueta('ampliado: del diente '+num(Math.round(V0/paso),0)+' al '+num(Math.round(V1/paso),0),
    P.x+10,P.y+20,COL_SEN.ckp);
  // Y la vuelta entera debajo, con el tramo ampliado marcado, para que se vea
  // de dónde sale el zoom.
  const Pov={x:96,y:352,w:598,h:54};
  const Mov=ejes(Pov,0,360,y0,y1,'ángulo de cigüeñal  (°)  ·  vuelta completa',null,v=>num(v,0),null,6,1);
  enCaja(Pov,()=>{
    serieXY(Mov,serie,'#3f6f8f',1.0);
    bx.save(); bx.strokeStyle=COL_SEN.ckp; bx.lineWidth=1.6;
    bx.strokeRect(Mov.X(V0),Pov.y+1,Mov.X(V1)-Mov.X(V0),Pov.h-2); bx.restore();
  });
  // Las razones, diente a diente.
  const P2={x:96,y:462,w:598,h:104};
  const R=razones(e,rpm,FA());
  const M2=ejes(P2,0,360,0,Math.max(3.4,L.razonMax*1.16),'ángulo de cigüeñal  (°)','razón entre periodos',
    v=>num(v,0),v=>num(v,1),6,4);
  enCaja(P2,()=>{
    R.forEach(r=>{
      const x=M2.X(r.ang), h=P2.y+P2.h-M2.Y(r.razon);
      bx.fillStyle=r.razon>=e.umbralRazon?BAD_HEX:'#3f6f8f';
      bx.fillRect(x-2.4,M2.Y(r.razon),4.8,Math.max(0,h));
    });
    nivel(P2,M2,e.umbralRazon,WARN_HEX,'umbral de razón '+num(e.umbralRazon,2));
  });
  // La tabla del margen.
  const rotoR=(()=>{ const rr=razones(e,1000,FALLAS.dienteRoto).map(x=>x.razon).sort((a,b)=>b-a);
    return rr[1]>1+1e-9?rr[1]:rr[0]; })();
  const filas=[
    ['posiciones de diente',num(e.dientes,0),TINTA],
    ['dientes que faltan',num(e.faltan,0),TINTA],
    ['dientes que quedan',num(L.pulsos,0),L.pulsos<L.pulsosSano?BAD_HEX:TINTA],
    ['razón que abre el hueco',num(L.razonSanaMax,2),CIAN],
    ['razón que abre un diente roto',num(rotoR,2),NARANJA],
    ['umbral de la centralita',num(e.umbralRazon,2),WARN_HEX],
    ['huecos que cree ver',num(L.huecos,0),L.huecos===1?OK_HEX:BAD_HEX],
    ['¿sincroniza?',L.sincroniza?'sí':'NO',L.sincroniza?OK_HEX:BAD_HEX],
  ];
  tabla(738,166,[{t:'la rueda',w:172},{t:'',w:66,al:'right'}],
    filas.map(f=>({v:[f[0],[f[1],f[2]]]})),{rh:24,s:13});
  const margen=e.faltan>=2;
  rpanel(730,452,254,112,margen?'rgba(124,217,146,0.08)':'rgba(233,196,106,0.10)',margen?OK_HEX:WARN_HEX,10);
  texto(margen?'Esta rueda tiene margen':'Esta rueda NO tiene margen',744,476,{s:13,b:true,c:margen?OK_HEX:WARN_HEX});
  wrapText(margen
    ? 'El hueco abre una razón de '+num(L.razonSanaMax,2)+' y un diente roto abre una de '+num(rotoR,2)+
      ', con el umbral en '+num(e.umbralRazon,2)+' entre los dos. Un diente roto no engaña al detector.'
    : 'El hueco y un diente roto abren la MISMA razón de '+num(rotoR,2)+', así que el umbral tiene que bajar de ella. '+
      'Un solo diente roto le inventa una segunda referencia y el coche no arranca.',
    744,496,238,16,{s:12,c:'#c3ccd8'});

  const V=veredicto();
  let rot,txt,niv;
  if(!L.sincroniza){
    niv='bad'; rot='La centralita ve '+num(L.huecos,0)+' referencias por vuelta y necesita exactamente una';
    txt='Sin una referencia única no sabe en qué ángulo está el motor, así que no puede ni encender ni inyectar en su sitio. El coche gira y no arranca. '+
      'Éste es el único síntoma que un escáner sí declara —'+L.codigos.map(c=>CODIGO_ROT[c]).join(', ')+'—, pero no dice por qué.';
  }else if(V.faltanPulsos){
    niv='warn'; rot='Falta un pulso por vuelta y la centralita sigue sincronizando';
    txt='La razón que abre el diente roto se queda en '+num(rotoR,2)+', por debajo del umbral de '+num(e.umbralRazon,2)+
      ', así que el detector de referencia no se engaña. El régimen del escáner sale perfecto porque se promedia sobre la vuelta entera. '+
      'Lo que se vuelve loco es la detección de fallo de encendido, que mira diente a diente: de ahí el '+CODIGO_ROT.P0300+'.';
  }else if(V.hayRuido){
    niv=L.falsos>0?'bad':'warn';
    rot=L.falsos>0?('El ruido mete '+num(L.falsos,0)+' dientes falsos por ciclo'):'Hay ruido acoplado y NO llega al umbral';
    txt=L.falsos>0
      ? 'Los picos del encendido pasan del umbral de '+volt(e.umbralCkp,2)+' y la centralita los cuenta como dientes. Un diente falso ACORTA periodos, nunca los alarga, '+
        'así que jamás dispara el detector de referencia: la sincronía aguanta y lo que se rompe es la cuenta angular.'
      : 'El osciloscopio ve los picos perfectamente, pero este captador conmuta a '+volt(e.umbralCkp,2)+' y el ruido llega sólo a '+volt(L.ruidoV,2)+
        '. La centralita no se entera. El mismo cable roto en un captador inductivo sí contaría dientes que no existen.';
  }else if(V.debilArranque){
    niv='bad'; rot='La señal no llega al umbral con el motor de arranque';
    txt='Con el arranque el cigüeñal gira a '+rpmT(RPM_ARRANQUE)+', diez veces más despacio que a ralentí, y un captador inductivo da una tensión proporcional al régimen. '+
      'Aquí da '+volt(L.pts[0].ampCkp,3)+' contra un umbral de '+volt(e.umbralCkp,2)+'. A ralentí daría '+volt(L.pts[1].ampCkp,3)+': por eso el coche no arranca y funciona bien si se empuja.';
  }else{
    niv='good'; rot='La rueda está entera y la referencia es única';
    txt='Un hueco por vuelta, razón de '+num(L.razonSanaMax,2)+' contra un umbral de '+num(e.umbralRazon,2)+
      ', y la señal pasa el umbral del comparador en los tres puntos del protocolo, incluido el más difícil, que es el del arranque.';
  }
  banda(640,niv,rot,txt);
}

// ----------------------------------------------------------------- 3 · sincro
function vistaSincro(){
  const e=MQ(), L=LECT(), F=FA();
  cabecera('Cigüeñal y árbol, a dos canales',
    'El árbol gira a la MITAD que el cigüeñal, así que su señal dice en cuál de las dos vueltas está el motor. Un diente saltado en su rueda dentada no vale '+
    'un diente: vale 720 grados de cigüeñal entre sus dientes, y no hay ningún dato en directo del escáner que lo contenga.');
  const P1={x:96,y:156,w:600,h:150}, P2={x:96,y:346,w:600,h:126};
  // Canal 1: cigüeñal, dos vueltas.
  const T=trazaCkp(e,rpmVista(),{F,n:2400,vueltas:2});
  const c1=T.pts.map(p=>[p.t/T.tVuelta*360,p.v]);
  const [a0,a1]=bandaY(c1,null,null);
  const M1=ejes(P1,0,720,a0,a1,null,'cigüeñal  (V)',v=>num(v,0),v=>num(v,1),8,3);
  enCaja(P1,()=>serieXY(M1,c1,COL_SEN.ckp,1.8));
  // Canal 2: árbol.
  const s=serieCanal('cmp');
  const M2=ejes(P2,0,720,-0.4,5.6,'ángulo de cigüeñal  (°)','árbol  (V)',v=>num(v,0),v=>num(v,1),8,2);
  enCaja(P2,()=>{
    serieXY(M2,s.pts,COL_SEN.cmp,2.2);
    if(L.hayCmp){
      const fs=faseCmp(e,{}), fa=faseCmp(e,F);
      linea([[M2.X(fs),P2.y],[M2.X(fs),P2.y+P2.h]],GRIS,1.4,[5,4]);
      if(Math.abs(fa-fs)>1e-9){
        linea([[M2.X(fa),P2.y],[M2.X(fa),P2.y+P2.h]],BAD_HEX,1.8);
        linea([[M2.X(fs),P2.y+16],[M2.X(fa),P2.y+16]],BAD_HEX,2.4);
      }
    }
  });
  if(L.hayCmp){
    etiqueta('fase de fábrica '+num(e.faseCmpNominal,0)+NBSP+'°',M1.X(e.faseCmpNominal)+8,P1.y+18,GRIS);
    if(L.desfase!==0) etiqueta('desfase '+firm(L.desfase,1),M2.X(faseCmp(e,F))+8,P2.y+34,BAD_HEX);
  }else{
    etiqueta('el sensor del árbol no da señal',P2.x+16,P2.y+34,BAD_HEX);
  }
  // Cuánto vale un diente en cada máquina.
  const filas=ARQ_KEYS.map(k=>{
    const m=ARQ[k], act=k===G.maq;
    return { v:[m.corto,num(m.dientesArbol,0),num(gradosPorDienteArbol(m),2)+NBSP+'°'],
      hl:act?'rgba(138,180,248,0.10)':null, c:act?TINTA:'#9aa6b6', b:act };
  });
  tabla(736,166,[{t:'motor',w:118},{t:'dientes',w:56,al:'right'},{t:'un diente vale',w:74,al:'right'}],
    filas,{rh:25,s:13});
  const filas2=[
    ['fase de fábrica',num(e.faseCmpNominal,1)+NBSP+'°',TINTA],
    ['fase medida',L.hayCmp?num(faseCmp(e,F),1)+NBSP+'°':'sin señal',L.hayCmp?TINTA:BAD_HEX],
    ['desfase',L.desfase===null?'—':firm(L.desfase,1),L.desfase&&Math.abs(L.desfase)>UMBRAL_FASE?BAD_HEX:OK_HEX],
    ['umbral de correlación','±'+num(UMBRAL_FASE,0)+NBSP+'°',WARN_HEX],
  ];
  tabla(736,320,[{t:'la sincronía',w:150},{t:'',w:98,al:'right'}],
    filas2.map(f=>({v:[f[0],[f[1],f[2]]]})),{rh:25,s:13});

  let niv,rot,txt;
  if(!L.hayCmp){
    niv='warn'; rot='Sin señal del árbol, y el motor arranca igual';
    txt='La referencia angular es el CIGÜEÑAL, no el árbol: sin árbol la centralita prueba una de las dos sincronías y, si no funciona, prueba la otra. '+
      'Arranca más despacio y pierde la inyección secuencial. El escáner declara '+CODIGO_ROT.P0340+', que dice dónde mirar y no qué pasa.';
  }else if(Math.abs(L.desfase)>UMBRAL_FASE){
    niv='bad'; rot='La distribución está '+firm(L.desfase,1)+' fuera de sitio';
    txt='Un diente de la rueda del árbol vale '+num(gradosPorDienteArbol(e),2)+'° de cigüeñal porque el árbol gira a la mitad. '+
      'Ningún dato en directo del escáner dice cuánto se ha movido: el código '+CODIGO_ROT.P0016+' avisa de que los dos no se corresponden, y la cifra sólo sale midiendo '+
      'la distancia entre el hueco de referencia y el flanco del árbol con dos canales.';
  }else{
    niv='good'; rot='Los dos árboles están donde deben';
    txt='El flanco del árbol cae a '+num(faseCmp(e,F),1)+'° del hueco de referencia, que es la fase de fábrica. Con un diente saltado se iría '+
      num(gradosPorDienteArbol(e),2)+'°, muy por encima del umbral de correlación de ±'+num(UMBRAL_FASE,0)+'°.';
  }
  banda(556,niv,rot,txt);
}

// ---------------------------------------------------------------- 4 · tensión
function vistaTension(){
  const e=MQ(), L=LECT(), SN=LECT_DE('sano'), F=FA(), V=veredicto();
  cabecera('Los tres sensores que cuelgan de la misma alimentación',
    'Mariposa, presión de colector y masa de aire comparten los cinco voltios y la masa. Una caída en la alimentación los MULTIPLICA a los tres por el mismo '+
    'factor; una resistencia en la masa les SUMA a los tres la misma tensión. Con una sola lectura son la misma avería.');
  const P={x:96,y:162,w:520,h:286};
  const M=ejes(P,0,100,-0.3,5.4,'recorrido del acelerador  (%)','tensión de la mariposa  (V)',
    v=>num(v,0),v=>num(v,1),5,5);
  enCaja(P,()=>{
    const sano=[],act=[];
    for(let i=0;i<=400;i++){ const a=i/400; sano.push([a*100,vTps(e,a,{})]); act.push([a*100,vTps(e,a,F)]); }
    serieXY(M,sano,GRIS,1.8,[6,5]);
    serieXY(M,act,COL_SEN.tps,2.4);
    punteo(M,G.acel*100,vTps(e,G.acel,F),COL_SEN.tps,5.5);
    if(L.anchoHueco>0){
      const [h0,h1]=F.tpsHueco;
      bx.save(); bx.fillStyle='rgba(255,107,107,0.14)';
      bx.fillRect(M.X(h0*100),P.y,M.X(h1*100)-M.X(h0*100),P.h); bx.restore();
    }
  });
  leyenda(126,P.y+P.h-58,[['recta de fábrica',GRIS,[6,5]],['recta medida',COL_SEN.tps]]);
  // El discriminante: la RAZÓN contra la DIFERENCIA. Un factor deja la razón
  // constante y la diferencia creciendo; un sumando, al revés.
  const puntos=[[0,'cerrado'],[0.5,'a medio'],[1,'a fondo']];
  const filas=puntos.map(([a,r])=>{
    const s=vTps(e,a,{}), m=vTps(e,a,F);
    return { v:[r,num(s,2),num(m,2),num(s>1e-9?m/s:0,3),(m-s>=0?'+':'−')+num(Math.abs(m-s),2)] };
  });
  tabla(660,168,[{t:'mariposa',w:74},{t:'fábrica',w:52,al:'right'},{t:'medida',w:52,al:'right'},
    {t:'razón',w:52,al:'right'},{t:'dif.',w:52,al:'right'}],filas,{rh:25,s:13,gap:11});
  const filas2=[
    ['presión de colector a ralentí',volt(SN.pts[1].vMap,2),volt(L.pts[1].vMap,2)],
    ['masa de aire en carga',volt(SN.pts[2].vMaf,2),volt(L.pts[2].vMaf,2)],
    ['rizado de la admisión',volt(SN.pts[1].rizado,3),volt(L.pts[1].rizado,3)],
    ['alimentación en el sensor',volt(V_REF,2),volt(L.vAlim,2)],
    ['línea de cero',volt(0,2),volt(L.offset,2)],
  ];
  tabla(660,330,[{t:'los otros dos',w:172},{t:'fábrica',w:56,al:'right'},{t:'medida',w:56,al:'right'}],
    filas2.map(f=>({v:[f[0],[f[1],'#9aa6b6'],[f[2],f[1]===f[2]?TINTA:WARN_HEX]]})),{rh:25,s:13,gap:11});

  let niv,rot,txt;
  if(V.huecoPista){
    const C=veredictoCaza();
    niv='bad'; rot='La pista tiene un hueco del '+pc(L.anchoHueco*100,1)+' del recorrido';
    txt='En los dos extremos el sensor está perfecto, así que el multímetro con el pedal quieto lo da por bueno y no salta ningún código. '+
      'En un pisotón de '+num(G.barrido,2)+' s el hueco dura '+mili(C.tau*1000,1)+' y el escáner lee cada '+mili(TS_ESCANER*1000,0)+
      ': lo caza el '+pc(C.pE*100,1)+' de las veces. Ver el modo «cazar el fallo».';
  }else if(V.escala&&V.cero){
    niv='bad'; rot='La alimentación y la masa están las dos tocadas';
    txt='Las tres señales salen multiplicadas y desplazadas a la vez. Hay que separar las dos cosas mirando los dos extremos del recorrido.';
  }else if(V.escala){
    niv='warn'; rot='Los tres sensores están MULTIPLICADOS por '+num(L.vAlim/V_REF,3);
    txt='El pin de referencia de la centralita sigue leyendo '+volt(V_REF,2)+'; a los sensores les llegan '+volt(L.vAlim,2)+'. '+
      'La razón entre lo medido y lo de fábrica es la misma en los tres puntos del recorrido —'+num(L.vAlim/V_REF,3)+'— y la DIFERENCIA crece con la apertura: '+
      'eso es exactamente lo que distingue una caída de alimentación de una masa con resistencia.';
  }else if(V.cero){
    niv='warn'; rot='Los tres sensores están DESPLAZADOS '+volt(L.offset,2);
    txt='La corriente de retorno cae sobre una resistencia en la masa común y toda señal referida a ella sube lo mismo. '+
      'Aquí la DIFERENCIA es la misma en los tres puntos del recorrido —'+volt(L.offset,2)+'— y la razón se acerca a uno según se abre: al revés que una caída de alimentación. '+
      'Y en el osciloscopio la línea de cero de la señal del cigüeñal tampoco está en cero.';
  }else if(Math.abs(L.pts[2].vMaf-SN.pts[2].vMaf)>1e-9){
    const errM=1-FALLAS.mafSucio.mafMul, errV=(SN.pts[2].vMaf-L.pts[2].vMaf)/SN.pts[2].vMaf;
    niv='warn'; rot='El hilo caliente sub-declara y la raíz esconde casi dos tercios del error';
    txt='La tensión del hilo va con la RAÍZ del gasto, porque el puente mantiene constante su temperatura y lo que se lleva el aire va con la raíz de su velocidad. '+
      'Un error de '+pc(errM*100,0)+' en la masa se queda en '+pc(errV*100,1)+' en la tensión: '+volt(L.pts[2].vMaf,3)+' contra '+volt(SN.pts[2].vMaf,3)+
      '. Por eso no llega al umbral del '+pc(UMBRAL_MAF_REL*100,0)+' del autodiagnóstico y no salta ningún código.';
  }else if(L.pts[1].rizado<SN.pts[1].rizado-1e-9){
    niv='bad'; rot='La señal de presión es alta, plana y SIN rizado';
    txt='El sensor está midiendo la atmósfera en vez del colector. El dato no es la tensión —que también—: es que ha desaparecido el rizado de '+
      volt(SN.pts[1].rizado,3)+' a '+hz(L.pts[1].fRizado,1)+', que es una aspiración por cilindro cada dos vueltas. Ningún número del escáner contiene ese rizado.';
  }else{
    niv='good'; rot='Las tres rectas pasan por donde deben';
    txt='Alimentación de '+volt(L.vAlim,2)+', línea de cero en cero, y las tres señales dentro de su recta de calibración en todo el recorrido. '+
      'El rizado de la admisión está en '+volt(L.pts[1].rizado,3)+' a '+hz(L.pts[1].fRizado,1)+'.';
  }
  banda(624,niv,rot,txt);
}

// --------------------------------------------------------------- 5 · inyector
function vistaInyector(){
  const e=MQ(), L=LECT(), O=INY(), Os=INY({esc:'sano'});
  cabecera('La onda eléctrica del inyector y la joroba de cierre',
    'Mientras el transistor conduce, la corriente sube contra L/R. Al cortar aparece el pico inductivo, y en su bajada hay una joroba pequeña: es la aguja '+
    'sentándose, porque al moverse cambia la inductancia. Esa joroba es lo único que dice si la aguja se pega.');
  const P={x:96,y:158,w:560,h:212};
  const vs=O.pts.map(p=>p.v), M=ejes(P,0,O.dur,-4,Math.max(...vs)*1.10,
    'tiempo desde la orden de inyección  (ms)','tensión en el inyector  (V)',v=>num(v,1),v=>num(v,0),6,4);
  enCaja(P,()=>{
    if(O.tCierre!==Os.tCierre) serieXY(M,Os.pts.map(p=>[p.t,p.v]),GRIS,1.5,[6,5]);
    serieXY(M,O.pts.map(p=>[p.t,p.v]),COL_SEN.iny,2.2);
    linea([[M.X(O.tOrden),P.y],[M.X(O.tOrden),P.y+P.h]],WARN_HEX,1.4,[5,4]);
    const tc=O.tOrden+O.tCierre;
    linea([[M.X(tc),P.y],[M.X(tc),P.y+P.h]],OK_HEX,1.6);
  });
  // Sin leyenda, la traza gris de trazos parece ruido y no la referencia sana.
  if(O.tCierre!==Os.tCierre)
    leyenda(P.x+30,P.y+P.h-46,[['inyector de fábrica',GRIS,[6,5]],['inyector medido',COL_SEN.iny]]);
  etiqueta('se corta el mando',M.X(O.tOrden)+8,P.y+22,WARN_HEX);
  etiqueta('la aguja se sienta',M.X(O.tOrden+O.tCierre)+8,P.y+46,OK_HEX);
  // Y la corriente, en su propio recuadro: es otra magnitud y no comparte escala.
  const P2={x:96,y:432,w:560,h:126};
  const M2=ejes(P2,0,O.dur,0,O.iFin*1.12,'tiempo desde la orden  (ms)','corriente  (A)',
    v=>num(v,1),v=>num(v,2),6,3);
  enCaja(P2,()=>{
    serieXY(M2,O.pts.map(p=>[p.t,p.i]),AMBAR,2.2);
    nivel(P2,M2,O.iFin,GRIS,'corriente final '+amp(O.iFin,3),[6,5]);
    linea([[M2.X(O.tau),P2.y],[M2.X(O.tau),P2.y+P2.h]],'#3f6f8f',1.4,[4,4]);
  });
  etiqueta('una constante de tiempo',M2.X(O.tau)+8,P2.y+20,'#7fb2d6');
  const filas=[
    ['resistencia del inyector',num(e.inyR,1)+NBSP+'Ω',TINTA],
    ['inductancia',num(e.inyL,1)+NBSP+'mH',TINTA],
    ['constante L/R',mili(O.tau,3),CIAN],
    ['tensión de batería',volt(O.vBat,1),TINTA],
    ['corriente final',amp(O.iFin,3),TINTA],
    ['corriente al corte',amp(O.iCorte,3),AMBAR],
    ['orden de inyección',mili(O.tOrden,2),TINTA],
    ['joroba de fábrica',mili(Os.tCierre,2),GRIS],
    ['joroba medida',mili(O.tCierre,2),O.tCierre>Os.tCierre+1e-9?BAD_HEX:OK_HEX],
  ];
  tabla(700,166,[{t:'el inyector',w:172},{t:'',w:74,al:'right'}],
    filas.map(f=>({v:[f[0],[f[1],f[2]]]})),{rh:25,s:13});

  const tarde=O.tCierre>Os.tCierre+1e-9;
  banda(624,tarde?'bad':'good',
    tarde?('La aguja tarda '+num(O.tCierre/Os.tCierre,2)+' veces más de la cuenta en sentarse')
         :'La aguja se sienta a su hora',
    tarde
      ? 'La joroba se ha ido de '+mili(Os.tCierre,2)+' a '+mili(O.tCierre,2)+' desde el corte del mando. Mientras la aguja no se sienta, el inyector sigue entregando: '+
        'este inyector mete de más al final de cada pulso. No hay ningún dato en directo del escáner que contenga esta cifra, y ningún código salta. '+
        'La constante eléctrica —'+mili(O.tau,3)+'— y la corriente al corte —'+amp(O.iCorte,3)+'— no se han movido: la avería es MECÁNICA y sólo se ve en el tiempo de la joroba.'
      : 'La joroba cae a '+mili(O.tCierre,2)+' del corte del mando, que es lo que declara este inyector. La corriente alcanza '+amp(O.iCorte,3)+' con una constante de '+
        mili(O.tau,3)+'. Conviene fijarse en dónde está la joroba con el inyector sano: sin esa referencia, una aguja pegajosa no se distingue de nada.');
}

// ------------------------------------------------------------------- 6 · caza
function vistaCaza(){
  const e=MQ(), C=veredictoCaza();
  cabecera('Cazar un fallo que dura milisegundos',
    'El escáner lee un dato cada '+mili(TS_ESCANER*1000,0)+' y entre lectura y lectura no sabe nada. Con la fase del muestreador siendo cualquiera, la probabilidad de '+
    'que caiga una muestra dentro de una ventana de duración tau vale EXACTAMENTE tau entre el periodo, mientras tau sea el menor de los dos.');
  // Arriba: el pulso del fallo contra las marcas de muestreo, a escala real.
  const P={x:96,y:164,w:600,h:104};
  const dur=Math.max(C.tau*3.2,TS_ESCANER*4);
  const M=ejes(P,0,dur*1000,0,1.25,'tiempo  (ms)','',v=>num(v,0),null,4,1);
  enCaja(P,()=>{
    if(C.hay){
      const t0=(dur-C.tau)/2;
      bx.save(); bx.fillStyle='rgba(255,107,107,0.22)';
      bx.fillRect(M.X(t0*1000),P.y+6,M.X((t0+C.tau)*1000)-M.X(t0*1000),P.h-12); bx.restore();
      linea([[M.X(t0*1000),P.y+6],[M.X(t0*1000),P.y+P.h-6]],BAD_HEX,2);
      linea([[M.X((t0+C.tau)*1000),P.y+6],[M.X((t0+C.tau)*1000),P.y+P.h-6]],BAD_HEX,2);
    }
    for(let t=0.013;t<dur;t+=TS_ESCANER){
      const x=M.X(t*1000);
      linea([[x,P.y+P.h-10],[x,P.y+18]],CIAN,1.6);
      bx.save(); bx.fillStyle=CIAN; bx.beginPath(); bx.arc(x,P.y+18,3.6,0,Math.PI*2); bx.fill(); bx.restore();
    }
  });
  etiqueta(C.hay?('ventana del fallo '+mili(C.tau*1000,1)):'no hay ninguna ventana que cazar',P.x+12,P.y+P.h-16,BAD_HEX);
  etiqueta('lecturas del escáner, cada '+mili(TS_ESCANER*1000,0),P.x+P.w-12,P.y+P.h-16,CIAN,'right');
  // Abajo: la probabilidad contra la velocidad del barrido.
  const P2={x:96,y:340,w:600,h:186};
  const M2=ejes(P2,0,6,0,100,'segundos en recorrer el acelerador entero  (s)','probabilidad de cazarlo  (%)',
    v=>num(v,1),v=>num(v,0),6,4);
  enCaja(P2,()=>{
    if(C.ancho>0){
      const cE=[],cO=[];
      for(let i=0;i<=300;i++){ const tb=6*i/300;
        cE.push([tb,pCaza(C.ancho*tb,TS_ESCANER)*100]);
        cO.push([tb,pCaza(C.ancho*tb,TS_OSC_CONT)*100]); }
      serieXY(M2,cO,VIO,2.0,[6,5]);
      serieXY(M2,cE,CIAN,2.4);
      punteo(M2,G.barrido,C.pE*100,CIAN,5.5);
      if(C.tSeguro&&C.tSeguro<=6){
        linea([[M2.X(C.tSeguro),P2.y],[M2.X(C.tSeguro),P2.y+P2.h]],OK_HEX,1.6,[5,4]);
      }
    }
  });
  if(C.hay) leyenda(126,P2.y+56,[['escáner, cada '+mili(TS_ESCANER*1000,0),CIAN],
    ['osciloscopio en barrido continuo',VIO,[6,5]]]);
  if(C.tSeguro&&C.tSeguro<=6) etiqueta('a partir de '+num(C.tSeguro,2)+NBSP+'s ya no puede fallar',M2.X(C.tSeguro)+8,P2.y+24,OK_HEX);
  const filas=BARRIDOS.map(tb=>{
    const tau=C.ancho*tb, p=pCaza(tau,TS_ESCANER), r=repeticionesPara(tau,TS_ESCANER,CONFIANZA);
    return { v:[num(tb,2)+NBSP+'s', C.hay?mili(tau*1000,1):'—', C.hay?pc(p*100,1):'—',
      C.hay?(isFinite(r)?num(r,0):'∞'):'—'],
      hl:Math.abs(tb-G.barrido)<1e-9?'rgba(138,180,248,0.10)':null };
  });
  tabla(738,172,[{t:'barrido',w:56},{t:'dura',w:60,al:'right'},{t:'p',w:54,al:'right'},{t:'nº',w:34,al:'right'}],
    filas,{rh:25,s:13,gap:10});
  const filas2=[
    ['periodo del escáner',mili(TS_ESCANER*1000,0),CIAN],
    ['periodo del osciloscopio',mili(TS_OSC_CONT*1000,0),VIO],
    ['osciloscopio ARMADO','siempre',OK_HEX],
    ['confianza pedida',pc(CONFIANZA*100,0),TINTA],
  ];
  tabla(738,346,[{t:'los instrumentos',w:158},{t:'',w:46,al:'right'}],
    filas2.map(f=>({v:[f[0],[f[1],f[2]]]})),{rh:25,s:13,gap:10});

  let niv,rot,txt;
  if(!C.hay){
    niv='good'; rot='Esta avería no es intermitente: está siempre';
    txt='Aquí no hay ninguna ventana que cazar, así que el escáner y el osciloscopio la ven igual de bien. La cuenta de esta pantalla sólo tiene sentido con un fallo que '+
      'aparece y desaparece: pon la pista del acelerador gastada y vuelve a mirar.';
  }else if(C.pE>=1){
    niv='good'; rot='A este barrido el escáner ya no puede fallar';
    txt='El hueco dura '+mili(C.tau*1000,1)+' y el escáner lee cada '+mili(TS_ESCANER*1000,0)+': dentro de la ventana cae al menos una lectura siempre. '+
      'Barrer despacio no es una manía: es lo que convierte un instrumento que muestrea en un instrumento fiable, y no cuesta nada.';
  }else{
    niv='bad'; rot='Un pisotón deja al escáner en el '+pc(C.pE*100,1);
    txt='El hueco dura '+mili(C.tau*1000,1)+' contra los '+mili(TS_ESCANER*1000,0)+' del escáner, así que hacen falta '+
      (isFinite(C.repE)?num(C.repE,0)+' pisotones':'infinitos pisotones')+' para estar seguro al '+pc(CONFIANZA*100,0)+'. '+
      'El osciloscopio en barrido continuo sube al '+pc(C.pO*100,1)+' y TAMPOCO es seguro: el único que no falla es el osciloscopio ARMADO en disparo único, '+
      'que no muestrea nada, espera. O barrer el acelerador en '+num(C.tSeguro,2)+' s o más.';
  }
  banda(592,niv,rot,txt);
}

// ------------------------------------------------------------------ 7 · censo
function vistaCenso(){
  const e=MQ(), C=CENSO(), mud=MUDOS();
  cabecera('Censo de instrumentos: qué separa qué',
    'Se prueban los 8 191 subconjuntos de las trece observaciones sobre los trece escenarios. Un subconjunto «resuelve» un escenario cuando ningún otro de otra '+
    'familia le da exactamente la misma huella. No se afirma que haga falta osciloscopio: se cuenta.');
  const porMask=new Map(C.map(c=>[c.mask,c]));
  const soloTaller=C.filter(c=>c.sub.every(s=>s.taller));
  const techoTaller=Math.max(...soloTaller.map(c=>c.resueltos));
  const cortoTaller=soloTaller.filter(c=>c.resueltos===techoTaller).sort((a,b)=>a.sub.length-b.sub.length)[0];
  const todoTaller=soloTaller.find(c=>c.sub.length===OBS_TALLER.length);
  const techo=C[0].resueltos;
  const min=C.filter(c=>c.resueltos===techo).sort((a,b)=>a.sub.length-b.sub.length)[0];
  const todo=porMask.get((1<<OBS.length)-1);

  const filas=[
    { v:['sólo el escáner y el multímetro (las 7 de taller)',num(todoTaller.sub.length,0),num(todoTaller.resueltos,0)+'/13'],
      c:WARN_HEX },
    { v:['el juego más corto que llega a ese techo',num(cortoTaller.sub.length,0),num(techoTaller,0)+'/13'], c:WARN_HEX },
    { v:['añadiendo el osciloscopio: el juego mínimo',num(min.sub.length,0),num(techo,0)+'/13'], c:OK_HEX, b:true },
    { v:['las trece observaciones del banco',num(OBS.length,0),num(todo.resueltos,0)+'/13'], c:'#9aa6b6' },
  ];
  tabla(96,162,[{t:'juego de observaciones',w:452},{t:'nº',w:36,al:'right'},{t:'resuelve',w:70,al:'right'}],
    filas,{rh:28,s:14});
  texto('El juego mínimo:',96,326,{s:13,b:true,c:'#9aa6b6'});
  let yy=350;
  min.sub.forEach(m=>{
    chk(108,yy-5,!m.taller);
    texto(OBS_CORTO[m.k],128,yy,{s:13,c:m.taller?TINTA:OK_HEX});
    texto(m.taller?'taller corriente':'osciloscopio',400,yy,{s:12,c:m.taller?'#7b8697':OK_HEX,al:'right'});
    yy+=24;
  });
  // Con qué se queda pegado cada escenario si sólo hay taller.
  const g=new Map();
  ESCEN_KEYS.forEach(k=>{
    const f=firmaObs(e,LECT_DE(k),OBS_TALLER);
    if(!g.has(f)) g.set(f,[]);
    g.get(f).push(k);
  });
  const lios=[...g.values()].filter(v=>new Set(v.map(k=>ESCEN[k].clave)).size>1);
  texto('Lo que el taller corriente NO puede separar:',540,326,{s:13,b:true,c:'#9aa6b6'});
  let y2=350;
  if(lios.length===0){ texto('nada: los trece salen separados',556,y2,{s:13,c:OK_HEX}); y2+=24; }
  lios.forEach(v=>{
    const sep=OBS_OSC.filter(m=>{
      const fs=v.map(k=>firmaObs(e,LECT_DE(k),[m]));
      return new Set(fs).size===fs.length;
    });
    texto('· '+v.map(k=>ESC_CORTO[k]).join('  ≡  '),556,y2,{s:13,c:WARN_HEX});
    texto(sep.length?('los separa: '+sep.map(m=>OBS_CORTO[m.k]).join(', ')):'no los separa ninguna medida del banco',
      572,y2+18,{s:12,c:sep.length?OK_HEX:BAD_HEX});
    y2+=44;
  });

  const gana=techo>techoTaller;
  banda(Math.max(556,Math.max(yy,y2)+16),gana?'good':'warn',
    gana?('El osciloscopio sube de '+num(techoTaller,0)+' a '+num(techo,0)+' de trece')
        :('Aquí el osciloscopio no sube del '+num(techo,0)+' de trece'),
    (gana
      ? 'Con lo que hay en cualquier taller se llega a '+num(techoTaller,0)+' de trece y ahí se para: añadir las siete observaciones de taller no mejora lo que ya dan '+
        num(cortoTaller.sub.length,0)+'. El juego mínimo que llega a '+num(techo,0)+' tiene '+num(min.sub.length,0)+' observaciones y '+
        num(min.sub.filter(m=>!m.taller).length,0)+' de ellas piden osciloscopio. '
      : 'El techo del banco es '+num(techo,0)+' de trece con cualquier instrumento. ')+
    (mud.length
      ? 'Y hay '+num(mud.length,0)+' avería que en esta máquina no deja huella en NINGUNA de las trece observaciones: '+
        mud.map(k=>ESCEN[k].rot.toLowerCase()).join(', ')+'. Con un captador de efecto Hall el entrehierro no cambia nada mientras esté dentro de su margen, '+
        'así que este banco declara que no se puede diagnosticar en vez de fingir que sí.'
      : 'Las doce averías dejan huella en alguna observación de este banco.'));
}

// ------------------------------------------------------------------- 8 · reto
function vistaReto(){
  const e=MQ(), L=LECT();
  cabecera('Diagnóstico a ciegas',
    'Hay una avería puesta y no se dice cuál. Se pueden mover todos los mandos y mirar todas las vistas. La pregunta no es qué pieza es: es a qué FAMILIA pertenece, '+
    'que es lo que decide qué se desmonta.');
  // Sólo se publica lo COMPRADO. Publicarlo todo convertiría el reto en leer una
  // tabla, y lo que la práctica quiere enseñar es a elegir qué medir.
  const filas=OBS.map(m=>{
    const dado=RETO.tomadas[m.k]!==undefined;
    return { v:[OBS_CORTO[m.k], dado?RETO.tomadas[m.k]:'— sin medir —', m.taller?'taller':'osciloscopio'],
      c:dado?(m.taller?TINTA:OK_HEX):'#5b6675' };
  });
  tabla(96,164,[{t:'observación',w:230},{t:'lo que sale',w:200},{t:'con qué',w:110,al:'right'}],
    filas,{rh:26,s:13});
  const E=veredictoEngano();
  texto('Familias posibles en esta máquina:',620,190,{s:13,b:true,c:'#9aa6b6'});
  let yy=216;
  FAMILIAS_RETO().forEach(f=>{ texto('· '+f,636,yy,{s:13,c:TINTA}); yy+=23; });
  if(G.resuelto){
    banda(600,'good','Resuelto: '+ESCEN[G.esc].rot,
      FALLAS[ESCEN[G.esc].falla].nota+' '+
      (E.gemelos.length?('Con el taller corriente esta avería se confunde con '+E.gemelos.map(k=>ESC_CORTO[k]).join(', ')+
        (E.separan.length?', y la separa '+E.separan.map(m=>OBS_CORTO[m.k]).join(' o ')+'.':'.')):'Con el taller corriente ya sale separada de las otras doce.'));
  }else{
    banda(600,'warn','Elige la familia en el panel de la derecha',
      'Antes de elegir conviene pasar por las otras vistas: la de la rueda dice si la referencia es única, la de sincronía mide la fase con dos canales, la de tensión '+
      'separa una alimentación caída de una masa con resistencia, y la de cazar el fallo dice cuántas veces hay que repetir un gesto para fiarse de un escáner.');
  }
}

// -------------------------------------------------------------------- reparto
const VISTAS={sensores:vistaSensores, rueda:vistaRueda, sincro:vistaSincro, tension:vistaTension,
  inyector:vistaInyector, caza:vistaCaza, censo:vistaCenso, reto:vistaReto};
function pintaTablero(){
  bg();
  (VISTAS[G.modo]||vistaSensores)();
  btex.needsUpdate=true;
}

// ============================================================ T3a · EL BANCO
// Cotas del banco. TODO lo que se coloca después sale de aquí: el pizarrón se
// pega al borde izquierdo real y la cámara encuadra contra estos extremos, así
// que una cota escrita a mano en cualquier otro sitio deja el banco fuera del
// cuadro en cuanto se cambia de arquetipo.
function dims(e){
  const rR=0.46;                       // radio de la rueda fónica
  const xR=-0.24;                      // eje de la rueda y del árbol
  const xAdm0=0.66, xAdm1=2.26;        // tramo de admisión
  const xIzq=xR-rR-0.46;
  const xDer=xAdm1+0.44;
  const xVista=xAdm1-0.34;
  return { rR, xR, xAdm0, xAdm1, xIzq, xDer, xVista, ancho:xDer-xIzq, centro:(xIzq+xDer)/2 };
}
const pon=(o,p)=>{ o.position.set(p[0],p[1],p[2]); return o; };
// `labelSprite` del kit devuelve el rótulo ya escalado y es el LLAMANTE quien lo
// coloca. Pasarle una posición como segundo argumento le pasa un color.
// `labelSprite` viene pre-escalado para un banco del tamaño del donante. Aquí el
// banco es más corto y ocho rótulos a ese tamaño se montan unos encima de otros
// y tapan las piezas que señalan.
const ESC_ROT=0.62;
const rot3=(t,c,p)=>{ const s=pon(labelSprite(t,c),p); s.scale.multiplyScalar(ESC_ROT); return s; };
const corta=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;

let TOAST=null;
function showToast(html,ms){
  const c=el('toast'); if(!c) return;
  c.innerHTML=html;
  // La clase es `show`, NO `on`: la unica regla que la hoja de estilo del
  // donante declara sobre el aviso es `.toast.show{opacity:1}`. Con cualquier
  // otra clase el texto se escribe, el elemento existe, no salta ningun error
  // y NADIE LO VE NUNCA, porque `.toast` nace con `opacity:0`.
  c.classList.add('show');
  if(TOAST) clearTimeout(TOAST);
  TOAST=setTimeout(()=>c.classList.remove('show'),ms||2600);
}

const banco=new THREE.Group(); scene.add(banco);
const gRueda=new THREE.Group();      // gira con el cigüeñal
const gArbol=new THREE.Group();      // gira a la mitad
const gMotor=new THREE.Group();      // el bloque, quieto
const gAdm=new THREE.Group();        // admisión, mariposa y sensores
const gInstr=new THREE.Group();      // el osciloscopio
banco.add(gMotor,gAdm,gInstr);

// --- la mesa ---------------------------------------------------------------
let mesa=null;
function construyeMesa(d){
  if(mesa){ banco.remove(mesa); mesa=null; }
  mesa=new THREE.Group();
  // Todas las piezas viven entre z = −0,98 y z = −0,19, así que una mesa
  // centrada en cero deja medio metro de tablero vacío por delante y obliga a la
  // cámara a alejarse para encuadrar madera.
  const L=d.ancho+0.52, Z=1.34, h=0.74, zc=-0.42;
  const tab=roundedBox(L,0.075,Z,MAT.banco,0.02);
  pon(tab,[d.centro,h,zc]); tab.receiveShadow=true; mesa.add(tab);
  const chapa=roundedBox(L-0.10,0.010,Z-0.10,std({...brush,metalness:1.0,roughness:0.30}),0.004);
  pon(chapa,[d.centro,h+0.043,zc]); chapa.receiveShadow=true; mesa.add(chapa);
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const p=new THREE.Mesh(new THREE.BoxGeometry(0.062,h,0.062),MAT.acero);
    pon(p,[d.centro+sx*(L/2-0.11), h/2, zc+sz*(Z/2-0.11)]);
    p.castShadow=true; mesa.add(p);
  }
  const trav=new THREE.Mesh(new THREE.BoxGeometry(L-0.30,0.045,0.045),MAT.acero);
  pon(trav,[d.centro,0.20,zc]); mesa.add(trav);
  banco.add(mesa);
  return h+0.048;
}

// --- la rueda fónica y su captador ------------------------------------------
let ckpSensor=null, ckpLed=null, cmpSensor=null, cmpLed=null, dientesMesh=[];
function construyeMotor(e,d,y0){
  gMotor.clear(); gRueda.clear(); gArbol.clear(); dientesMesh=[];
  const yEje=y0+0.86;
  // Tapa de distribución: una placa vertical contra la que se monta todo.
  const tapa=roundedBox(0.86,1.62,0.11,MAT.bloque,0.05);
  pon(tapa,[d.xR,y0+0.83,-0.30]); tapa.castShadow=true; gMotor.add(tapa);
  const bloque=roundedBox(0.62,0.96,0.72,MAT.culata,0.05);
  pon(bloque,[d.xR+0.10,y0+0.50,-0.74]); bloque.castShadow=true; gMotor.add(bloque);

  // La rueda: un disco con `dientes` posiciones, a las que le faltan `faltan`.
  // Los dientes se dibujan uno a uno porque el hueco TIENE que verse.
  const disco=new THREE.Mesh(new THREE.CylinderGeometry(d.rR*0.80,d.rR*0.80,0.052,48),MAT.acero);
  disco.rotation.x=Math.PI/2; disco.castShadow=true; gRueda.add(disco);
  const cubo=new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.10,0.10,20),MAT.crom);
  cubo.rotation.x=Math.PI/2; gRueda.add(cubo);
  const anchoD=2*Math.PI*d.rR*0.86/e.dientes*0.56;
  for(const dd of dientesPresentes(e,FA())){
    const a=dd.ang*DEG;
    const m=new THREE.Mesh(new THREE.BoxGeometry(anchoD,0.13,0.050),MAT_DIENTE);
    m.position.set(Math.cos(a)*d.rR*0.86, Math.sin(a)*d.rR*0.86, 0);
    m.rotation.z=a-Math.PI/2; m.castShadow=true;
    gRueda.add(m); dientesMesh.push(m);
  }
  pon(gRueda,[d.xR,yEje,-0.22]); gMotor.add(gRueda);
  gMotor.add(rot3('rueda '+e.dientes+'−'+e.faltan,'#8a929c',[d.xR,yEje+d.rR+0.26,-0.22]));

  // El captador: su separación de la rueda es la del modelo, a escala, para que
  // un entrehierro grande se VEA grande.
  const g=entrehierroDe(e,FA());
  const sep=d.rR*0.86+0.075+g*0.055;
  ckpSensor=new THREE.Group();
  const cuerpo=new THREE.Mesh(new THREE.CylinderGeometry(0.048,0.055,0.24,18),MAT_INY);
  cuerpo.rotation.z=Math.PI/2; ckpSensor.add(cuerpo);
  const punta=new THREE.Mesh(new THREE.CylinderGeometry(0.030,0.030,0.06,14),MAT.crom);
  punta.rotation.z=Math.PI/2; punta.position.x=-0.15; ckpSensor.add(punta);
  ckpLed=new THREE.Mesh(new THREE.SphereGeometry(0.028,14,10),MAT.ok);
  ckpLed.position.x=0.16; ckpSensor.add(ckpLed);
  pon(ckpSensor,[d.xR+sep+0.15, yEje, -0.22]); gMotor.add(ckpSensor);
  gMotor.add(rot3('captador de cigüeñal',COL_SEN.ckp,[d.xR+sep+0.30, yEje+0.20, -0.22]));

  // El árbol de levas: rueda dentada arriba, girando a la mitad. Va DESPLAZADA
  // en X: puesta justo encima del cigüeñal, las dos ruedas dentadas se leen como
  // una sola columna rayada y no se distingue cuál es cuál.
  const dxA=0.62, yA=yEje+0.78;
  const pol=new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.30,0.048,Math.min(48,e.dientesArbol)),MAT.acero);
  pol.rotation.x=Math.PI/2; pol.castShadow=true; gArbol.add(pol);
  for(let i=0;i<Math.min(24,e.dientesArbol);i++){
    const a=i/Math.min(24,e.dientesArbol)*Math.PI*2;
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.030,0.055,0.046),MAT_DIENTE);
    m.position.set(Math.cos(a)*0.315,Math.sin(a)*0.315,0); m.rotation.z=a;
    gArbol.add(m);
  }
  // La marca de reglaje: es LA referencia visible de la sincronía.
  const marca=new THREE.Mesh(new THREE.BoxGeometry(0.036,0.15,0.052),
    std({color:0xffd166,emissive:0xffd166,emissiveIntensity:0.8,roughness:0.4}));
  marca.position.set(0,0.24,0.004); gArbol.add(marca);
  pon(gArbol,[d.xR+dxA,yA,-0.22]); gMotor.add(gArbol);

  cmpSensor=new THREE.Group();
  const c2=new THREE.Mesh(new THREE.CylinderGeometry(0.040,0.046,0.20,16),MAT_INY);
  c2.rotation.z=Math.PI/2; cmpSensor.add(c2);
  cmpLed=new THREE.Mesh(new THREE.SphereGeometry(0.026,14,10),MAT.ok);
  cmpLed.position.x=0.13; cmpSensor.add(cmpLed);
  pon(cmpSensor,[d.xR+dxA+0.46, yA, -0.22]); gMotor.add(cmpSensor);
  gMotor.add(rot3('sensor de árbol',COL_SEN.cmp,[d.xR+dxA+0.30, yA+0.36, -0.22]));

  // La correa que une los dos, en diagonal entre los dos centros. Si salta un
  // diente, se ve dónde.
  const ang=Math.atan2(yA-yEje,dxA), lar=Math.hypot(dxA,yA-yEje);
  for(const s of [-1,1]){
    const c=new THREE.Mesh(new THREE.BoxGeometry(lar,0.048,0.028),MAT_MANG);
    c.rotation.z=ang;
    pon(c,[d.xR+dxA/2-s*0.35*Math.sin(ang), yEje+(yA-yEje)/2+s*0.35*Math.cos(ang), -0.19]);
    gMotor.add(c);
  }
  return { yEje, yA };
}

// ============================================ T3b · ADMISIÓN, INSTRUMENTO Y ANIMACIÓN
let mariposa=null, agujaMap=null, hiloMaf=null, inyLed=null, oscTex=null, oscCv=null, oscCtx=null;

function construyeAdmision(e,d,y0){
  gAdm.clear();
  const yT=y0+0.94, r=0.115;
  const tubo=(x0,x1,rr)=>{
    const m=new THREE.Mesh(new THREE.CylinderGeometry(rr,rr,x1-x0,20),MAT_TUBO);
    m.rotation.z=Math.PI/2; pon(m,[(x0+x1)/2,yT,-0.22]); m.castShadow=true; return m;
  };
  gAdm.add(tubo(d.xAdm0,d.xAdm0+0.40,r));
  gAdm.add(tubo(d.xAdm0+0.40,d.xAdm0+0.92,r*0.90));
  // Medidor de masa de aire: una caja con el hilo caliente dentro.
  const caja=roundedBox(0.30,0.20,0.20,MAT.caja,0.03);
  pon(caja,[d.xAdm0+0.20,yT+0.13,-0.22]); caja.castShadow=true; gAdm.add(caja);
  hiloMaf=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.13,8),
    std({color:0xE0A33E,emissive:0xE0A33E,emissiveIntensity:1.2,roughness:0.4}));
  pon(hiloMaf,[d.xAdm0+0.20,yT,-0.22]); gAdm.add(hiloMaf);
  gAdm.add(rot3('masa de aire',COL_SEN.maf,[d.xAdm0+0.20,yT+0.40,-0.22]));

  // Cuerpo de mariposa: la placa gira sobre su eje. Es una PLACA, no un disco:
  // un disco a media apertura se ve como una elipse y parece otra pieza.
  const cuerpo=new THREE.Mesh(new THREE.CylinderGeometry(r*1.20,r*1.20,0.20,22),MAT.bloque);
  cuerpo.rotation.z=Math.PI/2; pon(cuerpo,[d.xAdm0+1.02,yT,-0.22]); gAdm.add(cuerpo);
  mariposa=new THREE.Mesh(new THREE.BoxGeometry(0.010,r*1.96,r*1.96),MAT.crom);
  pon(mariposa,[d.xAdm0+1.02,yT,-0.22]); gAdm.add(mariposa);
  const tpsCaja=roundedBox(0.14,0.14,0.07,MAT.caja,0.02);
  pon(tpsCaja,[d.xAdm0+1.02,yT,-0.22+r*1.30]); gAdm.add(tpsCaja);
  gAdm.add(rot3('posición de mariposa',COL_SEN.tps,[d.xAdm0+1.02,yT-0.34,-0.22]));

  // Colector: un depósito, y encima el sensor de presión con su manguera.
  const plen=roundedBox(0.92,0.26,0.42,MAT.bloque,0.05);
  pon(plen,[d.xAdm1-0.30,yT,-0.24]); plen.castShadow=true; gAdm.add(plen);
  const mapCaja=roundedBox(0.13,0.11,0.11,MAT.caja,0.02);
  pon(mapCaja,[d.xAdm1-0.44,yT+0.30,-0.24]); gAdm.add(mapCaja);
  agujaMap=new THREE.Mesh(new THREE.SphereGeometry(0.024,12,10),MAT.ok);
  pon(agujaMap,[d.xAdm1-0.44,yT+0.39,-0.24]); gAdm.add(agujaMap);
  const mang=new THREE.Mesh(new THREE.CylinderGeometry(0.020,0.020,0.20,10),MAT_MANG);
  pon(mang,[d.xAdm1-0.44,yT+0.17,-0.24]); gAdm.add(mang);
  gAdm.add(rot3('presión de colector',COL_SEN.map,[d.xAdm1-0.44,yT+0.58,-0.24]));

  // Un inyector, con su testigo de mando.
  const iny=new THREE.Mesh(new THREE.CylinderGeometry(0.038,0.030,0.24,14),MAT_INY);
  pon(iny,[d.xAdm1-0.02,yT-0.24,-0.24]); iny.castShadow=true; gAdm.add(iny);
  inyLed=new THREE.Mesh(new THREE.SphereGeometry(0.028,14,10),MAT.avi);
  pon(inyLed,[d.xAdm1-0.02,yT-0.06,-0.24]); gAdm.add(inyLed);
  gAdm.add(rot3('inyector',COL_SEN.iny,[d.xAdm1+0.06,yT-0.66,-0.24]));
}

// --- el osciloscopio -------------------------------------------------------
// Un instrumento de verdad, con su pantalla: enseña el canal elegido y lo pinta
// desde el MISMO motor sellado que el pizarrón. No hay dos fuentes de curvas.
function construyeInstrumento(e,d,y0){
  gInstr.clear();
  if(!oscCv){
    oscCv=document.createElement('canvas'); oscCv.width=512; oscCv.height=288;
    oscCtx=oscCv.getContext('2d');
    oscTex=new THREE.CanvasTexture(oscCv); oscTex.colorSpace=THREE.SRGBColorSpace;
  }
  const x=d.xDer-0.30, y=y0+0.62, z=-0.72;
  const caja=roundedBox(0.86,0.62,0.30,MAT.caja,0.04);
  pon(caja,[x,y,z]); caja.castShadow=true; gInstr.add(caja);
  const pan=new THREE.Mesh(new THREE.PlaneGeometry(0.70,0.40),
    new THREE.MeshBasicMaterial({map:oscTex,toneMapped:false}));
  pon(pan,[x,y+0.05,z+0.152]); gInstr.add(pan);
  for(let i=0;i<4;i++){
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.03,12),MAT.crom);
    b.rotation.x=Math.PI/2; pon(b,[x-0.28+i*0.185,y-0.24,z+0.152]); gInstr.add(b);
  }
  gInstr.add(rot3('osciloscopio',TINTA,[x,y+0.44,z]));
  // Las dos sondas, colgando hacia el motor.
  for(const [sx,col] of [[-0.22,COL_SEN.ckp],[0.10,COL_SEN.cmp]]){
    const cab=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.9,8),MAT_CABLE);
    cab.rotation.z=Math.PI/2.6; pon(cab,[x+sx-0.44,y-0.30,z+0.16]); gInstr.add(cab);
  }
}
function pintaOsc(){
  if(!oscCtx) return;
  const W=512,H=288,c=oscCtx;
  c.fillStyle='#060a0f'; c.fillRect(0,0,W,H);
  c.strokeStyle='#16202c'; c.lineWidth=1;
  for(let i=1;i<10;i++){ c.beginPath(); c.moveTo(W*i/10,0); c.lineTo(W*i/10,H); c.stroke(); }
  for(let i=1;i<6;i++){ c.beginPath(); c.moveTo(0,H*i/6); c.lineTo(W,H*i/6); c.stroke(); }
  const s=serieCanal(G.canal);
  let a=Infinity,b=-Infinity;
  for(const p of s.pts){ a=Math.min(a,p[1]); b=Math.max(b,p[1]); }
  if(!isFinite(a)||b-a<1e-9){ a=(a||0)-1; b=(b||0)+1; }
  const m=(b-a)*0.16;
  const X=v=>28+(v-s.x0)/(s.x1-s.x0||1)*(W-40);
  const Y=v=>H-26-(v-(a-m))/((b+m)-(a-m))*(H-48);
  c.strokeStyle=COL_SEN[G.canal]; c.lineWidth=2; c.lineJoin='round';
  c.beginPath();
  s.pts.forEach((p,i)=>{ const xx=X(p[0]), yy=Y(p[1]); if(i) c.lineTo(xx,yy); else c.moveTo(xx,yy); });
  c.stroke();
  c.fillStyle='#9aa6b6'; c.font='600 14px Inter,system-ui,sans-serif';
  c.fillText(ROT_SEN[G.canal],12,20);
  c.textAlign='right';
  c.fillText(num(b,2)+' V máx',W-12,20);
  c.fillText(num(a,2)+' V mín',W-12,H-8);
  c.textAlign='left';
  oscTex.needsUpdate=true;
}

// --- montaje completo ------------------------------------------------------
let ejes3=null;
function construyeBanco(){
  const e=MQ(), d=dims(e);
  const y0=construyeMesa(d);
  ejes3=construyeMotor(e,d,y0);
  construyeAdmision(e,d,y0);
  construyeInstrumento(e,d,y0);
  colocaTablero(d);
}

// --- animación -------------------------------------------------------------
// El giro se pinta RALENTIZADO: a 2 500 rpm la rueda daría cuarenta vueltas por
// segundo y sólo se vería un borrón. El factor se declara y se dice en pantalla.
const LENTO=26;
let RELOJ=0;
// Cuenta FOTOGRAMAS de la escena, no repintados del pizarrón: puesto en
// pintaTablero() sólo avanzaría al tocar un mando, y la Capa 2 se quedaría
// esperando para siempre en cuanto nadie tocara nada.
let PINTADAS=0;
function pinta3D(dt){
  RELOJ+=dt; PINTADAS++;
  const e=MQ(), L=LECT(), rpm=rpmVista();
  const w=rpm/60*Math.PI*2/LENTO;
  if(gRueda) gRueda.rotation.z+=w*dt;
  if(gArbol) gArbol.rotation.z+=w*dt/2;
  // La mariposa: cerrada deja un hilo de paso, a fondo se pone en el eje.
  if(mariposa) mariposa.rotation.y=(0.12+G.acel*(Math.PI/2-0.20));
  // Los testigos dicen lo que dice el motor sellado, nunca lo que parece.
  if(ckpLed) ckpLed.material=L.pts[1].pasa?(L.sincroniza?MAT.ok:MAT.avi):MAT.bad;
  if(cmpLed) cmpLed.material=!L.hayCmp?MAT.bad:(Math.abs(L.desfase)>UMBRAL_FASE?MAT.avi:MAT.ok);
  if(agujaMap) agujaMap.material=Math.abs(L.pts[1].vMap-LECT_DE('sano').pts[1].vMap)>1e-9?MAT.avi:MAT.ok;
  if(hiloMaf) hiloMaf.material.emissiveIntensity=0.6+1.4*clamp(gastoAire(e,rpm,G.acel)/e.gastoMax,0,1);
  if(inyLed){
    // Un pulso por cilindro cada dos vueltas, ralentizado igual que el giro.
    const T=120/Math.max(1,rpm)/e.nCil*LENTO;
    const f=(RELOJ%T)/T;
    inyLed.material=f<0.30?(L.tCierre>L.tCierreSano+1e-9?MAT.bad:MAT.avi):MAT.caja;
  }
  pintaOsc();
}

// ================================================ T4a · HUD, PANEL Y MANDOS
const MODES=['sensores','rueda','sincro','tension','inyector','caza','censo','reto'];
// Rótulos CORTOS: van dentro del encabezado del panel, y uno largo lo dobla en
// dos líneas y se come el primer botón.
const MODE_META={
  sensores:{n:'· señales'},
  rueda:   {n:'· rueda'},
  sincro:  {n:'· sincronía'},
  tension: {n:'· tensión'},
  inyector:{n:'· inyector'},
  caza:    {n:'· muestreo'},
  censo:   {n:'· censo'},
  reto:    {n:'· a ciegas'},
};
const HUD_TXT={
  sensores:['Señales','Seis canales a la vez',
    'Cada sensor tiene su forma, y la forma dice cosas que el valor no dice. Dos averías pueden dar el mismo número en el escáner y ondas completamente distintas en el osciloscopio: ahí está toda la práctica.',
    'lo que se mide = valor  <b>y</b>  forma  <b>y</b>  instante'],
  rueda:['Rueda','El hueco y el margen',
    'La centralita encuentra la referencia midiendo la RAZÓN entre periodos de diente consecutivos. Esa razón no depende del régimen, y de ella sale todo el margen de diseño de la rueda fónica.',
    'razón = T<sub>hueco</sub> / T<sub>diente</sub> = huecos + 1'],
  sincro:['Sincronía','Dos canales, una fase',
    'El árbol gira a la mitad del cigüeñal, así que un diente saltado en su rueda dentada no vale un diente: vale 720 grados de cigüeñal entre sus dientes. No hay dato en directo que lo contenga.',
    'Δθ<sub>cig</sub> = 720° / Z<sub>árbol</sub>'],
  tension:['Tensión','Alimentación contra masa',
    'Mariposa, presión y masa de aire cuelgan de los mismos cinco voltios y de la misma masa. Una caída de alimentación los MULTIPLICA a los tres; una masa con resistencia les SUMA a los tres lo mismo.',
    'V<sub>medida</sub> = k · V<sub>recta</sub> + V<sub>masa</sub>'],
  inyector:['Inyector','La joroba de cierre',
    'La corriente sube contra L/R; al cortar el mando aparece el pico inductivo, y en su bajada hay una joroba pequeña: la aguja sentándose. Es lo único que dice si la aguja se pega.',
    'i(t) = (V/R)·(1 − e<sup>−t·R/L</sup>)'],
  caza:['Muestreo','¿Cuántas veces hay que intentarlo?',
    'Un escáner es un muestreador: lee cada ochenta milisegundos y entre lectura y lectura no sabe nada. La probabilidad de que cace una ventana de duración tau es exactamente tau entre su periodo.',
    'p = mín(1, τ / T<sub>s</sub>)   ·   n<sub>95</sub> = ⌈ln 0,05 / ln(1−p)⌉'],
  censo:['Censo','¿Qué instrumentos hacen falta?',
    'Trece escenarios, trece observaciones, 8 191 juegos posibles. La pregunta útil no es cuánto marca cada instrumento, sino cuántas averías distintas separa. Y el resultado NO es el mismo en las cuatro máquinas.',
    'firma(sub) → clases de equivalencia'],
  reto:['Reto','Diagnostica a ciegas',
    'El escenario está oculto. Mira las vistas que necesites y entrega la FAMILIA de avería. Hay averías que no ponen ningún código, y en una de las cuatro máquinas hay una que no deja huella en ningún instrumento.',
    'diagnóstico = f(forma, amplitud, fase, cero, rizado, joroba)'],
};
function pintaHUD(){
  const t=HUD_TXT[G.modo]||HUD_TXT.sensores, e=MQ();
  el('hud').innerHTML=
    '<div class="eyebrow">Formas de onda del motor · '+t[0]+'</div>'+
    '<h2>'+t[1]+'</h2>'+
    '<p>'+t[2]+'</p>'+
    '<div class="formula">'+t[3]+'</div>'+
    '<div class="legend">'+
      CANALES.map(k=>'<div class="li"><span class="dot" style="background:'+COL_SEN[k]+'"></span>'+ROT_SEN[k]+'</div>').join('')+
    '</div>'+
    '<div class="fid">'+
      '<div class="ft">🔒 Contrato de fidelidad</div>'+
      '<div class="fl"><b>Sí modela:</b> la rueda fónica diente a diente, con su hueco de referencia y la <b>razón</b> entre periodos consecutivos con la que la centralita lo encuentra —de ahí sale el margen del umbral, que es distinto en una rueda de 60−2 y en una de 36−1—; el captador de <b>reluctancia variable</b>, cuya tensión es proporcional al régimen y se hunde con el entrehierro según una potencia ajustada de este banco; el sensor de <b>efecto Hall</b>, de amplitud fija hasta que deja de conmutar; la sincronía cigüeñal-árbol con los 720°/Z que vale un diente saltado; las tres rectas de calibración colgando de la misma alimentación y de la misma masa, con el <b>rizado</b> de la admisión a la frecuencia de aspiración; la onda eléctrica del inyector con su exponencial L/R, su pico inductivo y la <b>joroba de cierre</b>; y la probabilidad <b>exacta</b> de que un muestreador de periodo T<sub>s</sub> cace una ventana de duración τ.</div>'+
      '<div class="fl no"><b>NO modela:</b> la combustión, la mezcla ni los ajustes de la centralita —eso es la práctica anterior—; el avance de encendido y la bobina; el bus de datos y su latencia, que aquí se resume en un solo periodo de refresco declarado; el ruido de fondo del vehículo, salvo el acoplamiento del encendido que declara una avería; la <b>degradación del ciclo de trabajo</b> de un sensor de efecto Hall cerca del límite de su entrehierro, que en el banco es un corte limpio; y el propio osciloscopio: su ancho de banda, sus sondas y su disparo son la práctica <b>d10-03</b> y <b>d10-04</b>. Las averías intermitentes se <b>congelan</b> en su instante malo para que las cifras sean repetibles; lo que sí se modela es la probabilidad de cazarlas. El giro se pinta ralentizado '+num(LENTO,0)+' veces para que la rueda no sea un borrón. Los cuatro motores son arquetipos declarados, <b>no</b> modelos comerciales: la rueda fónica, el entrehierro y el inyector de un motor concreto están en su manual de taller y en ningún otro sitio.</div>'+
    '</div>'+
    '<div class="src">Ref: captadores de reluctancia variable y de efecto Hall, rueda fónica, sensores de posición y de presión de colector, medidor de masa de aire de hilo caliente e inyectores de mando por saturación (Bosch, «Automotive Handbook») · SAE J1979 / ISO 15031-5, modos 01 y 06 (datos en directo y su refresco) · ISO 15031-6 / SAE J2012 (códigos) · manual de taller del fabricante (única fuente de la rueda, del entrehierro y del inyector de un motor concreto) · Motor en pantalla: '+e.nombre+'.</div>';
}

el('panel').innerHTML=
  '<h4>Banco de señales <span id="p_mode"></span></h4>'+
  '<div class="modebar">'+
    '<button class="b" id="m_sensores">1 · Señales</button>'+
    '<button class="b" id="m_rueda">2 · Rueda</button>'+
    '<button class="b" id="m_sincro">3 · Sincronía</button>'+
    '<button class="b" id="m_tension">4 · Tensión</button>'+
  '</div>'+
  '<div class="modebar">'+
    '<button class="b" id="m_inyector">5 · Inyector</button>'+
    '<button class="b" id="m_caza">6 · Cazar</button>'+
    '<button class="b" id="m_censo">7 · Censo</button>'+
    '<button class="b" id="m_reto">8 · Reto</button>'+
  '</div>'+
  '<div id="ctrlbar"></div>'+
  '<div id="tele"></div>'+
  '<div class="console" id="report"></div>'+
  '<h4 class="sec" id="retoTitle">Diagnóstico a ciegas</h4>'+
  '<div id="retoBox">'+
    '<div class="console" id="retoSpec"></div>'+
    '<div class="btns" id="obsreto"></div>'+
    '<div class="btns" id="dxreto"></div>'+
    '<div class="btns">'+
      '<button class="b" id="btnPista">💡 Pedir una pista</button>'+
      '<button class="b primary" id="btnCheck">Entregar el diagnóstico</button>'+
    '</div>'+
  '</div>'+
  '<h4 class="sec">Pregunta de ingeniería</h4>'+
  '<div id="q_text" class="console"></div>'+
  '<div class="btns" id="dxbtns"></div>'+
  '<div class="btns">'+
    '<button class="b auto" id="btnAuto">▶︎ Recorrido guiado</button>'+
    '<button class="b primary" id="btnNew">🔀 Otro caso</button>'+
  '</div>';

// ------------------------------------------------------------------ controles
// Los mandos se levantan desde el estado. Un mando que no puede hacer nada en el
// modo actual no se dibuja: un botón pulsable que no cambia nada enseña a
// desconfiar de la interfaz.
// Los botones de una barra se reparten el ancho a partes iguales, así que trece
// en una sola fila salen ilegibles y el último se sale del panel. Se cortan en
// varias barras de altura pareja, calculadas del número de opciones.
// Cuatro por fila y no cinco: con cinco, el quinto rótulo de los escenarios se
// sale por el borde derecho del panel. Los botones se reparten el ancho a partes
// iguales, así que el ancho útil por botón es el del panel entre los de su fila.
function fila(rot,attr,ops,cur){
  const filas=Math.max(1,Math.ceil(ops.length/4));
  let h='<div class="gl" style="margin:9px 0 4px"><span>'+rot+'</span></div>';
  // El reparto es PAR: con trece opciones en filas de cuatro sobra una sola en
  // la última, y un botón solo se estira a lo ancho del panel entero.
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
// El régimen de arranque y el ralentí son PROPIEDADES de la máquina, así que
// siempre están entre las opciones. Ofrecer un régimen que este motor no tiene
// sacaría cifras de un punto inexistente.
const rpmOps=()=>[...new Set([RPM_ARRANQUE,MQ().ralenti,1500,2500,4000,6000])].sort((a,b)=>a-b);
const ROT_RPM=r=>r===RPM_ARRANQUE?'arranque':(r===MQ().ralenti?'ralentí':num(r,0));
const ACEL_OPS=[[0,'cerrado'],[0.15,'poco'],[0.30,'crucero'],[0.60,'firme'],[1,'a fondo']];
const BARR_OPS=BARRIDOS.map(t=>[t,num(t,2)+' s']);

function syncCtrlbar(){
  const ciego=(G.modo==='reto');
  let h=fila('Motor del banco','data-maq',ARQ_KEYS.map(k=>[k,ARQ[k].corto]),G.maq);
  // En el diagnóstico a ciegas el escenario NO se ofrece: elegirlo sería leer la
  // respuesta. Lo pone armaReto() y no se puede tocar hasta entregarlo.
  if(!ciego) h+=fila('Escenario','data-esc',ESCEN_KEYS.map(k=>[k,corta(ESC_CORTO[k]||ESCEN[k].rot,18)]),G.esc);
  h+=fila('Régimen','data-rpm',rpmOps().map(r=>[r,ROT_RPM(r)]),G.rpm);
  h+=fila('Acelerador','data-acel',ACEL_OPS,G.acel);
  // El canal sólo manda sobre la pantalla del osciloscopio del banco: en el modo
  // de señales el pizarrón enseña los seis a la vez.
  h+=fila('Canal del osciloscopio','data-canal',CANALES.map(k=>[k,ROT_SEN[k].split(' ')[0]]),G.canal);
  if(G.modo==='caza') h+=fila('Barrido del acelerador','data-barr',BARR_OPS,G.barrido);
  el('ctrlbar').innerHTML=h;
  MODES.forEach(m=>{ const b=el('m_'+m); if(b) b.classList.toggle('on',G.modo===m); });
  const pm=el('p_mode'); if(pm) pm.textContent=MODE_META[G.modo]?MODE_META[G.modo].n:'';
  const rb=el('retoBox'), rt=el('retoTitle');
  if(rb) rb.style.display=ciego?'':'none';
  if(rt) rt.style.display=ciego?'':'none';
}

// ----------------------------------------------------------------- telemetría
const gl=(l,v,c)=>'<div class="g"><div class="gl"><span>'+l+'</span><b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div></div>';
function pintaTele(){
  const e=MQ(), L=LECT(), SN=LECT_DE('sano'), rpm=rpmVista();
  const ciego=(G.modo==='reto');
  let h='';
  h+=gl('Régimen en pantalla',rpmT(rpm)+(enArranque()?'  (arranque)':''));
  h+=gl('Amplitud del cigüeñal',volt(ampCkp(e,rpm,FA()),3),
    ampCkp(e,rpm,FA())>=e.umbralCkp?'good':'bad');
  h+=gl('Umbral del comparador',volt(e.umbralCkp,2));
  h+=gl('Dientes por vuelta',num(L.pulsos,0)+' de '+num(L.pulsosSano,0),
    L.pulsos<L.pulsosSano?'bad':'good');
  if(L.falsos>0) h+=gl('Dientes falsos por ciclo',num(L.falsos,0),'bad');
  h+=gl('Referencias que ve',num(L.huecos,0),L.huecos===1?'good':'bad');
  h+=gl('¿Arranca?',L.arranca?'sí':'NO',L.arranca?'good':'bad');
  h+=gl('Fase cigüeñal-árbol',L.desfase===null?'sin señal':firm(L.desfase,1),
    L.desfase===null?'bad':(Math.abs(L.desfase)>UMBRAL_FASE?'bad':'good'));
  h+=gl('Mariposa',volt(vTps(e,G.acel,FA()),3),
    Math.abs(vTps(e,G.acel,FA())-vTps(e,G.acel,{}))>1e-9?'warn':'good');
  h+=gl('Presión de colector',bar(presionColector(e,rpm,G.acel),3)+' · '+volt(vMap(e,rpm,G.acel,FA()),3),
    Math.abs(L.pts[1].vMap-SN.pts[1].vMap)>1e-9?'warn':'good');
  h+=gl('Masa de aire',gs(gastoAire(e,rpm,G.acel),1)+' · '+volt(vMaf(e,rpm,G.acel,FA()),3),
    Math.abs(L.pts[2].vMaf-SN.pts[2].vMaf)>1e-9?'warn':'good');
  h+=gl('Rizado de la admisión',volt(rizadoMap(e,G.acel,FA()),3)+' a '+hz(fAspiracion(e,rpm),1),
    L.pts[1].rizado<SN.pts[1].rizado-1e-9?'bad':'good');
  h+=gl('Joroba de cierre',mili(L.tCierre,2),L.tCierre>L.tCierreSano+1e-9?'bad':'good');
  h+=gl('Línea de cero',volt(L.offset,2),Math.abs(L.offset)>1e-9?'warn':'good');
  h+=gl('Alimentación en el sensor',volt(L.vAlim,2),Math.abs(L.vAlim-V_REF)>1e-9?'warn':'good');
  h+=gl('Códigos',L.codigos.length?L.codigos.join(' · '):'ninguno',L.codigos.length?'bad':'good');
  if(G.modo==='caza'){
    const C=veredictoCaza();
    h+=gl('Ventana del fallo',C.hay?mili(C.tau*1000,1):'—',C.hay?'warn':'good');
    h+=gl('Lo caza el escáner',C.hay?pc(C.pE*100,1):'—',C.hay?(C.pE>=1?'good':'bad'):'good');
    h+=gl('Intentos para el '+pc(CONFIANZA*100,0),C.hay?(isFinite(C.repE)?num(C.repE,0):'∞'):'—');
  }
  if(ciego) h+=gl('Escenario','oculto hasta entregar','warn');
  el('tele').innerHTML=h;
}

// -------------------------------------------------------------------- informe
function pintaInforme(){
  const e=MQ(), L=LECT(), V=veredicto(), E=veredictoEngano(), C=veredictoCaza();
  const cls=E.nivel;
  let h='<b class="'+cls+'">'+ESCEN[G.esc].rot+'</b><br>';
  if(G.modo==='reto'&&!G.resuelto){
    h='<b class="warn">Avería por determinar</b><br>'+
      'Trece observaciones sobre la mesa. Siete se hacen con lo que hay en cualquier taller y seis piden osciloscopio. '+
      'El censo dice cuántas averías separa cada juego, y ahí está la pista de qué medir primero.';
    el('report').innerHTML=h; return;
  }
  h+=FALLAS[ESCEN[G.esc].falla].nota+'<br><br>';
  // Lo que el taller corriente puede y no puede.
  if(E.ciego){
    h+='<b class="bad">Este banco NO puede diagnosticarla en este motor.</b> Con las trece observaciones sobre la mesa da exactamente la misma huella que '+
      E.mudos.map(k=>ESCEN[k].rot.toLowerCase()).join(' y ')+'. No es un fallo del banco: es que en este motor esa avería no cambia nada. '+
      'Declararlo es más honesto que inventar una diferencia.<br><br>';
  }else if(E.gemelos.length){
    h+='Con el taller corriente se confunde con <b>'+E.gemelos.map(k=>ESC_CORTO[k]).join('</b>, <b>')+'</b>. '+
      (E.separan.length
        ? 'La separa <b>'+E.separan.map(m=>OBS_CORTO[m.k]).join('</b> o <b>')+'</b>, y las tres piden osciloscopio.'
        : 'Ninguna medida suelta de este banco la separa de todas ellas: hace falta combinar varias.')+'<br><br>';
  }else{
    h+='Con el taller corriente ya sale separada de las otras doce: '+
      (L.codigos.length?'el escáner declara '+L.codigos.map(c=>CODIGO_ROT[c]).join(', ')+'.':'no hace falta ni un código para verla.')+'<br><br>';
  }
  // Y la lectura de ingeniería, distinta según lo que esté puesto.
  if(!L.sincroniza) h+='La centralita ve <b>'+num(L.huecos,0)+'</b> referencias por vuelta cuando necesita una. Sin referencia única no sabe dónde está el motor.';
  else if(!L.arranca) h+='La señal del captador da <b>'+volt(L.pts[0].ampCkp,3)+'</b> con el motor de arranque contra un umbral de <b>'+volt(e.umbralCkp,2)+'</b>. A ralentí daría '+volt(L.pts[1].ampCkp,3)+': el coche no arranca y funcionaría bien si arrancara.';
  else if(V.faltanPulsos) h+='Falta un pulso por vuelta y la centralita <b>sigue sincronizando</b>, porque la razón que abre el diente roto no llega al umbral de '+num(e.umbralRazon,2)+'.';
  else if(V.hayFalsos) h+='El ruido acoplado pasa del umbral y mete <b>'+num(L.falsos,0)+'</b> dientes falsos por ciclo. Un diente falso acorta periodos, así que no engaña al detector de referencia: rompe la cuenta angular.';
  else if(V.hayRuido) h+='Hay ruido acoplado de <b>'+volt(L.ruidoV,2)+'</b> y este captador conmuta a '+volt(e.umbralCkp,2)+': la centralita no se entera y el osciloscopio lo ve perfectamente.';
  else if(V.sinCmp) h+='Sin señal del árbol el motor arranca igual, porque la referencia angular es el cigüeñal. Lo que pierde es la inyección secuencial.';
  else if(V.desfasado) h+='La distribución está <b>'+firm(L.desfase,1)+'</b> fuera de sitio, que es exactamente un diente de la rueda del árbol: '+num(gradosPorDienteArbol(e),2)+'° de cigüeñal.';
  else if(V.huecoPista) h+='Con un barrido de '+num(G.barrido,2)+' s el hueco dura <b>'+mili(C.tau*1000,1)+'</b> y el escáner lee cada '+mili(TS_ESCANER*1000,0)+': lo caza el <b>'+pc(C.pE*100,1)+'</b> de las veces. Barriendo en '+num(C.tSeguro,2)+' s o más lo caza siempre.';
  else if(V.escala) h+='Las tres señales están multiplicadas por <b>'+num(L.vAlim/V_REF,3)+'</b>: la razón contra la recta de fábrica es la misma en todo el recorrido y la diferencia crece con la apertura.';
  else if(V.cero) h+='Las tres señales están desplazadas <b>'+volt(L.offset,2)+'</b>: la diferencia es la misma en todo el recorrido y la razón se acerca a uno según se abre.';
  else if(L.pts[1].rizado<LECT_DE('sano').pts[1].rizado-1e-9) h+='La señal de presión ha perdido el rizado de <b>'+volt(LECT_DE('sano').pts[1].rizado,3)+'</b> a '+hz(L.pts[1].fRizado,1)+'. La ausencia de rizado es el dato.';
  else if(Math.abs(L.pts[2].vMaf-LECT_DE('sano').pts[2].vMaf)>1e-9) h+='El hilo caliente sub-declara <b>'+pc((1-FALLAS.mafSucio.mafMul)*100,0)+'</b> de masa, y la raíz lo deja en <b>'+pc((LECT_DE('sano').pts[2].vMaf-L.pts[2].vMaf)/LECT_DE('sano').pts[2].vMaf*100,1)+'</b> de tensión: por debajo del umbral del autodiagnóstico.';
  else if(V.cierreTarde) h+='La aguja tarda <b>'+mili(L.tCierre,2)+'</b> en sentarse contra los '+mili(L.tCierreSano,2)+' de fábrica. La constante eléctrica no se ha movido: la avería es mecánica.';
  else h+='Las trece observaciones dan lo mismo que la máquina de fábrica. Ésta es la referencia contra la que se comparan las doce averías.';
  el('report').innerHTML=h;
}

// -------------------------------------------------------------------- cambios
function afterEdit(){
  invalida();
  if(!rpmOps().includes(G.rpm)) G.rpm=MQ().ralenti;
  pintaTablero(); pintaTele(); pintaInforme(); syncCtrlbar();
}
function cambiaMaquina(k){
  G.maq=k;
  // El ralentí es propiedad de la máquina y el escenario puede ser mudo en la
  // nueva: en cuanto lo es, se vuelve al sano en vez de dejar puesta una avería
  // que este motor no puede enseñar.
  G.rpm=MQ().ralenti;
  invalida();
  if(G.modo==='reto'){ armaReto(); }
  else if(G.esc!=='sano'&&!distinguible(MQ(),G.esc)){
    showToast('En el <b>'+MQ().corto+'</b> esa avería no deja huella en ninguna de las trece observaciones. Se vuelve al motor sano.',3400);
    G.esc='sano';
  }
  construyeBanco();
  afterEdit(); refrescaPregunta();
  const t=camConjunto(MARGEN[G.modo]||1.00); S.moveTo(t[0],t[1],0.9);
}
const MARGEN={sensores:1.00, rueda:0.96, sincro:0.96, tension:0.96,
  inyector:0.98, caza:0.96, censo:0.94, reto:0.96};
function setMode(m){
  G.modo=m;
  if(m==='reto') armaReto();
  pintaHUD(); afterEdit(); refrescaPregunta();
  // Encuadre. Todos los modos se leen en el pizarrón, y el banco tiene que caber
  // al lado: el encuadre sale del ancho real de los dos juntos y no de una
  // distancia escrita a mano. El margen es lo único que cambia de un modo a otro,
  // y sólo para acercarse un poco cuando la vista es de mucho texto.
  const t=camConjunto(MARGEN[m]||1.00); S.moveTo(t[0],t[1],1.1);
}

// ============================== T4b · RETO, CUESTIONARIO, RECORRIDO Y ARRANQUE
const RETO={caso:null, tomadas:{}, eleccion:null, veredicto:null, pistas:0};

function barajaEn(a){                       // Fisher-Yates, para que la posición
  for(let i=a.length-1;i>0;i--){            // de la respuesta no sea la pista
    const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function armaReto(){
  const casos=RETO_CASOS();
  RETO.caso=casos[Math.floor(Math.random()*casos.length)];
  G.esc=RETO.caso;
  RETO.tomadas={}; RETO.eleccion=null; RETO.veredicto=null; RETO.pistas=0;
  G.resuelto=false;
  invalida(); pintaObsReto(); pintaDxReto();
}
// Valor legible de cada observación. Sale del motor sellado y se publica con la
// MISMA resolución con la que el censo la cuenta: comprar el instrumento no da
// precisión infinita, y si la pantalla diera más dígitos que el censo, el censo
// estaría contando otra cosa que la que se ve en pantalla.
function valorObs(k){
  const e=MQ(), L=LECT(), o=OBS.find(x=>x.k===k);
  if(k==='arranque') return L.arranca?'sí arranca':'NO arranca';
  if(k==='codigo')   return L.codigos.length?L.codigos.join(' · '):'ningún código';
  if(k==='tpsCerr')  return volt(cuant(L.pts[1].vTps,o.res),1);
  if(k==='tpsAbre')  return volt(cuant(L.vTpsAbre,o.res),1);
  if(k==='barrido')  return L.pBarridoLento>=1?'aparece un hueco':'sin huecos';
  if(k==='mapRal')   return volt(cuant(L.pts[1].vMap,o.res),1);
  if(k==='mafCarga') return volt(cuant(L.pts[2].vMaf,o.res),1);
  if(k==='forma')    return num(L.pulsos,0)+' dientes'+(L.falsos>0?', +'+num(L.falsos,0)+' falsos':'')+
    (L.ruidoV>0?', con ruido':'')+', razón '+num(L.razonMax,1);
  if(k==='amplitud') return volt(cuant(L.pts[0].ampCkp,o.res),1);
  if(k==='cero')     return volt(cuant(L.offset,o.res),1);
  if(k==='rizado')   return volt(cuant(L.pts[1].rizado,o.res),2);
  if(k==='fase')     return L.desfase===null?'sin señal':firm(cuant(L.desfase,o.res),0);
  if(k==='cierre')   return mili(cuant(L.tCierre,o.res),1);
  return '—';
}
function mide(k){
  if(G.modo!=='reto'||RETO.tomadas[k]!==undefined) return;
  RETO.tomadas[k]=valorObs(k);
  synth.beep(560,0.06,0.04);
  pintaObsReto(); pintaReto(); pintaTablero(); pintaTele();
}
function pintaObsReto(){
  el('obsreto').innerHTML=OBS.map(o=>
    '<button class="b'+(RETO.tomadas[o.k]!==undefined?' on':'')+'" data-obs="'+o.k+'">'+
    (o.taller?'':'💰 ')+(OBS_CORTO[o.k]||corta(o.rot,30))+'</button>').join('');
}
function pintaDxReto(){
  const ops=barajaEn(FAMILIAS_RETO().slice());
  el('dxreto').innerHTML=ops.map(f=>
    '<button class="b'+(RETO.eleccion===f?' on':'')+'" data-fam="'+f+'">'+f+'</button>').join('');
}
function pintaReto(){
  const R=el('report'), n=Object.keys(RETO.tomadas).length;
  let h='<b>Coche bajo diagnóstico:</b> '+MQ().nombre+'. Observaciones tomadas: '+n+'/'+OBS.length+'. ';
  if(RETO.veredicto) h+=(RETO.veredicto.ok?'<b class="good">Acertaste.</b> ':'<b class="bad">Fallaste.</b> ')+RETO.veredicto.texto;
  else h+='Toma las que necesites —las que llevan 💰 piden osciloscopio—, elige la familia y entrega el diagnóstico.';
  R.innerHTML=h;
  const spec=el('retoSpec');
  spec.innerHTML=n
    ? OBS.filter(o=>RETO.tomadas[o.k]!==undefined)
        .map(o=>'<span class="mono">'+OBS_CORTO[o.k]+': <b>'+RETO.tomadas[o.k]+'</b></span>').join('<br>')
    : 'Todavía no has medido nada. Empieza por lo que no cuesta: intentar arrancar y leer los códigos.';
}
function pistaReto(){
  if(G.modo!=='reto') return;
  RETO.pistas++;
  const e=MQ(), L=LECT(), E=veredictoEngano();
  const pistas=[
    L.codigos.length
      ? 'El escáner declara '+L.codigos.map(c=>CODIGO_ROT[c]).join(' y ')+'. Un código dice en qué circuito mirar, no qué le pasa.'
      : 'El escáner sale limpio: no hay ni un código. Eso ya descarta la mitad de las familias del banco.',
    E.gemelos.length
      ? 'Con el taller corriente esta avería se confunde con '+E.gemelos.map(k=>ESC_CORTO[k]).join(' y ')+'. Hace falta osciloscopio para separarla.'
      : 'Con el taller corriente esta avería ya sale separada de las otras doce. No hace falta gastar en osciloscopio.',
    E.separan.length
      ? 'La medida que la separa de todo lo demás es: '+E.separan.map(m=>OBS_CORTO[m.k]).join(' o ')+'.'
      : 'No hay una sola medida que la separe: hay que combinar por lo menos dos.'
  ];
  const t=pistas[Math.min(RETO.pistas,pistas.length)-1];
  showToast('💡 '+t,4600);
  synth.beep(760,0.06,0.05);
}
function entregaReto(){
  if(G.modo!=='reto') return;
  if(!RETO.eleccion){ showToast('Elige primero una familia de avería.',2400); return; }
  const ok=RETO.eleccion===ESCEN[RETO.caso].clave;
  const n=Object.keys(RETO.tomadas).length;
  const E=veredictoEngano();
  RETO.veredicto={ ok, texto:
    'Era <b>'+ESCEN[RETO.caso].rot+'</b>, de la familia «'+ESCEN[RETO.caso].clave+'». '+
    FALLAS[ESCEN[RETO.caso].falla].nota+
    ' Lo resolviste con '+n+' observación'+(n===1?'':'es')+
    (E.separan.length?', y la que de verdad la separaba era '+E.separan.map(m=>OBS_CORTO[m.k]).join(' o ')+'.':'.') };
  G.resuelto=true;
  synth.beep(ok?880:220,0.10,0.07);
  pintaReto(); pintaTablero(); pintaTele(); syncCtrlbar();
}

// -------------------------------------------------------------- cuestionario
// Cada pregunta se responde con el motor sellado en el punto en el que está: no
// hay ninguna respuesta escrita a mano. Las opciones se barajan siempre.
function preguntas(){
  const e=MQ(), L=LECT(), C=veredictoCaza(), Q=[];
  Q.push({
    t:'¿Cuánta tensión da el captador de cigüeñal con el motor de ARRANQUE, y pasa el umbral?',
    ops:[[volt(L.pts[0].ampCkp,3)+' · '+(L.pts[0].pasa?'sí pasa':'NO pasa'),true],
         [volt(L.pts[1].ampCkp,3)+' · '+(L.pts[1].pasa?'sí pasa':'NO pasa'),false],
         [volt(e.umbralCkp,3)+' · justo en el umbral',false]],
    ex:'Con el arranque el cigüeñal gira a '+rpmT(RPM_ARRANQUE)+'. Un captador inductivo da una tensión proporcional al régimen, así que ése es el punto más difícil de su vida.'
  });
  Q.push({
    t:'¿Cuántas referencias por vuelta cree ver la centralita en este motor?',
    ops:[[num(L.huecos,0)+(L.huecos===1?'  (sincroniza)':'  (no sincroniza)'),true],
         [num(L.pulsosSano,0)+'  (una por diente)',false],
         ['siempre una, por construcción',false]],
    ex:'Busca las razones entre periodos que pasan de '+num(e.umbralRazon,2)+'. Con la rueda entera hay exactamente una; dos pulsos seguidos perdidos abren otra igual.'
  });
  Q.push({
    t:'Un diente saltado en la rueda del árbol de levas, ¿cuántos grados de CIGÜEÑAL vale en este motor?',
    ops:[[num(gradosPorDienteArbol(e),2)+NBSP+'°',true],
         [num(360/e.dientesArbol,2)+NBSP+'°',false],
         [num(pasoDiente(e),2)+NBSP+'°',false]],
    ex:'El árbol gira a la MITAD que el cigüeñal, así que 360/Z grados de árbol son 720/Z grados de cigüeñal. Confundirlos deja la distribución a mitad de camino.'
  });
  const kAl=L.vAlim/V_REF;
  Q.push({
    t:'Los tres sensores de tensión salen movidos. ¿Qué distingue una caída de alimentación de una masa con resistencia?',
    ops:[['la alimentación MULTIPLICA (razón constante) y la masa SUMA (diferencia constante)',true],
         ['la alimentación afecta sólo a la mariposa y la masa, sólo a la presión',false],
         ['las dos ponen el mismo código y no se pueden separar',false]],
    ex:'Aquí la razón contra la recta de fábrica vale '+num(kAl,3)+' y la diferencia a mariposa cerrada, '+volt(L.offset,2)+
       '. Con una sola lectura las dos averías son la misma; con los dos extremos del recorrido, no.'
  });
  if(C.hay){
    Q.push({
      t:'Con un barrido de '+num(G.barrido,2)+' s, ¿cuántas veces hay que repetir el gesto para cazar el hueco al '+pc(CONFIANZA*100,0)+' con el escáner?',
      ops:[[(isFinite(C.repE)?num(C.repE,0):'∞')+' veces',true],
           ['una, si se mira con atención',false],
           [num(Math.max(2,Math.round((isFinite(C.repE)?C.repE:9)/3)),0)+' veces',false]],
      ex:'El hueco dura '+mili(C.tau*1000,1)+' y el escáner lee cada '+mili(TS_ESCANER*1000,0)+', así que lo caza el '+pc(C.pE*100,1)+
         ' de las veces. Fallar n veces seguidas tiene probabilidad (1−p)ⁿ.'
    });
  }else{
    Q.push({
      t:'El escáner lee un dato cada '+mili(TS_ESCANER*1000,0)+'. ¿Qué probabilidad tiene de cazar una ventana de fallo de '+mili(12,0)+'?',
      ops:[[pc(pCaza(0.012,TS_ESCANER)*100,1),true],
           ['la mitad, porque puede caer antes o después',false],
           ['ninguna: un escáner nunca ve un fallo intermitente',false]],
      ex:'Con la fase del muestreador siendo cualquiera, la probabilidad de que una muestra caiga dentro de la ventana es exactamente τ/Ts mientras τ sea el menor de los dos.'
    });
  }
  const SN=LECT_DE('sano'), errM=1-FALLAS.mafSucio.mafMul;
  const errV=(SN.pts[2].vMaf-vMaf(e,2500,0.45,FALLAS.mafSucio))/SN.pts[2].vMaf;
  Q.push({
    t:'Un hilo caliente sucio sub-declara el '+pc(errM*100,0)+' de la MASA de aire. ¿Cuánto baja su TENSIÓN?',
    ops:[[pc(errV*100,1),true],[pc(errM*100,0),false],[pc(errM*errM*100,1),false]],
    ex:'La tensión del hilo va con la RAÍZ del gasto, así que la raíz comprime el error a menos de la mitad. Por eso no llega al umbral del '+
       pc(UMBRAL_MAF_REL*100,0)+' del autodiagnóstico y no salta ningún código.'
  });
  const CN=CENSO(), soloT=CN.filter(c=>c.sub.every(s=>s.taller));
  const techoT=Math.max(...soloT.map(c=>c.resueltos)), techo=CN[0].resueltos;
  Q.push({
    t:'De los trece escenarios, ¿cuántos separa un taller SIN osciloscopio en este motor?',
    ops:[[num(techoT,0)+' de 13',true],[num(techo,0)+' de 13',false],['los trece, con paciencia',false]],
    ex:'Se prueban los 8 191 subconjuntos y se cuenta. Con osciloscopio se llega a '+num(techo,0)+' de 13'+
       (MUDOS().length?', y lo que queda fuera no es falta de instrumento: es una avería que en este motor no cambia nada.':'.')
  });
  return Q;
}
let QI=0, QSEL=null, QCACHE=null;
// El barajado tiene que sobrevivir al repintado: si se rebarajase en cada clic,
// la explicación saldría al lado de una opción distinta de la que se pulsó. Por
// eso las preguntas se cachean enteras, con su baraja dentro, y sólo se tiran
// cuando cambia algo que cambia sus cifras.
function bancoQ(){ if(!QCACHE){ QCACHE=preguntas();
  QCACHE.forEach(q=>{ q.baraja=barajaEn(q.ops.map(o=>({o}))); }); } return QCACHE; }
function refrescaPregunta(){ QCACHE=null; QI=0; QSEL=null; pintaPregunta(); }
function pintaPregunta(){
  const Q=bancoQ(); if(!Q.length) return;
  QI=QI%Q.length;
  const q=Q[QI];
  el('q_text').innerHTML='<b>'+(QI+1)+'/'+Q.length+'</b> · '+q.t+
    (QSEL!==null?'<br><br>'+(q.baraja[QSEL].o[1]?'<b class="good">Correcto.</b> ':'<b class="bad">No.</b> ')+q.ex:'');
  el('dxbtns').innerHTML=q.baraja.map((b,i)=>
    '<button class="b'+(QSEL===i&&b.o[1]?' on':'')+'" data-q="'+i+'">'+b.o[0]+'</button>').join('')+
    (QSEL!==null?'<button class="b primary" data-q="next">Siguiente ▸</button>':'');
}
function pregunta(i){
  const Q=bancoQ();
  if(i==='next'){ QI=(QI+1)%Q.length; QSEL=null; pintaPregunta(); return; }
  QSEL=+i;
  synth.beep(Q[QI%Q.length].baraja[QSEL].o[1]?820:240,0.07,0.05);
  pintaPregunta();
}

// ------------------------------------------------------------ recorrido guiado
let AUTO=null;
function paraAuto(){ if(AUTO){ clearTimeout(AUTO); AUTO=null; } el('btnAuto').disabled=false; }
function runAuto(){
  if(AUTO) return;
  el('btnAuto').disabled=true;
  const pasos=[
    ()=>{ G.maq='g16'; G.esc='sano'; G.rpm=ARQ.g16.ralenti; G.acel=0.30; G.canal='ckp';
      construyeBanco(); setMode('sensores');
      showToast('Primero, la referencia: las seis señales de un motor <b>sano</b> a ralentí.',3400); },
    ()=>{ setMode('rueda');
      showToast('La rueda de <b>60−2</b>: el hueco abre una razón de 3 y el umbral está en 2,5.',3400); },
    ()=>{ G.esc='dienteRoto'; afterEdit();
      showToast('Un <b>diente roto</b> abre una razón de 2: no llega al umbral, así que la centralita sigue sincronizando.',4200); },
    ()=>{ G.maq='g20'; cambiaMaquina('g20'); G.esc='dienteRoto'; afterEdit();
      showToast('El MISMO diente roto en una rueda de <b>36−1</b>: aquí el hueco también vale 2 y el coche <b>no arranca</b>.',4600); },
    ()=>{ cambiaMaquina('g16'); G.esc='entrehierro'; G.rpm=RPM_ARRANQUE; afterEdit(); setMode('rueda');
      showToast('Entrehierro grande: con el <b>motor de arranque</b> la señal no llega al umbral.',3800); },
    ()=>{ G.rpm=ARQ.g16.ralenti; afterEdit();
      showToast('Y a <b>ralentí</b> la misma avería pasa el umbral de sobra: gira y no arranca, pero arrancado funciona.',4400); },
    ()=>{ G.esc='cmpDesfasado'; afterEdit(); setMode('sincro');
      showToast('Correa saltada un diente: <b>18°</b> de cigüeñal, y sólo se miden con dos canales.',3800); },
    ()=>{ G.esc='alimBaja'; afterEdit(); setMode('tension');
      showToast('Alimentación caída: los tres sensores <b>multiplicados</b> por el mismo factor.',3600); },
    ()=>{ G.esc='masaAlta'; afterEdit();
      showToast('Masa con resistencia: los tres sensores <b>sumados</b> lo mismo. Hacen falta los dos extremos del recorrido.',4400); },
    ()=>{ G.esc='inyPegado'; afterEdit(); setMode('inyector');
      showToast('Aguja pegajosa: la <b>joroba de cierre</b> se retrasa y ningún dato del escáner la contiene.',4200); },
    ()=>{ G.esc='tpsPista'; G.barrido=0.30; afterEdit(); setMode('caza');
      showToast('Pista gastada: en un pisotón el escáner lo caza el <b>15 %</b> de las veces.',3800); },
    ()=>{ G.barrido=5.0; afterEdit();
      showToast('Barriendo despacio, el <b>mismo</b> escáner lo caza siempre. No cuesta nada.',3800); },
    ()=>{ setMode('censo');
      showToast('Y el censo lo cierra: con lo que hay en cualquier taller no se pasa de <b>9 de 13</b>.',4200); },
    ()=>{ paraAuto(); showToast('Fin del recorrido. Ahora el <b>diagnóstico a ciegas</b>.',3000); },
  ];
  let i=0;
  const tic=()=>{ if(i>=pasos.length){ paraAuto(); return; } pasos[i++](); AUTO=setTimeout(tic,2600); };
  tic();
}

// ---------------------------------------------------------------- despachador
// Un solo escuchador delegado. NUNCA hay onclick en el HTML generado: un
// atributo onclick dentro de un módulo busca la función en el ámbito global, y
// dentro de un <script type="module"> no está.
document.addEventListener('click',ev=>{
  const t=ev.target.closest('button'); if(!t) return;
  const id=t.id||'';
  if(id.startsWith('m_')){ paraAuto(); setMode(id.slice(2)); return; }
  if(id==='btnAuto'){ runAuto(); return; }
  if(id==='btnNew'){ paraAuto();
    if(G.modo==='reto'){ armaReto(); afterEdit(); refrescaPregunta(); }
    else { const cs=RETO_CASOS(); G.esc=cs[Math.floor(Math.random()*cs.length)]; afterEdit(); refrescaPregunta(); }
    return; }
  if(id==='btnPista'){ pistaReto(); return; }
  if(id==='btnCheck'){ entregaReto(); return; }
  const d=t.dataset;
  if(d.maq){ paraAuto(); cambiaMaquina(d.maq); return; }
  if(d.esc){ paraAuto(); G.esc=d.esc; G.resuelto=false; afterEdit(); refrescaPregunta(); return; }
  if(d.rpm){ paraAuto(); G.rpm=+d.rpm; afterEdit(); refrescaPregunta(); return; }
  if(d.acel){ paraAuto(); G.acel=+d.acel; afterEdit(); refrescaPregunta(); return; }
  if(d.canal){ paraAuto(); G.canal=d.canal; afterEdit(); return; }
  if(d.barr){ paraAuto(); G.barrido=+d.barr; afterEdit(); refrescaPregunta(); return; }
  if(d.obs){ mide(d.obs); return; }
  if(d.fam){ RETO.eleccion=d.fam; pintaDxReto(); pintaReto(); return; }
  if(d.q!==undefined){ pregunta(d.q); return; }
});
addEventListener('keydown',ev=>{
  const i=+ev.key;
  if(i>=1&&i<=MODES.length){ paraAuto(); setMode(MODES[i-1]); }
});

// ------------------------------------------------------------------- depuración
// Todo lo que la Capa 2 comprueba sale de aquí, y sale del MOTOR SELLADO: si la
// pantalla y este objeto pudieran discrepar, la Capa 2 no estaría comprobando la
// pantalla.
window.__labDebug={
  get mode(){ return G.modo; },
  get solved(){ return G.resuelto; },
  get maquina(){ return G.maq; },
  get esc(){ return G.esc; },
  get rpm(){ return G.rpm; },
  get acel(){ return G.acel; },
  get canal(){ return G.canal; },
  get barrido(){ return G.barrido; },
  get frames(){ return PINTADAS; },
  get cabecera(){ return cabMaquina()+' | '+cabPunto(); },
  get maq(){ const e=MQ(); return {key:e.key, corto:e.corto, nCil:e.nCil, ralenti:e.ralenti,
    dientes:e.dientes, faltan:e.faltan, dienteHueco:e.dienteHueco, tipoCkp:e.tipoCkp,
    umbralCkp:e.umbralCkp, umbralRazon:e.umbralRazon, entrehierro:e.entrehierro,
    entrehierroMax:e.entrehierroMax, dientesArbol:e.dientesArbol, faseCmpNominal:e.faseCmpNominal,
    gradosDiente:gradosPorDienteArbol(e), paso:pasoDiente(e),
    tpsMin:e.tpsMin, tpsMax:e.tpsMax, mapRizado:e.mapRizado, gastoMax:e.gastoMax,
    inyR:e.inyR, inyL:e.inyL, inyCierre:e.inyCierre}; },
  get lect(){ const L=LECT(); return {esc:L.esc, rot:L.rot, clave:L.clave, falla:L.falla,
    arranca:L.arranca, sostiene:L.sostiene, sincroniza:L.sincroniza,
    huecos:L.huecos, razonMax:L.razonMax, razonSegunda:L.razonSegunda,
    pulsos:L.pulsos, pulsosSano:L.pulsosSano, falsos:L.falsos, ruidoV:L.ruidoV,
    entrehierro:L.entrehierro, desfase:L.desfase, hayCmp:L.hayCmp,
    tCierre:L.tCierre, tCierreSano:L.tCierreSano, vTpsAbre:L.vTpsAbre,
    anchoHueco:L.anchoHueco, offset:L.offset, vAlim:L.vAlim, codigos:L.codigos.slice(),
    pPisoton:L.pPisoton, pBarridoLento:L.pBarridoLento, repPisoton:L.repPisoton,
    pts:L.pts.map(p=>({k:p.k, rpm:p.rpm, acel:p.acel, ampCkp:p.ampCkp, pasa:p.pasa,
      vTps:p.vTps, vMap:p.vMap, vMaf:p.vMaf, rizado:p.rizado, fRizado:p.fRizado}))}; },
  // El punto de trabajo que se está mirando, que NO es ninguno de los tres del
  // protocolo: es el de los mandos.
  get punto(){ const e=MQ(), F=FA(), r=rpmVista(); return {
    rpm:r, acel:G.acel,
    ampCkp:ampCkp(e,r,F), pasa:pasaUmbral(e,r,F),
    vTps:vTps(e,G.acel,F), vMap:vMap(e,r,G.acel,F), vMaf:vMaf(e,r,G.acel,F),
    presion:presionColector(e,r,G.acel), gasto:gastoAire(e,r,G.acel),
    rizado:rizadoMap(e,G.acel,F), fRizado:fAspiracion(e,r)}; },
  get iny(){ const O=INY(); return {tau:O.tau, iFin:O.iFin, iCorte:O.iCorte,
    tCierre:O.tCierre, tOrden:O.tOrden, dur:O.dur, vBat:O.vBat, n:O.pts.length}; },
  get caza(){ const C=veredictoCaza(); return {hay:C.hay, ancho:C.ancho, tau:C.tau,
    pE:C.pE, pO:C.pO, repE:C.repE, repO:C.repO, tSeguro:C.tSeguro}; },
  get censo(){ const C=CENSO(), N=ESCEN_KEYS.length;
    const soloT=C.filter(c=>c.sub.every(s=>s.taller));
    const techoT=Math.max(...soloT.map(c=>c.resueltos));
    const cortoT=soloT.filter(c=>c.resueltos===techoT).sort((a,b)=>a.sub.length-b.sub.length)[0];
    const todoT=soloT.find(c=>c.sub.length===OBS_TALLER.length);
    const min=C.filter(c=>c.resueltos===C[0].resueltos).sort((a,b)=>a.sub.length-b.sub.length)[0];
    const todo=C.find(c=>c.sub.length===OBS.length);
    return {N, techo:C[0].resueltos, techoTaller:techoT, todoTaller:todoT.resueltos,
      cortoTallerTam:cortoT.sub.length, minTam:min.sub.length, minObs:min.sub.map(o=>o.k),
      todo:todo.resueltos, mudos:MUDOS().slice(), reto:RETO_CASOS().slice()}; },
  get veredicto(){ const V=veredicto(), E=veredictoEngano(); return {
    arranca:V.arranca, sostiene:V.sostiene, sincroniza:V.sincroniza,
    debilArranque:V.debilArranque, faltanPulsos:V.faltanPulsos, hayFalsos:V.hayFalsos,
    hayRuido:V.hayRuido, desfasado:V.desfasado, sinCmp:V.sinCmp, huecoPista:V.huecoPista,
    escala:V.escala, cero:V.cero, cierreTarde:V.cierreTarde, malo:V.malo,
    gemelos:E.gemelos.slice(), separan:E.separan.map(m=>m.k), mudos:E.mudos.slice(),
    limpio:E.limpio, ciego:E.ciego, nivel:E.nivel}; },
  get reto(){ return {caso:RETO.caso, eleccion:RETO.eleccion,
    tomadas:Object.keys(RETO.tomadas), veredicto:RETO.veredicto?RETO.veredicto.ok:null,
    familias:FAMILIAS_RETO().slice()}; },
  get preguntas(){ return preguntas().map(q=>({t:q.t, n:q.ops.length,
    correctas:q.ops.filter(o=>o[1]).length})); },
  get texto(){ return el('report').textContent+' || '+el('tele').textContent; },
  get autoRunning(){ return AUTO!==null; },
  setMaquina(k){ cambiaMaquina(k); },
  setEsc(k){ G.esc=k; G.resuelto=false; afterEdit(); refrescaPregunta(); },
  setRpm(r){ G.rpm=r; afterEdit(); },
  setAcel(a){ G.acel=a; afterEdit(); },
  setCanal(c){ G.canal=c; afterEdit(); },
  setBarrido(b){ G.barrido=b; afterEdit(); },
  setMode(m){ setMode(m); },
  mide(k){ mide(k); },
  eligeFam(f){ RETO.eleccion=f; pintaDxReto(); pintaReto(); },
  entrega(){ entregaReto(); },
  obs(k){ return valorObs(k); },
  firma(sub){ return firmaObs(MQ(),LECT(),OBS.filter(o=>sub.includes(o.k))); },
  serie(k){ const s=serieCanal(k); return {n:s.pts.length, x0:s.x0, x1:s.x1,
    y0:Math.min(...s.pts.map(p=>p[1])), y1:Math.max(...s.pts.map(p=>p[1]))}; },
};

// ------------------------------------------------------------------- arranque
construyeBanco();
pintaHUD(); afterEdit(); refrescaPregunta();
S.setAnimate(dt=>pinta3D(dt));
S.start();
{ const t=camConjunto(MARGEN.sensores); S.moveTo(t[0],t[1],0.01); }
addEventListener('resize',()=>S.resize());
