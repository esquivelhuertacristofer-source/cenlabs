/* ============================================================
   LAB — RELACIÓN DE TRANSFORMACIÓN Y PRUEBA DE POLARIDAD
   (Dominio D5 · transformadores — molde E+P: ensamble/servicio 3D +
   panel-instrumento)
   Normatividad de referencia:
     · IEC 60076-1 — Cláusula 10, Tabla 1, ítem 2: tolerancia de relación de
       transformación = la MENOR entre ±0.5% de la relación especificada y
       ±1/10 de la impedancia de cortocircuito real en la toma principal (este
       segundo criterio requiere %Z, que se calcula en la práctica de circuito
       equivalente — aquí solo se aplica el criterio de ±0.5%).
       Cláusula 11.3: "Measurement of voltage ratio and check of phase
       displacement" — procedimiento de la prueba de relación.
     · ANSI/IEEE C57.12.00 — Cláusula 5.7.1: transformadores monofásicos con
       potencia ≤200 kVA Y tensión de AT ≤8660 V se fabrican con polaridad
       ADITIVA; todos los demás (kVA>200 O AT>8660V), SUSTRACTIVA. Es una
       condición Y, no O.
     · CFE K0000-04 usa la convención de terminales H1/H2-X1/X2 de ANSI en la
       práctica mexicana y exige sustractiva para sus transformadores de AT
       superior a 8660 V.
   Modelo de ingeniería (didáctico):
     · Prueba de relación: con la BT en circuito abierto, se aplica tensión
       reducida a H1-H2 y se lee V2 en X1-X2. a_medida = Vap/V2_medida.
     · Prueba de polaridad (4 terminales): se puentea H1 con X1, se aplica
       tensión reducida a H1-H2, y se lee la tensión entre las DOS terminales
       libres restantes (H2-X2). Con a'=N_BT/N_AT=1/a:
         sustractiva → V_medida = Vap·(1−a')  (V medida < V aplicada)
         aditiva     → V_medida = Vap·(1+a')  (V medida > V aplicada)
       Esta comparación de tensiones —no la disposición física de las
       terminales en la carcasa— es el criterio normativo de la prueba, y es
       el único que este lab modela (ver "NO modela" en el HUD).
     · La magnitud de "tensión reducida" de prueba NO sigue un porcentaje
       normativo único; es una elección pedagógica de seguridad, declarada
       explícitamente por caso, no una cifra de norma.
     · Todos los valores de placa y de lectura son constantes fijas elegidas
       a mano (mismo patrón que calibrador-vernier.body.js): CERO
       Math.random() en la física del lab. Las cantidades derivadas
       (a_medida, %desviación, V_medida de polaridad, veredicto) se CALCULAN
       en código a partir de esas constantes, nunca se transcriben a mano.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.6,2.6,5.2],target:[0,1.0,0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:14});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};

const brush=brushedMetal(), alu=castAluminum(), plas=techPlastic(0.09,0.10,0.12), rub=rubber();
const MAT={
  tank:    std({...alu, color:0x445055, metalness:0.45, roughness:0.55}),
  tankDk:  std({...alu, color:0x2b3438, metalness:0.40, roughness:0.60}),
  bushHV:  std({color:0xB33A2E, roughness:0.35, metalness:0.15}),
  bushLV:  std({color:0x2E6DB3, roughness:0.35, metalness:0.15}),
  cap:     std({...brush, color:0xC9A227, metalness:0.70, roughness:0.35}),
  bench:   std({...plas, color:0x3a464d, roughness:0.7}),
  variac:  std({...brush, color:0xd7dde0, metalness:0.75, roughness:0.35}),
  knob:    std({...rub, color:0x1c2226, roughness:0.85}),
  wireHV:  std({color:0x8a2b22, roughness:0.55}),
  wireLV:  std({color:0x244a7a, roughness:0.55}),
  jumper:  std({...brush, color:0xC9A227, metalness:0.75, roughness:0.30}),
  bezel:   std({color:0x0b0f12, roughness:0.4}),
};
/* ---------- estado ---------- */
let caseKey='ratioSano'; let active=false; let solved=false; let simT=0;
let apVal=0, apTarget=0, measVal=0, measTarget=0;
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:900,Q:1});

const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}
const HOVER_LABELS=new Map();

/* ============================================================
   MODELO ELÉCTRICO — relación de transformación y prueba de polaridad
   ============================================================ */
