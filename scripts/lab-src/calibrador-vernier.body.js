/* ============================================================
   LAB — CALIBRADOR VERNIER: LECTURA, ERROR DE CERO Y REPETIBILIDAD
   (Dominio D10 · instrumentación general — molde P: panel-instrumento)
   Normatividad de referencia:
     · ASME B89.1.14-2018 (R2023) "Calipers" — norma ancla de exactitud y
       diseño de calibradores vernier/digital/de carátula.
     · ISO 13385-1:2019 — especificación de diseño y verificación metrológica
       de calibradores (paraleliza/sucede a DIN 862:2015-03).
     · JCGM 100:2008 (GUM) — expresión de la incertidumbre de medida; este lab
       calcula s (Tipo A) y ±LC/2 (Tipo B de resolución) pero DEFIERE la
       combinación formal u_c=√(u_A²+u_B²) a la práctica de incertidumbre GUM.
   Modelo de ingeniería (didáctico):
     · N divisiones del nonio abarcan (N−1) mm de la escala principal ⇒
       paso del nonio = (N−1)/N mm ⇒ LC = 1 mm/N (0.05 mm → N=20; 0.02 mm → N=50).
     · Lectura corregida = Lectura cruda − Error de cero (con signo). El error
       de cero es una característica FIJA del instrumento (se determina una
       vez, con las mordazas cerradas) — no es un misterio a "adivinar" del
       simulador, se muestra en la telemetría como dato de partida.
     · Repetibilidad: 5 mediciones fijas del mismo objeto revelan una
       dispersión del operador (media, rango, s) que se compara contra la
       incertidumbre de resolución ±LC/2 — ninguna domina automáticamente.
     · Todos los valores "verdaderos" y de error de cero son constantes fijas
       elegidas a mano (mismo patrón que multimetro.body.js): CERO
       Math.random() en la física del lab.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.2,3.0,5.6],target:[0.0,1.15,0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:14});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};

const brush=brushedMetal(), alu=castAluminum(), plas=techPlastic(0.09,0.10,0.12), rub=rubber();
const MAT={
  steel:    std({...brush, color:0xd7dde0, metalness:0.85, roughness:0.30}),
  steelDk:  std({...brush, color:0x9aa3a8, metalness:0.80, roughness:0.38}),
  lock:     std({...brush, color:0x2b2f33, metalness:0.60, roughness:0.45}),
  thumb:    std({...rub, color:0x1c2226, roughness:0.92}),
  bench:    std({...plas, color:0x3a464d, roughness:0.7}),
  bolt:     std({...brush, color:0x8a8f93, metalness:0.70, roughness:0.40}),
  bushing:  std({...alu, color:0xC9A227, metalness:0.55, roughness:0.42}),
  block:    std({...alu, color:0x8a949c, metalness:0.35, roughness:0.62}),
  slotDk:   std({color:0x14181c, roughness:0.85}),
  vplate:   std({color:0x0f1a17, roughness:0.5, metalness:0.2}),
  bezel:    std({color:0x0b0f12, roughness:0.4}),
};
/* ---------- estado ---------- */
let resKey='0.05'; let caseKey='externa'; let jawsClosed=false; let repIdx=0; let solved=false; let simT=0;
let sliderX=0, sliderTargetX=0;
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:900,Q:1});

const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}
const HOVER_LABELS=new Map();

/* ============================================================
   MODELO DEL INSTRUMENTO — calibrador vernier de doble resolución
   ============================================================ */
const SCALE=1/40;                 // 1 unidad tres.js = 40 mm reales
const BEAM_LEN_MM=140;            // recorrido representativo de un calibrador de taller
const BEAM_LEN=BEAM_LEN_MM*SCALE;
const TAIL_X=BEAM_LEN;            // extremo de cola: por aquí asoma la varilla de profundidad
const PARK_MM=46;                 // apertura "de reposo" cuando las mordazas están abiertas

const RES_CFG={
  '0.05':{lc:0.05,div:20,pitch:19/20},   // 20 divisiones ↔ 19 mm de escala principal
  '0.02':{lc:0.02,div:50,pitch:49/50},   // 50 divisiones ↔ 49 mm de escala principal
};

function quantize(v,lc){ return Math.round(v/lc)*lc; }
function decompose(displayMM,resKeyLocal){
  const {lc,div}=RES_CFG[resKeyLocal];
  let mainWhole=Math.floor(displayMM+1e-9);
  let fracMM=displayMM-mainWhole;
  let vernIndex=Math.round(fracMM/lc);
  if(vernIndex>=div){mainWhole+=1;vernIndex-=div;}
  if(vernIndex<0){mainWhole-=1;vernIndex+=div;}
  return {mainWhole,vernIndex,div,lc};
}

