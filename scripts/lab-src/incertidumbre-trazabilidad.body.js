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
     · Todos los datos "verdaderos" (las 5 lecturas, la resolución, el
       certificado del bloque patrón) son constantes fijas elegidas a
       mano — CERO Math.random(). Las estadísticas (media, s, u_A, u_c,
       U) se CALCULAN en código a partir de esas constantes, nunca se
       transcriben a mano, para evitar errores de redondeo silenciosos.
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
const S=createStage(mount,{cam:[0.5,3.2,6.0],target:[-0.2,0.9,0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
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
  link:     std({color:0x2f6b63, emissive:0x1a5c54, emissiveIntensity:0.6, roughness:0.5}),
};

/* ---------- estado ---------- */
let moduleKey='gum';       // 'gum' | 'traz'
let caseKey='tipoA';       // caso activo dentro del módulo
let active=false;          // gate genérico (equivalente a "contact" en otros labs)
let readIdx=0;              // lecturas Tipo A reveladas (0..5)
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:900,Q:1});

const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}
const HOVER_LABELS=new Map();

/* ============================================================
   MODELO — PRESUPUESTO DE INCERTIDUMBRE GUM
   ============================================================ */
const READINGS_MM=[10.0003,10.0005,10.0001,10.0004,10.0002]; // 5 lecturas fijas, mismo bloque patrón
const RES_MM=0.001;      // resolución del comparador (1 µm)
const CERT_U_MM=0.0001;  // incertidumbre expandida del certificado del bloque patrón
const CERT_K=2;          // factor de cobertura declarado en ese certificado
const K_EXP=2;            // factor de cobertura elegido para el resultado final (~95%)

function meanOf(arr){ return arr.reduce((a,b)=>a+b,0)/arr.length; }
function stdevSample(arr){ const m=meanOf(arr); const ss=arr.reduce((a,b)=>a+(b-m)*(b-m),0); return Math.sqrt(ss/(arr.length-1)); }
function gumStats(){
  const n=READINGS_MM.length;
  const mean=meanOf(READINGS_MM);
  const s=stdevSample(READINGS_MM);
  const uA=s/Math.sqrt(n);
  const uRes=RES_MM/Math.sqrt(12);
  const uCert=CERT_U_MM/CERT_K;
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
    mision:'Caso 2 · El comparador tiene una resolución de 0.001 mm. Revisa el dato y calcula la incertidumbre estándar por resolución, asumiendo una distribución rectangular sobre la resolución completa.',
  },
  tipoB_cert:{
    nombre:'Tipo B · certificado',
    mision:'Caso 3 · El bloque patrón de referencia tiene un certificado de calibración vigente que declara U = 0.0001 mm con k=2. Revisa el certificado y calcula la incertidumbre estándar de esta fuente.',
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
    cadena:      [[2.6,2.6,4.6],[2.6,0.8,0]],
    certificado: [[2.6,1.9,1.5],[2.6,1.45,-0.5]],
  },
};

/* ---------- generador de opciones de quiz (rotación determinista, sin azar) ---------- */
function rotateArr(arr,seed){
  let h=0; for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))>>>0;
  const r=h%arr.length; return arr.slice(r).concat(arr.slice(0,r));
}

