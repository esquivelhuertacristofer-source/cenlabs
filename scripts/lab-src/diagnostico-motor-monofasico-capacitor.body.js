/* ============================================================
   LAB — MOTOR MONOFÁSICO: FASE PARTIDA Y CAPACITOR — DIAGNÓSTICO
   (Dominio D5 · máquinas eléctricas — motor asíncrono monofásico)
   MOLDE E+S — ensamble 3D interactivo (molde E) + panel esquemático
   con modos de exploración sobre canvas (molde S), mismo patrón que
   el motor de CD, el motor de inducción trifásico y el generador de
   CD autoexcitado.
   Referencia curricular: programa ELE-II.1 (fila d5-10 de la lista
   maestra). La lista maestra NO asigna una norma ancla a esta
   práctica (columna "Norma ancla" vacía) — se citan solo como
   referencia contextual NEMA MG-1 y la teoría estándar de conversión
   electromecánica de motores monofásicos (Fitzgerald/Kingsley/Umans,
   Chapman). Ver ficha.md para el detalle completo del hedge de fuentes.
   Modelo de ingeniería (didáctico, valores de catálogo/texto de
   referencia, NO una placa de motor comercial real):
     · MOTOR_TYPES — 4 arquitecturas monofásicas (RSIR, CSIR, PSC,
       CSCR) con su rango de par de arranque en %FLT, corriente de
       arranque relativa, número de capacitores, presencia de
       interruptor centrífugo y desfase eléctrico aproximado.
     · FALLAS — 6 escenarios de diagnóstico por resistencia entre
       terminales C (común) - S (start) - R (run), construidos para
       que R(C-R) + R(C-S) = R(S-R) exactamente en todo escenario con
       lecturas finitas (relación serie de dos devanados medidos desde
       un terminal común) — verificado con node -e antes de escribir
       este archivo.
   CERO Math.random() salvo en newChallenge() del modo Reto (única
   selección aleatoria de toda la práctica: qué escenario de falla se
   sortea, nunca el cálculo de las lecturas).
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
  mainWind: std({color:0xd64545, metalness:0.85, roughness:0.3, envMapIntensity:1.2}),                // devanado principal (marcha) — calibre grueso
  auxWind:  std({color:0xe0b23c, metalness:0.85, roughness:0.3, envMapIntensity:1.2}),                // devanado auxiliar (arranque) — calibre delgado
  rotorBar: std({...alu, color:0xb7bec4, metalness:0.9,  roughness:0.3,  envMapIntensity:1.2}),       // barras + anillos de la jaula (aluminio)
  shaft:    std({...brush, color:0xc9ced3, metalness:0.95, roughness:0.18, envMapIntensity:1.4}),     // eje pulido / brazos del interruptor
  cap:      std({...alu, color:0x6a7078, metalness:0.75, roughness:0.5, envMapIntensity:1.1}),        // tapas (aluminio fundido)
  capBody:  std({...brush, color:0x8a8f94, metalness:0.7,  roughness:0.35, envMapIntensity:1.1}),     // lata del capacitor de arranque (aluminio cepillado)
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

/* ---------- datos de ingeniería (verificados con node -e antes de escribir este archivo) ---------- */
const MOTOR_TYPES={
  rsir: {nombre:'Fase partida (RSIR)',                    torqueMin:100, torqueMax:175, corrienteArranque:'alta',  switchCentrifugo:true,  nCapacitores:0, faseGrados:'25°–30°', uso:'Cargas de arranque ligero: bombas pequeñas, sopladores, compresores pequeños.', color:'#3d7fd6'},
  csir: {nombre:'Capacitor de arranque (CSIR)',            torqueMin:350, torqueMax:450, corrienteArranque:'media', switchCentrifugo:true,  nCapacitores:1, faseGrados:'80°–90°', uso:'Cargas de arranque pesado: compresores herméticos, bombas de pistón, transportadores.', color:'#43D9AD'},
  psc:  {nombre:'Capacitor permanente (PSC)',              torqueMin:50,  torqueMax:100, corrienteArranque:'baja',  switchCentrifugo:false, nCapacitores:1, faseGrados:'≈80°',    uso:'Arranque muy ligero, marcha silenciosa: ventiladores, extractores, equipos HVAC.', color:'#e0b23c'},
  cscr: {nombre:'Capacitor de arranque y marcha (CSCR)',   torqueMin:350, torqueMax:450, corrienteArranque:'media', switchCentrifugo:true,  nCapacitores:2, faseGrados:'80°–90°', uso:'Motores de mayor potencia: compresores de alto HP, bombas de carga alta.', color:'#d64545'},
};
const TIPOS_ORDER=['psc','rsir','csir','cscr']; // orden ascendente de par de arranque

