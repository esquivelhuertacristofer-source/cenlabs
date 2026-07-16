// ===== 1) Escenario base =====
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.0,3.2,6.0],target:[0,0.85,0.1],bgTop:'#0a1620',bgBot:'#03060a',bloom:0.38,minD:3.2,maxD:16});
const {scene}=S;

const std=o=>new THREE.MeshStandardMaterial(o);
const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.08,0.09,0.11), rub=rubber();
const MAT={
  bench: std({...plas, metalness:0.15, roughness:0.75}),
  scopeBody: std({...plas, color:0x1c2230, metalness:0.35, roughness:0.55}),
  jackCh1: std({...brush, color:0xe0b23c, metalness:0.85, roughness:0.3}),
  compTerm: std({...brush, color:0xc77dff, metalness:0.75, roughness:0.35}),
  knobBase: std({...plas, color:0x11141a, metalness:0.3, roughness:0.6}),
  knobRub: std({...rub, color:0x2a2f38, roughness:0.9, metalness:0.0}),
  knobTick: std({color:0xffd166, roughness:0.4, metalness:0.1}),
  btnLit: std({color:0x0a1210, emissive:0x3ad9c2, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
  srcBody: std({...alu, color:0x3a4048, metalness:0.5, roughness:0.6}),
  post: std({...brush, color:0xd8b24a, metalness:0.9, roughness:0.3}),
  wireGen: std({...rub, color:0xe0b23c, roughness:0.85, metalness:0.0}),
  probeComp: std({...plas, color:0x2c2440, metalness:0.3, roughness:0.6}),
  trimmer: std({...brush, color:0xb8bcc4, metalness:0.7, roughness:0.4}),
  probeBody: std({...plas, color:0x1a1d24, metalness:0.25, roughness:0.7}),
  switchSlide: std({color:0xffd166, metalness:0.3, roughness:0.5}),
  tip: std({...brush, color:0xd8d8e0, metalness:0.85, roughness:0.25}),
  gclip: std({color:0x2a2f38, metalness:0.4, roughness:0.6}),
  wireProbe: std({...rub, color:0xc77dff, roughness:0.85, metalness:0.0}),
};

const PARTS=[];
const HOVER_LABELS=new Map();
function registerPart(mesh,name,desc,color){
  PARTS.push({mesh,name,desc});
  const lb=labelSprite(name,color||'#ffd166');
  lb.position.copy(mesh.position);
  lb.position.y+=0.62;
  lb.visible=false;
  lb.raycast=()=>{};
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

// ===== 2) Banco =====
const bench=roundedBox(6.6,0.28,3.7,MAT.bench,0.05);
bench.position.set(0,0,0);
scene.add(bench);

// ===== 3) Osciloscopio (cuerpo, pantalla, jack, terminal de comp, perillas cosméticas, botones) =====
const scopeGroup=new THREE.Group();
scopeGroup.position.set(-1.4,0.77,-0.1);
scene.add(scopeGroup);

const scopeBody=roundedBox(1.9,1.30,1.15,MAT.scopeBody,0.09);
scopeGroup.add(scopeBody);
registerPart(scopeBody,'Osciloscopio digital','Un solo canal activo (CH1) para esta práctica: sonda, compensación, cursores y análisis FFT.','#ffd166');

const scrCanvas=document.createElement('canvas');
scrCanvas.width=300; scrCanvas.height=240;
const scrTex=new THREE.CanvasTexture(scrCanvas);
const screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(1.10,0.88),new THREE.MeshBasicMaterial({map:scrTex}));
screenMesh.position.set(0,0.32,0.586);
scopeGroup.add(screenMesh);
registerPart(screenMesh,'Pantalla','Traza, cursores y espectro FFT se dibujan aquí según el caso activo.','#ffd166');

const jackCh1=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.06,14),MAT.jackCh1);
jackCh1.rotation.x=Math.PI/2;
jackCh1.position.set(-0.75,-0.30,0.585);
scopeGroup.add(jackCh1);
registerPart(jackCh1,'Entrada CH1 (BNC)','Único canal de entrada usado en esta práctica. Aquí se conecta el cable de la sonda.','#ffd166');

const probeCompTerm=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.05,10),MAT.compTerm);
probeCompTerm.rotation.x=Math.PI/2;
probeCompTerm.position.set(-0.50,-0.30,0.585);
scopeGroup.add(probeCompTerm);
registerPart(probeCompTerm,'Terminal de compensación de sonda','Salida de calibración propia del osciloscopio: onda cuadrada de referencia (típicamente ≈1 kHz, unos pocos volts) usada para ajustar el trimmer de una sonda 10X. En esta práctica el generador de señales cumple ese mismo papel, para no tener que mover la sonda de sitio.','#c77dff');

function makeCosmeticKnob(x,y,name,desc){
  const g=new THREE.Group();
  g.position.set(x,y,0.585);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.08,0.05,20),MAT.knobBase);
  base.rotation.x=Math.PI/2;
  g.add(base);
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(0.065,0.065,0.055,20),MAT.knobRub);
  grip.rotation.x=Math.PI/2;
  grip.position.z=0.03;
  g.add(grip);
  const tick=new THREE.Mesh(new THREE.BoxGeometry(0.01,0.045,0.01),MAT.knobTick);
  tick.position.set(0,0.045,0.06);
  grip.add(tick);
  scopeGroup.add(g);
  registerPart(grip,name,desc,'#8aa0b8');
  return g;
}
makeCosmeticKnob(-0.15,-0.30,'Volts/división','Fija en esta práctica para que la lectura dependa únicamente de la sonda y del ajuste de canal, no de la escala vertical.');
makeCosmeticKnob(0.10,-0.30,'Base de tiempo','Fija en esta práctica; el foco está en la sonda, la compensación, los cursores y la FFT, no en el barrido horizontal.');

