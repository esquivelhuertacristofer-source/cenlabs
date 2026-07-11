/*
  Polarización de BJT: Punto de Operación Q (d2-06)
  Compara polarización FIJA vs. DIVISOR de voltaje sobre el mismo transistor BJT.

  SÍ modela: modelo de gran señal DC con VBE=0.7V constante, IC=β·IB solo en
  región activa, criterio de saturación vía VCE(sat) del datasheet, criterio
  de corte vía IB≤0, criterio de divisor "rígido" RTH≤0.1·β·RE, dispersión
  real de hFE por hoja de datos, recta de carga con extremos IDEALES
  (IC(sat)=VCC/(RC+RE), VCE=VCC) como referencia geométrica — el punto Q real
  se resuelve con el modelo completo, no leído de la recta ideal.

  NO modela: análisis de señal pequeña / ganancia AC, Ebers-Moll/Gummel-Poon
  completo, efecto Early, dinámica térmica en tiempo real, variabilidad tipo
  Monte Carlo más allá del rango min/max del datasheet, física de ruptura más
  allá de VCEO/VCBO/VEBO, parásitos dependientes de frecuencia, cargas
  dinámicas/AC en el colector.
*/

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.1,2.5,7.2],target:[0.5,1.3,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

const el=function(id){return document.getElementById(id);};
let toastT=null;
function showToast(msg){
  const t=el('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},4200);
}

/* ---------- 1) Modelo físico ---------- */
const VBE_ON=0.7;

const DEVS={
  bc547b:{name:'BC547B (NPN, hFE grado B)',hfeMin:200,hfeMax:450,hfeTyp:290,vceSat:0.09,vceSatMax:0.25,vceo:45,icMax:0.1,ptot:0.625,ptotNote:'625 mW (ON Semiconductor, BC546/D Rev.6); NXP/Philips reporta 500 mW para la misma referencia comercial — confirmar siempre con la hoja de datos del fabricante específico.',color:0x1a2a1a},
  n2n3904:{name:'2N3904 (NPN)',hfeMin:100,hfeMax:300,hfeTyp:180,vceSat:0.2,vceSatMax:0.2,vceo:40,icMax:0.2,ptot:0.625,ptotNote:'625 mW bajo condiciones PULSADAS (STMicroelectronics, Preliminary Data Feb-2003); la disipación continua admisible en DC puede ser menor.',color:0x2e2e2e},
};

function solveBJT(topo,dev,beta,VCC,RC,RE,RB,R1,R2){
  let VBB,RBB;
  if(topo==='fija'){VBB=VCC;RBB=RB;}
  else{VBB=VCC*R2/(R1+R2);RBB=(R1*R2)/(R1+R2);}
  const IB=(VBB-VBE_ON)/(RBB+(beta+1)*RE);
  if(IB<=0){
    return {region:'corte',IB:0,IC:0,IE:0,VCE:VCC,VBB:VBB,RBB:RBB};
  }
  const ICact=beta*IB;
  const IEact=ICact+IB;
  const VCEact=VCC-ICact*RC-IEact*RE;
  const ICsat=(VCC-dev.vceSat)/(RC+RE);
  if(ICact>=ICsat){
    const IC=ICsat,IE=IC+IB,VCE=dev.vceSat;
    return {region:'saturacion',IB:IB,IC:IC,IE:IE,VCE:VCE,VBB:VBB,RBB:RBB,betaForced:IC/IB};
  }
  return {region:'activa',IB:IB,IC:ICact,IE:IEact,VCE:VCEact,VBB:VBB,RBB:RBB};
}
function isRigido(RBB,beta,RE){return RE>0 && RBB<=0.1*beta*RE;}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function fmtV(v){return v.toFixed(3)+' V';}
function fmtI(i){
  if(i>=1)return i.toFixed(3)+' A';
  if(i>=0.001)return (i*1000).toFixed(2)+' mA';
  return (i*1e6).toFixed(1)+' µA';
}
function fmtP(w){return w>=1?w.toFixed(3)+' W':(w*1000).toFixed(1)+' mW';}
function fmtR(r){
  if(r>=1e6)return (r/1e6).toFixed(2)+' MΩ';
  if(r>=1000)return (r/1000).toFixed(2)+' kΩ';
  return r.toFixed(0)+' Ω';
}

/* ---------- 2) Estado ---------- */
const VCC_VALS=[6,9,12,15,18];
const RC_VALS=[1000,2200,3300,4700,6800,10000];
const RE_VALS=[0,100,220,470,1000,2200];
const RB_VALS=[220000,330000,470000,680000,1000000,1500000,2200000];
const R1_VALS=[10000,15000,22000,33000,47000,68000];
const R2_VALS=[2200,3300,4700,6800,10000,15000];

let topo='divisor';
let devKey='bc547b';
let VCCidx=2,RCidx=2,REidx=4,RBidx=5,R1idx=3,R2idx=4;
let beta=DEVS[devKey].hfeTyp;
let mode='explora';
let PRED=null,predSolved=false,predRevealed=false,predType='A';
let RETO=null,retoSolved=false;
let sweeping=false;
const SWEEP_FIJA=[],SWEEP_DIV=[];
let RES=null;
function curDev(){return DEVS[devKey];}
function curVCC(){return VCC_VALS[VCCidx];}
function curRC(){return RC_VALS[RCidx];}
function curRE(){return RE_VALS[REidx];}
function curRB(){return RB_VALS[RBidx];}
function curR1(){return R1_VALS[R1idx];}
function curR2(){return R2_VALS[R2idx];}
function curSolve(){return solveBJT(topo,curDev(),beta,curVCC(),curRC(),curRE(),curRB(),curR1(),curR2());}

/* ---------- 3) Materiales ---------- */
const std=function(o){return new THREE.MeshStandardMaterial(o);};
const MAT={
  bench:std({color:0x0e1512,roughness:0.9,metalness:0.05}),
  frame:std({color:0x11201c,roughness:0.6,metalness:0.3}),
  pcb:std({color:0x0c2a20,roughness:0.75}),
  psu:std({color:0x1a2622,roughness:0.4,metalness:0.4}),
  scope:std({color:0x121a18,roughness:0.35,metalness:0.5}),
  lead:std({color:0xb9c2bd,metalness:0.8,roughness:0.3}),
  resistor:std({color:0xe8d9b0,roughness:0.5}),
  bjtBody:std({color:0x1a1a1a,roughness:0.4,metalness:0.15}),
  bjtFlat:std({color:0x2a2a2a,roughness:0.3,metalness:0.2}),
};
const BAND_COLORS=['#1a1a1a','#7a4a1e','#d23b3b','#e8871e','#e8d21e','#3fae3f','#2e6fe0','#8a4fd6','#8a8a8a','#e8e8e8'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1,dd=Math.round(v/Math.pow(10,exp));return {d1:Math.floor(dd/10),d2:dd%10,mult:exp+1};}

/* ---------- 4) Ayudantes de dibujo 2D ---------- */
function line(c,x0,y0,x1,y1,col,w,dash){c.save();c.strokeStyle=col;c.lineWidth=w||2;if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
function rr(c,x,y,w,h,r,fill,stroke,sw){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=sw||2;c.stroke();}}
function groundGlyph(c,x,y){line(c,x,y,x,y+14,'#EAF4F1',2.5);line(c,x-16,y+14,x+16,y+14,'#EAF4F1',2.5);line(c,x-10,y+21,x+10,y+21,'#EAF4F1',2);line(c,x-4,y+28,x+4,y+28,'#EAF4F1',1.5);}
function hResistorGlyph(c,x0,x1,cy,label){rr(c,x0+8,cy-16,(x1-x0)-16,32,4,'#1a2a26','#EAF4F1',2);line(c,x0,cy,x0+8,cy,'#EAF4F1',2.5);line(c,x1-8,cy,x1,cy,'#EAF4F1',2.5);if(label){c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='center';c.fillText(label,(x0+x1)/2,cy-22);}}
function vResistorGlyph(c,cx,y0,y1,label){rr(c,cx-16,y0+8,32,(y1-y0)-16,4,'#1a2a26','#EAF4F1',2);line(c,cx,y0,cx,y0+8,'#EAF4F1',2.5);line(c,cx,y1-8,cx,y1,'#EAF4F1',2.5);if(label){c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='left';c.fillText(label,cx+22,(y0+y1)/2+4);}}
function bjtGlyph(c,cx,cy,r,baseX,col){
  c.beginPath();c.arc(cx,cy,r,0,7);c.fillStyle=col||'#16211d';c.fill();c.strokeStyle='#EAF4F1';c.lineWidth=2;c.stroke();
  line(c,cx,cy-r,cx,cy-r*0.35,'#EAF4F1',2.5);
  line(c,cx,cy+r*0.35,cx,cy+r,'#EAF4F1',2.5);
  line(c,baseX,cy,cx-r*0.5,cy,'#EAF4F1',2.5);
  line(c,cx-r*0.35,cy-r*0.45,cx-r*0.35,cy+r*0.45,'#EAF4F1',3);
  line(c,cx-r*0.35,cy-r*0.45,cx,cy-r*0.35,'#EAF4F1',2.2);
  line(c,cx-r*0.35,cy+r*0.45,cx,cy+r*0.35,'#EAF4F1',2.2);
  const ax=cx-r*0.14,ay=cy+r*0.40;
  c.beginPath();c.moveTo(ax,ay);c.lineTo(ax-9,ay-2);c.lineTo(ax-3,ay+8);c.closePath();
  c.fillStyle='#EAF4F1';c.fill();
}

/* ---------- 5) Pizarrón: esquemático + gráfica ---------- */
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;
const PX0=130,PX1=940,PY0=308,PY1=676;

const DIV_X=300,BJT_X=620,BJT_R=32,BJT_CY=175;
const VCC_Y=40,GND_Y=286;
const RC_Y0=VCC_Y,RC_Y1=BJT_CY-BJT_R;
const RE_Y0=BJT_CY+BJT_R,RE_Y1=GND_Y;
const R1_Y0=VCC_Y,R1_Y1=BJT_CY;
const R2_Y0=BJT_CY,R2_Y1=GND_Y;

const HIT=[
  {x:DIV_X,y:(R1_Y0+R1_Y1)/2,r:50,act:'rb'},
  {x:DIV_X,y:(R2_Y0+R2_Y1)/2,r:50,act:'r2'},
  {x:BJT_X,y:(RC_Y0+RC_Y1)/2,r:44,act:'rc'},
  {x:BJT_X,y:BJT_CY,r:BJT_R+16,act:'bjt'},
  {x:BJT_X,y:(RE_Y0+RE_Y1)/2,r:44,act:'re'},
  {x:890,y:333,r:46,act:'topo'},
];

function graphRange(){
  const vMaxG=curVCC()*1.05;
  const iMaxG=(curVCC()/(curRC()+curRE()))*1.15;
  return {vMaxG:vMaxG,iMaxG:iMaxG};
}
function xPix(v){const g=graphRange();return PX0+(v/g.vMaxG)*(PX1-PX0);}
function gyPix(i){const g=graphRange();return PY1-(Math.max(Math.min(i,g.iMaxG),0)/g.iMaxG)*(PY1-PY0);}

function drawSchematic(c){
  c.clearRect(0,0,1024,PY0-4);
  line(c,DIV_X-40,VCC_Y,BJT_X+40,VCC_Y,'#EAF4F1',2.5);
  c.beginPath();c.arc(DIV_X,VCC_Y,4,0,7);c.fillStyle='#4FD1C5';c.fill();
  c.beginPath();c.arc(BJT_X,VCC_Y,4,0,7);c.fillStyle='#4FD1C5';c.fill();
  c.fillStyle='#4FD1C5';c.font='bold 13px system-ui';c.textAlign='center';
  c.fillText('+VCC = '+curVCC().toFixed(0)+' V',(DIV_X+BJT_X)/2,VCC_Y-14);

  vResistorGlyph(c,DIV_X,R1_Y0,R1_Y1,topo==='fija'?'RB':'R1');
  if(topo==='divisor'){
    vResistorGlyph(c,DIV_X,R2_Y0,R2_Y1,'R2');
    groundGlyph(c,DIV_X,GND_Y);
  }
  c.beginPath();c.arc(DIV_X,BJT_CY,4,0,7);c.fillStyle='#4FD1C5';c.fill();

  vResistorGlyph(c,BJT_X,RC_Y0,RC_Y1,'RC');
  const dev=curDev(),col=RES?curColor():'#8FB3AC';
  bjtGlyph(c,BJT_X,BJT_CY,BJT_R,DIV_X,col);
  if(curRE()>0){
    vResistorGlyph(c,BJT_X,RE_Y0,RE_Y1,'RE');
  }else{
    line(c,BJT_X,RE_Y0,BJT_X,RE_Y1,'#EAF4F1',2.5);
    c.fillStyle='#8FB3AC';c.font='10px monospace';c.textAlign='left';c.fillText('RE=0 (sin degeneración)',BJT_X+18,(RE_Y0+RE_Y1)/2+4);
  }
  groundGlyph(c,BJT_X,GND_Y);

  c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='left';
  c.fillText(dev.name+' · β='+beta.toFixed(0),BJT_X+BJT_R+16,BJT_CY+4);
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
  const yt=g.iMaxG<=0.006?0.001:g.iMaxG<=0.03?0.005:g.iMaxG<=0.1?0.02:0.05;
  for(let i=0;i<=g.iMaxG+1e-9;i+=yt){
    const y=gyPix(i);
    line(c,PX0,y,PX1,y,'#12241f',1);
    c.fillStyle='#8FB3AC';c.textAlign='right';
    c.fillText((i*1000).toFixed(0)+' mA',PX0-8,y+4);
  }
  line(c,PX0,PY1,PX1,PY1,'#EAF4F1',2);
  line(c,PX0,PY0,PX0,PY1,'#EAF4F1',2);
  c.fillStyle='#EAF4F1';c.font='12px monospace';c.textAlign='center';
  c.fillText('VCE (V)',(PX0+PX1)/2,PY1+34);
  c.save();c.translate(PX0-52,(PY0+PY1)/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText('IC',0,0);c.restore();

  if(!(mode==='predice'&&!predRevealed)){
    const RCplusRE=curRC()+curRE();
    const iSat=curVCC()/RCplusRE;
    const p0x=xPix(0),p0y=gyPix(iSat);
    const p1x=xPix(curVCC()),p1y=gyPix(0);
    line(c,p0x,p0y,p1x,p1y,'#E8871E',2,[6,4]);
  }

  if(mode==='barrido'&&SWEEP_FIJA.length){
    c.beginPath();let started=false;
    SWEEP_FIJA.forEach(function(pt){const x=xPix(pt.VCE),y=gyPix(pt.IC);if(!started){c.moveTo(x,y);started=true;}else c.lineTo(x,y);});
    c.strokeStyle='#8FB3AC';c.lineWidth=2.5;c.stroke();
    c.beginPath();let started2=false;
    SWEEP_DIV.forEach(function(pt){const x=xPix(pt.VCE),y=gyPix(pt.IC);if(!started2){c.moveTo(x,y);started2=true;}else c.lineTo(x,y);});
    c.strokeStyle='#4FD1C5';c.lineWidth=2.5;c.stroke();
    c.font='11px monospace';c.textAlign='left';
    c.fillStyle='#8FB3AC';c.fillText('● Fija',PX0+8,PY0+16);
    c.fillStyle='#4FD1C5';c.fillText('● Divisor',PX0+70,PY0+16);
  }

  if(RES&&!(mode==='predice'&&!predRevealed)){
    const qx=xPix(RES.VCE),qy=gyPix(RES.IC);
    c.beginPath();c.arc(qx,qy,6,0,7);c.fillStyle='#FFB703';c.fill();c.strokeStyle='#fff';c.lineWidth=1.5;c.stroke();
    c.fillStyle='#FFB703';c.font='bold 12px monospace';c.textAlign='left';
    c.fillText('Q ('+RES.VCE.toFixed(2)+'V, '+fmtI(RES.IC)+')',qx+10,qy-10);
  }

  rr(c,846,318,88,30,8,'#11201c',topo==='divisor'?'#4FD1C5':'#8FB3AC',2);
  c.font='bold 12px system-ui';c.textAlign='center';
  c.fillStyle=topo==='divisor'?'#4FD1C5':'#8FB3AC';c.fillText(topo==='divisor'?'DIVISOR':'FIJA',890,338);
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
  if(!RES)return '#4FD1C5';
  if(RES.region==='saturacion')return '#E8871E';
  if(RES.region==='corte')return '#8a8a8a';
  return '#3fae3f';
}
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  if(RES&&!(mode==='predice'&&!predRevealed)){
    const qx=xPix(RES.VCE),qy=gyPix(RES.IC);
    if(Math.hypot(x-qx,y-qy)<40){
      showToast('Punto Q: VCE = '+fmtV(RES.VCE)+' · IC = '+fmtI(RES.IC)+' · región: '+RES.region);
      return;
    }
  }
  let best=null,bd=1e9;
  for(let k=0;k<HIT.length;k++){
    const h=HIT[k];
    if(h.act==='r2'&&topo!=='divisor')continue;
    const d=Math.hypot(x-h.x,y-h.y);
    if(d<h.r&&d<bd){bd=d;best=h;}
  }
  if(!best)return;
  synth.beep(720,.05,.05);
  if(best.act==='topo'){toggleTopo();return;}
  if(best.act==='rb')showToast(topo==='fija'?'RB = '+fmtR(curRB())+' — fija la base directamente a VCC; muy sensible a la dispersión de β entre unidades.':'R1 = '+fmtR(curR1())+' — junto con R2 fija el punto de Thévenin de la base.');
  if(best.act==='r2')showToast('R2 = '+fmtR(curR2())+' — a GND; junto con R1 determina VBB y RBB.');
  if(best.act==='rc')showToast('RC = '+fmtR(curRC())+' — fija la pendiente de la recta de carga junto con RE.');
  if(best.act==='re')showToast(curRE()>0?'RE = '+fmtR(curRE())+' — realimentación negativa que estabiliza el punto Q ante variaciones de β.':'RE = 0 — sin degeneración de emisor; el punto Q depende fuertemente de β.');
  if(best.act==='bjt')showToast(curDev().name+' — hFE '+curDev().hfeMin+'–'+curDev().hfeMax+' (dispersión real de fábrica), β actual = '+beta.toFixed(0)+'.');
}
function toggleTopo(){
  topo=topo==='fija'?'divisor':'fija';
  syncCtrlBtns();
  showToast(topo==='fija'?'FIJA: la base se polariza directamente desde VCC a través de RB — sensible a β.':'DIVISOR: R1/R2 fijan un punto de Thévenin en la base — con RE grande y RTH pequeña, el punto Q se vuelve casi independiente de β.');
  onChange();
}

/* ---------- 6) Banco 3D ---------- */
const boardG=new THREE.Group();
const board=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.95),new THREE.MeshStandardMaterial({map:bTex,roughness:0.55,metalness:0.05}));
board.userData.title='Esquemático + recta de carga';
const boardFrame=new THREE.Mesh(new THREE.BoxGeometry(2.68,2.03,0.05),MAT.frame);
boardFrame.position.z=-0.03;
boardG.add(boardFrame,board);
boardG.position.set(-1.05,1.75,-0.85);boardG.rotation.y=0.16;
S.scene.add(boardG);