const FALLAS={
  sano:              {nombre:'Motor sano',                         CR:2.0, CS:3.6, SR:5.6,       tierra:'OL (aislamiento sano)', capacitor:'valor nominal',           sintoma:'Arranca y alcanza la velocidad nominal con normalidad.'},
  aux_abierto:       {nombre:'Devanado auxiliar abierto',          CR:2.0, CS:Infinity, SR:Infinity, tierra:'OL',                 capacitor:'valor nominal',           sintoma:'Zumba pero no arranca.'},
  principal_abierto: {nombre:'Devanado principal abierto',         CR:Infinity, CS:3.6, SR:Infinity, tierra:'OL',                 capacitor:'valor nominal',           sintoma:'No enciende, no zumba, no consume corriente.'},
  capacitor_corto:   {nombre:'Capacitor en corto',                 CR:2.0, CS:3.6, SR:5.6,       tierra:'OL',                     capacitor:'≈0 Ω (corto franco)',      sintoma:'Arranca con par reducido y corriente elevada; puede disparar la protección térmica.'},
  capacitor_abierto: {nombre:'Capacitor abierto',                  CR:2.0, CS:3.6, SR:5.6,       tierra:'OL',                     capacitor:'OL (sin continuidad)',     sintoma:'Zumba con dificultad para arrancar, corriente elevada.'},
  devanado_tierra:   {nombre:'Devanado principal en corto a tierra', CR:2.0, CS:3.6, SR:5.6,     tierra:'Continuidad R–tierra (falla de aislamiento)', capacitor:'valor nominal', sintoma:'Dispara el interruptor diferencial al energizar: riesgo eléctrico.'},
};
const FALLAS_ORDER=['sano','aux_abierto','principal_abierto','capacitor_corto','capacitor_abierto','devanado_tierra'];
function ohm(v){ return v===Infinity ? 'OL (circuito abierto)' : `${tf(v,1)} Ω`; }

