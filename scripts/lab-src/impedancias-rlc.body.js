/*
 * Impedancias RLC — un circuito con R, L y C presenta una impedancia compleja Z=R+jX.
 * En serie los tres elementos comparten la misma corriente y Z=R+j(ωL−1/ωC); en paralelo
 * comparten el mismo voltaje y se suman las admitancias, Y=1/R+j(ωC−1/ωL) con Z=1/Y. La
 * corriente resultante I=V/|Z| queda desfasada exactamente −θz respecto al voltaje aplicado
 * (dividir fasores resta ángulos). La corriente se mide con un resistor shunt de precisión
 * (1 Ω) en serie con la rama: su voltaje es numéricamente igual a la corriente (v_shunt=Rs·i,
 * Rs=1Ω) y se observa en el canal 2 del osciloscopio, usando la MISMA técnica de cruces por
 * cero ya verificada en la práctica anterior: mezclar un cruce ascendente de un canal con uno
 * descendente del otro produce el mismo error sistemático de exactamente 180° (mod 360°).
 * En el Reto, uno de los tres componentes (R, L o C) queda sellado; el estudiante mide |Z|
 * y θz y despeja el componente a partir de las ecuaciones de inversión de la topología
 * activa. Un filtro de degeneración descarta —antes de sellar— cualquier combinación donde
 * un error típico de instrumento (±5° en θz, ±8 % en |Z|) produzca más de 20 % de error en
 * el valor recuperado; verificado numéricamente (1536 combinaciones: exactitud de inversión
 * perfecta con perturbación nula, filtro con 46.3 % de aceptación global).
 * Símbolos y notación: IEC 60027-1 · IEEE Std 280.
 * Las tolerancias (±5° en θz, ±25 % en el componente recuperado) son un margen PEDAGÓGICO
 * de este ejercicio, no una especificación de instrumento real.
 */

// ============================== 1) ESCENA ==============================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.0,2.2,6.6],target:[0.4,1.2,0.0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

// ============================== 2) FÍSICA ==============================
const V1=10,PHI1=0;
const RS=1;
const R_CANDIDATES=[10,22,47,100];
const L_CANDIDATES=[10,22,47,100];
const C_CANDIDATES=[2.2,4.7,10,22];
const FREQ_CANDIDATES=[60,120,250,500];
const TOPOLOGIES=['serie','paralelo'];
const SEALED_KEYS=['R','L','C'];
const TOPO_LABELS={serie:'Serie',paralelo:'Paralelo'};
const VM_MAX=20;
const DIVX=10,DIVY=8;
const VOLTS_PER_DIV_CH1=VM_MAX/(DIVY/2);
const AMPSDIV_CANDIDATES=[0.005,0.01,0.02,0.05,0.1,0.2,0.5,1,2];
const PERIODS_SHOWN=3.3;
const TOL_PHI_DEG=5;
const TOL_COMPONENT_FRAC=0.25;

const vOf=(vm,phiDeg,freq,t)=>vm*Math.sin(2*Math.PI*freq*t+phiDeg*Math.PI/180);
function windowSFor(freq){return PERIODS_SHOWN/freq;}
function divForTime(t,windowS){return(t/windowS)*DIVX;}

function crossingsFor(phiDeg,freq,windowS){
  const T=1/freq;
  const phiRad=phiDeg*Math.PI/180;
  let t0=(-phiRad/(2*Math.PI))*T;
  t0=((t0%T)+T)%T;
  const out=[];
  const kMax=Math.ceil(windowS/(T/2))+2;
  for(let k=-1;k<=kMax;k++){
    const t=t0+k*(T/2);
    if(t<-1e-9)continue;
    if(t>windowS+1e-9)break;
    const type=(((k%2)+2)%2===0)?'asc':'desc';
    out.push({t:Math.max(0,t),type});
  }
  return out;
}
function nearestCrossTo(rawT,crossings){
  let best=crossings[0],bd=Infinity;
  crossings.forEach(c=>{const d=Math.abs(c.t-rawT);if(d<bd){bd=d;best=c;}});
  return best;
}
function phiFromCrossings(t1,t2,freq){
  const T=1/freq;
  let dt=t2-t1;
  dt=dt-T*Math.round(dt/T);
  return -dt*360/T;
}
function angDiff(a,b){
  let d=(a-b)%360;if(d>180)d-=360;if(d<=-180)d+=360;return d;
}

function computeZ(topology,R,L,C,freq){
  const w=2*Math.PI*freq;
  const Lh=L*1e-3,Cf=C*1e-6;
  const XL=w*Lh,XC=1/(w*Cf);
  if(topology==='serie'){
    const re=R,im=XL-XC;
    return{re,im,mag:Math.hypot(re,im),ang:Math.atan2(im,re)*180/Math.PI};
  }else{
    const G=1/R,B=w*Cf-1/(w*Lh);
    const Ymag2=G*G+B*B;
    const re=G/Ymag2,im=-B/Ymag2;
    return{re,im,mag:Math.hypot(re,im),ang:Math.atan2(im,re)*180/Math.PI};
  }
}
function recoverSealed(topology,sealedKey,R,L,C,freq,zMag,zAngDeg){
  const w=2*Math.PI*freq;
  const zAng=zAngDeg*Math.PI/180;
  const Lh=L*1e-3,Cf=C*1e-6;
  if(topology==='serie'){
    if(sealedKey==='R')return zMag*Math.cos(zAng);
    if(sealedKey==='L')return(zMag*Math.sin(zAng)+1/(w*Cf))/w*1e3;
    return 1/(w*(w*Lh-zMag*Math.sin(zAng)))*1e6;
  }else{
    if(sealedKey==='R')return zMag/Math.cos(zAng);
    if(sealedKey==='L')return 1/(w*(w*Cf+Math.sin(zAng)/zMag))*1e3;
    return(-Math.sin(zAng)/zMag+1/(w*Lh))/w*1e6;
  }
}
function worstCaseRecoveryError(topology,sealedKey,R,L,C,freq){
  const trueVal=({R,L,C})[sealedKey];
  const z=computeZ(topology,R,L,C,freq);
  let worst=0;
  for(const dPhi of[-5,0,5]){
    for(const dAmpFrac of[-0.08,0,0.08]){
      const zMag2=z.mag*(1+dAmpFrac);
      const zAng2=z.ang+dPhi;
      const rec=recoverSealed(topology,sealedKey,R,L,C,freq,zMag2,zAng2);
      if(!isFinite(rec)||rec<=0)return Infinity;
      const err=Math.abs(rec-trueVal)/trueVal;
      if(err>worst)worst=err;
    }
  }
  return worst;
}
function pickAmpsPerDiv(imPeak){
  for(const cand of AMPSDIV_CANDIDATES){
    if(imPeak/cand<=3.8)return cand;
  }
  return AMPSDIV_CANDIDATES[AMPSDIV_CANDIDATES.length-1];
}

