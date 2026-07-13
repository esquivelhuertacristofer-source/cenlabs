const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.0,3.2,6.0],target:[0,0.85,0.1],bgTop:'#0a1620',bgBot:'#03060a',bloom:0.38,minD:3.2,maxD:16});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.08,0.09,0.11), rub=rubber();
const MAT={
  bench: std({...plas, metalness:0.15, roughness:0.75}),
  scopeBody: std({...plas, color:0x1c2230, metalness:0.35, roughness:0.55}),
  jackCh1: std({...brush, color:0xe0b23c, metalness:0.85, roughness:0.3}),
  jackCh2: std({...brush, color:0x3fb8c9, metalness:0.85, roughness:0.3}),
  knobBase: std({...plas, color:0x11141a, metalness:0.3, roughness:0.6}),
  knobRub: std({...rub, color:0x2a2f38, roughness:0.9, metalness:0.0}),
  knobTick: std({color:0xffd166, roughness:0.4, metalness:0.1}),
  trigLed: std({color:0x0a1210, emissive:0x3ad9c2, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
  srcBody: std({...alu, color:0x3a4048, metalness:0.5, roughness:0.6}),
  post: std({...brush, color:0xd8b24a, metalness:0.9, roughness:0.3}),
  wireCh1: std({...rub, color:0xe0b23c, roughness:0.85, metalness:0.0}),
  wireCh2: std({...rub, color:0x3fb8c9, roughness:0.85, metalness:0.0}),
};

const PARTS=[];
const HOVER_LABELS=new Map();
function registerPart(mesh,name,desc,color){
  PARTS.push({mesh,name,desc});
  const lb=labelSprite(name,color||'#ffd166');
  lb.position.copy(mesh.position);
  lb.position.y+=0.62;
  lb.visible=false; lb.raycast=()=>{};
  (mesh.parent||scene).add(lb);
  HOVER_LABELS.set(mesh,lb);
}

const toast=document.getElementById('toast');
function showToast(html){
  toast.innerHTML=html;
  toast.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);
}

/* ---------- 1) BANCO ---------- */
const bench=roundedBox(6.6,0.28,3.7,MAT.bench,0.05);
bench.position.set(0,-0.02,0);
scene.add(bench);

/* ---------- 2) OSCILOSCOPIO ---------- */
const scopeGroup=new THREE.Group();
scopeGroup.position.set(-1.4,0.77,-0.1);
scene.add(scopeGroup);

const scopeBody=roundedBox(1.9,1.30,1.15,MAT.scopeBody,0.09);
scopeGroup.add(scopeBody);
registerPart(scopeBody,'Osciloscopio','Instrumento que dibuja el voltaje contra el tiempo en una pantalla cuadriculada — te permite VER la forma de la onda, no solo un número.','#5eead4');

const scrCanvas=document.createElement('canvas');
scrCanvas.width=300; scrCanvas.height=240;
const scrTex=new THREE.CanvasTexture(scrCanvas);
scrTex.colorSpace=THREE.SRGBColorSpace;
scrTex.minFilter=THREE.LinearFilter;
scrTex.generateMipmaps=false;
const screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(1.10,0.88),new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false}));
screenMesh.position.set(0,0.32,0.585);
scopeGroup.add(screenMesh);
registerPart(screenMesh,'Pantalla','Cuadrícula de 10×8 divisiones. Cada división vale lo que definan los controles de base de tiempo (horizontal) y volts/división (vertical).','#5eead4');

const jackCh1=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.05,16),MAT.jackCh1);
jackCh1.rotation.x=Math.PI/2;
jackCh1.position.set(-0.75,-0.30,0.585);
scopeGroup.add(jackCh1);
registerPart(jackCh1,'Entrada CH1 (BNC)','Conector del canal 1 (amarillo). Aquí se conecta la punta de prueba que trae la señal de referencia.','#ffd166');

const jackCh2=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.05,16),MAT.jackCh2);
jackCh2.rotation.x=Math.PI/2;
jackCh2.position.set(-0.55,-0.30,0.585);
scopeGroup.add(jackCh2);
registerPart(jackCh2,'Entrada CH2 (BNC)','Conector del canal 2 (cian). Se usa para comparar una segunda señal contra la del canal 1 — por ejemplo, para medir un desfase.','#4fd1c5');

function makeKnob(x,y,label,desc){
  const g=new THREE.Group();
  g.position.set(x,y,0.585);
  g.rotation.x=Math.PI/2;
  scopeGroup.add(g);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.08,0.04,18),MAT.knobBase);
  g.add(base);
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.065,0.07,18),MAT.knobRub);
  grip.position.y=0.045;
  g.add(grip);
  const tick=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.05,0.012),MAT.knobTick);
  tick.position.set(0,0.02,0.058);
  grip.add(tick);
  registerPart(g,label,desc,'#ffd166');
  return grip;
}
const knobTimeGrip=makeKnob(-0.15,-0.30,'Perilla Base de Tiempo','Controla cuántos microsegundos o milisegundos representa cada división horizontal de la pantalla.');
const knobV1Grip=makeKnob(0.10,-0.30,'Perilla Volts/Div · CH1','Controla cuántos volts representa cada división vertical para el canal 1.');
const knobV2Grip=makeKnob(0.35,-0.30,'Perilla Volts/Div · CH2','Controla cuántos volts representa cada división vertical para el canal 2 (no se ejercita en estos 4 casos).');
const knobLevelGrip=makeKnob(0.62,-0.30,'Perilla Nivel de Disparo','Define el voltaje al que debe cruzar la señal para que el osciloscopio "dispare" y congele una imagen estable.');

