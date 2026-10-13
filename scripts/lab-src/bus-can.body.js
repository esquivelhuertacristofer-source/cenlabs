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
const S=createStage(mount,{cam:[3.2,2.4,4.1],target:[0,0.5,-0.25],bgTop:'#0a1620',bgBot:'#03060a',bloom:0.38,minD:3.2,maxD:16});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.08,0.09,0.11), rub=rubber();
const MAT={
  bench: std({...plas, metalness:0.15, roughness:0.75}),
  nodeBody: std({...plas, color:0x1c2230, metalness:0.3, roughness:0.55}),
  termBody: std({color:0xcda876, roughness:0.55, metalness:0.05}),
  wireH: std({...rub, color:0xb88a14, roughness:0.72, metalness:0.0}),
  wireL: std({...rub, color:0x1d8394, roughness:0.72, metalness:0.0}),
  tapBody: std({color:0x20262d, metalness:0.12, roughness:0.52}),
  tapPinH: std({...brush, color:0xe0b23c, metalness:0.85, roughness:0.3}),
  tapPinL: std({...brush, color:0x3fb8c9, metalness:0.85, roughness:0.3}),
  jumper: std({color:0x2a0d0d, emissive:0xff3b30, emissiveIntensity:0.7, roughness:0.4, metalness:0.2}),
  scopeBody: std({...plas, color:0x1c2230, metalness:0.35, roughness:0.55}),
  jackCh1: std({...brush, color:0xe0b23c, metalness:0.85, roughness:0.3}),
  jackCh2: std({...brush, color:0x3fb8c9, metalness:0.85, roughness:0.3}),
  busLed: std({color:0x0a1210, emissive:0x3ad9c2, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
  knobGrip: std({...rub, color:0x39424b, roughness:0.82, metalness:0.06}),
  cableSonda: std({...rub, color:0x15181c, roughness:0.85, metalness:0.0}),
};

/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio: std({...alu, color:0x9aa4ad, roughness:0.50, metalness:0.80, normalScale:new THREE.Vector2(0.28,0.28)}),
  acero:    std({...brush, color:0x8d959c, roughness:0.38, metalness:0.80}),
  cromo:    std({...brush, color:0xc9d1d6, roughness:0.22, metalness:0.90}),
  chapa:    std({...brush, color:0x7f878e, roughness:0.45, metalness:0.75}),
  cobre:    std({color:0xb87333, roughness:0.35, metalness:0.75}),
  negro:    std({...plas, color:0x14181e, roughness:0.62, metalness:0.06}),
  goma:     std({...rub, color:0x14181e, roughness:0.82, metalness:0.02}),
  blanco:   std({color:0xd7dee6, roughness:0.42, metalness:0.15}),
  ceramica: std({color:0xd7dee6, roughness:0.60, metalness:0.05}),
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

/* ---------- 1) MESA DE TALLER ---------- */
/* La mesa de un laboratorio de diagnóstico: chapa de acero con su canto y un
   tapete antiestático de rombos, no una losa gris. Es más corta que antes —el
   bus mide lo que mide— para que el montaje llene el encuadre en vez de
   perderse en un tablero vacío. La cara del tapete queda en y = 0,12. */
const MESA_Y=0.12;
const bench=P3.mesaTaller(MATP,{ancho:5.5,fondo:3.3});
bench.position.set(0,MESA_Y,-0.1);
scene.add(bench);

/* Medidas del montaje (una sola vez, para que nodos, terminadores y bus
   concuerden): los nodos a ±XN, la altura del eje del bus y la ECU. */
const XN=2.1, YB=0.36, ECU_AN=0.86, ECU_AL=0.48, ECU_FO=0.66, CAN_FO=0.12;

/* ---------- 2) NODO A (extremo izquierdo, terminador fijo) ---------- */
const nodeAGroup=new THREE.Group(); nodeAGroup.position.set(-XN,YB,0); scene.add(nodeAGroup);
/* LOS NODOS SON ECU, no cajas: carcasa de aluminio fundido con sus aletas, sus
   orejas de fijación y —lo que de verdad importa en un laboratorio de
   diagnóstico— los CONECTORES SELLADOS del mazo. Los dos laterales son los de
   potencia y sensores del módulo; el CENTRAL, el pequeño de dos vías, es por el
   que entra el bus: CAN_H y CAN_L, que es lo que lleva una derivación CAN. Un
   taco negro liso no dice por dónde se desenchufa nada, y desenchufar es justo
   lo que se hace para aislar un tramo. La boca de los conectores mira al bus:
   `rotation.y = ±pi/2` manda su cara (local +Z) al ±X del mundo. */
function ecuNodo(){
  return P3.ecuAutomotriz(MATP,{ancho:ECU_AN,alto:ECU_AL,fondo:ECU_FO,aletas:10,
    rotulo:'ECM · CAN-HS\n12 V · 0 281 0XX',
    conectores:[
      {x:-0.31,ancho:0.25,alto:0.32,cols:3,filas:3,fondo:0.10,cables:5},
      {x:0,ancho:0.17,alto:0.20,cols:2,filas:1,fondo:CAN_FO,pines:true},
      {x:0.31,ancho:0.25,alto:0.32,cols:3,filas:3,fondo:0.10,cables:4},
    ]});
}
const nodeABody=ecuNodo();
nodeABody.rotation.y=Math.PI/2;
nodeAGroup.add(nodeABody);
registerPart(nodeABody,'Nodo A (extremo izquierdo)','Un módulo cualquiera del bus (p. ej. una ECU) en el extremo izquierdo. Su terminador de 120 Ω permanece siempre conectado en este laboratorio — es el terminador del extremo B (Caso 2) el que se retira.','#8fb3ac');

/* EL TERMINADOR NO ES UN PALO: es un TAPÓN que se enchufa en el conector del
   nodo y que dentro no lleva más que UNA RESISTENCIA. Se dibuja con la
   resistencia a la vista —un tapón real la lleva encapsulada— porque es lo
   único que hay que entender de él: sus bandas marrón-rojo-marrón-oro se leen
   1-2-×10 ±5 % = 120 Ω ±5 %, exactamente la cifra que el panel llama
   «terminación de referencia». Con un cilindro liso, el terminador era un
   objeto que había que creerse; así se puede comprobar. */
function terminador(){
  const g=new THREE.Group();
  const caja=P3.conectorMultipin(MATP,{ancho:0.24,alto:0.18,fondo:0.20,cols:2,filas:1,pines:false,
    color:0x2a2f36,llave:0xd9a21b});
  caja.rotation.y=-Math.PI/2;                 // su boca mira al nodo (−X)
  g.add(caja);
  const res=P3.resistencia(MATP,{largo:0.17,d:0.058,patas:0.055,paso:0.20,
    bandas:[0x7a4a1e,0xb03a2e,0x7a4a1e,0xc9a227]});
  res.position.set(0,0.125,0);
  g.add(res);
  return g;
}
const TERM_X=ECU_FO/2+CAN_FO+0.10+0.012;      // el centro del tapón, a ras del conector del nodo
const termA=terminador();
termA.position.set(TERM_X,0,0);
nodeAGroup.add(termA);
registerPart(termA,'Terminador 120 Ω (extremo A)','Cierra el extremo A del bus en ~120 Ω, la impedancia característica de referencia del par trenzado. Permanece siempre conectado en este laboratorio.','#ffd166');

/* ---------- 3) NODO B (extremo derecho, terminador removible) ---------- */
const nodeBGroup=new THREE.Group(); nodeBGroup.position.set(XN,YB,0); scene.add(nodeBGroup);
const nodeBBody=ecuNodo();
nodeBBody.rotation.y=-Math.PI/2;
nodeBGroup.add(nodeBBody);
registerPart(nodeBBody,'Nodo B (extremo derecho)','Un segundo módulo en el extremo opuesto del bus. Su terminador de 120 Ω es el que se retira en el Caso 2 para mostrar el efecto de una terminación faltante.','#8fb3ac');

const TERM_SEATED=[-TERM_X,0,0], TERM_REMOVED=[-TERM_X+0.12,0.30,0.40], TERM_REMOVED_ROTZ=0.6;
const termBGroup=new THREE.Group();
termBGroup.position.set(TERM_SEATED[0],TERM_SEATED[1],TERM_SEATED[2]);
nodeBGroup.add(termBGroup);
const termBMesh=terminador();
termBMesh.rotation.y=Math.PI;                 // en el extremo B la boca mira al otro lado
termBGroup.add(termBMesh);
const termBPart=registerPart(termBGroup,'Terminador 120 Ω (extremo B)','Presente: cierra el extremo B del bus en ~120 Ω.','#ffd166');

/* ---------- 4) BUS — LÍNEAS CAN_H / CAN_L ---------- */
function cableTube(points,radius,mat){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,8,false),mat);
  scene.add(m);
  return m;
}
/* EL PAR TRENZADO, TRENZADO. Dos cables paralelos no son un par trenzado, y la
   diferencia no es estetica: es la razon de ser de todo lo que ensena esta
   practica. Al enrollarse uno sobre otro, las dos lineas van alternandose en el
   espacio, de modo que cualquier interferencia externa las alcanza POR IGUAL —y
   la resta CAN_H − CAN_L, que es lo unico que mira el receptor, la borra. Con
   los hilos rectos y separados, el ruido entraria distinto en cada uno y el
   dibujo contradecia la propia lectura diferencial de la pantalla.
   El PASO del trenzado se elige para que se VEA a esta escala; el de un mazo
   real (decenas de vueltas por metro) quedaria como una masa continua. */
