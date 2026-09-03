/* ============================================================
   LAB — CURVA I–V DEL DIODO: TRAZADOR Y AJUSTE EXPONENCIAL
   (Dominio D2 · Electrónica analógica y de potencia — molde S+P:
    esquemático IEC 60617 con motor de cálculo + trazador/instrumentos)
   Normatividad / referencia: IEC 60617; Shockley (1949); SPICE2 (UCB 1975)
   Modelo de ingeniería (didáctico): I = Is·(e^(V/(n·VT)) − 1); VT = kT/q;
   ley de temperatura de SPICE para Is(T) (XTI, Eg) — el coeficiente
   térmico ≈ −2 mV/K del silicio EMERGE de la física, no está programado.
   Punto Q exacto por bisección sobre la recta de carga Id = (Vs − Vd)/R.
   NO modela: Rs serie, alta inyección, ruptura inversa, capacidades,
   autocalentamiento, dispersión entre unidades.
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.1,2.5,7.2],target:[0.5,1.3,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ---------- 1 · Modelo físico (Shockley + ley de temperatura SPICE) ---------- */
const KB=1.380649e-23, QE=1.602176634e-19, TNOM=300.15;      // 27 °C = TNOM de SPICE
const VT=T=>KB*T/QE;                                          // voltaje térmico kT/q
function isAtT(d,T){                                          // Is(T) — SPICE2
  return d.Is*Math.pow(T/TNOM,d.XTI/d.n)*Math.exp((T/TNOM-1)*d.Eg/(d.n*VT(T)));
}
const iDiode=(d,T,v)=>isAtT(d,T)*Math.expm1(v/(d.n*VT(T)));   // I(V)
const vDiode=(d,T,i)=>d.n*VT(T)*Math.log(i/isAtT(d,T)+1);     // V(I) (i>0)
function solveQ(d,T,vs,r){                                    // Q exacto: bisección
  let lo=0,hi=Math.max(vs,0.1);                               // f(v)=(vs−v)/r−I(v) decrece
  for(let k=0;k<80;k++){const m=(lo+hi)/2;((vs-m)/r-iDiode(d,T,m)>=0)?lo=m:hi=m;}
  const vd=(lo+hi)/2;return{vd,id:Math.max(0,(vs-vd)/r)};
}
/* Parámetros "tipo" de modelos SPICE publicados ⚑ (contrastar hoja de datos) */
const DIODES={
  si :{name:'Silicio (tipo 1N4148)', Is:2.52e-9, n:1.752, Eg:1.11, XTI:3, ifmax:0.2,  ifTxt:'200 mA', color:'#e8a13a', xmax:0.9},
  sch:{name:'Schottky (tipo 1N5819)',Is:31.7e-6, n:1.373, Eg:0.69, XTI:2, ifmax:1.0,  ifTxt:'1 A',    color:'#9ec1d4', xmax:0.5},
  led:{name:'LED rojo (didáctico)',  Is:1e-14,   n:2.6,   Eg:1.9,  XTI:3, ifmax:0.02, ifTxt:'20 mA',  color:'#ff5a5a', xmax:2.4},
};
const RVALS=[100,220,330,470,680,1000,2200,4700];
const RLBL=['100','220','330','470','680','1k','2.2k','4.7k'];
const LADDER=[1e-6,1e-5,1e-4,1e-3,3e-3,1e-2];                 // corrientes del trazador (A)

/* ---------- 2 · Estado ---------- */
let mode='explora', dsel='si', Ridx=3, Vs=5.0, TC=27, logY=false;
let CAP=[];                                   // puntos capturados {v,i}
let fit=null, ajusteOK=false, ajMsg='';       // ajuste de 2 puntos
let MYST=null, retoSolved=false, retoMsg='';  // reto: diodo misterioso
let QPT={vd:0,id:0}, solved=false, autoRunning=false, sweeping=false;
const curDiode=()=>mode==='reto'?MYST:DIODES[dsel];
const TK=()=>TC+273.15;
const R=()=>RVALS[Ridx];

const fmtV=v=>Math.abs(v)<1?(v*1e3).toFixed(1)+' mV':v.toFixed(3)+' V';
const fmtI=i=>{const a=Math.abs(i);return a>=1e-3?(i*1e3).toFixed(2)+' mA':a>=1e-6?(i*1e6).toFixed(1)+' µA':(i*1e9).toFixed(2)+' nA';};
const fmtIs=s=>s>=1e-6?(s*1e6).toFixed(1)+' µA':s>=1e-9?(s*1e9).toFixed(2)+' nA':s>=1e-12?(s*1e12).toFixed(2)+' pA':(s*1e15).toFixed(2)+' fA';
const fmtR=v=>v>=1000?((v/1000)%1?(v/1000).toFixed(1):String(v/1000))+' kΩ':v+' Ω';

function fitPoints(){                          // P1: primer punto con I ≥ 30·Is (evita la zona I≈Is)
  if(CAP.length<2)return null;
  const s=isAtT(curDiode(),TK());
  let i1=CAP.findIndex(p=>p.i>=30*s);
  if(i1<0||i1>=CAP.length-1)i1=Math.max(0,CAP.length-2);
  return[CAP[i1],CAP[CAP.length-1]];
}
function genMystery(){
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  const n=+(1.2+Math.random()*1.8).toFixed(3);
  const lo=Math.max(0.35,0.30*n);              // garantiza Is ≤ ~1e-7 → punto de 10 µA válido
  const vf=+(lo+Math.random()*(1.9-lo)).toFixed(4);
  const Is=0.01/Math.exp(vf/(n*VT(TNOM)));
  MYST={name:'Diodo misterioso',n,Is,Eg:1.11,XTI:3,ifmax:Infinity,ifTxt:'—',color:'#FFB703',
        xmax:Math.ceil(vf*1.25*10)/10+0.1,Vs:pick([5,6,8,9,12]),R:pick([330,470,680,1000])};
  MYST.p1={v:vDiode(MYST,TNOM,1e-5),i:1e-5};
  MYST.p2={v:vDiode(MYST,TNOM,1e-2),i:1e-2};
  retoSolved=false;retoMsg='';
}

/* ---------- 3 · Materiales (colores planos + roughness alta, como el molde S) ---------- */
const std=o=>new THREE.MeshStandardMaterial(o);
const MAT={
  bench:  std({color:0x3a464d,roughness:0.85,metalness:0.05}),
  frame:  std({color:0x232a2e,roughness:0.95,metalness:0}),
  pcb:    std({color:0x14532d,roughness:0.62,metalness:0}),
  psu:    std({color:0x707c85,metalness:0.35,roughness:0.85}),
  scope:  std({color:0x1d2529,roughness:0.9,metalness:0}),
  lead:   std({color:0xbfc8ce,metalness:0.9,roughness:0.35}),
  trace:  std({color:0xc08a3e,metalness:0.8,roughness:0.5}),
  jackRed:std({color:0xc23434,roughness:0.55,metalness:0}),
  jackBlk:std({color:0x14181c,roughness:0.55,metalness:0}),
  cableRed:std({color:0x9e2b2b,roughness:1.0,metalness:0}),
  cableBlk:std({color:0x15181b,roughness:1.0,metalness:0}),
};
const BAND_COLORS=['#1a1a1a','#6b4226','#c73a3a','#d2691e','#e8c832','#3f8f3f','#2b5fb8','#7d3fc4','#8a8a8a','#e8e8e8'];
const BAND_NAMES=['negro','café','rojo','naranja','amarillo','verde','azul','violeta','gris','blanco'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1;const dd=Math.round(v/Math.pow(10,exp));
  return{d1:Math.floor(dd/10),d2:dd%10,mult:exp};}

/* ---------- 4 · Pizarrón: esquemático IEC + gráfica I–V ---------- */
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;
bTex.minFilter=THREE.LinearFilter;bTex.generateMipmaps=false;
const PX0=130,PX1=940,PY0=308,PY1=676;
const XMAX=()=>curDiode().xmax;
function yMaxLin(){const need=Math.max(1.05*Vs/R(),1.2e-3);
  for(const s of[2e-3,5e-3,1e-2,2e-2,5e-2,0.1,0.15])if(s>=need)return s;return 0.15;}
