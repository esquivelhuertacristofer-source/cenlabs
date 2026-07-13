const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.4,3.3,6.4],target:[0,1.0,0],bgTop:'#0a1620',bgBot:'#03060a',bloom:0.4,minD:3.4,maxD:17});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.08,0.09,0.11), rub=rubber();
const MAT={
  bench: std({...plas, metalness:0.15, roughness:0.75}),
  block: std({...alu, metalness:0.5, roughness:0.65}),
  toolBody: std({...plas, color:0xff8c1a, metalness:0.25, roughness:0.5}),
  toolGrip: std({...rub, color:0x14100c, roughness:1.0, metalness:0.0}),
  jaw: std({...brush, color:0xd8d8d8, metalness:0.85, roughness:0.3}),
  post: std({...brush, color:0xd8b24a, metalness:0.9, roughness:0.3}),
  wireHot: std({...rub, color:0xb8342f, roughness:0.9, metalness:0.0}),
  wireReturn: std({...rub, color:0x23262c, roughness:0.9, metalness:0.0}),
  wireNeutral: std({...rub, color:0xcfd0c8, roughness:0.85, metalness:0.0}),
  jumper: std({...rub, color:0xffd166, roughness:0.8, metalness:0.05}),
  shuntBody: std({color:0xece7dc, roughness:0.55, metalness:0.1}),
  shuntCap: std({...brush, color:0xc9c9c9, metalness:0.9, roughness:0.25}),
  statusLed: std({color:0x0a1210, emissive:0x2ad9c2, emissiveIntensity:0.3, roughness:0.35, metalness:0.1}),
  lamp: std({color:0x2a1408, emissive:0xff6a1a, emissiveIntensity:0.0, roughness:0.4, metalness:0.1}),
  fin: std({...brush, color:0xb0342f, metalness:0.6, roughness:0.5}),
  motor: std({...alu, metalness:0.6, roughness:0.6}),
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

/* ---------- 1) BANCO ---------- */
const bench=roundedBox(6.6,0.28,3.7,MAT.bench,0.05);
bench.position.set(0,-0.02,0);
scene.add(bench);

/* ---------- 2) FUENTE ---------- */
const srcGroup=new THREE.Group();
srcGroup.position.set(-2.3,0.86,0);
scene.add(srcGroup);
const srcBody=roundedBox(0.95,0.78,0.78,MAT.block,0.10);
srcGroup.add(srcBody);
registerPart(srcBody,'Fuente','Fuente de alimentación del circuito bajo prueba (batería CD o toma de corriente CA, según el escenario).','#4fd1c5');

/* ---------- 3) CARGA ---------- */
const loadGroup=new THREE.Group();
loadGroup.position.set(1.9,0.86,0);
scene.add(loadGroup);
const loadBody=roundedBox(0.95,0.78,0.78,MAT.block,0.10);
loadGroup.add(loadBody);
registerPart(loadBody,'Carga','Elemento que consume la corriente: motor de arranque, calefactor resistivo o bobina de relevador, según el escenario.','#4fd1c5');

const motorShaft=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.11,0.55,16),MAT.motor);
motorShaft.rotation.x=Math.PI/2;
motorShaft.position.set(0,0,0.62);
loadGroup.add(motorShaft);

const finMat=MAT.fin.clone();
finMat.emissive=new THREE.Color(0xff5a3c);
finMat.emissiveIntensity=0;
const finMeshes=[-0.3,-0.1,0.1,0.3].map(zi=>{
  const f=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.52,0.09),finMat);
  f.position.set(0.02,0,zi);
  loadGroup.add(f);
  return f;
});

const pilotLamp=new THREE.Mesh(new THREE.SphereGeometry(0.09,16,16),MAT.lamp);
pilotLamp.position.set(0,0.52,0);
loadGroup.add(pilotLamp);

/* ---------- 4) CABLEADO ---------- */
function cableTube(points,radius,mat){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,40,radius,8,false),mat);
  scene.add(m);
  return m;
}
const gapPostA=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.16,14),MAT.post);
gapPostA.position.set(-0.35,0.94,0.45);
scene.add(gapPostA);
registerPart(gapPostA,'Terminal A','Poste de conexión donde se inserta el shunt o el puente directo.','#d8b24a');

