/* ============================================================
   LAB — MICRÓMETRO Y COMPARADOR DE CARÁTULA: RESOLUCIÓN 0.01 mm,
   RUNOUT Y PLANITUD
   (Dominio D10 · instrumentación general — molde E+P: ensamble 3D +
   panel-instrumento)
   Normatividad de referencia:
     · ASME B89.1.13-2013 (R2022) "Micrometers" — norma ancla de diseño y
       exactitud de micrómetros.
     · ISO 3611:2023 — especificación y verificación metrológica de
       micrómetros de exteriores.
     · ASME B89.1.10M "Dial Indicators" (2001, R2016/R2021) e
       ISO 463:2006 (+2 corrigenda) — comparadores de carátula.
     · ASME Y14.5-2018 / ISO 1101 — definición de runout (TIR) en GD&T.
     · ISO 2768-2 — clases de tolerancia general (H, K) usadas para
       contrastar la planitud medida.
   Modelo de ingeniería (didáctico):
     · Lectura del micrómetro de 3 términos: mm enteros del manguito +
       [0.5 mm si la línea media está descubierta] + división del tambor
       × 0.01 mm (50 divisiones × 0.01 mm = 0.5 mm/vuelta, paso de rosca
       0.5 mm/vuelta).
     · Corrección por error de indicación: igual mecánica aritmética que
       el error de cero del calibrador vernier (mismo lab D10), citada
       aquí por PARIDAD PEDAGÓGICA — el procedimiento real de puesta a
       cero de un micrómetro es MECÁNICO (llave/pin de ajuste del
       manguito), no una resta por lectura; se declara explícitamente en
       el contrato de fidelidad.
     · Trinquete vs. tornillo de fijación: dos mecanismos reales y bien
       documentados, tratados aquí como distinción CONCEPTUAL (qué hace
       cada uno) — la magnitud exacta del error por NO usar el trinquete
       no está documentada con respaldo suficiente para simularla como
       cifra, así que deliberadamente no se inventa ningún número para
       ese caso.
     · Runout (TIR) = máx − mín de 6 lecturas angulares (0°..300°, paso
       60°) SIN dividir entre 2 — el valor toleroado en GD&T es el TIR
       completo; la excentricidad (TIR/2) es una magnitud DERIVADA para
       otros fines (alineación, balanceo), no la que se compara contra
       la tolerancia de runout.
     · Planitud = máx − mín entre 5 puntos muestreados (4 esquinas +
       centro), método de taller con indicador + placa de referencia.
       Se contrasta el mismo dato contra dos clases de tolerancia
       (ISO 2768-2 H y K) para mostrar que la clase elegida en el plano
       importa tanto como la medición.
     · Todos los valores "verdaderos" y de lecturas son constantes fijas
       elegidas a mano (mismo patrón que calibrador-vernier.body.js):
       CERO Math.random() en la física del lab.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.5,3.0,5.5],target:[0,1.0,0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:16});
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
  base:     std({...brush, color:0x23272b, metalness:0.70, roughness:0.40}),
  ejeA:     std({...alu, color:0x8a949c, metalness:0.35, roughness:0.55}),
  ejeB:     std({...alu, color:0xC9A227, metalness:0.45, roughness:0.50}),
  ejeC:     std({...alu, color:0x6fae9c, metalness:0.35, roughness:0.55}),
  plate:    std({...alu, color:0x9aa3a8, metalness:0.30, roughness:0.55}),
  bezel:    std({color:0x0b0f12, roughness:0.4}),
  marker:   std({color:0xffd166, roughness:0.35, emissive:0x553300, emissiveIntensity:0.35}),
  markerOff:std({color:0x5b8a80, roughness:0.6}),
  stripe:   std({color:0xff6b6b, roughness:0.4}),
};

/* ---------- estado ---------- */
let instKey='mic';        // 'mic' | 'comp'
let caseKey='ejeA';        // caso activo dentro del instrumento actual
let contact=false;         // husillo cerrado (mic) / comparador fijado (comp)
let idx=0;                 // índice de punto/ángulo activo (solo comp)
let solved=false; let simT=0;
/* Contabilidad del reto. `solved` es el estado del caso que se ve; `answered`
   recuerda cada caso. Tres fallos seguidos en un caso lo resiembran. */
const answered={ejeA:false,ejeB:false,trinquete:false,runout:false,planitud:false};
const fallosCaso={ejeA:0,ejeB:0,trinquete:0,runout:0,planitud:0};
const RETO={intentos:0,resiembras:0};
let quizNow={pregunta:'',opciones:[]};
let autoRunning=false;
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:900,Q:1});

const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}
const HOVER_LABELS=new Map();

/* ============================================================
   MODELO — MICRÓMETRO (resolución fija 0.01 mm)
   ============================================================ */
const SCALE=1/40;               // 1 unidad tres.js = 40 mm reales
const LC_MIC=0.01;
const ANVIL_TIP_Y=1.30;         // y local del tope del yunque (fijo)
const ARM_X=0.85;               // x local del eje yunque-husillo
const THIMBLE_Y=0.55;           // y local FIJO del tambor/trinquete
const ROD_BASE_Y=THIMBLE_Y+0.14;// y local desde donde "emerge" el husillo
const PARK_MM=22;               // apertura de reposo (husillo abierto)

function quantize(v,lc){ return Math.round(v/lc)*lc; }
function decomposeMic(mm){
  let whole=Math.floor(mm+1e-9);
  let frac=mm-whole;
  let halfMark=frac>=0.5-1e-9;
  let rem=halfMark?frac-0.5:frac;
  let thimbleDiv=Math.round(rem/0.01);
  if(thimbleDiv>=50){ thimbleDiv-=50; if(halfMark){ halfMark=false; whole+=1; } else halfMark=true; }
  return {whole,halfMark,thimbleDiv};
}
const CASES_MIC={
  ejeA:{
    nombre:'Eje A · rectificado, Ø por medir', pieza:'Eje cilíndrico rectificado',
    trueDim:11.98, zeroErrorRaw:0,
    mision:'Caso 1 · Mide el diámetro del Eje A con el micrómetro (resolución 0.01 mm). Lee el manguito (mm y línea de 0.5 mm) y el tambor (centésimas) para formar la lectura de 3 términos.',
  },
  ejeB:{
    nombre:'Eje B · rectificado, con error de indicación', pieza:'Eje cilíndrico rectificado',
    trueDim:19.97, zeroErrorRaw:0.02,
    mision:'Caso 2 · Mide el diámetro del Eje B. Este micrómetro tiene un pequeño error de indicación (se informa abajo): corrígelo con signo, igual que en el calibrador.',
  },
  trinquete:{
    nombre:'Eje A · trinquete vs. tornillo de fijación', pieza:'Mismo eje rectificado',
    trueDim:11.98, zeroErrorRaw:0,
    mision:'Caso 3 · Identifica qué mecanismo del micrómetro estandariza la fuerza de medición (trinquete) y cuál solo bloquea el husillo en su posición (tornillo de fijación).',
  },
};
const CASE_ORDER_MIC=['ejeA','ejeB','trinquete'];

function caseReadingMic(key){
  const c=CASES_MIC[key];
  const zeroErrorQ=quantize(c.zeroErrorRaw,LC_MIC);
  const rawQ=quantize(c.trueDim+c.zeroErrorRaw,LC_MIC);
  const correctedQ=+(rawQ-zeroErrorQ).toFixed(6);
  return {zeroErrorQ,rawQ,correctedQ};
}

/* ============================================================
   MODELO — COMPARADOR DE CARÁTULA (0.01 mm/división, ±0.5 mm)
   ============================================================ */
const CASES_COMP={
  runout:{
    nombre:'Runout (TIR) · eje entre puntos', pieza:'Eje montado entre centros, palpador fijo',
    angles:[0,60,120,180,240,300], readings:[0.00,0.01,0.04,0.05,0.02,0.00], tolerancia:0.02,
    mision:'Caso 1 · Gira el eje en pasos de 60° y registra la lectura del comparador (desviación relativa) en cada posición. Calcula el TIR = máx − mín (sin dividir entre 2) y compáralo contra la tolerancia.',
  },
  planitud:{
    nombre:'Planitud · placa de referencia', pieza:'Placa rectificada, 5 puntos (4 esquinas + centro)',
    puntos:['Esquina 1','Esquina 2','Esquina 3','Esquina 4','Centro'], readings:[0.000,0.015,0.045,0.010,0.030],
    tolH:0.02, tolK:0.05,
    mision:'Caso 2 · Recorre los 5 puntos de la placa con el comparador (montado en un soporte fijo) y calcula la planitud = máx − mín entre todos los puntos.',
  },
};
const CASE_ORDER_COMP=['runout','planitud'];
/* ---------- SIEMBRA de los casos ----------
   Los diámetros, el error de indicación y las lecturas del comparador se
   sortean al abrir el lab y otra vez tras tres fallos en un mismo caso. La
   demostración guiada usa cifras FIJAS (DEMO) que nunca son las del alumno. */
