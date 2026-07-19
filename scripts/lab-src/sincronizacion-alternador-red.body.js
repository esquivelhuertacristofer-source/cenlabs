/* ============================================================
   LAB — SINCRONIZACIÓN DE UN ALTERNADOR A LA RED (Dominio D5 ·
   Transformadores y máquinas eléctricas — molde S+P: esquemático
   + sincronoscopio/lámparas + instrumentos virtuales, sin objeto
   físico de inspección detallada)
   Tema: las 4 condiciones clásicas de sincronización — tensión,
   frecuencia, secuencia de fases y ángulo de fase — y la
   limitación estructural real de un sincronoscopio de una sola
   pareja de fases: es CIEGO a la secuencia invertida.
     θ(t) = θ₀ + 360·Δf·t (mod 360°, envuelto a ±180°)
     cierre válido ⟺ |ΔV|≤5% · |Δf|≤0.1 Hz · secuencia correcta
     · |θ|≤10° ⚑ (tolerancias prácticas, IEEE C50.12/C50.13)
   factor de choque ilustrativo = 2·sin(|θ|/2) ⚑ — NO es una
   corriente ni un par real, solo una severidad relativa.
   Lámparas: V_lámpara,k = |Vgen∠(θ+s·k·120°) − Vred∠(k·120°)|,
   con s=+1 (secuencia correcta) o −1 (invertida) — con secuencia
   correcta las 3 se anulan juntas en θ=0; con secuencia invertida
   el patrón rota en vez de parpadear en bloque.
   NO modela: dinámica del regulador de velocidad/excitación,
   transitorios electromecánicos reales del cierre, el relé de
   verificación de sincronismo (25) de una subestación real, ni
   IEC 60034 como norma de PROCEDIMIENTO (normaliza máquinas
   rotativas, no el procedimiento de sincronización — cita
   curricular de la lista maestra, hedgeada ⚑).
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.2,2.3,7.2],target:[0.5,1.2,0.0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ---------- 1 · Modelo físico (sincronización, forma cerrada) ---------- */
const VTOL=5, FTOL=0.1, ANGTOL=10;             // ⚑ tolerancias prácticas (IEEE C50.12/C50.13)
function wrapAngle(a){return ((a+180)%360+360)%360-180;}
function evaluar(Vg,df,sq,th0){
  const dV=Vg-100, th=wrapAngle(th0);
  const condV=Math.abs(dV)<=VTOL, condF=Math.abs(df)<=FTOL, condSeq=sq==='correcta', condAng=Math.abs(th)<=ANGTOL;
  const allOk=condV&&condF&&condSeq&&condAng;
  const shock=2*Math.sin(Math.abs(th)*Math.PI/180/2);
  return{dV,th,condV,condF,condSeq,condAng,allOk,shock};
}
function lampVoltages(Vg,th,sq){
  const s=sq==='correcta'?1:-1, out=[];
  for(let k=0;k<3;k++){
    const thGen=(th+s*k*120)*Math.PI/180, thGrid=(k*120)*Math.PI/180;
    const gx=Vg*Math.cos(thGen), gy=Vg*Math.sin(thGen);
    const bx=100*Math.cos(thGrid), by=100*Math.sin(thGrid);
    out.push(Math.hypot(gx-bx,gy-by));
  }
  return out;
}

/* ---------- 2 · Estado ---------- */
let mode='explora', Vgen=100, dF=0.15, seq='correcta', theta=0;
let MYST=null, retoSolved=false, solved=false, lastAttempt=null;
let clockT=0, teleAcc=0, autoRunning=false;

function genMystery(){
  const kinds=['ok','voltaje','frecuencia','secuencia','angulo'];
  const kind=kinds[Math.floor(Math.random()*kinds.length)];
  let mV=100+(Math.random()*2-1)*2;    // ±2 % — dentro de tolerancia (±5 %)
  let mF=(Math.random()*2-1)*0.06;     // ±0.06 Hz — dentro de tolerancia (±0.1 Hz)
  let mS='correcta';
  let mT=(Math.random()*2-1)*6;        // ±6° — dentro de tolerancia (±10°)
  if(kind==='voltaje'){
    const sg=Math.random()<0.5?-1:1;
    mV=100+sg*(VTOL+1+Math.random()*4);          // 6–10 % fuera
  }else if(kind==='frecuencia'){
    const sg=Math.random()<0.5?-1:1;
    mF=sg*(FTOL+0.05+Math.random()*0.3);         // 0.15–0.45 Hz fuera
  }else if(kind==='secuencia'){
    mS='invertida';
  }else if(kind==='angulo'){
    const sg=Math.random()<0.5?-1:1;
    mT=sg*(ANGTOL+5+Math.random()*80);           // 15–95° fuera
  }
  MYST={kind,Vgen:+mV.toFixed(2),dF:+mF.toFixed(3),seq:mS,theta:+mT.toFixed(1)};
  retoSolved=false;
}
function realKindOf(m){
  const r=evaluar(m.Vgen,m.dF,m.seq,m.theta);
  if(!r.condV)return'voltaje';if(!r.condF)return'frecuencia';if(!r.condSeq)return'secuencia';if(!r.condAng)return'angulo';return'ok';
}
function kindLabel(k){
  return k==='ok'?'CERRAR (todo OK)':k==='voltaje'?'tensión fuera de tolerancia':k==='frecuencia'?'frecuencia fuera de tolerancia':k==='secuencia'?'secuencia invertida':'ángulo fuera de tolerancia';
}

