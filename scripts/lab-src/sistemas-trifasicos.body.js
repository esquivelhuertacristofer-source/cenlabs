// Sistemas trifásicos balanceados Y/Δ y verificación de secuencia de fases.
// Física (carga balanceada de 3 impedancias iguales Z=|Z|∠φ, fuente trifásica de tensión de línea VL):
//   Estrella (Y): V_fase_carga = VL/√3 ; I_línea = I_fase = (VL/√3)/|Z| ; P = √3·VL·I_L·cosφ = VL²cosφ/|Z|
//   Delta  (Δ): V_fase_carga = VL      ; I_fase = VL/|Z| ; I_línea = √3·I_fase ; P = √3·VL·I_L·cosφ = 3·VL²cosφ/|Z|
//   => misma Z y misma VL, Δ entrega EXACTAMENTE 3× la potencia de Y (verificado node -e, ratio=3 exacto).
//   Q = √3·VL·I_L·senφ ; S = √3·VL·I_L ; FP = cosφ. Balanceado ⇒ corriente de neutro = 0.
//   Secuencia ABC (positiva) vs ACB (negativa): invertir la secuencia (o permutar 2 líneas) invierte
//   el sentido de giro del campo/motor. No altera magnitudes en régimen balanceado (P/Q/S iguales).
// Catálogo del Reto verificado numéricamente (node -e): VL∈{220,440} V, |Z|∈{6,8,10,12,15,20} Ω,
//   φ∈{0°,30°}; el objetivo P_target se toma de una celda real (conexión×|Z|) y con tolerancia ±8%
//   CADA escenario tiene EXACTAMENTE 1 par (conexión,|Z|) que lo alcanza (min=max=1): problema bien
//   planteado, sin ambigüedad y sin escenarios sin solución. La secuencia requerida es un segundo
//   objetivo independiente (no afecta P en balanceado). Ref: NOM-001-SEDE-2022, IEC 60038, IEEE.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.4,2.4,6.8],target:[0.3,1.1,0.0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});
const el=id=>document.getElementById(id);
const R3=Math.sqrt(3);

// ===================== 2. FÍSICA =====================
const VL_CANDS=[220,440];
const Z_CANDS=[6,8,10,12,15,20];
const PHI_CANDS=[0,30];      // grados: cosφ = 1.000 (resistiva) / 0.866 (inductiva)
const CONNS=['Y','D'];
const SEQS=['ABC','ACB'];
const P_TOL_FRAC=0.08;

function tp(VL,Z,phiDeg,conn){
  const ph=phiDeg*Math.PI/180,c=Math.cos(ph),s=Math.sin(ph);
  const VFsource=VL/R3;                       // tensión de fase de la fuente (siempre VL/√3)
  const VFload=conn==='Y'?VL/R3:VL;           // tensión sobre cada impedancia
  const IF=VFload/Z;                          // corriente de fase (por rama de Z)
  const IL=conn==='Y'?IF:R3*IF;               // corriente de línea
  const P=R3*VL*IL*c;                         // = 3·VFload·IF·c
  const Q=R3*VL*IL*s;
  const Sap=R3*VL*IL;
  return {VL,VFsource,VFload,IF,IL,P,Q,Sap,FP:c,phiDeg,conn,Z};
}
function pickFrom(arr,exclude){if(arr.length<=1)return arr[0];let v=arr[Math.floor(Math.random()*arr.length)];while(v===exclude)v=arr[Math.floor(Math.random()*arr.length)];return v;}
function seqLabel(sq){return sq==='ABC'?'ABC (positiva)':'ACB (negativa)';}
function rotOf(sq){return sq==='ABC'?'CW':'CCW';}          // convención del simulador
function rotLabel(sq){return sq==='ABC'?'horario ↻':'antihorario ↺';}
function fmtV(v){return (Math.round(v*10)/10).toFixed(1)+' V';}
function fmtA(v){return (Math.round(v*100)/100).toFixed(2)+' A';}
function fmtkW(w){return (Math.round(w/10)/100).toFixed(2)+' kW';}
function fmtkVAR(w){return (Math.round(w/10)/100).toFixed(2)+' kVAR';}
function fmtkVA(w){return (Math.round(w/10)/100).toFixed(2)+' kVA';}

// ===================== 3. ESTADO =====================
let mode='explora';
// Explora — control total
let expVL=220,expZ=10,expPhi=30,expConn='Y',expSeq='ABC';
// Diseña — escenario fijo, práctica sin calificar
let disVL=220,disPhi=30,disPtarget=0,disReqSeq='ABC',disConn='Y',disZ=Z_CANDS[0],disSeq='ABC';
// Reto — sorteado, calificado
let retoVL=220,retoPhi=30,retoPtarget=0,retoReqSeq='ABC',retoConn='Y',retoZ=Z_CANDS[0],retoSeq='ABC';
let retoSolConn='Y',retoSolZ=10;
let retoChecked=false,retoOk=false,retoMsg='';
let solved=false,autoRunning=false;
let QUIZ={};

function seedDisena(){
  disVL=pickFrom(VL_CANDS);disPhi=pickFrom(PHI_CANDS);
  const cc=pickFrom(CONNS),zz=pickFrom(Z_CANDS);
  disPtarget=tp(disVL,zz,disPhi,cc).P;
  disReqSeq=pickFrom(SEQS);
  disConn='Y';disZ=Z_CANDS[0];disSeq='ABC';
}
function seedReto(){
  retoVL=pickFrom(VL_CANDS);retoPhi=pickFrom(PHI_CANDS);
  retoSolConn=pickFrom(CONNS);retoSolZ=pickFrom(Z_CANDS);
  retoPtarget=tp(retoVL,retoSolZ,retoPhi,retoSolConn).P;
  retoReqSeq=pickFrom(SEQS);
  retoConn='Y';retoZ=Z_CANDS[0];retoSeq='ABC';
  retoChecked=false;retoOk=false;retoMsg='';
}
seedDisena();seedReto();

