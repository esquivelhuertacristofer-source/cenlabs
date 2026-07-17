/* ============================================================
   LAB — DIAGNÓSTICO DE FALLO DE ENCENDIDO (Dominio D10 · instrumentación)
   Continúa a "Escáner OBD-II y Diagnóstico": aquí ya no se enseña el pinout
   ni el ajuste de combustible — el foco es la lógica de dos ciclos
   (pendiente → confirmado), la atribución de cilindro y el comportamiento
   del testigo MIL.
   Normatividad de referencia:
     · CARB 13 CCR §1968.2 — monitor de fallo de encendido, atribución de
       DTC por cilindro, comportamiento del MIL (fijo vs. parpadeante)
     · SAE J1979 / ISO 15031-5 — Modo $01 (vivo), $02 (cuadro congelado),
       $03 (confirmados), $07 (pendientes "de este ciclo/el anterior")
     · SAE J2012 / ISO 15031-6 — formato del DTC (P0300 genérico,
       P0301–P0304 por cilindro)
     · NOM-047-SEMARNAT-2014 — monitores de disponibilidad (verificación MX)
   Modelo de ingeniería (didáctico, 4 cilindros gasolina):
     · Pendiente ($07): una sola detección. Confirmado ($03): se repite en
       un ciclo de manejo posterior que cumple condiciones ⇒ enciende MIL.
     · Si la gran mayoría de los eventos de fallo detectados proviene de UN
       cilindro, el código pasa de P0300 (genérico) a P030X (específico).
     · Dos ventanas de evaluación con dos umbrales distintos: una ventana
       amplia (umbral de emisiones) y una ventana corta (umbral de riesgo
       para el catalizador). Cruzar solo la primera ⇒ MIL fija. Cruzar la
       segunda ⇒ MIL parpadea MIENTRAS el fallo ocurre.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.4,3.3,6.6],target:[-0.3,1.25,0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.42,minD:3.4,maxD:17});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);

const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.08,0.12,0.11), rub=rubber();
const MAT={
  block: std({...alu, metalness:0.55, roughness:0.7}),
  housing: std({...plas, metalness:0.2, roughness:0.6}),
  tool: std({color:0x142420, roughness:0.5, metalness:0.35}),
  toolGrip: std({...rub, color:0x0c1512, roughness:1.0, metalness:0.0}),
  cable: std({...rub, color:0x111917, roughness:0.95, metalness:0.0}),
  cyl: std({color:0xb8c0c8, roughness:0.45, metalness:0.85}),
  bezel: std({color:0x05100d, roughness:0.8, metalness:0.2}),
  crank: std({...brush, metalness:0.9, roughness:0.3}),
};

const HOVER_LABELS=new Map();

/* ---------- 1) TABLERO DE INSTRUMENTOS + TESTIGO MIL ---------- */
const dash=new THREE.Group(); dash.position.set(-2.5,1.4,0.6); dash.rotation.y=0.4; scene.add(dash);
const dashBody=roundedBox(1.7,1.05,0.42,MAT.housing,0.14); dashBody.castShadow=true; dash.add(dashBody);
const dashBezel=roundedBox(1.5,0.85,0.10,MAT.bezel,0.08); dashBezel.position.set(0,0,0.2); dash.add(dashBezel);
const gaugeRing1=new THREE.Mesh(new THREE.TorusGeometry(0.32,0.02,10,32), MAT.crank);
gaugeRing1.position.set(-0.42,0.06,0.26); dash.add(gaugeRing1);
const gaugeRing2=gaugeRing1.clone(); gaugeRing2.position.set(0.42,0.06,0.26); dash.add(gaugeRing2);
const milMat=std({color:0x2a1a0c, emissive:0xffb703, emissiveIntensity:0.0, roughness:0.45, metalness:0.2});
const mil=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.22,0.05), milMat);
mil.position.set(0,-0.30,0.26); dash.add(mil);
const milGlyph=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.013,8,16), std({color:0x1a1006,roughness:0.6}));
milGlyph.position.set(0,-0.30,0.29); dash.add(milGlyph);
const dashLabel=labelSprite('Tablero · testigo MIL','#FFB703'); dashLabel.position.set(0,0.75,0);
dashLabel.visible=false; dashLabel.raycast=()=>{}; dash.add(dashLabel); HOVER_LABELS.set(dashBody,dashLabel);
const milLabel=labelSprite('Testigo MIL','#FFB703'); milLabel.position.set(0,-0.05,0.26);
milLabel.visible=false; milLabel.raycast=()=>{}; dash.add(milLabel); HOVER_LABELS.set(mil,milLabel);

