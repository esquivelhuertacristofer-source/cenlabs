/* ============================================================
   LAB — DIAGNÓSTICO DE LA ECU: ALIMENTACIONES, TIERRAS Y
   COMUNICACIÓN (Dominio D10 · instrumentación)
   Cierra el tramo de instrumentación del dominio D10 (escáner
   OBD-II → monitores de disponibilidad → bus CAN): antes de
   sospechar de la ECU misma, un técnico revisa lo que la rodea.
   Normatividad y física de referencia (ver docs/VERIFICACION-
   LISTA-MAESTRA.md §14 para el detalle verificado):
     · SAE J1962 — pinout del conector de diagnóstico (norma
       ancla PARCIAL: cubre alimentación de batería siempre viva
       y tierras de chasis/señal, pero NO la referencia de 5 V,
       que vive en el conector propio de la ECU, específico de
       cada fabricante — por eso este laboratorio usa un conector
       de ECU GENÉRICO Y REPRESENTATIVO, no un clon de J1962).
     · Convención ampliamente documentada en diagnóstico
       automotriz (triangulada entre múltiples fuentes, no una
       única norma primaria de acceso público): referencia de
       5 V compartida entre varios sensores, umbral de caída de
       tensión en tierra bajo carga (≤0.1 V aceptable / >0.3 V
       falla), y la separación funcional entre tierra de potencia
       y tierra de señal.
   Modelo de ingeniería (didáctico):
     · Los 4 casos comparten el mismo conector de 9 pines; lo
       único que cambia es el estado eléctrico real del sistema.
       Los Casos 2 y 4 empiezan en su estado "sano en apariencia"
       a propósito — el punto didáctico es que la prueba ingenua
       (sin carga / sin revisar la llave) no revela la falla. El
       Caso 3 empieza ya fallado, como llegaría un vehículo real.
     · CAN_H/CAN_L se mantienen sanas en los 4 casos: ninguno de
       ellos involucra al bus — recordatorio de que no todo lo
       que se inspecciona resulta estar fallando.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.8,2.7,5.0],target:[-0.2,0.55,0.35],bgTop:'#0a1620',bgBot:'#03060a',bloom:0.36,minD:3,maxD:15});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const brush=brushedMetal(), plas=techPlastic(0.08,0.09,0.11), rub=rubber();
const MAT={
  bench: std({...plas, metalness:0.15, roughness:0.75}),
  nodeBody: std({...plas, color:0x1c2230, metalness:0.3, roughness:0.55}),
  tapBody: std({...plas, color:0x22282f, metalness:0.3, roughness:0.5}),
  groundStud: std({...brush, color:0xc7cdd6, metalness:0.9, roughness:0.25}),
  wireBlack: std({...rub, color:0x1a1a1a, roughness:0.85, metalness:0.0}),
  wireRed: std({...rub, color:0xe0483c, roughness:0.85, metalness:0.0}),
  meterBody: std({...plas, color:0x1c2230, metalness:0.35, roughness:0.55}),
  jackRed: std({...brush, color:0xe0483c, metalness:0.85, roughness:0.3}),
  jackBlack: std({...brush, color:0x2a2a2a, metalness:0.85, roughness:0.3}),
  busLed: std({color:0x0a1210, emissive:0x3ad9c2, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
  cargaBody: std({...plas, color:0x2a2015, metalness:0.2, roughness:0.6}),
  cargaGlow: std({color:0x2a1a05, emissive:0xffb703, emissiveIntensity:0.05, roughness:0.4, metalness:0.1}),
  llaveBody: std({...plas, color:0x22282f, metalness:0.3, roughness:0.5}),
  llaveGlow: std({color:0x1a1005, emissive:0xff8c42, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
};

const PARTS=[];
const HOVER_LABELS=new Map();
function registerPart(mesh,name,desc,color){
  const part={mesh,name,desc};
  PARTS.push(part);
  const lb=labelSprite(name,color||'#ffd166');
  lb.position.copy(mesh.position);
  lb.position.y+=0.62;
  lb.visible=false; lb.raycast=()=>{};
  (mesh.parent||scene).add(lb);
  HOVER_LABELS.set(mesh,lb);
  return part;
}
function setInspectable(mesh,on){
  if(!mesh._origRaycast) mesh._origRaycast=mesh.raycast.bind(mesh);
  mesh.visible=on;
  mesh.raycast = on ? mesh._origRaycast : ()=>{};
}

const toast=document.getElementById('toast');
function showToast(html){
  toast.innerHTML=html;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);
}

/* ---------- 1) BANCO ---------- */
const bench=roundedBox(5.6,0.28,2.8,MAT.bench,0.05);
bench.position.set(-0.2,-0.02,0.3);
scene.add(bench);

/* ---------- 2) ECU + CONECTOR DE 9 PINES ---------- */
const ecuGroup=new THREE.Group(); ecuGroup.position.set(-2.05,0.62,0); scene.add(ecuGroup);
const ecuBody=roundedBox(0.85,0.62,0.42,MAT.nodeBody,0.07);
ecuGroup.add(ecuBody);
registerPart(ecuBody,'Módulo de la ECU','La computadora del motor. Aquí llegan alimentaciones, tierras y señales de sensores para procesarse — antes de sospechar de ella, un técnico revisa primero lo que la rodea.','#8fb3ac');

