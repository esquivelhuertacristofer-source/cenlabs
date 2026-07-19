/* ============================================================
   LAB — Curvas V del Motor Síncrono (compensador de FP)
   Dominio: D5 Máquinas eléctricas · Molde: S+P (esquemático + panel)
   Física: motor síncrono de rotor liso, resistencia de armadura
   despreciable (Ra≈0). Para tensión de fase Vt y reactancia
   síncrona Xs fijas, cada nivel de carga mecánica P (constante)
   define una "curva V": corriente de armadura Ia en función de
   la corriente de campo If (%), con un mínimo exacto en factor
   de potencia unitario. A la izquierda del mínimo el motor
   "pide" reactivos a la red (subexcitado, FP en atraso); a la
   derecha los "entrega" (sobreexcitado, FP en adelanto) — este
   es el mecanismo real detrás de usar un motor síncrono como
   compensador de factor de potencia en una planta industrial
   que comparte el mismo bus con cargas inductivas.

   Modelo (por fase, diagrama fasorial con Ra≈0):
     Ef∠−δ = Vt∠0° − j·Xs·Ia      sen δ = P·Xs / (Vt·Ef)
   δ se resuelve en forma cerrada; de ahí Ia y Q por fase. El
   reto de compensación invierte el problema con bisección:
   dado un Q objetivo (cancelar la carga industrial), ¿qué Ef
   (If%) lo produce, respetando el límite térmico de armadura?

   ⚑ Vt_línea, Xs, Ia_nom, If_mín/máx y las dos cargas
   industriales son valores ilustrativos de catálogo típico
   (motor síncrono industrial de tamaño medio), no de una
   máquina real verificada. NO modela: saturación magnética
   (curva de magnetización se asume lineal), resistencia de
   armadura, arranque/sincronización a la red, límite de
   estabilidad dinámica transitoria, ni pérdidas mecánicas
   o de núcleo.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[7.5,5.2,8.4],target:[0,1.1,0],bgTop:'#0b1520',bgBot:'#03070a',bloom:0.35,minD:4,maxD:16});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2200,Q:0.7});

/* ---------- §1 Modelo físico ---------- */
const VT_LINE=460;                 // ⚑ tensión de línea trifásica ilustrativa (V)
const VT=VT_LINE/Math.sqrt(3);     // tensión de fase (V) ≈ 265.58
const XS=4;                        // ⚑ reactancia síncrona por fase, rotor liso (Ω)
const IA_RATED=50;                 // ⚑ límite térmico de armadura (A)
const IF_MIN=60, IF_MAX=180;       // rango del reóstato de campo (% de If nominal)
const P_LEVELS=[0,8000,15000];     // niveles de carga mecánica trifásica (W)
const P_COLOR={0:'#4FD1C5',8000:'#FFB703',15000:'#8AB4F8'};
const P_LABEL={0:'0 kW (condensador síncrono)',8000:'8 kW',15000:'15 kW'};
const LOADS={
  A:{p3:50000,pf:0.8,label:'Carga A · 50 kW, FP 0.80 atraso'},
  B:{p3:70000,pf:0.7,label:'Carga B · 70 kW, FP 0.70 atraso'},
};

function efFromIf(ifPct){ return VT*(ifPct/100); }
function ifFromEf(ef){ return (ef/VT)*100; }

// Punto de operación por fase para una Ef y una carga trifásica P3 dadas.
function motorPQ(Ef,P3){
  const P1=P3/3;
  const s=(P1*XS)/(VT*Ef);
  if(!isFinite(s)||Math.abs(s)>1) return null;      // fuera de sincronismo
  const delta=-Math.asin(s);
  const Efx=Ef*Math.cos(delta), Efy=Ef*Math.sin(delta);
  const Vx=VT-Efx, Vy=-Efy;
  const Iax=Vy/XS, Iay=-Vx/XS;
  const IaMag=Math.hypot(Iax,Iay);
  const P1c=VT*Iax;
  const Q1=VT*(-Iay);
  return {IaMag,P1:P1c,Q1,Q3:Q1*3,delta};
}

function bisect(f,lo,hi,iters){
  let a=lo,b=hi,fa=f(a);
  for(let i=0;i<iters;i++){
    const m=(a+b)/2, fm=f(m);
    if((fa<0)===(fm<0)){a=m;fa=fm;} else {b=m;}
  }
  return (a+b)/2;
}

function iaMinAt(P3){ return (P3/3)/VT; }

function efUnityPF(P3){
  if(P3<=1e-6) return VT;
  const g=Ef=>{ const r=motorPQ(Ef,P3); return r? r.Q1 : -1e9; };
  return bisect(g,VT,VT*3,60);
}

function efAtIaRatedOver(P3){
  if(P3<=1e-6) return VT+IA_RATED*XS;
  const efU=efUnityPF(P3);
  const h=Ef=>{ const r=motorPQ(Ef,P3); return r? r.IaMag-IA_RATED : 1e9; };
  return bisect(h,efU,VT*6,60);
}

function efForQtarget(P3,Q3target){
  const Q1t=Q3target/3;
  const g=Ef=>{ const r=motorPQ(Ef,P3); return r? r.Q1-Q1t : -1e9; };
  return bisect(g,VT*0.3,VT*6,60);
}

// Corrección de FP total del bus (motor síncrono + carga industrial).
function fpCorrectionTarget(P3,loadKey){
  const load=LOADS[loadKey];
  const Qind3=load.p3*Math.tan(Math.acos(load.pf));
  let Ef=efForQtarget(P3,-Qind3);
  let r=motorPQ(Ef,P3);
  let limited=false;
  if(!r||r.IaMag>IA_RATED){
    Ef=efAtIaRatedOver(P3);
    r=motorPQ(Ef,P3);
    limited=true;
  }
  const Ptotal3=P3+load.p3;
  const Qtotal=Qind3+r.Q3;
  const Stotal=Math.hypot(Ptotal3,Qtotal);
  const FPtotal=Stotal>0?Ptotal3/Stotal:1;
  return {Ef,IfPct:ifFromEf(Ef),IaSync:r.IaMag,Qind3,Qsync3:r.Q3,Qtotal,Ptotal3,FPtotal,limited};
}

