// ===== 1) Escenario base =====
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.2,3.3,6.2],target:[0,0.85,0.1],bgTop:'#0a1620',bgBot:'#03060a',bloom:0.38,minD:3.2,maxD:16});
const {scene}=S;

const std=o=>new THREE.MeshStandardMaterial(o);
const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.08,0.09,0.11), rub=rubber();
const MAT={
  bench: std({...plas, metalness:0.15, roughness:0.75}),
  scopeBody: std({...plas, color:0x1c2230, metalness:0.35, roughness:0.55}),
  jackCh1: std({...brush, color:0xe0b23c, metalness:0.85, roughness:0.3}),
  termCap: std({...brush, color:0xc77dff, metalness:0.75, roughness:0.35}),
  knobBase: std({...plas, color:0x11141a, metalness:0.3, roughness:0.6}),
  knobRub: std({...rub, color:0x2a2f38, roughness:0.9, metalness:0.0}),
  knobTick: std({color:0xffd166, roughness:0.4, metalness:0.1}),
  btnLit: std({color:0x0a1210, emissive:0x3ad9c2, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
  srcBody: std({...alu, color:0x3a4048, metalness:0.5, roughness:0.6}),
  post: std({...brush, color:0xd8b24a, metalness:0.9, roughness:0.3}),
  wireGen: std({...rub, color:0xe0b23c, roughness:0.85, metalness:0.0}),
  switchBase: std({...plas, color:0x11141a, metalness:0.3, roughness:0.6}),
  switchSlide: std({color:0xffd166, metalness:0.3, roughness:0.5}),
  filterBody: std({...plas, color:0x232a36, metalness:0.3, roughness:0.6}),
  filterLit: std({color:0x0a1210, emissive:0xe879f9, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
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

// ===== 3) Osciloscopio (secundario en esta práctica: pantalla + entrada CH1) =====
const scopeGroup=new THREE.Group();
scopeGroup.position.set(-1.6,0.72,-0.1);
scene.add(scopeGroup);

const scopeBody=roundedBox(1.7,1.15,1.05,MAT.scopeBody,0.09);
scopeGroup.add(scopeBody);
registerPart(scopeBody,'Osciloscopio digital','En esta práctica actúa como instrumento de lectura: un solo canal (CH1) conectado directamente a la salida del generador de funciones.','#ffd166');

const scrCanvas=document.createElement('canvas');
scrCanvas.width=300; scrCanvas.height=240;
const scrTex=new THREE.CanvasTexture(scrCanvas);
const screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(1.00,0.80),new THREE.MeshBasicMaterial({map:scrTex}));
screenMesh.position.set(0,0.26,0.526);
scopeGroup.add(screenMesh);
registerPart(screenMesh,'Pantalla','Traza, espectro o curva de Bode se dibujan aquí según el caso activo.','#ffd166');

const jackCh1=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.06,14),MAT.jackCh1);
jackCh1.rotation.x=Math.PI/2;
jackCh1.position.set(-0.65,-0.28,0.526);
scopeGroup.add(jackCh1);
registerPart(jackCh1,'Entrada CH1 (BNC)','Entrada de alta impedancia (Hi-Z) del osciloscopio, salvo que se le conecte un terminador externo de 50 Ω.','#ffd166');

const termCap=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.09,14),MAT.termCap);
termCap.rotation.x=Math.PI/2;
termCap.position.set(-0.65,-0.28,0.60);
termCap.visible=false;
scopeGroup.add(termCap);
registerPart(termCap,'Terminador de 50 Ω','Adaptador que presenta una carga real de 50 Ω a la entrada del osciloscopio. Sin él, la entrada es de alta impedancia (Hi-Z). Solo relevante en el Caso 1 (Carga).','#c77dff');

function makeKnob(group,x,y,z,name,desc){
  const g=new THREE.Group();
  g.position.set(x,y,z);
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
  group.add(g);
  registerPart(grip,name,desc,'#8aa0b8');
  return g;
}
makeKnob(scopeGroup,0.55,-0.28,0.526,'Volts/división','Fija en esta práctica para que la lectura dependa de la carga y no de la escala vertical.');

// ===== 4) Generador de funciones (protagonista de esta práctica) =====
const srcGroup=new THREE.Group();
srcGroup.position.set(1.7,0.45,0.3);
scene.add(srcGroup);

const srcBody=roundedBox(1.4,0.62,0.72,MAT.srcBody,0.08);
srcGroup.add(srcBody);
registerPart(srcBody,'Generador de funciones','Produce la señal de prueba (senoidal o cuadrada) para los cuatro casos de esta práctica: carga, forma de onda, barrido en frecuencia y offset de CD.','#8aa0b8');

const genCanvas=document.createElement('canvas');
genCanvas.width=220; genCanvas.height=100;
const genTex=new THREE.CanvasTexture(genCanvas);
const genScreenMesh=new THREE.Mesh(new THREE.PlaneGeometry(0.46,0.20),new THREE.MeshBasicMaterial({map:genTex}));
genScreenMesh.position.set(0,0.15,0.362);
srcGroup.add(genScreenMesh);
registerPart(genScreenMesh,'Lectura del generador','Muestra la amplitud y frecuencia PROGRAMADAS. En el Caso 3 (Barrido), esta lectura de Vin se toma como referencia confiable, ya que proviene directamente de la fuente.','#8aa0b8');