function curVL(){return mode==='explora'?expVL:(mode==='disena'?disVL:retoVL);}
function curPhi(){return mode==='explora'?expPhi:(mode==='disena'?disPhi:retoPhi);}
function curConn(){return mode==='explora'?expConn:(mode==='disena'?disConn:retoConn);}
function curZ(){return mode==='explora'?expZ:(mode==='disena'?disZ:retoZ);}
function curSeq(){return mode==='explora'?expSeq:(mode==='disena'?disSeq:retoSeq);}
function curState(){return tp(curVL(),curZ(),curPhi(),curConn());}
function curTarget(){return mode==='disena'?disPtarget:(mode==='reto'?retoPtarget:0);}
function curReqSeq(){return mode==='disena'?disReqSeq:(mode==='reto'?retoReqSeq:null);}

// ===================== 4. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
function plas(base){return std(base,0.35,0.08);}
const MAT={bench:brush(0x2a3532),frame:brush(0x1f2b28),leg:brush(0x141c1a),src:brush(0x243430)};
const PH_COL=[0xff6b6b,0x7CD992,0x5b8dff];      // A rojo, B verde, C azul
const PH_HEX=['#ff6b6b','#7CD992','#5b8dff'];

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const cv=document.createElement('canvas');cv.width=256;cv.height=64;
  const cx=cv.getContext('2d');
  cx.fillStyle='rgba(6,14,12,0.88)';cx.fillRect(0,0,256,64);
  cx.strokeStyle=color;cx.lineWidth=2;cx.strokeRect(1,1,254,62);
  cx.fillStyle='#EAF4F1';cx.font='bold 20px Outfit, sans-serif';cx.textAlign='center';cx.textBaseline='middle';
  cx.fillText(text,128,32);
  const tex=new THREE.CanvasTexture(cv);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
  spr.position.copy(pos);spr.scale.set(scale||1.1,(scale||1.1)*0.28,1);spr.visible=false;spr.renderOrder=999;
  scene.add(spr);
  HOVER_LABELS.set(obj,spr);
  return spr;
}

// ===================== 5. PIZARRÓN (FASORES) =====================
const boardG=new THREE.Group();
boardG.position.set(-1.15,0,-0.9);boardG.rotation.y=0.18;
scene.add(boardG);
const frame=roundedBox(3.72,2.80,0.12,MAT.frame,0.06);
frame.position.set(0,1.85,0);
boardG.add(frame);
[-1.55,1.55].forEach(x=>{
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.85,16),MAT.leg);
  leg.position.set(x,0.9,0);boardG.add(leg);
});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2.58),new THREE.MeshBasicMaterial({map:bTex}));
board.position.set(0,1.85,0.065);
boardG.add(board);
frame.userData={title:'Pizarrón de fasores',info:'Diagrama fasorial trifásico · estrella de tensiones de fase + triángulo de tensiones de línea (VL=√3·VF) · toca para inspeccionar'};
addHoverLabel(frame,'Diagrama fasorial trifásico','#4FD1C5',new THREE.Vector3(0,3.38,0.1).add(boardG.position),1.7);

function seqAngles(seq){return seq==='ABC'?{A:90,B:-30,C:210}:{A:90,B:210,C:-30};}
function arrow(c,x0,y0,x1,y1,color,w){
  c.strokeStyle=color;c.lineWidth=w||3;
  c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();
  const ang=Math.atan2(y1-y0,x1-x0),s=11;
  c.fillStyle=color;c.save();c.translate(x1,y1);c.rotate(ang);
  c.beginPath();c.moveTo(0,0);c.lineTo(-s,s*0.5);c.lineTo(-s,-s*0.5);c.closePath();c.fill();c.restore();
}
function polar(cx,cy,R,angDeg){const r=angDeg*Math.PI/180;return [cx+R*Math.cos(r),cy-R*Math.sin(r)];}