/* ---------- 3 · Materiales ---------- */
const std=o=>new THREE.MeshStandardMaterial(o);
const MAT={
  bench:  std({color:0x3a464d,roughness:0.85,metalness:0.05}),
  frame:  std({color:0x232a2e,roughness:0.95,metalness:0}),
  housing:std({color:0x2c3338,roughness:0.55,metalness:0.55}),
  endbell:std({color:0x8a8f94,roughness:0.4,metalness:0.7}),
  shaft:  std({color:0xc9ced2,roughness:0.3,metalness:0.85}),
  rheoBody:std({color:0xd8c49a,roughness:0.7,metalness:0}),
  wiper:  std({color:0xbfc8ce,metalness:0.85,roughness:0.3}),
  dispBox:std({color:0x707c85,metalness:0.35,roughness:0.85}),
  lead:   std({color:0xbfc8ce,metalness:0.9,roughness:0.35}),
  cableRed:std({color:0x9e2b2b,roughness:1.0,metalness:0}),
  cableBlk:std({color:0x15181b,roughness:1.0,metalness:0}),
  bus:    std({color:0xc08a3e,roughness:0.35,metalness:0.85}),
};

/* ---------- 4 · Pizarrón: esquemático + sincronoscopio + lámparas ---------- */
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;
bTex.minFilter=THREE.LinearFilter;bTex.generateMipmaps=false;
function rr(c,x,y,w,h,r,fill,stroke,lw){c.beginPath();c.roundRect(x,y,w,h,r);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.stroke();}}
function line(c,x1,y1,x2,y2,col,w,dash){c.strokeStyle=col;c.lineWidth=w||3;
  c.setLineDash(dash||[]);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);}