const CASES={
  ratioSano:{
    tipo:'ratio', nombre:'Relación · unidad A',
    unidad:'Transformador de control 500 VA, 220/24 V — unidad #1',
    aNameplate:220/24, kva:0.5, v1n:220, v2n:24,
    Vap:110, V2meas:11.98, scaleAp:150, scaleMeas:20,
    mision:'Caso 1 · RELACIÓN EN VACÍO — con X1-X2 en circuito abierto, aplica tensión reducida a H1-H2 y lee V2 para calcular la relación medida y compararla contra la tolerancia de placa.',
  },
  ratioFalla:{
    tipo:'ratio', nombre:'Relación · unidad B',
    unidad:'Transformador de control 500 VA, 220/24 V — unidad #2',
    aNameplate:220/24, kva:0.5, v1n:220, v2n:24,
    Vap:110, V2meas:11.50, scaleAp:150, scaleMeas:20,
    mision:'Caso 2 · RELACIÓN EN VACÍO — misma prueba sobre una unidad distinta: compara si la relación medida sigue dentro de tolerancia.',
  },
  polAditiva:{
    tipo:'polaridad', nombre:'Polaridad · unidad C',
    unidad:'Transformador de control 150 VA, 240/24 V',
    aNameplate:240/24, kva:0.15, v1n:240, v2n:24,
    Vap:24, modo:'aditiva', scaleAp:30, scaleMeas:30,
    mision:'Caso 3 · PRUEBA DE POLARIDAD (unidad de control) — puentea H1 con X1, aplica tensión reducida a H1-H2 y lee la tensión entre las terminales libres H2-X2.',
  },
  polSustractiva:{
    tipo:'polaridad', nombre:'Polaridad · unidad D',
    unidad:'Transformador de distribución 300 kVA, 13200/240 V',
    aNameplate:13200/240, kva:300, v1n:13200, v2n:240,
    Vap:55, modo:'sustractiva', scaleAp:60, scaleMeas:60,
    mision:'Caso 4 · PRUEBA DE POLARIDAD (unidad de distribución) — misma prueba sobre una unidad de mayor potencia: confirma la clasificación de fábrica.',
  },
};
const CASE_ORDER=['ratioSano','ratioFalla','polAditiva','polSustractiva'];
const CASE_CAM={
  ratioSano:      [[2.9,2.1,4.2],[0.0,1.05,0.0]],
  ratioFalla:     [[2.9,2.1,4.2],[0.0,1.05,0.0]],
  polAditiva:     [[3.1,2.0,3.7],[0.05,1.25,0.0]],
  polSustractiva: [[3.1,2.0,3.7],[0.05,1.25,0.0]],
};

function ratioStats(key){
  const c=CASES[key];
  const aMeasured=c.Vap/c.V2meas;
  const devPct=Math.abs(aMeasured-c.aNameplate)/c.aNameplate*100;
  const pass=devPct<=0.5;
  return {aMeasured,devPct,pass};
}
function polarityVoltage(Vap,aNameplate,modo){
  const aInv=1/aNameplate;
  return modo==='sustractiva' ? Vap*(1-aInv) : Vap*(1+aInv);
}
function polarityStats(key){
  const c=CASES[key];
  const Vmeas=polarityVoltage(c.Vap,c.aNameplate,c.modo);
  const detected = Vmeas<c.Vap ? 'sustractiva' : 'aditiva';
  return {Vmeas,detected};
}

