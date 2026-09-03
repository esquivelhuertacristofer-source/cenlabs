/*
 * Equivalentes de Thévenin y Norton — Caracterización Experimental de Caja Negra
 * Motor: análisis nodal modificado (MNA) — Ho, Ruehli, Brennan (1975) — el mismo
 * de Kirchhoff (mecanica-13) y los divisores (mecanica-61), extendido con un nuevo
 * tipo de elemento 'AMM' (amperímetro ideal = fuente de 0 V) que permite leer la
 * corriente de cortocircuito directamente del solver, sin fórmulas ad-hoc.
 * Símbolos: IEC 60617. Bandas de color de resistores: IEC 60063 (serie E12).
 * Teoremas: Hayt/Kemmerly/Durbin, Análisis de circuitos en ingeniería (McGraw-Hill).
 * Las tolerancias del modo Reto (±3–5 % relativas) son un margen PEDAGÓGICO de este
 * ejercicio, no una especificación de fabricante ni de instrumento real.
 */

// ============================== 1) ESCENA ==============================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.1,2.5,7.2],target:[0.5,1.3,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

// ============================== 2) RED Y MOTOR MNA ==============================
// Topología: node1=V+ (tras V1), node2=nodo de unión, node3=terminal A. Terminal B = tierra (node0).
const NET={nodes:3,elems:[
  {id:'V1',type:'V',a:1,b:0,value:12},
  {id:'R1',type:'R',a:1,b:2,value:1000},
  {id:'R2',type:'R',a:2,b:0,value:2200},
  {id:'R3',type:'R',a:2,b:3,value:470},
  {id:'RL',type:'R',a:3,b:0,value:2200,on:false},
  {id:'AMM',type:'AMM',a:3,b:0,value:0,on:false},
]};
const EL=id=>NET.elems.find(e=>e.id===id);

