/* ============================================================
   LAB — MÉTODOS DE ARRANQUE DE MOTORES DE INDUCCIÓN: CORRIENTE
   Y PAR DE IRRUPCIÓN (Dominio D5 · Transformadores y máquinas
   eléctricas — molde S+P: esquemático + motor de cálculo +
   instrumentos virtuales, sin objeto físico de inspección
   detallada)
   Tema: comparación del INSTANTE de arranque (rotor bloqueado)
   entre tres métodos — Directo en Línea (DOL), Estrella-Triángulo
   (Y-Δ) y Autotransformador — expresado en múltiplos de la
   corriente y el par de plena carga (I_FL=1, T_FL=1). Modelo:
     k(a) = 1 (DOL) · 1/3 (Y-Δ) · a² (Autotransformador, tap a)
     I_línea/I_FL = ILR·k  ·  T_arranque/T_FL = TLR·k
     I_motor/I_FL = ILR·a  (solo Auto; en DOL/Y-Δ, I_motor=I_línea)
   con ILR=6.5, TLR=1.5 ⚑ ilustrativos (típicos de un motor NEMA
   Diseño B). El tap a=1/√3≈57.7 % iguala EXACTO a Y-Δ (k=1/3),
   verificado numéricamente (diferencia de punto flotante ~1e-16).
   NO modela: dinámica temporal de la transición Y→Δ ni del bypass
   del autotransformador, calentamiento, ciclo de trabajo, caída de
   tensión de la fuente durante el arranque, ni la aceleración del
   motor más allá del instante de rotor bloqueado.
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.0,2.4,7.0],target:[0.4,1.3,0.0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ---------- 1 · Modelo físico (arranque, forma cerrada) ---------- */
const ILR=6.5, TLR=1.5;                        // I_LR/I_FL y T_LR/T_FL en DOL ⚑ ilustrativos
const AY=1/Math.sqrt(3);                       // ≈0.5774 — tap que iguala EXACTO a Y-Δ
const AMIN=0.35, AMAX=1.0;                     // rango explorable del tap del autotransformador
const TAPS_TIPICOS=[0.5,0.65,0.8];             // taps comerciales típicos ⚑ ilustrativos
const METHODS=['dol','yd','auto'];
function kOf(method,a){ return method==='dol'?1: method==='yd'?(1/3): a*a; }
function effA(method,a){ return method==='dol'?1: method==='yd'?AY: a; }
function calc(method,a){
  const k=kOf(method,a);
  const Iline=ILR*k, Tstart=TLR*k;
  const Imotor=method==='auto'?ILR*a:Iline;
  return{k,Iline,Tstart,Imotor};
}
function fmtMethod(m){return m==='dol'?'Directo en línea (DOL)':m==='yd'?'Estrella-Triángulo (Y-Δ)':'Autotransformador';}

/* ---------- 2 · Estado ---------- */
let mode='explora', method='dol', a=0.65;
let MYST=null, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false;

const fmtPct=v=>(v>=0?'+':'')+v.toFixed(0)+' %';

function genMystery(){
  const kind=['iline','tstart','tap'][Math.floor(Math.random()*3)];
  if(kind==='tap'){
    const frac=0.2+Math.random()*0.4;
    const Xmax=+(ILR*frac).toFixed(3);
    const target=+(100*Math.sqrt(Xmax/ILR)).toFixed(2);
    MYST={kind,Xmax,target,tol:1.5};
  }else{
    const m=METHODS[Math.floor(Math.random()*METHODS.length)];
    const tap=m==='auto'?+(AMIN+Math.random()*(AMAX-AMIN)).toFixed(2):null;
    const c=calc(m,tap??1);
    const target=kind==='iline'?c.Iline:c.Tstart;
    MYST={kind,method:m,tap,target,tol:Math.max(0.05*target,0.05)};
  }
  retoSolved=false;retoMsg='';
}

/* ---------- 3 · Materiales ---------- */
const std=o=>new THREE.MeshStandardMaterial(o);
const MAT={
  bench:  std({color:0x3a464d,roughness:0.85,metalness:0.05}),
  frame:  std({color:0x232a2e,roughness:0.95,metalness:0}),
  housing:std({color:0x2c3338,roughness:0.55,metalness:0.55}),
  endbell:std({color:0x8a8f94,roughness:0.4,metalness:0.7}),
  shaft:  std({color:0xc9ced2,roughness:0.3,metalness:0.85}),
  pulley: std({color:0x1c1f22,roughness:0.6,metalness:0.2}),
  rheoBody:std({color:0xd8c49a,roughness:0.7,metalness:0}),
  wiper:  std({color:0xbfc8ce,metalness:0.85,roughness:0.3}),
  dispBox:std({color:0x707c85,metalness:0.35,roughness:0.85}),
  lead:   std({color:0xbfc8ce,metalness:0.9,roughness:0.35}),
  cableRed:std({color:0x9e2b2b,roughness:1.0,metalness:0}),
  cableBlk:std({color:0x15181b,roughness:1.0,metalness:0}),
};

/* ---------- 4 · Pizarrón: esquemático + gráfica comparativa k(a) ---------- */
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;
bTex.minFilter=THREE.LinearFilter;bTex.generateMipmaps=false;
const PX0=130,PX1=940,PY0=352,PY1=676;
const YMAX=7, ATICK=0.2, YTICK=1;
const xPix=v=>PX0+(v/AMAX)*(PX1-PX0);
const yPix=v=>PY1-(v/YMAX)*(PY1-PY0);
function line(c,x1,y1,x2,y2,col,w,dash){c.strokeStyle=col;c.lineWidth=w||3;
  c.setLineDash(dash||[]);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);}
