/* ============================================================
   LAB — MOTOR DE INDUCCIÓN (JAULA DE ARDILLA): DESLIZAMIENTO Y CURVA PAR-VELOCIDAD
   (Dominio D5 · máquinas eléctricas — motor asíncrono trifásico)
   MOLDE E+S — ensamble 3D interactivo (molde E) + panel esquemático con
   modos de exploración sobre canvas (molde S), mismo patrón que el motor
   de CD (par-velocidad-motor-cd) y el generador de CD autoexcitado.
   Referencia curricular: programa ELE-II.1 / EM-II.1 (máquinas de inducción).
   Normas ancla citadas en la lista maestra (d5-06): IEEE 112 (procedimiento
   de prueba de motores de inducción polifásicos) e IEC 60034 (máquinas
   eléctricas rotativas) — citadas de forma general; cláusulas específicas
   sin confirmar por un experto, flag ⚑ (ver ficha.md).
   Modelo de ingeniería (didáctico, ecuación de Kloss simplificada, sin
   resistencia de estátor — estándar en textos de conversión electro-
   mecánica: Fitzgerald/Kingsley/Umans, Chapman):
     · ns   = 120·f / p                     (velocidad síncrona)
     · s    = (ns − n) / ns                 (deslizamiento)
     · T(s) = 2·Tmáx / (s/sm + sm/s)         (curva par-deslizamiento)
   Dado un par de carga TL ≤ Tmáx, el punto de operación estable en la
   rama 0<s≤sm tiene forma cerrada exacta (derivada y verificada
   numéricamente contra un solver de bisección independiente, error
   máximo 3.35e-9 en los casos de prueba, incluidas ambas fronteras):
     s(TL) = sm · (1 − √(1 − k²)) / k,    k = TL/Tmáx
   Si TL > Tmáx no existe punto de operación estable en movimiento: el
   motor se cala (s=1, n=0) y el par que entrega es el par de arranque T(1).
   Parámetros de ejemplo (motor ilustrativo del simulador, NO un datasheet
   de un motor comercial real): Tmáx=22 N·m, sm=0.18.
   CERO Math.random() en la física del motor: la única aleatoriedad de
   esta práctica está en la SELECCIÓN de escenario del modo Reto (qué
   combinación de f/p/deslizamiento se sortea), nunca en el cálculo
   del resultado.
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
  carcasa:  std({...brush, color:0x2f4f66, metalness:0.5,  roughness:0.55, envMapIntensity:0.9}),   // carcasa TEFC pintada, con aletas
  core:     std({...brush, color:0x23272d, metalness:0.75, roughness:0.5}),                          // núcleo laminado (estátor/rotor)
  phaseA:   std({color:0xd64545, metalness:0.85, roughness:0.3, envMapIntensity:1.2}),                // devanado — fase A
  phaseB:   std({color:0xe0b23c, metalness:0.85, roughness:0.3, envMapIntensity:1.2}),                // devanado — fase B
  phaseC:   std({color:0x3d7fd6, metalness:0.85, roughness:0.3, envMapIntensity:1.2}),                // devanado — fase C
  rotorBar: std({...alu, color:0xb7bec4, metalness:0.9,  roughness:0.3,  envMapIntensity:1.2}),       // barras + anillos de la jaula (aluminio)
  shaft:    std({...brush, color:0xc9ced3, metalness:0.95, roughness:0.18, envMapIntensity:1.4}),     // eje pulido
  cap:      std({...alu, color:0x6a7078, metalness:0.75, roughness:0.5, envMapIntensity:1.1}),        // tapas (aluminio fundido)
  fanPlastic:std({color:0x1c1f22, metalness:0.1, roughness:0.75}),                                    // ventilador (plástico)
  fanCover: std({...brush, color:0x384654, metalness:0.55, roughness:0.5, envMapIntensity:0.85}),     // cubierta del ventilador (lámina)
  termBox:  std({color:0x22262b, metalness:0.3, roughness:0.7}),
  termLid:  std({color:0x14171a, metalness:0.3, roughness:0.6}),
  dark:     std({color:0x05070a, roughness:0.8, metalness:0.2}),
  bench:    std({...brush, color:0x2b3138, metalness:0.55, roughness:0.5, envMapIntensity:0.7}),
  benchLeg: std({color:0x171b20, metalness:0.7, roughness:0.4}),
  ped:      std({...brush, color:0x3a4149, metalness:0.85, roughness:0.42, envMapIntensity:0.85}),
  pedTop:   std({...brush, color:0x828a93, metalness:0.95, roughness:0.28, envMapIntensity:1.15}),
  pedRing:  std({color:0x2A9D8F, metalness:0.3, roughness:0.5, emissive:0x1e6f63, emissiveIntensity:0.5}),
};

/* ---------- física del motor de inducción (jaula de ardilla) ---------- */
const SM=0.18, TMAX=22;
function Tcurve(s){ return 2*TMAX/(s/SM + SM/s); }
function motorState(f,p,TL){
  const ns=120*f/p;
  if(TL<=0) return {ns,s:0,n:ns,T:0,stalled:false,w:ns*2*Math.PI/60,Pmech:0};
  if(TL>TMAX){ const Tarr=Tcurve(1); return {ns,s:1,n:0,T:Tarr,stalled:true,w:0,Pmech:0}; }
  const k=TL/TMAX;
  const s=SM*(1-Math.sqrt(1-k*k))/k;
  const n=ns*(1-s);
  const w=n*2*Math.PI/60;
  const Pmech=TL*w;
  return {ns,s,n,T:TL,stalled:false,w,Pmech};
}

