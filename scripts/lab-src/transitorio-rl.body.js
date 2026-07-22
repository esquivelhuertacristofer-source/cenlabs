/*
 * Transitorio RL — mide τ = L/R y la sobretensión inductiva en un osciloscopio simulado
 * Física: al energizar, la corriente (y v_R sobre la resistencia serie de la bobina) sube
 * exponencialmente v_R(t)=V(1−e^(−t/τ)); al interrumpir con un diodo de rueda libre (flyback)
 * en antiparalelo sobre la bobina, decae de forma igualmente exponencial y segura,
 * v_R(t)=V·e^(−t/τ) — en ambos casos τ=L/R (Hayt/Kemmerly/Durbin, Análisis de circuitos en
 * ingeniería, McGraw-Hill; Rashid, Electrónica de potencia).
 * Nota la diferencia clave con τ=R·C (mecanica-64): aquí τ es INVERSAMENTE proporcional a R,
 * no directamente — duplicar R reduce τ a la mitad.
 * Verificado numéricamente: v_R(τ)=0.6321V (energiza), v_R(τ)=0.3679V (interrumpe con diodo);
 * mismos cruces 63.2 %/36.8 % que en un RC, solo que ahora gobernados por L/R.
 * Interrumpir SIN diodo de rueda libre no tiene una τ real que modelar: al no existir una ruta
 * alterna para la corriente, el colapso es forzado por el propio arco/ruptura dieléctrica del
 * interruptor — un fenómeno de conmutación violento y de muy corta duración cuya magnitud y
 * forma dependen del interruptor real, no del circuito RL ideal. Por honestidad NO se le asigna
 * un voltaje ni una τ inventados: se dibuja un colapso casi vertical ligado a la ventana de
 * tiempo visible (no a un τ físico) y se bloquea la medición de τ en ese escenario.
 * La base de tiempo (time/div) usa la misma secuencia realista 1-2-5 que en mecanica-64.
 * Las tolerancias del modo Reto (±8 % en L) y de Sobretensión (±6 % en τ) son un margen
 * PEDAGÓGICO de este ejercicio, no una especificación de fabricante ni de instrumento real.
 * Símbolos: IEC 60617. Bandas de color de resistores: IEC 60063 (serie E12).
 */

// ============================== 1) ESCENA ==============================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.0,2.4,7.0],target:[0.5,1.3,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

// ============================== 2) FÍSICA ==============================
const V=12;
const Vf=0.7;
const R_CANDIDATES=[10,22,47,100];
const L_CANDIDATES=[50e-3,100e-3,220e-3,470e-3];
const DIVX=10,DIVY=8;
const VOLTS_PER_DIV=V/DIVY;
const DIAL_STEPS_US=[10,20,50,100,200,500,1000,2000,5000,10000,20000,50000,100000,200000];
const RETO_SCENARIOS=[
  {R:10,L:220e-3},
  {R:22,L:68e-3},
  {R:47,L:470e-3},
  {R:100,L:150e-3},
  {R:33,L:220e-3},
  {R:68,L:330e-3},
];

const tauOf=(r,l)=>l/r;
const vR_energiza=(t,tau)=>V*(1-Math.exp(-t/tau));
const vR_interrumpe_condiodo=(t,tau)=>V*Math.exp(-t/tau);
const vR_interrumpe_sindiodo=(t,windowS)=>V*Math.exp(-t/(windowS*0.01));
function vAt(t,tau,fase,diodo,windowS){
  if(fase==='energiza')return vR_energiza(t,tau);
  if(diodo==='con')return vR_interrumpe_condiodo(t,tau);
  return vR_interrumpe_sindiodo(t,windowS);
}
const targetFrac=fase=>fase==='interrumpe'?(1-0.6321):0.6321;

function nearestDialStep(us){
  let best=DIAL_STEPS_US[0],bd=Infinity;
  DIAL_STEPS_US.forEach(s=>{const d=Math.abs(Math.log10(s)-Math.log10(us));if(d<bd){bd=d;best=s;}});
  return best;
}
function timeDivChoicesFor(tau){
  const tauUs=tau*1e6;
  return[
    {key:'rapido',us:nearestDialStep(tauUs/8),label:'',ok:false},
    {key:'ok',us:nearestDialStep(tauUs/2),label:'',ok:true},
    {key:'lento',us:nearestDialStep(tauUs*2),label:'',ok:false},
  ].map(c=>({...c,label:fmtUs(c.us)}));
}
function fmtUs(us){return us<1000?us+' µs/div':(us/1000)+' ms/div';}
function fmtTimeS(s){
  const us=s*1e6;
  if(us<1000)return us.toFixed(us<10?2:1)+' µs';
  const ms=us/1000;
  return ms.toFixed(ms<10?3:(ms<100?2:1))+' ms';
}
function divForTime(tS,timeDivUs){return tS/(timeDivUs*1e-6);}

const fmtR=v=>v>=1000?(((v/1000)%1)?(v/1000).toFixed(1):String(Math.round(v/1000)))+' kΩ':v+' Ω';
const fmtV=v=>(v%1?v.toFixed(1):String(v))+' V';
function fmtL(h){
  const mH=h*1e3;
  if(mH>=1000){const H=mH/1000;return(H%1?H.toFixed(2):String(Math.round(H)))+' H';}
  return(mH%1?mH.toFixed(1):String(Math.round(mH)))+' mH';
}
const BAND_COLORS=['#1a1a1a','#6b4226','#c73a3a','#d2691e','#e8c832','#3f8f3f','#2b5fb8','#7d3fc4','#8a8a8a','#e8e8e8'];
const BAND_NAMES=['negro','café','rojo','naranja','amarillo','verde','azul','violeta','gris','blanco'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1;const dd=Math.round(v/Math.pow(10,exp));return{d1:Math.floor(dd/10),d2:dd%10,mult:exp};}

// ============================== 3) ESTADO ==============================
let mode='explora'; // explora | sobretension | reto
let selR=22,selL=100e-3,fase='energiza',diodo='con';
let timeDivKey='rapido';
let cursorDiv=5.0;
let medido=false,tauMedido=null;
let retoIdx=0,retoSolved=false,retoMsg='';
let solved=false,autoRunning=false,QUIZ={};

function currentR(){return mode==='reto'?RETO_SCENARIOS[retoIdx].R:selR;}
function currentL(){return mode==='reto'?RETO_SCENARIOS[retoIdx].L:selL;}
function currentFase(){return mode==='reto'?'interrumpe':fase;}
function currentDiodo(){return mode==='reto'?'con':diodo;}
function currentTau(){return tauOf(currentR(),currentL());}
function effectiveTimeDivUs(){
  const choices=timeDivChoicesFor(currentTau());
  if(mode==='sobretension'){const c=choices.find(c=>c.key===timeDivKey);return(c||choices[0]).us;}
  return choices.find(c=>c.key==='ok').us;
}
function numOr(id){const v=parseFloat((el(id).value||'').replace(',','.'));return isFinite(v)?v:NaN;}