const gapPostB=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.16,14),MAT.post);
gapPostB.position.set(0.35,0.94,0.45);
scene.add(gapPostB);

const cableHotFeedA=cableTube([[-1.85,0.86,0.05],[-1.0,0.86,0.45],[-0.35,0.94,0.45]],0.035,MAT.wireHot);
const cableHotFeedB=cableTube([[0.35,0.94,0.45],[1.0,0.86,0.45],[1.45,0.86,0.05]],0.035,MAT.wireHot);
const cableHotReturn=cableTube([[1.45,0.86,-0.05],[0,0.86,-0.55],[-1.85,0.86,-0.05]],0.035,MAT.wireReturn);
const cableNeutralReturn=cableTube([[1.45,0.86,-0.20],[0,0.86,-0.41],[-1.85,0.86,-0.20]],0.032,MAT.wireNeutral);
registerPart(cableNeutralReturn,'Neutro','Conductor de retorno del cordón dúplex de CA. Solo presente en el escenario del calefactor.','#cfd0c8');

/* ---------- 5) EMPALME / SHUNT ---------- */
const jumperWire=cableTube([[-0.35,0.95,0.45],[0,0.99,0.45],[0.35,0.95,0.45]],0.025,MAT.jumper);
registerPart(jumperWire,'Puente','Puente directo que cierra el lazo cuando el shunt está fuera de servicio: la corriente no pasa por el shunt.','#ffd166');

const shuntModule=new THREE.Group();
shuntModule.position.set(0,0.94,0.45);
shuntModule.visible=false;
scene.add(shuntModule);
const shuntBodyMesh=roundedBox(0.62,0.20,0.20,MAT.shuntBody,0.15);
shuntModule.add(shuntBodyMesh);
const shuntCapA=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.06,16),MAT.shuntCap);
shuntCapA.rotation.z=Math.PI/2; shuntCapA.position.set(-0.31,0,0);
shuntModule.add(shuntCapA);
const shuntCapB=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.06,16),MAT.shuntCap);
shuntCapB.rotation.z=Math.PI/2; shuntCapB.position.set(0.31,0,0);
shuntModule.add(shuntCapB);
registerPart(shuntBodyMesh,'Shunt','Resistencia patrón de muy bajo valor (miliohms). Se inserta EN SERIE: toda la corriente la atraviesa y genera una caída de tensión proporcional (ley de Ohm) que el instrumento convierte en lectura de corriente.','#ffd166');

/* ---------- 6) PINZA AMPERIMÉTRICA ---------- */
const clampGroup=new THREE.Group();
clampGroup.position.set(0,0.86,-0.55);
scene.add(clampGroup);

const jawRingMat=MAT.jaw.clone();
jawRingMat.emissive=new THREE.Color(0x4fd1c5);
jawRingMat.emissiveIntensity=0.05;
const jawRing=new THREE.Mesh(new THREE.TorusGeometry(0.13,0.028,10,28),jawRingMat);
jawRing.rotation.y=Math.PI/2;
clampGroup.add(jawRing);

const clampCase=roundedBox(0.42,0.62,0.28,MAT.toolBody,0.14);
clampCase.position.set(0,0.5,0.05);
clampGroup.add(clampCase);

const clampGrip=roundedBox(0.20,0.32,0.20,MAT.toolGrip,0.20);
clampGrip.position.set(0,0.86,0.08);
clampGroup.add(clampGrip);

const statusLed=new THREE.Mesh(new THREE.SphereGeometry(0.025,10,10),MAT.statusLed);
statusLed.position.set(0.15,0.75,0.16);
clampGroup.add(statusLed);

const scrCanvas=document.createElement('canvas');
scrCanvas.width=220; scrCanvas.height=260;
const scrTex=new THREE.CanvasTexture(scrCanvas);
scrTex.colorSpace=THREE.SRGBColorSpace;
scrTex.minFilter=THREE.LinearFilter;
scrTex.generateMipmaps=false;
const screenMesh=new THREE.Mesh(new THREE.PlaneGeometry(0.30,0.355),new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false}));
screenMesh.position.set(0,0.58,0.20);
clampGroup.add(screenMesh);

registerPart(clampCase,'Pinza amperimétrica','Mide la corriente SIN abrir el circuito, detectando el campo magnético que la rodea (efecto Hall o transformador de corriente).','#4fd1c5');
registerPart(jawRing,'Mordaza','Se abre para rodear el conductor sin desconectarlo — por eso la pinza no altera el circuito que mide.','#4fd1c5');