const ampKnob=makeKnob(srcGroup,-0.50,-0.16,0.362,'Perilla de amplitud','Ajusta la amplitud programada (Vpp). El valor real que llega a la carga depende también del ajuste de carga (Load) y de la impedancia realmente conectada.');
const freqKnob=makeKnob(srcGroup,-0.22,-0.16,0.362,'Perilla de frecuencia','Ajusta la frecuencia de la señal de salida — variable en el Caso 3 (Barrido/Bode).');
const offsetKnob=makeKnob(srcGroup,0.08,-0.16,0.362,'Perilla de offset de CD','Suma un nivel de voltaje de corriente directa constante sobre la señal alterna — Caso 4.');

const waveBtnSine=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.055,0.02),MAT.btnLit.clone());
waveBtnSine.position.set(0.40,0.02,0.362);
srcGroup.add(waveBtnSine);
registerPart(waveBtnSine,'Forma de onda: senoidal','Selecciona una salida senoidal — espectralmente pura, un único tono. Caso 2.','#5eead4');

const waveBtnSquare=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.055,0.02),MAT.btnLit.clone());
waveBtnSquare.position.set(0.40,-0.12,0.362);
srcGroup.add(waveBtnSquare);
registerPart(waveBtnSquare,'Forma de onda: cuadrada','Selecciona una salida cuadrada — contiene una fundamental más armónicos impares (3f, 5f, 7f…). Caso 2.','#5eead4');

const loadTrack=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.02,0.05),MAT.switchBase);
loadTrack.position.set(-0.32,-0.26,0.362);
srcGroup.add(loadTrack);
const LOAD_X={'50':-0.365,'hiz':-0.275};
const loadSlide=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.03,0.06),MAT.switchSlide);
loadSlide.position.set(LOAD_X['50'],-0.26,0.362);
srcGroup.add(loadSlide);
registerPart(loadSlide,'Selector de carga (Load: 50 Ω / Hi-Z)','Le indica al generador qué impedancia de carga asumir para calibrar su voltaje de salida. Debe coincidir con la carga realmente conectada, o la amplitud leída será incorrecta por un factor de 2 (dato de hoja de fabricante). Caso 1.','#ffd166');

const termOut=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.10,12),MAT.post);
termOut.rotation.x=Math.PI/2;
termOut.position.set(0.52,-0.24,0.362);
srcGroup.add(termOut);
registerPart(termOut,'Salida de señal (BNC)','Punto de salida hacia el cable que conecta con el osciloscopio (directamente, o a través del filtro RC en el Caso 3).','#8aa0b8');

// ===== 5) Filtro RC (accesorio del Caso 3 · Barrido/Bode) =====
const filterGroup=new THREE.Group();
filterGroup.position.set(0.15,0.19,1.15);
scene.add(filterGroup);

const filterBody=roundedBox(0.55,0.10,0.30,MAT.filterBody,0.03);
filterGroup.add(filterBody);
registerPart(filterBody,'Filtro RC (paso bajo, un polo)','R = 1.6 kΩ, C = 100 nF → f_c = 1/(2πRC) ≈ 995 Hz. Solo interviene en el Caso 3 (Barrido/Bode); en los demás casos el generador se conecta directo al osciloscopio.','#e879f9');

const filterPostIn=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.07,10),MAT.post);
filterPostIn.rotation.x=Math.PI/2;
filterPostIn.position.set(-0.20,0.06,0);
filterGroup.add(filterPostIn);
const filterPostOut=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.07,10),MAT.post);
filterPostOut.rotation.x=Math.PI/2;
filterPostOut.position.set(0.20,0.06,0);
filterGroup.add(filterPostOut);

const filterLed=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.03,0.02),MAT.filterLit);
filterLed.position.set(0,0.06,0.14);
filterGroup.add(filterLed);
registerPart(filterLed,'Indicador del filtro','Se ilumina cuando el Caso 3 (Barrido/Bode) está activo, recordando que la señal pasa por el filtro RC antes de llegar al osciloscopio.','#e879f9');