/* ---------- constructores de piezas (three.js primitivo) ---------- */
function buildEstator(){
  const g=new THREE.Group();
  const coreLen=0.86, R=0.34, Rin=0.24;
  const core=new THREE.Mesh(new THREE.CylinderGeometry(R,R,coreLen,36,1,true),MAT.core); core.rotation.z=Math.PI/2; core.castShadow=core.receiveShadow=true; g.add(core);
  const bore=new THREE.Mesh(new THREE.CylinderGeometry(Rin,Rin,coreLen*0.98,36,1,true),MAT.dark); bore.rotation.z=Math.PI/2; g.add(bore);
  const phases=[MAT.phaseA,MAT.phaseB,MAT.phaseC];
  for(let i=0;i<9;i++){ const a=i/9*Math.PI*2;
    const c=new THREE.Mesh(new THREE.TorusGeometry(R*0.95,0.04,8,20,Math.PI*0.55),phases[i%3]);
    c.rotation.set(0,a,Math.PI/2*0.25); c.castShadow=true; g.add(c); }
  const lb=labelSprite('Estátor (devanado trifásico)','#8A94A0'); lb.position.set(0,R+0.28,0); lb.scale.multiplyScalar(0.6); g.add(lb);
  return g;
}
function buildRotor(){
  const g=new THREE.Group();
  const len=0.86, R=0.22;
  const core=new THREE.Mesh(new THREE.CylinderGeometry(R,R,len,28),MAT.core); core.rotation.z=Math.PI/2; core.castShadow=true; g.add(core);
  const nBars=16;
  for(let i=0;i<nBars;i++){ const a=i/nBars*Math.PI*2;
    const bar=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,len*0.96,8),MAT.rotorBar);
    bar.rotation.z=Math.PI/2; bar.position.set(0,Math.cos(a)*(R+0.012),Math.sin(a)*(R+0.012)); bar.castShadow=true; g.add(bar); }
  [-len/2+0.01, len/2-0.01].forEach(dx=>{ const ring=new THREE.Mesh(new THREE.TorusGeometry(R+0.012,0.03,10,nBars),MAT.rotorBar); ring.rotation.y=Math.PI/2; ring.position.x=dx; g.add(ring); });
  const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,len+0.9,20),MAT.shaft); shaft.rotation.z=Math.PI/2; shaft.castShadow=true; g.add(shaft);
  const lb=labelSprite('Rotor (jaula de ardilla)','#8A94A0'); lb.position.set(0,R+0.32,0); lb.scale.multiplyScalar(0.6); g.add(lb);
  return g;
}
function buildTapaT(){
  const g=new THREE.Group();
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.58,0.58,0.1,36),MAT.cap); cap.rotation.z=Math.PI/2; cap.castShadow=true; g.add(cap);
  const boss=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.1,24),MAT.cap); boss.rotation.z=Math.PI/2; boss.position.x=-0.06; g.add(boss);
  const stub=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.22,20),MAT.shaft); stub.rotation.z=Math.PI/2; stub.position.x=-0.16; stub.castShadow=true; g.add(stub);
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const vent=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.11,8),MAT.dark);
    vent.rotation.z=Math.PI/2; vent.position.set(0.02,Math.cos(a)*0.34,Math.sin(a)*0.34); g.add(vent); }
  const lb=labelSprite('Tapa trasera (NDE) + muñón','#8A94A0'); lb.position.set(0,0.78,0); lb.scale.multiplyScalar(0.56); g.add(lb);
  return g;
}
function buildTapaD(){
  const g=new THREE.Group();
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.58,0.58,0.1,36),MAT.cap); cap.rotation.z=Math.PI/2; cap.castShadow=true; g.add(cap);
  const boss=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.14,24),MAT.cap); boss.rotation.z=Math.PI/2; boss.position.x=0.1; g.add(boss);
  const stub=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.065,0.36,20),MAT.shaft); stub.rotation.z=Math.PI/2; stub.position.x=0.33; stub.castShadow=true; g.add(stub);
  for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; const bolt=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.06,10),MAT.dark);
    bolt.rotation.z=Math.PI/2; bolt.position.set(-0.03,Math.cos(a)*0.52,Math.sin(a)*0.52); g.add(bolt); }
  const lb=labelSprite('Tapa delantera (DE) — acople de carga','#8A94A0'); lb.position.set(0,0.8,0); lb.scale.multiplyScalar(0.56); g.add(lb);
  return g;
}
function buildVentilador(){
  const g=new THREE.Group();
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.12,20),MAT.fanPlastic); hub.rotation.z=Math.PI/2; hub.castShadow=true; g.add(hub);
  const nBlades=9;
  for(let i=0;i<nBlades;i++){ const a=i/nBlades*Math.PI*2;
    const blade=roundedBox(0.05,0.3,0.12,MAT.fanPlastic,0.02);
    blade.position.set(0,Math.cos(a)*0.2,Math.sin(a)*0.2); blade.rotation.x=a; blade.castShadow=true; g.add(blade); }
  const lb=labelSprite('Ventilador externo','#8A94A0'); lb.position.set(0,0.5,0); lb.scale.multiplyScalar(0.58); g.add(lb);
  return g;
}
function buildCubiertaVentilador(){
  const g=new THREE.Group();
  const domeLen=0.22, R=0.5;
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(R,R*0.35,domeLen,32,1,true),MAT.fanCover); shell.rotation.z=Math.PI/2; shell.castShadow=shell.receiveShadow=true; g.add(shell);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(R,0.03,10,36),MAT.fanCover); rim.rotation.y=Math.PI/2; rim.position.x=domeLen/2; g.add(rim);
  const nSlots=10;
  for(let i=0;i<nSlots;i++){ const a=i/nSlots*Math.PI*2;
    const slot=new THREE.Mesh(new THREE.BoxGeometry(domeLen*0.7,0.03,0.16),MAT.dark);
    slot.position.set(0,Math.cos(a)*R*0.72,Math.sin(a)*R*0.72); slot.rotation.x=a; g.add(slot); }
  const lb=labelSprite('Cubierta del ventilador (perforada)','#8A94A0'); lb.position.set(0,R+0.18,0); lb.scale.multiplyScalar(0.56); g.add(lb);
  return g;
}
/* pieza fija de referencia: carcasa con aletas de enfriamiento y ventana de corte */
function buildCarcasa(){
  const g=new THREE.Group();
  const len=1.9, R=0.62;
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(R,R,len,40,1,true,0.55,Math.PI*2-1.1),MAT.carcasa);
  shell.rotation.z=Math.PI/2; shell.castShadow=shell.receiveShadow=true; g.add(shell);
  const finArc0=0.62, finArc1=Math.PI*2-1.16, nFins=14;
  for(let i=0;i<nFins;i++){ const a=finArc0+(i/(nFins-1))*(finArc1-finArc0);
    const fin=new THREE.Mesh(new THREE.BoxGeometry(len*0.86,0.09,0.02),MAT.carcasa);
    fin.position.set(0,Math.cos(a)*(R+0.05),Math.sin(a)*(R+0.05)); fin.rotation.x=a; fin.castShadow=true; g.add(fin); }
  [-len/2+0.04, len/2-0.04].forEach(dx=>{ const ring=new THREE.Mesh(new THREE.TorusGeometry(R,0.035,10,40),MAT.carcasa); ring.rotation.y=Math.PI/2; ring.position.x=dx; g.add(ring); });
  [-1,1].forEach(s=>{ const foot=roundedBox(0.34,0.14,0.5,MAT.carcasa,0.05); foot.position.set(s*0.55,-R-0.05,0); foot.castShadow=true; g.add(foot); });
  const tbox=roundedBox(0.34,0.26,0.3,MAT.termBox,0.04); tbox.position.set(0,R+0.18,0); tbox.castShadow=true; g.add(tbox);
  const tlid=roundedBox(0.3,0.06,0.26,MAT.termLid,0.02); tlid.position.set(0,R+0.32,0); g.add(tlid);
  const lb=labelSprite('Carcasa con aletas (fija, TEFC)','#8A94A0'); lb.position.set(0,R+0.7,0); lb.scale.multiplyScalar(0.72); g.add(lb);
  return g;
}

