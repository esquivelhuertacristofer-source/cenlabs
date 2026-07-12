/*
  Evalúa las pérdidas de un MOSFET de potencia en PWM (d2-10)
  Circuito: un bus de voltaje V alimenta una carga genérica en serie con un
  MOSFET de potencia conmutado en PWM a una frecuencia fsw y ciclo de trabajo
  D. Práctica hermana de mecanica-4 (Inversor Trifásico de Potencia), que
  elige fsw de forma solo cualitativa ("más alto = más suave pero más
  pérdidas") — esta práctica cuantifica exactamente esa disyuntiva.

  SÍ modela: pérdida de conducción Pcond=D·I²·RDS(on) (disipación resistiva
  mientras el canal está cerrado, ponderada por el ciclo de trabajo D),
  pérdida de conmutación Psw=½·V·I·fsw·(tr+tf) (energía disipada en cada
  transición de encendido/apagado, con tr+tf tomado directo de hoja de datos
  a la condición de prueba del fabricante), la potencia total Ptot=Pcond+Psw,
  y la frecuencia de cruce fsw* donde Pcond=Psw
  (fsw*=2·D·I·RDS(on)/(V·(tr+tf))) — todo resuelto en forma cerrada.

  NO modela: dependencia de tr/tf con la corriente de compuerta de TU
  circuito de disparo (el simulador usa el tr+tf de catálogo, medido a una
  condición de prueba fija del fabricante, no un valor que cambie con tu
  driver — ese acoplamiento es el tema de la práctica hermana d2-09),
  pérdidas por recuperación inversa de diodos de rueda libre, capacitancias
  no lineales (Coss) ni la energía de descarga de Coss en cada ciclo, ni el
  efecto de la temperatura de unión sobre RDS(on) (que en un MOSFET real
  aumenta con la temperatura, así que la Pcond de este simulador es una cota
  inferior optimista).
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

// ===== Sección 1: Modelo físico =====
const DEVS={
  irf540n:{
    name:'IRF540N (N-MOSFET potencia)',
    rdsOn:0.044,
    ptot:130,
    ptotNote:'130 W según IR/Infineon PD-94812 (TC=25°C); Fairchild Rev.C reporta 120 W para el mismo número de parte — confirmar siempre con la hoja de datos del fabricante específico en la mano.',
    idMax:33,vdsMax:100,
    trPlusTf:70e-9,
    trNote:'tr+tf=70 ns medido por IR/Infineon a VDD=50 V, ID=16 A, RG=5.1 Ω, VGS=10 V (PD-94812) — condición de prueba fija del fabricante, no la de este circuito.',
    color:0x1a2a1a,
  },
  irlz44n:{
    name:'IRLZ44N (N-MOSFET nivel lógico)',
    rdsOn:0.022,
    ptot:110,
    ptotNote:'110 W según International Rectifier PD-9.1346B (25/8/97) — única hoja de datos localizada para este número de parte pese a búsqueda exhaustiva; no se encontró una reedición Infineon posterior que la reconfirme. La cifra de 83 W que circula en algunas fuentes secundarias no pudo confirmarse en ninguna hoja de datos oficial.',
    idMax:47,vdsMax:55,
    trPlusTf:99e-9,
    trNote:'tr+tf=99 ns medido por International Rectifier a VDD=28 V, ID=25 A, RG=3.4 Ω, VGS=5.0 V (PD-9.1346B) — única hoja de datos localizada para este número de parte; condición de prueba fija del fabricante, no la de este circuito.',
    color:0x203a2e,
  },
  n2n7000:{
    name:'2N7000 (N-MOSFET señal pequeña)',
    rdsOn:5,
    ptot:0.35,
    ptotNote:'350 mW @TC=25°C según ON Semiconductor Rev.5 (hoja vigente); la hoja Fairchild 1995 original reporta 400 mW @TA=25°C — referencias de temperatura distintas, no directamente comparables.',
    idMax:0.2,vdsMax:60,
    trPlusTf:null,
    trNote:'tr y tf no especificados por ninguna de las hojas de datos consultadas (Fairchild 1995, ON Semiconductor Rev.5) — este dispositivo es de señal pequeña, no está pensado para conmutación de potencia PWM. Sin tr+tf no se puede calcular Psw: el simulador solo muestra Pcond para esta unidad.',
    color:0x2e2e2e,
  },
};

function pLoss(dev,V,I,D,fswHzVal){
  const Pcond=D*I*I*dev.rdsOn;
  if(dev.trPlusTf==null)return {Pcond:Pcond,Psw:null,Ptot:null};
  const Psw=0.5*V*I*fswHzVal*dev.trPlusTf;
  return {Pcond:Pcond,Psw:Psw,Ptot:Pcond+Psw};
}
function crossoverFswPure(dev,V,I,D){
  if(dev.trPlusTf==null)return null;
  return (2*D*I*dev.rdsOn)/(V*dev.trPlusTf);
}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function fmtV(v){return v.toFixed(0)+' V';}
function fmtI(i){
  if(i>=1)return i.toFixed(3)+' A';
  if(i>=0.001)return (i*1000).toFixed(2)+' mA';
  return (i*1e6).toFixed(1)+' µA';
}
function fmtP(w){
  if(w>=1)return w.toFixed(3)+' W';
  if(w>=0.001)return (w*1000).toFixed(1)+' mW';
  return (w*1e6).toFixed(1)+' µW';
}
function fmtHz(f){
  if(f>=1000)return (f/1000).toFixed(1)+' kHz';
  return f.toFixed(0)+' Hz';
}
function fmtHzTick(f){
  if(f>=1000)return (f/1000).toFixed(0)+'k';
  return f.toFixed(0);
}
function fmtRds(r){
  if(r>=1)return r.toFixed(3)+' Ω';
  return (r*1000).toFixed(1)+' mΩ';
}
function pickStep(maxVal){
  const raw=maxVal/6,mag=Math.pow(10,Math.floor(Math.log10(raw||1))),norm=raw/mag;
  if(norm<1.5)return 1*mag;
  if(norm<3.5)return 2*mag;
  if(norm<7.5)return 5*mag;
  return 10*mag;
}

// ===== Sección 2: Estado =====
const V_VALS=[12,24,36,48,72,96];

let devKey='irf540n';
let Vidx=2;
function midI(dev){return (dev.idMax*0.05+dev.idMax)/2;}
let Iamp=midI(DEVS[devKey]);
let Dpct=50;
let fswHz=50000;
let mode='explora';
let PRED=null,predSolved=false,predRevealed=false,predType='A';
let RETO=null,retoSolved=false;
let sweeping=false;
let sweepMarkerF=null;
let RES=null;
function curDev(){return DEVS[devKey];}
function curV(){return V_VALS[Vidx];}
function curD(){return Dpct/100;}
function curI(){return Iamp;}
function curFsw(){return fswHz;}
function curPcond(){return pLoss(curDev(),curV(),curI(),curD(),curFsw()).Pcond;}
function pswAt(fHz){
  const dev=curDev();
  if(dev.trPlusTf==null)return null;
  return 0.5*curV()*curI()*fHz*dev.trPlusTf;
}
function curPsw(){return pswAt(curFsw());}
function crossoverFsw(){return crossoverFswPure(curDev(),curV(),curI(),curD());}
function computeRES(){
  const r=pLoss(curDev(),curV(),curI(),curD(),curFsw());
  return {Pcond:r.Pcond,Psw:r.Psw,Ptot:r.Ptot,fCross:crossoverFsw()};
}
function overVoltage(){return curV()>curDev().vdsMax;}
function overPower(){
  if(!RES)return false;
  const ref=RES.Ptot==null?RES.Pcond:RES.Ptot;
  return ref>curDev().ptot;
}

// ===== Sección 3: Materiales =====
const std=function(o){return new THREE.MeshStandardMaterial(o);};
const MAT={
  bench:std({color:0x0e1512,roughness:0.9,metalness:0.05}),
  frame:std({color:0x11201c,roughness:0.6,metalness:0.3}),
  pcb:std({color:0x0c2a20,roughness:0.75}),
  scope:std({color:0x121a18,roughness:0.35,metalness:0.5}),
  lead:std({color:0xb9c2bd,metalness:0.8,roughness:0.3}),
  load:std({color:0x3a3a3a,roughness:0.55,metalness:0.25}),
  loadFin:std({color:0x555555,roughness:0.4,metalness:0.6}),
  mosfetBody:std({color:0x1a1a1a,roughness:0.4,metalness:0.15}),
  mosfetTab:std({color:0xb9c2bd,metalness:0.85,roughness:0.25}),
};

// ===== Sección 4: Ayudantes de dibujo 2D =====
function line(c,x0,y0,x1,y1,col,w,dash){c.save();c.strokeStyle=col;c.lineWidth=w||2;if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
function rr(c,x,y,w,h,r,fill,stroke,sw){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=sw||2;c.stroke();}}
function groundGlyph(c,x,y){line(c,x,y,x,y+14,'#EAF4F1',2.5);line(c,x-16,y+14,x+16,y+14,'#EAF4F1',2.5);line(c,x-10,y+21,x+10,y+21,'#EAF4F1',2);line(c,x-4,y+28,x+4,y+28,'#EAF4F1',1.5);}
function loadGlyph(c,cx,y0,y1,label){
  const w=36,x=cx-w/2,h=(y1-y0)-16;
  rr(c,x,y0+8,w,h,4,'#1a2a26','#EAF4F1',2);
  c.save();c.beginPath();c.rect(x,y0+8,w,h);c.clip();
  c.strokeStyle='#2A9D8F';c.lineWidth=1.5;
  for(let d=-w;d<h+w;d+=10){
    line(c,x+d,y0+8,x+d+w,y0+8+w,'#2A9D8F',1.2);
  }
  c.restore();
  line(c,cx,y0,cx,y0+8,'#EAF4F1',2.5);
  line(c,cx,y1-8,cx,y1,'#EAF4F1',2.5);
  if(label){c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='left';c.fillText(label,cx+22,(y0+y1)/2+4);}
}
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

// ===== Sección 5: Pizarrón — esquemático + gráfica de pérdidas =====
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;
const PX0=130,PX1=940,PY0=308,PY1=676;

const GATE_X=300,GATE_R=26,DEV_X=620,DEV_R=32,DEV_CY=175;
const BUS_Y=40,GND_Y=286;
const LOAD_Y0=BUS_Y,LOAD_Y1=DEV_CY-DEV_R;
const S_Y0=DEV_CY+DEV_R,S_Y1=GND_Y;

const HIT=[
  {x:DEV_X,y:(LOAD_Y0+LOAD_Y1)/2,r:44,act:'load'},
  {x:DEV_X,y:DEV_CY,r:DEV_R+16,act:'mosfet'},
  {x:GATE_X,y:DEV_CY,r:GATE_R+14,act:'pwm'},
];

function graphRange(){
  const fMaxG=300000;
  const dev=curDev();
  const pc=curPcond();
  let pMaxCandidate=Math.max(dev.ptot*1.15,pc*1.15);
  if(dev.trPlusTf!=null){
    const totAt300=pc+pswAt(fMaxG);
    pMaxCandidate=Math.max(pMaxCandidate,totAt300*1.1);
  }
  return {fMaxG:fMaxG,pMaxG:pMaxCandidate};
}
function xPix(f){const g=graphRange();return PX0+(f/g.fMaxG)*(PX1-PX0);}
function gyPix(p){const g=graphRange();return PY1-(Math.max(Math.min(p,g.pMaxG),0)/g.pMaxG)*(PY1-PY0);}

function curColor(){
  if(!RES)return '#4FD1C5';
  const dev=curDev();
  const ref=RES.Ptot==null?RES.Pcond:RES.Ptot;
  const ratio=ref/dev.ptot;
  if(ratio>1)return '#d23b3b';
  if(ratio>0.7)return '#E8871E';
  return '#3fae3f';
}

function drawPwmIcon(c,cx,cy,s){
  c.strokeStyle='#EAF4F1';c.lineWidth=2;c.beginPath();
  c.moveTo(cx-s,cy+s*0.5);
  c.lineTo(cx-s,cy-s*0.5);
  c.lineTo(cx-s*0.25,cy-s*0.5);
  c.lineTo(cx-s*0.25,cy+s*0.5);
  c.lineTo(cx+s*0.35,cy+s*0.5);
  c.lineTo(cx+s*0.35,cy-s*0.5);
  c.lineTo(cx+s,cy-s*0.5);
  c.stroke();
}

function drawSchematic(c){
  c.clearRect(0,0,1024,PY0-4);
  line(c,GATE_X-40,BUS_Y,DEV_X+40,BUS_Y,'#EAF4F1',2.5);
  c.beginPath();c.arc(DEV_X,BUS_Y,4,0,7);c.fillStyle='#4FD1C5';c.fill();
  c.fillStyle='#4FD1C5';c.font='bold 13px system-ui';c.textAlign='center';
  c.fillText('+V = '+fmtV(curV()),(GATE_X+DEV_X)/2,BUS_Y-14);

  loadGlyph(c,DEV_X,LOAD_Y0,LOAD_Y1,'CARGA');
  const dev=curDev(),col=curColor();
  mosfetGlyph(c,DEV_X,DEV_CY,DEV_R,DEV_X-90,col);
  line(c,DEV_X,S_Y0,DEV_X,S_Y1,'#EAF4F1',2.5);
  groundGlyph(c,DEV_X,GND_Y);

  c.beginPath();c.arc(GATE_X,DEV_CY,GATE_R,0,7);c.fillStyle='#16211d';c.fill();c.strokeStyle='#EAF4F1';c.lineWidth=2;c.stroke();
  drawPwmIcon(c,GATE_X,DEV_CY,GATE_R*0.62);
  line(c,GATE_X+GATE_R,DEV_CY,DEV_X-90,DEV_CY,'#EAF4F1',2.5);
  line(c,GATE_X,DEV_CY+GATE_R,GATE_X,GND_Y,'#EAF4F1',2.5);
  groundGlyph(c,GATE_X,GND_Y);
  c.fillStyle='#4FD1C5';c.font='bold 12px system-ui';c.textAlign='center';
  c.fillText('PWM: D='+Dpct.toFixed(0)+'% · fsw='+fmtHz(curFsw()),GATE_X,DEV_CY-GATE_R-16);

  c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='left';
  c.fillText(dev.name+' · I='+fmtI(curI()),DEV_X+DEV_R+16,DEV_CY+4);
}

function drawGraph(c){
  const g=graphRange();
  rr(c,PX0-4,PY0-4,(PX1-PX0)+8,(PY1-PY0)+8,6,'#0c1a16','#1E3A34',2);
  const xt=pickStep(g.fMaxG);
  c.font='10px monospace';
  for(let f=0;f<=g.fMaxG+1e-6;f+=xt){
    const x=xPix(f);
    line(c,x,PY0,x,PY1,'#12241f',1);
    c.fillStyle='#8FB3AC';c.textAlign='center';c.fillText(fmtHzTick(f),x,PY1+16);
  }
  const yt=pickStep(g.pMaxG);
  for(let p=0;p<=g.pMaxG+1e-9;p+=yt){
    const y=gyPix(p);
    line(c,PX0,y,PX1,y,'#12241f',1);
    c.fillStyle='#8FB3AC';c.textAlign='right';
    c.fillText(fmtP(p),PX0-8,y+4);
  }
  line(c,PX0,PY1,PX1,PY1,'#EAF4F1',2);
  line(c,PX0,PY0,PX0,PY1,'#EAF4F1',2);
  c.fillStyle='#EAF4F1';c.font='12px monospace';c.textAlign='center';
  c.fillText('fsw (Hz)',(PX0+PX1)/2,PY1+34);
  c.save();c.translate(PX0-64,(PY0+PY1)/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText('Potencia',0,0);c.restore();

  const dev=curDev();
  const hidden=(mode==='predice'&&!predRevealed);

  const ceilY=gyPix(dev.ptot);
  line(c,PX0,ceilY,PX1,ceilY,'#d23b3b',1.5,[8,5]);
  c.fillStyle='#d23b3b';c.font='11px monospace';c.textAlign='left';
  c.fillText('Ptot máx catálogo ('+fmtP(dev.ptot)+')',PX0+6,ceilY-6);

  const pc=curPcond();
  const pcY=gyPix(pc);
  line(c,PX0,pcY,PX1,pcY,'#4FD1C5',2);
  c.fillStyle='#4FD1C5';c.font='11px monospace';c.textAlign='left';
  c.fillText('Pcond ('+fmtP(pc)+', no depende de fsw)',PX0+6,pcY-6<PY0+14?pcY+16:pcY-6);

  if(dev.trPlusTf!=null&&!hidden){
    c.beginPath();
    for(let f=0;f<=g.fMaxG;f+=g.fMaxG/60){
      const ps=pswAt(f);
      const x=xPix(f),y=gyPix(ps);
      if(f===0)c.moveTo(x,y);else c.lineTo(x,y);
    }
    c.strokeStyle='#E8871E';c.lineWidth=2;c.stroke();
    c.fillStyle='#E8871E';c.font='11px monospace';c.textAlign='left';
    c.fillText('Psw (∝ fsw)',xPix(g.fMaxG*0.62),gyPix(pswAt(g.fMaxG*0.62))-10);

    c.beginPath();
    for(let f=0;f<=g.fMaxG;f+=g.fMaxG/60){
      const pt=pc+pswAt(f);
      const x=xPix(f),y=gyPix(pt);
      if(f===0)c.moveTo(x,y);else c.lineTo(x,y);
    }
    c.strokeStyle='#FFB703';c.lineWidth=2.5;c.stroke();
    c.fillStyle='#FFB703';c.font='bold 11px monospace';c.textAlign='left';
    c.fillText('Ptot = Pcond+Psw',xPix(g.fMaxG*0.35),gyPix(pc+pswAt(g.fMaxG*0.35))-10);

    const fx=crossoverFsw();
    if(fx!=null&&fx>=0&&fx<=g.fMaxG){
      const cxp=xPix(fx),cyp=gyPix(pc);
      c.beginPath();c.arc(cxp,cyp,5,0,7);c.fillStyle='#fff';c.fill();c.strokeStyle='#4FD1C5';c.lineWidth=2;c.stroke();
      c.fillStyle='#EAF4F1';c.font='10px monospace';c.textAlign='center';
      c.fillText('cruce: '+fmtHz(fx),cxp,cyp<PY0+40?cyp+20:cyp-12);
    }
  }else if(dev.trPlusTf==null){
    c.fillStyle='#8a8a8a';c.font='12px monospace';c.textAlign='center';
    c.fillText('Psw no disponible — tr+tf no especificado por el fabricante para '+dev.name,(PX0+PX1)/2,PY0+30);
  }

  if(sweepMarkerF!=null){
    const py=dev.trPlusTf==null?pc:pc+pswAt(sweepMarkerF);
    const mx=xPix(sweepMarkerF),my=gyPix(py);
    c.beginPath();c.arc(mx,my,7,0,7);c.fillStyle='#fff';c.fill();c.strokeStyle='#FFB703';c.lineWidth=2.5;c.stroke();
  }

  if(RES&&!hidden){
    const opX=xPix(curFsw());
    const opY=dev.trPlusTf==null?gyPix(pc):gyPix(RES.Ptot);
    c.beginPath();c.arc(opX,opY,6,0,7);c.fillStyle='#FFB703';c.fill();c.strokeStyle='#fff';c.lineWidth=1.5;c.stroke();
    c.fillStyle='#FFB703';c.font='bold 12px monospace';c.textAlign='left';
    const lbl=dev.trPlusTf==null?fmtP(pc):fmtP(RES.Ptot);
    c.fillText('P('+fmtHz(curFsw())+') = '+lbl,opX+10,opY-10);
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

function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  if(RES&&!(mode==='predice'&&!predRevealed)){
    const dev=curDev();
    const opX=xPix(curFsw());
    const opY=dev.trPlusTf==null?gyPix(RES.Pcond):gyPix(RES.Ptot);
    if(Math.hypot(x-opX,y-opY)<40){
      const lbl=dev.trPlusTf==null?('Pcond = '+fmtP(RES.Pcond)+' (Psw no disponible)'):('Pcond='+fmtP(RES.Pcond)+' · Psw='+fmtP(RES.Psw)+' · Ptot='+fmtP(RES.Ptot));
      showToast('Punto de operación: fsw = '+fmtHz(curFsw())+' · '+lbl);
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
  if(best.act==='load')showToast('Carga genérica — representa cualquier carga en serie con el MOSFET (motor, bobina, resistencia). Su valor no participa en Pcond/Psw: lo que importa es la corriente I que efectivamente circula.');
  if(best.act==='pwm')showToast('Señal PWM de compuerta: D='+Dpct.toFixed(0)+'% de ciclo de trabajo a fsw='+fmtHz(curFsw())+'. D pondera Pcond; fsw escala Psw.');
  if(best.act==='mosfet')showToast(curDev().name+' — RDS(on)='+fmtRds(curDev().rdsOn)+'.');
}

// ===== Sección 6: Banco 3D =====
const boardG=new THREE.Group();
const board=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.95),new THREE.MeshStandardMaterial({map:bTex,roughness:0.55,metalness:0.05}));
board.userData.title='Esquemático + gráfica de pérdidas';
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
const fuenteBox=makeDisplayBox(0.6,0.42,0.14,256,180);
fuenteBox.g.position.set(-0.2,0.42,0.55);
fuenteBox.g.userData.act='src3d';fuenteBox.g.userData.title='Bus V';
benchG.add(fuenteBox.g);
const medidorBox=makeDisplayBox(0.6,0.42,0.14,256,180);
medidorBox.g.position.set(0.45,0.42,0.55);
medidorBox.g.userData.act='medidor3d';medidorBox.g.userData.title='Pcond / Psw / Ptot';
benchG.add(medidorBox.g);
const pwmBox=makeDisplayBox(0.6,0.42,0.14,256,180);
pwmBox.g.position.set(1.1,0.42,0.55);
pwmBox.g.userData.act='pwm3d';pwmBox.g.userData.title='Señal PWM de compuerta';
benchG.add(pwmBox.g);

function leads(g){
  const l1=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.16,10),MAT.lead);
  l1.rotation.z=Math.PI/2;l1.position.x=-0.16;g.add(l1);
  const l2=l1.clone();l2.position.x=0.16;g.add(l2);
}
function makeLoad3D(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.22,24),MAT.load);
  body.rotation.z=Math.PI/2;g.add(body);
  for(let i=0;i<5;i++){
    const fin=new THREE.Mesh(new THREE.TorusGeometry(0.095,0.012,8,20),MAT.loadFin);
    fin.rotation.y=Math.PI/2;fin.position.x=-0.08+i*0.04;
    g.add(fin);
  }
  leads(g);
  return g;
}
function makeMOSFET3D(){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.17,0.05),MAT.mosfetBody);
  g.add(body);
  const tab=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.06,0.02),MAT.mosfetTab);
  tab.position.set(0,0.115,-0.008);g.add(tab);
  const l1=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,0.14,8),MAT.lead);
  l1.position.set(-0.045,-0.15,0.02);g.add(l1);
  const l2=l1.clone();l2.position.set(0,-0.15,0.02);g.add(l2);
  const l3=l1.clone();l3.position.set(0.045,-0.15,0.02);g.add(l3);
  g.userData.bodyMesh=body;
  return g;
}
const loadG=makeLoad3D();
loadG.position.set(-0.15,0.24,1.1);
loadG.userData.act='load3d';loadG.userData.title='Carga (genérica)';
benchG.add(loadG);
const mosfetG=makeMOSFET3D();
mosfetG.position.set(0.45,0.24,1.15);
mosfetG.userData.act='mosfet3d';mosfetG.userData.title='MOSFET (Q1)';
benchG.add(mosfetG);
const pwmChipG=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.05,0.16),MAT.mosfetTab);
pwmChipG.position.set(1.1,0.22,1.1);
pwmChipG.userData.act='pwm3d';pwmChipG.userData.title='Controlador PWM';
benchG.add(pwmChipG);

benchG.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
board.castShadow=false;boardFrame.receiveShadow=true;
S.scene.add(benchG);

function drawFuenteScreen(){
  const cx=fuenteBox.cx,cv=fuenteBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#08120f';cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='#4FD1C5';cx.font='bold 26px monospace';cx.textAlign='center';
  cx.fillText('BUS V',cv.width/2,50);
  cx.font='bold 40px monospace';
  cx.fillText(fmtV(curV()),cv.width/2,116);
  fuenteBox.tex.needsUpdate=true;
}
function drawMedidorScreen(){
  const cx=medidorBox.cx,cv=medidorBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#08120f';cx.fillRect(0,0,cv.width,cv.height);
  const hide=(mode==='predice'&&!predRevealed);
  cx.fillStyle='#FFB703';cx.font='bold 15px monospace';cx.textAlign='center';
  cx.fillText('Pcond / Psw / Ptot',cv.width/2,26);
  cx.font='bold 19px monospace';
  if(hide){
    cx.fillText('¿?  /  ¿?  /  ¿?',cv.width/2,100);
  }else if(RES){
    cx.fillStyle='#4FD1C5';cx.fillText(fmtP(RES.Pcond),cv.width/2,66);
    cx.fillStyle='#E8871E';cx.fillText(RES.Psw==null?'n/d':fmtP(RES.Psw),cv.width/2,102);
    cx.fillStyle='#FFB703';cx.fillText(RES.Ptot==null?'n/d':fmtP(RES.Ptot),cv.width/2,138);
  }
  medidorBox.tex.needsUpdate=true;
}
function drawPwmScreen(){
  const cx=pwmBox.cx,cv=pwmBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#08120f';cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='#4FD1C5';cx.font='bold 14px monospace';cx.textAlign='center';
  cx.fillText('D='+Dpct.toFixed(0)+'%  ·  fsw='+fmtHz(curFsw()),cv.width/2,22);
  const x0=16,x1=cv.width-16,yHi=48,yLo=118,per=(x1-x0)/2.4;
  cx.strokeStyle='#EAF4F1';cx.lineWidth=2.5;
  cx.beginPath();
  let x=x0,high=true,n=0;
  cx.moveTo(x,yLo);
  while(x<x1&&n<3){
    const seg=per*(high?Dpct/100:1-Dpct/100);
    const y=high?yHi:yLo;
    cx.lineTo(x,y);
    x=Math.min(x+seg,x1);
    cx.lineTo(x,y);
    if(high)n++;
    high=!high;
  }
  cx.stroke();
  pwmBox.tex.needsUpdate=true;
}
function refreshBenchDyn(){
  drawFuenteScreen();drawMedidorScreen();drawPwmScreen();
  if(mosfetG.userData.bodyMesh){
    const hex=parseInt(curColor().slice(1),16);
    mosfetG.userData.bodyMesh.material=std({color:hex,roughness:0.4,metalness:0.15});
  }
}

// ===== Sección 7: HUD + panel =====
const devBtnsHtml=Object.keys(DEVS).map(function(k){
  const d=DEVS[k];
  return '<button class="b'+(k===devKey?' on':'')+'" style="flex:1 0 100%" id="dev_'+k+'">'+d.name+'</button>';
}).join('');
const vBtnsHtml=V_VALS.map(function(v,i){return '<button class="b'+(i===Vidx?' on':'')+'" style="flex:1 0 18%" id="v_'+i+'">'+v+' V</button>';}).join('');

document.getElementById('hud').innerHTML=`
  <div class="eyebrow">D2 · Semiconductores — Práctica d2-10</div>
  <h2>Evalúa Pérdidas de un MOSFET de Potencia en PWM</h2>
  <p>Cuando un MOSFET conmuta una carga en PWM, no solo disipa calor mientras está "encendido" (pérdida de conducción, la misma resistencia RDS(on) que viste en la práctica anterior) — también disipa energía en cada transición de encendido/apagado (pérdida de conmutación), y esa segunda pérdida crece con la frecuencia de conmutación fsw. En mecanica-4 elegiste una fsw "razonable" para un inversor trifásico de forma solo cualitativa; aquí vas a cuantificar exactamente esa disyuntiva y encontrar el punto donde ambas pérdidas se igualan.</p>
  <div class="formula">
    Pcond=D·I²·RDS(on) &nbsp;·&nbsp; Psw=½·V·I·fsw·(tr+tf) &nbsp;·&nbsp; Ptot=Pcond+Psw<br>
    Frecuencia de cruce (Pcond=Psw): fsw*=2·D·I·RDS(on) / (V·(tr+tf))
  </div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Pcond (plana, no depende de fsw)</div>
    <div class="li"><span class="dot" style="background:#E8871E"></span>Psw (crece linealmente con fsw)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Ptot = Pcond+Psw &nbsp;/&nbsp; punto de operación actual</div>
    <div class="li"><span class="dot" style="background:#d23b3b"></span>Ptot máximo de catálogo (línea de referencia, no un límite físico modelado dinámicamente)</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> Pérdida de conducción Pcond=D·I²·RDS(on) (RDS(on) de catálogo, ponderada por el ciclo de trabajo D), pérdida de conmutación Psw=½·V·I·fsw·(tr+tf) con tr+tf tomado directo de hoja de datos a la condición de prueba del fabricante (IRF540N: 70 ns @VDD=50V/ID=16A/RG=5.1Ω — IRLZ44N: 99 ns @VDD=28V/ID=25A/RG=3.4Ω), Ptot=Pcond+Psw, y la frecuencia de cruce fsw*=2·D·I·RDS(on)/(V·(tr+tf)) — todo resuelto en forma cerrada.<br>
  <span class="no">NO:</span> Dependencia de tr/tf con la corriente de disparo de TU circuito de compuerta (el simulador usa el tr+tf medido por el fabricante a SU condición de prueba fija, no el de tu driver — ese acoplamiento es el tema de la práctica hermana d2-09), pérdidas por recuperación inversa de diodos de rueda libre, energía de descarga de capacitancias no lineales (Coss), ni el efecto de la temperatura de unión sobre RDS(on) (que en un MOSFET real aumenta con la temperatura, así que la Pcond de este simulador es una cota inferior optimista). El 2N7000 no tiene tr/tf publicado por ningún fabricante consultado: para ese dispositivo el simulador solo calcula Pcond y lo declara explícitamente en vez de inventar una cifra de Psw.</div>
  <div class="src">Ref: IR/Infineon PD-94812 (IRF540N) · International Rectifier PD-9.1346B (IRLZ44N) · ON Semiconductor Rev.5 y Fairchild 1995 (2N7000, sin tr/tf publicado). Práctica hermana de MEC-04 (Inversor Trifásico de Potencia), que elige fsw de forma solo cualitativa.</div>`;

document.getElementById('panel').innerHTML=`
  <h4>MOSFET en PWM · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_predice">🔮 Predice</button>
    <button class="b" id="m_barrido">📉 Barrido</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>

  <div style="font-size:12px;color:#8FB3AC;margin:6px 0 4px">Transistor</div>
  <div class="btns">${devBtnsHtml}</div>

  <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">Bus V</div>
  <div class="btns">${vBtnsHtml}</div>

  <div style="margin-top:10px">
    <label style="font-size:12px;color:#8FB3AC">Corriente de carga I: <span id="vI">—</span></label><br>
    <input type="range" id="sI" min="0" max="1" step="0.001" value="0.5" style="width:100%">
  </div>
  <div style="margin-top:8px">
    <label style="font-size:12px;color:#8FB3AC">Ciclo de trabajo D: <span id="vD">50</span> %</label><br>
    <input type="range" id="sD" min="5" max="95" step="1" value="50" style="width:100%">
  </div>
  <div style="margin-top:8px">
    <label style="font-size:12px;color:#8FB3AC">Frecuencia de conmutación fsw: <span id="vFsw">50 kHz</span></label><br>
    <input type="range" id="sFsw" min="0" max="300000" step="1000" value="50000" style="width:100%">
  </div>

  <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;color:#EAF4F1">
    <div>Pcond: <span id="outPcond">—</span></div>
    <div>Psw: <span id="outPsw">—</span></div>
    <div style="grid-column:1/3">Ptot: <span id="outPtot">—</span></div>
    <div style="grid-column:1/3">fsw de cruce (Pcond=Psw): <span id="outFx">—</span></div>
    <div style="grid-column:1/3;color:#d23b3b" id="teleWarn"></div>
  </div>

  <div id="predBox" style="display:none;margin-top:10px">
    <div id="predAsk" style="font-size:12px;color:#EAF4F1;margin-bottom:6px"></div>
    <div id="predAnswerBox"></div>
    <div id="predResult" style="font-size:12px;margin-top:6px"></div>
  </div>

  <div id="barBox" style="display:none;margin-top:10px">
    <button class="b" id="btnSweep" style="width:100%">▶ Barrer fsw (0 → 300 kHz)</button>
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

// ===== Sección 8: Lógica =====
const MODES=['explora','predice','barrido','reto'];
const MODE_META={
  explora:{label:'Explora',emoji:'🔍'},
  predice:{label:'Predice',emoji:'🔮'},
  barrido:{label:'Barrido',emoji:'📉'},
  reto:{label:'Reto',emoji:'🎯'},
};
const MISIONES={
  explora:'Ajusta dispositivo, bus V, corriente I, ciclo D y frecuencia fsw, y observa cómo se reparten Pcond y Psw sobre la gráfica y el banco 3D.',
  predice:'Antes de revelar el medidor, predice qué pérdida domina o el valor de Ptot para la fsw actual.',
  barrido:'Barre fsw de 0 a 300 kHz (con V/I/D fijos) y observa cómo crece Psw mientras Pcond se mantiene plana.',
  reto:'Encuentra la fsw máxima que mantiene a Ptot por debajo del máximo de catálogo del dispositivo.',
};

function setMode(k){
  mode=k;
  el('p_mode').textContent=MODE_META[k].label;
  el('p_mision').textContent=MISIONES[k];
  ['m_explora','m_predice','m_barrido','m_reto'].forEach(function(id){el(id).classList.toggle('on',id==='m_'+k);});
  el('predBox').style.display=k==='predice'?'block':'none';
  el('barBox').style.display=k==='barrido'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  syncFswRange();
  if(k==='reto'){newReto();}
  if(k==='predice'){genPredice();}
  if(k==='barrido'){sweepMarkerF=null;}
  refreshAll();
}
function syncCtrlBtns(){
  Object.keys(DEVS).forEach(function(k){el('dev_'+k).classList.toggle('on',k===devKey);});
  V_VALS.forEach(function(v,i){el('v_'+i).classList.toggle('on',i===Vidx);});
  const dev=curDev();
  el('sI').min=dev.idMax*0.05;
  el('sI').max=dev.idMax;
  el('sI').step=Math.max(dev.idMax/200,0.0001);
  el('sI').value=Iamp;
  el('vI').textContent=fmtI(Iamp);
  el('sD').value=Dpct;
  el('vD').textContent=Dpct.toFixed(0);
  el('sFsw').value=fswHz;
  el('vFsw').textContent=fmtHz(fswHz);
}
function selDevice(k){
  devKey=k;
  Iamp=midI(DEVS[k]);
  syncCtrlBtns();onChange();
}
function selV(i){Vidx=i;syncCtrlBtns();onChange();}
function onIInput(v){Iamp=parseFloat(v);el('vI').textContent=fmtI(Iamp);onChange();}
function onDInput(v){Dpct=parseFloat(v);el('vD').textContent=Dpct.toFixed(0);onChange();}
function onFswInput(v){fswHz=parseFloat(v);el('vFsw').textContent=fmtHz(fswHz);onChange();}

function genPredice(){
  const dev=curDev();
  if(dev.trPlusTf==null){
    predType='C';
  }else{
    predType=Math.random()<0.5?'A':'B';
  }
  const f=predType==='C'?curFsw():Math.random()*300000;
  PRED={f:f,V:curV(),I:curI(),D:curD(),devKey:devKey};
  predSolved=false;predRevealed=false;
  el('predAsk').textContent=predAskText();
  if(predType==='A'){
    el('predAnswerBox').innerHTML='<div class="btns"><button class="b" id="pa_cond">Domina Pcond</button><button class="b" id="pa_sw">Domina Psw</button><button class="b" id="pa_eq">Aprox. iguales</button></div>';
  }else if(predType==='B'){
    el('predAnswerBox').innerHTML='<label style="font-size:12px;color:#8FB3AC">Ptot estimada (W): <input type="number" id="pa_ptot" step="0.01" style="width:90px"></label> <button class="b" id="pa_check">Verificar</button>';
  }else{
    el('predAnswerBox').innerHTML='<label style="font-size:12px;color:#8FB3AC">Pcond estimada (W): <input type="number" id="pa_pcond" step="0.001" style="width:90px"></label> <button class="b" id="pa_check">Verificar</button>';
  }
  el('predResult').textContent='';
  wirePredButtons();
}
function predAskText(){
  const dev=curDev();
  if(predType==='A')return 'Con V='+fmtV(PRED.V)+', I='+fmtI(PRED.I)+', D='+(PRED.D*100).toFixed(0)+'% y fsw='+fmtHz(PRED.f)+' sorteada al azar, ¿qué pérdida domina en '+dev.name+': conducción o conmutación?';
  if(predType==='B')return 'Con V='+fmtV(PRED.V)+', I='+fmtI(PRED.I)+', D='+(PRED.D*100).toFixed(0)+'% y fsw='+fmtHz(PRED.f)+' sorteada al azar, ¿cuánto vale Ptot en '+dev.name+'?';
  return dev.name+' no tiene tr/tf publicado, así que fsw no afecta nada — con I='+fmtI(PRED.I)+' y D='+(PRED.D*100).toFixed(0)+'%, ¿cuánto vale Pcond?';
}
function wirePredButtons(){
  if(predType==='A'){
    ['cond','sw','eq'].forEach(function(k){
      const b=el('pa_'+k);
      if(b)b.addEventListener('click',function(){checkPredice(k);});
    });
  }else{
    const b=el('pa_check');
    if(b)b.addEventListener('click',function(){
      if(predType==='B'){
        const v=parseFloat(el('pa_ptot').value)||0;
        checkPredice(null,{ptot:v});
      }else{
        const v=parseFloat(el('pa_pcond').value)||0;
        checkPredice(null,{pcond:v});
      }
    });
  }
}
function checkPredice(kind,val){
  if(!PRED||predRevealed)return;
  const dev=DEVS[PRED.devKey];
  const r=pLoss(dev,PRED.V,PRED.I,PRED.D,PRED.f);
  let ok=false,msg='';
  if(predType==='A'){
    const ratio=r.Pcond/(r.Psw||1e-12);
    const real=ratio>1.15?'cond':(ratio<0.87?'sw':'eq');
    ok=kind===real;
    msg=ok?'¡Correcto! Pcond='+fmtP(r.Pcond)+' vs Psw='+fmtP(r.Psw)+'.':'No — con esos valores Pcond='+fmtP(r.Pcond)+' y Psw='+fmtP(r.Psw)+', domina '+(real==='cond'?'conducción':(real==='sw'?'conmutación':'ninguna claramente, están muy cerca'))+'.';
  }else if(predType==='B'){
    ok=Math.abs(val.ptot-r.Ptot)<=Math.max(r.Ptot*0.15,0.02);
    msg=(ok?'¡Correcto! ':'No exactamente — ')+'Ptot real = '+fmtP(r.Ptot)+' (Pcond='+fmtP(r.Pcond)+' + Psw='+fmtP(r.Psw)+').';
  }else{
    ok=Math.abs(val.pcond-r.Pcond)<=Math.max(r.Pcond*0.15,0.005);
    msg=(ok?'¡Correcto! ':'No exactamente — ')+'Pcond real = '+fmtP(r.Pcond)+' (fsw es irrelevante: Psw no es computable para '+dev.name+').';
  }
  predSolved=ok;predRevealed=true;
  el('predResult').textContent=msg;
  el('predResult').style.color=ok?'#3fae3f':'#d23b3b';
  Vidx=V_VALS.indexOf(PRED.V);Iamp=PRED.I;Dpct=PRED.D*100;fswHz=PRED.f;devKey=PRED.devKey;
  syncCtrlBtns();onChange();
  synth.beep(ok?880:220,.08,.06);
}

function syncFswRange(){
  let max=300000;
  if(mode==='reto'){
    const dev=curDev();
    if(dev.trPlusTf!=null){
      const pc=curPcond();
      if(pc<dev.ptot){
        const fMaxReal=(dev.ptot-pc)/(0.5*curV()*curI()*dev.trPlusTf);
        const fPhysCeil=1/dev.trPlusTf;
        max=Math.min(Math.max(300000,fMaxReal*1.3),fPhysCeil);
      }
    }
  }
  el('sFsw').max=max;
  el('sFsw').step=Math.max(Math.round(max/300),1);
  if(fswHz>max){
    fswHz=max;
    el('sFsw').value=fswHz;
    el('vFsw').textContent=fmtHz(fswHz);
  }
}
function refreshRetoText(){
  if(mode!=='reto')return;
  const dev=curDev();
  if(dev.trPlusTf==null){
    el('retoAsk').textContent=dev.name+' no tiene tr/tf publicado por el fabricante, así que Psw no es computable y este reto no aplica — elige IRF540N o IRLZ44N para intentarlo.';
    el('btnReto').style.display='none';
    return;
  }
  el('btnReto').style.display='block';
  const pc=curPcond();
  if(pc>=dev.ptot){
    el('retoAsk').textContent='Con V='+fmtV(curV())+', I='+fmtI(curI())+' y D='+Dpct.toFixed(0)+'%, Pcond ya vale '+fmtP(pc)+' — por sí sola excede el máximo de catálogo ('+fmtP(dev.ptot)+') sin sumar nada de Psw. No existe ninguna fsw que salve este diseño: baja I o D primero.';
  }else{
    el('retoAsk').textContent='Con V='+fmtV(curV())+', I='+fmtI(curI())+', D='+Dpct.toFixed(0)+'% y '+dev.name+' (Ptot máx catálogo '+fmtP(dev.ptot)+'), sube fsw con el deslizador hasta el límite más alto que NO exceda Ptot máx. Presiona Verificar cuando creas tener el máximo.';
  }
}
function newReto(){
  RETO=true;
  retoSolved=false;
  el('retoResult').textContent='';
  refreshRetoText();
}
function checkReto(){
  const dev=curDev();
  if(dev.trPlusTf==null)return;
  const pc=curPcond();
  if(pc>=dev.ptot){
    el('retoResult').textContent='Este diseño no tiene solución válida — baja I o D para que Pcond quede por debajo de Ptot máx antes de buscar una fsw.';
    el('retoResult').style.color='#d23b3b';
    return;
  }
  const fMaxReal=(dev.ptot-pc)/(0.5*curV()*curI()*dev.trPlusTf);
  const f=curFsw();
  const tol=Math.max(fMaxReal*0.1,1000);
  const ok=f<=fMaxReal&&f>=fMaxReal-tol;
  retoSolved=ok;
  let msg;
  if(f>fMaxReal){
    msg='Muy alto — a fsw='+fmtHz(f)+' Ptot ya excede el máximo de catálogo. El límite real es fsw≈'+fmtHz(fMaxReal)+'.';
  }else if(ok){
    msg='¡Diseño válido! fsw='+fmtHz(f)+' está dentro del 10% del límite real (fsw máx≈'+fmtHz(fMaxReal)+').';
  }else{
    msg='Válido pero conservador — fsw='+fmtHz(f)+' deja margen de sobra. El límite real más ajustado es fsw≈'+fmtHz(fMaxReal)+'.';
  }
  el('retoResult').textContent=msg;
  el('retoResult').style.color=ok?'#3fae3f':(f>fMaxReal?'#d23b3b':'#E8871E');
  synth.beep(ok?880:(f>fMaxReal?220:500),.08,.06);
}

async function runSweep(){
  if(sweeping)return;
  sweeping=true;
  const dev=curDev();
  const N=17;
  for(let k=0;k<N;k++){
    sweepMarkerF=300000*k/(N-1);
    drawBoard();
    await sleep(45);
  }
  sweepMarkerF=null;
  sweeping=false;
  if(dev.trPlusTf==null){
    showToast('Psw no disponible para '+dev.name+' (sin tr/tf de catálogo) — Pcond se mantiene plana en '+fmtP(curPcond())+' sin importar fsw.');
  }else{
    const fx=crossoverFsw();
    showToast('Frecuencia de cruce (Pcond=Psw): fsw* ≈ '+fmtHz(fx)+'. Por debajo domina conducción; por encima, conmutación.');
  }
  drawBoard();
}

function updateTele(){
  if(!RES)return;
  const dev=curDev();
  const hidden=(mode==='predice'&&!predRevealed);
  if(hidden){
    el('outPcond').textContent='¿?';
    el('outPsw').textContent='¿?';
    el('outPtot').textContent='¿?';
    el('outFx').textContent='¿?';
    el('teleWarn').textContent='';
    return;
  }
  el('outPcond').textContent=fmtP(RES.Pcond);
  el('outPsw').textContent=RES.Psw==null?'no disponible':fmtP(RES.Psw);
  el('outPtot').textContent=RES.Ptot==null?'no disponible (falta Psw)':fmtP(RES.Ptot);
  el('outFx').textContent=RES.fCross==null?'no disponible':fmtHz(RES.fCross);
  const warns=[];
  if(overVoltage())warns.push('⚠ V ('+fmtV(curV())+') excede VDS máx de catálogo ('+dev.vdsMax+' V).');
  if(overPower())warns.push('⚠ '+(RES.Ptot==null?'Pcond':'Ptot')+' excede el máximo de catálogo ('+fmtP(dev.ptot)+').');
  el('teleWarn').textContent=warns.join(' ');
}
function updateReport(){
  if(mode==='predice'&&!predRevealed){el('report').textContent='Predicción pendiente — revela para ver el informe.';return;}
  if(!RES)return;
  const dev=curDev();
  let txt='V='+fmtV(curV())+' · I='+fmtI(curI())+' · D='+Dpct.toFixed(0)+'% · fsw='+fmtHz(curFsw())+' · Pcond='+fmtP(RES.Pcond);
  txt+=RES.Psw==null?' · Psw: no disponible (sin tr/tf de catálogo para '+dev.name+')':' · Psw='+fmtP(RES.Psw)+' · Ptot='+fmtP(RES.Ptot);
  el('report').textContent=txt;
}
function onChange(){
  RES=computeRES();
  syncFswRange();
  refreshRetoText();
  refreshAll();
}
function refreshAll(){
  drawBoard();
  refreshBenchDyn();
  updateTele();
  updateReport();
}

const QUIZ=[
  {q:'¿De qué depende la pérdida de conducción Pcond de un MOSFET en PWM?',opts:['Solo de fsw','De RDS(on), la corriente de carga y el ciclo de trabajo D','Solo del voltaje de bus V'],a:1},
  {q:'¿Por qué la pérdida de conmutación Psw crece con fsw?',opts:['Porque RDS(on) cambia con la frecuencia','Porque el MOSFET pasa por más transiciones de encendido/apagado por segundo, cada una con su propia energía disipada','Porque V baja al subir fsw'],a:1},
  {q:'En la frecuencia de cruce fsw*, ¿qué es cierto?',opts:['Psw=0','Pcond=Psw','Ptot es mínimo'],a:1},
  {q:'El 2N7000 no tiene tr/tf publicado por su fabricante. ¿Qué hace este simulador al respecto?',opts:['Inventa un valor típico razonable','Solo calcula Pcond y declara explícitamente que Psw no es computable','Usa el tr/tf del IRF540N como aproximación'],a:1},
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
  if(act==='load3d')showToast('Carga genérica — representa cualquier carga en serie con el MOSFET. Solo importa la corriente I que circula por ella.');
  else if(act==='mosfet3d')showToast(curDev().name+' — RDS(on)='+fmtRds(curDev().rdsOn)+', Ptot máx catálogo='+fmtP(curDev().ptot)+'.');
  else if(act==='src3d')showToast('Bus V = '+fmtV(curV())+' (fuente ideal, sin resistencia interna).');
  else if(act==='medidor3d'){
    if(!RES)return;
    showToast('Pcond='+fmtP(RES.Pcond)+(RES.Psw==null?' · Psw no disponible':' · Psw='+fmtP(RES.Psw)+' · Ptot='+fmtP(RES.Ptot)));
  }
  else if(act==='pwm3d')showToast('Señal PWM de compuerta: D='+Dpct.toFixed(0)+'% a fsw='+fmtHz(curFsw())+'.');
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
  onDInput(80);await sleep(800);
  onIInput(curDev().idMax*0.8);await sleep(800);
  selDevice('n2n7000');await sleep(1200);
  selDevice('irf540n');await sleep(800);
  await runSweep();
  await sleep(600);
  setMode('predice');await sleep(1200);
  setMode('reto');
}

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

el('m_explora').addEventListener('click',function(){setMode('explora');});
el('m_predice').addEventListener('click',function(){setMode('predice');});
el('m_barrido').addEventListener('click',function(){setMode('barrido');});
el('m_reto').addEventListener('click',function(){setMode('reto');});
Object.keys(DEVS).forEach(function(k){el('dev_'+k).addEventListener('click',function(){selDevice(k);});});
V_VALS.forEach(function(v,i){el('v_'+i).addEventListener('click',function(){selV(i);});});
el('sI').addEventListener('input',function(e){onIInput(e.target.value);});
el('sD').addEventListener('input',function(e){onDInput(e.target.value);});
el('sFsw').addEventListener('input',function(e){onFswInput(e.target.value);});
el('btnSweep').addEventListener('click',runSweep);
el('btnReto').addEventListener('click',checkReto);
el('btnAuto').addEventListener('click',runAuto);

onChange();
S.setAnimate(function(){});
newReto();
buildQuiz();
syncCtrlBtns();
S.start();
setMode('explora');

window.__labDebug={
  state:function(){return {devKey:devKey,Vidx:Vidx,Iamp:Iamp,Dpct:Dpct,fswHz:fswHz,mode:mode};},
  res:function(){return RES;},
  pred:function(){return {PRED:PRED,predSolved:predSolved,predRevealed:predRevealed,predType:predType};},
  reto:function(){return {RETO:RETO,retoSolved:retoSolved};},
  sweep:function(){return {markerF:sweepMarkerF};},
  curPcond:curPcond,curPsw:curPsw,curPtot:function(){return computeRES().Ptot;},crossoverFsw:crossoverFsw,
  setDevice:selDevice,
  setV:selV,
  setI:function(v){Iamp=v;onChange();},
  setD:function(v){Dpct=v;onChange();},
  setFsw:function(v){fswHz=v;onChange();},
  mode:function(){return mode;},
  setMode:setMode,
  checkPredice:checkPredice,
  newPredice:genPredice,
  checkReto:checkReto,
  newReto:newReto,
  sweepNow:runSweep,
  boardClick:boardClick,
};
