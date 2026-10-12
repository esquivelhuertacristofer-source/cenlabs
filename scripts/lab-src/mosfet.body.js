/*
  Caracteriza el MOSFET y su Driver de Compuerta (d2-09)
  Circuito de fuente común: VDD—RD—Drenaje, Fuente a GND, VGS aplicado directo
  a la Compuerta (que no consume corriente DC — a diferencia de la base de un
  BJT). Un solo transistor, tres dispositivos de catálogo intercambiables.

  SÍ modela: modelo de canal largo de dos/tres regiones —
  corte (VGS≤Vth → ID=0), saturación (ID=k·(VGS−Vth)², ley cuadrática) y
  triodo/óhmica (ID=k·(2·(VGS−Vth)·VDS−VDS²)) — resuelto de forma
  autoconsistente sobre la recta de carga VDS=VDD−ID·RD (sin aproximaciones
  de pequeña señal), Vth con dispersión real de fábrica (rango min–max de
  hoja de datos), coeficiente k derivado de gfs y la corriente de prueba ID
  del propio fabricante (k=gfs²/(4·ID_test) — extensión propia de este
  simulador, no una cifra publicada directamente en catálogo), y una
  estimación de primer orden del tiempo de encendido del driver de
  compuerta t_on≈Qg/I_driver.

  NO modela: resistencia de canal dependiente de temperatura
  (autocalentamiento), capacitancias no lineales completas (Ciss/Coss/Crss)
  más allá de la carga de compuerta total Qg, meseta de Miller explícita en
  la curva de encendido, impedancia de salida no ideal del driver real,
  límites dinámicos de área de operación segura (SOA) — el simulador
  compara ID/Ptot instantáneos contra los máximos de catálogo solo como
  advertencia, no como física de falla térmica real, ruptura por avalancha,
  ni λ (modulación de longitud de canal / resistencia de salida finita).
*/

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[0,4.3,6.9],target:[0,1.15,0.5],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

