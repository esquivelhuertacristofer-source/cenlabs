/* ============================================================
   LAB — GENERADOR DE CD AUTOEXCITADO: CURVA DE MAGNETIZACIÓN
   (Dominio D5 · Transformadores y máquinas eléctricas — molde S+P:
    esquemático + motor de cálculo + instrumentos virtuales,
    sin objeto físico de inspección detallada)
   Tema: autoexcitación shunt (derivación) en vacío y resistencia crítica
   de campo. Modelo de ingeniería (didáctico): curva de magnetización
   tipo Fröhlich E0(If) = Em·If/(Ik+If) ⚑ (forma genérica de saturación,
   NO una máquina real — contrastar contra curva de placa/ensayo si se
   usa para diseño). Escalamiento con velocidad E(If,n) = E0(If)·(n/n0)
   (Ley de Faraday: E ∝ n a flujo constante). El punto de operación
   (autoexcitación) es la intersección de E(If,n) con la recta del
   circuito de campo Vt = Rf·If — tiene forma cerrada exacta:
     If* = máx(0, Em·(n/n0)/Rf − Ik) ;  Vt* = Rf·If*
   porque Rf·(Ik+If) = Em·(n/n0) despeja If directo (sin bisección).
   Resistencia crítica: Rc(n) = Rc0·(n/n0), Rc0 = Em/Ik — pendiente de
   E0 en el origen; si Rf ≥ Rc(n) el generador NO autoexcita (colapsa).
   NO modela: resistencia de armadura ni caída IaRa (vacío puro, sin
   carga externa), reacción de inducido, histéresis/remanencia más allá
   del arranque, saturación bajo carga, temperatura del devanado de
   campo, inductancia de campo (se resuelve el EQUILIBRIO, no la
   trayectoria transitoria del arranque en el tiempo).
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.0,2.4,7.0],target:[0.4,1.3,0.0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ---------- 1 · Modelo físico (autoexcitación shunt, forma cerrada) ---------- */
const Em=150, Ik=0.6, n0=1200;                 // constantes de la máquina didáctica ⚑
const Rc0=Em/Ik;                               // 250 Ω — resistencia crítica a n0
const E0=If=>Em*If/(Ik+If);                    // curva de magnetización (Fröhlich) a n0
const Efun=(If,n)=>E0(If)*(n/n0);              // escalada a velocidad n
const Rc=n=>Rc0*(n/n0);                        // resistencia crítica a velocidad n
function buildup(Rf,n){                        // punto de operación — forma cerrada exacta
  const If=Math.max(0,Em*(n/n0)/Rf-Ik);
  return{If,Vt:Rf*If};
}
const selfExcites=(Rf,n)=>Rf<Rc(n);

/* ---------- 2 · Estado ---------- */
let mode='explora', Rf=150, nRpm=1200;
let MYST=null, retoSolved=false, retoMsg='', predYN=null;
let solved=false, autoRunning=false;

const fmtV=v=>v.toFixed(1)+' V';
const fmtI=i=>i.toFixed(3)+' A';
const fmtOhm=v=>v.toFixed(0)+' Ω';
const fmtRPM=n=>n.toFixed(0)+' rpm';
const fmtP=p=>p.toFixed(1)+' W';
const fmtPct=v=>(v>=0?'+':'')+v.toFixed(0)+' %';

function genMystery(){
  const RfM=+(60+Math.random()*340).toFixed(0);
  const nM=+(600+Math.random()*900).toFixed(0);
  const ex=selfExcites(RfM,nM), bu=buildup(RfM,nM);
  MYST={Rf:RfM,n:nM,selfExcites:ex,Vt:bu.Vt,If:bu.If};
  retoSolved=false;retoMsg='';predYN=null;
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

/* ---------- 4 · Pizarrón: esquemático shunt + gráfica de magnetización ---------- */
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;
bTex.minFilter=THREE.LinearFilter;bTex.generateMipmaps=false;
const PX0=130,PX1=940,PY0=308,PY1=676;
const IFMAX=3, VMAX=200;
const XTICK=0.5, YTICK=50;
const xPix=v=>PX0+(v/IFMAX)*(PX1-PX0);
const yPix=v=>PY1-(v/VMAX)*(PY1-PY0);
function line(c,x1,y1,x2,y2,col,w,dash){c.strokeStyle=col;c.lineWidth=w||3;
  c.setLineDash(dash||[]);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);}