function rr(c,x,y,w,h,r,fill,stroke,lw){c.beginPath();c.roundRect(x,y,w,h,r);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.stroke();}}
function plotFn(c,fn,col,w,dash){
  c.strokeStyle=col;c.lineWidth=w;c.setLineDash(dash||[]);
  c.beginPath();let pen=false;
  for(let px=PX0;px<=PX1;px+=3){
    const v=(px-PX0)/(PX1-PX0)*AMAX;const y=yPix(fn(v));
    if(!isFinite(y)||y<PY0-2||y>PY1+2){pen=false;continue;}
    pen?c.lineTo(px,y):c.moveTo(px,y);pen=true;
  }
  c.stroke();c.setLineDash([]);
}
function drawSchematic(c,hideTap){
  const TOPRAIL=112;
  c.font='16px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('L1 L2 L3 (diagrama unifilar simplificado)',150,TOPRAIL-18);
  line(c,150,TOPRAIL,880,TOPRAIL,'#EAF4F1',4);
  line(c,880,TOPRAIL,880,144,'#EAF4F1',4);
  c.beginPath();c.arc(880,190,46,0,Math.PI*2);c.fillStyle='#0c1512';c.fill();
  c.strokeStyle='#4FD1C5';c.lineWidth=4;c.stroke();
  c.font='bold 30px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';
  c.fillText('M',880,201);
  c.beginPath();c.arc(880,168,20,0.3,Math.PI*1.5);c.strokeStyle='#8FB3AC';c.lineWidth=3;c.stroke();
  c.beginPath();c.moveTo(898,154);c.lineTo(906,162);c.lineTo(892,168);c.closePath();c.fillStyle='#8FB3AC';c.fill();
  if(method==='dol'){
    rr(c,420,TOPRAIL-42,110,84,8,'#0c1512','#4FD1C5',3);
    c.font='bold 24px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';
    c.fillText('KL',475,TOPRAIL+6);
    c.font='14px system-ui';c.fillStyle='#8FB3AC';
    c.fillText('arranque = marcha (sin transición)',475,TOPRAIL+62);
  }else if(method==='yd'){
    rr(c,330,TOPRAIL-42,90,84,8,'#0c1512','#4FD1C5',3);
    c.font='bold 20px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';
    c.fillText('KL',375,TOPRAIL+6);
    rr(c,540,TOPRAIL-70,100,54,8,'#0c1512','#4FD1C5',3);
    c.font='bold 15px system-ui';c.fillStyle='#4FD1C5';
    c.fillText('KY (cerrado)',590,TOPRAIL-38);
    rr(c,540,TOPRAIL+16,100,54,8,'#0c1512','#5a6b66',2);
    c.fillStyle='#5a6b66';
    c.fillText('KΔ (abierto)',590,TOPRAIL+48);
    c.font='14px system-ui';c.fillStyle='#8FB3AC';
    c.fillText('instante de arranque: devanado en estrella',475,TOPRAIL+92);
  }else{
    rr(c,300,TOPRAIL-42,80,84,8,'#0c1512','#4FD1C5',3);
    c.font='bold 20px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';
    c.fillText('KL',340,TOPRAIL+6);
    rr(c,470,TOPRAIL-46,150,92,10,'#0c1512','#FFB703',3);
    c.font='bold 17px system-ui';c.fillStyle='#FFB703';
    c.fillText('AUTOTRAFO',545,TOPRAIL-16);
    c.fillText('tap a = '+(hideTap?'¿?':(a*100).toFixed(0)+' %'),545,TOPRAIL+14);
    rr(c,670,TOPRAIL-38,90,40,8,'#0c1512','#5a6b66',2);
    c.font='14px system-ui';c.fillStyle='#5a6b66';
    c.fillText('KB (abierto)',715,TOPRAIL-14);
    c.fillStyle='#8FB3AC';
    c.fillText('KB cierra tras el arranque (retira el autotrafo)',545,TOPRAIL+72);
  }
}
function drawBoard(){
  const c=bCv.getContext('2d');
  const hideQ=(mode==='reto'&&!retoSolved);
  const hideTap=!!(hideQ&&MYST&&MYST.kind==='tap');
  const cur=calc(method,a);
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.strokeStyle='#1E3A34';c.lineWidth=3;c.strokeRect(8,8,1008,752);
  c.font='bold 22px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('MÉTODOS DE ARRANQUE · CORRIENTE Y PAR DE IRRUPCIÓN',26,42);
  if(mode==='reto'){c.textAlign='right';c.fillStyle='#FFB703';
    c.fillText(retoSolved?'✔ RETO RESUELTO':'🎯 RETO: dato desconocido',998,42);}
  c.font='bold 18px system-ui';c.textAlign='center';c.fillStyle='#EAF4F1';
  c.fillText(fmtMethod(method),512,72);
  drawSchematic(c,hideTap);
  c.font='15px system-ui';c.textAlign='center';c.fillStyle='#8FB3AC';
  c.fillText('k = 1 (DOL) · 1/3 (Y-Δ) · a² (Auto) · I_línea/I_FL = ILR·k · T_arranque/T_FL = TLR·k · ILR='+ILR+', TLR='+TLR+' ⚑',512,322);
  c.strokeStyle='#1E3A34';c.lineWidth=2;c.strokeRect(PX0,PY0,PX1-PX0,PY1-PY0);
  c.fillStyle='rgba(255,255,255,0.035)';
  c.fillRect(PX0,PY0,xPix(AMIN)-PX0,PY1-PY0);
  c.font='bold 17px system-ui';c.textAlign='left';c.fillStyle='#8FB3AC';
  c.fillText('I_línea/I_FL , T_arranque/T_FL',PX0,PY0-10);
  c.textAlign='right';c.fillText('tap a (autotransformador)',PX1,PY1+40);
  c.font='14px system-ui';
  for(let v=0;v<=YMAX+1e-9;v+=YTICK){const y=yPix(v);
    line(c,PX0,y,PX1,y,'#1E3A34',1);
    c.textAlign='right';c.fillStyle='#8FB3AC';c.fillText(v.toFixed(0),PX0-8,y+5);}
  for(let v=0;v<=AMAX+1e-9;v+=ATICK){const x=xPix(v);
    line(c,x,PY0,x,PY1,'#1E3A34',1);
    c.textAlign='center';c.fillStyle='#8FB3AC';c.fillText(v.toFixed(1),x,PY1+22);}
  if(!hideQ){
    line(c,PX0,yPix(ILR/3),xPix(AY),yPix(ILR/3),'#f0a5a5',1,[6,6]);
    line(c,PX0,yPix(TLR/3),xPix(AY),yPix(TLR/3),'#f0a5a5',1,[6,6]);
    line(c,xPix(AY),PY0,xPix(AY),PY1,'#f0a5a5',1,[6,6]);
    c.font='13px system-ui';c.fillStyle='#f0a5a5';c.textAlign='left';
    c.fillText('Y-Δ equivalente: a = 1/√3 ≈ '+(AY*100).toFixed(1)+' %',xPix(AY)+8,PY0+18);
    TAPS_TIPICOS.forEach(t=>{
      const px=xPix(t);
      c.beginPath();c.arc(px,yPix(ILR*t*t),4,0,Math.PI*2);c.fillStyle='#4FD1C5';c.fill();
      c.beginPath();c.arc(px,yPix(TLR*t*t),4,0,Math.PI*2);c.fillStyle='#FFB703';c.fill();
    });
    rr(c,776,PY0-38,158,28,8,'#11201c','#4FD1C5',2);
    c.font='bold 13px system-ui';c.textAlign='center';c.fillStyle='#4FD1C5';
    c.fillText('taps típicos: 50/65/80 %',855,PY0-18);
    plotFn(c,v=>ILR*v*v,'#4FD1C5',5);
    plotFn(c,v=>TLR*v*v,'#FFB703',4);
    const aa=effA(method,a);
    if(aa>=0&&aa<=AMAX){
      const mx=xPix(aa),myI=yPix(cur.Iline),myT=yPix(cur.Tstart);
      line(c,mx,PY0,mx,PY1,'#EAF4F1',1,[5,5]);
      [myI,myT].forEach(my=>{
        line(c,PX0,my,mx,my,'#EAF4F1',1,[5,5]);
        c.beginPath();c.arc(mx,my,7,0,Math.PI*2);c.fillStyle='#EAF4F1';c.fill();
        c.strokeStyle='#0c1512';c.lineWidth=2;c.stroke();
      });
      c.font='bold 16px system-ui';c.textAlign='left';c.fillStyle='#EAF4F1';
      c.fillText('M · I='+cur.Iline.toFixed(2)+' · T='+cur.Tstart.toFixed(2),Math.min(mx+12,760),Math.max(myI-16,PY0+18));
    }
  }
  bTex.needsUpdate=true;
}
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  const hideQ=(mode==='reto'&&!retoSolved);
  if(!hideQ){
    const cur=calc(method,a),aa=effA(method,a);
    if(aa>=0&&aa<=AMAX){
      const mx=xPix(aa);
      if(Math.hypot(x-mx,y-yPix(cur.Iline))<40||Math.hypot(x-mx,y-yPix(cur.Tstart))<40){
        showToast('Punto actual ('+fmtMethod(method)+', a='+(aa*100).toFixed(0)+'%): I_línea/I_FL = '+cur.Iline.toFixed(2)+', T_arranque/T_FL = '+cur.Tstart.toFixed(2)+', I_motor/I_FL = '+cur.Imotor.toFixed(2)+'.');
        synth.beep(880,.06,.05);return;
      }
    }
  }
  if(Math.hypot(x-880,y-190)<55){
    showToast('Motor de inducción — el devanado ve I_motor/I_FL; en autotransformador NO es igual a la de línea (I_motor=ILR·a, I_línea=ILR·a²).');
    synth.beep(720,.05,.05);return;
  }
  if(x>280&&x<720&&y>50&&y<180){
    synth.beep(720,.05,.05);
    if(method==='dol')showToast('DOL: el contactor KL conecta el motor directo a la línea — máxima corriente y par de arranque, sin reducción.');
    else if(method==='yd')showToast('Y-Δ: arranca con el devanado en estrella (KL+KY), reduciendo la tensión de fase a 1/√3 y la corriente/par de línea a 1/3 — luego conmuta a Δ para marcha (transición no modelada aquí).');
    else showToast('Autotransformador: el tap a reduce la tensión aplicada al motor; KB (bypass) cierra tras el arranque para retirar el autotrafo del circuito.');
  }
}