const el=function(id){return document.getElementById(id);};
let toastT=null;
function showToast(msg){
  const t=el('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},4200);
}

/* ---------- 1) Modelo físico ---------- */
const DEVS={
  irf540n:{
    name:'IRF540N (N-MOSFET potencia)',
    vthMin:2.0,vthMax:4.0,
    k:6.890625,
    qgTotal:71,
    qgNote:'71 nC máx. (VGS llevado a 10 V) según International Rectifier/Infineon PD-94812. IRF540N tiene DOS fabricantes con hojas de datos distintas bajo el mismo nombre comercial (IR/Infineon vs. Fairchild, que reporta Qg máx=79 nC); solo IR/Infineon publica gfs, por lo que esta ficha usa IR/Infineon como fuente primaria.',
    rdsOn:0.044,
    ptot:130,
    ptotNote:'130 W según IR/Infineon PD-94812 (TC=25°C); Fairchild Rev.C reporta 120 W para el mismo número de parte — confirmar siempre con la hoja de datos del fabricante específico en la mano.',
    idMax:33,vdsMax:100,
    color:0x1a2a1a,
  },
  irlz44n:{
    name:'IRLZ44N (N-MOSFET nivel lógico)',
    vthMin:1.0,vthMax:2.0,
    k:4.41,
    qgTotal:48,
    qgNote:'48 nC típico @ ID=25 A, VDS=44 V, referencia de meseta Miller VGS=5 V.',
    rdsOn:0.022,
    ptot:110,
    ptotNote:'110 W según International Rectifier PD-9.1346B (25/8/97), sin reedición Infineon posterior. Alguna fuente cita 83 W, cifra que no aparece en la hoja de datos oficial.',
    idMax:47,vdsMax:55,
    color:0x203a2e,
  },
  n2n7000:{
    name:'2N7000 (N-MOSFET señal pequeña)',
    vthMin:0.8,vthMax:3.0,
    k:0.0125,
    qgTotal:null,
    qgNote:'No especificado por el fabricante — ninguna de las dos hojas de datos oficiales consultadas (Fairchild 1995, ON Semiconductor Rev.5) reporta Qg para este dispositivo. No se estima ni se inventa una cifra.',
    rdsOn:5,
    ptot:0.35,
    ptotNote:'350 mW @TC=25°C según ON Semiconductor Rev.5 (hoja vigente); la hoja Fairchild 1995 original reporta 400 mW @TA=25°C — referencias de temperatura distintas, no directamente comparables.',
    idMax:0.2,vdsMax:60,
    color:0x2e2e2e,
  },
};

function solveMOSFET(dev,vth,VDD,RD,VGS){
  if(VGS<=vth){
    return {region:'corte',ID:0,VDS:VDD,VOV:VGS-vth};
  }
  const k=dev.k;
  const VOV=VGS-vth;
  const IDsat=k*VOV*VOV;
  const VDSsat=VDD-IDsat*RD;
  if(VDSsat>=VOV){
    return {region:'saturacion',ID:IDsat,VDS:VDSsat,VOV:VOV};
  }
  const a=k*RD,b=-(2*k*RD*VOV+1),c=VDD;
  const disc=Math.max(b*b-4*a*c,0);
  const sq=Math.sqrt(disc);
  let VDS=(-b-sq)/(2*a);
  if(!(VDS>=0&&VDS<=VOV))VDS=(-b+sq)/(2*a);
  VDS=Math.max(0,Math.min(VOV,VDS));
  const ID=k*(2*VOV*VDS-VDS*VDS);
  return {region:'triodo',ID:ID,VDS:VDS,VOV:VOV};
}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function fmtV(v){return v.toFixed(3)+' V';}
function fmtI(i){
  if(i>=1)return i.toFixed(3)+' A';
  if(i>=0.001)return (i*1000).toFixed(2)+' mA';
  return (i*1e6).toFixed(1)+' µA';
}
function fmtTick(i){
  if(i>=1)return i.toFixed(2)+' A';
  if(i>=0.001)return (i*1000).toFixed(0)+' mA';
  return (i*1e6).toFixed(0)+' µA';
}
function fmtP(w){return w>=1?w.toFixed(3)+' W':(w*1000).toFixed(1)+' mW';}
function fmtR(r){
  if(r>=1e6)return (r/1e6).toFixed(2)+' MΩ';
  if(r>=1000)return (r/1000).toFixed(2)+' kΩ';
  if(r<10)return r.toFixed(1)+' Ω';
  return r.toFixed(0)+' Ω';
}
function fmtT(s){
  if(s>=1)return s.toFixed(3)+' s';
  if(s>=1e-3)return (s*1e3).toFixed(2)+' ms';
  if(s>=1e-6)return (s*1e6).toFixed(2)+' µs';
  return (s*1e9).toFixed(1)+' ns';
}
function pickStep(maxVal){
  const raw=maxVal/6,mag=Math.pow(10,Math.floor(Math.log10(raw))),norm=raw/mag;
  if(norm<1.5)return 1*mag;
  if(norm<3.5)return 2*mag;
  if(norm<7.5)return 5*mag;
  return 10*mag;
}

/* ---------- 2) Estado ---------- */
const VDD_VALS=[5,9,12,15,18,24];
const RD_VALS=[1,2.2,4.7,10,22,47];
const DRIVER_VALS=[0.02,0.05,0.5,2];
const DRIVER_LABELS=['GPIO directo (~20 mA)','Buffer lógico (~50 mA)','Driver dedicado (~500 mA)','Driver alta corriente (~2 A)'];

let devKey='irf540n';
let VDDidx=2,RDidx=3,driverIdx=1;
let vth=(DEVS[devKey].vthMin+DEVS[devKey].vthMax)/2;
let VGS=6.0;
let mode='explora';
let PRED=null,predSolved=false,predRevealed=false,predType='A';
let RETO=null,retoSolved=false;
let sweeping=false;
const SWEEP_VTH=[];
let RES=null;
function curDev(){return DEVS[devKey];}
function curVDD(){return VDD_VALS[VDDidx];}
function curRD(){return RD_VALS[RDidx];}
function curDriver(){return DRIVER_VALS[driverIdx];}
function curSolve(){return solveMOSFET(curDev(),vth,curVDD(),curRD(),VGS);}
function tOn(){
  const dev=curDev();
  if(dev.qgTotal==null)return null;
  return (dev.qgTotal*1e-9)/curDriver();
}

/* ---------- 3) Materiales ---------- */
const std=function(o){return new THREE.MeshStandardMaterial(o);};
const MAT={
  bench:std({color:0x0e1512,roughness:0.9,metalness:0.05}),
  frame:std({color:0x11201c,roughness:0.6,metalness:0.3}),
  pcb:std({color:0x0c2a20,roughness:0.75}),
  scope:std({color:0x121a18,roughness:0.35,metalness:0.5}),
  lead:std({color:0xb9c2bd,metalness:0.8,roughness:0.3}),
  resistor:std({color:0xe8d9b0,roughness:0.5}),
  mosfetBody:std({color:0x1a1a1a,roughness:0.4,metalness:0.15}),
  mosfetTab:std({color:0xb9c2bd,metalness:0.85,roughness:0.25}),
};
const BAND_COLORS=['#1a1a1a','#7a4a1e','#d23b3b','#e8871e','#e8d21e','#3fae3f','#2e6fe0','#8a4fd6','#8a8a8a','#e8e8e8'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1,dd=Math.round(v/Math.pow(10,exp));return {d1:Math.floor(dd/10),d2:dd%10,mult:exp+1};}

/* ---------- 4) Ayudantes de dibujo 2D ---------- */
function line(c,x0,y0,x1,y1,col,w,dash){c.save();c.strokeStyle=col;c.lineWidth=w||2;if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
function rr(c,x,y,w,h,r,fill,stroke,sw){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=sw||2;c.stroke();}}
function groundGlyph(c,x,y){line(c,x,y,x,y+14,'#EAF4F1',2.5);line(c,x-16,y+14,x+16,y+14,'#EAF4F1',2.5);line(c,x-10,y+21,x+10,y+21,'#EAF4F1',2);line(c,x-4,y+28,x+4,y+28,'#EAF4F1',1.5);}
function vResistorGlyph(c,cx,y0,y1,label){rr(c,cx-16,y0+8,32,(y1-y0)-16,4,'#1a2a26','#EAF4F1',2);line(c,cx,y0,cx,y0+8,'#EAF4F1',2.5);line(c,cx,y1-8,cx,y1,'#EAF4F1',2.5);if(label){c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='left';c.fillText(label,cx+22,(y0+y1)/2+4);}}
function mosfetGlyph(c,cx,cy,r,gateX,col){
  c.beginPath();c.arc(cx,cy,r,0,7);c.fillStyle=col||'#16211d';c.fill();c.strokeStyle='#EAF4F1';c.lineWidth=2;c.stroke();
  line(c,cx,cy-r,cx,cy-r*0.3,'#EAF4F1',2.5);
  line(c,cx,cy-r*0.3,cx,cy+r*0.3,'#EAF4F1',3);
  line(c,cx,cy+r*0.3,cx,cy+r,'#EAF4F1',2.5);
  const ax=cx,ay=cy+r*0.3;
  c.beginPath();c.moveTo(ax,ay);c.lineTo(ax-9,ay-6);c.lineTo(ax-9,ay+2);c.closePath();
  c.fillStyle='#EAF4F1';c.fill();
  const gx=cx-r*0.42;
  line(c,gx,cy-r*0.32,gx,cy+r*0.32,'#EAF4F1',3);
  line(c,gateX,cy,gx,cy,'#EAF4F1',2.5);
}

/* ---------- 5) Pizarrón: esquemático + gráfica ---------- */
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;
const PX0=130,PX1=940,PY0=308,PY1=676;

const GATE_X=300,GATE_R=26,DEV_X=620,DEV_R=32,DEV_CY=175;
const VDD_Y=40,GND_Y=286;
const RD_Y0=VDD_Y,RD_Y1=DEV_CY-DEV_R;
const S_Y0=DEV_CY+DEV_R,S_Y1=GND_Y;

const HIT=[
  {x:DEV_X,y:(RD_Y0+RD_Y1)/2,r:44,act:'rd'},
  {x:DEV_X,y:DEV_CY,r:DEV_R+16,act:'mosfet'},
  {x:GATE_X,y:DEV_CY,r:GATE_R+14,act:'vgs'},
];

function graphRange(){
  const vMaxG=curVDD()*1.05;
  const iMaxG=(curVDD()/curRD())*1.15;
  return {vMaxG:vMaxG,iMaxG:iMaxG};
}
function xPix(v){const g=graphRange();return PX0+(v/g.vMaxG)*(PX1-PX0);}
function gyPix(i){const g=graphRange();return PY1-(Math.max(Math.min(i,g.iMaxG),0)/g.iMaxG)*(PY1-PY0);}

function drawSchematic(c){
  c.clearRect(0,0,1024,PY0-4);
  line(c,GATE_X-40,VDD_Y,DEV_X+40,VDD_Y,'#EAF4F1',2.5);
  c.beginPath();c.arc(DEV_X,VDD_Y,4,0,7);c.fillStyle='#4FD1C5';c.fill();
  c.fillStyle='#4FD1C5';c.font='bold 13px system-ui';c.textAlign='center';
  c.fillText('+VDD = '+curVDD().toFixed(0)+' V',(GATE_X+DEV_X)/2,VDD_Y-14);

  vResistorGlyph(c,DEV_X,RD_Y0,RD_Y1,'RD');
  const dev=curDev(),col=RES?curColor():'#8FB3AC';
  mosfetGlyph(c,DEV_X,DEV_CY,DEV_R,DEV_X-90,col);
  line(c,DEV_X,S_Y0,DEV_X,S_Y1,'#EAF4F1',2.5);
  groundGlyph(c,DEV_X,GND_Y);

  c.beginPath();c.arc(GATE_X,DEV_CY,GATE_R,0,7);c.fillStyle='#16211d';c.fill();c.strokeStyle='#EAF4F1';c.lineWidth=2;c.stroke();
  c.fillStyle='#EAF4F1';c.font='bold 13px monospace';c.textAlign='center';
  c.fillText('+',GATE_X,DEV_CY-6);
  c.fillText('−',GATE_X,DEV_CY+18);
  line(c,GATE_X+GATE_R,DEV_CY,DEV_X-90,DEV_CY,'#EAF4F1',2.5);
  line(c,GATE_X,DEV_CY+GATE_R,GATE_X,GND_Y,'#EAF4F1',2.5);
  groundGlyph(c,GATE_X,GND_Y);
  c.fillStyle='#4FD1C5';c.font='bold 12px system-ui';c.textAlign='center';
  c.fillText('VGS = '+VGS.toFixed(2)+' V',GATE_X,DEV_CY-GATE_R-16);

  c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='left';
  c.fillText(dev.name+' · Vth='+vth.toFixed(2)+' V',DEV_X+DEV_R+16,DEV_CY+4);
}

function drawGraph(c){
  const g=graphRange();
  rr(c,PX0-4,PY0-4,(PX1-PX0)+8,(PY1-PY0)+8,6,'#0c1a16','#1E3A34',2);
  const xt=g.vMaxG<=8?1:g.vMaxG<=16?2:5;
  c.font='10px monospace';
  for(let v=0;v<=g.vMaxG+1e-6;v+=xt){
    const x=xPix(v);
    line(c,x,PY0,x,PY1,'#12241f',1);
    c.fillStyle='#8FB3AC';c.textAlign='center';c.fillText(v.toFixed(0),x,PY1+16);
  }
  const yt=pickStep(g.iMaxG);
  for(let i=0;i<=g.iMaxG+1e-12;i+=yt){
    const y=gyPix(i);
    line(c,PX0,y,PX1,y,'#12241f',1);
    c.fillStyle='#8FB3AC';c.textAlign='right';
    c.fillText(fmtTick(i),PX0-8,y+4);
  }
  line(c,PX0,PY1,PX1,PY1,'#EAF4F1',2);
  line(c,PX0,PY0,PX0,PY1,'#EAF4F1',2);
  c.fillStyle='#EAF4F1';c.font='12px monospace';c.textAlign='center';
  c.fillText('VDS (V)',(PX0+PX1)/2,PY1+34);
  c.save();c.translate(PX0-56,(PY0+PY1)/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText('ID',0,0);c.restore();

  if(!(mode==='predice'&&!predRevealed)){
    const iSat=curVDD()/curRD();
    const p0x=xPix(0),p0y=gyPix(iSat);
    const p1x=xPix(curVDD()),p1y=gyPix(0);
    line(c,p0x,p0y,p1x,p1y,'#E8871E',2,[6,4]);
  }

  if(mode==='barrido'&&SWEEP_VTH.length){
    c.beginPath();let started=false;
    SWEEP_VTH.forEach(function(pt){const x=xPix(pt.VDS),y=gyPix(pt.ID);if(!started){c.moveTo(x,y);started=true;}else c.lineTo(x,y);});
    c.strokeStyle='#4FD1C5';c.lineWidth=2.5;c.stroke();
    c.font='11px monospace';c.textAlign='left';
    c.fillStyle='#4FD1C5';c.fillText('● Punto Q al variar Vth (min → max)',PX0+8,PY0+16);
  }

  if(RES&&!(mode==='predice'&&!predRevealed)){
    const qx=xPix(RES.VDS),qy=gyPix(RES.ID);
    c.beginPath();c.arc(qx,qy,6,0,7);c.fillStyle='#FFB703';c.fill();c.strokeStyle='#fff';c.lineWidth=1.5;c.stroke();
    c.fillStyle='#FFB703';c.font='bold 12px monospace';c.textAlign='left';
    c.fillText('Q ('+RES.VDS.toFixed(2)+'V, '+fmtI(RES.ID)+')',qx+10,qy-10);
  }
}

function drawBoard(){
  const c=bCx;
  c.clearRect(0,0,1024,768);
  c.fillStyle='#0a1512';c.fillRect(0,0,1024,768);
  drawSchematic(c);
  drawGraph(c);
  bTex.needsUpdate=true;
}
function curColor(){
  // Oculto en Predicción hasta verificar — el color por región delataría la respuesta
  // tanto en el esquemático como en el MOSFET 3D del banco.
  if(!RES||(mode==='predice'&&!predRevealed))return '#4FD1C5';
  if(RES.region==='triodo')return '#E8871E';
  if(RES.region==='corte')return '#8a8a8a';
  return '#3fae3f';
}
function overCurrent(){return RES&&RES.ID>curDev().idMax;}
function overPower(){return RES&&(RES.ID*RES.VDS)>curDev().ptot;}
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  if(RES&&!(mode==='predice'&&!predRevealed)){
    const qx=xPix(RES.VDS),qy=gyPix(RES.ID);
    if(Math.hypot(x-qx,y-qy)<40){
      showToast('Punto Q: VDS = '+fmtV(RES.VDS)+' · ID = '+fmtI(RES.ID)+' · región: '+RES.region);
      return;
    }
  }
  let best=null,bd=1e9;
  for(let k=0;k<HIT.length;k++){
    const h=HIT[k];
    const d=Math.hypot(x-h.x,y-h.y);
    if(d<h.r&&d<bd){bd=d;best=h;}
  }
  if(!best)return;
  synth.beep(720,.05,.05);
  if(best.act==='rd')showToast('RD = '+fmtR(curRD())+' — junto con VDD fija la pendiente de la recta de carga.');
  if(best.act==='vgs')showToast('VGS = '+fmtV(VGS)+' — voltaje de compuerta que tú controlas directamente. A diferencia de la base de un BJT, la compuerta MOSFET no consume corriente DC (está aislada por óxido).');
  if(best.act==='mosfet')showToast(curDev().name+' — Vth de fábrica '+curDev().vthMin+'–'+curDev().vthMax+' V (dispersión real de fábrica), Vth actual = '+vth.toFixed(2)+' V.');
}

/* ---------- 6) Banco 3D ---------- */
/* El pizarrón (esquemático + recta de carga) va arriba y al fondo; debajo, el
   montaje REAL sobre un protoboard: la fuente, el medidor y el driver de
   compuerta en el estante, y el circuito cableado a mano con sus encapsulados. */
const boardG=new THREE.Group();
const board=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.95),new THREE.MeshStandardMaterial({map:bTex,roughness:0.55,metalness:0.05}));
board.userData.title='Esquemático + recta de carga';
const boardFrame=new THREE.Mesh(new THREE.BoxGeometry(2.68,2.03,0.05),MAT.frame);
boardFrame.position.z=-0.03;
boardG.add(boardFrame,board);
boardG.scale.setScalar(1.0);
boardG.position.set(0,2.3,-1.55);
S.scene.add(boardG);

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
  mesa:MAT.bench,estante:MAT.frame,
};