/* ---------- constructores de piezas (three.js primitivo) ---------- */
function buildEstatorPrincipal(){
  const g=new THREE.Group();
  const coreLen=0.86, R=0.34, Rin=0.24;
  const core=new THREE.Mesh(new THREE.CylinderGeometry(R,R,coreLen,36,1,true),MAT.core); core.rotation.z=Math.PI/2; core.castShadow=core.receiveShadow=true; g.add(core);
  const bore=new THREE.Mesh(new THREE.CylinderGeometry(Rin,Rin,coreLen*0.98,36,1,true),MAT.dark); bore.rotation.z=Math.PI/2; g.add(bore);
  for(let i=0;i<6;i++){ const a=i/6*Math.PI*2;
    const c=new THREE.Mesh(new THREE.TorusGeometry(R*0.95,0.05,8,20,Math.PI*0.72),MAT.mainWind);
    c.rotation.set(0,a,Math.PI/2*0.25); c.castShadow=true; g.add(c); }
  const lb=labelSprite('Devanado principal (marcha)','#8A94A0'); lb.position.set(0,R+0.28,0); lb.scale.multiplyScalar(0.6); g.add(lb);
  return g;
}
function buildDevanadoAuxiliar(){
  const g=new THREE.Group();
  const R=0.34;
  for(let i=0;i<6;i++){ const a=i/6*Math.PI*2 + Math.PI/6; // medio paso respecto al devanado principal
    const c=new THREE.Mesh(new THREE.TorusGeometry(R*1.06,0.028,8,20,Math.PI*0.6),MAT.auxWind);
    c.rotation.set(0,a,Math.PI/2*0.25); c.castShadow=true; g.add(c); }
  const lb=labelSprite('Devanado auxiliar (arranque)','#8A94A0'); lb.position.set(0,R*1.06+0.3,0); lb.scale.multiplyScalar(0.6); g.add(lb);
  return g;
}
function buildRotorJaula(){
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
function buildTapaTrasera(){
  const g=new THREE.Group();
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.58,0.58,0.1,36),MAT.cap); cap.rotation.z=Math.PI/2; cap.castShadow=true; g.add(cap);
  const boss=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.1,24),MAT.cap); boss.rotation.z=Math.PI/2; boss.position.x=-0.06; g.add(boss);
  const stub=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.22,20),MAT.shaft); stub.rotation.z=Math.PI/2; stub.position.x=-0.16; stub.castShadow=true; g.add(stub);
  for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; const vent=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.11,8),MAT.dark);
    vent.rotation.z=Math.PI/2; vent.position.set(0.02,Math.cos(a)*0.34,Math.sin(a)*0.34); g.add(vent); }
  const lb=labelSprite('Tapa trasera (NDE)','#8A94A0'); lb.position.set(0,0.78,0); lb.scale.multiplyScalar(0.56); g.add(lb);
  return g;
}
function buildTapaDelantera(){
  const g=new THREE.Group();
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.58,0.58,0.1,36),MAT.cap); cap.rotation.z=Math.PI/2; cap.castShadow=true; g.add(cap);
  const boss=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.14,24),MAT.cap); boss.rotation.z=Math.PI/2; boss.position.x=0.1; g.add(boss);
  const stub=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.065,0.36,20),MAT.shaft); stub.rotation.z=Math.PI/2; stub.position.x=0.33; stub.castShadow=true; g.add(stub);
  for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; const bolt=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.06,10),MAT.dark);
    bolt.rotation.z=Math.PI/2; bolt.position.set(-0.03,Math.cos(a)*0.52,Math.sin(a)*0.52); g.add(bolt); }
  const lb=labelSprite('Tapa delantera (DE) — acople de carga','#8A94A0'); lb.position.set(0,0.8,0); lb.scale.multiplyScalar(0.56); g.add(lb);
  return g;
}
function buildInterruptorCentrifugo(){
  const g=new THREE.Group();
  const box=roundedBox(0.22,0.16,0.18,MAT.termBox,0.03); box.castShadow=true; g.add(box);
  const lid=roundedBox(0.19,0.04,0.15,MAT.termLid,0.015); lid.position.y=0.1; g.add(lid);
  [-1,1].forEach(s=>{
    const arm=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.16,10),MAT.shaft);
    arm.position.set(s*0.09,0.02,0); arm.rotation.z=s*0.6; arm.castShadow=true; g.add(arm);
    const weight=new THREE.Mesh(new THREE.SphereGeometry(0.03,14,10),MAT.shaft);
    weight.position.set(s*0.16,0.02-s*0.05,0); weight.castShadow=true; g.add(weight);
  });
  const lb=labelSprite('Interruptor centrífugo','#8A94A0'); lb.position.set(0,0.28,0); lb.scale.multiplyScalar(0.5); g.add(lb);
  return g;
}
function buildVentilador(){
  const g=new THREE.Group();
  const fanCore=new THREE.Group();
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.12,20),MAT.fanPlastic); hub.rotation.z=Math.PI/2; hub.castShadow=true; fanCore.add(hub);
  const nBlades=9;
  for(let i=0;i<nBlades;i++){ const a=i/nBlades*Math.PI*2;
    const blade=roundedBox(0.05,0.3,0.12,MAT.fanPlastic,0.02);
    blade.position.set(0,Math.cos(a)*0.2,Math.sin(a)*0.2); blade.rotation.x=a; blade.castShadow=true; fanCore.add(blade); }
  g.add(fanCore);
  const coverShell=new THREE.Group();
  const domeLen=0.22, R=0.5, ox=-0.29;
  const shell=new THREE.Mesh(new THREE.CylinderGeometry(R,R*0.35,domeLen,32,1,true),MAT.fanCover); shell.position.x=ox; shell.rotation.z=Math.PI/2; shell.castShadow=shell.receiveShadow=true; coverShell.add(shell);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(R,0.03,10,36),MAT.fanCover); rim.rotation.y=Math.PI/2; rim.position.x=ox+domeLen/2; coverShell.add(rim);
  const nSlots=10;
  for(let i=0;i<nSlots;i++){ const a=i/nSlots*Math.PI*2;
    const slot=new THREE.Mesh(new THREE.BoxGeometry(domeLen*0.7,0.03,0.16),MAT.dark);
    slot.position.set(ox,Math.cos(a)*R*0.72,Math.sin(a)*R*0.72); slot.rotation.x=a; coverShell.add(slot); }
  g.add(coverShell);
  g.userData.spinPart=fanCore;
  const lb=labelSprite('Ventilador + cubierta','#8A94A0'); lb.position.set(0,0.5,0); lb.scale.multiplyScalar(0.58); g.add(lb);
  return g;
}
function buildCapacitorArranque(){
  const g=new THREE.Group();
  const R=0.11, len=0.32;
  const can=new THREE.Mesh(new THREE.CylinderGeometry(R,R,len,24),MAT.capBody); can.castShadow=true; g.add(can);
  const dome=new THREE.Mesh(new THREE.SphereGeometry(R,20,12,0,Math.PI*2,0,Math.PI/2),MAT.capBody); dome.position.y=len/2; g.add(dome);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(R+0.003,R+0.003,0.03,24),MAT.dark); band.position.y=len/2-0.08; g.add(band);
  [-1,1].forEach(s=>{ const stud=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.05,10),MAT.shaft);
    stud.position.set(s*0.04,len/2+0.05,0); stud.castShadow=true; g.add(stud); });
  const lb=labelSprite('Capacitor de arranque','#8A94A0'); lb.position.set(0,len/2+0.22,0); lb.scale.multiplyScalar(0.5); g.add(lb);
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
  {id:'estatorPrincipal',    name:'Devanado principal (marcha)',   build:()=>buildEstatorPrincipal(),   home:H(0,0,0),        note:'Alambre de calibre grueso y baja resistencia: conduce la mayor parte de la corriente en marcha continua.'},
  {id:'devanadoAuxiliar',    name:'Devanado auxiliar (arranque)',  build:()=>buildDevanadoAuxiliar(),   home:H(0,0,0),        note:'Alambre más delgado y de mayor resistencia que el principal: ese desfase es lo que crea el campo giratorio parcial necesario para el arranque.'},
  {id:'rotorJaula',          name:'Rotor (jaula de ardilla)',      build:()=>buildRotorJaula(),         home:H(0,0,0),        note:'Barras conductoras cortocircuitadas por anillos: el campo giratorio induce corriente en ellas sin conexión eléctrica externa.'},
  {id:'tapaTrasera',         name:'Tapa trasera (NDE)',            build:()=>buildTapaTrasera(),        home:H(-0.75,0,0),    note:'Cierra el extremo trasero; sostiene el rodamiento y saca el muñón donde se monta el ventilador.'},
  {id:'tapaDelantera',       name:'Tapa delantera (DE)',           build:()=>buildTapaDelantera(),      home:H(0.72,0,0),     note:'Cierra el extremo de mando; sostiene el rodamiento y saca el eje para acoplar la carga mecánica.'},
  {id:'interruptorCentrifugo', name:'Interruptor centrífugo',      build:()=>buildInterruptorCentrifugo(), home:H(-0.5,0.32,0.14), note:'Cerca del 75% de la velocidad nominal, la fuerza centrífuga abre este interruptor y desconecta el devanado auxiliar (y su capacitor, si lo hay): ese devanado no está diseñado para operar de forma continua.'},
  {id:'ventilador',          name:'Ventilador + cubierta',         build:()=>buildVentilador(),         home:H(-1.05,0,0),    note:'Montado en el eje: enfría la carcasa por convección forzada. La cubierta perforada protege el ventilador y dirige el flujo de aire.'},
  {id:'capacitorArranque',   name:'Capacitor de arranque',         build:()=>buildCapacitorArranque(),  home:H(0,0.85,0.35),  note:'En serie con el devanado auxiliar, aumenta el desfase eléctrico hasta 80°-90° —mucho más cerca del ideal de 90°— multiplicando el par de arranque disponible.'},
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
  el('asmStatus').innerHTML='<span style="color:var(--good)">✅ Motor ensamblado.</span> Ahora compara los tipos y diagnostica fallas (arriba).';
  showToast('<span style="color:var(--good)">✅ Motor armado.</span><br><span style="color:var(--dim);font-size:11px">Cambia de modo arriba para comparar arquitecturas y diagnosticar fallas.</span>',4200);
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