const trigLed=new THREE.Mesh(new THREE.SphereGeometry(0.035,12,12),MAT.trigLed);
trigLed.position.set(0.85,0.62,0.585);
scopeGroup.add(trigLed);
registerPart(trigLed,"Indicador de disparo (TRIG'D)","Se enciende cuando el osciloscopio logra sincronizar (disparar) con la señal y la traza queda estable.",'#3ad9c2');

/* ---------- 3) GENERADOR DE SEÑALES ---------- */
const srcGroup=new THREE.Group();
srcGroup.position.set(1.6,0.40,0.3);
scene.add(srcGroup);
const srcBody=roundedBox(0.85,0.55,0.62,MAT.srcBody,0.08);
srcGroup.add(srcBody);
registerPart(srcBody,'Generador de señales','Fuente de la señal de prueba (onda senoidal) que el osciloscopio va a medir. En un banco real sería un generador de funciones de laboratorio.','#ffb454');

const termA=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.09,12),MAT.post);
termA.position.set(-0.15,0.32,0.20);
srcGroup.add(termA);
registerPart(termA,'Terminal de salida (CH1)','Punto de conexión de la señal senoidal de prueba hacia el canal 1.','#ffd166');

const termB=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.09,12),MAT.post);
termB.position.set(0.15,0.32,0.20);
srcGroup.add(termB);
registerPart(termB,'Terminal de salida (CH2)','Punto de conexión de la misma señal (desfasada por un circuito bajo prueba) hacia el canal 2.','#4fd1c5');

/* ---------- 4) CABLEADO ---------- */
function cableTube(points,radius,mat){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,8,false),mat);
  scene.add(m);
  return m;
}
const cableCh1=cableTube([[-2.15,0.47,0.485],[-0.35,0.85,0.9],[1.45,0.72,0.50]],0.028,MAT.wireCh1);
registerPart(cableCh1,'Punta de prueba CH1','Cable coaxial que lleva la señal de referencia desde el generador hasta la entrada CH1.','#ffd166');

const cableCh2=cableTube([[-1.95,0.47,0.485],[-0.10,0.80,1.05],[1.75,0.72,0.50]],0.028,MAT.wireCh2);
registerPart(cableCh2,'Punta de prueba CH2','Cable coaxial que lleva la señal del canal 2 desde el generador hasta la entrada CH2.','#4fd1c5');