const benchG=new THREE.Group();
const mesa=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.12,2.2),MAT.bench);
mesa.position.set(0.6,-0.06,0.9);benchG.add(mesa);
const pcb=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.03,1.5),MAT.pcb);
pcb.position.set(0.6,0.02,0.9);benchG.add(pcb);

function makeDisplayBox(w,h,dp,cw,ch){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,dp),MAT.scope);
  g.add(body);
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
  const cx=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*0.86,h*0.78),new THREE.MeshStandardMaterial({map:tex,emissive:0x0a1512,emissiveMap:tex,emissiveIntensity:0.6,roughness:0.4}));
  screen.position.z=dp/2+0.001;g.add(screen);
  return {g:g,cv:cv,cx:cx,tex:tex,screen:screen};
}
const fuenteBox=makeDisplayBox(0.62,0.42,0.14,256,180);
fuenteBox.g.position.set(-0.15,0.42,0.55);
fuenteBox.g.userData.act='src3d';fuenteBox.g.userData.title='Fuente VCC';
benchG.add(fuenteBox.g);
const medidorBox=makeDisplayBox(0.62,0.42,0.14,256,180);
medidorBox.g.position.set(0.55,0.42,0.55);
medidorBox.g.userData.title='Medidor IC / VCE';
benchG.add(medidorBox.g);

