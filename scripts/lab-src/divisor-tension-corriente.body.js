/* ============================================================
   LAB — DIVISORES DE TENSIÓN Y CORRIENTE: DISEÑO CON EFECTO DE CARGA
   (Dominio D1 · circuitos eléctricos — molde S: esquemático + simulación numérica)
   Normatividad / referencia:
     · Hayt, W. H.; Kemmerly, J. E.; Durbin, S. M. — Engineering Circuit
       Analysis: divisor de tensión ideal Vo=V·R2/(R1+R2), divisor de
       corriente I1=I0·R2/(R1+R2), equivalencia de Thévenin.
     · IEC 60617 — símbolos gráficos para esquemas (resistor rectangular,
       batería, fuente de corriente, interruptor).
     · IEC 60063 — serie E12 de valores preferentes y su código de
       colores (±5 %), usada para los valores comerciales de R1/R2/RL.
     · Ho, C.-W.; Ruehli, A. E.; Brennan, P. A. (1975) — "The Modified
       Nodal Approach to Network Analysis": el mismo motor MNA de
       mecanica-13 (Kirchhoff), extendido aquí con ramas R conmutables
       (e.on) para modelar la carga RL conectándose/desconectándose.
   Modelo de ingeniería (didáctico):
     · Reutiliza el molde S de mecanica-13: la red se declara como DATOS
       y se resuelve EN VIVO por análisis nodal modificado (MNA).
     · Los presupuestos del reto (error de carga ≤5 %, I reposo ≤25 mA)
       son una ESPECIFICACIÓN PEDAGÓGICA de este ejercicio, no una cifra
       normativa ni de fabricante — el contrato de fidelidad lo declara.
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.1,2.5,7.2],target:[0.5,1.3,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ============================================================
   1) REDES COMO DATOS + SOLVER MNA EXTENDIDO (molde S, reutilizable)
   ============================================================ */
/* NET: divisor de tensión. Nodo 1 = Vin (lo fija V1), nodo 2 = Vo (la
   incógnita). RL vive en paralelo con R2 y se conecta/desconecta con e.on. */
const NET={nodes:2,elems:[
  {id:'V1',type:'V',a:1,b:0,value:12},
  {id:'R1',type:'R',a:1,b:2,value:1000},
  {id:'R2',type:'R',a:2,b:0,value:2200},
  {id:'RL',type:'R',a:2,b:0,value:2200,on:false},
]};
/* NETI: divisor de corriente. Un solo nodo desconocido, alimentado por
   una fuente de corriente ideal I0, con R1c y R2c en paralelo a tierra. */
const NETI={nodes:1,elems:[
  {id:'I0',type:'I',a:0,b:1,value:0.01},
  {id:'R1c',type:'R',a:1,b:0,value:1000},
  {id:'R2c',type:'R',a:1,b:0,value:3300},
]};
const EL=id=>NET.elems.find(e=>e.id===id);
const ELI=id=>NETI.elems.find(e=>e.id===id);
const ELANY=id=>NET.elems.find(e=>e.id===id)||NETI.elems.find(e=>e.id===id);

/* Análisis nodal modificado, extendido con e.on!==false para poder
   desconectar (circuito abierto) una rama resistiva como RL. */
function solveMNA(net){
  const n=net.nodes;
  const vs=net.elems.filter(e=>e.type==='V');
  const N=n+vs.length;
  const A=Array.from({length:N},()=>new Array(N).fill(0));
  const z=new Array(N).fill(0);
  net.elems.forEach(e=>{
    if(e.type==='R'&&e.on!==false){
      const g=1/e.value, a=e.a-1, b=e.b-1;
      if(a>=0)A[a][a]+=g;
      if(b>=0)A[b][b]+=g;
      if(a>=0&&b>=0){A[a][b]-=g;A[b][a]-=g;}
    }else if(e.type==='I'){
      const a=e.a-1, b=e.b-1;
      if(a>=0)z[a]-=e.value;
      if(b>=0)z[b]+=e.value;
    }
  });
  vs.forEach((e,k)=>{
    const r=n+k, a=e.a-1, b=e.b-1;
    if(a>=0){A[r][a]=1;A[a][r]=1;}
    if(b>=0){A[r][b]=-1;A[b][r]=-1;}
    z[r]=e.value;
  });
  for(let c=0;c<N;c++){
    let p=c;
    for(let r=c+1;r<N;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;
    [A[c],A[p]]=[A[p],A[c]];[z[c],z[p]]=[z[p],z[c]];
    for(let r=c+1;r<N;r++){
      const f=A[r][c]/A[c][c];
      if(!f)continue;
      for(let k=c;k<N;k++)A[r][k]-=f*A[c][k];
      z[r]-=f*z[c];
    }
  }
  const x=new Array(N).fill(0);
  for(let r=N-1;r>=0;r--){
    let s=z[r];
    for(let k=r+1;k<N;k++)s-=A[r][k]*x[k];
    x[r]=s/A[r][r];
  }
  return {V:[0,...x.slice(0,n)],srcI:x.slice(n)};
}

/* Resuelve el divisor de tensión con y sin carga y devuelve Vo cargado,
   Vo ideal, error de carga (%) y corriente de reposo (mA) — usado tanto
   por el reto como por el motor de verificación. */
function retoSolve(V,RL,r1,r2){
  const netLoaded={nodes:2,elems:[
    {id:'V1',type:'V',a:1,b:0,value:V},
    {id:'R1',type:'R',a:1,b:2,value:r1},
    {id:'R2',type:'R',a:2,b:0,value:r2},
    {id:'RL',type:'R',a:2,b:0,value:RL,on:true},
  ]};
  const netIdeal=JSON.parse(JSON.stringify(netLoaded));
  netIdeal.elems.find(e=>e.id==='RL').on=false;
  const vo=solveMNA(netLoaded).V[2];
  const voIdeal=solveMNA(netIdeal).V[2];
  const err=Math.abs(voIdeal-vo)/voIdeal*100;
  const iq=V/(r1+r2)*1000;
  return {vo,voIdeal,err,iq};
}

/* 6 escenarios de diseño, verificados numéricamente (verify_mna.js):
   cada ref.R1/ref.R2 cumple VoObj (±tol), error≤5 % e I reposo≤25 mA. */
const RETO_SCENARIOS=[
  {V:12,RL:2200,VoObj:3,ref:{R1:437,R2:155}},
  {V:12,RL:2200,VoObj:8,ref:{R1:162,R2:380}},
  {V:12,RL:4700,VoObj:5,ref:{R1:562,R2:437}},
  {V:12,RL:4700,VoObj:9,ref:{R1:309,R2:1175}},
  {V:12,RL:10000,VoObj:4,ref:{R1:1479,R2:794}},
  {V:12,RL:10000,VoObj:7,ref:{R1:851,R2:1349}},
];

const iThru=e=>(SOL.V[e.a]-SOL.V[e.b])/e.value;
const iThruI=e=>(SOLI.V[e.a]-SOLI.V[e.b])/e.value;

/* Formato (ASCII en signos: los tests hacen grep) */
const fmtR=v=>v>=1000?(((v/1000)%1)?(v/1000).toFixed(1):String(Math.round(v/1000)))+' kΩ':v+' Ω';
const fmtV=v=>(v%1?v.toFixed(1):String(v))+' V';
const fmtI=v=>{const m=v*1000;return(Math.abs(m%1)>1e-9?m.toFixed(1):String(Math.round(m)))+' mA';};
const sg=x=>(x>=0?'+':'-')+Math.abs(x).toFixed(3);
const fmtSum=x=>{const v=Math.abs(x)<5e-7?0:x;return(v>=0?'+':'-')+Math.abs(v).toFixed(6);};

/* Código de colores REAL (E12, ±5 %): bandas en vivo sobre los resistores 3D */
const BAND_COLORS=['#1a1a1a','#6b4226','#c73a3a','#d2691e','#e8c832','#3f8f3f','#2b5fb8','#7d3fc4','#8a8a8a','#e8e8e8'];
const BAND_NAMES=['negro','café','rojo','naranja','amarillo','verde','azul','violeta','gris','blanco'];
function bandsFor(v){
  const exp=Math.floor(Math.log10(v))-1;
  const dd=Math.round(v/Math.pow(10,exp));
  return {d1:Math.floor(dd/10),d2:dd%10,mult:exp};
}

/* ============================================================
   2) ESTADO + SINCRONIZACIÓN DE RED
   ============================================================ */
let mode='explora';       // explora | carga | corriente | reto
let selR1=1000, selR2=2200, selRL=2200, cargaOn=false;
let selR1c=1000, selR2c=3300, selI0=0.01;
let retoIdx=0, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false, QUIZ={};
const R_CANDIDATES=[470,1000,2200,3300,4700,6800,10000];
const RL_CANDIDATES=[1000,2200,4700,10000];
const I0_CANDIDATES=[0.005,0.01,0.015,0.02];

function numOr(id){const v=parseFloat((el(id).value||'').replace(',','.'));return isFinite(v)?v:NaN;}
function syncNet(){
  if(mode==='reto'){
    const sc=RETO_SCENARIOS[retoIdx];
    const r1=numOr('inR1'),r2=numOr('inR2');
    EL('V1').value=sc.V;
    EL('R1').value=isFinite(r1)&&r1>0?r1:selR1;
    EL('R2').value=isFinite(r2)&&r2>0?r2:selR2;
    EL('RL').value=sc.RL;
    EL('RL').on=true;
  }else{
    EL('V1').value=12;
    EL('R1').value=selR1;
    EL('R2').value=selR2;
    EL('RL').value=selRL;
    EL('RL').on=(mode==='carga')&&cargaOn;
  }
}
let SOL=null,SOL_IDEAL=null,SOLI=null;
function resolve(){
  syncNet();
  SOL=solveMNA(NET);
  const netIdeal=JSON.parse(JSON.stringify(NET));
  netIdeal.elems.find(e=>e.id==='RL').on=false;
  SOL_IDEAL=solveMNA(netIdeal);
  NETI.elems.find(e=>e.id==='I0').value=selI0;
  NETI.elems.find(e=>e.id==='R1c').value=selR1c;
  NETI.elems.find(e=>e.id==='R2c').value=selR2c;
  SOLI=solveMNA(NETI);
}

/* ============================================================
   3) MATERIALES (regla: los roughnessMap procedurales MULTIPLICAN
      la roughness → carcasas con roughness alta y metalness ~0)
   ============================================================ */
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};
const alu=castAluminum(), brush=brushedMetal(), rub=rubber(), plas=techPlastic(0.16,0.19,0.18);
const MAT={
  bench:  std({...plas.maps,color:0x3a464d,roughness:0.85,metalness:0.05}),
  frame:  std({...plas.maps,color:0x232a2e,roughness:0.95,metalness:0}),
  leg:    std({...brush.maps,color:0x77828a,metalness:0.35,roughness:0.85}),
  pcb:    std({color:0x14532d,roughness:0.62,metalness:0}),
  trace:  std({...brush.maps,color:0xc08a3e,metalness:0.8,roughness:0.5}),
  psu:    std({...brush.maps,color:0x707c85,metalness:0.35,roughness:0.85}),
  lead:   std({...brush.maps,color:0xbfc8ce,metalness:0.9,roughness:0.35}),
  jackRed:std({color:0xc23434,roughness:0.55,metalness:0}),
  jackBlk:std({color:0x14181c,roughness:0.55,metalness:0}),
  cableRed:std({...rub.maps,color:0x9e2b2b,roughness:1.0,metalness:0}),
  cableBlk:std({...rub.maps,color:0x15181b,roughness:1.0,metalness:0}),
};

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const lb=labelSprite(text,color);
  lb.position.copy(pos);if(scale)lb.scale.multiplyScalar(scale);
  lb.visible=false;lb.raycast=()=>{};
  obj.add(lb);HOVER_LABELS.set(obj,lb);
}