function parTrenzado(pts,vueltas,radio,r,matA,matB){
  const eje=new THREE.CatmullRomCurve3(pts.map(q=>new THREE.Vector3(...q)));
  const N=Math.max(120,Math.round(vueltas*20));
  const hilos=[];
  for(const [fase,mat] of [[0,matA],[Math.PI,matB]]){
    const q=[];
    for(let i=0;i<=N;i++){
      const t=i/N, C=eje.getPointAt(t), T=eje.getTangentAt(t).normalize();
      /* Marco estable alrededor del eje: sin el, el trenzado da tirones donde
         la curva cambia de plano. */
      const arr=Math.abs(T.y)>0.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0);
      const n1=new THREE.Vector3().crossVectors(arr,T).normalize();
      const n2=new THREE.Vector3().crossVectors(T,n1).normalize();
      const a=fase+t*Math.PI*2*vueltas;
      q.push(C.clone().addScaledVector(n1,Math.cos(a)*radio)
                      .addScaledVector(n2,Math.sin(a)*radio));
    }
    const m=new THREE.Mesh(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(q,false),N,r,7,false),mat);
    m.castShadow=true; scene.add(m); hilos.push(m);
  }
  return hilos;
}
const XB=XN-TERM_X-0.10;                        // donde acaba el tapón: de ahí sale el par
const [busH,busL]=parTrenzado(
  [[-XB,YB,0],[-XB/2,YB+0.005,0.03],[0,YB+0.01,0],[XB/2,YB+0.005,-0.03],[XB,YB,0]],
  14,0.05,0.026,MAT.wireH,MAT.wireL);