// ===== 6) Cableado =====
function cableTube(points,radius,mat){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const geo=new THREE.TubeGeometry(curve,24,radius,8,false);
  return new THREE.Mesh(geo,mat);
}
const cableGenScope=cableTube([[2.22,0.21,0.66],[0.15,0.75,1.05],[-2.25,0.44,0.43]],0.026,MAT.wireGen);
scene.add(cableGenScope);

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
    let v=(o.offset||0)+o.amp*Math.sin(2*Math.PI*o.freq*(tUs/1e6)+(o.phaseRad||0));
    if(o.rail!=null) v=Math.max(-o.rail,Math.min(o.rail,v));
    const x=(i/N)*W;
    const yRaw=H/2-(v/o.voltsPerDiv)*(H/DIVY);
    const y=Math.max(2,Math.min(H-2,yRaw));
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke();
}
function drawVCursor(ctx,W,H,v,voltsPerDiv,color){
  const y=H/2-(v/voltsPerDiv)*(H/DIVY);
  ctx.save(); ctx.setLineDash([4,3]); ctx.strokeStyle=color; ctx.lineWidth=1.4;
  ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); ctx.restore();
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
function drawBode(ctx,W,H){
  const freqs=BODE_FREQS;
  const fMin=freqs[0].hz, fMax=freqs[freqs.length-1].hz;
  const xFor=hz=>{
    const lx=(Math.log10(hz)-Math.log10(fMin))/(Math.log10(fMax)-Math.log10(fMin));
    return lx*W;
  };
  const DB_TOP=6, DB_BOT=-24;
  const yFor=db=>Math.max(2,Math.min(H-2,((db-DB_TOP)/(DB_BOT-DB_TOP))*H));

  ctx.save(); ctx.setLineDash([2,2]); ctx.strokeStyle='rgba(148,163,184,0.4)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,yFor(0)); ctx.lineTo(W,yFor(0)); ctx.stroke();
  ctx.strokeStyle='rgba(244,165,42,0.55)';
  ctx.beginPath(); ctx.moveTo(0,yFor(-3)); ctx.lineTo(W,yFor(-3)); ctx.stroke();
  ctx.restore();
  ctx.font='9px monospace'; ctx.fillStyle='#f4a52a'; ctx.textAlign='left';
  ctx.fillText('-3 dB',4,yFor(-3)-3);

  ctx.save(); ctx.strokeStyle='rgba(94,234,212,0.35)'; ctx.lineWidth=1.4; ctx.beginPath();
  const NPTS=60;
  for(let i=0;i<=NPTS;i++){
    const lf=Math.log10(fMin)+(i/NPTS)*(Math.log10(fMax)-Math.log10(fMin));
    const hz=Math.pow(10,lf);
    const db=bodeGainDb(hz);
    const x=xFor(hz), y=yFor(db);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.stroke(); ctx.restore();

  ctx.strokeStyle='#ffd166'; ctx.lineWidth=2.2; ctx.beginPath();
  let first=true;
  for(const f of freqs){
    if(!bodeVisited.has(f.key)) continue;
    const x=xFor(f.hz), y=yFor(bodeGainDb(f.hz));
    if(first){ ctx.moveTo(x,y); first=false; } else ctx.lineTo(x,y);
  }
  ctx.stroke();
  for(const f of freqs){
    if(!bodeVisited.has(f.key)) continue;
    const x=xFor(f.hz), y=yFor(bodeGainDb(f.hz));
    ctx.beginPath(); ctx.arc(x,y,3.2,0,Math.PI*2);
    ctx.fillStyle=(f.key===bodeFreqKey)?'#5eead4':'#ffd166';
    ctx.fill();
  }

  ctx.save(); ctx.setLineDash([3,3]); ctx.strokeStyle='rgba(232,121,249,0.55)'; ctx.lineWidth=1.2;
  const xfc=xFor(BODE_FC);
  ctx.beginPath(); ctx.moveTo(xfc,0); ctx.lineTo(xfc,H); ctx.stroke(); ctx.restore();
  ctx.font='9px monospace'; ctx.fillStyle='#e879f9'; ctx.textAlign='center';
  ctx.fillText('fc≈'+BODE_FC.toFixed(0)+' Hz',Math.min(W-28,Math.max(28,xfc)),H-4);
  ctx.textAlign='left';
}
function updateScreen(){
  const ctx=scrCanvas.getContext('2d');
  const W=scrCanvas.width, H=scrCanvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#03110c'; ctx.fillRect(0,0,W,H);
  if(!energized){ scrTex.needsUpdate=true; return; }
  drawGrid(ctx,W,H);

  if(scenarioKey==='carga'){
    const vpp=cargaDisplayedVpp();
    drawTrace(ctx,W,H,{timePerDivUs:CARGA_TIMEDIV_US,voltsPerDiv:CARGA_VOLTDIV,freq:CARGA_FREQ,amp:vpp/2,color:'#ffd166'});
  } else if(scenarioKey==='forma'){
    drawSpectrum(ctx,W,H,formaSpectrum,'#5eead4');
    const fundK=Math.round(FORMA_FREQ/FFT_DF);
    const fundMag=formaSpectrum[fundK]||0;
    const px=(FORMA_FREQ/FFT_NYQ)*W;
    const py=Math.max(2,Math.min(H-2,H-(fundMag/FFT_YMAX)*H));
    ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fillStyle='#ffd166'; ctx.fill();
    ctx.font='10px monospace'; ctx.fillStyle='#ffd166'; ctx.textAlign='center';
    ctx.fillText('f₀',Math.min(W-14,Math.max(14,px)),Math.max(12,py-6));
    ctx.textAlign='left';
    if(waveKey==='square'){
      ctx.font='9px monospace'; ctx.fillStyle='#5eead4'; ctx.textAlign='right';
      ctx.fillText(formaHarmonicCount()+' picos < Nyquist',W-4,12);
      ctx.textAlign='left';
    }
  } else if(scenarioKey==='barrido'){
    drawBode(ctx,W,H);
  } else if(scenarioKey==='offset'){
    const lvl=OFFSET_LEVELS.find(x=>x.key===offsetKey);
    drawTrace(ctx,W,H,{timePerDivUs:OFFSET_TIMEDIV_US,voltsPerDiv:OFFSET_VOLTDIV,freq:OFFSET_FREQ,amp:OFFSET_AMP,offset:lvl.v,rail:OFFSET_RAIL,color:'#ffd166'});
    drawVCursor(ctx,W,H,OFFSET_RAIL,OFFSET_VOLTDIV,'rgba(244,71,94,0.5)');
    drawVCursor(ctx,W,H,-OFFSET_RAIL,OFFSET_VOLTDIV,'rgba(244,71,94,0.5)');
  }
  scrTex.needsUpdate=true;
}
function updateGenScreen(){
  const ctx=genCanvas.getContext('2d');
  const W=genCanvas.width, H=genCanvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#03110c'; ctx.fillRect(0,0,W,H);
  ctx.font='16px monospace'; ctx.fillStyle='#5eead4'; ctx.textAlign='left';
  const freqLabel={carga:CARGA_FREQ,forma:FORMA_FREQ,barrido:BODE_FREQS.find(x=>x.key===bodeFreqKey).hz,offset:OFFSET_FREQ}[scenarioKey];
  const amplLabel={carga:tf(CARGA_VSET_PP,2)+' Vpp',forma:tf(FORMA_AMP*2,2)+' Vpp',barrido:tf(BODE_VIN_PP,2)+' Vpp',offset:tf(OFFSET_AMP*2,2)+' Vpp'}[scenarioKey];
  ctx.fillText('AMPL '+amplLabel,10,34);
  ctx.fillText('FREQ '+tf(freqLabel,0)+' Hz',10,64);
  ctx.font='13px monospace'; ctx.fillStyle='#8aa0b8';
  ctx.fillText(energized?'● SALIDA ACTIVA':'○ EN ESPERA',10,90);
  genTex.needsUpdate=true;
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
const SCEN_ORDER=['carga','forma','barrido','offset'];
const SCEN_LABEL={carga:'Carga',forma:'Forma de onda',barrido:'Barrido/Bode',offset:'Offset de CD'};

const CARGA_FREQ=1000, CARGA_TIMEDIV_US=250, CARGA_VOLTDIV=1, CARGA_VSET_PP=2.0;

const FORMA_FREQ=100, FORMA_AMP=1.0;
const FFT_FS=2000, FFT_N=200, FFT_DF=FFT_FS/FFT_N, FFT_NYQ=FFT_FS/2, FFT_YMAX=1.6;
const WAVE_FN={
  sine:(f,t)=>FORMA_AMP*Math.sin(2*Math.PI*f*t),
  square:(f,t)=>FORMA_AMP*Math.sign(Math.sin(2*Math.PI*f*t)),
};

const BODE_R=1600, BODE_C=100e-9;
const BODE_FC=1/(2*Math.PI*BODE_R*BODE_C);
const BODE_VIN_PP=2.0;
const BODE_FREQS=[
  {key:'f100',hz:100,label:'100 Hz'},
  {key:'f400',hz:400,label:'400 Hz'},
  {key:'f1000',hz:1000,label:'1 kHz'},
  {key:'f2500',hz:2500,label:'2.5 kHz'},
  {key:'f6000',hz:6000,label:'6 kHz'},
];
function bodeGain(hz){ return 1/Math.sqrt(1+Math.pow(hz/BODE_FC,2)); }
function bodeGainDb(hz){ return 20*Math.log10(bodeGain(hz)); }

const OFFSET_FREQ=1000, OFFSET_TIMEDIV_US=250, OFFSET_VOLTDIV=1, OFFSET_AMP=1.0, OFFSET_RAIL=2.5;
const OFFSET_LEVELS=[
  {key:'cero',v:0,label:'0 V'},
  {key:'bajo',v:1.0,label:'+1.0 V'},
  {key:'medio',v:1.8,label:'+1.8 V'},
  {key:'alto',v:2.2,label:'+2.2 V'},
];

const QUESTIONS={
  carga:{
    prompt:'El generador está configurado para carga de 50 Ω y (según su ajuste) entrega 2.0 Vpp. Lo conectas directo a la entrada de alta impedancia (Hi-Z) del osciloscopio, sin terminador. ¿Qué amplitud pico a pico muestra realmente la pantalla?',
    opts:[
      {t:'1.0 Vpp',ok:false},
      {t:'2.0 Vpp (lo que el generador dice entregar)',ok:false},
      {t:'4.0 Vpp — el doble, por la falta de terminación de 50 Ω',ok:true},
      {t:'0.5 Vpp',ok:false},
    ],
  },
  forma:{
    prompt:'¿Por qué el espectro de una onda cuadrada muestra varios picos además de la frecuencia fundamental, mientras que una onda senoidal de la misma frecuencia muestra solo uno?',
    opts:[
      {t:'La onda cuadrada tiene más ruido eléctrico',ok:false},
      {t:'Toda onda periódica no senoidal es la suma de una fundamental más armónicos (serie de Fourier); la cuadrada aporta armónicos impares',ok:true},
      {t:'El osciloscopio calcula mal la FFT de ondas cuadradas',ok:false},
      {t:'La onda cuadrada en realidad tiene el doble de frecuencia',ok:false},
    ],
  },
  barrido:{
    prompt:'Barriste el generador en frecuencia a través de un filtro RC (f_c ≈ 995 Hz) y mediste la ganancia en cada paso. ¿Cuál frecuencia está MÁS CERCA del punto de −3 dB (70.7%)?',
    opts:[
      {t:'100 Hz',ok:false},
      {t:'400 Hz',ok:false},
      {t:'1 kHz',ok:true},
      {t:'6 kHz',ok:false},
    ],
  },
  offset:{
    prompt:'Programas un offset de +2.2 V de CD sobre una señal senoidal de 1.0 V de amplitud (pico). El circuito solo puede mostrar sin distorsión hasta ±2.5 V. ¿Qué le pasa a la cresta positiva de la onda?',
    opts:[
      {t:'Nada, se ve una senoidal perfecta',ok:false},
      {t:'Se recorta (clipping): la cresta se aplana en +2.5 V en vez de llegar a +3.2 V',ok:true},
      {t:'La frecuencia se distorsiona',ok:false},
      {t:'El osciloscopio se apaga automáticamente',ok:false},
    ],
  },
};
const DX_HINT={
  carga:'La salida del generador tiene una impedancia interna nominal de 50 Ω. Si el generador está calibrado asumiendo una carga de 50 Ω pero se conecta a una entrada de alta impedancia, no hay divisor de tensión: la amplitud real es el DOBLE de la programada (dato de hoja de fabricante: p. ej. "1 mVpp a 10 Vpp en 50 Ω / 2 mVpp a 20 Vpp en circuito abierto"). Por eso el ajuste de carga del generador y la carga real conectada deben coincidir.',
  forma:'Una onda cuadrada equivale, por serie de Fourier, a (4/π)·Σ[1/n·sin(n·ω·t)] para n impar (1,3,5,7…). Cada uno de esos términos aparece como un pico real en la FFT. Una onda senoidal, en cambio, es por definición un único tono — su espectro tiene un solo pico.',
  barrido:'El punto de −3 dB (≈70.7% de la ganancia máxima) define el límite convencional entre "pasa" y "atenúa" en un filtro. Con f_c = 1/(2πRC) ≈ 995 Hz para este filtro, la frecuencia de 1 kHz cae casi exactamente sobre ese punto — las demás quedan claramente dentro de la banda de paso o claramente atenuadas.',
  offset:'El pico real de la señal es V_offset + V_amplitud. Si esa suma supera el rango disponible del circuito (el "rail"), la parte que excede el límite se recorta en línea recta (clipping) en vez de seguir la forma senoidal — aquí: 2.2 + 1.0 = 3.2 V, recortado en +2.5 V.',
};

let scenarioKey='carga';
let energized=false;
let genLoadKey='50', actualLoadKey='50';
let waveKey='sine';
let formaSpectrum=[];
let bodeFreqKey='f100';
const bodeVisited=new Set(['f100']);
let offsetKey='cero';

function cargaFactor(){
  const vocFactor = genLoadKey==='50' ? 2 : 1;
  const loadFactor = actualLoadKey==='50' ? 0.5 : 1;
  return vocFactor*loadFactor;
}
function cargaDisplayedVpp(){ return CARGA_VSET_PP*cargaFactor(); }

function computeSpectrumWave(freqHz,waveformFn){
  const mags=[];
  for(let k=0;k<=FFT_N/2;k++){
    let re=0, im=0;
    for(let n=0;n<FFT_N;n++){
      const x=waveformFn(freqHz,n/FFT_FS);
      const ang=2*Math.PI*k*n/FFT_N;
      re+=x*Math.cos(ang);
      im-=x*Math.sin(ang);
    }
    mags.push(Math.sqrt(re*re+im*im)/FFT_N*((k===0||k===FFT_N/2)?1:2));
  }
  return mags;
}
function recomputeForma(){ formaSpectrum=computeSpectrumWave(FORMA_FREQ,WAVE_FN[waveKey]); }
function formaHarmonicCount(){
  if(waveKey==='sine') return 1;
  let count=0;
  for(let n=1;n*FORMA_FREQ<FFT_NYQ;n+=2) count++;
  return count;
}
recomputeForma();

// ===== 11) Sonido =====
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:2200,Q:0.7});