function rr(c,x,y,w,h,r,fill,stroke,lw){c.beginPath();c.roundRect(x,y,w,h,r);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.stroke();}}
function plotFn(c,fn,col,w,dash){
  c.strokeStyle=col;c.lineWidth=w;c.setLineDash(dash||[]);
  c.beginPath();let pen=false;
  for(let px=PX0;px<=PX1;px+=3){
    const v=(px-PX0)/(PX1-PX0)*IFMAX;const y=yPix(fn(v));
    if(!isFinite(y)||y<PY0-2||y>PY1+2){pen=false;continue;}
    pen?c.lineTo(px,y):c.moveTo(px,y);pen=true;
  }
  c.stroke();c.setLineDash([]);
}
const HIT=[
  {x:160,y:200,r:62,act:'gen'},
  {x:460,y:170,r:55,act:'rheo'},
  {x:460,y:245,r:45,act:'coil'},
  {x:880,y:190,r:55,act:'meter'},
];
function drawBoard(){
  const c=bCv.getContext('2d'),hideQ=(mode==='reto'&&!retoSolved);
  const bu=buildup(Rf,nRpm), rc=Rc(nRpm), exc=selfExcites(Rf,nRpm);
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.strokeStyle='#1E3A34';c.lineWidth=3;c.strokeRect(8,8,1008,752);
  c.font='bold 22px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('GENERADOR DE CD AUTOEXCITADO (SHUNT) · VACÍO',26,42);
  if(mode==='reto'){c.textAlign='right';c.fillStyle='#FFB703';
    c.fillText(retoSolved?'✔ RETO RESUELTO':'🎯 RETO: condición desconocida',998,42);}
  /* — esquemático (franja superior) — */
  const TOPRAIL=110,BOTRAIL=290;
  line(c,150,TOPRAIL,880,TOPRAIL,'#EAF4F1',4);line(c,150,BOTRAIL,880,BOTRAIL,'#EAF4F1',4);
  // generador (círculo con G) + flecha de rotación + eje
  c.beginPath();c.arc(160,200,45,0,Math.PI*2);c.fillStyle='#0c1512';c.fill();
  c.strokeStyle='#4FD1C5';c.lineWidth=4;c.stroke();
  c.font='bold 30px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';
  c.fillText('G',160,211);
  c.beginPath();c.arc(160,178,20,0.3,Math.PI*1.5);c.strokeStyle='#8FB3AC';c.lineWidth=3;c.stroke();
  c.beginPath();c.moveTo(178,164);c.lineTo(186,172);c.lineTo(172,178);c.closePath();c.fillStyle='#8FB3AC';c.fill();
  c.font='bold 18px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('n = '+fmtRPM(nRpm)+' (primomotor)',215,205);
  line(c,160,155,160,TOPRAIL,'#EAF4F1',4);line(c,160,245,160,BOTRAIL,'#EAF4F1',4);
  // rama de campo (rama media): reóstato Rf + devanado de campo, en paralelo con los bornes
  line(c,460,TOPRAIL,460,140,'#EAF4F1',3);
  c.fillStyle='#0c1512';c.fillRect(430,140,60,60);
  c.strokeStyle='#4FD1C5';c.lineWidth=4;c.strokeRect(434,144,52,52);
  const arrowAng=Math.atan2(30,52);
  c.save();c.translate(460,170);c.rotate(arrowAng-Math.PI/2+0.55);
  c.beginPath();c.moveTo(-22,14);c.lineTo(22,-14);c.stroke();
  c.beginPath();c.moveTo(22,-14);c.lineTo(14,-16);c.lineTo(18,-6);c.closePath();c.fillStyle='#4FD1C5';c.fill();
  c.restore();
  c.font='bold 18px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';
  c.fillText('Rf · '+fmtOhm(Rf),460,128);
  line(c,460,200,460,222,'#EAF4F1',3);
  c.beginPath();c.arc(460,238,17,0,Math.PI*2);c.fillStyle='#0c1512';c.fill();
  c.strokeStyle='#EAF4F1';c.lineWidth=3;c.stroke();
  c.font='bold 16px system-ui';c.fillStyle='#EAF4F1';c.fillText('A',460,244);
  line(c,460,255,460,262,'#EAF4F1',3);
  for(let k=0;k<4;k++){c.beginPath();c.arc(460,270+k*8,7,Math.PI,0);c.strokeStyle='#e8c832';c.lineWidth=3;c.stroke();}
  line(c,460,270,460,BOTRAIL,'#EAF4F1',3);
  c.font='bold 17px system-ui';c.fillStyle='#FFB703';c.textAlign='left';
  c.fillText('If = '+(hideQ?'¿?':fmtI(bu.If)),478,244);
  // bornes de salida (a circuito abierto — sin carga externa)
  line(c,880,TOPRAIL,880,150,'#EAF4F1',3);line(c,880,210,880,BOTRAIL,'#EAF4F1',3);
  c.beginPath();c.arc(880,180,32,0,Math.PI*2);c.fillStyle='#0c1512';c.fill();
  c.strokeStyle='#EAF4F1';c.lineWidth=4;c.stroke();
  c.font='bold 22px system-ui';c.fillStyle='#EAF4F1';c.textAlign='center';
  c.fillText('V',880,189);
  c.beginPath();c.arc(880,TOPRAIL,6,0,Math.PI*2);c.fillStyle='#EAF4F1';c.fill();
  c.beginPath();c.arc(880,BOTRAIL,6,0,Math.PI*2);c.fillStyle='#EAF4F1';c.fill();
  c.font='bold 19px system-ui';c.fillStyle='#EAF4F1';c.textAlign='right';
  c.fillText('Vt = '+(hideQ?'¿?':fmtV(bu.Vt)),855,150);
  c.font='14px system-ui';c.fillStyle='#8FB3AC';
  c.fillText('bornes abiertos (sin carga)',855,270);
  // ecuación con parámetros vivos
  c.font='16px system-ui';c.textAlign='center';c.fillStyle='#8FB3AC';
  c.fillText('If* = máx(0, Em·(n/n0)/Rf − Ik) · Vt* = Rf·If* · Rc(n) = Rc0·(n/n0), Rc0 = Em/Ik = '+fmtOhm(Rc0)
    +' · Em = '+Em+' V, Ik = '+Ik+' A, n0 = '+n0+' rpm',512,295);
  /* — gráfica de magnetización — */
  c.strokeStyle='#1E3A34';c.lineWidth=2;c.strokeRect(PX0,PY0,PX1-PX0,PY1-PY0);
  c.font='bold 18px system-ui';c.textAlign='left';c.fillStyle='#8FB3AC';
  c.fillText('Vt , E (V)',PX0,PY0-10);
  c.textAlign='right';c.fillText('If (A)',PX1,PY1+40);
  c.font='15px system-ui';
  for(let v=0;v<=VMAX+1e-9;v+=YTICK){const y=yPix(v);
    line(c,PX0,y,PX1,y,'#1E3A34',1);
    c.textAlign='right';c.fillStyle='#8FB3AC';c.fillText(v.toFixed(0),PX0-8,y+5);}
  for(let v=0;v<=IFMAX+1e-9;v+=XTICK){const x=xPix(v);
    line(c,x,PY0,x,PY1,'#1E3A34',1);
    c.textAlign='center';c.fillStyle='#8FB3AC';c.fillText(v.toFixed(1),x,PY1+22);}
  // curva de referencia a n0 (siempre visible: constantes conocidas)
  plotFn(c,v=>E0(v),'#5a6b66',2,[6,6]);
  if(!hideQ){
    // curva a la velocidad actual
    plotFn(c,v=>Efun(v,nRpm),'#4FD1C5',5);
    // recta del reóstato de campo Vt = Rf·If
    plotFn(c,v=>Rf*v,'#FFB703',4);
    // recta de resistencia crítica Vt = Rc(n)·If
    plotFn(c,v=>rc*v,'#f0a5a5',2,[10,6]);
    // punto de operación
    if(exc){
      const qx=xPix(bu.If),qy=yPix(bu.Vt);
      if(qx>=PX0&&qx<=PX1&&qy>=PY0&&qy<=PY1){
        line(c,qx,qy,qx,PY1,'#EAF4F1',1,[5,5]);line(c,PX0,qy,qx,qy,'#EAF4F1',1,[5,5]);
        c.beginPath();c.arc(qx,qy,8,0,Math.PI*2);c.fillStyle='#EAF4F1';c.fill();
        c.strokeStyle='#0c1512';c.lineWidth=2;c.stroke();
        c.font='bold 17px system-ui';c.textAlign='left';c.fillStyle='#EAF4F1';
        c.fillText('Q · '+fmtI(bu.If)+' · '+fmtV(bu.Vt),Math.min(qx+14,780),Math.max(qy-14,PY0+20));
      }
    }
  }
  // insignia de estado
  rr(c,820,318,114,30,8,'#11201c',hideQ?'#8FB3AC':(exc?'#4FD1C5':'#f0a5a5'),2);
  c.font='bold 15px system-ui';c.textAlign='center';
  c.fillStyle=hideQ?'#8FB3AC':(exc?'#4FD1C5':'#f0a5a5');
  c.fillText(hideQ?'¿ AUTOEXCITA ?':(exc?'✔ AUTOEXCITA':'✘ COLAPSA'),877,338);
  bTex.needsUpdate=true;
}
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  const bu=buildup(Rf,nRpm),hideQ=(mode==='reto'&&!retoSolved),exc=selfExcites(Rf,nRpm);
  if(!hideQ&&exc){const qx=xPix(bu.If),qy=yPix(bu.Vt);
    if(Math.hypot(x-qx,y-qy)<40){
      showToast('Punto de operación — la recta del campo (Rf) cruza la curva de magnetización aquí: If = '
        +fmtI(bu.If)+', Vt = '+fmtV(bu.Vt)+' · P = '+fmtP(bu.Vt*bu.If)+' (toda la potencia generada la consume el propio campo, sin carga externa).');
      synth.beep(880,.06,.05);return;}}
  let best=null,bd=1e9;
  for(const h of HIT){const dd=Math.hypot(x-h.x,y-h.y);if(dd<h.r&&dd<bd){bd=dd;best=h;}}
  if(!best)return;
  synth.beep(720,.05,.05);
  if(best.act==='gen')showToast('Armadura movida por el primomotor a n = '+fmtRPM(nRpm)+' — la fem generada escala con n (Faraday): E(If,n) = E0(If)·(n/n0).');
  if(best.act==='rheo')showToast('Reóstato de campo Rf = '+fmtOhm(Rf)+' — fija la pendiente de la recta Vt = Rf·If.'+(hideQ?' Resistencia crítica vendada en el reto: calcula tú Rc(n) antes de comparar.':' Resistencia crítica a esta velocidad: Rc('+fmtRPM(nRpm)+') = '+fmtOhm(Rc(nRpm))+'.'));
  if(best.act==='coil')showToast('Devanado de campo — en conexión SHUNT (derivación) toma su corriente If de los mismos bornes que genera, formando el lazo de autoexcitación.');
  if(best.act==='meter')showToast(hideQ?'Medidor vendado en el reto — predice Vt tú.':'Vt = '+fmtV(bu.Vt)+' en bornes abiertos (sin carga externa) — toda la energía generada se disipa en el propio circuito de campo.');
}

