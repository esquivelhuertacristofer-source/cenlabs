/*
 * Fasores de Señales Senoidales — representa v(t)=Vm·sen(2π f t+φ) como un fasor V=Vm∠φ
 * y mide el desfase φ entre dos señales de la MISMA frecuencia con un osciloscopio de
 * dos canales, usando la técnica de instrumentación real: localizar el instante en que
 * cada señal cruza cero, en el MISMO sentido (ambas ascendentes o ambas descendentes),
 * y convertir la diferencia de tiempo a grados: φ = −Δt·360°/T.
 * Convención: fasor referido a SENO (no coseno) — v(t)=Vm·sen(ωt+φ) ↔ V=Vm∠φ, ángulo
 * medido en sentido antihorario desde el eje 0°. Canal 1 es la referencia fija (10 V, 0°).
 * Mezclar un cruce ascendente de un canal con uno descendente del otro produce un error
 * sistemático de exactamente 180° (mod 360°) — verificado numéricamente (21,600
 * combinaciones de frecuencia/φ/posición de cursor, 0 fallos): con el MISMO tipo de cruce
 * en ambos canales el φ medido es exacto; con tipos distintos, el error es exactamente
 * ±180°. Las señales renderizadas son siempre exactas (sin ruido) — lo que el modo
 * Medición/Reto "sella" es únicamente el TEXTO mostrado (y el vector del fasor 2 en el
 * diagrama), nunca la traza física, que siempre es la señal real.
 * Símbolos y notación fasorial: IEC 60027-1 · IEEE Std 280.
 * Las tolerancias (±5° en φ, ±8 % en Vm2) son un margen PEDAGÓGICO de este ejercicio,
 * no una especificación de instrumento real.
 */

// ============================== 1) ESCENA ==============================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.8,2.3,5.2],target:[1.45,1.02,0.55],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

// ============================== 2) FÍSICA ==============================
const V1=10,PHI1=0;
const VM2_CANDIDATES=[4,8,12,16,20];
const FREQ_CANDIDATES=[60,120,250,500];
const PHI2_SEALED_CANDIDATES=[];
for(let p=-165;p<=180;p+=15)PHI2_SEALED_CANDIDATES.push(p);
const VM_MAX=20;
const DIVX=10,DIVY=8;
const VOLTS_PER_DIV=VM_MAX/(DIVY/2);
const PERIODS_SHOWN=3.3;
const TOL_PHI_DEG=5;
const TOL_VM_FRAC=0.08;

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

// ============================== 3) ESTADO ==============================
let mode='explora'; // explora | medicion | reto
let expVm2=12,expPhi2=45,expFreq=60;
let medFreq=120,medVm2=8,medPhi2Seal=-30;
let retoFreq=250,retoVm2Seal=16,retoPhi2Seal=60;
let cursor1Div=2.5,cursor2Div=2.5;
let measured=false,phiMeasured=null,cross1Type=null,cross2Type=null;
let retoChecked=false,retoOkVm=false,retoOkPhi=false,retoMsg='';
let solved=false,autoRunning=false,QUIZ={};