// ===== 12) Animación =====
S.setAnimate((dt,time)=>{
  const targetLoadX=LOAD_X[genLoadKey];
  loadSlide.position.x+=(targetLoadX-loadSlide.position.x)*Math.min(1,dt*6);

  const pulse=0.5+0.5*Math.sin(time*3.2);
  waveBtnSine.material.emissiveIntensity=(energized&&scenarioKey==='forma'&&waveKey==='sine')?(0.5+0.3*pulse):0.05;
  waveBtnSquare.material.emissiveIntensity=(energized&&scenarioKey==='forma'&&waveKey==='square')?(0.5+0.3*pulse):0.05;
  filterLed.material.emissiveIntensity=(energized&&scenarioKey==='barrido')?(0.5+0.3*pulse):0.05;

  updateTele();
  if(time-(updateScreen._t||0)>0.22){ updateScreen(); updateGenScreen(); updateScreen._t=time; }

  const freqNow={carga:CARGA_FREQ,forma:FORMA_FREQ,barrido:BODE_FREQS.find(x=>x.key===bodeFreqKey).hz,offset:OFFSET_FREQ}[scenarioKey];
  synth.update(freqNow,freqNow,energized?0.035:0,2200);
});

// ===== 13) HUD =====
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Instrumentación · Medición</div>
  <h2>Generador de funciones: carga, forma de onda, barrido y offset de CD</h2>
  <p>Un generador de funciones no solo "produce una señal": su lectura correcta depende de que el ajuste de carga coincida con lo realmente conectado, de reconocer el contenido espectral de cada forma de onda, de caracterizar un circuito barriendo su frecuencia, y de respetar el rango disponible al sumar un offset de CD.</p>
  <div class="formula">
    V<sub>medido</sub> = V<sub>programado</sub> × factor de carga (×2 si Load=50 Ω y la carga real es Hi-Z)<br>
    Ganancia = V<sub>out</sub> / V<sub>in</sub> &nbsp;·&nbsp; Ganancia(dB) = 20·log₁₀(V<sub>out</sub>/V<sub>in</sub>) &nbsp;·&nbsp; f<sub>c</sub> = 1 / (2πRC)<br>
    V<sub>pico</sub> = V<sub>offset</sub> + V<sub>amplitud</sub> (recorte si supera el rango del circuito)
  </div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#ffd166"></span>Traza / medición activa</div>
    <div class="li"><span class="dot" style="background:#5eead4"></span>Espectro / curva teórica</div>
    <div class="li"><span class="dot" style="background:#e879f9"></span>Filtro RC / f<sub>c</sub></div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la impedancia de salida nominal de 50 Ω del generador y el error de amplitud ×2 cuando el ajuste de carga (Load) no coincide con la carga real conectada, con la razón exacta documentada por el fabricante; el contenido armónico genuino (DFT calculada en vivo, no un resultado guionado) de una onda cuadrada frente a una senoidal pura; el barrido en frecuencia de un filtro RC de un polo con cálculo real de ganancia y localización del punto de −3 dB / 70.7%; el apilamiento de un offset de CD sobre una señal AC, con recorte (clipping) real cuando la suma excede el rango disponible.</div>
    <div class="fl no"><b>NO modela:</b> modelos comerciales específicos de generador ni todas sus formas de onda (triangular, rampa, pulso, arbitraria); ruido de fase, jitter ni distorsión armónica propia del generador; la respuesta transitoria del filtro RC (solo su respuesta en régimen permanente, en frecuencia); protecciones de sobre-voltaje o límites de corriente de salida reales del instrumento.</div>
  </div>
  <div class="src">Ref: IEC 61010-1 (seguridad, generador de funciones — sin norma particular Parte 2 aplicable) · sin norma de exactitud armonizada — consulta la hoja de datos de tu generador (impedancia de salida, exactitud de amplitud y de frecuencia).</div>
