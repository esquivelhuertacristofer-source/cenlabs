// ============================================================
//   LAB — d6-A1 · ARRANQUE: DIAGNÓSTICO POR CAÍDAS DE TENSIÓN
// ============================================================
const mount=document.getElementById('stage');
// Estas cifras sólo valen para el primer fotograma: en cuanto la escena arranca
// el encuadre se CALCULA, porque depende del tamaño del vano y de la forma de la
// ventana y no puede estar escrito a mano.
const S=createStage(mount,{cam:[7.2,4.4,10.6],target:[0.4,1.85,0.20],
  bgTop:'#151b23',bgBot:'#05070b',bloom:0.26,minD:2.6,maxD:42});
const {scene}=S;
const synth=makeSynth({type:'sawtooth',type2:'sine',filterFreq:760,Q:0.60});
// `clamp` y `barajaEn` NO se declaran aquí: los declara el motor sellado que se
// empalma justo debajo, y declararlos dos veces es un SyntaxError que mata la
// página entera antes de que exista window.__labDebug.

// Los colores del laboratorio. El cobre es el hilo conductor de la vista de
// tramos y el rojo/verde se reservan para el veredicto, no para adornar.
const el=id=>document.getElementById(id);
const TINTA='#e8eef6', CIAN='#5ad1e6', OK_HEX='#7cd992', WARN_HEX='#e9c46a',
      BAD_HEX='#ff6b6b', GRIS='#7b8697', VIO='#b48ce0', NARANJA='#f0a05a',
      AZUL='#6ea8fe', ROSA='#f28dbb', COBRE='#d08b5b';

// ============================================================================
//  d6-A1 · ARRANQUE: CAÍDAS DE TENSIÓN — MOTOR SELLADO
//
//  QUÉ SE MIDE
//  Un coche que no arranca. El voltímetro entre bornes de batería marca 12,5 V
//  y todo el mundo cambia el motor de arranque. Aquí se mide otra cosa: cuánto
//  de esos voltios LLEGA al inducido mientras pasan trescientos amperios, y por
//  dónde se ha quedado el resto.
//
//  LA TESIS. La tensión en reposo no diagnostica nada. Un borne oxidado, una
//  masa floja, unos contactos picados y un cable corto de sección dan LOS MISMOS
//  12,5 V en reposo que un coche sano, y los mismos que una batería sulfatada.
//  Lo único que los separa es medir la caída de cada TRAMO con el motor girando.
//
//  CÓMO SE RESUELVE
//  · La batería no se tabula: se ancla a su CCA de etiqueta. La norma SAE J537
//    define el CCA como la corriente que la batería sostiene treinta segundos a
//    −18 °C sin bajar de 7,2 V, así que de esa definición SALE la resistencia
//    interna, en vez de inventarla. Después esa resistencia se mueve con el
//    estado de carga y con la temperatura.
//  · El circuito es una cadena de seis tramos con su resistencia cada uno, y los
//    cables se calculan con la resistividad del cobre por su longitud y su
//    sección, corregida por temperatura (α = 0,00393/K).
//  · El motor de arranque es de imanes con reductor: par proporcional a la
//    corriente y fuerza contraelectromotriz proporcional al régimen.
//  · El punto de funcionamiento NO se declara: se busca. El par que da el
//    arranque baja con el régimen y el par que pide el motor térmico sube con
//    él; donde se cruzan está el régimen de arrastre, y se encuentra por
//    bisección. Cambiar una resistencia mueve el cruce entero.
//  · El motor térmico se resiste con la compresión de sus cilindros y con la
//    fricción de un aceite que a −18 °C es otro aceite.
//
//  QUÉ NO MODELA. El transitorio de los primeros milisegundos —el pico de rotor
//  bloqueado— más allá de su valor; el rizado del par cilindro a cilindro dentro
//  de una vuelta; el desgaste del piñón y el bendix; el circuito de mando
//  (llave, relé, inmovilizador) más allá de si cierra o no; la carga de la
//  batería por el alternador, que es el d6-A2.
//
//  FUENTES
//  · SAE J537 — Storage Batteries: definición de CCA y del ensayo de arranque
//    en frío (30 s a −18 °C sin bajar de 7,2 V).
//  · SAE J541 — Voltage Drop for Starting Motor Circuits.
//  · SAE J1127 / J1128 — cables de batería y de baja tensión, secciones y
//    resistencias por metro.
//  · Bosch, «Automotive Handbook» — sistema de arranque, motores de imanes con
//    reductor, curvas par-corriente-régimen.
//  · Bosch, «Automotive Electrics and Automotive Electronics» — baterías de
//    plomo-ácido, resistencia interna y comportamiento en frío.
//  · Heywood, «Internal Combustion Engine Fundamentals», cap. 13 — fricción
//    mecánica y par de arrastre.
//  · Denton, T., «Automobile Electrical and Electronic Systems» — el
//    procedimiento de caídas de tensión tramo a tramo.
// ============================================================================

// El kit de la escena NO trae `clamp` ni `barajaEn`: viven por debajo del
// marcador del donante y el ensamblador los recorta con el laboratorio anterior.
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// El separador decimal del español es la COMA, y `toFixed` escribe un punto.
// Lo usan las cadenas que el motor redacta para que las lea una persona —los
// avisos del ensayo y las lecturas de los instrumentos del reto—, que acaban en
// pantalla al lado de cifras que sí van con coma.
const dec = (x, d) => x.toFixed(d).replace('.', ',');
function barajaEn(a){
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));
    const t=a[i]; a[i]=a[j]; a[j]=t; }
  return a;
}

// ============================================================================
//  §1 · LA BATERÍA
//  Una batería de plomo-ácido es seis vasos de dos voltios y pico en serie. Su
//  tensión en circuito abierto dice el estado de carga y NO dice nada del
//  estado de salud; lo que dice la salud es la resistencia interna, y ésa sólo
//  se ve cuando circula corriente.
// ============================================================================
const VASOS=6;
/** Tensión de vaso en circuito abierto por estado de carga. V. */
function tensionVaso(soc){ return 1.950 + 0.150*clamp(soc,0,1); }
// Coeficiente termodinámico de la tensión en circuito abierto: +0,21 mV por vaso
// y grado. Se deja escrito porque es DESPRECIABLE, y eso es justo la lección: de
// 25 °C a −18 °C la batería pierde 57 milivoltios en la pantalla del
// voltímetro y la mitad de su capacidad de arranque. Marca bien y no arranca.
const DVDT_VASO=0.00021;   // V/(vaso·K)
/** Tensión en circuito abierto de la batería. Un vaso en corto se lleva su
 *  aportación entera, y ésa sí se ve sin arrancar. V. */
function tensionAbierta(bat, soc, TC){
  const vasos=VASOS-(bat.vasosMuertos||0);
  return vasos*(tensionVaso(soc) + DVDT_VASO*(TC-25));
}
/** Cuánto crece la resistencia interna al enfriarse. A −18 °C se DOBLA: el
 *  electrolito conduce peor y la reacción va más lenta.
 *
 *  Va con la forma de Arrhenius de la conductividad y no con una recta. Una
 *  recta ajustada al mismo punto valdría 0,20 con el vano motor a 60 °C y se
 *  haría NEGATIVA por encima de 68: resistencia interna negativa. Nunca habría
 *  saltado con los cinco escenarios de este laboratorio, y por eso mismo no
 *  puede quedarse. Adimensional. */
const K_ARRHENIUS=1218;   // K, ajustada para que factorFrio(−18) = 2,0
function factorFrio(TC){
  const T=Math.max(-40,TC)+273.15;
  return Math.exp(K_ARRHENIUS*(1/T - 1/298.15));
}
/** Y cuánto crece al descargarse: menos ácido activo, más resistencia. */
function factorCarga(soc){ return 1 + 0.35*(1/Math.max(0.15,clamp(soc,0,1)) - 1); }
/** Resistencia interna de referencia, DEDUCIDA del CCA de la etiqueta.
 *
 *  La SAE J537 define el CCA como la corriente que la batería sostiene 30 s a
 *  −18 °C sin que la tensión baje de 7,2 V. Con eso, la resistencia interna a
 *  −18 °C y plena carga vale (E0 − 7,2)/CCA, y de ahí se retrocede al valor de
 *  referencia a 25 °C. Así el número no se inventa: sale de la norma. Ω. */
const POLARIZA=1.18;   // lo que crece la resistencia efectiva en 30 s de descarga
const T_CCA=-18;       // °C, la temperatura del ensayo de la SAE J537
const V_CCA=7.2;       // V, el suelo que la norma no deja pasar en 30 s
function riReferencia(bat){
  // Batería SANA y a plena carga: así es como se ensaya el CCA de la etiqueta.
  const E0=VASOS*(tensionVaso(1) + DVDT_VASO*(T_CCA-25));
  return (E0-V_CCA)/(bat.cca*factorFrio(T_CCA)*POLARIZA);
}
/** Resistencia interna en las condiciones del ensayo. Ω. */
function resistenciaInterna(bat, soc, TC){
  return riReferencia(bat)*factorFrio(TC)*factorCarga(soc)*(bat.saludRi||1);
}
/** El CCA que esta batería daría HOY, con su estado y su salud. A. */
function ccaReal(bat, soc){
  const E0=tensionAbierta(bat,soc,T_CCA);
  const Ri=resistenciaInterna(bat,soc,T_CCA)*POLARIZA;
  return Math.max(0,(E0-V_CCA)/Ri);
}

// ============================================================================
//  §2 · EL CIRCUITO, TRAMO A TRAMO
//  Seis tramos entre el borne positivo y la carcasa del arranque. Cada uno tiene
//  su resistencia y su caída, y la suma de las seis es lo que el inducido NO
//  recibe. La regla de oficio dice ≤ 0,2 V por conexión, ≤ 0,5 V en todo el
//  positivo y ≤ 0,2 V en toda la masa, con el motor girando.
// ============================================================================
const RHO_CU=1.724e-8;   // Ω·m a 20 °C
const ALFA_CU=0.00393;   // 1/K
/** Resistencia de un cable de cobre. Ω. */
function resistenciaCable(largo, seccionMM2, TC){
  return RHO_CU*largo/(seccionMM2*1e-6)*(1+ALFA_CU*(TC-20));
}
// EL INDUCIDO NO ESTÁ EN ESTA LISTA, y no es un olvido. Un procedimiento de
// caídas de tensión mide CONEXIONES, no motores: el inducido es la carga, y su
// caída se publica aparte. Ponerlo aquí lo convertía en «el peor tramo» de todos
// los ensayos —su resistencia es la mayor con diferencia— y tapaba a los demás.
// El precio de dejarlo fuera es la lección más fina del laboratorio: unas
// escobillas gastadas son la única avería que este procedimiento NO localiza.
const TRAMOS=[
  {k:'bornePos', rot:'Borne positivo',        nota:'De la placa de plomo a la mordaza del cable.', masa:false, conexion:true},
  {k:'cablePos', rot:'Cable positivo',        nota:'De la batería al solenoide.',                  masa:false, conexion:false},
  {k:'solenoide',rot:'Contactos del solenoide',nota:'El disco de cobre que cierra los 300 A.',     masa:false, conexion:true},
  {k:'masaMotor',rot:'Masa del arranque',     nota:'De la carcasa al bloque, por los tornillos.',  masa:true,  conexion:true},
  {k:'masaChasis',rot:'Trenza de masa',       nota:'Del bloque al chasis y del chasis a la batería.',masa:true,  conexion:false},
];
const TRAMO_KEYS=TRAMOS.map(t=>t.k);

// ============================================================================
//  §3 · EL MOTOR DE ARRANQUE
//  De imanes permanentes con reductor planetario, que es lo que lleva hoy casi
//  todo. Dos constantes lo describen: el par por amperio y la fuerza
//  contraelectromotriz por radián por segundo. En unidades del SI son EL MISMO
//  NÚMERO, y eso no es una coincidencia: es la conservación de la energía.
// ============================================================================
// La escala de un arranque no la fija el par por amperio ni la reducción por
// separado: la fija su PRODUCTO. Ese producto decide a la vez las dos cifras que
// se miden en un banco de arranques —el régimen de vacío, donde la fuerza
// contraelectromotriz iguala a la batería, y el par de rotor bloqueado—, y aquí
// está elegido para que caigan donde caen de verdad: unas 290 rpm de cigüeñal
// en vacío y unos 270 N·m con el rotor parado.
const ARRANQUE={
  kT:0.00720,       // N·m/A en el eje del inducido — y V·s/rad de fcem
  Ri:0.01100,       // Ω, inducido y escobillas: ~750 A con el rotor bloqueado
  iPlanet:4.00,     // reductor planetario
  iPinon:14.40,     // piñón de 9 dientes sobre corona de 130
  rend:0.86,        // rendimiento del tren de engranes
  parVacio:0.030,   // N·m, lo que el propio arranque se come girando en vacío
};
/** Relación total del arranque al cigüeñal. */
const RELACION=ARRANQUE.iPlanet*ARRANQUE.iPinon;

// ============================================================================
//  §4 · LO QUE EL MOTOR TÉRMICO OPONE
//  Arrastrar un motor parado cuesta dos cosas muy distintas: comprimir el aire
//  de los cilindros —que devuelve casi todo en la expansión, pero no todo— y
//  vencer la fricción de un aceite que en frío es otro aceite. La segunda es la
//  que manda a −18 °C, y por eso el mismo coche arranca en agosto y no en enero.
// ============================================================================
/** Viscosidad del aceite frente a la que tiene UN 5W-30 A 20 °C. Dos números
 *  la describen, y hacen falta los dos:
 *
 *   · `k20` es lo espeso que está ese grado a 20 °C. Sale del segundo número
 *     del grado SAE, que es la viscosidad en caliente, y no vale 1 para todos:
 *     un 15W-40 a 20 °C es del orden de vez y media más espeso que un 5W-30.
 *   · `B` es la pendiente de Arrhenius, que es lo que dice el PRIMER número
 *     —el del invierno— y lo que manda a veinte bajo cero.
 *
 *  Con `k20` fijo en 1 para los tres, los tres aceites daban exactamente las
 *  mismas rpm a 20 °C: el mando existía y no cambiaba nada, que es peor que no
 *  tenerlo. Adimensional, referida al 5W-30 a 20 °C. */
function viscosidadRel(aceite, TC){
  const T=Math.max(-40,TC)+273.15;
  return aceite.k20*Math.exp(aceite.B*(1/T - 1/293.15));
}
/** Par medio de compresión. No es el par de pico de un cilindro: es la media
 *  sobre el ciclo, y lo que queda después de que la expansión devuelva trabajo.
 *  Depende del sellado, y por eso un motor con las válvulas quemadas arranca
 *  MÁS FÁCIL —y no arranca igual. N·m. */
function parCompresion(mot, sellado){
  return mot.parCompRef*clamp(sellado===undefined?1:sellado,0,1.4);
}
/** Par de fricción de arrastre. Una parte seca, que no depende del régimen, y
 *  una viscosa que sí, las dos multiplicadas por lo espeso que esté el aceite. */
function parFriccion(mot, aceite, TC, rpm){
  const v=viscosidadRel(aceite,TC);
  // El exponente NO es 1: sólo una parte de la fricción de arrastre es viscosa.
  // La otra es rozamiento seco de los segmentos contra la camisa, que el aceite
  // frío no empeora. De ahí que un motor con aceite ocho veces más espeso no
  // cueste ocho veces más de mover, sino unas dos veces y media.
  return (mot.friSeca + mot.friVisc*(rpm/200))*Math.pow(v,0.45);
}
/** Par total que el cigüeñal opone al arranque. N·m. */
function parArrastre(mot, aceite, TC, rpm, sellado){
  return parCompresion(mot,sellado) + parFriccion(mot,aceite,TC,rpm);
}

// ============================================================================
//  §5 · EL PUNTO DE FUNCIONAMIENTO, QUE NO SE DECLARA: SE BUSCA
//  Todo está acoplado. La corriente depende de la fuerza contraelectromotriz,
//  que depende del régimen; el par que da el arranque depende de la corriente;
//  y el régimen depende de si ese par vence al que opone el motor térmico. No
//  hay fórmula cerrada: hay un cruce, y se encuentra por bisección.
//
//  Cambiar UNA resistencia de un tramo mueve el cruce entero, y ésa es la razón
//  de que una masa floja se note en el régimen de arrastre y no en el
//  voltímetro de la batería.
// ============================================================================
/** Suma de las resistencias del circuito exterior al arranque. Ω. */
function resistenciaCircuito(R){
  let s=0; for(const k of TRAMO_KEYS) s+=R[k]; return s;
}
/** Corriente que circula a un régimen de cigüeñal dado. A. */
function corrienteA(E0, Ri, Rext, rpmCig){
  const wMotor=rpmCig*RELACION*Math.PI/30;
  const fcem=ARRANQUE.kT*wMotor;
  return Math.max(0,(E0-fcem)/(Ri+Rext));
}
/** Par que el arranque entrega EN EL CIGÜEÑAL a ese régimen. N·m. */
function parEntregado(E0, Ri, Rext, rpmCig){
  const I=corrienteA(E0,Ri,Rext,rpmCig);
  return Math.max(0,(ARRANQUE.kT*I - ARRANQUE.parVacio))*RELACION*ARRANQUE.rend;
}
/** El cruce. Devuelve el régimen de arrastre en rpm; 0 si el arranque no puede
 *  ni mover el motor, que es el «clic y nada» de toda la vida. */
