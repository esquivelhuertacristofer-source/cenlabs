// Corrección de factor de potencia: banco de capacitores en paralelo con una carga inductiva.
// Física: φ1=acos(FP1), Q1=P·tanφ1, φ2=acos(0.95), Qc=P·(tanφ1−tanφ2). Q_neto=Q1−Qc_banco,
// S_result=√(P²+Q_neto²), FP_result=P/S_result. Banda de cumplimiento |Q1−Qc_banco|≤P·tanφ2,
// equivalente exactamente al ángulo del vector resultante respecto al eje P dentro de ±φ2≈±18.19°
// (verificado: tan(ang)=Q_neto/P y |Q_neto|≤P·tanφ2 ⟺ |ang|≤φ2).
// Catálogo de 8 pasos comerciales conmutables (5,10,15,20,25,30,40,50 kVAR), verificado numéricamente
// sobre 30 escenarios P×FP1 (node -e, búsqueda exhaustiva de las 255 combinaciones no vacías):
// entre 6 y 26 sumas distintas cumplen la banda en cada escenario, ninguno sin solución. Tolerancia de
// casi-óptimo del Reto = banco mínimo real (minSum) + 5 kVAR (3–23 combinaciones de máscara aceptables
// por escenario). Referencia: IEC 60050-131, CFE Código de Red RES/550/2021.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.0,2.2,6.6],target:[0.4,1.2,0.0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});
const el=id=>document.getElementById(id);

// ===================== 2. FÍSICA =====================
const P_CANDS=[50,75,100,150,200];
const FP1_CANDS=[0.65,0.70,0.75,0.80,0.85,0.90];
const FP2_TARGET=0.95;
const CAP_STEPS=[5,10,15,20,25,30,40,50];

function Q1of(P,FP1){return P*Math.tan(Math.acos(FP1));}
function QcIdealOf(P,FP1){return P*(Math.tan(Math.acos(FP1))-Math.tan(Math.acos(FP2_TARGET)));}
function toleranceQ(P){return P*Math.tan(Math.acos(FP2_TARGET));}
function pickFrom(arr,exclude){if(arr.length<=1)return arr[0];let v=arr[Math.floor(Math.random()*arr.length)];while(v===exclude)v=arr[Math.floor(Math.random()*arr.length)];return v;}

function bestBankFor(P,FP1){
  const Q1=Q1of(P,FP1),t=toleranceQ(P);
  let minSum=Infinity,bestMask=0;
  for(let mask=1;mask<256;mask++){
    let sum=0;
    for(let i=0;i<8;i++) if(mask&(1<<i)) sum+=CAP_STEPS[i];
    if(Math.abs(Q1-sum)<=t && sum<minSum){minSum=sum;bestMask=mask;}
  }
  return {minSum,mask:bestMask};
}

function fmtKVAR(v){return (Math.round(v*100)/100).toFixed(2)+' kVAR';}
function fmtKVA(v){return (Math.round(v*100)/100).toFixed(2)+' kVA';}
function fmtFP(v){return (Math.round(v*1000)/1000).toFixed(3);}

// ===================== 3. ESTADO =====================
let mode='explora';
let expP=pickFrom(P_CANDS),expFP1=pickFrom(FP1_CANDS),expQc=0;
let bancoP=pickFrom(P_CANDS),bancoFP1=pickFrom(FP1_CANDS);
let bancoSteps=[false,false,false,false,false,false,false,false];
let retoP=pickFrom(P_CANDS),retoFP1=pickFrom(FP1_CANDS);
let retoSteps=[false,false,false,false,false,false,false,false];
let retoMinSum=0,retoBestMask=0,retoChecked=false,retoOk=false,retoMsg='';
let solved=false,autoRunning=false;
let QUIZ={};

function seedReto(){const best=bestBankFor(retoP,retoFP1);retoMinSum=best.minSum;retoBestMask=best.mask;}
seedReto();

function currentP(){return mode==='explora'?expP:(mode==='banco'?bancoP:retoP);}
function currentFP1(){return mode==='explora'?expFP1:(mode==='banco'?bancoFP1:retoFP1);}
function currentSteps(){return mode==='banco'?bancoSteps:(mode==='reto'?retoSteps:null);}
function currentQcBanco(){
  if(mode==='explora')return expQc;
  const steps=currentSteps();
  let sum=0;
  steps.forEach((on,i)=>{if(on)sum+=CAP_STEPS[i];});
  return sum;
}
function currentState(){
  const P=currentP(),FP1=currentFP1();
  const Q1=Q1of(P,FP1);
  const QcBanco=currentQcBanco();
  const Qneto=Q1-QcBanco;
  const Sresult=Math.hypot(P,Qneto);
  const FPresult=Sresult>1e-9?P/Sresult:1;
  const compliant=Math.abs(Qneto)<=toleranceQ(P);
  const QcIdealVal=QcIdealOf(P,FP1);
  return {P,FP1,Q1,QcBanco,Qneto,Sresult,FPresult,compliant,QcIdealVal};
}