/* ---------- tablero esquemático (canvas) — tipos / diagnóstico / reto ---------- */
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
function wrapText(x,y,text,color,size,maxW,lh){
  lh=lh||size*1.35;
  bCx.fillStyle=color; bCx.font=`${size}px 'Segoe UI',sans-serif`; bCx.textAlign='left';
  const words=text.split(' '); let cur='', yy=y;
  for(const w of words){
    const test=cur?cur+' '+w:w;
    if(bCx.measureText(test).width>maxW && cur){ bCx.fillText(cur,x,yy); cur=w; yy+=lh; }
    else cur=test;
  }
  if(cur) bCx.fillText(cur,x,yy);
  return yy;
}

const STATE={tipo:'rsir', falla:'sano'};

function drawTipos(){
  const t=MOTOR_TYPES[STATE.tipo];
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Comparación de tipos — par de arranque (%FLT)','#8fd1ff',26);
  const ox=280, oy=110, barH=46, gap=26, maxPct=500, w=680;
  TIPOS_ORDER.forEach((key,i)=>{
    const mt=MOTOR_TYPES[key];
    const y=oy+i*(barH+gap);
    const sel=key===STATE.tipo;
    const x0=ox+(mt.torqueMin/maxPct)*w, x1=ox+(mt.torqueMax/maxPct)*w;
    bCx.fillStyle=sel?mt.color:'#2a2f35';
    bCx.fillRect(x0,y,Math.max(2,x1-x0),barH);
    labelAt(ox-16,y+barH*0.68,mt.nombre.split('(')[0].trim(),sel?'#dfe7ee':'#7a8a96',18,'right');
    labelAt(x1+14,y+barH*0.68,`${mt.torqueMin}–${mt.torqueMax}%`,sel?'#dfe7ee':'#5b6672',16,'left');
  });
  const axisBottom=oy+TIPOS_ORDER.length*(barH+gap)-gap+10;
  line(ox,oy-14,ox,axisBottom,'#5b6672',2);
  for(let p=0;p<=maxPct;p+=100){ const x=ox+(p/maxPct)*w; line(x,oy-14,x,axisBottom,'#20262c',1); labelAt(x,oy-22,`${p}%`,'#5b6672',14,'center'); }
  const py=axisBottom+40;
  labelAt(40,py,t.nombre,t.color,24);
  labelAt(40,py+40,`Corriente de arranque: ${t.corrienteArranque}   ·   Interruptor centrífugo: ${t.switchCentrifugo?'sí':'no'}   ·   Capacitores: ${t.nCapacitores}   ·   Desfase: ${t.faseGrados}`,'#dfe7ee',18);
  wrapText(40,py+80,`Uso típico: ${t.uso}`,'#8A94A0',18,920);
  bTex.needsUpdate=true;
}