function drawFasores(c,st){
  const seq=curSeq();
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('DIAGRAMA FASORIAL TRIFÁSICO — CONEXIÓN '+(st.conn==='Y'?'ESTRELLA (Y)':'DELTA (Δ)'),30,44);
  c.fillStyle='#5a6b66';c.font='13px Outfit, sans-serif';
  c.fillText('VL='+st.VL+' V · VF(fuente)='+fmtV(st.VFsource)+' · VL/VF=√3='+(st.VL/st.VFsource).toFixed(3)+' · |Z|='+st.Z+' Ω · φ='+st.phiDeg+'° · sec. '+seqLabel(seq),30,70);

  // --- Estrella de tensiones de fase + triángulo de línea (izquierda) ---
  const cx=310,cy=430,R=185;
  c.strokeStyle='rgba(79,209,197,0.14)';c.lineWidth=1;
  [0.5,1.0].forEach(f=>{c.beginPath();c.arc(cx,cy,R*f,0,Math.PI*2);c.stroke();});
  c.strokeStyle='rgba(79,209,197,0.30)';c.lineWidth=1.2;
  c.beginPath();c.moveTo(cx-R-14,cy);c.lineTo(cx+R+14,cy);c.moveTo(cx,cy-R-14);c.lineTo(cx,cy+R+14);c.stroke();
  const ang=seqAngles(seq);
  const tip={};
  ['A','B','C'].forEach((ph,i)=>{const [x,y]=polar(cx,cy,R,ang[ph]);tip[ph]=[x,y];});
  // triángulo de tensiones de línea (une las puntas de las fases): lado = √3·VF = VL
  c.strokeStyle='rgba(255,209,102,0.85)';c.lineWidth=2;c.setLineDash([7,5]);
  c.beginPath();c.moveTo(tip.A[0],tip.A[1]);c.lineTo(tip.B[0],tip.B[1]);c.lineTo(tip.C[0],tip.C[1]);c.closePath();c.stroke();
  c.setLineDash([]);
  // etiqueta VL sobre el lado A-B
  const mabx=(tip.A[0]+tip.B[0])/2,maby=(tip.A[1]+tip.B[1])/2;
  c.fillStyle='#FFD166';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';
  c.fillText('VL=√3·VF',mabx+34,maby-6);
  // fasores de fase
  ['A','B','C'].forEach((ph,i)=>{
    arrow(c,cx,cy,tip[ph][0],tip[ph][1],PH_HEX[i],3);
    c.fillStyle=PH_HEX[i];c.font='bold 15px Outfit, sans-serif';c.textAlign='center';
    const [lx,ly]=polar(cx,cy,R+24,ang[ph]);
    c.fillText('V'+ph+'N',lx,ly+5);
  });
  // flecha curva de secuencia
  c.strokeStyle='rgba(234,244,241,0.55)';c.lineWidth=2;
  const dir=seq==='ABC'?1:-1;
  c.beginPath();c.arc(cx,cy,R*0.32,0,dir*Math.PI*1.35,dir<0);c.stroke();
  const [ax,ay]=polar(cx,cy,R*0.32,dir>0?100:80);
  c.fillStyle='rgba(234,244,241,0.85)';c.font='11px Outfit, sans-serif';c.textAlign='center';
  c.fillText('A→B→C',cx,cy+R*0.32+22);

  // --- Panel derecho: relaciones Y/Δ + corrientes + secuencia ---
  const px=590,py=150,pw=404;
  c.fillStyle='rgba(79,209,197,0.06)';c.fillRect(px,py,pw,470);
  c.strokeStyle='rgba(79,209,197,0.25)';c.lineWidth=1;c.strokeRect(px,py,pw,470);
  c.fillStyle='#8FB3AC';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText('MAGNITUDES POR CONEXIÓN',px+18,py+30);
  const rows=[
    ['V de fase sobre Z (VF)',fmtV(st.VFload),st.conn==='Y'?'= VL/√3':'= VL'],
    ['Corriente de fase (IF)',fmtA(st.IF),'VF/|Z|'],
    ['Corriente de línea (IL)',fmtA(st.IL),st.conn==='Y'?'= IF':'= √3·IF'],
    ['Potencia activa P',fmtkW(st.P),'√3·VL·IL·cosφ'],
    ['Reactiva Q / Aparente S',fmtkVAR(st.Q)+' / '+fmtkVA(st.Sap),'FP='+st.FP.toFixed(3)],
    ['Corriente de neutro (In)',st.conn==='Y'?'0.00 A (balanceado)':'— (sin neutro)','ΣI=0'],
  ];
  c.font='13px Outfit, sans-serif';
  rows.forEach((r,i)=>{
    const yy=py+62+i*40;
    c.fillStyle='#9fb0ab';c.textAlign='left';c.fillText(r[0],px+18,yy);
    c.fillStyle='#EAF4F1';c.font='bold 14px Outfit, sans-serif';c.fillText(r[1],px+18,yy+18);
    c.fillStyle='#5a6b66';c.font='12px Outfit, sans-serif';c.textAlign='right';c.fillText(r[2],px+pw-14,yy+18);
    c.font='13px Outfit, sans-serif';c.textAlign='left';
    if(i<rows.length-1){c.strokeStyle='rgba(79,209,197,0.10)';c.beginPath();c.moveTo(px+14,yy+28);c.lineTo(px+pw-14,yy+28);c.stroke();}
  });

  // pie: secuencia → giro
  c.fillStyle=seq==='ABC'?'#7CD992':'#FFD166';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Secuencia '+seqLabel(seq)+'  →  motor gira '+rotLabel(seq),30,714);
  c.fillStyle='#5a6b66';c.font='12px Outfit, sans-serif';
  c.fillText('Permutar dos líneas (o invertir la secuencia) invierte el sentido de giro; las magnitudes no cambian en régimen balanceado.',30,740);
}

function drawBoard(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.05)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  drawFasores(c,curState());
  bTex.needsUpdate=true;
}
function boardClick(){
  showToast('📐 Izquierda: estrella de las 3 tensiones de fase (VAN, VBN, VCN a 120°). El triángulo punteado dorado une sus puntas: cada lado es una tensión de LÍNEA, de magnitud √3·VF. Derecha: cómo cambian IF, IL y P según Y o Δ. Abajo: la secuencia (ABC/ACB) fija el sentido de giro del motor.');
}

// ===================== 6. ESCENA 3D: FUENTE, CARGA, MOTOR =====================
const bench=roundedBox(3.0,0.5,1.7,MAT.bench,0.05);
bench.position.set(1.85,0.25,0.9);
scene.add(bench);
bench.userData={title:'Banco trifásico',info:'Fuente trifásica + carga balanceada de 3 impedancias + motor de inducción'};

// Fuente trifásica (izquierda del banco)
const srcBox=roundedBox(0.55,0.9,0.7,MAT.src,0.05);
srcBox.position.set(0.75,0.95,0.9);
scene.add(srcBox);
srcBox.userData={title:'Fuente trifásica',info:'Suministra tensión de línea VL con 3 fases a 120° · VF(fuente)=VL/√3'};
addHoverLabel(srcBox,'Fuente trifásica','#4FD1C5',new THREE.Vector3(0.75,1.55,0.9),1.1);

// 3 módulos de impedancia (carga) en triángulo alrededor de un nodo neutro
const NODE=new THREE.Vector3(2.05,0.72,0.9);
const zPos=[
  new THREE.Vector3(2.05,0.72,0.30),
  new THREE.Vector3(2.55,0.72,1.20),
  new THREE.Vector3(1.55,0.72,1.20),
];
const zMods=[];
zPos.forEach((p,i)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.30,0.30),new THREE.MeshStandardMaterial({color:0x33413c,roughness:0.4,metalness:0.35,emissive:0x000000,emissiveIntensity:0}));
  m.position.copy(p);m.castShadow=m.receiveShadow=true;
  m.userData={zIndex:i,title:'Impedancia fase '+'ABC'[i],info:'Rama de la carga balanceada · las 3 son iguales (Z=|Z|∠φ)'};
  scene.add(m);
  addHoverLabel(m,'Z fase '+'ABC'[i],PH_HEX[i],new THREE.Vector3(p.x,p.y+0.32,p.z),0.8);
  zMods.push(m);
});
const neutral=new THREE.Mesh(new THREE.SphereGeometry(0.08,16,16),plas(0xEAF4F1));
neutral.position.copy(NODE);
scene.add(neutral);
neutral.userData={title:'Nodo neutro (N)',info:'Solo existe en estrella (Y): une un extremo de las 3 impedancias. En balanceado la corriente de neutro es 0.'};

