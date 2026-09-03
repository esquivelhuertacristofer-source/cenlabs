/* ============================================================
   LAB — MOTOR DE CORRIENTE DIRECTA: PAR Y VELOCIDAD
   (Dominio D5 · máquinas eléctricas — excitación independiente)
   MOLDE E+S — primer híbrido de la colección: ensamble 3D interactivo
   (molde E, como freno de disco) + panel esquemático con modos de
   exploración sobre canvas (molde S, como grupo vectorial), en el
   mismo render y la misma escena.
   Referencia curricular: programa ELE-II.1 (control de motores de CD).
   🔒 Este código no tiene norma ancla (IEC/FMVSS/etc.) listada en la
   lista maestra, a diferencia de otros labs D5; el modelo se apoya en
   la teoría estándar de máquinas de CD de excitación independiente
   (cualquier texto de conversión electromecánica: Fitzgerald, Chapman).
   Modelo de ingeniería (didáctico, motor de CD de excitación independiente):
     · T   = KΦ · Ia            (par electromagnético)
     · Ea  = KΦ · ω             (fuerza contraelectromotriz)
     · Va  = Ea + Ia·Ra         (malla de armadura, estado estacionario)
     · Ia  = TL / (KΦ)          (la carga mecánica FIJA la corriente)
   KΦ(If) = KM · (If / If_nominal) — proporcional a la corriente de
   campo; NO modela saturación magnética (simplificación explícita,
   documentada en la Ficha técnica).
   Parámetros de ejemplo (motor ilustrativo del simulador, NO un
   datasheet de un motor comercial real):
     Ra=1.2 Ω, KM=0.85 V·s/rad, If_nominal=1.0 A, Ia de referencia≈9.0 A.
   CERO Math.random() en la física del motor: la única aleatoriedad de
   esta práctica está en la SELECCIÓN de escenario del modo Reto (qué
   combinación de Va/If/TL se sortea), nunca en el cálculo del resultado.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.6,2.6,4.4],target:[0,1.5,0],bgTop:'#101a22',bgBot:'#05070a',bloom:0.4,minD:2.6,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2400,Q:0.8});
const std=o=>new THREE.MeshStandardMaterial(o);
const el=id=>document.getElementById(id);
const tf=(x,d=0)=>Number(x).toFixed(d);
function ease(x){return x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}

/* ---------- toast ---------- */
let toastT=null;
function showToast(html,ms=3300){ const t=el('toast'); t.innerHTML=html; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms); }

/* ---------- materiales PBR (biblioteca compartida) ---------- */
const alu=castAluminum(), brush=brushedMetal();
const MAT={
  yugo:   std({...brush, color:0x33414e, metalness:0.55, roughness:0.55, envMapIntensity:0.9}),   // carcasa/yugo (pintura industrial)
  core:   std({...brush, color:0x23272d, metalness:0.75, roughness:0.5}),                          // núcleo laminado (campo/armadura)
  coil:   std({color:0xb5651d, metalness:0.85, roughness:0.32, envMapIntensity:1.2}),              // devanado de cobre esmaltado
  shaft:  std({...brush, color:0xc9ced3, metalness:0.95, roughness:0.18, envMapIntensity:1.4}),    // eje pulido
  comm:   std({color:0xb08d3e, metalness:0.9, roughness:0.28}),                                    // delgas del conmutador (cobre/bronce)
  brushC: std({color:0x1b1b1b, roughness:0.9, metalness:0.05}),                                    // escobilla de grafito
  holder: std({...brush, color:0x8a8f96, metalness:0.85, roughness:0.35}),                         // portaescobillas
  cap:    std({...alu, color:0x6a7078, metalness:0.75, roughness:0.5, envMapIntensity:1.1}),       // tapas (aluminio fundido)
  dark:   std({color:0x05070a, roughness:0.8, metalness:0.2}),
  bench:  std({...brush, color:0x2b3138, metalness:0.55, roughness:0.5, envMapIntensity:0.7}),
  benchLeg:std({color:0x171b20, metalness:0.7, roughness:0.4}),
  ped:    std({...brush, color:0x3a4149, metalness:0.85, roughness:0.42, envMapIntensity:0.85}),
  pedTop: std({...brush, color:0x828a93, metalness:0.95, roughness:0.28, envMapIntensity:1.15}),
  pedRing:std({color:0x2A9D8F, metalness:0.3, roughness:0.5, emissive:0x1e6f63, emissiveIntensity:0.5}),
};

/* ---------- física del motor de CD (excitación independiente) ---------- */
const RA=1.2, KM=0.85, IF_RATED=1.0, IA_WARN=9.0;
const KPhi=If=>KM*(If/IF_RATED);
function motorState(Va,If,TL){
  const kphi=KPhi(If);
  const Ia=TL/kphi;
  const Ea=Va-Ia*RA;
  const unphysical=Ea<=0;
  const w=unphysical?0:Ea/kphi;
  const n=w*60/(2*Math.PI);
  const T=kphi*Ia;
  const Pmech=T*w;
  const Pin=Va*Ia;
  const Ploss=Ia*Ia*RA;
  const eta=Pin>0?Pmech/Pin:0;
  const overcurrent=Ia>IA_WARN;
  return {kphi,Ia,Ea,unphysical,w,n,T,Pmech,Pin,Ploss,eta,overcurrent};
}

/* ---------- constructores de piezas ---------- */
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={aluminio:MAT.cap, acero:MAT.shaft, cobre:MAT.coil, cromo:MAT.shaft,
  chapa:MAT.core, hierro:MAT.yugo, negro:MAT.dark, goma:MAT.dark,
  blanco:MAT.shaft, ceramica:MAT.holder};
const R_ARM=0.245, LARGO=0.86, N_RAN=20;

/* EL CAMPO SON DOS POLOS SALIENTES, no dos tacos con aros. Lo que hay que ver
   es la ZAPATA POLAR: está torneada al radio de la armadura, y por eso el
   entrehierro es el mismo bajo todo el polo y el flujo entra radial. Con un
   taco recto el entrehierro sería mínimo en el centro y enorme en las puntas, y
   Φ dejaría de tener el sentido que tiene en T = KΦ·Ia.
   La bobina es hilo enrollado vuelta a vuelta y en dos capas, no seis aros
   sueltos: el flujo lo hacen las VUELTAS por la corriente, y con aros
   equiespaciados no se puede contar ni una cosa ni la otra. */