const YTICK={0.002:5e-4,0.005:1e-3,0.01:2e-3,0.02:5e-3,0.05:1e-2,0.1:2e-2,0.15:3e-2};
const xPix=v=>PX0+(v/XMAX())*(PX1-PX0);
function yPix(i,ym){
  if(logY){const t=(Math.log10(Math.max(i,1e-9))+6)/5;return PY1-t*(PY1-PY0);}
  return PY1-(i/ym)*(PY1-PY0);
}
function line(c,x1,y1,x2,y2,col,w,dash){c.strokeStyle=col;c.lineWidth=w||3;
  c.setLineDash(dash||[]);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);}
function rr(c,x,y,w,h,r,fill,stroke,lw){c.beginPath();c.roundRect(x,y,w,h,r);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.stroke();}}
function plotFn(c,fn,col,w,dash){
  const ym=yMaxLin();c.strokeStyle=col;c.lineWidth=w;c.setLineDash(dash||[]);
  c.beginPath();let pen=false;
  for(let px=PX0;px<=PX1;px+=3){
    const v=(px-PX0)/(PX1-PX0)*XMAX();const i=fn(v);
    const y=yPix(i,ym);
    if(!isFinite(y)||y<PY0-2||y>PY1+2){pen=false;continue;}
    pen?c.lineTo(px,y):c.moveTo(px,y);pen=true;
  }
  c.stroke();c.setLineDash([]);
}
const HIT=[
  {x:150,y:165,r:60,act:'src'},
  {x:450,y:100,r:60,act:'res'},
  {x:880,y:165,r:60,act:'dio'},
  {x:890,y:333,r:46,act:'log'},
];
function drawBoard(){
  const c=bCv.getContext('2d'),d=curDiode(),ym=yMaxLin(),hideQ=(mode==='reto'&&!retoSolved);
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.strokeStyle='#1E3A34';c.lineWidth=3;c.strokeRect(8,8,1008,752);
  c.font='bold 22px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('TRAZADOR I–V DEL DIODO · IEC 60617',26,42);
  if(mode==='reto'){c.textAlign='right';c.fillStyle='#FFB703';
    c.fillText(retoSolved?'✔ RETO RESUELTO':'🎯 RETO: dispositivo desconocido',998,42);}
  /* — esquemático (franja superior) — */
  const WY=100,BY=230;
  line(c,150,WY,880,WY,'#EAF4F1',4);line(c,150,BY,880,BY,'#EAF4F1',4);
  line(c,150,WY,150,129,'#EAF4F1',4);line(c,150,201,150,BY,'#EAF4F1',4);
  line(c,880,WY,880,131,'#EAF4F1',4);line(c,880,199,880,BY,'#EAF4F1',4);
  // fuente IEC (círculo + −)
  c.beginPath();c.arc(150,165,36,0,Math.PI*2);c.fillStyle='#0c1512';c.fill();
  c.strokeStyle='#f0a5a5';c.lineWidth=4;c.stroke();
  c.font='bold 24px system-ui';c.fillStyle='#f0a5a5';c.textAlign='center';
  c.fillText('+',150,152);c.fillText('−',150,190);
  c.font='bold 20px system-ui';c.textAlign='left';
  c.fillText('Vs · '+Vs.toFixed(2)+' V',200,170);
  // resistor IEC (rectángulo)
  c.fillStyle='#0c1512';c.fillRect(396,82,108,36);
  c.strokeStyle='#4FD1C5';c.lineWidth=4;c.strokeRect(402,85,96,30);
  c.font='bold 20px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';
  c.fillText('R · '+fmtR(R()),450,62);
  // flecha de corriente
  line(c,640,WY,700,WY,'#FFB703',5);
  c.beginPath();c.moveTo(712,WY);c.lineTo(694,WY-9);c.lineTo(694,WY+9);c.closePath();
  c.fillStyle='#FFB703';c.fill();
  c.font='bold 20px system-ui';c.textAlign='center';
  c.fillText('Id = '+(hideQ?'¿?':fmtI(QPT.id)),676,62);
  // diodo IEC (triángulo + barra, corriente hacia abajo)
  c.fillStyle='#0c1512';c.fillRect(848,133,64,66);
  c.beginPath();c.moveTo(858,141);c.lineTo(902,141);c.lineTo(880,173);c.closePath();
  c.fillStyle=d.color;c.fill();c.strokeStyle='#EAF4F1';c.lineWidth=3;c.stroke();
  line(c,858,177,902,177,'#EAF4F1',5);
  if(dsel==='led'&&mode!=='reto'){ // flechas de emisión (símbolo LED)
    line(c,906,150,922,134,'#ff8a8a',3);line(c,914,166,930,150,'#ff8a8a',3);
    c.beginPath();c.moveTo(925,131);c.lineTo(915,136);c.lineTo(921,142);c.closePath();c.fillStyle='#ff8a8a';c.fill();
    c.beginPath();c.moveTo(933,147);c.lineTo(923,152);c.lineTo(929,158);c.closePath();c.fill();
  }
  c.font='bold 19px system-ui';c.textAlign='right';c.fillStyle=d.color;
  c.fillText(mode==='reto'?'¿? (desconocido)':d.name,838,152);
  c.fillStyle='#FFB703';
  c.fillText('Vd = '+(hideQ?'¿?':fmtV(QPT.vd)),838,180);
  c.beginPath();c.arc(880,WY,7,0,Math.PI*2);c.fillStyle='#EAF4F1';c.fill();
  // tierra
  line(c,515,BY,515,252,'#EAF4F1',4);line(c,495,252,535,252,'#EAF4F1',4);
  line(c,502,260,528,260,'#EAF4F1',3);line(c,509,268,521,268,'#EAF4F1',2);
  // ecuación con parámetros vivos
  c.font='18px system-ui';c.textAlign='center';c.fillStyle='#8FB3AC';
  c.fillText('Shockley: I = Is·(e^(V/(n·VT)) − 1) · Is = '+(hideQ?'¿?':fmtIs(isAtT(d,TK())))+
    ' · n = '+(hideQ?'¿?':d.n.toFixed(3))+' · VT = '+(VT(TK())*1e3).toFixed(2)+' mV ('+TC+' °C)',512,285);
  /* — gráfica I–V — */
  c.strokeStyle='#1E3A34';c.lineWidth=2;c.strokeRect(PX0,PY0,PX1-PX0,PY1-PY0);
  c.font='bold 18px system-ui';c.textAlign='left';c.fillStyle='#8FB3AC';
  c.fillText(logY?'Id (escala log)':'Id (mA)',PX0,PY0-10);
  c.textAlign='right';c.fillText('Vd (V)',PX1,PY1+40);
  c.font='15px system-ui';
  if(logY){
    const dec=['1 µA','10 µA','100 µA','1 mA','10 mA','100 mA'];
    for(let k=0;k<6;k++){const y=yPix(Math.pow(10,-6+k),1);
      line(c,PX0,y,PX1,y,'#1E3A34',1);
      c.textAlign='right';c.fillStyle='#8FB3AC';c.fillText(dec[k],PX0-8,y+5);}
  }else{
    const tk=YTICK[ym]||ym/5;
    for(let i=0;i<=ym+1e-12;i+=tk){const y=yPix(i,ym);
      line(c,PX0,y,PX1,y,'#1E3A34',1);
      c.textAlign='right';c.fillStyle='#8FB3AC';
      c.fillText((i*1e3).toFixed(tk*1e3<1?1:0),PX0-8,y+5);}
  }
  const xt=XMAX()<=0.6?0.1:XMAX()<=1.2?0.2:0.4;
  for(let v=0;v<=XMAX()+1e-9;v+=xt){const x=xPix(v);
    line(c,x,PY0,x,PY1,'#1E3A34',1);
    c.textAlign='center';c.fillStyle='#8FB3AC';c.fillText(v.toFixed(1),x,PY1+22);}
  // curva del dispositivo (oculta en reto sin resolver)
  if(!hideQ)plotFn(c,v=>iDiode(d,TK(),v),'#4FD1C5',5);
  // curva ajustada (modo ajuste, punteada)
  if(ajusteOK&&fit&&mode!=='reto')plotFn(c,v=>fit.Is*Math.expm1(v/(fit.n*VT(TNOM))),'#f0a5a5',3,[10,7]);
  // recta de carga (solo lineal)
  if(!logY)plotFn(c,v=>(Vs-v)/R(),'#FFB703',4);
  // capturas del trazador
  const fp=(mode==='ajuste')?fitPoints():null;
  CAP.forEach(p=>{
    const x=xPix(p.v),y=yPix(p.i,ym);
    if(y<PY0-2||y>PY1+2||x>PX1)return;
    c.beginPath();c.arc(x,y,mode==='reto'?7:5,0,Math.PI*2);
    c.fillStyle=mode==='reto'?'#FFB703':'#8FB3AC';c.fill();
    if(mode==='reto'){c.font='bold 15px system-ui';c.textAlign='left';c.fillStyle='#FFB703';
      c.fillText('('+(p.v*1e3).toFixed(1)+' mV, '+fmtI(p.i)+')',x+10,y-8);}
  });
  if(fp)fp.forEach((p,k)=>{const x=xPix(p.v),y=yPix(p.i,ym);
    if(y<PY0-2||y>PY1+2)return;
    c.beginPath();c.arc(x,y,10,0,Math.PI*2);c.strokeStyle='#FFB703';c.lineWidth=3;c.stroke();
    c.font='bold 16px system-ui';c.textAlign='left';c.fillStyle='#FFB703';
    c.fillText('P'+(k+1),x+13,y-10);});
  // punto Q
  if(!hideQ&&!logY){
    const qx=xPix(QPT.vd),qy=yPix(QPT.id,ym);
    if(qx>=PX0&&qx<=PX1&&qy>=PY0&&qy<=PY1){
      line(c,qx,qy,qx,PY1,'#EAF4F1',1,[5,5]);line(c,PX0,qy,qx,qy,'#EAF4F1',1,[5,5]);
      c.beginPath();c.arc(qx,qy,8,0,Math.PI*2);c.fillStyle='#EAF4F1';c.fill();
      c.strokeStyle='#0c1512';c.lineWidth=2;c.stroke();
      c.font='bold 17px system-ui';c.textAlign='left';c.fillStyle='#EAF4F1';
      c.fillText('Q · '+fmtV(QPT.vd)+' · '+fmtI(QPT.id),Math.min(qx+14,780),Math.max(qy-14,PY0+20));
    }
  }
  // insignia LIN/LOG
  rr(c,846,318,88,30,8,'#11201c',logY?'#4FD1C5':'#8FB3AC',2);
  c.font='bold 15px system-ui';c.textAlign='center';
  c.fillStyle=logY?'#4FD1C5':'#8FB3AC';c.fillText(logY?'㏒ SEMILOG':'— LINEAL',890,338);
  bTex.needsUpdate=true;
}
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768,d=curDiode();
  const ym=yMaxLin(),hideQ=(mode==='reto'&&!retoSolved);
  if(!hideQ&&!logY){const qx=xPix(QPT.vd),qy=yPix(QPT.id,ym);
    if(Math.hypot(x-qx,y-qy)<40){
      showToast('Punto de operación Q — la recta de carga (Vs, R) cruza la curva del diodo aquí: Vd = '
        +fmtV(QPT.vd)+', Id = '+fmtI(QPT.id)+' · P = '+(QPT.vd*QPT.id*1e3).toFixed(1)+' mW');
      synth.beep(880,.06,.05);return;}}
  let best=null,bd=1e9;
  for(const h of HIT){const dd=Math.hypot(x-h.x,y-h.y);if(dd<h.r&&dd<bd){bd=dd;best=h;}}
  if(!best)return;
  synth.beep(720,.05,.05);
  if(best.act==='log'){toggleLog();return;}
  if(best.act==='src')showToast('Fuente Vs = '+Vs.toFixed(2)+' V (ideal, sin resistencia interna) — fija el extremo de la recta de carga: en Vd = 0, Id = Vs/R = '+fmtI(Vs/R())+'.');
  if(best.act==='res')showToast('R = '+fmtR(R())+' — limita la corriente: fija la pendiente −1/R de la recta de carga. Bandas: '+(()=>{const b=bandsFor(R());return BAND_NAMES[b.d1]+'-'+BAND_NAMES[b.d2]+'-'+BAND_NAMES[b.mult]+'-oro';})());
  if(best.act==='dio')showToast(mode==='reto'?'Dispositivo desconocido — solo tienes 2 puntos medidos (10 µA y 10 mA). Extrae n e Is y predice el punto Q.'
    :d.name+' — Is = '+fmtIs(isAtT(d,TK()))+', n = '+d.n.toFixed(3)+' · Vf @ 10 mA = '+fmtV(vDiode(d,TK(),0.01))+' ('+TC+' °C)');
}