function estadoFP(Q1){
  if(Math.abs(Q1)<VT*0.02) return 'unidad';
  return Q1>0 ? 'atraso' : 'adelanto';
}

/* ---------- §2 Estado ---------- */
let mode='explora', psync=8000, loadKey='ninguna', ifPct=100;
let MYST=null, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false;

function genMystery(){
  if(Math.random()<0.25){
    const P3=Math.random()<0.5?8000:15000;
    const target=iaMinAt(P3);
    MYST={kind:'minIa',P3,target,tol:0.3};
  } else {
    const P3=P_LEVELS[Math.floor(Math.random()*P_LEVELS.length)];
    const lk=Math.random()<0.5?'A':'B';
    const r=fpCorrectionTarget(P3,lk);
    MYST={kind:'fpCorrection',P3,loadKey:lk,target:r.FPtotal,tol:0.01,limited:r.limited};
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
  motorBody:std({color:0x2c3e46,metalness:0.7,roughness:0.35}),
  motorEnd:std({color:0x40555f,metalness:0.7,roughness:0.3}),
  shaft:std({color:0xb9c4c9,metalness:0.9,roughness:0.2}),
  dialBody:std({color:0x223038,metalness:0.6,roughness:0.4}),
  dialArm:std({color:0x4fd1c5,metalness:0.5,roughness:0.3,emissive:0x0d3a35,emissiveIntensity:0.4}),
  loadBlock:std({color:0x5a3b3b,metalness:0.5,roughness:0.5}),
  panelBody:std({color:0x101a20,metalness:0.4,roughness:0.6}),
  cable:std({color:0x1a1a1a,metalness:0.2,roughness:0.8}),
};

/* ---------- §4 Pizarrón (canvas V-curves) ---------- */
const bCv=document.createElement('canvas'); bCv.width=1024; bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv);

const PX0=110,PX1=980,PY0=300,PY1=700;
const YMAX=65, YTICK=10;

function xPix(ifp){ return PX0+((ifp-IF_MIN)/(IF_MAX-IF_MIN))*(PX1-PX0); }
function yPix(a){ return PY1-(a/YMAX)*(PY1-PY0); }

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
    const ifp=IF_MIN+((px-PX0)/(PX1-PX0))*(IF_MAX-IF_MIN);
    const v=fn(ifp);
    if(!isFinite(v)){ pen=false; continue; }
    const y=yPix(v);
    if(y<PY0-2||y>PY1+2){ pen=false; continue; }
    pen?c.lineTo(px,y):c.moveTo(px,y); pen=true;
  }
  c.stroke(); c.setLineDash([]);
}

function drawSchematic(c,hideLoad){
  const bx0=110,by=70,bx1=980;
  line(c,bx0,by,bx1,by,'#ffb703',3);
  c.fillStyle='#ffb703'; c.font='16px system-ui'; c.textAlign='left';
  c.fillText('BUS 460 V',bx0,by-12);

  // motor síncrono
  const mx=280;
  line(c,mx,by,mx,by+40,'#8aa','2');
  c.beginPath(); c.arc(mx,by+80,40,0,Math.PI*2); c.fillStyle='#16232a'; c.fill(); c.strokeStyle='#8ab4f8'; c.lineWidth=2.5; c.stroke();
  c.fillStyle='#eaf4f1'; c.font='bold 20px system-ui'; c.textAlign='center'; c.fillText('MS',mx,by+87);
  c.font='14px system-ui'; c.fillStyle='#9fb'; c.fillText('motor síncrono',mx,by+140);
  // reóstato de campo, línea punteada al rotor
  line(c,mx+40,by+80,mx+130,by+80,'#4fd1c5',2,[5,4]);
  rr(c,mx+130,by+62,60,36,6,'#152025','#4fd1c5',1.5);
  c.fillStyle='#4fd1c5'; c.font='13px system-ui'; c.fillText('If',mx+160,by+84);

  if(!hideLoad && loadKey!=='ninguna'){
    const load=LOADS[loadKey];
    const lx=700;
    line(c,lx,by,lx,by+40,'#8aa','2');
    rr(c,lx-55,by+40,110,55,6,'#241a1a','#e08a8a',1.5);
    c.fillStyle='#e08a8a'; c.font='13px system-ui'; c.textAlign='center';
    c.fillText('CARGA IND.',lx,by+62);
    c.fillText(`${(load.p3/1000).toFixed(0)} kW · FP ${load.pf.toFixed(2)}`,lx,by+80);
    c.font='12px system-ui'; c.fillStyle='#9ab'; c.fillText('comparte el mismo bus',lx,by+108);
  }
}

