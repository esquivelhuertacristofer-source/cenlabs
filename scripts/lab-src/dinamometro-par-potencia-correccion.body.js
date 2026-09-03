const mount=document.getElementById('stage');
// Estas cifras sólo valen para el primer fotograma: en cuanto la escena arranca
// el encuadre se CALCULA, porque depende del tamaño del banco y de la forma de
// la ventana y no puede estar escrito a mano.
const S=createStage(mount,{cam:[7.6,4.6,11.2],target:[0.5,1.90,0.25],
  bgTop:'#151b23',bgBot:'#05070b',bloom:0.26,minD:2.6,maxD:42});
const {scene}=S;
const synth=makeSynth({type:'sawtooth',type2:'sine',filterFreq:880,Q:0.62});
// `clamp` NO se declara aquí: lo declara el motor sellado que se empalma justo
// debajo, y declararlo dos veces es un SyntaxError que mata la página entera
// antes de que exista window.__labDebug.
const el=id=>document.getElementById(id);
const TINTA='#e8eef6', CIAN='#5ad1e6', OK_HEX='#7cd992', WARN_HEX='#e9c46a',
      BAD_HEX='#ff6b6b', GRIS='#7b8697', VIO='#b48ce0', NARANJA='#f0a05a',
      AZUL='#6ea8fe', ROSA='#f28dbb';

// ============================================================================
//  d6-14 · DINAMÓMETRO: PAR, POTENCIA Y CORRECCIÓN A NORMA — MOTOR SELLADO
//
//  QUÉ SE MIDE
//  Un coche amarrado a un banco de rodillos, o un motor colgado de un freno.
//  Lo que sale del banco son un par y unas vueltas; todo lo demás —la potencia,
//  la corrección a norma, la potencia «al cigüeñal»— es ARITMÉTICA sobre esas
//  dos cifras, y cada paso de esa aritmética es una decisión que cambia el
//  número publicado sin tocar el motor.
//
//  LA TESIS. «Caballos» no es una unidad: es el final de una cadena de
//  convenios. El mismo coche, el mismo día, medido bien, da números distintos
//  según la norma con la que se corrija, el banco en el que se mida y hasta la
//  marcha que se meta, y ninguno de ellos es mentira. Lo que sí es mentira es
//  publicar uno sin decir cuál.
//
//  CÓMO SE RESUELVE
//  · El aire se trata como aire HÚMEDO: la presión de vapor se calcula con
//    Magnus y se RESTA, porque todas las normas corrigen sobre presión SECA.
//    El vapor ocupa sitio en el cilindro y no quema.
//  · El motor responde a la densidad de verdad: el par indicado escala con la
//    masa de aire admitida y el par de fricción NO escala. De ahí sale el
//    factor de corrección VERDADERO de este motor, que es el único que acierta
//    y el único que en un taller no se puede conocer.
//  · Las normas aplican su fórmula, que es un MODELO de esa respuesta. La SAE
//    J1349 vale 1,18·D − 0,18, y esos dos números no son arbitrarios: son la
//    recta tangente al modelo de 85 % de rendimiento mecánico en el punto de
//    referencia. Por eso la norma se acota entre 0,93 y 1,07 — es donde la
//    recta todavía se parece a la curva.
//  · El banco de inercia mide J·ω·dω/dt en el RODILLO. Lo que pase entre el
//    pistón y el rodillo —la inercia del propio motor, el deslizamiento del
//    neumático, las pérdidas de la transmisión— se queda fuera del número.
//  · El calor se acumula: cada pasada calienta la admisión, y sin ventilador la
//    tercera pasada del mismo coche da menos que la primera.
//
//  QUÉ NO MODELA. La corrección por temperatura de refrigerante y de aceite; la
//  deriva térmica de la célula de carga; la dinámica del embrague; el par de
//  las ruedas no motrices; el término de humedad específica que la SAE J1349
//  añade a los motores de encendido por compresión con recirculación de gases.
//  Y no sustituye al procedimiento de ensayo: las cifras de un vehículo
//  concreto salen del manual del fabricante de ese vehículo.
//
//  FUENTES
//  · SAE J1349 (rev. AGO 2004) — Engine Power Test Code, Spark Ignition and
//    Compression Ignition, Net Power Rating.
//  · SAE J607 (histórica, hasta 1972) — Gross Power Rating.
//  · SAE J2723 — Certified Power Rating (procedimiento de verificación).
//  · ISO 1585:2020 — Road vehicles, engine test code, net power.
//  · Directiva 80/1269/CEE y modificaciones (equivalente europeo de la ISO).
//  · DIN 70020-6 — Kraftfahrzeugbau, Motorleistung.
//  · SAE J1263 y J2263 — Road load measurement and dynamometer simulation.
//  · Heywood, «Internal Combustion Engine Fundamentals», caps. 2 y 13.
//  · Martyr y Plint, «Engine Testing: Theory and Practice», 4.ª ed., caps. 9-11.
// ============================================================================

// El kit de la escena NO trae `clamp`: vive por debajo del marcador del donante
// y el ensamblador lo recorta con el resto del laboratorio anterior. Se declara
// aquí, una sola vez, y por eso la Capa 1 lo inyecta antes de evaluar el motor.
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// Fisher-Yates. El cuestionario baraja las opciones para que la posición de la
// respuesta correcta no sea una pista, y esta función también viene del cuerpo
// del donante, o sea que también hay que traerla.
function barajaEn(a){
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));
    const t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}

// ============================================================================
//  §1 · AIRE HÚMEDO
//  Todas las normas corrigen sobre presión de aire SECO, y ninguna lo dice en el
//  título. El vapor de agua ocupa volumen en el cilindro y no participa en la
//  combustión, así que lo que cuenta es la presión parcial del aire seco:
//  p_seca = p_total − p_vapor. En un día caluroso y húmedo al nivel del mar el
//  vapor se lleva casi 60 hPa, que en presión son más de quinientos metros de
//  altitud, y esos metros no aparecen en ningún altímetro.
// ============================================================================
const R_SECO=287.058;      // J/(kg·K), aire seco
const R_VAPOR=461.495;     // J/(kg·K), vapor de agua

/** Presión atmosférica por la atmósfera estándar internacional. Pa. */
function presionISA(h){
  return 101325*Math.pow(1-2.25577e-5*Math.max(0,h), 5.25588);
}
/** Presión de saturación del vapor de agua, Magnus-Tetens sobre agua. Pa. */
function pSat(TC){
  return 610.78*Math.pow(10, 7.5*TC/(237.3+TC));
}
/** Presión parcial del aire SECO. Pa. */
function presionSeca(p, TC, hr){
  return Math.max(1e3, p - clamp(hr,0,1)*pSat(TC));
}
/** Densidad del aire húmedo por la ley de Dalton de las presiones parciales.
 *  Contra la intuición, el aire húmedo pesa MENOS: el vapor de agua tiene 18
 *  gramos por mol contra los 29 del aire seco. kg/m³. */
function densidadAire(p, TC, hr){
  const T=TC+273.15, pv=clamp(hr,0,1)*pSat(TC), pd=Math.max(1e3,p-pv);
  return pd/(R_SECO*T) + pv/(R_VAPOR*T);
}

// ============================================================================
//  §2 · LAS NORMAS DE CORRECCIÓN
//  Cada norma es un convenio de tres partes: unas condiciones de referencia, una
//  fórmula y un intervalo de validez. Las tres importan y la tercera se olvida
//  siempre.
//
//  La SAE J1349 es la única que no tiene forma de cociente de densidades: vale
//  1,18·D − 0,18. Esos dos números salen de suponer que el motor rinde el 85 %
//  mecánico a plena carga, es decir que el par de fricción es el 15 % del
//  indicado y NO cambia con la densidad. Corrigiendo sólo la parte que sí
//  cambia sale cf = 0,85·D/(1 − 0,15·D), cuya recta tangente en D = 1 es
//  exactamente 1,18·D − 0,18. Ahí está el intervalo 0,93–1,07: es el trozo en
//  el que la recta y la curva todavía se parecen.
// ============================================================================
const LIM_NORMA=[0.93, 1.07];
/** El modelo de rendimiento mecánico que la SAE J1349 lleva dentro. */
const ETA_MEC_NORMA=0.85;
/** Sobrecoste declarado de la «potencia bruta»: sin alternador, sin bomba de
 *  agua, sin filtro de aire y con colectores de ensayo en vez del escape del
 *  coche. La diferencia documentada entre bruta y neta va del 10 % al 25 %
 *  según el motor; aquí se toma el 12 %, y es una ELECCIÓN de este modelo, no
 *  una medida de ningún motor concreto. */
const BRUTA_EXTRA=0.12;

const NORMAS={
  observada:{
    rot:'Sin corregir (observada)', corto:'observada',
    pRef:null, TRef:null, acota:false, bruta:false,
    nota:'Lo que dio el banco ese día en ese sitio. Es el único número que no depende de ningún convenio, y el único que se puede publicar honradamente cuando el factor se sale de su intervalo.',
    cf:function(){ return 1; },
  },
  j1349:{
    rot:'SAE J1349 (rev. 2004)', corto:'SAE J1349',
    pRef:99000, TRef:298.15, acota:true, bruta:false,
    nota:'990 mbar de aire SECO y 25 °C. Su fórmula lleva dentro la hipótesis de 85 % de rendimiento mecánico, y por eso no es un cociente de densidades sino una recta.',
    cf:function(pd,T){ return 1.18*((99000/pd)*Math.sqrt(T/298.15))-0.18; },
  },
  iso1585:{
    rot:'ISO 1585 · 80/1269/CEE', corto:'ISO 1585',
    pRef:99000, TRef:298.15, acota:true, bruta:false,
    nota:'Las mismas condiciones de referencia que la SAE J1349 y otra fórmula: exponentes 1,2 en la presión y 0,6 en la temperatura, ajustados sobre ensayos en vez de deducidos de un modelo.',
    cf:function(pd,T){ return Math.pow(99000/pd,1.2)*Math.pow(T/298.15,0.6); },
  },
  din70020:{
    rot:'DIN 70020', corto:'DIN 70020',
    pRef:101300, TRef:293.15, acota:false, bruta:false,
    nota:'1 013 mbar y 20 °C: aire más frío y más denso que el de las normas modernas, así que para el mismo motor su número de referencia sale más alto. No es que el motor rinda más: es que el aire de referencia es mejor.',
    cf:function(pd,T){ return (101300/pd)*Math.sqrt(T/293.15); },
  },
  j607:{
    rot:'SAE J607 «bruta» (hasta 1972)', corto:'SAE J607',
    pRef:101325, TRef:288.71, acota:false, bruta:true,
    nota:'29,92 inHg y 60 °F, y sobre todo: el motor se medía SIN alternador, sin bomba de agua, sin filtro y sin el escape del coche. De ahí salen las cifras de los años sesenta que nadie ha vuelto a repetir.',
    cf:function(pd,T){ return (101325/pd)*Math.sqrt(T/288.71); },
  },
};
const NORMA_KEYS=Object.keys(NORMAS);

/** El factor de la ISO 1585 para motores de ENCENDIDO POR COMPRESIÓN no es el
 *  mismo, y con razón: un diésel no aspira mezcla, aspira aire y le inyecta el
 *  gasóleo que haga falta, así que su respuesta a la densidad depende de lo
 *  cargado que vaya. α = f_a^f_m, con f_a atmosférico y f_m función del
 *  combustible por ciclo y por litro de cilindrada. Por debajo de 40 mg/(L·
 *  ciclo) f_m vale 0,3: un diésel poco cargado apenas se corrige. */
function fMotorDiesel(qc){
  if(qc<40) return 0.3;
  if(qc>65) return 1.2;
  return 0.036*qc-1.14;
}
function cfDieselISO(pd, T, qc){
  const fa=(99000/pd)*Math.pow(T/298.15,0.7);
  return Math.pow(fa, fMotorDiesel(qc));
}
/** La curva de la que 1,18·D − 0,18 es la tangente. Se dibuja al lado de la
 *  recta de la norma para que se vea dónde deja de parecerse. */
function cfModelo85(D){
  return ETA_MEC_NORMA*D/(1-(1-ETA_MEC_NORMA)*D);
}

// ============================================================================
//  §3 · EL FACTOR VERDADERO DE ESTE MOTOR
//  Un factor de corrección es una PREDICCIÓN: cuánto daría este motor si el aire
//  fuese el de referencia. La única forma de saber si acierta es tener el motor
//  y preguntárselo dos veces, una en cada aire. Eso es lo que hace este banco, y
//  es la única cifra del laboratorio que en un taller de verdad no existe.
// ============================================================================
/** Par de fricción a plena carga, N·m. Crece con las vueltas —película de
 *  aceite, segmentos, accesorios— y NO depende de la densidad del aire. Es esa
 *  independencia la que rompe el cociente de densidades. */
function parFriccion(e, rpm){
  const x=rpm/e.rpmMax;
  return e.parFric0*(1+0.85*x*x);
}
/** Par INDICADO en condiciones de referencia, N·m: la forma de la curva. */
function parIndicadoRef(e, rpm){
  const x=(rpm-e.rpmPar)/Math.max(1,e.rpmMax-e.rpmRal);
  return e.parIndMax*clamp(1-e.kCurva*x*x, 0.30, 1.05);
}
/** Cuánta de la carga de referencia le entra DE VERDAD al cilindro.
 *
 *  Para un atmosférico es el cociente de densidades del aire seco, y punto.
 *
 *  Para un sobrealimentado no, y ésta es la razón de que corregir un turbo con
 *  la fórmula de un atmosférico invente potencia que el motor no ha dado nunca:
 *  un turbo no persigue una presión de SOPLADO, persigue una presión ABSOLUTA
 *  de colector. Cuando el ambiente baja, el mando sube la relación de presiones
 *  hasta sostenerla, y sólo se rinde cuando al eje se le acaba el margen. Lo
 *  único que pierde por el camino es densidad térmica: comprimir más deja el
 *  aire más caliente aunque el intercooler trabaje. `castigoTermico` está
 *  calibrado contra las cifras medidas en mecanica-123. */
function razonCarga(e, pdObs, TObsK, pdRef, TRefK){
  const bruta=(pdObs/TObsK)/(pdRef/TRefK);
  if(!e.sobrealimentado) return bruta;
  const piRef=e.pColRef/pdRef;
  const piReq=e.pColRef/pdObs;
  const pi=Math.min(piReq, e.piMax);
  const termico=1-e.castigoTermico*(pi/piRef-1);
  return clamp((pi/piReq)*termico*(TRefK/TObsK), 0.15, 1.30);
}
/** Par NETO al cigüeñal en las condiciones que sean. N·m. */
function parNeto(e, rpm, pd, TK){
  const ind=parIndicadoRef(e,rpm)*razonCarga(e,pd,TK,e.pdRef,e.TRefK);
  return Math.max(0, ind-parFriccion(e,rpm));
}
/** El factor que este motor MERECE: el que lleva su par observado exactamente
 *  al par que daría en las condiciones de referencia de la norma. */
function cfVerdadero(e, rpm, pd, TK, pdRef, TRefK){
  const obs=parNeto(e,rpm,pd,TK);
  if(obs<=1e-6) return null;
  return parNeto(e,rpm,pdRef,TRefK)/obs;
}

// ============================================================================
//  §4 · LOS BANCOS
//  Tres máquinas que miden tres cosas distintas y las tres se publican como
//  «potencia». El de motor mide el par en el cigüeñal con un brazo y una célula
//  de carga. El de rodillos de inercia no mide par: mide una ACELERACIÓN y la
//  multiplica por una inercia conocida. El de rodillos con freno sí mide par,
//  pero en el rodillo, y tarda mucho más en barrer el régimen.
// ============================================================================
const BANCOS={
  motor:{
    rot:'Banco de motor con freno de célula', corto:'de motor',
    rueda:false, inercia:false, sostiene:true,
    nota:'Mide el par en el cigüeñal con un brazo y una célula de carga: P = F·L·ω. No hay transmisión, ni neumático, ni deslizamiento. Es lo que homologa el fabricante, y es lo que ningún taller tiene.',
  },
  inercia:{
    rot:'Rodillos de inercia', corto:'de inercia',
    rueda:true, inercia:true, sostiene:false,
    nota:'No mide par: mide cuánto acelera un rodillo de inercia conocida y multiplica. Rápido y barato, y todo lo que se quede entre el pistón y el rodillo no aparece en la hoja.',
  },
  freno:{
    rot:'Rodillos con freno de corrientes parásitas', corto:'con freno',
    rueda:true, inercia:false, sostiene:true,
    nota:'Sostiene el régimen y mide el par en el rodillo con una célula. Puede quedarse en un punto todo el tiempo que haga falta, y por eso es también el que más calienta el motor.',
  },
};
const BANCO_KEYS=Object.keys(BANCOS);
/** Radio del rodillo, m. Un rodillo grande de 18 pulgadas. */
const R_RODILLO=0.2286;
/** Inercia del juego de rodillos, kg·m². Equivale a 1 052 kg de masa lineal en
 *  la superficie del rodillo, que es lo que declara un banco de inercia de
 *  taller de tamaño medio. */
const J_RODILLO=55;

/** Inercia que el banco de rodillos CONOCE, referida al rodillo. El coche está
 *  amarrado y no se mueve: su masa no acelera y no entra aquí. Lo que gira son
 *  el rodillo y las ruedas. kg·m². */
function inerciaConocida(e){
  const n=e.rRueda/R_RODILLO;
  return J_RODILLO + e.jRuedas/(n*n);
}
/** Esa misma inercia referida al CIGÜEÑAL: es contra lo que el motor empuja, y
 *  crece con el cuadrado de la marcha. En una marcha larga el motor arrastra
 *  mucha más inercia y por eso acelera más despacio. kg·m². */
function inerciaConocidaEnCiguenal(e, marcha){
  const n=e.rRueda/R_RODILLO, r=e.relaciones[marcha]*e.grupo;
  return inerciaConocida(e)*Math.pow(n/r,2);
}

// ============================================================================
//  §5 · LA TRANSMISIÓN Y LA DESACELERACIÓN LIBRE
//  De la rueda al cigüeñal hay una pérdida, y la costumbre de aplicarle «el
//  15 %» a todo es exactamente igual de rigurosa que adivinarla. La pérdida se
//  MIDE: se corta el gas al final del barrido, se deja el coche rodando en la
//  misma marcha y se cronometra cómo se para. La desaceleración por la inercia
//  conocida da el par de pérdidas punto por punto.
//
//  Y esa pérdida no tiene forma de porcentaje: es un par casi constante
//  (engranajes, retenes, rodamientos) más un término que crece con la velocidad
//  (batido del aceite, histéresis del neumático). Un par constante sobre una
//  potencia que crece con las vueltas da un PORCENTAJE QUE BAJA. La regla del
//  15 % no puede ser cierta a la vez en un utilitario y en un deportivo.
// ============================================================================
/** El ARRASTRE: la parte de la pérdida que no depende del par que se transmite
 *  —rodamientos, retenes, batido del aceite, histéresis del neumático—. Es la
 *  única parte que una desaceleración libre puede medir, porque una
 *  desaceleración se hace con el gas cortado. N·m en la rueda. */
function parArrastre(e, wRueda, F){
  const seco=e.perdSeca*(F.neumaticoFlojo?1.55:1)*(F.rodilloSucio?1.18:1);
  const visc=e.perdVisc*(F.neumaticoFlojo?1.90:1);
  return seco + visc*wRueda;
}
/** La pérdida TOTAL, que además del arrastre lleva el rendimiento de los
 *  engranes: cada engrane rinde entre el 97 y el 98 %, y esa parte es
 *  proporcional al par que pasa por él.
 *
 *  Aquí está lo que ninguna hoja de banco dice: con el gas cortado no pasa par
 *  por los engranes, así que la desaceleración libre NO ve esta parte y ningún
 *  método de pérdidas la devuelve. Por eso una potencia «corregida por
 *  desaceleración» sigue saliendo por debajo de la de un banco de motor. */
function parPerdidas(e, wRueda, parEntrada, F){
  return parArrastre(e,wRueda,F) + (1-e.etaTrans)*Math.max(0,parEntrada||0);
}
/** Deslizamiento del neumático sobre el rodillo, fracción. El rodillo gira
 *  menos que el neumático: el banco cree que el coche va más despacio de lo que
 *  va y la potencia que calcula sale por debajo. La potencia que se pierde ahí
 *  se queda en el neumático en forma de calor, y por eso un banco de rodillos
 *  huele a goma.
 *
 *  Y depende del BANCO, que es lo que separa dos averías que si no serían la
 *  misma: un freno que sostiene la carga treinta segundos le da al coche tiempo
 *  de caminarse sobre unos amarres flojos, y un barrido de inercia de ocho
 *  segundos no. El rodillo sucio, en cambio, patina igual en los dos. */
function deslizamiento(e, parRueda, F, banco){
  const carga=parRueda/Math.max(1,e.parRuedaRef);
  const sostiene=BANCOS[banco]&&BANCOS[banco].sostiene;
  const mas=(F.neumaticoFlojo?3.2:1)
          *(F.rodilloSucio?4.5:1)
          *(F.amarreFlojo?(sostiene?4.6:1.8):1);
  return clamp(e.slipBase*carga*mas, 0, 0.18);
}