/* ============================================================
   4) PIZARRÓN — esquema IEC 60617 vivo (canvas → textura)
   ============================================================ */
const boardG=new THREE.Group();boardG.position.set(-1.05,0,-0.85);boardG.rotation.y=0.16;scene.add(boardG);
const frame=sh(roundedBox(3.62,2.77,0.12,MAT.frame,0.03));frame.position.set(0,1.85,0);boardG.add(frame);
[-1.5,1.5].forEach(x=>{
  const leg=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.56,10),MAT.leg));
  leg.position.set(x,0.28,0);boardG.add(leg);
});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
bTex.colorSpace=THREE.SRGBColorSpace;bTex.minFilter=THREE.LinearFilter;bTex.generateMipmaps=false;
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.55),new THREE.MeshBasicMaterial({map:bTex,toneMapped:false}));
board.position.set(0,1.85,0.065);boardG.add(board);
frame.userData={title:'Pizarrón del esquema',info:'Esquema vivo del divisor (símbolos IEC 60617). Toca la fuente, R1, R2, RL, el interruptor o el nodo Vo.'};
addHoverLabel(frame,'Esquema vivo · clic: componentes y nodo Vo','#4FD1C5',new THREE.Vector3(0,1.65,0.3),1.0);

function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function rr(c,x,y,w,h,r){
  c.beginPath();
  c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);
  c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);
  c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);
  c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();
}
function ah(c,x,y,dx,dy){ // punta de flecha
  const nx=-dy,ny=dx;
  c.beginPath();c.moveTo(x+dx*13,y+dy*13);
  c.lineTo(x-dx*4+nx*8,y-dy*4+ny*8);c.lineTo(x-dx*4-nx*8,y-dy*4-ny*8);
  c.closePath();c.fill();
}
function resH(c,cx,cy,id){
  const e=ELANY(id);
  const off=e.type==='R'&&e.on===false;
  c.fillStyle='#0c1512';c.fillRect(cx-52,cy-19,104,38);
  c.strokeStyle=off?'#4a5a55':'#cfe8e2';c.lineWidth=3;c.strokeRect(cx-48,cy-15,96,30);
  c.fillStyle=off?'#5a6b66':'#8FB3AC';c.font='bold 19px Outfit, sans-serif';c.textAlign='center';
  c.fillText(id+' · '+fmtR(e.value),cx,cy-28);
}
function resV(c,cx,cy,id){
  const e=ELANY(id);
  const off=e.type==='R'&&e.on===false;
  c.fillStyle='#0c1512';c.fillRect(cx-19,cy-52,38,104);
  c.strokeStyle=off?'#4a5a55':'#cfe8e2';c.lineWidth=3;c.strokeRect(cx-15,cy-48,30,96);
  c.fillStyle=off?'#5a6b66':'#8FB3AC';c.font='bold 19px Outfit, sans-serif';c.textAlign='left';
  c.fillText(id+' · '+fmtR(e.value),cx+24,cy+6);
}
function battV(c,cx,cy,id){
  const e=ELANY(id);
  c.fillStyle='#0c1512';c.fillRect(cx-30,cy-26,60,52);
  c.strokeStyle='#cfe8e2';
  c.lineWidth=3;line(c,cx-26,cy-9,cx+26,cy-9);   // placa larga (+ hacia arriba)
  c.lineWidth=9;line(c,cx-13,cy+9,cx+13,cy+9);   // placa corta (−)
  c.lineWidth=3;
  c.fillStyle='#f0a5a5';c.font='bold 22px Outfit, sans-serif';c.textAlign='center';
  c.fillText('+',cx<512?cx-42:cx+42,cy-4);
  c.font='bold 19px Outfit, sans-serif';
  c.textAlign=cx<512?'left':'right';
  c.fillText(id+' · '+fmtV(e.value),cx<512?cx+40:cx-40,cy+6);
}
function srcIV(c,cx,cy,id){
  const e=ELANY(id);
  c.fillStyle='#0c1512';c.beginPath();c.arc(cx,cy,30,0,7);c.fill();
  c.strokeStyle='#cfe8e2';c.lineWidth=3;c.beginPath();c.arc(cx,cy,30,0,7);c.stroke();
  c.strokeStyle='#f0a5a5';c.lineWidth=4;
  line(c,cx,cy+16,cx,cy-16);ah(c,cx,cy-10,0,-1);
  c.fillStyle='#f0a5a5';c.font='bold 19px Outfit, sans-serif';
  c.textAlign=cx<512?'left':'right';
  c.fillText(id+' · '+fmtI(e.value),cx<512?cx+40:cx-40,cy+6);
}
function swV(c,x,y1,y2,closed){
  c.strokeStyle=closed?'#4FD1C5':'#FFB703';c.lineWidth=3;
  line(c,x,y1,x,y1+14);
  nodeDot(c,x,y1+14,false);
  if(closed){line(c,x,y1+14,x,y2-14);}
  else{c.save();c.translate(x,y1+14);c.rotate(-0.55);line(c,0,0,0,(y2-14)-(y1+14));c.restore();}
  nodeDot(c,x,y2-14,false);
  line(c,x,y2-14,x,y2);
  c.fillStyle=closed?'#4FD1C5':'#FFB703';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText(closed?'RL conectada':'RL desconectada',x+14,(y1+y2)/2);
}
function earth(c,x,y){
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,x,y,x,y+22);line(c,x-20,y+22,x+20,y+22);
  line(c,x-13,y+32,x+13,y+32);line(c,x-6,y+42,x+6,y+42);
}
function curHgeneric(c,x,y,name,ima,geoDir,hide){
  const dir=(ima>=0?1:-1)*geoDir;
  c.fillStyle='#FFB703';c.strokeStyle='#FFB703';c.lineWidth=4;
  line(c,x-16,y,x+16,y);ah(c,x+dir*10,y,dir,0);
  c.font='bold 18px Outfit, sans-serif';c.textAlign='center';
  c.fillText(name+' = '+(hide?'¿?':Math.abs(ima).toFixed(3)+' mA'),x,y+40);
}
function curVgeneric(c,x,y,name,ima,hide){
  const dir=ima>=0?1:-1;
  c.fillStyle='#FFB703';c.strokeStyle='#FFB703';c.lineWidth=4;
  line(c,x,y-16,x,y+16);ah(c,x,y+dir*10,0,dir);
  c.font='bold 18px Outfit, sans-serif';c.textAlign='left';
  c.fillText(name+' = '+(hide?'¿?':Math.abs(ima).toFixed(3)+' mA'),x+16,y+6);
}
function nodeDot(c,x,y,big){
  c.beginPath();c.arc(x,y,big?9:6,0,7);
  c.fillStyle=big?'#4FD1C5':'#cfe8e2';c.fill();
}

