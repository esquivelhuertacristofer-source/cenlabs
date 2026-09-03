/* ============================================================
   LAB — Fuente de Alimentación Lineal Regulada
   ============================================================
   CONTRATO DE FIDELIDAD
   SÍ modela: onda de línea CA con variación realista de tensión (114 a
   140V, nominal 127V/60Hz México), transformador ideal (relación fija
   por Vsec de catálogo), puente rectificador de silicio (modelo de
   Shockley de DOS uniones en serie — mismos parámetros Is/n que el banco
   de rectificación d2-02: Is=8.4e-10 A, n=1.85), integración EXACTA por
   Runge-Kutta 4 del capacitor de filtro contra una carga de corriente
   casi constante (el regulador + su carga), caída de "dropout" del
   regulador lineal Vdo=Vdo0+Vdo_k·Iout, limitación de corriente con
   "foldback" ilustrativo, disipación de potencia EXACTA promediada en el
   periodo Pd=(Vfiltro−Vout)·Iout+Vfiltro·Iq, y temperatura de unión en
   estado ESTABLE Tj=Ta+Pd·θtotal contra Tj,max≈125°C (regulador tipo
   LM7805, hoja de datos TI SNOSBR7).
   NO modela: tiempo de recuperación inversa de los diodos (trr — cifra
   NO confiable para la familia 1N400x/DB10x, se omite por completo),
   saturación de núcleo o armónicos del transformador, dinámica térmica
   TRANSITORIA real (solo estado estable), tolerancias de componentes,
   apagado térmico real del regulador, ruido/EMI de conmutación, ni el
   valor numérico preciso de la corriente de recarga pico de los diodos
   (solo se reporta su tendencia cualitativa al variar C).
   Fuentes: LM78XX (Texas Instruments, lit. SNOSBR7) · 1N4001-4007
   (ON Semiconductor Rev.13; Diodes Inc. DS28002) · DB101-DB107 (Diodes
   Inc. DS21211) · Boylestad & Nashelsky, "Electronic Devices and Circuit
   Theory" · Sedra & Smith, "Microelectronic Circuits" · JCGM 200:2012.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.2,2.4,7.4],target:[0.4,1.25,0.05],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ---------- modelo físico ---------- */
const KB=1.380649e-23, QE=1.602176634e-19, TNOM=300.15;
const VTN=KB*TNOM/QE;
const DIODE={name:'Puente de silicio', Is:8.4e-10, n:1.85, ifAvg:1.0, ifsm:30, vrrm:1000};

const XFMR=[{vsec:6},{vsec:9},{vsec:12},{vsec:15},{vsec:18}];
const XLBL=XFMR.map(x=>x.vsec+'V');
const CVALS=[100e-6,220e-6,470e-6,1000e-6,2200e-6,4700e-6];
const CLBL=['100µ','220µ','470µ','1000µ','2200µ','4700µ'];
const FREQS=[50,60];
const FLBL=['50 Hz','60 Hz (MX)'];
const HS=[
  {theta:80,name:'Sin disipador'},
  {theta:58,name:'PCB, buen cobre'},
  {theta:30,name:'Disipador pequeño'},
  {theta:12,name:'Disipador grande'},
];
const HLBL=HS.map(h=>h.name);
const TA_OPTS=[25,40];
const TALBL=['25°C','40°C'];

const REG={vout:5.0, iqTyp:0.005, iqMax:0.008, vdo0:1.7, vdoK:0.3, tjMax:125, tjWarn:100, ilimTyp:1.2, ilimCollapse:1.35};

function idExpl2(d,v){ return d.Is*Math.expm1(v/(2*d.n*VTN)); }
function vinInst(t,vrms,freq){ return Math.SQRT2*vrms*Math.sin(2*Math.PI*freq*t); }
function vLineToVsecRms(vsecNom,vline){ return vsecNom*(vline/127); }

function actualIout(ioutReq){
  if(ioutReq<=REG.ilimTyp) return ioutReq;
  if(ioutReq>=REG.ilimCollapse) return 0;
  const frac=(ioutReq-REG.ilimTyp)/(REG.ilimCollapse-REG.ilimTyp);
  return REG.ilimTyp*(1-frac);
}

const STEPS_PER_PERIOD=480, MAXP=60;

function simulate(vsecNom,vline,freq,c,ioutReq,iqSel){
  const vsecRms=vLineToVsecRms(vsecNom,vline);
  const iq=iqSel==='max'?REG.iqMax:REG.iqTyp;
  const ioutAct=actualIout(ioutReq);
  const vdoAct=REG.vdo0+REG.vdoK*ioutAct;
  const T=1/freq, N=STEPS_PER_PERIOD, dt=T/N;
  function iloadTotal(v){ const taper=Math.min(1,Math.max(0,v/0.3)); return (ioutAct+iq)*taper; }
  function deriv(t,v){ const va=Math.abs(vinInst(t,vsecRms,freq)); const id=idExpl2(DIODE,va-v); return (id-iloadTotal(v))/c; }
  let v=Math.max(0,Math.SQRT2*vsecRms-1.6-vdoAct);
  let t=0, prevVdc=null, converged=false, samples=[];
  for(let p=0;p<MAXP;p++){
    samples=[]; let sum=0;
    for(let k=0;k<N;k++){
      const k1=deriv(t,v);
      const k2=deriv(t+dt/2,v+dt/2*k1);
      const k3=deriv(t+dt/2,v+dt/2*k2);
      const k4=deriv(t+dt,v+dt*k3);
      v=Math.max(0,v+dt/6*(k1+2*k2+2*k3+k4));
      t+=dt;
      samples.push({t,v});
      sum+=v;
    }
    const vdcP=sum/N;
    if(prevVdc!==null && Math.abs(vdcP-prevVdc)<=0.002*Math.max(Math.abs(vdcP),0.05)){ converged=true; break; }
    prevVdc=vdcP;
  }
  let vMax=-Infinity, vMin=Infinity, vSum=0;
  for(const s of samples){ if(s.v>vMax)vMax=s.v; if(s.v<vMin)vMin=s.v; vSum+=s.v; }
  const vFilterAvg=vSum/samples.length;
  const vFilterRpp=vMax-vMin;

  const voutSamples=samples.map(s=>({t:s.t, v:Math.max(0,Math.min(REG.vout,s.v-vdoAct))}));
  let voutMax=-Infinity, voutMin=Infinity, voutSum=0, dropoutCount=0;
  for(const s of voutSamples){ if(s.v>voutMax)voutMax=s.v; if(s.v<voutMin)voutMin=s.v; voutSum+=s.v; if(s.v<REG.vout-0.005)dropoutCount++; }
  const voutAvg=voutSum/voutSamples.length;
  const voutRpp=voutMax-voutMin;
  const dropoutFrac=dropoutCount/voutSamples.length;

  let pdSum=0;
  for(let i=0;i<samples.length;i++){ pdSum += (samples[i].v-voutSamples[i].v)*ioutAct + samples[i].v*iq; }
  const pdExact=pdSum/samples.length;
  const pdFormula=(vFilterAvg-REG.vout)*ioutAct+vFilterAvg*iq;
  const headroomMargin=(vMin-vdoAct)-REG.vout;

  return {vsecRms,iq,ioutReq,ioutAct,vdoAct,samples,voutSamples,vFilterAvg,vFilterRpp,vMax,vMin,
    voutAvg,voutRpp,voutMax,voutMin,dropoutFrac,pdExact,pdFormula,headroomMargin,converged,T};
}

function thermal(pd,theta,ta){ const tj=ta+pd*theta; return {tj, warn:tj>REG.tjWarn, bad:tj>=REG.tjMax}; }

/* ---------- estado ---------- */
let mode='explora';
let xIdx=2, freqIdx=1, Cidx=3, hsIdx=1, taIdx=0;
let Vline=127, Iout=0.3;
let RES=null, solved=false;
let filterRevealed=false, voutRevealed=false;
let PRED=null, predRevealed=false, predSolved=false;
let RETO=null, retoSolved=false;
let SWEEP=[], sweepMode='iout', sweeping=false, autoRunning=false;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const el=id=>document.getElementById(id);

const curX=()=>XFMR[xIdx];
const curF=()=>FREQS[freqIdx];
const curC=()=>CVALS[Cidx];
const curHS=()=>HS[hsIdx];
const curTA=()=>TA_OPTS[taIdx];
function iqSelActive(){ return mode==='reto'?'max':'typ'; }

function fmtV(v){ const av=Math.abs(v); if(av<1) return (v*1000).toFixed(0)+' mV'; return v.toFixed(2)+' V'; }
function fmtI(i){ const ai=Math.abs(i); if(ai<1e-3) return (i*1e6).toFixed(0)+' µA'; if(ai<1) return (i*1000).toFixed(1)+' mA'; return i.toFixed(3)+' A'; }
function fmtC(c){ return (c*1e6).toFixed(0)+' µF'; }
function fmtP(p){ const ap=Math.abs(p); if(ap<1) return (p*1000).toFixed(0)+' mW'; return p.toFixed(2)+' W'; }
function fmtT(t){ return t.toFixed(1)+' °C'; }