/* El banco de prototipos (mesa, estante con instrumentos y protoboard) viene de
   la biblioteca: lo que es de ESTE laboratorio es el circuito que se arma en él. */
const BANCO=P3.bancoPrototipos(MATP,{cols:18,K:1.7,instrumentos:3});
const benchG=BANCO;
const circG=BANCO.userData.circ,H=BANCO.userData.H;
const railNear=BANCO.userData.rielCerca;
/* De izquierda a derecha: el driver (junto al chip), el medidor y la fuente (junto
   a RD): así los cables no cruzan el montaje de lado a lado. */
const driverBox=BANCO.userData.instrumento(0);
const medidorBox=BANCO.userData.instrumento(1);
medidorBox.g.userData.title='Medidor ID / VDS';
const fuenteBox=BANCO.userData.instrumento(2);
fuenteBox.g.userData.title='Fuente VDD';fuenteBox.g.userData.act='src3d';
driverBox.g.userData.title='Driver de compuerta';driverBox.g.userData.act='driver3d';
const cableMat={rojo:0xd64545,negro:0x1b1f24,azul:0x2a5fa8,amarillo:0xe0a21c,verde:0x2f9e5b,naranja:0xe07b22};

/* LA ZONA DE MONTAJE: lo que depende del dispositivo se rehace aquí; el valor de
   RD sólo repinta sus bandas. */