// Casos fijos, elegidos a mano (sin Math.random): valor verdadero + error de
// cero propio del instrumento en ESTE lab (se determina antes de medir).
const CASES={
  externa:{
    nombre:'Mordazas externas · diámetro de caña', pieza:'Perno M12 (diámetro de caña)',
    trueDim:11.93, zeroErrorRaw:0, tipo:'ext',
    mision:'Caso 1 · Mordazas EXTERNAS — mide el diámetro de la caña del perno y reporta la lectura del nonio.',
  },
  interna:{
    nombre:'Mordazas internas · diámetro interior', pieza:'Buje/casquillo, diámetro interior',
    trueDim:24.17, zeroErrorRaw:0.04, tipo:'int',
    mision:'Caso 2 · Mordazas INTERNAS — mide el diámetro interior del buje. Este instrumento tiene error de cero: corrígelo.',
  },
  profundidad:{
    nombre:'Varilla de profundidad · chavetero', pieza:'Ranura de chavetero, profundidad',
    trueDim:8.36, zeroErrorRaw:-0.03, tipo:'prof',
    mision:'Caso 3 · VARILLA DE PROFUNDIDAD — mide la profundidad de la ranura. Error de cero negativo: la corrección va en sentido contrario.',
  },
  repetibilidad:{
    nombre:'Repetibilidad · 5 mediciones', pieza:'Buje/casquillo (mismo diámetro externo)',
    trueDim:30.00, zeroErrorRaw:0, tipo:'ext',
    scatter:[-0.03,0.02,0.00,0.05,-0.04],
    mision:'Caso 4 · Repite la misma medición 5 veces y compara la dispersión del operador contra la resolución del instrumento.',
  },
};
const CASE_ORDER=['externa','interna','profundidad','repetibilidad'];
const CASE_CAM={
  externa:     [[2.6,2.0,3.6],[0.55,1.25,0.15]],
  interna:     [[2.7,2.2,3.8],[0.85,1.55,0.15]],
  profundidad: [[3.6,2.3,3.2],[2.1,1.05,0.1]],
  repetibilidad:[[2.6,2.0,3.6],[0.55,1.25,0.15]],
};

function caseReading(key,resKeyLocal){
  const c=CASES[key]; const {lc}=RES_CFG[resKeyLocal];
  const zeroErrorQ=quantize(c.zeroErrorRaw,lc);
  const rawQ=quantize(c.trueDim+c.zeroErrorRaw,lc);
  const correctedQ=+(rawQ-zeroErrorQ).toFixed(6);
  return {zeroErrorQ,rawQ,correctedQ};
}
function repetStats(resKeyLocal){
  const c=CASES.repetibilidad; const {lc}=RES_CFG[resKeyLocal];
  const readings=c.scatter.map(d=>quantize(c.trueDim+d,lc));
  const mean=readings.reduce((a,b)=>a+b,0)/readings.length;
  const range=Math.max(...readings)-Math.min(...readings);
  const variance=readings.reduce((a,b)=>a+(b-mean)**2,0)/(readings.length-1);
  const s=Math.sqrt(variance);
  return {readings,mean,range,s,uRes:lc/2};
}
function currentRawMM(){
  if(caseKey==='repetibilidad')return repetStats(resKey).readings[repIdx];
  return caseReading(caseKey,resKey).rawQ;
}
function targetSliderMM(){
  if(!jawsClosed)return PARK_MM;
  return currentRawMM();
}