/* ---------- 5 · Banco 3D ---------- */
const boardG=new THREE.Group();boardG.position.set(-1.05,0,-0.85);boardG.rotation.y=0.16;
S.scene.add(boardG);
// pizarrón físico
const bFrame=roundedBox(3.62,2.77,0.12,MAT.frame,0.03);
bFrame.position.set(0,1.85,0);boardG.add(bFrame);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.55),
  new THREE.MeshBasicMaterial({map:bTex,toneMapped:false}));
board.position.set(0,1.85,0.065);boardG.add(board);
board.userData={title:'Esquemático + gráfica I–V (toca los elementos)'};
// banco físico
const benchG=new THREE.Group();benchG.position.set(0.6,0,0.9);S.scene.add(benchG);
const mesa=roundedBox(2.6,0.5,1.9,MAT.bench,0.05);
mesa.position.set(1.55,0.25,0.75);benchG.add(mesa);
const pcb=roundedBox(1.9,0.06,1.1,MAT.pcb,0.02);
pcb.position.set(1.7,0.53,1.0);benchG.add(pcb);
function trace(x1,z1,x2,z2){const L=Math.hypot(x2-x1,z2-z1);
  const m=new THREE.Mesh(new THREE.BoxGeometry(L,0.012,0.05),MAT.trace);
  m.position.set((x1+x2)/2,0.565,(z1+z2)/2);m.rotation.y=-Math.atan2(z2-z1,x2-x1);benchG.add(m);return m;}
trace(0.95,0.85,1.15,0.85);trace(1.55,0.85,1.85,0.85);trace(2.25,0.85,2.45,0.85);
trace(2.45,0.85,2.45,1.35);trace(0.95,1.35,2.45,1.35);trace(0.95,0.85,0.95,1.0);trace(0.95,1.2,0.95,1.35);
/* fuente (PSU) */
function makeDisplayBox(w,h,dp,cw,ch){
  const g=new THREE.Group();
  const box=roundedBox(w,h,dp,MAT.psu,0.03);g.add(box);
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
  tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(w*0.78,h*0.42),
    new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  pl.position.set(0,h*0.12,dp/2+0.002);g.add(pl);
  return{g,cv,tx};
}
const psu=makeDisplayBox(0.52,0.44,0.40,256,96);
psu.g.position.set(0.85,0.72,0.25);benchG.add(psu.g);
psu.g.userData={act:'psu',title:'Fuente de voltaje Vs (usa el deslizador)'};
const postR=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.09,16),MAT.jackRed);
postR.position.set(-0.13,-0.13,0.21);psu.g.add(postR);
const postB=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.09,16),MAT.jackBlk);
postB.position.set(0.13,-0.13,0.21);psu.g.add(postB);
/* medidor Vd/Id */
const meter=makeDisplayBox(0.58,0.42,0.36,256,128);
meter.g.position.set(1.62,0.71,0.22);benchG.add(meter.g);
meter.g.userData={act:'meter',title:'Medidor: Vd, Id y temperatura'};
/* trazador (osciloscopio con la curva) */
const scopeG=new THREE.Group();scopeG.position.set(2.42,0.78,0.28);benchG.add(scopeG);
const scopeBox=roundedBox(0.68,0.56,0.42,MAT.scope,0.03);scopeG.add(scopeBox);
const tCv=document.createElement('canvas');tCv.width=256;tCv.height=192;
const tTex=new THREE.CanvasTexture(tCv);tTex.colorSpace=THREE.SRGBColorSpace;
tTex.minFilter=THREE.LinearFilter;tTex.generateMipmaps=false;
const scopeScr=new THREE.Mesh(new THREE.PlaneGeometry(0.56,0.42),
  new THREE.MeshBasicMaterial({map:tTex,toneMapped:false}));