function currentFreqVal(){return mode==='explora'?expFreq:(mode==='medicion'?medFreq:retoFreq);}
function currentVm2True(){return mode==='explora'?expVm2:(mode==='medicion'?medVm2:retoVm2Seal);}
function currentPhi2True(){return mode==='explora'?expPhi2:(mode==='medicion'?medPhi2Seal:retoPhi2Seal);}
function snap1(rawDiv){
  const freq=currentFreqVal(),windowS=windowSFor(freq);
  const rawT=(rawDiv/DIVX)*windowS;
  return nearestCrossTo(rawT,crossingsFor(PHI1,freq,windowS));
}
function snap2(rawDiv){
  const freq=currentFreqVal(),windowS=windowSFor(freq);
  const rawT=(rawDiv/DIVX)*windowS;
  return nearestCrossTo(rawT,crossingsFor(currentPhi2True(),freq,windowS));
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

/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio: std({color:0x8f979f,roughness:0.55,metalness:0.60}),
  acero:    std({color:0x9aa2a9,roughness:0.34,metalness:0.85}),
  cromo:    std({color:0xc9d1d6,roughness:0.22,metalness:0.90}),
  chapa:    std({color:0x828a91,roughness:0.45,metalness:0.75}),
  cobre:    std({color:0xb87333,roughness:0.35,metalness:0.75}),
  negro:    std({color:0x13181c,roughness:0.62,metalness:0.06}),
  goma:     std({color:0x0f1216,roughness:0.94,metalness:0.0}),
  blanco:   std({color:0xd7dee6,roughness:0.42,metalness:0.15}),
  rojo:     std({color:0xd64545,roughness:0.50,metalness:0.10}),
  ceramica: std({color:0xd9dcd6,roughness:0.62,metalness:0.04}),
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
function drawPhasorVector(c,cx,cy,R,vm,phiDeg,color,label){
  const frac=Math.min(1,vm/VM_MAX);
  const rad=phiDeg*Math.PI/180;
  const ex=cx+R*frac*Math.cos(rad),ey=cy-R*frac*Math.sin(rad);
  c.strokeStyle=color;c.lineWidth=3;
  c.beginPath();c.moveTo(cx,cy);c.lineTo(ex,ey);c.stroke();
  drawArrowhead(c,cx,cy,ex,ey,12,color);
  c.fillStyle=color;c.font='bold 13px Outfit, sans-serif';c.textAlign=ex>=cx?'left':'right';
  c.fillText(label,ex+(ex>=cx?8:-8),ey-6);
}
function drawPhasorHalf(c){
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

  drawPhasorVector(c,cx,cy,R,V1,PHI1,'#4FD1C5','V1 (ref.)');

  if(mode==='explora'){
    drawPhasorVector(c,cx,cy,R,expVm2,expPhi2,'#FF8A5B','V2');
  }else if(mode==='medicion'){
    c.strokeStyle='rgba(255,138,91,0.35)';c.setLineDash([5,5]);c.lineWidth=1.5;
    c.beginPath();c.arc(cx,cy,R*(medVm2/VM_MAX),0,Math.PI*2);c.stroke();c.setLineDash([]);
    if(measured){
      const ok=cross1Type===cross2Type&&Math.abs(angDiff(phiMeasured,medPhi2Seal))<=TOL_PHI_DEG;
      drawPhasorVector(c,cx,cy,R,medVm2,phiMeasured,ok?'#FF8A5B':'#ff5c5c','V2 (medido)');
    }
  }else{
    if(retoChecked){
      const vmGuess=numOr('inVm2');
      const vmForDraw=isFinite(vmGuess)?vmGuess:retoVm2Seal;
      drawPhasorVector(c,cx,cy,R,vmForDraw,phiMeasured,(retoOkVm&&retoOkPhi)?'#FF8A5B':'#ff5c5c','V2 (tu resp.)');
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
function drawScopeHalf(c){
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
  const yToPx=v=>midY-(v/VOLTS_PER_DIV)*(gh/DIVY);

  drawTrace(c,xToPx,yToPx,windowS,V1,PHI1,freq,'#4FD1C5');
  drawTrace(c,xToPx,yToPx,windowS,currentVm2True(),currentPhi2True(),freq,'#FF8A5B');

  drawCursor(c,xToPx,yToPx,gy0,gh,snap1(cursor1Div),'#4FD1C5',true);
  drawCursor(c,xToPx,yToPx,gy0,gh,snap2(cursor2Div),'#FF8A5B',false);

  c.fillStyle='#5a6b66';c.font='11px Outfit, sans-serif';c.textAlign='center';
  c.fillText(fmtTimeS(windowS/DIVX)+'/div',x0+w/2,gy0+gh+34);
  c.textAlign='left';
  c.fillText('Volts/div: '+VOLTS_PER_DIV.toFixed(1)+' V (ambos canales)',gx0,gy0+gh+22);
  c.textAlign='right';
  if(measured){
    c.fillStyle=cross1Type===cross2Type?'#8FB3AC':'#f0a5a5';
    c.fillText('φ medido ≈ '+fmtDeg(phiMeasured)+(cross1Type===cross2Type?'':' ⚠ tipos de cruce distintos'),gx0+gw,gy0+gh+22);
  }
}

function drawBoard(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.05)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  drawPhasorHalf(c);
  drawScopeHalf(c);
  c.strokeStyle='rgba(79,209,197,0.28)';c.lineWidth=2;line(c,485,20,485,748);
  bTex.needsUpdate=true;
}
function boardClick(u,v){
  const x=u*1024;
  if(x<485){
    showToast('Diagrama fasorial: cada señal senoidal se representa como un vector de longitud Vm y ángulo φ, medido en sentido antihorario desde el eje 0°. Solo tiene sentido comparar fasores de la MISMA frecuencia.');
  }else{
    showToast('Osciloscopio de 2 canales: canal 1 (teal) es la referencia fija; canal 2 (ámbar) es la señal a caracterizar. Alinea ambos cursores al MISMO tipo de cruce (▲ o ▼) antes de medir.');
  }
}

// ============================== 6) BANCO 3D ==============================
const bench=sh(roundedBox(2.9,0.5,1.6,MAT.bench,0.05));bench.position.set(1.75,0.25,0.85);scene.add(bench);
bench.userData={title:'Banco de trabajo',info:'Montaje de los dos generadores de señal y el osciloscopio.'};

const YB=0.50;                       // la tapa del banco, de donde arranca todo

/* UN GENERADOR DE FUNCIONES NO ES UN CAJÓN CON UNA PANTALLA PEGADA. Se reconoce
   por su frente: el visor HUNDIDO en su marco, la fila de mandos con su índice
   —el de fase es el que se toca en esta práctica, y por eso gira— y el BNC por
   el que sale la señal, que es de donde tiene que nacer el cable. */
function makeGen(x,z,label,title,colBNC){
  const g=new THREE.Group();
  const A=0.72,H=0.46,F=0.36;
  const cuerpo=P3.instrumentoBanco(MATP,{ancho:A,alto:H,fondo:F,color:0x8d9793,
    mandos:2,bnc:1,bncColores:[colBNC]});
  g.position.set(x,YB+H/2+H*0.054,z);scene.add(g);g.add(cuerpo);
  const cv=document.createElement('canvas');cv.width=256;cv.height=120;
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const V=cuerpo.userData.visor;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(V.ancho*0.94,V.alto*0.90),
    new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  cuerpo.userData.pantalla.add(pl);
  const knob=cuerpo.userData.mandos[0];      // el mando de fase, el que se toca
  g.userData={el:label};
  addHoverLabel(g,title,'#f0a5a5',new THREE.Vector3(0,0.42,0),0.8);
  // La boca del BNC, para colgar de ahí el coaxial.
  const b=cuerpo.userData.bnc[0];
  const salida=g.position.clone().add(b.position).add(new THREE.Vector3(0,0,H*0.16));
  return{g,cv,tx,knob,salida,cuerpo};
}
const gen1=makeGen(0.78,1.02,'GEN1','Generador 1 · referencia fija (10 V, 0°)',0x2e7d74);
const gen2=makeGen(2.72,1.02,'GEN2','Generador 2 · señal a caracterizar',0xb5661f);

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

/* EL OSCILOSCOPIO, con su pantalla ENCENDIDA. Estaba flotando en el aire —fuera
   del banco, a 0,10 de fondo y sin nada debajo— y era una plancha de 10 cm de
   canto con la etiqueta «referencia física». Ahora es un aparato de dos canales
   apoyado en el banco, con sus dos BNC de entrada y con las DOS TRAZAS pintadas
   en su visor: el pizarrón sigue siendo donde se mide, porque ahí se lee, pero
   el instrumento ya no finge estar apagado. */
const scopeG=new THREE.Group();
const SC_A=0.98,SC_H=0.64,SC_F=0.44;
scopeG.position.set(1.75,YB+SC_H/2+SC_H*0.054,0.42);scene.add(scopeG);
const scopeBox=P3.instrumentoBanco(MATP,{ancho:SC_A,alto:SC_H,fondo:SC_F,color:0x8d9793,
  mandos:3,bnc:2,bncColores:[0x2e7d74,0xb5661f]});
scopeG.add(scopeBox);
scopeG.userData={title:'Osciloscopio de dos canales',info:'Las dos entradas BNC reciben cada una su generador. En su visor van las mismas dos trazas que amplía el pizarrón: ahí se leen los cruces por cero con los cursores.'};
addHoverLabel(scopeG,'osciloscopio · 2 canales','#8ad6c8',new THREE.Vector3(0,0.52,0),0.8);
const scCv=document.createElement('canvas');scCv.width=512;scCv.height=280;
const scTx=new THREE.CanvasTexture(scCv);scTx.colorSpace=THREE.SRGBColorSpace;
scTx.minFilter=THREE.LinearFilter;scTx.generateMipmaps=false;
{
  const V=scopeBox.userData.visor;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(V.ancho*0.95,V.alto*0.92),
    new THREE.MeshBasicMaterial({map:scTx,toneMapped:false}));
  scopeBox.userData.pantalla.add(pl);
}
/* Las dos trazas del visor. Se repintan cuando cambia el estado, no cada
   fotograma: la señal no se mueve mientras no se toque un mando. */
function drawScopeFace(vm2,phi2){
  const c=scCv.getContext('2d'),W=scCv.width,H=scCv.height;
  c.fillStyle='#04120e';c.fillRect(0,0,W,H);
  c.strokeStyle='rgba(79,209,197,0.16)';c.lineWidth=1;
  for(let i=1;i<10;i++){const x=i*W/10;c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
  for(let j=1;j<6;j++){const y=j*H/6;c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
  c.strokeStyle='rgba(79,209,197,0.34)';
  c.beginPath();c.moveTo(0,H/2);c.lineTo(W,H/2);c.stroke();
  const CICLOS=2.6, AMP=H*0.34/Math.max(V1,vm2);
  const traza=(vm,phiDeg,col)=>{
    c.strokeStyle=col;c.lineWidth=2.6;c.beginPath();
    for(let px=0;px<=W;px++){
      const t=px/W*CICLOS*Math.PI*2+phiDeg*Math.PI/180;
      const y=H/2-Math.sin(t)*vm*AMP;
      px?c.lineTo(px,y):c.moveTo(px,y);
    }
    c.stroke();
  };
  traza(V1,PHI1,'#4FD1C5');
  traza(vm2,phi2,'#FF8A5B');
  scTx.needsUpdate=true;
}

function cable(ax,ay,az,bx,by,bz,mat){
  const a=new THREE.Vector3(ax,ay,az),b=new THREE.Vector3(bx,by,bz);
  const m=a.clone().lerp(b,0.5);m.y=Math.max(a.y,b.y)+0.16;
  const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,m,b]),24,0.014,8),mat);
  t.castShadow=true;scene.add(t);
  return t;
}
/* Los dos coaxiales van de BNC a BNC: nacen en la salida de cada generador y
   mueren en su entrada del osciloscopio, no en un costado cualquiera. */
{
  const bs=scopeBox.userData.bnc;
  const ent=i=>scopeG.position.clone().add(bs[i].position).add(new THREE.Vector3(0,0,SC_H*0.16));
  const e0=ent(0), e1=ent(1);
  cable(gen1.salida.x,gen1.salida.y,gen1.salida.z,e0.x,e0.y,e0.z,MAT.cableCh1);
  cable(gen2.salida.x,gen2.salida.y,gen2.salida.z,e1.x,e1.y,e1.z,MAT.cableCh2);
}