function genPredice(){
  const stressed=Math.random()<0.4;
  xIdx = stressed ? (Math.random()<0.6?0:1) : Math.floor(Math.random()*XFMR.length);
  freqIdx = Math.random()<0.5?0:1;
  Cidx = stressed ? Math.floor(Math.random()*2) : Math.floor(Math.random()*CVALS.length);
  hsIdx = stressed ? (Math.random()<0.6?0:1) : Math.floor(Math.random()*HS.length);
  taIdx = stressed && Math.random()<0.6 ? 1 : Math.floor(Math.random()*TA_OPTS.length);
  Vline = stressed ? 114+Math.random()*4 : 118+Math.random()*18;
  Iout = stressed ? 0.7+Math.random()*0.5 : 0.15+Math.random()*0.7;
  const res=simulate(curX().vsec,Vline,curF(),curC(),Iout,'typ');
  const th=thermal(res.pdExact,curHS().theta,curTA());
  PRED={xIdx,freqIdx,Cidx,hsIdx,taIdx,Vline,Iout,
    vsecRms:res.vsecRms, vFiltro:res.vFilterAvg, pd:res.pdExact,
    headroomOk:res.headroomMargin>=0, thermalSafe:!th.bad};
  predRevealed=false; predSolved=false;
}

function genReto(){
  const ioutTarget=0.2+Math.random()*0.6;
  RETO={ioutTarget, vline:114.3, ta:40, freqIdx:1};
  retoSolved=false;
}

/* ---------- materiales ---------- */
const std=o=>new THREE.MeshStandardMaterial(o);
const MAT={
  bench: std({color:0x0e1512,roughness:0.9,metalness:0.05}),
  frame: std({color:0x1c2b26,roughness:0.6,metalness:0.3}),
  pcb: std({color:0x0f2a22,roughness:0.75,metalness:0.1}),
  psu: std({color:0x2a3b36,roughness:0.5,metalness:0.4}),
  scope: std({color:0x111a17,roughness:0.4,metalness:0.5}),
  lead: std({color:0xc9c9c9,roughness:0.35,metalness:0.85}),
  trace: std({color:0xb5824a,roughness:0.4,metalness:0.7}),
  jackRed: std({color:0xd23b3b,roughness:0.4,metalness:0.3}),
  jackBlk: std({color:0x1a1a1a,roughness:0.4,metalness:0.3}),
  cableRed: std({color:0xb02c2c,roughness:0.55,metalness:0.05}),
  cableBlk: std({color:0x141414,roughness:0.55,metalness:0.05}),
  cap: std({color:0x2e6fe0,roughness:0.35,metalness:0.5}),
  xfmr: std({color:0x8a8a8a,roughness:0.45,metalness:0.6}),
  reg: std({color:0x1a1a1a,roughness:0.5,metalness:0.2}),
  regTab: std({color:0xb0b0b0,roughness:0.3,metalness:0.9}),
  hsFin: std({color:0xc7c7cf,roughness:0.3,metalness:0.85}),
  load: std({color:0x3a2e12,roughness:0.7,metalness:0.2}),
};

/* ---------- lienzo del esquema ---------- */
const bCv=document.createElement('canvas'); bCv.width=1024; bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv); bTex.colorSpace=THREE.SRGBColorSpace;

const PX0=130, PX1=940, WY=150, BY=250;

function line(c,x0,y0,x1,y1,col,w,dash){ c.strokeStyle=col; c.lineWidth=w||2; c.setLineDash(dash||[]); c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke(); c.setLineDash([]); }
function rr(c,x,y,w,h,r,fill,stroke,sw){ c.beginPath(); c.roundRect(x,y,w,h,r); if(fill){c.fillStyle=fill;c.fill();} if(stroke){c.strokeStyle=stroke;c.lineWidth=sw||1;c.stroke();} }
function diodeGlyph(c,cx,cy,ang,color,label){
  c.save(); c.translate(cx,cy); c.rotate(ang);
  c.strokeStyle=color; c.fillStyle=color; c.lineWidth=2;
  c.beginPath(); c.moveTo(-8,-8); c.lineTo(-8,8); c.lineTo(8,0); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(8,-9); c.lineTo(8,9); c.stroke();
  c.restore();
  if(label){ c.fillStyle='#9fb8b0'; c.font='11px system-ui'; c.textAlign='center'; c.fillText(label,cx,cy+22); }
}
function acSourceGlyph(c,cx,cy,r){
  c.strokeStyle='#7fa89e'; c.lineWidth=2; c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.stroke();
  c.beginPath(); c.moveTo(cx-r*0.55,cy);
  for(let i=0;i<=20;i++){ const xx=cx-r*0.55+r*1.1*i/20; const yy=cy-Math.sin(i/20*Math.PI*2)*r*0.4; c.lineTo(xx,yy); }
  c.stroke();
}
function groundGlyph(c,x,y){
  line(c,x,y,x,y+14,'#3d5750',2);
  line(c,x-12,y+14,x+12,y+14,'#3d5750',2);
  line(c,x-7,y+20,x+7,y+20,'#3d5750',2);
  line(c,x-3,y+26,x+3,y+26,'#3d5750',2);
}
function capGlyph(c,cx,y0,y1,active,label){
  const cy=(y0+y1)/2;
  line(c,cx,y0,cx,cy-8,active?'#4FD1C5':'#3d5750',3);
  line(c,cx,cy+8,cx,y1,active?'#4FD1C5':'#3d5750',3);
  line(c,cx-18,cy-8,cx+18,cy-8,active?'#4FD1C5':'#3d5750',4);
  line(c,cx-18,cy+8,cx+18,cy+8,active?'#4FD1C5':'#3d5750',4);
  if(label){ c.fillStyle='#9fb8b0'; c.font='11px system-ui'; c.textAlign='center'; c.fillText(label,cx,y1+16); }
}
function transformerGlyph(c,cx,cyTop,cyBot,color){
  const n=4, step=(cyBot-cyTop)/n;
  c.strokeStyle=color; c.lineWidth=2.5;
  c.beginPath(); c.moveTo(cx-6,cyTop-8); c.lineTo(cx-6,cyBot+8); c.stroke();
  c.beginPath(); c.moveTo(cx+6,cyTop-8); c.lineTo(cx+6,cyBot+8); c.stroke();
  c.beginPath();
  for(let i=0;i<n;i++){ const y0=cyTop+i*step, y1=y0+step; c.arc(cx-6,(y0+y1)/2,step/2-1,Math.PI/2,-Math.PI/2,true); }
  c.stroke();
  c.beginPath();
  for(let i=0;i<n;i++){ const y0=cyTop+i*step, y1=y0+step; c.arc(cx+6,(y0+y1)/2,step/2-1,-Math.PI/2,Math.PI/2,true); }
  c.stroke();
}
function regulatorGlyph(c,x,y,w,h,color,name){
  rr(c,x,y,w,h,6,'#1a2420',color,2);
  c.fillStyle='#EAF4F1'; c.font='bold 13px system-ui'; c.textAlign='center';
  c.fillText(name,x+w/2,y+h/2+5);
}
function currentLoadGlyph(c,cx,y0,y1,color,label){
  const cy=(y0+y1)/2, r=22;
  line(c,cx,y0,cx,cy-r,color,3);
  line(c,cx,cy+r,cx,y1,color,3);
  c.strokeStyle=color; c.lineWidth=3; c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.stroke();
  line(c,cx,cy-r+6,cx,cy+r-6,color,2.5);
  c.beginPath(); c.moveTo(cx,cy+r-6); c.lineTo(cx-5,cy+r-14); c.lineTo(cx+5,cy+r-14); c.closePath();
  c.fillStyle=color; c.fill();
  if(label){ c.fillStyle='#9fb8b0'; c.font='11px system-ui'; c.textAlign='center'; c.fillText(label,cx,y1+16); }
}
function drawBridgeDiamond(c,cx,cy,r,color){
  const T={x:cx,y:cy-r}, B={x:cx,y:cy+r}, L={x:cx-r,y:cy}, R={x:cx+r,y:cy};
  const mid=(p,q)=>({x:(p.x+q.x)/2,y:(p.y+q.y)/2});
  const ang=(p,q)=>Math.atan2(q.y-p.y,q.x-p.x);
  [[T,R],[R,B],[B,L],[L,T]].forEach(([p,q])=>{ const m=mid(p,q); diodeGlyph(c,m.x,m.y,ang(p,q),color,''); });
  c.strokeStyle='#3d5750'; c.lineWidth=1.5;
  c.beginPath(); c.moveTo(T.x,T.y); c.lineTo(R.x,R.y); c.lineTo(B.x,B.y); c.lineTo(L.x,L.y); c.closePath(); c.stroke();
  return {T,B,L,R};
}