function buildCampo(){
  const g=new THREE.Group();
  const coreLen=0.9;
  [1,-1].forEach(side=>{
    const w=new THREE.Group();
    const polo=P3.poloSaliente(MATP,{rArm:R_ARM,entrehierro:0.024,arcoPolo:1.55,
      altoZapata:0.09,anchoNucleo:0.30,rYugo:0.585,largo:coreLen,chapas:14});
    const nu=polo.userData.nucleo;
    const bob=P3.bobinaCampo({cobre:MAT.coil},{ancho:nu.ancho+0.055,prof:nu.largo+0.055,
      alto:nu.alto*0.82,vueltas:11,hilo:0.023,capas:2});
    bob.position.y=nu.y; polo.add(bob);
    polo.rotation.y=Math.PI/2;                 // el apilado de chapas, sobre el eje
    w.add(polo); w.rotation.x=side>0?0:Math.PI;
    g.add(w);
  });
  const lb=labelSprite('Campo (polos + devanado)','#8A94A0'); lb.position.set(0,0.95,0); lb.scale.multiplyScalar(0.62); g.add(lb);
  return g;
}
/* LA ARMADURA es chapa RANURADA con el cobre METIDO en las ranuras, y con las
   cabezas de bobina doblando por los dos extremos. Los conductores van dentro
   del hierro por una razón que se ve al dibujarlo: si estuvieran pegados por
   fuera, la fuerza los arrancaría —la fuerza del par se hace sobre el DIENTE,
   no sobre el cobre— y el entrehierro tendría que ser tan grande como el hilo.
   Encima van los FLEJES de vendaje, que es lo que sujeta las cabezas a 3000 rpm. */
function buildArmadura(){
  const g=new THREE.Group();
  const len=LARGO, R=R_ARM;
  const nuc=P3.nucleoRanurado(MATP,{rExt:R,rInt:0.080,ranuras:N_RAN,largo:len,
    hacia:'fuera',fondo:0.44,anchoRanura:0.52});
  nuc.rotation.y=Math.PI/2; g.add(nuc);
  const dev=P3.devanado({cobre:MAT.coil},{r:R-0.042,ranuras:N_RAN,largo:len,
    paso:9,hilo:0.017,bobinas:N_RAN,salto:1});
  dev.rotation.y=Math.PI/2; g.add(dev);
  [-1,1].forEach(sx=>{ const fl=new THREE.Mesh(new THREE.TorusGeometry(R-0.028,0.012,8,36),MAT.dark);
    fl.rotation.y=Math.PI/2; fl.position.x=sx*(len/2+0.085); g.add(fl); });
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,len+0.7,20),MAT.shaft); shaft.rotation.z=Math.PI/2; shaft.castShadow=true; g.add(shaft);
  const lb=labelSprite('Armadura (rotor + devanado)','#8A94A0'); lb.position.set(0,0.55,0); lb.scale.multiplyScalar(0.6); g.add(lb);
  return g;
}
/* EL CONMUTADOR, con las TRES cosas que lo hacen un conmutador y no un tubo
   estriado: las delgas separadas por mica, los CONOS DE APRIETE que las
   sujetan por dentro —la fuerza centrífuga tira de cada delga hacia fuera y
   sólo esa cuña las mantiene en su sitio: por eso una delga suelta es avería de
   taller— y las ALETAS donde se sueldan los extremos de las bobinas de la
   armadura. Sin las aletas, el conmutador y el devanado son dos piezas que no
   se tocan, y entonces no se ve por qué invertir la conexión invierte el par. */
function buildConmutador(){
  const g=new THREE.Group();
  const R=0.11, len=0.16, n=N_RAN;
  for(let i=0;i<n;i++){ const a0=i/n*Math.PI*2, a1=(i+0.80)/n*Math.PI*2;
    const seg=new THREE.Mesh(new THREE.CylinderGeometry(R,R,len,6,1,false,a0,a1-a0),MAT.comm);
    seg.rotation.z=Math.PI/2; seg.castShadow=true; g.add(seg);
    // La aleta: el rabillo por el que la delga se suelda a la bobina.
    const am=(a0+a1)/2;
    const al=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.030,0.016),MAT.comm);
    al.position.set(len/2+0.020,Math.cos(am)*(R+0.012),Math.sin(am)*(R+0.012));
    al.rotation.x=-am; g.add(al);
  }
  [-1,1].forEach(sx=>{
    const cono=new THREE.Mesh(P3.revolucion(
      [[0.072,0],[0.108,0.052],[0.108,0.070],[0.072,0.070]],{seg:28}),MAT.shaft);
    cono.rotation.z=-sx*Math.PI/2; cono.position.x=sx*(len/2+0.002); g.add(cono);
  });
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,len+0.22,16),MAT.shaft); hub.rotation.z=Math.PI/2; g.add(hub);
  const lb=labelSprite('Conmutador (delgas)','#8A94A0'); lb.position.set(0,0.32,0); lb.scale.multiplyScalar(0.58); g.add(lb);
  return g;
}
/* LAS ESCOBILLAS, montadas como se montan: dos tacos de grafito DENTRO de un
   portaescobillas que las guía, un MUELLE que las empuja contra el conmutador y
   un LATIGUILLO de cobre trenzado que lleva la corriente. El latiguillo es la
   pieza que más sorprende: la corriente NO pasa por el muelle ni por la guía
   —se quemarían—, pasa por ese cable, y por eso una escobilla con el latiguillo
   partido sigue en su sitio, sigue rozando y no conduce nada.
   La cara de la escobilla va CURVADA al radio del conmutador: una escobilla
   nueva de cara plana toca sólo por una arista y chispea hasta que se asienta.
   Las dos van una al lado de la otra sobre el mismo eje, como en la máquina. */
function buildEscobillas(){
  const g=new THREE.Group();
  const RC=0.11, DZ=0.32;             // radio del conmutador y separación al hogar
  const zc=-DZ;                       // el eje del conmutador, visto desde la pieza
  [1,-1].forEach(s=>{
    const dx=s*0.062;
    // Portaescobillas: un tubo rectangular, con su ventana. El grafito corre por
    // dentro y baja solo según se desgasta.
    const caja=new THREE.Mesh(P3.extruido(
      P3.contornoRedondeado([[-DZ+RC+0.015,-0.088],[-0.030,-0.088],[-0.030,0.088],[-DZ+RC+0.015,0.088]],0.012,3),
      {espesor:0.085,bisel:0.004,huecos:[P3.contornoRedondeado(
        [[-DZ+RC+0.030,-0.060],[-0.045,-0.060],[-0.045,0.060],[-DZ+RC+0.030,0.060]],0.008,3)]}),MAT.holder);
    caja.rotation.y=-Math.PI/2; caja.position.x=dx; caja.castShadow=true; g.add(caja);
    // La escobilla: cara cóncava al radio del conmutador.
    const esc=new THREE.Mesh(P3.extruido([
      ...P3.arco(zc,0,RC,-0.52,0.52,10),
      [-0.075,0.055],[-0.075,-0.055]],{espesor:0.062,bisel:0.004}),MAT.brushC);
    esc.rotation.y=-Math.PI/2; esc.position.x=dx; esc.castShadow=true; g.add(esc);
    const mu=P3.muelle(MATP,{r:0.030,largo:0.042,vueltas:4,hilo:0.008});
    mu.rotation.x=Math.PI/2; mu.position.set(dx,0,-0.052); g.add(mu);
    // El latiguillo, del lomo de la escobilla al borne.
    g.add(P3.manguera({...MATP,goma:MAT.comm},{puntos:[[dx,0.030,-0.070],
      [dx,0.090,-0.045],[dx*0.6,0.150,0.010],[0,0.175,0.052]],r:0.011,abrazaderas:false}));
  });
  const borne=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.055,12),MAT.comm);
  borne.position.set(0,0.190,0.058); g.add(borne);
  const lb=labelSprite('Escobillas (grafito)','#8A94A0'); lb.position.set(0,0.5,0); lb.scale.multiplyScalar(0.58); g.add(lb);
  return g;
}
/* LAS TAPAS son fundición con nervios y con el RODAMIENTO dentro. El rodamiento
   se dibuja porque es lo que mantiene la armadura centrada en un entrehierro de
   décimas de milímetro; cuando se sale de sitio, el rotor roza el polo, y esa
   es la avería. */
