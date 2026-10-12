/* ============================================================
   LAB — INCERTIDUMBRE DE MEDICIÓN (GUM) Y TRAZABILIDAD METROLÓGICA
   (Dominio D10 · instrumentación general — molde S: simulación
   numérica/analítica. Primera implementación de referencia de este
   molde en el catálogo — no hay un lab S previo del que copiar.)
   Normatividad de referencia:
     · JCGM 100:2008 "Evaluation of measurement data — Guide to the
       expression of uncertainty in measurement" (GUM) — cláusula 4.2
       (evaluación Tipo A), 4.3 (Tipo B), 5.1 (ley de propagación,
       forma simplificada u_c=√Σu² para coeficientes de sensibilidad
       unitarios), 6.2–6.3 (incertidumbre expandida, k=2 ⇒ ~95%),
       Anexo F.2.2.1 (resolución, distribución rectangular, u=res/√12),
       Anexo H.1 (ejemplo de calibración de bloques patrón — plantilla
       de este lab, escalada a nivel técnico-vocacional).
     · JCGM 200:2012 "International vocabulary of metrology" (VIM),
       3ª ed. — 2.41 (trazabilidad metrológica, incl. nota 5: la
       trazabilidad NO garantiza por sí sola una incertidumbre
       adecuada), 2.13 (exactitud), 2.15 (precisión), 2.16 (error),
       2.26 (incertidumbre).
     · ISO/IEC 17025:2017 / NMX-EC-17025-IMNC-2018 (idéntica, IDT) —
       §7.8: contenido de un certificado de calibración. §7.8.4.3: la
       "próxima fecha de calibración" NO es de inclusión obligatoria
       por defecto (solo si el cliente lo pide o lo exige un
       reglamento) — un error de taller frecuente que este lab corrige
       explícitamente.
     · NMX-CH-140-IMNC-2002 "Guía para la expresión de incertidumbre
       en las mediciones" — adaptación mexicana del GUM.
     · Ley de Infraestructura de la Calidad (vigente 2020-07-01):
       CENAM como Instituto Nacional de Metrología, origen legal de la
       trazabilidad en México. EMA (Entidad Mexicana de Acreditación,
       A.C.): acreditación de laboratorios de calibración bajo
       NMX-EC-17025-IMNC.
   Modelo de ingeniería (didáctico):
     · Escenario único: un comparador de carátula (resolución 0.001 mm)
       mide 5 veces la misma pieza patrón. Las 5 lecturas (Tipo A), la
       resolución del instrumento (Tipo B) y el certificado de
       calibración del bloque patrón de referencia (Tipo B) se combinan
       en un presupuesto de incertidumbre completo, siguiendo la misma
       estructura que el Anexo H.1 del GUM (Tipo A + Tipo B de
       resolución + Tipo B de certificado → u_c → U), pero con cifras
       redondas apropiadas para un curso técnico, no de metrología
       especializada.
     · Los datos de cada caso (lecturas, resolución, certificado) son cifras
       ilustrativas SORTEADAS al abrir el lab y al resembrar el caso; las
       estadísticas (media, s, u_A, u_c, U) se CALCULAN en código a partir de
       ellas, nunca se transcriben a mano. La demostración usa DEMO.
     · La aguja del comparador en la escena 3D tiene una deflexión
       EXAGERADA a propósito (declarado en el contrato de fidelidad):
       las desviaciones reales de este ejercicio son de decenas de
       micras, invisibles en una carátula realista a esta escala. El
       valor autoritativo siempre es el texto numérico del visor/panel,
       nunca la posición angular de la aguja.
     · Segundo módulo (trazabilidad): una cadena de 3 nodos (CENAM →
       laboratorio acreditado EMA/ISO 17025 → instrumento de taller) y
       un certificado de calibración ilustrativo que DELIBERADAMENTE
       omite la "próxima fecha de calibración" — para que la evidencia
       visual sostenga la respuesta correcta del quiz (esa fecha no es
       de inclusión obligatoria por defecto en ISO/IEC 17025 §7.8.4.3).
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[-1.2,2.1,3.0],target:[-2.4,0.75,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:1.6,maxD:18});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};

const brush=brushedMetal(), alu=castAluminum(), plasBoard=techPlastic(0.05,0.06,0.08);
const MAT={
  steel:    std({...brush, color:0xd7dde0, metalness:0.85, roughness:0.30}),
  steelDk:  std({...brush, color:0x9aa3a8, metalness:0.80, roughness:0.38}),
  base:     std({...brush, color:0x23272b, metalness:0.70, roughness:0.40}),
  granite:  std({color:0x17262d, metalness:0.10, roughness:0.32}),
  bezel:    std({color:0x0b0f12, roughness:0.4}),
  gaugeBlk: std({...alu, color:0xC9A227, metalness:0.5, roughness:0.32}),
  board:    std({...plasBoard, color:0x122024, roughness:0.55}),
  pedCenam: std({...alu, color:0xC9A227, metalness:0.4, roughness:0.4}),
  pedLab:   std({...alu, color:0x4FD1C5, metalness:0.35, roughness:0.45}),
  pedTaller:std({...alu, color:0x8a949c, metalness:0.35, roughness:0.5}),
  link:     std({color:0x2f6b63, emissive:0x1a5c54, emissiveIntensity:0.3, roughness:0.5}),
};

/* ---------- estado ---------- */
let moduleKey='gum';       // 'gum' | 'traz'
let caseKey='tipoA';       // caso activo dentro del módulo
let active=false;          // gate genérico (equivalente a "contact" en otros labs)
let readIdx=0;              // lecturas Tipo A reveladas (0..5)
/* Contabilidad del reto. Tres fallos seguidos en un caso lo resiembran. */
const answered={tipoA:false,tipoB_res:false,tipoB_cert:false,combinar:false,expandida:false,cadena:false,certificado:false};
const fallosCaso={tipoA:0,tipoB_res:0,tipoB_cert:0,combinar:0,expandida:0,cadena:0,certificado:0};
const RETO={intentos:0,resiembras:0};
let quizNow={pregunta:'',opciones:[]};
let autoRunning=false;
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:900,Q:1});

const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}
const HOVER_LABELS=new Map();

/* ============================================================
   MODELO — PRESUPUESTO DE INCERTIDUMBRE GUM
   ============================================================ */
/* Datos de cada caso: se sortean al abrir el lab y otra vez tras tres fallos en
   el caso. Los casos 4 y 5 llevan su PROPIO presupuesto (la pregunta lo da
   completo) para que resembrar uno no cambie las cifras de otro ya resuelto.
   La demostración guiada usa DEMO, que nunca coincide con lo del alumno. */
const K_EXP=2;            // factor de cobertura del resultado final (~95%)
const READ_STEP=0.001;    // paso de lectura del comparador de la estación (1 µm)
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffled=a=>{ const b=a.slice(); for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; };
let READINGS_MM, RES_MM, CERT_U_MM, CERT_K;   // casos 1, 2 y 3 (y lo que dibuja la escena)
let LAB_U_MM;                                  // certificado ilustrativo del laboratorio (módulo de trazabilidad)
let SET4, SET5;                                // presupuestos de los casos 4 y 5

function meanOf(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }
function stdevSample(arr){ const m=meanOf(arr); const ss=arr.reduce((a,b)=>a+(b-m)*(b-m),0); return Math.sqrt(ss/(arr.length-1)); }
const rndLecturas=()=>{ let r; do{ const b=pick([0,0,1]); r=Array.from({length:5},()=>+(10+(b+pick([0,1,2,3]))*READ_STEP).toFixed(4)); }while(stdevSample(r)<1e-9); return r; };
const rndRes=()=>pick([0.001,0.002,0.005,0.01]);
const rndCert=()=>({certU:pick([0.0001,0.0002,0.0003,0.0005]),certK:pick([2,2,3])});
const rndSet=()=>({readings:rndLecturas(),res:rndRes(),...rndCert()});
const DEMO={readings:[10.001,10.000,10.002,10.001,10.003],res:0.002,certU:0.0002,certK:3,labU:0.0004};
const sameSet=(a,b)=>JSON.stringify([a.readings,a.res,a.certU,a.certK])===JSON.stringify([b.readings,b.res,b.certU,b.certK]);
function seedCase(key){
  if(key==='tipoA'){ do{ READINGS_MM=rndLecturas(); }while(JSON.stringify(READINGS_MM)===JSON.stringify(DEMO.readings)); }
  else if(key==='tipoB_res'){ const prev=RES_MM; do{ RES_MM=rndRes(); }while(RES_MM===DEMO.res||RES_MM===prev); }
  else if(key==='tipoB_cert'){
    const p=[CERT_U_MM,CERT_K];
    do{ const c=rndCert(); CERT_U_MM=c.certU; CERT_K=c.certK; }while((CERT_U_MM===DEMO.certU&&CERT_K===DEMO.certK)||(CERT_U_MM===p[0]&&CERT_K===p[1]));
  }
  else if(key==='combinar'){ do{ SET4=rndSet(); }while(sameSet(SET4,DEMO)); }
  else if(key==='expandida'){ do{ SET5=rndSet(); }while(sameSet(SET5,DEMO)); }
}
['tipoA','tipoB_res','tipoB_cert','combinar','expandida'].forEach(seedCase);
LAB_U_MM=pick([0.0002,0.0003,0.0005]);