const pick=a=>a[Math.floor(Math.random()*a.length)];
const rnd=(lo,hi,st=0.01)=>+(lo+Math.round(Math.random()*(hi-lo)/st)*st).toFixed(3);
const shuffled=a=>{ const b=a.slice(); for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; };
const DEMO={
  ejeA:{trueDim:14.37,zeroErrorRaw:0},
  ejeB:{trueDim:21.83,zeroErrorRaw:0.03},
  runout:{readings:[0.00,0.02,0.05,0.06,0.03,0.01],tolerancia:0.05},
  planitud:{readings:[0.010,0.040,0.020,0.065,0.030]},
};
function seedCase(key){
  if(key==='ejeA'){
    const c=CASES_MIC.ejeA;
    do{ c.trueDim=rnd(8,16); }while(Math.abs(c.trueDim-DEMO.ejeA.trueDim)<0.3);
    c.zeroErrorRaw=0;
  } else if(key==='ejeB'){
    const c=CASES_MIC.ejeB;
    do{ c.trueDim=rnd(17,24.5); }while(Math.abs(c.trueDim-DEMO.ejeB.trueDim)<0.3);
    c.zeroErrorRaw=pick([0.02,0.03,0.04,-0.02,-0.03]);
  } else if(key==='runout'){
    const c=CASES_COMP.runout; let r,tol,tir;
    do{
      const A=pick([0.02,0.03,0.04,0.05,0.06,0.08]), ph=Math.random()*Math.PI*2;
      const raw=c.angles.map(a=>A/2*Math.sin(a*Math.PI/180+ph)+(Math.random()-0.5)*0.008);
      r=raw.map(v=>+(Math.round((v-raw[0])/0.01)*0.01).toFixed(2)+0);
      tol=pick([0.02,0.03,0.05]);
      tir=+(Math.max(...r)-Math.min(...r)).toFixed(2);
    }while(tir<0.02||Math.abs(tir-tol)<0.01||JSON.stringify(r)===JSON.stringify(DEMO.runout.readings));
    c.readings=r; c.tolerancia=tol;
  } else if(key==='planitud'){
    const c=CASES_COMP.planitud; let r;
    do{
      const fl=pick([0.010,0.015,0.025,0.030,0.035,0.040,0.045,0.055,0.060,0.070]);
      const off=pick([0,-0.010,0.010,-0.020]);
      const n=c.puntos.length, iMin=Math.floor(Math.random()*n); let iMax;
      do{ iMax=Math.floor(Math.random()*n); }while(iMax===iMin);
      r=c.puntos.map((_,i)=> i===iMin?0 : i===iMax?fl : Math.round(Math.random()*fl/0.005)*0.005);
      r=r.map(v=>+(v+off).toFixed(3));
    }while(JSON.stringify(r)===JSON.stringify(DEMO.planitud.readings));
    c.readings=r;
  }
}
['ejeA','ejeB','runout','planitud'].forEach(seedCase);

const CASE_ORDER={mic:CASE_ORDER_MIC, comp:CASE_ORDER_COMP};
const CASE_LABEL={ejeA:'Eje A', ejeB:'Eje B (con error)', trinquete:'Trinquete', runout:'Runout (TIR)', planitud:'Planitud'};
const CASE_CAM={
  mic:{
    ejeA:      [[0.6,2.3,3.2],[-1.0,1.55,0.05]],
    ejeB:      [[0.6,2.3,3.2],[-1.0,1.55,0.05]],
    trinquete: [[0.3,1.6,2.4],[-0.9,0.65,0.05]],
  },
  comp:{
    runout:    [[3.5,1.6,2.6],[2.25,0.55,0]],
    planitud:  [[3.5,1.9,2.9],[2.25,0.45,0.05]],
  },
};

function runoutStats(){
  const c=CASES_COMP.runout;
  const max=Math.max(...c.readings), min=Math.min(...c.readings);
  const tir=+(max-min).toFixed(3), ecc=+(tir/2).toFixed(4);
  return {readings:c.readings, angles:c.angles, tir, ecc, tolerancia:c.tolerancia, rechaza: tir>c.tolerancia};
}
function planitudStats(){
  const c=CASES_COMP.planitud;
  const max=Math.max(...c.readings), min=Math.min(...c.readings);
  const flat=+(max-min).toFixed(3);
  return {readings:c.readings, puntos:c.puntos, flat, tolH:c.tolH, tolK:c.tolK, rechazaH: flat>c.tolH, pasaK: flat<=c.tolK};
}
function currentRawMM(){
  if(instKey==='mic'){ return caseReadingMic(caseKey).rawQ; }
  const arr = caseKey==='runout' ? CASES_COMP.runout.readings : CASES_COMP.planitud.readings;
  return arr[idx];
}

/* ---------- generador de preguntas (banco de distractores) ----------
   Cada caso tiene UNA opción correcta y un banco de distractores. Al
   presentar la pregunta se eligen 3 del banco y se barajan; las cifras de la
   pregunta salen de los datos sembrados del caso, nunca de un texto fijo. Los
   mensajes de error NO dan la cifra ni la opción correcta: solo dicen qué
   revisar. */
const WHY_MAL_LECTURA='Esa cifra no sale de leer las tres escalas del visor y aplicar la corrección del error informado: vuelve a leer cada término.';
const WHY_MAL_RANGO='Ese valor no corresponde a la definición: revisa qué lecturas intervienen y qué operación las convierte en el resultado pedido.';
const f2=v=>v.toFixed(2), f3=v=>v.toFixed(3);

function buildOptionsMic(key){
  const lc=LC_MIC;
  const {rawQ,correctedQ,zeroErrorQ}=caseReadingMic(key);
  const opts=[]; const seen=new Set();
  const add=(val,why,ok=false)=>{ const k=f3(val); if(seen.has(k))return; seen.add(k); opts.push({t:f3(val)+' mm',ok,why}); };
  add(correctedQ,'Es la lectura del micrómetro (manguito + línea de 0.5 mm + tambor × 0.01) corregida con el signo del error de indicación del instrumento: el valor que se reporta.',true);
  if(Math.abs(zeroErrorQ)>1e-9){ add(rawQ,WHY_MAL_LECTURA); add(+(rawQ+zeroErrorQ).toFixed(3),WHY_MAL_LECTURA); }
  [0.5,-0.5,lc,-lc,2*lc,-2*lc].forEach(d=>add(+(correctedQ+d).toFixed(3),WHY_MAL_LECTURA));
  return opts;
}
function micQuizText(key){
  const c=CASES_MIC[key]; const {zeroErrorQ}=caseReadingMic(key);
  const pregunta=`${c.mision}<br>Error de indicación de este micrómetro: <b>${zeroErrorQ>=0?'+':''}${f3(zeroErrorQ)} mm</b>. Lee el visor (manguito+tambor) y elige la <b>lectura corregida</b>.`;
  return {pregunta, opciones:buildOptionsMic(key)};
}
function trinqueteQuizText(){
  const pregunta='Caso 3 · En el husillo del micrómetro hay DOS mecanismos que se ven parecidos: el trinquete (al final del tambor) y el tornillo de fijación (en el arco del bastidor). ¿Qué hace cada uno?';
  const W='Contrasta con lo que ves en el modelo: ¿cuál de los dos mecanismos gira sin hacer avanzar el husillo y cuál solo lo bloquea? Piensa en qué pasaría con la lectura.';
  const opciones=[
    {t:'El trinquete desliza en vacío al alcanzar la fuerza de medición del fabricante, de modo que la mano no altera la lectura; el tornillo de fijación solo inmoviliza el husillo para poder leer sin que se mueva.', ok:true, why:'El trinquete (rueda estriada que gira en vacío) estandariza la fuerza de medición y por eso la lectura es repetible entre operadores; el tornillo de fijación solo bloquea el husillo en su posición. La fuerza exacta es dato del fabricante, no de una norma general.'},
    {t:'El tornillo de fijación desliza en vacío al alcanzar la fuerza de medición del fabricante, de modo que la mano no altera la lectura; el trinquete solo inmoviliza el husillo para poder leer sin que se mueva.', ok:false, why:W},
    {t:'Ambos son el mismo mecanismo con dos nombres: una pieza que desliza en vacío al llegar a la fuerza de medición y que además inmoviliza el husillo en su posición para poder leer sin que se mueva.', ok:false, why:W},
    {t:'Ninguno de los dos influye en la lectura: el trinquete es solo una rueda ergonómica para girar con más comodidad y el tornillo de fijación sirve para sujetar el micrómetro al soporte mientras se mide.', ok:false, why:W},
    {t:'El trinquete ajusta el cero del instrumento girando el manguito con una llave; el tornillo de fijación fija la fuerza de medición en el valor elegido antes de cada serie de piezas del mismo lote.', ok:false, why:W},
    {t:'El trinquete se usa solo con piezas blandas y con piezas de acero se gira el tambor directamente; el tornillo de fijación se aprieta siempre antes de medir para que el husillo no se desplace.', ok:false, why:W},
    {t:'El tornillo de fijación se aprieta antes del contacto para que el yunque no se desplace al medir; el trinquete se retira del tambor para que la fuerza dependa de la sensibilidad de quien mide.', ok:false, why:W},
  ];
  return {pregunta, opciones};
}
/* Filas de opciones de los casos del comparador: cada fila es un VALOR (el
   resultado del cálculo) y el veredicto que de él se sigue. Las erróneas se
   descartan si su valor coincide con el correcto. */