let HIT=[];
function drawSchematic(c){
  HIT=[];
  const acX=180, xfmrX=300, bridgeX=460, capX=600, regX=740, loadX=880;
  const diaR=44;
  line(c,acX,WY,acX,BY,'#3d5750',2);
  acSourceGlyph(c,acX,(WY+BY)/2,26);
  c.fillStyle='#9fb8b0'; c.font='12px system-ui'; c.textAlign='center';
  c.fillText(Vline.toFixed(0)+'V CA · '+FLBL[freqIdx],acX,BY+22);
  HIT.push({x:acX,y:(WY+BY)/2,r:30,act:'src'});

  transformerGlyph(c,xfmrX,WY+16,BY-16,'#7fa89e');
  c.fillStyle='#9fb8b0'; c.fillText(curX().vsec+'V sec.',xfmrX,BY+22);
  HIT.push({x:xfmrX,y:(WY+BY)/2,r:34,act:'xfmr'});
  line(c,acX+26,WY+10,xfmrX-20,WY+10,'#3d5750',2);
  line(c,acX+26,BY-10,xfmrX-20,BY-10,'#3d5750',2);

  const bd=drawBridgeDiamond(c,bridgeX,(WY+BY)/2,diaR,'#d88a2e');
  c.fillStyle='#EAF4F1'; c.font='bold 11px system-ui'; c.fillText('PUENTE',bridgeX,BY+34);
  HIT.push({x:bridgeX,y:(WY+BY)/2,r:diaR+6,act:'bridge'});
  line(c,xfmrX+20,WY+16,bd.L.x-2,bd.L.y-2,'#3d5750',2);
  line(c,xfmrX+20,BY-16,bd.L.x-2,bd.L.y+2,'#3d5750',2);
  line(c,bd.R.x,bd.R.y,bd.R.x+18,bd.R.y,'#3d5750',1);

  line(c,bd.T.x,bd.T.y,capX,WY,'#3d5750',2);
  line(c,bd.B.x,bd.B.y,capX,BY,'#3d5750',2);
  capGlyph(c,capX,WY,BY,curC()>0,'C filtro '+fmtC(curC()));
  HIT.push({x:capX,y:(WY+BY)/2,r:30,act:'cap'});
  c.fillStyle='#4FD1C5'; c.font='12px system-ui'; c.fillText('V_filtro',capX,WY-14);

  line(c,capX,WY,regX-40,WY,'#3d5750',2);
  regulatorGlyph(c,regX-40,WY+36,80,BY-WY-72,'#7fa89e','7805');
  line(c,regX,WY+36,regX,WY,'#3d5750',2);
  line(c,regX,BY-36,regX,BY,'#3d5750',2);
  HIT.push({x:regX,y:(WY+BY)/2,r:44,act:'reg'});

  line(c,regX,WY,loadX,WY,'#3d5750',2);
  line(c,regX,BY,loadX,BY,'#3d5750',2);
  currentLoadGlyph(c,loadX,WY,BY,'#E8871E','I_out '+fmtI(Iout));
  HIT.push({x:loadX,y:(WY+BY)/2,r:30,act:'load'});
  c.fillStyle='#E8871E'; c.font='12px system-ui'; c.fillText('V_out',loadX,WY-14);

  groundGlyph(c,acX,BY);
  groundGlyph(c,capX,BY);
  groundGlyph(c,loadX,BY);
}
function drawLoadLabel(c){}

function vinTraceFor(res){ if(!res) return []; return res.samples.map(s=>({t:s.t, v:Math.abs(vinInst(s.t,res.vsecRms,curF()))})); }

function drawScopePane(c,y0,y1,title,vMax,traces,refLine){
  rr(c,PX0-14,y0-30,PX1-PX0+28,y1-y0+48,8,'#0a1512','#1E3A34',1);
  c.fillStyle='#EAF4F1'; c.font='bold 14px system-ui'; c.textAlign='left';
  c.fillText(title,PX0,y0-12);
  const rows=4;
  c.font='11px system-ui';
  for(let i=0;i<=rows;i++){
    const gy=y0+(y1-y0)*i/rows;
    c.strokeStyle='#16241f'; c.lineWidth=1;
    c.beginPath(); c.moveTo(PX0,gy); c.lineTo(PX1,gy); c.stroke();
    c.fillStyle='#6f8a83'; c.textAlign='right';
    c.fillText((vMax*(1-i/rows)).toFixed(1)+'V',PX0-8,gy+4);
  }
  function xy(t0,t1,tv,v){
    const px=PX0+(PX1-PX0)*(tv-t0)/Math.max(1e-9,(t1-t0));
    const py=y1-(y1-y0)*Math.min(1,Math.max(0,v/vMax));
    return [px,py];
  }
  for(const tr of traces){
    if(!tr.samples||!tr.samples.length) continue;
    const t0=tr.samples[0].t, t1=tr.samples[tr.samples.length-1].t;
    c.strokeStyle=tr.color; c.lineWidth=tr.width||2; c.setLineDash(tr.dash||[]);
    c.beginPath();
    tr.samples.forEach((p,i)=>{ const [px,py]=xy(t0,t1,p.t,p.v); if(i===0)c.moveTo(px,py); else c.lineTo(px,py); });
    c.stroke(); c.setLineDash([]);
  }
  if(refLine!=null){
    const py=y1-(y1-y0)*Math.min(1,Math.max(0,refLine/vMax));
    c.strokeStyle='#FFB703'; c.lineWidth=1.5; c.setLineDash([6,4]);
    c.beginPath(); c.moveTo(PX0,py); c.lineTo(PX1,py); c.stroke(); c.setLineDash([]);
    c.fillStyle='#FFB703'; c.textAlign='left'; c.font='11px system-ui';
    c.fillText(refLine.toFixed(2)+'V objetivo',PX1-130,py-6);
  }
  c.textAlign='right'; c.font='11px system-ui';
  traces.forEach((tr,i)=>{ c.fillStyle=tr.color; c.fillText('— '+tr.label, PX1, y0+14+i*15); });
}
function drawHiddenPane(c,y0,y1,msg){
  rr(c,PX0-14,y0-30,PX1-PX0+28,y1-y0+48,8,'#0a1512','#1E3A34',1);
  c.fillStyle='#7fa89e'; c.font='bold 15px system-ui'; c.textAlign='center';
  c.fillText('¿ ? — '+msg,(PX0+PX1)/2,(y0+y1)/2);
}

function drawBoard(){
  const c=bCx;
  c.clearRect(0,0,1024,768);
  const grad=c.createLinearGradient(0,0,0,768); grad.addColorStop(0,'#0c1613'); grad.addColorStop(1,'#060b09');
  c.fillStyle=grad; c.fillRect(0,0,1024,768);
  c.fillStyle='#EAF4F1'; c.font='bold 20px system-ui'; c.textAlign='left';
  c.fillText('Fuente lineal regulada · 7805',24,34);
  c.fillStyle='#7fa89e'; c.font='13px system-ui';
  c.fillText('Vlínea → Transformador → Puente → Filtro → Regulador → Carga',24,54);

  drawSchematic(c);

  const vMax1=RES?Math.max(6,Math.ceil((RES.vMax)*1.15)):16;
  const hideS1=(mode==='explora'&&!filterRevealed)||(mode==='predice'&&!predRevealed);
  if(hideS1){
    drawHiddenPane(c,300,452,'Osc. 1 · V puente / V_filtro — toca el capacitor para revelar');
  } else {
    drawScopePane(c,300,452,'Osc. 1 · V puente sin filtrar (punteado) / V_filtro (sólido)',vMax1,[
      {samples:vinTraceFor(RES), color:'#5f8078', width:2, dash:[5,4], label:'V puente'},
      {samples:RES?RES.samples:[], color:'#4FD1C5', width:3, label:'V_filtro'},
    ]);
  }
  const hideS2=(mode==='explora'&&!voutRevealed)||(mode==='predice'&&!predRevealed);
  if(hideS2){
    drawHiddenPane(c,490,642,'Osc. 2 · V_out regulado — toca el regulador para revelar');
  } else {
    drawScopePane(c,490,642,'Osc. 2 · V_out regulado',6,[
      {samples:RES?RES.voutSamples:[], color:'#E8871E', width:3, label:'V_out'},
    ],REG.vout);
  }
  bTex.needsUpdate=true;
}

function boardClick(u,v){
  const px=u*1024, py=(1-v)*768;
  let best=null, bd=Infinity;
  for(const h of HIT){ const d=Math.hypot(px-h.x,py-h.y); if(d<h.r && d<bd){ bd=d; best=h; } }
  if(!best) return;
  if(best.act==='src'){
    showToast('Fuente de CA de línea: '+Vline.toFixed(0)+'V @ '+FLBL[freqIdx]+'. En México la red nominal es 127V/60Hz, con variación real de hasta ±10%.');
  } else if(best.act==='xfmr'){
    showToast('Transformador reductor ideal: entrega '+curX().vsec+'V rms nominales en el secundario. Vs_rms escala con Vlínea: Vs = Vsec·(Vlínea/127).');
  } else if(best.act==='bridge'){
    showToast('Puente rectificador de silicio: 2 diodos conducen en cada semiciclo (caída ≈2·VF). Convierte CA en pulsos de CD sin filtrar, con el doble de la frecuencia de línea.');
  } else if(best.act==='cap'){
    if(mode==='explora' && !filterRevealed){ filterRevealed=true; showToast('¡Revelado! El capacitor de filtro suaviza los pulsos del puente, cargándose en cada pico y sosteniendo el voltaje entre ellos.'); refreshAll(); }
    else showToast('Capacitor de filtro ('+fmtC(curC())+'): entre más grande, menor rizo — pero más corriente de recarga pico en los diodos (efecto cualitativo, no modelado en cifra exacta aquí).');
  } else if(best.act==='reg'){
    if(mode==='explora' && !voutRevealed){
      if(!filterRevealed){ showToast('Primero revisa el capacitor de filtro — el regulador necesita ver esa señal para poder regular.'); }
      else { voutRevealed=true; showToast('¡Revelado! El regulador 7805 recorta el voltaje filtrado a 5V estables, siempre que sobre suficiente "margen de cabeza" (headroom).'); refreshAll(); }
    } else {
      showToast('Regulador lineal 7805: mantiene Vout=5V mientras Vfiltro−Vdropout ≥ Vout. Si el margen se agota, pierde regulación y el rizo se filtra hacia la salida.');
    }
  } else if(best.act==='load'){
    showToast('Carga de corriente constante: demanda '+fmtI(Iout)+' independientemente del voltaje — modela un consumo electrónico típico (no una resistencia fija).');
  }
}