function tipoAQuiz(){
  const st=gumStats();
  const pregunta=`${CASES_GUM.tipoA.mision}<br>Lecturas (mm): ${READINGS_MM.map(v=>v.toFixed(4)).join(' · ')}. ¿Por qué esta incertidumbre se clasifica como <b>Tipo A</b> y cómo se calcula u_A?`;
  const opciones=[
    {t:`Es Tipo A porque se obtiene por un método ESTADÍSTICO: n=${st.n} lecturas repetidas dan una media (${st.mean.toFixed(4)} mm) y una desviación estándar experimental s=${fm(st.s)}; la incertidumbre estándar de la media es u_A = s/√n = ${fmboth(st.uA)}.`, ok:true,
     why:'El GUM (JCGM 100:2008, cláusula 4.2) clasifica Tipo A vs. Tipo B por el MÉTODO de evaluación (estadístico vs. no estadístico), no por cuál es "más confiable" — de hecho el GUM dice explícitamente que una evaluación Tipo B puede ser tan confiable como una Tipo A.'},
    {t:'Es Tipo A porque es más confiable que una incertidumbre Tipo B.', ok:false,
     why:'El GUM aclara explícitamente que una evaluación Tipo B "puede ser tan confiable como una evaluación Tipo A" (cláusula 4.3.1) — la clasificación no mide confiabilidad, mide el método de evaluación.'},
    {t:`u_A = s = ${fm(st.s)} (la desviación estándar de las lecturas individuales, sin dividir entre √n).`, ok:false,
     why:'Esa es la desviación estándar de las lecturas individuales. La incertidumbre estándar de la MEDIA —lo que se reporta como u_A— es s/√n, menor por un factor √n; confundir ambas es un error común.'},
    {t:'Es Tipo A porque proviene de la resolución del instrumento.', ok:false,
     why:'La resolución del instrumento es una fuente Tipo B (evaluación NO estadística, basada en la especificación del fabricante), no Tipo A.'},
  ];
  return {pregunta, opciones:rotateArr(opciones,'tipoA')};
}
function tipoBResQuiz(){
  const uCorr=RES_MM/Math.sqrt(12), uHalf=RES_MM/2, uSqrt3=RES_MM/Math.sqrt(3);
  const pregunta=`${CASES_GUM.tipoB_res.mision}<br>Resolución del comparador: <b>${RES_MM.toFixed(3)} mm</b>.`;
  const opciones=[
    {t:`u = resolución/√12 = ${RES_MM.toFixed(3)}/√12 ≈ ${fmboth(uCorr)}`, ok:true,
     why:'Para una escala digital/analógica de resolución conocida se asume una distribución rectangular sobre la resolución COMPLETA (GUM, Anexo F.2.2.1): u = (resolución)/√12.'},
    {t:`u = resolución/2 = ${fmboth(uHalf)}`, ok:false,
     why:'Trata la resolución completa como si ya fuera la semi-amplitud de una tolerancia declarada — es el error de conversión Tipo B más común en la práctica.'},
    {t:`u = resolución/√3 = ${fmboth(uSqrt3)}`, ok:false,
     why:'Esa fórmula (u=a/√3) es para la semi-amplitud "a" de una tolerancia declarada (p. ej. un rango ±a de fabricante), no para la resolución completa de un instrumento — son dos fórmulas Tipo B distintas que no deben intercambiarse.'},
    {t:`u = resolución = ${RES_MM.toFixed(3)} mm, usada directamente sin asumir ninguna distribución.`, ok:false,
     why:'Ignora que el GUM exige declarar una distribución de probabilidad (aquí, rectangular) para convertir una especificación en una incertidumbre estándar.'},
  ];
  return {pregunta, opciones:rotateArr(opciones,'tipoBres')};
}
function tipoBCertQuiz(){
  const uCorr=CERT_U_MM/CERT_K, uMul=CERT_U_MM*CERT_K, uDirect=CERT_U_MM, uK3=CERT_U_MM/3;
  const pregunta=`${CASES_GUM.tipoB_cert.mision}<br>Certificado del bloque patrón: <b>U = ${CERT_U_MM.toFixed(4)} mm, k=${CERT_K}</b>.`;
  const opciones=[
    {t:`u = U/k = ${CERT_U_MM.toFixed(4)}/${CERT_K} = ${fmboth(uCorr)}`, ok:true,
     why:'Cuando un certificado reporta una incertidumbre EXPANDIDA U con un factor de cobertura k, se recupera la incertidumbre estándar dividiendo entre k — relación inversa de U=k·u (GUM, cláusula 6.2.1).'},
    {t:`u = U × k = ${fmboth(uMul)}`, ok:false, why:'Es la operación inversa a la correcta: hay que DESHACER el factor de cobertura (dividir), no aplicarlo de nuevo (multiplicar).'},
    {t:`u = U = ${fmboth(uDirect)}, usando directamente la incertidumbre expandida del certificado.`, ok:false,
     why:'Usar U directamente como si fuera la incertidumbre estándar sobreestima esta fuente por un factor k — siempre hay que dividir entre el factor de cobertura declarado antes de combinar.'},
    {t:`u = U/3 = ${fmboth(uK3)}, asumiendo un factor de cobertura distinto al declarado.`, ok:false,
     why:'El factor de cobertura no se supone — se LEE del certificado (aquí k=2); usar un valor distinto sin verificarlo es un error común al copiar presupuestos de otras mediciones.'},
  ];
  return {pregunta, opciones:rotateArr(opciones,'tipoBcert')};
}
function combinarQuiz(){
  const st=gumStats();
  const linSum=st.uA+st.uRes+st.uCert, maxTerm=Math.max(st.uA,st.uRes,st.uCert), avgTerm=linSum/3;
  const pregunta=`${CASES_GUM.combinar.mision}<br>u_A=${fm(st.uA)} · u_resolución=${fm(st.uRes)} · u_certificado=${fm(st.uCert)}. ¿Cuál es u_c?`;
  const opciones=[
    {t:`u_c = √(u_A² + u_res² + u_cert²) ≈ ${fmboth(st.uc)}`, ok:true,
     why:'Ley de propagación de incertidumbre del GUM (ecuación 10), forma simplificada cuando los coeficientes de sensibilidad son 1: las fuentes se combinan en CUADRATURA (suma de cuadrados, raíz cuadrada), nunca linealmente.'},
    {t:`u_c = u_A + u_res + u_cert = ${fmboth(linSum)} (suma lineal)`, ok:false,
     why:'Sumar linealmente sobrestima la incertidumbre real. El GUM y NIST TN 1297 (§5) son explícitos: la combinación es en cuadratura (RSS), no una suma directa.'},
    {t:`u_c = ${fmboth(maxTerm)}, solo la fuente dominante (la más grande de las tres).`, ok:false,
     why:'Ignora la contribución de las demás fuentes solo porque son menores — en la ley de propagación TODAS las fuentes contribuyen, aunque su peso relativo varíe.'},
    {t:`u_c = ${fmboth(avgTerm)}, el promedio de las tres.`, ok:false, why:'No tiene fundamento en la ley de propagación de incertidumbre del GUM — promediar no es la operación que define u_c.'},
  ];
  return {pregunta, opciones:rotateArr(opciones,'combinar')};
}
function expandidaQuiz(){
  const st=gumStats();
  const uWrongDiv=st.uc/K_EXP;
  const pregunta=`${CASES_GUM.expandida.mision}<br>u_c=${fm(st.uc)}, k=${K_EXP}. ¿Cuál es U y qué significa el resultado?`;
  const opciones=[
    {t:`U = k·u_c = ${K_EXP}×${fm(st.uc)} = ${fmboth(st.U)}. Resultado: (${st.mean.toFixed(4)} ± ${st.U.toFixed(4)}) mm, con un nivel de confianza de APROXIMADAMENTE 95% (no exactamente), asumiendo una distribución aproximadamente normal.`, ok:true,
     why:'GUM, cláusula 6.3.3 (verbatim): tomar k=2 produce un intervalo con un nivel de confianza de APROXIMADAMENTE 95% — la palabra "aproximadamente" y la suposición de normalidad son parte de la afirmación, no un detalle menor.'},
    {t:`U = u_c/k = ${fmboth(uWrongDiv)}`, ok:false, why:'Fórmula invertida: la incertidumbre expandida se obtiene MULTIPLICANDO u_c por k (U=k·u_c, GUM ecuación 18), no dividiendo.'},
    {t:`U = k·u_c = ${fmboth(st.U)}, con exactamente 95.00% de confianza garantizado siempre, sin importar la distribución de los datos.`, ok:false,
     why:'El GUM nunca afirma un 95% exacto ni incondicional — es una aproximación válida bajo el supuesto de una distribución aproximadamente normal.'},
    {t:`U = k·u_c, y con k=2 el intervalo cubre el 100% de los valores posibles.`, ok:false, why:'Ningún factor de cobertura finito garantiza el 100% de los valores — k=2 se asocia a ~95%, k=3 a ~99% (GUM, cl. 6.3.3), nunca a certeza total.'},
  ];
  return {pregunta, opciones:rotateArr(opciones,'expandida')};
}
function cadenaQuiz(){
  const pregunta='Caso 6 · Según el VIM (JCGM 200:2012, definición 2.41), ¿qué es la trazabilidad metrológica de un resultado de medición?';
  const opciones=[
    {t:'Es la propiedad de un resultado de medición por la cual puede relacionarse con una referencia mediante una cadena documentada e ININTERRUMPIDA de calibraciones, cada una con su incertidumbre. La trazabilidad NO garantiza por sí sola que la incertidumbre sea adecuada ni que no haya errores (VIM, nota 5) — solo garantiza el origen documentado de la referencia.', ok:true,
     why:'Definición VIM 2.41 más su nota 5, ambas explícitas: la cadena documentada es la propiedad; la adecuación de la incertidumbre es un requisito APARTE que no se deduce solo de tener trazabilidad.'},
    {t:'Es la garantía de que la medición es exacta, sin necesidad de reportar incertidumbre.', ok:false,
     why:'Contradice directamente la nota 5 del VIM: la trazabilidad no garantiza exactitud ni sustituye el reporte de incertidumbre.'},
    {t:'Es tener un certificado de calibración, sin importar su antigüedad ni qué laboratorio lo emitió.', ok:false,
     why:'Un papel aislado no es una cadena — la trazabilidad exige que CADA eslabón (incluido el laboratorio emisor) esté documentado y sea vigente.'},
    {t:'Es la propiedad de poder repetir la medición varias veces obteniendo el mismo resultado.', ok:false,
     why:'Eso describe precisión/repetibilidad (VIM 2.15), un concepto relacionado pero distinto de la trazabilidad (VIM 2.41).'},
  ];
  return {pregunta, opciones:rotateArr(opciones,'cadena')};
}
function certificadoQuiz(){
  const pregunta='Caso 7 · Un compañero afirma que todo certificado de calibración conforme a ISO/IEC 17025 DEBE incluir, por defecto, la "fecha de la próxima calibración". Revisa el certificado del panel. ¿Es correcta esa afirmación?';
  const opciones=[
    {t:'No. ISO/IEC 17025:2017 (§7.8.4.3) NO exige por defecto incluir la fecha de la próxima calibración o un intervalo de recalibración — solo si el cliente lo solicita expresamente o lo exige una reglamentación aplicable. Sí son de inclusión obligatoria: la incertidumbre de medición, las condiciones de calibración, y una declaración de trazabilidad metrológica.', ok:true,
     why:'§7.8.4.3 de la norma es explícito: la fecha de próxima calibración es condicional (a petición del cliente o por reglamento), no un contenido por defecto — un malentendido común de taller que este certificado ilustra deliberadamente omitiendo ese campo.'},
    {t:'Sí, es obligatoria en todos los certificados sin excepción.', ok:false, why:'Es el malentendido exacto que corrige §7.8.4.3 de la norma: esa fecha es condicional, no un requisito universal.'},
    {t:'No es necesario reportar la incertidumbre de medición si el instrumento es de uso general.', ok:false,
     why:'Contradice §7.8.4.1(b): la incertidumbre de medición SÍ es de inclusión obligatoria en el certificado, sin excepción por "uso general".'},
    {t:'El certificado no necesita declarar trazabilidad si el laboratorio está acreditado — la acreditación ya lo garantiza implícitamente.', ok:false,
     why:'La declaración explícita de trazabilidad en el certificado (§7.8.4.1(c)) sigue siendo un requisito de contenido, independientemente de que el laboratorio esté acreditado.'},
  ];
  return {pregunta, opciones:rotateArr(opciones,'certificado')};
}
function currentQuiz(){
  if(moduleKey==='traz'){ return caseKey==='cadena' ? cadenaQuiz() : certificadoQuiz(); }
  return {tipoA:tipoAQuiz, tipoB_res:tipoBResQuiz, tipoB_cert:tipoBCertQuiz, combinar:combinarQuiz, expandida:expandidaQuiz}[caseKey]();
}

