/* ============================================================
   LAB — ENFRIAMIENTO: BALANCE TÉRMICO, TERMOSTATO Y MARGEN
   (Dominio D6 · motor de combustión interna · práctica d6-06)

   Qué se monta y qué se mide
     · Se arma el circuito de refrigeración pieza a pieza: bomba de agua,
       carcasa del termostato, radiador, electroventilador, tapón de presión
       con su depósito de expansión, radiador de calefacción y el sensor que
       mueve la aguja del tablero.
     · Se elige la mezcla de agua y glicol, la plaza —del nivel del mar a
       Toluca—, la temperatura ambiente y el punto de trabajo.
     · Se mide el calor que hay que sacar, el que sale por el radiador, el
       salto de temperatura del motor y el del radiador, y lo que de verdad
       importa: cuánto le falta al refrigerante para hervir.

   La tesis de la práctica
     El indicador del tablero NO mide la refrigeración. Mide la temperatura
     de salida del bloque, que el termostato clava en su tarado mientras
     pueda. Por eso la aguja está quieta en un abanico enorme de puntos de
     trabajo con márgenes completamente distintos. Lo que sí mide el margen
     es el ciclo de trabajo del ventilador y el salto del radiador, y ninguna
     de las dos cosas se ve desde el asiento del conductor.

   Fuentes de referencia
     · Ecuación de Clausius-Clapeyron para la temperatura de ebullición del
       agua contra la presión absoluta del circuito.
     · Atmósfera estándar ISA para la presión y la densidad del aire según
       la altitud de la plaza.
     · Tabla publicada de etilenglicol y agua para el punto de congelación,
       con su eutéctico cerca del 60 % en volumen.
     · Método ε-NTU para cambiadores de flujo cruzado sin mezcla (Kays y
       London; Incropera y DeWitt) en el radiador y en el calefactor.
     · Correlación de Heywood para la presión media de rozamiento.
     · Manual de taller del fabricante — única fuente del termostato, del
       tapón y de la mezcla que le corresponden a UN motor concreto. Los
       cuatro motores de este banco NO son comerciales.

   Modelo de ingeniería
     · El calor al refrigerante sale de la potencia de COMBUSTIBLE por la
       línea de Willans, no de un porcentaje de la potencia al freno: a
       ralentí la potencia al freno es cero y el motor sigue calentándose.
     · Bomba centrífuga por leyes de semejanza contra una resistencia que va
       con el cuadrado del caudal; el termostato reparte ese caudal entre el
       radiador y la derivación.
     · Equilibrio por bisección sobre la temperatura de salida del bloque,
       con el calor generado DENTRO de la bisección porque el motor frío roza
       más.
     · El ventilador es un interruptor: cuando el equilibrio cae en su
       temperatura de arranque, el balance cierra en PROMEDIO y lo que sale
       es su ciclo de trabajo.
   ============================================================ */
const mount=document.getElementById('stage');
// La cámara de arranque es la misma que calcula el modo de montaje para el 1.6:
// si fueran distintas, la página abriría en un encuadre y saltaría a otro en
// cuanto se tocara el primer botón.
const S=createStage(mount,{cam:[5.3,4.4,7.5],target:[0.5,1.95,0.30],bgTop:'#0e1a20',bgBot:'#05070a',bloom:0.24,minD:2.2,maxD:34});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:820,Q:0.75});
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
//  d6-06 · MOTOR SELLADO — BALANCE TERMICO DEL SISTEMA DE ENFRIAMIENTO
//
//  Todo lo que el laboratorio publica sale de aqui. Este archivo NO dibuja, no
//  toca el DOM y no sabe que existe una pantalla: se puede correr en Node y
//  comprobar numero a numero, que es justo lo que hace test_enfr.mjs.
//
//  Cadena fisica, en el orden en que se resuelve:
//
//    1. Del punto de trabajo (regimen y par pedido) sale la potencia de
//       combustible, y de ella el calor que va al refrigerante.
//    2. La bomba centrifuga y la resistencia del circuito dan el caudal; el
//       termostato reparte ese caudal entre el radiador y la derivacion.
//    3. El radiador —metodo epsilon-NTU, flujo cruzado sin mezcla— y el
//       calefactor disipan; el equilibrio se busca por biseccion sobre la
//       temperatura de salida del bloque.
//    4. La presion del circuito y la mezcla fijan la temperatura de ebullicion,
//       y de ahi el margen que le queda al motor.
//
//  HONESTIDAD. Las cuatro maquinas son ARQUETIPOS declarados: sus cotas caen
//  dentro de las bandas publicadas para su familia, pero ningun motor real
//  tiene estos numeros. El termostato de un motor concreto, su tapon y su
//  mezcla estan en su manual de taller y en ningun otro sitio.
// ============================================================================

const DEG = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const K = c => c + 273.15;

// ============================================================================
//  1 · EL REFRIGERANTE
//
//  Mezcla de agua y etilenglicol. Las tres propiedades que importan tiran en
//  sentidos CONTRARIOS y por eso hay un optimo y no una regla:
//
//    · el agua pura es la que mas calor se lleva por litro,
//    · el glicol sube la temperatura de ebullicion y baja la de congelacion,
//    · y el glicol empeora la transferencia en el propio radiador.
//
//  Ademas la curva de congelacion NO es monotona: tiene un minimo cerca del
//  60 % en volumen —el eutectico— y a partir de ahi vuelve a subir, hasta los
//  -13 C del glicol puro. Poner mas glicol del debido protege MENOS del frio y
//  enfria PEOR.
// ============================================================================

// Punto de congelacion. Tabla DECLARADA (datos publicados de etilenglicol y
// agua), interpolada linealmente. El minimo de la tabla es el eutectico.
const TABLA_CONG = [
  [0, 0], [10, -3.4], [20, -8.9], [30, -15.6], [40, -24.4], [50, -36.8],
  [60, -51.1], [70, -48.3], [80, -38.9], [90, -28.9], [100, -12.7],
];
function congelacion(g) {
  const t = TABLA_CONG;
  if (g <= t[0][0]) return t[0][1];
  if (g >= t[t.length - 1][0]) return t[t.length - 1][1];
  for (let i = 1; i < t.length; i++) {
    if (g <= t[i][0]) {
      const [x0, y0] = t[i - 1], [x1, y1] = t[i];
      return y0 + (y1 - y0) * (g - x0) / (x1 - x0);
    }
  }
  return t[t.length - 1][1];
}
// El eutectico: el porcentaje de la tabla con el punto de congelacion mas bajo.
const G_EUTECTICO = TABLA_CONG.reduce((a, b) => (b[1] < a[1] ? b : a))[0];

// Densidad y calor especifico a 90 C. Ajustes lineales DECLARADOS sobre los
// valores publicados de la mezcla; fuera de 0-70 % no se usan.
const rhoRef = g => 965 + 1.42 * g;              // kg/m3
const cpRef = g => 4.205 - 0.0155 * g;           // kJ/kg K
// Capacidad calorifica por unidad de VOLUMEN, en MJ por m3 y kelvin: es la
// cifra que decide cuanto calor se lleva cada litro que mueve la bomba.
const rhoCp = g => rhoRef(g) * cpRef(g) / 1000;

// Factor de transferencia en el lado del refrigerante, referido al agua pura.
// Empirico y DECLARADO: recoge de una vez la caida de conductividad, la subida
// de viscosidad y el cambio de Prandtl de la mezcla.
const fTrans = g => 1 - 0.0045 * g;

// Temperatura de ebullicion del agua por Clausius-Clapeyron, con el calor
// latente tomado constante; el glicol la sube 0,155 C por cada 1 % en volumen.
const R_VAP = 0.4615, H_VAP = 2257;   // kJ/kg K y kJ/kg
function ebullicionAgua(pAbsBar) {
  const inv = 1 / K(100) - (R_VAP / H_VAP) * Math.log(pAbsBar / 1.01325);
  return 1 / inv - 273.15;
}
const ebullicion = (pAbsBar, g) => ebullicionAgua(pAbsBar) + 0.155 * g;

const MEZCLAS = [
  { key: 'm0',  g: 0,  rot: 'Agua pura', corto: 'agua',
    nota: 'La que mas calor se lleva por litro y la que peor protege: se congela a 0 °C, hierve la primera y se lleva por delante el aluminio del motor.' },
  { key: 'm30', g: 30, rot: '30 % de glicol', corto: '30 %',
    nota: 'Protección de frío corta para casi todo México con heladas. Enfría bien.' },
  { key: 'm40', g: 40, rot: '40 % de glicol', corto: '40 %',
    nota: 'El mínimo razonable en clima templado: ya lleva inhibidores suficientes.' },
  { key: 'm50', g: 50, rot: '50 % de glicol', corto: '50 %',
    nota: 'La mezcla de catálogo: el compromiso que recomienda casi todo fabricante.' },
  { key: 'm60', g: 60, rot: '60 % de glicol', corto: '60 %',
    nota: 'El eutéctico: la protección de frío más baja que se puede conseguir. Enfría peor que el 50 %.' },
  { key: 'm70', g: 70, rot: '70 % de glicol', corto: '70 %',
    nota: 'Pasado el eutéctico: protege del frío MENOS que el 60 % y encima transporta y transfiere menos calor. Más no es mejor.' },
];
const MEZCLA_KEYS = MEZCLAS.map(m => m.key);
const MEZ = Object.fromEntries(MEZCLAS.map(m => [m.key, m]));

// ============================================================================
//  2 · LA ATMOSFERA
//
//  En Mexico la altitud NO es un detalle: en el Valle de Toluca la presion
//  atmosferica es tres cuartas partes de la del mar. Eso baja la temperatura de
//  ebullicion del refrigerante casi diez grados Y adelgaza el aire que entra al
//  radiador. El mismo motor, la misma mezcla y el mismo tapon dan margenes
//  distintos segun donde se conduzca.
// ============================================================================

// Atmosfera estandar ISA hasta la troposfera.
const presionAtm = alt => 1.01325 * Math.pow(1 - 2.25577e-5 * alt, 5.25588);
const rhoAire = (alt, Tamb) => presionAtm(alt) * 1e5 / (287.05 * K(Tamb));

const PLAZAS = [
  { key: 'mar', rot: 'Nivel del mar', corto: 'mar', alt: 0 },
  { key: 'gdl', rot: 'Guadalajara', corto: 'GDL', alt: 1566 },
  { key: 'cdmx', rot: 'Ciudad de México', corto: 'CDMX', alt: 2240 },
  { key: 'tol', rot: 'Toluca', corto: 'Toluca', alt: 2660 },
];
const PLAZA_KEYS = PLAZAS.map(p => p.key);
const PLZ = Object.fromEntries(PLAZAS.map(p => [p.key, p]));

// ============================================================================
//  3 · EL CALOR QUE HAY QUE SACAR
//
//  No se saca de un porcentaje de la potencia al freno —a ralenti la potencia
//  al freno es cero y el motor sigue calentandose—, sino de la potencia de
//  COMBUSTIBLE, que se reconstruye por la linea de Willans: lo que entra es lo
//  que sale por el ciguenal mas lo que se pierde en rozamiento y bombeo.
// ============================================================================

// Presion media de rozamiento (Heywood, en bar) mas el bombeo, que a carga
// parcial es grande porque la mariposa estrangula. Los dos terminos declarados.
const fmepBar = rpm => 0.97 + 0.15 * (rpm / 1000) + 0.05 * Math.pow(rpm / 1000, 2);
const pmepBar = carga => 0.55 * (1 - 0.85 * clamp(carga, 0, 1));

function parMax(e, rpm) {
  // Parabola con el maximo en su regimen de par; nunca negativa. La ANCHURA es
  // de cada maquina: un diesel tiene la curva mucho mas plana que un gasolina y
  // con la anchura del gasolina su potencia caia antes de las 4 000 rpm.
  const x = rpm / e.rpmPar;
  return Math.max(0, e.parPico * (1 - (e.anchoPar === undefined ? 0.42 : e.anchoPar) * Math.pow(x - 1, 2)));
}
const potEje = (e, rpm, carga) =>
  clamp(carga, 0, 1) * parMax(e, rpm) * rpm * 2 * Math.PI / 60 / 1000;   // kW

// El motor frio roza MUCHO mas: el aceite esta espeso y los juegos son otros.
// Es la razon de que un motor recien arrancado caliente deprisa —y de que
// caliente mucho antes conduciendo que a ralenti—. Factor DECLARADO, referido a
// la temperatura del refrigerante y acotado.
const factorFricFrio = T => clamp(1 + 1.6 * Math.exp(-(T - 20) / 28), 1, 3);
const potRoz = (e, rpm, carga, T) =>
  (fmepBar(rpm) + pmepBar(carga)) * 1e5 * (e.cil / 1e6) * (rpm / 60) / 2 / 1000
  * factorFricFrio(T === undefined ? 90 : T);  // kW
const potCombustible = (e, rpm, carga, T) =>
  (potEje(e, rpm, carga) + potRoz(e, rpm, carga, T)) / e.etaInd;

// Reparto DECLARADO: una fraccion de la potencia de combustible se va al
// refrigerante por las paredes de la camara, y la mayor parte del rozamiento
// acaba tambien en el refrigerante a traves del aceite y de las camisas.
const F_COMB_REF = 0.26, F_ROZ_REF = 0.60;
function calorRefrigerante(e, rpm, carga, T) {
  return F_COMB_REF * potCombustible(e, rpm, carga, T) * e.kCalor +
         F_ROZ_REF * potRoz(e, rpm, carga, T);
}

// ============================================================================
//  4 · EL CIRCUITO: BOMBA, TERMOSTATO Y REPARTO DE CAUDAL
//
//  Bomba centrifuga: por las leyes de semejanza su altura va con el cuadrado
//  del regimen y su perdida interna con el cuadrado del caudal. Contra un
//  circuito cuya perdida tambien va con el cuadrado del caudal, el caudal sale
//  proporcional al regimen y dividido por la raiz de la resistencia total.
//
//  El termostato es una VALVULA, no un interruptor: entre su temperatura de
//  apertura y unos quince grados mas va abriendo, y lo que hace es repartir el
//  caudal entre el radiador y la derivacion que vuelve directa al bloque.
// ============================================================================

// Fraccion de apertura del termostato. Con la avaria de aire, el elemento de
// cera no toca liquido y abre tarde: se le suma un desfase a su temperatura.
function aperturaTermostato(e, T, F) {
  if (F.terFijo === 'abierto') return 1;
  if (F.terFijo === 'cerrado') return 0;
  const Ta = e.tTermo + (F.terOffset || 0);
  return clamp((T - Ta) / e.bandaTermo, 0, 1);
}

// Resistencias hidraulicas (bar por (L/s)^2). Dos ramas en paralelo —radiador y
// derivacion— mas, si esta abierta, la del calefactor.
const K_INF = 1e9;
function resistencias(e, x, F, calefactor) {
  const kRad = (e.kRad / (F.kRadMul || 1)) + (x <= 1e-6 ? K_INF : e.kTermo / (x * x));
  const kBy = e.kBypass;
  const kCal = calefactor ? e.kCalef : K_INF;
  const invR = 1 / Math.sqrt(kRad) + 1 / Math.sqrt(kBy) + 1 / Math.sqrt(kCal);
  const kPar = 1 / (invR * invR);
  return { kRad, kBy, kCal, kPar, kTot: e.kBloque + kPar };
}

// Caudal total y su reparto. kBomba recoge las averias de la bomba y de la
// correa; el aire y el nivel bajo se llevan una parte del caudal util.
function caudales(e, rpm, x, F, calefactor) {
  const R = resistencias(e, x, F, calefactor);
  const nBomba = rpm * e.relBomba * (F.correaMul || 1);
  const a = e.aBomba * (F.bombaMul || 1);
  const Qtot = nBomba * Math.sqrt(a / (e.bBomba + R.kTot)) * (F.caudalMul || 1);
  const w = f => 1 / Math.sqrt(f);
  const wR = w(R.kRad), wB = w(R.kBy), wC = w(R.kCal), wS = wR + wB + wC;
  return { Qtot, Qrad: Qtot * wR / wS, Qby: Qtot * wB / wS, Qcal: Qtot * wC / wS, R };
}

// ============================================================================
//  5 · EL RADIADOR: EPSILON-NTU EN FLUJO CRUZADO
//
//  Un radiador no tiene "capacidad de disipacion" fija: disipa lo que le dejan
//  los dos caudales y el salto de temperatura contra el aire. Se resuelve con
//  el metodo de la eficacia, que es el que se usa cuando de un cambiador se
//  conocen los caudales y una sola temperatura de entrada.
// ============================================================================

const CP_AIRE = 1.006;   // kJ/kg K

// Velocidad del aire que atraviesa el frontal. El ventilador y la marcha NO se
// suman: manda el que mas empuja, y por eso el ventilador solo cuenta despacio.
// Con el coche parado y el ventilador quieto por el radiador sigue subiendo un
// hilo de aire por conveccion natural: poco, pero no cero. Se declara, porque
// de el depende hasta donde se va el motor cuando el ventilador no arranca.
const V_NATURAL = 0.05;
function velocidadAire(e, vKmh, ventiladorGira) {
  const vRam = e.kRam * vKmh / 3.6;
  return Math.max(V_NATURAL, vRam, ventiladorGira ? e.vVenti : 0);
}
function flujoAire(e, alt, Tamb, vKmh, ventiladorGira, F) {
  const v = velocidadAire(e, vKmh, ventiladorGira);
  return rhoAire(alt, Tamb) * e.areaFrontal * v * (F.aireMul || 1);
}

// Conductancia global. Los dos lados en serie, cada uno con su ley de caudal:
// el interior turbulento va con m^0.8 y el exterior por las aletas con m^0.65.
function UAradiador(e, mRef, mAire, g, F) {
  if (mRef <= 1e-9 || mAire <= 1e-9) return 0;
  const hRef = e.hRef0 * Math.pow(mRef / e.mRef0, 0.80) * fTrans(g) * (F.hRefMul || 1);
  const hAir = e.hAir0 * Math.pow(mAire / e.mAire0, 0.65) * (F.hAirMul || 1);
  return 1 / (1 / hRef + 1 / hAir);
}

// Eficacia de un cambiador de flujo cruzado con los dos fluidos sin mezclar.
function epsilonCruzado(NTU, Cr) {
  if (NTU <= 0) return 0;
  if (Cr <= 1e-9) return 1 - Math.exp(-NTU);
  const e = 1 - Math.exp((Math.pow(NTU, 0.22) / Cr) * (Math.exp(-Cr * Math.pow(NTU, 0.78)) - 1));
  return clamp(e, 0, 1);
}
function intercambiador(UA, Cc, Ca, Tcal, Tfrio) {
  if (UA <= 0 || Cc <= 1e-9 || Ca <= 1e-9) return { Q: 0, eps: 0, NTU: 0, Cmin: 0 };
  const Cmin = Math.min(Cc, Ca), Cmax = Math.max(Cc, Ca);
  const NTU = UA / Cmin, Cr = Cmin / Cmax;
  const eps = epsilonCruzado(NTU, Cr);
  return { Q: eps * Cmin * (Tcal - Tfrio), eps, NTU, Cmin };
}

// ============================================================================
//  6 · LAS AVERIAS
//
//  Cada averia se declara por lo que CAMBIA fisicamente, nunca por el sintoma
//  que produce. El sintoma lo tiene que sacar el modelo; si se escribiera a
//  mano, el laboratorio no estaria simulando nada.
// ============================================================================

const FALLAS = {
  sano: { rot: 'Sin avería',
    nota: 'El termostato regula, la bomba entrega lo suyo y el radiador está limpio por dentro y por fuera.' },
  terCerrado: { terFijo: 'cerrado', rot: 'Termostato agarrotado cerrado',
    nota: 'El radiador nunca recibe caudal: todo el refrigerante da vueltas por la derivación. El motor se calienta hasta que hierve y el radiador está FRÍO.' },
  terAbierto: { terFijo: 'abierto', rot: 'Termostato agarrotado abierto',
    nota: 'No recalienta: el motor nunca llega a su temperatura de servicio. Se paga en consumo, en desgaste y en que la calefacción no calienta.' },
  terTardio: { terOffset: 12, rot: 'Termostato de temperatura equivocada',
    nota: 'Abre doce grados tarde. Con el motor descargado no se nota; con carga, el margen que queda hasta la ebullición se lo come él.' },
  radInterno: { hRefMul: 0.57, rot: 'Radiador incrustado por dentro',
    nota: 'La cal y los restos de sellador tapan los tubos: el lado del refrigerante deja de transferir. El salto de temperatura del radiador se hunde.' },
  radExterno: { aireMul: 0.58, rot: 'Radiador tapado por fuera',
    nota: 'Insectos, hojas y barro entre las aletas. El aire no pasa; a velocidad de carretera es donde más se nota.' },
  ventilador: { sinVenti: true, rot: 'Ventilador que no arranca',
    nota: 'A ralentí y en el tráfico no hay aire que atraviese el radiador. En carretera no se nota NADA.' },
  bomba: { bombaMul: 0.30, rot: 'Bomba de agua con el impulsor comido',
    nota: 'El impulsor erosionado mueve menos caudal. Como el calor es el mismo, el salto de temperatura del motor se dispara.' },
  correa: { correaMul: 0.55, rot: 'Correa floja: la bomba patina',
    nota: 'La bomba gira más despacio que el motor. Igual que el impulsor comido, pero además se lleva por delante al alternador.' },
  tapon: { taponMul: 0.15, rot: 'Tapón de presión que no aguanta',
    nota: 'El circuito trabaja casi a la presión de la calle. La temperatura no sube ni un grado por eso, pero el margen hasta la ebullición se desploma.' },
  aire: { caudalMul: 0.72, terOffset: 9, hRefMul: 0.80, rot: 'Aire en el circuito',
    nota: 'Una burbuja en la carcasa del termostato: el elemento de cera no toca líquido y abre tarde, y el aire además roba caudal y transferencia.' },
  junta: { qExtra: 3.4, hRefMul: 0.86, gases: true, rot: 'Junta de culata: gases al refrigerante',
    nota: 'Los gases de la combustión entran al circuito: meten calor donde no toca y las burbujas estropean la transferencia. El tapón purga la presión de más, así que el comprobador no lo delata: lo delata el detector de gases.' },
  aguaSola: { rot: 'Agua sola en el circuito', nota: 'Refrigera de maravilla y protege de nada: se congela a 0 °C y hierve la primera.' },
  glicolAlto: { rot: 'Demasiado glicol', nota: 'Pasado el eutéctico protege del frío menos que el 60 % y transporta menos calor.' },
};
const FALLA_KEYS = Object.keys(FALLAS);

// La presion que sostiene el circuito. El tapon es una valvula: aguanta hasta
// su tarado y a partir de ahi purga. Si la junta mete gases, el tapon purga
// continuamente y la presion se queda EN el tarado.
function presionCircuito(e, F) {
  const tarado = e.pTapon * (F.taponMul === undefined ? 1 : F.taponMul);
  // El tapon es una valvula de alivio: el circuito se queda EN su tarado pase lo
  // que pase por encima. Por eso una junta de culata que mete gases no mueve el
  // comprobador de presion —purga por el tapon— y hay que buscarla con el
  // detector de gases y no con el manometro.
  return { tarado, rel: tarado, purga: !!F.gases };
}

// ============================================================================
//  7 · EL EQUILIBRIO
//
//  Con el motor caliente y a regimen constante, la temperatura de salida del
//  bloque es la que hace que lo disipado sea igual a lo generado. La funcion es
//  monotona creciente —a mas temperatura, mas salto contra el aire Y mas abre
//  el termostato— asi que se resuelve por biseccion y no hace falta iterar
//  puntos fijos que no siempre convergen.
// ============================================================================

function disipado(e, T, o) {
  const { alt, Tamb, vKmh, calefactor, Tcabina, g, F, rpm, forzarVenti } = o;
  const x = aperturaTermostato(e, T, F);
  const ventiladorGira = forzarVenti === undefined
    ? (!F.sinVenti && T >= e.tVentiOn) : (forzarVenti && !F.sinVenti);
  const C = caudales(e, rpm, x, F, calefactor);
  const rho = rhoRef(g) / 1000, cp = cpRef(g);          // kg/L y kJ/kg K
  const mRad = C.Qrad * rho, mCal = C.Qcal * rho, mTot = C.Qtot * rho;
  const mAire = flujoAire(e, alt, Tamb, vKmh, ventiladorGira, F);
  const UA = UAradiador(e, mRad, mAire, g, F);
  const rad = intercambiador(UA, mRad * cp, mAire * CP_AIRE, T, Tamb);
  // El calefactor es un radiador pequeno contra el aire de la cabina.
  const mAireCab = calefactor ? e.mAireCab : 0;
  const UAc = calefactor ? UAradiador({ ...e, hRef0: e.hRefCal, hAir0: e.hAirCal,
    mRef0: e.mRefCal, mAire0: e.mAireCab }, mCal, mAireCab, g, F) : 0;
  const cal = intercambiador(UAc, mCal * cp, mAireCab * CP_AIRE, T, Tcabina);
  // El bloque tambien pierde calor por su superficie, poco pero no cero.
  const bloque = e.uaBloque * (T - Tamb) / 1000;
  return { Q: rad.Q + cal.Q + bloque, rad, cal, bloque, x, ventiladorGira,
    C, mRad, mTot, mAire, UA };
}