/* ---------- banco 3D ---------- */
function trace(x0,z0,x1,z1,w){
  const len=Math.hypot(x1-x0,z1-z0);
  const g=new THREE.BoxGeometry(len,0.006,w||0.03);
  const m=new THREE.Mesh(g,MAT.trace);
  m.position.set((x0+x1)/2,0.021,(z0+z1)/2);
  m.rotation.y=-Math.atan2(z1-z0,x1-x0);
  return m;
}
function leads(g){
  const lg=new THREE.CylinderGeometry(0.012,0.012,0.12,10);
  const l1=new THREE.Mesh(lg,MAT.lead); l1.rotation.z=Math.PI/2; l1.position.x=-0.16; g.add(l1);
  const l2=new THREE.Mesh(lg,MAT.lead); l2.rotation.z=Math.PI/2; l2.position.x=0.16; g.add(l2);
}
function cable(pts,mat){
  const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
  const g=new THREE.TubeGeometry(curve,20,0.014,8,false);
  return new THREE.Mesh(g,mat);
}
function makeDisplayBox(w,h,dp,cw,ch){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,dp),MAT.scope); g.add(body);
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
  const cx=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv); tex.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*0.86,h*0.8),new THREE.MeshBasicMaterial({map:tex}));
  screen.position.z=dp/2+0.002;
  g.add(screen);
  return {g,cv,cx,tex,screen};
}

const boardG=new THREE.Group();
const boardPlane=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.95),new THREE.MeshBasicMaterial({map:bTex}));
boardPlane.userData.title='Esquema y osciloscopios';
const boardFrame=new THREE.Mesh(new THREE.BoxGeometry(2.68,2.03,0.05),MAT.frame);
boardFrame.position.z=-0.03;
boardG.add(boardFrame,boardPlane);
boardG.position.set(-1.05,1.75,-0.85);
boardG.rotation.y=0.16;
S.scene.add(boardG);

const benchG=new THREE.Group();
const mesa=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.22,2.2),MAT.bench); mesa.position.y=-0.11; benchG.add(mesa);
const pcb=new THREE.Mesh(new THREE.BoxGeometry(3.2,0.02,1.7),MAT.pcb); pcb.position.set(0.1,0.01,1.0); benchG.add(pcb);

const fuenteBox=makeDisplayBox(0.62,0.42,0.14,256,180);
fuenteBox.g.position.set(-0.15,0.42,0.55);
benchG.add(fuenteBox.g);

const medidorBox=makeDisplayBox(0.62,0.42,0.14,256,180);
medidorBox.g.position.set(0.55,0.42,0.55);
benchG.add(medidorBox.g);

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
// Todo lo que va en la placa apoya en su CARA. La biblioteca dibuja cada
// componente con y = 0 en la placa y las patas por debajo, atravesandola.
const Y_PCB=0.02;
const Z_FILA=1.15, Z_GND=1.42;
function isla(x,z){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.005,14),MAT.trace);
  m.position.set(x,0.021,z); benchG.add(m);
}

/* EL TRANSFORMADOR REDUCTOR, entero: nucleo E-I de chapas, carrete partido con
   el primario y el secundario cada uno en su hueco —sobre EL MISMO hierro— y
   fleje de sujecion apoyado en la mesa. El taco con dos cilindros pegados a los
   lados no decia de donde sale la tension del secundario. */
const xfmrG=P3.transformadorEI(MATP,{ancho:0.30,alto:0.32,prof:0.22,chapas:9});
xfmrG.userData.act='xfmr3d'; xfmrG.userData.title='Transformador reductor';
xfmrG.position.set(-1.55,0.175,Z_FILA);
benchG.add(xfmrG);

/* LA BORNERA de entrada: por sus dos bocas entra el secundario en la placa. Es
   la pieza que dice donde acaba el cable y empieza el circuito. */
const bornEnt=P3.bornera(MATP,{vias:2,paso:0.13,alto:0.11,fondo:0.12,patas:0.05});
bornEnt.rotation.y=-Math.PI/2;
bornEnt.position.set(-1.20,Y_PCB,Z_FILA);
bornEnt.userData.act='xfmr3d'; bornEnt.userData.title='Entrada del secundario';
benchG.add(bornEnt);

/* EL PUENTE: cuatro diodos con SU BANDA DE CATODO. Las cuatro bandas miran al
   mismo lado porque en el puente los cuatro conducen hacia el rail positivo;
   uno solo montado al reves cortocircuita el secundario. Sin banda dibujada no
   habia nada que mirar. */
const DIO3D=[];
for(let i=0;i<4;i++){
  const g=P3.diodoAxial(MATP,{largo:0.16,d:0.070,patas:0.05,paso:0.22,
    cuerpo:0xd88a2e,banda:0xe8e8e8,catodo:1});
  g.userData.act='bridge3d'; g.userData.title='Red de diodos del puente';
  g.position.set(-1.05+i*0.30,Y_PCB,Z_FILA);
  isla(g.position.x-0.11,Z_FILA); isla(g.position.x+0.11,Z_FILA);
  DIO3D.push(g); benchG.add(g);
}

/* EL CONDENSADOR DE FILTRO, electrolitico de pie: engarce, CRUZ DE ALIVIO y
   FRANJA DEL NEGATIVO. La franja es la marca que importa —al reves, revienta— y
   el tamano del bote crece con la capacidad, que es justo el compromiso de la
   practica. */
const capG=new THREE.Group();
capG.add(P3.condensadorRadial(MATP,{d:0.20,alto:0.30,patas:0.05,paso:0.11,
  lata:0x1f3a52,franja:0xcfe8ff}));
capG.userData.act='cap3d'; capG.userData.title='Capacitor de filtro';
capG.position.set(0.25,Y_PCB,Z_FILA);
isla(0.195,Z_FILA); isla(0.305,Z_FILA);
benchG.add(capG);

/* EL DISIPADOR es un PEINE: lo que enfria es la superficie de las aletas, no el
   volumen del taco. Cuatro chapas planas no dejaban ver por que un disipador
   mas grande baja la temperatura de union. */
const HS_X=0.70, HS_Z=1.22, HS_FONDO=0.34;
const hsG=P3.disipador(MATP,{ancho:0.42,fondo:HS_FONDO,base:0.05,alto:0.26,
  aletas:7,espesorAleta:0.022});
hsG.userData.act='hs3d'; hsG.userData.title='Disipador de calor del regulador';
hsG.position.set(HS_X,Y_PCB,HS_Z);
benchG.add(hsG);

/* EL 7805 en su TO-220, ATORNILLADO al disipador por la aleta: la aleta con su
   agujero es la pieza por la que sale el calor, y el tornillo es lo unico que
   la une al disipador. Dibujado como una caja con una chapita pegada, la union
   —que es de lo que trata la practica— no existia. */
const regG=new THREE.Group();
const regTO=P3.to220(MATP,{ancho:0.17,alto:0.26,fondo:0.055,patas:0.07,paso:0.05,
  cuerpo:MAT.reg.color.getHex()});
regG.add(regTO);
const regTor=new THREE.Mesh(new THREE.CylinderGeometry(0.020,0.020,0.030,12),MATP.aluminio);
regTor.rotation.x=Math.PI/2; regTor.position.set(0,0.26*0.86,0.040); regG.add(regTor);
regG.userData.act='reg3d'; regG.userData.title='Regulador lineal 7805 (TO-220)';
regG.position.set(HS_X,Y_PCB,HS_Z+HS_FONDO/2+0.030);
benchG.add(regG);

/* LA CARGA ELECTRONICA: un modulo con su bornera de salida. No es una
   resistencia —consume la corriente que se le pida sea cual sea la tension— y
   por eso se dibuja como un modulo con bornes, no como un componente pasivo. */
const loadG=new THREE.Group();
const loadCue=new THREE.Mesh(new THREE.BoxGeometry(0.28,0.16,0.18),MAT.load);
loadCue.position.y=0.08; loadG.add(loadCue);
for(let i=0;i<4;i++){
  const r=new THREE.Mesh(new THREE.BoxGeometry(0.20,0.012,0.008),
    std({color:0x0a0d11,roughness:0.95,metalness:0}));
  r.position.set(0,0.045+i*0.022,-0.091); loadG.add(r);
}
const bornSal=P3.bornera(MATP,{vias:2,paso:0.12,alto:0.09,fondo:0.10,patas:0.02,
  cuerpo:0x1d7a4a});
bornSal.position.set(0,0.16,-0.02); loadG.add(bornSal);
loadG.userData.act='load3d'; loadG.userData.title='Carga electrónica (fuente de corriente)';
loadG.position.set(1.25,Y_PCB,Z_FILA);
benchG.add(loadG);

/* LAS PISTAS: el RAIL DE MASA, que es el unico nodo comun a todo el montaje
   —negativo del puente, negativo del condensador, pata central del 7805 y
   retorno de la carga—, con su derivacion desde cada pieza. */