/* ---------- 2) ESCÁNER (pantalla con canvas actualizable) ---------- */
const tool=new THREE.Group(); tool.position.set(2.3,1.2,1.0); tool.rotation.y=-0.5; tool.rotation.x=-0.1; scene.add(tool);
const toolBody=roundedBox(1.15,1.7,0.24,MAT.tool,0.14); toolBody.castShadow=true; tool.add(toolBody);
const grip=roundedBox(1.2,0.55,0.3,MAT.toolGrip,0.35); grip.position.set(0,-0.62,0); tool.add(grip);
const scrCanvas=document.createElement('canvas'); scrCanvas.width=320; scrCanvas.height=384;
const scrTex=new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace=THREE.SRGBColorSpace; scrTex.minFilter=THREE.LinearFilter; scrTex.generateMipmaps=false;
const screen=new THREE.Mesh(new THREE.PlaneGeometry(0.92,1.05), new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false}));
screen.position.set(0,0.28,0.13); tool.add(screen);
for(let i=0;i<4;i++){ const b=roundedBox(0.18,0.12,0.06,std({color:0x1a2622,roughness:0.6,metalness:0.3}),0.2);
  b.position.set(-0.33+i*0.22,-0.35,0.13); tool.add(b); }
const toolLabel=labelSprite('Escáner OBD-II','#4FD1C5'); toolLabel.position.set(0,1.1,0);
toolLabel.visible=false; toolLabel.raycast=()=>{}; tool.add(toolLabel); HOVER_LABELS.set(toolBody,toolLabel);

/* ---------- 3) MOTOR: bloque + 4 cilindros + cigüeñal (sensor CKP) ---------- */
const CYL_N=4;
const eng=new THREE.Group(); eng.position.set(0.7,0,-1.6); scene.add(eng);
const block=roundedBox(2.3,1.0,1.35,MAT.block,0.06); block.position.set(0,0.95,0); block.castShadow=true; eng.add(block);
const head=roundedBox(2.35,0.4,1.4,MAT.block,0.08); head.position.set(0,1.55,0); head.castShadow=true; eng.add(head);
const blockLabel=labelSprite('Bloque del motor','#8FB3AC'); blockLabel.position.set(0,0.65,0.2);
blockLabel.visible=false; blockLabel.raycast=()=>{}; eng.add(blockLabel); HOVER_LABELS.set(block,blockLabel);

const cylMarks=[];
for(let i=0;i<CYL_N;i++){
  const x=-0.78+i*0.52;
  const c=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.17,0.34,20), MAT.cyl.clone());
  c.position.set(x,1.9,0); c.castShadow=true; eng.add(c);
  c.material.emissive=new THREE.Color(0x123028); cylMarks.push(c);
  const lb=labelSprite('Cil. '+(i+1),'#8FB3AC'); lb.position.set(x,2.28,0); lb.scale.multiplyScalar(0.6);
  lb.visible=false; lb.raycast=()=>{}; eng.add(lb); HOVER_LABELS.set(c,lb);
}

const crankGroup=new THREE.Group(); crankGroup.position.set(-1.2,0.5,0.42); eng.add(crankGroup);
const crankDisc=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,0.12,28), MAT.crank);
crankDisc.rotation.x=Math.PI/2; crankGroup.add(crankDisc);
const crankNotch=new THREE.Mesh(new THREE.BoxGeometry(0.045,0.24,0.13), std({color:0xffd166,emissive:0xffd166,emissiveIntensity:0.5,roughness:0.5}));
crankNotch.position.set(0,0.16,0.07); crankGroup.add(crankNotch);
const crankLabel=labelSprite('Cigüeñal · sensor CKP','#8FB3AC'); crankLabel.position.set(-1.2,0.9,0.42); crankLabel.scale.multiplyScalar(0.72);
crankLabel.visible=false; crankLabel.raycast=()=>{}; eng.add(crankLabel); HOVER_LABELS.set(crankDisc,crankLabel);

/* ---------- 4) CABLES (escáner → tablero, tablero → motor) ---------- */
const cableCurve1=new THREE.CatmullRomCurve3([
  new THREE.Vector3(2.0,1.6,0.9), new THREE.Vector3(0.4,0.5,1.5),
  new THREE.Vector3(-1.2,0.9,1.2), new THREE.Vector3(-2.2,1.5,0.9),
]);
const cable1=new THREE.Mesh(new THREE.TubeGeometry(cableCurve1,48,0.045,10), MAT.cable); cable1.castShadow=true; scene.add(cable1);
const cableCurve2=new THREE.CatmullRomCurve3([
  new THREE.Vector3(-2.5,1.0,0.5), new THREE.Vector3(-1.4,0.4,-0.4),
  new THREE.Vector3(0.2,0.3,-1.2), new THREE.Vector3(0.7,0.9,-1.7),
]);
const cable2=new THREE.Mesh(new THREE.TubeGeometry(cableCurve2,48,0.04,10), MAT.cable); cable2.castShadow=true; scene.add(cable2);

/* ---------- 5) inspección por clic ---------- */
const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}

