/* ============================================================
   LAB — Variador de Frecuencia V/f (motor de inducción)
   Dominio: D5 Máquinas eléctricas · Molde: S+P (esquemático + panel)
   Física: motor de inducción trifásico, modelo de Kloss (curva
   par-deslizamiento) impulsado por un variador de frecuencia con
   ley V/f=constante hasta la frecuencia base (60 Hz) y debilita-
   miento de campo (voltaje saturado) por encima de esa frecuencia.
   Mantener V/f constante conserva aproximadamente el flujo del
   entrehierro, y con él el par máximo (de ruptura) — por eso un
   variador permite arrancar y operar a velocidad variable con
   par disponible prácticamente constante en la región de baja
   velocidad, algo imposible con un arranque directo a la red
   (DOL), que aplica de golpe la tensión y frecuencia nominales.

   Modelo (curva de Kloss por frecuencia comandada f):
     ns(f) = 120f/polos        V/f: v(f) = min(f/f_base, 1)
     Tmax(f) = Tmax_base·v(f)²·(f_base/f)²
     sm(f) = sm_base·(f_base/f)
     T(s,f) = 2·Tmax(f) / (s/sm(f) + sm(f)/s)
   El punto de operación estable resuelve T(s,f)=TL (par
   resistente) por la raíz físicamente estable de Kloss (la rama
   de bajo deslizamiento). Si TL supera Tmax(f) a esa frecuencia,
   el motor se cala (no hay solución estable).

   ⚑ Tmax_base=25 N·m y sm_base=0.15 a 60 Hz son valores
   ilustrativos de catálogo típico (motor de inducción industrial
   de tamaño medio), no de una máquina real verificada. NO modela:
   la corriente de línea real ni el boost de tensión IR a baja
   frecuencia que aplican los variadores reales (por eso este
   modelo idealizado mantiene el par de ruptura constante en la
   zona de par constante, sin ese efecto compensador); saturación
   magnética; armónicos de conmutación PWM; dinámica temporal de
   arranque (inercia, tiempo de aceleración) — es un modelo de
   régimen permanente en cada frecuencia, no una simulación
   continua; protecciones reales del variador (límite de
   corriente, frenado dinámico); ni pérdidas.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[7.6,5.0,8.6],target:[0,1.1,0],bgTop:'#0b1520',bgBot:'#03070a',bloom:0.35,minD:4,maxD:16});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2200,Q:0.7});

/* ---------- §1 Modelo físico ---------- */
const POLES=4;
const F_BASE=60;                   // Hz, frecuencia base (síncrona a tensión nominal)
const TMAX_BASE=25;                // ⚑ N·m, par de ruptura ilustrativo a f_base
const SM_BASE=0.15;                // ⚑ deslizamiento de ruptura ilustrativo a f_base
const FMIN=8, FMAX=100;            // Hz, rango del variador
const TL_MIN=0, TL_MAX=24;         // N·m, rango de par resistente
const F_LEVELS=[20,40,60,80];
const F_COLOR={20:'#4FD1C5',40:'#8AB4F8',60:'#FFB703',80:'#FF6B6B'};

function ns(f){ return 120*f/POLES; }
function vcmd(f){ return f<=F_BASE ? f/F_BASE : 1; }
function tmax(f){ return TMAX_BASE*Math.pow(vcmd(f),2)*Math.pow(F_BASE/f,2); }
function sm(f){ return SM_BASE*(F_BASE/f); }
function TofS(s,f){ const smf=sm(f); return 2*tmax(f)/(s/smf+smf/s); }
function stableSlip(TL,f){
  if(TL<=0) return 0;
  const tm=tmax(f), k=TL/tm;
  if(k>=1) return null;
  const smf=sm(f);
  const s=smf*(1-Math.sqrt(1-k*k))/k;
  if(s>=1) return null;
  return s;
}
function speedRpm(TL,f){ const s=stableSlip(TL,f); return s==null?null:ns(f)*(1-s); }
function fMaxBeforeStall(TL){ return F_BASE*Math.sqrt(TMAX_BASE/TL); }
function TatN(n,f){ const nsf=ns(f); if(n<0||n>nsf) return NaN; const s=1-n/nsf; return TofS(s,f); }
const T_DOL=TofS(1,F_BASE);        // par de arranque a rotor bloqueado en DOL a 60 Hz (≈7.34 N·m)

/* ---------- §2 Estado ---------- */
let mode='explora', fCmd=60, tl=8;
let MYST=null, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false;

function genMystery(){
  const TL=Math.round(9+Math.random()*14);   // entero 9-23 → fMaxBeforeStall siempre dentro de [8,100] Hz
  const target=fMaxBeforeStall(TL);
  if(Math.random()<0.5){
    MYST={kind:'calaFrecuencia',TL,target,tol:1.0};
  } else {
    MYST={kind:'buscarLimite',TL,target,tol:0.8};
  }
  retoSolved=false; retoMsg='';
}

/* ---------- §3 Materiales ---------- */
const std=o=>new THREE.MeshStandardMaterial(o);
const MAT={
  frame:std({color:0x1c2a33,metalness:0.6,roughness:0.4}),
  board:std({color:0x0c141a,metalness:0.1,roughness:0.9}),
  bench:std({color:0x14202a,metalness:0.3,roughness:0.7}),
  bus:std({color:0xffb703,metalness:0.8,roughness:0.3,emissive:0x3a2600,emissiveIntensity:0.3}),
  vfdBody:std({color:0x233542,metalness:0.6,roughness:0.35}),
  vfdDoor:std({color:0x2f4552,metalness:0.55,roughness:0.3}),
  motorBody:std({color:0x2c3e46,metalness:0.7,roughness:0.35}),
  motorEnd:std({color:0x40555f,metalness:0.7,roughness:0.3}),
  shaft:std({color:0xb9c4c9,metalness:0.9,roughness:0.2}),
  dialBody:std({color:0x223038,metalness:0.6,roughness:0.4}),
  dialArm:std({color:0x4fd1c5,metalness:0.5,roughness:0.3,emissive:0x0d3a35,emissiveIntensity:0.4}),
  loadBlock:std({color:0x5a3b3b,metalness:0.5,roughness:0.5}),
  panelBody:std({color:0x101a20,metalness:0.4,roughness:0.6}),
  cable:std({color:0x1a1a1a,metalness:0.2,roughness:0.8}),
};

/* ---------- §4 Pizarrón (canvas T-n curves) ---------- */
const bCv=document.createElement('canvas'); bCv.width=1024; bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv);

const PX0=110,PX1=980,PY0=300,PY1=700;
const NMAX=3050, YMAX=30, YTICK=5;