function fmtRd(r){return String(r).replace('.',',')+' Ω';}
let rdG=null,mosfetG=null,driverChipG=null,regionRing=null,circKey='';
function armaCircuito(){
  const key=devKey;
  if(key===circKey)return;
  circKey=key;
  BANCO.userData.limpia();BANCO.userData.reiniciaRieles();
  const pot=devKey!=='n2n7000';
  const rot=devKey==='irf540n'?'IRF540N':devKey==='irlz44n'?'IRLZ44N':'2N7000';
  // TO-220 vistos de frente: G·D·S. 2N7000 (TO-92): S·G·D.
  const QC=14,cg=pot?QC-1:QC,cd=pot?QC:QC+1,cs=pot?QC+1:QC-1;
  function wire(a,b,col,o){const w=P3.puente(MATP,a,b,Object.assign({color:col},o||{}));circG.add(w);return w;}
  mosfetG=pot?P3.to220Rotulado(MATP,{rotulo:rot,rotulo2:'G   D   S',tumbado:true,levanta:0.10}):P3.to92Rotulado(MATP,{rotulo:rot,pines:['S','G','D']});
  mosfetG.position.copy(H(QC,'e'));mosfetG.userData.act='mosfet3d';mosfetG.userData.title='MOSFET (Q1)';circG.add(mosfetG);
  /* El contorno serigrafiado bajo el transistor lleva el color de la región. */
  const rmat=new THREE.MeshStandardMaterial({color:0x3fae3f,roughness:0.6,emissive:0x3fae3f,emissiveIntensity:0.18,side:THREE.DoubleSide});
  if(pot){
    const w=0.50,d=0.80,t=0.028;
    const rr=function(a,b,r){return P3.contornoRedondeado([[-a,-b],[a,-b],[a,b],[-a,b]],r,4);};
    regionRing=new THREE.Mesh(P3.extruido(rr(w/2,d/2,0.06),{huecos:[rr(w/2-t,d/2-t,0.04).reverse()],espesor:0.006}),rmat);
    regionRing.rotation.x=-Math.PI/2;regionRing.position.copy(H(QC,'e')).add(new THREE.Vector3(0,0.004,-0.40));
  }else{
    regionRing=new THREE.Mesh(new THREE.RingGeometry(0.15,0.185,36),rmat);
    regionRing.rotation.x=-Math.PI/2;regionRing.position.copy(H(QC,'e')).add(new THREE.Vector3(0,0.002,0.02));
  }
  regionRing.userData.title='Región de operación';circG.add(regionRing);
  // RD: del drenador a VDD. Es una resistencia de CEMENTO, no de capa: con 12 V
  // sobre unos pocos ohmios una de 1/4 W se quemaría, y el valor va impreso.
  rdG=P3.resistenciaCemento(MATP,{rotulo:fmtRd(curRD()),paso:0.6});
  rdG.userData.act='rd3d';rdG.userData.title='RD';
  rdG.position.copy(H(cd-2,'c')).lerp(H(cd-8,'c'),0.5);rdG.position.y=H(cd,'c').y;circG.add(rdG);
  wire(H(cd-8,'e'),railNear('+',cd-8),cableMat.rojo);
  wire(H(cd-2,'b'),H(cd,'b'),cableMat.naranja);                    // del extremo de RD al drenador
  wire(H(cs,'d'),railNear('-',cs),cableMat.negro);
  // el driver: un DIP-8 a caballo del canal, con su salida a la compuerta
  const DC=2;
  driverChipG=P3.dipRotulado(MATP,{pines:8,rotulo:'DRIVER'});
  driverChipG.position.copy(H(DC+1.5,'e')).lerp(H(DC+1.5,'f'),0.5);driverChipG.position.y=H(DC,'e').y;
  driverChipG.userData.act='driver3d';driverChipG.userData.title='Driver de compuerta';circG.add(driverChipG);
  const pinPos=function(k){return driverChipG.userData.pata(k).clone().add(driverChipG.position);};
  wire(pinPos(7),H(cg,'a'),cableMat.verde);                       // OUT → compuerta
  wire(pinPos(8),railNear('+',DC),cableMat.rojo);                  // VDD del driver
  wire(pinPos(4),railNear('-',DC+3),cableMat.negro);               // GND del driver
  // instrumentos: medidor en el drenador y la fuente; driver en la entrada
  BANCO.userData.cable(2,0,railNear('+',17),cableMat.rojo);
  BANCO.userData.cable(2,1,railNear('-',18),cableMat.negro);
  BANCO.userData.cable(1,0,H(cd,'d'),cableMat.amarillo);
  BANCO.userData.cable(1,1,H(cs,'b'),cableMat.verde);
  BANCO.userData.cable(0,0,H(DC+1,'d'),cableMat.azul);
  BANCO.userData.cable(0,1,railNear('-',DC+4),cableMat.negro);
  circG.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
}
armaCircuito();
board.castShadow=false;boardFrame.receiveShadow=true;
S.scene.add(benchG);

function refreshBenchSel(){
  armaCircuito();
  rdG.userData.ponTexto(fmtRd(curRD()));
}
function drawFuenteScreen(){
  const cx=fuenteBox.cx,cv=fuenteBox.cv,w=cv.width,h=cv.height;
  cx.clearRect(0,0,w,h);
  cx.fillStyle='#08120f';cx.fillRect(0,0,w,h);
  cx.fillStyle='#4FD1C5';cx.textAlign='center';
  cx.font='bold '+Math.round(h*0.22)+'px monospace';
  cx.fillText('VDD',w/2,h*0.30);
  cx.font='bold '+Math.round(h*0.44)+'px monospace';
  cx.fillText(curVDD().toFixed(0)+' V',w/2,h*0.80);
  fuenteBox.tex.needsUpdate=true;
}
function drawMedidorScreen(){
  const cx=medidorBox.cx,cv=medidorBox.cv,w=cv.width,h=cv.height;
  cx.clearRect(0,0,w,h);
  cx.fillStyle='#08120f';cx.fillRect(0,0,w,h);
  const hide=(mode==='predice'&&!predRevealed);
  cx.fillStyle='#FFB703';cx.textAlign='center';
  cx.font='bold '+Math.round(h*0.20)+'px monospace';
  cx.fillText('ID / VDS',w/2,h*0.24);
  cx.font='bold '+Math.round(h*0.30)+'px monospace';
  if(hide){
    cx.fillText('¿?  /  ¿?',w/2,h*0.72);
  }else if(RES){
    cx.fillText(fmtI(RES.ID),w/2,h*0.56);
    cx.fillText(RES.VDS.toFixed(2)+' V',w/2,h*0.90);
  }
  medidorBox.tex.needsUpdate=true;
}
function drawDriverScreen(){
  const cx=driverBox.cx,cv=driverBox.cv,w=cv.width,h=cv.height;
  cx.clearRect(0,0,w,h);
  cx.fillStyle='#08120f';cx.fillRect(0,0,w,h);
  cx.fillStyle='#4FD1C5';cx.textAlign='center';
  cx.font='bold '+Math.round(h*0.16)+'px monospace';
  cx.fillText('t_on ≈ Qg / I_driver',w/2,h*0.20);
  const t=tOn();
  cx.fillStyle='#EAF4F1';
  if(t==null){
    cx.font='bold '+Math.round(h*0.15)+'px monospace';
    cx.fillText('Qg no especificado',w/2,h*0.58);
    cx.fillText('por el fabricante',w/2,h*0.82);
  }else{
    cx.font='bold '+Math.round(h*0.34)+'px monospace';
    cx.fillText(fmtT(t),w/2,h*0.62);
    cx.font=Math.round(h*0.14)+'px monospace';cx.fillStyle='#8FB3AC';
    cx.fillText('Qg='+curDev().qgTotal+'nC · I='+(curDriver()*1000).toFixed(0)+'mA',w/2,h*0.90);
  }
  driverBox.tex.needsUpdate=true;
}
function refreshBenchDyn(){
  drawFuenteScreen();drawMedidorScreen();drawDriverScreen();
  if(regionRing){
    const hex=parseInt(curColor().slice(1),16);
    regionRing.material.color.setHex(hex);regionRing.material.emissive.setHex(hex);
  }
}

/* ---------- 7) HUD + panel ---------- */
const devBtnsHtml=Object.keys(DEVS).map(function(k){
  const d=DEVS[k];
  return '<button class="b'+(k===devKey?' on':'')+'" style="flex:1 0 100%" id="dev_'+k+'">'+d.name+' · Vth '+d.vthMin+'–'+d.vthMax+' V</button>';
}).join('');
const vddBtnsHtml=VDD_VALS.map(function(v,i){return '<button class="b'+(i===VDDidx?' on':'')+'" style="flex:1 0 18%" id="vdd_'+i+'">'+v+' V</button>';}).join('');
const rdBtnsHtml=RD_VALS.map(function(v,i){return '<button class="b'+(i===RDidx?' on':'')+'" style="flex:1 0 30%" id="rd_'+i+'">'+fmtR(v)+'</button>';}).join('');
const driverBtnsHtml=DRIVER_VALS.map(function(v,i){return '<button class="b'+(i===driverIdx?' on':'')+'" style="flex:1 0 48%" id="drv_'+i+'">'+DRIVER_LABELS[i]+'</button>';}).join('');