function drawSchematic(c){
  const RAILY=170;
  c.font='16px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('Alternador · interruptor de sincronismo (52) · barra de red (diagrama unifilar)',150,RAILY-42);
  line(c,150,RAILY,880,RAILY,'#EAF4F1',4);
  c.beginPath();c.arc(150,RAILY,46,0,Math.PI*2);c.fillStyle='#0c1512';c.fill();
  c.strokeStyle='#4FD1C5';c.lineWidth=4;c.stroke();
  c.font='bold 30px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';c.fillText('G',150,RAILY+11);
  const bx0=460,bx1=560,by0=RAILY-42,by1=RAILY+42;
  const closedLook=lastAttempt&&lastAttempt.allOk&&(clockT-lastAttempt.tAtClose)<1.2;
  const badFlash=lastAttempt&&!lastAttempt.allOk&&(clockT-lastAttempt.tAtClose)<0.6;
  rr(c,bx0,by0,bx1-bx0,by1-by0,8,'#0c1512',badFlash?'#e05555':(closedLook?'#4FD1C5':'#FFB703'),3);
  c.font='bold 22px system-ui';c.fillStyle=badFlash?'#e05555':(closedLook?'#4FD1C5':'#FFB703');c.textAlign='center';
  c.fillText('52',510,RAILY+8);
  c.font='13px system-ui';c.fillStyle='#8FB3AC';
  c.fillText(closedLook?'CERRADO':'abierto',510,by1+22);
  rr(c,760,RAILY-40,120,80,8,'#0c1512','#8FB3AC',3);
  c.font='bold 20px system-ui';c.fillStyle='#EAF4F1';c.textAlign='center';
  c.fillText('RED',820,RAILY+8);
  c.font='12px system-ui';c.fillStyle='#8FB3AC';
  c.fillText('100 V · 60.00 Hz (ref.)',820,RAILY+58);
}
function drawDial(c,cx,cy,r){
  c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fillStyle='#0c1512';c.fill();
  c.strokeStyle='#1E3A34';c.lineWidth=3;c.stroke();
  c.beginPath();c.moveTo(cx,cy-r);c.lineTo(cx,cy-r+14);c.strokeStyle='#4FD1C5';c.lineWidth=4;c.stroke();
  c.font='13px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';c.fillText('SYNC',cx,cy-r-10);
  c.font='12px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';c.fillText('RÁPIDO →',cx+r-58,cy+r+18);
  c.textAlign='right';c.fillText('← LENTO',cx-r+58,cy+r+18);
  c.save();c.translate(cx,cy);c.rotate(theta*Math.PI/180);
  c.beginPath();c.moveTo(0,-(r-14));c.lineTo(-6,12);c.lineTo(6,12);c.closePath();
  c.fillStyle='#FFB703';c.fill();
  c.restore();
  c.beginPath();c.arc(cx,cy,7,0,Math.PI*2);c.fillStyle='#EAF4F1';c.fill();
  c.font='13px system-ui';c.textAlign='center';c.fillStyle='#8FB3AC';
  c.fillText('Sincronoscopio (una sola pareja de fases)',cx,cy+r+40);
}
function drawLamps(c,x0,y0){
  const V=lampVoltages(Vgen,theta,seq);
  const labels=['L1-L1\'','L2-L2\'','L3-L3\''];
  c.font='13px system-ui';c.textAlign='left';c.fillStyle='#8FB3AC';
  c.fillText('Lámparas de sincronismo (método de lámparas apagadas)',x0-10,y0-42);
  for(let k=0;k<3;k++){
    const cx=x0+k*74,cy=y0;
    const bright=Math.min(1,V[k]/200);
    c.beginPath();c.arc(cx,cy,26,0,Math.PI*2);
    c.fillStyle='rgba(255,200,80,'+(0.12+0.85*bright).toFixed(3)+')';c.fill();
    c.strokeStyle='#8FB3AC';c.lineWidth=2;c.stroke();
    c.font='11px system-ui';c.fillStyle='#8FB3AC';c.textAlign='center';
    c.fillText(labels[k],cx,cy+44);
    c.fillText(V[k].toFixed(0)+' V',cx,cy+58);
  }
}
function drawSeqIndicator(c,cx,cy,r){
  c.font='13px system-ui';c.textAlign='center';c.fillStyle='#8FB3AC';
  c.fillText('Indicador dedicado de secuencia',cx,cy-r-16);
  const order=seq==='correcta'?[0,1,2]:[0,2,1];
  const angBase=[-90,30,150];
  for(let i=0;i<3;i++){
    const slot=order[i];
    const ang=angBase[i]*Math.PI/180;
    const px=cx+r*Math.cos(ang), py=cy+r*Math.sin(ang);
    c.beginPath();c.arc(px,py,18,0,Math.PI*2);c.fillStyle='#11201c';c.fill();
    c.strokeStyle='#4FD1C5';c.lineWidth=2;c.stroke();
    c.font='bold 15px system-ui';c.fillStyle='#4FD1C5';c.textAlign='center';
    c.fillText(String(slot+1),px,py+5);
  }
  c.font='12px system-ui';c.textAlign='center';c.fillStyle=seq==='correcta'?'#7bdc9a':'#e05555';
  c.fillText(seq==='correcta'?'1-2-3 (correcta)':'1-3-2 (INVERTIDA)',cx,cy+r+26);
}
function drawBoard(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.strokeStyle='#1E3A34';c.lineWidth=3;c.strokeRect(8,8,1008,752);
  c.font='bold 22px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('SINCRONIZACIÓN DE UN ALTERNADOR A LA RED',26,42);
  if(mode==='reto'){c.textAlign='right';c.fillStyle='#FFB703';
    c.fillText(retoSolved?'✔ RETO RESUELTO':'🎯 RETO: clasifica GO/NO-GO',998,42);}
  c.font='bold 16px system-ui';c.textAlign='center';c.fillStyle='#EAF4F1';
  c.fillText('Vgen='+Vgen.toFixed(1)+' V (ref. 100 V) · Δf='+dF.toFixed(3)+' Hz · secuencia '+(seq==='correcta'?'correcta':'INVERTIDA')+' · θ='+wrapAngle(theta).toFixed(1)+'°',512,80);
  drawSchematic(c);
  const r=evaluar(Vgen,dF,seq,theta);
  const chips=[['V',r.condV],['f',r.condF],['secuencia',r.condSeq],['θ',r.condAng]];
  let cx0=150;
  c.font='13px system-ui';
  chips.forEach(ch=>{const label=ch[0],okC=ch[1];
    rr(c,cx0,250,84,30,6,okC?'#11331f':'#331414',okC?'#7bdc9a':'#e05555',2);
    c.fillStyle=okC?'#7bdc9a':'#e05555';c.textAlign='center';
    c.fillText(label+' '+(okC?'✓':'✗'),cx0+42,270);
    cx0+=96;
  });
  drawDial(c,290,470,120);
  drawLamps(c,600,450);
  if(mode==='comparar')drawSeqIndicator(c,900,470,70);
  c.font='14px system-ui';c.textAlign='center';c.fillStyle='#8FB3AC';
  c.fillText('θ(t) = θ₀ + 360·Δf·t (mod 360°, envuelto a ±180°) · cierre válido si |ΔV|≤'+VTOL+'%, |Δf|≤'+FTOL+' Hz, secuencia correcta, |θ|≤'+ANGTOL+'° ⚑',512,712);
  bTex.needsUpdate=true;
}
function attemptClose(){
  const r=evaluar(Vgen,dF,seq,theta);
  lastAttempt={...r,tAtClose:clockT};
  if(r.allOk){
    solved=true;
    showToast('<span style="color:var(--good)">✔ Cierre exitoso — las 4 condiciones están dentro de tolerancia, sin golpe de par perceptible.</span>');
    synth.beep(880,.1,.08);setTimeout(()=>synth.beep(1175,.15,.08),140);
  }else{
    const reasons=[];
    if(!r.condV)reasons.push('ΔV='+r.dV.toFixed(1)+'% fuera de ±'+VTOL+'%');
    if(!r.condF)reasons.push('Δf='+dF.toFixed(3)+' Hz fuera de ±'+FTOL+' Hz');
    if(!r.condSeq)reasons.push('secuencia de fases invertida');
    if(!r.condAng)reasons.push('θ='+r.th.toFixed(1)+'° fuera de ±'+ANGTOL+'°');
    showToast('<span style="color:var(--bad)">✘ Cierre fuera de sincronismo: '+reasons.join(' · ')+'. Factor de choque ilustrativo ≈'+r.shock.toFixed(2)+'× ⚑.</span>');
    synth.beep(180,.18,.09);
  }
  refreshAll();
}
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  if(x>460&&x<560&&y>128&&y<212){
    if(mode==='reto'){showToast('En el reto, usa los botones de decisión del panel — el interruptor aquí es solo referencia visual.');synth.beep(400,.05,.05);return;}
    attemptClose();return;
  }
  if(Math.hypot(x-150,y-170)<55){
    showToast('Alternador — genera Vgen='+Vgen.toFixed(1)+' V a una frecuencia que difiere de la red en Δf='+dF.toFixed(3)+' Hz.');
    synth.beep(720,.05,.05);return;
  }
  if(x>760&&x<880&&y>130&&y<210){
    showToast('Barra de red — referencia fija: 100 V, 60.00 Hz, secuencia 1-2-3.');
    synth.beep(720,.05,.05);return;
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
board.userData={title:'Esquemático + sincronoscopio + lámparas (toca los elementos)'};
const benchG=new THREE.Group();benchG.position.set(0.6,0,0.9);S.scene.add(benchG);
const mesa=roundedBox(3.2,0.5,1.9,MAT.bench,0.05);
mesa.position.set(1.85,0.25,0.75);benchG.add(mesa);
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
/* alternador: carcasa + eje + tapa */
const altG=new THREE.Group();altG.position.set(1.15,0.75,1.15);benchG.add(altG);
altG.userData={act:'alt3d',title:'Alternador (toca para inspeccionar)'};
const altHousing=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.62,28),MAT.housing);
altHousing.rotation.z=Math.PI/2;altG.add(altHousing);
const altBell=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.05,28),MAT.endbell);
altBell.rotation.z=Math.PI/2;altBell.position.x=-0.335;altG.add(altBell);
const altShaft=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.34,16),MAT.shaft);
altShaft.rotation.z=Math.PI/2;altShaft.position.x=-0.48;altG.add(altShaft);
const altLbl=labelSprite('G','#4FD1C5');altLbl.position.set(0,0.42,0);altLbl.scale.multiplyScalar(0.8);altG.add(altLbl);
/* interruptor de sincronismo (52): cuerpo + palanca (cosmético, refleja estado abierto/cerrado) */
const brkG=new THREE.Group();brkG.position.set(1.95,0.72,0.65);benchG.add(brkG);
brkG.userData={act:'brk3d',title:'Interruptor de sincronismo (52)'};
const brkBody=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.10,28),MAT.rheoBody);
brkG.add(brkBody);
const brkArm=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.02,0.02),MAT.wiper);
brkArm.position.y=0.065;brkG.add(brkArm);
[-0.16,0.16].forEach(x=>{const l=new THREE.Mesh(new THREE.CylinderGeometry(0.01,0.01,0.12,8),MAT.lead);
  l.rotation.z=Math.PI/2;l.position.set(x,0,0.12);brkG.add(l);});