// Motor de inducción (derecha)
const motorBody=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.6,24),brush(0x2c3a36));
motorBody.rotation.z=Math.PI/2;motorBody.position.set(3.25,0.85,0.9);
scene.add(motorBody);
motorBody.userData={title:'Motor de inducción trifásico',info:'Su sentido de giro lo fija la secuencia de fases (ABC vs ACB)'};
addHoverLabel(motorBody,'Motor de inducción','#4FD1C5',new THREE.Vector3(3.25,1.35,0.9),1.2);
const shaft=new THREE.Group();shaft.position.set(3.6,0.85,0.9);scene.add(shaft);
const shaftRod=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.24,12),plas(0xcfd8d5));
shaftRod.rotation.z=Math.PI/2;shaftRod.position.set(0.0,0,0);shaft.add(shaftRod);
const vane=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.34,0.06),plas(0xFFD166));
vane.position.set(0.12,0,0);shaft.add(vane);
const vane2=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.06,0.34),plas(0xFFD166));
vane2.position.set(0.12,0,0);shaft.add(vane2);

// Cableado reconstruible según conexión
const wireG=new THREE.Group();scene.add(wireG);
const wireMat=[new THREE.MeshStandardMaterial({color:PH_COL[0],roughness:0.5,metalness:0.2,emissive:PH_COL[0],emissiveIntensity:0.25}),
               new THREE.MeshStandardMaterial({color:PH_COL[1],roughness:0.5,metalness:0.2,emissive:PH_COL[1],emissiveIntensity:0.25}),
               new THREE.MeshStandardMaterial({color:PH_COL[2],roughness:0.5,metalness:0.2,emissive:PH_COL[2],emissiveIntensity:0.25})];
const neutMat=new THREE.MeshStandardMaterial({color:0xEAF4F1,roughness:0.5,metalness:0.2,emissive:0xEAF4F1,emissiveIntensity:0.15});
function tubeBetween(a,b,radius,mat){
  const dir=new THREE.Vector3().subVectors(b,a),len=dir.length();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,len,10),mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());
  return m;
}
const srcTerms=[new THREE.Vector3(1.02,0.95,0.62),new THREE.Vector3(1.02,1.10,0.9),new THREE.Vector3(1.02,0.95,1.18)];
function rebuildWiring(){
  while(wireG.children.length)wireG.remove(wireG.children[0]);
  const conn=curConn();
  neutral.visible=conn==='Y';
  if(conn==='Y'){
    // cada Z: fuente -> extremo externo; extremo interno -> nodo neutro
    zMods.forEach((m,i)=>{
      wireG.add(tubeBetween(srcTerms[i],m.position,0.018,wireMat[i]));
      wireG.add(tubeBetween(m.position,NODE,0.016,neutMat));
    });
  }else{
    // Δ: une las 3 impedancias en lazo; cada vértice a su línea de fuente
    zMods.forEach((m,i)=>{
      const nxt=zMods[(i+1)%3];
      wireG.add(tubeBetween(m.position,nxt.position,0.018,wireMat[i]));
      wireG.add(tubeBetween(srcTerms[i],m.position,0.016,wireMat[i]));
    });
  }
  // línea al motor (siempre)
  wireG.add(tubeBetween(zMods[0].position,new THREE.Vector3(2.98,0.85,0.9),0.014,wireMat[0]));
}
function refreshLoadGlow(){
  const st=curState();
  const glow=Math.min(1,st.IL/40);
  zMods.forEach((m,i)=>{m.material.emissive.setHex(PH_COL[i]);m.material.emissiveIntensity=0.15+0.7*glow;});
}