const connBody=roundedBox(0.52,0.42,0.16,MAT.tapBody,0.05);
connBody.position.set(0,0,0.29);
ecuGroup.add(connBody);
registerPart(connBody,'Conector de la ECU (representativo)','Conector genérico con fines didácticos: agrupa las categorías de pines más comunes de una ECU real, pero no es un clon de ningún conector estandarizado. El conector real de diagnóstico (SAE J1962), por ejemplo, no lleva la referencia de 5 V — esa referencia vive en el conector propio de la ECU, específico de cada fabricante.','#5eead4');

const PINS=[
  {key:'bateria', short:'BATERÍA', label:'Alimentación de batería (constante)', x:-0.16, y:0.14, color:'#ffb703',
   desc:'Alimentación directa de la batería. Debe estar presente con la llave apagada o encendida — es la que mantiene viva la memoria/configuración de la ECU.'},
  {key:'conmutada', short:'CONMUTADA', label:'Alimentación conmutada (con la llave)', x:0, y:0.14, color:'#ff8c42',
   desc:'Solo tiene voltaje con la llave en contacto o marcha. Leer 0 V con la llave apagada es exactamente el comportamiento esperado, no una falla.'},
  {key:'tierraPot', short:'TIERRA POT.', label:'Tierra de potencia (chasis)', x:0.16, y:0.14, color:'#8fb3ac',
   desc:'Retorno de las corrientes más grandes (actuadores/inyectores). Tolera algo más de caída de tensión que la tierra de señal.'},
  {key:'tierraSenal', short:'TIERRA SEÑAL', label:'Tierra de señal (sensores)', x:-0.16, y:0, color:'#5eead4',
   desc:'Retorno dedicado y de baja impedancia para las señales de los sensores. Debe caer ≤0.1 V bajo carga — cualquier sensor referido a esta tierra hereda su error.'},
  {key:'ref5v', short:'REF. 5V', label:'Referencia de 5 V (sensores)', x:0, y:0, color:'#b98cff',
   desc:'Riel regulado que alimenta a varios sensores a la vez (potenciométricos y algunos de presión). Un corto interno en cualquiera de ellos puede arrastrar a todos los demás.'},
  {key:'canH', short:'CAN H', label:'CAN High', x:0.16, y:0, color:'#ffd166',
   desc:'Línea de comunicación del bus CAN (ver mecanica-30 para el detalle de la codificación diferencial). Ninguno de los 4 casos de este laboratorio involucra al bus.'},
  {key:'canL', short:'CAN L', label:'CAN Low', x:-0.16, y:-0.14, color:'#4fd1c5',
   desc:'Segunda línea del par diferencial CAN. Se mantiene sana en los 4 casos de este laboratorio.'},
  {key:'sensorA', short:'SENSOR A', label:'Sensor A · MAP (presión absoluta del múltiple)', x:0, y:-0.14, color:'#eaf4f1',
   desc:'Sensor potenciométrico alimentado por la referencia de 5 V compartida.'},
  {key:'sensorB', short:'SENSOR B', label:'Sensor B · TPS (posición del acelerador)', x:0.16, y:-0.14, color:'#c8f0e6',
   desc:'Otro sensor que comparte la misma referencia de 5 V que el Sensor A.'},
];
const PIN_BY_MESH=new Map();
const pinMat=hex=>std({...brush, color:new THREE.Color(hex), metalness:0.85, roughness:0.3});
PINS.forEach(p=>{
  const m=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.05,12), pinMat(p.color));
  m.rotation.x=Math.PI/2;
  m.position.set(p.x,p.y,0.37);
  ecuGroup.add(m);
  p.mesh=m;
  registerPart(m,p.label,p.desc,p.color);
  PIN_BY_MESH.set(m,p.key);
});

/* ---------- 3) PUNTO DE REFERENCIA DE TIERRA ---------- */
const groundStud=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.10,16),MAT.groundStud);
groundStud.position.set(-1.15,0.30,0.65);
scene.add(groundStud);
registerPart(groundStud,'Punto de referencia de tierra (chasis, verificado)','Punto de tierra confiable y ya verificado. La punta negra del multímetro permanece aquí siempre — así se hace una prueba real de caída de tensión: nunca comparando un pin sospechoso contra sí mismo.','#c7cdd6');

/* ---------- 4) CONSUMIDOR DE PRUEBA (CARGA, CASO 2) ---------- */
const cargaGroup=new THREE.Group(); cargaGroup.position.set(-1.55,0.28,0.65); scene.add(cargaGroup);
const cargaBodyMesh=roundedBox(0.22,0.16,0.16,MAT.cargaBody,0.04);
cargaGroup.add(cargaBodyMesh);
const cargaBulb=new THREE.Mesh(new THREE.SphereGeometry(0.045,12,12),MAT.cargaGlow);
cargaBulb.position.set(0,0.13,0);
cargaGroup.add(cargaBulb);
registerPart(cargaBodyMesh,'Consumidor de prueba (carga)','Actívalo para hacer circular corriente real por la tierra de señal. Solo bajo carga se revela una tierra en alta resistencia; en reposo, sin corriente fluyendo, la misma tierra dañada puede parecer sana.','#ffb703');