function drawDiagnostico(){
  const f=FALLAS[STATE.falla];
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Diagnóstico — lecturas de óhmetro entre terminales','#8fd1ff',26);
  const cx=200, cy=230, r=140;
  const C=[cx,cy-r], Sp=[cx-r*0.87,cy+r*0.5], R=[cx+r*0.87,cy+r*0.5];
  line(C[0],C[1],Sp[0],Sp[1],'#5b6672',3); line(C[0],C[1],R[0],R[1],'#5b6672',3); line(Sp[0],Sp[1],R[0],R[1],'#5b6672',3);
  labelAt(C[0],C[1]-16,'C','#8fd1ff',22,'center');
  labelAt(Sp[0]-18,Sp[1]+8,'S','#e0b23c',22,'right');
  labelAt(R[0]+18,R[1]+8,'R','#d64545',22,'left');
  labelAt((C[0]+Sp[0])/2-30,(C[1]+Sp[1])/2,ohm(f.CS),'#dfe7ee',14,'right');
  labelAt((C[0]+R[0])/2+30,(C[1]+R[1])/2,ohm(f.CR),'#dfe7ee',14,'left');
  labelAt((Sp[0]+R[0])/2,(Sp[1]+R[1])/2+26,ohm(f.SR),'#dfe7ee',14,'center');
  const rx=460;
  labelAt(rx,110,'Lecturas (motor desenergizado):','#8fd1ff',20);
  labelAt(rx,150,`C–R (principal): ${ohm(f.CR)}`,'#dfe7ee',20);
  labelAt(rx,185,`C–S (auxiliar): ${ohm(f.CS)}`,'#dfe7ee',20);
  labelAt(rx,220,`S–R (serie): ${ohm(f.SR)}`,'#dfe7ee',20);
  labelAt(rx,260,`Continuidad a tierra: ${f.tierra}`,'#dfe7ee',18);
  labelAt(rx,295,`Capacitor: ${f.capacitor}`,'#dfe7ee',18);
  labelAt(rx,340,'Regla de campo: C–R (mínima) + C–S (intermedia) ≈ S–R (máxima)','#8A94A0',15);
  labelAt(40,430,`Diagnóstico: ${f.nombre}`,'#43D9AD',22);
  wrapText(40,470,f.sintoma,'#dfe7ee',18,920);
  labelAt(40,700,'⚠ Toda prueba de continuidad se realiza con el motor desconectado de la línea.','#f4c95d',16);
  bTex.needsUpdate=true;
}

function drawReto(){
  const f=FALLAS[RETO.faultKey];
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Reto — ¿cuál es el diagnóstico?','#8fd1ff',26);
  labelAt(40,110,'Lecturas (motor desenergizado):','#8fd1ff',20);
  labelAt(40,150,`C–R (principal): ${ohm(f.CR)}`,'#dfe7ee',20);
  labelAt(40,185,`C–S (auxiliar): ${ohm(f.CS)}`,'#dfe7ee',20);
  labelAt(40,220,`S–R (serie): ${ohm(f.SR)}`,'#dfe7ee',20);
  labelAt(40,260,`Continuidad a tierra: ${f.tierra}`,'#dfe7ee',18);
  labelAt(40,295,`Capacitor: ${f.capacitor}`,'#dfe7ee',18);
  const yy=wrapText(40,340,`Síntoma: ${f.sintoma}`,'#dfe7ee',18,920);
  labelAt(40,yy+34,'¿Cuál es el diagnóstico? (elige abajo)','#f4c95d',24);
  if(retoSolved) labelAt(40,yy+74,`✔ Correcto: ${f.nombre}`,'#43D9AD',22);
  bTex.needsUpdate=true;
  const rt=el('retoText');
  if(rt) rt.textContent=`C–R ${ohm(f.CR)} · C–S ${ohm(f.CS)} · S–R ${ohm(f.SR)} · tierra: ${f.tierra} · capacitor: ${f.capacitor} — ${f.sintoma}`+(retoSolved?` ✔ Correcto: ${f.nombre}`:'');
}
function drawBoard(){ if(mode==='tipos') drawTipos(); else if(mode==='diagnostico') drawDiagnostico(); else if(mode==='reto') drawReto(); }