function xPix(n){ return PX0+(n/NMAX)*(PX1-PX0); }
function yPix(t){ return PY1-(t/YMAX)*(PY1-PY0); }

function line(c,x1,y1,x2,y2,col,w,dash){
  c.strokeStyle=col; c.lineWidth=w||1.5; c.setLineDash(dash||[]);
  c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); c.setLineDash([]);
}
function rr(c,x,y,w,h,r,fill,stroke,lw){
  c.beginPath(); c.roundRect(x,y,w,h,r);
  if(fill){ c.fillStyle=fill; c.fill(); }
  if(stroke){ c.strokeStyle=stroke; c.lineWidth=lw||1.5; c.stroke(); }
}
function plotFn(c,fn,col,w,dash){
  c.strokeStyle=col; c.lineWidth=w; c.setLineDash(dash||[]);
  c.beginPath(); let pen=false;
  for(let px=PX0;px<=PX1;px+=3){
    const n=((px-PX0)/(PX1-PX0))*NMAX;
    const v=fn(n);
    if(!isFinite(v)){ pen=false; continue; }
    const y=yPix(v);
    if(y<PY0-2||y>PY1+2){ pen=false; continue; }
    pen?c.lineTo(px,y):c.moveTo(px,y); pen=true;
  }
  c.stroke(); c.setLineDash([]);
}

function drawSchematic(c,hideDetails){
  const bx0=110,by=70,bx1=980;
  line(c,bx0,by,bx1,by,'#ffb703',3);
  c.fillStyle='#ffb703'; c.font='16px system-ui'; c.textAlign='left';
  c.fillText('BUS 3~ 60 Hz',bx0,by-12);

  // variador (VFD)
  const vx=280;
  line(c,vx,by,vx,by+30,'#8aa',2);
  rr(c,vx-45,by+30,90,55,8,'#152025','#4fd1c5',1.8);
  c.fillStyle='#eaf4f1'; c.font='bold 16px system-ui'; c.textAlign='center';
  c.fillText('VFD',vx,by+62);
  c.font='13px system-ui'; c.fillStyle='#9fb'; c.fillText('variador V/f',vx,by+108);

  // motor de inducción
  const mx=560;
  line(c,vx+45,by+57,mx-40,by+57,'#4fd1c5',2.2);
  c.beginPath(); c.arc(mx,by+57,40,0,Math.PI*2); c.fillStyle='#16232a'; c.fill(); c.strokeStyle='#8ab4f8'; c.lineWidth=2.5; c.stroke();
  c.fillStyle='#eaf4f1'; c.font='bold 20px system-ui'; c.textAlign='center'; c.fillText('M',mx,by+64);
  c.font='14px system-ui'; c.fillStyle='#9fb'; c.fillText('motor de inducción',mx,by+117);

  if(!hideDetails){
    const lx=800;
    line(c,mx+40,by+57,lx-45,by+57,'#8aa',2,[4,3]);
    rr(c,lx-45,by+35,90,55,8,'#241a1a','#e08a8a',1.5);
    c.fillStyle='#e08a8a'; c.font='13px system-ui'; c.textAlign='center';
    c.fillText('CARGA',lx,by+58);
    c.fillText('(freno)',lx,by+76);
  }
}

function drawBoard(){
  bCx.fillStyle='#0a1116'; bCx.fillRect(0,0,1024,768);
  rr(bCx,4,4,1016,760,14,null,'#22323b',2);

  bCx.fillStyle='#eaf4f1'; bCx.font='bold 28px system-ui'; bCx.textAlign='left';
  bCx.fillText('Variador V/f — Motor de Inducción',36,46);

  if(mode==='reto'){
    rr(bCx,660,16,340,40,8,retoSolved?'#123a2a':'#3a1f12',retoSolved?'#4fd1c5':'#e0a35c',1.5);
    bCx.fillStyle=retoSolved?'#8ff0d0':'#ffcf8a'; bCx.font='bold 15px system-ui'; bCx.textAlign='center';
    bCx.fillText(retoSolved?'✔ RETO RESUELTO':'🎯 RETO: dato desconocido',830,41);
  }

  const hideCurve=(mode==='reto'&&MYST&&MYST.kind==='calaFrecuencia'&&!retoSolved);
  drawSchematic(bCx,hideCurve);

  bCx.font='14px system-ui'; bCx.fillStyle='#8aa'; bCx.textAlign='left';
  bCx.fillText('ns=120f/polos   Tmax(f)=Tmax_base·v(f)²·(f_base/f)²   T(s,f)=2Tmax(f)/(s/sm(f)+sm(f)/s)',36,270);

  rr(bCx,PX0-30,PY0-20,PX1-PX0+60,PY1-PY0+70,10,'#0d161c','#22323b',1.5);

  for(let t=0;t<=YMAX;t+=YTICK){
    const y=yPix(t);
    line(bCx,PX0,y,PX1,y,'#182228',1);
    bCx.fillStyle='#6a8088'; bCx.font='12px system-ui'; bCx.textAlign='right';
    bCx.fillText(String(t),PX0-10,y+4);
  }
  bCx.save(); bCx.translate(40,(PY0+PY1)/2); bCx.rotate(-Math.PI/2);
  bCx.fillStyle='#9ab'; bCx.font='13px system-ui'; bCx.textAlign='center';
  bCx.fillText('T — par disponible (N·m)',0,0); bCx.restore();

  for(let n=0;n<=NMAX;n+=500){
    const x=xPix(n);
    line(bCx,x,PY0,x,PY1,'#182228',1);
    bCx.fillStyle='#6a8088'; bCx.font='12px system-ui'; bCx.textAlign='center';
    bCx.fillText(String(n),x,PY1+20);
  }
  bCx.fillStyle='#9ab'; bCx.font='13px system-ui'; bCx.textAlign='center';
  bCx.fillText('n — velocidad (rpm)',(PX0+PX1)/2,PY1+42);

  // umbral de arranque directo (DOL) a 60 Hz — referencia fija, no depende del misterio
  line(bCx,PX0,yPix(T_DOL),PX1,yPix(T_DOL),'#ff5c5c',2,[7,4]);
  bCx.fillStyle='#ff8a8a'; bCx.font='12px system-ui'; bCx.textAlign='left';
  bCx.fillText(`par de arranque DOL a 60 Hz = ${T_DOL.toFixed(2)} N·m ⚑`,PX0+6,yPix(T_DOL)-8);

  if(!hideCurve){
    for(const f of F_LEVELS){
      plotFn(bCx,n=>TatN(n,f),F_COLOR[f],1.6,[6,4]);
      const nb=ns(f)*(1-sm(f));
      const px=xPix(nb), py=yPix(tmax(f));
      if(px>=PX0&&px<=PX1){
        bCx.beginPath(); bCx.arc(px,py,4.5,0,Math.PI*2);
        bCx.fillStyle='#eaf4f1'; bCx.fill(); bCx.strokeStyle=F_COLOR[f]; bCx.lineWidth=2; bCx.stroke();
      }
    }
    // curva viva (frecuencia actual del variador)
    plotFn(bCx,n=>TatN(n,fCmd),'#ffffff',3.0,[]);

    // línea de carga TL + punto de operación
    const yTL=yPix(tl);
    line(bCx,PX0,yTL,PX1,yTL,'#e08a8a',1.6,[5,4]);
    bCx.fillStyle='#e08a8a'; bCx.font='12px system-ui'; bCx.textAlign='left';
    bCx.fillText(`TL = ${tl.toFixed(1)} N·m (carga)`,PX0+6,yTL-8);

    const s=stableSlip(tl,fCmd);
    if(s!=null){
      const n=ns(fCmd)*(1-s);
      const px=xPix(n), py=yPix(tl);
      if(px>=PX0&&px<=PX1&&py>=PY0-2&&py<=PY1+2){
        line(bCx,px,PY0,px,py,'#ffffff55',1,[3,3]);
        line(bCx,PX0,py,px,py,'#ffffff55',1,[3,3]);
        bCx.beginPath(); bCx.arc(px,py,6,0,Math.PI*2);
        bCx.fillStyle='#fff'; bCx.fill(); bCx.strokeStyle='#0a1116'; bCx.lineWidth=2; bCx.stroke();
        bCx.fillStyle='#fff'; bCx.font='bold 13px system-ui'; bCx.textAlign='left';
        bCx.fillText(`n=${n.toFixed(0)} rpm  s=${(s*100).toFixed(1)}%`,px+10,py-10);
      }
    } else {
      bCx.fillStyle='#ff8a8a'; bCx.font='bold 15px system-ui'; bCx.textAlign='center';
      bCx.fillText('⚠ CALADO — el par de carga excede el par disponible a esta frecuencia',(PX0+PX1)/2,(PY0+PY1)/2);
    }
  } else {
    bCx.fillStyle='#8aa'; bCx.font='italic 15px system-ui'; bCx.textAlign='center';
    bCx.fillText('Curva oculta — calcula la frecuencia límite a mano y escríbela abajo',(PX0+PX1)/2,(PY0+PY1)/2);
  }

  bTex.needsUpdate=true;
}