/* ---------- 5) INTERRUPTOR DE CONTACTO (LLAVE, CASO 4) ---------- */
const llaveGroup=new THREE.Group(); llaveGroup.position.set(-2.05,0.28,0.65); scene.add(llaveGroup);
const llaveBodyMesh=roundedBox(0.18,0.20,0.14,MAT.llaveBody,0.04);
llaveGroup.add(llaveBodyMesh);
const llaveRing=new THREE.Mesh(new THREE.TorusGeometry(0.055,0.014,10,20),MAT.llaveGlow);
llaveRing.position.set(0,0,0.08);
llaveGroup.add(llaveRing);
registerPart(llaveBodyMesh,'Interruptor de contacto (llave)','Con la llave apagada, el pin de alimentación conmutada debe leer 0 V — es diseño, no una falla. Solo la alimentación constante debe seguir viva en esa posición.','#ff8c42');

/* ---------- 6) MULTÍMETRO ---------- */
const meterGroup=new THREE.Group(); meterGroup.position.set(1.7,0.78,0.9); scene.add(meterGroup);
const meterBody=roundedBox(0.62,0.95,0.16,MAT.meterBody,0.06);
meterGroup.add(meterBody);
registerPart(meterBody,'Multímetro','Instrumento que mide el voltaje entre la punta roja (el pin que elijas) y la punta negra (fija en la referencia de tierra verificada).','#5eead4');

const scrCanvas=document.createElement('canvas');
scrCanvas.width=240; scrCanvas.height=180;
const scrTex=new THREE.CanvasTexture(scrCanvas);
scrTex.colorSpace=THREE.SRGBColorSpace;
scrTex.minFilter=THREE.LinearFilter;
scrTex.generateMipmaps=false;
const screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(0.48,0.37),new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false}));
screenMesh.position.set(0,0.22,0.085);
meterGroup.add(screenMesh);
registerPart(screenMesh,'Pantalla del multímetro','Muestra el pin actualmente sondeado y su lectura en vivo.','#5eead4');

const jackRed=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.04,14),MAT.jackRed);
jackRed.rotation.x=Math.PI/2; jackRed.position.set(-0.10,-0.34,0.085);
meterGroup.add(jackRed);
registerPart(jackRed,'Entrada roja (V, sonda móvil)','Aquí sale la punta roja, la que mueves de pin en pin al tocar el conector de la ECU.','#e0483c');

const jackBlack=new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.04,14),MAT.jackBlack);
jackBlack.rotation.x=Math.PI/2; jackBlack.position.set(0.10,-0.34,0.085);
meterGroup.add(jackBlack);
registerPart(jackBlack,'Entrada negra (COM, fija)','Aquí sale la punta negra (COM), fija en la referencia de tierra verificada durante todo el laboratorio.','#2a2a2a');

const meterLed=new THREE.Mesh(new THREE.SphereGeometry(0.03,12,12),MAT.busLed);
meterLed.position.set(0.24,0.42,0.085);
meterGroup.add(meterLed);
registerPart(meterLed,'Indicador de actividad de bus (CAN)','Se mantiene en verde en los 4 casos de este laboratorio: ninguno de ellos involucra al bus CAN — un recordatorio de que no todo lo que inspeccionas resulta estar fallando.','#3ad9c2');

/* ---------- 7) PUNTAS DE PRUEBA ---------- */
function cableTube(points,radius,mat){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,8,false),mat);
  scene.add(m);
  return m;
}
const _v=new THREE.Vector3();
function worldOf(mesh){ mesh.getWorldPosition(_v); return [_v.x,_v.y,_v.z]; }

const jB=worldOf(jackBlack), gS=worldOf(groundStud);
const probeBlack=cableTube([jB,[(jB[0]+gS[0])/2,Math.max(jB[1],gS[1])+0.22,(jB[2]+gS[2])/2],gS],0.014,MAT.wireBlack);
registerPart(probeBlack,'Punta negra (COM)','Cable fijo entre el multímetro y el punto de referencia de tierra ya verificado.','#2a2a2a');

let probeRed=null;
function rebuildProbeRed(targetMesh){
  if(probeRed){ probeRed.geometry.dispose(); scene.remove(probeRed); }
  const j=worldOf(jackRed), t=worldOf(targetMesh);
  const mid=[(j[0]+t[0])/2,Math.max(j[1],t[1])+0.28,(j[2]+t[2])/2];
  probeRed=cableTube([j,mid,t],0.014,MAT.wireRed);
}

/* ---------- 8) MODELO DE DATOS ---------- */
const SCEN_ORDER=['sano','tierra','corto5v','conmutada'];
const SCEN_LABEL={
  sano:'Caso 1 · ECU sana',
  tierra:'Caso 2 · Tierra en alta resistencia',
  corto5v:'Caso 3 · Corto en la referencia de 5 V',
  conmutada:'Caso 4 · Alimentación conmutada',
};

let scenarioKey='sano';
let energized=false;
let cargaActiva=false;
let cortoActivo=false;
let sensorADesconectado=false;
let llaveOn=false;
let selectedPin='bateria';
const answered={sano:false,tierra:false,corto5v:false,conmutada:false};