function gumStats(d){
  d=d||{readings:READINGS_MM,res:RES_MM,certU:CERT_U_MM,certK:CERT_K};
  const n=d.readings.length;
  const mean=meanOf(d.readings);
  const s=stdevSample(d.readings);
  const uA=s/Math.sqrt(n);
  const uRes=d.res/Math.sqrt(12);
  const uCert=d.certU/d.certK;
  const uc=Math.sqrt(uA*uA+uRes*uRes+uCert*uCert);
  const U=K_EXP*uc;
  return {n,mean,s,uA,uRes,uCert,uc,U};
}

const fm=(v,dec=5)=>v.toFixed(dec)+' mm';
const fmu=(v)=>'('+(v*1000).toFixed(2)+' µm)';
const fmboth=(v,dec=5)=>fm(v,dec)+' '+fmu(v);

const CASES_GUM={
  tipoA:{
    nombre:'Tipo A · repetibilidad (n=5)',
    mision:'Caso 1 · El comparador mide 5 veces la MISMA pieza patrón (repetibilidad). Toma las 5 lecturas y calcula la media, la desviación estándar experimental s, y la incertidumbre estándar de la media u_A = s/√n.',
  },
  tipoB_res:{
    nombre:'Tipo B · resolución',
    get mision(){ return 'Caso 2 · Un instrumento de la estación tiene una resolución de '+RES_MM.toFixed(3)+' mm. Revisa el dato y calcula la incertidumbre estándar por resolución, asumiendo una distribución rectangular sobre la resolución completa.'; },
  },
  tipoB_cert:{
    nombre:'Tipo B · certificado',
    get mision(){ return 'Caso 3 · El bloque patrón de referencia tiene un certificado de calibración vigente que declara U = '+CERT_U_MM.toFixed(4)+' mm con k='+CERT_K+'. Revisa el certificado y calcula la incertidumbre estándar de esta fuente.'; },
  },
  combinar:{
    nombre:'Combinar (ley de propagación)',
    mision:'Caso 4 · Combina las tres fuentes (u_A, u_resolución, u_certificado) en una sola incertidumbre estándar combinada u_c, siguiendo la ley de propagación de incertidumbre del GUM.',
  },
  expandida:{
    nombre:'Incertidumbre expandida (k=2)',
    mision:'Caso 5 · Aplica un factor de cobertura k=2 a u_c para obtener la incertidumbre expandida U, y reporta el resultado final de la medición.',
  },
};
const CASE_ORDER_GUM=['tipoA','tipoB_res','tipoB_cert','combinar','expandida'];

/* ============================================================
   MODELO — TRAZABILIDAD METROLÓGICA
   ============================================================ */
const CASES_TRAZ={
  cadena:{
    nombre:'Cadena de trazabilidad',
    mision:'Caso 6 · Inspecciona los tres eslabones de la cadena de trazabilidad (toca cada nodo) y responde qué garantiza —y qué NO garantiza— la trazabilidad metrológica de una medición.',
  },
  certificado:{
    nombre:'Certificado de calibración',
    mision:'Caso 7 · Revisa el certificado de calibración del laboratorio acreditado y evalúa una afirmación común sobre su contenido obligatorio.',
  },
};
const CASE_ORDER_TRAZ=['cadena','certificado'];
const CASE_ORDER={gum:CASE_ORDER_GUM, traz:CASE_ORDER_TRAZ};
const CASE_LABEL={
  tipoA:'Tipo A (n=5)', tipoB_res:'Tipo B · Resolución', tipoB_cert:'Tipo B · Certificado',
  combinar:'Combinar (RSS)', expandida:'Expandida (k=2)', cadena:'Cadena', certificado:'Certificado',
};
const CASE_CAM={
  gum:{
    tipoA:      [[-1.2,2.1,3.0],[-2.4,0.75,0.1]],
    tipoB_res:  [[-3.7,2.0,2.6],[-2.05,0.9,0.2]],
    tipoB_cert: [[-4.4,2.0,2.6],[-2.95,0.75,0.3]],
    combinar:   [[-2.4,2.6,3.6],[-2.4,0.85,0]],
    expandida:  [[-2.4,2.9,4.0],[-2.4,0.9,0]],
  },
  traz:{
    cadena:      [[2.6,2.5,6.4],[2.6,0.85,0]],
    certificado: [[2.6,1.9,1.5],[2.6,1.45,-0.5]],
  },
};

/* ---------- generador de preguntas (banco de distractores) ----------
   Cada pregunta tiene UNA opción correcta y un banco de distractores. Al
   presentarla se eligen 3 del banco y se barajan; las cifras salen de los datos
   sembrados del caso. Los mensajes de error NO dan la cifra ni la opción
   correcta: solo dicen qué revisar. */
const W_RAZON='La razón que das para la clasificación no corresponde a cómo define el GUM los tipos A y B: revisa en qué se basa esa clasificación.';
const W_VALOR='Ese valor no sale de los datos del panel con la fórmula que corresponde: vuelve a calcularlo paso a paso.';
const W_CONCEPTO='Esa afirmación no coincide con la definición de la norma: contrástala con lo que revisaste en la escena.';
const fila=(t,ok,why,k)=>({t,ok,why,_k:k||t});
const sinRepetir=arr=>{ const vistos=new Set(); return arr.filter(o=>{ if(vistos.has(o._k)) return false; vistos.add(o._k); return true; }); };