function updateTele(){
  const t=MOTOR_TYPES[STATE.tipo];
  el('t_tipoNombre').textContent=t.nombre;
  el('t_tipoPar').textContent=`${t.torqueMin}–${t.torqueMax}% FLT`;
  el('t_tipoCorriente').textContent=t.corrienteArranque;
  el('t_tipoSwitch').textContent=t.switchCentrifugo?'sí':'no';
  el('t_tipoNcap').textContent=String(t.nCapacitores);
  el('t_tipoFase').textContent=t.faseGrados;
  const f=FALLAS[STATE.falla];
  el('t_falCR').textContent=ohm(f.CR);
  el('t_falCS').textContent=ohm(f.CS);
  el('t_falSR').textContent=ohm(f.SR);
  el('t_falTierra').textContent=f.tierra;
  el('t_falCap').textContent=f.capacitor;
}
function refreshAll(){ updateTele(); if(mode==='tipos'||mode==='diagnostico'||mode==='reto') drawBoard(); }

/* ---------- máquina de modos ---------- */
const MODE_META={
  ensamble:{nombre:'Ensamble', cam:[[3.6,2.6,4.4],[0,1.5,0]]},
  tipos:{nombre:'Tipos', cam:[[-1.0,2.05,2.35],[-2.6,1.65,-0.2]]},
  diagnostico:{nombre:'Diagnóstico', cam:[[-1.0,2.05,2.35],[-2.6,1.65,-0.2]]},
  reto:{nombre:'Reto', cam:[[-1.0,2.05,2.35],[-2.6,1.65,-0.2]]},
};
const modes=['ensamble','tipos','diagnostico','reto'];
let mode='ensamble';
function setMode(k){
  if(k!=='ensamble' && !simUnlocked){ showToast('<span style="color:var(--bad)">🔒 Termina el ensamble primero.</span>'); synth.beep(220,0.08,0.05); return; }
  mode=k;
  modes.forEach(m=>{ const b=el('m_'+m); if(b) b.classList.toggle('on',m===k); });
  el('p_mode').textContent=MODE_META[k].nombre;
  el('secEnsamble').style.display=k==='ensamble'?'':'none';
  el('secTipos').style.display=k==='tipos'?'':'none';
  el('secDiagnostico').style.display=k==='diagnostico'?'':'none';
  el('secReto').style.display=k==='reto'?'':'none';
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  if(k==='reto' && !RETO.active) newChallenge();
  refreshAll();
}
function syncCtrlbar(){ modes.forEach(m=>{ const b=el('m_'+m); if(b && m!=='ensamble') b.disabled=!simUnlocked; }); }

/* ---------- reto de diagnóstico ---------- */
let RETO={active:false, faultKey:'sano'};
let retoSolved=false;
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function newChallenge(){
  RETO={active:true, faultKey:pick(FALLAS_ORDER)};
  retoSolved=false;
  drawReto();
  showToast('🎲 Nuevo caso de diagnóstico generado.');
  synth.beep(520,0.08,0.05);
}
function checkReto(guessKey){
  const ok=guessKey===RETO.faultKey;
  retoSolved=ok;
  if(ok){ showToast(`<span style="color:var(--good)">✔ Correcto: ${FALLAS[RETO.faultKey].nombre}</span>`); synth.beep(1046,0.12,0.06); }
  else { showToast('<span style="color:var(--bad)">✗ No es correcto. Revisa las lecturas.</span>'); synth.beep(180,0.14,0.06); }
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
function syncTipoBtns(){ document.querySelectorAll('#tipoBtns [data-tipo]').forEach(b=>b.classList.toggle('on',b.dataset.tipo===STATE.tipo)); }
async function autoTiposTour(){
  if(autoRunning) return; autoRunning=true; const btn=el('btnAutoTipos'); if(btn) btn.disabled=true;
  for(const key of TIPOS_ORDER){ STATE.tipo=key; syncTipoBtns(); refreshAll(); await sleep(1500); }
  if(btn) btn.disabled=false; autoRunning=false;
}
async function autoDiagTour(){
  if(autoRunning) return; autoRunning=true; const btn=el('btnAutoDiag'); if(btn) btn.disabled=true;
  for(const key of FALLAS_ORDER){ STATE.falla=key; const sel=el('selFalla'); if(sel) sel.value=key; refreshAll(); await sleep(1600); }
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
  if(simUnlocked && mode==='tipos'){
    // giro de demostración a ritmo constante — este laboratorio no modela un
    // punto de operación par-velocidad (ver d5-06 para esa curva completa);
    // el giro solo comunica "el motor ya arrancó y gira", nada más.
    const dRot=dt*8;
    if(groups.rotorJaula) groups.rotorJaula.rotation.x+=dRot;
    const fanSpin=groups.ventilador && groups.ventilador.userData.spinPart;
    if(fanSpin) fanSpin.rotation.x+=dRot;
  }
});
S.start();

