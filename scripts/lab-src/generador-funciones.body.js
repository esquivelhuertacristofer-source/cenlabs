// ===== 1) Escenario base =====
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[0.5,3.1,6.6],target:[0.05,1.5,0.3],bgTop:'#0a1620',bgBot:'#03060a',bloom:0.34,minD:3.2,maxD:16});
const {scene}=S;

const std=o=>new THREE.MeshStandardMaterial(o);
const {osciloscopioBanco,bnc,cableCoaxial,plugBNC}=P3;   // §15–§17-B de la biblioteca de piezas
/* Los nombres con los que trabaja la biblioteca de piezas, traducidos una vez a los materiales de oficio de este laboratorio. */
const MATP={
  aluminio:std({color:0x9aa3ab,roughness:0.45,metalness:0.7,envMapIntensity:0.7}),
  acero:std({color:0x8c949b,roughness:0.4,metalness:0.85,envMapIntensity:0.7}),
  cromo:std({color:0x9aa1a8,roughness:0.4,metalness:0.8,envMapIntensity:0.45}),
  chapa:std({color:0x2a313b,roughness:0.6,metalness:0.4}),
  cobre:std({color:0xb87333,roughness:0.35,metalness:0.8}),
  negro:std({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:std({color:0x14181e,roughness:0.85,metalness:0.02}),
  blanco:std({color:0xcfd6dd,roughness:0.40,metalness:0.20}),
  ceramica:std({color:0xcfd6dd,roughness:0.60,metalness:0.05}),
};
const MAT={
  bench: std({color:0x1b232b,roughness:0.55,metalness:0.12,envMapIntensity:0.5}),     // laminado liso del banco
  benchEdge: std({color:0x5d6772,roughness:0.4,metalness:0.8,envMapIntensity:0.6}),   // canto de aluminio
  benchLeg: std({color:0x2c333b,roughness:0.5,metalness:0.6,envMapIntensity:0.5}),
  btnLit: std({color:0x0a1210, emissive:0x3ad9c2, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
  switchBase: std({color:0x0d1013,roughness:0.6,metalness:0.3}),
  switchSlide: std({color:0xc9a02c,metalness:0.3,roughness:0.5}),
  filterBody: std({color:0x5b646e,roughness:0.45,metalness:0.75,envMapIntensity:0.6}),
  filterLit: std({color:0x0a1210, emissive:0xe879f9, emissiveIntensity:0.05, roughness:0.35, metalness:0.1}),
  cord: std({color:0x12151a,roughness:0.8,metalness:0.02}),
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

// ===== 2) Banco: laminado liso sobre patas, con canto de aluminio =====
const BT=0.90;                                   // altura de la cubierta del banco
{
  const top=roundedBox(5.4,0.10,2.9,MAT.bench,0.08); top.position.set(0,BT-0.05,0.25); scene.add(top);
  const canto=roundedBox(5.44,0.03,2.94,MAT.benchEdge,0.3); canto.position.set(0,BT-0.115,0.25); scene.add(canto);
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(0.10,BT-0.13,0.10),MAT.benchLeg);
    leg.position.set(sx*2.55,(BT-0.13)/2,0.25+sz*1.30); leg.castShadow=true; scene.add(leg);
  }
  for(const sz of [-1,1]){ const tr=new THREE.Mesh(new THREE.BoxGeometry(5.1,0.06,0.05),MAT.benchLeg); tr.position.set(0,0.30,0.25+sz*1.30); scene.add(tr); }
  for(const sx of [-1,1]){ const tr=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.06,2.6),MAT.benchLeg); tr.position.set(sx*2.55,0.30,0.25); scene.add(tr); }
}

// ===== 3) Osciloscopio (secundario en esta práctica: pantalla + entrada CH1) =====
const scopeGroup=osciloscopioBanco(MATP,{ancho:1.9,alto:1.2,fondo:0.8,color:0x232a38,
  mandos:[{id:'vdiv',x:0.50,y:0.36,r:0.085,rotulo:'VOLTS/DIV'},{id:'tdiv',x:0.78,y:0.36,r:0.085,rotulo:'TIME/DIV'},{id:'pos',x:0.50,y:0.02,r:0.065,rotulo:'POSICIÓN'},{id:'trig',x:0.78,y:0.02,r:0.065,rotulo:'NIVEL'}],
  bnc:[{x:-0.55,color:0xc9a02c,id:'ch1'},{x:-0.25,color:0x3ad9c2,id:'ch2'}]});
scopeGroup.position.set(-1.38,BT+scopeGroup.userData.apoyo,-0.2);
scene.add(scopeGroup);
registerPart(scopeGroup,'Osciloscopio digital','En esta práctica actúa como instrumento de lectura: un solo canal (CH1) conectado directamente a la salida del generador de funciones.','#ffd166');

const scrCanvas=document.createElement('canvas');
scrCanvas.width=300; scrCanvas.height=240;
const scrTex=new THREE.CanvasTexture(scrCanvas);
scrTex.colorSpace=THREE.SRGBColorSpace;
const screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(scopeGroup.userData.visor.ancho,scopeGroup.userData.visor.alto),new THREE.MeshBasicMaterial({map:scrTex}));
scopeGroup.userData.pantalla.add(screenMesh);
registerPart(screenMesh,'Pantalla','Traza, espectro o curva de Bode se dibujan aquí según el caso activo.','#ffd166');