/* ---------- generador de opciones de quiz (depende de caseKey + resKey) --- */
function rotateArr(arr,seed){
  let h=0; for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))>>>0;
  const r=h%arr.length; return arr.slice(r).concat(arr.slice(0,r));
}
function buildOptions(key,resKeyLocal){
  const {lc}=RES_CFG[resKeyLocal];
  const {rawQ,correctedQ}=caseReading(key,resKeyLocal);
  const opts=[]; const seen=new Set();
  const add=(val,why,ok=false)=>{ const k=val.toFixed(3); if(seen.has(k))return; seen.add(k); opts.push({t:val.toFixed(3)+' mm',ok,why}); };
  add(correctedQ,'Es la lectura del nonio corregida por el error de cero del instrumento: valor correcto a reportar.',true);
  if(Math.abs(rawQ-correctedQ)>1e-9){
    const dz=rawQ-correctedQ;
    add(rawQ,`Es la lectura CRUDA del nonio (${rawQ.toFixed(3)} mm) sin restar el error de cero (${dz>=0?'+':''}${dz.toFixed(3)} mm) que este instrumento ya tiene — todo calibrador con error de cero exige esta corrección antes de reportar.`);
  }
  add(correctedQ+lc,'Error de una línea del nonio de más: revisa con cuidado cuál línea del nonio coincide exactamente con una línea de la escala principal en la lupa.');
  add(correctedQ-lc,'Error de una línea del nonio de menos: revisa con cuidado cuál línea del nonio coincide exactamente con una línea de la escala principal en la lupa.');
  add(correctedQ+1,'Error de 1 mm en la escala principal: se contó una raya milimétrica de más antes del cero del nonio.');
  add(correctedQ-1,'Error de 1 mm en la escala principal: se contó una raya milimétrica de menos antes del cero del nonio.');
  let k=2;
  while(opts.length<4 && k<8){ add(correctedQ+k*lc,'Error de varias líneas del nonio.'); if(opts.length<4)add(correctedQ-k*lc,'Error de varias líneas del nonio.'); k++; }
  const ok=opts.find(o=>o.ok), distractors=opts.filter(o=>!o.ok).slice(0,3);
  return rotateArr([ok,...distractors],key+resKeyLocal);
}
function repetQuizText(resKeyLocal){
  const {lc}=RES_CFG[resKeyLocal];
  const st=repetStats(resKeyLocal);
  const pregunta=`Mediste 5 veces el mismo buje (Ø nominal 30.00 mm) con resolución ${lc.toFixed(2)} mm: lecturas ${st.readings.map(r=>r.toFixed(2)).join(', ')} mm → media ${st.mean.toFixed(3)} mm, rango R=${st.range.toFixed(2)} mm, desviación estándar muestral s=${st.s.toFixed(4)} mm. La incertidumbre de resolución es ±LC/2=±${st.uRes.toFixed(3)} mm. ¿Cómo interpretas esta dispersión?`;
  const opciones=[
    {t:'Ambas incertidumbres importan: repetibilidad (operador) y resolución (instrumento) son de orden comparable — se combinan, ninguna se descarta.', ok:true, why:`s=${st.s.toFixed(4)} mm y ±LC/2=±${st.uRes.toFixed(3)} mm son del mismo orden de magnitud: la incertidumbre combinada (JCGM 100, GUM) es u_c=√(u_repetibilidad²+u_resolución²) — se calcula en detalle en la práctica de incertidumbre GUM.`},
    {t:'Solo importa la resolución del instrumento (±LC/2); la dispersión entre mediciones es ruido sin significado metrológico.', ok:false, why:`Ignorar la dispersión observada (s=${st.s.toFixed(4)} mm) sería un error: es una fuente de incertidumbre Tipo A real (JCGM 100 §4.2), tan válida como la resolución del instrumento.`},
    {t:'La dispersión indica que el calibrador está descompuesto y debe recalibrarse.', ok:false, why:`Un rango de ${st.range.toFixed(2)} mm entre 5 lecturas manuales con un instrumento de resolución ${lc.toFixed(2)} mm es normal (paralaje, fuerza de sujeción, técnica) — no implica falla del instrumento.`},
    {t:'Un instrumento de precisión como este no debería mostrar NINGUNA dispersión entre mediciones repetidas del mismo objeto.', ok:false, why:'La repetibilidad del operador (Tipo A) está presente en TODA medición real, incluso con instrumentos de alta resolución — es, de hecho, el motivo por el que existe la estadística de incertidumbre.'},
  ];
  return {pregunta, opciones:rotateArr(opciones,'repet'+resKeyLocal)};
}
function currentQuiz(){
  if(caseKey==='repetibilidad')return repetQuizText(resKey);
  const c=CASES[caseKey]; const {zeroErrorQ}=caseReading(caseKey,resKey);
  const pregunta=`${c.mision}<br>Error de cero de este instrumento (a esta resolución): <b>${zeroErrorQ>=0?'+':''}${zeroErrorQ.toFixed(3)} mm</b>. Lee el nonio en la lupa y elige la <b>lectura corregida</b>.`;
  return {pregunta, opciones:buildOptions(caseKey,resKey)};
}

/* ============================================================
   ESCENA 3D — 1) CALIBRADOR (instrumento protagonista, fijo)
   ============================================================ */
const stand=roundedBox(3.2,0.5,1.4,MAT.bench,0.06); stand.position.set(-0.1,0.25,0.1); scene.add(stand);
stand.userData={title:'Soporte de banco',info:'Base de trabajo del instrumento.'};

const cal=new THREE.Group(); cal.position.set(-1.9,1.35,-0.05); cal.rotation.set(-0.06,0.36,0); scene.add(cal);

const beam=roundedBox(BEAM_LEN,0.11,0.30,MAT.steel,0.02); beam.position.set(BEAM_LEN/2,0,0); cal.add(beam);
beam.userData={title:'Escala principal (regla)',info:'Graduada en milímetros. El extremo izquierdo (x=0) corresponde a mordazas cerradas (lectura 0.000 mm).'};

// mordaza fija (x=0): mordaza externa hacia abajo, mordaza interna hacia arriba
const fixExt=roundedBox(0.10,0.55,0.26,MAT.steelDk,0.015); fixExt.position.set(0.02,-0.30,0); cal.add(fixExt);
fixExt.userData={title:'Mordaza externa fija',info:'Cara de referencia para mediciones EXTERNAS (diámetros, espesores).'};
const fixInt=roundedBox(0.07,0.22,0.16,MAT.steelDk,0.01); fixInt.position.set(0.02,0.24,0); cal.add(fixInt);
fixInt.userData={title:'Mordaza interna fija',info:'Punta de referencia para mediciones INTERNAS (diámetros de barreno, ranuras).'};