function regimenArrastre(E0, Ri, Rext, mot, aceite, TC, sellado){
  const f=r=>parEntregado(E0,Ri,Rext,r)-parArrastre(mot,aceite,TC,r,sellado);
  if(f(0)<=0) return 0;                       // ni con el motor parado puede
  let lo=0, hi=600;
  if(f(hi)>0) return hi;                      // no llega a cruzar en el rango útil
  for(let i=0;i<60;i++){ const m=(lo+hi)/2; if(f(m)>0) lo=m; else hi=m; }
  return (lo+hi)/2;
}

// ============================================================================
//  §6 · LOS VEHÍCULOS
//  Cuatro, elegidos para que el mismo fallo dé cuentas distintas: un utilitario
//  de gasolina que arranca con poco, un diésel que necesita el doble de par y
//  además precalentamiento, una furgoneta con el cable largo hasta el motor y
//  un todoterreno con dos baterías de las de verdad.
// ============================================================================
const VEHS={
  util16:{ key:'util16', corto:'Utilitario 1.6', nombre:'Turismo 1.6 L de gasolina, 4 cilindros',
    nota:'Batería de 640 A CCA, cable positivo corto y masa por trenza al bloque.',
    diesel:false, cil:4, parCompRef:40.0, friSeca:18.0, friVisc:8.0, rpmMin:140,
    bat:{cca:640}, largoPos:1.15, seccPos:25, largoMasa:0.55, seccMasa:25 },
  tdi20:{ key:'tdi20', corto:'Diésel 2.0', nombre:'Turismo 2.0 L turbodiésel, 4 cilindros',
    nota:'Relación de compresión 16,5:1: pide casi el doble de par para girar.',
    diesel:true, cil:4, parCompRef:56.0, friSeca:22.0, friVisc:9.5, rpmMin:150,
    bat:{cca:760}, largoPos:1.35, seccPos:35, largoMasa:0.60, seccMasa:35 },
  // Lleva 50 mm² y no 35 PRECISAMENTE porque el cable es largo: así se monta de
  // fábrica un vehículo con la batería bajo el asiento. Y su masa no vuelve tres
  // metros y medio hasta la batería —va al punto de chasis más cercano—, porque
  // castigar dos veces la misma longitud dejaba una furgoneta sana sin arrancar
  // en una mañana de cinco grados.
  furgo:{ key:'furgo', corto:'Furgoneta', nombre:'Furgoneta 2.5 L diésel, batería bajo el asiento',
    nota:'El cable positivo mide tres metros y medio: la longitud NO es gratis.',
    diesel:true, cil:4, parCompRef:56.0, friSeca:21.0, friVisc:9.5, rpmMin:150,
    bat:{cca:800}, largoPos:3.50, seccPos:50, largoMasa:0.90, seccMasa:50 },
  todo:{ key:'todo', corto:'Todoterreno', nombre:'Todoterreno 4.0 L de gasolina, 6 cilindros',
    nota:'Batería de 900 A CCA y un motor grande al que hay que mover entero.',
    diesel:false, cil:6, parCompRef:58.0, friSeca:26.0, friVisc:11.0, rpmMin:140,
    bat:{cca:900}, largoPos:1.60, seccPos:50, largoMasa:0.70, seccMasa:50 },
};
const VEH_KEYS=Object.keys(VEHS);

// ============================================================================
//  §7 · LOS ACEITES
//  El primer número de un grado SAE es lo que hace en frío, y es el que decide
//  si el motor gira. El segundo es lo que hace caliente, y a −18 °C da igual.
// ============================================================================
const ACEITES={
  s0w20:{ k:'s0w20', rot:'0W-20', k20:0.70, B:2900,
    nota:'Sintético ligero: dos tercios de espesor ya templado, y el que menos se opone en frío.' },
  s5w30:{ k:'s5w30', rot:'5W-30', k20:1.00, B:3350,
    nota:'El más común hoy en gasolina, y la referencia de esta escala.' },
  s15w40:{k:'s15w40',rot:'15W-40',k20:1.62, B:3950,
    nota:'Mineral de flota: vez y media más espeso templado, y en frío es casi miel.' },
};
const ACEITE_KEYS=Object.keys(ACEITES);

// ============================================================================
//  §8 · LAS AVERÍAS
//  Nueve, y están elegidas por una razón: CINCO de ellas dan exactamente la
//  misma lectura entre bornes de batería con la llave quitada. El censo del
//  laboratorio consiste en demostrar eso y en enseñar qué medida las separa.
// ============================================================================
const FALLAS={
  sano:{ key:'sano', corto:'todo bien', rot:'nada: el circuito está sano',
    pista:'Ninguna. Este coche arranca.' },
  bornSucio:{ key:'bornSucio', corto:'borne oxidado', rot:'borne positivo con sulfato',
    R:{bornePos:0.0022},
    pista:'La caída del borne positivo, que se mide con las dos puntas a un centímetro.' },
  masaFloja:{ key:'masaFloja', corto:'masa floja', rot:'trenza de masa floja u oxidada',
    R:{masaChasis:0.0038},
    pista:'La caída de la masa, que casi nadie mide y es la mitad del circuito.' },
  contactosQuemados:{ key:'contactosQuemados', corto:'contactos picados', rot:'contactos del solenoide picados',
    R:{solenoide:0.0041},
    pista:'La caída entre el borne de entrada y el de salida del solenoide.' },
  cableFino:{ key:'cableFino', corto:'cable de menos', rot:'cable positivo de sección insuficiente',
    seccion:0.36,
    pista:'La caída del cable positivo, y mirar qué sección lleva puesta.' },
  bateriaSulfatada:{ key:'bateriaSulfatada', corto:'batería gastada', rot:'batería sulfatada: la resistencia interna se ha doblado',
    saludRi:2.10,
    pista:'La tensión CON CARGA, o el ensayo de arranque en frío de la norma.' },
  vasoEnCorto:{ key:'vasoEnCorto', corto:'vaso en corto', rot:'un vaso de la batería en cortocircuito',
    vasosMuertos:1, saludRi:1.35,
    pista:'Ésta sí se ve en reposo: faltan dos voltios largos.' },
  escobillas:{ key:'escobillas', corto:'escobillas gastadas', rot:'escobillas del arranque gastadas',
    dRiArranque:0.0060,
    pista:'Ninguna caída la delata: hay que ver que la corriente y el régimen bajan CON todas las conexiones bien.' },
  solenoideDebil:{ key:'solenoideDebil', corto:'solenoide flojo', rot:'el solenoide no cierra bien el disco de contacto',
    R:{solenoide:0.0125},
    pista:'La misma que los contactos picados, pero con el clic delatándose.' },
};
const FALLA_KEYS=Object.keys(FALLAS);
function averia(k){ return FALLAS[k]||FALLAS.sano; }

/** Las resistencias sanas de cada tramo para un vehículo y una temperatura. Ω. */
function resistenciasSanas(v, TC){
  return {
    bornePos:   0.00012,
    cablePos:   resistenciaCable(v.largoPos, v.seccPos, TC),
    solenoide:  0.00048,
    masaMotor:  0.00016,
    masaChasis: resistenciaCable(v.largoMasa, v.seccMasa, TC) + 0.00014,
  };
}
/** Y las que hay de verdad, con la avería puesta. */
function resistencias(v, TC, F){
  const R=resistenciasSanas(v,TC);
  // Un cable de menos sección no añade resistencia: TIENE otra resistencia.
  if(F.seccion) R.cablePos=resistenciaCable(v.largoPos, v.seccPos*F.seccion, TC);
  if(F.R) for(const k in F.R) R[k]+=F.R[k];
  return R;
}

// ============================================================================
//  §9 · LOS ESCENARIOS
//  El mismo circuito, cinco mañanas distintas. Lo que separa un coche que
//  arranca de uno que no casi nunca es la avería: es la avería MÁS la mañana.
// ============================================================================
const ESCENARIOS=[
  {k:'verano',  rot:'Verano, 35 °C, batería llena',  TC:35,  soc:1.00},
  {k:'templado',rot:'Templado, 20 °C, batería llena',TC:20,  soc:1.00},
  {k:'fresco',  rot:'Fresco, 5 °C, al 75 %',         TC:5,   soc:0.75},
  {k:'helada',  rot:'Helada, −7 °C, al 75 %',        TC:-7,  soc:0.75},
  {k:'siberia', rot:'−18 °C, al 50 %',               TC:-18, soc:0.50},
];
const ESC_KEYS=ESCENARIOS.map(E=>E.k);

// ============================================================================
//  §10 · EL ENSAYO COMPLETO
//  Devuelve las tres cosas que se miden de verdad —tensión en reposo, tensión
//  con carga y régimen de arrastre— y, sobre todo, la caída de CADA TRAMO, que
//  es lo único que separa unas averías de otras.
// ============================================================================
// Los límites del oficio, que también están en la SAE J541. No son leyes de la
// física: son el umbral por debajo del cual una conexión se considera sana.
//
// Y ojo con el primero: es POR CONEXIÓN. Un cable NO es una conexión, y uno de
// tres metros y medio cae más de 0,2 V estando perfectamente sano. A un cable se
// le exige otra cosa —que caiga lo que su longitud y su sección predicen— y por
// eso el modelo distingue las dos clases de tramo. Aplicarle a un cable largo el
// límite de una conexión marca como averiado un vehículo que está bien.
const LIM_CONEXION=0.20;   // V en una sola conexión
const LIM_POSITIVO=0.50;   // V en todo el lado positivo
const LIM_MASA=0.20;       // V en toda la masa
const EXCESO_CABLE=1.60;   // cuántas veces su valor calculado delata a un cable

function ensayo(v, P){
  const F=(P.falla&&P.falla.key!==undefined)?P.falla:averia(P.falla);
  const ace=ACEITES[P.aceite]||ACEITES.s5w30;
  const bat=Object.assign({}, v.bat,
    {vasosMuertos:F.vasosMuertos||0, saludRi:F.saludRi||1});

  // ---- 1 · lo que se ve SIN arrancar, que es lo que casi todo el mundo mira
  const E0=tensionAbierta(bat,P.soc,P.TC);
  const Ri=resistenciaInterna(bat,P.soc,P.TC);
  const R=resistencias(v,P.TC,F);
  const rInducido=ARRANQUE.Ri+(F.dRiArranque||0);
  const Rcirc=resistenciaCircuito(R);
  const Rext=Rcirc+rInducido;

  // ---- 2 · el cruce: dónde se queda girando
  const rpm=regimenArrastre(E0,Ri,Rext,v,ace,P.TC,F.sellado);
  const I=corrienteA(E0,Ri,Rext,rpm);

  // ---- 3 · la caída de cada tramo, que es de lo que trata el laboratorio
  const caida={}; let vPos=0, vMasa=0, peorK=null, peor=0;
  for(const t of TRAMOS){
    const c=R[t.k]*I; caida[t.k]=c;
    if(t.masa) vMasa+=c; else vPos+=c;
    if(c>peor){ peor=c; peorK=t.k; }
  }
  const vBat=E0-Ri*I;              // lo que marca el voltímetro en los bornes
  const vInducido=vBat-Rcirc*I;    // lo que de verdad le llega al inducido
  const caidaInducido=rInducido*I; // y lo que el inducido se queda, que no es un tramo

  // ---- 4 · ¿arranca?
  // Un diésel además necesita su precalentamiento; aquí se da por hecho que las
  // bujías han hecho su trabajo y lo único que se juzga es el régimen.
  const arranca=rpm>=v.rpmMin;
  const margen=(v.rpmMin>0)?rpm/v.rpmMin-1:null;

  // ---- 5 · lo que la regla del oficio diría
  const avisos=[];
  const Rsano=resistenciasSanas(v,P.TC);
  for(const t of TRAMOS){
    if(t.conexion){
      if(caida[t.k]>LIM_CONEXION) avisos.push(t.rot+': '+dec(caida[t.k],2)+
        ' V, por encima de los '+dec(LIM_CONEXION,2)+' V que admite una conexión.');
    } else if(R[t.k]>Rsano[t.k]*EXCESO_CABLE){
      avisos.push(t.rot+': cae '+dec(caida[t.k],2)+' V cuando por su longitud y '+
        'su sección le tocaría '+dec(Rsano[t.k]*I,2)+'.');
    }
  }
  if(vPos>LIM_POSITIVO) avisos.push('Todo el lado positivo se lleva '+
    dec(vPos,2)+' V: el límite son '+dec(LIM_POSITIVO,2)+'.');
  if(vMasa>LIM_MASA) avisos.push('La masa se lleva '+dec(vMasa,2)+
    ' V: el límite son '+dec(LIM_MASA,2)+'.');
  if(vBat<9.6&&I>50) avisos.push('La batería se hunde a '+dec(vBat,1)+
    ' V con carga: por debajo de 9,6 no es el circuito, es ella.');
  if(!arranca) avisos.unshift('NO ARRANCA: gira a '+Math.round(rpm)+
    ' rpm y este motor necesita '+v.rpmMin+'.');

  return {E0:E0, Ri:Ri, R:R, Rext:Rext, Rcirc:Rcirc, rInducido:rInducido,
    rpm:rpm, I:I, caida:caida, caidaInducido:caidaInducido,
    vPos:vPos, vMasa:vMasa, vBat:vBat, vInducido:vInducido,
    peorTramo:peorK, peorCaida:peor, arranca:arranca, margen:margen,
    cca:ccaReal(bat,P.soc), ccaEtiqueta:v.bat.cca, avisos:avisos,
    falla:F.key, aceite:ace.k};
}

// ============================================================================
//  §11 · EL CENSO
//  Nueve montajes por cinco mañanas. Cada casilla dice dos cosas: si el coche
//  arranca y si el procedimiento de caídas lo DELATA. Las interesantes son las
//  que no arrancan y no delatan nada: ahí es donde el procedimiento se acaba y
//  hay que sacar otra herramienta.
// ============================================================================
/** Qué diría el procedimiento de caídas ante este ensayo. */
function veredictoCaidas(r, Rsano){
  // 1 · ¿algún tramo se pasa? A una CONEXIÓN se le exige el límite fijo; a un
  //     CABLE, que caiga lo que su longitud y su sección predicen.
  let peor=null, v=0;
  for(const t of TRAMOS){
    const mal=t.conexion ? (r.caida[t.k]>LIM_CONEXION)
                         : (r.R[t.k]>Rsano[t.k]*EXCESO_CABLE);
    if(mal&&r.caida[t.k]>v){ v=r.caida[t.k]; peor=t.k; }
  }
  if(peor) return {clase:'tramo', tramo:peor, v:v};
  // 2 · Las conexiones están bien. Si la batería se hunde con carga, es ella. El
  //     umbral es el mismo 9,6 V del ensayo de carga: NO se elige uno más alto
  //     —con 10,5 la regla se dispara con cualquier mañana fría y culpa a una
  //     batería que sólo estaba a veinte bajo cero.
  const V_HUNDE=9.6;
  if(r.vBat<V_HUNDE&&r.I>100) return {clase:'bateria', tramo:null, v:r.vBat};
  // 3 · Conexiones bien y batería firme, y aun así no gira lo suficiente. Aquí
  //     hay que separar dos cosas que no son lo mismo:
  //     · si el montaje está SANO, el procedimiento no se ha equivocado en nada:
  //       no hay avería que encontrar y el conjunto no da para más ese día;
  //     · si hay una avería de verdad, entonces sí: el procedimiento de caídas
  //       no puede localizarla, sólo descartar todo lo demás.
  if(!r.arranca) return {clase:(r.falla==='sano')?'limite':'ciego', tramo:null, v:null};
  return {clase:'limpio', tramo:null, v:null};
}
function censo(v, P){
  const filas=[]; let total=0, noArranca=0, ciegas=0, porTramo=0, porBateria=0, alLimite=0;
  for(const f of FALLA_KEYS){
    const celdas=[];
    for(const E of ESCENARIOS){
      const r=ensayo(v,Object.assign({},P,{falla:f,TC:E.TC,soc:E.soc}));
      const d=veredictoCaidas(r,resistenciasSanas(v,E.TC));
      total++;
      if(!r.arranca) noArranca++;
      if(d.clase==='ciego') ciegas++;
      if(d.clase==='limite') alLimite++;
      if(d.clase==='tramo') porTramo++;
      if(d.clase==='bateria') porBateria++;
      celdas.push({sitio:E.k, rpm:r.rpm, I:r.I, vBat:r.vBat, arranca:r.arranca,
        vPos:r.vPos, vMasa:r.vMasa, clase:d.clase, tramo:d.tramo,
        avisos:r.avisos.length});
    }
    filas.push({falla:f, celdas:celdas});
  }
  return {filas:filas, total:total, noArranca:noArranca, ciegas:ciegas,
    porTramo:porTramo, porBateria:porBateria, alLimite:alLimite};
}
/** Cuántos montajes distintos dan la MISMA lectura en reposo. Es la tesis del
 *  laboratorio, y se cuenta en vez de afirmarse. */
function indistinguibles(v, P){
  const g={};
  for(const f of FALLA_KEYS){
    const r=ensayo(v,Object.assign({},P,{falla:f}));
    const k=r.E0.toFixed(2);
    (g[k]=g[k]||[]).push(f);
  }
  let mayor=[];
  for(const k in g) if(g[k].length>mayor.length) mayor=g[k];
  return {grupos:g, mayor:mayor, n:mayor.length};
}