function refreshNet3D(){
  drawGenDisplay(gen1,fmtV(V1),fmtDeg(PHI1),'#4FD1C5');
  let vm2Text,phi2Text;
  if(mode==='explora'){
    vm2Text=fmtV(expVm2);phi2Text=fmtDeg(expPhi2);
    gen2.knob.rotation.z=-expPhi2*Math.PI/180;   // el índice del mando marca la fase
  }else if(mode==='medicion'){
    vm2Text=fmtV(medVm2);phi2Text='φ 🔒';
  }else{
    vm2Text='🔒';phi2Text='🔒';
  }
  drawGenDisplay(gen2,vm2Text,phi2Text,'#FF8A5B');
  /* El visor del osciloscopio SÍ enseña la señal aunque la fase esté sellada:
     eso es precisamente lo que hay que medir, y ocultarlo dejaría al alumno sin
     con qué. Lo que se sella es la CIFRA del generador, no la traza. */
  drawScopeFace(currentVm2True(),currentPhi2True());
}

// ============================== 7) HUD Y PANEL ==============================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos CA (D1) · Corriente alterna</div>
  <h2>Fasores de Señales Senoidales · Mide el Desfase</h2>
  <p>Una señal senoidal v(t)=Vm·sen(ωt+φ) se representa como un <b>fasor</b>: un vector de
  magnitud Vm y ángulo φ. Comparar dos señales de la MISMA frecuencia se reduce a comparar
  sus fasores — y la diferencia angular entre ellas, el <b>desfase</b>, se mide en un
  osciloscopio de dos canales ubicando el instante en que cada señal cruza cero, siempre
  en el MISMO sentido.</p>
  <div class="formula">v(t)=Vm·sen(2πft+φ) · V=Vm∠φ · φ = −Δt·360°/T (mismo tipo de cruce en ambos canales)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Canal 1 · referencia (10 V, 0°)</div>
    <div class="li"><span class="dot" style="background:#FF8A5B"></span>Canal 2 · señal a caracterizar</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Cursores de medición (cruce por cero)</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> señales senoidales exactas v(t)=Vm·sen(2πft+φ) sin ruido; representación fasorial con convención seno (V=Vm∠φ), ángulo medido antihorario desde 0°; medición realista de desfase por localización de cruces por cero (ascendente o descendente, el más cercano al cursor), con el error sistemático de 180° que resulta de mezclar tipos de cruce distintos entre canales.</div>
    <div class="fl no"><b>NO modela:</b> ruido de instrumento, impedancia de entrada o carga del osciloscopio sobre el circuito, ni el origen físico del desfase (lo da un circuito RLC — próximo laboratorio). Tampoco modela sistemas trifásicos. Las tolerancias (±5° en φ, ±8 % en Vm2) son un margen PEDAGÓGICO de este ejercicio.</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · Boylestad · IEC 60027-1 · IEEE Std 280</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Fasores y Desfase · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🌀 Explora</button>
    <button class="b" id="m_medicion">🖥️ Medición</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div class="modebar" id="selbar" style="display:none"></div>
  <div id="phi2Box" style="display:none;margin:6px 0 10px">
    <label for="phi2Slider" style="font-size:11px;color:var(--dim)">φ2 (canal 2) — <span id="phi2Val">45°</span></label>
    <input type="range" id="phi2Slider" min="-180" max="180" step="1" value="45" style="width:100%">
  </div>
  <div id="cursorBox" style="margin:6px 0 10px">
    <label for="cursor1" style="font-size:11px;color:var(--dim)">Cursor canal 1 (teal) — arrastra hasta un cruce por cero</label>
    <input type="range" id="cursor1" min="0" max="10" step="0.02" value="2.5" style="width:100%">
    <label for="cursor2" style="font-size:11px;color:var(--dim)">Cursor canal 2 (ámbar) — arrastra hasta un cruce por cero</label>
    <input type="range" id="cursor2" min="0" max="10" step="0.02" value="2.5" style="width:100%">
  </div>
  <div class="btns" id="medirBox">
    <button class="b" id="btnMedir">📏 Medir desfase</button>
  </div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Caracterización</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div style="display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:var(--ink)">
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inVm2">Vm2 =</label><input id="inVm2" inputmode="decimal" autocomplete="off" style="width:70px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>V</span></span>
    </div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar predicción</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nueva señal</button>
  </div>`;

const el=id=>document.getElementById(id);

// ============================== 8) TOASTS ==============================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3200);
}
function toastPart(id){
  if(id==='GEN1'){
    showToast(`<b style="color:var(--accent2)">GEN1 · ${fmtV(V1)} ∠ ${fmtDeg(PHI1)}</b><br><span style="color:var(--dim);font-size:11px">Referencia fija de fase — todas las mediciones de desfase se hacen respecto a esta señal.</span>`);
    return;
  }
  if(id==='GEN2'){
    if(mode==='explora'){
      showToast(`<b style="color:var(--accent2)">GEN2 · ${fmtV(expVm2)} ∠ ${fmtDeg(expPhi2)}</b><br><span style="color:var(--dim);font-size:11px">Señal ajustable — cambia su amplitud, frecuencia y fase con los controles.</span>`);
    }else if(mode==='medicion'){
      showToast(`<b style="color:var(--accent2)">GEN2 · ${fmtV(medVm2)} ∠ 🔒</b><br><span style="color:var(--dim);font-size:11px">Amplitud conocida; el desfase está sellado — mide con los cursores.</span>`);
    }else{
      showToast(`<b style="color:var(--accent2)">GEN2 · 🔒 / 🔒</b><br><span style="color:var(--dim);font-size:11px">Amplitud y desfase sellados — lee Vm2 en la rejilla y mide φ con los cursores.</span>`);
    }
  }
}

// ============================== 9) MODOS Y SELBAR ==============================
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.8,2.3,5.2],[1.45,1.02,0.55]],mision:'Ajusta Vm2, f y φ2 del canal 2 y observa cómo cambian el osciloscopio y el diagrama fasorial en tiempo real.'},
  medicion:{nombre:'Medición',cam:[[-0.2,2.0,3.4],[-1.0,1.6,-0.5]],mision:'El desfase del canal 2 está sellado. Alinea ambos cursores al MISMO tipo de cruce por cero y mide φ.'},
  reto:{nombre:'Reto',cam:[[3.4,1.9,3.8],[1.75,0.85,0.70]],mision:'Amplitud y desfase del canal 2 sellados. Lee Vm2 en la rejilla y mide φ con los cursores.'},
};
function buildSelBar(){
  const bar=el('selbar');
  if(mode!=='explora'){bar.style.display='none';bar.innerHTML='';el('phi2Box').style.display='none';return;}
  bar.style.display='flex';
  el('phi2Box').style.display='block';
  el('phi2Slider').value=String(expPhi2);
  el('phi2Val').textContent=fmtDeg(expPhi2);
  bar.innerHTML=
    `<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin-right:4px">Vm2:</span>`+
    VM2_CANDIDATES.map(v=>`<button class="b sm ${v===expVm2?'on':''}" data-vm="${v}">${v} V</button>`).join('')+
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">f:</span>`+
    FREQ_CANDIDATES.map(f=>`<button class="b sm ${f===expFreq?'on':''}" data-fr="${f}">${fmtHz(f)}</button>`).join('')+
    `</div>`;
  bar.querySelectorAll('[data-vm]').forEach(b=>{b.onclick=()=>{expVm2=parseFloat(b.dataset.vm);afterEdit();};});
  bar.querySelectorAll('[data-fr]').forEach(b=>{b.onclick=()=>{expFreq=parseFloat(b.dataset.fr);afterEdit();};});
}
function setMode(k){
  mode=k;
  cursor1Div=2.5;cursor2Div=2.5;el('cursor1').value='2.5';el('cursor2').value='2.5';
  measured=false;phiMeasured=null;cross1Type=null;cross2Type=null;
  retoChecked=false;retoOkVm=false;retoOkPhi=false;retoMsg='';
  ['explora','medicion','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
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
  measured=false;phiMeasured=null;cross1Type=null;cross2Type=null;
  buildSelBar();
  solved=false;clearDx();buildQuiz();refreshQuestion();
  refreshAll();
}

// ============================== 10) TELEMETRÍA Y REPORTE ==============================
function teleRow(l,v,cls){return `<div class="g"><div class="l">${l}</div><b class="${cls||''}">${v}</b></div>`;}
function updateTele(){
  const t=el('tele');
  const freq=currentFreqVal();
  if(mode==='explora'){
    t.innerHTML=
      teleRow('Vm1 / φ1',fmtV(V1)+' / '+fmtDeg(PHI1))+
      teleRow('Vm2 / φ2',fmtV(expVm2)+' / '+fmtDeg(expPhi2))+
      teleRow('Frecuencia',fmtHz(freq))+
      teleRow('φ medido',measured?fmtDeg(phiMeasured)+(cross1Type===cross2Type?'':' ⚠ tipos distintos'):'—',measured?(cross1Type===cross2Type?'good':'warn'):'');
  }else if(mode==='medicion'){
    const matched=measured&&cross1Type===cross2Type;
    let tolCls='';
    if(measured)tolCls=(matched&&Math.abs(angDiff(phiMeasured,medPhi2Seal))<=TOL_PHI_DEG)?'good':'warn';
    const revealPhi=measured&&matched&&Math.abs(angDiff(phiMeasured,medPhi2Seal))<=TOL_PHI_DEG;
    t.innerHTML=
      teleRow('Vm2 (conocida)',fmtV(medVm2))+
      teleRow('Frecuencia',fmtHz(freq))+
      teleRow('φ2',revealPhi?fmtDeg(medPhi2Seal)+' ✔':'🔒 sellado')+
      teleRow('φ medido (cursores)',measured?fmtDeg(phiMeasured):'sin medir',measured?tolCls:'warn')+
      teleRow('Tipo de cruce',measured?((cross1Type==='asc'?'▲':'▼')+' canal 1 vs '+(cross2Type==='asc'?'▲':'▼')+' canal 2'):'—',measured?(matched?'good':'warn'):'');
  }else{
    t.innerHTML=
      teleRow('Frecuencia (conocida)',fmtHz(freq))+
      teleRow('Vm2',(retoChecked&&retoOkVm)?fmtV(retoVm2Seal)+' ✔':'🔒 desconocida (lee la rejilla)')+
      teleRow('φ2',(retoChecked&&retoOkPhi)?fmtDeg(retoPhi2Seal)+' ✔':'🔒 desconocido (mide con cursores)')+
      teleRow('φ medido (cursores)',measured?fmtDeg(phiMeasured):'sin medir',measured?'good':'warn')+
      teleRow('Estado',retoChecked?((retoOkVm&&retoOkPhi)?'✔ AMBOS CORRECTOS':'revisa el/los campo(s) marcado(s)'):'Mide φ y estima Vm2, luego comprueba',(retoChecked&&retoOkVm&&retoOkPhi)?'good':'warn');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='explora'){
    html+=`<span class="mono">V1=${fmtV(V1)}∠${fmtDeg(PHI1)}, V2=${fmtV(expVm2)}∠${fmtDeg(expPhi2)} a ${fmtHz(expFreq)}. El desfase entre ambas es φ2−φ1=${fmtDeg(expPhi2)}.</span>`;
  }else if(mode==='medicion'){
    html+=measured
      ?(cross1Type===cross2Type
        ?`<span class="mono">Cursores alineados al mismo tipo de cruce (${cross1Type==='asc'?'ascendente':'descendente'}) — la medición es confiable.</span>`
        :`<span class="mono">⚠ Cursores en tipos de cruce DISTINTOS (canal 1: ${cross1Type==='asc'?'ascendente':'descendente'}, canal 2: ${cross2Type==='asc'?'ascendente':'descendente'}) — el resultado está desplazado ~180° del real. Alinea ambos cursores al mismo tipo.</span>`)
      :`<span class="mono">Arrastra ambos cursores hasta un cruce por cero (▲ o ▼) del MISMO tipo en los dos canales, luego presiona "Medir desfase".</span>`;
  }else{
    html+=retoMsg||`<span class="mono">Frecuencia conocida (${fmtHz(currentFreqVal())}). Vm2 y φ2 sellados: lee Vm2 en la rejilla (volts/div) y mide φ con los cursores.</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();refreshNet3D();}

// ============================== 11) MEDICIÓN Y RETO ==============================
function medirPhi(){
  const freq=currentFreqVal();
  const c1=snap1(cursor1Div),c2=snap2(cursor2Div);
  const phi=phiFromCrossings(c1.t,c2.t,freq);
  measured=true;phiMeasured=phi;cross1Type=c1.type;cross2Type=c2.type;
  const matched=c1.type===c2.type;
  synth.beep(matched?1046:660,matched?0.12:0.15,0.06);
  if(mode==='explora'){
    showToast(matched
      ?`Medición: φ ≈ ${fmtDeg(phi)}. Coincide con el φ real (${fmtDeg(expPhi2)}) porque ambos cursores usan el MISMO tipo de cruce (${cross1Type==='asc'?'ascendente':'descendente'}).`
      :`⚠️ Medición: φ ≈ ${fmtDeg(phi)} — pero el φ real es ${fmtDeg(expPhi2)}. Mezclaste un cruce ${cross1Type==='asc'?'ascendente':'descendente'} (canal 1) con uno ${cross2Type==='asc'?'ascendente':'descendente'} (canal 2): error clásico de 180°.`);
  }else if(mode==='medicion'){
    const ok=Math.abs(angDiff(phi,medPhi2Seal))<=TOL_PHI_DEG;
    showToast(matched
      ?(ok?`<span style="color:var(--good)">✔ φ medido ≈ ${fmtDeg(phi)}, dentro de ±${TOL_PHI_DEG}° del valor sellado.</span>`
           :`φ medido ≈ ${fmtDeg(phi)} — fuera de tolerancia, ajusta el cursor justo sobre el cruce.`)
      :`⚠️ φ medido ≈ ${fmtDeg(phi)} — mezclaste tipos de cruce distintos (canal 1: ${cross1Type==='asc'?'ascendente':'descendente'}, canal 2: ${cross2Type==='asc'?'ascendente':'descendente'}). Error clásico de 180°: alinea ambos cursores al MISMO tipo de cruce.`);
  }else{
    showToast(matched
      ?`Medición registrada: φ ≈ ${fmtDeg(phi)} (cruces del mismo tipo). Ahora estima la amplitud leyendo la rejilla y comprueba.`
      :`⚠️ Medición registrada: φ ≈ ${fmtDeg(phi)} — cuidado, mezclaste tipos de cruce distintos. Puede estar desfasada 180° de la real.`);
  }
  refreshAll();
}
function checkReto(){
  if(!measured){showToast('⚠️ Primero mide el desfase con los cursores ("Medir desfase").');return;}
  const vmGuess=numOr('inVm2');
  if(!isFinite(vmGuess)){showToast('⚠️ Ingresa tu lectura de amplitud (Vm2) en volts.');return;}
  const tolVm=Math.max(retoVm2Seal*TOL_VM_FRAC,0.3);
  retoOkVm=Math.abs(vmGuess-retoVm2Seal)<=tolVm;
  retoOkPhi=Math.abs(angDiff(phiMeasured,retoPhi2Seal))<=TOL_PHI_DEG;
  retoChecked=true;
  const allOk=retoOkVm&&retoOkPhi;
  solved=allOk;
  synth.beep(allOk?1046:(retoOkVm||retoOkPhi?660:220),allOk?0.14:0.15,0.06);
  const parts=[];
  parts.push(retoOkVm?`<span class="ok">✔ Vm2 correcta</span> (tu lectura ${fmtV(vmGuess)})`:`<span class="dtc">✗ Vm2 fuera de tolerancia</span> (leíste ${fmtV(vmGuess)})`);
  parts.push(retoOkPhi?`<span class="ok">✔ φ correcto</span> (medido ${fmtDeg(phiMeasured)})`:`<span class="dtc">✗ φ fuera de tolerancia</span> (medido ${fmtDeg(phiMeasured)}${cross1Type!==cross2Type?' — cruces de tipo distinto, revisa el error de 180°':''})`);
  retoMsg=`<span class="mono">${parts.join('<br>')}</span>`;
  refreshAll();
}
function updateRetoSpec(){
  el('retoSpec').innerHTML=`Frecuencia conocida: ${fmtHz(retoFreq)}. Amplitud y desfase del canal 2 sellados. Lee Vm2 directamente de la rejilla (volts/div) del osciloscopio y mide φ con los cursores ("Medir desfase"); ambos se califican de forma independiente.<br><span style="color:var(--dim)">Tolerancias (±8 % en Vm2, ±5° en φ) son un margen pedagógico de este ejercicio.</span>`;
}
function pickFrom(arr,exclude){
  const pick=()=>arr[Math.floor(Math.random()*arr.length)];
  let v=pick();
  if(arr.length>1)while(v===exclude)v=pick();
  return v;
}
function newMedicionRound(){
  medFreq=pickFrom(FREQ_CANDIDATES,medFreq);
  medVm2=pickFrom(VM2_CANDIDATES,medVm2);
  medPhi2Seal=pickFrom(PHI2_SEALED_CANDIDATES,medPhi2Seal);
}
function newRetoRound(){
  retoFreq=pickFrom(FREQ_CANDIDATES,retoFreq);
  retoVm2Seal=pickFrom(VM2_CANDIDATES,retoVm2Seal);
  retoPhi2Seal=pickFrom(PHI2_SEALED_CANDIDATES,retoPhi2Seal);
}
function newSignal(){
  if(mode==='medicion'){
    newMedicionRound();
    measured=false;phiMeasured=null;cross1Type=null;cross2Type=null;
    cursor1Div=2.5;cursor2Div=2.5;el('cursor1').value='2.5';el('cursor2').value='2.5';
    solved=false;clearDx();buildQuiz();refreshQuestion();buildSelBar();refreshAll();
    showToast('🔀 Nueva señal sellada. Vuelve a medir el desfase.');synth.beep(520,0.08,0.05);
  }else if(mode==='reto'){
    newRetoRound();
    measured=false;phiMeasured=null;cross1Type=null;cross2Type=null;
    retoChecked=false;retoOkVm=false;retoOkPhi=false;retoMsg='';
    if(el('inVm2'))el('inVm2').value='';
    cursor1Div=2.5;cursor2Div=2.5;el('cursor1').value='2.5';el('cursor2').value='2.5';
    updateRetoSpec();solved=false;clearDx();buildQuiz();refreshQuestion();refreshAll();
    showToast('🔀 Nueva caja negra. Amplitud y desfase sellados de nuevo.');synth.beep(520,0.08,0.05);
  }else{
    expVm2=pickFrom(VM2_CANDIDATES,expVm2);
    expPhi2=pickFrom(PHI2_SEALED_CANDIDATES,expPhi2);
    expFreq=pickFrom(FREQ_CANDIDATES,expFreq);
    afterEdit();
    showToast('🔀 Nueva combinación aleatoria en Explora.');
  }
}
function onRetoInput(){if(mode!=='reto')return;retoChecked=false;retoOkVm=false;retoOkPhi=false;retoMsg='';refreshAll();}

// ============================== 12) QUIZ ==============================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Por qué el diagrama fasorial solo permite comparar dos señales que tienen la MISMA frecuencia?',
      opciones:[
        {t:'Porque un fasor representa una señal "congelada" en una referencia relativa — si las frecuencias fueran distintas, el ángulo entre las dos señales cambiaría constantemente en el tiempo y el "desfase" dejaría de ser un número fijo',ok:true,why:'Correcto: el fasor solo tiene sentido como representación de ω constante compartida. Con frecuencias distintas, la diferencia de fase crece o decrece sin parar — no hay un desfase único que medir.'},
        {t:'Porque el osciloscopio solo puede medir una frecuencia a la vez',ok:false,why:'Un osciloscopio de dos canales sí puede mostrar simultáneamente dos señales de frecuencias distintas — el problema no es del instrumento, es que el concepto de "desfase" pierde sentido entre frecuencias distintas.'},
        {t:'Porque Vm tiene que ser igual en ambas señales para poder compararlas',ok:false,why:'La amplitud (Vm) puede ser distinta entre las dos señales sin ningún problema — lo que debe coincidir es la frecuencia, no la amplitud.'},
        {t:'Porque la frecuencia determina el color de la traza en el osciloscopio',ok:false,why:'El color de la traza es una convención de visualización de este simulador (canal 1 teal, canal 2 ámbar) — no tiene relación con la frecuencia de la señal.'},
      ],
    },
    medicion:{
      pregunta:'Alineas el cursor del canal 1 en un cruce ascendente (▲) y el del canal 2 en un cruce descendente (▼). ¿Qué error introduce esto en tu medición de φ?',
      opciones:[
        {t:'Un error sistemático de exactamente 180° (mod 360°) respecto al desfase real — el resultado es matemáticamente consistente pero no representa el desfase físico real entre las señales',ok:true,why:'Correcto: mezclar tipos de cruce equivale a medir la diferencia de tiempo hasta un punto de la señal 2 desplazado media vuelta (T/2) del que corresponde — eso se traduce en exactamente 180° de error, siempre, sin importar el φ real.'},
        {t:'Ningún error, porque un cruce por cero es un cruce por cero sin importar el sentido',ok:false,why:'El sentido del cruce SÍ importa: un cruce ascendente y uno descendente de la MISMA señal están separados por medio periodo (T/2) en el tiempo — mezclarlos introduce ese medio periodo como error.'},
        {t:'Un error aleatorio impredecible, distinto cada vez que se repite la medición',ok:false,why:'El error no es aleatorio: es sistemático y exacto (siempre ±180°, mod 360°) porque proviene de una relación geométrica fija entre cruces ascendentes y descendentes, verificada numéricamente.'},
        {t:'Un error del 50% en la amplitud medida',ok:false,why:'Mezclar tipos de cruce afecta la medición de FASE (ángulo), no la de amplitud — la amplitud no se ve alterada por este error.'},
      ],
    },
    reto:{
      pregunta:'En el Reto, Vm2 se lee de la rejilla y φ2 se mide con los cursores, y cada campo se califica de forma INDEPENDIENTE. ¿Por qué tiene sentido calificarlos por separado?',
      opciones:[
        {t:'Porque son dos mediciones con técnicas y fuentes de error distintas —leer una rejilla (visual) y localizar un cruce por cero (cursor)— así el estudiante sabe exactamente cuál de las dos técnicas necesita repasar, no solo que "algo" salió mal',ok:true,why:'Correcto: retroalimentación específica por campo es más útil pedagógicamente que un solo "correcto/incorrecto" global, porque señala con precisión qué habilidad de medición falló.'},
        {t:'Porque Vm2 y φ2 son en realidad el mismo número expresado en unidades distintas',ok:false,why:'Vm2 (amplitud, en volts) y φ2 (ángulo, en grados) son magnitudes físicas completamente independientes — conocer una no permite calcular la otra.'},
        {t:'Porque calificar ambos juntos sería técnicamente imposible en un programa de computadora',ok:false,why:'No hay ninguna limitación técnica para calificar dos campos juntos — la razón de separarlos es puramente pedagógica, para dar retroalimentación específica.'},
        {t:'Porque el osciloscopio no puede mostrar amplitud y fase al mismo tiempo',ok:false,why:'El osciloscopio de este banco muestra la traza completa (que contiene tanto amplitud como fase) en todo momento — ambas son visibles simultáneamente en la misma pantalla.'},
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
    expVm2=12;expPhi2=45;expFreq=60;afterEdit();
    showToast('Paso 1 · V1 es la referencia fija (10 V, 0°). V2 tiene Vm2=12 V y φ2=45° — obsérvalo adelantado en el diagrama fasorial y en el osciloscopio.');
    await sleep(2600);
    expPhi2=-90;afterEdit();
    showToast('Ahora φ2=−90°: el fasor V2 gira al cuarto cuadrante inferior y su cruce ascendente se adelanta en el tiempo.');
    await sleep(2600);

    setMode('medicion');
    showToast('Paso 2 · El desfase de V2 está sellado. Primero, un error clásico: mezclar tipos de cruce distintos.');
    await sleep(2000);
    {
      const freq=currentFreqVal(),windowS=windowSFor(freq);
      const cr1=crossingsFor(PHI1,freq,windowS).find(c=>c.type==='asc');
      const cr2=crossingsFor(medPhi2Seal,freq,windowS).find(c=>c.type==='desc');
      cursor1Div=divForTime(cr1.t,windowS);el('cursor1').value=String(cursor1Div);
      cursor2Div=divForTime(cr2.t,windowS);el('cursor2').value=String(cursor2Div);
    }
    refreshAll();
    medirPhi();await sleep(2800);
    showToast('Corrigiendo: alineamos el cursor del canal 2 a un cruce ASCENDENTE, igual que el canal 1.');
    await sleep(2000);
    {
      const freq=currentFreqVal(),windowS=windowSFor(freq);
      const cr2=crossingsFor(medPhi2Seal,freq,windowS).find(c=>c.type==='asc');
      cursor2Div=divForTime(cr2.t,windowS);el('cursor2').value=String(cursor2Div);
    }
    refreshAll();
    medirPhi();await sleep(2600);
    answer(QUIZ.medicion.opciones.findIndex(o=>o.ok));await sleep(1800);

    setMode('reto');
    showToast('Paso 3 · Amplitud y desfase sellados. Lee Vm2 en la rejilla y mide φ con los cursores.');
    await sleep(2200);
    {
      const freq=currentFreqVal(),windowS=windowSFor(freq);
      const cr1=crossingsFor(PHI1,freq,windowS).find(c=>c.type==='asc');
      const cr2=crossingsFor(retoPhi2Seal,freq,windowS).find(c=>c.type==='asc');
      cursor1Div=divForTime(cr1.t,windowS);el('cursor1').value=String(cursor1Div);
      cursor2Div=divForTime(cr2.t,windowS);el('cursor2').value=String(cursor2Div);
    }
    refreshAll();
    medirPhi();await sleep(1800);
    el('inVm2').value=String(retoVm2Seal);
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
el('phi2Slider').oninput=()=>{expPhi2=parseFloat(el('phi2Slider').value);afterEdit();};
el('inVm2').addEventListener('input',onRetoInput);
el('inVm2').addEventListener('keydown',e=>{if(e.key==='Enter')checkReto();});
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊 Sonido':'🔇 Sonido';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildQuiz();refreshNet3D();
S.start();
setMode('explora');

window.__labDebug={
  mode:()=>mode,
  freq:()=>currentFreqVal(),
  vm1:()=>V1,
  phi1:()=>PHI1,
  vm2True:()=>currentVm2True(),
  phi2True:()=>currentPhi2True(),
  windowS:()=>windowSFor(currentFreqVal()),
  cursor1Div:()=>cursor1Div,
  cursor2Div:()=>cursor2Div,
  setCursor1Div:d=>{cursor1Div=Math.max(0,Math.min(10,d));el('cursor1').value=String(cursor1Div);refreshAll();},
  setCursor2Div:d=>{cursor2Div=Math.max(0,Math.min(10,d));el('cursor2').value=String(cursor2Div);refreshAll();},
  snap1:()=>snap1(cursor1Div),
  snap2:()=>snap2(cursor2Div),
  measured:()=>measured,
  phiMeasured:()=>phiMeasured,
  cross1Type:()=>cross1Type,
  cross2Type:()=>cross2Type,
  medirPhi:()=>medirPhi(),
  checkReto:()=>checkReto(),
  setInVm2:v=>{el('inVm2').value=String(v);},
  retoChecked:()=>retoChecked,
  retoOkVm:()=>retoOkVm,
  retoOkPhi:()=>retoOkPhi,
  retoMsg:()=>retoMsg,
  retoFreq:()=>retoFreq,
  retoVm2Seal:()=>retoVm2Seal,
  retoPhi2Seal:()=>retoPhi2Seal,
  medFreq:()=>medFreq,
  medVm2:()=>medVm2,
  medPhi2Seal:()=>medPhi2Seal,
  setExpVm2:v=>{expVm2=v;afterEdit();},
  setExpPhi2:p=>{expPhi2=p;afterEdit();},
  setExpFreq:f=>{expFreq=f;afterEdit();},
  newSignal:()=>newSignal(),
  setMode:k=>setMode(k),
  reportText:()=>el('report').innerText,
  quizAnswer:i=>answer(i),
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  solved:()=>solved,
};
