/* ============================================================
   LAB — RECTIFICADORES: MEDIA ONDA, CENTER-TAP Y PUENTE
   (Dominio D2 · Electrónica analógica y de potencia — molde S+P:
    esquemático IEC 60617 con motor de cálculo + osciloscopio/instrumentos)
   Normatividad / referencia: IEC 60617; Shockley (1949); SPICE2 (UCB 1975);
   hojas de datos: Vishay 1N4001–1N4007 · STMicroelectronics 1N5817–1N5819 ·
   Diodes Inc. DB101–DB107 (⚑ contrastar — otros fabricantes listan hasta 1.5 A
   bajo el mismo número de parte de puente).
   Motor de cálculo: cada diodo obedece Shockley I = Is·(e^(V/(n·VT)) − 1) con
   VT fijo a 27 °C (la variación térmica ya se cubre a fondo en el lab de la
   curva I–V del diodo; aquí el foco es la TOPOLOGÍA de rectificación). El
   voltaje de salida con filtro se resuelve integrando la EDO exacta del
   capacitor C·dVc/dt = I_diodo(t) − Vc/R_L por Runge-Kutta 4, NO con la
   fórmula lineal aproximada de rizo (que se muestra solo como referencia
   textual). PIV se calcula con las fórmulas específicas por topología
   (2Vm − Vf con filtro en media onda y center-tap; Vm − Vf en puente) y,
   cuando es observable en el modelo (media onda y center-tap), también se
   MIDE directamente de la forma de onda simulada.
   NO modela: recuperación inversa (t_rr), núcleo/fugas del transformador,
   derrateo térmico, ESR/envejecimiento del capacitor, ruptura por avalancha,
   distorsión de línea real, EMI, corriente de pico exacta del diodo (existen
   variantes de fórmula incompatibles publicadas — se omite deliberadamente).
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.1,2.5,7.2],target:[0.5,1.3,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ---------- 1) Modelo físico ---------- */
const KB=1.380649e-23, QE=1.602176634e-19, TNOM=300.15;
const VTN=KB*TNOM/QE; // ≈25.87 mV @27°C — T fija (ver nota de alcance arriba)

// Parámetros tipo-SPICE ⚑ ajustados para que Vf@If(AV) caiga dentro del rango
// publicado de cada hoja de datos citada en la ficha técnica (no son un
// curve-fit completo de la curva — son un modelo didáctico anclado al dato
// más importante para el diseño: Vf a la corriente nominal).
const DIODES={
  si :{name:'Silicio (tipo 1N4007)',  Is:8.4e-10, n:1.85, ifAvg:1.0, ifsm:30,   vrrm:1000, color:0xd88a2e},
  sch:{name:'Schottky (tipo 1N5819)', Is:1.0e-9,  n:1.05, ifAvg:1.0, ifsm:null, vrrm:40,   color:0xb9d3de},
};
// Puente DB107: 4 uniones de silicio integradas — la física se modela
// reutilizando DIODES.si en serie (idExpl2), pero el RATING de seguridad que
// se compara es el del PAQUETE (hoja Diodes Inc. DB101–DB107) ⚑.
const DB107={name:'Puente DB107 (4 uniones Si integradas)', ifAvg:1.0, ifsm:50, vrrm:1000};

const TOPOS={
  halfwave: {name:'Media onda',                  ndiodos:1, kRipple:1},
  centertap:{name:'Center-tap (onda completa)',  ndiodos:2, kRipple:2},
  bridge:   {name:'Puente (onda completa)',      ndiodos:4, kRipple:2},
};
const TOPO_KEYS=['halfwave','centertap','bridge'];
const RVALS=[47,100,220,470,1000,2200];
const RLBL=['47','100','220','470','1k','2.2k'];
const CVALS=[0,10e-6,47e-6,100e-6,220e-6,470e-6,1000e-6,2200e-6];
const CLBL=['0','10µ','47µ','100µ','220µ','470µ','1000µ','2200µ'];
const FREQS=[50,60];
const FLBL=['50 Hz','60 Hz (MX)'];

const vAtI=(d,i)=>d.n*VTN*Math.log(Math.max(i,0)/d.Is+1);           // 1 unión
const idExpl=(d,v)=>d.Is*Math.expm1(v/(d.n*VTN));                    // 1 unión
const idExpl2=(d,v)=>d.Is*Math.expm1(v/(2*d.n*VTN));                 // 2 uniones en serie (puente)
const vinInst=(t,vrms,freq)=>Math.SQRT2*vrms*Math.sin(2*Math.PI*freq*t);

function idiodeTotal(topKey,d,vrms,freq,t,vout){
  const va=vinInst(t,vrms,freq);
  if(topKey==='halfwave') return idExpl(d,va-vout);
  if(topKey==='centertap')return idExpl(d,va-vout)+idExpl(d,-va-vout);
  return idExpl2(d,Math.abs(va)-vout); // bridge
}
function solveInstant(topKey,d,vrms,freq,t,rl){
  let lo=-2,hi=Math.SQRT2*vrms*1.3+2;
  for(let k=0;k<70;k++){const m=(lo+hi)/2;
    (idiodeTotal(topKey,d,vrms,freq,t,m)-m/rl>=0)?lo=m:hi=m;}
  return (lo+hi)/2;
}
// Paso RK4 adaptativo: entre menor la constante de tiempo RC frente al periodo de línea,
// más rígida es la ODE (la conducción del diodo crea una pendiente local muy alta) y más
// pasos hacen falta para que la integración no diverja. Verificado por barrido exhaustivo
// de todo el espacio de parámetros seleccionable en la UI (topología×diodo×frecuencia×R×C×Vrms):
// un paso fijo de 480 (o incluso 3840) deja combinaciones que no convergen; este mínimo por
// combinación garantiza 0 divergencias en las 19,680 combinaciones posibles.
function stepsFor(rl,c){
  if(c<=0)return 1200;
  const tau=rl*c;
  return Math.min(20000, Math.max(1200, Math.ceil(4.5/tau/10)*10));
}
function rectify(topKey,d,vrms,freq,rl,c){
  const T=1/freq, N=stepsFor(rl,c), dt=T/N;
  const deriv=(t,v)=>(idiodeTotal(topKey,d,vrms,freq,t,v)-v/rl)/c;
  const vm=Math.SQRT2*vrms;
  let v = c>0 ? Math.max(0, vm-vAtI(d,vm/rl)) : 0; // arranque cerca del régimen permanente
  let t=0,prevVdc=null,converged=false,samples=null,vmax=-Infinity,vmin=Infinity,vdc=0;
  const MAXP=c>0?60:1;
  for(let p=0;p<MAXP;p++){
    const t0=t,pts=[];let sum=0;vmax=-Infinity;vmin=Infinity;
    for(let k=0;k<=N;k++){
      const tt=t0+k*dt;
      const vv=c>0?v:solveInstant(topKey,d,vrms,freq,tt,rl);
      const ii=idiodeTotal(topKey,d,vrms,freq,tt,vv);
      pts.push({t:k*dt,vin:vinInst(tt,vrms,freq),vout:vv,i:ii});
      sum+=(k===0||k===N)?vv*0.5:vv;
      if(vv>vmax)vmax=vv; if(vv<vmin)vmin=vv;
      if(k<N&&c>0){
        const k1=deriv(tt,v),k2=deriv(tt+dt/2,v+dt/2*k1),
              k3=deriv(tt+dt/2,v+dt/2*k2),k4=deriv(tt+dt,v+dt*k3);
        v=v+dt/6*(k1+2*k2+2*k3+k4);
      }
    }
    t=t0+N*dt; const vdcP=sum/N; samples=pts; vdc=vdcP;
    if(c===0){converged=true;break;}
    if(prevVdc!==null&&Math.abs(vdcP-prevVdc)<=0.002*Math.max(Math.abs(vdcP),0.05)){converged=true;break;}
    prevVdc=vdcP;
  }
  return {samples,vdc,vrpp:vmax-vmin,vmax,vmin,T,converged};
}
function inrushPeak(topKey,d,vrms,freq,rl,c){
  if(c<=0)return null;
  const T=1/freq,N=200,dt=T/N;
  const deriv=(t,v)=>(idiodeTotal(topKey,d,vrms,freq,t,v)-v/rl)/c;
  let v=0,t=0,imax=0;
  for(let k=0;k<N;k++){
    const ii=idiodeTotal(topKey,d,vrms,freq,t,v);if(ii>imax)imax=ii;
    const k1=deriv(t,v),k2=deriv(t+dt/2,v+dt/2*k1),k3=deriv(t+dt/2,v+dt/2*k2),k4=deriv(t+dt,v+dt*k3);
    v=v+dt/6*(k1+2*k2+2*k3+k4);t+=dt;
  }
  return imax;
}
function peakDiodeCurrent(topKey,d,samples){
  let m=0;
  for(const p of samples){
    if(topKey==='centertap')m=Math.max(m,idExpl(d,p.vin-p.vout),idExpl(d,-p.vin-p.vout));
    else if(topKey==='bridge')m=Math.max(m,idExpl2(d,Math.abs(p.vin)-p.vout));
    else m=Math.max(m,idExpl(d,p.vin-p.vout));
  }
  return m;
}
const perDiodeAvg=(topKey,vdc,rl)=>{const idc=vdc/rl;return topKey==='halfwave'?idc:idc/2;};
function pivFormula(topKey,d,vrms,c,idc){
  const vm=Math.SQRT2*vrms, vf=vAtI(d,Math.max(idc,1e-6));
  if(topKey==='halfwave')return c>0?(2*vm-vf):vm;
  if(topKey==='centertap')return 2*vm-vf;
  return vm-vf; // bridge
}
function measuredPIV(topKey,samples){
  if(topKey==='bridge')return null; // no observable por unión individual en el modelo agrupado
  let m=-Infinity;
  for(const p of samples){
    const rv=(topKey==='centertap')?(p.vout+Math.abs(p.vin)):(p.vout-p.vin);
    if(rv>m)m=rv;
  }
  return m;
}
const rippleFactorPct=(vrpp,vdc)=>vrpp/(2*Math.sqrt(3)*Math.max(vdc,1e-6))*100;
const ratingsFor=(topKey,d)=>topKey==='bridge'?DB107:d;