function drawBoard(){
  bCx.fillStyle='#0a1116'; bCx.fillRect(0,0,1024,768);
  rr(bCx,4,4,1016,760,14,null,'#22323b',2);

  bCx.fillStyle='#eaf4f1'; bCx.font='bold 30px system-ui'; bCx.textAlign='left';
  bCx.fillText('Curvas V del Motor Síncrono',36,46);

  if(mode==='reto'){
    rr(bCx,700,16,300,40,8,retoSolved?'#123a2a':'#3a1f12',retoSolved?'#4fd1c5':'#e0a35c',1.5);
    bCx.fillStyle=retoSolved?'#8ff0d0':'#ffcf8a'; bCx.font='bold 15px system-ui'; bCx.textAlign='center';
    bCx.fillText(retoSolved?'✔ RETO RESUELTO':'🎯 RETO: dato desconocido',850,41);
  }

  const hideCurve=(mode==='reto'&&MYST&&MYST.kind==='minIa'&&!retoSolved);
  drawSchematic(bCx,hideCurve);

  bCx.font='14px system-ui'; bCx.fillStyle='#8aa'; bCx.textAlign='left';
  bCx.fillText('sen δ = P·Xs/(Vt·Ef)    Ia = |Vt∠0° − Ef∠−δ| / Xs    Ia_mín = P/(3·Vt) en FP unitario',36,270);

  // área de la gráfica
  rr(bCx,PX0-30,PY0-20,PX1-PX0+60,PY1-PY0+70,10,'#0d161c','#22323b',1.5);

  // rejilla Y
  for(let a=0;a<=YMAX;a+=YTICK){
    const y=yPix(a);
    line(bCx,PX0,y,PX1,y,'#182228',1);
    bCx.fillStyle='#6a8088'; bCx.font='12px system-ui'; bCx.textAlign='right';
    bCx.fillText(String(a),PX0-10,y+4);
  }
  bCx.save(); bCx.translate(40,(PY0+PY1)/2); bCx.rotate(-Math.PI/2);
  bCx.fillStyle='#9ab'; bCx.font='13px system-ui'; bCx.textAlign='center';
  bCx.fillText('Ia — corriente de armadura (A)',0,0); bCx.restore();

  // rejilla X
  for(let v=IF_MIN;v<=IF_MAX;v+=20){
    const x=xPix(v);
    line(bCx,x,PY0,x,PY1,'#182228',1);
    bCx.fillStyle='#6a8088'; bCx.font='12px system-ui'; bCx.textAlign='center';
    bCx.fillText(v+'%',x,PY1+20);
  }
  bCx.fillStyle='#9ab'; bCx.font='13px system-ui'; bCx.textAlign='center';
  bCx.fillText('If — corriente de campo (% de If nominal)',(PX0+PX1)/2,PY1+42);

  // línea de excitación normal (Ef=Vt, If=100%)
  line(bCx,xPix(100),PY0,xPix(100),PY1,'#3a4a52',1.5,[4,4]);
  bCx.fillStyle='#7a9098'; bCx.font='12px system-ui'; bCx.textAlign='center';
  bCx.fillText('excitación normal',xPix(100),PY0-8);

  // límite térmico Ia_nom
  line(bCx,PX0,yPix(IA_RATED),PX1,yPix(IA_RATED),'#ff5c5c',2,[7,4]);
  bCx.fillStyle='#ff8a8a'; bCx.font='12px system-ui'; bCx.textAlign='left';
  bCx.fillText(`Ia nominal = ${IA_RATED} A (límite térmico ⚑)`,PX0+6,yPix(IA_RATED)-8);

  if(!hideCurve){
    for(const P3 of P_LEVELS){
      const active=(P3===psync);
      plotFn(bCx,ifp=>{ const r=motorPQ(efFromIf(ifp),P3); return r?r.IaMag:NaN; },P_COLOR[P3],active?3.2:1.6,active?[]:[6,4]);
      const efu=efUnityPF(P3);
      const px=xPix(ifFromEf(efu)), py=yPix(iaMinAt(P3));
      if(px>=PX0&&px<=PX1){
        bCx.beginPath(); bCx.arc(px,py,4.5,0,Math.PI*2);
        bCx.fillStyle='#eaf4f1'; bCx.fill(); bCx.strokeStyle=P_COLOR[P3]; bCx.lineWidth=2; bCx.stroke();
      }
    }
    // punto de operación vivo
    const r=motorPQ(efFromIf(ifPct),psync);
    if(r){
      const px=xPix(ifPct), py=yPix(r.IaMag);
      if(px>=PX0&&px<=PX1&&py>=PY0-2&&py<=PY1+2){
        line(bCx,px,PY0,px,py,'#ffffff55',1,[3,3]);
        line(bCx,PX0,py,px,py,'#ffffff55',1,[3,3]);
        bCx.beginPath(); bCx.arc(px,py,6,0,Math.PI*2);
        bCx.fillStyle='#fff'; bCx.fill(); bCx.strokeStyle='#0a1116'; bCx.lineWidth=2; bCx.stroke();
        bCx.fillStyle='#fff'; bCx.font='bold 13px system-ui'; bCx.textAlign='left';
        bCx.fillText(`If=${ifPct.toFixed(0)}%  Ia=${r.IaMag.toFixed(1)} A`,px+10,py-10);
      }
    }
  } else {
    bCx.fillStyle='#8aa'; bCx.font='italic 15px system-ui'; bCx.textAlign='center';
    bCx.fillText('Curva oculta — calcula Ia_mín a mano y escríbelo abajo',(PX0+PX1)/2,(PY0+PY1)/2);
  }

  bTex.needsUpdate=true;
}

function boardClick(u,v){
  const px=u*1024, py=(1-v)*768;
  const hideCurve=(mode==='reto'&&MYST&&MYST.kind==='minIa'&&!retoSolved);
  if(!hideCurve){
    const r=motorPQ(efFromIf(ifPct),psync);
    if(r){
      const opx=xPix(ifPct), opy=yPix(r.IaMag);
      if(Math.hypot(px-opx,py-opy)<26){
        showToast(`Punto de operación: If=${ifPct.toFixed(0)}%, Ef=${efFromIf(ifPct).toFixed(1)} V, Ia=${r.IaMag.toFixed(2)} A, Q=${(r.Q3/1000).toFixed(2)} kVAR (${estadoFP(r.Q1)}).`);
        synth.beep(700,0.08,0.06); return;
      }
    }
  }
  if(px>200&&px<360&&py>110&&py<230){
    showToast('Motor síncrono trifásico: la corriente de campo If controla la tensión interna Ef y, con ella, el factor de potencia visto por la red.');
    synth.beep(520,0.08,0.06); return;
  }
  showToast('Curvas V: cada curva de color es un nivel distinto de carga mecánica P. El mínimo de cada curva ocurre exactamente en factor de potencia unitario.');
  synth.beep(420,0.08,0.05);
}