const vRun=(v,tol)=> v>tol+1e-9?'RECHAZA':'ACEPTA';
const vPla=(v,h,k)=> v>k+1e-9?'RECHAZA en Clase H y en Clase K': v>h+1e-9?'RECHAZA en Clase H, ACEPTA en Clase K':'ACEPTA en ambas clases';
function runoutQuizText(){
  const st=runoutStats(); const r=st.readings, tol=st.tolerancia;
  const mx=Math.max(...r), mn=Math.min(...r), mean=r.reduce((a,b)=>a+b,0)/r.length;
  const fila=(formula,val,ok,why)=>({t:`${formula} = ${f3(val)} mm; frente a ${f2(tol)} mm → ${vRun(val,tol)}.`,ok,why,_v:val});
  const tir=st.tir;
  const pool=[
    fila(`TIR = máx − mín = ${f2(mx)} − ${f2(mn)}`,tir,true,'TIR = máx − mín de TODA la vuelta, sin dividir entre 2, y se compara contra la tolerancia de runout del dibujo.'),
    fila('TIR = (máx − mín) ÷ 2',tir/2,false,WHY_MAL_RANGO),
    fila('TIR = 2 × (máx − mín)',tir*2,false,WHY_MAL_RANGO),
    fila(`TIR = promedio de las ${r.length} lecturas`,mean,false,WHY_MAL_RANGO),
    fila('TIR = lectura máxima de la vuelta',mx,false,WHY_MAL_RANGO),
  ];
  [[0,5],[0,1],[1,2],[2,4],[0,3]].forEach(([i,j])=>pool.push(fila(`TIR = diferencia entre las lecturas de ${st.angles[i]}° y ${st.angles[j]}°`,Math.abs(r[i]-r[j]),false,WHY_MAL_RANGO)));
  const seen=new Set(); const opciones=[];
  pool.forEach(o=>{ const k=f3(o._v); if(seen.has(k))return; seen.add(k); opciones.push(o); });
  const pregunta=`Girando el eje en pasos de 60° obtuviste estas lecturas del comparador (desviación relativa, mm): ${st.angles.map((a,i)=>a+'°:'+f2(r[i])).join(' · ')}. ¿Cuál es el TIR (Total Indicator Reading) y qué decides frente a la tolerancia de runout del dibujo (${f2(tol)} mm)?`;
  return {pregunta, opciones};
}
function planitudQuizText(){
  const st=planitudStats(); const r=st.readings, h=st.tolH, k=st.tolK;
  const mx=Math.max(...r), mn=Math.min(...r), mean=r.reduce((a,b)=>a+b,0)/r.length;
  const esq=(r[0]+r[1]+r[2]+r[3])/4;
  const fila=(formula,val,ok,why)=>({t:`${formula} = ${f3(val)} mm; ${vPla(val,h,k)}.`,ok,why,_v:val});
  const flat=st.flat;
  const pool=[
    fila(`Planitud = máx − mín = ${f3(mx)} − ${f3(mn)}`,flat,true,'La planitud por el método de taller (indicador + placa de referencia) es el rango máx − mín entre TODOS los puntos muestreados; el mismo dato contra otra clase de tolerancia (ISO 2768-2) puede cambiar la decisión.'),
    fila('Planitud = 2 × (máx − mín)',flat*2,false,WHY_MAL_RANGO),
    fila('Planitud = (máx − mín) ÷ 2',flat/2,false,WHY_MAL_RANGO),
    fila(`Planitud = promedio de los ${r.length} puntos`,Math.abs(mean),false,WHY_MAL_RANGO),
    fila('Planitud = lectura máxima de la placa',Math.abs(mx),false,WHY_MAL_RANGO),
    fila('Planitud = desviación del centro respecto al promedio de las esquinas',Math.abs(r[4]-esq),false,WHY_MAL_RANGO),
    fila('Planitud = diferencia entre las esquinas opuestas 1 y 4',Math.abs(r[0]-r[3]),false,WHY_MAL_RANGO),
    fila('Planitud = diferencia entre las esquinas opuestas 2 y 3',Math.abs(r[1]-r[2]),false,WHY_MAL_RANGO),
  ];
  const seen=new Set(); const opciones=[];
  pool.forEach(o=>{ const kk=f3(o._v); if(seen.has(kk))return; seen.add(kk); opciones.push(o); });
  const pregunta=`Recorriendo los 5 puntos de la placa obtuviste (mm, relativo): ${st.puntos.map((p,i)=>p+':'+f3(r[i])).join(' · ')}. ¿Cuál es la planitud y qué decides contra las clases de tolerancia H (${f2(h)} mm) y K (${f2(k)} mm) de ISO 2768-2?`;
  return {pregunta, opciones};
}
function currentQuiz(){
  if(instKey==='comp'){ return caseKey==='runout' ? runoutQuizText() : planitudQuizText(); }
  if(caseKey==='trinquete') return trinqueteQuizText();
  return micQuizText(caseKey);
}


/* ============================================================
   ESCENA 3D — 1) MICRÓMETRO (bastidor en C, eje de medición vertical)
   ============================================================ */
const stand=roundedBox(4.6,0.5,1.4,MAT.bench,0.06); stand.position.set(0,0.15,0.05); scene.add(stand);
stand.userData={title:'Soporte de banco',info:'Base de trabajo compartida por ambos instrumentos.'};

const micG=new THREE.Group(); micG.position.set(-1.7,0.10,-0.05); scene.add(micG);

/* EL BASTIDOR ES UNA SOLA PIEZA EN C, no tres tacos apilados: se saca de su
   silueta y se extruye. El arco es lo que da nombre al instrumento y lo que
   explica su unica funcion mecanica —mantener yunque y husillo enfrentados en
   el mismo eje—, y ademas coloca el brazo inferior donde de verdad va: sujeta
   el manguito por ARRIBA del tambor, dejando que tambor y trinquete queden
   fuera del arco. Antes el brazo cruzaba por donde esta el trinquete, que
   quedaba enterrado dentro del acero. */
const spine=sh(new THREE.Mesh(P3.extruido(P3.contornoRedondeado([
  [0.95,1.66],[0.95,1.46],[0.12,1.46],[0.12,0.86],[0.95,0.86],
  [0.95,0.70],[0.12,0.70],[0.12,0.30],[-0.12,0.30],[-0.12,1.66],
], [0.05,0.05,0.10,0.10,0.05,0.05,0.10,0.06,0.06,0.16], 5),
  {espesor:0.28, bisel:0.012}), MAT.steelDk));
micG.add(spine);
spine.userData={title:'Bastidor (arco en C)',info:'Cuerpo rígido del micrómetro; mantiene el yunque y el husillo alineados en el mismo eje de medición. El brazo superior sostiene el yunque; el inferior sujeta el manguito.'};
/* Las PLACAS AISLANTES del arco. No son adorno ergonomico: el calor de los
   dedos dilata el acero del bastidor lo bastante como para verse en centesimas,
   y por eso un micrometro se agarra por ahi y no por el arco desnudo. */
for(const sz of [-1,1]){
  const grip=roundedBox(0.20,0.55,0.05,MAT.thumb,0.02);
  grip.position.set(0,0.72,sz*0.155); micG.add(grip);
  grip.userData={title:'Placas aislantes del arco',info:'Zona de sujeción con la mano; aíslan el bastidor del calor de los dedos, que dilata el acero lo suficiente para verse en centésimas de milímetro.'};
}
/* El pie: en esta practica el micrometro esta MONTADO EN SOPORTE sobre el
   banco, que es como se mide una serie de piezas sin que la mano lo caliente. */
const micPie=roundedBox(0.46,0.10,0.46,MAT.lock,0.03); micPie.position.set(0,0.35,0); micG.add(micPie);
micPie.userData={title:'Soporte del micrómetro',info:'Base que sujeta el arco por su lomo para medir una serie de piezas sin sostener el instrumento con la mano.'};

const anvil=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.16,14),MAT.steel));
anvil.position.set(ARM_X,1.38,0); micG.add(anvil);
anvil.userData={title:'Yunque (tope fijo)',info:'Superficie de referencia fija — el husillo se cierra contra ella (o contra la pieza) para tomar la lectura.'};

/* EL MANGUITO lleva SU LINEA DE REFERENCIA, que es contra la que se lee el
   tambor. La escala de milimetros NO se dibuja aqui a proposito: en este modelo
   el tambor no se desplaza al girar, asi que una escala de milimetros grabada
   nunca se recorreria — seria un dibujo que miente. Los milimetros y la linea
   de 0.5 mm se leen en el visor, que si los calcula. */
const mangCanvas=document.createElement('canvas'); mangCanvas.width=512; mangCanvas.height=256;
const mangTex=new THREE.CanvasTexture(mangCanvas); mangTex.colorSpace=THREE.SRGBColorSpace;
mangTex.anisotropy=8; mangTex.minFilter=THREE.LinearFilter; mangTex.generateMipmaps=false;
(function dibujaManguito(){
  const c=mangCanvas.getContext('2d'), W=mangCanvas.width, H=mangCanvas.height;
  c.fillStyle='#c6ced2'; c.fillRect(0,0,W,H);
  c.strokeStyle='#1b2226'; c.lineWidth=7;
  c.beginPath(); c.moveTo(W/2,0); c.lineTo(W/2,H); c.stroke();   // la línea de referencia
  mangTex.needsUpdate=true;
})();
const matManguito=std({map:mangTex, roughness:0.34, metalness:0.55});
const sleeve=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.108,0.108,0.50,24),
  [matManguito, MAT.steel, MAT.steel]));