/* ---------- generador de opciones de quiz ---------- */
function shuffle(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function ratioQuizText(key){
  const c=CASES[key]; const st=ratioStats(key);
  const pregunta=`${c.mision}<br>Relación nominal de placa: a=N1/N2=${c.v1n}/${c.v2n}=${c.aNameplate.toFixed(4)}. Tensión de prueba aplicada a H1-H2: <b>${c.Vap.toFixed(2)} V</b>. Tensión medida en X1-X2 (circuito abierto): <b>${c.V2meas.toFixed(2)} V</b>. Calcula la relación medida y determina si cumple la tolerancia de la IEC 60076-1 (Cláusula 10, Tabla 1: ±0.5% de la relación especificada).`;
  const opciones=[
    {t:`a medida = Vap/V2 = ${st.aMeasured.toFixed(4)} — desviación ${st.devPct.toFixed(2)}%: ${st.pass?'CUMPLE':'NO CUMPLE'} la tolerancia (±0.5%).`, ok:true,
      why:`a=Vap/V2meas=${c.Vap.toFixed(2)}/${c.V2meas.toFixed(2)}=${st.aMeasured.toFixed(4)}; desviación=|${st.aMeasured.toFixed(4)}−${c.aNameplate.toFixed(4)}|/${c.aNameplate.toFixed(4)}×100=${st.devPct.toFixed(2)}%, ${st.pass?'dentro':'fuera'} del ±0.5% de IEC 60076-1 Cláusula 10, Tabla 1, ítem 2.`},
    {t:`a medida = V2/Vap = ${(c.V2meas/c.Vap).toFixed(4)} (relación invertida).`, ok:false,
      why:'La relación de transformación se define a=N1/N2=V1/V2 (lado de alta entre lado de baja) — invertir el cociente confunde la relación con su recíproco.'},
    {t:`a medida coincide exactamente con la nominal de placa (${c.aNameplate.toFixed(4)}) porque así lo indica el fabricante.`, ok:false,
      why:'La placa indica la relación NOMINAL de diseño; la prueba existe precisamente para verificar con una medición real si el devanado la cumple — no puede asumirse sin calcularla.'},
    {t: st.pass ? 'La desviación calculada excede la tolerancia de ±0.5% y el transformador debe rechazarse.' : 'La desviación calculada está dentro de la tolerancia de ±0.5% y el transformador es aceptable.', ok:false,
      why:`Esta afirmación invierte el resultado real: la desviación de ${st.devPct.toFixed(2)}% ${st.pass?'SÍ cumple':'NO cumple'} la tolerancia de ±0.5% de la IEC 60076-1.`},
  ];
  return {pregunta, opciones:shuffle(opciones)};
}
function polarityQuizText(key){
  const c=CASES[key]; const st=polarityStats(key); const aInv=1/c.aNameplate;
  const clase = (c.kva<=200 && c.v1n<=8660) ? 'aditiva' : 'sustractiva';
  const pregunta=`${c.mision}<br>Relación nominal: a=N1/N2=${c.aNameplate.toFixed(4)} (N_BT/N_AT=${aInv.toFixed(5)}). Tensión de prueba aplicada a H1-H2 (con H1 puenteado a X1): <b>${c.Vap.toFixed(2)} V</b>. Tensión medida entre las terminales libres H2-X2: <b>${st.Vmeas.toFixed(2)} V</b>. ¿Qué polaridad indica esta lectura?`;
  const opciones=[
    {t:`Polaridad ${st.detected==='sustractiva'?'SUSTRACTIVA':'ADITIVA'} — V medida (${st.Vmeas.toFixed(2)} V) ${st.detected==='sustractiva'?'<':'>'} V aplicada (${c.Vap.toFixed(2)} V).`, ok:true,
      why:`Con V=Vap·(1${st.detected==='sustractiva'?'−':'+'}N_BT/N_AT): V=${c.Vap.toFixed(2)}·(1${st.detected==='sustractiva'?'−':'+'}${aInv.toFixed(5)})=${st.Vmeas.toFixed(2)} V. V medida ${st.detected==='sustractiva'?'menor':'mayor'} que V aplicada ⇒ ${st.detected}. Consistente con ANSI/IEEE C57.12.00 cláusula 5.7.1: esta unidad (${c.kva} kVA, AT=${c.v1n} V) ${clase==='aditiva'?'cumple kVA≤200 Y AT≤8660V ⇒ clase aditiva de fábrica':'no cumple la condición kVA≤200 Y AT≤8660V ⇒ clase sustractiva de fábrica'}.`},
    {t:`Polaridad ${st.detected==='sustractiva'?'ADITIVA':'SUSTRACTIVA'} — V medida ${st.detected==='sustractiva'?'>':'<'} V aplicada.`, ok:false,
      why:`Invierte el criterio: V medida=${st.Vmeas.toFixed(2)} V es ${st.detected==='sustractiva'?'MENOR':'MAYOR'} que V aplicada=${c.Vap.toFixed(2)} V, justo lo contrario de lo que afirma esta opción.`},
    {t:'No se puede determinar la polaridad sin ver la disposición física de las terminales H1/X1 en la carcasa.', ok:false,
      why:'La comparación de tensiones (V medida frente a V aplicada) es, por sí sola, el procedimiento normativo de la prueba de polaridad de 4 terminales — no requiere inspeccionar la disposición física de las terminales.'},
    {t:'La polaridad no importa para la operación del transformador mientras la relación de vueltas sea correcta.', ok:false,
      why:'La polaridad es crítica al conectar transformadores en paralelo, en bancos trifásicos o en instrumentos de medición (TP/TC): unir en paralelo dos unidades de polaridad opuesta produce, en esencia, un cortocircuito entre sus devanados secundarios.'},
  ];
  return {pregunta, opciones:shuffle(opciones)};
}
function currentQuiz(){
  return CASES[caseKey].tipo==='ratio' ? ratioQuizText(caseKey) : polarityQuizText(caseKey);
}

/* ============================================================
   ESCENA 3D — banco de pruebas (fuente + transformador + voltímetros)
   ============================================================ */
const bench=roundedBox(6.0,0.5,2.2,MAT.bench,0.06); bench.position.set(0,0.25,0); scene.add(bench);
bench.userData={title:'Banco de pruebas',info:'Estación de prueba de relación y polaridad de transformadores con tensión reducida.'};

// --- fuente de tensión reducida (variac) ---
const variac=new THREE.Group(); variac.position.set(-2.3,0.5,0); scene.add(variac);
const variacBody=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.34,0.5,24),MAT.variac));
variacBody.position.set(0,0.25,0); variac.add(variacBody);
variacBody.userData={title:'Fuente de CA de tensión reducida (variac)',info:'Suministra la tensión de prueba reducida Vap aplicada a las terminales H1-H2 — la magnitud es una elección pedagógica de seguridad, no un porcentaje normativo fijo.'};
const variacKnob=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,0.09,16),MAT.knob));
variacKnob.position.set(0,0.54,0); variac.add(variacKnob);
const term1=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.12,10),MAT.cap));
term1.position.set(-0.16,0.56,0.14); variac.add(term1);
const term2=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.12,10),MAT.cap));
term2.position.set(0.16,0.56,0.14); variac.add(term2);
const variacLabel=labelSprite('Fuente CA · tensión reducida','#8FB3AC'); variacLabel.position.set(-2.3,1.05,0.1);
variacLabel.visible=false; variacLabel.raycast=()=>{}; scene.add(variacLabel); HOVER_LABELS.set(variacBody,variacLabel);

