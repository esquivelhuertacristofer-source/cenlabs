/* ============================================================
   LAB — BUS CAN Y DIAGNÓSTICO CON OSCILOSCOPIO (Dominio D10 · instrumentación)
   Continúa el hilo de instrumentación (escáner OBD-II, osciloscopio):
   ahí se leyó UN punto a la vez (un DTC, una señal analógica). Aquí el
   bus mismo es la señal — dos hilos, CAN_H y CAN_L, que solo tienen
   sentido leídos como una diferencial.
   Normatividad y física de referencia (ver docs/VERIFICACION-LISTA-
   MAESTRA.md §13 para el detalle verificado contra fuente primaria):
     · Bosch CAN Specification 2.0 (1991) — codificación recesivo/
       dominante, arbitraje bit a bit no destructivo por prioridad de
       identificador (bus wired-AND: dominante siempre gana).
     · ISO 11898-2 — capa física de alta velocidad (norma de acceso
       restringido; edición verificada por catálogo, contenido técnico
       cruzado contra fuentes secundarias que la citan).
     · TI SLLA270, Microchip AN228 — guías de aplicación: niveles
       CAN_H/CAN_L típicos, terminación en 120 Ω por extremo, efecto de
       una terminación faltante (reflexión/ringing).
   Modelo de ingeniería (didáctico):
     · Recesivo ≈2.5 V en ambas líneas (diferencial ≈0 V); dominante
       ≈3.5 V/≈1.5 V (diferencial ≈2 V). Cifras representativas de un
       transceptor típico — no de una marca/modelo específico.
     · Los 4 casos comparten la MISMA trama intentada (mismo patrón de
       bits ilustrativo); lo único que cambia es el estado físico del
       bus. El Caso 4 (arbitraje) reutiliza el trazo sano a propósito:
       un arbitraje normal es, visto desde el bus, indistinguible de
       una trama sana — ese es el punto didáctico del distractor.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.4,3.0,5.6],target:[0,0.85,0.1],bgTop:'#0a1620',bgBot:'#03060a',bloom:0.38,minD:3.2,maxD:16});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.08,0.09,0.11), rub=rubber();
const MAT={
  bench: std({...plas, metalness:0.15, roughness:0.75}),
  nodeBody: std({...plas, color:0x1c2230, metalness:0.3, roughness:0.55}),
  termBody: std({color:0xcda876, roughness:0.55, metalness:0.05}),
  wireH: std({...rub, color:0xe0b23c, roughness:0.85, metalness:0.0}),
  wireL: std({...rub, color:0x3fb8c9, roughness:0.85, metalness:0.0}),
  tapBody: std({...plas, color:0x22282f, metalness:0.3, roughness:0.5}),
  tapPinH: std({...brush, color:0xe0b23c, metalness:0.85, roughness:0.3}),
  tapPinL: std({...brush, color:0x3fb8c9, metalness:0.85, roughness:0.3}),
  jumper: std({color:0x2a0d0d, emissive:0xff3b30, emissiveIntensity:0.7, roughness:0.4, metalness:0.2}),
  scopeBody: std({...plas, color:0x1c2230, metalness:0.35, roughness:0.55}),
  jackCh1: std({...brush, color:0xe0b23c, metalness:0.85, roughness:0.3}),
  jackCh2: std({...brush, color:0x3fb8c9, metalness:0.85, roughness:0.3}),
  busLed: std({color:0x0a1210, emissive:0x3ad9c2, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
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
const bench=roundedBox(6.6,0.28,3.6,MAT.bench,0.05);
bench.position.set(0,-0.02,0);
scene.add(bench);

/* ---------- 2) NODO A (extremo izquierdo, terminador fijo) ---------- */
const nodeAGroup=new THREE.Group(); nodeAGroup.position.set(-2.6,0.5,0); scene.add(nodeAGroup);
const nodeABody=roundedBox(0.62,0.42,0.46,MAT.nodeBody,0.06);
nodeAGroup.add(nodeABody);
registerPart(nodeABody,'Nodo A (extremo izquierdo)','Un módulo cualquiera del bus (p. ej. una ECU) en el extremo izquierdo. Su terminador de 120 Ω permanece siempre conectado en este laboratorio — es el terminador del extremo B (Caso 2) el que se retira.','#8fb3ac');

const termA=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.24,12),MAT.termBody);
termA.rotation.z=Math.PI/2;
termA.position.set(0.40,0,0);
nodeAGroup.add(termA);
registerPart(termA,'Terminador 120 Ω (extremo A)','Cierra el extremo A del bus en ~120 Ω, la impedancia característica de referencia del par trenzado. Permanece siempre conectado en este laboratorio.','#ffd166');

