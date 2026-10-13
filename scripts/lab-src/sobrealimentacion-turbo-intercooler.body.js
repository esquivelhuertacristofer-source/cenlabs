/* ============================================================
   LAB — SOBREALIMENTACIÓN: TURBO, VÁLVULA DE DESCARGA E INTERCOOLER (d6-13)
   VERSIÓN DE ESCAPARATE.

   Un turbo de corte de taller sobre su banco: las dos carcasas, el cuerpo
   central y el bajante del escape están seccionados por el plano de su eje,
   como los turbos de formación, y se conserva la mitad de atrás. Por el corte
   se ven la rueda del compresor —álabes curvados hacia atrás y divisores—, la
   de la turbina, los cojinetes, las caracolas cuya sección crece (o mengua)
   a lo largo de la vuelta y la trampilla de la descarga. El intercooler está
   cortado por su plano medio y los manguitos de carga son de vidrio.

   Por dentro corre el gas. Cada partícula es una porción de MASA FIJA que
   avanza con la velocidad de continuidad v = ṁ/(ρ·A) de cada tramo, y se tiñe
   con la temperatura que el modelo da en ese tramo: T₂ = T₁·[1 + (π^((γ−1)/γ) − 1)/η_c]
   a la salida del compresor, T₃ = T₂ − ε·(T₂ − T_amb) tras el intercooler, y
   el escape con el balance de la turbina. Las ruedas giran a las vueltas que
   resuelve el equilibrio del eje. Las gráficas y las cifras viven en el dock
   de la derecha y salen del mismo estado, en el mismo fotograma.

   El motor sellado (secciones 1 a 13) no se toca. La sección 14 —lo que la
   escena pinta: estaciones, escape, colores y partículas— está dentro del
   mismo bloque y la prueba de la física la prueba también.
   ============================================================ */
const mount=document.getElementById('stage');
// La exposición es la que da por hecha la escala de color de las partículas
// (`linealPara(…, EXPO)`): si se cambia una, hay que cambiar la otra.
const EXPO=1.0;
const S=createStage(mount,{cam:[2.4,3.1,7.6],target:[0,1.05,0.45],
  bgTop:'#141c25',bgBot:'#04070a',bloom:0.30,minD:1.2,maxD:16,exposure:EXPO,envInt:0.95});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:960,Q:0.70});
// `clamp` NO se declara aquí: lo declara el motor sellado que se empalma justo
// debajo, y declararlo dos veces es un SyntaxError que mata la página entera
// antes de que exista window.__labDebug. Lo mismo con `cv`, que es del molde.
const el=id=>document.getElementById(id);
const DEG=Math.PI/180, DOSPI=Math.PI*2;
const REDUCIDO=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const TINTA='#e8eef6', CIAN='#5ad1e6', OK_HEX='#7cd992', WARN_HEX='#e9c46a',
      BAD_HEX='#ff6b6b', GRIS='#7b8697', VIO='#b48ce0', NARANJA='#f0a05a',
      AZUL='#6ea8fe', ROSA='#f28dbb';

/* ---------- calidad: alta o media ----------
   Media: menos resolución, sombras de 1 024, sin resplandor y la mitad de
   partículas. La física no cambia. Se elige sola (móvil, pantalla estrecha o
   pocos núcleos) o con ?calidad=alta|media en la dirección. */
const CAL={nivel:'alta',motivo:''};
(function(){
  const q=(location.search.match(/[?&]calidad=(alta|media)\b/)||[])[1];
  const movil=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const nucleos=navigator.hardwareConcurrency||8;
  const flojo=movil||innerWidth<820||nucleos<=2;
  CAL.nivel=q||(flojo?'media':'alta');
  CAL.motivo=q?'elegida en la dirección':(flojo?(movil?'móvil':(innerWidth<820?'pantalla estrecha':'el equipo declara '+nucleos+' núcleos')):'');
})();
const calAlta=()=>CAL.nivel==='alta';

/* ---------- el estudio ----------
   El desenfoque de profundidad del molde se apaga (una máquina de catálogo se
   mira nítida de punta a punta). El resplandor sólo lo cogen los EMISORES de
   verdad: el umbral está por encima de la luminancia de cualquier partícula
   —la más clara, el escape a 1 320 K, da 1,51 en lineal— y de los brillos
   especulares del metal pulido, así que ni el gas ni el eje se llenan de halos. */
for(const p of S.composer.passes) if(p.materialBokeh||(p.uniforms&&p.uniforms.aperture)) p.enabled=false;
S.bloom.threshold=2.4; S.bloom.strength=0.30; S.bloom.radius=0.40;
const LUZ={};
scene.traverse(o=>{
  if(o.isDirectionalLight&&o.castShadow) LUZ.clave=o;
  else if(o.isSpotLight) LUZ.contra=o;
  else if(o.isDirectionalLight) LUZ.relleno=o;
  else if(o.isHemisphereLight) LUZ.hemi=o;
});
if(LUZ.clave){ const k=LUZ.clave; k.color.set('#fff3e6'); k.intensity=2.35; k.position.set(2.6,8.6,6.2);
  k.shadow.bias=-0.0004; k.shadow.normalBias=0.012; k.shadow.radius=4;
  Object.assign(k.shadow.camera,{left:-3.4,right:3.4,top:3.6,bottom:-3.0,near:1,far:22});
  k.shadow.camera.updateProjectionMatrix(); }
if(LUZ.contra){ LUZ.contra.color.set('#cfe2ff'); LUZ.contra.intensity=7.0; LUZ.contra.position.set(-5.5,5.6,-5.2); }
if(LUZ.relleno){ LUZ.relleno.color.set('#9fc0e0'); LUZ.relleno.intensity=0.42; LUZ.relleno.position.set(4.5,2.4,6); }
if(LUZ.hemi) LUZ.hemi.intensity=0.24;
for(const o of scene.children.slice()){
  if(!o.isMesh||!o.geometry) continue;
  if(o.geometry.type==='RingGeometry') scene.remove(o);
  else if(o.geometry.type==='CircleGeometry'&&o.geometry.parameters.radius>=30){
    o.material.color.set('#0b0e12'); o.material.roughness=0.74; o.material.metalness=0.08; o.material.envMapIntensity=0.35; }
}
/* El primer clic despierta el audio (los navegadores no dejan sonar antes). */
mount.addEventListener('pointerdown',()=>{ synth.init(); if(synth.resume) synth.resume(); },{once:true});

// ============================================================================
//  d6-13 · SOBREALIMENTACIÓN: TURBO, WASTEGATE E INTERCOOLER — MOTOR SELLADO
//
//  QUÉ SE MIDE
//  Un motor sobrealimentado en un banco, con el camino del aire entero a la
//  vista: filtro, compresor, intercooler, mariposa, cilindros, turbina y
//  válvula de descarga. Lo que se mide es la presión y la temperatura en cada
//  punto del camino, el sitio donde el compresor está trabajando dentro de su
//  MAPA, y la masa de aire que de verdad entra al cilindro — que es lo único
//  que da par.
//
//  LA TESIS. Un turbo no da potencia: da DENSIDAD. Y la densidad es presión
//  ENTRE temperatura, así que la mitad de lo que el compresor gana comprimiendo
//  se pierde calentando. El intercooler no es un accesorio de confort: es la
//  pieza que convierte esa presión en masa. Sin él, subir el soplado deja de
//  dar par mucho antes de lo que la presión sugiere, y empieza a picar.
//
//  CÓMO SE RESUELVE
//  · El compresor se lee de un MAPA cerrado: para cada velocidad reducida hay
//    una elipse de relación de presiones contra gasto corregido, con su línea
//    de bombeo y su línea de bloqueo, y unas islas de rendimiento gaussianas.
//    De ahí sale η del compresor, y de η sale la temperatura de salida.
//  · El eje se EQUILIBRA: la potencia que la turbina saca del escape tiene que
//    ser exactamente la que el compresor gasta. La válvula de descarga es la
//    que sobra: se abre lo justo para que el equilibrio caiga en la consigna.
//    Si con la descarga cerrada la turbina todavía no da bastante, la presión
//    NO llega — y eso es el retardo del turbo a bajas vueltas, que aquí no se
//    afirma: sale de resolver el equilibrio.
//  · La turbina traga por una ley de tobera: el gasto que le entra fija la
//    contrapresión, y la contrapresión se paga en el rendimiento volumétrico.
//  · El intercooler es un intercambiador con efectividad y con pérdida de
//    carga. Las dos cosas: enfría, y estorba.
//  · El límite de detonación cierra el argumento. Con la temperatura de la
//    mezcla al final de la compresión y el octanaje del combustible sale un
//    soplado máximo, y ése es el que manda cuando el intercooler no está.
//
//  QUÉ NO SE MODELA (y se declara)
//  · La geometría variable de la turbina con su ley de mando. Aquí la turbina
//    tiene una sección efectiva fija por arquetipo y una válvula de descarga.
//  · El transitorio del colector de admisión. El retardo que se calcula es el
//    del EJE (su inercia contra el par neto), no el llenado del volumen.
//  · La combustión. El par sale de la masa de aire por ciclo y de un
//    rendimiento indicado, no de resolver el ciclo.
//  · La acústica: ni el silbido del compresor ni el golpe de la válvula de
//    alivio, que aquí sólo se nombran.
//  · La lubricación y la refrigeración del turbo, y por tanto la coquización
//    del aceite, que es la causa real de la mitad de los turbos muertos.
//
//  FUENTES ANCLA
//  · Watson, N. y Janota, M. S., «Turbocharging the Internal Combustion
//    Engine» — mapas de compresor y turbina, equilibrio del eje, bombeo.
//  · Heywood, J. B., «Internal Combustion Engine Fundamentals» — rendimiento
//    volumétrico, contrapresión de escape, detonación y su dependencia de la
//    temperatura de la carga.
//  · Robert Bosch GmbH, «Automotive Handbook» — sobrealimentación, refrigeración
//    del aire de admisión y regulación de la presión de soplado.
//  · SAE J1826 — ensayo y presentación de mapas de compresor de turbocompresor.
//  · Kays, W. M. y London, A. L., «Compact Heat Exchangers» — efectividad-NTU
//    del intercambiador de flujos cruzados del intercooler.
// ============================================================================

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

// ============================================================================
// 1 · EL AIRE
// ============================================================================
const R_AIRE = 287.05;      // J/(kg·K)
const CP_AIRE = 1005;       // J/(kg·K)
const G_AIRE = 1.400;
const K_AIRE = (G_AIRE - 1) / G_AIRE;          // 0,2857
// El gas de escape es más pesado y menos «duro»: por eso una misma relación de
// expansión da menos trabajo por kilo del que costó comprimir.
const CP_ESC = 1150, G_ESC = 1.330;
const K_ESC = (G_ESC - 1) / G_ESC;             // 0,2481

const P_REF = 101325, T_REF = 298.15;          // condiciones de referencia SAE J1826

function densidad(p, T) { return p / (R_AIRE * T); }

// La atmósfera cambia con la altitud, y esto es México: la Ciudad de México
// está a 2 240 m y la presión ambiente es el 76 % de la del nivel del mar. Un
// turbo lo compensa —por eso un coche sobrealimentado pierde mucha menos
// potencia en altura que uno atmosférico—, pero lo compensa TRABAJANDO MÁS.
function presionAmbiente(alt) {
  return P_REF * Math.pow(1 - 2.25577e-5 * alt, 5.25588);
}

// ============================================================================
// 2 · EL MAPA DEL COMPRESOR
// ============================================================================
// No es una tabla: es un mapa cerrado, y cada línea de velocidad reducida es
// una elipse. Ese modelo reproduce lo que importa de un mapa real —que subir la
// relación de presiones cierra el margen contra el bombeo, que el bloqueo pone
// un techo al gasto, y que el rendimiento tiene una isla— sin necesitar 400
// puntos medidos que no tenemos.
function correGasto(m, p1, T1) {              // gasto corregido, kg/s
  return m * Math.sqrt(T1 / T_REF) / (p1 / P_REF);
}
function correVel(N, T1) {                    // velocidad corregida, rpm
  return N / Math.sqrt(T1 / T_REF);
}
// Para una velocidad reducida u ∈ [0,1]: el tope de relación de presiones y el
// gasto de bloqueo de esa línea.
function piMax(e, u) { return 1 + (e.piMax - 1) * Math.pow(clamp(u, 0, 1.15), 1.85); }
function mChoke(e, u) { return e.mChoke * Math.pow(clamp(u, 0.02, 1.15), 0.85); }
// La línea de bombeo NO es una fracción fija del bloqueo: es una curva en el
// plano (gasto, relación de presiones), y sube con la relación de presiones.
// Ponerla como fracción constante de la línea de velocidad hacía que un 1.4 a
// 1 500 rpm apareciera bombeando cuando lo que hace es vivir CERCA del bombeo,
// que es distinto y es la mitad de lo que esta práctica enseña.
function mBombeo(e, pi) {
  return e.mChoke * e.cBombeo * Math.pow(Math.max(0, pi - 1), 0.72);
}
// La elipse: dado el gasto y la velocidad reducida, la relación de presiones.
function piDe(e, m, u) {
  const mc = mChoke(e, u);
  if (m >= mc) return 1;
  const f = 1 - Math.pow(m / mc, 3);
  return 1 + (piMax(e, u) - 1) * Math.sqrt(Math.max(0, f));
}
// Y al revés, que es como se usa: sé qué relación de presiones necesito y qué
// gasto tengo; ¿a qué velocidad tiene que girar el compresor?
function uPara(e, m, pi) {
  let lo = 0.02, hi = 1.60;
  if (piDe(e, m, hi) < pi) return null;        // no llega ni a tope de vueltas
  for (let i = 0; i < 46; i++) {
    const mid = (lo + hi) / 2;
    if (piDe(e, m, mid) < pi) lo = mid; else hi = mid;
  }
  return hi;
}
// El rendimiento isentrópico: dos gaussianas, una en el gasto relativo al
// bloqueo de su línea y otra en la velocidad. De ahí sale la isla.
function etaComp(e, m, u) {
  const mc = mChoke(e, u);
  const x = mc > 0 ? m / mc : 0;
  const a = (x - 0.64) / 0.46, b = (u - 0.74) / 0.55;
  return clamp(e.etaMax * Math.exp(-(a * a + b * b) * 0.70), 0.30, e.etaMax);
}
// La temperatura de salida del compresor. Ésta es la mitad de la práctica: un
// compresor perfecto ya calienta, y uno real calienta el doble.
function T2de(T1, pi, eta) {
  return T1 * (1 + (Math.pow(pi, K_AIRE) - 1) / Math.max(0.10, eta));
}
function potenciaComp(m, T1, pi, eta) {
  return m * CP_AIRE * T1 * (Math.pow(pi, K_AIRE) - 1) / Math.max(0.10, eta);
}

// ============================================================================
// 3 · EL INTERCOOLER
// ============================================================================
// Enfría Y estorba. Las dos cosas a la vez, y por eso hay un tamaño óptimo:
// uno demasiado grande baja tanto la presión que se come lo que ganó bajando
// la temperatura.
function epsilonIC(e, m, vAire, F) {
  const suciedad = F.icSucio ? 0.55 : 1;
  if (F.sinIC) return 0;
  // NTU sube con la superficie y baja con el gasto; el aire de marcha ayuda.
  // El aire de marcha se refiere a 60 km/h, que es donde se ajusta `icNTU`: con
  // la referencia en 22 la efectividad salia del 90 % en un intercooler de
  // turismo, y eso es mas de lo que da un aire-aire de serie. Ahora a 60 km/h da
  // 86 %, a 110 sube y en ciudad, a 20, se cae al 74 % — que es exactamente la
  // razon de que un coche muy soplado sufra parado en un atasco.
  const NTU = e.icNTU * suciedad * Math.pow(clamp(vAire / 60, 0.30, 2.0), 0.42)
    / Math.pow(Math.max(0.008, m) / e.mRef, 0.55);
  // Flujos cruzados con los dos fluidos sin mezclar (Kays & London).
  const Cr = 0.30;
  return clamp(1 - Math.exp((Math.pow(NTU, 0.22) / Cr) * (Math.exp(-Cr * Math.pow(NTU, 0.78)) - 1)),
    0, 0.96);
}
function dpIC(e, m, F) {
  if (F.sinIC) return 0;
  const suciedad = F.icSucio ? 2.6 : 1;
  return e.icDp * suciedad * Math.pow(Math.max(0, m) / e.mRef, 1.85);
}
// El filtro de aire estorba a la ENTRADA, que es donde más caro sale: cada
// milibar que falta ahí el compresor lo tiene que poner con más vueltas.
function dpFiltro(e, m, F) {
  const suciedad = F.filtroSucio ? 7.0 : 1;
  return e.dpFiltro * suciedad * Math.pow(Math.max(0, m) / e.mRef, 1.85);
}

// ============================================================================
// 4 · EL MOTOR COMO BOMBA
// ============================================================================
// El rendimiento volumétrico no es una constante del motor: baja con la
// contrapresión de escape, que es justo lo que la turbina crea. Ése es el
// precio del turbo, y sin él la práctica mentiría a favor del turbo.
function etaVol(e, rpm, pAdm, pEsc) {
  // La parábola va en régimen NORMALIZADO al recorrido del motor, no en
  // múltiplos del régimen de par máximo: con lo segundo, un motor que gira
  // hasta 2,5 veces su par máximo se topaba en el suelo del clamp y la curva
  // salía con un escalón que no existe en ningún banco.
  const x = (rpm - e.rpmPar) / Math.max(1, e.rpmMax - e.rpmRal);
  const forma = 1 - 0.30 * x * x;
  // Y el barrido: cuanto más contrapresión deja la turbina, más gas quemado se
  // queda dentro. Es el precio del turbo y aquí se cobra.
  const barrido = 1 - 0.22 * clamp(pEsc / Math.max(1e3, pAdm) - 1, -0.4, 3.0);
  return clamp(e.etaVolMax * clamp(forma, 0.55, 1.03) * barrido, 0.30, 1.05);
}
function gastoAire(e, rpm, pAdm, TAdm, pEsc) {
  const rho = densidad(pAdm, TAdm);
  const ciclosPorSeg = (rpm / 60) / 2;
  return etaVol(e, rpm, pAdm, pEsc) * e.cilindrada * 1e-3 * ciclosPorSeg * rho;   // kg/s
}

// ============================================================================
// 5 · LA TURBINA Y LA VÁLVULA DE DESCARGA
// ============================================================================
// La turbina traga por una ley de tobera: el gasto que le mandan FIJA la
// presión que hay delante de ella. Por eso una turbina pequeña sopla antes y
// ahoga después, y por eso la válvula de descarga existe.
function fiTobera(pi) {                       // función de gasto, normalizada
  const p = clamp(pi, 1.0001, 6);
  const f = Math.sqrt(1 - 1 / (p * p));
  return f;
}
// La turbina y la válvula de descarga son DOS toberas EN PARALELO alimentadas
// por la misma presión. De ahí sale todo: la contrapresión la fija el área
// total, y la potencia sólo la da el gasto que pasa por la turbina.
function presionDelante(Atot, mEsc, T3, pSalida) {
  let lo = pSalida, hi = pSalida * 12;
  for (let i = 0; i < 52; i++) {
    const p3 = (lo + hi) / 2;
    const m = Atot * p3 / Math.sqrt(T3) * fiTobera(p3 / pSalida);
    if (m < mEsc) lo = p3; else hi = p3;
  }
  return hi;
}
function potenciaTurbina(mT, T3, piT, eta) {
  return mT * CP_ESC * T3 * eta * (1 - Math.pow(1 / Math.max(1.0001, piT), K_ESC));
}
// El equilibrio del eje: se busca la apertura de la descarga con la que la
// turbina da EXACTAMENTE lo que el compresor gasta. Si con la descarga cerrada
// todavía no llega, se devuelve lo que hay y quien llama baja la consigna: eso
// es el retardo del turbo, y no está escrito en ninguna constante.
function equilibraEje(e, mEsc, T3, pSalida, Pc, etaT, F) {
  const At = e.aTurbina * (F.escapeTapado ? 0.52 : 1);
  const Awg = e.aWastegate;
  const potPara = x => {
    const Atot = At + Awg * x;
    const p3 = presionDelante(Atot, mEsc, T3, pSalida);
    const mT = mEsc * At / Atot;
    const piT = p3 / pSalida;
    return { x, p3, piT, mT, Pt: potenciaTurbina(mT, T3, piT, etaT) };
  };
  // Averías que fijan la apertura por su cuenta.
  if (F.wgAbierta) return Object.assign(potPara(1), { forzada: 'abierta' });
  if (F.wgPegada) return Object.assign(potPara(0), { forzada: 'cerrada' });
  const cerrada = potPara(0);
  if (cerrada.Pt <= Pc) return Object.assign(cerrada, { faltaPotencia: true });
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (potPara(mid).Pt > Pc) lo = mid; else hi = mid;
  }
  return Object.assign(potPara(lo), { faltaPotencia: false });
}
// La temperatura delante de la turbina. Sale del aire que entra y de lo que la
// combustión le añade, que crece con la carga y con el régimen. `dTComb` es,
// por construcción, el salto a PLENA CARGA y régimen máximo: un motor de
// gasolina pone ahí 880-920 K —900 °C delante de la turbina— y un diésel, con
// mucho más aire por gramo de combustible, se queda 200 K por debajo.
function T3de(e, TAdm, carga, rpm) {
  const salto = e.dTComb * (0.42 + 0.58 * carga) * (0.86 + 0.14 * clamp(rpm / e.rpmMax, 0, 1.2));
  return TAdm + salto;
}

// ============================================================================
// 6 · LA DETONACIÓN
// ============================================================================
// Cierra el argumento de la práctica: la temperatura de la mezcla al final de
// la compresión sale de la de admisión por la misma relación politrópica del
// d6-01, y la detonación aparece cuando esa temperatura pasa de un umbral que
// depende del octanaje. En diésel no aplica —ahí la autoinflamación es lo que
// se busca—, y por eso un diésel puede soplar mucho más.
const N_POLI = 1.34;
function Tcompresion(e, TAdm) {
  return TAdm * Math.pow(e.rc, N_POLI - 1);
}
function Tdetona(e, octanaje) {
  if (e.diesel) return 1e9;
  return 720 + 7.4 * (octanaje - 87);          // K
}
// Y de ahí sale el soplado máximo que este combustible aguanta en este motor.
// Devuelve la RELACIÓN DE PRESIONES máxima que este combustible tolera en este
// motor con este intercooler. El aire entra al compresor a la temperatura
// ambiente, así que T1 y la temperatura del aire de refrigeración del
// intercooler son la misma: por eso sólo hace falta un argumento de
// temperatura. El rendimiento que se usa es el del PUNTO, no el mejor del
// mapa: un compresor trabajando fuera de su isla calienta más para la misma
// presión, y eso adelanta la detonación.
function piMaxDetona(e, T1, octanaje, epsIC, etaC) {
  if (e.diesel) return 1e9;
  const Tlim = Tdetona(e, octanaje);
  const TAdmLim = Tlim / Math.pow(e.rc, N_POLI - 1);
  // Se invierte el intercooler: qué T2 admite ese TAdm.
  const T2lim = epsIC >= 0.999 ? T1 : (TAdmLim - epsIC * T1) / (1 - epsIC);
  if (T2lim <= T1) return 1;
  const pi = Math.pow(1 + (T2lim / T1 - 1) * clamp(etaC, 0.25, 0.90), 1 / K_AIRE);
  return Math.max(1, pi);
}

// ============================================================================
// 7 · EL PUNTO DE FUNCIONAMIENTO: SE RESUELVE, NO SE DECLARA
// ============================================================================
// El bucle exterior busca la presión de soplado; el interior cierra el camino
// del aire —el gasto depende de la presión de admisión y la presión de admisión
// de la pérdida del intercooler, que depende del gasto— y el equilibrio del eje
// decide si esa presión es alcanzable. Si con la descarga CERRADA la turbina no
// llega, la presión baja hasta donde el equilibrio la deje: eso es el retardo
// del turbo a bajas vueltas, y aquí no se afirma, sale.
function caminoAire(e, rpm, p2, F, C) {
  let m = C.m0, pEsc = C.pAmb * 1.35;
  let T2 = C.Tamb, TAdm = C.Tamb, eps = 0, p1 = C.pAmb, pi = 1, etaC = e.etaMax, u = null;
  for (let j = 0; j < 26; j++) {
    p1 = C.pAmb - dpFiltro(e, m, F);
    pi = Math.max(1.0001, p2 / Math.max(1e3, p1));
    const mCorr = correGasto(m, p1, C.Tamb);
    u = uPara(e, mCorr, pi);
    etaC = u === null ? 0.30 : etaComp(e, mCorr, u);
    T2 = T2de(C.Tamb, pi, etaC);
    eps = epsilonIC(e, m, C.vAire, F);
    TAdm = T2 - eps * (T2 - C.Tamb);
    let pAdm = p2 - dpIC(e, m, F) - (F.fugaCarga ? e.fugaDp : 0);
    pAdm = Math.max(C.pAmb * 0.28, pAdm);
    const mNuevo = gastoAire(e, rpm, pAdm, TAdm, pEsc);
    m += (mNuevo - m) * 0.55;
    const mE = m * (1 + 1 / e.afr);
    const T3 = T3de(e, TAdm, C.carga, rpm);
    // La contrapresión que hay AHORA mismo depende de la apertura de la
    // descarga, y ésa la decide el equilibrio: se usa la del paso anterior.
    const Atot = e.aTurbina * (F.escapeTapado ? 0.52 : 1) + e.aWastegate * C.xWG;
    pEsc = presionDelante(Atot, mE, T3, C.pAmb);
  }
  const pAdm = Math.max(C.pAmb * 0.28,
    p2 - dpIC(e, m, F) - (F.fugaCarga ? e.fugaDp : 0));
  return { m, mCorr: correGasto(m, p1, C.Tamb), u, etaC, pi, p1, p2, pAdm, T2, TAdm, eps, pEsc,
    T3: T3de(e, TAdm, C.carga, rpm), mEsc: m * (1 + 1 / e.afr) };
}

function resuelve(e, rpm, carga, F, amb) {
  F = F || {}; amb = amb || {};
  const alt = amb.alt === undefined ? 0 : amb.alt;
  const Tamb = (amb.Tamb === undefined ? 25 : amb.Tamb) + 273.15;
  const vAire = amb.vAire === undefined ? 60 : amb.vAire;
  const octanaje = amb.octanaje === undefined ? 91 : amb.octanaje;
  const pAmb = presionAmbiente(alt);
  const etaT = e.etaTurbina * (F.turboGastado ? 0.72 : 1);
  const etaMec = e.etaMecEje * (F.turboGastado ? 0.86 : 1);
  const C = { pAmb, Tamb, vAire, carga, m0: e.mRef * Math.max(0.08, carga), xWG: 0.25 };

  // La consigna del ordenador es de presión ABSOLUTA de colector, referida al
  // nivel del mar: `sopladoObj` es lo que el motor sopla en el llano, y en
  // altura el ordenador pide LA MISMA PRESIÓN ABSOLUTA. Por eso un turbo
  // recupera en Toluca casi todo lo que un atmosférico pierde —y por eso el
  // turbo gira mucho más deprisa allí, que es lo que hay que enseñar—. El
  // límite sigue siendo el soplado máximo del sistema en manométrico.
  const pAbsObj = (P_REF + e.sopladoObj * carga);
  const pObjetivo = Math.max(pAmb, Math.min(pAbsObj, pAmb + e.sopladoMax * carga));

  // El control de picado. Con una pasada previa del camino del aire se sabe qué
  // efectividad tiene el intercooler y con qué rendimiento comprime; de ahí sale
  // la relación de presiones que el combustible tolera. El ordenador NO deja
  // detonar: baja la consigna hasta ahí. La pérdida de par es la consecuencia,
  // y no hay código de avería que la delate.
  // El lazo se recorre TRES veces porque la efectividad del intercooler y el
  // rendimiento del compresor cambian al bajar la consigna, y con ellos el
  // propio límite: con una sola pasada el motor se quedaba 11 K por encima del
  // umbral, o sea seguía detonando después de que el control lo hubiera
  // «arreglado».
  let pDeton = Infinity, piDeton = Infinity;
  if (!e.diesel) {
    let pPrueba = pObjetivo;
    for (let i = 0; i < 3; i++) {
      const A0 = caminoAire(e, rpm, pPrueba, F, C);
      piDeton = piMaxDetona(e, Tamb, octanaje, A0.eps, A0.etaC);
      pDeton = Math.max(pAmb, A0.p1 * piDeton);
      pPrueba = Math.min(pObjetivo, pDeton);
    }
  }

  // Bisección sobre la presión de soplado: la mayor que el eje sostiene, sin
  // pasar de la consigna. Es monótona —más presión pide más potencia y da menos
  // margen— así que la bisección es legítima y converge en veinte pasos.
  const alcanzable = p2 => {
    const A = caminoAire(e, rpm, p2, F, C);
    const Pc = potenciaComp(A.m, Tamb, A.pi, A.etaC) / Math.max(0.5, etaMec);
    const EJ = equilibraEje(e, A.mEsc, A.T3, pAmb, Pc, etaT, F);
    return { A, Pc, EJ, ok: !EJ.faltaPotencia };
  };
  let techo = F.wgAbierta ? pAmb
    : (F.wgPegada ? pAmb + e.sopladoMax * 1.35 : Math.min(pObjetivo, pDeton));
  techo = Math.max(techo, pAmb);
  // La apertura de la descarga cambia la contrapresión, la contrapresión cambia
  // el gasto y el gasto cambia la apertura: el lazo se recorre TRES veces
  // realimentando la apertura, o la cifra que se publica es la de otra
  // apertura que la que se dice —lo que hacía la primera versión, que sacaba
  // una potencia de turbina distinta de la del compresor en el mismo punto—.
  let R = null;
  for (let pasada = 0; pasada < 3; pasada++) {
    R = alcanzable(techo);
    if (!R.ok) {
      let lo = pAmb, hi = techo;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        if (alcanzable(mid).ok) lo = mid; else hi = mid;
      }
      R = alcanzable(lo);
    }
    C.xWG = R.EJ.x;
  }
  const A = R.A, Pc = R.Pc, EJ = R.EJ;
  return Object.assign({}, A, { Pc, Pt: EJ.Pt, piT: EJ.piT, xWG: EJ.x, mT: EJ.mT,
    pEsc: EJ.p3, pAmb, Tamb, vAire, alt, faltaPotencia: !!EJ.faltaPotencia,
    forzada: EJ.forzada || null, pObjetivo, pAbsObj, pDeton, piDeton, octanaje,
    // Se recorta por picado cuando el límite del combustible manda de verdad,
    // es decir cuando está por debajo de la consigna y por encima del ambiente.
    limitadoDeton: !e.diesel && pDeton < pObjetivo - 1e3 && !F.wgPegada && !F.wgAbierta });
}

// ============================================================================
// 8 · LO QUE SALE DE UN PUNTO DE FUNCIONAMIENTO
// ============================================================================
// El par sale de la MASA de aire por ciclo, no de la presión: ésa es la frase
// que esta práctica existe para demostrar.
function paresDe(e, rpm, carga, F, amb) {
  const S = resuelve(e, rpm, carga, F, amb);
  const ciclosPorSeg = (rpm / 60) / 2;
  const masaPorCiclo = S.m / Math.max(1e-9, ciclosPorSeg);      // kg de aire por ciclo
  // Combustible que ese aire admite, y trabajo indicado. El rendimiento
  // indicado baja un poco con la carga por la refrigeración de la cámara.
  const mComb = masaPorCiclo / e.afr;
  const eta_i = e.etaInd * (1 - 0.06 * clamp(carga, 0, 1));
  const W = mComb * e.pci * eta_i;                              // J por ciclo
  // Bombeo: lo que cuesta respirar contra la contrapresión.
  const Wbomb = (S.pEsc - S.pAdm) * e.cilindrada * 1e-3;
  // Un ciclo de cuatro tiempos son DOS vueltas, o sea 4π radianes. El par
  // indicado medio es el trabajo del ciclo dividido por 4π y nada más: el ×2
  // que había aquí duplicaba el par y ponía 547 N·m en un 1.4 de gasolina.
  const parInd = (W - Wbomb) / (4 * Math.PI);                   // N·m
  const parFric = e.parFric * (0.72 + 0.28 * rpm / e.rpmPar);
  const par = Math.max(0, parInd - parFric);
  const pot = par * rpm * 2 * Math.PI / 60 / 1000;              // kW

  // Los tres límites que pueden estar mandando, y cuál manda de verdad.
  const octanaje = (amb && amb.octanaje) !== undefined ? amb.octanaje : 91;
  const Tcomp = Tcompresion(e, S.TAdm);
  const Tdet = Tdetona(e, octanaje);
  // Cuando el control de picado ha hecho su trabajo el motor se queda JUSTO en
  // el umbral, así que Tcomp ≈ Tdet por construcción: afirmar «detona» ahí sería
  // afirmar el residuo numérico del lazo que baja la consigna. Se declaran
  // 8 K de tolerancia —el residuo medido es de 2— y se separan las dos cosas:
  // `limitadoDeton` es que el ordenador te quitó presión para que no detonaras,
  // y `detona` es que ni quitándotela lo consiguió.
  const margenPicado = Tdet > 1e8 ? null : Tdet - Tcomp;
  const detona = Tcomp > Tdet + 8;
  // Los avisos del mapa sólo tienen sentido donde hay mapa. Con la descarga
  // abierta de par en par la relación de presiones es 1, el compresor está
  // girando en vacío y la velocidad reducida que sale de invertir el mapa es
  // cualquiera: allí no se afirma ni bombeo ni bloqueo.
  const enMapa = S.pi > 1.12 && S.u !== null;
  const mSurge = mBombeo(e, S.pi);
  const bombeo = enMapa && S.mCorr < mSurge;
  const margenBombeo = (enMapa && mSurge > 0) ? S.mCorr / mSurge - 1 : null;
  const bloqueo = enMapa && S.mCorr > mChoke(e, S.u) * 0.985;
  // El 2 % es la tolerancia del propio modelo, no una holgura del fabricante:
  // con el umbral en el 6 % un eje a 232 684 rpm sobre un límite de 220 000 no
  // levantaba el aviso, y ése es exactamente el caso de la descarga pegada.
  const sobreVel = enMapa && S.u > 1.02;
  const sobreT3 = S.T3 > e.T3Max;
  const sobrePresion = (S.p2 - S.pAmb) > e.sopladoMax * 1.02;

  return {
    ...S, rpm, carga, par, pot, masaPorCiclo, mComb, Wbomb, parInd, parFric,
    soplado: S.p2 - S.pAmb, sopladoAdm: S.pAdm - S.pAmb,
    rhoAdm: densidad(S.pAdm, S.TAdm), rhoSinIC: densidad(S.pAdm, S.T2),
    Tcomp, Tdet, margenPicado, detona, bombeo, bloqueo, sobreVel, sobreT3, sobrePresion,
    piMaxLinea: S.u === null ? null : piMax(e, S.u),
    mChokeLinea: S.u === null ? null : mChoke(e, S.u),
    mBombeoLinea: mSurge, margenBombeo,
    nTurbo: S.u === null ? null : S.u * e.nMax,
  };
}

// ============================================================================
// 9 · EL RETARDO DEL TURBO
// ============================================================================
// La inercia del eje contra el par neto. No es «el turbo tarda»: es que hasta
// que el eje no coge vueltas no hay presión, y las vueltas cuestan energía que
// sólo el escape puede dar. Se integra desde el régimen de ralentí del turbo
// hasta el equilibrio, con la carga puesta de golpe.
const DT_TRANS = 0.004, T_TRANS = 4.0;
// El mando de la descarga: proporcional, integral y actuador con velocidad de
// carrera limitada. No es un adorno: sin la limitación de carrera el mando
// abre y cierra en un paso de integración y el sobreimpulso desaparece.
const WG_KP = 2.6, WG_KI = 14.0, WG_SLEW = 7.0;
function transitorio(e, rpm, F, amb) {
  F = F || {}; amb = amb || {};
  const etaT = e.etaTurbina * (F.turboGastado ? 0.72 : 1);
  const etaMec = e.etaMecEje * (F.turboGastado ? 0.86 : 1);
  const pAmb = presionAmbiente(amb.alt === undefined ? 0 : amb.alt);
  const Tamb = (amb.Tamb === undefined ? 25 : amb.Tamb) + 273.15;
  const vAire = amb.vAire === undefined ? 60 : amb.vAire;
  const At = e.aTurbina * (F.escapeTapado ? 0.52 : 1);
  const objetivo = e.sopladoObj;

  // Punto de partida: el motor girando a ese régimen SIN pisar, o sea el turbo
  // en vacío. Se pisa a fondo en t = 0 y el régimen se mantiene —es un banco de
  // rodillos, no una aceleración libre—.
  let n = e.nMax * 0.11, xWG = 0, integ = 0;
  let m = e.mRef * 0.18;
  const pts = [];
  let tSopla = null, sopladoPico = 0, tPico = 0;
  const pasos = Math.round(T_TRANS / DT_TRANS);
  for (let k = 0; k <= pasos; k++) {
    const t = k * DT_TRANS;
    const u = n / e.nMax;
    // El camino del aire con la velocidad de eje que hay AHORA. El compresor
    // da lo que su mapa da: aquí no se le pone techo, el techo lo pone la
    // descarga abriendo.
    let p2 = pAmb, TAdm = Tamb, T2 = Tamb, etaC = 0.5, p1 = pAmb, pAdm = pAmb, pi = 1;
    for (let j = 0; j < 16; j++) {
      p1 = pAmb - dpFiltro(e, m, F);
      const mCorr = correGasto(m, p1, Tamb);
      pi = Math.max(1.0001, piDe(e, mCorr, u));
      p2 = p1 * pi;
      etaC = etaComp(e, mCorr, u);
      T2 = T2de(Tamb, pi, etaC);
      const eps = epsilonIC(e, m, vAire, F);
      TAdm = T2 - eps * (T2 - Tamb);
      pAdm = Math.max(pAmb * 0.28,
        p2 - dpIC(e, m, F) - (F.fugaCarga ? e.fugaDp : 0));
      const mNuevo = gastoAire(e, rpm, pAdm, TAdm, pAmb * 1.6);
      m += (mNuevo - m) * 0.55;
    }
    const Pc = potenciaComp(m, Tamb, pi, etaC) / Math.max(0.5, etaMec);
    const mEsc = m * (1 + 1 / e.afr);
    const T3 = T3de(e, TAdm, 1, rpm);
    const xUso = F.wgAbierta ? 1 : (F.wgPegada ? 0 : xWG);
    const Atot = At + e.aWastegate * xUso;
    const p3 = presionDelante(Atot, mEsc, T3, pAmb);
    const mT = mEsc * At / Atot;
    const piT = p3 / pAmb;
    const Pt = potenciaTurbina(mT, T3, piT, etaT);

    const soplado = p2 - pAmb;
    if (tSopla === null && soplado >= objetivo * 0.90) tSopla = t;
    if (soplado > sopladoPico) { sopladoPico = soplado; tPico = t; }
    if (k % 5 === 0) pts.push({ t, n, u, soplado, sopladoAdm: pAdm - pAmb, m, pi,
      xWG: xUso, Pt, Pc, p3, TAdm, T3 });

    // El eje: par neto entre inercia. Nada más.
    const w = Math.max(300, n * 2 * Math.PI / 60);
    const dn = (Pt - Pc) / (e.inerciaEje * w) * DT_TRANS * 60 / (2 * Math.PI);
    n = clamp(n + dn, e.nMax * 0.04, e.nMax * 1.60);
    // Y el mando de la descarga, con su actuador.
    const err = soplado / Math.max(1e3, objetivo) - 1;
    integ = clamp(integ + WG_KI * err * DT_TRANS, -0.6, 1.4);
    const xObj = clamp(WG_KP * err + integ, 0, 1);
    xWG = clamp(xWG + clamp(xObj - xWG, -WG_SLEW * DT_TRANS, WG_SLEW * DT_TRANS), 0, 1);
  }
  const fin = pts[pts.length - 1];
  return { pts, tSopla, sopladoPico, tPico, objetivo,
    sobreimpulso: objetivo > 0 ? sopladoPico / objetivo - 1 : 0,
    nFin: fin.n, sopladoFin: fin.soplado, xWGFin: fin.xWG, J: e.inerciaEje, rpm };
}

// ============================================================================
// 10 · LOS VEHÍCULOS
// ============================================================================
// El 1.4 de gasolina es el que enseña que el intercooler NO es un accesorio: es
// el que detona sin él. El diésel es el que enseña que sin detonación se puede
// soplar el doble. Y el V8 es el que enseña que el bloqueo del compresor existe.
const ARQ = {
  gas14t: {
    key: 'gas14t', corto: '1.4 T', nombre: 'Turismo 1.4 L turbo de gasolina, 2016',
    cilindrada: 1.4, cil: 4, rc: 10.0, diesel: false,
    etaVolMax: 0.93, rpmPar: 2400, rpmMax: 6000, rpmRal: 800,
    sopladoObj: 1.00e5, sopladoMax: 1.35e5,
    afr: 12.6, pci: 43.0e6, etaInd: 0.362, parFric: 13,
    dTComb: 880, T3Max: 1223,
    // compresor
    mChoke: 0.145, piMax: 2.75, etaMax: 0.765, cBombeo: 0.21, nMax: 220000,
    // turbina y descarga
    aTurbina: 7.4e-6, aWastegate: 4.5e-5, etaTurbina: 0.680, etaMecEje: 0.960,
    inerciaEje: 5.2e-6,
    // conducciones
    mRef: 0.10, icNTU: 1.80, icDp: 8000, dpFiltro: 2500, fugaDp: 45000,
  },
  die20t: {
    key: 'die20t', corto: 'TDI 2.0', nombre: 'Turismo 2.0 L turbodiésel, 2018',
    cilindrada: 2.0, cil: 4, rc: 16.5, diesel: true,
    etaVolMax: 0.95, rpmPar: 2000, rpmMax: 4500, rpmRal: 780,
    sopladoObj: 1.25e5, sopladoMax: 1.60e5,
    afr: 19.5, pci: 42.6e6, etaInd: 0.430, parFric: 16,
    dTComb: 700, T3Max: 1123,
    mChoke: 0.190, piMax: 3.10, etaMax: 0.755, cBombeo: 0.23, nMax: 200000,
    aTurbina: 1.02e-5, aWastegate: 5.2e-5, etaTurbina: 0.700, etaMecEje: 0.962,
    inerciaEje: 8.0e-6,
    mRef: 0.14, icNTU: 2.05, icDp: 9000, dpFiltro: 2800, fugaDp: 52000,
  },
  gas20bi: {
    key: 'gas20bi', corto: '2.0 T dep.', nombre: 'Deportivo 2.0 L de gasolina sobrealimentado, 2020',
    cilindrada: 2.0, cil: 4, rc: 9.6, diesel: false,
    etaVolMax: 0.96, rpmPar: 3000, rpmMax: 7000, rpmRal: 850,
    sopladoObj: 1.32e5, sopladoMax: 1.72e5,
    afr: 12.4, pci: 43.0e6, etaInd: 0.352, parFric: 19,
    dTComb: 920, T3Max: 1273,
    mChoke: 0.265, piMax: 3.30, etaMax: 0.780, cBombeo: 0.20, nMax: 210000,
    aTurbina: 1.28e-5, aWastegate: 7.0e-5, etaTurbina: 0.700, etaMecEje: 0.965,
    inerciaEje: 9.5e-6,
    mRef: 0.19, icNTU: 2.35, icDp: 10500, dpFiltro: 3100, fugaDp: 60000,
  },
  die66t: {
    key: 'die66t', corto: 'V8 6.6', nombre: 'Camioneta 6.6 L V8 turbodiésel, 2015',
    cilindrada: 6.6, cil: 8, rc: 16.8, diesel: true,
    etaVolMax: 0.94, rpmPar: 1900, rpmMax: 3600, rpmRal: 700,
    sopladoObj: 1.46e5, sopladoMax: 1.88e5,
    afr: 20.5, pci: 42.6e6, etaInd: 0.420, parFric: 48,
    dTComb: 690, T3Max: 1103,
    mChoke: 0.520, piMax: 3.40, etaMax: 0.760, cBombeo: 0.22, nMax: 150000,
    aTurbina: 2.90e-5, aWastegate: 1.45e-4, etaTurbina: 0.705, etaMecEje: 0.965,
    inerciaEje: 3.4e-5,
    mRef: 0.40, icNTU: 2.20, icDp: 11000, dpFiltro: 4200, fugaDp: 70000,
  },
};
const ARQ_KEYS = Object.keys(ARQ);

// ============================================================================
// 11 · LAS AVERÍAS
// ============================================================================
// Ninguna es «hace calor» ni «estamos en altura»: la temperatura ambiente, la
// altitud y el octanaje son mandos aparte, y el censo cuenta la REJILLA.
function averia(k) {
  switch (k) {
    case 'sano': return {};
    case 'sinIC': return { sinIC: true };
    case 'icSucio': return { icSucio: true };
    case 'filtroSucio': return { filtroSucio: true };
    case 'fugaCarga': return { fugaCarga: true };
    case 'wgAbierta': return { wgAbierta: true };
    case 'wgPegada': return { wgPegada: true };
    case 'escapeTapado': return { escapeTapado: true };
    case 'turboGastado': return { turboGastado: true };
    default: return {};
  }
}
const FALLAS = {
  sano: { rot: 'nada: el motor está bien', corto: 'sano',
    pista: 'Lo que se vea aquí es lo que el ambiente hace, no una avería.' },
  sinIC: { rot: 'intercooler puenteado o sin caudal de aire', corto: 'sin intercooler',
    pista: 'El compresor sopla lo de siempre, pero el aire llega caliente y por eso pesa menos: la densidad es presión entre temperatura. En gasolina, además, el control de picado baja la consigna y el colector se queda con menos presión; en diésel no.' },
  icSucio: { rot: 'intercooler obstruido por suciedad', corto: 'intercooler sucio',
    pista: 'Enfría menos Y estorba más. Las dos cosas a la vez: compara la presión a la salida del compresor con la del colector.' },
  filtroSucio: { rot: 'filtro de aire saturado', corto: 'filtro sucio',
    pista: 'Estorba en el sitio más caro: a la ENTRADA. El compresor tiene que dar la misma presión partiendo de menos, y eso lo empuja hacia el bombeo.' },
  fugaCarga: { rot: 'manguito de carga reventado', corto: 'fuga de carga',
    pista: 'El compresor sopla lo que le piden y al colector no le llega. Compara los dos manómetros: entre ellos sólo debería estar el intercooler.' },
  wgAbierta: { rot: 'válvula de descarga pegada abierta', corto: 'descarga abierta',
    pista: 'El escape se va por el atajo sin pasar por la turbina. No hay presión: el ordenador lo ve como presión baja (P0299), pero no sabe decir por qué.' },
  wgPegada: { rot: 'válvula de descarga pegada cerrada', corto: 'descarga cerrada',
    pista: 'Nada frena al turbo. La presión se dispara por encima de la consigna, y con ella la contrapresión y la temperatura antes de la turbina.' },
  escapeTapado: { rot: 'escape restringido aguas abajo de la turbina', corto: 'escape tapado',
    pista: 'La turbina tiene que expulsar contra más presión, así que saca menos trabajo del mismo gas. Y el motor respira peor.' },
  turboGastado: { rot: 'turbo con holgura y rendimiento caído', corto: 'turbo gastado',
    pista: 'Ni la turbina saca lo que sacaba ni el compresor comprime como comprimía. El aire sale más caliente para la misma presión: eso es rendimiento perdido.' },
};
const FALLA_KEYS = Object.keys(FALLAS);

// Los regímenes del censo: el retardo vive abajo y el bloqueo, arriba.
function regimenes(e) {
  return [
    { rpm: Math.round(e.rpmPar * 0.62), rot: 'baja' },
    { rpm: Math.round(e.rpmPar * 0.90), rot: 'sopla' },
    { rpm: e.rpmPar, rot: 'par máximo' },
    { rpm: Math.round((e.rpmPar + e.rpmMax) / 2), rot: 'media' },
    { rpm: e.rpmMax, rot: 'máximo' },
  ];
}

// ============================================================================
// 12 · LO QUE SE MIDE DE UN MOTOR
// ============================================================================
function evalua(e, o) {
  o = o || {};
  const F = averia(o.falla || 'sano');
  const amb = { alt: o.alt || 0, Tamb: o.Tamb === undefined ? 25 : o.Tamb,
    vAire: o.vAire === undefined ? 60 : o.vAire,
    octanaje: o.octanaje === undefined ? 91 : o.octanaje };
  const rpm = o.rpm === undefined ? e.rpmPar : o.rpm;
  const carga = o.carga === undefined ? 1 : o.carga;
  const P = paresDe(e, rpm, carga, F, amb);
  const sano = (o.falla && o.falla !== 'sano')
    ? paresDe(e, rpm, carga, {}, amb) : null;

  // Los tres avisos que un banco de verdad daría, y el veredicto.
  const avisos = [];
  if (P.bombeo) avisos.push('el compresor está bombeando');
  if (P.bloqueo) avisos.push('el compresor está bloqueado');
  if (P.sobreVel) avisos.push('el turbo pasa de sus vueltas máximas');
  if (P.sobreT3) avisos.push('la turbina pasa de su temperatura máxima');
  if (P.sobrePresion) avisos.push('sobrepresión de soplado');
  if (P.detona) avisos.push('detonación');
  else if (P.limitadoDeton) avisos.push('el control de picado está recortando la consigna');
  if (P.faltaPotencia && carga > 0.5 && P.soplado < e.sopladoObj * carga * 0.90)
    avisos.push('no llega a la presión de consigna');

  const perdida = sano ? (1 - P.par / Math.max(1e-9, sano.par)) : 0;
  return {
    e: e.key, rpm, carga, F, amb, ...P,
    sano, perdida, avisos, hay: avisos.length > 0,
    // Lo que el ordenador puede ver: mide presión de soplado y temperatura de
    // admisión, y nada más. Por eso hay averías que no puede distinguir.
    dtc: dtcDe(e, P),
  };
}
// El diagnóstico a bordo de un sistema de sobrealimentación es corto: si la
// presión no llega a la consigna, P0299; si se pasa, P0234. Nada más. Toda la
// diferencia entre siete averías se queda fuera de esos dos códigos.
const DTC_ROT = {
  P0299: 'P0299 · presión de sobrealimentación por debajo de lo esperado',
  P0234: 'P0234 · sobrepresión de sobrealimentación',
  P0401: 'P0401 · caudal de recirculación insuficiente',
};
function dtcDe(e, P) {
  // El ordenador mide la presión ABSOLUTA DEL COLECTOR (el MAP), no la que sale
  // del compresor: una fuga de carga o un intercooler tapado dejan el compresor
  // soplando lo que debe y el colector sin llegar. Y la consigna con la que
  // compara es la que ÉL se pone, ya recortada por el control de picado: si él
  // mismo la baja para no detonar, no ve una avería sino su propia orden.
  const objAbs = Math.min(P.pObjetivo, P.pDeton);
  const obj = objAbs - P.pAmb;                       // consigna efectiva, manométrica
  const map = P.pAdm - P.pAmb;                       // lo que lee el sensor, manométrico
  // CONDICIONES DE HABILITACIÓN. El diagnóstico de presión baja sólo corre por
  // encima del régimen de soplado: por debajo, ningún turbo sano llega a la
  // consigna —eso es el retardo, no una avería— y un código que saltara ahí lo
  // haría en cada arranque en cuesta. Sin esto, el motor SANO daba P0299 a
  // 1 240 rpm a plena carga, que es un falso positivo de manual.
  const habilitado = P.carga > 0.55 && P.rpm >= e.rpmPar * 0.85 && obj > 1e4;
  if (habilitado && map < obj * 0.80) return 'P0299';
  // La sobrepresión, en cambio, se vigila SIEMPRE: pasarse de presión rompe el
  // turbo a cualquier régimen.
  if (P.soplado > e.sopladoMax * 1.02) return 'P0234';
  return null;
}

// ============================================================================
// 13 · LA CURVA Y EL CENSO
// ============================================================================
// La curva de par y potencia contra régimen, que es donde se ve el retardo y
// donde se ve el bloqueo.
function curva(e, o) {
  o = o || {};
  const pts = [];
  const n0 = Math.round(e.rpmRal * 1.4), n1 = e.rpmMax;
  const N = 26;
  for (let i = 0; i <= N; i++) {
    const rpm = Math.round(n0 + (n1 - n0) * i / N);
    const V = evalua(e, Object.assign({}, o, { rpm, carga: 1 }));
    pts.push({ rpm, par: V.par, pot: V.pot, soplado: V.soplado, m: V.m,
      TAdm: V.TAdm, pi: V.pi, mCorr: V.mCorr, u: V.u, xWG: V.xWG,
      pEsc: V.pEsc, bombeo: V.bombeo, bloqueo: V.bloqueo, detona: V.detona });
  }
  const parMax = pts.reduce((a, b) => b.par > a.par ? b : a, pts[0]);
  const potMax = pts.reduce((a, b) => b.pot > a.pot ? b : a, pts[0]);
  return { pts, parMax, potMax };
}

// Ocho averías más el motor sano, por cinco regímenes. Que existan celdas donde el motor pierde
// un tercio del par y el ordenador no tiene nada que declarar es el resultado
// más incómodo de la práctica, y no está escrito: sale de recorrer la rejilla.
function censo(e, o) {
  o = o || {};
  const regs = regimenes(e);
  const filas = [];
  let total = 0, mudo = 0, conAviso = 0, conCodigo = 0, peligro = 0;
  for (const k of FALLA_KEYS) {
    const celdas = regs.map(R => {
      const V = evalua(e, Object.assign({}, o, { falla: k, rpm: R.rpm, carga: 1 }));
      total++;
      const nota = V.perdida > 0.08 || V.hay;
      if (nota) conAviso++;
      if (V.dtc) conCodigo++;
      if (nota && !V.dtc) mudo++;
      if (V.detona || V.sobreT3 || V.sobrePresion || V.sobreVel) peligro++;
      return { rpm: R.rpm, rot: R.rot, dtc: V.dtc, par: V.par, soplado: V.soplado,
        TAdm: V.TAdm, perdida: V.perdida, avisos: V.avisos.slice(),
        detona: V.detona, bombeo: V.bombeo, bloqueo: V.bloqueo,
        sobreT3: V.sobreT3, sobrePresion: V.sobrePresion, nota };
    });
    filas.push({ falla: k, rot: FALLAS[k].rot, corto: FALLAS[k].corto, celdas,
      mudo: celdas.filter(c => c.nota && !c.dtc).length });
  }
  return { filas, total, mudo, conAviso, conCodigo, peligro, regs };
}

// ============================================================================
// 14 · LO QUE SE VE: ESTACIONES, ESCAPE, COLOR Y PARTÍCULAS
// ============================================================================
// Nada de esta sección cambia el punto de funcionamiento: lo LEE y lo convierte
// en lo que la escena pinta. Vive dentro del motor sellado a propósito: así la
// misma prueba que comprueba la física comprueba también lo que se dibuja, y la
// escena no puede inventarse una cifra que el modelo no haya dado.

// La temperatura tras la turbina sale del BALANCE DE ENERGÍA del propio punto:
// la potencia que la turbina entrega al eje es la entalpía que le quita al gas
// que la atraviesa, Pt = ṁT·cp·(T3 − T4). Antes se pintaba T3·0,86, que es una
// fracción a ojo y no sabía nada del eje.
function T4de(V) {
  if (!(V.mT > 1e-9)) return V.T3;
  return V.T3 - V.Pt / (V.mT * CP_ESC);
}
// Aguas abajo se juntan el gas que movió la turbina y el que se la saltó por la
// descarga. Mismo cp: la temperatura de la mezcla es la media pesada por gasto.
function gastoDescarga(V) { return Math.max(0, V.mEsc - V.mT); }
function fraccionDescarga(V) { return V.mEsc > 1e-12 ? clamp(gastoDescarga(V) / V.mEsc, 0, 1) : 0; }
function Tmezcla(V) {
  const mT = Math.max(0, V.mT), mW = gastoDescarga(V);
  if (mT + mW <= 1e-12) return V.T3;
  return (mT * T4de(V) + mW * V.T3) / (mT + mW);
}
// Las seis estaciones del camino, con presión ABSOLUTA y temperatura.
function estacionesDe(V) {
  return [
    { k: 'amb', rot: 'ambiente', p: V.pAmb, T: V.Tamb, aire: true },
    { k: 'filtro', rot: 'tras el filtro', p: V.p1, T: V.Tamb, aire: true },
    { k: 'comp', rot: 'sale del compresor', p: V.p2, T: V.T2, aire: true },
    { k: 'colector', rot: 'colector', p: V.pAdm, T: V.TAdm, aire: true },
    { k: 'turbina', rot: 'antes de la turbina', p: V.pEsc, T: V.T3, aire: false },
    { k: 'escape', rot: 'tras la turbina', p: V.pAmb, T: T4de(V), aire: false },
  ];
}
// El transitorio guarda lo que integra (vueltas, gasto, presiones, apertura y
// temperaturas de colector y de escape). Lo que la escena necesita además —T2,
// el gasto por la turbina, su potencia— se RECONSTRUYE con las mismas funciones
// del modelo y los mismos datos del punto, no se aproxima.
function puntoTransitorio(e, F, amb, P) {
  F = F || {}; amb = amb || {};
  const pAmb = presionAmbiente(amb.alt === undefined ? 0 : amb.alt);
  const Tamb = (amb.Tamb === undefined ? 25 : amb.Tamb) + 273.15;
  const p1 = pAmb - dpFiltro(e, P.m, F);
  const mCorr = correGasto(P.m, p1, Tamb);
  const etaC = etaComp(e, mCorr, P.u);
  const T2 = T2de(Tamb, P.pi, etaC);
  const mEsc = P.m * (1 + 1 / e.afr);
  const At = e.aTurbina * (F.escapeTapado ? 0.52 : 1);
  const mT = mEsc * At / (At + e.aWastegate * P.xWG);
  return { pAmb, Tamb, p1, p2: pAmb + P.soplado, pAdm: pAmb + P.sopladoAdm, T2, TAdm: P.TAdm,
    m: P.m, mCorr, u: P.u, pi: P.pi, etaC, mEsc, mT, Pt: P.Pt, Pc: P.Pc, T3: P.T3, pEsc: P.p3,
    xWG: P.xWG, nTurbo: P.n, eps: T2 > Tamb + 1e-6 ? clamp((T2 - P.TAdm) / (T2 - Tamb), 0, 1) : 0 };
}

// ---------------------------------------------------------------- el color
// DOS escalas, una por fluido, porque los dos rangos no se tocan: el aire de
// carga vive entre 260 y 530 K y el escape entre 600 y 1 320 K. Con una sola
// escala, el naranja del aire recién comprimido y el del escape a la salida de
// la turbina serían el mismo color para dos temperaturas a 500 K de distancia.
// Cada escala es un camino de color sin cruces: un color, una temperatura.
// Los colores son los de PANTALLA (sRGB); la partícula se tiñe con el lineal
// que, tras la curva ACES del render, da exactamente ese color.
const ESCALA_AIRE = [[260, '#2b5fd9'], [290, '#58a7f0'], [315, '#93e0e6'], [345, '#e4f0c6'],
  [385, '#ffd25e'], [430, '#ff9a3a'], [480, '#f2552e'], [530, '#d42a3c'], [700, '#9b1c5e'], [900, '#5c1856']];
// Por encima de 530 K el aire de carga sólo llega con el turbo fuera de sus
// límites (la descarga pegada cerrada, en altura): la escala se va al morado
// para que se lea como lo que es, una anomalía, y no como «más naranja».
const ESCALA_ESC = [[600, '#5e1a26'], [750, '#a82622'], [900, '#f0521c'], [1050, '#ff962c'],
  [1200, '#ffcf60'], [1320, '#fde6a8']];
function hexArgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
// Interpolada en sRGB, que es como interpola un `linear-gradient` de CSS: así la
// leyenda del panel y la partícula enseñan el mismo color a la misma T.
function colorEscala(E, T) {
  if (!(T > E[0][0])) return hexArgb(E[0][1]);
  for (let i = 1; i < E.length; i++) if (T <= E[i][0]) {
    const f = (T - E[i - 1][0]) / (E[i][0] - E[i - 1][0]), a = hexArgb(E[i - 1][1]), b = hexArgb(E[i][1]);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  return hexArgb(E[E.length - 1][1]);
}
const colorAire = T => colorEscala(ESCALA_AIRE, T);
const colorEsc = T => colorEscala(ESCALA_ESC, T);
// La curva de tono del render (three r160, ACESFilmicToneMapping) y la
// codificación sRGB de la salida. Copiadas tal cual: la prueba las compara.
function aSRGB(c) { return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; }
function deSRGB(c) { return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
function aces(rgb, expo) {
  const k = expo / 0.6, r = rgb[0] * k, g = rgb[1] * k, b = rgb[2] * k;
  const x = 0.59719 * r + 0.35458 * g + 0.04823 * b;
  const y = 0.07600 * r + 0.90834 * g + 0.01566 * b;
  const z = 0.02840 * r + 0.13383 * g + 0.83777 * b;
  const f = v => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.4329510) + 0.238081);
  const X = f(x), Y = f(y), Z = f(z);
  return [clamp(1.60475 * X - 0.53108 * Y - 0.07367 * Z, 0, 1),
    clamp(-0.10208 * X + 1.10813 * Y - 0.00605 * Z, 0, 1),
    clamp(-0.00327 * X - 0.07276 * Y + 1.07602 * Z, 0, 1)];
}
function enPantalla(lin, expo) { return aces(lin, expo).map(aSRGB); }
// El lineal que, pasado por la curva, se ve como `pant`. Iteración de punto
// fijo: la curva es monótona en el rango usado y converge en unas decenas.
function linealPara(pant, expo) {
  const obj = pant.map(deSRGB), c = obj.slice();
  for (let k = 0; k < 120; k++) {
    const a = aces(c, expo);
    for (let j = 0; j < 3; j++) c[j] = Math.max(0, c[j] + (obj[j] - a[j]) * 1.15);
  }
  return c;
}
// La lectura al revés: qué temperatura de la escala tiene el color más cercano.
// Es la prueba de que la escala no tiene dos temperaturas con el mismo color.
function temperaturaDeColor(E, rgb) {
  let mejor = E[0][0], dmin = Infinity;
  for (let T = E[0][0]; T <= E[E.length - 1][0]; T += 0.5) {
    const c = colorEscala(E, T), d = (c[0] - rgb[0]) ** 2 + (c[1] - rgb[1]) ** 2 + (c[2] - rgb[2]) ** 2;
    if (d < dmin) { dmin = d; mejor = T; }
  }
  return mejor;
}

// ------------------------------------------------- el aire que se ve moverse
// Cada partícula es una porción de gas de MASA FIJA. Su velocidad en cada tramo
// es la de continuidad, v = ṁ/(ρ·A), con la sección real de ese tramo, y por eso
// el tiempo que pasa en cada pieza es el tiempo REAL que el aire pasa allí,
// multiplicado por la cámara lenta. De ahí salen solas dos cosas que no se
// dibujan a mano: donde el aire va despacio las partículas se juntan, y en un
// tubo de la misma sección hay más partículas cuanto más DENSO es el aire.
// Secciones y longitudes del turismo 1.4 T, en m² y m; en los otros motores las
// secciones y los volúmenes se escalan con el gasto de bloqueo de su compresor
// (un turbo que pasa el doble de aire tiene el doble de sección de paso), y las
// longitudes se dejan iguales.
const CAMINO = {
  filtro:   { V: 2.0e-3 },                    // caja del filtro, 2 L
  conducto: { A: 2.83e-3, L: 0.25 },          // Ø 60 mm hasta la boca del compresor
  rodete:   { A: 7.5e-4,  L: 0.06 },          // inductor, rueda y difusor (componente meridiana)
  voluta:   { A: 4.5e-4,  L: 0.28 },          // sección final de la voluta y su vuelta entera
  salidaC:  { A: 7.1e-4,  L: 0.08 },          // Ø 30 mm
  caliente: { A: 1.96e-3, L: 0.60 },          // Ø 50 mm
  tanqueE:  { V: 0.5e-3 },
  ic:       { A: 2.4e-3,  L: 0.30 },          // diez tubos de 40 × 6 mm de paso
  tanqueS:  { V: 0.5e-3 },
  fria:     { A: 1.96e-3, L: 0.50 },
  mariposa: { A: 1.81e-3, L: 0.08 },          // Ø 48 mm
  entradaT: { A: 8.0e-4,  L: 0.10 },          // brida de entrada de la turbina
  volutaT:  { A: 8.0e-4,  L: 0.25 },
  rodeteT:  { A: 1.06e-3, L: 0.04 },          // exductor Ø 39/13 mm
  salidaT:  { A: 1.96e-3, L: 0.12 },
  puerto:   { A: 3.8e-4,  L: 0.07 },          // la tobera de la descarga, Ø 22 mm
  bajante:  { A: 2.38e-3, L: 0.60 },          // Ø 55 mm
};
const escalaGasto = e => e.mChoke / ARQ.gas14t.mChoke;
const rhoDe = (p, T) => p / (R_AIRE * Math.max(150, T));
// Los tiempos de residencia, en segundos REALES. τ = ρ·A·L/ṁ (o ρ·V/ṁ en una
// caja): es la masa que cabe en el tramo dividida por la que pasa por segundo.
function tiemposAire(e, V) {
  const k = escalaGasto(e), m = Math.max(1e-5, V.m), C = CAMINO;
  const r1 = rhoDe(V.p1, V.Tamb), r2 = rhoDe(V.p2, V.T2), r3 = rhoDe(V.pAdm, V.TAdm);
  const t = (r, A, L) => r * A * k * L / m;
  return {
    filtro: r1 * C.filtro.V * k / m,
    conducto: t(r1, C.conducto.A, C.conducto.L),
    rodete: t((r1 + r2) / 2, C.rodete.A, C.rodete.L),
    voluta: t(r2, C.voluta.A, C.voluta.L),          // la vuelta ENTERA; cada porción hace la suya
    salidaC: t(r2, C.salidaC.A, C.salidaC.L),
    caliente: t(r2, C.caliente.A, C.caliente.L),
    tanqueE: r2 * C.tanqueE.V * k / m,
    ic: t((r2 + r3) / 2, C.ic.A, C.ic.L),
    tanqueS: r3 * C.tanqueS.V * k / m,
    fria: t(r3, C.fria.A, C.fria.L),
    mariposa: t(r3, C.mariposa.A, C.mariposa.L),
    rho: { r1, r2, r3 },
  };
}
function tiemposEscape(e, V) {
  const k = escalaGasto(e), C = CAMINO;
  const mE = Math.max(1e-5, V.mEsc), mT = Math.max(1e-6, V.mT), mW = gastoDescarga(V);
  const T4 = T4de(V), Tm = Tmezcla(V);
  const r3 = rhoDe(V.pEsc, V.T3), r4 = rhoDe(V.pAmb, T4), rm = rhoDe(V.pAmb, Tm);
  const t = (r, A, L, mm) => r * A * k * L / mm;
  return {
    entradaT: t(r3, C.entradaT.A, C.entradaT.L, mE),
    volutaT: t(r3, C.volutaT.A, C.volutaT.L, mT),     // la vuelta entera con el gasto de la turbina
    rodeteT: t((r3 + r4) / 2, C.rodeteT.A, C.rodeteT.L, mT),
    salidaT: t(r4, C.salidaT.A, C.salidaT.L, mT),
    // Por la tobera de la descarga sólo pasa lo que se salta la turbina. Si está
    // casi cerrada, el gas de dentro está casi quieto: se le pone un techo para
    // que una porción que se quedó dentro al cerrarse acabe saliendo.
    puerto: Math.min(0.03, t(r3, C.puerto.A, C.puerto.L, Math.max(1e-6, mW))),
    bajante: t(rm, C.bajante.A, C.bajante.L, mE),
    rho: { r3, r4, rm }, T4, Tm,
  };
}
// La masa de gas que hay DENTRO de cada camino. Con masa fija por partícula, el
// número de partículas encendidas es esa masa entre la de una partícula: un
// turbo soplando mete más aire en los mismos tubos, y se ve.
function inventario(tiempos, m) {
  let s = 0;
  for (const k in tiempos) if (typeof tiempos[k] === 'number') s += tiempos[k];
  return s * m;
}
// El reparto de una porción en la bifurcación de la turbina: secuencia de baja
// discrepancia (razón áurea) sobre el número de vuelta. La fracción de vueltas
// que eligen la descarga es la fracción de GASTO que va por la descarga.
const AUREA = 0.6180339887498949;
function vaPorDescarga(i, vuelta, fWG) {
  const u = (i * AUREA + vuelta * 0.7548776662466927) % 1;
  return u < fWG;
}

// ------------------------------------------------- lo que gira y lo que abre
// La trampilla de la descarga: el área que el modelo abre es una fracción x de
// la de la tobera; el área de cortina de una trampilla es ∝ su alzado, ∝ sen θ.
// Por eso sen θ = x·sen θmáx y no θ = x·θmáx.
const THETA_WG_MAX = 28 * Math.PI / 180;
function anguloTrampilla(x) { return Math.asin(clamp(x, 0, 1) * Math.sin(THETA_WG_MAX)); }
// Cámaras lentas, fijas: con ellas las vueltas del turbo de dos estados se
// comparan a ojo. Las ruedas a ×1/5 000 (a 100 000 rpm dan un tercio de vuelta
// por segundo) y el gas a ×1/300 (en el tubo de carga avanza unos centímetros
// por segundo). Son dos relojes distintos y se rotulan los dos.
const LENTO_RUEDA = 5000, LENTO_GAS = 300;
function omegaPantalla(nTurbo) { return (nTurbo || 0) * 2 * Math.PI / 60 / LENTO_RUEDA; }
// El brillo del metal caliente: por debajo de ~800 K (punto de Draper) el
// hierro no emite luz visible; por encima, rojo oscuro que aclara con T. La
// superficie se toma 150 K por debajo del gas (estimación declarada).
function brilloMetal(Tgas) {
  const Ts = Tgas - 150;
  return Math.pow(clamp((Ts - 760) / 420, 0, 1), 1.5);
}
// ============================================================ T1 · FORMATOS, ESTADO Y MATERIALES

// El separador de millares es U+202F, un espacio fino que no rompe línea. NO se
// usa en años ni en octanajes: «2 020» no es un año y «9 1» no es un octanaje.
const NBSP=' ';
function num(x,d=1){
  if(x===null||x===undefined||!isFinite(x)) return '—';
  const s=Math.abs(x).toFixed(d), p=s.split('.');
  let ent=p[0], out='';
  while(ent.length>3){ out=NBSP+ent.slice(-3)+out; ent=ent.slice(0,-3); }
  out=ent+out;
  return (x<0?'−':'')+out+(p[1]?','+p[1]:'');
}
// Las presiones se guardan en pascales. En el taller se habla de dos cosas
// distintas con la misma palabra: el SOPLADO, que es manométrico —lo que marca
// el manómetro del turbo, cero con el motor parado— y la PRESIÓN DE COLECTOR,
// que es absoluta —lo que lee el sensor del ordenador—. Se distinguen siempre.
const barF=(p,d=2)=>num(p/1e5,d)+NBSP+'bar';
const barA=(p,d=2)=>num(p/1e5,d)+NBSP+'bar abs';
const kpa=(p,d=0)=>num(p/1e3,d)+NBSP+'kPa';
const cel=(T,d=0)=>num(T-273.15,d)+NBSP+'°C';
const celC=(t,d=0)=>num(t,d)+NBSP+'°C';
const kel=(T,d=0)=>num(T,d)+NBSP+'K';
const nm=(x,d=1)=>num(x,d)+NBSP+'N·m';
const kw=(x,d=1)=>num(x,d)+NBSP+'kW';
// OJO: el kit del donante ya declara cv() como fabrica de lienzos. Declarar
// aqui otro cv rompe la pagina ENTERA con 'Identifier cv has already been
// declared' antes de que exista window.__labDebug.
const cvF=(x,d=0)=>num(x,d)+NBSP+'CV';
const kgs=(x,d=3)=>num(x,d)+NBSP+'kg/s';
const rhoF=(x,d=3)=>num(x,d)+NBSP+'kg/m³';
const rpmT=x=>num(x,0)+NBSP+'rpm';
const seg=(x,d=2)=>num(x,d)+NBSP+'s';
const pcc=(x,d=0)=>num(x,d)+NBSP+'%';
const met=(x,d=0)=>num(x,d)+NBSP+'m';
const kmh=(x,d=0)=>num(x,d)+NBSP+'km/h';
const corta=(s,n)=>s.length>n?s.slice(0,n-1)+'…':s;
// La presión media efectiva es la cifra con la que se comparan motores de
// cilindrada distinta, y esta práctica la enseña porque sin ella «1 100 N·m»
// no dice si el motor está muy cargado o es que es muy grande.
const pmeDe=(par,cilLitros)=>4*Math.PI*par/(cilLitros*1e-3);

// ------------------------------------------------------------------- estado
const ALTS=[
  {a:0,    rot:'nivel del mar'},
  {a:1200, rot:'Monterrey, 540 m redondeado a 1 200'},
  {a:2240, rot:'Ciudad de México, 2 240 m'},
  {a:2660, rot:'Toluca, 2 660 m'},
  {a:3500, rot:'paso de montaña, 3 500 m'},
];
const OCTS=[87,91,95];
const G={
  modo:'ensamble', maq:'gas14t', falla:'sano',
  alt:0, Tamb:25, vAire:60, octanaje:91,
  rpm:null, carga:1,
  simUnlocked:false, resuelto:false, k:1,
};
const MQ=()=>ARQ[G.maq];
const FL=()=>FALLAS[G.falla];
const ALT_ROT=a=>(ALTS.find(A=>A.a===a)||{rot:met(a)}).rot;
const RPM=()=>G.rpm===null?MQ().rpmPar:G.rpm;
const AMB=()=>({alt:G.alt,Tamb:G.Tamb,vAire:G.vAire,octanaje:G.octanaje});

// --------------------------------------------------------------------- memo
// Cada `evalua` son tres pasadas de bisección sobre la presión de soplado, y
// cada una recorre el camino del aire veintiséis veces con una tobera resuelta
// por bisección dentro. Sin memorizar, repintar el dock a cada fotograma
// tira la página al suelo: el censo solo son 45 evaluaciones.
const MEMO=new Map();
function memo(k,fn){ if(!MEMO.has(k)) MEMO.set(k,fn()); return MEMO.get(k); }
function invalida(){ MEMO.clear(); }
const AMBK=()=>G.maq+'|'+G.alt+'|'+G.Tamb+'|'+G.vAire+'|'+G.octanaje;
function EV(){ return EV_DE(G.falla,RPM(),G.carga); }
function EV_DE(f,rpm,carga){
  return memo('v|'+AMBK()+'|'+f+'|'+rpm+'|'+carga,
    ()=>evalua(MQ(),Object.assign({falla:f,rpm,carga},AMB())));
}
function CURVA(f){ return memo('k|'+AMBK()+'|'+(f||G.falla),
  ()=>curva(MQ(),Object.assign({falla:f||G.falla},AMB()))); }
function CENSO(){ return memo('c|'+AMBK(),()=>censo(MQ(),AMB())); }
function TRANS(f){ return memo('t|'+AMBK()+'|'+(f||G.falla)+'|'+RPM(),
  ()=>transitorio(MQ(),RPM(),averia(f||G.falla),AMB())); }

// ---------------------------------------------------------------- veredictos
function veredicto(){
  const V=EV();
  if(V.sobreVel||V.sobrePresion||V.sobreT3) return {nivel:'bad',rot:'EL TURBO ESTÁ FUERA DE SUS LÍMITES'};
  if(V.detona) return {nivel:'bad',rot:'DETONA'};
  if(V.bombeo) return {nivel:'bad',rot:'EL COMPRESOR BOMBEA'};
  if(V.perdida>0.08&&!V.dtc) return {nivel:'warn',rot:'PIERDE PAR Y NO HAY CÓDIGO'};
  if(V.dtc) return {nivel:'warn',rot:V.dtc.slice(0,5)};
  if(V.hay||V.perdida>0.03) return {nivel:'warn',rot:'CON SÍNTOMA'};
  return {nivel:'ok',rot:'SIN NOVEDAD'};
}


// ---------------------------------------------------------------- materiales
/* PBR con el entorno del estudio. Ninguna textura lleva poro ni grano fino —en
   una cara grande se lee como lija—: sólo variaciones LENTAS de rugosidad y de
   relieve, periódicas para que se repitan sin costura. La fundición de aluminio
   del compresor, la de hierro de la turbina y el acero mecanizado del eje no se
   parecen ni de lejos, y eso es lo primero que hay que ver en un turbo. */
function ruidoPeriodico(semilla,periodo){
  const g=(x,y)=>{ x=((x%periodo)+periodo)%periodo; y=((y%periodo)+periodo)%periodo;
    const s=Math.sin(x*127.1+y*311.7+semilla*13.13)*43758.5453; return s-Math.floor(s); };
  return (x,y)=>{ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi;
    const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
    return g(xi,yi)*(1-u)*(1-v)+g(xi+1,yi)*u*(1-v)+g(xi,yi+1)*(1-u)*v+g(xi+1,yi+1)*u*v; };
}
function fbmP(semilla,periodo,oct){ const ns=[]; for(let o=0;o<oct;o++) ns.push(ruidoPeriodico(semilla+o*7,periodo*(1<<o)));
  return (x,y)=>{ let v=0,a=0.5; for(let o=0;o<oct;o++){ v+=ns[o](x*(1<<o),y*(1<<o))*a; a*=0.5; } return v; }; }
/* Rugosidad y normales de variación lenta (pintura, fundición, tablero). */
function pielLenta(semilla,{px=256,celdas=4,oct=3,rug0=0.45,rugA=0.10,relieve=0.6}={}){
  const f=fbmP(semilla,celdas,oct), k=celdas/px;
  const c=cv(px), x=c.getContext('2d'), im=x.createImageData(px,px);
  for(let j=0;j<px;j++) for(let i=0;i<px;i++){ const v=clamp(rug0+(f(i*k,j*k)-0.5)*2*rugA,0,1)*255, o=(j*px+i)*4;
    im.data[o]=im.data[o+1]=im.data[o+2]=v; im.data[o+3]=255; }
  x.putImageData(im,0,0);
  const nrm=normalFromHeight(px,(i,j)=>f(i*k,j*k),relieve);
  return {roughnessMap:tex(c),normalMap:tex(nrm)};
}
const T_ALU=pielLenta(11,{celdas:5,rug0:0.52,rugA:0.08,relieve:0.55});
const T_FUN=pielLenta(23,{celdas:6,rug0:0.66,rugA:0.10,relieve:0.85});
const T_PINT=pielLenta(37,{celdas:4,rug0:0.42,rugA:0.06,relieve:0.30});
const T_MESA=pielLenta(31,{celdas:3,rug0:0.64,rugA:0.08,relieve:0.25});
for(const t of [T_ALU,T_FUN,T_PINT]) for(const m of [t.roughnessMap,t.normalMap]) m.repeat.set(3,3);
for(const m of [T_MESA.roughnessMap,T_MESA.normalMap]) m.repeat.set(2,2);
const nS=k=>new THREE.Vector2(k,k);
const std=o=>new THREE.MeshStandardMaterial(o);
const fis=o=>new THREE.MeshPhysicalMaterial(o);
const rub={roughness:0.86,metalness:0.04};
const plas={roughness:0.42,metalness:0.16};
const emis=(hex,i)=>std({color:hex,emissive:hex,emissiveIntensity:i,roughness:0.42,metalness:0.10});
/* OJO con `brushedMetal()`: NO devuelve un material, devuelve el juego de
   texturas. Pasárselo a un Mesh no da ningún error —three comprueba
   `material.visible===true` y, al ser undefined, SE SALTA la pieza en
   silencio—. Aquí no se usa; el centinela `materialesFalsos` sigue cazándolo.
   Y three MULTIPLICA roughness por el canal del roughnessMap: las pieles ya
   traen la rugosidad real, así que el factor va cerca de 1. */
const MAT={
  // Las carcasas. El compresor es aluminio fundido; la turbina, fundición de
  // hierro al silicio-molibdeno, oscura y mate porque trabaja a 900 °C. El
  // brillo del metal al rojo se le pone por emisión, con la temperatura que
  // el modelo da (`brilloMetal`).
  aluFun:  std({color:0xb9bec5,roughness:0.95,metalness:0.82,roughnessMap:T_ALU.roughnessMap,
             normalMap:T_ALU.normalMap,normalScale:nS(0.32),envMapIntensity:1.0}),
  hierro:  std({color:0x4d4a48,roughness:1.0,metalness:0.55,roughnessMap:T_FUN.roughnessMap,
             normalMap:T_FUN.normalMap,normalScale:nS(0.45),envMapIntensity:0.85,
             emissive:0xff3a10,emissiveIntensity:0}),
  chra:    std({color:0x6b7179,roughness:0.95,metalness:0.62,roughnessMap:T_FUN.roughnessMap,
             normalMap:T_FUN.normalMap,normalScale:nS(0.30),envMapIntensity:0.9}),
  // Lo mecanizado: el eje rectificado, las ruedas, la tuerca.
  eje:     std({color:0xc9ced4,roughness:0.26,metalness:1.0,envMapIntensity:0.95}),
  ruedaC:  std({color:0xd9dde2,roughness:0.22,metalness:1.0,envMapIntensity:1.15}),
  // La rueda de la turbina es de superaleación de níquel fundida: gris pardo,
  // con el tono del calor.
  ruedaT:  std({color:0x7c7068,roughness:0.42,metalness:0.92,envMapIntensity:1.0,
             emissive:0xff3a10,emissiveIntensity:0}),
  bronce:  std({color:0xc49a5c,roughness:0.30,metalness:1.0,envMapIntensity:1.1}),
  acero:   std({color:0xaeb6bf,roughness:0.36,metalness:0.92,envMapIntensity:1.0}),
  // El escape aguas abajo: acero inoxidable con el pavonado azul-pardo del calor.
  inox:    std({color:0x8c847c,roughness:0.40,metalness:0.92,envMapIntensity:0.95,
             emissive:0xff3a10,emissiveIntensity:0}),
  // El motor del banco.
  bloque:  std({color:0x4a5059,roughness:0.95,metalness:0.45,roughnessMap:T_FUN.roughnessMap,
             normalMap:T_FUN.normalMap,normalScale:nS(0.30),envMapIntensity:0.8}),
  culata:  std({color:0x9aa1a9,roughness:0.95,metalness:0.70,roughnessMap:T_ALU.roughnessMap,
             normalMap:T_ALU.normalMap,normalScale:nS(0.25),envMapIntensity:0.9}),
  colector:std({color:0x484543,roughness:1.0,metalness:0.55,roughnessMap:T_FUN.roughnessMap,
             normalMap:T_FUN.normalMap,normalScale:nS(0.45),envMapIntensity:0.8,
             emissive:0xff3a10,emissiveIntensity:0}),
  negro:   std({color:0x1a1e23,roughness:0.55,metalness:0.10,envMapIntensity:0.7}),
  caja:    std({color:0x22282f,roughness:0.62,metalness:0.08,envMapIntensity:0.7}),
  goma:    std({color:0x15181c,...rub}),
  // Los manguitos de silicona que unen los tubos de carga, como en cualquier
  // coche preparado: azules, para que se lea dónde empieza cada tramo.
  silicona:std({color:0x2c5a86,roughness:0.62,metalness:0.0,envMapIntensity:0.7}),
  abraz:   std({color:0xc9ced4,roughness:0.28,metalness:1.0,envMapIntensity:1.1}),
  // El intercooler: tubos y aletas de aluminio, depósitos de fundición.
  tuboIC:  std({color:0xb4bbc2,roughness:0.40,metalness:0.88,envMapIntensity:1.0}),
  aleta:   std({color:0x9ea6ae,roughness:0.48,metalness:0.80,envMapIntensity:0.9,side:THREE.DoubleSide}),
  papel:   std({color:0xe0d6b8,roughness:0.92,metalness:0.0,envMapIntensity:0.5,side:THREE.DoubleSide}),
  // El banco.
  pintura: fis({color:0x2c4a5e,roughness:0.85,metalness:0.12,clearcoat:0.45,clearcoatRoughness:0.32,
             roughnessMap:T_PINT.roughnessMap,normalMap:T_PINT.normalMap,normalScale:nS(0.30),envMapIntensity:0.9}),
  mesa:    std({color:0x22262b,roughness:1.0,metalness:0.18,roughnessMap:T_MESA.roughnessMap,
             normalMap:T_MESA.normalMap,normalScale:nS(0.2),envMapIntensity:0.6}),
  canto:   std({color:0x8e959c,roughness:0.32,metalness:0.9,envMapIntensity:0.9}),
  tapete:  std({color:0x1b2a31,roughness:0.88,metalness:0.0,envMapIntensity:0.4}),
  pata:    std({color:0x2c3136,roughness:0.5,metalness:0.6}),
  // El vidrio de los manguitos de carga. Fino, casi sin color y sin escribir
  // profundidad: el gas que va por dentro se pinta DESPUÉS y conserva su color
  // exacto (las partículas llevan un orden de dibujo mayor).
  vidrio:  fis({color:0xe2eef4,roughness:0.08,metalness:0.0,transparent:true,opacity:0.085,
             depthWrite:false,clearcoat:0.5,clearcoatRoughness:0.08,envMapIntensity:0.75,side:THREE.DoubleSide}),
  ok:emis(0x2fbf62,1.5),
  bad:emis(0xff4d5e,1.5),
  avi:emis(0xe9c46a,1.4),
  apag:std({color:0x232a33,roughness:0.6,metalness:0.1}),
};
/* LAS CARAS DE SECCIÓN: planas y rayadas como en un plano de taller, con el
   rayado anclado a las coordenadas de la pieza y en sentidos opuestos para dos
   materiales vecinos. Con mipmaps, de lejos el rayado se funde en el tono
   medio en vez de hacer moaré. */
const rayado=(fondo,linea,sentido)=>P3.texturaRayado({fondo,linea,sentido,lineas:4,grueso:0.15,porUnidad:9,grano:0});
const MC={
  alu:   std({map:rayado('#bfc4ca','#80868e',1),roughness:0.48,metalness:0.35,envMapIntensity:0.7}),
  hierro:std({map:rayado('#76706a','#433e3a',-1),roughness:0.62,metalness:0.30,envMapIntensity:0.6,
           emissive:0xff3a10,emissiveIntensity:0}),
  chra:  std({map:rayado('#8b9097','#575c63',1),roughness:0.55,metalness:0.32,envMapIntensity:0.6}),
  bronce:std({map:rayado('#c9a46c','#8a6838',-1),roughness:0.40,metalness:0.55,envMapIntensity:0.7}),
  acero: std({map:rayado('#b6bdc4','#737a82',-1),roughness:0.42,metalness:0.45,envMapIntensity:0.7}),
  inox:  std({map:rayado('#9c948c','#5d5650',1),roughness:0.45,metalness:0.40,envMapIntensity:0.6,
           emissive:0xff3a10,emissiveIntensity:0}),
  plas:  std({map:rayado('#3a4048','#22272d',1),roughness:0.6,metalness:0.05,envMapIntensity:0.5}),
};
/* Las caras interiores de una cavidad abierta por el corte: el mismo material
   visto por dentro (las normales de esas superficies ya miran a la cavidad). */
const CAV={
  alu: MAT.aluFun, hierro: MAT.hierro, inox: MAT.inox, chra: MAT.chra,
};
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`), traducidos
   una vez a los materiales de este laboratorio: así la biblioteca no inventa
   ninguno por su cuenta y el centinela de materiales falsos sigue sirviendo. */
const MATP={aluminio:MAT.culata, acero:MAT.acero, hierro:MAT.bloque, cromo:MAT.eje,
  chapa:MAT.negro, negro:MAT.negro, goma:MAT.goma, cobre:MAT.bronce, blanco:MAT.culata,
  ceramica:MAT.culata, papel:MAT.papel};
const nuevaFantasma=()=>std({color:0x4FD1C5,transparent:true,opacity:0.22,metalness:0,roughness:0.6,
  emissive:0x2A9D8F,emissiveIntensity:0.55,depthWrite:false});
/* El metal al rojo. `brilloMetal(T)` (sección 14) da la intensidad 0..1; el
   color es el del cuerpo negro a la temperatura de la superficie: rojo oscuro
   cerca del punto de Draper, naranja por encima. */
function colorRojo(Tgas){
  const Ts=Tgas-150, f=clamp((Ts-760)/520,0,1);
  return new THREE.Color().setRGB(1.0, 0.05+0.30*f, 0.01+0.05*f);
}

// ============================================================ T2 · GEOMETRÍA
/* Convenio de todo el turbo (el de la §21 de la biblioteca de piezas): el eje
   del turbo es +X, el plano de corte es z = 0, se conserva la mitad z ≤ 0 y
   las caras de sección miran a +Z, hacia quien mira. Un punto a distancia r
   del eje y ángulo φ está en (x, r·cos φ, r·sen φ): φ = 0 arriba, φ = π/2
   delante (la mitad quitada), φ = π abajo y φ = 3π/2 detrás. El eje gira en
   el sentido de φ creciente, y en ese sentido corre el gas por las dos
   caracolas. */
const malla=(geo,mat,sombra=true)=>{ const m=new THREE.Mesh(geo,mat); m.castShadow=sombra; m.receiveShadow=true; return m; };
/* Pieza de revolución alrededor de +X. `perfil` = [[r, x], …]. Entera o, con
   `medio`, la mitad de atrás con su cara de sección (P3.mediaRevolucion hace
   la mitad z ≤ 0 alrededor de +Y; girarla −90° en z lleva el eje a +X y deja
   el plano de corte donde estaba). */
function revX(perfil,seg=40){
  const g=P3.revolucion(P3.perfilCerrado(perfil),{seg}); g.rotateZ(-Math.PI/2); return g;
}
function medioX(perfil,seg=28){
  const {cuerpo,corte}=P3.mediaRevolucion(perfil,{seg});
  cuerpo.rotateZ(-Math.PI/2); corte.rotateZ(-Math.PI/2);
  return {cuerpo,corte};
}
/* La cara de sección de un perfil (x, r) de revolución alrededor de +X, en el
   plano z = 0: arriba (y = +r) y abajo (y = −r). Las uv son (x, y): el rayado
   queda anclado a la pieza. Con `huecos` se le abren ventanas. */
function caraX(perfil,donde){
  const P=perfil.map(([x,r])=>[x,r]);
  const arr=P.map(([x,r])=>[x,r]), aba=P.map(([x,r])=>[x,-r]);
  if(donde==='arriba') return P3.caraPlana(arr);
  if(donde==='abajo') return P3.caraPlana(aba);
  return P3.caraPlana([arr,aba]);
}
/* Duplica las esquinas de un polígono cerrado: donde el contorno dobla más de
   `lim` grados, el vértice va dos veces, y las normales de las dos caras no se
   promedian (una arista viva no sale redondeada por la luz). Devuelve los
   índices del polígono original en el orden nuevo, para poder aplicar el MISMO
   patrón a todos los perfiles de un barrido. */
function patronEsquinas(P,lim=35){
  const n=P.length, c=Math.cos(lim*DEG), idx=[];
  for(let i=0;i<n;i++){
    const a=P[(i-1+n)%n], b=P[i], d=P[(i+1)%n];
    const ux=b[0]-a[0], uy=b[1]-a[1], vx=d[0]-b[0], vy=d[1]-b[1];
    const lu=Math.hypot(ux,uy), lv=Math.hypot(vx,vy);
    idx.push(i);
    if(lu>1e-9&&lv>1e-9&&(ux*vx+uy*vy)/(lu*lv)<c) idx.push(i);
  }
  return idx;
}
/* BARRIDO DE PERFIL VARIABLE alrededor de +X: el sólido cuya sección por el
   meridiano de ángulo φ es el polígono `perfilDe(φ)` = [[x, r], …], siempre con
   el mismo número de vértices. Es la forma de una caracola de verdad, cuya
   sección crece (compresor) o mengua (turbina) a lo largo de la vuelta. El
   polígono es la MATERIA de la carcasa: su contorno interior es la pared que
   moja el gas y el exterior la piel de la fundición. Se barre de φ0 a φ1 y se
   devuelven la superficie y, si el extremo cae en el plano de corte (φ = π o
   2π), la cara de sección de ese extremo. Las uv son metros de desarrollo, para
   que la piel de fundición tenga el mismo grano en toda la pieza. */
function barridoX(perfilDe,phi0,phi1,nPhi,{tapas=true}={}){
  const ref=perfilDe((phi0+phi1)/2), patron=patronEsquinas(ref);
  // el primer vértice del patrón tiene que ser una esquina para que la costura
  // del lazo caiga en una arista viva: se rota hasta la primera duplicada
  let k0=0; for(let i=1;i<patron.length;i++) if(patron[i]===patron[i-1]){ k0=i; break; }
  const pat=patron.slice(k0).concat(patron.slice(0,k0)); pat.push(pat[0]);
  const M=pat.length, pos=[], uv=[], idx=[];
  for(let i=0;i<=nPhi;i++){
    const phi=phi0+(phi1-phi0)*i/nPhi, P=perfilDe(phi), c=Math.cos(phi), s=Math.sin(phi);
    let L=0;
    for(let j=0;j<M;j++){
      const p=P[pat[j]]; if(j){ const q=P[pat[j-1]]; L+=Math.hypot(p[0]-q[0],p[1]-q[1]); }
      pos.push(p[0],p[1]*c,p[1]*s); uv.push(phi*0.30,L);
    }
  }
  for(let i=0;i<nPhi;i++) for(let j=0;j<M-1;j++){
    const a=i*M+j, b=a+M;
    idx.push(a,b,a+1, a+1,b,b+1);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx); g.computeVertexNormals();
  // ¿Miran afuera? El vértice más alejado del eje tiene que tener la normal
  // con componente radial positiva; si no, se da la vuelta a los triángulos.
  const N=g.attributes.normal, Pp=g.attributes.position; let mx=-1, im=0;
  for(let i=0;i<Pp.count;i++){ const r=Math.hypot(Pp.getY(i),Pp.getZ(i)); if(r>mx){ mx=r; im=i; } }
  const ry=Pp.getY(im), rz=Pp.getZ(im);
  if(N.getY(im)*ry+N.getZ(im)*rz<0){
    const I=g.index.array; for(let t=0;t<I.length;t+=3){ const z=I[t+1]; I[t+1]=I[t+2]; I[t+2]=z; }
    g.index.needsUpdate=true; g.computeVertexNormals();
  }
  P3.sanaNormales(g);
  const caras=[];
  if(tapas) for(const phi of [phi0,phi1]){
    const P=perfilDe(phi);
    if(Math.abs(Math.sin(phi))<1e-6) caras.push(P3.caraPlana(P.map(([x,r])=>[x,r*Math.cos(phi)])));
  }
  return {cuerpo:g, corte:caras.length?P3.fusiona(caras):null};
}
/* TUBO CORTADO de radio variable por una curva del plano z = 0: medio tubo
   exterior, medio tubo interior (la cavidad, con las normales hacia el eje) y
   las dos bandas de la cara de sección. Es el bajante del escape: entra ancho
   para tragar el escape de la turbina Y el de la descarga, y se estrecha. */
function tuboCortadoVar(pts,rIn,rOut,{seg=56,radial=16}={}){
  const linea=P3.curvaPlana(pts,seg);
  const pared=P3.medioTubo(linea,t=>rOut(t),{seg,radial});
  const interior=P3.medioTubo(linea,t=>rIn(t),{seg,radial,adentro:true});
  const n=linea.length, A=[], B=[], C=[], D=[];
  for(let i=0;i<n;i++){
    const a=linea[Math.max(0,i-1)], b=linea[Math.min(n-1,i+1)];
    let tx=b[0]-a[0], ty=b[1]-a[1]; const l=Math.hypot(tx,ty)||1; tx/=l; ty/=l;
    const t=i/(n-1), ri=rIn(t), ro=rOut(t), p=linea[i];
    A.push([p[0]-ty*ri,p[1]+tx*ri]); B.push([p[0]-ty*ro,p[1]+tx*ro]);
    C.push([p[0]+ty*ri,p[1]-tx*ri]); D.push([p[0]+ty*ro,p[1]-tx*ro]);
  }
  const corte=P3.caraPlana([A.concat(B.slice().reverse()),C.concat(D.slice().reverse())]);
  return {pared,interior,corte,linea};
}
/* Un tubo entero por una curva (manguito de vidrio, manguera, varilla). */
function tuboGeo(pts,r,{tseg=64,rseg=18,cerrado=false}={}){
  const c=new THREE.CatmullRomCurve3(pts,false,'centripetal');
  const g=new THREE.TubeGeometry(c,tseg,r,rseg,cerrado); P3.sanaNormales(g); g.userData.curva=c; return g;
}
/* COMPACTAR: todas las mallas de una pieza se funden en UNA por material.
   Mismo dibujo, muchas menos llamadas de dibujo. No se tocan las ramas
   marcadas `vivo` (lo que gira o se mueve por su cuenta). */
function compacta(raiz){
  raiz.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(raiz.matrixWorld).invert(), M=new THREE.Matrix4();
  const lotes=new Map(), quitar=[];
  raiz.traverse(o=>{
    if(!o.isMesh) return;
    for(let p=o;p&&p!==raiz;p=p.parent) if(p.userData&&p.userData.vivo) return;
    const g=o.geometry; if(!g.attributes.normal) return;
    M.multiplyMatrices(inv,o.matrixWorld);
    const nI=g.index?g.index.count:g.attributes.position.count;
    const mats=Array.isArray(o.material)?o.material:[o.material];
    const grupos=(Array.isArray(o.material)&&g.groups.length)?g.groups:[{start:0,count:nI,materialIndex:0}];
    for(const gr of grupos){ const mat=mats[gr.materialIndex]; if(!mat) continue;
      const k=mat.uuid+'|'+(o.castShadow?1:0)+(o.receiveShadow?1:0);
      if(!lotes.has(k)) lotes.set(k,{mat,cs:o.castShadow,rs:o.receiveShadow,piezas:[]});
      lotes.get(k).piezas.push({g,m:M.clone(),a:gr.start,n:Math.min(gr.count,nI-gr.start)}); }
    quitar.push(o);
  });
  if(quitar.length<2) return raiz;
  for(const o of quitar) o.parent.remove(o);
  const nm=new THREE.Matrix3(), v=new THREE.Vector3();
  for(const {mat,cs,rs,piezas} of lotes.values()){
    let nV=0,nI=0; for(const q of piezas){ nV+=q.g.attributes.position.count; nI+=q.n; }
    const pos=new Float32Array(nV*3), nor=new Float32Array(nV*3), uv=new Float32Array(nV*2), idx=new Uint32Array(nI);
    let oV=0,oI=0;
    for(const q of piezas){ const P=q.g.attributes.position, N=q.g.attributes.normal, U=q.g.attributes.uv, c=P.count; nm.getNormalMatrix(q.m);
      for(let i=0;i<c;i++){ v.fromBufferAttribute(P,i).applyMatrix4(q.m); pos[(oV+i)*3]=v.x; pos[(oV+i)*3+1]=v.y; pos[(oV+i)*3+2]=v.z;
        v.fromBufferAttribute(N,i).applyMatrix3(nm).normalize(); nor[(oV+i)*3]=v.x; nor[(oV+i)*3+1]=v.y; nor[(oV+i)*3+2]=v.z;
        if(U){ uv[(oV+i)*2]=U.getX(i); uv[(oV+i)*2+1]=U.getY(i); } }
      const I=q.g.index; for(let i=0;i<q.n;i++) idx[oI+i]=(I?I.getX(q.a+i):q.a+i)+oV;
      oV+=c; oI+=q.n; }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('normal',new THREE.BufferAttribute(nor,3));
    geo.setAttribute('uv',new THREE.BufferAttribute(uv,2)); geo.setIndex(new THREE.BufferAttribute(idx,1)); geo.computeBoundingSphere();
    const m=new THREE.Mesh(geo,mat); m.castShadow=cs; m.receiveShadow=rs; raiz.add(m);
  }
  return raiz;
}
/* Tubos de una curva cerrada: arandelas, abrazaderas, juntas tóricas. */
function aro(R,r,mat,eje='x',seg=40){
  const g=new THREE.TorusGeometry(R,r,10,seg);
  if(eje==='x') g.rotateY(Math.PI/2); else if(eje==='y') g.rotateX(Math.PI/2);
  return malla(g,mat);
}
/* Polilínea con su longitud acumulada: el camino de cada partícula se recorre
   por longitud de arco. `p(f)` da el punto a la fracción f ∈ [0, 1]. */
function polilinea(pts){
  const P=pts.map(p=>p.isVector3?p.clone():new THREE.Vector3(p[0],p[1],p[2]));
  const L=[0]; for(let i=1;i<P.length;i++) L.push(L[i-1]+P[i].distanceTo(P[i-1]));
  const tot=L[L.length-1]||1e-9;
  return {P,L,tot,
    en(f,out){ const s=clamp(f,0,1)*tot; let i=1; while(i<P.length-1&&L[i]<s) i++;
      const a=P[i-1], b=P[i], u=(L[i]-L[i-1])>1e-12?(s-L[i-1])/(L[i]-L[i-1]):0;
      return (out||new THREE.Vector3()).lerpVectors(a,b,clamp(u,0,1)); },
    dir(f,out){ const s=clamp(f,0,1)*tot; let i=1; while(i<P.length-1&&L[i]<s) i++;
      return (out||new THREE.Vector3()).subVectors(P[i],P[i-1]).normalize(); }};
}
/* Una curva suave muestreada en una polilínea de N tramos. */
function curvaSuave(pts,N=60){
  const c=new THREE.CatmullRomCurve3(pts.map(p=>p.isVector3?p:new THREE.Vector3(...p)),false,'centripetal');
  return polilinea(c.getSpacedPoints(N));
}

// ============================================================ T3 · EL TURBO
/* Cotas del dibujo, en el marco del turbo (eje +X, origen en el centro del
   cuerpo central), para el turbo del 1.4 T. Un turbo de verdad de ese motor
   tiene la rueda del compresor de 44 mm y aquí mide 33 cm (×7,5), mientras
   el motor va a ×2 a ×3,5: el turbo está ampliado unas tres veces más que el
   motor, como un turbo de corte de formación sobre su banco. Los
   tiempos y velocidades del gas NO salen del dibujo: salen de las secciones
   reales de la tabla CAMINO (sección 14). Los otros motores llevan el mismo
   dibujo escalado con su gasto de bloqueo a la potencia 0,18 (el V8, ×1,26). */
const escalaTurbo=e=>Math.pow(e.mChoke/ARQ.gas14t.mChoke,0.18);
const SEN=Math.sin, COS=Math.cos, PI2=Math.PI/2;
// --- la rueda del compresor: cubo y punta de los álabes, de la nariz (m = 0) a la salida (m = 1)
const hubC=m=>[-0.47+0.255*SEN(PI2*m), 0.038+0.127*(1-COS(PI2*m))];
const shrC=m=>[-0.47+0.225*SEN(PI2*m), 0.112+0.053*(1-COS(PI2*m))];
// --- la de la turbina: de la entrada radial (m = 0) al exductor axial (m = 1)
const hubT=m=>[0.205+0.195*(1-COS(PI2*m)), 0.150-0.108*SEN(PI2*m)];
const shrT=m=>[0.245+0.155*(1-COS(PI2*m)), 0.150-0.035*SEN(PI2*m)];
const Z_C=6, Z_T=11;
/* EL ÁLABE DEL COMPRESOR. El ángulo del álabe respecto a la dirección del gasto
   va de 55° en el inductor (la cara del álabe recibe el aire que entra axial
   mientras la rueda gira) a 38° hacia atrás en la salida: es el «backswept»,
   el retroceso que estabiliza el compresor y le da margen de bombeo. dθ/ds =
   −tan β / r a lo largo de la línea media; el signo menos es que el álabe se
   retrasa respecto al giro. Se integra y se limita el envolvimiento total a
   86°, que es lo que tienen las ruedas de catálogo de este tamaño. */
const WRAP_C=(function(){
  const N=200, th=[0]; let a=0;
  const media=m=>{ const h=hubC(m), s=shrC(m); return [(h[0]+s[0])/2,(h[1]+s[1])/2]; };
  const beta=m=>{ const b1=55*DEG, bm=24*DEG, b2=38*DEG; return b1*(1-m)*(1-m)+bm*2*m*(1-m)+b2*m*m; };
  for(let i=1;i<=N;i++){
    const m0=(i-1)/N, m1=i/N, p=media(m0), q=media(m1), ds=Math.hypot(q[0]-p[0],q[1]-p[1]);
    a+=-Math.tan(beta((m0+m1)/2))/((p[1]+q[1])/2)*ds; th.push(a);
  }
  const k=Math.min(1,(86*DEG)/Math.abs(a));
  return th.map(v=>v*k);
})();
const thetaC=m=>{ const f=clamp(m,0,1)*200, i=Math.min(199,Math.floor(f)), u=f-i; return WRAP_C[i]+(WRAP_C[i+1]-WRAP_C[i])*u; };
/* El de la turbina es de FIBRA RADIAL —cada sección por un plano perpendicular
   al eje es una recta que pasa por él—, que es lo que le deja aguantar la
   fuerza centrífuga a 900 °C: sólo se curva en el exductor, donde endereza el
   gas para que salga sin remolino. */
const gT=x=>x>0.30?-0.55*Math.pow((x-0.30)/0.10,2):0;
function ruedaCompresor(){
  const g=new THREE.Group();
  const perfil=[[0,-0.505],[0.022,-0.505],[0.030,-0.497],[0.030,-0.478]];
  for(let i=0;i<=24;i++){ const h=hubC(i/24); perfil.push([h[1],h[0]]); }
  perfil.push([0.165,-0.207],[0.110,-0.202],[0.040,-0.198],[0,-0.198]);
  g.add(malla(revX(perfil,48),MAT.ruedaC));
  for(let j=0;j<Z_C;j++) for(const div of [false,true]){
    const m0=div?0.42:0, th0=j*DOSPI/Z_C+(div?Math.PI/Z_C:0);
    const geo=P3.cascara((u,v)=>{
      const m=m0+(1-m0)*u, h=hubC(m), s=shrC(m), w=-0.04+1.04*v;
      // el álabe arranca un pelo DENTRO del cubo: así no queda rendija de luz
      const x=h[0]+(s[0]-h[0])*w, r=h[1]+(s[1]-h[1])*w;
      const th=th0+thetaC(m);
      return [x,r*Math.cos(th),r*Math.sin(th)];
    },{nu:div?14:22,nv:5,espesor:div?0.0045:0.0055});
    g.add(malla(geo,MAT.ruedaC));
  }
  compacta(g);
  return g;
}
function ruedaTurbina(){
  const g=new THREE.Group();
  const perfil=[[0,0.188],[0.030,0.188],[0.140,0.196],[0.152,0.200],[0.152,0.205]];
  for(let i=1;i<=24;i++){ const h=hubT(i/24); perfil.push([h[1],h[0]]); }
  perfil.push([0.034,0.412],[0,0.414]);
  g.add(malla(revX(perfil,48),MAT.ruedaT));
  for(let j=0;j<Z_T;j++){
    const th0=j*DOSPI/Z_T;
    const geo=P3.cascara((u,v)=>{
      const h=hubT(u), s=shrT(u), w=-0.04+1.04*v;
      const x=h[0]+(s[0]-h[0])*w, r=h[1]+(s[1]-h[1])*w;
      const th=th0+gT(x);
      return [x,r*Math.cos(th),r*Math.sin(th)];
    },{nu:20,nv:5,espesor:0.0065});
    g.add(malla(geo,MAT.ruedaT));
  }
  compacta(g);
  return g;
}
/* LAS CARACOLAS. Cada carcasa es un barrido alrededor del eje con su perfil
   meridiano, y lo único que cambia con el ángulo es la caracola: un canal de
   sección circular cuya ÁREA crece en proporción al aire que ya ha recogido
   (compresor) o mengua en proporción al gas que ya ha entregado a la rueda
   (turbina). Con el área proporcional al gasto, la velocidad a lo largo de la
   caracola es la misma en toda la vuelta, que es justo para lo que se diseña.
   El perfil se escribe en (ξ, r): ξ es la distancia axial desde la cara
   trasera de la rueda hacia la boca (la del aire en el compresor, la del
   escape en la turbina). */
const CC={x0:-0.215,s:-1,c:0.006,rBore:0.118,tTubo:0.016,xiLip:0.445,xiSh:0.29,
  xiF:0.036,xiB:-0.004,R3:0.245,t:0.014,rhoMin:0.026,rhoMax:0.080,
  shroud:mu=>{ const p=shrC(mu); return [-0.215-p[0],p[1]]; }, cordon:true};
const CT={x0:0.205,s:1,c:0.006,rBore:0.122,tTubo:0.018,xiLip:0.265,xiSh:0.135,
  xiF:0.046,xiB:-0.004,R3:0.195,t:0.016,rhoMin:0.028,rhoMax:0.080,
  shroud:mu=>{ const p=shrT(1-mu); return [p[0]-0.205,p[1]]; }, brida:{xi0:0.232,r:0.272}};
// Área lineal en la vuelta: ρ(f) = √(ρmín² + (ρmáx² − ρmín²)·f).
const rhoDeF=(K,f)=>Math.sqrt(K.rhoMin*K.rhoMin+(K.rhoMax*K.rhoMax-K.rhoMin*K.rhoMin)*clamp(f,0,1));
// Lo que ha recorrido la caracola en el ángulo φ: el compresor arranca en la
// lengüeta (φ = 3π/2, detrás) y la turbina recibe el gas arriba (φ = 0).
const fComp=phi=>(((phi-1.5*Math.PI)%DOSPI)+DOSPI)%DOSPI/DOSPI;
const fTurb=phi=>clamp(1-phi/DOSPI,0,1);
const xiS=K=>(K.xiF+K.xiB)/2;
const RsDe=(K,rho)=>K.R3+Math.sqrt(Math.max(1e-9,rho*rho-((K.xiF-K.xiB)/2)**2));
function perfilCaracola(K,rho,rhoTope){
  const P=[], xs=xiS(K), Rs=RsDe(K,rho), rt=K.rBore+K.tTubo;
  const xiBack=xs-(rhoTope+K.t)-0.004;
  const pon=(xi,r)=>P.push([K.x0+K.s*xi,r]);
  pon(K.xiLip,K.rBore);
  const eye=K.shroud(0);
  pon(eye[0],K.rBore);
  // la pared que copia la punta de los álabes, a la holgura c
  for(let i=1;i<=12;i++){
    const mu=i/12, p=K.shroud(mu), q=K.shroud(Math.max(0,mu-0.01)), q2=K.shroud(Math.min(1,mu+0.01));
    let tx=q2[0]-q[0], tr=q2[1]-q[1]; const l=Math.hypot(tx,tr)||1; tx/=l; tr/=l;
    pon(p[0]+K.c*tr, p[1]-K.c*tx);
  }
  // el difusor (compresor) o la tobera sin álabes (turbina) y la caracola
  const af=Math.atan2(K.R3-Rs,K.xiF-xs), ab=Math.atan2(K.R3-Rs,K.xiB-xs)+DOSPI;
  for(let i=0;i<=26;i++){ const a=af+(ab-af)*i/26; pon(xs+rho*Math.cos(a),Rs+rho*Math.sin(a)); }
  pon(xiBack,K.R3);
  pon(xiBack,Rs);
  for(let i=0;i<=18;i++){ const a=Math.PI-Math.PI*i/18; pon(xs+(rho+K.t)*Math.cos(a),Rs+(rho+K.t)*Math.sin(a)); }
  // la cara frontal, redondeada hasta el hombro del tubo
  const A=[xs+rho+K.t,Rs], C=[K.xiSh,rt], B=[K.xiSh,Rs];
  for(let i=1;i<=6;i++){ const u=i/6, w=1-u;
    pon(w*w*A[0]+2*w*u*B[0]+u*u*C[0], w*w*A[1]+2*w*u*B[1]+u*u*C[1]); }
  if(K.cordon){
    // el cordón de la boca, donde se abraza el manguito de admisión
    pon(0.395,rt); pon(0.400,rt+0.012); pon(0.418,rt+0.012); pon(0.423,rt); pon(K.xiLip,rt);
  }else{
    const b=K.brida; pon(b.xi0,rt); pon(b.xi0,b.r); pon(K.xiLip,b.r);
  }
  return P;
}
/* Una carcasa entera: la mitad de atrás barrida de φ = π a 2π, las dos caras de
   sección y, en el compresor, el cuello de salida que sube por detrás. */
function carcasa(K,fDe,matCuerpo,matCorte){
  const tope=Math.max(rhoDeF(K,fDe(Math.PI)),rhoDeF(K,fDe(1.5*Math.PI-1e-4)),rhoDeF(K,fDe(DOSPI)));
  const {cuerpo,corte}=barridoX(phi=>perfilCaracola(K,rhoDeF(K,fDe(phi)),tope),Math.PI,DOSPI,SEGS.caracola);
  const g=new THREE.Group();
  g.add(malla(cuerpo,matCuerpo)); g.add(malla(corte,matCorte,false));
  return g;
}
const SEGS={caracola:calAlta()?72:48, rev:calAlta()?40:28};

/* EL CUERPO CENTRAL (el «cartucho»): fundición con la cavidad de los cojinetes,
   la placa trasera del compresor —que es la pared de atrás de su difusor—, la
   pantalla térmica de la turbina, los dos cojinetes flotantes de bronce, el de
   empuje, el eje y la galería de aceite. Va fijo en el banco: las dos carcasas
   se montan sobre él, una por cada lado. */
function construyeCartucho(){
  const g=new THREE.Group();
  const cuerpo=[[0.072,-0.133],[0.160,-0.133],[0.160,-0.115],[0.105,-0.112],[0.105,-0.070],[0.122,-0.065],
    [0.122,0.060],[0.150,0.065],[0.150,0.100],[0.120,0.104],[0.120,0.168],[0.030,0.168],[0.030,0.100],
    [0.040,0.100],[0.040,-0.105],[0.072,-0.105]];
  const hueco=[[-0.032,0.122],[-0.008,0.122],[-0.008,0.040],[-0.032,0.040]];
  { const {cuerpo:cu,corte}=medioX(cuerpo,SEGS.rev);
    g.add(malla(cu,MAT.chra));
    // la cara de sección de arriba lleva abierta la galería del aceite
    const arriba=P3.caraPlana(cuerpo.map(([r,x])=>[x,r]),{huecos:[hueco]});
    const abajo=P3.caraPlana(cuerpo.map(([r,x])=>[x,-r]));
    g.add(malla(P3.fusiona([arriba,abajo]),MC.chra,false)); }
  // la galería: un taladro de Ø 24 que baja de la toma de aceite a los cojinetes
  { const t=new THREE.CylinderGeometry(0.012,0.012,0.082,16,1,true,Math.PI/2,Math.PI);
    t.translate(-0.020,0.081,0);
    g.add(malla(t,std({color:0x3a3f45,roughness:0.5,metalness:0.6,side:THREE.BackSide}),false)); }
  // la toma de aceite (arriba) y el retorno (abajo), cortados
  for(const [y0,y1,rIn,rOut,x] of [[0.122,0.205,0.012,0.045,-0.020],[-0.205,-0.120,0.030,0.058,0.000]]){
    const {cuerpo:cu,corte}=P3.mediaRevolucion([[rIn,y0],[rOut,y0],[rOut,y1],[rIn,y1]],{seg:24});
    // mediaRevolucion gira alrededor de +Y y conserva z ≤ 0: es justo un taladro vertical
    cu.translate(x,0,0); corte.translate(x,0,0);
    g.add(malla(cu,MAT.chra)); g.add(malla(corte,MC.chra,false));
  }
  // la placa trasera del compresor, rebajada detrás de la rueda
  { const p=[[0.028,-0.195],[0.168,-0.203],[0.172,-0.211],[0.243,-0.211],[0.243,-0.133],[0.028,-0.133]];
    const {cuerpo:cu,corte}=medioX(p,SEGS.rev); g.add(malla(cu,MAT.aluFun)); g.add(malla(corte,MC.alu,false)); }
  // la pantalla térmica de la turbina, que es la pared de atrás de su tobera
  { const p=[[0.032,0.168],[0.190,0.168],[0.190,0.200],[0.157,0.200],[0.155,0.186],[0.032,0.180]];
    const {cuerpo:cu,corte}=medioX(p,SEGS.rev); g.add(malla(cu,MAT.inox)); g.add(malla(corte,MC.inox,false)); }
  // los cojinetes: dos casquillos flotantes y el de empuje, de bronce
  for(const [x0,x1,r0,r1] of [[-0.100,-0.052,0.0235,0.0395],[0.022,0.070,0.0235,0.0395],[-0.124,-0.108,0.0235,0.070]]){
    const {cuerpo:cu,corte}=medioX([[r0,x0],[r1,x0],[r1,x1],[r0,x1]],24);
    g.add(malla(cu,MAT.bronce)); g.add(malla(corte,MC.bronce,false));
  }
  compacta(g);
  // EL EJE, entero y vivo: gira con las dos ruedas. Con el cuello rectificado de
  // los cojinetes y la rosca de la tuerca del compresor.
  const eje=new THREE.Group(); eje.userData.vivo=true;
  eje.add(malla(revX([[0,-0.500],[0.016,-0.500],[0.016,-0.196],[0.022,-0.192],[0.022,0.150],[0.026,0.156],
    [0.026,0.190],[0,0.190]],28),MAT.eje));
  g.add(eje);
  g.userData.eje=eje;
  return g;
}

/* EL COMPRESOR: carcasa de aluminio con su caracola, el cuello de salida que
   sube por detrás y la rueda. */
function construyeCompresor(){
  const g=new THREE.Group();
  g.add(carcasa(CC,fComp,MAT.aluFun,MC.alu));
  // el cuello de salida: la última sección de la caracola sigue tangente, hacia arriba
  const xs=CC.x0-xiS(CC), Rs=RsDe(CC,CC.rhoMax);
  { const cu=new THREE.Group();
    cu.add(malla(new THREE.CylinderGeometry(CC.rhoMax+CC.t,CC.rhoMax+CC.t*1.2,0.50,36,1,true).translate(0,0.25,0),MAT.aluFun));
    cu.add(malla(revY([[CC.rhoMax-0.004,0.50],[CC.rhoMax+CC.t+0.010,0.50],[CC.rhoMax+CC.t+0.010,0.486],
      [CC.rhoMax+CC.t,0.480]]),MAT.aluFun));
    // el interior del cuello: sólo asoma por la boca de arriba
    cu.add(malla(new THREE.CylinderGeometry(CC.rhoMax,CC.rhoMax,0.44,32,1,true).translate(0,0.28,0),
      std({color:0x6b7077,roughness:0.6,metalness:0.6,side:THREE.BackSide}),false));
    cu.position.set(xs,0,-Rs); g.add(cu); }
  const rueda=ruedaCompresor(); rueda.userData.vivo=true; g.add(rueda);
  g.userData.rueda=rueda;
  compacta(g);
  return g;
}
function revY(perfil,seg=32){ const g=P3.revolucion(P3.perfilCerrado(perfil),{seg}); return g; }

/* LA TURBINA: carcasa de fundición, su conducto de entrada —que llega por
   detrás, desde el colector, y se abre en el plano de corte—, el canal de la
   descarga (fundido en la carcasa, por detrás del plano) y la rueda. */
const DUCTO_T={x:CT.x0+xiS(CT), y:0.36, r:0.080, t:0.018, z0:-0.30};
function construyeTurbina(){
  const g=new THREE.Group();
  g.add(carcasa(CT,fTurb,MAT.hierro,MC.hierro));
  const D=DUCTO_T;
  { // el conducto de entrada, a lo largo de z, de la brida del colector al corte
    const exterior=new THREE.CylinderGeometry(D.r+D.t,D.r+D.t,-D.z0,40,1,true).rotateX(Math.PI/2).translate(D.x,D.y,D.z0/2);
    g.add(malla(exterior,MAT.hierro));
    const interior=new THREE.CylinderGeometry(D.r,D.r,-D.z0,40,1,true).rotateX(Math.PI/2).translate(D.x,D.y,D.z0/2);
    const mIn=std({color:0x3b3532,roughness:0.85,metalness:0.4,side:THREE.BackSide,emissive:0xff3a10,emissiveIntensity:0});
    mIn.userData.calor='T3'; g.add(malla(interior,mIn,false));
    // su boca en el plano de corte: el anillo de la pared, rayado
    const anillo=P3.caraPlana(P3.circulo(D.x,D.y,D.r+D.t,40),{huecos:[P3.circulo(D.x,D.y,D.r,40).reverse()]});
    g.add(malla(anillo,MC.hierro,false));
    // la brida que se atornilla al colector
    const br=P3.extruido(P3.contornoRedondeado([[-0.15,-0.13],[0.15,-0.13],[0.15,0.13],[-0.15,0.13]],0.04,4),
      {espesor:0.026,bisel:0.004,huecos:[P3.circulo(0,0,D.r,32)]});
    br.translate(D.x,D.y,D.z0+0.013); g.add(malla(br,MAT.hierro));
  }
  { // el canal de la descarga: sale del conducto y llega a la cara de salida
    const geo=tuboGeo([new THREE.Vector3(D.x+0.05,D.y-0.02,-0.06),new THREE.Vector3(0.40,0.27,-0.050),
      new THREE.Vector3(CT.x0+CT.xiLip-0.004,0.205,-0.046)],0.040,{tseg:24,rseg:16});
    g.add(malla(geo,MAT.hierro));
    // su boca en la cara de salida (oscura: por ahí se ve el hueco cuando abre)
    const boca=new THREE.Mesh(new THREE.CircleGeometry(0.034,28).rotateY(Math.PI/2),
      new THREE.MeshBasicMaterial({color:0x0b0908}));
    boca.position.set(CT.x0+CT.xiLip+0.0015,0.205,-0.046); g.add(boca);
    const asiento=aro(0.038,0.006,MAT.hierro,'x',28); asiento.position.set(CT.x0+CT.xiLip+0.002,0.205,-0.046); g.add(asiento);
  }
  const rueda=ruedaTurbina(); rueda.userData.vivo=true; g.add(rueda);
  g.userData.rueda=rueda;
  compacta(g);
  return g;
}

/* LA VÁLVULA DE DESCARGA: la trampilla redonda sobre su asiento, en la boca del
   canal de descarga y dentro del bajante; su eje, que atraviesa la pared y sale
   por detrás; la palanca de fuera, la varilla y la cápsula neumática en su
   escuadra. La presión de soplado empuja el diafragma contra el muelle, la
   varilla sube, la palanca gira y la trampilla abre. El área que abre una
   trampilla es ∝ a su alzado, ∝ sen θ: por eso la carrera de la varilla,
   L·sen θ, es proporcional a la apertura x que da el modelo. */
const WG={pivote:new THREE.Vector3(CT.x0+CT.xiLip+0.004,0.250,-0.046), zBrazo:-0.25, Lbrazo:0.075,
  capsula:new THREE.Vector3(0.556,0.62,-0.25)};
function construyeDescarga(){
  const g=new THREE.Group();
  const C=WG.capsula;
  // la cápsula: dos conchas engarzadas con el diafragma entre ellas (eje vertical)
  const conchas=revY([[0,-0.055],[0.080,-0.055],[0.096,-0.028],[0.100,-0.006],[0.106,0],[0.100,0.006],
    [0.096,0.028],[0.080,0.055],[0,0.055]],40);
  const cap=malla(conchas,std({color:0x8b939c,roughness:0.40,metalness:0.85,envMapIntensity:1.1}));
  cap.position.copy(C); g.add(cap);
  // la toma de presión arriba
  const tom=malla(new THREE.CylinderGeometry(0.011,0.011,0.05,12),MAT.acero);
  tom.position.set(C.x,C.y+0.075,C.z); g.add(tom);
  // la escuadra que la ata al canal de la descarga
  { const a=new THREE.Vector3(C.x-0.07,C.y-0.05,C.z), b=new THREE.Vector3(0.43,0.26,-0.10);
    const d=b.clone().sub(a), l=d.length();
    const esc=roundedBox(0.045,l,0.012,MAT.acero,0.25);
    esc.position.copy(a).addScaledVector(d,0.5); esc.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
    g.add(esc);
    const pie=roundedBox(0.10,0.014,0.060,MAT.acero,0.2); pie.position.set(C.x-0.03,C.y-0.062,C.z); g.add(pie); }
  // la trampilla y su eje: giran juntos alrededor de z, en el pivote
  const piv=new THREE.Group(); piv.position.copy(WG.pivote); piv.userData.vivo=true; g.add(piv);
  const plato=revX([[0,0],[0.040,0],[0.036,0.010],[0,0.012]],28); plato.translate(0,-0.045,0);
  const mPl=std({color:0x6b625a,roughness:0.6,metalness:0.7,emissive:0xff3a10,emissiveIntensity:0});
  mPl.userData.calor='T3'; piv.add(malla(plato,mPl));
  const brazoT=roundedBox(0.012,0.034,0.020,MAT.acero,0.2); brazoT.position.set(0.006,-0.014,0); piv.add(brazoT);
  piv.add(malla(new THREE.CylinderGeometry(0.009,0.009,Math.abs(WG.zBrazo-WG.pivote.z)+0.02,12)
    .rotateX(Math.PI/2).translate(0,0,(WG.zBrazo-WG.pivote.z)/2),MAT.acero));
  // la palanca de fuera, en el mismo eje, apuntando a +x
  const pal=new THREE.Group(); pal.position.set(WG.pivote.x,WG.pivote.y,WG.zBrazo); pal.userData.vivo=true; g.add(pal);
  const br=roundedBox(WG.Lbrazo+0.02,0.024,0.012,MAT.acero,0.25); br.position.set(WG.Lbrazo/2,0,0); pal.add(br);
  // la varilla: se recoloca cada fotograma entre la punta de la palanca y la cápsula
  const vari=malla(new THREE.CylinderGeometry(0.0080,0.0080,1,12),MAT.eje); vari.userData.vivo=true; g.add(vari);
  compacta(piv); compacta(g);
  g.userData={trampilla:piv, palanca:pal, varilla:vari};
  poseDescarga(g,0);
  return g;
}
/* La varilla y la palanca para una apertura de trampilla θ. */
const _vA=new THREE.Vector3(), _vB=new THREE.Vector3(), _vY=new THREE.Vector3(0,1,0);
function poseDescarga(o,theta){
  const u=o.userData; if(!u||!u.trampilla) return;
  u.trampilla.rotation.z=theta; u.palanca.rotation.z=theta;
  const C=WG.capsula, L=WG.Lbrazo;
  _vA.set(WG.pivote.x+L*Math.cos(theta),WG.pivote.y+L*Math.sin(theta),WG.zBrazo);
  _vB.set(C.x,C.y-0.055,C.z);
  const l=_vA.distanceTo(_vB);
  u.varilla.position.copy(_vA).lerp(_vB,0.5);
  u.varilla.scale.set(1,l,1);
  u.varilla.quaternion.setFromUnitVectors(_vY,_vB.clone().sub(_vA).normalize());
}

/* EL FILTRO: caja de polímero cortada por su eje, con el elemento de papel
   PLISADO dentro. El aire entra por la trompa de la izquierda, llena el
   espacio de fuera del elemento, atraviesa los pliegues hacia dentro y sale
   limpio por el centro. Lo que filtra es la superficie: por eso se pliega. */
const FIL={L:0.21, R:0.205, rEl:0.175, rIn:0.112, xEl:0.16};
const MAT_PU=std({color:0xc46a2a,roughness:0.7,metalness:0.0});
function construyeFiltro(){
  const g=new THREE.Group();
  const ext=[[0.090,-0.32],[0.090,-0.25],[0.120,-0.225],[0.180,-0.205],[0.205,-0.170],[0.205,0.170],
    [0.180,0.205],[0.120,0.225],[0.085,0.245],[0.085,0.290]];
  const int=P3.desplaza(ext.map(([r,x])=>[x,r]),-0.012).map(([x,r])=>[r,x]);
  const perfil=ext.concat(int.reverse());
  const {cuerpo,corte}=medioX(perfil,SEGS.rev);
  const plas=std({color:0x2a3138,roughness:0.55,metalness:0.06,envMapIntensity:0.8,side:THREE.DoubleSide});
  g.add(malla(cuerpo,plas)); g.add(malla(corte,MC.plas,false));
  // el elemento plisado: 46 pliegues en la media vuelta de atrás
  const pz=[], N=46;
  for(let i=0;i<=N;i++){ const a=Math.PI+Math.PI*i/N, r=(i%2)?FIL.rIn:FIL.rEl; pz.push([r*Math.cos(a),r*Math.sin(a)]); }
  const pos=[], idx=[];
  for(let i=0;i<pz.length;i++) for(const x of [-FIL.xEl,FIL.xEl]) pos.push(x,pz[i][0],pz[i][1]);
  for(let i=0;i<pz.length-1;i++){ const a=i*2; idx.push(a,a+1,a+2, a+1,a+3,a+2); }
  const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  pg.setIndex(idx); pg.computeVertexNormals();
  const uvs=[]; for(let i=0;i<pz.length;i++) uvs.push(i/pz.length,0,i/pz.length,1);
  pg.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.add(malla(pg,MAT.papel));
  // las dos tapas de poliuretano del elemento
  for(const x of [-FIL.xEl-0.012,FIL.xEl]){
    const {cuerpo:cu,corte:co}=medioX([[FIL.rIn-0.006,x],[FIL.rEl+0.006,x],[FIL.rEl+0.006,x+0.012],[FIL.rIn-0.006,x+0.012]],32);
    g.add(malla(cu,MAT_PU)); g.add(malla(co,MAT_PU,false));
  }
  // la malla de soporte interior (alambre)
  { const {cuerpo:cu}=medioX([[FIL.rIn-0.010,-FIL.xEl],[FIL.rIn-0.007,-FIL.xEl],[FIL.rIn-0.007,FIL.xEl],[FIL.rIn-0.010,FIL.xEl]],32);
    g.add(malla(cu,std({color:0x8c939a,roughness:0.5,metalness:0.8,transparent:true,opacity:0.55}),false)); }
  compacta(g);
  return g;
}

/* EL INTERCOOLER: diez tubos planos de aluminio con aletas onduladas entre
   ellos y dos depósitos de fundición, cortado por su plano medio. El aire de
   carga va por DENTRO de los tubos (de izquierda a derecha); el de la calle
   cruza las aletas de delante hacia atrás. Toda la superficie que el método
   ε-NTU mete en la cuenta está aquí. Marco local: centro del núcleo, tubos a
   lo largo de x, corte en z = 0. */
const ICG={L:1.15, H:0.34, D:0.11, n:10, h:0.022, w:0.003, tanque:0.15, hT:0.40, dT:0.16, boca:0.068, yBoca:0.05};
const tuboY=k=>-ICG.H/2+ICG.H/ICG.n*(k+0.5);
const MAT_INT_IC=std({color:0x363c44,roughness:0.6,metalness:0.6});
const MAT_HUECO=new THREE.MeshBasicMaterial({color:0x101317,side:THREE.DoubleSide});
function construyeIntercooler(){
  const g=new THREE.Group(), L=ICG.L, D=ICG.D, h=ICG.h, w=ICG.w;
  // la media sección de un tubo plano (estadio): de (y=+h/2, z=0) por detrás a (y=−h/2, z=0)
  const estadio=(hh,dd,n=10)=>{ const P=[], rr=hh/2, zc=-dd/2+rr;
    P.push([hh/2,0],[hh/2,zc]);
    for(let i=1;i<n;i++){ const a=Math.PI*i/n; P.push([rr*Math.cos(a),zc-rr*Math.sin(a)]); }
    P.push([-hh/2,zc],[-hh/2,0]); return P; };
  const barre=(S,adentro)=>{ const pos=[],nor=[],uv=[],idx=[];
    for(let j=0;j<S.length;j++) for(const x of [-L/2,L/2]) pos.push(x,S[j][0],S[j][1]);
    for(let j=0;j<S.length-1;j++){ const a=j*2; if(adentro) idx.push(a,a+2,a+1, a+1,a+2,a+3); else idx.push(a,a+1,a+2, a+1,a+3,a+2); }
    for(let j=0;j<S.length;j++) uv.push(0,j/S.length,1,j/S.length);
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.setIndex(idx); geo.computeVertexNormals(); return geo; };
  const ext=[], int=[], cortes=[];
  for(let k=0;k<ICG.n;k++){
    const y=tuboY(k);
    ext.push(barre(estadio(h,D),false).translate(0,y,0));
    int.push(barre(estadio(h-2*w,D-2*w),true).translate(0,y,0));
    cortes.push(P3.caraPlana([[-L/2,y+h/2-w],[L/2,y+h/2-w],[L/2,y+h/2],[-L/2,y+h/2]]),
      P3.caraPlana([[-L/2,y-h/2],[L/2,y-h/2],[L/2,y-h/2+w],[-L/2,y-h/2+w]]));
  }
  g.add(malla(P3.fusiona(ext),MAT.tuboIC));
  g.add(malla(P3.fusiona(int),std({color:0x343a42,roughness:0.55,metalness:0.6})));
  g.add(malla(P3.fusiona(cortes),MC.alu,false));
  // las aletas: una chapa ondulada entre cada par de tubos, de canto a canto en z
  { const pos=[], idx=[], paso=0.022, gap=ICG.H/ICG.n-h;
    let base=0;
    for(let k=0;k<=ICG.n;k++){
      const yb=k===0?-ICG.H/2-gap/2:tuboY(k-1)+h/2, yt=k===ICG.n?ICG.H/2+gap/2:tuboY(k)-h/2;
      if(k===0||k===ICG.n) continue;
      const n=Math.round(L/paso);
      for(let i=0;i<=n;i++){ const x=-L/2+L*i/n, y=(i%2)?yt-0.0008:yb+0.0008;
        pos.push(x,y,0, x,y,-D/2); }
      for(let i=0;i<n;i++){ const a=base+i*2; idx.push(a,a+1,a+2, a+1,a+3,a+2); }
      base+=(n+1)*2;
    }
    const ag=new THREE.BufferGeometry(); ag.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    ag.setIndex(idx); ag.computeVertexNormals();
    const uvs=new Float32Array(pos.length/3*2); ag.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
    g.add(malla(ag,MAT.aleta,false)); }
  // las chapas laterales de arriba y abajo del panal
  for(const s of [-1,1]){ const c=new THREE.Mesh(new THREE.BoxGeometry(L,0.006,D/2),MAT.acero);
    c.position.set(0,s*(ICG.H/2+0.004),-D/4); c.castShadow=true; g.add(c); }
  // los depósitos: cajas huecas cortadas por la mitad, con su borde rayado
  const T=ICG.tanque, HT=ICG.hT, DT=ICG.dT, e=0.010;
  for(const s of [-1,1]){
    const xc=s*(L/2+T/2), dep=new THREE.Group();
    const caja=(w0,h0,d0,adentro)=>{ const b=new THREE.BoxGeometry(w0,h0,d0/2); b.translate(0,0,-d0/4);
      // se quita la cara de delante (la del corte): grupo 4 de BoxGeometry es +z
      const pos=b.attributes.position, nor=b.attributes.normal, ix=b.index.array, keep=[];
      for(let t=0;t<ix.length;t+=3){ const a=ix[t]; if(nor.getZ(a)>0.9) continue; keep.push(ix[t],ix[t+1],ix[t+2]); }
      b.setIndex(keep); if(adentro){ const I=b.index.array; for(let t=0;t<I.length;t+=3){ const q=I[t+1]; I[t+1]=I[t+2]; I[t+2]=q; }
        for(let i=0;i<nor.count;i++) nor.setXYZ(i,-nor.getX(i),-nor.getY(i),-nor.getZ(i)); }
      return b; };
    dep.add(malla(caja(T,HT,DT,false),MAT.aluFun));
    dep.add(malla(caja(T-2*e,HT-2*e,DT-2*e,true),MAT_INT_IC,false));
    const rim=P3.caraPlana([[-T/2,-HT/2],[T/2,-HT/2],[T/2,HT/2],[-T/2,HT/2]],{huecos:[[[-T/2+e,-HT/2+e],[-T/2+e,HT/2-e],[T/2-e,HT/2-e],[T/2-e,-HT/2+e]]]});
    dep.add(malla(rim,MC.alu,false));
    // la boca, de lado y cortada por el mismo plano: por la de la izquierda
    // entra el aire caliente y por la de la derecha sale el frío
    const {pared,interior,corte}=P3.tuboCortado([[s*(T/2-0.01),ICG.yBoca],[s*(T/2+0.10),ICG.yBoca]],ICG.boca,ICG.boca+0.010,{seg:6,radial:14});
    dep.add(malla(pared,MAT.aluFun)); dep.add(malla(interior,MAT_INT_IC,false));
    dep.add(malla(corte,MC.alu,false));
    // el agujero de la boca en la pared del depósito, visto desde dentro
    const ag=new THREE.Mesh(new THREE.CircleGeometry(ICG.boca,24,Math.PI/2,Math.PI).rotateY(-Math.PI/2),
      MAT_HUECO);
    ag.position.set(s*(T/2-e-0.0015),ICG.yBoca,0); dep.add(ag);
    dep.position.x=xc; g.add(dep);
  }
  compacta(g);
  return g;
}

/* LA MARIPOSA: cuerpo de aluminio cortado por su eje, el plato con su borde en
   bisel, el motor de mando y el potenciómetro. A plena carga, abierta del todo. */
function construyeMariposa(){
  const g=new THREE.Group();
  const p=[[0.072,-0.13],[0.110,-0.13],[0.110,-0.105],[0.088,-0.098],[0.088,0.098],[0.110,0.105],[0.110,0.13],[0.072,0.13]];
  const {cuerpo,corte}=medioX(p,SEGS.rev);
  g.add(malla(cuerpo,MAT.aluFun)); g.add(malla(corte,MC.alu,false));
  const cav=new THREE.CylinderGeometry(0.072,0.072,0.26,28,1,true,Math.PI/2,Math.PI).rotateZ(Math.PI/2);
  g.add(malla(cav,std({color:0x7d848c,roughness:0.5,metalness:0.7,side:THREE.BackSide}),false));
  const plato=new THREE.Group(); plato.userData.vivo=true; g.add(plato);
  plato.add(malla(revX([[0,-0.004],[0.068,-0.006],[0.070,0],[0.068,0.006],[0,0.004]],32),MAT.eje));
  plato.add(malla(new THREE.CylinderGeometry(0.007,0.007,0.22,12),MAT.eje));
  const mot=roundedBox(0.16,0.12,0.10,MAT.caja,0.15); mot.position.set(0,0.165,-0.04); g.add(mot);
  const tps=malla(new THREE.CylinderGeometry(0.035,0.035,0.03,20),MAT.caja); tps.position.set(0,-0.125,0); g.add(tps);
  compacta(g);
  g.userData.plato=plato;
  return g;
}
/* EL SENSOR DE PRESIÓN Y TEMPERATURA del colector, con su testigo de avería. */
function construyeTmap(){
  const g=new THREE.Group();
  const cu=roundedBox(0.10,0.08,0.075,MAT.caja,0.18); cu.position.y=0.07; g.add(cu);
  const va=malla(new THREE.CylinderGeometry(0.016,0.016,0.06,14),std({color:0x8d99a6,roughness:0.40,metalness:0.72}));
  va.position.y=0.015; g.add(va);
  const co=roundedBox(0.06,0.05,0.04,std({color:0x30363e,...plas}),0.15); co.position.set(0.055,0.075,0); g.add(co);
  const tes=malla(new THREE.CylinderGeometry(0.014,0.014,0.008,16),std({color:0x3a3116,emissive:0x000000,
    emissiveIntensity:0,roughness:0.4})); tes.rotation.x=Math.PI/2; tes.position.set(-0.02,0.08,0.04); g.add(tes);
  compacta(g);
  g.userData.testigo=tes;
  return g;
}
const PART={
  filtro:{ rot:'Filtro de aire', fn:'Deja pasar el aire y retiene la suciedad.',
    sin:'Sin él, el compresor se come la arena.',
    para:'Estorba a la ENTRADA, que es donde más caro sale: cada milibar que falta ahí el compresor lo tiene que poner con más vueltas. Y esa es la clave de lo que enseña sucio: cuesta muy poco par y mucha velocidad de eje.',
    nota:'El aire ya entra limpio.'},
  compresor:{ rot:'Compresor', fn:'Comprime el aire de admisión.',
    sin:'Sin él el motor es atmosférico y punto.',
    para:'Vive dentro de un MAPA cerrado: para cada velocidad hay una curva de presión contra gasto, con el bombeo a la izquierda y el bloqueo a la derecha. Fuera de esa ventana no hay presión que valga.',
    nota:'Ya hay quien comprima.'},
  intercooler:{ rot:'Intercooler', fn:'Enfría el aire que sale del compresor.',
    sin:'Sin él el aire entra caliente: misma presión del compresor, menos densidad.',
    para:'Enfría Y estorba, las dos cosas a la vez. Por eso hay un tamaño óptimo: uno demasiado grande baja tanto la presión que se come lo que ganó bajando la temperatura.',
    nota:'Ahora el aire llega frío, que es lo que hace falta.'},
  mariposa:{ rot:'Mariposa', fn:'Decide cuánto aire deja pasar al motor.',
    sin:'Sin ella no hay forma de pedir menos.',
    para:'Aquí es un mando de CARGA, no una restricción modelada: a plena carga está abierta de par en par y quien manda es el turbo.',
    nota:'Ya se puede pedir menos de todo.'},
  turbina:{ rot:'Turbina', fn:'Saca del escape la potencia que el compresor gasta.',
    sin:'Sin ella el compresor no tiene quien lo mueva.',
    para:'Traga por una ley de tobera: el gasto que le mandan FIJA la presión que hay delante de ella. Por eso una turbina pequeña sopla antes y ahoga después.',
    nota:'El eje ya tiene quien lo empuje.'},
  wastegate:{ rot:'Válvula de descarga', fn:'Desvía escape para que el turbo no se pase.',
    sin:'Sin ella no hay nada que frene al turbo.',
    para:'Es la SEGUNDA tobera, en paralelo con la turbina. Cuanto más abre, menos gasto pasa por la turbina y menos potencia saca: así es como se limita el soplado.',
    nota:'Ya hay quien ponga el freno.'},
  tmap:{ rot:'Sensor de presión y temperatura', fn:'Es TODO lo que el ordenador ve del turbo.',
    sin:'Sin él el ordenador no sabe ni qué presión hay.',
    para:'Mide presión ABSOLUTA de colector y temperatura de admisión, y nada más. Ni gasto, ni vueltas de turbo, ni contrapresión, ni margen de bombeo. Por eso hay averías que le quitan a este motor la tercera parte del par sin que salte un solo código.',
    nota:'Ahora se ve lo poco que ve el ordenador.'},
};
const ORDEN=['filtro','compresor','intercooler','mariposa','turbina','wastegate','tmap'];
const PARTS=ORDEN.map(k=>({k,...PART[k]}));
const ASM={done:new Set(), sel:null};
/* Lo que hay que tener puesto antes: la cápsula de la descarga se atornilla al
   canal de la turbina y su manguera sale del compresor. */
const REQ={wastegate:['turbina','compresor']};

// ============================================== T4 · EL BANCO Y SU MOTOR
/* Todo se coloca a partir de las cotas del turbo y de su escala: el V8 lleva un
   turbo un 26 % más grande y el filtro, el colector y los manguitos se mueven
   con él. Coordenadas del mundo en metros de dibujo; el suelo del estrado está
   en y = Y_DECK. */
const Y_DECK=0.22;
const LAY={};
function calculaLayout(){
  const e=MQ(), s=escalaTurbo(e);
  LAY.s=s;
  LAY.T0=new THREE.Vector3(0,0.98,0);
  LAY.T=(x,y,z)=>new THREE.Vector3(x*s,y*s,z*s).add(LAY.T0);
  LAY.lipC=LAY.T(CC.x0-CC.xiLip,0,0);
  LAY.filtro=new THREE.Vector3(LAY.lipC.x-0.25-0.29,LAY.T0.y,0);
  LAY.cuello=LAY.T(CC.x0-xiS(CC),0.50,-RsDe(CC,CC.rhoMax));
  LAY.ducto=LAY.T(DUCTO_T.x,DUCTO_T.y,DUCTO_T.z0);
  LAY.salidaT=LAY.T(CT.x0+CT.xiLip,0,0);
  LAY.ic=new THREE.Vector3(0.0,0.50,0.62);
  LAY.motor=new THREE.Vector3(0.38,Y_DECK+0.16+0.625,-0.86);
  LAY.plenum=new THREE.Vector3(0.38,1.86,-1.22);
  LAY.mariposa=new THREE.Vector3(LAY.plenum.x+0.55+0.13,LAY.plenum.y,LAY.plenum.z);
  LAY.tmap=new THREE.Vector3(0.10,LAY.plenum.y+0.11,LAY.plenum.z);
  LAY.yLog=LAY.ducto.y; LAY.zLog=Math.min(-0.42,LAY.ducto.z-0.06);
  // las bocas de los depósitos del intercooler (de lado), en coordenadas del mundo
  const xB=ICG.L/2+ICG.tanque/2+ICG.tanque/2+0.10;
  LAY.icIn=new THREE.Vector3(LAY.ic.x-xB,LAY.ic.y+ICG.yBoca,LAY.ic.z);
  LAY.icOut=new THREE.Vector3(LAY.ic.x+xB,LAY.ic.y+ICG.yBoca,LAY.ic.z);
  return LAY;
}
calculaLayout();

/* EL ESTRADO: losa de compuesto grafito con canto de aluminio y el tapete de
   trabajo delante, donde esperan las piezas. Es lo único que no cambia. */
const ESTRADO=new THREE.Group(); scene.add(ESTRADO);
(function(){
  const W=3.9, D=3.62, cz=0.36;
  const losa=roundedBox(W,Y_DECK,D,MAT.mesa,0.06); losa.position.set(0,Y_DECK/2,cz); ESTRADO.add(losa);
  for(const sz of [-1,1]){ const c=roundedBox(W+0.03,0.03,0.026,MAT.canto,0.3); c.position.set(0,Y_DECK-0.02,cz+sz*(D/2+0.004)); ESTRADO.add(c); }
  for(const sx of [-1,1]){ const c=roundedBox(0.026,0.03,D+0.03,MAT.canto,0.3); c.position.set(sx*(W/2+0.004),Y_DECK-0.02,cz); ESTRADO.add(c); }
  const tap=roundedBox(3.7,0.008,1.06,MAT.tapete,0.5); tap.position.set(0,Y_DECK+0.004,1.58); tap.receiveShadow=true; ESTRADO.add(tap);
  // la placa rectificada bajo el motor, con sus ranuras en T
  const base=roundedBox(2.0,0.03,1.0,MAT.canto,0.12); base.position.set(LAY.motor.x,Y_DECK+0.015,LAY.motor.z); ESTRADO.add(base);
  for(const z of [-0.30,0,0.30]){ const r=new THREE.Mesh(new THREE.BoxGeometry(1.9,0.004,0.024),MAT.negro);
    r.position.set(LAY.motor.x,Y_DECK+0.031,LAY.motor.z+z); ESTRADO.add(r); }
  compacta(ESTRADO);
})();

/* EL MOTOR: el bloque, la culata, el colector de escape de tronco con sus
   cuatro ramales —de fundición, y al rojo a plena carga—, el de admisión con su
   cámara y el bajante del escape cortado por el plano del turbo. Es el sitio
   donde se monta todo, no una pieza que se monte. El V8 se dibuja con una sola
   bancada de cuatro cilindros (declarado). */
let MOTOR=null;
const RIG={eje:null, ruedaC:null, ruedaT:null, wg:null, plato:null, testigo:null, cuna:null, bajante:null};
function levantaMotor(){
  if(MOTOR){ borra(MOTOR); MOTOR=null; }
  const e=MQ(), raiz=new THREE.Group(); MOTOR=raiz; scene.add(raiz);
  calculaLayout();
  const fijo=new THREE.Group(); raiz.add(fijo);
  const blq=P3.bloqueMotor(MATP,{largo:1.30,alto:1.25,ancho:0.62,cil:4,bobinas:!e.diesel,escape:false,cuna:0.16});
  blq.position.copy(LAY.motor); fijo.add(blq);
  const ud=blq.userData, yPto=LAY.motor.y+ud.yCulata+0.25*0.46, zCara=LAY.motor.z+0.62*0.46;
  // el colector de escape de tronco
  const xs=ud.puertos.map(x=>x+LAY.motor.x), x0=Math.min(xs[0],LAY.ducto.x)-0.10, x1=xs[xs.length-1]+0.08;
  const tronco=malla(new THREE.CylinderGeometry(0.075,0.075,x1-x0,28).rotateZ(Math.PI/2).translate((x0+x1)/2,LAY.yLog,LAY.zLog),MAT.colector);
  fijo.add(tronco);
  for(const x of [x0,x1]){ const tp=malla(new THREE.SphereGeometry(0.075,20,12),MAT.colector); tp.position.set(x,LAY.yLog,LAY.zLog); fijo.add(tp); }
  for(const x of xs){
    fijo.add(malla(tuboGeo([new THREE.Vector3(x,yPto,zCara-0.02),new THREE.Vector3(x,(yPto+LAY.yLog)/2,(zCara+LAY.zLog)/2+0.01),
      new THREE.Vector3(x,LAY.yLog,LAY.zLog)],0.050,{tseg:12,rseg:14}),MAT.colector));
    const br=roundedBox(0.13,0.11,0.022,MAT.colector,0.15); br.position.set(x,yPto,zCara-0.005); fijo.add(br);
  }
  // la salida del tronco hacia la brida de la turbina
  const zB=LAY.ducto.z;
  fijo.add(malla(new THREE.CylinderGeometry(0.088*LAY.s+0.012,0.088*LAY.s+0.012,Math.max(0.02,zB-LAY.zLog),28).rotateX(Math.PI/2)
    .translate(LAY.ducto.x,LAY.yLog,(zB+LAY.zLog)/2),MAT.colector));
  { const br=P3.extruido(P3.contornoRedondeado([[-0.15,-0.13],[0.15,-0.13],[0.15,0.13],[-0.15,0.13]],0.04,4),
      {espesor:0.022,bisel:0.004,huecos:[P3.circulo(0,0,DUCTO_T.r,32)]});
    br.scale(LAY.s,LAY.s,1); br.translate(LAY.ducto.x,LAY.yLog,zB-0.012); fijo.add(malla(br,MAT.colector));
    const hueco=new THREE.Mesh(new THREE.CircleGeometry(DUCTO_T.r*LAY.s,28),new THREE.MeshBasicMaterial({color:0x0c0908}));
    hueco.position.set(LAY.ducto.x,LAY.yLog,zB-0.0005); fijo.add(hueco); }
  // la cámara de admisión y sus cuatro ramales, por detrás de la culata
  const P=LAY.plenum;
  const ple=roundedBox(1.10,0.22,0.26,MAT.culata,0.35); ple.position.copy(P); fijo.add(ple);
  const zAtras=LAY.motor.z-0.62*0.46;
  for(const x of xs) fijo.add(malla(tuboGeo([new THREE.Vector3(x,P.y-0.08,P.z+0.02),new THREE.Vector3(x,(P.y+yPto)/2,P.z+0.04),
    new THREE.Vector3(x,yPto+0.02,zAtras-0.01)],0.046,{tseg:14,rseg:14}),MAT.culata));
  // la brida de la mariposa en el extremo de la cámara
  const bm=malla(revX([[0.075,P.x+0.55],[0.12,P.x+0.55],[0.12,P.x+0.57],[0.075,P.x+0.57]],28),MAT.culata);
  bm.position.set(0,P.y,P.z); fijo.add(bm);
  // los soportes del intercooler
  for(const sx of [-1,1]){ const s=roundedBox(0.07,LAY.ic.y-ICG.hT/2-Y_DECK+0.02,0.09,MAT.pintura,0.2);
    s.position.set(LAY.ic.x+sx*(ICG.L/2+ICG.tanque/2),Y_DECK+(LAY.ic.y-ICG.hT/2-Y_DECK)/2,LAY.ic.z-0.05); fijo.add(s); }
  compacta(fijo);

  // EL BAJANTE, cortado por el plano del turbo: entra ancho —traga el escape de
  // la rueda y el de la descarga— y se estrecha camino del suelo.
  { const T=LAY.T, s=LAY.s, p0=T(CT.x0+CT.xiLip,0.08,0), xb=p0.x;
    const pts=[[p0.x,p0.y],[xb+0.13*s,p0.y-0.02*s],[xb+0.24,LAY.T0.y-0.12],[xb+0.33,LAY.T0.y-0.42],
      [xb+0.40,Y_DECK+0.22],[xb+0.56,Y_DECK+0.14],[1.05,Y_DECK+0.13],[1.62,Y_DECK+0.13]];
    const rIn=t=>0.100+(0.205*s-0.100)*Math.pow(1-clamp(t/0.20,0,1),2), rOut=t=>rIn(t)+0.010;
    const {pared,interior,corte,linea}=tuboCortadoVar(pts,rIn,rOut,{seg:72,radial:18});
    const bj=new THREE.Group();
    const mIn=std({color:0x37322f,roughness:0.75,metalness:0.6,emissive:0xff3a10,emissiveIntensity:0});
    mIn.userData.calor='Tm';
    bj.add(malla(pared,MAT.inox)); bj.add(malla(interior,mIn,false)); bj.add(malla(corte,MC.inox,false));
    // la brida contra la turbina
    const {cuerpo:cb,corte:cc}=medioX([[0.205*s,p0.x],[0.25*s,p0.x],[0.25*s,p0.x+0.026],[0.205*s,p0.x+0.026]],32);
    cb.translate(0,p0.y,0); cc.translate(0,p0.y,0);
    bj.add(malla(cb,MAT.inox)); bj.add(malla(cc,MC.inox,false));
    // la cola, de inoxidable pulido
    const cola=malla(revX([[0.098,1.60],[0.122,1.62],[0.122,1.80],[0.112,1.80],[0.112,1.64],[0.098,1.63]],32),MAT.acero);
    cola.position.set(0,Y_DECK+0.13,0); bj.add(cola);
    const ap=roundedBox(0.05,0.10,0.05,MAT.acero,0.2); ap.position.set(1.30,Y_DECK+0.05,-0.05); bj.add(ap);
    compacta(bj); raiz.add(bj);
    RIG.bajante={linea:linea.map(([x,y])=>new THREE.Vector3(x,y,0)), rIn};
  }

  // EL CARTUCHO, fijo en su sitio, con el eje y los cojinetes: las dos carcasas
  // se montan sobre él. Mientras falta alguna, lo sostiene una cuna de montaje.
  { const c=construyeCartucho(); c.position.copy(LAY.T0); c.scale.setScalar(LAY.s); raiz.add(c);
    c.userData.kind='fija'; c.userData.nombre='Cuerpo central: eje y cojinetes';
    RIG.eje=c.userData.eje; RIG.cartucho=c;
    // la cuna: un poste con su asiento bajo el alojamiento del cojinete de la
    // turbina, entre el retorno de aceite y la carcasa de la turbina
    const cuna=new THREE.Group(), s=LAY.s, yTop=LAY.T0.y-0.152*s, xP=LAY.T0.x+0.092*s;
    const poste=roundedBox(0.046*s,yTop-0.03-Y_DECK,0.05*s,MAT.pintura,0.2);
    poste.position.set(xP,Y_DECK+(yTop-0.03-Y_DECK)/2,-0.06*s); cuna.add(poste);
    const asiento=roundedBox(0.056*s,0.03,0.12*s,MAT.canto,0.25); asiento.position.set(xP,yTop-0.015,-0.07*s); cuna.add(asiento);
    const pie=roundedBox(0.16,0.02,0.16,MAT.canto,0.2); pie.position.set(xP,Y_DECK+0.01,-0.06*s); cuna.add(pie);
    compacta(cuna); raiz.add(cuna); RIG.cuna=cuna; cuna.visible=!G.simUnlocked;
    // el aceite: la toma a presión desde el bloque y el retorno al cárter
    const T=LAY.T;
    const zBlq=LAY.motor.z+0.62/2, zCar=LAY.motor.z+0.62*0.37;
    raiz.add(malla(tuboGeo([T(-0.02,0.20,-0.022),T(-0.02,0.30,-0.06),new THREE.Vector3(-0.06,1.22,-0.30),
      new THREE.Vector3(-0.08,1.02,zBlq+0.06),new THREE.Vector3(-0.08,0.98,zBlq+0.005)],0.012,{tseg:44,rseg:10}),
      std({color:0x9aa3ad,roughness:0.42,metalness:0.85})));
    raiz.add(malla(tuboGeo([T(0.0,-0.20,-0.03),T(0.0,-0.34,-0.07),new THREE.Vector3(0.03,0.52,-0.36),
      new THREE.Vector3(0.05,0.50,zCar+0.05),new THREE.Vector3(0.05,0.50,zCar+0.005)],0.026,{tseg:44,rseg:12}),MAT.goma));
  }
  return raiz;
}
function borra(o){
  o.traverse(n=>{ if(n.isMesh&&n.geometry) n.geometry.dispose(); });
  if(o.userData&&o.userData.gm) o.userData.gm.dispose();
  if(o.parent) o.parent.remove(o);
}

// ------------------------------------------------- los conductos que unen todo
/* Los manguitos de carga son de VIDRIO, para ver el aire dentro (declarado: en
   un coche son de aluminio o de silicona). Cada tramo une DOS piezas y sólo
   existe si las dos están montadas: el camino del aire se ve aparecer mientras
   se ensambla. Los empalmes llevan manguito de silicona y abrazadera. */
let conductos=[];
const CAMINOS={};
function limpiaConductos(){ conductos.forEach(o=>borra(o)); conductos=[]; }
function defineCaminos(){
  const L=LAY, T=L.T, V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const fBoca=V(L.filtro.x+0.29,L.filtro.y,0);
  CAMINOS.conducto=[fBoca,V((fBoca.x+L.lipC.x)/2,L.T0.y,0),V(L.lipC.x+0.01,L.T0.y,0)];
  /* El manguito caliente sale por arriba del cuello, pasa por DETRÁS del filtro
     y vuelve por debajo hasta la boca izquierda del intercooler: así no cruza
     por delante de ningún corte. El frío sube por la derecha, por fuera del
     bajante y del motor, hasta la mariposa. */
  const c=L.cuello, a=L.icIn, o=L.icOut, m=L.mariposa, xF=L.filtro.x;
  CAMINOS.caliente=[c.clone(),V(c.x,c.y+0.10,c.z-0.01),V(c.x-0.20,c.y+0.17,c.z-0.08),V(xF+0.14,c.y-0.02,c.z-0.10),
    V(xF+0.22,L.T0.y-0.35,-0.36),V(xF+0.28,a.y+0.01,-0.10),V(a.x-0.14,a.y,a.z-0.10),V(a.x-0.02,a.y,a.z)];
  CAMINOS.fria=[o.clone(),V(o.x+0.12,o.y,o.z-0.02),V(o.x+0.42,o.y+0.10,o.z-0.30),V(1.30,0.80,-0.08),
    V(1.33,1.25,-0.62),V(1.32,m.y-0.05,m.z+0.12),V(m.x+0.16,m.y,m.z)];
  CAMINOS.manguera=[V(c.x+0.09*L.s,c.y-0.10,c.z),V(c.x+0.20,c.y+0.10,c.z-0.06),
    V((c.x+L.T(WG.capsula.x,0,0).x)/2,L.T(0,WG.capsula.y,0).y+0.24,-0.34),
    L.T(WG.capsula.x,WG.capsula.y+0.10,WG.capsula.z)];
}
function manguitoDe(pts,r,mat,conAbrazaderas){
  const g=new THREE.Group();
  const geo=tuboGeo(pts,r,{tseg:Math.max(24,pts.length*14),rseg:22});
  g.add(malla(geo,mat,mat!==MAT.vidrio));
  if(conAbrazaderas){
    const cu=geo.userData.curva;
    for(const t of [0.0,1.0]){
      const p=cu.getPointAt(t), d=cu.getTangentAt(t);
      const sil=new THREE.Mesh(new THREE.CylinderGeometry(r+0.016,r+0.016,0.10,24),MAT.silicona);
      sil.position.copy(p).addScaledVector(d,t?-0.045:0.045); sil.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);
      sil.castShadow=true; g.add(sil);
      for(const k of [-0.025,0.025]){ const ab=new THREE.Mesh(new THREE.TorusGeometry(r+0.018,0.0045,8,32),MAT.abraz);
        ab.position.copy(sil.position).addScaledVector(d,k); ab.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),d); g.add(ab); }
    }
  }
  compacta(g);
  return g;
}
function tramo(a,b,clave,r,mat,abraz){
  if(!ASM.done.has(a)||!ASM.done.has(b)) return;
  const t=manguitoDe(CAMINOS[clave],r,mat,abraz); t.userData.kind='fija';
  t.userData.nombre={conducto:'Manguito de admisión (vidrio)',caliente:'Manguito caliente: compresor → intercooler (vidrio)',
    fria:'Manguito frío: intercooler → mariposa (vidrio)',manguera:'Manguera de la cápsula de descarga'}[clave];
  scene.add(t); conductos.push(t);
}
function armaCamino(){
  limpiaConductos(); trazaRutas();
  // el de admisión entra en la boca CORTADA del compresor: sin manguito ni
  // abrazaderas, que taparían el corte
  tramo('filtro','compresor','conducto',0.085*Math.min(1.1,LAY.s),MAT.vidrio,false);
  tramo('compresor','intercooler','caliente',0.074,MAT.vidrio,true);
  tramo('intercooler','mariposa','fria',0.074,MAT.vidrio,true);
  tramo('compresor','wastegate','manguera',0.012,MAT.goma,false);
  if(RIG.cuna) RIG.cuna.visible=!(ASM.done.has('compresor')&&ASM.done.has('turbina'));
  CAL_EXTRA=materialesCalientes();
}

// ================================================================ ENSAMBLE
/* Dónde va cada pieza montada y desde dónde entra. Las del turbo comparten el
   marco del turbo y entran deslizando por su eje, como se monta de verdad: el
   compresor por la izquierda, la turbina por la derecha. */
function poseMontada(k){
  const L=LAY;
  switch(k){
    case 'compresor': case 'turbina': case 'wastegate':
      return {p:L.T0.clone(), s:L.s, entra:new THREE.Vector3(k==='compresor'?-0.55:(k==='turbina'?0.60:0.0),k==='wastegate'?0.45:0,0)};
    case 'filtro': return {p:L.filtro.clone(), s:1, entra:new THREE.Vector3(-0.45,0,0)};
    case 'intercooler': return {p:L.ic.clone(), s:1, entra:new THREE.Vector3(0,0.10,0.55)};
    case 'mariposa': return {p:L.mariposa.clone(), s:1, entra:new THREE.Vector3(0.40,0,0)};
    case 'tmap': return {p:L.tmap.clone(), s:1, entra:new THREE.Vector3(0,0.30,0)};
  }
}
const REPOSO={filtro:[-1.42,1.30], intercooler:[0.02,1.30], mariposa:[1.42,1.30],
  compresor:[-1.22,1.84], turbina:[-0.30,1.84], wastegate:[0.55,1.84], tmap:[1.36,1.84]};
const BUILD={compresor:construyeCompresor, turbina:construyeTurbina, wastegate:construyeDescarga,
  filtro:construyeFiltro, intercooler:construyeIntercooler, mariposa:construyeMariposa, tmap:construyeTmap};
let piezas={}, fantasmas={}, tweens=[];
let TH=0, animT=0;
const ease=x=>x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
const easeOut=x=>1-Math.pow(1-x,3);
let toastT=null;
function showToast(html,ms){
  const t=el('toast'); t.innerHTML=html; t.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms||3800);
}
function cajaLocal(o){ const b=new THREE.Box3(); o.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(o.matrixWorld).invert();
  o.traverse(n=>{ if(n.isMesh){ n.geometry.computeBoundingBox(); const bb=n.geometry.boundingBox.clone();
    bb.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,n.matrixWorld)); b.union(bb); } });
  return b; }
function poseReposo(k,o){
  const s=poseMontada(k).s, bb=o.userData.caja, [x,z]=REPOSO[k];
  const c=new THREE.Vector3(); bb.getCenter(c);
  return new THREE.Vector3(x-c.x*s, Y_DECK+0.010-bb.min.y*s, z-c.z*s);
}
function registra(o){
  const k=o.userData.id, u=o.userData;
  if(k==='compresor') RIG.ruedaC=u.rueda;
  if(k==='turbina') RIG.ruedaT=u.rueda;
  if(k==='wastegate') RIG.wg=o;
  if(k==='mariposa') RIG.plato=u.plato;
  if(k==='tmap') RIG.testigo=u.testigo;
}
function hazPieza(k){
  const o=BUILD[k](); o.userData.id=k; o.userData.caja=cajaLocal(o);
  o.traverse(n=>{ if(n.isMesh){ n.castShadow=n.castShadow!==false; } });
  return o;
}
function limpiaKit(){
  for(const k in piezas) borra(piezas[k]);
  for(const k in fantasmas) borra(fantasmas[k]);
  piezas={}; fantasmas={}; tweens=[]; ASM.sel=null;
  RIG.ruedaC=null; RIG.ruedaT=null; RIG.wg=null; RIG.plato=null; RIG.testigo=null;
  limpiaConductos();
}
function fantasmaDe(k){
  const f=BUILD[k](), gm=nuevaFantasma();
  f.traverse(o=>{ if(o.isMesh){ o.material=gm; o.castShadow=false; o.receiveShadow=false; } });
  const P=poseMontada(k); f.position.copy(P.p); f.scale.setScalar(P.s);
  Object.assign(f.userData,{kind:'slot', id:k, gm, home:P.p.clone(), shake:0, fading:false});
  if(k==='wastegate') poseDescarga(f,0);
  f.visible=false; scene.add(f); return f;
}
function initAssembly(){
  limpiaKit(); ASM.done.clear();
  calculaLayout();
  for(const k of ORDEN){
    const o=hazPieza(k), P=poseMontada(k);
    o.scale.setScalar(P.s); o.position.copy(poseReposo(k,o));
    Object.assign(o.userData,{kind:'part', baseY:o.position.y, lift:0, hover:0, nombre:PART[k].rot});
    scene.add(o); piezas[k]=o;
    fantasmas[k]=fantasmaDe(k);
  }
  G.simUnlocked=false; G.resuelto=false;
  if(RIG.cuna) RIG.cuna.visible=true;
  armaCamino();
}
function montaKit(){
  limpiaKit(); calculaLayout();
  for(const k of ORDEN){
    const o=hazPieza(k), P=poseMontada(k);
    o.position.copy(P.p); o.scale.setScalar(P.s);
    Object.assign(o.userData,{kind:'placed', lift:0, hover:0, nombre:PART[k].rot});
    scene.add(o); piezas[k]=o; ASM.done.add(k); registra(o);
    fantasmas[k]=fantasmaDe(k);
  }
  armaCamino();
}
function falta(k){ return (REQ[k]||[]).filter(r=>!ASM.done.has(r)); }
function selPieza(k){
  if(ASM.done.has(k)) return;
  const f=falta(k);
  if(f.length){ showToast('Antes va <b>'+f.map(r=>PART[r].rot.toLowerCase()).join('</b> y <b>')+
    '</b>: la cápsula se atornilla al canal de la turbina y su manguera sale del compresor.',3200);
    synth.beep(300,0.08,0.05); return; }
  if(ASM.sel===k){ deselec(); return; }
  deselec(); ASM.sel=k; muestraHueco(k); synth.beep(660,0.06,0.04);
  pintaEstadoEnsamble();
}
function deselec(){ ASM.sel=null; muestraHueco(null); pintaEstadoEnsamble(); }
function muestraHueco(k){
  for(const id in fantasmas){ const f=fantasmas[id]; f.visible=!!k&&id===k&&!ASM.done.has(id);
    if(f.visible){ f.userData.fading=false; f.userData.gm.opacity=0.22; } }
}
/* LA TRAYECTORIA DE MONTAJE: la pieza sube del tapete, llega a la boca de
   entrada —delante de su hueco, en su eje— y entra deslizando, frenando al
   asentar. */
function trayecto(obj,dest,ent,dur,alAsentar){
  const p0=obj.position.clone();
  const alto=Math.max(p0.y,ent.y)+0.45;
  const curva=new THREE.CatmullRomCurve3([p0,new THREE.Vector3(p0.x,alto,p0.z),
    new THREE.Vector3((p0.x+ent.x)/2,alto+0.05,(p0.z+ent.z)/2),new THREE.Vector3(ent.x,ent.y+0.20,ent.z),ent],false,'centripetal');
  return {obj,t:0,dur,upd:u=>{
    if(u<0.68){ obj.position.copy(curva.getPoint(ease(u/0.68))); }
    else obj.position.lerpVectors(ent,dest,easeOut((u-0.68)/0.32));
  },onDone:()=>{ obj.position.copy(dest); if(alAsentar) alAsentar(); }};
}
function colocaPieza(k){
  const o=piezas[k], p=PART[k], P=poseMontada(k);
  if(!o||ASM.done.has(k)) return;
  const dest=P.p.clone(), ent=P.p.clone().add(P.entra);
  tweens.push(trayecto(o,dest,ent,REDUCIDO?0.5:1.45,()=>{
    o.userData.kind='placed'; registra(o); armaCamino();
    synth.beep(196,0.07,0.06); setTimeout(()=>synth.beep(392,0.05,0.04),60); }));
  const f=fantasmas[k]; if(f) f.userData.fading=true;
  o.userData.kind='moving'; o.userData.lift=0;
  ASM.done.add(k); ASM.sel=null;
  synth.beep(880,0.07,0.05); setTimeout(()=>synth.beep(1174,0.09,0.05),90);
  showToast('✔ <b>'+p.rot+'</b> montado. '+p.nota,3600);
  pintaEstadoEnsamble(); pinta();
  if(ASM.done.size===PARTS.length) finEnsamble();
}
function huecoMal(k){
  const f=fantasmas[k]; if(f) f.userData.shake=0.5; synth.beep(200,0.12,0.05);
  showToast('<span class="bad">✗ Esa pieza no va en ese hueco.</span>',2000);
}
let tFinal=null;
function finEnsamble(){
  G.simUnlocked=true; syncCtrl();
  synth.beep(523,0.10,0.05); setTimeout(()=>synth.beep(784,0.14,0.05),130);
  showToast('<b>Camino del aire completo.</b> Arranca el motor a plena carga: mira el aire calentarse en el compresor y enfriarse en el intercooler.',4800);
  clearTimeout(tFinal);
  // la última pieza tarda ~1,5 s en asentar; después la cámara se acerca
  tFinal=setTimeout(()=>{ if(G.simUnlocked&&G.modo==='ensamble') ponVista('conjunto'); },REDUCIDO?400:1700);
  afterEdit();
}
function autoAssemble(){
  const pend=ORDEN.filter(k=>!ASM.done.has(k));
  pend.forEach((k,n)=>setTimeout(()=>{ if(!ASM.done.has(k)&&!falta(k).length) colocaPieza(k); },320+n*640));
  return 320+pend.length*640+900;
}

/* ---------- tocar pieza → tocar hueco ---------- */
function conEtiqueta(o){ let n=o; while(n){ if(n.userData&&n.userData.kind) return n; n=n.parent; } return null; }
function golpes(ray){ return ray.intersectObjects(scene.children,true).filter(h=>h.object.visible!==false&&!h.object.userData.noToca); }
(function(){
  const ray=new THREE.Raycaster(), m=new THREE.Vector2(); let down=null;
  mount.addEventListener('pointerdown',e=>{ down=[e.clientX,e.clientY]; });
  mount.addEventListener('pointerup',e=>{
    if(!down) return; const mov=Math.abs(e.clientX-down[0])+Math.abs(e.clientY-down[1])>6; down=null; if(mov) return;
    const r=mount.getBoundingClientRect(); m.x=((e.clientX-r.left)/r.width)*2-1; m.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(m,S.camera);
    const hits=golpes(ray);
    if(ASM.sel&&hits.some(h=>{ const t=conEtiqueta(h.object); return t&&t.userData.kind==='slot'&&t.userData.id===ASM.sel; })){ colocaPieza(ASM.sel); return; }
    const t=hits.length?conEtiqueta(hits[0].object):null;
    if(!t){ if(ASM.sel) deselec(); return; }
    const k=t.userData.kind;
    if(k==='part') selPieza(t.userData.id);
    else if(k==='slot'){
      if(!ASM.sel){ showToast('Primero toca una <b>pieza</b> del tapete.',2200); return; }
      if(t.userData.id===ASM.sel) colocaPieza(ASM.sel); else huecoMal(t.userData.id);
    }else if(k==='placed'){
      const p=PART[t.userData.id]; showToast('<b>'+p.rot+'</b> — '+p.para,5200);
    }
  });
})();

// ============================================================ T5 · EL GAS QUE SE VE
/* Cada partícula es una porción de gas de MASA FIJA. Recorre su camino tramo a
   tramo y en cada tramo tarda lo que tarda el gas de verdad (`tiemposAire`,
   `tiemposEscape`: τ = ρ·A·L/ṁ), multiplicado por la cámara lenta del gas. Por
   eso se juntan donde el gas va despacio y hay más cuantas más masa cabe en los
   tubos. Su color es la temperatura que el modelo da en ese punto.
   El número de partículas encendidas es la masa de gas que hay dentro del
   camino entre la masa de una partícula. Una partícula de escape lleva la
   sexta parte de masa (0,15) que una de aire (declarado): el escape es tan poco
   denso y va tan deprisa que, con la misma masa, por la turbina pasarían unas
   pocas decenas y no se vería el gas que la mueve. */
const SEG_A=['filtro','conducto','rodete','voluta','salidaC','caliente','tanqueE','ic','tanqueS','fria','mariposa'];
const SEG_E=['entradaT','volutaT','rodeteT','salidaT','puerto','bajante'];
const MASA_ESC=0.15;
/* LA LUPA DEL COMPRESOR. El aire cruza la rueda, el difusor y la caracola en
   unas milésimas de segundo: con la masa de partícula del resto del camino, en
   la rueda habría una docena. Dentro del compresor —de la boca a lo alto del
   cuello— cada partícula lleva 1/8 de esa masa (declarado), así que allí hay
   ocho veces más; el recuento sigue siendo masa entre masa de partícula. */
const LUPA=8;
const ANCHO_PART=0.0042;          // media anchura del trazo, en metros de la escena
const ESTELA=0.07;                // la estela es el camino de los últimos 0,10 s de animación
const ESTELA_MAX=0.045;
const SIN_CORTE=50;
const TAN_DIF=Math.tan(63*DEG), TAN_TOB=Math.tan(75*DEG);

/* Las tablas de color: el lineal que, tras la curva del render, se ve con el
   color de la escala. Una por fluido, de kelvin en kelvin. */
const LUT={aire:{T0:250,T1:900,c:null}, esc:{T0:580,T1:1340,c:null}};
for(const [k,fn] of [['aire',colorAire],['esc',colorEsc]]){
  const L=LUT[k], n=L.T1-L.T0+1; L.c=new Float32Array(n*3);
  for(let i=0;i<n;i++){ const c=linealPara(fn(L.T0+i),EXPO); L.c[i*3]=c[0]; L.c[i*3+1]=c[1]; L.c[i*3+2]=c[2]; }
}
function lutEn(L,T,out,o){ const i=Math.round(clamp(T,L.T0,L.T1)-L.T0)*3; out[o]=L.c[i]; out[o+1]=L.c[i+1]; out[o+2]=L.c[i+2]; }

/* La masa de referencia de una partícula: la del 1.4 T sano a plena carga y en
   el par máximo, a nivel del mar y a 25 °C, repartida en 1 700 partículas. En
   los otros motores escala con el gasto de bloqueo (los tubos son más grandes
   en la misma proporción), así que un motor dibujado lleva más o menos las
   mismas partículas que otro en el mismo punto relativo. */
function masaEnCamino(tA){ let s=0; for(const k of SEG_A) s+=(k==='voluta'?tA[k]/2:tA[k]); return s; }
const M_P0=(function(){
  const e=ARQ.gas14t, V=evalua(e,{falla:'sano',rpm:e.rpmPar,carga:1,alt:0,Tamb:25,vAire:60,octanaje:91});
  return masaEnCamino(tiemposAire(e,V))*V.m/1700;
})();
function cuentas(e,V){
  const mp=M_P0*escalaGasto(e)*(calAlta()?1:2);
  const tA=tiemposAire(e,V), tE=tiemposEscape(e,V), fW=fraccionDescarga(V);
  const mA=masaEnCamino(tA)*V.m;
  const mE=V.mEsc*(tE.entradaT+tE.bajante)+Math.max(0,V.mT)*(tE.volutaT/2+tE.rodeteT+tE.salidaT)+gastoDescarga(V)*tE.puerto;
  const mL=(tA.rodete+tA.voluta/2+tA.salidaC)*V.m;
  return {mp, tA, tE, fW, nA:Math.round(mA/mp), nE:Math.round(mE/(mp*MASA_ESC)), nL:Math.round(mL*LUPA/mp), mA, mE, mL};
}

/* ---------- los caminos, en coordenadas del mundo ---------- */
// Un marco que viaja con el tubo (transporte paralelo): así la porción que va
// pegada a una pared sigue pegada a la misma pared en las curvas, y el marco
// del principio se elige para empalmar con la pieza de antes.
function marco(pts,N,n0){
  const c=new THREE.CatmullRomCurve3(pts,false,'centripetal');
  const P=new Float32Array((N+1)*3), A=new Float32Array((N+1)*3), B=new Float32Array((N+1)*3);
  const n=n0.clone(), t=new THREE.Vector3(), b=new THREE.Vector3(), p=new THREE.Vector3();
  for(let i=0;i<=N;i++){
    c.getPointAt(i/N,p); c.getTangentAt(i/N,t);
    n.addScaledVector(t,-n.dot(t)).normalize(); b.crossVectors(t,n);
    P.set([p.x,p.y,p.z],i*3); A.set([n.x,n.y,n.z],i*3); B.set([b.x,b.y,b.z],i*3);
  }
  return {N,P,A,B};
}
function enMarco(M,f,o1,o2,out){
  const x=clamp(f,0,1)*M.N, i=Math.min(M.N-1,Math.floor(x)), u=x-i, j=i*3, k=j+3, w=1-u;
  out.x=(M.P[j]*w+M.P[k]*u)+(M.A[j]*w+M.A[k]*u)*o1+(M.B[j]*w+M.B[k]*u)*o2;
  out.y=(M.P[j+1]*w+M.P[k+1]*u)+(M.A[j+1]*w+M.A[k+1]*u)*o1+(M.B[j+1]*w+M.B[k+1]*u)*o2;
  out.z=(M.P[j+2]*w+M.P[k+2]*u)+(M.A[j+2]*w+M.A[k+2]*u)*o1+(M.B[j+2]*w+M.B[k+2]*u)*o2;
  return out;
}
const RUTA={};
function trazaRutas(){
  defineCaminos();
  const X=new THREE.Vector3(1,0,0), Y=new THREE.Vector3(0,1,0);
  RUTA.caliente=marco(CAMINOS.caliente,90,X);
  RUTA.fria=marco(CAMINOS.fria,90,Y);
  // el bajante: su línea media está en el plano z = 0; el marco es la normal
  // en el plano y el eje z
  if(RIG.bajante){
    const L=RIG.bajante.linea, n=L.length, P=new Float32Array(n*3), A=new Float32Array(n*3), B=new Float32Array(n*3), R=new Float32Array(n);
    for(let i=0;i<n;i++){
      const a=L[Math.max(0,i-1)], b=L[Math.min(n-1,i+1)]; let tx=b.x-a.x, ty=b.y-a.y; const l=Math.hypot(tx,ty)||1; tx/=l; ty/=l;
      P.set([L[i].x,L[i].y,0],i*3); A.set([-ty,tx,0],i*3); B.set([0,0,1],i*3); R[i]=RIG.bajante.rIn(i/(n-1));
    }
    RUTA.bajante={N:n-1,P,A,B,R};
  }
  // el paso de la descarga, en el marco del turbo
  const D=DUCTO_T;
  RUTA.puerto=polilinea([[D.x+0.05,D.y-0.02,-0.06],[0.40,0.27,-0.050],[CT.x0+CT.xiLip-0.004,0.205,-0.046],
    [CT.x0+CT.xiLip+0.035,0.200,-0.046]]);
}

/* ---------- el enjambre ---------- */
function enjambre(cap){
  const F=()=>new Float32Array(cap);
  return {cap, n:0, seg:new Int8Array(cap), f:F(), k:new Int32Array(cap), r1:F(), r2:F(), r3:F(), r4:F(),
    a:F(), b:F(), psiE:F(), q:F(), al:F(), vivo:new Uint8Array(cap), rama:new Uint8Array(cap), tubo:new Int8Array(cap)};
}
const PART_CAP={aire:calAlta()?3400:1800, esc:calAlta()?1800:950, lupa:calAlta()?900:480};
const ENJ={aire:enjambre(PART_CAP.aire), esc:enjambre(PART_CAP.esc), lupa:enjambre(PART_CAP.lupa)};
// Las semillas: secuencias de baja discrepancia, deterministas (la misma
// captura sale igual dos veces).
for(const E of [ENJ.aire,ENJ.esc,ENJ.lupa]) for(let i=0;i<E.cap;i++){
  E.r1[i]=(i*0.7548776662466927+0.13)%1; E.r2[i]=(i*0.5698402909980532+0.71)%1;
  E.r3[i]=(i*AUREA+0.37)%1; E.r4[i]=(i*0.4142135623730951+0.53)%1;
}
const fr=x=>x-Math.floor(x);
const suave=u=>{ u=clamp(u,0,1); return u*u*(3-2*u); };
// el desplazamiento de una porción dentro de su tubo, en el disco unidad
const offX=(E,i)=>0.82*Math.sqrt(E.r3[i])*Math.cos(DOSPI*E.r1[i]);
const offY=(E,i)=>0.82*Math.sqrt(E.r3[i])*Math.sin(DOSPI*E.r1[i]);

const PZ={V:null, e:null, c:null, psi:0, w:0};   // el estado que se está pintando
const _p=new THREE.Vector3(), _q=new THREE.Vector3(), _r=new THREE.Vector3();
function aMundo(x,y,z,out){ const s=LAY.s; return out.set(LAY.T0.x+s*x,LAY.T0.y+s*y,LAY.T0.z+s*z); }

/* La duración de cada tramo, en segundos de la animación. */
function durA(E,i,s){
  const t=PZ.c.tA[SEG_A[s]]*(s===3?Math.max(0.01,E.q[i]):1);
  return Math.max(0.04,t*LENTO_GAS);
}
function durE(E,i,s){
  const t=PZ.c.tE[SEG_E[s]]*(s===1?Math.max(0.02,E.q[i]):1);
  return Math.max(0.04,t*LENTO_GAS);
}

/* ---------- dónde está una porción de AIRE ---------- */
const WR0=thetaC(0), WR1=thetaC(1);
function posAire(E,i,s,f,psi,out){
  const ox=offX(E,i), oy=offY(E,i), a=E.a[i];
  switch(s){
  case 0:{ // el filtro: entra por la trompa, rodea el elemento, lo cruza hacia dentro y sale por el centro
    const F=LAY.filtro, xc=-0.13+0.26*E.r4[i], ra=0.183+0.009*E.r2[i], rc=0.028+0.066*E.r3[i];
    let x,r;
    if(f<0.18){ const u=f/0.18; x=-0.32+0.15*u; r=0.07*Math.sqrt(E.r3[i])+(ra-0.07*Math.sqrt(E.r3[i]))*suave(u); }
    else if(f<0.55){ const u=(f-0.18)/0.37; x=-0.17+(xc+0.17)*u; r=ra; }
    else if(f<0.72){ const u=(f-0.55)/0.17; x=xc; r=ra+(rc-ra)*suave(u); }
    else { const u=(f-0.72)/0.28; x=xc+(0.29-xc)*u; r=rc*(1-0.32*suave((x-0.15)/0.12)); }
    return out.set(F.x+x,F.y+r*Math.cos(a),F.z+r*Math.sin(a)); }
  case 1:{ // el conducto de vidrio, recto, hasta la boca del compresor
    const C=CAMINOS.conducto, x0=C[0].x, x1=LAY.lipC.x, rc=0.028+0.066*E.r3[i];
    const r0=rc*0.68, v=0.1+0.8*E.r3[i], r1=LAY.s*(0.038+(0.112-0.038)*v), r=r0+(r1-r0)*suave(f);
    return out.set(x0+(x1-x0)*f,LAY.T0.y+r*Math.cos(a),r*Math.sin(a)); }
  case 2:{ // la boca, la rueda (gira con ella) y el difusor
    const v=0.1+0.8*E.r3[i];
    if(f<0.2){ const u=f/0.2, x=(CC.x0-CC.xiLip)+(-0.47-(CC.x0-CC.xiLip))*u, r=0.038+0.074*v;
      return aMundo(x,r*Math.cos(a),r*Math.sin(a),out); }
    if(f<0.7){ const m=(f-0.2)/0.5, h=hubC(m), sh=shrC(m), x=h[0]+(sh[0]-h[0])*v, r=h[1]+(sh[1]-h[1])*v;
      const th=a+thetaC(m)-WR0+(psi-E.psiE[i]);
      return aMundo(x,r*Math.cos(th),r*Math.sin(th),out); }
    const u=(f-0.7)/0.3, h=hubC(1), sh=shrC(1), x0=h[0]+(sh[0]-h[0])*v, xs=CC.x0-xiS(CC);
    const r=Math.sqrt(0.165*0.165+(CC.R3*CC.R3-0.165*0.165)*u), x=x0+(xs-x0)*u, th=E.b[i]+TAN_DIF*Math.log(r/0.165);
    return aMundo(x,r*Math.cos(th),r*Math.sin(th),out); }
  case 3:{ // la caracola: de donde la deja el difusor hasta la lengüeta
    const q=E.q[i], phi=a+DOSPI*q*f, rho=rhoDeF(CC,fComp(phi)), Rs=RsDe(CC,rho), xs=CC.x0-xiS(CC);
    const w=suave(DOSPI*q*f/0.7);
    const dx=(1-w)*0+w*rho*ox, dr=(1-w)*(CC.R3-Rs)+w*rho*oy, r=Rs+dr;
    return aMundo(xs+dx,r*Math.cos(phi),r*Math.sin(phi),out); }
  case 4:{ // el cuello: sube por detrás
    const xs=CC.x0-xiS(CC), rho=CC.rhoMax, Rs=RsDe(CC,rho);
    return aMundo(xs+rho*ox,0.5*f,-(Rs+rho*oy),out); }
  case 5:{ // el manguito caliente (vidrio)
    const R=0.074*0.85; return enMarco(RUTA.caliente,f,R*ox,R*oy,out); }
  case 6:{ // el depósito de entrada: de la boca al tubo que le toca
    const R=0.074*0.85, ic=LAY.ic, k=E.tubo[i], d=0.046*(2*E.r4[i]-1);
    enMarco(RUTA.caliente,1,R*ox,R*oy,_r);
    const xA=LAY.icIn.x, xT=ic.x-ICG.L/2;
    const P0x=xA+0.04, P0y=LAY.icIn.y+R*ox*0.6, P0z=ic.z+R*oy*0.6;
    const P1x=ic.x-(ICG.L/2+ICG.tanque*0.45), P1y=ic.y+ICG.yBoca, P1z=ic.z+d;
    const P2x=xT, P2y=ic.y+tuboY(k)+0.006*(2*E.r2[i]-1), P2z=ic.z+d;
    const u=f, w0=(1-u)*(1-u), w1=2*u*(1-u), w2=u*u;
    out.set(P0x*w0+P1x*w1+P2x*w2, P0y*w0+P1y*w1+P2y*w2, P0z*w0+P1z*w1+P2z*w2);
    const bl=suave(f/0.22); return out.lerpVectors(_r,out,bl); }
  case 7:{ // los tubos del intercooler
    const ic=LAY.ic, k=E.tubo[i], d=0.046*(2*E.r4[i]-1);
    return out.set(ic.x-ICG.L/2+ICG.L*f, ic.y+tuboY(k)+0.006*(2*E.r2[i]-1), ic.z+d); }
  case 8:{ // el depósito de salida, hasta la boca derecha
    const R=0.074*0.85, ic=LAY.ic, k=E.tubo[i], d=0.046*(2*E.r4[i]-1);
    const P0x=ic.x+ICG.L/2, P0y=ic.y+tuboY(k)+0.006*(2*E.r2[i]-1), P0z=ic.z+d;
    const P1x=ic.x+(ICG.L/2+ICG.tanque*0.45), P1y=ic.y+ICG.yBoca, P1z=ic.z+d*0.6;
    const P2x=LAY.icOut.x, P2y=LAY.icOut.y+R*ox, P2z=LAY.icOut.z+R*oy;
    const u=f, w0=(1-u)*(1-u), w1=2*u*(1-u), w2=u*u;
    return out.set(P0x*w0+P1x*w1+P2x*w2, P0y*w0+P1y*w1+P2y*w2, P0z*w0+P1z*w1+P2z*w2); }
  case 9:{ const R=0.074*0.85; return enMarco(RUTA.fria,f,R*ox,R*oy,out); }
  case 10:{ // la mariposa y la entrada a la cámara
    const R=0.074*0.85, m=LAY.mariposa;
    enMarco(RUTA.fria,1,R*ox,R*oy,_r);
    const x=m.x+0.16-(0.16+0.40)*f;
    out.set(x,m.y+0.06*ox,m.z+0.06*oy);
    return out.lerpVectors(_r,out,suave(f/0.18)); }
  }
  return out;
}
/* ---------- dónde está una porción de ESCAPE ---------- */
function posEsc(E,i,s,f,psi,out){
  const ox=offX(E,i), oy=offY(E,i), D=DUCTO_T, v=0.12+0.76*E.r3[i];
  switch(s){
  case 0:{ // el conducto de entrada, del colector al plano del corte (o a la toma de la descarga)
    const z1=E.rama[i]?-0.06:0;
    return aMundo(D.x+0.8*D.r*ox,D.y+0.8*D.r*oy,D.z0+(z1-D.z0)*f,out); }
  case 1:{ // la caracola de la turbina: la porción la abandona en φx = 2π·q
    const phi=DOSPI*E.q[i]*f, rho=rhoDeF(CT,fTurb(phi)), Rs=RsDe(CT,rho), xs=CT.x0+xiS(CT);
    const x=xs+rho*ox, r=Rs+rho*oy;
    aMundo(x,r*Math.cos(phi),r*Math.sin(phi),out);
    const w=suave(phi/0.9);
    if(w<1){ aMundo(D.x+0.8*D.r*ox,D.y+0.8*D.r*oy,0.06*phi,_r); out.lerpVectors(_r,out,w); }
    return out; }
  case 2:{ // la tobera sin álabes y la rueda
    const phx=DOSPI*E.q[i], rho=rhoDeF(CT,fTurb(phx)), Rs=RsDe(CT,rho), xs=CT.x0+xiS(CT);
    const rE=Rs+rho*oy, xE=xs+rho*ox, xW=0.205+0.040*v;
    if(f<0.35){ const u=suave(f/0.35), r=rE+(0.150-rE)*u, x=xE+(xW-xE)*u, th=phx+TAN_TOB*Math.log(rE/r);
      return aMundo(x,r*Math.cos(th),r*Math.sin(th),out); }
    const m=(f-0.35)/0.65, h=hubT(m), sh=shrT(m), x=h[0]+(sh[0]-h[0])*v, r=h[1]+(sh[1]-h[1])*v;
    const th=E.b[i]+gT(x)-gT(xW)+(psi-E.psiE[i]);
    return aMundo(x,r*Math.cos(th),r*Math.sin(th),out); }
  case 3:{ const r=0.042+(0.115-0.042)*v, x=0.40+0.07*f, th=E.a[i];
    return aMundo(x,r*Math.cos(th),r*Math.sin(th),out); }
  case 4:{ // por la tobera de la descarga, más allá de la trampilla
    RUTA.puerto.en(f,_q);
    const o=0.028*Math.min(1,0.4+f);
    aMundo(_q.x,_q.y+o*oy,_q.z+o*ox,out);
    const w=suave(f/0.25);
    if(w<1){ aMundo(D.x+0.8*D.r*ox,D.y+0.8*D.r*oy,-0.06,_r); out.lerpVectors(_r,out,w); }
    return out; }
  case 5:{ // el bajante, cortado: del final de la turbina o de la trampilla a la cola
    const B=RUTA.bajante, x=clamp(f,0,1)*B.N, j0=Math.min(B.N-1,Math.floor(x)), u=x-j0, j=j0*3, k=j+3, w=1-u;
    const R=(B.R[j0]*w+B.R[j0+1]*u)*0.80;
    out.set(B.P[j]*w+B.P[k]*u+(B.A[j]*w+B.A[k]*u)*R*ox, B.P[j+1]*w+B.P[k+1]*u+(B.A[j+1]*w+B.A[k+1]*u)*R*ox, R*oy);
    const bl=suave(f/0.12);
    if(bl<1){
      if(E.rama[i]) aMundo(CT.x0+CT.xiLip+0.035,0.200+0.028*oy,-0.046+0.028*ox,_r);
      else{ const r=0.042+(0.115-0.042)*v, th=E.a[i]; aMundo(0.47,r*Math.cos(th),r*Math.sin(th),_r); }
      out.lerpVectors(_r,out,bl);
    }
    return out; }
  }
  return out;
}
/* Su temperatura, en kelvin, con las mismas fórmulas del modelo. */
function TAire(E,i,s,f){
  const V=PZ.V;
  switch(s){
    case 0: case 1: return V.Tamb;
    case 2: return f<0.2?V.Tamb:(f<0.7?V.Tamb+(V.T2-V.Tamb)*(f-0.2)/0.5:V.T2);
    case 3: case 4: case 5: case 6: return V.T2;
    case 7: return V.Tamb+(V.T2-V.Tamb)*Math.pow(1-clamp(V.eps,0,1),f);
    default: return V.TAdm;
  }
}
function TEsc(E,i,s,f){
  const V=PZ.V, T4=PZ.T4, Tm=PZ.Tm;
  switch(s){
    case 0: case 1: case 4: return V.T3;
    case 2: return f<0.35?V.T3:V.T3+(T4-V.T3)*(f-0.35)/0.65;
    case 3: return T4;
    default:{ const T0=E.rama[i]?V.T3:T4; return T0+(Tm-T0)*suave(f/0.30); }
  }
}
const corteA=s=>(s===0||s===2||s===3)?0:((s>=6&&s<=8)?LAY.ic.z:(s===10?LAY.mariposa.z:SIN_CORTE));
const corteE=()=>0;

/* Lo que una porción necesita saber al llegar a un tramo. */
function entraAire(E,i,s,psi,w){
  if(s===0){ E.a[i]=DOSPI*fr(E.r2[i]+E.k[i]*AUREA); }
  else if(s===6){ E.tubo[i]=Math.floor(fr(i*AUREA+E.k[i]*0.381966)*ICG.n); }
}
function entraEsc(E,i,s){
  if(s===0){ E.rama[i]=vaPorDescarga(i,E.k[i],PZ.c.fW)?1:0; E.q[i]=0.03+0.97*fr(E.r2[i]+E.k[i]*AUREA); }
}
/* Una porción recién encendida se coloca donde estaría si llevase un rato
   circulando: el tramo, con probabilidad proporcional a su duración.
   `tipo`: 0 aire de todo el camino, 1 escape, 2 aire de la LUPA del compresor. */
const SEG_LUPA=[2,3,4];
function siembra(E,i,tipo){
  const psi=PZ.psi, w=PZ.w, c=PZ.c;
  E.k[i]=Math.floor(E.r4[i]*97);
  const u=fr(E.r1[i]*3.17+E.r2[i]*1.31+E.k[i]*0.0731);
  if(tipo!==1){
    entraAire(E,i,0); entraAire(E,i,6);
    const segs=tipo===2?SEG_LUPA:SEG_A.map((_,k)=>k);
    const pesos=segs.map(k=>c.tA[SEG_A[k]]*(k===3?0.5:1));
    const tot=pesos.reduce((a,b)=>a+b,0); let acc=0, s=segs[segs.length-1];
    for(let j=0;j<segs.length;j++){ acc+=pesos[j]/tot; if(u<acc){ s=segs[j]; break; } }
    const f=fr(u*7.77+0.31);
    E.seg[i]=s; E.f[i]=f;
    if(s>=2) contextoRodete(E,i,s,f,psi,w);
  }else{
    entraEsc(E,i,0);
    const r=E.rama[i], T=c.tE;
    const segs=r?[0,4,5]:[0,1,2,3,5];
    const pesos=segs.map(s=>T[SEG_E[s]]*(s===1?E.q[i]:1));
    const tot=pesos.reduce((a,b)=>a+b,0); let acc=0, s=segs[segs.length-1];
    for(let j=0;j<segs.length;j++){ acc+=pesos[j]/tot; if(u<acc){ s=segs[j]; break; } }
    const f=fr(u*7.77+0.31);
    E.seg[i]=s; E.f[i]=f;
    if(s===2||s===3||s===5) contextoTurbina(E,i,s,f,psi,w);
  }
}
function contextoRodete(E,i,s,f,psi,w){
  const dR=durA(E,i,2);
  if(s===2&&f>=0.2&&f<0.7) E.psiE[i]=psi-w*(f-0.2)*dR;
  if((s===2&&f>=0.7)||s>2){
    E.b[i]=E.a[i]+WR1-WR0+w*0.5*dR;
    if(s>=3){ const phiE=E.b[i]+TAN_DIF*Math.log(CC.R3/0.165);
      E.q[i]=Math.max(0.01,fr((1.5*Math.PI-phiE)/DOSPI)); E.a[i]=phiE; }
  }
}
function contextoTurbina(E,i,s,f,psi,w){
  const phx=DOSPI*E.q[i], rho=rhoDeF(CT,fTurb(phx)), rE=RsDe(CT,rho)+rho*offY(E,i);
  E.b[i]=phx+TAN_TOB*Math.log(rE/0.150);
  const dR=durE(E,i,2);
  if(s===2&&f>=0.35) E.psiE[i]=psi-w*(f-0.35)*dR;
  if(s>2){ const v=0.12+0.76*E.r3[i], xW=0.205+0.040*v;
    E.a[i]=E.b[i]+gT(0.40)-gT(xW)+w*0.65*dR; }
}
/* Un paso de la animación de una porción. */
function avanza(E,i,tipo,dt){
  const psi=PZ.psi, w=PZ.w, aire=tipo!==1;
  let s=E.seg[i], f=E.f[i];
  const dur=aire?durA:durE;
  let resto=dt, guard=0;
  while(resto>0&&guard++<6){
    const d=dur(E,i,s), df=resto/d, f1=f+df;
    if(aire&&s===2){
      if(f<0.2&&f1>=0.2) E.psiE[i]=psi;
      if(f<0.7&&f1>=0.7){ E.b[i]=E.a[i]+WR1-WR0+(psi-E.psiE[i]); }
    }
    if(!aire&&s===2&&f<0.35&&f1>=0.35) E.psiE[i]=psi;
    if(f1<1){ f=f1; resto=0; break; }
    resto=(f1-1)*d; f=0;
    if(aire){
      if(s===2){ const phiE=E.b[i]+TAN_DIF*Math.log(CC.R3/0.165);
        E.a[i]=phiE; E.q[i]=Math.max(0.01,fr((1.5*Math.PI-phiE)/DOSPI)); }
      s++;
      if(tipo===2&&s>4){ s=2; E.k[i]++; E.a[i]=DOSPI*fr(E.r2[i]+E.k[i]*AUREA); }
      else if(s>=SEG_A.length){ s=0; E.k[i]++; }
      entraAire(E,i,s);
    }else{
      if(s===2){ const v=0.12+0.76*E.r3[i], xW=0.205+0.040*v; E.a[i]=E.b[i]+gT(0.40)-gT(xW)+(psi-E.psiE[i]); }
      if(s===1){ const phx=DOSPI*E.q[i], rho=rhoDeF(CT,fTurb(phx)), rE=RsDe(CT,rho)+rho*offY(E,i);
        E.b[i]=phx+TAN_TOB*Math.log(rE/0.150); }
      if(s===0) s=E.rama[i]?4:1;
      else if(s===3||s===4) s=5;
      else if(s===5){ s=0; E.k[i]++; entraEsc(E,i,0); }
      else s++;
    }
  }
  E.seg[i]=s; E.f[i]=f;
}

/* ---------- el dibujo: un trazo por porción, en UNA llamada de dibujo ---------- */
const PART_MAX=PART_CAP.aire+PART_CAP.esc+PART_CAP.lupa;
const gPart=new THREE.InstancedBufferGeometry();
gPart.setAttribute('position',new THREE.Float32BufferAttribute([0,-1,0, 1,-1,0, 1,1,0, 0,1,0],3));
gPart.setIndex([0,1,2, 0,2,3]);
const bA=new Float32Array(PART_MAX*3), bB=new Float32Array(PART_MAX*3), bC=new Float32Array(PART_MAX*4), bZ=new Float32Array(PART_MAX);
const iaA=new THREE.InstancedBufferAttribute(bA,3), iaB=new THREE.InstancedBufferAttribute(bB,3),
  iaC=new THREE.InstancedBufferAttribute(bC,4), iaZ=new THREE.InstancedBufferAttribute(bZ,1);
for(const a of [iaA,iaB,iaC,iaZ]) a.setUsage(THREE.DynamicDrawUsage);
gPart.setAttribute('aA',iaA); gPart.setAttribute('aB',iaB); gPart.setAttribute('aC',iaC); gPart.setAttribute('aZc',iaZ);
gPart.instanceCount=0;
const matPart=new THREE.ShaderMaterial({
  uniforms:{uW:{value:ANCHO_PART}},
  vertexShader:`
    attribute vec3 aA; attribute vec3 aB; attribute vec4 aC; attribute float aZc;
    uniform float uW; varying vec4 vC; varying float vZ; varying float vZc; varying vec2 vQ;
    void main(){
      vec4 A=modelViewMatrix*vec4(aA,1.0), B=modelViewMatrix*vec4(aB,1.0);
      vec2 d=A.xy-B.xy; float l=length(d); vec2 dir=l>1e-6?d/l:vec2(1.0,0.0); vec2 pp=vec2(-dir.y,dir.x);
      vec4 P=mix(B,A,position.x);
      P.xy+=dir*uW*(position.x*2.0-1.0)+pp*uW*position.y;
      gl_Position=projectionMatrix*P;
      vC=aC; vZ=mix(aB.z,aA.z,position.x); vZc=aZc; vQ=position.xy;
    }`,
  fragmentShader:`
    varying vec4 vC; varying float vZ; varying float vZc; varying vec2 vQ;
    void main(){
      if(vZ>vZc) discard;
      float e=1.0-smoothstep(0.45,1.0,abs(vQ.y));
      float t=mix(0.30,1.0,vQ.x);
      gl_FragColor=vec4(vC.rgb,vC.a*e*t);
    }`,
  transparent:true, depthWrite:false, depthTest:true,
});
const mPart=new THREE.Mesh(gPart,matPart);
mPart.frustumCulled=false; mPart.renderOrder=10; mPart.userData.noToca=true; mPart.visible=false;
scene.add(mPart);

const _col=[0,0,0];
/* Pinta las tres poblaciones. `dt` en segundos de animación (0 si está en pausa). */
function pintaParticulas(dt){
  if(!PZ.V||!G.simUnlocked||!RUTA.bajante){ mPart.visible=false; gPart.instanceCount=0; return; }
  mPart.visible=true;
  const c=PZ.c; let w=0;
  const fade=dt>0?Math.min(1,dt*2.2):1;
  for(const tipo of [0,2,1]){
    const aire=tipo!==1, E=tipo===0?ENJ.aire:(tipo===2?ENJ.lupa:ENJ.esc);
    const n=Math.min(E.cap,tipo===0?c.nA:(tipo===2?c.nL:c.nE));
    E.n=n;
    const pos=aire?posAire:posEsc, Tde=aire?TAire:TEsc, L=aire?LUT.aire:LUT.esc, dur=aire?durA:durE;
    for(let i=0;i<E.cap;i++){
      const quiere=i<n;
      if(!E.vivo[i]){ if(!quiere) continue; siembra(E,i,tipo); E.vivo[i]=1; E.al[i]=dt>0?0:1; }
      E.al[i]+=((quiere?1:0)-E.al[i])*fade;
      if(!quiere&&E.al[i]<0.02){ E.vivo[i]=0; continue; }
      if(dt>0) avanza(E,i,tipo,dt);
      const s=E.seg[i], f=E.f[i];
      // dentro del compresor sólo se pinta la lupa
      if(tipo===0&&s>=2&&s<=4) continue;
      pos(E,i,s,f,PZ.psi,_p);
      const ft=Math.max(0,f-ESTELA/dur(E,i,s));
      pos(E,i,s,ft,PZ.psi-PZ.w*ESTELA,_q);
      const dl=_p.distanceTo(_q);
      if(dl>ESTELA_MAX) _q.lerpVectors(_p,_q,ESTELA_MAX/dl);
      let a=E.al[i]*0.92;
      if(aire){ if(s===0) a*=suave(f/0.10); else if(s===10) a*=1-suave((f-0.55)/0.4); }
      else { if(s===5) a*=1-suave((f-0.86)/0.14); }
      lutEn(L,Tde(E,i,s,f),_col,0);
      const o=w*3;
      bA[o]=_p.x; bA[o+1]=_p.y; bA[o+2]=_p.z; bB[o]=_q.x; bB[o+1]=_q.y; bB[o+2]=_q.z;
      bC[w*4]=_col[0]; bC[w*4+1]=_col[1]; bC[w*4+2]=_col[2]; bC[w*4+3]=a;
      bZ[w]=aire?corteA(s):corteE(s);
      w++;
    }
  }
  gPart.instanceCount=w;
  for(const a of [iaA,iaB,iaC,iaZ]) a.needsUpdate=true;
}
/* Se apagan todas (al cambiar de motor o al desmontar): se vuelven a sembrar. */
function reiniciaParticulas(){ for(const E of [ENJ.aire,ENJ.esc,ENJ.lupa]){ E.vivo.fill(0); E.al.fill(0); } }

// ============================================================ T6 · UN SOLO RELOJ
/* Todo lo que se mueve lee el MISMO estado en el MISMO fotograma: la escena,
   las cifras y el cursor de las gráficas. Hay dos cámaras lentas fijas y se
   rotulan las dos: las ruedas a ×1/5 000 y el gas a ×1/300. En la vista de la
   respuesta, el transitorio del modelo se reproduce además a ×1/4 y la escena
   enseña, en cada instante, el punto de ese instante. */
const LENTO_TR=4;
const RELOJ={pausa:REDUCIDO, esc:REDUCIDO?0:1, psi:0, tTr:0, espera:0};
let PINTADAS=0;

/* La ventana de tiempo de la respuesta: la misma que dibuja el dock. */
function ventanaTr(T){
  const tCrudo=clamp(Math.max((T.tSopla===null?T_TRANS:T.tSopla)*7,0.9),0.9,T_TRANS);
  return Math.min(T_TRANS,Math.ceil(tCrudo/0.2)*0.2);
}
function puntoEn(pts,t){
  const x=clamp(t/0.02,0,pts.length-1), i=Math.min(pts.length-2,Math.floor(x)), u=x-i, a=pts[i], b=pts[i+1];
  const o={};
  for(const k in a){ const va=a[k], vb=b[k];
    o[k]=(typeof va==='number'&&typeof vb==='number')?va+(vb-va)*u:(u<0.5?va:vb); }
  return o;
}
/* El reto a ciegas: la escena enseña el motor SANO del caso, salvo lo que ya
   se ha comprado con un instrumento. Si no, las partículas y el metal al rojo
   dirían gratis lo que la sonda o el tacómetro cobran. */
function VReto(){
  const S0=retoEv('sano'), F=retoEv(RETO.falla), M=RETO.medido, V=Object.assign({},S0);
  if(M.tmap){ V.pAdm=F.pAdm; V.TAdm=F.TAdm; V.dtc=F.dtc; }
  if(M.manos){ V.p2=F.p2; V.pAdm=F.pAdm; }
  if(M.sonda3){ V.pEsc=F.pEsc; V.T3=F.T3; }
  if(M.taco){ V.nTurbo=F.nTurbo; V.xWG=F.xWG; V.mT=V.mEsc*(1-fraccionDescarga(F)); }
  V.eps=V.T2>V.Tamb+1e-6?clamp((V.T2-V.TAdm)/(V.T2-V.Tamb),0,1):0;
  // la caída de temperatura en la turbina, la del motor sano
  V.Pt=Math.max(0,V.mT)*CP_ESC*(S0.T3-T4de(S0));
  return V;
}
function estadoEscena(){
  if(!G.simUnlocked) return null;
  if(G.modo==='reto') return VReto();
  if(G.modo==='respuesta'){
    const T=TRANS(), P=puntoEn(T.pts,RELOJ.tTr);
    return puntoTransitorio(MQ(),averia(G.falla),AMB(),P);
  }
  return EV();
}

/* El metal al rojo: la carcasa de la turbina y el colector con la T antes de
   la turbina, la rueda con la media de su entrada y su salida, el bajante con
   la de la mezcla. La superficie, 150 K por debajo del gas (declarado). */
const CALOR={T3:[MAT.hierro,MC.hierro,MAT.colector], rueda:[MAT.ruedaT], Tm:[MAT.inox,MC.inox]};
function materialesCalientes(){
  const extra={T3:new Set(),Tm:new Set()};
  scene.traverse(o=>{ if(o.isMesh&&o.material&&o.material.userData&&o.material.userData.calor)
    extra[o.material.userData.calor].add(o.material); });
  return extra;
}
let CAL_EXTRA={T3:new Set(),Tm:new Set()};
function brilla(mats,T,k){
  const b=G.simUnlocked?brilloMetal(T)*k:0, c=colorRojo(T);
  for(const m of mats){ m.emissive.copy(c); m.emissiveIntensity=b; }
}

/* ---------- la cámara, encajada en el hueco libre de la pantalla ---------- */
function seVe(e){ if(!e) return false; const b=e.getBoundingClientRect(); return b.width>0&&b.height>0&&getComputedStyle(e).display!=='none'; }
function huecoLibre(){
  const W=innerWidth, H=innerHeight, r=id=>{ const e=el(id); return seVe(e)?e.getBoundingClientRect():null; };
  const hud=r('hud'), pan=r('panel'), tb=r('tbar'), vb=r('vbar');
  let x0=8, x1=W-8, y0=60, y1=H-12;
  if(W>820){ if(hud&&hud.width) x0=hud.right+12; if(pan&&pan.width) x1=pan.left-12;
    if(vb&&vb.height) y0=Math.max(y0,vb.bottom+8); if(tb&&tb.height) y1=Math.min(y1,tb.top-8); }
  else { y1=H*0.52; }
  return {x0,x1,y0,y1};
}
function encaja(t,dir,pts,caja,margen=0){
  if(margen){ const mx=(caja.x1-caja.x0)*margen, my=(caja.y1-caja.y0)*margen; caja={x0:caja.x0+mx,x1:caja.x1-mx,y0:caja.y0+my,y1:caja.y1-my}; }
  const cam=S.camera.clone(), W=innerWidth, H=innerHeight, tan=Math.tan(cam.fov*DEG/2);
  cam.aspect=W/H; cam.updateProjectionMatrix();
  const cw=caja.x1-caja.x0, ch=caja.y1-caja.y0, cx=(caja.x0+caja.x1)/2, cy=(caja.y0+caja.y1)/2;
  let dist=5; const q=new THREE.Vector3(), der=new THREE.Vector3(), arr=new THREE.Vector3(); t=t.clone();
  for(let it=0;it<8;it++){
    cam.position.copy(t).addScaledVector(dir,dist); cam.lookAt(t); cam.updateMatrixWorld();
    let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;
    for(const p of pts){ q.copy(p).project(cam); const sx=(q.x+1)/2*W, sy=(1-q.y)/2*H;
      a0=Math.min(a0,sx); a1=Math.max(a1,sx); b0=Math.min(b0,sy); b1=Math.max(b1,sy); }
    const k=Math.max((a1-a0)/cw,(b1-b0)/ch), wpp=2*tan*dist/H;
    der.setFromMatrixColumn(cam.matrixWorld,0); arr.setFromMatrixColumn(cam.matrixWorld,1);
    t.addScaledVector(der,((a0+a1)/2-cx)*wpp).addScaledVector(arr,-((b0+b1)/2-cy)*wpp);
    dist*=k;
  }
  const p=t.clone().addScaledVector(dir,dist);
  return [[p.x,p.y,p.z],[t.x,t.y,t.z]];
}
const caja3=(a,b)=>{ const r=[]; for(const x of [a[0],b[0]]) for(const y of [a[1],b[1]]) for(const z of [a[2],b[2]]) r.push(new THREE.Vector3(x,y,z)); return r; };
const VISTA={actual:'banco'};
const VISTAS_CAM={
  banco:{rot:'Banco', tit:'El banco entero, con las piezas en el tapete'},
  conjunto:{rot:'Conjunto', tit:'El camino entero del aire y del escape'},
  turbo:{rot:'Turbo', tit:'El turbo en corte, de frente: las dos ruedas en el mismo eje'},
  intercooler:{rot:'Intercooler', tit:'El intercooler en corte: el aire se enfría al cruzarlo'},
};
function vistaCam(v){
  const H=huecoLibre(), L=LAY, T=L.T;
  if(v==='banco'){
    const pts=caja3([-1.80,Y_DECK,-1.25],[1.80,1.90,2.08]);
    return encaja(new THREE.Vector3(0,0.9,0.5),new THREE.Vector3(0.06,0.50,0.86).normalize(),pts,H,0.0);
  }
  if(v==='turbo'){
    const pts=[T(-0.68,-0.41,0),T(-0.68,0.45,0),T(0.50,0.45,0),T(0.50,-0.41,0),T(-0.23,0.52,-0.33)];
    return encaja(L.T0.clone(),new THREE.Vector3(0.04,0.18,0.98).normalize(),pts,H,0.07);
  }
  if(v==='intercooler'){
    const ic=L.ic, pts=caja3([L.icIn.x-0.05,ic.y-ICG.hT/2-0.02,ic.z-0.10],[L.icOut.x+0.05,ic.y+ICG.hT/2+0.03,ic.z]);
    return encaja(ic.clone(),new THREE.Vector3(0,0.22,0.975).normalize(),pts,H,0.05);
  }
  const pts=caja3([L.filtro.x-0.33,Y_DECK,-1.30],[1.65,1.98,L.ic.z+0.02]);
  return encaja(new THREE.Vector3(0,1.0,-0.2),new THREE.Vector3(0.14,0.40,0.91).normalize(),pts,H,0.02);
}
function ponVista(v,dur){
  VISTA.actual=v; const c=vistaCam(v);
  S.moveTo(c[0],c[1],dur===undefined?(REDUCIDO?0.01:1.2):dur); if(typeof pintaBarras==='function') pintaBarras();
}
const VISTA_DE={ensamble:'banco', mapa:'turbo', camino:'conjunto', intercooler:'intercooler',
  respuesta:'turbo', censo:'conjunto', reto:'conjunto'};

/* ---------- los nombres de las piezas: al pasar el ratón, y rótulos opcionales ---------- */
const HOVER={id:null};
(function(){
  const tip=document.createElement('div'); tip.className='tip3'; document.body.appendChild(tip);
  const ray=new THREE.Raycaster(), m=new THREE.Vector2(); let ult=0, abajo=false;
  mount.addEventListener('pointerdown',()=>{ abajo=true; }); addEventListener('pointerup',()=>{ abajo=false; });
  mount.addEventListener('pointerleave',()=>{ tip.style.display='none'; HOVER.id=null; });
  mount.addEventListener('pointermove',e=>{
    const ahora=performance.now(); if(abajo||ahora-ult<70) return; ult=ahora;
    const r=mount.getBoundingClientRect(); m.x=((e.clientX-r.left)/r.width)*2-1; m.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(m,S.camera);
    let nom=null, id=null;
    for(const h of golpes(ray)){ const t=conEtiqueta(h.object); if(!t) continue;
      id=t.userData.id||null;
      nom=t.userData.kind==='slot'?('Hueco de: '+PART[t.userData.id].rot):(t.userData.nombre||null);
      if(nom) break; }
    HOVER.id=id;
    if(nom){ tip.textContent=nom; tip.style.display='block'; tip.style.left=(e.clientX+14)+'px'; tip.style.top=(e.clientY+12)+'px';
      mount.style.cursor=(id&&!ASM.done.has(id))||ASM.sel?'pointer':''; }
    else { tip.style.display='none'; mount.style.cursor=''; }
  });
})();
const ROT={on:false,els:[]};
const ANCLAS=[
  ['Filtro de aire',()=>LAY.filtro.clone().add(new THREE.Vector3(-0.06,0.19,-0.02))],
  ['Rueda del compresor',()=>LAY.T(-0.34,0.11,-0.03)],
  ['Caracola del compresor',()=>LAY.T(-0.23,0.36,-0.01)],
  ['Eje y cojinetes',()=>LAY.T(-0.07,0.03,-0.01)],
  ['Rueda de la turbina',()=>LAY.T(0.32,0.10,-0.03)],
  ['Caracola de la turbina',()=>LAY.T(0.23,-0.30,-0.01)],
  ['Trampilla de la descarga',()=>LAY.T(0.49,0.20,-0.046)],
  ['Cápsula de la descarga',()=>LAY.T(WG.capsula.x,WG.capsula.y,WG.capsula.z)],
  ['Colector de escape',()=>new THREE.Vector3(0.55,LAY.yLog+0.06,LAY.zLog)],
  ['Intercooler',()=>LAY.ic.clone().add(new THREE.Vector3(-0.20,0.16,-0.02))],
  ['Mariposa',()=>LAY.mariposa.clone().add(new THREE.Vector3(0,0.10,-0.02))],
  ['Sensor de colector',()=>LAY.tmap.clone().add(new THREE.Vector3(0,0.10,0))],
];
(function(){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','rot3svg'); document.body.appendChild(svg);
  for(const [t] of ANCLAS){ const d=document.createElement('div'); d.className='rot3'; d.textContent=t; d.style.display='none'; document.body.appendChild(d);
    const ln=document.createElementNS('http://www.w3.org/2000/svg','path'); ln.setAttribute('stroke','rgba(90,209,230,.55)'); ln.setAttribute('fill','none');
    ln.setAttribute('stroke-width','1.2'); ln.style.display='none'; svg.appendChild(ln); ROT.els.push({d,ln}); }
})();
function pintaRotulos(){ const vis=ROT.on&&G.simUnlocked; ROT.els.forEach(e=>{ e.d.style.display=vis?'block':'none'; e.ln.style.display=vis?'':'none'; }); }
function colocaRotulos(){
  if(!(ROT.on&&G.simUnlocked)) return;
  const H=huecoLibre(), q=new THREE.Vector3(), cx=(H.x0+H.x1)/2, izq=[], der=[];
  ANCLAS.forEach(([t,f],i)=>{ q.copy(f()).project(S.camera); const x=(q.x+1)/2*innerWidth, y=(1-q.y)/2*innerHeight;
    const dentro=q.z<1&&x>H.x0-40&&x<H.x1+40&&y>H.y0-40&&y<H.y1+40;
    ROT.els[i].d.style.display=dentro?'block':'none'; ROT.els[i].ln.style.display=dentro?'':'none';
    if(dentro) (x<cx?izq:der).push({i,x,y}); });
  for(const [col,lado] of [[izq,-1],[der,1]]){ col.sort((a,b)=>a.y-b.y); let yMin=H.y0+4;
    for(const c of col){ const e=ROT.els[c.i], w=e.d.offsetWidth||120, h=e.d.offsetHeight||22;
      const y=Math.max(yMin,c.y-h/2); yMin=y+h+6;
      const x=lado<0?H.x0+6:H.x1-6-w; e.d.style.left=x+'px'; e.d.style.top=y+'px';
      const xa=lado<0?x+w:x; e.ln.setAttribute('d','M'+xa+' '+(y+h/2)+' L'+c.x+' '+c.y); } }
}

/* ---------- lo que se mueve en cada fotograma ---------- */
let ultimoDock=0;
function anima(dt,t){
  animT+=dt;
  // los viajes de las piezas a su sitio
  for(let i=tweens.length-1;i>=0;i--){ const w=tweens[i]; w.t=Math.min(1,w.t+dt/w.dur); w.upd(w.t);
    if(w.t>=1){ tweens.splice(i,1); if(w.onDone) w.onDone(); } }
  // las piezas del tapete: la elegida se levanta, la de debajo del ratón apenas,
  // y la que toca montar ahora respira, para invitar al primer clic
  const sig=ASM.sel?null:(ORDEN.find(k=>!ASM.done.has(k)&&!falta(k).length)||null);
  for(const k in piezas){ const o=piezas[k], u=o.userData; if(u.kind!=='part') continue;
    const sel=ASM.sel===k, hov=HOVER.id===k;
    const resp=(sig===k&&!REDUCIDO)?0.014*(0.5-0.5*Math.cos(t*2.6)):0;
    u.lift=clamp(u.lift+(sel?1:-1)*dt*3.0,0,1); u.hover=clamp(u.hover+(hov&&!sel?1:-1)*dt*6,0,1);
    o.position.y=u.baseY+ease(u.lift)*0.20+ease(u.hover)*0.03+(sel&&!REDUCIDO?0.010*Math.sin(t*2.2):0)+resp; }
  for(const k in fantasmas){ const f=fantasmas[k], u=f.userData; if(!f.visible) continue;
    if(u.fading){ u.gm.opacity=Math.max(0,u.gm.opacity-dt*1.4); if(u.gm.opacity<=0) f.visible=false; continue; }
    u.gm.opacity=0.16+0.10*(0.5+0.5*Math.sin(t*3.0));
    if(u.shake>0){ u.shake=Math.max(0,u.shake-dt*2.2); f.position.x=u.home.x+Math.sin(t*45)*0.04*u.shake; }
    else f.position.x=u.home.x; }

  // el estado del motor y el reloj
  RELOJ.esc+=((RELOJ.pausa?0:1)-RELOJ.esc)*Math.min(1,dt*3);
  const dts=dt*RELOJ.esc;
  if(G.simUnlocked&&G.modo==='respuesta'){
    const T=TRANS(), fin=ventanaTr(T);
    if(RELOJ.tTr>=fin){ RELOJ.espera+=dts; if(RELOJ.espera>1.6){ RELOJ.tTr=0; RELOJ.espera=0; } }
    else RELOJ.tTr=Math.min(fin,RELOJ.tTr+dts/LENTO_TR);
  }
  const V=estadoEscena();
  if(V){
    PZ.V=V; PZ.e=MQ(); PZ.c=cuentas(PZ.e,V); PZ.T4=T4de(V); PZ.Tm=Tmezcla(V); PZ.w=omegaPantalla(V.nTurbo);
    RELOJ.psi=(RELOJ.psi+PZ.w*dts)%(DOSPI*64); PZ.psi=RELOJ.psi;
    const giran=[RIG.eje,RIG.ruedaC,RIG.ruedaT];
    for(const g of giran) if(g) g.rotation.x=RELOJ.psi;
    if(RIG.wg&&RIG.wg.userData.kind==='placed') poseDescarga(RIG.wg,anguloTrampilla(V.xWG));
    if(RIG.plato) RIG.plato.rotation.y=Math.PI/2*(0.12+0.88*clamp(G.carga,0,1));
    if(RIG.testigo){ const m=RIG.testigo.material, on=!!V.dtc;
      m.emissive.setHex(on?0xe9a63a:0x000000); m.emissiveIntensity=on?(1.1+(REDUCIDO?0:0.5*Math.sin(t*4))):0; }
    brilla([...CALOR.T3,...CAL_EXTRA.T3],V.T3,0.20);
    brilla(CALOR.rueda,(V.T3+PZ.T4)/2,0.20);
    brilla([...CALOR.Tm,...CAL_EXTRA.Tm],PZ.Tm,0.20);
  }else{
    brilla([...CALOR.T3,...CAL_EXTRA.T3,...CALOR.rueda,...CALOR.Tm,...CAL_EXTRA.Tm],300,0);
  }
  pintaParticulas(V?dts:0);
  // el dock sigue al mismo reloj (a 30 cuadros por segundo basta)
  if(G.simUnlocked&&t-ultimoDock>1/30){ ultimoDock=t; pintaDockVivo(); }
  if(ROT.on) colocaRotulos();
}

// ============================================================ T7 · EL PANEL, EL DOCK Y LAS BARRAS
/* Nada de texto ni de gráficas dentro de la escena. A la izquierda, lo que se
   manda; a la derecha, un dock con lo que se mide, en lienzos medidos en
   píxeles de pantalla (devicePixelRatio) y con la tipografía del laboratorio.
   Lo largo va plegado. */
(function(){
  const css=document.createElement('style');
  css.textContent=`
:root{--hudW:322px;--dockW:420px}
@media (max-width:1699px){:root{--hudW:300px;--dockW:384px}}
@media (max-width:1439px){:root{--hudW:280px;--dockW:340px}}
.hint,.inspectHint{display:none!important}
.topbar .lt{display:none}
.toast{top:108px;max-width:min(560px,calc(100vw - var(--hudW) - var(--dockW) - 80px));line-height:1.5;border-radius:16px;font-size:12.5px}
.hud{top:66px;width:var(--hudW);max-width:none;max-height:calc(100vh - 80px);padding:15px 16px 12px;display:flex;flex-direction:column;gap:8px;overflow-y:auto;scrollbar-width:thin}
.hud .eyebrow{margin:0;font-size:10px}
.hud h2{font-size:19px;line-height:1.18;margin:0}
.hud .intro{font-size:12.8px;line-height:1.5;color:var(--dim);margin:0}
.hud .modebar{margin:0;gap:4px}
.hud .modebar .b{padding:6px 2px;font-size:11px;border-radius:8px;line-height:1.2}
.hud .b:disabled{opacity:.40;cursor:not-allowed}
.hud #ctrl{display:flex;flex-direction:column;gap:5px}
.hud .gl{margin:3px 0 0!important}
.hud .fila2{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.hud .console{margin:0;min-height:0;font-size:11.5px}
.hud .btns{margin:0;gap:5px}
.hud .btns .b{padding:7px 8px;font-size:12px}
.hud #checklist{font-family:var(--mono);font-size:12px;line-height:1.5;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:3px 8px}
.hud #checklist .it{cursor:pointer;color:#c4d0da;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border-radius:6px;padding:1px 4px}
.hud #checklist .it.ok{color:var(--good)}.hud #checklist .it.sel{background:rgba(79,209,197,.16);color:#fff}
.hud #checklist .it.lock{color:#5d6f6b}
.hud details{border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.18)}
.hud details>summary{list-style:none;cursor:pointer;padding:7px 10px;font-size:12px;color:var(--ink);display:flex;gap:7px;align-items:baseline}
.hud details>summary::-webkit-details-marker{display:none}
.hud details>summary:before{content:'▸';color:var(--accent2);font-size:11px;transition:transform .15s}
.hud details[open]>summary:before{transform:rotate(90deg)}
.hud details>.cuerpo{padding:2px 10px 10px;font-size:11.5px;line-height:1.5;color:#c4d0da;max-height:44vh;overflow:auto}
.hud details .formula{font-family:var(--mono);color:var(--accent2);font-size:11.5px;line-height:1.6;margin:5px 0;padding:6px 8px;background:rgba(0,0,0,.25);border-radius:8px;text-align:left}
.hud details .fl{margin:5px 0}.hud details .fl b{color:var(--ink)}.hud details .no b{color:var(--hv)}
.hud #quiz .lt{margin-bottom:5px}.hud #quiz .console{margin-bottom:6px}
.hud .sel{width:100%;background:#1b242f;color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:6px 8px;font-family:inherit;font-size:12px}
.hud #retobox{border:1px solid rgba(255,183,3,.35);background:rgba(255,183,3,.05);border-radius:10px;padding:8px 9px}
.hud #instrreto .b,.hud #dxreto .b{padding:6px 8px;font-size:11.5px}
.hud #dxreto{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.hud #instrreto{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px}.hud #instrreto .b{text-align:center;padding:6px 4px}
@media (max-height:820px){ .hud{gap:6px;padding:12px 14px 10px}.hud h2{font-size:17px}.hud .intro{font-size:12.2px;line-height:1.42} }
.panel{top:66px;bottom:14px;width:var(--dockW);max-height:none;padding:12px 14px 11px;display:flex;flex-direction:column;gap:6px;overflow:hidden}
body.enEnsamble .panel{display:none}
.dk-t{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.dk-t b{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent2);font-weight:700}
.dk-t .sub{font-size:11px;color:var(--dim);text-align:right}
.dk-fig{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}
.fg{background:rgba(0,0,0,.22);border:1px solid rgba(30,58,52,.9);border-radius:9px;padding:4px 8px;min-width:0}
.fg .fl{display:block;font-size:10px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg b{display:block;font-size:17px;line-height:1.2;color:var(--ink);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg b small{font-size:10.5px;color:var(--dim);font-weight:500}
.fg b.bad{color:#ff9a9a}.fg b.warn{color:#ffd88a}.fg b.good{color:#8ff0c6}
.dk-aviso{font-size:11.5px;line-height:1.35;border-radius:9px;padding:5px 9px;font-weight:600;letter-spacing:.02em}
.dk-aviso.ok{background:rgba(52,211,153,.08);color:#9ff0cd;border:1px solid rgba(52,211,153,.28)}
.dk-aviso.warn{background:rgba(255,183,3,.08);color:#ffd88a;border:1px solid rgba(255,183,3,.30)}
.dk-aviso.bad{background:rgba(244,71,94,.12);color:#ffb3bd;border:1px solid rgba(244,71,94,.35)}
.dk-tit{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--dim);margin:2px 2px -2px;display:flex;justify-content:space-between;gap:8px}
.dk-tit span{letter-spacing:0;text-transform:none;font-size:10.5px;color:#7fa39c}
.dk-g{position:relative;flex:1.7 1 0;min-height:110px;border-radius:10px;background:rgba(0,0,0,.20);border:1px solid rgba(30,58,52,.7)}
.dk-g.b{flex:1 1 0;min-height:90px}
.dk-g.c{flex:0 0 62px;min-height:62px}
.dk-g canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.dk-ley{display:flex;flex-wrap:wrap;gap:2px 12px;font-size:10.5px;color:#b4c9c4;margin:-1px 2px 0}
.dk-ley .lg{display:inline-flex;align-items:center;gap:5px;white-space:nowrap}
.dk-ley i{display:inline-block;width:16px;height:0;border-top:2px solid var(--c)}
.dk-ley i.dash{border-top:2px dashed var(--c)}
.dk-ley i.pt{width:9px;height:9px;border:0;border-radius:50%;background:var(--c)}
.dk-ley i.area{width:12px;height:10px;border:1px solid var(--c);background:color-mix(in srgb,var(--c) 22%,transparent);border-radius:2px}
.panel details{border:1px solid var(--line);border-radius:10px;background:rgba(0,0,0,.18);flex:none}
.panel details>summary{list-style:none;cursor:pointer;padding:6px 10px;font-size:11.5px;color:var(--ink);display:flex;gap:7px}
.panel details>summary::-webkit-details-marker{display:none}
.panel details>summary:before{content:'▸';color:var(--accent2);font-size:11px}
.panel details[open]>summary:before{content:'▾'}
.panel details>.cuerpo{padding:2px 10px 9px;font-size:11.5px;line-height:1.5;color:#c4d0da;max-height:32vh;overflow:auto}
.panel[data-m="censo"] .dk-g.b,.panel[data-m="censo"] #titB,.panel[data-m="censo"] #leyB,
.panel[data-m="censo"] .dk-g.c,.panel[data-m="censo"] #titC{display:none}
.panel[data-m="censo"] .dk-g{flex:1 1 0}
body.enReto .dk-fig,body.enReto .dk-aviso,body.enReto .dk-tit,body.enReto .dk-g,body.enReto .dk-ley,body.enReto #dkMas{display:none!important}
.dk-reto{display:none;flex-direction:column;gap:6px;flex:1;min-height:0;overflow:auto}
body.enReto .dk-reto{display:flex}
.dk-reto .rc{border:1px solid #233a35;border-radius:9px;padding:6px 9px;background:rgba(0,0,0,.18)}
.dk-reto .rc.on{border-color:rgba(79,209,197,.45);background:rgba(79,209,197,.06)}
.dk-reto .rc .rn{font-size:11.5px;color:#c4d0da;display:flex;justify-content:space-between;gap:8px}
.dk-reto .rc .rn i{font-style:normal;color:#5f7570;font-size:11px}
.dk-reto .rc .rv{font-family:var(--mono);font-size:12px;color:var(--accent2);margin-top:3px;font-variant-numeric:tabular-nums;line-height:1.45}
.dk-reto .rc .rnota{font-size:10.5px;color:#7f9a95;font-style:italic;margin-top:2px}
.dk-reto .cnt{display:flex;gap:6px}.dk-reto .cnt .fg{flex:1}
.dk-reto .band{border-radius:10px;padding:8px 10px;font-size:11.5px;line-height:1.45}
.dk-reto .band b{display:block;font-size:11px;letter-spacing:.08em;margin-bottom:3px}
.dk-reto .band.ok{background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.3);color:#c9f5e2}
.dk-reto .band.warn{background:rgba(255,183,3,.07);border:1px solid rgba(255,183,3,.3);color:#ffe2a6}
.dk-reto .band.bad{background:rgba(244,71,94,.10);border:1px solid rgba(244,71,94,.35);color:#ffc9d0}
.dk-reto table{width:100%;border-collapse:collapse;font-size:11px}.dk-reto td{padding:2px 4px;border-bottom:1px dashed #22403a}
.vbar,.tbar{position:fixed;z-index:16;display:flex;align-items:center;gap:5px;background:var(--panel);backdrop-filter:blur(14px);
  border:1px solid var(--line);border-radius:12px;font-family:var(--mono);font-size:11px;color:var(--dim);transform:translateX(-50%)}
.vbar{top:62px;padding:4px 6px}
.vbar .sep{width:1px;height:18px;background:var(--line);margin:0 3px}
.vbar .b.sm,.tbar .b.sm{padding:4px 10px;font-size:11.5px;border-radius:7px;line-height:1.2}
body.enEnsamble .vbar .sim{display:none}
.tbar{bottom:14px;padding:6px 10px;gap:8px}
body.enEnsamble .tbar,body.enReto .tbar{display:none}
.tbar .lento{color:var(--hv);font-size:11.5px;white-space:nowrap}
.tbar .tr{color:#c4d0da;font-size:11.5px;white-space:nowrap;font-variant-numeric:tabular-nums}
.tip3{position:fixed;z-index:30;pointer-events:none;font-family:var(--mono);font-size:11.5px;color:#e6f0f2;background:rgba(9,22,24,.9);
  border:1px solid rgba(79,209,197,.4);padding:4px 9px;border-radius:7px;white-space:nowrap;display:none}
.rot3{position:fixed;z-index:13;pointer-events:none;font-family:var(--mono);font-size:11px;color:#e6f0f2;background:rgba(9,22,24,.84);
  border:1px solid rgba(90,209,230,.32);padding:3px 8px;border-radius:7px;white-space:nowrap}
.rot3svg{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:12;pointer-events:none;overflow:visible}
@media(max-width:820px){
  .hud,.panel{top:auto;bottom:8px;left:8px;right:8px;width:auto;max-height:44vh;overflow-y:auto}
  .hud{bottom:calc(8px + 44vh + 8px);max-height:30vh}
  .vbar{top:58px;left:50%!important}.tbar{top:96px;bottom:auto;left:50%!important}
  .dk-g{min-height:150px}.rot3svg,.rot3{display:none}
}`;
  document.head.appendChild(css);
})();

const MODE_META={
  ensamble:   ['Montaje',    'El camino del aire'],
  mapa:       ['Mapa',       'El mapa del compresor'],
  camino:     ['Estaciones', 'Presión y temperatura, punto a punto'],
  intercooler:['Intercooler','Enfría y estorba'],
  respuesta:  ['Respuesta',  'El retardo del turbo'],
  censo:      ['Censo',      'Lo que el ordenador no ve'],
  reto:       ['Reto',       'Diagnóstico a ciegas'],
};
const HUD_TXT={
  ensamble:'Siete piezas en el orden en que el aire las atraviesa. Toca una pieza del tapete y después su hueco luminoso.',
  ensambleListo:'El aire ya corre: entra frío por el filtro, sale caliente del compresor y el intercooler lo enfría antes del motor.',
  mapa:'El compresor sólo da la presión que su mapa permite para el aire que le llega: a la izquierda bombea, a la derecha se bloquea.',
  camino:'La densidad es presión ENTRE temperatura: por eso el color del gas importa tanto como el manómetro.',
  intercooler:'Enfría y estorba a la vez. Mira el color del aire al cruzarlo y busca el tamaño que da más par.',
  respuesta:'Se pisa a fondo en el instante cero. El retardo sale de la inercia del eje contra lo que la turbina le da.',
  censo:'Ocho averías y el motor sano, en cinco regímenes. Cuenta dónde hay síntoma y el ordenador calla.',
  reto:'Llega un motor y nadie dice qué tiene. Seis instrumentos: lo que se aprende es cuál separa.',
};

/* ---------- el panel de la izquierda ---------- */
el('hud').innerHTML=
  '<div class="eyebrow">Motor de combustión · Sobrealimentación</div>'+
  '<h2 id="hudTit"></h2>'+
  '<p class="intro" id="hudIntro"></p>'+
  '<div id="ctrl"></div>'+
  '<div id="secEns"><div id="checklist"></div></div>'+
  '<div id="retobox" style="display:none">'+
    '<div class="gl" style="margin:2px 0 4px"><span>Instrumentos · cada uno, una consulta</span></div>'+
    '<div class="btns" id="instrreto"></div>'+
    '<div class="gl" style="margin:8px 0 4px"><span>Tu dictamen</span></div>'+
    '<div id="dxreto"></div>'+
    '<div class="modebar" style="margin-top:7px">'+
      '<button class="b" id="btnPista">Pista</button>'+
      '<button class="b on" id="btnEntrega">Entregar</button>'+
      '<button class="b" id="btnOtro">Otro motor</button>'+
    '</div>'+
  '</div>'+
  '<div class="modebar"><button class="b auto" id="btnAuto">▶︎ Recorrido guiado</button></div>'+
  '<details id="dInf"><summary>Informe del banco</summary><div class="cuerpo"><div id="tele"></div><div class="console" id="report"></div></div></details>'+
  '<details id="dQuiz"><summary>Comprueba lo que has leído</summary><div class="cuerpo"><div id="quiz"></div></div></details>'+
  '<details id="dEc"><summary>Ecuaciones y contrato de fidelidad</summary><div class="cuerpo">'+
    '<div class="formula">T₂ = T₁·[1 + (π<sup>(γ−1)/γ</sup> − 1)/η<sub>c</sub>]<br>T<sub>col</sub> = T₂ − ε·(T₂ − T<sub>amb</sub>)<br>ρ = p/(R·T)<br>P<sub>t</sub> = P<sub>c</sub> (el eje en equilibrio)<br>T₄ = T₃ − P<sub>t</sub>/(ṁ<sub>t</sub>·c<sub>p</sub>)<br>τ = ρ·A·L/ṁ</div>'+
    '<div class="fl">El color de cada partícula es la temperatura que da el modelo en su tramo: T₁ hasta la rueda, sube a T₂ dentro de ella, se enfría a lo largo del intercooler como (1 − ε)<sup>ξ</sup> y llega al colector a T<sub>col</sub>. En el escape, T₃ antes de la turbina, T₄ tras ella y la mezcla con lo que se salta por la descarga.</div>'+
    '<div class="fl">Cada partícula es una porción de masa fija. Tarda en cada tramo lo que tarda el gas de verdad, τ = ρ·A·L/ṁ, multiplicado por la cámara lenta: por eso se apiñan donde el gas va despacio y hay más donde es más denso.</div>'+
    '<div class="fl">La trampilla abre un ángulo con sen θ = x·sen 28°, donde x es la apertura que da el lazo de control: el área de cortina es proporcional a sen θ.</div>'+
    '<div class="fl">SÍ modela: <b>el mapa del compresor con bombeo y bloqueo, la turbina como tobera, el equilibrio del eje, la válvula de descarga con su lazo, el intercooler por ε-NTU con su pérdida de carga, el control de picado y el transitorio integrado contra la inercia del eje.</b></div>'+
    '<div class="fl no">Escalas del dibujo: <b>el turbo va ampliado unas tres veces más que el motor (su rueda de 44 mm se dibuja de 33 cm), como un turbo de corte de formación; en los otros motores se dibuja el mismo turbo escalado con su gasto de bloqueo a la 0,18. El V8 se dibuja con una sola bancada. Los manguitos de carga son de vidrio para ver el aire. Las velocidades del gas salen de las secciones reales, no del dibujo.</b></div>'+
    '<div class="fl no">Simplificaciones de lo que se ve: <b>dos cámaras lentas fijas (ruedas ×1/5 000, gas ×1/300) y el transitorio a ×1/4; la T sube lineal dentro de la rueda; el escape se trata con la R del aire; la superficie del metal se toma 150 K bajo el gas para su brillo; una partícula de escape lleva 0,15 veces la masa de una de aire.</b></div>'+
    '<div class="fl">Referencias: Watson y Janota, <i>Turbocharging the Internal Combustion Engine</i>; Heywood, <i>ICE Fundamentals</i>, cap. 6; Kays y London para ε-NTU; SAE J1349 para las condiciones de referencia.</div>'+
  '</div></details>';

/* ---------- el dock de la derecha ---------- */
el('panel').innerHTML=
  '<div class="dk-t"><b id="dkModo"></b><span class="sub" id="dkSub"></span></div>'+
  '<div class="dk-fig" id="dkFig"></div>'+
  '<div class="dk-aviso" id="dkAviso"></div>'+
  '<div class="dk-tit" id="titA"></div>'+
  '<div class="dk-g" id="gA"><canvas></canvas></div>'+
  '<div class="dk-ley" id="leyA"></div>'+
  '<div class="dk-tit" id="titB"></div>'+
  '<div class="dk-g b" id="gB"><canvas></canvas></div>'+
  '<div class="dk-ley" id="leyB"></div>'+
  '<div class="dk-tit" id="titC">Color del gas = su temperatura<span>marcas: ahora</span></div>'+
  '<div class="dk-g c" id="gC"><canvas></canvas></div>'+
  '<details id="dkMas"><summary id="dkMasT">Qué está pasando</summary><div class="cuerpo" id="dkMasC"></div></details>'+
  '<div class="dk-reto" id="dkReto"></div>';

/* ---------- barras de vistas (arriba) y de reproducción (abajo) ---------- */
(function(){
  const b=document.createElement('div'); b.className='vbar'; b.id='vbar';
  b.innerHTML=['conjunto','turbo','intercooler','banco'].map(v=>
    '<button class="b sm sim" data-vista="'+v+'" title="'+VISTAS_CAM[v].tit+'">'+VISTAS_CAM[v].rot+'</button>').join('')+
    '<span class="sep sim"></span><button class="b sm sim" id="tb_rot" title="Los nombres de las piezas">Rótulos</button>'+
    '<span class="sep sim"></span><button class="b sm" id="tb_cal"></button>';
  document.body.appendChild(b);
  const t=document.createElement('div'); t.className='tbar'; t.id='tbar';
  t.innerHTML='<button class="b sm" id="tb_play" title="Reproducir o pausar (espacio)">⏸</button>'+
    '<span class="lento" id="tb_txt"></span><span class="tr" id="tb_tr"></span>'+
    '<button class="b sm" id="tb_re" title="Volver a pisar el acelerador desde el instante cero">↺ otra vez</button>';
  document.body.appendChild(t);
})();
function colocaBarras(){
  if(innerWidth<=820){ for(const id of ['vbar','tbar']) el(id).style.left='50%'; return; }
  const a=el('hud').getBoundingClientRect(), p=el('panel'), b=seVe(p)?p.getBoundingClientRect():{left:innerWidth-8};
  const cx=(a.right+b.left)/2+'px'; el('vbar').style.left=cx; el('tbar').style.left=cx;
}
function pintaBarras(){
  document.querySelectorAll('#vbar [data-vista]').forEach(x=>x.classList.toggle('on',x.getAttribute('data-vista')===VISTA.actual));
  el('tb_rot').classList.toggle('on',ROT.on);
  el('tb_cal').innerHTML='Calidad: <b>'+CAL.nivel+'</b>';
  el('tb_cal').title='Calidad de imagen: '+CAL.nivel+(CAL.motivo?' ('+CAL.motivo+')':'')+'. Pulsa para pasar a '+
    (calAlta()?'media: menos resolución, sombras simples, sin resplandor y la mitad de partículas; la física no cambia.':'alta.');
  el('tb_play').textContent=RELOJ.pausa?'▶':'⏸';
  el('tb_txt').textContent=(RELOJ.pausa?'en pausa · ':'')+'ruedas ×1/'+num(LENTO_RUEDA,0)+' · gas ×1/'+num(LENTO_GAS,0)+
    (G.modo==='respuesta'?' · transitorio ×1/'+LENTO_TR:'')+' — cámara lenta';
  el('tb_re').style.display=G.modo==='respuesta'?'':'none';
  el('tb_tr').style.display=G.modo==='respuesta'?'':'none';
  colocaBarras();
}
function aplicaCalidad(){
  const alta=calAlta(), pr=alta?Math.min(devicePixelRatio,2):Math.min(devicePixelRatio,1.25);
  S.renderer.setPixelRatio(pr); if(S.composer.setPixelRatio) S.composer.setPixelRatio(pr); S.resize();
  if(LUZ.clave){ const n=alta?2048:1024; if(LUZ.clave.shadow.mapSize.x!==n){ LUZ.clave.shadow.mapSize.set(n,n);
    if(LUZ.clave.shadow.map){ LUZ.clave.shadow.map.dispose(); LUZ.clave.shadow.map=null; } } }
  S.bloom.enabled=alta;
  for(const ps of S.composer.passes) if(/GTAO/.test((ps.constructor&&ps.constructor.name)||'')||'gtaoMaterial' in ps) ps.enabled=alta;
}

/* ---------- los lienzos ---------- */
const FUENTE='Outfit,system-ui,"Segoe UI",Roboto,sans-serif';
function lienzo(id){ const box=el(id), c=box.querySelector('canvas'); return {box,c,ctx:c.getContext('2d'),w:0,h:0,dpr:1}; }
function abre(L){ const r=L.box.getBoundingClientRect(), dpr=Math.min(3,window.devicePixelRatio||1);
  const w=Math.max(20,Math.round(r.width)), h=Math.max(20,Math.round(r.height));
  if(L.w!==w||L.h!==h||L.dpr!==dpr){ L.c.width=Math.round(w*dpr); L.c.height=Math.round(h*dpr); L.w=w; L.h=h; L.dpr=dpr; }
  const x=L.ctx; x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h); return x; }
const LA=lienzo('gA'), LB=lienzo('gB'), LCo=lienzo('gC');
function txt(x,t,px,py,col,size,align,peso){ x.fillStyle=col; x.font=(peso||'600')+' '+(size||11)+'px '+FUENTE; x.textAlign=align||'left'; x.textBaseline='alphabetic'; x.fillText(t,px,py); }
function lin(x,x1,y1,x2,y2,col,w,dash){ x.strokeStyle=col; x.lineWidth=w||1; x.setLineDash(dash||[]); x.beginPath(); x.moveTo(x1,y1); x.lineTo(x2,y2); x.stroke(); x.setLineDash([]); }
function serie(x,pts,X,Y,col,w,dash){ if(pts.length<2) return; x.strokeStyle=col; x.lineWidth=w||2; x.setLineDash(dash||[]); x.lineJoin='round';
  x.beginPath(); pts.forEach((p,i)=>{ const a=X(p[0]), b=Y(p[1]); if(i) x.lineTo(a,b); else x.moveTo(a,b); }); x.stroke(); x.setLineDash([]); }
function punto(x,px,py,col,r){ x.fillStyle=col; x.beginPath(); x.arc(px,py,r||3,0,DOSPI); x.fill(); }
function halo(x,px,py,col){ x.fillStyle=col+'40'; x.beginPath(); x.arc(px,py,10,0,DOSPI); x.fill(); punto(x,px,py,col,4.5); }
// pasos «redondos» para los ejes: 1, 2, 2,5 o 5 por potencia de diez
function paso(rango,n){ const b=Math.pow(10,Math.floor(Math.log10(rango/n))); for(const m of [1,2,2.5,5,10]) if(rango/(m*b)<=n) return m*b; return 10*b; }
function decs(p){ return p>=1?0:(p>=0.1?1:(p>=0.01?2:3)); }
/* Unos ejes con su rejilla. Devuelve las dos escalas. */
function ejes(x,P,o){
  const X=v=>P.x+P.w*(v-o.x0)/(o.x1-o.x0), Y=v=>P.y+P.h-P.h*(v-o.y0)/(o.y1-o.y0);
  x.strokeStyle='rgba(143,179,172,0.10)'; x.lineWidth=1;
  const px=o.px||paso(o.x1-o.x0,o.nx||5), py=o.py||paso(o.y1-o.y0,o.ny||4);
  const fx=o.fx||(v=>num(v,decs(px))), fy=o.fy||(v=>num(v,decs(py)));
  for(let v=Math.ceil(o.x0/px-1e-9)*px;v<=o.x1+1e-9;v+=px){ const xx=Math.round(X(v))+0.5;
    x.beginPath(); x.moveTo(xx,P.y); x.lineTo(xx,P.y+P.h); x.stroke(); txt(x,fx(v),xx,P.y+P.h+13,'#8fa6a1',10,'center','500'); }
  for(let v=Math.ceil(o.y0/py-1e-9)*py;v<=o.y1+1e-9;v+=py){ const yy=Math.round(Y(v))+0.5;
    x.beginPath(); x.moveTo(P.x,yy); x.lineTo(P.x+P.w,yy); x.stroke(); txt(x,fy(v),P.x-5,yy+3.5,'#8fa6a1',10,'right','500'); }
  lin(x,P.x,P.y+P.h+0.5,P.x+P.w,P.y+P.h+0.5,'#3d5550',1); lin(x,P.x-0.5,P.y,P.x-0.5,P.y+P.h,'#3d5550',1);
  if(o.tx) txt(x,o.tx,P.x+P.w,P.y+P.h+25,'#b4c9c4',10.5,'right','600');
  if(o.ty){ x.save(); x.translate(11,P.y+P.h/2); x.rotate(-Math.PI/2); txt(x,o.ty,0,0,'#b4c9c4',10.5,'center','600'); x.restore(); }
  return {X,Y};
}
const marco2=(L,izq,der,arr,aba)=>({x:izq,y:arr,w:L.w-izq-der,h:L.h-arr-aba});
function ley(id,items){ el(id).innerHTML=items.map(([t,c,k])=>'<span class="lg"><i class="'+(k||'')+'" style="--c:'+c+'"></i>'+t+'</span>').join(''); }
// el color de PANTALLA de la escala, para que la gráfica y la partícula enseñen el mismo
const hexDe=c=>'#'+c.map(v=>Math.round(clamp(v,0,1)*255).toString(16).padStart(2,'0')).join('');
const colT=(T,aire)=>hexDe(aire?colorAire(T):colorEsc(T));

/* ---------- el mapa del compresor ---------- */
function lineaVelocidad(e,u){
  const pts=[], m1=mChoke(e,u);
  for(let i=0;i<=44;i++){ const m=m1*(0.12+0.88*i/44), pi=piDe(e,m,u);
    if(pi>1.005&&m>=mBombeo(e,pi)*0.72) pts.push([m,pi]); }
  return pts;
}
function lineaBombeo(e){ const pts=[]; for(let i=0;i<=40;i++){ const pi=1.05+(e.piMax*1.06-1.05)*i/40; pts.push([mBombeo(e,pi),pi]); } return pts; }
// La isla de rendimiento a un nivel dado: para cada línea de velocidad, por
// bisección, los DOS gastos que dan ese rendimiento, unidos en un lazo cerrado.
function islaRendimiento(e,L){
  const izq=[], der=[];
  for(let i=0;i<=34;i++){
    const u=0.24+(1.06-0.24)*i/34, mc=mChoke(e,u), mp=mc*0.64;
    if(etaComp(e,mp,u)<L) continue;
    const busca=(a,b)=>{ for(let k=0;k<26;k++){ const c=(a+b)/2; if(etaComp(e,c,u)>L) a=c; else b=c; } return (a+b)/2; };
    const mi=busca(mp,mc*0.06), md=busca(mp,mc*1.14), pI=piDe(e,mi,u), pD=piDe(e,md,u);
    if(pI>1.01) izq.push([mi,pI]); if(pD>1.01) der.push([md,pD]);
  }
  if(izq.length<2) return [];
  return izq.concat(der.reverse(),[izq[0]]);
}
// El bloqueo no es una curva aparte: cada línea de velocidad ACABA en su gasto
// de bloqueo. Se marca el final de cada una.
function finDeLinea(e,u){ const l=lineaVelocidad(e,u); return l.length?l[l.length-1]:null; }
function geoMapa(e){
  return memo('mapa|'+G.maq,()=>({
    islas:[0.90,0.955,0.99].map(f=>islaRendimiento(e,e.etaMax*f)),
    lineas:[0.3,0.4,0.5,0.6,0.7,0.8,0.9,1.0].map(u=>({u,l:lineaVelocidad(e,u)})),
    bombeo:lineaBombeo(e),
  }));
}
function pintaMapa(L,V){
  const x=abre(L), e=MQ(), C=CURVA(), Gm=geoMapa(e);
  const P=marco2(L,42,12,10,30);
  const A=ejes(x,P,{x0:0,x1:e.mChoke*1.18,y0:1,y1:e.piMax*1.10,nx:5,ny:5,tx:'gasto corregido (kg/s)',ty:'relación de presiones π'});
  x.save(); x.beginPath(); x.rect(P.x,P.y,P.w,P.h); x.clip();
  Gm.islas.forEach((iso,k)=>{ if(iso.length<4) return; x.beginPath();
    iso.forEach((p,i)=>{ const a=A.X(p[0]), b=A.Y(p[1]); if(i) x.lineTo(a,b); else x.moveTo(a,b); });
    x.closePath(); x.fillStyle='rgba(90,209,230,'+(0.05+0.03*k)+')'; x.fill(); x.strokeStyle='rgba(90,209,230,'+(0.28+0.13*k)+')'; x.lineWidth=1.2; x.stroke(); });
  Gm.lineas.forEach(({u,l},i)=>{ serie(x,l,A.X,A.Y,'#46566d',1.4);
    if(l.length&&i%2===1&&i>1){ const q=l[l.length-1]; txt(x,num(u*e.nMax/1000,0)+'k',A.X(q[0])+5,A.Y(q[1])+11,'#6b7d93',9.5,'left','600'); }
    const q=l[l.length-1]; if(q) punto(x,A.X(q[0]),A.Y(q[1]),VIO,2.6); });
  serie(x,Gm.bombeo,A.X,A.Y,BAD_HEX,2.2);
  serie(x,C.pts.map(p=>[p.mCorr,p.pi]),A.X,A.Y,NARANJA,2.4);
  if(V.u!==null&&V.mCorr!==undefined){ halo(x,A.X(V.mCorr),A.Y(V.pi),'#e8fffb'); }
  x.restore();
  // dónde está cada frontera, rotulado sobre ella
  const qb=Gm.bombeo[Math.round(Gm.bombeo.length*0.82)];
  txt(x,'bombeo',A.X(qb[0])-6,A.Y(qb[1]),BAD_HEX,10.5,'right','700');
  const l1=Gm.lineas[1].l, qc=l1[l1.length-1];
  if(qc) txt(x,'bloqueo →',A.X(qc[0])-4,A.Y(qc[1])-9,VIO,10.5,'right','700');
}
/* Por qué sale caliente: T₁, la T₂ de un compresor perfecto y la T₂ real. */
function pintaCalor(L,V){
  const x=abre(L), e=MQ();
  const eta=V.etaC!==undefined?V.etaC:(V.u===null?null:etaComp(e,V.mCorr,V.u));
  const T1=V.Tamb, T2s=T1*Math.pow(Math.max(1,V.pi),K_AIRE), T2=V.T2;
  const P=marco2(L,14,14,22,34);
  const t0=Math.floor((T1-273.15-5)/10)*10, t1=Math.ceil((Math.max(T2,T2s)-273.15+15)/10)*10;
  const X=t=>P.x+P.w*(t-273.15-t0)/(t1-t0);
  // la franja con la escala de color del aire
  // Alturas en píxeles, no en fracciones: con el lienzo bajo (1366 × 768) las
  // llaves de abajo se montaban sobre las marcas de °C. El bloque mide 71 px
  // (rótulo de arriba, franja, marcas, llave) y se centra en lo que haya.
  const hb=12, yb=P.y+6+Math.max(0,(P.h-27)/2);
  const g=x.createLinearGradient(X(t0+273.15),0,X(t1+273.15),0);
  for(let i=0;i<=24;i++){ const T=t0+273.15+(t1-t0)*i/24; g.addColorStop(i/24,colT(T,true)); }
  x.fillStyle=g; x.fillRect(P.x,yb,P.w,hb);
  const pso=paso(t1-t0,5);
  for(let t=Math.ceil(t0/pso)*pso;t<=t1;t+=pso){ const xx=X(t+273.15); lin(x,xx,yb+hb,xx,yb+hb+4,'#5f7570',1); txt(x,num(t,0)+' °C',xx,yb+hb+15,'#8fa6a1',9.5,'center','500'); }
  const marca=(T,t,col,arriba)=>{ const xx=X(T); lin(x,xx,yb-(arriba?16:0),xx,yb+hb+(arriba?0:0),col,1.6);
    punto(x,xx,yb+hb/2,col,3.2);
    // el rótulo no se sale del lienzo aunque la marca esté pegada al borde
    x.font='700 10.5px '+FUENTE; const w=x.measureText(t).width;
    txt(x,t,clamp(xx,w/2+2,L.w-w/2-2),yb-20,col,10.5,'center','700'); };
  marca(T1,'entra '+cel(T1,0),'#cfe7ff',true);
  if(Math.abs(X(T2s)-X(T2))>48) marca(T2s,'perfecto '+cel(T2s,0),'#9fb2ad',true);
  marca(T2,'sale '+cel(T2,0),'#ffffff',true);
  // las dos partes de la subida
  const yy=yb+hb+37;
  lin(x,X(T1),yy,X(T2s),yy,'#7fa39c',2); lin(x,X(T2s),yy,X(T2),yy,NARANJA,2);
  txt(x,'comprimir: +'+num(T2s-T1,0)+' K',(X(T1)+X(T2s))/2,yy-5,'#9fb2ad',10,'center','600');
  if(eta) txt(x,'pérdidas (η = '+pcc(eta*100,0)+'): +'+num(T2-T2s,0)+' K',Math.min(P.x+P.w-60,(X(T2s)+X(T2))/2+20),yy-5,NARANJA,10,'center','600');
}
/* Las seis estaciones: la presión absoluta en barras teñidas con el color del gas. */
function pintaEstaciones(L,V){
  const x=abre(L), ES=estacionesDe(V);
  const P=marco2(L,40,10,14,40);
  const pTop=Math.ceil(Math.max(V.pEsc,V.p2)*1.15/1e5/0.5)*0.5;
  const A=ejes(x,P,{x0:0,x1:ES.length,y0:0,y1:pTop,px:1,ny:4,fx:()=>'',ty:'presión absoluta (bar)'});
  const bw=P.w/ES.length*0.56;
  ES.forEach((s,i)=>{
    const cx=P.x+P.w*(i+0.5)/ES.length, h=(s.p/1e5)/pTop*P.h, col=colT(s.T,s.aire);
    x.fillStyle=col+'d0'; x.fillRect(cx-bw/2,P.y+P.h-h,bw,h);
    x.strokeStyle='rgba(255,255,255,0.25)'; x.lineWidth=1; x.strokeRect(cx-bw/2+0.5,P.y+P.h-h+0.5,bw-1,h-1);
    txt(x,num(s.p/1e5,2),cx,P.y+P.h-h-5,'#e8f2f0',10.5,'center','700');
    const rot=s.rot.split(' ');
    txt(x,rot.length>2?rot.slice(0,-1).join(' '):rot[0],cx,P.y+P.h+12,'#9fb2ad',9.5,'center','600');
    if(rot.length>1) txt(x,rot.length>2?rot[rot.length-1]:rot.slice(1).join(' '),cx,P.y+P.h+23,'#9fb2ad',9.5,'center','600');
    txt(x,cel(s.T,0),cx,P.y+P.h+35,col,10,'center','700');
  });
  const ya=A.Y(V.pAmb/1e5); lin(x,P.x,ya,P.x+P.w,ya,'#8fa6a1',1,[4,4]);
}
function pintaParCurva(L,V){
  const x=abre(L), e=MQ(), C=CURVA();
  const P=marco2(L,42,40,10,28);
  const pasoR=e.rpmMax>5000?1000:500, r0=Math.floor(C.pts[0].rpm/pasoR)*pasoR, r1=Math.ceil(e.rpmMax/pasoR)*pasoR;
  const parMax=Math.ceil(C.parMax.par*1.14/50)*50, potMax=Math.ceil(Math.max(C.potMax.pot,1)*1.14/25)*25;
  const A=ejes(x,P,{x0:r0,x1:r1,y0:0,y1:parMax,px:pasoR*(r1-r0>4000?2:1),ny:4,fx:v=>num(v/1000,v%1000?1:0)+'k',tx:'régimen (rpm)',ty:'par (N·m)'});
  serie(x,C.pts.map(p=>[p.rpm,p.par]),A.X,A.Y,CIAN,2.4);
  serie(x,C.pts.map(p=>[p.rpm,p.pot/potMax*parMax]),A.X,A.Y,NARANJA,2,[6,4]);
  for(let v=0;v<=potMax+1e-9;v+=potMax/4) txt(x,num(v,0),P.x+P.w+5,A.Y(v/potMax*parMax)+3.5,'#c99a6b',10,'left','500');
  txt(x,'kW',P.x+P.w+5,P.y+8,'#c99a6b',10,'left','600');
  if(V.par!==undefined) halo(x,A.X(V.rpm),A.Y(V.par),'#e8fffb');
}
/* El intercooler: el par contra su tamaño, y lo que hace contra el gasto. */
function barridoIC(){
  const e=MQ(), fb=fallaBarrido();
  return memo('ic|'+AMBK()+'|'+fb+'|'+RPM()+'|'+G.carga,()=>{
    const pts=[];
    for(let i=0;i<=22;i++){
      const f=0.12+(3.0-0.12)*i/22, e2=Object.assign({},e,{icNTU:e.icNTU*f, icDp:e.icDp*f});
      const V=evalua(e2,Object.assign({falla:fb,rpm:RPM(),carga:G.carga},AMB()));
      pts.push({f, rho:V.rhoAdm, par:V.par, TAdm:V.TAdm, eps:V.eps, dp:V.p2-V.pAdm, soplado:V.soplado, lim:V.limitadoDeton});
    }
    const mejor=pts.reduce((a,b)=>b.par>a.par?b:a,pts[0]);
    const serie=pts.reduce((a,b)=>Math.abs(b.f-1)<Math.abs(a.f-1)?b:a,pts[0]);
    return {pts, mejor, serie, falla:fb};
  });
}
// El barrido de tamaño se hace SIN las averías del propio intercooler.
function fallaBarrido(){ return (G.falla==='sinIC'||G.falla==='icSucio')?'sano':G.falla; }
function pintaICtam(L){
  const x=abre(L), B=barridoIC();
  const P=marco2(L,44,12,12,30);
  const pMin=Math.floor(Math.min.apply(null,B.pts.map(p=>p.par))*0.95/10)*10, pMax=Math.ceil(Math.max.apply(null,B.pts.map(p=>p.par))*1.04/10)*10;
  const A=ejes(x,P,{x0:0,x1:3.05,y0:pMin,y1:pMax,px:0.5,ny:4,fx:v=>'×'+num(v,1),tx:'tamaño del intercooler (× el de serie)',ty:'par (N·m)'});
  serie(x,B.pts.map(p=>[p.f,p.par]),A.X,A.Y,CIAN,2.4);
  B.pts.forEach(p=>punto(x,A.X(p.f),A.Y(p.par),p.lim?WARN_HEX:CIAN,2.2));
  lin(x,A.X(1),P.y,A.X(1),P.y+P.h,NARANJA,1.2,[5,4]); txt(x,'de serie',A.X(1)+4,P.y+10,NARANJA,10,'left','700');
  lin(x,A.X(B.mejor.f),P.y,A.X(B.mejor.f),P.y+P.h,OK_HEX,1.2,[5,4]);
  txt(x,'el mejor ×'+num(B.mejor.f,2),A.X(B.mejor.f)+4,P.y+22,OK_HEX,10,'left','700');
  halo(x,A.X(B.mejor.f),A.Y(B.mejor.par),OK_HEX);
}
function pintaICgasto(L,V){
  const x=abre(L), e=MQ(), quitado=(G.falla==='sinIC');
  const F=averia(quitado?'sano':G.falla), C2=CURVA(quitado?'sano':G.falla);
  const P=marco2(L,40,44,10,28);
  const mTop=Math.max.apply(null,C2.pts.map(q=>q.m))*1.06;
  const dpTop=Math.ceil(Math.max(0.1,Math.max.apply(null,C2.pts.map(q=>dpIC(e,q.m,F)))/1e3)*1.2);
  const A=ejes(x,P,{x0:0,x1:mTop,y0:0,y1:100,ny:4,tx:'gasto de aire (kg/s)',ty:'efectividad ε (%)'});
  serie(x,C2.pts.map(q=>[q.m,epsilonIC(e,q.m,G.vAire,F)*100]),A.X,A.Y,CIAN,2.4);
  serie(x,C2.pts.map(q=>[q.m,dpIC(e,q.m,F)/1e3/dpTop*100]),A.X,A.Y,NARANJA,2,[6,4]);
  for(let k=0;k<=4;k++) txt(x,num(dpTop*k/4,decs(dpTop/4)),P.x+P.w+5,A.Y(k*25)+3.5,'#c99a6b',10,'left','500');
  txt(x,'kPa',P.x+P.w+5,P.y+8,'#c99a6b',10,'left','600');
  const Vi=quitado?EV_DE('sano',RPM(),G.carga):V;
  halo(x,A.X(Vi.m),A.Y(Vi.eps*100),'#e8fffb');
}
/* La respuesta: soplado y descarga contra el tiempo, y las vueltas del eje, con
   el cursor del MISMO reloj que mueve la escena. */
function pintaTrSoplado(L){
  const x=abre(L), e=MQ(), T=TRANS(), Ts=G.falla==='sano'?null:TRANS('sano'), tFin=ventanaTr(T);
  const P=marco2(L,40,12,10,30);
  const sMax=Math.ceil(Math.max(T.sopladoPico,Ts?Ts.sopladoPico:0,e.sopladoObj)*1.14/1e5/0.5)*0.5;
  const A=ejes(x,P,{x0:0,x1:tFin,y0:0,y1:sMax,nx:5,py:0.5,tx:'tiempo desde que se pisa (s)',ty:'soplado (bar)'});
  const ycon=A.Y(e.sopladoObj/1e5); lin(x,P.x,ycon,P.x+P.w,ycon,WARN_HEX,1,[6,5]);
  txt(x,'consigna',P.x+4,ycon-4,WARN_HEX,10,'left','700');
  if(Ts) serie(x,Ts.pts.filter(p=>p.t<=tFin).map(p=>[p.t,p.soplado/1e5]),A.X,A.Y,'#5b6f6a',1.8,[6,4]);
  const pts=T.pts.filter(p=>p.t<=tFin);
  serie(x,pts.map(p=>[p.t,p.soplado/1e5]),A.X,A.Y,CIAN,2.4);
  serie(x,pts.map(p=>[p.t,p.xWG*sMax]),A.X,A.Y,NARANJA,1.8,[5,4]);
  if(T.tSopla!==null&&T.tSopla<tFin){ const xx=A.X(T.tSopla); lin(x,xx,P.y,xx,P.y+P.h,OK_HEX,1,[3,3]);
    txt(x,'90 % en '+seg(T.tSopla),xx+4,P.y+P.h-6,OK_HEX,10,'left','700'); }
  const c=puntoEn(T.pts,RELOJ.tTr), xc=A.X(Math.min(RELOJ.tTr,tFin));
  lin(x,xc,P.y,xc,P.y+P.h,'rgba(232,255,251,.55)',1);
  halo(x,xc,A.Y(c.soplado/1e5),'#e8fffb');
}
function pintaTrVueltas(L){
  const x=abre(L), e=MQ(), T=TRANS(), tFin=ventanaTr(T);
  const P=marco2(L,40,12,10,28);
  const pts=T.pts.filter(p=>p.t<=tFin);
  const nTop=Math.ceil(Math.max(Math.max.apply(null,pts.map(p=>p.n)),e.nMax)*1.08/5e4)*50;
  const A=ejes(x,P,{x0:0,x1:tFin,y0:0,y1:nTop,nx:5,ny:4,tx:'tiempo (s)',ty:'turbo (miles de rpm)'});
  const yM=A.Y(e.nMax/1000); lin(x,P.x,yM,P.x+P.w,yM,BAD_HEX,1,[6,5]);
  txt(x,'máximo del turbo',P.x+4,yM-4,BAD_HEX,10,'left','700');
  serie(x,pts.map(p=>[p.t,p.n/1000]),A.X,A.Y,VIO,2.4);
  const c=puntoEn(T.pts,RELOJ.tTr), xc=A.X(Math.min(RELOJ.tTr,tFin));
  lin(x,xc,P.y,xc,P.y+P.h,'rgba(232,255,251,.55)',1);
  halo(x,xc,A.Y(c.n/1000),'#e8fffb');
}
/* El censo: 9 × 5 casillas. */
function claseCelda(c){
  if(c.detona||c.sobreT3||c.sobrePresion||c.bombeo) return 'peligro';
  if(c.dtc) return 'codigo';
  if(c.nota) return 'mudo';
  return 'nada';
}
const CLASE_COL={
  peligro:{f:'rgba(255,107,107,0.20)',b:BAD_HEX,t:BAD_HEX},
  codigo: {f:'rgba(110,168,254,0.16)',b:'#3f6ea8',t:AZUL},
  mudo:   {f:'rgba(233,196,106,0.16)',b:'#8a7433',t:WARN_HEX},
  nada:   {f:'rgba(255,255,255,0.028)',b:'#233a35',t:'#5f7570'},
};
function pintaCenso(L){
  const x=abre(L), C=CENSO();
  const izq=Math.min(118,L.w*0.30), cw=(L.w-izq-8)/C.regs.length, top=30, ch=Math.min(38,(L.h-top-8)/C.filas.length);
  C.regs.forEach((R,j)=>{ const cx=izq+j*cw+cw/2;
    txt(x,num(R.rpm,0),cx,13,'#c3ccd8',10.5,'center','700'); txt(x,R.rot,cx,25,'#7b8f8a',9.5,'center','500'); });
  C.filas.forEach((f,i)=>{ const y=top+i*ch;
    txt(x,corta(f.corto,18),izq-6,y+ch/2+4,f.falla==='sano'?'#8fa6a1':'#e3ecea',10.5,'right','600');
    f.celdas.forEach((c,j)=>{ const cl=claseCelda(c), col=CLASE_COL[cl], xx=izq+j*cw+2, yy=y+2;
      x.fillStyle=col.f; x.strokeStyle=col.b; x.lineWidth=1;
      x.beginPath(); x.roundRect?x.roundRect(xx,yy,cw-4,ch-4,5):x.rect(xx,yy,cw-4,ch-4); x.fill(); x.stroke();
      const t=cl==='nada'?'—':(c.dtc?c.dtc:(cl==='peligro'?'⚠':'muda'));
      txt(x,t,xx+5,yy+(ch-4)/2+(cw>62?4:-1),cl==='nada'?'#4e6560':col.t,cw>62?10:9.5,'left','700');
      if(cl!=='nada'){ const g=-c.perdida*100;
        txt(x,(g>0.5?'+':'')+pcc(g,0),xx+cw-8,yy+(ch-4)/2+(cw>62?4:10),c.perdida>0.15?BAD_HEX:(g>0.5?WARN_HEX:'#9aa6b6'),9.5,'right','600'); }
    });
  });
}
/* La escala de color con las estaciones de ahora marcadas: es la leyenda de
   las partículas, y sale de las MISMAS funciones que las tiñen. */
function pintaEscala(L,V){
  const x=abre(L), W=L.w, izq=50, der=12, wB=W-izq-der;
  const fila=(y,E,T0,T1,marcas,rot)=>{
    const X=T=>izq+wB*(T-T0)/(T1-T0);
    const g=x.createLinearGradient(izq,0,izq+wB,0);
    for(let i=0;i<=30;i++){ const T=T0+(T1-T0)*i/30; g.addColorStop(i/30,hexDe(colorEscala(E,T))); }
    x.fillStyle=g; x.fillRect(izq,y,wB,9);
    txt(x,rot,izq-6,y+8.5,'#b4c9c4',10,'right','600');
    // los rótulos se reparten para que no se pisen: de izquierda a derecha y,
    // si no caben, empujados desde el borde derecho hacia atrás
    x.font='600 9.5px '+FUENTE;
    const R=marcas.map(([T,t])=>{ const xx=clamp(X(T),izq,izq+wB), s=t+' '+num(T-273.15,0)+'°'; return {xx,s,w:x.measureText(s).width}; });
    R.sort((a,b)=>a.xx-b.xx);
    let ult=izq-1e3; R.forEach(r=>{ r.tx=Math.max(r.xx,ult+4+r.w/2,izq+r.w/2-4); ult=r.tx+r.w/2; });
    let lim=izq+wB; for(let k=R.length-1;k>=0;k--){ const r=R[k]; r.tx=Math.min(r.tx,lim-r.w/2); lim=r.tx-r.w/2-4; }
    R.forEach(r=>{ lin(x,r.xx,y-3,r.xx,y+12,'#ffffff',1.4); txt(x,r.s,r.tx,y+23,'#dfe9e7',9.5,'center','600'); });
  };
  const Ta=Math.max(530,Math.ceil((V.T2+10)/50)*50);
  fila(5,ESCALA_AIRE,260,Math.min(900,Ta),[[V.Tamb,'entra'],[V.T2,'compresor'],[V.TAdm,'colector']],'aire');
  const T4=T4de(V), Tm=Tmezcla(V);
  fila(34,ESCALA_ESC,600,1320,[[V.T3,'turbina'],[T4,'tras ella'],[Tm,'bajante']].sort((a,b)=>a[0]-b[0]),'escape');
}

/* ---------- lo que el dock enseña en cada modo ---------- */
function fig(l,v,u,cls,title){ return '<div class="fg"'+(title?' title="'+title+'"':'')+'><span class="fl">'+l+'</span><b'+(cls?' class="'+cls+'"':'')+'>'+v+(u?' <small>'+u+'</small>':'')+'</b></div>'; }
const sinU=s=>s.replace(/[  ][^  ]+$/,'');
const uDe=s=>{ const m=s.match(/[  ]([^  ]+)$/); return m?m[1]:''; };
function figU(l,s,cls,title){ return fig(l,sinU(s),uDe(s),cls,title); }
function aviso(n,t){ const a=el('dkAviso'); a.className='dk-aviso '+n; a.textContent=t; }
function mas(t,cuerpo){ el('dkMasT').textContent=t; el('dkMasC').innerHTML=cuerpo; }
function bandaMapa(V,e){
  return V.bombeo?{n:'bad',r:'El compresor está bombeando',
      t:'El punto se ha metido a la izquierda de la línea de bombeo: el aire ya no puede seguir el álabe, se desprende y el flujo se invierte varias veces por segundo. La salida no es más presión: es más gasto o menos presión.'}
    : V.bloqueo?{n:'bad',r:'El compresor está bloqueado',
      t:'A la derecha del mapa el aire llega a la velocidad del sonido en la entrada de la rueda y el gasto deja de crecer por mucho que se gire más. El rendimiento se hunde: el compresor calienta más de lo que comprime.'}
    : V.margenBombeo===null?{n:'warn',r:'El compresor no está comprimiendo',
      t:'Con π = '+num(V.pi,2)+' el compresor gira prácticamente en vacío: no hay punto que situar en el mapa. El motor respira como un atmosférico.'}
    : V.margenBombeo<0.15?{n:'warn',r:'Margen de bombeo estrecho: '+pcc(V.margenBombeo*100),
      t:'Quedan '+pcc(V.margenBombeo*100)+' de gasto hasta la línea de bombeo. Es donde vive cualquier motor pequeño muy soplado a bajas vueltas; un filtro sucio, que sube la relación de presiones para la misma salida, puede empujarlo dentro.'}
    : {n:'ok',r:'Dentro de la ventana del mapa',
      t:'El punto está en la parte útil del mapa, con '+pcc(V.margenBombeo*100)+' de margen hasta el bombeo y '+pcc((1-V.mCorr/V.mChokeLinea)*100)+' hasta el bloqueo de su línea de velocidad. Comprime con '+pcc(etaComp(e,V.mCorr,V.u)*100,1)+' de rendimiento: lo que le falta al 100 % es lo que el aire sale más caliente que en un compresor perfecto.'};
}
function bandaCamino(V,e){
  const barre=V.pEsc>V.pAdm;
  return barre?{n:V.pEsc/V.pAdm>1.30?'warn':'ok',r:'El escape está por encima del colector',
      t:'Delante de la turbina hay '+barA(V.pEsc)+' y en el colector '+barA(V.pAdm)+': el motor EMPUJA los gases contra más presión de la que respira, y eso son '+num(V.Wbomb,1)+' J por ciclo que salen del par. Es el precio del turbo.'}
    : {n:'ok',r:'El colector está por encima del escape',
      t:'En el colector hay '+barA(V.pAdm)+' y delante de la turbina sólo '+barA(V.pEsc)+': el motor no empuja los gases, lo empujan a él. El trabajo de bombeo es negativo, '+num(-V.Wbomb,1)+' J por ciclo a favor.'};
}
function bandaIC(V,sin,e){
  const dPar=(sin.par/V.par-1)*100;
  return {n:e.diesel?'warn':(sin.limitadoDeton?'bad':'warn'),
    r:e.diesel?'Sin intercooler: misma presión, menos aire':'Sin intercooler, el ordenador baja la presión',
    t:e.diesel
      ?'Sin intercooler la presión de colector apenas cambia ('+barA(sin.pAdm)+' contra '+barA(V.pAdm)+') y sin embargo el par cae '+pcc(-dPar,1)+': el aire entra a '+cel(sin.TAdm)+' en vez de a '+cel(V.TAdm)+' y la densidad pasa de '+rhoF(V.rhoAdm)+' a '+rhoF(sin.rhoAdm)+'.'
      :'El aire a '+cel(sin.TAdm)+' llegaría al final de la compresión a '+kel(sin.Tcomp)+', y con '+G.octanaje+' octanos el umbral está en '+kel(sin.Tdet)+'. El control de picado baja la consigna a '+barF(sin.soplado)+' de soplado: '+pcc(-dPar,1)+' de par. El intercooler no da potencia: es lo que te deja usar la que ya tienes.'};
}
function bandaTr(T,Ts,e){
  return T.tSopla===null?{n:'bad',r:'No llega a la consigna',
      t:'Con este régimen y esta avería el eje no reúne nunca la potencia que el compresor pide. No es que tarde: se estabiliza más abajo.'}
    : Ts&&Ts.tSopla!==null&&T.tSopla>Ts.tSopla*1.4?{n:'warn',r:'Tarda '+num(T.tSopla/Ts.tSopla,1)+' veces más que el motor sano',
      t:'Con la avería el eje reúne el par neto mucho más despacio. El ordenador acaba viendo la presión que pedía, sólo que más tarde: el conductor nota el retardo y el escáner ve un motor sin novedad.'}
    : T.nFin>e.nMax?{n:'bad',r:'El eje se pasa de vueltas',
      t:'El eje acaba a '+rpmT(T.nFin)+' contra un límite de '+rpmT(e.nMax)+'. Sin la descarga frenando, la realimentación es positiva: más presión, más gasto, más contrapresión, más potencia de turbina.'}
    : {n:'ok',r:'Llega en '+seg(T.tSopla)+' con '+pcc(T.sobreimpulso*100)+' de sobreimpulso',
      t:'La descarga está cerrada mientras falta presión —todo el escape pasa por la turbina— y abre cuando el soplado alcanza la consigna. El actuador tiene velocidad finita: la presión se pasa un poco antes de asentarse.'};
}
function pintaDock(){
  if(!G.simUnlocked) return;
  const m=G.modo==='ensamble'?'camino':G.modo, e=MQ(), V=G.modo==='reto'?null:EV();
  el('panel').setAttribute('data-m',m);
  el('dkModo').textContent=G.modo==='ensamble'?'Banco en marcha':MODE_META[m][1];
  el('dkSub').textContent=G.modo==='reto'?'caso a ciegas':(e.corto+' · '+rpmT(RPM())+(G.falla!=='sano'?' · con avería':''));
  if(G.modo==='reto'){ pintaRetoDock(); return; }
  let f='', q=null;
  if(m==='mapa'){
    f=fig('relación π',num(V.pi,2),'',null,'Presión de salida del compresor entre la de entrada')+
      figU('gasto corregido',kgs(V.mCorr))+
      fig('rendimiento η<sub>c</sub>',V.u===null?'—':num(etaComp(e,V.mCorr,V.u)*100,1),'%')+
      fig('turbo',V.nTurbo===null?'—':num(V.nTurbo/1000,0),'mil rpm',V.sobreVel?'bad':'')+
      fig('margen de bombeo',V.margenBombeo===null?'—':num(V.margenBombeo*100,0),'%',V.bombeo?'bad':(V.margenBombeo!==null&&V.margenBombeo<0.15?'warn':''))+
      figU('sale a',cel(V.T2),V.T2>480?'warn':'');
    q=bandaMapa(V,e);
    el('titA').innerHTML='Mapa del compresor<span>el punto blanco es ahora</span>';
    ley('leyA',[['bombeo',BAD_HEX],['línea de plena carga',NARANJA],['velocidad del eje','#46566d'],['bloqueo de cada una',VIO,'pt'],['rendimiento','#5ad1e6','area']]);
    el('titB').innerHTML='Por qué sale caliente<span>T₂ = T₁·[1 + (π<sup>0,286</sup> − 1)/η]</span>';
    ley('leyB',[]);
  }else if(m==='camino'){
    f=figU('soplado',barF(V.soplado),V.sobrePresion?'bad':'')+figU('sale del compresor',cel(V.T2))+figU('colector',cel(V.TAdm),V.TAdm>340?'warn':'')+
      figU('densidad',rhoF(V.rhoAdm))+figU('par',nm(V.par,0),V.perdida>0.15?'bad':(V.perdida>0.05?'warn':''))+
      figU('antes de la turbina',barA(V.pEsc).replace(' abs',''),V.sobreT3?'bad':'');
    q=bandaCamino(V,e);
    el('titA').innerHTML='Las seis estaciones<span>barra: presión · color: temperatura</span>';
    ley('leyA',[['presión ambiente','#8fa6a1','dash']]);
    el('titB').innerHTML='Par y potencia a plena carga';
    ley('leyB',[['par',CIAN],['potencia',NARANJA,'dash'],['ahora','#e8fffb','pt']]);
  }else if(m==='intercooler'){
    const quitado=(G.falla==='sinIC'), Vc=quitado?EV_DE('sano',RPM(),G.carga):V, sin=quitado?V:EV_DE('sinIC',RPM(),G.carga);
    f=fig('efectividad ε',num(Vc.eps*100,0),'%')+fig('enfría',num(Vc.T2-273.15,0)+'→'+num(Vc.TAdm-273.15,0),'°C')+
      figU('pierde',num((Vc.p2-Vc.pAdm)/1e3,1)+' kPa')+figU('densidad',rhoF(Vc.rhoAdm))+
      figU('par con él',nm(Vc.par,0))+figU('par sin él',nm(sin.par,0),'warn');
    q=bandaIC(Vc,sin,e);
    el('titA').innerHTML='Par contra el tamaño del intercooler'+(fallaBarrido()!==G.falla?'<span>barrido con el intercooler sano</span>':'');
    ley('leyA',[['par',CIAN],['recortado por picado',WARN_HEX,'pt'],['de serie',NARANJA,'dash'],['máximo',OK_HEX,'dash']]);
    el('titB').innerHTML='ε y pérdida contra el gasto<span>a '+kmh(G.vAire)+'</span>';
    ley('leyB',[['efectividad',CIAN],['pérdida de carga',NARANJA,'dash'],['ahora','#e8fffb','pt']]);
  }else if(m==='respuesta'){
    const T=TRANS(), Ts=G.falla==='sano'?null:TRANS('sano');
    f=fig('llega al 90 %',T.tSopla===null?'no llega':num(T.tSopla,2),T.tSopla===null?'':'s',T.tSopla===null?'bad':'')+
      fig('sobreimpulso',num(T.sobreimpulso*100,0),'%',T.sobreimpulso>0.35?'warn':'')+figU('pico',barF(T.sopladoPico))+
      fig('turbo al final',num(T.nFin/1000,0),'mil rpm',T.nFin>e.nMax?'bad':'')+fig('descarga al final',num(T.xWGFin*100,0),'%')+
      fig('inercia del eje',num(T.J*1e7,0),'g·cm²');
    q=bandaTr(T,Ts,e);
    el('titA').innerHTML='Pisa a fondo en t = 0<span>línea: el instante de la escena</span>';
    ley('leyA',Ts?[['soplado',CIAN],['motor sano','#5b6f6a','dash'],['descarga 0–100 %',NARANJA,'dash']]:[['soplado',CIAN],['descarga 0–100 %',NARANJA,'dash'],['consigna',WARN_HEX,'dash']]);
    el('titB').innerHTML='Vueltas del eje';
    ley('leyB',[['turbo',VIO],['límite',BAD_HEX,'dash']]);
  }else if(m==='censo'){
    const C=CENSO();
    f=fig('casillas',C.total,'')+fig('con síntoma',C.conAviso,'')+fig('mudas',C.mudo,'','warn')+
      fig('con código',C.conCodigo,'')+fig('fuera de límites',C.peligro,'',C.peligro?'bad':'')+fig('régimen',num(RPM(),0),'rpm');
    q={n:C.mudo>C.conCodigo?'warn':'ok',r:C.mudo+' de '+C.conAviso+' casillas con síntoma son mudas',
      t:'Cada casilla es el motor entero resuelto con esa avería a ese régimen y a plena carga. El diagnóstico de a bordo sólo tiene dos códigos de sobrealimentación, P0299 y P0234, y los dos hablan de PRESIÓN. Ninguna avería que respete la presión y estropee la densidad, la contrapresión o el margen de bombeo tiene forma de aparecer ahí.'};
    el('titA').innerHTML='Avería × régimen<span>número: cambio de par</span>';
    ley('leyA',[['código',AZUL,'area'],['síntoma sin código',WARN_HEX,'area'],['fuera de límites',BAD_HEX,'area']]);
  }
  el('dkFig').innerHTML=f;
  aviso(q.n,q.r); mas('Qué está pasando',q.t);
  pintaLienzos();
}
/* Los lienzos: los del reloj (respuesta y escala) se repintan a 30 Hz. */
function pintaLienzos(){
  if(!G.simUnlocked||G.modo==='reto') return;
  const m=G.modo==='ensamble'?'camino':G.modo, V=EV();
  if(m==='mapa'){ pintaMapa(LA,V); pintaCalor(LB,V); }
  else if(m==='camino'){ pintaEstaciones(LA,V); pintaParCurva(LB,V); }
  else if(m==='intercooler'){ pintaICtam(LA); pintaICgasto(LB,V); }
  else if(m==='respuesta'){ pintaTrSoplado(LA); pintaTrVueltas(LB); }
  else if(m==='censo'){ pintaCenso(LA); }
  // la escena del MISMO instante, no la del último fotograma: tras cambiar de
  // avería, PZ.V todavía es el estado anterior y la leyenda salía atrasada
  if(m!=='censo') pintaEscala(LCo,estadoEscena()||V);
}
function pintaDockVivo(){
  if(G.modo==='respuesta'){ pintaTrSoplado(LA); pintaTrVueltas(LB); pintaEscala(LCo,PZ.V||EV());
    el('tb_tr').textContent='t = '+num(RELOJ.tTr,2)+' s'; }
}
/* El reto: las lecturas compradas, como fichas de taller. */
function pintaRetoDock(){
  const V=retoEv(RETO.falla), n=Object.keys(RETO.medido).length, e=MQ();
  let h='<div class="rc"><div class="rn"><span><b>'+e.nombre+'</b></span></div><div class="rv">'+rpmT(RETO.rpm)+' · plena carga · '+celC(RETO.Tamb)+' · '+met(RETO.alt)+'</div></div>';
  h+='<div class="cnt">'+fig('intentos',RETO.intentos+' / '+MAX_INTENTOS,'',RETO.intentos?'warn':'')+fig('instrumentos',n+' / '+INSTR.length,'')+fig('pistas',RETO.pistas+' / '+MAX_PISTAS,'')+'</div>';
  INSTR.forEach(I=>{ const on=!!RETO.medido[I.k];
    h+='<div class="rc'+(on?' on':'')+'"><div class="rn"><span>'+I.rot+'</span>'+(on?'':'<i>sin medir</i>')+'</div>'+
      (on?'<div class="rv">'+lecturaDe(V,I.k)+'</div><div class="rnota">'+I.nota+'</div>':'')+'</div>'; });
  const vivas=FALLA_KEYS.filter(compatible);
  const q=RETO.veredicto==='ok'
    ? {n:'ok',r:'ACERTASTE: '+FALLAS[RETO.falla].rot.toUpperCase(),
       t:'Con '+n+(n===1?' instrumento. ':' instrumentos. ')+FALLAS[RETO.falla].pista+
         (vivas.length>1?' Ojo: con lo medido todavía cabían '+vivas.length+' averías; acertar entre varias es en parte suerte.':'')}
    : RETO.veredicto==='mal'
    ? {n:'bad',r:'NO: '+FALLAS[RETO.elegido].corto.toUpperCase()+' NO ES',
       t:(compatible(RETO.elegido)?'Con lo que has medido, esa avería todavía cabría, pero también cabe otra: te falta un instrumento que las separe.'
           :'Las lecturas que llevas no encajan con esa avería: compara lo medido con lo que daría.')+' Intentos: '+RETO.intentos+' de '+MAX_INTENTOS+'.'}
    : {n:'warn',r:RETO.aviso?'OTRO MOTOR EN EL BANCO':'MIDE, DESCARTA Y ENTREGA',
       t:(RETO.aviso?RETO.aviso+' ':'')+(n===0?'Todavía no has medido nada. Empieza por el instrumento que creas que más separa las posibilidades.'
         :'Si dos explicaciones siguen empatadas con lo medido, ningún instrumento de los usados las separa: hace falta otro, no repetir el mismo.')};
  h+='<div class="band '+q.n+'"><b>'+q.r+'</b>'+q.t+'</div>';
  if(RETO.veredicto==='ok'){
    h+='<table>'+FALLA_KEYS.map(f=>'<tr><td>'+FALLAS[f].corto+'</td><td style="text-align:right;color:'+(compatible(f)?(RETO.falla===f?'#5ad1e6':'#e8eef6'):'#4e5866')+'">'+(compatible(f)?'cabía':'—')+'</td></tr>').join('')+'</table>';
  }
  el('dkReto').innerHTML=h;
}
// ============================================================ T5b · EL RETO
// Un caso a ciegas: el motor tiene una de las ocho averías —o ninguna—, y hay
// seis instrumentos. Cada uno cuesta lo mismo: una consulta. Lo que se aprende
// no es a adivinar, es CUÁL instrumento separa qué, y cuántos hacen falta.
const INSTR=[
  {k:'tmap', corto:'Escáner', rot:'El escáner (presión y temperatura de colector)',
   nota:'Es literalmente todo lo que el ordenador ve.'},
  {k:'manos', corto:'Manómetros', rot:'Dos manómetros: salida del compresor y colector',
   nota:'Entre esos dos puntos sólo debería estar el intercooler.'},
  {k:'banco', corto:'Rodillos', rot:'El banco de rodillos: par y potencia',
   nota:'Dice cuánto se ha perdido, nunca por qué.'},
  {k:'sonda3', corto:'Sonda T₃', rot:'Sonda antes de la turbina: presión y temperatura',
   nota:'La contrapresión no la mide ningún sensor de serie.'},
  {k:'taco', corto:'Tacómetro', rot:'Tacómetro de turbo y posición de la descarga',
   nota:'Instrumento de banco de pruebas, no de taller.'},
  {k:'mapa', corto:'Mapa', rot:'El punto sobre el mapa del compresor',
   nota:'Márgenes hasta el bombeo y hasta el bloqueo.'},
];
const MAX_INTENTOS=3, MAX_PISTAS=2, MIN_CONSULTAS=2;
const RETO={falla:'sano', alt:0, Tamb:25, octanaje:91, rpm:0,
  medido:{}, elegido:null, veredicto:null, intentos:0, pistas:0, aviso:''};
function retoAmb(){ return {alt:RETO.alt,Tamb:RETO.Tamb,vAire:G.vAire,octanaje:RETO.octanaje}; }
function retoEv(f){
  return memo('r|'+G.maq+'|'+f+'|'+RETO.alt+'|'+RETO.Tamb+'|'+RETO.octanaje+'|'+RETO.rpm,
    ()=>evalua(MQ(),Object.assign({falla:f,rpm:RETO.rpm,carga:1},retoAmb())));
}
// Lo que cada instrumento LEE. Es una firma: dos averías con la misma firma en
// los instrumentos medidos son indistinguibles con esos instrumentos, y eso es
// justo lo que el reto tiene que enseñar.
// La resolución de cada instrumento es la que TIENE, no la del número de coma
// flotante: un manómetro de taller aprecia media décima de bar y un banco de
// rodillos, un par de por ciento. Con la resolución infinita cada avería tenía
// firma única y el primer instrumento resolvía el caso siempre — que es
// exactamente lo contrario de lo que esta práctica quiere enseñar.
function firma(V,k){
  switch(k){
    case 'tmap':  return [Math.round(V.pAdm/5e3), Math.round((V.TAdm-273.15)/5), V.dtc||'—'];
    case 'manos': return [Math.round(V.p2/5e3), Math.round(V.pAdm/5e3)];
    case 'banco': return [Math.round(V.par/8), Math.round(V.pot/4)];
    case 'sonda3':return [Math.round(V.pEsc/1e4), Math.round((V.T3-273.15)/20)];
    case 'taco':  return [Math.round((V.nTurbo||0)/5000), Math.round(V.xWG*10)];
    case 'mapa':  return [Math.round((V.margenBombeo===null?9:V.margenBombeo)*5),
                          Math.round((V.mChokeLinea?V.mCorr/V.mChokeLinea:0)*8)];
    default: return [];
  }
}
function compatible(f){
  const A=retoEv(f), B=retoEv(RETO.falla);
  for(const k of Object.keys(RETO.medido)){
    if(!RETO.medido[k]) continue;
    const a=firma(A,k).join('|'), b=firma(B,k).join('|');
    if(a!==b) return false;
  }
  return true;
}
function armaReto(evita){
  const e=MQ();
  // `evita`: la avería del caso que acaba de agotar sus intentos. El caso nuevo
  // es OTRO, o se aprobaría por eliminación recorriendo las opciones.
  const fs=FALLA_KEYS.filter(k=>k!==evita);
  RETO.falla=fs[Math.floor(Math.random()*fs.length)];
  RETO.alt=ALTS[Math.floor(Math.random()*3)].a;
  RETO.Tamb=[15,25,35][Math.floor(Math.random()*3)];
  RETO.octanaje=e.diesel?91:OCTS[Math.floor(Math.random()*OCTS.length)];
  const regs=regimenes(e);
  RETO.rpm=regs[1+Math.floor(Math.random()*(regs.length-1))].rpm;
  RETO.medido={}; RETO.elegido=null; RETO.veredicto=null; RETO.intentos=0; RETO.pistas=0; RETO.aviso='';
  invalida();
}
function mide(k){
  if(G.modo!=='reto'||RETO.veredicto==='ok') return;
  RETO.medido[k]=true; RETO.veredicto=null; RETO.aviso=''; pinta();
}
function eligeFalla(k){ RETO.elegido=k; pinta(); }
function entrega(){
  if(!RETO.elegido||G.modo!=='reto') return;
  if(RETO.veredicto==='ok') return;                 // este caso ya está resuelto
  RETO.intentos++;
  const ok=RETO.elegido===RETO.falla;
  RETO.veredicto=ok?'ok':'mal';
  RETO.aviso='';
  if(ok){
    G.resuelto=true; synth.beep(523,0.10,0.05); setTimeout(()=>synth.beep(784,0.14,0.05),130);
  }else{
    synth.beep(190,0.16,0.06);
    if(RETO.intentos>=MAX_INTENTOS){
      // Tres fallos: el motor se va y llega otro con otra avería. Sin esto, tres
      // opciones descartadas a tiro equivalen a una aprobada por eliminación.
      armaReto(RETO.falla);
      RETO.aviso='Tres intentos fallidos: ese motor se ha ido y ha llegado otro, con otra avería.';
      showToast('<b>'+RETO.aviso+'</b>',4200);
    }
  }
  pinta(); reporta();
}
function lecturaDe(V,k){
  switch(k){
    case 'tmap':  return 'colector '+barA(V.pAdm)+'  ·  admisión '+cel(V.TAdm)+'  ·  código '+(V.dtc||'ninguno');
    case 'manos': return 'salida del compresor '+barA(V.p2)+'  ·  colector '+barA(V.pAdm)+
                         '  ·  entre ellos '+num((V.p2-V.pAdm)/1e3,1)+NBSP+'kPa';
    case 'banco': return 'par '+nm(V.par,1)+'  ·  potencia '+kw(V.pot,1)+'  ·  pme '+barF(pmeDe(V.par,MQ().cilindrada),1);
    case 'sonda3':return 'antes de la turbina '+barA(V.pEsc)+' y '+cel(V.T3)+
                         '  ·  sobre el colector '+num((V.pEsc-V.pAdm)/1e3,1)+NBSP+'kPa';
    case 'taco':  return 'turbo '+(V.nTurbo===null?'—':rpmT(V.nTurbo))+'  ·  descarga '+pcc(V.xWG*100)+
                         (V.forzada?'  ·  actuador '+V.forzada:'');
    case 'mapa':  return 'margen de bombeo '+(V.margenBombeo===null?'—':pcc(V.margenBombeo*100))+
                         '  ·  del bloqueo '+(V.mChokeLinea?pcc((1-V.mCorr/V.mChokeLinea)*100):'—');
    default: return '';
  }
}

// =========================================== T8 · MANDOS, TELEMETRÍA Y MODOS
const MODES=['ensamble','mapa','camino','intercooler','respuesta','censo','reto'];
let AMB_ABIERTO=false;
document.addEventListener('toggle',ev=>{ if(ev.target&&ev.target.id==='dAmb') AMB_ABIERTO=ev.target.open; },true);
function pintaHUD(){
  const m=MODE_META[G.modo]||MODE_META.ensamble;
  el('hudTit').textContent=m[1];
  el('hudIntro').textContent=G.modo==='ensamble'&&G.simUnlocked?HUD_TXT.ensambleListo:HUD_TXT[G.modo];
}
function fila(rot,attr,ops,cur,porFila){
  const pf=porFila||4, filas=Math.max(1,Math.ceil(ops.length/pf));
  let h='<div class="gl"><span>'+rot+'</span></div>';
  let i=0;
  for(let f=0;f<filas;f++){
    const n=Math.ceil((ops.length-i)/(filas-f));
    h+='<div class="modebar">'+ops.slice(i,i+n).map(o=>
      '<button class="b'+(String(o[0])===String(cur)?' on':'')+'" '+attr+'="'+o[0]+'">'+o[1]+'</button>').join('')+'</div>';
    i+=n;
  }
  return h;
}
function syncCtrl(){
  const ciego=(G.modo==='reto'), e=MQ();
  // Los modos se ofrecen SIEMPRE, pero cerrados hasta que el camino del aire
  // esté completo: esconderlos haría creer que no existen.
  const dis=m=>(m!=='ensamble'&&!G.simUnlocked)?' disabled':'';
  const bm=m=>'<button class="b'+(G.modo===m?' on':'')+'"'+dis(m)+' data-mode="'+m+'" title="Tecla '+(MODES.indexOf(m)+1)+'">'+MODE_META[m][0]+'</button>';
  let h='<div class="modebar">'+MODES.slice(0,4).map(bm).join('')+'</div><div class="modebar">'+MODES.slice(4).map(bm).join('')+'</div>';
  h+=fila('Vehículo','data-maq',ARQ_KEYS.map(k=>[k,ARQ[k].corto]),G.maq);
  if(G.modo==='ensamble'){
    h+='<div class="modebar"><button class="b" id="btnMonta">Montar solo</button><button class="b" id="btnDesmonta">Desmontar</button></div>';
  }
  if(!ciego&&G.simUnlocked){
    h+='<div class="gl"><span>Qué le pasa</span></div><select id="selFalla" class="sel">'+
      FALLA_KEYS.map(k=>'<option value="'+k+'"'+(k===G.falla?' selected':'')+'>'+FALLAS[k].corto+'</option>').join('')+'</select>';
    const regs=regimenes(e);
    h+=fila('Régimen (rpm), plena carga','data-rpm',regs.map(R=>[String(R.rpm),num(R.rpm,0)]),String(RPM()),5);
    h+='<details id="dAmb"'+(AMB_ABIERTO?' open':'')+'><summary>Ambiente: '+met(G.alt)+' · '+celC(G.Tamb)+' · '+kmh(G.vAire)+(e.diesel?'':' · '+G.octanaje+' oct')+'</summary><div class="cuerpo">'+
      fila('Altitud','data-alt',ALTS.map(A=>[String(A.a),num(A.a,0)+' m']),String(G.alt),5)+
      fila('Aire','data-tamb',[['5','5 °C'],['25','25 °C'],['40','40 °C']],String(G.Tamb))+
      fila('Marcha del coche','data-vaire',[['20','20 km/h'],['60','60 km/h'],['110','110 km/h']],String(G.vAire))+
      (e.diesel?'':fila('Octanaje','data-oct',OCTS.map(o=>[String(o),String(o)]),String(G.octanaje)))+
      '</div></details>';
  }
  el('ctrl').innerHTML=h;
  el('secEns').style.display=(G.modo==='ensamble'&&!G.simUnlocked)?'':'none';
  el('retobox').style.display=ciego?'block':'none';
  if(ciego){
    el('instrreto').innerHTML=INSTR.map(i=>
      '<button class="b dx'+(RETO.medido[i.k]?' on':'')+'" data-inst="'+i.k+'" title="'+i.rot+'">'+i.corto+'</button>').join('');
    el('dxreto').innerHTML=FALLA_KEYS.map(k=>{
      const cls=RETO.veredicto===null
        ? (RETO.elegido===k?' on':'')
        : (RETO.veredicto==='ok'&&k===RETO.falla?' right':(RETO.veredicto==='mal'&&k===RETO.elegido?' wrong':''));
      return '<button class="b dx'+cls+'" data-dx="'+k+'">'+FALLAS[k].corto+'</button>';
    }).join('');
  }
}
/* La lista del montaje: lo que falta, lo que está y lo que está elegido. */
function pintaEstadoEnsamble(){
  const c=el('checklist'); if(!c) return;
  c.innerHTML=ORDEN.map((k,i)=>{ const on=ASM.done.has(k), sel=ASM.sel===k, lock=!on&&falta(k).length>0;
    return '<span class="it'+(on?' ok':'')+(sel?' sel':'')+(lock?' lock':'')+'" data-pieza="'+k+'" title="'+PART[k].fn+'">'+
      (on?'✔ ':(i+1)+' · ')+PART[k].rot.replace('Sensor de presión y temperatura','Sensor de colector')+'</span>'; }).join('');
}

// ----------------------------------------------------------------- telemetría
const glf=(l,v,c)=>'<div class="g"><div class="gl"><span>'+l+'</span><b'+(c?' class="'+c+'"':'')+'>'+v+'</b></div></div>';
function pintaTele(){
  const e=MQ();
  let h='';
  if(!G.simUnlocked){
    h+=glf('Piezas montadas',ASM.done.size+' / '+PARTS.length,ASM.done.size===PARTS.length?'good':'warn');
    h+=glf('Siguiente',(PARTS.find(p=>!ASM.done.has(p.k))||{rot:'—'}).rot);
    el('tele').innerHTML=h; return;
  }
  if(G.modo==='reto'){
    const V=retoEv(RETO.falla), M=RETO.medido;
    h+=glf('Motor',e.corto+' · '+num(e.cilindrada,1)+' L');
    h+=glf('Ambiente',celC(RETO.Tamb)+' · '+met(RETO.alt));
    h+=glf('Régimen del ensayo',rpmT(RETO.rpm));
    if(M.tmap){ h+=glf('Colector',barA(V.pAdm)); h+=glf('Admisión',cel(V.TAdm));
      h+=glf('Código',V.dtc||'ninguno',V.dtc?'bad':'good'); }
    if(M.banco){ h+=glf('Par',nm(V.par,1)); h+=glf('Potencia',kw(V.pot,1)); }
    if(M.manos) h+=glf('Salida del compresor',barA(V.p2));
    if(M.sonda3){ h+=glf('Antes de la turbina',barA(V.pEsc)); h+=glf('Temperatura ahí',cel(V.T3)); }
    if(M.taco){ h+=glf('Vueltas del turbo',V.nTurbo===null?'—':rpmT(V.nTurbo));
      h+=glf('Descarga',pcc(V.xWG*100)); }
    if(M.mapa) h+=glf('Margen de bombeo',V.margenBombeo===null?'—':pcc(V.margenBombeo*100));
    h+=glf('Instrumentos usados',Object.keys(M).length+' de '+INSTR.length);
    h+=glf('Intentos',RETO.intentos+' de '+MAX_INTENTOS,RETO.intentos?'warn':'');
    h+=glf('Pistas',RETO.pistas+' de '+MAX_PISTAS);
    el('tele').innerHTML=h; return;
  }
  const V=EV(), q=veredicto();
  h+=glf('Soplado',barF(V.soplado),V.sobrePresion?'bad':'');
  h+=glf('Colector',barA(V.pAdm));
  h+=glf('Admisión',cel(V.TAdm),V.TAdm>340?'warn':'');
  h+=glf('Densidad',rhoF(V.rhoAdm));
  h+=glf('Par',nm(V.par,1),V.perdida>0.15?'bad':(V.perdida>0.05?'warn':''));
  h+=glf('Potencia',kw(V.pot,1));
  h+=glf('Vueltas del turbo',V.nTurbo===null?'—':rpmT(V.nTurbo),V.sobreVel?'bad':'');
  h+=glf('Descarga abierta',pcc(V.xWG*100));
  h+=glf('Antes de la turbina',barA(V.pEsc)+' · '+cel(V.T3),V.sobreT3?'bad':'');
  h+=glf('Margen de bombeo',V.margenBombeo===null?'—':pcc(V.margenBombeo*100),
    V.bombeo?'bad':(V.margenBombeo!==null&&V.margenBombeo<0.15?'warn':''));
  h+=glf('Código del ordenador',V.dtc||'ninguno',V.dtc?'bad':'good');
  h+=glf('Veredicto',q.rot,q.nivel==='bad'?'bad':(q.nivel==='warn'?'warn':'good'));
  el('tele').innerHTML=h;
}
function pintaInforme(){
  const e=MQ();
  if(!G.simUnlocked){
    el('report').innerHTML='<span class="mono">Faltan '+(PARTS.length-ASM.done.size)+
      ' piezas.</span> Toca una pieza del tapete y después su hueco luminoso. '+
      'Sin las siete no hay camino del aire, y sin camino no hay nada que medir.';
    return;
  }
  if(G.modo==='reto'){
    const W=retoEv(RETO.falla);
    let h='<b>'+e.nombre+'</b>, a '+rpmT(RETO.rpm)+' y plena carga, '+celC(RETO.Tamb)+' y '+met(RETO.alt)+'. ';
    // La queja del cliente delata la familia de la avería (silbido, aleteo,
    // «no tira»): sólo se conoce al ver el par en el banco, no gratis.
    h+=RETO.medido.banco?'El cliente dice: '+queja(W)+'. ':'El cliente no sabe decir qué le pasa. ';
    h+='Intentos: '+RETO.intentos+'/'+MAX_INTENTOS+' · pistas: '+RETO.pistas+'/'+MAX_PISTAS+'. ';
    if(RETO.aviso) h+='<span class="warn">'+RETO.aviso+'</span> ';
    if(RETO.veredicto==='ok') h+='<b class="good">Dictamen correcto:</b> era '+FALLAS[RETO.falla].rot+'.';
    else if(RETO.veredicto==='mal') h+='<b class="bad">No es esa.</b> '+(compatible(RETO.elegido)
      ?'Con lo medido cabría, pero también cabe otra: falta un instrumento que las separe.'
      :'Lo medido no encaja con esa avería.');
    else h+='Pide instrumentos y dictamina. Ninguno de ellos ve el motor entero. La escena enseña el motor sano salvo lo que ya has medido.';
    el('report').innerHTML=h; return;
  }
  const V=EV();
  let h='<b>'+e.nombre+'.</b> ';
  h+=G.falla==='sano'?'Sin avería, ':FL().rot+', ';
  h+='a '+rpmT(V.rpm)+' y plena carga. ';
  if(V.sobreVel||V.sobrePresion)
    h+='<b class="bad">El turbo está fuera de sus límites:</b> '+rpmT(V.nTurbo)+' contra '+rpmT(e.nMax)+
      ' y '+barF(V.soplado)+' de soplado contra un máximo de '+barF(e.sopladoMax)+'.';
  else if(V.detona)
    h+='<b class="bad">Detona:</b> la mezcla llega a '+kel(V.Tcomp)+' al final de la compresión y con '+
      G.octanaje+' octanos el umbral está en '+kel(V.Tdet)+'.';
  else if(V.bombeo)
    h+='<b class="bad">El compresor bombea:</b> el punto está a la izquierda de la línea de bombeo, con '+
      kgs(V.mCorr)+' de gasto corregido contra los '+kgs(V.mBombeoLinea)+' que esa relación de presiones exige.';
  else if(V.limitadoDeton)
    h+='<b class="warn">El control de picado está recortando:</b> la consigna era '+barF(e.sopladoObj)+
      ' y sólo se dan '+barF(V.soplado)+'. Con eso el par cae '+pcc(V.perdida*100,1)+' y no hay código.';
  else if(V.perdida>0.08&&!V.dtc)
    h+='<b class="warn">Pierde '+pcc(V.perdida*100,1)+' de par y el ordenador no dice nada:</b> la presión de '+
      'colector sigue en '+barA(V.pAdm)+', que es lo único que él mide.';
  else if(V.dtc)
    h+='El ordenador declara <b class="bad">'+V.dtc+'</b> y el par cae '+pcc(V.perdida*100,1)+'.';
  else
    h+='Todo en su sitio: '+barF(V.soplado)+' de soplado, aire a '+cel(V.TAdm)+', '+nm(V.par,1)+' de par y el turbo a '+
      rpmT(V.nTurbo)+' con la descarga abierta el '+pcc(V.xWG*100)+'.';
  el('report').innerHTML=h;
}
function queja(V){
  if(V.sobreVel||V.sobrePresion) return '«silba muchísimo y me da miedo»';
  if(V.detona) return '«pica cuando lo estiro»';
  if(V.bombeo) return '«hace un ruido raro, como un aleteo»';
  if(V.perdida>0.28) return '«no tira de nada»';
  if(V.perdida>0.12) return '«le falta fuerza»';
  if(V.perdida>0.05) return '«lo noto un poco flojo»';
  if(V.dtc) return '«se encendió el testigo»';
  return '«vengo a la revisión»';
}

function pinta(){
  document.body.classList.toggle('enEnsamble',G.modo==='ensamble'&&!G.simUnlocked);
  document.body.classList.toggle('enReto',G.modo==='reto');
  pintaHUD(); syncCtrl(); pintaEstadoEnsamble(); pintaTele(); pintaInforme(); pintaPregunta(); pintaBarras(); pintaRotulos();
  pintaDock();
}
function afterEdit(){ invalida(); pinta(); }
function cambiaMaquina(k){
  if(!ARQ[k]) return;
  G.maq=k; G.resuelto=false; G.rpm=null; invalida();
  levantaMotor();
  if(G.simUnlocked) montaKit(); else initAssembly();
  reiniciaParticulas();
  if(G.modo==='reto') armaReto();
  afterEdit(); refrescaPregunta();
  ponVista(VISTA.actual,0.9);
}
function setMode(m){
  if(!MODE_META[m]) return;
  if(m!=='ensamble'&&!G.simUnlocked){
    showToast('<b>Primero hay que montar el camino del aire.</b> Faltan '+(PARTS.length-ASM.done.size)+' piezas.',3000);
    return;
  }
  const entro=(m==='reto'&&G.modo!=='reto');
  G.modo=m;
  if(entro) armaReto();
  if(m==='respuesta'){ RELOJ.tTr=0; RELOJ.espera=0; }
  invalida(); pinta(); refrescaPregunta();
  ponVista(m==='ensamble'?(G.simUnlocked?'conjunto':'banco'):VISTA_DE[m]);
}
// ============================== T8 · CUESTIONARIO, RECORRIDO Y ARRANQUE
function pistaReto(){
  if(G.modo!=='reto') return;
  if(RETO.pistas>=MAX_PISTAS){
    showToast('<b>No quedan más pistas en este caso.</b><br>Lo que falta lo decide lo que midas.',3000); return; }
  // Dos pistas graduadas que orientan sobre CÓMO leer los instrumentos y no
  // nombran ninguna avería ni describen la oculta.
  const P=[
    'El escáner sólo ve la presión absoluta de colector y la temperatura de admisión. Lo que no pase por ahí hay que ir a buscarlo con otro instrumento.',
    'Compara pares de lecturas: la presión a la salida del compresor contra la del colector, la contrapresión contra el soplado, el par contra lo que esa presión haría esperar.',
  ];
  const i=RETO.pistas++;
  showToast('<b>Pista '+RETO.pistas+' de '+MAX_PISTAS+'</b><br>'+P[i],5600);
  pinta();
}
function otroMotor(){ paraAuto(); armaReto(); refrescaPregunta(); pinta(); }
function barajaEn(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t;
  }
  return a;
}
let QCACHE=null, QI=0, QSEL=null;
// Las preguntas se DERIVAN del estado: cambiar de motor, de avería o de altitud
// las rehace con las cifras nuevas. Ninguna respuesta está escrita a mano.
function preguntas(){
  const e=MQ();
  if(!G.simUnlocked) return [];
  const V=EV_DE('sano',RPM(),G.carga), sin=EV_DE('sinIC',RPM(),G.carga), C=CURVA('sano');
  const alto=evalua(e,Object.assign({falla:'sano',rpm:RPM(),carga:1},AMB(),{alt:2660}));
  const llano=evalua(e,Object.assign({falla:'sano',rpm:RPM(),carga:1},AMB(),{alt:0}));
  // La descarga pegada CERRADA se pregunta en un régimen donde el eje de verdad
  // se pasa de vueltas: a bajo régimen y en altura el mapa ni siquiera tiene
  // solución (nTurbo nulo) y la pregunta saldría con «—» en lugar de cifras.
  let wgP=EV_DE('wgPegada',RPM(),1);
  if(wgP.nTurbo===null||wgP.nTurbo<=e.nMax){
    const alt2=regimenes(e).map(R=>EV_DE('wgPegada',R.rpm,1)).reverse()
      .find(v=>v.nTurbo!==null&&v.nTurbo>e.nMax);
    if(alt2) wgP=alt2;
  }
  const pasaVueltas=wgP.nTurbo!==null&&wgP.nTurbo>e.nMax;
  const cen=CENSO();
  const Q=[];
  const mismaP=Math.abs(sin.pAdm/V.pAdm-1)<0.05;      // diésel: el intercooler no cambia la presión
  if(mismaP){
    Q.push({t:'Sin intercooler, la presión en el colector de este motor pasa de '+barA(V.pAdm)+' a '+barA(sin.pAdm)+
        ', o sea prácticamente la misma, y sin embargo el par pasa de '+nm(V.par,0)+' a '+nm(sin.par,0)+'. ¿Por qué?',
      ops:[['Porque la DENSIDAD es presión entre temperatura, y el aire pasa de '+cel(V.TAdm)+' a '+cel(sin.TAdm),true],
        ['Porque el intercooler también comprime el aire, y al quitarlo se pierde esa parte',false],
        ['Porque sin intercooler el turbo gira menos y el compresor da menos aire',false],
        ['Porque el ordenador da un código y corta la potencia para proteger el motor',false]]});
  }else{
    Q.push({t:'Sin intercooler, la presión en el colector de este motor de gasolina baja de '+barA(V.pAdm)+' a '+barA(sin.pAdm)+
        ' y el par pasa de '+nm(V.par,0)+' a '+nm(sin.par,0)+'. ¿Por qué?',
      ops:[['Porque el aire entra a '+cel(sin.TAdm)+' y no a '+cel(V.TAdm)+', y el control de picado baja la consigna para que no detone',true],
        ['Porque el intercooler también comprime el aire, y al quitarlo se pierde esa parte de la presión',false],
        ['Porque sin intercooler el turbo gira menos y el compresor ya no da la presión de antes',false],
        ['Porque el ordenador detecta que falta el intercooler, da un código y corta la presión',false]]});
  }
  Q.push({t:'Subiendo de 0 a 2 660 m, la presión ambiente baja de '+barA(llano.pAmb)+' a '+barA(alto.pAmb)+
      '. ¿Qué le pasa a este motor?',
    ops:[['Mantiene '+barA(alto.pAdm)+' en el colector y pierde sólo '+pcc((1-alto.par/llano.par)*100,1)+
        ' de par, pero el turbo sube a '+rpmT(alto.nTurbo),true],
      ['Pierde presión de colector en la misma proporción que baja el ambiente, y el par con ella',false],
      ['No cambia nada: el turbo compensa la altura sin coste alguno para el motor ni para el eje',false],
      ['Pierde un 30 % de par, como un motor atmosférico, porque el turbo no puede compensar',false]]});
  if(pasaVueltas){
    Q.push({t:'La válvula de descarga se queda pegada CERRADA. A '+rpmT(wgP.rpm)+' el soplado sube a '+barF(wgP.soplado)+
        ' y el turbo a '+rpmT(wgP.nTurbo)+'. ¿Qué es lo grave?',
      ops:[['Que '+rpmT(wgP.nTurbo)+' pasa de las '+rpmT(e.nMax)+' que el turbo aguanta',true],
        ['Que el par sube demasiado y eso rompe la caja de cambios antes que el turbo',false],
        ['Que el ordenador no puede leer la presión y pierde el control del motor',false],
        ['Nada grave: con más presión el motor siempre da más potencia y va mejor',false]]});
  }else{
    Q.push({t:'La válvula de descarga se queda pegada CERRADA. A '+rpmT(wgP.rpm)+' el soplado sube a '+barF(wgP.soplado)+
        ', y el máximo del sistema es '+barF(e.sopladoMax)+'. ¿Qué es lo grave?',
      ops:[['Que el soplado pasa del máximo que el sistema aguanta y nada lo frena',wgP.soplado>e.sopladoMax],
        ['Que el par sube demasiado y eso rompe la caja de cambios antes que el turbo',false],
        ['Que el ordenador no puede leer la presión y pierde el control del motor',false],
        ['Nada grave: con más presión el motor siempre da más potencia y va mejor',false]]});
  }
  Q.push({t:'De las '+cen.total+' casillas del censo, '+cen.conAviso+' tienen síntoma. ¿Cuántas de ésas NO producen ningún código?',
    ops:[[String(cen.mudo)+' casillas',true],['ninguna: todo síntoma da código',false],
      [String(Math.max(0,cen.mudo-4))+' casillas',false],[String(cen.conAviso)+': ninguna da código',false]]});
  Q.push({t:'¿Qué mide de verdad el sensor que el ordenador usa para controlar el turbo?',
    ops:[['Presión absoluta de colector y temperatura de admisión, y nada más',true],
      ['El gasto de aire que pasa por el compresor y las vueltas del turbo',false],
      ['La contrapresión de escape que hay delante de la turbina del turbo',false],
      ['El margen que queda hasta el bombeo en el mapa del compresor',false]]});
  Q.push({t:'El par máximo de este motor sale a '+rpmT(C.parMax.rpm)+' y no más abajo. ¿Por qué justo ahí?',
    ops:[['Porque es el primer régimen en el que la turbina reúne la potencia que el compresor pide para la consigna',true],
      ['Porque es el régimen en el que el ordenador abre la mariposa del todo para dejar pasar el aire',false],
      ['Porque es el régimen en el que el rendimiento volumétrico del motor llega a su máximo absoluto',false],
      ['Porque es el régimen que el fabricante declara en la ficha, y el motor se calibra para él',false]]});
  return Q;
}
function bancoQ(){
  if(!QCACHE){ QCACHE=preguntas();
    QCACHE.forEach(q=>{ q.baraja=barajaEn(q.ops.map(o=>({o:o}))); }); }
  return QCACHE;
}
function refrescaPregunta(){ QCACHE=null; QI=0; QSEL=null; pintaPregunta(); }
function pintaPregunta(){
  // Sin camino del aire NO hay preguntas, y el banco en caché no se entera: al
  // desmontar, `pinta()` volvía a pintar las preguntas del motor que acababa de
  // desaparecer, porque QCACHE seguía lleno y sólo `refrescaPregunta()` lo vacía.
  // La condición de verdad es el mode-lock, así que se pregunta por él aquí y
  // no por el camino que haya llegado hasta esta función.
  const B=G.simUnlocked?bancoQ():[]; if(!B.length){ el('quiz').innerHTML=
    '<div class="lt">Las preguntas se abren cuando el camino del aire está montado.</div>'; return; }
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

// ------------------------------------------------------------ recorrido guiado
let AUTO=null, SNAP=null;
// El recorrido es una DEMOSTRACIÓN: al terminar o al cancelarse devuelve el
// banco y el reto al estado exacto en que estaban (vehículo, avería, ambiente,
// caso a ciegas con sus instrumentos, intentos y pistas) y jamás toca el reto
// ni el éxito ya conseguido.
function restauraAuto(){
  const sn=SNAP; SNAP=null; if(!sn) return;
  if(G.maq!==sn.g.maq) cambiaMaquina(sn.g.maq);
  Object.assign(G,sn.g);
  Object.assign(RETO,sn.reto,{medido:{...sn.reto.medido}});
  invalida();
  setMode(G.modo);
  pinta(); refrescaPregunta();
}
function paraAuto(){ if(AUTO){ clearTimeout(AUTO); AUTO=null; }
  const b=el('btnAuto'); if(b) b.disabled=false;
  restauraAuto(); }
function runAuto(){
  paraAuto();
  SNAP={g:{modo:G.modo, maq:G.maq, falla:G.falla, alt:G.alt, Tamb:G.Tamb, vAire:G.vAire,
      octanaje:G.octanaje, rpm:G.rpm, carga:G.carga, resuelto:G.resuelto},
    reto:{...RETO, medido:{...RETO.medido}}};
  el('btnAuto').disabled=true;
  const pasos=[];
  let espera=3900;
  if(ASM.done.size<PARTS.length){
    pasos.push(()=>{ setMode('ensamble');
      showToast('<b>1 · Montaje.</b> Siete piezas y un camino: filtro, compresor, intercooler, mariposa, motor, turbina y descarga.',3400); });
    pasos.push(()=>{ autoAssemble(); });
    espera=PARTS.length*640+1800;
  }
  const resto=[
    ()=>{ G.maq='gas14t'; G.falla='sano'; G.alt=0; G.Tamb=25; G.octanaje=91; G.rpm=null;
      cambiaMaquina('gas14t'); setMode('mapa');
      showToast('<b>El mapa</b><br>La línea naranja es dónde vive este motor a plena carga. A su izquierda está el bombeo; a su derecha, el bloqueo.',4200); },
    ()=>{ setMode('camino');
      showToast('<b>Las seis estaciones</b><br>Fíjate en la temperatura: sube en el compresor, baja en el intercooler y se dispara en la combustión.',4200); },
    ()=>{ setMode('intercooler');
      showToast('<b>Enfría y estorba</b><br>El par contra el tamaño del intercooler tiene un máximo interior. Más grande no es mejor.',4200); },
    ()=>{ G.falla='sinIC'; afterEdit(); refrescaPregunta();
      showToast('<b>Sin intercooler</b><br>El compresor sopla lo mismo, pero el aire llega caliente. En gasolina el control de picado baja la consigna para no detonar: menos presión de colector y un tercio menos de par, sin código.',5200); },
    ()=>{ G.falla='sano'; G.alt=2660; afterEdit(); refrescaPregunta(); setMode('mapa');
      showToast('<b>A 2 660 metros</b><br>El turbo mantiene la presión de colector, pero para conseguirlo se va a sus vueltas máximas.',4600); },
    ()=>{ G.alt=0; G.falla='wgPegada'; afterEdit(); refrescaPregunta(); setMode('respuesta');
      showToast('<b>La descarga pegada cerrada</b><br>Nada frena al eje. El sobreimpulso ya no se corta y el turbo pasa de sus vueltas.',4600); },
    ()=>{ G.falla='turboGastado'; afterEdit(); refrescaPregunta();
      showToast('<b>Un turbo gastado</b><br>Mismo motor, mismo régimen: tarda varias veces más en soplar y el ordenador no tiene nada que declarar.',4600); },
    ()=>{ G.maq='die20t'; cambiaMaquina('die20t'); G.falla='sinIC'; afterEdit(); refrescaPregunta();
      setMode('intercooler');
      showToast('<b>Y en diésel</b><br>Aquí no hay detonación que valga, así que se queda con toda la presión y pierde sólo densidad. Compara los dos casos.',4800); },
    ()=>{ G.falla='sano'; afterEdit(); setMode('censo');
      showToast('<b>Cuarenta y cinco casillas</b><br>Cuenta las ámbar: hay síntoma y el ordenador está mudo. Ésa es la razón de que el manómetro siga existiendo.',4800); },
    ()=>{ setMode('reto');
      showToast('<b>Ahora tú</b><br>Un motor, ningún dato. Pide instrumentos y dictamina; esta demostración no puntúa.',4200); },
  ];
  const todos=pasos.concat(resto);
  let i=0;
  const tic=()=>{ if(i>=todos.length){ paraAuto(); return; }
    const primera=(i===0&&pasos.length>0);
    todos[i++]();
    AUTO=setTimeout(tic, (i===2&&pasos.length>0)?espera:(primera?1200:3900)); };
  tic();
}


// ------------------------------------------------------------------- sucesos
// Un ÚNICO despachador delegado. Nada de onclick en el HTML generado: el cuerpo
// del laboratorio va dentro de un <script type="module"> y sus funciones no
// existen en el ámbito global, así que un onclick inline no encuentra nada.
document.addEventListener('change',ev=>{
  const t=ev.target; if(!t||t.id!=='selFalla') return;
  paraAuto(); G.falla=t.value; G.resuelto=false; afterEdit(); refrescaPregunta();
});
document.addEventListener('click',ev=>{
  const it=ev.target.closest('[data-pieza]');
  if(it){ if(G.modo==='ensamble'&&!G.simUnlocked) selPieza(it.dataset.pieza); return; }
  const b=ev.target.closest('button'); if(!b||b.disabled) return;
  const id=b.id;
  if(id==='btnAuto'){ runAuto(); return; }
  if(id==='btnPista'){ pistaReto(); return; }
  if(id==='btnEntrega'){ entregaConAviso(); return; }
  if(id==='btnOtro'){ otroMotor(); return; }
  if(id==='btnMonta'){ paraAuto(); autoAssemble(); return; }
  if(id==='btnDesmonta'){ paraAuto(); initAssembly(); afterEdit(); ponVista('banco'); return; }
  if(id==='tb_play'){ RELOJ.pausa=!RELOJ.pausa; pintaBarras(); return; }
  if(id==='tb_re'){ RELOJ.tTr=0; RELOJ.espera=0; return; }
  if(id==='tb_rot'){ ROT.on=!ROT.on; pintaRotulos(); pintaBarras(); return; }
  if(id==='tb_cal'){ CAL.nivel=calAlta()?'media':'alta'; CAL.motivo='elegida a mano'; aplicaCalidad(); reiniciaParticulas(); pintaBarras(); return; }
  if(b.dataset.vista){ ponVista(b.dataset.vista); return; }
  if(b.dataset.mode){ paraAuto(); setMode(b.dataset.mode); return; }
  if(b.dataset.maq){ paraAuto(); cambiaMaquina(b.dataset.maq); return; }
  if(b.dataset.falla){ paraAuto(); G.falla=b.dataset.falla; G.resuelto=false;
    afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.rpm){ paraAuto(); G.rpm=Number(b.dataset.rpm); afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.alt){ paraAuto(); G.alt=Number(b.dataset.alt); afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.tamb){ paraAuto(); G.Tamb=Number(b.dataset.tamb); afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.vaire){ paraAuto(); G.vAire=Number(b.dataset.vaire); afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.oct){ paraAuto(); G.octanaje=Number(b.dataset.oct); afterEdit(); refrescaPregunta(); return; }
  if(b.dataset.inst){ paraAuto(); mide(b.dataset.inst); return; }
  if(b.dataset.dx){ eligeFalla(b.dataset.dx); return; }
  if(b.dataset.q!==undefined){ pregunta(Number(b.dataset.q)); return; }
  if(b.dataset.qnext){ QI++; QSEL=null; pintaPregunta(); return; }
});
function entregaConAviso(){
  if(!RETO.elegido){
    showToast('<b>Elige primero qué tiene el motor</b><br>El dictamen es la parte que se corrige.',3200);
    return;
  }
  if(Object.keys(RETO.medido).length<MIN_CONSULTAS){
    showToast('<b>Con menos de '+MIN_CONSULTAS+' instrumentos es corazonada, no diagnóstico</b><br>Pide al menos '+MIN_CONSULTAS+' antes de dictaminar.',3600);
    return;
  }
  entrega();
}
document.addEventListener('keydown',ev=>{
  if(ev.target&&/^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
  if(ev.code==='Space'&&G.simUnlocked&&G.modo!=='reto'){ ev.preventDefault(); RELOJ.pausa=!RELOJ.pausa; pintaBarras(); return; }
  const i=Number(ev.key);
  if(i>=1&&i<=MODES.length){ paraAuto(); setMode(MODES[i-1]); }
});
const soundBtn=el('soundBtn');
if(soundBtn) soundBtn.onclick=()=>{ const on=synth.toggle(); soundBtn.textContent=on?'🔊':'🔇'; soundBtn.classList.toggle('on',on); };
addEventListener('resize',()=>{ colocaBarras(); clearTimeout(window.__rzTurbo);
  window.__rzTurbo=setTimeout(()=>{ ponVista(VISTA.actual,0.01); pintaDock(); },140); });

// ------------------------------------------------------------------- el puente
function reporta(){
  if(typeof window.__labReporta==='function'){
    try{ window.__labReporta({resuelto:G.resuelto}); }catch(e){}
  }
}

// ------------------------------------------------------------------- depuración
// Superficie mínima y estable para la Capa 2. Todo lo que publica sale del motor
// sellado por el mismo camino que la pantalla.
window.__labDebug={
  get mode(){ return G.modo; },
  get solved(){ return G.resuelto; },
  get maquina(){ return G.maq; },
  get falla(){ return G.falla; },
  get simUnlocked(){ return G.simUnlocked; },
  get montadas(){ return ASM.done.size; },
  get piezas(){ return PARTS.length; },
  get frames(){ return PINTADAS; },
  get amb(){ return {alt:G.alt, Tamb:G.Tamb, octanaje:G.octanaje, vAire:G.vAire, rpm:RPM(), carga:G.carga}; },
  get maq(){ const e=MQ(); return {key:e.key, corto:e.corto, nombre:e.nombre,
    cilindrada:e.cilindrada, cil:e.cil, rc:e.rc, diesel:e.diesel,
    sopladoObj:e.sopladoObj, sopladoMax:e.sopladoMax, nMax:e.nMax,
    mChoke:e.mChoke, piMax:e.piMax, etaMax:e.etaMax, cBombeo:e.cBombeo,
    aTurbina:e.aTurbina, aWastegate:e.aWastegate, rpmPar:e.rpmPar, rpmMax:e.rpmMax,
    icNTU:e.icNTU, icDp:e.icDp, T3Max:e.T3Max, afr:e.afr, inerciaEje:e.inerciaEje}; },
  lect(f,rpm,carga){
    const V=evalua(MQ(),Object.assign({falla:f||G.falla, rpm:rpm===undefined?RPM():rpm,
      carga:carga===undefined?G.carga:carga},AMB()));
    return {soplado:V.soplado, p2:V.p2, pAdm:V.pAdm, p1:V.p1, pAmb:V.pAmb,
      T2:V.T2, TAdm:V.TAdm, T3:V.T3, Tamb:V.Tamb, eps:V.eps,
      pi:V.pi, m:V.m, mCorr:V.mCorr, u:V.u, nTurbo:V.nTurbo, xWG:V.xWG,
      pEsc:V.pEsc, Pc:V.Pc, Pt:V.Pt, par:V.par, pot:V.pot, rhoAdm:V.rhoAdm,
      rhoSinIC:V.rhoSinIC, masaPorCiclo:V.masaPorCiclo, Wbomb:V.Wbomb,
      Tcomp:V.Tcomp, Tdet:V.Tdet, margenPicado:V.margenPicado,
      detona:V.detona, limitadoDeton:V.limitadoDeton, bombeo:V.bombeo,
      bloqueo:V.bloqueo, sobreVel:V.sobreVel, sobreT3:V.sobreT3,
      sobrePresion:V.sobrePresion, faltaPotencia:V.faltaPotencia,
      margenBombeo:V.margenBombeo, mBombeoLinea:V.mBombeoLinea,
      mChokeLinea:V.mChokeLinea, dtc:V.dtc, perdida:V.perdida,
      avisos:V.avisos.slice(), hay:V.hay, forzada:V.forzada};
  },
  curva(f){ const C=curva(MQ(),Object.assign({falla:f||G.falla},AMB()));
    return {n:C.pts.length, parMax:{par:C.parMax.par,rpm:C.parMax.rpm},
      potMax:{pot:C.potMax.pot,rpm:C.potMax.rpm},
      pts:C.pts.map(p=>({rpm:p.rpm,par:p.par,pot:p.pot,soplado:p.soplado,
        pi:p.pi,mCorr:p.mCorr,u:p.u,xWG:p.xWG,bombeo:p.bombeo,bloqueo:p.bloqueo}))}; },
  transitorio(f){ const T=transitorio(MQ(),RPM(),averia(f||G.falla),AMB());
    return {tSopla:T.tSopla, sopladoPico:T.sopladoPico, sobreimpulso:T.sobreimpulso,
      nFin:T.nFin, sopladoFin:T.sopladoFin, xWGFin:T.xWGFin, n:T.pts.length}; },
  censo(){ const C=CENSO();
    return {total:C.total, mudo:C.mudo, conAviso:C.conAviso, conCodigo:C.conCodigo,
      peligro:C.peligro, filas:C.filas.map(f=>({falla:f.falla, mudo:f.mudo,
        celdas:f.celdas.map(c=>({rpm:c.rpm, dtc:c.dtc, perdida:c.perdida,
          nota:c.nota, detona:c.detona, bombeo:c.bombeo}))}))}; },
  // Lo que los rótulos del 3D DICEN: también pueden regalar la respuesta de un
  // reto a ciegas.
  get rotulos(){ return ANCLAS.map(a=>a[0]).concat(PARTS.map(p=>p.rot)); },
  get intentos(){ return RETO.intentos; },
  get retoCfg(){ return {falla:RETO.falla, alt:RETO.alt, Tamb:RETO.Tamb,
    octanaje:RETO.octanaje, rpm:RETO.rpm, medido:Object.keys(RETO.medido),
    elegido:RETO.elegido, veredicto:RETO.veredicto,
    intentos:RETO.intentos, maxIntentos:MAX_INTENTOS, pistas:RETO.pistas,
    maxPistas:MAX_PISTAS, minConsultas:MIN_CONSULTAS,
    vivas:FALLA_KEYS.filter(compatible)}; },
  mide(k){ mide(k); },
  elige(k){ eligeFalla(k); },
  entrega(){ entrega(); return RETO.veredicto==='ok'; },
  armaCaso(falla,rpm){ RETO.falla=falla;
    if(rpm!==undefined) RETO.rpm=rpm;
    RETO.medido={}; RETO.elegido=null; RETO.veredicto=null; RETO.intentos=0; RETO.pistas=0; RETO.aviso='';
    invalida(); pinta(); refrescaPregunta(); },
  monta(){ autoAssemble(); },
  setMode(m){ setMode(m); },
  setMaq(k){ cambiaMaquina(k); },
  setFalla(f){ if(!FALLAS[f]) return false; G.falla=f; G.resuelto=false;
    afterEdit(); refrescaPregunta(); return true; },
  setAmb(o){ o=o||{};
    if(o.alt!==undefined) G.alt=o.alt;
    if(o.Tamb!==undefined) G.Tamb=o.Tamb;
    if(o.octanaje!==undefined) G.octanaje=o.octanaje;
    if(o.vAire!==undefined) G.vAire=o.vAire;
    if(o.rpm!==undefined) G.rpm=o.rpm;
    if(o.carga!==undefined) G.carga=o.carga;
    afterEdit(); refrescaPregunta(); },
  desmonta(){ initAssembly(); afterEdit(); },
  get K(){ return {MODES:MODES.slice(), FALLAS:FALLA_KEYS.slice(),
    ARQ:ARQ_KEYS.slice(), PIEZAS:ORDEN.slice(), INSTR:INSTR.map(i=>i.k),
    ALTS:ALTS.map(A=>A.a), OCTS:OCTS.slice(),
    ROT:FALLA_KEYS.map(k=>FALLAS[k].corto), ROT_LARGO:FALLA_KEYS.map(k=>FALLAS[k].rot),
    DTC:Object.keys(DTC_ROT)}; },
  get panel(){ return {ctrl:(el('ctrl')||{}).textContent||'',
    tele:(el('tele')||{}).textContent||'',
    report:(el('report')||{}).textContent||'',
    quiz:(el('quiz')||{}).textContent||'',
    hud:(el('hud')||{}).textContent||'',
    dock:(el('panel')||{}).textContent||''}; },
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
  // El dock sustituye al pizarrón: se comprueba que se VE y que sus lienzos
  // tienen tamaño de pantalla de verdad.
  get dock(){ const p=el('panel'), r=p.getBoundingClientRect(), vis=seVe(p);
    const lz=[LA,LB,LCo].map(L=>{ const b=L.box.getBoundingClientRect(); return {w:Math.round(b.width),h:Math.round(b.height),px:L.c.width,dpr:L.dpr,ve:seVe(L.box)}; });
    return {visible:vis, ancho:Math.round(r.width), alto:Math.round(r.height), lienzos:lz}; },
  // La escena, para las pruebas de coherencia: el mismo reloj que el dock.
  get escena(){ const V=PZ.V;
    return {psi:RELOJ.psi, pausa:RELOJ.pausa, tTr:RELOJ.tTr, vista:VISTA.actual, calidad:CAL.nivel,
      escala:LAY.s, w:PZ.w, xWG:V?V.xWG:null, trampilla:V?anguloTrampilla(V.xWG):null,
      nTurbo:V?V.nTurbo:null, T2:V?V.T2:null, TAdm:V?V.TAdm:null, T3:V?V.T3:null,
      particulas:{aire:ENJ.aire.n, escape:ENJ.esc.n, dibujadas:gPart.instanceCount, mp:PZ.c?PZ.c.mp:null}}; },
  // El color que la partícula lleva a una temperatura (lineal antes de la curva
  // de tono) y el que se ve en pantalla: la prueba de que leyenda y gas casan.
  colorDe(T,aire){ const L=aire?LUT.aire:LUT.esc, o=[0,0,0]; lutEn(L,T,o,0);
    return {lineal:o, pantalla:enPantalla(o,EXPO), escala:(aire?colorAire:colorEsc)(T)}; },
  vista(v){ if(v) ponVista(v,0.01); return VISTA.actual; },
  enjambre(t){ const E=ENJ[t]||ENJ.aire, h={}, mu={}; for(let i=0;i<E.cap;i++){ if(!E.vivo[i]) continue; const s=E.seg[i]; h[s]=(h[s]||0)+1;
      if(!mu[s]){ const p=new THREE.Vector3(); (t==='esc'?posEsc:posAire)(E,i,s,E.f[i],PZ.psi,p); mu[s]=[+p.x.toFixed(3),+p.y.toFixed(3),+p.z.toFixed(3)]; } }
    return {n:E.n, hist:h, muestra:mu}; },
  reloj(o){ if(o) Object.assign(RELOJ,o); pintaBarras(); return {...RELOJ}; },
  get camara(){ return {pos:S.camera.position.toArray(), mira:S.controls.target.toArray(), hueco:huecoLibre()}; },
  // Una pasada de la escena sola (con sus sombras), medida: el presupuesto de
  // dibujo es de la escena, no de los pases de posproceso.
  get render(){ const R=S.renderer, i=R.info, a=i.autoReset; i.autoReset=false; i.reset();
    R.render(scene,S.camera); const o={llamadas:i.render.calls, triangulos:i.render.triangles};
    i.autoReset=a; return o; },
};

// ------------------------------------------------------------------- arranque
if(S.setCinematicIdle) S.setCinematicIdle(false);
aplicaCalidad();
levantaMotor();
initAssembly();
pinta();
refrescaPregunta();
S.setAnimate((dt0,t)=>{ PINTADAS++; anima(Math.min(dt0,0.1),t); });
ponVista('banco',0.001);
S.start();