function drawBoard(){if(mode==='corriente')drawBoardCorriente();else drawBoardDivisor();}

function drawBoardDivisor(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('DIVISOR DE TENSIÓN · símbolos IEC 60617',26,44);
  if(mode==='reto'){c.fillStyle='#FFB703';c.textAlign='right';c.fillText('🎯 RETO: diseña R1 y R2',998,44);}
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,150,150,750,150);
  line(c,150,150,150,640);
  line(c,150,640,750,640);
  line(c,550,150,550,640);
  const rlOn=EL('RL').on;
  line(c,750,210,750,640);
  battV(c,150,395,'V1');
  resH(c,350,150,'R1');
  resV(c,550,395,'R2');
  resV(c,750,395,'RL');
  swV(c,750,150,210,rlOn);
  earth(c,300,640);
  nodeDot(c,550,150,true);
  c.font='bold 26px Outfit, sans-serif';c.textAlign='center';c.fillStyle='#4FD1C5';
  c.fillText('Vo · '+SOL.V[2].toFixed(3)+' V',550,112);
  c.font='18px Outfit, sans-serif';c.fillStyle='#8FB3AC';
  c.fillText('Vin · '+fmtV(EL('V1').value),150,112);
  c.fillText('ref · 0 V',300,706);
  const i1=iThru(EL('R1'))*1e3,i2=iThru(EL('R2'))*1e3;
  curHgeneric(c,450,150,'I1',i1,1,false);
  curVgeneric(c,550,555,'I2',i2,false);
  if(rlOn){const il=iThru(EL('RL'))*1e3;curVgeneric(c,750,555,'IL',il,false);}
  bTex.needsUpdate=true;
}

function drawBoardCorriente(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('DIVISOR DE CORRIENTE · símbolos IEC 60617',26,44);
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,250,200,750,200);
  line(c,250,200,250,550);
  line(c,750,200,750,550);
  line(c,250,550,750,550);
  line(c,500,200,500,550);
  srcIV(c,250,375,'I0');
  resV(c,500,375,'R1c');
  resV(c,750,375,'R2c');
  earth(c,400,550);
  nodeDot(c,500,200,true);
  c.font='bold 26px Outfit, sans-serif';c.textAlign='center';c.fillStyle='#4FD1C5';
  c.fillText('nodo · '+SOLI.V[1].toFixed(3)+' V',500,172);
  c.font='18px Outfit, sans-serif';c.fillStyle='#8FB3AC';
  c.fillText('ref · 0 V',400,612);
  const i1c=iThruI(ELI('R1c'))*1e3,i2c=iThruI(ELI('R2c'))*1e3;
  curVgeneric(c,500,470,'I1',i1c,false);
  curVgeneric(c,750,470,'I2',i2c,false);
  bTex.needsUpdate=true;
}

const HIT_DIVISOR=[
  {x:150,y:395,r:55,el:'V1'},
  {x:350,y:150,r:55,el:'R1'},
  {x:550,y:395,r:55,el:'R2'},
  {x:750,y:395,r:55,el:'RL'},
  {x:750,y:180,r:34,sw:true},
  {x:550,y:150,r:40,vo:true},
];
const HIT_CORRIENTE=[
  {x:250,y:375,r:55,el:'I0'},
  {x:500,y:375,r:55,el:'R1c'},
  {x:750,y:375,r:55,el:'R2c'},
];
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  const HIT=mode==='corriente'?HIT_CORRIENTE:HIT_DIVISOR;
  let best=null,bd=1e9;
  HIT.forEach(h=>{const d=Math.hypot(x-h.x,y-h.y);if(d<h.r&&d<bd){bd=d;best=h;}});
  if(!best)return;
  if(mode==='corriente'){toastEl(best.el,true);return;}
  if(best.sw){
    if(mode==='carga'){toggleCarga();}
    else if(mode==='reto'){showToast('En el reto, RL siempre está conectada: forma parte del problema de diseño.');}
    else{showToast('El interruptor de RL se controla desde el modo Carga.');}
    return;
  }
  if(best.vo){toastVo();return;}
  toastEl(best.el,false);
}

/* ============================================================
   5) BANCO 3D — realización física del divisor (R1, R2, RL + V1)
   ============================================================ */
const bench=sh(roundedBox(3.1,0.5,1.9,MAT.bench,0.05));bench.position.set(1.7,0.25,0.9);scene.add(bench);
bench.userData={title:'Banco de trabajo',info:'El divisor de tensión montado físicamente: fuente, R1, R2 y la carga conmutable RL.'};
const pcb=sh(roundedBox(2.3,0.06,1.3,MAT.pcb,0.02));pcb.position.set(1.7,0.53,1.05);scene.add(pcb);
pcb.userData={title:'Tarjeta del divisor',info:'R1 y R2 llevan las bandas de su valor REAL (código de colores E12 ±5 %). RL se conecta/desconecta desde el modo Carga.'};
addHoverLabel(pcb,'Realización física del divisor','#4FD1C5',new THREE.Vector3(0,0.62,0),0.9);