/* ============================================================
   ESCENA 3D — 1) ESTACIÓN DE MEDICIÓN (comparador + bloque patrón)
   ============================================================ */
const stationG=new THREE.Group(); stationG.position.set(-2.4,0,0); scene.add(stationG);

const plate=roundedBox(1.7,0.09,1.05,MAT.granite,0.03); plate.position.set(0,0.045,0); stationG.add(plate);
plate.userData={title:'Placa de referencia (granito)',info:'Superficie plana de referencia sobre la que descansan la pieza y la base del comparador — ISO 1 fija 20 °C como temperatura de referencia para metrología dimensional.'};
const lbPlate=labelSprite('Placa de referencia','#8a949c'); lbPlate.position.set(0,0.32,0.5); lbPlate.visible=false; lbPlate.raycast=()=>{}; stationG.add(lbPlate); HOVER_LABELS.set(plate,lbPlate);

const gaugeBlk=sh(new THREE.Mesh(new THREE.BoxGeometry(0.30,0.14,0.22),MAT.gaugeBlk));
gaugeBlk.position.set(0.20,0.16,0.16); stationG.add(gaugeBlk);
gaugeBlk.userData={title:'Bloque patrón (pieza bajo prueba)',info:'Dimensión nominal 10 mm. Se mide 5 veces con el comparador para estimar la repetibilidad (Tipo A) — la misma pieza, sin desmontarla entre lecturas.'};
const lbBlk=labelSprite('Bloque patrón · Ø nominal 10 mm','#C9A227'); lbBlk.position.set(0.20,0.42,0.30); lbBlk.visible=false; lbBlk.raycast=()=>{}; stationG.add(lbBlk); HOVER_LABELS.set(gaugeBlk,lbBlk);