/* ---------- registro de piezas (posición HOGAR en mundo) ---------- */
const HUB=[0,1.35,0];                   // centro del eje del motor
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const H=(dx,dy,dz)=>V(HUB[0]+dx,HUB[1]+dy,HUB[2]+dz);
const PARTS=[
  {id:'estator',      name:'Estátor (devanado trifásico)', build:()=>buildEstator(),            home:H(0,0,0),      note:'Devanado fijo trifásico (fases A/B/C) que crea el campo magnético giratorio a ns = 120·f/p.'},
  {id:'rotor',         name:'Rotor (jaula de ardilla)',      build:()=>buildRotor(),               home:H(0,0,0),      note:'Barras conductoras cortocircuitadas por anillos: el campo giratorio induce corriente en ellas sin conexión eléctrica externa (inducción).'},
  {id:'tapaT',         name:'Tapa trasera (NDE)',            build:()=>buildTapaT(),               home:H(-0.75,0,0),  note:'Cierra el extremo trasero; sostiene el rodamiento y saca el muñón donde se monta el ventilador externo.'},
  {id:'tapaD',         name:'Tapa delantera (DE)',           build:()=>buildTapaD(),               home:H(0.72,0,0),   note:'Cierra el extremo de mando; sostiene el rodamiento y saca el eje para acoplar la carga mecánica.'},
  {id:'ventilador',    name:'Ventilador externo',            build:()=>buildVentilador(),          home:H(-1.05,0,0),  note:'Montado en el eje: enfría la carcasa por convección forzada (motor TEFC — totalmente cerrado, ventilado externamente).'},
  {id:'cubiertaVent',  name:'Cubierta del ventilador',       build:()=>buildCubiertaVentilador(),  home:H(-1.35,0,0),  note:'Dirige el flujo de aire del ventilador sobre las aletas de la carcasa; protege las partes móviles.'},
];
const ORDER=PARTS.map(p=>p.id);
const PART=Object.fromEntries(PARTS.map(p=>[p.id,p]));