function equilibrio(e, o = {}) {
  const mez = MEZ[o.mezcla || e.mezclaOEM], g = mez.g;
  const plaza = PLZ[o.plaza || 'mar'], alt = plaza.alt;
  const Tamb = o.Tamb === undefined ? 25 : o.Tamb;
  const rpm = o.rpm === undefined ? e.ralenti : o.rpm;
  const carga = o.carga === undefined ? 0 : clamp(o.carga, 0, 1);
  const vKmh = o.vKmh === undefined ? 0 : o.vKmh;
  const calefactor = !!o.calefactor;
  const Tcabina = o.Tcabina === undefined ? Tamb : o.Tcabina;
  const F = FALLAS[o.falla || 'sano'];

  const ctx = { alt, Tamb, vKmh, calefactor, Tcabina, g, F, rpm };
  // El calor generado tambien depende de la temperatura —el motor frio roza mas—
  // asi que entra DENTRO de la biseccion: el balance es Qgen(T) = Qdis(T) y las
  // dos ramas se mueven.
  const gen = T => calorRefrigerante(e, rpm, carga, T) + (F.qExtra || 0);

  // Biseccion sobre la temperatura de salida. El limite alto es generoso a
  // proposito: si el motor se va a 200 C hay que verlo, no recortarlo.
  const TECHO = 400;
  let lo = Tamb, hi = TECHO, mid = 0, converge = true;
  const f = T => disipado(e, T, ctx).Q - gen(T);
  if (f(lo) >= 0) mid = lo;
  else if (f(hi) < 0) {
    // NO CONVERGE. Con el termostato agarrotado cerrado el radiador queda fuera
    // del circuito y por la superficie del bloque no sale ni de lejos el calor
    // que entra: no hay ninguna temperatura por debajo del techo en la que el
    // balance cierre. Eso NO es un equilibrio a 400 C —el refrigerante hirvio
    // mucho antes y este modelo, que es de liquido, dejo de valer ahi—, asi que
    // se marca y se publica el techo tal cual en vez de disfrazarlo de solucion.
    mid = TECHO; converge = false;
  } else {
    for (let i = 0; i < 90; i++) {
      mid = (lo + hi) / 2;
      if (f(mid) < 0) lo = mid; else hi = mid;
    }
    mid = (lo + hi) / 2;
  }
  const Qgen = gen(mid);
  const rho = rhoRef(g) / 1000, cp = cpRef(g);
  const Tbruta = mid;
  // El ventilador es un INTERRUPTOR, no un mando continuo. Cuando el equilibrio
  // cae en su temperatura de arranque, lo que hace el motor de verdad no es
  // quedarse quieto ahi: es ciclar —arranca, enfria, para, se calienta— y el
  // balance cierra EN PROMEDIO, no en el instante. Ese promedio es el ciclo de
  // trabajo del ventilador, y es la mejor medida de margen que tiene el coche:
  // con la aguja clavada en el mismo sitio, un ventilador al 20 % y otro al 95 %
  // son dos motores en situaciones muy distintas.
  const ciclando = !F.sinVenti && Math.abs(Tbruta - e.tVentiOn) < 0.2;
  let D = disipado(e, mid, ctx), ciclo = 0;
  if (ciclando) {
    const Doff = disipado(e, mid, { ...ctx, forzarVenti: false });
    const Don = disipado(e, mid, { ...ctx, forzarVenti: true });
    ciclo = Don.Q > Doff.Q + 1e-9 ? clamp((Qgen - Doff.Q) / (Don.Q - Doff.Q), 0, 1) : 0;
    const mezclaD = (a, b) => a + ciclo * (b - a);
    D = { ...Doff,
      Q: mezclaD(Doff.Q, Don.Q),
      rad: { ...Doff.rad, Q: mezclaD(Doff.rad.Q, Don.rad.Q),
             eps: mezclaD(Doff.rad.eps, Don.rad.eps), NTU: mezclaD(Doff.rad.NTU, Don.rad.NTU) },
      cal: { ...Doff.cal, Q: mezclaD(Doff.cal.Q, Don.cal.Q) },
      bloque: Doff.bloque, mAire: mezclaD(Doff.mAire, Don.mAire),
      UA: mezclaD(Doff.UA, Don.UA), ventiladorGira: ciclo > 0.5 };
  } else if (D.ventiladorGira) ciclo = 1;
  const mTot = D.C.Qtot * rho;
  const dtMotor = mTot > 1e-9 ? Qgen / (mTot * cp) : Infinity;
  // Si el termostato esta cerrado por el radiador no pasa practicamente nada:
  // el cociente Q/(m·cp) se dispara y publicaria un salto de doscientos grados
  // que no existe. Lo que hay de verdad es un radiador FRIO por los dos lados,
  // y ese es el sintoma que se busca con el pirometro.
  const fracRad = D.C.Qtot > 1e-9 ? D.C.Qrad / D.C.Qtot : 0;
  const radFrio = fracRad < 0.01;
  const dtRad = (!radFrio && D.mRad > 1e-9) ? D.rad.Q / (D.mRad * cp) : 0;
  const P = presionCircuito(e, F);
  const pAbs = presionAtm(alt) + P.rel;
  const tEbu = ebullicion(pAbs, g);
  const tCong = congelacion(g);

  // HONESTIDAD. Este modelo es de refrigerante LIQUIDO. En cuanto la mezcla
  // alcanza su temperatura de ebullicion deja de valer: aparecen vapor, bolsas
  // de gas y un transitorio que aqui no se simula. Asi que la temperatura se
  // declara EN el punto de ebullicion, se marca que hierve y se publica aparte
  // lo que pedia el balance, que ya no es una temperatura sino una medida de
  // cuanto se ha pasado.
  const T = Math.min(Tbruta, tEbu);
  return {
    maq: e.key, mezcla: mez.key, g, plaza: plaza.key, alt, Tamb, rpm, carga, vKmh,
    calefactor, falla: o.falla || 'sano',
    Qgen, Qrad: D.rad.Q, Qcal: D.cal.Q, Qbloque: D.bloque,
    T, Tbruta, Tent: T - dtMotor, dtMotor, dtRad,
    Trad: radFrio ? Tamb : T - dtRad, radFrio, fracRad,
    x: D.x, ventilador: D.ventiladorGira,
    Qtot: D.C.Qtot, Qcau: D.C.Qrad, mTot, mAire: D.mAire, UA: D.UA,
    eps: D.rad.eps, NTU: D.rad.NTU,
    pRel: P.rel, pTarado: P.tarado, purga: P.purga, pAbs, tEbu, tCong,
    // `margen` solo significa algo mientras el refrigerante siga liquido. Si
    // hierve, o si el balance no cerro por debajo del techo, lo que hay no es
    // un margen negativo: es que este modelo ya no describe lo que pasa. Se
    // publica `null` para que nadie lo dibuje como si fuera una temperatura.
    converge, ciclando, ciclo, hierve: Tbruta >= tEbu,
    margen: (!converge || Tbruta >= tEbu) ? null : tEbu - Tbruta,
    excede: converge ? Math.max(0, Tbruta - tEbu) : null,
    fria: T < e.tTermo - 6, servicio: T >= e.tTermo - 6 && T <= e.tAlarma,
    alarma: T > e.tAlarma,
  };
}

// ============================================================================
//  8 · EL CALENTAMIENTO
//
//  El regimen permanente no cuenta toda la historia: el termostato existe para
//  que el motor llegue PRONTO a su temperatura y se quede ahi. La inercia
//  termica es la del refrigerante mas la del metal que moja.
// ============================================================================

const CP_METAL = 0.50;   // kJ/kg K, hierro y aluminio mezclados

function calienta(e, o = {}) {
  const mez = MEZ[o.mezcla || e.mezclaOEM], g = mez.g;
  const plaza = PLZ[o.plaza || 'mar'];
  const Tamb = o.Tamb === undefined ? 25 : o.Tamb;
  const rpm = o.rpm === undefined ? e.ralenti : o.rpm;
  const carga = o.carga === undefined ? 0 : clamp(o.carga, 0, 1);
  const vKmh = o.vKmh === undefined ? 0 : o.vKmh;
  const calefactor = !!o.calefactor;
  const F = FALLAS[o.falla || 'sano'];
  const dt = o.dt === undefined ? 0.25 : o.dt;
  const tMax = o.tMax === undefined ? 900 : o.tMax;

  const gen = T => calorRefrigerante(e, rpm, carga, T) + (F.qExtra || 0);
  const ctx = { alt: plaza.alt, Tamb, vKmh, calefactor, Tcabina: Tamb, g, F, rpm };
  const Cter = (e.litros * rhoRef(g) / 1000) * cpRef(g) + e.masaMetal * CP_METAL;  // kJ/K

  const traza = [];
  let T = Tamb, tAbre = null, tServ = null, hirvio = false;
  const eq = equilibrio(e, o);
  for (let i = 0, t = 0; t <= tMax; i++, t += dt) {
    const D = disipado(e, T, ctx);
    if (tAbre === null && D.x > 0.02) tAbre = t;
    if (tServ === null && T >= e.tTermo - 3) tServ = t;
    if (T >= eq.tEbu) hirvio = true;
    const Qg = gen(T);
    if (i % Math.round(2 / dt) === 0) traza.push({ t, T, x: D.x, Q: D.Q, Qgen: Qg });
    T += dt * (Qg - D.Q) / Cter;
  }
  if (traza[traza.length - 1].t < tMax)
    traza.push({ t: tMax, T, x: aperturaTermostato(e, T, F), Q: disipado(e, T, ctx).Q, Qgen: gen(T) });
  return { traza, tAbre, tServ, hirvio, Cter, Tfinal: T, Teq: eq.T, tEbu: eq.tEbu };
}

// ============================================================================
//  9 · ESCENARIOS, PROTOCOLO Y CENSO
//
//  Trece escenarios. Los dos ultimos NO son averias mecanicas: son la mezcla
//  equivocada, y por eso IMPONEN el refrigerante del circuito.
// ============================================================================

const ESCEN = {
  sano:       { rot: 'Sistema sano', falla: 'sano', clave: 'nada que reparar' },
  terCerrado: { rot: 'Termostato agarrotado cerrado', falla: 'terCerrado', clave: 'termostato' },
  terAbierto: { rot: 'Termostato agarrotado abierto', falla: 'terAbierto', clave: 'termostato' },
  terTardio:  { rot: 'Termostato de temperatura equivocada', falla: 'terTardio', clave: 'termostato' },
  radInterno: { rot: 'Radiador incrustado por dentro', falla: 'radInterno', clave: 'radiador' },
  radExterno: { rot: 'Radiador tapado por fuera', falla: 'radExterno', clave: 'radiador' },
  ventilador: { rot: 'Ventilador que no arranca', falla: 'ventilador', clave: 'ventilador' },
  bomba:      { rot: 'Bomba de agua con el impulsor comido', falla: 'bomba', clave: 'bomba y correa' },
  correa:     { rot: 'Correa floja: la bomba patina', falla: 'correa', clave: 'bomba y correa' },
  tapon:      { rot: 'Tapón de presión que no aguanta', falla: 'tapon', clave: 'tapón y presión' },
  aire:       { rot: 'Aire en el circuito', falla: 'aire', clave: 'aire en el circuito' },
  junta:      { rot: 'Junta de culata: gases al refrigerante', falla: 'junta', clave: 'junta de culata' },
  aguaSola:   { rot: 'Agua sola en el circuito', falla: 'sano', mezcla: 'm0', clave: 'refrigerante equivocado' },
  glicolAlto: { rot: 'Demasiado glicol', falla: 'sano', mezcla: 'm70', clave: 'refrigerante equivocado' },
};
const ESCEN_KEYS = Object.keys(ESCEN);
const FAMILIAS = [...new Set(ESCEN_KEYS.map(k => ESCEN[k].clave))];

// Los tres puntos del protocolo de taller. Son los que se pueden tomar sin
// desmontar nada y con el coche parado en el patio o dando una vuelta.
const PUNTOS = [
  { k: 'ralenti', rot: 'ralentí en el patio, sin marcha', ral: true, carga: 0, vKmh: 0 },
  { k: 'carretera', rot: '2 500 rpm a 90 km/h', rpm: 2500, carga: 0.45, vKmh: 90 },
  { k: 'cuesta', rot: '2 500 rpm a 40 km/h con el pie a fondo', rpm: 2500, carga: 1, vKmh: 40 },
];

function lecturas(e, esc, o = {}) {
  const E = ESCEN[esc];
  const mezcla = E.mezcla || o.mezcla || e.mezclaOEM;
  const base = { mezcla, plaza: o.plaza || 'mar', Tamb: o.Tamb === undefined ? 25 : o.Tamb,
    falla: E.falla, calefactor: false };
  const pts = PUNTOS.map(P => {
    const s = equilibrio(e, { ...base, rpm: P.ral ? e.ralenti : P.rpm,
      carga: P.carga, vKmh: P.vKmh });
    return { k: P.k, rot: P.rot, T: s.T, dtRad: s.dtRad, dtMotor: s.dtMotor,
      venti: s.ventilador, hierve: s.hierve, margen: s.margen, x: s.x, p: s.pRel,
      radFrio: s.radFrio, Trad: s.Trad, alarma: s.alarma };
  });
  const alarmaEn = pts.filter(p => p.T > e.tAlarma).map(p => p.k);
  const hierveEn = pts.filter(p => p.hierve).map(p => p.k);
  return { esc, rot: E.rot, clave: E.clave, mezcla, pts, alarmaEn, hierveEn,
    tCong: congelacion(MEZ[mezcla].g),
    gases: !!FALLAS[E.falla].gases,
    pRel: pts[0].p };
}

// Las siete observaciones. Las cinco primeras se toman en el patio con lo que
// hay en cualquier taller; las dos ultimas piden herramienta que no todos
// tienen —refractometro y detector de gases— y por eso valen aparte.
const OBS = [
  { k: 'tRal',    rot: 'Temperatura del indicador a ralentí', res: 5, uni: '°C', taller: true },
  { k: 'tCarr',   rot: 'Temperatura del indicador en carretera', res: 5, uni: '°C', taller: true },
  { k: 'tCuesta', rot: 'Temperatura del indicador en cuesta', res: 5, uni: '°C', taller: true },
  { k: 'dtRad',   rot: 'Salto de temperatura del radiador con el pirómetro', res: 2, uni: '°C', taller: true },
  { k: 'venti',   rot: 'Arranca el ventilador con el motor cargado', res: null, uni: '', taller: true },
  { k: 'presion', rot: 'Presión del circuito con el comprobador', res: 0.1, uni: 'bar', taller: true },
  { k: 'refract', rot: 'Refractómetro: punto de congelación', res: 2, uni: '°C', taller: false },
  { k: 'gases',   rot: 'Detector de gases de combustión en el refrigerante', res: null, uni: '', taller: false },
];
const cuant = (x, r) => Math.round(x / r) * r;

function firmaObs(e, L, sub) {
  return sub.map(m => {
    if (m.k === 'venti') return L.pts[2].venti ? 'si' : 'no';
    if (m.k === 'gases') return L.gases ? 'si' : 'no';
    if (m.k === 'tRal') return cuant(L.pts[0].T, m.res).toFixed(0);
    if (m.k === 'tCarr') return cuant(L.pts[1].T, m.res).toFixed(0);
    if (m.k === 'tCuesta') return cuant(L.pts[2].T, m.res).toFixed(0);
    if (m.k === 'dtRad') return cuant(L.pts[2].dtRad, m.res).toFixed(0);
    if (m.k === 'presion') return cuant(L.pRel, m.res).toFixed(1);
    if (m.k === 'refract') return cuant(L.tCong, m.res).toFixed(0);
    return '?';
  }).join('|');
}

function censoSub(e, o = {}) {
  const cache = ESCEN_KEYS.map(k => ({ k, L: lecturas(e, k, o) }));
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
      const claves = new Set(g.map(x => x.clave));
      if (claves.size > 1) { conflictos++; enConflicto += g.length; }
    }
    out.push({ mask: m, sub, clases: grupos.size, n: cache.length,
      conflictos, enConflicto, resueltos: cache.length - enConflicto });
  }
  out.sort((a, b) => (b.resueltos - a.resueltos) || (a.sub.length - b.sub.length) || (b.clases - a.clases));
  return out;
}
function casosReto() { return ESCEN_KEYS.filter(k => k !== 'sano'); }

// ============================================================================
//  10 · ARQUETIPOS
// ============================================================================

const mkMaq = m => ({ ...m,
  // Referencias de los coeficientes de pelicula: se declaran en el punto
  // nominal y el modelo escala desde ahi con la ley de cada lado.
  // Caudales de referencia de las dos leyes de pelicula. El caudal nominal del
  // refrigerante es el que mueve la bomba a 2 500 rpm con el termostato abierto,
  // y el del aire, el que atraviesa el frontal con el ventilador solo.
  mRef0: 1.40, mAire0: 0.55,
  hRefCal: 0.42, hAirCal: 0.20, mRefCal: 0.06, mAireCab: 0.075,
  etaInd: 0.40, kRam: 0.32, bandaTermo: 15,
  kBloque: 4.0, kBypass: 35, kTermo: 4.0, kCalef: 260,
});

const ARQ = {
  g16: mkMaq({ key: 'g16', nombre: 'Gasolina 1.6 DOHC 16 V', corto: '1.6 gasolina',
    nCil: 4, B: 79.0, S: 81.5, cil: 1598, ralenti: 750, parPico: 152, rpmPar: 4200, kCalor: 1.00,
    tTermo: 88, tVentiOn: 97, tAlarma: 110, pTapon: 0.9, mezclaOEM: 'm50',
    litros: 5.6, masaMetal: 60, areaFrontal: 0.255, vVenti: 6.2,
    aBomba: 7.07e-6, bBomba: 2.0, relBomba: 1.15,
    kRad: 9.0, hRef0: 1.194, hAir0: 0.464, uaBloque: 12 }),
  g18: mkMaq({ key: 'g18', nombre: 'Gasolina 1.8 SOHC 8 V', corto: '1.8 gasolina',
    nCil: 4, B: 83.0, S: 85.0, cil: 1839, ralenti: 800, parPico: 158, rpmPar: 3600, kCalor: 1.05,
    tTermo: 82, tVentiOn: 93, tAlarma: 108, pTapon: 0.8, mezclaOEM: 'm50',
    litros: 6.4, masaMetal: 68, areaFrontal: 0.240, vVenti: 5.6,
    aBomba: 7.40e-6, bBomba: 2.1, relBomba: 1.05,
    kRad: 9.8, hRef0: 1.679, hAir0: 0.653, uaBloque: 14 }),
  d20: mkMaq({ key: 'd20', nombre: 'Diésel 2.0 DOHC 16 V turbo', corto: '2.0 diésel',
    nCil: 4, B: 83.0, S: 90.4, cil: 1968, ralenti: 800, parPico: 320, rpmPar: 2000, anchoPar: 0.18, kCalor: 0.86,
    tTermo: 88, tVentiOn: 99, tAlarma: 112, pTapon: 1.2, mezclaOEM: 'm50',
    litros: 8.2, masaMetal: 84, areaFrontal: 0.310, vVenti: 6.6,
    aBomba: 8.60e-6, bBomba: 1.9, relBomba: 1.10,
    kRad: 8.2, hRef0: 2.096, hAir0: 0.815, uaBloque: 16 }),
  v8: mkMaq({ key: 'v8', nombre: 'Gasolina 5.0 V8 OHV', corto: '5.0 V8',
    nCil: 8, B: 94.9, S: 87.3, cil: 4942, ralenti: 650, parPico: 420, rpmPar: 3800, kCalor: 1.02,
    tTermo: 90, tVentiOn: 99, tAlarma: 112, pTapon: 1.0, mezclaOEM: 'm50',
    litros: 13.5, masaMetal: 140, areaFrontal: 0.395, vVenti: 7.0,
    aBomba: 1.35e-5, bBomba: 1.6, relBomba: 1.00,
    kRad: 6.6, hRef0: 3.094, hAir0: 1.203, uaBloque: 26 }),
};
const ARQ_KEYS = Object.keys(ARQ);

const VELOCIDADES = [0, 20, 40, 60, 90, 120];
const AMBIENTES = [0, 10, 20, 25, 35, 42];
const REGIMENES = [1200, 2000, 2500, 3000, 4000];
const CARGAS = [0, 0.25, 0.45, 0.7, 1];

// ============================================================================
// T1 · FORMATO, ESTADO Y CAPA DE MEMORIA
// ============================================================================

// Espacio fino no separable: el mismo que usa el resto del dominio D6. Nunca se
// llama a toLocaleString, que en este navegador formatea a la inglesa.
const NBSP=' ';
function num(x,d=1){
  if(!isFinite(x)) return x>0?'∞':'—';
  const s=Math.abs(x).toFixed(d);
  const [ent,dec]=s.split('.');
  let e=''; for(let i=0;i<ent.length;i++){ if(i>0 && (ent.length-i)%3===0) e+=NBSP; e+=ent[i]; }
  return (x<0?'−':'')+e+(dec?','+dec:'');
}
const gC=(x,d=1)=>num(x,d)+NBSP+'°C';
const kW=(x,d=1)=>num(x,d)+NBSP+'kW';
const bar=(x,d=2)=>num(x,d)+NBSP+'bar';
const lps=(x,d=2)=>num(x,d)+NBSP+'L/s';
const lpm=(x,d=0)=>num(x*60,d)+NBSP+'L/min';
const pct=(x,d=0)=>num(x*100,d)+NBSP+'%';
const seg=(x,d=0)=>isFinite(x)&&x!==null?num(x,d)+NBSP+'s':'no llega';

// --- estado observable ------------------------------------------------------
const G={
  maq:'g16',          // clave de ARQ
  mezcla:'m50',       // clave de MEZ
  plaza:'mar',        // clave de PLZ
  esc:'sano',         // clave de ESCEN
  Tamb:25,            // temperatura ambiente, °C
  rpm:2500,           // régimen del motor
  carga:0.45,         // par pedido, 0..1
  vKmh:90,            // velocidad de marcha
  calefactor:false,
  modo:'ensamble',
  simUnlocked:false,
  resuelto:false
};
const MQ=()=>ARQ[G.maq];
const FALLA=()=>ESCEN[G.esc].falla;

// --- capa de memoria --------------------------------------------------------
// `equilibrio`, `calienta` y `censoSub` se piden muchas veces por fotograma. Se
// cachean por firma EXACTA de los argumentos: si cambia un solo dígito se
// recalcula. Nunca se reutiliza una cifra «parecida».
const MEMO=new Map();
function memo(k,fn){ if(MEMO.has(k)) return MEMO.get(k); const v=fn(); MEMO.set(k,v); return v; }
function invalida(){ MEMO.clear(); }

// El escenario puede imponer la mezcla (los dos casos de refrigerante
// equivocado). Cuando lo hace, manda el escenario: es parte de la avería, no
// una elección del alumno.
const mezclaEfectiva=()=>ESCEN[G.esc].mezcla||G.mezcla;
const mezclaForzada=()=>!!ESCEN[G.esc].mezcla;
const GLICOL=()=>MEZ[mezclaEfectiva()].g;

function EQ(o={}){
  const m=o.mezcla??mezclaEfectiva(), p=o.plaza??G.plaza, Ta=o.Tamb??G.Tamb,
        r=o.rpm??G.rpm, c=o.carga??G.carga, v=o.vKmh??G.vKmh,
        cal=o.calefactor??G.calefactor, fa=o.falla??FALLA();
  return memo(`q|${G.maq}|${m}|${p}|${Ta}|${r}|${c}|${v}|${cal}|${fa}`,
    ()=>equilibrio(MQ(),{mezcla:m,plaza:p,Tamb:Ta,rpm:r,carga:c,vKmh:v,calefactor:cal,falla:fa}));
}
function CAL(o={}){
  const m=o.mezcla??mezclaEfectiva(), p=o.plaza??G.plaza, Ta=o.Tamb??G.Tamb,
        r=o.rpm??G.rpm, c=o.carga??G.carga, v=o.vKmh??G.vKmh,
        cal=o.calefactor??G.calefactor, fa=o.falla??FALLA();
  return memo(`c|${G.maq}|${m}|${p}|${Ta}|${r}|${c}|${v}|${cal}|${fa}`,
    ()=>calienta(MQ(),{mezcla:m,plaza:p,Tamb:Ta,rpm:r,carga:c,vKmh:v,calefactor:cal,falla:fa}));
}
function LECT(){ return memo(`l|${G.maq}|${G.esc}|${G.mezcla}|${G.plaza}|${G.Tamb}`,
  ()=>lecturas(MQ(),G.esc,{mezcla:G.mezcla,plaza:G.plaza,Tamb:G.Tamb})); }