/* ---------- §5 Banco 3D modesto ---------- */
// sin objeto físico de inspección detallada — el tablero y la telemetría llevan el peso pedagógico
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
board.userData={title:'Tablero — curvas V del motor síncrono'};
boardFrame.userData=board.userData;
boardG.add(boardFrame,board);
boardG.position.set(0,2.35,-1.55);
S.scene.add(boardG);

const benchG=new THREE.Group();
const mesa=roundedBox(6.2,0.28,3.0,MAT.bench,0.08);
mesa.position.set(0,0.85,0); mesa.receiveShadow=true;
benchG.add(mesa);

// barra de bus
const busBar=new THREE.Mesh(new THREE.BoxGeometry(4.6,0.06,0.06),MAT.bus);
busBar.position.set(0,1.85,-0.8);
benchG.add(busBar);

// motor síncrono (housing + tapas + eje + acople)
const motG=new THREE.Group();
const housing=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,0.95,28),MAT.motorBody);
housing.rotation.z=Math.PI/2; housing.castShadow=true;
const endA=new THREE.Mesh(new THREE.CylinderGeometry(0.44,0.44,0.08,28),MAT.motorEnd);
endA.rotation.z=Math.PI/2; endA.position.x=-0.5;
const endB=endA.clone(); endB.position.x=0.5;
const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.55,16),MAT.shaft);
shaft.rotation.z=Math.PI/2; shaft.position.x=0.75;
const couplingG=new THREE.Group();
for(let i=0;i<6;i++){
  const spoke=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.05,0.05),MAT.shaft);
  spoke.rotation.x=(i/6)*Math.PI*2; couplingG.add(spoke);
}
couplingG.position.x=1.05;
motG.add(housing,endA,endB,shaft,couplingG);
motG.add(labelSprite('M~','#8ab4f8'));
motG.position.set(-1.1,1.15,-0.05);
motG.userData={act:'mot3d',title:'Motor síncrono trifásico'};
housing.userData=motG.userData; endA.userData=motG.userData; endB.userData=motG.userData;
benchG.add(motG);

// reóstato de campo (control If)
const dialG=new THREE.Group();
const dialBody=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.14,24),MAT.dialBody);
dialBody.rotation.x=Math.PI/2; dialBody.castShadow=true;
const dialArm=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.045,0.045),MAT.dialArm);
dialArm.position.set(0.11,0,0.09);
dialG.add(dialBody,dialArm);
dialG.add(labelSprite('If','#4fd1c5'));
dialG.position.set(0.35,1.32,-0.05);
dialG.userData={act:'rheostat3d',title:'Reóstato de campo (control de If)'};
dialBody.userData=dialG.userData;
benchG.add(dialG);

// carga industrial (bloque, visibilidad conmutada)
const loadG=new THREE.Group();
const loadBox=roundedBox(0.7,0.5,0.5,MAT.loadBlock,0.06);
loadG.add(loadBox);
loadG.add(labelSprite('IND','#e08a8a'));
loadG.position.set(1.9,1.2,-0.05);
loadG.userData={act:'load3d',title:'Carga industrial (comparte el bus)'};
loadBox.userData=loadG.userData;
benchG.add(loadG);

const panelD=makeDisplayBox(1.0,0.6,0.08,256,160);
panelD.g.position.set(-2.35,1.6,0.7);
panelD.g.userData={act:'paneld3d',title:'Analizador de red — Ia, Q'};
benchG.add(panelD.g);

const meter=makeDisplayBox(1.0,0.6,0.08,256,160);
meter.g.position.set(2.35,1.6,0.7);
meter.g.userData={act:'meter3d',title:'Medidor de factor de potencia'};
benchG.add(meter.g);

benchG.add(
  cable([new THREE.Vector3(-2.0,1.85,-0.8),new THREE.Vector3(-1.1,1.7,-0.4),new THREE.Vector3(-1.1,1.4,-0.05)],MAT.cable),
  cable([new THREE.Vector3(0.35,1.85,-0.8),new THREE.Vector3(0.35,1.6,-0.4),new THREE.Vector3(0.2,1.4,-0.05)],MAT.cable),
  cable([new THREE.Vector3(1.9,1.85,-0.8),new THREE.Vector3(1.9,1.55,-0.4),new THREE.Vector3(1.9,1.45,-0.05)],MAT.cable),
);

benchG.traverse(o=>{ if(o.isMesh&&o!==board){ o.castShadow=true; o.receiveShadow=true; } });
S.scene.add(benchG);