registerPart(busH,'Línea CAN_H (par trenzado)','En reposo (recesivo) está a ≈2.5 V; al transmitir un bit dominante sube a ≈3.5 V. Va trenzada con CAN_L: el trenzado hace que el ruido entre por igual en las dos líneas y desaparezca al restarlas.','#ffd166');
registerPart(busL,'Línea CAN_L (par trenzado)','En reposo (recesivo) está a ≈2.5 V; al transmitir un bit dominante baja a ≈1.5 V. Va trenzada con CAN_H.','#4fd1c5');
/* La funda corrugada y las vueltas de cinta con las que el par sale de cada
   tapón: es como se protege un mazo en un coche, y de paso tapa el punto en el
   que el trenzado se sujeta al conector. */
for(const sx of [-1,1]){
  const funda=P3.arnes(MATP,[[sx*XB,YB,0],[sx*(XB-0.10),YB,0],[sx*(XB-0.20),YB,0]],
    {colores:[0x1a1a1a],r:0.078,funda:[[0,1]],seg:8});
  scene.add(funda);
}

/* ---------- 5) CAJA DE DERIVACIÓN (breakout) + PUENTE DE CORTOCIRCUITO ---------- */
const tapGroup=new THREE.Group();
tapGroup.position.set(0,MESA_Y+0.15,0.02);
scene.add(tapGroup);
/* La caja de derivación del diagnóstico: una carcasa negra de plástico por la
   que pasa el bus (entra por un lado y sale por el otro, con su prensaestopas)
   y que saca CAN_H y CAN_L a dos bornas de 4 mm, la amarilla y la cian, donde se
   pinchan las puntas del osciloscopio sin cortar nada. */
const tapCaja=new THREE.Mesh(P3.extruido(P3.contornoRedondeado(
  [[-0.25,-0.15],[0.25,-0.15],[0.25,0.15],[-0.25,0.15]],0.05,4),{espesor:0.26,bisel:0.02}),MAT.tapBody);