function computeReading(key){
  switch(key){
    case 'bateria': {
      if(scenarioKey==='conmutada') return llaveOn?{v:'14.2 V',cls:'good',note:'motor en marcha'}:{v:'12.6 V',cls:'good',note:'contacto apagado'};
      return {v:'12.6–14.2 V',cls:'good',note:'según estado del motor'};
    }
    case 'conmutada': {
      if(scenarioKey==='conmutada') return llaveOn?{v:'12.6 V',cls:'good',note:'con la llave en marcha'}:{v:'0 V',cls:'warn',note:'llave apagada — esperado'};
      return {v:'0–12.6 V',cls:'good',note:'según la llave'};
    }
    case 'tierraPot':
      return {v:'≤0.1 V',cls:'good',note:'caída bajo carga'};
    case 'tierraSenal': {
      if(scenarioKey==='tierra') return cargaActiva?{v:'0.45 V',cls:'bad',note:'bajo carga — falla'}:{v:'0.05 V',cls:'warn',note:'en reposo, parece sana'};
      return {v:'≤0.1 V',cls:'good',note:'caída bajo carga'};
    }
    case 'ref5v': {
      if(scenarioKey==='corto5v' && cortoActivo && !sensorADesconectado) return {v:'≈0.3 V',cls:'bad',note:'arrastrada por Sensor A'};
      return {v:'5.0 V',cls:'good',note:'riel de referencia'};
    }
    case 'canH': return {v:'2.5↔3.5 V',cls:'good',note:'transiciones limpias'};
    case 'canL': return {v:'2.5↔1.5 V',cls:'good',note:'transiciones limpias'};
    case 'sensorA': {
      if(scenarioKey==='tierra') return cargaActiva?{v:'2.55 V',cls:'warn',note:'desplazada +0.45 V'}:{v:'2.1 V',cls:'good',note:'dentro de rango'};
      if(scenarioKey==='corto5v'){
        if(!cortoActivo) return {v:'2.1 V',cls:'good',note:'dentro de rango'};
        if(sensorADesconectado) return {v:'— V',cls:'muted',note:'desconectado a propósito'};
        return {v:'≈0.1 V',cls:'bad',note:'colapsada, corto interno'};
      }
      return {v:'2.1 V',cls:'good',note:'dentro de rango'};
    }
    case 'sensorB': {
      if(scenarioKey==='tierra') return cargaActiva?{v:'1.35 V',cls:'warn',note:'desplazada +0.45 V'}:{v:'0.9 V',cls:'good',note:'dentro de rango'};
      if(scenarioKey==='corto5v'){
        if(!cortoActivo) return {v:'0.9 V',cls:'good',note:'dentro de rango'};
        if(sensorADesconectado) return {v:'0.9 V',cls:'good',note:'recuperado'};
        return {v:'≈0.15 V',cls:'bad',note:'arrastrada por el riel'};
      }
      return {v:'0.9 V',cls:'good',note:'dentro de rango'};
    }
  }
  return {v:'—',cls:'',note:''};
}
function worstClassNow(){
  if(!energized) return null;
  let worst='good';
  for(const p of PINS){
    const r=computeReading(p.key);
    if(r.cls==='bad') return 'bad';
    if(r.cls==='warn') worst='warn';
  }
  return worst;
}

const QUESTIONS={
  sano:{
    prompt:'La batería marca 12.6 V con la llave apagada y 14.2 V con el motor en marcha; ambas tierras caen ≤0.1 V bajo carga; la referencia de 5 V está en 5.0 V. ¿Qué concluyes?',
    opts:[
      {t:'Hay un problema de tierra: el voltaje no debería cambiar entre 12.6 V y 14.2 V',ok:false},
      {t:'Todo dentro de rango esperado: alimentación constante presente, tierras limpias y referencia estable — la ECU tiene una base eléctrica sana para trabajar',ok:true},
      {t:'La referencia de 5 V debería ser idéntica a la de batería; hay una falla de regulación',ok:false},
      {t:'El cambio de 12.6 V a 14.2 V indica un cortocircuito intermitente',ok:false},
    ],
  },
  tierra:{
    prompt:'Sin carga, la tierra de señal marca solo 0.05 V — parece sana. Al activar un consumidor y repetir la medición bajo carga, sube a 0.45 V, y los sensores MAP y TPS leen ambos más alto de lo esperado. ¿Qué está pasando?',
    opts:[
      {t:'Los dos sensores fallaron al mismo tiempo, por coincidencia',ok:false},
      {t:'La tierra de señal tiene alta resistencia (corrosión o mal contacto): no se nota en reposo, pero bajo carga cae más de 0.3 V, y ese desplazamiento se suma a cada lectura de sensor referida a esa tierra',ok:true},
      {t:'La referencia de 5 V está arrastrada por un corto interno',ok:false},
      {t:'Es un problema de la alimentación conmutada, no de la tierra',ok:false},
    ],
  },
  corto5v:{
    prompt:'La referencia de 5 V cae a ≈0.3 V y, al mismo tiempo, los sensores MAP y TPS —alimentados por esa misma referencia— muestran lecturas fuera de rango. Al desconectar el Sensor A, la referencia se recupera a 5.0 V y el Sensor B vuelve a leer normal. ¿Qué falla real hay?',
    opts:[
      {t:'Tres fallas independientes y simultáneas: la referencia, el Sensor A y el Sensor B',ok:false},
      {t:'El Sensor A tiene un corto interno a tierra que arrastra toda la referencia de 5 V compartida; el Sensor B nunca estuvo dañado — solo parecía fallar porque comparte el mismo riel',ok:true},
      {t:'El Sensor B es el dañado, porque fue el que "se arregló" al desconectar A',ok:false},
      {t:'La ECU necesita reprogramarse',ok:false},
    ],
  },
  conmutada:{
    prompt:'Con la llave apagada, el pin de alimentación conmutada marca 0 V. A simple vista parece un circuito abierto. ¿Qué haces antes de concluir eso?',
    opts:[
      {t:'Declarar de inmediato un circuito abierto y reemplazar el arnés',ok:false},
      {t:'Confirmar el estado de la llave: este pin está diseñado para leer 0 V con la llave apagada y solo energizarse con contacto o marcha — hay que repetir la medición con la llave en marcha antes de concluir nada',ok:true},
      {t:'Medir la tierra de potencia, porque el problema seguro está ahí',ok:false},
      {t:'Es normal que cualquier pin de la ECU lea 0 V en algún momento; no amerita revisión',ok:false},
    ],
  },
};
const DX_HINT={
  sano:'Una ECU sana no tiene un solo "voltaje correcto": tiene un patrón esperado por pin. La alimentación constante varía legítimamente entre el reposo (batería sola, ≈12.6 V) y el motor en marcha (alternador cargando, ≈14.2 V) — eso no es una falla. Las tierras limpias (≤0.1 V bajo carga) y la referencia de 5 V estable (4.9–5.1 V) son la base eléctrica que todo sensor necesita para dar una lectura confiable.',
  tierra:'El multímetro en reposo —sin corriente real fluyendo por esa tierra— casi nunca revela una tierra en alta resistencia: la caída de tensión solo aparece cuando hay corriente pasando por el punto dañado. Por eso la prueba correcta es la caída de tensión BAJO CARGA, no un voltaje en reposo. Y como la ECU mide cada sensor contra su tierra de señal, si esa tierra se desplaza +0.45 V, cada sensor referido a ella parece leer +0.45 V más alto: la falla no apaga nada, desplaza silenciosamente cada lectura.',
  corto5v:'Cuando varios sensores comparten un mismo riel de referencia de 5 V, un solo sensor con corto interno a tierra puede arrastrar TODO el riel — y entonces todos los sensores que dependen de esa referencia parecen fallar a la vez, aunque solo uno esté realmente dañado. La forma de aislar al culpable real es desconectar los sensores del riel compartido uno a la vez: en cuanto se desconecta el que tiene el corto, la referencia se recupera y los demás vuelven a leer normal.',
  conmutada:'Un pin de alimentación conmutada está diseñado para leer 0 V con la llave apagada — eso es exactamente lo esperado, no una falla. Confundir "sin voltaje ahora" con "circuito abierto" es un error común: antes de declarar una falla de continuidad hay que confirmar el estado de la llave y repetir la medición con contacto o marcha.',
};