/* ---------- HUD ---------- */
el('hud').innerHTML=`
  <div class="eyebrow">Máquinas eléctricas · Motor monofásico</div>
  <h2>Diagnostica motores monofásicos de fase partida y capacitor</h2>
  <p>Arma el motor monofásico pieza por pieza (<b>toca la pieza, luego su hueco</b>) y luego compara las cuatro arquitecturas de arranque monofásico y diagnostica fallas típicas leyendo, como lo haría un técnico con un óhmetro en la mano, las resistencias entre los terminales Común (C), Start (S) y Run (R).</p>
  <div class="formula">R(C–R) + R(C–S) ≈ R(S–R)<br>Desfase eléctrico devanado aux. vs. principal → par de arranque</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#2f4f66"></span>Carcasa (fija, TEFC)</div>
    <div class="li"><span class="dot" style="background:#23272d"></span>Núcleo laminado</div>
    <div class="li"><span class="dot" style="background:#d64545"></span>Devanado principal (marcha)</div>
    <div class="li"><span class="dot" style="background:#e0b23c"></span>Devanado auxiliar (arranque)</div>
    <div class="li"><span class="dot" style="background:#8a8f94"></span>Capacitor de arranque</div>
  </div>
  <div class="fid">
    <div class="ft">Contrato de fidelidad</div>
    <div class="fl">SÍ modela: <b>la razón física por la que un devanado monofásico único no arranca un rotor detenido (campo pulsante); la comparación de rango de par de arranque, corriente, capacitores e interruptor centrífugo de las cuatro arquitecturas monofásicas más comunes (RSIR, CSIR, PSC, CSCR); seis escenarios de diagnóstico por resistencia entre terminales C-S-R, internamente consistentes (R(C–R)+R(C–S)=R(S–R) exacto); y el ensamble mecánico completo como precondición para desbloquear el resto de los modos.</b></div>
    <div class="fl no">NO modela: <b>valores exactos de placa de un motor real (los rangos de par de arranque citados varían de fuente a fuente); la dinámica de arranque en el tiempo ni la curva par-velocidad completa (ver d5-06 para el motor trifásico); un multímetro con imprecisión de instrumento; ni el circuito interno específico de dos capacitores del motor CSCR (se representa como un único capacitor genérico en el ensamble 3D).</b></div>
    <div class="fl no">La lista maestra <b>no asigna una norma ancla</b> a esta práctica — las referencias citadas (NEMA MG-1, textos de conversión electromecánica) son contexto, no una norma verificada cláusula por cláusula.</div>
  </div>
  <div class="src">Valor base ilustrativo del simulador (no una placa real): R_principal=2.0 Ω, R_auxiliar=3.6 Ω. Referencias: Fitzgerald/Kingsley/Umans y Chapman (teoría estándar de motores monofásicos); ⚑ NEMA MG-1 (clasificación general, referencia contextual). Programa curricular ELE-II.1.</div>
  <div class="modebar">
    <button class="b on" id="m_ensamble">① Ensamble</button>
    <button class="b" id="m_tipos" disabled>② Tipos</button>
    <button class="b" id="m_diagnostico" disabled>③ Diagnóstico</button>
    <button class="b" id="m_reto" disabled>④ Reto</button>
  </div>`;