/* ---------- 3) NODO B (extremo derecho, terminador removible) ---------- */
const nodeBGroup=new THREE.Group(); nodeBGroup.position.set(2.6,0.5,0); scene.add(nodeBGroup);
const nodeBBody=roundedBox(0.62,0.42,0.46,MAT.nodeBody,0.06);
nodeBGroup.add(nodeBBody);
registerPart(nodeBBody,'Nodo B (extremo derecho)','Un segundo módulo en el extremo opuesto del bus. Su terminador de 120 Ω es el que se retira en el Caso 2 para mostrar el efecto de una terminación faltante.','#8fb3ac');

const TERM_SEATED=[-0.40,0,0], TERM_REMOVED=[-0.30,0.20,0.28], TERM_REMOVED_ROTZ=0.6;
const termBGroup=new THREE.Group();
termBGroup.position.set(TERM_SEATED[0],TERM_SEATED[1],TERM_SEATED[2]);
nodeBGroup.add(termBGroup);
const termBMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.24,12),MAT.termBody);
termBMesh.rotation.z=Math.PI/2;
termBGroup.add(termBMesh);
const termBPart=registerPart(termBGroup,'Terminador 120 Ω (extremo B)','Presente: cierra el extremo B del bus en ~120 Ω.','#ffd166');

/* ---------- 4) BUS — LÍNEAS CAN_H / CAN_L ---------- */
function cableTube(points,radius,mat){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,8,false),mat);
  scene.add(m);
  return m;
}
const busH=cableTube([[-2.20,0.50,0.05],[-1.0,0.50,0.09],[0,0.52,0.05],[1.0,0.50,-0.03],[2.20,0.50,-0.05]],0.024,MAT.wireH);
registerPart(busH,'Línea CAN_H (par trenzado)','En reposo (recesivo) está a ≈2.5 V; al transmitir un bit dominante sube a ≈3.5 V.','#ffd166');

const busL=cableTube([[-2.20,0.50,-0.05],[-1.0,0.50,-0.09],[0,0.52,-0.05],[1.0,0.50,0.03],[2.20,0.50,0.05]],0.024,MAT.wireL);
registerPart(busL,'Línea CAN_L (par trenzado)','En reposo (recesivo) está a ≈2.5 V; al transmitir un bit dominante baja a ≈1.5 V.','#4fd1c5');

/* ---------- 5) CONECTOR DE DIAGNÓSTICO + PUENTE DE CORTOCIRCUITO ---------- */
const tapGroup=new THREE.Group();
tapGroup.position.set(0,0.58,0.05);
scene.add(tapGroup);
const tapBody=roundedBox(0.34,0.20,0.20,MAT.tapBody,0.05);
tapGroup.add(tapBody);
registerPart(tapBody,'Conector de diagnóstico','Punto de derivación donde se conectan las puntas del osciloscopio sin interrumpir el bus — como una caja de derivación (breakout box) real.','#5eead4');

const tapPinH=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.05,12),MAT.tapPinH);
tapPinH.rotation.x=Math.PI/2;
tapPinH.position.set(-0.07,-0.10,0.10);
tapGroup.add(tapPinH);
registerPart(tapPinH,'Derivación CAN_H','Contacto donde la punta CH1 del osciloscopio toma la línea CAN_H.','#ffd166');

const tapPinL=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.05,12),MAT.tapPinL);
tapPinL.rotation.x=Math.PI/2;
tapPinL.position.set(0.07,-0.10,0.10);
tapGroup.add(tapPinL);
registerPart(tapPinL,'Derivación CAN_L','Contacto donde la punta CH2 del osciloscopio toma la línea CAN_L.','#4fd1c5');

const jumperMesh=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.155,8),MAT.jumper);
jumperMesh.rotation.z=Math.PI/2;
jumperMesh.position.set(0,-0.10,0.10);
tapGroup.add(jumperMesh);
registerPart(jumperMesh,'Puente de cortocircuito (Caso 3)','Representa un cortocircuito entre CAN_H y CAN_L en algún punto del arnés — en la realidad puede ocurrir en cualquier tramo; se dibuja aquí solo para señalarlo con claridad.','#ff6b6b');
setInspectable(jumperMesh,false);

/* ---------- 6) OSCILOSCOPIO ---------- */
const scopeGroup=new THREE.Group();
scopeGroup.position.set(0,0.85,1.6);
scene.add(scopeGroup);

const scopeBody=roundedBox(1.9,1.30,1.15,MAT.scopeBody,0.09);
scopeGroup.add(scopeBody);
registerPart(scopeBody,'Osciloscopio','Instrumento que dibuja el voltaje de CAN_H y CAN_L contra el tiempo — la única forma de VER directamente la codificación diferencial de CAN.','#5eead4');