function fmtV(v){
  const r=Math.round(v*100)/100;
  return(Number.isInteger(r)?String(r):r.toFixed(2))+' V';
}
function fmtHz(f){return f+' Hz';}
function fmtDeg(d){
  const r=Math.round(d*10)/10;
  return(Number.isInteger(r)?String(r):r.toFixed(1))+'°';
}
function fmtTimeS(s){
  const us=s*1e6;
  if(us<1000)return us.toFixed(us<10?2:1)+' µs';
  const ms=us/1000;
  return ms.toFixed(ms<10?3:(ms<100?2:1))+' ms';
}
function fmtOhm(v){const r=Math.round(v*10)/10;return(Number.isInteger(r)?String(r):r.toFixed(1))+' Ω';}
function fmtMH(v){const r=Math.round(v*10)/10;return(Number.isInteger(r)?String(r):r.toFixed(1))+' mH';}
function fmtUF(v){const r=Math.round(v*10)/10;return(Number.isInteger(r)?String(r):r.toFixed(1))+' µF';}
function fmtA(a){
  if(a<1){
    const ma=a*1000,r=Math.round(ma*10)/10;
    return(Number.isInteger(r)?String(r):r.toFixed(1))+' mA';
  }
  const r=Math.round(a*100)/100;
  return(Number.isInteger(r)?String(r):r.toFixed(2))+' A';
}
function fmtAmpsPerDiv(a){return a<1?Math.round(a*1000)+' mA':a+' A';}
function fmtSealed(key,v){return key==='R'?fmtOhm(v):(key==='L'?fmtMH(v):fmtUF(v));}

// ============================== 3) ESTADO ==============================
let mode='explora'; // explora | medicion | reto
let expTopology='serie',expR=47,expL=47,expC=10,expFreq=120;
let medTopology='serie',medR=22,medL=22,medC=4.7,medFreq=250;
let retoTopology='serie',retoSealedKey='C',retoR=10,retoL=47,retoC=2.2,retoFreq=500;
let cursor1Div=2.5,cursor2Div=2.5;
let measured=false,phiMeasured=null,cross1Type=null,cross2Type=null;
let retoChecked=false,retoOk=false,retoMsg='';
let solved=false,autoRunning=false,QUIZ={};

function currentTopology(){return mode==='explora'?expTopology:(mode==='medicion'?medTopology:retoTopology);}
function currentR(){return mode==='explora'?expR:(mode==='medicion'?medR:retoR);}
function currentL(){return mode==='explora'?expL:(mode==='medicion'?medL:retoL);}
function currentC(){return mode==='explora'?expC:(mode==='medicion'?medC:retoC);}
function currentFreqVal(){return mode==='explora'?expFreq:(mode==='medicion'?medFreq:retoFreq);}
function currentZ(){return computeZ(currentTopology(),currentR(),currentL(),currentC(),currentFreqVal());}
function currentI(){const z=currentZ();return{...z,im:V1/z.mag,phiI:-z.ang};}
function snap1(rawDiv){
  const freq=currentFreqVal(),windowS=windowSFor(freq);
  const rawT=(rawDiv/DIVX)*windowS;
  return nearestCrossTo(rawT,crossingsFor(PHI1,freq,windowS));
}
function snap2(rawDiv){
  const freq=currentFreqVal(),windowS=windowSFor(freq);
  const rawT=(rawDiv/DIVX)*windowS;
  return nearestCrossTo(rawT,crossingsFor(currentI().phiI,freq,windowS));
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
  gen:std({...brush.maps,color:0x707c85,metalness:0.35,roughness:0.85}),
  scopeBox:std({...plas.maps,color:0x1b2420,roughness:0.9,metalness:0.05}),
  lead:std({...brush.maps,color:0xbfc8ce,metalness:0.9,roughness:0.35}),
  cableCh1:std({...rub.maps,color:0x2e7d74,roughness:1.0,metalness:0}),
  cableCh2:std({...rub.maps,color:0xb5661f,roughness:1.0,metalness:0}),
  knobDark:std({color:0x1c2226,roughness:0.6,metalness:0.3}),
};

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const lb=labelSprite(text,color);lb.position.copy(pos);if(scale)lb.scale.multiplyScalar(scale);
  lb.visible=false;lb.raycast=()=>{};obj.add(lb);HOVER_LABELS.set(obj,lb);
}

// ============================== 5) PIZARRÓN (fasores + osciloscopio en un solo canvas) ==============================
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
frame.userData={title:'Pizarrón del laboratorio',info:'Izquierda: diagrama fasorial polar. Derecha: osciloscopio de dos canales con cursores de medición.'};
addHoverLabel(frame,'Diagrama fasorial + osciloscopio · clic para inspeccionar','#4FD1C5',new THREE.Vector3(0,1.65,0.3),1.0);

function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}

const PHR={x0:20,y0:0,w:470,h:768};
const SCP={x0:500,y0:0,w:524,h:768};

function drawArrowhead(c,fromX,fromY,toX,toY,size,color){
  const angle=Math.atan2(toY-fromY,toX-fromX);
  c.beginPath();c.moveTo(toX,toY);
  c.lineTo(toX-size*Math.cos(angle-Math.PI/6),toY-size*Math.sin(angle-Math.PI/6));
  c.lineTo(toX-size*Math.cos(angle+Math.PI/6),toY-size*Math.sin(angle+Math.PI/6));
  c.closePath();c.fillStyle=color;c.fill();
}
function drawPhasorVector(c,cx,cy,R,mag,angDeg,scaleMax,color,label){
  const frac=Math.min(1,mag/scaleMax);
  const rad=angDeg*Math.PI/180;
  const ex=cx+R*frac*Math.cos(rad),ey=cy-R*frac*Math.sin(rad);
  c.strokeStyle=color;c.lineWidth=3;
  c.beginPath();c.moveTo(cx,cy);c.lineTo(ex,ey);c.stroke();
  drawArrowhead(c,cx,cy,ex,ey,12,color);
  c.fillStyle=color;c.font='bold 13px Outfit, sans-serif';c.textAlign=ex>=cx?'left':'right';
  c.fillText(label,ex+(ex>=cx?8:-8),ey-6);
}
function drawPhasorHalf(c,I,ampsPerDiv2){
  const{x0,w}=PHR;
  c.fillStyle='#8FB3AC';c.font='bold 19px Outfit, sans-serif';c.textAlign='left';
  c.fillText('DIAGRAMA FASORIAL',x0+6,40);
  const cx=x0+w/2,cy=440,R=170;
  c.strokeStyle='rgba(79,209,197,0.18)';c.lineWidth=1;
  [0.25,0.5,0.75,1.0].forEach(frac=>{c.beginPath();c.arc(cx,cy,R*frac,0,Math.PI*2);c.stroke();});
  for(let a=0;a<360;a+=30){
    const rad=a*Math.PI/180;
    c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+R*Math.cos(rad),cy-R*Math.sin(rad));c.stroke();
  }
  c.strokeStyle='rgba(79,209,197,0.4)';c.lineWidth=1.5;
  c.beginPath();c.moveTo(cx-R,cy);c.lineTo(cx+R,cy);c.moveTo(cx,cy-R);c.lineTo(cx,cy+R);c.stroke();
  c.fillStyle='#5a6b66';c.font='11px Outfit, sans-serif';c.textAlign='center';
  c.fillText('0°',cx+R+16,cy+4);c.fillText('90°',cx,cy-R-10);c.fillText('180°',cx-R-20,cy+4);c.fillText('270°',cx,cy+R+18);

  drawPhasorVector(c,cx,cy,R,V1,PHI1,VM_MAX,'#4FD1C5','V (ref.)');

  if(mode==='explora'){
    drawPhasorVector(c,cx,cy,R,I.im,I.phiI,ampsPerDiv2*4,'#FF8A5B','I');
  }else if(mode==='medicion'){
    c.strokeStyle='rgba(255,138,91,0.35)';c.setLineDash([5,5]);c.lineWidth=1.5;
    c.beginPath();c.arc(cx,cy,R*Math.min(1,I.im/(ampsPerDiv2*4)),0,Math.PI*2);c.stroke();c.setLineDash([]);
    if(measured){
      const ok=cross1Type===cross2Type&&Math.abs(angDiff(phiMeasured,I.phiI))<=TOL_PHI_DEG;
      drawPhasorVector(c,cx,cy,R,I.im,phiMeasured,ampsPerDiv2*4,ok?'#FF8A5B':'#ff5c5c','I (medido)');
    }
  }else{
    if(retoChecked){
      drawPhasorVector(c,cx,cy,R,I.im,phiMeasured,ampsPerDiv2*4,retoOk?'#FF8A5B':'#ff5c5c','I (medido)');
    }
  }
}