tapCaja.castShadow=true; tapCaja.receiveShadow=true;
tapGroup.add(tapCaja);
for(const sx of [-1,1]){
  const pe=new THREE.Mesh(P3.revolucion([[0,0],[0.085,0],[0.085,0.07],[0.062,0.09],[0.062,0.14],[0,0.14]],{seg:16}),MATP.goma);
  pe.rotation.z=-sx*Math.PI/2; pe.position.set(sx*0.25,0.03,0); pe.castShadow=true; tapGroup.add(pe);
}
// la placa de serigrafía de la tapa: «CAN H / CAN L»
{ const tx=document.createElement('canvas'); tx.width=256; tx.height=64;
  const c=tx.getContext('2d'); c.clearRect(0,0,256,64); c.fillStyle='#e8edf2'; c.font='bold 26px sans-serif';
  c.textAlign='center'; c.textBaseline='middle'; c.fillText('CAN-H',64,34); c.fillText('CAN-L',192,34);
  const t=new THREE.CanvasTexture(tx); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.40,0.10),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:0.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  pl.rotation.x=-Math.PI/2; pl.position.set(0,0.1515,0.07); tapGroup.add(pl); }
for(const sx of [-1,1]) for(const sz of [-1,1]){ const t=P3.tornilloHex(MATP,{d:0.03,largo:0.04,arandela:true}); t.position.set(sx*0.19,0.15,sz*0.09); tapGroup.add(t); }
registerPart(tapCaja,'Conector de diagnóstico','Punto de derivación donde se conectan las puntas del osciloscopio sin interrumpir el bus — como una caja de derivación (breakout box) real.','#5eead4');

const tapPinH=P3.bornaBanana(MATP,{d:0.12,alto:0.07,color:0xd9a21b});
tapPinH.position.set(-0.11,0.15,-0.02);
tapGroup.add(tapPinH);
registerPart(tapPinH,'Derivación CAN_H','Contacto donde la punta CH1 del osciloscopio toma la línea CAN_H.','#ffd166');

const tapPinL=P3.bornaBanana(MATP,{d:0.12,alto:0.07,color:0x2aa3b5});
tapPinL.position.set(0.11,0.15,-0.02);
tapGroup.add(tapPinL);
registerPart(tapPinL,'Derivación CAN_L','Contacto donde la punta CH2 del osciloscopio toma la línea CAN_L.','#4fd1c5');

/* EL PUENTE del caso 3: una clavija doble de 4 mm que une las dos bornas. Es un
   accesorio de prueba, de plástico rojo: no emite luz. Se dibuja sólo para
   señalar el cortocircuito con claridad. */
const jumperMesh=new THREE.Group();
{ const mr=std({color:0xb3261e,roughness:0.5,metalness:0.05});
  const barra=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.30,10),mr);
  barra.rotation.z=Math.PI/2; barra.castShadow=true; jumperMesh.add(barra);
  for(const sx of [-1,1]){
    const cl=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.05,12),mr);
    cl.position.set(sx*0.11,-0.035,0); jumperMesh.add(cl);
    const pu=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.07,8),MATP.cromo);
    pu.position.set(sx*0.11,-0.085,0); jumperMesh.add(pu); }
  jumperMesh.position.set(0,0.15+0.07+0.05,-0.02); tapGroup.add(jumperMesh); }
registerPart(jumperMesh,'Puente de cortocircuito (Caso 3)','Representa un cortocircuito entre CAN_H y CAN_L en algún punto del arnés — en la realidad puede ocurrir en cualquier tramo; se dibuja aquí solo para señalarlo con claridad.','#ff6b6b');
setInspectable(jumperMesh,false);

/* ---------- 6) OSCILOSCOPIO ---------- */
/* El instrumento va APOYADO en la mesa y AL FONDO, mirando al frente: antes
   flotaba 8 cm en el aire con un tercio de la caja fuera del tablero, y en
   primer plano tapaba justo el tramo de bus que la práctica pide mirar.
   Es el osciloscopio de la biblioteca: marco de pantalla rebajado, perillas con
   su rótulo, conectores BNC con el anillo de color de su canal, asa, patas y
   rejilla. */
const scopeBody=P3.osciloscopioBanco(MATP,{ancho:1.9,alto:1.30,fondo:0.90,color:0x232a38,
  pantallaX:-0.34,pantallaY:0.12,visor:[1.05,0.84],teclas:false,
  mandos:[
    {id:'base',x:0.52,y:0.30,r:0.075,rotulo:'s/div'},
    {id:'trig',x:0.79,y:0.30,r:0.075,rotulo:'nivel'},
    {id:'v1',x:0.52,y:-0.10,r:0.075,rotulo:'V/div 1'},
    {id:'v2',x:0.79,y:-0.10,r:0.075,rotulo:'V/div 2'}],
  bnc:[{x:-0.62,color:0xe0b23c,id:'ch1'},{x:-0.30,color:0x3fb8c9,id:'ch2'}],
  led:{x:0.86,y:0.50}});
