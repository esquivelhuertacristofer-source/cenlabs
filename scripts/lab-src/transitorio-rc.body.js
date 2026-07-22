/*
 * Transitorio RC — mide τ = R·C en un osciloscopio simulado
 * Física: carga v(t)=V·(1−e^(−t/τ)) y descarga v(t)=V·e^(−t/τ) de un capacitor a través
 * de un resistor (Hayt/Kemmerly/Durbin, Análisis de circuitos en ingeniería, McGraw-Hill).
 * A t=τ el voltaje alcanza 63.2 % de su excursión total; a t=5τ, 99.3 % (criterio práctico
 * de "ya estable"). Verificado numéricamente: v(τ)=0.6321V, v(5τ)=0.9933V (carga);
 * v(τ)=0.3679V, v(5τ)=0.0067V (descarga).
 * La base de tiempo (time/div) del osciloscopio usa una secuencia realista 1-2-5 (como en
 * un dial físico de time/div), no un valor continuo arbitrario — y por eso el valor "correcto"
 * mostrado en pantalla es una APROXIMACIÓN redondeada, nunca τ exacto. En el modo Reto esto es
 * intencional: el redondeo del dial impide despejar C por álgebra directa desde el number
 * mostrado en pantalla — hay que medir de verdad con el cursor.
 * Las tolerancias del modo Reto (±8 % en C) y de Medición (±6 % en τ) son un margen
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
const R_CANDIDATES=[1000,2200,4700,10000];
const C_CANDIDATES=[100e-9,470e-9,1e-6,4.7e-6];
const DIVX=10,DIVY=8;
const VOLTS_PER_DIV=V/DIVY;
const DIAL_STEPS_US=[10,20,50,100,200,500,1000,2000,5000,10000,20000,50000,100000,200000];
const RETO_SCENARIOS=[
  {R:1000,C:470e-9},
  {R:2200,C:150e-9},
  {R:4700,C:1e-6},
  {R:10000,C:330e-9},
  {R:2200,C:2.2e-6},
  {R:6800,C:2.2e-6},
];

const tauOf=(r,c)=>r*c;
const vCarga=(t,tau)=>V*(1-Math.exp(-t/tau));
const vDescarga=(t,tau)=>V*Math.exp(-t/tau);
const vAt=(t,tau,fase)=>fase==='descarga'?vDescarga(t,tau):vCarga(t,tau);
const targetFrac=fase=>fase==='descarga'?(1-0.6321):0.6321;

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
function fmtC(f){
  const nF=f*1e9;
  if(nF>=1000){const uF=nF/1000;return(uF%1?uF.toFixed(1):String(Math.round(uF)))+' µF';}
  return(nF%1?nF.toFixed(0):String(Math.round(nF)))+' nF';
}
const BAND_COLORS=['#1a1a1a','#6b4226','#c73a3a','#d2691e','#e8c832','#3f8f3f','#2b5fb8','#7d3fc4','#8a8a8a','#e8e8e8'];
const BAND_NAMES=['negro','café','rojo','naranja','amarillo','verde','azul','violeta','gris','blanco'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1;const dd=Math.round(v/Math.pow(10,exp));return{d1:Math.floor(dd/10),d2:dd%10,mult:exp};}

// ============================== 3) ESTADO ==============================
let mode='explora'; // explora | medicion | reto
let selR=2200,selC=470e-9,fase='carga';
let timeDivKey='rapido';
let cursorDiv=5.0;
let medido=false,tauMedido=null;
let retoIdx=0,retoSolved=false,retoMsg='';
let solved=false,autoRunning=false,QUIZ={};

function currentR(){return mode==='reto'?RETO_SCENARIOS[retoIdx].R:selR;}
function currentC(){return mode==='reto'?RETO_SCENARIOS[retoIdx].C:selC;}
function currentFase(){return mode==='reto'?'carga':fase;}
function currentTau(){return tauOf(currentR(),currentC());}
function effectiveTimeDivUs(){
  const choices=timeDivChoicesFor(currentTau());
  if(mode==='medicion'){const c=choices.find(c=>c.key===timeDivKey);return(c||choices[0]).us;}
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
frame.userData={title:'Pizarrón del osciloscopio',info:'Izquierda: esquema del circuito RC. Derecha: pantalla del osciloscopio con la traza de carga/descarga y el cursor de medición.'};
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
  c.fillText('ESQUEMA · CIRCUITO RC SERIE',x0+6,40);
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
  const capY=340;
  line(c,midX-34,capY,midX+34,capY);line(c,midX-34,capY+16,midX+34,capY+16);
  if(mode==='reto'){
    c.fillStyle='#FFB703';c.font='bold 30px Outfit, sans-serif';c.textAlign='center';
    c.fillText('?',midX,capY+56);
    c.font='14px Outfit, sans-serif';c.fillStyle='#8FB3AC';
    c.fillText('C · sellado',midX,capY+80);
  }else{
    c.fillStyle='#4FD1C5';c.font='bold 17px Outfit, sans-serif';c.textAlign='center';
    c.fillText('C = '+fmtC(currentC()),midX,capY-14);
  }
  line(c,midX,capY+16,midX,botY);
  line(c,midX,botY,cx,botY);
  line(c,cx,botY,cx,topY+80);
  earth(c,cx,botY);
  nodeDot(c,cx,260,false);nodeDot(c,midX,260,false);
  c.fillStyle='#8FB3AC';c.font='14px Outfit, sans-serif';c.textAlign='left';
  const swLabel=(mode==='reto')?'Fase: carga (fija en Reto)':(currentFase()==='carga'?'Fase: carga (fuente conectada)':'Fase: descarga (fuente desconectada, C se descarga sobre R)');
  c.fillText(swLabel,x0+6,610);
  if(mode!=='reto'){
    const tau=currentTau();
    c.fillStyle='#f0a5a5';c.font='bold 15px Outfit, sans-serif';
    c.fillText('τ = R·C = '+fmtTimeS(tau),x0+6,638);
  }else{
    c.fillStyle='#f0a5a5';c.font='bold 15px Outfit, sans-serif';
    c.fillText('τ = R·C = ? (calcula con tu medición)',x0+6,638);
  }
  c.fillStyle='#5a6b66';c.font='12px Outfit, sans-serif';
  wrapText(c,'La caja negra sella solo el capacitor. R es visible; mide τ en el osciloscopio para hallar C.',x0+6,664,w-30,15);
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
  c.fillText('OSCILOSCOPIO · TRAZA v(t) SOBRE C',x0+6,40);
  c.fillStyle='#07120e';c.fillRect(gx0,gy0,gw,gh);
  c.strokeStyle='rgba(79,209,197,0.22)';c.lineWidth=1;
  for(let i=0;i<=DIVX;i++){const x=gx0+(i/DIVX)*gw;line(c,x,gy0,x,gy0+gh);}
  for(let i=0;i<=DIVY;i++){const y=gy0+(i/DIVY)*gh;line(c,gx0,y,gx0+gw,y);}
  c.strokeStyle='rgba(79,209,197,0.55)';c.lineWidth=1.5;line(c,gx0,gy0+gh,gx0+gw,gy0+gh);

  const timeDivUs=effectiveTimeDivUs();
  const windowS=timeDivUs*1e-6*DIVX;
  const tau=currentTau(),faseNow=currentFase();
  const xToPx=t=>gx0+(t/windowS)*gw;
  const yToPx=v=>gy0+gh-(v/V)*gh;

  const tgtFrac=targetFrac(faseNow);
  c.strokeStyle='#FFB703';c.setLineDash([6,5]);c.lineWidth=1.5;
  line(c,gx0,yToPx(tgtFrac*V),gx0+gw,yToPx(tgtFrac*V));
  c.setLineDash([]);
  c.fillStyle='#FFB703';c.font='12px Outfit, sans-serif';c.textAlign='left';
  c.fillText((faseNow==='descarga'?'36.8%':'63.2%')+' de V',gx0+6,yToPx(tgtFrac*V)-6);

  c.strokeStyle='#4FD1C5';c.lineWidth=2.5;c.beginPath();
  const N=220;
  for(let i=0;i<=N;i++){
    const t=(i/N)*windowS;
    const v=vAt(t,tau,faseNow);
    const px=xToPx(t),py=yToPx(v);
    if(i===0)c.moveTo(px,py);else c.lineTo(px,py);
  }
  c.stroke();

  const cx=gx0+(cursorDiv/DIVX)*gw;
  const tCursor=(cursorDiv/DIVX)*windowS;
  const vCursor=vAt(tCursor,tau,faseNow);
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
      ? 'El capacitor está sellado (❓): conoces R pero no C. Mide τ con el cursor del osciloscopio y despeja C = τ/R.'
      : 'Circuito RC serie: fuente V, resistor R y capacitor C. En "carga" la fuente está conectada; en "descarga", desconectada y C se descarga sobre R.');
  }else{
    showToast('Traza v(t) sobre el capacitor. La línea punteada ámbar marca el 63.2 % (carga) o 36.8 % (descarga) de V — el punto donde t=τ. Arrastra el cursor hasta ese cruce y presiona "Medir τ".');
  }
}

// ============================== 6) BANCO 3D ==============================
const bench=sh(roundedBox(2.9,0.5,1.6,MAT.bench,0.05));bench.position.set(1.75,0.25,0.85);scene.add(bench);
bench.userData={title:'Banco de trabajo',info:'Montaje físico del circuito RC: fuente, resistor y capacitor.'};

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

function makeCap3D(x,z){
  const g=new THREE.Group();g.position.set(x,0.62,z);
  const can=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.22,20),std({color:0x1f3a52,roughness:0.5,metalness:0.15})));
  g.add(can);
  const cv=document.createElement('canvas');cv.width=256;cv.height=256;
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const top=new THREE.Mesh(new THREE.CircleGeometry(0.088,20),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  top.rotation.x=-Math.PI/2;top.position.y=0.111;g.add(top);
  [-1,1].forEach(s=>{
    const lead=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.09,8),MAT.lead);
    lead.position.set(s*0.03,-0.155,0);g.add(lead);
  });
  g.userData={el:'C'};
  scene.add(g);
  return{g,cv,tx};
}
function drawCapLabel(cv,tx,valueStr){
  const c=cv.getContext('2d');
  c.fillStyle='#13314a';c.beginPath();c.arc(128,128,120,0,Math.PI*2);c.fill();
  c.strokeStyle='#3a6a8f';c.lineWidth=6;c.beginPath();c.arc(128,128,116,0,Math.PI*2);c.stroke();
  c.fillStyle='#cfe8ff';c.font='bold 34px Outfit, sans-serif';c.textAlign='center';
  c.fillText(valueStr,128,120);
  c.font='16px Outfit, sans-serif';c.fillStyle='#8fb3d9';
  c.fillText('CAP · +',128,150);
  tx.needsUpdate=true;
}
const capReal=makeCap3D(1.7,0.62);
drawCapLabel(capReal.cv,capReal.tx,fmtC(selC));

const capSealed=sh(roundedBox(0.24,0.24,0.24,MAT.caja,0.04));
capSealed.position.set(1.7,0.62,0.62);
capSealed.visible=false;
capSealed.userData={el:'C'};
scene.add(capSealed);
const capSealedLabel=labelSprite('❓ C','#FFB703');
capSealedLabel.position.set(1.7,0.84,0.62);
capSealedLabel.visible=false;
scene.add(capSealedLabel);

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
groundPost.userData={title:'Referencia (tierra)',info:'Terminal de retorno del circuito RC — el mismo nodo que la referencia (0 V) del osciloscopio.'};

function refreshNet3D(){
  const r=RES3D['R'],b=bandsFor(currentR());
  [b.d1,b.d2,b.mult].forEach((dig,i)=>r.bands[i].material.color.set(BAND_COLORS[dig]));
  r.bands[3].material.color.set('#c9a227');
  const reto=mode==='reto';
  capReal.g.visible=!reto;
  capSealed.visible=reto;
  capSealedLabel.visible=reto;
  if(!reto)drawCapLabel(capReal.cv,capReal.tx,fmtC(currentC()));
}

// ============================== 7) HUD Y PANEL ==============================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos CD (D1) · Régimen transitorio</div>
  <h2>Transitorio RC · Mide τ en el Osciloscopio</h2>
  <p>Al conectar o desconectar una fuente de CD de un capacitor a través de un resistor,
  el voltaje sobre C no cambia instantáneamente: sigue una curva exponencial gobernada por
  <b>τ = R·C</b>, la constante de tiempo. Este banco mide τ directamente sobre la traza de
  un osciloscopio simulado — eligiendo una base de tiempo razonable y leyendo con un cursor
  el cruce del 63.2 %/36.8 % de V — y la contrasta contra el cálculo de R·C.</p>
  <div class="formula">Carga: v(t)=V(1−e^(−t/τ)) · Descarga: v(t)=V·e^(−t/τ) · τ=R·C · v(τ)=63.2 %V (carga)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Traza v(t) sobre C</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Referencia 63.2 %/36.8 % (t=τ)</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Cursor de medición</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> respuesta exponencial exacta de un circuito RC serie de primer orden ante un escalón de CD (carga y descarga); relación τ=R·C; medición realista con base de tiempo discreta (secuencia 1-2-5, como un dial físico de osciloscopio) y cursor manual; caracterización experimental de un capacitor desconocido a partir de R conocida y τ medida.</div>
    <div class="fl no"><b>NO modela:</b> resistencia de fuente, resistencia serie equivalente (ESR) del capacitor, ni efectos de carga del propio osciloscopio sobre el circuito — es un modelo de parámetros concentrados ideal. Las tolerancias (±6 % en τ, ±8 % en C) son un margen PEDAGÓGICO de este ejercicio, no una especificación de instrumento real.</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · IEC 60617 · IEC 60063</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Transitorio RC · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">📈 Explora</button>
    <button class="b" id="m_medicion">🖥️ Medición</button>
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
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inC">C =</label><input id="inC" inputmode="decimal" autocomplete="off" style="width:80px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>nF</span></span>
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
  if(id==='C'&&mode==='reto'){
    showToast('🔒 Capacitor sellado: no puedes leer su valor directamente. Mide τ en el osciloscopio y calcula C = τ/R.');
    return;
  }
  if(id==='R'){
    const b=bandsFor(currentR());
    showToast(`<b style="color:var(--accent2)">R · ${fmtR(currentR())}</b><br><span style="color:var(--dim);font-size:11px">Bandas: ${BAND_NAMES[b.d1]}-${BAND_NAMES[b.d2]}-${BAND_NAMES[b.mult]}-oro.</span>`);
    return;
  }
  if(id==='C'){
    showToast(`<b style="color:var(--accent2)">C · ${fmtC(currentC())}</b><br><span style="color:var(--dim);font-size:11px">Capacitor de carga/descarga del circuito RC.</span>`);
    return;
  }
  if(id==='V'){
    showToast(`<b style="color:var(--accent2)">V · ${fmtV(V)}</b><br><span style="color:var(--dim);font-size:11px">Fuente ideal de CD (sin resistencia interna — modelo).</span>`);
  }
}

// ============================== 9) MODOS Y SELBAR ==============================
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.0,2.4,7.0],[0.4,1.3,0.0]],mision:'Cambia R y C, observa la forma de la curva de carga/descarga y verifica que τ=R·C predice el 63.2 %/36.8 % en cada combinación.'},
  medicion:{nombre:'Medición',cam:[[-0.3,2.1,3.6],[-1.0,1.75,-0.6]],mision:'Elige una base de tiempo adecuada para la τ actual y mide τ con el cursor sobre la traza — contrasta tu lectura contra R·C.'},
  reto:{nombre:'Reto',cam:[[2.6,2.0,4.2],[1.6,1.0,0.55]],mision:'Capacitor sellado: conoces R pero no C. Mide τ en el osciloscopio y despeja C=τ/R.'},
};
function buildSelBar(){
  const bar=el('selbar');
  if(mode==='reto'){bar.style.display='none';bar.innerHTML='';return;}
  bar.style.display='flex';
  let html=`<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin-right:4px">R:</span>`+
    R_CANDIDATES.map(r=>`<button class="b sm ${r===selR?'on':''}" data-r="${r}">${fmtR(r)}</button>`).join('')+
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">C:</span>`+
    C_CANDIDATES.map(cv=>`<button class="b sm ${cv===selC?'on':''}" data-c="${cv}">${fmtC(cv)}</button>`).join('')+
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">Fase:</span>`+
    ['carga','descarga'].map(f=>`<button class="b sm ${f===fase?'on':''}" data-f="${f}">${f==='carga'?'Carga':'Descarga'}</button>`).join('')+
    `</div>`;
  if(mode==='medicion'){
    const choices=timeDivChoicesFor(currentTau());
    html+=`<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">Base de tiempo:</span>`+
      choices.map(c=>`<button class="b sm ${c.key===timeDivKey?'on':''}" data-td="${c.key}">${c.label}</button>`).join('')+
      `</div>`;
  }
  bar.innerHTML=html;
  bar.querySelectorAll('[data-r]').forEach(b=>{b.onclick=()=>{selR=parseFloat(b.dataset.r);afterEdit();};});
  bar.querySelectorAll('[data-c]').forEach(b=>{b.onclick=()=>{selC=parseFloat(b.dataset.c);afterEdit();};});
  bar.querySelectorAll('[data-f]').forEach(b=>{b.onclick=()=>{fase=b.dataset.f;afterEdit();};});
  if(mode==='medicion'){
    bar.querySelectorAll('[data-td]').forEach(b=>{b.onclick=()=>{timeDivKey=b.dataset.td;medido=false;tauMedido=null;buildSelBar();refreshAll();};});
  }
}
function setMode(k){
  mode=k;
  medido=false;tauMedido=null;cursorDiv=5.0;el('cursor').value='5';
  if(k==='medicion')timeDivKey='rapido';
  ['explora','medicion','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
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
  if(mode==='medicion')timeDivKey='rapido';
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
  if(mode==='explora'){
    t.innerHTML=
      teleRow('R',fmtR(selR))+
      teleRow('C',fmtC(selC))+
      teleRow('V',fmtV(V))+
      teleRow('τ = R·C',fmtTimeS(tau))+
      teleRow('Fase',fase==='carga'?'Carga':'Descarga')+
      teleRow('Base de tiempo (auto)',fmtUs(timeDivUs));
  }else if(mode==='medicion'){
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
      teleRow('C',fmtC(selC))+
      teleRow('τ = R·C (calculado)',fmtTimeS(tau))+
      teleRow('Base de tiempo elegida',fmtUs(timeDivUs),okTd?'good':'warn')+
      teleRow('τ medido (cursor)',medido?fmtTimeS(tauMedido):'🔒 sin medir',medido?tolCls:'warn')+
      teleRow('Estado',medido?(tolCls==='good'?'✔ dentro de ±6 %':'revisa el cursor, fuera de ±6 %'):'Elige la base de tiempo correcta y mide τ',medido&&tolCls==='good'?'good':'warn');
  }else{
    const sc=RETO_SCENARIOS[retoIdx];
    t.innerHTML=
      teleRow('R (conocida)',fmtR(sc.R))+
      teleRow('C',retoSolved?fmtC(sc.C):'🔒 desconocida')+
      teleRow('τ medido (cursor)',medido?fmtTimeS(tauMedido):'🔒 sin medir',medido?'good':'warn')+
      teleRow('Tu C calculada',(el('inC')&&el('inC').value)?el('inC').value+' nF':'—')+
      teleRow('Estado',retoSolved?'✔ PREDICCIÓN VALIDADA':(medido?'Calcula C=τ/R y comprueba':'Mide τ primero'),retoSolved?'good':'warn');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  const tau=currentTau();
  if(mode==='explora'){
    html+=`<span class="mono">τ=R·C=${fmtR(selR)}·${fmtC(selC)}=${fmtTimeS(tau)}. A t=τ, v alcanza el 63.2 % de V (carga) o cae al 36.8 % (descarga); a t=5τ el circuito está al 99.3 % de su valor final.</span>`;
  }else if(mode==='medicion'){
    const choices=timeDivChoicesFor(tau);
    const chosen=choices.find(c=>c.key===timeDivKey);
    html+=chosen&&chosen.ok
      ? `<span class="mono">Con ${fmtUs(chosen.us)} la ventana completa (10 divisiones) cubre ≈5τ — el cruce del 63.2 %/36.8 % cae dentro de la pantalla y es legible.</span>`
      : `<span class="mono">Con ${fmtUs((chosen||choices[0]).us)} la traza ${timeDivKey==='rapido'?'se corta antes de terminar el transitorio':'queda comprimida contra el eje'} — cambia la base de tiempo antes de medir.</span>`;
  }else{
    html+=retoMsg||`<span class="mono">Capacitor sellado. Mide τ con el cursor del osciloscopio (base de tiempo ya ajustada) y calcula C=τ/R usando la R conocida.</span>`;
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
  if(mode==='medicion'){
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
    showToast(`Medición registrada: τ ≈ ${fmtTimeS(tauMedido)}. Ahora calcula C=τ/R (R=${fmtR(currentR())}) y compruébalo abajo.`);
  }
  refreshAll();
}
function checkReto(){
  if(!medido){showToast('⚠️ Primero mide τ en el osciloscopio (botón "Medir τ").');return;}
  const sc=RETO_SCENARIOS[retoIdx];
  const cGuessNF=numOr('inC');
  if(!isFinite(cGuessNF)){showToast('⚠️ Ingresa tu valor calculado de C (en nF).');return;}
  const cGuess=cGuessNF*1e-9;
  const tolC=Math.max(sc.C*0.08,5e-9);
  const ok=Math.abs(cGuess-sc.C)<=tolC;
  retoSolved=ok;
  if(ok){
    synth.beep(1046,0.12,0.06);
    retoMsg=`<span class="mono"><span class="ok">✔ Correcto.</span> Tu C calculada está dentro del margen pedagógico (±8 %). C = τ_medido/R = ${fmtTimeS(tauMedido)}/${fmtR(sc.R)}.</span>`;
  }else{
    synth.beep(220,0.15,0.06);
    retoMsg=`<span class="mono"><span class="dtc">✗ Aún no.</span> Fuera de tolerancia — revisa que el cursor esté justo sobre el cruce del 63.2 % y recalcula C=τ/R. No se muestra el valor real de C.</span>`;
  }
  refreshAll();
}
function updateRetoSpec(){
  const sc=RETO_SCENARIOS[retoIdx];
  el('retoSpec').innerHTML=`Capacitor sellado en un circuito RC con R=${fmtR(sc.R)} conocida. Mide τ con el cursor del osciloscopio ("Medir τ"), calcula C=τ/R y repórtalo en nF.<br><span style="color:var(--dim)">La tolerancia (±8 %) es un margen pedagógico de este ejercicio, no una especificación de fabricante.</span>`;
}
function newScenario(){
  const pick=()=>Math.floor(Math.random()*RETO_SCENARIOS.length);
  let idx=pick();
  if(RETO_SCENARIOS.length>1)while(idx===retoIdx)idx=pick();
  retoIdx=idx;retoSolved=false;retoMsg='';medido=false;tauMedido=null;
  el('inC').value='';
  cursorDiv=5.0;el('cursor').value='5';
  if(mode!=='reto'){setMode('reto');}
  else{updateRetoSpec();solved=false;clearDx();buildQuiz();refreshQuestion();refreshAll();}
  showToast('🔀 <b>Nuevo capacitor sellado.</b> Vuelve a medir τ desde cero.');
  synth.beep(520,0.08,0.05);
}
function onRetoInput(){if(mode!=='reto')return;retoSolved=false;retoMsg='';refreshAll();}

// ============================== 12) QUIZ ==============================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'Si duplicas R sin cambiar C, ¿qué le pasa a τ y a la forma de la curva?',
      opciones:[
        {t:'τ se duplica (τ=R·C es lineal en R): la curva tarda el doble en llegar al 63.2 % de V, sin cambiar el valor final (V) ni la forma exponencial en sí',ok:true,why:'Correcto: τ=R·C es directamente proporcional a R. Duplicar R duplica τ — la curva se "estira" en el eje del tiempo, pero sigue siendo la misma exponencial y llega al mismo valor final.'},
        {t:'τ se reduce a la mitad, porque más resistencia limita más la corriente',ok:false,why:'Más resistencia SÍ limita más la corriente, pero eso hace que el capacitor tarde MÁS en cargarse, no menos — τ crece con R, no decrece.'},
        {t:'τ no cambia: solo depende de C',ok:false,why:'τ=R·C depende de AMBOS componentes. Cambiar cualquiera de los dos cambia τ proporcionalmente.'},
        {t:'La curva deja de ser exponencial y se vuelve lineal',ok:false,why:'La forma funcional (exponencial) no cambia al variar R o C — solo cambia la escala temporal (τ). Sigue siendo v(t)=V(1−e^(−t/τ)).'},
      ],
    },
    medicion:{
      pregunta:'¿Por qué una base de tiempo demasiado rápida (pocos µs/div) impide medir τ correctamente?',
      opciones:[
        {t:'Porque la ventana visible termina antes de que la traza alcance su valor asintótico — no se alcanza a ver ni el cruce del 63.2 %/36.8 % con margen, ni confirmar que el transitorio ya terminó',ok:true,why:'Exacto: si la ventana total (10 divisiones × time/div) es mucho menor que el transitorio completo, la traza queda cortada al inicio de la curva, sin mostrar suficiente forma para leer el cruce con confianza.'},
        {t:'Porque el color de la traza cambia y se vuelve ilegible',ok:false,why:'El color de la traza no depende de la base de tiempo — es la escala temporal, no la apariencia visual, lo que se ve afectado.'},
        {t:'Porque el osciloscopio se apaga automáticamente con bases de tiempo rápidas',ok:false,why:'El modelo no incluye ningún mecanismo de apagado — el problema es puramente de encuadre: la ventana visible es demasiado corta para el fenómeno.'},
        {t:'Porque V baja cuando la base de tiempo es rápida',ok:false,why:'V (el voltaje de la fuente) es fijo y no depende de la base de tiempo elegida — solo cambia qué porción del tiempo se muestra en pantalla.'},
      ],
    },
    reto:{
      pregunta:'En la caja con capacitor sellado conoces R pero no C. ¿Por qué basta con medir τ en el osciloscopio para hallar C?',
      opciones:[
        {t:'Porque τ=R·C, así que C=τ/R usando la R conocida y la τ medida — no hace falta ver ni tocar el capacitor directamente',ok:true,why:'Correcto: τ=R·C es una relación algebraica simple. Con R conocida y τ medida experimentalmente, C=τ/R queda completamente determinada sin inspeccionar el componente.'},
        {t:'Porque el osciloscopio mide C directamente, como si fuera un capacímetro',ok:false,why:'El osciloscopio solo mide voltaje contra tiempo (v(t)) — no mide capacitancia directamente. C se obtiene indirectamente vía τ=R·C.'},
        {t:'Porque todos los capacitores sellados de este laboratorio valen 1 µF por diseño',ok:false,why:'Cada escenario del reto usa un valor distinto de C — por eso hay que medir τ de nuevo en cada caja, no se puede memorizar un solo valor.'},
        {t:'Porque V determina C',ok:false,why:'V (el voltaje de la fuente) no aparece en la relación τ=R·C — la constante de tiempo es independiente de la amplitud de la fuente.'},
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
    selR=2200;selC=470e-9;fase='carga';afterEdit();
    showToast('Paso 1 · Observa la curva de carga: sube hacia V siguiendo v(t)=V(1−e^(−t/τ)).');await sleep(2000);
    fase='descarga';afterEdit();
    showToast('Ahora la descarga: v(t)=V·e^(−t/τ), cayendo desde V hacia 0.');await sleep(2000);
    fase='carga';afterEdit();

    setMode('medicion');
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
    answer(QUIZ.medicion.opciones.findIndex(o=>o.ok));await sleep(1600);

    setMode('reto');
    showToast('Paso 3 · Capacitor sellado: mide τ y calcula C=τ/R.');await sleep(2000);
    {
      const sc=RETO_SCENARIOS[retoIdx],tau=tauOf(sc.R,sc.C),us=effectiveTimeDivUs();
      cursorDiv=Math.min(10,divForTime(tau,us));el('cursor').value=String(cursorDiv);
    }
    refreshAll();
    medirTau();await sleep(1800);
    {
      const sc=RETO_SCENARIOS[retoIdx];
      const cGuess=(tauMedido/sc.R)*1e9;
      el('inC').value=cGuess.toFixed(1);
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
  capSealedLabel.scale.setScalar(s);
});

['explora','medicion','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newScenario;
el('btnCheck').onclick=checkReto;
el('btnMedir').onclick=medirTau;
el('cursor').oninput=()=>{cursorDiv=parseFloat(el('cursor').value);refreshAll();};
el('inC').addEventListener('input',onRetoInput);
el('inC').addEventListener('keydown',e=>{if(e.key==='Enter')checkReto();});
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊 Sonido':'🔇 Sonido';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildQuiz();refreshNet3D();
S.start();
setMode('explora');

window.__labDebug={
  mode:()=>mode,
  R:()=>currentR(),
  C:()=>currentC(),
  V:()=>V,
  fase:()=>currentFase(),
  tau:()=>currentTau(),
  timeDivUs:()=>effectiveTimeDivUs(),
  timeDivKey:()=>timeDivKey,
  cursorDiv:()=>cursorDiv,
  setCursorDiv:d=>{cursorDiv=Math.max(0,Math.min(10,d));el('cursor').value=String(cursorDiv);refreshAll();},
  vAtCursor:()=>{const us=effectiveTimeDivUs();const t=(cursorDiv/DIVX)*(us*1e-6*DIVX);return vAt(t,currentTau(),currentFase());},
  medido:()=>medido,
  tauMedido:()=>tauMedido,
  setTimeDivKey:k=>{timeDivKey=k;medido=false;tauMedido=null;buildSelBar();refreshAll();},
  setSelR:r=>{selR=r;afterEdit();},
  setSelC:c=>{selC=c;afterEdit();},
  setFase:f=>{fase=f;afterEdit();},
  medirTau:()=>medirTau(),
  checkReto:()=>checkReto(),
  setInC:nf=>{el('inC').value=String(nf);},
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