const PART_DESC=new Map([
  [toolBody,{name:'Escáner OBD-II',desc:'Lee Modo $01 (vivo), $07 (pendientes), $03 (confirmados) y $02 (cuadro congelado).'}],
  [dashBody,{name:'Tablero de instrumentos',desc:'Aquí vive el testigo MIL — la luz de "check engine" que ve el conductor, sin necesidad de escáner.'}],
  [mil,{name:'Testigo MIL',desc:'Apagado = sin falla activa. Fija = falla confirmada (Tipo B, umbral de emisiones). Parpadeante = falla activa que puede dañar el catalizador (Tipo A).'}],
  [block,{name:'Bloque del motor',desc:'Aloja los 4 cilindros; un fallo de encendido es una combustión que no ocurre como debería en uno o más de ellos.'}],
  [crankDisc,{name:'Cigüeñal · sensor CKP',desc:'El sensor de posición del cigüeñal detecta variaciones diminutas de velocidad angular: así "sospecha" la ECU un fallo de encendido.'}],
]);
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return; let o=hit.object;
  while(o){
    if(PART_DESC.has(o)){ const p=PART_DESC.get(o); showToast(`<b style="color:var(--accent2)">${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.desc}</span>`); return; }
    const ci=cylMarks.indexOf(o);
    if(ci>=0){ showToast(`<b style="color:var(--accent)">Cilindro ${ci+1}</b><br><span style="color:var(--dim);font-size:11px">Si la gran mayoría de los eventos de fallo se concentra aquí, la regla de atribución le asigna el código específico P030${ci+1}.</span>`); return; }
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

/* ============================================================
   MODELO DE DATOS — 4 casos guiados
   ============================================================ */
const SCEN_ORDER=['pendiente','confirmadoB','confirmadoA','sintesis'];
const SCEN_LABEL={
  pendiente:'Código pendiente', confirmadoB:'Confirmado genérico · Tipo B',
  confirmadoA:'Confirmado por cilindro · Tipo A', sintesis:'Síntesis · dependiente de carga',
};
const CASES={
  pendiente:{ monitorComplete:false,
    pendingDTC:['P0300','Fallo de encendido aleatorio/múltiple — PENDIENTE'], confirmedDTC:null,
    milState:'off', misfireRate:0.5, cylAffected:null, freeze:null, rpmBase:830, loadLive:22 },
  confirmadoB:{ monitorComplete:true,
    pendingDTC:null, confirmedDTC:['P0300','Fallo de encendido aleatorio/múltiple — CONFIRMADO'],
    milState:'solid', misfireRate:2.2, cylAffected:null,
    freeze:{rpm:2150,carga:46,vel:58,ect:91}, rpmBase:820, loadLive:40 },
  confirmadoA:{ monitorComplete:true,
    pendingDTC:null, confirmedDTC:['P0302','Fallo de encendido — cilindro 2 — CONFIRMADO'],
    milState:'blink', misfireRate:7.6, cylAffected:1,
    freeze:{rpm:3400,carga:82,vel:96,ect:93}, rpmBase:840, loadLive:38 },
  sintesis:{ monitorComplete:true,
    pendingDTC:null, confirmedDTC:['P0301','Fallo de encendido — cilindro 1 — CONFIRMADO'],
    milState:'dynamic', misfireRateLigera:0.7, misfireRateAlta:8.2, cylAffected:0,
    freeze:{rpm:3600,carga:88,vel:101,ect:94}, rpmBase:830, loadLive:20 },
};
const QUESTIONS={
  pendiente:{ prompt:'El Modo $07 muestra P0300 PENDIENTE, el Modo $03 no tiene nada confirmado y el MIL está apagado. ¿Qué haces?',
    opts:[
      {t:'El vehículo no tiene ninguna falla real; ignora la lectura.',ok:false},
      {t:'Reprueba de inmediato la verificación vehicular por tener un código pendiente.',ok:false},
      {t:'Un pendiente nace de una sola detección; hay que esperar el próximo ciclo de manejo que cumpla condiciones para confirmar (o no). Aún no amerita encender el MIL.',ok:true},
      {t:'Borra la memoria de la ECU para "limpiar" el pendiente antes de seguir manejando.',ok:false},
    ]},
  confirmadoB:{ prompt:'DTC confirmado P0300 (genérico), tasa de fallos moderada, MIL encendida de forma CONTINUA (no parpadea). ¿Qué está pasando?',
    opts:[
      {t:'El catalizador se está dañando en este instante; hay que apagar el motor de inmediato.',ok:false},
      {t:'La tasa de fallos superó el umbral de emisiones (ventana amplia) pero no el umbral de riesgo para el catalizador (ventana corta); por eso el MIL queda fija, sin parpadear.',ok:true},
      {t:'Una MIL fija siempre indica una falla eléctrica del propio testigo, no del motor.',ok:false},
      {t:'P0300 genérico significa que el escáner no logró comunicarse con la ECU.',ok:false},
    ]},
  confirmadoA:{ prompt:'DTC confirmado P0302 (cilindro 2), tasa de fallos alta, MIL PARPADEANTE. ¿Por qué se pudo señalar un cilindro específico, y qué anuncia el parpadeo?',
    opts:[
      {t:'La atribución es aleatoria; el parpadeo solo indica que el escáner sigue conectado.',ok:false},
      {t:'Cuando la gran mayoría de los eventos de fallo detectados provienen del mismo cilindro, la ECU lo señala como origen; el parpadeo avisa en tiempo real que el fallo actual podría dañar el catalizador y exige atención inmediata.',ok:true},
      {t:'El parpadeo es un adorno del tablero, sin relación con la severidad de la falla.',ok:false},
      {t:'Un código de cilindro específico borra automáticamente cualquier código genérico previo.',ok:false},
    ]},
  sintesis:{ prompt:'En carga ligera el MIL está fija (no parpadea); al exigir el motor con una aceleración fuerte, el MIL empieza a parpadear, y al soltar el acelerador vuelve a quedar fija. ¿Cómo se explica esto?',
    opts:[
      {t:'Es una falla del tablero; el testigo debería comportarse siempre igual sin importar la condición de manejo.',ok:false},
      {t:'El parpadeo sigue al evento de fallo en tiempo real: bajo carga alta la tasa de fallos cruza el umbral de riesgo para el catalizador; al bajar la carga, el fallo actual deja de ser tan severo y el testigo vuelve a fija — aunque el código ya confirmado sigue guardado.',ok:true},
      {t:'El parpadeo indica que se acaba de borrar un código de la memoria.',ok:false},
      {t:'El MIL solo parpadea al conectar o desconectar el escáner del vehículo.',ok:false},
    ]},
};
const DX_HINT={
  pendiente:'Lógica de dos ciclos: un código PENDIENTE (Modo $07) nace de una sola detección. Solo si el fallo se repite en un ciclo de manejo posterior que cumpla las condiciones de prueba se CONFIRMA (Modo $03) y se enciende el MIL. El Modo $06 — no cubierto en este laboratorio — tampoco aplica todavía: no hay nada confirmado que lo dispare.',
  confirmadoB:'El sistema evalúa la tasa de fallos contra dos ventanas distintas: una amplia (umbral de emisiones) y una corta (umbral de riesgo para el catalizador). Aquí solo se cruzó la primera: código confirmado, MIL fija, sin parpadeo.',
  confirmadoA:'Regla de atribución por mayoría: si la gran mayoría de los eventos de fallo detectados vienen del mismo cilindro, el código deja de ser el genérico P0300 y pasa a ser específico (P0301–P0304 según el cilindro). El parpadeo del MIL es la señal más urgente del sistema OBD-II: fallo activo que arriesga dañar el catalizador ahora mismo.',
  sintesis:'El parpadeo del MIL no es un estado fijo: sigue el evento de fallo en tiempo real. El código ya confirmado permanece en memoria pase lo que pase, pero el parpadeo aparece y desaparece según si la tasa de fallos de ESTE momento cruza o no el umbral de riesgo para el catalizador.',
};

let connected=false, mode='01', scenarioKey=SCEN_ORDER[0], cargaAlta=false;
let rpmLive=0, stumbleFactor=1;
let dxSolved={pendiente:false,confirmadoB:false,confirmadoA:false,sintesis:false};

function currentMisfireRate(){
  const cs=CASES[scenarioKey];
  if(scenarioKey==='sintesis') return cargaAlta?cs.misfireRateAlta:cs.misfireRateLigera;
  return cs.misfireRate;
}
function currentLoad(){
  if(scenarioKey==='sintesis') return cargaAlta?85:20;
  return CASES[scenarioKey].loadLive;
}
function currentRpmTarget(){
  if(!connected) return 0;
  if(scenarioKey==='sintesis') return cargaAlta?3400:900;
  return CASES[scenarioKey].rpmBase;
}
function milEffectiveState(){
  if(!connected) return 'off';
  const cs=CASES[scenarioKey];
  if(cs.milState==='dynamic') return cargaAlta?'blink':'solid';
  return cs.milState;
}
function cylinderMisses(i,rate,time){
  if(rate<=0) return false;
  const freq=3+rate*0.15;
  const thresh=1-Math.min(0.9,rate/12);
  return Math.sin(time*freq+i*1.7)>thresh;
}

/* ---------- síntesis: zumbido del motor ---------- */
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:800,Q:1});