// nonio deslizante
const slider=new THREE.Group(); slider.position.set(0,0,0); cal.add(slider);
const sliderBody=roundedBox(0.34,0.24,0.32,MAT.steel,0.02); sliderBody.position.set(0,-0.02,0); slider.add(sliderBody);
sliderBody.userData={title:'Cursor del nonio',info:'Porta la escala del nonio y las mordazas móviles. Se desliza a lo largo de la escala principal.'};
const vPlate=new THREE.Mesh(new THREE.PlaneGeometry(0.30,0.10), new THREE.MeshStandardMaterial({...MAT.vplate}));
vPlate.position.set(0,0.02,0.165); slider.add(vPlate);
vPlate.userData={title:'Escala del nonio (N divisiones)',info:'Usa la LUPA del panel para leer con precisión dónde coincide una línea del nonio con una de la escala principal.'};
const movExt=roundedBox(0.10,0.55,0.26,MAT.steelDk,0.015); movExt.position.set(0,-0.30,0); slider.add(movExt);
movExt.userData=fixExt.userData;
const movInt=roundedBox(0.07,0.22,0.16,MAT.steelDk,0.01); movInt.position.set(0,0.24,0); slider.add(movInt);
movInt.userData=fixInt.userData;
const thumb=roundedBox(0.16,0.09,0.30,MAT.thumb,0.03); thumb.position.set(0,-0.16,0.16); slider.add(thumb);
thumb.userData={title:'Pulgar de arrastre',info:'Superficie estriada para deslizar el cursor con el pulgar.'};
const lockScrew=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.07,14),MAT.lock));
lockScrew.rotation.x=Math.PI/2; lockScrew.position.set(0,0.02,-0.20); slider.add(lockScrew);
lockScrew.userData={title:'Tornillo de fijación',info:'Bloquea el cursor en la lectura actual para transcribirla sin que se mueva.'};

// varilla de profundidad: asoma por la cola de la regla (TAIL_X), su protrusión
// crece con la misma apertura que las mordazas.
const ROD_LEN=0.55;
const depthRod=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,ROD_LEN,10),MAT.steelDk));
depthRod.rotation.z=Math.PI/2; cal.add(depthRod);
depthRod.userData={title:'Varilla de profundidad',info:'Asoma por la cola de la regla exactamente la misma distancia que abren las mordazas: mide profundidades de ranuras y barrenos ciegos.'};

// lupa (magnificador) — posición FIJA sobre la regla; siempre visible y legible
const lupaBezel=roundedBox(1.30,0.66,0.05,MAT.bezel,0.02); lupaBezel.position.set(BEAM_LEN*0.42,0.62,0.20); cal.add(lupaBezel);
const lupaCanvas=document.createElement('canvas'); lupaCanvas.width=512; lupaCanvas.height=256;
const lupaTex=new THREE.CanvasTexture(lupaCanvas); lupaTex.colorSpace=THREE.SRGBColorSpace; lupaTex.minFilter=THREE.LinearFilter; lupaTex.generateMipmaps=false;
const lupaScreen=new THREE.Mesh(new THREE.PlaneGeometry(1.20,0.56), new THREE.MeshBasicMaterial({map:lupaTex,toneMapped:false}));
lupaScreen.position.set(BEAM_LEN*0.42,0.62,0.23); cal.add(lupaScreen);
lupaScreen.userData={title:'Lupa · lectura ampliada',info:'Vista ampliada de la coincidencia entre la escala principal y el nonio — la herramienta real para leer un calibrador vernier.'};
const lupaLabel=labelSprite('Lupa · lectura ampliada','#4FD1C5'); lupaLabel.position.set(BEAM_LEN*0.42,1.02,0.25);
lupaLabel.visible=false; lupaLabel.raycast=()=>{}; cal.add(lupaLabel); HOVER_LABELS.set(lupaScreen,lupaLabel);

const beamLabel=labelSprite('Escala principal','#8FB3AC'); beamLabel.position.set(BEAM_LEN*0.75,0.20,0.2);
beamLabel.visible=false; beamLabel.raycast=()=>{}; cal.add(beamLabel); HOVER_LABELS.set(beam,beamLabel);
const lockLabel=labelSprite('Tornillo de fijación','#ffd166'); lockLabel.position.set(0,0.20,-0.2);
lockLabel.visible=false; lockLabel.raycast=()=>{}; slider.add(lockLabel); HOVER_LABELS.set(lockScrew,lockLabel);
const rodLabel=labelSprite('Varilla de profundidad','#ffd166'); rodLabel.position.set(TAIL_X+0.15,-0.22,0.15);
rodLabel.visible=false; rodLabel.raycast=()=>{}; cal.add(rodLabel); HOVER_LABELS.set(depthRod,rodLabel);

/* ============================================================
   ESCENA 3D — 2) PIEZAS (se intercambian con scene.add/remove del
   grupo `cal`: el Raycaster NO ignora visible=false)
   ============================================================ */