/* ---------- 5 · Banco 3D (modesto: sin objeto físico de inspección detallada) ---------- */
const boardG=new THREE.Group();boardG.position.set(-1.05,0,-0.85);boardG.rotation.y=0.16;
S.scene.add(boardG);
const bFrame=roundedBox(3.62,2.77,0.12,MAT.frame,0.03);
bFrame.position.set(0,1.85,0);boardG.add(bFrame);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.55),
  new THREE.MeshBasicMaterial({map:bTex,toneMapped:false}));
board.position.set(0,1.85,0.065);boardG.add(board);
board.userData={title:'Esquemático + gráfica comparativa (toca los elementos)'};
const benchG=new THREE.Group();benchG.position.set(0.6,0,0.9);S.scene.add(benchG);
const mesa=roundedBox(2.6,0.5,1.9,MAT.bench,0.05);
mesa.position.set(1.55,0.25,0.75);benchG.add(mesa);
function cable(pts,mat){const cur=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(cur,24,0.014,8),mat);benchG.add(m);return m;}
function makeDisplayBox(w,h,dp,cw,ch){
  const g=new THREE.Group();
  const box=roundedBox(w,h,dp,MAT.dispBox,0.03);g.add(box);
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
  const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;
  tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(w*0.8,h*0.6),
    new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  pl.position.set(0,0,dp/2+0.002);g.add(pl);
  return{g,cv,tx};
}
/* motor de inducción: carcasa + eje + polea giratoria */
const motG=new THREE.Group();motG.position.set(1.15,0.75,1.15);benchG.add(motG);
motG.userData={act:'mot3d',title:'Motor de inducción (toca para inspeccionar)'};
const motHousing=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.62,28),MAT.housing);
motHousing.rotation.z=Math.PI/2;motG.add(motHousing);
const motBell=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.05,28),MAT.endbell);
motBell.rotation.z=Math.PI/2;motBell.position.x=-0.335;motG.add(motBell);
const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.34,16),MAT.shaft);
shaft.rotation.z=Math.PI/2;shaft.position.x=-0.48;motG.add(shaft);
const pulleyG=new THREE.Group();pulleyG.position.x=-0.66;motG.add(pulleyG);
const pulleyRim=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.06,24),MAT.pulley);
pulleyRim.rotation.z=Math.PI/2;pulleyG.add(pulleyRim);
[0,1,2,3].forEach(k=>{const spoke=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.028,0.26),MAT.shaft);
  spoke.rotation.x=k*Math.PI/4;pulleyG.add(spoke);});