const jackCh1=scopeGroup.userData.bnc[0];
registerPart(jackCh1,'Entrada CH1 (BNC)','Entrada de alta impedancia (Hi-Z) del osciloscopio, salvo que se le conecte un terminador externo de 50 Ω.','#ffd166');
registerPart(scopeGroup.userData.mandos.vdiv.grip,'Volts/división','Fija en esta práctica para que la lectura dependa de la carga y no de la escala vertical.','#8aa0b8');

// ===== 4) Generador de funciones (protagonista de esta práctica) =====
const srcGroup=osciloscopioBanco(MATP,{ancho:1.62,alto:0.66,fondo:0.70,color:0x3a4553,teclas:false,
  pantallaX:-0.40,pantallaY:0.07,visor:[0.66,0.30],
  mandos:[{id:'amp',x:0.14,y:0.10,r:0.075,rotulo:'AMPL'},{id:'freq',x:0.40,y:0.10,r:0.075,rotulo:'FREQ'},{id:'off',x:0.66,y:0.10,r:0.075,rotulo:'OFFSET'}],
  botones:[{id:'sine',x:0.15,y:-0.12,ancho:0.15,alto:0.06,luz:true},{id:'square',x:0.37,y:-0.12,ancho:0.15,alto:0.06,luz:true}],
  bnc:[{x:0.67,color:0xc9a02c,id:'out'}]});
srcGroup.position.set(1.42,BT+srcGroup.userData.apoyo,-0.15);
scene.add(srcGroup);
registerPart(srcGroup,'Generador de funciones','Produce la señal de prueba (senoidal o cuadrada) para los cuatro casos de esta práctica: carga, forma de onda, barrido en frecuencia y offset de CD.','#8aa0b8');

const genCanvas=document.createElement('canvas');
genCanvas.width=220; genCanvas.height=100;
const genTex=new THREE.CanvasTexture(genCanvas);
genTex.colorSpace=THREE.SRGBColorSpace;
const genScreenMesh=new THREE.Mesh(new THREE.PlaneGeometry(srcGroup.userData.visor.ancho,srcGroup.userData.visor.alto),new THREE.MeshBasicMaterial({map:genTex}));
srcGroup.userData.pantalla.add(genScreenMesh);
registerPart(genScreenMesh,'Lectura del generador','Muestra la amplitud y frecuencia PROGRAMADAS. En el Caso 3 (Barrido), esta lectura de Vin se toma como referencia confiable, ya que proviene directamente de la fuente.','#8aa0b8');

const ampKnob=srcGroup.userData.mandos.amp, freqKnob=srcGroup.userData.mandos.freq, offsetKnob=srcGroup.userData.mandos.off;
registerPart(ampKnob.grip,'Perilla de amplitud','Ajusta la amplitud programada (Vpp). El valor real que llega a la carga depende también del ajuste de carga (Load) y de la impedancia realmente conectada.','#8aa0b8');
registerPart(freqKnob.grip,'Perilla de frecuencia','Ajusta la frecuencia de la señal de salida — variable en el Caso 3 (Barrido/Bode).','#8aa0b8');
registerPart(offsetKnob.grip,'Perilla de offset de CD','Suma un nivel de voltaje de corriente directa constante sobre la señal alterna — Caso 4.','#8aa0b8');
srcGroup.userData.rotulo('SENO',0.15,-0.185,0.16,30);
srcGroup.userData.rotulo('CUADRADA',0.37,-0.185,0.20,26);