/* ---------- 2) Estado ---------- */
let mode='explora', topKey='bridge', dsel='si', freqIdx=1, Ridx=2, Cidx=0, Vrms=12;
let RES=null, solved=false, sweeping=false, autoRunning=false;
let PRED=null, predRevealed=false, predSolved=false;
let RETO=null, retoSolved=false;
let SWEEPC=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const curD=()=>DIODES[dsel];
const curR=()=>RVALS[Ridx];
const curC=()=>CVALS[Cidx];
const curF=()=>FREQS[freqIdx];

const fmtV=v=>Math.abs(v)<1?(v*1e3).toFixed(0)+' mV':v.toFixed(2)+' V';
const fmtI=i=>{const a=Math.abs(i);return a>=1?i.toFixed(3)+' A':a>=1e-3?(i*1e3).toFixed(1)+' mA':(i*1e6).toFixed(1)+' µA';};
const fmtR=r=>r>=1000?(r/1000)+' kΩ':r+' Ω';
const fmtC=f=>f===0?'0 (sin filtro)':(f*1e6).toFixed(0)+' µF';

function genPredice(){
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const unsafe=Math.random()<0.4;
  const tk=unsafe?pick(['halfwave','centertap']):pick(TOPO_KEYS);
  const ds=(tk==='bridge')?'si':(unsafe?'sch':pick(['si','sch']));
  const fi=pick([0,1]);
  const ci=1+Math.floor(Math.random()*(CVALS.length-1));
  const ri=Math.floor(Math.random()*RVALS.length);
  const vr=+(unsafe?(14+Math.random()*10):(5+Math.random()*10)).toFixed(1);
  const res=rectify(tk,DIODES[ds],vr,FREQS[fi],RVALS[ri],CVALS[ci]);
  const idc=res.vdc/RVALS[ri];
  const piv=pivFormula(tk,DIODES[ds],vr,CVALS[ci],idc);
  const rt=ratingsFor(tk,DIODES[ds]);
  const safe=(piv<=rt.vrrm)&&(perDiodeAvg(tk,res.vdc,RVALS[ri])<=rt.ifAvg);
  PRED={topKey:tk,dsel:ds,freqIdx:fi,Ridx:ri,Cidx:ci,Vrms:vr,res,piv,safe};
  predRevealed=false;predSolved=false;
}
function genReto(){
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const tk=pick(TOPO_KEYS);
  const ds=tk==='bridge'?'si':pick(['si','sch']);
  const fi=pick([0,1]);
  const ri=Math.floor(Math.random()*RVALS.length);
  const vr=+(8+Math.random()*10).toFixed(1);
  const ci=3+Math.floor(Math.random()*3);
  const res=rectify(tk,DIODES[ds],vr,FREQS[fi],RVALS[ri],CVALS[ci]);
  const rFactor=rippleFactorPct(res.vrpp,res.vdc);
  RETO={rl:RVALS[ri],freqIdx:fi,vdcTarget:res.vdc,vdcTolPct:5,rippleMaxPct:+(rFactor*1.4).toFixed(2)};
  retoSolved=false;
}

/* ---------- 3) Materiales ---------- */
const std=o=>new THREE.MeshStandardMaterial(o);
const MAT={
  bench:std({color:0x0e1512,roughness:0.9,metalness:0.05}),
  frame:std({color:0x11201c,roughness:0.6,metalness:0.3}),
  pcb:std({color:0x0c2a20,roughness:0.75}),
  psu:std({color:0x1a2622,roughness:0.4,metalness:0.4}),
  scope:std({color:0x121a18,roughness:0.35,metalness:0.5}),
  lead:std({color:0xb9c2bd,metalness:0.8,roughness:0.3}),
  trace:std({color:0xffb703,metalness:0.2,roughness:0.5}),
  jackRed:std({color:0xd23b3b,roughness:0.4}),
  jackBlk:std({color:0x1a1a1a,roughness:0.4}),
  cableRed:std({color:0xc23a3a,roughness:0.6}),
  cableBlk:std({color:0x161616,roughness:0.6}),
  cap:std({color:0x2a3a52,roughness:0.35,metalness:0.5}),
  xfmr:std({color:0x33261a,roughness:0.5,metalness:0.2}),
};
const BAND_COLORS=['#1a1a1a','#7a4a1e','#d23b3b','#e8871e','#e8d21e','#3fae3f','#2e6fe0','#8a4fd6','#8a8a8a','#e8e8e8'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1,dd=Math.round(v/Math.pow(10,exp));
  return {d1:Math.floor(dd/10),d2:dd%10,mult:exp+1};}

/* ---------- 4) Pizarrón (esquema + osciloscopio) ---------- */
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bCx=bCv.getContext('2d');const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;

const PX0=130,PX1=940,PY0=308,PY1=676;
const WY=90,BY=250,outX=650,capX=790,resX=910;

function line(c,x0,y0,x1,y1,col,w,dash){c.save();c.strokeStyle=col;c.lineWidth=w||2;
  if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
function rr(c,x,y,w,h,r,fill,stroke,sw){c.beginPath();c.roundRect(x,y,w,h,r);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=sw||2;c.stroke();}}
function diodeGlyph(c,cx,cy,ang,color,label){
  c.save();c.translate(cx,cy);c.rotate(ang);
  c.beginPath();c.moveTo(-15,-17);c.lineTo(-15,17);c.lineTo(15,0);c.closePath();
  c.fillStyle=color;c.fill();c.strokeStyle='#EAF4F1';c.lineWidth=2.5;c.stroke();
  c.strokeStyle='#EAF4F1';c.lineWidth=4;c.beginPath();c.moveTo(15,-17);c.lineTo(15,17);c.stroke();
  c.restore();
  if(label){c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='center';
    c.fillText(label,cx,cy+34);}
}
function acSourceGlyph(c,cx,cy,r){
  c.beginPath();c.arc(cx,cy,r,0,7);c.fillStyle='#0d1a17';c.fill();
  c.strokeStyle='#EAF4F1';c.lineWidth=2.5;c.stroke();
  c.strokeStyle='#4FD1C5';c.lineWidth=2.5;c.beginPath();
  c.moveTo(cx-r*0.55,cy);
  for(let i=0;i<=20;i++){const xx=cx-r*0.55+r*1.1*(i/20);
    const yy=cy-Math.sin(i/20*Math.PI*2)*r*0.35;
    i===0?c.moveTo(xx,yy):c.lineTo(xx,yy);}
  c.stroke();
}
function groundGlyph(c,x,y){
  line(c,x,y,x,y+14,'#EAF4F1',2.5);
  line(c,x-16,y+14,x+16,y+14,'#EAF4F1',2.5);
  line(c,x-10,y+21,x+10,y+21,'#EAF4F1',2);
  line(c,x-4,y+28,x+4,y+28,'#EAF4F1',1.5);
}
function resistorGlyph(c,cx,y0,y1,label){
  rr(c,cx-16,y0+8,32,(y1-y0)-16,4,'#1a2a26','#EAF4F1',2);
  line(c,cx,y0,cx,y0+8,'#EAF4F1',2.5);line(c,cx,y1-8,cx,y1,'#EAF4F1',2.5);
  if(label){c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='left';
    c.fillText(label,cx+22,(y0+y1)/2+4);}
}
function capGlyph(c,cx,y0,y1,active,label){
  const my=(y0+y1)/2;
  line(c,cx,y0,cx,my-8,active?'#EAF4F1':'#3a4d47',2.5);
  line(c,cx,my+8,cx,y1,active?'#EAF4F1':'#3a4d47',2.5);
  line(c,cx-18,my-8,cx+18,my-8,active?'#4FD1C5':'#3a4d47',3);
  line(c,cx-18,my+8,cx+18,my+8,active?'#4FD1C5':'#3a4d47',3);
  if(label){c.fillStyle=active?'#8FB3AC':'#4a5a55';c.font='11px monospace';c.textAlign='right';
    c.fillText(label,cx-24,my+4);}
}