function drawPanelD(){
  const c=panelD.cx, hideQ=(mode==='reto'&&MYST&&MYST.kind==='minIa'&&!retoSolved);
  c.fillStyle='#0a1116'; c.fillRect(0,0,256,160);
  c.fillStyle='#6a8088'; c.font='13px system-ui'; c.textAlign='left';
  c.fillText('ANALIZADOR DE RED',10,20);
  const r=motorPQ(efFromIf(ifPct),psync);
  c.font='bold 22px system-ui';
  if(hideQ||!r){
    c.fillStyle='#ffcf8a'; c.fillText('Ia = ¿? A',10,60); c.fillText('Q  = ¿? kVAR',10,95);
  } else {
    c.fillStyle='#eaf4f1'; c.fillText(`Ia = ${r.IaMag.toFixed(1)} A`,10,60);
    c.fillStyle=Math.abs(r.Q3)<VT*3*0.02?'#8ff0d0':'#ffcf8a';
    c.fillText(`Q  = ${(r.Q3/1000).toFixed(2)} kVAR`,10,95);
  }
  c.font='13px system-ui'; c.fillStyle='#7a9098';
  c.fillText(r?`estado: ${estadoFP(r.Q1)}`:'fuera de sincronismo',10,125);
  panelD.tx.needsUpdate=true;
}
function drawMeter3D(){
  const c=meter.cx, hideQ=(mode==='reto'&&MYST&&MYST.kind==='minIa'&&!retoSolved);
  c.fillStyle='#0a1116'; c.fillRect(0,0,256,160);
  c.fillStyle='#6a8088'; c.font='13px system-ui'; c.textAlign='left';
  c.fillText('FACTOR DE POTENCIA',10,20);
  if(loadKey==='ninguna'){
    c.font='14px system-ui'; c.fillStyle='#7a9098';
    c.fillText('sin carga industrial',10,60);
    c.fillText('en el bus',10,80);
  } else {
    const load=LOADS[loadKey];
    const r=motorPQ(efFromIf(ifPct),psync);
    if(hideQ||!r){
      c.font='bold 22px system-ui'; c.fillStyle='#ffcf8a'; c.fillText('FP total = ¿?',10,60);
    } else {
      const Qind3=load.p3*Math.tan(Math.acos(load.pf));
      const Ptotal3=psync+load.p3, Qtotal=Qind3+r.Q3;
      const Stotal=Math.hypot(Ptotal3,Qtotal);
      const FPtotal=Stotal>0?Ptotal3/Stotal:1;
      c.font='bold 24px system-ui'; c.fillStyle=FPtotal>0.98?'#8ff0d0':'#ffcf8a';
      c.fillText(FPtotal.toFixed(3),10,62);
      c.font='12px system-ui'; c.fillStyle='#7a9098';
      c.fillText(`${load.label}`,10,90);
      c.fillText(`Ia motor=${r.IaMag.toFixed(1)}A${r.IaMag>=IA_RATED-0.05?' ⚠ límite':''}`,10,110);
    }
  }
  meter.tx.needsUpdate=true;
}
function refreshBenchDyn(){
  drawPanelD(); drawMeter3D();
  const t=(ifPct-IF_MIN)/(IF_MAX-IF_MIN);
  dialArm.rotation.y=-Math.PI*0.66+t*Math.PI*1.32;
  loadG.visible=(loadKey!=='ninguna');
}