function tipoAQuiz(){
  const st=gumStats();
  const pregunta=`${CASES_GUM.tipoA.mision}<br>Lecturas (mm): ${READINGS_MM.map(v=>v.toFixed(4)).join(' · ')}. ¿Por qué esta incertidumbre se clasifica como <b>Tipo A</b> y cómo se calcula u_A?`;
  const R=['porque se obtiene por un método estadístico sobre lecturas repetidas','porque es más confiable que cualquier evaluación Tipo B','porque proviene de la resolución del instrumento','porque proviene del certificado del patrón'];
  const V=[{f:'s/√n',v:st.uA},{f:'s',v:st.s},{f:'s·√n',v:st.s*Math.sqrt(st.n)},{f:'s/n',v:st.s/st.n}];
  const t=(r,v)=>`Es Tipo A ${R[r]}; u_A = ${V[v].f} = ${fmboth(V[v].v)}.`;
  const K=(r,v)=>r+"|"+V[v].v.toFixed(5);
  const opciones=sinRepetir([
    fila(t(0,0),true,'El GUM (JCGM 100:2008, cláusula 4.2) clasifica Tipo A vs. Tipo B por el MÉTODO de evaluación (estadístico vs. no estadístico), no por cuál es "más confiable"; y la incertidumbre estándar de la MEDIA es s/√n, menor que la dispersión de las lecturas individuales.',K(0,0)),
    fila(t(0,1),false,W_VALOR,K(0,1)), fila(t(0,2),false,W_VALOR,K(0,2)), fila(t(0,3),false,W_VALOR,K(0,3)),
    fila(t(1,0),false,W_RAZON,K(1,0)), fila(t(2,0),false,W_RAZON,K(2,0)), fila(t(3,0),false,W_RAZON,K(3,0)), fila(t(1,1),false,W_RAZON,K(1,1)),
  ]);
  return {pregunta, opciones};
}
function tipoBResQuiz(){
  const r=RES_MM;
  const pregunta=`${CASES_GUM.tipoB_res.mision}<br>Resolución del instrumento: <b>${r.toFixed(3)} mm</b>.`;
  const op=(f,div,ok,why)=>fila(`u = ${f} = ${fmboth(div)}`,ok,why,div.toFixed(5));
  const opciones=sinRepetir([
    op(`resolución/√12 = ${r.toFixed(3)}/√12`,r/Math.sqrt(12),true,'Para una escala de resolución conocida se asume una distribución rectangular sobre la resolución COMPLETA (GUM, Anexo F.2.2.1): u = (resolución)/√12.'),
    op(`resolución/2 = ${r.toFixed(3)}/2`,r/2,false,W_VALOR),
    op(`resolución/√3 = ${r.toFixed(3)}/√3`,r/Math.sqrt(3),false,W_VALOR),
    op(`resolución = ${r.toFixed(3)}`,r,false,W_VALOR),
    op(`resolución/√6 = ${r.toFixed(3)}/√6`,r/Math.sqrt(6),false,W_VALOR),
    op(`resolución/12 = ${r.toFixed(3)}/12`,r/12,false,W_VALOR),
  ]);
  return {pregunta, opciones};
}
function tipoBCertQuiz(){
  const U=CERT_U_MM, k=CERT_K, otro=(k===2?3:2);
  const pregunta=`${CASES_GUM.tipoB_cert.mision}<br>Certificado del bloque patrón: <b>U = ${U.toFixed(4)} mm, k=${k}</b>.`;
  const op=(f,v,ok,why)=>fila(`u = ${f} = ${fmboth(v)}`,ok,why,v.toFixed(5));
  const opciones=sinRepetir([
    op(`U/k = ${U.toFixed(4)}/${k}`,U/k,true,'Cuando un certificado reporta una incertidumbre EXPANDIDA U con un factor de cobertura k, se recupera la incertidumbre estándar dividiendo entre k, la relación inversa de U=k·u (GUM, cláusula 6.2.1). El k se LEE del certificado.'),
    op(`U × k = ${U.toFixed(4)} × ${k}`,U*k,false,W_VALOR),
    op(`U = ${U.toFixed(4)}`,U,false,W_VALOR),
    op(`U/${otro} = ${U.toFixed(4)}/${otro}`,U/otro,false,W_VALOR),
    op(`U/√3 = ${U.toFixed(4)}/√3`,U/Math.sqrt(3),false,W_VALOR),
    op(`U/k² = ${U.toFixed(4)}/${k*k}`,U/(k*k),false,W_VALOR),
  ]);
  return {pregunta, opciones};
}
function combinarQuiz(){
  const st=gumStats(SET4);
  const t=[st.uA,st.uRes,st.uCert];
  const ord=t.slice().sort((a,b)=>b-a);
  const pregunta=`${CASES_GUM.combinar.mision}<br>u_A=${fm(st.uA)} · u_resolución=${fm(st.uRes)} · u_certificado=${fm(st.uCert)}. ¿Cuál es u_c?`;
  const op=(f,v,ok,why)=>fila(`u_c = ${f} ≈ ${fmboth(v)}`,ok,why,v.toFixed(5));
  const opciones=sinRepetir([
    op('√(u_A² + u_res² + u_cert²)',st.uc,true,'Ley de propagación de incertidumbre del GUM (ecuación 10), forma simplificada con coeficientes de sensibilidad 1: las fuentes se combinan en CUADRATURA (suma de cuadrados y raíz), nunca linealmente.'),
    op('u_A + u_res + u_cert',t[0]+t[1]+t[2],false,W_VALOR),
    op('la fuente dominante (la mayor de las tres)',ord[0],false,W_VALOR),
    op('el promedio de las tres',(t[0]+t[1]+t[2])/3,false,W_VALOR),
    op('√(suma de cuadrados de las dos mayores)',Math.hypot(ord[0],ord[1]),false,W_VALOR),
    op('√(u_A² + u_res² + U_cert²), con U sin dividir entre k',Math.sqrt(st.uA*st.uA+st.uRes*st.uRes+SET4.certU*SET4.certU),false,W_VALOR),
  ]);
  return {pregunta, opciones};
}
function expandidaQuiz(){
  const st=gumStats(SET5);
  const pregunta=`${CASES_GUM.expandida.mision}<br>u_c=${fm(st.uc)}, k=${K_EXP}, media=${st.mean.toFixed(4)} mm. ¿Cuál es U y qué significa el resultado?`;
  const OKC='aproximadamente el 95% si la distribución es aproximadamente normal';
  const op=(f,v,claim,ok,why)=>fila(`U = ${f} = ${fmboth(v)}; (${st.mean.toFixed(4)} ± ${v.toFixed(4)}) mm cubre ${claim}.`,ok,why,claim+"|"+v.toFixed(5));
  const opciones=sinRepetir([
    op(`k·u_c = ${K_EXP}×${fm(st.uc)}`,st.U,OKC,true,'GUM, cláusula 6.3.3: tomar k=2 produce un intervalo con un nivel de confianza de APROXIMADAMENTE 95%; la palabra "aproximadamente" y la suposición de normalidad son parte de la afirmación, no un detalle menor.'),
    op(`u_c/k = ${fm(st.uc)}/${K_EXP}`,st.uc/K_EXP,OKC,false,W_VALOR),
    op(`k·u_A = ${K_EXP}×${fm(st.uA)}`,K_EXP*st.uA,OKC,false,W_VALOR),
    op(`k²·u_c = ${K_EXP*K_EXP}×${fm(st.uc)}`,K_EXP*K_EXP*st.uc,OKC,false,W_VALOR),
    op(`k·u_c = ${K_EXP}×${fm(st.uc)}`,st.U,'exactamente el 95.00%, sin importar la distribución de los datos',false,W_CONCEPTO),
    op(`k·u_c = ${K_EXP}×${fm(st.uc)}`,st.U,'el 100% de los valores posibles',false,W_CONCEPTO),
  ]);
  return {pregunta, opciones};
}
function cadenaQuiz(){
  const pregunta='Caso 6 · Según el VIM (JCGM 200:2012, definición 2.41), ¿qué es la trazabilidad metrológica de un resultado de medición?';
  const opciones=[
    fila('Es la propiedad de un resultado por la que se liga a una referencia mediante una cadena documentada e ininterrumpida de calibraciones, cada una con su incertidumbre; por sí sola no asegura que ésta sea adecuada.',true,
      'Definición VIM 2.41 más su nota 5: la cadena documentada es la propiedad; la adecuación de la incertidumbre es un requisito APARTE que no se deduce solo de tener trazabilidad.'),
    fila('Es la garantía de que la medición es exacta: con un instrumento trazable ya no hace falta reportar la incertidumbre de medición, porque la cadena la absorbe completa en cada uno de sus eslabones.',false,W_CONCEPTO),
    fila('Es contar con un certificado de calibración del instrumento, sin importar su antigüedad ni qué laboratorio lo emitió, porque el papel mismo demuestra que existe una cadena hasta el patrón nacional.',false,W_CONCEPTO),
    fila('Es la propiedad de poder repetir la medición varias veces obteniendo el mismo resultado, es decir, que las lecturas repetidas coincidan entre sí dentro de la resolución del instrumento utilizado.',false,W_CONCEPTO),
    fila('Es la acreditación del laboratorio ante la EMA: si el laboratorio está acreditado, toda medición hecha en cualquier taller con sus instrumentos queda trazable de forma automática, aunque estos no se calibren.',false,W_CONCEPTO),
    fila('Es la comparación puntual del instrumento contra un patrón de taller en el momento de usarlo, sin necesidad de documentar el resultado ni la incertidumbre de ese patrón de referencia empleado.',false,W_CONCEPTO),
  ];
  return {pregunta, opciones};
}
function certificadoQuiz(){
  const pregunta='Caso 7 · Un compañero afirma que todo certificado de calibración conforme a ISO/IEC 17025 DEBE incluir, por defecto, la "fecha de la próxima calibración". Revisa el certificado del panel. ¿Es correcta esa afirmación?';
  const opciones=[
    fila('No. ISO/IEC 17025:2017 (§7.8.4.3) no la exige por defecto: solo si el cliente la solicita o una reglamentación la exige. Sí son obligatorios la incertidumbre, las condiciones y la trazabilidad.',true,
      '§7.8.4.3 de la norma es explícito: la fecha de próxima calibración es condicional (a petición del cliente o por reglamento), no un contenido por defecto; incertidumbre, condiciones y declaración de trazabilidad sí son de inclusión obligatoria (§7.8.4.1).'),
    fila('Sí, la norma la exige en todos los certificados sin excepción, porque sin esa fecha el certificado pierde validez y el instrumento no puede considerarse trazable en ningún uso posterior que se haga.',false,W_CONCEPTO),
    fila('No es necesario reportar la incertidumbre de medición en el certificado si el instrumento es de uso general; basta con indicar el resultado de la calibración y las condiciones ambientales de la prueba.',false,W_CONCEPTO),
    fila('El certificado no necesita declarar trazabilidad si el laboratorio está acreditado, porque la acreditación ya la garantiza de manera implícita para todas las calibraciones que emite ese mismo laboratorio.',false,W_CONCEPTO),
    fila('Sí, aunque la fije el cliente: el laboratorio debe calcularla siempre con la deriva histórica del instrumento y anotarla, ya que es el contenido más importante que exige el numeral citado de la norma.',false,W_CONCEPTO),
    fila('No, y además la norma la prohíbe: el laboratorio nunca debe sugerir un intervalo de recalibración aunque el cliente lo pida, pues eso corresponde exclusivamente al fabricante del instrumento que se calibra.',false,W_CONCEPTO),
  ];
  return {pregunta, opciones};
}
function currentQuiz(){
  if(moduleKey==='traz'){ return caseKey==='cadena' ? cadenaQuiz() : certificadoQuiz(); }
  return {tipoA:tipoAQuiz, tipoB_res:tipoBResQuiz, tipoB_cert:tipoBCertQuiz, combinar:combinarQuiz, expandida:expandidaQuiz}[caseKey]();
}

/* ============================================================
   ESCENA 3D — 1) ESTACIÓN DE MEDICIÓN (comparador + bloque patrón)
   ============================================================ */
/* Los nombres con los que trabaja la biblioteca de piezas (P3), traducidos una
   vez a los materiales de este laboratorio. */
const MATP={aluminio:MAT.steelDk, acero:MAT.steel, cromo:MAT.steel, chapa:MAT.steelDk,
  cobre:std({color:0xb87333,roughness:0.35,metalness:0.75}), negro:MAT.bezel, goma:MAT.bezel,
  blanco:std({color:0xd7dee6,roughness:0.4,metalness:0.2}), ceramica:std({color:0xd7dee6,roughness:0.6,metalness:0.05})};
const stationG=new THREE.Group(); stationG.position.set(-2.4,0,0); scene.add(stationG);

const plate=roundedBox(1.7,0.09,1.05,MAT.granite,0.03); plate.position.set(0,0.045,0); stationG.add(plate);
plate.userData={title:'Placa de referencia (granito)',info:'Superficie plana de referencia sobre la que descansan la pieza y la base del comparador — ISO 1 fija 20 °C como temperatura de referencia para metrología dimensional.'};
const lbPlate=labelSprite('Placa de referencia','#8a949c'); lbPlate.position.set(0,0.32,0.5); lbPlate.visible=false; lbPlate.raycast=()=>{}; stationG.add(lbPlate); HOVER_LABELS.set(plate,lbPlate);

/* El bloque se pone DEBAJO del palpador, no a un lado: la practica mide cinco
   veces la misma pieza sin desmontarla, y con el bloque descolocado el 3D
   ensenaba un palpador midiendo el aire. */
