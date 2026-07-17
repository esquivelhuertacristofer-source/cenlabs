/* ============================================================
   LAB — MONITORES DE DISPONIBILIDAD (READINESS) PARA LA VERIFICACIÓN VEHICULAR (Dominio D10 · instrumentación)
   Continúa a "Escáner OBD-II y Diagnóstico" (mecanica-11) y a "Diagnóstico
   de Fallo de Encendido" (mecanica-28): ahí ya se leyó un DTC y se
   entendió el ciclo pendiente→confirmado. Aquí el foco es la lógica de
   aprobación/rechazo completa de la Tabla 1 — el conjunto exacto de
   monitores que deben estar "completados", la diferencia entre "no
   completado" y "no soportado", y qué ocurre cuando el escáner
   simplemente no logra conectar con el vehículo.
   Normatividad de referencia:
     · NOM-167-SEMARNAT-2017 — método de prueba SDB (Sistema de
       Diagnóstico a Bordo): Anexo normativo I (procedimiento e
       intentos de conexión, num. 2.3/2.6), num. 4.1.1.1 (monitores
       obligatorios para SDB tipo OBD-II/EOBD Euro 5+), Tabla 1
       (criterios de aprobación), num. 3.17–3.21 (monitor continuo/
       no continuo/soportado/no soportado)
     · NOM-047-SEMARNAT-2014 — delega el procedimiento para los
       vehículos que no pueden evaluarse por el método SDB
   Modelo de ingeniería (didáctico):
     · 11 monitores en el orden de los num. 3.17–3.19: 3 continuos
       (Ignición en cilindros, Combustible, Componentes integrales) +
       8 no continuos (Eficiencia del convertidor catalítico, Sensores
       de oxígeno, Calentamiento del convertidor catalítico,
       Evaporativo, Secundario de aire, Fugas de aire acondicionado,
       Calentamiento del sensor de oxígeno, EGR). De estos, 5 son
       obligatorios para SDB tipo OBD-II/EOBD Euro 5+ (num. 4.1.1.1):
       Ignición en cilindros, Eficiencia del convertidor catalítico,
       Combustible, Sensores de oxígeno, Componentes integrales.
     · Tabla 1 exige exactamente 3 criterios: (1) conexión exitosa con
       el SDB, (2) sin códigos de falla confirmados del tren motriz
       asociados a los monitores del num. 4.1.1, (3) todos esos
       monitores obligatorios "completados". Los monitores NO
       obligatorios no entran en el criterio 3.
     · "No soportado" (num. 3.20/3.21) ≠ "no completado": un monitor
       no soportado no viene de fábrica en ese vehículo por diseño
       (p. ej., EGR sustituido por VVT); no es una falla y no bloquea
       la verificación por sí solo.
     · Conexión no exitosa: el sistema reintenta hasta en tres
       ocasiones (Anexo normativo I, num. 2.6). Si aun así falla, se
       registran las características del vehículo y se notifica al
       propietario — no equivale a un rechazo ni a una aprobación.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.4,3.3,6.6],target:[-0.3,1.25,0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.42,minD:3.4,maxD:17});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);

const alu=castAluminum(), plas=techPlastic(0.08,0.12,0.11), rub=rubber();
const MAT={
  housing: std({...plas, metalness:0.2, roughness:0.6}),
  bezel: std({color:0x05100d, roughness:0.8, metalness:0.2}),
  tool: std({color:0x142420, roughness:0.5, metalness:0.35}),
  toolGrip: std({...rub, color:0x0c1512, roughness:1.0, metalness:0.0}),
  cable: std({...rub, color:0x111917, roughness:0.95, metalness:0.0}),
  connectorBody: std({color:0x1a1f22, roughness:0.55, metalness:0.4}),
  pin: std({color:0xc9a227, roughness:0.35, metalness:0.85}),
  bracket: std({...alu, metalness:0.6, roughness:0.6}),
};

const HOVER_LABELS=new Map();

/* ---------- 1) PANEL BAJO EL TABLERO + CONECTOR DLC + TESTIGO MIL ---------- */
const dash=new THREE.Group(); dash.position.set(-2.2,1.3,0.6); dash.rotation.y=0.35; scene.add(dash);
const dashBody=roundedBox(1.6,1.0,0.4,MAT.housing,0.14); dashBody.castShadow=true; dash.add(dashBody);
const dashBezel=roundedBox(1.4,0.8,0.08,MAT.bezel,0.08); dashBezel.position.set(0,0.05,0.2); dash.add(dashBezel);