const motLbl=labelSprite('M','#4FD1C5');motLbl.position.set(0,0.42,0);motLbl.scale.multiplyScalar(0.8);motG.add(motLbl);
/* equipo de arranque: cuerpo + dial de tap (cosmético, refleja a) */
const starterG=new THREE.Group();starterG.position.set(1.95,0.72,0.65);benchG.add(starterG);
starterG.userData={act:'starter3d',title:'Equipo de arranque (elige el método y el tap)'};
const starterBody=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.10,28),MAT.rheoBody);
starterG.add(starterBody);
const dialArm=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.02,0.02),MAT.wiper);
dialArm.position.y=0.065;starterG.add(dialArm);
[-0.16,0.16].forEach(x=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,0.12,8),MAT.lead);
  l.rotation.z=Math.PI/2;l.position.set(x,0,0.12);starterG.add(l);});
/* dos pantallas digitales: panel (método+tap) y medidor (I/T) */
const panelD=makeDisplayBox(0.56,0.40,0.34,256,128);
panelD.g.position.set(0.85,0.72,0.25);benchG.add(panelD.g);
panelD.g.userData={act:'panelD',title:'Panel de método y tap (usa los controles)'};
const meter=makeDisplayBox(0.58,0.42,0.36,256,128);
meter.g.position.set(2.42,0.71,0.25);benchG.add(meter.g);
meter.g.userData={act:'meter3d',title:'Medidor: I_línea, T_arranque y estado'};
cable([[1.15,0.55,1.30],[1.0,0.60,0.9],[1.1,0.60,0.46]],MAT.cableRed);
cable([[1.95,0.62,0.65],[2.2,0.62,0.45],[2.42,0.60,0.30]],MAT.cableBlk);
[benchG,boardG].forEach(g=>g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}));
board.castShadow=false;

function drawPanelD(){const c=panelD.cv.getContext('2d');
  const hideQ=(mode==='reto'&&!retoSolved),hideTap=!!(hideQ&&MYST&&MYST.kind==='tap');
  c.fillStyle='#04120e';c.fillRect(0,0,256,128);
  c.font='bold 24px monospace';c.fillStyle='#4FD1C5';c.textAlign='center';
  c.fillText(method.toUpperCase(),128,52);
  c.font='bold 22px monospace';c.fillStyle='#FFB703';
  c.fillText('a = '+(method!=='auto'?'— (no aplica)':(hideTap?'¿?':(a*100).toFixed(0)+' %')),128,88);
  c.font='13px monospace';c.fillStyle='#8FB3AC';c.fillText('método · tap autotrafo',128,112);
  panelD.tx.needsUpdate=true;}
function drawMeter3D(){const c=meter.cv.getContext('2d'),hideQ=(mode==='reto'&&!retoSolved);
  const cur=calc(method,a);
  c.fillStyle='#04120e';c.fillRect(0,0,256,128);
  c.font='bold 24px monospace';c.fillStyle='#EAF4F1';c.textAlign='center';
  c.fillText('I '+(hideQ?'¿?':cur.Iline.toFixed(2)),128,42);
  c.fillStyle='#FFB703';c.fillText('T '+(hideQ?'¿?':cur.Tstart.toFixed(2)),128,78);
  c.font='13px monospace';c.fillStyle='#8FB3AC';
  c.fillText('× I_FL / T_FL a rotor bloqueado',128,108);
  meter.tx.needsUpdate=true;}
function refreshBenchDyn(){
  drawPanelD();drawMeter3D();
  const ang=-Math.PI*0.66+((a-AMIN)/(AMAX-AMIN))*Math.PI*1.32;
  dialArm.rotation.y=ang;
}