// ============================== 4) MATERIALES ==============================
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};
const brush=brushedMetal(), rub=rubber(), plas=techPlastic(0.16,0.19,0.18);
const MAT={
  bench:std({...plas.maps,color:0x3a464d,roughness:0.85,metalness:0.05}),
  frame:std({...plas.maps,color:0x232a2e,roughness:0.95,metalness:0}),
  leg:std({...brush.maps,color:0x77828a,metalness:0.35,roughness:0.85}),
  psu:std({...brush.maps,color:0x707c85,metalness:0.35,roughness:0.85}),
  lead:std({...brush.maps,color:0xbfc8ce,metalness:0.9,roughness:0.35}),
  jackRed:std({color:0xc23434,roughness:0.55,metalness:0}),
  jackBlk:std({color:0x14181c,roughness:0.55,metalness:0}),
  cableRed:std({...rub.maps,color:0x9e2b2b,roughness:1.0,metalness:0}),
  cableBlk:std({...rub.maps,color:0x15181b,roughness:1.0,metalness:0}),
  trace:std({...brush.maps,color:0xc08a3e,metalness:0.8,roughness:0.5}),
  caja:std({...plas.maps,color:0x1b2420,roughness:0.9,metalness:0.05}),
};

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const lb=labelSprite(text,color);lb.position.copy(pos);if(scale)lb.scale.multiplyScalar(scale);
  lb.visible=false;lb.raycast=()=>{};obj.add(lb);HOVER_LABELS.set(obj,lb);
}

// ============================== 5) PIZARRÓN (esquema + osciloscopio en un solo canvas) ==============================
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
frame.userData={title:'Pizarrón del osciloscopio',info:'Izquierda: esquema del circuito RL con diodo de rueda libre. Derecha: pantalla del osciloscopio con la traza de v_R(t) y el cursor de medición.'};
addHoverLabel(frame,'Esquema + osciloscopio · clic para inspeccionar','#4FD1C5',new THREE.Vector3(0,1.65,0.3),1.0);

function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function earth(c,x,y){c.strokeStyle='#cfe8e2';c.lineWidth=3;line(c,x,y,x,y+14);[16,11,6].forEach((w,i)=>line(c,x-w,y+14+i*8,x+w,y+14+i*8));}
function nodeDot(c,x,y,big){c.fillStyle='#4FD1C5';c.beginPath();c.arc(x,y,big?6:4,0,7);c.fill();}

const SCH={x0:20,y0:0,w:470,h:768};
const SCP={x0:500,y0:0,w:524,h:768};

function drawSchemHalf(c){
  const{x0,w}=SCH;
  c.fillStyle='#8FB3AC';c.font='bold 19px Outfit, sans-serif';c.textAlign='left';
  c.fillText('ESQUEMA · CIRCUITO RL + DIODO DE RUEDA LIBRE',x0+6,40);
  const cx=x0+70,topY=140,botY=560,midX=x0+280;
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,cx,topY,cx,220);
  c.fillStyle='#8FB3AC';c.font='16px Outfit, sans-serif';c.textAlign='center';
  c.save();c.translate(cx-26,180);c.rotate(-Math.PI/2);c.fillText(fmtV(V),0,0);c.restore();
  line(c,cx-14,190,cx+14,190);line(c,cx-14,210,cx+14,210);
  line(c,cx,220,cx,260);
  line(c,cx,260,midX,260);
  const resX0=cx+90,resX1=midX-10;
  line(c,resX0,260,resX0+14,246);line(c,resX0+14,246,resX0+28,274);line(c,resX0+28,274,resX0+42,246);
  line(c,resX0+42,246,resX0+56,274);line(c,resX0+56,274,resX0+70,246);line(c,resX0+70,246,resX0+84,260);
  c.fillStyle='#4FD1C5';c.font='bold 17px Outfit, sans-serif';c.textAlign='center';
  c.fillText('R = '+fmtR(currentR()),(resX0+resX1)/2,236);
  line(c,midX,260,midX,320);
  nodeDot(c,cx,260,false);nodeDot(c,midX,260,false);

  const faseNow=currentFase(),diodoNow=currentDiodo();
  const diodoOn=diodoNow==='con';
  const dangerous=faseNow==='interrumpe'&&diodoNow==='sin';

  const coilTop=320,br=17.5,nBumps=4,coilBottom=coilTop+nBumps*2*br;
  if(mode==='reto'){
    const boxSize=64,boxY0=(coilTop+coilBottom)/2-boxSize/2,boxY1=(coilTop+coilBottom)/2+boxSize/2;
    line(c,midX,coilTop,midX,boxY0);
    c.strokeStyle='#cfe8e2';c.lineWidth=2;
    rr(c,midX-boxSize/2,boxY0,boxSize,boxSize,8);c.stroke();
    c.fillStyle='#FFB703';c.font='bold 26px Outfit, sans-serif';c.textAlign='center';
    c.fillText('?',midX,(coilTop+coilBottom)/2+9);
    c.font='13px Outfit, sans-serif';c.fillStyle='#8FB3AC';
    c.fillText('L · sellada',midX,boxY1+20);
    c.strokeStyle='#cfe8e2';c.lineWidth=3;
    line(c,midX,boxY1,midX,coilBottom);
  }else{
    c.strokeStyle='#cfe8e2';c.lineWidth=3;
    c.beginPath();c.moveTo(midX,coilTop);
    for(let i=0;i<nBumps;i++){
      const cy=coilTop+br+i*2*br;
      c.arc(midX,cy,br,-Math.PI/2,Math.PI/2,false);
    }
    c.stroke();
    c.fillStyle='#4FD1C5';c.font='bold 17px Outfit, sans-serif';c.textAlign='center';
    c.fillText('L = '+fmtL(currentL()),midX,coilTop-14);
  }
  nodeDot(c,midX,coilTop,false);nodeDot(c,midX,coilBottom,false);

  const diodeX=midX+70,diodeMidY=(coilTop+coilBottom)/2;
  c.strokeStyle=diodoOn?'#cfe8e2':'#5a4a4a';
  c.lineWidth=diodoOn?3:2;
  if(!diodoOn)c.setLineDash([5,4]);
  line(c,midX,coilTop,diodeX,coilTop);
  line(c,diodeX,coilTop,diodeX,diodeMidY-16);
  line(c,diodeX,diodeMidY+16,diodeX,coilBottom);
  line(c,diodeX,coilBottom,midX,coilBottom);
  c.setLineDash([]);
  drawDiodeSym(c,diodeX,diodeMidY,diodoOn);
  if(!diodoOn){
    c.fillStyle='#e05a5a';c.font='bold 18px Outfit, sans-serif';c.textAlign='center';
    c.fillText('✕',diodeX+38,diodeMidY+6);
    c.font='11px Outfit, sans-serif';
    c.fillText('SIN DIODO',diodeX+38,diodeMidY+26);
  }

  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,midX,coilBottom,midX,botY);
  line(c,midX,botY,cx,botY);
  line(c,cx,botY,cx,topY+80);
  earth(c,cx,botY);

  c.fillStyle='#8FB3AC';c.font='14px Outfit, sans-serif';c.textAlign='left';
  const swLabel=(mode==='reto')
    ?'Fase: interrumpe (con diodo — fija en Reto)'
    :(faseNow==='energiza'
      ?'Fase: energiza (fuente conectada)'
      :('Fase: interrumpe ('+(diodoNow==='con'?'con diodo de rueda libre':'SIN diodo — peligroso')+')'));
  c.fillText(swLabel,x0+6,610);
  if(mode!=='reto'){
    if(dangerous){
      c.fillStyle='#e05a5a';c.font='bold 14px Outfit, sans-serif';
      c.fillText('⚠ Sin τ medible — colapso forzado (v=L·di/dt)',x0+6,638);
    }else{
      const tau=currentTau();
      c.fillStyle='#f0a5a5';c.font='bold 15px Outfit, sans-serif';
      c.fillText('τ = L/R = '+fmtTimeS(tau),x0+6,638);
    }
  }else{
    c.fillStyle='#f0a5a5';c.font='bold 15px Outfit, sans-serif';
    c.fillText('τ = L/R = ? (calcula con tu medición)',x0+6,638);
  }
  c.fillStyle='#5a6b66';c.font='12px Outfit, sans-serif';
  wrapText(c,'La caja negra sella solo la bobina. R es visible; mide τ en la interrupción protegida por el diodo para hallar L.',x0+6,664,w-30,15);
}
function drawDiodeSym(c,x,y,solid){
  const s=14;
  c.fillStyle=solid?'#cfe8e2':'#5a4a4a';
  c.strokeStyle=solid?'#cfe8e2':'#5a4a4a';
  c.lineWidth=2;
  c.beginPath();
  c.moveTo(x-s*0.6,y+s*0.6);
  c.lineTo(x+s*0.6,y+s*0.6);
  c.lineTo(x,y-s*0.6);
  c.closePath();
  c.fill();
  line(c,x-s*0.7,y-s*0.6,x+s*0.7,y-s*0.6);
}
function wrapText(c,text,x,y,maxW,lh){
  const words=text.split(' ');let line1='',yy=y;
  words.forEach(w=>{
    const test=line1?line1+' '+w:w;
    if(c.measureText(test).width>maxW&&line1){c.fillText(line1,x,yy);line1=w;yy+=lh;}else line1=test;
  });
  if(line1)c.fillText(line1,x,yy);
}