/* ---------- 5) RENDERIZADO DE PANTALLA ---------- */
const DIVX=10, DIVY=8;
function drawGrid(ctx,W,H){
  ctx.strokeStyle='#123028'; ctx.lineWidth=1;
  const stepX=W/DIVX, stepY=H/DIVY;
  for(let i=1;i<DIVX;i++){ ctx.beginPath(); ctx.moveTo(i*stepX,0); ctx.lineTo(i*stepX,H); ctx.stroke(); }
  for(let j=1;j<DIVY;j++){ ctx.beginPath(); ctx.moveTo(0,j*stepY); ctx.lineTo(W,j*stepY); ctx.stroke(); }
  ctx.strokeStyle='#1d4a3c'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
}
function drawTrace(ctx,W,H,o){
  const totalUs=o.timePerDivUs*DIVX;
  const N=220;
  const phaseRad=o.walk?(Math.random()*Math.PI*2):((o.phaseDeg||0)*Math.PI/180);
  ctx.strokeStyle=o.color; ctx.lineWidth=2.2; ctx.beginPath();
  for(let i=0;i<=N;i++){
    const tUs=(i/N)*totalUs;
    const v=(o.offset||0)+o.amp*Math.sin(2*Math.PI*o.freq*(tUs/1e6)+phaseRad);
    const x=(i/N)*W;
    const yRaw=H/2-(v/o.voltsPerDiv)*(H/DIVY);
    const y=Math.max(2,Math.min(H-2,yRaw));
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
}
function drawZeroTick(ctx,W,H,timePerDivUs,freq,phaseDeg,color){
  const phaseRad=phaseDeg*Math.PI/180;
  const period=1/freq;
  let t0=(-phaseRad)/(2*Math.PI*freq);
  t0=((t0%period)+period)%period;
  const totalS=(timePerDivUs*DIVX)/1e6;
  if(t0>totalS) return;
  const x=(t0/totalS)*W, y=H/2;
  ctx.strokeStyle=color; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(x,y-9); ctx.lineTo(x,y+9); ctx.stroke();
  ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
}
function updateScreen(){
  const ctx=scrCanvas.getContext('2d');
  const W=scrCanvas.width, H=scrCanvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#03110c'; ctx.fillRect(0,0,W,H);
  if(!energized){ scrTex.needsUpdate=true; return; }
  drawGrid(ctx,W,H);

  if(scenarioKey==='basetiempo'){
    const td=C1_TIMEDIV.find(x=>x.key===timeDivKey), vd=C1_VOLTDIV.find(x=>x.key===voltDivKey);
    drawTrace(ctx,W,H,{timePerDivUs:td.us,voltsPerDiv:vd.v,freq:C1_FREQ,amp:C1_VAMP,color:'#ffd166'});
  } else if(scenarioKey==='acoplamiento'){
    if(couplingKey==='gnd'){
      drawTrace(ctx,W,H,{timePerDivUs:C2_TIMEDIV_US,voltsPerDiv:C2_VOLTDIV_V,freq:1,amp:0,offset:0,color:'#ffd166'});
    } else {
      const offset=couplingKey==='dc'?C2_OFFSET:0;
      drawTrace(ctx,W,H,{timePerDivUs:C2_TIMEDIV_US,voltsPerDiv:C2_VOLTDIV_V,freq:C2_FREQ,amp:C2_VAMP,offset,color:'#ffd166'});
    }
  } else if(scenarioKey==='trigger'){
    const lvl=C3_LEVELS.find(x=>x.key===triggerLevelKey).v;
    const canTrig=Math.abs(lvl)<C3_VAMP;
    const base={timePerDivUs:C3_TIMEDIV_US,voltsPerDiv:C3_VOLTDIV_V,freq:C3_FREQ,amp:C3_VAMP,color:'#ffd166'};
    if(triggerMode==='normal'){
      if(canTrig) drawTrace(ctx,W,H,base);
      else { ctx.font='bold 14px monospace'; ctx.fillStyle='#f4475e'; ctx.textAlign='center'; ctx.fillText('SIN DISPARO',W/2,H/2); ctx.textAlign='left'; }
    } else if(triggerMode==='auto'){
      if(canTrig) drawTrace(ctx,W,H,base);
      else {
        drawTrace(ctx,W,H,{...base,walk:true});
        ctx.font='10px monospace'; ctx.fillStyle='#f4a52a'; ctx.textAlign='center'; ctx.fillText('AUTO · sin disparo real',W/2,H-10); ctx.textAlign='left';
      }
    } else {
      if(!single.armed){ ctx.font='12px monospace'; ctx.fillStyle='#8fb3ac'; ctx.textAlign='center'; ctx.fillText('PULSA "ARMAR"',W/2,H/2); ctx.textAlign='left'; }
      else if(!single.captured){ ctx.font='11px monospace'; ctx.fillStyle='#f4a52a'; ctx.textAlign='center'; ctx.fillText('ESPERANDO DISPARO…',W/2,H/2); ctx.textAlign='left'; }
      else { drawTrace(ctx,W,H,base); ctx.font='9px monospace'; ctx.fillStyle='#5eead4'; ctx.textAlign='center'; ctx.fillText('CAPTURA ÚNICA',W/2,H-10); ctx.textAlign='left'; }
    }
  } else if(scenarioKey==='fase'){
    const ph=C4_PHASES.find(x=>x.key===phaseKey).deg;
    const base={timePerDivUs:C4_TIMEDIV_US,voltsPerDiv:C4_VOLTDIV_V,freq:C4_FREQ,amp:C4_VAMP};
    drawTrace(ctx,W,H,{...base,phaseDeg:0,color:'#ffd166'});
    drawTrace(ctx,W,H,{...base,phaseDeg:-ph,color:'#4fd1c5'});
    if(ph>0){
      drawZeroTick(ctx,W,H,C4_TIMEDIV_US,C4_FREQ,0,'#ffd166');
      drawZeroTick(ctx,W,H,C4_TIMEDIV_US,C4_FREQ,-ph,'#4fd1c5');
    }
  }
  scrTex.needsUpdate=true;
}

/* ---------- 6) INSPECCIÓN POR CLIC ---------- */
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit) return;
  let o=hit.object;
  while(o){
    const p=PARTS.find(x=>x.mesh===o);
    if(p){ showToast(`<b style="color:var(--accent)">${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.desc}</span>`); return; }
    o=o.parent;
  }
});

/* ---------- 7) ETIQUETAS HOVER ---------- */
(function(){
  const dom=S.renderer.domElement, ray=new THREE.Raycaster(), mv=new THREE.Vector2();
  let shown=null;
  const setShown=lb=>{
    if(shown===lb) return;
    if(shown) shown.visible=false;
    shown=lb;
    if(shown) shown.visible=true;
  };
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    mv.x=((e.clientX-r.left)/r.width)*2-1;
    mv.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(mv,S.camera);
    const hits=ray.intersectObjects(scene.children,true);
    let found=null;
    for(const h of hits){
      let o=h.object;
      while(o){
        if(HOVER_LABELS.has(o)){ found=HOVER_LABELS.get(o); break; }
        o=o.parent;
      }
      if(found) break;
    }
    setShown(found);
  });
  dom.addEventListener('pointerleave',()=>setShown(null));
})();

/* ---------- 8) MODELO DE DATOS ---------- */
const C1_FREQ=500, C1_T_MS=1000/C1_FREQ, C1_VAMP=2.0, C1_VPP=C1_VAMP*2, C1_VRMS=C1_VAMP*0.707;
const C1_TIMEDIV=[
  {key:'rapido',us:50,label:'50 µs/div',ok:false},
  {key:'ok',us:500,label:'500 µs/div',ok:true},
  {key:'lento',us:5000,label:'5 ms/div',ok:false},
];
const C1_VOLTDIV=[
  {key:'chico',v:0.2,label:'0.2 V/div',ok:false},
  {key:'ok',v:1,label:'1 V/div',ok:true},
  {key:'grande',v:5,label:'5 V/div',ok:false},
];

const C2_FREQ=200, C2_T_MS=1000/C2_FREQ, C2_VAMP=1.5, C2_OFFSET=2.5;
const C2_TIMEDIV_US=1000, C2_VOLTDIV_V=1;