function CENSO(){ return memo(`n|${G.maq}|${G.mezcla}|${G.plaza}|${G.Tamb}`,
  ()=>censoSub(MQ(),{mezcla:G.mezcla,plaza:G.plaza,Tamb:G.Tamb})); }

// Veredicto del punto de trabajo actual, con los criterios SEPARADOS. Se
// evalúan aparte porque el laboratorio demuestra que no son equivalentes: hay
// averías que sólo caza uno, y hay una —el tapón— que no mueve la temperatura
// ni un grado y sin embargo se lleva medio margen por delante.
const MARGEN_MIN=12;   // grados hasta la ebullición por debajo de los cuales
                       // el sistema se declara sin reserva. Valor DECLARADO.

// El margen puede NO EXISTIR: si el refrigerante hierve —o si el balance no
// cerró por debajo del techo de la bisección— el modelo, que es de líquido, ya
// no describe lo que pasa y publica `null`. Se formatea y se compara siempre
// por aquí, porque en JavaScript `null < 12` vale `false` y una comparación a
// pelo colaría un motor hervido como un motor con reserva de sobra.
const rotMargen=s=>s.hierve?'HIERVE':(s.margen===null?'sin equilibrio':gC(s.margen));
const sinReserva=s=>s.margen!==null&&s.margen<MARGEN_MIN;
const conReserva=s=>s.margen!==null&&s.margen>=MARGEN_MIN;

function veredicto(){
  const s=EQ(), e=MQ();
  return {
    temperatura: s.T<=e.tAlarma,
    margen: conReserva(s),
    hierve: s.hierve,
    fria: s.fria,
    reserva: s.ciclo<0.98,
    malo: s.T>e.tAlarma || s.hierve || sinReserva(s),
  };
}
// El frío se juzga APARTE, y a propósito: un termostato agarrotado abierto no
// recalienta nunca —el veredicto de marcha lo absuelve— y sin embargo es una
// avería que se paga en consumo, en desgaste y en que la calefacción no
// calienta. Meterlo en el mismo veredicto haría que un motor que se pasa de
// frío pareciera un motor sano.
// Y hay que separar DOS cosas que se parecen y no son lo mismo: un sistema que
// no puede llegar a su temperatura —el equilibrio mismo está frío, y eso es una
// avería— y un sistema que llega pero tarda más de los quince minutos del
// ensayo porque se le ha pedido que caliente a ralentí, que no es una avería
// sino una lección: un motor no se calienta al ralentí en el patio.
function veredictoFrio(){
  const s=EQ(), c=CAL();
  const lento=!s.fria && c.tServ===null;
  return { ok: !s.fria, fria: s.fria, lento,
    llega: c.tServ!==null, tServ: c.tServ,
    nivel: s.fria?'bad':(lento?'warn':'good'),
    rot: s.fria ? 'no alcanza su temperatura de servicio por mucho tiempo que se le dé'
       : (lento ? 'regula, pero en este punto de trabajo tarda más de quince minutos en llegar'
                : 'calienta y regula') };
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
  bloque: std({...alu, color:0x6f767f, metalness:0.55, roughness:0.72}),
  culata: std({...alu, color:0x7b828b, metalness:0.50, roughness:0.66}),
  acero:  std({...brush, metalness:1.0, roughness:0.32}),
  crom:   std({...brush, metalness:1.0, roughness:0.16}),
  banco:  std({...plas, metalness:0.20, roughness:0.62}),
  caja:   std({...plas, metalness:0.24, roughness:0.54}),
  goma:   std({...rub, color:0x141a22, roughness:0.96, metalness:0.0}),
  ok:     emis(0x7CD992,1.3),
  bad:    emis(0xff6b6b,1.5),
  avi:    emis(0xE9C46A,1.4),
};
// El refrigerante se pinta del color de su TEMPERATURA, no de un color fijo:
// azul cuando el motor está frío, verde en servicio, ámbar cerca de la alarma y
// rojo cuando ya no queda margen. Es la misma escala en la escena, en el
// pizarrón y en la leyenda, para que nadie tenga que traducir entre vistas.
const ESCALA_T=[
  [0.00,0x5BD4E5], [0.45,0x7CD992], [0.78,0xE9C46A], [1.00,0xff6b6b],
];
function colorT(T,e){
  const u=clamp((T-(e.tTermo-25))/((e.tAlarma+8)-(e.tTermo-25)),0,1);
  for(let i=1;i<ESCALA_T.length;i++){
    if(u<=ESCALA_T[i][0]||i===ESCALA_T.length-1){
      const [u0,c0]=ESCALA_T[i-1], [u1,c1]=ESCALA_T[i];
      const t=(u-u0)/(u1-u0||1);
      const mez=(a,b)=>Math.round(a+(b-a)*clamp(t,0,1));
      return (mez((c0>>16)&255,(c1>>16)&255)<<16)|(mez((c0>>8)&255,(c1>>8)&255)<<8)|mez(c0&255,c1&255);
    }
  }
  return 0x7CD992;
}
const hex6=n=>'#'+n.toString(16).padStart(6,'0');

const MAT_REF   =std({color:0x5BD4E5,emissive:0x5BD4E5,emissiveIntensity:0.55,roughness:0.35,metalness:0.10});
const MAT_TUBO  =std({color:0x2a333f,metalness:0.55,roughness:0.58});
const MAT_MANG  =std({...rub, color:0x181e26, roughness:0.94, metalness:0.0});
const MAT_ALETA =std({color:0x39434f,metalness:0.72,roughness:0.46});
const MAT_TANQ  =std({color:0x232b35,metalness:0.30,roughness:0.62});
const MAT_VIDRIO=std({color:0xbfd4e2,metalness:0.10,roughness:0.08,transparent:true,opacity:0.28});
const MAT_ESFERA=std({color:0xf2f5f8,metalness:0.05,roughness:0.85});
const MAT_AGUJA =std({color:0xff5252,emissive:0xff2020,emissiveIntensity:0.9,roughness:0.4});
const MAT_CERA  =std({color:0xd8b24a,metalness:0.55,roughness:0.42});

// Régimen térmico: la misma clave en el 3D, en el pizarrón y en la leyenda.
const COL_REG={frio:'#5BD4E5', servicio:'#7CD992', alarma:'#E9C46A', hierve:'#ff6b6b'};
const ROT_REG={frio:'por debajo de su temperatura de servicio', servicio:'en temperatura de servicio',
  alarma:'por encima de su alarma', hierve:'hirviendo'};
function regimenT(s,e){
  if(s.hierve) return 'hierve';
  if(s.T>e.tAlarma) return 'alarma';
  if(s.fria) return 'frio';
  return 'servicio';
}

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
// El pizarrón va siempre al costado izquierdo del motor, a distancia fija de su
// extremo. Fijar la coordenada a mano lo mete dentro del bloque en cuanto el
// motor es más largo, y eso no se ve venir escribiendo el número.
function colocaTablero(anchoTot){
  board.position.set(-(anchoTot/2+2.05),0,1.05);
  board.rotation.y=0.72;
}
// Encuadre del pizarrón: se calcula desde su propia transformada, no con
// coordenadas escritas a mano, porque el pizarrón se mueve con el ancho del
// motor y unas coordenadas fijas lo dejan medio fuera de cuadro en cuanto se
// cambia de arquetipo.
function camTablero(d,off){
  const c=board.position.clone(); c.y=1.88;
  const n=new THREE.Vector3(Math.sin(board.rotation.y),0,Math.cos(board.rotation.y));
  const p=c.clone().addScaledVector(n,d||5.85); p.y=2.38;
  // El HUD tapa la franja izquierda de la pantalla, asi que por omision se apunta
  // un poco a la izquierda del centro del pizarron para que el pizarron caiga a
  // su derecha. Con un desplazamiento POSITIVO el pizarron se corre hacia la
  // izquierda y el motor —que esta a su derecha— entra en el cuadro: eso es lo
  // que hace falta en los modos que se leen con el motor delante.
  const tg=new THREE.Vector3(Math.cos(board.rotation.y),0,-Math.sin(board.rotation.y));
  const dx=(off===undefined)?-0.42:off;
  p.addScaledVector(tg,dx); c.addScaledVector(tg,dx);
  return [[p.x,p.y,p.z],[c.x,c.y,c.z]];
}
{
  const marco=roundedBox(3.94,2.98,0.10,std({...plas,metalness:0.30,roughness:0.58}),0.05);
  marco.position.y=1.88; board.add(marco);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(3.72,2.76),
    new THREE.MeshBasicMaterial({map:btex,toneMapped:false}));
  pl.position.set(0,1.88,0.056); board.add(pl);
  for(const sx of [-1,1]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.40,16),MAT.acero);
    p.position.set(sx*1.56,0.20,0); p.castShadow=true; board.add(p);
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

// Cabecera común: toda vista dice qué motor, qué refrigerante, en qué plaza y
// en qué punto de trabajo se está mirando. Una cifra sin su configuración al
// lado no significa nada, y aquí hay siete mandos que la cambian.
// Lo que la cabecera dice del refrigerante. En el diagnóstico a ciegas NO puede
// decirlo: la mezcla del circuito delata por sí sola los dos escenarios de
// refrigerante equivocado, y el «(lo impone el escenario)» delata la familia.
function cabMezcla(){
  return (G.modo==='reto') ? 'refrigerante: oculto'
    : MEZ[mezclaEfectiva()].rot+(mezclaForzada()?'  (lo impone el escenario)':'');
}
function cabecera(t,sub){
  const e=MQ(), ciego=(G.modo==='reto');
  textoFit(t,42,50,520,{s:26,b:true});
  texto(e.nombre+' · termostato '+num(e.tTermo,0)+NBSP+'°C · tapón '+bar(e.pTapon,1)+
    ' · alarma '+num(e.tAlarma,0)+NBSP+'°C',BW-42,44,{s:13,c:CIAN,al:'right'});
  texto(cabMezcla()+' · '+PLZ[G.plaza].rot+' · '+num(G.Tamb,0)+NBSP+'°C · '+
    num(G.rpm,0)+NBSP+'rpm · carga '+num(G.carga*100,0)+NBSP+'% · '+
    num(G.vKmh,0)+NBSP+'km/h'+(G.calefactor?' · calefacción':''),
    BW-42,68,{s:13,c:(ciego||mezclaForzada())?WARN_HEX:'#8c98a9',al:'right'});
  wrapText(sub,42,92,BW-84,18,{s:13,c:'#8c98a9'});
  linea([[42,116],[BW-42,116]],'#1e2836',1.4);
}


// ---------------------------------------------------------------- paleta común
// Un color por mezcla, el mismo en la curva de congelación, en la de ebullición
// y en la leyenda. Si el alumno tiene que traducir entre vistas, la vista sobra.
const COL_MZ={m0:'#5BD4E5', m30:'#8AB4F8', m40:'#7CD992', m50:'#E9C46A',
              m60:'#F2A65A', m70:'#EF8FB4'};
const COL_PL={mar:'#5BD4E5', gdl:'#7CD992', cdmx:'#E9C46A', tol:'#EF8FB4'};
const corta=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;

// Barras verticales con su rótulo. Se usa en el balance y en el censo.
function barras(P,items,vmax,o={}){
  const n=items.length, gap=o.gap===undefined?12:o.gap;
  const bwid=(P.w-gap*(n-1))/n;
  items.forEach((it,i)=>{
    const x=P.x+i*(bwid+gap);
    const v=clamp(it.v,0,vmax);
    const h=v/vmax*P.h, y=P.y+P.h-h;
    rpanel(x,y,bwid,h,it.c,null,4);
    texto(it.top,x+bwid/2,y-6,{s:o.s||12,c:it.c,al:'center',b:true});
    textoFit(it.rot,x+bwid/2,P.y+P.h+18,bwid+gap-4,{s:11.5,c:'#9aa6b6',al:'center'});
    if(it.rot2) textoFit(it.rot2,x+bwid/2,P.y+P.h+34,bwid+gap-4,{s:11,c:it.c2||'#7b8697',al:'center'});
  });
}
// Tarjeta de veredicto: un rótulo, un valor y un color. Es la unidad de lectura
// rápida del pizarrón y aparece en cinco vistas.
function tarjeta(x,y,w,h,rot,val,c,pie){
  rpanel(x,y,w,h,'rgba(255,255,255,0.030)','#1e2836',10);
  texto(rot,x+14,y+24,{s:12.5,c:'#8c98a9'});
  textoFit(val,x+14,y+54,w-28,{s:24,b:true,c});
  if(pie) wrapText(pie,x+14,y+76,w-28,15,{s:11.5,c:'#7b8697'});
}
// Barra horizontal partida: cuánto de lo generado se va por cada camino. Suma
// exactamente lo generado, porque el balance del motor sellado cierra.
function barraReparto(x,y,w,h,trozos,total){
  let px=x;
  trozos.forEach(t=>{
    const ww=total>0?Math.max(0,t.v)/total*w:0;
    rpanel(px,y,ww,h,t.c,null,4);
    if(ww>58) texto(t.rot,px+ww/2,y+h/2+5,{s:12,c:'#0b0f14',al:'center',b:true});
    px+=ww;
  });
  bx.save(); bx.strokeStyle='#3a4658'; bx.lineWidth=1.2; bx.strokeRect(x,y,w,h); bx.restore();
}

// ------------------------------------------------------------- vista ENSAMBLE
function vistaEnsamble(){
  const hechas=PARTS.filter(p=>ASM.done.has(p.k));
  cabecera('Circuito de refrigeración — montaje',
    'El refrigerante hace un circuito cerrado: la bomba lo empuja por el bloque, el termostato decide si lo manda al radiador o lo devuelve por la derivación, el radiador le quita calor al aire que el ventilador o la marcha le meten, el tapón sostiene la presión que sube el punto de ebullición, el calefactor es un segundo radiador y el sensor mueve la aguja del tablero. Falta una pieza y el circuito no es circuito.');

  // --- esquema del circuito -------------------------------------------------
  // Se dibuja SIEMPRE entero. Las piezas que faltan van en trazo discontinuo y
  // en gris: enseñar el hueco vale más que esconder la pieza.
  const NODO=[
    {k:'bomba',      x:70,  y:392, w:150, h:56, rot:'Bomba de agua'},
    {k:'termostato', x:296, y:392, w:150, h:56, rot:'Termostato'},
    {k:'radiador',   x:522, y:270, w:150, h:56, rot:'Radiador'},
    {k:'ventilador', x:522, y:392, w:150, h:56, rot:'Ventilador'},
    {k:'tapon',      x:748, y:270, w:150, h:56, rot:'Tapón + depósito'},
    {k:'calefactor', x:296, y:270, w:150, h:56, rot:'Calefactor'},
    {k:'sensor',     x:748, y:392, w:150, h:56, rot:'Sensor + aguja'},
  ];
  const puesta=k=>ASM.done.has(k);
  const N=k=>NODO.find(n=>n.k===k);
  const centro=n=>[n.x+n.w/2,n.y+n.h/2];
  function flecha(pts,c){
    linea(pts,c,2.2);
    const a=pts[pts.length-2], b=pts[pts.length-1];
    const dx=b[0]-a[0], dy=b[1]-a[1], m=Math.hypot(dx,dy)||1, ux=dx/m, uy=dy/m;
    linea([[b[0]-ux*11-uy*6,b[1]-uy*11+ux*6],[b[0],b[1]],[b[0]-ux*11+uy*6,b[1]-uy*11-ux*6]],c,2.2);
  }
  const col=(a,b)=>puesta(a)&&puesta(b)?CIAN:'#39424f';
  // El bloque no es una pieza que se monte: es el motor, y va siempre.
  rpanel(70,270,150,56,'rgba(255,255,255,0.05)','#4a5666',9);
  textoFit('Bloque y culata',146,296,134,{s:13.5,b:true,c:TINTA,al:'center'});
  texto('siempre',146,314,{s:11.5,c:'#7b8697',al:'center'});
  flecha([[centro(N('bomba'))[0],N('bomba').y],[146,326]],puesta('bomba')?CIAN:'#39424f');
  flecha([[220,298],[N('calefactor').x,298]],col('calefactor','bomba'));
  flecha([[220,420],[N('termostato').x,420]],puesta('termostato')?CIAN:'#39424f');
  flecha([[centro(N('termostato'))[0],N('termostato').y],[centro(N('radiador'))[0]-40,N('radiador').y+N('radiador').h]],col('termostato','radiador'));
  flecha([[N('radiador').x,centro(N('radiador'))[1]+18],[N('bomba').x+N('bomba').w+8,468],[N('bomba').x+N('bomba').w,458]],col('radiador','bomba'));
  flecha([[N('calefactor').x+N('calefactor').w,298],[N('radiador').x,298]],col('calefactor','radiador'));
  flecha([[N('radiador').x+N('radiador').w,centro(N('radiador'))[1]],[N('tapon').x,centro(N('tapon'))[1]]],col('radiador','tapon'));
  flecha([[N('termostato').x+N('termostato').w,centro(N('termostato'))[1]],[N('ventilador').x,centro(N('ventilador'))[1]]],'#39424f');
  flecha([[N('ventilador').x+N('ventilador').w,centro(N('ventilador'))[1]],[N('sensor').x,centro(N('sensor'))[1]]],'#39424f');
  // La derivación: el camino que hace el refrigerante mientras el motor calienta.
  {
    const t=N('termostato'), b=N('bomba');
    linea([[centro(t)[0],t.y+t.h],[centro(t)[0],508],[centro(b)[0],508],[centro(b)[0],b.y+b.h]],
      puesta('termostato')?'#5d6b7d':'#39424f',1.8,[8,6]);
    etiqueta('derivación: mientras el motor está frío, el refrigerante da vueltas sin pasar por el radiador',
      centro(t)[0]+12,504,'#8c98a9');
  }
  NODO.forEach(n=>{
    const on=puesta(n.k);
    bx.save(); if(!on) bx.setLineDash([7,5]);
    rpanel(n.x,n.y,n.w,n.h,on?'rgba(91,212,229,0.13)':'rgba(255,255,255,0.02)',on?CIAN:'#3a4658',9);
    bx.restore();
    textoFit(n.rot,n.x+n.w/2,n.y+26,n.w-16,{s:13.5,b:true,c:on?TINTA:'#6b7686',al:'center'});
    texto(on?'montada':'falta',n.x+n.w/2,n.y+44,{s:11.5,c:on?OK_HEX:'#6b7686',al:'center'});
  });

  // --- lista de piezas ------------------------------------------------------
  texto('Piezas del circuito — '+hechas.length+'/'+PARTS.length,42,568,{s:15,b:true});
  const filas=PARTS.map(p=>({v:[ASM.done.has(p.k)?'✔':'·', p.rot, p.fn, p.sin],
                             c:ASM.done.has(p.k)?TINTA:'#75808f'}));
  tabla(42,578,[{t:'',w:18,al:'center'},{t:'Pieza',w:150},{t:'Qué hace',w:330},{t:'Si falta',w:370}],
    filas,{rh:23,s:12.5});
}

// ------------------------------------------------------------- vista BALANCE
function vistaBalance(){
  const e=MQ(), s=EQ(), V=veredicto();
  cabecera('Balance térmico — lo que entra tiene que salir',
    'De todo el combustible que quema el motor, poco más de una cuarta parte acaba en el refrigerante. Ese calor sale por el radiador, por el calefactor si está abierto y por la superficie del bloque, y no hay más caminos. El salto de temperatura del motor NO es una medida de refrigeración: es el calor dividido por el caudal, y por eso un salto grande significa poco caudal.');

  // --- de dónde sale el calor ----------------------------------------------
  const Pcomb=potCombustible(e,G.rpm,G.carga,s.T);
  const Peje=potEje(e,G.rpm,G.carga), Proz=potRoz(e,G.rpm,G.carga,s.T);
  texto('De dónde sale',42,156,{s:15,b:true});
  const P1={x:96,y:176,w:404,h:150};
  const vmax=Math.max(Pcomb,1)*1.08;
  barras(P1,[
    {v:Pcomb, c:'#8AB4F8', top:kW(Pcomb), rot:'combustible', rot2:'lo que entra'},
    {v:Peje,  c:'#7CD992', top:kW(Peje),  rot:'al cigüeñal', rot2:'lo que sirve'},
    {v:Proz,  c:'#F2A65A', top:kW(Proz),  rot:'rozamiento', rot2:'y bombeo'},
    {v:s.Qgen,c:'#EF8FB4', top:kW(s.Qgen),rot:'al refrigerante', rot2:pct(s.Qgen/Math.max(Pcomb,1e-6))+' del total'},
  ],vmax,{gap:16});
  wrapText('A ralentí la potencia al cigüeñal es CERO y el motor sigue calentándose: lo que hay que sacar sale del rozamiento y del bombeo, no de la potencia entregada. Por eso el calor se saca de la potencia de combustible y no de un porcentaje de la potencia al freno.',
    42,384,458,16,{s:12});

  // --- por dónde sale -------------------------------------------------------
  texto('Por dónde sale',568,156,{s:15,b:true});
  const trozos=[
    {v:s.Qrad, c:'#5BD4E5', rot:'radiador'},
    {v:s.Qcal, c:'#F2A65A', rot:'calefactor'},
    {v:s.Qbloque, c:'#8f97a5', rot:'bloque'},
  ];
  barraReparto(568,182,414,44,trozos,Math.max(s.Qgen,1e-6));
  let y=252;
  trozos.forEach(t=>{
    texto('■',568,y,{s:14,c:t.c});
    texto(t.rot,586,y,{s:13,c:'#c3ccd8'});
    texto(kW(t.v)+'   ('+pct(t.v/Math.max(s.Qgen,1e-6))+')',982,y,{s:13,al:'right',c:t.c});
    y+=24;
  });
  texto('generado',586,y+6,{s:13,b:true,c:'#c3ccd8'});
  texto(kW(s.Qgen),982,y+6,{s:13,b:true,al:'right'});
  // Cuando el balance NO CIERRA hay que decirlo con todas las letras: si no, las
  // tres salidas suman una fracción del calor generado y la pantalla parece rota
  // cuando lo que pasa es que el modelo ya no vale ahí.
  wrapText(!s.converge
    ? 'El balance NO CIERRA: quitado el radiador, por la superficie del bloque no sale ni de lejos el calor que entra, y no hay ninguna temperatura por debajo de los 400 °C en que lo disipado iguale a lo generado. Por eso estas tres salidas suman mucho menos que el calor generado. El refrigerante hirvió mucho antes y este modelo, que es de líquido, dejó de valer ahí.'
    : s.hierve
    ? 'El refrigerante ESTÁ HIRVIENDO: a partir de aquí el modelo, que es de líquido, deja de valer y no se publica ninguna temperatura por encima de la de ebullición.'
    : 'El balance cierra: lo disipado es exactamente lo generado. Cuando el ventilador cicla, cierra en PROMEDIO, y lo que sale de ese promedio es su ciclo de trabajo.',
    568,y+34,414,16,{s:12,c:s.hierve?BAD_HEX:'#7b8697'});

  // --- las cuatro cifras ----------------------------------------------------
  const cw=228, cx=42;
  tarjeta(cx,470,cw,104,'Temperatura de salida',gC(s.T),
    COL_REG[regimenT(s,e)],'Es lo que ve el conductor. El termostato la clava en su tarado mientras le quede recorrido.');
  tarjeta(cx+cw+14,470,cw,104,'Salto del motor',gC(s.dtMotor),
    s.dtMotor>12?WARN_HEX:TINTA,'Q dividido por el caudal. Grande NO es bueno: significa poco caudal.');
  tarjeta(cx+2*(cw+14),470,cw,104,'Salto del radiador',
    s.radFrio?'radiador frío':gC(s.dtRad),
    s.radFrio?BAD_HEX:TINTA,
    s.radFrio?'Por el radiador no pasa caudal: el termostato está cerrado.':'Lo que el radiador le quita de verdad al refrigerante que le llega.');
  tarjeta(cx+3*(cw+14),470,cw,104,'Margen hasta hervir',rotMargen(s),
    V.margen?OK_HEX:(s.hierve?BAD_HEX:WARN_HEX),
    s.hierve?'El refrigerante hierve: este modelo es de líquido y aquí deja de valer.'
      :'Lo que le falta al refrigerante para hervir a la presión y la altitud de ahora.');

  // --- la tabla de detalle --------------------------------------------------
  const filas=[
    ['Caudal de la bomba',lpm(s.Qtot),'Va con el régimen y con lo abierto que esté el termostato.'],
    ['Caudal por el radiador',lpm(s.Qcau)+'   ('+pct(s.Qcau/Math.max(s.Qtot,1e-9))+')','El resto vuelve por la derivación sin pasar por el radiador.'],
    ['Apertura del termostato',pct(s.x),'Cero por debajo de '+num(e.tTermo,0)+' °C y uno a partir de '+num(e.tTermo+e.bandaTermo,0)+' °C.'],
    ['Ventilador',s.ciclando?('ciclando al '+pct(s.ciclo)):(s.ventilador?'encendido':'apagado'),
      s.ciclando?'La aguja se queda clavada y lo que se mueve es el ciclo: ESA es la medida de margen.':'Sólo cuenta despacio: a partir de unos 60 km/h manda el aire de la marcha.'],
    // Sin caudal por el radiador la eficacia es un cociente entre dos ceros: se
    // declara que no se aplica en vez de publicar el número que salga.
    ['Eficacia del radiador',s.radFrio?'no se aplica: no pasa caudal':pct(s.eps)+'   (NTU '+num(s.NTU,2)+')',
      'Del salto máximo posible contra el aire, esto es lo que aprovecha.'],
    ['Caudal de aire por el frontal',num(s.mAire,2)+NBSP+'kg/s','Depende de la marcha, del ventilador y de la densidad del aire de la plaza.'],
  ];
  tabla(42,600,[{t:'Magnitud',w:246},{t:'Valor',w:196},{t:'Qué significa',w:474}],
    filas.map(f=>({v:f})),{rh:24,s:12.5});
}