benchG.add(trace(-1.16,Z_GND,1.25,Z_GND,0.05));
[[-1.16,Z_FILA],[0.195,Z_FILA],[HS_X,HS_Z],[1.25,Z_FILA]].forEach(a=>{
  benchG.add(trace(a[0],a[1],a[0],Z_GND,0.04)); isla(a[0],Z_GND);
});

{
  const bx=-1.20-0.062, by=Y_PCB+0.11*0.36, bz=Z_FILA;
  benchG.add(cable([[-1.39,0.115,bz+0.075],[-1.31,0.175,bz+0.075],[bx,by,bz+0.065]],MAT.cableRed));
  benchG.add(cable([[-1.39,0.115,bz-0.075],[-1.31,0.155,bz-0.075],[bx,by,bz-0.065]],MAT.cableBlk));
}

benchG.traverse(o=>{ if(o.isMesh){ o.castShadow=true; o.receiveShadow=true; } });
boardPlane.castShadow=false; boardFrame.receiveShadow=true;
S.scene.add(benchG);

/* ---------- pantallas ---------- */
function drawFuenteScreen(){
  const cx=fuenteBox.cx, cv=fuenteBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#06110d'; cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='#4FD1C5'; cx.font='bold 40px system-ui'; cx.textAlign='center';
  cx.fillText(Vline.toFixed(0)+' V',cv.width/2,74);
  cx.fillStyle='#7fa89e'; cx.font='16px system-ui';
  cx.fillText('Vlínea · '+FLBL[freqIdx],cv.width/2,104);
  cx.fillStyle='#9fb8b0'; cx.font='14px system-ui';
  cx.fillText('Secundario '+curX().vsec+'V',cv.width/2,134);
  const hideVsec=(mode==='explora'&&(!filterRevealed||!voutRevealed))||(mode==='predice'&&!predRevealed);
  cx.fillText('Vs_rms = '+(hideVsec?'¿ ?':(RES?RES.vsecRms.toFixed(2)+' V':'—')),cv.width/2,156);
  fuenteBox.tex.needsUpdate=true;
}
function drawMedidorScreen(){
  const cx=medidorBox.cx, cv=medidorBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#06110d'; cx.fillRect(0,0,cv.width,cv.height);
  const hide=(mode==='explora'&&(!filterRevealed||!voutRevealed))||(mode==='predice'&&!predRevealed);
  if(hide || !RES){
    cx.fillStyle='#7fa89e'; cx.font='bold 34px system-ui'; cx.textAlign='center';
    cx.fillText('¿ ?',cv.width/2,cv.height/2+12);
    medidorBox.tex.needsUpdate=true; return;
  }
  const th=thermal(RES.pdExact,curHS().theta,curTA());
  cx.fillStyle='#E8871E'; cx.font='bold 38px system-ui'; cx.textAlign='center';
  cx.fillText(RES.voutAvg.toFixed(2)+' V',cv.width/2,66);
  cx.fillStyle='#9fb8b0'; cx.font='14px system-ui';
  cx.fillText('V_out · rizo '+(RES.voutRpp*1000).toFixed(0)+' mV',cv.width/2,92);
  cx.fillStyle=th.bad?'#e05a4e':(th.warn?'#e8c34e':'#6fd08a'); cx.font='bold 20px system-ui';
  cx.fillText('Tj ≈ '+th.tj.toFixed(1)+' °C',cv.width/2,128);
  cx.fillStyle='#7fa89e'; cx.font='13px system-ui';
  cx.fillText('Pd = '+fmtP(RES.pdExact),cv.width/2,154);
  medidorBox.tex.needsUpdate=true;
}
function refreshBenchSel(){
  DIO3D.forEach(g=>{ g.visible=true; });
  const capScale=0.7+0.3*(Cidx/(CVALS.length-1));
  capG.scale.set(1,capScale,1);
  capG.visible=curC()>0;
  const hsScale=0.4+0.9*((HS.length-1-hsIdx)/(HS.length-1));
  hsG.scale.set(hsScale,hsScale,hsScale);
  hsG.visible=hsIdx>0;
  // El 7805 va ATORNILLADO a la cara del disipador: si el disipador cambia de
  // tamano, el tornillo lo sigue en vez de quedarse en el aire.
  regG.position.z=hsIdx>0?HS_Z+(HS_FONDO/2)*hsScale+0.030:HS_Z;
}
function refreshBenchDyn(){ drawFuenteScreen(); drawMedidorScreen(); }