sleeve.position.set(ARM_X,0.60,0); sleeve.rotation.y=Math.PI; micG.add(sleeve);
sleeve.userData={title:'Manguito (escala fija) · línea de referencia',info:'Cuerpo fijo solidario al bastidor. Su línea de referencia longitudinal es contra la que se lee la división del tambor. Los milímetros y la línea de 0.5 mm se leen en el visor.'};

/* EL TAMBOR con sus 50 DIVISIONES grabadas, numeradas de 5 en 5. No es decorado:
   gira (raw/0.5)·2π, asi que la division que cae sobre la linea de referencia es
   exactamente la centesima de la lectura — la misma que muestra el visor. */
const tamCanvas=document.createElement('canvas'); tamCanvas.width=2048; tamCanvas.height=256;
const tamTex=new THREE.CanvasTexture(tamCanvas); tamTex.colorSpace=THREE.SRGBColorSpace;
tamTex.anisotropy=8; tamTex.minFilter=THREE.LinearFilter; tamTex.generateMipmaps=false;
(function dibujaTambor(){
  const c=tamCanvas.getContext('2d'), W=tamCanvas.width, H=tamCanvas.height;
  c.fillStyle='#aeb7bd'; c.fillRect(0,0,W,H);
  c.strokeStyle='#12181c'; c.fillStyle='#12181c'; c.textAlign='center';
  for(let k=0;k<50;k++){
    /* Se dibuja en sentido INVERSO (u = 1 − k/50) porque el tambor gira sobre
       +Y: con el sentido directo, la division que cae sobre la referencia seria
       −k y la lectura saldria al reves que la del visor. */
    const xb=W*(1-k/50);
    const marca=k%5===0;
    /* Cada raya se pinta TRES veces —en x, x−W y x+W— porque el lienzo da la
       vuelta al tambor: la costura caeria justo sobre la division 0 y la
       partiria por la mitad, y su numero habria que empujarlo hacia dentro,
       descolocandolo casi una division respecto de su propia raya. */
    for(const x of [xb-W, xb, xb+W]){
      c.lineWidth=marca?5:3;
      c.beginPath(); c.moveTo(x,0); c.lineTo(x,marca?H*0.52:H*0.32); c.stroke();
      if(marca){ c.font='bold 62px system-ui'; c.fillText(String(k), x, H*0.86); }
    }
  }
  tamTex.needsUpdate=true;
})();
const thimble=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.128,0.128,0.28,28),
  [std({map:tamTex, roughness:0.38, metalness:0.55}), MAT.steelDk, MAT.steelDk]));
thimble.position.set(ARM_X,THIMBLE_Y,0); micG.add(thimble);
thimble.userData={title:'Tambor (escala móvil, centésimas)',info:'50 divisiones × 0.01 mm = 0.5 mm por vuelta completa. Gira solidario al husillo: la división que cae sobre la línea de referencia del manguito es la centésima de la lectura.'};

const ratchet=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.09,16),MAT.lock));
ratchet.position.set(ARM_X,0.365,0); micG.add(ratchet);
ratchet.userData={title:'Trinquete',info:'Rueda estriada al final del tambor: desliza en vacío al alcanzar la fuerza de medición estándar del fabricante — así toda medición se hace con fuerza consistente, sin importar quién mida.'};

const rod=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,1,16),MAT.steel));
rod.position.set(ARM_X,ROD_BASE_Y,0); micG.add(rod);
rod.userData={title:'Husillo (parte roscada)',info:'Avanza hacia el yunque al girar el tambor: paso de rosca 0.5 mm/vuelta.'};

const lockLever=sh(new THREE.Mesh(new THREE.BoxGeometry(0.11,0.05,0.06),MAT.lock));
lockLever.position.set(0.03,1.20,0.155); micG.add(lockLever);
lockLever.userData={title:'Tornillo de fijación (lock)',info:'Bloquea el husillo en su posición actual — a diferencia del trinquete, NO estandariza fuerza de medición, solo evita que el husillo gire una vez tomada la lectura.'};

// visor — panel de lectura ampliada (manguito+tambor), posición fija y siempre legible
const micVisorBezel=roundedBox(1.05,0.55,0.05,MAT.bezel,0.02); micVisorBezel.position.set(0.42,2.15,0.28); micG.add(micVisorBezel);
const micCanvas=document.createElement('canvas'); micCanvas.width=512; micCanvas.height=256;
const micTex=new THREE.CanvasTexture(micCanvas); micTex.colorSpace=THREE.SRGBColorSpace; micTex.minFilter=THREE.LinearFilter; micTex.generateMipmaps=false;
const micVisorScreen=new THREE.Mesh(new THREE.PlaneGeometry(0.95,0.47), new THREE.MeshBasicMaterial({map:micTex,toneMapped:false}));
micVisorScreen.position.set(0.42,2.15,0.31); micG.add(micVisorScreen);
micVisorScreen.userData={title:'Visor · lectura ampliada',info:'Vista ampliada del manguito (mm + 0.5mm) y del tambor (centésimas) — la lectura de 3 términos de un micrómetro.'};

const anvilLabel=labelSprite('Yunque','#ffd166'); anvilLabel.position.set(ARM_X,1.58,0.15);
anvilLabel.visible=false; anvilLabel.raycast=()=>{}; micG.add(anvilLabel); HOVER_LABELS.set(anvil,anvilLabel);
const thimbleLabel=labelSprite('Tambor · 0.01 mm/división','#4FD1C5'); thimbleLabel.position.set(ARM_X,0.86,0.28);
thimbleLabel.visible=false; thimbleLabel.raycast=()=>{}; micG.add(thimbleLabel); HOVER_LABELS.set(thimble,thimbleLabel);
const ratchetLabel=labelSprite('Trinquete','#ffd166'); ratchetLabel.position.set(ARM_X,0.20,0.25);
ratchetLabel.visible=false; ratchetLabel.raycast=()=>{}; micG.add(ratchetLabel); HOVER_LABELS.set(ratchet,ratchetLabel);
const lockLabel=labelSprite('Tornillo de fijación','#ffd166'); lockLabel.position.set(0.25,1.38,0.3);
lockLabel.visible=false; lockLabel.raycast=()=>{}; micG.add(lockLabel); HOVER_LABELS.set(lockLever,lockLabel);
const visorLabel=labelSprite('Visor · lectura ampliada','#4FD1C5'); visorLabel.position.set(0.42,2.45,0.32);
visorLabel.visible=false; visorLabel.raycast=()=>{}; micG.add(visorLabel); HOVER_LABELS.set(micVisorScreen,visorLabel);

function makeEje(trueDim,mat,labelTxt,infoTxt){
  const g=new THREE.Group();
  const r=(trueDim*SCALE)/2, len=0.7;
  const barra=sh(new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,24),mat));
  barra.rotation.z=Math.PI/2;
  barra.position.set(ARM_X,ANVIL_TIP_Y-r,0);
  g.add(barra);
  barra.userData={title:labelTxt,info:infoTxt};
  const lb=labelSprite(labelTxt,'#ffd166'); lb.position.set(ARM_X,ANVIL_TIP_Y-r+0.32,0.35);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(barra,lb);
  return g;
}
const EJE_META={
  ejeA:[MAT.ejeA,'Eje A · rectificado','Eje cilíndrico rectificado. Mide su diámetro con el micrómetro.'],
  ejeB:[MAT.ejeB,'Eje B · rectificado','Eje cilíndrico rectificado. Este micrómetro tiene error de indicación.'],
  trinquete:[MAT.ejeC,'Eje A · práctica de trinquete','Mismo eje del Caso 1 — aquí el objetivo es identificar el trinquete y el tornillo de fijación, no releer el diámetro.'],
};
const creaEje=key=>makeEje(CASES_MIC[key].trueDim,...EJE_META[key]);
const WK_GROUPS_MIC={ejeA:creaEje('ejeA'),ejeB:creaEje('ejeB'),trinquete:creaEje('trinquete')};
/* La pieza se rehace con el diámetro sembrado (al resembrar y en la demostración). */
function rebuildMic(key){
  const old=WK_GROUPS_MIC[key], padre=old.parent;
  if(padre) padre.remove(old);
  old.traverse(o=>{ if(o.geometry) o.geometry.dispose(); });
  WK_GROUPS_MIC[key]=creaEje(key);
  if(padre) padre.add(WK_GROUPS_MIC[key]);
}
micG.add(WK_GROUPS_MIC.ejeA);

/* ============================================================
   ESCENA 3D — 2) COMPARADOR DE CARÁTULA (base magnética + brazo + carátula)
   ============================================================ */
const compG=new THREE.Group(); compG.position.set(1.7,0.10,-0.05);

const magBase=roundedBox(0.42,0.12,0.42,MAT.base,0.02); magBase.position.set(0,0.06,0); compG.add(magBase);
magBase.userData={title:'Base magnética',info:'Se fija sobre una superficie ferrosa del banco de trabajo para sostener el comparador de forma rígida.'};
const post=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,1.05,12),MAT.steelDk));
post.position.set(0,0.585,0); compG.add(post);
/* LA PALANCA de la base magnetica: es lo que la enciende y la apaga, y lo que
   la distingue de un taco de acero cualquiera. */
const magPalanca=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.14,10),MAT.lock));
magPalanca.rotation.x=Math.PI/2; magPalanca.position.set(0.16,0.06,0.16); compG.add(magPalanca);
magPalanca.userData={title:'Palanca de la base magnética',info:'Conecta y desconecta el imán permanente de la base: con la palanca en ON la base queda firme sobre el banco ferroso, y sin ella el comparador se movería con cada toque.'};