// --- transformador bajo prueba (tanque + bujes H1/H2/X1/X2) ---
const xfmr=new THREE.Group(); xfmr.position.set(0,0,0); scene.add(xfmr);
const tank=roundedBox(1.3,0.7,0.9,MAT.tank,0.05); tank.position.set(0,0.85,0); xfmr.add(tank);
tank.userData={title:'Transformador bajo prueba',info:'Tanque del transformador monofásico. Terminales H1/H2 = alta tensión (AT); X1/X2 = baja tensión (BT).'};

function makeBushing(x,z,mat,label,info){
  const g=new THREE.Group(); g.position.set(x,1.20,z);
  const post=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.22,14),mat)); post.position.set(0,0.11,0); g.add(post);
  const cap=sh(new THREE.Mesh(new THREE.SphereGeometry(0.055,12,10),MAT.cap)); cap.position.set(0,0.23,0); g.add(cap);
  post.userData={title:label,info}; cap.userData=post.userData;
  const lb=labelSprite(label,'#EAF4F1'); lb.position.set(x,1.62,z); lb.visible=false; lb.raycast=()=>{};
  xfmr.add(lb); HOVER_LABELS.set(post,lb); HOVER_LABELS.set(cap,lb);
  return g;
}
const H1=makeBushing(-0.32,0.22,MAT.bushHV,'H1','Terminal de alta tensión H1 — junto con H2, recibe la tensión de prueba reducida durante ambos ensayos.');
const H2=makeBushing( 0.32,0.22,MAT.bushHV,'H2','Terminal de alta tensión H2.');
const X1=makeBushing(-0.32,-0.22,MAT.bushLV,'X1','Terminal de baja tensión X1 — en la prueba de polaridad, se puentea directamente a H1.');
const X2=makeBushing( 0.32,-0.22,MAT.bushLV,'X2','Terminal de baja tensión X2.');
xfmr.add(H1,H2,X1,X2);
const topOf=g=>new THREE.Vector3(g.position.x,1.42,g.position.z);

// --- placa de datos (canvas) ---
const plateCanvas=document.createElement('canvas'); plateCanvas.width=420; plateCanvas.height=260;
const plateTex=new THREE.CanvasTexture(plateCanvas); plateTex.colorSpace=THREE.SRGBColorSpace; plateTex.minFilter=THREE.LinearFilter; plateTex.generateMipmaps=false;
const plateScreen=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.5), new THREE.MeshBasicMaterial({map:plateTex,toneMapped:false}));
plateScreen.position.set(0,0.85,0.461); xfmr.add(plateScreen);
plateScreen.userData={title:'Placa de datos',info:'Especificaciones nominales de fábrica de esta unidad — la prueba existe para verificarlas con una medición real.'};
const plateLabel=labelSprite('Placa de datos','#C9A227'); plateLabel.position.set(0,1.15,0.5);
plateLabel.visible=false; plateLabel.raycast=()=>{}; xfmr.add(plateLabel); HOVER_LABELS.set(plateScreen,plateLabel);