function tapaFundida(sx){
  const g=new THREE.Group();
  const cap=new THREE.Mesh(P3.revolucion([
    [0.11,0],[0.56,0],[0.56,0.05],[0.48,0.09],[0.19,0.10],[0.19,0.15],[0.11,0.15]],
    {seg:36}),MAT.cap);
  cap.rotation.z=sx*Math.PI/2; cap.castShadow=true; g.add(cap);
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2;
    const nb=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.34,0.030),MAT.cap);
    nb.position.set(sx*0.07,Math.cos(a)*0.33,Math.sin(a)*0.33); nb.rotation.x=-a; g.add(nb); }
  for(let i=0;i<6;i++){ const a=i/6*Math.PI*2;
    const bolt=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.06,10),MAT.dark);
    bolt.rotation.z=Math.PI/2; bolt.position.set(-sx*0.03,Math.cos(a)*0.50,Math.sin(a)*0.50); g.add(bolt); }
  const rod=P3.rodamiento(MATP,{dExt:0.22,dInt:0.11,ancho:0.07});
  rod.rotation.z=Math.PI/2; rod.position.x=sx*0.105; g.add(rod);
  return g;
}
function buildTapaD(){
  const g=new THREE.Group();
  g.add(tapaFundida(1));
  const stub=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.34,20),MAT.shaft); stub.rotation.z=Math.PI/2; stub.position.x=0.32; stub.castShadow=true; g.add(stub);
  const chav=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.022,0.030),MAT.shaft);
  chav.position.set(0.38,0.066,0); g.add(chav);          // chavetero del acople
  const lb=labelSprite('Tapa delantera (lado de mando)','#8A94A0'); lb.position.set(0,0.75,0); lb.scale.multiplyScalar(0.56); g.add(lb);
  return g;
}
function buildTapaT(){
  const g=new THREE.Group();
  g.add(tapaFundida(-1));
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const vent=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.12,10),MAT.dark);
    vent.rotation.z=Math.PI/2; vent.position.set(-0.03,Math.cos(a)*0.42,Math.sin(a)*0.42); g.add(vent); }
  const lb=labelSprite('Tapa trasera (porta escobillas)','#8A94A0'); lb.position.set(0,0.75,0); lb.scale.multiplyScalar(0.56); g.add(lb);
  return g;
}
/* pieza fija de referencia: yugo/carcasa con ventana de corte */
function buildYugo(){
  const g=new THREE.Group();
  const len=1.9, R=0.6;
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(R,R,len,40,1,true,0.55,Math.PI*2-1.1),MAT.yugo);
  shell.rotation.z=Math.PI/2; shell.castShadow=shell.receiveShadow=true; g.add(shell);
  [-len/2+0.04, len/2-0.04].forEach(dx=>{ const ring=new THREE.Mesh(new THREE.TorusGeometry(R,0.035,10,40),MAT.yugo); ring.rotation.y=Math.PI/2; ring.position.x=dx; g.add(ring); });
  [-1,1].forEach(s=>{ const foot=roundedBox(0.34,0.14,0.5,MAT.yugo,0.05); foot.position.set(s*0.55,-R-0.05,0); foot.castShadow=true; g.add(foot); });
  // Caja de bornes y cáncamo: por ahí entran los cuatro cables de una máquina
  // de excitación independiente (A1-A2 de armadura, F1-F2 de campo), que es
  // justo lo que este laboratorio deja gobernar por separado.
  const caja=roundedBox(0.40,0.22,0.34,MAT.yugo,0.03); caja.position.set(0.30,R+0.10,0.28); caja.castShadow=true; g.add(caja);
  const tapaC=roundedBox(0.34,0.03,0.28,MAT.cap,0.02); tapaC.position.set(0.30,R+0.22,0.28); g.add(tapaC);
  ['A1','A2','F1','F2'].forEach((_,i)=>{ const b=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.05,10),MAT.comm);
    b.position.set(0.30-0.12+ (i%2)*0.24, R+0.235, 0.28-0.07+Math.floor(i/2)*0.14); g.add(b); });
  const canc=new THREE.Mesh(new THREE.TorusGeometry(0.075,0.020,8,20),MAT.yugo);
  canc.position.set(-0.30,R+0.075,0); g.add(canc);
  const lb=labelSprite('Yugo / carcasa (fija)','#8A94A0'); lb.position.set(0,R+0.55,0); lb.scale.multiplyScalar(0.72); g.add(lb);
  return g;
}

/* ---------- registro de piezas (posición HOGAR en mundo) ---------- */
const HUB=[0,1.35,0];                   // centro del eje del motor
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const H=(dx,dy,dz)=>V(HUB[0]+dx,HUB[1]+dy,HUB[2]+dz);
const PARTS=[
  {id:'tapaT',      name:'Tapa trasera',            build:()=>buildTapaT(),      home:H(-0.95,0,0),  note:'Cierra el extremo trasero del yugo y aloja el portaescobillas.'},
  {id:'escobillas', name:'Escobillas (grafito)',     build:()=>buildEscobillas(), home:H(-0.6,0,0.32),note:'Conducen la corriente al conmutador por contacto deslizante; se desgastan con el uso.'},
  {id:'conmutador', name:'Conmutador (delgas)',      build:()=>buildConmutador(), home:H(-0.6,0,0),   note:'Invierte la corriente en cada bobina del rotor para que el par no cambie de sentido al girar.'},
  {id:'armadura',   name:'Armadura (rotor)',         build:()=>buildArmadura(),   home:H(0,0,0),      note:'Núcleo laminado con el devanado que gira dentro del campo. T = KΦ·Ia.'},
  {id:'campo',      name:'Campo (polos + devanado)', build:()=>buildCampo(),      home:H(0,0,0),      note:'Bobinado fijo que crea el flujo magnético Φ; aquí If se controla de forma independiente de Va.'},
  {id:'tapaD',      name:'Tapa delantera',           build:()=>buildTapaD(),      home:H(0.72,0,0),   note:'Cierra el extremo de mando; sostiene el rodamiento y saca el eje al exterior.'},
];
const ORDER=PARTS.map(p=>p.id);
const PART=Object.fromEntries(PARTS.map(p=>[p.id,p]));