const scrCanvas=document.createElement('canvas');
scrCanvas.width=300; scrCanvas.height=240;
const scrTex=new THREE.CanvasTexture(scrCanvas);
scrTex.colorSpace=THREE.SRGBColorSpace;
scrTex.minFilter=THREE.LinearFilter;
scrTex.generateMipmaps=false;
const screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(1.10,0.88),new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false}));
screenMesh.position.set(0,0.32,0.585);
scopeGroup.add(screenMesh);
registerPart(screenMesh,'Pantalla','Cuadrícula de 10×8 divisiones: cada división horizontal equivale a 2 µs (1 bit a 500 kbit/s); cada división vertical equivale a 0.5 V, centrada en 2.5 V.','#5eead4');

const jackCh1=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.05,16),MAT.jackCh1);
jackCh1.rotation.x=Math.PI/2;
jackCh1.position.set(-0.75,-0.30,0.585);
scopeGroup.add(jackCh1);
registerPart(jackCh1,'Entrada CH1 (BNC) · CAN_H','Conector del canal 1. Trae la señal de la línea CAN_H desde el conector de diagnóstico.','#ffd166');

const jackCh2=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.05,16),MAT.jackCh2);
jackCh2.rotation.x=Math.PI/2;
jackCh2.position.set(-0.55,-0.30,0.585);
scopeGroup.add(jackCh2);
registerPart(jackCh2,'Entrada CH2 (BNC) · CAN_L','Conector del canal 2. Trae la señal de la línea CAN_L desde el conector de diagnóstico.','#4fd1c5');

const busLed=new THREE.Mesh(new THREE.SphereGeometry(0.035,12,12),MAT.busLed);
busLed.position.set(0.85,0.62,0.585);
scopeGroup.add(busLed);
registerPart(busLed,'Indicador de actividad del bus','Se enciende cuando la sonda está conectada y el osciloscopio está observando el bus.','#3ad9c2');

/* ---------- 7) PUNTAS DE PRUEBA (osciloscopio → conector de diagnóstico) ---------- */
const probeH=cableTube([[-0.75,0.55,2.185],[-0.4,0.75,1.4],[-0.07,0.50,0.15]],0.026,MAT.wireH);
registerPart(probeH,'Punta de prueba CH1','Cable que lleva la señal de CAN_H desde el conector de diagnóstico hasta la entrada CH1.','#ffd166');

const probeL=cableTube([[-0.55,0.55,2.185],[-0.2,0.72,1.4],[0.07,0.50,0.15]],0.026,MAT.wireL);
registerPart(probeL,'Punta de prueba CH2','Cable que lleva la señal de CAN_L desde el conector de diagnóstico hasta la entrada CH2.','#4fd1c5');

/* ---------- 8) RENDERIZADO DE PANTALLA ---------- */
const DIVX=10, DIVY=8;
const BIT_US=2, V_CENTER=2.5, V_PER_DIV=0.5;
const BITS_HEALTHY=[1,0,0,1,0,1,1,0,0,1]; // 1=recesivo 0=dominante — patrón ilustrativo, no una trama real decodificada
const ARB_DIVERGE_IDX=4; // nodo B pierde el arbitraje aquí (quería recesivo, el bus ya era dominante)