function boardClick(u,v){
  const px=u*1024, py=(1-v)*768;
  const hideCurve=(mode==='reto'&&MYST&&MYST.kind==='calaFrecuencia'&&!retoSolved);
  if(!hideCurve){
    const s=stableSlip(tl,fCmd);
    if(s!=null){
      const n=ns(fCmd)*(1-s);
      const opx=xPix(n), opy=yPix(tl);
      if(Math.hypot(px-opx,py-opy)<26){
        showToast(`Punto de operación: f=${fCmd.toFixed(0)} Hz, n=${n.toFixed(0)} rpm, s=${(s*100).toFixed(1)}%, T=${tl.toFixed(1)} N·m.`);
        synth.beep(700,0.08,0.06); return;
      }
    }
  }
  if(px>235&&px<325&&py>100&&py<155){
    showToast('El variador (VFD) ajusta simultáneamente voltaje y frecuencia manteniendo V/f≈constante, para conservar el flujo del motor.');
    synth.beep(520,0.08,0.06); return;
  }
  if(px>520&&px<600&&py>87&&py<167){
    showToast('Motor de inducción: su velocidad síncrona ns=120f/polos cambia con la frecuencia comandada por el variador.');
    synth.beep(560,0.08,0.06); return;
  }
  showToast('Cada curva de color es la curva par-velocidad (Kloss) del motor a una frecuencia distinta. La curva blanca es la frecuencia actual del variador.');
  synth.beep(420,0.08,0.05);
}

/* ---------- §5 Banco 3D modesto ---------- */
function cable(pts,mat){
  const curve=new THREE.CatmullRomCurve3(pts);
  const geo=new THREE.TubeGeometry(curve,24,0.035,8,false);
  return new THREE.Mesh(geo,mat);
}
function makeDisplayBox(w,h,dp,cw,ch){
  const g=new THREE.Group();
  const body=roundedBox(w,h,dp,MAT.panelBody,0.05); g.add(body);
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
  const cx=cv.getContext('2d');
  const tx=new THREE.CanvasTexture(cv);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*0.86,h*0.78),new THREE.MeshBasicMaterial({map:tx}));
  screen.position.set(0,0,dp/2+0.005);
  g.add(screen);
  return {g,cv,cx,tx};
}

const boardG=new THREE.Group();
const boardFrame=roundedBox(3.2,2.35,0.12,MAT.frame,0.06);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.0,2.15),new THREE.MeshBasicMaterial({map:bTex}));
board.position.z=0.07; board.castShadow=false;
board.userData={title:'Tablero — curvas par-velocidad del variador'};
boardFrame.userData=board.userData;
boardG.add(boardFrame,board);
boardG.position.set(0,2.35,-1.55);
S.scene.add(boardG);

const benchG=new THREE.Group();
const mesa=roundedBox(6.2,0.28,3.0,MAT.bench,0.08);
mesa.position.set(0,0.85,0); mesa.receiveShadow=true;
benchG.add(mesa);

const busBar=new THREE.Mesh(new THREE.BoxGeometry(4.6,0.06,0.06),MAT.bus);
busBar.position.set(0,1.85,-0.8);
benchG.add(busBar);

// variador de frecuencia (VFD)
const vfdG=new THREE.Group();
const vfdBody=roundedBox(0.66,0.9,0.5,MAT.vfdBody,0.06);
const vfdDoor=roundedBox(0.5,0.7,0.06,MAT.vfdDoor,0.05);
vfdDoor.position.set(0,0,0.28);
vfdG.add(vfdBody,vfdDoor);
vfdG.add(labelSprite('VFD','#4fd1c5'));
vfdG.position.set(-2.0,1.25,-0.05);
vfdG.userData={act:'vfd3d',title:'Variador de frecuencia (VFD)'};
vfdBody.userData=vfdG.userData; vfdDoor.userData=vfdG.userData;
benchG.add(vfdG);