/* ---------- 5 · Banco 3D (modesto: sin objeto físico de inspección detallada) ---------- */
const boardG=new THREE.Group();boardG.position.set(-1.05,0,-0.85);boardG.rotation.y=0.16;
S.scene.add(boardG);
const bFrame=roundedBox(3.62,2.77,0.12,MAT.frame,0.03);
bFrame.position.set(0,1.85,0);boardG.add(bFrame);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.55),
  new THREE.MeshBasicMaterial({map:bTex,toneMapped:false}));
board.position.set(0,1.85,0.065);boardG.add(board);
board.userData={title:'Esquemático + curva de magnetización (toca los elementos)'};
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
/* generador: carcasa + eje + polea giratoria */
const genG=new THREE.Group();genG.position.set(1.15,0.75,1.15);benchG.add(genG);
genG.userData={act:'gen3d',title:'Generador de CD (toca para inspeccionar)'};
const genHousing=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.62,28),MAT.housing);
genHousing.rotation.z=Math.PI/2;genG.add(genHousing);
const genBell=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.05,28),MAT.endbell);
genBell.rotation.z=Math.PI/2;genBell.position.x=-0.335;genG.add(genBell);
const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.34,16),MAT.shaft);
shaft.rotation.z=Math.PI/2;shaft.position.x=-0.48;genG.add(shaft);
const pulleyG=new THREE.Group();pulleyG.position.x=-0.66;genG.add(pulleyG);
const pulleyRim=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,0.06,24),MAT.pulley);
pulleyRim.rotation.z=Math.PI/2;pulleyG.add(pulleyRim);
[0,1,2,3].forEach(k=>{const spoke=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.028,0.26),MAT.shaft);
  spoke.rotation.x=k*Math.PI/4;pulleyG.add(spoke);});