// ===================== 4. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
function plas(base){return std(base,0.35,0.08);}
const MAT={bench:brush(0x2a3532),frame:brush(0x1f2b28),leg:brush(0x141c1a)};

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

// ===================== 5. PIZARRÓN =====================
const boardG=new THREE.Group();
boardG.position.set(-1.05,0,-0.85);boardG.rotation.y=0.16;
scene.add(boardG);
const frame=roundedBox(3.62,2.77,0.12,MAT.frame,0.06);
frame.position.set(0,1.85,0);
boardG.add(frame);
[-1.5,1.5].forEach(x=>{
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.85,16),MAT.leg);
  leg.position.set(x,0.9,0);boardG.add(leg);
});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.55),new THREE.MeshBasicMaterial({map:bTex}));
board.position.set(0,1.85,0.065);
boardG.add(board);
frame.userData={title:'Pizarrón',info:'Triángulo de potencias · corrección de factor de potencia · toca para inspeccionar'};
addHoverLabel(frame,'Triángulo de potencias','#4FD1C5',new THREE.Vector3(0,3.35,0.1).add(boardG.position),1.6);

function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function drawArrowhead(c,x,y,angRad,color){
  const s=9;
  c.fillStyle=color;
  c.save();c.translate(x,y);c.rotate(angRad);
  c.beginPath();c.moveTo(0,0);c.lineTo(-s,s*0.55);c.lineTo(-s,-s*0.55);c.closePath();c.fill();
  c.restore();
}
function drawVector(c,cx,cy,R,mag,angDeg,scaleMax,color,label){
  const frac=Math.min(1,mag/scaleMax);
  const rad=angDeg*Math.PI/180;
  const ex=cx+R*frac*Math.cos(rad),ey=cy-R*frac*Math.sin(rad);
  c.strokeStyle=color;c.lineWidth=3;
  c.beginPath();c.moveTo(cx,cy);c.lineTo(ex,ey);c.stroke();
  drawArrowhead(c,ex,ey,-rad,color);
  c.fillStyle=color;c.font='bold 13px Outfit, sans-serif';c.textAlign='left';
  c.fillText(label,ex+10,ey);
}

function drawTriangle(c,state){
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('TRIÁNGULO DE POTENCIAS · CORRECCIÓN DE FP',30,46);
  c.fillStyle='#5a6b66';c.font='13px Outfit, sans-serif';
  c.fillText('P='+state.P+' kW · FP₁='+state.FP1.toFixed(2)+' · Q₁='+fmtKVAR(state.Q1)+' · Qc ideal='+fmtKVAR(state.QcIdealVal)+' (meta FP₂=0.95)',30,72);

  const cx=512,cy=440,R=280;
  const phi2Deg=Math.acos(FP2_TARGET)*180/Math.PI;

  c.save();
  c.beginPath();
  c.moveTo(cx,cy);
  const wedgeSteps=48;
  for(let i=0;i<=wedgeSteps;i++){
    const a=-phi2Deg+(2*phi2Deg)*(i/wedgeSteps);
    const rad=a*Math.PI/180;
    c.lineTo(cx+R*Math.cos(rad),cy-R*Math.sin(rad));
  }
  c.closePath();
  c.fillStyle='rgba(124,217,146,0.10)';
  c.fill();
  c.strokeStyle='rgba(124,217,146,0.4)';c.lineWidth=1.5;c.setLineDash([6,5]);
  c.stroke();
  c.setLineDash([]);
  c.restore();

  c.strokeStyle='rgba(79,209,197,0.16)';c.lineWidth=1;
  [0.25,0.5,0.75,1.0].forEach(frac=>{c.beginPath();c.arc(cx,cy,R*frac,0,Math.PI*2);c.stroke();});
  for(let a=0;a<360;a+=30){const rad=a*Math.PI/180;line(c,cx,cy,cx+R*Math.cos(rad),cy-R*Math.sin(rad));}
  c.strokeStyle='rgba(79,209,197,0.4)';c.lineWidth=1.5;
  c.beginPath();c.moveTo(cx-R,cy);c.lineTo(cx+R,cy);c.moveTo(cx,cy-R);c.lineTo(cx,cy+R);c.stroke();
  c.fillStyle='#5a6b66';c.font='12px Outfit, sans-serif';c.textAlign='center';
  c.fillText('P (0°)',cx+R+34,cy+4);
  c.fillText('Q inductiva (+90°)',cx,cy-R-16);
  c.fillText('Q capacitiva (−90°)',cx,cy+R+22);
  c.fillStyle='rgba(124,217,146,0.85)';
  c.fillText('zona de cumplimiento ±'+phi2Deg.toFixed(1)+'°',cx+R*0.60,cy-R*0.32);

  const scaleMax=Math.max(state.Q1,state.QcBanco,Math.abs(state.Qneto),state.P*0.55,10)*1.2;
  const angle1=Math.atan2(state.Q1,state.P)*180/Math.PI;
  const mag1=Math.hypot(state.P,state.Q1);
  drawVector(c,cx,cy,R,mag1,angle1,scaleMax,'#FF8A5B','Carga original (S₁)');

  if(state.QcBanco>0.05){
    drawVector(c,cx,cy,R,state.QcBanco,-90,scaleMax,'#4FD1C5','Corrección (Qc)');
  }

  const angleN=Math.atan2(state.Qneto,state.P)*180/Math.PI;
  drawVector(c,cx,cy,R,state.Sresult,angleN,scaleMax,state.compliant?'#7CD992':'#ff5c5c','Resultado (S_result)');

  c.textAlign='left';
  c.font='bold 17px Outfit, sans-serif';
  c.fillStyle=state.compliant?'#7CD992':'#ff8a8a';
  c.fillText('FP_result='+fmtFP(state.FPresult)+(state.compliant?'  ✔ cumple FP≥0.95':'  ✗ no cumple'),30,714);
  c.font='13px Outfit, sans-serif';c.fillStyle='#5a6b66';
  c.fillText('Banco instalado: '+fmtKVAR(state.QcBanco)+' · Q_neto='+fmtKVAR(state.Qneto)+' · S_result='+fmtKVA(state.Sresult),30,740);
}