/* ---------- 7) inspección por clic ---------- */
const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return; let o=hit.object;
  while(o){
    const p=PARTS.find(x=>x.mesh===o);
    if(p){ showToast(`<b style="color:var(--accent)">${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.desc}</span>`); return; }
    o=o.parent;
  }
});

/* ---------- 8) etiquetas al pasar el cursor ---------- */
(function(){
  const dom=S.renderer.domElement, ray=new THREE.Raycaster(), mv=new THREE.Vector2();
  let shown=null;
  const setShown=lb=>{ if(shown===lb)return; if(shown)shown.visible=false; shown=lb; if(lb)lb.visible=true; };
  dom.addEventListener('pointermove',e=>{
    const rect=dom.getBoundingClientRect();
    mv.x=((e.clientX-rect.left)/rect.width)*2-1;
    mv.y=-((e.clientY-rect.top)/rect.height)*2+1;
    ray.setFromCamera(mv,S.camera);
    const hits=ray.intersectObjects(scene.children,true);
    let lb=null;
    if(hits.length){
      let o=hits[0].object;
      while(o){ if(HOVER_LABELS.has(o)){ lb=HOVER_LABELS.get(o); break; } o=o.parent; }
    }
    setShown(lb);
    dom.style.cursor = lb ? 'pointer' : '';
  });
  dom.addEventListener('pointerleave',()=>setShown(null));
})();

/* ---------- 9) MODELO DE DATOS ---------- */
const CLAMP_RANGES=[6,60,600];
const CLAMP_COUNTS=6000;
const CLAMP_SPEC={pct:2.0, dig:5};
const SHUNT_SPEC={pct:0.5, dig:2, counts:2000};
const OFFSET_HALL_CD=1.20;

const SCEN_ORDER=['arranque','calefactor','testigo'];
const SCEN_META={
  arranque:{
    nombre:'Motor de arranque', tipo:'dc',
    vSrc:2.80, rLoop:0.0140,
    shuntRated:100, shuntMv:75,
    fuente:'Batería 12 V (bajo carga de arranque)', carga:'Motor de arranque CD',
    respuesta:'carga',
  },
  calefactor:{
    nombre:'Calefactor eléctrico', tipo:'ac',
    vSrc:127.0, potenciaNominal:1200,
    shuntRated:10, shuntMv:75,
    fuente:'Toma de corriente 127 V CA', carga:'Calefactor resistivo 1200 W',
    respuesta:'ampere',
  },
  testigo:{
    nombre:'Circuito de control', tipo:'dc',
    vSrc:12.0, rLoop:60.0,
    shuntRated:1, shuntMv:75,
    fuente:'Batería 12 V (circuito de control)', carga:'Bobina de relevador 60 Ω',
    respuesta:'offset',
  },
};
const DX_HINT={
  carga: 'Al insertar el shunt en serie, R_shunt se suma a la resistencia del lazo: la corriente REAL baja (efecto de carga / error de inserción). Pinza y shunt coinciden porque ambos miden la MISMA corriente ya alterada.',
  ampere: 'Una pinza mide la corriente neta encerrada por su mordaza (ley de Ampère). Si abraza el vivo Y el neutro de un cordón dúplex, la corriente de ida y la de vuelta se cancelan — por eso marca ≈0 A aunque el calefactor esté prendido. Es el mismo principio que usa un interruptor GFCI/RCD.',
  offset: 'El sensor Hall de CD tiene un pequeño offset de cero (aquí ~1.2 A) que no se nota en corrientes grandes, pero domina por completo una corriente pequeña como la de una bobina de relevador (0.2 A). Por eso hay que tarar el instrumento antes de medir señales pequeñas.',
  falla: 'Antes de sospechar que el instrumento está descalibrado, compara contra una segunda medición (p. ej. el shunt) y revisa el procedimiento — casi siempre la discrepancia tiene una explicación física, no una falla del equipo.',
};

function rLoopOf(m){ return m.rLoop!==undefined ? m.rLoop : (m.vSrc*m.vSrc/m.potenciaNominal); }
function rShuntOf(m){ return (m.shuntMv/1000)/m.shuntRated; }
function iTrueOf(m){ return m.vSrc/rLoopOf(m); }
function iLoadedOf(m){ return m.vSrc/(rLoopOf(m)+rShuntOf(m)); }