scopeScr.position.set(0,0.01,0.212);scopeG.add(scopeScr);
scopeG.userData={act:'tracer',title:'Trazador de curvas (toca: LIN ⇄ SEMILOG)'};
/* resistor con bandas vivas */
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={aluminio:MAT.lead, acero:MAT.lead, cromo:MAT.lead,
  cobre:new THREE.MeshStandardMaterial({color:0xb87333,roughness:0.35,metalness:0.75}),
  chapa:MAT.lead, hierro:MAT.lead,
  negro:new THREE.MeshStandardMaterial({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:new THREE.MeshStandardMaterial({color:0x14181e,roughness:0.8,metalness:0.02}),
  blanco:new THREE.MeshStandardMaterial({color:0xd7dee6,roughness:0.4,metalness:0.2}),
  ceramica:new THREE.MeshStandardMaterial({color:0xd7dee6,roughness:0.6,metalness:0.05})};
const Y_PCB=0.56;                       // la cara de la placa: 0,53 + 0,03 de canto
/* LA RESISTENCIA, con sus CUATRO bandas —tres de valor y la de tolerancia,
   separada— y las patas dobladas hacia la placa. Aqui el codigo de colores se
   lee de verdad: el panel cambia las bandas con el valor. */
const resG=new THREE.Group();resG.position.set(1.35,Y_PCB,0.85);benchG.add(resG);
resG.userData={act:'res3d',title:'Resistor limitador (toca para cambiar R)'};
const resP3=P3.resistencia(MATP,{largo:0.20,d:0.090,patas:0.09,paso:0.34,
  bandas:[0xffffff,0xffffff,0xffffff,0xc9a227],cuerpo:0xd8c49a});
resP3.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
resG.add(resP3);
const resBody=resP3.userData.cuerpo;
const bandMeshes=resP3.userData.bandas;
/* diodos: 3 encarnaciones + caja misteriosa (visibilidad conmutada) */
const dioG=new THREE.Group();dioG.position.set(2.05,Y_PCB,0.85);benchG.add(dioG);
dioG.userData={act:'dio3d',title:'Diodo bajo prueba (toca para cambiarlo)'};
function leads(g){[-0.16,0.16].forEach(x=>{const l=new THREE.Mesh(
  new THREE.CylinderGeometry(0.008,0.008,0.14,8),MAT.lead);
  l.rotation.z=Math.PI/2;l.position.set(x,0,0);g.add(l);});}
/* LOS TRES DIODOS, cada uno con SU BANDA DE CATODO alrededor del cuerpo. La
   banda es la unica marca que dice hacia donde conduce, y en esta practica se
   compara justo eso: el mismo montaje con tres uniones distintas. */
const gSi=P3.diodoAxial(MATP,{largo:0.15,d:0.080,patas:0.09,paso:0.32,
  cuerpo:0xd88a2e,banda:0x111111,catodo:1});
gSi.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
const siBody=gSi.userData.cuerpo, siBand=gSi.userData.banda;
siBody.material.transparent=true; siBody.material.opacity=0.88;
dioG.add(gSi);
const gSch=P3.diodoAxial(MATP,{largo:0.18,d:0.100,patas:0.09,paso:0.34,
  cuerpo:0x141414,banda:0xc8c8c8,catodo:1});
gSch.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
const schBody=gSch.userData.cuerpo, schBand=gSch.userData.banda;
schBand.material.metalness=0.6;
dioG.add(gSch);
/* EL LED, con el CHAFLAN del catodo cortado en la pestana y la pata corta. Las
   dos marcas dicen lo mismo —cual es el negativo— y estan ahi porque un LED al
   reves no quema nada pero tampoco luce. */
const gLed=P3.led(MATP,{d:0.10,color:0xb02020,patas:0.10});
gLed.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
const ledMat=gLed.userData.material;
ledMat.emissive.set(0xff2222); ledMat.emissiveIntensity=0;
const halo=new THREE.Mesh(new THREE.SphereGeometry(0.10,16,12),
  new THREE.MeshBasicMaterial({color:0xff4444,transparent:true,opacity:0,toneMapped:false}));
halo.position.y=0.07;gLed.add(halo);
dioG.add(gLed);
const gMyst=new THREE.Group();
const mystBox=roundedBox(0.16,0.10,0.12,
  new THREE.MeshStandardMaterial({color:0x222222,roughness:0.8}),0.02);
mystBox.position.y=0.02;gMyst.add(mystBox);leads(gMyst);
const mystLbl=labelSprite('¿?','#FFB703');mystLbl.position.set(0,0.20,0);
mystLbl.scale.multiplyScalar(0.7);gMyst.add(mystLbl);
dioG.add(gMyst);
/* cables PSU → PCB */
function cable(pts,mat){const cur=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(cur,24,0.014,8),mat);benchG.add(m);return m;}
cable([[0.72,0.56,0.46],[0.78,0.72,0.66],[0.95,0.60,0.85]],MAT.cableRed);
cable([[0.98,0.56,0.46],[1.02,0.74,0.9],[0.95,0.60,1.35]],MAT.cableBlk);
[benchG,boardG].forEach(g=>g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}));
halo.castShadow=false;board.castShadow=false;

function drawPSU(){const c=psu.cv.getContext('2d');
  c.fillStyle='#04120e';c.fillRect(0,0,256,96);
  c.font='bold 44px monospace';c.fillStyle='#4FD1C5';c.textAlign='center';
  c.fillText(Vs.toFixed(2)+' V',128,60);
  c.font='14px monospace';c.fillStyle='#8FB3AC';c.fillText('FUENTE CD · Vs',128,86);
  psu.tx.needsUpdate=true;}
function drawMeter(){const c=meter.cv.getContext('2d'),hideQ=(mode==='reto'&&!retoSolved);
  c.fillStyle='#04120e';c.fillRect(0,0,256,128);
  c.font='bold 30px monospace';c.fillStyle='#FFB703';c.textAlign='center';
  c.fillText('Vd '+(hideQ?'¿?':fmtV(QPT.vd)),128,42);
  c.fillStyle='#4FD1C5';c.fillText('Id '+(hideQ?'¿?':fmtI(QPT.id)),128,80);
  c.font='16px monospace';c.fillStyle='#8FB3AC';c.fillText('T = '+TC+' °C',128,112);
  meter.tx.needsUpdate=true;}
function drawTracer(){const c=tCv.getContext('2d'),d=curDiode(),ym=yMaxLin(),
    hideQ=(mode==='reto'&&!retoSolved);
  c.fillStyle='#04120e';c.fillRect(0,0,256,192);
  c.strokeStyle='#1E3A34';c.lineWidth=1;
  for(let k=1;k<6;k++){c.beginPath();c.moveTo(10+k*39.3,10);c.lineTo(10+k*39.3,182);c.stroke();
    c.beginPath();c.moveTo(10,10+k*28.7);c.lineTo(246,10+k*28.7);c.stroke();}
  c.strokeStyle='#345',c.strokeRect(10,10,236,172);
  const X=v=>10+(v/XMAX())*236;
  const Y=i=>logY?182-((Math.log10(Math.max(i,1e-9))+6)/5)*172:182-(i/ym)*172;
  const seg=(fn,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();let pen=false;
    for(let px=10;px<=246;px+=2){const v=(px-10)/236*XMAX(),y=Y(fn(v));
      if(!isFinite(y)||y<8||y>184){pen=false;continue;}
      pen?c.lineTo(px,y):c.moveTo(px,y);pen=true;}c.stroke();};
  if(!hideQ)seg(v=>iDiode(d,TK(),v),'#4FD1C5',2.5);
  if(!logY)seg(v=>(Vs-v)/R(),'#FFB703',1.8);
  CAP.forEach(p=>{const x=X(p.v),y=Y(p.i);if(y<8||y>184||x>246)return;
    c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fillStyle='#FFB703';c.fill();});
  if(!hideQ&&!logY){const x=X(QPT.vd),y=Y(QPT.id);
    if(x>=10&&x<=246&&y>=8&&y<=184){c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fillStyle='#fff';c.fill();}}
  c.font='bold 11px monospace';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('TRAZADOR · '+(logY?'SEMILOG':'LINEAL'),14,24);
  tTex.needsUpdate=true;}
function refreshBenchSel(){
  gSi.visible=(mode!=='reto'&&dsel==='si');
  gSch.visible=(mode!=='reto'&&dsel==='sch');
  gLed.visible=(mode!=='reto'&&dsel==='led');
  gMyst.visible=(mode==='reto');
  const b=bandsFor(R());
  [b.d1,b.d2,b.mult].forEach((v,k)=>bandMeshes[k].material.color.set(BAND_COLORS[v]));
  bandMeshes[3].material.color.set('#c9a227');
}
function refreshBenchDyn(){
  drawPSU();drawMeter();drawTracer();
  const glow=(mode!=='reto'&&dsel==='led')?Math.min(2.2,QPT.id/0.01*1.4):0;
  ledMat.emissiveIntensity=glow;
  halo.material.opacity=Math.min(0.7,glow*0.3);
}