const dlcGroup=new THREE.Group(); dlcGroup.position.set(0,-0.55,0.3); dash.add(dlcGroup);
const dlcBracket=roundedBox(0.56,0.38,0.03,MAT.bracket,0.03); dlcBracket.position.set(0,0,-0.09); dlcGroup.add(dlcBracket);
const dlcHousing=roundedBox(0.46,0.30,0.14,MAT.connectorBody,0.06); dlcHousing.castShadow=true; dlcGroup.add(dlcHousing);
const pinGeo=new THREE.CylinderGeometry(0.012,0.012,0.05,8);
for(let row=0;row<2;row++){
  for(let i=0;i<8;i++){
    const p=new THREE.Mesh(pinGeo, MAT.pin);
    p.rotation.x=Math.PI/2;
    p.position.set(-0.175+i*0.05, row===0?0.055:-0.055, 0.095);
    dlcGroup.add(p);
  }
}
const connLed=new THREE.Mesh(new THREE.SphereGeometry(0.025,10,10), std({color:0x1a1a1a,emissive:0x333333,emissiveIntensity:0.2}));
connLed.position.set(0.19,0.11,0.09); dlcGroup.add(connLed);

const milMat=std({color:0x2a1a0c, emissive:0xffb703, emissiveIntensity:0.0, roughness:0.45, metalness:0.2});
const mil=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.16,0.04), milMat);
mil.position.set(0.5,0.15,0.22); dash.add(mil);

const dashLabel=labelSprite('Panel bajo el tablero','#4FD1C5'); dashLabel.position.set(0,0.7,0);
dashLabel.visible=false; dashLabel.raycast=()=>{}; dash.add(dashLabel); HOVER_LABELS.set(dashBody,dashLabel);
const dlcLabel=labelSprite('Conector DLC · 16 pines','#FFB703'); dlcLabel.position.set(0,0.22,0);
dlcLabel.visible=false; dlcLabel.raycast=()=>{}; dlcGroup.add(dlcLabel); HOVER_LABELS.set(dlcHousing,dlcLabel);
const milLabel=labelSprite('Testigo MIL','#FFB703'); milLabel.position.set(0.5,0.32,0.22);
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
const toolLabel=labelSprite('Escáner SDB','#4FD1C5'); toolLabel.position.set(0,1.1,0);
toolLabel.visible=false; toolLabel.raycast=()=>{}; tool.add(toolLabel); HOVER_LABELS.set(toolBody,toolLabel);

/* ---------- 3) CABLE (escáner → conector DLC) ---------- */
const cableCurve=new THREE.CatmullRomCurve3([
  new THREE.Vector3(2.0,1.5,0.9), new THREE.Vector3(0.3,0.6,1.3),
  new THREE.Vector3(-1.1,0.9,1.0), new THREE.Vector3(-2.0,0.85,0.75),
]);
const cable=new THREE.Mesh(new THREE.TubeGeometry(cableCurve,48,0.045,10), MAT.cable); cable.castShadow=true; scene.add(cable);

/* ---------- 4) inspección por clic ---------- */
const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}