const C3_FREQ=300, C3_T_MS=1000/C3_FREQ, C3_VAMP=2.0;
const C3_TIMEDIV_US=1000, C3_VOLTDIV_V=1;
const C3_LEVELS=[
  {key:'alto',v:3,label:'+3.0 V (alto)'},
  {key:'medio',v:0,label:'0.0 V (medio)'},
  {key:'bajo',v:-3,label:'−3.0 V (bajo)'},
];

const C4_FREQ=250, C4_T_MS=1000/C4_FREQ, C4_VAMP=2.0;
const C4_TIMEDIV_US=1000, C4_VOLTDIV_V=1;
const C4_PHASES=[
  {key:'fase0',deg:0,label:'0° (en fase)'},
  {key:'fase90',deg:90,label:'90° (cuadratura)'},
  {key:'reto',deg:45,label:'Caso a medir'},
];

const SCEN_ORDER=['basetiempo','acoplamiento','trigger','fase'];
const SCEN_LABEL={
  basetiempo:'Caso 1 · Base de tiempo',
  acoplamiento:'Caso 2 · Acoplamiento',
  trigger:'Caso 3 · Trigger',
  fase:'Caso 4 · Fase entre canales',
};
const QUESTIONS={
  basetiempo:{
    prompt:'Con la base de tiempo correcta (500 µs/div), un ciclo completo ocupa 4 divisiones horizontales. ¿Cuál es la frecuencia de la señal?',
    opts:[
      {t:'T = 4 ms → f = 250 Hz',ok:false},
      {t:'T = 0.5 ms → f = 2000 Hz',ok:false},
      {t:'T = 2 ms → f = 500 Hz',ok:true},
      {t:'T = 5 ms → f = 200 Hz',ok:false},
    ],
  },
  acoplamiento:{
    prompt:'Quieres medir SOLO el offset de CD de esta señal, sin su componente de CA. ¿Cuál es el procedimiento correcto?',
    opts:[
      {t:'Dejar el acoplamiento en AC y leer el valor pico',ok:false},
      {t:'Cambiar a GND para marcar 0 V, luego a DC y medir el desplazamiento',ok:true},
      {t:'Quedarse en GND y leer directamente donde está la traza',ok:false},
      {t:'Reducir el volts/div hasta que la traza quepa en pantalla',ok:false},
    ],
  },
  trigger:{
    prompt:'Modo Normal, nivel de disparo en +3.0 V; la señal real solo llega a ±2.0 V. ¿Qué observas en pantalla?',
    opts:[
      {t:'La señal se ve perfectamente estable',ok:false},
      {t:'El osciloscopio se apaga solo',ok:false},
      {t:'La frecuencia medida se duplica',ok:false},
      {t:'Pantalla congelada o vacía: la condición de disparo nunca se cumple',ok:true},
    ],
  },
  fase:{
    prompt:'En el caso a medir: Δt = 0.5 ms entre los cruces por cero de CH1 y CH2, con T = 4 ms. ¿Cuál es el desfase?',
    opts:[
      {t:'Δφ = (0.5/4)° = 0.125°',ok:false},
      {t:'Δφ = 360°×(0.5/4) = 45°',ok:true},
      {t:'Δφ = 360°×(4/0.5) = 2880°',ok:false},
      {t:'Δφ = 360°×(0.5×4) = 720°',ok:false},
    ],
  },
};
const DX_HINT={
  basetiempo:'A 500 µs/div, un ciclo completo ocupa 4 divisiones horizontales: T = 4 × 500 µs = 2 ms → f = 1/T = 500 Hz.',
  acoplamiento:'GND desconecta la entrada y siempre marca 0 V — es tu referencia. Cambia a DC y mide cuánto se desplazó la traza respecto a esa marca: esa distancia ES el offset de CD. AC, en cambio, elimina la CD con un filtro paso-alto (corte típico 5–10 Hz), así que nunca la mostrará.',
  trigger:'En Normal, el barrido solo ocurre si la señal cruza el nivel de disparo. Si ese nivel está fuera del rango real de la señal (aquí ±2.0 V), la condición nunca se cumple y la pantalla se congela o queda vacía — no significa que el instrumento esté descompuesto.',
  fase:'Δφ° = 360° × (Δt/T) = 360° × (0.5 ms / 4 ms) = 360° × 0.125 = 45°.',
};

let scenarioKey='basetiempo';
let energized=false;
let timeDivKey='rapido';
let voltDivKey='chico';
let couplingKey='gnd';
let triggerMode='normal';
let triggerLevelKey='alto';
let single={armed:false,captured:false};
let phaseKey='fase0';