// ============================================================================
//  §12 · EL RETO A CIEGAS
//  Un coche que no arranca y seis instrumentos. Cada uno cuesta, y ninguno ve
//  el circuito entero: el voltímetro entre bornes no ve las conexiones, la
//  caída del positivo no ve la masa, y la prueba de carga no ve el arranque.
//  Hay que elegir cuáles se usan y después decidir.
// ============================================================================
const INSTR=[
  {k:'reposo',  rot:'Voltímetro entre bornes, sin tocar nada',
   nota:'Dice el estado de carga y poco más. Ocho de las nueve dan lo mismo.'},
  {k:'carga',   rot:'La misma medida, pero mientras gira',
   nota:'Si se hunde por debajo de 9,6 V, mira a la batería antes que al cable.'},
  {k:'pinza',   rot:'Pinza amperimétrica en el cable positivo',
   nota:'Corriente alta con régimen bajo es resistencia mecánica; baja con régimen bajo, eléctrica.'},
  {k:'positivo',rot:'Caída de todo el lado positivo',
   nota:'Punta roja al borne de la batería, negra al del arranque, girando.'},
  {k:'masa',    rot:'Caída de toda la masa',
   nota:'La mitad del circuito que casi nadie mide.'},
  {k:'j537',    rot:'Ensayo de arranque en frío (SAE J537)',
   nota:'Lo único que separa una batería cansada de un circuito con resistencia.'},
];
const INSTR_KEYS=INSTR.map(i=>i.k);

// LA RESOLUCIÓN DE CADA APARATO, y no es un detalle decorativo: es lo que hace
// que el reto sea un problema de deducción. Publicando la corriente al amperio,
// dos averías que se diferencian en tres amperios salen distintas y la pinza
// SOLA identifica las nueve. Un aparato de taller no hace eso: una pinza sobre
// un arranque oscila decenas de amperios y un voltímetro no da la centésima
// estable durante una pasada. Con la resolución de verdad las averías se
// agrupan, ningún instrumento resuelve el caso él solo, y hay que combinar dos
// o tres —que es exactamente lo que se hace delante de un coche.
const RESOL={reposo:0.05, carga:0.1, pinza:25, positivo:0.05, masa:0.05, j537:25};
const cuantiza=(x,p)=>Math.round(x/p)*p;
/** Qué enseña cada instrumento sobre un ensayo. Devuelve texto ya formado,
 *  porque lo que el alumno ve es exactamente esto y nada más. */
function lecturaInstr(k, r, v){
  switch(k){
    case 'reposo':   return dec(cuantiza(r.E0,RESOL.reposo),2)+' V en circuito abierto';
    case 'carga':    return dec(cuantiza(r.vBat,RESOL.carga),1)+' V mientras gira';
    case 'pinza':    return cuantiza(r.I,RESOL.pinza)+' A por el cable positivo';
    case 'positivo': return dec(cuantiza(r.vPos,RESOL.positivo),2)+' V de caída en todo el positivo';
    case 'masa':     return dec(cuantiza(r.vMasa,RESOL.masa),2)+' V de caída en toda la masa';
    case 'j537':     return cuantiza(r.cca,RESOL.j537)+' A de los '+v.bat.cca+' A de la etiqueta';
    default:         return '—';
  }
}
/** Qué averías siguen siendo compatibles con lo medido hasta ahora. Es lo que
 *  convierte el reto en un problema de deducción y no de adivinanza.
 *
 *  `medido` es un objeto {instrumento: lectura} con lo que el alumno YA ha
 *  mirado en el coche de verdad. Una avería sigue viva si, simulada, daría
 *  exactamente esas lecturas. Con cero instrumentos usados están vivas las
 *  nueve; cada medida que se pide mata a unas cuantas, y ninguna medida sola
 *  mata a todas menos una. */
function compatibles(v, P, medido){
  const vivas=[];
  for(const f of FALLA_KEYS){
    const cand=ensayo(v,Object.assign({},P,{falla:f}));
    let cabe=true;
    for(const k in medido) if(lecturaInstr(k,cand,v)!==medido[k]){ cabe=false; break; }
    if(cabe) vivas.push(f);
  }
  return vivas;
}
/** Lo que un instrumento DESCARTARÍA si se pidiera ahora. Sirve para medir si el
 *  reto tiene solución y para ordenar las pistas por lo que de verdad aportan. */
function informacionDe(k, v, P, medido, real){
  const r=ensayo(v,Object.assign({},P,{falla:real}));
  const m2=Object.assign({},medido); m2[k]=lecturaInstr(k,r,v);
  return {antes:compatibles(v,P,medido).length, despues:compatibles(v,P,m2).length};
}

/** ¿Este caso tiene UNA sola respuesta con los seis instrumentos sobre la mesa?
 *
 *  Hay que preguntarlo antes de armar un reto, porque no todos la tienen. En el
 *  utilitario a −7 °C, «todo bien» y «escobillas gastadas» dan las mismas seis
 *  lecturas: es el punto ciego del procedimiento, y está bien que exista —el
 *  censo lo cuenta y lo enseña—, pero pedirle al alumno que elija entre dos
 *  casos idénticos no sería un reto, sería un sorteo. */
function retoResoluble(v, P, falla){
  const r=ensayo(v,Object.assign({},P,{falla:falla}));
  const med={}; for(const k of INSTR_KEYS) med[k]=lecturaInstr(k,r,v);
  return compatibles(v,P,med).length===1;
}
/** Todos los casos con solución, para que armar un reto sea elegir de una lista
 *  y no probar suerte. */
function casosResolubles(){
  const out=[];
  for(const vk of VEH_KEYS){
    const v=VEHS[vk];
    for(const E of ESCENARIOS) for(const a of ACEITE_KEYS) for(const f of FALLA_KEYS){
      const P={TC:E.TC, soc:E.soc, aceite:a};
      if(retoResoluble(v,P,f)) out.push({veh:vk, sitio:E.k, aceite:a, falla:f});
    }
  }
  return out;
}

// ============================================================ T1 · FORMATOS, ESTADO Y MATERIALES

// El separador de millares es U+202F, un espacio FINO que no rompe línea. Con un
// espacio normal, `wrapText` puede partir «1 013» al final de un renglón.
// U+202F, el espacio fino inseparable. Un espacio normal deja que `wrapText`
// parta «2 660 m» en dos renglones, y ya obligó a rehacer diez laboratorios.
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
const amp=(x,d=0)=>num(x,d)+NBSP+'A';
const ohm=(x,d=2)=>num(x*1000,d)+NBSP+'mΩ';
const nm=(x,d=1)=>num(x,d)+NBSP+'N·m';
const rpmT=x=>num(x,0)+NBSP+'rpm';
const celC=(t,d=0)=>num(t,d)+NBSP+'°C';
const pcc=(x,d=0)=>num(x,d)+NBSP+'%';
const met=(x,d=2)=>num(x,d)+NBSP+'m';
const mm2=(x,d=0)=>num(x,d)+NBSP+'mm²';
const corta=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;

// ------------------------------------------------------------------- estado
const G={
  modo:'ensamble', veh:'util16', falla:'sano',
  sitio:'templado', aceite:'s5w30',
  simUnlocked:false, resuelto:false,
};
const VH=()=>VEHS[G.veh];
const FL=()=>FALLAS[G.falla];
const SITIO=()=>ESCENARIOS.find(E=>E.k===G.sitio)||ESCENARIOS[0];
const PAR=()=>{ const s=SITIO(); return {TC:s.TC, soc:s.soc, aceite:G.aceite}; };

// --------------------------------------------------------------------- memo
// El censo son 45 casillas y cada casilla resuelve un cruce por bisección de
// sesenta pasos. Repintar el pizarrón a cada fotograma sin memorizar tira la
// página al suelo.
const MEMO=new Map();
function memo(k,fn){ if(!MEMO.has(k)) MEMO.set(k,fn()); return MEMO.get(k); }
function invalida(){ MEMO.clear(); }
const CFGK=()=>[G.veh,G.sitio,G.aceite].join('|');
function EN_DE(f){ return memo('e|'+CFGK()+'|'+(f||G.falla),
  ()=>ensayo(VH(),Object.assign({falla:f||G.falla},PAR()))); }
function EN(){ return EN_DE(G.falla); }
function CENSO(){ return memo('c|'+G.veh+'|'+G.aceite,()=>censo(VH(),PAR())); }

// ---------------------------------------------------------------- veredictos
function veredicto(){
  const r=EN();
  if(!r.arranca) return {nivel:'bad',rot:'NO ARRANCA'};
  const d=veredictoCaidas(r,resistenciasSanas(VH(),SITIO().TC));
  if(d.clase==='tramo') return {nivel:'warn',rot:'ARRANCA, PERO HAY UN TRAMO QUE SE PASA'};
  if(d.clase==='bateria') return {nivel:'warn',rot:'ARRANCA, PERO LA BATERÍA SE HUNDE'};
  if(r.avisos.length) return {nivel:'warn',rot:'CON REPAROS'};
  return {nivel:'ok',rot:'CIRCUITO SANO'};
}

// ---------------------------------------------------------------- materiales
const std=o=>new THREE.MeshStandardMaterial(o);
const plas={color:0x2a3442,metalness:0.10,roughness:0.72};
const MAT={
  acero:   std({color:0x9aa6b4,metalness:0.86,roughness:0.34}),
  plomo:   std({color:0x5e6672,metalness:0.55,roughness:0.62}),
  caja:    std({color:0x1e2836,metalness:0.12,roughness:0.78}),
  tapa:    std({color:0x243044,metalness:0.14,roughness:0.70}),
  cobre:   std({color:0xc07a48,metalness:0.90,roughness:0.32}),
  aislante:std({color:0x141a24,metalness:0.05,roughness:0.90}),
  rojo:    std({color:0xc0392b,metalness:0.20,roughness:0.62}),
  negro:   std({color:0x171d27,metalness:0.20,roughness:0.66}),
  sulfato: std({color:0x8fbfd8,metalness:0.10,roughness:0.88}),
  carro:   std({color:0x33506e,metalness:0.35,roughness:0.52}),
  cristal: std({color:0x9fc7de,metalness:0.30,roughness:0.18,transparent:true,opacity:0.42}),
  suelo:   std({color:0x11161e,metalness:0.06,roughness:0.94}),
  verde:   std({color:0x2f7d51,metalness:0.20,roughness:0.60}),
  // El bloque del motor NO es acero pulido. Con el material del acero era el
  // objeto más claro de la escena, y en un laboratorio que trata del CIRCUITO
  // eso deja los cables y la batería como el fondo de su propio tema. Aluminio
  // fundido: gris, mate y por detrás de lo que hay que mirar.
  bloque:  std({color:0x4a5260,metalness:0.52,roughness:0.64}),
  banco:   std({color:0x232c38,metalness:0.10,roughness:0.72}),
};
// ============================================================ T2 · PIZARRÓN
// Un lienzo 2D de 1024×768 pegado a un panel 3D. Se llama `bcv` y no `cv`
// porque `cv` ya es la fábrica de lienzos del kit de la escena: reusar ese
// nombre rompe la página entera antes de que arranque nada.
const BW=1024, BH=768;
const bcv=document.createElement('canvas'); bcv.width=BW; bcv.height=BH;
const bx=bcv.getContext('2d');
const btex=new THREE.CanvasTexture(bcv);
// El ÚNICO MeshBasicMaterial legítimo de la escena. Se guarda aparte para que
// el centinela de materiales por defecto pueda descartarlo por identidad y no
// por su color, que es lo mismo que tiene el material equivocado.
const btexMat=new THREE.MeshBasicMaterial({map:btex,toneMapped:false});
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
// --------------------------------------------- la geometría del vano motor
// La escena es un vano motor abierto: el bloque a la izquierda, la batería a la
// derecha y, entre los dos, EL CIRCUITO. Los cables se ven enteros a propósito,
// porque el laboratorio trata de ellos y no del motor.
const K_VANO=1.34;
function dims(v){
  const K=K_VANO;
  // Un motor más grande es un bloque más grande. La correlación es floja y sólo
  // sirve para que el todoterreno no parezca el utilitario.
  const esc=0.86+v.parCompRef/150*0.44;
  const L=1.34*K*esc, W=0.94*K*esc, H=0.92*K*esc;
  const yBloque=0.62*K;
  return {
    K, L, W, H, yBloque,
    xBloque:-1.02*K, zBloque:0,
    // El arranque va atornillado abajo, del lado de la campana, que es donde va.
    xArr:-1.02*K+L*0.42, yArr:yBloque-H*0.30, zArr:W*0.40,
    rArr:0.19*K, lArr:0.62*K,
    // La batería, en su bandeja al otro lado del vano.
    xBat:1.46*K, yBat:0.34*K, zBat:0.10*K,
    wBat:0.52*K, hBat:0.44*K, dBat:0.34*K,
    // El larguero del chasis por el que pasa la masa.
    xCha:0.42*K, yCha:0.16*K, zCha:-0.96*K,
    // El banco de piezas, delante del vano: se ve entero y no tapa nada.
    xBanco:0.16*K, zBanco:2.46*K,
    // Y el rótulo de cada punto de medida.
    yRot:0.24*K,
    xIzq:-1.02*K-L*0.5-0.72*K,
    xDer:1.46*K+0.52*K*0.5+0.62*K,
  };
}
function colocaTablero(d){
  board.rotation.y=0.70;
  // El hueco no es decorativo: los rótulos del vano son sprites que sobresalen
  // de la pieza que nombran, y con menos de un metro se pintan sobre el marco.
  const medio=(BW3/2+0.13)*Math.cos(board.rotation.y);
  board.position.set(d.xIzq-1.00*d.K-medio,0,0.95*d.K);
}
function puntosClave(){
  const d=dims(VH());
  const a=BW3/2, mx=a*Math.cos(board.rotation.y), mz=a*Math.sin(board.rotation.y);
  const y0=BY3-BH3/2, y1=BY3+BH3/2, bp=board.position;
  const pts=[
    [bp.x-mx,y0,bp.z+mz],[bp.x+mx,y0,bp.z-mz],
    [bp.x-mx,y1,bp.z+mz],[bp.x+mx,y1,bp.z-mz],
    [d.xBloque-d.L/2,0.02,-d.W/2-0.30*d.K],
    [d.xBloque+d.L/2,d.yBloque+d.H/2+0.42*d.K,d.W/2+0.30*d.K],
    [d.xArr,d.yArr-d.rArr,d.zArr+d.lArr*0.6],
    [d.xBat+d.wBat/2,d.yBat+d.hBat+0.34*d.K,d.zBat],
    [d.xCha,d.yCha,d.zCha],
    [d.xDer,0.90*d.K,0],
  ];
  // El banco de piezas sólo entra en el encuadre MIENTRAS SE VE. Reservarle
  // sitio con el banco escondido dejaba el vano del motor pequeño en una
  // esquina y media pantalla en negro.
  if(banco&&banco.visible) pts.push([d.xBanco,1.30,d.zBanco]);
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
  const d=dims(VH()), Z=zonaUtil();
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
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(BW3,BH3),btexMat);
  pl.position.set(0,BY3,0.056); board.add(pl);
  const pie=Math.max(0.10,BY3-BH3/2-0.12);
  for(const sx of [-1,1]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,pie,16),MAT.acero);
    p.position.set(sx*BW3*0.42,pie/2,0); p.castShadow=true; board.add(p);
  }
}
// ------------------------------------------------------- testigos y utilidades
const emis=(c,i)=>std({color:c,emissive:c,emissiveIntensity:i||1.4,
  roughness:0.42,metalness:0.10});
MAT.ok=emis(0x2fbf62,1.5);
MAT.bad=emis(0xff4d5e,1.5);
MAT.avi=emis(0xe9c46a,1.4);
MAT.apag=std({color:0x232a33,roughness:0.6,metalness:0.1});
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
// Deja el grupo con el origen en su centro geométrico, que es lo que el ensamble
// necesita para llevarlo del banco a su sitio sin saltos.
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
// El rotulo se pone DESPUES de centrar y como hijo directo del grupo. Si se
// anade antes, `centra` se lo lleva al subgrupo desplazado y el letrero acaba en
// el ORIGEN DEL MUNDO en vez de encima de su pieza: con las piezas dibujadas
// alrededor del origen la diferencia es de centimetros, pero las que se dibujan
// en coordenadas del mundo —el cable y las dos masas— se quedan con el letrero a
// un metro largo de donde va.
// La altura no se afina a mano: `centra` deja la pieza centrada en su grupo, asi
// que su borde de arriba esta exactamente en −minY, y el letrero va ahi mas un
// margen. Asi vale para las seis y no hay que retocarlo cuando cambia el coche.
function rotula(g,t,c,margen){
  const s=labelSprite(t,c||'#cfe0ee');
  const m=(margen===undefined?0.16*dims(VH()).K:margen);
  s.position.set(0,-(g.userData.minY||0)+m,0);
  s.scale.multiplyScalar(0.50); g.add(s);
  return g;
}