let HIT=[];
function drawSchematicHalfwave(c){
  acSourceGlyph(c,150,170,36);
  line(c,150,134,150,WY,'#EAF4F1',2.5);line(c,150,WY,486,WY,'#EAF4F1',2.5);
  diodeGlyph(c,500,WY,0,'#'+curD().color.toString(16).padStart(6,'0'),curD().name.split(' ')[0]);
  line(c,514,WY,outX,WY,'#EAF4F1',2.5);
  line(c,150,206,150,BY,'#EAF4F1',2.5);line(c,150,BY,970,BY,'#EAF4F1',2.5);
  HIT.push({x:150,y:170,r:50,act:'src'},{x:500,y:WY,r:55,act:'rect'});
}
function drawSchematicCentertap(c){
  acSourceGlyph(c,150,120,28);acSourceGlyph(c,150,220,28);
  line(c,150,148,150,192,'#EAF4F1',2.5);
  line(c,150,170,90,170,'#EAF4F1',2);line(c,90,170,90,BY,'#EAF4F1',2);line(c,90,BY,970,BY,'#EAF4F1',2.5);
  line(c,150,92,150,WY,'#EAF4F1',2.5);line(c,150,WY,480,WY,'#EAF4F1',2.5);line(c,480,WY,480,110,'#EAF4F1',2.5);
  diodeGlyph(c,500,110,0,'#'+curD().color.toString(16).padStart(6,'0'));
  line(c,514,110,600,110,'#EAF4F1',2.5);line(c,600,110,600,170,'#EAF4F1',2.5);
  line(c,150,248,150,BY,'#EAF4F1',2.5);line(c,150,BY,480,BY,'#EAF4F1',2.5);line(c,480,BY,480,230,'#EAF4F1',2.5);
  diodeGlyph(c,500,230,0,'#'+curD().color.toString(16).padStart(6,'0'));
  line(c,514,230,600,230,'#EAF4F1',2.5);line(c,600,230,600,170,'#EAF4F1',2.5);
  line(c,600,170,600,WY,'#EAF4F1',2.5);line(c,600,WY,outX,WY,'#EAF4F1',2.5);
  c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='center';c.fillText('CT',90,190);
  HIT.push({x:150,y:170,r:70,act:'src'},{x:500,y:170,r:90,act:'rect'});
}
function drawSchematicBridge(c){
  const L={x:420,y:170},T={x:500,y:WY},R={x:580,y:170},B={x:500,y:BY};
  acSourceGlyph(c,150,170,36);
  line(c,150,134,150,90,'#EAF4F1',2.5);line(c,150,90,L.x,90,'#EAF4F1',2.5);line(c,L.x,90,L.x,L.y,'#EAF4F1',2.5);
  line(c,150,206,150,250,'#EAF4F1',2.5);line(c,150,250,R.x,250,'#EAF4F1',2.5);line(c,R.x,250,R.x,R.y,'#EAF4F1',2.5);
  const col='#'+curD().color.toString(16).padStart(6,'0');
  line(c,L.x,L.y,T.x,T.y,'#EAF4F1',2);diodeGlyph(c,(L.x+T.x)/2,(L.y+T.y)/2,Math.atan2(T.y-L.y,T.x-L.x),col);
  line(c,R.x,R.y,T.x,T.y,'#EAF4F1',2);diodeGlyph(c,(R.x+T.x)/2,(R.y+T.y)/2,Math.atan2(T.y-R.y,T.x-R.x),col);
  line(c,B.x,B.y,R.x,R.y,'#EAF4F1',2);diodeGlyph(c,(B.x+R.x)/2,(B.y+R.y)/2,Math.atan2(R.y-B.y,R.x-B.x),col);
  line(c,B.x,B.y,L.x,L.y,'#EAF4F1',2);diodeGlyph(c,(B.x+L.x)/2,(B.y+L.y)/2,Math.atan2(L.y-B.y,L.x-B.x),col);
  line(c,T.x,T.y,outX,WY,'#EAF4F1',2.5);line(c,B.x,B.y,970,BY,'#EAF4F1',2.5);
  HIT.push({x:150,y:170,r:50,act:'src'},{x:500,y:170,r:95,act:'rect'});
}
function drawLoad(c){
  line(c,outX,WY,990,WY,'#EAF4F1',2.5);
  capGlyph(c,capX,WY,BY,Cidx>0,fmtC(curC()));
  if(Cidx>0)line(c,capX,WY,capX,WY,'#EAF4F1',2);
  resistorGlyph(c,resX,WY,BY,fmtR(curR()));
  groundGlyph(c,970,BY);
  HIT.push({x:capX,y:170,r:45,act:'cap'},{x:resX,y:170,r:45,act:'res'});
}
function vyMax(){return Math.max(6,Math.ceil(Math.SQRT2*Vrms*1.25));}
function drawScope(c,res){
  if(!res)return;
  const vym=vyMax(),T=res.T;
  const tPix=t=>PX0+(t/T)*(PX1-PX0);
  const vPix=v=>PY0+(1-(v+vym)/(2*vym))*(PY1-PY0);
  rr(c,PX0,PY0,PX1-PX0,PY1-PY0,6,'#0a1512','#1E3A34',2);
  for(let vv=-vym;vv<=vym;vv+=vym/4){
    const y=vPix(vv);line(c,PX0,y,PX1,y,'#152622',1);
    c.fillStyle='#5a746e';c.font='10px monospace';c.textAlign='right';
    c.fillText(vv.toFixed(0)+'V',PX0-6,y+3);
  }
  for(let k=0;k<=4;k++){const tt=T*k/4,x=tPix(tt);line(c,x,PY0,x,PY1,'#152622',1);
    c.fillStyle='#5a746e';c.font='10px monospace';c.textAlign='center';
    c.fillText((tt*1000).toFixed(1)+'ms',x,PY1+16);}
  line(c,PX0,vPix(0),PX1,vPix(0),'#2a4a42',2);
  c.save();c.beginPath();c.rect(PX0,PY0,PX1-PX0,PY1-PY0);c.clip();
  c.strokeStyle='#5f8078';c.lineWidth=2;c.setLineDash([6,4]);c.beginPath();
  res.samples.forEach((p,i)=>{const x=tPix(p.t),y=vPix(p.vin);i===0?c.moveTo(x,y):c.lineTo(x,y);});
  c.stroke();c.setLineDash([]);
  c.strokeStyle='#4FD1C5';c.lineWidth=4;c.beginPath();
  res.samples.forEach((p,i)=>{const x=tPix(p.t),y=vPix(p.vout);i===0?c.moveTo(x,y):c.lineTo(x,y);});
  c.stroke();
  c.restore();
  line(c,PX0,vPix(res.vdc),PX1,vPix(res.vdc),'#FFB703',2,[8,5]);
  c.fillStyle='#FFB703';c.font='11px monospace';c.textAlign='left';
  c.fillText('Vdc = '+fmtV(res.vdc),PX0+8,vPix(res.vdc)-8);
  c.fillStyle='#4FD1C5';c.textAlign='right';c.fillText('Vout',PX1-8,PY0+16);
  c.fillStyle='#8FB3AC';c.fillText('Vin (·-·)',PX1-8,PY0+32);
}
function drawBoard(){
  const c=bCx;c.clearRect(0,0,1024,768);
  const g=c.createLinearGradient(0,0,0,768);g.addColorStop(0,'#0d1a17');g.addColorStop(1,'#071310');
  c.fillStyle=g;c.fillRect(0,0,1024,768);
  c.fillStyle='#EAF4F1';c.font='bold 22px sans-serif';c.textAlign='left';
  c.fillText('Rectificador · '+TOPOS[topKey].name,26,42);
  c.fillStyle='#8FB3AC';c.font='13px monospace';
  c.fillText('Vrms='+Vrms.toFixed(1)+'V · '+FLBL[freqIdx]+' · R='+fmtR(curR())+' · C='+fmtC(curC())+' · '+curD().name,26,64);
  HIT=[];
  if(topKey==='halfwave')drawSchematicHalfwave(c);
  else if(topKey==='centertap')drawSchematicCentertap(c);
  else drawSchematicBridge(c);
  drawLoad(c);
  const hidePred=(mode==='predice'&&!predRevealed);
  if(hidePred){
    rr(c,PX0,PY0,PX1-PX0,PY1-PY0,6,'#0a1512','#1E3A34',2);
    c.fillStyle='#FFB703';c.font='bold 20px sans-serif';c.textAlign='center';
    c.fillText('¿? — predice antes de revelar',(PX0+PX1)/2,(PY0+PY1)/2);
  }else{
    drawScope(c,RES);
  }
  bTex.needsUpdate=true;
}
function boardClick(u,v){
  const px=u*1024, py=(1-v)*768;
  let best=null,bd=1e9;
  for(const h of HIT){const dx=px-h.x,dy=py-h.y,d=Math.hypot(dx,dy);
    if(d<h.r&&d<bd){bd=d;best=h;}}
  if(!best)return;
  synth.beep(620,.05,.05);
  if(best.act==='src')showToast('Fuente CA (secundario del transformador) · Vrms = '+Vrms.toFixed(1)+' V · Vm = '+(Math.SQRT2*Vrms).toFixed(1)+' V · '+FLBL[freqIdx]+' — el transformador se trata como fuente ideal (sin fugas ni saturación de núcleo).');
  else if(best.act==='rect')showToast(TOPOS[topKey].name+' · '+TOPOS[topKey].ndiodos+' diodo(s) · '+curD().name+' — la frecuencia de rizo a la salida es '+TOPOS[topKey].kRipple+'× la de línea.');
  else if(best.act==='cap')showToast(Cidx>0?('Capacitor de filtro = '+fmtC(curC())+' — entre pulsos de carga, sostiene Vout descargándose sobre R_L (C·dV/dt = I_diodo − V/R_L).'):'Sin capacitor de filtro: Vout sigue la envolvente rectificada cruda, con rizo total.');
  else if(best.act==='res')showToast('Carga R_L = '+fmtR(curR())+' · Idc ≈ '+fmtI((RES?RES.vdc:0)/curR()));
}