/* ============================================================
   ANIMACIÓN
   ============================================================ */
S.setAnimate((dt,time)=>{
  const cs=CASES[scenarioKey];
  const rate=connected?currentMisfireRate():0;
  rpmLive += (currentRpmTarget()-rpmLive)*Math.min(1,dt*3);
  const jit=connected?(Math.sin(time*13.3)+Math.sin(time*7.7))*0.5*(rate*3+4):0;

  const clock=(time*6)%CYL_N|0;
  let anyMiss=false;
  cylMarks.forEach((cyl,i)=>{
    let fire=(i===clock)&&connected;
    let miss=false;
    if(connected&&rate>0){
      const targetIdx=cs.cylAffected;
      if(targetIdx===null||targetIdx===undefined||targetIdx===i) miss=cylinderMisses(i,rate,time);
    }
    if(miss&&i===clock){ fire=false; anyMiss=true; }
    cyl.material.emissive.setHex(miss?0xf4475e:(fire?0x2A9D8F:0x102a24));
    cyl.material.emissiveIntensity=miss?0.95:(fire?0.9:0.25);
  });
  stumbleFactor += ((anyMiss?0.3:1)-stumbleFactor)*Math.min(1,dt*10);
  const angSpeed=connected?(rpmLive/60)*2*Math.PI*0.35:0;
  crankGroup.rotation.z += dt*angSpeed*stumbleFactor;
  crankNotch.material.emissiveIntensity=0.35+(anyMiss?0.5:0);

  const st=milEffectiveState();
  let milI=0;
  if(st==='solid') milI=0.85;
  else if(st==='blink') milI=(Math.sin(time*2*Math.PI*2)>0)?1.0:0.08;
  milMat.emissiveIntensity += (milI-milMat.emissiveIntensity)*Math.min(1,dt*20);

  if(connected) updateTele(rpmLive+jit);
  if(time-(drawToolScreen._t||0)>0.22){ drawToolScreen(rpmLive+jit); drawToolScreen._t=time; }

  if(connected){
    const hum=46+rpmLive/60;
    synth.update(hum,hum*1.5,0.006+(anyMiss?0.01:0),650+rpmLive*0.06);
  } else synth.update(0,0,0);
});
S.start();