document.getElementById('hud').innerHTML=`
  <div class="eyebrow">D2 · Semiconductores — Práctica d2-09</div>
  <h2>Caracteriza el MOSFET y su Driver de Compuerta</h2>
  <p>Un MOSFET de canal N solo conduce si VGS supera su voltaje de umbral Vth — y a diferencia de un BJT, la compuerta no consume corriente DC continua, aunque sí necesita entregarle una carga eléctrica (Qg) para cargar su capacitancia interna cada vez que enciende. Ajusta VDD/RD/VGS, cambia de dispositivo, y observa cómo el punto de operación se mueve entre corte, saturación (análoga a la región activa de un BJT) y triodo/óhmica (el estado de "interruptor cerrado" que hace útil al MOSFET en electrónica de potencia).</p>
  <div class="formula">
    Corte: VGS≤Vth → ID=0 &nbsp;·&nbsp; Saturación: ID=k·(VGS−Vth)² &nbsp;·&nbsp; Triodo: ID=k·(2·(VGS−Vth)·VDS−VDS²)<br>
    Recta de carga: ID=(VDD−VDS)/RD &nbsp;·&nbsp; Driver de compuerta: t_on ≈ Qg / I_driver
  </div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Trayectoria del punto Q al variar Vth (barrido)</div>
    <div class="li"><span class="dot" style="background:#E8871E"></span>Recta de carga ideal (extremos ID(sat)=VDD/RD y VDS=VDD)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Punto Q real (solución autoconsistente)</div>
    <div class="li"><span class="dot" style="background:#3fae3f"></span>Saturación &nbsp;/&nbsp; <span class="dot" style="background:#E8871E"></span>Triodo (óhmica) &nbsp;/&nbsp; <span class="dot" style="background:#8a8a8a"></span>Corte</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> Modelo de canal largo de dos/tres regiones — corte (VGS≤Vth→ID=0), saturación (ID=k·(VGS−Vth)², ley cuadrática) y triodo/óhmica (ID=k·(2·(VGS−Vth)·VDS−VDS²)) — resuelto de forma autoconsistente sobre la recta de carga VDS=VDD−ID·RD, dispersión real de Vth por hoja de datos (IRF540N: 2.0–4.0 V · IRLZ44N: 1.0–2.0 V · 2N7000: 0.8–3.0 V), coeficiente k derivado de gfs y la corriente de prueba del fabricante (k=gfs²/(4·ID_test) — extensión propia de este simulador, no una cifra de catálogo directa), recta de carga con extremos IDEALES (ID(sat)=VDD/RD, VDS=VDD) mostrados como referencia geométrica, y estimación de primer orden del tiempo de encendido del driver t_on≈Qg/I_driver.<br>
  <span class="no">NO:</span> Resistencia de canal dependiente de temperatura (autocalentamiento), capacitancias no lineales completas (Ciss/Coss/Crss) más allá de la carga de compuerta total Qg, meseta de Miller explícita en la curva de encendido, impedancia de salida no ideal del driver real, límites dinámicos de área de operación segura (el simulador solo compara ID/Ptot instantáneos contra los máximos de catálogo como advertencia, no como física de falla térmica), ruptura por avalancha, ni λ (modulación de longitud de canal / resistencia de salida finita en saturación). El valor de "Vth típico" que usa el simulador es el punto medio del rango min–max del fabricante, no una cifra "typ" publicada — ningún fabricante consultado publica un valor típico de Vth para estos tres dispositivos.</div>
  <div class="src">Ref: International Rectifier/Infineon PD-94812 (IRF540N) · International Rectifier/Infineon (IRLZ44N) · ON Semiconductor Rev.5 y Fairchild 1995 (2N7000).</div>`;

document.getElementById('panel').innerHTML=`
  <h4>MOSFET · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_predice">🔮 Predice</button>
    <button class="b" id="m_barrido">📉 Barrido</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>

  <div style="font-size:12px;color:#8FB3AC;margin:6px 0 4px">Transistor</div>
  <div class="btns">${devBtnsHtml}</div>

  <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">VDD</div>
  <div class="btns">${vddBtnsHtml}</div>
  <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">RD</div>
  <div class="btns">${rdBtnsHtml}</div>

  <div style="margin-top:10px">
    <label style="font-size:12px;color:#8FB3AC">VGS: <span id="vVgs">6.00</span> V</label><br>
    <input type="range" id="sVgs" min="0" max="10" step="0.1" value="6" style="width:100%">
  </div>
  <div style="margin-top:8px">
    <label style="font-size:12px;color:#8FB3AC">Vth de esta unidad (dispersión de fábrica): <span id="vVth">3.00</span> V</label><br>
    <input type="range" id="sVth" min="2" max="4" step="0.05" value="3" style="width:100%">
  </div>

  <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;color:#EAF4F1">
    <div>ID: <span id="teleID">—</span></div>
    <div>VDS: <span id="teleVDS">—</span></div>
    <div>VOV (VGS−Vth): <span id="teleVOV">—</span></div>
    <div style="grid-column:1/3">Región: <span id="teleRegion">—</span></div>
    <div style="grid-column:1/3;color:#d23b3b" id="teleWarn"></div>
  </div>

  <div style="margin-top:10px;border-top:1px solid #1E3A34;padding-top:8px">
    <div style="font-size:12px;color:#8FB3AC;margin-bottom:4px">Driver de compuerta (dimensionado por Qg)</div>
    <div class="btns">${driverBtnsHtml}</div>
  </div>

  <div id="predBox" style="display:none;margin-top:10px">
    <div id="predAsk" style="font-size:12px;color:#EAF4F1;margin-bottom:6px"></div>
    <div id="predAnswerBox"></div>
    <div id="predResult" style="font-size:12px;margin-top:6px"></div>
  </div>

  <div id="barBox" style="display:none;margin-top:10px">
    <button class="b" id="btnSweep" style="width:100%">▶ Barrer Vth (min → max)</button>
  </div>

  <div id="retoBox" style="display:none;margin-top:10px">
    <div id="retoAsk" style="font-size:12px;color:#EAF4F1;margin-bottom:6px"></div>
    <button class="b" id="btnReto" style="width:100%">Verificar diseño</button>
    <button class="b" id="btnPista" style="width:100%;margin-top:4px">💡 Pista (máx. 2)</button>
    <div id="retoResult" style="font-size:12px;margin-top:6px"></div>
  </div>

  <div id="report" style="margin-top:10px;font-size:11px;color:#8FB3AC;line-height:1.5"></div>

  <div style="margin-top:14px;border-top:1px solid #1E3A34;padding-top:10px">
    <div id="quizQ" style="font-size:12px;color:#EAF4F1;margin-bottom:6px"></div>
    <div class="btns" id="quizOpts"></div>
  </div>

  <button class="b" id="btnAuto" style="width:100%;margin-top:10px">🎬 Tour guiado</button>
`;

/* ---------- 8) Lógica ---------- */
const MODES=['explora','predice','barrido','reto'];
const MODE_META={
  explora:{label:'Explora',emoji:'🔍'},
  predice:{label:'Predice',emoji:'🔮'},
  barrido:{label:'Barrido',emoji:'📉'},
  reto:{label:'Reto',emoji:'🎯'},
};
const MISIONES={
  explora:'Ajusta VDD/RD/VGS, cambia de dispositivo y desliza Vth para simular la dispersión de fábrica. Revisa también el driver de compuerta.',
  predice:'Antes de revelar el medidor, predice la región de operación o el punto Q exacto para una unidad con un Vth real distinto.',
  barrido:'Barre Vth entre el mínimo y el máximo real del dispositivo (con VDD/RD/VGS fijos) y observa cuánto se mueve el punto Q.',
  reto:'Elige dispositivo y VGS (limitado por el manejador) para que el MOSFET quede en triodo, con poca caída, con TODAS las unidades del rango real de Vth.',
};