/* ---------- §6 HUD + panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">D5 · Máquinas eléctricas — Motor síncrono</div>
  <h2>Curvas V del Motor Síncrono</h2>
  <p>Un motor síncrono sobreexcitado se comporta como un capacitor: entrega reactivos a la red en vez de pedirlos. Ajustando la corriente de campo If, cada nivel de carga mecánica traza una "curva V" de Ia contra If, con un mínimo exacto en factor de potencia unitario.</p>
  <p>A la derecha de ese mínimo (sobreexcitación) el motor puede usarse como <b>compensador de factor de potencia</b>, cancelando los reactivos de cargas inductivas que comparten el mismo bus — hasta el límite térmico de su armadura.</p>
  <div class="formula">Ef∠−δ = Vt∠0° − j·Xs·Ia<br>sen δ = P·Xs/(Vt·Ef)<br>Ia_mín = P/(3·Vt) en FP unitario</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>P = 0 kW (condensador síncrono)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>P = 8 kW</div>
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>P = 15 kW</div>
    <div class="li"><span class="dot" style="background:#FF5C5C"></span>Ia nominal (límite térmico)</div>
    <div class="li"><span class="dot" style="background:#EAF4F1"></span>mínimo de cada curva (FP = 1)</div>
  </div>
  <div class="fid">
    <span class="ft">CONTRATO DE FIDELIDAD</span>
    <span class="fl">SÍ:</span> modela la relación If–Ia–Q en régimen permanente (Ra≈0), el mínimo de corriente en FP unitario, el límite térmico de armadura, y la compensación de FP compartiendo bus con una carga inductiva real.
    <span class="no">NO:</span> saturación magnética (curva de magnetización lineal ⚑), resistencia de armadura, arranque/sincronización a la red, estabilidad dinámica transitoria (pull-out), ni pérdidas mecánicas o de núcleo.
  </div>
  <div class="src">Tratamiento clásico de curvas V en textos de máquinas eléctricas (p. ej. Fitzgerald/Chapman); valores de placa (Vt, Xs, Ia nominal, cargas industriales) ⚑ ilustrativos de catálogo típico, no verificados contra una máquina real.</div>
`;

document.getElementById('panel').innerHTML=`
  <h4>Motor síncrono · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">Explora</button>
    <button class="b" id="m_comparar">Comparar</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" class="mision"></div>

  <h4 class="sec">Carga mecánica (P)</h4>
  <div class="modebar">
    <button class="b on" id="mm_p0">0 kW</button>
    <button class="b" id="mm_p8">8 kW</button>
    <button class="b" id="mm_p15">15 kW</button>
  </div>

  <h4 class="sec">Carga industrial en el bus</h4>
  <div class="modebar">
    <button class="b on" id="lb_none">Ninguna</button>
    <button class="b" id="lb_a">Carga A</button>
    <button class="b" id="lb_b">Carga B</button>
  </div>

  <label class="slabel">Corriente de campo If (<b id="av">100</b> %)
    <input type="range" id="sIf" min="${IF_MIN}" max="${IF_MAX}" step="1" value="100">
  </label>

  <div id="tele">
    <div class="g"><span class="l">Ef</span><b id="t_ef">—</b></div>
    <div class="g"><span class="l">δ</span><b id="t_delta">—</b></div>
    <div class="g"><span class="l">Ia</span><b id="t_ia">—</b></div>
    <div class="g"><span class="l">Q motor</span><b id="t_q">—</b></div>
    <div class="g"><span class="l">Estado</span><b id="t_est">—</b></div>
    <div class="g"><span class="l">Q industrial</span><b id="t_qind">—</b></div>
    <div class="g"><span class="l">Q total bus</span><b id="t_qtotal">—</b></div>
    <div class="g"><span class="l">FP total</span><b id="t_fptotal">—</b></div>
  </div>

  <div class="console"><div id="report"></div></div>

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
  explora:{nombre:'Explora',cam:[[7.5,5.2,8.4],[0,1.1,0]],mision:'EXPLORA · mueve el reóstato de If y cambia la carga mecánica P. Observa cómo Ia baja hasta un mínimo y vuelve a subir.'},
  comparar:{nombre:'Comparar',cam:[[0,4.4,9.6],[0,1.6,-0.6]],mision:'COMPARA · las tres curvas V se dibujan juntas. Nota que el mínimo de cada curva ocurre en un If distinto, pero siempre en FP unitario.'},
  reto:{nombre:'Reto',cam:[[3.4,3.4,7.2],[0,1.4,-0.4]],mision:'RETO · resuelve el caso misterioso: calcula a mano o ajusta el reóstato y lee el medidor, según el tipo de reto.'},
};

function tolText(){
  if(!MYST) return '';
  return MYST.kind==='minIa' ? `± ${MYST.tol.toFixed(2)} A` : `± ${MYST.tol.toFixed(2)}`;
}

function syncLocks(){
  const locked=(mode==='reto');
  const lockAll=(locked&&MYST&&MYST.kind==='minIa');
  [el('mm_p0'),el('mm_p8'),el('mm_p15'),el('lb_none'),el('lb_a'),el('lb_b')].forEach(b=>b.disabled=locked);
  el('sIf').disabled=lockAll;
}

function setMode(k){
  mode=k; solved=false;
  ['m_explora','m_comparar','m_reto'].forEach(id=>el(id).classList.toggle('on',id==='m_'+k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('p_mision').textContent=MODE_META[k].mision;
  el('retoBox').style.display=(k==='reto')?'block':'none';

  if(k==='reto'){
    if(!MYST) genMystery();
    psync=MYST.P3;
    ['mm_p0','mm_p8','mm_p15'].forEach(id=>el(id).classList.remove('on'));
    el(psync===0?'mm_p0':psync===8000?'mm_p8':'mm_p15').classList.add('on');
    if(MYST.kind==='minIa'){
      loadKey='ninguna';
      ['lb_none','lb_a','lb_b'].forEach(id=>el(id).classList.remove('on')); el('lb_none').classList.add('on');
      el('retoHint').textContent=`Con la carga mecánica en P = ${(MYST.P3/1000).toFixed(0)} kW y Ra≈0, calcula a mano la corriente de armadura MÍNIMA posible (el fondo de la curva V, en FP unitario). Usa Vt = ${VT.toFixed(2)} V.`;
      el('retoUnit').textContent='A';
    } else {
      loadKey=MYST.loadKey;
      ['lb_none','lb_a','lb_b'].forEach(id=>el(id).classList.remove('on'));
      el(loadKey==='A'?'lb_a':'lb_b').classList.add('on');
      el('retoHint').textContent=`Ajusta el reóstato de campo (If) hasta lograr el mejor factor de potencia TOTAL posible del bus (motor + ${LOADS[loadKey].label}), sin pasar la corriente nominal de armadura. Escribe el FP total (0.000–1.000) que logras.`;
      el('retoUnit').textContent='FP';
    }
  }
  syncLocks(); clearDx(); refreshQuestion(); refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}

function setPsync(p){
  if(mode==='reto') return;
  psync=p;
  ['mm_p0','mm_p8','mm_p15'].forEach(id=>el(id).classList.remove('on'));
  el(p===0?'mm_p0':p===8000?'mm_p8':'mm_p15').classList.add('on');
  refreshAll();
}
function setLoad(k){
  if(mode==='reto') return;
  loadKey=k;
  ['lb_none','lb_a','lb_b'].forEach(id=>el(id).classList.remove('on'));
  el(k==='ninguna'?'lb_none':k==='A'?'lb_a':'lb_b').classList.add('on');
  refreshAll();
}

/* ---------- §9 Telemetría + reporte ---------- */
function set(id,txt,cls){ const n=el(id); n.textContent=txt; n.classList.remove('good','warn','bad'); if(cls) n.classList.add(cls); }

function updateTele(){
  const hideQ=(mode==='reto'&&MYST&&MYST.kind==='minIa'&&!retoSolved);
  const r=motorPQ(efFromIf(ifPct),psync);
  if(hideQ||!r){
    set('t_ef','¿?','warn'); set('t_delta','¿?','warn'); set('t_ia','¿?','warn');
    set('t_q','¿?','warn'); set('t_est','¿?','warn');
  } else {
    set('t_ef',efFromIf(ifPct).toFixed(1)+' V');
    set('t_delta',(r.delta*180/Math.PI).toFixed(1)+' °');
    set('t_ia',r.IaMag.toFixed(2)+' A', r.IaMag>=IA_RATED?'bad':(r.IaMag>=IA_RATED*0.92?'warn':'good'));
    set('t_q',(r.Q3/1000).toFixed(2)+' kVAR', Math.abs(r.Q3)<VT*3*0.02?'good':'warn');
    const est=estadoFP(r.Q1);
    set('t_est', est==='unidad'?'FP unitario':est==='atraso'?'subexcitado (atraso)':'sobreexcitado (adelanto)', est==='unidad'?'good':'warn');
  }
  if(loadKey==='ninguna'||hideQ||!r){
    set('t_qind','—'); set('t_qtotal','—'); set('t_fptotal','—');
  } else {
    const load=LOADS[loadKey];
    const Qind3=load.p3*Math.tan(Math.acos(load.pf));
    const Ptotal3=psync+load.p3, Qtotal=Qind3+r.Q3;
    const Stotal=Math.hypot(Ptotal3,Qtotal);
    const FPtotal=Stotal>0?Ptotal3/Stotal:1;
    set('t_qind',(Qind3/1000).toFixed(2)+' kVAR');
    set('t_qtotal',(Qtotal/1000).toFixed(2)+' kVAR', Math.abs(Qtotal)<VT*3*0.02?'good':'warn');
    set('t_fptotal',FPtotal.toFixed(3), FPtotal>0.98?'good':'warn');
  }
}