function drawScopeHalf(c){
  const{x0,w}=SCP;
  const gx0=x0+46,gy0=54,gw=w-70,gh=580;
  c.fillStyle='#8FB3AC';c.font='bold 19px Outfit, sans-serif';c.textAlign='left';
  c.fillText('OSCILOSCOPIO · TRAZA v_R(t)',x0+6,40);
  c.fillStyle='#07120e';c.fillRect(gx0,gy0,gw,gh);
  c.strokeStyle='rgba(79,209,197,0.22)';c.lineWidth=1;
  for(let i=0;i<=DIVX;i++){const x=gx0+(i/DIVX)*gw;line(c,x,gy0,x,gy0+gh);}
  for(let i=0;i<=DIVY;i++){const y=gy0+(i/DIVY)*gh;line(c,gx0,y,gx0+gw,y);}
  c.strokeStyle='rgba(79,209,197,0.55)';c.lineWidth=1.5;line(c,gx0,gy0+gh,gx0+gw,gy0+gh);

  const timeDivUs=effectiveTimeDivUs();
  const windowS=timeDivUs*1e-6*DIVX;
  const tau=currentTau(),faseNow=currentFase(),diodoNow=currentDiodo();
  const dangerous=faseNow==='interrumpe'&&diodoNow==='sin';
  const xToPx=t=>gx0+(t/windowS)*gw;
  const yToPx=v=>gy0+gh-(v/V)*gh;

  if(!dangerous){
    const tgtFrac=targetFrac(faseNow);
    c.strokeStyle='#FFB703';c.setLineDash([6,5]);c.lineWidth=1.5;
    line(c,gx0,yToPx(tgtFrac*V),gx0+gw,yToPx(tgtFrac*V));
    c.setLineDash([]);
    c.fillStyle='#FFB703';c.font='12px Outfit, sans-serif';c.textAlign='left';
    c.fillText((faseNow==='interrumpe'?'36.8%':'63.2%')+' de V',gx0+6,yToPx(tgtFrac*V)-6);
  }

  c.strokeStyle=dangerous?'#e05a5a':'#4FD1C5';c.lineWidth=2.5;c.beginPath();
  const N=220;
  for(let i=0;i<=N;i++){
    const t=(i/N)*windowS;
    const v=vAt(t,tau,faseNow,diodoNow,windowS);
    const px=xToPx(t),py=yToPx(v);
    if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
  }
  c.stroke();

  if(dangerous){
    c.fillStyle='#e05a5a';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';
    c.fillText('⚠ Colapso forzado — sin τ exponencial que medir aquí',gx0+gw/2,gy0+26);
  }

  const cx=gx0+(cursorDiv/DIVX)*gw;
  const tCursor=(cursorDiv/DIVX)*windowS;
  const vCursor=vAt(tCursor,tau,faseNow,diodoNow,windowS);
  c.strokeStyle='#f0a5a5';c.lineWidth=1.5;c.setLineDash([4,4]);
  line(c,cx,gy0,cx,gy0+gh);
  c.setLineDash([]);
  c.fillStyle='#f0a5a5';c.beginPath();c.arc(cx,yToPx(vCursor),6,0,7);c.fill();

  c.fillStyle='#5a6b66';c.font='11px Outfit, sans-serif';c.textAlign='center';
  c.fillText(fmtUs(timeDivUs),x0+w/2,gy0+gh+22);
  c.textAlign='left';
  c.fillText('Volts/div: '+VOLTS_PER_DIV.toFixed(2)+' V',gx0,gy0+gh+22);
  c.textAlign='right';
  c.fillText('cursor: t='+fmtTimeS(tCursor)+' · v='+vCursor.toFixed(2)+' V',gx0+gw,gy0+gh+22);
  if(medido&&tauMedido!=null){
    c.fillStyle='#8FB3AC';c.textAlign='left';
    c.fillText('τ medido ≈ '+fmtTimeS(tauMedido),gx0,gy0+gh+42);
  }
}

function drawBoard(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.05)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  drawSchemHalf(c);
  drawScopeHalf(c);
  c.strokeStyle='rgba(79,209,197,0.28)';c.lineWidth=2;line(c,485,20,485,748);
  bTex.needsUpdate=true;
}
function boardClick(u,v){
  const x=u*1024;
  if(x<485){
    showToast(mode==='reto'
      ? 'La bobina está sellada (❓): conoces R pero no L. Mide τ en la interrupción protegida por el diodo y despeja L = τ·R.'
      : 'Circuito RL serie con diodo de rueda libre: fuente V, resistor R, bobina L y diodo en antiparalelo sobre la bobina. En "energiza" la fuente está conectada; en "interrumpe", desconectada y la corriente busca una ruta a través del diodo (o del aire, si no hay diodo).');
  }else{
    showToast('Traza v_R(t) sobre la resistencia serie de la bobina. La línea punteada ámbar marca el 63.2 % (energiza) o 36.8 % (interrumpe con diodo) de V — el punto donde t=τ. Sin diodo, no hay línea de referencia: el colapso es forzado, no exponencial medible.');
  }
}