function solveMNA(net){
  const n=net.nodes;
  const vs=net.elems.filter(e=>e.type==='V'||(e.type==='AMM'&&e.on!==false));
  const N=n+vs.length;
  const A=Array.from({length:N},()=>new Array(N).fill(0));
  const z=new Array(N).fill(0);
  net.elems.forEach(e=>{
    if(e.type==='R'&&e.on!==false){
      const g=1/e.value, a=e.a-1, b=e.b-1;
      if(a>=0)A[a][a]+=g;
      if(b>=0)A[b][b]+=g;
      if(a>=0&&b>=0){A[a][b]-=g;A[b][a]-=g;}
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
  return {V:[0,...x.slice(0,n)],srcI:x.slice(n),vsList:vs};
}
function ammIsc(sol){const idx=sol.vsList.findIndex(e=>e.type==='AMM');return idx>=0?Math.abs(sol.srcI[idx]):0;}
const iThru=e=>(SOL.V[e.a]-SOL.V[e.b])/e.value;
function rthTeorico(){return EL('R3').value+(EL('R1').value*EL('R2').value)/(EL('R1').value+EL('R2').value);}

const fmtR=v=>v>=1000?(((v/1000)%1)?(v/1000).toFixed(1):String(Math.round(v/1000)))+' kΩ':v+' Ω';
const fmtV=v=>(v%1?v.toFixed(1):String(v))+' V';
const fmtI=v=>{const m=v*1000;return(Math.abs(m%1)>1e-9?m.toFixed(1):String(Math.round(m)))+' mA';};
const BAND_COLORS=['#1a1a1a','#6b4226','#c73a3a','#d2691e','#e8c832','#3f8f3f','#2b5fb8','#7d3fc4','#8a8a8a','#e8e8e8'];
const BAND_NAMES=['negro','café','rojo','naranja','amarillo','verde','azul','violeta','gris','blanco'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1;const dd=Math.round(v/Math.pow(10,exp));return{d1:Math.floor(dd/10),d2:dd%10,mult:exp};}

// ============================== 3) ESTADO ==============================
let mode='explora'; // explora | carga | norton | reto
let selR1=1000,selR2=2200,selR3=470,selRL=2200,cargaOn=false;
let measuredVoc=false,measuredIsc=false;
let retoIdx=0,retoSolved=false,retoMsg='';
let solved=false,autoRunning=false,QUIZ={};
const R_CANDIDATES=[470,1000,2200,3300,4700,6800,10000];
const RL_CANDIDATES=[1000,2200,4700,10000];
const RETO_SCENARIOS=[
  {V:12,R1:1500,R2:3300,R3:680},
  {V:12,R1:4700,R2:2200,R3:1000},
  {V:12,R1:6800,R2:3300,R3:2200},
  {V:12,R1:1000,R2:1500,R3:330},
  {V:12,R1:2200,R2:6800,R3:1500},
  {V:12,R1:3300,R2:1000,R3:470},
];

function numOr(id){const v=parseFloat((el(id).value||'').replace(',','.'));return isFinite(v)?v:NaN;}
function syncNet(){
  if(mode==='reto'){
    const sc=RETO_SCENARIOS[retoIdx];
    EL('V1').value=sc.V; EL('R1').value=sc.R1; EL('R2').value=sc.R2; EL('R3').value=sc.R3;
    EL('RL').on=false;
  }else{
    EL('V1').value=12; EL('R1').value=selR1; EL('R2').value=selR2; EL('R3').value=selR3; EL('RL').value=selRL;
    EL('RL').on=(mode==='carga')&&cargaOn;
  }
  EL('AMM').on=false;
}
let SOL=null,SOL_OPEN=null,SOL_SHORT=null;
function resolve(){
  syncNet();
  SOL=solveMNA(NET);
  const netOpen=JSON.parse(JSON.stringify(NET));
  netOpen.elems.find(e=>e.id==='RL').on=false; netOpen.elems.find(e=>e.id==='AMM').on=false;
  SOL_OPEN=solveMNA(netOpen);
  const netShort=JSON.parse(JSON.stringify(NET));
  netShort.elems.find(e=>e.id==='RL').on=false; netShort.elems.find(e=>e.id==='AMM').on=true;
  SOL_SHORT=solveMNA(netShort);
}
const vocReal=()=>SOL_OPEN.V[3];
const iscReal=()=>ammIsc(SOL_SHORT);
const rthReal=()=>vocReal()/iscReal();
function vRLIfConnected(RLval){
  const net2=JSON.parse(JSON.stringify(NET));
  net2.elems.find(e=>e.id==='RL').value=RLval;
  net2.elems.find(e=>e.id==='RL').on=true;
  net2.elems.find(e=>e.id==='AMM').on=false;
  return solveMNA(net2).V[3];
}

// ============================== 4) MATERIALES ==============================
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};
const brush=brushedMetal(), rub=rubber(), plas=techPlastic(0.16,0.19,0.18);
const MAT={
  bench:std({...plas.maps,color:0x3a464d,roughness:0.85,metalness:0.05}),
  frame:std({...plas.maps,color:0x232a2e,roughness:0.95,metalness:0}),
  leg:std({...brush.maps,color:0x77828a,metalness:0.35,roughness:0.85}),
  pcb:std({color:0x14532d,roughness:0.62,metalness:0}),
  trace:std({...brush.maps,color:0xc08a3e,metalness:0.8,roughness:0.5}),
  psu:std({...brush.maps,color:0x707c85,metalness:0.35,roughness:0.85}),
  lead:std({...brush.maps,color:0xbfc8ce,metalness:0.9,roughness:0.35}),
  jackRed:std({color:0xc23434,roughness:0.55,metalness:0}),
  jackBlk:std({color:0x14181c,roughness:0.55,metalness:0}),
  cableRed:std({...rub.maps,color:0x9e2b2b,roughness:1.0,metalness:0}),
  cableBlk:std({...rub.maps,color:0x15181b,roughness:1.0,metalness:0}),
  caja:std({...plas.maps,color:0x1b2420,roughness:0.9,metalness:0.05}),
};

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const lb=labelSprite(text,color);lb.position.copy(pos);if(scale)lb.scale.multiplyScalar(scale);
  lb.visible=false;lb.raycast=()=>{};obj.add(lb);HOVER_LABELS.set(obj,lb);
}

// ============================== 5) PIZARRÓN (esquema 2D en canvas) ==============================
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
frame.userData={title:'Pizarrón del esquema',info:'Esquema vivo de la red (símbolos IEC 60617). Toca los componentes, el interruptor o las terminales A/B.'};
addHoverLabel(frame,'Esquema vivo · clic: componentes y terminales','#4FD1C5',new THREE.Vector3(0,1.65,0.3),1.0);

function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function ah(c,x,y,dx,dy){const s=10;c.beginPath();c.moveTo(x,y);c.lineTo(x-dx*s-dy*s*0.5,y-dy*s+dx*s*0.5);c.lineTo(x-dx*s+dy*s*0.5,y-dy*s-dx*s*0.5);c.closePath();c.fill();}
function earth(c,x,y){c.strokeStyle='#cfe8e2';c.lineWidth=3;line(c,x,y,x,y+14);[16,11,6].forEach((w,i)=>line(c,x-w,y+14+i*8,x+w,y+14+i*8));}
function nodeDot(c,x,y,big){c.fillStyle='#4FD1C5';c.beginPath();c.arc(x,y,big?6:4,0,7);c.fill();}
function curHgeneric(c,x,y,name,ima,geoDir,hide){
  if(hide)return;
  c.strokeStyle='#FFB703';c.lineWidth=2.5;const dx=geoDir>=0?1:-1;
  line(c,x-24*dx,y-24,x+24*dx,y-24);ah(c,x+24*dx,y-24,dx,0);
  c.fillStyle='#FFB703';c.font='13px Outfit, sans-serif';c.textAlign='center';
  c.fillText(name+' '+fmtI(Math.abs(ima)/1000),x,y-32);
}
function curVgeneric(c,x,y,name,ima,hide){
  if(hide)return;
  c.strokeStyle='#FFB703';c.lineWidth=2.5;
  line(c,x+30,y-24,x+30,y+24);ah(c,x+30,y+24,0,1);
  c.fillStyle='#FFB703';c.font='13px Outfit, sans-serif';c.textAlign='left';
  c.fillText(name+' '+fmtI(Math.abs(ima)/1000),x+38,y+4);
}
function resH(c,cx,cy,id){
  const e=EL(id),off=e.on===false;
  c.strokeStyle=off?'#4a5a56':'#cfe8e2';c.lineWidth=3;
  c.fillStyle=off?'#0c1512':'#132420';rr(c,cx-70,cy-24,140,48,8);c.fill();c.stroke();
  c.fillStyle=off?'#5a6b66':'#EAF4F1';c.font='bold 18px Outfit, sans-serif';c.textAlign='center';
  c.fillText(id,cx,cy-3);c.font='13px Outfit, sans-serif';c.fillText(fmtR(e.value),cx,cy+16);
}
function resV(c,cx,cy,id){
  const e=EL(id),off=e.on===false;
  c.strokeStyle=off?'#4a5a56':'#cfe8e2';c.lineWidth=3;
  c.fillStyle=off?'#0c1512':'#132420';rr(c,cx-24,cy-70,48,140,8);c.fill();c.stroke();
  c.fillStyle=off?'#5a6b66':'#EAF4F1';c.font='bold 18px Outfit, sans-serif';c.textAlign='center';
  c.save();c.translate(cx,cy);c.rotate(-Math.PI/2);
  c.fillText(id+' · '+fmtR(e.value),0,5);c.restore();
}
function battV(c,cx,cy,id){
  const e=EL(id);
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,cx,cy-40,cx,cy-14);line(c,cx-22,cy-14,cx+22,cy-14);
  line(c,cx,cy+14,cx,cy+40);c.lineWidth=6;line(c,cx-12,cy+14,cx+12,cy+14);
  c.fillStyle='#f0a5a5';c.font='bold 19px Outfit, sans-serif';c.textAlign='left';
  c.fillText(id+' · '+fmtV(e.value),cx+34,cy+6);
  c.fillStyle='#cfe8e2';c.font='14px Outfit, sans-serif';
  c.fillText('+',cx-38,cy-6);c.fillText('−',cx-38,cy+24);
}
function swV(c,x,y1,y2,closed){
  c.strokeStyle=closed?'#4FD1C5':'#FFB703';c.lineWidth=3;
  line(c,x,y1,x,y1+16);nodeDot(c,x,y1+16,false);
  if(closed){line(c,x,y1+16,x,y2-4);}
  else{c.save();c.translate(x,y1+16);c.rotate(-0.55);line(c,0,0,0,y2-y1-24);c.restore();}
  nodeDot(c,x,y2-4,false);line(c,x,y2-4,x,y2);
  c.fillStyle=closed?'#4FD1C5':'#FFB703';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';
  c.fillText(closed?'RL conectada':'RL desconectada',x+16,(y1+y2)/2);
}
function srcIVv(c,cx,cy,label,ampsValue){
  c.fillStyle='#0c1512';c.beginPath();c.arc(cx,cy,30,0,7);c.fill();
  c.strokeStyle='#cfe8e2';c.lineWidth=3;c.beginPath();c.arc(cx,cy,30,0,7);c.stroke();
  c.strokeStyle='#f0a5a5';c.lineWidth=4;
  line(c,cx,cy+16,cx,cy-16);ah(c,cx,cy-10,0,-1);
  c.fillStyle='#f0a5a5';c.font='bold 17px Outfit, sans-serif';c.textAlign='center';
  c.fillText(label,cx,cy-46);c.font='13px Outfit, sans-serif';c.fillText(fmtI(ampsValue),cx,cy+58);
}
function resVv(c,cx,cy,label,ohmValue){
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  c.fillStyle='#132420';rr(c,cx-24,cy-70,48,140,8);c.fill();c.stroke();
  c.fillStyle='#EAF4F1';c.font='bold 17px Outfit, sans-serif';c.textAlign='center';
  c.fillText(label,cx,cy-46);c.font='13px Outfit, sans-serif';c.fillText(fmtR(ohmValue),cx,cy+58);
}