// ============================================================ T3 · LAS PIEZAS
// Seis piezas, y las seis son EL CIRCUITO. El motor no está entre ellas: el
// motor es la carga, siempre está y no se monta. Eso no es un detalle de
// programación, es la tesis del laboratorio puesta en la caja de piezas.
const PART={
  bateria:{ rot:'Batería',
    fn:'La fuente.',
    sin:'Sin ella no hay nada que medir.',
    para:'Su tensión en reposo dice el estado de CARGA y no dice nada del estado de salud. Lo que dice la salud es la resistencia interna, y ésa sólo aparece cuando circula corriente.' },
  bornePos:{ rot:'Borne positivo',
    fn:'La mordaza sobre el poste.',
    sin:'Sin apretar el borne, la corriente no sale del poste.',
    para:'Es una CONEXIÓN, y a una conexión se le exigen 0,2 V como máximo con el motor girando. Es también el sitio donde más veces se esconde el problema, porque el sulfato no se ve por debajo de la mordaza.' },
  cablePos:{ rot:'Cable positivo',
    fn:'De la batería al solenoide.',
    sin:'Sin cable positivo el solenoide no recibe nada.',
    para:'Es un CABLE, no una conexión: se le exige que caiga lo que su longitud y su sección predicen, no un límite fijo. Uno de tres metros y medio cae más de 0,2 V estando perfecto.' },
  arranque:{ rot:'Motor de arranque',
    fn:'Con su solenoide y su piñón.',
    sin:'Sin arranque no hay quien mueva el motor.',
    para:'Es la CARGA, y por eso su caída va aparte de los tramos. Un procedimiento de caídas de tensión mide conexiones: al arranque sólo lo puede descartar.' },
  masaMotor:{ rot:'Masa del arranque',
    fn:'De la carcasa al bloque.',
    sin:'Sin masa, el circuito no se cierra.',
    para:'La mitad del circuito es la vuelta, y casi nadie la mide. Aquí empieza.' },
  masaChasis:{ rot:'Trenza de masa',
    fn:'Del bloque al chasis y del chasis a la batería.',
    sin:'Sin la trenza, la corriente busca la vuelta por donde puede: por los cables del acelerador, por el latiguillo del embrague, por donde no debe.',
    para:'Son dos tramos en serie, y por eso la masa se mide ENTERA: punta negra al borne de la batería, punta roja a la carcasa del arranque, mientras gira.' },
};
const ORDEN=['bateria','bornePos','cablePos','arranque','masaMotor','masaChasis'];
const PARTS=ORDEN.map(k=>Object.assign({k:k},PART[k]));

function haceBateria(){
  const d=dims(VH()), g=new THREE.Group(), K=d.K;
  const caja=roundedBox(d.wBat,d.hBat,d.dBat,MAT.caja,0.02*K);
  caja.position.y=d.hBat/2; g.add(caja);
  const tapa=roundedBox(d.wBat*0.98,0.05*K,d.dBat*0.98,MAT.tapa,0.015*K);
  tapa.position.y=d.hBat+0.02*K; g.add(tapa);
  // Los seis tapones de vaso. Se ven porque el laboratorio habla de vasos.
  for(let i=0;i<VASOS;i++){
    const t=cil(0.022*K,0.022*K,0.03*K,MAT.tapa,14);
    t.position.set((-2.5+i)*d.wBat/6.6, d.hBat+0.05*K, 0); g.add(t);
  }
  // Los dos postes, y el positivo más gordo: no es decorativo, es la norma.
  const pPos=cil(0.040*K,0.046*K,0.10*K,MAT.plomo,18);
  pPos.position.set(d.wBat*0.34,d.hBat+0.07*K,d.dBat*0.24); g.add(pPos);
  const pNeg=cil(0.034*K,0.040*K,0.10*K,MAT.plomo,18);
  pNeg.position.set(-d.wBat*0.34,d.hBat+0.07*K,d.dBat*0.24); g.add(pNeg);
  const mR=roundedBox(0.05*K,0.014*K,0.05*K,MAT.rojo,0.004*K);
  mR.position.set(d.wBat*0.34,d.hBat+0.13*K,d.dBat*0.24); g.add(mR);
  const mN=roundedBox(0.05*K,0.014*K,0.05*K,MAT.negro,0.004*K);
  mN.position.set(-d.wBat*0.34,d.hBat+0.13*K,d.dBat*0.24); g.add(mN);
  return rotula(centra(g),'batería','#cfe0ee');
}
function haceBornePos(){
  const d=dims(VH()), g=new THREE.Group(), K=d.K;
  // La mordaza: un anillo abierto con su tornillo y su terminal.
  const anillo=new THREE.Mesh(new THREE.TorusGeometry(0.052*K,0.016*K,10,22,Math.PI*1.6),
    MAT.plomo); anillo.rotation.x=Math.PI/2; g.add(anillo);
  const torn=cil(0.010*K,0.010*K,0.07*K,MAT.acero,10);
  torn.rotation.z=Math.PI/2; torn.position.set(-0.058*K,0,0); g.add(torn);
  const term=roundedBox(0.07*K,0.018*K,0.05*K,MAT.cobre,0.006*K);
  term.position.set(0.062*K,0,0); g.add(term);
  return rotula(centra(g),'borne +','#f0a05a');
}
function haceCablePos(){
  const d=dims(VH()), g=new THREE.Group(), K=d.K;
  const a=new THREE.Vector3(d.xBat+d.wBat*0.34, d.yBat+d.hBat/2+0.14*K, d.zBat+d.dBat*0.24);
  const b=new THREE.Vector3(d.xArr+0.10*K, d.yArr+0.16*K, d.zArr+d.lArr*0.30);
  // El cable cuelga: una catenaria basta para que se lea como un cable y no como
  // una barra, y la longitud del vehículo se nota en cuánto cuelga.
  const cae=0.10*K+Math.min(0.42*K, VH().largoPos*0.11*K);
  const m=a.clone().lerp(b,0.5); m.y-=cae; m.z+=0.16*K;
  const m2=a.clone().lerp(b,0.22); m2.y-=cae*0.62; m2.z+=0.10*K;
  const m3=a.clone().lerp(b,0.78); m3.y-=cae*0.72; m3.z+=0.12*K;
  // La sección del cable se ve: un cable de menos sección es un cable más fino.
  const r=(0.020+0.012*Math.sqrt(VH().seccPos/25))*K;
  g.add(tuboDe([a,m2,m,m3,b],r,MAT.rojo));
  for(const p of [a,b]){ const l=cil(r*1.5,r*1.5,0.05*K,MAT.cobre,12);
    l.position.copy(p); g.add(l); }
  return rotula(centra(g),'cable +','#ff6b6b');
}
function haceArranque(){
  const d=dims(VH()), g=new THREE.Group(), K=d.K;
  const cuerpo=cil(d.rArr,d.rArr,d.lArr,MAT.acero,24);
  cuerpo.rotation.x=Math.PI/2; g.add(cuerpo);
  // Las nervaduras de la carcasa, que es lo que la hace reconocible.
  for(let i=0;i<10;i++){
    const a=i/10*Math.PI*2;
    const n=roundedBox(0.012*K,0.012*K,d.lArr*0.92,MAT.acero,0.004*K);
    n.position.set(Math.cos(a)*d.rArr,Math.sin(a)*d.rArr,0); g.add(n);
  }
  // El solenoide, encima y más corto. Es donde están los contactos.
  const sol=cil(d.rArr*0.56,d.rArr*0.56,d.lArr*0.62,MAT.acero,18);
  sol.rotation.x=Math.PI/2; sol.position.set(0,d.rArr*1.30,-d.lArr*0.10); g.add(sol);
  for(const [x,y,z,mat] of [[0.10*K,d.rArr*1.30,-d.lArr*0.42,MAT.cobre],
                            [-0.10*K,d.rArr*1.30,-d.lArr*0.42,MAT.cobre]]){
    const t=cil(0.020*K,0.020*K,0.06*K,mat,12);
    t.rotation.x=Math.PI/2; t.position.set(x,y,z); g.add(t);
  }
  // El piñón, que es lo que engrana con la corona.
  const pin=cil(d.rArr*0.34,d.rArr*0.34,0.10*K,MAT.acero,14);
  pin.rotation.x=Math.PI/2; pin.position.set(0,0,d.lArr*0.58); g.add(pin);
  return rotula(centra(g),'arranque','#5ad1e6');
}
function haceMasaMotor(){
  const d=dims(VH()), g=new THREE.Group(), K=d.K;
  const a=new THREE.Vector3(d.xArr-d.rArr*0.9, d.yArr+d.rArr*0.5, d.zArr-d.lArr*0.30);
  const b=new THREE.Vector3(d.xBloque+d.L*0.22, d.yBloque-d.H*0.34, d.zBloque+d.W*0.42);
  const m=a.clone().lerp(b,0.5); m.y-=0.09*K;
  g.add(tuboDe([a,m,b],0.020*K,MAT.negro));
  for(const p of [a,b]){ const l=cil(0.030*K,0.030*K,0.04*K,MAT.acero,12);
    l.position.copy(p); g.add(l); }
  return rotula(centra(g),'masa del arranque','#9aa6b6');
}
function haceMasaChasis(){
  const d=dims(VH()), g=new THREE.Group(), K=d.K;
  // Dos tramos, porque en un coche son dos: bloque→chasis y chasis→batería. Es
  // la razón de que una masa se mida ENTERA y no por trozos.
  const a=new THREE.Vector3(d.xBloque+d.L*0.30, d.yBloque-d.H*0.42, d.zCha+0.22*K);
  const c=new THREE.Vector3(d.xCha, d.yCha+0.05*K, d.zCha);
  const b=new THREE.Vector3(d.xBat-d.wBat*0.34, d.yBat+d.hBat/2+0.12*K, d.zBat+d.dBat*0.24);
  const m1=a.clone().lerp(c,0.5); m1.y-=0.07*K;
  const m2=c.clone().lerp(b,0.5); m2.y-=0.10*K;
  // La trenza es más gruesa y mate: se distingue del cable positivo de un vistazo.
  const rt=(0.022+0.010*Math.sqrt(VH().seccMasa/25))*K;
  g.add(tuboDe([a,m1,c],rt,MAT.negro));
  g.add(tuboDe([c,m2,b],rt,MAT.negro));
  for(const p of [a,c,b]){ const l=cil(rt*1.4,rt*1.4,0.04*K,MAT.acero,12);
    l.position.copy(p); g.add(l); }
  return rotula(centra(g),'trenza de masa','#7b8697');
}
const FABRICA={ bateria:haceBateria, bornePos:haceBornePos, cablePos:haceCablePos,
  arranque:haceArranque, masaMotor:haceMasaMotor, masaChasis:haceMasaChasis };

// ============================================== T4 · EL VANO Y EL ENSAMBLE
const RIG={piezas:{}, testigo:null, pinon:null};
const ASM={done:new Set(), sel:null};

/** Dónde va cada pieza cuando está montada. */
function ancla(){
  const d=dims(VH());
  return {
    bateria:   new THREE.Vector3(d.xBat, d.yBat, d.zBat),
    bornePos:  new THREE.Vector3(d.xBat+d.wBat*0.34, d.yBat+d.hBat/2+0.13*d.K, d.zBat+d.dBat*0.24),
    arranque:  new THREE.Vector3(d.xArr, d.yArr, d.zArr),
  };
}
/** Donde va la pieza `k`. Las que se dibujan en coordenadas del mundo —el cable
 *  positivo y las dos masas— no declaran ancla: la suya es el centro que
 *  `centra` les dejo en `userData.home`. */
function posDe(k,o){
  const A=ancla();
  if(A[k]) return A[k].clone();
  if(o&&o.userData&&o.userData.home) return o.userData.home.clone();
  return new THREE.Vector3();
}