const btnFFT=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.06,0.02),MAT.btnLit);
btnFFT.position.set(0.72,0.45,0.586);
scopeGroup.add(btnFFT);
registerPart(btnFFT,'Botón FFT / Math','Activa el cálculo de espectro (FFT) del osciloscopio. Se ilumina cuando el Caso 4 está activo.','#5eead4');

const btnCursor=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.06,0.02),MAT.btnLit);
btnCursor.position.set(0.72,0.19,0.586);
scopeGroup.add(btnCursor);
registerPart(btnCursor,'Botón Cursores','Abre el menú de cursores manuales de voltaje/tiempo. Se ilumina cuando el Caso 3 está activo.','#5eead4');

// ===== 4) Generador de señales =====
const srcGroup=new THREE.Group();
srcGroup.position.set(1.6,0.40,0.3);
scene.add(srcGroup);

const srcBody=roundedBox(0.85,0.55,0.62,MAT.srcBody,0.08);
srcGroup.add(srcBody);
registerPart(srcBody,'Generador de señales','Produce la onda senoidal o cuadrada de prueba para cada caso.','#8aa0b8');

const termOut=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.10,12),MAT.post);
termOut.rotation.x=Math.PI/2;
termOut.position.set(-0.15,0.32,0.20);
srcGroup.add(termOut);
registerPart(termOut,'Salida de señal','Punto de prueba: aquí se apoya la punta de la sonda para tomar la medición.','#8aa0b8');

// ===== 5) Sonda (grupo nuevo) =====
const probeGroup=new THREE.Group();
probeGroup.position.set(0.992,0.60,0.230);
probeGroup.rotation.y=-0.55;
scene.add(probeGroup);

const compBox=roundedBox(0.22,0.16,0.16,MAT.probeComp,0.03);
compBox.position.set(-0.55,0,0);
probeGroup.add(compBox);
registerPart(compBox,'Caja de compensación','Aloja el trimmer que ajusta la sonda 10X para que reproduzca fielmente flancos rápidos.','#c77dff');

const trimmerScrew=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.02,10),MAT.trimmer);
trimmerScrew.position.set(0,0.09,0.03);
compBox.add(trimmerScrew);
registerPart(trimmerScrew,'Trimmer de compensación','Pequeño capacitor variable ajustable con un destornillador no metálico. Muy poca capacitancia → esquinas redondeadas (sub-compensada). Demasiada → pico de sobrepaso (sobre-compensada).','#c77dff');

const probeBody=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.05,0.75,14),MAT.probeBody);
probeBody.rotation.z=Math.PI/2;
probeBody.position.set(-0.05,0,0);
probeGroup.add(probeBody);
registerPart(probeBody,'Cuerpo de la sonda','Empuñadura aislada. La atenuación real (1X o 10X) depende de la posición del selector deslizante, no del cuerpo.','#c77dff');

const switchTrack=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.02,0.05),MAT.knobBase);
switchTrack.position.set(-0.10,0.055,0);
probeGroup.add(switchTrack);
const SWITCH_X={'1x':-0.145,'10x':-0.055};
const switchSlide=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.03,0.06),MAT.switchSlide);
switchSlide.position.set(SWITCH_X['10x'],0.055,0);
probeGroup.add(switchSlide);
registerPart(switchSlide,'Selector de atenuación 1X/10X','Interruptor deslizante en el cuerpo de la sonda. Debe coincidir con el ajuste de canal en el osciloscopio o la lectura de voltaje será incorrecta por un factor de 10.','#ffd166');

const probeTip=new THREE.Mesh(new THREE.ConeGeometry(0.02,0.14,10),MAT.tip);
probeTip.rotation.z=-Math.PI/2;
probeTip.position.set(0.42,0,0);
probeGroup.add(probeTip);
registerPart(probeTip,'Punta de prueba','Contacto que toca el punto bajo medición. Toda la atenuación de la sonda ocurre entre esta punta y el conector BNC.','#ffd166');

const gwire=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.006,0.10,6),MAT.gclip);
gwire.rotation.z=Math.PI/2.6;
gwire.position.set(0.34,-0.05,0.03);
probeGroup.add(gwire);
const probeGroundClip=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.02,0.03),MAT.gclip);
probeGroundClip.position.set(0.30,-0.09,0.05);
probeGroup.add(probeGroundClip);
registerPart(probeGroundClip,'Pinza de tierra (GND)','Referencia de tierra de la sonda. Debe conectarse cerca del punto de prueba para minimizar ruido — aquí se representa de forma simplificada.','#94a3b8');

// ===== 6) Cableado =====
function cableTube(points,radius,mat){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const geo=new THREE.TubeGeometry(curve,24,radius,8,false);
  return new THREE.Mesh(geo,mat);
}
const cableProbe=cableTube([[-2.15,0.47,0.485],[-0.8,0.65,0.20],[0.523,0.60,-0.057]],0.026,MAT.wireProbe);
scene.add(cableProbe);