function makeExterna(){
  const g=new THREE.Group();
  const rMM=CASES.externa.trueDim, r=(rMM*SCALE)/2, len=0.85;
  const rod=sh(new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,24),MAT.bolt));
  rod.rotation.x=Math.PI/2; rod.position.set(rMM*SCALE/2,-0.30,0); g.add(rod);
  rod.userData={title:'Perno M12 (caña)',info:'Diámetro de la caña del perno — pieza cilíndrica simple para practicar mordazas EXTERNAS.'};
  const head=sh(new THREE.Mesh(new THREE.CylinderGeometry(r*1.7,r*1.7,r*1.1,6),MAT.bolt));
  head.rotation.x=Math.PI/2; head.position.set(rMM*SCALE/2,-0.30,len/2+r*0.7); g.add(head);
  const lb=labelSprite('Perno M12 · caña','#ffd166'); lb.position.set(rMM*SCALE/2,0.05,0.35);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(rod,lb);
  return g;
}
function makeInterna(){
  const g=new THREE.Group();
  const dMM=CASES.interna.trueDim, boreR=(dMM*SCALE)/2, tube=0.09;
  const ring=sh(new THREE.Mesh(new THREE.TorusGeometry(boreR+tube/2,tube/2,14,28),MAT.bushing));
  ring.rotation.x=Math.PI/2; ring.position.set(dMM*SCALE/2,0.24,0); g.add(ring);
  ring.userData={title:'Buje/casquillo',info:'Mide su diámetro INTERIOR con las mordazas internas (puntas que se abren hacia afuera dentro del barreno).'};
  const lb=labelSprite('Buje · Ø interior','#ffd166'); lb.position.set(dMM*SCALE/2,0.55,0.2);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(ring,lb);
  return g;
}
function makeProfundidad(){
  const g=new THREE.Group();
  const base=roundedBox(0.62,0.34,0.42,MAT.block,0.03); base.position.set(TAIL_X+0.46,-0.42,0); g.add(base);
  base.userData={title:'Bloque con ranura de chavetero',info:'La cara superior se apoya contra la cola de la regla; la varilla de profundidad desciende hasta el fondo de la ranura.'};
  const slotL=roundedBox(0.10,0.20,0.16,MAT.slotDk,0.01); slotL.position.set(TAIL_X+0.30,-0.28,0); g.add(slotL);
  const slotR=roundedBox(0.10,0.20,0.16,MAT.slotDk,0.01); slotR.position.set(TAIL_X+0.62,-0.28,0); g.add(slotR);
  const lb=labelSprite('Ranura · profundidad','#ffd166'); lb.position.set(TAIL_X+0.46,-0.10,0.25);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(base,lb);
  return g;
}
function makeRepetibilidad(){
  const g=new THREE.Group();
  const rMM=CASES.repetibilidad.trueDim, r=(rMM*SCALE)/2, len=0.85;
  const rod=sh(new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,24),MAT.bushing));
  rod.rotation.x=Math.PI/2; rod.position.set(rMM*SCALE/2,-0.30,0); g.add(rod);
  rod.userData={title:'Buje (mismo objeto · 5 mediciones)',info:'El MISMO diámetro externo, medido 5 veces: la dispersión entre lecturas es repetibilidad del operador, no del objeto.'};
  const lb=labelSprite('Buje · repetibilidad ×5','#ffd166'); lb.position.set(rMM*SCALE/2,0.05,0.35);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(rod,lb);
  return g;
}
const WK_GROUPS={externa:makeExterna(),interna:makeInterna(),profundidad:makeProfundidad(),repetibilidad:makeRepetibilidad()};
cal.add(WK_GROUPS[caseKey]);

S.start();

/* ============================================================
   HUD (izquierda)
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Instrumentación · Metrología dimensional</div>
  <h2>Calibrador Vernier: lectura, error de cero y repetibilidad</h2>
  <p>Un calibrador vernier no "muestra" el número: hay que <b>leerlo</b> en la coincidencia de dos escalas, <b>corregirlo</b> por el error de cero del instrumento, y saber que incluso una lectura perfecta trae consigo la <b>repetibilidad</b> de quien mide. Resuelve los 4 casos con la lupa y compara resolución 0.05 mm vs 0.02 mm.</p>
  <div class="formula">LC = 1 mm / N (N = divisiones del nonio)<br>Lectura corregida = Lectura cruda − Error de cero<br>s = √(Σ(xᵢ−x̄)² / (n−1))</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8a8f93"></span>Mordazas externas · diámetros/espesores</div>
    <div class="li"><span class="dot" style="background:#C9A227"></span>Mordazas internas · barrenos/bujes</div>
    <div class="li"><span class="dot" style="background:#8a949c"></span>Varilla de profundidad · ranuras</div>
    <div class="li"><span class="dot" style="background:#FFD166"></span>Repetibilidad · misma pieza ×5</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la relación N divisiones ↔ (N−1) mm ⇒ LC=1mm/N para dos resoluciones (0.05 y 0.02 mm); la corrección por error de cero (positivo y negativo); mordazas externas, internas y varilla de profundidad como UNA misma mecánica de nonio; la repetibilidad del operador (media, rango, s) frente a la incertidumbre de resolución ±LC/2.</div>
    <div class="fl no"><b>NO modela:</b> el desgaste de las mordazas ni la fuerza de sujeción variable, el error de coseno/paralaje al leer, el offset de espesor de punta que algunos calibradores requieren para mordazas internas, ni la combinación formal GUM u_c=√(u_A²+u_B²) (se calcula en la práctica de incertidumbre GUM). La geometría es procedural y didáctica.</div>
  </div>
  <div class="src">Ref: ASME B89.1.14-2018 (R2023) "Calipers" · ISO 13385-1:2019 · JCGM 100:2008 (GUM)</div>`;

/* ============================================================
   PANEL (derecha)
   ============================================================ */