function leads(g){
  const l1=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.16,10),MAT.lead);
  l1.rotation.z=Math.PI/2;l1.position.x=-0.16;g.add(l1);
  const l2=l1.clone();l2.position.x=0.16;g.add(l2);
}
function makeResistor3D(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.26,20),MAT.resistor);
  body.rotation.z=Math.PI/2;g.add(body);
  leads(g);
  const bands=[];
  for(let i=0;i<3;i++){
    const band=new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.052,0.018,20),std({color:0x333333}));
    band.rotation.z=Math.PI/2;band.position.x=-0.07+i*0.05;
    g.add(band);bands.push(band);
  }
  g.userData.bands=bands;
  return g;
}
function paintBands(g,r){
  const b=bandsFor(r);
  const cols=[BAND_COLORS[b.d1],BAND_COLORS[b.d2],BAND_COLORS[b.mult]];
  g.userData.bands.forEach(function(band,i){band.material=std({color:parseInt(cols[i].slice(1),16)});});
}
function makeBJT3D(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.18,20),MAT.bjtBody);
  g.add(body);
  const flat=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.19,0.09),MAT.bjtFlat);
  flat.position.set(0.05,0,0);g.add(flat);
  const l1=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.16,8),MAT.lead);
  l1.position.set(-0.03,-0.17,0.045);g.add(l1);
  const l2=l1.clone();l2.position.set(0,-0.17,0.05);g.add(l2);
  const l3=l1.clone();l3.position.set(0.03,-0.17,0.045);g.add(l3);
  g.userData.bodyMesh=body;
  return g;
}
const rbG=makeResistor3D();
rbG.position.set(-0.15,0.24,1.05);
rbG.userData.act='rb3d';rbG.userData.title='RB / R1';
benchG.add(rbG);
const r2G=makeResistor3D();
r2G.position.set(-0.15,0.24,1.28);
r2G.userData.act='r23d';r2G.userData.title='R2';
benchG.add(r2G);
const rcG=makeResistor3D();
rcG.position.set(0.18,0.24,1.05);
rcG.userData.act='rc3d';rcG.userData.title='RC';
benchG.add(rcG);
const reG=makeResistor3D();
reG.position.set(0.18,0.24,1.28);
reG.userData.act='re3d';reG.userData.title='RE';
benchG.add(reG);
const bjtG=makeBJT3D();
bjtG.position.set(0.85,0.24,1.15);bjtG.rotation.z=Math.PI/2;
bjtG.userData.act='bjt3d';bjtG.userData.title='BJT (Q1)';
benchG.add(bjtG);