/* ---------- estado ---------- */
const STAGE_S=0.42;
const groups={}, ghosts={}, labels={};
let placed={}, selectedId=null, progress=0, simUnlocked=false;
const tweens=[];
const trayObjs=[], ghostObjs=[], scratch=[];
const yugo=buildYugo(); yugo.position.set(...HUB); scene.add(yugo);

/* ---------- banco de trabajo + pedestales ----------
   Parametrico para cualquier N de piezas → plantilla reutilizable en las 150 practicas. */
const BENCH={cx:3.1, cz:0.85, top:0.95, cols:2, dx:1.0, dz:1.05, pedH:0.30};
const N_ROWS=Math.ceil(PARTS.length/BENCH.cols);
const PED_TOP_Y=BENCH.top+BENCH.pedH;
function pedBaseXZ(i){ const c=i%BENCH.cols, r=(i/BENCH.cols)|0;
  return { x:BENCH.cx+(c-(BENCH.cols-1)/2)*BENCH.dx, z:BENCH.cz+(r-(N_ROWS-1)/2)*BENCH.dz }; }
const pedestals=[];
(function buildStaging(){
  const staging=new THREE.Group(); scene.add(staging);
  const spanX=(BENCH.cols-1)*BENCH.dx+1.25, spanZ=(N_ROWS-1)*BENCH.dz+1.25;
  const topSlab=roundedBox(spanX,0.16,spanZ,MAT.bench,0.05); topSlab.position.set(BENCH.cx,BENCH.top-0.08,BENCH.cz); topSlab.receiveShadow=true; staging.add(topSlab);
  const legH=BENCH.top-0.08;
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(0.13,legH,0.13),MAT.benchLeg);
    leg.position.set(BENCH.cx+sx*(spanX/2-0.18),legH/2,BENCH.cz+sz*(spanZ/2-0.18)); leg.castShadow=true; staging.add(leg);
  }
  const rail=roundedBox(spanX-0.1,0.05,spanZ-0.1,MAT.benchLeg,0.03); rail.position.set(BENCH.cx,0.18,BENCH.cz); staging.add(rail);
  PARTS.forEach((p,i)=>{
    const {x,z}=pedBaseXZ(i);
    const pg=new THREE.Group(); pg.position.set(x,0,z);
    const post=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.30,BENCH.pedH,28),MAT.ped); post.position.y=BENCH.top+BENCH.pedH/2; post.castShadow=true; pg.add(post);
    const plate=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,0.05,40),MAT.pedTop); plate.position.y=PED_TOP_Y; plate.receiveShadow=true; pg.add(plate);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.345,0.02,12,44),MAT.pedRing.clone()); ring.rotation.x=Math.PI/2; ring.position.y=PED_TOP_Y+0.035; pg.add(ring);
    const lb=labelSprite(p.name.split('(')[0].trim(),'#9fb2c0'); lb.position.set(0,BENCH.top+0.14,0.4); lb.scale.multiplyScalar(0.7); pg.add(lb);
    const ck=labelSprite('✓ colocada','#43D9AD'); ck.position.set(0,PED_TOP_Y+0.42,0); ck.scale.multiplyScalar(0.66); ck.visible=false; pg.add(ck);
    staging.add(pg);
    pedestals[i]={g:pg, ring, plate, label:lb, check:ck};
  });
})();
function resetPedestals(){ pedestals.forEach(pd=>{ pd.check.visible=false; if(pd.label)pd.label.visible=true;
  pd.ring.material.color.set(0x2A9D8F); pd.ring.material.emissive.set(0x1e6f63); pd.ring.material.emissiveIntensity=0.5; }); }
function markPedestalDone(i){ const pd=pedestals[i]; if(!pd)return; pd.check.visible=true; if(pd.label)pd.label.visible=false;
  pd.ring.material.color.set(0x43D9AD); pd.ring.material.emissive.set(0x2f9e86); pd.ring.material.emissiveIntensity=0.9; }

function ghostMat(){ return new THREE.MeshStandardMaterial({color:0x4FD1C5, transparent:true, opacity:0.3, metalness:0.0, roughness:0.6, emissive:0x2A9D8F, emissiveIntensity:0.6, depthWrite:false}); }
function makeGhost(part){
  const gh=part.build(); const gm=ghostMat();
  gh.traverse(o=>{ if(o.isMesh){ o.material=gm; o.castShadow=false; o.receiveShadow=false; } });
  gh.position.copy(part.home); gh.userData={kind:'slot',id:part.id,gm,homeX:part.home.x,shake:0,fading:false}; return gh;
}
function showGhostFor(id){
  ghostObjs.forEach(gh=>{ if(gh.parent) scene.remove(gh); });
  if(id && !placed[id] && ghosts[id]){ const gh=ghosts[id]; gh.userData.fading=false; gh.userData.gm.opacity=0.3; gh.visible=true; scene.add(gh); }
}
function updateLabels(){ pedestals.forEach((pd,i)=>{ if(pd&&pd.label) pd.label.visible=!placed[PARTS[i].id]; }); }
function makePart(part,i){
  const g=part.build(); g.scale.setScalar(STAGE_S);
  const {x,z}=pedBaseXZ(i);
  const box=new THREE.Box3().setFromObject(g);
  const baseY=PED_TOP_Y+0.03-box.min.y;
  g.position.set(x,baseY,z);
  Object.assign(g.userData,{kind:'part',id:part.id,baseY,phase:i*1.7,lift:0});
  return g;
}

function initAssembly(){
  [...trayObjs,...ghostObjs,...scratch].forEach(o=>scene.remove(o));
  trayObjs.length=ghostObjs.length=scratch.length=tweens.length=0;
  placed={}; selectedId=null; progress=0; simUnlocked=false;
  resetPedestals();
  PARTS.forEach((p,i)=>{
    const g=makePart(p,i); groups[p.id]=g; scene.add(g); trayObjs.push(g);
    const gh=makeGhost(p); ghosts[p.id]=gh; ghostObjs.push(gh);
  });
  showGhostFor(null);
  updateLabels(); renderChecklist(); renderProg();
  syncCtrlbar();
  if(mode!=='ensamble') setMode('ensamble');
  S.moveTo([3.6,2.6,4.4],[0,1.5,0],1.2);
  el('asmStatus').innerHTML='Toca una <b>pieza</b> del banco (derecha) y luego su <b>hueco luminoso</b>.';
}