// --- puente de polaridad (H1↔X1, visible solo en casos de polaridad) ---
function tubeBetween(a,b,mat,r,sag){
  sag=sag===undefined?0.16:sag;
  const mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(0.5); mid.y+=sag;
  const curve=new THREE.CatmullRomCurve3([a.clone(),mid,b.clone()]);
  const geo=new THREE.TubeGeometry(curve,20,r,8,false);
  return sh(new THREE.Mesh(geo,mat));
}
const jumper=tubeBetween(topOf(H1),topOf(X1),MAT.jumper,0.024);
jumper.userData={title:'Puente de polaridad',info:'Conecta H1 con X1 durante la prueba de polaridad — con la BT en circuito abierto (prueba de relación) este puente NO se instala.'};
scene.add(jumper);

// --- cables fijos: variac → H1/H2 ---
scene.add(tubeBetween(new THREE.Vector3(-2.14,1.06,0.14),topOf(H1),MAT.wireHV,0.02));
scene.add(tubeBetween(new THREE.Vector3(-2.46,1.06,0.14),topOf(H2),MAT.wireHV,0.02));

// --- voltímetros (canvas, tipo aguja) ---
function makeGauge(x,z,label,color){
  const bezel=roundedBox(0.62,0.5,0.06,MAT.bezel,0.03); bezel.position.set(x,1.5,z); scene.add(bezel);
  const canvas=document.createElement('canvas'); canvas.width=300; canvas.height=240;
  const tex=new THREE.CanvasTexture(canvas); tex.colorSpace=THREE.SRGBColorSpace; tex.minFilter=THREE.LinearFilter; tex.generateMipmaps=false;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(0.56,0.44), new THREE.MeshBasicMaterial({map:tex,toneMapped:false}));
  screen.position.set(x,1.5,z+0.031); scene.add(screen);
  screen.userData={title:label,info:'Voltímetro analógico de banco.'};
  const lb=labelSprite(label,color); lb.position.set(x,1.78,z+0.05); lb.visible=false; lb.raycast=()=>{};
  scene.add(lb); HOVER_LABELS.set(screen,lb);
  function draw(value,maxV){
    const c=canvas.getContext('2d');
    c.fillStyle='#0a1512'; c.fillRect(0,0,300,240);
    c.strokeStyle='rgba(79,209,197,.35)'; c.lineWidth=3; c.strokeRect(3,3,294,234);
    c.fillStyle=color; c.font='bold 13px Outfit, sans-serif'; c.textAlign='center'; c.fillText(label,150,22);
    const cx=150, cy=172, rad=112;
    c.strokeStyle='#5b8a80'; c.lineWidth=2; c.beginPath(); c.arc(cx,cy,rad,Math.PI,2*Math.PI); c.stroke();
    for(let i=0;i<=10;i++){
      const a=Math.PI+(i/10)*Math.PI;
      const x1=cx+Math.cos(a)*rad, y1=cy+Math.sin(a)*rad, x2=cx+Math.cos(a)*(rad-10), y2=cy+Math.sin(a)*(rad-10);
      c.strokeStyle='#5b8a80'; c.lineWidth=2; c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke();
    }
    const frac=Math.max(0,Math.min(1,value/maxV));
    const na=Math.PI+frac*Math.PI;
    c.strokeStyle='#FFD166'; c.lineWidth=3;
    c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(na)*(rad-16), cy+Math.sin(na)*(rad-16)); c.stroke();
    c.fillStyle='#FFD166'; c.beginPath(); c.arc(cx,cy,5,0,7); c.fill();
    c.fillStyle='#EAF4F1'; c.font='bold 22px Outfit, sans-serif'; c.textAlign='center';
    c.fillText(value.toFixed(2)+' V',150,214);
    tex.needsUpdate=true;
  }
  draw(0,150);
  return {draw};
}
const gaugeAp=makeGauge(-2.3,0.62,'Vap · aplicada','#8FB3AC');
const gaugeMeas=makeGauge(2.3,0.62,'V · medida','#4FD1C5');

// --- probeta de medición (leads reconstruidos por caso) ---
const measGroup=new THREE.Group(); scene.add(measGroup);
function rebuildMeasLeads(){
  while(measGroup.children.length) measGroup.remove(measGroup.children[0]);
  const c=CASES[caseKey];
  const anchor=new THREE.Vector3(2.14,1.06,0.14);
  if(c.tipo==='ratio'){
    measGroup.add(tubeBetween(anchor,topOf(X1),MAT.wireLV,0.02));
    measGroup.add(tubeBetween(new THREE.Vector3(2.46,1.06,0.14),topOf(X2),MAT.wireLV,0.02));
  }else{
    measGroup.add(tubeBetween(anchor,topOf(H2),MAT.wireHV,0.02));
    measGroup.add(tubeBetween(new THREE.Vector3(2.46,1.06,0.14),topOf(X2),MAT.wireLV,0.02));
  }
}