/* ---------- 9) RENDERIZADO DE PANTALLA ---------- */
function updateScreen(){
  const ctx=scrCanvas.getContext('2d');
  const W=scrCanvas.width, H=scrCanvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#03110c'; ctx.fillRect(0,0,W,H);
  if(!energized){
    ctx.font='11px monospace'; ctx.fillStyle='#3a5a52'; ctx.textAlign='center';
    ctx.fillText('— sin señal —',W/2,H/2);
    scrTex.needsUpdate=true; return;
  }
  const pin=PINS.find(p=>p.key===selectedPin)||PINS[0];
  const r=computeReading(pin.key);
  const color = r.cls==='bad'?'#ff6b6b': r.cls==='warn'?'#ffd166': r.cls==='muted'?'#8fb3ac':'#3ad9c2';
  ctx.font='12px monospace'; ctx.fillStyle='#8fb3ac'; ctx.textAlign='center';
  ctx.fillText(pin.short, W/2, 24);
  ctx.font='bold 26px monospace'; ctx.fillStyle=color; ctx.textAlign='center';
  ctx.fillText(r.v, W/2, H/2+8);
  ctx.font='10px monospace'; ctx.fillStyle='#3a5a52'; ctx.textAlign='center';
  ctx.fillText(r.note, W/2, H-16);
  scrTex.needsUpdate=true;
}

/* ---------- 10) SELECCIÓN DE PIN ---------- */
function selectPin(key){
  selectedPin=key;
  const pin=PINS.find(p=>p.key===key);
  if(pin) rebuildProbeRed(pin.mesh);
  updateScreen();
}

/* ---------- 11) INSPECCIÓN POR CLIC ---------- */
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit) return;
  let o=hit.object;
  while(o){
    if(PIN_BY_MESH.has(o)){
      const key=PIN_BY_MESH.get(o);
      if(energized){ selectPin(key); updateTele(); }
      const p=PARTS.find(x=>x.mesh===o);
      const extra=energized?'':'<br><span style="color:var(--dim);font-size:11px">Conecta las puntas para tomar la lectura.</span>';
      showToast(`<b style="color:var(--accent)">${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.desc}</span>${extra}`);
      return;
    }
    const p=PARTS.find(x=>x.mesh===o);
    if(p){ showToast(`<b style="color:var(--accent)">${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.desc}</span>`); return; }
    o=o.parent;
  }
});

/* ---------- 12) ETIQUETAS HOVER ---------- */
(function(){
  const dom=S.renderer.domElement, ray=new THREE.Raycaster(), mv=new THREE.Vector2();
  let shown=null;
  const setShown=lb=>{
    if(shown===lb) return;
    if(shown) shown.visible=false;
    shown=lb;
    if(shown) shown.visible=true;
  };
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    mv.x=((e.clientX-r.left)/r.width)*2-1;
    mv.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(mv,S.camera);
    const hits=ray.intersectObjects(scene.children,true);
    let found=null;
    for(const h of hits){
      let o=h.object;
      while(o){
        if(HOVER_LABELS.has(o)){ found=HOVER_LABELS.get(o); break; }
        o=o.parent;
      }
      if(found) break;
    }
    setShown(found);
  });
  dom.addEventListener('pointerleave',()=>setShown(null));
})();