const gaugeBlk=sh(new THREE.Mesh(new THREE.BoxGeometry(0.30,0.14,0.22),MAT.gaugeBlk));
gaugeBlk.position.set(0.35,0.16,0.06); stationG.add(gaugeBlk);
/* Un bloque patron lleva GRABADA su dimension nominal: es su identidad, y es lo
   que se contrasta contra el certificado. */
const blkCanvas=document.createElement('canvas'); blkCanvas.width=256; blkCanvas.height=192;
(function(){ const c=blkCanvas.getContext('2d');
  c.fillStyle='#b8952a'; c.fillRect(0,0,256,192);
  c.fillStyle='#3a2f0c'; c.textAlign='center'; c.font='bold 96px system-ui';
  c.fillText('10', 128, 108); c.font='bold 34px system-ui'; c.fillText('mm', 128, 150); })();
const blkTex=new THREE.CanvasTexture(blkCanvas); blkTex.colorSpace=THREE.SRGBColorSpace;
blkTex.minFilter=THREE.LinearFilter; blkTex.generateMipmaps=false;
const blkMarca=new THREE.Mesh(new THREE.PlaneGeometry(0.13,0.098),
  new THREE.MeshStandardMaterial({map:blkTex, roughness:0.42, metalness:0.35}));
blkMarca.position.set(0.35,0.16,0.1705); stationG.add(blkMarca);
blkMarca.userData={title:'Grabado del bloque patrón',info:'La dimensión nominal va grabada en el propio bloque: es su identidad y lo que se contrasta contra el número del certificado de calibración.'};
gaugeBlk.userData={title:'Bloque patrón (pieza bajo prueba)',info:'Dimensión nominal 10 mm. Se mide 5 veces con el comparador para estimar la repetibilidad (Tipo A) — la misma pieza, sin desmontarla entre lecturas.'};
const lbBlk=labelSprite('Bloque patrón · Ø nominal 10 mm','#C9A227'); lbBlk.position.set(0.20,0.42,0.30); lbBlk.visible=false; lbBlk.raycast=()=>{}; stationG.add(lbBlk); HOVER_LABELS.set(gaugeBlk,lbBlk);

/* LA BASE MAGNETICA: un taco de acero escalonado con su ranura en V —que es lo
   que le permite agarrar también un cilindro— y la palanca que conecta el iman. */
const compBase=new THREE.Group(); compBase.position.set(-0.15,0.09,-0.10); stationG.add(compBase);
{
  const b1=sh(roundedBox(0.30,0.045,0.30,MAT.base,0.015)); b1.position.y=0.0225; compBase.add(b1);
  const b2=sh(roundedBox(0.20,0.07,0.20,MAT.steelDk,0.012)); b2.position.y=0.045+0.035; compBase.add(b2);
  const v=new THREE.Mesh(new THREE.BoxGeometry(0.205,0.012,0.030),MAT.bezel); v.position.set(0,0.116,0.07); compBase.add(v);
  for(const sx of [-1,1]){ const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.012,8),MAT.steel); tr.position.set(sx*0.12,0.051,0.12); compBase.add(tr); }
}
/* LA PALANCA de la base magnetica: es lo que la enciende y la apaga, y lo que
   la distingue de un taco de acero cualquiera. */
const compPalanca=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.11,10),MAT.bezel));
compPalanca.rotation.x=Math.PI/2; compPalanca.position.set(-0.04,0.11,0.06); stationG.add(compPalanca);
compPalanca.userData={title:'Palanca de la base magnética',info:'Conecta y desconecta el imán permanente. Sin ella la base no agarra, y un comparador que se mueve entre lecturas mete en la repetibilidad un error que no es del operador ni del instrumento.'};
compBase.userData={title:'Base magnética',info:'Fija el comparador de forma rígida sobre la placa de referencia.'};
const compPost=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.85,12),MAT.steelDk));
compPost.position.set(-0.15,0.53,-0.10); stationG.add(compPost);
const compArmH=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.5,12),MAT.steelDk));
compArmH.rotation.z=Math.PI/2; compArmH.position.set(0.1,0.90,-0.10); stationG.add(compArmH);
const compArmV=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.22,12),MAT.steelDk));
compArmV.position.set(0.35,0.79,-0.10); stationG.add(compArmV);

/* El COMPARADOR de verdad: caja con su bisel moleteado, la orejeta trasera por
   donde lo sujeta el brazo, y el casquillo por donde sale el palpador. */
const dialBezel=P3.comparadorCaratula(MATP,{R:0.26,fondo:0.08}); dialBezel.position.set(0.35,0.66,0.02); stationG.add(dialBezel);
for(const [cx,cy,cz] of [[0.35,0.855,-0.075],[-0.15,0.90,-0.10],[0.35,0.90,-0.10]]){   // las mordazas cruzadas del soporte
  const cc=sh(roundedBox(0.09,0.09,0.09,MAT.steelDk,0.012)); cc.position.set(cx,cy,cz); stationG.add(cc);
}
const stubDial=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.10,10),MAT.steel)); stubDial.rotation.x=Math.PI/2; stubDial.position.set(0.35,0.80,-0.08); stationG.add(stubDial);
const dialCanvas=document.createElement('canvas'); dialCanvas.width=384; dialCanvas.height=384;
const dialTex=new THREE.CanvasTexture(dialCanvas); dialTex.colorSpace=THREE.SRGBColorSpace; dialTex.minFilter=THREE.LinearFilter; dialTex.generateMipmaps=false;
const dialFace=new THREE.Mesh(new THREE.CircleGeometry(0.228,56), new THREE.MeshBasicMaterial({map:dialTex,toneMapped:false}));
dialFace.position.set(0.35,0.66,0.050); stationG.add(dialFace);
dialFace.userData={title:'Carátula del comparador',info:'Nota de fidelidad: la deflexión de la aguja está EXAGERADA a propósito para que sea visible — las desviaciones reales de este ejercicio son de unas pocas décimas de micra. El valor autoritativo es siempre el número, no el ángulo de la aguja.'};
const plunger=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.24,14),MAT.steel));
plunger.position.set(0.35,0.42,0.06); stationG.add(plunger);
plunger.userData={title:'Palpador (husillo)',info:'Toca el bloque patrón y transmite su posición a la aguja de la carátula.'};
/* EL VASTAGO y la PUNTA DE CONTACTO. La bolita toca la pieza en UN punto, y por
   eso lo que se mide es la altura de ese punto; ademas ahora APOYA de verdad en
   el bloque, en vez de quedarse a siete centesimas por encima. */
const plungerRod=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.07,10),MAT.steel));
plungerRod.position.set(0.35,0.275,0.06); stationG.add(plungerRod);
plungerRod.userData=plunger.userData;
const plungerBall=sh(new THREE.Mesh(new THREE.SphereGeometry(0.024,16,12),MAT.bezel));
plungerBall.position.set(0.35,0.254,0.06); stationG.add(plungerBall);
plungerBall.userData={title:'Punta de contacto',info:'Bolita de metal duro en el extremo del palpador: toca el bloque en un solo punto.'};
const lbComp=labelSprite('Comparador de carátula','#4FD1C5'); lbComp.position.set(0.35,0.98,0.15); lbComp.visible=false; lbComp.raycast=()=>{}; stationG.add(lbComp); HOVER_LABELS.set(dialFace,lbComp);

// Placa pequeña: resolución del comparador
const resPlaqueStand=sh(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.4,0.03),MAT.base)); resPlaqueStand.position.set(0.62,0.2,0.32); stationG.add(resPlaqueStand);
const resCanvas=document.createElement('canvas'); resCanvas.width=256; resCanvas.height=180;
const resTex=new THREE.CanvasTexture(resCanvas); resTex.colorSpace=THREE.SRGBColorSpace; resTex.minFilter=THREE.LinearFilter; resTex.generateMipmaps=false;
const resPanel=new THREE.Mesh(new THREE.PlaneGeometry(0.36,0.25), new THREE.MeshBasicMaterial({map:resTex,toneMapped:false}));
resPanel.position.set(0.62,0.52,0.33); stationG.add(resPanel);
resPanel.userData={title:'Especificación · resolución del instrumento',info:'Dato Tipo B: la resolución del instrumento (la de la placa) se convierte en incertidumbre estándar asumiendo una distribución rectangular, u = resolución/√12.'};
const lbRes=labelSprite('Resolución del instrumento','#4FD1C5'); lbRes.position.set(0.62,0.72,0.33); lbRes.visible=false; lbRes.raycast=()=>{}; stationG.add(lbRes); HOVER_LABELS.set(resPanel,lbRes);

// Placa pequeña: certificado del bloque patrón
const certPlaqueStand=sh(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.4,0.03),MAT.base)); certPlaqueStand.position.set(-0.55,0.2,0.32); stationG.add(certPlaqueStand);
const certCanvas=document.createElement('canvas'); certCanvas.width=256; certCanvas.height=180;
const certTex=new THREE.CanvasTexture(certCanvas); certTex.colorSpace=THREE.SRGBColorSpace; certTex.minFilter=THREE.LinearFilter; certTex.generateMipmaps=false;
const certPanel=new THREE.Mesh(new THREE.PlaneGeometry(0.36,0.25), new THREE.MeshBasicMaterial({map:certTex,toneMapped:false}));
certPanel.position.set(-0.55,0.52,0.33); stationG.add(certPanel);
certPanel.userData={title:'Certificado · bloque patrón de referencia',info:'Dato Tipo B: la incertidumbre expandida del certificado (U, k) se convierte en incertidumbre estándar dividiendo entre el factor de cobertura, u = U/k.'};
const lbCert=labelSprite('Certificado del bloque patrón','#C9A227'); lbCert.position.set(-0.55,0.72,0.33); lbCert.visible=false; lbCert.raycast=()=>{}; stationG.add(lbCert); HOVER_LABELS.set(certPanel,lbCert);