function drawBoardCircuito(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('RED DE DOS TERMINALES · símbolos IEC 60617',26,44);
  if(mode==='carga'){c.fillStyle='#FFB703';c.textAlign='right';c.fillText('⚠️ Verificando equivalente con carga',998,44);}
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,120,150,920,150);
  line(c,120,150,120,640);
  line(c,120,640,920,640);
  line(c,520,150,520,640);
  const rlOn=EL('RL').on;
  line(c,920,210,920,640);
  battV(c,120,395,'V1');
  resH(c,320,150,'R1');
  resV(c,520,395,'R2');
  resH(c,720,150,'R3');
  resV(c,920,395,'RL');
  swV(c,920,150,210,rlOn);
  earth(c,300,640);
  nodeDot(c,520,150,true);
  nodeDot(c,920,150,true);
  c.font='bold 20px Outfit, sans-serif';c.textAlign='center';c.fillStyle='#4FD1C5';
  c.fillText('Terminal A',920,112);
  c.font='18px Outfit, sans-serif';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('Terminal B · ref · 0 V',232,706);
  const i1=iThru(EL('R1'));
  curHgeneric(c,420,150,'I1',i1,1,false);
  if(rlOn){const il=iThru(EL('RL'));curVgeneric(c,920,555,'IL',il,false);}
  bTex.needsUpdate=true;
}
function drawBoardNorton(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('EQUIVALENTE DE NORTON · símbolos IEC 60617',26,44);
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,220,200,820,200);
  line(c,220,200,220,550);
  line(c,820,200,820,550);
  line(c,220,550,820,550);
  line(c,520,200,520,550);
  const rlv=EL('RL').value;
  const vRL=vRLIfConnected(rlv);
  srcIVv(c,220,375,'In',iscReal());
  resVv(c,520,375,'Rn',rthReal());
  resVv(c,820,375,'RL',rlv);
  earth(c,400,550);
  nodeDot(c,520,200,true);
  c.font='bold 24px Outfit, sans-serif';c.textAlign='center';c.fillStyle='#4FD1C5';
  c.fillText('V(RL) · '+vRL.toFixed(3)+' V',520,172);
  c.font='16px Outfit, sans-serif';c.fillStyle='#8FB3AC';
  c.fillText('ref · 0 V',400,612);
  const iRL=vRL/rlv;
  curVgeneric(c,820,470,'IL',iRL,false);
  bTex.needsUpdate=true;
}
function drawBoardCaja(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('CAJA NEGRA · caracterización experimental',26,44);
  c.fillStyle='#FFB703';c.textAlign='right';c.fillText('🎯 mide y reporta Vth, Rth',998,44);
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,180,300,340,300);
  line(c,180,480,340,480);
  rr(c,340,220,340,340,18);
  c.fillStyle='#12201c';c.fill();
  c.strokeStyle='#cfe8e2';c.lineWidth=3;c.stroke();
  c.fillStyle='#4FD1C5';c.font='bold 140px Outfit, sans-serif';c.textAlign='center';
  c.fillText('?',510,420);
  nodeDot(c,180,300,true);
  nodeDot(c,180,480,true);
  earth(c,150,480);
  c.font='bold 20px Outfit, sans-serif';c.textAlign='left';c.fillStyle='#8FB3AC';
  c.fillText('Terminal A',195,285);
  c.fillText('Terminal B · ref · 0 V',195,555);
  c.font='bold 20px Outfit, sans-serif';c.textAlign='left';
  c.fillStyle=measuredVoc?'#4FD1C5':'#5a6b66';
  c.fillText('Voc · '+(measuredVoc?vocReal().toFixed(3)+' V':'🔒 sin medir'),730,300);
  c.fillStyle=measuredIsc?'#4FD1C5':'#5a6b66';
  c.fillText('Isc · '+(measuredIsc?(iscReal()*1000).toFixed(3)+' mA':'🔒 sin medir'),730,360);
  bTex.needsUpdate=true;
}
function drawBoard(){if(mode==='norton')drawBoardNorton();else if(mode==='reto')drawBoardCaja();else drawBoardCircuito();}

const HIT_CIRCUITO=[
  {x:120,y:395,r:55,el:'V1'},{x:320,y:150,r:55,el:'R1'},{x:520,y:395,r:55,el:'R2'},
  {x:720,y:150,r:55,el:'R3'},{x:920,y:395,r:55,el:'RL'},{x:920,y:180,r:34,sw:true},
  {x:920,y:112,r:40,term:'A'},{x:232,y:706,r:70,term:'B'},
];
const HIT_NORTON=[{x:220,y:375,r:55,nel:'In'},{x:520,y:375,r:55,nel:'Rn'},{x:820,y:375,r:55,el:'RL'}];
const HIT_CAJA=[{x:180,y:300,r:50,term:'A'},{x:180,y:480,r:50,term:'B'}];
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  const HIT=mode==='norton'?HIT_NORTON:(mode==='reto'?HIT_CAJA:HIT_CIRCUITO);
  let best=null,bd=1e9;
  HIT.forEach(h=>{const d=Math.hypot(x-h.x,y-h.y);if(d<h.r&&d<bd){bd=d;best=h;}});
  if(!best)return;
  if(best.sw){ if(mode==='carga'){toggleCarga();} else{showToast('El interruptor de RL se controla desde el modo Carga.');} return; }
  if(best.term){toastTerminal(best.term);return;}
  if(best.nel){toastNortonEl(best.nel);return;}
  toastEl(best.el);
}

// ============================== 6) BANCO 3D ==============================
const bench=sh(roundedBox(3.4,0.5,1.9,MAT.bench,0.05));bench.position.set(1.85,0.25,0.9);scene.add(bench);
bench.userData={title:'Banco de trabajo',info:'La red de dos terminales montada físicamente: fuente, R1, R2, R3 y la carga externa RL.'};
const pcb=sh(roundedBox(2.6,0.06,1.3,MAT.pcb,0.02));pcb.position.set(1.85,0.53,1.05);scene.add(pcb);
pcb.userData={title:'Tarjeta de la red',info:'En modo Reto la fuente y los resistores internos quedan sellados dentro de la caja negra — solo accedes a las terminales A y B.'};
addHoverLabel(pcb,'Realización física de la red','#4FD1C5',new THREE.Vector3(0,0.62,0),0.9);

function trace(x1,z1,x2,z2){
  const w=Math.abs(x2-x1)||0.045,d=Math.abs(z2-z1)||0.045;
  const t=new THREE.Mesh(new THREE.BoxGeometry(Math.max(w,0.045),0.015,Math.max(d,0.045)),MAT.trace);
  t.position.set((x1+x2)/2,0.565,(z1+z2)/2);t.receiveShadow=true;scene.add(t);
  return t;
}