const PART_DESC=new Map([
  [dashBody,{name:'Panel bajo el tablero',desc:'Zona donde se ubica el conector de enlace de datos (DLC) — su posición exacta varía por fabricante (Anexo normativo I, num. 3).'}],
  [dlcHousing,{name:'Conector DLC (Data Link Connector)',desc:'16 pines · SAE J1962 / ISO 15031-3. Punto de conexión del escáner con la ECU. Si está en mal estado o hay un dispositivo intermedio, la conexión se considera no exitosa (Anexo I, num. 2.3).'}],
  [mil,{name:'Testigo MIL',desc:'Dato adicional que registra el escáner (Anexo I, num. 1). Aquí es solo informativo: no determina por sí solo el resultado de la Tabla 1 — revisa la ficha técnica.'}],
  [toolBody,{name:'Escáner de diagnóstico (SDB)',desc:'Cumple SAE J1978 / ISO 15031-4. Lee los monitores obligatorios del num. 4.1.1, códigos de falla confirmados y datos del vehículo.'}],
]);
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return; let o=hit.object;
  while(o){
    if(PART_DESC.has(o)){ const p=PART_DESC.get(o); showToast(`<b style="color:var(--accent2)">${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.desc}</span>`); return; }
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
   MODELO DE DATOS — 11 monitores · 4 casos guiados
   ============================================================ */
const MONITORS=[
  {key:'ignicion',   label:'Ignición en cilindros (detección de fallo)', tipo:'continuo',    ob:true},
  {key:'combustible', label:'Sistema del combustible',                    tipo:'continuo',    ob:true},
  {key:'integrales',  label:'Componentes integrales',                     tipo:'continuo',    ob:true},
  {key:'catEff',      label:'Eficiencia del convertidor catalítico',      tipo:'no continuo', ob:true},
  {key:'o2',          label:'Sensores de oxígeno',                        tipo:'no continuo', ob:true},
  {key:'catHeat',     label:'Calentamiento del convertidor catalítico',   tipo:'no continuo', ob:false},
  {key:'evap',        label:'Sistema evaporativo',                        tipo:'no continuo', ob:false},
  {key:'airSec',      label:'Sistema secundario de aire',                 tipo:'no continuo', ob:false},
  {key:'acLeak',      label:'Fugas de aire acondicionado',                tipo:'no continuo', ob:false},
  {key:'o2Heat',      label:'Calentamiento del sensor de oxígeno',        tipo:'no continuo', ob:false},
  {key:'egr',         label:'Recirculación de gases de escape (EGR)',     tipo:'no continuo', ob:false},
];

const SCEN_ORDER=['noComm','aprobado','rechazado','noEvaluable'];
const SCEN_LABEL={
  noComm:'Conexión no exitosa (3 intentos)',
  aprobado:'Aprobado · readiness parcial válido',
  rechazado:'Rechazado · DTC confirmado',
  noEvaluable:'No evaluable · doble trampa',
};
const CASES={
  noComm:{ noComm:true, estados:{}, dtc:null },
  aprobado:{ estados:{
      ignicion:'completado', combustible:'completado', integrales:'completado',
      catEff:'completado', o2:'completado', catHeat:'completado',
      evap:'no completado', airSec:'completado', acLeak:'no completado',
      o2Heat:'completado', egr:'completado',
    }, dtc:null },
  rechazado:{ estados:{
      ignicion:'completado', combustible:'completado', integrales:'completado',
      catEff:'completado', o2:'completado', catHeat:'completado',
      evap:'completado', airSec:'completado', acLeak:'completado',
      o2Heat:'completado', egr:'completado',
    }, dtc:{code:'P0300', label:'Fallo de encendido aleatorio/múltiple — CONFIRMADO', monitor:'ignicion'} },
  noEvaluable:{ estados:{
      ignicion:'completado', combustible:'completado', integrales:'completado',
      catEff:'no completado', o2:'completado', catHeat:'completado',
      evap:'completado', airSec:'completado', acLeak:'completado',
      o2Heat:'completado', egr:'no soportado',
    }, dtc:null },
};
const QUESTIONS={
  noComm:{ prompt:'El sistema intentó conectar con el SDB y no lo logró. El DLC se ve en buen estado. ¿Qué determina el procedimiento?',
    opts:[
      {t:'El sistema reintenta la conexión hasta en tres ocasiones; si no se logra, se registran marca, submarca y año modelo del vehículo y se notifica al propietario — no es un rechazo ni una aprobación.',ok:true},
      {t:'Al no conectar, el vehículo se rechaza automáticamente por incumplimiento.',ok:false},
      {t:'Al no conectar, el vehículo pasa automáticamente al método Dinámica sin importar el año modelo.',ok:false},
      {t:'El sistema debe seguir intentando indefinidamente hasta lograr conexión.',ok:false},
    ]},
  aprobado:{ prompt:'Los 5 monitores obligatorios del num. 4.1.1 están completados, 2 monitores NO obligatorios (Evaporativo y Fugas de A/C) siguen "no completado", y no hay códigos de falla confirmados. ¿Cuál es el resultado?',
    opts:[
      {t:'APROBADO — la Tabla 1 exige monitores completados solo entre los señalados en el num. 4.1.1 (los obligatorios); los demás no entran en esa decisión.',ok:true},
      {t:'NO EVALUABLE, porque no todos los 11 monitores están completados.',ok:false},
      {t:'RECHAZADO, porque cualquier monitor incompleto invalida la verificación.',ok:false},
      {t:'APROBADO, pero solo si además esos 2 monitores se completan en la siguiente revisión.',ok:false},
    ]},
  rechazado:{ prompt:'Los 11 monitores están completados (readiness perfecto), pero el SDB reporta un código de falla confirmado P0300 en el monitor de Ignición en cilindros. ¿Cuál es el resultado?',
    opts:[
      {t:'RECHAZADO — la Tabla 1 exige que no existan códigos de falla confirmados asociados a los monitores del 4.1.1; esto pesa aparte de que los monitores estén completados.',ok:true},
      {t:'APROBADO, porque todos los monitores están completados y eso es lo único que exige la norma.',ok:false},
      {t:'NO EVALUABLE, porque un código confirmado siempre significa que falta información.',ok:false},
      {t:'El resultado depende del color del testigo MIL, no del código confirmado.',ok:false},
    ]},
  noEvaluable:{ prompt:'El monitor de Eficiencia del convertidor catalítico (obligatorio) aparece "no completado". El monitor EGR aparece "no soportado" — el vehículo usa VVT en vez de EGR. No hay códigos confirmados. ¿Cuál es el resultado y por qué?',
    opts:[
      {t:'NO EVALUABLE — por el monitor obligatorio "no completado" (Eficiencia del convertidor catalítico); el EGR "no soportado" no es un problema: ese monitor no aplica por diseño y tampoco es obligatorio.',ok:true},
      {t:'NO EVALUABLE por el EGR, ya que un monitor no soportado siempre bloquea la verificación.',ok:false},
      {t:'APROBADO, porque "no soportado" se cuenta como si estuviera completado.',ok:false},
      {t:'RECHAZADO, porque dos monitores presentan alguna anomalía.',ok:false},
    ]},
};
const DX_HINT={
  noComm:'El Anexo normativo I (num. 2.6) es explícito: si la conexión no es exitosa, el sistema reintenta hasta en tres ocasiones. Si aun así no logra comunicarse, el procedimiento es registrar las características del vehículo y notificar al propietario — no hay una ruta automática a "rechazado", "aprobado" ni al método Dinámica por el simple hecho de no conectar.',
  aprobado:'La Tabla 1 dice literalmente "todos los monitores... señalados en el numeral 4.1.1" — es decir, solo los 5 obligatorios para este tipo de SDB. Los monitores no obligatorios (aquí, Evaporativo y Fugas de aire acondicionado) pueden seguir "no completados" sin que eso mueva el resultado.',
  rechazado:'La Tabla 1 tiene tres criterios independientes y los tres deben cumplirse. El criterio de "sin códigos de falla confirmados" pesa aparte de "monitores completados": un readiness perfecto no rescata un DTC confirmado en un monitor obligatorio.',
  noEvaluable:'Dos ideas separadas de los num. 3.20/3.21: "no soportado" significa que el monitor no viene de fábrica en ese vehículo (aquí, EGR fue sustituido por VVT) — no es una falla y no bloquea nada, menos aún siendo un monitor no obligatorio. El bloqueo real es el monitor OBLIGATORIO "no completado" (Eficiencia del convertidor catalítico): eso sí impide cumplir el criterio 3 de la Tabla 1.',
};

let connected=false, sdbLinked=null, connAttempt=0, connGen=0;
let scenarioKey=SCEN_ORDER[0], mode='con';
let dxSolved={noComm:false,aprobado:false,rechazado:false,noEvaluable:false};

function obligatoriosCompletados(){
  const cs=CASES[scenarioKey];
  const obligatorios=MONITORS.filter(m=>m.ob);
  const n=obligatorios.filter(m=>cs.estados[m.key]==='completado').length;
  return {n, total:obligatorios.length};
}
function computeVerdict(){
  const cs=CASES[scenarioKey];
  if(sdbLinked!==true) return {code:'NO_APLICABLE', c1:false, c2:null, c3:null};
  const c2 = !cs.dtc;
  const obligatorios=MONITORS.filter(m=>m.ob);
  const c3 = obligatorios.every(m=>cs.estados[m.key]==='completado');
  let code;
  if(!c2) code='RECHAZADO';
  else if(!c3) code='NO_EVALUABLE';
  else code='APROBADO';
  return {code, c1:true, c2, c3};
}

/* ---------- síntesis: sonidos de UI ---------- */
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:800,Q:1});