// ============================== 6) BANCO 3D ==============================
const bench=sh(roundedBox(2.9,0.5,1.6,MAT.bench,0.05));bench.position.set(1.75,0.25,0.85);scene.add(bench);
bench.userData={title:'Banco de trabajo',info:'Montaje físico del circuito RL: fuente, resistor, bobina y diodo de rueda libre.'};

function trace(x1,z1,x2,z2){
  const w=Math.abs(x2-x1)||0.045,d=Math.abs(z2-z1)||0.045;
  const t=new THREE.Mesh(new THREE.BoxGeometry(Math.max(w,0.045),0.015,Math.max(d,0.045)),MAT.trace);
  t.position.set((x1+x2)/2,0.515,(z1+z2)/2);t.receiveShadow=true;scene.add(t);
  return t;
}

const RES3D={};
function makeRes3D(id,x,z,vert){
  const g=new THREE.Group();g.position.set(x,0.58,z);if(vert)g.rotation.y=Math.PI/2;
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
makeRes3D('R',1.35,0.62,false);

function makeInd3D(x,z){
  const g=new THREE.Group();g.position.set(x,0.62,z);
  const can=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.22,20),std({color:0x4a3a1f,roughness:0.6,metalness:0.2})));
  g.add(can);
  const cv=document.createElement('canvas');cv.width=256;cv.height=256;
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const top=new THREE.Mesh(new THREE.CircleGeometry(0.088,20),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  top.rotation.x=-Math.PI/2;top.position.y=0.111;g.add(top);
  [-1,1].forEach(s=>{
    const lead=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.09,8),MAT.lead);
    lead.position.set(s*0.03,-0.155,0);g.add(lead);
  });
  g.userData={el:'L'};
  scene.add(g);
  return{g,cv,tx};
}
function drawIndLabel(cv,tx,valueStr){
  const c=cv.getContext('2d');
  c.fillStyle='#3a2a13';c.beginPath();c.arc(128,128,120,0,Math.PI*2);c.fill();
  c.strokeStyle='#8a6a2f';c.lineWidth=6;c.beginPath();c.arc(128,128,116,0,Math.PI*2);c.stroke();
  c.fillStyle='#ffe3ae';c.font='bold 34px Outfit, sans-serif';c.textAlign='center';
  c.fillText(valueStr,128,120);
  c.font='16px Outfit, sans-serif';c.fillStyle='#d9b877';
  c.fillText('IND · L',128,150);
  tx.needsUpdate=true;
}
const indReal=makeInd3D(1.7,0.62);
drawIndLabel(indReal.cv,indReal.tx,fmtL(selL));

const indSealed=sh(roundedBox(0.24,0.24,0.24,MAT.caja,0.04));
indSealed.position.set(1.7,0.62,0.62);
indSealed.visible=false;
indSealed.userData={el:'L'};
scene.add(indSealed);
const indSealedLabel=labelSprite('❓ L','#FFB703');
indSealedLabel.position.set(1.7,0.84,0.62);
indSealedLabel.visible=false;
scene.add(indSealedLabel);

function makeDiode3D(x,z){
  const g=new THREE.Group();g.position.set(x,0.60,z);g.rotation.z=Math.PI/2;
  const body=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.13,16),std({color:0x14181c,roughness:0.4,metalness:0.1})));
  g.add(body);
  const band=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.033,0.033,0.016,16),std({color:0xe8e8e8,roughness:0.4,metalness:0.1})));
  band.position.x=0.045;g.add(band);
  [-1,1].forEach(s=>{
    const pin=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,0.06,8),MAT.lead);
    pin.position.x=s*0.095;g.add(pin);
  });
  g.userData={el:'D'};
  scene.add(g);
  return g;
}
const diode3D=makeDiode3D(2.05,0.85);

const psCv=[],psTex=[];
function makePSU(x){
  const g=new THREE.Group();g.position.set(x,0.72,0.25);scene.add(g);
  const box=sh(roundedBox(0.52,0.44,0.40,MAT.psu,0.06));g.add(box);
  const cv=document.createElement('canvas');cv.width=256;cv.height=96;
  const tx=new THREE.CanvasTexture(cv);
  tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.40,0.15),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  pl.position.set(0,0.06,0.205);g.add(pl);
  const postR=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.10,10),MAT.jackRed));postR.position.set(-0.13,0.27,0.10);g.add(postR);
  const postB=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.10,10),MAT.jackBlk));postB.position.set(0.13,0.27,0.10);g.add(postB);
  g.userData={el:'V'};
  psCv[0]=cv;psTex[0]=tx;
  addHoverLabel(g,'Fuente V','#f0a5a5',new THREE.Vector3(0,0.55,0),0.8);
  return g;
}
const psuGroup=makePSU(1.05);
function drawPSU(){
  const cv=psCv[0],c=cv.getContext('2d');
  c.fillStyle='#071410';c.fillRect(0,0,256,96);
  c.strokeStyle='rgba(79,209,197,0.4)';c.lineWidth=3;c.strokeRect(3,3,250,90);
  c.fillStyle='#4FD1C5';c.font='bold 40px Outfit, sans-serif';c.textAlign='center';
  c.fillText(V.toFixed(2)+' V',128,62);
  psTex[0].needsUpdate=true;
}
drawPSU();

function cable(ax,ay,az,bx,by,bz,mat){
  const a=new THREE.Vector3(ax,ay,az),b=new THREE.Vector3(bx,by,bz);
  const m=a.clone().lerp(b,0.5);m.y=Math.max(a.y,b.y)+0.16;
  const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,m,b]),24,0.015,8),mat);
  t.castShadow=true;scene.add(t);
  return t;
}
const cbl1=cable(0.92,0.99,0.35,1.18,0.62,0.62,MAT.cableRed);
const cbl2=cable(1.18,0.99,0.35,1.52,0.62,0.62,MAT.cableBlk);
const tr1=trace(0.95,0.62,1.18,0.62);
const tr2=trace(1.52,0.62,1.7,0.62);

const groundPost=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.034,0.16,12),MAT.jackBlk));
groundPost.position.set(2.15,0.66,0.62);scene.add(groundPost);
groundPost.userData={title:'Referencia (tierra)',info:'Terminal de retorno del circuito RL — el mismo nodo que la referencia (0 V) del osciloscopio.'};

function refreshNet3D(){
  const r=RES3D['R'],b=bandsFor(currentR());
  [b.d1,b.d2,b.mult].forEach((dig,i)=>r.bands[i].material.color.set(BAND_COLORS[dig]));
  r.bands[3].material.color.set('#c9a227');
  const reto=mode==='reto';
  indReal.g.visible=!reto;
  indSealed.visible=reto;
  indSealedLabel.visible=reto;
  if(!reto)drawIndLabel(indReal.cv,indReal.tx,fmtL(currentL()));
  diode3D.visible=reto?true:(currentDiodo()==='con');
}