/* ---------- 6 · HUD + panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Transformadores y máquinas eléctricas (D5)</div>
  <h2>Métodos de arranque: corriente y par de irrupción</h2>
  <p>Un motor de inducción conectado directo a la línea puede exigir 5 a 8 veces su corriente
  nominal en el instante del arranque. Los métodos de arranque reducido (estrella-triángulo,
  autotransformador) recortan esa corriente de irrupción a costa de reducir también el par
  disponible — este banco compara los tres métodos con el mismo factor de reducción k.</p>
  <div class="formula">k = 1 (DOL) · 1/3 (Y-Δ) · a² (Autotransformador)<br>
  I_línea/I_FL = ILR·k · T_arranque/T_FL = TLR·k · I_motor/I_FL = ILR·a (solo Auto)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>I_línea/I_FL (corriente de línea, múltiplos de plena carga)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>T_arranque/T_FL (par de arranque, múltiplos de plena carga)</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Punto de igualdad con Y-Δ (a=1/√3≈57.7%)</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> factores de reducción exactos de Y-Δ (1/3) y autotransformador (a²) sobre
  la corriente y el par de arranque a rotor bloqueado · asimetría I_línea vs. I_motor en el
  autotransformador (transformación a² vs. a) · punto de igualdad Y-Δ/Auto en a=1/√3 (forma cerrada
  exacta) · diagrama unifilar simplificado (no trifásico completo).<br>
  <span class="no">NO:</span> los valores ILR=6.5 y TLR=1.5 ⚑ son ilustrativos (típicos de un motor NEMA
  Diseño B, letra de código G/H) — no son placa de un motor real · dinámica temporal de la transición
  Y→Δ ni del bypass del autotransformador (solo se compara el INSTANTE de arranque, rotor bloqueado)
  · calentamiento, ciclo de trabajo del motor ni caída de tensión de la fuente durante el arranque.</div>
  <div class="src">Ref: IEC 60947-4-1 · NEMA ICS ⚑ · Fitzgerald, Kingsley &amp; Umans — Electric Machinery (arranque de motores de inducción)</div>`;
document.getElementById('panel').innerHTML=`
  <h4>Arranque de motores · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_comparar">📈 Comparar</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>
  <div style="font-size:12px;margin:6px 0 2px">Método de arranque</div>
  <div class="modebar" style="margin-bottom:8px">
    <button class="b on" id="mm_dol">DOL</button>
    <button class="b" id="mm_yd">Y-Δ</button>
    <button class="b" id="mm_auto">Auto</button>
  </div>
  <div style="font-size:12px;margin:6px 0 2px">a (tap autotransformador) · <b id="av" class="mono">65 %</b></div>
  <input type="range" id="sTap" min="35" max="100" step="1" value="65" style="width:100%;accent-color:#FFB703">
  <div id="tele">
    <div class="g"><div class="l">Método</div><b id="t_method">—</b></div>
    <div class="g"><div class="l">I_línea/I_FL</div><b id="t_iline">—</b></div>
    <div class="g"><div class="l">T_arranque/T_FL</div><b id="t_tstart">—</b></div>
    <div class="g"><div class="l">I_motor/I_FL</div><b id="t_imotor">—</b></div>
    <div class="g"><div class="l">Reducción vs DOL</div><b id="t_red">—</b></div>
    <div class="g"><div class="l">Estado</div><b id="t_est">—</b></div>
  </div>
  <div class="console" id="report"></div>
  <div id="retoBox" style="display:none">
    <h4 class="sec">Tu respuesta</h4>
    <div style="font-size:12px;color:#8FB3AC;margin-bottom:6px" id="retoHint"></div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap">
        <input id="retoInput" inputmode="decimal" style="width:74px;background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px 6px" placeholder="0"> <span id="retoUnit">× I_FL</span></span>
      <button class="b primary" id="btnCheck" style="flex:1">✔ Comprobar</button>
    </div>
    <div style="font-size:12px;margin-top:6px" id="retoOut"></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;margin-bottom:6px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns" style="margin-top:8px">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado</button>
    <button class="b" id="btnNew">🔀 Nuevo caso misterioso</button>
  </div>`;
const el=id=>document.getElementById(id);

/* ---------- 7 · Toast ---------- */
let toastTimer=null;
function showToast(msg){const t=el('toast');t.textContent=msg;t.classList.add('on');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),5200);}