/* ============================================================
   ANIMACIÓN
   ============================================================ */
S.setAnimate((dt,time)=>{
  let ledColor=0x333333, ledI=0.15;
  if(connAttempt>0){ ledColor=0xffb703; ledI=(Math.sin(time*2*Math.PI*2.5)>0)?1.0:0.15; }
  else if(sdbLinked===true){ ledColor=0x34d399; ledI=0.8; }
  else if(sdbLinked===false){ ledColor=0xf4475e; ledI=0.75; }
  connLed.material.emissive.setHex(ledColor);
  connLed.material.emissiveIntensity += (ledI-connLed.material.emissiveIntensity)*Math.min(1,dt*10);

  const milTarget=(connected&&sdbLinked===true&&CASES[scenarioKey].dtc)?0.85:0.0;
  milMat.emissiveIntensity += (milTarget-milMat.emissiveIntensity)*Math.min(1,dt*8);

  synth.update(0,0,0);
});
S.start();

/* ============================================================
   HUD (izquierda)
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Autotrónica · Verificación vehicular OBD-II</div>
  <h2>Monitores de Disponibilidad (Readiness)</h2>
  <p>Ya sabes leer un DTC y diagnosticar un fallo de encendido. Ahora aplicas la <b>Tabla 1</b> completa: ¿conectó el escáner?, ¿hay códigos de falla confirmados?, ¿están completados los monitores <b>obligatorios</b> del num. 4.1.1? De esas tres respuestas sale el resultado.</p>
  <div class="formula">Conexión exitosa + sin DTC confirmado (4.1.1) + obligatorios completados ⇒ APROBADO<br>Cualquier DTC confirmado ⇒ RECHAZADO (sin importar los monitores)<br>Monitor obligatorio "no completado" y sin DTC ⇒ NO EVALUABLE</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#34d399"></span>Monitor completado</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Monitor no soportado (no es falla)</div>
    <div class="li"><span class="dot" style="background:#f4475e"></span>Monitor no completado</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> los 3 criterios exactos de la Tabla 1, el conjunto de 5 monitores obligatorios del num. 4.1.1.1, la distinción "no completado" vs. "no soportado" (num. 3.20/3.21), y el límite de 3 intentos de conexión del Anexo normativo I (num. 2.6).</div>
    <div class="fl no"><b>NO modela:</b> la luz MIL como criterio de aptitud para intentar el método SDB (Artículo Transitorio Décimo Segundo — provisión temporal mientras no se actualice la NOM-047), el Catálogo Vehicular del num. 4.1.1.3, los tipos de conector alterno del num. 4, ni el protocolo eléctrico real del bus. Consulta la ficha técnica y el manual del verificador para el procedimiento completo.</div>
  </div>
  <div class="src">Ref: NOM-167-SEMARNAT-2017 (Anexo normativo I, Tabla 1, num. 3.17–3.21, 4.1.1.1) · NOM-047-SEMARNAT-2014</div>`;

/* ============================================================
   PANEL (derecha)
   ============================================================ */