function drawGrid(ctx,W,H){
  ctx.strokeStyle='#123028'; ctx.lineWidth=1;
  const stepX=W/DIVX, stepY=H/DIVY;
  for(let i=1;i<DIVX;i++){ ctx.beginPath(); ctx.moveTo(i*stepX,0); ctx.lineTo(i*stepX,H); ctx.stroke(); }
  for(let j=1;j<DIVY;j++){ ctx.beginPath(); ctx.moveTo(0,j*stepY); ctx.lineTo(W,j*stepY); ctx.stroke(); }
  ctx.strokeStyle='#1d4a3c'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
}
function yFor(v,H){ return H/2-((v-V_CENTER)/V_PER_DIV)*(H/DIVY); }
function levelsFor(bit){ return bit===0?{h:3.5,l:1.5}:{h:2.5,l:2.5}; }
function sampleLevels(tUs,bits,mode){
  const bitIdx=Math.min(bits.length-1,Math.floor(tUs/BIT_US));
  const tInBit=tUs-bitIdx*BIT_US;
  const bit=bits[bitIdx];
  let {h,l}=levelsFor(bit);
  if(mode==='sin_term'){
    const prevBit=bitIdx>0?bits[bitIdx-1]:bit;
    if(prevBit!==bit){
      const x=tInBit/BIT_US;
      const ring=0.5*Math.exp(-3.0*x)*Math.cos(2*Math.PI*4.5*x);
      h+=ring; l-=ring;
    }
  } else if(mode==='corto'){
    const noise=0.04*Math.sin(tUs*37.0)+0.02*Math.sin(tUs*91.3+1.7);
    h=2.5+noise; l=2.5+noise;
  }
  return {h,l};
}
function drawCanTrace(ctx,W,H,bits,mode,colorH,colorL){
  const totalUs=bits.length*BIT_US;
  const N=400;
  ctx.lineWidth=2.2;
  ctx.strokeStyle=colorL;
  ctx.beginPath();
  for(let i=0;i<=N;i++){
    const tUs=(i/N)*totalUs;
    const {l}=sampleLevels(tUs,bits,mode);
    const x=(i/N)*W, y=Math.max(2,Math.min(H-2,yFor(l,H)));
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
  ctx.strokeStyle=colorH;
  ctx.beginPath();
  for(let i=0;i<=N;i++){
    const tUs=(i/N)*totalUs;
    const {h}=sampleLevels(tUs,bits,mode);
    const x=(i/N)*W, y=Math.max(2,Math.min(H-2,yFor(h,H)));
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
}
function drawArbitrationGhost(ctx,W,H,totalUs){
  const tUs=ARB_DIVERGE_IDX*BIT_US+BIT_US*0.5;
  const x=(tUs/totalUs)*W;
  const yDom=yFor(3.5,H), yRec=yFor(2.5,H);
  ctx.save();
  ctx.setLineDash([4,3]);
  ctx.strokeStyle='#b98cff';
  ctx.lineWidth=1.8;
  ctx.beginPath(); ctx.moveTo(x,yDom); ctx.lineTo(x,yRec); ctx.stroke();
  ctx.restore();
  ctx.beginPath(); ctx.arc(x,yRec,3,0,Math.PI*2); ctx.fillStyle='#b98cff'; ctx.fill();
  ctx.font='9px monospace'; ctx.fillStyle='#b98cff'; ctx.textAlign='center';
  ctx.fillText('nodo B se retira',x,yRec-8);
  ctx.textAlign='left';
}
function effectiveModeFor(){
  if(scenarioKey==='sin_term' && terminadoBRemoved) return 'sin_term';
  if(scenarioKey==='corto' && cortoActivo) return 'corto';
  return 'sano';
}
function updateScreen(){
  const ctx=scrCanvas.getContext('2d');
  const W=scrCanvas.width, H=scrCanvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#03110c'; ctx.fillRect(0,0,W,H);
  if(!energized){ scrTex.needsUpdate=true; return; }
  drawGrid(ctx,W,H);
  const bits=BITS_HEALTHY;
  const totalUs=bits.length*BIT_US;
  drawCanTrace(ctx,W,H,bits,effectiveModeFor(),'#ffd166','#4fd1c5');
  if(scenarioKey==='arbitraje' && showGhost){
    drawArbitrationGhost(ctx,W,H,totalUs);
  }
  scrTex.needsUpdate=true;
}

/* ---------- 9) INSPECCIÓN POR CLIC ---------- */
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit) return;
  let o=hit.object;
  while(o){
    const p=PARTS.find(x=>x.mesh===o);
    if(p){ showToast(`<b style="color:var(--accent)">${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.desc}</span>`); return; }
    o=o.parent;
  }
});

/* ---------- 10) ETIQUETAS HOVER ---------- */
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