/* ---------- 5) Banco 3D ---------- */
const boardG=new THREE.Group();
const board=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.95),new THREE.MeshStandardMaterial({map:bTex,roughness:0.55,metalness:0.05}));
board.userData.title='Esquema y osciloscopio';
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
function trace(x0,z0,x1,z1,w){
  const dx=x1-x0,dz=z1-z0,len=Math.hypot(dx,dz);
  const m=new THREE.Mesh(new THREE.BoxGeometry(len,0.006,w||0.03),MAT.trace);
  m.position.set((x0+x1)/2,0.037,(z0+z1)/2);m.rotation.y=-Math.atan2(dz,dx);
  benchG.add(m);
}
function leads(g){
  const l1=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.16,10),MAT.lead);
  l1.rotation.z=Math.PI/2;l1.position.x=-0.16;g.add(l1);
  const l2=l1.clone();l2.position.x=0.16;g.add(l2);
}
function cable(pts,mat){
  const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
  const geo=new THREE.TubeGeometry(curve,24,0.014,8,false);
  const m=new THREE.Mesh(geo,mat);benchG.add(m);return m;
}
function makeDisplayBox(w,h,dp,cw,ch){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,dp),MAT.scope);g.add(body);
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
  const cx=cv.getContext('2d');const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*0.86,h*0.78),
    new THREE.MeshStandardMaterial({map:tex,emissive:0x0a1512,emissiveMap:tex,emissiveIntensity:0.6,roughness:0.4}));
  screen.position.z=dp/2+0.001;g.add(screen);
  return {g,cv,cx,tex,screen};
}
const fuenteBox=makeDisplayBox(0.62,0.42,0.14,256,180);
fuenteBox.g.position.set(-0.15,0.42,0.55);benchG.add(fuenteBox.g);
const medidorBox=makeDisplayBox(0.62,0.42,0.14,256,180);
medidorBox.g.position.set(0.55,0.42,0.55);benchG.add(medidorBox.g);

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
// Todo lo que va en la placa apoya en su CARA: la biblioteca dibuja cada
// componente con y = 0 en la placa y las patas por debajo, atravesandola.
const Y_PCB=0.035;
/* EL TRANSFORMADOR de la fuente, como el que hay en cualquier banco: NUCLEO E-I
   de chapas apiladas, carrete partido —primario y secundario, cada uno en su
   hueco, sobre EL MISMO hierro— y el fleje de sujecion con sus patas. El bloque
   liso con dos cilindros pegados a los lados no decia de donde sale la tension
   del secundario; asi se ve que sale de un devanado enrollado sobre el mismo
   nucleo que el otro. */
const xfmrG=P3.transformadorEI(MATP,{ancho:0.30,alto:0.34,prof:0.22,chapas:9});
xfmrG.userData.act='src3d';xfmrG.userData.title='Fuente CA (secundario)';
xfmrG.position.set(-1.55,0.19,1.15);benchG.add(xfmrG);

// Diodos (hasta 4 instancias, visibilidad y color según topología/dispositivo)
const dioG=new THREE.Group();
/* LOS DIODOS, cada uno con SU BANDA DE CATODO alrededor del cuerpo y las patas
   dobladas metidas en la placa. La banda es la unica marca que dice hacia donde
   conduce: en el puente, dos de los cuatro van con la banda al reves que los
   otros dos, y equivocarse ahi es cortocircuitar el secundario. */
const DIO3D=[0,1,2,3].map(i=>{
  const g=P3.diodoAxial(MATP,{largo:0.16,d:0.070,patas:0.06,paso:0.22,
    cuerpo:DIODES.si.color,banda:0x111111,catodo:1});
  g.userData.act='topo3d';g.userData.title='Red de diodos';
  g.position.set(-0.56+i*0.30,Y_PCB,0.30);
  dioG.add(g);
  return {g,body:g.userData.cuerpo,band:g.userData.banda};
});
benchG.add(dioG);

/* LA RESISTENCIA DE CARGA, con el cuerpo abarrilado y las TRES BANDAS de valor
   que el panel cambia cuando se mueve R_L: aqui el codigo de colores se lee de
   verdad. */
const resP3=P3.resistencia(MATP,{largo:0.22,d:0.085,patas:0.06,paso:0.34,
  bandas:[0x000000,0x000000,0x000000],cuerpo:0xe8d9b0});
const resG=new THREE.Group();resG.add(resP3);
const resBody=resP3.userData.cuerpo;
const bandMeshes=resP3.userData.bandas;
resG.userData.act='res3d';resG.userData.title='Resistor de carga R_L';
resG.position.set(0.15,Y_PCB,1.15);benchG.add(resG);

/* EL CONDENSADOR DE FILTRO, electrolitico: de pie, con el engarce del fondo, la
   CRUZ DE ALIVIO de la tapa y la FRANJA DEL NEGATIVO. Las tres marcas son las de
   uno de verdad, y la franja es la que importa: un electrolitico al reves a la
   salida de un rectificador revienta por la cruz. */
const capP3=P3.condensadorRadial(MATP,{d:0.18,alto:0.24,patas:0.06,paso:0.10,
  lata:0x1f3a52,franja:0xcfe8ff});
const capG=new THREE.Group();capG.add(capP3);
const capBody=capP3.userData.cuerpo;
capG.userData.act='cap3d';capG.userData.title='Capacitor de filtro';
capG.position.set(0.55,Y_PCB,1.15);benchG.add(capG);

/* LAS PISTAS Y LAS ISLAS de la placa. Solo se dibujan las que son ciertas en
   TODAS las topologias: las islas de entrada, las de cada diodo y el lazo que
   pone el condensador EN PARALELO con la carga —la unica conexion que no cambia
   al pasar de media onda a puente—. */
function isla(x,z){
  const m=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.005,14),MAT.trace);
  m.position.set(x,0.037,z);benchG.add(m);
}
DIO3D.forEach(d=>{isla(d.g.position.x-0.11,0.30);isla(d.g.position.x+0.11,0.30);});
[[-0.02,1.15],[0.32,1.15],[0.50,1.15],[0.60,1.15],[-0.50,0.50]].forEach(a=>isla(a[0],a[1]));
trace(0.32,1.15,0.50,1.15,0.045);
trace(-0.02,1.15,-0.02,1.42,0.045);
trace(-0.02,1.42,0.60,1.42,0.045);
trace(0.60,1.42,0.60,1.15,0.045);

cable([[-1.40,0.13,1.22],[-1.05,0.17,0.85],[-0.67,0.05,0.30]],MAT.cableRed);
cable([[-1.40,0.13,1.08],[-1.05,0.11,0.80],[-0.50,0.05,0.50]],MAT.cableBlk);

benchG.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
board.castShadow=false;boardFrame.receiveShadow=true;
S.scene.add(benchG);