/* ============================================================
   ESCENA 3D — 2) CADENA DE TRAZABILIDAD (3 nodos + certificado)
   ============================================================ */
const chainG=new THREE.Group(); scene.add(chainG);
const NODE_X={cenam:1.2, lab:2.6, taller:4.0};

function makeNode(x,mat,title,info,label,color,objeto){
  const g=new THREE.Group(); g.position.set(x,0,0); chainG.add(g);
  const ped=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.40,0.55,10),mat));
  ped.position.set(0,0.275,0); g.add(ped);
  const top=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.40,0.40,0.03,10),MAT.base)); top.position.set(0,0.565,0); g.add(top);
  const obj=objeto(); obj.position.y=0.58; g.add(obj);
  g.userData={title,info};
  const lb=labelSprite(label,color); lb.position.set(x,1.30,0); lb.scale.multiplyScalar(0.62); chainG.add(lb); // siempre visible
  return g;
}
/* CENAM: el patrón primario. Un interferometro laser —la longitud se define con la
   longitud de onda de la luz— con su cabezal, su divisor de haz y los dos espejos. */
function interferometro(){
  const g=new THREE.Group();
  const base=sh(roundedBox(0.66,0.03,0.46,MAT.steelDk,0.01)); base.position.set(0,0.015,0); g.add(base);
  const cab=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.34,22),MAT.base)); cab.rotation.z=Math.PI/2; cab.position.set(-0.19,0.13,0); g.add(cab);
  const col=new THREE.Mesh(new THREE.CylinderGeometry(0.076,0.076,0.04,22),MAT.steel); col.rotation.z=Math.PI/2; col.position.set(-0.03,0.13,0); g.add(col);
  for(const sx of [-0.30,-0.08]){ const so=sh(new THREE.Mesh(new THREE.BoxGeometry(0.05,0.07,0.10),MAT.steelDk)); so.position.set(sx,0.065,0); g.add(so); }
  const haz=std({color:0x300000,emissive:0xff2a1a,emissiveIntensity:0.55,roughness:0.5});
  const h1=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.25,6),haz); h1.rotation.z=Math.PI/2; h1.position.set(0.155,0.13,0); g.add(h1);
  const h2=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.17,6),haz); h2.rotation.x=Math.PI/2; h2.position.set(0.14,0.13,-0.085); g.add(h2);
  const div=new THREE.Mesh(new THREE.BoxGeometry(0.075,0.075,0.075),std({color:0x9fd6e0,roughness:0.08,metalness:0.2,transparent:true,opacity:0.55}));
  div.position.set(0.14,0.13,0); g.add(div);
  const esp1=sh(new THREE.Mesh(new THREE.BoxGeometry(0.11,0.10,0.014),MAT.steel)); esp1.position.set(0.14,0.13,-0.185); g.add(esp1);
  const esp2=sh(new THREE.Mesh(new THREE.BoxGeometry(0.014,0.10,0.11),MAT.steel)); esp2.position.set(0.27,0.13,0); g.add(esp2);
  const car=sh(roundedBox(0.07,0.04,0.15,MAT.steelDk,0.01)); car.position.set(0.27,0.045,0); g.add(car);
  const det=sh(roundedBox(0.09,0.07,0.07,MAT.base,0.01)); det.position.set(0.14,0.065,0.19); g.add(det);
  return g;
}
/* El laboratorio acreditado: el estuche de bloques patron, que es de lo que vive
   —los bloques se comparan contra el patron nacional y de ahi calibran los
   instrumentos de taller—. Abierto, con sus bloques por filas en su espuma. */
function estucheBloques(){
  const g=new THREE.Group();
  const cs=std({color:0x1b2128,roughness:0.55,metalness:0.2});
  const caja=sh(roundedBox(0.66,0.07,0.42,cs,0.02)); caja.position.set(0,0.035,0); g.add(caja);
  const esp=new THREE.Mesh(new THREE.BoxGeometry(0.60,0.012,0.36),std({color:0x0b0e12,roughness:0.95})); esp.position.set(0,0.07,0); g.add(esp);
  const tapa=sh(roundedBox(0.66,0.04,0.42,cs,0.02)); tapa.position.set(0,0.20,-0.25); tapa.rotation.x=-1.25; g.add(tapa);
  const largos=[0.06,0.075,0.09,0.105,0.12,0.14];
  for(let r=0;r<2;r++) for(let i=0;i<6;i++){
    const bl=sh(new THREE.Mesh(new THREE.BoxGeometry(0.05,0.012+i*0.002,largos[i]),MAT.gaugeBlk));
    bl.position.set(-0.23+i*0.092,0.078+0.006,-0.08+r*0.17); g.add(bl);
  }
  return g;
}
/* El instrumento de taller: un micrometro de exteriores, lo que tiene en la mano
   el operador de verdad. */
function micrometroNodo(){
  const g=new THREE.Group();
  const m=P3.micrometro(MATP,{R:0.30,brazo:0.20,apertura:0.16}); m.scale.setScalar(0.80);
  m.position.set(-0.28,0.30*0.80+0.02,0); m.rotation.y=0.35; g.add(m);
  return g;
}
const nodeCenam=makeNode(NODE_X.cenam, MAT.pedCenam,
  'CENAM — Centro Nacional de Metrología',
  'Instituto Nacional de Metrología de México (Ley de Infraestructura de la Calidad, vigente desde el 1 de julio de 2020). Mantiene los patrones nacionales de medición y es, por definición legal, el origen de la trazabilidad en el país — el eslabón más alto de la cadena.',
  'CENAM','#C9A227',interferometro);
const nodeLab=makeNode(NODE_X.lab, MAT.pedLab,
  'Laboratorio de calibración acreditado (EMA)',
  'Acreditado por la EMA (Entidad Mexicana de Acreditación, A.C.) bajo la norma NMX-EC-17025-IMNC-2018 (idéntica a ISO/IEC 17025:2017). Calibra instrumentos de taller usando patrones con trazabilidad documentada a CENAM, y emite certificados de calibración con incertidumbre y trazabilidad declaradas.',
  'Lab. acreditado (EMA/ISO 17025)','#4FD1C5',estucheBloques);
const nodeTaller=makeNode(NODE_X.taller, MAT.pedTaller,
  'Instrumento de taller',
  'El comparador o micrómetro que usa el operador día a día. Su trazabilidad depende de que exista una cadena ININTERRUMPIDA y documentada hasta CENAM — tener "un papel" no basta si la cadena está rota o el certificado no declara incertidumbre (VIM 2.41, nota 5).',
  'Instrumento de taller','#8a949c',micrometroNodo);

function makeLink(x1,x2){
  const len=x2-x1;
  const link=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,len,10),MAT.link));
  link.rotation.z=Math.PI/2; link.position.set((x1+x2)/2,0.32,0); chainG.add(link);
  link.userData={title:'Eslabón de la cadena de trazabilidad',info:'Cada eslabón es una calibración DOCUMENTADA, con su propia incertidumbre declarada — una cadena rota o sin incertidumbre reportada no es trazabilidad, aunque exista "un papel".'};
  return link;
}
const link1=makeLink(NODE_X.cenam,NODE_X.lab);
const link2=makeLink(NODE_X.lab,NODE_X.taller);

// Tablero grande: certificado de calibración del laboratorio acreditado
const boardStand=sh(new THREE.Mesh(new THREE.BoxGeometry(0.05,1.1,0.05),MAT.base)); boardStand.position.set(NODE_X.lab,0.55,-0.55); chainG.add(boardStand);
const boardCanvas=document.createElement('canvas'); boardCanvas.width=560; boardCanvas.height=420;
const boardTex=new THREE.CanvasTexture(boardCanvas); boardTex.colorSpace=THREE.SRGBColorSpace; boardTex.minFilter=THREE.LinearFilter; boardTex.generateMipmaps=false;
const boardMesh=new THREE.Mesh(new THREE.PlaneGeometry(1.3,0.98), new THREE.MeshBasicMaterial({map:boardTex,toneMapped:false}));
boardMesh.position.set(NODE_X.lab,1.55,-0.55); chainG.add(boardMesh);
const boardMarco=sh(new THREE.Mesh(P3.extruido(P3.contornoRedondeado([[-0.70,-0.53],[0.70,-0.53],[0.70,0.53],[-0.70,0.53]],0.03,3),
  {huecos:[[[-0.65,-0.49],[0.65,-0.49],[0.65,0.49],[-0.65,0.49]]],espesor:0.06,bisel:0.01}),MAT.base));
boardMarco.position.set(NODE_X.lab,1.55,-0.57); chainG.add(boardMarco);
const boardTras=sh(new THREE.Mesh(new THREE.BoxGeometry(1.40,1.06,0.02),MAT.base)); boardTras.position.set(NODE_X.lab,1.55,-0.585); chainG.add(boardTras);
boardMesh.userData={title:'Certificado de calibración (laboratorio acreditado)',info:'Certificado ilustrativo: incluye incertidumbre, condiciones y declaración de trazabilidad (ISO/IEC 17025 §7.8) — y OMITE a propósito la "próxima fecha de calibración", que la norma no exige por defecto (§7.8.4.3).'};
const lbBoard=labelSprite('Certificado de calibración','#EAF4F1'); lbBoard.position.set(NODE_X.lab,2.10,-0.55); lbBoard.visible=false; lbBoard.raycast=()=>{}; chainG.add(lbBoard); HOVER_LABELS.set(boardMesh,lbBoard);