/* EL BRAZO gira sobre la columna y la CABEZA sube y baja por él, que es como se
   coloca un comparador de verdad sobre el punto que se va a medir. Aqui ademas
   hace falta: la practica de planitud pasea el palpador por CINCO puntos de la
   placa, y con la cabeza clavada en un sitio el 3D decia que no se movia. */
const compBrazo=new THREE.Group(); compG.add(compBrazo);
const armH=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.55,12),MAT.steelDk));
armH.rotation.z=Math.PI/2; armH.position.set(0.275,1.05,0); compBrazo.add(armH);
const cabeza=new THREE.Group(); cabeza.position.set(0.55,0,0); compBrazo.add(cabeza);
const armV=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.22,12),MAT.steelDk));
armV.position.set(0,0.93,0); cabeza.add(armV);

const dialBezel=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.30,0.09,32),MAT.lock));
dialBezel.rotation.x=Math.PI/2; dialBezel.position.set(0,0.80,0.05); cabeza.add(dialBezel);
const compCanvas=document.createElement('canvas'); compCanvas.width=384; compCanvas.height=384;
const compTex=new THREE.CanvasTexture(compCanvas); compTex.colorSpace=THREE.SRGBColorSpace; compTex.minFilter=THREE.LinearFilter; compTex.generateMipmaps=false;
const dialFace=new THREE.Mesh(new THREE.PlaneGeometry(0.54,0.54), new THREE.MeshBasicMaterial({map:compTex,toneMapped:false}));
dialFace.position.set(0,0.80,0.10); cabeza.add(dialFace);
dialFace.userData={title:'Carátula del comparador',info:'Una vuelta completa de la aguja equivale a 1.00 mm de desplazamiento del palpador; cada división = 0.01 mm.'};
const plungerHousing=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.30,14),MAT.steel));
plungerHousing.position.set(0,0.62,0); cabeza.add(plungerHousing);
plungerHousing.userData={title:'Palpador (husillo)',info:'Toca la pieza y transmite su desplazamiento lineal a la aguja mediante un mecanismo de cremallera y piñón.'};
/* EL VASTAGO y su PUNTA DE CONTACTO. La punta es una bolita de metal duro: toca
   la pieza en UN solo punto, y por eso lo que mide es la altura de ese punto y
   no un promedio de la zona. Sin ella el palpador terminaba en un tubo cortado
   a ras, flotando cinco centesimas por encima del eje. */
const plungerRod=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.09,10),MAT.steel));
plungerRod.position.set(0,0.432,0); cabeza.add(plungerRod);
plungerRod.userData=plungerHousing.userData;
const plungerBall=sh(new THREE.Mesh(new THREE.SphereGeometry(0.028,16,12),MAT.lock));
plungerBall.position.set(0,0.388,0); cabeza.add(plungerBall);
plungerBall.userData={title:'Punta de contacto',info:'Bolita de metal duro en el extremo del palpador. Toca la pieza en un solo punto: la lectura es la altura de ESE punto, no un promedio de la zona.'};
const Y_PUNTA=0.360;                     // y local de la bolita cuando cabeza.y = 0

/* Coloca la cabeza sobre el punto que se esta midiendo: el brazo gira sobre la
   columna lo justo, se estira hasta el radio que toca y la cabeza baja hasta
   que la bolita apoya en la pieza. */
function colocaCabeza(x,z,yPunta){
  const R=Math.max(0.20,Math.hypot(x,z));
  compBrazo.rotation.y=-Math.atan2(z,x);
  armH.scale.y=R/0.55; armH.position.x=R/2;
  cabeza.position.set(R,yPunta-Y_PUNTA,0);
}

const dialLabel=labelSprite('Carátula · lectura','#4FD1C5'); dialLabel.position.set(0,1.15,0.15);
dialLabel.visible=false; dialLabel.raycast=()=>{}; cabeza.add(dialLabel); HOVER_LABELS.set(dialFace,dialLabel);
const baseLabel=labelSprite('Base magnética','#ffd166'); baseLabel.position.set(0,0.30,0.25);
baseLabel.visible=false; baseLabel.raycast=()=>{}; compG.add(baseLabel); HOVER_LABELS.set(magBase,baseLabel);
const plungerLabel=labelSprite('Palpador (husillo)','#ffd166'); plungerLabel.position.set(0,0.68,0.25);
plungerLabel.visible=false; plungerLabel.raycast=()=>{}; cabeza.add(plungerLabel); HOVER_LABELS.set(plungerHousing,plungerLabel);

/* Los cinco puntos de muestreo de la placa, en coordenadas del comparador: los
   usan tanto los marcadores de la placa como la colocacion de la cabeza, para
   que el palpador este SIEMPRE sobre el punto que dice la telemetria. */
const PLAN_PTS=[[-0.36,-0.22],[0.36,-0.22],[-0.36,0.22],[0.36,0.22],[0,0]];
const Y_EJE_CRESTA=0.360;   // y de la generatriz superior del eje de runout
const Y_PLACA_CARA=0.205;   // y de la cara de la placa de planitud (con marcador)

function makeRunoutShaft(){
  const g=new THREE.Group();
  const shaftLen=0.85, shaftR=0.11;
  const shaftPivot=new THREE.Group(); shaftPivot.rotation.z=Math.PI/2; shaftPivot.position.set(0.55,0.25,0); g.add(shaftPivot);
  const shaftSpin=new THREE.Group(); shaftPivot.add(shaftSpin);
  const shaftMesh=sh(new THREE.Mesh(new THREE.CylinderGeometry(shaftR,shaftR,shaftLen,28),MAT.ejeA));
  shaftSpin.add(shaftMesh);
  shaftMesh.userData={title:'Eje de prueba (montado entre puntos)',info:'Gira 360° sobre su eje; el comparador (palpador fijo) registra la desviación relativa en cada posición angular.'};
  const stripe=sh(new THREE.Mesh(new THREE.BoxGeometry(0.05,shaftLen*0.9,0.03),MAT.stripe));
  stripe.position.set(shaftR*0.95,0,0); shaftSpin.add(stripe);
  stripe.userData={title:'Marca de referencia angular',info:'Indica la posición angular (0°, 60°, 120°…) en la que se toma cada lectura del comparador.'};
  const supL=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.09,0.22,12),MAT.base)); supL.position.set(0.55-shaftLen/2-0.06,0.14,0); g.add(supL);
  const supR=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.09,0.22,12),MAT.base)); supR.position.set(0.55+shaftLen/2+0.06,0.14,0); g.add(supR);
  const lb=labelSprite('Eje · runout (TIR)','#ffd166'); lb.position.set(0.55,0.55,0.25);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(shaftMesh,lb);
  g.userData._spin=shaftSpin;
  return g;
}
function makePlanitudPlate(){
  const g=new THREE.Group();
  const plate=sh(new THREE.Mesh(new THREE.BoxGeometry(0.85,0.05,0.55),MAT.plate));
  plate.position.set(0.55,0.16,0); g.add(plate);
  plate.userData={title:'Placa de referencia rectificada',info:'Superficie de referencia; el comparador se pasea por 5 puntos (4 esquinas + centro) para evaluar planitud.'};
  const pts=PLAN_PTS;
  const markers=pts.map((p,i)=>{
    const mk=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.02,16),MAT.markerOff));
    mk.position.set(0.55+p[0],0.195,p[1]); g.add(mk);
    mk.userData={title:CASES_COMP.planitud.puntos[i],info:'Punto de muestreo de planitud #'+(i+1)+'.'};
    return mk;
  });
  const lb=labelSprite('Placa · planitud (5 pts)','#ffd166'); lb.position.set(0.55,0.42,0.35);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(plate,lb);
  g.userData._markers=markers;
  return g;
}
const WK_GROUPS_COMP={ runout:makeRunoutShaft(), planitud:makePlanitudPlate() };
compG.add(WK_GROUPS_COMP.runout);

S.start();