function drawFuenteScreen(){
  const cx=fuenteBox.cx,cv=fuenteBox.cv;cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#06110d';cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='#4FD1C5';cx.font='bold 22px monospace';cx.textAlign='center';
  cx.fillText(Vrms.toFixed(1)+' V',cv.width/2,70);
  cx.fillStyle='#8FB3AC';cx.font='13px monospace';
  cx.fillText('Vrms · '+FLBL[freqIdx],cv.width/2,100);
  cx.fillText(TOPOS[topKey].name,cv.width/2,130);
  fuenteBox.tex.needsUpdate=true;
}
function drawMedidorScreen(){
  const cx=medidorBox.cx,cv=medidorBox.cv;cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#06110d';cx.fillRect(0,0,cv.width,cv.height);
  const hide=(mode==='predice'&&!predRevealed);
  cx.fillStyle='#FFB703';cx.font='bold 20px monospace';cx.textAlign='center';
  cx.fillText(hide?'¿?':fmtV(RES?RES.vdc:0),cv.width/2,60);
  cx.fillStyle='#8FB3AC';cx.font='12px monospace';cx.fillText('Vdc',cv.width/2,80);
  cx.fillStyle='#4FD1C5';cx.font='bold 16px monospace';
  cx.fillText(hide?'¿?':fmtV(RES?RES.vrpp:0),cv.width/2,115);
  cx.fillStyle='#8FB3AC';cx.font='12px monospace';cx.fillText('Vr(pp)',cv.width/2,133);
  medidorBox.tex.needsUpdate=true;
}
function refreshBenchSel(){
  const n=TOPOS[topKey].ndiodos;
  DIO3D.forEach((d,i)=>{d.g.visible=i<n;d.body.material.color.setHex(curD().color);});
  const bd=bandsFor(curR());
  bandMeshes[0].material.color.set(BAND_COLORS[bd.d1]);
  bandMeshes[1].material.color.set(BAND_COLORS[bd.d2]);
  bandMeshes[2].material.color.set(BAND_COLORS[Math.max(0,Math.min(9,bd.mult))]);
  capG.visible=Cidx>0;
}
function refreshBenchDyn(){drawFuenteScreen();drawMedidorScreen();}