S.start();

/* ============================================================
   HUD (izquierda)
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Transformadores (D5) · Metrología eléctrica</div>
  <h2>Relación de Transformación y Prueba de Polaridad</h2>
  <p>Un transformador declara en su placa una relación de vueltas <b>nominal</b> — solo una prueba real, con tensión reducida y un voltímetro, confirma si el devanado la cumple. La misma disposición de cuatro terminales resuelve además una pregunta distinta y crítica antes de operar en paralelo o en banco trifásico: ¿la polaridad es <b>aditiva</b> o <b>sustractiva</b>?</p>
  <div class="formula">a = N1/N2 = V1/V2 (relación en vacío)<br>V medida = Vap·(1 ∓ N_BT/N_AT) — "−" sustractiva, "+" aditiva</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#B33A2E"></span>Terminales H1/H2 · Alta tensión (AT)</div>
    <div class="li"><span class="dot" style="background:#2E6DB3"></span>Terminales X1/X2 · Baja tensión (BT)</div>
    <div class="li"><span class="dot" style="background:#C9A227"></span>Puente de polaridad · conecta H1 con X1</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la relación de transformación en vacío a=N1/N2=V1/V2 y su criterio de tolerancia de ±0.5% de la relación especificada (IEC 60076-1, Cláusula 10, Tabla 1, ítem 2); el procedimiento de 4 terminales de la prueba de polaridad (puente H1-X1, tensión reducida en H1-H2, lectura en H2-X2) con su fórmula V=Vap(1∓N_BT/N_AT); la clasificación de fábrica aditiva/sustractiva de ANSI/IEEE C57.12.00 cláusula 5.7.1 (kVA≤200 Y AT≤8660V ⇒ aditiva; en cualquier otro caso, sustractiva) aplicada consistentemente a dos unidades de ejemplo.</div>
    <div class="fl no"><b>NO modela:</b> el criterio alterno de tolerancia de la IEC 60076-1 (±1/10 de la impedancia de cortocircuito real, que requiere %Z — se calcula en la práctica de circuito equivalente); la disposición física real de las terminales H1/X1 en la carcasa (mismo lado o diagonal) — la polaridad se determina aquí exclusivamente por la comparación de tensiones, como exige el procedimiento normativo, sin depender de esa geometría; un porcentaje normativo fijo para la "tensión reducida" de prueba (es una elección pedagógica de seguridad, distinta por caso); ni la equivalencia de la norma mexicana NMX-J-116/169 con IEC o ANSI (ANCE la declara NO equivalente).</div>
  </div>
  <div class="src">Ref: IEC 60076-1, Cláusulas 10 y 11.3 · ANSI/IEEE C57.12.00, Cláusula 5.7.1 · CFE K0000-04</div>`;

/* ============================================================
   PANEL (derecha)
   ============================================================ */
document.getElementById('panel').innerHTML=`
  <h4>Banco de pruebas · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span></h4>
  <div class="modebar" id="casebar">
    <button class="b on" id="c_ratioSano">Caso 1</button>
    <button class="b" id="c_ratioFalla">Caso 2</button>
    <button class="b" id="c_polAditiva">Caso 3</button>
    <button class="b" id="c_polSustractiva">Caso 4</button>
  </div>
  <div id="tele">
    <div class="g"><div class="gl"><span>Tensión aplicada (Vap)</span><b id="t_ap">—</b></div></div>
    <div class="g"><div class="gl"><span>Tensión medida</span><b id="t_meas">—</b></div></div>
    <div class="g"><div class="gl"><span>Relación nominal (a)</span><b id="t_a">—</b></div></div>
    <div class="g"><div class="gl"><span>Unidad</span><b id="t_case">—</b></div></div>
    <div class="g"><div class="gl"><span>Resultado</span><b id="t_est">—</b></div></div>
  </div>
  <div class="console" id="report">Energiza el banco (⚡) para aplicar tensión reducida y leer los voltímetros.</div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Medición automática (guiada)</button>
    <button class="b primary" id="btnPower">⚡ Energizar banco</button>
    <button class="b" id="btnNew">🔀 Nuevo caso</button>
  </div>`;

const el=id=>document.getElementById(id);