/* ============================================================
   HUD (izquierda)
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Instrumentación · Metrología de precisión</div>
  <h2>Micrómetro y Comparador de Carátula: Resolución 0.01 mm</h2>
  <p>El micrómetro exige leer TRES escalas en cascada — milímetros, línea de 0.5 mm y centésimas del tambor — mientras que el comparador de carátula convierte un desplazamiento lineal en el giro de una aguja para comparar una pieza contra una referencia. Este laboratorio cierra el núcleo de metrología general: mide ejes con el micrómetro y evalúa runout y planitud con el comparador.</p>
  <div class="formula">Lectura (micrómetro) = mm enteros + [0.5 mm si la línea media es visible] + división del tambor × 0.01 mm<br>TIR = máx − mín (NO se divide entre 2) · Excentricidad = TIR/2<br>Planitud = máx − mín entre todos los puntos muestreados</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8a949c"></span>Micrómetro · ejes rectificados (Ø por medir)</div>
    <div class="li"><span class="dot" style="background:#C9A227"></span>Micrómetro · error de indicación</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Comparador · runout (TIR), eje rotando</div>
    <div class="li"><span class="dot" style="background:#FFD166"></span>Comparador · planitud, placa 5 puntos</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la lectura de 3 términos del micrómetro (mm + 0.5mm + tambor×0.01); la corrección aritmética por error de indicación (misma mecánica que el error de cero del calibrador, por paridad pedagógica); la distinción funcional trinquete (fuerza estandarizada) vs. tornillo de fijación (bloqueo de posición); el runout (TIR) como máx−mín de 6 lecturas angulares SIN dividir entre 2, con la excentricidad como magnitud derivada; la planitud como máx−mín de 5 puntos muestreados, comparada contra dos clases de tolerancia (ISO 2768-2).</div>
    <div class="fl no"><b>NO modela:</b> la magnitud exacta del error por NO usar el trinquete (no hay cifra fabricante/norma documentada con respaldo suficiente — se trata solo como concepto cualitativo, sin número simulado); el valor numérico preciso de la fuerza del trinquete (se cita el orden de magnitud del fabricante, 5–10 N, como referencia, no como constante simulada); el procedimiento real de puesta a cero MECÁNICA del micrómetro (con llave/pin de ajuste del manguito) — aquí se corrige aritméticamente, como en el calibrador, por paridad pedagógica; el error de coseno de los comparadores de PALANCA (aquí se modela un comparador de PALPADOR/plunger, sin ese efecto); la deflexión elástica del bastidor ni el desgaste de las puntas.</div>
  </div>
  <div class="src">Ref: ASME B89.1.13-2013 (R2022) "Micrometers" · ISO 3611:2023 · ASME B89.1.10M "Dial Indicators" · ISO 463:2006 · ASME Y14.5-2018 / ISO 1101 (runout) · ISO 2768-2 (clases de tolerancia general)</div>`;

/* ============================================================
   PANEL (derecha)
   ============================================================ */
document.getElementById('panel').innerHTML=`
  <h4>Micrómetro y Comparador · <span id="p_case" style="color:var(--accent2)">Caso 1/3</span></h4>
  <div class="modebar" id="instbar">
    <button class="b on" id="i_mic">Micrómetro</button>
    <button class="b" id="i_comp">Comparador</button>
  </div>
  <div class="modebar" id="casebar"></div>
  <div id="tele">
    <div class="g"><div class="gl"><span>Lectura</span><b id="t_raw">—</b></div></div>
    <div class="g"><div class="gl"><span>Referencia</span><b id="t_ref">—</b></div></div>
    <div class="g"><div class="gl"><span>Resolución</span><b id="t_lc">—</b></div></div>
    <div class="g"><div class="gl"><span>Caso</span><b id="t_case">—</b></div></div>
    <div class="g"><div class="gl"><span>Estado</span><b id="t_est">—</b></div></div>
  </div>
  <div class="console" id="report">Cierra el husillo (🔧) para tomar contacto con la pieza y leer el visor.</div>
  <div class="modebar" id="stepWrap" style="display:none">
    <button class="b" id="btnStep">▶ Siguiente punto</button>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Medición automática (guiada)</button>
    <button class="b primary" id="btnJaws">🔧 Cerrar husillo</button>
    <button class="b" id="btnNew">🔀 Nuevo caso</button>
  </div>`;

const el=id=>document.getElementById(id);

/* ---------- visor/carátula, telemetría e informe ---------- */
function drawMicVisor(mm){
  const dec=decomposeMic(mm);
  const c=micCanvas.getContext('2d');
  c.fillStyle='#0a1512'; c.fillRect(0,0,512,256);
  c.strokeStyle='rgba(79,209,197,.35)'; c.lineWidth=3; c.strokeRect(5,5,502,246);
  c.fillStyle='#4FD1C5'; c.font='bold 13px Outfit, sans-serif'; c.textAlign='center';
  c.fillText('manguito (mm)',256,20);
  const originX=256, mmPx=52;
  for(let i=-1;i<=1;i++){
    const mmv=dec.whole+i, x=originX+i*mmPx;
    c.strokeStyle='#8FB3AC'; c.beginPath(); c.moveTo(x,32); c.lineTo(x,58); c.stroke();
    c.fillStyle='#EAF4F1'; c.font='14px Outfit, sans-serif'; c.fillText(String(mmv),x,74);
  }
  c.fillStyle=dec.halfMark?'#FFD166':'#3a4a46';
  c.beginPath(); c.moveTo(originX+mmPx/2-6,86); c.lineTo(originX+mmPx/2+6,86); c.lineTo(originX+mmPx/2,98); c.closePath(); c.fill();
  c.fillStyle= dec.halfMark?'#FFD166':'#5b8a80'; c.font='12px Outfit, sans-serif'; c.textAlign='center';
  c.fillText(dec.halfMark?'línea de 0.5 mm: VISIBLE':'línea de 0.5 mm: oculta', originX, 114);
  c.fillStyle='#4FD1C5'; c.font='bold 13px Outfit, sans-serif';
  c.fillText('tambor (centésimas)',256,140);
  const tSpacing=13;
  const iStart=Math.max(0,dec.thimbleDiv-14), iEnd=Math.min(49,dec.thimbleDiv+14);
  for(let i=iStart;i<=iEnd;i++){
    const x=originX+(i-dec.thimbleDiv)*tSpacing, hi=(i===dec.thimbleDiv);
    c.strokeStyle=hi?'#FFD166':'#5b8a80'; c.lineWidth=hi?3:1.5;
    c.beginPath(); c.moveTo(x,160); c.lineTo(x,190+(hi?16:0)); c.stroke();
  }
  c.fillStyle='#FFD166'; c.font='bold 13px Outfit, sans-serif';
  c.fillText('línea alineada: '+dec.thimbleDiv+' / 50',256,222);
  c.fillStyle='#EAF4F1'; c.font='bold 28px Outfit, sans-serif'; c.textAlign='right';
  if(solved||autoRunning||caseKey==='trinquete') c.fillText(mm.toFixed(2)+' mm',492,245);
  else { c.fillStyle='#8FB3AC'; c.font='13px Outfit, sans-serif'; c.fillText('lee: mm + 0.5 + div × 0.01',492,245); }
  c.textAlign='left';
  micTex.needsUpdate=true;
}
function drawCompDial(mm){
  const c=compCanvas.getContext('2d');
  const cx=192,cy=170,R=130;
  c.fillStyle='#0a1512'; c.fillRect(0,0,384,384);
  c.fillStyle='#0e1a17'; c.beginPath(); c.arc(cx,cy,R+8,0,Math.PI*2); c.fill();
  c.strokeStyle='rgba(79,209,197,.4)'; c.lineWidth=3; c.beginPath(); c.arc(cx,cy,R+8,0,Math.PI*2); c.stroke();
  for(let i=0;i<100;i++){
    const ang=(i/100)*Math.PI*2-Math.PI/2;
    const major=i%10===0;
    const r1=R, r2=major?R-16:R-8;
    c.strokeStyle=major?'#EAF4F1':'#5b8a80'; c.lineWidth=major?2.4:1.2;
    c.beginPath(); c.moveTo(cx+Math.cos(ang)*r1,cy+Math.sin(ang)*r1); c.lineTo(cx+Math.cos(ang)*r2,cy+Math.sin(ang)*r2); c.stroke();
    if(major){
      const lbl=i<=50?i:i-100;
      c.fillStyle='#8FB3AC'; c.font='12px Outfit, sans-serif'; c.textAlign='center'; c.textBaseline='middle';
      c.fillText(String(lbl),cx+Math.cos(ang)*(R-32),cy+Math.sin(ang)*(R-32));
    }
  }
  const needleAng=(mm*360-90)*Math.PI/180;
  c.strokeStyle='#FFD166'; c.lineWidth=4; c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(needleAng)*(R-24),cy+Math.sin(needleAng)*(R-24)); c.stroke();
  c.fillStyle='#FFD166'; c.beginPath(); c.arc(cx,cy,8,0,Math.PI*2); c.fill();
  c.fillStyle='#4FD1C5'; c.font='bold 12px Outfit, sans-serif'; c.textAlign='center'; c.textBaseline='alphabetic';
  c.fillText('0.01 mm/división',cx,30);
  c.fillStyle='#EAF4F1'; c.font='bold 22px Outfit, sans-serif';
  c.fillText((mm>=0?'+':'')+mm.toFixed(3)+' mm',cx,325);
  const n=caseKey==='runout'?CASES_COMP.runout.readings.length:CASES_COMP.planitud.readings.length;
  const lbl=caseKey==='runout'?(CASES_COMP.runout.angles[idx]+'°'):CASES_COMP.planitud.puntos[idx];
  c.fillStyle='#8FB3AC'; c.font='13px Outfit, sans-serif';
  c.fillText('Punto '+(idx+1)+'/'+n+' · '+lbl,cx,352);
  compTex.needsUpdate=true;
}
function updateTele(raw){
  const set=(id,txt,cls)=>{ const b=el(id); b.textContent=txt; b.className=cls||''; };
  if(instKey==='mic'){
    const c=CASES_MIC[caseKey]; const {zeroErrorQ}=caseReadingMic(caseKey);
    set('t_raw', (solved||autoRunning||caseKey==='trinquete')?raw.toFixed(2)+' mm':(contact?'— (léela en el visor)':'—'), contact?'good':'');
    set('t_ref', (zeroErrorQ>=0?'+':'')+zeroErrorQ.toFixed(3)+' mm (error indic.)', zeroErrorQ!==0?'warn':'good');
    set('t_lc','0.01 mm (tambor: 50 div.)','');
    set('t_case', c.nombre,'');
    set('t_est', contact?'Husillo cerrado · midiendo':'Husillo abierto', contact?'good':'warn');
  } else {
    const n=caseKey==='runout'?CASES_COMP.runout.readings.length:CASES_COMP.planitud.readings.length;
    const lbl=caseKey==='runout'?(CASES_COMP.runout.angles[idx]+'°'):CASES_COMP.planitud.puntos[idx];
    const tol=caseKey==='runout'?CASES_COMP.runout.tolerancia:CASES_COMP.planitud.tolH;
    set('t_raw', (raw>=0?'+':'')+raw.toFixed(3)+' mm', contact?'good':'');
    set('t_ref', tol.toFixed(2)+' mm (tolerancia)','warn');
    set('t_lc','0.01 mm/div (carátula)','');
    set('t_case', 'Punto '+(idx+1)+'/'+n+' · '+lbl,'');
    set('t_est', contact?'Comparador fijado · midiendo':'Comparador sin fijar', contact?'good':'warn');
  }
}
function updateReport(raw){
  let html='';
  if(instKey==='mic'){
    const c=CASES_MIC[caseKey];
    if(!contact){
      html='<span class="mono">Husillo abierto. Pulsa "Cerrar husillo" para tomar contacto con la pieza y leer manguito+tambor en el visor.</span>';
    } else if(caseKey==='trinquete'){
      html=`<b>${c.mision}</b><br><span class="mono">Lectura con trinquete (fuerza estandarizada): <b>${raw.toFixed(2)} mm</b><br>El trinquete garantiza que esta lectura sea repetible entre distintos operadores — NO se modela aquí un valor numérico "sin trinquete" (la magnitud exacta de ese error depende del operador y no está documentada con precisión suficiente para simularla).</span>`;
    } else {
      const {zeroErrorQ,correctedQ}=caseReadingMic(caseKey);
      if(solved||autoRunning){
        html=`<b>${c.mision}</b><br><span class="mono">Lectura del visor (manguito+tambor): <b>${raw.toFixed(3)} mm</b><br>Error de indicación del instrumento: <b>${(zeroErrorQ>=0?'+':'')+zeroErrorQ.toFixed(3)} mm</b><br>Lectura corregida = cruda − error = ${raw.toFixed(3)} − (${zeroErrorQ.toFixed(3)}) = <b>${correctedQ.toFixed(3)} mm</b></span>`;
      } else {
        html=`<b>${c.mision}</b><br><span class="mono">Error de indicación del instrumento: <b>${(zeroErrorQ>=0?'+':'')+zeroErrorQ.toFixed(3)} mm</b><br>Lee el visor (mm del manguito + 0.5 mm si la línea media está descubierta + división del tambor × 0.01), corrige con el signo del error y responde.</span>`;
      }
    }
  } else {
    if(!contact){
      html='<span class="mono">Comparador sin fijar. Pulsa "Fijar en cero" y usa "Siguiente punto" para recorrer las lecturas.</span>';
    } else if(caseKey==='runout'){
      const st=runoutStats();
      html=`<b>${CASES_COMP.runout.mision}</b><br><span class="mono">Lecturas (0°→300°): ${st.readings.map((r,i)=>st.angles[i]+'°='+r.toFixed(2)).join(' · ')} mm<br>Tolerancia de runout: ${st.tolerancia.toFixed(2)} mm${(solved||autoRunning)?`<br>TIR = máx − mín = <b>${st.tir.toFixed(2)} mm</b> · Excentricidad = TIR/2 = ${st.ecc.toFixed(3)} mm → <b>${st.rechaza?'RECHAZA':'ACEPTA'}</b>`:'<br>Calcula el TIR con estas lecturas y decide.'}</span>`;
    } else {
      const st=planitudStats();
      html=`<b>${CASES_COMP.planitud.mision}</b><br><span class="mono">Lecturas: ${st.readings.map((r,i)=>st.puntos[i]+'='+r.toFixed(3)).join(' · ')} mm<br>Clase H: ${st.tolH.toFixed(2)} mm · Clase K: ${st.tolK.toFixed(2)} mm${(solved||autoRunning)?`<br>Planitud = máx − mín = <b>${st.flat.toFixed(3)} mm</b><br>Clase H: <b>${st.rechazaH?'RECHAZA':'ACEPTA'}</b> · Clase K: <b>${st.pasaK?'ACEPTA':'RECHAZA'}</b>`:'<br>Calcula la planitud con estas lecturas y decide.'}</span>`;
    }
  }
  el('report').innerHTML=html;
}
function refreshInstrument(){
  const raw=currentRawMM();
  if(instKey==='mic'){ drawMicVisor(raw); }
  else {
    drawCompDial(raw);
    if(caseKey==='planitud'){
      WK_GROUPS_COMP.planitud.userData._markers.forEach((mk,i)=>{ mk.material = i===idx?MAT.marker:MAT.markerOff; });
      const pt=PLAN_PTS[idx];
      colocaCabeza(0.55+pt[0], pt[1], Y_PLACA_CARA);
    } else {
      colocaCabeza(0.55, 0, Y_EJE_CRESTA);
    }
  }
  updateTele(raw); updateReport(raw);
}