// ===================== 7. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos CA (D1) · Sistemas trifásicos</div>
  <h2>Sistemas Trifásicos Y/Δ Balanceados · Secuencia de Fases</h2>
  <p>Un sistema trifásico balanceado alimenta tres impedancias iguales Z=|Z|∠φ desde una fuente de
  tensión de línea VL. En <b>estrella (Y)</b> cada impedancia recibe la tensión de fase VF=VL/√3 y la
  corriente de línea es la de fase (IL=IF); en <b>delta (Δ)</b> cada impedancia recibe la tensión de
  línea completa (VF=VL) y la corriente de línea es √3 veces la de fase (IL=√3·IF). Con la misma Z y la
  misma VL, la conexión Δ entrega exactamente el triple de potencia que la Y. La <b>secuencia de fases</b>
  (ABC positiva vs ACB negativa) no cambia magnitudes en balanceado, pero invierte el sentido de giro del
  motor: permutar dos líneas basta para invertirlo.</p>
  <div class="formula">VL=√3·VF · IL(Y)=IF, IL(Δ)=√3·IF · P=√3·VL·IL·cosφ · S²=P²+Q² · balanceado ⇒ In=0</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Fase A</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Fase B</div>
    <div class="li"><span class="dot" style="background:#5b8dff"></span>Fase C</div>
    <div class="li"><span class="dot" style="background:#FFD166"></span>Tensión de línea (VL=√3·VF, triángulo)</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> las relaciones exactas de un sistema trifásico balanceado en régimen permanente senoidal: VL=√3·VF en la fuente; en Y la impedancia ve VL/√3 con IL=IF, en Δ ve VL con IL=√3·IF; P=√3·VL·IL·cosφ=3·VF·IF·cosφ (Δ = 3× la potencia de Y a igual Z y VL, verificado numéricamente ratio=3 exacto); Q=√3·VL·IL·senφ, S=√3·VL·IL, FP=cosφ; corriente de neutro nula por ser balanceado; secuencia de fases ABC/ACB que invierte el sentido de giro sin alterar magnitudes. El Reto está verificado: cada escenario (VL,|Z|,φ) tiene exactamente 1 par (conexión,|Z|) que alcanza la potencia objetivo dentro de ±8%.</div>
    <div class="fl no"><b>NO modela:</b> desbalance de cargas o de fuente (aquí las 3 ramas son idénticas, In=0 siempre); impedancia de línea/neutro y caídas de tensión en los conductores; armónicos y cargas no lineales; transitorios de arranque del motor (par/deslizamiento reales); el sentido de giro ABC↻ / ACB↺ es una convención del simulador —el sentido físico real depende del devanado y del criterio de conexión, lo que NO cambia es que invertir la secuencia invierte el giro; efectos térmicos y saturación magnética.</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · Boylestad · Enríquez Harper · NOM-001-SEDE-2022 · IEC 60038 · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Sistemas trifásicos · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_disena">🔧 Diseña</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Reto de conexión</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar conexión</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nuevo escenario</button>
  </div>`;

// ===================== 8. TOASTS =====================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3400);
}

// ===================== 9. MODOS Y CONTROLES =====================
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.4,2.4,6.8],[0.3,1.1,0.0]],mision:'Ajusta libremente VL, |Z|, φ, la conexión (Y/Δ) y la secuencia (ABC/ACB). Observa VL=√3·VF en el triángulo del pizarrón, cómo Δ triplica la potencia de Y a igual Z, y cómo la secuencia invierte el giro del motor sin cambiar magnitudes.'},
  disena:{nombre:'Diseña',cam:[[3.0,2.1,4.4],[2.0,0.9,0.9]],mision:'Escenario dado: alcanza la potencia de línea objetivo eligiendo conexión y |Z|, y ajusta la secuencia al giro pedido. Retroalimentación en vivo, sin calificar.'},
  reto:{nombre:'Reto',cam:[[3.0,2.1,4.4],[2.0,0.9,0.9]],mision:'Escenario sorteado. Elige la conexión y la |Z| que dan la potencia objetivo (±8%) y la secuencia que produce el giro requerido; luego comprueba.'},
};

function lblBtns(label,items,dataAttr,fmt){
  return `<span class="lbl">${label}</span>`+items.map(it=>`<button class="b sm ${it.on?'on':''}" data-${dataAttr}="${it.v}">${fmt(it)}</button>`).join('');
}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';
  let html='';
  if(mode==='explora'){
    html+=lblBtns('VL',VL_CANDS.map(v=>({v,on:v===expVL})),'vl',it=>it.v+' V');
    html+=lblBtns('φ',PHI_CANDS.map(v=>({v,on:v===expPhi})),'phi',it=>it.v+'°');
  }
  html+=lblBtns('|Z|',Z_CANDS.map(v=>({v,on:v===curZ()})),'z',it=>it.v+' Ω');
  html+=`<span class="lbl">Conexión:</span>`+CONNS.map(cn=>`<button class="b sm ${cn===curConn()?'on':''}" data-conn="${cn}">${cn==='Y'?'Estrella (Y)':'Delta (Δ)'}</button>`).join('');
  html+=`<span class="lbl">Secuencia:</span>`+SEQS.map(sq=>`<button class="b sm ${sq===curSeq()?'on':''}" data-seq="${sq}">${sq}</button>`).join('');
  bar.innerHTML=html;
  bar.querySelectorAll('[data-vl]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expVL=parseFloat(b.dataset.vl);afterEdit();});
  bar.querySelectorAll('[data-phi]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expPhi=parseFloat(b.dataset.phi);afterEdit();});
  bar.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{if(autoRunning)return;setZ(parseFloat(b.dataset.z));});
  bar.querySelectorAll('[data-conn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;setConn(b.dataset.conn);});
  bar.querySelectorAll('[data-seq]').forEach(b=>b.onclick=()=>{if(autoRunning)return;setSeq(b.dataset.seq);});
}
function setZ(v){if(mode==='explora')expZ=v;else if(mode==='disena')disZ=v;else{retoZ=v;retoChecked=false;retoOk=false;retoMsg='';}synth.beep(660,0.06,0.04);afterEdit();}
function setConn(v){if(mode==='explora')expConn=v;else if(mode==='disena')disConn=v;else{retoConn=v;retoChecked=false;retoOk=false;retoMsg='';}synth.beep(v==='D'?520:760,0.07,0.05);rebuildWiring();afterEdit();}
function setSeq(v){if(mode==='explora')expSeq=v;else if(mode==='disena')disSeq=v;else{retoSeq=v;retoChecked=false;retoOk=false;retoMsg='';}synth.beep(880,0.06,0.04);afterEdit();}

function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode==='explora'){box.style.display='none';return;}
  box.style.display='block';
  const VL=curVL(),phi=curPhi(),tgt=curTarget(),req=curReqSeq();
  box.innerHTML=`Escenario: <b>VL=${VL} V</b>, <b>φ=${phi}°</b> (FP=${Math.cos(phi*Math.PI/180).toFixed(3)}). Objetivo: potencia de línea <b>P=${fmtkW(tgt)}</b> (±8%) y el motor debe girar en sentido <b>${rotLabel(req)}</b> (secuencia ${req}).`;
}

function setMode(k){
  mode=k;
  ['explora','disena','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('retoTitle').style.display=k==='reto'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  if(k==='reto')updateRetoSpec();
  buildControls();updateScenarioInfo();
  solved=false;
  clearDx();buildQuiz();refreshQuestion();
  rebuildWiring();
  const cam=MODE_META[k].cam;S.moveTo(cam[0],cam[1]);
  refreshAll();
}
function afterEdit(){buildControls();updateScenarioInfo();rebuildWiring();refreshAll();}

function newSignal(){
  if(mode==='explora'){
    expVL=pickFrom(VL_CANDS,expVL);expZ=pickFrom(Z_CANDS,expZ);expPhi=pickFrom(PHI_CANDS);expConn=pickFrom(CONNS);expSeq=pickFrom(SEQS);
    afterEdit();showToast('🔀 Nuevo escenario aleatorio en Explora.');
  }else if(mode==='disena'){
    seedDisena();afterEdit();showToast('🔀 Nuevo escenario de diseño. Objetivo de potencia y giro actualizados.');
  }else{
    seedReto();updateRetoSpec();afterEdit();solved=false;
    showToast('🔀 Nuevo escenario de Reto. La conexión y la secuencia correctas pueden haber cambiado.');
  }
  synth.beep(520,0.08,0.05);
}

// ===================== 10. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele'),st=curState();
  const common=
    teleRow('Conexión / Secuencia',(st.conn==='Y'?'Estrella (Y)':'Delta (Δ)')+' · '+curSeq())+
    teleRow('VL (línea) / VF sobre Z',st.VL+' V / '+fmtV(st.VFload))+
    teleRow('IF (fase) / IL (línea)',fmtA(st.IF)+' / '+fmtA(st.IL))+
    teleRow('P = √3·VL·IL·cosφ',fmtkW(st.P))+
    teleRow('Q / S',fmtkVAR(st.Q)+' / '+fmtkVA(st.Sap))+
    teleRow('FP = cosφ',st.FP.toFixed(3))+
    teleRow('Giro del motor',rotLabel(curSeq()));
  if(mode==='explora'){t.innerHTML=common;return;}
  const tgt=curTarget(),req=curReqSeq();
  const powerOk=Math.abs(st.P-tgt)<=P_TOL_FRAC*tgt;
  const seqOk=curSeq()===req;
  if(mode==='disena'){
    t.innerHTML=common+
      teleRow('Objetivo P',fmtkW(tgt))+
      teleRow('¿Potencia coincide?',powerOk?'✔ dentro de ±8%':'✗ ajusta conexión/|Z|',powerOk?'good':'warn')+
      teleRow('¿Giro coincide?',seqOk?'✔ '+rotLabel(req):'✗ ajusta secuencia',seqOk?'good':'warn');
  }else{
    t.innerHTML=common+
      teleRow('Objetivo P',fmtkW(tgt))+
      teleRow('Objetivo de giro',rotLabel(req))+
      teleRow('Estado',retoChecked?(retoOk?'✔ CORRECTO':'revisa tu conexión'):'Elige y comprueba',(retoChecked&&retoOk)?'good':'warn');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  const st=curState();
  if(mode==='explora'){
    html+=`<span class="mono">${st.conn==='Y'?'Y':'Δ'} · VL=${st.VL} V ⇒ VF sobre Z=${fmtV(st.VFload)} (${st.conn==='Y'?'VL/√3':'=VL'}), IL=${fmtA(st.IL)} (${st.conn==='Y'?'=IF':'=√3·IF'}), P=${fmtkW(st.P)}. Secuencia ${curSeq()} ⇒ giro ${rotLabel(curSeq())}.</span>`;
  }else if(mode==='disena'){
    const tgt=curTarget();const powerOk=Math.abs(st.P-tgt)<=P_TOL_FRAC*tgt;const seqOk=curSeq()===curReqSeq();
    html+=`<span class="mono">Tu conexión da P=${fmtkW(st.P)} (objetivo ${fmtkW(tgt)}) ${powerOk?'✔':'✗'} y giro ${rotLabel(curSeq())} ${seqOk?'✔':'✗'}. Modo de práctica, no califica.</span>`;
  }else{
    html+=retoMsg||`<span class="mono">Elige conexión + |Z| para la potencia objetivo y la secuencia para el giro requerido, luego "Comprobar conexión".</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();refreshLoadGlow();}