const scopeGroup=new THREE.Group();
scopeGroup.position.set(0,MESA_Y+scopeBody.userData.apoyo,-1.0);
scopeGroup.add(scopeBody);
scene.add(scopeGroup);
registerPart(scopeBody,'Osciloscopio','Instrumento que dibuja el voltaje de CAN_H y CAN_L contra el tiempo — la única forma de VER directamente la codificación diferencial de CAN.','#5eead4');

const scrCanvas=document.createElement('canvas');
scrCanvas.width=300; scrCanvas.height=240;
const scrTex=new THREE.CanvasTexture(scrCanvas);
scrTex.colorSpace=THREE.SRGBColorSpace;
scrTex.minFilter=THREE.LinearFilter;
scrTex.generateMipmaps=false;
const screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(1.05,0.84),new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false}));
scopeBody.userData.pantalla.add(screenMesh);
registerPart(screenMesh,'Pantalla','Cuadrícula de 10×8 divisiones: cada división horizontal equivale a 2 µs (1 bit a 500 kbit/s); cada división vertical equivale a 0.5 V, centrada en 2.5 V.','#5eead4');

const jackCh1=scopeBody.userData.bnc[0];
registerPart(jackCh1,'Entrada CH1 (BNC) · CAN_H','Conector del canal 1. Trae la señal de la línea CAN_H desde el conector de diagnóstico.','#ffd166');
const jackCh2=scopeBody.userData.bnc[1];
registerPart(jackCh2,'Entrada CH2 (BNC) · CAN_L','Conector del canal 2. Trae la señal de la línea CAN_L desde el conector de diagnóstico.','#4fd1c5');

const busLedG=scopeBody.userData.led;
const busLed={material:busLedG.material};   // el bucle sigue tocando .material
registerPart(busLedG,'Indicador de actividad del bus','Se enciende cuando la sonda está conectada y el osciloscopio está observando el bus.','#3ad9c2');

/* LOS MANDOS del frontal. No cambian el trazo en esta práctica —lo que se
   estudia aquí es el bus, no el manejo del instrumento—, pero un osciloscopio
   sin base de tiempos ni volts/div no es un osciloscopio; se declara en su
   propia ficha de inspección para no fingir que están vivos. */
const MANDOS=scopeBody.userData.mandos;
registerPart(MANDOS.base.grupo,'Perilla base de tiempo','Fija cuántos microsegundos representa cada división horizontal. En esta práctica la pantalla está congelada en 2 µs/div (un bit a 500 kbit/s), el ajuste con el que la trama se lee bit a bit.');
registerPart(MANDOS.trig.grupo,'Perilla nivel de disparo','Define el voltaje al que la señal debe cruzar para que el instrumento congele una imagen estable en vez de un trazo que corre.');
registerPart(MANDOS.v1.grupo,'Perilla volts/div · CH1','Fija cuántos volts representa cada división vertical del canal 1. Aquí, 0.5 V/div centrados en 2.5 V.');
registerPart(MANDOS.v2.grupo,'Perilla volts/div · CH2','Lo mismo para el canal 2, que trae CAN_L.');

/* ---------- 7) SONDAS DE PRUEBA (osciloscopio → bornas de la caja de derivación) ---------- */
/* Dos sondas pasivas de verdad: la CABEZA con su empuñadura y su punta de acero
   apoyada en la borna, y el cable negro que baja a la mesa y vuelve al BNC del
   instrumento con su enchufe. La cabeza se orienta resolviendo dónde cae la
   punta, no a ojo: así sigue tocando la borna si se mueve la caja. */