/* ---------- 9) ANIMACIÓN ---------- */
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:2200,Q:0.7});
const KNOB_ANGLES=[-0.5,0,0.5];
S.setAnimate((dt,time)=>{
  if(scenarioKey==='trigger' && triggerMode==='single' && single.armed && !single.captured){
    const lvl=C3_LEVELS.find(x=>x.key===triggerLevelKey).v;
    if(Math.abs(lvl)<C3_VAMP){
      single.captured=true;
      synth.beep(1200,0.08,0.05);
      showToast('Captura única adquirida — cambia el nivel y observa que la pantalla ya NO se actualiza hasta que vuelvas a armar.');
    }
  }

  const tdIdx=Math.max(0,C1_TIMEDIV.findIndex(x=>x.key===timeDivKey));
  const lvIdx=Math.max(0,C3_LEVELS.findIndex(x=>x.key===triggerLevelKey));
  const vdIdx=Math.max(0,C1_VOLTDIV.findIndex(x=>x.key===voltDivKey));
  knobTimeGrip.rotation.y+=(KNOB_ANGLES[tdIdx]-knobTimeGrip.rotation.y)*Math.min(1,dt*5);
  knobLevelGrip.rotation.y+=(KNOB_ANGLES[lvIdx]-knobLevelGrip.rotation.y)*Math.min(1,dt*5);
  knobV1Grip.rotation.y+=(KNOB_ANGLES[vdIdx]-knobV1Grip.rotation.y)*Math.min(1,dt*5);

  const pulse=0.5+0.5*Math.sin(time*3.2);
  let locked=false;
  if(energized){
    if(scenarioKey==='trigger'){
      if(triggerMode==='single') locked=single.captured;
      else locked=Math.abs(C3_LEVELS.find(x=>x.key===triggerLevelKey).v)<C3_VAMP;
    } else locked=true;
  }
  trigLed.material.emissiveIntensity = !energized?0.05:(locked?(0.6+0.3*pulse):(0.12+0.12*pulse));

  updateTele();
  if(time-(updateScreen._t||0)>0.22){ updateScreen(); updateScreen._t=time; }

  const freqNow={basetiempo:C1_FREQ,acoplamiento:C2_FREQ,trigger:C3_FREQ,fase:C4_FREQ}[scenarioKey];
  synth.update(freqNow,freqNow,energized?0.035:0,2200);
});

/* ---------- 10) HUD ---------- */
document.getElementById('hud').innerHTML=`
<div class="eyebrow">Dominio D10 · Instrumentación</div>
<h2>Osciloscopio Digital</h2>
<p>El multímetro te da un número; el <b>osciloscopio</b> te deja VER la forma de la señal contra el tiempo. Domina sus 3 controles básicos — base de tiempo, acoplamiento y disparo (trigger) — antes de intentar medir nada con él.</p>
<div class="formula">Vpp = 2 × V_pico<br>V_rms = V_pico × 0.707 (= V_pico / √2)<br>f = 1 / T<br>Δφ° = 360° × (Δt / T)</div>
<div class="legend">
  <div class="li"><span class="dot" style="background:#ffd166"></span>Canal 1 (CH1)</div>
  <div class="li"><span class="dot" style="background:#4fd1c5"></span>Canal 2 (CH2)</div>
  <div class="li"><span class="dot" style="background:#f4475e"></span>Sin disparo / fuera de rango</div>
</div>
<div class="fid">
  <div class="ft">🔒 Contrato de fidelidad</div>
  <div class="fl"><b>Sí modela:</b> la relación Vpp/V_pico/V_rms de una onda senoidal, f = 1/T por lectura directa de divisiones, el efecto del acoplamiento DC (señal completa), AC (filtro paso-alto, quita la componente de CD) y GND (referencia de 0 V), los 3 modos de disparo — Auto, Normal y Single — incluyendo qué ocurre cuando el nivel de disparo queda fuera del rango de la señal, y la medición de desfase entre 2 canales por cruces por cero.</div>
  <div class="fl no"><b>NO modela:</b> el ancho de banda real del instrumento ni su punto −3 dB, ruido o jitter de disparo, la curva de atenuación exacta del filtro de acoplamiento AC (aquí se simplifica como remoción limpia de la CD), sondas atenuadas 10:1 (se estudian en la siguiente práctica), análisis FFT/espectral, ni modelos comerciales específicos.</div>
</div>
<div class="src">Ref: IEC 61010-1 + IEC 61010-2-030 (seguridad, osciloscopios) · sin norma de exactitud obligatoria — consulta la hoja de datos de tu instrumento.</div>
`;