// ===================== 11. RETO =====================
function updateRetoSpec(){
  el('retoSpec').innerHTML=`Alimentación <b>VL=${retoVL} V</b>, carga con <b>φ=${retoPhi}°</b> (FP=${Math.cos(retoPhi*Math.PI/180).toFixed(3)}). Debes entregar una potencia de línea de <b>${fmtkW(retoPtarget)}</b> (±8%) eligiendo la <b>conexión (Y/Δ)</b> y la <b>|Z|</b> correctas, y ajustar la <b>secuencia</b> para que el motor gire en sentido <b>${rotLabel(retoReqSeq)}</b> (${retoReqSeq}). Luego pulsa "Comprobar conexión".`;
}
function checkReto(){
  const st=tp(retoVL,retoZ,retoPhi,retoConn);
  const powerOk=Math.abs(st.P-retoPtarget)<=P_TOL_FRAC*retoPtarget;
  const seqOk=retoSeq===retoReqSeq;
  retoOk=powerOk&&seqOk;retoChecked=true;solved=retoOk;
  synth.beep(retoOk?1046:220,retoOk?0.14:0.15,0.06);
  if(retoOk){
    retoMsg=`<span class="mono"><span class="ok">✔ Conexión correcta</span> — ${st.conn==='Y'?'Estrella (Y)':'Delta (Δ)'} con |Z|=${retoZ} Ω da P=${fmtkW(st.P)} (objetivo ${fmtkW(retoPtarget)}), y la secuencia ${retoSeq} produce el giro ${rotLabel(retoReqSeq)} requerido.</span>`;
  }else if(!powerOk&&!seqOk){
    retoMsg=`<span class="mono"><span class="dtc">✗ Ambos objetivos fallan</span> — P=${fmtkW(st.P)} (objetivo ${fmtkW(retoPtarget)}) y el giro es ${rotLabel(retoSeq)}, se pide ${rotLabel(retoReqSeq)}. Revisa conexión, |Z| y secuencia.</span>`;
  }else if(!powerOk){
    retoMsg=`<span class="mono"><span class="dtc">✗ Potencia fuera de rango</span> — P=${fmtkW(st.P)} vs objetivo ${fmtkW(retoPtarget)}. Recuerda: a igual |Z| y VL, Δ entrega 3× la potencia de Y. Ajusta conexión y/o |Z|.</span>`;
  }else{
    retoMsg=`<span class="mono"><span class="dtc">✗ Giro incorrecto</span> — la potencia ya cumple, pero la secuencia ${retoSeq} gira ${rotLabel(retoSeq)} y se pide ${rotLabel(retoReqSeq)}. Cambia la secuencia (permutar dos líneas invierte el giro).</span>`;
  }
  refreshAll();
}