function clampRangeFor(reading){
  const a=Math.abs(reading);
  for(const r of CLAMP_RANGES) if(a<=r) return r;
  return CLAMP_RANGES[CLAMP_RANGES.length-1];
}
function clampUncertainty(reading){
  const range=clampRangeFor(reading);
  const resolution=range/CLAMP_COUNTS;
  const U=Math.abs(reading)*CLAMP_SPEC.pct/100 + CLAMP_SPEC.dig*resolution;
  return {range,resolution,U};
}
function shuntUncertainty(reading,ratedCurrent){
  const resolution=ratedCurrent/SHUNT_SPEC.counts;
  const U=Math.abs(reading)*SHUNT_SPEC.pct/100 + SHUNT_SPEC.dig*resolution;
  return {resolution,U};
}
function clampReadingFor(scenKey,iActualNow){
  const m=SCEN_META[scenKey];
  let trueSeen=iActualNow;
  if(scenKey==='calefactor' && clampPos==='ambos') trueSeen=0;
  if(clampMode==='ct' && m.tipo==='dc'){ return {fault:true, text:'— (TC no mide CD)'}; }
  let reading=trueSeen;
  if(clampMode==='hall' && m.tipo==='dc' && !zeroed) reading+=OFFSET_HALL_CD;
  const u=clampUncertainty(reading);
  return {fault:false, reading, range:u.range, resolution:u.resolution, U:u.U};
}
function shuntReadingFor(scenKey,iActualNow){
  if(!shuntIn) return {inserted:false};
  const m=SCEN_META[scenKey];
  const u=shuntUncertainty(iActualNow,m.shuntRated);
  return {inserted:true, reading:iActualNow, resolution:u.resolution, U:u.U};
}

let scenarioKey='arranque';
let shuntIn=false;
let clampMode='hall';
let clampPos='vivo';
let zeroed=false;
let energized=false;
let insertedOnce=false;

function computeTargets(){
  const m=SCEN_META[scenarioKey];
  const iReal=energized ? (shuntIn ? iLoadedOf(m) : iTrueOf(m)) : 0;
  return {iReal};
}
let targets=computeTargets();
let iLive=0;

const synth=makeSynth({type:'sine',type2:'sine',filterFreq:900,Q:1});

/* ---------- 10) ANIMACIÓN ---------- */
S.setAnimate((dt,time)=>{
  targets=computeTargets();
  iLive+=(targets.iReal-iLive)*Math.min(1,dt*3.0);

  let jawZTarget=-0.55, jawScaleTarget=1.0;
  if(scenarioKey==='calefactor' && clampPos==='ambos'){ jawZTarget=-0.48; jawScaleTarget=1.55; }
  clampGroup.position.z+=(jawZTarget-clampGroup.position.z)*Math.min(1,dt*4.0);
  const newScale=jawRing.scale.x+(jawScaleTarget-jawRing.scale.x)*Math.min(1,dt*4.0);
  jawRing.scale.setScalar(newScale);

  const pulse=energized?(0.55+0.45*Math.sin(time*3.4)):0;
  jawRingMat.emissiveIntensity=energized?(0.25+0.35*pulse):0.05;
  statusLed.material.emissiveIntensity=energized?(0.5+0.4*pulse):0.15;
  pilotLamp.material.emissiveIntensity=(scenarioKey==='testigo'&&energized)?(0.7+0.5*pulse):0.0;
  finMat.emissiveIntensity=(scenarioKey==='calefactor'&&energized)?(0.35+0.25*pulse):0.0;
  if(scenarioKey==='arranque'&&energized) motorShaft.rotation.y+=dt*22;

  updateTele(iLive);
  if(time-(updateScreen._t||0)>0.22){ updateScreen(); updateScreen._t=time; }

  const acLike=SCEN_META[scenarioKey].tipo==='ac';
  const freqBase=90+Math.min(1, iLive/(acLike?15:220))*300;
  synth.update(freqBase, freqBase*(acLike?2.0:1.5), energized?0.045:0, energized?1200:500);
});