benchG.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
board.castShadow=false;boardFrame.receiveShadow=true;
S.scene.add(benchG);

function refreshBenchSel(){
  paintBands(rbG,topo==='fija'?curRB():curR1());
  paintBands(r2G,curR2());
  paintBands(rcG,curRC());
  paintBands(reG,curRE()>0?curRE():1);
  r2G.visible=topo==='divisor';
}
function drawFuenteScreen(){
  const cx=fuenteBox.cx,cv=fuenteBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#08120f';cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='#4FD1C5';cx.font='bold 26px monospace';cx.textAlign='center';
  cx.fillText('VCC',cv.width/2,50);
  cx.font='bold 40px monospace';
  cx.fillText(curVCC().toFixed(0)+' V',cv.width/2,116);
  fuenteBox.tex.needsUpdate=true;
}
function drawMedidorScreen(){
  const cx=medidorBox.cx,cv=medidorBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#08120f';cx.fillRect(0,0,cv.width,cv.height);
  const hide=(mode==='predice'&&!predRevealed);
  cx.fillStyle='#FFB703';cx.font='bold 16px monospace';cx.textAlign='center';
  cx.fillText('IC / VCE',cv.width/2,30);
  cx.font='bold 24px monospace';
  if(hide){
    cx.fillText('¿?  /  ¿?',cv.width/2,108);
  }else if(RES){
    cx.fillText(fmtI(RES.IC),cv.width/2,86);
    cx.fillText(RES.VCE.toFixed(2)+' V',cv.width/2,134);
  }
  medidorBox.tex.needsUpdate=true;
}
function refreshBenchDyn(){
  drawFuenteScreen();drawMedidorScreen();
  if(bjtG.userData.bodyMesh){
    const hex=parseInt(curColor().slice(1),16);
    bjtG.userData.bodyMesh.material=std({color:hex,roughness:0.4,metalness:0.15});
  }
}