/* barra de red: busbar de cobre */
const busG=new THREE.Group();busG.position.set(2.68,0.78,1.15);benchG.add(busG);
busG.userData={act:'bus3d',title:'Barra de red (referencia fija)'};
const busBar=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.42,0.10),MAT.bus);
busG.add(busBar);
const busLbl=labelSprite('RED','#8FB3AC');busLbl.position.set(0,0.34,0);busLbl.scale.multiplyScalar(0.7);busG.add(busLbl);
/* dos pantallas digitales: panel (Vgen/Δf) y medidor (θ/veredicto) */
const panelD=makeDisplayBox(0.56,0.40,0.34,256,128);
panelD.g.position.set(0.85,0.72,0.25);benchG.add(panelD.g);
panelD.g.userData={act:'panelD',title:'Panel: tensión y deslizamiento de frecuencia'};
const meter=makeDisplayBox(0.58,0.42,0.36,256,128);
meter.g.position.set(2.62,0.71,0.25);benchG.add(meter.g);
meter.g.userData={act:'meter3d',title:'Medidor: ángulo de fase y veredicto'};
cable([[1.15,0.55,1.30],[1.0,0.60,0.9],[1.1,0.60,0.46]],MAT.cableRed);
cable([[1.95,0.62,0.65],[2.2,0.62,0.45],[2.42,0.60,0.30]],MAT.cableBlk);
cable([[1.95,0.62,0.65],[2.4,0.65,0.85],[2.68,0.60,1.05]],MAT.cableBlk);
[benchG,boardG].forEach(g=>g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}));
board.castShadow=false;

function drawPanelD(){const c=panelD.cv.getContext('2d');
  c.fillStyle='#04120e';c.fillRect(0,0,256,128);
  c.font='bold 22px monospace';c.fillStyle='#4FD1C5';c.textAlign='center';
  c.fillText('V '+Vgen.toFixed(1)+' V',128,50);
  c.fillStyle='#FFB703';c.fillText('Δf '+dF.toFixed(3)+' Hz',128,86);
  c.font='12px monospace';c.fillStyle='#8FB3AC';c.fillText('tensión · deslizamiento de frecuencia',128,110);
  panelD.tx.needsUpdate=true;}
function drawMeter3D(){const c=meter.cv.getContext('2d');
  const r=evaluar(Vgen,dF,seq,theta);
  c.fillStyle='#04120e';c.fillRect(0,0,256,128);
  c.font='bold 22px monospace';c.fillStyle='#EAF4F1';c.textAlign='center';
  c.fillText('θ '+r.th.toFixed(1)+'°',128,42);
  c.fillStyle=r.allOk?'#7bdc9a':'#e05555';c.font='bold 18px monospace';
  c.fillText(r.allOk?'LISTO':'NO LISTO',128,78);
  c.font='12px monospace';c.fillStyle='#8FB3AC';
  c.fillText('ángulo de fase · veredicto de cierre',128,108);
  meter.tx.needsUpdate=true;}
function refreshBenchDyn(){
  drawPanelD();drawMeter3D();
  brkArm.rotation.y=(lastAttempt&&lastAttempt.allOk&&(clockT-lastAttempt.tAtClose)<1.2)?Math.PI*0.4:0;
}