const waveBtnSine=srcGroup.userData.botones.sine;
registerPart(waveBtnSine,'Forma de onda: senoidal','Selecciona una salida senoidal — espectralmente pura, un único tono. Caso 2.','#5eead4');
const waveBtnSquare=srcGroup.userData.botones.square;
registerPart(waveBtnSquare,'Forma de onda: cuadrada','Selecciona una salida cuadrada — contiene una fundamental más armónicos impares (3f, 5f, 7f…). Caso 2.','#5eead4');

// selector de carga: interruptor deslizante 50 Ω / Hi-Z en el frente
const ZFg=srcGroup.userData.frente;
const loadTrack=new THREE.Mesh(new THREE.BoxGeometry(0.20,0.022,0.020),MAT.switchBase);
loadTrack.position.set(-0.50,-0.17,ZFg+0.004);
srcGroup.add(loadTrack);
const LOAD_X={'50':-0.555,'hiz':-0.445};
const loadSlide=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.045,0.04),MAT.switchSlide);
loadSlide.position.set(LOAD_X['50'],-0.17,ZFg+0.014);
srcGroup.add(loadSlide);
srcGroup.userData.rotulo('LOAD',-0.50,-0.095,0.16,26);
srcGroup.userData.rotulo('50Ω',-0.58,-0.235,0.12,24);
srcGroup.userData.rotulo('Hi-Z',-0.42,-0.235,0.12,24);
registerPart(loadSlide,'Selector de carga (Load: 50 Ω / Hi-Z)','Le indica al generador qué impedancia de carga asumir para calibrar su voltaje de salida. Debe coincidir con la carga realmente conectada, o la amplitud leída será incorrecta por un factor de 2 (dato de hoja de fabricante). Caso 1.','#ffd166');

const termOut=srcGroup.userData.bnc[0];
srcGroup.userData.rotulo('SALIDA 50Ω',0.67,-0.31,0.22,22);
registerPart(termOut,'Salida de señal (BNC)','Punto de salida hacia el cable que conecta con el osciloscopio (directamente, o a través del filtro RC en el Caso 3).','#8aa0b8');