const RES3D={};
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio:std({color:0x9aa3ad,roughness:0.34,metalness:0.86}),
  acero:MAT.lead, cromo:MAT.lead,
  cobre:std({color:0xb87333,roughness:0.35,metalness:0.75}),
  chapa:std({color:0x8f98a3,roughness:0.40,metalness:0.80}),
  negro:std({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:std({color:0x14181e,roughness:0.80,metalness:0.02}),
  blanco:std({color:0xd7dee6,roughness:0.40,metalness:0.20}),
  ceramica:std({color:0xd7dee6,roughness:0.60,metalness:0.05}),
};
/* LA RESISTENCIA, con la forma que tiene en la mano: cuerpo abarrilado con
   hombros, las CUATRO BANDAS —tres de valor y la de tolerancia, separada, que
   es la que dice por que lado se empieza a leer— y las patas dobladas que bajan
   a la placa. Un tubo con cuatro rayas equiespaciadas vale para dos valores
   distintos segun por donde se lea, y ese es justo el ejercicio. */
function makeRes3D(id,x,z,vert){
  const g=P3.resistencia(MATP,{largo:0.20,d:0.090,patas:0.11,paso:0.34,
    bandas:[0x1a1a1a,0x1a1a1a,0x1a1a1a,0x1a1a1a]});
  g.position.set(x,0.56,z); if(vert)g.rotation.y=Math.PI/2;
  g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
  g.userData.el=id;
  scene.add(g);RES3D[id]={g,bands:g.userData.bandas};
}
makeRes3D('R1',1.35,0.70,false);
makeRes3D('R2',1.65,1.10,true);
makeRes3D('R3',1.95,0.70,false);
makeRes3D('RL',2.25,1.10,true);

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
  return g;
}
const psuGroup=makePSU(0,1.05,'V1');
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
  return t;
}
const cbl1=cable(0.92,0.99,0.35,0.95,0.60,0.70,MAT.cableRed);
const cbl2=cable(1.18,0.99,0.35,0.95,0.60,1.50,MAT.cableBlk);

const tr1=trace(0.95,0.70,1.18,0.70);
const tr2=trace(1.52,0.70,1.65,0.70);
const tr3=trace(1.65,0.70,1.65,0.93);
const tr4=trace(1.65,1.27,1.65,1.50);
const tr5=trace(1.65,0.70,1.78,0.70);
const tr6=trace(2.12,0.70,2.25,0.70);
trace(2.25,0.70,2.25,0.93);
trace(2.25,1.27,2.25,1.50);
trace(2.25,0.70,2.55,0.70);
trace(0.95,1.50,2.55,1.50);

const blackBoxGroup=new THREE.Group();scene.add(blackBoxGroup);
blackBoxGroup.add(psuGroup,RES3D['R1'].g,RES3D['R2'].g,RES3D['R3'].g,cbl1,cbl2,tr1,tr2,tr3,tr4,tr5,tr6);

const cajaBox=sh(roundedBox(1.55,0.62,1.05,MAT.caja,0.06));
cajaBox.position.set(1.5,0.84,0.9);
cajaBox.visible=false;
cajaBox.userData={title:'Caja negra',info:'Sella la fuente y los tres resistores internos. Solo puedes medir desde las terminales A y B — usa "Medir Voc" y "Medir Isc".'};
scene.add(cajaBox);
const cajaLabel=labelSprite('❓ CAJA NEGRA','#FFB703');
cajaLabel.position.set(1.5,1.05,0.9);
cajaLabel.visible=false;
scene.add(cajaLabel);

const TP_GLOW={};
function makeTerm(term,x,z,mat,color,label){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const post=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.034,0.16,12),mat));post.position.y=0.66;g.add(post);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(0.045,12,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.55,toneMapped:false}));
  glow.position.y=0.78;glow.raycast=()=>{};g.add(glow);TP_GLOW[term]=glow;
  g.userData={terminal:term};
  addHoverLabel(g,label,'#4FD1C5',new THREE.Vector3(0,1.02,0),0.7);
}
makeTerm('A',2.55,0.70,MAT.jackRed,0x4FD1C5,'Terminal A');
makeTerm('B',2.55,1.50,MAT.jackBlk,0x8a9299,'Terminal B · 0 V');

function refreshNet3D(){
  ['R1','R2','R3','RL'].forEach(id=>{
    const e=EL(id),r=RES3D[id],b=bandsFor(e.value);
    [b.d1,b.d2,b.mult].forEach((dig,i)=>r.bands[i].material.color.set(BAND_COLORS[dig]));
    r.bands[3].material.color.set('#c9a227');
  });
  drawPSU(0);
  blackBoxGroup.visible=(mode!=='reto');
  cajaBox.visible=(mode==='reto');
  cajaLabel.visible=(mode==='reto');
}