/* ---------- 11) MODELO DE DATOS ---------- */
const SCEN_ORDER=['sano','sin_term','corto','arbitraje'];
const SCEN_LABEL={
  sano:'Caso 1 · Bus sano',
  sin_term:'Caso 2 · Terminador faltante',
  corto:'Caso 3 · Cortocircuito',
  arbitraje:'Caso 4 · Arbitraje',
};
const QUESTIONS={
  sano:{
    prompt:'En un bus CAN sano, ¿qué combinación de voltajes esperas ver en CAN_H y CAN_L durante un bit dominante?',
    opts:[
      {t:'CAN_H ≈ 0 V y CAN_L ≈ 5 V',ok:false},
      {t:'CAN_H ≈ 3.5 V y CAN_L ≈ 1.5 V (diferencial ≈ 2 V)',ok:true},
      {t:'Ambas líneas en ≈2.5 V, sin diferencial',ok:false},
      {t:'CAN_H y CAN_L siempre son iguales, nunca hay diferencial',ok:false},
    ],
  },
  sin_term:{
    prompt:'Quitaste el terminador de 120 Ω del extremo B y cada flanco muestra ahora una oscilación amortiguada antes de asentarse. ¿A qué se debe?',
    opts:[
      {t:'A un cortocircuito entre CAN_H y CAN_L',ok:false},
      {t:'A que el osciloscopio necesita recalibrarse',ok:false},
      {t:'A una impedancia sin adaptar en ese extremo: la señal se refleja y "rebota" antes de asentarse',ok:true},
      {t:'Es el comportamiento normal de cualquier trama CAN, con o sin terminador',ok:false},
    ],
  },
  corto:{
    prompt:'CAN_H y CAN_L se mantienen prácticamente iguales todo el tiempo, sin importar qué se transmita, y la diferencial nunca se separa de ≈0 V. ¿Qué falla es más probable?',
    opts:[
      {t:'Falta un terminador en un extremo',ok:false},
      {t:'Cortocircuito entre CAN_H y CAN_L',ok:true},
      {t:'Arbitraje normal entre dos nodos',ok:false},
      {t:'El bus está sano, solo hay poco tráfico',ok:false},
    ],
  },
  arbitraje:{
    prompt:'La trama parece cortarse antes de tiempo. ¿Es necesariamente un error de bus?',
    opts:[
      {t:'Sí, es una trama truncada por un error de bus',ok:false},
      {t:'Sí, es un cortocircuito intermitente',ok:false},
      {t:'No — es arbitraje normal: el nodo que transmitía recesivo detectó dominante en el bus, perdió y dejó de transmitir sin generar ningún error',ok:true},
      {t:'No se puede saber sin un analizador de protocolo',ok:false},
    ],
  },
};
const DX_HINT={
  sano:'En reposo (recesivo) ambas líneas convergen a ≈2.5 V — diferencial ≈0 V. Al transmitir un bit dominante, los transceptores separan las líneas: CAN_H sube a ≈3.5 V y CAN_L baja a ≈1.5 V, dando una diferencial ≈2 V que el receptor decodifica como "0" lógico.',
  sin_term:'Un bus CAN es una línea de transmisión que debe verse cerrada en ≈120 Ω en cada extremo. Sin esa terminación, la impedancia queda sin adaptar y cada flanco se refleja en el extremo abierto, sumándose a la señal como una oscilación que decae (ringing) antes de asentarse en el nivel final.',
  corto:'Si CAN_H y CAN_L quedan unidas eléctricamente en cualquier punto del arnés, ningún transceptor puede desarrollar la diferencial de ≈2 V que codifica un bit dominante — las dos líneas quedan "pegadas" cerca de un mismo potencial y el bus deja de comunicar.',
  arbitraje:'CAN resuelve colisiones bit a bit sin destruir la trama (arbitraje no destructivo, prioridad por identificador numéricamente más bajo). Si un nodo transmitió recesivo pero lee dominante en el bus, perdió el arbitraje, deja de transmitir de inmediato y reintentará cuando el bus quede libre — no se reporta como falla.',
};

let scenarioKey='sano';
let energized=false;
let terminadoBRemoved=false;
let cortoActivo=false;
let showGhost=false;
const answered={sano:false,sin_term:false,corto:false,arbitraje:false};

/* ---------- 12) ANIMACIÓN ---------- */
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:2200,Q:0.7});
S.setAnimate((dt,time)=>{
  const tx=terminadoBRemoved?TERM_REMOVED[0]:TERM_SEATED[0];
  const ty=terminadoBRemoved?TERM_REMOVED[1]:TERM_SEATED[1];
  const tz=terminadoBRemoved?TERM_REMOVED[2]:TERM_SEATED[2];
  const trz=terminadoBRemoved?TERM_REMOVED_ROTZ:0;
  termBGroup.position.x+=(tx-termBGroup.position.x)*Math.min(1,dt*4);
  termBGroup.position.y+=(ty-termBGroup.position.y)*Math.min(1,dt*4);
  termBGroup.position.z+=(tz-termBGroup.position.z)*Math.min(1,dt*4);
  termBGroup.rotation.z+=(trz-termBGroup.rotation.z)*Math.min(1,dt*4);

  const pulse=0.5+0.5*Math.sin(time*3.2);
  busLed.material.emissiveIntensity = !energized?0.05:(0.5+0.3*pulse);

  if(time-(updateScreen._t||0)>0.22){ updateScreen(); updateScreen._t=time; }

  const freqNow={sano:440,sin_term:620,corto:180,arbitraje:500}[scenarioKey];
  synth.update(freqNow,freqNow,energized?0.03:0,2200);
});