/* ---------- selección / colocación ---------- */
function selectPart(id){
  if(placed[id]) return;
  selectedId=id;
  updateLabels(); showGhostFor(id);
  el('asmStatus').innerHTML=`▶ <b style="color:var(--accent2)">${PART[id].name}</b> seleccionada — ahora toca su <b>hueco luminoso</b> en el motor.`;
  synth.beep(660,0.06,0.05);
  renderChecklist();
}
function deselect(){ selectedId=null; updateLabels(); showGhostFor(null); renderChecklist(); }
function placePart(id){
  const p=PART[id], g=groups[id], gh=ghosts[id];
  tweens.push({obj:g, fromP:g.position.clone(), toP:p.home.clone(), fromS:g.scale.x, toS:1, t:0, dur:0.9, roty0:g.rotation.y, onDone:()=>{ g.rotation.set(0,0,0); }});
  if(gh){ gh.userData.fading=true; }
  g.userData.kind='placed';
  placed[id]=true; selectedId=null; progress++;
  markPedestalDone(ORDER.indexOf(id));
  updateLabels();
  synth.beep(880,0.08,0.05); setTimeout(()=>synth.beep(1174,0.1,0.05),110);
  showToast(`<span style="color:var(--good)">✔ ${p.name} colocada.</span><br><span style="color:var(--dim);font-size:11px">${p.note}</span>`);
  renderChecklist(); renderProg();
  if(progress>=PARTS.length) finishAssembly();
  else el('asmStatus').innerHTML=`Bien. Faltan <b>${PARTS.length-progress}</b>. Toca otra pieza y luego su hueco.`;
}
function wrongSlot(slotId){
  synth.beep(180,0.16,0.06);
  const g=ghosts[slotId]; if(g) g.userData.shake=0.5;
  showToast(`<span style="color:var(--bad)">✗ Ahí no va esa pieza.</span><br><span style="color:var(--dim);font-size:11px">Ese hueco es para: ${PART[slotId].name}.</span>`);
}
function finishAssembly(){
  simUnlocked=true;
  syncCtrlbar();
  el('asmStatus').innerHTML='<span style="color:var(--good)">✅ Motor ensamblado.</span> Ahora explora el circuito, la curva par–velocidad y el reto (arriba).';
  showToast('<span style="color:var(--good)">✅ Motor armado.</span><br><span style="color:var(--dim);font-size:11px">Cambia de modo arriba para ver el circuito y la curva par–velocidad.</span>',4200);
  synth.beep(1046,0.14,0.06); setTimeout(()=>synth.beep(1568,0.16,0.06),150);
  S.moveTo([3.6,2.6,4.4],[0,1.5,0],1.4); S.setCinematicIdle(true);
}

/* ---------- picker: tocar pieza → tocar hueco ---------- */
function tagged(obj){ let o=obj; while(o){ if(o.userData && o.userData.kind) return o; o=o.parent; } return null; }
pickerFor(scene,S.camera,mount,(hit)=>{
  const t=hit?tagged(hit.object):null;
  if(!t){ if(selectedId) deselect(); return; }
  if(t.userData.kind==='part'){ selectPart(t.userData.id); }
  else if(t.userData.kind==='slot'){
    if(!selectedId){ el('asmStatus').innerHTML='Primero toca una <b>pieza</b> del banco (derecha) →'; synth.beep(300,0.08,0.05); }
    else if(selectedId===t.userData.id){ placePart(selectedId); }
    else { wrongSlot(t.userData.id); }
  }
  else if(t.userData.kind==='placed'){ const p=PART[t.userData.id]; if(p) showToast(`<b>${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.note}</span>`); }
});

/* ---------- checklist / progreso ---------- */
function renderChecklist(){
  el('checklist').innerHTML=PARTS.map(p=>{
    const done=placed[p.id], sel=selectedId===p.id;
    const mk=done?'<span style="color:var(--good)">●</span>':sel?'<span style="color:var(--accent2)">◉</span>':'<span style="color:#48555f">○</span>';
    const c=done?'color:var(--good)':sel?'color:var(--accent2)':'color:var(--dim)';
    return `<div style="${c}">${mk} ${p.name}</div>`;
  }).join('');
}
function renderProg(){ el('p_prog').textContent=`${progress} / ${PARTS.length}`; el('p_prog').className=progress>=PARTS.length?'good':''; }

/* ---------- tablero esquemático (canvas) — circuito / curva / reto ---------- */
const boardG=new THREE.Group();
const bFrame=roundedBox(1.66,1.26,0.06,MAT.cap,0.04); bFrame.position.set(0,0,-0.02); bFrame.castShadow=true; boardG.add(bFrame);
const bLeg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.9,16),MAT.cap); bLeg.position.set(0,-0.98,0); bLeg.castShadow=true; boardG.add(bLeg);
const bCv=document.createElement('canvas'); bCv.width=1024; bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv); bTex.colorSpace=THREE.SRGBColorSpace; bTex.minFilter=THREE.LinearFilter; bTex.generateMipmaps=false;
const board=new THREE.Mesh(new THREE.PlaneGeometry(1.56,1.16),new THREE.MeshBasicMaterial({map:bTex,toneMapped:false}));
board.position.set(0,0,0.015); boardG.add(board);
boardG.position.set(-2.6,1.65,-0.2); boardG.rotation.y=0.28;
scene.add(boardG);

function line(x1,y1,x2,y2,color,w=3){ bCx.strokeStyle=color; bCx.lineWidth=w; bCx.beginPath(); bCx.moveTo(x1,y1); bCx.lineTo(x2,y2); bCx.stroke(); }
function labelAt(x,y,text,color='#dfe7ee',size=20,align='left'){ bCx.fillStyle=color; bCx.font=`${size}px 'Segoe UI',sans-serif`; bCx.textAlign=align; bCx.fillText(text,x,y); }

const STATE={Va:120, If:1.0, TL:5};