// ===== 7) Pantalla: dibujo =====
const DIVX=10, DIVY=8;
function drawGrid(ctx,W,H){
  ctx.strokeStyle='rgba(94,234,212,0.14)'; ctx.lineWidth=1;
  for(let i=1;i<DIVX;i++){ const x=(i/DIVX)*W; ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for(let j=1;j<DIVY;j++){ const y=(j/DIVY)*H; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.strokeStyle='rgba(94,234,212,0.32)'; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
}
function drawTrace(ctx,W,H,o){
  const totalUs=o.timePerDivUs*DIVX;
  const N=220;
  ctx.strokeStyle=o.color; ctx.lineWidth=2.2; ctx.beginPath();
  for(let i=0;i<=N;i++){
    const tUs=(i/N)*totalUs;
    const v=(o.offset||0)+o.amp*Math.sin(2*Math.PI*o.freq*(tUs/1e6)+(o.phaseRad||0));
    const x=(i/N)*W;
    const yRaw=H/2-(v/o.voltsPerDiv)*(H/DIVY);
    const y=Math.max(2,Math.min(H-2,yRaw));
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
}
function drawSquareTrace(ctx,W,H,o){
  const totalUs=o.timePerDivUs*DIVX;
  const N=440;
  const Tus=1e6/o.freq;
  const tau = o.compKey==='sub' ? 0.22*Tus : (o.compKey==='over' ? 0.05*Tus : 0);
  const overshoot = o.compKey==='over' ? 0.35*o.amp : 0;
  ctx.strokeStyle=o.color; ctx.lineWidth=2.2; ctx.beginPath();
  for(let i=0;i<=N;i++){
    const tUs=(i/N)*totalUs;
    const phase=((tUs%Tus)+Tus)%Tus;
    const inFirstHalf=phase<Tus/2;
    const target=inFirstHalf?o.amp:-o.amp;
    const tSinceEdge=inFirstHalf?phase:(phase-Tus/2);
    let v;
    if(o.compKey==='ok'){
      v=target;
    } else if(o.compKey==='sub'){
      const prevLevel=inFirstHalf?-o.amp:o.amp;
      v=target+(prevLevel-target)*Math.exp(-tSinceEdge/tau);
    } else {
      const decay=overshoot*Math.exp(-tSinceEdge/tau);
      v=target+Math.sign(target)*decay;
    }
    const x=(i/N)*W;
    const yRaw=H/2-(v/o.voltsPerDiv)*(H/DIVY);
    const y=Math.max(2,Math.min(H-2,yRaw));
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
}
function drawVCursor(ctx,W,H,v,color){
  const y=H/2-(v/CURS_VOLTDIV)*(H/DIVY);
  ctx.save(); ctx.setLineDash([4,3]); ctx.strokeStyle=color; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); ctx.restore();
}
function drawTCursor(ctx,W,H,tMs,totalMs,color){
  const x=(tMs/totalMs)*W;
  ctx.save(); ctx.setLineDash([4,3]); ctx.strokeStyle=color; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); ctx.restore();
}
function drawSpectrum(ctx,W,H,mags,color){
  ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath();
  for(let k=0;k<mags.length;k++){
    const freq=k*FFT_DF;
    const x=(freq/FFT_NYQ)*W;
    const yRaw=H-(mags[k]/FFT_YMAX)*H;
    const y=Math.max(2,Math.min(H-2,yRaw));
    if(k===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
}
function updateScreen(){
  const ctx=scrCanvas.getContext('2d');
  const W=scrCanvas.width, H=scrCanvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#03110c'; ctx.fillRect(0,0,W,H);
  if(!energized){ scrTex.needsUpdate=true; return; }
  drawGrid(ctx,W,H);

  if(scenarioKey==='sonda'){
    const rawAtBnc=PROBE_V_TRUE/(probePosKey==='10x'?10:1);
    const displayed=rawAtBnc*(channelKey==='10x'?10:1);
    drawTrace(ctx,W,H,{timePerDivUs:PROBE_TIMEDIV_US,voltsPerDiv:PROBE_VOLTDIV,freq:PROBE_FREQ,amp:displayed,color:'#ffd166'});
  } else if(scenarioKey==='compensacion'){
    drawSquareTrace(ctx,W,H,{timePerDivUs:COMP_TIMEDIV_US,voltsPerDiv:COMP_VOLTDIV,freq:COMP_FREQ,amp:COMP_AMP,compKey,color:'#ffd166'});
  } else if(scenarioKey==='cursores'){
    drawTrace(ctx,W,H,{timePerDivUs:CURS_TIMEDIV_US,voltsPerDiv:CURS_VOLTDIV,freq:CURS_FREQ,amp:CURS_AMP,color:'#ffd166'});
    const totalMs=(CURS_TIMEDIV_US*DIVX)/1000;
    if(cursorType==='v'){
      const st=CURSOR_V_STATES.find(x=>x.key===cursorVKey);
      drawVCursor(ctx,W,H,st.v1,'#e2e8f0');
      drawVCursor(ctx,W,H,st.v2,'#e879f9');
    } else {
      const st=CURSOR_T_STATES.find(x=>x.key===cursorTKey);
      drawTCursor(ctx,W,H,st.t1,totalMs,'#e2e8f0');
      drawTCursor(ctx,W,H,st.t2,totalMs,'#e879f9');
    }
  } else if(scenarioKey==='fft'){
    drawSpectrum(ctx,W,H,fftSpectrum,'#5eead4');
    ctx.save(); ctx.setLineDash([3,3]); ctx.strokeStyle='#f4a52a'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.moveTo(W-1,0); ctx.lineTo(W-1,H); ctx.stroke(); ctx.restore();
    ctx.font='9px monospace'; ctx.fillStyle='#f4a52a'; ctx.textAlign='right';
    ctx.fillText('Nyquist',W-4,12);
    ctx.textAlign='left';
    if(fftPeak){
      const px=(fftPeak.freq/FFT_NYQ)*W;
      const py=Math.max(2,Math.min(H-2,H-(fftPeak.mag/FFT_YMAX)*H));
      ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fillStyle='#ffd166'; ctx.fill();
      const mismatch=Math.abs(fftPeak.freq-fftFreqNominal)>FFT_DF/2;
      ctx.font='10px monospace'; ctx.fillStyle=mismatch?'#f4475e':'#5eead4'; ctx.textAlign='center';
      ctx.fillText((mismatch?'⚠ ALIAS · ':'')+fftPeak.freq.toFixed(0)+' Hz',Math.min(W-30,Math.max(30,px)),H-8);
      ctx.textAlign='left';
    }
  }
  scrTex.needsUpdate=true;
}

// ===== 8) Inspección por clic =====
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  let obj=hit.object, found=null;
  while(obj){
    found=PARTS.find(p=>p.mesh===obj);
    if(found) break;
    obj=obj.parent;
  }
  if(found) showToast(`<b>${found.name}</b><br>${found.desc}`);
});

// ===== 9) Etiquetas hover =====
const _ray=new THREE.Raycaster();
const _mouse=new THREE.Vector2();
let _hoverLb=null;
S.renderer.domElement.addEventListener('pointermove',e=>{
  const r=S.renderer.domElement.getBoundingClientRect();
  _mouse.x=((e.clientX-r.left)/r.width)*2-1;
  _mouse.y=-((e.clientY-r.top)/r.height)*2+1;
  _ray.setFromCamera(_mouse,S.camera);
  const hits=_ray.intersectObjects(scene.children,true);
  let lb=null;
  for(const h of hits){
    let obj=h.object;
    while(obj){
      if(HOVER_LABELS.has(obj)){ lb=HOVER_LABELS.get(obj); break; }
      obj=obj.parent;
    }
    if(lb) break;
  }
  if(_hoverLb&&_hoverLb!==lb) _hoverLb.visible=false;
  if(lb) lb.visible=true;
  _hoverLb=lb;
});
S.renderer.domElement.addEventListener('pointerleave',()=>{
  if(_hoverLb) _hoverLb.visible=false;
  _hoverLb=null;
});

// ===== 10) Modelo de datos =====
const SCEN_ORDER=['sonda','compensacion','cursores','fft'];
const SCEN_LABEL={sonda:'Sonda 1X/10X',compensacion:'Compensación',cursores:'Cursores',fft:'FFT'};

const PROBE_V_TRUE=6.0, PROBE_FREQ=1000, PROBE_TIMEDIV_US=250, PROBE_VOLTDIV=2;
const COMP_FREQ=1000, COMP_AMP=1.5, COMP_TIMEDIV_US=250, COMP_VOLTDIV=1;
const CURS_FREQ=400, CURS_AMP=2.0, CURS_TIMEDIV_US=500, CURS_VOLTDIV=1;
const FFT_FS=2000, FFT_N=200, FFT_DF=FFT_FS/FFT_N, FFT_NYQ=FFT_FS/2, FFT_AMP=1.0, FFT_YMAX=1.6;
const FFT_FREQS=[{key:'f200',hz:200,label:'200 Hz'},{key:'f900',hz:900,label:'900 Hz'},{key:'f1400',hz:1400,label:'1400 Hz (> Nyquist)'}];

const CURSOR_V_STATES=[
  {key:'mal',v1:0.2,v2:-0.2},
  {key:'parcial',v1:2.0,v2:0.0},
  {key:'ok',v1:2.0,v2:-2.0},
];
const CURSOR_T_STATES=[
  {key:'mal',t1:0.3,t2:0.9},
  {key:'parcial',t1:0,t2:1.25},
  {key:'ok',t1:0,t2:2.5},
];

const QUESTIONS={
  sonda:{
    prompt:'Tu sonda física está en 10X, pero configuraste el canal del osciloscopio en 1X. La pantalla muestra un pico de 0.6 V. ¿Cuál es el voltaje REAL en la punta de la sonda?',
    opts:[
      {t:'0.06 V',ok:false},
      {t:'0.6 V (lo que ya muestra la pantalla)',ok:false},
      {t:'6 V',ok:true},
      {t:'60 V',ok:false},
    ],
  },
  compensacion:{
    prompt:'¿Cómo se ve la onda cuadrada de calibración cuando la sonda 10X está SOBRE-compensada?',
    opts:[
      {t:'Esquinas redondeadas que tardan en llegar al nivel plano',ok:false},
      {t:'Flancos perfectamente rectos, sin distorsión',ok:false},
      {t:'Pico de sobrepaso en cada flanco, que luego se asienta al nivel plano',ok:true},
      {t:'La onda desaparece de la pantalla',ok:false},
    ],
  },
  cursores:{
    prompt:'Colocas los cursores de tiempo en 2 cruces por cero, pero uno es de subida y el otro de bajada. El osciloscopio muestra Δt = 1.25 ms. Si la señal real tiene T = 2.5 ms, ¿qué salió mal?',
    opts:[
      {t:'Nada — Δt = 1.25 ms es el periodo correcto',ok:false},
      {t:'Mediste medio periodo (T/2) — los cursores deben ir en cruces del MISMO tipo',ok:true},
      {t:'El osciloscopio está descalibrado',ok:false},
      {t:'La frecuencia real es en realidad el doble de lo esperado',ok:false},
    ],
  },
  fft:{
    prompt:'Configuras el generador a 1400 Hz con Fs = 2000 Hz (Nyquist = 1000 Hz). ¿A qué frecuencia aparece el pico en la FFT?',
    opts:[
      {t:'1400 Hz — la FFT siempre muestra la frecuencia real',ok:false},
      {t:'1000 Hz — el pico se queda pegado en Nyquist',ok:false},
      {t:'600 Hz — la frecuencia se "reflejó" (aliasing) alrededor de Nyquist',ok:true},
      {t:'2600 Hz — la frecuencia se suma con Fs',ok:false},
    ],
  },
};
const DX_HINT={
  sonda:'La sonda en 10X divide la señal entre 10 antes de llegar al osciloscopio: 6 V reales → 0.6 V en el conector BNC. Si el canal está en 1X, el osciloscopio NO vuelve a multiplicar, así que muestra 0.6 V. Para recuperar el valor real, multiplica manualmente por el factor real de la sonda: 0.6 V × 10 = 6 V.',
  compensacion:'Sobre-compensada = trimmer con demasiada capacitancia → la sonda "adelanta" los flancos rápidos, produciendo un pico de sobrepaso que decae hacia el nivel plano. (Sub-compensada sería lo opuesto: esquinas redondeadas que tardan en llegar al nivel plano.)',
  cursores:'Un periodo completo va de un cruce por cero al SIGUIENTE cruce del mismo tipo y misma dirección (p. ej. subida→subida). Mezclar un cruce de subida con uno de bajada mide solo medio periodo.',
  fft:'Con Fs = 2000 Hz, cualquier frecuencia real por encima de Nyquist (1000 Hz) aparece reflejada: f_alias = |f_real − Fs| = |1400 − 2000| = 600 Hz. Por eso es indispensable muestrear a más del doble de la frecuencia más alta presente en la señal (criterio de Nyquist-Shannon).',
};

let scenarioKey='sonda';
let energized=false;
let probePosKey='10x', channelKey='1x';
let compKey='sub';
let cursorType='v', cursorVKey='ok', cursorTKey='ok';
let fftFreqKey='f200';
let fftSpectrum=[], fftPeak=null, fftFreqNominal=FFT_FREQS[0].hz;
let solved=false;

function computeSpectrum(freqHz){
  const mags=[];
  for(let k=0;k<=FFT_N/2;k++){
    let re=0, im=0;
    for(let n=0;n<FFT_N;n++){
      const x=FFT_AMP*Math.sin(2*Math.PI*freqHz*n/FFT_FS);
      const ang=2*Math.PI*k*n/FFT_N;
      re+=x*Math.cos(ang);
      im-=x*Math.sin(ang);
    }
    mags.push(Math.sqrt(re*re+im*im)/FFT_N*((k===0||k===FFT_N/2)?1:2));
  }
  return mags;
}
function recomputeFft(){
  fftFreqNominal=FFT_FREQS.find(x=>x.key===fftFreqKey).hz;
  fftSpectrum=computeSpectrum(fftFreqNominal);
  let bestK=1, bestMag=fftSpectrum[1];
  for(let k=2;k<fftSpectrum.length;k++){ if(fftSpectrum[k]>bestMag){ bestMag=fftSpectrum[k]; bestK=k; } }
  fftPeak={freq:bestK*FFT_DF,mag:bestMag};
}
recomputeFft();

// ===== 11) Sonido =====
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:2200,Q:0.7});