// ===================== 12. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'Con la misma impedancia |Z| por rama y la misma tensión de línea VL, ¿por qué una carga en Δ consume exactamente el triple de potencia que en Y?',
      opciones:[
        {t:'Porque en Δ cada impedancia queda sometida a VL (no a VL/√3 como en Y): la tensión sobre Z es √3 veces mayor, la corriente de fase √3 veces mayor, y P∝V² sobre cada rama ⇒ (√3)²=3.',ok:true,why:'Correcto: VF_Δ/VF_Y=√3, y la potencia por rama va como VF²/|Z|, así que Δ da (√3)²=3 veces la potencia de Y con la misma Z y VL.'},
        {t:'Porque en Δ hay tres impedancias y en Y solo hay una.',ok:false,why:'Ambas conexiones usan tres impedancias iguales; la diferencia es la tensión que cada una recibe, no cuántas hay.'},
        {t:'Porque la corriente de línea en Δ es √3 veces la de Y y la potencia es proporcional solo a la corriente de línea.',ok:false,why:'IL sí es mayor, pero P=√3·VL·IL·cosφ y VL es la misma; el factor 3 viene de que en Δ la impedancia ve VL en vez de VL/√3, no de un único factor √3.'},
        {t:'Porque el factor de potencia cambia al pasar de Y a Δ.',ok:false,why:'El FP=cosφ lo fija la impedancia (φ), y es el mismo en Y y en Δ; el triple de potencia no viene del FP.'},
      ],
    },
    disena:{
      pregunta:'En una carga trifásica balanceada, ¿cuánto vale la corriente por el conductor neutro y por qué?',
      opciones:[
        {t:'Cero: las tres corrientes de fase tienen igual magnitud y están a 120°, así que su suma fasorial (la corriente de retorno por el neutro) es nula.',ok:true,why:'Correcto: en balanceado IA+IB+IC=0 fasorialmente, por eso el neutro no lleva corriente y en la práctica puede dimensionarse menor o incluso omitirse (Δ no tiene neutro).'},
        {t:'Igual a la suma aritmética de las tres corrientes de fase.',ok:false,why:'Sería la suma FASORIAL, no aritmética; y con tres fasores iguales a 120° esa suma es cero, no la suma de magnitudes.'},
        {t:'Igual a la corriente de línea, porque el neutro es un conductor más.',ok:false,why:'En balanceado el neutro lleva cero; solo transporta corriente cuando el sistema está desbalanceado.'},
        {t:'√3 veces la corriente de fase.',ok:false,why:'Ese factor relaciona IL con IF en Δ; no describe la corriente de neutro, que es cero en balanceado.'},
      ],
    },
    reto:{
      pregunta:'El motor gira en sentido contrario al que necesitas. ¿Cuál es la corrección estándar y qué le pasa a las magnitudes (P, Q, corrientes)?',
      opciones:[
        {t:'Permutar dos de las tres líneas (equivale a invertir la secuencia ABC↔ACB): invierte el sentido de giro y NO altera P, Q ni las corrientes, porque el sistema sigue balanceado.',ok:true,why:'Correcto: intercambiar dos fases invierte la secuencia y por tanto el giro; como las tres impedancias siguen siendo iguales, todas las magnitudes se conservan.'},
        {t:'Reducir la impedancia |Z| a la mitad para forzar el giro contrario.',ok:false,why:'|Z| cambia la potencia y las corrientes, pero no el sentido de giro; el giro depende de la secuencia de fases, no de la magnitud de Z.'},
        {t:'Cambiar de Y a Δ invierte el sentido de giro.',ok:false,why:'Y↔Δ cambia las tensiones sobre Z y la potencia (×3), pero no invierte la secuencia ni el sentido de giro.'},
        {t:'Aumentar la tensión de línea VL invierte el giro.',ok:false,why:'Subir VL escala las corrientes y la potencia, sin tocar la secuencia; el sentido de giro no depende de VL.'},
      ],
    },
  };
}
function clearDx(){const box=el('dxbtns');if(box)box.innerHTML='';}
function refreshQuestion(){
  const q=QUIZ[mode];if(!q)return;
  el('q_text').textContent=q.pregunta;
  const box=el('dxbtns');
  box.innerHTML=q.opciones.map((o,i)=>`<button class="b sm" data-i="${i}">${String.fromCharCode(65+i)}) ${o.t}</button>`).join('');
  box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>answer(parseInt(b.dataset.i,10)));
}
function answer(i){
  const q=QUIZ[mode];if(!q)return;
  const box=el('dxbtns'),btns=box.querySelectorAll('[data-i]');
  if(!btns.length||btns[0].disabled)return;
  const o=q.opciones[i];
  btns.forEach(b=>b.disabled=true);
  btns[i].classList.add(o.ok?'right':'wrong');
  if(o.ok){solved=true;synth.beep(1046,0.12,0.06);}else{synth.beep(220,0.15,0.06);}
  showToast((o.ok?'✔ ':'✗ ')+o.why);
  updateReport();
}