/* ---------- 6 · HUD + panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Electrónica analógica y de potencia (D2)</div>
  <h2>La curva I–V del diodo</h2>
  <p>Un diodo real no es un interruptor: es una <b>exponencial</b>. Este trazador resuelve en vivo
  la ecuación de <b>Shockley</b> contra la <b>recta de carga</b> de la fuente, y te deja
  <b>extraer n e Is de dos mediciones</b> — así se caracteriza un dispositivo de verdad.</p>
  <div class="formula">I = Is·(e^(V/(n·VT)) − 1) · VT = kT/q ≈ 25.9 mV (27 °C)<br>
  recta de carga: Id = (Vs − Vd)/R · ajuste: n = (V₂ − V₁)/(VT·ln(I₂/I₁))</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Curva I–V del dispositivo</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Recta de carga (Vs, R)</div>
    <div class="li"><span class="dot" style="background:#EAF4F1"></span>Punto de operación Q</div>
    <div class="li"><span class="dot" style="background:#8FB3AC"></span>Puntos capturados por el trazador</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> Shockley con parámetros tipo SPICE (Is, n, Eg, XTI) ⚑ · ley de temperatura
  de SPICE — el coef. ≈ −2 mV/K del Si <b>emerge</b>, no está programado · punto Q exacto (bisección)
  · ajuste de 2 puntos como en un analizador real.<br>
  <span class="no">NO:</span> Rs serie (a alta corriente la Vf real es mayor) · alta inyección ·
  ruptura inversa y fuga real · capacidades/conmutación (eso: práctica de recuperación inversa) ·
  autocalentamiento · dispersión entre unidades.</div>
  <div class="src">Ref: Shockley (1949) · SPICE2 (UCB 1975) · IEC 60617 · Sedra–Smith</div>`;
document.getElementById('panel').innerHTML=`
  <h4>Trazador I–V · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_curva">📈 Curva</button>
    <button class="b" id="m_ajuste">📐 Ajuste</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>
  <div class="modebar" id="dbar">
    <button class="b on" id="d_si">Si 1N4148</button>
    <button class="b" id="d_sch">Schottky</button>
    <button class="b" id="d_led">LED rojo</button>
  </div>
  <div style="font-size:12px;margin:6px 0 2px">Vs (fuente) · <b id="vsv" class="mono">5.00 V</b></div>
  <input type="range" id="sVs" min="0" max="12" step="0.05" value="5" style="width:100%;accent-color:#4FD1C5">
  <div style="font-size:12px;margin:6px 0 2px">Temperatura · <b id="tv" class="mono">27 °C</b></div>
  <input type="range" id="sT" min="-25" max="125" step="1" value="27" style="width:100%;accent-color:#FFB703">
  <div class="modebar" style="flex-wrap:wrap;margin-top:8px" id="rbar">
    ${RVALS.map((r,i)=>'<button class="b'+(i===3?' on':'')+'" style="flex:1 0 22%" id="r_'+i+'">'+RLBL[i]+'</button>').join('')}
  </div>
  <div id="tele">
    <div class="g"><div class="l">Vd (diodo)</div><b id="t_vd">—</b></div>
    <div class="g"><div class="l">Id (corriente)</div><b id="t_id">—</b></div>
    <div class="g"><div class="l">P = Vd·Id</div><b id="t_pd">—</b></div>
    <div class="g"><div class="l">mV por década</div><b id="t_dec">—</b></div>
    <div class="g"><div class="l">Vf @ 10 mA</div><b id="t_vf">—</b></div>
    <div class="g"><div class="l">Estado</div><b id="t_est">—</b></div>
  </div>
  <div class="console" id="report"></div>
  <div id="ajBox" style="display:none">
    <h4 class="sec">Tu ajuste (2 puntos de la captura)</h4>
    <div style="font-size:12px;color:#8FB3AC;margin-bottom:6px" id="ajHint"></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap">
        n = <input id="inN" inputmode="decimal" style="width:64px;background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px 6px" placeholder="1.75"></span>
      <button class="b primary" id="btnFit" style="flex:1">📐 Comprobar n</button>
    </div>
    <div style="font-size:12px;margin-top:6px" id="ajOut"></div>
  </div>
  <div id="retoBox" style="display:none">
    <h4 class="sec">Tu predicción del punto Q</h4>
    <div style="font-size:12px;color:#8FB3AC;margin-bottom:6px" id="retoHint"></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap">
        Vd = <input id="inVd" inputmode="decimal" style="width:64px;background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px 6px" placeholder="0.70"> V</span>
      <span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap">
        Id = <input id="inId" inputmode="decimal" style="width:64px;background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px 6px" placeholder="9.1"> mA</span>
      <button class="b primary" id="btnCheck" style="flex:1">✔ Comprobar</button>
    </div>
    <div style="font-size:12px;margin-top:6px" id="retoOut"></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;margin-bottom:6px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns" style="margin-top:8px">
    <button class="b" id="btnSweep">▶ Barrer curva</button>
    <button class="b" id="btnLog">㏒ LIN ⇄ SEMILOG</button>
  </div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado</button>
    <button class="b" id="btnNew">🔀 Nuevo diodo misterioso</button>
  </div>`;
const el=id=>document.getElementById(id);

/* ---------- 7 · Toast ---------- */
let toastTimer=null;
function showToast(msg){const t=el('toast');t.textContent=msg;t.classList.add('on');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),5200);}