// ===== 12) Animación =====
S.setAnimate((dt,time)=>{
  const targetSwX=SWITCH_X[probePosKey];
  switchSlide.position.x+=(targetSwX-switchSlide.position.x)*Math.min(1,dt*6);

  const TRIMMER_ROT={sub:-0.7,ok:0,over:0.7};
  const targetTrim=TRIMMER_ROT[compKey];
  trimmerScrew.rotation.z+=(targetTrim-trimmerScrew.rotation.z)*Math.min(1,dt*5);

  const pulse=0.5+0.5*Math.sin(time*3.2);
  btnFFT.material.emissiveIntensity=(energized&&scenarioKey==='fft')?(0.5+0.3*pulse):0.05;
  btnCursor.material.emissiveIntensity=(energized&&scenarioKey==='cursores')?(0.5+0.3*pulse):0.05;

  updateTele();
  if(time-(updateScreen._t||0)>0.22){ updateScreen(); updateScreen._t=time; }

  const freqNow={sonda:PROBE_FREQ,compensacion:COMP_FREQ,cursores:CURS_FREQ,fft:fftFreqNominal}[scenarioKey];
  synth.update(freqNow,freqNow,energized?0.035:0,2200);
});

// ===== 13) HUD =====
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Instrumentación · Medición</div>
  <h2>Sonda de osciloscopio: atenuación, compensación, cursores y FFT</h2>
  <p>Toda medición con osciloscopio pasa por una sonda. Aprende a leer correctamente una sonda 1X/10X, a compensarla, a usar cursores manuales para leer ΔV/Δt con precisión, y a interpretar un espectro FFT real — incluyendo el aliasing cuando la señal supera la frecuencia de Nyquist.</p>
  <div class="formula">
    V<sub>real</sub> = V<sub>BNC</sub> × factor de sonda (1X o 10X)<br>
    Δf = F<sub>s</sub> / N &nbsp;·&nbsp; f<sub>Nyquist</sub> = F<sub>s</sub> / 2<br>
    f<sub>alias</sub> = |f<sub>real</sub> − F<sub>s</sub>| cuando f<sub>real</sub> &gt; f<sub>Nyquist</sub>
  </div>
  <div class="legend">
    <span><i style="background:#ffd166"></i> Traza / medición activa</span>
    <span><i style="background:#e879f9"></i> Cursor 2</span>
    <span><i style="background:#5eead4"></i> Espectro FFT</span>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el factor de atenuación 1X/10X de una sonda pasiva y el error de lectura (×10 o ÷10) cuando el ajuste del canal no coincide con la posición física de la sonda; la compensación de sonda 10X con una onda cuadrada de calibración en 3 estados (sub-compensada, correcta, sobre-compensada) mediante un modelo paramétrico ilustrativo; cursores manuales de voltaje y de tiempo con ΔV/Δt, incluyendo el error común de mezclar cruces por cero de distinto tipo; una FFT real (DFT calculada en vivo, no un resultado guionado) que muestra resolución espectral (Δf = F<sub>s</sub>/N) y aliasing genuino cuando la señal supera Nyquist.</div>
    <div class="fl no"><b>NO modela:</b> la ecuación diferencial real del circuito RC de compensación (aquí es un modelo paramétrico ilustrativo, no una simulación de circuito); ruido, jitter ni resolución vertical del ADC; ventanas de FFT (Hamming, Hanning, Blackman-Harris) — se usa ventana rectangular implícita, sin mostrar sus compromisos de fuga espectral; frecuencia de muestreo o memoria de captura configurables (F<sub>s</sub> y N quedan fijos por caso); modelos comerciales específicos de sonda ni sus curvas de derateo de voltaje contra frecuencia.</div>
  </div>
  <div class="src">Ref: IEC 61010-1 + IEC 61010-031 (seguridad, sonda de medición) · sin norma de exactitud obligatoria — consulta la hoja de datos de tu sonda (atenuación, ancho de banda, capacitancia de compensación).</div>