/* ---------- 11) PANEL ---------- */
document.getElementById('panel').innerHTML=`
<h4>Osciloscopio · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span></h4>
<div class="modebar">
  <button class="b on" id="s_basetiempo">Base de tiempo</button>
  <button class="b" id="s_acoplamiento">Acoplamiento</button>
  <button class="b" id="s_trigger">Trigger</button>
  <button class="b" id="s_fase">Fase</button>
</div>
<div class="console" id="console">Pulsa "🔌 Conectar generador" para iniciar.</div>
<div id="tele">
  <div class="g"><div class="gl"><span>Vpp medido</span><b id="t_vpp">—</b></div></div>
  <div class="g"><div class="gl"><span>Periodo T</span><b id="t_t">—</b></div></div>
  <div class="g"><div class="gl"><span>Frecuencia f</span><b id="t_f">—</b></div></div>
  <div class="g"><div class="gl"><span>Acoplamiento</span><b id="t_coup">—</b></div></div>
  <div class="g"><div class="gl"><span>Disparo</span><b id="t_trig">—</b></div></div>
  <div class="g"><div class="gl"><span>Estado</span><b id="t_trigstate">—</b></div></div>
  <div class="g"><div class="gl"><span>Δt / Δφ</span><b id="t_phase">—</b></div></div>
</div>

<div id="ctrlBasetiempo">
  <h4 class="sec">Base de tiempo</h4>
  <div class="modebar" id="mb_timediv">${C1_TIMEDIV.map(x=>`<button class="b${x.key==='rapido'?' on':''}" data-k="${x.key}">${x.label}</button>`).join('')}</div>
  <h4 class="sec">Volts/división (CH1)</h4>
  <div class="modebar" id="mb_voltdiv">${C1_VOLTDIV.map(x=>`<button class="b${x.key==='chico'?' on':''}" data-k="${x.key}">${x.label}</button>`).join('')}</div>
</div>

<div id="ctrlAcoplamiento" style="display:none">
  <h4 class="sec">Acoplamiento</h4>
  <div class="modebar" id="mb_coupling">
    <button class="b" data-k="dc">DC</button>
    <button class="b" data-k="ac">AC</button>
    <button class="b on" data-k="gnd">GND</button>
  </div>
</div>

<div id="ctrlTrigger" style="display:none">
  <h4 class="sec">Modo de disparo</h4>
  <div class="modebar" id="mb_trigmode">
    <button class="b" data-k="auto">Auto</button>
    <button class="b on" data-k="normal">Normal</button>
    <button class="b" data-k="single">Single</button>
  </div>
  <h4 class="sec">Nivel de disparo</h4>
  <div class="modebar" id="mb_triglevel">${C3_LEVELS.map(x=>`<button class="b${x.key==='alto'?' on':''}" data-k="${x.key}">${x.label}</button>`).join('')}</div>
  <div class="btns" id="singleWrap" style="display:none">
    <button class="b" id="btnArm">🎯 Armar (Single)</button>
  </div>
</div>

<div id="ctrlFase" style="display:none">
  <h4 class="sec">Desfase CH2 respecto a CH1</h4>
  <div class="modebar" id="mb_phase">${C4_PHASES.map(x=>`<button class="b${x.key==='fase0'?' on':''}" data-k="${x.key}">${x.label}</button>`).join('')}</div>
</div>

<h4 class="sec" id="q_prompt">—</h4>
<div class="btns" id="dxWrap">
  <button class="b dx" data-i="0">A</button>
  <button class="b dx" data-i="1">B</button>
  <button class="b dx" data-i="2">C</button>
  <button class="b dx" data-i="3">D</button>
</div>

<div class="btns">
  <button class="b auto" id="btnAuto">✨ Demostración guiada (4 casos)</button>
  <button class="b primary" id="btnEnergize">🔌 Conectar generador</button>
  <button class="b" id="btnNext">🔀 Siguiente caso</button>
</div>
`;

/* ---------- 12) HELPERS DE UI ---------- */
function tf(v,dp=0){ return (v===undefined||v===null)?'—':(+v).toFixed(dp); }
const el=id=>document.getElementById(id);
const consoleEl=el('console');

function setConsole(){
  if(!energized){
    consoleEl.innerHTML=`Generador apagado. Pulsa <span style="color:var(--accent)">"🔌 Conectar generador"</span> para alimentar la señal de prueba.`;
    return;
  }
  const desc={
    basetiempo:'Onda senoidal de prueba. Ajusta la base de tiempo y volts/división hasta obtener una traza legible.',
    acoplamiento:'Señal con offset de CD (como un sensor real). Cambia el acoplamiento para separar la parte de CA de la de CD.',
    trigger:'Misma señal senoidal — ahora el reto es el disparo (trigger). Prueba distintos modos y niveles.',
    fase:'CH1 es la referencia; CH2 es la misma señal retrasada por un circuito bajo prueba (p. ej. un filtro RC). Mide el desfase.',
  }[scenarioKey];
  consoleEl.innerHTML=`<b>${SCEN_LABEL[scenarioKey]}</b><br>${desc}`;
}