/* ---------- 8 · Modos ---------- */
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.1,2.5,7.2],[0.5,1.3,0.1]],
    mision:'Reconoce el circuito: fuente, resistor limitador y diodo — y el punto Q donde la recta de carga cruza la curva. Mueve Vs, R y T.'},
  curva:{nombre:'Curva I–V',cam:[[-0.2,2.1,3.9],[-0.9,1.75,-0.8]],
    mision:'El trazador impone corrientes fijas y mide Vd (como un analizador real): captura la curva y mírala en semilog.'},
  ajuste:{nombre:'Ajuste',cam:[[-0.1,2.2,4.3],[-0.9,1.75,-0.8]],
    mision:'Extrae n de dos puntos de la captura (P1, P2): el modelo deja de ser una fórmula del libro y se vuelve TU modelo.'},
  reto:{nombre:'Reto',cam:[[0.6,2.3,5.6],[0.2,1.3,0.2]],
    mision:'Diodo desconocido: 2 puntos medidos y una condición (Vs, R) fija. Predice Vd e Id ANTES de ver la curva.'},
};
function setMode(k){
  const prev=mode;mode=k;solved=false;
  ['explora','curva','ajuste','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('p_mision').textContent=MODE_META[k].mision;
  el('ajBox').style.display=(k==='ajuste')?'block':'none';
  el('retoBox').style.display=(k==='reto')?'block':'none';
  const locked=(k==='ajuste'||k==='reto');
  if(locked){TC=27;el('sT').value=27;el('tv').textContent='27 °C';}
  el('sT').disabled=locked;
  el('sVs').disabled=(k==='reto');
  if(k==='reto'){
    if(!MYST)genMystery();
    Vs=MYST.Vs;el('sVs').value=Vs;el('vsv').textContent=Vs.toFixed(2)+' V';
    Ridx=RVALS.indexOf(MYST.R);syncRBtns();
    CAP=[{...MYST.p1},{...MYST.p2}];fit=null;ajusteOK=false;
    el('retoHint').textContent='Medido: ('+(MYST.p1.v*1e3).toFixed(1)+' mV, 10 µA) y ('
      +(MYST.p2.v*1e3).toFixed(1)+' mV, 10 mA) · condición: Vs = '+MYST.Vs.toFixed(2)
      +' V, R = '+fmtR(MYST.R)+' · tolerancia: ±2 % en Vd, ±5 % en Id';
  }else if(prev==='reto'){CAP=[];fit=null;ajusteOK=false;} // la captura del misterioso no aplica fuera
  if(k==='ajuste'&&CAP.length<2)runSweep();
  clearDx();refreshQuestion();refreshBenchSel();refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}
function syncRBtns(){RVALS.forEach((_,i)=>el('r_'+i).classList.toggle('on',i===Ridx));}
function syncDBtns(){['si','sch','led'].forEach(kk=>el('d_'+kk).classList.toggle('on',kk===dsel));}
function selDiode(k){
  if(mode==='reto'){showToast('En el reto el dispositivo es desconocido — no puedes cambiarlo. Resuélvelo o pide otro (🔀).');return;}
  if(dsel===k)return;
  dsel=k;syncDBtns();onDev('Cambiaste de diodo: la captura del trazador se limpió (era del dispositivo anterior).');
  refreshBenchSel();
}
function onDev(msg){ // cambio de dispositivo o temperatura: invalida captura y ajuste
  const had=CAP.length>0;CAP=[];fit=null;ajusteOK=false;el('ajOut').innerHTML='';
  buildQuiz();solved=false;clearDx();refreshQuestion();refreshAll();
  if(msg&&had)showToast(msg);
}

/* ---------- 9 · Telemetría + reporte ---------- */
function set(id,txt,cls){const n=el(id);n.textContent=txt;
  n.classList.remove('good','warn','bad');if(cls)n.classList.add(cls);}
function updateTele(){
  const d=curDiode(),hideQ=(mode==='reto'&&!retoSolved);
  const pd=QPT.vd*QPT.id;
  const icls=QPT.id>d.ifmax?'bad':QPT.id>0.7*d.ifmax?'warn':'good';
  set('t_vd',hideQ?'¿?':fmtV(QPT.vd),hideQ?'warn':'good');
  set('t_id',hideQ?'¿?':fmtI(QPT.id),hideQ?'warn':icls);
  set('t_pd',hideQ?'¿?':(pd*1e3).toFixed(1)+' mW',hideQ?'warn':icls);
  set('t_dec',hideQ?'¿?':(d.n*VT(TK())*Math.LN10*1e3).toFixed(1)+' mV',hideQ?'warn':'good');
  set('t_vf',hideQ?'¿?':fmtV(vDiode(d,TK(),0.01)),hideQ?'warn':'good');
  if(mode==='reto')set('t_est',retoSolved?'✔ PREDICCIÓN OK':'RETO · predice Q','warn');
  else set('t_est',ajusteOK?'✔ MODELO AJUSTADO':'Q por bisección','good');
}
function updateReport(){
  const d=curDiode(),rep=el('report');const L=[];
  if(mode==='explora'){
    L.push('recta de carga: Id = (Vs − Vd)/R = ('+Vs.toFixed(2)+' − '+QPT.vd.toFixed(3)+')/'+R()+' = '+fmtI(QPT.id));
    L.push('modelo: Is = '+fmtIs(isAtT(d,TK()))+' · n = '+d.n.toFixed(3)+' · VT = '+(VT(TK())*1e3).toFixed(2)+' mV');
    L.push('P_D = '+(QPT.vd*QPT.id*1e3).toFixed(1)+' mW · If máx típica: '+d.ifTxt+(QPT.id>d.ifmax?' ⚠ ¡EXCEDIDA!':''));
    if(dsel==='led'&&QPT.id>0.02)L.push('⚠ Id > 20 mA: fuera del límite continuo típico del LED — así se queman. Dimensionar R es la práctica de LED/Schottky.');
    L.push('Toca el esquema o el banco: fuente, resistor, diodo, punto Q, LIN/LOG.');
  }else if(mode==='curva'){
    if(CAP.length===0)L.push('Pulsa ▶ Barrer curva: el trazador impone Id (1 µA → 10 mA) y mide Vd.');
    else{
      L.push('Captura (Id impuesta → Vd medida) a T = '+TC+' °C:');
      CAP.forEach(p=>L.push('  Id '+fmtI(p.i)+' → Vd '+(p.v*1e3).toFixed(1)+' mV'));
      const tc5=(vDiode(d,TK()+10,0.01)-vDiode(d,TK()-10,0.01))/20*1e3;
      L.push('coef. térmico @ 10 mA (emergente): '+tc5.toFixed(2)+' mV/K — sube T con el deslizador y compruébalo.');
      L.push('En SEMILOG la exponencial se vuelve recta: su pendiente es n·VT·ln 10.');
    }
  }else if(mode==='ajuste'){
    const fp=fitPoints();
    if(!fp)L.push('El trazador está capturando la curva…');
    else{
      L.push('P1 = ('+(fp[0].v*1e3).toFixed(1)+' mV, '+fmtI(fp[0].i)+') · P2 = ('+(fp[1].v*1e3).toFixed(1)+' mV, '+fmtI(fp[1].i)+')');
      L.push('n = (V2 − V1)/(VT·ln(I2/I1)) con VT = '+(VT(TNOM)*1e3).toFixed(2)+' mV');
      L.push('P1 se elige con I ≥ 30·Is: cerca de Is el término −1 pesa y la "recta" semilog se curva.');
      if(ajusteOK&&fit)L.push('✔ tu n = '+fit.n.toFixed(3)+' → Is = '+fmtIs(fit.Is)+' (curva punteada). n del modelo: '+d.n.toFixed(3)+'.');
      else L.push('Calcula n con la fórmula y escríbelo abajo (tolerancia ±3 %).');
    }
  }else{
    L.push('Dispositivo desconocido a 27 °C. Datos: 2 puntos medidos + condición (Vs, R).');
    L.push('1) n = (V2 − V1)/(VT·ln(1000)) con VT = '+(VT(TNOM)*1e3).toFixed(2)+' mV · 2) Is = I1/e^(V1/(n·VT))');
    L.push('3) Itera la recta de carga: Vd(0) ≈ V2 → Id = (Vs − Vd)/R → Vd = n·VT·ln(Id/Is) → repite 2–3 veces.');
    if(retoSolved)L.push('✔ '+retoMsg);
    else if(retoMsg)L.push(retoMsg);
  }
  rep.innerHTML=L.map(s=>'<div>'+s+'</div>').join('');
}
function refreshAll(){
  QPT=solveQ(curDiode(),TK(),Vs,R());
  drawBoard();updateTele();updateReport();refreshBenchDyn();
  if(mode==='ajuste'){const fp=fitPoints();
    el('ajHint').textContent=fp?('Usa P1 y P2 marcados en la gráfica · VT = '+(VT(TNOM)*1e3).toFixed(2)+' mV · ±3 %'):'Esperando captura…';}
}

/* ---------- 10 · Trazador (barrido por corriente impuesta) ---------- */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runSweep(){
  if(sweeping)return;
  if(mode==='reto'&&!retoSolved){showToast('En el reto el trazador está limitado a los 2 puntos dados: predice el punto Q primero.');return;}
  sweeping=true;el('btnSweep').disabled=true;
  const d=curDiode(),Tk=TK(),m0=mode;
  CAP=[];
  for(let k=0;k<LADDER.length;k++){
    if(mode!==m0||CAP.length!==k)break; // modo o dispositivo cambió a media captura
    CAP.push({v:vDiode(d,Tk,LADDER[k]),i:LADDER[k]});
    synth.beep(500+90*k,.05,.05);refreshAll();await sleep(320);
  }
  sweeping=false;el('btnSweep').disabled=false;
  if(CAP.length===LADDER.length)
    showToast('Captura completa: 6 puntos (1 µA → 10 mA). Pruébala en SEMILOG (㏒).');
  refreshAll();
}
function toggleLog(){logY=!logY;refreshAll();
  showToast(logY?'SEMILOG: la exponencial se vuelve RECTA (si I ≫ Is) — su pendiente define n. La recta de carga se oculta.'
                :'LINEAL: se ve el "codo" y el cruce con la recta de carga (punto Q).');}

/* ---------- 11 · Ajuste de 2 puntos ---------- */
function checkFit(){
  const fp=fitPoints();
  if(!fp){showToast('Primero captura la curva (▶ Barrer).');return;}
  const raw=el('inN').value.replace(',','.');const nStu=parseFloat(raw);
  if(!isFinite(nStu)){el('ajOut').innerHTML='<span class="dtc">Escribe un número (ej. 1.75).</span>';return;}
  const VTk=VT(TNOM);
  const nRef=(fp[1].v-fp[0].v)/(VTk*Math.log(fp[1].i/fp[0].i));
  if(Math.abs(nStu-nRef)<=0.03*nRef){
    ajusteOK=true;
    fit={n:nRef,Is:fp[0].i/Math.exp(fp[0].v/(nRef*VTk))};
    const dm=curDiode();
    el('ajOut').innerHTML='<span class="ok">✔ n(2 puntos) = '+nRef.toFixed(3)+' · Is = '+fmtIs(fit.Is)
      +'</span><br>n del modelo: '+dm.n.toFixed(3)+' — la pequeña diferencia viene del −1 de Shockley '
      +'(en P1, I no es ≫ Is): por eso los analizadores ajustan lejos de Is.';
    synth.beep(980,.12,.08);solved=true;
  }else{
    el('ajOut').innerHTML='<span class="dtc">✘ n = '+nStu.toFixed(3)+' no coincide (esperado ±3 %).</span> '
      +'Usa V en las MISMAS unidades (mV o V) arriba y abajo, y VT = '+(VTk*1e3).toFixed(2)+' mV.';
    synth.beep(220,.15,.08);
  }
  refreshAll();
}

/* ---------- 12 · Reto: diodo misterioso ---------- */
function checkReto(){
  if(!MYST)return;
  const vd=parseFloat(el('inVd').value.replace(',','.'));
  const idmA=parseFloat(el('inId').value.replace(',','.'));
  if(!isFinite(vd)||!isFinite(idmA)){
    el('retoOut').innerHTML='<span class="dtc">Escribe Vd (V) e Id (mA) — acepta coma o punto.</span>';return;}
  const ex=solveQ(MYST,TNOM,MYST.Vs,MYST.R);
  const okV=Math.abs(vd-ex.vd)<=Math.max(0.015,0.02*ex.vd);
  const okI=Math.abs(idmA*1e-3-ex.id)<=0.05*ex.id;
  if(okV&&okI){
    retoSolved=true;solved=true;
    retoMsg='Exacto: Vd = '+fmtV(ex.vd)+', Id = '+fmtI(ex.id)+' · n = '+MYST.n.toFixed(3)+', Is = '+fmtIs(MYST.Is)+'. Curva revelada.';
    el('retoOut').innerHTML='<span class="ok">✔ ¡Predicción correcta! '+retoMsg+'</span>';
    synth.beep(880,.1,.08);setTimeout(()=>synth.beep(1175,.15,.08),140);
  }else{
    retoMsg='';
    el('retoOut').innerHTML='<span class="dtc">✘ Aún no'+(okV?'':' · revisa Vd')+(okI?'':' · revisa Id')
      +'.</span> Itera otra vuelta: Id = (Vs − Vd)/R y Vd = n·VT·ln(Id/Is).';
    synth.beep(220,.15,.08);
  }
  refreshAll();
}
function newMystery(){
  genMystery();el('inVd').value='';el('inId').value='';el('retoOut').innerHTML='';
  buildQuiz();
  if(mode!=='reto')setMode('reto');
  else{setMode('reto');}
  showToast('Nuevo diodo misterioso servido: 2 puntos, una condición. A predecir.');
}

/* ---------- 13 · Quiz de ingeniería (valores calculados en vivo) ---------- */
let QUIZ={};
function buildQuiz(){
  const d=DIODES[dsel];
  const c1=solveQ(d,TNOM,5,470),c2=solveQ(d,TNOM,5,940);
  const half=(c1.id/2*1e3),real=(c2.id*1e3);
  const mvdec=(d.n*VT(TK())*Math.LN10*1e3);
  QUIZ.explora={pregunta:'Con Vs = 5 V, R = 470 Ω y T = 27 °C este diodo opera en Q. Si duplicas R a 940 Ω, ¿qué pasa con Id?',
    opciones:[
      {t:'Cae exactamente a la mitad: '+half.toFixed(3)+' mA, ley de Ohm tal cual',ok:false,
       why:'Casi: Vd también baja ≈ n·VT·ln 2, así que Id = '+real.toFixed(3)+' mA, no '+half.toFixed(3)+'. La diferencia es pequeña pero conceptual: el diodo NO es una caída fija.'},
      {t:'Cae a '+real.toFixed(3)+' mA — casi la mitad: la R manda y Vd apenas baja (≈ n·VT·ln 2)',ok:true,
       why:'Correcto: Vd solo baja unas décimas de mV a mV (logaritmo), así que Id ≈ (Vs − Vd)/R queda un pelo ARRIBA de la mitad exacta ('+half.toFixed(3)+' mA).'},
      {t:'No cambia: el diodo fija la corriente en su valor exponencial',ok:false,
       why:'Al revés: el diodo fija (casi) el VOLTAJE; la corriente la dicta la recta de carga, o sea R.'},
      {t:'Se duplica',ok:false,why:'Más R = menos corriente, nunca más: la recta de carga se aplana.'}]};
  QUIZ.curva={pregunta:'En la zona exponencial (I ≫ Is), ¿cuántos mV sube Vd por cada década (×10) de corriente en este diodo a '+TC+' °C?',
    opciones:[
      {t:(VT(TK())*Math.LN10*1e3).toFixed(1)+' mV/década, siempre (n = 1)',ok:false,
       why:'Ese es el diodo IDEAL (n = 1). Los reales tienen n entre 1 y 2 (recombinación): éste, n = '+d.n.toFixed(3)+'.'},
      {t:(VT(TK())*1e3).toFixed(1)+' mV/década — una vez VT',ok:false,
       why:'VT es el voltaje térmico, no la pendiente: falta el factor ln 10 ≈ 2.30 (y n).'},
      {t:mvdec.toFixed(1)+' mV/década — la pendiente semilog: n·VT·ln 10',ok:true,
       why:'Correcto: con n = '+d.n.toFixed(3)+' y VT = '+(VT(TK())*1e3).toFixed(2)+' mV sale '+mvdec.toFixed(1)+' mV. Así se LEE n en un semilog.'},
      {t:'No es constante: la exponencial no tiene pendiente fija',ok:false,
       why:'En ejes LINEALES sí; pero en SEMILOG la exponencial es una recta perfecta (si I ≫ Is) — por eso el trazador tiene esa vista.'}]};
  QUIZ.ajuste={pregunta:'Para extraer n de dos puntos, ¿por qué exigimos I ≫ Is en ambos (aquí: P1 con I ≥ 30·Is)?',
    opciones:[
      {t:'Para no quemar el diodo',ok:false,
       why:'La potencia limita por ARRIBA, no por abajo: aquí el problema de medir cerca de Is es matemático (el −1), no térmico.'},
      {t:'Para despreciar el −1: ln(I/Is + 1) ≈ ln(I/Is) y el semilog es recta de verdad',ok:true,
       why:'Correcto: cerca de Is el −1 pesa, la "recta" se curva y n sale sesgado. Con el Schottky (Is = 31.7 µA) se nota clarísimo.'},
      {t:'Porque el trazador no puede medir corrientes pequeñas',ok:false,
       why:'Los analizadores miden hasta pA. La restricción viene del MODELO: cerca de Is la aproximación logarítmica falla.'},
      {t:'No es necesario: el ajuste da igual con cualquier par de puntos',ok:false,
       why:'Pruébalo con el Schottky: P1 en 10 µA (≈ 0.3·Is) daría n ≈ 1.1 en vez de 1.37 — un 20 % de error sistemático.'}]};
  if(MYST){
    const ex=solveQ(MYST,TNOM,MYST.Vs,MYST.R);
    const i07=(MYST.Vs-0.7)/MYST.R;
    const err=Math.abs(i07/ex.id-1)*100;
    QUIZ.reto={pregunta:'El modelo de "caída constante" (Vd ≈ 0.7 V) con esta condición (Vs = '+MYST.Vs.toFixed(0)+' V, R = '+fmtR(MYST.R)+') da Id = '+(i07*1e3).toFixed(2)+' mA. ¿Cómo se usa bien ese número?',
      opciones:[
        {t:'Es el resultado exacto: 0.7 V es una constante física del silicio',ok:false,
         why:'No existe tal constante: Vf depende de Is, n, la corriente y T (este misterioso ni siquiera es un Si típico). Aquí el error es '+err.toFixed(0)+' %.'},
        {t:'No sirve de nada: siempre hay que resolver la exponencial completa',ok:false,
         why:'Como punto de partida es valiosísimo (por eso lo enseña Sedra–Smith): convierte una trascendente en 2–3 iteraciones triviales.'},
        {t:'Como SEMILLA de la iteración — aquí queda a '+err.toFixed(0)+' % del exacto, no es el resultado final',ok:true,
         why:'Correcto: 0.7 V arranca la recta de carga; luego Vd = n·VT·ln(Id/Is) refina. Dos o tres vueltas y convergiste al Q exacto.'},
        {t:'Mejor usar Id = Vs/R = '+(MYST.Vs/MYST.R*1e3).toFixed(2)+' mA e ignorar el diodo',ok:false,
         why:'Eso es el corte de la recta de carga con el eje I (Vd = 0), no el punto Q: sobreestima la corriente siempre.'}]};
  }
}
function clearDx(){el('dxbtns').innerHTML='';}
function refreshQuestion(){
  const q=QUIZ[mode];if(!q){el('q_text').textContent='';clearDx();return;}
  el('q_text').textContent=q.pregunta;
  const bx=el('dxbtns');bx.innerHTML='';
  q.opciones.forEach((o,i)=>{
    const b=document.createElement('button');b.className='b dx';b.textContent='ABCD'[i]+') '+o.t;
    b.onclick=()=>{if(b.classList.contains('right')||b.classList.contains('wrong'))return;
      b.classList.add(o.ok?'right':'wrong');
      showToast((o.ok?'✔ ':'✘ ')+o.why);synth.beep(o.ok?980:220,.12,.07);};
    bx.appendChild(b);});
}

/* ---------- 14 · Picking, recorrido guiado, animación e init ---------- */
pickerFor(S.scene,S.camera,S.renderer.domElement,hit=>{
  if(hit.object===board&&hit.uv){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object,act=null;
  while(o){if(o.userData&&o.userData.act){act=o.userData.act;break;}o=o.parent;}
  if(!act)return;
  synth.beep(700,.05,.05);
  if(act==='dio3d'){
    if(mode==='reto'){showToast('Dispositivo desconocido: en el reto no se cambia. Extrae sus parámetros de los 2 puntos.');return;}
    selDiode(dsel==='si'?'sch':dsel==='sch'?'led':'si');
    showToast('Diodo: '+DIODES[dsel].name);
  }else if(act==='res3d'){
    if(mode==='reto'){showToast('En el reto la condición (Vs, R) está fija: R = '+fmtR(MYST.R)+'.');return;}
    Ridx=(Ridx+1)%RVALS.length;syncRBtns();refreshBenchSel();refreshAll();
    showToast('R = '+fmtR(R())+' — mira cómo gira la recta de carga.');
  }else if(act==='tracer')toggleLog();
  else if(act==='psu')showToast('Fuente CD · Vs = '+Vs.toFixed(2)+' V (ajústala con el deslizador del panel).');
  else if(act==='meter')showToast(mode==='reto'&&!retoSolved?'El medidor está vendado en el reto: predice Vd e Id tú.':'Medidor: Vd = '+fmtV(QPT.vd)+' · Id = '+fmtI(QPT.id)+' · T = '+TC+' °C');
});
(function(){ // hover con etiquetas
  const ray=new THREE.Raycaster(),p=new THREE.Vector2(),dom=S.renderer.domElement;
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    p.x=((e.clientX-r.left)/r.width)*2-1;p.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(p,S.camera);
    const hits=ray.intersectObjects(S.scene.children,true);
    let tt=null;
    for(const h of hits){let o=h.object;
      while(o){if(o.userData&&o.userData.title){tt=o.userData.title;break;}o=o.parent;}
      if(tt)break;}
    dom.style.cursor=tt?'pointer':'default';dom.title=tt||'';
  });
})();
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const b=el('btnAuto');b.disabled=true;b.textContent='✨ Recorriendo…';
  try{
    synth.init();synth.resume();
    setMode('explora');selDiode('si');
    Vs=5;el('sVs').value=5;el('vsv').textContent='5.00 V';Ridx=3;syncRBtns();refreshBenchSel();refreshAll();
    showToast('1/5 · El punto Q: donde la exponencial del diodo cruza la recta de carga de la fuente.');
    await sleep(3200);
    setMode('curva');await sleep(1200);
    await runSweep();await sleep(800);
    if(!logY)toggleLog();
    showToast('2/5 · SEMILOG: la exponencial es una recta — su pendiente (mV/década) revela n.');
    await sleep(3000);if(logY)toggleLog();
    setMode('ajuste');
    while(sweeping)await sleep(200);
    const fp=fitPoints();
    if(fp){const nRef=(fp[1].v-fp[0].v)/(VT(TNOM)*Math.log(fp[1].i/fp[0].i));
      el('inN').value=nRef.toFixed(3);await sleep(1200);checkFit();
      showToast('3/5 · Con 2 puntos extraes n (y de ahí Is): el modelo ahora es TUYO.');await sleep(3000);}
    setMode('reto');
    const ex=solveQ(MYST,TNOM,MYST.Vs,MYST.R);
    showToast('4/5 · Reto: del par de puntos salen n e Is; la recta de carga se itera 2–3 veces.');
    await sleep(2600);
    el('inVd').value=ex.vd.toFixed(3);el('inId').value=(ex.id*1e3).toFixed(2);
    await sleep(1000);checkReto();await sleep(2200);
    const q=QUIZ.reto;const idx=q.opciones.findIndex(o=>o.ok);
    const btn=el('dxbtns').children[idx];if(btn)btn.click();
    showToast('5/5 · Recorrido completo: explora T (el coef. −2 mV/K emerge solo) o pide otro misterioso (🔀).');
  }finally{autoRunning=false;b.disabled=false;b.textContent='✨ Recorrido guiado';}
}
S.setAnimate(()=>{ // halo del LED con pulso sutil
  if(gLed.visible&&ledMat.emissiveIntensity>0.1){
    const tSec=performance.now()/1000;
    halo.material.opacity=Math.min(0.7,ledMat.emissiveIntensity*0.3)*(0.85+0.15*Math.sin(tSec*3));
  }
});
/* wiring */
['explora','curva','ajuste','reto'].forEach(m=>el('m_'+m).onclick=()=>setMode(m));
el('d_si').onclick=()=>selDiode('si');
el('d_sch').onclick=()=>selDiode('sch');
el('d_led').onclick=()=>selDiode('led');
RVALS.forEach((_,i)=>el('r_'+i).onclick=()=>{
  if(mode==='reto'){showToast('En el reto la condición (Vs, R) está fija.');syncRBtns();return;}
  Ridx=i;syncRBtns();refreshBenchSel();refreshAll();});