// ============================== 7) HUD Y PANEL ==============================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos CD (D1) · Régimen transitorio</div>
  <h2>Transitorio RL · Mide τ y la Sobretensión Inductiva</h2>
  <p>Al conectar o desconectar una fuente de CD de una bobina a través de un resistor,
  la corriente —y el voltaje sobre la resistencia serie de la bobina, v_R— no cambia
  instantáneamente: sigue una curva exponencial gobernada por <b>τ = L/R</b>, la constante
  de tiempo. A diferencia de τ=R·C, aquí τ es INVERSAMENTE proporcional a R. Este banco mide
  τ directamente sobre un osciloscopio simulado y compara la interrupción protegida por un
  diodo de rueda libre (segura, medible) contra la interrupción sin protección (peligrosa,
  no medible).</p>
  <div class="formula">Energiza: v_R(t)=V(1−e^(−t/τ)) · Interrumpe (con diodo): v_R(t)=V·e^(−t/τ) · τ=L/R</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Traza v_R(t) (con diodo o al energizar)</div>
    <div class="li"><span class="dot" style="background:#e05a5a"></span>Traza sin diodo (colapso forzado)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Referencia 63.2 %/36.8 % (t=τ)</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Cursor de medición</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> respuesta exponencial exacta de un circuito RL serie de primer orden ante un escalón de CD, tanto al energizar como al interrumpir con diodo de rueda libre; relación τ=L/R (inversa en R, a diferencia de τ=R·C); medición realista con base de tiempo discreta (secuencia 1-2-5) y cursor manual; caracterización experimental de una bobina desconocida a partir de R conocida y τ medida en la interrupción protegida.</div>
    <div class="fl no"><b>NO modela:</b> la magnitud ni la forma exacta de la sobretensión al interrumpir SIN diodo de rueda libre — ese colapso depende del arco/ruptura dieléctrica del interruptor real, no del circuito RL ideal, así que no se le asigna un voltaje ni una τ inventados (solo se dibuja un colapso forzado, ligado a la ventana visible, con la medición bloqueada). Tampoco modela la caída directa del diodo (Vf) ni resistencia de fuente. Las tolerancias (±6 % en τ, ±8 % en L) son un margen PEDAGÓGICO de este ejercicio, no una especificación de fabricante.</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · Rashid, Electrónica de potencia · IEC 60617 · IEC 60063</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Transitorio RL · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">📈 Explora</button>
    <button class="b" id="m_sobretension">🖥️ Sobretensión</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div class="modebar" id="selbar" style="display:none"></div>
  <div id="cursorBox" style="margin:6px 0 10px">
    <label for="cursor" style="font-size:11px;color:var(--dim)">Cursor (t) — arrastra hasta el cruce de la línea punteada</label>
    <input type="range" id="cursor" min="0" max="10" step="0.02" value="5" style="width:100%">
  </div>
  <div class="btns" id="medirBox" style="display:none">
    <button class="b" id="btnMedir">📏 Medir τ</button>
  </div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Caracterización</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div style="display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:var(--ink)">
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inL">L =</label><input id="inL" inputmode="decimal" autocomplete="off" style="width:80px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>mH</span></span>
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
function toastPart(id){
  if(id==='L'&&mode==='reto'){
    showToast('🔒 Bobina sellada: no puedes leer su valor directamente. Mide τ en la interrupción protegida por el diodo y calcula L = τ·R.');
    return;
  }
  if(id==='R'){
    const b=bandsFor(currentR());
    showToast(`<b style="color:var(--accent2)">R · ${fmtR(currentR())}</b><br><span style="color:var(--dim);font-size:11px">Bandas: ${BAND_NAMES[b.d1]}-${BAND_NAMES[b.d2]}-${BAND_NAMES[b.mult]}-oro.</span>`);
    return;
  }
  if(id==='L'){
    showToast(`<b style="color:var(--accent2)">L · ${fmtL(currentL())}</b><br><span style="color:var(--dim);font-size:11px">Bobina del circuito RL — se opone a cambios bruscos de corriente (v=L·di/dt).</span>`);
    return;
  }
  if(id==='D'){
    const on=currentDiodo()==='con';
    showToast(on
      ? `<b style="color:var(--accent2)">Diodo de rueda libre</b><br><span style="color:var(--dim);font-size:11px">En antiparalelo sobre la bobina: le da a la corriente una ruta segura para decaer al interrumpir la fuente.</span>`
      : `<b style="color:var(--bad)">Sin diodo de rueda libre</b><br><span style="color:var(--dim);font-size:11px">Sin ruta alterna, interrumpir la corriente fuerza un colapso casi instantáneo — la fuente física de la sobretensión/arco.</span>`);
    return;
  }
  if(id==='V'){
    showToast(`<b style="color:var(--accent2)">V · ${fmtV(V)}</b><br><span style="color:var(--dim);font-size:11px">Fuente ideal de CD (sin resistencia interna — modelo).</span>`);
  }
}