/* ============================================================
   HUD (izquierda)
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Autotrónica · Diagnóstico OBD-II avanzado</div>
  <h2>Diagnóstico de Fallo de Encendido</h2>
  <p>Ya sabes leer un DTC. Ahora vas más a fondo: la diferencia entre un código <b>pendiente</b> (Modo $07) y uno <b>confirmado</b> (Modo $03), cuándo la ECU puede señalar un <b>cilindro específico</b>, y qué le dice al conductor el comportamiento del <b>testigo MIL</b> — fijo o parpadeante.</p>
  <div class="formula">Pendiente ($07) → se repite en ciclo posterior → Confirmado ($03)<br>Mayoría de eventos en 1 cilindro ⇒ código específico (P030X)<br>Tasa alta (ventana corta) ⇒ MIL parpadea · Tasa moderada (ventana amplia) ⇒ MIL fija</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#5b6f6a"></span>MIL apagada · sin falla activa</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>MIL fija · confirmado, umbral de emisiones</div>
    <div class="li"><span class="dot" style="background:#f4475e"></span>MIL parpadeante · riesgo para el catalizador</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la lógica de dos ciclos (pendiente → confirmado), la regla de atribución de cilindro por mayoría de eventos, el cuadro congelado ligado al momento del evento (no al estado actual), y la distinción MIL fija (Tipo B) vs. parpadeante (Tipo A).</div>
    <div class="fl no"><b>NO modela:</b> el algoritmo real de detección por variación angular del cigüeñal, la calibración exacta de un fabricante particular, ni el daño físico real al catalizador. Las tasas de fallo y las ventanas de revoluciones son ilustrativas del concepto regulatorio — consulta CARB 13 CCR §1968.2 y el manual del fabricante para cifras exactas de un vehículo real.</div>
  </div>
  <div class="src">Ref: CARB 13 CCR §1968.2 · SAE J1979/J2012 · ISO 15031-5/6 · NOM-047-SEMARNAT-2014</div>`;

/* ============================================================
   PANEL (derecha)
   ============================================================ */