/* ---------- 13) ANIMACIÓN ---------- */
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:2200,Q:0.7});
S.setAnimate((dt,time)=>{
  const pulse=0.5+0.5*Math.sin(time*3.2);
  meterLed.material.emissiveIntensity = !energized?0.05:(0.5+0.3*pulse);
  cargaBulb.material.emissiveIntensity = (energized && scenarioKey==='tierra' && cargaActiva) ? (0.6+0.4*pulse) : 0.05;
  llaveRing.material.emissiveIntensity = (energized && scenarioKey==='conmutada' && llaveOn) ? (0.6+0.4*pulse) : 0.05;

  if(time-(updateScreen._t||0)>0.22){ updateScreen(); updateScreen._t=time; }

  const w=worstClassNow();
  const freqNow = w==='bad'?150:w==='warn'?340:520;
  synth.update(freqNow,freqNow,(energized&&w)?0.025:0,2000);
});

/* ---------- 14) HUD ---------- */
document.getElementById('hud').innerHTML=`
<div class="eyebrow">Dominio D10 · Instrumentación</div>
<h2>Diagnóstico de la ECU: Alimentaciones, Tierras y Comunicación</h2>
<p>Antes de sospechar de la ECU misma, un técnico revisa lo que la rodea: ¿tiene alimentación?, ¿tiene una tierra limpia?, ¿la referencia que comparten sus sensores está sana? La mayoría de las "ECU dañadas" en un taller resultan ser exactamente esto — un pin de su entorno, no la computadora.</p>
<div class="formula">Tierra bajo carga: ≤0.1 V bien · &gt;0.3 V falla · Referencia de 5 V: 4.9–5.1 V<br>Conmutada: 0 V (llave off) / ≈12.6 V (llave on) · Batería: ≈12.6 V (reposo) / ≈14.2 V (motor en marcha)</div>
<div class="legend">
  <div class="li"><span class="dot" style="background:#ffb703"></span>Alimentación constante</div>
  <div class="li"><span class="dot" style="background:#ff8c42"></span>Alimentación conmutada</div>
  <div class="li"><span class="dot" style="background:#5eead4"></span>Tierra de señal</div>
  <div class="li"><span class="dot" style="background:#b98cff"></span>Referencia de 5 V</div>
</div>
<div class="fid">
  <div class="ft">🔒 Contrato de fidelidad</div>
  <div class="fl"><b>Sí modela:</b> la diferencia entre alimentación constante y conmutada (y por qué 0 V con la llave apagada no es una falla en la segunda); la separación entre tierra de potencia y tierra de señal; la prueba de caída de tensión bajo carga como único método confiable para detectar una tierra en alta resistencia (en reposo puede parecer sana); y el efecto de un corto interno en un sensor que arrastra un riel de referencia de 5 V compartido, produciendo códigos simultáneos en sensores realmente sanos.</div>
  <div class="fl no"><b>NO modela:</b> un clon literal de ningún conector estandarizado — este es un conector de ECU genérico y representativo con fines didácticos (el conector real de diagnóstico SAE J1962, por ejemplo, no lleva la referencia de 5 V: esa referencia vive en el conector propio de la ECU, específico de cada fabricante); tampoco decodifica tramas CAN reales (ver mecanica-30) ni sustituye el diagrama de pines oficial de un vehículo específico.</div>
</div>
<div class="src">Ref: SAE J1962 (pinout del conector de diagnóstico — parcial, no cubre la referencia de 5 V) · práctica de diagnóstico automotriz ampliamente documentada (prueba de caída de tensión, referencia de 5 V compartida, separación de tierras) — consulta el manual del fabricante (FSM) para las cifras exactas de tu vehículo.</div>
`;