/* ---------- 13) HUD ---------- */
document.getElementById('hud').innerHTML=`
<div class="eyebrow">Dominio D10 · Instrumentación</div>
<h2>Bus CAN y Diagnóstico con Osciloscopio</h2>
<p>Un bus <b>CAN</b> conecta decenas de módulos con solo 2 cables. No hay un voltaje fijo "correcto": lo que el osciloscopio muestra es una <b>diferencial</b> entre CAN_H y CAN_L que alterna entre dos estados — recesivo y dominante. Los 4 casos comparten la misma trama intentada; lo que cambia es el estado físico del bus.</p>
<div class="formula">V_dif = V(CAN_H) − V(CAN_L)<br>Recesivo ≈ 0 V (≈2.5 V / ≈2.5 V) · Dominante ≈ 2 V (≈3.5 V / ≈1.5 V)<br>Terminación de referencia: 120 Ω en cada extremo del bus</div>
<div class="legend">
  <div class="li"><span class="dot" style="background:#ffd166"></span>CAN_H</div>
  <div class="li"><span class="dot" style="background:#4fd1c5"></span>CAN_L</div>
  <div class="li"><span class="dot" style="background:#b98cff"></span>Nodo perdedor (fantasma, Caso 4)</div>
</div>
<div class="fid">
  <div class="ft">🔒 Contrato de fidelidad</div>
  <div class="fl"><b>Sí modela:</b> la codificación diferencial recesivo/dominante de CAN de alta velocidad, la firma eléctrica de una terminación faltante (reflexión/ringing) frente a un bus cerrado en 120 Ω por extremo, la firma de un cortocircuito CAN_H–CAN_L (diferencial que no se desarrolla), y el arbitraje bit a bit no destructivo por prioridad de identificador.</div>
  <div class="fl no"><b>NO modela:</b> la decodificación real de campos de una trama (identificador, DLC, datos, CRC, ACK) bit a bit — el patrón en pantalla es ilustrativo, no una trama decodificada de un vehículo real —, bit-stuffing, tiempos de propagación por longitud de arnés, ni curvas de un transceptor comercial específico.</div>
</div>
<div class="src">Ref: Bosch CAN 2.0 (arbitraje) · ISO 11898-2 (capa física — norma de acceso restringido, verificada por fuentes secundarias que la citan) · TI SLLA270, Microchip AN228 (terminación y reflexiones) — consulta la hoja de datos de tu transceptor.</div>
`;

/* ---------- 14) PANEL ---------- */
document.getElementById('panel').innerHTML=`
<h4>Bus CAN · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span> · <span id="p_progress" style="color:var(--dim);font-size:11px">0/4 ✔</span></h4>
<div class="modebar">
  <button class="b on" id="s_sano">Bus sano</button>
  <button class="b" id="s_sin_term">Sin terminador</button>
  <button class="b" id="s_corto">Corto circuito</button>
  <button class="b" id="s_arbitraje">Arbitraje</button>
</div>
<div class="console" id="console">Pulsa "🔌 Conectar sonda al bus" para iniciar.</div>
<div id="tele">
  <div class="g"><div class="gl"><span>Estado del bus</span><b id="t_estado">—</b></div></div>
  <div class="g"><div class="gl"><span>V(CAN_H)</span><b id="t_vh">—</b></div></div>
  <div class="g"><div class="gl"><span>V(CAN_L)</span><b id="t_vl">—</b></div></div>
  <div class="g"><div class="gl"><span>V diferencial (H−L)</span><b id="t_vdiff">—</b></div></div>
  <div class="g"><div class="gl"><span>Terminación</span><b id="t_term">—</b></div></div>
</div>

<div id="ctrlSinTerm" style="display:none">
  <h4 class="sec">Terminador · extremo B</h4>
  <div class="btns"><button class="b" id="btnTerm">🔧 Quitar terminador</button></div>
</div>
<div id="ctrlCorto" style="display:none">
  <h4 class="sec">Falla</h4>
  <div class="btns"><button class="b" id="btnCorto">⚡ Provocar corto</button></div>
</div>
<div id="ctrlArb" style="display:none">
  <h4 class="sec">Nodo perdedor</h4>
  <div class="btns"><button class="b" id="btnGhost">👻 Mostrar qué transmitía el nodo B</button></div>
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
  <button class="b primary" id="btnEnergize">🔌 Conectar sonda al bus</button>
  <button class="b" id="btnNext">🔀 Siguiente caso</button>
</div>
`;

/* ---------- 15) HELPERS DE UI ---------- */
const el=id=>document.getElementById(id);
const consoleEl=el('console');

function setConsole(){
  if(!energized){
    consoleEl.innerHTML=`Sonda desconectada. Pulsa <span style="color:var(--accent)">"🔌 Conectar sonda al bus"</span> para ver las líneas CAN_H/CAN_L.`;
    return;
  }
  const desc={
    sano:'Bus de referencia: dos nodos, ambos extremos terminados en ~120 Ω. Así se ve un bus CAN sano.',
    sin_term:'Mismo tráfico — quitaste el terminador del extremo B. Observa qué le pasa a cada flanco.',
    corto:'Mismo tráfico intentado — CAN_H y CAN_L están en corto en el conector de diagnóstico.',
    arbitraje:'Dos nodos transmiten a la vez. Uno de ellos pierde el arbitraje y se retira sin generar ningún error.',
  }[scenarioKey];
  consoleEl.innerHTML=`<b>${SCEN_LABEL[scenarioKey]}</b><br>${desc}`;
}