function drawCircuito(){
  const st=motorState(STATE.Va,STATE.If,STATE.TL);
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Circuito equivalente — excitación independiente','#8fd1ff',26);
  line(120,180,120,560,'#5b6672',4);
  labelAt(70,150,'+','#8fd1ff',24); labelAt(70,590,'−','#8fd1ff',24);
  labelAt(150,190,`Va = ${tf(STATE.Va,0)} V`,'#dfe7ee',20);
  bCx.strokeStyle='#e0a95c'; bCx.lineWidth=4; bCx.strokeRect(90,260,60,60);
  labelAt(160,300,`Ra = ${RA} Ω`,'#e0a95c',18);
  line(120,180,120,260,'#5b6672',4); line(120,320,120,380,'#5b6672',4);
  bCx.beginPath(); bCx.arc(120,470,70,0,Math.PI*2); bCx.strokeStyle='#43D9AD'; bCx.lineWidth=4; bCx.stroke();
  labelAt(120,478,'Ea','#43D9AD',24,'center');
  line(120,380,120,400,'#5b6672',4); line(120,540,120,560,'#5b6672',4);
  labelAt(210,470,`Ea = ${st.unphysical?'— (no física)':tf(st.Ea,1)+' V'}`,'#dfe7ee',20);
  labelAt(210,505,`Ia = ${tf(st.Ia,2)} A`,st.overcurrent?'#ff6b6b':'#dfe7ee',20);
  line(560,180,560,560,'#5b6672',4);
  labelAt(600,190,`If = ${tf(STATE.If,2)} A`,'#dfe7ee',20);
  for(let i=0;i<6;i++){ bCx.beginPath(); bCx.arc(560,240+i*40,18,Math.PI,0); bCx.strokeStyle='#b5651d'; bCx.lineWidth=4; bCx.stroke(); }
  labelAt(600,470,'Campo independiente','#8A94A0',16);
  labelAt(600,500,`Φ ∝ If  ·  KΦ = ${tf(st.kphi,3)}`,'#8A94A0',16);
  if(st.overcurrent) labelAt(40,700,'⚠ Ia supera la corriente de referencia (9 A)','#ff6b6b',20);
  else if(st.unphysical) labelAt(40,700,'⚠ Combinación no física: Ea ≤ 0 (baja Va o TL, o sube If)','#ff6b6b',20);
  bTex.needsUpdate=true;
}

function drawCurva(){
  const st=motorState(STATE.Va,STATE.If,STATE.TL);
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Curva par–velocidad (a Va, If fijos)','#8fd1ff',26);
  const ox=110, oy=680, w=850, h=560, NMAX=2200, TMAX=10;
  line(ox,oy,ox+w,oy,'#5b6672',2); line(ox,oy,ox,oy-h,'#5b6672',2);
  labelAt(ox+w,oy+30,'n (rpm)','#dfe7ee',18,'right');
  labelAt(ox,oy-h-16,'T (N·m)','#dfe7ee',18,'left');
  const px=n=>ox+Math.min(1,n/NMAX)*w, py=T=>oy-Math.min(1,T/TMAX)*h;
  bCx.beginPath();
  for(let ia=0, first=true; ia<=IA_WARN*1.6; ia+=0.1){
    const kphi=KPhi(STATE.If), Ea=STATE.Va-ia*RA; if(Ea<=0) break;
    const wv=Ea/kphi, n=wv*60/(2*Math.PI), T=kphi*ia;
    const x=px(n), y=py(T);
    if(first){ bCx.moveTo(x,y); first=false; } else bCx.lineTo(x,y);
  }
  bCx.strokeStyle='#43D9AD'; bCx.lineWidth=3; bCx.stroke();
  const kphiW=KPhi(STATE.If), TW=kphiW*IA_WARN;
  line(ox,py(TW),ox+w,py(TW),'#ff6b6b',2);
  labelAt(ox+w,py(TW)-8,'límite de Ia de referencia','#ff6b6b',16,'right');
  const opx=px(st.n), opy=py(st.T);
  bCx.beginPath(); bCx.arc(opx,opy,9,0,Math.PI*2); bCx.fillStyle=st.overcurrent?'#ff6b6b':'#f4c95d'; bCx.fill();
  labelAt(opx+16,opy-10,`(${tf(st.n,0)} rpm, ${tf(st.T,2)} N·m)`,'#dfe7ee',18);
  if(st.unphysical) labelAt(40,730,'⚠ Punto no física con TL actual (Ea ≤ 0)','#ff6b6b',18);
  else if(st.n>=NMAX) labelAt(40,730,'⚠ Velocidad fuera del rango graficado','#ff6b6b',18);
  bTex.needsUpdate=true;
}

function drawReto(){
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Reto — calcula el valor pedido','#8fd1ff',26);
  labelAt(40,120,`Va = ${tf(RETO.Va,0)} V   ·   If = ${tf(RETO.If,2)} A   ·   TL = ${tf(RETO.TL,1)} N·m`,'#dfe7ee',20);
  const labelMap={Ia:'la corriente de armadura Ia (A)',Ea:'la FEM inducida Ea (V)',T:'el par electromagnético T (N·m)',n:'la velocidad n (rpm)'};
  labelAt(40,200,`¿Cuánto vale ${labelMap[RETO.kind]}?`,'#f4c95d',24);
  labelAt(40,250,'T = KΦ·Ia   ·   Ea = KΦ·ω   ·   Va = Ea + Ia·Ra','#8A94A0',18);
  if(retoSolved) labelAt(40,320,`✔ Correcto: ${tf(RETO.target,2)}`,'#43D9AD',22);
  bTex.needsUpdate=true;
  const rt=el('retoText');
  if(rt) rt.textContent=`Va = ${tf(RETO.Va,0)} V · If = ${tf(RETO.If,2)} A · TL = ${tf(RETO.TL,1)} N·m — ¿Cuánto vale ${labelMap[RETO.kind]}?`+(retoSolved?` ✔ Correcto: ${tf(RETO.target,2)}`:'');
}
function drawBoard(){ if(mode==='circuito') drawCircuito(); else if(mode==='curva') drawCurva(); else if(mode==='reto') drawReto(); }

function updateTele(){
  const st=motorState(STATE.Va,STATE.If,STATE.TL);
  el('t_va').textContent=`${tf(STATE.Va,0)} V`;
  el('t_if').textContent=`${tf(STATE.If,2)} A`;
  el('t_tl').textContent=`${tf(STATE.TL,1)} N·m`;
  el('t_ia').textContent=`${tf(st.Ia,2)} A`; el('t_ia').className=st.overcurrent?'bad':'';
  el('t_ea').textContent=st.unphysical?'— (no física)':`${tf(st.Ea,1)} V`;
  el('t_t').textContent=`${tf(st.T,2)} N·m`;
  el('t_n').textContent=st.unphysical?'0 rpm':`${tf(st.n,0)} rpm`;
  el('t_pmech').textContent=`${tf(st.Pmech,0)} W`;
  el('t_eta').textContent=`${tf(st.eta*100,1)} %`;
}
function refreshAll(){ updateTele(); if(mode==='circuito'||mode==='curva'||mode==='reto') drawBoard(); }