// ============================== 7) HUD Y PANEL ==============================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos · Caracterización experimental (D1)</div>
  <h2>Equivalentes de Thévenin y Norton</h2>
  <p>Cualquier red lineal de resistores y fuentes, vista desde solo <b>dos terminales</b>, se comporta
  exactamente igual que una fuente de voltaje en serie con una resistencia — sin importar qué tan
  compleja sea por dentro. Este banco reutiliza el mismo motor de <b>análisis nodal modificado (MNA)</b>
  de Kirchhoff y los divisores, extendido con un nuevo elemento: un <b>amperímetro ideal</b> (fuente de
  0 V) que permite leer la corriente de cortocircuito directamente del solver, sin desarmar la red.
  Mides Voc e Isc, calculas Vth y Rth, y contrastas el resultado contra el método teórico y contra la
  red completa bajo carga — hasta caracterizar, en el reto, una caja negra real que nunca ves por dentro.</p>
  <div class="formula">Vth = Voc · Rth = Voc/Isc · In = Isc · Rn = Rth · V(RL) = Vth·RL/(RL+Rth)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Terminales A/B de la red</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Corrientes de rama</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Fuentes ideales (V1, In)</div>
    <div class="li"><span class="dot" style="background:#8a9299"></span>Referencia (Terminal B · 0 V)</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> red resistiva de dos terminales resuelta en vivo por análisis nodal modificado (MNA), extendido con un amperímetro ideal para medir Isc sin ad-hoc; equivalencia exacta de Thévenin/Norton verificada por dos caminos independientes (experimental Voc/Isc y teórico R3+R1‖R2 con la fuente desactivada) y contra la red completa bajo cualquier carga.</div>
    <div class="fl no"><b>NO modela:</b> redes con múltiples fuentes o elementos no lineales, componentes reactivos ni CA — es un circuito resistivo de CD de parámetros concentrados. Las tolerancias del reto (±3–5 % relativas) son un margen PEDAGÓGICO de este ejercicio, no una especificación de fabricante ni de instrumento real.</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · IEC 60617 · IEC 60063 · MNA (Ho/Ruehli/Brennan, 1975)</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Thévenin / Norton · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_carga">⚠️ Carga</button>
    <button class="b" id="m_norton">🔀 Norton</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div class="modebar" id="selbar" style="display:none"></div>
  <div class="btns" id="medirBox" style="display:none">
    <button class="b" id="btnVoc">🔓 Medir Voc</button>
    <button class="b" id="btnIsc">⚡ Medir Isc</button>
  </div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Caracterización</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div style="display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:var(--ink)">
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inVth">Vth =</label><input id="inVth" inputmode="decimal" autocomplete="off" style="width:72px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>V</span></span>
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inRth">Rth =</label><input id="inRth" inputmode="decimal" autocomplete="off" style="width:72px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>Ω</span></span>
    </div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar caracterización</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nueva caja negra</button>
  </div>`;

const el=id=>document.getElementById(id);

// ============================== 8) TOASTS ==============================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3200);
}
function toastEl(id){
  if(mode==='reto'&&id!=='RL'){
    showToast('🔒 Caja negra: no puedes inspeccionar los componentes internos. Usa "Medir Voc" y "Medir Isc".');
    return;
  }
  const e=EL(id);
  if(e.type==='V'){
    showToast(`<b style="color:var(--accent2)">${id} · ${fmtV(e.value)}</b><br><span style="color:var(--dim);font-size:11px">Fuente ideal: alimenta la red (sin resistencia interna — modelo).</span>`);
    return;
  }
  const off=e.on===false;
  const i=off?0:iThru(e);
  const b=bandsFor(e.value);
  const bandas=`${BAND_NAMES[b.d1]}-${BAND_NAMES[b.d2]}-${BAND_NAMES[b.mult]}-oro`;
  const info=off?`Bandas: ${bandas}. Sin conectar en este modo: I = 0 mA.`:`Bandas: ${bandas}. I = ${fmtI(Math.abs(i))}.`;
  showToast(`<b style="color:var(--accent2)">${id} · ${fmtR(e.value)}${off?' · sin conectar':''}</b><br><span style="color:var(--dim);font-size:11px">${info}</span>`);
}
function toastTerminal(term){
  if(term==='A'){
    showToast(`<b style="color:var(--accent2)">Terminal A</b><br><span style="color:var(--dim);font-size:11px">Terminal de salida de la red. Aquí se conecta la carga externa o el instrumento de medición (voltímetro para Voc, amperímetro para Isc).</span>`);
  }else{
    showToast(`<b style="color:var(--accent2)">Terminal B · 0 V</b><br><span style="color:var(--dim);font-size:11px">Terminal de referencia (tierra) de la red. Toda medición se hace entre A y B.</span>`);
  }
}
function toastNortonEl(kind){
  if(kind==='In'){
    showToast(`<b style="color:var(--accent2)">In · ${fmtI(iscReal())}</b><br><span style="color:var(--dim);font-size:11px">Fuente de corriente de Norton: entrega la misma corriente de cortocircuito que la red original, In = Isc.</span>`);
  }else{
    showToast(`<b style="color:var(--accent2)">Rn · ${fmtR(rthReal())}</b><br><span style="color:var(--dim);font-size:11px">Resistencia de Norton: idéntica a la de Thévenin, Rn = Rth — en paralelo con la fuente de corriente.</span>`);
  }
}

// ============================== 9) MODOS ==============================
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.1,2.5,7.2],[0.5,1.3,0.1]],mision:'Mide Voc e Isc en las terminales de la red visible y obtén Vth y Rth — contrástalos contra el método teórico.'},
  carga:{nombre:'Carga',cam:[[-0.2,2.1,3.9],[-0.9,1.75,-0.8]],mision:'Conecta una RL cualquiera y comprueba que el equivalente de Thévenin predice EXACTO el voltaje de la red completa.'},
  norton:{nombre:'Norton',cam:[[-0.1,2.2,4.3],[-0.9,1.75,-0.8]],mision:'Convierte el mismo equivalente a Norton (In, Rn) y confirma que predice idéntico resultado sobre la misma carga.'},
  reto:{nombre:'Reto',cam:[[0.6,2.3,5.6],[0.2,1.3,0.2]],mision:'Caja negra real: usa solo "Medir Voc" y "Medir Isc" para reportar Vth y Rth dentro de tolerancia.'},
};
function selHtml(id,label,vals,fmt){
  return `<span style="display:inline-flex;gap:6px;align-items:center;font-size:12px;color:var(--ink);margin-right:8px"><label for="${id}">${label}</label><select id="${id}" style="background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:5px 6px;font:inherit;font-size:12px">${vals.map(v=>`<option value="${v}">${fmt(v)}</option>`).join('')}</select></span>`;
}
function wireSel(id,cb){
  const cur={selR1,selR2,selR3,selRL}[id];
  el(id).value=String(cur);
  el(id).onchange=()=>cb(parseFloat(el(id).value));
}
function buildSelBar(){
  const bar=el('selbar');
  if(mode==='explora'){
    bar.style.display='';
    bar.innerHTML=selHtml('selR1','R1',R_CANDIDATES,fmtR)+selHtml('selR2','R2',R_CANDIDATES,fmtR)+selHtml('selR3','R3',R_CANDIDATES,fmtR);
    wireSel('selR1',v=>{selR1=v;afterEdit();});
    wireSel('selR2',v=>{selR2=v;afterEdit();});
    wireSel('selR3',v=>{selR3=v;afterEdit();});
  }else if(mode==='carga'){
    bar.style.display='';
    bar.innerHTML=selHtml('selR1','R1',R_CANDIDATES,fmtR)+selHtml('selR2','R2',R_CANDIDATES,fmtR)+selHtml('selR3','R3',R_CANDIDATES,fmtR)+selHtml('selRL','RL',RL_CANDIDATES,fmtR)+`<button class="b" id="btnToggleRL">${cargaOn?'🔌 Desconectar RL':'🔌 Conectar RL'}</button>`;
    wireSel('selR1',v=>{selR1=v;afterEdit();});
    wireSel('selR2',v=>{selR2=v;afterEdit();});
    wireSel('selR3',v=>{selR3=v;afterEdit();});
    wireSel('selRL',v=>{selRL=v;afterLoadEdit();});
    el('btnToggleRL').onclick=toggleCarga;
  }else if(mode==='norton'){
    bar.style.display='';
    bar.innerHTML=selHtml('selRL','RL',RL_CANDIDATES,fmtR);
    wireSel('selRL',v=>{selRL=v;afterLoadEdit();});
  }else{
    bar.style.display='none';bar.innerHTML='';
  }
}
function setMode(k){
  mode=k;
  measuredVoc=false;measuredIsc=false;
  ['explora','carga','norton','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  buildSelBar();
  const reto=k==='reto';
  el('retoTitle').style.display=reto?'':'none';
  el('retoBox').style.display=reto?'':'none';
  el('medirBox').style.display=(k==='explora'||k==='reto')?'':'none';
  if(reto)updateRetoSpec();
  solved=false;clearDx();
  resolve();buildQuiz();refreshQuestion();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  refreshAll();
}
function afterEdit(){measuredVoc=false;measuredIsc=false;resolve();buildQuiz();solved=false;clearDx();refreshQuestion();refreshAll();}
function afterLoadEdit(){resolve();buildQuiz();solved=false;clearDx();refreshQuestion();refreshAll();}
function toggleCarga(){cargaOn=!cargaOn;synth.beep(cargaOn?880:440,0.08,0.05);afterLoadEdit();}

// ============================== 10) TELEMETRÍA Y REPORTE ==============================
function teleRow(l,v,cls){return `<div class="g"><div class="l">${l}</div><b class="${cls||''}">${v}</b></div>`;}
function updateTele(){
  const t=el('tele');
  const rt=rthTeorico();
  if(mode==='explora'){
    const gated=measuredVoc&&measuredIsc;
    t.innerHTML=
      teleRow('V1',fmtV(EL('V1').value))+
      teleRow('R1',fmtR(EL('R1').value))+
      teleRow('R2',fmtR(EL('R2').value))+
      teleRow('R3',fmtR(EL('R3').value))+
      teleRow('Voc (Vth)',measuredVoc?vocReal().toFixed(3)+' V':'🔒 sin medir',measuredVoc?'good':'warn')+
      teleRow('Isc',measuredIsc?(iscReal()*1000).toFixed(3)+' mA':'🔒 sin medir',measuredIsc?'good':'warn')+
      teleRow('Rth (medida = Voc/Isc)',gated?rthReal().toFixed(1)+' Ω':'—',gated?'good':'')+
      teleRow('Rth (teórica = R3+R1‖R2)',fmtR(Math.round(rt)))+
      teleRow('Estado',gated?'✔ Rth coincide':'Mide Voc e Isc',gated?'good':'warn');
  }else if(mode==='carga'){
    const rlv=EL('RL').value,on=EL('RL').on;
    const vth=vocReal(),rth=rthReal();
    const vRLth=vth*rlv/(rlv+rth);
    t.innerHTML=
      teleRow('Vth',vth.toFixed(3)+' V')+
      teleRow('Rth',fmtR(Math.round(rth)))+
      teleRow('RL',fmtR(rlv))+
      teleRow('V(RL) — predicho por Thévenin',vRLth.toFixed(3)+' V')+
      teleRow('V(RL) — red completa',on?SOL.V[3].toFixed(3)+' V':'— (RL abierta)',on?'good':'warn')+
      teleRow('Estado',on?'✔ coinciden':'Conecta RL',on?'good':'warn');
  }else if(mode==='norton'){
    const rlv=EL('RL').value;
    const isc=iscReal(),rth=rthReal();
    const vRLnorton=isc*(rth*rlv/(rth+rlv));
    const vRLfull=vRLIfConnected(rlv);
    t.innerHTML=
      teleRow('In',fmtI(isc))+
      teleRow('Rn',fmtR(Math.round(rth)))+
      teleRow('RL',fmtR(rlv))+
      teleRow('V(RL) — predicho por Norton',vRLnorton.toFixed(3)+' V')+
      teleRow('V(RL) — red completa',vRLfull.toFixed(3)+' V','good')+
      teleRow('Estado','✔ coinciden','good');
  }else{
    const gated=measuredVoc&&measuredIsc;
    t.innerHTML=
      teleRow('Voc (Vth)',measuredVoc?vocReal().toFixed(3)+' V':'🔒 sin medir',measuredVoc?'good':'warn')+
      teleRow('Isc',measuredIsc?(iscReal()*1000).toFixed(3)+' mA':'🔒 sin medir',measuredIsc?'good':'warn')+
      teleRow('Tu Vth',(el('inVth')&&el('inVth').value)?el('inVth').value+' V':'—')+
      teleRow('Tu Rth',(el('inRth')&&el('inRth').value)?el('inRth').value+' Ω':'—')+
      teleRow('Estado',retoSolved?'✔ CARACTERIZACIÓN VALIDADA':(gated?'Escribe Vth y Rth':'Mide Voc e Isc'),retoSolved?'good':'warn');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='explora'){
    const gated=measuredVoc&&measuredIsc;
    const rt=rthTeorico();
    if(gated){
      html+=`<span class="mono">Vth = Voc = ${vocReal().toFixed(3)} V</span><br>`+
        `<span class="mono">Rth = Voc/Isc = ${vocReal().toFixed(3)}/${(iscReal()*1000).toFixed(3)}mA = ${rthReal().toFixed(1)} Ω</span><br>`+
        `<span class="mono">Rth teórica = R3+(R1‖R2) = ${EL('R3').value}+${Math.round(EL('R1').value*EL('R2').value/(EL('R1').value+EL('R2').value))} = ${rt.toFixed(1)} Ω <span class="ok">✔ coincide</span></span>`;
    }else{
      html+=`<span class="mono">Pulsa "Medir Voc" y "Medir Isc" en el panel para caracterizar la red por el método experimental.</span>`;
    }
  }else if(mode==='carga'){
    const rlv=EL('RL').value,on=EL('RL').on;
    if(on){
      const vth=vocReal(),rth=rthReal();
      html+=`<span class="mono">V(RL) = Vth·RL/(RL+Rth) = ${vth.toFixed(3)}·${rlv}/(${rlv}+${rth.toFixed(1)}) = ${(vth*rlv/(rlv+rth)).toFixed(3)} V</span><br>`+
        `<span class="mono">Red completa (MNA): V(RL) = ${SOL.V[3].toFixed(3)} V <span class="ok">✔ coincide</span></span>`;
    }else{
      html+=`<span class="mono">RL está desconectada. Toca el interruptor del esquema (o "Conectar RL") para verificar la predicción de Thévenin.</span>`;
    }
  }else if(mode==='norton'){
    const rlv=EL('RL').value,isc=iscReal(),rth=rthReal();
    html+=`<span class="mono">In = Isc = ${fmtI(isc)} · Rn = Rth = ${rth.toFixed(1)} Ω (siempre iguales)</span><br>`+
      `<span class="mono">V(RL) por Norton = In·(Rn‖RL) = ${(isc*(rth*rlv/(rth+rlv))).toFixed(3)} V</span><br>`+
      `<span class="mono">Red completa (MNA): V(RL) = ${vRLIfConnected(rlv).toFixed(3)} V <span class="ok">✔ coincide</span></span>`;
  }else{
    html+=retoMsg||`<span class="mono">Caja negra sellada. Usa "Medir Voc" y "Medir Isc", calcula Vth y Rth, y pulsa "Comprobar caracterización".</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();refreshNet3D();}