const Zax=new THREE.Vector3(0,0,1);
function sonda(sx,colorCuerpo,jack,mat){
  const cab=P3.sondaOsciloscopio(MATP,{largo:0.78,d:0.085,color:colorCuerpo});
  cab.scale.setScalar(0.62);
  cab.rotation.set(0,sx<0?0:Math.PI,-1.12);
  cab.position.set(0,0,0); cab.updateMatrixWorld(true);
  const boca=tapGroup.localToWorld(new THREE.Vector3(sx*0.11,0.15+0.07*0.9,-0.02));
  const punta=cab.localToWorld(cab.userData.punta.clone());
  cab.position.copy(boca).sub(punta);
  scene.add(cab);
  cab.updateMatrixWorld(true);
  const sal=cab.localToWorld(cab.userData.salida.clone());
  // el enchufe BNC en el jack del osciloscopio, y el cable hasta la cabeza
  const J=jack.getWorldPosition(new THREE.Vector3());
  const plug=P3.plugBNC(MATP,{d:0.11,largo:0.12}); plug.position.copy(J); scene.add(plug);
  const J1=J.clone().add(new THREE.Vector3(0,0,0.24));
  const cable=cableTube([[J1.x,J1.y,J1.z],[J1.x+sx*0.05,MESA_Y+0.07,J1.z+0.25],[sal.x+sx*0.45,MESA_Y+0.05,sal.z-0.10],[sal.x+sx*0.12,sal.y*0.55+0.04,sal.z-0.04],[sal.x,sal.y,sal.z]],0.020,mat);
  cable.castShadow=true;
  return {cab,cable};
}
const sondaH=sonda(-1,0xb8901c,jackCh1,MAT.cableSonda);
const sondaL=sonda(1,0x1f8a9c,jackCh2,MAT.cableSonda);
const probeH=sondaH.cable, probeL=sondaL.cable;
registerPart(probeH,'Punta de prueba CH1','Cable que lleva la señal de CAN_H desde el conector de diagnóstico hasta la entrada CH1.','#ffd166');
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
      {t:'CAN_H ≈ 0 V y CAN_L ≈ 5 V, con diferencial de ≈ −5 V',ok:false},
      {t:'CAN_H ≈ 3.5 V y CAN_L ≈ 1.5 V (diferencial ≈ 2 V)',ok:true},
      {t:'Ambas líneas en ≈2.5 V, sin ninguna diferencial',ok:false},
      {t:'CAN_H y CAN_L siempre son iguales, nunca hay diferencial',ok:false},
    ],
    extra:[
      {t:'CAN_H ≈ 5 V y CAN_L ≈ 0 V (diferencial ≈ 5 V)',ok:false},
      {t:'CAN_H ≈ 1.5 V y CAN_L ≈ 3.5 V (diferencial ≈ −2 V)',ok:false},
    ],
  },
  sin_term:{
    prompt:'Quitaste el terminador de 120 Ω del extremo B y cada flanco muestra ahora una oscilación amortiguada antes de asentarse. ¿A qué se debe?',
    opts:[
      {t:'A un cortocircuito intermitente entre CAN_H y CAN_L en el conector de diagnóstico',ok:false},
      {t:'A que el osciloscopio perdió su calibración de volts/div y deforma los flancos',ok:false},
      {t:'A una impedancia sin adaptar en ese extremo: la señal se refleja y rebota antes de asentarse',ok:true},
      {t:'Es el comportamiento normal de cualquier trama CAN, con o sin terminador en los extremos',ok:false},
    ],
    extra:[
      {t:'A una falla del transceptor, que genera la oscilación por sí mismo en cada flanco',ok:false},
      {t:'A que la trama perdió el arbitraje y los nodos están reintentando enviarla',ok:false},
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
    extra:[
      {t:'Reflexión por una terminación mal adaptada',ok:false},
      {t:'Acoplamiento CA activado en el osciloscopio',ok:false},
    ],
  },
  arbitraje:{
    prompt:'La trama parece cortarse antes de tiempo. ¿Es necesariamente un error de bus?',
    opts:[
      {t:'Sí: una trama truncada así significa que el nodo transmisor detectó un error de bus y la abortó',ok:false},
      {t:'Sí: es un cortocircuito intermitente entre CAN_H y CAN_L que corta la trama a mitad',ok:false},
      {t:'No: es arbitraje normal; el nodo que mandaba recesivo vio dominante en el bus, perdió y se retiró',ok:true},
      {t:'No se puede saber nada sin conectar un analizador de protocolo que decodifique la trama',ok:false},
    ],
    extra:[
      {t:'Sí: el nodo B está averiado y debe reemplazarse porque dejó la trama incompleta',ok:false},
      {t:'No: es un terminador faltante que acorta la trama al reflejar la señal',ok:false},
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
/* Contabilidad del reto de diagnóstico. Tres fallos seguidos en un caso lo
   resiembran: salen otras opciones (otros distractores del banco) y otro orden,
   para que no se apruebe descartando una a una. */
const fallosCaso={sano:0,sin_term:0,corto:0,arbitraje:0};
const RETO={intentos:0,resiembras:0};

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
    el('t_vh').textContent = r?'2.5 V ↔ 3.5 V, con sobreoscilación en cada flanco':'2.5 V ↔ 3.5 V'; el('t_vh').className = r?'warn':'good';
    el('t_vl').textContent = r?'1.5 V ↔ 2.5 V, con sobreoscilación en cada flanco':'1.5 V ↔ 2.5 V'; el('t_vl').className = r?'warn':'good';
    el('t_vdiff').textContent = r?'≈0 V ↔ ≈2 V, con rebote (y posible inversión breve de polaridad) en cada flanco':'≈0 V ↔ ≈2 V'; el('t_vdiff').className = r?'warn':'good';
    el('t_term').textContent = r?'Falta el extremo B (abierto)':'Ambos extremos, ≈120 Ω c/u'; el('t_term').className = r?'bad':'good';
  } else if(scenarioKey==='corto'){
    const a=cortoActivo;
    const reveal=answered.corto;
    el('t_estado').textContent = a?'Sin comunicación':'Comunicando'; el('t_estado').className = a?'bad':'good';
    el('t_vh').textContent = a?'~2.5 V (fija)':'2.5 V ↔ 3.5 V'; el('t_vh').className = a?'bad':'good';
    el('t_vl').textContent = a?'~2.5 V (fija)':'1.5 V ↔ 2.5 V'; el('t_vl').className = a?'bad':'good';
    el('t_vdiff').textContent = a?'≈0 V constante (no se desarrolla)':'≈0 V ↔ ≈2 V'; el('t_vdiff').className = a?'bad':'good';
    el('t_term').textContent = a?(reveal?'Cortocircuito CAN_H–CAN_L':'Anómala (diagnostica con la pantalla)'):'Ambos extremos, ≈120 Ω c/u'; el('t_term').className = a?'bad':'good';
  } else if(scenarioKey==='arbitraje'){
    const reveal=showGhost||answered.arbitraje;
    el('t_estado').textContent = reveal?'Arbitraje en curso (normal)':'Trama interrumpida — inspecciona antes de concluir'; el('t_estado').className = reveal?'good':'warn';
    el('t_vh').textContent='2.5 V ↔ 3.5 V'; el('t_vh').className='good';
    el('t_vl').textContent='1.5 V ↔ 2.5 V'; el('t_vl').className='good';
    el('t_vdiff').textContent='≈0 V ↔ ≈2 V'; el('t_vdiff').className='good';
    el('t_term').textContent='Ambos extremos, ≈120 Ω c/u'; el('t_term').className='good';
  }
}

function refreshCaseLabel(){ el('p_case').textContent='Caso '+(SCEN_ORDER.indexOf(scenarioKey)+1)+'/4'; }
function refreshProgress(){ const n=Object.values(answered).filter(Boolean).length; el('p_progress').textContent=n+'/4 ✔ · intentos '+RETO.intentos; }
function clearDx(){ document.querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong')); }
function shuffled(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function renderQuestion(){
  const q=QUESTIONS[scenarioKey];
  const qEl=el('q_prompt');
  qEl.textContent=q.prompt;
  qEl.style.textTransform='none'; // uppercase would turn "µs" into "Ms" (Griega mu ≈ Latina M)
  const buenas=q.opts.filter(o=>o.ok), malas=q.opts.filter(o=>!o.ok).concat(q.extra||[]);
  const opts=shuffled(buenas.concat(shuffled(malas).slice(0,3)));
  document.querySelectorAll('#dxWrap .b.dx').forEach((btn,i)=>{
    const o=opts[i];
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
el('btnGhost').onclick=()=>{ showGhost=!showGhost; applyGhostState(); updateTele(); synth.beep(showGhost?880:440,0.08,0.04); };

document.querySelectorAll('#dxWrap .b.dx').forEach(btn=>{
  btn.onclick=()=>{
    if(!energized){ showToast('Primero conecta la sonda al bus.'); return; }
    if(autoRunning) return;                 // la demostración enseña, no puntúa
    if(answered[scenarioKey]){ showToast('Este caso ya está resuelto: pasa al siguiente.'); return; }
    const ok=btn.dataset.ok==='1';
    clearDx();
    RETO.intentos++;
    if(ok){
      btn.classList.add('right');
      answered[scenarioKey]=true;
      fallosCaso[scenarioKey]=0;
      refreshProgress();
      updateTele();
      synth.beep(1046,0.12,0.06);
      showToast(`<span style="color:var(--good)">✔ Correcto</span><br><span style="color:var(--dim);font-size:11px">${DX_HINT[scenarioKey]}</span>`);
    } else {
      btn.classList.add('wrong');
      synth.beep(220,0.15,0.06);
      fallosCaso[scenarioKey]++;
      if(fallosCaso[scenarioKey]>=3){
        fallosCaso[scenarioKey]=0; RETO.resiembras++;
        renderQuestion();
        showToast(`<span style="color:var(--bad)">✗ Tres fallos en este caso.</span><br><span style="color:var(--dim);font-size:11px">Las opciones cambian: vuelve a mirar la pantalla y razona qué explica lo que ves.</span>`);
      } else {
        showToast(`<span style="color:var(--bad)">✗ No es correcta.</span><br><span style="color:var(--dim);font-size:11px">Revisa la pantalla y el estado actual del bus, luego inténtalo de nuevo (fallos en este caso: ${fallosCaso[scenarioKey]}/3).</span>`);
      }
      refreshProgress();
    }
  };
});

el('btnEnergize').onclick=(e)=>{
  energized=!energized;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',energized);
  e.target.textContent=energized?'⏻ Desconectar sonda':'🔌 Conectar sonda al bus';
  if(energized){
    S.moveTo([2.9,2.3,4.4],[0,0.5,-0.35],1.3);
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
  const previo={escenario:scenarioKey,energizado:energized};
  const explica=()=>showToast(`<span style="color:var(--good)">✔ La explicación</span><br><span style="color:var(--dim);font-size:11px">${DX_HINT[scenarioKey]}</span>`);
  try{
    setScenario('sano');
    if(!energized){ showToast('Paso 1 · Conectando la sonda al bus…'); el('btnEnergize').click(); await sleep(1600); }
    showToast('Paso 2 · Bus sano: CAN_H y CAN_L convergen en reposo (~2.5 V) y se separan ~2 V en cada bit dominante.'); await sleep(2800);
    explica(); await sleep(2400);

    setScenario('sin_term');
    showToast('Paso 3 · Quitaste el terminador del extremo B: cada flanco ahora "rebota" (ringing) antes de asentarse.'); await sleep(2800);
    el('btnTerm').click(); showToast('Paso 4 · Repones el terminador — el rebote desaparece de inmediato.'); await sleep(2600);
    el('btnTerm').click(); showToast('Paso 5 · Lo vuelves a quitar: el efecto es atribuible a la terminación faltante.'); await sleep(2600);
    explica(); await sleep(2400);

    setScenario('corto');
    showToast('Paso 6 · CAN_H y CAN_L en corto: la diferencial nunca se desarrolla, sin importar qué se intente transmitir.'); await sleep(2800);
    explica(); await sleep(2400);

    setScenario('arbitraje');
    showToast('Paso 7 · Dos nodos transmiten a la vez. Antes de revelar nada: ¿esto te parece un error de bus?'); await sleep(2800);
    el('btnGhost').click(); showToast('Paso 8 · El nodo B transmitía recesivo justo donde el bus ya era dominante — perdió el arbitraje y se retiró sin generar ningún error.'); await sleep(3000);
    explica(); await sleep(2400);

    showToast('<span style="color:var(--good)">✔ Fin de la demostración: mismo tráfico intentado, cuatro resultados eléctricos distintos según el estado físico del bus. Tu avance en los casos no cambió.</span>');
  } finally {
    // El alumno se queda donde estaba: mismo caso y misma sonda; sus respuestas no se tocaron.
    setScenario(previo.escenario);
    if(energized!==previo.energizado) el('btnEnergize').click();
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    autoRunning=false;
  }
}
el('btnAuto').onclick=runAuto;

/* ---------- 17) INIT ---------- */
window.__labDebug={
  get mode(){ return scenarioKey; },
  get solved(){ return Object.values(answered).every(Boolean); },
  get intentos(){ return RETO.intentos; },
  state(){ return {caso:scenarioKey,energizado:energized,answered:{...answered},intentos:RETO.intentos,
    fallos:{...fallosCaso},resiembras:RETO.resiembras,resuelto:Object.values(answered).every(Boolean),autoRunning}; },
  setScenario(k){ setScenario(k); },
  conecta(){ if(!energized) el('btnEnergize').click(); },
  opciones(){ return [...document.querySelectorAll('#dxWrap .b.dx')].map(b=>({t:b.textContent,ok:b.dataset.ok==='1'})); },
};
setScenario('sano');
refreshProgress();
S.start();