/* ---------- máquina de modos ---------- */
const MODE_META={
  ensamble:{nombre:'Ensamble', cam:[[3.6,2.6,4.4],[0,1.5,0]]},
  circuito:{nombre:'Circuito equivalente', cam:[[-1.0,2.05,2.35],[-2.6,1.65,-0.2]]},
  curva:{nombre:'Curva par–velocidad', cam:[[-1.0,2.05,2.35],[-2.6,1.65,-0.2]]},
  reto:{nombre:'Reto', cam:[[-1.0,2.05,2.35],[-2.6,1.65,-0.2]]},
};
const modes=['ensamble','circuito','curva','reto'];
let mode='ensamble';
function setMode(k){
  if(k!=='ensamble' && !simUnlocked){ showToast('<span style="color:var(--bad)">🔒 Termina el ensamble primero.</span>'); synth.beep(220,0.08,0.05); return; }
  mode=k;
  modes.forEach(m=>{ const b=el('m_'+m); if(b) b.classList.toggle('on',m===k); });
  el('p_mode').textContent=MODE_META[k].nombre;
  el('secEnsamble').style.display=k==='ensamble'?'':'none';
  el('secParam').style.display=(k==='circuito'||k==='curva')?'':'none';
  el('secReto').style.display=k==='reto'?'':'none';
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  if(k==='reto' && !RETO.active) newChallenge();
  refreshAll();
}
function syncCtrlbar(){ modes.forEach(m=>{ const b=el('m_'+m); if(b && m!=='ensamble') b.disabled=!simUnlocked; }); }

/* ---------- reto numérico ---------- */
const VA_SET=[60,90,120,130], IF_SET=[0.4,0.7,1.0,1.3], TL_SET=[1,2.5,4,5,6], KIND_SET=['Ia','Ea','n'];
let RETO={active:false, Va:120, If:1.0, TL:5, kind:'Ia', target:0};
let retoSolved=false;
function newChallenge(){
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  let Va,If,TL,st;
  do{ Va=pick(VA_SET); If=pick(IF_SET); TL=pick(TL_SET); st=motorState(Va,If,TL); } while(st.unphysical);
  const kind=pick(KIND_SET);
  const target=kind==='Ia'?st.Ia:kind==='Ea'?st.Ea:kind==='T'?st.T:st.n;
  RETO={active:true,Va,If,TL,kind,target};
  retoSolved=false;
  const inp=el('retoInput'); if(inp) inp.value='';
  drawReto();
  showToast('🎲 Nuevo reto generado.');
  synth.beep(520,0.08,0.05);
}
function checkReto(){
  const inp=el('retoInput'); if(!inp) return;
  const v=parseFloat(inp.value);
  if(Number.isNaN(v)){ showToast('<span style="color:var(--bad)">Escribe un número.</span>'); return; }
  const tol=Math.max(0.05*Math.abs(RETO.target), RETO.kind==='n'?12:0.05);
  const ok=Math.abs(v-RETO.target)<=tol;
  retoSolved=ok;
  if(ok){ showToast(`<span style="color:var(--good)">✔ Correcto: ${tf(RETO.target,2)}</span>`); synth.beep(1046,0.12,0.06); }
  else { showToast('<span style="color:var(--bad)">✗ No es correcto. Revisa la fórmula.</span>'); synth.beep(180,0.14,0.06); }
  drawReto();
}

/* ---------- demos guiados ---------- */
const sleep=ms=>new Promise(res=>setTimeout(res,ms));
let autoRunning=false;
async function autoAssemble(){
  if(autoRunning) return; autoRunning=true; const btn=el('btnAuto'); if(btn) btn.disabled=true;
  for(const id of ORDER){ if(placed[id]) continue; selectPart(id); await sleep(550); placePart(id); await sleep(950); }
  if(btn) btn.disabled=false; autoRunning=false;
}
async function autoSweep(){
  if(autoRunning) return; autoRunning=true; const btn=el('btnAuto2'); if(btn) btn.disabled=true;
  const seq=[[120,1.0,0],[120,1.0,5],[90,1.0,5],[120,0.7,5],[120,1.3,3]];
  for(const [Va,If,TL] of seq){
    STATE.Va=Va; STATE.If=If; STATE.TL=TL;
    el('sl_va').value=Va; el('sl_if').value=If; el('sl_tl').value=TL;
    refreshAll(); await sleep(1700);
  }
  if(btn) btn.disabled=false; autoRunning=false;
}

/* ---------- lazo de animación ---------- */
S.setAnimate((dt,t)=>{
  for(let i=tweens.length-1;i>=0;i--){ const w=tweens[i]; w.t=Math.min(1,w.t+dt/w.dur); const e=ease(w.t);
    w.obj.position.lerpVectors(w.fromP,w.toP,e); const s=w.fromS+(w.toS-w.fromS)*e; w.obj.scale.setScalar(s);
    if('roty0' in w) w.obj.rotation.y=w.roty0*(1-e);
    if(w.t>=1){ if(w.onDone)w.onDone(); tweens.splice(i,1); } }
  trayObjs.forEach(g=>{ if(g.userData.kind!=='part')return; const id=g.userData.id; if(placed[id])return;
    const sel=selectedId===id;
    g.userData.lift=Math.max(0,Math.min(1,(g.userData.lift||0)+(sel?1:-1)*dt*3.2));
    const L=ease(g.userData.lift);
    g.position.y=g.userData.baseY + L*0.5 + (1-L)*0.02*Math.sin(t*1.8+g.userData.phase);
    if(sel) g.rotation.y+=dt*1.25; else g.rotation.y*=(1-Math.min(1,dt*5));
    g.scale.setScalar(STAGE_S*(1+L*0.06)); });
  ghostObjs.forEach(gh=>{ if(!gh.parent) return; const gm=gh.userData.gm;
    if(gh.userData.fading){ gm.opacity=Math.max(0,gm.opacity-dt*1.4); if(gm.opacity<=0){ gh.visible=false; scene.remove(gh); } return; }
    gm.opacity=0.24+0.14*Math.sin(t*3.2);
    if(gh.userData.shake>0){ gh.userData.shake=Math.max(0,gh.userData.shake-dt*2.2); gh.position.x=gh.userData.homeX+Math.sin(t*45)*0.05*gh.userData.shake; }
    else if(gh.position.x!==gh.userData.homeX){ gh.position.x=gh.userData.homeX; } });
  if(simUnlocked && groups.armadura && (mode==='circuito'||mode==='curva')){
    const st=motorState(STATE.Va,STATE.If,STATE.TL);
    if(!st.unphysical) groups.armadura.rotation.x+=dt*Math.min(st.w,60)*0.15;
  }
});
S.start();