// Lo que SIEMPRE está: el suelo, el bloque del motor y el larguero del chasis.
// No se monta porque no es el circuito: es aquello contra lo que el circuito
// trabaja. Que no esté en la caja de piezas es parte de la lección.
let vano=null;
function levantaVano(){
  if(vano){ borra(vano); vano=null; }
  const g=new THREE.Group(); vano=g;
  const d=dims(VH()), K=d.K;

  const piso=new THREE.Mesh(new THREE.PlaneGeometry(22,22),MAT.suelo);
  piso.rotation.x=-Math.PI/2; piso.receiveShadow=true; g.add(piso);

  // El bloque, con sus cilindros insinuados por arriba y su campana de embrague.
  const bl=roundedBox(d.L,d.H,d.W,MAT.bloque,0.05*K);
  bl.position.set(d.xBloque,d.yBloque,d.zBloque); g.add(bl);
  for(let i=0;i<VH().cil;i++){
    const c=cil(d.W*0.16,d.W*0.16,0.10*K,MAT.bloque,16);
    c.position.set(d.xBloque-d.L*0.34+i*d.L*0.68/Math.max(1,VH().cil-1),
      d.yBloque+d.H/2+0.05*K, d.zBloque); g.add(c);
  }
  const campana=cil(d.H*0.46,d.H*0.46,0.24*K,MAT.bloque,26);
  campana.rotation.z=Math.PI/2;
  campana.position.set(d.xBloque+d.L/2+0.12*K,d.yBloque-d.H*0.10,d.zBloque); g.add(campana);
  { const s=labelSprite(VH().corto,'#9aa6b6');
    s.position.set(d.xBloque,d.yBloque+d.H/2+0.46*K,d.zBloque);
    s.scale.multiplyScalar(0.56); g.add(s); }

  // El larguero del chasis, que es por donde pasa la vuelta.
  const lar=roundedBox(2.90*K,0.13*K,0.16*K,MAT.negro,0.02*K);
  lar.position.set(d.xCha*0.4,d.yCha,d.zCha); g.add(lar);

  // La bandeja de la batería.
  const ban=roundedBox(d.wBat*1.16,0.05*K,d.dBat*1.16,MAT.negro,0.01*K);
  ban.position.set(d.xBat,d.yBat-d.hBat/2-0.03*K,d.zBat); g.add(ban);
  for(const sx of [-1,1]){
    const p=roundedBox(0.05*K,d.yBat-d.hBat/2,0.05*K,MAT.negro,0.01*K);
    p.position.set(d.xBat+sx*d.wBat*0.44,(d.yBat-d.hBat/2)/2,d.zBat); g.add(p);
  }

  // El testigo del salpicadero: se enciende cuando el coche NO arranca. Es el
  // único aviso que un conductor tiene, y no dice por qué.
  const tm=MAT.apag.clone();
  const tst=cil(0.07*K,0.07*K,0.02*K,tm,20);
  tst.rotation.x=Math.PI/2;
  tst.position.set(d.xBat-0.20*K, d.yBat+d.hBat+0.62*K, d.zBat-0.30*K);
  g.add(tst); RIG.testigo=tm;
  { const s=labelSprite('no arranca','#7b8697');
    s.position.set(d.xBat-0.20*K, d.yBat+d.hBat+0.80*K, d.zBat-0.30*K);
    s.scale.multiplyScalar(0.40); g.add(s); }

  scene.add(g);
}
const STAGE_S=0.66;
const BENCH={cols:3,dx:1.12,dz:1.10,top:0.90,pedH:0.24};
const NFIL=Math.ceil(PARTS.length/BENCH.cols), PED_Y=BENCH.top+BENCH.pedH;
function pedXZ(i){
  const d=dims(VH());
  const c=i%BENCH.cols, f=Math.floor(i/BENCH.cols);
  return [d.xBanco+(c-(BENCH.cols-1)/2)*BENCH.dx, d.zBanco+(f-(NFIL-1)/2)*BENCH.dz];
}
const peds=[];
let banco=null;
function levantaBanco(){
  if(banco){ borra(banco); banco=null; }
  peds.length=0;
  const g=new THREE.Group(); banco=g;
  const d=dims(VH());
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
  RIG.piezas={}; RIG.pinon=null;
}
function haz(p){ const g=FABRICA[p.k](); g.userData.pid=p.k; return g; }
function registra(o){
  RIG.piezas[o.userData.id]=o;
  if(o.userData.id==='arranque') RIG.pinon=o.userData.pinon||null;
}
function reposiciona(){
  montadas.forEach(o=>{
    if(tweens.some(w=>w.o===o)) return;
    o.position.copy(posDe(o.userData.id,o));
  });
  fantasmas.forEach(f=>{
    const q=posDe(f.userData.id,f);
    f.position.copy(q); f.userData.home=q.clone();
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
  tweens.push({o, p0:o.position.clone(), p1:posDe(o.userData.id,o),
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
  f.userData.homeX=f.position.x; f.userData.shake=0.5; synth.beep(200,0.12,0.05);
  showToast('<span class="bad">✗ Esa pieza no va en ese hueco.</span>',2000);
}
function finEnsamble(){
  G.simUnlocked=true; syncCtrl();
  // El banco vacío se APAGA: sus aros luminosos se quedaban en primer plano
  // sembrando de resplandor el pizarrón, y un banco sin piezas no informa nada.
  muestraBanco(false);
  synth.beep(523,0.10,0.05); setTimeout(()=>synth.beep(784,0.14,0.05),130);
  showToast('🎉 <b>Circuito de arranque montado.</b> Se abren los seis modos de trabajo.',4600);
  S.setCinematicIdle(true);
  afterEdit();
  // Y se vuelve a encuadrar: el banco de piezas acaba de esconderse, y sin este
  // reencuadre la cámara sigue reservándole media pantalla a una mesa vacía.
  const c=camConjunto(MARGEN[G.modo]||1.00); S.moveTo(c[0],c[1],1.1);
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
// ------------------------------------------------------------- cabecera común
// Toda vista dice, con las mismas palabras y en el mismo sitio, qué vehículo,
// qué mañana y qué aceite. Sin eso, una captura del pizarrón no significa nada:
// el mismo circuito a 35 °C y a −18 °C son dos ensayos distintos.
function cabecera(titulo,sub,ciego){
  const v=VH(), F=FL(), S=SITIO();
  bg();
  textoFit(titulo,42,44,620,{s:23,b:true});
  if(sub) wrapText(sub,42,68,620,17,{s:13.5,c:'#8f9bad'});
  const dcho=[
    [(ciego?RETO.vehRot:v.corto)+' · '+(ciego?RETO.bat:v.bat.cca)+NBSP+'A CCA', CIAN],
    [ciego?'montaje desconocido':(G.falla==='sano'?'circuito sano':F.corto),
      ciego?GRIS:(G.falla==='sano'?GRIS:WARN_HEX)],
    [(ciego?RETO.sitioRot:S.rot)+' · '+ACEITES[ciego?RETO.aceite:G.aceite].rot, NARANJA],
  ];
  let yy=32;
  for(const d of dcho){ texto(d[0],BW-42,yy,{s:13.5,c:d[1],al:'right',b:true}); yy+=20; }
  linea([[42,86],[BW-42,86]],'#1b2432',1.2);
  return 86;
}

// ============================================================ T5 · LAS VISTAS

function vistaEnsamble(){
  const y0=cabecera('Monta el circuito de arranque',
    'Seis piezas, y las seis son EL CIRCUITO. El motor no está entre ellas: el motor es la carga, siempre está y no se monta.');
  const P={x:104,y:y0+34,w:556};
  let y=P.y+6;
  texto('LAS SEIS PIEZAS',P.x,y,{s:13,b:true,c:'#9aa6b6'}); y+=26;
  for(const p of PARTS){
    const hecho=ASM.done.has(p.k);
    chk(P.x,y-4,hecho);
    texto(p.rot,P.x+26,y,{s:14.5,b:true,c:hecho?OK_HEX:TINTA});
    y+=18;
    y=wrapText(hecho?p.para:p.sin,P.x+26,y,P.w-40,17,{s:12.5,c:hecho?'#9aa6b6':GRIS});
    y+=10;
  }
  // El recuadro de la derecha: qué se va a medir, y con qué criterio.
  const D={x:DER_X,y:y0+34,w:DER_W};
  const lnV=lineasDe(VH().nota,D.w,12.5);
  // 22 hasta el rótulo, 22 al nombre, 18 al arranque de la nota, sus renglones,
  // los 10 de separación y las SEIS filas de 25 que pinta `tablaDer` —cinco de
  // datos y la cabecera—, más el margen de abajo.
  const hCaja=22+22+18+lnV*17+10+25*6+14;
  rpanel(D.x-10,D.y-22,D.w+20,hCaja,'rgba(255,255,255,0.030)','#1e2836',10);
  texto('ESTE VEHÍCULO',D.x,D.y-2,{s:13,b:true,c:'#9aa6b6'});
  let yy=D.y+22;
  texto(VH().corto,D.x,yy,{s:14,b:true,c:CIAN}); yy+=18;
  // `wrapText` ya devuelve dónde acaba el texto. Restarle veinte píxeles para
  // pegar la tabla sólo funcionaba con notas de UN renglón, y las cuatro ocupan
  // dos: la cabecera «dato · valor» caía encima de la segunda línea.
  yy=wrapText(VH().nota,D.x,yy,D.w,17,{s:12.5,c:'#9aa6b6'})+10;
  tablaDer(yy,['dato','valor'],[
    {v:['batería',VH().bat.cca+NBSP+'A CCA']},
    {v:['cable positivo',met(VH().largoPos)+' / '+mm2(VH().seccPos)]},
    {v:['trenza de masa',met(VH().largoMasa)+' / '+mm2(VH().seccMasa)]},
    {v:['régimen mínimo',rpmT(VH().rpmMin)]},
    {v:['combustible',VH().diesel?'diésel':'gasolina']},
  ]);
  const falta=PARTS.length-ASM.done.size;
  banda(624, falta?'warn':'ok', falta?('FALTAN '+falta+' PIEZAS'):'CIRCUITO COMPLETO',
    falta
      ? 'Mientras falte una pieza los otros seis modos están cerrados. En un coche de verdad tampoco se mide una caída de tensión en un circuito que no se cierra.'
      : 'Ya se puede medir. Empieza por «la pasada», que es lo que hace cualquiera, y fíjate en que la tensión en reposo no distingue casi nada.');
}

function vistaPasada(){
  const r=EN(), v=VH();
  const y0=cabecera('La pasada de arranque',
    'Lo que ve cualquiera: la tensión en los bornes y el ruido del motor girando. Fíjate en cuánto de la tensión de la batería llega al inducido.');
  // La caída, dibujada como lo que es: una escalera de la batería al inducido.
  // Los peldaños: E0 → bornes → después de cada tramo → inducido.
  const pasos=[['fem',r.E0],['bornes',r.vBat]];
  let acc=r.vBat;
  for(const t of TRAMOS){ acc-=r.caida[t.k]; pasos.push([t.rot,acc]); }
  // El eje se ajusta al caso. Con el rango fijo de 7 a 13,4 V —puesto para que
  // cupiera la línea de 9,6— la escalera se aplastaba contra el borde de arriba
  // y no se veía lo único que hay que mirar, que es cuánto baja cada peldaño.
  const suelo=Math.max(6.5,Math.min(9.4,Math.min(...pasos.map(p=>p[1]))-0.35));
  const P={x:104,y:y0+42,w:556,h:370};
  const M=ejes(P,0,7,suelo,13.4,'','tensión (V)',null,vv=>num(vv,1),7,6);
  enCaja(P,()=>{
  const pts=[]; pasos.forEach((p,i)=>{ pts.push([i,p[1]]); pts.push([i+1,p[1]]); });
  serieXY(M,pts,NARANJA,3.2);
  nivel(P,M,r.E0,GRIS,'en reposo '+volt(r.E0),[5,5]);
  nivel(P,M,9.6,BAD_HEX,'9,6 V: el suelo del ensayo de carga',[4,4]);
  pasos.forEach((p,i)=>{ punteo(M,i+0.5,p[1],i===0?GRIS:(i===1?CIAN:COBRE),4.2); });
  });
  texto('fem → bornes → cada tramo → inducido',P.x+P.w/2,P.y+P.h+22,
    {s:12.5,c:'#7b8697',al:'center'});

  const S=SITIO();
  let y=y0+34;
  y=tablaDer(y,['lo que se mide','valor'],[
    {v:['en reposo',volt(r.E0)],c:GRIS},
    {v:['con el motor girando',volt(r.vBat)],b:true,
      c:r.vBat<9.6?BAD_HEX:(r.vBat<10.5?WARN_HEX:OK_HEX)},
    {v:['corriente',amp(r.I)]},
    {v:['régimen',rpmT(r.rpm)],b:true,c:r.arranca?OK_HEX:BAD_HEX},
    {v:['mínimo para prender',rpmT(v.rpmMin)],c:GRIS},
    {v:['al inducido le llega',volt(r.vInducido)]},
  ]);
  y+=16;
  y=tablaDer(y,['el reparto','V'],[
    {v:['todo el positivo',volt(r.vPos)],
      c:r.vPos>LIM_POSITIVO?BAD_HEX:OK_HEX},
    {v:['toda la masa',volt(r.vMasa)],
      c:r.vMasa>LIM_MASA?BAD_HEX:OK_HEX},
    {v:['dentro de la batería',volt(r.Ri*r.I)],c:GRIS},
    {v:['dentro del arranque',volt(r.caidaInducido)],c:GRIS},
  ]);
  const V=veredicto();
  const txt=r.arranca
    ? ('Gira a '+rpmT(r.rpm)+' y este motor necesita '+rpmT(v.rpmMin)+'. '+
       (r.avisos.length?r.avisos[0]:'De los '+volt(r.E0)+' de la batería, al inducido le llegan '+
        volt(r.vInducido)+': el resto se lo reparten la propia batería, los cables y las conexiones.'))
    : ('Gira a '+rpmT(r.rpm)+' y este motor necesita '+rpmT(v.rpmMin)+'. '+
       (r.avisos[1]||'Y el testigo del salpicadero no dice por qué: para eso está la vista de tramos.'));
  banda(624,V.nivel,V.rot,txt);
}

function vistaTramos(){
  const r=EN(), v=VH(), S=SITIO();
  const Rsano=resistenciasSanas(v,S.TC);
  const y0=cabecera('La caída de cada tramo',
    'La vista que resuelve el laboratorio. A una CONEXIÓN se le exigen 0,2 V; a un CABLE, que caiga lo que su longitud y su sección predicen. No es el mismo criterio.');
  const P={x:104,y:y0+46,w:556,h:300};
  const maxV=Math.max(0.35, ...TRAMOS.map(t=>r.caida[t.k]*1.25));
  const M=ejes(P,0,TRAMOS.length,0,maxV,'','caída (V)',null,vv=>num(vv,2),TRAMOS.length,5);
  enCaja({x:P.x,y:P.y,w:P.w,h:P.h+40},()=>{
  TRAMOS.forEach((t,i)=>{
    const c=r.caida[t.k];
    const mal=t.conexion ? (c>LIM_CONEXION) : (r.R[t.k]>Rsano[t.k]*EXCESO_CABLE);
    const x0=M.X(i+0.16), x1=M.X(i+0.84), yb=M.Y(0), yt=M.Y(c);
    bx.save(); bx.fillStyle=mal?'rgba(255,107,107,0.34)':'rgba(124,217,146,0.26)';
    bx.fillRect(x0,yt,x1-x0,yb-yt);
    bx.strokeStyle=mal?BAD_HEX:OK_HEX; bx.lineWidth=1.6; bx.strokeRect(x0,yt,x1-x0,yb-yt);
    bx.restore();
    // Lo que a ese tramo le TOCARÍA caer, que para un cable es lo único que vale.
    const esp=Rsano[t.k]*r.I;
    linea([[x0,M.Y(esp)],[x1,M.Y(esp)]],'#9aa6b6',1.6,[4,3]);
    texto(volt(c),(x0+x1)/2,yt-8,{s:12.5,b:true,c:mal?BAD_HEX:OK_HEX,al:'center'});
    texto(corta(t.rot,18),(x0+x1)/2,P.y+P.h+19,{s:11.5,c:'#7b8697',al:'center'});
    texto(t.conexion?'conexión':'cable',(x0+x1)/2,P.y+P.h+34,
      {s:10.5,c:t.conexion?VIO:AZUL,al:'center'});
  });
  nivel(P,M,LIM_CONEXION,WARN_HEX,'0,20 V: el límite de UNA CONEXIÓN',[5,4]);
  });
  // La leyenda va DEBAJO de la gráfica: dentro tapaba la primera barra y el
  // rótulo del nivel de 0,20 V, y encima se metía en el subtítulo.
  leyenda(P.x,P.y+P.h+64,[['lo que cae',OK_HEX],['lo que le tocaría',GRIS],
    ['conexión',VIO],['cable',AZUL]]);

  let y=y0+34;
  const filas=TRAMOS.map(t=>{
    const c=r.caida[t.k], esp=Rsano[t.k]*r.I;
    const mal=t.conexion?(c>LIM_CONEXION):(r.R[t.k]>Rsano[t.k]*EXCESO_CABLE);
    return {v:[corta(t.rot,15),volt(c),volt(esp)], c:mal?BAD_HEX:TINTA, b:mal};
  });
  y=tablaDer(y,['tramo','cae','toca'],filas);
  y+=14;
  y=tablaDer(y,['el total','V'],[
    {v:['positivo',volt(r.vPos)],c:r.vPos>LIM_POSITIVO?BAD_HEX:OK_HEX,b:true},
    {v:['límite',volt(LIM_POSITIVO)],c:GRIS},
    {v:['masa',volt(r.vMasa)],c:r.vMasa>LIM_MASA?BAD_HEX:OK_HEX,b:true},
    {v:['límite',volt(LIM_MASA)],c:GRIS},
  ]);
  y+=14;
  tablaDer(y,['y el inducido','V'],[
    {v:['se queda',volt(r.caidaInducido)],c:GRIS},
    {v:['y no es un tramo','va aparte'],c:GRIS},
  ]);
  const d=veredictoCaidas(r,Rsano);
  const txt=d.clase==='tramo'
    ? ('El procedimiento señala «'+TRAMOS.find(t=>t.k===d.tramo).rot+'», que cae '+volt(d.v)+
       '. Eso es lo que hay que apretar, limpiar o cambiar, y NO el motor de arranque.')
    : (d.clase==='bateria'
      ? ('Todas las conexiones están dentro. La batería se hunde a '+volt(r.vBat)+
         ' con carga, y por debajo de 9,6 V el problema es ella y no el cable.')
      : (d.clase==='ciego'
        ? ('Todas las conexiones están dentro y la batería aguanta, y aun así no arranca. '+
           'Aquí el procedimiento de caídas se acaba: sólo puede DESCARTAR. Lo que queda está '+
           'dentro del arranque o dentro de la batería, y para eso hacen falta otras medidas.')
        : (d.clase==='limite'
          ? ('No hay nada que encontrar: el circuito está bien y el conjunto no da para más '+
             'esta mañana. Con otro aceite o con la batería llena, arrancaría.')
          : (TRAMOS.some(t=>!t.conexion&&r.caida[t.k]>LIM_CONEXION)
          ? ('Ningún tramo se pasa y el coche arranca, y sin embargo hay una barra por encima de '+
             'la línea de 0,20 V: es un CABLE, y ese límite es el de una CONEXIÓN. Cae '+
             volt(r.caida[TRAMOS.filter(t=>!t.conexion).sort((a,b)=>r.caida[b.k]-r.caida[a.k])[0].k])+
             ' porque mide lo que mide, no porque esté mal. Aplicarle el límite de una conexión '+
             'condenaría un vehículo sano.')
          : 'Ningún tramo se pasa y el coche arranca. Éste es el aspecto de un circuito sano.'))));
  banda(624, d.clase==='tramo'?'bad':(d.clase==='limpio'?'ok':'warn'),
    d.clase==='tramo'?'HAY UN TRAMO QUE SE PASA'
      :(d.clase==='bateria'?'ES LA BATERÍA, NO EL CIRCUITO'
      :(d.clase==='ciego'?'PUNTO CIEGO DEL PROCEDIMIENTO'
      :(d.clase==='limite'?'NO HAY AVERÍA: ES EL CONJUNTO':'TODOS LOS TRAMOS DENTRO'))), txt);
}

function vistaBateria(){
  const v=VH(), S=SITIO(), r=EN();
  const y0=cabecera('La batería: lo que dice y lo que calla',
    'La tensión en reposo dice el estado de CARGA. La salud la dice la resistencia interna, y ésa sólo se ve cuando circula corriente. El CCA de la etiqueta es lo que ancla todo el modelo.');
  // Arriba: la tensión en reposo apenas se mueve; abajo: el CCA se derrumba.
  const P1={x:104,y:y0+40,w:556,h:150};
  const M1=ejes(P1,-20,40,11.4,13.0,'','en reposo (V)',null,x=>num(x,1),6,4);
  enCaja(P1,()=>{
    for(const soc of [1.0,0.75,0.5]){
      const pts=[]; for(let T=-20;T<=40;T+=2) pts.push([T,tensionAbierta(v.bat,soc,T)]);
      serieXY(M1,pts,soc===1?CIAN:(soc===0.75?AZUL:VIO),2.4);
    }
  });
  // Cabe DENTRO: la tensión en reposo apenas se mueve y vive en el tercio de
  // arriba del panel, así que el de abajo está siempre vacío.
  leyenda(P1.x+10,P1.y+P1.h-74,[['batería llena',CIAN],['al 75 %',AZUL],['al 50 %',VIO]]);

  // El eje tiene que llegar donde llega la CURVA, no donde llega la etiqueta:
  // con el tope en 1,15 veces el CCA, la batería llena a 40 °C se salía por
  // arriba y el resto de la curva se pintaba sobre el panel de la tensión en
  // reposo, donde parecía que la tensión subía vez y media con el calor.
  const ccaEn=(soc,T)=>Math.max(0,
    (tensionAbierta(v.bat,soc,T)-V_CCA)/(resistenciaInterna(v.bat,soc,T)*POLARIZA));
  const P2={x:104,y:y0+240,w:556,h:206};
  const techo=Math.max(v.bat.cca*1.15, ccaEn(1,40)*1.06);
  const M2=ejes(P2,-20,40,0,techo,'temperatura (°C)','arranque en frío (A)',
    x=>num(x,0),x=>num(x,0),6,4);
  enCaja(P2,()=>{
    for(const soc of [1.0,0.75,0.5]){
      const pts=[];
      for(let T=-20;T<=40;T+=2) pts.push([T,ccaEn(soc,T)]);
      serieXY(M2,pts,soc===1?CIAN:(soc===0.75?AZUL:VIO),2.4);
    }
  });
  nivel(P2,M2,v.bat.cca,NARANJA,'el CCA de la etiqueta',[5,4]);
  punteo(M2,T_CCA,v.bat.cca,NARANJA,5.4);
  texto('la SAE J537 mide AQUÍ: −18 °C, 30 s, sin bajar de 7,2 V',
    M2.X(T_CCA)+10,M2.Y(v.bat.cca)-10,{s:12,c:NARANJA});

  let y=y0+34;
  y=tablaDer(y,['hoy, a '+celC(S.TC),'valor'],[
    {v:['en reposo',volt(r.E0)]},
    {v:['estado de carga',pcc(S.soc*100)]},
    {v:['resistencia interna',ohm(r.Ri)],b:true},
    {v:['a 25 °C y llena',ohm(resistenciaInterna(v.bat,1,25))],c:GRIS},
    {v:['el frío la multiplica','×'+num(factorFrio(S.TC),2)],c:NARANJA},
    {v:['la descarga, por','×'+num(factorCarga(S.soc),2)],c:NARANJA},
  ]);
  y+=16;
  const perd=1-r.cca/v.bat.cca;
  y=tablaDer(y,['arranque en frío','A'],[
    {v:['la etiqueta dice',num(v.bat.cca,0)],c:GRIS},
    {v:['hoy daría',num(r.cca,0)],b:true,
      c:perd>0.35?BAD_HEX:(perd>0.15?WARN_HEX:OK_HEX)},
    {v:['ha perdido',pcc(perd*100)],c:perd>0.15?WARN_HEX:GRIS},
  ]);
  // Las dos cifras se CALCULAN, cada una de lo suyo: la de la pantalla es una
  // diferencia de tensiones y la de la capacidad es un cociente de corrientes de
  // ensayo. Mezclarlas en una sola expresión daba un número correcto por
  // casualidad y una fórmula que no significaba nada.
  const dE=tensionAbierta(v.bat,1,25)-tensionAbierta(v.bat,1,-18);
  const cortaEn=T=>(tensionAbierta(v.bat,1,T)-V_CCA)/(resistenciaInterna(v.bat,1,T)*POLARIZA);
  const perdFrio=1-cortaEn(-18)/cortaEn(25);
  banda(624,'warn','LA TENSIÓN EN REPOSO ES UNA MALA CONSEJERA',
    'De 25 °C a −18 °C esta batería pierde '+num(dE*1000,0)+NBSP+'mV en la pantalla del voltímetro '+
    'y '+pcc(perdFrio*100)+' de su capacidad de arranque: '+num(cortaEn(25),0)+NBSP+'A contra '+
    num(cortaEn(-18),0)+'. Marca bien y no arranca. Y al 50 % de carga da '+
    num(ccaReal(v.bat,0.5),0)+NBSP+'A de los '+v.bat.cca+' de la etiqueta: no es proporcional, '+
    'porque la resistencia interna sube más deprisa de lo que baja la tensión.');
}

function vistaMotor(){
  const v=VH(), S=SITIO(), r=EN(), ace=ACEITES[G.aceite];
  const y0=cabecera('Dónde se cruzan las dos curvas',
    'El régimen de arrastre NO se declara: se busca. El par que da el arranque baja con el régimen y el que pide el motor sube; donde se cruzan, ahí gira.');
  const P={x:104,y:y0+44,w:556,h:300};
  const rMax=Math.max(320, r.rpm*1.9);
  const R=resistencias(v,S.TC,FL());
  const Rext=resistenciaCircuito(R)+r.rInducido;
  const pMax=Math.max(parEntregado(r.E0,r.Ri,Rext,0),
    parArrastre(v,ace,S.TC,rMax,FL().sellado))*1.12;
  const M=ejes(P,0,rMax,0,pMax,'régimen del cigüeñal (rpm)','par (N·m)',
    x=>num(x,0),x=>num(x,0),6,5);
  const pa=[], pb=[];
  for(let x=0;x<=rMax;x+=rMax/90){
    pa.push([x,parEntregado(r.E0,r.Ri,Rext,x)]);
    pb.push([x,parArrastre(v,ace,S.TC,x,FL().sellado)]);
  }
  // NO se dibuja la corriente. El par que entrega el arranque es su corriente
  // por una constante menos el par de vacío: la curva es LA MISMA recta, y
  // pintarla encima parecía un fallo de pintado en vez de una lección. Lo que
  // enseña —que par y corriente son la misma cosa— se dice con palabras abajo.
  enCaja(P,()=>{
    serieXY(M,pa,CIAN,2.8);
    serieXY(M,pb,NARANJA,2.8);
    punteo(M,r.rpm,parArrastre(v,ace,S.TC,r.rpm,FL().sellado),OK_HEX,6);
  });
  nivelV(P,M,v.rpmMin,BAD_HEX,'mínimo para prender',[4,4]);
  nivelV(P,M,r.rpm,OK_HEX,'gira a '+rpmT(r.rpm),null,true);
  leyenda(P.x,P.y+P.h+56,[['lo que da el arranque',CIAN],
    ['lo que pide el motor',NARANJA]]);

  let y=y0+34;
  y=tablaDer(y,['en el cruce','valor'],[
    {v:['régimen',rpmT(r.rpm)],b:true,c:r.arranca?OK_HEX:BAD_HEX},
    {v:['corriente',amp(r.I)]},
    {v:['par en el cigüeñal',nm(parArrastre(v,ace,S.TC,r.rpm,FL().sellado))]},
    {v:['de compresión',nm(parCompresion(v,FL().sellado))],c:GRIS},
    {v:['de fricción',nm(parFriccion(v,ace,S.TC,r.rpm))],c:GRIS},
  ]);
  y+=16;
  y=tablaDer(y,['el arranque','valor'],[
    {v:['bloqueado pide',amp(corrienteA(r.E0,r.Ri,Rext,0))],c:GRIS},
    {v:['y daría',nm(parEntregado(r.E0,r.Ri,Rext,0))],c:GRIS},
    {v:['relación total','×'+num(RELACION,1)]},
    {v:['aceite',ace.rot]},
    {v:['viscosidad relativa','×'+num(viscosidadRel(ace,S.TC),1)],
      c:viscosidadRel(ace,S.TC)>4?WARN_HEX:GRIS},
  ]);
  banda(624, r.arranca?'ok':'bad', r.arranca?'CRUZA POR ENCIMA DEL MÍNIMO':'CRUZA DEMASIADO ABAJO',
    'Con el rotor parado el arranque pediría '+amp(corrienteA(r.E0,r.Ri,Rext,0))+
    ' y daría '+nm(parEntregado(r.E0,r.Ri,Rext,0))+'. En cuanto empieza a girar, la fuerza '+
    'contraelectromotriz le come tensión y las dos cifras se hunden: por eso el cruce está '+
    'donde está y no en el pico. La recta azul es también la curva de CORRIENTE —el par es la '+
    'corriente por una constante menos el par de vacío—, y por eso una pinza amperimétrica y '+
    'un cuentavueltas dicen lo mismo. Cambiar una sola resistencia de un tramo mueve esa recta '+
    'entera, y con ella el cruce.');
}

function vistaCenso(){
  const C=CENSO(), v=VH();
  const y0=cabecera('Nueve montajes por cinco mañanas',
    'Cada casilla dice dos cosas: si el coche arranca y si el procedimiento de caídas lo DELATA. Las interesantes son las que no arrancan y no delatan nada.');
  const x0=196, w=(BW-x0-56)/ESCENARIOS.length, hh=y0+38, rh=52;
  ESCENARIOS.forEach((E,j)=>{
    const cx=x0+w*j+w/2;
    texto(E.rot.split(',')[0],cx,hh,{s:12.5,b:true,c:'#9aa6b6',al:'center'});
    texto(celC(E.TC)+' · '+pcc(E.soc*100),cx,hh+15,{s:11.5,c:'#7b8697',al:'center'});
  });
  const COL={tramo:['rgba(255,107,107,0.20)',BAD_HEX],
    bateria:['rgba(180,140,224,0.20)',VIO],
    ciego:['rgba(233,196,106,0.22)',WARN_HEX],
    limite:['rgba(110,168,254,0.16)',AZUL],
    limpio:['rgba(124,217,146,0.16)',OK_HEX]};
  C.filas.forEach((f,i)=>{
    const y=hh+30+rh*i;
    texto(corta(FALLAS[f.falla].corto,20),56,y+26,
      {s:13,b:f.falla===G.falla,c:f.falla===G.falla?CIAN:TINTA});
    f.celdas.forEach((c,j)=>{
      const cx=x0+w*j+4, cw=w-8;
      const col=COL[c.clase]||COL.limpio;
      rpanel(cx,y+2,cw,rh-8,col[0],col[1],7);
      texto((c.arranca?'✓ ':'✗ ')+rpmT(c.rpm),cx+cw/2,y+22,
        {s:13.5,b:true,c:c.arranca?col[1]:BAD_HEX,al:'center'});
      texto(c.clase==='tramo'?corta(TRAMOS.find(t=>t.k===c.tramo).rot,16)
        :(c.clase==='bateria'?'la batería'
        :(c.clase==='ciego'?'nada lo delata'
        :(c.clase==='limite'?'no hay avería':'todo dentro'))),
        cx+cw/2,y+38,{s:11,c:col[1],al:'center'});
    });
  });
  const y2=hh+30+rh*C.filas.length;
  leyenda(56,y2+14,[['lo delata un tramo',BAD_HEX],['es la batería',VIO],
    ['nada lo delata',WARN_HEX],['no hay avería',AZUL],['todo dentro',OK_HEX]]);
  const I=indistinguibles(v,PAR());
  wrapText('De '+C.total+' casillas: '+C.noArranca+' no arrancan · '+C.porTramo+
    ' las delata un tramo · '+C.porBateria+' señalan la batería · '+C.ciegas+
    ' son punto ciego · '+C.alLimite+' no tienen avería que encontrar.',
    330,y2+48,BW-372,17,{s:12.5,c:'#9aa6b6'});
  wrapText('Y antes de medir nada: '+I.n+' de los '+FALLA_KEYS.length+
    ' montajes dan EXACTAMENTE la misma tensión en reposo. Un coche sano, una batería '+
    'gastada, una masa floja y unos contactos picados marcan lo mismo con la llave quitada.',
    330,y2+84,BW-372,17,{s:12.5,c:NARANJA});
}

// ============================================================ T5b · EL RETO
// Un coche que no arranca y seis instrumentos. Cada medida que se pide mata a
// unas cuantas averías, y NINGUNA las mata a todas menos una: hay que combinar.
const RETO={falla:'sano', veh:'util16', vehRot:'', bat:0, sitio:'templado',
  sitioRot:'', aceite:'s5w30', medido:{}, elegido:null, veredicto:null};

function armaReto(){
  // Se elige de la lista de casos CON SOLUCIÓN. Los del punto ciego existen y el
  // censo los cuenta, pero pedirle al alumno que elija entre dos casos idénticos
  // no sería un reto: sería un sorteo.
  const casos=memo('reto|casos',()=>casosResolubles());
  const c=casos[Math.floor(Math.random()*casos.length)];
  const v=VEHS[c.veh], E=ESCENARIOS.find(x=>x.k===c.sitio);
  RETO.falla=c.falla; RETO.veh=c.veh; RETO.vehRot=v.corto; RETO.bat=v.bat.cca;
  RETO.sitio=c.sitio; RETO.sitioRot=E.rot; RETO.aceite=c.aceite;
  RETO.medido={}; RETO.elegido=null; RETO.veredicto=null;
}
const retoPar=()=>{ const E=ESCENARIOS.find(x=>x.k===RETO.sitio);
  return {TC:E.TC, soc:E.soc, aceite:RETO.aceite}; };
const retoEnsayo=f=>memo('reto|'+RETO.veh+'|'+RETO.sitio+'|'+RETO.aceite+'|'+(f||RETO.falla),
  ()=>ensayo(VEHS[RETO.veh],Object.assign({falla:f||RETO.falla},retoPar())));
function mide(k){
  if(RETO.medido[k]!==undefined) return;
  RETO.medido[k]=lecturaInstr(k,retoEnsayo(),VEHS[RETO.veh]);
  synth.beep(720,0.06,0.04); afterEdit();
}
function eligeFalla(k){ if(!FALLAS[k]) return; RETO.elegido=k; afterEdit(); }
function entrega(){
  if(!RETO.elegido) return false;
  RETO.veredicto=(RETO.elegido===RETO.falla)?'ok':'mal';
  if(RETO.veredicto==='ok'){ G.resuelto=true;
    synth.beep(660,0.10,0.05); setTimeout(()=>synth.beep(990,0.14,0.05),120); }
  else synth.beep(190,0.16,0.06);
  afterEdit(); return RETO.veredicto==='ok';
}
const retoVivas=()=>compatibles(VEHS[RETO.veh],retoPar(),RETO.medido);

function vistaReto(){
  const v=VEHS[RETO.veh], r=retoEnsayo();
  const y0=cabecera('Un coche que no arranca',
    'Te dan el coche y seis instrumentos. Ninguno ve el circuito entero. Pide los que necesites, y fíjate en cuántos montajes siguen en pie después de cada medida.',true);
  const P={x:104,y:y0+38,w:556};
  let y=P.y+8;
  texto('LOS SEIS INSTRUMENTOS',P.x,y,{s:13,b:true,c:'#9aa6b6'}); y+=24;
  for(const i of INSTR){
    const hecho=RETO.medido[i.k]!==undefined;
    chk(P.x,y-4,hecho);
    texto(i.rot,P.x+26,y,{s:14,b:true,c:hecho?TINTA:'#9aa6b6'});
    y+=17;
    if(hecho){ texto(RETO.medido[i.k],P.x+26,y,{s:14,b:true,c:NARANJA}); y+=17; }
    // La nota es un consejo para ELEGIR el instrumento. Una vez pedido, lo que
    // importa es su lectura, y dejarla puesta hacía crecer la lista hasta
    // meterse por debajo de la banda del pie.
    else y=wrapText(i.nota,P.x+26,y,P.w-40,16,{s:12,c:GRIS});
    y+=8;
  }
  // Qué parte del circuito ve cada instrumento. No depende del caso —así que no
  // regala nada— y es donde está la razón de que haya montajes que no se separan:
  // una medida que ve un LADO entero no puede decir en qué punto de ese lado
  // está la resistencia.
  const VE=[
    ['Voltímetro en reposo','sólo el estado de carga','ninguna resistencia: no hay corriente'],
    ['Voltímetro con carga','la batería y todo lo demás juntos','en qué parte está'],
    ['Pinza amperimétrica','cuánta corriente pasa','por dónde se pierde la tensión'],
    ['Caída del positivo','ese LADO entero','en qué punto del lado'],
    ['Caída de la masa','el otro lado entero','lo mismo, del otro lado'],
    ['Ensayo en frío','sólo la batería','nada del circuito'],
  ];
  // Altura FIJA: la lista de arriba crece con cada instrumento pedido, y una
  // tabla que la siguiera acabaría dentro del recuadro del veredicto.
  let yv=452;
  texto('QUÉ VE CADA UNO, Y QUÉ NO',P.x,yv,{s:13,b:true,c:'#9aa6b6'}); yv+=24;
  tabla(P.x,yv,
    [{t:'instrumento',w:150},{t:'ve',w:186},{t:'y no ve',w:196}],
    VE.map(r=>({v:r,c:TINTA})),{s:12,rh:23,gap:10});

  const vivas=retoVivas();
  let yy=y0+34;
  yy=tablaDer(yy,['siguen en pie',''],[{v:[String(vivas.length)+' de '+FALLA_KEYS.length,''],
    b:true,c:vivas.length===1?OK_HEX:(vivas.length<4?WARN_HEX:TINTA)}]);
  yy+=6;
  for(const f of vivas.slice(0,9)){
    texto('· '+corta(FALLAS[f].corto,26),DER_X,yy,
      {s:12.5,c:RETO.elegido===f?CIAN:'#9aa6b6',b:RETO.elegido===f});
    yy+=18;
  }
  yy+=10;
  texto('TU DICTAMEN',DER_X,yy,{s:13,b:true,c:'#9aa6b6'}); yy+=20;
  texto(RETO.elegido?FALLAS[RETO.elegido].corto:'— sin elegir —',DER_X,yy,
    {s:14,b:true,c:RETO.elegido?CIAN:GRIS});

  if(RETO.veredicto){
    const bien=RETO.veredicto==='ok';
    banda(624,bien?'ok':'bad',bien?'DICTAMEN CORRECTO':'NO ERA ÉSA',
      (bien?'Era ':'Era ')+FALLAS[RETO.falla].rot+'. '+FALLAS[RETO.falla].pista+
      (bien?'':' Vuelve a mirar: con los instrumentos que has pedido, seguían en pie '+
        vivas.length+' montajes.'));
  } else {
    banda(624,'warn','PIDE INSTRUMENTOS Y DECIDE',
      'NINGUNO de los seis cierra los nueve montajes, así que no hay un instrumento que '+
      'aprenderse y aplicar siempre: alguno cierra ALGÚN caso él solo, y la gracia está en '+
      'saber cuál separa qué. Ojo con la pinza amperimétrica, que en un punto de '+
      'funcionamiento templado da la misma cifra para las nueve averías: no miente, '+
      'sencillamente no es el instrumento de hoy.');
  }
}

// ===================================== T6 · LO QUE SE MUEVE POR FOTOGRAMA
function anima(dt){
  animT+=dt;
  // Las piezas del banco flotan y giran despacio para que se vean por todos los
  // lados sin tener que orbitar la cámara.
  moviles.forEach(o=>{
    const u=o.userData;
    o.rotation.y+=dt*0.42;
    const s=Math.sin(animT*1.5+u.fase)*0.018;
    o.position.y=u.baseY+s+(u.lift||0);
  });
  fantasmas.forEach(f=>{
    // El temblor se mide SIEMPRE desde la abscisa buena, guardada al empezar:
    // sumarlo a la posicion actual dejaba el fantasma corrido un poco mas a la
    // derecha en cada rechazo, y a los seis intentos ya no coincidia con su hueco.
    if(f.userData.shake>0){
      f.userData.shake=Math.max(0,f.userData.shake-dt*2.4);
      f.position.x=f.userData.homeX+Math.sin(animT*40)*f.userData.shake*0.05;
      if(f.userData.shake===0) f.position.x=f.userData.homeX;
    }
    if(f.userData.gm) f.userData.gm.opacity=0.18+0.10*Math.sin(animT*2.6);
  });
  // Los desplazamientos de una pieza a su sitio.
  for(let i=tweens.length-1;i>=0;i--){
    const w=tweens[i]; w.t+=dt/w.dur;
    const k=ease(Math.min(1,w.t));
    w.o.position.lerpVectors(w.p0,w.p1,k);
    const s=w.s0+(w.s1-w.s0)*k; w.o.scale.setScalar(s);
    if(w.t>=1){ w.o.position.copy(w.p1); w.o.scale.setScalar(w.s1); w.fin&&w.fin(); tweens.splice(i,1); }
  }
  // El testigo del salpicadero: encendido cuando el coche no arranca.
  if(RIG.testigo){
    const enc=G.simUnlocked&&!EN().arranca;
    const c=enc?0xff4d5e:0x232a33;
    RIG.testigo.color.setHex(c); RIG.testigo.emissive.setHex(enc?c:0x000000);
    RIG.testigo.emissiveIntensity=enc?(1.1+0.4*Math.sin(animT*5)):0;
  }
}

// =========================================== T7 · HUD, MANDOS Y TELEMETRÍA
const MODES=['ensamble','pasada','tramos','bateria','motor','censo','reto'];
const MODE_META={
  ensamble:['· montaje', 'EL CIRCUITO DE ARRANQUE'],
  pasada:  ['· pasada',  'LO QUE VE CUALQUIERA'],
  tramos:  ['· tramos',  'LA CAÍDA DE CADA TRAMO'],
  bateria: ['· batería', 'LO QUE DICE Y LO QUE CALLA'],
  motor:   ['· cruce',   'DÓNDE SE CRUZAN LAS CURVAS'],
  censo:   ['· censo',   'LAS 45 CASILLAS'],
  reto:    ['· reto',    'UN COCHE QUE NO ARRANCA'],
};
const HUD_TXT={
  ensamble:'Seis piezas, y las seis son el circuito. El motor no está entre ellas: el motor es la carga.',
  pasada:'12,5 V en los bornes y el coche no arranca. La pregunta no es cuánto hay, es cuánto LLEGA.',
  tramos:'A una conexión se le exigen 0,2 V. A un cable, que caiga lo que su longitud predice. No es el mismo criterio.',
  bateria:'La tensión en reposo dice la carga. La salud la dice la resistencia interna, y sólo aparece con corriente.',
  motor:'El régimen de arrastre no se declara: se busca. Es donde se cruzan lo que da el arranque y lo que pide el motor.',
  censo:'Nueve montajes por cinco mañanas. Busca las casillas en las que no arranca y nada lo delata.',
  reto:'Seis instrumentos y ninguno ve el circuito entero. El asunto no es acertar: es saber cuál separa qué.',
};
function pintaHUD(){
  const m=MODE_META[G.modo]||MODE_META.ensamble;
  el('hud').innerHTML='<h1>'+m[1]+'</h1><p>'+HUD_TXT[G.modo]+'</p>';
}

el('panel').innerHTML=
  '<h4>Circuito de arranque</h4>'+
  '<div id="ctrl"></div>'+
  '<div id="retobox" style="display:none">'+
    '<div class="gl" style="margin:9px 0 4px"><span>Instrumentos · cada uno cuesta una consulta</span></div>'+
    '<div class="btns" id="instrreto"></div>'+
    '<div class="gl" style="margin:10px 0 4px"><span>Tu dictamen: qué está mal</span></div>'+
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
  const ciego=(G.modo==='reto');
  // Los modos que no son el montaje se ofrecen SIEMPRE, pero deshabilitados
  // hasta que el circuito esté completo: esconderlos haría creer que no existen.
  let h='<div class="gl" style="margin:9px 0 4px"><span>Vista</span></div>';
  const dis=m=>(m!=='ensamble'&&!G.simUnlocked)?' disabled':'';
  h+='<div class="modebar">'+MODES.slice(0,4).map(m=>
    '<button class="b'+(G.modo===m?' on':'')+dis(m)+'" data-mode="'+m+'">'+MODE_META[m][0]+'</button>').join('')+'</div>';
  h+='<div class="modebar">'+MODES.slice(4).map(m=>
    '<button class="b'+(G.modo===m?' on':'')+dis(m)+'" data-mode="'+m+'">'+MODE_META[m][0]+'</button>').join('')+'</div>';
  h+=fila('Vehículo','data-veh',VEH_KEYS.map(k=>[k,VEHS[k].corto]),G.veh);
  if(G.modo==='ensamble'){
    h+='<div class="modebar" style="margin-top:8px">'+
       '<button class="b" id="btnMonta">Montar solo</button>'+
       '<button class="b" id="btnDesmonta">Desmontar</button></div>';
  }
  if(!ciego&&G.simUnlocked){
    h+=fila('La mañana','data-sitio',ESC_KEYS.map(k=>
      [k,ESCENARIOS.find(E=>E.k===k).rot.split(',')[0]]),G.sitio);
    h+=fila('Aceite','data-aceite',ACEITE_KEYS.map(k=>[k,ACEITES[k].rot]),G.aceite);
    h+=fila('Montaje','data-falla',FALLA_KEYS.map(k=>[k,corta(FALLAS[k].corto,14)]),G.falla);
  }
  el('ctrl').innerHTML=h;
  el('retobox').style.display=ciego?'':'none';
  if(ciego){
    el('instrreto').innerHTML=INSTR.map(i=>
      '<button class="b dx'+(RETO.medido[i.k]!==undefined?' on':'')+'" data-instr="'+i.k+'">'+
      corta(i.rot,30)+'</button>').join('');
    el('dxreto').innerHTML=FALLA_KEYS.map(k=>
      '<button class="b dx'+(RETO.elegido===k?' on':'')+'" data-dx="'+k+'">'+
      FALLAS[k].corto+'</button>').join('');
  }
}

// ----------------------------------------------------------------- telemetría
const glf=(l,v,c)=>'<div class="g"><div class="gl"><span>'+l+'</span><b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div></div>';
const rotTramo=k=>{ const t=TRAMOS.find(x=>x.k===k); return t?t.rot:'—'; };
function pintaTele(){
  let h='';
  if(!G.simUnlocked){
    h+=glf('Piezas instaladas',ASM.done.size+' / '+PARTS.length,
      ASM.done.size===PARTS.length?'good':'warn');
    h+=glf('Siguiente',(PARTS.find(p=>!ASM.done.has(p.k))||{rot:'—'}).rot);
    el('tele').innerHTML=h; return;
  }
  if(G.modo==='reto'){
    const v=VEHS[RETO.veh], M=RETO.medido;
    h+=glf('Coche',v.corto);
    h+=glf('La mañana',RETO.sitioRot);
    h+=glf('Batería de la etiqueta',amp(v.bat.cca)+' de arranque en frío');
    for(const i of INSTR) if(M[i.k]!==undefined) h+=glf(corta(i.rot,26),M[i.k]);
    const vivas=retoVivas();
    h+=glf('Instrumentos usados',Object.keys(M).length+' de '+INSTR.length);
    h+=glf('Montajes en pie',vivas.length+' de '+FALLA_KEYS.length,
      vivas.length===1?'good':(vivas.length<4?'warn':''));
    el('tele').innerHTML=h; return;
  }
  const r=EN(), v=VH(), q=veredicto();
  const d=veredictoCaidas(r,resistenciasSanas(v,SITIO().TC));
  h+=glf('Gira a',rpmT(r.rpm),r.arranca?'good':'bad');
  h+=glf('Y necesita',rpmT(v.rpmMin));
  h+=glf('Margen',r.margen===null?'—':num(r.margen*100,0)+NBSP+'%',
    r.arranca?'good':'bad');
  h+=glf('Corriente',amp(r.I));
  h+=glf('En reposo',volt(r.E0));
  h+=glf('Mientras gira',volt(r.vBat,1),r.vBat<9.6?'bad':(r.vBat<10.5?'warn':''));
  h+=glf('Cae el positivo',volt(r.vPos),r.vPos>LIM_POSITIVO?'bad':'');
  h+=glf('Cae la masa',volt(r.vMasa),r.vMasa>LIM_MASA?'bad':'');
  h+=glf('Peor tramo',corta(rotTramo(r.peorTramo),22)+' · '+volt(r.peorCaida));
  h+=glf('Se queda el inducido',volt(r.caidaInducido));
  h+=glf('Le llega al inducido',volt(r.vInducido,1));
  h+=glf('Arranque en frío hoy',amp(r.cca)+' de '+amp(r.ccaEtiqueta),
    r.cca<r.ccaEtiqueta*0.6?'warn':'');
  h+=glf('Qué diría el procedimiento',
    d.clase==='tramo'?corta(rotTramo(d.tramo),22)
    :(d.clase==='bateria'?'la batería'
    :(d.clase==='ciego'?'nada: punto ciego'
    :(d.clase==='limite'?'nada: está en su límite':'todo correcto'))),
    d.clase==='ciego'?'bad':(d.clase==='limpio'?'good':'warn'));
  h+=glf('Veredicto',q.rot,q.nivel==='bad'?'bad':(q.nivel==='warn'?'warn':'good'));
  el('tele').innerHTML=h;
}
function pintaInforme(){
  if(!G.simUnlocked){
    el('report').innerHTML='<span class="mono">Faltan '+(PARTS.length-ASM.done.size)+
      ' piezas.</span> Toca una pieza del banco y después su hueco luminoso. '+
      'Las seis son el circuito: el motor no está entre ellas porque el motor es la carga.';
    return;
  }
  if(G.modo==='reto'){
    const v=VEHS[RETO.veh];
    let h='<b>'+v.corto+'</b>, '+RETO.sitioRot+', aceite '+ACEITES[RETO.aceite].rot+
      '. El cliente dice que da una vuelta lenta y se queda. ';
    if(RETO.veredicto==='ok') h+='<b class="good">Dictamen correcto:</b> era '+FALLAS[RETO.falla].rot+'.';
    else if(RETO.veredicto==='mal') h+='<b class="bad">No era eso:</b> era '+FALLAS[RETO.falla].rot+'.';
    else h+='Pide instrumentos y dictamina. Ninguno de los seis ve el circuito entero.';
    el('report').innerHTML=h; return;
  }
  const r=EN(), v=VH();
  const d=veredictoCaidas(r,resistenciasSanas(v,SITIO().TC));
  let h='';
  if(d.clase==='ciego')
    h+='<b class="bad">El procedimiento de caídas no encuentra nada, y sin embargo el coche no arranca.</b> '+
      'Todas las conexiones están dentro de límite y la batería aguanta la tensión: lo que falla está '+
      'DENTRO del arranque, y ahí este procedimiento no entra. Lo delata la corriente: '+amp(r.I)+
      ' para '+rpmT(r.rpm)+'.';
  else if(d.clase==='limite')
    h+='<b class="warn">No hay nada averiado, y aun así no arranca.</b> '+
      'Con '+celC(SITIO().TC)+' y la batería al '+pcc(SITIO().soc*100)+', este conjunto da '+
      rpmT(r.rpm)+' y el motor pide '+rpmT(v.rpmMin)+'. No es una avería: es el límite de lo que hay montado.';
  else if(d.clase==='tramo')
    h+='<b class="bad">'+rotTramo(d.tramo)+':</b> '+volt(d.v)+'. '+
      (TRAMOS.find(t=>t.k===d.tramo).conexion
        ? 'Es una conexión, y a una conexión se le exigen '+volt(LIM_CONEXION)+'.'
        : 'Es un cable, y a un cable se le exige que caiga lo que su longitud y su sección predicen: '+
          volt(resistenciasSanas(v,SITIO().TC)[d.tramo]*r.I)+'.');
  else if(d.clase==='bateria')
    h+='<b class="bad">La batería se hunde a '+volt(r.vBat,1)+' con carga</b> y todas las conexiones '+
      'están dentro de límite. Con esa tensión no es el circuito: es ella. Hoy da '+amp(r.cca)+
      ' de los '+amp(r.ccaEtiqueta)+' de su etiqueta.';
  else if(r.avisos.length)
    h+='<b class="warn">Arranca, pero con reparos:</b> '+r.avisos[0];
  else
    h+='Circuito sano: '+volt(r.E0)+' en reposo, '+volt(r.vBat,1)+' girando con '+amp(r.I)+
      ', '+volt(r.vPos)+' de caída en el positivo y '+volt(r.vMasa)+' en la masa. Gira a '+
      rpmT(r.rpm)+' y el motor pide '+rpmT(v.rpmMin)+'.';
  el('report').innerHTML=h;
}

function pintaTablero(){
  if(G.modo==='ensamble') vistaEnsamble();
  else if(G.modo==='pasada') vistaPasada();
  else if(G.modo==='tramos') vistaTramos();
  else if(G.modo==='bateria') vistaBateria();
  else if(G.modo==='motor') vistaMotor();
  else if(G.modo==='censo') vistaCenso();
  else vistaReto();
  btex.needsUpdate=true;
}
function pinta(){ pintaTablero(); pintaTele(); pintaInforme(); syncCtrl(); pintaPregunta(); }
function afterEdit(){ invalida(); pinta(); }

const MARGEN={ensamble:0.98, pasada:0.99, tramos:0.99, bateria:0.99,
  motor:0.99, censo:0.95, reto:0.96};
function cambiaVehiculo(k){
  if(!VEHS[k]) return;
  G.veh=k; G.resuelto=false; invalida();
  levantaVano(); levantaBanco();
  colocaTablero(dims(VH()));
  if(G.simUnlocked) montaKit(); else initAssembly();
  if(G.modo==='reto') armaReto();
  pintaHUD(); afterEdit(); refrescaPregunta();
  const t=camConjunto(MARGEN[G.modo]||1.00); S.moveTo(t[0],t[1],0.9);
}
function setMode(m){
  if(!MODE_META[m]) return;
  if(m!=='ensamble'&&!G.simUnlocked){
    showToast('<b>Primero hay que montar el circuito.</b> Faltan '+
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
// Las preguntas se DERIVAN del estado: cambiar de coche, de mañana o de aceite
// las rehace con las cifras nuevas. Ninguna respuesta está escrita a mano, y por
// eso ninguna se puede aprender de memoria.
function preguntas(){
  if(!G.simUnlocked) return [];
  const v=VH(), r=EN(), C=CENSO(), s=SITIO();
  const ind=memo('ind|'+CFGK(),()=>indistinguibles(v,PAR()));
  const Q=[];
  Q.push({t:'Con este coche y esta mañana, '+ind.n+' de los '+FALLA_KEYS.length+
      ' montajes dan exactamente '+volt(EN_DE(ind.mayor[0]).E0)+' en reposo. ¿Qué se deduce de esa medida?',
    ops:[['Que la batería tiene carga, y nada más: en reposo no circula corriente y una resistencia sin corriente no cae tensión',true],
      ['Que el circuito está sano, porque la tensión es la correcta',false],
      ['Que la batería está en buen estado, porque da su tensión nominal',false],
      ['Que el arranque va a girar, porque tiene tensión suficiente',false]]});
  const Rs=resistenciasSanas(v,s.TC);
  Q.push({t:'El cable positivo de este coche mide '+met(v.largoPos)+' de '+
      mm2(v.seccPos)+' y, sano, cae '+volt(Rs.cablePos*r.I)+' con '+amp(r.I)+
      '. ¿Está fuera del límite de 0,20 V?',
    ops:[['No, porque ese límite es POR CONEXIÓN: a un cable se le exige que caiga lo que su longitud y su sección predicen',true],
      ['Sí, y hay que cambiarlo por uno de más sección',false],
      ['Sí, pero se tolera porque el coche arranca igual',false],
      ['No, porque el límite de 0,20 V sólo se aplica al lado de masa',false]]});
  Q.push({t:'Unas escobillas gastadas suben la resistencia DENTRO del arranque. ¿Por qué el procedimiento de caídas de tensión no las encuentra?',
    ops:[['Porque mide conexiones, y el inducido no es una conexión: todas las caídas salen correctas y sólo la corriente y el régimen lo delatan',true],
      ['Porque la caída del inducido es demasiado pequeña para medirla',false],
      ['Porque el multímetro no llega a los bornes del arranque',false],
      ['Porque las escobillas no aumentan la resistencia, sólo el desgaste mecánico',false]]});
  const fria=ESCENARIOS[ESCENARIOS.length-1], cal=ESCENARIOS[0];
  const rF=ensayo(v,{TC:fria.TC,soc:fria.soc,aceite:G.aceite,falla:'sano'});
  const rC=ensayo(v,{TC:cal.TC,soc:cal.soc,aceite:G.aceite,falla:'sano'});
  Q.push({t:'El mismo coche sano gira a '+rpmT(rC.rpm)+' con '+celC(cal.TC)+
      ' y a '+rpmT(rF.rpm)+' con '+celC(fria.TC)+'. ¿Por qué las dos cosas a la vez?',
    ops:[['Porque el frío sube la resistencia interna de la batería y espesa el aceite: la que empuja da menos y el que se deja arrastrar pide más',true],
      ['Sólo porque la batería pierde capacidad con el frío',false],
      ['Sólo porque el aceite frío es más viscoso',false],
      ['Porque el cobre de los cables conduce peor en frío',false]]});
  Q.push({t:'Un coche gira despacio. La pinza marca corriente ALTA. ¿Hacia dónde mira primero?',
    ops:[['Hacia la resistencia mecánica: si pasa mucha corriente, el circuito eléctrico está dejándola pasar y lo que cuesta es mover el motor',true],
      ['Hacia una conexión con resistencia, porque toda corriente alta viene de un mal contacto',false],
      ['Hacia la batería, porque está entregando de más',false],
      ['Hacia el inducido, porque las escobillas siempre suben la corriente',false]]});
  Q.push({t:'De las '+C.total+' casillas del censo, en '+C.ciegas+' el coche no arranca y el procedimiento de caídas no señala nada. ¿Qué dice eso del método?',
    ops:[['Que descarta muy bien lo que sí ve, y que un resultado limpio no significa que no haya avería',true],
      ['Que el método está mal planteado y conviene no usarlo',false],
      ['Que hay que bajar el límite de 0,20 V para que salten más casos',false],
      ['Que esas casillas son errores del modelo',false]]});
  Q.push({t:'La pinza amperimétrica de taller resuelve al cuarto de centenar de amperios. ¿Por qué eso importa en el reto?',
    ops:[['Porque montajes que en el papel se separan por unos pocos amperios caen en la misma lectura, y entonces la pinza sola ya no distingue',true],
      ['Porque una pinza siempre mide mal en corriente continua',false],
      ['Porque la corriente de arranque es demasiado alta para cualquier pinza',false],
      ['Porque la resolución sólo afecta a los voltímetros',false]]});
  return Q;
}
function bancoQ(){
  if(!QCACHE){ QCACHE=preguntas();
    QCACHE.forEach(q=>{ q.baraja=barajaEn(q.ops.map(o=>({o:o}))); }); }
  return QCACHE;
}
function refrescaPregunta(){ QCACHE=null; QI=0; QSEL=null; pintaPregunta(); }
function pintaPregunta(){
  // Sin circuito montado NO hay preguntas, y el banco en caché no se entera: al
  // desmontar, `pinta()` volvería a pintar las preguntas del ensayo que acaba de
  // desaparecer. La condición de verdad es el mode-lock.
  const B=G.simUnlocked?bancoQ():[];
  if(!B.length){ el('quiz').innerHTML=
    '<div class="lt">Las preguntas se abren cuando el circuito está montado.</div>'; return; }
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
  const no=INSTR.filter(i=>RETO.medido[i.k]===undefined);
  if(!no.length){ showToast('Ya has usado los seis instrumentos. Ahora toca decidir.',3000); return; }
  // La pista NO es el primero de la lista: es el que más montajes descarta AHORA.
  // Un orden fijo enseña a repetir una receta; éste enseña a elegir instrumento.
  let mejor=no[0], corte=Infinity;
  for(const i of no){
    const d=informacionDe(i.k,VEHS[RETO.veh],retoPar(),RETO.medido,RETO.falla);
    if(d.despues<corte){ corte=d.despues; mejor=i; }
  }
  showToast('<b>Prueba con:</b> '+mejor.rot+'<br>'+mejor.nota,4600);
}
function otroCoche(){ armaReto(); afterEdit(); refrescaPregunta();
  showToast('<b>Otro caso.</b> Otro coche, otra mañana y otro montaje.',3000); }

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
      showToast('<b>1 · El circuito.</b> Batería, borne, cable, arranque y las dos masas. El motor no está entre las piezas: el motor es la carga.',3400); });
    pasos.push(()=>{ autoAssemble(); });
    espera=PARTS.length*640+1800;
  }
  const resto=[
    ()=>{ G.veh='util16'; G.falla='sano'; G.sitio='templado'; G.aceite='s5w30';
      cambiaVehiculo('util16'); setMode('pasada');
      showToast('<b>Lo que ve cualquiera</b><br>Doce y medio en los bornes. La pregunta no es cuánto HAY, es cuánto LLEGA: mira lo que queda al final de la escalera.',4600); },
    ()=>{ G.falla='bornSucio'; afterEdit(); refrescaPregunta(); setMode('tramos');
      showToast('<b>Un borne sucio</b><br>La misma batería, el mismo motor. La barra que se sale es la del borne, y en reposo no se veía nada.',4600); },
    ()=>{ cambiaVehiculo('furgo'); G.falla='sano'; afterEdit(); refrescaPregunta();
      showToast('<b>Y ahora una furgoneta sana</b><br>Su cable positivo mide tres metros y medio y cae más de 0,2 V. No está averiada: el límite de 0,2 V es POR CONEXIÓN, no por cable.',5400); },
    ()=>{ cambiaVehiculo('util16'); G.falla='escobillas'; afterEdit(); refrescaPregunta();
      setMode('tramos');
      showToast('<b>El punto ciego</b><br>Escobillas gastadas: las cinco caídas salen correctas y el coche gira despacio. Este procedimiento no entra dentro del arranque.',5400); },
    ()=>{ G.falla='sano'; G.sitio='siberia'; afterEdit(); refrescaPregunta(); setMode('bateria');
      showToast('<b>A dieciocho bajo cero</b><br>La misma batería sana. Mira lo que queda de los amperios de su etiqueta, y cuánto de eso lo dice la tensión en reposo.',5200); },
    ()=>{ setMode('motor');
      showToast('<b>Dónde se cruzan</b><br>El régimen de arrastre no se declara: es el punto donde lo que el arranque da iguala a lo que el motor pide. Aquí no llega.',5000); },
    ()=>{ G.sitio='templado'; G.aceite='s15w40'; afterEdit(); refrescaPregunta();
      showToast('<b>Y con un 15W-40</b><br>El mismo circuito, la misma batería. Lo único que ha cambiado es el aceite, y el cruce se mueve.',4600); },
    ()=>{ G.aceite='s5w30'; afterEdit(); setMode('censo');
      showToast('<b>Cuarenta y cinco casillas</b><br>Rojo: no arranca. Y fíjate en las que no arrancan y el procedimiento no señala nada: ésas son las que hay que saber que existen.',5200); },
    ()=>{ setMode('reto');
      showToast('<b>Ahora tú</b><br>Un coche que no arranca y seis instrumentos. Ninguno lo resuelve él solo.',4200); },
  ];
  const todos=pasos.concat(resto);
  let i=0;
  const tic=()=>{ if(i>=todos.length){ paraAuto(); return; }
    const primera=(i===0&&pasos.length>0);
    todos[i++]();
    AUTO=setTimeout(tic, (i===2&&pasos.length>0)?espera:(primera?1200:4400)); };
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
  if(id==='btnOtro'){ otroCoche(); return; }
  if(id==='btnMonta'){ paraAuto(); autoAssemble(); return; }
  if(id==='btnDesmonta'){ paraAuto(); initAssembly(); afterEdit(); return; }
  if(b.dataset.mode){ paraAuto(); setMode(b.dataset.mode); return; }
  if(b.dataset.veh){ paraAuto(); cambiaVehiculo(b.dataset.veh); return; }
  if(b.dataset.sitio){ paraAuto(); G.sitio=b.dataset.sitio; G.resuelto=false;
    afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.aceite){ paraAuto(); G.aceite=b.dataset.aceite;
    afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.falla){ paraAuto(); G.falla=b.dataset.falla; G.resuelto=false;
    afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.instr){ paraAuto(); mide(b.dataset.instr); return; }
  if(b.dataset.dx){ eligeFalla(b.dataset.dx); return; }
  if(b.dataset.q!==undefined){ pregunta(Number(b.dataset.q)); return; }
  if(b.dataset.qnext){ QI++; QSEL=null; pintaPregunta(); return; }
});
function entregaConAviso(){
  if(!RETO.elegido){
    showToast('<b>Elige primero qué está mal</b><br>El dictamen es la parte que se corrige.',3200);
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
  get vehiculo(){ return G.veh; },
  get falla(){ return G.falla; },
  get simUnlocked(){ return G.simUnlocked; },
  get montadas(){ return ASM.done.size; },
  get piezas(){ return PARTS.length; },
  get frames(){ return PINTADAS; },
  get cfg(){ return {veh:G.veh, sitio:G.sitio, aceite:G.aceite, falla:G.falla}; },
  get veh(){ const v=VH(); return {key:v.key, corto:v.corto, nombre:v.nombre,
    diesel:v.diesel, cil:v.cil, rpmMin:v.rpmMin,
    parCompRef:v.parCompRef, friSeca:v.friSeca, friVisc:v.friVisc,
    bat:{cca:v.bat.cca, vasos:VASOS},
    largoPos:v.largoPos, seccPos:v.seccPos,
    largoMasa:v.largoMasa, seccMasa:v.seccMasa}; },
  lect(f){
    const r=EN_DE(f);
    return {E0:r.E0, Ri:r.Ri, R:Object.assign({},r.R), Rext:r.Rext, Rcirc:r.Rcirc,
      rInducido:r.rInducido, rpm:r.rpm, I:r.I, caida:Object.assign({},r.caida),
      caidaInducido:r.caidaInducido, vPos:r.vPos, vMasa:r.vMasa, vBat:r.vBat,
      vInducido:r.vInducido, peorTramo:r.peorTramo, peorCaida:r.peorCaida,
      arranca:r.arranca, margen:r.margen, cca:r.cca, ccaEtiqueta:r.ccaEtiqueta,
      avisos:r.avisos.slice(), falla:r.falla, aceite:r.aceite}; },
  // El veredicto del PROCEDIMIENTO, que no es lo mismo que la avería que hay.
  dictamen(f){
    const r=EN_DE(f), d=veredictoCaidas(r,resistenciasSanas(VH(),SITIO().TC));
    return {clase:d.clase, tramo:d.tramo, v:d.v}; },
  censo(){ const C=CENSO();
    return {total:C.total, noArranca:C.noArranca, ciegas:C.ciegas,
      porTramo:C.porTramo, porBateria:C.porBateria, alLimite:C.alLimite,
      filas:C.filas.map(f=>({falla:f.falla,
        celdas:f.celdas.map(c=>({sitio:c.sitio, rpm:c.rpm, I:c.I, vBat:c.vBat,
          arranca:c.arranca, vPos:c.vPos, vMasa:c.vMasa, clase:c.clase,
          tramo:c.tramo, avisos:c.avisos}))}))}; },
  indistinguibles(){ const d=indistinguibles(VH(),PAR());
    return {n:d.n, mayor:d.mayor.slice(),
      grupos:Object.keys(d.grupos).map(k=>({v:Number(k), fallas:d.grupos[k].slice()}))}; },
  resolubles(){ return casosResolubles(); },
  // `null` quiere decir «la temperatura de hoy» en todo el laboratorio, así que
  // aquí tiene que querer decir lo mismo. Mirando sólo `undefined`, un `null` se
  // colaba como cero grados y devolvía unas resistencias sanas un 8 % altas SIN
  // dar ningún error: quien las comparara con las del ensayo vería una
  // diferencia que no existe.
  sanas(TC){ return resistenciasSanas(VH(),
    (TC===undefined||TC===null)?SITIO().TC:TC); },
  // Lo que las piezas del vano DICEN: de una textura no se lee texto, y el 3D
  // también puede regalar la respuesta de un reto a ciegas.
  get rotulos(){ return PARTS.map(p=>p.rot).concat(['bloque','larguero',
    'bandeja','testigo']); },
  get retoCfg(){ return {falla:RETO.falla, veh:RETO.veh, sitio:RETO.sitio,
    aceite:RETO.aceite, medido:Object.keys(RETO.medido),
    lecturas:Object.assign({},RETO.medido),
    elegido:RETO.elegido, veredicto:RETO.veredicto, vivas:retoVivas()}; },
  mide(k){ mide(k); },
  elige(k){ eligeFalla(k); },
  entrega(){ entrega(); return RETO.veredicto==='ok'; },
  armaCaso(falla,o){ o=o||{};
    RETO.falla=falla;
    if(o.veh&&VEHS[o.veh]){ RETO.veh=o.veh; RETO.vehRot=VEHS[o.veh].corto;
      RETO.bat=VEHS[o.veh].bat.cca; }
    if(o.sitio){ const E=ESCENARIOS.find(x=>x.k===o.sitio);
      if(E){ RETO.sitio=E.k; RETO.sitioRot=E.rot; } }
    if(o.aceite&&ACEITES[o.aceite]) RETO.aceite=o.aceite;
    RETO.medido={}; RETO.elegido=null; RETO.veredicto=null;
    invalida(); pinta(); refrescaPregunta(); },
  monta(){ autoAssemble(); },
  // Los mandos. Hacen EXACTAMENTE lo que hace un dedo sobre la barra de vistas:
  // si se saltaran `setMode`, la Capa 2 estaría probando un camino que ningún
  // alumno recorre.
  setMode(m){ setMode(m); },
  setVeh(k){ cambiaVehiculo(k); },
  setFalla(f){ if(!FALLAS[f]) return false; G.falla=f; G.resuelto=false;
    afterEdit(); refrescaPregunta(); return true; },
  setCfg(o){ o=o||{};
    if(o.sitio&&ESCENARIOS.some(E=>E.k===o.sitio)) G.sitio=o.sitio;
    if(o.aceite&&ACEITES[o.aceite]) G.aceite=o.aceite;
    if(o.falla&&FALLAS[o.falla]) G.falla=o.falla;
    afterEdit(); refrescaPregunta(); },
  desmonta(){ initAssembly(); afterEdit(); },
  get K(){ return {MODES:MODES.slice(), FALLAS:FALLA_KEYS.slice(),
    VEHS:VEH_KEYS.slice(), PIEZAS:ORDEN.slice(), INSTR:INSTR_KEYS.slice(),
    ACEITES:ACEITE_KEYS.slice(), SITIOS:ESC_KEYS.slice(),
    TRAMOS:TRAMO_KEYS.slice(),
    CONEXION:TRAMOS.filter(t=>t.conexion).map(t=>t.k),
    LIM:{conexion:LIM_CONEXION, positivo:LIM_POSITIVO, masa:LIM_MASA, cable:EXCESO_CABLE},
    RESOL:Object.assign({},RESOL),
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
  // Y caza mallas con el material POR DEFECTO de three.js, que es lo que queda
  // cuando el nombre del material está mal escrito: `MAT.banco` no existía y la
  // mesa de montaje salía de un blanco cegador, sin luz, comiéndose la escena.
  // El centinela de arriba no puede verlo —ese material es válido—, y en esta
  // escena todo es MeshStandardMaterial salvo el lienzo del pizarrón.
  get materialesPorDefecto(){
    const malas=[];
    scene.traverse(o=>{
      if(!o.isMesh||!o.material||o.material===btexMat) return;
      const m=o.material;
      if(m.isMeshBasicMaterial&&!m.map&&m.color&&m.color.getHex()===0xffffff)
        malas.push(o.type+':'+(o.name||o.userData.id||'?'));
    });
    return malas;
  },
  // Y caza posiciones NaN, que es como el banco de piezas se quedó una tarde
  // entera fuera de la escena sin dar un solo error por consola.
  get posicionesNaN(){
    const malas=[];
    scene.traverse(o=>{ const p=o.position;
      if(!isFinite(p.x)||!isFinite(p.y)||!isFinite(p.z))
        malas.push(o.type+':'+(o.name||o.userData.id||'?')); });
    return malas;
  },
  // Una pieza puede estar en la escena, con su material bueno y sin un solo NaN,
  // y aun asi estar en el sitio equivocado. Pasa cuando se le declara un ancla
  // que no es la suya: la pieza y su hueco fantasma se van juntos a donde diga
  // el ancla, y en el 3D no salta nada.
  get piezasDescolocadas(){
    const malas=[];
    for(const o of montadas.concat(fantasmas)){
      const d=posDe(o.userData.id,o).distanceTo(o.position);
      if(d>0.20) malas.push(o.userData.id+':'+d.toFixed(2));
    }
    return malas;
  },
  // Y el centinela hermano: un rotulo tiene que estar ENCIMA de su pieza. Si se
  // anade al grupo antes de centrarlo, `centra` se lo lleva al subgrupo
  // desplazado y el letrero acaba en el origen del mundo. La pieza se ve bien,
  // el letrero se ve bien, y estan a un metro el uno del otro: por separado no
  // hay nada que mirar, y por eso hace falta medir la distancia.
  get rotulosSueltos(){
    const malos=[], v=new THREE.Vector3(), w=new THREE.Vector3();
    for(const o of montadas.concat(moviles)){
      o.getWorldPosition(v);
      o.traverse(n=>{ if(n.isSprite){ n.getWorldPosition(w);
        const d=Math.hypot(w.x-v.x, w.z-v.z);
        if(d>0.25) malos.push(o.userData.id+':'+d.toFixed(2)); } });
    }
    return malos;
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
levantaVano();
levantaBanco();
colocaTablero(dims(VH()));
initAssembly();
pintaHUD();
pinta();
refrescaPregunta();
S.setAnimate(dt=>{ PINTADAS++; anima(dt); });
S.start();
{ const t=camConjunto(MARGEN.ensamble); S.moveTo(t[0],t[1],0.01); }
addEventListener('resize',()=>{ S.resize();
  const t=camConjunto(MARGEN[G.modo]||1.00); S.moveTo(t[0],t[1],0.4); });