function drawBoard(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.05)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  drawTriangle(c,currentState());
  bTex.needsUpdate=true;
}

function boardClick(){
  showToast('📐 Triángulo de potencias: naranja = carga original (S₁), turquesa = corrección capacitiva (Qc), verde/rojo = resultado neto (S_result). La franja sombreada es la banda de cumplimiento FP≥0.95.');
}

// ===================== 6. BANCO 3D =====================
const bench=roundedBox(2.9,0.5,1.6,MAT.bench,0.05);
bench.position.set(1.75,0.25,0.85);
scene.add(bench);
bench.userData={title:'Banco de capacitores',info:'8 pasos comerciales conmutables individualmente (5–50 kVAR) · toca cada paso para conectarlo/desconectarlo'};
addHoverLabel(bench,'Banco de capacitores','#4FD1C5',new THREE.Vector3(1.75,1.15,0.85),1.4);

const CAN_POS=[
  [0.925,0.55],[1.475,0.55],[2.025,0.55],[2.575,0.55],
  [0.925,1.15],[1.475,1.15],[2.025,1.15],[2.575,1.15],
];
const cans=[];
CAP_STEPS.forEach((kvar,i)=>{
  const r=0.07+((kvar-5)/45)*0.05;
  const h=0.34;
  const mat=new THREE.MeshStandardMaterial({color:0x33413c,roughness:0.4,metalness:0.35,emissive:0x000000,emissiveIntensity:0});
  const can=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),mat);
  const [x,z]=CAN_POS[i];
  can.position.set(x,0.5+h/2,z);
  can.castShadow=can.receiveShadow=true;
  can.userData={stepIndex:i,kvar,title:'Paso '+kvar+' kVAR',info:'Capacitor conmutable · toca para conectar/desconectar (modos Banco y Reto)'};
  scene.add(can);
  addHoverLabel(can,'Paso '+kvar+' kVAR','#4FD1C5',new THREE.Vector3(x,0.5+h+0.22,z),0.85);
  cans.push(can);
});

const gauge=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.19,1.0,24),plas(0x2a3a36));
gauge.position.set(3.15,1.0,0.85);
gauge.userData={title:'Compensación continua (Qc)',info:'Solo en modo Explora — usa el deslizador Qc para variar la compensación capacitiva de forma continua, sin pasos discretos.'};
scene.add(gauge);
addHoverLabel(gauge,'Qc continuo','#4FD1C5',new THREE.Vector3(3.15,1.75,0.85),1.0);

function qcSliderMax(){
  const Q1=Q1of(expP,expFP1);
  return Math.max(20,Math.ceil(Q1*1.5/5)*5);
}
function refreshGauge(){
  const frac=Math.max(0.03,Math.min(1,expQc/qcSliderMax()));
  gauge.scale.y=frac;
  gauge.position.y=0.5+(1.0*frac)/2;
  gauge.visible=mode==='explora';
  gauge.material.emissive.setHex(0x4FD1C5);
  gauge.material.emissiveIntensity=0.15+0.6*frac;
}
function refreshBench(){
  const steps=currentSteps();
  cans.forEach((can,i)=>{
    can.visible=mode!=='explora';
    const active=steps?Boolean(steps[i]):false;
    can.material.emissive.setHex(active?0x4FD1C5:0x000000);
    can.material.emissiveIntensity=active?0.9:0;
  });
  refreshGauge();
}