/* ---------- HUD ---------- */
el('hud').innerHTML=`
  <div class="eyebrow">Máquinas eléctricas · Motor de CD</div>
  <h2>Motor de corriente directa: par y velocidad</h2>
  <p>Arma el motor pieza por pieza (<b>toca la pieza, luego su hueco</b>) y luego explora cómo la tensión de armadura Va, la corriente de campo If y el par de carga TL determinan la corriente, la velocidad y el par que entrega.</p>
  <div class="formula">T = KΦ · Ia<br>Ea = KΦ · ω<br>Va = Ea + Ia · Ra</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#33414e"></span>Yugo / carcasa (fija)</div>
    <div class="li"><span class="dot" style="background:#23272d"></span>Núcleo laminado (campo/armadura)</div>
    <div class="li"><span class="dot" style="background:#b5651d"></span>Devanado de cobre</div>
    <div class="li"><span class="dot" style="background:#b08d3e"></span>Conmutador (delgas)</div>
    <div class="li"><span class="dot" style="background:#1b1b1b"></span>Escobillas de grafito</div>
  </div>
  <div class="fid">
    <div class="ft">Contrato de fidelidad</div>
    <div class="fl">SÍ modela: <b>T=KΦ·Ia, Ea=KΦ·ω y la malla de armadura Va=Ea+Ia·Ra en estado estacionario; KΦ proporcional a If; Ia queda fijada por la carga mecánica (independiente de Va).</b></div>
    <div class="fl no">NO modela: <b>saturación magnética, inductancias/transitorios eléctricos, fricción y ventilación (par de vacío), reacción de armadura, ni el circuito de campo (If es un parámetro directo, no se deriva de Vf/Rf).</b></div>
    <div class="fl no">Geometría <b>didáctica</b>: el corte del yugo y las separaciones del despiece no son cotas de taller, y falta el ventilador de refrigeración. Sí están dibujados los rodamientos, la caja de bornes y el muelle y el latiguillo de cada escobilla → medidas y datos, en la Ficha técnica.</div>
  </div>
  <div class="src">Motor de ejemplo del simulador (excitación independiente), <b>no un datasheet real</b>. Ra=1.2 Ω, KM=0.85 V·s/rad, If nominal=1.0 A. Sin norma ancla específica; modelo estándar de conversión electromecánica (programa ELE-II.1).</div>
  <div class="modebar">
    <button class="b on" id="m_ensamble">① Ensamble</button>
    <button class="b" id="m_circuito" disabled>② Circuito</button>
    <button class="b" id="m_curva" disabled>③ Curva T-n</button>
    <button class="b" id="m_reto" disabled>④ Reto</button>
  </div>`;

/* ---------- PANEL ---------- */
el('panel').innerHTML=`
  <div class="g"><div class="gl"><span>Modo actual</span><b id="p_mode">Ensamble</b></div></div>

  <div id="secEnsamble">
    <h4>① Ensamble — toca pieza, toca hueco</h4>
    <div class="console" id="asmStatus">Toca una <b>pieza</b> del banco (derecha) y luego su <b>hueco luminoso</b>.</div>
    <div class="g"><div class="gl"><span>Piezas colocadas</span><b id="p_prog">0 / 6</b></div></div>
    <div id="checklist" style="font-family:var(--mono);font-size:11px;line-height:1.85;margin:6px 0"></div>
    <div class="btns">
      <button class="b auto" id="btnAuto">✨ Armado automático (guiado)</button>
      <button class="b" id="btnReset">↺ Reiniciar ensamble</button>
    </div>
  </div>

  <div id="secParam" style="display:none">
    <h4 class="sec">② Parámetros de operación</h4>
    <div class="g"><div class="gl"><span>Tensión de armadura Va</span><b id="t_va">120 V</b></div>
      <input id="sl_va" type="range" min="0" max="130" value="120" step="1" style="width:100%;margin-top:4px"></div>
    <div class="g"><div class="gl"><span>Corriente de campo If</span><b id="t_if">1.00 A</b></div>
      <input id="sl_if" type="range" min="0.4" max="1.3" value="1.0" step="0.01" style="width:100%;margin-top:4px"></div>
    <div class="g"><div class="gl"><span>Par de carga TL</span><b id="t_tl">5.0 N·m</b></div>
      <input id="sl_tl" type="range" min="0" max="6" value="5" step="0.1" style="width:100%;margin-top:4px"></div>
    <h4 class="sec">Telemetría</h4>
    <div class="g"><div class="gl"><span>Corriente de armadura Ia</span><b id="t_ia">—</b></div></div>
    <div class="g"><div class="gl"><span>FEM inducida Ea</span><b id="t_ea">—</b></div></div>
    <div class="g"><div class="gl"><span>Par electromagnético T</span><b id="t_t">—</b></div></div>
    <div class="g"><div class="gl"><span>Velocidad n</span><b id="t_n">—</b></div></div>
    <div class="g"><div class="gl"><span>Potencia mecánica</span><b id="t_pmech">—</b></div></div>
    <div class="g"><div class="gl"><span>Eficiencia η</span><b id="t_eta">—</b></div></div>
    <div class="btns"><button class="b auto" id="btnAuto2">✨ Barrido guiado (automático)</button></div>
  </div>

  <div id="secReto" style="display:none">
    <h4 class="sec">④ Reto — calcula el valor</h4>
    <div class="console" id="retoText">Lee el tablero (izquierda) para ver el escenario.</div>
    <div class="g"><div class="gl"><span>Tu respuesta</span></div>
      <input id="retoInput" type="number" step="0.01" placeholder="valor numérico" style="width:100%;margin-top:4px"></div>
    <div class="btns">
      <button class="b primary" id="btnCheck">✔ Verificar</button>
      <button class="b" id="btnNew">🎲 Nuevo reto</button>
    </div>
  </div>`;

/* ---------- wiring ---------- */
modes.forEach(m=>{ const b=el('m_'+m); if(b) b.onclick=()=>{
  if(mode==='reto'&&!retoSolved&&m!=='reto'){
    showToast('🔒 Resuelve el reto (calcula el valor pedido a partir de Va, If y TL) antes de salir a otro modo — en Circuito/Curva podrías reproducir estos mismos valores y leer la respuesta en la telemetría.');
    synth.beep(220,0.1,0.05);
    return;
  }
  setMode(m);
}; });
el('btnReset').onclick=()=>initAssembly();
el('btnAuto').onclick=()=>autoAssemble();
el('btnAuto2').onclick=()=>autoSweep();
el('btnCheck').onclick=()=>checkReto();
el('btnNew').onclick=()=>newChallenge();
el('sl_va').oninput=e=>{ STATE.Va=+e.target.value; refreshAll(); };
el('sl_if').oninput=e=>{ STATE.If=+e.target.value; refreshAll(); };
el('sl_tl').oninput=e=>{ STATE.TL=+e.target.value; refreshAll(); };
const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{const on=synth.toggle();soundBtn.textContent=on?'🔊':'🔇';soundBtn.classList.toggle('on',on);};

initAssembly();
syncCtrlbar();
setMode('ensamble');

window.__labDebug={
  state:()=>({...STATE}),
  motor:()=>motorState(STATE.Va,STATE.If,STATE.TL),
  mode:()=>mode,
  progress:()=>({placed:{...placed},progress,simUnlocked}),
  reto:()=>({...RETO,solved:retoSolved}),
};