`;

// ===== 14) Panel =====
document.getElementById('panel').innerHTML=`
  <h4>Sonda y FFT · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span></h4>
  <div class="modebar">
    <button class="b on" id="s_sonda">Sonda 1X/10X</button>
    <button class="b" id="s_compensacion">Compensación</button>
    <button class="b" id="s_cursores">Cursores</button>
    <button class="b" id="s_fft">FFT</button>
  </div>
  <div class="console" id="console">Pulsa "🔌 Conectar generador" para iniciar.</div>
  <div id="tele">
    <div class="g"><div class="gl"><span id="tl_1"></span><b id="t_1">—</b></div></div>
    <div class="g"><div class="gl"><span id="tl_2"></span><b id="t_2">—</b></div></div>
    <div class="g"><div class="gl"><span id="tl_3"></span><b id="t_3">—</b></div></div>
    <div class="g"><div class="gl"><span id="tl_4"></span><b id="t_4">—</b></div></div>
    <div class="g"><div class="gl"><span id="tl_5"></span><b id="t_5">—</b></div></div>
  </div>

  <div id="ctrlSonda">
    <h4 class="sec">Posición física de la sonda</h4>
    <div class="modebar" id="mb_probepos">
      <button class="b" data-k="1x">1X</button>
      <button class="b on" data-k="10x">10X</button>
    </div>
    <h4 class="sec">Ajuste del canal en el osciloscopio</h4>
    <div class="modebar" id="mb_channel">
      <button class="b on" data-k="1x">1X</button>
      <button class="b" data-k="10x">10X</button>
    </div>
  </div>

  <div id="ctrlCompensacion" style="display:none">
    <h4 class="sec">Ajuste del trimmer de compensación</h4>
    <div class="modebar" id="mb_comp">
      <button class="b on" data-k="sub">Sub-compensada</button>
      <button class="b" data-k="ok">Correcta</button>
      <button class="b" data-k="over">Sobre-compensada</button>
    </div>
  </div>

  <div id="ctrlCursores" style="display:none">
    <h4 class="sec">Tipo de cursor</h4>
    <div class="modebar" id="mb_cursortype">
      <button class="b on" data-k="v">Voltaje</button>
      <button class="b" data-k="t">Tiempo</button>
    </div>
    <div id="ctrlCursorV">
      <h4 class="sec">Posición (voltaje)</h4>
      <div class="modebar" id="mb_cursorv">
        <button class="b" data-k="mal">Posición A</button>
        <button class="b" data-k="parcial">Posición B</button>
        <button class="b on" data-k="ok">Posición C</button>
      </div>
    </div>
    <div id="ctrlCursorT" style="display:none">
      <h4 class="sec">Posición (tiempo)</h4>
      <div class="modebar" id="mb_cursort">
        <button class="b" data-k="mal">Posición A</button>
        <button class="b" data-k="parcial">Posición B</button>
        <button class="b on" data-k="ok">Posición C</button>
      </div>
    </div>
  </div>

  <div id="ctrlFft" style="display:none">
    <h4 class="sec">Frecuencia del generador</h4>
    <div class="modebar" id="mb_fftfreq">
      <button class="b on" data-k="f200">200 Hz</button>
      <button class="b" data-k="f900">900 Hz</button>
      <button class="b" data-k="f1400">1400 Hz</button>
    </div>
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