/* ---------- PANEL ---------- */
el('panel').innerHTML=`
  <div class="g"><div class="gl"><span>Modo actual</span><b id="p_mode">Ensamble</b></div></div>

  <div id="secEnsamble">
    <h4>① Ensamble — toca pieza, toca hueco</h4>
    <div class="console" id="asmStatus">Toca una <b>pieza</b> del banco (derecha) y luego su <b>hueco luminoso</b>.</div>
    <div class="g"><div class="gl"><span>Piezas colocadas</span><b id="p_prog">0 / 8</b></div></div>
    <div id="checklist" style="font-family:var(--mono);font-size:11px;line-height:1.85;margin:6px 0"></div>
    <div class="btns">
      <button class="b auto" id="btnAuto">✨ Armado automático (guiado)</button>
      <button class="b" id="btnReset">↺ Reiniciar ensamble</button>
    </div>
  </div>

  <div id="secTipos" style="display:none">
    <h4 class="sec">② Tipos — par de arranque relativo</h4>
    <div class="btns" id="tipoBtns">
      <button class="b" data-tipo="rsir">Fase partida (RSIR)</button>
      <button class="b" data-tipo="csir">Capacitor de arranque (CSIR)</button>
      <button class="b" data-tipo="psc">Capacitor permanente (PSC)</button>
      <button class="b" data-tipo="cscr">Capacitor de arranque y marcha (CSCR)</button>
    </div>
    <h4 class="sec">Telemetría</h4>
    <div class="g"><div class="gl"><span>Tipo</span><b id="t_tipoNombre">—</b></div></div>
    <div class="g"><div class="gl"><span>Par de arranque</span><b id="t_tipoPar">—</b></div></div>
    <div class="g"><div class="gl"><span>Corriente de arranque</span><b id="t_tipoCorriente">—</b></div></div>
    <div class="g"><div class="gl"><span>Interruptor centrífugo</span><b id="t_tipoSwitch">—</b></div></div>
    <div class="g"><div class="gl"><span>N.º de capacitores</span><b id="t_tipoNcap">—</b></div></div>
    <div class="g"><div class="gl"><span>Desfase eléctrico</span><b id="t_tipoFase">—</b></div></div>
    <div class="btns"><button class="b auto" id="btnAutoTipos">✨ Recorrido guiado (automático)</button></div>
  </div>

  <div id="secDiagnostico" style="display:none">
    <h4 class="sec">③ Diagnóstico — lecturas de terminales</h4>
    <div class="g"><div class="gl"><span>Escenario</span></div>
      <select id="selFalla" style="width:100%;margin-top:4px">
        <option value="sano">Motor sano</option>
        <option value="aux_abierto">Devanado auxiliar abierto</option>
        <option value="principal_abierto">Devanado principal abierto</option>
        <option value="capacitor_corto">Capacitor en corto</option>
        <option value="capacitor_abierto">Capacitor abierto</option>
        <option value="devanado_tierra">Devanado principal en corto a tierra</option>
      </select>
    </div>
    <div class="console">⚠ Toda prueba de continuidad se realiza con el motor <b>desenergizado</b> y desconectado de la línea.</div>
    <h4 class="sec">Telemetría</h4>
    <div class="g"><div class="gl"><span>C–R (principal)</span><b id="t_falCR">—</b></div></div>
    <div class="g"><div class="gl"><span>C–S (auxiliar)</span><b id="t_falCS">—</b></div></div>
    <div class="g"><div class="gl"><span>S–R (serie)</span><b id="t_falSR">—</b></div></div>
    <div class="g"><div class="gl"><span>Continuidad a tierra</span><b id="t_falTierra">—</b></div></div>
    <div class="g"><div class="gl"><span>Capacitor</span><b id="t_falCap">—</b></div></div>
    <div class="btns"><button class="b auto" id="btnAutoDiag">✨ Recorrido guiado (automático)</button></div>
  </div>

  <div id="secReto" style="display:none">
    <h4 class="sec">④ Reto — identifica el diagnóstico</h4>
    <div class="console" id="retoText">Lee el tablero (izquierda) para ver el escenario.</div>
    <div class="btns" id="retoBtns">
      <button class="b" data-falla="sano">Motor sano</button>
      <button class="b" data-falla="aux_abierto">Auxiliar abierto</button>
      <button class="b" data-falla="principal_abierto">Principal abierto</button>
      <button class="b" data-falla="capacitor_corto">Capacitor en corto</button>
      <button class="b" data-falla="capacitor_abierto">Capacitor abierto</button>
      <button class="b" data-falla="devanado_tierra">Principal a tierra</button>
    </div>
    <div class="btns"><button class="b" id="btnNew">🎲 Nuevo reto</button></div>
  </div>`;

/* ---------- wiring ---------- */
modes.forEach(m=>{ const b=el('m_'+m); if(b) b.onclick=()=>{
  if(mode==='reto'&&!retoSolved&&m!=='reto'){
    showToast('<span style="color:var(--bad)">🔒 Resuelve el reto (identifica el diagnóstico correcto a partir de las lecturas) antes de salir a otro modo.</span>');
    synth.beep(220,0.1,0.05);
    return;
  }
  setMode(m);
}; });
el('btnReset').onclick=()=>initAssembly();
el('btnAuto').onclick=()=>autoAssemble();
el('btnAutoTipos').onclick=()=>autoTiposTour();
el('btnAutoDiag').onclick=()=>autoDiagTour();
el('btnNew').onclick=()=>newChallenge();
document.querySelectorAll('#tipoBtns [data-tipo]').forEach(b=>{ b.onclick=()=>{ STATE.tipo=b.dataset.tipo; syncTipoBtns(); refreshAll(); }; });
document.querySelectorAll('#retoBtns [data-falla]').forEach(b=>{ b.onclick=()=>checkReto(b.dataset.falla); });
el('selFalla').onchange=e=>{ STATE.falla=e.target.value; refreshAll(); };
const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{const on=synth.toggle();soundBtn.textContent=on?'🔊':'🔇';soundBtn.classList.toggle('on',on);};

initAssembly();
syncCtrlbar();
syncTipoBtns();
setMode('ensamble');

window.__labDebug={
  state:()=>({...STATE}),
  tipos:()=>MOTOR_TYPES,
  fallas:()=>FALLAS,
  mode:()=>mode,
  progress:()=>({placed:{...placed},progress,simUnlocked}),
  reto:()=>({...RETO,solved:retoSolved}),
};