function setMode(k){
  mode=k;
  el('p_mode').textContent=MODE_META[k].label;
  el('p_mision').textContent=MISIONES[k];
  ['m_explora','m_predice','m_barrido','m_reto'].forEach(function(id){el(id).classList.toggle('on',id==='m_'+k);});
  el('predBox').style.display=k==='predice'?'block':'none';
  el('barBox').style.display=k==='barrido'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  el('sVgs').max=10;
  if(k==='reto'){newReto();}
  if(k==='predice'){genPredice();}
  if(k==='barrido'){SWEEP_VTH.length=0;}
  refreshAll();
}
function syncCtrlBtns(){
  Object.keys(DEVS).forEach(function(k){el('dev_'+k).classList.toggle('on',k===devKey);});
  VDD_VALS.forEach(function(v,i){el('vdd_'+i).classList.toggle('on',i===VDDidx);});
  RD_VALS.forEach(function(v,i){el('rd_'+i).classList.toggle('on',i===RDidx);});
  DRIVER_VALS.forEach(function(v,i){el('drv_'+i).classList.toggle('on',i===driverIdx);});
  el('sVth').min=curDev().vthMin;el('sVth').max=curDev().vthMax;
  el('sVth').value=vth;
  el('vVth').textContent=vth.toFixed(2);
  el('sVgs').value=VGS;
  el('vVgs').textContent=VGS.toFixed(2);
}
function selDevice(k){
  devKey=k;
  vth=(DEVS[k].vthMin+DEVS[k].vthMax)/2;
  syncCtrlBtns();onChange();
}
function selVDD(i){VDDidx=i;syncCtrlBtns();onChange();}
function selRD(i){RDidx=i;syncCtrlBtns();onChange();}
function selDriver(i){driverIdx=i;syncCtrlBtns();refreshAll();}
function onVgsInput(v){VGS=parseFloat(v);el('vVgs').textContent=VGS.toFixed(2);onChange();}
function onVthInput(v){vth=parseFloat(v);el('vVth').textContent=vth.toFixed(2);onChange();}

function genPredice(){
  predType=Math.random()<0.5?'A':'B';
  const dev=curDev();
  const v=dev.vthMin+Math.random()*(dev.vthMax-dev.vthMin);
  PRED={vth:v,VDD:curVDD(),RD:curRD(),VGS:VGS,devKey:devKey};
  predSolved=false;predRevealed=false;
  el('predAsk').textContent=predAskText();
  el('predAnswerBox').innerHTML=predType==='A'?
    '<div class="btns"><button class="b" id="pa_corte">Corte</button><button class="b" id="pa_saturacion">Saturación</button><button class="b" id="pa_triodo">Triodo</button></div>':
    '<label style="font-size:12px;color:#8FB3AC">ID estimada (mA): <input type="number" id="pa_id" step="0.01" style="width:80px"></label> '+
    '<label style="font-size:12px;color:#8FB3AC">VDS estimada (V): <input type="number" id="pa_vds" step="0.01" style="width:80px"></label> '+
    '<button class="b" id="pa_check">Verificar</button>';
  el('predResult').textContent='';
  wirePredButtons();
}
function predAskText(){
  return 'Con VDD/RD/VGS actuales, imagina que te dan una unidad real de '+curDev().name+' con Vth = '+PRED.vth.toFixed(2)+' V (dentro del rango de fábrica '+curDev().vthMin+'–'+curDev().vthMax+' V). '+(predType==='A'?'¿En qué región de operación queda?':'¿Cuáles son ID y VDS en el punto Q?');
}
function wirePredButtons(){
  if(predType==='A'){
    ['corte','saturacion','triodo'].forEach(function(k){
      const b=el('pa_'+k);
      if(b)b.addEventListener('click',function(){checkPredice(k);});
    });
  }else{
    const b=el('pa_check');
    if(b)b.addEventListener('click',function(){
      const id=parseFloat(el('pa_id').value)||0;
      const vds=parseFloat(el('pa_vds').value)||0;
      checkPredice(null,{id:id,vds:vds});
    });
  }
}
function checkPredice(kind,val){
  if(!PRED||predRevealed)return;
  const r=solveMOSFET(curDev(),PRED.vth,PRED.VDD,PRED.RD,PRED.VGS);
  let ok=false,msg='';
  if(predType==='A'){
    ok=kind===r.region;
    msg=ok?'¡Correcto! La unidad con Vth='+PRED.vth.toFixed(2)+'V opera en '+r.region+'.':'No — con Vth='+PRED.vth.toFixed(2)+'V el punto Q cae en '+r.region+', no en '+kind+'.';
  }else{
    const idOk=Math.abs(val.id-r.ID*1000)<=Math.max(r.ID*1000*0.2,0.05);
    const vdsOk=Math.abs(val.vds-r.VDS)<=Math.max(r.VDS*0.2,0.15);
    ok=idOk&&vdsOk;
    msg=(ok?'¡Correcto! ':'No exactamente — ')+'ID real ≈ '+fmtI(r.ID)+', VDS real ≈ '+fmtV(r.VDS)+' (región '+r.region+').';
  }
  predSolved=ok;predRevealed=true;
  el('predResult').textContent=msg;
  el('predResult').style.color=ok?'#3fae3f':'#d23b3b';
  vth=PRED.vth;VDDidx=VDD_VALS.indexOf(PRED.VDD);RDidx=RD_VALS.indexOf(PRED.RD);VGS=PRED.VGS;devKey=PRED.devKey;
  syncCtrlBtns();refreshAll();
  synth.beep(ok?880:220,.08,.06);
}

/* ---------- Reto: interruptor cerrado con TODAS las unidades ----------
   Cada reto fija VDD, RD y la tensión máxima de compuerta que entrega el manejador (VGSmax).
   El alumno elige dispositivo y VGS ≤ VGSmax. Criterio con Vth mínimo y máximo de fábrica:
   triodo en ambos, VDS ≤ 0,25 V (caída de conducción despreciable) e ID ≤ ID máx. del catálogo.
   No hay veredicto en vivo: solo al pulsar «Verificar». */