const compBase=roundedBox(0.30,0.09,0.30,MAT.base,0.05); compBase.position.set(-0.15,0.075,-0.10); stationG.add(compBase);
compBase.userData={title:'Base magnética',info:'Fija el comparador de forma rígida sobre la placa de referencia.'};
const compPost=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.85,12),MAT.steelDk));
compPost.position.set(-0.15,0.53,-0.10); stationG.add(compPost);
const compArmH=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.5,12),MAT.steelDk));
compArmH.rotation.z=Math.PI/2; compArmH.position.set(0.1,0.90,-0.10); stationG.add(compArmH);
const compArmV=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.22,12),MAT.steelDk));
compArmV.position.set(0.35,0.79,-0.10); stationG.add(compArmV);

const dialBezel=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.08,32),MAT.bezel));
dialBezel.rotation.x=Math.PI/2; dialBezel.position.set(0.35,0.66,0.02); stationG.add(dialBezel);
const dialCanvas=document.createElement('canvas'); dialCanvas.width=384; dialCanvas.height=384;
const dialTex=new THREE.CanvasTexture(dialCanvas); dialTex.colorSpace=THREE.SRGBColorSpace; dialTex.minFilter=THREE.LinearFilter; dialTex.generateMipmaps=false;
const dialFace=new THREE.Mesh(new THREE.PlaneGeometry(0.47,0.47), new THREE.MeshBasicMaterial({map:dialTex,toneMapped:false}));
dialFace.position.set(0.35,0.66,0.062); stationG.add(dialFace);
dialFace.userData={title:'Carátula del comparador',info:'Nota de fidelidad: la deflexión de la aguja está EXAGERADA a propósito para que sea visible — las desviaciones reales de este ejercicio son de unas pocas décimas de micra. El valor autoritativo es siempre el número, no el ángulo de la aguja.'};
const plunger=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.24,14),MAT.steel));
plunger.position.set(0.35,0.42,0.06); stationG.add(plunger);
plunger.userData={title:'Palpador (husillo)',info:'Toca el bloque patrón y transmite su posición a la aguja de la carátula.'};
const lbComp=labelSprite('Comparador de carátula','#4FD1C5'); lbComp.position.set(0.35,0.98,0.15); lbComp.visible=false; lbComp.raycast=()=>{}; stationG.add(lbComp); HOVER_LABELS.set(dialFace,lbComp);