// ----------------------------------------------------------- vista TERMOSTATO
function vistaTermostato(){
  const e=MQ(), s=EQ(), c=CAL(), VF=veredictoFrio();
  cabecera('Termostato y calentamiento — para qué sirve de verdad',
    'El termostato no está para enfriar: está para que el motor CALIENTE pronto y se quede donde toca. Mientras el refrigerante está frío lo manda entero por la derivación; a partir de su tarado va abriendo el paso al radiador. Agarrotado cerrado, el motor hierve. Agarrotado abierto, no recalienta nunca —y eso también es una avería—.');

  // --- transitorio ----------------------------------------------------------
  const tMax=c.traza[c.traza.length-1].t;
  const P={x:96,y:172,w:436,h:224};
  const Tmax=Math.max(120,Math.ceil((Math.max(...c.traza.map(p=>p.T))+8)/10)*10);
  const M=ejes(P,0,tMax,0,Tmax,'tiempo desde el arranque [s]','temperatura del refrigerante [°C]',
    v=>num(v,0),v=>num(v,0),5,6);
  nivel(P,M,e.tTermo,CIAN,'abre el termostato: '+num(e.tTermo,0)+' °C');
  nivel(P,M,e.tAlarma,BAD_HEX,'alarma: '+num(e.tAlarma,0)+' °C');
  nivel(P,M,c.tEbu,'#EF8FB4','hierve: '+num(c.tEbu,0)+' °C');
  enCaja(P,()=>{
    serieXY(M,c.traza.map(p=>[p.t,p.T]),NARANJA,2.6);
    // La apertura del termostato, en la misma gráfica y a su escala: es lo que
    // explica el codo de la curva.
    serieXY(M,c.traza.map(p=>[p.t,p.x*Tmax*0.28]),AZUL,2,[7,5]);
  });
  if(c.tAbre!==null) punteo(M,c.tAbre,c.traza.find(p=>p.t>=c.tAbre).T,CIAN,5.5);
  leyenda(P.x+16,P.y+26,[['temperatura del refrigerante',NARANJA],
    ['apertura del termostato (escala propia)',AZUL,[7,5]]]);

  // --- la curva del termostato ---------------------------------------------
  const P2={x:640,y:172,w:342,h:224};
  const T0=e.tTermo-18, T1=e.tTermo+e.bandaTermo+14;
  const M2=ejes(P2,T0,T1,0,1,'temperatura del refrigerante [°C]','apertura',
    v=>num(v,0),v=>num(v*100,0)+' %',5,4);
  const F=FALLAS[FALLA()];
  const curva=[];
  for(let T=T0;T<=T1;T+=0.5) curva.push([T,aperturaTermostato(e,T,FALLAS.sano)]);
  serieXY(M2,curva,'#4b5665',2,[6,4]);
  const curvaF=[];
  for(let T=T0;T<=T1;T+=0.5) curvaF.push([T,aperturaTermostato(e,T,F)]);
  serieXY(M2,curvaF,NARANJA,2.6);
  punteo(M2,clamp(s.T,T0,T1),s.x,OK_HEX,6);
  leyenda(P2.x+14,P2.y+26,[['el termostato que toca','#4b5665',[6,4]],
    ['el que está montado',NARANJA]]);

  // --- veredicto del frío ---------------------------------------------------
  const cw=228;
  tarjeta(42,470,cw,104,'Tarda en abrir',seg(c.tAbre),
    c.tAbre===null?WARN_HEX:TINTA,'Desde el arranque en frío, con este punto de trabajo.');
  tarjeta(42+cw+14,470,cw,104,'Tarda en calentar',seg(c.tServ),
    VF.llega?OK_HEX:WARN_HEX,'Hasta tres grados por debajo del tarado del termostato.');
  tarjeta(42+2*(cw+14),470,cw,104,'Se queda en',gC(c.Tfinal),
    COL_REG[regimenT({T:c.Tfinal,hierve:false,fria:c.Tfinal<e.tTermo-6},e)],
    'A los quince minutos de marcha. En permanente, '+gC(c.Teq)+'.');
  // Tres desenlaces, no dos: calienta y regula; regula pero tarda más de los
  // quince minutos del ensayo —culpa del punto de trabajo, no del sistema—; y
  // no llega nunca, que sí es una avería.
  tarjeta(42+3*(cw+14),470,cw,104,'Veredicto del frío',
    VF.fria?'se queda frío':(VF.lento?'tarda de más':'calienta bien'),
    VF.fria?BAD_HEX:(VF.lento?WARN_HEX:OK_HEX),VF.rot+'.');

  rpanel(42,600,940,146,'rgba(255,255,255,0.030)','#1e2836',10);
  texto('Lo que este modo enseña',56,626,{s:13,b:true,c:CIAN});
  wrapText('Un motor calienta MUCHO antes conduciendo que a ralentí, y no porque el radiador haga nada distinto: porque el rozamiento en frío —con el aceite espeso— es lo que de verdad mete calor al refrigerante, y a ralentí ese rozamiento es pequeño. La calefacción a tope con el motor parado y frío se lo roba entero, y por eso en invierno no sale aire caliente hasta que el coche anda. Y un termostato agarrotado abierto no hace saltar ninguna alarma: el motor simplemente no llega nunca a su temperatura, gasta más y se desgasta antes.',
    56,650,912,17,{s:12.5});
}

// ------------------------------------------------------------ vista RADIADOR
function vistaRadiador(){
  const e=MQ(), s=EQ();
  cabecera('Radiador y ventilador — quién enfría a cada velocidad',
    'Un radiador no tiene «capacidad de disipación»: disipa lo que le dejan los dos caudales y el salto contra el aire. El ventilador y la marcha NO se suman: manda el que más empuja, y por eso el ventilador sólo cuenta despacio. En la meseta, además, el aire pesa menos y el mismo radiador rinde menos.');

  // --- calor disipado contra velocidad -------------------------------------
  const P={x:96,y:172,w:436,h:224};
  const Qmax=Math.max(8,Math.ceil(EQ({vKmh:0}).Qgen*1.25/5)*5);
  const M=ejes(P,0,130,0,Qmax,'velocidad de marcha [km/h]','calor disipado por el radiador [kW]',
    v=>num(v,0),v=>num(v,0),5,5);
  const conV=[], sinV=[];
  for(let v=0;v<=130;v+=5){
    conV.push([v,EQ({vKmh:v}).Qrad]);
    sinV.push([v,EQ({vKmh:v,falla:'ventilador'}).Qrad]);
  }
  enCaja(P,()=>{
    serieXY(M,conV,OK_HEX,2.6);
    serieXY(M,sinV,BAD_HEX,2.2,[7,5]);
  });
  punteo(M,G.vKmh,s.Qrad,CIAN,6);
  leyenda(P.x+16,P.y+26,[['con el ventilador que le toca',OK_HEX],
    ['con el ventilador averiado',BAD_HEX,[7,5]]]);

  // --- las cuatro plazas ----------------------------------------------------
  // Aquí NO van ejes: esto es una lista, no una gráfica. Llamar a `ejes` y luego
  // borrar el rectángulo dejaba el lienzo TRANSPARENTE, y el plano del pizarrón
  // —que es un material básico sin `transparent`— pintaba ese hueco de BLANCO
  // con el texto claro encima, ilegible. Sólo se ve mirando la pantalla.
  // 244 de alto y no 224: con 224, el pie del panel caía encima de la segunda
  // línea de la fila de Toluca y las dos frases salían pisadas.
  const P2={x:640,y:172,w:342,h:244};
  rpanel(P2.x,P2.y,P2.w,P2.h,'rgba(255,255,255,0.02)','#3a4658',6);
  texto('La misma cuesta en cuatro plazas',P2.x+14,P2.y+26,{s:13,b:true});
  let yy=P2.y+52;
  PLAZAS.forEach(p=>{
    const q=EQ({plaza:p.key,rpm:2500,carga:1,vKmh:40});
    // Sin margen no hay barra: una barra de longitud cero se lee como «margen
    // pequeño», y lo que hay es que el modelo ya no vale ahí.
    const w=q.margen===null?0:Math.round((P2.w-160)*clamp(q.margen/40,0,1));
    texto(p.corto,P2.x+14,yy+4,{s:12.5,c:'#c3ccd8'});
    rpanel(P2.x+82,yy-10,Math.max(w,3),16,
      q.hierve?BAD_HEX:(sinReserva(q)?WARN_HEX:COL_PL[p.key]),null,4);
    texto(rotMargen(q),P2.x+P2.w-14,yy+4,
      {s:12,al:'right',c:q.hierve?BAD_HEX:'#c3ccd8'});
    texto(num(p.alt,0)+NBSP+'m · '+gC(q.T,0),P2.x+82,yy+22,{s:11,c:'#7b8697'});
    yy+=46;
  });
  texto('margen hasta la ebullición, a 2 500 rpm y 40 km/h con el pie a fondo',
    P2.x+14,P2.y+P2.h-10,{s:11,c:'#7b8697'});

  // --- las cifras del radiador ---------------------------------------------
  const cw=228;
  tarjeta(42,470,cw,104,'Calor por el radiador',kW(s.Qrad),CIAN,
    'De los '+kW(s.Qgen)+' que hay que sacar en este punto de trabajo.');
  tarjeta(42+cw+14,470,cw,104,'Eficacia',pct(s.eps),
    s.eps>0.5?OK_HEX:WARN_HEX,'NTU '+num(s.NTU,2)+'. Es la fracción del salto máximo que aprovecha.');
  tarjeta(42+2*(cw+14),470,cw,104,'Ciclo del ventilador',
    s.ciclando?pct(s.ciclo):(s.ventilador?'100 %':'apagado'),
    s.ciclo>0.9?BAD_HEX:(s.ciclo>0.5?WARN_HEX:OK_HEX),
    s.ciclando?'La aguja no se mueve; esto sí. Al 100 % ya no queda reserva.':'Con la aguja por debajo de su arranque, el ventilador ni entra.');
  tarjeta(42+3*(cw+14),470,cw,104,'Aire por el frontal',num(s.mAire,2)+NBSP+'kg/s',TINTA,
    'A '+num(G.vKmh,0)+' km/h y '+num(PLZ[G.plaza].alt,0)+' m de altitud.');

  rpanel(42,600,940,146,'rgba(255,255,255,0.030)','#1e2836',10);
  texto('Las dos maneras de tapar un radiador, y por qué no se parecen',56,626,{s:13,b:true,c:CIAN});
  const ri=EQ({falla:'radInterno'}), re=EQ({falla:'radExterno'});
  wrapText('Incrustado por DENTRO cae el lado del refrigerante: aquí el motor se pone a '+gC(ri.T)+' y el salto del radiador baja a '+gC(ri.dtRad)+', porque el refrigerante pasa sin soltar el calor. Tapado por FUERA cae el lado del aire: el motor se pone a '+gC(re.T)+' y se nota sobre todo a velocidad, que es cuando el aire de la marcha era el que hacía el trabajo. La aguja del tablero dice casi lo mismo en los dos casos; el pirómetro sobre los dos manguitos, no.',
    56,650,912,17,{s:12.5});
}

// -------------------------------------------------------- vista REFRIGERANTE
function vistaRefrigerante(){
  const e=MQ(), s=EQ();
  cabecera('Refrigerante y altitud — dónde está el óptimo',
    'La mezcla tira en tres sentidos contrarios: el agua es la que más calor se lleva por litro, el glicol sube el punto de ebullición y baja el de congelación, y el glicol empeora la transferencia dentro del propio radiador. Y la curva de congelación NO es monótona: tiene un mínimo cerca del 60 % y a partir de ahí vuelve a subir. Más glicol no es más protección.');

  // --- curva de congelación -------------------------------------------------
  // Las dos gráficas miden 190 y no 214 de alto: `ejes` escribe el rótulo del eje
  // horizontal 44 px por debajo del marco, y con 214 ese rótulo caía justo encima
  // del título de la tabla. Se ve en la pantalla y en ningún número.
  const P={x:96,y:172,w:404,h:190};
  const M=ejes(P,0,100,-60,10,'glicol en volumen [%]','punto de congelación [°C]',
    v=>num(v,0),v=>num(v,0),5,7);
  const cur=[];
  for(let g=0;g<=100;g+=1) cur.push([g,congelacion(g)]);
  enCaja(P,()=>serieXY(M,cur,AZUL,2.6));
  nivel(P,M,0,'#5d6b7d','se congela a 0 °C',[6,4]);
  punteo(M,G_EUTECTICO,congelacion(G_EUTECTICO),OK_HEX,6.5);
  etiqueta('eutéctico: '+num(G_EUTECTICO,0)+' % → '+gC(congelacion(G_EUTECTICO),0),
    M.X(G_EUTECTICO)+12,M.Y(congelacion(G_EUTECTICO))+18,OK_HEX);
  MEZCLAS.forEach(m=>punteo(M,m.g,congelacion(m.g),COL_MZ[m.key],4.5));
  punteo(M,GLICOL(),congelacion(GLICOL()),TINTA,6);

  // --- ebullición contra presión -------------------------------------------
  const P2={x:614,y:172,w:368,h:190};
  const M2=ejes(P2,0.6,2.6,88,140,'presión absoluta del circuito [bar]','punto de ebullición [°C]',
    v=>num(v,1),v=>num(v,0),4,4);
  MEZCLAS.forEach(m=>{
    const c=[];
    for(let p=0.6;p<=2.6;p+=0.05) c.push([p,ebullicion(p,m.g)]);
    enCaja(P2,()=>serieXY(M2,c,COL_MZ[m.key],m.key===mezclaEfectiva()?2.8:1.6));
  });
  punteo(M2,s.pAbs,s.tEbu,TINTA,6);
  etiqueta(PLZ[G.plaza].corto+' + tapón: '+bar(s.pAbs)+' → '+gC(s.tEbu,0),
    M2.X(s.pAbs)-10,M2.Y(s.tEbu)-10,TINTA,'right');
  nivel(P2,M2,s.T,NARANJA,'el motor está a '+gC(s.T,0));

  // --- la tabla de mezclas --------------------------------------------------
  const filas=MEZCLAS.map(m=>{
    const q=EQ({mezcla:m.key,rpm:2500,carga:1,vKmh:40});
    const eut=(m.g===G_EUTECTICO);
    return {v:[m.rot,
      [gC(congelacion(m.g),0), eut?OK_HEX:(congelacion(m.g)>congelacion(G_EUTECTICO)+2?WARN_HEX:TINTA)],
      num(rhoCp(m.g),3)+NBSP+'MJ/m³K',
      gC(q.tEbu,0), gC(q.T,0),
      [rotMargen(q), q.hierve?BAD_HEX:(sinReserva(q)?WARN_HEX:OK_HEX)]],
      hl:m.key===mezclaEfectiva()?'rgba(91,212,229,0.10)':null,
      b:m.key===mezclaEfectiva()};
  });
  // Veinte píxeles entre el título y la cabecera de la tabla. Con doce, las dos
  // líneas se montan una encima de otra: `tabla` dibuja su cabecera EN la `y` que
  // se le pasa, no debajo.
  texto('Las seis mezclas en la misma cuesta — 2 500 rpm, 40 km/h, pie a fondo',42,430,{s:15,b:true});
  tabla(42,450,[{t:'Mezcla',w:150},{t:'Congela a',w:120,al:'right'},
    {t:'Calor por litro',w:170,al:'right'},{t:'Hierve a',w:120,al:'right'},
    {t:'Motor a',w:120,al:'right'},{t:'Margen',w:150,al:'right'}],filas,{rh:26,s:13});

  rpanel(42,644,940,102,'rgba(255,255,255,0.030)','#1e2836',10);
  texto('Por qué el 70 % es peor que el 60 %',56,670,{s:13,b:true,c:CIAN});
  const q60=EQ({mezcla:'m60',rpm:2500,carga:1,vKmh:40}), q70=EQ({mezcla:'m70',rpm:2500,carga:1,vKmh:40});
  wrapText('Al 70 % el refrigerante se congela a '+gC(congelacion(70),0)+', que es '+
    gC(congelacion(70)-congelacion(60),1)+' PEOR que al 60 % —está pasado el eutéctico—, transporta '+
    pct(1-rhoCp(70)/rhoCp(60))+' menos calor por litro y deja el motor a '+gC(q70.T)+
    ' en vez de a '+gC(q60.T)+'. Lo único que gana es un punto de ebullición '+
    gC(q70.tEbu-q60.tEbu,1)+' más alto, que no compensa nada de lo anterior. Poner glicol de más no es prudencia: es una avería que se paga en las dos puntas.',
    56,692,912,17,{s:12.5});
}

// ------------------------------------------------------------- vista CENSO
function vistaCenso(){
  const e=MQ(), C=CENSO(), NE=ESCEN_KEYS.length;
  cabecera('Censo de instrumentos — ¿con qué se distingue cada avería?',
    'Catorce escenarios y ocho observaciones. El censo prueba TODOS los subconjuntos de observaciones y cuenta cuántos escenarios quedan separados sin ambigüedad. No es una opinión sobre qué instrumento es mejor: es un recuento exhaustivo, y su resultado NO es el mismo en las cuatro máquinas.');

  const porMask=m=>C.find(c=>c.mask===m);
  const mascara=ks=>ks.reduce((a,k)=>a|(1<<OBS.findIndex(o=>o.k===k)),0);
  const soloAguja=porMask(mascara(['tRal','tCarr','tCuesta']));
  const taller=porMask(mascara(OBS.filter(o=>o.taller).map(o=>o.k)));
  const todo=porMask((1<<OBS.length)-1);
  const mejor={};
  for(const c of C){ const n=c.sub.length; if(!mejor[n]||c.resueltos>mejor[n].resueltos) mejor[n]=c; }

  const YM=Math.ceil((NE+1)/2)*2;
  const P={x:96,y:180,w:428,h:194};
  ejes(P,0,1,0,YM,null,'escenarios resueltos de '+NE,null,q=>num(q,0),1,YM/2);
  barras({x:P.x+10,y:P.y,w:P.w-20,h:P.h},
    OBS.map((_,i)=>{ const n=i+1, m=mejor[n];
      return {v:m.resueltos, c:m.resueltos===NE?OK_HEX:(m.resueltos>=NE-3?WARN_HEX:BAD_HEX),
        top:num(m.resueltos,0), rot:n+' obs.'}; }),YM,{gap:8});
  texto('el MEJOR subconjunto de cada tamaño',P.x+P.w/2,P.y+P.h+46,{s:13,c:'#9aa6b6',al:'center'});

  const X0=568, W0=414;
  texto('Los tres cortes que importan',X0,196,{s:15,b:true});
  let y=216;
  [['Sólo la aguja del tablero',soloAguja,'Las tres temperaturas del protocolo y nada más.'],
   ['Todo lo que se mide en el taller',taller,'Temperaturas, pirómetro, ventilador y presión.'],
   ['Las ocho observaciones',todo,'Añade el refractómetro y el detector de gases.']
  ].forEach(([rot,c,pie])=>{
    const ok=c.resueltos===NE;
    rpanel(X0,y,W0,64,'rgba(255,255,255,0.030)',ok?'#2a4436':'#1e2836',10);
    texto(rot,X0+14,y+24,{s:13,b:true});
    texto(num(c.resueltos,0)+' / '+num(NE,0),X0+W0-14,y+26,
      {s:20,b:true,c:ok?OK_HEX:(c.resueltos>=NE-3?WARN_HEX:BAD_HEX),al:'right'});
    texto(pie,X0+14,y+46,{s:11.5,c:'#7b8697'});
    y+=74;
  });

  const min=C.filter(c=>c.resueltos===NE).sort((a,b)=>a.sub.length-b.sub.length)[0];
  texto('El subconjunto más pequeño que resuelve los '+NE,96,442,{s:15,b:true});
  const fil=OBS.map(o=>{
    const dentro=min.sub.some(x=>x.k===o.k);
    return {v:[dentro?'✔':'·',o.rot,
      o.taller?['de taller',GRIS]:['hay que pedirla aparte',WARN_HEX],
      // La resolución con tres decimales publicaba «5,000 °C» donde lo que el
      // taller mide son cinco grados: se escribe con los decimales que tiene.
      o.res===null?'sí / no':num(o.res,o.res<1?1:0)+NBSP+o.uni],
      c:dentro?TINTA:'#75808f'};
  });
  // La tabla arranca 24 px por debajo del título: a 10 px, su fila de cabecera
  // se montaba encima del título y las dos líneas salían pisadas.
  tabla(96,462,[{t:'',w:18,al:'center'},{t:'Observación',w:396},
    {t:'¿Se puede tomar en el taller?',w:230},{t:'Resolución',w:160,al:'right'}],fil,{rh:23,s:12.5});

  rpanel(96,668,886,78,'rgba(255,255,255,0.030)','#1e2836',10);
  texto('Censo para el '+e.corto,110,692,{s:13,b:true,c:CIAN});
  // Se NOMBRA lo que sale de ESTA máquina en vez de afirmar un teorema fijo:
  // el resultado cambia de una a otra —en el 1.6 el taller solo alcanza y en
  // las otras tres no— y una frase única sería falsa en tres pantallas.
  const bastaTaller=taller.resueltos===NE;
  wrapText('Con todo lo que se mide en el taller se separan '+taller.resueltos+' de los '+NE+
    (bastaTaller?', que en esta máquina alcanza para todos. '
      :', y por tanto en esta máquina el taller solo NO alcanza. ')+
    'El subconjunto más pequeño que los separa tiene '+min.sub.length+': '+
    min.sub.map(o=>corta(o.rot.replace(/\s*\([^)]*\)/,''),46).toLowerCase()).join(', ')+
    '. Cámbiese de máquina y el recuento cambia: no hay una regla única sobre qué instrumentos hacen falta, hay un censo por motor.',
    110,712,862,15,{s:11.5});
}

// ----------------------------------------------------------------- vista RETO
function vistaReto(){
  const e=MQ();
  cabecera('Diagnóstico a ciegas',
    'Hay una avería montada y no se dice cuál. Se compran observaciones —las de taller son baratas, las otras dos no— y se nombra la familia. El censo ya demostró que con la aguja del tablero sola no alcanza en ninguna de las cuatro máquinas.');

  texto('Cuaderno del técnico',96,152,{s:15,b:true});
  const fil=OBS.map(o=>{
    const t=RETO.tomadas[o.k];
    return {v:[t?'✔':'·',o.rot,t?[t,CIAN]:['— sin tomar —','#5b6675']],
      c:t?TINTA:'#75808f'};
  });
  tabla(96,164,[{t:'',w:18,al:'center'},{t:'Observación',w:462},{t:'Lo medido',w:366}],fil,{rh:25,s:13});

  texto('Familias candidatas — '+FAMILIAS.length,96,406,{s:15,b:true});
  FAMILIAS.forEach((f,i)=>{
    const x=96+(i%2)*448, yy=420+Math.floor(i/2)*34, sel=(RETO.eleccion===f);
    rpanel(x,yy,428,28,sel?'rgba(138,180,248,0.14)':'rgba(255,255,255,0.025)',sel?AZUL:'#1e2836',8);
    texto((sel?'▸ ':'   ')+f,x+12,yy+19,{s:13,c:sel?TINTA:'#9aa6b6'});
  });

  const V=RETO.veredicto;
  rpanel(96,608,886,138,'rgba(255,255,255,0.030)',V?(V.ok?'#2a4436':'#4a2b2b'):'#1e2836',10);
  if(V){
    texto(V.ok?'Acertaste':'Fallaste',110,634,{s:16,b:true,c:V.ok?OK_HEX:BAD_HEX});
    wrapText(V.plano,110,658,862,16,{s:12.5,c:'#c3ccd8'});
  }else{
    texto('Sin entregar',110,634,{s:16,b:true,c:WARN_HEX});
    wrapText('Compra en el panel las observaciones que necesites, elige una familia y entrega el diagnóstico. Entregar sin el refractómetro ni el detector de gases es legítimo —a veces basta—, pero el censo dice en qué máquinas no puede bastar.',
      110,658,862,16,{s:12.5});
    texto('Motor en el banco: '+e.nombre,110,726,{s:12,c:'#7b8697'});
  }
}