// ===================== 13. PICKING Y HOVER =====================
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return;
  if(hit.object===board){boardClick();return;}
  let o=hit.object;
  while(o){
    if(o.userData&&o.userData.zIndex!==undefined){
      const nc=curConn()==='Y'?'D':'Y';setConn(nc);
      showToast('🔁 Conexión cambiada a '+(nc==='Y'?'Estrella (Y)':'Delta (Δ)')+'. Observa cómo cambian VF sobre Z, IL y la potencia.');
      return;
    }
    if(o.userData&&o.userData.title){showToast('<b>'+o.userData.title+'</b><br>'+(o.userData.info||''));return;}
    o=o.parent;
  }
});
(function hoverLoop(){
  const ray=new THREE.Raycaster(),dom=S.renderer.domElement;let mx=0,my=0;
  dom.addEventListener('pointermove',e=>{const r=dom.getBoundingClientRect();mx=((e.clientX-r.left)/r.width)*2-1;my=-((e.clientY-r.top)/r.height)*2+1;});
  function tick(){
    ray.setFromCamera({x:mx,y:my},S.camera);let hovered=false;
    for(const [obj,spr] of HOVER_LABELS){
      if(!obj.visible){spr.visible=false;continue;}
      const on=ray.intersectObject(obj,true).length>0;spr.visible=on;if(on)hovered=true;
    }
    dom.style.cursor=hovered?'pointer':'default';requestAnimationFrame(tick);
  }
  tick();
})();

// ===================== 14. RECORRIDO AUTOMÁTICO =====================
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorriendo…';
  try{
    synth.init();synth.resume();clearDx();
    setMode('explora');
    expVL=220;expZ=10;expPhi=30;expConn='Y';expSeq='ABC';afterEdit();
    showToast('🧭 Explora: 220 V, |Z|=10 Ω, φ=30°, en Estrella (Y). La impedancia ve VF=VL/√3='+fmtV(curState().VFload)+' y P='+fmtkW(curState().P)+'.');
    await sleep(3000);
    expConn='D';rebuildWiring();afterEdit();
    showToast('🔺 Misma Z y VL, ahora en Delta (Δ): cada impedancia ve VL completo, IL=√3·IF y P='+fmtkW(curState().P)+' — exactamente el triple de la estrella.');
    await sleep(3200);
    answer(0);await sleep(2400);
    expSeq='ACB';afterEdit();
    showToast('🔄 Cambiamos la secuencia a ACB: el motor invierte su giro a '+rotLabel('ACB')+', pero P, Q e IL no cambian (sistema balanceado).');
    await sleep(3000);

    setMode('disena');
    disVL=220;disPhi=0;disReqSeq='ABC';disConn='Y';disZ=Z_CANDS[0];disSeq='ABC';
    disPtarget=tp(220,10,0,'D').P;   // objetivo alcanzable por Δ@10Ω
    afterEdit();
    showToast('🔧 Diseña: objetivo '+fmtkW(disPtarget)+' a 220 V. Con la Estrella actual no alcanza; probemos Delta con |Z|=10 Ω.');
    await sleep(3000);
    disConn='D';disZ=10;afterEdit();
    showToast(Math.abs(curState().P-disPtarget)<=P_TOL_FRAC*disPtarget?'✔ Delta @10 Ω alcanza el objetivo de potencia. Falta confirmar el giro.':'Ajusta |Z| para acercarte al objetivo.');
    await sleep(3000);
    answer(0);await sleep(2400);

    setMode('reto');
    // resolver el reto sorteado con su solución conocida
    retoConn=retoSolConn;retoZ=retoSolZ;retoSeq=retoReqSeq;afterEdit();
    showToast('🎯 Reto: aplicando la conexión '+(retoSolConn==='Y'?'Y':'Δ')+' con |Z|='+retoSolZ+' Ω y secuencia '+retoReqSeq+'…');
    await sleep(2800);
    checkReto();await sleep(2600);
    answer(0);
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 15. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt,time)=>{
  const pulse=0.5+0.5*Math.sin(time*2.2);
  const st=curState();
  const spd=(rotOf(curSeq())==='CW'?-1:1)*(0.6+3.0*Math.min(1,st.IL/40));
  shaft.rotation.x+=spd*dt;
  zMods.forEach(m=>{if(m.material.emissiveIntensity>0)m.material.emissiveIntensity=0.15+0.55*Math.min(1,st.IL/40)+0.1*pulse;});
});
['explora','disena','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=()=>{if(!autoRunning)runAuto();};
el('btnNew').onclick=()=>{if(autoRunning)return;newSignal();};
el('btnCheck').onclick=()=>{if(autoRunning)return;checkReto();};
const soundBtn=el('soundBtn');
if(soundBtn){soundBtn.onclick=()=>{synth.toggle();soundBtn.textContent=synth.isOn()?'🔊':'🔇';};}
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildQuiz();
rebuildWiring();
S.start();
setMode('explora');

// ===================== DEBUG HOOK =====================
window.__labDebug={
  mode:()=>mode,
  VL:()=>curVL(),
  Z:()=>curZ(),
  phiDeg:()=>curPhi(),
  conn:()=>curConn(),
  seq:()=>curSeq(),
  VFsource:()=>curState().VFsource,
  VFload:()=>curState().VFload,
  IF:()=>curState().IF,
  IL:()=>curState().IL,
  P:()=>curState().P,
  Q:()=>curState().Q,
  Sap:()=>curState().Sap,
  FP:()=>curState().FP,
  rot:()=>rotOf(curSeq()),
  setVL:v=>{if(mode==='explora'){expVL=v;afterEdit();}},
  setPhi:v=>{if(mode==='explora'){expPhi=v;afterEdit();}},
  setZ:v=>setZ(v),
  setConn:v=>setConn(v),
  setSeq:v=>setSeq(v),
  target:()=>curTarget(),
  reqSeq:()=>curReqSeq(),
  retoVL:()=>retoVL,
  retoPhi:()=>retoPhi,
  retoPtarget:()=>retoPtarget,
  retoReqSeq:()=>retoReqSeq,
  retoSolConn:()=>retoSolConn,
  retoSolZ:()=>retoSolZ,
  retoChecked:()=>retoChecked,
  retoOk:()=>retoOk,
  retoMsg:()=>retoMsg,
  checkReto:()=>checkReto(),
  newSignal:()=>newSignal(),
  setMode:k=>setMode(k),
  reportText:()=>el('report').innerText,
  quizAnswer:i=>answer(i),
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  solved:()=>solved,
};