// ===================== 7. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos CA (D1) · Corrección de factor de potencia</div>
  <h2>Corrección de Factor de Potencia · Diseña el Banco de Capacitores</h2>
  <p>Una carga industrial inductiva consume potencia reactiva Q₁=P·tanφ₁ además de su potencia activa P,
  lo que hace caer su factor de potencia FP₁=cosφ₁ por debajo de la meta regulatoria (FP₂=0.95 aquí).
  Un banco de capacitores en paralelo aporta un reactivo de signo contrario Qc que cancela parte de Q₁
  sin tocar P: Qc=P·(tanφ₁−tanφ₂). Los bancos comerciales no ofrecen ese Qc ideal de forma continua,
  sino en pasos discretos de catálogo — diseñar el banco es una combinatoria: elegir qué pasos conectar
  para caer dentro de la banda de cumplimiento minimizando el kVAR total instalado.</p>
  <div class="formula">Qc=P·(tanφ₁−tanφ₂) · Q_neto=Q₁−Qc_banco · FP_result=P/√(P²+Q_neto²) · cumple si |Q_neto|≤P·tanφ₂</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#FF8A5B"></span>Carga original (S₁, antes de corregir)</div>
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Corrección capacitiva (Qc)</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Resultado neto (S_result) · cumple FP≥0.95</div>
    <div class="li"><span class="dot" style="background:rgba(124,217,146,0.5)"></span>Zona de cumplimiento (banda ±φ₂ alrededor del eje P)</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el mismo triángulo de potencias S=P+jQ ya validado en la práctica de potencia en CA, restando un reactivo capacitivo Qc al Q₁ original; el criterio de cumplimiento |Q₁−Qc_banco|≤P·tanφ₂ es exactamente equivalente al ángulo del vector resultante respecto al eje P (banda ±φ₂≈±18.2°), verificado numéricamente; catálogo real de 8 pasos comerciales conmutables individualmente (5–50 kVAR, sin múltiplos), con 6–26 sumas válidas de las 255 combinaciones posibles en cada uno de los 30 escenarios P×FP₁ verificados, ninguno sin solución; el modo Reto califica por cercanía al banco real de menor kVAR (tolerancia minSum+5 kVAR).</div>
    <div class="fl no"><b>NO modela:</b> pérdidas dieléctricas, ESR o envejecimiento del capacitor real (reactancia ideal); resonancia armónica con cargas no lineales; bancos automáticos conmutados en tiempo real (APFC); perfil de carga variable en el tiempo; sistemas trifásicos (P es una potencia activa equivalente monofásica); costo económico real en moneda (el criterio de optimalidad del Reto es kVAR total, no precio de catálogo).</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · Boylestad · Enríquez Harper · CFE Código de Red RES/550/2021 · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Corrección de FP · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_banco">🔌 Banco</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div class="modebar" id="selbar" style="display:none"></div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div id="qcBox" style="margin:6px 0 10px">
    <label for="qcSlider" style="font-size:11px;color:var(--dim)">Compensación capacitiva continua Qc (kVAR)</label>
    <input type="range" id="qcSlider" min="0" max="150" step="1" value="0" style="width:100%">
  </div>
  <div class="modebar" id="stepsBar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Reto de diseño</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar banco</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nueva planta</button>
  </div>`;

// ===================== 8. TOASTS =====================
function showToast(html){
  const t=el('toast');
  t.innerHTML=html;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>t.classList.remove('show'),3200);
}

// ===================== 9. MODOS Y SELBAR =====================
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.0,2.2,6.6],[0.4,1.2,0.0]],mision:'Elige P y FP₁ de una planta industrial y mueve el control continuo de compensación Qc. Observa cómo el vector resultante entra en la banda de cumplimiento (FP≥0.95) al llegar a Qc ideal, se sigue acercando al eje P si sigues subiendo Qc, y termina divergiendo de nuevo —hacia el lado capacitivo— si te excedes en exceso.'},
  banco:{nombre:'Banco',cam:[[2.7,1.9,3.3],[1.75,0.75,0.85]],mision:'P y FP₁ ya están dados. Conecta y desconecta pasos comerciales del banco (5–50 kVAR) hasta que FP_result cumpla la meta. Este modo no califica.'},
  reto:{nombre:'Reto',cam:[[2.7,1.9,3.3],[1.75,0.75,0.85]],mision:'Nueva planta sorteada. Ensambla el banco que cumpla la meta con el MENOR kVAR total posible y comprueba.'},
};

function buildSelBar(){
  const bar=el('selbar');
  if(mode!=='explora'){bar.style.display='none';bar.innerHTML='';return;}
  bar.style.display='flex';bar.style.flexWrap='wrap';
  const pBtns=P_CANDS.map(p=>`<button class="b sm ${p===expP?'on':''}" data-p="${p}">${p} kW</button>`).join('');
  const fpBtns=FP1_CANDS.map(f=>`<button class="b sm ${f===expFP1?'on':''}" data-fp="${f}">${f.toFixed(2)}</button>`).join('');
  bar.innerHTML=`<span class="lbl">P:</span>${pBtns}<span class="lbl">FP₁:</span>${fpBtns}`;
  bar.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expP=parseFloat(b.dataset.p);expQc=0;afterEdit();});
  bar.querySelectorAll('[data-fp]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expFP1=parseFloat(b.dataset.fp);expQc=0;afterEdit();});
}

function buildStepsBar(){
  const bar=el('stepsBar');
  if(mode==='explora'){bar.style.display='none';bar.innerHTML='';return;}
  bar.style.display='flex';
  const steps=currentSteps();
  bar.innerHTML=CAP_STEPS.map((v,i)=>`<button class="b sm ${steps[i]?'on':''}" data-step="${i}">${v} kVAR</button>`).join('');
  bar.querySelectorAll('[data-step]').forEach(b=>{
    b.onclick=()=>{if(autoRunning)return;toggleStep(parseInt(b.dataset.step,10));};
  });
}

function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='banco'){box.style.display='none';return;}
  box.style.display='block';
  box.innerHTML=`Planta: <b>P=${bancoP} kW</b>, <b>FP₁=${bancoFP1.toFixed(2)}</b> (atrasado/inductivo) — fija para este escenario.`;
}

function updateQcSliderBounds(){
  const mx=qcSliderMax();
  const sl=el('qcSlider');
  sl.max=String(mx);
  if(expQc>mx)expQc=mx;
  sl.value=String(expQc);
}

function setMode(k){
  mode=k;
  ['explora','banco','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('qcBox').style.display=k==='explora'?'block':'none';
  el('retoTitle').style.display=k==='reto'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  if(k==='explora')updateQcSliderBounds();
  if(k==='reto')updateRetoSpec();
  buildSelBar();
  buildStepsBar();
  updateScenarioInfo();
  solved=false;
  clearDx();buildQuiz();refreshQuestion();
  const cam=MODE_META[k].cam;
  S.moveTo(cam[0],cam[1]);
  refreshAll();
}

function afterEdit(){
  if(mode==='explora')updateQcSliderBounds();
  buildSelBar();
  buildStepsBar();
  updateScenarioInfo();
  clearDx();buildQuiz();refreshQuestion();
  refreshAll();
}

function toggleStep(i){
  const steps=currentSteps();
  if(!steps)return;
  steps[i]=!steps[i];
  if(mode==='reto'){retoChecked=false;retoOk=false;retoMsg='';}
  synth.beep(steps[i]?880:440,0.08,0.05);
  buildStepsBar();
  refreshAll();
}

function capClick(i){
  if(autoRunning)return;
  if(mode==='explora'){
    showToast('En Explora la compensación es continua — usa el deslizador Qc. Los pasos discretos se conectan en los modos Banco y Reto.');
    return;
  }
  toggleStep(i);
}

function newSignal(){
  if(mode==='banco'){
    const P=pickFrom(P_CANDS,bancoP),FP1=pickFrom(FP1_CANDS,bancoFP1);
    bancoP=P;bancoFP1=FP1;
    bancoSteps=[false,false,false,false,false,false,false,false];
    solved=false;
    afterEdit();
    showToast('🔀 Nueva planta en Banco. P y FP₁ cambiaron — vuelve a armar el banco.');
    synth.beep(520,0.08,0.05);
  }else if(mode==='reto'){
    const P=pickFrom(P_CANDS,retoP),FP1=pickFrom(FP1_CANDS,retoFP1);
    retoP=P;retoFP1=FP1;
    retoSteps=[false,false,false,false,false,false,false,false];
    seedReto();
    retoChecked=false;retoOk=false;retoMsg='';
    solved=false;
    updateRetoSpec();
    afterEdit();
    showToast('🔀 Nueva planta en Reto. El banco óptimo puede haber cambiado.');
    synth.beep(520,0.08,0.05);
  }else{
    const P=pickFrom(P_CANDS,expP),FP1=pickFrom(FP1_CANDS,expFP1);
    expP=P;expFP1=FP1;expQc=0;
    afterEdit();
    showToast('🔀 Nueva planta aleatoria en Explora.');
    synth.beep(520,0.08,0.05);
  }
}

// ===================== 10. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}

function updateTele(){
  const t=el('tele');
  const state=currentState();
  if(mode==='explora'){
    t.innerHTML=
      teleRow('P / FP₁',state.P+' kW / '+state.FP1.toFixed(2))+
      teleRow('Q₁ (original)',fmtKVAR(state.Q1))+
      teleRow('Qc ideal (P·(tanφ₁−tanφ₂))',fmtKVAR(state.QcIdealVal))+
      teleRow('Qc aplicado (deslizador)',fmtKVAR(state.QcBanco))+
      teleRow('Q_neto',fmtKVAR(state.Qneto))+
      teleRow('S_result',fmtKVA(state.Sresult))+
      teleRow('FP_result',fmtFP(state.FPresult),state.compliant?'good':'warn')+
      teleRow('Cumple FP≥0.95',state.compliant?'✔ sí':'✗ no',state.compliant?'good':'warn');
  }else if(mode==='banco'){
    t.innerHTML=
      teleRow('P / FP₁ (dados)',state.P+' kW / '+state.FP1.toFixed(2))+
      teleRow('Q₁',fmtKVAR(state.Q1))+
      teleRow('Qc ideal',fmtKVAR(state.QcIdealVal))+
      teleRow('Banco instalado',fmtKVAR(state.QcBanco))+
      teleRow('Q_neto',fmtKVAR(state.Qneto))+
      teleRow('FP_result',fmtFP(state.FPresult),state.compliant?'good':'warn')+
      teleRow('Cumple FP≥0.95',state.compliant?'✔ sí':'✗ no',state.compliant?'good':'warn');
  }else{
    t.innerHTML=
      teleRow('P / FP₁ (dados)',state.P+' kW / '+state.FP1.toFixed(2))+
      teleRow('Banco propuesto',fmtKVAR(state.QcBanco))+
      teleRow('Q_neto',fmtKVAR(state.Qneto))+
      teleRow('FP_result',fmtFP(state.FPresult),state.compliant?'good':'warn')+
      teleRow('Óptimo real (oculto hasta comprobar)',retoChecked?fmtKVAR(retoMinSum):'🔒')+
      teleRow('Estado',retoChecked?(retoOk?'✔ CORRECTO':'revisa tu banco'):'Arma el banco y comprueba',(retoChecked&&retoOk)?'good':'warn');
  }
}

function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  const state=currentState();
  if(mode==='explora'){
    html+=`<span class="mono">P=${state.P} kW, FP₁=${state.FP1.toFixed(2)}. Qc ideal=${fmtKVAR(state.QcIdealVal)}. Con Qc=${fmtKVAR(state.QcBanco)} aplicado: Q_neto=${fmtKVAR(state.Qneto)}, FP_result=${fmtFP(state.FPresult)}${state.compliant?' ✔':' ✗'}.</span>`;
  }else if(mode==='banco'){
    html+=`<span class="mono">Banco instalado: ${fmtKVAR(state.QcBanco)}. FP_result=${fmtFP(state.FPresult)}${state.compliant?' ✔ cumple':' ✗ no cumple aún'}. Este modo no califica — practica la combinatoria antes del Reto.</span>`;
  }else{
    html+=retoMsg||`<span class="mono">Arma el banco con el menor kVAR posible que cumpla FP≥0.95, luego presiona "Comprobar banco".</span>`;
  }
  el('report').innerHTML=html;
}

function refreshAll(){drawBoard();updateTele();updateReport();refreshBench();}

// ===================== 11. RETO =====================
function updateRetoSpec(){
  el('retoSpec').innerHTML=`Planta: <b>P=${retoP} kW</b>, <b>FP₁=${retoFP1.toFixed(2)}</b> (atrasado). Meta: FP₂=0.95. Conecta los pasos del banco (arriba o tocando los capacitores en la escena 3D) que cumplan la meta con el <b>menor kVAR total posible</b>, luego presiona "Comprobar banco". Se califica correcto si tu banco cumple la meta Y su kVAR total está a lo más 5 kVAR por encima del óptimo real.`;
}

function checkReto(){
  const steps=retoSteps;
  const P=retoP,FP1=retoFP1;
  const Q1=Q1of(P,FP1);
  let sum=0;
  steps.forEach((on,i)=>{if(on)sum+=CAP_STEPS[i];});
  const tol=toleranceQ(P);
  const compliant=Math.abs(Q1-sum)<=tol;
  const nearOptimal=sum<=retoMinSum+5;
  retoOk=compliant&&nearOptimal;
  retoChecked=true;solved=retoOk;
  synth.beep(retoOk?1046:220,retoOk?0.14:0.15,0.06);
  const fpNow=fmtFP(P/Math.hypot(P,Q1-sum));
  if(retoOk){
    retoMsg=`<span class="mono"><span class="ok">✔ Banco correcto</span> — ${fmtKVAR(sum)}, cumple FP≥0.95 (FP_result=${fpNow}) y está a ${(sum-retoMinSum).toFixed(0)} kVAR del óptimo real (${fmtKVAR(retoMinSum)}).</span>`;
  }else if(!compliant){
    retoMsg=`<span class="mono"><span class="dtc">✗ No cumple la meta</span> — con ${fmtKVAR(sum)} instalados, FP_result=${fpNow} &lt; 0.95. Ajusta los pasos conectados.</span>`;
  }else{
    retoMsg=`<span class="mono"><span class="dtc">✗ Cumple pero no es casi-óptimo</span> — ${fmtKVAR(sum)} instalados es más de 5 kVAR por encima del banco mínimo real (${fmtKVAR(retoMinSum)}). Busca una combinación con menos kVAR total que siga cumpliendo.</span>`;
  }
  refreshAll();
}

// ===================== 12. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'Si sigues subiendo Qc en el deslizador más allá de lo necesario para cumplir la meta, ¿por qué el factor de potencia puede terminar alejándose de 1 en vez de quedarse cerca de 1?',
      opciones:[
        {t:'Porque Q_neto=Q₁−Qc cambia de signo (pasa a capacitivo) y FP_result=P/√(P²+Q_neto²) depende del valor absoluto de Q_neto: tanto sub-compensar como sobre-compensar alejan el FP de 1.',ok:true,why:'Correcto: FP_result solo depende de |Q_neto|, así que hay un único valor de Qc que anula Q_neto (FP=1, cuando Qc=Q₁) y te alejas de FP=1 tanto por defecto (inductivo) como por exceso (capacitivo) de ese punto.'},
        {t:'Porque el simulador limita el deslizador a un máximo arbitrario que no corresponde a física real.',ok:false,why:'El límite del deslizador es solo de interfaz; el fenómeno de divergencia es real y ocurre incluso con un deslizador sin límite.'},
        {t:'Porque P cambia cuando se instala más capacitor.',ok:false,why:'P es la potencia activa de la carga y no cambia al agregar reactivo capacitivo; el capacitor ideal solo aporta Q.'},
        {t:'Porque el capacitor introduce pérdidas resistivas que bajan el FP.',ok:false,why:'Este modelo trata el capacitor como reactancia ideal, sin pérdidas; el fenómeno de divergencia ocurre igual con un capacitor perfecto.'},
      ],
    },
    banco:{
      pregunta:'¿Por qué el catálogo de capacitores viene en pasos discretos (5, 10, 15… 50 kVAR) en vez de un valor continuo, y qué implica esto para armar el banco?',
      opciones:[
        {t:'Los capacitores se fabrican en tamaños estándar; armar el banco es un problema combinatorio: hay que elegir qué subconjunto de pasos sumar para caer dentro de la banda de cumplimiento.',ok:true,why:'Correcto: por eso el modo Reto no busca "el" valor exacto, sino la mejor combinación de catálogo posible.'},
        {t:'Porque los capacitores continuos están prohibidos por la norma CFE.',ok:false,why:'La norma fija el FP mínimo, no la forma constructiva del capacitor; el catálogo discreto es una realidad de fabricación, no un mandato regulatorio.'},
        {t:'Porque Qc ideal siempre coincide exactamente con la suma de todos los pasos combinados.',ok:false,why:'Casi nunca coincide exactamente — por eso existe una banda de cumplimiento en vez de exigir Qc_banco=Qc ideal.'},
        {t:'Porque cada paso debe conectarse en un orden específico o el banco se daña.',ok:false,why:'Los pasos son independientes entre sí; se pueden conectar en cualquier orden o combinación.'},
      ],
    },
    reto:{
      pregunta:'El Reto califica correcto cualquier banco que cumpla la meta y esté a lo más 5 kVAR por encima del banco real de menor kVAR (minSum). ¿Por qué no exigir exactamente ese único mínimo?',
      opciones:[
        {t:'Porque con pasos de catálogo suele haber varias combinaciones con una suma total muy cercana al mínimo que cumplen igual de bien la meta; verificado numéricamente, cada escenario tiene entre 3 y 23 combinaciones dentro de esa tolerancia de 5 kVAR.',ok:true,why:'Correcto: exigir el único mínimo exacto penalizaría combinaciones prácticamente equivalentes en la práctica de ingeniería real.'},
        {t:'Porque el simulador no puede calcular el banco mínimo real con exactitud.',ok:false,why:'El mínimo real (minSum) se calcula por búsqueda exhaustiva de las 255 combinaciones posibles antes de calificar — es exacto, no aproximado.'},
        {t:'Porque instalar de más nunca afecta el cumplimiento de la meta.',ok:false,why:'Instalar de más sí puede sacar a Q_neto de la banda de cumplimiento (sobre-corrección) — por eso el reto pide el MÍNIMO kVAR que cumpla, no cualquier exceso.'},
        {t:'Porque el banco mínimo real cambia aleatoriamente cada vez que se comprueba.',ok:false,why:'El banco mínimo real (minSum) es fijo para cada escenario P×FP₁ sorteado; solo cambia al sortear una nueva planta.'},
      ],
    },
  };
}

function clearDx(){const box=el('dxbtns');if(box)box.innerHTML='';}

function refreshQuestion(){
  const q=QUIZ[mode];
  if(!q)return;
  el('q_text').textContent=q.pregunta;
  const box=el('dxbtns');
  box.innerHTML=q.opciones.map((o,i)=>`<button class="b sm" data-i="${i}">${String.fromCharCode(65+i)}) ${o.t}</button>`).join('');
  box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>answer(parseInt(b.dataset.i,10)));
}

function answer(i){
  const q=QUIZ[mode];
  if(!q)return;
  const box=el('dxbtns');
  const btns=box.querySelectorAll('[data-i]');
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
    if(o.userData&&o.userData.stepIndex!==undefined){capClick(o.userData.stepIndex);return;}
    if(o.userData&&o.userData.title){showToast('<b>'+o.userData.title+'</b><br>'+(o.userData.info||''));return;}
    o=o.parent;
  }
});

(function hoverLoop(){
  const ray=new THREE.Raycaster();
  const dom=S.renderer.domElement;
  let mx=0,my=0;
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    mx=((e.clientX-r.left)/r.width)*2-1;
    my=-((e.clientY-r.top)/r.height)*2+1;
  });
  function tick(){
    ray.setFromCamera({x:mx,y:my},S.camera);
    let hovered=false;
    for(const [obj,spr] of HOVER_LABELS){
      if(!obj.visible){spr.visible=false;continue;}
      const hits=ray.intersectObject(obj,true);
      const on=hits.length>0;
      spr.visible=on;
      if(on)hovered=true;
    }
    dom.style.cursor=hovered?'pointer':'default';
    requestAnimationFrame(tick);
  }
  tick();
})();

// ===================== 14. RECORRIDO AUTOMÁTICO =====================
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function runAuto(){
  if(autoRunning)return;
  autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorriendo…';
  try{
    synth.init();synth.resume();
    clearDx();
    setMode('explora');
    expP=100;expFP1=0.75;expQc=0;
    afterEdit();
    showToast('🧭 Explora: planta de 100 kW con FP₁=0.75 (atrasado). Q₁='+fmtKVAR(currentState().Q1)+'.');
    await sleep(2600);

    const idealQc=currentState().QcIdealVal;
    expQc=idealQc;el('qcSlider').value=String(expQc);refreshAll();
    showToast('✅ Al llegar a Qc≈'+fmtKVAR(idealQc)+' (el ideal), el vector resultante entra en la banda de cumplimiento: FP_result='+fmtFP(currentState().FPresult)+' (cumple el mínimo regulatorio FP≥0.95).');
    await sleep(2800);

    expQc=Math.min(qcSliderMax(),idealQc*1.7);el('qcSlider').value=String(expQc);refreshAll();
    showToast('⚠️ Sobre-corregido a Qc='+fmtKVAR(expQc)+': el vector cruza al lado capacitivo y FP_result vuelve a caer a '+fmtFP(currentState().FPresult)+'.');
    await sleep(2800);
    answer(0);
    await sleep(2200);

    setMode('banco');
    bancoP=100;bancoFP1=0.75;bancoSteps=[false,false,false,false,false,false,false,false];
    afterEdit();
    showToast('🔌 Banco: misma planta (100 kW, FP₁=0.75). Conectemos pasos hasta cumplir la meta.');
    await sleep(2400);
    for(const i of [3,5,2]){
      toggleStep(i);
      showToast('Paso conectado: '+CAP_STEPS[i]+' kVAR. Banco actual: '+fmtKVAR(currentState().QcBanco)+'.');
      await sleep(2000);
      if(currentState().compliant)break;
    }
    showToast(currentState().compliant?'✔ Banco cumple la meta: FP_result='+fmtFP(currentState().FPresult)+'.':'Sigue faltando banco — en el Reto se pide el MÍNIMO que cumpla.');
    await sleep(2400);
    answer(0);
    await sleep(2200);

    setMode('reto');
    newSignal();
    showToast('🎯 Reto: nueva planta sorteada. Buscando el banco de menor kVAR que cumpla…');
    await sleep(2400);
    retoSteps=CAP_STEPS.map((v,i)=>Boolean(retoBestMask&(1<<i)));
    buildStepsBar();refreshAll();
    showToast('Banco óptimo aplicado: '+fmtKVAR(currentState().QcBanco)+' (mínimo real='+fmtKVAR(retoMinSum)+').');
    await sleep(2400);
    checkReto();
    await sleep(2400);
    answer(0);
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 15. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt,time)=>{
  const pulse=0.5+0.5*Math.sin(time*2.2);
  if(gauge.visible){
    const frac=Math.max(0.03,Math.min(1,expQc/qcSliderMax()));
    gauge.material.emissiveIntensity=0.15+0.5*frac+0.08*pulse;
  }
  cans.forEach(can=>{
    if(can.visible&&can.material.emissiveIntensity>0){
      can.material.emissiveIntensity=0.7+0.25*pulse;
    }
  });
});

['explora','banco','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=()=>{if(!autoRunning)runAuto();};
el('btnNew').onclick=()=>{if(autoRunning)return;newSignal();};
el('btnCheck').onclick=()=>{if(autoRunning)return;checkReto();};
el('qcSlider').oninput=()=>{expQc=parseFloat(el('qcSlider').value);refreshAll();};

const soundBtn=el('soundBtn');
if(soundBtn){soundBtn.onclick=()=>{synth.toggle();soundBtn.textContent=synth.isOn()?'🔊':'🔇';};}
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildQuiz();
S.start();
setMode('explora');

// ===================== DEBUG HOOK =====================
window.__labDebug={
  mode:()=>mode,
  P:()=>currentP(),
  FP1:()=>currentFP1(),
  Q1:()=>currentState().Q1,
  QcIdeal:()=>currentState().QcIdealVal,
  QcBanco:()=>currentState().QcBanco,
  Qneto:()=>currentState().Qneto,
  Sresult:()=>currentState().Sresult,
  FPresult:()=>currentState().FPresult,
  compliant:()=>currentState().compliant,
  expQc:()=>expQc,
  qcSliderMax:()=>qcSliderMax(),
  setExpQc:v=>{expQc=Math.max(0,Math.min(qcSliderMax(),v));el('qcSlider').value=String(expQc);refreshAll();},
  setExpP:v=>{expP=v;expQc=0;afterEdit();},
  setExpFP1:v=>{expFP1=v;expQc=0;afterEdit();},
  capSteps:()=>CAP_STEPS.slice(),
  bancoSteps:()=>bancoSteps.slice(),
  retoSteps:()=>retoSteps.slice(),
  toggleStep:i=>toggleStep(i),
  retoP:()=>retoP,
  retoFP1:()=>retoFP1,
  retoMinSum:()=>retoMinSum,
  retoTolerance:()=>retoMinSum+5,
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