// perilla de frecuencia (control de f)
const dialG=new THREE.Group();
const dialBody=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.22,0.12,24),MAT.dialBody);
dialBody.rotation.x=Math.PI/2; dialBody.castShadow=true;
const dialArm=new THREE.Mesh(new THREE.BoxGeometry(0.19,0.04,0.04),MAT.dialArm);
dialArm.position.set(0.095,0,0.078);
dialG.add(dialBody,dialArm);
dialG.add(labelSprite('f','#4fd1c5'));
dialG.position.set(-1.55,1.32,-0.05);
dialG.userData={act:'dial3d',title:'Perilla de frecuencia (control de f)'};
dialBody.userData=dialG.userData;
benchG.add(dialG);

// motor de inducción (housing + tapas + eje + acople)
const motG=new THREE.Group();
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio:MAT.motorBody, acero:MAT.shaft, cromo:MAT.shaft, chapa:MAT.motorBody,
  cobre:std({color:0xb87333,roughness:0.35,metalness:0.75}),
  negro:std({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:std({color:0x14181e,roughness:0.80,metalness:0.02}),
  blanco:std({color:0xd7dee6,roughness:0.40,metalness:0.20}),
  ceramica:std({color:0xd7dee6,roughness:0.60,metalness:0.05}),
};
/* LA MAQUINA, con la silueta por la que se reconoce desde el otro lado del
   taller: ALETAS —la superficie por la que evacua lo que no convierte en par—,
   TAPA DEL VENTILADOR con su rejilla y el ventilador calado al eje, PATAS por
   donde se atornilla a la bancada, CAJA DE BORNES por donde entra la
   alimentacion y placa de datos. Ninguna de las cinco es decorativa, y ninguna
   estaba dibujada: era un tubo liso con un disco pegado en la punta. */
const maq=P3.maquinaElectrica(MATP,{d:0.84,largo:0.95,eje:0.62,aletas:16});
/* EL ACOPLE de garras, que es por donde sale el par hacia la carga. */
const couplingG=new THREE.Group();
for(let i=0;i<6;i++){
  const spoke=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.05,0.05),MAT.shaft);
  spoke.rotation.x=(i/6)*Math.PI*2; couplingG.add(spoke);
}
couplingG.position.x=1.05;
motG.add(maq,couplingG);
motG.add(labelSprite('M 3~','#8ab4f8'));
motG.position.set(-0.3,1.15,-0.05);
motG.userData={act:'mot3d',title:'Motor de inducción trifásico'};
maq.traverse(o=>{ if(o.isMesh) o.userData=motG.userData; });
benchG.add(motG);

// carga mecánica (freno / dinamómetro)
const loadG=new THREE.Group();
const loadBox=roundedBox(0.7,0.5,0.5,MAT.loadBlock,0.06);
loadG.add(loadBox);
loadG.add(labelSprite('TL','#e08a8a'));
loadG.position.set(1.7,1.2,-0.05);
loadG.userData={act:'load3d',title:'Carga mecánica (freno / dinamómetro)'};
loadBox.userData=loadG.userData;
benchG.add(loadG);

const panelD=makeDisplayBox(1.0,0.6,0.08,256,160);
panelD.g.position.set(-2.35,1.85,0.7);
panelD.g.userData={act:'paneld3d',title:'Display del variador — f, ns'};
benchG.add(panelD.g);

const meter=makeDisplayBox(1.0,0.6,0.08,256,160);
meter.g.position.set(2.35,1.85,0.7);
meter.g.userData={act:'meter3d',title:'Medidor de eje — velocidad y deslizamiento'};
benchG.add(meter.g);

benchG.add(
  cable([new THREE.Vector3(-2.0,1.85,-0.8),new THREE.Vector3(-2.0,1.6,-0.4),new THREE.Vector3(-2.0,1.4,-0.05)],MAT.cable),
  cable([new THREE.Vector3(-2.0,1.1,-0.05),new THREE.Vector3(-1.3,1.0,-0.1),new THREE.Vector3(-0.75,1.05,-0.05)],MAT.cable),
);

benchG.traverse(o=>{ if(o.isMesh&&o!==board){ o.castShadow=true; o.receiveShadow=true; } });
S.scene.add(benchG);

function drawPanelD(){
  const c=panelD.cx, hide=(mode==='reto'&&MYST&&MYST.kind==='calaFrecuencia'&&!retoSolved);
  c.fillStyle='#0a1116'; c.fillRect(0,0,256,160);
  c.fillStyle='#6a8088'; c.font='13px system-ui'; c.textAlign='left';
  c.fillText('VARIADOR (VFD)',10,20);
  c.font='bold 22px system-ui';
  if(hide){
    c.fillStyle='#ffcf8a'; c.fillText('f = ¿? Hz',10,60); c.fillText('ns = ¿? rpm',10,95);
  } else {
    c.fillStyle='#eaf4f1'; c.fillText(`f = ${fCmd.toFixed(1)} Hz`,10,60);
    c.fillText(`ns = ${ns(fCmd).toFixed(0)} rpm`,10,95);
  }
  c.font='13px system-ui'; c.fillStyle='#7a9098';
  c.fillText(`V/f = ${(vcmd(fCmd)*100).toFixed(0)} % de V nominal`,10,125);
  panelD.tx.needsUpdate=true;
}
function drawMeter3D(){
  const c=meter.cx, hide=(mode==='reto'&&MYST&&MYST.kind==='calaFrecuencia'&&!retoSolved);
  c.fillStyle='#0a1116'; c.fillRect(0,0,256,160);
  c.fillStyle='#6a8088'; c.font='13px system-ui'; c.textAlign='left';
  c.fillText('EJE — VELOCIDAD Y DESLIZAMIENTO',10,20);
  const s=stableSlip(tl,fCmd);
  c.font='bold 20px system-ui';
  if(hide){
    c.fillStyle='#ffcf8a'; c.fillText('n = ¿?',10,60); c.fillText('s = ¿?',10,90);
  } else if(s==null){
    c.fillStyle='#ff8a8a'; c.fillText('⚠ CALADO',10,65);
    c.font='13px system-ui'; c.fillStyle='#e0a3a3'; c.fillText('par insuficiente a esta f',10,90);
  } else {
    c.fillStyle='#eaf4f1'; c.fillText(`n = ${(ns(fCmd)*(1-s)).toFixed(0)} rpm`,10,60);
    c.fillStyle=s<0.1?'#8ff0d0':'#ffcf8a';
    c.fillText(`s = ${(s*100).toFixed(1)} %`,10,90);
  }
  c.font='12px system-ui'; c.fillStyle='#7a9098';
  c.fillText(`TL = ${tl.toFixed(1)} N·m`,10,120);
  meter.tx.needsUpdate=true;
}
function refreshBenchDyn(){
  drawPanelD(); drawMeter3D();
  const t=(fCmd-FMIN)/(FMAX-FMIN);
  dialArm.rotation.y=-Math.PI*0.66+t*Math.PI*1.32;
}