function trace(x1,z1,x2,z2){
  const w=Math.abs(x2-x1)||0.045,d=Math.abs(z2-z1)||0.045;
  const t=new THREE.Mesh(new THREE.BoxGeometry(Math.max(w,0.045),0.015,Math.max(d,0.045)),MAT.trace);
  t.position.set((x1+x2)/2,0.565,(z1+z2)/2);t.receiveShadow=true;scene.add(t);
}
trace(0.80,0.70,0.955,0.70);
trace(1.295,0.70,2.05,0.70);
trace(1.45,0.70,1.45,0.93);trace(1.45,1.27,1.45,1.50);
trace(2.05,0.70,2.05,0.93);trace(2.05,1.27,2.05,1.50);
trace(0.80,1.50,2.65,1.50);

const RES3D={};
function makeRes3D(id,x,z,vert){
  const g=new THREE.Group();g.position.set(x,0.62,z);if(vert)g.rotation.y=Math.PI/2;
  const body=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.20,16),std({color:0x9a815c,roughness:0.9,metalness:0})));
  body.rotation.z=Math.PI/2;g.add(body);
  [-1,1].forEach(s=>{
    const l=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.075,8),MAT.lead);
    l.rotation.z=Math.PI/2;l.position.x=s*0.1375;g.add(l);
    const pin=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.06,8),MAT.lead);
    pin.position.set(s*0.17,-0.03,0);g.add(pin);
  });
  const bands=[];
  [-0.060,-0.020,0.020,0.070].forEach(bx=>{
    const b=new THREE.Mesh(new THREE.CylinderGeometry(0.047,0.047,0.02,16),std({color:0x1a1a1a,roughness:0.6,metalness:0}));
    b.rotation.z=Math.PI/2;b.position.x=bx;g.add(b);bands.push(b);
  });
  g.userData={el:id};
  scene.add(g);RES3D[id]={g,bands};
}
makeRes3D('R1',1.125,0.70,false);
makeRes3D('R2',1.45,1.10,true);
makeRes3D('RL',2.05,1.10,true);

const psCv=[],psTex=[];
function makePSU(i,x,id){
  const g=new THREE.Group();g.position.set(x,0.72,0.25);scene.add(g);
  const box=sh(roundedBox(0.52,0.44,0.40,MAT.psu,0.06));g.add(box);
  const cv=document.createElement('canvas');cv.width=256;cv.height=96;
  const tx=new THREE.CanvasTexture(cv);
  tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.40,0.15),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  pl.position.set(0,0.06,0.205);g.add(pl);
  const postR=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.10,10),MAT.jackRed));postR.position.set(-0.13,0.27,0.10);g.add(postR);
  const postB=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.10,10),MAT.jackBlk));postB.position.set(0.13,0.27,0.10);g.add(postB);
  g.userData={el:id};
  psCv[i]=cv;psTex[i]=tx;
  addHoverLabel(g,'Fuente '+id,'#f0a5a5',new THREE.Vector3(0,0.55,0),0.8);
}
makePSU(0,0.85,'V1');
function drawPSU(i){
  const cv=psCv[i],c=cv.getContext('2d'),v=EL('V1').value;
  c.fillStyle='#071410';c.fillRect(0,0,256,96);
  c.strokeStyle='rgba(79,209,197,0.4)';c.lineWidth=3;c.strokeRect(3,3,250,90);
  c.fillStyle='#4FD1C5';c.font='bold 40px Outfit, sans-serif';c.textAlign='center';
  c.fillText(v.toFixed(2)+' V',128,62);
  psTex[i].needsUpdate=true;
}

function cable(ax,ay,az,bx,by,bz,mat){
  const a=new THREE.Vector3(ax,ay,az),b=new THREE.Vector3(bx,by,bz);
  const m=a.clone().lerp(b,0.5);m.y=Math.max(a.y,b.y)+0.18;
  const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,m,b]),24,0.015,8),mat);
  t.castShadow=true;scene.add(t);
}
cable(0.72,0.99,0.35,0.80,0.60,0.70,MAT.cableRed);
cable(0.98,0.99,0.35,0.80,0.60,1.50,MAT.cableBlk);

const TP_GLOW={};
function makeTP(id,x,z,mat,color,name,info){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const post=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.034,0.16,12),mat));post.position.y=0.66;g.add(post);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(0.045,12,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.55,toneMapped:false}));
  glow.position.y=0.78;glow.raycast=()=>{};g.add(glow);TP_GLOW[id]=glow;
  g.userData={title:name,info};
  addHoverLabel(g,name,'#4FD1C5',new THREE.Vector3(0,1.02,0),0.7);
}
makeTP('vo',1.45,0.70,MAT.jackRed,0x4FD1C5,'TP-Vo · nodo de salida','Punto de prueba de Vo: clic para ver el voltaje de salida y el error de carga en vivo.');
makeTP('ref',1.75,1.50,MAT.jackBlk,0x8a9299,'TP-ref · 0 V','Referencia del divisor (la tierra del esquema).');

let rlBadge=null;
function updateRLBadge(){
  if(rlBadge){scene.remove(rlBadge);}
  const on=EL('RL').on;
  rlBadge=labelSprite(on?'RL · ON':'RL · OFF',on?'#4FD1C5':'#FFB703');
  rlBadge.position.set(2.05,1.05,1.10);
  scene.add(rlBadge);
}
function refreshNet3D(){
  ['R1','R2','RL'].forEach(id=>{
    const e=EL(id),r=RES3D[id],b=bandsFor(e.value);
    [b.d1,b.d2,b.mult].forEach((dig,i)=>r.bands[i].material.color.set(BAND_COLORS[dig]));
    r.bands[3].material.color.set('#c9a227'); // oro = ±5 % (serie E12)
  });
  drawPSU(0);
  updateRLBadge();
}