S.start();

/* ============================================================
   HUD (izquierda)
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Instrumentación · Metrología — incertidumbre y trazabilidad</div>
  <h2>Incertidumbre de Medición (GUM) y Trazabilidad Metrológica</h2>
  <p>Ninguna medición es un número "exacto": siempre viene acompañada de una incertidumbre que describe qué tan bien se conoce ese valor. Este laboratorio construye un presupuesto de incertidumbre completo —repetibilidad (Tipo A), resolución del instrumento y certificado del patrón de referencia (Tipo B)— y verifica la cadena de trazabilidad que hace que ese presupuesto tenga sentido: sin una referencia documentada hasta CENAM, ninguna incertidumbre es comparable entre talleres.</p>
  <div class="formula">u_c = √(u_A² + u_B1² + u_B2² + …) · U = k·u_c (k=2 → ~95%, GUM cl. 6.3.3)<br>u(resolución) = resolución/√12 · u(certificado) = U_cert/k_cert</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#C9A227"></span>Bloque patrón / CENAM (referencia nacional)</div>
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Comparador / Laboratorio acreditado (EMA)</div>
    <div class="li"><span class="dot" style="background:#8a949c"></span>Instrumento de taller</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el cálculo real de las componentes de un presupuesto de incertidumbre GUM (media, desviación estándar experimental, u_A=s/√n; resolución con distribución rectangular u=res/√12; incertidumbre de certificado u=U/k); la combinación por ley de propagación (suma en cuadratura, u_c=√Σu²); la incertidumbre expandida U=k·u_c con k=2 (~95%, GUM cl. 6.3.3); y la cadena de trazabilidad documentada (CENAM → laboratorio acreditado EMA/ISO 17025 → instrumento de taller) con el contenido mínimo real de un certificado de calibración (ISO/IEC 17025 §7.8).</div>
    <div class="fl no"><b>NO modela:</b> coeficientes de sensibilidad distintos de 1 (la fórmula simplificada u_c=√Σu² asume que cada fuente pesa igual — la ley de propagación general del GUM, ecuación 10, incluye coeficientes c_i que aquí no hacen falta porque el ejercicio es una suma directa de fuentes); grados de libertad efectivos ni el método Welch–Satterthwaite (el GUM completo, Anexo H.1, lo usa con pocos grados de libertad — aquí se usa la aproximación estándar k=2≈95%); deriva térmica ni dilatación diferencial entre pieza e instrumento; y la aguja del comparador tiene una deflexión EXAGERADA para que sea visible en pantalla — el valor autoritativo es siempre el texto numérico, nunca el ángulo de la aguja.</div>
  </div>
  <div class="src">Ref: JCGM 100:2008 "GUM" · JCGM 200:2012 "VIM" (3ª ed.) · ISO/IEC 17025:2017 · NMX-EC-17025-IMNC-2018 (IDT) · NMX-CH-140-IMNC-2002 · Ley de Infraestructura de la Calidad (CENAM) · EMA, Entidad Mexicana de Acreditación</div>`;

/* ============================================================
   PANEL (derecha)
   ============================================================ */
document.getElementById('panel').innerHTML=`
  <h4>Incertidumbre y Trazabilidad · <span id="p_case" style="color:var(--accent2)">Caso 1/5</span></h4>
  <div class="modebar" id="instbar">
    <button class="b on" id="i_gum">Incertidumbre (GUM)</button>
    <button class="b" id="i_traz">Trazabilidad</button>
  </div>
  <div class="modebar" id="casebar"></div>
  <div id="tele">
    <div class="g"><div class="gl"><span>Dato/valor</span><b id="t_raw">—</b></div></div>
    <div class="g"><div class="gl"><span>Referencia</span><b id="t_ref">—</b></div></div>
    <div class="g"><div class="gl"><span>Fórmula</span><b id="t_lc">—</b></div></div>
    <div class="g"><div class="gl"><span>Caso</span><b id="t_case">—</b></div></div>
    <div class="g"><div class="gl"><span>Estado</span><b id="t_est">—</b></div></div>
  </div>
  <div class="console" id="report">Toca "Tomar lectura" para registrar la primera de las 5 lecturas repetidas.</div>
  <div class="modebar" id="stepWrap" style="display:none">
    <button class="b" id="btnStep">📏 Tomar lectura (0/5)</button>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido automático (guiado)</button>
    <button class="b primary" id="btnJaws">🔍 Revisar dato</button>
    <button class="b" id="btnNew">🔀 Nuevo caso</button>
  </div>`;

const el=id=>document.getElementById(id);

/* ---------- paneles/carátula ---------- */
function drawDial(value){
  const c=dialCanvas.getContext('2d');
  const cx=192,cy=170,R=130;
  c.fillStyle='#0a1512'; c.fillRect(0,0,384,384);
  c.fillStyle='#0e1a17'; c.beginPath(); c.arc(cx,cy,R+8,0,Math.PI*2); c.fill();
  c.strokeStyle='rgba(79,209,197,.4)'; c.lineWidth=3; c.beginPath(); c.arc(cx,cy,R+8,0,Math.PI*2); c.stroke();
  for(let i=0;i<100;i++){
    const ang=(i/100)*Math.PI*2-Math.PI/2, major=i%10===0;
    const r1=R, r2=major?R-16:R-8;
    c.strokeStyle=major?'#EAF4F1':'#5b8a80'; c.lineWidth=major?2.4:1.2;
    c.beginPath(); c.moveTo(cx+Math.cos(ang)*r1,cy+Math.sin(ang)*r1); c.lineTo(cx+Math.cos(ang)*r2,cy+Math.sin(ang)*r2); c.stroke();
  }
  // deflexión EXAGERADA a propósito (ver contrato de fidelidad) — solo para que se vea algo en pantalla
  const dev = value==null ? 0 : (value-10.000);
  const needleAng=(dev/READ_STEP*30-90)*Math.PI/180;
  c.strokeStyle='#FFD166'; c.lineWidth=4; c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(needleAng)*(R-24),cy+Math.sin(needleAng)*(R-24)); c.stroke();
  c.fillStyle='#FFD166'; c.beginPath(); c.arc(cx,cy,8,0,Math.PI*2); c.fill();
  c.fillStyle='#4FD1C5'; c.font='bold 12px Outfit, sans-serif'; c.textAlign='center';
  c.fillText('0.001 mm/división (aguja ilustrativa)',cx,30);
  c.fillStyle='#EAF4F1'; c.font='bold 22px Outfit, sans-serif';
  c.fillText(value==null?'— mm':value.toFixed(4)+' mm',cx,325);
  c.fillStyle='#8FB3AC'; c.font='13px Outfit, sans-serif';
  c.fillText('Lectura '+readIdx+'/'+READINGS_MM.length,cx,352);
  dialTex.needsUpdate=true;
}
function drawResPanel(){
  const c=resCanvas.getContext('2d');
  c.fillStyle='#0a1512'; c.fillRect(0,0,256,180);
  c.strokeStyle='rgba(79,209,197,.45)'; c.lineWidth=3; c.strokeRect(4,4,248,172);
  c.fillStyle='#4FD1C5'; c.font='bold 15px Outfit, sans-serif'; c.textAlign='center';
  c.fillText('INSTRUMENTO',128,34);
  c.fillStyle='#EAF4F1'; c.font='bold 24px Outfit, sans-serif';
  c.fillText(RES_MM.toFixed(3)+' mm',128,92);
  c.fillStyle='#8FB3AC'; c.font='13px Outfit, sans-serif';
  c.fillText('resolución ('+(RES_MM*1000).toFixed(0)+' µm/división)',128,120);
  c.fillStyle='#5b8a80'; c.font='11px Outfit, sans-serif';
  c.fillText('dato Tipo B',128,150);
  resTex.needsUpdate=true;
}
function drawCertPanel(){
  const c=certCanvas.getContext('2d');
  c.fillStyle='#0a1512'; c.fillRect(0,0,256,180);
  c.strokeStyle='rgba(201,162,39,.5)'; c.lineWidth=3; c.strokeRect(4,4,248,172);
  c.fillStyle='#C9A227'; c.font='bold 14px Outfit, sans-serif'; c.textAlign='center';
  c.fillText('BLOQUE PATRÓN · CERTIFICADO',128,32);
  c.fillStyle='#EAF4F1'; c.font='bold 22px Outfit, sans-serif';
  c.fillText('U = '+CERT_U_MM.toFixed(4)+' mm',128,86);
  c.fillStyle='#8FB3AC'; c.font='13px Outfit, sans-serif';
  c.fillText('k = '+CERT_K+' (factor de cobertura)',128,112);
  c.fillStyle='#4FD1C5'; c.font='12px Outfit, sans-serif';
  c.fillText('trazable a CENAM',128,140);
  c.fillStyle='#5b8a80'; c.font='11px Outfit, sans-serif';
  c.fillText('dato Tipo B',128,162);
  certTex.needsUpdate=true;
}
function drawBoard(){
  const c=boardCanvas.getContext('2d');
  c.fillStyle='#0c1216'; c.fillRect(0,0,560,420);
  c.strokeStyle='rgba(234,244,241,.35)'; c.lineWidth=3; c.strokeRect(5,5,550,410);
  c.fillStyle='#EAF4F1'; c.font='bold 20px Outfit, sans-serif'; c.textAlign='center';
  c.fillText('CERTIFICADO DE CALIBRACIÓN (ilustrativo)',280,38);
  c.textAlign='left'; c.font='14px Outfit, sans-serif';
  const rows=[
    ['Laboratorio:', 'Acreditado EMA · NMX-EC-17025-IMNC-2018'],
    ['Instrumento:', 'Comparador de carátula, resolución 0.001 mm'],
    ['Condiciones:', '20 °C de referencia (ISO 1) ± rango declarado'],
    ['Incertidumbre expandida:', 'U = '+LAB_U_MM.toFixed(4)+' mm, k=2 (~95%)'],
    ['Trazabilidad:', 'Trazable a patrones nacionales (CENAM) vía este laboratorio'],
  ];
  let y=76;
  for(const [k,v] of rows){
    c.fillStyle='#4FD1C5'; c.fillText(k,28,y);
    c.fillStyle='#EAF4F1'; c.fillText(v,28,y+20);
    y+=54;
  }
  c.strokeStyle='rgba(255,209,102,.4)'; c.lineWidth=1.5;
  c.beginPath(); c.moveTo(20,y+2); c.lineTo(540,y+2); c.stroke();
  c.fillStyle='#8FB3AC'; c.font='12px Outfit, sans-serif';
  c.fillText('Ilustrativo: los campos mostrados son los del certificado de este laboratorio.',28,y+26);
  boardTex.needsUpdate=true;
}
drawResPanel(); drawCertPanel(); drawBoard(); drawDial(null);