function updateTele(){
  if(!energized){
    ['t_vpp','t_t','t_f','t_coup','t_trig','t_trigstate','t_phase'].forEach(id=>{ el(id).textContent='—'; el(id).className=''; });
    return;
  }
  if(scenarioKey==='basetiempo'){
    const td=C1_TIMEDIV.find(x=>x.key===timeDivKey), vd=C1_VOLTDIV.find(x=>x.key===voltDivKey);
    el('t_vpp').textContent = vd.ok?`${C1_VPP.toFixed(2)} V (Vrms ${C1_VRMS.toFixed(2)} V)`:'— (ajusta volts/div)';
    el('t_vpp').className = vd.ok?'good':'warn';
    el('t_t').textContent = td.ok?C1_T_MS.toFixed(2)+' ms':'— (ajusta base de tiempo)';
    el('t_t').className = td.ok?'good':'warn';
    el('t_f').textContent = td.ok?C1_FREQ.toFixed(0)+' Hz':'—';
    el('t_f').className = td.ok?'good':'';
    el('t_coup').textContent='—'; el('t_coup').className='';
    el('t_trig').textContent='—'; el('t_trig').className='';
    el('t_trigstate').textContent='—'; el('t_trigstate').className='';
    el('t_phase').textContent='—'; el('t_phase').className='';
  } else if(scenarioKey==='acoplamiento'){
    el('t_vpp').textContent='—'; el('t_vpp').className='';
    el('t_t').textContent='—'; el('t_t').className='';
    el('t_f').textContent='—'; el('t_f').className='';
    el('t_coup').textContent={dc:'DC (señal completa)',ac:'AC (sin offset)',gnd:'GND (referencia 0 V)'}[couplingKey];
    el('t_coup').className='good';
    el('t_trig').textContent='—'; el('t_trig').className='';
    el('t_trigstate').textContent='—'; el('t_trigstate').className='';
    if(couplingKey==='dc'){ el('t_phase').textContent='Offset ≈ '+C2_OFFSET.toFixed(2)+' V (confírmalo con GND)'; el('t_phase').className='good'; }
    else if(couplingKey==='gnd'){ el('t_phase').textContent='Referencia de 0 V marcada'; el('t_phase').className=''; }
    else { el('t_phase').textContent='Offset removido (filtro paso-alto ~5–10 Hz)'; el('t_phase').className=''; }
  } else if(scenarioKey==='trigger'){
    const lvl=C3_LEVELS.find(x=>x.key===triggerLevelKey);
    const canTrig=Math.abs(lvl.v)<C3_VAMP;
    el('t_vpp').textContent='—'; el('t_vpp').className='';
    el('t_t').textContent='—'; el('t_t').className='';
    el('t_f').textContent='—'; el('t_f').className='';
    el('t_coup').textContent='—'; el('t_coup').className='';
    el('t_trig').textContent={auto:'Auto',normal:'Normal',single:'Single'}[triggerMode]+' · nivel '+lvl.label;
    el('t_trig').className='';
    let state;
    if(triggerMode==='normal') state=canTrig?'DISPARADO (estable)':'SIN DISPARO';
    else if(triggerMode==='auto') state=canTrig?'DISPARADO (estable)':'BARRIDO FORZADO (sin sync)';
    else state=!single.armed?'SIN ARMAR':(single.captured?'CAPTURA ÚNICA retenida':'ESPERANDO DISPARO…');
    el('t_trigstate').textContent=state;
    el('t_trigstate').className = (state.indexOf('DISPARADO')===0||state.indexOf('retenida')>=0)?'good':(state==='SIN DISPARO'?'bad':'warn');
    el('t_phase').textContent='—'; el('t_phase').className='';
  } else if(scenarioKey==='fase'){
    const ph=C4_PHASES.find(x=>x.key===phaseKey);
    el('t_vpp').textContent='—'; el('t_vpp').className='';
    el('t_t').textContent=C4_T_MS.toFixed(2)+' ms'; el('t_t').className='good';
    el('t_f').textContent=C4_FREQ.toFixed(0)+' Hz'; el('t_f').className='good';
    el('t_coup').textContent='—'; el('t_coup').className='';
    el('t_trig').textContent='—'; el('t_trig').className='';
    el('t_trigstate').textContent='—'; el('t_trigstate').className='';
    const dt=C4_T_MS*(ph.deg/360);
    el('t_phase').textContent='Δt = '+dt.toFixed(3)+' ms → Δφ = '+ph.deg.toFixed(0)+'°';
    el('t_phase').className='good';
  }
}