/* ============================================================
   6) HUD + PANEL
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos · Diseño de redes resistivas (D1)</div>
  <h2>Divisores de tensión y corriente: el efecto de carga</h2>
  <p>Vo = V·R2/(R1+R2) es exacto <b>solo si nadie conecta nada a la salida</b>. En cuanto una
  carga RL se conecta en paralelo con R2, Vo cae por debajo del valor ideal — el <b>efecto de
  carga</b>, el error de diseño más común de un principiante. Este banco reutiliza el mismo motor
  de <b>análisis nodal modificado (MNA)</b> de Kirchhoff (mecanica-13) para resolverlo en vivo, y
  contrasta el resultado contra la <b>equivalencia de Thévenin</b> del propio divisor. Un segundo
  circuito, con una fuente de corriente ideal, muestra el caso hermano: el <b>divisor de
  corriente</b>.</p>
  <div class="formula">Vo ideal = V·R2/(R1+R2)<br>Vo cargado = V·(R2‖RL)/(R1+(R2‖RL)) = Vth·RL/(RL+Rth)<br>I1 = I0·R2/(R1+R2) · I2 = I0·R1/(R1+R2)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Nodo de salida Vo</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Corrientes de rama</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Fuentes ideales (V, I0)</div>
    <div class="li"><span class="dot" style="background:#8a9299"></span>Referencia (ref · 0 V)</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> divisor de tensión y de corriente resistivos en CD, resueltos en vivo por análisis nodal modificado (MNA); efecto de carga exacto del modelo (Vo cargado vs. ideal) verificado contra la equivalencia de Thévenin; divisor de corriente verificado por conservación de carga (ΣI=I0); código de colores real de cada resistor (serie E12, IEC 60063).</div>
    <div class="fl no"><b>NO modela:</b> los presupuestos del reto (error de carga ≤5 %, corriente de reposo ≤25 mA) son una especificación PEDAGÓGICA de este ejercicio, no una cifra normativa ni de fabricante. La fuente de 12 V fija es una simplificación didáctica. Fuentes ideales, sin tolerancias de componentes ni deriva térmica — ver la práctica del multímetro para incertidumbre de medición real.</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · IEC 60617 · IEC 60063 · MNA (Ho/Ruehli/Brennan, 1975)</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Divisor de tensión y corriente · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_carga">⚠️ Carga</button>
    <button class="b" id="m_corriente">🔀 Corriente</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div class="modebar" id="selbar" style="display:none"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Tu diseño</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div style="display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:var(--ink)">
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inR1">R1 =</label><input id="inR1" inputmode="decimal" autocomplete="off" style="width:72px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>Ω</span></span>
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inR2">R2 =</label><input id="inR2" inputmode="decimal" autocomplete="off" style="width:72px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>Ω</span></span>
    </div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar diseño</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nuevo reto (diseño)</button>
  </div>`;

const el=id=>document.getElementById(id);

/* ============================================================
   7) TOASTS + INFO DE ELEMENTO
   ============================================================ */
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3200);
}
function toastEl(id,isI){
  if(isI){
    const e=ELI(id);
    if(e.type==='I'){
      showToast(`<b style="color:var(--accent2)">${id} · ${fmtI(e.value)}</b><br><span style="color:var(--dim);font-size:11px">Fuente de corriente ideal: entrega ${fmtI(e.value)} sin importar la resistencia de la red (modelo — sin resistencia interna).</span>`);
    }else{
      const i=iThruI(e),b=bandsFor(e.value);
      const bandas=`${BAND_NAMES[b.d1]}-${BAND_NAMES[b.d2]}-${BAND_NAMES[b.mult]}-oro`;
      showToast(`<b style="color:var(--accent2)">${id} · ${fmtR(e.value)}</b><br><span style="color:var(--dim);font-size:11px">Bandas: ${bandas}. I = ${fmtI(Math.abs(i))} (reparto de corriente, inverso a la resistencia).</span>`);
    }
    return;
  }
  const e=EL(id);
  if(e.type==='V'){
    showToast(`<b style="color:var(--accent2)">${id} · ${fmtV(e.value)}</b><br><span style="color:var(--dim);font-size:11px">Fuente ideal: fija el voltaje de entrada del divisor (sin resistencia interna — modelo).</span>`);
    return;
  }
  const off=e.on===false;
  const i=off?0:iThru(e),b=bandsFor(e.value);
  const bandas=`${BAND_NAMES[b.d1]}-${BAND_NAMES[b.d2]}-${BAND_NAMES[b.mult]}-oro`;
  const info=off?`Bandas: ${bandas}. Desconectada (circuito abierto): I = 0 mA.`:`Bandas: ${bandas}. I = ${fmtI(Math.abs(i))}.`;
  showToast(`<b style="color:var(--accent2)">${id} · ${fmtR(e.value)}${off?' · OFF':''}</b><br><span style="color:var(--dim);font-size:11px">${info}</span>`);
}
function toastVo(){
  const on=EL('RL').on;
  const err=on?Math.abs(SOL_IDEAL.V[2]-SOL.V[2])/SOL_IDEAL.V[2]*100:0;
  const info=on
    ?`Vo ideal (sin carga) = ${SOL_IDEAL.V[2].toFixed(3)} V · Vo actual (con RL) = ${SOL.V[2].toFixed(3)} V · error de carga = ${err.toFixed(2)} %.`
    :`Vo = ${SOL.V[2].toFixed(3)} V (RL desconectada: coincide con el ideal).`;
  showToast(`<b style="color:var(--accent2)">Nodo Vo</b><br><span style="color:var(--dim);font-size:11px">${info}</span>`);
}