/* ---------- 6 · HUD + panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Transformadores y máquinas eléctricas (D5)</div>
  <h2>Sincronización de un alternador a la red</h2>
  <p>Antes de conectar un generador síncrono (alternador) a una red ya energizada deben igualarse
  cuatro condiciones simultáneamente: <b>tensión</b>, <b>frecuencia</b>, <b>secuencia de fases</b> y
  <b>ángulo de fase</b>. Cerrar el interruptor fuera de tolerancia produce un golpe de par (y de
  corriente) sobre el eje y los devanados — en el caso extremo de secuencia invertida, el cierre
  conecta las fases en el orden equivocado sin importar qué tan bien coincidan la tensión o la
  frecuencia.</p>
  <div class="formula">θ(t) = θ₀ + 360·Δf·t (mod 360°, envuelto a ±180°)<br>
  cierre válido ⟺ |ΔV|≤${VTOL}% · |Δf|≤${FTOL} Hz · secuencia correcta · |θ|≤${ANGTOL}° ⚑</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Aguja del sincronoscopio: fase entre alternador y red (una sola pareja de fases)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Lámparas de sincronismo: las tres se apagan juntas SOLO si la secuencia es correcta</div>
    <div class="li"><span class="dot" style="background:#e05555"></span>Secuencia invertida: el sincronoscopio NO puede detectarla — solo observa una pareja de fases</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> las 4 condiciones clásicas de sincronización (tensión, frecuencia,
  secuencia, ángulo) y sus tolerancias de operación práctica ⚑ · la deriva angular θ(t) integrada en
  tiempo real a partir de Δf · la limitación estructural real de un sincronoscopio de una sola
  pareja de fases: es ciego a la secuencia de fases invertida · el patrón de lámparas "apagadas
  juntas" (secuencia correcta) frente a "rotación" (secuencia invertida), calculado por diferencia
  fasor a fasor.<br>
  <span class="no">NO:</span> el "factor de choque" 2·sin(|θ|/2) es una magnitud ILUSTRATIVA de la
  severidad relativa del golpe de par, no una corriente ni un par real en amperios o N·m · IEC 60034
  ⚑ normaliza el DESEMPEÑO y la construcción de máquinas rotativas, no el PROCEDIMIENTO de
  sincronización en sí (cita curricular de la lista maestra, no norma de procedimiento) · dinámica
  del regulador de velocidad/excitación durante el ajuste, transitorios electromecánicos reales del
  cierre, ni el relé de verificación de sincronismo (25) de una subestación real.</div>
  <div class="src">Ref: IEEE C50.12 / C50.13 ⚑ (límites prácticos de sincronización) · IEC 60034 ⚑
  (alcance: máquinas rotativas, no procedimiento) · Fitzgerald, Kingsley &amp; Umans — Electric
  Machinery (método de lámparas y sincronoscopio)</div>`;
document.getElementById('panel').innerHTML=`
  <h4>Sincronización · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_comparar">📈 Comparar</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>
  <div style="font-size:12px;margin:6px 0 2px">Secuencia de fases</div>
  <div class="modebar" style="margin-bottom:8px">
    <button class="b on" id="mm_correcta">1-2-3 correcta</button>
    <button class="b" id="mm_invertida">1-3-2 invertida</button>
  </div>
  <div style="font-size:12px;margin:6px 0 2px">Vgen (V) · <b id="vv" class="mono">100.0 V</b></div>
  <input type="range" id="sVgen" min="85" max="115" step="0.5" value="100" style="width:100%;accent-color:#4FD1C5">
  <div style="font-size:12px;margin:6px 0 2px">Δf (Hz) · <b id="fv" class="mono">0.150 Hz</b></div>
  <input type="range" id="sDF" min="-1" max="1" step="0.01" value="0.15" style="width:100%;accent-color:#FFB703">
  <div id="tele">
    <div class="g"><div class="l">ΔV</div><b id="t_v">—</b></div>
    <div class="g"><div class="l">Δf</div><b id="t_f">—</b></div>
    <div class="g"><div class="l">Secuencia</div><b id="t_seq">—</b></div>
    <div class="g"><div class="l">θ</div><b id="t_ang">—</b></div>
    <div class="g"><div class="l">Veredicto</div><b id="t_veredicto">—</b></div>
  </div>
  <div class="console" id="report"></div>
  <div id="closeBox">
    <button class="b primary" id="btnCerrar" style="width:100%">⚡ Cerrar interruptor</button>
  </div>
  <div id="retoBox" style="display:none">
    <h4 class="sec">Tu decisión</h4>
    <div style="font-size:12px;color:#8FB3AC;margin-bottom:6px">Con las lecturas del panel, ¿cierras el interruptor? Si no, ¿cuál de las 4 condiciones falla?</div>
    <div class="btns" id="retoBtns">
      <button class="b" data-v="ok">✔ CERRAR (todo OK)</button>
      <button class="b" data-v="voltaje">✘ NO — tensión</button>
      <button class="b" data-v="frecuencia">✘ NO — frecuencia</button>
      <button class="b" data-v="secuencia">✘ NO — secuencia</button>
      <button class="b" data-v="angulo">✘ NO — ángulo</button>
    </div>
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
function showToast(msg){const t=el('toast');t.textContent=msg;t.innerHTML=msg;t.classList.add('on');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),5200);}

/* ---------- 8 · Modos ---------- */
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.2,2.2,7.2],[0.5,1.2,0.0]],
    mision:'Mueve Vgen y Δf, cambia la secuencia, y observa la aguja del sincronoscopio y las lámparas. Intenta cerrar el interruptor (⚡) en distintos momentos.'},
  comparar:{nombre:'Comparar secuencias',cam:[[-0.1,2.0,3.9],[-0.9,1.7,-0.8]],
    mision:'Con secuencia correcta, las 3 lámparas se apagan juntas. Cambia a secuencia invertida: el sincronoscopio sigue viéndose "normal" — pero las lámparas rotan.'},
  reto:{nombre:'Reto',cam:[[0.5,2.1,5.4],[0.1,1.2,0.1]],
    mision:'Lee las 4 condiciones en el panel y decide: ¿cierras, o hay una razón para NO hacerlo?'},
};
function syncControlsEnabled(){
  const locked=(mode==='reto');
  el('sVgen').disabled=locked;el('sDF').disabled=locked;
  el('mm_correcta').disabled=locked;el('mm_invertida').disabled=locked;
}
function setMode(k){
  mode=k;
  ['explora','comparar','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('p_mision').textContent=MODE_META[k].mision;
  el('closeBox').style.display=(k==='reto')?'none':'block';
  el('retoBox').style.display=(k==='reto')?'block':'none';
  if(k==='reto'){
    if(!MYST)genMystery();
    Vgen=MYST.Vgen;dF=MYST.dF;seq=MYST.seq;theta=MYST.theta;
    el('sVgen').value=Vgen;el('vv').textContent=Vgen.toFixed(1)+' V';
    el('sDF').value=dF;el('fv').textContent=dF.toFixed(3)+' Hz';
    ['correcta','invertida'].forEach(s=>el('mm_'+s).classList.toggle('on',s===seq));
  }
  syncControlsEnabled();
  clearDx();refreshQuestion();refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}
function setSeq(s){
  if(mode==='reto')return;
  seq=s;
  ['correcta','invertida'].forEach(ss=>el('mm_'+ss).classList.toggle('on',ss===s));
  refreshAll();
}

/* ---------- 9 · Telemetría + reporte ---------- */
function set(id,txt,cls){const n=el(id);n.textContent=txt;
  n.classList.remove('good','warn','bad');if(cls)n.classList.add(cls);}
function updateTele(){
  const r=evaluar(Vgen,dF,seq,theta);
  set('t_v',(r.dV>=0?'+':'')+r.dV.toFixed(1)+' %',r.condV?'good':'bad');
  set('t_f',(dF>=0?'+':'')+dF.toFixed(3)+' Hz',r.condF?'good':'bad');
  set('t_seq',seq==='correcta'?'correcta':'INVERTIDA',r.condSeq?'good':'bad');
  set('t_ang',r.th.toFixed(1)+' °',r.condAng?'good':'bad');
  set('t_veredicto',r.allOk?'✔ LISTO PARA CERRAR':'✘ NO CERRAR',r.allOk?'good':'bad');
}
function updateReport(){
  const rep=el('report');const L=[];
  const r=evaluar(Vgen,dF,seq,theta);
  if(mode==='explora'){
    L.push('ΔV = Vgen−100 = '+r.dV.toFixed(1)+' % → '+(r.condV?'dentro':'fuera')+' de ±'+VTOL+'%.');
    L.push('θ(t) avanza 360·Δf por segundo = '+(360*dF).toFixed(1)+' °/s.');
    L.push('Toca el interruptor o pulsa ⚡ para intentar el cierre.');
  }else if(mode==='comparar'){
    L.push('Con secuencia correcta, las 3 diferencias fasoriales (lámparas) se anulan simultáneamente en θ=0.');
    L.push('Con secuencia invertida, solo UNA lámpara se apaga en θ=0 — las otras dos NO, y el patrón rota con el tiempo en vez de parpadear en bloque.');
    L.push('El sincronoscopio (que solo observa una pareja de fases) no distingue estos dos casos: por eso la secuencia se verifica aparte, con las lámparas o un indicador dedicado.');
  }else{
    L.push('Condiciones: ΔV='+r.dV.toFixed(1)+'% · Δf='+dF.toFixed(3)+' Hz · secuencia '+(seq==='correcta'?'correcta':'invertida')+' · θ='+r.th.toFixed(1)+'°.');
    if(retoSolved)L.push('✔ Decisión registrada.');
  }
  rep.innerHTML=L.map(s=>'<div>'+s+'</div>').join('');
}
function refreshAll(){
  drawBoard();updateTele();updateReport();refreshBenchDyn();
}

/* ---------- 10 · Reto: decisión categórica GO/NO-GO ---------- */
function checkReto(guess){
  if(!MYST)return;
  const real=realKindOf(MYST);
  const r=evaluar(MYST.Vgen,MYST.dF,MYST.seq,MYST.theta);
  const ok=guess===real;
  retoSolved=ok;if(ok)solved=true;
  lastAttempt={...r,tAtClose:clockT};
  document.querySelectorAll('#retoBtns [data-v]').forEach(b=>{
    b.classList.remove('right','wrong');
    if(b.dataset.v===real)b.classList.add('right');
    else if(b.dataset.v===guess)b.classList.add('wrong');
  });
  if(ok){
    showToast('<span style="color:var(--good)">✔ Correcto: '+kindLabel(real)+'. ΔV='+r.dV.toFixed(1)+'% · Δf='+MYST.dF.toFixed(3)+' Hz · secuencia '+(MYST.seq==='correcta'?'correcta':'invertida')+' · θ='+r.th.toFixed(1)+'°.</span>');
    synth.beep(1046,.12,.06);
  }else{
    showToast('<span style="color:var(--bad)">✘ No es correcto. Revisa las 4 lecturas del panel.</span>');
    synth.beep(180,.14,.06);
  }
  refreshAll();
}
function newMystery(){
  genMystery();
  document.querySelectorAll('#retoBtns [data-v]').forEach(b=>b.classList.remove('right','wrong'));
  buildQuiz();
  setMode('reto');
  showToast('Nuevo caso misterioso servido.');
}

/* ---------- 11 · Quiz de ingeniería ---------- */
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
  QUIZ.explora={pregunta:'¿Qué mide exactamente la aguja de un sincronoscopio de una sola lámpara/aguja?',
    opciones:shuffle([
      {t:'El ángulo de fase relativo entre el alternador y la red, medido sobre UNA sola pareja de fases',ok:true,
       why:'Correcto: un sincronoscopio clásico está cableado a una sola pareja de fases — por diseño, no puede informar nada sobre las otras dos.'},
      {t:'La diferencia de secuencia de fases entre el alternador y la red',ok:false,
       why:'No — la secuencia de fases es estructuralmente invisible para un sincronoscopio de una lámpara/aguja: necesitas las 3 lámparas o un indicador dedicado para eso.'},
      {t:'La corriente de cortocircuito que circularía si el interruptor se cerrara fuera de tolerancia',ok:false,
       why:'El sincronoscopio no mide corriente — solo el ángulo relativo de fase de la pareja a la que está conectado.'},
      {t:'La potencia reactiva que entregará el alternador tras sincronizar',ok:false,
       why:'Eso se ajusta DESPUÉS de sincronizar, con la excitación del campo — no es lo que indica la aguja durante el proceso de sincronización.'}])};
  QUIZ.comparar={pregunta:'¿Por qué el método de las 3 lámparas SÍ revela una secuencia de fases invertida, y el sincronoscopio NO?',
    opciones:shuffle([
      {t:'Porque las 3 lámparas comparan las 3 parejas de fases simultáneamente; con secuencia invertida no pueden apagarse las 3 a la vez, mientras que el sincronoscopio solo vigila una pareja',ok:true,
       why:'Correcto: con secuencia correcta las 3 diferencias fasoriales se anulan juntas en θ=0; con secuencia invertida, cuando una se anula las otras dos NO — y el patrón de brillo rota en el tiempo.'},
      {t:'Porque las lámparas son más sensibles eléctricamente que la bobina del sincronoscopio',ok:false,
       why:'No es un tema de sensibilidad sino de CUÁNTAS parejas de fases observa cada instrumento: 1 (sincronoscopio) vs. 3 (lámparas).'},
      {t:'Porque las lámparas miden frecuencia y el sincronoscopio mide tensión',ok:false,
       why:'Ambos instrumentos responden, en el fondo, a la diferencia FASORIAL entre generador y red — ninguno mide frecuencia o tensión de forma aislada.'},
      {t:'No hay diferencia real: ambos métodos detectan la secuencia invertida igual de bien',ok:false,
       why:'Sí hay diferencia — es precisamente la limitación estructural del sincronoscopio de una sola pareja de fases lo que motiva verificar la secuencia con un método aparte (lámparas o indicador dedicado) antes de confiar en la aguja.'}])};
  QUIZ.reto={pregunta:'Si el sincronoscopio muestra la aguja detenida en SYNC (θ≈0°) pero la secuencia de fases está invertida, ¿es seguro cerrar el interruptor?',
    opciones:shuffle([
      {t:'No — la secuencia invertida es una condición independiente del ángulo; cerrar conecta las fases en el orden equivocado sin importar qué tan cerca esté la aguja de SYNC',ok:true,
       why:'Correcto: las 4 condiciones (tensión, frecuencia, secuencia, ángulo) deben cumplirse TODAS. La aguja en SYNC solo confirma el ángulo de una pareja de fases — nada dice sobre la secuencia.'},
      {t:'Sí — si la aguja está en SYNC, las 4 condiciones de sincronización están garantizadas',ok:false,
       why:'Falso: es exactamente la trampa de este laboratorio. El sincronoscopio es ciego a la secuencia de fases por diseño.'},
      {t:'Sí, siempre que la tensión también coincida',ok:false,
       why:'La tensión y el ángulo son solo 2 de las 4 condiciones — la secuencia sigue siendo independiente y debe verificarse aparte.'},
      {t:'Depende de la potencia nominal del alternador',ok:false,
       why:'La potencia nominal de la máquina no cambia el hecho físico de que conectar fases en el orden equivocado produce un cortocircuito/golpe severo — es un tema de las 4 condiciones, no de tamaño de máquina.'}])};
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
  const r=evaluar(Vgen,dF,seq,theta);
  if(act==='alt3d')showToast('Alternador — Vgen='+Vgen.toFixed(1)+' V, gira a una frecuencia que difiere de la red en Δf='+dF.toFixed(3)+' Hz.');
  else if(act==='brk3d'){if(mode==='reto')showToast('En el reto, decide con los botones del panel.');else attemptClose();}
  else if(act==='bus3d')showToast('Barra de red — referencia fija: 100 V, 60.00 Hz, secuencia 1-2-3.');
  else if(act==='panelD')showToast('Panel: Vgen='+Vgen.toFixed(1)+' V · Δf='+dF.toFixed(3)+' Hz.');
  else if(act==='meter3d')showToast('Medidor: θ='+r.th.toFixed(1)+'° · veredicto: '+(r.allOk?'LISTO':'NO LISTO')+'.');
});
(function(){ // hover con etiquetas
  const ray=new THREE.Raycaster(),p=new THREE.Vector2(),dom=S.renderer.domElement;
  dom.addEventListener('pointermove',e=>{
    const rc=dom.getBoundingClientRect();
    p.x=((e.clientX-rc.left)/rc.width)*2-1;p.y=-((e.clientY-rc.top)/rc.height)*2+1;
    ray.setFromCamera(p,S.camera);
    const hits=ray.intersectObjects(S.scene.children,true);
    let tt=null;
    for(const h of hits){let o=h.object;
      while(o){if(o.userData&&o.userData.title){tt=o.userData.title;break;}o=o.parent;}
      if(tt)break;}
    dom.style.cursor=tt?'pointer':'default';dom.title=tt||'';
  });
})();
const sleep=ms=>new Promise(res=>setTimeout(res,ms));
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const b=el('btnAuto');b.disabled=true;b.textContent='✨ Recorriendo…';
  try{
    synth.init();synth.resume();
    setMode('explora');
    seq='correcta';['correcta','invertida'].forEach(s=>el('mm_'+s).classList.toggle('on',s==='correcta'));
    Vgen=100;el('sVgen').value=100;el('vv').textContent='100.0 V';
    dF=0.15;el('sDF').value=0.15;el('fv').textContent='0.150 Hz';
    theta=0;refreshAll();
    showToast('1/6 · La aguja del sincronoscopio deriva porque Δf≠0: θ avanza 360·Δf grados por segundo.');
    await sleep(2600);
    seq='invertida';['correcta','invertida'].forEach(s=>el('mm_'+s).classList.toggle('on',s==='invertida'));
    theta=0;dF=0;el('sDF').value=0;el('fv').textContent='0.000 Hz';refreshAll();
    showToast('2/6 · Secuencia invertida con θ≈0°: la aguja se ve "en SYNC" — pero mira las lámparas: NO se apagan juntas.');
    await sleep(3200);
    seq='correcta';['correcta','invertida'].forEach(s=>el('mm_'+s).classList.toggle('on',s==='correcta'));
    Vgen=112;el('sVgen').value=112;el('vv').textContent='112.0 V';refreshAll();
    showToast('3/6 · Intento de cierre con ΔV fuera de tolerancia (+12%)…');
    await sleep(1600);
    attemptClose();
    await sleep(2600);
    Vgen=100;el('sVgen').value=100;el('vv').textContent='100.0 V';
    dF=0;theta=0;refreshAll();
    showToast('4/6 · Ahora con las 4 condiciones dentro de tolerancia: cierre exitoso.');
    await sleep(1600);
    attemptClose();
    await sleep(2400);
    setMode('comparar');
    seq='invertida';['correcta','invertida'].forEach(s=>el('mm_'+s).classList.toggle('on',s==='invertida'));
    refreshAll();
    showToast('5/6 · Modo Comparar: el indicador dedicado de secuencia SÍ distingue 1-2-3 de 1-3-2 — el sincronoscopio, no.');
    await sleep(3000);
    newMystery();
    showToast('6/6 · Recorrido completo: te dejo un caso misterioso nuevo sin resolver en modo Reto.');
  }finally{autoRunning=false;b.disabled=false;b.textContent='✨ Recorrido guiado';}
}
S.setAnimate((dt,t)=>{
  clockT=t;
  if(mode!=='reto'&&dF!==0){theta=wrapAngle(theta+360*dF*dt);}
  if(mode!=='reto'){
    drawBoard();
    teleAcc+=dt;
    if(teleAcc>0.1){teleAcc=0;updateTele();updateReport();refreshBenchDyn();}
  }
  altShaft.rotation.x+=dt*(0.6+0.4*(Vgen/100));
});
/* wiring */
['explora','comparar','reto'].forEach(m=>el('m_'+m).onclick=()=>setMode(m));
['correcta','invertida'].forEach(s=>el('mm_'+s).onclick=()=>setSeq(s));
el('sVgen').addEventListener('input',()=>{Vgen=parseFloat(el('sVgen').value);
  el('vv').textContent=Vgen.toFixed(1)+' V';refreshAll();});