// ============================== 11) RETO ==============================
function medirVoc(){measuredVoc=true;synth.beep(660,0.08,0.05);refreshAll();showToast(`Medida: Voc = ${vocReal().toFixed(3)} V (terminales en circuito abierto).`);}
function medirIsc(){measuredIsc=true;synth.beep(760,0.08,0.05);refreshAll();showToast(`Medida: Isc = ${(iscReal()*1000).toFixed(3)} mA (terminales en cortocircuito, vía amperímetro ideal).`);}
function checkReto(){
  if(!(measuredVoc&&measuredIsc)){showToast('Primero mide Voc e Isc.');return;}
  const vthGuess=numOr('inVth'),rthGuess=numOr('inRth');
  if(!isFinite(vthGuess)||!isFinite(rthGuess)){showToast('Escribe Vth (V) y Rth (Ω).');return;}
  const vocR=vocReal(),iscR=iscReal(),rthR=vocR/iscR;
  const tolV=Math.max(0.15,vocR*0.03),tolR=Math.max(15,rthR*0.05);
  const okV=Math.abs(vthGuess-vocR)<=tolV, okR=Math.abs(rthGuess-rthR)<=tolR;
  if(okV&&okR){
    retoSolved=true;synth.beep(1046,0.12,0.06);
    retoMsg=`<span class="mono"><span class="ok">✔ Caracterización correcta.</span> Vth=${vthGuess} V y Rth=${rthGuess} Ω están dentro de tolerancia (±${tolV.toFixed(2)} V, ±${tolR.toFixed(1)} Ω).</span>`;
  }else{
    synth.beep(220,0.15,0.06);
    retoMsg=`<span class="mono"><span class="dtc">✗ Aún no.</span> Vth ${okV?'✓ dentro de tolerancia':'✗ fuera de tolerancia'} · Rth ${okR?'✓ dentro de tolerancia':'✗ fuera de tolerancia'}. Vuelve a medir Voc/Isc con cuidado y recalcula.</span>`;
  }
  resolve();refreshAll();
}
function updateRetoSpec(){
  el('retoSpec').innerHTML=`Caja negra sellada con dos terminales (A, B). Usa <b>"Medir Voc"</b> y <b>"Medir Isc"</b>, calcula Vth=Voc y Rth=Voc/Isc, y repórtalos.<br><span style="color:var(--dim)">Las tolerancias (±3–5 % relativas) son un margen pedagógico de este ejercicio, no una especificación de fabricante.</span>`;
}
function newScenario(){
  const pick=()=>Math.floor(Math.random()*RETO_SCENARIOS.length);
  let idx=pick();
  if(RETO_SCENARIOS.length>1)while(idx===retoIdx)idx=pick();
  retoIdx=idx;retoSolved=false;retoMsg='';measuredVoc=false;measuredIsc=false;
  el('inVth').value='';el('inRth').value='';
  if(mode!=='reto'){setMode('reto');}
  else{updateRetoSpec();resolve();buildQuiz();solved=false;clearDx();refreshQuestion();refreshAll();}
  showToast('🔀 <b>Nueva caja negra.</b> Vuelve a medir Voc e Isc desde cero.');
  synth.beep(520,0.08,0.05);
}
function onRetoInput(){if(mode!=='reto')return;retoSolved=false;retoMsg='';refreshAll();}