const genLbl=labelSprite('G','#4FD1C5');genLbl.position.set(0,0.42,0);genLbl.scale.multiplyScalar(0.8);genG.add(genLbl);
/* reóstato de campo: cuerpo cerámico + brazo giratorio (cosmético, refleja Rf) */
const rheoG=new THREE.Group();rheoG.position.set(1.95,0.72,0.65);benchG.add(rheoG);
rheoG.userData={act:'rheo3d',title:'Reóstato de campo Rf (ajusta con el deslizador)'};
const rheoBody=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.10,28),MAT.rheoBody);
rheoG.add(rheoBody);
const wiperArm=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.02,0.02),MAT.wiper);
wiperArm.position.y=0.065;rheoG.add(wiperArm);
[-0.16,0.16].forEach(x=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,0.12,8),MAT.lead);
  l.rotation.z=Math.PI/2;l.position.set(x,0,0.12);rheoG.add(l);});
/* dos pantallas digitales: tacómetro (n, Rf) y medidor de bornes (Vt, If) */
const tacho=makeDisplayBox(0.56,0.40,0.34,256,128);
tacho.g.position.set(0.85,0.72,0.25);benchG.add(tacho.g);
tacho.g.userData={act:'tacho',title:'Tacómetro y ajuste de campo (usa los deslizadores)'};
const meter=makeDisplayBox(0.58,0.42,0.36,256,128);
meter.g.position.set(2.42,0.71,0.25);benchG.add(meter.g);
meter.g.userData={act:'meter3d',title:'Medidor de bornes: Vt, If y estado'};
cable([[1.15,0.55,1.30],[1.0,0.60,0.9],[1.1,0.60,0.46]],MAT.cableRed);
cable([[1.95,0.62,0.65],[2.2,0.62,0.45],[2.42,0.60,0.30]],MAT.cableBlk);
[benchG,boardG].forEach(g=>g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}));
board.castShadow=false;

function drawTacho(){const c=tacho.cv.getContext('2d');
  c.fillStyle='#04120e';c.fillRect(0,0,256,128);
  c.font='bold 28px monospace';c.fillStyle='#4FD1C5';c.textAlign='center';
  c.fillText(fmtRPM(nRpm),128,52);
  c.font='bold 22px monospace';c.fillStyle='#FFB703';c.fillText(fmtOhm(Rf),128,88);
  c.font='13px monospace';c.fillStyle='#8FB3AC';c.fillText('n (primomotor) · Rf (campo)',128,112);
  tacho.tx.needsUpdate=true;}
function drawMeter3D(){const c=meter.cv.getContext('2d'),hideQ=(mode==='reto'&&!retoSolved);
  const bu=buildup(Rf,nRpm);
  c.fillStyle='#04120e';c.fillRect(0,0,256,128);
  c.font='bold 26px monospace';c.fillStyle='#EAF4F1';c.textAlign='center';
  c.fillText('Vt '+(hideQ?'¿?':fmtV(bu.Vt)),128,42);
  c.fillStyle='#FFB703';c.fillText('If '+(hideQ?'¿?':fmtI(bu.If)),128,78);
  c.font='14px monospace';c.fillStyle='#8FB3AC';
  c.fillText(hideQ?'? autoexcita ?':(selfExcites(Rf,nRpm)?'✔ autoexcita':'✘ colapsa'),128,108);
  meter.tx.needsUpdate=true;}