function tf(v,dp=0){return (v===undefined||v===null)?'—':(+v).toFixed(dp);}
document.getElementById('panel').innerHTML=`
  <h4>Escáner · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span></h4>
  <div class="modebar">
    <button class="b" id="s_pendiente">1 · Pendiente</button>
    <button class="b" id="s_confirmadoB">2 · Confirmado B</button>
    <button class="b" id="s_confirmadoA">3 · Confirmado A</button>
    <button class="b" id="s_sintesis">4 · Síntesis</button>
  </div>
  <div class="modebar">
    <button class="b on" id="m01">$01 Vivo</button>
    <button class="b" id="m07">$07 Pendiente</button>
    <button class="b" id="m03">$03 Confirmado</button>
    <button class="b" id="m02">$02 Congelado</button>
  </div>
  <div class="console" id="console">Energiza el sistema para iniciar el flujo de datos.</div>
  <div id="tele">
    <div class="g"><div class="gl"><span>RPM</span><b id="t_rpm">—</b></div></div>
    <div class="g"><div class="gl"><span>Carga calculada</span><b id="t_load">—</b></div></div>
    <div class="g"><div class="gl"><span>Tasa de fallos</span><b id="t_rate">—</b></div></div>
    <div class="g"><div class="gl"><span>Cilindro señalado</span><b id="t_cyl">—</b></div></div>
    <div class="g"><div class="gl"><span>Monitor de encendido</span><b id="t_mon">—</b></div></div>
    <div class="g"><div class="gl"><span>Testigo MIL</span><b id="t_mil">—</b></div></div>
  </div>
  <div id="ctrlSintesis" style="display:none">
    <h4 class="sec">Condición de manejo</h4>
    <div class="modebar">
      <button class="b on" id="c_ligera">Carga ligera</button>
      <button class="b" id="c_alta">Aceleración fuerte</button>
    </div>
  </div>
  <h4 class="sec" id="q_prompt">Pregunta diagnóstica</h4>
  <div class="btns" id="dxWrap"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Demostración guiada</button>
    <button class="b primary" id="btnEnergize">🔌 Conectar escáner</button>
    <button class="b" id="btnNext">🔀 Siguiente caso</button>
  </div>`;

const el=id=>document.getElementById(id);
const consoleEl=el('console');

function setConsole(){
  if(!connected){ consoleEl.innerHTML='Energiza el sistema para iniciar el flujo de datos.'; return; }
  const cs=CASES[scenarioKey];
  if(mode==='01'){
    consoleEl.innerHTML=`<b>Modo $01 · Datos en vivo</b><br>`+
      `<span class="mono">Monitor de fallo de encendido: ${cs.monitorComplete?'<span class="ok">completo</span>':'incompleto'}</span><br>`+
      `<span class="mono">Tasa de fallos actual ≈ ${currentMisfireRate().toFixed(1)} %</span>`;
  }else if(mode==='07'){
    consoleEl.innerHTML=cs.pendingDTC
      ? `<b>Modo $07 · Códigos pendientes</b><br><span class="dtc">${cs.pendingDTC[0]}</span> <span class="mono">${cs.pendingDTC[1]}</span><br><span class="mono">Se detectó una vez; falta confirmar en el próximo ciclo de manejo que cumpla condiciones.</span>`
      : `<b>Modo $07 · Códigos pendientes</b><br><span class="ok mono">Sin códigos pendientes.</span>`;
  }else if(mode==='03'){
    if(cs.confirmedDTC){
      const st=milEffectiveState();
      const reveal=dxSolved[scenarioKey];
      const milTxt = st==='blink' ? (reveal?'<span style="color:var(--bad)">PARPADEANDO (Tipo A · riesgo para el catalizador)</span>':'<span style="color:var(--bad)">PARPADEANDO</span>')
                   : st==='solid' ? (reveal?'<span style="color:var(--hv)">FIJA / continua (Tipo B · umbral de emisiones)</span>':'<span style="color:var(--hv)">FIJA / continua</span>')
                   : 'apagada';
      consoleEl.innerHTML=`<b>Modo $03 · Códigos confirmados</b><br><span class="dtc">${cs.confirmedDTC[0]}</span> <span class="mono">${cs.confirmedDTC[1]}</span><br><span class="mono">MIL: </span>${milTxt}`;
    }else{
      consoleEl.innerHTML=`<b>Modo $03 · Códigos confirmados</b><br><span class="ok mono">Sin códigos confirmados todavía.</span>`;
    }
  }else if(mode==='02'){
    if(!cs.freeze){
      consoleEl.innerHTML=`<b>Modo $02 · Cuadro congelado</b><br><span class="mono">Sin cuadro: aún no hay un código confirmado que lo dispare.</span>`;
    }else{
      const f=cs.freeze;
      consoleEl.innerHTML=`<b>Modo $02 · Cuadro congelado</b> <span class="mono">(al momento del evento que confirmó el código)</span><br>`+
        `<span class="mono">RPM ${f.rpm} · Carga ${f.carga}% · Vel ${f.vel} km/h · ECT ${f.ect}°C</span>`;
    }
  }
}

function updateTele(rpmShown){
  const cs=CASES[scenarioKey];
  const rate=currentMisfireRate();
  el('t_rpm').textContent=Math.round(rpmShown)+' rpm';
  el('t_load').textContent=tf(currentLoad())+' %';
  const rB=el('t_rate'); rB.textContent=rate.toFixed(1)+' %'; rB.className=rate>5?'bad':rate>1?'warn':'good';
  el('t_cyl').textContent=(cs.cylAffected===null||cs.cylAffected===undefined)?'aleatorio / múltiple':('cilindro '+(cs.cylAffected+1)+' (marcado)');
  const mB=el('t_mon'); mB.textContent=cs.monitorComplete?'completo':'incompleto'; mB.className=cs.monitorComplete?'good':'warn';
  const st=milEffectiveState();
  const milB=el('t_mil'); milB.textContent=st==='blink'?'parpadeando':st==='solid'?'fija (continua)':'apagada';
  milB.className=st==='blink'?'bad':st==='solid'?'warn':'good';
}