// ============================================================================
//  §6 · EL CALOR QUE SE ACUMULA
//  Un banco de rodillos mete un coche parado en un cuarto cerrado y le pide
//  plena carga. Sin un ventilador que empuje aire de verdad, el radiador
//  calienta el cuarto, el cuarto calienta la admisión y cada pasada empieza más
//  caliente que la anterior. El número baja pasada a pasada sin que nada del
//  motor haya cambiado, y por eso una serie de tres pasadas se lee AL REVÉS: la
//  primera es la medida y las otras dos dicen si el banco estaba bien montado.
// ============================================================================
/** Sobretemperatura de la admisión en la pasada n, K por encima del cuarto. */
function calentamiento(e, pasada, F, banco){
  const sinAire=F.sinVentilador||F.aireRecirculado;
  if(!sinAire && pasada<=1) return 0;
  const porPasada=sinAire?e.dTPasada:e.dTPasada*0.16;
  const lento=BANCOS[banco].sostiene?1.7:1;   // el freno sostiene la carga mucho más
  // Serie geométrica truncada: cada pasada añade menos que la anterior porque
  // el cuarto también evacúa. La suma converge, y ese techo es la temperatura
  // a la que el banco se queda si no se para.
  const q=0.62;
  return porPasada*lento*(1-Math.pow(q,pasada))/(1-q);
}

// ============================================================================
//  §7 · LO QUE EL BARRIDO SE QUEDA PARA SÍ
//  En un banco de inercia la potencia sale de una derivada, y una derivada
//  necesita que la cosa cambie. Cuanto más deprisa se barre el régimen, más par
//  se queda dentro del motor acelerando su propio volante — y ese par no llega
//  al rodillo ni aparece en la hoja.
//
//  De ahí sale el resultado que nadie se cree la primera vez: el MISMO coche da
//  MÁS potencia en una marcha larga. La desmultiplicación es menor, el motor
//  arrastra más inercia referida a su eje, acelera más despacio, y se guarda una
//  fracción menor del par para sí mismo. La fracción perdida vale exactamente
//  J_motor / (J_motor + J_conocida_en_cigüeñal), y no depende del par.
// ============================================================================
/** Fracción de la potencia que el banco de inercia NO ve porque se va a
 *  acelerar el propio motor. Cero en un banco que sostiene el régimen. */
function fraccionRobada(e, marcha, banco){
  if(!BANCOS[banco].inercia) return 0;
  const jc=inerciaConocidaEnCiguenal(e,marcha);
  return e.jMotor/(e.jMotor+jc);
}
/** Aceleración del cigüeñal durante el barrido, rad/s². Sale de dividir el par
 *  neto disponible entre TODA la inercia que hay colgada del eje. */
function aceleracionMotor(e, parCigNeto, marcha, banco){
  if(!BANCOS[banco].inercia) return 0;
  const j=e.jMotor+inerciaConocidaEnCiguenal(e,marcha);
  return Math.max(0.05, parCigNeto/j);
}

// ============================================================================
//  §8 · LOS CUATRO VEHÍCULOS
//  Dos atmosféricos y dos sobrealimentados, y no por variedad: las normas de
//  corrección se escribieron midiendo atmosféricos, y el par de este laboratorio
//  es justamente ver qué le pasa a esa fórmula cuando se le pone delante un
//  motor que se defiende del ambiente. El 1.4 T y el 2.0 TDI son los mismos de
//  mecanica-123, para que las dos prácticas se puedan leer juntas.
//
//  `pdRef` y `TRefK` son la referencia INTERNA del modelo —990 mbar secos y
//  25 °C, la de la SAE J1349— y no la de la norma que el alumno elija: el motor
//  no sabe qué norma se va a usar para publicarlo.
// ============================================================================
const ARQ={
  na16:{
    key:'na16', corto:'1.6 atmosférico', nombre:'Turismo 1.6 L atmosférico de gasolina, 2015',
    cilindrada:1.598, cil:4, diesel:false, sobrealimentado:false, qc:null,
    parIndMax:183, parFric0:20.2, kCurva:0.80,
    rpmRal:750, rpmPar:4200, rpmMax:6500,
    pdRef:99000, TRefK:298.15,
    masa:1250, rRueda:0.311, jRuedas:4.8, jMotor:0.145,
    relaciones:[3.45,1.95,1.36,1.03,0.82], grupo:4.35, marchaTipica:3,
    perdSeca:36, perdVisc:0.23, etaTrans:0.955, slipBase:0.012, parRuedaRef:700,
    dTPasada:9,
    nota:'El motor para el que se escribieron las normas: aspira lo que le dé el aire y no tiene con qué defenderse.',
  },
  turbo14:{
    key:'turbo14', corto:'1.4 turbo', nombre:'Turismo 1.4 L turbo de gasolina, 2016',
    cilindrada:1.395, cil:4, diesel:false, sobrealimentado:true, qc:null,
    pColRef:198000, piMax:3.2, castigoTermico:0.1747,
    parIndMax:288, parFric0:24, kCurva:0.70,
    rpmRal:800, rpmPar:2600, rpmMax:6000,
    pdRef:99000, TRefK:298.15,
    masa:1310, rRueda:0.311, jRuedas:4.8, jMotor:0.152,
    relaciones:[3.62,2.05,1.35,1.03,0.84,0.68], grupo:4.06, marchaTipica:3,
    perdSeca:44, perdVisc:0.45, etaTrans:0.955, slipBase:0.013, parRuedaRef:1000,
    dTPasada:11,
    nota:'El mismo motor de mecanica-123. Su mando de presión persigue una presión ABSOLUTA de colector, así que en altura se defiende y la fórmula de la norma deja de valer para él.',
  },
  tdi20:{
    key:'tdi20', corto:'2.0 TDI', nombre:'Turismo 2.0 L turbodiésel de inyección directa, 2018',
    cilindrada:1.968, cil:4, diesel:true, sobrealimentado:true, qc:87,
    pColRef:226000, piMax:3.4, castigoTermico:0.160,
    parIndMax:364, parFric0:32, kCurva:0.606,
    rpmRal:750, rpmPar:2000, rpmMax:4400,
    pdRef:99000, TRefK:298.15,
    masa:1420, rRueda:0.316, jRuedas:5.2, jMotor:0.198,
    relaciones:[3.77,1.96,1.18,0.87,0.68,0.55], grupo:3.94, marchaTipica:3,
    perdSeca:52, perdVisc:0.60, etaTrans:0.955, slipBase:0.013, parRuedaRef:1200,
    dTPasada:10,
    nota:'Un diésel moderno va tan cargado que el factor de motor de la ISO 1585 se queda pegado a su tope de 1,2: la tabla de la norma se escribió para diésel de otra época.',
  },
  v8na:{
    key:'v8na', corto:'V8 5.0 atmosférico', nombre:'Deportivo 5.0 L V8 atmosférico de gasolina, 2019',
    cilindrada:5.038, cil:8, diesel:false, sobrealimentado:false, qc:null,
    parIndMax:620, parFric0:75, kCurva:0.62,
    rpmRal:700, rpmPar:4600, rpmMax:7000,
    pdRef:99000, TRefK:298.15,
    masa:1780, rRueda:0.330, jRuedas:6.4, jMotor:0.260,
    relaciones:[4.17,2.34,1.52,1.14,0.87,0.69], grupo:3.55, marchaTipica:3,
    perdSeca:105, perdVisc:0.72, etaTrans:0.945, slipBase:0.016, parRuedaRef:2400,
    dTPasada:13,
    nota:'Mucha potencia y mucha inercia de volante: es el que más se deja en el barrido de un banco de inercia, y el que más desmiente la regla del quince por ciento.',
  },
};
const ARQ_KEYS=Object.keys(ARQ);

// ============================================================================
//  §9 · LOS NUEVE MONTAJES
//  No son averías del motor: son errores del ENSAYO. Ninguno de los nueve
//  estropea el coche, y los nueve cambian el número que sale publicado. Es la
//  diferencia entre medir y creerse el resultado.
// ============================================================================
const FALLAS={
  sano:{ rot:'nada: el ensayo está bien montado', corto:'bien montado',
    pista:'Nada que buscar.' },
  sinEstacion:{ rot:'estación meteorológica desconectada', corto:'sin estación',
    pista:'El programa corrige igual, con los últimos valores que tenía guardados. Nadie ve un aviso.' },
  sinVentilador:{ rot:'sin ventilador de refrigeración', corto:'sin ventilador',
    pista:'El coche está parado en un cuarto cerrado a plena carga. El aire de admisión sube pasada a pasada.' },
  aireRecirculado:{ rot:'el ventilador recircula aire caliente', corto:'aire recirculado',
    pista:'Hay ventilador, pero sopla contra una pared. Y la estación mide justo ese aire.' },
  captadorDoble:{ rot:'el captador de vueltas cuenta el doble', corto:'captador doble',
    pista:'Pinza inductiva sobre una bobina de chispa perdida. El eje de las vueltas sale multiplicado por dos.' },
  neumaticoFlojo:{ rot:'neumático con poca presión', corto:'neumático flojo',
    pista:'Se calienta, se deforma y patina sobre el rodillo.' },
  amarreFlojo:{ rot:'amarres flojos: el coche se mueve', corto:'amarres flojos',
    pista:'Además de falsear la medida, es la forma en que un coche se sale de un banco.' },
  rodilloSucio:{ rot:'rodillo con aceite', corto:'rodillo sucio',
    pista:'Un rodillo sucio no agarra, y lo que no agarra no transmite.' },
  celulaDescalibrada:{ rot:'célula de carga con el cero desplazado', corto:'célula descalibrada',
    pista:'Un banco de inercia no tiene célula de carga: en ése esta avería no existe.' },
};
const FALLA_KEYS=Object.keys(FALLAS);
function averia(k){
  const F={};
  for(const kk of FALLA_KEYS) F[kk]=false;
  F[k===undefined?'sano':k]=true;
  F.key=k||'sano';
  return F;
}

// ============================================================================
//  §10 · MÉTODOS DE PÉRDIDAS
//  Cómo se pasa de la potencia en la rueda a la potencia en el cigüeñal. Es la
//  decisión que más número mueve y la que menos se declara.
// ============================================================================
const PERDIDAS={
  ninguna:{ rot:'No se convierte: se publica la de la rueda', corto:'en rueda',
    nota:'Honrado y poco vendedor. Es lo único que el banco de rodillos ha medido de verdad.' },
  coastdown:{ rot:'Desaceleración libre medida', corto:'medida',
    nota:'Se corta el gas y se cronometra cómo se para. La inercia conocida por la desaceleración da el par de pérdidas punto por punto.' },
  regla15:{ rot:'La regla del 15 %', corto:'regla 15 %',
    nota:'Dividir por 0,85 y a otra cosa. Es la costumbre del sector y no puede ser cierta a la vez en un utilitario y en un deportivo.' },
};
const PERD_KEYS=Object.keys(PERDIDAS);

// ============================================================================
//  §11 · LOS CINCO SITIOS
//  El ensayo no ocurre en una tabla: ocurre en un taller que está en algún sitio
//  y algún día. Dos de estos cinco quedan dentro del intervalo de validez de las
//  normas modernas y tres no, y eso ya es la mitad de la práctica.
// ============================================================================
const ESCENARIOS=[
  {k:'mar25',  rot:'Nivel del mar, 25 °C, 40 %',       alt:0,    TC:25, hr:0.40},
  {k:'mar40h', rot:'Nivel del mar, 40 °C, 80 %',       alt:0,    TC:40, hr:0.80},
  {k:'mar5s',  rot:'Nivel del mar, 5 °C, 20 %',        alt:0,    TC:5,  hr:0.20},
  {k:'cdmx',   rot:'Ciudad de México, 2 240 m, 22 °C', alt:2240, TC:22, hr:0.45},
  {k:'toluca', rot:'Toluca, 2 660 m, 18 °C',           alt:2660, TC:18, hr:0.40},
];
const ESC_KEYS=ESCENARIOS.map(function(E){ return E.k; });

// ============================================================================
//  §12 · EL ENSAYO ENTERO
//  De la atmósfera al número publicado, sin saltarse un paso. Los cinco tramos
//  —lo que respira el motor, lo que da el cigüeñal, lo que llega al rodillo, lo
//  que el banco cree haber visto y lo que la norma multiplica— se guardan por
//  separado, porque la práctica consiste justamente en ver dónde se pierde cada
//  cosa y quién se lo queda.
// ============================================================================
/** Lo que el motor respira de verdad. */
function condiciones(e, P, F){
  const pAmb=presionISA(P.alt);
  const dTsoak=calentamiento(e,P.pasada,F,P.banco);
  // Calentar el aire no crea ni condensa vapor: la presión parcial de vapor es
  // la del cuarto y se conserva. Lo que cambia es la humedad RELATIVA.
  const pv=clamp(P.hr,0,1)*pSat(P.TC);
  const TAdmC=P.TC+dTsoak, TAdmK=TAdmC+273.15;
  const pd=Math.max(1e3,pAmb-pv);
  return {pAmb:pAmb, pv:pv, dTsoak:dTsoak, TAdmC:TAdmC, TAdmK:TAdmK, pd:pd,
    rho:pd/(R_SECO*TAdmK)+pv/(R_VAPOR*TAdmK)};
}
/** Lo que la estación meteorológica del banco DICE. No siempre es lo que hay. */
function estacionDice(e, P, F, C){
  // Sin estación el programa no se para: sigue corrigiendo con los últimos
  // valores guardados, que son los del día en que se instaló.
  if(F.sinEstacion) return {p:101325, TC:20, hr:0.30, veraz:false};
  // El termómetro está donde está. Si el ventilador recircula, mide el mismo
  // aire caliente que respira el motor; si sencillamente no hay ventilador, el
  // cuarto se calienta menos que la admisión y la estación se queda corta.
  const k=F.aireRecirculado?1.00:(F.sinVentilador?0.35:0.0);
  const TC=P.TC+C.dTsoak*k;
  return {p:C.pAmb, TC:TC, hr:clamp(C.pv/pSat(TC),0,1), veraz:true};
}

function evalua(e, P){
  const F=(P.falla&&P.falla.key!==undefined)?P.falla:averia(P.falla);
  const b=BANCOS[P.banco], N=NORMAS[P.norma];
  const C=condiciones(e,P,F);
  const E=estacionDice(e,P,F,C);
  const w=P.rpm*Math.PI/30;

  // ---- 1 · lo que da el cigüeñal, que es lo único que el motor sabe hacer
  const parCig=parNeto(e,P.rpm,C.pd,C.TAdmK);
  const potCig=parCig*w;

  // ---- 2 · lo que llega al rodillo y lo que el banco cree ver
  let wRueda=null, parRueda=null, slip=0, robada=0, parLeido=null, potLeida=null,
      r=null, parPerd=0;
  if(b.rueda){
    r=e.relaciones[P.marcha]*e.grupo;
    wRueda=w/r;
    parPerd=parPerdidas(e,wRueda,parCig*r,F);
    parRueda=Math.max(0,parCig*r-parPerd);
    slip=deslizamiento(e,parRueda,F,P.banco);
    robada=b.inercia?fraccionRobada(e,P.marcha,P.banco):0;
    // El cero desplazado de la célula se mide EN EL RODILLO, en unidades de par
    // de rueda. Y un banco de inercia no tiene célula de carga: en ése esta
    // avería sencillamente no existe, y ésa es la forma de separarla del resto.
    const cero=(!b.inercia&&F.celulaDescalibrada)?e.parRuedaRef*0.035:0;
    parLeido=parRueda*(1-slip)*(1-robada)+cero;
    potLeida=parLeido*wRueda;
  }else{
    const cero=F.celulaDescalibrada?e.parIndMax*0.035:0;
    parLeido=parCig+cero;
    potLeida=parLeido*w;
  }

  // ---- 3 · de la rueda al cigüeñal: la decisión que más número mueve
  let potPub=potLeida, devuelto=0;
  if(b.rueda){
    if(P.perdidas==='coastdown'){
      // La desaceleración libre mide el ARRASTRE de la transmisión, y sólo eso.
      // Ni el deslizamiento ni lo que el barrido se queda para acelerar el
      // motor aparecen en una deceleración con el gas cortado, así que ni el
      // método honrado los recupera. Es honrado, no exacto.
      devuelto=parArrastre(e,wRueda,F)*wRueda;
      potPub=potLeida+devuelto;
    }else if(P.perdidas==='regla15'){
      potPub=potLeida/0.85;
      devuelto=potPub-potLeida;
    }
  }

  // ---- 4 · la norma
  const pdEst=presionSeca(E.p,E.TC,E.hr), TEstK=E.TC+273.15;
  const cf=N.cf(pdEst,TEstK);
  const D=(99000/pdEst)*Math.sqrt(TEstK/298.15);   // el cociente de la J1349
  const fuera=N.acota&&(cf<LIM_NORMA[0]||cf>LIM_NORMA[1]);
  const potCorr=potPub*cf*(N.bruta?(1+BRUTA_EXTRA):1);

  // ---- 5 · la verdad, que en un taller no existe
  const pdRefN=(N.pRef===null)?C.pd:N.pRef;
  const TRefN=(N.TRef===null)?C.TAdmK:N.TRef;
  const potRef=parNeto(e,P.rpm,pdRefN,TRefN)*w;
  const cfVerd=cfVerdadero(e,P.rpm,C.pd,C.TAdmK,pdRefN,TRefN);
  const error=(potRef>1)?potCorr/potRef-1:null;

  // ---- 5b · Y AHORA, DE QUIÉN ES LA CULPA
  // Un solo porcentaje mezcla TRES cosas que no tienen nada que ver:
  //
  //   · el SUELO DE LA MÁQUINA —lo que este tipo de banco se deja pase lo que
  //     pase, porque el rendimiento de los engranes no se mide con el gas
  //     cortado y el patinaje tampoco—;
  //   · lo que el MONTAJE estropea por encima de ese suelo;
  //   · y lo que la CUENTA de después estropea al multiplicar.
  //
  // Mezclados, las 45 casillas del censo salían todas del mismo color y la
  // vista no decía nada. Separados, la respuesta cambia de columna a columna.
  // Todo se juzga contra el MISMO ensayo bien montado. Y el factor con el que se
  // juzga la cuenta es el que merece el motor BIEN MONTADO, no el que merece el
  // motor ya estropeado por la avería: lo que una avería le haga a la respuesta
  // del motor —el ventilador parado le hace respirar aire caliente— es culpa del
  // montaje, no de la fórmula. Con esa definición la identidad se cierra exacta:
  //
  //     (1 + suelo) · (1 + montaje) · (1 + cuenta) = 1 + total
  //
  // y la Capa 1 la comprueba en las noventa combinaciones.
  const bruto=N.bruta?(1+BRUTA_EXTRA):1;
  const sano=(F.key==='sano')?null:evalua(e,Object.assign({},P,{falla:'sano'}));
  const potPubSano=sano?sano.potPub:potPub;
  const cfVerdSano=sano?sano.cfVerd:cfVerd;
  const errMedida=(potPubSano>1)?potPub/potPubSano-1:null;
  const pisoBanco=(potRef>1&&cfVerdSano!==null)
    ?(potPubSano*cfVerdSano*bruto)/potRef-1:null;
  const errCuenta=(cfVerdSano!==null&&cfVerdSano>1e-6)?cf/cfVerdSano-1:null;
  // Dos por ciento: la repetibilidad de un banco de rodillos bien llevado anda
  // por ahí, así que por debajo de eso no se le puede reprochar nada a nadie.
  const UMBRAL_CULPA=0.02;
  const mm=(errMedida===null)?0:Math.abs(errMedida);
  const nn=(errCuenta===null)?0:Math.abs(errCuenta);
  // «medida» es lo que el banco vio mal; «cuenta» es lo que la aritmética de
  // después hizo mal, y ahí caben por igual una fórmula que no vale para este
  // motor y una estación meteorológica averiada: en los dos casos el coche se
  // midió bien y el número se estropeó al multiplicarlo.
  const culpa=(mm<UMBRAL_CULPA&&nn<UMBRAL_CULPA)?'ninguna'
    :((mm>=UMBRAL_CULPA&&nn>=UMBRAL_CULPA)?'ambas'
    :(mm>=UMBRAL_CULPA?'medida':'cuenta'));

  // ---- 6 · la hoja que sale de la impresora
  const rpmHoja=F.captadorDoble?P.rpm*2:P.rpm;
  const parHoja=potCorr/Math.max(1e-6,rpmHoja*Math.PI/30);
  const rpmImposible=rpmHoja>e.rpmMax*1.08;
  // El diésel tiene además su propio factor en la ISO 1585, y su factor de motor
  // se queda pegado al tope de 1,2 en cuanto el motor va cargado.
  const cfDie=e.diesel?cfDieselISO(pdEst,TEstK,e.qc):null;

  const avisos=[];
  if(fuera) avisos.push('El factor de la '+N.corto+' vale '+cf.toFixed(3)+
    ': fuera del intervalo 0,93–1,07 en el que la propia norma se declara válida.');
  if(!E.veraz) avisos.push('La estación no responde: la corrección va con los últimos valores guardados.');
  if(rpmImposible) avisos.push('El eje de vueltas de la hoja se pasa del corte de este motor.');
  if(slip>0.05) avisos.push('El neumático patina el '+(slip*100).toFixed(1)+' % sobre el rodillo.');
  if(C.dTsoak>8) avisos.push('La admisión va '+C.dTsoak.toFixed(1)+' K por encima del cuarto.');
  if(robada>0.05) avisos.push('El barrido se queda el '+(robada*100).toFixed(1)+
    ' % de la potencia acelerando el propio motor.');
  // Esto no es un error de medida: es la forma en que un coche se sale de un
  // banco de rodillos. Va aparte y va el primero.
  const peligro=F.amarreFlojo;
  if(peligro) avisos.unshift('PELIGRO: el coche se est\u00e1 moviendo sobre los rodillos.');
  if(errMedida!==null&&Math.abs(errMedida)>0.02) avisos.push('El montaje cuesta un '+
    (errMedida*100).toFixed(1)+' % por encima de lo que este banco se deja de todas formas.');
  if(error!==null&&Math.abs(error)>0.05) avisos.push('El número publicado se aleja el '+
    (error*100).toFixed(1)+' % de lo que este motor da de verdad en las condiciones de la norma.');

  return {pAmb:C.pAmb, pv:C.pv, pd:C.pd, rho:C.rho, TAdmC:C.TAdmC, TAdmK:C.TAdmK,
    dTsoak:C.dTsoak, est:E, pdEst:pdEst, TEstK:TEstK,
    parCig:parCig, potCig:potCig, r:r, wRueda:wRueda, parRueda:parRueda,
    parPerd:parPerd, slip:slip, robada:robada, parLeido:parLeido, potLeida:potLeida,
    devuelto:devuelto, potPub:potPub, cf:cf, D:D, cf85:cfModelo85(D), cfDie:cfDie,
    fuera:fuera, potCorr:potCorr, potRef:potRef, cfVerd:cfVerd, error:error,
    errMedida:errMedida, errCuenta:errCuenta, pisoBanco:pisoBanco, culpa:culpa,
    rpmHoja:rpmHoja, parHoja:parHoja, rpmImposible:rpmImposible, peligro:peligro,
    avisos:avisos, hay:avisos.length>0};
}