function refreshBenchDyn(){
  drawTacho();drawMeter3D();
  const ang=-Math.PI*0.66+((Rf-60)/(400-60))*Math.PI*1.32;
  wiperArm.rotation.y=ang;
}

/* ---------- 6 · HUD + panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Transformadores y máquinas eléctricas (D5)</div>
  <h2>Autoexcitación y curva de magnetización</h2>
  <p>Un generador de CD <b>shunt</b> (derivación) no necesita una fuente externa para su campo:
  arranca con el magnetismo <b>remanente</b> del núcleo y se autoexcita si el reóstato de campo
  queda por debajo de una <b>resistencia crítica</b>. Este banco resuelve en vivo dónde la recta
  del campo cruza la curva de magnetización — y qué pasa cuando no cruza.</p>
  <div class="formula">If* = máx(0, Em·(n/n0)/Rf − Ik) · Vt* = Rf·If*<br>
  Rc(n) = Rc0·(n/n0), Rc0 = Em/Ik · si Rf ≥ Rc(n): NO autoexcita</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Curva de magnetización a la velocidad actual</div>
    <div class="li"><span class="dot" style="background:#5a6b66"></span>Curva de referencia a n0 = 1200 rpm</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Recta del campo Vt = Rf·If</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Recta de resistencia crítica Vt = Rc(n)·If</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> curva de magnetización tipo Fröhlich (saturación) ⚑ — forma genérica
  didáctica, no de una máquina real · escalamiento E ∝ n (Faraday, flujo constante) · resistencia
  crítica EMERGE de la intersección recta-curva, no está codificada aparte · punto de operación
  exacto (forma cerrada).<br>
  <span class="no">NO:</span> resistencia de armadura ni caída IaRa (solo vacío, sin carga externa)
  · reacción de inducido · saturación bajo carga · histéresis/remanencia más allá del arranque ·
  temperatura del devanado · inductancia de campo (dinámica temporal del arranque en el tiempo).</div>
  <div class="src">Ref: Fitzgerald, Kingsley &amp; Umans — Electric Machinery · Fröhlich (curva de saturación, forma genérica)</div>`;
document.getElementById('panel').innerHTML=`
  <h4>Generador shunt · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_curva">📈 Curva</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>
  <div style="font-size:12px;margin:6px 0 2px">Rf (reóstato de campo) · <b id="rfv" class="mono">150 Ω</b></div>
  <input type="range" id="sRf" min="60" max="400" step="1" value="150" style="width:100%;accent-color:#4FD1C5">
  <div style="font-size:12px;margin:6px 0 2px">n (primomotor) · <b id="nv" class="mono">1200 rpm</b></div>
  <input type="range" id="sN" min="600" max="1500" step="10" value="1200" style="width:100%;accent-color:#FFB703">
  <div id="tele">
    <div class="g"><div class="l">Vt (bornes)</div><b id="t_vt">—</b></div>
    <div class="g"><div class="l">If (campo)</div><b id="t_if">—</b></div>
    <div class="g"><div class="l">Rc(n) crítica</div><b id="t_rc">—</b></div>
    <div class="g"><div class="l">Margen Rf/Rc</div><b id="t_marg">—</b></div>
    <div class="g"><div class="l">P = Vt·If</div><b id="t_p">—</b></div>
    <div class="g"><div class="l">Estado</div><b id="t_est">—</b></div>
  </div>
  <div class="console" id="report"></div>
  <div id="retoBox" style="display:none">
    <h4 class="sec">Tu predicción</h4>
    <div style="font-size:12px;color:#8FB3AC;margin-bottom:6px" id="retoHint"></div>
    <div class="modebar" style="margin-bottom:6px">
      <button class="b" id="yn_si">✔ SÍ autoexcita</button>
      <button class="b" id="yn_no">✘ NO colapsa</button>
    </div>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap">
        Vt = <input id="inVt" inputmode="decimal" style="width:64px;background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px 6px" placeholder="0"> V (usa 0 si colapsa)</span>
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
  explora:{nombre:'Explora',cam:[[3.0,2.4,7.0],[0.4,1.3,0.0]],
    mision:'Mueve Rf y n: observa dónde la recta del campo cruza la curva de magnetización — ese cruce es el punto de operación.'},
  curva:{nombre:'Curva de magnetización',cam:[[-0.2,2.1,3.9],[-0.9,1.75,-0.8]],
    mision:'Acerca Rf a la resistencia crítica Rc(n): la recta del campo se vuelve casi TANGENTE a la curva cerca del origen y el punto de operación colapsa hacia cero.'},
  reto:{nombre:'Reto',cam:[[0.5,2.2,5.5],[0.1,1.3,0.1]],
    mision:'Condición desconocida: te dan Rf y n. Calcula Rc(n) y predice si autoexcita y con qué Vt — ANTES de revelar la curva.'},
};
function setMode(k){
  mode=k;solved=false;
  ['explora','curva','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('p_mision').textContent=MODE_META[k].mision;
  el('retoBox').style.display=(k==='reto')?'block':'none';
  const locked=(k==='reto');
  el('sRf').disabled=locked;el('sN').disabled=locked;
  if(k==='reto'){
    if(!MYST)genMystery();
    Rf=MYST.Rf;nRpm=MYST.n;
    el('sRf').value=Rf;el('rfv').textContent=fmtOhm(Rf);
    el('sN').value=nRpm;el('nv').textContent=fmtRPM(nRpm);
    el('retoHint').textContent='Condición dada: Rf = '+fmtOhm(MYST.Rf)+', n = '+fmtRPM(MYST.n)
      +' · constantes conocidas: Em = '+Em+' V, Ik = '+Ik+' A, n0 = '+n0+' rpm · tolerancia en Vt: máx(2 V, 5 % de Vt) si autoexcita, ±1.5 V si predices colapso';
  }
  clearDx();refreshQuestion();refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}
function selectYN(k){
  if(mode!=='reto')return;
  predYN=k;
  ['si','no'].forEach(kk=>el('yn_'+kk).classList.toggle('on',kk===k));
}

/* ---------- 9 · Telemetría + reporte ---------- */
function set(id,txt,cls){const n=el(id);n.textContent=txt;
  n.classList.remove('good','warn','bad');if(cls)n.classList.add(cls);}