`;

// ===== 14) Panel =====
document.getElementById('panel').innerHTML=`
  <h4>Generador de funciones · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span></h4>
  <div class="modebar">
    <button class="b on" id="s_carga">Carga</button>
    <button class="b" id="s_forma">Forma de onda</button>
    <button class="b" id="s_barrido">Barrido/Bode</button>
    <button class="b" id="s_offset">Offset de CD</button>
  </div>
  <div class="console" id="console">Pulsa "🔌 Conectar generador" para iniciar.</div>
  <div id="tele">
    <div class="g"><div class="gl"><span id="tl_1"></span><b id="t_1">—</b></div></div>
    <div class="g"><div class="gl"><span id="tl_2"></span><b id="t_2">—</b></div></div>
    <div class="g"><div class="gl"><span id="tl_3"></span><b id="t_3">—</b></div></div>
    <div class="g"><div class="gl"><span id="tl_4"></span><b id="t_4">—</b></div></div>
    <div class="g"><div class="gl"><span id="tl_5"></span><b id="t_5">—</b></div></div>
  </div>

  <div id="ctrlCarga">
    <h4 class="sec">Ajuste de carga del generador (Load)</h4>
    <div class="modebar" id="mb_genload">
      <button class="b on" data-k="50">50 Ω</button>
      <button class="b" data-k="hiz">Hi-Z</button>
    </div>
    <h4 class="sec">Carga realmente conectada</h4>
    <div class="modebar" id="mb_actualload">
      <button class="b" data-k="50">Terminador 50 Ω</button>
      <button class="b on" data-k="hiz">Alta impedancia (osciloscopio)</button>
    </div>
  </div>

  <div id="ctrlForma" style="display:none">
    <h4 class="sec">Forma de onda</h4>
    <div class="modebar" id="mb_wave">
      <button class="b on" data-k="sine">Senoidal</button>
      <button class="b" data-k="square">Cuadrada</button>
    </div>
  </div>

  <div id="ctrlBarrido" style="display:none">
    <h4 class="sec">Frecuencia del barrido</h4>
    <div class="modebar" id="mb_bodefreq">
      <button class="b on" data-k="f100">100 Hz</button>
      <button class="b" data-k="f400">400 Hz</button>
      <button class="b" data-k="f1000">1 kHz</button>
      <button class="b" data-k="f2500">2.5 kHz</button>
      <button class="b" data-k="f6000">6 kHz</button>
    </div>
  </div>

  <div id="ctrlOffset" style="display:none">
    <h4 class="sec">Offset de CD</h4>
    <div class="modebar" id="mb_offset">
      <button class="b on" data-k="cero">0 V</button>
      <button class="b" data-k="bajo">+1.0 V</button>
      <button class="b" data-k="medio">+1.8 V</button>
      <button class="b" data-k="alto">+2.2 V</button>
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
    carga:'El generador asume una carga determinada para calibrar su amplitud de salida. Ajusta el selector de carga del generador y la carga realmente conectada — deben coincidir para leer la amplitud correcta.',
    forma:'Compara el espectro de una onda senoidal pura contra una onda cuadrada. La FFT es real (DFT en vivo), no un resultado guionado.',
    barrido:'Barre la frecuencia del generador a través de un filtro RC de un polo y mide la ganancia en cada paso. Busca el punto de −3 dB (70.7%).',
    offset:'Suma un offset de CD sobre la señal alterna. Si la suma supera el rango disponible del circuito, la cresta se recorta (clipping).',
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
  if(scenarioKey==='carga'){
    const match=genLoadKey===actualLoadKey;
    const vpp=cargaDisplayedVpp();
    setTele(
      ['Ajuste de carga del generador','Carga real conectada','Amplitud programada','Amplitud medida en el osciloscopio','¿Coinciden ajuste y carga real?'],
      [genLoadKey==='50'?'50 Ω':'Hi-Z',actualLoadKey==='50'?'Terminador 50 Ω':'Alta impedancia',tf(CARGA_VSET_PP,2)+' Vpp',tf(vpp,2)+' Vpp',match?'Sí':'No'],
      ['',(match?'good':'bad'),'',(match?'good':'bad'),(match?'good':'bad')]
    );
  } else if(scenarioKey==='forma'){
    const n=formaHarmonicCount();
    setTele(
      ['Forma de onda','Frecuencia fundamental','Contenido espectral esperado','Picos visibles bajo Nyquist','Pureza espectral'],
      [waveKey==='sine'?'Senoidal':'Cuadrada',tf(FORMA_FREQ,0)+' Hz',waveKey==='sine'?'Solo la fundamental':'Fundamental + armónicos impares',String(n),waveKey==='sine'?'Pura (1 tono)':'Rica en armónicos'],
      ['','','','','']
    );
  } else if(scenarioKey==='barrido'){
    const f=BODE_FREQS.find(x=>x.key===bodeFreqKey);
    const gain=bodeGain(f.hz), gainDb=bodeGainDb(f.hz);
    const vout=BODE_VIN_PP*gain;
    setTele(
      ['Frecuencia actual','Vin (lectura confiable del generador)','Vout (medido en el osciloscopio)','Ganancia (Vout/Vin)','Ganancia en dB'],
      [f.label,tf(BODE_VIN_PP,2)+' Vpp',tf(vout,2)+' Vpp',tf(gain,3)+' V/V',tf(gainDb,1)+' dB'],
      ['','','','','']
    );
  } else if(scenarioKey==='offset'){
    const lvl=OFFSET_LEVELS.find(x=>x.key===offsetKey);
    const peak=lvl.v+OFFSET_AMP;
    const clip=peak>OFFSET_RAIL;
    setTele(
      ['Offset de CD programado','Amplitud AC (pico)','Pico máximo esperado','Límite de rango (rail)','Estado'],
      [lvl.label,tf(OFFSET_AMP,2)+' V',tf(peak,2)+' V','±'+tf(OFFSET_RAIL,2)+' V',clip?'Recortando (clipping)':'Dentro de rango'],
      ['','','',(clip?'bad':''),(clip?'bad':'good')]
    );
  }
}