// ------------------------------------------------------------------ despacho
const VISTA={ensamble:vistaEnsamble, balance:vistaBalance, termostato:vistaTermostato,
  radiador:vistaRadiador, refrigerante:vistaRefrigerante, censo:vistaCenso, reto:vistaReto};
function pintaTablero(){
  bg();
  (VISTA[G.modo]||vistaEnsamble)();
  btex.needsUpdate=true;
}

// ============================================================ T3a · EL MOTOR
// El motor se dibuja en corte y A ESCALA: un milímetro del arquetipo son ESC
// unidades de escena. El diámetro, la carrera y el número de cilindros salen
// del mismo objeto ARQ que usa el modelo numérico, así que cambiar de máquina
// cambia la geometría y las cifras a la vez y no pueden desmentirse entre sí.
//
// SIMPLIFICACIONES DECLARADAS (van también en el contrato de fidelidad):
//  · El corte es longitudinal y por delante: se ven los cilindros y, alrededor,
//    la CAMISA DE AGUA, que es lo único que esta práctica necesita del motor.
//    No hay cigüeñal, ni bielas, ni distribución.
//  · Los cuatro arquetipos se dibujan con sus cilindros EN LÍNEA, también el
//    V8. Ninguna cifra del modelo depende de la disposición de los cilindros.
//  · La camisa de agua se pinta del color de la TEMPERATURA que publica el
//    modelo, y esa es la única información que transmite: no representa ni
//    velocidad ni presión del refrigerante.
const ESC=0.010;
const YC=0.62;                        // raíz del bloque sobre el soporte

function dims(e){
  const B=e.B*ESC, S=e.S*ESC;
  const px=1.28*B;                                     // paso entre cilindros
  const luz=(e.nCil-1)*px;
  const anchoTot=Math.max(luz+1.30*B,1.6);
  return {B,S,px,luz,anchoTot,
    rCil:B/2,
    hCil:S*1.06,                                       // altura útil del cilindro
    dPared:1.05*B,                                     // fondo del bloque
    yDeck:YC+S*1.30,                                   // plano de junta de culata
    hCul:0.42*B,                                       // culata
    yCam:YC+S*0.62,                                    // eje de la camisa de agua
    yCar:YC-0.30*B, hCar:0.56*B};                      // cárter (sólo silueta)
}
const xCilindro=(i,D,e)=>-D.luz/2+i*D.px;

// Referencias vivas de la escena. Se separan a propósito en dos familias: lo
// que pertenece al MOTOR, que se rehace al cambiar de arquetipo, y lo que
// pertenece al KIT, que lo gestiona el ensamble.
const RIG={motor:null, camisa:[], piezas:{},
  aguja:null, testigo:null, aspa:null, ceraCuerpo:null, ceraVastago:null,
  nucleoRad:null, aletas:null, tanque:null, nivelDep:null};

// Rótulo REESCRIBIBLE. El `labelSprite` del kit hornea el texto en su textura y
// no se puede cambiar; aquí hay rótulos que cambian con cada punto de trabajo,
// y crear un sprite nuevo por fotograma fuga memoria de vídeo.
function rotulo(color){
  const w=560,h=96;
  const lienzo=document.createElement('canvas'); lienzo.width=w; lienzo.height=h;
  const g=lienzo.getContext('2d');
  const tx=new THREE.CanvasTexture(lienzo); tx.colorSpace=THREE.SRGBColorSpace;
  tx.generateMipmaps=true; tx.minFilter=THREE.LinearMipmapLinearFilter;
  tx.magFilter=THREE.LinearFilter; tx.anisotropy=8;
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthTest:false,transparent:true}));
  sp.scale.set(0.30*(w/h),0.30,1); sp.renderOrder=999;
  sp.userData.set=(txt,col)=>{
    const c=col||color;
    g.clearRect(0,0,w,h);
    // El lienzo tiene un ancho FIJO y fillText no recorta: desborda por las dos
    // puntas y el rótulo sale mutilado. Si el texto no cabe se encoge la letra.
    let px=36;
    g.font='bold '+px+'px Outfit, system-ui, sans-serif';
    const util=w-64, bruto=g.measureText(txt).width;
    if(bruto>util){
      px=Math.max(17,Math.floor(px*util/bruto));
      g.font='bold '+px+'px Outfit, system-ui, sans-serif';
    }
    const tw=Math.max(150,Math.min(w-8,g.measureText(txt).width+56)), x0=(w-tw)/2, r=18;
    g.beginPath();
    g.moveTo(x0+r,3); g.arcTo(x0+tw,3,x0+tw,93,r); g.arcTo(x0+tw,93,x0,93,r);
    g.arcTo(x0,93,x0,3,r); g.arcTo(x0,3,x0+tw,3,r); g.closePath();
    g.fillStyle='rgba(8,11,16,0.95)'; g.fill();
    g.strokeStyle=c; g.lineWidth=3; g.stroke();
    g.fillStyle=c; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,w/2,48);
    tx.needsUpdate=true;
  };
  sp.userData.set('—',color);
  return sp;
}

function limpiaMotor(){
  if(RIG.motor){
    scene.remove(RIG.motor);
    RIG.motor.traverse(o=>{ if(o.geometry) o.geometry.dispose(); });
  }
  // Se limpia SOLO lo del motor. Las piezas del kit tienen su propio ciclo de
  // vida: ponerlas a null aquí las deja huérfanas en la escena y no se ve hasta
  // que se cambia de arquetipo.
  RIG.motor=null; RIG.camisa=[];
}

function construyeMotor(){
  limpiaMotor();
  const e=MQ(), D=dims(e);
  const raiz=new THREE.Group(); raiz.position.set(0,0.86,0); scene.add(raiz); RIG.motor=raiz;

  // --- bloque en corte ------------------------------------------------------
  // El bloque va partido por un plano vertical delante del eje de los cilindros:
  // dibujarlo entero deja una pared lisa y no se ve ni una camisa de agua, que
  // es lo único que hay que ver aquí.
  const zPared=-0.30*D.B, dPared=D.dPared;
  const alto=D.yDeck-YC;
  {
    const blq=roundedBox(D.anchoTot,alto,dPared,MAT.bloque,0.03);
    blq.position.set(0,YC+alto/2,zPared-dPared/2); blq.castShadow=true; raiz.add(blq);
    const cul=roundedBox(D.anchoTot,D.hCul,dPared*0.96,MAT.culata,0.02);
    cul.position.set(0,D.yDeck+D.hCul/2,zPared-dPared/2); raiz.add(cul);
    const jun=roundedBox(D.anchoTot*1.01,0.012,dPared*0.98,
      std({color:0x2b3340,metalness:0.4,roughness:0.7}),0.004);
    jun.position.set(0,D.yDeck,zPared-dPared/2); raiz.add(jun);
    const car=roundedBox(D.anchoTot*0.98,D.hCar,dPared*0.92,MAT.bloque,0.02);
    car.position.set(0,D.yCar-D.hCar/2,zPared-dPared/2); raiz.add(car);
  }

  // --- cilindros y camisa de agua ------------------------------------------
  // Cada cilindro es un tubo de acero y a su alrededor un anillo de refrigerante.
  // El anillo es lo que se pinta del color de la temperatura, y es literalmente
  // el sitio donde el modelo dice que el calor entra al circuito.
  for(let i=0;i<e.nCil;i++){
    const x=xCilindro(i,D,e);
    const cam=new THREE.Mesh(
      new THREE.CylinderGeometry(D.rCil*1.30,D.rCil*1.30,D.hCil,26,1,true,-Math.PI/2,Math.PI),
      // La camisa va bastante traslúcida a propósito: a opacidad alta tapa por
      // completo el cilindro y el pistón que tiene dentro, y en pantalla deja de
      // parecer una camisa de agua alrededor del cilindro para parecer un bidón.
      std({color:0x5BD4E5,emissive:0x5BD4E5,emissiveIntensity:0.45,
        transparent:true,opacity:0.36,roughness:0.30,side:THREE.DoubleSide}));
    cam.position.set(x,D.yCam,-0.02*D.B); raiz.add(cam);
    RIG.camisa.push(cam);
    const cil0=new THREE.Mesh(
      new THREE.CylinderGeometry(D.rCil,D.rCil,D.hCil*1.04,26,1,true,-Math.PI/2,Math.PI),
      std({...brush,color:0x8e9099,metalness:1.0,roughness:0.34,side:THREE.DoubleSide}));
    cil0.position.set(x,D.yCam,-0.02*D.B); raiz.add(cil0);
    const pis=new THREE.Mesh(new THREE.CylinderGeometry(D.rCil*0.97,D.rCil*0.97,D.B*0.52,24),
      std({...alu,color:0x9aa2ad,metalness:0.7,roughness:0.42}));
    pis.position.set(x,D.yCam-D.hCil*0.18-(i%2)*D.S*0.34,-0.02*D.B); raiz.add(pis);
    const et=labelSprite('cilindro '+(i+1),'#5BD4E5');
    et.position.set(x,D.yDeck+D.hCul+0.16,0.30*D.B); et.scale.multiplyScalar(0.44); raiz.add(et);
  }
  // La galería de agua de la culata: el colector que recoge de los cuatro
  // cilindros y lleva al termostato.
  {
    const gal=new THREE.Mesh(
      new THREE.CylinderGeometry(0.055,0.055,D.anchoTot*0.94,18),
      std({color:0x5BD4E5,emissive:0x5BD4E5,emissiveIntensity:0.40,
        transparent:true,opacity:0.60,roughness:0.3}));
    gal.rotation.z=Math.PI/2; gal.position.set(0,D.yDeck+D.hCul*0.55,0.06*D.B);
    raiz.add(gal); RIG.camisa.push(gal);
  }

  // --- soporte del banco ----------------------------------------------------
  {
    const base=roundedBox(D.anchoTot+0.70,0.10,1.30,MAT.banco,0.03);
    base.position.set(0,-0.86,0); base.receiveShadow=true; raiz.add(base);
    for(const sx of [-1,1]) for(const sz of [-1,1]){
      const p=new THREE.Mesh(new THREE.BoxGeometry(0.11,0.72,0.11),MAT.banco);
      p.position.set(sx*(D.anchoTot/2+0.22),-0.50,sz*0.50); raiz.add(p);
    }
  }

  raiz.position.y=0.86;
  // El 5.0 V8 mide bastante más que el 1.6. Con un encuadre fijo se sale del
  // cuadro; con este factor la cámara y el pizarrón se separan lo justo.
  G.k=Math.max(1,(D.anchoTot+0.70)/4.6);
  colocaTablero(D.anchoTot);
  return raiz;
}

// ============================================ T3b · EL CIRCUITO DE REFRIGERACIÓN
const nuevaFantasma=()=>std({color:0x5BD4E5,transparent:true,opacity:0.26,
  depthWrite:false,side:THREE.DoubleSide});
const MAT_CRISTAL=std({color:0xffffff,transparent:true,opacity:0.16,roughness:0.06,metalness:0.0});
const MAT_LATON=std({color:0xC8A24A,metalness:1.0,roughness:0.30});

function cil(r0,r1,h,mat,seg){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,seg||22),mat);
  m.castShadow=true; return m;
}
function tubo(pts,r,mat){
  const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),
    Math.max(12,pts.length*8),r,10,false),mat);
  m.castShadow=true; return m;
}
function centra(g){
  const dentro=new THREE.Group();
  while(g.children.length) dentro.add(g.children[0]);
  const caja=new THREE.Box3().setFromObject(dentro);
  const c=new THREE.Vector3(); caja.getCenter(c);
  dentro.position.copy(c).negate();
  g.add(dentro);
  g.userData.home=c.clone(); g.userData.minY=caja.min.y-c.y;
  g.position.copy(c); return g;
}
function borra(o){
  o.traverse(n=>{ if(n.isMesh&&n.geometry) n.geometry.dispose(); });
  if(o.userData.gm) o.userData.gm.dispose();
  if(o.parent) o.parent.remove(o);
}
// Esfera del indicador. Devuelve el grupo con setFrac: la aguja NUNCA se mueve a
// ojo, recibe la fracción de escala que le calcula el motor sellado.
function esfera(r,rojo){
  const g=new THREE.Group();
  const caja=cil(r,r,0.055,MAT.crom,34); caja.rotation.x=Math.PI/2; g.add(caja);
  const cara=cil(r*0.92,r*0.92,0.010,MAT_ESFERA,34); cara.rotation.x=Math.PI/2;
  cara.position.z=0.029; g.add(cara);
  const vid=cil(r*0.93,r*0.93,0.006,MAT_CRISTAL,34); vid.rotation.x=Math.PI/2;
  vid.position.z=0.036; g.add(vid);
  // Zona roja: por encima de la alarma del fabricante. Es la única marca de la
  // esfera que significa algo por sí sola.
  if(rojo>0&&rojo<1){
    // Las marcas van medidas desde las 12 y en el sentido del reloj;
    // RingGeometry mide desde el eje X y al revés. La conversión se hace aquí
    // una vez: girar la malla a ojo deja la zona roja en el lado que no es.
    const f=clamp(rojo,0,1);
    const arc=new THREE.Mesh(new THREE.RingGeometry(r*0.66,r*0.86,44,1,
      Math.PI/2-135*DEG-(1-f)*270*DEG, (1-f)*270*DEG), std({color:0xff5252,roughness:0.9}));
    arc.position.z=0.032; g.add(arc);
  }
  for(let i=0;i<=10;i++){
    const a=(-135+i*27)*DEG;
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.006,r*0.16,0.004),std({color:0x1a2029,roughness:0.9}));
    m.position.set(Math.sin(a)*r*0.76,Math.cos(a)*r*0.76,0.034); m.rotation.z=-a; g.add(m);
  }
  const ag=new THREE.Group(); ag.position.z=0.038; g.add(ag);
  const cuerpo=new THREE.Mesh(new THREE.BoxGeometry(0.010,r*1.52,0.006),MAT_AGUJA);
  cuerpo.position.y=r*0.50; ag.add(cuerpo);
  ag.add(cil(0.016,0.016,0.012,MAT.crom,14).rotateX(Math.PI/2));
  g.userData.setFrac=f=>{ ag.rotation.z=-(-135+clamp(f,0,1)*270)*DEG; };
  g.userData.setFrac(0);
  return g;
}

// --------------------------------------------------------------- las 7 piezas
// Cada pieza se declara con lo que HACE y con lo que pasa si falta. Ese texto es
// el que sale en el pizarrón y en el aviso al montarla: la pieza y su papel se
// escriben una sola vez.
const PART={
  bomba:{ rot:'Bomba de agua',
    fn:'Empuja el refrigerante por el bloque; la mueve la correa del motor.',
    sin:'Sin ella no circula nada: el bloque hierve y el radiador se queda frío.',
    para:'Bomba centrífuga arrastrada por la correa. Su caudal va con el régimen del motor y con lo abierto que esté el circuito. Es la pieza que hace que el salto de temperatura del motor sea PEQUEÑO.',
    nota:'Ahora el refrigerante se mueve.'},
  termostato:{ rot:'Termostato',
    fn:'Decide cuánto caudal va al radiador y cuánto vuelve por la derivación.',
    sin:'Sin él no hay regulación: o el motor no calienta nunca o no se enfría.',
    para:'Válvula de cera: cerrada por debajo de su tarado y abriendo del todo unos quince grados más arriba. NO está para enfriar, está para que el motor caliente pronto y se quede donde toca.',
    nota:'Ahora el motor puede regular su temperatura.'},
  radiador:{ rot:'Radiador',
    fn:'Cambiador de calor entre el refrigerante y el aire del frontal.',
    sin:'Sin él no hay por dónde sacar el calor: sólo queda la superficie del bloque.',
    para:'Cambiador de flujo cruzado. No tiene una «capacidad» fija: disipa lo que le dejan los dos caudales y el salto contra el aire, y por eso el mismo radiador rinde distinto parado que a 120 km/h.',
    nota:'Ahora hay por dónde sacar el calor.'},
  ventilador:{ rot:'Electroventilador',
    fn:'Mete aire por el radiador cuando el coche va despacio o está parado.',
    sin:'Sin él, parado y en un día de calor el motor se pasa de su alarma.',
    para:'Se enciende por temperatura y es un INTERRUPTOR, no un mando continuo: cuando el equilibrio cae en su punto de arranque, cicla, y su ciclo de trabajo es la mejor medida de margen que tiene el coche.',
    nota:'Ahora el radiador tiene aire también parado.'},
  tapon:{ rot:'Tapón de presión y depósito',
    fn:'Sostiene la presión del circuito y recoge lo que se dilata.',
    sin:'Sin él el circuito trabaja a la presión de la calle y hierve muchísimo antes.',
    para:'Válvula de alivio tarada. No cambia la temperatura del motor ni un grado: cambia la temperatura a la que el refrigerante hierve, que es otra cosa. Es la avería más barata de arreglar y la más cara de ignorar.',
    nota:'Ahora el circuito aguanta presión.'},
  calefactor:{ rot:'Radiador de calefacción',
    fn:'Segundo cambiador, contra el aire de la cabina.',
    sin:'Sin él no hay calefacción, y se pierde el radiador de emergencia.',
    para:'Es un radiador pequeño en paralelo. Con el motor frío y parado le roba tanto calor que impide que caliente —por eso en invierno no sale aire caliente hasta que el coche anda— y con el motor caliente es un radiador de emergencia.',
    nota:'Ahora hay calefacción, y una salida más de calor.'},
  sensor:{ rot:'Sensor y aguja del tablero',
    fn:'Mide la temperatura de salida del bloque y la lleva al tablero.',
    sin:'Sin él el conductor conduce a ciegas.',
    para:'Mide la temperatura de SALIDA del bloque, que el termostato clava en su tarado mientras pueda. Por eso la aguja está quieta en un abanico enorme de puntos de trabajo con márgenes completamente distintos: la aguja no mide el margen.',
    nota:'Ahora se ve lo poco que ve el conductor.'},
};
const ORDEN=['bomba','termostato','radiador','ventilador','tapon','calefactor','sensor'];
const PARTS=ORDEN.map(k=>({k,...PART[k],build:()=>BUILD[k]()}));
const ASM={done:new Set(), sel:null};

// Anclas: dónde va cada pieza sobre el motor. Se calculan de las dimensiones
// REALES del arquetipo, no con coordenadas escritas a mano, porque el V8 mide
// bastante más que el 1.6 y unas coordenadas fijas lo meten dentro del bloque.
function ancla(){
  const e=MQ(), D=dims(e), y0=0.86;
  const xIzq=-D.anchoTot/2, xDer=D.anchoTot/2;
  return {
    bomba:      new THREE.Vector3(xIzq-0.34, y0+YC+D.S*0.30, 0.30*D.B),
    termostato: new THREE.Vector3(xDer+0.30, y0+D.yDeck+D.hCul*0.55, 0.16*D.B),
    radiador:   new THREE.Vector3(xDer+1.70, y0+YC+D.S*0.72, 0.52),
    ventilador: new THREE.Vector3(xDer+1.70, y0+YC+D.S*0.72, -0.30),
    tapon:      new THREE.Vector3(xDer+1.70, y0+D.yDeck+D.hCul+0.44, 0.52),
    calefactor: new THREE.Vector3(xIzq-0.30, y0+D.yDeck+D.hCul*0.30, -0.62),
    sensor:     new THREE.Vector3(xDer+0.26, y0+D.yDeck+D.hCul+0.52, 0.62),
  };
}
const posDe=k=>ancla()[k];