document.getElementById('panel').innerHTML=`
  <h4>Calibrador Vernier · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span></h4>
  <div class="modebar" id="resbar">
    <button class="b on" id="r_005">0.05 mm (N=20)</button>
    <button class="b" id="r_002">0.02 mm (N=50)</button>
  </div>
  <div class="modebar" id="casebar">
    <button class="b on" id="c_externa">Externa</button>
    <button class="b" id="c_interna">Interna</button>
    <button class="b" id="c_profundidad">Profundidad</button>
    <button class="b" id="c_repetibilidad">Repetibilidad</button>
  </div>
  <div id="tele">
    <div class="g"><div class="gl"><span>Lectura cruda</span><b id="t_raw">—</b></div></div>
    <div class="g"><div class="gl"><span>Error de cero</span><b id="t_zero">—</b></div></div>
    <div class="g"><div class="gl"><span>Resolución (LC)</span><b id="t_lc">—</b></div></div>
    <div class="g"><div class="gl"><span>Caso</span><b id="t_case">—</b></div></div>
    <div class="g"><div class="gl"><span>Estado</span><b id="t_est">—</b></div></div>
  </div>
  <div class="console" id="report">Cierra las mordazas (🔧) para tomar contacto con la pieza y leer el nonio.</div>
  <div class="modebar" id="repWrap" style="display:none">
    <button class="b" id="btnRep">▶ Siguiente lectura</button>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Medición automática (guiada)</button>
    <button class="b primary" id="btnJaws">🔧 Cerrar mordazas</button>
    <button class="b" id="btnNew">🔀 Nuevo caso</button>
  </div>`;

const el=id=>document.getElementById(id);

/* ---------- lupa, telemetría e informe ---------- */
function drawLupa(rawMM,resKeyLocal){
  const cfg=RES_CFG[resKeyLocal];
  const dec=decompose(rawMM,resKeyLocal);
  const c=lupaCanvas.getContext('2d');
  c.fillStyle='#0a1512'; c.fillRect(0,0,512,256);
  c.strokeStyle='rgba(79,209,197,.35)'; c.lineWidth=3; c.strokeRect(5,5,502,246);
  c.fillStyle='#4FD1C5'; c.font='bold 13px Outfit, sans-serif'; c.textAlign='center';
  c.fillText('escala principal (mm)',256,20);
  const originX=256, mmPx=42;
  c.textAlign='center';
  for(let i=-2;i<=2;i++){
    const mm=dec.mainWhole+i, x=originX+i*mmPx;
    c.strokeStyle='#8FB3AC'; c.beginPath(); c.moveTo(x,40); c.lineTo(x,72); c.stroke();
    c.fillStyle='#EAF4F1'; c.font='14px Outfit, sans-serif'; c.fillText(String(mm),x,32);
  }
  const vSpacingPx=22;
  const iStart=Math.max(0,dec.vernIndex-9), iEnd=Math.min(cfg.div,dec.vernIndex+9);
  for(let i=iStart;i<=iEnd;i++){
    const x=originX+(i-dec.vernIndex)*vSpacingPx, hi=(i===dec.vernIndex);
    c.strokeStyle=hi?'#FFD166':'#5b8a80'; c.lineWidth=hi?3:1.5;
    c.beginPath(); c.moveTo(x,150); c.lineTo(x,180+(hi?16:0)); c.stroke();
  }
  c.fillStyle='#FFD166'; c.font='bold 13px Outfit, sans-serif';
  c.fillText('nonio · línea alineada: '+dec.vernIndex+' / '+cfg.div,256,215);
  c.fillStyle='#EAF4F1'; c.font='bold 30px Outfit, sans-serif'; c.textAlign='right';
  c.fillText(rawMM.toFixed(2)+' mm',492,245); c.textAlign='left';
  lupaTex.needsUpdate=true;
}
function updateTele(rawMM){
  const set=(id,txt,cls)=>{ const b=el(id); b.textContent=txt; b.className=cls||''; };
  const {lc,div}=RES_CFG[resKey]; const c=CASES[caseKey];
  set('t_raw', rawMM.toFixed(2)+' mm', jawsClosed?'good':'');
  if(caseKey==='repetibilidad'){
    set('t_zero','0.000 mm (ref.)','');
    set('t_case','Repetición '+(repIdx+1)+'/5','');
  }else{
    const zeroErrorQ=quantize(c.zeroErrorRaw,lc);
    set('t_zero',(zeroErrorQ>=0?'+':'')+zeroErrorQ.toFixed(3)+' mm', zeroErrorQ!==0?'warn':'good');
    set('t_case', c.nombre,'');
  }
  set('t_lc', lc.toFixed(2)+' mm ('+div+' div.)','');
  set('t_est', jawsClosed?'Mordazas cerradas · midiendo':'Mordazas abiertas', jawsClosed?'good':'warn');
}
function updateReport(rawMM){
  const c=CASES[caseKey]; let html='';
  if(!jawsClosed){
    html='<span class="mono">Mordazas abiertas. Pulsa "Cerrar mordazas" para tomar contacto con la pieza y leer el nonio en la lupa.</span>';
  }else if(caseKey==='repetibilidad'){
    const st=repetStats(resKey);
    html=`<b>${c.mision}</b><br><span class="mono">Lecturas: ${st.readings.map(r=>r.toFixed(2)).join(' · ')} mm<br>Media = ${st.mean.toFixed(3)} mm · Rango = ${st.range.toFixed(2)} mm · s = ${st.s.toFixed(4)} mm<br>Incertidumbre de resolución ±LC/2 = ±${st.uRes.toFixed(3)} mm</span>`;
  }else{
    const {lc}=RES_CFG[resKey]; const zeroErrorQ=quantize(c.zeroErrorRaw,lc); const correctedQ=rawMM-zeroErrorQ;
    if(solved){
      html=`<b>${c.mision}</b><br><span class="mono">Lectura cruda del nonio: <b>${rawMM.toFixed(3)} mm</b><br>Error de cero del instrumento: <b>${(zeroErrorQ>=0?'+':'')+zeroErrorQ.toFixed(3)} mm</b><br>Lectura corregida = cruda − error de cero = ${rawMM.toFixed(3)} − (${zeroErrorQ.toFixed(3)}) = <b>${correctedQ.toFixed(3)} mm</b></span>`;
    }else{
      html=`<b>${c.mision}</b><br><span class="mono">Lectura cruda del nonio: <b>${rawMM.toFixed(3)} mm</b><br>Error de cero del instrumento: <b>${(zeroErrorQ>=0?'+':'')+zeroErrorQ.toFixed(3)} mm</b><br>Aplica <b>Lectura corregida = cruda − error de cero</b> y responde abajo — la lectura corregida se revela aquí al contestar.</span>`;
    }
  }
  el('report').innerHTML=html;
}
function refreshInstrument(){
  const raw=currentRawMM();
  drawLupa(raw,resKey); updateTele(raw); updateReport(raw);
}