/* ---------- 11) HUD ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Instrumentación · Medición de corriente</div>
  <h2>Pinza Amperimétrica y Shunt</h2>
  <p>Compara dos formas de medir corriente: la <b>pinza</b> (no invasiva, sin abrir el circuito) y el <b>shunt</b> (invasivo, se inserta en serie). Descubre cuándo el propio instrumento cambia — o malinterpreta — lo que mide.</p>
  <div class="formula">I = V / R<br>R_shunt = V_shunt,nom / I_nom<br>%error = (I_sin − I_con) / I_sin × 100</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#b8342f"></span>Vivo / positivo</div>
    <div class="li"><span class="dot" style="background:#cfd0c8"></span>Neutro (solo CA)</div>
    <div class="li"><span class="dot" style="background:#ffd166"></span>Puente / shunt</div>
    <div class="li"><span class="dot" style="background:#4fd1c5"></span>Mordaza de la pinza</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el efecto de carga real de un shunt en serie (R_shunt cambia la corriente real), auto-rango y resolución típicos de una pinza CD/CA de gama media, la diferencia entre pinza Hall (mide CD y CA) y de transformador de corriente (solo CA, por ley de Faraday), la cancelación por ley de Ampère al abrazar vivo+neutro juntos, y el offset de cero típico de un sensor Hall de CD.</div>
    <div class="fl no"><b>NO modela:</b> la respuesta en frecuencia real de cada pinza, el tendido físico completo de un cordón dúplex (aquí se separan vivo/neutro para claridad, salvo en el punto de medición), la conexión Kelvin de 4 hilos de un shunt de precisión real, ni defectos o desgaste del instrumento.</div>
  </div>
  <div class="src">Ref: IEC 61010-2-032 (seguridad de pinzas de gancho) — sin norma de exactitud única para pinza/shunt de banco; consulta el manual del fabricante para las especificaciones exactas.</div>`;

/* ---------- 12) PANEL ---------- */
document.getElementById('panel').innerHTML=`
  <h4>Pinza + Shunt · <span id="p_case" style="color:var(--accent2)">Caso 1/3</span></h4>
  <div class="modebar">
    <button class="b on" id="s_arranque">Arranque</button>
    <button class="b" id="s_calefactor">Calefactor</button>
    <button class="b" id="s_testigo">Testigo</button>
  </div>
  <div class="console" id="console">Pulsa "⚡ Energizar circuito" para iniciar.</div>
  <div id="tele">
    <div class="g"><div class="gl"><span>I real del circuito</span><b id="t_ireal">—</b></div></div>
    <div class="g"><div class="gl"><span>Lectura pinza</span><b id="t_pinza">—</b></div></div>
    <div class="g"><div class="gl"><span>Incertidumbre pinza</span><b id="t_upinza">—</b></div></div>
    <div class="g"><div class="gl"><span>Lectura shunt</span><b id="t_shunt">—</b></div></div>
    <div class="g"><div class="gl"><span>Incertidumbre shunt</span><b id="t_ushunt">—</b></div></div>
    <div class="g"><div class="gl"><span>ΔI al insertar shunt</span><b id="t_delta">—</b></div></div>
    <div class="g"><div class="gl"><span>%error de inserción</span><b id="t_error">—</b></div></div>
  </div>
  <h4 class="sec">Instrumento · Pinza</h4>
  <div class="modebar">
    <button class="b on" id="cm_hall">Hall (CD y CA)</button>
    <button class="b" id="cm_ct">TC (solo CA)</button>
  </div>
  <div id="posWrap" style="display:none">
    <div class="modebar">
      <button class="b on" id="cp_vivo">Solo el vivo</button>
      <button class="b" id="cp_ambos">Vivo + neutro</button>
    </div>
  </div>
  <div class="btns">
    <button class="b" id="btnZero">🎯 Cero (tara CD)</button>
  </div>
  <h4 class="sec">Instrumento · Shunt</h4>
  <div class="modebar">
    <button class="b on" id="sh_out">Shunt fuera</button>
    <button class="b" id="sh_in">Shunt en serie</button>
  </div>
  <h4 class="sec">¿Qué explica la diferencia?</h4>
  <div class="btns">
    <button class="b dx" data-dx="carga">A · Efecto de carga: el instrumento cambió el circuito que mide</button>
    <button class="b dx" data-dx="ampere">B · Cancelación (ley de Ampère): mide corriente neta, no un solo conductor</button>
    <button class="b dx" data-dx="offset">C · Error de cero (offset): hay que tarar antes de medir señales pequeñas</button>
    <button class="b dx" data-dx="falla">D · El instrumento está descalibrado o dañado</button>
  </div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Demostración guiada (carga, cancelación, offset)</button>
    <button class="b primary" id="btnEnergize">⚡ Energizar circuito</button>
    <button class="b" id="btnNew">🔀 Otro escenario</button>
  </div>`;