function updateTele(){
  if(!energized){
    ['t_estado','t_vh','t_vl','t_vdiff','t_term'].forEach(id=>{ el(id).textContent='—'; el(id).className=''; });
    return;
  }
  if(scenarioKey==='sano'){
    el('t_estado').textContent='Comunicando'; el('t_estado').className='good';
    el('t_vh').textContent='2.5 V ↔ 3.5 V'; el('t_vh').className='good';
    el('t_vl').textContent='1.5 V ↔ 2.5 V'; el('t_vl').className='good';
    el('t_vdiff').textContent='≈0 V ↔ ≈2 V'; el('t_vdiff').className='good';
    el('t_term').textContent='Ambos extremos, ≈120 Ω c/u'; el('t_term').className='good';
  } else if(scenarioKey==='sin_term'){
    const r=terminadoBRemoved;
    el('t_estado').textContent = r?'Comunicando, con ringing':'Comunicando'; el('t_estado').className = r?'warn':'good';
    el('t_vh').textContent = r?'2.5 V ↔ ~4.0 V (con sobreoscilación)':'2.5 V ↔ 3.5 V'; el('t_vh').className = r?'warn':'good';
    el('t_vl').textContent = r?'~1.0 V ↔ 2.5 V (con sobreoscilación)':'1.5 V ↔ 2.5 V'; el('t_vl').className = r?'warn':'good';
    el('t_vdiff').textContent = r?'≈0 V ↔ ≈2 V, con rebote en cada flanco':'≈0 V ↔ ≈2 V'; el('t_vdiff').className = r?'warn':'good';
    el('t_term').textContent = r?'Falta el extremo B (abierto)':'Ambos extremos, ≈120 Ω c/u'; el('t_term').className = r?'bad':'good';
  } else if(scenarioKey==='corto'){
    const a=cortoActivo;
    el('t_estado').textContent = a?'Sin comunicación':'Comunicando'; el('t_estado').className = a?'bad':'good';
    el('t_vh').textContent = a?'~2.5 V (fija)':'2.5 V ↔ 3.5 V'; el('t_vh').className = a?'bad':'good';
    el('t_vl').textContent = a?'~2.5 V (fija)':'1.5 V ↔ 2.5 V'; el('t_vl').className = a?'bad':'good';
    el('t_vdiff').textContent = a?'≈0 V constante (no se desarrolla)':'≈0 V ↔ ≈2 V'; el('t_vdiff').className = a?'bad':'good';
    el('t_term').textContent = a?'Cortocircuito CAN_H–CAN_L':'Ambos extremos, ≈120 Ω c/u'; el('t_term').className = a?'bad':'good';
  } else if(scenarioKey==='arbitraje'){
    el('t_estado').textContent='Arbitraje en curso (normal)'; el('t_estado').className='good';
    el('t_vh').textContent='2.5 V ↔ 3.5 V'; el('t_vh').className='good';
    el('t_vl').textContent='1.5 V ↔ 2.5 V'; el('t_vl').className='good';
    el('t_vdiff').textContent='≈0 V ↔ ≈2 V'; el('t_vdiff').className='good';
    el('t_term').textContent='Ambos extremos, ≈120 Ω c/u'; el('t_term').className='good';
  }
}