// ============================================================================
//  §13 · EL BARRIDO Y LA DESACELERACIÓN LIBRE
// ============================================================================
/** La curva entera, del régimen bajo al corte. */
function curva(e, P){
  const pts=[];
  const n=28, a=Math.round(e.rpmPar*0.42), z=e.rpmMax;
  for(let i=0;i<n;i++){
    const rpm=Math.round(a+(z-a)*i/(n-1));
    const V=evalua(e,Object.assign({},P,{rpm:rpm}));
    pts.push({rpm:rpm, rpmHoja:V.rpmHoja, parCig:V.parCig, potCig:V.potCig,
      potLeida:V.potLeida, potPub:V.potPub, potCorr:V.potCorr, potRef:V.potRef,
      parHoja:V.parHoja, cf:V.cf, error:V.error, slip:V.slip, robada:V.robada});
  }
  let parMax=pts[0], potMax=pts[0], corrMax=pts[0], refMax=pts[0];
  for(const p of pts){
    if(p.parCig>parMax.parCig) parMax=p;
    if(p.potCig>potMax.potCig) potMax=p;
    if(p.potCorr>corrMax.potCorr) corrMax=p;
    if(p.potRef>refMax.potRef) refMax=p;
  }
  return {pts:pts, parMax:parMax, potMax:potMax, corrMax:corrMax, refMax:refMax};
}

/** El censo: nueve montajes por cinco sitios. Cada casilla guarda el error y,
 *  sobre todo, DE QUIÉN ES: si del montaje o de la fórmula con la que se
 *  corrigió. Es la vista que ordena el laboratorio entero, porque la respuesta
 *  cambia de columna a columna y no de fila a fila. */
function censo(e, P){
  const filas=[];
  let total=0, mudo=0, conAviso=0, porCuenta=0, porMedida=0, peligro=0, fuera=0;
  for(const f of FALLA_KEYS){
    const celdas=[];
    for(const E of ESCENARIOS){
      const p=Object.assign({},P,{falla:f, alt:E.alt, TC:E.TC, hr:E.hr});
      const C=curva(e,p);
      const V=evalua(e,Object.assign({},p,{rpm:C.corrMax.rpm}));
      total++;
      if(!V.hay) mudo++; else conAviso++;
      if(V.culpa==='cuenta'||V.culpa==='ambas') porCuenta++;
      if(V.culpa==='medida'||V.culpa==='ambas') porMedida++;
      if(V.peligro) peligro++;
      if(V.fuera) fuera++;
      celdas.push({sitio:E.k, rpm:C.corrMax.rpm, pot:V.potCorr, ref:V.potRef,
        error:V.error, errMedida:V.errMedida, errCuenta:V.errCuenta,
        piso:V.pisoBanco, culpa:V.culpa, fuera:V.fuera, peligro:V.peligro,
        avisos:V.avisos.length, nota:V.avisos.length?V.avisos[0]:null});
    }
    filas.push({falla:f, celdas:celdas, mudo:celdas.every(function(c){ return c.avisos===0; })});
  }
  const piso=filas[0].celdas.map(function(c){ return c.piso; });
  return {filas:filas, total:total, mudo:mudo, conAviso:conAviso,
    porCuenta:porCuenta, porMedida:porMedida, peligro:peligro, fuera:fuera,
    piso:piso};
}

/** La desaceleración libre: lo único que de las pérdidas se puede MEDIR.
 *  Devuelve, para cada régimen, el par de arrastre y qué fracción de la potencia
 *  en rueda representa. Esa fracción NO es constante, y ver que no lo es tumba
 *  la regla del 15 % sin necesidad de ningún otro argumento. */
function desaceleracion(e, P){
  const F=(P.falla&&P.falla.key!==undefined)?P.falla:averia(P.falla);
  if(!BANCOS[P.banco].rueda) return null;
  const r=e.relaciones[P.marcha]*e.grupo;
  // La inercia del rodillo referida a la RUEDA: es contra lo que el coche
  // desacelera cuando se corta el gas.
  const jEnRueda=inerciaConocida(e)*Math.pow(R_RODILLO/e.rRueda,2)+e.jRuedas;
  const pts=[];
  const a=Math.round(e.rpmPar*0.42), z=e.rpmMax;
  for(let i=0;i<24;i++){
    const rpm=Math.round(a+(z-a)*i/23);
    const wR=(rpm*Math.PI/30)/r;
    const V=evalua(e,Object.assign({},P,{rpm:rpm}));
    const arr=parArrastre(e,wR,F);
    const tot=parPerdidas(e,wR,V.parCig*r,F);
    const potPerd=tot*wR, potArr=arr*wR;
    pts.push({rpm:rpm, vRueda:wR*e.rRueda, par:tot, arrastre:arr,
      potPerd:potPerd, potArr:potArr, potRueda:V.potLeida,
      frac:(V.potLeida>1)?potPerd/(V.potLeida+potPerd):null,
      fracArr:(V.potLeida>1)?potArr/(V.potLeida+potPerd):null,
      decel:arr/Math.max(1e-6,jEnRueda)});
  }
  let fmin=1, fmax=0, amin=1, amax=0;
  for(const p of pts){ if(p.frac===null) continue;
    if(p.frac<fmin) fmin=p.frac; if(p.frac>fmax) fmax=p.frac;
    if(p.fracArr<amin) amin=p.fracArr; if(p.fracArr>amax) amax=p.fracArr; }
  return {pts:pts, fracMin:fmin, fracMax:fmax, arrMin:amin, arrMax:amax,
    jEnRueda:jEnRueda};
}

// ============================================================ T1 · FORMATOS, ESTADO Y MATERIALES

// El separador de millares es U+202F, un espacio fino que no rompe línea. NO se
// usa en años: «2 019» no es un año.
const NBSP=' ';
function num(x,d=1){
  if(x===null||x===undefined||!isFinite(x)) return '—';
  const s=Math.abs(x).toFixed(d), p=s.split('.');
  let ent=p[0], out='';
  while(ent.length>3){ out=NBSP+ent.slice(-3)+out; ent=ent.slice(0,-3); }
  out=ent+out;
  return (x<0?'−':'')+out+(p[1]?','+p[1]:'');
}
const kw=(x,d=1)=>num(x/1000,d)+NBSP+'kW';
// El caballo de vapor métrico son 735,49875 W exactos. El caballo imperial no
// es el mismo —745,7 W— y esa diferencia del 1,4 % se cuela en cualquier cifra
// traducida sin cuidado.
const W_POR_CV=735.49875;
const cvF=(x,d=0)=>num(x/W_POR_CV,d)+NBSP+'CV';
const nm=(x,d=1)=>num(x,d)+NBSP+'N·m';
const hpa=(p,d=1)=>num(p/100,d)+NBSP+'hPa';
const kpa=(p,d=1)=>num(p/1000,d)+NBSP+'kPa';
const celC=(t,d=1)=>num(t,d)+NBSP+'°C';
const kel=(T,d=1)=>num(T,d)+NBSP+'K';
const rpmT=x=>num(x,0)+NBSP+'rpm';
const pcc=(x,d=1)=>num(x,d)+NBSP+'%';
const pccS=(x,d=1)=>(x>0?'+':'')+num(x,d)+NBSP+'%';
const met=(x,d=0)=>num(x,d)+NBSP+'m';
const rhoF=(x,d=3)=>num(x,d)+NBSP+'kg/m³';
const kgm2=(x,d=1)=>num(x,d)+NBSP+'kg·m²';
const fac=(x,d=3)=>num(x,d);
const seg=(x,d=2)=>num(x,d)+NBSP+'s';
const kmh=(x,d=0)=>num(x,d)+NBSP+'km/h';
const corta=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;

// ------------------------------------------------------------------- estado
const G={
  modo:'ensamble', maq:'na16', falla:'sano',
  banco:'inercia', norma:'j1349', perdidas:'coastdown',
  marcha:null, pasada:1, sitio:'mar25', rpm:null,
  simUnlocked:false, resuelto:false, k:1,
};
const MQ=()=>ARQ[G.maq];
const FL=()=>FALLAS[G.falla];
const SITIO=()=>ESCENARIOS.find(E=>E.k===G.sitio)||ESCENARIOS[0];
const MARCHA=()=>G.marcha===null?MQ().marchaTipica:Math.min(G.marcha,MQ().relaciones.length-1);
const PAR=()=>{ const s=SITIO(); return {banco:G.banco, norma:G.norma, perdidas:G.perdidas,
  marcha:MARCHA(), pasada:G.pasada, alt:s.alt, TC:s.TC, hr:s.hr}; };

// --------------------------------------------------------------------- memo
// El censo son 45 casillas y cada casilla es una curva de 28 puntos: 1 260
// evaluaciones. Repintar el pizarrón a cada fotograma sin memorizar tira la
// página al suelo.
const MEMO=new Map();
function memo(k,fn){ if(!MEMO.has(k)) MEMO.set(k,fn()); return MEMO.get(k); }
function invalida(){ MEMO.clear(); }
const CFGK=()=>[G.maq,G.banco,G.norma,G.perdidas,MARCHA(),G.pasada,G.sitio].join('|');
function CURVA(f){ return memo('k|'+CFGK()+'|'+(f||G.falla),
  ()=>curva(MQ(),Object.assign({falla:f||G.falla},PAR()))); }
/** El régimen de trabajo: el del pico de la potencia PUBLICADA, que es el punto
 *  del que sale la cifra que se anuncia. Se puede fijar a mano. */
const RPM=()=>G.rpm===null?CURVA().corrMax.rpm:G.rpm;
// `null` quiere decir «dónde lo decida la curva» en TODO el laboratorio —es lo que
// significa `G.rpm===null`—, así que aquí tiene que querer decir lo mismo. Con
// sólo mirar `undefined`, un `null` se colaba como régimen literal y el ensayo
// salía con potencia de referencia cero y error nulo, SIN dar ningún error.
function EV_DE(f,rpm){ const r=(rpm===undefined||rpm===null)?RPM():rpm;
  return memo('v|'+CFGK()+'|'+(f||G.falla)+'|'+r,
    ()=>evalua(MQ(),Object.assign({falla:f||G.falla,rpm:r},PAR()))); }
function EV(){ return EV_DE(G.falla); }
function CENSO(){ return memo('c|'+CFGK(),()=>censo(MQ(),PAR())); }
function DECEL(f){ return memo('d|'+CFGK()+'|'+(f||G.falla),
  ()=>desaceleracion(MQ(),Object.assign({falla:f||G.falla},PAR()))); }

// ---------------------------------------------------------------- veredictos
function veredicto(){
  const V=EV();
  if(V.peligro) return {nivel:'bad',rot:'EL COCHE SE MUEVE SOBRE LOS RODILLOS'};
  if(V.fuera) return {nivel:'bad',rot:'EL FACTOR SE SALE DE LA NORMA'};
  if(V.error!==null&&Math.abs(V.error)>0.15) return {nivel:'bad',rot:'EL NÚMERO NO VALE'};
  if(V.error!==null&&Math.abs(V.error)>0.05) return {nivel:'warn',rot:'EL NÚMERO SE ALEJA'};
  if(V.hay) return {nivel:'warn',rot:'CON REPAROS'};
  return {nivel:'ok',rot:'ENSAYO LIMPIO'};
}
const COL_CULPA={ninguna:OK_HEX, medida:NARANJA, cuenta:VIO, ambas:BAD_HEX};
const ROT_CULPA={ninguna:'nada que reprochar', medida:'el montaje',
  cuenta:'la cuenta de después', ambas:'las dos cosas'};

// ---------------------------------------------------------------- materiales
const rub={roughness:0.86,metalness:0.04};
const plas={roughness:0.42,metalness:0.16};
const std=o=>new THREE.MeshStandardMaterial(o);
const emis=(hex,i)=>std({color:hex,emissive:hex,emissiveIntensity:i,roughness:0.42,metalness:0.10});
// OJO con `brushedMetal()`: NO devuelve un material, devuelve el juego de
// texturas. Pasárselo tal cual a un Mesh no da ningún error —three comprueba
// `material.visible===true` y, al ser undefined, SE SALTA la pieza en silencio—
// y la malla existe pero no se ve. Se envuelve en un material de verdad.
const MAT={
  acero:std(Object.assign({},brushedMetal(),
    {color:0xb9c4cf,roughness:0.42,metalness:0.78})),
  crom:std({color:0xd8e2ec,roughness:0.18,metalness:0.92}),
  rodillo:std({color:0x8f9aa6,roughness:0.34,metalness:0.82}),
  carroceria:std({color:0x2f6f8f,roughness:0.28,metalness:0.42}),
  cristal:std({color:0x9fc4d8,roughness:0.10,metalness:0.02,
    transparent:true,opacity:0.30}),
  neumatico:std({color:0x14181e,...rub}),
  llanta:std({color:0xc2ccd6,roughness:0.30,metalness:0.80}),
  foso:std({color:0x1b222c,roughness:0.72,metalness:0.10}),
  caja:std({color:0x1c2531,...plas}),
  banco:std({color:0x232c38,...plas}),
  correa:std({color:0xd8a038,roughness:0.68,metalness:0.10}),
  aspa:std({color:0x33404f,roughness:0.52,metalness:0.30}),
  tubo:std({color:0x8d99a6,roughness:0.40,metalness:0.74}),
  manguera:std({color:0x1d2530,...rub}),
  ok:emis(0x2fbf62,1.5),
  bad:emis(0xff4d5e,1.5),
  avi:emis(0xe9c46a,1.4),
  apag:std({color:0x232a33,roughness:0.6,metalness:0.1}),
};
const nuevaFantasma=()=>std({color:0x5AD1E6,transparent:true,opacity:0.26,
  depthWrite:false,side:THREE.DoubleSide});

function cil(r0,r1,h,mat,seg){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,seg||22),mat);
  m.castShadow=true; return m;
}
function tuboDe(pts,r,mat){
  const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),
    Math.max(12,pts.length*8),r,12,false),mat);
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
// parece razonable en metros: la textura tiene 1 024 px de ancho, y si sale a
// 420 px de ventana el texto de 13 px llega al ojo a 5 y no se lee. El estándar
// de la casa es ≥ 480 px en 1600×900, y se COMPRUEBA con
// `window.__labDebug.anchoTableroPx`.
const BW3=8.40, BH3=6.06, BY3=3.26;
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
function nivel(P,M,v,c,rot,dash,izq){
  const yy=M.Y(v);
  if(yy<P.y-1||yy>P.y+P.h+1) return;
  linea([[P.x,yy],[P.x+P.w,yy]],c,1.6,dash||[7,5]);
  // Dos niveles cercanos con el rótulo en el mismo lado se pisan y las dos
  // cifras se vuelven ilegibles. Por eso hay un lado a elegir.
  if(rot){ if(izq) etiqueta(rot,P.x+8,yy-6,c);
    else etiqueta(rot,P.x+P.w-8,yy-6,c,'right'); }
}
function nivelV(P,M,v,c,rot,dash,abajo){
  const xx=M.X(v);
  if(xx<P.x-1||xx>P.x+P.w+1) return;
  linea([[xx,P.y],[xx,P.y+P.h]],c,1.6,dash||[7,5]);
  // Arriba se monta debajo de la caja de la leyenda y el rótulo se pierde. El
  // lado se elige, no se supone.
  if(rot) etiqueta(rot,xx+6,abajo?(P.y+P.h-10):(P.y+16),c);
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



// ------------------------------------------------- medidas de la célula 3D
// La escala es DIDÁCTICA y se declara. Lo que se respeta es el ORDEN de los
// tamaños y la disposición de la célula de ensayo —coche sobre los rodillos,
// ventilador delante, estación a un lado, extracción detrás—, no los
// milímetros. El factor K se midió en el d6-12: con el pizarrón a 8,40 m, a
// K = 1,45 el lienzo cae en 520-530 px de ventana, que es donde su texto de
// 13 px llega al ojo a 7 y se lee. Se comprueba con `anchoTableroPx`.
const K_CELDA=1.30;
function dims(e){
  const K=K_CELDA;
  // Un coche más pesado es más largo. No es una ley, es una correlación, y aquí
  // sólo sirve para que el V8 no parezca un utilitario.
  const L=(2.06+e.masa/1250*0.30)*K, W=(1.14+e.masa/1250*0.10)*K;
  const rRueda=0.30*K, rRod=0.30*K;
  const yEje=rRueda;                       // el rodillo va enrasado con el suelo
  const yPiso=yEje+0.16*K;                 // los bajos del coche
  const hCarro=0.60*K, hTecho=0.46*K;
  const xEjeD=L*0.34, xEjeT=-L*0.34;       // delantero hacia +x
  // La tracción decide qué eje va sobre los rodillos, y eso NO es decorativo:
  // el eje que no gira no transmite y sus pérdidas no se miden.
  const xRod=e.masa>1600?xEjeT:xEjeD;
  const foso={x:xRod, w:1.30*K, z:0, d:1.90*K, h:0.72*K};
  return {
    K, L, W, rRueda, rRod, yEje, yPiso, hCarro, hTecho, xEjeD, xEjeT, xRod, foso,
    xVent:L*0.5+1.02*K, yVent:0.86*K, rVent:0.50*K,
    xEst:-L*0.16, zEst:1.54*K, hEst:1.66*K,
    xCap:L*0.30, zCap:-1.18*K, yCap:0.52*K,
    xExt:-L*0.5-0.30*K, zExt:-0.42*K, yExt:2.24*K,
    xBanco:0, zBanco:2.32*K,
    xIzq:-L*0.5-0.86*K,
    xDer:L*0.5+1.02*K+0.54*K,
  };
}

function colocaTablero(d){
  board.rotation.y=0.70;
  // El hueco no es decorativo: los rótulos de la célula son sprites que
  // sobresalen de la pieza que nombran, y con menos de un metro se pintan sobre
  // el marco del pizarrón.
  const medio=(BW3/2+0.13)*Math.cos(board.rotation.y);
  board.position.set(d.xIzq-1.05*d.K-medio,0,0.95*d.K);
}
function puntosClave(){
  const d=dims(MQ());
  const a=BW3/2, mx=a*Math.cos(board.rotation.y), mz=a*Math.sin(board.rotation.y);
  const y0=BY3-BH3/2, y1=BY3+BH3/2, bp=board.position;
  const pts=[
    [bp.x-mx,y0,bp.z+mz],[bp.x+mx,y0,bp.z-mz],
    [bp.x-mx,y1,bp.z+mz],[bp.x+mx,y1,bp.z-mz],
    [-d.L/2,0.02,-d.W/2-0.30*d.K],[d.L/2,d.yPiso+d.hCarro+d.hTecho,d.W/2+0.30*d.K],
    [d.xVent+d.rVent*0.2,d.yVent+d.rVent,0],
    [d.xEst,d.hEst,d.zEst],
    [d.xCap,d.yCap,d.zCap],
    [d.xExt,d.yExt,d.zExt],
    [d.xBanco,1.30,d.zBanco],
  ];
  return pts.map(p=>new THREE.Vector3(...p));
}
// La franja de pantalla que de verdad se ve: el HUD tapa la izquierda y el panel
// de mandos tapa la derecha. Encuadrar contra el ancho completo del lienzo mete
// casi cuatro décimas de la célula DEBAJO de los paneles.
function zonaUtil(){
  const rM=mount.getBoundingClientRect();
  const W=rM.width||1600, H=rM.height||900;
  let x0=0, x1=W;
  const h=el('hud'), p=el('panel');
  if(h){ const r=h.getBoundingClientRect();
    if(r.width>0&&r.right-rM.left<W*0.60) x0=Math.max(x0,r.right-rM.left+18); }
  if(p){ const r=p.getBoundingClientRect();
    if(r.width>0&&r.left-rM.left>W*0.40) x1=Math.min(x1,r.left-rM.left-18); }
  if(x1-x0<W*0.34){ x0=0; x1=W; }
  return { W, H, x0, x1 };
}
function camTablero(d,off){
  const c=board.position.clone(); c.y=BY3;
  const n=new THREE.Vector3(Math.sin(board.rotation.y),0,Math.cos(board.rotation.y));
  const dd=d||5.85;
  const p=c.clone().addScaledVector(n,dd); p.y=BY3+0.13*dd;
  const tg=new THREE.Vector3(Math.cos(board.rotation.y),0,-Math.sin(board.rotation.y));
  const dx=(off===undefined)?-0.42:off;
  p.addScaledVector(tg,dx); c.addScaledVector(tg,dx);
  return [[p.x,p.y,p.z],[c.x,c.y,c.z]];
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
    if(cabe(26,off)){
      let lo=3, hi=26;
      for(let k=0;k<26;k++){ const mid=(lo+hi)/2; if(cabe(mid,off)) hi=mid; else lo=mid; }
      dist=hi;
    }else dist=26;
    const e=proy(dist,off);
    const dn=(nx0+nx1)/2-(e.a+e.b)/2;
    if(Math.abs(dn)<0.012) break;
    off-=dn*TH*e.z;
  }
  return camTablero(dist,off);
}
{
  const marco=roundedBox(BW3+0.26,BH3+0.24,0.10,std({...plas,metalness:0.30,roughness:0.58}),0.05);
  marco.position.y=BY3; board.add(marco);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(BW3,BH3),
    new THREE.MeshBasicMaterial({map:btex,toneMapped:false}));
  pl.position.set(0,BY3,0.056); board.add(pl);
  const pie=Math.max(0.10,BY3-BH3/2-0.12);
  for(const sx of [-1,1]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,pie,16),MAT.acero);
    p.position.set(sx*BW3*0.42,pie/2,0); p.castShadow=true; board.add(p);
  }
}