/* ---------- placa, telemetría e informe ---------- */
function drawPlate(key){
  const c=CASES[key];
  const cx=plateCanvas.getContext('2d');
  cx.fillStyle='#0f171b'; cx.fillRect(0,0,420,260);
  cx.strokeStyle='rgba(201,162,39,.5)'; cx.lineWidth=3; cx.strokeRect(4,4,412,252);
  cx.fillStyle='#C9A227'; cx.font='bold 20px Outfit, sans-serif'; cx.textAlign='center';
  cx.fillText('PLACA DE DATOS',210,32);
  cx.textAlign='left'; cx.font='15px Outfit, sans-serif';
  const rows=[
    ['Unidad', c.unidad],
    ['Potencia nominal', c.kva+' kVA'],
    ['Tensión AT (V1n)', c.v1n+' V'],
    ['Tensión BT (V2n)', c.v2n+' V'],
    ['Relación nominal a=N1/N2', c.aNameplate.toFixed(4)],
    ['Terminales', 'H1 H2 (AT) · X1 X2 (BT)'],
  ];
  rows.forEach((r,i)=>{
    const y=68+i*32;
    cx.fillStyle='#8FB3AC'; cx.fillText(r[0]+':',24,y);
    cx.fillStyle='#EAF4F1'; cx.fillText(String(r[1]),210,y);
  });
  plateTex.needsUpdate=true;
}
function updateTele(){
  const c=CASES[caseKey];
  const set=(id,txt,cls)=>{ const b=el(id); b.textContent=txt; b.className=cls||''; };
  set('t_ap', active? c.Vap.toFixed(2)+' V':'—', active?'good':'');
  let measNow=null;
  if(active) measNow = c.tipo==='ratio' ? c.V2meas : polarityStats(caseKey).Vmeas;
  set('t_meas', measNow!==null? measNow.toFixed(2)+' V':'—', active?'good':'');
  set('t_a', c.aNameplate.toFixed(4), '');
  set('t_case', c.unidad, '');
  if(!active){
    set('t_est','Banco apagado','warn');
  }else if(!solved){
    set('t_est','Calcula con Vap y V medida ↓','warn');
  }else if(c.tipo==='ratio'){
    const st=ratioStats(caseKey);
    set('t_est', st.pass?'CUMPLE tolerancia (±0.5%)':'NO CUMPLE tolerancia', st.pass?'good':'bad');
  }else{
    const st=polarityStats(caseKey);
    set('t_est', 'Polaridad '+st.detected.toUpperCase(), 'good');
  }
}
function updateReport(){
  const c=CASES[caseKey]; let html='';
  if(!active){
    html='<span class="mono">Banco apagado. Pulsa "Energizar banco" para aplicar la tensión reducida y leer los voltímetros.</span>';
  }else if(c.tipo==='ratio'){
    html=`<b>${c.mision}</b><br><span class="mono">Vap = ${c.Vap.toFixed(2)} V · V2 medida = ${c.V2meas.toFixed(2)} V (nominal a = ${c.aNameplate.toFixed(4)})</span>`;
    if(solved){
      const st=ratioStats(caseKey);
      html+=`<br><span class="mono">a medida = Vap/V2 = ${st.aMeasured.toFixed(4)}<br>Desviación = ${st.devPct.toFixed(2)}% → ${st.pass?'CUMPLE':'NO CUMPLE'} ±0.5% (IEC 60076-1, Cl. 10)</span>`;
    }
  }else{
    const aInv=1/c.aNameplate; const st0=polarityStats(caseKey);
    html=`<b>${c.mision}</b><br><span class="mono">Vap = ${c.Vap.toFixed(2)} V (H1-H2, con H1↔X1 puenteado)<br>V medida (H2-X2) = ${st0.Vmeas.toFixed(2)} V<br>N_BT/N_AT = 1/a = ${aInv.toFixed(5)}</span>`;
    if(solved){
      html+=`<br><span class="mono">V medida ${st0.detected==='sustractiva'?'<':'>'} V aplicada ⇒ polaridad <b>${st0.detected.toUpperCase()}</b></span>`;
    }
  }
  el('report').innerHTML=html;
}
function refreshAll(){ drawPlate(caseKey); updateTele(); updateReport(); }

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
  if(!active){ showToast('Primero energiza el banco.'); return; }
  const q=currentQuiz(); const o=q.opciones[i]; clearDx();
  const btn=el('dxbtns').children[i];
  if(o.ok){
    btn.classList.add('right'); solved=true; synth.beep(1046,0.12,0.06);
    updateTele(); updateReport();
    showToast(`<span style="color:var(--good)">✔ Correcto.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }else{
    btn.classList.add('wrong'); synth.beep(220,0.15,0.06);
    showToast(`<span style="color:var(--bad)">✗ Revisa el cálculo.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }
}
function setCase(key){
  caseKey=key; active=false;
  jumper.visible = CASES[key].tipo==='polaridad';
  rebuildMeasLeads();
  ['ratioSano','ratioFalla','polAditiva','polSustractiva'].forEach(k=>el('c_'+k).classList.toggle('on',k===key));
  el('btnPower').classList.remove('on'); el('btnPower').textContent='⚡ Energizar banco';
  apTarget=0; measTarget=0;
  solved=false; clearDx(); refreshQuestion(); refreshCaseLabel();
  const meta=CASE_CAM[key]; S.moveTo(meta[0],meta[1],1.3);
  refreshAll();
  showToast('🔀 '+CASES[key].nombre+' — '+CASES[key].unidad);
}
el('c_ratioSano').onclick=()=>setCase('ratioSano');
el('c_ratioFalla').onclick=()=>setCase('ratioFalla');
el('c_polAditiva').onclick=()=>setCase('polAditiva');
el('c_polSustractiva').onclick=()=>setCase('polSustractiva');
el('btnNew').onclick=()=>{ setCase(CASE_ORDER[(CASE_ORDER.indexOf(caseKey)+1)%CASE_ORDER.length]); };