// ===== 5) Filtro RC (accesorio del Caso 3 · Barrido/Bode): caja de aluminio con BNC de entrada y salida =====
const filterGroup=new THREE.Group();
filterGroup.position.set(0.05,BT+0.075,1.42);
scene.add(filterGroup);
const filterBody=roundedBox(0.70,0.15,0.34,MAT.filterBody,0.12);
filterGroup.add(filterBody);
registerPart(filterBody,'Filtro RC (paso bajo, un polo)','R = 1.6 kΩ, C = 100 nF → f_c = 1/(2πRC) ≈ 995 Hz. Solo interviene en el Caso 3 (Barrido/Bode); en los demás casos el generador se conecta directo al osciloscopio.','#e879f9');
for(const s of [-1,1]){
  const j=bnc(MATP,{d:0.10,largo:0.09,color:s<0?0x3ad9c2:0xc9a02c});
  j.rotation.y=s*Math.PI/2; j.position.set(s*0.35,0.0,0); filterGroup.add(j);
}
{ const tx=new THREE.CanvasTexture((()=>{ const c=document.createElement('canvas'); c.width=256; c.height=96; const x=c.getContext('2d');
    x.clearRect(0,0,256,96); x.fillStyle='#e8edf2'; x.textAlign='center'; x.textBaseline='middle';
    x.font='bold 40px sans-serif'; x.fillText('FILTRO RC',128,30); x.font='bold 28px sans-serif'; x.fillText('1,6 kΩ · 100 nF',128,70); return c; })());
  tx.colorSpace=THREE.SRGBColorSpace; tx.anisotropy=8;
  const et=new THREE.Mesh(new THREE.PlaneGeometry(0.40,0.15),new THREE.MeshStandardMaterial({map:tx,transparent:true,roughness:0.6,metalness:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  et.rotation.x=-Math.PI/2; et.position.set(0,0.0765,0.02); filterGroup.add(et); }
const filterLed=new THREE.Mesh(new THREE.SphereGeometry(0.026,14,10),MAT.filterLit);
filterLed.position.set(0.22,0.074,-0.10); filterLed.scale.y=0.55;
filterGroup.add(filterLed);
registerPart(filterLed,'Indicador del filtro','Se ilumina cuando el Caso 3 (Barrido/Bode) está activo, recordando que la señal pasa por el filtro RC antes de llegar al osciloscopio.','#e879f9');

// ===== 6) Cableado: coaxial negro con conectores BNC, y los cordones de red =====
scene.updateMatrixWorld(true);
const bocaGen=termOut.localToWorld(new THREE.Vector3(0,0,0.10));
const bocaScope=jackCh1.localToWorld(new THREE.Vector3(0,0,0.10));
/* En el CH1 va un adaptador en T: por un brazo entra el cable, por el otro cuelga el terminador de 50 Ω cuando la carga real es de 50 Ω. */
const teeLargo=0.13;
const tee=new THREE.Group(); tee.position.copy(bocaScope); scene.add(tee);
{
  const mm=MATP.cromo;
  const br=new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.052,teeLargo,16),mm); br.rotation.x=Math.PI/2; br.position.z=teeLargo/2; br.castShadow=true; tee.add(br);
  const an=new THREE.Mesh(new THREE.CylinderGeometry(0.066,0.066,0.03,16),mm); an.rotation.x=Math.PI/2; an.position.z=0.016; tee.add(an);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(0.043,0.043,0.10,14),mm); st.rotation.z=Math.PI/2; st.position.set(0.05,0,teeLargo*0.55); tee.add(st);
}
const termCap=new THREE.Mesh(new THREE.CylinderGeometry(0.058,0.058,0.13,16),std({color:0x3a2a5a,roughness:0.55,metalness:0.2}));
termCap.rotation.z=Math.PI/2;
termCap.position.set(0.165,0,teeLargo*0.55);
termCap.visible=false;
{ const an=new THREE.Mesh(new THREE.TorusGeometry(0.058,0.011,8,18),std({color:0xc77dff,roughness:0.5,metalness:0.2})); an.rotation.y=Math.PI/2; an.position.set(0.10,0,0); termCap.add(an); }
tee.add(termCap);
registerPart(termCap,'Terminador de 50 Ω','Adaptador que presenta una carga real de 50 Ω a la entrada del osciloscopio. Sin él, la entrada es de alta impedancia (Hi-Z). Solo relevante en el Caso 1 (Carga).','#c77dff');
const cableGenScope=cableCoaxial(MATP,bocaGen,new THREE.Vector3(0,0,1),bocaScope.clone().add(new THREE.Vector3(0,0,teeLargo)),new THREE.Vector3(0,0,1),{r:0.026,suelo:BT});
scene.add(cableGenScope);
// cordones de alimentación hacia el fondo del banco
for(const [g,dx] of [[scopeGroup,-0.5],[srcGroup,0.4]]){
  const p0=g.localToWorld(new THREE.Vector3(dx,-0.2,-g.userData.fondo/2));
  const cur=new THREE.CatmullRomCurve3([p0,p0.clone().add(new THREE.Vector3(0,-0.05,-0.18)),new THREE.Vector3(p0.x,BT+0.02,p0.z-0.35),new THREE.Vector3(p0.x+dx*0.4,BT+0.02,-1.15)]);
  scene.add(new THREE.Mesh(new THREE.TubeGeometry(cur,24,0.016,8,false),MAT.cord));
}


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