// ------------------------------------------------------------- cabecera común
// Toda vista dice, con las mismas palabras y en el mismo sitio, qué vehículo, en
// qué banco, con qué norma y en qué sitio. Sin eso, una captura del pizarrón no
// significa nada: la misma gráfica al nivel del mar y en Toluca son dos gráficas
// distintas y no hay forma de saber cuál se está mirando.
function cabecera(titulo,sub,ciego){
  const e=MQ(), F=FL(), S=SITIO();
  bg();
  textoFit(titulo,42,44,620,{s:23,b:true});
  if(sub) wrapText(sub,42,68,620,17,{s:13.5,c:'#8f9bad'});
  const dcho=[
    [e.corto+' · '+num(e.cilindrada,1)+' L · '+BANCOS[G.banco].corto, CIAN],
    [ciego?'montaje desconocido':(G.falla==='sano'?'bien montado':F.corto),
      ciego?GRIS:(G.falla==='sano'?GRIS:WARN_HEX)],
    [(ciego?RETO.sitioRot:S.rot)+' · '+NORMAS[ciego?RETO.norma:G.norma].corto, NARANJA],
  ];
  let yy=32;
  for(const d of dcho){ texto(d[0],BW-42,yy,{s:13.5,c:d[1],al:'right',b:true}); yy+=20; }
  linea([[42,86],[BW-42,86]],'#1b2432',1.2);
  return 86;
}

// ============================================================ T3 · LAS PIEZAS
// Seis piezas, y ninguna de las seis mide el motor: las seis sirven para que lo
// que se mida signifique algo. Cada una dice para qué está y qué pasa sin ella,
// y ese «qué pasa sin ella» no es una frase: es lo que el modelo hace cuando se
// le quita.
const PART={
  rodillos:{ rot:'Juego de rodillos', fn:'La inercia conocida contra la que el coche acelera.',
    sin:'Sin ellos no hay banco.',
    para:'Un rodillo de inercia no mide par: mide cuánto acelera y multiplica por su inercia. Todo lo que se quede entre el pistón y el rodillo —la inercia del propio motor, el patinaje del neumático, el arrastre de la transmisión— no aparece en la hoja.' },
  amarres:{ rot:'Amarres', fn:'Sujetan el coche contra los rodillos.',
    sin:'Sin ellos el coche se sale del banco.',
    para:'No es una pieza de medida: es la pieza de seguridad. Y además influye, porque un coche que se camina sobre los rodillos patina más, y patina más cuanto más tiempo se sostenga la carga.' },
  ventilador:{ rot:'Ventilador de refrigeración', fn:'Empuja aire de verdad contra el radiador.',
    sin:'Sin él, cada pasada empieza más caliente que la anterior.',
    para:'Un coche parado en un cuarto cerrado a plena carga se calienta a sí mismo y calienta el cuarto. Sin ventilador la admisión sube pasada a pasada, y el número baja sin que nada del motor haya cambiado.' },
  estacion:{ rot:'Estación meteorológica', fn:'Presión, temperatura y humedad del aire de admisión.',
    sin:'Sin ella no se puede corregir a ninguna norma.',
    para:'Las tres cifras que toda norma necesita. Y la humedad importa: el vapor de agua se RESTA, porque ocupa sitio y no quema. En un día caluroso y húmedo se lleva casi sesenta hectopascales.' },
  captador:{ rot:'Captador de vueltas', fn:'El eje de las abscisas de la hoja.',
    sin:'Sin él sólo hay potencia contra velocidad, no par contra vueltas.',
    para:'La potencia no lo necesita: sale de la inercia y de la aceleración del rodillo. El PAR sí, porque el par es la potencia dividida por las vueltas. Un captador que cuente el doble deja la potencia intacta y parte el par por la mitad.' },
  extraccion:{ rot:'Extracción de gases', fn:'Se lleva el escape fuera del cuarto.',
    sin:'Sin ella el cuarto se llena y el motor respira lo que acaba de quemar.',
    para:'Es seguridad, y también medida: un cuarto lleno de gases de escape es un cuarto con menos oxígeno y más caliente, y las dos cosas bajan el número.' },
};
const ORDEN=['rodillos','amarres','captador','ventilador','estacion','extraccion'];
const PARTS=ORDEN.map(k=>Object.assign({k:k},PART[k]));

// ------------------------------------------------------------- constructores
// Cada pieza se construye centrada en su propio grupo y `centra()` la deja con
// el origen en su centro geométrico, que es lo que el ensamble necesita para
// moverla del banco a su sitio sin saltos.
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={aluminio:MAT.llanta, acero:MAT.acero, cobre:MAT.crom, cromo:MAT.llanta,
  chapa:MAT.acero, hierro:MAT.acero, negro:MAT.neumatico, goma:MAT.neumatico,
  blanco:MAT.crom, ceramica:MAT.crom};
function rotulo(g,t,y,c){
  const s=labelSprite(t,c||'#cfe0ee');
  s.position.set(0,y,0); s.scale.multiplyScalar(0.52); g.add(s);
}
function haceRodillos(){
  const d=dims(MQ()), g=new THREE.Group(), K=d.K;
  // Dos rodillos y el neumático descansando en la V que forman: es la
  // disposición de casi todos los bancos de taller, y hace ver de un vistazo
  // que lo que gira no es la rueda sino OTRA cosa acoplada por rozamiento.
  const rr=d.rRod, largo=1.58*K;
  for(const sx of [-1,1]){
    const rod=cil(rr,rr,largo,MAT.rodillo,36);
    rod.rotation.x=Math.PI/2; rod.position.set(sx*0.30*K,0,0); g.add(rod);
    // Las estrías que dan agarre. Sin ellas el rodillo parece un tubo liso, y
    // el agarre es justo lo que esta práctica mide.
    for(let i=0;i<10;i++){
      const a=i/10*Math.PI*2;
      const e=new THREE.Mesh(new THREE.BoxGeometry(0.012*K,0.012*K,largo*0.96),MAT.acero);
      e.position.set(sx*0.30*K+Math.cos(a)*rr,Math.sin(a)*rr,0); g.add(e);
    }
  }
  // El eje y la brida de inercia: la masa que hace de banco.
  const eje=cil(0.05*K,0.05*K,largo*1.18,MAT.crom,18);
  eje.rotation.x=Math.PI/2; eje.position.set(-0.30*K,0,0); g.add(eje);
  const volante=cil(0.34*K,0.34*K,0.09*K,MAT.acero,32);
  volante.rotation.x=Math.PI/2; volante.position.set(-0.30*K,0,-largo*0.62); g.add(volante);
  const marco=roundedBox(1.10*K,0.10*K,largo+0.24*K,MAT.banco,0.03);
  marco.position.set(0,-rr-0.06*K,0); g.add(marco);
  rotulo(g,'rodillos',rr+0.30*K);
  g.userData.rodillos=g.children.filter(o=>o.geometry&&o.geometry.type==='CylinderGeometry');
  return g;
}
function haceAmarres(){
  const d=dims(MQ()), g=new THREE.Group(), K=d.K;
  // Cuatro cintas de las torretas al suelo. Van en X, no en paralelo: una cinta
  // vertical sujeta contra el rebote pero no contra el empuje.
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const a=new THREE.Vector3(sx*d.L*0.30, d.yEje+0.12*K, sz*(d.W*0.5+0.02*K));
    const b=new THREE.Vector3(sx*d.L*0.46, 0.02*K, sz*(d.W*0.5+0.52*K));
    const cinta=tuboDe([a,a.clone().lerp(b,0.5).add(new THREE.Vector3(0,0.02*K,0)),b],0.020*K,MAT.correa);
    g.add(cinta);
    const tensor=roundedBox(0.10*K,0.07*K,0.06*K,MAT.acero,0.02);
    tensor.position.copy(a.clone().lerp(b,0.62)); g.add(tensor);
    const anilla=new THREE.Mesh(new THREE.TorusGeometry(0.055*K,0.014*K,8,20),MAT.acero);
    anilla.rotation.x=Math.PI/2; anilla.position.copy(b); g.add(anilla);
  }
  rotulo(g,'amarres',d.yEje+0.36*K,'#e0c07a');
  return g;
}
function haceCaptador(){
  const d=dims(MQ()), g=new THREE.Group(), K=d.K;
  const caja=roundedBox(0.30*K,0.20*K,0.16*K,MAT.caja,0.03);
  g.add(caja);
  const pant=new THREE.Mesh(new THREE.PlaneGeometry(0.20*K,0.10*K),
    emis(0x1e6f7a,0.9));
  pant.position.set(0,0.01*K,0.081*K); g.add(pant);
  // La pinza inductiva. Es la que cuenta el doble cuando se pone sobre una
  // bobina de chispa perdida, que es lo que hace la avería del captador.
  const pinza=new THREE.Mesh(new THREE.TorusGeometry(0.06*K,0.016*K,8,22,Math.PI*1.6),MAT.acero);
  pinza.position.set(0.30*K,0.06*K,0.10*K); pinza.rotation.y=0.6; g.add(pinza);
  const cable=tuboDe([new THREE.Vector3(0.14*K,0,0.06*K),
    new THREE.Vector3(0.24*K,0.10*K,0.09*K),
    new THREE.Vector3(0.30*K,0.06*K,0.10*K)],0.010*K,MAT.manguera);
  g.add(cable);
  rotulo(g,'captador de vueltas',0.24*K);
  g.userData.pant=pant;
  return g;
}
function haceVentilador(){
  const d=dims(MQ()), g=new THREE.Group(), K=d.K;
  const r=d.rVent;
  const aro=new THREE.Mesh(new THREE.TorusGeometry(r,0.06*K,10,36),MAT.acero);
  aro.rotation.y=Math.PI/2; g.add(aro);
  const cubo=cil(0.11*K,0.11*K,0.16*K,MAT.acero,18);
  cubo.rotation.z=Math.PI/2; g.add(cubo);
  const aspas=new THREE.Group();
  for(let i=0;i<6;i++){
    const a=new THREE.Mesh(new THREE.BoxGeometry(0.030*K,r*0.82,0.20*K),MAT.aspa);
    a.position.set(0,r*0.44,0); a.rotation.z=0; a.rotation.y=0.42;
    const p=new THREE.Group(); p.add(a); p.rotation.x=i/6*Math.PI*2; aspas.add(p);
  }
  aspas.rotation.z=Math.PI/2; g.add(aspas);
  const pie=cil(0.07*K,0.09*K,d.yVent,MAT.acero,16);
  pie.position.y=-d.yVent/2-r*0.1; g.add(pie);
  const base=roundedBox(0.44*K,0.05*K,0.44*K,MAT.banco,0.02);
  base.position.y=-d.yVent-r*0.1; g.add(base);
  rotulo(g,'ventilador',r+0.26*K);
  g.userData.aspas=aspas;
  return g;
}
function haceEstacion(){
  const d=dims(MQ()), g=new THREE.Group(), K=d.K;
  const mastil=cil(0.035*K,0.045*K,d.hEst,MAT.acero,14); g.add(mastil);
  // La garita de rejillas: el termómetro tiene que estar a la sombra y con el
  // aire pasando, o mide el sol y no el aire.
  const garita=new THREE.Group();
  for(let i=0;i<5;i++){
    const p=cil(0.11*K-i*0.006*K,0.11*K-i*0.006*K,0.020*K,std({color:0xdfe6ee,roughness:0.7,metalness:0.05}),20);
    p.position.y=i*0.034*K; garita.add(p);
  }
  garita.position.y=d.hEst*0.42; g.add(garita);
  const barom=roundedBox(0.20*K,0.16*K,0.10*K,MAT.caja,0.02);
  barom.position.y=d.hEst*0.14; g.add(barom);
  const lec=new THREE.Mesh(new THREE.PlaneGeometry(0.14*K,0.07*K),emis(0x2AA6B8,1.0));
  lec.position.set(0,d.hEst*0.14,0.051*K); g.add(lec);
  const base=cil(0.16*K,0.20*K,0.04*K,MAT.banco,20);
  base.position.y=-d.hEst*0.5; g.add(base);
  rotulo(g,'estación',d.hEst*0.60);
  g.userData.lec=lec;
  return g;
}
function haceExtraccion(){
  const d=dims(MQ()), g=new THREE.Group(), K=d.K;
  const pts=[];
  for(let i=0;i<=10;i++){
    const t=i/10;
    pts.push(new THREE.Vector3(-t*0.30*K, t*t*d.yExt, -t*0.30*K));
  }
  const manga=tuboDe(pts,0.11*K,std({color:0x3a4450,roughness:0.82,metalness:0.10}));
  g.add(manga);
  // Los aros de la manga flexible.
  for(let i=1;i<10;i++){
    const p=pts[i];
    const a=new THREE.Mesh(new THREE.TorusGeometry(0.115*K,0.014*K,7,18),MAT.acero);
    a.position.copy(p); a.lookAt(pts[i+1]); g.add(a);
  }
  const boca=cil(0.13*K,0.15*K,0.16*K,MAT.acero,20);
  boca.rotation.z=Math.PI/2; g.add(boca);
  rotulo(g,'extracción',d.yExt*0.62);
  return g;
}
const BUILD={ rodillos:haceRodillos, amarres:haceAmarres, captador:haceCaptador,
  ventilador:haceVentilador, estacion:haceEstacion, extraccion:haceExtraccion };
PARTS.forEach(p=>{ p.build=BUILD[p.k]; });

// ============================================== T4 · LA CÉLULA Y EL COCHE
const RIG={piezas:{}, ruedas:[], rodillos:[], aspas:null, lecEst:null, pantCap:null};
const ASM={done:new Set(), sel:null};

function ancla(){
  const d=dims(MQ());
  return {
    rodillos:  new THREE.Vector3(d.xRod, d.rRod-0.02*d.K, 0),
    amarres:   new THREE.Vector3(0, 0, 0),
    captador:  new THREE.Vector3(d.xCap, d.yCap, d.zCap),
    ventilador:new THREE.Vector3(d.xVent, d.yVent, 0),
    estacion:  new THREE.Vector3(d.xEst, d.hEst*0.5, d.zEst),
    extraccion:new THREE.Vector3(d.xExt, 0, d.zExt),
  };
}
const posDe=k=>ancla()[k];

let celda=null;
function levantaCelda(){
  if(celda){ borra(celda); celda=null; }
  RIG.ruedas=[];
  const g=new THREE.Group(); celda=g;
  const d=dims(MQ()), K=d.K;
  // ---- el suelo del taller y el foso
  const losa=roundedBox(d.L+3.4*K, 0.06*K, d.W+3.0*K, std({color:0x2a323c,roughness:0.88,metalness:0.06}),0.02);
  losa.position.set(0,-0.03*K,0); losa.receiveShadow=true; g.add(losa);
  const foso=roundedBox(d.foso.w,d.foso.h,d.foso.d,MAT.foso,0.02);
  foso.position.set(d.foso.x,-d.foso.h/2-0.02*K,0); g.add(foso);
  // ---- el coche
  const car=new THREE.Group();
  /* EL COCHE, POR SU SILUETA. Dos cajas apiladas no son un coche: son un
     contenedor. Un coche se reconoce por su perfil —morro, parabrisas, techo,
     luneta— y sobre todo por los PASOS DE RUEDA, que aquí no son adorno: son lo
     que deja ver que las ruedas del eje motriz están metidas en la V de los
     rodillos y las otras no, que es de lo que va el banco. Todo sale de UN
     contorno extruido a lo ancho del coche. */
  const yS=d.yPiso, yC=d.yPiso+d.hCarro, yT=yC+d.hTecho;
  const x0=-d.L*0.5, x1=d.L*0.5, rA=d.rRueda*1.24;
  const [xa,xb]=[d.xEjeD,d.xEjeT].slice().sort((u,v)=>u-v);
  const perfil=[
    [x0,yS],[xa-rA,yS],
    ...P3.arco(xa,yS,rA,Math.PI,0,14),
    [xb-rA,yS],
    ...P3.arco(xb,yS,rA,Math.PI,0,14),
    [x1,yS],
    [x1,yS+(yC-yS)*0.62],[x1*0.94,yC],[x1*0.34,yC],
    [x1*0.06,yT],[-d.L*0.20,yT],[-d.L*0.40,yC],
    [x0,yC],
  ];
  const cuerpo=new THREE.Mesh(P3.normalizaUV(P3.extruido(
    P3.contornoRedondeado(perfil,0.05*K,3),{espesor:d.W,bisel:0.05*K}),2),MAT.carroceria);
  cuerpo.castShadow=true; car.add(cuerpo);
  // El cristal, un poco MÁS ancho que la carrocería y por dentro de la línea del
  // techo: así asoma por los costados y se lee como ventanilla. Coplanario con
  // la chapa no se veía —dos superficies en el mismo sitio no son dos piezas—.
  const yB=yC+(yT-yC)*0.20, yV=yT-(yT-yC)*0.14;
  const luna=new THREE.Mesh(P3.extruido([
    [x1*0.28,yB],[x1*0.09,yV],[-d.L*0.185,yV],[-d.L*0.355,yB]],
    {espesor:d.W*1.02,bisel:0.010*K}),MAT.cristal);
  car.add(luna);
  for(const sx of [-1,1]){
    const far=cil(0.09*K,0.09*K,0.05*K,emis(0xf3f0d8,sx>0?1.2:0.4),16);
    far.rotation.z=Math.PI/2;
    far.position.set(sx*d.L*0.5,d.yPiso+d.hCarro*0.62,0);
    car.add(far);
  }
  // Las cuatro ruedas. Las del eje motriz van sobre los rodillos y GIRAN; las
  // otras no, y eso también se ve.
  for(const xe of [d.xEjeD,d.xEjeT]) for(const sz of [-1,1]){
    /* LA RUEDA de verdad, con su flanco, su hombro y su llanta de radios. El
       diámetro no es decorativo: es el que traduce vueltas del rodillo a
       kilómetros por hora, y el que decide cuánto se hunde el neumático en la V
       —de ahí sale la pérdida por deformación que el banco tiene que descontar—. */
    const rg=new THREE.Group();
    const nm2=P3.neumatico(MATP,
      {dExt:d.rRueda*2,dLlanta:d.rRueda*1.24,ancho:0.25*K,radios:5});
    nm2.rotation.x=Math.PI/2;
    nm2.traverse(o=>{if(o.isMesh)o.castShadow=true;}); rg.add(nm2);
    rg.position.set(xe,d.yEje,sz*(d.W*0.5-0.04*K));
    car.add(rg);
    if(Math.abs(xe-d.xRod)<1e-6) RIG.ruedas.push(rg);
  }
  // El escape, que es donde se engancha la extracción.
  const tuboEsc=cil(0.055*K,0.055*K,0.36*K,MAT.tubo,14);
  tuboEsc.rotation.z=Math.PI/2;
  tuboEsc.position.set(-d.L*0.5-0.14*K,d.yPiso*0.62,-0.34*K); car.add(tuboEsc);
  g.add(car);
  // ---- la mesita de mandos del banco
  const mesa=roundedBox(1.10*K,0.06*K,0.70*K,MAT.banco,0.03);
  mesa.position.set(d.xBanco,0.92,d.zBanco); g.add(mesa);
  scene.add(g);
}

// ---------------------------------------------------------------- el banco
const STAGE_S=0.66;
const BENCH={cols:3,dx:1.12,dz:1.10,top:0.90,pedH:0.24};
const NFIL=Math.ceil(PARTS.length/BENCH.cols), PED_Y=BENCH.top+BENCH.pedH;
function pedXZ(i){
  const d=dims(MQ());
  const c=i%BENCH.cols, f=Math.floor(i/BENCH.cols);
  return [d.xBanco+(c-(BENCH.cols-1)/2)*BENCH.dx, d.zBanco+(f-(NFIL-1)/2)*BENCH.dz];
}
const peds=[];
let banco=null;
function levantaBanco(){
  if(banco){ borra(banco); banco=null; }
  peds.length=0;
  const g=new THREE.Group(); banco=g;
  const d=dims(MQ());
  const w=BENCH.cols*BENCH.dx+0.42, dd=NFIL*BENCH.dz+0.42;
  const losa=roundedBox(w,0.10,dd,MAT.banco,0.04);
  losa.position.set(d.xBanco,BENCH.top,d.zBanco); g.add(losa);
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const pa=roundedBox(0.10,BENCH.top,0.10,MAT.acero,0.20);
    pa.position.set(d.xBanco+sx*(w/2-0.15),BENCH.top/2,d.zBanco+sz*(dd/2-0.15)); g.add(pa);
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
}
function muestraBanco(v){ if(banco) banco.visible=v; }
function pedLibre(i){ const p=peds[i]; if(!p) return;
  p.mat.color.setHex(0x2AA6B8); p.mat.emissive.setHex(0x2AA6B8); p.mat.emissiveIntensity=0.85; }
function pedHecho(i){ const p=peds[i]; if(!p) return;
  p.mat.color.setHex(0x7CD992); p.mat.emissive.setHex(0x7CD992); p.mat.emissiveIntensity=0.30; }