/* ---------- estado ---------- */
const STAGE_S=0.42;
const groups={}, ghosts={}, labels={};
let placed={}, selectedId=null, progress=0, simUnlocked=false;
const tweens=[];
const trayObjs=[], ghostObjs=[], scratch=[];
const carcasa=buildCarcasa(); carcasa.position.set(...HUB); scene.add(carcasa);

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
  el('asmStatus').innerHTML='<span style="color:var(--good)">✅ Motor ensamblado.</span> Ahora explora la operación, la curva par–velocidad y el reto (arriba).';
  showToast('<span style="color:var(--good)">✅ Motor armado.</span><br><span style="color:var(--dim);font-size:11px">Cambia de modo arriba para ver el deslizamiento y la curva par–velocidad.</span>',4200);
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

/* ---------- tablero esquemático (canvas) — operación / curva / reto ---------- */
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

const STATE={f:60, p:4, TL:10};

function drawOperacion(){
  const st=motorState(STATE.f,STATE.p,STATE.TL);
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Deslizamiento — campo del estátor vs. rotor','#8fd1ff',26);
  const cx=230, cy=290, Rout=170, Rin=95;
  bCx.beginPath(); bCx.arc(cx,cy,Rout,0,Math.PI*2); bCx.strokeStyle='#3d7fd6'; bCx.lineWidth=4; bCx.stroke();
  bCx.beginPath(); bCx.arc(cx,cy,Rin,0,Math.PI*2); bCx.strokeStyle='#e0b23c'; bCx.lineWidth=4; bCx.stroke();
  const aOut=-Math.PI/2;
  const sVis=Math.min(st.s,1);
  const aIn=aOut+sVis*1.6; // atraso angular ilustrativo (no a escala temporal real)
  line(cx,cy,cx+Math.cos(aOut)*Rout,cy+Math.sin(aOut)*Rout,'#3d7fd6',5);
  line(cx,cy,cx+Math.cos(aIn)*Rin,cy+Math.sin(aIn)*Rin,'#e0b23c',5);
  labelAt(cx,cy-Rout-16,'Campo del estátor → ns','#3d7fd6',18,'center');
  labelAt(cx,cy+Rin+34,'Rotor → n < ns','#e0b23c',18,'center');
  const rx=520;
  labelAt(rx,110,`f = ${tf(STATE.f,0)} Hz     p = ${STATE.p} polos`,'#dfe7ee',22);
  labelAt(rx,150,`ns = 120·f/p = ${tf(st.ns,0)} rpm`,'#dfe7ee',22);
  labelAt(rx,200,`TL (carga) = ${tf(STATE.TL,1)} N·m`,'#dfe7ee',20);
  labelAt(rx,250,`s = ${st.stalled?'1.000 (rotor bloqueado)':tf(st.s,4)}`,st.stalled?'#ff6b6b':'#dfe7ee',22);
  labelAt(rx,290,`n = ${tf(st.n,0)} rpm`,st.stalled?'#ff6b6b':'#dfe7ee',22);
  labelAt(rx,330,`T = ${tf(st.T,2)} N·m`,'#dfe7ee',20);
  labelAt(rx,370,`Pmec = ${tf(st.Pmech,0)} W`,'#dfe7ee',20);
  if(st.stalled) labelAt(40,700,'⚠ El motor se cala: TL supera el par máximo (de vuelco) — no hay punto de operación estable en movimiento.','#ff6b6b',18);
  bTex.needsUpdate=true;
}