function updateTele(){
  const hideQ=(mode==='reto'&&!retoSolved);
  const bu=buildup(Rf,nRpm),rc=Rc(nRpm),exc=selfExcites(Rf,nRpm);
  const marg=((rc-Rf)/rc)*100;
  const mcls=hideQ?'warn':(marg>15?'good':marg>=0?'warn':'bad');
  set('t_vt',hideQ?'¿?':fmtV(bu.Vt),hideQ?'warn':(exc?'good':'bad'));
  set('t_if',hideQ?'¿?':fmtI(bu.If),hideQ?'warn':(exc?'good':'bad'));
  set('t_rc',hideQ?'¿?':fmtOhm(rc),'good');
  set('t_marg',hideQ?'¿?':fmtPct(marg),mcls);
  set('t_p',hideQ?'¿?':fmtP(bu.Vt*bu.If),hideQ?'warn':'good');
  if(mode==='reto')set('t_est',retoSolved?'✔ PREDICCIÓN OK':'RETO · predice','warn');
  else set('t_est',exc?'✔ AUTOEXCITA':'✘ COLAPSA',exc?'good':'bad');
}
function updateReport(){
  const rep=el('report');const L=[];
  const bu=buildup(Rf,nRpm),rc=Rc(nRpm),exc=selfExcites(Rf,nRpm);
  if(mode==='explora'){
    L.push('Rc(n) = Rc0·(n/n0) = '+fmtOhm(Rc0)+'·('+nRpm+'/'+n0+') = '+fmtOhm(rc));
    L.push(exc?'Rf ('+fmtOhm(Rf)+') < Rc(n) ('+fmtOhm(rc)+') → autoexcita: If* = '+fmtI(bu.If)+', Vt* = '+fmtV(bu.Vt)
      :'Rf ('+fmtOhm(Rf)+') ≥ Rc(n) ('+fmtOhm(rc)+') → NO autoexcita: el campo nunca alcanza el magnetismo remanente suficiente para arrancar el lazo.');
    if(exc&&((rc-Rf)/rc)*100<15)L.push('⚠ margen estrecho: estás cerca de la resistencia crítica — sube n o baja Rf para un arranque más robusto.');
    L.push('Toca el generador, el reóstato, el devanado o el medidor de bornes.');
  }else if(mode==='curva'){
    L.push('Curva de magnetización: E0(If) = Em·If/(Ik+If), con Em = '+Em+' V, Ik = '+Ik+' A.');
    L.push('Pendiente en el origen de E0: Em/Ik = '+fmtOhm(Rc0)+' → a n = '+fmtRPM(nRpm)+', Rc(n) = '+fmtOhm(rc)+'.');
    L.push('Sube Rf hacia '+fmtOhm(rc)+' (la resistencia crítica actual): la recta del campo se acerca a la tangente y Q se desliza al origen.');
    L.push(exc?'Q actual: If = '+fmtI(bu.If)+', Vt = '+fmtV(bu.Vt):'Sin cruce con If>0: colapso total (Vt ≈ 0).');
  }else{
    L.push('Condición dada: Rf = '+fmtOhm(Rf)+', n = '+fmtRPM(nRpm)+' · constantes: Em = '+Em+' V, Ik = '+Ik+' A, n0 = '+n0+' rpm.');
    L.push('1) Rc(n) = (Em/Ik)·(n/n0)  2) compara Rf con Rc(n)  3) si Rf<Rc(n): If* = Em·(n/n0)/Rf − Ik, Vt* = Rf·If*.');
    if(retoSolved)L.push('✔ '+retoMsg);
    else if(retoMsg)L.push(retoMsg);
  }
  rep.innerHTML=L.map(s=>'<div>'+s+'</div>').join('');
}
function refreshAll(){
  drawBoard();updateTele();updateReport();refreshBenchDyn();
}