function refreshCaseLabel(){ el('p_case').textContent=`Caso ${SCEN_ORDER.indexOf(scenarioKey)+1}/4`; }
function clearDx(){ document.querySelectorAll('#dxWrap .b.dx').forEach(b=>b.classList.remove('right','wrong')); }

function shuffled(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

const qEl=el('q_prompt');
function renderQuestion(){
  qEl.style.textTransform='none';
  const q=QUESTIONS[scenarioKey];
  qEl.textContent=q.prompt;
  const opts=shuffled(q.opts);
  const btns=document.querySelectorAll('#dxWrap .b.dx');
  btns.forEach((b,i)=>{ b.textContent=`${String.fromCharCode(65+i)}. ${opts[i].t}`; b.dataset.ok=opts[i].ok?'1':'0'; });
  clearDx();
}

// ===== 16) Interacción =====
function setScenario(key){
  scenarioKey=key;
  clearDx();
  ['s_carga','s_forma','s_barrido','s_offset'].forEach(id=>el(id).classList.toggle('on',id==='s_'+key));
  el('ctrlCarga').style.display=key==='carga'?'':'none';
  el('ctrlForma').style.display=key==='forma'?'':'none';
  el('ctrlBarrido').style.display=key==='barrido'?'':'none';
  el('ctrlOffset').style.display=key==='offset'?'':'none';
  renderQuestion();
  refreshCaseLabel();
  setConsole();
}
function setGenLoad(k){ genLoadKey=k; document.querySelectorAll('#mb_genload .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setActualLoad(k){ actualLoadKey=k; termCap.visible=(k==='50'); document.querySelectorAll('#mb_actualload .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setWave(k){ waveKey=k; document.querySelectorAll('#mb_wave .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); recomputeForma(); setConsole(); }
function setBodeFreq(k){ bodeFreqKey=k; bodeVisited.add(k); document.querySelectorAll('#mb_bodefreq .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }
function setOffset(k){ offsetKey=k; document.querySelectorAll('#mb_offset .b').forEach(b=>b.classList.toggle('on',b.dataset.k===k)); setConsole(); }

el('s_carga').onclick=()=>setScenario('carga');
el('s_forma').onclick=()=>setScenario('forma');
el('s_barrido').onclick=()=>setScenario('barrido');
el('s_offset').onclick=()=>setScenario('offset');

document.querySelectorAll('#mb_genload .b').forEach(btn=>btn.onclick=()=>setGenLoad(btn.dataset.k));
document.querySelectorAll('#mb_actualload .b').forEach(btn=>btn.onclick=()=>setActualLoad(btn.dataset.k));
document.querySelectorAll('#mb_wave .b').forEach(btn=>btn.onclick=()=>setWave(btn.dataset.k));
document.querySelectorAll('#mb_bodefreq .b').forEach(btn=>btn.onclick=()=>setBodeFreq(btn.dataset.k));
document.querySelectorAll('#mb_offset .b').forEach(btn=>btn.onclick=()=>setOffset(btn.dataset.k));

document.querySelectorAll('#dxWrap .b.dx').forEach(btn=>{
  btn.onclick=()=>{
    if(!energized){ showToast('Conecta el generador antes de responder.'); return; }
    clearDx();
    const ok=btn.dataset.ok==='1';
    btn.classList.add(ok?'right':'wrong');
    if(ok){
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
    S.moveTo([3.2,2.1,4.6],[0.4,0.6,0.3],1.3);
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

    setScenario('carga');
    setGenLoad('50'); setActualLoad('hiz');
    showToast('Caso 1 · Carga: el generador está calibrado para 50 Ω, pero está conectado a la entrada de alta impedancia del osciloscopio.');
    await sleep(2600);
    showToast('Sin una carga de 50 Ω real, la tensión no se divide: la pantalla muestra el DOBLE de la amplitud programada.');
    await sleep(2600);
    setActualLoad('50');
    showToast('Al conectar el terminador de 50 Ω, la carga real coincide con el ajuste del generador: la amplitud vuelve a ser la programada.');
    await sleep(2600);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click();
    await sleep(2200);

    setScenario('forma');
    setWave('sine');
    showToast('Caso 2 · Forma de onda: una senoidal pura muestra un único pico en el espectro — la fundamental.');
    await sleep(2600);
    setWave('square');
    showToast('Una onda cuadrada de la misma frecuencia muestra la fundamental MÁS armónicos impares (3f, 5f, 7f, 9f…).');
    await sleep(2800);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click();
    await sleep(2200);

    setScenario('barrido');
    setBodeFreq('f100');
    showToast('Caso 3 · Barrido/Bode: a 100 Hz, muy por debajo de la frecuencia de corte, el filtro deja pasar casi toda la señal (~0 dB).');
    await sleep(2600);
    setBodeFreq('f1000');
    showToast('A 1 kHz la ganancia cae a ≈ −3 dB (70.7%) — este filtro tiene f_c ≈ 995 Hz, muy cerca de este punto.');
    await sleep(2800);
    setBodeFreq('f6000');
    showToast('A 6 kHz, muy por encima del corte, el filtro atenúa fuertemente la señal.');
    await sleep(2600);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click();
    await sleep(2200);

    setScenario('offset');
    setOffset('cero');
    showToast('Caso 4 · Offset de CD: sin offset, la senoidal de 1 V de pico cabe cómodamente dentro del rango de ±2.5 V.');
    await sleep(2600);
    setOffset('alto');
    showToast('Con +2.2 V de offset, la cresta positiva (2.2+1.0=3.2 V) supera el límite de 2.5 V: la onda se recorta (clipping).');
    await sleep(2800);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click();
    await sleep(2200);

    showToast('Fin de la demostración: carga (50 Ω/Hi-Z), forma de onda (espectro), barrido/Bode (−3 dB) y offset de CD (clipping).');
  } finally {
    autoRunning=false;
    btnAuto.disabled=false;
    btnAuto.textContent=prevLabel;
  }
}
el('btnAuto').onclick=runAuto;

// ===== Init =====
setActualLoad('50');
setScenario('carga');
S.start();