function refreshCaseLabel(){ el('p_case').textContent='Caso '+(SCEN_ORDER.indexOf(scenarioKey)+1)+'/4'; }
function clearDx(){ document.querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong')); }
function renderQuestion(){
  const q=QUESTIONS[scenarioKey];
  const qEl=el('q_prompt');
  qEl.textContent=q.prompt;
  qEl.style.textTransform='none'; // uppercase would turn "µs" into "Ms" (Greek Mu ≈ Latin M), reading as milliseconds
  document.querySelectorAll('#dxWrap .b.dx').forEach((btn,i)=>{
    const o=q.opts[i];
    btn.textContent=String.fromCharCode(65+i)+' · '+o.t;
    btn.dataset.ok=o.ok?'1':'0';
  });
}

/* ---------- 13) INTERACCIÓN ---------- */
function setScenario(key){
  scenarioKey=key;
  clearDx();
  single.armed=false; single.captured=false;
  ['s_basetiempo','s_acoplamiento','s_trigger','s_fase'].forEach(id=>el(id).classList.toggle('on',id==='s_'+key));
  el('ctrlBasetiempo').style.display = key==='basetiempo'?'':'none';
  el('ctrlAcoplamiento').style.display = key==='acoplamiento'?'':'none';
  el('ctrlTrigger').style.display = key==='trigger'?'':'none';
  el('ctrlFase').style.display = key==='fase'?'':'none';
  renderQuestion();
  refreshCaseLabel();
  setConsole();
}

function setTimeDiv(k){ timeDivKey=k; document.querySelectorAll('#mb_timediv .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setVoltDiv(k){ voltDivKey=k; document.querySelectorAll('#mb_voltdiv .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setCoupling(k){ couplingKey=k; document.querySelectorAll('#mb_coupling .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setTriggerMode(k){
  triggerMode=k;
  document.querySelectorAll('#mb_trigmode .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
  el('singleWrap').style.display = k==='single'?'':'none';
  single.armed=false; single.captured=false;
  setConsole();
}
function setTriggerLevel(k){
  triggerLevelKey=k;
  document.querySelectorAll('#mb_triglevel .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
  if(triggerMode==='single'){ single.armed=false; single.captured=false; }
  setConsole();
}
function setPhase(k){ phaseKey=k; document.querySelectorAll('#mb_phase .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }

el('s_basetiempo').onclick=()=>setScenario('basetiempo');
el('s_acoplamiento').onclick=()=>setScenario('acoplamiento');
el('s_trigger').onclick=()=>setScenario('trigger');
el('s_fase').onclick=()=>setScenario('fase');

document.querySelectorAll('#mb_timediv .b').forEach(btn=>btn.onclick=()=>setTimeDiv(btn.dataset.k));
document.querySelectorAll('#mb_voltdiv .b').forEach(btn=>btn.onclick=()=>setVoltDiv(btn.dataset.k));
document.querySelectorAll('#mb_coupling .b').forEach(btn=>btn.onclick=()=>setCoupling(btn.dataset.k));
document.querySelectorAll('#mb_trigmode .b').forEach(btn=>btn.onclick=()=>setTriggerMode(btn.dataset.k));
document.querySelectorAll('#mb_triglevel .b').forEach(btn=>btn.onclick=()=>setTriggerLevel(btn.dataset.k));
document.querySelectorAll('#mb_phase .b').forEach(btn=>btn.onclick=()=>setPhase(btn.dataset.k));

el('btnArm').onclick=()=>{
  single.armed=true; single.captured=false;
  synth.beep(660,0.08,0.05);
  showToast('Single armado — esperando disparo...');
  setConsole();
};

document.querySelectorAll('#dxWrap .b.dx').forEach(btn=>{
  btn.onclick=()=>{
    if(!energized){ showToast('Primero conecta el generador de señales.'); return; }
    const ok=btn.dataset.ok==='1';
    clearDx();
    if(ok){
      btn.classList.add('right');
      synth.beep(1046,0.12,0.06);
      showToast(`<span style="color:var(--good)">✔ Correcto</span><br><span style="color:var(--dim);font-size:11px">${DX_HINT[scenarioKey]}</span>`);
    } else {
      btn.classList.add('wrong');
      synth.beep(220,0.15,0.06);
      showToast(`<span style="color:var(--bad)">✗ No es correcta.</span><br><span style="color:var(--dim);font-size:11px">Revisa la pantalla y los controles actuales, luego inténtalo de nuevo.</span>`);
    }
  };
});

el('btnEnergize').onclick=(e)=>{
  energized=!energized;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',energized);
  e.target.textContent=energized?'⏻ Desconectar generador':'🔌 Conectar generador';
  if(energized){
    S.moveTo([2.6,2.0,4.2],[-1.2,0.75,0.2],1.3);
    S.setCinematicIdle(true);
    synth.beep(660,0.1,0.06);
  } else {
    S.setCinematicIdle(false);
  }
  setConsole();
};

el('btnNext').onclick=()=>{
  const i=SCEN_ORDER.indexOf(scenarioKey);
  setScenario(SCEN_ORDER[(i+1)%SCEN_ORDER.length]);
};

const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{ const on=synth.toggle(); soundBtn.textContent=on?'🔊':'🔇'; soundBtn.classList.toggle('on',on); };

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let autoRunning=false;
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const btn=el('btnAuto'); const label=btn.textContent;
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Demostración en curso…';
  try{
    setScenario('basetiempo'); setTimeDiv('rapido'); setVoltDiv('ok');
    if(!energized){ showToast('Paso 1 · Conectando el generador de señales…'); el('btnEnergize').click(); await sleep(1600); }
    showToast('Paso 2 · A 50 µs/div la pantalla apenas muestra una fracción de un ciclo — no se puede leer el período.'); await sleep(2600);
    setTimeDiv('lento'); showToast('Paso 3 · A 5 ms/div hay demasiados ciclos comprimidos — tampoco es legible.'); await sleep(2600);
    setTimeDiv('ok'); showToast('Paso 4 · A 500 µs/div se ven ~2.5 ciclos limpios: T = 2 ms, f = 500 Hz.'); await sleep(2600);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    setScenario('acoplamiento'); setCoupling('gnd');
    showToast('Paso 5 · GND marca la referencia de 0 V, sin importar el offset real de la señal.'); await sleep(2400);
    setCoupling('dc'); showToast('Paso 6 · En DC, la traza se desplaza ≈2.5 V respecto a esa marca: ese es el offset de CD.'); await sleep(2600);
    setCoupling('ac'); showToast('Paso 7 · En AC, el filtro paso-alto quita el offset — la traza queda centrada en 0 V.'); await sleep(2600);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    setScenario('trigger'); setTriggerMode('normal'); setTriggerLevel('alto');
    showToast('Paso 8 · Normal + nivel +3.0 V: la señal nunca llega tan alto (±2.0 V) → pantalla SIN DISPARO.'); await sleep(2800);
    setTriggerMode('auto'); showToast('Paso 9 · Auto SÍ fuerza un barrido aunque no dispare — ves la señal, pero "camina" sin sincronizar.'); await sleep(2800);
    setTriggerLevel('medio'); setTriggerMode('normal'); showToast('Paso 10 · Con el nivel dentro del rango (0 V), la traza queda perfectamente estable.'); await sleep(2600);
    setTriggerMode('single'); showToast('Paso 11 · Modo Single: arma la captura y espera UNA sola vez a que la señal cruce el nivel.'); await sleep(2600);
    el('btnArm').click(); await sleep(1800);
    showToast('Paso 12 · Captura única lograda — la pantalla queda retenida hasta que vuelvas a armar.'); await sleep(2600);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2400);

    setScenario('fase'); setPhase('fase0');
    showToast('Paso 13 · En fase (0°): CH1 y CH2 se superponen exactamente.'); await sleep(2400);
    setPhase('reto'); showToast('Paso 14 · Caso a medir: Δt = 0.5 ms entre cruces por cero, con T = 4 ms.'); await sleep(2600);
    showToast('Paso 15 · Δφ = 360°×(0.5/4) = 45°.'); await sleep(2400);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2200);

    showToast('<span style="color:var(--good)">✔ Fin de la demostración: base de tiempo, acoplamiento, disparo y fase — cuatro habilidades básicas para leer cualquier osciloscopio.</span>');
  } finally {
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    autoRunning=false;
  }
}
el('btnAuto').onclick=runAuto;

setScenario('basetiempo');
S.start();