/* ---------- 10 · Reto: condición misteriosa ---------- */
function checkReto(){
  if(!MYST)return;
  if(!predYN){el('retoOut').innerHTML='<span class="dtc">Primero elige SÍ o NO.</span>';return;}
  const raw=el('inVt').value.replace(',','.');const vtStu=parseFloat(raw);
  if(!isFinite(vtStu)){el('retoOut').innerHTML='<span class="dtc">Escribe tu Vt predicho en voltios (usa 0 si crees que colapsa).</span>';return;}
  const okYN=(predYN==='si')===MYST.selfExcites;
  const tol=MYST.selfExcites?Math.max(2,0.05*MYST.Vt):1.5;
  const okVt=Math.abs(vtStu-MYST.Vt)<=tol;
  if(okYN&&okVt){
    retoSolved=true;solved=true;
    retoMsg='Exacto: '+(MYST.selfExcites?'autoexcita':'colapsa')+' — Vt* = '+fmtV(MYST.Vt)+' (If* = '+fmtI(MYST.If)+', Rc(n) = '+fmtOhm(Rc(MYST.n))+').';
    el('retoOut').innerHTML='<span class="ok">✔ ¡Predicción correcta! '+retoMsg+'</span>';
    synth.beep(880,.1,.08);setTimeout(()=>synth.beep(1175,.15,.08),140);
  }else{
    retoMsg='';
    el('retoOut').innerHTML='<span class="dtc">✘ Aún no'+(okYN?'':' · revisa SÍ/NO')+(okVt?'':' · revisa Vt')
      +'.</span> Calcula Rc(n) = (Em/Ik)·(n/n0) y compáralo con Rf.';
    synth.beep(220,.15,.08);
  }
  refreshAll();
}
function newMystery(){
  genMystery();el('inVt').value='';el('retoOut').innerHTML='';
  ['si','no'].forEach(kk=>el('yn_'+kk).classList.remove('on'));
  buildQuiz();
  setMode('reto');
  showToast('Nuevo caso misterioso servido: Rf = '+fmtOhm(MYST.Rf)+', n = '+fmtRPM(MYST.n)+'. ¿Autoexcita?');
}