// ---------------------------------------------------------------- ensamble
let fantasmas=[], moviles=[], tweens=[], montadas=[];
let animT=0;
const ease=x=>x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
let toastT=null;
function showToast(html,ms){
  const t=el('toast'); t.innerHTML=html; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms||3800);
}
function limpiaKit(){
  [...fantasmas,...moviles,...montadas].forEach(o=>borra(o));
  fantasmas=[]; moviles=[]; montadas=[]; tweens=[]; ASM.sel=null;
  RIG.piezas={}; RIG.rodillos=[]; RIG.aspas=null; RIG.lecEst=null; RIG.pantCap=null;
}
function haz(p){ const g=p.build(); centra(g); g.userData.pid=p.k; return g; }
function registra(o){
  const k=o.userData.id, u=o.userData;
  RIG.piezas[k]=o;
  if(k==='rodillos') RIG.rodillos=u.rodillos||[];
  if(k==='ventilador') RIG.aspas=u.aspas;
  if(k==='estacion') RIG.lecEst=u.lec;
  if(k==='captador') RIG.pantCap=u.pant;
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
  reposiciona(); muestraHueco(null); muestraBanco(true);
  G.simUnlocked=false; G.resuelto=false;
  S.setCinematicIdle(false);
  const c=camConjunto(0.98);
  S.moveTo(c[0],c[1],1.3);
}
function muestraHueco(id){
  fantasmas.forEach(f=>{ f.visible=!ASM.done.has(f.userData.id)&&(!id||f.userData.id===id); });
}
function selPieza(o){
  if(ASM.sel===o){ deselec(); return; }
  deselec(); ASM.sel=o; o.userData.lift=0.16;
  muestraHueco(o.userData.id); synth.beep(660,0.06,0.04);
  showToast('<b>'+PART[o.userData.id].rot+'</b> en la mano. Ahora toca su <b>hueco luminoso</b>.',2600);
}
function deselec(){ if(ASM.sel){ ASM.sel.userData.lift=0; ASM.sel=null; } muestraHueco(null); }
function colocaPieza(o,f){
  const p=PART[o.userData.id], i=ORDEN.indexOf(o.userData.id);
  f.visible=false;
  tweens.push({o, p0:o.position.clone(), p1:posDe(o.userData.id).clone(),
    s0:o.scale.x, s1:1, t:0, dur:0.85,
    fin:()=>{ o.userData.kind='placed'; o.userData.lift=0; registra(o); }});
  ASM.done.add(o.userData.id); ASM.sel=null; pedHecho(i);
  montadas.push(o); moviles=moviles.filter(m=>m!==o);
  synth.beep(880,0.07,0.05); setTimeout(()=>synth.beep(1174,0.09,0.05),90);
  showToast('✔ <b>'+p.rot+'</b> instalado. '+p.sin,4400);
  muestraHueco(null); pintaTablero();
  if(ASM.done.size===PARTS.length) finEnsamble();
}
function huecoMal(f){
  f.userData.shake=0.5; synth.beep(200,0.12,0.05);
  showToast('<span class="bad">✗ Esa pieza no va en ese hueco.</span>',2000);
}
function finEnsamble(){
  G.simUnlocked=true; syncCtrl();
  // El banco vacío se APAGA: sus aros luminosos se quedaban en primer plano
  // sembrando de resplandor el pizarrón, y un banco sin piezas no informa nada.
  muestraBanco(false);
  synth.beep(523,0.10,0.05); setTimeout(()=>synth.beep(784,0.14,0.05),130);
  showToast('🎉 <b>Célula de ensayo montada.</b> Se abren los seis modos de trabajo.',4600);
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

// ============================================================ T5 · LAS VISTAS
// ------------------------------------------------------------ 1 · el montaje
function vistaEnsamble(){
  const y0=cabecera('La célula de ensayo','Seis piezas, y ninguna de las seis mide el motor: las seis sirven para que lo que se mida signifique algo. Hasta que no estén las seis no hay nada que publicar.');
  let y=y0+34;
  PARTS.forEach((p,i)=>{
    const hecho=ASM.done.has(p.k);
    chk(66,y-5,hecho);
    texto((i+1)+'. '+p.rot,90,y,{s:16,b:true,c:hecho?TINTA:'#8a94a3'});
    texto(p.fn,90,y+20,{s:13.5,c:'#9aa6b6'});
    texto(p.sin,90,y+38,{s:13,c:hecho?'#6e7a8a':WARN_HEX,it:true});
    y+=66;
  });
  const n=ASM.done.size;
  const txt=n<PARTS.length
    ? 'Faltan '+(PARTS.length-n)+' piezas. Toca una pieza del banco y después su hueco luminoso. Un banco sin estación meteorológica puede medir, pero no puede corregir; y un número sin corregir y sin decir que no está corregido no significa nada.'
    : 'Célula completa. Ahora empieza lo interesante: el mismo coche, el mismo día, va a dar números distintos según el banco, la marcha, el método de pérdidas y la norma. Ninguno de esos números será mentira.';
  banda(y+8,n<PARTS.length?'warn':'ok',
    n<PARTS.length?('MONTADAS '+n+' DE '+PARTS.length):'LISTO PARA MEDIR',txt);
  const P={x:DER_X,y:y0+34,w:DER_W};
  const e=MQ();
  // La altura del recuadro se MIDE: el nombre del vehículo y su nota ocupan
  // distinto número de líneas según el coche, y con la altura escrita a mano la
  // última fila de la tabla se salía por debajo del borde sin que ninguna prueba
  // numérica pudiera enterarse.
  const lnNom=lineasDe(e.nombre,P.w,13.5), lnNota=lineasDe(e.nota,P.w,12.5);
  const hCaja=24+lnNom*18+8+lnNota*17+6+25*6+6+14;
  rpanel(P.x-10,P.y-22,P.w+20,hCaja,'rgba(255,255,255,0.030)','#1e2836',10);
  texto('QUÉ SE VA A MEDIR',P.x,P.y-2,{s:13,b:true,c:'#9aa6b6'});
  let yy=P.y+24;
  yy=wrapText(e.nombre,P.x,yy,P.w,18,{s:13.5,c:TINTA,b:true});
  yy=wrapText(e.nota,P.x,yy+8,P.w,17,{s:12.5,c:'#9aa6b6'})+6;
  const filas=[
    {v:['cilindrada',num(e.cilindrada,3)+' L']},
    {v:['alimentación',e.sobrealimentado?'sobrealimentado':'atmosférico']},
    {v:['tracción',e.masa>1600?'trasera':'delantera']},
    {v:['masa',num(e.masa,0)+' kg']},
    {v:['inercia del volante',num(e.jMotor,3)+' kg·m²']},
  ];
  tablaDer(yy,['','',''],filas);
}

// ------------------------------------------------------- 2 · el barrido
function vistaBarrido(){
  const e=MQ(), b=BANCOS[G.banco], N=NORMAS[G.norma];
  const C=CURVA(), V=EV();
  const y0=cabecera('El barrido, y las cuatro potencias que salen de él',
    'La misma pasada da cuatro cifras distintas y las cuatro se llaman «potencia»: la que el banco LEE, la que publica tras devolver las pérdidas, la que publica tras corregir a norma, y la que el motor da DE VERDAD en las condiciones de esa norma.');
  const P1={x:104,y:y0+38,w:556,h:206};
  const P2={x:104,y:y0+300,w:556,h:186};
  const rMax=e.rpmMax*1.02;
  let pMax=0;
  for(const p of C.pts) pMax=Math.max(pMax,p.potCorr,p.potRef,p.potLeida,p.potPub);
  const M1=ejes(P1,C.pts[0].rpm,rMax,0,pMax*1.10/1000,'','potencia (kW)',
    v=>num(v,0),v=>num(v,0),6,4);
  enCaja(P1,()=>{
    serieXY(M1,C.pts.map(p=>[p.rpm,p.potLeida/1000]),GRIS,2.0,[5,4]);
    serieXY(M1,C.pts.map(p=>[p.rpm,p.potPub/1000]),AZUL,2.2);
    serieXY(M1,C.pts.map(p=>[p.rpm,p.potRef/1000]),OK_HEX,2.6);
    serieXY(M1,C.pts.map(p=>[p.rpm,p.potCorr/1000]),NARANJA,3.0);
    punteo(M1,C.corrMax.rpm,C.corrMax.potCorr/1000,NARANJA,5.4);
    punteo(M1,C.refMax.rpm,C.refMax.potRef/1000,OK_HEX,5.0);
  });
  leyenda(P1.x+16,P1.y+22,[
    ['lo que el banco lee',GRIS,[5,4]],
    ['tras devolver pérdidas',AZUL],
    ['publicada ('+N.corto+')',NARANJA],
    ['la verdad en esas condiciones',OK_HEX],
  ]);
  // ---- el par: el de la HOJA contra el del cigüeñal
  let tMax=0;
  for(const p of C.pts) tMax=Math.max(tMax,p.parCig,p.parHoja);
  const rHojaMax=Math.max(rMax, C.pts[C.pts.length-1].rpmHoja*1.02);
  const M2=ejes(P2,C.pts[0].rpm,rHojaMax,0,tMax*1.12,'vueltas del motor (rpm)','par (N·m)',
    v=>num(v,0),v=>num(v,0),6,4);
  enCaja(P2,()=>{
    serieXY(M2,C.pts.map(p=>[p.rpm,p.parCig]),OK_HEX,2.6);
    serieXY(M2,C.pts.map(p=>[p.rpmHoja,p.parHoja]),NARANJA,3.0);
  });
  leyenda(P2.x+16,P2.y+22,[
    ['par de la hoja',NARANJA],
    ['par real al cigüeñal',OK_HEX],
  ]);
  // ---- la columna derecha
  let y=y0+38;
  texto('EN EL PICO DE LA HOJA',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  const Vp=EV_DE(G.falla,C.corrMax.rpm);
  y=tablaDer(y,['','',''],[
    {v:['régimen',rpmT(C.corrMax.rpm)]},
    {v:['lo que lee el banco',kw(Vp.potLeida)]},
    {v:['tras las pérdidas',kw(Vp.potPub)]},
    {v:['factor '+N.corto,fac(Vp.cf)],c:Vp.fuera?BAD_HEX:TINTA},
    {v:['PUBLICADA',kw(Vp.potCorr)],b:true,c:NARANJA},
    {v:['en CV',cvF(Vp.potCorr)],c:NARANJA},
    {v:['la verdad',kw(Vp.potRef)],b:true,c:OK_HEX},
    {v:['se aleja',pccS(Vp.error*100)],b:true,
      c:Math.abs(Vp.error)>0.05?BAD_HEX:OK_HEX},
  ])+16;
  texto('DE QUIÉN ES LA CULPA',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  y=tablaDer(y,['','',''],[
    {v:['suelo del banco',Vp.pisoBanco===null?'—':pccS(Vp.pisoBanco*100)],c:GRIS},
    {v:['del montaje',Vp.errMedida===null?'—':pccS(Vp.errMedida*100)],c:NARANJA},
    {v:['de la cuenta',Vp.errCuenta===null?'—':pccS(Vp.errCuenta*100)],c:VIO},
    {v:['veredicto',ROT_CULPA[Vp.culpa]],b:true,c:COL_CULPA[Vp.culpa]},
  ]);
  const q=veredicto();
  banda(P2.y+P2.h+66,q.nivel,q.rot,
    b.inercia
      ? 'En un banco de inercia la potencia sale de una DERIVADA: la inercia conocida del rodillo por su aceleración. El par de la hoja no se mide: se calcula dividiendo esa potencia por las vueltas que dice el captador, y por eso un captador que cuente el doble parte el par por la mitad y deja la potencia intacta.'
      : 'Este banco sostiene el régimen y mide el par con una célula de carga. No hay derivada, no hay inercia del motor que se quede nada por el camino, y por eso el número es más limpio — a cambio de tardar mucho más y de calentar mucho más el motor.');
}

// ------------------------------------------------------------ 3 · las normas
const COL_NORMA={observada:GRIS, j1349:NARANJA, iso1585:CIAN, din70020:AZUL, j607:ROSA};
function vistaNorma(){
  const e=MQ(), S1=SITIO(), V=EV();
  const y0=cabecera('Cinco normas, un motor, un día',
    'Cada norma es un convenio de tres partes: unas condiciones de referencia, una fórmula y un INTERVALO DE VALIDEZ. Las tres importan y la tercera se olvida siempre.');
  // ---- gráfica 1 · el factor contra la altitud
  const P1={x:104,y:y0+38,w:556,h:250};
  const alts=[]; for(let a=0;a<=3600;a+=120) alts.push(a);
  const serie=k=>alts.map(a=>{
    const p=presionISA(a), pd=presionSeca(p,S1.TC,S1.hr);
    return [a, NORMAS[k].cf(pd,S1.TC+273.15)];
  });
  const verdad=alts.map(a=>{
    const p=presionISA(a), pd=presionSeca(p,S1.TC,S1.hr);
    const c=cfVerdadero(e,RPM(),pd,S1.TC+273.15,99000,298.15);
    return [a, c===null?1:c];
  });
  let cMax=1.1;
  for(const k of NORMA_KEYS) for(const s of serie(k)) cMax=Math.max(cMax,s[1]);
  for(const v of verdad) cMax=Math.max(cMax,v[1]);
  const M1=ejes(P1,0,3600,0.90,cMax*1.04,'altitud (m)','factor de corrección',
    v=>num(v,0),v=>num(v,2),6,4);
  // La ventana de validez, pintada como lo que es: una franja fuera de la cual
  // la norma NO se aplica, no una recomendación.
  enCaja(P1,()=>{
    bx.save(); bx.fillStyle='rgba(124,217,146,0.10)';
    const ya=M1.Y(LIM_NORMA[1]), yb=M1.Y(LIM_NORMA[0]);
    bx.fillRect(P1.x,ya,P1.w,yb-ya); bx.restore();
    for(const k of NORMA_KEYS){
      if(k==='observada') continue;
      serieXY(M1,serie(k),COL_NORMA[k],2.4);
    }
    serieXY(M1,verdad,OK_HEX,3.2);
    nivelV(P1,M1,S1.alt,WARN_HEX,S1.rot.split(',')[0],null,true);
  });
  nivel(P1,M1,LIM_NORMA[1],OK_HEX,'1,07 · el techo de la norma',[6,4],true);
  nivel(P1,M1,LIM_NORMA[0],OK_HEX,'0,93',[6,4],true);
  leyenda(P1.x+P1.w-206,P1.y+22,[
    ['SAE J1349',COL_NORMA.j1349],
    ['ISO 1585',COL_NORMA.iso1585],
    ['DIN 70020',COL_NORMA.din70020],
    ['SAE J607',COL_NORMA.j607],
    ['el que MERECE este motor',OK_HEX],
  ]);
  // ---- gráfica 2 · la recta y la curva de la que es tangente
  const P2={x:104,y:y0+338,w:556,h:150};
  const Ds=[]; for(let D=0.85;D<=1.55;D+=0.01) Ds.push(D);
  const M2=ejes(P2,0.85,1.55,0.80,1.75,'cociente de densidades D','cf',
    v=>num(v,2),v=>num(v,2),7,3);
  enCaja(P2,()=>{
    bx.save(); bx.fillStyle='rgba(124,217,146,0.10)';
    const xa=M2.X(0.93), xb=M2.X(1.07);
    bx.fillRect(xa,P2.y,xb-xa,P2.h); bx.restore();
    serieXY(M2,Ds.map(D=>[D,cfModelo85(D)]),CIAN,2.6);
    serieXY(M2,Ds.map(D=>[D,1.18*D-0.18]),NARANJA,2.6,[6,4]);
    punteo(M2,V.D,1.18*V.D-0.18,WARN_HEX,5.0);
  });
  leyenda(P2.x+16,P2.y+22,[
    ['la recta de la SAE J1349',NARANJA,[6,4]],
    ['la curva del 85 % mecánico',CIAN],
  ]);
  // ---- la tabla de hoy
  let y=y0+38;
  texto('HOY, EN ESTE SITIO',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  y=tablaDer(y,['','',''],[
    {v:['presión',hpa(V.pAmb)]},
    {v:['vapor de agua',hpa(V.pv)]},
    {v:['presión SECA',hpa(V.pd)],b:true},
    {v:['aire de admisión',celC(V.TAdmC)]},
    {v:['densidad',rhoF(V.rho)]},
    {v:['D de la J1349',fac(V.D)],b:true},
  ])+16;
  texto('CADA NORMA, EN EL PICO',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  const filas=[];
  for(const k of NORMA_KEYS){
    const Ck=memo('n|'+CFGK()+'|'+k,()=>curva(MQ(),Object.assign({},PAR(),{falla:G.falla,norma:k})));
    const Vk=evalua(e,Object.assign({},PAR(),{falla:G.falla,norma:k,rpm:Ck.corrMax.rpm}));
    filas.push({v:[NORMAS[k].corto,cvF(Vk.potCorr),(Vk.fuera?'✗ ':'')+fac(Vk.cf,2)],
      c:k===G.norma?TINTA:'#8f9bad', b:k===G.norma,
      hl:k===G.norma?'rgba(90,209,230,0.10)':null});
  }
  y=tabla(DER_X,y,[{t:'norma',w:118},{t:'publica',w:76,al:'right'},{t:'cf',w:56,al:'right'}],
    filas,{rh:25,s:13,gap:8})+14;
  const cv2=V.cfVerd;
  texto('EL FACTOR QUE MERECE',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  tablaDer(y,['','',''],[
    {v:['verdadero',cv2===null?'—':fac(cv2)],b:true,c:OK_HEX},
    {v:[NORMAS[G.norma].corto,fac(V.cf)],c:V.fuera?BAD_HEX:TINTA},
    {v:['la norma se pasa',V.errCuenta===null?'—':pccS(V.errCuenta*100)],b:true,
      c:Math.abs(V.errCuenta||0)>0.05?BAD_HEX:OK_HEX},
  ]);
  const q=veredicto();
  banda(P2.y+P2.h+64,q.nivel,q.rot,
    e.sobrealimentado
      ? 'Este motor está sobrealimentado, y ahí es donde toda esta aritmética se rompe. Un turbo no persigue una presión de soplado: persigue una presión ABSOLUTA de colector, y mientras al eje le quede margen la sostiene. El factor que MERECE vale '+fac(cv2)+' y la '+NORMAS[G.norma].corto+' le aplica '+fac(V.cf)+'. Las normas se ajustaron midiendo motores atmosféricos, y con uno que se defiende del ambiente dejan de valer mucho antes de lo que su intervalo sugiere.'
      : 'Este motor es atmosférico, que es para el que se escribieron las fórmulas, y por eso la norma acierta: pide '+fac(V.cf)+' donde el motor merece '+fac(cv2)+'. Fíjate en que sigue acertando MUY por encima de 1,07. El intervalo no está ahí porque la fórmula se rompa: está ahí porque hay motores para los que deja de valer, y no se puede saber cuál mirando la hoja.');
}

// --------------------------------------------------------- 4 · dónde se pierde
function vistaCadena(){
  const e=MQ(), b=BANCOS[G.banco], V=EV();
  const y0=cabecera('Del pistón al número publicado',
    'Cada escalón es una decisión o una pérdida, y ninguno de los dos se ve en la hoja. Se lee de izquierda a derecha: lo que el motor da, lo que llega al rodillo, lo que el banco lee, lo que se le devuelve y lo que la norma multiplica.');
  const pasos=[];
  pasos.push({rot:'al cigüeñal',v:V.potCig,c:OK_HEX,
    nota:'lo que el motor da hoy, aquí'});
  if(b.rueda){
    const pRueda=V.parRueda*V.wRueda;
    pasos.push({rot:'menos transmisión',v:pRueda,c:AZUL,
      nota:'arrastre de caja, grupo y neumático: '+nm(V.parPerd)+' en la rueda'});
    const pSlip=pRueda*(1-V.slip);
    pasos.push({rot:'menos patinaje',v:pSlip,c:AZUL,
      nota:'el neumático patina el '+pcc(V.slip*100)+' sobre el rodillo, y eso se queda en calor'});
    if(b.inercia) pasos.push({rot:'menos su propio volante',v:V.potLeida,c:AZUL,
      nota:'el barrido se queda el '+pcc(V.robada*100)+' acelerando el motor'});
  }
  pasos.push({rot:'LO QUE LEE',v:V.potLeida,c:GRIS,nota:'la única cifra que el banco ha medido'});
  if(b.rueda&&G.perdidas!=='ninguna')
    pasos.push({rot:'más '+PERDIDAS[G.perdidas].corto,v:V.potPub,c:VIO,
      nota:'se devuelven '+kw(V.devuelto)+' por el método elegido'});
  pasos.push({rot:'por '+fac(V.cf),v:V.potCorr,c:NARANJA,
    nota:'el factor de la '+NORMAS[G.norma].corto+(V.fuera?' — FUERA de su intervalo':'')});
  pasos.push({rot:'LA VERDAD',v:V.potRef,c:OK_HEX,
    nota:'lo que este motor da en las condiciones de referencia de esa norma'});

  const P={x:104,y:y0+44,w:556,h:404};
  let vMax=0; for(const p of pasos) vMax=Math.max(vMax,p.v);
  const M=ejes(P,0,vMax*1.12/1000,0,pasos.length,'potencia (kW)','',
    v=>num(v,0),null,5,pasos.length);
  const hb=P.h/pasos.length;
  pasos.forEach((p,i)=>{
    const yy=P.y+i*hb+hb*0.16, hh=hb*0.52;
    const w=Math.max(2,(p.v/1000)/(vMax*1.12/1000)*P.w);
    rpanel(P.x,yy,w,hh,p.c==='#7b8697'?'rgba(123,134,151,0.30)':p.c+'44',p.c,4);
    texto(p.rot,P.x+8,yy+hh*0.62,{s:13,b:true,c:TINTA});
    texto(kw(p.v)+'  ·  '+cvF(p.v),P.x+w+10,yy+hh*0.62,{s:13,b:true,c:p.c});
    texto(p.nota,P.x+8,yy+hh+13,{s:11.5,c:'#7b8697'});
  });
  let y=y0+44;
  texto('LAS DOS CULPAS, SEPARADAS',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  y=tablaDer(y,['','',''],[
    {v:['error total',V.error===null?'—':pccS(V.error*100)],b:true},
    {v:['suelo del banco',V.pisoBanco===null?'—':pccS(V.pisoBanco*100)],c:GRIS},
    {v:['del montaje',V.errMedida===null?'—':pccS(V.errMedida*100)],c:NARANJA},
    {v:['de la cuenta',V.errCuenta===null?'—':pccS(V.errCuenta*100)],c:VIO},
    {v:['veredicto',ROT_CULPA[V.culpa]],b:true,c:COL_CULPA[V.culpa]},
  ])+16;
  texto('EL BANCO',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  y=wrapText(BANCOS[G.banco].nota,DER_X,y+8,DER_W,17,{s:12.5,c:'#9aa6b6'})+10;
  texto('EL MÉTODO DE PÉRDIDAS',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  wrapText(PERDIDAS[G.perdidas].nota,DER_X,y+8,DER_W,17,{s:12.5,c:'#9aa6b6'});
  const q=veredicto();
  banda(P.y+P.h+52,q.nivel,q.rot,
    'Fíjate en el escalón del patinaje y en el del volante: ninguno de los dos lo recupera NINGÚN método de pérdidas, porque una desaceleración libre se hace con el gas cortado y ahí ni el neumático transmite par ni el motor acelera. Son pérdidas que la hoja no puede devolver aunque el taller lo haga todo bien.');
}

// --------------------------------------------------- 5 · las pérdidas y la marcha
function vistaPerdidas(){
  const e=MQ(), b=BANCOS[G.banco];
  const y0=cabecera('La regla del 15 % contra lo que se puede medir',
    'De la rueda al cigüeñal hay una pérdida, y multiplicar por 1/0,85 es exactamente igual de riguroso que adivinarla. La desaceleración libre la MIDE: se corta el gas, se cronometra cómo se para y la inercia conocida hace el resto.');
  const D=DECEL(G.falla);
  if(!D){
    banda(y0+60,'warn','ESTE BANCO NO TIENE TRANSMISIÓN',
      'Un banco de motor mide el par en el cigüeñal con un brazo y una célula de carga: no hay caja, ni grupo, ni neumático, ni pérdidas que devolver. Cambia a un banco de rodillos para ver de qué se está hablando.');
    let y=y0+180;
    texto('POR QUÉ IMPORTA',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
    wrapText('Casi nadie tiene un banco de motor. Todas las cifras que circulan por un taller salen de rodillos, y de rodillos sale la potencia EN LA RUEDA. Lo que pasa entre esa cifra y la que se publica es lo que esta vista enseña.',
      DER_X,y+8,DER_W,17,{s:12.5,c:'#9aa6b6'});
    return;
  }
  const P1={x:104,y:y0+38,w:556,h:206};
  let fMax=0.20;
  for(const p of D.pts) if(p.frac!==null) fMax=Math.max(fMax,p.frac);
  const M1=ejes(P1,D.pts[0].rpm,e.rpmMax,0,fMax*1.15*100,'','pérdida (% de la potencia)',
    v=>num(v,0),v=>num(v,0),6,4);
  enCaja(P1,()=>{
    // El hueco entre las dos curvas es lo que NINGÚN método devuelve: con el gas
    // cortado no pasa par por los engranes, así que la desaceleración libre no
    // puede medir la parte de la pérdida que sí depende del par.
    bx.save(); bx.fillStyle='rgba(180,140,224,0.16)';
    bx.beginPath();
    const arr=D.pts.filter(p=>p.frac!==null);
    arr.forEach((p,i)=>{ const X=M1.X(p.rpm), Y=M1.Y(p.frac*100);
      if(i===0) bx.moveTo(X,Y); else bx.lineTo(X,Y); });
    for(let i=arr.length-1;i>=0;i--) bx.lineTo(M1.X(arr[i].rpm),M1.Y(arr[i].fracArr*100));
    bx.closePath(); bx.fill(); bx.restore();
    serieXY(M1,arr.map(p=>[p.rpm,p.frac*100]),NARANJA,3.0);
    serieXY(M1,arr.map(p=>[p.rpm,p.fracArr*100]),AZUL,2.6,[6,4]);
  });
  nivel(P1,M1,15,VIO,'la regla del 15 %',[7,5],false);
  leyenda(P1.x+16,P1.y+22,[
    ['la pérdida de verdad',NARANJA],
    ['lo que MIDE la desaceleración',AZUL,[6,4]],
  ]);
  // ---- el par de arrastre, que es lo que de verdad se mide
  const P2={x:104,y:y0+296,w:556,h:172};
  let tMax=0; for(const p of D.pts) tMax=Math.max(tMax,p.par);
  const M2=ejes(P2,D.pts[0].rpm,e.rpmMax,0,tMax*1.15,'vueltas del motor (rpm)','par de pérdidas en la rueda (N·m)',
    v=>num(v,0),v=>num(v,0),6,4);
  enCaja(P2,()=>{
    serieXY(M2,D.pts.map(p=>[p.rpm,p.par]),NARANJA,2.8);
    serieXY(M2,D.pts.map(p=>[p.rpm,p.arrastre]),AZUL,2.4,[6,4]);
  });
  leyenda(P2.x+16,P2.y+22,[
    ['total, con el rendimiento de los engranes',NARANJA],
    ['arrastre solo: lo que mide el gas cortado',AZUL,[6,4]],
  ]);
  // ---- la columna derecha: la marcha
  let y=y0+38;
  texto('LA PÉRDIDA, A LO LARGO DE LA PASADA',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  const pico=D.pts.reduce((m,p)=>p.potRueda>m.potRueda?p:m,D.pts[0]);
  y=tablaDer(y,['','',''],[
    {v:['al empezar',pcc(D.fracMin*100)]},
    {v:['al acabar',pcc(D.fracMax*100)]},
    {v:['en el pico',pcc(pico.frac*100)],b:true},
    {v:['de eso, arrastre',pcc(pico.fracArr*100)],c:AZUL},
    {v:['lo que nadie devuelve',pcc((pico.frac-pico.fracArr)*100)],b:true,c:VIO},
    {v:['inercia en rueda',kgm2(D.jEnRueda)]},
  ])+16;
  texto('LA MARCHA, EN ESTE BANCO',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  const filas=[];
  for(let m=0;m<e.relaciones.length;m++){
    const Cm=memo('m|'+CFGK()+'|'+G.falla+'|'+m,
      ()=>curva(e,Object.assign({},PAR(),{falla:G.falla,marcha:m})));
    filas.push({v:[(m+1)+'ª',cvF(Cm.corrMax.potCorr),
      pcc(fraccionRobada(e,m,G.banco)*100,1)],
      b:m===MARCHA(), c:m===MARCHA()?TINTA:'#8f9bad',
      hl:m===MARCHA()?'rgba(90,209,230,0.10)':null});
  }
  tabla(DER_X,y,[{t:'marcha',w:70},{t:'publica',w:96,al:'right'},{t:'se queda',w:84,al:'right'}],
    filas,{rh:24,s:13,gap:8});
  const q=veredicto();
  banda(P2.y+P2.h+62,q.nivel,q.rot,
    'La franja violeta es la parte de la pérdida que NINGÚN método devuelve: el rendimiento de los engranes es proporcional al par que pasa por ellos, y con el gas cortado no pasa ninguno. Por eso una potencia «corregida por desaceleración» sale siempre por debajo de la de un banco de motor. '+
    (b.inercia
      ? 'Y la columna «se queda» es otra cosa: la potencia que el barrido gasta en acelerar el propio volante. Vale J_motor/(J_motor + J_conocida), no depende del par y crece con el cuadrado de la desmultiplicación —por eso el MISMO coche da más potencia en una marcha larga—.'
      : 'Este banco sostiene el régimen, así que el motor no acelera y no se queda nada para sí mismo.'));
}

// ---------------------------------------------------------------- 6 · censo
function vistaCenso(){
  const e=MQ(), C=CENSO();
  const y0=cabecera('Nueve montajes por cinco sitios',
    'Cada casilla dice cuánto se aleja el número publicado de la verdad y, sobre todo, DE QUIÉN es la culpa: naranja si el montaje cuesta algo POR ENCIMA de lo que este banco se deja de todas formas, violeta si la aritmética de después lo multiplicó mal.');
  const x0=190, y1=y0+56, cw=(BW-90-x0)/ESCENARIOS.length, rh=54;
  ESCENARIOS.forEach((E,j)=>{
    const t=E.rot.split(',');
    texto(t[0],x0+cw*(j+0.5),y1-24,{s:12.5,b:true,c:'#9aa6b6',al:'center'});
    texto((t[1]||'').trim(),x0+cw*(j+0.5),y1-9,{s:11.5,c:'#7b8697',al:'center'});
  });
  C.filas.forEach((f,i)=>{
    const yy=y1+i*rh;
    texto(corta(FALLAS[f.falla].corto,20),46,yy+rh*0.52,
      {s:13,b:f.falla===G.falla,c:f.falla===G.falla?CIAN:'#c3ccd8'});
    f.celdas.forEach((c,j)=>{
      const x=x0+cw*j+3, w=cw-6, h=rh-8;
      const col=COL_CULPA[c.culpa];
      const fondo=c.culpa==='ninguna'?'rgba(124,217,146,0.10)'
        :(c.culpa==='medida'?'rgba(240,160,90,0.14)'
        :(c.culpa==='cuenta'?'rgba(180,140,224,0.16)':'rgba(255,107,107,0.16)'));
      rpanel(x,yy+2,w,h,fondo,col,5);
      texto(pccS(c.error*100,0),x+w/2,yy+22,{s:15,b:true,c:col,al:'center'});
      texto('mnt '+pccS(c.errMedida*100,0)+' · cta '+pccS(c.errCuenta*100,0),
        x+w/2,yy+38,{s:10.5,c:'#8f9bad',al:'center'});
      if(c.peligro) texto('⚠',x+w-11,yy+15,{s:12,c:BAD_HEX,al:'center'});
      if(c.fuera) texto('✗',x+9,yy+15,{s:12,c:BAD_HEX,al:'center'});
    });
  });
  const y2=y1+C.filas.length*rh+10;
  leyenda(60,y2+18,[
    ['nada que reprochar',COL_CULPA.ninguna],
    ['culpa del montaje',COL_CULPA.medida],
    ['culpa de la cuenta',COL_CULPA.cuenta],
    ['las dos cosas',COL_CULPA.ambas],
  ]);
  texto('✗ el factor se sale del intervalo de la norma   ·   ⚠ el coche se mueve sobre los rodillos',
    330,y2+30,{s:12,c:'#7b8697'});
  const nc=C.porCuenta, nm2=C.porMedida;
  texto('De '+C.total+' casillas: '+C.mudo+' mudas · '+nm2+' con culpa del montaje · '+
    nc+' con culpa de la cuenta · '+C.fuera+' con el factor fuera de norma.',
    330,y2+48,{s:12.5,c:'#9aa6b6'});
  // El suelo del banco va APARTE, porque no es culpa de nadie: es la máquina. Y
  // va envuelto, porque el ancho del pizarrón acaba en 982 y esta línea se salía.
  wrapText('Por debajo de todo, el suelo de este banco bien montado: '+
    C.piso.map(function(v){ return pccS(v*100,0); }).join(' · ')+
    '. Ese trozo no lo arregla ningún montaje: es la máquina.',
    330,y2+66,BW-372,17,{s:12.5,c:GRIS});
}

// ============================================================ T5b · EL RETO
const INSTR=[
  {k:'hoja', rot:'La hoja que salió del banco',
   nota:'Potencia publicada, par de pico y el factor impreso al pie.'},
  {k:'meteo', rot:'El registro de la estación',
   nota:'Las tres cifras con las que se corrigió. Compáralas con el sitio.'},
  {k:'coast', rot:'La desaceleración libre',
   nota:'El par de arrastre que se le devolvió a la rueda.'},
  {k:'rodillo', rot:'Vueltas de rodillo contra vueltas de rueda',
   nota:'La única forma de ver el patinaje. Ningún banco lo imprime.'},
  {k:'repite', rot:'Repetir la pasada por tercera vez',
   nota:'Si el número baja pasada a pasada, el problema es térmico.'},
  {k:'otro', rot:'Llevarlo al banco de freno',
   nota:'Otra máquina, el mismo coche. Separa lo que depende del barrido.'},
];
const RETO={falla:'sano', maq:'na16', sitio:'mar25', sitioRot:'', norma:'j1349',
  banco:'inercia', perdidas:'coastdown', marcha:2, pasada:3,
  medido:{}, elegido:null, veredicto:null};
function retoPar(extra){
  const S1=ESCENARIOS.find(E=>E.k===RETO.sitio)||ESCENARIOS[0];
  return Object.assign({banco:RETO.banco, norma:RETO.norma, perdidas:RETO.perdidas,
    marcha:RETO.marcha, pasada:RETO.pasada, alt:S1.alt, TC:S1.TC, hr:S1.hr}, extra||{});
}
function retoCurva(f,extra){
  return memo('rc|'+RETO.maq+'|'+RETO.sitio+'|'+RETO.banco+'|'+RETO.norma+'|'+
    RETO.marcha+'|'+RETO.pasada+'|'+JSON.stringify(extra||{})+'|'+f,
    ()=>curva(ARQ[RETO.maq],retoPar(Object.assign({falla:f},extra))));
}
function retoEv(f,extra){
  const C=retoCurva(f,extra);
  return memo('re|'+RETO.maq+'|'+RETO.sitio+'|'+RETO.banco+'|'+RETO.norma+'|'+
    RETO.marcha+'|'+RETO.pasada+'|'+JSON.stringify(extra||{})+'|'+f,
    ()=>evalua(ARQ[RETO.maq],retoPar(Object.assign({falla:f,rpm:C.corrMax.rpm},extra))));
}
// La resolución de los instrumentos es la de instrumentos DE VERDAD. Con
// resolución infinita el primer aparato resuelve siempre el caso y el reto deja
// de ser un reto: media hoja de banco se lee a media décima de kilovatio.
const r=(x,p)=>Math.round(x/p)*p;
function firma(f,k){
  if(k==='hoja'){
    const V=retoEv(f), C=retoCurva(f);
    return [r(V.potCorr/1000,0.5), r(C.corrMax.rpmHoja,50), r(V.cf,0.01)];
  }
  if(k==='meteo'){
    const V=retoEv(f);
    return [r(V.est.p/100,1), r(V.est.TC,0.5), r(V.est.hr*100,5)];
  }
  if(k==='coast'){ const V=retoEv(f); return [r(V.parPerd,5)]; }
  if(k==='rodillo'){ const V=retoEv(f); return [r(V.slip*100,0.5)]; }
  if(k==='repite'){
    const V=retoEv(f,{pasada:5});
    return [r(V.potCorr/1000,0.5)];
  }
  if(k==='otro'){
    const V=retoEv(f,{banco:'freno'});
    return [r(V.potCorr/1000,0.5)];
  }
  return [];
}
function compatible(f){
  const B=RETO.falla;
  for(const k of Object.keys(RETO.medido)){
    if(!RETO.medido[k]) continue;
    if(firma(f,k).join('|')!==firma(B,k).join('|')) return false;
  }
  return true;
}
function armaReto(){
  const fs=FALLA_KEYS.slice();
  RETO.falla=fs[Math.floor(Math.random()*fs.length)];
  RETO.maq=ARQ_KEYS[Math.floor(Math.random()*ARQ_KEYS.length)];
  const S1=ESCENARIOS[Math.floor(Math.random()*ESCENARIOS.length)];
  RETO.sitio=S1.k; RETO.sitioRot=S1.rot;
  RETO.norma=NORMA_KEYS[1+Math.floor(Math.random()*(NORMA_KEYS.length-1))];
  RETO.marcha=Math.min(2+Math.floor(Math.random()*2),ARQ[RETO.maq].relaciones.length-1);
  RETO.medido={}; RETO.elegido=null; RETO.veredicto=null;
  invalida();
}
function queja(V){
  if(V.error===null) return 'que el banco no le cuadra';
  if(V.error>0.12) return 'que el número le sale muchísimo más alto de lo que declara el fabricante';
  if(V.error>0.04) return 'que le sale más alto de lo que esperaba';
  if(V.error<-0.12) return 'que el coche le ha perdido un montón de potencia';
  if(V.error<-0.04) return 'que le sale por debajo de lo que declara el fabricante';
  return 'que la hoja tiene algo raro aunque el número parezca bueno';
}
function mide(k){
  if(!INSTR.some(i=>i.k===k)) return;
  RETO.medido[k]=true; synth.beep(720,0.07,0.05); afterEdit(); refrescaPregunta();
}
function eligeFalla(k){ if(!FALLAS[k]) return; RETO.elegido=k; afterEdit(); }
function entrega(){
  if(!RETO.elegido) return false;
  const ok=RETO.elegido===RETO.falla;
  RETO.veredicto=ok?'ok':'mal';
  if(ok){ G.resuelto=true; synth.beep(523,0.10,0.05);
    setTimeout(()=>synth.beep(784,0.14,0.05),130);
    showToast('✔ <b>Correcto.</b> Era '+FALLAS[RETO.falla].rot+'.',4600); }
  else { synth.beep(200,0.14,0.06);
    showToast('<span class="bad">✗ No era eso.</span> Era '+FALLAS[RETO.falla].rot+'.',4600); }
  afterEdit(); refrescaPregunta();
  return ok;
}

function vistaReto(){
  const e=ARQ[RETO.maq];
  const y0=cabecera('Una hoja de banco que no cuadra',
    'Llega una hoja de dinamómetro y el cliente no se la cree. El coche está bien: lo que está mal es el ensayo. Pide instrumentos, y fíjate en que ninguno de ellos ve la célula entera.',true);
  const V=retoEv(RETO.falla), C=retoCurva(RETO.falla);
  const M=RETO.medido;
  // ---- la hoja, siempre visible: es el punto de partida
  const P={x:104,y:y0+40,w:556,h:352};
  rpanel(P.x-14,P.y-16,P.w+28,P.h+42,'rgba(255,255,255,0.030)','#1e2836',10);
  texto('HOJA DE ENSAYO',P.x,P.y+4,{s:14,b:true,c:'#9aa6b6'});
  texto(e.nombre,P.x,P.y+26,{s:13.5,c:TINTA});
  texto(BANCOS[RETO.banco].rot+' · '+(RETO.marcha+1)+'ª marcha · '+PERDIDAS[RETO.perdidas].rot,
    P.x,P.y+46,{s:12.5,c:'#8f9bad'});
  texto(RETO.sitioRot,P.x,P.y+64,{s:12.5,c:NARANJA});
  const gp={x:P.x,y:P.y+92,w:P.w,h:232};
  let pM=0; for(const p of C.pts) pM=Math.max(pM,p.potCorr);
  const rM=C.pts[C.pts.length-1].rpmHoja*1.02;
  const Mg=ejes(gp,C.pts[0].rpmHoja,rM,0,pM*1.12/1000,'vueltas según el captador (rpm)','kW',
    v=>num(v,0),v=>num(v,0),6,3);
  enCaja(gp,()=>{ serieXY(Mg,C.pts.map(p=>[p.rpmHoja,p.potCorr/1000]),NARANJA,3.0); });
  // ---- lo que cada instrumento dice
  let y=y0+40;
  texto('LO QUE DICE LA HOJA',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  y=tablaDer(y,['','',''],[
    {v:['potencia',cvF(V.potCorr)],b:true,c:NARANJA},
    {v:['par de pico',nm(C.corrMax.parHoja)]},
    {v:['a',rpmT(C.corrMax.rpmHoja)]},
    {v:['norma',NORMAS[RETO.norma].corto]},
    {v:['factor impreso',fac(V.cf)]},
  ])+14;
  const dice=[];
  if(M.meteo) dice.push({v:['la estación',hpa(V.est.p,0)+' · '+celC(V.est.TC,0)+' · '+pcc(V.est.hr*100,0)]});
  if(M.coast) dice.push({v:['arrastre medido',nm(V.parPerd,0)]});
  if(M.rodillo) dice.push({v:['patinaje',pcc(V.slip*100,1)]});
  if(M.repite) dice.push({v:['5.ª pasada',cvF(retoEv(RETO.falla,{pasada:5}).potCorr)]});
  if(M.otro) dice.push({v:['en banco de freno',cvF(retoEv(RETO.falla,{banco:'freno'}).potCorr)]});
  if(dice.length){
    texto('LO QUE HAS MEDIDO',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
    y=tablaDer(y,['','',''],dice)+14;
  }
  const vivas=FALLA_KEYS.filter(compatible);
  texto('SIGUEN EN PIE',DER_X,y,{s:13,b:true,c:'#9aa6b6'}); y+=20;
  texto(vivas.length+' de '+FALLA_KEYS.length,DER_X,y+2,{s:20,b:true,
    c:vivas.length===1?OK_HEX:(vivas.length<4?WARN_HEX:TINTA)}); y+=26;
  wrapText(vivas.map(k=>FALLAS[k].corto).join(' · '),DER_X,y+4,DER_W,17,{s:12.5,c:'#9aa6b6'});
  const nivelV2=RETO.veredicto==='ok'?'ok':(RETO.veredicto==='mal'?'bad':'warn');
  const rot=RETO.veredicto==='ok'?'DICTAMEN CORRECTO'
    :(RETO.veredicto==='mal'?'NO ERA ESO':'DIAGNÓSTICO A CIEGAS');
  const txt=RETO.veredicto
    ? 'Era '+FALLAS[RETO.falla].rot+'. '+FALLAS[RETO.falla].pista
    : 'El cliente dice '+queja(V)+'. Has usado '+Object.keys(M).length+' de '+INSTR.length+
      ' instrumentos. Ninguno de ellos ve la célula entera, y hay dos montajes que sólo se separan cambiando de máquina.';
  // La banda va a una altura FIJA. Colgada del alto del panel se montaba encima
  // de la columna derecha en cuanto había pocos instrumentos medidos.
  banda(624,nivelV2,rot,txt);
}

// ===================================== T6 · LO QUE SE MUEVE POR FOTOGRAMA
// Nada de esto es decorativo: los rodillos giran a las vueltas que el modelo
// calcula, las ruedas motrices giran con ellos y el ventilador se para cuando
// la avería dice que está parado.
function anima(dt){
  animT+=dt;
  moviles.forEach(o=>{
    const u=o.userData;
    o.position.y=u.baseY+Math.sin(animT*1.5+u.fase)*0.022+u.lift;
    o.rotation.y+=dt*0.30;
  });
  fantasmas.forEach(f=>{
    const u=f.userData;
    if(u.gm) u.gm.opacity=0.18+0.12*(0.5+0.5*Math.sin(animT*2.6));
    if(u.shake>0){
      u.shake=Math.max(0,u.shake-dt*2);
      f.position.x=u.home.x+Math.sin(animT*40)*0.05*u.shake;
    }else if(u.home) f.position.x=u.home.x;
  });
  for(let i=tweens.length-1;i>=0;i--){
    const w=tweens[i]; w.t+=dt;
    const k=ease(clamp(w.t/w.dur,0,1));
    w.o.position.lerpVectors(w.p0,w.p1,k);
    const s=w.s0+(w.s1-w.s0)*k; w.o.scale.setScalar(s);
    w.o.rotation.y*=(1-k*0.22);
    if(w.t>=w.dur){ w.o.position.copy(w.p1); w.o.scale.setScalar(w.s1);
      w.o.rotation.set(0,0,0); if(w.fin) w.fin(); tweens.splice(i,1); }
  }
  if(!G.simUnlocked) return;

  const V=(G.modo==='reto')?retoEv(RETO.falla):EV();
  const e=(G.modo==='reto')?ARQ[RETO.maq]:MQ();
  const marcha=(G.modo==='reto')?RETO.marcha:MARCHA();
  const rpm=(G.modo==='reto')?retoCurva(RETO.falla).corrMax.rpm:RPM();
  // La rueda y el rodillo NO giran a la misma velocidad: el rodillo es más
  // pequeño, así que gira más deprisa, y encima el neumático patina. Las dos
  // cosas se ven, y son media práctica.
  const wRueda=(rpm*Math.PI/30)/(e.relaciones[marcha]*e.grupo);
  const wRod=wRueda*(1-(V.slip||0))*(e.rRueda/R_RODILLO);
  const escala=0.010;
  RIG.ruedas.forEach(r2=>{ r2.rotation.z-=wRueda*escala*dt*60*0.02; });
  RIG.rodillos.forEach(r2=>{ r2.rotation.y+=wRod*escala*dt*60*0.02; });
  // El ventilador se para cuando no lo hay o cuando sopla contra una pared.
  if(RIG.aspas){
    const F=averia(G.modo==='reto'?RETO.falla:G.falla);
    const v=F.sinVentilador?0:(F.aireRecirculado?0.35:1);
    RIG.aspas.rotation.x+=dt*7.5*v;
  }
  // La estación parpadea en ámbar cuando no responde.
  if(RIG.lecEst){
    const F=averia(G.modo==='reto'?RETO.falla:G.falla);
    const m=RIG.lecEst.material;
    if(F.sinEstacion){ m.color.setHex(0xE9C46A); m.emissive.setHex(0xE9C46A);
      m.emissiveIntensity=0.5+0.6*(0.5+0.5*Math.sin(animT*5)); }
    else { m.color.setHex(0x2AA6B8); m.emissive.setHex(0x2AA6B8); m.emissiveIntensity=1.0; }
  }
}

// =========================================== T7 · HUD, MANDOS Y TELEMETRÍA
const MODES=['ensamble','barrido','norma','cadena','perdidas','censo','reto'];
const MODE_META={
  ensamble:['· montaje',  'LA CÉLULA DE ENSAYO'],
  barrido: ['· barrido',  'LA PASADA'],
  norma:   ['· normas',   'CINCO CONVENIOS'],
  cadena:  ['· cadena',   'DÓNDE SE PIERDE'],
  perdidas:['· pérdidas', 'LA REGLA DEL 15 %'],
  censo:   ['· censo',    'LAS 45 CASILLAS'],
  reto:    ['· reto',     'UNA HOJA QUE NO CUADRA'],
};
const HUD_TXT={
  ensamble:'Seis piezas, y ninguna mide el motor: las seis sirven para que lo que se mida signifique algo.',
  barrido:'La misma pasada da cuatro cifras y las cuatro se llaman «potencia». Mira cuál es cuál antes de creerte ninguna.',
  norma:'Cinco convenios sobre el mismo motor y el mismo día. Ninguno miente; publicar uno sin decir cuál, sí.',
  cadena:'Del pistón al número publicado, escalón a escalón. Dos de esos escalones no los recupera ningún método.',
  perdidas:'Multiplicar por 1/0,85 es igual de riguroso que adivinarlo. La desaceleración libre lo mide.',
  censo:'Nueve montajes por cinco sitios, y en cada casilla la pregunta de verdad: ¿lo midió mal o lo multiplicó mal?',
  reto:'Llega una hoja y el cliente no se la cree. Seis instrumentos; el asunto no es acertar, es saber cuál separa.',
};
function pintaHUD(){
  const m=MODE_META[G.modo]||MODE_META.ensamble;
  el('hud').innerHTML='<h1>Dinamómetro '+m[1]+'</h1><p>'+HUD_TXT[G.modo]+'</p>';
}

el('panel').innerHTML=
  '<h4>Célula de ensayo</h4>'+
  '<div id="ctrl"></div>'+
  '<div id="retobox" style="display:none">'+
    '<div class="gl" style="margin:9px 0 4px"><span>Instrumentos · cada uno cuesta una consulta</span></div>'+
    '<div class="btns" id="instrreto"></div>'+
    '<div class="gl" style="margin:10px 0 4px"><span>Tu dictamen: qué está mal montado</span></div>'+
    '<div class="btns" id="dxreto"></div>'+
    '<div class="modebar" style="margin-top:8px">'+
      '<button class="b" id="btnPista">Pista</button>'+
      '<button class="b on" id="btnEntrega">Entregar dictamen</button>'+
      '<button class="b" id="btnOtro">Otro caso</button>'+
    '</div>'+
  '</div>'+
  '<div id="tele"></div>'+
  '<div class="console" id="report"></div>'+
  '<div class="modebar" style="margin-top:10px">'+
    '<button class="b auto" id="btnAuto">▶︎ Recorrido guiado</button>'+
  '</div>'+
  '<h4 class="sec">Comprueba lo que has leído</h4>'+
  '<div id="quiz"></div>';

function fila(rot,attr,ops,cur){
  const filas=Math.max(1,Math.ceil(ops.length/3));
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
  const ciego=(G.modo==='reto'), e=MQ();
  // Los modos que no son el montaje se ofrecen SIEMPRE, pero deshabilitados
  // hasta que la célula esté completa: esconderlos haría creer que no existen, y
  // enseñarlos vivos dejaría publicar un número sin estación meteorológica.
  let h='<div class="gl" style="margin:9px 0 4px"><span>Vista</span></div>';
  const dis=m=>(m!=='ensamble'&&!G.simUnlocked)?' disabled':'';
  h+='<div class="modebar">'+MODES.slice(0,4).map(m=>
    '<button class="b'+(G.modo===m?' on':'')+dis(m)+'" data-mode="'+m+'">'+MODE_META[m][0]+'</button>').join('')+'</div>';
  h+='<div class="modebar">'+MODES.slice(4).map(m=>
    '<button class="b'+(G.modo===m?' on':'')+dis(m)+'" data-mode="'+m+'">'+MODE_META[m][0]+'</button>').join('')+'</div>';
  h+=fila('Vehículo','data-maq',ARQ_KEYS.map(k=>[k,ARQ[k].corto]),G.maq);
  if(G.modo==='ensamble'){
    h+='<div class="modebar" style="margin-top:8px">'+
       '<button class="b" id="btnMonta">Montar solo</button>'+
       '<button class="b" id="btnDesmonta">Desmontar</button></div>';
  }
  if(!ciego&&G.simUnlocked){
    h+=fila('Banco','data-banco',BANCO_KEYS.map(k=>[k,BANCOS[k].corto]),G.banco);
    h+=fila('Norma de corrección','data-norma',NORMA_KEYS.map(k=>[k,corta(NORMAS[k].corto,12)]),G.norma);
    h+=fila('Pérdidas','data-perd',PERD_KEYS.map(k=>[k,PERDIDAS[k].corto]),G.perdidas);
    h+=fila('Marcha','data-marcha',
      e.relaciones.map((_,i)=>[String(i),(i+1)+'ª']),String(MARCHA()));
    h+=fila('Sitio y día','data-sitio',
      ESCENARIOS.map(E=>[E.k,corta(E.rot.split(',')[0],13)]),G.sitio);
    h+=fila('Pasada','data-pasada',[['1','1.ª'],['3','3.ª'],['5','5.ª']],String(G.pasada));
    h+=fila('Qué está mal montado','data-falla',
      FALLA_KEYS.map(k=>[k,corta(FALLAS[k].corto,17)]),G.falla);
  }
  el('ctrl').innerHTML=h;
  el('retobox').style.display=ciego?'block':'none';
  if(ciego){
    el('instrreto').innerHTML=INSTR.map(i=>
      '<button class="b dx'+(RETO.medido[i.k]?' on':'')+'" data-inst="'+i.k+'">'+
      corta(i.rot,42)+'</button>').join('');
    el('dxreto').innerHTML=FALLA_KEYS.map(k=>{
      const cls=RETO.veredicto===null
        ? (RETO.elegido===k?' on':'')
        : (k===RETO.falla?' right':(k===RETO.elegido?' wrong':''));
      return '<button class="b dx'+cls+'" data-dx="'+k+'">'+FALLAS[k].corto+'</button>';
    }).join('');
  }
}

// ----------------------------------------------------------------- telemetría
const glf=(l,v,c)=>'<div class="g"><div class="gl"><span>'+l+'</span><b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div></div>';
function pintaTele(){
  let h='';
  if(!G.simUnlocked){
    h+=glf('Piezas instaladas',ASM.done.size+' / '+PARTS.length,
      ASM.done.size===PARTS.length?'good':'warn');
    h+=glf('Siguiente',(PARTS.find(p=>!ASM.done.has(p.k))||{rot:'—'}).rot);
    el('tele').innerHTML=h; return;
  }
  if(G.modo==='reto'){
    const V=retoEv(RETO.falla), C=retoCurva(RETO.falla), M=RETO.medido;
    const e=ARQ[RETO.maq];
    h+=glf('Vehículo',e.corto+' · '+num(e.cilindrada,1)+' L');
    h+=glf('Sitio',RETO.sitioRot);
    h+=glf('Norma impresa',NORMAS[RETO.norma].corto);
    if(M.hoja||true){
      h+=glf('Potencia de la hoja',cvF(V.potCorr));
      h+=glf('Par de pico',nm(C.corrMax.parHoja,0)+' a '+rpmT(C.corrMax.rpmHoja));
      h+=glf('Factor impreso',fac(V.cf));
    }
    if(M.meteo){ h+=glf('Estación · presión',hpa(V.est.p,0));
      h+=glf('Estación · aire',celC(V.est.TC,0)+' · '+pcc(V.est.hr*100,0)); }
    if(M.coast) h+=glf('Arrastre medido',nm(V.parPerd,0));
    if(M.rodillo) h+=glf('Patinaje',pcc(V.slip*100,1));
    if(M.repite) h+=glf('5.ª pasada',cvF(retoEv(RETO.falla,{pasada:5}).potCorr));
    if(M.otro) h+=glf('En banco de freno',cvF(retoEv(RETO.falla,{banco:'freno'}).potCorr));
    h+=glf('Instrumentos usados',Object.keys(M).length+' de '+INSTR.length);
    el('tele').innerHTML=h; return;
  }
  const V=EV(), q=veredicto();
  h+=glf('Régimen del pico',rpmT(RPM()));
  h+=glf('Par al cigüeñal',nm(V.parCig));
  h+=glf('Potencia al cigüeñal',kw(V.potCig));
  h+=glf('Lo que lee el banco',kw(V.potLeida));
  if(V.slip>0) h+=glf('Patinaje',pcc(V.slip*100),V.slip>0.05?'bad':(V.slip>0.03?'warn':''));
  if(V.robada>0) h+=glf('Se queda el barrido',pcc(V.robada*100),V.robada>0.05?'warn':'');
  h+=glf('Aire de admisión',celC(V.TAdmC),V.dTsoak>8?'warn':'');
  h+=glf('Presión seca',hpa(V.pd));
  h+=glf('Factor '+NORMAS[G.norma].corto,fac(V.cf),V.fuera?'bad':'');
  h+=glf('PUBLICA',cvF(V.potCorr)+' · '+kw(V.potCorr),'good');
  h+=glf('De verdad da',cvF(V.potRef));
  h+=glf('Se aleja',V.error===null?'—':pccS(V.error*100),
    Math.abs(V.error||0)>0.15?'bad':(Math.abs(V.error||0)>0.05?'warn':'good'));
  h+=glf('Suelo de este banco',V.pisoBanco===null?'—':pccS(V.pisoBanco*100));
  h+=glf('Culpa',ROT_CULPA[V.culpa],V.culpa==='ninguna'?'good':'warn');
  h+=glf('Veredicto',q.rot,q.nivel==='bad'?'bad':(q.nivel==='warn'?'warn':'good'));
  el('tele').innerHTML=h;
}
function pintaInforme(){
  const e=MQ();
  if(!G.simUnlocked){
    el('report').innerHTML='<span class="mono">Faltan '+(PARTS.length-ASM.done.size)+
      ' piezas.</span> Toca una pieza del banco y después su hueco luminoso. '+
      'Sin las seis no hay ensayo, y sin ensayo no hay número que publicar.';
    return;
  }
  if(G.modo==='reto'){
    const W=retoEv(RETO.falla), a=ARQ[RETO.maq];
    let h='<b>'+a.nombre+'</b>, '+BANCOS[RETO.banco].corto+', '+(RETO.marcha+1)+'ª marcha, '+RETO.sitioRot+'. ';
    h+='El cliente dice '+queja(W)+'. ';
    if(RETO.veredicto==='ok') h+='<b class="good">Dictamen correcto:</b> era '+FALLAS[RETO.falla].rot+'.';
    else if(RETO.veredicto==='mal') h+='<b class="bad">No era eso:</b> era '+FALLAS[RETO.falla].rot+'.';
    else h+='Pide instrumentos y dictamina. Ninguno de ellos ve la célula entera.';
    el('report').innerHTML=h; return;
  }
  const V=EV(), N=NORMAS[G.norma];
  let h='';
  if(V.peligro)
    h+='<b class="bad">El coche se está moviendo sobre los rodillos.</b> Antes de discutir ninguna cifra, hay que parar y volver a amarrar.';
  else if(V.fuera)
    h+='<b class="bad">El factor vale '+fac(V.cf)+'</b> y la '+N.corto+' se declara válida sólo entre 0,93 y 1,07. Aquí no se puede corregir a esa norma: lo honrado es publicar la potencia observada y decir dónde se midió.';
  else if(Math.abs(V.error||0)>0.15)
    h+='<b class="bad">El número publicado se aleja '+pccS(V.error*100)+'</b> de lo que este motor da de verdad en las condiciones de la norma, y la culpa es de '+
      (V.culpa==='medida'?'cómo se ha medido':(V.culpa==='cuenta'?'cómo se ha multiplicado después':'las dos cosas'))+'.';
  else if(Math.abs(V.errCuenta||0)>0.05)
    h+='<b class="warn">La fórmula no vale para este motor:</b> la '+N.corto+' pide '+fac(V.cf)+
      ' y este motor merece '+fac(V.cfVerd)+'. El coche se midió bien; lo que está mal es la cuenta de después.';
  else if(Math.abs(V.errMedida||0)>0.03)
    h+='<b class="warn">La corrección es buena y el montaje no:</b> este montaje cuesta '+pccS(V.errMedida*100)+
      ' POR ENCIMA del '+pccS(V.pisoBanco*100)+' que este banco se deja de todas formas.';
  else
    h+='Ensayo limpio: '+kw(V.potLeida)+' leídos, '+kw(V.potPub)+' tras devolver pérdidas, por '+fac(V.cf)+
      ' de la '+N.corto+' salen <b>'+cvF(V.potCorr)+'</b>, y de verdad son '+cvF(V.potRef)+'.';
  el('report').innerHTML=h;
}

function pintaTablero(){
  if(G.modo==='ensamble') vistaEnsamble();
  else if(G.modo==='barrido') vistaBarrido();
  else if(G.modo==='norma') vistaNorma();
  else if(G.modo==='cadena') vistaCadena();
  else if(G.modo==='perdidas') vistaPerdidas();
  else if(G.modo==='censo') vistaCenso();
  else vistaReto();
  btex.needsUpdate=true;
}
function pinta(){ pintaTablero(); pintaTele(); pintaInforme(); syncCtrl(); pintaPregunta(); }
function afterEdit(){ invalida(); pinta(); }
function cambiaMaquina(k){
  if(!ARQ[k]) return;
  G.maq=k; G.resuelto=false; G.rpm=null; G.marcha=null; invalida();
  levantaCelda(); levantaBanco();
  colocaTablero(dims(MQ()));
  if(G.simUnlocked) montaKit(); else initAssembly();
  if(G.modo==='reto') armaReto();
  pintaHUD(); afterEdit(); refrescaPregunta();
  const t=camConjunto(MARGEN[G.modo]||1.00); S.moveTo(t[0],t[1],0.9);
}
const MARGEN={ensamble:0.98, barrido:0.99, norma:0.99, cadena:0.99,
  perdidas:0.99, censo:0.95, reto:0.96};
function setMode(m){
  if(!MODE_META[m]) return;
  if(m!=='ensamble'&&!G.simUnlocked){
    showToast('<b>Primero hay que montar la célula de ensayo.</b> Faltan '+
      (PARTS.length-ASM.done.size)+' piezas.',3000);
    return;
  }
  const entro=(m==='reto'&&G.modo!=='reto');
  G.modo=m;
  if(m==='ensamble'){ if(ASM.done.size<PARTS.length) initAssembly(); }
  else if(ASM.done.size<PARTS.length){ montaKit(); }
  muestraBanco(m==='ensamble'&&ASM.done.size<PARTS.length);
  pintaHUD();
  if(entro) armaReto();
  afterEdit(); refrescaPregunta();
  const t=camConjunto(MARGEN[m]||1.00); S.moveTo(t[0],t[1],0.8);
}

// ============================== T8 · CUESTIONARIO, RECORRIDO Y ARRANQUE
let QCACHE=null, QI=0, QSEL=null;
// Las preguntas se DERIVAN del estado: cambiar de coche, de banco, de norma o
// de sitio las rehace con las cifras nuevas. Ninguna respuesta está escrita a
// mano, y por eso ninguna se puede aprender de memoria.
function preguntas(){
  const e=MQ();
  if(!G.simUnlocked) return [];
  const V=EV(), C=CURVA(), D=DECEL(G.falla), cen=CENSO();
  const S1=SITIO(), N=NORMAS[G.norma];
  const Q=[];
  Q.push({t:'En este sitio la presión es '+hpa(V.pAmb)+' y el vapor de agua se lleva '+hpa(V.pv)+
      '. ¿Qué presión usa la norma para corregir?',
    ops:[[hpa(V.pd)+': la presión de aire SECO, porque el vapor ocupa sitio y no quema',true],
      [hpa(V.pAmb)+': la presión total, que es la que marca el barómetro',false],
      ['La presión de referencia de la norma, '+hpa(N.pRef===null?V.pAmb:N.pRef),false],
      ['La presión de colector del motor',false]]});
  const otro=NORMA_KEYS.filter(k=>k!==G.norma&&k!=='observada')[0];
  const Co=memo('q|'+CFGK()+'|'+otro,()=>curva(e,Object.assign({},PAR(),{falla:G.falla,norma:otro})));
  const Vo=evalua(e,Object.assign({},PAR(),{falla:G.falla,norma:otro,rpm:Co.corrMax.rpm}));
  Q.push({t:'El mismo coche, el mismo día y la misma pasada dan '+cvF(V.potCorr)+' con la '+
      N.corto+' y '+cvF(Vo.potCorr)+' con la '+NORMAS[otro].corto+'. ¿Cuál es el bueno?',
    ops:[['Los dos, y ninguno vale sin decir con qué norma se ha corregido',true],
      ['El más alto, porque es el que el motor puede dar',false],
      ['El más bajo, porque es el conservador',false],
      ['El de la SAE, porque es la norma más usada',false]]});
  Q.push({t:'La SAE J1349 no corrige con un cociente de densidades: usa 1,18·D − 0,18. ¿De dónde salen esos dos números?',
    ops:[['De suponer 85 % de rendimiento mecánico: es la recta tangente a 0,85·D/(1 − 0,15·D) en D = 1',true],
      ['De un ajuste estadístico sobre miles de ensayos',false],
      ['De la diferencia entre potencia bruta y potencia neta',false],
      ['De la corrección de humedad de la propia norma',false]]});
  const cvv=V.cfVerd;
  Q.push({t:'Aquí la '+N.corto+' pide un factor de '+fac(V.cf)+' y este motor merece '+fac(cvv)+
      '. ¿Por qué se parecen tan poco?' ,
    ops:[e.sobrealimentado
        ? ['Porque está sobrealimentado: sostiene la presión ABSOLUTA de colector y no pierde lo que la fórmula supone',true]
        : ['Porque el factor está fuera del intervalo 0,93–1,07 y la fórmula ya no se parece a la curva',true],
      ['Porque la estación mide mal la humedad',false],
      ['Porque el banco de rodillos no mide el par real',false],
      ['Porque la norma corrige la potencia bruta y no la neta',false]]});
  if(D) Q.push({t:'A lo largo de esta pasada, las pérdidas de transmisión van del '+
      pcc(D.fracMin*100)+' al '+pcc(D.fracMax*100)+' de la potencia. ¿Qué le pasa entonces a la regla del 15 %?',
    ops:[['Que no puede ser cierta en los dos extremos de una misma pasada, y menos en dos coches distintos',true],
      ['Que es válida porque el 15 % cae dentro de ese rango',false],
      ['Que hay que aplicarla sólo en el pico de potencia',false],
      ['Que sólo falla en los coches de tracción trasera',false]]});
  if(BANCOS[G.banco].inercia){
    const m0=0, m1=e.relaciones.length-1;
    const f0=fraccionRobada(e,m0,G.banco), f1=fraccionRobada(e,m1,G.banco);
    Q.push({t:'En este banco de inercia, la primera marcha se queda el '+pcc(f0*100)+
        ' de la potencia y la última el '+pcc(f1*100)+'. ¿Por qué?',
      ops:[['Porque la inercia del rodillo referida al cigüeñal crece con el cuadrado de la marcha, y en corta el motor gasta más en acelerarse a sí mismo',true],
        ['Porque en primera el neumático patina más',false],
        ['Porque en primera el motor se calienta más',false],
        ['Porque en marchas largas el rodillo gira más deprisa y mide mejor',false]]});
  }
  Q.push({t:'De las '+cen.total+' casillas del censo, '+cen.porCuenta+' tienen la culpa en la cuenta y '+
      cen.porMedida+' en la medida. ¿Qué dice eso?',
    ops:[['Que a partir de cierta altitud da igual lo bien montado que esté el banco: lo que estropea el número es la fórmula',true],
      ['Que los bancos de rodillos están mal calibrados',false],
      ['Que hay que medir siempre al nivel del mar',false],
      ['Que la norma corrige de más en todos los casos',false]]});
  return Q;
}
function bancoQ(){
  if(!QCACHE){ QCACHE=preguntas();
    QCACHE.forEach(q=>{ q.baraja=barajaEn(q.ops.map(o=>({o:o}))); }); }
  return QCACHE;
}
function refrescaPregunta(){ QCACHE=null; QI=0; QSEL=null; pintaPregunta(); }
function pintaPregunta(){
  // Sin célula montada NO hay preguntas, y el banco en caché no se entera: al
  // desmontar, `pinta()` volvería a pintar las preguntas del ensayo que acaba de
  // desaparecer. La condición de verdad es el mode-lock.
  const B=G.simUnlocked?bancoQ():[];
  if(!B.length){ el('quiz').innerHTML=
    '<div class="lt">Las preguntas se abren cuando la célula de ensayo está montada.</div>'; return; }
  const q=B[QI%B.length];
  let h='<div class="lt">Pregunta '+((QI%B.length)+1)+' de '+B.length+'</div>';
  h+='<div class="console">'+q.t+'</div>';
  h+='<div class="btns">'+q.baraja.map((b,i)=>{
    const bien=b.o[1];
    const cls=QSEL===null?'':(bien?' right':(i===QSEL?' wrong':''));
    return '<button class="b dx'+cls+'" data-q="'+i+'">'+b.o[0]+'</button>';
  }).join('')+'</div>';
  h+='<div class="modebar" style="margin-top:8px"><button class="b" data-qnext="1">Siguiente pregunta</button></div>';
  el('quiz').innerHTML=h;
}
function pregunta(i){
  const B=bancoQ(); if(!B.length) return;
  const q=B[QI%B.length];
  if(QSEL!==null) return;
  QSEL=i;
  synth.beep(q.baraja[i].o[1]?700:210,0.10,0.06);
  pintaPregunta();
}
function pistaReto(){
  const no=INSTR.filter(i=>!RETO.medido[i.k]);
  if(!no.length){ showToast('Ya has usado los seis instrumentos. Ahora toca decidir.',3000); return; }
  showToast('<b>Prueba con:</b> '+no[0].rot+'<br>'+no[0].nota,4600);
}
function otroMotor(){ armaReto(); afterEdit(); refrescaPregunta();
  showToast('<b>Otro caso.</b> Otro coche, otro sitio y otra norma.',3000); }

// ------------------------------------------------------------ recorrido guiado
let AUTO=null;
function paraAuto(){ if(AUTO){ clearTimeout(AUTO); AUTO=null; }
  const b=el('btnAuto'); if(b) b.disabled=false; }
function runAuto(){
  paraAuto();
  el('btnAuto').disabled=true;
  const pasos=[];
  let espera=3900;
  if(ASM.done.size<PARTS.length){
    pasos.push(()=>{ setMode('ensamble');
      showToast('<b>1 · La célula.</b> Rodillos, amarres, captador, ventilador, estación y extracción. Ninguna mide el motor; las seis hacen que la medida signifique algo.',3400); });
    pasos.push(()=>{ autoAssemble(); });
    espera=PARTS.length*640+1800;
  }
  const resto=[
    ()=>{ G.maq='na16'; G.falla='sano'; G.sitio='mar25'; G.banco='inercia';
      G.norma='j1349'; G.perdidas='coastdown'; G.marcha=null; G.pasada=1;
      cambiaMaquina('na16'); setMode('barrido');
      showToast('<b>La pasada</b><br>Cuatro curvas y las cuatro se llaman potencia. La gris es lo único que el banco ha medido; la verde, la verdad.',4400); },
    ()=>{ setMode('cadena');
      showToast('<b>Dónde se pierde</b><br>Escalón a escalón. Fíjate en el patinaje y en lo que el barrido se queda: no los recupera ningún método de pérdidas.',4600); },
    ()=>{ setMode('perdidas');
      showToast('<b>La regla del 15 %</b><br>La pérdida real cambia a lo largo de la propia pasada. Y mira la tabla de las marchas: la misma pasada en primera y en última no da lo mismo.',4800); },
    ()=>{ G.marcha=0; afterEdit(); refrescaPregunta();
      showToast('<b>En primera</b><br>El motor se gasta en acelerar su propio volante una parte de la potencia que nunca llega al rodillo.',4400); },
    ()=>{ G.marcha=null; setMode('norma');
      showToast('<b>Cinco convenios</b><br>La franja verde es el intervalo en el que las normas modernas se declaran válidas. La línea verde es el factor que este motor MERECE.',4800); },
    ()=>{ G.sitio='toluca'; afterEdit(); refrescaPregunta();
      showToast('<b>En Toluca</b><br>El factor se va muy por encima de 1,07. La norma lo dice: fuera de ahí no se corrige. Aun así, para un atmosférico la fórmula sigue acertando.',4800); },
    ()=>{ G.maq='turbo14'; cambiaMaquina('turbo14'); G.sitio='toluca'; setMode('norma');
      afterEdit(); refrescaPregunta();
      showToast('<b>Y ahora un turbo</b><br>Aquí se rompe. Un turbo sostiene la presión absoluta de colector y apenas pierde nada, pero la fórmula le aplica el factor de un atmosférico.',5200); },
    ()=>{ G.falla='sinEstacion'; afterEdit(); refrescaPregunta(); setMode('cadena');
      showToast('<b>Con la estación averiada</b><br>Compara el error con el de antes. La avería publica un número MEJOR, porque no corregir se parece más a la verdad que corregir mal.',5200); },
    ()=>{ G.falla='sano'; afterEdit(); setMode('censo');
      showToast('<b>Cuarenta y cinco casillas</b><br>Naranja: lo midió mal. Violeta: lo multiplicó mal. Mira cómo la respuesta cambia de columna a columna y no de fila a fila.',5000); },
    ()=>{ setMode('reto');
      showToast('<b>Ahora tú</b><br>Llega una hoja y no cuadra. Seis instrumentos, y dos montajes que sólo se separan cambiando de máquina.',4200); },
  ];
  const todos=pasos.concat(resto);
  let i=0;
  const tic=()=>{ if(i>=todos.length){ paraAuto(); return; }
    const primera=(i===0&&pasos.length>0);
    todos[i++]();
    AUTO=setTimeout(tic, (i===2&&pasos.length>0)?espera:(primera?1200:4100)); };
  tic();
}

// ------------------------------------------------------------------- sucesos
// Un ÚNICO despachador delegado. Nada de onclick en el HTML generado: el cuerpo
// del laboratorio va dentro de un <script type="module"> y sus funciones no
// existen en el ámbito global, así que un onclick inline no encuentra nada.
document.addEventListener('click',ev=>{
  const b=ev.target.closest('button'); if(!b||b.disabled) return;
  const id=b.id;
  if(id==='btnAuto'){ runAuto(); return; }
  if(id==='btnPista'){ pistaReto(); return; }
  if(id==='btnEntrega'){ entregaConAviso(); return; }
  if(id==='btnOtro'){ otroMotor(); return; }
  if(id==='btnMonta'){ paraAuto(); autoAssemble(); return; }
  if(id==='btnDesmonta'){ paraAuto(); initAssembly(); afterEdit(); return; }
  if(b.dataset.mode){ paraAuto(); setMode(b.dataset.mode); return; }
  if(b.dataset.maq){ paraAuto(); cambiaMaquina(b.dataset.maq); return; }
  if(b.dataset.banco){ paraAuto(); G.banco=b.dataset.banco; G.resuelto=false;
    afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.norma){ paraAuto(); G.norma=b.dataset.norma; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.perd){ paraAuto(); G.perdidas=b.dataset.perd; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.marcha){ paraAuto(); G.marcha=Number(b.dataset.marcha); afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.sitio){ paraAuto(); G.sitio=b.dataset.sitio; afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.pasada){ paraAuto(); G.pasada=Number(b.dataset.pasada); afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.falla){ paraAuto(); G.falla=b.dataset.falla; G.resuelto=false;
    afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.inst){ paraAuto(); mide(b.dataset.inst); return; }
  if(b.dataset.dx){ eligeFalla(b.dataset.dx); return; }
  if(b.dataset.q!==undefined){ pregunta(Number(b.dataset.q)); return; }
  if(b.dataset.qnext){ QI++; QSEL=null; pintaPregunta(); return; }
});
function entregaConAviso(){
  if(!RETO.elegido){
    showToast('<b>Elige primero qué está mal montado</b><br>El dictamen es la parte que se corrige.',3200);
    return;
  }
  if(!Object.keys(RETO.medido).length){
    showToast('<b>Todavía no has medido nada</b><br>Pide al menos un instrumento antes de dictaminar.',3400);
    return;
  }
  entrega();
}
document.addEventListener('keydown',ev=>{
  if(ev.target&&/^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return;
  const i=Number(ev.key);
  if(i>=1&&i<=MODES.length){ paraAuto(); setMode(MODES[i-1]); }
});

// ------------------------------------------------------------------- el puente
function reporta(){
  if(typeof window.__labReporta==='function'){
    try{ window.__labReporta({resuelto:G.resuelto}); }catch(e){}
  }
}
setInterval(reporta,4000);

// ------------------------------------------------------------------- depuración
let PINTADAS=0;
window.__labDebug={
  get mode(){ return G.modo; },
  get solved(){ return G.resuelto; },
  get maquina(){ return G.maq; },
  get falla(){ return G.falla; },
  get simUnlocked(){ return G.simUnlocked; },
  get montadas(){ return ASM.done.size; },
  get piezas(){ return PARTS.length; },
  get frames(){ return PINTADAS; },
  get cfg(){ return {maq:G.maq, banco:G.banco, norma:G.norma, perdidas:G.perdidas,
    marcha:MARCHA(), pasada:G.pasada, sitio:G.sitio, falla:G.falla, rpm:RPM()}; },
  get maq(){ const e=MQ(); return {key:e.key, corto:e.corto, nombre:e.nombre,
    cilindrada:e.cilindrada, cil:e.cil, diesel:e.diesel, sobrealimentado:e.sobrealimentado,
    parIndMax:e.parIndMax, parFric0:e.parFric0, kCurva:e.kCurva,
    rpmRal:e.rpmRal, rpmPar:e.rpmPar, rpmMax:e.rpmMax,
    masa:e.masa, rRueda:e.rRueda, jRuedas:e.jRuedas, jMotor:e.jMotor,
    relaciones:e.relaciones.slice(), grupo:e.grupo, marchaTipica:e.marchaTipica,
    perdSeca:e.perdSeca, perdVisc:e.perdVisc, slipBase:e.slipBase,
    parRuedaRef:e.parRuedaRef, dTPasada:e.dTPasada, qc:e.qc}; },
  lect(f,rpm){
    const V=EV_DE(f,rpm);
    return {pAmb:V.pAmb, pv:V.pv, pd:V.pd, rho:V.rho, TAdmC:V.TAdmC, dTsoak:V.dTsoak,
      est:{p:V.est.p,TC:V.est.TC,hr:V.est.hr,veraz:V.est.veraz},
      parCig:V.parCig, potCig:V.potCig, parRueda:V.parRueda, parPerd:V.parPerd,
      slip:V.slip, robada:V.robada, potLeida:V.potLeida, devuelto:V.devuelto,
      potPub:V.potPub, cf:V.cf, D:V.D, cf85:V.cf85, cfDie:V.cfDie, fuera:V.fuera,
      potCorr:V.potCorr, potRef:V.potRef, cfVerd:V.cfVerd, error:V.error,
      errMedida:V.errMedida, errCuenta:V.errCuenta, pisoBanco:V.pisoBanco, culpa:V.culpa,
      rpmHoja:V.rpmHoja, parHoja:V.parHoja, rpmImposible:V.rpmImposible,
      peligro:V.peligro, avisos:V.avisos.slice(), hay:V.hay};
  },
  curva(f){ const C=CURVA(f);
    return {n:C.pts.length, parMax:{par:C.parMax.parCig,rpm:C.parMax.rpm},
      potMax:{pot:C.potMax.potCig,rpm:C.potMax.rpm},
      corrMax:{pot:C.corrMax.potCorr,rpm:C.corrMax.rpm,error:C.corrMax.error},
      refMax:{pot:C.refMax.potRef,rpm:C.refMax.rpm},
      pts:C.pts.map(p=>({rpm:p.rpm,rpmHoja:p.rpmHoja,parCig:p.parCig,potCig:p.potCig,
        potLeida:p.potLeida,potPub:p.potPub,potCorr:p.potCorr,potRef:p.potRef,
        parHoja:p.parHoja,error:p.error}))}; },
  decel(f){ const D=DECEL(f); if(!D) return null;
    return {n:D.pts.length, fracMin:D.fracMin, fracMax:D.fracMax, jEnRueda:D.jEnRueda,
      pts:D.pts.map(p=>({rpm:p.rpm,par:p.par,potPerd:p.potPerd,frac:p.frac,decel:p.decel}))}; },
  censo(){ const C=CENSO();
    return {total:C.total, mudo:C.mudo, conAviso:C.conAviso, porCuenta:C.porCuenta,
      porMedida:C.porMedida, peligro:C.peligro, fuera:C.fuera, piso:C.piso.slice(),
      filas:C.filas.map(f=>({falla:f.falla, mudo:f.mudo,
        celdas:f.celdas.map(c=>({sitio:c.sitio, error:c.error, errMedida:c.errMedida,
          errCuenta:c.errCuenta, piso:c.piso, culpa:c.culpa, fuera:c.fuera, peligro:c.peligro,
          avisos:c.avisos}))}))}; },
  factores(alt,TC,hr){
    const p=presionISA(alt===undefined?0:alt);
    const t=(TC===undefined)?25:TC, h=(hr===undefined)?0.4:hr;
    const pd=presionSeca(p,t,h), T=t+273.15;
    const out={};
    for(const k of NORMA_KEYS) out[k]=NORMAS[k].cf(pd,T);
    out.modelo85=cfModelo85((99000/pd)*Math.sqrt(T/298.15));
    out.D=(99000/pd)*Math.sqrt(T/298.15);
    out.pd=pd; out.p=p;
    out.verdadero=cfVerdadero(MQ(),RPM(),pd,T,99000,298.15);
    return out;
  },
  // Lo que las chapas de la célula DICEN: de una textura no se lee texto, y el
  // 3D también puede regalar la respuesta de un reto a ciegas.
  get rotulos(){ return PARTS.map(p=>p.rot).concat(['rodillos','amarres','estación',
    'ventilador','captador de vueltas','extracción']); },
  get retoCfg(){ return {falla:RETO.falla, maq:RETO.maq, sitio:RETO.sitio,
    norma:RETO.norma, banco:RETO.banco, marcha:RETO.marcha, pasada:RETO.pasada,
    medido:Object.keys(RETO.medido), elegido:RETO.elegido, veredicto:RETO.veredicto,
    vivas:FALLA_KEYS.filter(compatible)}; },
  mide(k){ mide(k); },
  elige(k){ eligeFalla(k); },
  entrega(){ entrega(); return RETO.veredicto==='ok'; },
  armaCaso(falla,o){ o=o||{};
    RETO.falla=falla;
    if(o.maq&&ARQ[o.maq]) RETO.maq=o.maq;
    if(o.sitio){ const S1=ESCENARIOS.find(E=>E.k===o.sitio);
      if(S1){ RETO.sitio=S1.k; RETO.sitioRot=S1.rot; } }
    if(o.norma&&NORMAS[o.norma]) RETO.norma=o.norma;
    if(o.banco&&BANCOS[o.banco]) RETO.banco=o.banco;
    if(o.marcha!==undefined) RETO.marcha=Math.min(o.marcha,ARQ[RETO.maq].relaciones.length-1);
    RETO.marcha=Math.min(RETO.marcha,ARQ[RETO.maq].relaciones.length-1);
    RETO.medido={}; RETO.elegido=null; RETO.veredicto=null;
    invalida(); pinta(); refrescaPregunta(); },
  monta(){ autoAssemble(); },
  // Los mandos. Hacen EXACTAMENTE lo que hace un dedo sobre la barra de vistas:
  // si se saltaran `setMode`, la Capa 2 estaría probando un camino que ningún
  // alumno recorre.
  setMode(m){ setMode(m); },
  setMaq(k){ cambiaMaquina(k); },
  setFalla(f){ if(!FALLAS[f]) return false; G.falla=f; G.resuelto=false;
    afterEdit(); refrescaPregunta(); return true; },
  setCfg(o){ o=o||{};
    if(o.banco&&BANCOS[o.banco]) G.banco=o.banco;
    if(o.norma&&NORMAS[o.norma]) G.norma=o.norma;
    if(o.perdidas&&PERDIDAS[o.perdidas]) G.perdidas=o.perdidas;
    if(o.marcha!==undefined) G.marcha=o.marcha===null?null:Number(o.marcha);
    if(o.pasada!==undefined) G.pasada=Number(o.pasada);
    if(o.sitio&&ESCENARIOS.some(E=>E.k===o.sitio)) G.sitio=o.sitio;
    if(o.rpm!==undefined) G.rpm=o.rpm===null?null:Number(o.rpm);
    afterEdit(); refrescaPregunta(); },
  desmonta(){ initAssembly(); afterEdit(); },
  get K(){ return {MODES:MODES.slice(), FALLAS:FALLA_KEYS.slice(),
    ARQ:ARQ_KEYS.slice(), PIEZAS:ORDEN.slice(), INSTR:INSTR.map(i=>i.k),
    NORMAS:NORMA_KEYS.slice(), BANCOS:BANCO_KEYS.slice(), PERDIDAS:PERD_KEYS.slice(),
    SITIOS:ESC_KEYS.slice(), LIM:LIM_NORMA.slice(),
    ROT:FALLA_KEYS.map(k=>FALLAS[k].corto), ROT_LARGO:FALLA_KEYS.map(k=>FALLAS[k].rot)}; },
  get panel(){ return {ctrl:(el('ctrl')||{}).textContent||'',
    tele:(el('tele')||{}).textContent||'',
    report:(el('report')||{}).textContent||'',
    quiz:(el('quiz')||{}).textContent||'',
    hud:(el('hud')||{}).textContent||''}; },
  get toastOpacidad(){ const t=el('toast');
    return t?Number(getComputedStyle(t).opacity):0; },
  // Caza mallas cuyo material no sea un material de verdad: three se las salta
  // EN SILENCIO y la pieza no existe en pantalla sin que salte ningún error.
  get materialesFalsos(){
    const malas=[];
    scene.traverse(o=>{ if(o.isMesh&&(!o.material||o.material.isMaterial!==true))
      malas.push(o.type+':'+(o.name||'?')); });
    return malas;
  },
  get tableroPNG(){ return bcv.toDataURL('image/png'); },
  get anchoTableroPx(){
    const c=S.camera, r=S.renderer.domElement.getBoundingClientRect();
    const m=new THREE.Vector3(BW3/2,BY3,0.06).applyMatrix4(board.matrixWorld).project(c);
    const q=new THREE.Vector3(-BW3/2,BY3,0.06).applyMatrix4(board.matrixWorld).project(c);
    return Math.abs(m.x-q.x)/2*r.width;
  },
};

// ------------------------------------------------------------------- arranque
levantaCelda();
levantaBanco();
colocaTablero(dims(MQ()));
initAssembly();
pintaHUD();
pinta();
refrescaPregunta();
S.setAnimate(dt=>{ PINTADAS++; anima(dt); });
S.start();
{ const t=camConjunto(MARGEN.ensamble); S.moveTo(t[0],t[1],0.01); }
addEventListener('resize',()=>{ S.resize();
  const t=camConjunto(MARGEN[G.modo]||1.00); S.moveTo(t[0],t[1],0.4); });