// ===== 15) Helpers de UI =====
const tf=(v,dp=0)=>(v===null||v===undefined)?'—':v.toFixed(dp);
const el=id=>document.getElementById(id);
const consoleEl=el('console');

function setConsole(){
  if(!energized){
    consoleEl.innerHTML=`Generador apagado. Pulsa <span style="color:var(--accent)">"🔌 Conectar generador"</span> para alimentar la señal de prueba.`;
    return;
  }
  const desc={
    sonda:'Señal senoidal de referencia. Ajusta la posición física de la sonda y el ajuste del canal — deben coincidir para leer el voltaje correcto.',
    compensacion:'Onda cuadrada de calibración (1 kHz). Ajusta el trimmer de compensación de la sonda 10X hasta que los flancos queden perfectamente rectos.',
    cursores:'Señal senoidal fija de 400 Hz. Coloca los cursores de voltaje o de tiempo y lee ΔV/Δt directamente.',
    fft:'El osciloscopio calcula una FFT real de la señal capturada. Cambia la frecuencia del generador y observa qué pasa cuando supera la frecuencia de Nyquist.',
  }[scenarioKey];
  consoleEl.innerHTML=`<b>${SCEN_LABEL[scenarioKey]}</b><br>${desc}`;
}

function setTele(labels,values,classes){
  for(let i=0;i<5;i++){
    const li=el('tl_'+(i+1)), vi=el('t_'+(i+1));
    li.textContent=(labels&&labels[i])||'';
    vi.textContent=(values&&values[i])||'—';
    vi.className=(classes&&classes[i])?classes[i]:'';
  }
}
function updateTele(){
  if(!energized){ setTele([],[],[]); return; }
  if(scenarioKey==='sonda'){
    const rawAtBnc=PROBE_V_TRUE/(probePosKey==='10x'?10:1);
    const displayed=rawAtBnc*(channelKey==='10x'?10:1);
    const match=probePosKey===channelKey;
    setTele(
      ['Sonda (posición física)','Canal (ajuste en el osciloscopio)','V pico mostrado en pantalla','V pico REAL en la punta','¿Coinciden sonda y canal?'],
      [probePosKey.toUpperCase(),channelKey.toUpperCase(),tf(displayed,2)+' V',solved?tf(PROBE_V_TRUE,2)+' V':'— (calcula: mostrado × factor real de la sonda)',match?'Sí':'No'],
      ['',(match?'good':'bad'),(match?'good':'bad'),'',(match?'good':'bad')]
    );
  } else if(scenarioKey==='compensacion'){
    const label={sub:'Sub-compensada',ok:'Correcta',over:'Sobre-compensada'}[compKey];
    const edges={sub:'Esquinas redondeadas',ok:'Rectos y planos',over:'Pico de sobrepaso'}[compKey];
    setTele(
      ['Señal de calibración','Estado de compensación','Flancos observados','',''],
      ['1 kHz · 3 Vpp (cuadrada)',label,edges,'',''],
      ['',(compKey==='ok'?'good':'warn'),'','','']
    );
  } else if(scenarioKey==='cursores'){
    if(cursorType==='v'){
      const st=CURSOR_V_STATES.find(x=>x.key===cursorVKey);
      const dv=Math.abs(st.v2-st.v1);
      setTele(
        ['Tipo de cursor','Cursor 1 (V1)','Cursor 2 (V2)','ΔV = |V2−V1|','Interpretación'],
        ['Voltaje',tf(st.v1,2)+' V',tf(st.v2,2)+' V',tf(dv,2)+' V',cursorVKey==='ok'?'Vpp correcto':(cursorVKey==='parcial'?'Solo semi-amplitud':'Sin sentido físico claro')],
        ['','','',(cursorVKey==='ok'?'good':'warn'),'']
      );
    } else {
      const st=CURSOR_T_STATES.find(x=>x.key===cursorTKey);
      const dt=Math.abs(st.t2-st.t1);
      setTele(
        ['Tipo de cursor','Cursor 1 (t1)','Cursor 2 (t2)','Δt = |t2−t1|','Interpretación'],
        ['Tiempo',tf(st.t1,2)+' ms',tf(st.t2,2)+' ms',tf(dt,2)+' ms',cursorTKey==='ok'?'Periodo T correcto':(cursorTKey==='parcial'?'Solo medio periodo':'Sin sentido físico claro')],
        ['','','',(cursorTKey==='ok'?'good':'warn'),'']
      );
    }
  } else if(scenarioKey==='fft'){
    const mismatch=fftPeak&&Math.abs(fftPeak.freq-fftFreqNominal)>FFT_DF/2;
    setTele(
      ['Frecuencia configurada','Frecuencia de muestreo Fs','Frecuencia de Nyquist (Fs/2)','Pico detectado en la FFT','¿Hay aliasing?'],
      [tf(fftFreqNominal,0)+' Hz',tf(FFT_FS,0)+' Hz',tf(FFT_NYQ,0)+' Hz',(fftPeak?tf(fftPeak.freq,0):'—')+' Hz',mismatch?'Sí':'No'],
      ['','','',(mismatch?'bad':'good'),(mismatch?'bad':'good')]
    );
  }
}