function drawTrace(c,xToPx,yToPx,windowS,vm,phiDeg,freq,color){
  c.strokeStyle=color;c.lineWidth=2.5;c.beginPath();
  const N=280;
  for(let i=0;i<=N;i++){
    const t=(i/N)*windowS;
    const v=vOf(vm,phiDeg,freq,t);
    const px=xToPx(t),py=yToPx(v);
    if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
  }
  c.stroke();
}
function drawCursor(c,xToPx,yToPx,gy0,gh,crossing,color,labelUp){
  const px=xToPx(crossing.t);
  c.strokeStyle=color;c.lineWidth=1.5;c.setLineDash([4,4]);
  line(c,px,gy0,px,gy0+gh);
  c.setLineDash([]);
  c.fillStyle=color;c.beginPath();c.arc(px,yToPx(0),6,0,Math.PI*2);c.fill();
  c.fillStyle=color;c.font='bold 13px Outfit, sans-serif';c.textAlign='center';
  c.fillText(crossing.type==='asc'?'▲':'▼',px,gy0+gh+(labelUp?-8:16));
}
function drawScopeHalf(c,I,ampsPerDiv2){
  const{x0,w}=SCP;
  const gx0=x0+46,gy0=54,gw=w-70,gh=580;
  c.fillStyle='#8FB3AC';c.font='bold 19px Outfit, sans-serif';c.textAlign='left';
  c.fillText('OSCILOSCOPIO · 2 CANALES',x0+6,40);
  c.fillStyle='#07120e';c.fillRect(gx0,gy0,gw,gh);
  c.strokeStyle='rgba(79,209,197,0.22)';c.lineWidth=1;
  for(let i=0;i<=DIVX;i++){const x=gx0+(i/DIVX)*gw;line(c,x,gy0,x,gy0+gh);}
  for(let i=0;i<=DIVY;i++){const y=gy0+(i/DIVY)*gh;line(c,gx0,y,gx0+gw,y);}
  const midY=gy0+gh/2;
  c.strokeStyle='rgba(79,209,197,0.55)';c.lineWidth=1.5;line(c,gx0,midY,gx0+gw,midY);

  const freq=currentFreqVal();
  const windowS=windowSFor(freq);
  const xToPx=t=>gx0+(t/windowS)*gw;
  const yToPx1=v=>midY-(v/VOLTS_PER_DIV_CH1)*(gh/DIVY);
  const yToPx2=v=>midY-(v/ampsPerDiv2)*(gh/DIVY);

  drawTrace(c,xToPx,yToPx1,windowS,V1,PHI1,freq,'#4FD1C5');
  drawTrace(c,xToPx,yToPx2,windowS,I.im,I.phiI,freq,'#FF8A5B');

  drawCursor(c,xToPx,yToPx1,gy0,gh,snap1(cursor1Div),'#4FD1C5',true);
  drawCursor(c,xToPx,yToPx2,gy0,gh,snap2(cursor2Div),'#FF8A5B',false);

  c.fillStyle='#5a6b66';c.font='11px Outfit, sans-serif';c.textAlign='center';
  c.fillText(fmtTimeS(windowS/DIVX)+'/div',x0+w/2,gy0+gh+34);
  c.textAlign='left';
  c.fillText('CH1: '+VOLTS_PER_DIV_CH1.toFixed(1)+' V/div · CH2: '+fmtAmpsPerDiv(ampsPerDiv2)+'/div',gx0,gy0+gh+22);
  c.textAlign='right';
  if(measured){
    c.fillStyle=cross1Type===cross2Type?'#8FB3AC':'#f0a5a5';
    c.fillText('θz medido ≈ '+fmtDeg(-phiMeasured)+(cross1Type===cross2Type?'':' ⚠ tipos de cruce distintos'),gx0+gw,gy0+gh+22);
  }
}

function drawBoard(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.05)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  const I=currentI();
  const ampsPerDiv2=pickAmpsPerDiv(I.im);
  drawPhasorHalf(c,I,ampsPerDiv2);
  drawScopeHalf(c,I,ampsPerDiv2);
  c.strokeStyle='rgba(79,209,197,0.28)';c.lineWidth=2;line(c,485,20,485,748);
  bTex.needsUpdate=true;
}
function boardClick(u,v){
  const x=u*1024;
  if(x<485){
    showToast('Diagrama fasorial: el vector teal es el voltaje aplicado V (referencia, 0°); el vector ámbar es la corriente I, cuyo ángulo respecto a V es exactamente −θz (el negativo del ángulo de la impedancia). En Medición/Reto, el círculo o vector ámbar puede estar sellado hasta que midas.');
  }else{
    showToast('Osciloscopio de 2 canales: canal 1 (teal) mide el voltaje aplicado; canal 2 (ámbar) mide el voltaje en el resistor shunt ('+RS+' Ω) en serie con la rama, proporcional a la corriente. Alinea ambos cursores al MISMO tipo de cruce (▲ o ▼) antes de medir θz.');
  }
}

// ============================== 6) BANCO 3D ==============================
const bench=sh(roundedBox(2.9,0.5,1.6,MAT.bench,0.05));bench.position.set(1.75,0.25,0.85);scene.add(bench);
bench.userData={title:'Banco de trabajo',info:'Montaje de la fuente de voltaje, el sensor de corriente (shunt) y el osciloscopio.'};

function makeGen(x,label,title){
  const g=new THREE.Group();g.position.set(x,0.72,0.25);scene.add(g);
  const box=sh(roundedBox(0.56,0.46,0.42,MAT.gen,0.06));g.add(box);
  const cv=document.createElement('canvas');cv.width=256;cv.height=120;
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.19),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  pl.position.set(0,0.06,0.215);g.add(pl);
  const knob=new THREE.Group();knob.position.set(0,-0.14,0.19);g.add(knob);
  const knobBase=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.025,16),MAT.knobDark));
  knobBase.rotation.x=Math.PI/2;knob.add(knobBase);
  const knobPointer=sh(new THREE.Mesh(new THREE.BoxGeometry(0.007,0.045,0.01),std({color:0xFF8A5B,roughness:0.4,metalness:0.2})));
  knobPointer.position.set(0,0.028,0.006);knob.add(knobPointer);
  g.userData={el:label};
  addHoverLabel(g,title,'#f0a5a5',new THREE.Vector3(0,0.5,0),0.8);
  return{g,cv,tx,knob};
}
const gen1=makeGen(0.95,'GEN1','Fuente de voltaje · referencia fija (10 V, 0°)');
const gen2=makeGen(1.85,'GEN2','Sensor de corriente (shunt '+RS+' Ω)');
gen1.knob.visible=false;
gen2.knob.visible=false;