function wrapText(ctx,text,x,y,maxW,lh){
  const words=text.split(' '); let line='',yy=y;
  for(const w of words){
    const test=line+w+' ';
    if(ctx.measureText(test).width>maxW&&line){ ctx.fillText(line,x,yy); line=w+' '; yy+=lh; }
    else line=test;
  }
  ctx.fillText(line,x,yy);
}

function drawToolScreen(rpmShown){
  const c=scrCanvas.getContext('2d');
  c.fillStyle='#04120e'; c.fillRect(0,0,320,384);
  c.strokeStyle='rgba(79,209,197,.4)'; c.lineWidth=2; c.strokeRect(6,6,308,372);
  c.fillStyle='#4FD1C5'; c.font='bold 22px Outfit, sans-serif'; c.textAlign='left';
  c.fillText('CEN · Fallo de encendido',18,36);
  c.font='14px Outfit, sans-serif'; c.fillStyle='#8FB3AC';
  if(!connected){ c.fillText('DESCONECTADO',18,84); c.fillText('Energiza el sistema',18,110); scrTex.needsUpdate=true; return; }
  const cs=CASES[scenarioKey];
  c.fillText('Modo $'+mode+'  ·  '+SCEN_LABEL[scenarioKey],18,64);
  if(mode==='01'){
    c.fillStyle='#EAF4F1'; c.font='bold 30px Outfit, sans-serif';
    c.fillText(Math.round(rpmShown)+' rpm',18,126);
    const rate=currentMisfireRate();
    c.font='15px Outfit, sans-serif'; c.fillStyle=rate>5?'#f4475e':rate>1?'#FFB703':'#34d399';
    c.fillText('Tasa de fallos ≈ '+rate.toFixed(1)+' %',18,158);
    c.fillStyle='#8FB3AC'; c.fillText('Monitor: '+(cs.monitorComplete?'completo':'incompleto'),18,184);
  }else if(mode==='07'){
    c.fillStyle=cs.pendingDTC?'#FFB703':'#34d399'; c.font='bold 20px Outfit, sans-serif';
    c.fillText(cs.pendingDTC?cs.pendingDTC[0]:'Sin pendientes',18,122);
    c.font='13px Outfit, sans-serif'; c.fillStyle='#8FB3AC';
    if(cs.pendingDTC) wrapText(c,cs.pendingDTC[1],18,150,282,17);
  }else if(mode==='03'){
    c.fillStyle=cs.confirmedDTC?'#f4475e':'#34d399'; c.font='bold 20px Outfit, sans-serif';
    c.fillText(cs.confirmedDTC?cs.confirmedDTC[0]:'Sin confirmados',18,122);
    c.font='13px Outfit, sans-serif'; c.fillStyle='#8FB3AC';
    if(cs.confirmedDTC) wrapText(c,cs.confirmedDTC[1],18,150,282,17);
    const st=milEffectiveState();
    c.fillStyle=st==='blink'?'#f4475e':st==='solid'?'#FFB703':'#5b6f6a';
    c.font='bold 15px Outfit, sans-serif';
    c.fillText('MIL: '+(st==='blink'?'PARPADEANDO':st==='solid'?'FIJA':'apagada'),18,204);
  }else if(mode==='02'){
    if(!cs.freeze){ c.fillStyle='#8FB3AC'; c.fillText('Sin cuadro disponible',18,122); }
    else{
      const f=cs.freeze;
      c.fillStyle='#EAF4F1'; c.font='15px Outfit, sans-serif';
      c.fillText('RPM '+f.rpm,18,112); c.fillText('Carga '+f.carga+' %',18,138);
      c.fillText('Vel '+f.vel+' km/h',18,164); c.fillText('ECT '+f.ect+' °C',18,190);
    }
  }
  scrTex.needsUpdate=true;
}