/* ---------- telemetría e informe ---------- */
/* El resultado de un cálculo NO se escribe en el panel hasta que el caso está
   respondido (o la demostración lo enseña): el panel da los DATOS, el
   alumno hace la cuenta. */
const revela=()=>!!answered[caseKey]||autoRunning;
function updateTele(){
  const set=(id,txt,cls)=>{ const b=el(id); b.textContent=txt; b.className=cls||''; };
  if(moduleKey==='gum'){
    if(caseKey==='tipoA'){
      const last=readIdx>0?READINGS_MM[readIdx-1].toFixed(4)+' mm':'—';
      set('t_raw', last, readIdx>0?'good':'');
      set('t_ref', readIdx>0?meanOf(READINGS_MM.slice(0,readIdx)).toFixed(4)+' mm (media parcial)':'—','');
      set('t_lc','u_A = s/√n','');
      set('t_case', 'Lectura '+readIdx+'/'+READINGS_MM.length,'');
      set('t_est', active?'5/5 completas':'En progreso', active?'good':'warn');
    } else if(caseKey==='tipoB_res'){
      set('t_raw', RES_MM.toFixed(3)+' mm', active?'good':'');
      set('t_ref', 'distribución rectangular','warn');
      set('t_lc','u = resolución/√12','');
      set('t_case', CASES_GUM.tipoB_res.nombre,'');
      set('t_est', active?'Revisado':'Sin revisar', active?'good':'warn');
    } else if(caseKey==='tipoB_cert'){
      set('t_raw', 'U='+CERT_U_MM.toFixed(4)+' mm, k='+CERT_K, active?'good':'');
      set('t_ref', 'certificado del bloque patrón','warn');
      set('t_lc','u = U/k','');
      set('t_case', CASES_GUM.tipoB_cert.nombre,'');
      set('t_est', active?'Revisado':'Sin revisar', active?'good':'warn');
    } else if(caseKey==='combinar'){
      const st=gumStats(SET4);
      set('t_raw', revela()?st.uc.toFixed(5)+' mm':(active?'— (calcúlalo)':'—'), active&&revela()?'good':'');
      set('t_ref', 'u_A, u_res, u_cert','warn');
      set('t_lc','u_c = √Σu² (cuadratura)','');
      set('t_case', CASES_GUM.combinar.nombre,'');
      set('t_est', active?'Datos a la vista':'Sin revisar', active?'good':'warn');
    } else {
      const st=gumStats(SET5);
      set('t_raw', revela()?st.U.toFixed(5)+' mm':(active?'— (calcúlalo)':'—'), active&&revela()?'good':'');
      set('t_ref', 'k=2 (~95%)','warn');
      set('t_lc','U = k·u_c','');
      set('t_case', CASES_GUM.expandida.nombre,'');
      set('t_est', active?'Datos a la vista':'Sin revisar', active?'good':'warn');
    }
  } else {
    if(caseKey==='cadena'){
      set('t_raw', '3 eslabones', active?'good':'');
      set('t_ref', 'CENAM → Lab acreditado → Taller','warn');
      set('t_lc','VIM 2.41','');
      set('t_case', CASES_TRAZ.cadena.nombre,'');
      set('t_est', active?'Inspeccionado':'Sin inspeccionar', active?'good':'warn');
    } else {
      set('t_raw', '5 campos', active?'good':'');
      set('t_ref', 'ISO/IEC 17025 §7.8','warn');
      set('t_lc','contenido mínimo','');
      set('t_case', CASES_TRAZ.certificado.nombre,'');
      set('t_est', active?'Revisado':'Sin revisar', active?'good':'warn');
    }
  }
}
function updateReport(){
  let html='';
  if(moduleKey==='gum'){
    if(caseKey==='tipoA'){
      if(readIdx===0){ html='<span class="mono">Sin lecturas aún. Pulsa "Tomar lectura" para registrar la primera de 5.</span>'; }
      else{
        const st=gumStats();
        const taken=READINGS_MM.slice(0,readIdx);
        html=`<b>${CASES_GUM.tipoA.mision}</b><br><span class="mono">Lecturas: ${taken.map(v=>v.toFixed(4)).join(' · ')} mm`;
        if(readIdx===READINGS_MM.length){
          html+= revela()
            ? `<br>Media = ${st.mean.toFixed(4)} mm · s = ${fm(st.s)} · u_A = s/√${st.n} = <b>${fmboth(st.uA)}</b></span>`
            : `<br>Con estas ${st.n} lecturas calcula la media, s y u_A, y responde.</span>`;
        } else { html+=` (${readIdx}/${READINGS_MM.length})</span>`; }
      }
    } else if(caseKey==='tipoB_res'){
      const st=gumStats();
      html = active
        ? `<b>${CASES_GUM.tipoB_res.mision}</b><br><span class="mono">Resolución = ${RES_MM.toFixed(3)} mm`+(revela()?` → u_res = resolución/√12 = <b>${fmboth(st.uRes)}</b>`:' → convierte esa especificación en incertidumbre estándar y responde.')+'</span>'
        : '<span class="mono">Pulsa "Revisar dato" para inspeccionar la especificación del instrumento.</span>';
    } else if(caseKey==='tipoB_cert'){
      const st=gumStats();
      html = active
        ? `<b>${CASES_GUM.tipoB_cert.mision}</b><br><span class="mono">Certificado: U = ${CERT_U_MM.toFixed(4)} mm, k=${CERT_K}`+(revela()?` → u_cert = U/k = <b>${fmboth(st.uCert)}</b>`:' → obtén la incertidumbre estándar de esta fuente y responde.')+'</span>'
        : '<span class="mono">Pulsa "Revisar dato" para inspeccionar el certificado del bloque patrón.</span>';
    } else if(caseKey==='combinar'){
      const st=gumStats(SET4);
      html = active
        ? `<b>${CASES_GUM.combinar.mision}</b><br><span class="mono">u_A=${fm(st.uA)} · u_res=${fm(st.uRes)} · u_cert=${fm(st.uCert)}`+(revela()?`<br>u_c = √(u_A²+u_res²+u_cert²) = <b>${fmboth(st.uc)}</b>`:'<br>Combina las tres fuentes y responde.')+'</span>'
        : '<span class="mono">Pulsa "Ver datos" para tener a la vista las tres fuentes que hay que combinar.</span>';
    } else {
      const st=gumStats(SET5);
      html = active
        ? `<b>${CASES_GUM.expandida.mision}</b><br><span class="mono">u_c = ${fm(st.uc)} · k = ${K_EXP} · media = ${st.mean.toFixed(4)} mm`+(revela()?`<br>U = k·u_c = ${K_EXP}×${fm(st.uc)} = <b>${fmboth(st.U)}</b><br>Resultado final: <b>(${st.mean.toFixed(4)} ± ${st.U.toFixed(4)}) mm, k=2 (~95%)</b>`:'<br>Expande u_c y decide qué significa el resultado.')+'</span>'
        : '<span class="mono">Pulsa "Ver datos" para tener a la vista u_c, k y la media.</span>';
    }
  } else {
    if(caseKey==='cadena'){
      html = active
        ? `<b>${CASES_TRAZ.cadena.mision}</b><br><span class="mono">CENAM (patrón nacional) → Laboratorio acreditado EMA/ISO 17025 → Instrumento de taller.`+(revela()?'<br>Cada flecha es una calibración DOCUMENTADA con su propia incertidumbre: romper un eslabón, o que falte la incertidumbre en alguno, rompe la trazabilidad aunque el instrumento tenga un papel.':'<br>Piensa qué debe cumplir cada flecha y responde.')+'</span>'
        : '<span class="mono">Pulsa "Inspeccionar" (o toca cada nodo en la escena) para revisar la cadena.</span>';
    } else {
      html = active
        ? `<b>${CASES_TRAZ.certificado.mision}</b><br><span class="mono">Revisa el tablero: ¿qué campos trae el certificado y cuáles no? Contrástalo con la afirmación y responde.</span>`
        : '<span class="mono">Pulsa "Revisar" para inspeccionar el certificado del laboratorio acreditado.</span>';
    }
  }
  el('report').innerHTML=html;
}
function refreshAll(){
  drawResPanel(); drawCertPanel();
  drawDial(readIdx>0?READINGS_MM[readIdx-1]:null);
  updateTele(); updateReport();
}