/* Las preguntas numéricas (carga, barrido y offset) se SIEMBRAN: cada alumno, y cada
   vez que agota tres intentos, recibe otras cifras, distintas del escenario de
   práctica de la pantalla (2.0 Vpp, f_c ≈ 995 Hz, +2.2 V), así que explorar no
   entrega la respuesta. La conceptual (forma de onda) lleva un banco de
   distractores: salen 3 de 5, barajados. */
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffled=a=>{ const b=a.slice(); for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; };
const nf=(v,d=3)=>String(+(+v).toFixed(d));
const fHz=v=>v>=1000?nf(v/1000)+' kHz':nf(v)+' Hz';
const QUESTIONS={
  forma:{
    prompt:'¿Por qué el espectro de una onda cuadrada muestra varios picos además de la frecuencia fundamental, mientras que una onda senoidal de la misma frecuencia muestra solo uno?',
    opts:[
      {t:'La onda cuadrada lleva más ruido eléctrico de fondo, y el espectro lo dibuja como una serie de picos secundarios',ok:false},
      {t:'Una cuadrada es la suma de una fundamental y armónicos impares (serie de Fourier): esos son los picos extra',ok:true},
      {t:'El osciloscopio calcula mal la FFT de las ondas cuadradas y dibuja picos que en realidad no existen',ok:false},
      {t:'La onda cuadrada tiene en realidad el doble de frecuencia, y los picos extra son simplemente múltiplos de ese valor',ok:false},
    ],
    extra:[
      {t:'La cuadrada se muestrea a una frecuencia distinta que la senoidal, y esa diferencia crea los picos adicionales',ok:false},
      {t:'Los picos extra son armónicos pares, que aparecen siempre que la onda tiene flancos rápidos',ok:false},
    ],
  },
};
const QGEN={
  carga:()=>{
    const vset=pick([1.0,1.5,2.5,3.0,4.0,5.0]);
    const sube=pick([true,false]);   // true: Load=50 Ω y carga real Hi-Z (×2); false: Load=Hi-Z y carga real 50 Ω (×½)
    const ok=sube?2*vset:vset/2;
    const malas=shuffled((sube?[vset,vset/2,4*vset,vset/4]:[vset,2*vset,vset/4,4*vset]).filter(v=>v!==ok))
      .map(v=>({t:nf(v)+' Vpp',ok:false}));
    return sube?{
      prompt:'El generador está configurado para carga de 50 Ω y su pantalla indica '+nf(vset)+' Vpp. Lo conectas directo a la entrada de alta impedancia (Hi-Z) del osciloscopio, sin terminador. ¿Qué amplitud pico a pico muestra realmente la pantalla del osciloscopio?',
      opts:[{t:nf(ok)+' Vpp',ok:true}].concat(malas.slice(0,3)), extra:malas.slice(3),
      hint:'Con Load = 50 Ω el generador calibra su amplitud suponiendo una carga de 50 Ω; sin ella no hay divisor de tensión y la amplitud real es el doble: 2 × '+nf(vset)+' = '+nf(ok)+' Vpp.',
    }:{
      prompt:'El generador está configurado para carga Hi-Z y su pantalla indica '+nf(vset)+' Vpp. Lo conectas a una carga de 50 Ω (un terminador) en vez de a alta impedancia. ¿Qué amplitud pico a pico llega realmente a esa carga?',
      opts:[{t:nf(ok)+' Vpp',ok:true}].concat(malas.slice(0,3)), extra:malas.slice(3),
      hint:'Con Load = Hi-Z el generador calibra su amplitud en circuito abierto; con una carga de 50 Ω la impedancia de salida (50 Ω) forma un divisor 1:2 y llega la mitad: '+nf(vset)+' / 2 = '+nf(ok)+' Vpp.',
    };
  },
  barrido:()=>{
    const c=pick([100,400,2500,6000]);
    const fc=Math.round(c*pick([0.9,1.1]));
    const malos=shuffled([50,100,200,400,800,1000,1600,2500,4000,6000,10000,15000].filter(v=>v/fc<0.5||v/fc>2)).map(v=>({t:fHz(v),ok:false}));
    return {
      prompt:'Barriste el generador en frecuencia a través de un filtro RC (f_c ≈ '+nf(fc)+' Hz) y mediste la ganancia en cada paso. ¿Cuál de estas frecuencias de prueba está MÁS CERCA del punto de −3 dB (70.7%)?',
      opts:[{t:fHz(c),ok:true}].concat(malos.slice(0,3)), extra:malos.slice(3,5),
      hint:'El punto de −3 dB está en f_c = 1/(2πRC) ≈ '+nf(fc)+' Hz; de las frecuencias propuestas, '+fHz(c)+' es la más cercana a ese punto.',
    };
  },
  offset:()=>{
    let off,amp,P;
    do{ off=pick([0.5,1.2,1.6,2.0,2.4,2.8]); amp=pick([0.8,1.0,1.2,1.5]); P=+(off+amp).toFixed(2); }
    while((off===2.2&&amp===1.0)||Math.abs(P-OFFSET_RAIL)<0.15);
    const clip=P>OFFSET_RAIL;
    const tClip='Se recorta (clipping): la cresta se aplana en +'+nf(OFFSET_RAIL)+' V en vez de llegar a +'+nf(P)+' V';
    const tLibre='Llega completa a +'+nf(P)+' V: no hay recorte, porque queda por debajo del límite de +'+nf(OFFSET_RAIL)+' V';
    const malas=shuffled([
      {t:clip?tLibre:tClip,ok:false},
      {t:'La frecuencia de la señal se distorsiona, porque el offset cambia su periodo',ok:false},
      {t:'El osciloscopio se apaga automáticamente por sobretensión en la entrada',ok:false},
      {t:'Se recorta la cresta negativa en −'+nf(OFFSET_RAIL)+' V en lugar de la positiva',ok:false},
      {t:'La amplitud pico a pico se duplica, porque el offset se suma dos veces',ok:false},
    ]);
    return {
      prompt:'Programas un offset de +'+nf(off)+' V de CD sobre una señal senoidal de '+nf(amp)+' V de amplitud (pico). El circuito solo puede mostrar sin distorsión hasta ±'+nf(OFFSET_RAIL)+' V. ¿Qué le pasa a la cresta positiva de la onda?',
      opts:[{t:clip?tClip:tLibre,ok:true}].concat(malas.slice(0,3)), extra:malas.slice(3),
      hint:'El pico real es V_offset + V_amplitud = '+nf(off)+' + '+nf(amp)+' = '+nf(P)+' V. '+(clip?'Como supera el límite de '+nf(OFFSET_RAIL)+' V, la cresta se recorta en línea recta.':'Como no supera el límite de '+nf(OFFSET_RAIL)+' V, la señal cabe completa.'),
    };
  },
};
const qCur={};
function getQ(key){ return qCur[key]||(qCur[key]=QGEN[key]?QGEN[key]():QUESTIONS[key]); }
function reseedQ(key){ delete qCur[key]; return getQ(key); }
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
const hintFor=k=>(getQ(k).hint)||DX_HINT[k];
/* Contabilidad del reto. Tres fallos seguidos en un caso lo resiembran con otras
   cifras u otros distractores, para que no se apruebe descartando opciones. */