/* ---------- HUD / panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Electrónica analógica y de potencia (D2)</div>
  <h2>Fuente de Alimentación Lineal Regulada</h2>
  <p>Un transformador reduce la tensión de línea, un <b>puente de diodos</b> la rectifica, un
  <b>capacitor de filtro</b> la suaviza y un <b>regulador lineal 7805</b> la recorta a 5V estables
  — siempre que sobre suficiente "margen de cabeza" (headroom) por encima de su voltaje de dropout.</p>
  <div class="formula">Vs_rms = Vsec·(Vlínea/127) · Pd = (Vfiltro−Vout)·Iout + Vfiltro·Iq · Tj = Ta + Pd·θ</div>
  <div class="legend">
    <span class="li"><span class="dot" style="background:#5f8078"></span>V puente (punteado)</span>
    <span class="li"><span class="dot" style="background:#4FD1C5"></span>V_filtro</span>
    <span class="li"><span class="dot" style="background:#E8871E"></span>V_out regulado</span>
  </div>
  <div class="fid">
    <span class="ft">CONTRATO DE FIDELIDAD</span>
    <span class="fl">SÍ:</span> cadena completa Vlínea→transformador→puente (Shockley 2 uniones)→filtro
    (RK4 exacto)→regulador (dropout + foldback) con condición real de pérdida de regulación,
    disipación y Tj de estado estable contra Tj,max.<br>
    <span class="no">NO:</span> trr de los diodos, saturación/armónicos del transformador, dinámica
    térmica transitoria, tolerancias de componentes, ni la cifra exacta de corriente pico de recarga.
    <div class="src">Ref: TI SNOSBR7 (LM78XX) · ON Semi Rev.13 y Diodes Inc. DS28002 (1N400x) ·
    Diodes Inc. DS21211 (puentes DB10x) · Boylestad-Nashelsky · Sedra-Smith.</div>
  </div>
`;

document.getElementById('panel').innerHTML=`
  <h4>Banco de fuente lineal · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">Explora</button>
    <button class="b" id="m_predice">Predice</button>
    <button class="b" id="m_barrido">Barrido</button>
    <button class="b" id="m_reto">Reto</button>
  </div>
  <p id="p_mision"></p>

  <div class="g"><span class="l">Transformador (secundario)</span></div>
  <div class="modebar" id="xbar">${XFMR.map((x,i)=>`<button class="b${i===xIdx?' on':''}" id="x_${i}" style="flex:1 0 18%">${XLBL[i]}</button>`).join('')}</div>

  <div class="g"><span class="l">Frecuencia de línea</span></div>
  <div class="modebar" id="fbar">${FLBL.map((f,i)=>`<button class="b${i===freqIdx?' on':''}" id="f_${i}" style="flex:1 0 45%">${f}</button>`).join('')}</div>

  <div class="g"><span class="l">Vlínea <b id="vlv">${Vline.toFixed(0)}V</b></span></div>
  <input type="range" id="sVline" min="114" max="140" step="1" value="${Vline}">

  <div class="g"><span class="l">Iout (carga) <b id="iov">${fmtI(Iout)}</b></span></div>
  <input type="range" id="sIout" min="0" max="1.4" step="0.02" value="${Iout}">

  <div class="g"><span class="l">Capacitor de filtro</span></div>
  <div class="modebar" id="cbar">${CVALS.map((c,i)=>`<button class="b${i===Cidx?' on':''}" id="c_${i}" style="flex:1 0 30%">${CLBL[i]}</button>`).join('')}</div>

  <div class="g"><span class="l">Disipador de calor</span></div>
  <div class="modebar" id="hsbar">${HLBL.map((h,i)=>`<button class="b${i===hsIdx?' on':''}" id="hs_${i}" style="flex:1 0 45%">${h}</button>`).join('')}</div>

  <div class="g"><span class="l">Temperatura ambiente</span></div>
  <div class="modebar" id="tabar">${TALBL.map((t,i)=>`<button class="b${i===taIdx?' on':''}" id="ta_${i}" style="flex:1 0 45%">${t}</button>`).join('')}</div>

  <div id="tele">
    <div class="g"><span class="l">Vs_rms</span><b id="t_vsec">—</b></div>
    <div class="g"><span class="l">V_filtro (avg)</span><b id="t_vfiltro">—</b></div>
    <div class="g"><span class="l">Rizo filtro (pp)</span><b id="t_vrppf">—</b></div>
    <div class="g"><span class="l">V_out (avg)</span><b id="t_vout">—</b></div>
    <div class="g"><span class="l">Rizo salida (pp)</span><b id="t_vrppo">—</b></div>
    <div class="g"><span class="l">Margen (headroom)</span><b id="t_headroom">—</b></div>
    <div class="g"><span class="l">Disipación Pd</span><b id="t_pd">—</b></div>
    <div class="g"><span class="l">Tj estimada</span><b id="t_tj">—</b></div>
    <div class="g"><span class="l">Iout entregada</span><b id="t_ioact">—</b></div>
  </div>

  <div class="console" id="report"></div>

  <div id="predBox" style="display:none">
    <p id="predHint"></p>
    <div class="g"><span class="l">Vs_rms (V)</span></div>
    <input type="text" id="inVsec" style="background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px">
    <div class="g"><span class="l">V_filtro (V)</span></div>
    <input type="text" id="inVdcF" style="background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px">
    <div class="g"><span class="l">Pd (W)</span></div>
    <input type="text" id="inPd" style="background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px">
    <div class="g"><span class="l">¿Hay margen de regulación (headroom)?</span></div>
    <div class="modebar" id="phbar">
      <button class="b on" id="ph_si" style="flex:1 0 45%">Sí</button>
      <button class="b" id="ph_no" style="flex:1 0 45%">No</button>
    </div>
    <div class="g"><span class="l">¿Tj se mantiene segura (&lt;125°C)?</span></div>
    <div class="modebar" id="ptbar">
      <button class="b on" id="pt_si" style="flex:1 0 45%">Sí</button>
      <button class="b" id="pt_no" style="flex:1 0 45%">No</button>
    </div>
    <button class="b primary" id="btnPred">Comprobar predicción</button>
    <div id="predOut"></div>
  </div>

  <div id="barBox" style="display:none">
    <p id="barHint">Barre Iout (0→1.3A) o C — observa cómo cambian V_out, el rizo y Tj.</p>
    <div class="modebar" id="smbar">
      <button class="b on" id="sm_iout" style="flex:1 0 45%">Barrer Iout</button>
      <button class="b" id="sm_c" style="flex:1 0 45%">Barrer C</button>
    </div>
    <button class="b primary" id="btnSweep">Ejecutar barrido</button>
  </div>

  <div id="retoBox" style="display:none">
    <p id="retoHint"></p>
    <button class="b primary" id="btnReto">Verificar diseño</button>
    <div id="retoOut"></div>
    <button class="b" id="btnNewReto">Nuevo reto</button>
  </div>

  <div class="sec">
    <p id="q_text"></p>
    <div class="btns" id="dxbtns"></div>
  </div>

  <div class="btns"><button class="b auto" id="btnAuto">▶ Recorrido guiado</button></div>
`;

/* ---------- toast ---------- */
let toastT=null;
function showToast(msg){ const t=el('toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),4200); }

/* ---------- modos ---------- */
const MODE_META={
  explora:{ nombre:'Explora', cam:[[3.2,2.4,7.4],[0.4,1.25,0.05]],
    mision:'Toca el capacitor y el regulador en el esquema para revelar cada etapa. Cambia transformador, capacitor, disipador, Vlínea e Iout y observa cómo se comporta la cadena completa.' },
  predice:{ nombre:'Predice', cam:[[-0.1,2.2,4.3],[-0.9,1.75,-0.8]],
    mision:'Se te da un escenario completo (fijo). Antes de revelar los osciloscopios, predice Vs_rms, V_filtro, Pd, y si hay margen de regulación y seguridad térmica.' },
  barrido:{ nombre:'Barrido', cam:[[-0.2,2.1,3.9],[-0.9,1.75,-0.8]],
    mision:'Barre Iout o C automáticamente y observa la tendencia en V_out, rizo y Tj.' },
  reto:{ nombre:'Reto de diseño', cam:[[0.6,2.3,5.6],[0.2,1.3,0.2]],
    mision:'Se te da un Iout objetivo y el peor caso de línea/temperatura/Iq. Elige transformador, capacitor y disipador para mantener margen y temperatura seguros.' },
};

function lockSet(ids,disabled){ ids.forEach(id=>{ const n=el(id); if(n) n.disabled=disabled; }); }

function setMode(k){
  mode=k; solved=false;
  ['explora','predice','barrido','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  const meta=MODE_META[k];
  el('p_mode').textContent=meta.nombre;
  el('p_mision').textContent=meta.mision;
  el('predBox').style.display=k==='predice'?'block':'none';
  el('barBox').style.display=k==='barrido'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';

  const allCtrl=['sVline','sIout'];
  const btnGroups=[['x_0','x_1','x_2','x_3','x_4'],['f_0','f_1'],['c_0','c_1','c_2','c_3','c_4','c_5'],['hs_0','hs_1','hs_2','hs_3'],['ta_0','ta_1']];
  lockSet(allCtrl,false);
  btnGroups.forEach(g=>lockSet(g,false));

  if(k==='predice'){
    if(!PRED) genPredice(); else { xIdx=PRED.xIdx; freqIdx=PRED.freqIdx; Cidx=PRED.Cidx; hsIdx=PRED.hsIdx; taIdx=PRED.taIdx; Vline=PRED.Vline; Iout=PRED.Iout; }
    lockSet(allCtrl,true);
    btnGroups.forEach(g=>lockSet(g,true));
    el('predHint').innerHTML=`Escenario dado — <b>no puedes cambiarlo</b>: transformador ${XLBL[xIdx]}, ${FLBL[freqIdx]},
      Vlínea ${Vline.toFixed(1)}V, C=${CLBL[Cidx]}F, disipador "${HLBL[hsIdx]}", Ta=${TALBL[taIdx]}, Iout objetivo=${fmtI(Iout)}.
      Tolerancias: Vs_rms y V_filtro ±5%, Pd ±20%.`;
    el('predOut').innerHTML='';
    el('inVsec').value=''; el('inVdcF').value=''; el('inPd').value='';
  } else if(k==='reto'){
    if(!RETO) genReto();
    Vline=RETO.vline; taIdx=1; freqIdx=RETO.freqIdx; Iout=RETO.ioutTarget;
    lockSet(['sVline','sIout'],true);
    lockSet(['f_0','f_1'],true); lockSet(['ta_0','ta_1'],true);
    el('retoHint').innerHTML=`Diseña para Iout objetivo = <b>${fmtI(RETO.ioutTarget)}</b> en el PEOR caso:
      Vlínea=${RETO.vline.toFixed(1)}V, Ta=40°C, Iq=máx, ${FLBL[RETO.freqIdx]}.
      Elige transformador, capacitor y disipador. Meta: margen ≥0.3V, Tj≤110°C, rizo de salida ≤20mV.`;
    el('retoOut').innerHTML='';
  }
  syncCtrlBtns();
  clearDx(); refreshQuestion(); refreshBenchSel(); refreshAll();
  S.moveTo(meta.cam[0],meta.cam[1],1.3);
}

function syncCtrlBtns(){
  XFMR.forEach((_,i)=>el('x_'+i).classList.toggle('on',i===xIdx));
  FREQS.forEach((_,i)=>el('f_'+i).classList.toggle('on',i===freqIdx));
  CVALS.forEach((_,i)=>el('c_'+i).classList.toggle('on',i===Cidx));
  HS.forEach((_,i)=>el('hs_'+i).classList.toggle('on',i===hsIdx));
  TA_OPTS.forEach((_,i)=>el('ta_'+i).classList.toggle('on',i===taIdx));
  el('vlv').textContent=Vline.toFixed(0)+'V';
  el('iov').textContent=fmtI(Iout);
  el('sVline').value=Vline; el('sIout').value=Iout;
}

function onChange(){ syncCtrlBtns(); buildQuiz(); clearDx(); refreshQuestion(); refreshBenchSel(); refreshAll(); }

/* ---------- telemetría / reporte ---------- */
function set(id,txt,cls){ const n=el(id); n.textContent=txt; n.classList.remove('good','warn','bad'); if(cls) n.classList.add(cls); }

function updateTele(){
  const ids=['t_vsec','t_vfiltro','t_vrppf','t_vout','t_vrppo','t_headroom','t_pd','t_tj','t_ioact'];
  if(!RES){ ids.forEach(id=>set(id,'—')); return; }
  const hidden=(mode==='explora'&&(!filterRevealed||!voutRevealed))||(mode==='predice'&&!predRevealed);
  if(hidden){ ids.forEach(id=>set(id,'¿?','warn')); return; }
  const th=thermal(RES.pdExact,curHS().theta,curTA());
  set('t_vsec',fmtV(RES.vsecRms));
  set('t_vfiltro',fmtV(RES.vFilterAvg));
  set('t_vrppf',fmtV(RES.vFilterRpp), RES.vFilterRpp>RES.vFilterAvg*0.15?'warn':'good');
  set('t_vout',fmtV(RES.voutAvg), RES.voutAvg<REG.vout*0.95?'bad':(RES.voutAvg<REG.vout*0.99?'warn':'good'));
  set('t_vrppo',fmtV(RES.voutRpp), RES.voutRpp>0.05?'bad':(RES.voutRpp>0.01?'warn':'good'));
  set('t_headroom',fmtV(RES.headroomMargin), RES.headroomMargin<0?'bad':(RES.headroomMargin<0.3?'warn':'good'));
  set('t_pd',fmtP(RES.pdExact));
  set('t_tj',fmtT(th.tj), th.bad?'bad':(th.warn?'warn':'good'));
  set('t_ioact',fmtI(RES.ioutAct), RES.ioutAct<Iout-0.001?'bad':'good');
}

function updateReport(){
  const L=[];
  if(!RES){ el('report').innerHTML=''; return; }
  const th=thermal(RES.pdExact,curHS().theta,curTA());
  if(mode==='explora'){
    L.push('Integración RK4: '+(RES.converged?'convergió':'no convergió en '+MAXP+' periodos')+' · puente de silicio (Is=8.4e-10, n=1.85 por unión).');
    L.push('Disipación del regulador — exacta (RK4, promedio muestra a muestra) = '+fmtP(RES.pdExact)+' · fórmula de libro de texto (con Vfiltro promedio) = '+fmtP(RES.pdFormula)+(RES.pdFormula<0?' ⚠ la fórmula simple da un valor sin sentido físico cuando el regulador pasa la mayor parte del ciclo en dropout: aquí se ve su límite.':'')+'.');
    L.push('Pérdida de regulación (headroom insuficiente) '+(RES.headroomMargin<0?'SÍ ocurre':'no ocurre')+' en este punto: margen = '+fmtV(RES.headroomMargin)+'.');
    L.push('Fracción del periodo en dropout: '+(RES.dropoutFrac*100).toFixed(1)+'%.');
    if(RES.ioutAct<Iout-0.001) L.push('⚠ Limitación de corriente (foldback) activa: se solicitaron '+fmtI(Iout)+' pero solo se entregan '+fmtI(RES.ioutAct)+'.');
  } else if(mode==='predice'){
    L.push(predRevealed?'Predicción evaluada — revisa el detalle abajo.':'Predice los 5 valores/booleanos y pulsa "Comprobar predicción" para revelar los osciloscopios.');
  } else if(mode==='barrido'){
    if(SWEEP.length){
      L.push('Barrido de '+(sweepMode==='iout'?'Iout':'C')+': '+SWEEP.length+' puntos.');
      SWEEP.forEach(p=>{ const lbl=sweepMode==='iout'?fmtI(p.x):fmtC(p.x); L.push('• '+lbl+' → Vout='+p.vout.toFixed(2)+'V, rizo='+(p.vrpp*1000).toFixed(0)+'mV, Tj='+p.tj.toFixed(1)+'°C'); });
    } else L.push('Aún no hay barrido. Elige qué variable barrer y pulsa "Ejecutar barrido".');
  } else if(mode==='reto'){
    L.push('Iout objetivo: '+fmtI(RETO.ioutTarget)+' · entregado actualmente: '+fmtI(RES.ioutAct)+'.');
    L.push('Margen actual: '+fmtV(RES.headroomMargin)+' (meta ≥0.3V) · Tj actual: '+fmtT(th.tj)+' (meta ≤110°C) · rizo salida: '+(RES.voutRpp*1000).toFixed(0)+'mV (meta ≤20mV).');
  }
  el('report').innerHTML=L.map(x=>'<div>• '+x+'</div>').join('');
}

function refreshAll(){
  RES=simulate(curX().vsec,Vline,curF(),curC(),Iout,iqSelActive());
  drawBoard(); updateTele(); updateReport(); refreshBenchDyn();
}

/* ---------- barrido ---------- */
async function runSweep(){
  if(sweeping) return; sweeping=true;
  const lock={xIdx,freqIdx,hsIdx,taIdx,Vline};
  SWEEP=[];
  const pts = sweepMode==='iout' ? Array.from({length:14},(_,i)=>+(i*0.1).toFixed(2)) : CVALS;
  for(const val of pts){
    if(xIdx!==lock.xIdx||freqIdx!==lock.freqIdx||hsIdx!==lock.hsIdx||taIdx!==lock.taIdx||Vline!==lock.Vline) break;
    if(sweepMode==='iout') Iout=val; else Cidx=CVALS.indexOf(val);
    RES=simulate(curX().vsec,Vline,curF(),curC(),Iout,iqSelActive());
    const th=thermal(RES.pdExact,curHS().theta,curTA());
    SWEEP.push({x:val, vout:RES.voutAvg, vrpp:RES.voutRpp, tj:th.tj, headroom:RES.headroomMargin});
    synth.beep(500+18*SWEEP.length,.05,.05);
    syncCtrlBtns(); refreshAll();
    await sleep(240);
  }
  sweeping=false;
  showToast('Barrido completo.');
  refreshAll();
}

/* ---------- predice / reto ---------- */
function checkPredice(){
  const vsecIn=parseFloat(el('inVsec').value), vdcIn=parseFloat(el('inVdcF').value), pdIn=parseFloat(el('inPd').value);
  const hOk=el('ph_si').classList.contains('on');
  const tOk=el('pt_si').classList.contains('on');
  const okVsec=isFinite(vsecIn)&&Math.abs(vsecIn-PRED.vsecRms)<=0.05*PRED.vsecRms;
  const okVdc=isFinite(vdcIn)&&Math.abs(vdcIn-PRED.vFiltro)<=0.05*PRED.vFiltro;
  const okPd=isFinite(pdIn)&&Math.abs(pdIn-PRED.pd)<=0.20*Math.max(PRED.pd,0.01);
  const okH=hOk===PRED.headroomOk;
  const okT=tOk===PRED.thermalSafe;
  predSolved=okVsec&&okVdc&&okPd&&okH&&okT;
  predRevealed=true; solved=predSolved;
  const chip=(ok,txt)=>`<div>${ok?'✔':'✘'} ${txt}</div>`;
  el('predOut').innerHTML =
    chip(okVsec,'Vs_rms real = '+fmtV(PRED.vsecRms)) +
    chip(okVdc,'V_filtro real = '+fmtV(PRED.vFiltro)) +
    chip(okPd,'Pd real = '+fmtP(PRED.pd)) +
    chip(okH,'Headroom real: '+(PRED.headroomOk?'Sí hay margen':'Sin margen')) +
    chip(okT,'Térmico real: '+(PRED.thermalSafe?'Seguro':'Excede Tj,max')) +
    `<div style="margin-top:6px;font-weight:600">${predSolved?'✔ Predicción correcta':'✘ Revisa los valores fallidos'}</div>`;
  synth.beep(predSolved?980:220,.15,.07);
  refreshAll();
}
function newPredice(){ genPredice(); setMode('predice'); }

function checkReto(){
  const th=thermal(RES.pdExact,curHS().theta,curTA());
  const okHeadroom=RES.headroomMargin>=0.3;
  const okTj=th.tj<=110;
  const okRipple=RES.voutRpp<=0.02;
  retoSolved=okHeadroom&&okTj&&okRipple; solved=retoSolved;
  const chip=(ok,txt)=>`<div>${ok?'✔':'✘'} ${txt}</div>`;
  el('retoOut').innerHTML =
    chip(okHeadroom,'Margen = '+fmtV(RES.headroomMargin)+' (meta ≥0.3V)') +
    chip(okTj,'Tj = '+fmtT(th.tj)+' (meta ≤110°C)') +
    chip(okRipple,'Rizo salida = '+(RES.voutRpp*1000).toFixed(0)+'mV (meta ≤20mV)') +
    `<div style="margin-top:6px;font-weight:600">${retoSolved?'✔ Diseño aprobado':'✘ Ajusta transformador / capacitor / disipador'}</div>`;
  synth.beep(retoSolved?980:220,.15,.07);
  refreshAll();
}
function newReto(){ genReto(); setMode('reto'); }

/* ---------- quiz ---------- */
let QUIZ={};
function buildQuiz(){
  QUIZ={
    explora:{ pregunta:'¿Qué le pasa a V_out si V_filtro cae por debajo de Vout+Vdropout en el valle del rizo?',
      opciones:[
        {t:'Vout se mantiene perfectamente regulado', ok:false, why:'No: el regulador solo puede sostener Vout mientras tenga suficiente voltaje de entrada por encima del mínimo (dropout). Por debajo de ese margen, el transistor de paso ya no puede regular.'},
        {t:'Vout cae y el rizo del filtro se "filtra" hacia la salida', ok:true, why:'Correcto: al perder margen de regulación, el regulador deja de recortar y Vout sigue aproximadamente a V_filtro−Vdropout, incluyendo su rizo.'},
        {t:'El regulador se apaga por completo', ok:false, why:'No: no se apaga (salvo protección térmica), solo pierde regulación mientras siga habiendo algo de voltaje de entrada.'},
      ]},
    predice:{ pregunta:'¿Por qué el rizo del filtro tiene el doble de la frecuencia de línea, aunque la carga sea casi constante?',
      opciones:[
        {t:'El puente conduce en ambos semiciclos, entregando un pulso de carga al capacitor 2 veces por ciclo de línea', ok:true, why:'Correcto: a diferencia de un rectificador de media onda, el puente recarga el capacitor en cada semiciclo — el doble de veces por segundo que la frecuencia de línea.'},
        {t:'La corriente de quiescente Iq del regulador duplica la frecuencia', ok:false, why:'No: Iq es prácticamente constante y no tiene relación con la frecuencia del rizo.'},
        {t:'El transformador invierte la fase', ok:false, why:'No: el transformador solo escala la amplitud; la duplicación de frecuencia viene del puente rectificador.'},
      ]},
    barrido:{ pregunta:'Al barrer Iout, ¿cómo cambia la disipación de potencia Pd del regulador?',
      opciones:[
        {t:'Crece aproximadamente lineal con Iout mientras (Vfiltro−Vout) se mantenga casi constante', ok:true, why:'Correcto: Pd≈(Vfiltro−Vout)·Iout+Vfiltro·Iq — el primer término crece linealmente con Iout si el resto se mantiene estable.'},
        {t:'Se mantiene constante sin importar Iout', ok:false, why:'No: el término (Vfiltro−Vout)·Iout depende directamente de Iout.'},
        {t:'Decrece porque el regulador se vuelve más eficiente a mayor corriente', ok:false, why:'No: un regulador lineal no gana eficiencia con la corriente — al contrario, disipa más.'},
      ]},
    reto:{ pregunta:'¿Por qué el modo Reto exige diseñar contra Vlínea mínima (114V) y no contra el valor nominal (127V)?',
      opciones:[
        {t:'Porque a menor Vlínea, menor Vs_rms y menor V_filtro — el peor caso para el margen de regulación', ok:true, why:'Correcto: el peor caso de headroom ocurre cuando la línea está en su valor mínimo garantizado, no en el nominal.'},
        {t:'Porque a menor Vlínea el regulador siempre disipa más potencia, y eso es lo único que importa', ok:false, why:'Incompleto: a menor Vlínea el regulador en realidad disipa MENOS (menor Vfiltro−Vout) — el riesgo real es perder margen de regulación, no el calor.'},
        {t:'Porque el fabricante solo garantiza el diseño a 114V', ok:false, why:'No: esa cifra no viene del fabricante del regulador, sino de la variación real de la red eléctrica que el propio diseño debe tolerar.'},
      ]},
  };
}
function clearDx(){ el('dxbtns').innerHTML=''; }
function refreshQuestion(){
  const q=QUIZ[mode]; if(!q) return;
  el('q_text').textContent=q.pregunta;
  const opciones=q.opciones.slice();
  for(let i=opciones.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    const tmp=opciones[i];opciones[i]=opciones[j];opciones[j]=tmp;
  }
  el('dxbtns').innerHTML=opciones.map((o,i)=>`<button class="b" data-i="${i}">${'ABC'[i]}) ${o.t}</button>`).join('');
  Array.from(el('dxbtns').children).forEach(btn=>{
    btn.onclick=()=>{
      if(btn.classList.contains('right')||btn.classList.contains('wrong')) return;
      const o=opciones[+btn.dataset.i];
      btn.classList.add(o.ok?'right':'wrong');
      showToast(o.why);
      synth.beep(o.ok?880:220,.12,.06);
    };
  });
}

/* ---------- picking / tour / init ---------- */
pickerFor(S.scene,S.camera,S.renderer.domElement,hit=>{
  if(hit.object===boardPlane && hit.uv){ boardClick(hit.uv.x,hit.uv.y); return; }
  let o=hit.object;
  while(o){
    if(o.userData&&o.userData.act){
      const act=o.userData.act;
      if(act==='xfmr3d'){ if(mode==='predice'||mode==='reto'){ showToast('Bloqueado en este modo.'); } else { xIdx=(xIdx+1)%XFMR.length; onChange(); } }
      else if(act==='cap3d'){ if(mode==='predice'||mode==='reto'){ showToast('Bloqueado en este modo.'); } else { Cidx=(Cidx+1)%CVALS.length; onChange(); } }
      else if(act==='hs3d'){ if(mode==='predice'){ showToast('Bloqueado en este modo.'); } else { hsIdx=(hsIdx+1)%HS.length; onChange(); } }
      else if(act==='reg3d'){ showToast('Regulador lineal 7805: recorta el voltaje filtrado a 5V mientras haya margen suficiente.'); }
      else if(act==='load3d'){ showToast('Carga de corriente constante: '+fmtI(Iout)+'.'); }
      else if(act==='bridge3d'){ showToast('Puente rectificador de silicio (4 diodos).'); }
      return;
    }
    o=o.parent;
  }
});

const raycaster=new THREE.Raycaster();
const pmouse=new THREE.Vector2();
S.renderer.domElement.addEventListener('pointermove',(e)=>{
  const rect=S.renderer.domElement.getBoundingClientRect();
  pmouse.x=((e.clientX-rect.left)/rect.width)*2-1;
  pmouse.y=-((e.clientY-rect.top)/rect.height)*2+1;
  raycaster.setFromCamera(pmouse,S.camera);
  const hits=raycaster.intersectObjects(S.scene.children,true);
  let title='';
  if(hits.length){
    let o=hits[0].object;
    while(o){ if(o.userData&&o.userData.title){ title=o.userData.title; break; } o=o.parent; }
  }
  S.renderer.domElement.style.cursor=title?'pointer':'default';
  S.renderer.domElement.title=title;
});

async function runAuto(){
  if(autoRunning) return; autoRunning=true;
  const btn=el('btnAuto'); const prevTxt=btn.textContent; btn.textContent='Recorriendo…'; btn.disabled=true;
  try{
    setMode('explora'); filterRevealed=false; voutRevealed=false; refreshAll();
    showToast('Paso 1/5: esta es la fuente de línea sin revelar — toca el capacitor.'); await sleep(2800);
    filterRevealed=true; refreshAll();
    showToast('Paso 2/5: el capacitor de filtro suaviza los pulsos del puente.'); await sleep(2800);
    voutRevealed=true; refreshAll();
    showToast('Paso 3/5: el regulador 7805 recorta V_filtro a 5V estables.'); await sleep(2800);
    setMode('barrido'); sweepMode='iout'; el('sm_iout').classList.add('on'); el('sm_c').classList.remove('on');
    showToast('Paso 4/5: barriendo Iout para ver el efecto de la carga y el foldback.'); await runSweep(); await sleep(2000);
    setMode('reto');
    showToast('Paso 5/5: ahora diseña tú una fuente que cumpla el peor caso.'); await sleep(2600);
  } finally {
    autoRunning=false; btn.textContent=prevTxt; btn.disabled=false;
  }
}

S.setAnimate(()=>{});

el('m_explora').onclick=()=>setMode('explora');
el('m_predice').onclick=()=>setMode('predice');
el('m_barrido').onclick=()=>setMode('barrido');
el('m_reto').onclick=()=>setMode('reto');

XFMR.forEach((_,i)=>el('x_'+i).onclick=()=>{ if(mode==='predice'||mode==='reto'){ showToast('Bloqueado en este modo.'); return; } xIdx=i; onChange(); });
FREQS.forEach((_,i)=>el('f_'+i).onclick=()=>{ if(mode==='predice'||mode==='reto'){ showToast('Bloqueado en este modo.'); return; } freqIdx=i; onChange(); });
CVALS.forEach((_,i)=>el('c_'+i).onclick=()=>{ if(mode==='predice'||mode==='reto'){ showToast('Bloqueado en este modo.'); return; } Cidx=i; onChange(); });
HS.forEach((_,i)=>el('hs_'+i).onclick=()=>{ if(mode==='predice'){ showToast('Bloqueado en este modo.'); return; } hsIdx=i; onChange(); });
TA_OPTS.forEach((_,i)=>el('ta_'+i).onclick=()=>{ if(mode==='predice'||mode==='reto'){ showToast('Bloqueado en este modo.'); return; } taIdx=i; onChange(); });

el('sVline').addEventListener('input',e=>{ if(mode==='predice'||mode==='reto') return; Vline=parseFloat(e.target.value); syncCtrlBtns(); refreshAll(); });
el('sIout').addEventListener('input',e=>{ if(mode==='predice'||mode==='reto') return; Iout=parseFloat(e.target.value); syncCtrlBtns(); refreshAll(); });

el('sm_iout').onclick=()=>{ sweepMode='iout'; el('sm_iout').classList.add('on'); el('sm_c').classList.remove('on'); };
el('sm_c').onclick=()=>{ sweepMode='c'; el('sm_c').classList.add('on'); el('sm_iout').classList.remove('on'); };
el('btnSweep').onclick=()=>runSweep();

el('ph_si').onclick=()=>{ el('ph_si').classList.add('on'); el('ph_no').classList.remove('on'); };
el('ph_no').onclick=()=>{ el('ph_no').classList.add('on'); el('ph_si').classList.remove('on'); };
el('pt_si').onclick=()=>{ el('pt_si').classList.add('on'); el('pt_no').classList.remove('on'); };
el('pt_no').onclick=()=>{ el('pt_no').classList.add('on'); el('pt_si').classList.remove('on'); };
el('btnPred').onclick=()=>checkPredice();

el('btnReto').onclick=()=>checkReto();
el('btnNewReto').onclick=()=>newReto();

el('btnAuto').onclick=()=>runAuto();

genReto();
buildQuiz();
syncCtrlBtns();
refreshBenchSel();
S.start();
setMode('explora');

window.__labDebug={
  state:()=>({mode,xIdx,freqIdx,Cidx,hsIdx,taIdx,Vline,Iout,filterRevealed,voutRevealed}),
  res:()=>RES?{...RES,samples:RES.samples.map(p=>({...p})),voutSamples:RES.voutSamples.map(p=>({...p}))}:null,
  pred:()=>PRED, reto:()=>RETO, sweep:()=>SWEEP,
  simulate:(vsec,vline,freq,c,iout,iq)=>simulate(vsec,vline,freq,c,iout,iq),
  thermal:(pd,theta,ta)=>thermal(pd,theta,ta),
  setMode, setX:i=>{xIdx=i;onChange();}, setC:i=>{Cidx=i;onChange();}, setHS:i=>{hsIdx=i;onChange();},
  setVline:v=>{Vline=v;refreshAll();}, setIout:v=>{Iout=v;refreshAll();},
  checkPredice, newPredice, checkReto, newReto, sweepC:runSweep, boardClick,
};