// ============================== 12) QUIZ ==============================
function buildQuiz(){
  const rt=rthTeorico();
  const vth=vocReal(),rth=rthReal(),isc=iscReal();
  const rlv=EL('RL').value;
  const vRLth=vth*rlv/(rlv+rth);
  const vRLnorton=isc*(rth*rlv/(rth+rlv));
  const vRLfull=vRLIfConnected(rlv);
  QUIZ={
    explora:{
      pregunta:'¿Por qué hacen falta DOS mediciones (Voc e Isc) para caracterizar por completo una red de dos terminales, y no basta con una sola?',
      opciones:[
        {t:'Porque el equivalente de Thévenin tiene DOS parámetros independientes (Vth y Rth): Voc da directamente Vth, pero Rth solo se obtiene combinando Voc con Isc',ok:true,why:'Exacto: una sola medición (por ejemplo solo Voc) determina Vth, pero NO dice nada sobre la resistencia interna. Se necesita una segunda medición independiente (Isc) para despejar Rth = Voc/Isc.'},
        {t:'Porque Voc mide el voltaje y Isc mide la corriente, y son unidades distintas que no se pueden comparar',ok:false,why:'Sí se combinan: Rth=Voc/Isc tiene unidades de Ω, perfectamente válidas. El motivo real es que hacen falta DOS ecuaciones independientes para DOS incógnitas (Vth, Rth).'},
        {t:'No hacen falta las dos: con solo medir Isc ya se puede calcular Vth y Rth',ok:false,why:'Isc por sí sola solo da un punto de la relación V-I de la red; sin Voc (u otra medición independiente) no hay forma de despejar Rth.'},
        {t:'Se pide por seguridad, para verificar dos veces el mismo valor de Vth',ok:false,why:'Voc e Isc miden cosas distintas (circuito abierto vs. cortocircuito) — no son una repetición de la misma medición, son las dos ecuaciones necesarias para resolver el sistema.'},
      ],
    },
    carga:{
      pregunta:`Con RL=${fmtR(rlv)}, el equivalente de Thévenin predice V(RL)=${vRLth.toFixed(3)} V y la red completa (MNA) da V(RL)=${vRLfull.toFixed(3)} V. ¿Por qué coinciden exactamente?`,
      opciones:[
        {t:'Porque el teorema de Thévenin garantiza que, visto desde las terminales, el equivalente de dos parámetros predice EXACTO el comportamiento de la red original ante cualquier carga',ok:true,why:'Esa es la promesa central del teorema: no es una aproximación — el equivalente de Thévenin reproduce EXACTAMENTE el voltaje y la corriente en las terminales, para cualquier RL, mientras la red interna sea lineal.'},
        {t:'Coinciden solo por casualidad, con esta RL en particular',ok:false,why:'No es casualidad: prueba con cualquier otro valor de RL en el selector y la coincidencia se mantiene siempre — es una propiedad del teorema, no de este valor específico.'},
        {t:'Porque RL es igual a Rth en este caso',ok:false,why:`No es necesario que RL=Rth para que la predicción coincida (aquí RL=${fmtR(rlv)} y Rth=${fmtR(Math.round(rth))} no son iguales). El teorema vale para CUALQUIER RL.`},
        {t:'No coinciden realmente: la pequeña diferencia se debe a redondeo',ok:false,why:'La diferencia entre ambos valores es, dentro de la precisión de punto flotante, cero — no es un error de redondeo, es una igualdad matemática exacta.'},
      ],
    },
    norton:{
      pregunta:`El equivalente Norton (In=${fmtI(isc)}, Rn=${fmtR(Math.round(rth))}) predice V(RL)=${vRLnorton.toFixed(3)} V, idéntico al de Thévenin (${vRLth.toFixed(3)} V). ¿Qué relación hay SIEMPRE entre Rn y Rth?`,
      opciones:[
        {t:'Rn = Rth siempre — son la misma resistencia interna, solo cambia si se combina con una fuente de voltaje en serie (Thévenin) o de corriente en paralelo (Norton)',ok:true,why:'Correcto: Thévenin y Norton son dos representaciones del MISMO equivalente. La resistencia interna es una sola (Rth=Rn); lo que cambia es si la fuente ideal se coloca en serie (Vth) o en paralelo (In=Isc).'},
        {t:'Rn siempre es menor que Rth, porque está en paralelo con la fuente de corriente',ok:false,why:'No hay tal reducción: Rn y Rth son numéricamente el mismo valor. Estar "en paralelo" en el circuito Norton no cambia el valor de la resistencia, solo su rol topológico.'},
        {t:'Rn y Rth no tienen relación fija: dependen de qué carga RL se conecte',ok:false,why:'Rn=Rth es una propiedad de la red vista desde las terminales — no depende en absoluto de qué RL se conecte después.'},
        {t:'Rn = Rth solo cuando la red tiene una única fuente',ok:false,why:'La equivalencia Rn=Rth vale para cualquier red lineal de dos terminales, sin importar cuántas fuentes tenga por dentro.'},
      ],
    },
    reto:{
      pregunta:'¿Por qué basta con reportar el par (Vth, Rth) para predecir el comportamiento de la caja negra ante cualquier carga, sin conocer los componentes internos?',
      opciones:[
        {t:'Porque el teorema de Thévenin garantiza que toda red lineal de dos terminales es indistinguible, desde afuera, de una fuente ideal en serie con una resistencia — dos números bastan para reproducir su comportamiento completo',ok:true,why:'Ese es exactamente el punto del teorema: sin importar cuántos componentes haya adentro (una fuente y tres resistores, o cien), desde las dos terminales la red se comporta idéntico a (Vth, Rth). Dos parámetros capturan TODA la información relevante para cualquier carga externa.'},
        {t:'Porque todas las cajas negras tienen internamente la misma cantidad de componentes',ok:false,why:'No hace ninguna suposición sobre el número o tipo de componentes internos — el teorema vale igual si adentro hay 1 resistor o 50, siempre que la red sea lineal.'},
        {t:'No basta en realidad: hacen falta también los valores exactos de R1, R2 y R3 para predecir el comportamiento',ok:false,why:'Es precisamente lo que el teorema evita: (Vth, Rth) predicen el comportamiento en las terminales sin necesidad de conocer la topología ni los valores internos.'},
        {t:'Porque Vth y Rth son un promedio de todos los componentes internos',ok:false,why:'No son un promedio: son el resultado exacto de resolver la red completa vista desde las terminales (Vth=Voc, Rth=Voc/Isc), no una aproximación estadística.'},
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

// ============================== 13) PICKING Y HOVER ==============================
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return;
  if(hit.object===board&&hit.uv){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object;
  while(o){
    const u=o.userData||{};
    if(u.terminal){toastTerminal(u.terminal);return;}
    if(u.el){toastEl(u.el);return;}
    if(u.title){showToast(`<b style="color:var(--accent2)">${u.title}</b><br><span style="color:var(--dim);font-size:11px">${u.info}</span>`);return;}
    o=o.parent;
  }
});

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
        if(o.userData&&(o.userData.el||o.userData.title||o.userData.terminal||o===board))cursor='pointer';
        o=o.parent;
      }
      if(hits[0].object===board)cursor='pointer';
    }
    S.renderer.domElement.style.cursor=cursor;
  });
})();