el('btnPower').onclick=e=>{
  active=!active;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',active);
  e.target.textContent=active?'⚡ Apagar banco':'⚡ Energizar banco';
  const c=CASES[caseKey];
  apTarget = active? c.Vap : 0;
  measTarget = active? (c.tipo==='ratio'? c.V2meas : polarityStats(caseKey).Vmeas) : 0;
  if(active){ S.setCinematicIdle(true); synth.beep(880,0.1,0.06); } else S.setCinematicIdle(false);
  refreshAll();
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
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Prueba guiada en curso…';
  const lockedBtns=[el('btnNew'), ...CASE_ORDER.map(k=>el('c_'+k))];
  lockedBtns.forEach(b=>{ b.disabled=true; });
  try{
    clearDx();
    const c=CASES[caseKey];
    if(c.tipo==='polaridad'){ showToast('Paso 1 · Puenteamos H1 con X1 (visible en la escena).'); await sleep(1400); }
    else { showToast('Paso 1 · Dejamos X1-X2 en circuito abierto (sin puente).'); await sleep(1400); }
    if(!active){ showToast('Paso 2 · Energizamos el banco con tensión reducida.'); el('btnPower').click(); await sleep(1600); }
    if(c.tipo==='ratio'){
      const st=ratioStats(caseKey);
      showToast(`Paso 3 · Leemos Vap=${c.Vap.toFixed(2)} V y V2=${c.V2meas.toFixed(2)} V.`); await sleep(1800);
      showToast(`Paso 4 · a medida = Vap/V2 = ${st.aMeasured.toFixed(4)} → desviación ${st.devPct.toFixed(2)}%.`); await sleep(2000);
    }else{
      const st=polarityStats(caseKey);
      showToast(`Paso 3 · Leemos Vap=${c.Vap.toFixed(2)} V y V medida (H2-X2)=${st.Vmeas.toFixed(2)} V.`); await sleep(1800);
      showToast(`Paso 4 · V medida ${st.detected==='sustractiva'?'<':'>'} V aplicada ⇒ polaridad ${st.detected.toUpperCase()}.`); await sleep(2000);
    }
    const q=currentQuiz(); const i=q.opciones.findIndex(o=>o.ok);
    clearDx();
    const dxBtn=el('dxbtns').children[i];
    if(dxBtn){ dxBtn.classList.add('right'); solved=true; synth.beep(1046,0.12,0.06); updateTele(); updateReport(); }
    showToast('<span style="color:var(--good)">✔ '+q.opciones[i].t+'</span><br><span style="color:var(--dim);font-size:11px">'+q.opciones[i].why+'</span>');
  } finally {
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    lockedBtns.forEach(b=>{ b.disabled=false; });
    autoRunning=false;
  }
}
el('btnAuto').onclick=runAuto;

/* ---------- lazo de animación ---------- */
let lastDraw=0;
S.setAnimate((dt,time)=>{
  simT=time;
  apVal += (apTarget-apVal)*Math.min(1,dt*4);
  measVal += (measTarget-measVal)*Math.min(1,dt*4);
  const c=CASES[caseKey];
  variacKnob.rotation.y = (apTarget>0 ? apVal/c.scaleAp : 0) * Math.PI*1.4;
  if(time-lastDraw>0.08){
    gaugeAp.draw(apVal,c.scaleAp);
    gaugeMeas.draw(measVal,c.scaleMeas);
    lastDraw=time;
  }
});

setCase('ratioSano');