/* ---------- 13) helpers de UI ---------- */
function tf(v,dp=0){return (v===undefined||v===null)?'—':(+v).toFixed(dp);}
const el=id=>document.getElementById(id);
const consoleEl=el('console');

function setConsole(){
  const m=SCEN_META[scenarioKey];
  if(!energized){
    consoleEl.innerHTML=`Circuito inactivo. Pulsa <span class="ok">"⚡ Energizar circuito"</span> para alimentar ${m.fuente} → ${m.carga}.`;
    return;
  }
  const t=computeTargets();
  let html=`<b>${m.fuente}</b> → <b>${m.carga}</b><br>`;
  html+=`<span class="mono">Shunt: ${shuntIn?'EN SERIE':'fuera (puente)'} · Pinza: ${clampMode==='hall'?'Hall':'TC'}</span>`;
  if(clampMode==='hall' && m.tipo==='dc'){ html+=`<span class="mono"> · ${zeroed?'tarada':'sin tarar'}</span>`; }
  html+='<br>';
  if(scenarioKey==='calefactor'){
    html+=`<span class="mono">Mordaza sobre: ${clampPos==='ambos'?'vivo + neutro':'solo el vivo'}</span><br>`;
  }
  const cr=clampReadingFor(scenarioKey,t.iReal);
  if(cr.fault){
    html+=`<span class="dtc">Pinza: ${cr.text}</span>`;
  } else {
    html+=`<span class="mono">Pinza lee ${cr.reading.toFixed(3)} A (rango ${cr.range} A).</span>`;
  }
  consoleEl.innerHTML=html;
}

function updateTele(iRealNow){
  if(!energized){
    ['t_ireal','t_pinza','t_shunt','t_delta','t_error'].forEach(id=>{el(id).textContent='—'; el(id).className='';});
    el('t_upinza').textContent='—'; el('t_ushunt').textContent='—';
    return;
  }
  const m=SCEN_META[scenarioKey];
  el('t_ireal').textContent=iRealNow.toFixed(3)+' A';

  const cr=clampReadingFor(scenarioKey,iRealNow);
  if(cr.fault){
    el('t_pinza').textContent=cr.text; el('t_pinza').className='bad';
    el('t_upinza').textContent='—';
  } else {
    el('t_pinza').textContent=cr.reading.toFixed(3)+' A';
    el('t_pinza').className=(iRealNow>0.001 && Math.abs(cr.reading-iRealNow)>iRealNow*0.03)?'warn':'';
    el('t_upinza').textContent='± '+cr.U.toFixed(3)+' A ('+cr.range+' A rango)';
  }

  const sr=shuntReadingFor(scenarioKey,iRealNow);
  if(sr.inserted){
    el('t_shunt').textContent=sr.reading.toFixed(4)+' A'; el('t_shunt').className='good';
    el('t_ushunt').textContent='± '+sr.U.toFixed(4)+' A';
  } else {
    el('t_shunt').textContent='— (fuera de servicio)'; el('t_shunt').className='';
    el('t_ushunt').textContent='—';
  }

  if(insertedOnce){
    const iSin=iTrueOf(m), iCon=iLoadedOf(m);
    const d=iSin-iCon, pct=d/iSin*100;
    el('t_delta').textContent=d.toFixed(4)+' A'; el('t_delta').className=pct>1?'warn':'';
    el('t_error').textContent=pct.toFixed(3)+' %'; el('t_error').className=pct>1?'bad':(pct>0.15?'warn':'good');
  } else {
    el('t_delta').textContent='—'; el('t_delta').className='';
    el('t_error').textContent='— (inserta el shunt)'; el('t_error').className='';
  }
}