// ============================== 14) RECORRIDO AUTOMÁTICO ==============================
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorrido guiado en curso…';
  try{
    synth.init();synth.resume();
    clearDx();
    setMode('explora');
    showToast('Paso 1 · Red visible: mide Voc e Isc en las terminales.');await sleep(1800);
    medirVoc();await sleep(1600);
    medirIsc();await sleep(1600);
    showToast(`Rth medida = ${rthReal().toFixed(1)} Ω vs. Rth teórica = ${rthTeorico().toFixed(1)} Ω <span style="color:var(--good)">✔ coinciden</span>`);await sleep(2600);
    setMode('carga');
    if(!EL('RL').on)toggleCarga();
    showToast(`Paso 2 · Con RL conectada, V(RL) predicho por Thévenin coincide EXACTO con la red completa: ${SOL.V[3].toFixed(3)} V.`);await sleep(3000);
    setMode('norton');
    showToast(`Paso 3 · Equivalente Norton: In=${fmtI(iscReal())}, Rn=${fmtR(Math.round(rthReal()))} — misma predicción que Thévenin.`);await sleep(3000);
    setMode('reto');
    showToast('Paso 4 · Caja negra real: mide Voc e Isc y reporta Vth y Rth.');await sleep(2200);
    medirVoc();await sleep(1400);
    medirIsc();await sleep(1400);
    el('inVth').value=vocReal().toFixed(3);
    el('inRth').value=Math.round(rthReal());
    checkReto();await sleep(2400);
    const q=QUIZ.reto,i=q.opciones.findIndex(o=>o.ok);
    clearDx();
    const dxBtn=el('dxbtns').children[i];
    if(dxBtn){dxBtn.classList.add('right');solved=true;synth.beep(1046,0.12,0.06);}
    showToast(`<span style="color:var(--good)">✔ ${q.opciones[i].t}</span><br><span style="color:var(--dim);font-size:11px">${q.opciones[i].why}</span>`);
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ============================== 15) ANIMACIÓN, EVENTOS E INICIO ==============================
S.setAnimate((dt,time)=>{
  const s=1+Math.sin(time*4)*0.18;
  Object.values(TP_GLOW).forEach(g=>g.scale.setScalar(s));
});

['explora','carga','norton','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newScenario;
el('btnCheck').onclick=checkReto;
el('btnVoc').onclick=medirVoc;
el('btnIsc').onclick=medirIsc;
['inVth','inRth'].forEach(id=>{
  el(id).addEventListener('input',onRetoInput);
  el(id).addEventListener('keydown',e=>{if(e.key==='Enter')checkReto();});
});
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊 Sonido':'🔇 Sonido';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

resolve();buildQuiz();refreshNet3D();
S.start();
setMode('explora');

window.__labDebug={
  net:()=>JSON.parse(JSON.stringify(NET)),
  sol:()=>({V:SOL.V.slice()}),
  solOpen:()=>({V:SOL_OPEN.V.slice()}),
  solShort:()=>({V:SOL_SHORT.V.slice(),srcI:SOL_SHORT.srcI.slice()}),
  vth:()=>vocReal(),
  rth:()=>rthReal(),
  isc:()=>iscReal(),
  boardClick,
  mode:()=>mode,
  retoSolved:()=>retoSolved,
  measured:()=>({voc:measuredVoc,isc:measuredIsc}),
};