/* ---------- 15) PANEL ---------- */
document.getElementById('panel').innerHTML=`
<h4>Diagnóstico de ECU · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span> · <span id="p_progress" style="color:var(--dim);font-size:11px">0/4 ✔</span></h4>
<div class="modebar">
  <button class="b on" id="s_sano">ECU sana</button>
  <button class="b" id="s_tierra">Tierra alta R</button>
  <button class="b" id="s_corto5v">Corto ref. 5V</button>
  <button class="b" id="s_conmutada">Conmutada</button>
</div>
<div class="console" id="console">Pulsa "🔌 Conectar puntas" para iniciar.</div>
<div id="tele">
  <div class="g"><div class="gl"><span>Batería (constante)</span><b id="t_bateria">—</b></div></div>
  <div class="g"><div class="gl"><span>Conmutada (llave)</span><b id="t_conmutada">—</b></div></div>
  <div class="g"><div class="gl"><span>Tierra de potencia</span><b id="t_tierraPot">—</b></div></div>
  <div class="g"><div class="gl"><span>Tierra de señal</span><b id="t_tierraSenal">—</b></div></div>
  <div class="g"><div class="gl"><span>Referencia 5 V</span><b id="t_ref5v">—</b></div></div>
  <div class="g"><div class="gl"><span>CAN High</span><b id="t_canH">—</b></div></div>
  <div class="g"><div class="gl"><span>CAN Low</span><b id="t_canL">—</b></div></div>
  <div class="g"><div class="gl"><span>Sensor A · MAP</span><b id="t_sensorA">—</b></div></div>
  <div class="g"><div class="gl"><span>Sensor B · TPS</span><b id="t_sensorB">—</b></div></div>
</div>

<div id="ctrlTierra" style="display:none">
  <h4 class="sec">Prueba de caída de tensión</h4>
  <div class="btns"><button class="b" id="btnCarga">⚡ Aplicar carga (activar consumidor)</button></div>
</div>
<div id="ctrlCorto5v" style="display:none">
  <h4 class="sec">Aislar el riel compartido</h4>
  <div class="btns">
    <button class="b" id="btnCorto5v">🔻 Reparar Sensor A</button>
    <button class="b" id="btnDescA">🔌 Desconectar Sensor A</button>
  </div>
</div>
<div id="ctrlConmutada" style="display:none">
  <h4 class="sec">Estado de la llave</h4>
  <div class="btns"><button class="b" id="btnLlave">🔑 Girar la llave a marcha (contacto)</button></div>
</div>

<h4 class="sec" id="q_prompt">—</h4>
<div class="btns" id="dxWrap">
  <button class="b dx" data-i="0">A</button>
  <button class="b dx" data-i="1">B</button>
  <button class="b dx" data-i="2">C</button>
  <button class="b dx" data-i="3">D</button>
</div>

<div class="btns">
  <button class="b auto" id="btnAuto">✨ Demostración guiada (4 casos)</button>
  <button class="b primary" id="btnEnergize">🔌 Conectar puntas</button>
  <button class="b" id="btnNext">🔀 Siguiente caso</button>
</div>
`;

/* ---------- 16) HELPERS DE UI ---------- */
const el=id=>document.getElementById(id);
const consoleEl=el('console');

function setConsole(){
  if(!energized){
    consoleEl.innerHTML=`Puntas desconectadas. Pulsa <span style="color:var(--accent)">"🔌 Conectar puntas"</span> para empezar a medir.`;
    return;
  }
  const desc={
    sano:'Referencia: así se ve una ECU con una base eléctrica sana. Toca cualquier pin del conector para inspeccionarlo.',
    tierra:'La tierra de señal tiene alta resistencia. Prueba primero sin carga, luego actívala — compara.',
    corto5v:'Llegó con 3 códigos de sensor "fuera de rango" a la vez. Antes de cambiar tres sensores, aísla el riel compartido.',
    conmutada:'El pin conmutado marca 0 V con la llave apagada. ¿Falla real o comportamiento esperado?',
  }[scenarioKey];
  consoleEl.innerHTML=`<b>${SCEN_LABEL[scenarioKey]}</b><br>${desc}`;
}

function updateTele(){
  if(!energized){
    PINS.forEach(p=>{ const e=el('t_'+p.key); if(e){ e.textContent='—'; e.className=''; } });
    return;
  }
  PINS.forEach(p=>{
    const r=computeReading(p.key);
    const e=el('t_'+p.key);
    if(e){ e.textContent=r.v+' · '+r.note; e.className=r.cls; }
  });
}