/* ---------- §6 HUD + panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">D5 · Máquinas eléctricas — Variador de frecuencia</div>
  <h2>Control V/f de un Motor de Inducción</h2>
  <p>Un variador de frecuencia (VFD) no solo cambia la frecuencia que alimenta al motor: cambia el voltaje en la misma proporción, manteniendo <b>V/f≈constante</b>. Eso conserva aproximadamente el flujo del entrehierro y, con él, el par máximo disponible — el motor puede arrancar y operar a baja velocidad con par prácticamente constante, algo que un arranque directo a la red (DOL) no puede ofrecer.</p>
  <p>Arriba de la frecuencia base (60 Hz) el variador ya no puede subir más el voltaje (está en su límite nominal): entra la zona de <b>debilitamiento de campo</b>, donde el par de ruptura cae con (f_base/f)².</p>
  <div class="formula">ns=120f/polos<br>Tmax(f)=Tmax_base·v(f)²·(f_base/f)²<br>T(s,f)=2Tmax(f)/(s/sm(f)+sm(f)/s)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>f = 20 Hz</div>
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>f = 40 Hz</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>f = 60 Hz (base)</div>
    <div class="li"><span class="dot" style="background:#FF6B6B"></span>f = 80 Hz (debilitado)</div>
    <div class="li"><span class="dot" style="background:#FFFFFF"></span>curva viva (f actual del variador)</div>
    <div class="li"><span class="dot" style="background:#FF5C5C"></span>par de arranque DOL a 60 Hz (referencia)</div>
    <div class="li"><span class="dot" style="background:#EAF4F1"></span>par de ruptura de cada curva</div>
  </div>
  <div class="fid">
    <span class="ft">CONTRATO DE FIDELIDAD</span>
    <span class="fl">SÍ:</span> modela la ley V/f=constante hasta la frecuencia base, el debilitamiento de campo arriba de ella, la curva completa de Kloss par-deslizamiento a cualquier frecuencia comandada, y la comparación cuantitativa entre arranque directo (DOL) y arranque con rampa V/f.
    <span class="no">NO:</span> corriente de línea real ni el boost de tensión IR a baja frecuencia de un variador real (⚑), saturación magnética, armónicos de conmutación PWM, dinámica temporal de arranque (inercia/tiempo), ni protecciones reales del variador.
  </div>
  <div class="src">Tratamiento clásico del modelo de Kloss y del control V/f en textos de máquinas eléctricas y electrónica de potencia (p. ej. Fitzgerald/Kingsley/Umans, Chapman, Bose); Tmax_base y sm_base ⚑ ilustrativos de catálogo típico, no verificados contra una máquina real.</div>
`;

document.getElementById('panel').innerHTML=`
  <h4>Variador V/f · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">Explora</button>
    <button class="b" id="m_comparar">Comparar</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" class="mision"></div>

  <h4 class="sec">Frecuencia preestablecida</h4>
  <div class="modebar">
    <button class="b" id="fp_20">20 Hz</button>
    <button class="b" id="fp_40">40 Hz</button>
    <button class="b on" id="fp_60">60 Hz</button>
    <button class="b" id="fp_80">80 Hz</button>
  </div>

  <label class="slabel">Frecuencia comandada f (<b id="av">60</b> Hz)
    <input type="range" id="sF" min="${FMIN}" max="${FMAX}" step="1" value="60">
  </label>
  <label class="slabel">Par de carga TL (<b id="avTl">8.0</b> N·m)
    <input type="range" id="sTl" min="${TL_MIN}" max="${TL_MAX}" step="0.5" value="8">
  </label>

  <div id="tele">
    <div class="g"><span class="l">f</span><b id="t_f">—</b></div>
    <div class="g"><span class="l">V/f</span><b id="t_v">—</b></div>
    <div class="g"><span class="l">ns</span><b id="t_ns">—</b></div>
    <div class="g"><span class="l">Tmax</span><b id="t_tmax">—</b></div>
    <div class="g"><span class="l">n</span><b id="t_n">—</b></div>
    <div class="g"><span class="l">s</span><b id="t_s">—</b></div>
    <div class="g"><span class="l">Régimen</span><b id="t_regimen">—</b></div>
  </div>

  <div class="console"><div id="report"></div></div>

  <div class="btns">
    <button class="b" id="btnDOL">⚡ Arranque directo (DOL)</button>
    <button class="b" id="btnRamp">📈 Arranque con rampa V/f</button>
  </div>

  <div id="retoBox" style="display:none">
    <h4 class="sec">Tu respuesta</h4>
    <p id="retoHint" class="hint"></p>
    <div class="row">
      <input type="text" id="retoInput" placeholder="0.00">
      <span id="retoUnit" class="unit"></span>
      <button class="b primary" id="btnCheck">Comprobar</button>
    </div>
    <span id="retoOut"></span>
  </div>

  <h4 class="sec">Pregunta de ingeniería</h4>
  <p id="q_text"></p>
  <div class="btns" id="dxbtns"></div>

  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado</button>
    <button class="b" id="btnNew">🔀 Nuevo caso misterioso</button>
  </div>
`;
const el=id=>document.getElementById(id);

/* ---------- §7 Toast ---------- */
let toastTimer=null;
function showToast(msg){ const t=el('toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('on'),5200); }

/* ---------- §8 Modos ---------- */
const MODE_META={
  explora:{nombre:'Explora',cam:[[7.6,5.0,8.6],[0,1.1,0]],mision:'EXPLORA · mueve la frecuencia f y el par de carga TL. Observa cómo cambia la velocidad y el deslizamiento — y prueba los botones de arranque DOL vs. rampa.'},
  comparar:{nombre:'Comparar',cam:[[0,4.4,9.6],[0,1.6,-0.6]],mision:'COMPARA · las cuatro curvas de referencia (20/40/60/80 Hz) se dibujan juntas. Nota que arriba de 60 Hz el par de ruptura empieza a caer.'},
  reto:{nombre:'Reto',cam:[[3.4,3.4,7.2],[0,1.4,-0.4]],mision:'RETO · encuentra la frecuencia máxima antes del calado, a mano o ajustando el variador, según el tipo de reto.'},
};

function tolText(){ return MYST ? `± ${MYST.tol.toFixed(1)} Hz` : ''; }

function syncFpButtons(){
  ['fp_20','fp_40','fp_60','fp_80'].forEach(id=>el(id).classList.remove('on'));
  const hit={20:'fp_20',40:'fp_40',60:'fp_60',80:'fp_80'}[Math.round(fCmd)];
  if(hit) el(hit).classList.add('on');
}

function syncLocks(){
  const locked=(mode==='reto');
  const lockAll=(locked&&MYST&&MYST.kind==='calaFrecuencia');
  [el('fp_20'),el('fp_40'),el('fp_60'),el('fp_80')].forEach(b=>b.disabled=locked);
  el('sTl').disabled=locked;
  el('sF').disabled=lockAll;
  el('btnDOL').disabled=locked;
  el('btnRamp').disabled=locked;
}

function setMode(k){
  mode=k; solved=false;
  ['m_explora','m_comparar','m_reto'].forEach(id=>el(id).classList.toggle('on',id==='m_'+k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('p_mision').textContent=MODE_META[k].mision;
  el('retoBox').style.display=(k==='reto')?'block':'none';

  if(k==='reto'){
    if(!MYST) genMystery();
    tl=MYST.TL;
    el('sTl').value=tl; el('avTl').textContent=tl.toFixed(1);
    if(MYST.kind==='calaFrecuencia'){
      el('retoHint').textContent=`Con un par de carga TL = ${MYST.TL} N·m, calcula a mano la frecuencia MÁXIMA a la que el variador aún puede sostener esa carga sin calar el motor (arriba de esa f, el par de ruptura ya no alcanza). Usa Tmax_base=${TMAX_BASE} N·m y f_base=${F_BASE} Hz.`;
    } else {
      fCmd=FMAX; el('sF').value=fCmd; el('av').textContent=fCmd.toFixed(0);
      el('retoHint').textContent=`Con un par de carga TL = ${MYST.TL} N·m fijo, reduce la frecuencia f con el deslizador hasta encontrar el punto exacto donde el motor deja de estar calado y empieza a girar establemente. Escribe esa frecuencia límite.`;
    }
    el('retoUnit').textContent='Hz';
  }
  syncFpButtons(); syncLocks(); clearDx(); refreshQuestion(); refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}

function setFcmd(v){
  if(mode==='reto'&&MYST&&MYST.kind==='calaFrecuencia') return;
  fCmd=Math.max(FMIN,Math.min(FMAX,v));
  el('sF').value=fCmd; el('av').textContent=fCmd.toFixed(0);
  syncFpButtons();
  refreshAll();
}
function setTl(v){
  if(mode==='reto') return;
  tl=Math.max(TL_MIN,Math.min(TL_MAX,v));
  el('sTl').value=tl; el('avTl').textContent=tl.toFixed(1);
  refreshAll();
}

/* ---------- §9 Telemetría + reporte ---------- */
function set(id,txt,cls){ const n=el(id); n.textContent=txt; n.classList.remove('good','warn','bad'); if(cls) n.classList.add(cls); }

function updateTele(){
  const hide=(mode==='reto'&&MYST&&MYST.kind==='calaFrecuencia'&&!retoSolved);
  if(hide){
    set('t_f','¿?','warn'); set('t_v','¿?','warn'); set('t_ns','¿?','warn');
    set('t_tmax','¿?','warn'); set('t_n','¿?','warn'); set('t_s','¿?','warn'); set('t_regimen','¿?','warn');
    return;
  }
  set('t_f',fCmd.toFixed(1)+' Hz');
  set('t_v',(vcmd(fCmd)*100).toFixed(0)+' %');
  set('t_ns',ns(fCmd).toFixed(0)+' rpm');
  set('t_tmax',tmax(fCmd).toFixed(2)+' N·m');
  const s=stableSlip(tl,fCmd);
  if(s==null){
    set('t_n','—','bad'); set('t_s','—','bad');
    set('t_regimen','CALADO — par insuficiente','bad');
  } else {
    const n=ns(fCmd)*(1-s);
    set('t_n',n.toFixed(0)+' rpm', s>0.5?'warn':'good');
    set('t_s',(s*100).toFixed(1)+' %', s>0.5?'warn':'good');
    set('t_regimen','régimen estable','good');
  }
}

function updateReport(){
  const L=[];
  const sl=stableSlip(tl,fCmd);
  if(mode==='explora'){
    L.push(`Frecuencia comandada: <b>${fCmd.toFixed(1)} Hz</b> (V/f=${(vcmd(fCmd)*100).toFixed(0)}%). Par de carga: <b>${tl.toFixed(1)} N·m</b>.`);
    if(sl!=null) L.push(`Velocidad estable: ${(ns(fCmd)*(1-sl)).toFixed(0)} rpm, deslizamiento ${(sl*100).toFixed(1)}%.`);
    else L.push('El motor está calado a esta frecuencia — reduce TL o sube f para recuperar par disponible.');
  } else if(mode==='comparar'){
    L.push('Las cuatro curvas de referencia comparten Tmax_base y sm_base; solo cambia f. Nota que sm(f)·ns(f) es constante (=270 rpm) para las cuatro — una propiedad del modelo de Kloss con V/f=cte.');
    L.push(`Curva viva (blanca): f = ${fCmd.toFixed(1)} Hz.`);
  } else {
    if(MYST.kind==='calaFrecuencia'){
      L.push(`Reto: calcula la frecuencia máxima antes del calado para TL = ${MYST.TL} N·m.`);
      L.push(retoSolved?`<span class="ok">${retoMsg}</span>`:'Escribe tu resultado en Hz y comprueba.');
    } else {
      L.push(`Reto: reduce f hasta encontrar el límite de calado para TL = ${MYST.TL} N·m.`);
      L.push(retoSolved?`<span class="ok">${retoMsg}</span>`:'Mueve el deslizador de frecuencia y observa el régimen en la telemetría.');
    }
  }
  el('report').innerHTML=L.map(s=>'<div>'+s+'</div>').join('');
}

function refreshAll(){ drawBoard(); updateTele(); updateReport(); refreshBenchDyn(); }

/* ---------- §10 Reto ---------- */
function checkReto(){
  if(!MYST) return;
  const v=parseFloat(el('retoInput').value.replace(',','.'));
  if(!isFinite(v)){
    el('retoOut').innerHTML='<span class="dtc">Escribe un número.</span>'; return;
  }
  const ok=Math.abs(v-MYST.target)<=MYST.tol;
  if(ok){
    retoSolved=true; solved=true;
    retoMsg=`f_máx = f_base·√(Tmax_base/TL) = ${F_BASE}×√(${TMAX_BASE}/${MYST.TL}) = ${MYST.target.toFixed(2)} Hz — arriba de esta frecuencia, el debilitamiento de campo deja el par de ruptura por debajo de ${MYST.TL} N·m y el motor se cala.`;
    el('retoOut').innerHTML=`<span class="ok">✔ ¡Correcto! (tolerancia ${tolText()})</span>`;
    synth.beep(880,.1,.08); setTimeout(()=>synth.beep(1175,.15,.08),140);
  } else {
    retoMsg='';
    el('retoOut').innerHTML=`<span class="dtc">✘ Aún no. Tolerancia: ${tolText()}</span>`;
    synth.beep(180,.12,.08);
  }
  refreshAll();
}

function newMystery(){
  genMystery();
  el('retoInput').value=''; el('retoOut').innerHTML='';
  buildQuiz();
  setMode('reto');
  showToast(MYST.kind==='calaFrecuencia'
    ? `Nuevo caso: calcula la f máxima antes del calado para TL = ${MYST.TL} N·m.`
    : `Nuevo caso: encuentra por prueba la f límite para TL = ${MYST.TL} N·m.`);
}

/* ---------- §11 Quiz ---------- */
function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
let QUIZ={};
function buildQuiz(){
  QUIZ.explora={
    pregunta:'¿Por qué un variador V/f cambia el voltaje junto con la frecuencia, en vez de solo la frecuencia?',
    opciones:shuffle([
      {t:'Para mantener aproximadamente constante el flujo del entrehierro y el par disponible',ok:true,why:'Correcto: el flujo depende de V/f; si solo bajara f sin bajar V, el flujo (y las corrientes de magnetización) crecerían fuera de lo tolerable.'},
      {t:'Para que el motor gire más rápido',ok:false,why:'No: la velocidad depende de f, no directamente de V — cambiar V solo no cambia la velocidad síncrona.'},
      {t:'Para ahorrar energía en el propio variador',ok:false,why:'No: la ley V/f=cte es sobre el flujo del motor, no una medida de eficiencia interna del variador.'},
      {t:'Es un requisito solo a frecuencias mayores a 60 Hz',ok:false,why:'Al revés: la ley V/f=cte aplica principalmente POR DEBAJO de la frecuencia base; arriba de ella el voltaje ya está saturado.'},
    ]),
  };
  QUIZ.comparar={
    pregunta:'¿Qué le pasa al par de ruptura (Tmax) del motor cuando el variador sube la frecuencia arriba de la base (60 Hz)?',
    opciones:shuffle([
      {t:'Cae, porque el voltaje ya no puede seguir subiendo (debilitamiento de campo)',ok:true,why:'Correcto: arriba de f_base el variador satura el voltaje en su valor nominal, así que V/f ya no es constante y el flujo (y Tmax) caen con (f_base/f)².'},
      {t:'Se mantiene exactamente igual en todo el rango',ok:false,why:'No: eso solo es cierto por debajo de la frecuencia base, donde V/f sí se mantiene constante.'},
      {t:'Sube, porque el motor gira más rápido',ok:false,why:'Al revés: girar más rápido con menos flujo reduce el par de ruptura disponible, no lo aumenta.'},
      {t:'Depende únicamente del par de carga TL',ok:false,why:'No: Tmax es una propiedad de la curva a esa frecuencia, no depende de cuánta carga se le pida al motor.'},
    ]),
  };
  if(MYST){
    if(MYST.kind==='calaFrecuencia'){
      QUIZ.reto={
        pregunta:'¿Qué fórmula da la frecuencia máxima antes de que el motor se cale bajo un par de carga TL fijo?',
        opciones:shuffle([
          {t:'f_máx = f_base·√(Tmax_base/TL)',ok:true,why:'Correcto: arriba de f_base, Tmax(f)=Tmax_base·(f_base/f)²; igualando Tmax(f)=TL y despejando f se obtiene esa raíz cuadrada.'},
          {t:'f_máx = f_base·(Tmax_base/TL)',ok:false,why:'Falta la raíz cuadrada: Tmax cae con el cuadrado de (f_base/f), no linealmente.'},
          {t:'f_máx = TL/Tmax_base',ok:false,why:'Esa expresión no tiene unidades de frecuencia y no usa f_base.'},
          {t:'f_máx es siempre igual a f_base',ok:false,why:'No: depende de TL — con menos carga, el motor puede subir más en frecuencia antes de calarse.'},
        ]),
      };
    } else {
      QUIZ.reto={
        pregunta:'Buscando por prueba la frecuencia límite: ¿qué señal indica que acabas de cruzar el límite de calado?',
        opciones:shuffle([
          {t:'El régimen pasa de "estable" a "CALADO — par insuficiente"',ok:true,why:'Correcto: justo debajo de f_máx el motor sostiene la carga con algo de deslizamiento; justo arriba, el par de ruptura ya no alcanza y no existe punto de operación estable.'},
          {t:'La velocidad síncrona ns deja de calcularse',ok:false,why:'No: ns=120f/polos siempre existe, sea o no que el motor pueda sostener la carga a esa velocidad.'},
          {t:'El par de carga TL cambia solo',ok:false,why:'No: TL está fijo por el reto; lo que cambia es si el motor puede o no sostenerlo a esa f.'},
          {t:'No hay ninguna señal observable',ok:false,why:'Sí la hay: la telemetría muestra explícitamente el cambio de régimen estable a calado.'},
        ]),
      };
    }
  }
}
function clearDx(){ el('dxbtns').innerHTML=''; }
function refreshQuestion(){
  const q=QUIZ[mode]; if(!q) return;
  el('q_text').textContent=q.pregunta;
  const box=el('dxbtns'); box.innerHTML='';
  q.opciones.forEach((o,i)=>{
    const b=document.createElement('button');
    b.className='b dx';
    b.textContent=String.fromCharCode(65+i)+') '+o.t;
    b.onclick=()=>{
      if(b.classList.contains('right')||b.classList.contains('wrong')) return;
      b.classList.add(o.ok?'right':'wrong');
      showToast(o.why); synth.beep(o.ok?760:220,.1,.07);
    };
    box.appendChild(b);
  });
}

/* ---------- §12 Picking / demos / tour / init ---------- */
pickerFor(S.scene,S.camera,S.renderer.domElement,hit=>{
  if(hit.object===board&&hit.uv){ boardClick(hit.uv.x,hit.uv.y); return; }
  let o=hit.object;
  while(o&&!o.userData?.act) o=o.parent;
  const act=o&&o.userData?.act;
  const hide=(mode==='reto'&&MYST&&MYST.kind==='calaFrecuencia'&&!retoSolved);
  if(act==='vfd3d'){ showToast('Variador de frecuencia: convierte la red fija de 60 Hz en una salida de voltaje y frecuencia variables, manteniendo V/f≈constante.'); synth.beep(560,.08,.06); }
  else if(act==='dial3d'){ showToast(`Perilla de frecuencia: f = ${hide?'¿?':fCmd.toFixed(1)+' Hz'}. Ajusta la velocidad síncrona del motor.`); synth.beep(660,.08,.06); }
  else if(act==='mot3d'){ showToast('Motor de inducción trifásico: su velocidad real siempre queda un poco por debajo de la síncrona — esa diferencia es el deslizamiento.'); synth.beep(520,.08,.06); }
  else if(act==='load3d'){ showToast(`Carga mecánica (freno/dinamómetro): TL = ${hide?'¿?':tl.toFixed(1)+' N·m'}.`); synth.beep(500,.08,.06); }
  else if(act==='paneld3d'){ showToast('Display del variador: muestra la frecuencia comandada y la velocidad síncrona resultante.'); synth.beep(600,.08,.06); }
  else if(act==='meter3d'){ showToast('Medidor de eje: muestra la velocidad real y el deslizamiento — o el estado de calado si el par de carga excede lo disponible.'); synth.beep(600,.08,.06); }
});

(function hoverTip(){
  const ray=new THREE.Raycaster(); const dom=S.renderer.domElement;
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width)*2-1, y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera({x,y},S.camera);
    const hits=ray.intersectObjects(S.scene.children,true);
    let title='';
    for(const h of hits){ let o=h.object; while(o){ if(o.userData?.title){ title=o.userData.title; break; } o=o.parent; } if(title) break; }
    dom.style.cursor=title?'pointer':'default'; dom.title=title;
  });
})();

const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function runDOLDemo(silent){
  if(mode==='reto') return;
  setFcmd(F_BASE);
  await sleep(250);
  if(!silent){
    if(tl<=T_DOL) showToast(`Arranque directo (DOL) a 60 Hz: par de arranque=${T_DOL.toFixed(2)} N·m ≥ TL=${tl.toFixed(1)} N·m → arranca, pero con deslizamiento inicial del 100%.`);
    else showToast(`Arranque directo (DOL) a 60 Hz: par de arranque=${T_DOL.toFixed(2)} N·m < TL=${tl.toFixed(1)} N·m → el motor NO arranca, se queda calado.`);
    synth.beep(tl<=T_DOL?620:220,.12,.08);
  }
}

async function runRampDemo(silent){
  if(mode==='reto') return;
  let peakSlip=0, peakF=FMIN;
  for(let v=FMIN;v<=F_BASE;v+=4){
    setFcmd(v);
    const s=stableSlip(tl,v);
    if(s!=null&&s>peakSlip){ peakSlip=s; peakF=v; }
    await sleep(40);
  }
  if(!silent){
    showToast(`Arranque con rampa V/f: el deslizamiento máximo durante toda la rampa fue ${(peakSlip*100).toFixed(1)}% (en f=${peakF} Hz) — muy por debajo del 100% de un arranque directo.`);
    synth.beep(760,.1,.08);
  }
}

async function runAuto(){
  if(autoRunning) return; autoRunning=true;
  const b=el('btnAuto'); b.disabled=true; b.textContent='▶ En curso…';
  try{
    synth.init(); synth.resume();
    setMode('explora'); setTl(8);
    showToast('1/5 · Explora: barremos f de 8 a 100 Hz con TL=8 N·m.');
    for(let v=FMIN;v<=FMAX;v+=4){ setFcmd(v); await sleep(70); }
    await sleep(300);

    showToast('2/5 · Comparar: las cuatro curvas de referencia, juntas.');
    setMode('comparar');
    for(const f of F_LEVELS){ setFcmd(f); await sleep(500); }
    await sleep(300);

    showToast('3/5 · Comparamos arranque directo (DOL) contra arranque con rampa.');
    setMode('explora'); setTl(5);
    await runDOLDemo(true);
    await sleep(500);
    await runRampDemo(true);
    await sleep(400);

    showToast('4/5 · Reto: resolvemos un caso misterioso.');
    setMode('reto');
    if(MYST.kind==='buscarLimite'){
      for(let v=FMAX;v>=FMIN;v-=1){
        setFcmd(v);
        if(Math.abs(v-MYST.target)<0.6) break;
        await sleep(30);
      }
    }
    el('retoInput').value=MYST.target.toFixed(2);
    checkReto();
    const idx=QUIZ.reto.opciones.findIndex(o=>o.ok);
    if(idx>=0) el('dxbtns').children[idx].click();
    await sleep(600);

    showToast('5/5 · Nuevo caso listo para intentar por tu cuenta.');
    newMystery();
  } finally {
    autoRunning=false; b.disabled=false; b.textContent='✨ Recorrido guiado';
  }
}

S.setAnimate(()=>{
  const s=stableSlip(tl,fCmd);
  const speedFrac = s==null ? 0.02 : (ns(fCmd)*(1-s))/ns(FMAX);
  couplingG.rotation.x += 0.004 + 0.02*speedFrac;
});

['m_explora','m_comparar','m_reto'].forEach(id=>{
  el(id).addEventListener('click',()=>{
    const m=id.slice(2);
    if(mode==='reto'&&!retoSolved&&m!=='reto'){ showToast('🔒 Resuelve el reto actual (o pide un nuevo caso) antes de salir.'); synth.beep(220,.1,.07); return; }
    setMode(m);
  });
});
el('fp_20').addEventListener('click',()=>setFcmd(20));
el('fp_40').addEventListener('click',()=>setFcmd(40));
el('fp_60').addEventListener('click',()=>setFcmd(60));
el('fp_80').addEventListener('click',()=>setFcmd(80));
el('sF').addEventListener('input',e=>setFcmd(parseFloat(e.target.value)));
el('sTl').addEventListener('input',e=>setTl(parseFloat(e.target.value)));
el('btnCheck').addEventListener('click',checkReto);
el('btnAuto').addEventListener('click',runAuto);
el('btnNew').addEventListener('click',newMystery);
el('btnDOL').addEventListener('click',()=>{ if(!autoRunning) runDOLDemo(false); });
el('btnRamp').addEventListener('click',()=>{ if(!autoRunning) runRampDemo(false); });

genMystery(); buildQuiz();
S.start();
setMode('explora');

window.__labDebug={
  state:()=>({mode,fCmd,tl,retoSolved,solved}),
  point:()=>({s:stableSlip(tl,fCmd),n:speedRpm(tl,fCmd)}),
  ns, vcmd, tmax, sm, TofS, stableSlip, speedRpm, fMaxBeforeStall, TatN,
  mystery:()=>MYST?{...MYST}:null,
  setFcmd, setTl,
  checkReto, newMystery, boardClick,
  mode:()=>mode, setMode,
  runDOLDemo, runRampDemo,
};