const answered={carga:false,forma:false,barrido:false,offset:false};
const fallosCaso={carga:0,forma:0,barrido:0,offset:0};
const RETO={intentos:0,resiembras:0};

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

function refreshCaseLabel(){ el('p_case').textContent=`Caso ${SCEN_ORDER.indexOf(scenarioKey)+1}/4 · ${Object.values(answered).filter(Boolean).length}/4 ✔ · intentos ${RETO.intentos}`; }
function clearDx(){ document.querySelectorAll('#dxWrap .b.dx').forEach(b=>b.classList.remove('right','wrong')); }

const qEl=el('q_prompt');
function renderQuestion(){
  qEl.style.textTransform='none';
  const q=getQ(scenarioKey);
  qEl.textContent=q.prompt;
  const buenas=q.opts.filter(o=>o.ok), malas=q.opts.filter(o=>!o.ok).concat(q.extra||[]);
  const opts=shuffled(buenas.concat(shuffled(malas).slice(0,3)));
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
    if(autoRunning) return;                 // la demostración enseña, no puntúa
    if(answered[scenarioKey]){ showToast('Este caso ya está resuelto: pasa al siguiente.'); return; }
    clearDx();
    const ok=btn.dataset.ok==='1';
    btn.classList.add(ok?'right':'wrong');
    RETO.intentos++;
    if(ok){
      answered[scenarioKey]=true; fallosCaso[scenarioKey]=0;
      synth.beep(1100,0.09,0.05);
      showToast(`<b>✔ Correcto</b><br>${hintFor(scenarioKey)}`);
    } else {
      synth.beep(220,0.22,0.05);
      fallosCaso[scenarioKey]++;
      if(fallosCaso[scenarioKey]>=3){
        fallosCaso[scenarioKey]=0; RETO.resiembras++;
        reseedQ(scenarioKey); renderQuestion();
        showToast('✘ Tres fallos en este caso: la pregunta cambia. Vuelve a mirar la telemetría y razona.');
      } else {
        showToast('✘ No es correcto. Revisa la telemetría e inténtalo de nuevo (fallos en este caso: '+fallosCaso[scenarioKey]+'/3).');
      }
    }
    refreshCaseLabel();
  };
});