/* ============================================================
   8) MODOS + SELECCIÓN
   ============================================================ */
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.1,2.5,7.2],[0.5,1.3,0.1]],mision:'Elige R1 y R2 y observa Vo ideal (sin carga) sobre el esquema IEC 60617.'},
  carga:{nombre:'Carga',cam:[[-0.2,2.1,3.9],[-0.9,1.75,-0.8]],mision:'Conecta RL y observa a Vo caer por debajo del ideal — contrástalo con Thévenin (Vth, Rth).'},
  corriente:{nombre:'Corriente',cam:[[-0.1,2.2,4.3],[-0.9,1.75,-0.8]],mision:'Un segundo circuito, con fuente de corriente ideal: el reparto I1/I2 es inverso a la resistencia.'},
  reto:{nombre:'Reto',cam:[[0.6,2.3,5.6],[0.2,1.3,0.2]],mision:'Diseña R1 y R2: cumple Vo objetivo, error de carga ≤5 % y corriente de reposo ≤25 mA a la vez.'},
};
function setMode(k){
  mode=k;
  ['explora','carga','corriente','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  buildSelBar();
  const reto=k==='reto';
  el('retoTitle').style.display=reto?'':'none';
  el('retoBox').style.display=reto?'':'none';
  if(reto)updateRetoSpec();
  solved=false;clearDx();
  resolve();buildQuiz();refreshQuestion();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  refreshAll();
}
function selHtml(id,label,vals,fmt){
  return `<span style="display:inline-flex;gap:6px;align-items:center;font-size:12px;color:var(--ink);margin-right:8px"><label for="${id}">${label}</label><select id="${id}" style="background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:5px 6px;font:inherit;font-size:12px">${vals.map(v=>`<option value="${v}">${fmt(v)}</option>`).join('')}</select></span>`;
}
function wireSel(id,cb){
  const cur={selR1,selR2,selRL,selR1c,selR2c,selI0}[id];
  el(id).value=String(cur);
  el(id).onchange=()=>cb(parseFloat(el(id).value));
}
function buildSelBar(){
  const bar=el('selbar');
  if(mode==='explora'){
    bar.style.display='';
    bar.innerHTML=selHtml('selR1','R1',R_CANDIDATES,fmtR)+selHtml('selR2','R2',R_CANDIDATES,fmtR);
    wireSel('selR1',v=>{selR1=v;afterEdit();});
    wireSel('selR2',v=>{selR2=v;afterEdit();});
  }else if(mode==='carga'){
    bar.style.display='';
    bar.innerHTML=selHtml('selR1','R1',R_CANDIDATES,fmtR)+selHtml('selR2','R2',R_CANDIDATES,fmtR)+selHtml('selRL','RL',RL_CANDIDATES,fmtR)+`<button class="b" id="btnToggleRL">${cargaOn?'🔌 Desconectar RL':'🔌 Conectar RL'}</button>`;
    wireSel('selR1',v=>{selR1=v;afterEdit();});
    wireSel('selR2',v=>{selR2=v;afterEdit();});
    wireSel('selRL',v=>{selRL=v;afterEdit();});
    el('btnToggleRL').onclick=toggleCarga;
  }else if(mode==='corriente'){
    bar.style.display='';
    bar.innerHTML=selHtml('selR1c','R1c',R_CANDIDATES,fmtR)+selHtml('selR2c','R2c',R_CANDIDATES,fmtR)+selHtml('selI0','I0',I0_CANDIDATES,fmtI);
    wireSel('selR1c',v=>{selR1c=v;afterEdit();});
    wireSel('selR2c',v=>{selR2c=v;afterEdit();});
    wireSel('selI0',v=>{selI0=v;afterEdit();});
  }else{bar.style.display='none';bar.innerHTML='';}
}

/* ============================================================
   9) TELEMETRÍA + REPORTE
   ============================================================ */
function teleRow(l,v,cls){return `<div class="g"><div class="l">${l}</div><b class="${cls||''}">${v}</b></div>`;}
function updateTele(){
  const t=el('tele');
  if(mode==='explora'){
    const i1=iThru(EL('R1'))*1e3;
    t.innerHTML=
      teleRow('Vin',fmtV(EL('V1').value))+
      teleRow('R1',fmtR(EL('R1').value))+
      teleRow('R2',fmtR(EL('R2').value))+
      teleRow('Vo (ideal, sin carga)',SOL.V[2].toFixed(3)+' V','good')+
      teleRow('I reposo',i1.toFixed(3)+' mA')+
      teleRow('Estado','RESUELTO · MNA','good');
  }else if(mode==='carga'){
    const on=EL('RL').on;
    const err=Math.abs(SOL_IDEAL.V[2]-SOL.V[2])/SOL_IDEAL.V[2]*100;
    const Rth=1/(1/EL('R1').value+1/EL('R2').value);
    t.innerHTML=
      teleRow('Vo ideal (sin carga)',SOL_IDEAL.V[2].toFixed(3)+' V')+
      teleRow('Vo actual',on?SOL.V[2].toFixed(3)+' V':'— (RL abierta)',on?'good':'warn')+
      teleRow('Error de carga',on?err.toFixed(2)+' %':'—',on?(err<=5?'good':'warn'):'')+
      teleRow('Vth (Thévenin)',SOL_IDEAL.V[2].toFixed(3)+' V')+
      teleRow('Rth (Thévenin)',fmtR(Math.round(Rth)))+
      teleRow('Estado',on?'RL conectada':'RL desconectada',on?'good':'warn');
  }else if(mode==='corriente'){
    const i1=iThruI(ELI('R1c'))*1e3,i2=iThruI(ELI('R2c'))*1e3,i0=selI0*1e3;
    t.innerHTML=
      teleRow('I0',fmtI(selI0))+
      teleRow('R1c',fmtR(selR1c))+
      teleRow('R2c',fmtR(selR2c))+
      teleRow('I1 (por R1c)',i1.toFixed(3)+' mA','good')+
      teleRow('I2 (por R2c)',i2.toFixed(3)+' mA','good')+
      teleRow('ΣI − I0',fmtSum(i1+i2-i0)+' mA','good');
  }else{
    const r1=numOr('inR1'),r2=numOr('inR2'),sc=RETO_SCENARIOS[retoIdx];
    const ok=isFinite(r1)&&r1>0&&isFinite(r2)&&r2>0;
    if(!ok){
      t.innerHTML=
        teleRow('Vo (con tus valores)','—')+
        teleRow('Error de carga','—')+
        teleRow('I reposo','—')+
        teleRow('RL (fija)',fmtR(sc.RL))+
        teleRow('Estado','Escribe R1 y R2','warn');
    }else{
      const r=retoSolve(sc.V,sc.RL,r1,r2);
      const okV=Math.abs(r.vo-sc.VoObj)<=Math.max(0.05,sc.VoObj*0.02),okErr=r.err<=5,okI=r.iq<=25;
      t.innerHTML=
        teleRow('Vo (con tus valores)',r.vo.toFixed(3)+' V',okV?'good':'warn')+
        teleRow('Error de carga',r.err.toFixed(2)+' %',okErr?'good':'warn')+
        teleRow('I reposo',r.iq.toFixed(2)+' mA',okI?'good':'warn')+
        teleRow('RL (fija)',fmtR(sc.RL))+
        teleRow('Estado',retoSolved?'✔ DISEÑO VALIDADO':(okV&&okErr&&okI?'Cumple — pulsa Comprobar':'No cumple aún'),retoSolved?'good':'warn');
    }
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='explora'){
    const i1=iThru(EL('R1'))*1e3;
    html+=`<span class="mono">Vo = V·R2/(R1+R2) = ${fmtV(EL('V1').value)}·${EL('R2').value}/(${EL('R1').value}+${EL('R2').value}) = ${SOL.V[2].toFixed(3)} V</span><br>`+
      `<span class="mono">I reposo = V/(R1+R2) = ${i1.toFixed(3)} mA (sin carga, es la ÚNICA corriente del circuito)</span><br>`+
      `<span class="mono">Toca el esquema: fuente, R1, R2 y el nodo Vo.</span>`;
  }else if(mode==='carga'){
    const on=EL('RL').on;
    if(on){
      const err=Math.abs(SOL_IDEAL.V[2]-SOL.V[2])/SOL_IDEAL.V[2]*100;
      const Rth=1/(1/EL('R1').value+1/EL('R2').value);
      const RparEq=1/(1/EL('R2').value+1/EL('RL').value);
      html+=`<span class="mono">R2‖RL = ${Math.round(RparEq)} Ω → Vo = V·(R2‖RL)/(R1+(R2‖RL)) = ${SOL.V[2].toFixed(3)} V</span><br>`+
        `<span class="mono">Error de carga = |Vo_ideal−Vo|/Vo_ideal = ${err.toFixed(2)} % (Vo_ideal = ${SOL_IDEAL.V[2].toFixed(3)} V)</span><br>`+
        `<span class="mono">Cruce con Thévenin: Vth=${SOL_IDEAL.V[2].toFixed(3)} V, Rth=${Math.round(Rth)} Ω → Vo = Vth·RL/(RL+Rth) = ${(SOL_IDEAL.V[2]*EL('RL').value/(EL('RL').value+Rth)).toFixed(3)} V <span class="ok">✔ coincide</span></span>`;
    }else{
      html+=`<span class="mono">RL está desconectada (circuito abierto): Vo = Vo_ideal = ${SOL_IDEAL.V[2].toFixed(3)} V.</span><br>`+
        `<span class="mono">Toca el interruptor del esquema (o el botón "Conectar RL") para ver el efecto de carga.</span>`;
    }
  }else if(mode==='corriente'){
    const i1=iThruI(ELI('R1c'))*1e3,i2=iThruI(ELI('R2c'))*1e3,i0=selI0*1e3;
    html+=`<span class="mono">I1 = I0·R2c/(R1c+R2c) = ${i0.toFixed(1)}·${selR2c}/(${selR1c}+${selR2c}) = ${i1.toFixed(3)} mA</span><br>`+
      `<span class="mono">I2 = I0·R1c/(R1c+R2c) = ${i2.toFixed(3)} mA</span><br>`+
      `<span class="mono">ΣI − I0 = ${fmtSum(i1+i2-i0)} mA <span class="ok">✔ carga conservada</span></span>`;
  }else{
    html+=retoMsg||`<span class="mono">V, RL y el objetivo de Vo están fijos (ver arriba). Propón R1 y R2 en Ω que cumplan Vo objetivo, error de carga ≤5 % y corriente de reposo ≤25 mA a la vez, y pulsa "Comprobar diseño".</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();refreshNet3D();}
function afterEdit(){resolve();buildQuiz();solved=false;clearDx();refreshQuestion();refreshAll();}
function onRetoInput(){
  if(mode!=='reto')return;
  retoSolved=false;retoMsg='';
  resolve();refreshAll();
}
function toggleCarga(){cargaOn=!cargaOn;synth.beep(cargaOn?880:440,0.08,0.05);afterEdit();}

/* ============================================================
   10) RETO — diseño (no predicción)
   ============================================================ */
function checkDesign(){
  const r1=numOr('inR1'),r2=numOr('inR2');
  if(!isFinite(r1)||!isFinite(r2)||r1<=0||r2<=0){showToast('Escribe R1 y R2 en Ω (números positivos).');return;}
  const sc=RETO_SCENARIOS[retoIdx];
  const r=retoSolve(sc.V,sc.RL,r1,r2);
  const tol=Math.max(0.05,sc.VoObj*0.02);
  const okV=Math.abs(r.vo-sc.VoObj)<=tol,okErr=r.err<=5,okI=r.iq<=25;
  if(okV&&okErr&&okI){
    retoSolved=true;synth.beep(1046,0.12,0.06);
    retoMsg=`<span class="mono"><span class="ok">✔ Diseño válido.</span> Vo = ${r.vo.toFixed(3)} V (objetivo ${sc.VoObj} V) · error de carga = ${r.err.toFixed(2)} % (≤5 %) · I reposo = ${r.iq.toFixed(2)} mA (≤25 mA).<br>Ejemplo de referencia (no la única solución): R1≈${sc.ref.R1} Ω, R2≈${sc.ref.R2} Ω.</span>`;
  }else{
    synth.beep(220,0.15,0.06);
    retoMsg=`<span class="mono"><span class="dtc">✗ Aún no.</span> Vo=${r.vo.toFixed(3)} V (${okV?'✓ dentro de tolerancia':'✗ fuera de objetivo '+sc.VoObj+' V'}) · error=${r.err.toFixed(2)}% (${okErr?'✓':'✗ supera 5 %'}) · I reposo=${r.iq.toFixed(2)} mA (${okI?'✓':'✗ supera 25 mA'}).</span>`;
  }
  resolve();refreshAll();
}
function updateRetoSpec(){
  const sc=RETO_SCENARIOS[retoIdx];
  el('retoSpec').innerHTML=`Con V=${fmtV(sc.V)} y RL=${fmtR(sc.RL)} (fijas), diseña R1 y R2 para lograr <b>Vo ≈ ${sc.VoObj} V</b>, con error de carga ≤5 % y corriente de reposo ≤25 mA.<br><span style="color:var(--dim)">Estos presupuestos (5 %, 25 mA) son la especificación de ESTE ejercicio, no una norma de fabricante.</span>`;
}
function newScenario(){
  const pick=()=>Math.floor(Math.random()*RETO_SCENARIOS.length);
  let idx=pick();
  if(RETO_SCENARIOS.length>1)while(idx===retoIdx)idx=pick();
  retoIdx=idx;retoSolved=false;retoMsg='';
  el('inR1').value='';el('inR2').value='';
  if(mode!=='reto')setMode('reto');
  else{updateRetoSpec();resolve();buildQuiz();solved=false;clearDx();refreshQuestion();refreshAll();}
  showToast('🔀 <b>Nuevo reto.</b> Nuevo objetivo de Vo y/o RL — vuelve a diseñar R1 y R2.');
  synth.beep(520,0.08,0.05);
}

/* ============================================================
   11) PREGUNTAS DE INGENIERÍA (reconstruidas con la red viva)
   ============================================================ */
function buildQuiz(){
  const exampleRL=EL('R2').value;
  const netEx=JSON.parse(JSON.stringify(NET));
  netEx.elems.find(e=>e.id==='RL').value=exampleRL;netEx.elems.find(e=>e.id==='RL').on=true;
  const vEx=solveMNA(netEx).V[2];
  const netOn=JSON.parse(JSON.stringify(NET));
  netOn.elems.find(e=>e.id==='RL').on=true;
  const vOn=solveMNA(netOn).V[2];
  const errOn=Math.abs(SOL_IDEAL.V[2]-vOn)/SOL_IDEAL.V[2]*100;
  const Rth=1/(1/EL('R1').value+1/EL('R2').value);
  const symmetric=selR1c===selR2c;
  const i1c=iThruI(ELI('R1c'))*1e3,i2c=iThruI(ELI('R2c'))*1e3;
  const smaller=selR1c<selR2c?'R1c':(selR2c<selR1c?'R2c':null);
  const sc=RETO_SCENARIOS[retoIdx],base=sc.ref;
  const stiff=retoSolve(sc.V,sc.RL,base.R1/3,base.R2/3);
  const loose=retoSolve(sc.V,sc.RL,base.R1*3,base.R2*3);
  QUIZ={
    explora:{
      pregunta:`Si más adelante conectas una RL = ${fmtR(exampleRL)} en paralelo con R2 (sin cambiar R1 ni R2), ¿qué le pasará a Vo?`,
      opciones:[
        {t:'Vo subirá, porque RL aporta otra trayectoria de corriente hacia la fuente',ok:false,why:'RL no aporta corriente extra a la fuente: es una carga, retira corriente del nodo Vo. Vo no puede subir por encima del valor sin carga.'},
        {t:'Vo se mantiene igual — el divisor no depende de lo que conectes a la salida',ok:false,why:'Es el error de diseño más común. La fórmula ideal Vo=V·R2/(R1+R2) solo vale con la salida en circuito abierto.'},
        {t:`Vo bajará a ${vEx.toFixed(3)} V, porque R2‖RL (${Math.round(1/(1/EL('R2').value+1/exampleRL))} Ω) es menor que R2 solo`,ok:true,why:`R2‖RL siempre es MENOR que R2 solo, así que el divisor entrega una fracción menor de V. Con RL=R2, Vo cae de ${SOL.V[2].toFixed(3)} V a ${vEx.toFixed(3)} V.`},
        {t:'Vo se invertirá (voltaje negativo)',ok:false,why:'Con fuentes y resistores positivos en este circuito no hay forma de que Vo cambie de signo.'},
      ],
    },
    carga:{
      pregunta:`Con R1=${fmtR(EL('R1').value)} y R2=${fmtR(EL('R2').value)}, al conectar RL el error de carga es ${errOn.toFixed(2)} %. ¿A qué se debe, exactamente?`,
      opciones:[
        {t:'A que la fuente V1 pierde voltaje bajo carga (tiene resistencia interna)',ok:false,why:'En este modelo V1 es una fuente IDEAL (sin resistencia interna) — el contrato de fidelidad lo declara. El error viene del divisor, no de la fuente.'},
        {t:`A que R2‖RL (${Math.round(1/(1/EL('R2').value+1/EL('RL').value))} Ω) es menor que R2 (${EL('R2').value} Ω), así que Vo=V·(R2‖RL)/(R1+(R2‖RL)) da un valor menor`,ok:true,why:`Exacto: al conectar RL en paralelo con R2, la resistencia combinada baja, y con ella la fracción de V que llega a Vo. Vth=${SOL_IDEAL.V[2].toFixed(3)} V, Rth=${Math.round(Rth)} Ω lo confirman: Vo=Vth·RL/(RL+Rth)=${vOn.toFixed(3)} V.`},
        {t:'A que R1 cambia de valor cuando hay carga conectada',ok:false,why:'R1 es un resistor fijo: su valor no cambia por lo que se conecte en la salida.'},
        {t:'Es un error de redondeo del simulador, no un efecto real',ok:false,why:'Es un efecto real y medible en cualquier divisor físico — por eso todo diseño de divisores debe considerar la impedancia de la siguiente etapa.'},
      ],
    },
    corriente:symmetric?{
      pregunta:`Con R1c = R2c = ${fmtR(selR1c)} (iguales), ¿cómo se reparte I0 = ${fmtI(selI0)} entre las dos ramas?`,
      opciones:[
        {t:`Mitad y mitad: I1 = I2 = ${i1c.toFixed(3)} mA`,ok:true,why:'Con resistencias iguales, el reparto del divisor de corriente es simétrico: cada rama se lleva exactamente la mitad de I0.'},
        {t:'Toda la corriente va por R1c porque aparece primero en el esquema',ok:false,why:'El orden en el dibujo no afecta el reparto físico: ambas ramas están en paralelo entre el mismo par de nodos.'},
        {t:'I1 será mayor porque R1c tiene una letra "1"',ok:false,why:'El reparto depende solo de los VALORES de resistencia, no de las etiquetas.'},
        {t:'No se puede repartir corriente entre dos resistencias iguales',ok:false,why:'Sí se puede — y de hecho es el caso más simple de todos: reparto exactamente igual.'},
      ],
    }:{
      pregunta:`Con R1c=${fmtR(selR1c)} y R2c=${fmtR(selR2c)}, ¿cuál rama se lleva MÁS corriente?`,
      opciones:[
        {t:`${smaller} (la de MENOR resistencia) se lleva más corriente: I=${(smaller==='R1c'?i1c:i2c).toFixed(3)} mA contra ${(smaller==='R1c'?i2c:i1c).toFixed(3)} mA`,ok:true,why:'El divisor de corriente reparte de forma INVERSA a la resistencia: el camino más "fácil" (menor R) se lleva la mayor parte de I0.'},
        {t:`${smaller==='R1c'?'R2c':'R1c'} (la de MAYOR resistencia) se lleva más corriente`,ok:false,why:'Es al revés: a mayor resistencia, mayor oposición al paso de corriente, así que esa rama recibe MENOS, no más.'},
        {t:'Ambas ramas llevan exactamente la misma corriente sin importar su valor',ok:false,why:`Solo ocurre cuando R1c=R2c. Aquí son distintas (${selR1c} Ω vs ${selR2c} Ω), así que el reparto también lo es.`},
        {t:'La corriente no se reparte: toda pasa por la de menor resistencia y nada por la otra',ok:false,why:`Ambas ramas están en paralelo entre los mismos dos nodos: SIEMPRE llevan algo de corriente (aquí ${i1c.toFixed(3)} mA y ${i2c.toFixed(3)} mA), nunca cero.`},
      ],
    },
    reto:{
      pregunta:`Si divides entre 3 los valores de referencia de este reto (R1≈${Math.round(base.R1/3)} Ω, R2≈${Math.round(base.R2/3)} Ω), ¿qué pasa con el error de carga y la corriente de reposo?`,
      opciones:[
        {t:`El error de carga baja a ${stiff.err.toFixed(2)} % pero I reposo SUBE a ${stiff.iq.toFixed(2)} mA — más "rígido" cuesta más corriente`,ok:true,why:`Resistencias más pequeñas hacen al divisor menos sensible a RL (más rígido), pero también dejan pasar más corriente de reposo: es la disyuntiva central del diseño de divisores.`},
        {t:`Ambos bajan: error a ${stiff.err.toFixed(2)} % y corriente a ${stiff.iq.toFixed(2)} mA`,ok:false,why:`Solo el error de carga baja. La corriente de reposo I=V/(R1+R2) SUBE cuando R1+R2 baja — no pueden mejorar los dos a la vez con este cambio.`},
        {t:'Ninguno cambia: el error de carga y la corriente de reposo no dependen de R1 ni R2',ok:false,why:'Ambos dependen directamente de R1 y R2 — por eso el reto pide diseñarlos, no adivinarlos.'},
        {t:`Multiplicar R1 y R2 por 3 (no dividir) sería la forma de bajar AMBOS a la vez: error ${loose.err.toFixed(2)} % e I reposo ${loose.iq.toFixed(2)} mA`,ok:false,why:`Al multiplicar por 3 la I reposo SÍ baja (${loose.iq.toFixed(2)} mA) pero el error de carga SUBE (${loose.err.toFixed(2)} %) — sigue siendo una disyuntiva, no una mejora conjunta.`},
      ],
    },
  };
}
function clearDx(){el('dxbtns').querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong'));}
function refreshQuestion(){
  const q=QUIZ[mode];
  el('q_text').innerHTML=q.pregunta;
  el('dxbtns').innerHTML=q.opciones.map((o,i)=>`<button class="b dx" data-i="${i}">${'ABCD'[i]} · ${o.t}</button>`).join('');
  el('dxbtns').querySelectorAll('.b.dx').forEach(btn=>{btn.onclick=()=>answer(+btn.dataset.i);});
}
function answer(i){
  const o=QUIZ[mode].opciones[i];clearDx();
  const btn=el('dxbtns').children[i];
  if(o.ok){
    btn.classList.add('right');solved=true;synth.beep(1046,0.12,0.06);
    showToast(`<span style="color:var(--good)">✔ Correcto.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }else{
    btn.classList.add('wrong');synth.beep(220,0.15,0.06);
    showToast(`<span style="color:var(--bad)">✗ Revisa el modelo.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }
}

/* ============================================================
   12) PICKING — pizarrón (por UV) + banco (por userData)
   ============================================================ */
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return;
  if(hit.object===board&&hit.uv){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object;
  while(o){
    const u=o.userData||{};
    if(u.el){toastEl(u.el,false);return;}
    if(u.title){showToast(`<b style="color:var(--accent2)">${u.title}</b><br><span style="color:var(--dim);font-size:11px">${u.info}</span>`);return;}
    o=o.parent;
  }
});

/* hover: etiquetas flotantes + cursor */
(()=>{
  const ray=new THREE.Raycaster(),v2=new THREE.Vector2();
  S.renderer.domElement.addEventListener('pointermove',ev=>{
    const r=S.renderer.domElement.getBoundingClientRect();
    v2.x=((ev.clientX-r.left)/r.width)*2-1;v2.y=-((ev.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(v2,S.camera);
    const hits=ray.intersectObjects(scene.children,true);
    HOVER_LABELS.forEach(lb=>lb.visible=false);
    let cursor='default';
    if(hits.length){
      let o=hits[0].object;
      while(o){
        if(HOVER_LABELS.has(o)){HOVER_LABELS.get(o).visible=true;cursor='pointer';break;}
        if(o.userData&&(o.userData.el||o.userData.title||o===board))cursor='pointer';
        o=o.parent;
      }
      if(hits[0].object===board)cursor='pointer';
    }
    S.renderer.domElement.style.cursor=cursor;
  });
})();

/* ============================================================
   13) RECORRIDO AUTOMÁTICO
   ============================================================ */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorrido guiado en curso…';
  try{
    synth.init();synth.resume();
    clearDx();
    setMode('explora');
    showToast(`Paso 1 · Divisor ideal: Vo = V·R2/(R1+R2) = ${SOL.V[2].toFixed(3)} V, sin carga en la salida.`);await sleep(2600);
    setMode('carga');
    if(!cargaOn)toggleCarga();
    const err=Math.abs(SOL_IDEAL.V[2]-SOL.V[2])/SOL_IDEAL.V[2]*100;
    showToast(`Paso 2 · Con RL conectada, Vo cae a ${SOL.V[2].toFixed(3)} V (ideal ${SOL_IDEAL.V[2].toFixed(3)} V) — error de carga ${err.toFixed(2)} %.`);await sleep(3000);
    setMode('corriente');
    const i1c=iThruI(ELI('R1c'))*1e3,i2c=iThruI(ELI('R2c'))*1e3;
    showToast(`Paso 3 · Divisor de corriente: I1=${i1c.toFixed(3)} mA por R1c, I2=${i2c.toFixed(3)} mA por R2c — inverso a la resistencia.`);await sleep(3000);
    setMode('reto');
    showToast('Paso 4 · El reto: diseñar R1 y R2, no despejarlos de una fórmula única.');await sleep(2400);
    const sc=RETO_SCENARIOS[retoIdx];
    el('inR1').value=sc.ref.R1;el('inR2').value=sc.ref.R2;
    checkDesign();await sleep(2400);
    const q=QUIZ.reto,i=q.opciones.findIndex(o=>o.ok);
    clearDx();
    const dxBtn=el('dxbtns').children[i];
    if(dxBtn){dxBtn.classList.add('right');solved=true;synth.beep(1046,0.12,0.06);}
    showToast(`<span style="color:var(--good)">✔ ${q.opciones[i].t}</span><br><span style="color:var(--dim);font-size:11px">${q.opciones[i].why}</span>`);
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

/* ============================================================
   14) ANIMACIÓN + SONIDO + INIT
   ============================================================ */
S.setAnimate((dt,time)=>{
  const s=1+Math.sin(time*4)*0.18;
  Object.values(TP_GLOW).forEach(g=>g.scale.setScalar(s));
});

['explora','carga','corriente','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newScenario;
el('btnCheck').onclick=checkDesign;
['inR1','inR2'].forEach(id=>{
  el(id).addEventListener('input',onRetoInput);
  el(id).addEventListener('keydown',e=>{if(e.key==='Enter')checkDesign();});
});
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊 Sonido':'🔇 Sonido';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

resolve();buildQuiz();refreshNet3D();
S.start();
setMode('explora');

/* gancho de verificación independiente (tests re-resuelven la red en Node) */
window.__labDebug={
  net:()=>JSON.parse(JSON.stringify(NET)),
  netI:()=>JSON.parse(JSON.stringify(NETI)),
  sol:()=>({V:SOL.V.slice()}),
  solIdeal:()=>({V:SOL_IDEAL.V.slice()}),
  solI:()=>({V:SOLI.V.slice()}),
  boardClick,
  mode:()=>mode,
  retoSolved:()=>retoSolved,
};