/* ---------- 6) HUD + panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Electrónica analógica y de potencia (D2)</div>
  <h2>Rectificadores: de CA a CD</h2>
  <p>Un rectificador convierte corriente alterna en corriente <b>pulsante unidireccional</b>; el capacitor de filtro la
  suaviza en <b>CD con rizo</b>. Aquí resuelves en vivo la ecuación diferencial exacta del capacitor
  (no la fórmula lineal aproximada) contra tres topologías reales: <b>media onda</b>, <b>center-tap</b> y <b>puente</b> —
  cada una con su propio compromiso entre PIV requerido, número de diodos y frecuencia de rizo.</p>
  <div class="formula">Vm = √2·Vrms · rizo: r = Vr(pp) / (2√3·Vdc) · PIV según topología (ver esquema)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8FB3AC"></span>Vin (secundario, punteado)</div>
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Vout (salida rectificada)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Vdc (promedio, línea punteada)</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> Shockley con parámetros tipo SPICE anclados al Vf de hoja de datos ⚑ · transitorio EXACTO
  del capacitor por Runge-Kutta 4 (no la aproximación lineal de rizo) · PIV por fórmula específica de topología
  (2Vm−Vf en media onda con filtro y center-tap, Vm−Vf en puente) y medido directamente de la forma de onda cuando
  el modelo lo permite · duplicación real de la frecuencia de rizo en center-tap/puente.<br>
  <span class="no">NO:</span> recuperación inversa (t_rr) · núcleo/fugas del transformador (fuente ideal) ·
  derrateo térmico ni ESR/envejecimiento del capacitor · ruptura por avalancha · distorsión de línea real ni EMI ·
  fórmula de corriente de pico del diodo (existen variantes publicadas incompatibles — se omite a propósito) ·
  variación de Vf con T (fija a 27 °C — el lab de la curva I–V del diodo ya cubre la térmica a fondo).</div>
  <div class="src">Ref: Vishay 1N4001–4007 · ST 1N5817–5819 · Diodes Inc. DB101–DB107 ⚑ · Boylestad–Nashelsky · Sedra–Smith · IEC 60617</div>`;
document.getElementById('panel').innerHTML=`
  <h4>Banco de rectificación · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_predice">🔮 Predice</button>
    <button class="b" id="m_barrido">📉 Barrido</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>
  <div class="modebar" id="tbar">
    <button class="b" id="t_halfwave">Media onda</button>
    <button class="b" id="t_centertap">Center-tap</button>
    <button class="b on" id="t_bridge">Puente</button>
  </div>
  <div class="modebar" id="dbar">
    <button class="b on" id="d_si">Si 1N4007</button>
    <button class="b" id="d_sch">Schottky 1N5819</button>
  </div>
  <div style="font-size:12px;margin:6px 0 2px">Vrms (secundario) · <b id="vsv" class="mono">12.0 V</b></div>
  <input type="range" id="sVrms" min="4" max="24" step="0.5" value="12" style="width:100%;accent-color:#4FD1C5">
  <div class="modebar" id="fbar">
    <button class="b" id="f_0">50 Hz</button>
    <button class="b on" id="f_1">60 Hz (MX)</button>
  </div>
  <div class="modebar" style="flex-wrap:wrap;margin-top:6px" id="rbar">
    ${RVALS.map((r,i)=>'<button class="b'+(i===2?' on':'')+'" style="flex:1 0 30%" id="r_'+i+'">'+RLBL[i]+' Ω</button>').join('')}
  </div>
  <div class="modebar" style="flex-wrap:wrap;margin-top:4px" id="cbar">
    ${CVALS.map((cv,i)=>'<button class="b'+(i===0?' on':'')+'" style="flex:1 0 22%" id="c_'+i+'">'+CLBL[i]+'</button>').join('')}
  </div>
  <div id="tele">
    <div class="g"><div class="gl"><span>Vdc</span><b id="t_vdc">—</b></div></div>
    <div class="g"><div class="gl"><span>Vr(pp)</span><b id="t_vrpp">—</b></div></div>
    <div class="g"><div class="gl"><span>Rizo r</span><b id="t_r">—</b></div></div>
    <div class="g"><div class="gl"><span>Frec. de rizo</span><b id="t_fr">—</b></div></div>
    <div class="g"><div class="gl"><span>PIV requerido</span><b id="t_piv">—</b></div></div>
    <div class="g"><div class="gl"><span>PIV medido</span><b id="t_pivm">—</b></div></div>
    <div class="g"><div class="gl"><span>Id prom./diodo</span><b id="t_id">—</b></div></div>
    <div class="g"><div class="gl"><span>Id pico/diodo</span><b id="t_ip">—</b></div></div>
  </div>
  <div class="console" id="report"></div>
  <div id="predBox" style="display:none">
    <h4 class="sec">Tu predicción (antes de revelar)</h4>
    <div style="font-size:12px;color:#8FB3AC;margin-bottom:6px" id="predHint"></div>
    <div style="font-size:12px;margin:4px 0 2px">Frecuencia de rizo</div>
    <div class="modebar" id="pfbar">
      <button class="b" id="pf_1">1× línea</button>
      <button class="b" id="pf_2">2× línea</button>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
      <span style="white-space:nowrap">Vdc=<input id="inVdc" inputmode="decimal" style="width:56px;background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px" placeholder="V"></span>
      <span style="white-space:nowrap">Vr(pp)=<input id="inVrpp" inputmode="decimal" style="width:56px;background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px" placeholder="V"></span>
      <span style="white-space:nowrap">PIV=<input id="inPiv" inputmode="decimal" style="width:56px;background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px" placeholder="V"></span>
    </div>
    <div style="font-size:12px;margin:6px 0 2px">¿Circuito seguro (PIV y corriente dentro de rating)?</div>
    <div class="modebar" id="psbar">
      <button class="b" id="ps_si">Sí, seguro</button>
      <button class="b" id="ps_no">No, excede</button>
    </div>
    <button class="b primary" id="btnPred" style="margin-top:8px;width:100%">🔎 Revelar y comparar</button>
    <div style="font-size:12px;margin-top:6px" id="predOut"></div>
    <button class="b" id="btnNewPred" style="width:100%;margin-top:6px">🔀 Nueva predicción</button>
  </div>
  <div id="barBox" style="display:none">
    <h4 class="sec">Barrido de capacitancia</h4>
    <div style="font-size:12px;color:#8FB3AC;margin-bottom:6px">Recorre C con Vrms, R, topología y dispositivo fijos, y mide Vr(pp) en cada paso.</div>
    <button class="b primary" id="btnSweepC" style="width:100%">▶ Barrer C</button>
  </div>
  <div id="retoBox" style="display:none">
    <h4 class="sec">Reto de diseño</h4>
    <div style="font-size:12px;color:#8FB3AC;margin-bottom:6px" id="retoHint"></div>
    <button class="b primary" id="btnReto" style="width:100%">✔ Comprobar mi diseño</button>
    <div style="font-size:12px;margin-top:6px" id="retoOut"></div>
    <button class="b" id="btnNewReto" style="width:100%;margin-top:6px">🔀 Nuevo reto</button>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;margin-bottom:6px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns" style="margin-top:8px">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado</button>
  </div>`;
const el=id=>document.getElementById(id);

/* ---------- 7) Toast ---------- */
let toastT=null;
function showToast(msg){const t=el('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),4200);}

/* ---------- 8) Modos ---------- */
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.1,2.5,7.2],[0.5,1.3,0.1]],
    mision:'Cambia topología, dispositivo, Vrms, R y C — observa cómo cambian Vdc, el rizo y el PIV que debe soportar cada diodo.'},
  predice:{nombre:'Predice',cam:[[-0.1,2.2,4.3],[-0.9,1.75,-0.8]],
    mision:'Se te da un circuito completo (topología, dispositivo, Vrms, R, C). Predice Vdc, Vr(pp), PIV y si es seguro — ANTES de ver el osciloscopio.'},
  barrido:{nombre:'Barrido',cam:[[-0.2,2.1,3.9],[-0.9,1.75,-0.8]],
    mision:'Recorre la capacitancia de filtro con todo lo demás fijo y confirma la relación inversa entre C y el rizo.'},
  reto:{nombre:'Reto',cam:[[0.6,2.3,5.6],[0.2,1.3,0.2]],
    mision:'Con R_L y la frecuencia de línea fijas, elige topología, dispositivo, Vrms y C para cumplir un objetivo de Vdc y rizo con margen de seguridad en el PIV.'},
};
function setMode(k){
  mode=k;solved=false;
  ['explora','predice','barrido','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('p_mision').textContent=MODE_META[k].mision;
  el('predBox').style.display=(k==='predice')?'block':'none';
  el('barBox').style.display=(k==='barrido')?'block':'none';
  el('retoBox').style.display=(k==='reto')?'block':'none';
  const lockAll=(k==='predice');
  ['t_halfwave','t_centertap','t_bridge','d_si','d_sch','sVrms','f_0','f_1'].forEach(id=>{
    if(el(id).tagName==='INPUT')el(id).disabled=lockAll;});
  RVALS.forEach((_,i)=>{});
  if(k==='predice'){
    if(!PRED)genPredice();
    applyPred();
    el('predHint').textContent='Dado: '+TOPOS[PRED.topKey].name+' · '+DIODES[PRED.dsel].name+' · Vrms='+PRED.Vrms.toFixed(1)+'V · '+FLBL[PRED.freqIdx]+' · R='+fmtR(RVALS[PRED.Ridx])+' · C='+fmtC(CVALS[PRED.Cidx])+' · tolerancia: ±5% Vdc, ±15% Vr(pp), ±10% PIV';
  }
  if(k==='reto'){
    if(!RETO)genReto();
    el('retoHint').textContent='Objetivo: Vdc ≈ '+fmtV(RETO.vdcTarget)+' (±5%) con rizo r ≤ '+RETO.rippleMaxPct.toFixed(1)+'% · R_L fija = '+fmtR(RETO.rl)+' · '+FLBL[RETO.freqIdx]+' (fijas) · elige topología, dispositivo, Vrms y C, y deja el PIV con ≥1.4× margen sobre el VRRM.';
  }
  syncCtrlBtns();clearDx();refreshQuestion();refreshBenchSel();refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}
function applyPred(){topKey=PRED.topKey;dsel=PRED.dsel;freqIdx=PRED.freqIdx;Ridx=PRED.Ridx;Cidx=PRED.Cidx;Vrms=PRED.Vrms;
  el('sVrms').value=Vrms;el('vsv').textContent=Vrms.toFixed(1)+' V';}
function syncCtrlBtns(){
  TOPO_KEYS.forEach(k=>el('t_'+k).classList.toggle('on',k===topKey));
  ['si','sch'].forEach(k=>el('d_'+k).classList.toggle('on',k===dsel));
  [0,1].forEach(i=>el('f_'+i).classList.toggle('on',i===freqIdx));
  RVALS.forEach((_,i)=>el('r_'+i).classList.toggle('on',i===Ridx));
  CVALS.forEach((_,i)=>el('c_'+i).classList.toggle('on',i===Cidx));
  const bridgeLock=(topKey==='bridge');
  el('d_si').disabled=bridgeLock||mode==='predice';el('d_sch').disabled=bridgeLock||mode==='predice';
}
function selTopo(k){
  if(mode==='predice'){showToast('En Predice el circuito es fijo — usa el mostrado.');return;}
  if(topKey===k)return;
  topKey=k;if(k==='bridge')dsel='si';
  onChange();
}
function selDiode(k){
  if(mode==='predice'){showToast('En Predice el circuito es fijo — usa el mostrado.');return;}
  if(topKey==='bridge'){showToast('El puente DB107 se modela con silicio integrado — no es seleccionable por separado.');return;}
  if(dsel===k)return;dsel=k;onChange();
}
function onChange(){syncCtrlBtns();buildQuiz();clearDx();refreshQuestion();refreshBenchSel();refreshAll();}

/* ---------- 9) Telemetría + reporte ---------- */
function set(id,txt,cls){const n=el(id);n.textContent=txt;n.classList.remove('good','warn','bad');if(cls)n.classList.add(cls);}
function updateTele(){
  const hide=(mode==='predice'&&!predRevealed);
  if(hide||!RES){['t_vdc','t_vrpp','t_r','t_fr','t_piv','t_pivm','t_id','t_ip'].forEach(id=>set(id,'¿?','warn'));return;}
  const d=curD(),rt=ratingsFor(topKey,d);
  const idc=perDiodeAvg(topKey,RES.vdc,curR());
  const ip=peakDiodeCurrent(topKey,d,RES.samples);
  const piv=pivFormula(topKey,d,Vrms,curC(),RES.vdc/curR());
  const pivm=measuredPIV(topKey,RES.samples);
  const r=rippleFactorPct(RES.vrpp,RES.vdc);
  set('t_vdc',fmtV(RES.vdc),'good');
  set('t_vrpp',fmtV(RES.vrpp),'good');
  set('t_r',r.toFixed(1)+' %',r>15?'warn':'good');
  set('t_fr',TOPOS[topKey].kRipple+'× línea = '+(TOPOS[topKey].kRipple*curF())+' Hz','good');
  set('t_piv',fmtV(piv),piv>rt.vrrm?'bad':piv>0.7*rt.vrrm?'warn':'good');
  set('t_pivm',pivm===null?'— (no observable)':fmtV(pivm),'good');
  set('t_id',fmtI(idc),idc>rt.ifAvg?'bad':idc>0.7*rt.ifAvg?'warn':'good');
  set('t_ip',fmtI(ip),(rt.ifsm&&ip>rt.ifsm)?'bad':'good');
}
function updateReport(){
  const L=[];
  if(mode==='explora'){
    L.push('Motor: EDO exacta del capacitor (Runge-Kutta 4), '+(RES&&RES.converged?'convergida':'sin converger — reduce R·C o revisa parámetros')+'.');
    L.push('VRRM/IFAV de referencia: '+ratingsFor(topKey,curD()).name+' (VRRM='+ratingsFor(topKey,curD()).vrrm+'V, IF(AV)='+ratingsFor(topKey,curD()).ifAvg+'A).');
    if(Cidx===0)L.push('Sin filtro: Vout sigue la envolvente rectificada cruda (rizo = 100% de Vm aprox.).');
  } else if(mode==='predice'){
    L.push(predRevealed?'Compara tu predicción contra los valores reales ya revelados en el osciloscopio y la telemetría.':'Completa tu predicción y pulsa "Revelar y comparar".');
  } else if(mode==='barrido'){
    if(SWEEPC.length){
      SWEEPC.forEach(p=>L.push('C='+fmtC(p.c)+' → Vr(pp)='+fmtV(p.vrpp)+' · Vdc='+fmtV(p.vdc)));
      if(SWEEPC.slope!==undefined)L.push('Pendiente log-log Vr(pp) vs C ≈ '+SWEEPC.slope.toFixed(2)+' (esperado ≈ −1: relación inversa).');
    } else L.push('Pulsa "Barrer C" para recorrer la capacitancia con el resto del circuito fijo.');
  } else if(mode==='reto'){
    if(RES){
      const r=rippleFactorPct(RES.vrpp,RES.vdc);
      L.push('Actual: Vdc='+fmtV(RES.vdc)+' (objetivo '+fmtV(RETO.vdcTarget)+') · rizo='+r.toFixed(1)+'% (máx '+RETO.rippleMaxPct.toFixed(1)+'%)');
    }
    L.push(retoSolved?'✔ Diseño válido.':'Ajusta topología, dispositivo, Vrms o C y vuelve a comprobar.');
  }
  el('report').innerHTML=L.map(x=>'<div>• '+x+'</div>').join('');
}
function refreshAll(){
  RES=rectify(topKey,curD(),Vrms,curF(),curR(),curC());
  drawBoard();updateTele();updateReport();refreshBenchDyn();
}

/* ---------- 10) Barrido de capacitancia ---------- */
async function runSweepC(){
  if(sweeping)return;
  sweeping=true;el('btnSweepC').disabled=true;
  const lock={topKey,dsel,Vrms,freqIdx,Ridx};
  SWEEPC=[];
  for(let ci=1;ci<CVALS.length;ci++){
    if(topKey!==lock.topKey||dsel!==lock.dsel||Vrms!==lock.Vrms||freqIdx!==lock.freqIdx||Ridx!==lock.Ridx)break;
    const res=rectify(lock.topKey,DIODES[lock.dsel],lock.Vrms,FREQS[lock.freqIdx],RVALS[lock.Ridx],CVALS[ci]);
    SWEEPC.push({c:CVALS[ci],vrpp:res.vrpp,vdc:res.vdc});
    Cidx=ci;syncCtrlBtns();synth.beep(500+30*ci,.05,.05);refreshAll();await sleep(260);
  }
  if(SWEEPC.length>=2){
    const xs=SWEEPC.map(p=>Math.log10(p.c)),ys=SWEEPC.map(p=>Math.log10(Math.max(p.vrpp,1e-6)));
    const n=xs.length,sx=xs.reduce((a,b)=>a+b,0),sy=ys.reduce((a,b)=>a+b,0);
    const sxy=xs.reduce((a,x,i)=>a+x*ys[i],0),sxx=xs.reduce((a,x)=>a+x*x,0);
    SWEEPC.slope=(n*sxy-sx*sy)/(n*sxx-sx*sx);
  }
  sweeping=false;el('btnSweepC').disabled=false;
  showToast('Barrido completo — revisa la relación Vr(pp) vs C en el reporte.');
  refreshAll();
}

/* ---------- 11) Predice ---------- */
function checkPredice(){
  if(!PRED)return;
  const wantMult=parseInt((el('pf_1').classList.contains('on')?'1':el('pf_2').classList.contains('on')?'2':'0'));
  const vdcIn=parseFloat(el('inVdc').value),vrppIn=parseFloat(el('inVrpp').value),pivIn=parseFloat(el('inPiv').value);
  const safeIn=el('ps_si').classList.contains('on')?true:el('ps_no').classList.contains('on')?false:null;
  const okMult=wantMult===TOPOS[PRED.topKey].kRipple;
  const okVdc=Number.isFinite(vdcIn)&&Math.abs(vdcIn-PRED.res.vdc)<=0.05*PRED.res.vdc;
  const okVrpp=Number.isFinite(vrppIn)&&Math.abs(vrppIn-PRED.res.vrpp)<=0.15*Math.max(PRED.res.vrpp,0.05);
  const okPiv=Number.isFinite(pivIn)&&Math.abs(pivIn-PRED.piv)<=0.10*PRED.piv;
  const okSafe=(safeIn===PRED.safe);
  predSolved=okMult&&okVdc&&okVrpp&&okPiv&&okSafe;predRevealed=true;solved=predSolved;
  const chip=(ok)=>ok?'✔':'✘';
  el('predOut').innerHTML=
    chip(okMult)+' frecuencia de rizo ('+TOPOS[PRED.topKey].kRipple+'× real) · '+
    chip(okVdc)+' Vdc (real '+fmtV(PRED.res.vdc)+') · '+
    chip(okVrpp)+' Vr(pp) (real '+fmtV(PRED.res.vrpp)+') · '+
    chip(okPiv)+' PIV (real '+fmtV(PRED.piv)+') · '+
    chip(okSafe)+' seguridad (real: '+(PRED.safe?'segura':'excede rating')+')<br>'+
    (predSolved?'✔ Predicción correcta en los 5 puntos.':'Revisa las diferencias arriba y compáralas con el osciloscopio ya revelado.');
  synth.beep(predSolved?980:220,.15,.07);
  refreshAll();
}
function newPredice(){genPredice();applyPred();syncCtrlBtns();el('predOut').innerHTML='';
  el('predHint').textContent='Dado: '+TOPOS[PRED.topKey].name+' · '+DIODES[PRED.dsel].name+' · Vrms='+PRED.Vrms.toFixed(1)+'V · '+FLBL[PRED.freqIdx]+' · R='+fmtR(RVALS[PRED.Ridx])+' · C='+fmtC(CVALS[PRED.Cidx])+' · tolerancia: ±5% Vdc, ±15% Vr(pp), ±10% PIV';
  refreshAll();}

/* ---------- 12) Reto ---------- */
function checkReto(){
  if(!RETO)return;
  const d=curD(),res=rectify(topKey,d,Vrms,FREQS[RETO.freqIdx],RETO.rl,curC());
  const r=rippleFactorPct(res.vrpp,res.vdc);
  const piv=pivFormula(topKey,d,Vrms,curC(),res.vdc/RETO.rl);
  const rt=ratingsFor(topKey,d);
  const okVdc=Math.abs(res.vdc-RETO.vdcTarget)<=(RETO.vdcTolPct/100)*RETO.vdcTarget;
  const okRipple=r<=RETO.rippleMaxPct;
  const okPiv=piv*1.4<=rt.vrrm;
  retoSolved=okVdc&&okRipple&&okPiv;solved=retoSolved;
  el('retoOut').innerHTML=
    (okVdc?'✔':'✘')+' Vdc='+fmtV(res.vdc)+' (objetivo '+fmtV(RETO.vdcTarget)+') · '+
    (okRipple?'✔':'✘')+' rizo='+r.toFixed(1)+'% (máx '+RETO.rippleMaxPct.toFixed(1)+'%) · '+
    (okPiv?'✔':'✘')+' PIV·1.4='+fmtV(piv*1.4)+' ≤ VRRM='+rt.vrrm+'V<br>'+
    (retoSolved?'✔ Diseño válido.':'Ajusta topología, dispositivo, Vrms o C.');
  synth.beep(retoSolved?980:220,.15,.07);
  refreshAll();
}
function newReto(){genReto();retoSolved=false;el('retoOut').innerHTML='';
  el('retoHint').textContent='Objetivo: Vdc ≈ '+fmtV(RETO.vdcTarget)+' (±5%) con rizo r ≤ '+RETO.rippleMaxPct.toFixed(1)+'% · R_L fija = '+fmtR(RETO.rl)+' · '+FLBL[RETO.freqIdx]+' (fijas) · elige topología, dispositivo, Vrms y C, y deja el PIV con ≥1.4× margen sobre el VRRM.';
  refreshAll();}

/* ---------- 13) Quiz de ingeniería ---------- */
let QUIZ={};
function buildQuiz(){
  const vm=Math.SQRT2*Vrms;
  QUIZ={
    explora:{pregunta:'Con filtro capacitivo, ¿por qué un diodo de media onda necesita soportar PIV ≈ 2Vm y no solo Vm?',
      opciones:[
        {t:'Porque el capacitor queda cargado cerca de +Vm justo cuando la fuente cae a −Vm, y el diodo ve la diferencia entre ambos.',ok:true,
         why:'Correcto: sin filtro el diodo solo ve Vm (la fuente cuando el diodo no conduce). Con filtro, el capacitor retiene +Vm mientras la fuente oscila hasta −Vm — el diodo bloqueado ve la suma de ambos, ≈2Vm.'},
        {t:'Porque el diodo conduce el doble de tiempo con filtro.',ok:false,why:'Al revés: con filtro el diodo conduce MENOS tiempo (solo cerca del pico), no más — el PIV mayor viene de la carga retenida en el capacitor, no del tiempo de conducción.'},
        {t:'Porque la frecuencia de rizo se duplica.',ok:false,why:'La frecuencia de rizo en media onda sigue siendo 1× la de línea, con o sin filtro — eso no cambia el PIV.'},
      ]},
    predice:{pregunta:'¿Por qué la frecuencia de rizo es 2× la de línea en center-tap y puente, pero solo 1× en media onda?',
      opciones:[
        {t:'Porque en center-tap/puente hay un pulso de carga por CADA semiciclo de la CA (positivo y negativo), mientras que en media onda solo el semiciclo positivo produce un pulso.',ok:true,
         why:'Correcto: onda completa rectifica ambos semiciclos, así que el capacitor recibe un pulso de recarga cada medio periodo de línea → el doble de pulsos por segundo que en media onda.'},
        {t:'Porque center-tap y puente usan más diodos, y más diodos siempre significan más rizo.',ok:false,why:'Más diodos no implica más rizo — de hecho onda completa tiene MENOS rizo que media onda para el mismo C y R, precisamente porque recarga el doble de veces por segundo.'},
        {t:'Porque el transformador entrega el doble de voltaje.',ok:false,why:'El voltaje del transformador no determina la frecuencia de rizo; lo que importa es cuántos pulsos de corriente de carga llegan al capacitor por segundo.'},
      ]},
    barrido:{pregunta:'Si duplicas la capacitancia de filtro C (con todo lo demás fijo), ¿qué le pasa aproximadamente al rizo Vr(pp)?',
      opciones:[
        {t:'Se reduce a aproximadamente la mitad — Vr(pp) es aproximadamente inversamente proporcional a C.',ok:true,
         why:'Correcto: el capacitor se descarga sobre R_L entre pulsos; el doble de capacitancia retiene el doble de carga para la misma caída de voltaje, así que la caída (el rizo) se reduce a la mitad — de ahí la pendiente ≈ −1 en log-log que mide el barrido.'},
        {t:'Se mantiene igual — C no afecta el rizo, solo Vdc.',ok:false,why:'C es precisamente el parámetro que controla el rizo: más capacitancia sostiene mejor el voltaje entre pulsos de carga.'},
        {t:'Se duplica también.',ok:false,why:'Es la relación opuesta — más capacitancia significa MENOS rizo, no más.'},
      ]},
    reto:{pregunta:'A igual Vdc de salida, ¿por qué el puente es la topología de onda completa más usada en fuentes reales frente al center-tap?',
      opciones:[
        {t:'Porque el puente solo requiere PIV ≈ Vm (la mitad que el center-tap, que requiere ≈2Vm) usando un transformador de un solo devanado secundario, aunque a costa de 2 caídas de diodo en vez de 1.',ok:true,
         why:'Correcto: es el compromiso clásico — el puente permite diodos de menor VRRM y un transformador más simple (sin center-tap), pagando el precio de una caída de voltaje extra (2 uniones en serie) frente al center-tap.'},
        {t:'Porque el puente tiene menos rizo que el center-tap para el mismo C.',ok:false,why:'Ambas topologías de onda completa tienen la MISMA frecuencia de rizo (2× línea) y, en igualdad de condiciones, un rizo comparable — esa no es la diferencia clave entre ellas.'},
        {t:'Porque el puente usa menos diodos.',ok:false,why:'Es al revés: el puente usa 4 diodos y el center-tap solo 2 — la ventaja del puente es el PIV y el transformador más simple, no el conteo de diodos.'},
      ]},
  };
}
function clearDx(){el('dxbtns').innerHTML='';}
function refreshQuestion(){
  const q=QUIZ[mode];if(!q)return;
  el('q_text').textContent=q.pregunta;
  el('dxbtns').innerHTML='';
  const opciones=q.opciones.slice();
  for(let i=opciones.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [opciones[i],opciones[j]]=[opciones[j],opciones[i]];
  }
  opciones.forEach((o,i)=>{
    const b=document.createElement('button');
    b.className='b';b.style.textAlign='left';
    b.textContent='ABCD'[i]+') '+o.t;
    b.onclick=()=>{
      if(b.classList.contains('right')||b.classList.contains('wrong'))return;
      b.classList.add(o.ok?'right':'wrong');
      showToast((o.ok?'✔ ':'✘ ')+o.why);
      synth.beep(o.ok?980:220,o.ok?.12:.15,.07);
    };
    el('dxbtns').appendChild(b);
  });
}

/* ---------- 14) Picking, recorrido guiado, animación e init ---------- */
pickerFor(S.scene,S.camera,S.renderer.domElement,hit=>{
  if(hit.object===board&&hit.uv){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object,act=null;
  while(o){if(o.userData&&o.userData.act){act=o.userData.act;break;}o=o.parent;}
  if(!act)return;
  synth.beep(700,.05,.05);
  if(act==='src3d')showToast('Fuente CA (secundario) · Vrms = '+Vrms.toFixed(1)+' V · '+FLBL[freqIdx]);
  else if(act==='topo3d'){
    if(mode==='predice'){showToast('En Predice el circuito es fijo.');return;}
    const i=TOPO_KEYS.indexOf(topKey);topKey=TOPO_KEYS[(i+1)%TOPO_KEYS.length];
    if(topKey==='bridge')dsel='si';onChange();
  }
  else if(act==='res3d'){
    if(mode==='predice'||mode==='reto'){showToast(mode==='reto'?'En el Reto, R_L está fija (parte del objetivo).':'En Predice el circuito es fijo.');return;}
    Ridx=(Ridx+1)%RVALS.length;onChange();
  }
  else if(act==='cap3d'){
    if(mode==='predice'){showToast('En Predice el circuito es fijo.');return;}
    Cidx=(Cidx+1)%CVALS.length;onChange();
  }
});
(function(){
  const ray=new THREE.Raycaster(),dom=S.renderer.domElement;
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    const mx=((e.clientX-r.left)/r.width)*2-1, my=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera({x:mx,y:my},S.camera);
    const hits=ray.intersectObjects(S.scene.children,true);
    let title='';
    for(const h of hits){let o=h.object;while(o){if(o.userData&&o.userData.title){title=o.userData.title;break;}o=o.parent;}if(title)break;}
    dom.style.cursor=title?'pointer':'default';dom.title=title;
  });
})();
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const b=el('btnAuto');b.disabled=true;b.textContent='✨ Recorriendo…';
  try{
    synth.init();synth.resume();
    setMode('explora');topKey='halfwave';dsel='si';Cidx=0;syncCtrlBtns();onChange();
    showToast('1/5 · Media onda sin filtro: solo pasa el semiciclo positivo — mira el hueco en Vout.');
    await sleep(3000);
    Cidx=4;syncCtrlBtns();onChange();
    showToast('2/5 · Con filtro, el capacitor sostiene Vout entre pulsos — y el PIV sube a ≈2Vm.');
    await sleep(3000);
    topKey='bridge';dsel='si';syncCtrlBtns();onChange();
    showToast('3/5 · Puente: onda completa, PIV≈Vm (la mitad), pero 2 caídas de diodo en vez de 1.');
    await sleep(3000);
    setMode('barrido');
    await runSweepC();
    showToast('4/5 · El barrido confirma: más C, menos rizo — pendiente log-log ≈ −1.');
    await sleep(2600);
    setMode('reto');
    showToast('5/5 · Reto: ajusta el circuito para cumplir el objetivo con margen de seguridad en el PIV.');
    await sleep(2600);
  } finally { autoRunning=false;b.disabled=false;b.textContent='✨ Recorrido guiado'; }
}
S.setAnimate(()=>{});