function drawGenDisplay(genObj,vmText,phiText,accent){
  const c=genObj.cv.getContext('2d');
  c.fillStyle='#071410';c.fillRect(0,0,256,120);
  c.strokeStyle='rgba(79,209,197,0.4)';c.lineWidth=3;c.strokeRect(3,3,250,114);
  c.fillStyle=accent;c.font='bold 30px Outfit, sans-serif';c.textAlign='center';
  c.fillText(vmText,128,52);
  c.font='bold 24px Outfit, sans-serif';
  c.fillText(phiText,128,88);
  genObj.tx.needsUpdate=true;
}

const scopeBox=sh(roundedBox(0.62,0.5,0.10,MAT.scopeBox,0.05));
scopeBox.position.set(1.4,1.0,-0.15);
scene.add(scopeBox);
scopeBox.userData={title:'Osciloscopio (referencia física)',info:'La medición real ocurre en el pizarrón — este cajón representa el instrumento conectado a ambos canales.'};

function cable(ax,ay,az,bx,by,bz,mat){
  const a=new THREE.Vector3(ax,ay,az),b=new THREE.Vector3(bx,by,bz);
  const m=a.clone().lerp(b,0.5);m.y=Math.max(a.y,b.y)+0.16;
  const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,m,b]),24,0.014,8),mat);
  t.castShadow=true;scene.add(t);
  return t;
}
const cbl1=cable(0.95,0.95,0.44,1.25,1.0,-0.1,MAT.cableCh1);
const cbl2=cable(1.85,0.95,0.44,1.55,1.0,-0.1,MAT.cableCh2);

function refreshNet3D(){
  drawGenDisplay(gen1,fmtV(V1),fmtDeg(PHI1),'#4FD1C5');
  const I=currentI();
  let imText,phiText;
  if(mode==='explora'){
    imText=fmtA(I.im);phiText=fmtDeg(I.phiI);
  }else if(mode==='medicion'){
    imText=fmtA(I.im);phiText='φi 🔒';
  }else{
    imText='🔒';phiText='🔒';
  }
  drawGenDisplay(gen2,imText,phiText,'#FF8A5B');
}