let intentos=0,fallosSeguidos=0,pistas=0;const pistaLog=[];
function rndi(n){return Math.floor(Math.random()*n);}
const VGSMAX_VALS=[2.5,3.3,5,8];
function evalDiseno(R,key,vg){
  const dev=DEVS[key];
  const lo=solveMOSFET(dev,dev.vthMin,R.VDD,R.RD,vg);
  const hi=solveMOSFET(dev,dev.vthMax,R.VDD,R.RD,vg);
  const triodo=lo.region==='triodo'&&hi.region==='triodo';
  const caida=triodo&&Math.max(lo.VDS,hi.VDS)<=0.25;
  const corriente=Math.max(lo.ID,hi.ID)<=dev.idMax;
  return {lo:lo,hi:hi,vgOk:vg<=R.VGSmax+1e-9,triodo:triodo,caida:caida,corriente:corriente,ok:vg<=R.VGSmax+1e-9&&triodo&&caida&&corriente};
}
function dispositivosFactibles(R){
  return Object.keys(DEVS).filter(function(k){return evalDiseno(R,k,R.VGSmax).ok;});
}
function newReto(){
  let R,n=0,ok=false;
  do{
    R={VDD:VDD_VALS[rndi(VDD_VALS.length)],RD:RD_VALS[rndi(RD_VALS.length)],VGSmax:VGSMAX_VALS[rndi(VGSMAX_VALS.length)]};
    n++;
    const f=dispositivosFactibles(R);
    ok=f.length>0&&(f.length===1||Math.random()<0.3); // casos donde elegir bien el dispositivo importa, casi siempre
  }while(!ok&&n<500);
  RETO=R;
  const fz=dispositivosFactibles(R),malos=Object.keys(DEVS).filter(function(k){return fz.indexOf(k)<0;});
  if(malos.length)devKey=malos[0]; // el arranque no es ya la solución
  VDDidx=VDD_VALS.indexOf(R.VDD);RDidx=RD_VALS.indexOf(R.RD);
  VGS=Math.round(R.VGSmax*5)/10; // arranque neutro: la mitad de lo disponible
  vth=(curDev().vthMin+curDev().vthMax)/2;
  el('sVgs').max=R.VGSmax;
  retoSolved=false;fallosSeguidos=0;pistas=0;pistaLog.length=0;
  syncCtrlBtns();RES=curSolve();
  pintaReto('');
}
function pintaReto(msg){
  if(!RETO)return;
  el('retoAsk').innerHTML='Interruptor de potencia: VDD = <b>'+RETO.VDD+' V</b>, RD = <b>'+fmtR(RETO.RD)+'</b>, y el manejador entrega como máximo <b>VGS = '+RETO.VGSmax+' V</b>. Elige el <b>dispositivo</b> y VGS para que, con <b>cualquier unidad</b> (Vth mínimo a máximo del catálogo), quede en <b>triodo</b> con VDS ≤ 0,25 V e ID dentro del máximo del catálogo. No hay veredicto hasta «Verificar diseño».'+
    '<div style="font-size:11px;color:#8FB3AC;margin-top:4px">Intentos: <b id="retoIntentos">'+intentos+'</b> · Pistas: '+pistas+'/2'+(retoSolved?' · <b style="color:#3fae3f">✔ resuelto</b>':'')+'</div>'+
    (pistaLog.length?'<div style="font-size:11px;margin-top:4px">'+pistaLog.map(function(h){return '💡 '+h;}).join('<br>')+'</div>':'');
  el('retoResult').textContent=msg;
  el('retoResult').style.color=retoSolved?'#3fae3f':'#d23b3b';
}
function retoPista(){
  if(mode!=='reto'||!RETO)return;
  if(pistas>=2){showToast('Ya usaste las 2 pistas de este reto.');return;}
  const H=['Compara el Vth máximo de cada dispositivo con el VGS que te entrega el manejador: lo que sobra, VOV = VGS − Vth, es lo que abre el canal.',
    'Aunque esté en triodo, la corriente que pide la carga (≈ VDD/RD) debe caber en el máximo del catálogo, y VDS ≈ ID/(2k·VOV) debe ser pequeña.'];
  pistaLog.push(H[pistas]);pistas++;pintaReto(el('retoResult').textContent);
}
function checkReto(){
  if(!RETO)return;
  const e=evalDiseno(RETO,devKey,VGS);
  intentos++;
  let msg;
  if(e.ok){
    retoSolved=true;fallosSeguidos=0;
    msg='¡Diseño válido! Con Vth='+curDev().vthMin+' V y '+curDev().vthMax+' V queda en triodo (VDS='+e.lo.VDS.toFixed(3)+' V y '+e.hi.VDS.toFixed(3)+' V; ID≈'+fmtI(e.hi.ID)+').';
  }else{
    retoSolved=false;fallosSeguidos++;
    const f=[];
    if(!e.vgOk)f.push('el manejador no entrega ese VGS');
    if(!e.triodo)f.push('con alguna unidad el MOSFET no llega a triodo ('+(e.lo.region!=='triodo'?'Vth mínimo: '+e.lo.region:'')+(e.lo.region!=='triodo'&&e.hi.region!=='triodo'?'; ':'')+(e.hi.region!=='triodo'?'Vth máximo: '+e.hi.region:'')+')');
    else if(!e.caida)f.push('la caída VDS en conducción es demasiado grande');
    if(!e.corriente)f.push('la corriente supera el máximo de catálogo del dispositivo');
    msg='Aún no: '+f.join('; ')+'.';
    if(fallosSeguidos>=3){newReto();msg+=' Tres fallos seguidos: se plantea un caso nuevo.';}
  }
  pintaReto(msg);
  synth.beep(e.ok?880:220,.08,.06);
}

async function runSweep(){
  if(sweeping)return;
  sweeping=true;
  SWEEP_VTH.length=0;
  const dev=curDev();
  const N=17;
  for(let k=0;k<N;k++){
    const v=dev.vthMin+(dev.vthMax-dev.vthMin)*k/(N-1);
    const r=solveMOSFET(dev,v,curVDD(),curRD(),VGS);
    SWEEP_VTH.push({vth:v,VDS:r.VDS,ID:r.ID,region:r.region});
    drawBoard();
    await sleep(45);
  }
  sweeping=false;
  const spread=Math.max.apply(null,SWEEP_VTH.map(function(p){return p.VDS;}))-Math.min.apply(null,SWEEP_VTH.map(function(p){return p.VDS;}));
  showToast('Dispersión de VDS solo por variación de Vth de fábrica: ΔVDS = '+spread.toFixed(3)+' V (con VGS='+VGS.toFixed(2)+'V fijo)');
}

function updateTele(){
  if(mode==='predice'&&!predRevealed){
    el('teleID').textContent='¿?';
    el('teleVDS').textContent='¿?';
    el('teleVOV').textContent='¿?';
    el('teleRegion').textContent='¿?';
    el('teleRegion').style.color='#8FB3AC';
    el('teleWarn').textContent='';
    return;
  }
  if(!RES)return;
  el('teleID').textContent=fmtI(RES.ID);
  el('teleVDS').textContent=fmtV(RES.VDS);
  el('teleVOV').textContent=RES.VOV.toFixed(3)+' V';
  el('teleRegion').textContent=RES.region.toUpperCase();
  el('teleRegion').style.color=RES.region==='triodo'?'#E8871E':(RES.region==='corte'?'#8a8a8a':'#3fae3f');
  const warns=[];
  if(overCurrent())warns.push('⚠ ID ('+fmtI(RES.ID)+') excede ID máx de catálogo ('+curDev().idMax+' A) — el modelo cuadrático no clampa a este límite.');
  if(overPower())warns.push('⚠ Disipación instantánea ID·VDS excede Ptot de catálogo ('+fmtP(curDev().ptot)+').');
  el('teleWarn').textContent=warns.join(' ');
}
function updateReport(){
  if(mode==='predice'&&!predRevealed){el('report').textContent='Predicción pendiente — revela para ver el informe.';return;}
  if(!RES)return;
  let txt='VGS='+fmtV(VGS)+' · Vth='+vth.toFixed(2)+'V · VOV='+RES.VOV.toFixed(3)+'V · ID='+fmtI(RES.ID)+' · VDS='+fmtV(RES.VDS)+' · región: '+RES.region;
  const t=tOn();
  txt+=t==null?' · t_on: Qg no especificado para este dispositivo':' · t_on≈'+fmtT(t)+' (driver: '+DRIVER_LABELS[driverIdx]+')';
  el('report').textContent=txt;
}
function onChange(){
  RES=curSolve();
  refreshAll();
}
function refreshAll(){
  drawBoard();
  refreshBenchSel();
  refreshBenchDyn();
  updateTele();
  updateReport();
}