function drawCurva(){
  const st=motorState(STATE.f,STATE.p,STATE.TL);
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Curva par–velocidad (ecuación de Kloss)','#8fd1ff',26);
  const ox=110, oy=680, w=850, h=560, NMAX=3700, TGMAX=26;
  line(ox,oy,ox+w,oy,'#5b6672',2); line(ox,oy,ox,oy-h,'#5b6672',2);
  labelAt(ox+w,oy+30,'n (rpm)','#dfe7ee',18,'right');
  labelAt(ox,oy-h-16,'T (N·m)','#dfe7ee',18,'left');
  const px=n=>ox+Math.min(1,n/NMAX)*w, py=T=>oy-Math.min(1,T/TGMAX)*h;
  const ns=st.ns;
  bCx.beginPath();
  for(let i=0;i<=200;i++){ const s=0.0015+(SM-0.0015)*(i/200); const T=Tcurve(s), n=ns*(1-s);
    const x=px(n), y=py(T); if(i===0) bCx.moveTo(x,y); else bCx.lineTo(x,y); }
  bCx.strokeStyle='#43D9AD'; bCx.lineWidth=3; bCx.stroke();
  bCx.beginPath(); bCx.setLineDash([7,6]);
  for(let i=0;i<=200;i++){ const s=SM+(1-SM)*(i/200); const T=Tcurve(s), n=ns*(1-s);
    const x=px(n), y=py(T); if(i===0) bCx.moveTo(x,y); else bCx.lineTo(x,y); }
  bCx.strokeStyle='#7a8a96'; bCx.lineWidth=3; bCx.stroke(); bCx.setLineDash([]);
  labelAt(ox+w-10,py(Tcurve((SM+1)/2))-14,'zona inestable','#7a8a96',15,'right');
  line(ox,py(TMAX),ox+w,py(TMAX),'#f4c95d',1.5);
  labelAt(ox+w,py(TMAX)-8,`Tmáx = ${TMAX} N·m (vuelco, s=${SM})`,'#f4c95d',16,'right');
  const brkx=px(ns*(1-SM)), brky=py(TMAX);
  bCx.beginPath(); bCx.arc(brkx,brky,6,0,Math.PI*2); bCx.fillStyle='#f4c95d'; bCx.fill();
  const opx=px(st.n), opy=py(st.T);
  bCx.beginPath(); bCx.arc(opx,opy,9,0,Math.PI*2); bCx.fillStyle=st.stalled?'#ff6b6b':'#43D9AD'; bCx.fill();
  labelAt(opx+16,opy-10,`(${tf(st.n,0)} rpm, ${tf(st.T,2)} N·m)`,'#dfe7ee',18);
  if(st.stalled) labelAt(40,730,'⚠ TL > Tmáx: el motor se cala (rotor bloqueado, s=1)','#ff6b6b',18);
  bTex.needsUpdate=true;
}