/* ---------- 7) HUD + panel ---------- */
const devBtnsHtml=Object.keys(DEVS).map(function(k){
  const d=DEVS[k];
  return '<button class="b'+(k===devKey?' on':'')+'" style="flex:1 0 100%" id="dev_'+k+'">'+d.name+' · hFE '+d.hfeMin+'–'+d.hfeMax+'</button>';
}).join('');
const vccBtnsHtml=VCC_VALS.map(function(v,i){return '<button class="b'+(i===VCCidx?' on':'')+'" style="flex:1 0 18%" id="vcc_'+i+'">'+v+' V</button>';}).join('');
const rcBtnsHtml=RC_VALS.map(function(v,i){return '<button class="b'+(i===RCidx?' on':'')+'" style="flex:1 0 30%" id="rc_'+i+'">'+fmtR(v)+'</button>';}).join('');
const reBtnsHtml=RE_VALS.map(function(v,i){return '<button class="b'+(i===REidx?' on':'')+'" style="flex:1 0 30%" id="re_'+i+'">'+(v===0?'0 Ω':fmtR(v))+'</button>';}).join('');
const rbBtnsHtml=RB_VALS.map(function(v,i){return '<button class="b'+(i===RBidx?' on':'')+'" style="flex:1 0 30%" id="rb_'+i+'">'+fmtR(v)+'</button>';}).join('');
const r1BtnsHtml=R1_VALS.map(function(v,i){return '<button class="b'+(i===R1idx?' on':'')+'" style="flex:1 0 30%" id="r1_'+i+'">'+fmtR(v)+'</button>';}).join('');
const r2BtnsHtml=R2_VALS.map(function(v,i){return '<button class="b'+(i===R2idx?' on':'')+'" style="flex:1 0 30%" id="r2_'+i+'">'+fmtR(v)+'</button>';}).join('');