function updateScreen(){
  const ctx=scrCanvas.getContext('2d');
  ctx.clearRect(0,0,scrCanvas.width,scrCanvas.height);
  ctx.fillStyle='#06120f'; ctx.fillRect(0,0,scrCanvas.width,scrCanvas.height);
  ctx.textAlign='center';
  if(!energized){
    ctx.font='bold 26px monospace'; ctx.fillStyle='#3a5a54'; ctx.fillText('— — —',scrCanvas.width/2,140);
  } else {
    const cr=clampReadingFor(scenarioKey,targets.iReal);
    if(cr.fault){
      ctx.font='bold 18px monospace'; ctx.fillStyle='#5eead4'; ctx.fillText('— A',scrCanvas.width/2,120);
      ctx.font='12px monospace'; ctx.fillStyle='#f4475e'; ctx.fillText('TC no mide CD',scrCanvas.width/2,150);
    } else {
      ctx.font='bold 38px monospace'; ctx.fillStyle='#5eead4'; ctx.fillText(cr.reading.toFixed(2),scrCanvas.width/2,130);
      ctx.font='16px monospace'; ctx.fillStyle='#8fb3ac'; ctx.fillText('A',scrCanvas.width/2,160);
    }
  }
  ctx.font='11px monospace'; ctx.fillStyle='#4fd1c5';
  ctx.fillText(clampMode==='hall'?'HALL · CD/CA':'TC · SOLO CA',scrCanvas.width/2,205);
  if(clampMode==='hall'){ ctx.fillStyle='#8fb3ac'; ctx.fillText(zeroed?'TARADA':'SIN TARAR',scrCanvas.width/2,225); }
  scrTex.needsUpdate=true;
}