// Placa pequeña: resolución del comparador
const resPlaqueStand=sh(new THREE.Mesh(new THREE.BoxGeometry(0.03,0.4,0.03),MAT.base)); resPlaqueStand.position.set(0.62,0.2,0.32); stationG.add(resPlaqueStand);
const resCanvas=document.createElement('canvas'); resCanvas.width=256; resCanvas.height=180;
const resTex=new THREE.CanvasTexture(resCanvas); resTex.colorSpace=THREE.SRGBColorSpace; resTex.minFilter=THREE.LinearFilter; resTex.generateMipmaps=false;
const resPanel=new THREE.Mesh(new THREE.PlaneGeometry(0.36,0.25), new THREE.MeshBasicMaterial({map:resTex,toneMapped:false}));
resPanel.position.set(0.62,0.52,0.33); stationG.add(resPanel);
resPanel.userData={title:'Especificación · resolución del comparador',info:'Dato Tipo B: la resolución del instrumento (0.001 mm) se convierte en incertidumbre estándar asumiendo una distribución rectangular, u = resolución/√12.'};
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

function makeNode(x,mat,title,info,label,color){
  const ped=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.26,0.55,8),mat));
  ped.position.set(x,0.275,0); chainG.add(ped);
  ped.userData={title,info};
  const lb=labelSprite(label,color); lb.position.set(x,0.95,0); chainG.add(lb); // siempre visible
  return ped;
}
const nodeCenam=makeNode(NODE_X.cenam, MAT.pedCenam,
  'CENAM — Centro Nacional de Metrología',
  'Instituto Nacional de Metrología de México (Ley de Infraestructura de la Calidad, vigente desde el 1 de julio de 2020). Mantiene los patrones nacionales de medición y es, por definición legal, el origen de la trazabilidad en el país — el eslabón más alto de la cadena.',
  'CENAM','#C9A227');