/* ---------- interacción ---------- */
function refreshCaseLabel(){ el('p_case').textContent='Caso '+(CASE_ORDER.indexOf(caseKey)+1)+'/4'; }
function clearDx(){ document.querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong')); }
function refreshQuestion(){
  const q=currentQuiz();
  el('q_text').innerHTML=q.pregunta;
  el('dxbtns').innerHTML=q.opciones.map((o,i)=>`<button class="b dx" data-i="${i}">${'ABCD'[i]} · ${o.t}</button>`).join('');
  el('dxbtns').querySelectorAll('.b.dx').forEach(btn=>{ btn.onclick=()=>answer(+btn.dataset.i); });
}
function answer(i){
  if(!jawsClosed){ showToast('Primero cierra las mordazas sobre la pieza.'); return; }
  const q=currentQuiz(); const o=q.opciones[i]; clearDx();
  const btn=el('dxbtns').children[i];
  if(o.ok){
    btn.classList.add('right'); solved=true; synth.beep(1046,0.12,0.06);
    showToast(`<span style="color:var(--good)">✔ Correcto.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }else{
    btn.classList.add('wrong'); synth.beep(220,0.15,0.06);
    showToast(`<span style="color:var(--bad)">✗ Revisa la lectura.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }
}

function setRes(key){
  resKey=key;
  ['005','002'].forEach(k=>el('r_'+k).classList.toggle('on', ('0.'+k.slice(1))===key));
  sliderTargetX=targetSliderMM()*SCALE;
  solved=false; clearDx(); refreshQuestion(); refreshInstrument();
}
el('r_005').onclick=()=>setRes('0.05');
el('r_002').onclick=()=>setRes('0.02');

function setCase(key){
  cal.remove(WK_GROUPS[caseKey]);
  caseKey=key; repIdx=0; cal.add(WK_GROUPS[key]);
  el('repWrap').style.display = key==='repetibilidad' ? '' : 'none';
  ['externa','interna','profundidad','repetibilidad'].forEach(k=>el('c_'+k).classList.toggle('on',k===key));
  sliderTargetX=targetSliderMM()*SCALE;
  solved=false; clearDx(); refreshQuestion(); refreshCaseLabel();
  const meta=CASE_CAM[key]; S.moveTo(meta[0],meta[1],1.3);
  refreshInstrument();
  showToast('🔀 '+CASES[key].nombre+' — cierra las mordazas y lee la lupa.');
}
el('c_externa').onclick=()=>setCase('externa');
el('c_interna').onclick=()=>setCase('interna');
el('c_profundidad').onclick=()=>setCase('profundidad');
el('c_repetibilidad').onclick=()=>setCase('repetibilidad');
el('btnNew').onclick=()=>{ setCase(CASE_ORDER[(CASE_ORDER.indexOf(caseKey)+1)%CASE_ORDER.length]); };

el('btnJaws').onclick=e=>{
  jawsClosed=!jawsClosed;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',jawsClosed);
  e.target.textContent=jawsClosed?'🔧 Abrir mordazas':'🔧 Cerrar mordazas';
  if(jawsClosed){ S.setCinematicIdle(true); synth.beep(880,0.1,0.06); }
  else S.setCinematicIdle(false);
  sliderTargetX=targetSliderMM()*SCALE;
  refreshInstrument();
};
el('btnRep').onclick=()=>{
  repIdx=(repIdx+1)%5;
  sliderTargetX=targetSliderMM()*SCALE;
  refreshInstrument();
  showToast('Repetición '+(repIdx+1)+'/5 — misma pieza, nueva toma de lectura.');
};

pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return; let o=hit.object;
  while(o){
    if(o.userData&&o.userData.info){
      showToast(`<b style="color:var(--accent2)">${o.userData.title}</b><br><span style="color:var(--dim);font-size:11px">${o.userData.info}</span>`);
      return;
    }
    o=o.parent;
  }
});