// Quiz: opciones barajadas (Fisher–Yates), correcta sin posición fija; el fallo no revela la correcta.
const QUIZ=[
  {q:'¿Qué distingue a la compuerta de un MOSFET de la base de un BJT?',ok:'Está aislada por el óxido: no consume corriente continua, solo carga la capacitancia',bad:['Necesita más tensión que la base porque su unión es de silicio','Está siempre conectada a tierra y solo la fuente recibe señal','Consume corriente continua proporcional a la corriente de drenaje']},
  {q:'¿En qué región se comporta un MOSFET de potencia como interruptor «cerrado» de baja caída?',ok:'Triodo (óhmica), donde VDS es pequeña y el canal actúa como resistencia',bad:['Corte, porque la corriente nula evita cualquier caída de voltaje','Saturación, porque la corriente de drenaje ya no depende de VDS','Ruptura, porque el canal queda sometido a la tensión de avalancha']},
  {q:'¿Qué representa Qg, la carga de compuerta?',ok:'La carga que el manejador debe entregar a la compuerta para encender el MOSFET',bad:['La corriente continua de fuga que circula por el óxido de compuerta','La capacidad de corriente máxima del canal en conducción continua','La carga almacenada en el diodo del cuerpo durante la conmutación']},
  {q:'Dos MOSFET del mismo modelo tienen Vth distinto. Con VGS fijo cerca del Vth máximo, ¿qué puede pasar?',ok:'Una unidad queda casi en corte y otra en triodo: el punto Q depende de la unidad',bad:['Nada: el punto Q lo fija solo RD y la unidad no influye','VDS vale siempre cero porque el canal conduce con cualquier Vth','Todas las unidades quedan en saturación con la misma corriente']},
  {q:'Con un manejador de 5 V, ¿por qué conviene un MOSFET de nivel lógico (Vth bajo) frente a otro de Vth 2–4 V?',ok:'Porque con Vth máximo bajo el exceso VGS−Vth sigue siendo grande y el canal abre bien',bad:['Porque el de nivel lógico tolera más tensión de drenaje que el estándar','Porque su corriente de compuerta es mayor y carga más rápido el óxido','Porque el de Vth alto solo puede trabajar en corte con 5 V de compuerta']},
];
let qIdx=0,quizOpts=[],quizAns=-1,quizFallos=0;
function barajar(a){const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=b[i];b[i]=b[j];b[j]=t;}return b;}
function buildQuiz(sig){
  qIdx=sig?(qIdx+1)%QUIZ.length:Math.floor(Math.random()*QUIZ.length);
  const q=QUIZ[qIdx];
  quizOpts=barajar([{t:q.ok,ok:true}].concat(q.bad.map(function(t){return {t:t,ok:false};})));
  quizAns=-1;quizFallos=0;
  refreshQuestion();
}
function quizCorrectIdx(){for(let i=0;i<quizOpts.length;i++)if(quizOpts[i].ok)return i;return -1;}
function refreshQuestion(){
  const q=QUIZ[qIdx];
  const hecho=quizAns>=0&&quizOpts[quizAns].ok;
  el('quizQ').textContent=q.q;
  el('quizOpts').innerHTML=quizOpts.map(function(o,i){
    return '<button class="b" data-i="'+i+'"'+(o.gastada||hecho?' disabled':'')+(o.gastada?' style="opacity:.45"':'')+'>'+o.t+'</button>';
  }).join('')+(hecho?'<button class="b" id="quizNext" style="width:100%">Siguiente pregunta</button>':'');
  el('quizOpts').querySelectorAll('button[data-i]').forEach(function(btn){
    btn.addEventListener('click',function(){
      const i=parseInt(btn.getAttribute('data-i'),10);
      quizAns=i;
      if(quizOpts[i].ok){showToast('¡Correcto!');synth.beep(880,.08,.06);}
      else{
        quizOpts[i].gastada=true;quizFallos++;synth.beep(220,.08,.06);
        if(quizFallos>=2){showToast('Dos fallos: se plantea otra pregunta.');buildQuiz(true);return;}
        showToast('No es esa: repasa la pregunta e inténtalo otra vez.');
      }
      refreshQuestion();
    });
  });
  const nx=el('quizNext');if(nx)nx.addEventListener('click',function(){buildQuiz(true);});
}

function actToast(act){
  if(act==='rd3d')showToast('RD = '+fmtR(curRD())+' — resistor de drenaje, junto con VDD fija la recta de carga.');
  else if(act==='mosfet3d'){
    const hideRegion=(mode==='predice'&&!predRevealed);
    showToast(curDev().name+' — Vth actual = '+vth.toFixed(2)+'V, región: '+(hideRegion?'oculta (predicción activa)':(RES?RES.region:'—')));
  }
  else if(act==='src3d')showToast('Fuente VDD = '+curVDD().toFixed(0)+' V (ideal, sin resistencia interna).');
  else if(act==='driver3d'){
    const t=tOn();
    showToast(t==null?'Driver de compuerta — Qg no especificado por el fabricante para '+curDev().name+'.':'Driver de compuerta — t_on≈'+fmtT(t)+' con '+DRIVER_LABELS[driverIdx]+'.');
  }
}
function resolveActor(obj){
  let o=obj;
  while(o&&!o.userData.act&&!o.userData.title)o=o.parent;
  return o;
}
function dispatch3D(o){
  if(!o||!o.userData.act)return;
  synth.beep(720,.05,.05);
  actToast(o.userData.act);
}

async function runAuto(){
  setMode('explora');
  selDevice('irf540n');await sleep(1200);
  selDevice('n2n7000');await sleep(1200);
  selDevice('irf540n');await sleep(800);
  await runSweep();
  await sleep(600);
  setMode('predice');await sleep(1200);
  setMode('reto');
}

// picking, hover, eventos
pickerFor(S.scene,S.camera,S.renderer.domElement,function(hit){
  if(!hit)return;
  if(hit.object===board){boardClick(hit.uv.x,hit.uv.y);return;}
  const o=resolveActor(hit.object);
  if(o)dispatch3D(o);
});
(function(){
  const dom=S.renderer.domElement;
  const ray=new THREE.Raycaster();
  dom.addEventListener('pointermove',function(e){
    const rect=dom.getBoundingClientRect();
    const mx=((e.clientX-rect.left)/rect.width)*2-1;
    const my=-((e.clientY-rect.top)/rect.height)*2+1;
    ray.setFromCamera({x:mx,y:my},S.camera);
    const hits=ray.intersectObjects(S.scene.children,true);
    let title='';
    if(hits.length){
      const o=resolveActor(hits[0].object);
      if(o&&o.userData.title)title=o.userData.title;
    }
    dom.style.cursor=title?'pointer':'default';
    dom.title=title;
  });
})();

// event wiring
el('m_explora').addEventListener('click',function(){setMode('explora');});
el('m_predice').addEventListener('click',function(){setMode('predice');});
el('m_barrido').addEventListener('click',function(){setMode('barrido');});
el('m_reto').addEventListener('click',function(){setMode('reto');});
Object.keys(DEVS).forEach(function(k){el('dev_'+k).addEventListener('click',function(){selDevice(k);});});
VDD_VALS.forEach(function(v,i){el('vdd_'+i).addEventListener('click',function(){selVDD(i);});});
RD_VALS.forEach(function(v,i){el('rd_'+i).addEventListener('click',function(){selRD(i);});});
DRIVER_VALS.forEach(function(v,i){el('drv_'+i).addEventListener('click',function(){selDriver(i);});});
el('sVgs').addEventListener('input',function(e){onVgsInput(e.target.value);});
el('sVth').addEventListener('input',function(e){onVthInput(e.target.value);});
el('btnSweep').addEventListener('click',runSweep);
el('btnReto').addEventListener('click',checkReto);
el('btnPista').addEventListener('click',retoPista);
el('btnAuto').addEventListener('click',runAuto);

// init
onChange();
S.setAnimate(function(){});
buildQuiz();
syncCtrlBtns();
refreshBenchSel();
S.start();
setMode('explora');

window.__labDebug={
  state:function(){return {devKey:devKey,VDDidx:VDDidx,RDidx:RDidx,driverIdx:driverIdx,vth:vth,VGS:VGS,mode:mode};},
  res:function(){return RES;},
  pred:function(){return {PRED:PRED,predSolved:predSolved,predRevealed:predRevealed,predType:predType};},
  reto:function(){return {RETO:RETO,retoSolved:retoSolved,solved:retoSolved,intentos:intentos,pistas:pistas};},
  get retoSolved(){return retoSolved;},
  get intentos(){return intentos;},
  get quizAnswer(){return quizAns;},
  get quizCorrectIndex(){return quizCorrectIdx();},
  buildQuiz:buildQuiz,runAuto:runAuto,pista:retoPista,
  sweep:function(){return {vth:SWEEP_VTH};},
  solveMOSFET:solveMOSFET,
  setDevice:selDevice,
  setVDD:selVDD,setRD:selRD,setDriver:selDriver,
  setVGS:function(v){VGS=v;onChange();},
  setVth:function(v){vth=v;onChange();},
  mode:function(){return mode;},
  setMode:setMode,
  checkPredice:checkPredice,
  newPredice:genPredice,
  checkReto:checkReto,
  newReto:newReto,
  sweepNow:runSweep,
  boardClick:boardClick,
};