function refreshCaseLabel(){ el('p_case').textContent='Caso '+(SCEN_ORDER.indexOf(scenarioKey)+1)+'/4'; }
function refreshProgress(){ const n=Object.values(answered).filter(Boolean).length; el('p_progress').textContent=n+'/4 ✔'; }
function clearDx(){ document.querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong')); }
function renderQuestion(){
  const q=QUESTIONS[scenarioKey];
  const qEl=el('q_prompt');
  qEl.textContent=q.prompt;
  qEl.style.textTransform='none'; // uppercase would turn "µs" into "Ms" (Griega mu ≈ Latina M)
  document.querySelectorAll('#dxWrap .b.dx').forEach((btn,i)=>{
    const o=q.opts[i];
    btn.textContent=String.fromCharCode(65+i)+' · '+o.t;
    btn.dataset.ok=o.ok?'1':'0';
  });
}

/* ---------- 16) INTERACCIÓN ---------- */
function applyTermState(){
  const btn=el('btnTerm');
  if(btn) btn.textContent = terminadoBRemoved?'🔌 Reponer terminador':'🔧 Quitar terminador';
  termBPart.desc = terminadoBRemoved
    ? 'Retirado: el extremo B queda sin adaptación de impedancia — cada flanco se refleja y "rebota" antes de asentarse.'
    : 'Presente: cierra el extremo B del bus en ~120 Ω, la impedancia característica de referencia del par trenzado.';
  updateTele();
}
function applyCortoState(){
  const btn=el('btnCorto');
  if(btn) btn.textContent = cortoActivo?'⚡ Quitar corto':'⚡ Provocar corto';
  setInspectable(jumperMesh,cortoActivo);
  updateTele();
}
function applyGhostState(){
  const btn=el('btnGhost');
  if(btn) btn.textContent = showGhost?'👻 Ocultar nodo fantasma':'👻 Mostrar qué transmitía el nodo B';
}

function setScenario(key){
  scenarioKey=key;
  clearDx();
  terminadoBRemoved=(key==='sin_term');
  cortoActivo=(key==='corto');
  showGhost=false;
  ['s_sano','s_sin_term','s_corto','s_arbitraje'].forEach(id=>el(id).classList.toggle('on',id==='s_'+key));
  el('ctrlSinTerm').style.display = key==='sin_term'?'':'none';
  el('ctrlCorto').style.display = key==='corto'?'':'none';
  el('ctrlArb').style.display = key==='arbitraje'?'':'none';
  applyTermState();
  applyCortoState();
  applyGhostState();
  renderQuestion();
  refreshCaseLabel();
  setConsole();
}

el('s_sano').onclick=()=>setScenario('sano');
el('s_sin_term').onclick=()=>setScenario('sin_term');
el('s_corto').onclick=()=>setScenario('corto');
el('s_arbitraje').onclick=()=>setScenario('arbitraje');

el('btnTerm').onclick=()=>{ terminadoBRemoved=!terminadoBRemoved; applyTermState(); synth.beep(terminadoBRemoved?300:660,0.1,0.05); };
el('btnCorto').onclick=()=>{ cortoActivo=!cortoActivo; applyCortoState(); synth.beep(cortoActivo?180:660,0.1,0.05); };
el('btnGhost').onclick=()=>{ showGhost=!showGhost; applyGhostState(); synth.beep(showGhost?880:440,0.08,0.04); };

document.querySelectorAll('#dxWrap .b.dx').forEach(btn=>{
  btn.onclick=()=>{
    if(!energized){ showToast('Primero conecta la sonda al bus.'); return; }
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
      showToast(`<span style="color:var(--bad)">✗ No es correcta.</span><br><span style="color:var(--dim);font-size:11px">Revisa la pantalla y el estado actual del bus, luego inténtalo de nuevo.</span>`);
    }
  };
});

el('btnEnergize').onclick=(e)=>{
  energized=!energized;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',energized);
  e.target.textContent=energized?'⏻ Desconectar sonda':'🔌 Conectar sonda al bus';
  if(energized){
    S.moveTo([3.0,2.4,5.0],[0.05,0.95,1.3],1.3);
    S.setCinematicIdle(true);
    synth.beep(660,0.1,0.06);
  } else {
    S.setCinematicIdle(false);
  }
  setConsole();
  updateTele();
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
    if(!energized){ showToast('Paso 1 · Conectando la sonda al bus…'); el('btnEnergize').click(); await sleep(1600); }
    showToast('Paso 2 · Bus sano: CAN_H y CAN_L convergen en reposo (~2.5 V) y se separan ~2 V en cada bit dominante.'); await sleep(2800);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    setScenario('sin_term');
    showToast('Paso 3 · Quitaste el terminador del extremo B: cada flanco ahora "rebota" (ringing) antes de asentarse.'); await sleep(2800);
    el('btnTerm').click(); showToast('Paso 4 · Repones el terminador — el rebote desaparece de inmediato.'); await sleep(2600);
    el('btnTerm').click(); showToast('Paso 5 · Lo vuelves a quitar: el efecto es atribuible a la terminación faltante.'); await sleep(2600);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    setScenario('corto');
    showToast('Paso 6 · CAN_H y CAN_L en corto: la diferencial nunca se desarrolla, sin importar qué se intente transmitir.'); await sleep(2800);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    setScenario('arbitraje');
    showToast('Paso 7 · Dos nodos transmiten a la vez. Antes de revelar nada: ¿esto te parece un error de bus?'); await sleep(2800);
    el('btnGhost').click(); showToast('Paso 8 · El nodo B transmitía recesivo justo donde el bus ya era dominante — perdió el arbitraje y se retiró sin generar ningún error.'); await sleep(3000);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    showToast('<span style="color:var(--good)">✔ Fin de la demostración: mismo tráfico intentado, cuatro resultados eléctricos distintos según el estado físico del bus.</span>');
  } finally {
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    autoRunning=false;
  }
}
el('btnAuto').onclick=runAuto;

/* ---------- 17) INIT ---------- */
setScenario('sano');
refreshProgress();
S.start();