const btnEnergize=el('btnEnergize');
btnEnergize.onclick=()=>{
  energized=!energized;
  synth.init(); synth.resume();
  btnEnergize.classList.toggle('on',energized);
  btnEnergize.textContent=energized?'🔌 Desconectar generador':'🔌 Conectar generador';
  if(energized){
    S.moveTo([2.6,2.6,5.6],[0.05,1.45,0.3],1.3);
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
  const previo={escenario:scenarioKey,energizado:energized,gen:genLoadKey,real:actualLoadKey,wave:waveKey,bode:bodeFreqKey,offset:offsetKey};
  const explica=txt=>showToast('<b>✔ La explicación</b><br>'+txt);
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
    explica(DX_HINT.carga+' En la pregunta las cifras y la combinación de cargas serán otras.');
    await sleep(2800);

    setScenario('forma');
    setWave('sine');
    showToast('Caso 2 · Forma de onda: una senoidal pura muestra un único pico en el espectro — la fundamental.');
    await sleep(2600);
    setWave('square');
    showToast('Una onda cuadrada de la misma frecuencia muestra la fundamental MÁS armónicos impares (3f, 5f, 7f, 9f…).');
    await sleep(2800);
    explica(DX_HINT.forma);
    await sleep(2800);

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
    explica(DX_HINT.barrido+' En la pregunta el filtro tendrá otra frecuencia de corte.');
    await sleep(2800);

    setScenario('offset');
    setOffset('cero');
    showToast('Caso 4 · Offset de CD: sin offset, la senoidal de 1 V de pico cabe cómodamente dentro del rango de ±2.5 V.');
    await sleep(2600);
    setOffset('alto');
    showToast('Con +2.2 V de offset, la cresta positiva (2.2+1.0=3.2 V) supera el límite de 2.5 V: la onda se recorta (clipping).');
    await sleep(2800);
    explica(DX_HINT.offset+' En la pregunta el offset y la amplitud serán otros.');
    await sleep(2800);

    showToast('Fin de la demostración: carga (50 Ω/Hi-Z), forma de onda (espectro), barrido/Bode (−3 dB) y offset de CD (clipping). Tu avance en las preguntas no cambió.');
  } finally {
    // El alumno se queda donde estaba: mismo caso y mismos controles; sus respuestas no se tocaron.
    setScenario(previo.escenario); setGenLoad(previo.gen); setActualLoad(previo.real); setWave(previo.wave);
    setBodeFreq(previo.bode); setOffset(previo.offset);
    if(energized!==previo.energizado) btnEnergize.click();
    autoRunning=false;
    btnAuto.disabled=false;
    btnAuto.textContent=prevLabel;
  }
}
el('btnAuto').onclick=runAuto;

// ===== Init =====
window.__labDebug={
  get mode(){ return scenarioKey; },
  get solved(){ return Object.values(answered).every(Boolean); },
  get intentos(){ return RETO.intentos; },
  state(){ return {caso:scenarioKey,energizado:energized,answered:{...answered},intentos:RETO.intentos,
    fallos:{...fallosCaso},resiembras:RETO.resiembras,resuelto:Object.values(answered).every(Boolean),autoRunning}; },
  setScenario(k){ setScenario(k); },
  conecta(){ if(!energized) btnEnergize.click(); },
  opciones(){ return [...document.querySelectorAll('#dxWrap .b.dx')].map(b=>({t:b.textContent,ok:b.dataset.ok==='1'})); },
};
setActualLoad('50');
setScenario('carga');
S.start();