function drawReto(){
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Reto — calcula el valor pedido','#8fd1ff',26);
  let dataLine, qLine;
  if(RETO.kind==='ns'){
    dataLine=`Datos de placa: f = ${tf(RETO.f,0)} Hz   ·   p = ${RETO.p} polos`;
    qLine='¿Cuál es la velocidad síncrona ns (rpm)?';
  } else if(RETO.kind==='s'){
    dataLine=`f = ${tf(RETO.f,0)} Hz · p = ${RETO.p} polos (ns=${tf(RETO.ns,0)} rpm)   ·   Tacómetro: n = ${tf(RETO.nMeasured,0)} rpm`;
    qLine='¿Cuál es el deslizamiento s (como fracción, ej. 0.05)?';
  } else {
    dataLine=`f = ${tf(RETO.f,0)} Hz · p = ${RETO.p} polos (ns=${tf(RETO.ns,0)} rpm)   ·   Deslizamiento nominal de placa: s = ${tf(RETO.s0,3)}`;
    qLine='¿Cuál es la velocidad n (rpm)?';
  }
  labelAt(40,120,dataLine,'#dfe7ee',20);
  labelAt(40,190,qLine,'#f4c95d',24);
  labelAt(40,240,'ns = 120·f/p     s = (ns − n)/ns','#8A94A0',18);
  const dec=RETO.kind==='s'?4:0;
  if(retoSolved) labelAt(40,310,`✔ Correcto: ${tf(RETO.target,dec)}`,'#43D9AD',22);
  bTex.needsUpdate=true;
  const rt=el('retoText');
  if(rt) rt.textContent=dataLine+' — '+qLine+(retoSolved?` ✔ Correcto: ${tf(RETO.target,dec)}`:'');
}
function drawBoard(){ if(mode==='operacion') drawOperacion(); else if(mode==='curva') drawCurva(); else if(mode==='reto') drawReto(); }

function updateTele(){
  const st=motorState(STATE.f,STATE.p,STATE.TL);
  el('t_f').textContent=`${tf(STATE.f,0)} Hz`;
  el('t_p').textContent=`${STATE.p} polos`;
  el('t_tl').textContent=`${tf(STATE.TL,1)} N·m`;
  el('t_ns').textContent=`${tf(st.ns,0)} rpm`;
  el('t_s').textContent=st.stalled?'1.000 (bloqueado)':tf(st.s,4); el('t_s').className=st.stalled?'bad':'';
  el('t_n').textContent=`${tf(st.n,0)} rpm`; el('t_n').className=st.stalled?'bad':'';
  el('t_t').textContent=`${tf(st.T,2)} N·m`;
  el('t_pmech').textContent=`${tf(st.Pmech,0)} W`;
}
function refreshAll(){ updateTele(); if(mode==='operacion'||mode==='curva'||mode==='reto') drawBoard(); }

/* ---------- máquina de modos ---------- */
const MODE_META={
  ensamble:{nombre:'Ensamble', cam:[[3.6,2.6,4.4],[0,1.5,0]]},
  operacion:{nombre:'Operación', cam:[[-1.0,2.05,2.35],[-2.6,1.65,-0.2]]},
  curva:{nombre:'Curva par–velocidad', cam:[[-1.0,2.05,2.35],[-2.6,1.65,-0.2]]},
  reto:{nombre:'Reto', cam:[[-1.0,2.05,2.35],[-2.6,1.65,-0.2]]},
};
const modes=['ensamble','operacion','curva','reto'];
let mode='ensamble';
function setMode(k){
  if(k!=='ensamble' && !simUnlocked){ showToast('<span style="color:var(--bad)">🔒 Termina el ensamble primero.</span>'); synth.beep(220,0.08,0.05); return; }
  mode=k;
  modes.forEach(m=>{ const b=el('m_'+m); if(b) b.classList.toggle('on',m===k); });
  el('p_mode').textContent=MODE_META[k].nombre;
  el('secEnsamble').style.display=k==='ensamble'?'':'none';
  el('secParam').style.display=(k==='operacion'||k==='curva')?'':'none';
  el('secReto').style.display=k==='reto'?'':'none';
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  if(k==='reto' && !RETO.active) newChallenge();
  refreshAll();
}
function syncCtrlbar(){ modes.forEach(m=>{ const b=el('m_'+m); if(b && m!=='ensamble') b.disabled=!simUnlocked; }); }