/* ---------- interacción ---------- */
function renderCaseBar(){
  const order=CASE_ORDER[moduleKey];
  el('casebar').innerHTML=order.map(k=>`<button class="b ${k===caseKey?'on':''}" data-case="${k}">${CASE_LABEL[k]}</button>`).join('');
  el('casebar').querySelectorAll('button').forEach(btn=>{ btn.onclick=()=>setCase(btn.dataset.case); });
}
function refreshCaseLabel(){ const order=CASE_ORDER[moduleKey]; el('p_case').textContent='Caso '+(order.indexOf(caseKey)+1)+'/'+order.length; }
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
  seedCase(caseKey);                       // los casos conceptuales no llevan cifras: solo cambian las opciones
  active=false; readIdx=0;
  updateButtons(); refreshQuestion(); refreshAll();
}
function answer(i){
  if(!active){ showToast(caseKey==='tipoA'?'Primero toma las 5 lecturas.':'Primero revisa el dato con el botón correspondiente.'); return; }
  if(autoRunning) return;                 // la demostración enseña, no puntúa
  if(answered[caseKey]){ showToast('Este caso ya está resuelto: pasa al siguiente.'); return; }
  const o=quizNow.opciones[i]; clearDx();
  const btn=el('dxbtns').children[i];
  RETO.intentos++;
  if(o.ok){
    btn.classList.add('right'); answered[caseKey]=true; fallosCaso[caseKey]=0; synth.beep(1046,0.12,0.06);
    showToast(`<span style="color:var(--good)">✔ Correcto.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
    refreshAll();
  }else{
    btn.classList.add('wrong'); synth.beep(220,0.15,0.06);
    fallosCaso[caseKey]++;
    if(fallosCaso[caseKey]>=3){
      resiembra();
      showToast(`<span style="color:var(--bad)">✗ Tres fallos en este caso.</span><br><span style="color:var(--dim);font-size:11px">Cambian los datos y las opciones: vuelve a revisar el dato y razona cada paso.</span>`);
    } else {
      showToast(`<span style="color:var(--bad)">✗ Revisa tu cálculo.</span><br><span style="color:var(--dim);font-size:11px">${o.why} (fallos en este caso: ${fallosCaso[caseKey]}/3)</span>`);
    }
  }
}
function updateButtons(){
  const isTipoA = moduleKey==='gum' && caseKey==='tipoA';
  el('stepWrap').style.display = isTipoA ? '' : 'none';
  el('btnJaws').style.display = isTipoA ? 'none' : '';
  if(isTipoA){ el('btnStep').textContent='📏 Tomar lectura ('+readIdx+'/'+READINGS_MM.length+')'; el('btnStep').disabled = readIdx>=READINGS_MM.length; }
  else {
    const labels={
      tipoB_res:'🔍 Revisar dato', tipoB_cert:'🔍 Revisar dato', combinar:'📋 Ver datos', expandida:'📋 Ver datos',
      cadena:'🔍 Inspeccionar cadena', certificado:'🔍 Revisar certificado',
    };
    el('btnJaws').textContent = labels[caseKey] || '🔍 Revisar dato';
    el('btnJaws').classList.toggle('on', active);
  }
}
function setModule(key){
  if(key===moduleKey||autoRunning) return;
  moduleKey=key; caseKey=CASE_ORDER[key][0]; active=false; readIdx=0;
  el('i_gum').classList.toggle('on',key==='gum');
  el('i_traz').classList.toggle('on',key==='traz');
  renderCaseBar(); updateButtons();
  clearDx(); refreshQuestion(); refreshCaseLabel();
  const meta=CASE_CAM[key][caseKey]; S.moveTo(meta[0],meta[1],1.3);
  refreshAll();
  showToast('🔀 '+(key==='gum'?'Presupuesto de incertidumbre (GUM)':'Trazabilidad metrológica'));
}
function setCase(key){
  if(autoRunning) return;
  caseKey=key; active=false; readIdx=0;
  renderCaseBar(); updateButtons();
  clearDx(); refreshQuestion(); refreshCaseLabel();
  const meta=CASE_CAM[moduleKey][key]; S.moveTo(meta[0],meta[1],1.3);
  refreshAll();
  showToast('🔀 '+(moduleKey==='gum'?CASES_GUM[key].nombre:CASES_TRAZ[key].nombre));
}
el('i_gum').onclick=()=>setModule('gum');
el('i_traz').onclick=()=>setModule('traz');
el('btnNew').onclick=()=>{ const order=CASE_ORDER[moduleKey]; setCase(order[(order.indexOf(caseKey)+1)%order.length]); };

el('btnJaws').onclick=e=>{
  active=!active;
  synth.init(); synth.resume();
  if(active){ synth.beep(880,0.1,0.06); }
  updateButtons(); refreshAll();
};
el('btnStep').onclick=()=>{
  if(readIdx>=READINGS_MM.length) return;
  readIdx++;
  if(readIdx>=READINGS_MM.length) active=true;
  synth.init(); synth.resume(); synth.beep(880,0.08,0.05);
  updateButtons(); refreshAll();
  showToast('Lectura '+readIdx+'/'+READINGS_MM.length+' — '+READINGS_MM[readIdx-1].toFixed(4)+' mm');
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
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Recorrido guiado en curso…';
  const prev={active,readIdx,quiz:quizNow,READINGS_MM,RES_MM,CERT_U_MM,CERT_K,LAB_U_MM,SET4,SET5};
  try{
    clearDx();
    const mKey=moduleKey, cKey=caseKey;
    // La demostración trabaja con OTROS datos (DEMO): lo del alumno no se toca.
    READINGS_MM=DEMO.readings; RES_MM=DEMO.res; CERT_U_MM=DEMO.certU; CERT_K=DEMO.certK; LAB_U_MM=DEMO.labU; SET4=DEMO; SET5=DEMO;
    active=false; readIdx=0; drawBoard(); updateButtons(); refreshAll();
    if(mKey==='gum' && cKey==='tipoA'){
      showToast('Paso 1 · Tomamos las 5 lecturas repetidas de la misma pieza (pieza de ejemplo).'); await sleep(1400);
      while(readIdx<READINGS_MM.length){ el('btnStep').click(); await sleep(900); }
      showToast('Paso 2 · Con las 5 lecturas calculamos media, s y u_A=s/√n.'); await sleep(1800);
    } else {
      showToast('Paso 1 · Revisamos el dato de esta fuente (datos de ejemplo).'); await sleep(1200);
      if(!active) el('btnJaws').click();
      await sleep(1600);
    }
    const ok=currentQuiz().opciones.find(o=>o.ok);
    showToast('<span style="color:var(--good)">✔ Resultado del ejemplo</span><br>'+ok.t+'<br><span style="color:var(--dim);font-size:11px">'+ok.why+' Tu avance en el reto no cambió.</span>'); await sleep(2800);
  } finally {
    READINGS_MM=prev.READINGS_MM; RES_MM=prev.RES_MM; CERT_U_MM=prev.CERT_U_MM; CERT_K=prev.CERT_K; LAB_U_MM=prev.LAB_U_MM; SET4=prev.SET4; SET5=prev.SET5;
    autoRunning=false;
    active=prev.active; readIdx=prev.readIdx; quizNow=prev.quiz; renderQuiz();
    drawBoard(); updateButtons(); refreshAll();
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
  }
}
el('btnAuto').onclick=runAuto;

/* ---------- lazo de animación ---------- */
let simT=0;
S.setAnimate((dt,time)=>{
  simT=time;
  const pulse=0.45+0.25*Math.sin(time*1.6);
  MAT.link.emissiveIntensity=pulse;
  if(time-(lastDraw||0)>0.4){ drawDial(readIdx>0?READINGS_MM[readIdx-1]:null); lastDraw=time; }
});
let lastDraw=0;

window.__labDebug={
  get mode(){ return moduleKey+':'+caseKey; },
  get solved(){ return Object.values(answered).every(Boolean); },
  get intentos(){ return RETO.intentos; },
  state(){ return {modulo:moduleKey,caso:caseKey,active,readIdx,answered:{...answered},intentos:RETO.intentos,
    fallos:{...fallosCaso},resiembras:RETO.resiembras,resuelto:Object.values(answered).every(Boolean),autoRunning}; },
  datos(){ return {readings:READINGS_MM,res:RES_MM,certU:CERT_U_MM,certK:CERT_K,labU:LAB_U_MM,set4:SET4,set5:SET5}; },
  setModule(k){ setModule(k); }, setCase(k){ setCase(k); },
  revisa(){ if(caseKey==='tipoA'){ while(readIdx<READINGS_MM.length) el('btnStep').click(); } else if(!active) el('btnJaws').click(); },
  opciones(){ return [...document.querySelectorAll('#dxbtns .b.dx')].map((b,i)=>({t:b.textContent,ok:!!quizNow.opciones[i].ok})); },
};
renderCaseBar(); updateButtons(); refreshQuestion(); refreshCaseLabel(); refreshAll();