document.getElementById('panel').innerHTML=`
  <h4>Escáner · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span></h4>
  <div class="modebar">
    <button class="b" id="s_noComm">1 · Sin conexión</button>
    <button class="b" id="s_aprobado">2 · Aprobado</button>
    <button class="b" id="s_rechazado">3 · Rechazado</button>
    <button class="b" id="s_noEvaluable">4 · No evaluable</button>
  </div>
  <div class="modebar">
    <button class="b on" id="m_con">Conexión</button>
    <button class="b" id="m_mon">Monitores</button>
    <button class="b" id="m_dtc">Códigos</button>
    <button class="b" id="m_ver">Resultado</button>
  </div>
  <div class="console" id="console">Energiza el sistema para iniciar el flujo de datos.</div>
  <div id="tele">
    <div class="g"><div class="gl"><span>Conexión SDB</span><b id="t_con">—</b></div></div>
    <div class="g"><div class="gl"><span>Obligatorios (4.1.1)</span><b id="t_ob">—</b></div></div>
    <div class="g"><div class="gl"><span>Códigos confirmados</span><b id="t_dtc">—</b></div></div>
    <div class="g"><div class="gl"><span>Testigo MIL</span><b id="t_mil">—</b></div></div>
    <div class="g"><div class="gl"><span>Resultado</span><b id="t_ver">—</b></div></div>
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

function renderConexion(){
  let statusLine;
  if(connAttempt>0) statusLine=`<span style="color:var(--hv)">Interrogando al SDB… intento ${connAttempt}/3</span>`;
  else if(sdbLinked===true) statusLine=`<span class="ok">✔ Conexión exitosa con la ECU.</span>`;
  else if(sdbLinked===false) statusLine = dxSolved.noComm
    ? `<span class="dtc">✗ Conexión NO exitosa tras 3 intentos.</span><br><span class="mono">Se registran las características del vehículo (marca, submarca, año modelo) y se notifica al propietario (Anexo normativo I, num. 2.6). Esto no equivale a un rechazo ni a una aprobación.</span>`
    : `<span class="dtc">✗ Conexión NO exitosa tras 3 intentos.</span><br><span class="mono">Consulta el procedimiento aplicable en la ficha técnica.</span>`;
  else statusLine=`<span class="mono">Sin intentar todavía.</span>`;
  return `<b>Conexión con el SDB</b><br><span class="mono">DLC: SAE J1962 / ISO 15031-3 · 16 pines</span><br>${statusLine}`;
}
function renderMonTable(){
  if(sdbLinked!==true) return `<b>Monitores de disponibilidad</b><br><span class="mono">Requiere conexión exitosa con el SDB.</span>`;
  const cs=CASES[scenarioKey];
  const rows=MONITORS.map(m=>{
    const st=cs.estados[m.key];
    const cls = st==='completado' ? 'good' : st==='no soportado' ? 'warn' : 'bad';
    const tag = m.ob ? ' <span style="color:var(--hv)">★</span>' : '';
    return `<div class="g"><div class="gl"><span>${m.label}${tag}</span><b class="${cls}">${st}</b></div></div>`;
  }).join('');
  return `<div style="margin-bottom:6px;font-size:10.5px;color:var(--dim)">★ = obligatorio (num. 4.1.1.1 · SDB tipo OBD-II/EOBD Euro 5+)</div>${rows}`;
}
function renderDtc(){
  if(sdbLinked!==true) return `<b>Códigos de falla confirmados</b><br><span class="mono">Requiere conexión exitosa con el SDB.</span>`;
  const cs=CASES[scenarioKey];
  if(!cs.dtc) return `<b>Códigos de falla confirmados</b><br><span class="ok mono">Sin códigos de falla confirmados del tren motriz asociados a los monitores del numeral 4.1.1.</span>`;
  return `<b>Códigos de falla confirmados</b><br><span class="dtc">${cs.dtc.code}</span> <span class="mono">${cs.dtc.label}</span>`;
}
function renderVerdict(){
  if(sdbLinked!==true){
    const msg = sdbLinked===false
      ? (dxSolved.noComm
          ? 'Conexión NO exitosa tras 3 intentos (Anexo normativo I, num. 2.6). Se registran las características del vehículo y se notifica al propietario — el método de prueba no pudo aplicarse; esto NO es un rechazo ni una aprobación.'
          : 'Conexión NO exitosa tras 3 intentos. Consulta el procedimiento aplicable en la ficha técnica.')
      : 'Aún no hay conexión con el SDB — el método de prueba no puede aplicarse todavía.';
    return `<b>Resultado de la verificación</b><br><span class="mono">${msg}</span>`;
  }
  const v=computeVerdict();
  const chk=ok=> ok?'<b class="good">cumple</b>':'<b class="bad">no cumple</b>';
  const reveal=dxSolved[scenarioKey];
  const bannerColor = reveal ? (v.code==='APROBADO'?'var(--good)':v.code==='RECHAZADO'?'var(--bad)':'var(--hv)') : 'var(--dim)';
  const bannerTxt = reveal ? {APROBADO:'✔ APROBADO', RECHAZADO:'✘ RECHAZADO', NO_EVALUABLE:'⚠ NO EVALUABLE'}[v.code] : '? Responde la pregunta diagnóstica para ver el resultado';
  return `<b>Tabla 1 · criterios de evaluación SDB</b>
    <div class="g"><div class="gl"><span>1. Conexión con el SDB</span>${chk(v.c1)}</div></div>
    <div class="g"><div class="gl"><span>2. Sin códigos confirmados (4.1.1)</span>${chk(v.c2)}</div></div>
    <div class="g"><div class="gl"><span>3. Monitores 4.1.1 completados</span>${chk(v.c3)}</div></div>
    <div style="margin-top:10px;padding:8px;border-radius:8px;text-align:center;font-weight:bold;font-size:14px;background:rgba(0,0,0,.25);color:${bannerColor}">${bannerTxt}</div>`;
}
function setConsole(){
  if(!connected){ consoleEl.innerHTML='Energiza el sistema para iniciar el flujo de datos.'; drawToolScreen(); updateTele(); return; }
  if(mode==='con') consoleEl.innerHTML=renderConexion();
  else if(mode==='mon') consoleEl.innerHTML=renderMonTable();
  else if(mode==='dtc') consoleEl.innerHTML=renderDtc();
  else if(mode==='ver') consoleEl.innerHTML=renderVerdict();
  drawToolScreen();
  updateTele();
}
function updateTele(){
  if(!connected||sdbLinked!==true){
    const conB=el('t_con');
    if(connAttempt>0){ conB.textContent='intento '+connAttempt+'/3'; conB.className='warn'; }
    else if(sdbLinked===false){ conB.textContent='no exitosa'; conB.className='bad'; }
    else { conB.textContent='—'; conB.className=''; }
    ['t_ob','t_dtc','t_mil','t_ver'].forEach(id=>{el(id).textContent='—';el(id).className='';});
    return;
  }
  el('t_con').textContent='exitosa'; el('t_con').className='good';
  const {n,total}=obligatoriosCompletados();
  const obB=el('t_ob'); obB.textContent=n+'/'+total; obB.className=n===total?'good':'bad';
  const cs=CASES[scenarioKey];
  const dtcB=el('t_dtc'); dtcB.textContent=cs.dtc?cs.dtc.code:'ninguno'; dtcB.className=cs.dtc?'bad':'good';
  const milB=el('t_mil'); milB.textContent=cs.dtc?'encendido':'apagado'; milB.className=cs.dtc?'warn':'good';
  const v=computeVerdict();
  const verB=el('t_ver');
  const reveal=dxSolved[scenarioKey];
  verB.textContent=reveal?v.code.replace('_',' '):'responde la pregunta';
  verB.className=reveal?(v.code==='APROBADO'?'good':v.code==='RECHAZADO'?'bad':'warn'):'';
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
function drawToolScreen(){
  const c=scrCanvas.getContext('2d');
  c.fillStyle='#04120e'; c.fillRect(0,0,320,384);
  c.strokeStyle='rgba(79,209,197,.4)'; c.lineWidth=2; c.strokeRect(6,6,308,372);
  c.fillStyle='#4FD1C5'; c.font='bold 20px Outfit, sans-serif'; c.textAlign='left';
  c.fillText('CEN · Monitores SDB',18,34);
  c.font='13px Outfit, sans-serif'; c.fillStyle='#8FB3AC';
  if(!connected){ c.fillText('DESCONECTADO',18,80); c.fillText('Energiza el sistema',18,104); scrTex.needsUpdate=true; return; }
  c.fillText(SCEN_LABEL[scenarioKey],18,58);
  if(connAttempt>0){
    c.fillStyle='#FFB703'; c.font='bold 22px Outfit, sans-serif';
    c.fillText('Intento '+connAttempt+'/3…',18,140);
    c.font='13px Outfit, sans-serif'; c.fillStyle='#8FB3AC';
    c.fillText('Interrogando al SDB',18,166);
    scrTex.needsUpdate=true; return;
  }
  if(sdbLinked===false){
    c.fillStyle='#f4475e'; c.font='bold 19px Outfit, sans-serif';
    wrapText(c,'CONEXIÓN NO EXITOSA',18,132,282,24);
    c.font='13px Outfit, sans-serif'; c.fillStyle='#8FB3AC';
    wrapText(c, dxSolved.noComm ? 'Se registran las características del vehículo y se notifica al propietario.' : 'Consulta el procedimiento aplicable.',18,168,282,17);
    scrTex.needsUpdate=true; return;
  }
  if(sdbLinked!==true){ scrTex.needsUpdate=true; return; }
  const {n,total}=obligatoriosCompletados();
  c.fillStyle='#EAF4F1'; c.font='bold 26px Outfit, sans-serif';
  c.fillText(n+'/'+total+' obligatorios',18,110);
  c.font='13px Outfit, sans-serif'; c.fillStyle='#8FB3AC';
  c.fillText('completados (num. 4.1.1)',18,132);
  const cs=CASES[scenarioKey];
  if(cs.dtc){
    c.fillStyle='#f4475e'; c.font='bold 17px Outfit, sans-serif';
    c.fillText(cs.dtc.code+' confirmado',18,168);
  }else{
    c.fillStyle='#34d399'; c.font='13px Outfit, sans-serif';
    c.fillText('Sin códigos confirmados',18,168);
  }
  const v=computeVerdict();
  const reveal=dxSolved[scenarioKey];
  const bannerTxt=reveal?{APROBADO:'APROBADO',RECHAZADO:'RECHAZADO',NO_EVALUABLE:'NO EVALUABLE'}[v.code]:'? ? ?';
  const bannerColor=reveal?{APROBADO:'#34d399',RECHAZADO:'#f4475e',NO_EVALUABLE:'#FFB703'}[v.code]:'#8FB3AC';
  c.fillStyle=bannerColor; c.font='bold 24px Outfit, sans-serif'; c.textAlign='center';
  c.fillText(bannerTxt,160,340);
  c.textAlign='left';
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
      if(!connected||connAttempt>0){ showToast('Primero logra la conexión con el SDB.'); return; }
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

/* ---------- conexión ---------- */
async function tryConnect(){
  const myGen=++connGen;
  if(scenarioKey!=='noComm'){ sdbLinked=true; connAttempt=0; setConsole(); return; }
  sdbLinked=null;
  for(let i=1;i<=3;i++){
    connAttempt=i; setConsole();
    showToast(`Interrogación al SDB · intento ${i}/3…`);
    await sleep(700);
    if(myGen!==connGen) return;
  }
  connAttempt=0; sdbLinked=false; setConsole();
  showToast('✗ Conexión no exitosa tras 3 intentos. Se registran los datos del vehículo y se notifica al propietario.');
}
async function connectScanner(){
  connected=true;
  synth.init(); synth.resume();
  el('btnEnergize').classList.add('on'); el('btnEnergize').textContent='🔌 Desconectar';
  S.moveTo([3.0,2.1,4.8],[-0.3,1.05,0.5],1.3); S.setCinematicIdle(true); synth.beep(880,0.1,0.06);
  await tryConnect();
}
function disconnectScanner(){
  connGen++;
  connected=false; sdbLinked=null; connAttempt=0;
  S.setCinematicIdle(false);
  el('btnEnergize').classList.remove('on'); el('btnEnergize').textContent='🔌 Conectar escáner';
  setConsole();
}

/* ---------- interacción ---------- */
function setScenario(key){
  scenarioKey=key;
  SCEN_ORDER.forEach(k=>el('s_'+k).classList.toggle('on',k===key));
  el('p_case').textContent='Caso '+(SCEN_ORDER.indexOf(key)+1)+'/4 · '+SCEN_LABEL[key];
  renderQuestion(); clearDx();
  if(connected) return tryConnect();
  setConsole();
  return Promise.resolve();
}
function setMode(m){
  mode=m;
  ['con','mon','dtc','ver'].forEach(id=>el('m_'+id).classList.toggle('on',id===m));
  setConsole();
}
SCEN_ORDER.forEach(k=>{ el('s_'+k).onclick=()=>setScenario(k); });
el('m_con').onclick=()=>setMode('con');
el('m_mon').onclick=()=>setMode('mon');
el('m_dtc').onclick=()=>setMode('dtc');
el('m_ver').onclick=()=>setMode('ver');

el('btnEnergize').onclick=()=>{ connected?disconnectScanner():connectScanner(); };

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
    showToast('Paso 1 · Caso 1: el DLC se ve en buen estado. Energizamos el sistema y probamos la conexión.');
    if(connected) await setScenario('noComm'); else await connectScanner();
    setMode('con'); await sleep(1200);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2600);

    await setScenario('aprobado'); setMode('mon');
    showToast('Paso 2 · Caso 2: los 5 monitores obligatorios (★) están completados; 2 no obligatorios siguen pendientes y no afectan el criterio 3.'); await sleep(3200);
    setMode('ver'); await sleep(2000);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2600);

    await setScenario('rechazado'); setMode('dtc');
    showToast('Paso 3 · Caso 3: readiness perfecto (11/11), pero un código P0300 confirmado en un monitor obligatorio.'); await sleep(3000);
    setMode('ver'); await sleep(2000);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2600);

    await setScenario('noEvaluable'); setMode('mon');
    showToast('Paso 4 · Caso 4: doble trampa — Eficiencia del convertidor catalítico (obligatorio) "no completado", EGR "no soportado" (vehículo con VVT, y tampoco es obligatorio).'); await sleep(3600);
    setMode('ver'); await sleep(2000);
    document.querySelector('#dxWrap .b.dx[data-ok="1"]').click(); await sleep(2200);

    showToast('✔ Demostración completa. Recorre los 4 casos libremente con los modos Conexión/Monitores/Códigos/Resultado.');
  }finally{
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    autoRunning=false;
  }
}
el('btnAuto').onclick=runAuto;

setScenario(SCEN_ORDER[0]);