const nodeLab=makeNode(NODE_X.lab, MAT.pedLab,
  'Laboratorio de calibración acreditado (EMA)',
  'Acreditado por la EMA (Entidad Mexicana de Acreditación, A.C.) bajo la norma NMX-EC-17025-IMNC-2018 (idéntica a ISO/IEC 17025:2017). Calibra instrumentos de taller usando patrones con trazabilidad documentada a CENAM, y emite certificados de calibración con incertidumbre y trazabilidad declaradas.',
  'Lab. acreditado (EMA/ISO 17025)','#4FD1C5');
const nodeTaller=makeNode(NODE_X.taller, MAT.pedTaller,
  'Instrumento de taller',
  'El comparador o micrómetro que usa el operador día a día. Su trazabilidad depende de que exista una cadena ININTERRUMPIDA y documentada hasta CENAM — tener "un papel" no basta si la cadena está rota o el certificado no declara incertidumbre (VIM 2.41, nota 5).',
  'Instrumento de taller','#8a949c');

function makeLink(x1,x2){
  const len=x2-x1;
  const link=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,len,10),MAT.link));
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
  const needleAng=(dev*400000-90)*Math.PI/180;
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
  c.fillText('COMPARADOR',128,34);
  c.fillStyle='#EAF4F1'; c.font='bold 24px Outfit, sans-serif';
  c.fillText(RES_MM.toFixed(3)+' mm',128,92);
  c.fillStyle='#8FB3AC'; c.font='13px Outfit, sans-serif';
  c.fillText('resolución (1 µm/división)',128,120);
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
    ['Incertidumbre expandida:', 'U = '+gumStats().U.toFixed(4)+' mm, k=2 (~95%)'],
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
  c.fillStyle='#FFD166'; c.font='12px Outfit, sans-serif';
  c.fillText('Nota: NO incluye "próxima fecha de calibración" — ISO/IEC 17025 §7.8.4.3',28,y+26);
  c.fillText('no la exige por defecto (solo si el cliente la solicita).',28,y+44);
  boardTex.needsUpdate=true;
}
drawResPanel(); drawCertPanel(); drawBoard(); drawDial(null);