function refreshAll(){ updateTele(); updateScreen(); setConsole(); }
function refreshCaseLabel(){ el('p_case').textContent='Caso '+(SCEN_ORDER.indexOf(scenarioKey)+1)+'/4'; }
function refreshProgress(){ const n=Object.values(answered).filter(Boolean).length; el('p_progress').textContent=n+'/4 ✔'; }
function clearDx(){ document.querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong')); }
function renderQuestion(){
  const q=QUESTIONS[scenarioKey];
  const qEl=el('q_prompt');
  qEl.textContent=q.prompt;
  document.querySelectorAll('#dxWrap .b.dx').forEach((btn,i)=>{
    const o=q.opts[i];
    btn.textContent=String.fromCharCode(65+i)+' · '+o.t;
    btn.dataset.ok=o.ok?'1':'0';
  });
}

/* ---------- 17) INTERACCIÓN ---------- */
function applyCargaState(){
  const btn=el('btnCarga'); if(btn) btn.textContent = cargaActiva?'⚡ Quitar carga':'⚡ Aplicar carga (activar consumidor)';
}
function applyCortoState(){
  const btn=el('btnCorto5v'); if(btn) btn.textContent = cortoActivo?'🔻 Reparar Sensor A':'🔻 Provocar corto en Sensor A';
  const btnD=el('btnDescA'); if(btnD) btnD.textContent = sensorADesconectado?'🔌 Reconectar Sensor A':'🔌 Desconectar Sensor A';
}
function applyLlaveState(){
  const btn=el('btnLlave'); if(btn) btn.textContent = llaveOn?'🔑 Apagar la llave':'🔑 Girar la llave a marcha (contacto)';
}

function setScenario(key){
  scenarioKey=key;
  clearDx();
  cargaActiva=false;
  cortoActivo=(key==='corto5v');
  sensorADesconectado=false;
  llaveOn=false;
  ['s_sano','s_tierra','s_corto5v','s_conmutada'].forEach(id=>el(id).classList.toggle('on',id==='s_'+key));
  el('ctrlTierra').style.display = key==='tierra'?'':'none';
  el('ctrlCorto5v').style.display = key==='corto5v'?'':'none';
  el('ctrlConmutada').style.display = key==='conmutada'?'':'none';
  applyCargaState();
  applyCortoState();
  applyLlaveState();
  const defaultPin={sano:'bateria',tierra:'tierraSenal',corto5v:'ref5v',conmutada:'conmutada'}[key];
  selectPin(defaultPin);
  renderQuestion();
  refreshCaseLabel();
  refreshAll();
}

el('s_sano').onclick=()=>setScenario('sano');
el('s_tierra').onclick=()=>setScenario('tierra');
el('s_corto5v').onclick=()=>setScenario('corto5v');
el('s_conmutada').onclick=()=>setScenario('conmutada');

el('btnCarga').onclick=()=>{ cargaActiva=!cargaActiva; applyCargaState(); refreshAll(); synth.beep(cargaActiva?260:660,0.1,0.05); };
el('btnCorto5v').onclick=()=>{ cortoActivo=!cortoActivo; if(!cortoActivo) sensorADesconectado=false; applyCortoState(); refreshAll(); synth.beep(cortoActivo?180:660,0.1,0.05); };
el('btnDescA').onclick=()=>{ sensorADesconectado=!sensorADesconectado; applyCortoState(); refreshAll(); synth.beep(sensorADesconectado?880:440,0.08,0.04); };
el('btnLlave').onclick=()=>{ llaveOn=!llaveOn; applyLlaveState(); refreshAll(); synth.beep(llaveOn?660:300,0.1,0.05); };

document.querySelectorAll('#dxWrap .b.dx').forEach(btn=>{
  btn.onclick=()=>{
    if(!energized){ showToast('Primero conecta las puntas del multímetro.'); return; }
    const ok=btn.dataset.ok==='1';
    clearDx();
    if(ok){
      btn.classList.add('right');
      answered[scenarioKey]=true;
      refreshProgress();
      synth.beep(1046,0.12,0.06);
      showToast(`<span style="color:var(--good)">✔ Correcto</span><br><span style="color:var(--dim);font-size:11px">${DX_HINT[scenarioKey]}</span>`);
    } else {
      btn.classList.add('wrong');
      synth.beep(220,0.15,0.06);
      showToast(`<span style="color:var(--bad)">✗ No es correcta.</span><br><span style="color:var(--dim);font-size:11px">Revisa la telemetría y el estado actual del sistema, luego inténtalo de nuevo.</span>`);
    }
  };
});

el('btnEnergize').onclick=(e)=>{
  energized=!energized;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',energized);
  e.target.textContent=energized?'⏻ Desconectar puntas':'🔌 Conectar puntas';
  if(energized){
    S.moveTo([2.6,1.9,3.6],[-0.15,0.55,0.5],1.3);
    S.setCinematicIdle(true);
    synth.beep(660,0.1,0.06);
  } else {
    S.setCinematicIdle(false);
  }
  refreshAll();
};

el('btnNext').onclick=()=>{
  const i=SCEN_ORDER.indexOf(scenarioKey);
  setScenario(SCEN_ORDER[(i+1)%SCEN_ORDER.length]);
};

const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{ const on=synth.toggle(); soundBtn.textContent=on?'🔊':'🔇'; soundBtn.classList.toggle('on',on); };

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let autoRunning=false;
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const btn=el('btnAuto'); const label=btn.textContent;
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Demostración en curso…';
  try{
    setScenario('sano');
    if(!energized){ showToast('Paso 1 · Conectando las puntas del multímetro…'); el('btnEnergize').click(); await sleep(1600); }
    selectPin('bateria'); refreshAll();
    showToast('Paso 2 · ECU sana: batería 12.6 V en reposo, tierras limpias, referencia de 5 V estable.'); await sleep(2800);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    setScenario('tierra');
    selectPin('tierraSenal'); refreshAll();
    showToast('Paso 3 · Sin carga, la tierra de señal marca 0.05 V — parece sana.'); await sleep(2600);
    el('btnCarga').click();
    showToast('Paso 4 · Con un consumidor activo, la misma tierra sube a 0.45 V: recién ahora aparece la falla.'); await sleep(2800);
    selectPin('sensorA'); refreshAll();
    showToast('Paso 5 · Y cada sensor referido a esa tierra queda desplazado por la misma cantidad.'); await sleep(2600);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    setScenario('corto5v');
    selectPin('ref5v'); refreshAll();
    showToast('Paso 6 · Llega con 3 códigos de sensor "fuera de rango" a la vez — la referencia de 5 V está arrastrada a ≈0.3 V.'); await sleep(2800);
    el('btnDescA').click();
    showToast('Paso 7 · Al desconectar el Sensor A, la referencia se recupera y el Sensor B —que nunca estuvo dañado— vuelve a leer normal.'); await sleep(3000);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    setScenario('conmutada');
    selectPin('conmutada'); refreshAll();
    showToast('Paso 8 · Con la llave apagada, este pin marca 0 V — a simple vista, parece un circuito abierto.'); await sleep(2800);
    el('btnLlave').click();
    showToast('Paso 9 · Con la llave en marcha, el mismo pin sube a 12.6 V: nunca estuvo abierto, solo estaba diseñado para apagarse con la llave.'); await sleep(3000);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    showToast('<span style="color:var(--good)">✔ Fin de la demostración: cuatro pines, cuatro comportamientos distintos — y solo uno de ellos era realmente una falla en la ECU misma.</span>');
  } finally {
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    autoRunning=false;
  }
}
el('btnAuto').onclick=runAuto;

/* ---------- 18) INIT ---------- */
setScenario('sano');
refreshProgress();
S.start();
