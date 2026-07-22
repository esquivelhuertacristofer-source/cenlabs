/*
 * Máxima Transferencia de Potencia — RL óptima, curva P(RL) y eficiencia
 * Motor: análisis nodal modificado (MNA) — Ho, Ruehli, Brennan (1975) — el mismo
 * de Kirchhoff (mecanica-13), divisores (mecanica-61) y Thévenin/Norton (mecanica-62),
 * extendido aquí con dos funciones de barrido: sobre la red completa (pFullAtRL) y
 * sobre el equivalente de Thévenin reducido (pReducedAtRL), para separar la potencia
 * entregada a RL de la potencia total entregada por la fuente.
 * Símbolos: IEC 60617. Bandas de color de resistores: IEC 60063 (serie E12).
 * Teorema: Hayt/Kemmerly/Durbin, Análisis de circuitos en ingeniería (McGraw-Hill).
 * Las tolerancias del modo Reto (±5 % relativas) son un margen PEDAGÓGICO de este
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
  {id:'RL',type:'R',a:3,b:0,value:2200,on:true},
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
function pFullAtRL(rlv){
  const net2=JSON.parse(JSON.stringify(NET));
  net2.elems.find(e=>e.id==='RL').value=rlv;
  net2.elems.find(e=>e.id==='RL').on=true;
  net2.elems.find(e=>e.id==='AMM').on=false;
  const s=solveMNA(net2);
  return (s.V[3]*s.V[3])/rlv;
}
function pReducedAtRL(rlv,vthV,rthV){
  const vth=vthV!==undefined?vthV:vocReal();
  const rth=rthV!==undefined?rthV:rthReal();
  const redNet={nodes:2,elems:[
    {id:'Vth',type:'V',a:1,b:0,value:vth},
    {id:'Rth',type:'R',a:1,b:2,value:rth},
    {id:'RL',type:'R',a:2,b:0,value:rlv},
  ]};
  const s=solveMNA(redNet);
  const pRL=(s.V[2]*s.V[2])/rlv;
  const pTotal=vth*Math.abs(s.srcI[0]);
  return {pRL,pTotal,eta:pTotal>0?pRL/pTotal:0};
}

const fmtR=v=>v>=1000?(((v/1000)%1)?(v/1000).toFixed(1):String(Math.round(v/1000)))+' kΩ':v+' Ω';
const fmtV=v=>(v%1?v.toFixed(1):String(v))+' V';
const fmtI=v=>{const m=v*1000;return(Math.abs(m%1)>1e-9?m.toFixed(1):String(Math.round(m)))+' mA';};
const BAND_COLORS=['#1a1a1a','#6b4226','#c73a3a','#d2691e','#e8c832','#3f8f3f','#2b5fb8','#7d3fc4','#8a8a8a','#e8e8e8'];
const BAND_NAMES=['negro','café','rojo','naranja','amarillo','verde','azul','violeta','gris','blanco'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1;const dd=Math.round(v/Math.pow(10,exp));return{d1:Math.floor(dd/10),d2:dd%10,mult:exp};}

// ============================== 3) ESTADO ==============================
let mode='explora'; // explora | eficiencia | reto
let selR1=1000,selR2=2200,selR3=470,selRL=2200;
let measuredVoc=false,measuredIsc=false;
let retoIdx=0,retoSolved=false,retoMsg='';
let solved=false,autoRunning=false,QUIZ={};
const R_CANDIDATES=[470,1000,2200,3300,4700,6800,10000];
const RL_CANDIDATES=[220,470,1000,2200,3300,4700,6800,10000,15000,22000];
const RETO_SCENARIOS=[
  {V:12,R1:2200,R2:4700,R3:330},
  {V:12,R1:1000,R2:1800,R3:220},
  {V:12,R1:4700,R2:1000,R3:1000},
  {V:12,R1:1500,R2:6800,R3:470},
  {V:12,R1:6800,R2:2200,R3:680},
  {V:12,R1:3300,R2:3300,R3:1000},
];

function numOr(id){const v=parseFloat((el(id).value||'').replace(',','.'));return isFinite(v)?v:NaN;}
function syncNet(){
  if(mode==='reto'){
    const sc=RETO_SCENARIOS[retoIdx];
    EL('V1').value=sc.V; EL('R1').value=sc.R1; EL('R2').value=sc.R2; EL('R3').value=sc.R3;
    EL('RL').on=false;
  }else{
    EL('V1').value=12; EL('R1').value=selR1; EL('R2').value=selR2; EL('R3').value=selR3; EL('RL').value=selRL;
    EL('RL').on=true;
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

// ============================== 5) PIZARRÓN (curvas P(RL) y eficiencia en canvas) ==============================
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
frame.userData={title:'Pizarrón de datos',info:'Curva viva de potencia y eficiencia, calculada punto por punto por el motor MNA. Toca el pizarrón o los componentes del banco para inspeccionarlos.'};
addHoverLabel(frame,'Curva viva · clic: pizarrón y componentes','#4FD1C5',new THREE.Vector3(0,1.65,0.3),1.0);

function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function earth(c,x,y){c.strokeStyle='#cfe8e2';c.lineWidth=3;line(c,x,y,x,y+14);[16,11,6].forEach((w,i)=>line(c,x-w,y+14+i*8,x+w,y+14+i*8));}
function nodeDot(c,x,y,big){c.fillStyle='#4FD1C5';c.beginPath();c.arc(x,y,big?6:4,0,7);c.fill();}
function chartFrame(c,title){
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  c.fillStyle='#8FB3AC';c.font='bold 20px Outfit, sans-serif';c.textAlign='left';
  c.fillText(title,26,44);
}
const CH={x0:130,x1:960,y0:650,y1:90};
function drawBoardCurva(){
  const c=bCv.getContext('2d');
  chartFrame(c,'CURVA DE POTENCIA P(RL) · barrido sobre la red completa (MNA)');
  const rth=rthReal(),vth=vocReal(),pmax=(vth*vth)/(4*rth);
  const rlv=EL('RL').value;
  const xMin=Math.min(rth/10,rlv*0.7), xMax=Math.max(rth*10,rlv*1.4);
  const {x0,x1,y0,y1}=CH;
  const xToPx=x=>x0+(Math.log10(x)-Math.log10(xMin))/(Math.log10(xMax)-Math.log10(xMin))*(x1-x0);
  const yMax=pmax*1.18;
  const yToPx=p=>y0-(p/yMax)*(y0-y1);
  c.strokeStyle='#3a4a46';c.lineWidth=2;
  line(c,x0,y0,x1,y0); line(c,x0,y0,x0,y1);
  c.strokeStyle='#4FD1C5';c.lineWidth=3;c.beginPath();
  const N=80;
  for(let i=0;i<=N;i++){
    const x=xMin*Math.pow(xMax/xMin,i/N);
    const p=pFullAtRL(x);
    const px=xToPx(x),py=yToPx(p);
    if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
  }
  c.stroke();
  const pxPeak=xToPx(rth),pyPeak=yToPx(pmax);
  c.strokeStyle='#FFB703';c.setLineDash([6,5]);c.lineWidth=2;
  line(c,pxPeak,y0,pxPeak,pyPeak); line(c,x0,pyPeak,pxPeak,pyPeak);
  c.setLineDash([]);
  c.fillStyle='#FFB703';c.beginPath();c.arc(pxPeak,pyPeak,7,0,7);c.fill();
  c.font='bold 15px Outfit, sans-serif';c.textAlign='center';
  c.fillText(`Pmáx=${(pmax*1000).toFixed(2)} mW en RL=Rth=${fmtR(Math.round(rth))}`,pxPeak,Math.max(pyPeak-16,26));
  const pSel=pFullAtRL(rlv);
  const pxSel=xToPx(rlv),pySel=yToPx(pSel);
  c.fillStyle='#f0a5a5';c.beginPath();c.arc(pxSel,pySel,7,0,7);c.fill();
  c.strokeStyle='#f0a5a5';c.lineWidth=2;c.beginPath();c.arc(pxSel,pySel,11,0,7);c.stroke();
  c.font='bold 14px Outfit, sans-serif';c.fillStyle='#f0a5a5';c.textAlign=(rlv<rth)?'right':'left';
  c.fillText(`RL=${fmtR(rlv)} · P=${(pSel*1000).toFixed(2)} mW`,pxSel+(rlv<rth?-14:14),Math.min(pySel+24,y0-8));
  c.fillStyle='#5a6b66';c.font='12px Outfit, sans-serif';c.textAlign='center';
  [rth/10,rth,rth*10].forEach(xv=>c.fillText(fmtR(Math.round(xv)),xToPx(xv),y0+20));
  c.textAlign='right';c.fillText('0',x0-10,y0+4);c.fillText((pmax*1000).toFixed(1),x0-10,yToPx(pmax)+4);
  c.fillStyle='#8FB3AC';c.font='14px Outfit, sans-serif';c.textAlign='center';
  c.fillText('RL (Ω, escala log)',(x0+x1)/2,700);
  c.save();c.translate(48,(y0+y1)/2);c.rotate(-Math.PI/2);c.fillText('P entregada a RL (mW)',0,0);c.restore();
  bTex.needsUpdate=true;
}
function drawBoardEficiencia(){
  const c=bCv.getContext('2d');
  chartFrame(c,'POTENCIA NORMALIZADA Y EFICIENCIA vs. RL (equivalente de Thévenin)');
  const vth=vocReal(),rth=rthReal(),pmax=(vth*vth)/(4*rth);
  const rlv=EL('RL').value;
  const xMin=Math.min(rth/10,rlv*0.7), xMax=Math.max(rth*10,rlv*1.4);
  const {x0,x1,y0,y1}=CH;
  const xToPx=x=>x0+(Math.log10(x)-Math.log10(xMin))/(Math.log10(xMax)-Math.log10(xMin))*(x1-x0);
  const yToPx=frac=>y0-frac*(y0-y1);
  c.strokeStyle='#3a4a46';c.lineWidth=2;
  line(c,x0,y0,x1,y0); line(c,x0,y0,x0,y1);
  const N=80;
  c.strokeStyle='#4FD1C5';c.lineWidth=3;c.beginPath();
  for(let i=0;i<=N;i++){
    const x=xMin*Math.pow(xMax/xMin,i/N);
    const {pRL}=pReducedAtRL(x,vth,rth);
    const px=xToPx(x),py=yToPx(pRL/pmax);
    if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
  }
  c.stroke();
  c.strokeStyle='#FFB703';c.lineWidth=3;c.beginPath();
  for(let i=0;i<=N;i++){
    const x=xMin*Math.pow(xMax/xMin,i/N);
    const {eta}=pReducedAtRL(x,vth,rth);
    const px=xToPx(x),py=yToPx(eta);
    if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
  }
  c.stroke();
  c.strokeStyle='#5a6b66';c.setLineDash([4,4]);c.lineWidth=1.5;
  line(c,x0,yToPx(0.5),x1,yToPx(0.5));
  c.setLineDash([]);
  const pxRth=xToPx(rth);
  c.strokeStyle='#f0a5a5';c.setLineDash([6,5]);
  line(c,pxRth,y0,pxRth,y1);
  c.setLineDash([]);
  c.fillStyle='#f0a5a5';c.font='bold 14px Outfit, sans-serif';c.textAlign='center';
  c.fillText('RL=Rth · p=1.0 · η=50 %',pxRth,y1-8);
  const sel=pReducedAtRL(rlv,vth,rth);
  const pxSel=xToPx(rlv);
  c.fillStyle='#4FD1C5';c.beginPath();c.arc(pxSel,yToPx(sel.pRL/pmax),6,0,7);c.fill();
  c.fillStyle='#FFB703';c.beginPath();c.arc(pxSel,yToPx(sel.eta),6,0,7);c.fill();
  c.textAlign='left';c.font='13px Outfit, sans-serif';
  c.fillStyle='#4FD1C5';c.fillText('● P(RL)/Pmáx (potencia normalizada)',150,120);
  c.fillStyle='#FFB703';c.fillText('● η = P(RL)/P(total) (eficiencia)',150,142);
  c.fillStyle='#5a6b66';c.font='12px Outfit, sans-serif';c.textAlign='center';
  [rth/10,rth,rth*10].forEach(xv=>c.fillText(fmtR(Math.round(xv)),xToPx(xv),y0+20));
  c.textAlign='right';c.fillText('0',x0-10,y0+4);c.fillText('1.0',x0-10,y1+4);
  c.fillStyle='#8FB3AC';c.font='14px Outfit, sans-serif';c.textAlign='center';
  c.fillText('RL (Ω, escala log)',(x0+x1)/2,700);
  c.save();c.translate(48,(y0+y1)/2);c.rotate(-Math.PI/2);c.fillText('fracción (0–1)',0,0);c.restore();
  bTex.needsUpdate=true;
}
function drawBoardCaja(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('CAJA NEGRA · caracterización experimental',26,44);
  c.fillStyle='#FFB703';c.textAlign='right';c.fillText('🎯 mide y predice RLopt, Pmáx',998,44);
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
function drawBoard(){if(mode==='eficiencia')drawBoardEficiencia();else if(mode==='reto')drawBoardCaja();else drawBoardCurva();}

const HIT_CAJA=[{x:180,y:300,r:50,term:'A'},{x:180,y:480,r:50,term:'B'}];
function boardClick(u,v){
  if(mode==='reto'){
    const x=u*1024,y=(1-v)*768;
    let best=null,bd=1e9;
    HIT_CAJA.forEach(h=>{const d=Math.hypot(x-h.x,y-h.y);if(d<h.r&&d<bd){bd=d;best=h;}});
    if(best)toastTerminal(best.term);
    return;
  }
  showToast(mode==='eficiencia'
    ? 'La curva turquesa es la potencia entregada normalizada P(RL)/Pmáx; la curva ámbar es la eficiencia η. Ambas cruzan sus valores de referencia (1.0 y 50 %) exactamente en RL=Rth.'
    : 'Curva de potencia P(RL): el punto ámbar marca el pico teórico en RL=Rth; el punto rosa marca la RL que elegiste con los selectores.');
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
  <div class="eyebrow">Circuitos eléctricos · Optimización de carga (D1)</div>
  <h2>Máxima Transferencia de Potencia</h2>
  <p>Una fuente con resistencia interna Rth entrega su MÁXIMA potencia a una carga RL exactamente
  cuando <b>RL = Rth</b> — ni con una carga muy pequeña ni muy grande. Este banco reutiliza el mismo
  motor de <b>análisis nodal modificado (MNA)</b> y el amperímetro ideal de tu laboratorio de
  Thévenin/Norton para trazar en vivo la curva P(RL), comparar potencia contra eficiencia, y
  caracterizar por último una caja negra real prediciendo el RL óptimo sin ver los componentes
  internos.</p>
  <div class="formula">P(RL) = Vth²·RL/(RL+Rth)² · Pmáx = Vth²/(4·Rth) en RL=Rth · η = RL/(RL+Rth)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Potencia entregada a RL</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Pico teórico / eficiencia</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>RL elegida / fuente</div>
    <div class="li"><span class="dot" style="background:#8a9299"></span>Referencia (Terminal B · 0 V)</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> red resistiva de dos terminales resuelta en vivo por análisis nodal modificado (MNA); curva de potencia P(RL) calculada punto por punto sobre la red completa; equivalente de Thévenin reducido (Vth,Rth) usado para separar la potencia entregada a la carga de la potencia total de la fuente; caracterización experimental de una caja negra real por el método Voc/Isc.</div>
    <div class="fl no"><b>NO modela:</b> redes con múltiples fuentes o elementos no lineales, componentes reactivos ni CA — es un circuito resistivo de CD de parámetros concentrados. Las tolerancias del reto (±5 % relativas) son un margen PEDAGÓGICO de este ejercicio, no una especificación de fabricante ni de instrumento real.</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · IEC 60617 · IEC 60063 · MNA (Ho/Ruehli/Brennan, 1975)</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Máxima Transferencia · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">📈 Explora</button>
    <button class="b" id="m_eficiencia">⚖️ Eficiencia</button>
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
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inRLopt">RLopt =</label><input id="inRLopt" inputmode="decimal" autocomplete="off" style="width:72px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>Ω</span></span>
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inPmax">Pmáx =</label><input id="inPmax" inputmode="decimal" autocomplete="off" style="width:72px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>mW</span></span>
    </div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar predicción</button></div>
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
  const on=e.on!==false;
  const i=on?iThru(e):0;
  const b=bandsFor(e.value);
  const bandas=`${BAND_NAMES[b.d1]}-${BAND_NAMES[b.d2]}-${BAND_NAMES[b.mult]}-oro`;
  const info=on?`Bandas: ${bandas}. I = ${fmtI(Math.abs(i))}.`:`Bandas: ${bandas}. Sin conectar en este modo: I = 0 mA.`;
  showToast(`<b style="color:var(--accent2)">${id} · ${fmtR(e.value)}${on?'':' · sin conectar'}</b><br><span style="color:var(--dim);font-size:11px">${info}</span>`);
}
function toastTerminal(term){
  if(term==='A'){
    showToast(`<b style="color:var(--accent2)">Terminal A</b><br><span style="color:var(--dim);font-size:11px">Terminal de salida de la red. Aquí se conecta la carga RL o el instrumento de medición (voltímetro para Voc, amperímetro para Isc).</span>`);
  }else{
    showToast(`<b style="color:var(--accent2)">Terminal B · 0 V</b><br><span style="color:var(--dim);font-size:11px">Terminal de referencia (tierra) de la red. Toda medición se hace entre A y B.</span>`);
  }
}

// ============================== 9) MODOS ==============================
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.1,2.5,7.2],[0.5,1.3,0.1]],mision:'Barre distintos valores de RL sobre la red completa y verifica que el pico de P(RL) coincide con RL=Rth.'},
  eficiencia:{nombre:'Eficiencia',cam:[[-0.1,2.2,4.3],[-0.9,1.75,-0.8]],mision:'Compara la potencia entregada a RL contra la potencia total de la fuente — confirma η=50 % exactamente en el pico de potencia.'},
  reto:{nombre:'Reto',cam:[[0.6,2.3,5.6],[0.2,1.3,0.2]],mision:'Caja negra real: mide Voc e Isc y predice el RL óptimo y la potencia máxima transferible.'},
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
    bar.innerHTML=selHtml('selR1','R1',R_CANDIDATES,fmtR)+selHtml('selR2','R2',R_CANDIDATES,fmtR)+selHtml('selR3','R3',R_CANDIDATES,fmtR)+selHtml('selRL','RL',RL_CANDIDATES,fmtR);
    wireSel('selR1',v=>{selR1=v;afterEdit();});
    wireSel('selR2',v=>{selR2=v;afterEdit();});
    wireSel('selR3',v=>{selR3=v;afterEdit();});
    wireSel('selRL',v=>{selRL=v;afterEdit();});
  }else if(mode==='eficiencia'){
    bar.style.display='';
    bar.innerHTML=selHtml('selRL','RL',RL_CANDIDATES,fmtR);
    wireSel('selRL',v=>{selRL=v;afterEdit();});
  }else{
    bar.style.display='none';bar.innerHTML='';
  }
}
function setMode(k){
  mode=k;
  measuredVoc=false;measuredIsc=false;
  ['explora','eficiencia','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  buildSelBar();
  const reto=k==='reto';
  el('retoTitle').style.display=reto?'':'none';
  el('retoBox').style.display=reto?'':'none';
  el('medirBox').style.display=reto?'':'none';
  if(reto)updateRetoSpec();
  solved=false;clearDx();
  resolve();buildQuiz();refreshQuestion();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  refreshAll();
}
function afterEdit(){measuredVoc=false;measuredIsc=false;resolve();buildQuiz();solved=false;clearDx();refreshQuestion();refreshAll();}

// ============================== 10) TELEMETRÍA Y REPORTE ==============================
function teleRow(l,v,cls){return `<div class="g"><div class="l">${l}</div><b class="${cls||''}">${v}</b></div>`;}
function updateTele(){
  const t=el('tele');
  if(mode==='explora'){
    const rth=rthReal(),vth=vocReal(),pmax=(vth*vth)/(4*rth);
    const rlv=EL('RL').value,pSel=pFullAtRL(rlv);
    const atPeak=Math.abs(rlv-rth)<1;
    t.innerHTML=
      teleRow('V1',fmtV(EL('V1').value))+
      teleRow('R1',fmtR(EL('R1').value))+
      teleRow('R2',fmtR(EL('R2').value))+
      teleRow('R3',fmtR(EL('R3').value))+
      teleRow('Vth (Voc)',vth.toFixed(3)+' V')+
      teleRow('Rth',fmtR(Math.round(rth)))+
      teleRow('Pmáx = Vth²/(4·Rth)',(pmax*1000).toFixed(2)+' mW')+
      teleRow('RL elegida',fmtR(rlv))+
      teleRow('P(RL) elegida',(pSel*1000).toFixed(2)+' mW',atPeak?'good':'')+
      teleRow('Estado',atPeak?'✔ RL≈Rth · cerca del pico':'Prueba RL=Rth='+fmtR(Math.round(rth))+' para el pico','warn');
  }else if(mode==='eficiencia'){
    const vth=vocReal(),rth=rthReal();
    const rlv=EL('RL').value;
    const {pRL,pTotal,eta}=pReducedAtRL(rlv,vth,rth);
    const atPeak=Math.abs(rlv-rth)<1;
    t.innerHTML=
      teleRow('Vth',vth.toFixed(3)+' V')+
      teleRow('Rth',fmtR(Math.round(rth)))+
      teleRow('RL',fmtR(rlv))+
      teleRow('P(RL) — a la carga',(pRL*1000).toFixed(2)+' mW')+
      teleRow('P(total) — de la fuente',(pTotal*1000).toFixed(2)+' mW')+
      teleRow('η = P(RL)/P(total)',(eta*100).toFixed(1)+' %',atPeak?'good':'')+
      teleRow('Estado',atPeak?'✔ En el pico: η=50 % exacto':'Prueba RL=Rth para ver η=50 %','warn');
  }else{
    const gated=measuredVoc&&measuredIsc;
    t.innerHTML=
      teleRow('Voc (Vth)',measuredVoc?vocReal().toFixed(3)+' V':'🔒 sin medir',measuredVoc?'good':'warn')+
      teleRow('Isc',measuredIsc?(iscReal()*1000).toFixed(3)+' mA':'🔒 sin medir',measuredIsc?'good':'warn')+
      teleRow('Tu RLopt',(el('inRLopt')&&el('inRLopt').value)?el('inRLopt').value+' Ω':'—')+
      teleRow('Tu Pmáx',(el('inPmax')&&el('inPmax').value)?el('inPmax').value+' mW':'—')+
      teleRow('Estado',retoSolved?'✔ PREDICCIÓN VALIDADA':(gated?'Escribe RLopt y Pmáx':'Mide Voc e Isc'),retoSolved?'good':'warn');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='explora'){
    const rth=rthReal(),vth=vocReal(),pmax=(vth*vth)/(4*rth);
    const rlv=EL('RL').value,pSel=pFullAtRL(rlv);
    html+=`<span class="mono">Vth=${vth.toFixed(3)} V · Rth=${rth.toFixed(1)} Ω → Pmáx=Vth²/(4·Rth)=${(pmax*1000).toFixed(2)} mW en RL=Rth</span><br>`+
      `<span class="mono">Con RL=${fmtR(rlv)} (red completa, MNA): P(RL)=${(pSel*1000).toFixed(2)} mW ${rlv<rth?'— RL&lt;Rth: corriente alta pero voltaje bajo sobre la carga':(rlv>rth?'— RL&gt;Rth: voltaje alto pero corriente baja':'— exactamente en el pico')}</span>`;
  }else if(mode==='eficiencia'){
    const vth=vocReal(),rth=rthReal();
    const rlv=EL('RL').value;
    const {pRL,pTotal,eta}=pReducedAtRL(rlv,vth,rth);
    html+=`<span class="mono">P(RL)=${(pRL*1000).toFixed(2)} mW de P(total)=${(pTotal*1000).toFixed(2)} mW → η=${(eta*100).toFixed(1)} %</span><br>`+
      `<span class="mono">η teórica = RL/(RL+Rth) = ${fmtR(rlv)}/(${fmtR(rlv)}+${rth.toFixed(1)} Ω) = ${(rlv/(rlv+rth)*100).toFixed(1)} % <span class="ok">✔ coincide</span></span>`;
  }else{
    html+=retoMsg||`<span class="mono">Caja negra sellada. Mide Voc e Isc, calcula Vth=Voc y Rth=Voc/Isc, y predice RLopt=Rth y Pmáx=Vth²/(4·Rth).</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();refreshNet3D();}

// ============================== 11) RETO ==============================
function medirVoc(){measuredVoc=true;synth.beep(660,0.08,0.05);refreshAll();showToast(`Medida: Voc = ${vocReal().toFixed(3)} V (terminales en circuito abierto).`);}
function medirIsc(){measuredIsc=true;synth.beep(760,0.08,0.05);refreshAll();showToast(`Medida: Isc = ${(iscReal()*1000).toFixed(3)} mA (terminales en cortocircuito, vía amperímetro ideal).`);}
function checkReto(){
  if(!(measuredVoc&&measuredIsc)){showToast('Primero mide Voc e Isc.');return;}
  const rlGuess=numOr('inRLopt'),pGuess=numOr('inPmax');
  if(!isFinite(rlGuess)||!isFinite(pGuess)){showToast('Escribe RLopt (Ω) y Pmáx (mW).');return;}
  const vocR=vocReal(),iscR=iscReal(),rthR=vocR/iscR;
  const pmaxR_mW=(vocR*vocR)/(4*rthR)*1000;
  const tolRL=Math.max(15,rthR*0.05),tolP=Math.max(0.05,pmaxR_mW*0.05);
  const okRL=Math.abs(rlGuess-rthR)<=tolRL, okP=Math.abs(pGuess-pmaxR_mW)<=tolP;
  if(okRL&&okP){
    retoSolved=true;synth.beep(1046,0.12,0.06);
    retoMsg=`<span class="mono"><span class="ok">✔ Predicción correcta.</span> RLopt=${rlGuess} Ω y Pmáx=${pGuess} mW están dentro de tolerancia (±${tolRL.toFixed(1)} Ω, ±${tolP.toFixed(3)} mW).</span>`;
  }else{
    synth.beep(220,0.15,0.06);
    retoMsg=`<span class="mono"><span class="dtc">✗ Aún no.</span> RLopt ${okRL?'✓ dentro de tolerancia':'✗ fuera de tolerancia'} · Pmáx ${okP?'✓ dentro de tolerancia':'✗ fuera de tolerancia'}. Vuelve a medir Voc/Isc con cuidado y recalcula RLopt=Rth=Voc/Isc, Pmáx=Vth²/(4·Rth).</span>`;
  }
  resolve();refreshAll();
}
function updateRetoSpec(){
  el('retoSpec').innerHTML=`Caja negra sellada con dos terminales (A, B). Usa <b>"Medir Voc"</b> y <b>"Medir Isc"</b>, calcula Rth=Voc/Isc (= RLopt) y Pmáx=Vth²/(4·Rth), y repórtalos.<br><span style="color:var(--dim)">Las tolerancias (±5 % relativas) son un margen pedagógico de este ejercicio, no una especificación de fabricante.</span>`;
}
function newScenario(){
  const pick=()=>Math.floor(Math.random()*RETO_SCENARIOS.length);
  let idx=pick();
  if(RETO_SCENARIOS.length>1)while(idx===retoIdx)idx=pick();
  retoIdx=idx;retoSolved=false;retoMsg='';measuredVoc=false;measuredIsc=false;
  el('inRLopt').value='';el('inPmax').value='';
  if(mode!=='reto'){setMode('reto');}
  else{updateRetoSpec();resolve();buildQuiz();solved=false;clearDx();refreshQuestion();refreshAll();}
  showToast('🔀 <b>Nueva caja negra.</b> Vuelve a medir Voc e Isc desde cero.');
  synth.beep(520,0.08,0.05);
}
function onRetoInput(){if(mode!=='reto')return;retoSolved=false;retoMsg='';refreshAll();}

// ============================== 12) QUIZ ==============================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Por qué la curva P(RL) tiene un ÚNICO máximo en vez de crecer sin límite o ser máxima con RL muy pequeña?',
      opciones:[
        {t:'Porque P=I²RL→0 cuando RL→0 (I es grande pero V(RL) es cero) y P=V(RL)²/RL→0 cuando RL→∞ (V(RL) es grande pero I es casi cero); en un punto intermedio, RL=Rth, ambos efectos se equilibran y P es máxima',ok:true,why:'Exacto: los dos límites extremos hacen que la potencia caiga a cero por razones distintas (voltaje nulo vs. corriente nula). Entre ambos hay un único máximo, y se demuestra por cálculo (dP/dRL=0) que ocurre en RL=Rth.'},
        {t:'Porque RL muy grande sobrecalienta la fuente y el simulador la apaga',ok:false,why:'El modelo no incluye protección térmica ni fuentes que se apaguen — la curva cae a cero por pura relación V-I-R, no por un límite de seguridad.'},
        {t:'La potencia SÍ crece sin límite con RL — lo que se observa en la curva es solo un artefacto de la escala logarítmica del eje',ok:false,why:'No es un artefacto de escala: P(RL) realmente vuelve a caer hacia cero conforme RL crece, incluso medida en escala lineal — es una propiedad física de la red, no visual.'},
        {t:'Porque Rth es siempre igual a RL por definición del circuito',ok:false,why:'Rth es una propiedad fija de la red (no depende de qué RL elijas); lo interesante es precisamente que el MÁXIMO ocurre solo cuando tú, al elegir RL, la haces coincidir con Rth.'},
      ],
    },
    eficiencia:{
      pregunta:'En RL=Rth (máxima potencia), la eficiencia η es exactamente 50 %. ¿Qué tendrías que hacer para lograr una eficiencia MAYOR al 50 %, y qué le pasaría a la potencia entregada?',
      opciones:[
        {t:'Usar una RL mayor que Rth: la eficiencia sube (η=RL/(RL+Rth)→1 cuando RL→∞) pero la potencia entregada a la carga BAJA respecto al máximo — maximizar potencia y maximizar eficiencia son objetivos distintos',ok:true,why:'Correcto: con RL>Rth, la corriente cae más rápido de lo que sube el voltaje sobre la carga, así que P(RL) baja respecto al pico — pero como se disipa proporcionalmente menos en Rth, η sube. Es un intercambio (trade-off) real de diseño.'},
        {t:'Usar una RL menor que Rth: tanto la potencia como la eficiencia suben juntas',ok:false,why:'Con RL<Rth ocurre lo contrario: la eficiencia BAJA (más corriente se disipa en Rth relativo a RL) y la potencia entregada también cae respecto al pico en RL=Rth.'},
        {t:'Es imposible superar el 50 % de eficiencia en cualquier circuito resistivo',ok:false,why:'Sí es posible: η=RL/(RL+Rth) puede acercarse a 100 % con RL suficientemente grande — el costo es que la potencia ENTREGADA (no la eficiencia) se aleja de su máximo.'},
        {t:'Aumentando el voltaje de la fuente V1 se sube la eficiencia sin afectar la potencia',ok:false,why:'η=RL/(RL+Rth) no depende del voltaje de la fuente en absoluto — depende solo de la razón entre RL y Rth. Cambiar V1 escala P(RL) pero no cambia η.'},
      ],
    },
    reto:{
      pregunta:'Sin ver los componentes internos de la caja negra, ¿por qué basta con medir Voc e Isc para predecir el RL que maximiza la potencia entregada?',
      opciones:[
        {t:'Porque Voc=Vth y Rth=Voc/Isc son los ÚNICOS dos parámetros que definen por completo el comportamiento de la red vista desde las terminales — y la condición de máxima transferencia (RL=Rth) depende solo de Rth, no de la topología interna',ok:true,why:'Exacto: el teorema de Thévenin garantiza que (Vth,Rth) capturan toda la información relevante de la red externa. Como RLopt=Rth y Pmáx=Vth²/(4·Rth) son fórmulas que solo usan esos dos números, no hace falta conocer cuántos resistores hay adentro ni cómo están conectados.'},
        {t:'No basta en realidad: hace falta conocer también los valores de R1, R2 y R3 para predecir RLopt',ok:false,why:'Es precisamente lo que el método experimental evita: RLopt=Rth se obtiene de Voc/Isc sin necesidad de conocer ni un solo componente interno.'},
        {t:'Porque Isc por sí sola ya determina RLopt, sin necesidad de medir Voc',ok:false,why:'Isc solo da un punto de la relación V-I; Rth=Voc/Isc necesita las DOS mediciones — con solo Isc no hay forma de despejar Rth.'},
        {t:'Porque todas las cajas negras de este laboratorio tienen la misma Rth por diseño',ok:false,why:'Cada escenario del reto usa valores distintos de R1/R2/R3 — Rth cambia de una caja negra a otra; por eso hay que remedirla cada vez, no se puede memorizar un solo valor.'},
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
    showToast('Paso 1 · Barre distintos RL y observa cómo se dobla la curva P(RL) alrededor de su pico.');await sleep(1800);
    const rthNow=rthReal();
    const closest=RL_CANDIDATES.reduce((a,b)=>Math.abs(b-rthNow)<Math.abs(a-rthNow)?b:a);
    selRL=closest;afterEdit();
    showToast(`RL=${fmtR(closest)} (el valor más cercano a Rth=${fmtR(Math.round(rthNow))} en el selector) <span style="color:var(--good)">✔ cerca del pico</span>`);await sleep(2600);
    setMode('eficiencia');
    showToast('Paso 2 · En el pico de potencia, la eficiencia es exactamente 50 %: la mitad de la energía se pierde en Rth.');await sleep(3000);
    setMode('reto');
    showToast('Paso 3 · Caja negra real: mide Voc e Isc y predice RLopt y Pmáx.');await sleep(2200);
    medirVoc();await sleep(1400);
    medirIsc();await sleep(1400);
    const vocR=vocReal(),iscR=iscReal(),rthR=vocR/iscR;
    el('inRLopt').value=Math.round(rthR);
    el('inPmax').value=((vocR*vocR)/(4*rthR)*1000).toFixed(2);
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

['explora','eficiencia','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newScenario;
el('btnCheck').onclick=checkReto;
el('btnVoc').onclick=medirVoc;
el('btnIsc').onclick=medirIsc;
['inRLopt','inPmax'].forEach(id=>{
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
  pmax:()=>(vocReal()*vocReal())/(4*rthReal()),
  pAtRL:rlv=>pFullAtRL(rlv),
  pReducedAtRL:rlv=>pReducedAtRL(rlv),
  boardClick,
  mode:()=>mode,
  retoSolved:()=>retoSolved,
  measured:()=>({voc:measuredVoc,isc:measuredIsc}),
};