// ------------------------------------------------------------- constructores
const BUILD={
  bomba(){
    const g=new THREE.Group();
    const vol=cil(0.20,0.20,0.16,std({...alu,color:0x828a94,metalness:0.60,roughness:0.55}),30);
    vol.rotation.x=Math.PI/2; g.add(vol);
    const cue=cil(0.085,0.085,0.24,MAT.acero,18); cue.rotation.x=Math.PI/2;
    cue.position.z=-0.18; g.add(cue);
    const pol=cil(0.15,0.15,0.05,MAT.crom,28); pol.rotation.x=Math.PI/2;
    pol.position.z=-0.31; g.add(pol);
    // El impulsor gira: sin él la bomba es una caja y no se ve que mueva nada.
    const rot=new THREE.Group(); rot.position.z=0.05; g.add(rot);
    for(let i=0;i<7;i++){
      const p=roundedBox(0.024,0.13,0.055,MAT_LATON,0.008);
      p.position.set(Math.sin(i/7*Math.PI*2)*0.075,Math.cos(i/7*Math.PI*2)*0.075,0);
      p.rotation.z=-i/7*Math.PI*2; rot.add(p);
    }
    rot.add(cil(0.038,0.038,0.07,MAT.crom,14).rotateX(Math.PI/2));
    const bo=cil(0.055,0.055,0.14,MAT.acero,16); bo.position.set(0,-0.22,0); g.add(bo);
    g.userData.rotor=rot;
    return g;
  },
  termostato(){
    const g=new THREE.Group();
    const carc=cil(0.145,0.145,0.20,std({...alu,color:0x868e98,metalness:0.55,roughness:0.52}),26);
    g.add(carc);
    const tapa=cil(0.155,0.130,0.05,MAT.acero,26); tapa.position.y=0.125; g.add(tapa);
    const sal=cil(0.075,0.075,0.20,MAT.acero,18); sal.rotation.z=Math.PI/2;
    sal.position.set(0.20,0.05,0); g.add(sal);
    // El elemento de cera y su vástago: lo que se ve moverse ES la apertura.
    const cera=cil(0.055,0.055,0.10,MAT_CERA,18); cera.position.y=-0.05; g.add(cera);
    const vast=new THREE.Group(); g.add(vast);
    const pl=cil(0.115,0.115,0.014,MAT_LATON,24); pl.position.y=0.02; vast.add(pl);
    const va=cil(0.016,0.016,0.10,MAT.crom,10); va.position.y=0.07; vast.add(va);
    g.userData.ceraCuerpo=cera; g.userData.ceraVastago=vast;
    return g;
  },
  radiador(){
    const g=new THREE.Group();
    const W=1.06, H=0.78;
    const nuc=roundedBox(W,H,0.10,MAT_ALETA,0.01); g.add(nuc);
    // Las aletas: sin ellas el radiador es una plancha y no se lee de qué va.
    for(let i=0;i<13;i++){
      const a=roundedBox(W*0.97,0.008,0.13,std({color:0x4a5663,metalness:0.68,roughness:0.44}),0.003);
      a.position.set(0,-H/2+0.045+i*(H-0.09)/12,0.005); g.add(a);
    }
    for(const sy of [-1,1]){
      const t=roundedBox(W*1.04,0.13,0.14,MAT_TANQ,0.03);
      t.position.set(0,sy*(H/2+0.055),0); g.add(t);
    }
    const ent=cil(0.062,0.062,0.16,MAT.acero,16); ent.rotation.z=Math.PI/2;
    ent.position.set(-W/2-0.10,H/2+0.055,0); g.add(ent);
    const sal=cil(0.062,0.062,0.16,MAT.acero,16); sal.rotation.z=Math.PI/2;
    sal.position.set(-W/2-0.10,-H/2-0.055,0); g.add(sal);
    g.userData.nucleo=nuc;
    return g;
  },
  ventilador(){
    const g=new THREE.Group();
    const aro=new THREE.Mesh(new THREE.TorusGeometry(0.40,0.030,10,44),MAT.caja);
    g.add(aro);
    for(let i=0;i<4;i++){
      const b=roundedBox(0.026,0.80,0.026,MAT.caja,0.008);
      b.rotation.z=i*Math.PI/4; g.add(b);
    }
    const asp=new THREE.Group(); g.add(asp);
    for(let i=0;i<5;i++){
      const p=roundedBox(0.10,0.34,0.016,std({...plas,color:0x1c232c,roughness:0.6}),0.02);
      p.position.set(Math.sin(i/5*Math.PI*2)*0.20,Math.cos(i/5*Math.PI*2)*0.20,0.012);
      p.rotation.z=-i/5*Math.PI*2+0.5; asp.add(p);
    }
    asp.add(cil(0.075,0.075,0.06,MAT.acero,16).rotateX(Math.PI/2));
    g.userData.aspa=asp;
    return g;
  },
  tapon(){
    const g=new THREE.Group();
    const dep=cil(0.155,0.155,0.34,MAT_VIDRIO,26); g.add(dep);
    const niv=cil(0.140,0.140,0.16,std({color:0x5BD4E5,emissive:0x5BD4E5,
      emissiveIntensity:0.40,transparent:true,opacity:0.72,roughness:0.3}),24);
    niv.position.y=-0.08; g.add(niv);
    const tap=cil(0.115,0.130,0.075,std({...plas,color:0x1e2731,roughness:0.55}),24);
    tap.position.y=0.20; g.add(tap);
    for(let i=0;i<10;i++){
      const d=roundedBox(0.016,0.075,0.020,std({...plas,color:0x2a3441,roughness:0.6}),0.004);
      d.position.set(Math.sin(i/10*Math.PI*2)*0.122,0.20,Math.cos(i/10*Math.PI*2)*0.122);
      d.rotation.y=-i/10*Math.PI*2; g.add(d);
    }
    const mue=new THREE.Mesh(new THREE.TorusGeometry(0.070,0.010,8,26),MAT.crom);
    mue.rotation.x=Math.PI/2; mue.position.y=0.155; g.add(mue);
    const man=cil(0.042,0.042,0.14,MAT.acero,14); man.rotation.z=Math.PI/2;
    man.position.set(-0.20,-0.10,0); g.add(man);
    g.userData.nivel=niv;
    return g;
  },
  calefactor(){
    const g=new THREE.Group();
    const nuc=roundedBox(0.40,0.32,0.08,MAT_ALETA,0.01); g.add(nuc);
    for(let i=0;i<7;i++){
      const a=roundedBox(0.38,0.006,0.10,std({color:0x4a5663,metalness:0.68,roughness:0.44}),0.002);
      a.position.set(0,-0.14+i*0.047,0.004); g.add(a);
    }
    for(const sy of [-1,1]){
      const t=roundedBox(0.42,0.06,0.10,MAT_TANQ,0.02);
      t.position.set(0,sy*0.19,0); g.add(t);
    }
    // El ventilador de la cabina: pequeño, y por eso su caudal de aire lo es.
    const sop=cil(0.16,0.16,0.10,MAT.caja,22); sop.rotation.x=Math.PI/2;
    sop.position.z=-0.16; g.add(sop);
    for(let i=0;i<6;i++){
      const p=roundedBox(0.05,0.13,0.010,std({...plas,color:0x232c36,roughness:0.6}),0.01);
      p.position.set(Math.sin(i/6*Math.PI*2)*0.075,Math.cos(i/6*Math.PI*2)*0.075,-0.16);
      p.rotation.z=-i/6*Math.PI*2+0.5; g.add(p);
    }
    for(const sx of [-1,1]){
      const t=cil(0.032,0.032,0.14,MAT.acero,12); t.rotation.z=Math.PI/2;
      t.position.set(sx*0.27,0.19,0); g.add(t);
    }
    return g;
  },
  sensor(){
    const g=new THREE.Group();
    const bul=cil(0.045,0.055,0.11,MAT_LATON,16); bul.position.y=-0.30; g.add(bul);
    const cab=tubo([new THREE.Vector3(0,-0.24,0),new THREE.Vector3(0.03,-0.10,0.02),
      new THREE.Vector3(0,0.02,0)],0.011,MAT.goma); g.add(cab);
    const marco=roundedBox(0.56,0.34,0.05,std({...plas,color:0x161c24,roughness:0.6}),0.03);
    marco.position.y=0.20; g.add(marco);
    const es=esfera(0.125,0.0); es.position.set(-0.11,0.20,0.036); g.add(es);
    // El testigo rojo: se enciende con la alarma, ni un grado antes.
    const tes=cil(0.030,0.030,0.020,std({color:0x3a1418,emissive:0x000000,
      emissiveIntensity:0,roughness:0.4}),16);
    tes.rotation.x=Math.PI/2; tes.position.set(0.14,0.26,0.038); g.add(tes);
    const lab=labelSprite('C   H','#8c98a9');
    lab.position.set(-0.11,0.075,0.05); lab.scale.multiplyScalar(0.30); g.add(lab);
    g.userData.dial=es; g.userData.testigo=tes;
    return g;
  },
};

// ---------------------------------------------------------------- el banco
const STAGE_S=0.60;
// El banco va DELANTE del motor: a un costado choca con el bloque en cuanto el
// motor es el V8, que mide bastante más.
const BENCH={cx:0.0,cz:4.55,top:0.90,cols:4,dx:1.00,dz:1.02,pedH:0.24};
const NFIL=Math.ceil(PARTS.length/BENCH.cols), PED_Y=BENCH.top+BENCH.pedH;
function pedXZ(i){
  const c=i%BENCH.cols, f=Math.floor(i/BENCH.cols);
  return [BENCH.cx+(c-(BENCH.cols-1)/2)*BENCH.dx, BENCH.cz+(f-(NFIL-1)/2)*BENCH.dz];
}
const peds=[];
// El banco entero se guarda para poder APAGARLO. Una vez montado el circuito, el
// banco está vacío y sus siete aros luminosos se quedan en primer plano tapando
// media escena y sembrando de resplandor el pizarrón —el `bloom` los recoge y
// los reparte por encima del texto—. Un banco vacío delante del motor no informa
// de nada; se enciende sólo cuando hay algo que montar.
let banco=null;
(function levantaBanco(){
  const g=new THREE.Group(); banco=g;
  const w=BENCH.cols*BENCH.dx+0.42, d=NFIL*BENCH.dz+0.42;
  const losa=roundedBox(w,0.10,d,MAT.banco,0.04);
  losa.position.set(BENCH.cx,BENCH.top,BENCH.cz); g.add(losa);
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const pa=roundedBox(0.10,BENCH.top,0.10,MAT.acero,0.20);
    pa.position.set(BENCH.cx+sx*(w/2-0.15),BENCH.top/2,BENCH.cz+sz*(d/2-0.15)); g.add(pa);
  }
  PARTS.forEach((p,i)=>{
    const [x,z]=pedXZ(i), pg=new THREE.Group(); pg.position.set(x,0,z);
    const cu=cil(0.23,0.27,BENCH.pedH,MAT.banco,26);
    cu.position.y=BENCH.top+BENCH.pedH/2; pg.add(cu);
    const pl=cil(0.25,0.25,0.03,MAT.acero,26); pl.position.y=PED_Y; pg.add(pl);
    const mm2=emis(0x2AA6B8,0.85);
    const an=new THREE.Mesh(new THREE.TorusGeometry(0.26,0.013,10,40),mm2);
    an.rotation.x=-Math.PI/2; an.position.y=PED_Y+0.02; pg.add(an);
    const lb=labelSprite(String(i+1),'#9fb2c6');
    lb.position.set(0,BENCH.top+0.14,0); lb.scale.multiplyScalar(0.44); pg.add(lb);
    g.add(pg); peds.push({mat:mm2});
  });
  scene.add(g);
})();
function muestraBanco(v){ if(banco) banco.visible=v; }
function pedLibre(i){ const p=peds[i]; if(!p) return;
  p.mat.color.setHex(0x2AA6B8); p.mat.emissive.setHex(0x2AA6B8); p.mat.emissiveIntensity=0.85; }
function pedHecho(i){ const p=peds[i]; if(!p) return;
  p.mat.color.setHex(0x7CD992); p.mat.emissive.setHex(0x7CD992); p.mat.emissiveIntensity=0.30; }

// ---------------------------------------------------------------- ensamble
let fantasmas=[], moviles=[], tweens=[], montadas=[];
let TH=0, animT=0;
const ease=x=>x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
let toastT=null;
function showToast(html,ms){
  const t=el('toast'); t.innerHTML=html; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms||3800);
}
function limpiaKit(){
  [...fantasmas,...moviles,...montadas].forEach(o=>borra(o));
  fantasmas=[]; moviles=[]; montadas=[]; tweens=[]; ASM.sel=null;
  RIG.piezas={}; RIG.aguja=null; RIG.testigo=null; RIG.aspa=null;
  RIG.ceraCuerpo=null; RIG.ceraVastago=null; RIG.rotor=null;
  RIG.nucleoRad=null; RIG.nivelDep=null;
}
function haz(p){ const g=p.build(); centra(g); g.userData.pid=p.k; return g; }
// Registra los mandos internos de la pieza recién montada: la aguja, el testigo,
// el impulsor, el aspa, la cera y el nivel del depósito. Sin esto la pieza sería
// un adorno; con esto, la pieza es lo que el modelo dice que hace.
// Los constructores publican sus mandos por userData y NO escriben en RIG: si
// lo hicieran, el fantasma —que se construye con el mismo constructor— pisaría
// la referencia de la pieza montada.
function registra(o){
  const k=o.userData.id, u=o.userData;
  RIG.piezas[k]=o;
  if(k==='sensor'){ RIG.aguja=u.dial; RIG.testigo=u.testigo; }
  if(k==='ventilador') RIG.aspa=u.aspa;
  if(k==='bomba') RIG.rotor=u.rotor;
  if(k==='termostato'){ RIG.ceraCuerpo=u.ceraCuerpo; RIG.ceraVastago=u.ceraVastago; }
  if(k==='radiador') RIG.nucleoRad=u.nucleo;
  if(k==='tapon') RIG.nivelDep=u.nivel;
}
function reposiciona(){
  const A=ancla();
  montadas.forEach(o=>{
    if(tweens.some(w=>w.o===o)) return;
    o.position.copy(A[o.userData.id]);
  });
  fantasmas.forEach(f=>{
    f.position.copy(A[f.userData.id]);
    f.userData.home=A[f.userData.id].clone();
  });
  armaCircuito();
}
function montaKit(){
  limpiaKit();
  PARTS.forEach(p=>{
    const g=haz(p); g.userData.kind='placed'; g.userData.id=p.k;
    scene.add(g); montadas.push(g); ASM.done.add(p.k); registra(g);
  });
  peds.forEach((_,i)=>pedHecho(i));
  reposiciona();
}
function initAssembly(){
  limpiaKit(); ASM.done.clear();
  PARTS.forEach((p,i)=>{
    const g=haz(p);
    g.scale.setScalar(STAGE_S);
    const [x,z]=pedXZ(i);
    const baseY=PED_Y+0.03-g.userData.minY*STAGE_S;
    g.position.set(x,baseY,z);
    g.userData.kind='part'; g.userData.id=p.k;
    g.userData.baseY=baseY; g.userData.fase=i*1.7; g.userData.lift=0;
    scene.add(g); moviles.push(g);

    const f=haz(p), gm=nuevaFantasma();
    f.traverse(o=>{ if(o.isMesh){ o.material=gm; o.castShadow=false; o.receiveShadow=false; }
                    if(o.isSprite) o.visible=false; });
    f.userData.kind='slot'; f.userData.id=p.k; f.userData.gm=gm; f.userData.shake=0;
    scene.add(f); fantasmas.push(f);
    pedLibre(i);
  });
  reposiciona(); muestraHueco(null);
  G.simUnlocked=false; G.resuelto=false;
  S.setCinematicIdle(false);
  S.moveTo([7.2,4.9,10.8],[0.6,1.95,0.30],1.3);
}
function muestraHueco(id){
  fantasmas.forEach(f=>{ f.visible=!ASM.done.has(f.userData.id)&&(!id||f.userData.id===id); });
}
function selPieza(o){
  if(ASM.sel===o){ deselec(); return; }
  deselec(); ASM.sel=o; o.userData.lift=0.16;
  muestraHueco(o.userData.id); synth.beep(660,0.06,0.04);
  showToast('<b>'+PART[o.userData.id].rot+'</b> en la mano. Ahora toca su <b>hueco luminoso</b> en el motor.',2600);
}
function deselec(){ if(ASM.sel){ ASM.sel.userData.lift=0; ASM.sel=null; } muestraHueco(null); }
function colocaPieza(o,f){
  const p=PART[o.userData.id], i=ORDEN.indexOf(o.userData.id);
  f.visible=false;
  tweens.push({o, p0:o.position.clone(), p1:posDe(o.userData.id).clone(),
    s0:o.scale.x, s1:1, t:0, dur:0.85,
    fin:()=>{ o.userData.kind='placed'; o.userData.lift=0; registra(o); armaCircuito(); }});
  ASM.done.add(o.userData.id); ASM.sel=null; pedHecho(i);
  montadas.push(o); moviles=moviles.filter(m=>m!==o);
  synth.beep(880,0.07,0.05); setTimeout(()=>synth.beep(1174,0.09,0.05),90);
  showToast('✔ <b>'+p.rot+'</b> montado. '+p.nota,4400);
  muestraHueco(null); pintaTablero();
  if(ASM.done.size===PARTS.length) finEnsamble();
}
function huecoMal(f){
  f.userData.shake=0.5; synth.beep(200,0.12,0.05);
  showToast('<span class="bad">✗ Esa pieza no va en ese hueco.</span>',2000);
}
function finEnsamble(){
  G.simUnlocked=true; syncCtrlbar();
  synth.beep(523,0.10,0.05); setTimeout(()=>synth.beep(784,0.14,0.05),130);
  showToast('🎉 <b>Circuito completo.</b> Se abren los seis modos de trabajo.',4600);
  S.setCinematicIdle(true);
  afterEdit();
}
function autoAssemble(){
  const pend=PARTS.filter(p=>!ASM.done.has(p.k));
  pend.forEach((p,n)=>setTimeout(()=>{
    const o=moviles.find(m=>m.userData.id===p.k), f=fantasmas.find(x=>x.userData.id===p.k);
    if(o&&f&&!ASM.done.has(p.k)) colocaPieza(o,f);
  },320+n*640));
  return 320+pend.length*640+900;
}
function conEtiqueta(o){ let n=o; while(n){ if(n.userData&&n.userData.kind) return n; n=n.parent; } return null; }
pickerFor(scene,S.camera,mount,hit=>{
  if(!hit){ deselec(); return; }
  const t=conEtiqueta(hit.object);
  if(!t){ deselec(); return; }
  const k=t.userData.kind;
  if(k==='part') selPieza(t);
  else if(k==='slot'){
    if(!ASM.sel){ showToast('Primero toca una <b>pieza</b> del banco.',2200); return; }
    if(t.userData.id===ASM.sel.userData.id) colocaPieza(ASM.sel,t); else huecoMal(t);
  }else if(k==='placed'){
    showToast('<b>'+PART[t.userData.id].rot+'</b> — '+PART[t.userData.id].para,5200);
  }
});

const CIRC={curva:null, gotas:[], n:26, u:0};

// ------------------------------------------------------------- las conducciones
// Cada tramo une DOS piezas y sólo existe si las dos están montadas: así el
// circuito se ve crecer, y mientras falte un tramo se ve exactamente por dónde
// está cortado. La ruta completa es además la trayectoria del refrigerante.
const TRAMOS=[
  ['bomba','termostato'], ['termostato','radiador'], ['radiador','bomba'],
  ['termostato','calefactor'], ['calefactor','bomba'], ['radiador','tapon'],
];
let mangueras=[];
function ruta(a,b){
  const A=ancla(), p=A[a].clone(), q=A[b].clone();
  const m=p.clone().lerp(q,0.5);
  m.z+=0.26; m.y+=0.12;
  return [p,m,q];
}
function armaCircuito(){
  mangueras.forEach(m=>borra(m)); mangueras=[];
  TRAMOS.forEach(([a,b])=>{
    if(!ASM.done.has(a)||!ASM.done.has(b)) return;
    const t=tubo(ruta(a,b),0.040,MAT_MANG);
    scene.add(t); mangueras.push(t);
  });
  // La trayectoria del refrigerante: bomba → bloque → termostato → radiador →
  // y de vuelta a la bomba. Es el lazo principal, el que se ve circular.
  const A=ancla(), pts=[];
  ['bomba','termostato','radiador'].forEach((k,i,arr)=>{
    if(i>0) pts.push(...ruta(arr[i-1],k).slice(1,2));
    pts.push(A[k].clone());
  });
  pts.push(...ruta('radiador','bomba').slice(1,2));
  CIRC.curva=new THREE.CatmullRomCurve3(pts,true);
}
function armaGotas(){
  CIRC.gotas.forEach(g=>borra(g)); CIRC.gotas=[];
  for(let i=0;i<CIRC.n;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.058,12,9),MAT_REF.clone());
    m.visible=false; scene.add(m); CIRC.gotas.push(m);
  }
}

// ============================================================== T3c · EL LATIDO
// Todo lo que se mueve en la escena lo mueve una cifra del motor sellado: el
// impulsor gira con el régimen, el aspa con el ciclo del ventilador, el vástago
// del termostato con su apertura, la aguja con la temperatura de salida y el
// color del refrigerante con esa misma temperatura. Nada se anima «porque queda
// bien»: si una cifra no cambia, en la escena no se mueve nada.

// Factores de escena DECLARADOS. La bomba de verdad gira a miles de vueltas por
// minuto: a esa velocidad, en pantalla, es un borrón. Se dibuja a una fracción
// declarada de la velocidad real, y esa fracción se publica en el contrato.
const FACTOR_BOMBA=0.0016;
const FACTOR_ASPA=0.30;
const FACTOR_GOTA=0.055;

// Escala del indicador del tablero: de veinte grados por debajo del tarado del
// termostato hasta la temperatura de ebullición. Así la aguja se clava en la
// zona roja justo cuando el refrigerante está a punto de hervir, que es la única
// cifra de este instrumento que significa algo por sí sola.
const escalaMin=e=>e.tTermo-30;
const fracAguja=(T,e,tEbu)=>clamp((T-escalaMin(e))/(tEbu-escalaMin(e)),0,1);

function pintaEscena(){
  if(!G.simUnlocked) return;
  const e=MQ(), s=EQ();
  const col=colorT(s.T,e);

  // El refrigerante del bloque, de la galería, del radiador y del depósito: todo
  // del color de la MISMA temperatura, que es la que publica el modelo.
  RIG.camisa.forEach(c=>{ c.material.color.setHex(col); c.material.emissive.setHex(col);
    c.material.emissiveIntensity=s.hierve?0.85:0.45; });
  if(RIG.nivelDep){ RIG.nivelDep.material.color.setHex(col);
    RIG.nivelDep.material.emissive.setHex(col); }
  // El radiador se pinta de la temperatura de SU refrigerante, no de la del
  // bloque: con el termostato cerrado está frío, y ese contraste es el síntoma.
  if(RIG.nucleoRad){
    const cr=s.radFrio?colorT(s.Tamb,e):colorT(s.T-s.dtRad/2,e);
    RIG.nucleoRad.material.color.setHex(cr);
  }
  // La aguja y el testigo.
  if(RIG.aguja) RIG.aguja.userData.setFrac(fracAguja(s.T,e,s.tEbu));
  if(RIG.testigo){
    const on=s.T>e.tAlarma;
    RIG.testigo.material.emissive.setHex(on?0xff2020:0x000000);
    RIG.testigo.material.emissiveIntensity=on?1.6:0;
    RIG.testigo.material.color.setHex(on?0xff5252:0x3a1418);
  }
  // El vástago del termostato: su carrera ES su apertura.
  if(RIG.ceraVastago) RIG.ceraVastago.position.y=-0.02+s.x*0.10;
}

// Contador de fotogramas. No es depuración: es la única manera de que una
// prueba sepa que el bucle ha corrido, porque en un navegador sin GPU real la
// escena va a unos pocos fotogramas por segundo y esperar por reloj miente.
let PINTADAS=0;
function pinta3D(dt){
  animT+=dt; PINTADAS++;
  const t=animT;
  for(let i=tweens.length-1;i>=0;i--){
    const w=tweens[i]; w.t+=dt;
    const u=clamp(w.t/w.dur,0,1), q=ease(u);
    w.o.position.lerpVectors(w.p0,w.p1,q);
    w.o.position.y+=Math.sin(q*Math.PI)*0.42;
    const sc=w.s0+(w.s1-w.s0)*q; w.o.scale.setScalar(sc);
    if(u>=1){ w.o.position.copy(w.p1); w.o.scale.setScalar(w.s1);
      w.o.rotation.set(0,0,0); w.fin&&w.fin(); tweens.splice(i,1); }
  }
  moviles.forEach(o=>{
    if(o.userData.kind!=='part') return;
    const d=o.userData;
    o.position.y=d.baseY+d.lift+Math.sin(t*1.5+d.fase)*0.022;
    o.rotation.y=Math.sin(t*0.55+d.fase)*0.30;
  });
  fantasmas.forEach(f=>{
    if(!f.visible) return;
    const d=f.userData;
    if(d.shake>0){ d.shake=Math.max(0,d.shake-dt*2.2);
      f.position.x=d.home.x+Math.sin(t*46)*d.shake*0.05; }
    else f.position.copy(d.home);
    if(d.gm) d.gm.opacity=0.20+0.10*Math.sin(t*2.4);
  });

  if(G.simUnlocked){
    const e=MQ(), s=EQ();
    if(RIG.rotor) RIG.rotor.rotation.z-=dt*G.rpm*FACTOR_BOMBA*Math.PI*2*
      (FALLAS[FALLA()].correaMul||1);
    if(RIG.aspa) RIG.aspa.rotation.z-=dt*s.ciclo*FACTOR_ASPA*Math.PI*2*12;
    pintaEscena();
    // Las gotas recorren el lazo principal. Su velocidad es proporcional al
    // caudal que publica el modelo, no una constante: si la bomba está comida,
    // se ve que van más despacio.
    if(CIRC.curva){
      CIRC.u=(CIRC.u+dt*s.Qtot*FACTOR_GOTA)%1;
      const col=colorT(s.T,e);
      CIRC.gotas.forEach((g,i)=>{
        const u=(CIRC.u+i/CIRC.n)%1;
        g.position.copy(CIRC.curva.getPointAt(u));
        g.visible=true;
        g.material.color.setHex(col); g.material.emissive.setHex(col);
      });
    }
  }else{
    CIRC.gotas.forEach(g=>{ g.visible=false; });
  }
}