el('sVs').addEventListener('input',()=>{Vs=parseFloat(el('sVs').value);
  el('vsv').textContent=Vs.toFixed(2)+' V';refreshAll();});
el('sT').addEventListener('input',()=>{TC=parseInt(el('sT').value,10);
  el('tv').textContent=TC+' °C';onDev();});
el('btnSweep').onclick=runSweep;
el('btnLog').onclick=toggleLog;
el('btnFit').onclick=checkFit;
el('btnCheck').onclick=checkReto;
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newMystery;
/* init */
genMystery();buildQuiz();syncDBtns();syncRBtns();refreshBenchSel();
S.start();setMode('explora');
window.__labDebug={
  state:()=>({mode,dsel,Vs,R:R(),TC,logY,retoSolved,ajusteOK,sweeping,cap:CAP.length}),
  diode:()=>({key:dsel,...DIODES[dsel]}),
  mystery:()=>MYST?{...MYST}:null,
  q:()=>({...QPT}),
  solve:(p,Tk,vs,r)=>solveQ(p,Tk,vs,r),
  isAt:(p,Tk)=>isAtT(p,Tk),
  vAt:(p,Tk,i)=>vDiode(p,Tk,i),
  fitRef:()=>{const fp=fitPoints();if(!fp)return null;
    const n=(fp[1].v-fp[0].v)/(VT(TNOM)*Math.log(fp[1].i/fp[0].i));
    return{p1:fp[0],p2:fp[1],n,Is:fp[0].i/Math.exp(fp[0].v/(n*VT(TNOM)))};},
  capture:()=>CAP.map(p=>({...p})),
  setVs:v=>{Vs=v;el('sVs').value=v;el('vsv').textContent=v.toFixed(2)+' V';refreshAll();},
  setR:i=>{Ridx=i;syncRBtns();refreshBenchSel();refreshAll();},
  setT:c=>{TC=c;el('sT').value=c;el('tv').textContent=c+' °C';onDev();},
  selDiode,sweep:runSweep,toggleLog,checkFit,checkReto,newMystery,
  boardClick,mode:()=>mode,setMode,
};