/* ---------- reto numérico ---------- */
const F_SET=[50,60], P_SET=[2,4,6,8], S0_SET=[0.02,0.03,0.045,0.06,0.08,0.10,0.13,0.16], KIND_SET=['ns','s','n'];
let RETO={active:false, f:60, p:4, ns:1800, kind:'ns', s0:null, nMeasured:null, target:1800};
let retoSolved=false;
function newChallenge(){
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const f=pick(F_SET), p=pick(P_SET), ns=120*f/p;
  const kind=pick(KIND_SET);
  let s0=null, nMeasured=null, target;
  if(kind==='ns'){ target=ns; }
  else if(kind==='s'){ s0=pick(S0_SET); nMeasured=ns*(1-s0); target=s0; }
  else { s0=pick(S0_SET); target=ns*(1-s0); }
  RETO={active:true,f,p,ns,kind,s0,nMeasured,target};
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
  const tol=RETO.kind==='ns'?1:RETO.kind==='s'?Math.max(0.05*RETO.target,0.005):Math.max(0.03*RETO.target,10);
  const ok=Math.abs(v-RETO.target)<=tol;
  retoSolved=ok;
  const dec=RETO.kind==='s'?4:0;
  if(ok){ showToast(`<span style="color:var(--good)">✔ Correcto: ${tf(RETO.target,dec)}</span>`); synth.beep(1046,0.12,0.06); }
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
  const seq=[[60,4,0],[60,4,10],[60,4,20],[60,4,23],[60,8,10],[50,4,10]];
  for(const [f,p,TL] of seq){
    STATE.f=f; STATE.p=p; STATE.TL=TL;
    el('sl_f').value=f; el('sl_p').value=p; el('sl_tl').value=TL;
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
  if(simUnlocked && (mode==='operacion'||mode==='curva')){
    const st=motorState(STATE.f,STATE.p,STATE.TL);
    const dRot=st.stalled?0:dt*Math.min(st.w,60)*0.15;
    if(groups.rotor) groups.rotor.rotation.x+=dRot;
    if(groups.ventilador) groups.ventilador.rotation.x+=dRot;
  }
});
S.start();