function refreshCaseLabel(){ el('p_case').textContent='Caso '+(SCEN_ORDER.indexOf(scenarioKey)+1)+'/3'; }
function clearDx(){ document.querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong')); }

/* ---------- 14) interacción ---------- */
function setScenario(key){
  scenarioKey=key;
  insertedOnce=false;
  clearDx();
  if(scenarioKey!=='calefactor') clampPos='vivo';
  ['s_arranque','s_calefactor','s_testigo'].forEach(id=>el(id).classList.toggle('on', id==='s_'+scenarioKey));
  el('cp_vivo').classList.toggle('on',clampPos==='vivo');
  el('cp_ambos').classList.toggle('on',clampPos==='ambos');
  el('posWrap').style.display=scenarioKey==='calefactor'?'':'none';
  motorShaft.visible=(scenarioKey==='arranque');
  finMeshes.forEach(f=>f.visible=(scenarioKey==='calefactor'));
  pilotLamp.visible=(scenarioKey==='testigo');
  cableNeutralReturn.visible=(scenarioKey==='calefactor');
  refreshCaseLabel();
  setConsole();
}
el('s_arranque').onclick=()=>setScenario('arranque');
el('s_calefactor').onclick=()=>setScenario('calefactor');
el('s_testigo').onclick=()=>setScenario('testigo');

function setShunt(v){
  shuntIn=v;
  if(v) insertedOnce=true;
  jumperWire.visible=!v;
  shuntModule.visible=v;
  el('sh_out').classList.toggle('on',!v);
  el('sh_in').classList.toggle('on',v);
  setConsole();
}
el('sh_out').onclick=()=>setShunt(false);
el('sh_in').onclick=()=>setShunt(true);

function setClampMode(v){
  clampMode=v;
  el('cm_hall').classList.toggle('on',v==='hall');
  el('cm_ct').classList.toggle('on',v==='ct');
  setConsole();
}
el('cm_hall').onclick=()=>setClampMode('hall');
el('cm_ct').onclick=()=>setClampMode('ct');

function setClampPos(v){
  clampPos=v;
  el('cp_vivo').classList.toggle('on',v==='vivo');
  el('cp_ambos').classList.toggle('on',v==='ambos');
  setConsole();
}
el('cp_vivo').onclick=()=>setClampPos('vivo');
el('cp_ambos').onclick=()=>setClampPos('ambos');

el('btnZero').onclick=()=>{
  zeroed=!zeroed;
  el('btnZero').classList.toggle('on',zeroed);
  el('btnZero').textContent=zeroed?'🎯 Tarada (CD)':'🎯 Cero (tara CD)';
  synth.beep(zeroed?988:440,0.08,0.05);
  setConsole();
};

el('btnEnergize').onclick=(e)=>{
  energized=!energized;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',energized);
  e.target.textContent=energized?'⚡ Desenergizar circuito':'⚡ Energizar circuito';
  if(energized){ S.moveTo([2.6,2.1,3.6],[0.2,0.9,-0.1],1.3); S.setCinematicIdle(true); synth.beep(660,0.1,0.06); }
  else{ S.setCinematicIdle(false); }
  setConsole();
};

el('btnNew').onclick=()=>{
  const i=SCEN_ORDER.indexOf(scenarioKey);
  setScenario(SCEN_ORDER[(i+1)%SCEN_ORDER.length]);
};

document.querySelectorAll('.b.dx').forEach(btn=>{
  btn.onclick=()=>{
    if(!energized){ showToast('Primero energiza el circuito.'); return; }
    const pick=btn.dataset.dx; clearDx();
    const m=SCEN_META[scenarioKey];
    if(pick===m.respuesta){
      btn.classList.add('right'); synth.beep(1046,0.12,0.06);
      showToast(`<span style="color:var(--good)">✔ Correcto</span><br><span style="color:var(--dim);font-size:11px">${DX_HINT[pick]}</span>`);
    } else {
      btn.classList.add('wrong'); synth.beep(220,0.15,0.06);
      showToast(`<span style="color:var(--bad)">✗ No es la explicación principal aquí.</span><br><span style="color:var(--dim);font-size:11px">Pista: compara qué cambia al mover los controles de "Instrumento".</span>`);
    }
  };
});

const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{const on=synth.toggle();soundBtn.textContent=on?'🔊':'🔇';soundBtn.classList.toggle('on',on);};

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let autoRunning=false;
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const btn=el('btnAuto'); const label=btn.textContent;
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Demostración en curso…';
  try{
    setScenario('arranque'); setShunt(false); setClampMode('hall');
    zeroed=true; el('btnZero').classList.add('on'); el('btnZero').textContent='🎯 Tarada (CD)';
    clearDx();
    if(!energized){ showToast('Paso 1 · Energizando el circuito de arranque…'); el('btnEnergize').click(); await sleep(1600); }
    showToast('Paso 2 · La pinza mide ≈200.00 A sin tocar el circuito.'); await sleep(2200);
    showToast('Paso 3 · Insertamos el shunt EN SERIE…'); setShunt(true); await sleep(2200);
    showToast('Paso 4 · La corriente REAL bajó a ≈189.83 A: el shunt cargó el circuito.'); await sleep(2600);
    document.querySelector('.b.dx[data-dx="carga"]').click(); await sleep(2600);

    setScenario('calefactor'); setShunt(false); clearDx();
    showToast('Paso 5 · Calefactor de 1200 W en 127 V CA. Pinza sobre el vivo: ≈9.45 A.'); await sleep(2600);
    showToast('Paso 6 · Ahora abrazamos vivo + neutro juntos…'); setClampPos('ambos'); await sleep(2400);
    showToast('Paso 7 · La lectura cae a ≈0 A aunque el calefactor sigue encendido.'); await sleep(2600);
    document.querySelector('.b.dx[data-dx="ampere"]').click(); await sleep(2600);
    setClampPos('vivo');

    setScenario('testigo'); setShunt(false); clearDx();
    zeroed=false; el('btnZero').classList.remove('on'); el('btnZero').textContent='🎯 Cero (tara CD)'; setConsole();
    showToast('Paso 8 · Bobina de relevador: solo 0.20 A reales.'); await sleep(2400);
    showToast('Paso 9 · Sin tarar, el offset del sensor Hall (~1.2 A) domina la lectura: marca ≈1.40 A.'); await sleep(2800);
    document.querySelector('.b.dx[data-dx="offset"]').click(); await sleep(2200);
    showToast('Paso 10 · Al presionar "Cero" antes de medir, la lectura vuelve a ser fiel a la realidad.');
    zeroed=true; el('btnZero').classList.add('on'); el('btnZero').textContent='🎯 Tarada (CD)'; setConsole(); await sleep(2400);

    showToast('<span style="color:var(--good)">✔ Fin de la demostración: carga, cancelación y offset — tres formas en que un instrumento puede "mentir" si no entiendes cómo mide.</span>');
  } finally {
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    autoRunning=false;
  }
}
el('btnAuto').onclick=runAuto;

setScenario('arranque');
S.start();