(function(){
  const dom=S.renderer.domElement, ray=new THREE.Raycaster(), m=new THREE.Vector2();
  let shown=null;
  const setShown=lb=>{ if(shown===lb)return; if(shown)shown.visible=false; shown=lb; if(lb)lb.visible=true; };
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    m.x=((e.clientX-r.left)/r.width)*2-1; m.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(m,S.camera);
    const hits=ray.intersectObjects(scene.children,true);
    let lb=null;
    if(hits[0]){ let o=hits[0].object; while(o){ if(HOVER_LABELS.has(o)){ lb=HOVER_LABELS.get(o); break; } o=o.parent; } }
    setShown(lb); dom.style.cursor = lb ? 'pointer' : '';
  });
  dom.addEventListener('pointerleave',()=>setShown(null));
})();

const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{const on=synth.toggle();soundBtn.textContent=on?'🔊':'🔇';soundBtn.classList.toggle('on',on);};

/* ---------- Modo automático (guiado) ---------- */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let autoRunning=false;
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const btn=el('btnAuto'); const label=btn.textContent;
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Medición guiada en curso…';
  try{
    clearDx();
    const key=caseKey;
    if(!jawsClosed){ showToast('Paso 1 · Cerramos las mordazas sobre la pieza.'); el('btnJaws').click(); await sleep(1700); }
    if(key==='repetibilidad'){
      for(let i=0;i<5;i++){ repIdx=i; sliderTargetX=targetSliderMM()*SCALE; refreshInstrument();
        showToast('Paso '+(i+2)+' · Repetición '+(i+1)+'/5 — lectura '+currentRawMM().toFixed(2)+' mm.'); await sleep(1500); }
      showToast('Paso 7 · Compara s contra ±LC/2 en el informe antes de responder.'); await sleep(2200);
    }else{
      const {rawQ,zeroErrorQ,correctedQ}=caseReading(key,resKey);
      showToast('Paso 2 · Lee la lupa: lectura cruda ≈ '+rawQ.toFixed(3)+' mm.'); await sleep(2200);
      showToast('Paso 3 · Error de cero conocido: '+(zeroErrorQ>=0?'+':'')+zeroErrorQ.toFixed(3)+' mm.'); await sleep(2200);
      showToast('Paso 4 · Lectura corregida = cruda − error de cero = '+correctedQ.toFixed(3)+' mm.'); await sleep(2400);
    }
    const q=currentQuiz(); const i=q.opciones.findIndex(o=>o.ok);
    clearDx();
    const dxBtn=el('dxbtns').children[i];
    if(dxBtn){ dxBtn.classList.add('right'); solved=true; synth.beep(1046,0.12,0.06); }
    showToast('<span style="color:var(--good)">✔ '+q.opciones[i].t+'</span><br><span style="color:var(--dim);font-size:11px">'+q.opciones[i].why+'</span>');
  } finally {
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    autoRunning=false;
  }
}
el('btnAuto').onclick=runAuto;

/* ---------- lazo de animación ---------- */
S.setAnimate((dt,time)=>{
  simT=time;
  sliderX += (sliderTargetX-sliderX)*Math.min(1,dt*6);
  slider.position.x=sliderX;
  depthRod.position.set(TAIL_X+sliderX-ROD_LEN/2+0.02,-0.02,0);
  if(time-(drawLupa._t||0)>0.25){
    if(jawsClosed){ const raw=currentRawMM(); drawLupa(raw,resKey); }
    drawLupa._t=time;
  }
});

setRes('0.05');
setCase('externa');