/* ---------- HUD ---------- */
el('hud').innerHTML=`
  <div class="eyebrow">Máquinas eléctricas · Motor de inducción</div>
  <h2>Motor de inducción: deslizamiento y curva par-velocidad</h2>
  <p>Arma el motor jaula de ardilla pieza por pieza (<b>toca la pieza, luego su hueco</b>) y luego explora cómo la frecuencia f, el número de polos p y el par de carga TL determinan la velocidad síncrona, el deslizamiento y el par que entrega la máquina.</p>
  <div class="formula">ns = 120·f / p<br>s = (ns − n) / ns<br>T(s) = 2·Tmáx / (s/sm + sm/s)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#2f4f66"></span>Carcasa con aletas (fija, TEFC)</div>
    <div class="li"><span class="dot" style="background:#23272d"></span>Núcleo laminado (estátor/rotor)</div>
    <div class="li"><span class="dot" style="background:#d64545"></span>Devanado trifásico (fases A/B/C)</div>
    <div class="li"><span class="dot" style="background:#b7bec4"></span>Barras y anillos de la jaula (aluminio)</div>
    <div class="li"><span class="dot" style="background:#1c1f22"></span>Ventilador externo</div>
  </div>
  <div class="fid">
    <div class="ft">Contrato de fidelidad</div>
    <div class="fl">SÍ modela: <b>ns=120·f/p; s=(ns−n)/ns; la curva par-deslizamiento simplificada de Kloss T(s)=2·Tmáx/(s/sm+sm/s), con sm y Tmáx como parámetros ilustrativos fijos del simulador; distingue la rama estable (0&lt;s≤sm) del estancamiento cuando TL supera Tmáx.</b></div>
    <div class="fl no">NO modela: <b>el circuito eléctrico equivalente (R1, X1, R2', X2', Xm — ver práctica d5-08), la relación V/f de un variador de frecuencia, corriente de arranque (inrush), calentamiento, ni la resistencia del estátor (se desprecia, como es estándar en la ecuación de Kloss simplificada). Tmáx y sm se tratan como constantes fijas, independientes de f — no hay debilitamiento de campo modelado.</b></div>
    <div class="fl no">Geometría <b>didáctica</b>: omite rodamientos, aislamiento de ranura, balanceo dinámico del rotor y el detalle interno de la caja de conexiones. El diagrama de deslizamiento (modo Operación) es simbólico: el ángulo de atraso del rotor no está a escala temporal real.</div>
  </div>
  <div class="src">Motor de ejemplo del simulador (jaula de ardilla), <b>no un datasheet real</b>: Tmáx=22 N·m, sm=0.18 (parámetros ilustrativos). El deslizador de frecuencia cubre 50-60 Hz (los dos estándares de red); no representa un variador de frecuencia. Referencias normativas generales: IEEE 112 (procedimiento de prueba de motores de inducción polifásicos) e IEC 60034 (máquinas eléctricas rotativas) — programa curricular ELE-II.1 / EM-II.1. ⚑ Cláusulas específicas sin confirmar por experto.</div>
  <div class="modebar">
    <button class="b on" id="m_ensamble">① Ensamble</button>
    <button class="b" id="m_operacion" disabled>② Operación</button>
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
    <div class="g"><div class="gl"><span>Frecuencia de línea f</span><b id="t_f">60 Hz</b></div>
      <input id="sl_f" type="range" min="50" max="60" value="60" step="1" style="width:100%;margin-top:4px"></div>
    <div class="g"><div class="gl"><span>Número de polos p</span><b id="t_p">4 polos</b></div>
      <input id="sl_p" type="range" min="2" max="8" value="4" step="2" style="width:100%;margin-top:4px"></div>
    <div class="g"><div class="gl"><span>Par de carga TL</span><b id="t_tl">10.0 N·m</b></div>
      <input id="sl_tl" type="range" min="0" max="26" value="10" step="0.5" style="width:100%;margin-top:4px"></div>
    <h4 class="sec">Telemetría</h4>
    <div class="g"><div class="gl"><span>Velocidad síncrona ns</span><b id="t_ns">—</b></div></div>
    <div class="g"><div class="gl"><span>Deslizamiento s</span><b id="t_s">—</b></div></div>
    <div class="g"><div class="gl"><span>Velocidad del rotor n</span><b id="t_n">—</b></div></div>
    <div class="g"><div class="gl"><span>Par entregado T</span><b id="t_t">—</b></div></div>
    <div class="g"><div class="gl"><span>Potencia mecánica</span><b id="t_pmech">—</b></div></div>
    <div class="btns"><button class="b auto" id="btnAuto2">✨ Barrido guiado (automático)</button></div>
  </div>

  <div id="secReto" style="display:none">
    <h4 class="sec">④ Reto — calcula el valor</h4>
    <div class="console" id="retoText">Lee el tablero (izquierda) para ver el escenario.</div>
    <div class="g"><div class="gl"><span>Tu respuesta</span></div>
      <input id="retoInput" type="number" step="0.001" placeholder="valor numérico" style="width:100%;margin-top:4px"></div>
    <div class="btns">
      <button class="b primary" id="btnCheck">✔ Verificar</button>
      <button class="b" id="btnNew">🎲 Nuevo reto</button>
    </div>
  </div>`;

/* ---------- wiring ---------- */
modes.forEach(m=>{ const b=el('m_'+m); if(b) b.onclick=()=>setMode(m); });
el('btnReset').onclick=()=>initAssembly();
el('btnAuto').onclick=()=>autoAssemble();
el('btnAuto2').onclick=()=>autoSweep();
el('btnCheck').onclick=()=>checkReto();
el('btnNew').onclick=()=>newChallenge();
el('sl_f').oninput=e=>{ STATE.f=+e.target.value; refreshAll(); };
el('sl_p').oninput=e=>{ STATE.p=+e.target.value; refreshAll(); };
el('sl_tl').oninput=e=>{ STATE.TL=+e.target.value; refreshAll(); };
const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{const on=synth.toggle();soundBtn.textContent=on?'🔊':'🔇';soundBtn.classList.toggle('on',on);};

initAssembly();
syncCtrlbar();
setMode('ensamble');

window.__labDebug={
  state:()=>({...STATE}),
  motor:()=>motorState(STATE.f,STATE.p,STATE.TL),
  mode:()=>mode,
  progress:()=>({placed:{...placed},progress,simUnlocked}),
  reto:()=>({...RETO,solved:retoSolved}),
};