/* ---------- interacción ---------- */
function renderCaseBar(){
  const order=CASE_ORDER[instKey];
  el('casebar').innerHTML=order.map(k=>`<button class="b ${k===caseKey?'on':''}" data-case="${k}">${CASE_LABEL[k]}</button>`).join('');
  el('casebar').querySelectorAll('button').forEach(btn=>{ btn.onclick=()=>setCase(btn.dataset.case); });
}
function refreshCaseLabel(){ const order=CASE_ORDER[instKey]; el('p_case').textContent='Caso '+(order.indexOf(caseKey)+1)+'/'+order.length; }
function clearDx(){ document.querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong')); }
function renderQuiz(){
  el('q_text').innerHTML=quizNow.pregunta;
  el('dxbtns').innerHTML=quizNow.opciones.map((o,i)=>`<button class="b dx" data-i="${i}">${'ABCD'[i]} · ${o.t}</button>`).join('');
  el('dxbtns').querySelectorAll('.b.dx').forEach(btn=>{ btn.onclick=()=>answer(+btn.dataset.i); });
}
/* Una correcta + 3 del banco de distractores, barajadas: ni la posición ni el
   largo delatan la respuesta, y tras una resiembra salen otras. */
function refreshQuestion(){
  const q=currentQuiz();
  const buenas=q.opciones.filter(o=>o.ok), malas=q.opciones.filter(o=>!o.ok);
  quizNow={pregunta:q.pregunta,opciones:shuffled(buenas.concat(shuffled(malas).slice(0,3)))};
  renderQuiz();
}
function resiembra(){
  fallosCaso[caseKey]=0; RETO.resiembras++;
  if(caseKey in DEMO){ seedCase(caseKey); }
  if(instKey==='mic'&&caseKey!=='trinquete'){ rebuildMic(caseKey); if(contact) micGapTargetMM=currentRawMM(); }
  idx=0; solved=false;
  if(caseKey==='runout'){ shaftAngleTarget=CASES_COMP.runout.angles[0]*Math.PI/180; shaftAngle=shaftAngleTarget; }
  refreshQuestion(); refreshInstrument();
}
function answer(i){
  if(!contact){ showToast(instKey==='mic'?'Primero cierra el husillo sobre la pieza.':'Primero fija el comparador en cero.'); return; }
  if(autoRunning) return;                 // la demostración enseña, no puntúa
  if(answered[caseKey]){ showToast('Este caso ya está resuelto: pasa al siguiente.'); return; }
  const o=quizNow.opciones[i]; clearDx();
  const btn=el('dxbtns').children[i];
  RETO.intentos++;
  if(o.ok){
    btn.classList.add('right'); solved=true; answered[caseKey]=true; fallosCaso[caseKey]=0; synth.beep(1046,0.12,0.06);
    showToast(`<span style="color:var(--good)">✔ Correcto.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
    refreshInstrument();
  }else{
    btn.classList.add('wrong'); synth.beep(220,0.15,0.06);
    fallosCaso[caseKey]++;
    if(fallosCaso[caseKey]>=3){
      resiembra();
      showToast(`<span style="color:var(--bad)">✗ Tres fallos en este caso.</span><br><span style="color:var(--dim);font-size:11px">Cambian los datos del caso: vuelve a medir con calma y razona cada paso.</span>`);
    } else {
      showToast(`<span style="color:var(--bad)">✗ Revisa tu resultado.</span><br><span style="color:var(--dim);font-size:11px">${o.why} (fallos en este caso: ${fallosCaso[caseKey]}/3)</span>`);
    }
  }
}

/* ---------- animación husillo/eje ---------- */
let micGapMM=PARK_MM, micGapTargetMM=PARK_MM;
let shaftAngle=0, shaftAngleTarget=0;

function setInst(key){
  if(key===instKey||autoRunning) return;
  const oldGrp = instKey==='mic'?micG:compG;
  const oldWk = instKey==='mic'?WK_GROUPS_MIC[caseKey]:WK_GROUPS_COMP[caseKey];
  oldGrp.remove(oldWk); scene.remove(oldGrp);
  instKey=key; caseKey=CASE_ORDER[key][0]; idx=0; contact=false;
  const newGrp = key==='mic'?micG:compG;
  scene.add(newGrp);
  newGrp.add(key==='mic'?WK_GROUPS_MIC[caseKey]:WK_GROUPS_COMP[caseKey]);
  el('i_mic').classList.toggle('on',key==='mic');
  el('i_comp').classList.toggle('on',key==='comp');
  el('btnJaws').classList.remove('on');
  el('btnJaws').textContent = key==='mic' ? '🔧 Cerrar husillo' : '🔧 Fijar en cero';
  el('stepWrap').style.display = key==='comp' ? '' : 'none';
  if(key==='mic'){ micGapTargetMM=PARK_MM; }
  else if(caseKey==='runout'){ shaftAngleTarget=CASES_COMP.runout.angles[0]*Math.PI/180; shaftAngle=shaftAngleTarget; }
  renderCaseBar();
  solved=!!answered[caseKey]; clearDx(); refreshQuestion(); refreshCaseLabel();
  const meta=CASE_CAM[key][caseKey]; S.moveTo(meta[0],meta[1],1.3);
  refreshInstrument();
  showToast('🔀 '+(key==='mic'?'Micrómetro':'Comparador de carátula')+' — '+(key==='mic'?CASES_MIC[caseKey].nombre:CASES_COMP[caseKey].nombre));
}
function setCase(key){
  if(autoRunning) return;
  const grp = instKey==='mic'?micG:compG;
  const groups = instKey==='mic'?WK_GROUPS_MIC:WK_GROUPS_COMP;
  grp.remove(groups[caseKey]);
  caseKey=key; idx=0; contact=false;
  grp.add(groups[key]);
  renderCaseBar();
  el('btnJaws').classList.remove('on');
  el('btnJaws').textContent = instKey==='mic' ? '🔧 Cerrar husillo' : '🔧 Fijar en cero';
  el('stepWrap').style.display = instKey==='comp' ? '' : 'none';
  if(instKey==='mic'){ micGapTargetMM=PARK_MM; }
  else if(key==='runout'){ shaftAngleTarget=CASES_COMP.runout.angles[0]*Math.PI/180; shaftAngle=shaftAngleTarget; }
  solved=!!answered[caseKey]; clearDx(); refreshQuestion(); refreshCaseLabel();
  const meta=CASE_CAM[instKey][key]; S.moveTo(meta[0],meta[1],1.3);
  refreshInstrument();
  showToast('🔀 '+(instKey==='mic'?CASES_MIC[key].nombre:CASES_COMP[key].nombre));
}
el('i_mic').onclick=()=>setInst('mic');
el('i_comp').onclick=()=>setInst('comp');
el('btnNew').onclick=()=>{ const order=CASE_ORDER[instKey]; setCase(order[(order.indexOf(caseKey)+1)%order.length]); };

el('btnJaws').onclick=e=>{
  contact=!contact;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',contact);
  e.target.textContent = contact ? (instKey==='mic'?'🔧 Abrir husillo':'🔧 Retirar') : (instKey==='mic'?'🔧 Cerrar husillo':'🔧 Fijar en cero');
  if(contact){ S.setCinematicIdle(true); synth.beep(880,0.1,0.06); } else S.setCinematicIdle(false);
  if(instKey==='mic'){ micGapTargetMM = contact?currentRawMM():PARK_MM; }
  refreshInstrument();
};
el('btnStep').onclick=()=>{
  const arr = caseKey==='runout'?CASES_COMP.runout.readings:CASES_COMP.planitud.readings;
  idx=(idx+1)%arr.length;
  if(caseKey==='runout'){ shaftAngleTarget=CASES_COMP.runout.angles[idx]*Math.PI/180; }
  refreshInstrument();
  const lbl=caseKey==='runout'?(CASES_COMP.runout.angles[idx]+'°'):CASES_COMP.planitud.puntos[idx];
  showToast('Punto '+(idx+1)+'/'+arr.length+' — '+lbl+' · nueva lectura del comparador.');
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
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const btn=el('btnAuto'); const label=btn.textContent;
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Medición guiada en curso…';
  const iKey=instKey, cKey=caseKey;
  const prev={contact, idx, quiz:quizNow, mic:null, comp:null};
  if(iKey==='mic'&&cKey!=='trinquete') prev.mic={trueDim:CASES_MIC[cKey].trueDim, zeroErrorRaw:CASES_MIC[cKey].zeroErrorRaw};
  if(iKey==='comp') prev.comp={...CASES_COMP[cKey]};
  try{
    clearDx();
    // La demostración mide OTRA pieza (cifras DEMO): lo del alumno no se toca.
    if(prev.mic){ Object.assign(CASES_MIC[cKey],DEMO[cKey]); rebuildMic(cKey); }
    if(prev.comp){ Object.assign(CASES_COMP[cKey],DEMO[cKey]); }
    if(iKey==='mic'&&contact) micGapTargetMM=currentRawMM();
    refreshInstrument();
    if(!contact){ showToast('Paso 1 · '+(iKey==='mic'?'Cerramos el husillo sobre la pieza de ejemplo.':'Fijamos el comparador en cero sobre la pieza de ejemplo.')); el('btnJaws').click(); await sleep(1700); }
    if(iKey==='mic'){
      if(cKey==='trinquete'){
        showToast('Paso 2 · Observa el trinquete (rueda estriada) vs. el tornillo de fijación (arco del bastidor).'); await sleep(2200);
      } else {
        const {rawQ,zeroErrorQ,correctedQ}=caseReadingMic(cKey);
        showToast('Paso 2 · Lee el visor: manguito+tambor ≈ '+rawQ.toFixed(3)+' mm.'); await sleep(2200);
        showToast('Paso 3 · Error de indicación conocido: '+(zeroErrorQ>=0?'+':'')+zeroErrorQ.toFixed(3)+' mm.'); await sleep(2200);
        showToast('Paso 4 · Lectura corregida = cruda − error = '+correctedQ.toFixed(3)+' mm.'); await sleep(2400);
      }
    } else {
      const arr = cKey==='runout'?CASES_COMP.runout.readings:CASES_COMP.planitud.readings;
      for(let i=0;i<arr.length;i++){
        idx=i; if(cKey==='runout'){ shaftAngleTarget=CASES_COMP.runout.angles[i]*Math.PI/180; }
        refreshInstrument();
        showToast('Paso '+(i+2)+' · Punto '+(i+1)+'/'+arr.length+' — lectura '+arr[i].toFixed(3)+' mm.'); await sleep(1300);
      }
      showToast('Paso final · Compara el rango (máx−mín) contra la tolerancia antes de responder.'); await sleep(2200);
    }
    const ok=currentQuiz().opciones.find(o=>o.ok);
    showToast('<span style="color:var(--good)">✔ Resultado de la pieza de ejemplo</span><br>'+ok.t+'<br><span style="color:var(--dim);font-size:11px">'+ok.why+' Tu avance en el reto no cambió.</span>'); await sleep(2600);
  } finally {
    if(prev.mic){ Object.assign(CASES_MIC[cKey],prev.mic); rebuildMic(cKey); }
    if(prev.comp){ Object.assign(CASES_COMP[cKey],prev.comp); }
    autoRunning=false;
    idx=prev.idx; if(iKey==='comp'&&cKey==='runout'){ shaftAngleTarget=CASES_COMP.runout.angles[idx]*Math.PI/180; }
    if(contact!==prev.contact) el('btnJaws').click();
    if(iKey==='mic'&&contact) micGapTargetMM=currentRawMM();
    quizNow=prev.quiz; renderQuiz();
    refreshInstrument();
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
  }
}
el('btnAuto').onclick=runAuto;

/* ---------- lazo de animación ---------- */
S.setAnimate((dt,time)=>{
  simT=time;
  if(instKey==='mic'){
    micGapMM += (micGapTargetMM-micGapMM)*Math.min(1,dt*6);
    const tipY=ANVIL_TIP_Y-micGapMM*SCALE;
    const rodLen=Math.max(0.005,tipY-ROD_BASE_Y);
    rod.scale.y=rodLen; rod.position.y=ROD_BASE_Y+rodLen/2;
    const revTurn=(micGapMM/0.5)*Math.PI*2;
    thimble.rotation.y=revTurn; ratchet.rotation.y=revTurn;
  } else {
    shaftAngle += (shaftAngleTarget-shaftAngle)*Math.min(1,dt*6);
    const spin=WK_GROUPS_COMP.runout.userData._spin;
    if(spin) spin.rotation.y=shaftAngle;
  }
  if(time-(lastDraw||0)>0.25){
    if(instKey==='mic'){ drawMicVisor(currentRawMM()); } else { drawCompDial(currentRawMM()); }
    lastDraw=time;
  }
});
let lastDraw=0;

window.__labDebug={
  get mode(){ return instKey+':'+caseKey; },
  get solved(){ return Object.values(answered).every(Boolean); },
  get intentos(){ return RETO.intentos; },
  state(){ return {inst:instKey,caso:caseKey,contacto:contact,answered:{...answered},intentos:RETO.intentos,
    fallos:{...fallosCaso},resiembras:RETO.resiembras,resuelto:Object.values(answered).every(Boolean),autoRunning}; },
  datos(){ return {mic:JSON.parse(JSON.stringify(CASES_MIC)),comp:JSON.parse(JSON.stringify(CASES_COMP))}; },
  setInst(k){ setInst(k); }, setCase(k){ setCase(k); },
  cierra(){ if(!contact) el('btnJaws').click(); },
  opciones(){ return [...document.querySelectorAll('#dxbtns .b.dx')].map((b,i)=>({t:b.textContent,ok:!!quizNow.opciones[i].ok})); },
};
setCase('ejeA');