// ================================================ T4a · HUD, PANEL Y MANDOS
const MODES=['ensamble','balance','termostato','radiador','refrigerante','censo','reto'];
const MODE_META={
  ensamble:    {n:'Montaje del circuito'},
  balance:     {n:'Balance térmico'},
  termostato:  {n:'Termostato y calentamiento'},
  radiador:    {n:'Radiador y ventilador'},
  refrigerante:{n:'Refrigerante y altitud'},
  censo:       {n:'Censo de instrumentos'},
  reto:        {n:'Diagnóstico a ciegas'},
};
const HUD_TXT={
  ensamble:['Montaje','Arma el circuito de refrigeración',
    'Siete piezas sobre el banco y siete huecos luminosos en el motor. El circuito es un lazo cerrado: mientras falte una pieza, el tramo que la necesita se dibuja apagado y no pasa refrigerante por él.',
    'Q<sub>generado</sub> = Q<sub>radiador</sub> + Q<sub>calefactor</sub> + Q<sub>bloque</sub>'],
  balance:['Balance','Lo que entra tiene que salir',
    'De todo el combustible que quema el motor, poco más de una cuarta parte acaba en el refrigerante. Ese calor sale por el radiador, por el calefactor si está abierto y por la superficie del bloque, y no hay más caminos.',
    'Q = ṁ · c<sub>p</sub> · ΔT'],
  termostato:['Termostato','Para qué sirve de verdad',
    'El termostato no está para enfriar: está para que el motor CALIENTE pronto y se quede donde toca. Agarrotado cerrado, el motor hierve. Agarrotado abierto, no recalienta nunca —y eso también es una avería—.',
    'x(T) = (T − T<sub>apertura</sub>) / banda'],
  radiador:['Radiador','Quién enfría a cada velocidad',
    'Un radiador no tiene «capacidad de disipación»: disipa lo que le dejan los dos caudales y el salto contra el aire. El ventilador y la marcha NO se suman: manda el que más empuja.',
    'Q = ε · C<sub>mín</sub> · (T<sub>ref</sub> − T<sub>aire</sub>)'],
  refrigerante:['Refrigerante','Dónde está el óptimo',
    'El agua es la que más calor se lleva por litro, el glicol sube la ebullición y baja la congelación, y el glicol empeora la transferencia. La curva de congelación NO es monótona: tiene un mínimo cerca del 60 %.',
    'T<sub>ebullición</sub> = f(p<sub>atm</sub>(altitud) + p<sub>tapón</sub>, glicol)'],
  censo:['Censo','¿Qué instrumentos hacen falta?',
    'Catorce escenarios, ocho observaciones, 255 subconjuntos. La pregunta útil no es cuánto marca cada instrumento, sino cuántos escenarios distintos separa. Y el resultado NO es el mismo en las cuatro máquinas.',
    'firma(sub) → clases de equivalencia'],
  reto:['Reto','Diagnostica a ciegas',
    'El escenario está oculto. Compra las observaciones que necesites y entrega la FAMILIA de avería. Hay una avería que no mueve la aguja ni un grado y otra que sólo se ve conduciendo suave.',
    'diagnóstico = f(T, ΔT, ventilador, presión, refractómetro, gases)'],
};
function pintaHUD(){
  const t=HUD_TXT[G.modo]||HUD_TXT.ensamble, e=MQ();
  el('hud').innerHTML=
    '<div class="eyebrow">Enfriamiento del motor · '+t[0]+'</div>'+
    '<h2>'+t[1]+'</h2>'+
    '<p>'+t[2]+'</p>'+
    '<div class="formula">'+t[3]+'</div>'+
    '<div class="legend">'+
      '<div class="li"><span class="dot" style="background:'+COL_REG.frio+'"></span>por debajo de su temperatura de servicio</div>'+
      '<div class="li"><span class="dot" style="background:'+COL_REG.servicio+'"></span>en temperatura de servicio</div>'+
      '<div class="li"><span class="dot" style="background:'+COL_REG.alarma+'"></span>por encima de su alarma</div>'+
      '<div class="li"><span class="dot" style="background:'+COL_REG.hierve+'"></span>hirviendo: el modelo deja de valer</div>'+
    '</div>'+
    '<div class="fid">'+
      '<div class="ft">🔒 Contrato de fidelidad</div>'+
      '<div class="fl"><b>Sí modela:</b> el calor al refrigerante desde la potencia de <b>combustible</b> por la línea de Willans, con la presión media de rozamiento de Heywood y con el rozamiento en frío, que es lo que de verdad calienta un motor recién arrancado; bomba centrífuga por leyes de semejanza contra una resistencia que va con el cuadrado del caudal; termostato de cera repartiendo el caudal entre el radiador y la derivación; radiador y calefactor por el método <b>ε-NTU</b> de flujo cruzado sin mezcla, con la película de cada lado escalando con su caudal; temperatura de ebullición por Clausius-Clapeyron contra la presión absoluta —tapón <b>más</b> presión atmosférica de la plaza— y punto de congelación por la tabla publicada de etilenglicol y agua, con su <b>eutéctico</b>; y el equilibrio por bisección sobre la temperatura de salida del bloque, con el calor generado dentro de la bisección.</div>'+
      '<div class="fl no"><b>NO modela:</b> el gradiente de temperatura DENTRO del bloque, que aquí es un solo nodo; la degradación del refrigerante con el tiempo ni sus inhibidores; el modelo es de refrigerante <b>líquido</b> y en cuanto alcanza su temperatura de ebullición deja de valer, así que no se publica ninguna temperatura por encima de ella, se declara que hierve y el margen se publica como <b>inexistente</b> en vez de como un número negativo; con el termostato agarrotado cerrado el balance no cierra a <b>ninguna</b> temperatura por debajo de los 400 °C en que se corta la bisección, y eso se declara en pantalla en vez de disfrazar el techo de solución; el ventilador es un interruptor y cuando cicla el balance cierra <b>en promedio</b>, de donde sale su ciclo de trabajo; el aire de conveccción natural con el coche parado es un valor declarado de '+num(V_NATURAL,2)+' m/s; el corte del motor es longitudinal y sólo enseña los cilindros y la camisa de agua —esta práctica no toca la combustión— y los cilindros se dibujan <b>en línea</b> en los cuatro arquetipos, también el V8; la escena gira el impulsor y el aspa a fracciones declaradas de su velocidad real ('+num(FACTOR_BOMBA,4)+' y '+num(FACTOR_ASPA,2)+') para que se vean girar. Los cuatro motores son arquetipos declarados, <b>no</b> modelos comerciales: el termostato, el tapón y la mezcla que le corresponden a un motor real están en su manual de taller y en ningún otro sitio.</div>'+
    '</div>'+
    '<div class="src">Ref: ecuación de Clausius-Clapeyron para la ebullición del agua · atmósfera estándar ISA para la presión y la densidad del aire · tabla publicada de etilenglicol y agua para el punto de congelación · método ε-NTU (Kays y London; Incropera y DeWitt) · correlación de Heywood para la presión media de rozamiento · manual de taller del fabricante (única fuente del termostato, del tapón y de la mezcla de un motor concreto) · Motor en pantalla: '+e.nombre+'.</div>';
}

el('panel').innerHTML=
  '<h4>Circuito de refrigeración <span id="p_mode"></span></h4>'+
  '<div class="modebar">'+
    '<button class="b" id="m_ensamble">1 · Montar</button>'+
    '<button class="b" id="m_balance">2 · Balance</button>'+
    '<button class="b" id="m_termostato">3 · Termostato</button>'+
    '<button class="b" id="m_radiador">4 · Radiador</button>'+
  '</div>'+
  '<div class="modebar">'+
    '<button class="b" id="m_refrigerante">5 · Refrigerante</button>'+
    '<button class="b" id="m_censo">6 · Censo</button>'+
    '<button class="b" id="m_reto">7 · Reto</button>'+
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
// Los botones de una barra se reparten el ancho a partes iguales, así que catorce
// en una sola fila salen ilegibles y el último se sale del panel. Se cortan en
// varias barras de altura pareja, calculadas del número de opciones.
function fila(rot,attr,ops,cur){
  const filas=Math.ceil(ops.length/5), porFila=Math.ceil(ops.length/filas);
  let h='<div class="gl" style="margin:9px 0 4px"><span>'+rot+'</span></div>';
  for(let i=0;i<ops.length;i+=porFila){
    h+='<div class="modebar">'+ops.slice(i,i+porFila).map(o=>
      '<button class="b'+(String(o[0])===String(cur)?' on':'')+'" '+attr+'="'+o[0]+'">'+o[1]+'</button>'
    ).join('')+'</div>';
  }
  return h;
}
// Rótulo corto de cada escenario para los botones. Si mañana aparece un
// escenario nuevo sin rótulo corto, cae en el recorte del largo en vez de
// quedarse sin botón.
const ESC_CORTO={sano:'sano', terCerrado:'term. cerrado', terAbierto:'term. abierto',
  terTardio:'term. tardío', radInterno:'rad. por dentro', radExterno:'rad. por fuera',
  ventilador:'ventilador', bomba:'bomba', correa:'correa', tapon:'tapón',
  aire:'aire', junta:'junta', aguaSola:'agua sola', glicolAlto:'mucho glicol'};
// El ralentí es una PROPIEDAD de la máquina, así que siempre está entre las
// opciones y es adonde se vuelve al cambiar de motor. Si no, el panel ofrecería
// un régimen que ese motor no tiene y la cifra saldría de un punto inexistente.
const rpmOps=()=>[...new Set([MQ().ralenti,1200,2000,2500,3000,4000])].sort((a,b)=>a-b);
const CARGA_OPS=[[0,'sin carga'],[0.25,'suave'],[0.45,'crucero'],[0.7,'firme'],[1,'pie a fondo']];

function buildControls(){
  const e=MQ(), reto=(G.modo==='reto');
  let h='';
  if(!reto) h+=fila('Motor en el banco','data-mk',ARQ_KEYS.map(k=>[k,ARQ[k].corto]),G.maq);
  else h+='<div class="gl" style="margin:9px 0 4px"><span>Motor bajo diagnóstico</span><b>'+e.corto+'</b></div>';

  if(!reto) h+=fila('Estado del sistema','data-esc',
    ESCEN_KEYS.map(k=>[k,ESC_CORTO[k]||corta(ESCEN[k].rot,16)]),G.esc);
  else h+='<div class="gl" style="margin:9px 0 4px"><span>Estado del sistema</span><b class="warn">oculto</b></div>';

  if(!reto){
    h+=fila('Refrigerante','data-mz',MEZCLA_KEYS.map(k=>[k,MEZ[k].corto]),G.mezcla);
    if(mezclaForzada())
      h+='<div class="gl" style="margin:4px 0 4px"><span>Ojo</span><b class="warn">el escenario impone '+
        MEZ[mezclaEfectiva()].corto+'</b></div>';
    h+=fila('Plaza','data-pl',PLAZA_KEYS.map(k=>[k,PLZ[k].corto]),G.plaza);
    h+=fila('Temperatura ambiente','data-ta',AMBIENTES.map(t=>[t,num(t,0)+' °C']),G.Tamb);
  }
  if(G.modo==='balance'||G.modo==='termostato'||G.modo==='radiador'||G.modo==='refrigerante'){
    h+=fila('Régimen del motor','data-rpm',
      rpmOps().map(r=>[r,num(r,0)+(r===e.ralenti?'*':'')]),G.rpm);
    h+=fila('Par pedido','data-cg',CARGA_OPS.map(c=>[c[0],c[1]]),G.carga);
    h+=fila('Velocidad de marcha','data-v',VELOCIDADES.map(v=>[v,num(v,0)]),G.vKmh);
    h+=fila('Calefacción','data-cf',[[0,'apagada'],[1,'a tope']],G.calefactor?1:0);
  }
  el('ctrlbar').innerHTML=h;
}
function syncCtrlbar(){
  MODES.forEach(m=>{
    const b=el('m_'+m); if(!b) return;
    const viva=(m==='ensamble')||G.simUnlocked;
    b.disabled=!viva; b.style.opacity=viva?'1':'0.45';
    b.classList.toggle('on',m===G.modo);
  });
  const rt=(G.modo==='reto');
  el('retoTitle').style.display=rt?'':'none';
  el('retoBox').style.display=rt?'':'none';
  el('p_mode').textContent=G.simUnlocked?('· '+MODE_META[G.modo].n):'· circuito incompleto';
  el('btnNew').textContent=rt?'🔀 Otro sistema averiado'
    :(G.modo==='ensamble'?'🔁 Volver a montar':'🔀 Otro caso');
  el('btnAuto').disabled=autoRunning;
  buildControls();
}

// ---------------------------------------------------------------- telemetría
const gl=(l,v,c)=>'<div class="g"><div class="gl"><span>'+l+'</span><b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div></div>';
function pintaTele(){
  if(!G.simUnlocked){
    el('tele').innerHTML=gl('Piezas montadas',ASM.done.size+' / '+PARTS.length,
      ASM.done.size===PARTS.length?'good':'warn')+
      gl('Siguiente','toca una pieza del banco','');
    return;
  }
  const e=MQ(), s=EQ(), V=veredicto();
  let h='';
  // En el diagnóstico a ciegas sólo se publica lo que el alumno ha COMPRADO.
  // La mezcla del circuito delata los dos escenarios de refrigerante
  // equivocado, la temperatura delata media tabla y el veredicto los delata
  // todos: publicarlos aquí sería regalar la respuesta.
  if(G.modo==='reto'){
    h+=gl('Observaciones compradas',Object.keys(RETO.tomadas).length+' / '+OBS.length,
      Object.keys(RETO.tomadas).length?'':'warn');
    h+=gl('Familia elegida',RETO.eleccion||'ninguna todavía',RETO.eleccion?'':'warn');
    if(RETO.veredicto) h+=gl('Diagnóstico entregado',RETO.veredicto.ok?'acertado':'fallado',
      RETO.veredicto.ok?'good':'bad');
    el('tele').innerHTML=h;
    return;
  }
  h+=gl('Refrigerante',MEZ[mezclaEfectiva()].corto+(mezclaForzada()?' (impuesto)':''),
    mezclaForzada()?'warn':'');
  h+=gl('Temperatura de salida',gC(s.T),
    s.hierve?'bad':(s.T>e.tAlarma?'bad':(s.fria?'warn':'good')));
  h+=gl('Alarma del fabricante',gC(e.tAlarma,0),'warn');
  // Un radiador frío por los dos lados es el hallazgo más diagnóstico que tiene
  // este banco, y no depende del modo en el que se esté mirando: se publica
  // siempre que aparezca, no sólo en la vista del balance.
  if(s.radFrio) h+=gl('Radiador','frío por los dos lados','bad');
  if(G.modo==='balance'){
    h+=gl('Calor al refrigerante',kW(s.Qgen),'');
    h+=gl('Salto del motor',gC(s.dtMotor),s.dtMotor>12?'warn':'');
    h+=gl('Salto del radiador',s.radFrio?'radiador frío':gC(s.dtRad),s.radFrio?'bad':'');
    h+=gl('Caudal de la bomba',lpm(s.Qtot),'');
  }
  if(G.modo==='termostato'){
    const c=CAL(), VF=veredictoFrio();
    h+=gl('Apertura del termostato',pct(s.x),s.x>=0.999?'warn':'');
    h+=gl('Tarda en calentar',seg(c.tServ),VF.llega?'good':'warn');
    h+=gl('A los quince minutos',gC(c.Tfinal),VF.llega?'':'warn');
    h+=gl('Se queda en (equilibrio)',gC(s.T),VF.fria?'bad':'good');
    h+=gl('Veredicto del frío',VF.rot,VF.nivel);
  }
  if(G.modo==='radiador'){
    h+=gl('Calor por el radiador',kW(s.Qrad),'');
    h+=gl('Eficacia del radiador',pct(s.eps),s.eps>0.5?'good':'warn');
    h+=gl('Ventilador',s.ciclando?('ciclando al '+pct(s.ciclo)):(s.ventilador?'encendido':'apagado'),
      s.ciclo>0.9?'bad':(s.ciclo>0.5?'warn':''));
    h+=gl('Aire por el frontal',num(s.mAire,2)+NBSP+'kg/s','');
  }
  if(G.modo==='refrigerante'){
    h+=gl('Presión del circuito',bar(s.pRel),s.pRel<e.pTapon*0.5?'bad':'');
    h+=gl('Hierve a',gC(s.tEbu,0),'');
    h+=gl('Se congela a',gC(s.tCong,0),s.tCong>-20?'warn':'good');
  }
  if(G.modo==='censo'){
    const C=CENSO(), N=ESCEN_KEYS.length;
    const min=C.filter(x=>x.resueltos===N).sort((a,b)=>a.sub.length-b.sub.length)[0];
    const tal=C.find(x=>x.sub.length===OBS.filter(o=>o.taller).length&&x.sub.every(o=>o.taller));
    h+=gl('Escenarios en juego',String(N),'');
    h+=gl('Sólo con lo de taller',tal.resueltos+' / '+N,tal.resueltos===N?'good':'bad');
    h+=gl('Observaciones mínimas',min?String(min.sub.length):'—',min?'good':'bad');
  }
  h+=gl('Margen hasta hervir',rotMargen(s),
    s.hierve?'bad':(V.margen?'good':'warn'));
  h+=gl('Veredicto con el motor en marcha',
    V.malo?'hay algo que corregir':(G.esc==='sano'?'todo en orden':'aquí no se nota nada'),
    V.malo?'bad':(G.esc==='sano'?'good':'warn'));
  el('tele').innerHTML=h;
}

// ------------------------------------------------------------------ informe
// El informe dice el veredicto Y por qué criterio, porque el laboratorio
// entero trata de que los criterios NO son equivalentes.
function pintaInforme(){
  const R=el('report'), e=MQ();
  if(!G.simUnlocked){
    R.innerHTML='<span class="mono">Faltan '+(PARTS.length-ASM.done.size)+
      ' piezas del circuito.</span> Toca una pieza del banco y luego su hueco luminoso en el motor.';
    return;
  }
  if(G.modo==='reto'){ pintaReto(); return; }
  const s=EQ(), V=veredicto(), VF=veredictoFrio();
  const parte=[];
  if(s.hierve) parte.push('<b class="bad">el refrigerante HIERVE:</b> '+gC(s.tEbu,0)+
    ' a '+bar(s.pAbs)+' absolutos; el modelo, que es de líquido, deja de valer aquí'+
    (s.converge?'':', y de hecho el balance no cierra a ninguna temperatura: con este circuito no hay por dónde salga el calor'));
  else if(s.T>e.tAlarma) parte.push('<b class="bad">por encima de su alarma:</b> '+gC(s.T)+
    ' contra '+gC(e.tAlarma,0));
  if(sinReserva(s)) parte.push('<b class="warn">sin reserva:</b> le quedan '+
    gC(s.margen)+' hasta hervir, menos de los '+gC(MARGEN_MIN,0)+' que este banco declara como mínimo');
  if(s.ciclo>0.98&&!s.hierve&&s.T<=e.tAlarma) parte.push('<b class="warn">el ventilador va al 100 %:</b> '+
    'ya no le queda nada que dar, y la aguja no lo dice');
  if(s.fria) parte.push('<b class="warn">por debajo de su temperatura de servicio:</b> '+gC(s.T)+
    ', que se paga en consumo y en desgaste aunque no encienda ninguna luz');

  let h;
  if(!parte.length){
    // Con una avería montada, «en orden» sería falso: lo que dice el modelo es
    // que en ESTE punto de trabajo no se nota. Esa distinción es la práctica.
    const sano=G.esc==='sano';
    h=(sano?'<b class="good">Sistema de refrigeración en orden.</b> '
           :'<b class="warn">En este punto de trabajo no se nota nada.</b> ')+
      gC(s.T)+' de salida, '+gC(s.margen)+' de margen hasta hervir y el ventilador '+
      (s.ciclando?('ciclando al '+pct(s.ciclo)):(s.ventilador?'encendido':'apagado'))+'. '+
      (sano?'Conviene fijarse en que la aguja y el margen NO se implican: sube de plaza o de temperatura ambiente y verás cuál se mueve antes. '
           :'Hay una avería montada y ninguna de las medidas del protocolo se ha movido: cambia el punto de trabajo, la plaza o la temperatura ambiente antes de dar el sistema por bueno. ')+
      'Escenario montado: <b>'+ESCEN[G.esc].rot+'</b> — '+ESCEN[G.esc].clave+'.';
  }else{
    h='<b>Hallazgos:</b> '+parte.join(' · ')+'. ';
    // El criterio que se queda ciego, cuando lo hay: es el corazón de la práctica.
    const ciegos=[];
    if(s.T<=e.tAlarma&&sinReserva(s)) ciegos.push('la aguja NO lo ve: marca '+gC(s.T)+
      ' y el testigo está apagado, pero el margen es de '+gC(s.margen));
    if(s.radFrio) ciegos.push('el radiador está FRÍO por los dos lados: por ahí no pasa caudal, '+
      'y eso el tablero no lo dice de ninguna manera');
    if(s.fria&&s.T<=e.tAlarma) ciegos.push('no hay ninguna alarma que avise de un motor que se queda frío: '+
      'sólo se nota en el consumo y en que la calefacción no calienta');
    if(ciegos.length) h+='<span class="warn">Y esto es lo que hay que llevarse: '+ciegos.join('; ')+'.</span> ';
    h+='Escenario montado: <b>'+ESCEN[G.esc].rot+'</b> — '+ESCEN[G.esc].clave+'.';
  }
  // El frío se informa aparte, y sólo en su modo: es otra pregunta.
  if(G.modo==='termostato') h+=' <b>Calentamiento desde '+gC(G.Tamb,0)+':</b> '+
    '<b class="'+VF.nivel+'">'+VF.rot+'</b>.'+
    (VF.lento?' Ojo: esto NO es una avería del sistema, es el punto de trabajo. Un motor no se calienta al ralentí en el patio: sube el régimen o pídele par y verás bajar el tiempo. ':' ')+
    'Esto se juzga aparte de la temperatura de marcha: un motor que no calienta no enciende ninguna luz.';
  R.innerHTML=h;
}

// ------------------------------------------------------------------- modos
function afterEdit(){
  invalida();
  if(!rpmOps().includes(G.rpm)) G.rpm=2500;
  // El banco sólo se ve mientras haya algo que montar. Un banco vacío en primer
  // plano tapa la escena y su resplandor se cuela por encima del pizarrón.
  muestraBanco(G.modo==='ensamble'||!G.simUnlocked);
  pintaTablero(); pintaTele(); pintaInforme(); syncCtrlbar();
}
function setMode(m){
  if(m!=='ensamble'&&!G.simUnlocked){
    showToast('Primero hay que <b>montar el circuito</b>.',2400);
    return;
  }
  if(G.modo==='ensamble'&&m!=='ensamble'&&ASM.done.size<PARTS.length){
    showToast('Faltan piezas por montar.',2200); return;
  }
  G.modo=m;
  // Volver a la vista de montaje NO desmonta lo ya montado. Si lo hiciera, mirar
  // cómo quedó el circuito costaría rehacerlo entero, y el alumno aprendería a
  // no volver nunca. Para practicar el montaje otra vez está «Volver a montar».
  if(m==='ensamble'){ if(ASM.done.size<PARTS.length) initAssembly(); }
  else if(ASM.done.size<PARTS.length){ montaKit(); }
  if(m==='reto') armaReto();
  pintaHUD(); afterEdit(); refrescaPregunta();
  // Encuadres. Los modos cuya materia está entera en el pizarrón van al
  // pizarrón; los que hablan del circuito montado se alejan para que el motor
  // —con su aguja, su ventilador y el color del refrigerante— entre por la
  // derecha; y montaje va al plano general del banco.
  if(m==='refrigerante'||m==='censo'){ const t=camTablero(); S.moveTo(t[0],t[1],1.1); return; }
  if(m==='reto'){ const t=camTablero(6.4); S.moveTo(t[0],t[1],1.1); return; }
  if(m==='ensamble'){
    // El encuadre del montaje se saca del ANCHO real del motor, no de un factor
    // multiplicativo: multiplicar la posición de la cámara por la escala aleja
    // al cuadrado —el 5.0 V8 se quedaba del tamaño de un sello en mitad de una
    // pantalla vacía— porque la distancia crece con el factor pero la escena
    // sólo crece con su ancho.
    const A=dims(MQ()).anchoTot;
    const r=(A/2+4.0)/0.66;                 // medio ángulo horizontal del encuadre
    const u=[0.518,0.353,0.777];            // dirección de la cámara, normalizada
    const tg=[0.12*A,1.95,0.30];
    S.moveTo([tg[0]+u[0]*r, 1.15+u[1]*r, tg[2]+u[2]*r],tg,1.2); return;
  }
  // La distancia y el corrimiento están medidos MIRANDO la pantalla: a 8,2 el
  // pizarrón se quedaba del tamaño de un sello con media pantalla de suelo vacío
  // debajo. A 7,0 el texto de las tarjetas se lee y el motor sigue entrando por
  // la derecha con su aguja, su ventilador y el color del refrigerante. El
  // pizarrón mide lo mismo en las cuatro máquinas, así que la distancia apenas
  // crece con el motor: sólo lo justo para que el bloque más largo entre.
  const d=7.0+0.5*((G.k||1)-1);
  const t=camTablero(d,0.10*d); S.moveTo(t[0],t[1],1.1);
}

// ============================== T4b · RETO, CUESTIONARIO, RECORRIDO Y ARRANQUE
// Las familias diagnosticables son exactamente las `clave` que declara el motor
// sellado —FAMILIAS sale de ahí—: si mañana se añade un escenario con una clave
// nueva, aparece solo en la lista en vez de quedarse fuera sin avisar.
const RETO={caso:null, tomadas:{}, eleccion:null, veredicto:null, pistas:0};