function refreshCaseLabel(){ el('p_case').textContent=`Caso ${SCEN_ORDER.indexOf(scenarioKey)+1}/4`; }
function clearDx(){ document.querySelectorAll('#dxWrap .b.dx').forEach(b=>b.classList.remove('right','wrong')); }

const qEl=el('q_prompt');
function renderQuestion(){
  qEl.style.textTransform='none';
  const q=QUESTIONS[scenarioKey];
  qEl.textContent=q.prompt;
  const btns=document.querySelectorAll('#dxWrap .b.dx');
  btns.forEach((b,i)=>{ b.textContent=`${String.fromCharCode(65+i)}. ${q.opts[i].t}`; b.dataset.ok=q.opts[i].ok?'1':'0'; });
  clearDx();
}

// ===== 16) Interacción =====
function setScenario(key){
  scenarioKey=key;
  clearDx();
  solved=false;
  ['s_sonda','s_compensacion','s_cursores','s_fft'].forEach(id=>el(id).classList.toggle('on',id==='s_'+key));
  el('ctrlSonda').style.display=key==='sonda'?'':'none';
  el('ctrlCompensacion').style.display=key==='compensacion'?'':'none';
  el('ctrlCursores').style.display=key==='cursores'?'':'none';
  el('ctrlFft').style.display=key==='fft'?'':'none';
  renderQuestion();
  refreshCaseLabel();
  setConsole();
}
function setProbePos(k){ probePosKey=k; document.querySelectorAll('#mb_probepos .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setChannel(k){ channelKey=k; document.querySelectorAll('#mb_channel .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setComp(k){ compKey=k; document.querySelectorAll('#mb_comp .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setCursorType(k){
  cursorType=k;
  document.querySelectorAll('#mb_cursortype .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k));
  el('ctrlCursorV').style.display=k==='v'?'':'none';
  el('ctrlCursorT').style.display=k==='t'?'':'none';
  setConsole();
}
function setCursorV(k){ cursorVKey=k; document.querySelectorAll('#mb_cursorv .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setCursorT(k){ cursorTKey=k; document.querySelectorAll('#mb_cursort .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setFftFreq(k){ fftFreqKey=k; document.querySelectorAll('#mb_fftfreq .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); recomputeFft(); setConsole(); }

el('s_sonda').onclick=()=>setScenario('sonda');
el('s_compensacion').onclick=()=>setScenario('compensacion');
el('s_cursores').onclick=()=>setScenario('cursores');
el('s_fft').onclick=()=>setScenario('fft');

document.querySelectorAll('#mb_probepos .b').forEach(btn=>btn.onclick=()=>setProbePos(btn.dataset.k));
document.querySelectorAll('#mb_channel .b').forEach(btn=>btn.onclick=()=>setChannel(btn.dataset.k));
document.querySelectorAll('#mb_comp .b').forEach(btn=>btn.onclick=()=>setComp(btn.dataset.k));
document.querySelectorAll('#mb_cursortype .b').forEach(btn=>btn.onclick=()=>setCursorType(btn.dataset.k));
document.querySelectorAll('#mb_cursorv .b').forEach(btn=>btn.onclick=()=>setCursorV(btn.dataset.k));
document.querySelectorAll('#mb_cursort .b').forEach(btn=>btn.onclick=()=>setCursorT(btn.dataset.k));
document.querySelectorAll('#mb_fftfreq .b').forEach(btn=>btn.onclick=()=>setFftFreq(btn.dataset.k));

document.querySelectorAll('#dxWrap .b.dx').forEach(btn=>{
  btn.onclick=()=>{
    if(!energized){ showToast('Conecta el generador antes de responder.'); return; }
    clearDx();
    const ok=btn.dataset.ok==='1';
    btn.classList.add(ok?'right':'wrong');
    if(ok){
      solved=true;
      synth.beep(1100,0.09,0.05);
      showToast(`<b>✔ Correcto</b><br>${DX_HINT[scenarioKey]}`);
    } else {
      synth.beep(220,0.22,0.05);
      showToast('✘ No es correcto. Revisa la telemetría e inténtalo de nuevo.');
    }
  };
});

const btnEnergize=el('btnEnergize');
btnEnergize.onclick=()=>{
  energized=!energized;
  synth.init(); synth.resume();
  btnEnergize.classList.toggle('on',energized);
  btnEnergize.textContent=energized?'🔌 Desconectar generador':'🔌 Conectar generador';
  if(energized){
    S.moveTo([2.6,2.0,4.2],[-1.2,0.75,0.2],1.3);
    S.setCinematicIdle(true);
    synth.beep(660,0.08,0.04);
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
if(soundBtn){
  soundBtn.onclick=()=>{
    const on=synth.toggle();
    soundBtn.textContent=on?'🔊':'🔇';
    soundBtn.classList.toggle('on',on);
  };
}

// ===== 17) Demostración guiada =====
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let autoRunning=false;
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const btnAuto=el('btnAuto');
  const prevLabel=btnAuto.textContent;
  btnAuto.disabled=true;
  btnAuto.textContent='▶ Demostración en curso…';
  try{
    if(!energized) btnEnergize.click();

    setScenario('sonda');
    setProbePos('10x'); setChannel('1x');
    showToast('Caso 1 · Sonda: la sonda física está en 10X pero el canal quedó en 1X.');
    await sleep(2400);
    showToast('La pantalla muestra apenas 0.6 V de pico — el osciloscopio no sabe que hay un divisor 10:1.');
    await sleep(2400);
    setChannel('10x');
    showToast('Al poner el canal en 10X, el osciloscopio corrige: ahora lee los 6 V reales.');
    await sleep(2400);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click();
    await sleep(2200);

    setScenario('compensacion');
    setComp('sub');
    showToast('Caso 2 · Compensación: trimmer sub-compensado — esquinas redondeadas en cada flanco.');
    await sleep(2400);
    setComp('over');
    showToast('Sobre-compensado: aparece un pico de sobrepaso que decae hacia el nivel plano.');
    await sleep(2400);
    setComp('ok');
    showToast('Compensación correcta: flancos rectos, sin redondeo ni sobrepaso.');
    await sleep(2200);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click();
    await sleep(2200);

    setScenario('cursores');
    setCursorType('t'); setCursorT('parcial');
    showToast('Caso 3 · Cursores: mezclar un cruce de subida con uno de bajada mide solo medio periodo.');
    await sleep(2600);
    setCursorT('ok');
    showToast('Con dos cruces del mismo tipo, Δt = T completo.');
    await sleep(2200);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click();
    await sleep(2200);

    setScenario('fft');
    setFftFreq('f900');
    showToast('Caso 4 · FFT: 900 Hz está por debajo de Nyquist (1000 Hz) — pico limpio en 900 Hz.');
    await sleep(2600);
    setFftFreq('f1400');
    showToast('1400 Hz supera Nyquist: el pico "se refleja" y aparece en 600 Hz — esto es aliasing real.');
    await sleep(2800);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click();
    await sleep(2200);

    showToast('Fin de la demostración: sonda 1X/10X, compensación, cursores y FFT/aliasing.');
  } finally {
    autoRunning=false;
    btnAuto.disabled=false;
    btnAuto.textContent=prevLabel;
  }
}
el('btnAuto').onclick=runAuto;

// ===== Init =====
setScenario('sonda');
S.start();