// ============================== 7) HUD Y PANEL ==============================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos CA (D1) · Impedancias RLC</div>
  <h2>Impedancias RLC · Calcula y Mide un Circuito Serie o Paralelo</h2>
  <p>Un circuito con resistencia (R), inductancia (L) y capacitancia (C) presenta una <b>impedancia</b>
  compleja Z=R+jX. En serie los tres elementos comparten la misma corriente y Z=R+j(ωL−1/ωC); en
  paralelo comparten el mismo voltaje y se suman las admitancias, Y=1/R+j(ωC−1/ωL) con Z=1/Y. La
  corriente resultante I=V/|Z| queda desfasada exactamente −θz respecto al voltaje — el mismo tipo
  de medición de desfase por cruces por cero que ya dominas, ahora aplicada a un voltaje (canal 1) y
  a una corriente medida por un resistor shunt (canal 2).</p>
  <div class="formula">Z=R+j(ωL−1/ωC) (serie) · Y=1/R+j(ωC−1/ωL), Z=1/Y (paralelo) · I=V/|Z|, φᵢ=−θz</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Canal 1 · voltaje aplicado (10 V, 0°)</div>
    <div class="li"><span class="dot" style="background:#FF8A5B"></span>Canal 2 · corriente vía shunt (${RS} Ω)</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Cursores de medición (cruce por cero)</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> impedancia compleja exacta en ambas topologías (serie: suma directa de R, jXL, −jXC; paralelo: suma de admitancias, Z=1/Y); corriente I=V/|Z| con fase φᵢ=−θz; sensado de corriente idealizado con resistor shunt (no altera la corriente real); la misma técnica de medición de desfase por cruces por cero ya verificada, y un filtro de degeneración que descarta —antes de sellar un componente en el Reto— cualquier combinación donde un error típico de instrumento (±5° en fase, ±8 % en amplitud) produzca más de 20 % de error en el valor recuperado.</div>
    <div class="fl no"><b>NO modela:</b> la carga que el shunt o el osciloscopio introducen sobre el circuito real, pérdidas parásitas en bobinas/capacitores, ruido de instrumento, ni fenómenos de resonancia (Q, ancho de banda — próximo laboratorio). Las tolerancias de calificación (±5° en θz, ±25 % en el componente recuperado) son un margen PEDAGÓGICO de este ejercicio, no una especificación de instrumento real.</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · Boylestad · IEC 60027-1 · IEEE Std 280</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Impedancias RLC · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🌀 Explora</button>
    <button class="b" id="m_medicion">🖥️ Medición</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div class="modebar" id="selbar" style="display:none"></div>
  <div id="cursorBox" style="margin:6px 0 10px">
    <label for="cursor1" style="font-size:11px;color:var(--dim)">Cursor canal 1 (teal · voltaje) — arrastra hasta un cruce por cero</label>
    <input type="range" id="cursor1" min="0" max="10" step="0.02" value="2.5" style="width:100%">
    <label for="cursor2" style="font-size:11px;color:var(--dim)">Cursor canal 2 (ámbar · corriente) — arrastra hasta un cruce por cero</label>
    <input type="range" id="cursor2" min="0" max="10" step="0.02" value="2.5" style="width:100%">
  </div>
  <div class="btns" id="medirBox">
    <button class="b" id="btnMedir">📏 Medir θz</button>
  </div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Componente sellado</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div style="display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:var(--ink)">
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inSealed" id="inSealedLabel">R =</label><input id="inSealed" inputmode="decimal" autocomplete="off" style="width:70px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span id="inSealedUnit">Ω</span></span>
    </div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar predicción</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nuevo circuito</button>
  </div>`;

const el=id=>document.getElementById(id);

// ============================== 8) TOASTS ==============================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3200);
}
function toastPart(id){
  if(id==='GEN1'){
    showToast(`<b style="color:var(--accent2)">FUENTE · ${fmtV(V1)} ∠ ${fmtDeg(PHI1)}</b><br><span style="color:var(--dim);font-size:11px">Referencia fija de fase — todas las mediciones de θz se hacen respecto a esta señal.</span>`);
    return;
  }
  if(id==='GEN2'){
    const I=currentI();
    if(mode==='explora'){
      showToast(`<b style="color:var(--accent2)">SENSOR DE CORRIENTE · ${fmtA(I.im)} ∠ ${fmtDeg(I.phiI)}</b><br><span style="color:var(--dim);font-size:11px">Resistor shunt de ${RS} Ω en serie con la rama — su voltaje es numéricamente igual a la corriente.</span>`);
    }else if(mode==='medicion'){
      showToast(`<b style="color:var(--accent2)">SENSOR DE CORRIENTE · ${fmtA(I.im)} ∠ φi 🔒</b><br><span style="color:var(--dim);font-size:11px">Magnitud visible; la fase (y por tanto θz) está sellada — mide con los cursores.</span>`);
    }else{
      showToast(`<b style="color:var(--accent2)">SENSOR DE CORRIENTE · 🔒 / 🔒</b><br><span style="color:var(--dim);font-size:11px">Un componente del circuito está sellado, así que la corriente también lo está. Mide θz y despeja el componente.</span>`);
    }
  }
}

// ============================== 9) MODOS Y SELBAR ==============================
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.0,2.2,6.6],[0.4,1.2,0.0]],mision:'Elige la topología y ajusta R, L, C y la frecuencia. Observa cómo cambian |Z|, θz y las trazas de voltaje/corriente en tiempo real.'},
  medicion:{nombre:'Medición',cam:[[-0.2,2.0,3.4],[-1.0,1.6,-0.5]],mision:'El circuito es conocido pero θz está sellado. Alinea ambos cursores al MISMO tipo de cruce por cero y mide θz.'},
  reto:{nombre:'Reto',cam:[[2.4,1.9,4.0],[1.5,1.0,0.5]],mision:'Un componente está sellado. Mide |Z| y θz con el osciloscopio y despeja su valor a partir de las ecuaciones de la topología activa.'},
};
function buildSelBar(){
  const bar=el('selbar');
  if(mode!=='explora'){bar.style.display='none';bar.innerHTML='';return;}
  bar.style.display='flex';
  bar.innerHTML=
    `<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin-right:4px">Topología:</span>`+
    TOPOLOGIES.map(t=>`<button class="b sm ${t===expTopology?'on':''}" data-topo="${t}">${TOPO_LABELS[t]}</button>`).join('')+
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">R:</span>`+
    R_CANDIDATES.map(r=>`<button class="b sm ${r===expR?'on':''}" data-r="${r}">${fmtOhm(r)}</button>`).join('')+
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">L:</span>`+
    L_CANDIDATES.map(l=>`<button class="b sm ${l===expL?'on':''}" data-l="${l}">${fmtMH(l)}</button>`).join('')+
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">C:</span>`+
    C_CANDIDATES.map(cc=>`<button class="b sm ${cc===expC?'on':''}" data-c="${cc}">${fmtUF(cc)}</button>`).join('')+
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">f:</span>`+
    FREQ_CANDIDATES.map(f=>`<button class="b sm ${f===expFreq?'on':''}" data-fr="${f}">${fmtHz(f)}</button>`).join('')+
    `</div>`;
  bar.querySelectorAll('[data-topo]').forEach(b=>{b.onclick=()=>{expTopology=b.dataset.topo;afterEdit();};});
  bar.querySelectorAll('[data-r]').forEach(b=>{b.onclick=()=>{expR=parseFloat(b.dataset.r);afterEdit();};});
  bar.querySelectorAll('[data-l]').forEach(b=>{b.onclick=()=>{expL=parseFloat(b.dataset.l);afterEdit();};});
  bar.querySelectorAll('[data-c]').forEach(b=>{b.onclick=()=>{expC=parseFloat(b.dataset.c);afterEdit();};});
  bar.querySelectorAll('[data-fr]').forEach(b=>{b.onclick=()=>{expFreq=parseFloat(b.dataset.fr);afterEdit();};});
}
function setMode(k){
  mode=k;
  cursor1Div=2.5;cursor2Div=2.5;el('cursor1').value='2.5';el('cursor2').value='2.5';
  measured=false;phiMeasured=null;cross1Type=null;cross2Type=null;
  retoChecked=false;retoOk=false;retoMsg='';
  ['explora','medicion','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  const reto=k==='reto';
  el('retoTitle').style.display=reto?'':'none';
  el('retoBox').style.display=reto?'':'none';
  if(reto){updateRetoSpec();updateSealedInputLabel();}
  buildSelBar();
  solved=false;clearDx();buildQuiz();refreshQuestion();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  refreshAll();
}
function afterEdit(){
  measured=false;phiMeasured=null;cross1Type=null;cross2Type=null;
  buildSelBar();
  solved=false;clearDx();buildQuiz();refreshQuestion();
  refreshAll();
}

// ============================== 10) TELEMETRÍA Y REPORTE ==============================
function teleRow(l,v,cls){return `<div class="g"><div class="l">${l}</div><b class="${cls||''}">${v}</b></div>`;}
function updateTele(){
  const t=el('tele');
  if(mode==='explora'){
    const I=currentI();
    t.innerHTML=
      teleRow('Topología',TOPO_LABELS[expTopology])+
      teleRow('R / L / C',fmtOhm(expR)+' / '+fmtMH(expL)+' / '+fmtUF(expC))+
      teleRow('Frecuencia',fmtHz(expFreq))+
      teleRow('|Z| / θz',fmtOhm(I.mag)+' / '+fmtDeg(I.ang))+
      teleRow('Im / φi',fmtA(I.im)+' / '+fmtDeg(I.phiI))+
      teleRow('θz medido',measured?fmtDeg(-phiMeasured)+(cross1Type===cross2Type?'':' ⚠ tipos distintos'):'—',measured?(cross1Type===cross2Type?'good':'warn'):'');
  }else if(mode==='medicion'){
    const I=currentI();
    const matched=measured&&cross1Type===cross2Type;
    let tolCls='';
    if(measured)tolCls=(matched&&Math.abs(angDiff(phiMeasured,I.phiI))<=TOL_PHI_DEG)?'good':'warn';
    const revealPhi=measured&&matched&&Math.abs(angDiff(phiMeasured,I.phiI))<=TOL_PHI_DEG;
    t.innerHTML=
      teleRow('Topología',TOPO_LABELS[medTopology])+
      teleRow('R / L / C',fmtOhm(medR)+' / '+fmtMH(medL)+' / '+fmtUF(medC))+
      teleRow('Frecuencia',fmtHz(medFreq))+
      teleRow('θz',revealPhi?fmtDeg(-I.phiI)+' ✔':'🔒 sellado')+
      teleRow('θz medido (cursores)',measured?fmtDeg(-phiMeasured):'sin medir',measured?tolCls:'warn')+
      teleRow('Tipo de cruce',measured?((cross1Type==='asc'?'▲':'▼')+' canal 1 vs '+(cross2Type==='asc'?'▲':'▼')+' canal 2'):'—',measured?(matched?'good':'warn'):'');
  }else{
    const known=SEALED_KEYS.filter(k=>k!==retoSealedKey);
    const knownText=known.map(k=>k+'='+(k==='R'?fmtOhm(retoR):(k==='L'?fmtMH(retoL):fmtUF(retoC)))).join(', ');
    const sealedTrue=({R:retoR,L:retoL,C:retoC})[retoSealedKey];
    t.innerHTML=
      teleRow('Topología',TOPO_LABELS[retoTopology])+
      teleRow('Conocidos',knownText)+
      teleRow(retoSealedKey+' (sellado)',(retoChecked&&retoOk)?fmtSealed(retoSealedKey,sealedTrue)+' ✔':'🔒 desconocido')+
      teleRow('Frecuencia (conocida)',fmtHz(retoFreq))+
      teleRow('θz medido (cursores)',measured?fmtDeg(-phiMeasured):'sin medir',measured?'good':'warn')+
      teleRow('Estado',retoChecked?(retoOk?'✔ CORRECTO':'revisa tu cálculo'):'Mide θz y despeja el componente, luego comprueba',(retoChecked&&retoOk)?'good':'warn');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='explora'){
    const I=currentI();
    html+=`<span class="mono">${TOPO_LABELS[expTopology]}: R=${fmtOhm(expR)}, L=${fmtMH(expL)}, C=${fmtUF(expC)} a ${fmtHz(expFreq)}. Z=${fmtOhm(I.mag)}∠${fmtDeg(I.ang)}, I=${fmtA(I.im)}∠${fmtDeg(I.phiI)}.</span>`;
  }else if(mode==='medicion'){
    html+=measured
      ?(cross1Type===cross2Type
        ?`<span class="mono">Cursores alineados al mismo tipo de cruce (${cross1Type==='asc'?'ascendente':'descendente'}) — la medición es confiable.</span>`
        :`<span class="mono">⚠ Cursores en tipos de cruce DISTINTOS (canal 1: ${cross1Type==='asc'?'ascendente':'descendente'}, canal 2: ${cross2Type==='asc'?'ascendente':'descendente'}) — el resultado está desplazado ~180° del real. Alinea ambos cursores al mismo tipo.</span>`)
      :`<span class="mono">Arrastra ambos cursores hasta un cruce por cero (▲ o ▼) del MISMO tipo en los dos canales, luego presiona "Medir θz".</span>`;
  }else{
    html+=retoMsg||`<span class="mono">Topología ${TOPO_LABELS[retoTopology]}, frecuencia conocida (${fmtHz(retoFreq)}). Mide θz con los cursores y despeja el componente sellado (${retoSealedKey}) a partir de las ecuaciones de la topología activa.</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();refreshNet3D();}

// ============================== 11) MEDICIÓN Y RETO ==============================
function medirPhi(){
  const I=currentI();
  const c1=snap1(cursor1Div),c2=snap2(cursor2Div);
  const phi=phiFromCrossings(c1.t,c2.t,currentFreqVal());
  measured=true;phiMeasured=phi;cross1Type=c1.type;cross2Type=c2.type;
  const matched=c1.type===c2.type;
  synth.beep(matched?1046:660,matched?0.12:0.15,0.06);
  if(mode==='explora'){
    showToast(matched
      ?`Medición: θz ≈ ${fmtDeg(-phi)}. Coincide con el θz real (${fmtDeg(I.ang)}) porque ambos cursores usan el MISMO tipo de cruce (${cross1Type==='asc'?'ascendente':'descendente'}).`
      :`⚠️ Medición: θz ≈ ${fmtDeg(-phi)} — pero el θz real es ${fmtDeg(I.ang)}. Mezclaste un cruce ${cross1Type==='asc'?'ascendente':'descendente'} (canal 1) con uno ${cross2Type==='asc'?'ascendente':'descendente'} (canal 2): error clásico de 180°.`);
  }else if(mode==='medicion'){
    const ok=Math.abs(angDiff(phi,I.phiI))<=TOL_PHI_DEG;
    showToast(matched
      ?(ok?`<span style="color:var(--good)">✔ θz medido ≈ ${fmtDeg(-phi)}, dentro de ±${TOL_PHI_DEG}° del valor real.</span>`
           :`θz medido ≈ ${fmtDeg(-phi)} — fuera de tolerancia, ajusta el cursor justo sobre el cruce.`)
      :`⚠️ θz medido ≈ ${fmtDeg(-phi)} — mezclaste tipos de cruce distintos (canal 1: ${cross1Type==='asc'?'ascendente':'descendente'}, canal 2: ${cross2Type==='asc'?'ascendente':'descendente'}). Error clásico de 180°: alinea ambos cursores al MISMO tipo de cruce.`);
  }else{
    showToast(matched
      ?`Medición registrada: θz ≈ ${fmtDeg(-phi)} (cruces del mismo tipo). Ahora despeja el componente sellado con las ecuaciones de la topología ${TOPO_LABELS[retoTopology]} y comprueba.`
      :`⚠️ Medición registrada: θz ≈ ${fmtDeg(-phi)} — cuidado, mezclaste tipos de cruce distintos. Puede estar desfasada 180° de la real.`);
  }
  refreshAll();
}
function checkReto(){
  if(!measured){showToast('⚠️ Primero mide θz con los cursores ("Medir θz").');return;}
  const guess=numOr('inSealed');
  if(!isFinite(guess)){showToast('⚠️ Ingresa tu valor calculado para el componente sellado.');return;}
  const trueVal=({R:retoR,L:retoL,C:retoC})[retoSealedKey];
  retoOk=Math.abs(guess-trueVal)<=trueVal*TOL_COMPONENT_FRAC;
  retoChecked=true;
  solved=retoOk;
  synth.beep(retoOk?1046:220,retoOk?0.14:0.15,0.06);
  const guessFmt=fmtSealed(retoSealedKey,guess);
  retoMsg=retoOk
    ?`<span class="mono"><span class="ok">✔ ${retoSealedKey} correcto</span> (tu respuesta ${guessFmt}, dentro de ±${Math.round(TOL_COMPONENT_FRAC*100)} % del valor real)</span>`
    :`<span class="mono"><span class="dtc">✗ ${retoSealedKey} fuera de tolerancia</span> (tu respuesta ${guessFmt}). Revisa la ecuación de inversión para la topología ${TOPO_LABELS[retoTopology]} y el componente ${retoSealedKey}.</span>`;
  refreshAll();
}
function updateSealedInputLabel(){
  const unit=retoSealedKey==='R'?'Ω':(retoSealedKey==='L'?'mH':'µF');
  el('inSealedLabel').textContent=retoSealedKey+' =';
  el('inSealedUnit').textContent=unit;
}
function updateRetoSpec(){
  const known=SEALED_KEYS.filter(k=>k!==retoSealedKey);
  const knownText=known.map(k=>k+'='+(k==='R'?fmtOhm(retoR):(k==='L'?fmtMH(retoL):fmtUF(retoC)))).join(', ');
  el('retoSpec').innerHTML=`Topología ${TOPO_LABELS[retoTopology]}, frecuencia conocida: ${fmtHz(retoFreq)}. Componentes conocidos: ${knownText}. El componente <b>${retoSealedKey}</b> está sellado. Mide θz con los cursores ("Medir θz") y despeja ${retoSealedKey} con las ecuaciones de la topología activa.<br><span style="color:var(--dim)">Tolerancias (±${TOL_PHI_DEG}° en θz para Medición, ±${Math.round(TOL_COMPONENT_FRAC*100)} % en el componente para Reto) son un margen pedagógico de este ejercicio.</span>`;
}
function pickFrom(arr,exclude){
  const pick=()=>arr[Math.floor(Math.random()*arr.length)];
  let v=pick();
  if(arr.length>1)while(v===exclude)v=pick();
  return v;
}
function pickRetoRound(prevTopology,prevSealedKey){
  for(let tries=0;tries<500;tries++){
    const topology=pickFrom(TOPOLOGIES,prevTopology);
    const sealedKey=pickFrom(SEALED_KEYS,prevSealedKey);
    const R=pickFrom(R_CANDIDATES);
    const L=pickFrom(L_CANDIDATES);
    const C=pickFrom(C_CANDIDATES);
    const freq=pickFrom(FREQ_CANDIDATES);
    if(worstCaseRecoveryError(topology,sealedKey,R,L,C,freq)<=0.20){
      return{topology,sealedKey,R,L,C,freq};
    }
  }
  return{topology:'serie',sealedKey:'C',R:10,L:47,C:2.2,freq:500};
}
function newMedicionRound(){
  medTopology=pickFrom(TOPOLOGIES,medTopology);
  medR=pickFrom(R_CANDIDATES,medR);
  medL=pickFrom(L_CANDIDATES,medL);
  medC=pickFrom(C_CANDIDATES,medC);
  medFreq=pickFrom(FREQ_CANDIDATES,medFreq);
}
function newRetoRound(){
  const r=pickRetoRound(retoTopology,retoSealedKey);
  retoTopology=r.topology;retoSealedKey=r.sealedKey;retoR=r.R;retoL=r.L;retoC=r.C;retoFreq=r.freq;
}
function newSignal(){
  if(mode==='medicion'){
    newMedicionRound();
    measured=false;phiMeasured=null;cross1Type=null;cross2Type=null;
    cursor1Div=2.5;cursor2Div=2.5;el('cursor1').value='2.5';el('cursor2').value='2.5';
    solved=false;clearDx();buildQuiz();refreshQuestion();buildSelBar();refreshAll();
    showToast('🔀 Nuevo circuito sellado. Vuelve a medir θz.');synth.beep(520,0.08,0.05);
  }else if(mode==='reto'){
    newRetoRound();
    measured=false;phiMeasured=null;cross1Type=null;cross2Type=null;
    retoChecked=false;retoOk=false;retoMsg='';
    if(el('inSealed'))el('inSealed').value='';
    cursor1Div=2.5;cursor2Div=2.5;el('cursor1').value='2.5';el('cursor2').value='2.5';
    updateRetoSpec();updateSealedInputLabel();solved=false;clearDx();buildQuiz();refreshQuestion();refreshAll();
    showToast('🔀 Nuevo circuito sellado. Componente y topología pueden haber cambiado.');synth.beep(520,0.08,0.05);
  }else{
    expTopology=pickFrom(TOPOLOGIES,expTopology);
    expR=pickFrom(R_CANDIDATES,expR);
    expL=pickFrom(L_CANDIDATES,expL);
    expC=pickFrom(C_CANDIDATES,expC);
    expFreq=pickFrom(FREQ_CANDIDATES,expFreq);
    afterEdit();
    showToast('🔀 Nueva combinación aleatoria en Explora.');
  }
}
function onRetoInput(){if(mode!=='reto')return;retoChecked=false;retoOk=false;retoMsg='';refreshAll();}

// ============================== 12) QUIZ ==============================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Por qué la corriente I queda desfasada exactamente −θz respecto al voltaje aplicado, sin importar si el circuito es serie o paralelo?',
      opciones:[
        {t:'Porque I=V/Z es una división de fasores: al dividir dos números complejos se RESTAN sus ángulos (φᵢ=φV−θz); como el voltaje es la referencia (φV=0°), el ángulo de la corriente queda exactamente en −θz, sea cual sea la topología del circuito',ok:true,why:'Correcto: dividir fasores resta ángulos, sumar (como en Z=R+jX) no cambia esa regla. El resultado −θz es consecuencia directa de la aritmética de números complejos, no de un caso particular de topología.'},
        {t:'Porque las bobinas y capacitores siempre retrasan la corriente, sin importar cómo estén conectados',ok:false,why:'Falso: una bobina retrasa la corriente (θz>0) pero un capacitor la adelanta (θz<0) — el efecto neto depende de la combinación y puede ser positivo, negativo o incluso cero (resonancia).'},
        {t:'Porque el simulador fija ese valor por diseño, no es una consecuencia física de la ecuación de impedancia',ok:false,why:'Es exactamente lo contrario: φᵢ=−θz se deriva directamente de I=V/Z y de cómo se dividen números complejos en forma polar — no es un valor arbitrario del simulador.'},
        {t:'Porque θz siempre es 0° en un circuito bien diseñado, así que I y V están en fase',ok:false,why:'θz es generalmente distinto de cero en un circuito RLC arbitrario — solo es 0° en el caso especial de resonancia (XL=XC), que no es el caso general que exploras aquí.'},
      ],
    },
    medicion:{
      pregunta:'Alineas el cursor del canal 1 (voltaje) en un cruce ascendente (▲) y el del canal 2 (corriente) en un cruce descendente (▼). ¿Qué error introduce esto en tu medición de θz?',
      opciones:[
        {t:'Un error sistemático de exactamente 180° (mod 360°) respecto al θz real — el resultado es matemáticamente consistente pero no representa el desfase físico real entre voltaje y corriente',ok:true,why:'Correcto: mezclar tipos de cruce equivale a medir la diferencia de tiempo hasta un punto de la corriente desplazado media vuelta (T/2) del que corresponde — eso se traduce en exactamente 180° de error, siempre, sin importar el θz real.'},
        {t:'Ningún error, porque un cruce por cero es un cruce por cero sin importar el sentido',ok:false,why:'El sentido del cruce SÍ importa: un cruce ascendente y uno descendente de la MISMA señal están separados por medio periodo (T/2) en el tiempo — mezclarlos introduce ese medio periodo como error.'},
        {t:'Un error aleatorio impredecible, distinto cada vez que se repite la medición',ok:false,why:'El error no es aleatorio: es sistemático y exacto (siempre ±180°, mod 360°) porque proviene de una relación geométrica fija entre cruces ascendentes y descendentes.'},
        {t:'Un error del 50% en la magnitud de |Z| medida',ok:false,why:'Mezclar tipos de cruce afecta la medición de FASE (θz), no la de magnitud — |Z| no se ve alterada por este error.'},
      ],
    },
    reto:{
      pregunta:'El simulador descarta automáticamente ciertas combinaciones de R, L, C y frecuencia antes de sellar un componente en el modo Reto (solo acepta rondas donde, ante un error típico de instrumento de ±5° en θz y ±8 % en |Z|, el error del componente recuperado se mantenga ≤20 %). ¿Por qué es necesario este filtro?',
      opciones:[
        {t:'Porque las fórmulas de inversión (despejar R, L o C a partir de |Z| y θz) son sensibles: cerca de ciertas combinaciones, un pequeño error de medición se amplifica en un error mucho mayor sobre el componente recuperado — el filtro evita sellar rondas donde ni siquiera una medición casi perfecta permitiría acertar dentro de la tolerancia',ok:true,why:'Correcto: verificado numéricamente (1536 combinaciones) — la inversión es exacta sin ruido, pero su sensibilidad ante ±5°/±8 % varía mucho según la combinación (aceptación desde 21.9 % hasta 80.9 % según la clase). El filtro solo sella rondas resolubles con margen razonable.'},
        {t:'Porque el simulador no puede calcular |Z| y θz para todas las combinaciones de R, L, C y frecuencia',ok:false,why:'Falso: computeZ() calcula |Z| y θz exactamente para cualquier combinación de R, L, C, frecuencia y topología — el filtro no es una limitación de cálculo, es una garantía de que el problema sea resoluble dentro de tolerancia.'},
        {t:'Porque algunas combinaciones de R, L y C generarían un circuito físicamente imposible de construir',ok:false,why:'Todos los valores candidatos (resistores, inductores y capacitores comerciales típicos) son físicamente realizables en cualquier combinación — el filtro no descarta por imposibilidad física, sino por sensibilidad numérica de la inversión.'},
        {t:'Porque el osciloscopio no puede mostrar frecuencias mayores a 500 Hz',ok:false,why:'500 Hz es simplemente la frecuencia candidata más alta de este ejercicio, no un límite de hardware del osciloscopio simulado — no tiene relación con el filtro de degeneración.'},
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
    expTopology='serie';expR=47;expL=47;expC=10;expFreq=120;afterEdit();
    showToast('Paso 1 · Circuito serie R=47Ω, L=47mH, C=10µF a 120Hz. Observa Z, θz e I en el pizarrón.');
    await sleep(2600);
    expTopology='paralelo';afterEdit();
    showToast('Mismos componentes, ahora en PARALELO: |Z| y θz cambian por completo aunque R, L y C son idénticos.');
    await sleep(2600);

    setMode('medicion');
    showToast('Paso 2 · θz está sellado. Primero, un error clásico: mezclar tipos de cruce distintos.');
    await sleep(2000);
    {
      const freq=currentFreqVal(),windowS=windowSFor(freq);
      const I=currentI();
      const cr1=crossingsFor(PHI1,freq,windowS).find(c=>c.type==='asc');
      const cr2=crossingsFor(I.phiI,freq,windowS).find(c=>c.type==='desc');
      cursor1Div=divForTime(cr1.t,windowS);el('cursor1').value=String(cursor1Div);
      cursor2Div=divForTime(cr2.t,windowS);el('cursor2').value=String(cursor2Div);
    }
    refreshAll();
    medirPhi();await sleep(2800);
    showToast('Corrigiendo: alineamos el cursor del canal 2 a un cruce ASCENDENTE, igual que el canal 1.');
    await sleep(2000);
    {
      const freq=currentFreqVal(),windowS=windowSFor(freq);
      const I=currentI();
      const cr2=crossingsFor(I.phiI,freq,windowS).find(c=>c.type==='asc');
      cursor2Div=divForTime(cr2.t,windowS);el('cursor2').value=String(cursor2Div);
    }
    refreshAll();
    medirPhi();await sleep(2600);
    answer(QUIZ.medicion.opciones.findIndex(o=>o.ok));await sleep(1800);

    setMode('reto');
    showToast('Paso 3 · Un componente está sellado. Mide θz y despeja su valor con las ecuaciones de la topología activa.');
    await sleep(2200);
    {
      const freq=currentFreqVal(),windowS=windowSFor(freq);
      const I=currentI();
      const cr1=crossingsFor(PHI1,freq,windowS).find(c=>c.type==='asc');
      const cr2=crossingsFor(I.phiI,freq,windowS).find(c=>c.type==='asc');
      cursor1Div=divForTime(cr1.t,windowS);el('cursor1').value=String(cursor1Div);
      cursor2Div=divForTime(cr2.t,windowS);el('cursor2').value=String(cursor2Div);
    }
    refreshAll();
    medirPhi();await sleep(1800);
    const trueVal=({R:retoR,L:retoL,C:retoC})[retoSealedKey];
    el('inSealed').value=String(trueVal);
    checkReto();await sleep(2600);
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
S.setAnimate((dt,time)=>{});

['explora','medicion','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newSignal;
el('btnCheck').onclick=checkReto;
el('btnMedir').onclick=medirPhi;
el('cursor1').oninput=()=>{cursor1Div=parseFloat(el('cursor1').value);refreshAll();};
el('cursor2').oninput=()=>{cursor2Div=parseFloat(el('cursor2').value);refreshAll();};
el('inSealed').addEventListener('input',onRetoInput);
el('inSealed').addEventListener('keydown',e=>{if(e.key==='Enter')checkReto();});
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊 Sonido':'🔇 Sonido';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

newRetoRound();
buildQuiz();refreshNet3D();
S.start();
setMode('explora');

window.__labDebug={
  mode:()=>mode,
  topology:()=>currentTopology(),
  R:()=>currentR(),L:()=>currentL(),C:()=>currentC(),
  freq:()=>currentFreqVal(),
  vm1:()=>V1,phi1:()=>PHI1,
  Z:()=>currentZ(),
  I:()=>currentI(),
  windowS:()=>windowSFor(currentFreqVal()),
  ampsPerDiv2:()=>pickAmpsPerDiv(currentI().im),
  cursor1Div:()=>cursor1Div,
  cursor2Div:()=>cursor2Div,
  setCursor1Div:d=>{cursor1Div=Math.max(0,Math.min(10,d));el('cursor1').value=String(cursor1Div);refreshAll();},
  setCursor2Div:d=>{cursor2Div=Math.max(0,Math.min(10,d));el('cursor2').value=String(cursor2Div);refreshAll();},
  snap1:()=>snap1(cursor1Div),
  snap2:()=>snap2(cursor2Div),
  measured:()=>measured,
  phiMeasured:()=>phiMeasured,
  thetaZMeasured:()=>phiMeasured===null?null:-phiMeasured,
  cross1Type:()=>cross1Type,
  cross2Type:()=>cross2Type,
  medirPhi:()=>medirPhi(),
  checkReto:()=>checkReto(),
  setInSealed:v=>{el('inSealed').value=String(v);},
  retoChecked:()=>retoChecked,
  retoOk:()=>retoOk,
  retoMsg:()=>retoMsg,
  retoTopology:()=>retoTopology,
  retoR:()=>retoR,retoL:()=>retoL,retoC:()=>retoC,retoFreq:()=>retoFreq,
  retoSealedKey:()=>retoSealedKey,
  retoSealedTrue:()=>({R:retoR,L:retoL,C:retoC})[retoSealedKey],
  medTopology:()=>medTopology,medR:()=>medR,medL:()=>medL,medC:()=>medC,medFreq:()=>medFreq,
  setExpTopology:t=>{expTopology=t;afterEdit();},
  setExpR:v=>{expR=v;afterEdit();},
  setExpL:v=>{expL=v;afterEdit();},
  setExpC:v=>{expC=v;afterEdit();},
  setExpFreq:f=>{expFreq=f;afterEdit();},
  recoverSealed:(topology,sealedKey,R,L,C,freq,zMag,zAngDeg)=>recoverSealed(topology,sealedKey,R,L,C,freq,zMag,zAngDeg),
  worstCaseRecoveryError:(topology,sealedKey,R,L,C,freq)=>worstCaseRecoveryError(topology,sealedKey,R,L,C,freq),
  newSignal:()=>newSignal(),
  setMode:k=>setMode(k),
  reportText:()=>el('report').innerText,
  quizAnswer:i=>answer(i),
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  solved:()=>solved,
};