el('m_explora').onclick=()=>setMode('explora');
el('m_predice').onclick=()=>setMode('predice');
el('m_barrido').onclick=()=>setMode('barrido');
el('m_reto').onclick=()=>setMode('reto');
TOPO_KEYS.forEach(k=>el('t_'+k).onclick=()=>selTopo(k));
el('d_si').onclick=()=>selDiode('si');el('d_sch').onclick=()=>selDiode('sch');
el('sVrms').addEventListener('input',()=>{
  if(mode==='predice'){el('sVrms').value=Vrms;return;}
  Vrms=parseFloat(el('sVrms').value);el('vsv').textContent=Vrms.toFixed(1)+' V';refreshAll();
});
[0,1].forEach(i=>el('f_'+i).onclick=()=>{
  if(mode==='predice'||mode==='reto'){showToast(mode==='reto'?'En el Reto, la frecuencia de línea está fija (parte del objetivo).':'En Predice el circuito es fijo.');return;}
  freqIdx=i;onChange();
});
RVALS.forEach((_,i)=>el('r_'+i).onclick=()=>{
  if(mode==='predice'||mode==='reto'){showToast(mode==='reto'?'En el Reto, R_L está fija (parte del objetivo).':'En Predice el circuito es fijo.');return;}
  Ridx=i;onChange();
});
CVALS.forEach((_,i)=>el('c_'+i).onclick=()=>{
  if(mode==='predice'){showToast('En Predice el circuito es fijo.');return;}
  if(sweeping)return;
  Cidx=i;onChange();
});
el('btnSweepC').onclick=runSweepC;
el('btnPred').onclick=checkPredice;
el('btnNewPred').onclick=newPredice;
el('btnReto').onclick=checkReto;
el('btnNewReto').onclick=newReto;
el('btnAuto').onclick=runAuto;
['pf_1','pf_2'].forEach(id=>el(id).onclick=()=>{el('pf_1').classList.toggle('on',id==='pf_1');el('pf_2').classList.toggle('on',id==='pf_2');});
['ps_si','ps_no'].forEach(id=>el(id).onclick=()=>{el('ps_si').classList.toggle('on',id==='ps_si');el('ps_no').classList.toggle('on',id==='ps_no');});