/* ---------- 8 · Modos ---------- */
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.0,2.2,7.0],[0.4,1.2,0.0]],
    mision:'Cambia el método de arranque y, en Autotransformador, mueve el tap a: observa cómo se reducen la corriente de línea y el par de arranque.'},
  comparar:{nombre:'Comparar curvas',cam:[[-0.1,2.0,3.9],[-0.9,1.7,-0.8]],
    mision:'La gráfica k(a)=a² gobierna TANTO la corriente como el par: en a=1/√3≈57.7% el autotransformador iguala EXACTO a Y-Δ.'},
  reto:{nombre:'Reto',cam:[[0.5,2.1,5.4],[0.1,1.2,0.1]],
    mision:'Dato desconocido: calcula la corriente, el par o el tap requerido — ANTES de revelar la gráfica.'},
};
function tolText(m){
  return m.kind==='tap'?m.tol.toFixed(1)+' puntos %':m.tol.toFixed(3);
}
function syncTapEnabled(){
  el('sTap').disabled=(mode==='reto')||method!=='auto';
}
function setMode(k){
  mode=k;solved=false;
  ['explora','comparar','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('p_mision').textContent=MODE_META[k].mision;
  el('retoBox').style.display=(k==='reto')?'block':'none';
  const locked=(k==='reto');
  ['dol','yd','auto'].forEach(m=>el('mm_'+m).disabled=locked);
  if(k==='reto'){
    if(!MYST)genMystery();
    if(MYST.kind==='tap'){
      method='auto';
      ['dol','yd','auto'].forEach(m=>el('mm_'+m).classList.toggle('on',m==='auto'));
      el('retoHint').textContent='Arranque directo: I_línea/I_FL = '+ILR+'. Se exige limitar la corriente de arranque a un máximo de '+MYST.Xmax.toFixed(2)+'×I_FL usando un autotransformador. ¿Qué tap a (%) se necesita? Tolerancia: ±'+tolText(MYST)+'.';
      el('retoUnit').textContent='% (tap)';
    }else{
      method=MYST.method;
      ['dol','yd','auto'].forEach(m=>el('mm_'+m).classList.toggle('on',m===method));
      if(MYST.tap!=null){a=MYST.tap;el('sTap').value=(a*100).toFixed(0);el('av').textContent=(a*100).toFixed(0)+' %';}
      el('retoHint').textContent='Método: '+fmtMethod(MYST.method)+(MYST.tap!=null?' · tap a = '+(MYST.tap*100).toFixed(0)+' %':'')
        +' · calcula '+(MYST.kind==='iline'?'I_línea/I_FL':'T_arranque/T_FL')+' (usa ILR='+ILR+', TLR='+TLR+'). Tolerancia: ±'+tolText(MYST)+'.';
      el('retoUnit').textContent='× I_FL';
    }
  }
  syncTapEnabled();
  clearDx();refreshQuestion();refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}
function setMethod(m){
  if(mode==='reto')return;
  method=m;
  ['dol','yd','auto'].forEach(mm=>el('mm_'+mm).classList.toggle('on',mm===m));
  syncTapEnabled();
  refreshAll();
}

/* ---------- 9 · Telemetría + reporte ---------- */
function set(id,txt,cls){const n=el(id);n.textContent=txt;
  n.classList.remove('good','warn','bad');if(cls)n.classList.add(cls);}
function updateTele(){
  const hideQ=(mode==='reto'&&!retoSolved);
  const cur=calc(method,a);
  const red=(1-cur.Iline/ILR)*100;
  set('t_method',fmtMethod(method),'good');
  set('t_iline',hideQ?'¿?':cur.Iline.toFixed(2)+' × I_FL',hideQ?'warn':(cur.Iline<=ILR/3+1e-6?'good':cur.Iline<ILR?'warn':'bad'));
  set('t_tstart',hideQ?'¿?':cur.Tstart.toFixed(2)+' × T_FL',hideQ?'warn':'good');
  set('t_imotor',hideQ?'¿?':cur.Imotor.toFixed(2)+' × I_FL','good');
  set('t_red',hideQ?'¿?':fmtPct(red),red>0?'good':'warn');
  if(mode==='reto')set('t_est',retoSolved?'✔ RESUELTO':'RETO · calcula','warn');
  else set('t_est','normal','good');
}
function updateReport(){
  const rep=el('report');const L=[];
  const cur=calc(method,a);
  if(mode==='explora'){
    L.push('k('+fmtMethod(method)+') = '+cur.k.toFixed(3)+' → I_línea/I_FL = ILR·k = '+ILR+'·'+cur.k.toFixed(3)+' = '+cur.Iline.toFixed(2)+'.');
    L.push('T_arranque/T_FL = TLR·k = '+TLR+'·'+cur.k.toFixed(3)+' = '+cur.Tstart.toFixed(2)+'.');
    if(method==='auto')L.push('I_motor/I_FL = ILR·a = '+ILR+'·'+a.toFixed(2)+' = '+cur.Imotor.toFixed(2)+' (distinta de I_línea: el autotrafo refleja la impedancia hacia la línea por a², pero el motor solo ve la tensión reducida por a).');
    L.push('Toca el motor o el equipo de arranque en el esquemático.');
  }else if(mode==='comparar'){
    L.push('k(a) = a² es el mismo factor para la corriente Y para el par de arranque — por eso ambas curvas comparten la misma forma.');
    L.push('En a = 1/√3 ≈ '+(AY*100).toFixed(1)+' %, k = 1/3: el autotransformador iguala EXACTO a Y-Δ (I_línea/I_FL = '+(ILR/3).toFixed(2)+', T_arranque/T_FL = '+(TLR/3).toFixed(2)+').');
    L.push('Mueve el tap y compara contra los puntos típicos comerciales (50/65/80 %) ⚑.');
  }else{
    if(MYST.kind==='tap')L.push('Arranque directo: I_línea/I_FL = ILR = '+ILR+'. Límite exigido: Xmax = '+MYST.Xmax.toFixed(2)+'×I_FL. Despeja a de ILR·a² = Xmax → a = √(Xmax/ILR).');
    else L.push('Dato: método = '+fmtMethod(MYST.method)+(MYST.tap!=null?', tap a = '+(MYST.tap*100).toFixed(0)+' %':'')+'. k = 1 (DOL) · 1/3 (Y-Δ) · a² (Auto).');
    if(retoSolved)L.push('✔ '+retoMsg);
    else if(retoMsg)L.push(retoMsg);
  }
  rep.innerHTML=L.map(s=>'<div>'+s+'</div>').join('');
}
function refreshAll(){
  drawBoard();updateTele();updateReport();refreshBenchDyn();
}

/* ---------- 10 · Reto: dato desconocido ---------- */
function checkReto(){
  if(!MYST)return;
  const raw=el('retoInput').value.replace(',','.');const v=parseFloat(raw);
  if(!isFinite(v)){el('retoOut').innerHTML='<span class="dtc">Escribe un número.</span>';return;}
  const ok=Math.abs(v-MYST.target)<=MYST.tol;
  if(ok){
    retoSolved=true;solved=true;
    retoMsg=MYST.kind==='tap'
      ?'Exacto: a* = √(Xmax/ILR) = √('+MYST.Xmax.toFixed(2)+'/'+ILR+') = '+MYST.target.toFixed(2)+' %.'
      :'Exacto: '+(MYST.kind==='iline'?'I_línea/I_FL':'T_arranque/T_FL')+' = '+MYST.target.toFixed(3)+'.';
    el('retoOut').innerHTML='<span class="ok">✔ ¡Correcto! '+retoMsg+'</span>';
    synth.beep(880,.1,.08);setTimeout(()=>synth.beep(1175,.15,.08),140);
  }else{
    retoMsg='';
    el('retoOut').innerHTML='<span class="dtc">✘ Aún no. Tolerancia: ±'+tolText(MYST)+'</span>';
    synth.beep(220,.15,.08);
  }
  refreshAll();
}
function newMystery(){
  genMystery();el('retoInput').value='';el('retoOut').innerHTML='';
  buildQuiz();
  setMode('reto');
  showToast('Nuevo caso misterioso servido: '+(MYST.kind==='tap'?'límite de corriente Xmax='+MYST.Xmax.toFixed(2)+'×I_FL':fmtMethod(MYST.method)+(MYST.tap!=null?' @ '+(MYST.tap*100).toFixed(0)+'%':''))+'.');
}

/* ---------- 11 · Quiz de ingeniería (valores calculados en vivo) ---------- */
function shuffle(arr){
  const a2=arr.slice();
  for(let i=a2.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a2[i],a2[j]]=[a2[j],a2[i]];
  }
  return a2;
}
let QUIZ={};
function buildQuiz(){
  QUIZ.explora={pregunta:'¿Por qué la corriente de arranque en autotransformador (I_línea) se reduce por a² mientras que la corriente que ve el propio motor (I_motor) solo se reduce por a?',
    opciones:shuffle([
      {t:'Porque el autotransformador refleja la impedancia del motor hacia la línea por a² (como cualquier transformador), pero el motor conectado al secundario ve directamente la tensión reducida por a sobre su propia impedancia',ok:true,
       why:'Correcto: la línea ve la impedancia del motor reflejada por a², pero el devanado del motor solo experimenta la tensión reducida a·V — por eso I_motor=ILR·a mientras I_línea=ILR·a².'},
      {t:'Es un error de notación: ambas corrientes son siempre iguales en cualquier método de arranque',ok:false,
       why:'No — solo son iguales en DOL y Y-Δ (donde línea y devanado ven la misma corriente); en autotransformador se separan porque hay un transformador entre la línea y el motor.'},
      {t:'Porque el motor tiene menos vueltas en su devanado que el autotransformador',ok:false,
       why:'La razón no es el número de vueltas del motor sino la relación de transformación del autotrafo: refleja impedancia hacia la línea por a², pero solo escala tensión/corriente hacia el motor por a.'},
      {t:'Porque el par de arranque siempre es igual a la corriente de línea',ok:false,
       why:'El par de arranque escala con a² igual que I_línea (ambos con el mismo factor k=a²) — pero eso no explica la asimetría entre I_línea e I_motor, que es un efecto de transformación, no de par.'}])};
  QUIZ.comparar={pregunta:'¿Por qué el tap a=1/√3≈57.7% del autotransformador iguala EXACTAMENTE a Y-Δ en corriente y par de arranque?',
    opciones:shuffle([
      {t:'Porque en ambos casos k=1/3: Y-Δ reduce la tensión de fase por 1/√3 (y la corriente/par de línea por (1/√3)²=1/3); el autotrafo con a=1/√3 da k=a²=1/3 — el mismo factor',ok:true,
       why:'Correcto: ambos métodos reducen k a exactamente 1/3 en ese punto — como I_línea/I_FL y T_arranque/T_FL dependen solo de k, coinciden en TODOS sus valores, no solo en uno.'},
      {t:'Es una coincidencia numérica sin relación física',ok:false,
       why:'No es coincidencia: ambos mecanismos (conexión estrella y tap de autotransformador) reducen la tensión aplicada al motor, y la corriente/par de arranque escalan con el cuadrado de esa reducción — 1/√3 es exactamente el punto donde ambos cuadrados coinciden en 1/3.'},
      {t:'Porque a=1/√3 es el tap más usado comercialmente',ok:false,
       why:'Los taps comerciales típicos (≈50/65/80%) son distintos de 1/√3≈57.7% — ese valor es un punto de igualdad matemática con Y-Δ, no necesariamente un tap estándar de catálogo.'},
      {t:'Porque a esa altura el motor alcanza su velocidad nominal',ok:false,
       why:'Este modelo compara solo el INSTANTE de arranque (rotor bloqueado), no la aceleración del motor — la velocidad no interviene en la comparación de k(a).'}])};
  if(MYST){
    if(MYST.kind==='tap'){
      QUIZ.reto={pregunta:'Para limitar I_línea/I_FL a un máximo de '+MYST.Xmax.toFixed(2)+' (con ILR='+ILR+'), ¿qué ecuación despeja el tap a?',
        opciones:shuffle([
          {t:'ILR·a² = Xmax → a = √(Xmax/ILR)',ok:true,
           why:'Correcto: I_línea/I_FL = ILR·a² es la relación del autotransformador — despejando a de esa igualdad se obtiene la raíz cuadrada del cociente.'},
          {t:'ILR·a = Xmax → a = Xmax/ILR',ok:false,
           why:'Esa sería la relación de I_motor (que escala por a, no por a²), no la de I_línea — usarla aquí da un tap incorrecto.'},
          {t:'a = Xmax/3',ok:false,
           why:'1/3 es el factor k de Y-Δ, no una fórmula general para el tap del autotransformador — el autotrafo no está limitado a k=1/3.'},
          {t:'a no depende de Xmax, solo de ILR',ok:false,
           why:'Al revés: el tap necesario SÍ depende de cuánto quieras limitar la corriente (Xmax) — a mayor restricción (Xmax más bajo), menor tap requerido.'}])};
    }else{
      const kind=MYST.kind;
      QUIZ.reto={pregunta:'Para el método '+fmtMethod(MYST.method)+(MYST.tap!=null?' con tap a='+(MYST.tap*100).toFixed(0)+'%':'')+', ¿qué fórmula da '+(kind==='iline'?'I_línea/I_FL':'T_arranque/T_FL')+'?',
        opciones:shuffle([
          {t:(kind==='iline'?'ILR':'TLR')+'·k, con k=1 (DOL), 1/3 (Y-Δ) o a² (Auto)',ok:true,
           why:'Correcto: tanto la corriente como el par de arranque, expresados como múltiplos de plena carga, se escalan por el MISMO factor k según el método.'},
          {t:(kind==='iline'?'TLR':'ILR')+'·k — se usa el factor del otro múltiplo',ok:false,
           why:'Cuidado con no confundir ILR (multiplicador de corriente a rotor bloqueado) con TLR (multiplicador de par) — cada uno se aplica a su propia cantidad.'},
          {t:'k por sí solo, sin multiplicar por ILR ni TLR',ok:false,
           why:'k es solo el factor de REDUCCIÓN relativo al arranque directo — hay que multiplicarlo por el valor de arranque directo (ILR o TLR) para obtener el múltiplo real de plena carga.'},
          {t:'La fórmula depende de la velocidad del motor, no del método',ok:false,
           why:'Este modelo compara el instante de arranque (rotor bloqueado) entre métodos — la velocidad del rotor no es una variable de esta comparación.'}])};
    }
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

/* ---------- 12 · Picking, recorrido guiado, animación e init ---------- */
pickerFor(S.scene,S.camera,S.renderer.domElement,hit=>{
  if(hit.object===board&&hit.uv){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object,act=null;
  while(o){if(o.userData&&o.userData.act){act=o.userData.act;break;}o=o.parent;}
  if(!act)return;
  synth.beep(700,.05,.05);
  const cur=calc(method,a),hideQ=(mode==='reto'&&!retoSolved),hideTap=!!(hideQ&&MYST&&MYST.kind==='tap');
  if(act==='mot3d')showToast('Motor de inducción — devanado conectado según el método activo: '+fmtMethod(method)+'.');
  else if(act==='starter3d')showToast('Equipo de arranque — método: '+fmtMethod(method)+(method==='auto'?', tap a = '+(hideTap?'¿?':(a*100).toFixed(0)+' %'):'')+'. Ajusta con los controles.');
  else if(act==='panelD')showToast('Panel: método '+fmtMethod(method)+(method==='auto'?' · tap '+(hideTap?'¿?':(a*100).toFixed(0)+' %'):'')+'.');
  else if(act==='meter3d')showToast(hideQ?'Medidor vendado en el reto: calcula tú el dato pedido.':'I_línea/I_FL = '+cur.Iline.toFixed(2)+' · T_arranque/T_FL = '+cur.Tstart.toFixed(2)+' · I_motor/I_FL = '+cur.Imotor.toFixed(2)+'.');
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
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const b=el('btnAuto');b.disabled=true;b.textContent='✨ Recorriendo…';
  try{
    synth.init();synth.resume();
    setMode('explora');
    setMethod('dol');
    a=0.65;el('sTap').value=65;el('av').textContent='65 %';refreshAll();
    showToast('1/5 · Arranque directo (DOL): máxima corriente y par de arranque, sin reducción.');
    await sleep(2800);
    setMethod('yd');
    showToast('2/5 · Estrella-Triángulo: corriente y par de línea caen a 1/3 del valor directo.');
    await sleep(2800);
    setMethod('auto');
    showToast('3/5 · Autotransformador: moviendo el tap a hacia 1/√3≈57.7 % para igualar Y-Δ…');
    await sleep(1400);
    const steps=18,aStart=a,aEnd=AY;
    for(let k=0;k<=steps;k++){
      if(mode!=='explora')break;
      a=aStart+(aEnd-aStart)*(k/steps);
      el('sTap').value=(a*100).toFixed(0);el('av').textContent=(a*100).toFixed(0)+' %';
      refreshAll();await sleep(120);
    }
    showToast('Tap = 1/√3 ≈ 57.7 %: k=1/3 — corriente y par IGUALAN exacto a Y-Δ.');
    await sleep(2600);
    setMode('comparar');await sleep(2600);
    setMode('reto');
    showToast('4/5 · Reto: calcula el dato desconocido antes de revelar la gráfica.');
    await sleep(2400);
    el('retoInput').value=MYST.target.toFixed(2);
    await sleep(1000);checkReto();await sleep(2200);
    const q=QUIZ.reto;const idx=q?q.opciones.findIndex(o=>o.ok):-1;
    const btn=idx>=0?el('dxbtns').children[idx]:null;if(btn)btn.click();
    await sleep(1400);
    newMystery();
    showToast('5/5 · Recorrido completo: te dejo un caso misterioso nuevo sin resolver — inténtalo tú, o pide otro (🔀).');
  }finally{autoRunning=false;b.disabled=false;b.textContent='✨ Recorrido guiado';}
}
S.setAnimate(()=>{ // la polea gira más rápido cuanto mayor es la corriente de arranque actual
  const cur=calc(method,a);
  pulleyG.rotation.x+=0.003+0.012*(cur.Iline/ILR);
});
/* wiring */
['explora','comparar','reto'].forEach(m=>el('m_'+m).onclick=()=>{
  if(mode==='reto'&&!retoSolved&&m!=='reto'){
    showToast('<span style="color:var(--bad)">🔒 Resuelve el reto (o pide otro caso con 🔀) antes de salir a otro modo — así no ves la gráfica ni la telemetría con el dato pedido.</span>');
    synth.beep(220,0.1,0.05);
    return;
  }
  setMode(m);
});
['dol','yd','auto'].forEach(m=>el('mm_'+m).onclick=()=>setMethod(m));
el('sTap').addEventListener('input',()=>{a=parseFloat(el('sTap').value)/100;
  el('av').textContent=(a*100).toFixed(0)+' %';refreshAll();});
el('btnCheck').onclick=checkReto;
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newMystery;
/* init */
genMystery();buildQuiz();
S.start();setMode('explora');
window.__labDebug={
  state:()=>({mode,method,a,retoSolved,solved}),
  point:()=>calc(method,a),
  calc,kOf,effA,
  mystery:()=>MYST?{...MYST}:null,
  setMethod,
  setTap:v=>{a=v;el('sTap').value=(a*100).toFixed(0);el('av').textContent=(a*100).toFixed(0)+' %';refreshAll();},
  checkReto,newMystery,boardClick,mode:()=>mode,setMode,
};