function barajaEn(a){                       // Fisher-Yates, para que la posición
  for(let i=a.length-1;i>0;i--){            // de la respuesta no sea la pista
    const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function armaReto(){
  const casos=casosReto();
  RETO.caso=casos[Math.floor(Math.random()*casos.length)];
  G.esc=RETO.caso;
  // El coche entra al taller con el refrigerante que pide su fabricante. Si la
  // avería es precisamente la mezcla, el escenario la impone y eso ES el caso.
  G.mezcla=MQ().mezclaOEM;
  RETO.tomadas={}; RETO.eleccion=null; RETO.veredicto=null; RETO.pistas=0;
  invalida(); pintaObsReto(); pintaDxReto();
}
// Valor legible de cada observación. Sale del motor sellado y se publica con la
// MISMA resolución con la que el censo la cuenta: comprar el instrumento no da
// precisión infinita, y si la pantalla diera más dígitos que el censo, el censo
// estaría contando otra cosa que la que el alumno ve.
function valorObs(k){
  const L=LECT(), o=OBS.find(x=>x.k===k);
  if(k==='venti')   return L.pts[2].venti?'sí arranca':'no arranca';
  if(k==='gases')   return L.gases?'SÍ hay gases de combustión':'no hay gases';
  if(k==='tRal')    return gC(cuant(L.pts[0].T,o.res),0);
  if(k==='tCarr')   return gC(cuant(L.pts[1].T,o.res),0);
  if(k==='tCuesta') return gC(cuant(L.pts[2].T,o.res),0);
  if(k==='dtRad')   return gC(cuant(L.pts[2].dtRad,o.res),0);
  if(k==='presion') return bar(cuant(L.pRel,o.res),1);
  if(k==='refract') return gC(cuant(L.tCong,o.res),0);
  return '—';
}
function mide(k){
  if(G.modo!=='reto'||RETO.tomadas[k]) return;
  RETO.tomadas[k]=valorObs(k);
  synth.beep(560,0.06,0.04);
  pintaObsReto(); pintaReto(); pintaTablero(); pintaTele();
}
// Rótulo corto de cada observación para el botón. Recortar el rótulo largo a
// treinta letras dejaba TRES botones con el mismo texto —«Temperatura del
// indicador en …»— y el alumno no podía distinguir carretera de cuesta.
const OBS_CORTO={tRal:'temperatura a ralentí', tCarr:'temperatura en carretera',
  tCuesta:'temperatura en cuesta', dtRad:'pirómetro en el radiador',
  venti:'¿arranca el ventilador?', presion:'presión del circuito',
  refract:'refractómetro', gases:'detector de gases'};
function pintaObsReto(){
  el('obsreto').innerHTML=OBS.map(o=>
    '<button class="b'+(RETO.tomadas[o.k]?' on':'')+'" data-obs="'+o.k+'">'+
    (o.taller?'':'💰 ')+(OBS_CORTO[o.k]||corta(o.rot,30))+'</button>').join('');
}
function pintaDxReto(){
  const ops=barajaEn(FAMILIAS.slice());
  el('dxreto').innerHTML=ops.map(f=>
    '<button class="b'+(RETO.eleccion===f?' on':'')+'" data-fam="'+f+'">'+f+'</button>').join('');
}
function pintaReto(){
  const R=el('report'), n=Object.keys(RETO.tomadas).length;
  let h='<b>Coche bajo diagnóstico:</b> '+MQ().nombre+'. Observaciones compradas: '+n+'/'+OBS.length+'. ';
  if(RETO.veredicto) h+=(RETO.veredicto.ok?'<b class="good">Acertaste.</b> ':'<b class="bad">Fallaste.</b> ')+RETO.veredicto.texto;
  else h+='Compra lo que necesites, elige la familia y entrega el diagnóstico.';
  R.innerHTML=h;
  const spec=el('retoSpec');
  spec.innerHTML=n
    ? '<span class="mono">'+OBS.filter(o=>RETO.tomadas[o.k])
        .map(o=>(OBS_CORTO[o.k]||corta(o.rot,34))+': '+RETO.tomadas[o.k]).join('<br>')+'</span>'
    : '<span class="mono">Sin observaciones todavía.</span> Las seis primeras se toman con lo que hay en cualquier taller; el refractómetro y el detector de gases hay que pedirlos aparte.';
}
function pista(){
  const e=MQ(), C=CENSO(), N=ESCEN_KEYS.length;
  const tal=C.find(x=>x.sub.length===OBS.filter(o=>o.taller).length&&x.sub.every(o=>o.taller));
  const p=[
    'Empieza por las tres temperaturas del protocolo. Si las tres coinciden con las de un motor sano, la avería es de las que la aguja no ve: mira la presión del circuito.',
    'El pirómetro sobre las dos mangueras del radiador separa mucho: un radiador FRÍO por los dos lados no es un radiador sucio, es un termostato que no abre.',
    'Con todo lo que se mide en el taller se separan '+tal.resueltos+' de los '+N+
      ' escenarios de este '+e.corto+'. '+(tal.resueltos===N
        ? 'En esta máquina alcanza: si sigues dudando, es que falta tomar alguna.'
        : 'En esta máquina NO alcanza: hay casos que sólo separan el refractómetro o el detector de gases.'),
  ];
  const i=Math.min(RETO.pistas,p.length-1);
  RETO.pistas++;
  showToast('💡 '+p[i],6800);
  synth.beep(520,0.07,0.04);
}
function checkReto(){
  if(!RETO.eleccion){ showToast('Elige primero una familia de avería.',2200); return; }
  const e=MQ(), L=LECT(), ok=(RETO.eleccion===L.clave);
  const F=FALLAS[ESCEN[RETO.caso].falla];
  const forzada=ESCEN[RETO.caso].mezcla;
  const sano=lecturas(e,'sano',{mezcla:e.mezclaOEM,plaza:G.plaza,Tamb:G.Tamb});
  const queEra='Era <b>'+ESCEN[RETO.caso].rot+'</b> ('+L.clave+'). '+
    (forzada?('El circuito llevaba '+MEZ[forzada].rot+'. '):'')+F.nota;
  const pruebas='Lo que lo demostraba: en cuesta '+gC(L.pts[2].T)+' contra '+gC(sano.pts[2].T)+
    ' del sistema sano, salto del radiador '+
    (L.pts[2].radFrio?'nulo —radiador frío por los dos lados—':gC(L.pts[2].dtRad))+
    ' contra '+gC(sano.pts[2].dtRad)+', presión '+bar(L.pRel)+' contra '+bar(sano.pRel)+
    ', congelación '+gC(L.tCong,0)+' y detector de gases '+(L.gases?'POSITIVO':'negativo')+'.';
  let txt=queEra+' '+pruebas;
  if(ok){
    const compradas=Object.keys(RETO.tomadas).length;
    if(compradas<3) txt+=' <span class="warn">Acertaste con sólo '+compradas+
      ' observación'+(compradas===1?'':'es')+': acertar por corazonada y acertar por método se parecen en la respuesta y en nada en el taller.</span>';
    G.resuelto=true;
    synth.beep(660,0.09,0.05); setTimeout(()=>synth.beep(880,0.13,0.05),110);
  }else{
    synth.beep(180,0.14,0.05);
  }
  // Dos versiones del mismo veredicto: la del panel lleva etiquetas y la del
  // pizarrón va en texto plano, porque un lienzo 2D dibujaría las etiquetas
  // literales. Guardar sólo una obliga a que alguna de las dos mienta.
  RETO.veredicto={ok, texto:txt, plano:txt.replace(/<[^>]+>/g,'')};
  pintaReto(); pintaTablero(); pintaTele();
}

// -------------------------------------------------------------- cuestionario
// Una pregunta por modo. La respuesta correcta NO se escribe a mano: se decide
// comparando cifras que acaba de dar el motor sellado, así que si mañana se
// recalibra un arquetipo la pregunta sigue siendo verdad o deja de compilar,
// pero no se queda mintiendo en silencio.
let QUIZ=null;
function preguntaDe(m){
  const e=MQ();
  if(m==='ensamble'){
    const cer=EQ({falla:'terCerrado'});
    return {t:'Con el motor frío el termostato está cerrado y por el radiador no pasa nada. '+
      'Aun así la bomba mueve '+lpm(cer.Qtot)+'. ¿Por dónde va ese caudal?',
      ops:[['Por la derivación, que devuelve el refrigerante del bloque a la bomba sin pasar por el radiador',true],
           ['No va a ninguna parte: la bomba trabaja contra la válvula cerrada',false],
           ['Por el radiador igualmente, sólo que más despacio',false]],
      exp:'La derivación existe para dos cosas: para que la bomba nunca trabaje contra una válvula cerrada y para que el bloque caliente PAREJO en vez de por zonas. Un circuito de refrigeración es un lazo cerrado con dos caminos, no uno.'};
  }
  if(m==='balance'){
    const a=EQ({rpm:4000,carga:0}), b=EQ({rpm:2000,carga:1});
    const mas=a.Qgen>=b.Qgen?'a':'b';
    return {t:'Los dos puntos van a la misma velocidad de marcha. ¿En cuál manda el motor MÁS calor al refrigerante?',
      ops:[['A 4 000 rpm sin carga ('+kW(a.Qgen)+')',mas==='a'],
           ['A 2 000 rpm con el pie a fondo ('+kW(b.Qgen)+')',mas==='b'],
           ['En los dos igual: el calor lo fijan las vueltas',false]],
      exp:'El calor al refrigerante sale sobre todo del combustible quemado, y eso lo manda el PAR pedido, no el régimen. Subir de vueltas en vacío añade rozamiento, que también calienta, pero mucho menos que pedirle par. Por eso un coche recalienta subiendo un puerto despacio y no en autopista.'};
  }
  if(m==='termostato'){
    const ab=EQ({falla:'terAbierto'}), sn=EQ({falla:'sano'});
    return {t:'Con el termostato agarrotado abierto este motor se queda en '+gC(ab.T)+
      ' en vez de en '+gC(sn.T)+', y no enciende ninguna luz. ¿Es una avería?',
      ops:[['Sí: gasta más, se desgasta antes y la calefacción no calienta, y nada avisa',true],
           ['No: mientras no recaliente, no hay nada que reparar',false],
           ['Sólo en invierno; en verano da igual',false]],
      exp:'El termostato no está para enfriar: está para que el motor llegue pronto a su temperatura y se quede ahí. Un motor frío quema peor, diluye el aceite con combustible y desgasta más. Es la única avería de este laboratorio que el veredicto de marcha ABSUELVE, y por eso el frío se juzga aparte.'};
  }
  if(m==='radiador'){
    const parado=EQ({vKmh:0}), rapido=EQ({vKmh:120});
    const mas=parado.mAire>=rapido.mAire?'p':'r';
    return {t:'Parado con el ventilador en marcha entran '+num(parado.mAire,2)+NBSP+
      'kg/s de aire por el frontal; a 120 km/h, '+num(rapido.mAire,2)+
      '. ¿Qué pasa si el ventilador arranca yendo a 120?',
      ops:[['Nada apreciable: manda el que más aire empuja, y a esa velocidad manda la marcha',mas==='r'],
           ['Se suman los dos y entra bastante más aire',false],
           ['Entra menos: el ventilador estorba al aire de la marcha',mas==='p']],
      exp:'La velocidad del aire frente al radiador es la MAYOR de las dos, no la suma: el ventilador y la marcha empujan el mismo aire por el mismo sitio. Por eso un ventilador averiado no se nota en carretera y deja el coche tirado en un atasco.'};
  }
  if(m==='refrigerante'){
    const c60=congelacion(60), c70=congelacion(70);
    const peor=c70>c60;   // «protege menos» = se congela a MAYOR temperatura
    return {t:'El etilenglicol al 60 % se congela a '+gC(c60,0)+' y al 70 %, a '+gC(c70,0)+
      '. ¿Qué mezcla protege más del frío?',
      ops:[['La del 60 %: pasado el eutéctico, más glicol protege MENOS',peor],
           ['La del 70 %: cuanto más glicol, más protección',!peor],
           ['Las dos igual: por encima del 50 % la curva es plana',false]],
      exp:'La curva de congelación de la mezcla NO es monótona: baja hasta el eutéctico, cerca del '+
        num(G_EUTECTICO,0)+' % en volumen, y a partir de ahí vuelve a subir. Poner glicol de más no es prudencia: se congela antes, transporta menos calor por litro y transfiere peor.'};
  }
  if(m==='censo'){
    const C=CENSO(), N=ESCEN_KEYS.length;
    const mascara=ks=>ks.reduce((a,k)=>a|(1<<OBS.findIndex(o=>o.k===k)),0);
    const aguja=C.find(c=>c.mask===mascara(['tRal','tCarr','tCuesta']));
    return {t:'Con las tres temperaturas del indicador y nada más se separan '+aguja.resueltos+
      ' de los '+N+' escenarios de este '+e.corto+'. ¿Por qué no llegan a los '+N+'?',
      ops:[['Porque hay averías que dejan la aguja donde estaba: el tapón no mueve la temperatura ni un grado',true],
           ['Porque el indicador del tablero es poco preciso',false],
           ['Porque haría falta medir en más puntos de trabajo',false]],
      exp:'No es precisión ni número de puntos: el equilibrio térmico NO depende de la presión del circuito, así que un tapón que no aguanta da exactamente las mismas temperaturas que un sistema sano — y sin embargo se ha llevado media reserva hasta la ebullición.'};
  }
  if(m==='reto'){
    const sn=EQ({rpm:2500,carga:1,vKmh:40,falla:'sano'}),
          tp=EQ({rpm:2500,carga:1,vKmh:40,falla:'tapon'});
    return {t:'En cuesta, con el tapón agotado, este motor marca '+gC(tp.T)+
      ' y sano marca '+gC(sn.T)+': la misma cifra. ¿Qué se ha llevado el tapón por delante?',
      ops:[['El margen hasta la ebullición: de '+rotMargen(sn)+' a '+rotMargen(tp),true],
           ['Nada mientras la temperatura no suba',false],
           ['El caudal de la bomba, que ahora cavita',false]],
      exp:'La temperatura de equilibrio sale del balance de calor, donde la presión no aparece. Lo que fija la presión es la temperatura a la que ese líquido HIERVE. Por eso esta avería no la ve el indicador del tablero: hay que buscarla con el comprobador de presión.'};
  }
  const s=EQ();
  return {t:'El indicador del tablero marca '+gC(s.T)+' y el testigo está apagado. ¿Qué NO se sabe con eso?',
    ops:[['Cuánto margen queda hasta que el refrigerante hierva',true],
         ['La temperatura de salida del bloque',false],
         ['Si el motor está por encima de su alarma',false]],
    exp:'La aguja mide temperatura, no reserva. El margen hasta la ebullición depende además de la presión del circuito y de la altitud de la plaza, y ninguna de las dos cosas se lee en el tablero.'};
}
function refrescaPregunta(){
  QUIZ=preguntaDe(G.modo);
  QUIZ.ops=barajaEn(QUIZ.ops.map(o=>({rot:o[0],ok:o[1]})));
  el('q_text').innerHTML=QUIZ.t;
  el('dxbtns').innerHTML=QUIZ.ops.map((o,i)=>
    '<button class="b" data-q="'+i+'">'+o.rot+'</button>').join('');
}
function responde(i){
  if(!QUIZ||!QUIZ.ops[i]) return;
  const o=QUIZ.ops[i];
  [...el('dxbtns').children].forEach((b,k)=>{
    b.classList.toggle('ok',QUIZ.ops[k].ok);
    b.classList.toggle('wrong',k===i&&!o.ok);
  });
  showToast((o.ok?'<b class="good">Correcto.</b> ':'<b class="bad">No.</b> ')+QUIZ.exp,7600);
  synth.beep(o.ok?740:190,0.10,0.05);
}

// -------------------------------------------------------------------- otro caso
function otroCaso(){
  if(G.modo==='ensamble'){ initAssembly(); afterEdit(); return; }
  if(G.modo==='reto'){ armaReto(); afterEdit(); refrescaPregunta(); return; }
  const ops=ESCEN_KEYS.filter(k=>k!==G.esc);
  G.esc=ops[Math.floor(Math.random()*ops.length)];
  afterEdit(); refrescaPregunta();
  showToast('Escenario nuevo: <b>'+ESCEN[G.esc].rot+'</b>.',3000);
}

// ----------------------------------------------------------- recorrido guiado
let autoRunning=false, autoT=[];
function paraAuto(){ autoT.forEach(t=>clearTimeout(t)); autoT=[]; autoRunning=false; syncCtrlbar(); }
function auto(){
  if(autoRunning){ paraAuto(); return; }
  autoRunning=true; syncCtrlbar();
  const paso=[];
  let t=200;
  if(ASM.done.size<PARTS.length){
    paso.push([0,()=>{ setMode('ensamble'); showToast('<b>1 · Montaje.</b> Siete piezas, siete huecos, un lazo cerrado.',3000); }]);
    paso.push([600,()=>autoAssemble()]);
    t=600+PARTS.length*640+1300;
  }
  const guion=[
    ['balance','<b>2 · Balance.</b> Poco más de una cuarta parte del combustible acaba en el refrigerante, y de ahí sólo sale por tres sitios.'],
    ['termostato','<b>3 · Termostato.</b> No está para enfriar: está para que el motor caliente pronto. Agarrotado abierto tampoco vale.'],
    ['radiador','<b>4 · Radiador.</b> El ventilador y la marcha no se suman: manda el que más aire empuja.'],
    ['refrigerante','<b>5 · Refrigerante.</b> Más glicol no es más protección: pasado el eutéctico, protege menos.'],
    ['censo','<b>6 · Censo.</b> Con la aguja del tablero sola no se separan los catorce escenarios en ninguna máquina.'],
  ];
  guion.forEach(([m,msg])=>{
    paso.push([t,()=>{ setMode(m); showToast(msg,4200); }]); t+=5200;
  });
  paso.push([t,()=>{ paraAuto(); showToast('Recorrido terminado. El reto sigue esperando.',3400); }]);
  paso.forEach(([ms,fn])=>autoT.push(setTimeout(fn,ms)));
}

// ------------------------------------------------------------------- mandos
el('panel').addEventListener('click',ev=>{
  const b=ev.target.closest('button'); if(!b) return;
  if(b.id&&b.id.startsWith('m_')){ setMode(b.id.slice(2)); return; }
  if(b.id==='btnAuto'){ auto(); return; }
  if(b.id==='btnNew'){ otroCaso(); return; }
  if(b.id==='btnPista'){ pista(); return; }
  if(b.id==='btnCheck'){ checkReto(); return; }
  if(b.dataset.mk){ setMaquina(b.dataset.mk); return; }
  if(b.dataset.esc){ G.esc=b.dataset.esc; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.mz){ G.mezcla=b.dataset.mz; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.pl){ G.plaza=b.dataset.pl; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.ta){ G.Tamb=+b.dataset.ta; afterEdit(); return; }
  if(b.dataset.rpm){ G.rpm=+b.dataset.rpm; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.cg){ G.carga=+b.dataset.cg; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.v){ G.vKmh=+b.dataset.v; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.cf){ G.calefactor=(b.dataset.cf==='1'); afterEdit(); return; }
  if(b.dataset.obs){ mide(b.dataset.obs); return; }
  if(b.dataset.fam){ RETO.eleccion=b.dataset.fam; pintaDxReto(); pintaTablero(); pintaTele(); return; }
  if(b.dataset.q!==undefined){ responde(+b.dataset.q); return; }
});
function setMaquina(k){
  if(!ARQ[k]) return;
  G.maq=k;
  // El refrigerante vuelve al que pide el fabricante de ESE motor, y el régimen
  // a un valor que ese motor tiene. Arrastrar el ralentí del anterior publicaría
  // cifras de un punto de trabajo que esta máquina no alcanza.
  G.mezcla=MQ().mezclaOEM;
  G.rpm=2500;
  construyeMotor();
  if(G.simUnlocked) montaKit(); else initAssembly();
  if(G.modo==='reto') armaReto();
  afterEdit(); refrescaPregunta();
}

el('soundBtn').addEventListener('click',()=>{
  const on=synth.toggle();
  el('soundBtn').classList.toggle('on',on);
  el('soundBtn').textContent=on?'🔊':'🔇';
});

// -------------------------------------------------------------------- puente
// Sonda de pruebas. Expone LO QUE SE VE, no atajos que salten la interfaz: cada
// método hace exactamente lo mismo que haría un dedo sobre el panel.
window.__labDebug={
  get mode(){ return G.modo; },
  get unlocked(){ return G.simUnlocked; },
  get solved(){ return G.resuelto; },
  get piezas(){ return ASM.done.size; },
  get total(){ return PARTS.length; },
  get maquina(){ return G.maq; },
  get mezcla(){ return G.mezcla; },
  get mezclaEf(){ return mezclaEfectiva(); },
  get cabecera(){ return cabMezcla(); },
  get esc(){ return G.esc; },
  get plaza(){ return G.plaza; },
  get Tamb(){ return G.Tamb; },
  get rpm(){ return G.rpm; },
  get carga(){ return G.carga; },
  get vKmh(){ return G.vKmh; },
  get calefactor(){ return G.calefactor; },
  get eq(){ const s=EQ(); return {T:s.T, Tbruta:s.Tbruta, Tent:s.Tent, dtMotor:s.dtMotor,
    dtRad:s.dtRad, radFrio:s.radFrio, fracRad:s.fracRad, Trad:s.Trad,
    Qgen:s.Qgen, Qrad:s.Qrad, Qcal:s.Qcal, Qbloque:s.Qbloque,
    x:s.x, ventilador:s.ventilador, ciclando:s.ciclando, ciclo:s.ciclo,
    Qtot:s.Qtot, Qcau:s.Qcau, mAire:s.mAire, UA:s.UA, eps:s.eps, NTU:s.NTU,
    pRel:s.pRel, pTarado:s.pTarado, purga:s.purga, pAbs:s.pAbs,
    tEbu:s.tEbu, tCong:s.tCong, margen:s.margen, hierve:s.hierve, converge:s.converge,
    excede:s.excede, rotMargen:rotMargen(s),
    fria:s.fria, servicio:s.servicio, alarma:s.alarma}; },
  get cal(){ const c=CAL(); return {tAbre:c.tAbre, tServ:c.tServ, hirvio:c.hirvio,
    Cter:c.Cter, Tfinal:c.Tfinal, Teq:c.Teq, tEbu:c.tEbu, n:c.traza.length}; },
  get lect(){ const L=LECT(); return {esc:L.esc, rot:L.rot, clave:L.clave, mezcla:L.mezcla,
    alarmaEn:L.alarmaEn.slice(), hierveEn:L.hierveEn.slice(), tCong:L.tCong,
    gases:L.gases, pRel:L.pRel,
    pts:L.pts.map(p=>({k:p.k,T:p.T,dtRad:p.dtRad,venti:p.venti,hierve:p.hierve,
      margen:p.margen,x:p.x,radFrio:p.radFrio}))}; },
  get censo(){ const C=CENSO(), N=ESCEN_KEYS.length;
    const mejor={}; for(const c of C){ const n=c.sub.length;
      if(!mejor[n]||c.resueltos>mejor[n].resueltos) mejor[n]=c; }
    const min=C.filter(c=>c.resueltos===N).sort((a,b)=>a.sub.length-b.sub.length)[0];
    const tal=C.find(x=>x.sub.length===OBS.filter(o=>o.taller).length&&x.sub.every(o=>o.taller));
    const mascara=ks=>ks.reduce((a,k)=>a|(1<<OBS.findIndex(o=>o.k===k)),0);
    const aguja=C.find(c=>c.mask===mascara(['tRal','tCarr','tCuesta']));
    return {N, taller:tal.resueltos, aguja:aguja.resueltos,
      minTam:min?min.sub.length:null, minObs:min?min.sub.map(o=>o.k):null,
      porTam:Object.keys(mejor).map(n=>+mejor[n].resueltos)}; },
  get veredicto(){ return veredicto(); },
  get veredictoFrio(){ const v=veredictoFrio(); return {ok:v.ok, fria:v.fria, lento:v.lento,
    llega:v.llega, tServ:v.tServ, nivel:v.nivel, rot:v.rot}; },
  get reto(){ return {caso:RETO.caso, tomadas:Object.keys(RETO.tomadas),
    valores:{...RETO.tomadas}, eleccion:RETO.eleccion,
    veredicto:RETO.veredicto?{ok:RETO.veredicto.ok}:null,
    pistas:RETO.pistas, familias:FAMILIAS.slice()}; },
  get quiz(){ return QUIZ?{t:QUIZ.t, ops:QUIZ.ops.map(o=>o.rot), ok:QUIZ.ops.findIndex(o=>o.ok)}:null; },
  get autoRunning(){ return autoRunning; },
  get gotas(){ return {n:CIRC.gotas.length, vivas:CIRC.gotas.filter(g=>g.visible).length}; },
  get mangueras(){ return mangueras.length; },
  get frames(){ return PINTADAS; },
  setMode:m=>setMode(m),
  setMaquina:k=>setMaquina(k),
  set:(k,v)=>{ G[k]=v; afterEdit(); refrescaPregunta(); },
  ensambla:()=>autoAssemble(),
  mide:k=>mide(k),
  elige:f=>{ RETO.eleccion=f; pintaDxReto(); pintaTablero(); pintaTele(); },
  entrega:()=>checkReto(),
  pista:()=>pista(),
  retoNuevo:()=>{ armaReto(); afterEdit(); },
  responde:i=>responde(i),
  otro:()=>otroCaso(),
  auto:()=>auto(),
  cifras:()=>el('tele').textContent+' | '+el('report').textContent,
  texto:()=>el('hud').textContent,
  panel:()=>el('panel').textContent,
};

// ------------------------------------------------------------------- arranque
construyeMotor();
armaGotas();
initAssembly();
pintaHUD(); afterEdit(); refrescaPregunta();
// El hook del bucle se registra con setAnimate: start() no acepta callback, y
// pasárselo lo descarta en silencio dejando la escena congelada.
S.setAnimate(dt=>pinta3D(dt));
S.start();
addEventListener('resize',()=>S.resize());
showToast('Monta el circuito: toca una <b>pieza</b> del banco y luego su <b>hueco luminoso</b> en el motor.',5200);