document.getElementById('hud').innerHTML=`
  <div class="eyebrow">D2 · Semiconductores — Práctica d2-06</div>
  <h2>Polarización de BJT: Punto de Operación Q</h2>
  <p>Un transistor bipolar necesita un punto de operación (Q) estable en la región activa antes de poder amplificar señales. Compara dos formas de fijarlo con el mismo BJT: polarización FIJA (una sola resistencia de base) y polarización por DIVISOR de voltaje (R1/R2 + resistor de emisor RE). Observa qué tanto se mueve el punto Q cuando cambias a una unidad real con un β distinto — la dispersión de fábrica es enorme (100–800 según la referencia).</p>
  <div class="formula">
    IB = (VBB − VBE) / (RBB + (β+1)·RE) &nbsp;·&nbsp; IC = β·IB &nbsp;(región activa)<br>
    VCE = VCC − IC·RC − IE·RE &nbsp;·&nbsp; recta de carga: IC = (VCC − VCE)/(RC + RE)<br>
    Divisor "rígido": RTH = R1‖R2 ≤ 0.1·β·RE
  </div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8FB3AC"></span>Trayectoria de polarización FIJA (barrido de β)</div>
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Trayectoria de polarización DIVISOR (barrido de β)</div>
    <div class="li"><span class="dot" style="background:#E8871E"></span>Recta de carga ideal (extremos IC(sat) y VCE=VCC)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Punto Q real (bisección exacta)</div>
    <div class="li"><span class="dot" style="background:#3fae3f"></span>Región activa &nbsp;/&nbsp; <span class="dot" style="background:#E8871E"></span>Saturación &nbsp;/&nbsp; <span class="dot" style="background:#8a8a8a"></span>Corte</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> Modelo de gran señal DC con VBE=0.7 V constante (interruptor con caída constante), IC=β·IB solo en región activa, criterio de saturación vía VCE(sat) del datasheet, criterio de corte vía IB≤0, criterio "rígido" RTH≤0.1·β·RE, dispersión real de hFE por hoja de datos (BC547B: 200–450 · 2N3904: 100–300 @ condiciones de prueba del fabricante), recta de carga con extremos IDEALES (IC(sat)=VCC/(RC+RE), VCE=VCC) mostrados como referencia geométrica — el punto Q real se resuelve con el modelo completo, no leído de la recta ideal.<br>
  <span class="no">NO:</span> Análisis de señal pequeña ni ganancia de voltaje/corriente AC, modelo completo de Ebers-Moll/Gummel-Poon, efecto Early (resistencia de salida finita), dinámica térmica en tiempo real (autocalentamiento), variabilidad tipo Monte Carlo entre unidades más allá del rango min/max del datasheet, física de ruptura más allá de los límites VCEO/VCBO/VEBO declarados, parásitos dependientes de frecuencia, cargas dinámicas/AC en el colector.</div>
  <div class="src">Ref: ON Semiconductor BC546/D Rev.6 (BC547B) · STMicroelectronics 2N3904 Preliminary Data Feb-2003 · Boylestad &amp; Nashelsky, "Electronic Devices and Circuit Theory". Nota: MEC-I.2/ETR-I.2 y el transistor por defecto de esta práctica están pendientes de confirmación con el equipo curricular.</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Polarización BJT · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_predice">🔮 Predice</button>
    <button class="b" id="m_barrido">📉 Barrido</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>

  <div class="btns" style="margin-bottom:8px">
    <button class="b" id="topoFija" style="flex:1 0 48%">Fija</button>
    <button class="b on" id="topoDivisor" style="flex:1 0 48%">Divisor</button>
  </div>

  <div style="font-size:12px;color:#8FB3AC;margin:6px 0 4px">Transistor</div>
  <div class="btns">${devBtnsHtml}</div>

  <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">VCC</div>
  <div class="btns">${vccBtnsHtml}</div>
  <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">RC</div>
  <div class="btns">${rcBtnsHtml}</div>
  <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">RE</div>
  <div class="btns">${reBtnsHtml}</div>

  <div id="rbGroup">
    <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">RB</div>
    <div class="btns">${rbBtnsHtml}</div>
  </div>
  <div id="divGroup" style="display:none">
    <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">R1</div>
    <div class="btns">${r1BtnsHtml}</div>
    <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">R2</div>
    <div class="btns">${r2BtnsHtml}</div>
  </div>

  <div style="margin-top:10px">
    <label style="font-size:12px;color:#8FB3AC">β (hFE): <span id="vBeta">290</span></label><br>
    <input type="range" id="sBeta" min="200" max="450" step="1" value="290" style="width:100%">
  </div>

  <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;color:#EAF4F1">
    <div>IB: <span id="teleIB">—</span></div>
    <div>IC: <span id="teleIC">—</span></div>
    <div>IE: <span id="teleIE">—</span></div>
    <div>VCE: <span id="teleVCE">—</span></div>
    <div style="grid-column:1/3">Región: <span id="teleRegion">—</span></div>
  </div>

  <div id="predBox" style="display:none;margin-top:10px">
    <div id="predAsk" style="font-size:12px;color:#EAF4F1;margin-bottom:6px"></div>
    <div id="predAnswerBox"></div>
    <div id="predResult" style="font-size:12px;margin-top:6px"></div>
  </div>

  <div id="barBox" style="display:none;margin-top:10px">
    <button class="b" id="btnSweep" style="width:100%">▶ Barrer β (min → max)</button>
  </div>

  <div id="retoBox" style="display:none;margin-top:10px">
    <div id="retoAsk" style="font-size:12px;color:#EAF4F1;margin-bottom:6px"></div>
    <button class="b" id="btnReto" style="width:100%">Verificar diseño</button>
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
  explora:'Cambia entre polarización Fija y Divisor, ajusta VCC/RC/RE/RB(o R1,R2) y β, y observa cómo se mueve el punto Q sobre la recta de carga.',
  predice:'Antes de revelar el medidor, predice la región de operación o el punto Q exacto.',
  barrido:'Barre β entre el mínimo y el máximo real del dispositivo y compara cuánto se mueve el punto Q en cada topología.',
  reto:'Diseña un divisor de voltaje que mantenga el punto Q en la región activa para TODO el rango real de β del dispositivo.',
};

function setMode(k){
  mode=k;
  el('p_mode').textContent=MODE_META[k].label;
  el('p_mision').textContent=MISIONES[k];
  ['m_explora','m_predice','m_barrido','m_reto'].forEach(function(id){el(id).classList.toggle('on',id==='m_'+k);});
  el('predBox').style.display=k==='predice'?'block':'none';
  el('barBox').style.display=k==='barrido'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  if(k==='reto'){
    topo='divisor';
    syncCtrlBtns();
    newReto();
  }
  if(k==='predice'){genPredice();}
  if(k==='barrido'){SWEEP_FIJA.length=0;SWEEP_DIV.length=0;}
  refreshAll();
}
function syncCtrlBtns(){
  el('topoFija').classList.toggle('on',topo==='fija');
  el('topoDivisor').classList.toggle('on',topo==='divisor');
  el('rbGroup').style.display=topo==='fija'?'block':'none';
  el('divGroup').style.display=topo==='divisor'?'block':'none';
  Object.keys(DEVS).forEach(function(k){el('dev_'+k).classList.toggle('on',k===devKey);});
  VCC_VALS.forEach(function(v,i){el('vcc_'+i).classList.toggle('on',i===VCCidx);});
  RC_VALS.forEach(function(v,i){el('rc_'+i).classList.toggle('on',i===RCidx);});
  RE_VALS.forEach(function(v,i){el('re_'+i).classList.toggle('on',i===REidx);});
  RB_VALS.forEach(function(v,i){el('rb_'+i).classList.toggle('on',i===RBidx);});
  R1_VALS.forEach(function(v,i){el('r1_'+i).classList.toggle('on',i===R1idx);});
  R2_VALS.forEach(function(v,i){el('r2_'+i).classList.toggle('on',i===R2idx);});
  el('sBeta').min=curDev().hfeMin;el('sBeta').max=curDev().hfeMax;
  el('sBeta').value=beta;
  el('vBeta').textContent=beta.toFixed(0);
}
function selTopo(t){
  if(mode==='reto')return;
  topo=t;syncCtrlBtns();onChange();
}
function selDevice(k){
  devKey=k;
  beta=Math.round(DEVS[k].hfeTyp);
  syncCtrlBtns();onChange();
}
function selVCC(i){VCCidx=i;syncCtrlBtns();onChange();}
function selRC(i){RCidx=i;syncCtrlBtns();onChange();}
function selRE(i){REidx=i;syncCtrlBtns();onChange();}
function selRB(i){RBidx=i;syncCtrlBtns();onChange();}
function selR1(i){R1idx=i;syncCtrlBtns();onChange();}
function selR2(i){R2idx=i;syncCtrlBtns();onChange();}
function onBetaInput(v){beta=parseFloat(v);el('vBeta').textContent=beta.toFixed(0);onChange();}

function genPredice(){
  predType=Math.random()<0.5?'A':'B';
  const dev=curDev();
  const b=dev.hfeMin+Math.random()*(dev.hfeMax-dev.hfeMin);
  PRED={beta:b,topo:topo,VCC:curVCC(),RC:curRC(),RE:curRE(),RB:curRB(),R1:curR1(),R2:curR2(),devKey:devKey};
  predSolved=false;predRevealed=false;
  el('predAsk').textContent=predAskText();
  el('predAnswerBox').innerHTML=predType==='A'?
    '<div class="btns"><button class="b" id="pa_corte">Corte</button><button class="b" id="pa_activa">Activa</button><button class="b" id="pa_saturacion">Saturación</button></div>':
    '<label style="font-size:12px;color:#8FB3AC">IC estimada (mA): <input type="number" id="pa_ic" step="0.01" style="width:80px"></label> '+
    '<label style="font-size:12px;color:#8FB3AC">VCE estimada (V): <input type="number" id="pa_vce" step="0.01" style="width:80px"></label> '+
    '<button class="b" id="pa_check">Verificar</button>';
  el('predResult').textContent='';
  wirePredButtons();
}
function predAskText(){
  return 'Con la topología y resistencias actuales, imagina que te dan una unidad real de '+curDev().name+' con β = '+PRED.beta.toFixed(0)+' (dentro del rango de fábrica '+curDev().hfeMin+'–'+curDev().hfeMax+'). '+(predType==='A'?'¿En qué región de operación queda?':'¿Cuáles son IC y VCE en el punto Q?');
}
function wirePredButtons(){
  if(predType==='A'){
    ['corte','activa','saturacion'].forEach(function(k){
      const b=el('pa_'+k);
      if(b)b.addEventListener('click',function(){checkPredice(k);});
    });
  }else{
    const b=el('pa_check');
    if(b)b.addEventListener('click',function(){
      const ic=parseFloat(el('pa_ic').value)||0;
      const vce=parseFloat(el('pa_vce').value)||0;
      checkPredice(null,{ic:ic,vce:vce});
    });
  }
}
function checkPredice(kind,val){
  if(!PRED||predRevealed)return;
  const r=solveBJT(PRED.topo,curDev(),PRED.beta,PRED.VCC,PRED.RC,PRED.RE,PRED.RB,PRED.R1,PRED.R2);
  let ok=false,msg='';
  if(predType==='A'){
    ok=kind===r.region;
    msg=ok?'¡Correcto! La unidad con β='+PRED.beta.toFixed(0)+' opera en '+r.region+'.':'No — con β='+PRED.beta.toFixed(0)+' el punto Q cae en '+r.region+', no en '+kind+'.';
  }else{
    const icOk=Math.abs(val.ic-r.IC*1000)<=Math.max(r.IC*1000*0.2,0.05);
    const vceOk=Math.abs(val.vce-r.VCE)<=Math.max(r.VCE*0.2,0.15);
    ok=icOk&&vceOk;
    msg=(ok?'¡Correcto! ':'No exactamente — ')+'IC real ≈ '+fmtI(r.IC)+', VCE real ≈ '+fmtV(r.VCE)+' (región '+r.region+').';
  }
  predSolved=ok;predRevealed=true;
  el('predResult').textContent=msg;
  el('predResult').style.color=ok?'#3fae3f':'#d23b3b';
  beta=PRED.beta;topo=PRED.topo;VCCidx=VCC_VALS.indexOf(PRED.VCC);RCidx=RC_VALS.indexOf(PRED.RC);REidx=RE_VALS.indexOf(PRED.RE);RBidx=RB_VALS.indexOf(PRED.RB);R1idx=R1_VALS.indexOf(PRED.R1);R2idx=R2_VALS.indexOf(PRED.R2);devKey=PRED.devKey;
  syncCtrlBtns();refreshAll();
  synth.beep(ok?880:220,.08,.06);
}

function newReto(){
  const dev=curDev();
  RETO={devKey:devKey,VCC:curVCC(),RC:curRC()};
  retoSolved=false;
  el('retoAsk').textContent='Diseña R1, R2 y RE (con VCC='+curVCC()+' V, RC='+fmtR(curRC())+', '+dev.name+', β real entre '+dev.hfeMin+' y '+dev.hfeMax+') para que el punto Q permanezca en la región ACTIVA en TODO el rango de β. Ajusta R1/R2/RE arriba y presiona Verificar.';
  el('retoResult').textContent='';
}
function checkReto(){
  const dev=curDev();
  const lo=solveBJT('divisor',dev,dev.hfeMin,curVCC(),curRC(),curRE(),curRB(),curR1(),curR2());
  const hi=solveBJT('divisor',dev,dev.hfeMax,curVCC(),curRC(),curRE(),curRB(),curR1(),curR2());
  const rbb=(curR1()*curR2())/(curR1()+curR2());
  const rigidoLo=isRigido(rbb,dev.hfeMin,curRE());
  const ok=lo.region==='activa'&&hi.region==='activa';
  retoSolved=ok;
  let msg=ok?'¡Diseño válido! El punto Q permanece en activa para β='+dev.hfeMin+' (VCE='+lo.VCE.toFixed(2)+'V) y β='+dev.hfeMax+' (VCE='+hi.VCE.toFixed(2)+'V).':
    'Aún no — con β='+dev.hfeMin+' la región es '+lo.region+' y con β='+dev.hfeMax+' es '+hi.region+'. Ambas deben ser "activa".';
  msg+=rigidoLo?' Divisor rígido (RTH ≤ 0.1·β·RE): sí.':' Divisor rígido (RTH ≤ 0.1·β·RE): no — considera bajar R1‖R2 o subir RE.';
  el('retoResult').textContent=msg;
  el('retoResult').style.color=ok?'#3fae3f':'#d23b3b';
  synth.beep(ok?880:220,.08,.06);
}

async function runSweep(){
  if(sweeping)return;
  sweeping=true;
  SWEEP_FIJA.length=0;SWEEP_DIV.length=0;
  const dev=curDev();
  const N=17;
  for(let k=0;k<N;k++){
    const b=dev.hfeMin+(dev.hfeMax-dev.hfeMin)*k/(N-1);
    const rf=solveBJT('fija',dev,b,curVCC(),curRC(),curRE(),curRB(),curR1(),curR2());
    const rd=solveBJT('divisor',dev,b,curVCC(),curRC(),curRE(),curRB(),curR1(),curR2());
    SWEEP_FIJA.push({beta:b,VCE:rf.VCE,IC:rf.IC,region:rf.region});
    SWEEP_DIV.push({beta:b,VCE:rd.VCE,IC:rd.IC,region:rd.region});
    drawBoard();
    await sleep(45);
  }
  sweeping=false;
  const spreadFija=Math.max.apply(null,SWEEP_FIJA.map(function(p){return p.VCE;}))-Math.min.apply(null,SWEEP_FIJA.map(function(p){return p.VCE;}));
  const spreadDiv=Math.max.apply(null,SWEEP_DIV.map(function(p){return p.VCE;}))-Math.min.apply(null,SWEEP_DIV.map(function(p){return p.VCE;}));
  showToast('Dispersión de VCE con β: Fija = '+spreadFija.toFixed(2)+' V · Divisor = '+spreadDiv.toFixed(2)+' V');
}

function updateTele(){
  if(!RES)return;
  el('teleIB').textContent=fmtI(RES.IB);
  el('teleIC').textContent=fmtI(RES.IC);
  el('teleIE').textContent=fmtI(RES.IE);
  el('teleVCE').textContent=fmtV(RES.VCE);
  el('teleRegion').textContent=RES.region.toUpperCase();
  el('teleRegion').style.color=RES.region==='saturacion'?'#E8871E':(RES.region==='corte'?'#8a8a8a':'#3fae3f');
}
function updateReport(){
  if(mode==='predice'&&!predRevealed){el('report').textContent='Predicción pendiente — revela para ver el informe.';return;}
  if(!RES)return;
  const rbb=RES.RBB;
  const rigido=topo==='divisor'?isRigido(rbb,beta,curRE()):null;
  let txt='VBB='+fmtV(RES.VBB)+' · RBB='+fmtR(rbb)+' · IB='+fmtI(RES.IB)+' · IC='+fmtI(RES.IC)+' · IE='+fmtI(RES.IE)+' · VCE='+fmtV(RES.VCE)+' · región: '+RES.region;
  if(RES.region==='saturacion')txt+=' · β forzado ≈ '+RES.betaForced.toFixed(1)+' (< β real del dispositivo)';
  if(topo==='divisor')txt+=' · '+(rigido?'divisor RÍGIDO (RTH ≤ 0.1·β·RE)':'divisor NO rígido (RTH > 0.1·β·RE) — el punto Q depende más de β');
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

const QUIZ=[
  {q:'¿Qué región de operación tiene IB≈0 y VCE≈VCC?',opts:['Corte','Activa','Saturación'],a:0},
  {q:'¿Qué elemento estabiliza el punto Q ante la dispersión de β en un divisor de voltaje?',opts:['RC','RE (realimentación negativa)','El propio BJT'],a:1},
  {q:'¿Cuándo se considera "rígido" un divisor de voltaje de base?',opts:['Cuando R1=R2','Cuando RTH ≤ 0.1·β·RE','Cuando VCC es alto'],a:1},
  {q:'En saturación, ¿qué relación deja de cumplirse?',opts:['IC=β·IB','VBE≈0.7V','IE=IC+IB'],a:0},
];
let qIdx=0;
function buildQuiz(){qIdx=0;refreshQuestion();}
function refreshQuestion(){
  const q=QUIZ[qIdx];
  el('quizQ').textContent=q.q;
  el('quizOpts').innerHTML=q.opts.map(function(o,i){return '<button class="b" data-i="'+i+'">'+o+'</button>';}).join('');
  el('quizOpts').querySelectorAll('button').forEach(function(btn){
    btn.addEventListener('click',function(){
      const i=parseInt(btn.getAttribute('data-i'),10);
      const ok=i===q.a;
      showToast(ok?'¡Correcto!':'No — repasa la definición.');
      synth.beep(ok?880:220,.08,.06);
      qIdx=(qIdx+1)%QUIZ.length;
      setTimeout(refreshQuestion,700);
    });
  });
}

function actToast(act){
  if(act==='rb3d')showToast(topo==='fija'?'RB = '+fmtR(curRB())+' — fija la base directamente a VCC.':'R1 = '+fmtR(curR1())+' — parte superior del divisor de base.');
  else if(act==='r23d')showToast('R2 = '+fmtR(curR2())+' — parte inferior del divisor de base, a GND.');
  else if(act==='rc3d')showToast('RC = '+fmtR(curRC())+' — resistor de colector.');
  else if(act==='re3d')showToast(curRE()>0?'RE = '+fmtR(curRE())+' — resistor de emisor (realimentación).':'RE = 0 — sin degeneración de emisor.');
  else if(act==='bjt3d')showToast(curDev().name+' — β actual = '+beta.toFixed(0)+', región: '+(RES?RES.region:'—'));
  else if(act==='src3d')showToast('Fuente VCC = '+curVCC().toFixed(0)+' V (ideal, sin resistencia interna).');
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
  selTopo('fija');await sleep(1400);
  selDevice('bc547b');await sleep(1200);
  selTopo('divisor');await sleep(1400);
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
el('topoFija').addEventListener('click',function(){selTopo('fija');});
el('topoDivisor').addEventListener('click',function(){selTopo('divisor');});
Object.keys(DEVS).forEach(function(k){el('dev_'+k).addEventListener('click',function(){selDevice(k);});});
VCC_VALS.forEach(function(v,i){el('vcc_'+i).addEventListener('click',function(){selVCC(i);});});
RC_VALS.forEach(function(v,i){el('rc_'+i).addEventListener('click',function(){selRC(i);});});
RE_VALS.forEach(function(v,i){el('re_'+i).addEventListener('click',function(){selRE(i);});});
RB_VALS.forEach(function(v,i){el('rb_'+i).addEventListener('click',function(){selRB(i);});});
R1_VALS.forEach(function(v,i){el('r1_'+i).addEventListener('click',function(){selR1(i);});});
R2_VALS.forEach(function(v,i){el('r2_'+i).addEventListener('click',function(){selR2(i);});});
el('sBeta').addEventListener('input',function(e){onBetaInput(e.target.value);});
el('btnSweep').addEventListener('click',runSweep);
el('btnReto').addEventListener('click',checkReto);
el('btnAuto').addEventListener('click',runAuto);

// init
onChange();
S.setAnimate(function(){});
newReto();
buildQuiz();
syncCtrlBtns();
refreshBenchSel();
S.start();
setMode('explora');

window.__labDebug={
  state:function(){return {topo:topo,devKey:devKey,VCCidx:VCCidx,RCidx:RCidx,REidx:REidx,RBidx:RBidx,R1idx:R1idx,R2idx:R2idx,beta:beta,mode:mode};},
  res:function(){return RES;},
  pred:function(){return {PRED:PRED,predSolved:predSolved,predRevealed:predRevealed,predType:predType};},
  reto:function(){return {RETO:RETO,retoSolved:retoSolved};},
  sweep:function(){return {fija:SWEEP_FIJA,div:SWEEP_DIV};},
  solveBJT:solveBJT,
  setTopo:selTopo,
  setDevice:selDevice,
  setVCC:selVCC,setRC:selRC,setRE:selRE,setRB:selRB,setR1:selR1,setR2:selR2,
  setBeta:function(b){beta=b;onChange();},
  mode:function(){return mode;},
  setMode:setMode,
  checkPredice:checkPredice,
  newPredice:genPredice,
  checkReto:checkReto,
  newReto:newReto,
  sweepNow:runSweep,
  boardClick:boardClick,
};