// ============================== 9) MODOS Y SELBAR ==============================
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.0,2.4,7.0],[0.4,1.3,0.0]],mision:'Cambia R y L, alterna entre energizar e interrumpir (con y sin diodo), y verifica que τ=L/R responde de forma INVERSA a R —lo opuesto de lo que viste con τ=R·C.'},
  sobretension:{nombre:'Sobretensión',cam:[[-0.3,2.1,3.6],[-1.0,1.75,-0.6]],mision:'Elige una base de tiempo adecuada y mide τ con el cursor durante la interrupción protegida por el diodo; compara contra el escenario sin diodo.'},
  reto:{nombre:'Reto',cam:[[2.6,2.0,4.2],[1.6,1.0,0.55]],mision:'Bobina sellada: conoces R pero no L. Mide τ en la interrupción protegida por el diodo y despeja L=τ·R.'},
};
function buildSelBar(){
  const bar=el('selbar');
  if(mode==='reto'){bar.style.display='none';bar.innerHTML='';return;}
  bar.style.display='flex';
  let html=`<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin-right:4px">R:</span>`+
    R_CANDIDATES.map(r=>`<button class="b sm ${r===selR?'on':''}" data-r="${r}">${fmtR(r)}</button>`).join('')+
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">L:</span>`+
    L_CANDIDATES.map(lv=>`<button class="b sm ${lv===selL?'on':''}" data-l="${lv}">${fmtL(lv)}</button>`).join('')+
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">Fase:</span>`+
    ['energiza','interrumpe'].map(f=>`<button class="b sm ${f===fase?'on':''}" data-f="${f}">${f==='energiza'?'Energiza':'Interrumpe'}</button>`).join('')+
    `</div>`;
  if(fase==='interrumpe'){
    html+=`<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">Diodo:</span>`+
      ['con','sin'].map(d=>`<button class="b sm ${d===diodo?'on':''}" data-d="${d}">${d==='con'?'Con diodo':'Sin diodo'}</button>`).join('')+
      `</div>`;
  }
  if(mode==='sobretension'){
    const choices=timeDivChoicesFor(currentTau());
    html+=`<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">Base de tiempo:</span>`+
      choices.map(c=>`<button class="b sm ${c.key===timeDivKey?'on':''}" data-td="${c.key}">${c.label}</button>`).join('')+
      `</div>`;
  }
  bar.innerHTML=html;
  bar.querySelectorAll('[data-r]').forEach(b=>{b.onclick=()=>{selR=parseFloat(b.dataset.r);afterEdit();};});
  bar.querySelectorAll('[data-l]').forEach(b=>{b.onclick=()=>{selL=parseFloat(b.dataset.l);afterEdit();};});
  bar.querySelectorAll('[data-f]').forEach(b=>{b.onclick=()=>{fase=b.dataset.f;afterEdit();};});
  bar.querySelectorAll('[data-d]').forEach(b=>{b.onclick=()=>{diodo=b.dataset.d;afterEdit();};});
  if(mode==='sobretension'){
    bar.querySelectorAll('[data-td]').forEach(b=>{b.onclick=()=>{timeDivKey=b.dataset.td;medido=false;tauMedido=null;buildSelBar();refreshAll();};});
  }
}
function setMode(k){
  mode=k;
  medido=false;tauMedido=null;cursorDiv=5.0;el('cursor').value='5';
  if(k==='sobretension')timeDivKey='rapido';
  ['explora','sobretension','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('medirBox').style.display=(k==='explora')?'none':'flex';
  const reto=k==='reto';
  el('retoTitle').style.display=reto?'':'none';
  el('retoBox').style.display=reto?'':'none';
  if(reto)updateRetoSpec();
  buildSelBar();
  solved=false;clearDx();buildQuiz();refreshQuestion();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  refreshAll();
}
function afterEdit(){
  medido=false;tauMedido=null;
  if(mode==='sobretension')timeDivKey='rapido';
  buildSelBar();
  solved=false;clearDx();buildQuiz();refreshQuestion();
  refreshAll();
}

// ============================== 10) TELEMETRÍA Y REPORTE ==============================
function teleRow(l,v,cls){return `<div class="g"><div class="l">${l}</div><b class="${cls||''}">${v}</b></div>`;}
function updateTele(){
  const t=el('tele');
  const tau=currentTau();
  const timeDivUs=effectiveTimeDivUs();
  const faseNow=currentFase(),diodoNow=currentDiodo();
  const dangerous=faseNow==='interrumpe'&&diodoNow==='sin';
  if(mode==='explora'){
    t.innerHTML=
      teleRow('R',fmtR(selR))+
      teleRow('L',fmtL(selL))+
      teleRow('V',fmtV(V))+
      teleRow('τ = L/R',dangerous?'— (sin τ medible)':fmtTimeS(tau))+
      teleRow('Fase',fase==='energiza'?'Energiza':'Interrumpe')+
      teleRow('Diodo',fase==='interrumpe'?(diodo==='con'?'Con diodo (seguro)':'Sin diodo (peligroso)'):'—')+
      teleRow('Base de tiempo (auto)',fmtUs(timeDivUs));
  }else if(mode==='sobretension'){
    if(dangerous){
      t.innerHTML=
        teleRow('R',fmtR(selR))+
        teleRow('L',fmtL(selL))+
        teleRow('τ = L/R (calculado)','— (no aplica sin diodo)')+
        teleRow('Base de tiempo elegida',fmtUs(timeDivUs))+
        teleRow('τ medido (cursor)','🔒 medición bloqueada','warn')+
        teleRow('Estado','Activa "Con diodo" para medir τ','warn');
    }else{
      const choices=timeDivChoicesFor(tau);
      const chosen=choices.find(c=>c.key===timeDivKey);
      const okTd=chosen&&chosen.ok;
      let tolCls='';
      if(medido&&tauMedido!=null){
        const err=Math.abs(tauMedido-tau)/tau;
        tolCls=err<=0.06?'good':'warn';
      }
      t.innerHTML=
        teleRow('R',fmtR(selR))+
        teleRow('L',fmtL(selL))+
        teleRow('τ = L/R (calculado)',fmtTimeS(tau))+
        teleRow('Base de tiempo elegida',fmtUs(timeDivUs),okTd?'good':'warn')+
        teleRow('τ medido (cursor)',medido?fmtTimeS(tauMedido):'🔒 sin medir',medido?tolCls:'warn')+
        teleRow('Estado',medido?(tolCls==='good'?'✔ dentro de ±6 %':'revisa el cursor, fuera de ±6 %'):'Elige la base de tiempo correcta y mide τ',medido&&tolCls==='good'?'good':'warn');
    }
  }else{
    const sc=RETO_SCENARIOS[retoIdx];
    t.innerHTML=
      teleRow('R (conocida)',fmtR(sc.R))+
      teleRow('L',retoSolved?fmtL(sc.L):'🔒 desconocida')+
      teleRow('τ medido (cursor)',medido?fmtTimeS(tauMedido):'🔒 sin medir',medido?'good':'warn')+
      teleRow('Tu L calculada',(el('inL')&&el('inL').value)?el('inL').value+' mH':'—')+
      teleRow('Estado',retoSolved?'✔ PREDICCIÓN VALIDADA':(medido?'Calcula L=τ·R y comprueba':'Mide τ primero'),retoSolved?'good':'warn');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  const tau=currentTau();
  const faseNow=currentFase(),diodoNow=currentDiodo();
  const dangerous=faseNow==='interrumpe'&&diodoNow==='sin';
  if(mode==='explora'){
    html+=dangerous
      ? `<span class="mono">Sin diodo de rueda libre, interrumpir la corriente de la bobina no tiene una τ exponencial que medir: el colapso es forzado por el propio interruptor (arco/ruptura dieléctrica), no por el circuito RL ideal.</span>`
      : `<span class="mono">τ=L/R=${fmtL(selL)}/${fmtR(selR)}=${fmtTimeS(tau)}. Nota que τ es INVERSAMENTE proporcional a R — lo opuesto de τ=R·C. A t=τ, v_R alcanza el 63.2 % de V (energiza) o cae al 36.8 % (interrumpe con diodo).</span>`;
  }else if(mode==='sobretension'){
    if(dangerous){
      html+=`<span class="mono">Sin diodo, la traza colapsa casi verticalmente — no hay línea de referencia de 63.2 %/36.8 % que medir, y "Medir τ" está bloqueado en este escenario.</span>`;
    }else{
      const choices=timeDivChoicesFor(tau);
      const chosen=choices.find(c=>c.key===timeDivKey);
      html+=chosen&&chosen.ok
        ? `<span class="mono">Con ${fmtUs(chosen.us)} la ventana completa (10 divisiones) cubre ≈5τ — el cruce del 63.2 %/36.8 % cae dentro de la pantalla y es legible.</span>`
        : `<span class="mono">Con ${fmtUs((chosen||choices[0]).us)} la traza ${timeDivKey==='rapido'?'se corta antes de terminar el transitorio':'queda comprimida contra el eje'} — cambia la base de tiempo antes de medir.</span>`;
    }
  }else{
    html+=retoMsg||`<span class="mono">Bobina sellada. Mide τ con el cursor del osciloscopio durante la interrupción protegida por el diodo (base de tiempo ya ajustada) y calcula L=τ·R usando la R conocida.</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();refreshNet3D();}

// ============================== 11) MEDICIÓN Y RETO ==============================
function medirTau(){
  const tau=currentTau();
  const timeDivUs=effectiveTimeDivUs();
  const windowS=timeDivUs*1e-6*DIVX;
  const tCursor=(cursorDiv/DIVX)*windowS;
  if(mode==='sobretension'){
    if(currentFase()==='interrumpe'&&currentDiodo()==='sin'){
      showToast('⚠️ Sin diodo de rueda libre no hay una τ exponencial que medir: el colapso de corriente es forzado y casi instantáneo (la fuente física del arco). Activa "Con diodo" para medir una τ real.');
      return;
    }
    const choices=timeDivChoicesFor(tau);
    const chosen=choices.find(c=>c.key===timeDivKey);
    if(!chosen||!chosen.ok){
      showToast('⚠️ Con esta base de tiempo la lectura no es confiable — elige primero la base de tiempo correcta antes de medir τ.');
      return;
    }
    medido=true;tauMedido=tCursor;
    const err=Math.abs(tauMedido-tau)/tau;
    synth.beep(err<=0.06?1046:220,err<=0.06?0.12:0.15,0.06);
    showToast(err<=0.06
      ? `<span style="color:var(--good)">✔ τ medido ≈ ${fmtTimeS(tauMedido)}, dentro de ±6 % del calculado (${fmtTimeS(tau)}).</span>`
      : `<span style="color:var(--bad)">τ medido ≈ ${fmtTimeS(tauMedido)} — fuera de ±6 % del calculado (${fmtTimeS(tau)}). Ajusta el cursor sobre la línea punteada.</span>`);
  }else if(mode==='reto'){
    medido=true;tauMedido=tCursor;
    synth.beep(880,0.1,0.05);
    showToast(`Medición registrada: τ ≈ ${fmtTimeS(tauMedido)}. Ahora calcula L=τ·R (R=${fmtR(currentR())}) y compruébalo abajo.`);
  }
  refreshAll();
}
function checkReto(){
  if(!medido){showToast('⚠️ Primero mide τ en el osciloscopio (botón "Medir τ").');return;}
  const sc=RETO_SCENARIOS[retoIdx];
  const lGuessMH=numOr('inL');
  if(!isFinite(lGuessMH)){showToast('⚠️ Ingresa tu valor calculado de L (en mH).');return;}
  const lGuess=lGuessMH*1e-3;
  const tolL=Math.max(sc.L*0.08,1e-3);
  const ok=Math.abs(lGuess-sc.L)<=tolL;
  retoSolved=ok;
  if(ok){
    synth.beep(1046,0.12,0.06);
    retoMsg=`<span class="mono"><span class="ok">✔ Correcto.</span> Tu L calculada está dentro del margen pedagógico (±8 %). L = τ_medido·R = ${fmtTimeS(tauMedido)}·${fmtR(sc.R)}.</span>`;
  }else{
    synth.beep(220,0.15,0.06);
    retoMsg=`<span class="mono"><span class="dtc">✗ Aún no.</span> Fuera de tolerancia — revisa que el cursor esté justo sobre el cruce del 63.2 % y recalcula L=τ·R. No se muestra el valor real de L.</span>`;
  }
  refreshAll();
}
function updateRetoSpec(){
  const sc=RETO_SCENARIOS[retoIdx];
  el('retoSpec').innerHTML=`Bobina sellada en un circuito RL con R=${fmtR(sc.R)} conocida. La interrupción ya está protegida por el diodo de rueda libre. Mide τ con el cursor del osciloscopio ("Medir τ"), calcula L=τ·R y repórtalo en mH.<br><span style="color:var(--dim)">La tolerancia (±8 %) es un margen pedagógico de este ejercicio, no una especificación de fabricante.</span>`;
}
function newScenario(){
  const pick=()=>Math.floor(Math.random()*RETO_SCENARIOS.length);
  let idx=pick();
  if(RETO_SCENARIOS.length>1)while(idx===retoIdx)idx=pick();
  retoIdx=idx;retoSolved=false;retoMsg='';medido=false;tauMedido=null;
  el('inL').value='';
  cursorDiv=5.0;el('cursor').value='5';
  if(mode!=='reto'){setMode('reto');}
  else{updateRetoSpec();solved=false;clearDx();buildQuiz();refreshQuestion();refreshAll();}
  showToast('🔀 <b>Nueva bobina sellada.</b> Vuelve a medir τ desde cero.');
  synth.beep(520,0.08,0.05);
}
function onRetoInput(){if(mode!=='reto')return;retoSolved=false;retoMsg='';refreshAll();}

// ============================== 12) QUIZ ==============================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'Si duplicas R sin cambiar L, ¿qué le pasa a τ = L/R?',
      opciones:[
        {t:'τ se reduce a la mitad (τ=L/R es inversamente proporcional a R): la curva llega el doble de rápido al 63.2 %/36.8 % de V, sin cambiar el valor final ni la forma exponencial en sí',ok:true,why:'Correcto: τ=L/R es inversamente proporcional a R. Duplicar R reduce τ a la mitad — lo opuesto de τ=R·C, donde duplicar R duplica τ.'},
        {t:'τ se duplica, igual que en un circuito RC',ok:false,why:'Ese es el comportamiento de τ=R·C (directamente proporcional a R). En un circuito RL, τ=L/R es inversamente proporcional a R.'},
        {t:'τ no cambia: solo depende de L',ok:false,why:'τ=L/R depende de AMBOS componentes. Cambiar cualquiera de los dos cambia τ.'},
        {t:'La curva deja de ser exponencial y se vuelve lineal',ok:false,why:'La forma funcional (exponencial) no cambia al variar R o L — solo cambia la escala temporal (τ).'},
      ],
    },
    sobretension:{
      pregunta:'¿Por qué la traza de "interrumpe sin diodo" no tiene una τ que se pueda medir con el cursor?',
      opciones:[
        {t:'Porque sin una ruta alterna para la corriente, el colapso lo determina el arco/ruptura dieléctrica del propio interruptor —un fenómeno de conmutación real, no la exponencial ideal v_R(t)=V·e^(−t/τ) del circuito RL',ok:true,why:'Correcto: sin diodo de rueda libre no existe la ruta que sostiene una decaída exponencial gobernada por τ=L/R — lo que ocurre es un evento de conmutación forzado, ajeno al modelo RL ideal.'},
        {t:'Porque el cursor deja de funcionar en ese modo',ok:false,why:'El cursor sigue funcionando; lo que se bloquea intencionalmente es la medición de τ, porque no hay una exponencial real que medir en ese escenario.'},
        {t:'Porque τ=L/R solo aplica cuando el diodo está presente en el circuito',ok:false,why:'τ=L/R es una propiedad del circuito RL en sí (siempre que exista una ruta de decaída bien definida). Sin ninguna ruta, simplemente no hay una decaída exponencial que caracterizar con esa fórmula.'},
        {t:'Porque V cambia cuando se retira el diodo',ok:false,why:'V (el voltaje de la fuente) es fijo y no depende de la presencia del diodo — solo cambia qué le pasa a la corriente de la bobina al interrumpir.'},
      ],
    },
    reto:{
      pregunta:'En la bobina sellada conoces R pero no L. ¿Por qué basta con medir τ en la interrupción protegida (con diodo) para hallar L?',
      opciones:[
        {t:'Porque τ=L/R, así que L=τ·R usando la R conocida y la τ medida —no hace falta ver ni tocar la bobina directamente',ok:true,why:'Correcto: τ=L/R es una relación algebraica simple. Con R conocida y τ medida experimentalmente, L=τ·R queda completamente determinada sin inspeccionar el componente.'},
        {t:'Porque el osciloscopio mide L directamente, como un medidor LCR',ok:false,why:'El osciloscopio solo mide voltaje contra tiempo (v_R(t)) —no mide inductancia directamente. L se obtiene indirectamente vía τ=L/R.'},
        {t:'Porque todas las bobinas selladas de este laboratorio valen 100 mH por diseño',ok:false,why:'Cada escenario del reto usa un valor distinto de L —por eso hay que medir τ de nuevo en cada caja, no se puede memorizar un solo valor.'},
        {t:'Porque V determina L',ok:false,why:'V (el voltaje de la fuente) no aparece en la relación τ=L/R —la constante de tiempo es independiente de la amplitud de la fuente.'},
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
    if(u.el){toastPart(u.el);return;}
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
        if(o.userData&&(o.userData.el||o.userData.title||o===board))cursor='pointer';
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
    selR=22;selL=100e-3;fase='energiza';diodo='con';afterEdit();
    showToast('Paso 1 · Observa la curva al energizar: v_R sube hacia V siguiendo v_R(t)=V(1−e^(−t/τ)).');await sleep(2000);
    fase='interrumpe';diodo='con';afterEdit();
    showToast('Ahora interrumpe CON diodo de rueda libre: v_R(t)=V·e^(−t/τ), una caída segura y medible.');await sleep(2200);
    diodo='sin';afterEdit();
    showToast('⚠️ Y ahora interrumpe SIN diodo: el colapso es forzado, casi instantáneo — sin τ exponencial que medir.');await sleep(2400);
    fase='energiza';diodo='con';afterEdit();

    setMode('sobretension');
    showToast('Paso 2 · Elige la base de tiempo. Primero, una demasiado rápida:');await sleep(1800);
    timeDivKey='rapido';buildSelBar();refreshAll();
    showToast('La traza se corta antes de terminar — no se puede medir τ con confianza.');await sleep(2200);
    timeDivKey='lento';buildSelBar();refreshAll();
    showToast('Ahora demasiado lenta: la curva queda comprimida contra el borde izquierdo.');await sleep(2200);
    timeDivKey='ok';buildSelBar();refreshAll();
    showToast('Con la base de tiempo correcta, la curva completa cabe en pantalla.');await sleep(2000);
    {
      const tau=currentTau(),us=effectiveTimeDivUs();
      cursorDiv=Math.min(10,divForTime(tau,us));el('cursor').value=String(cursorDiv);
    }
    refreshAll();
    medirTau();await sleep(2600);
    answer(QUIZ.sobretension.opciones.findIndex(o=>o.ok));await sleep(1600);
    showToast('Ahora, sin diodo — observa que "Medir τ" queda bloqueado:');await sleep(1800);
    diodo='sin';buildSelBar();refreshAll();
    medirTau();await sleep(2600);
    diodo='con';buildSelBar();refreshAll();

    setMode('reto');
    showToast('Paso 3 · Bobina sellada: mide τ en la interrupción protegida y calcula L=τ·R.');await sleep(2000);
    {
      const sc=RETO_SCENARIOS[retoIdx],tau=tauOf(sc.R,sc.L),us=effectiveTimeDivUs();
      cursorDiv=Math.min(10,divForTime(tau,us));el('cursor').value=String(cursorDiv);
    }
    refreshAll();
    medirTau();await sleep(1800);
    {
      const sc=RETO_SCENARIOS[retoIdx];
      const lGuess=(tauMedido*sc.R)*1e3;
      el('inL').value=lGuess.toFixed(1);
    }
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
  const s=1+Math.sin(time*3)*0.12;
  indSealedLabel.scale.setScalar(s);
});

['explora','sobretension','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newScenario;
el('btnCheck').onclick=checkReto;
el('btnMedir').onclick=medirTau;
el('cursor').oninput=()=>{cursorDiv=parseFloat(el('cursor').value);refreshAll();};
el('inL').addEventListener('input',onRetoInput);
el('inL').addEventListener('keydown',e=>{if(e.key==='Enter')checkReto();});
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊 Sonido':'🔇 Sonido';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildQuiz();refreshNet3D();
S.start();
setMode('explora');

window.__labDebug={
  mode:()=>mode,
  R:()=>currentR(),
  L:()=>currentL(),
  V:()=>V,
  Vf:()=>Vf,
  fase:()=>currentFase(),
  diodo:()=>currentDiodo(),
  tau:()=>currentTau(),
  timeDivUs:()=>effectiveTimeDivUs(),
  timeDivKey:()=>timeDivKey,
  cursorDiv:()=>cursorDiv,
  setCursorDiv:d=>{cursorDiv=Math.max(0,Math.min(10,d));el('cursor').value=String(cursorDiv);refreshAll();},
  vAtCursor:()=>{const us=effectiveTimeDivUs();const windowS=us*1e-6*DIVX;const t=(cursorDiv/DIVX)*windowS;return vAt(t,currentTau(),currentFase(),currentDiodo(),windowS);},
  medido:()=>medido,
  tauMedido:()=>tauMedido,
  setTimeDivKey:k=>{timeDivKey=k;medido=false;tauMedido=null;buildSelBar();refreshAll();},
  setSelR:r=>{selR=r;afterEdit();},
  setSelL:l=>{selL=l;afterEdit();},
  setFase:f=>{fase=f;afterEdit();},
  setDiodo:d=>{diodo=d;afterEdit();},
  medirTau:()=>medirTau(),
  checkReto:()=>checkReto(),
  setInL:mh=>{el('inL').value=String(mh);},
  retoSolved:()=>retoSolved,
  retoMsg:()=>retoMsg,
  retoIdx:()=>retoIdx,
  retoR:()=>RETO_SCENARIOS[retoIdx].R,
  newScenario:()=>newScenario(),
  setMode:k=>setMode(k),
  reportText:()=>el('report').innerText,
  quizAnswer:i=>answer(i),
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  solved:()=>solved,
};