el('sDF').addEventListener('input',()=>{dF=parseFloat(el('sDF').value);
  el('fv').textContent=dF.toFixed(3)+' Hz';refreshAll();});
el('btnCerrar').onclick=attemptClose;
document.querySelectorAll('#retoBtns [data-v]').forEach(b=>{ b.onclick=()=>checkReto(b.dataset.v); });
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newMystery;
/* init */
genMystery();buildQuiz();
S.start();setMode('explora');
window.__labDebug={
  state:()=>({mode,Vgen,dF,seq,theta:wrapAngle(theta),retoSolved,solved}),
  evaluar:()=>evaluar(Vgen,dF,seq,theta),
  lamps:()=>lampVoltages(Vgen,theta,seq),
  mystery:()=>MYST?{...MYST}:null,
  realKindOf,
  setVgen:v=>{Vgen=v;el('sVgen').value=v;el('vv').textContent=Vgen.toFixed(1)+' V';refreshAll();},
  setDF:v=>{dF=v;el('sDF').value=v;el('fv').textContent=dF.toFixed(3)+' Hz';refreshAll();},
  setSeq,
  setTheta:v=>{theta=v;refreshAll();},
  cerrar:attemptClose,
  checkReto,newMystery,boardClick,
  mode:()=>mode,setMode,
};