/* ---------- 11 · Quiz de ingeniería (valores calculados en vivo) ---------- */
function shuffle(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
let QUIZ={};
function buildQuiz(){
  const rc1200=Rc(1200);
  QUIZ.explora={pregunta:'A n = 1200 rpm (n0), la resistencia crítica es Rc = '+fmtOhm(rc1200)+'. Si subes Rf de 150 Ω a 240 Ω sin tocar n, ¿qué pasa con If* y Vt*?',
    opciones:shuffle([
      {t:'Bajan los dos: la recta del campo gira hacia arriba y cruza la curva más cerca del origen',ok:true,
       why:'Correcto: a mayor Rf, la recta Vt=Rf·If tiene más pendiente y corta E0(If) en un punto con If y Vt menores — cada vez más cerca del origen conforme Rf → Rc(n).'},
      {t:'No cambian: el generador siempre entrega la misma Vt en vacío',ok:false,
       why:'Al revés: en vacío (sin carga) el ÚNICO punto de equilibrio posible es la intersección con la recta del campo, y esa recta SÍ depende de Rf.'},
      {t:'Suben los dos: más resistencia siempre autoexcita mejor',ok:false,
       why:'Es lo contrario: más Rf empuja la recta hacia la tangente con la curva — más cerca del colapso, no más lejos.'},
      {t:'If* baja pero Vt* sube (Vt = Rf·If con Rf mayor)',ok:false,
       why:'If* baja MÁS rápido de lo que Rf sube: el producto Rf·If* (que es Vt*) también cae al acercarte a la resistencia crítica.'}])};
  QUIZ.curva={pregunta:'¿Qué representa la pendiente de E0(If) evaluada en If = 0 (el origen)?',
    opciones:shuffle([
      {t:'La resistencia crítica a n0: Rc0 = Em/Ik = '+fmtOhm(Rc0),ok:true,
       why:'Correcto: cerca del origen E0(If) ≈ (Em/Ik)·If (lineal), así que su pendiente inicial ES Rc0. Cualquier Rf por arriba de esa pendiente nunca cruza la curva con If>0.'},
      {t:'La tensión nominal Em = '+Em+' V',ok:false,
       why:'Em es la ASÍNTOTA de la curva (If → ∞), no su pendiente en el origen — son dos parámetros distintos de la saturación tipo Fröhlich.'},
      {t:'La corriente de rodilla Ik = '+Ik+' A',ok:false,
       why:'Ik marca dónde la curva empieza a "doblar" hacia la saturación, no la pendiente inicial (que es el cociente Em/Ik).'},
      {t:'Cero: toda curva de magnetización arranca plana',ok:false,
       why:'Al revés: E0(If) = Em·If/(Ik+If) tiene su pendiente MÁXIMA justo en If=0 — por eso ahí vive la resistencia crítica.'}])};
  if(MYST){
    QUIZ.reto={pregunta:'En el modo Reto te dan Rf y n; con las constantes conocidas puedes calcular Rc(n) = (Em/Ik)·(n/n0). ¿Cómo se usa ese número para decidir si autoexcita?',
      opciones:shuffle([
        {t:'Si Rf < Rc(n) autoexcita; si Rf ≥ Rc(n) colapsa',ok:true,
         why:'Correcto: Rc(n) es la pendiente crítica. Por debajo de ella la recta del campo SIEMPRE cruza la curva de saturación en un punto con If>0; por encima, nunca lo hace (fuera del origen).'},
        {t:'Si Rf < Rc(n) colapsa; si Rf ≥ Rc(n) autoexcita',ok:false,
         why:'Es al revés: MÁS resistencia de campo dificulta la autoexcitación, no la favorece — una recta más empinada corta la curva saturante más cerca del origen, hasta perder el cruce.'},
        {t:'Rc(n) no importa si n > 0: siempre autoexcita mientras gire',ok:false,
         why:'No — girar (n>0) es NECESARIO pero no suficiente: si Rf es demasiado grande para esa velocidad, el lazo de autoexcitación nunca cierra.'},
        {t:'Hay que comparar Rf contra Em, no contra Rc(n)',ok:false,
         why:'Em es la asíntota de tensión, no un umbral de resistencia — el criterio de autoexcitación es geométrico: pendiente de la recta (Rf) vs. pendiente inicial de la curva (Rc(n)).'}])};
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
  const bu=buildup(Rf,nRpm),hideQ=(mode==='reto'&&!retoSolved);
  if(act==='gen3d')showToast('Generador de CD — primomotor a n = '+fmtRPM(nRpm)+'. Ajusta la velocidad con el deslizador n.');
  else if(act==='rheo3d')showToast('Reóstato de campo — Rf = '+fmtOhm(Rf)+'. Ajusta con el deslizador Rf.');
  else if(act==='tacho')showToast('Panel de control: n = '+fmtRPM(nRpm)+', Rf = '+fmtOhm(Rf)+'.');
  else if(act==='meter3d')showToast(hideQ?'Medidor vendado en el reto: predice Vt tú.':'Vt = '+fmtV(bu.Vt)+' · If = '+fmtI(bu.If)+' · '+(selfExcites(Rf,nRpm)?'✔ autoexcita':'✘ colapsa'));
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
    Rf=150;el('sRf').value=150;el('rfv').textContent=fmtOhm(150);
    nRpm=1200;el('sN').value=1200;el('nv').textContent=fmtRPM(1200);refreshAll();
    showToast('1/4 · Punto de operación: donde la recta del campo (Rf) cruza la curva de magnetización.');
    await sleep(3000);
    setMode('curva');await sleep(1200);
    showToast('2/4 · Acercando Rf a la resistencia crítica Rc('+fmtRPM(nRpm)+') = '+fmtOhm(Rc(nRpm))+'…');
    await sleep(1600);
    const target=Rc(nRpm)+15;
    const steps=18;
    for(let k=0;k<=steps;k++){
      if(mode!=='curva')break;
      Rf=150+(target-150)*(k/steps);el('sRf').value=Rf.toFixed(0);el('rfv').textContent=fmtOhm(Rf);
      refreshAll();await sleep(140);
    }
    showToast(selfExcites(Rf,nRpm)?'Casi en el borde: If* y Vt* colapsaron hacia cero.':'Rf superó Rc(n): el generador ya NO autoexcita — Vt* = 0.');
    await sleep(2800);
    Rf=150;el('sRf').value=150;el('rfv').textContent=fmtOhm(150);refreshAll();
    setMode('reto');
    showToast('3/4 · Reto: te dan Rf y n. Calcula Rc(n) y predice SÍ/NO y Vt antes de revelar.');
    await sleep(2600);
    selectYN(MYST.selfExcites?'si':'no');
    el('inVt').value=MYST.Vt.toFixed(1);
    await sleep(1000);checkReto();await sleep(2200);
    const q=QUIZ.reto;const idx=q?q.opciones.findIndex(o=>o.ok):-1;
    const btn=idx>=0?el('dxbtns').children[idx]:null;if(btn)btn.click();
    await sleep(1400);
    newMystery();
    showToast('4/4 · Recorrido completo: te dejo un caso misterioso nuevo sin resolver — inténtalo tú, o pide otro (🔀).');
  }finally{autoRunning=false;b.disabled=false;b.textContent='✨ Recorrido guiado';}
}
S.setAnimate(()=>{ // la polea del primomotor siempre gira, proporcional a n
  pulleyG.rotation.x+=0.006*(nRpm/n0);
});
/* wiring */
['explora','curva','reto'].forEach(m=>el('m_'+m).onclick=()=>setMode(m));
el('sRf').addEventListener('input',()=>{Rf=parseFloat(el('sRf').value);
  el('rfv').textContent=fmtOhm(Rf);refreshAll();});
el('sN').addEventListener('input',()=>{nRpm=parseFloat(el('sN').value);
  el('nv').textContent=fmtRPM(nRpm);refreshAll();});
el('yn_si').onclick=()=>selectYN('si');
el('yn_no').onclick=()=>selectYN('no');
el('btnCheck').onclick=checkReto;
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newMystery;
/* init */
genMystery();buildQuiz();
S.start();setMode('explora');
window.__labDebug={
  state:()=>({mode,Rf,n:nRpm,retoSolved,predYN,solved}),
  point:()=>buildup(Rf,nRpm),
  rc:()=>Rc(nRpm),
  selfExcites:()=>selfExcites(Rf,nRpm),
  mystery:()=>MYST?{...MYST}:null,
  buildup,Rc,E0,Efun,
  setRf:v=>{Rf=v;el('sRf').value=v;el('rfv').textContent=fmtOhm(Rf);refreshAll();},
  setN:v=>{nRpm=v;el('sN').value=v;el('nv').textContent=fmtRPM(nRpm);refreshAll();},
  selectYN,checkReto,newMystery,boardClick,mode:()=>mode,setMode,
};