function updateReport(){
  const L=[];
  const r=motorPQ(efFromIf(ifPct),psync);
  if(mode==='explora'){
    L.push(`Carga mecánica: <b>${P_LABEL[psync]}</b>. Corriente de campo: <b>${ifPct.toFixed(0)}%</b> (Ef=${efFromIf(ifPct).toFixed(1)} V).`);
    if(r) L.push(`Ia = ${r.IaMag.toFixed(2)} A, estado <b>${estadoFP(r.Q1)}</b>.`);
    else L.push('Fuera de sincronismo con esta combinación (δ excede 90°).');
  } else if(mode==='comparar'){
    L.push('Las tres curvas V comparten el mismo Vt y Xs; solo cambia P. A mayor carga mecánica, mayor Ia mínima y el mínimo se desplaza a mayor If.');
    L.push(`Curva activa: <b>${P_LABEL[psync]}</b>.`);
  } else {
    if(MYST.kind==='minIa'){
      L.push(`Reto: calcula Ia_mín para P = ${(MYST.P3/1000).toFixed(0)} kW.`);
      L.push(retoSolved?`<span class="ok">${retoMsg}</span>`:'Escribe tu resultado en amperes y comprueba.');
    } else {
      L.push(`Reto: maximiza el FP total con ${LOADS[MYST.loadKey].label} y P = ${(MYST.P3/1000).toFixed(0)} kW.`);
      L.push(retoSolved?`<span class="ok">${retoMsg}</span>`:'Mueve el reóstato If y observa el medidor de FP total.');
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
    if(MYST.kind==='minIa'){
      retoMsg=`Ia_mín = P/(3·Vt) = ${MYST.P3}/(3×${VT.toFixed(2)}) = ${MYST.target.toFixed(2)} A — el punto más bajo de la curva V para esta carga, exactamente en FP unitario.`;
    } else {
      const r=fpCorrectionTarget(MYST.P3,MYST.loadKey);
      retoMsg=`Con If ≈ ${r.IfPct.toFixed(1)}% (Ef≈${r.Ef.toFixed(1)} V) el analizador marca FP total ≈ ${r.FPtotal.toFixed(3)}${r.limited?' — máximo alcanzable: la armadura ya está en su límite térmico de '+IA_RATED+' A.':' — corrección total: el motor cancela exactamente los reactivos de la carga industrial.'}`;
    }
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
  showToast(MYST.kind==='minIa'
    ? `Nuevo caso: calcula Ia_mín para P = ${(MYST.P3/1000).toFixed(0)} kW.`
    : `Nuevo caso: maximiza el FP total con ${LOADS[MYST.loadKey].label} y P = ${(MYST.P3/1000).toFixed(0)} kW.`);
}

/* ---------- §11 Quiz ---------- */
function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
let QUIZ={};
function buildQuiz(){
  QUIZ.explora={
    pregunta:'¿Qué le pasa a un motor síncrono cuando se sobreexcita (If alto)?',
    opciones:shuffle([
      {t:'Se comporta como un capacitor, entregando reactivos a la red',ok:true,why:'Correcto: al sobreexcitar, Ef>Vt y el motor adelanta corriente respecto al voltaje — exactamente lo que hace un banco de capacitores.'},
      {t:'Gira más rápido que en sincronismo',ok:false,why:'No: la velocidad síncrona depende de la frecuencia de la red, no de If.'},
      {t:'Se desconecta automáticamente',ok:false,why:'No: mientras δ<90° el motor sigue sincronizado; solo se desconecta si pierde el paso.'},
      {t:'Consume más reactivos de la red',ok:false,why:'Al revés: sobreexcitado ENTREGA reactivos; los consume cuando está subexcitado.'},
    ]),
  };
  QUIZ.comparar={
    pregunta:'¿Por qué el mínimo de cada curva V ocurre en factor de potencia unitario?',
    opciones:shuffle([
      {t:'Porque ahí toda la corriente de armadura es componente activa (en fase con Vt)',ok:true,why:'Correcto: en FP unitario Q=0, así que Ia solo tiene componente en fase con Vt — la magnitud mínima posible para entregar esa P.'},
      {t:'Porque ahí Xs vale cero',ok:false,why:'No: Xs es una constante de la máquina, no cambia con If.'},
      {t:'Porque ahí el motor no gira',ok:false,why:'No: el motor sigue entregando la misma P mecánica en todo punto de la curva.'},
      {t:'Es una coincidencia de esta gráfica',ok:false,why:'No: es una consecuencia directa del diagrama fasorial — se cumple para cualquier motor síncrono de rotor liso.'},
    ]),
  };
  if(MYST){
    if(MYST.kind==='minIa'){
      QUIZ.reto={
        pregunta:'¿Qué fórmula da la corriente de armadura mínima de una curva V?',
        opciones:shuffle([
          {t:'Ia_mín = P/(3·Vt), con P la carga trifásica',ok:true,why:'Correcto: en FP unitario Ia es puramente activa, así que P = 3·Vt·Ia y se despeja Ia.'},
          {t:'Ia_mín = P·Xs/Vt',ok:false,why:'Esa expresión no tiene las unidades correctas para una corriente mínima en FP unitario.'},
          {t:'Ia_mín = Vt/Xs',ok:false,why:'Esa sería una corriente de cortocircuito interna, no depende de la carga P.'},
          {t:'Ia_mín es siempre igual a Ia nominal',ok:false,why:'No: Ia_mín depende de la carga mecánica P y suele ser mucho menor que Ia nominal.'},
        ]),
      };
    } else {
      QUIZ.reto={
        pregunta:'¿Qué limita cuánta reactiva puede entregar el motor síncrono como compensador?',
        opciones:shuffle([
          {t:'La corriente nominal (térmica) de armadura',ok:true,why:'Correcto: aunque sobreexcitar más seguiría mejorando el FP del bus, la armadura no puede superar su corriente nominal sin sobrecalentarse.'},
          {t:'La frecuencia de la red',ok:false,why:'La frecuencia fija la velocidad síncrona, no el límite de reactivos que puede entregar el motor.'},
          {t:'El número de polos del motor',ok:false,why:'El número de polos afecta la velocidad, no directamente el límite de corriente de armadura.'},
          {t:'No existe ningún límite práctico',ok:false,why:'Sí existe: pasar Ia nominal sostenidamente daña el aislamiento del devanado de armadura.'},
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

/* ---------- §12 Picking / tour / init ---------- */
pickerFor(S.scene,S.camera,S.renderer.domElement,hit=>{
  if(hit.object===board&&hit.uv){ boardClick(hit.uv.x,hit.uv.y); return; }
  let o=hit.object;
  while(o&&!o.userData?.act) o=o.parent;
  const act=o&&o.userData?.act;
  const hideQ=(mode==='reto'&&MYST&&MYST.kind==='minIa'&&!retoSolved);
  if(act==='mot3d'){ showToast('Motor síncrono trifásico: gira exactamente a velocidad síncrona mientras δ<90°.'); synth.beep(560,.08,.06); }
  else if(act==='rheostat3d'){ showToast(`Reóstato de campo: If = ${hideQ?'¿?':ifPct.toFixed(0)+'%'}. Controla Ef y con ella el factor de potencia.`); synth.beep(660,.08,.06); }
  else if(act==='load3d'){ showToast(loadKey==='ninguna'?'Sin carga industrial conectada al bus.':`${LOADS[loadKey].label} — comparte el bus con el motor síncrono.`); synth.beep(500,.08,.06); }
  else if(act==='paneld3d'){ showToast('Analizador de red: mide la corriente de armadura y los reactivos del motor en tiempo real.'); synth.beep(600,.08,.06); }
  else if(act==='meter3d'){ showToast('Medidor de FP: combina el motor síncrono con la carga industrial para dar el factor de potencia total del bus.'); synth.beep(600,.08,.06); }
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
async function runAuto(){
  if(autoRunning) return; autoRunning=true;
  const b=el('btnAuto'); b.disabled=true; b.textContent='▶ En curso…';
  try{
    synth.init(); synth.resume();
    setMode('explora');
    showToast('1/5 · Explora: barremos If de 60% a 180% con P=8kW.');
    setPsync(8000);
    for(let v=IF_MIN;v<=IF_MAX;v+=6){ ifPct=v; el('sIf').value=v; el('av').textContent=v.toFixed(0); refreshAll(); await sleep(90); }
    await sleep(400);

    showToast('2/5 · Comparar: observa las tres curvas V juntas.');
    setMode('comparar');
    for(const p of P_LEVELS){ setPsync(p); await sleep(500); }
    await sleep(300);

    showToast('3/5 · Conectamos una carga industrial inductiva al bus.');
    setMode('explora'); setPsync(0); setLoad('B');
    for(let v=IF_MIN;v<=IF_MAX;v+=6){ ifPct=v; el('sIf').value=v; el('av').textContent=v.toFixed(0); refreshAll(); await sleep(80); }
    await sleep(400);

    showToast('4/5 · Reto: resolvemos un caso misterioso.');
    setMode('reto');
    if(MYST.kind==='fpCorrection'){
      const r=fpCorrectionTarget(MYST.P3,MYST.loadKey);
      for(let v=IF_MIN;v<=IF_MAX;v+=4){
        ifPct=v; el('sIf').value=v; el('av').textContent=v.toFixed(0); refreshAll();
        if(Math.abs(v-r.IfPct)<3) break;
        await sleep(50);
      }
    }
    el('retoInput').value=MYST.target.toFixed(MYST.kind==='minIa'?2:3);
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
  const r=motorPQ(efFromIf(ifPct),psync);
  couplingG.rotation.x += 0.004 + 0.01*(r?r.IaMag/IA_RATED:0.1);
});

['m_explora','m_comparar','m_reto'].forEach(id=>{
  el(id).addEventListener('click',()=>{
    const m=id.slice(2);
    if(mode==='reto'&&!retoSolved&&m!=='reto'){ showToast('🔒 Resuelve el reto actual (o pide un nuevo caso) antes de salir.'); synth.beep(220,.1,.07); return; }
    setMode(m);
  });
});
el('mm_p0').addEventListener('click',()=>setPsync(0));
el('mm_p8').addEventListener('click',()=>setPsync(8000));
el('mm_p15').addEventListener('click',()=>setPsync(15000));
el('lb_none').addEventListener('click',()=>setLoad('ninguna'));
el('lb_a').addEventListener('click',()=>setLoad('A'));
el('lb_b').addEventListener('click',()=>setLoad('B'));
el('sIf').addEventListener('input',e=>{ ifPct=parseFloat(e.target.value); el('av').textContent=ifPct.toFixed(0); refreshAll(); });
el('btnCheck').addEventListener('click',checkReto);
el('btnAuto').addEventListener('click',runAuto);
el('btnNew').addEventListener('click',newMystery);

genMystery(); buildQuiz();
S.start();
setMode('explora');

window.__labDebug={
  state:()=>({mode,psync,loadKey,ifPct,retoSolved,solved}),
  point:()=>motorPQ(efFromIf(ifPct),psync),
  motorPQ, efFromIf, ifFromEf, iaMinAt, efUnityPF, efAtIaRatedOver, efForQtarget, fpCorrectionTarget,
  mystery:()=>MYST?{...MYST}:null,
  setPsync, setLoad,
  setIf:v=>{ ifPct=v; el('sIf').value=v; el('av').textContent=v.toFixed(0); refreshAll(); },
  checkReto, newMystery, boardClick,
  mode:()=>mode, setMode,
};
