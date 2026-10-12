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
const S=createStage(mount,{cam:[0,4.3,6.9],target:[0,1.15,0.5],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
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
let intentos=0,resiembras=0;const FALLOS_MAX=3;   // fallos de la caja negra actual; a los 3 se cambia
let solved=false,autoRunning=false,QUIZ={};
const R_CANDIDATES=[470,1000,2200,3300,4700,6800,10000];
const RL_CANDIDATES=[220,470,1000,2200,3300,4700,6800,10000,15000,22000];
const RETO_SCENARIOS=[
  {V:12,R1:2200,R2:4700,R3:330},
  {V:12,R1:1000,R2:1800,R3:220},
  {V:12,R1:4700,R2:1000,R3:1200},
  {V:12,R1:1500,R2:6800,R3:470},
  {V:12,R1:6800,R2:2200,R3:680},
  {V:12,R1:3300,R2:3300,R3:1200},
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
const boardG=new THREE.Group();boardG.position.set(0,2.3-1.85*0.77,-1.55);boardG.scale.setScalar(0.77);scene.add(boardG);
const frame=sh(roundedBox(3.62,2.77,0.12,MAT.frame,0.03));frame.position.set(0,1.85,0);boardG.add(frame);
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
/* El pizarrón (esquema) va arriba y al fondo; debajo, el montaje REAL sobre un
   protoboard: la fuente en el estante y, cableados a mano, R1, R2, R3 y la
   carga RL con las dos bornas A y B de la red de dos terminales. En el reto,
   la fuente y R1…R3 desaparecen dentro de una caja negra. */
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
const BANCO=P3.bancoPrototipos(MATP,{cols:22,K:1.45,instrumentos:1});
const prot=BANCO.userData.prot,circG=BANCO.userData.circ,H=BANCO.userData.H,KB=BANCO.userData.K;
const railNear=BANCO.userData.rielCerca;
prot.userData.title='Protoboard';prot.userData.info='Placa de pruebas sin soldadura: las cinco posiciones de cada columna están unidas por dentro; los rieles + y − llevan la alimentación a todo lo largo.';
const fuenteBox=BANCO.userData.instrumento(0);
fuenteBox.g.position.x=-1.65;   // a la izquierda, sobre sus rieles: los cables no cruzan el visor
fuenteBox.g.userData.el='V1';
addHoverLabel(fuenteBox.g,'Fuente V1','#f0a5a5',new THREE.Vector3(0,0.45,0),0.75);
const cableMat={rojo:0xd64545,negro:0x1b1f24,azul:0x2a5fa8,amarillo:0xe0a21c,verde:0x2f9e5b,naranja:0xe07b22};
function rotula(obj,txt,col,y){addHoverLabel(obj,txt,col,new THREE.Vector3(0,y,0),0.5/KB);}
function tintaPlano(w,h,pinta,pw,ph){
  const cv=document.createElement('canvas');cv.width=pw;cv.height=ph;
  pinta(cv.getContext('2d'),pw,ph);
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tx,transparent:true,roughness:0.55,
    depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  m.renderOrder=2;return m;
}

/* LAS BORNAS A y B de la red, que son lo único que el alumno puede tocar: una
   borna de 4 mm grande sobre un zócalo de su color, con la letra serigrafiada
   en la placa. `glow` es el halo que pulsa cuando se mide en ella. */
function bornaRed(term,color,colorHex){
  const g=new THREE.Group();
  const zoc=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.14,0.06,20),std({color:0x1b2420,roughness:0.7}));
  zoc.position.y=0.03;g.add(zoc);
  const b=P3.bornaBanana(MATP,{d:0.18,alto:0.12,color});
  b.position.y=0.06;g.add(b);
  const glow=new THREE.Mesh(new THREE.TorusGeometry(0.135,0.008,8,28),new THREE.MeshBasicMaterial({color:colorHex,transparent:true,opacity:0.6,toneMapped:false}));
  glow.rotation.x=Math.PI/2;glow.position.y=0.07;glow.raycast=()=>{};g.add(glow);
  TP_GLOW[term]=glow;
  const letra=tintaPlano(0.22,0.22,(c,w,h)=>{c.fillStyle='#4a463c';c.font='bold 200px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(term,w/2,h/2);},256,256);
  letra.rotation.x=-Math.PI/2;letra.position.set(0,0.004,0.22);g.add(letra);
  g.userData.terminal=term;
  rotula(g,term==='A'?'Terminal A':'Terminal B · 0 V','#4FD1C5',0.55);
  return g;
}
const TP_GLOW={};

/* La CAJA NEGRA del reto: un bloque de resina que se traga la fuente y los tres
   resistores. Sólo se ve lo que sale de ella: dos cables hacia A y B. */
function cajaNegra(x0,x1){
  const g=new THREE.Group();
  const cv=document.createElement('canvas');cv.width=768;cv.height=384;
  const c=cv.getContext('2d');
  c.fillStyle='#1a2320';c.fillRect(0,0,768,384);
  c.strokeStyle='#8a6a2f';c.lineWidth=8;c.strokeRect(10,10,748,364);
  c.fillStyle='#b99a63';c.textAlign='center';c.font='bold 100px sans-serif';c.fillText('CAJA NEGRA',384,170);
  c.font='46px sans-serif';c.fillStyle='#9a8256';c.fillText('V  +  R  sellados · mide en A y B',384,262);
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.anisotropy=8;
  const w=x1-x0;
  const cuerpo=new THREE.Mesh(new THREE.BoxGeometry(w,0.34,1.10),
    [MAT.caja,MAT.caja,std({map:tx,roughness:0.6}),MAT.caja,MAT.caja,MAT.caja]);
  cuerpo.position.set((x0+x1)/2,0.17,0);g.add(cuerpo);
  return g;
}

/* LA ZONA DE MONTAJE. La red se rehace al entrar o salir del reto; los valores
   de los resistores sólo repintan sus bandas. */
const RG={};let boxG=null,gndRL=null,circKey='';
function armaCircuito(){
  const reto=mode==='reto';
  const key=reto?'reto':'red';
  if(key===circKey)return;
  circKey=key;
  BANCO.userData.limpia();BANCO.userData.reiniciaRieles();
  for(const k in RG)delete RG[k];
  boxG=null;gndRL=null;
  function wire(a,b,col,o){const w=P3.puente(MATP,a,b,Object.assign({color:col},o||{}));circG.add(w);return w;}
  function res(id,c1,f1,c2,f2){
    const g=P3.resistorAxial(MATP,{ohm:EL(id).value,paso:Math.abs(c2-c1)*0.1});
    const A=H(c1,f1),B=H(c2,f2);g.position.copy(A).lerp(B,0.5);g.position.y=A.y;
    g.userData.el=id;circG.add(g);rotula(g,id,'#4FD1C5',0.30);RG[id]=g;return g;
  }
  // La carga RL (siempre sobre la placa; sólo cuenta cuando su pata va a tierra)
  res('RL',11,'a',16,'a');
  if(!reto){
    res('R1',2,'c',6,'c');
    wire(H(2,'e'),railNear('+',2),cableMat.rojo);
    res('R2',6,'h',10,'h');
    wire(H(6,'e'),H(6,'f'),cableMat.azul,{minAlto:0.18,alto:0.2});
    wire(H(10,'j'),railNear('-',10),cableMat.negro);
    res('R3',6,'b',11,'b');
    BANCO.userData.cable(0,0,railNear('+',1),cableMat.rojo,{alto:0.09});
    BANCO.userData.cable(0,1,railNear('-',2),cableMat.negro,{alto:0.09});
  }else{
    boxG=cajaNegra(H(2,'e').x-0.15,H(8,'e').x+0.15);
    boxG.position.set(0,H(2,'e').y,(H(2,'e').z+H(2,'j').z)/2);
    boxG.userData.title='Caja negra';
    boxG.userData.info='Sella la fuente y los tres resistores internos. Solo puedes medir desde las terminales A y B — usa "Medir Voc" y "Medir Isc".';
    circG.add(boxG);
    wire(H(8,'e').clone().add(new THREE.Vector3(0.15,0,0)),H(11,'e'),cableMat.naranja,{minAlto:0.12,alto:0.2,pinA:false});
    wire(H(8,'a').clone().add(new THREE.Vector3(0.15,0,0)),railNear('-',10),cableMat.negro,{minAlto:0.12,alto:0.2,pinA:false});
  }
  // la tierra de la carga: sin esta pata a masa, RL está desconectada
  gndRL=wire(H(16,'e'),railNear('-',16),cableMat.verde);
  gndRL.userData.title='Conexión de RL a tierra';
  gndRL.userData.info='La carga RL sólo cierra el circuito entre A y B cuando esta pata está a tierra.';
  // las bornas de la red: A (rojo) en la columna de salida, B (negro) a tierra
  const bA=bornaRed('A',0xd64545,0x4FD1C5),bB=bornaRed('B',0x14181e,0x8a9299);
  bA.position.copy(H(19,'c'));bB.position.copy(H(21,'c'));
  circG.add(bA,bB);
  wire(H(11,'d'),H(19,'c').clone().add(new THREE.Vector3(0,0.12,0.0)),cableMat.rojo,{pinB:false,minAlto:0.14,alto:0.2});
  wire(H(21,'d'),railNear('-',21),cableMat.negro,{minAlto:0.12,alto:0.2});
  circG.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
}
BANCO.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
scene.add(BANCO);

function drawPSU(){
  const cx=fuenteBox.cx,cv=fuenteBox.cv,w=cv.width,h=cv.height;
  cx.clearRect(0,0,w,h);
  cx.fillStyle='#08120f';cx.fillRect(0,0,w,h);
  cx.fillStyle='#4FD1C5';cx.textAlign='center';
  cx.font='bold '+Math.round(h*0.22)+'px monospace';
  cx.fillText('V1',w/2,h*0.30);
  cx.font='bold '+Math.round(h*0.44)+'px monospace';
  cx.fillText(EL('V1').value.toFixed(2)+' V',w/2,h*0.80);
  fuenteBox.tex.needsUpdate=true;
}

function refreshNet3D(){
  armaCircuito();
  const reto=mode==='reto';
  (reto?['RL']:['R1','R2','R3','RL']).forEach(id=>RG[id].userData.ponValor(EL(id).value));
  gndRL.visible=!!EL('RL').on;
  fuenteBox.g.visible=!reto;
  if(!reto)drawPSU();
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
  explora:{nombre:'Explora',cam:[[0,4.3,6.9],[0,1.15,0.5]],mision:'Barre distintos valores de RL sobre la red completa y verifica que el pico de P(RL) coincide con RL=Rth.'},
  eficiencia:{nombre:'Eficiencia',cam:[[0,2.7,3.5],[0,2.2,-1.55]],mision:'Compara la potencia entregada a RL contra la potencia total de la fuente — confirma η=50 % exactamente en el pico de potencia.'},
  reto:{nombre:'Reto',cam:[[0,4.1,6.8],[0,1.1,0.5]],mision:'Caja negra real: mide Voc e Isc y predice el RL óptimo y la potencia máxima transferible.'},
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
  solved=(k==='reto')?retoSolved:false;clearDx();
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
      teleRow('Intentos fallidos',intentos+' / '+FALLOS_MAX,intentos?'warn':'')+
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
  if(retoSolved)return;
  if(!(measuredVoc&&measuredIsc)){showToast('Primero mide Voc e Isc.');return;}
  const rlGuess=numOr('inRLopt'),pGuess=numOr('inPmax');
  if(!isFinite(rlGuess)||!isFinite(pGuess)){showToast('Escribe RLopt (Ω) y Pmáx (mW).');return;}
  const vocR=vocReal(),iscR=iscReal(),rthR=vocR/iscR;
  const pmaxR_mW=(vocR*vocR)/(4*rthR)*1000;
  const tolRL=Math.max(15,rthR*0.05),tolP=Math.max(0.05,pmaxR_mW*0.05);
  const okRL=Math.abs(rlGuess-rthR)<=tolRL, okP=Math.abs(pGuess-pmaxR_mW)<=tolP;
  if(okRL&&okP){
    retoSolved=true;solved=true;synth.beep(1046,0.12,0.06);
    retoMsg=`<span class="mono"><span class="ok">✔ Predicción correcta</span> en ${intentos+1} ${intentos?'intentos':'intento'}. RLopt=${rlGuess} Ω y Pmáx=${pGuess} mW están dentro de tolerancia (±${tolRL.toFixed(1)} Ω, ±${tolP.toFixed(3)} mW).</span>`;
  }else{
    intentos++;synth.beep(220,0.15,0.06);
    const base=`<span class="dtc">✗ Aún no</span> (intento ${intentos} de ${FALLOS_MAX}). RLopt ${okRL?'✓ dentro de tolerancia':'✗ fuera de tolerancia'} · Pmáx ${okP?'✓ dentro de tolerancia':'✗ fuera de tolerancia'}. Recuerda la condición de máxima transferencia y revisa unidades (mA → A, W → mW).`;
    if(intentos>=FALLOS_MAX){
      resiembras++;
      const msg=`<span class="mono">${base}<br><span class="dtc">${FALLOS_MAX} intentos fallidos:</span> esta caja negra se retira sin dar sus valores. Te toca una nueva; vuelve a medir.</span>`;
      newScenario(true);
      retoMsg=msg;refreshAll();
      return;
    }
    retoMsg=`<span class="mono">${base}</span>`;
  }
  resolve();refreshAll();
}
function updateRetoSpec(){
  el('retoSpec').innerHTML=`Caja negra sellada con dos terminales (A, B). Usa <b>"Medir Voc"</b> y <b>"Medir Isc"</b>, calcula Rth=Voc/Isc (= RLopt) y Pmáx=Vth²/(4·Rth), y repórtalos.<br><span style="color:var(--dim)">Las tolerancias (±5 % relativas) son un margen pedagógico de este ejercicio, no una especificación de fabricante.</span>`;
}
function newScenario(auto){
  const pick=()=>Math.floor(Math.random()*RETO_SCENARIOS.length);
  let idx=pick();
  if(RETO_SCENARIOS.length>1)while(idx===retoIdx)idx=pick();
  retoIdx=idx;retoSolved=false;retoMsg='';measuredVoc=false;measuredIsc=false;intentos=0;
  el('inRLopt').value='';el('inPmax').value='';
  if(mode!=='reto'){setMode('reto');}
  else{updateRetoSpec();resolve();buildQuiz();solved=false;clearDx();refreshQuestion();refreshAll();}
  showToast(auto===true?'🔀 Caja negra nueva: vuelve a medir Voc e Isc desde cero.':'🔀 <b>Nueva caja negra.</b> Vuelve a medir Voc e Isc desde cero.');
  synth.beep(520,0.08,0.05);
}
function onRetoInput(){if(mode!=='reto')return;if(!retoSolved)retoMsg='';refreshAll();}   // el éxito ya logrado no se pierde al seguir editando

// ============================== 12) QUIZ ==============================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Por qué la curva P(RL) tiene un ÚNICO máximo en vez de crecer sin límite o ser máxima con RL muy pequeña?',
      opciones:[
        {t:'Porque con RL→0 casi no hay tensión en la carga (P→0) y con RL→∞ casi no circula corriente (P→0); en RL=Rth ambos efectos se compensan y P es máxima',ok:true,why:'Exacto: los dos límites extremos hacen que la potencia caiga a cero por razones distintas (voltaje nulo vs. corriente nula). Entre ambos hay un único máximo, y se demuestra por cálculo (dP/dRL=0) que ocurre en RL=Rth.'},
        {t:'Porque con RL muy grande la fuente se sobrecalienta y el simulador la apaga para protegerla de la sobrecarga',ok:false,why:'El modelo no incluye protección térmica ni fuentes que se apaguen — la curva cae a cero por pura relación V-I-R, no por un límite de seguridad.'},
        {t:'La potencia sí crece sin límite con RL; lo que se ve en la curva es un artefacto de la escala logarítmica del eje horizontal',ok:false,why:'No es un artefacto de escala: P(RL) realmente vuelve a caer hacia cero conforme RL crece, incluso medida en escala lineal — es una propiedad física de la red, no visual.'},
        {t:'Porque Rth es siempre igual a RL por definición del circuito, así que la curva solo tiene un punto posible de operación',ok:false,why:'Rth es una propiedad fija de la red (no depende de qué RL elijas); lo interesante es precisamente que el MÁXIMO ocurre solo cuando tú, al elegir RL, la haces coincidir con Rth.'},
      ],
    },
    eficiencia:{
      pregunta:'En RL=Rth (máxima potencia), la eficiencia η es exactamente 50 %. ¿Qué tendrías que hacer para lograr una eficiencia MAYOR al 50 %, y qué le pasaría a la potencia entregada?',
      opciones:[
        {t:'Usar una RL mayor que Rth: η=RL/(RL+Rth) sube hacia 100 %, pero la potencia entregada baja respecto al máximo; son objetivos distintos',ok:true,why:'Correcto: con RL>Rth, la corriente cae más rápido de lo que sube el voltaje sobre la carga, así que P(RL) baja respecto al pico — pero como se disipa proporcionalmente menos en Rth, η sube. Es un intercambio (trade-off) real de diseño.'},
        {t:'Usar una RL menor que Rth: tanto la potencia entregada como la eficiencia suben a la vez respecto a RL=Rth',ok:false,why:'Con RL<Rth ocurre lo contrario: la eficiencia BAJA (más corriente se disipa en Rth relativo a RL) y la potencia entregada también cae respecto al pico en RL=Rth.'},
        {t:'Es imposible superar el 50 % de eficiencia en cualquier circuito resistivo, porque la fuente siempre disipa la mitad',ok:false,why:'Sí es posible: η=RL/(RL+Rth) puede acercarse a 100 % con RL suficientemente grande — el costo es que la potencia ENTREGADA (no la eficiencia) se aleja de su máximo.'},
        {t:'Aumentar el voltaje de la fuente V1: eleva la eficiencia sin afectar la potencia entregada a la carga',ok:false,why:'η=RL/(RL+Rth) no depende del voltaje de la fuente en absoluto — depende solo de la razón entre RL y Rth. Cambiar V1 escala P(RL) pero no cambia η.'},
      ],
    },
    reto:{
      pregunta:'Sin ver los componentes internos de la caja negra, ¿por qué basta con medir Voc e Isc para predecir el RL que maximiza la potencia entregada?',
      opciones:[
        {t:'Porque Voc=Vth y Rth=Voc/Isc definen por completo la red vista desde los terminales, y RLopt=Rth no depende de la topología interna',ok:true,why:'Exacto: el teorema de Thévenin garantiza que (Vth,Rth) capturan toda la información relevante de la red externa. Como RLopt=Rth y Pmáx=Vth²/(4·Rth) son fórmulas que solo usan esos dos números, no hace falta conocer cuántos resistores hay adentro ni cómo están conectados.'},
        {t:'No basta en realidad: hace falta conocer también los valores de R1, R2 y R3 para predecir RLopt con precisión',ok:false,why:'Es precisamente lo que el método experimental evita: RLopt=Rth se obtiene de Voc/Isc sin necesidad de conocer ni un solo componente interno.'},
        {t:'Porque Isc por sí sola ya determina RLopt, sin necesidad de medir Voc ni de calcular ningún cociente',ok:false,why:'Isc solo da un punto de la relación V-I; Rth=Voc/Isc necesita las DOS mediciones — con solo Isc no hay forma de despejar Rth.'},
        {t:'Porque todas las cajas negras de este laboratorio tienen la misma Rth por diseño, así que no hay nada que medir',ok:false,why:'Cada escenario del reto usa valores distintos de R1/R2/R3 — Rth cambia de una caja negra a otra; por eso hay que remedirla cada vez, no se puede memorizar un solo valor.'},
      ],
    },
  };
  /* Fisher–Yates: la correcta no va en posición fija */
  Object.keys(QUIZ).forEach(k=>{
    const o=QUIZ[k].opciones;
    for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]];}
  });
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
  /* DEMOSTRACIÓN: no toca el reto; al terminar se restituye el estado del alumno */
  const previo={modo:mode,solved,selR1,selR2,selR3,selRL};
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
    showToast('Paso 3 · El Reto es tuyo: caja negra sellada. Mide Voc e Isc y predice RLopt y Pmáx. Este recorrido no lo resuelve ni lo marca como hecho.');await sleep(3400);
  }finally{
    selR1=previo.selR1;selR2=previo.selR2;selR3=previo.selR3;selRL=previo.selRL;
    setMode(previo.modo);solved=previo.solved;
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
el('btnNew').onclick=()=>newScenario();
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
  solved:()=>solved,
  intentos:()=>intentos,
  resiembras:()=>resiembras,
  retoIdx:()=>retoIdx,
  setMode:k=>setMode(k),
  runAuto:()=>runAuto(),
  medirVoc:()=>medirVoc(), medirIsc:()=>medirIsc(),
  checkReto:()=>checkReto(),
  newScenario:()=>newScenario(),
  quizAnswer:i=>answer(i),
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  measured:()=>({voc:measuredVoc,isc:measuredIsc}),
};