/* ---------- pregunta diagnóstica ---------- */
function shuffled(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function renderQuestion(){
  const q=QUESTIONS[scenarioKey];
  el('q_prompt').textContent=q.prompt;
  const wrap=el('dxWrap'); wrap.innerHTML='';
  const opts=shuffled(q.opts);
  opts.forEach((o,i)=>{
    const b=document.createElement('button');
    b.className='b dx'; b.dataset.i=String(i); b.dataset.ok=o.ok?'1':'0';
    b.textContent=String.fromCharCode(65+i)+' · '+o.t;
    wrap.appendChild(b);
  });
  wireDx();
}
function wireDx(){
  document.querySelectorAll('#dxWrap .b.dx').forEach(btn=>{
    btn.onclick=()=>{
      if(!connected){ showToast('Primero energiza el sistema.'); return; }
      clearDx();
      if(btn.dataset.ok==='1'){
        btn.classList.add('right'); synth.beep(1046,0.12,0.06);
        dxSolved[scenarioKey]=true; setConsole();
        showToast(`<span style="color:var(--good)">✔ Correcto.</span><br><span style="color:var(--dim);font-size:11px">${DX_HINT[scenarioKey]}</span>`);
      }else{
        btn.classList.add('wrong'); synth.beep(220,0.15,0.06);
        showToast(`<span style="color:var(--bad)">✗ Revisa la evidencia en el escáner.</span>`);
      }
    };
  });
}
function clearDx(){ document.querySelectorAll('#dxWrap .b.dx').forEach(b=>b.classList.remove('right','wrong')); }

/* ---------- interacción ---------- */
function setScenario(key){
  scenarioKey=key;
  mode='01';
  ['01','07','03','02'].forEach(id=>el('m'+id).classList.toggle('on',id==='01'));
  SCEN_ORDER.forEach(k=>el('s_'+k).classList.toggle('on',k===key));
  el('ctrlSintesis').style.display=(key==='sintesis')?'':'none';
  if(key==='sintesis'){ cargaAlta=false; el('c_ligera').classList.add('on'); el('c_alta').classList.remove('on'); }
  el('p_case').textContent='Caso '+(SCEN_ORDER.indexOf(key)+1)+'/4 · '+SCEN_LABEL[key];
  renderQuestion(); clearDx(); setConsole();
}
function setMode(m){
  mode=m;
  ['01','07','03','02'].forEach(id=>el('m'+id).classList.toggle('on',id===m));
  setConsole();
}
SCEN_ORDER.forEach(k=>{ el('s_'+k).onclick=()=>setScenario(k); });
el('m01').onclick=()=>setMode('01');
el('m07').onclick=()=>setMode('07');
el('m03').onclick=()=>setMode('03');
el('m02').onclick=()=>setMode('02');

el('c_ligera').onclick=()=>{ cargaAlta=false; el('c_ligera').classList.add('on'); el('c_alta').classList.remove('on'); setConsole(); };
el('c_alta').onclick=()=>{ cargaAlta=true; el('c_alta').classList.add('on'); el('c_ligera').classList.remove('on'); setConsole(); };

el('btnEnergize').onclick=(e)=>{
  connected=!connected;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',connected);
  e.target.textContent=connected?'🔌 Desconectar':'🔌 Conectar escáner';
  if(connected){ S.moveTo([3.6,2.4,5.4],[-0.5,1.25,0.3],1.3); S.setCinematicIdle(true); synth.beep(880,0.1,0.06); }
  else{ S.setCinematicIdle(false); ['t_rpm','t_load','t_rate','t_cyl','t_mon','t_mil'].forEach(id=>{el(id).textContent='—';el(id).className='';}); }
  setConsole();
};

el('btnNext').onclick=()=>{
  const i=(SCEN_ORDER.indexOf(scenarioKey)+1)%SCEN_ORDER.length;
  setScenario(SCEN_ORDER[i]);
  showToast('🔀 Nuevo caso cargado.');
};

const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{const on=synth.toggle();soundBtn.textContent=on?'🔊':'🔇';soundBtn.classList.toggle('on',on);};

/* ---------- Modo automático (guiado) ---------- */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let autoRunning=false;
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const btn=el('btnAuto'); const label=btn.textContent;
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Demostración en curso…';
  try{
    if(!connected){ showToast('Paso 1 · Energizamos el sistema.'); el('btnEnergize').click(); await sleep(1500); }

    setScenario('pendiente'); setMode('07');
    showToast('Paso 2 · Caso 1: un código PENDIENTE nace de una sola detección — el MIL sigue apagado.'); await sleep(2600);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2200);

    setScenario('confirmadoB'); setMode('03');
    showToast('Paso 3 · Caso 2: se repitió el fallo ⇒ código CONFIRMADO. Cruza el umbral de emisiones pero no el de catalizador: MIL fija.'); await sleep(2800);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2200);

    setScenario('confirmadoA'); setMode('03');
    showToast('Paso 4 · Caso 3: la mayoría de los eventos vienen del cilindro 2 ⇒ P0302. Tasa alta ⇒ MIL PARPADEANTE.'); await sleep(2800);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2200);

    setScenario('sintesis'); setMode('03'); el('c_ligera').click();
    showToast('Paso 5 · Caso 4: en carga ligera el código ya confirmado mantiene el MIL fija.'); await sleep(2400);
    el('c_alta').click();
    showToast('Paso 6 · Al acelerar fuerte, la tasa de fallos actual cruza el umbral del catalizador: el MIL empieza a PARPADEAR en tiempo real.'); await sleep(2800);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2000);

    showToast('✔ Demostración completa. Recorre los 4 casos libremente con los modos $01/$07/$03/$02.');
  }finally{
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    autoRunning=false;
  }
}
el('btnAuto').onclick=runAuto;

setScenario(SCEN_ORDER[0]);