/* init */
genReto();buildQuiz();syncCtrlBtns();refreshBenchSel();
S.start();setMode('explora');
window.__labDebug={
  state:()=>({mode,topKey,dsel,Vrms,freq:curF(),R:curR(),C:curC(),sweeping,predRevealed,predSolved,retoSolved}),
  res:()=>RES?{...RES,samples:RES.samples.map(p=>({...p}))}:null,
  pred:()=>PRED?JSON.parse(JSON.stringify({...PRED,res:{...PRED.res,samples:undefined}})):null,
  reto:()=>RETO?{...RETO}:null,
  sweep:()=>SWEEPC.map(p=>({...p})),
  rectify:(tk,dk,vr,fr,rl,c)=>rectify(tk,DIODES[dk],vr,fr,rl,c),
  pivFormula:(tk,dk,vr,c,idc)=>pivFormula(tk,DIODES[dk],vr,c,idc),
  measuredPIV:(tk,samples)=>measuredPIV(tk,samples),
  vAtI:(dk,i)=>vAtI(DIODES[dk],i),
  inrush:()=>inrushPeak(topKey,curD(),Vrms,curF(),curR(),curC()),
  setTopo:selTopo,setDevice:selDiode,
  setVrms:v=>{if(mode==='predice')return;Vrms=v;el('sVrms').value=v;el('vsv').textContent=v.toFixed(1)+' V';refreshAll();},
  setFreq:i=>{if(mode==='predice'||mode==='reto')return;freqIdx=i;onChange();},
  setR:i=>{if(mode==='predice'||mode==='reto')return;Ridx=i;onChange();},
  setC:i=>{if(mode==='predice')return;Cidx=i;onChange();},
  mode:()=>mode,setMode,
  checkPredice,newPredice,checkReto,newReto,sweepC:runSweepC,
  boardClick,
};