/* ---------- telemetría e informe ---------- */
function updateTele(){
  const set=(id,txt,cls)=>{ const b=el(id); b.textContent=txt; b.className=cls||''; };
  const st=gumStats();
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
      set('t_raw', st.uc.toFixed(5)+' mm', active?'good':'');
      set('t_ref', 'u_A, u_res, u_cert','warn');
      set('t_lc','u_c = √Σu² (cuadratura)','');
      set('t_case', CASES_GUM.combinar.nombre,'');
      set('t_est', active?'Calculado':'Sin calcular', active?'good':'warn');
    } else {
      set('t_raw', st.U.toFixed(5)+' mm', active?'good':'');
      set('t_ref', 'k=2 (~95%)','warn');
      set('t_lc','U = k·u_c','');
      set('t_case', CASES_GUM.expandida.nombre,'');
      set('t_est', active?'Calculado':'Sin calcular', active?'good':'warn');
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
  const st=gumStats();
  let html='';
  if(moduleKey==='gum'){
    if(caseKey==='tipoA'){
      if(readIdx===0){ html='<span class="mono">Sin lecturas aún. Pulsa "Tomar lectura" para registrar la primera de 5.</span>'; }
      else{
        const taken=READINGS_MM.slice(0,readIdx);
        html=`<b>${CASES_GUM.tipoA.mision}</b><br><span class="mono">Lecturas: ${taken.map(v=>v.toFixed(4)).join(' · ')} mm`;
        if(readIdx===READINGS_MM.length){
          html+=`<br>Media = ${st.mean.toFixed(4)} mm · s = ${fm(st.s)} · u_A = s/√${st.n} = <b>${fmboth(st.uA)}</b></span>`;
        } else { html+=` (${readIdx}/${READINGS_MM.length})</span>`; }
      }
    } else if(caseKey==='tipoB_res'){
      html = active
        ? `<b>${CASES_GUM.tipoB_res.mision}</b><br><span class="mono">Resolución = ${RES_MM.toFixed(3)} mm → u_res = resolución/√12 = <b>${fmboth(st.uRes)}</b></span>`
        : '<span class="mono">Pulsa "Revisar dato" para inspeccionar la especificación del comparador.</span>';
    } else if(caseKey==='tipoB_cert'){
      html = active
        ? `<b>${CASES_GUM.tipoB_cert.mision}</b><br><span class="mono">Certificado: U = ${CERT_U_MM.toFixed(4)} mm, k=${CERT_K} → u_cert = U/k = <b>${fmboth(st.uCert)}</b></span>`
        : '<span class="mono">Pulsa "Revisar dato" para inspeccionar el certificado del bloque patrón.</span>';
    } else if(caseKey==='combinar'){
      html = active
        ? `<b>${CASES_GUM.combinar.mision}</b><br><span class="mono">u_A=${fm(st.uA)} · u_res=${fm(st.uRes)} · u_cert=${fm(st.uCert)}<br>u_c = √(u_A²+u_res²+u_cert²) = <b>${fmboth(st.uc)}</b></span>`
        : '<span class="mono">Pulsa "Calcular" para combinar las tres fuentes en cuadratura.</span>';
    } else {
      html = active
        ? `<b>${CASES_GUM.expandida.mision}</b><br><span class="mono">U = k·u_c = 2×${fm(st.uc)} = <b>${fmboth(st.U)}</b><br>Resultado final: <b>(${st.mean.toFixed(4)} ± ${st.U.toFixed(4)}) mm, k=2 (~95%)</b></span>`
        : '<span class="mono">Pulsa "Calcular" para aplicar el factor de cobertura k=2.</span>';
    }
  } else {
    if(caseKey==='cadena'){
      html = active
        ? `<b>${CASES_TRAZ.cadena.mision}</b><br><span class="mono">CENAM (patrón nacional) → Laboratorio acreditado EMA/ISO 17025 → Instrumento de taller.<br>Cada flecha es una calibración DOCUMENTADA con su propia incertidumbre — romper un eslabón, o que falte la incertidumbre en alguno, rompe la trazabilidad aunque exista "un papel".</span>`
        : '<span class="mono">Pulsa "Inspeccionar" (o toca cada nodo en la escena) para revisar la cadena.</span>';
    } else {
      html = active
        ? `<b>${CASES_TRAZ.certificado.mision}</b><br><span class="mono">Revisa el tablero: incluye incertidumbre (U=${st.U.toFixed(4)} mm, k=2), condiciones y declaración de trazabilidad — y OMITE la "próxima fecha de calibración" a propósito.</span>`
        : '<span class="mono">Pulsa "Revisar" para inspeccionar el certificado del laboratorio acreditado.</span>';
    }
  }
  el('report').innerHTML=html;
}
function refreshAll(){
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
function refreshQuestion(){
  const q=currentQuiz();
  el('q_text').innerHTML=q.pregunta;
  el('dxbtns').innerHTML=q.opciones.map((o,i)=>`<button class="b dx" data-i="${i}">${'ABCD'[i]} · ${o.t}</button>`).join('');
  el('dxbtns').querySelectorAll('.b.dx').forEach(btn=>{ btn.onclick=()=>answer(+btn.dataset.i); });
}
function answer(i){
  if(!active){ showToast(caseKey==='tipoA'?'Primero toma las 5 lecturas.':'Primero revisa el dato con el botón correspondiente.'); return; }
  const q=currentQuiz(); const o=q.opciones[i]; clearDx();
  const btn=el('dxbtns').children[i];
  if(o.ok){
    btn.classList.add('right'); synth.beep(1046,0.12,0.06);
    showToast(`<span style="color:var(--good)">✔ Correcto.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }else{
    btn.classList.add('wrong'); synth.beep(220,0.15,0.06);
    showToast(`<span style="color:var(--bad)">✗ Revisa el cálculo.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }
}
function updateButtons(){
  const isTipoA = moduleKey==='gum' && caseKey==='tipoA';
  el('stepWrap').style.display = isTipoA ? '' : 'none';
  el('btnJaws').style.display = isTipoA ? 'none' : '';
  if(isTipoA){ el('btnStep').textContent='📏 Tomar lectura ('+readIdx+'/'+READINGS_MM.length+')'; el('btnStep').disabled = readIdx>=READINGS_MM.length; }
  else {
    const labels={
      tipoB_res:'🔍 Revisar dato', tipoB_cert:'🔍 Revisar dato', combinar:'🧮 Calcular', expandida:'🧮 Calcular',
      cadena:'🔍 Inspeccionar cadena', certificado:'🔍 Revisar certificado',
    };
    el('btnJaws').textContent = labels[caseKey] || '🔍 Revisar dato';
    el('btnJaws').classList.toggle('on', active);
  }
}
function setModule(key){
  if(key===moduleKey) return;
  moduleKey=key; caseKey=CASE_ORDER[key][0]; active=false; readIdx=0;
  el('i_gum').classList.toggle('on',key==='gum');
  el('i_traz').classList.toggle('on',key==='traz');
  renderCaseBar(); updateButtons();
  solved=false; clearDx(); refreshQuestion(); refreshCaseLabel();
  const meta=CASE_CAM[key][caseKey]; S.moveTo(meta[0],meta[1],1.3);
  refreshAll();
  showToast('🔀 '+(key==='gum'?'Presupuesto de incertidumbre (GUM)':'Trazabilidad metrológica'));
}
function setCase(key){
  caseKey=key; active=false; readIdx=0;
  renderCaseBar(); updateButtons();
  clearDx(); refreshQuestion(); refreshCaseLabel();
  const meta=CASE_CAM[moduleKey][key]; S.moveTo(meta[0],meta[1],1.3);
  refreshAll();
  showToast('🔀 '+(moduleKey==='gum'?CASES_GUM[key].nombre:CASES_TRAZ[key].nombre));
}
let solved=false;
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
let autoRunning=false;
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const btn=el('btnAuto'); const label=btn.textContent;
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Recorrido guiado en curso…';
  try{
    clearDx();
    const mKey=moduleKey, cKey=caseKey;
    if(mKey==='gum' && cKey==='tipoA'){
      showToast('Paso 1 · Tomamos las 5 lecturas repetidas de la misma pieza.'); await sleep(1400);
      while(readIdx<READINGS_MM.length){ el('btnStep').click(); await sleep(900); }
      showToast('Paso 2 · Con las 5 lecturas calculamos media, s y u_A=s/√n.'); await sleep(1800);
    } else {
      showToast('Paso 1 · Revisamos el dato de esta fuente.'); await sleep(1200);
      if(!active) el('btnJaws').click();
      await sleep(1600);
    }
    const q=currentQuiz(); const i=q.opciones.findIndex(o=>o.ok);
    clearDx();
    const dxBtn=el('dxbtns').children[i];
    if(dxBtn){ dxBtn.classList.add('right'); synth.beep(1046,0.12,0.06); }
    showToast('<span style="color:var(--good)">✔ '+q.opciones[i].t+'</span><br><span style="color:var(--dim);font-size:11px">'+q.opciones[i].why+'</span>');
  } finally {
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    autoRunning=false;
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

renderCaseBar(); updateButtons(); refreshQuestion(); refreshCaseLabel(); refreshAll();
