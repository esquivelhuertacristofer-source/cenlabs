/* ============================================================
   LAB — MULTÍMETRO DIGITAL: EXACTITUD, RESOLUCIÓN Y CATEGORÍAS
   (Dominio D10 · instrumentación — molde P: panel-instrumento)
   Normatividad de referencia:
     · IEC 61010-1 / UL 61010-1 — categorías de medición CAT II/III/IV:
       clasifican la ENERGÍA del transitorio disponible en el punto de
       medición, no su voltaje nominal.
     · JCGM 100:2008 (GUM) / NMX-CH-140-IMNC-2002 — expresión de la
       incertidumbre de medida.
     · Formato ±(% de lectura + N dígitos) — especificación estándar de hoja
       de datos de DMM. Valores usados: representativos de un multímetro
       industrial de 6000 cuentas (no de una marca/modelo específico).
   Modelo de ingeniería (didáctico):
     · resolución = rango / 6000 cuentas; el display cuantiza a la resolución
       y marca OL si la señal excede el rango.
     · U = ±(%·lectura + N·dígitos) — banda de exactitud, recalculada en vivo.
     · Z_in = 10 MΩ en V⎓ ⇒ efecto de carga: V_med = V_th·Z_in/(Z_in+R_th).
     · Entrada mA protegida por fusible de 400 mA: en mA el instrumento es
       casi un corto (mide EN SERIE); en paralelo con una fuente, se funde.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.8,3.1,6.4],target:[0.2,1.15,0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.4,minD:3.0,maxD:16});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};

const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.09,0.10,0.12), rub=rubber();
/* Nota de render: los roughnessMap procedurales MULTIPLICAN la roughness
   (plas ≈ ×0.60, rub ≈ ×0.88, brush ≈ ×0.16–0.39). Valores bajos dejan la
   superficie glossy y el RoomEnvironment la lava en blanco — por eso las
   carcasas usan roughness alta y metalness ~0. */
const MAT={
  body:     std({...plas, roughness:0.95, metalness:0.0}),
  holster:  std({...rub, color:0xc0821e, roughness:0.95}),
  knob:     std({...rub, color:0x394641, roughness:1.0}),
  pointer:  std({color:0xc8d4d0, roughness:0.75, metalness:0.0}),
  jackRed:  std({color:0xc23434, roughness:0.5}),
  jackBlk:  std({color:0x14181c, roughness:0.5}),
  jackAmb:  std({color:0xcc8a00, roughness:0.5}),
  jackGry:  std({color:0x5a636a, roughness:0.45, metalness:0.5}),
  psu:      std({...brush, color:0x77828a, metalness:0.35, roughness:0.85}),
  bench:    std({...plas, color:0x3a464d, roughness:0.7}),
  wall:     std({color:0xa8b4ab, roughness:0.9}),
  plate:    std({color:0xb2b8ac, roughness:0.9}),
  slot:     std({color:0x0a0d10, roughness:0.9}),
  resistor: std({color:0x9a815c, roughness:0.9}),
  wire:     std({...brush, color:0xbfc8ce, metalness:0.9, roughness:0.3}),
  pcb:      std({color:0x14532d, roughness:0.6}),
  probeRed: std({...rub, color:0xd05050, roughness:0.8}),
  probeBlk: std({...rub, color:0x2a3238, roughness:0.8}),
  tip:      std({...brush, metalness:0.95, roughness:0.25}),
  cable:    std({...rub, color:0x14181d, roughness:0.9}),
  cableRed: std({...rub, color:0xa03030, roughness:0.9}),
};
/* ---------- estado ---------- */
let scenarioKey='fuente'; let connected=false; let func='vdc'; let rangeSel='auto';
let envKey='cat2'; let fuseBlown=false; let solved=false; let simT=0;
/* Contabilidad del reto. `solved` es el estado del caso que se ve; `answered`
   recuerda cada caso. Tres fallos seguidos en un caso lo resiembran. */
const answered={fuente:false,tomacorriente:false,resistor:false,divisor:false};
const fallosCaso={fuente:0,tomacorriente:0,resistor:0,divisor:0};
const RETO={intentos:0,resiembras:0};
let quizNow={pregunta:'',opciones:[]};
let autoRunning=false;
const synth=makeSynth({type:'sine',type2:'sine',filterFreq:900,Q:1});

const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}
const HOVER_LABELS=new Map();   // pieza → etiqueta (se muestra solo al pasar el cursor)

/* ============================================================
   MODELO DEL INSTRUMENTO — DMM de 6000 cuentas
   ============================================================ */
const METER={
  counts:6000, zin:10e6,
  cat:'CAT III 600 V · CAT II 1000 V',
  spec:{ vdc:{pct:0.5,dig:2}, vac:{pct:1.0,dig:3}, ohm:{pct:0.9,dig:1}, madc:{pct:1.0,dig:3} },
  ranges:{ vdc:[0.6,6,60,600], vac:[6,60,600], ohm:[600,6e3,60e3,6e5,6e6], madc:[60,600] },
};
const FUNC_LABEL={vdc:'V⎓',vac:'V~',ohm:'Ω',madc:'mA'};
const KNOB_ANGLE={vdc:0.55,vac:0.18,ohm:-0.20,madc:-0.58};

/* ---------- datos de los casos: se sortean al abrir el lab y al resembrar el caso ----------
   La demostración guiada usa DEMO, que no sale nunca del sorteo del alumno. */
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffled=a=>{ const b=a.slice(); for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; } return b; };
let VF=5.000;                         // caso 1: salida de la fuente (V)
let CAT_Q=0;                          // caso 2: variante de la pregunta (0 | 1 | 2)
let RN=4700, RTOL=5, R_ACTUAL=4687;   // caso 3: valor nominal, tolerancia (%) y valor REAL del resistor
let R1=1.0e6, R2=1.0e6, VS=10.00;     // caso 4: divisor
let RP, VNODE_IDEAL, VNODE_MED;       // derivados del divisor (efecto de carga de Z_in)
function recalcDiv(){
  VNODE_IDEAL=VS*R2/(R1+R2);
  RP=R2*METER.zin/(R2+METER.zin);              // R2 ∥ Z_in
  VNODE_MED=VS*RP/(R1+RP);                     // con el DMM conectado
}
recalcDiv();
const DEMO={VF:15.00,CAT_Q:0,RN:33000,RTOL:2,RA:33410,R1:2.2e6,R2:4.7e6,VS:12};
const VF_LIST=[0.450,1.800,3.300,5.000,9.00,12.00,24.0];
const RN_LIST=[470,1500,4700,22000,100000], RTOL_LIST=[1,2,5,10];
const R_LIST=[100e3,470e3,1e6,2.2e6,4.7e6], VS_LIST=[5,9,10,12];
function seedCase(key){
  if(key==='fuente'){ const p=VF; do{ VF=pick(VF_LIST); }while(VF===p); }
  else if(key==='tomacorriente'){ const p=CAT_Q; do{ CAT_Q=Math.floor(Math.random()*3); }while(CAT_Q===p); }
  else if(key==='resistor'){
    const p=[RN,RTOL];
    do{ RN=pick(RN_LIST); RTOL=pick(RTOL_LIST); }while(RN===p[0]&&RTOL===p[1]);
    R_ACTUAL=+(RN*(1+(Math.random()*2-1)*0.8*RTOL/100)).toPrecision(3);   // dentro de su tolerancia
  }
  else if(key==='divisor'){
    const p=[R1,R2,VS];
    do{ R1=pick(R_LIST); R2=pick(R_LIST); VS=pick(VS_LIST); recalcDiv(); }
    while((R1===p[0]&&R2===p[1]&&VS===p[2])||(R1===DEMO.R1&&R2===DEMO.R2)||(VNODE_IDEAL-VNODE_MED)/VNODE_IDEAL<0.025);
  }
}
['fuente','tomacorriente','resistor','divisor'].forEach(seedCase);
const guardaDatos=()=>({VF,CAT_Q,RN,RTOL,R_ACTUAL,R1,R2,VS});
function restauraDatos(d){ ({VF,CAT_Q,RN,RTOL,R_ACTUAL,R1,R2,VS}=d); recalcDiv(); }
function datosDemo(){ restauraDatos({VF:DEMO.VF,CAT_Q:DEMO.CAT_Q,RN:DEMO.RN,RTOL:DEMO.RTOL,R_ACTUAL:DEMO.RA,R1:DEMO.R1,R2:DEMO.R2,VS:DEMO.VS}); }
const fmtR=r=>r>=1e6?(r/1e6)+' MΩ':r>=1e3?(r/1e3)+' kΩ':r+' Ω';
const fmtVF=v=>v<10?v.toFixed(3):v.toFixed(2);
// código de colores de 4 bandas (IEC 60062): dos dígitos, multiplicador y tolerancia
const COL_DIG=['#111111','#7b4a2a','#c73a3a','#e8892a','#e8c832','#3f9a4a','#3a5fc7','#7d3fc4','#8a8f94','#eeeeee'];
const COL_TOL={1:'#7b4a2a',2:'#c73a3a',5:'#c9a227',10:'#c0c4c8'};
function bandasResistor(r,tol){
  const e=Math.floor(Math.log10(r))-1, d=Math.round(r/Math.pow(10,e));
  return [COL_DIG[Math.floor(d/10)],COL_DIG[d%10],COL_DIG[e],COL_TOL[tol]];
}
let mainsV=127.0;                                     // la red deriva lentamente

function scaleFor(fn,range){
  if(fn==='ohm'){ if(range>=1e6)return{m:1e-6,u:'MΩ'}; if(range>=1e3)return{m:1e-3,u:'kΩ'}; return{m:1,u:'Ω'}; }
  if(fn==='madc')return{m:1,u:'mA'};
  if(range<1)return{m:1e3,u:'mV'};
  return{m:1,u:'V'};
}
function decimalsFor(range,m){ const res=range/METER.counts*m; return Math.max(0,Math.round(-Math.log10(res))); }
function fmtVal(v,fn,range){ const s=scaleFor(fn,range); return (v*s.m).toFixed(decimalsFor(range,s.m))+' '+s.u; }
// U se reporta con ≥2 cifras significativas (JCGM 100 §7.2.6): los decimales de la
// resolución del rango pueden truncarla (0.045 V en rango 60 V se vería "0.04 V").
function uDecimals(U,range,m){ const u=U*m; const need=u>0?Math.max(0,1-Math.floor(Math.log10(u))):0; return Math.max(decimalsFor(range,m),need); }
function fmtU(U,fn,range){ const s=scaleFor(fn,range); return (U*s.m).toFixed(uDecimals(U,range,s.m))+' '+s.u; }
function rangeName(fn,range){ const s=scaleFor(fn,range); const n=range*s.m; return (n>=10?Math.round(n):n)+' '+s.u; }
function uNom(fn,v,range){ const sp=METER.spec[fn]; const res=range/METER.counts; return sp.pct/100*Math.abs(v)+sp.dig*res; }

// valor verdadero en las puntas según escenario y función
function trueAtProbes(){
  if(!connected) return func==='ohm' ? {v:Infinity} : {v:0};   // puntas al aire
  if(func==='vdc'){
    if(scenarioKey==='fuente')return{v:5.000};
    if(scenarioKey==='divisor')return{v:VNODE_MED};             // carga de Z_in incluida
    return{v:0};                                                // CA promedia 0; resistor sin fuente
  }
  if(func==='vac')return{v:scenarioKey==='tomacorriente'?mainsV:0};
  if(func==='ohm'){
    if(scenarioKey==='resistor')return{v:R_ACTUAL};
    return{err:true};                                           // Ω en circuito energizado
  }
  // mA: en paralelo con una fuente ⇒ corriente de falla ⇒ fusible
  if(scenarioKey==='fuente'||scenarioKey==='tomacorriente')return{blow:true};
  if(scenarioKey==='divisor')return{v:VS/(R1+R2)*1000};        // corriente de la rama R1+R2 sin carga
  return{v:0};
}

function measure(time){
  const t=trueAtProbes();
  if(t.blow && !fuseBlown){ fuseBlown=true; onFuseBlow(); }
  if(fuseBlown && func==='madc')return{state:'fuse'};
  if(t.err)return{state:'err'};
  const v=t.v;
  const list=METER.ranges[func];
  const range = rangeSel==='auto' ? (list.find(r=>Math.abs(v)<r) ?? list[list.length-1]) : rangeSel;
  const res=range/METER.counts;
  if(Math.abs(v)>=range)return{state:'ol',range,res};
  const dith=(Math.sin(time*9.7)+0.6*Math.sin(time*23.3))/1.6;  // parpadeo de ±1 dígito
  const reading=Math.round((v+dith*res*0.7)/res)*res;
  const U=METER.spec[func].pct/100*Math.abs(reading)+METER.spec[func].dig*res;
  return{state:'ok',v,reading,range,res,U,pct:Math.abs(reading)/range*100};
}

/* ---------- entornos CAT del caso 2 (IEC 61010-1) ---------- */
const ENV_META={
  cat2:{nombre:'Tomacorriente en pared', cat:'CAT II',  ok:true,  det:'circuitos enchufables dentro del edificio'},
  cat3:{nombre:'Tablero de distribución', cat:'CAT III', ok:true,  det:'instalación fija: tableros y alimentadores'},
  cat4:{nombre:'Acometida / medidor',     cat:'CAT IV',  ok:false, det:'origen de la instalación — exige DMM CAT IV'},
};

/* ---------- escenarios: misión, cámara y puntos de contacto ---------- */
const SCEN_ORDER=['fuente','tomacorriente','resistor','divisor'];
const SCEN_META={
  fuente:{
    get nombre(){ return 'Fuente de laboratorio '+fmtVF(VF)+' V'; }, funcion:'vdc',
    porQue:'es voltaje de corriente directa (una fuente de laboratorio).',
    mision:'Caso 1 · Mide la salida de la fuente en V⎓ y compara la incertidumbre en distintos rangos.',
    cam:[[3.6,2.4,5.2],[0.4,1.0,0.1]],
    contactos:{red:[2.00,1.135,0.45], black:[2.27,1.135,0.45], rot:[0,0,0.15]},
  },
  tomacorriente:{
    nombre:'Tomacorriente 127 V~', funcion:'vac',
    porQue:'la red doméstica es corriente alterna senoidal (se reporta su valor RMS).',
    mision:'Caso 2 · Mide el tomacorriente en V~ y decide en qué puntos de la instalación puedes usar ESTE DMM (CAT III 600 V).',
    cam:[[3.4,2.6,5.6],[0.7,1.1,0]],
    contactos:{red:[1.565,0.92,0.21], black:[1.735,0.92,0.21], rot:[Math.PI/2,0,0]},
  },
  resistor:{
    get nombre(){ return 'Resistor '+fmtR(RN)+' ±'+RTOL+' %'; }, funcion:'ohm',
    porQue:'es una resistencia y está DESENERGIZADA — regla de oro del ohmímetro.',
    get mision(){ return 'Caso 3 · Mide el resistor fuera de circuito y decide si este DMM puede verificar su tolerancia de ±'+RTOL+' %.'; },
    cam:[[3.2,2.2,5.0],[0.5,0.7,0.1]],
    contactos:{red:[1.17,0.52,0.15], black:[2.13,0.52,0.15], rot:[0,0,0.15]},
  },
  divisor:{
    get nombre(){ return 'Divisor '+fmtR(R1)+' / '+fmtR(R2); }, funcion:'vdc',
    porQue:'buscamos el voltaje del nodo central del divisor (corriente directa).',
    get mision(){ return 'Caso 4 · Mide el nodo central del divisor (fuente de '+VS.toFixed(2)+' V) y explica por qué NO lees '+VNODE_IDEAL.toFixed(3)+' V.'; },
    cam:[[3.2,2.3,5.4],[0.6,0.8,0.2]],
    contactos:{red:[1.91,0.33,0.37], black:[2.23,0.33,0.37], rot:[0,0,0.15]},
  },
};

/* ---------- pregunta de ingeniería por caso (banco de distractores) ----------
   Cada pregunta tiene UNA opción correcta y un banco de distractores; se eligen 3
   y se barajan. Las cifras salen de los datos sembrados. Las opciones NO traen
   los números del instrumento: hay que medir en el panel y decidir. Los avisos
   de error no dan la respuesta, solo dicen qué revisar. */
const W_CAT='Compara la categoría de cada punto con la impresa en la carátula del DMM (IEC 61010-1): la categoría clasifica la energía del transitorio disponible, no el voltaje.';
const W_TUR='Esa justificación no resuelve la pregunta: compara la incertidumbre U que el propio DMM reporta con la tolerancia del componente.';
const W_DIV='Esa causa no explica por qué el error aparece con el DMM conectado a ESTE nodo: revisa cómo afecta el instrumento al circuito que mide.';
const W_RNG='Pruébalo en el panel: cambia de rango, mira la incertidumbre U y fíjate si el display marca OL.';
const mejorRango=v=>METER.ranges.vdc.find(r=>Math.abs(v)<r)??METER.ranges.vdc[METER.ranges.vdc.length-1];
function buildQuiz(key){
  if(key==='fuente'){
    const best=mejorRango(VF);
    return {
      pregunta:`La fuente entrega ≈${fmtVF(VF)} V. ¿Qué rango del DMM da la <b>menor incertidumbre</b>? Pruébalos en el panel.`,
      opciones:METER.ranges.vdc.map(r=>{
        const ok=r===best, U=uNom('vdc',VF,r);
        return {t:`Rango ${rangeName('vdc',r)}`, ok,
          why: ok ? `Es el rango más bajo SIN sobrerrango: usa más cuentas del display. U = ±(0.5 % × ${fmtVF(VF)} + 2 × ${(r/METER.counts)}) = ±${U.toFixed(3)} V.` : W_RNG};
      }),
    };
  }
  if(key==='tomacorriente'){
    if(CAT_Q===0) return {
      pregunta:'Tu DMM es <b>CAT III 600 V</b>. ¿En qué punto NO debes usarlo, aunque el voltaje sea el mismo (127 V)?',
      opciones:[
        {t:'Tomacorriente de pared (CAT II)', ok:false, why:W_CAT},
        {t:'Tablero de distribución (CAT III)', ok:false, why:W_CAT},
        {t:'Acometida / lado del medidor (CAT IV)', ok:true, why:'La categoría clasifica la ENERGÍA del transitorio disponible, no el voltaje: la acometida exige CAT IV. Un CAT III ahí arriesga un arco interno (IEC 61010-1).'},
        {t:'En ninguno: 127 V es 127 V en todos lados', ok:false, why:W_CAT},
      ]};
    if(CAT_Q===1) return {
      pregunta:'Tu DMM es <b>CAT III 600 V</b>. ¿Cuál es la categoría <b>más alta</b> de punto de medición donde puedes usarlo?',
      opciones:[
        {t:'CAT II (tomacorriente de pared)', ok:false, why:W_CAT},
        {t:'CAT III (tablero de distribución)', ok:true, why:'Un DMM CAT III sirve hasta CAT III (y por debajo, CAT II); la acometida es CAT IV y queda fuera de su capacidad (IEC 61010-1).'},
        {t:'CAT IV (acometida / medidor)', ok:false, why:W_CAT},
        {t:'Cualquiera: la categoría depende solo del voltaje', ok:false, why:W_CAT},
      ]};
    return {
      pregunta:'Los tres puntos de la escena son pared (CAT II), tablero (CAT III) y acometida (CAT IV). ¿En <b>cuántos</b> puedes usar este DMM <b>CAT III 600 V</b>?',
      opciones:[
        {t:'En uno solo', ok:false, why:W_CAT},
        {t:'En dos', ok:true, why:'Pared (CAT II) y tablero (CAT III) están dentro de su categoría; la acometida (CAT IV) la excede (IEC 61010-1).'},
        {t:'En los tres', ok:false, why:W_CAT},
        {t:'En ninguno', ok:false, why:W_CAT},
      ]};
  }
  if(key==='resistor'){
    const rango=METER.ranges.ohm.find(r=>R_ACTUAL<r)??METER.ranges.ohm[METER.ranges.ohm.length-1];
    const U=uNom('ohm',R_ACTUAL,rango), tol=RN*RTOL/100, tur=tol/U, puede=tur>=4;
    const pregunta=`El resistor es ${fmtR(RN)} <b>±${RTOL} %</b> (±${tol.toFixed(tol<10?1:0)} Ω). Mídelo con el DMM y decide: ¿puede este DMM verificar su tolerancia?`;
    const mal=[
      {t:'Sí — basta con que la lectura caiga dentro de la banda de tolerancia del resistor', ok:false, why:W_TUR},
      {t:'Sí — el ohmímetro no tiene error de medición y por eso sirve para esto', ok:false, why:W_TUR},
      {t:'No — la resolución del DMM impide distinguir el valor de la tolerancia', ok:false, why:W_TUR},
      {t:'No — haría falta un instrumento 100 veces más exacto que el resistor', ok:false, why:W_TUR},
    ];
    if(puede) return {pregunta, opciones:[{t:'Sí — la incertidumbre del DMM es al menos 4 veces menor que la tolerancia', ok:true,
      why:`U ≈ ±${U.toFixed(U<10?1:0)} Ω frente a ±${tol.toFixed(tol<10?1:0)} Ω: relación ${tur.toFixed(1)}:1, que cumple la regla práctica de ≥4:1 (TUR); el veredicto "dentro/fuera de tolerancia" es confiable.`}, ...mal]};
    return {pregunta, opciones:[{t:'No — la incertidumbre del DMM no es al menos 4 veces menor que la tolerancia', ok:true,
      why:`U ≈ ±${U.toFixed(U<10?1:0)} Ω frente a ±${tol.toFixed(tol<10?1:0)} Ω: relación ${tur.toFixed(1)}:1, por debajo de la regla práctica de 4:1 (TUR); con este instrumento el veredicto "dentro/fuera de tolerancia" no es confiable.`},
      {t:'Sí — la incertidumbre del DMM es menor que la tolerancia, y con eso alcanza', ok:false, why:W_TUR}, ...mal]};
  }
  // divisor
  const UDIV=uNom('vdc',VNODE_MED,mejorRango(VNODE_MED));
  const dif=VNODE_IDEAL-VNODE_MED;
  const rm=x=>(x/1e6).toFixed(3);
  return {
    pregunta:`El divisor ${fmtR(R1)}/${fmtR(R2)} con ${VS.toFixed(2)} V debería dar <b>${VNODE_IDEAL.toFixed(3)} V</b>, pero lees ≈${VNODE_MED.toFixed(3)} V. ¿Por qué?`,
    opciones:[
      {t:'Efecto de carga: los 10 MΩ del DMM quedan en paralelo con R2', ok:true,
       why:`R2 ∥ Z_in = ${rm(RP)} MΩ → V = ${VS.toFixed(2)} × ${rm(RP)}/(${rm(R1)} + ${rm(RP)}) = ${VNODE_MED.toFixed(3)} V. Es un error SISTEMÁTICO: se corrige por cálculo o con un instrumento de mayor Z_in.`},
      {t:'La fuente de alimentación está descargada o su tensión ha bajado', ok:false, why:W_DIV},
      {t:`Incertidumbre aleatoria del DMM (±${UDIV.toFixed(3)} V)`, ok:false, why:W_DIV},
      {t:'El fusible de mA del DMM está dañado', ok:false, why:W_DIV},
      {t:'Las tolerancias de R1 y R2 desplazan el nodo exactamente ese tanto', ok:false, why:W_DIV},
      {t:'La resistencia de las puntas de prueba cae en serie con el nodo', ok:false, why:W_DIV},
      {t:'La corriente de fuga de la tarjeta desvía parte de la corriente', ok:false, why:W_DIV},
    ],
  };
}

/* ============================================================
   ESCENA 3D — 1) MULTÍMETRO (instrumento protagonista)
   ============================================================ */
const stand=roundedBox(2.0,0.5,1.35,MAT.bench,0.06); stand.position.set(-1.25,0.25,0.1); scene.add(stand);
stand.userData={title:'Soporte de banco',info:'Base de trabajo del instrumento. Un DMM real trae un caballete (bail) integrado.'};

const dmm=new THREE.Group(); dmm.position.set(-1.25,1.75,-0.12); dmm.rotation.set(-0.34,0.30,0); scene.add(dmm);
const holster=roundedBox(1.66,2.86,0.34,MAT.holster,0.16); holster.position.set(0,0,-0.03); dmm.add(holster);
holster.userData={title:'Funda protectora',info:'Holster de hule: absorbe caídas. La robustez también es parte de IEC 61010-1.'};
const face=roundedBox(1.46,2.66,0.30,MAT.body,0.10); face.position.set(0,0.02,0.06); dmm.add(face);

// display LCD (canvas vivo, 6000 cuentas)
const bezel=roundedBox(1.26,0.68,0.05,std({color:0x0b0f12,roughness:0.4}),0.02); bezel.position.set(0,0.86,0.20); dmm.add(bezel);
const scrCanvas=document.createElement('canvas'); scrCanvas.width=512; scrCanvas.height=256;
const scrTex=new THREE.CanvasTexture(scrCanvas); scrTex.colorSpace=THREE.SRGBColorSpace; scrTex.minFilter=THREE.LinearFilter; scrTex.generateMipmaps=false;
const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.16,0.58), new THREE.MeshBasicMaterial({map:scrTex,toneMapped:false}));
screen.position.set(0,0.86,0.23); dmm.add(screen);
screen.userData={title:'Display 6000 cuentas',info:'Cuantiza a la resolución del rango (rango/6000) y marca OL en sobrerrango. La barra inferior emula la aguja analógica.'};
const scrLabel=labelSprite('Display · 6000 cuentas','#4FD1C5'); scrLabel.position.set(0,1.35,0.3);
scrLabel.visible=false; scrLabel.raycast=()=>{}; dmm.add(scrLabel); HOVER_LABELS.set(screen,scrLabel);

// rótulo de categoría impreso en la carátula
const catCv=document.createElement('canvas'); catCv.width=512; catCv.height=64;
{ const c=catCv.getContext('2d'); c.fillStyle='rgba(0,0,0,0)'; c.clearRect(0,0,512,64);
  c.fillStyle='#cfd8d4'; c.font='bold 30px Outfit, sans-serif'; c.textAlign='center';
  c.fillText('CAT III 600 V · CAT II 1000 V',256,42); }
const catTex=new THREE.CanvasTexture(catCv); catTex.colorSpace=THREE.SRGBColorSpace;
const catPlate=new THREE.Mesh(new THREE.PlaneGeometry(1.2,0.15), new THREE.MeshBasicMaterial({map:catTex,transparent:true,toneMapped:false}));
catPlate.position.set(0,0.44,0.215); dmm.add(catPlate);
catPlate.userData={title:'Clasificación CAT',info:'IEC 61010-1: la categoría clasifica la energía del transitorio del punto de medición. Este DMM: CAT III hasta 600 V, CAT II hasta 1000 V.'};

// perilla selectora (gira al cambiar de función; clic = siguiente función)
const knob=new THREE.Group(); knob.position.set(0,-0.10,0.24); dmm.add(knob);
const knobBody=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.38,0.14,28),MAT.knob)); knobBody.rotation.x=Math.PI/2; knob.add(knobBody);
const pointerBar=roundedBox(0.10,0.30,0.06,MAT.pointer,0.02); pointerBar.position.set(0,0.20,0.05); knob.add(pointerBar);
knob.userData={knob:true};
const knobLabel=labelSprite('Selector: V⎓ · V~ · Ω · mA (clic)','#ffd166'); knobLabel.position.set(0,0.62,0.2);
knobLabel.visible=false; knobLabel.raycast=()=>{}; knob.add(knobLabel); HOVER_LABELS.set(knob,knobLabel);

// bornes de entrada
const JACK_INFO=[
  {id:'j10a', x:-0.54, mat:MAT.jackGry, lbl:'10 A',  txt:'Borne 10 A — corrientes altas, con su propio fusible de 10 A. No se usa en este lab.'},
  {id:'jma',  x:-0.18, mat:MAT.jackAmb, lbl:'mA',    txt:'Borne mA — corriente hasta 600 mA, protegido por fusible de 400 mA. La corriente se mide EN SERIE.'},
  {id:'jcom', x: 0.18, mat:MAT.jackBlk, lbl:'COM',   txt:'Borne COM — referencia común: aquí va SIEMPRE la punta negra.'},
  {id:'jvom', x: 0.54, mat:MAT.jackRed, lbl:'VΩ',    txt:'Borne VΩ — voltaje y resistencia (punta roja). Z_in = 10 MΩ en V⎓.'},
];
const jackMeshes={};
JACK_INFO.forEach(j=>{
  const g=new THREE.Group(); g.position.set(j.x,-1.08,0.20); dmm.add(g);
  const ring=sh(new THREE.Mesh(new THREE.TorusGeometry(0.085,0.032,10,22), j.mat)); g.add(ring);
  const hole=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.10,14), std({color:0x05070a,roughness:0.9}));
  hole.rotation.x=Math.PI/2; g.add(hole);
  g.userData={title:'Borne '+j.lbl,info:j.txt};
  const lb=labelSprite(j.lbl,'#ffd166'); lb.position.set(0,0.28,0.1); lb.scale.multiplyScalar(0.55);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(g,lb);
  jackMeshes[j.id]=g;
});

/* ============================================================
   ESCENA 3D — 2) ESCENARIOS DE MEDICIÓN (se intercambian con
   scene.add/remove: el Raycaster NO ignora visible=false)
   ============================================================ */
const SCEN_POS=new THREE.Vector3(1.65,0,0.15);

function makeFuente(){
  const g=new THREE.Group(); g.position.copy(SCEN_POS);
  const box=roundedBox(1.5,0.95,1.05,MAT.psu,0.07); box.position.set(0,0.48,0); g.add(box);
  box.userData={title:'Fuente de laboratorio',info:'Salida ajustada a '+fmtVF(VF)+' V⎓ de baja impedancia. En sus bornes, el efecto de carga del DMM es despreciable.'};
  const pd=document.createElement('canvas'); pd.width=256; pd.height=96;
  { const c=pd.getContext('2d'); c.fillStyle='#071410'; c.fillRect(0,0,256,96);
    c.strokeStyle='rgba(79,209,197,.4)'; c.lineWidth=3; c.strokeRect(3,3,250,90);
    c.fillStyle='#4FD1C5'; c.font='bold 44px Outfit, sans-serif'; c.textAlign='center'; c.fillText(fmtVF(VF)+' V',128,62); }
  const pt=new THREE.CanvasTexture(pd); pt.colorSpace=THREE.SRGBColorSpace;
  const pp=new THREE.Mesh(new THREE.PlaneGeometry(0.62,0.23), new THREE.MeshBasicMaterial({map:pt,toneMapped:false}));
  pp.position.set(-0.28,0.62,0.53); g.add(pp);
  for(let i=0;i<2;i++){ const kn=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.06,18),MAT.knob));
    kn.rotation.x=Math.PI/2; kn.position.set(-0.42+i*0.28,0.28,0.545); g.add(kn); }
  const postR=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.18,14),MAT.jackRed)); postR.position.set(0.35,1.045,0.30); g.add(postR);
  postR.userData={title:'Borne + (positivo)',info:'Salida positiva de la fuente. Aquí toca la punta roja.'};
  const postB=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.18,14),MAT.jackBlk)); postB.position.set(0.62,1.045,0.30); g.add(postB);
  postB.userData={title:'Borne − (retorno)',info:'Retorno de la fuente. Aquí toca la punta negra (COM).'};
  const lb=labelSprite('Fuente '+fmtVF(VF)+' V⎓','#4FD1C5'); lb.position.set(0,1.55,0.2);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(box,lb);
  return g;
}

const envCanvas=document.createElement('canvas'); envCanvas.width=512; envCanvas.height=96;
const envTex=new THREE.CanvasTexture(envCanvas); envTex.colorSpace=THREE.SRGBColorSpace;
function drawEnvLabel(){
  const c=envCanvas.getContext('2d'); const em=ENV_META[envKey];
  c.fillStyle='#0b1512'; c.fillRect(0,0,512,96);
  c.strokeStyle=em.ok?'rgba(79,209,197,.5)':'rgba(244,71,94,.8)'; c.lineWidth=4; c.strokeRect(4,4,504,88);
  c.fillStyle=em.ok?'#4FD1C5':'#f4475e'; c.font='bold 32px Outfit, sans-serif'; c.textAlign='center';
  c.fillText(em.nombre+' · '+em.cat,256,42);
  c.fillStyle='#8FB3AC'; c.font='20px Outfit, sans-serif'; c.fillText(em.det,256,74);
  envTex.needsUpdate=true;
}

function makeTomacorriente(){
  const g=new THREE.Group(); g.position.copy(SCEN_POS);
  const wall=roundedBox(1.15,1.6,0.14,MAT.wall,0.04); wall.position.set(0,0.80,-0.10); g.add(wall);
  wall.userData={title:'Punto de la instalación',info:'El MISMO voltaje (127 V~) puede vivir en CAT II, III o IV: cambia la energía del transitorio disponible, no el voltaje.'};
  const plate=roundedBox(0.52,0.78,0.05,MAT.plate,0.02); plate.position.set(0,0.86,-0.005); g.add(plate);
  const mkSlot=(x,y)=>{ const s=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.16,0.03),MAT.slot); s.position.set(x,y,0.02); g.add(s); return s; };
  const sL=mkSlot(-0.085,0.92), sR=mkSlot(0.085,0.92);
  sL.userData={title:'Fase (127 V~)',info:'Ranura viva del receptáculo. Punta roja aquí.'};
  sR.userData={title:'Neutro',info:'Retorno de la red. Punta negra (COM) aquí.'};
  const gnd=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.04,12),MAT.slot);
  gnd.rotation.x=Math.PI/2; gnd.position.set(0,0.70,0.02); g.add(gnd);
  gnd.userData={title:'Tierra física',info:'Conductor de puesta a tierra (NOM-001-SEDE).'};
  const envPlate=new THREE.Mesh(new THREE.PlaneGeometry(1.0,0.19), new THREE.MeshBasicMaterial({map:envTex,toneMapped:false}));
  envPlate.position.set(0,1.75,-0.02); g.add(envPlate);
  envPlate.userData={title:'Categoría del punto de medición',info:'Cámbiala en el panel: tomacorriente (CAT II), tablero (CAT III) o acometida (CAT IV).'};
  const lb=labelSprite('Red 127 V~','#FFB703'); lb.position.set(0,2.0,0);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(wall,lb);
  return g;
}

function makeResistor(){
  const g=new THREE.Group(); g.position.copy(SCEN_POS);
  const base=roundedBox(1.3,0.16,0.7,MAT.bench,0.05); base.position.set(0,0.08,0); g.add(base);
  const mkPost=x=>{ const p=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.34,14),MAT.wire)); p.position.set(x,0.33,0); g.add(p); return p; };
  const pL=mkPost(-0.48), pR=mkPost(0.48);
  pL.userData={title:'Poste de conexión',info:'Sujeta la terminal del resistor. Medición a 2 hilos: la resistencia de contacto entra en la lectura.'};
  pR.userData=pL.userData;
  const body=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.10,0.55,20),MAT.resistor)); body.rotation.z=Math.PI/2; body.position.set(0,0.50,0); g.add(body);
  body.userData={title:'Resistor axial '+fmtR(RN)+' ±'+RTOL+' %',info:'Las bandas de color dan el valor nominal y la tolerancia (IEC 60062). Su valor REAL está en algún punto de esa tolerancia: mídelo.'};
  // bandas de color (código real de 4 bandas, calculado del valor nominal)
  const BANDS=bandasResistor(RN,RTOL).map((col,i)=>[col,[-0.16,-0.08,0.00,0.20][i]]);
  BANDS.forEach(([col,x])=>{ const b=new THREE.Mesh(new THREE.CylinderGeometry(0.105,0.105,0.035,20), std({color:new THREE.Color(col),roughness:0.6}));
    b.rotation.z=Math.PI/2; b.position.set(x,0.50,0); g.add(b); });
  [-1,1].forEach(s=>{ const w=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,0.21,8),MAT.wire);
    w.rotation.z=Math.PI/2; w.position.set(s*0.38,0.50,0); g.add(w); });
  const lb=labelSprite(fmtR(RN)+' ±'+RTOL+' % (fuera de circuito)','#ffd166'); lb.position.set(0,0.95,0);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(body,lb);
  return g;
}

function makeDivisor(){
  const g=new THREE.Group(); g.position.copy(SCEN_POS);
  [-0.5,0.5].forEach(sx=>[-0.32,0.32].forEach(sz=>{ const so=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.12,10),MAT.wire);
    so.position.set(sx,0.06,sz); g.add(so); }));
  const pcb=roundedBox(1.15,0.06,0.78,MAT.pcb,0.02); pcb.position.set(0,0.15,0); g.add(pcb);
  pcb.userData={title:'Divisor resistivo '+fmtR(R1)+' / '+fmtR(R2),info:'R1 y R2 en serie sobre la fuente; el nodo central (TP1) es el punto de medición.'};
  const mod=roundedBox(0.42,0.30,0.34,MAT.psu,0.05); mod.position.set(-0.30,0.33,-0.16); g.add(mod);
  mod.userData={title:'Fuente '+VS.toFixed(2)+' V',info:'Alimenta al divisor.'};
  const mkR=(x,name,val)=>{ const r=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.30,14),MAT.resistor));
    r.rotation.z=Math.PI/2; r.position.set(x,0.24,-0.02); g.add(r);
    r.userData={title:name,info:fmtR(val)+'. En serie forman el divisor: sin carga, V_nodo = Vs × R2/(R1+R2).'}; return r; };
  mkR(0.10,'R1 · '+fmtR(R1),R1); mkR(0.42,'R2 · '+fmtR(R2),R2);
  const mkTP=(x,mat,name,info)=>{ const tp=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.028,0.12,10),mat));
    tp.position.set(x,0.27,0.22); g.add(tp); tp.userData={title:name,info}; return tp; };
  mkTP(0.26,MAT.jackRed,'TP1 · nodo central','Punto de prueba del nodo R1–R2. Punta roja aquí.');
  mkTP(0.58,MAT.jackBlk,'TP0 · tierra (GND)','Referencia del circuito. Punta negra aquí.');
  const lb=labelSprite('Divisor '+fmtR(R1)+' / '+fmtR(R2)+' · '+VS.toFixed(0)+' V','#4FD1C5'); lb.position.set(0,0.75,0);
  lb.visible=false; lb.raycast=()=>{}; g.add(lb); HOVER_LABELS.set(pcb,lb);
  return g;
}

const SCEN_GROUPS={fuente:makeFuente(),tomacorriente:makeTomacorriente(),resistor:makeResistor(),divisor:makeDivisor()};
const SCEN_MAKERS={fuente:makeFuente,tomacorriente:makeTomacorriente,resistor:makeResistor,divisor:makeDivisor};
/* El escenario se rehace con los datos sembrados (al resembrar y en la demostración). */
function rebuildScenario(key){
  const old=SCEN_GROUPS[key], enEscena=old.parent===scene;
  if(enEscena) scene.remove(old);
  old.traverse(o=>{ if(o.geometry) o.geometry.dispose(); });
  SCEN_GROUPS[key]=SCEN_MAKERS[key]();
  if(enEscena) scene.add(SCEN_GROUPS[key]);
}

/* ============================================================
   ESCENA 3D — 3) PUNTAS DE PRUEBA (se recolocan por escenario;
   la roja cambia de borne VΩ↔mA según la función)
   ============================================================ */
const probesGroup=new THREE.Group(); scene.add(probesGroup);
function makeProbe(handleMat){
  const p=new THREE.Group();
  const tip=sh(new THREE.Mesh(new THREE.ConeGeometry(0.022,0.16,12),MAT.tip)); tip.rotation.x=Math.PI; tip.position.set(0,0.08,0); p.add(tip);
  const barrel=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.12,10),MAT.tip)); barrel.position.set(0,0.20,0); p.add(barrel);
  const collar=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.034,0.10,12),handleMat)); collar.position.set(0,0.30,0); p.add(collar);
  const handle=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.046,0.05,0.34,14),handleMat)); handle.position.set(0,0.50,0); p.add(handle);
  return p;
}
function leadFrom(jackGroup,probe,mat){
  const a=new THREE.Vector3(); jackGroup.getWorldPosition(a);
  const b=probe.localToWorld(new THREE.Vector3(0,0.68,0));
  const m1=a.clone().lerp(b,0.30); m1.y=Math.max(0.10,Math.min(a.y,b.y)-0.55); m1.z+=0.55;
  const m2=a.clone().lerp(b,0.70); m2.y=Math.max(0.12,m1.y+0.08); m2.z+=0.45;
  const tube=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,m1,m2,b]),40,0.020,8),mat);
  tube.castShadow=true; return tube;
}
function placeProbes(){
  (placeProbes._tagged||[]).forEach(o=>HOVER_LABELS.delete(o));
  placeProbes._tagged=[];
  while(probesGroup.children.length){
    const c=probesGroup.children[0]; probesGroup.remove(c);
    c.traverse(o=>{ if(o.geometry)o.geometry.dispose(); });
  }
  const cp=SCEN_META[scenarioKey].contactos;
  const lift=connected?0:0.45;                       // puntas separadas hasta conectar
  const pr=makeProbe(MAT.probeRed), pb=makeProbe(MAT.probeBlk);
  pr.position.set(cp.red[0],cp.red[1]+lift,cp.red[2]);
  pb.position.set(cp.black[0],cp.black[1]+lift,cp.black[2]);
  const rot=cp.rot||[0,0,0.15];
  pr.rotation.set(rot[0],rot[1],rot[2]); pb.rotation.set(rot[0],rot[1],-rot[2]);
  pr.userData={title:'Punta roja',info:'Va al borne '+(func==='madc'?'mA':'VΩ')+'. Toca el punto de potencial alto.'};
  pb.userData={title:'Punta negra',info:'Va SIEMPRE al borne COM. Toca la referencia (retorno/tierra).'};
  probesGroup.add(pr,pb);
  scene.updateMatrixWorld(true);
  const redJack=(func==='madc')?jackMeshes.jma:jackMeshes.jvom;
  probesGroup.add(leadFrom(redJack,pr,MAT.cableRed));
  probesGroup.add(leadFrom(jackMeshes.jcom,pb,MAT.cable));
  const lr=labelSprite('Punta roja → '+(func==='madc'?'mA':'VΩ'),'#f4a3a3'); lr.position.set(0,0.95,0); lr.scale.multiplyScalar(0.7);
  lr.visible=false; lr.raycast=()=>{}; pr.add(lr); HOVER_LABELS.set(pr,lr);
  const lbk=labelSprite('Punta negra → COM','#8a9299'); lbk.position.set(0,0.95,0); lbk.scale.multiplyScalar(0.7);
  lbk.visible=false; lbk.raycast=()=>{}; pb.add(lbk); HOVER_LABELS.set(pb,lbk);
  placeProbes._tagged.push(pr,pb);
}

S.start();

/* ============================================================
   HUD (izquierda) — concepto + contrato de fidelidad
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Instrumentación · Medición eléctrica</div>
  <h2>Multímetro digital: exactitud y categorías</h2>
  <p>Un DMM de <b>6000 cuentas</b> no da "el valor": da una <b>lectura ± incertidumbre</b>. Resuelve los 4 casos eligiendo función y rango, reporta cada medición con su banda <b>U</b> — y respeta la categoría <b>CAT</b> del punto donde metes las puntas.</p>
  <div class="formula">U = ±(% de lectura + N dígitos)<br>resolución = rango / 6000<br>V_med = V·Z_in/(Z_in+R_th) — carga</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#c23434"></span>Borne VΩ · punta roja</div>
    <div class="li"><span class="dot" style="background:#14181c;border:1px solid #445"></span>Borne COM · punta negra</div>
    <div class="li"><span class="dot" style="background:#cc8a00"></span>Borne mA · fusible 400 mA</div>
    <div class="li"><span class="dot" style="background:#5a636a"></span>Borne 10 A · corriente alta</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> presupuesto de exactitud ±(% lectura + dígitos) y resolución por rango de un DMM de 6000 cuentas; autorrango; impedancia de entrada de 10 MΩ y su efecto de carga; categorías de medición CAT II/III/IV; el fusible de la entrada mA.</div>
    <div class="fl no"><b>NO modela:</b> deriva térmica ni envejecimiento, respuesta true-RMS con ondas no senoidales, rechazo de ruido (NMRR/CMRR), ni la calibración trazable (el certificado real lo emite un laboratorio acreditado). Especificaciones representativas de un DMM industrial de 6000 cuentas — consulta la hoja de datos de TU instrumento.</div>
  </div>
  <div class="src">Ref: IEC 61010-1 (CAT II–IV) · JCGM 100:2008 (GUM) / NMX-CH-140-IMNC-2002 · formato ±(%+dígitos) de hoja de datos DMM</div>`;

/* ============================================================
   PANEL (derecha) — el instrumento se opera desde aquí
   ============================================================ */
document.getElementById('panel').innerHTML=`
  <h4>Multímetro · <span id="p_case" style="color:var(--accent2)">Caso 1/4</span></h4>
  <div class="modebar" id="funcbar">
    <button class="b on" id="f_vdc">V⎓</button>
    <button class="b" id="f_vac">V~</button>
    <button class="b" id="f_ohm">Ω</button>
    <button class="b" id="f_madc">mA</button>
  </div>
  <div class="modebar" id="rangebar"></div>
  <div id="tele">
    <div class="g"><div class="gl"><span>Lectura</span><b id="t_read">—</b></div></div>
    <div class="g"><div class="gl"><span>Incertidumbre U</span><b id="t_u">—</b></div></div>
    <div class="g"><div class="gl"><span>Resolución</span><b id="t_res">—</b></div></div>
    <div class="g"><div class="gl"><span>Uso del rango</span><b id="t_pct">—</b></div></div>
    <div class="g"><div class="gl"><span>Rango</span><b id="t_rng">—</b></div></div>
    <div class="g"><div class="gl"><span>Estado</span><b id="t_est">—</b></div></div>
  </div>
  <div class="console" id="report">Conecta las puntas (🔌) para iniciar la medición.</div>
  <h4 class="sec" id="envTitle">Punto de medición · categoría CAT</h4>
  <div class="modebar" id="envbar">
    <button class="b on" id="e_cat2">Pared · CAT II</button>
    <button class="b" id="e_cat3">Tablero · CAT III</button>
    <button class="b" id="e_cat4">Acometida · CAT IV</button>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Medición automática (guiada)</button>
    <button class="b primary" id="btnConnect">🔌 Conectar puntas</button>
    <button class="b" id="btnNew">🔀 Nuevo caso</button>
    <button class="b" id="btnFuse" style="display:none">🧯 Reponer fusible (400 mA)</button>
  </div>`;

const el=id=>document.getElementById(id);

/* ---------- display, telemetría e informe ---------- */
function drawScreen(m,time){
  const c=scrCanvas.getContext('2d');
  c.fillStyle='#0a1512'; c.fillRect(0,0,512,256);
  c.strokeStyle='rgba(79,209,197,.35)'; c.lineWidth=3; c.strokeRect(5,5,502,246);
  c.fillStyle='#4FD1C5'; c.font='bold 26px Outfit, sans-serif'; c.textAlign='left';
  c.fillText(FUNC_LABEL[func],20,40);
  c.font='16px Outfit, sans-serif'; c.fillStyle='#8FB3AC';
  if(rangeSel==='auto')c.fillText('AUTO',88,38);
  c.textAlign='right'; c.fillText('CAT III 600 V',492,38); c.textAlign='left';
  if(m.state==='fuse'){
    if(Math.floor(time*2)%2===0){ c.fillStyle='#f4475e'; c.font='bold 84px Outfit, sans-serif'; c.textAlign='center'; c.fillText('FUSE',256,150); }
    c.fillStyle='#8FB3AC'; c.font='18px Outfit, sans-serif'; c.textAlign='center';
    c.fillText('entrada mA abierta · repón el fusible de 400 mA',256,200); c.textAlign='left';
  }else if(m.state==='err'){
    const junk=(Math.abs(Math.sin(time*17.3))*Math.abs(Math.sin(time*5.1))*6).toFixed(3);
    c.fillStyle='#FFB703'; c.font='bold 84px Outfit, sans-serif'; c.textAlign='right'; c.fillText(junk,420,150);
    c.font='18px Outfit, sans-serif'; c.textAlign='center';
    c.fillText('⚠ Ω en circuito energizado — lectura sin sentido',256,200); c.textAlign='left';
  }else if(m.state==='ol'){
    c.fillStyle='#EAF4F1'; c.font='bold 84px Outfit, sans-serif'; c.textAlign='right'; c.fillText('OL',420,150); c.textAlign='left';
    c.fillStyle='#5b6f6a'; c.font='15px Outfit, sans-serif';
    c.fillText('Rango '+rangeName(func,m.range)+' — sobrerrango: sube de rango',20,196);
  }else{
    const s=scaleFor(func,m.range), d=decimalsFor(m.range,s.m);
    c.fillStyle='#EAF4F1'; c.font='bold 84px Outfit, sans-serif'; c.textAlign='right';
    c.fillText((m.reading*s.m).toFixed(d),420,150);
    c.font='bold 34px Outfit, sans-serif'; c.fillStyle='#4FD1C5'; c.textAlign='left'; c.fillText(s.u,432,150);
    c.font='15px Outfit, sans-serif'; c.fillStyle='#5b6f6a';
    c.fillText('Rango '+rangeName(func,m.range)+' · resolución '+fmtVal(m.res,func,m.range),20,196);
    const segs=40, on=Math.round(Math.min(1,m.pct/100)*segs);
    for(let i=0;i<segs;i++){ c.fillStyle=i<on?'#4FD1C5':'#15251f'; c.fillRect(20+i*11.8,214,8,18); }
  }
  scrTex.needsUpdate=true;
}

function updateTele(m){
  const set=(id,txt,cls)=>{ const b=el(id); b.textContent=txt; b.className=cls||''; };
  if(m.state==='ok'){
    set('t_read',fmtVal(m.reading,func,m.range));
    set('t_u','±'+fmtU(m.U,func,m.range), m.pct<10?'warn':'good');
    set('t_res',fmtVal(m.res,func,m.range));
    set('t_pct',m.pct.toFixed(0)+' %', m.pct<10?'warn':m.pct>95?'bad':'good');
    set('t_rng',rangeName(func,m.range)+(rangeSel==='auto'?' · AUTO':''));
    set('t_est','OK','good');
  }else{
    ['t_read','t_u','t_res','t_pct'].forEach(id=>set(id,'—'));
    set('t_rng', m.range?rangeName(func,m.range):'—');
    set('t_est', m.state==='ol'?'OL':m.state==='fuse'?'FUSE':m.state==='err'?'⚠ Err':'—',
        (m.state==='fuse'||m.state==='err')?'bad':'warn');
  }
}

function updateReport(m){
  const meta=SCEN_META[scenarioKey];
  let html=`<b>${meta.mision}</b><br>`;
  if(!connected){
    html+='<span class="mono">Puntas separadas'+(func==='ohm'?' — el ohmímetro marca OL (circuito abierto)':'')+'. Pulsa 🔌 para tocar el punto de medición.</span>';
  }else if(m.state==='fuse'){
    html+='<span class="dtc">FUSIBLE ABIERTO</span> <span class="mono">En mA el DMM es casi un corto: mide EN SERIE, nunca en paralelo con una fuente. El fusible de 400 mA se sacrificó para protegerte (IEC 61010-1).</span>';
  }else if(m.state==='err'){
    html+='<span class="dtc">⚠ NUNCA midas Ω en un circuito energizado</span><br><span class="mono">El ohmímetro inyecta su propia corriente de prueba: un voltaje externo falsea la lectura y puede dañar el instrumento. Desenergiza y descarga antes de medir.</span>';
  }else if(m.state==='ol'){
    html+='<span class="mono">OL — la señal excede el rango '+rangeName(func,m.range)+'. Sube de rango o usa AUTO.</span>';
  }else{
    const sp=METER.spec[func], s=scaleFor(func,m.range), d=decimalsFor(m.range,s.m);
    const du=uDecimals(m.U,m.range,s.m);   // el intervalo hereda los decimales de U
    const lo=((m.reading-m.U)*s.m).toFixed(du), hi=((m.reading+m.U)*s.m).toFixed(du);
    html+=`<span class="mono">U = ±(${sp.pct} % × ${(m.reading*s.m).toFixed(d)} + ${sp.dig} × ${(m.res*s.m).toFixed(d)}) = <b>±${(m.U*s.m).toFixed(du)} ${s.u}</b></span><br>`+
          `<span class="mono">Lectura: <b>${fmtVal(m.reading,func,m.range)}</b> → intervalo [${lo} … ${hi}] ${s.u}</span>`;
    if(scenarioKey==='tomacorriente'&&func==='vac'){
      const em=ENV_META[envKey];
      html+=`<br><span class="mono">Punto medido: ${em.nombre} — ${em.cat}. Compara con la clasificación impresa en la carátula del DMM.</span>`;
      if(solved){
        html+= em.ok
          ? `<br><span class="ok">✔ ${em.cat} — dentro de la categoría del DMM (CAT III 600 V).</span>`
          : `<br><span class="dtc">⚠ ${em.cat} — EXCEDE la categoría del DMM (IEC 61010-1). No midas aquí con este instrumento.</span>`;
      }
    }
    if(scenarioKey==='divisor'&&func==='vdc'){
      html+=`<br><span class="mono">Divisor ideal sin cargar: ${VNODE_IDEAL.toFixed(3)} V.`+
            (solved?` — la diferencia es el efecto de carga de Z_in = 10 MΩ.`:``)+
            `</span>`;
    }
  }
  el('report').innerHTML=html;
}

function refreshMeter(){ const m=measure(simT); drawScreen(m,simT); updateTele(m); updateReport(m); }

/* ---------- interacción ---------- */
function refreshCaseLabel(){ el('p_case').textContent='Caso '+(SCEN_ORDER.indexOf(scenarioKey)+1)+'/4'; }
function clearDx(){ document.querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong')); }

let knobTarget=KNOB_ANGLE[func];
function setFunc(f){
  func=f;
  ['vdc','vac','ohm','madc'].forEach(k=>el('f_'+k).classList.toggle('on',k===f));
  rangeSel='auto'; buildRangeBar(); knobTarget=KNOB_ANGLE[f];
  placeProbes();                                    // la punta roja cambia de borne en mA
  refreshMeter();
}
function buildRangeBar(){
  const bar=el('rangebar');
  bar.innerHTML=`<button class="b on" data-r="auto">AUTO</button>`+
    METER.ranges[func].map(r=>`<button class="b" data-r="${r}">${rangeName(func,r)}</button>`).join('');
  bar.querySelectorAll('.b').forEach(b=>{ b.onclick=()=>setRange(b.dataset.r==='auto'?'auto':+b.dataset.r); });
}
function setRange(r){
  rangeSel=r;
  el('rangebar').querySelectorAll('.b').forEach(b=>b.classList.toggle('on',(b.dataset.r==='auto'?'auto':+b.dataset.r)===r));
  refreshMeter();
}
['vdc','vac','ohm','madc'].forEach(k=>{ el('f_'+k).onclick=()=>setFunc(k); });

function setEnv(k){
  envKey=k;
  ['cat2','cat3','cat4'].forEach(e=>el('e_'+e).classList.toggle('on',e===k));
  drawEnvLabel(); refreshMeter();
  if(!ENV_META[k].ok){
    synth.beep(240,0.18,0.06);
    showToast(solved
      ? '<span style="color:var(--bad)">⚠ Acometida = CAT IV.</span><br><span style="color:var(--dim);font-size:11px">Este DMM es CAT III 600 V: ahí NO se usa, aunque el voltaje sea el mismo.</span>'
      : '<span style="color:var(--bad)">⚠ Acometida = CAT IV.</span><br><span style="color:var(--dim);font-size:11px">Antes de medir aquí, compara esta categoría con la clasificación impresa en la carátula del DMM.</span>');
  }
}
['cat2','cat3','cat4'].forEach(k=>{ el('e_'+k).onclick=()=>setEnv(k); });

function renderQuiz(){
  el('q_text').innerHTML=quizNow.pregunta;
  el('dxbtns').innerHTML=quizNow.opciones.map((o,i)=>`<button class="b dx" data-i="${i}">${'ABCD'[i]} · ${o.t}</button>`).join('');
  el('dxbtns').querySelectorAll('.b.dx').forEach(btn=>{ btn.onclick=()=>answer(+btn.dataset.i); });
}
/* Una correcta + 3 del banco de distractores, barajadas: ni la posición ni el
   largo delatan la respuesta, y tras una resiembra salen otras. */
function refreshQuestion(){
  const q=buildQuiz(scenarioKey);
  const buenas=q.opciones.filter(o=>o.ok), malas=q.opciones.filter(o=>!o.ok);
  quizNow={pregunta:q.pregunta,opciones:shuffled(buenas.concat(shuffled(malas).slice(0,3)))};
  renderQuiz();
}
function resiembra(){
  fallosCaso[scenarioKey]=0; RETO.resiembras++;
  seedCase(scenarioKey); rebuildScenario(scenarioKey);
  solved=false; refreshQuestion(); refreshMeter();
}
function answer(i){
  if(!connected){ showToast('Primero conecta las puntas al punto de medición.'); return; }
  if(autoRunning) return;                 // la demostración enseña, no puntúa
  if(answered[scenarioKey]){ showToast('Este caso ya está resuelto: pasa al siguiente.'); return; }
  const o=quizNow.opciones[i]; clearDx();
  const btn=el('dxbtns').children[i];
  RETO.intentos++;
  if(o.ok){
    btn.classList.add('right'); solved=true; answered[scenarioKey]=true; fallosCaso[scenarioKey]=0; synth.beep(1046,0.12,0.06);
    showToast(`<span style="color:var(--good)">✔ Correcto.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
    refreshMeter();
  }else{
    btn.classList.add('wrong'); synth.beep(220,0.15,0.06);
    fallosCaso[scenarioKey]++;
    if(fallosCaso[scenarioKey]>=3){
      resiembra();
      showToast(`<span style="color:var(--bad)">✗ Tres fallos en este caso.</span><br><span style="color:var(--dim);font-size:11px">Cambian los datos del caso: vuelve a medir con calma y razona cada paso.</span>`);
    } else {
      showToast(`<span style="color:var(--bad)">✗ Revisa el modelo.</span><br><span style="color:var(--dim);font-size:11px">${o.why} (fallos en este caso: ${fallosCaso[scenarioKey]}/3)</span>`);
    }
  }
}

function setScenario(key){
  if(autoRunning) return;
  scene.remove(SCEN_GROUPS[scenarioKey]);
  scenarioKey=key; scene.add(SCEN_GROUPS[key]);
  solved=!!answered[key]; clearDx(); placeProbes(); refreshQuestion(); refreshCaseLabel();
  const esToma=key==='tomacorriente';
  el('envTitle').style.display=esToma?'':'none';
  el('envbar').style.display=esToma?'':'none';
  if(esToma)drawEnvLabel();
  const meta=SCEN_META[key];
  S.moveTo(meta.cam[0],meta.cam[1],1.3);
  refreshMeter();
  showToast('🔀 '+meta.nombre+' — elige función y rango.');
}
el('btnNew').onclick=()=>{ setScenario(SCEN_ORDER[(SCEN_ORDER.indexOf(scenarioKey)+1)%SCEN_ORDER.length]); };

el('btnConnect').onclick=e=>{
  connected=!connected;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',connected);
  e.target.textContent=connected?'🔌 Separar puntas':'🔌 Conectar puntas';
  if(connected){ S.setCinematicIdle(true); synth.beep(880,0.1,0.06); }
  else S.setCinematicIdle(false);
  placeProbes(); refreshMeter();
};

function onFuseBlow(){
  synth.beep(180,0.3,0.08); setTimeout(()=>synth.beep(120,0.35,0.08),160);
  el('btnFuse').style.display='';
  showToast('<span style="color:var(--bad)">💥 ¡Fusible de mA fundido!</span><br><span style="color:var(--dim);font-size:11px">En mA el DMM es casi un corto (la corriente se mide EN SERIE). En paralelo con una fuente, el fusible de 400 mA se sacrifica — IEC 61010-1.</span>');
}
el('btnFuse').onclick=()=>{
  fuseBlown=false; el('btnFuse').style.display='none'; synth.beep(660,0.1,0.05);
  showToast('🧯 Fusible repuesto. Cambia de función o separa las puntas antes de volver a medir corriente: en paralelo se funde de nuevo.');
  refreshMeter();
};

pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return; let o=hit.object;
  while(o){
    if(o.userData&&o.userData.knob){
      const ks=['vdc','vac','ohm','madc'];
      setFunc(ks[(ks.indexOf(func)+1)%4]); synth.beep(520,0.05,0.04);
      showToast('Selector → función '+FUNC_LABEL[func]);
      return;
    }
    if(o.userData&&o.userData.info){
      showToast(`<b style="color:var(--accent2)">${o.userData.title}</b><br><span style="color:var(--dim);font-size:11px">${o.userData.info}</span>`);
      return;
    }
    o=o.parent;
  }
});

/* ---------- etiquetas al pasar el cursor: escena limpia, rótulo bajo demanda ---------- */
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

/* ---------- Modo automático (guiado) — para quien no es ingeniero ----------
   Conecta las puntas, elige función y rango, lee el informe con su banda U
   y contesta la pregunta del caso, explicando cada paso en lenguaje llano. */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const btn=el('btnAuto'); const label=btn.textContent;
  btn.disabled=true; btn.classList.add('on'); btn.textContent='⏳ Medición guiada en curso…';
  const prev={datos:guardaDatos(),connected,func,rangeSel,quiz:quizNow,solved};
  try{
    clearDx();
    const key=scenarioKey, meta=SCEN_META[key];
    // La demostración trabaja con OTROS datos (DEMO): lo del alumno no se toca.
    datosDemo(); CAT_Q=(prev.datos.CAT_Q+1)%3;
    rebuildScenario(key); refreshMeter();
    if(!connected){ showToast('Paso 1 · Conectamos las puntas: roja a '+(meta.funcion==='madc'?'mA':'VΩ')+', negra a COM (datos de ejemplo).'); el('btnConnect').click(); await sleep(1700); }
    setFunc(meta.funcion); showToast('Paso 2 · Función '+FUNC_LABEL[meta.funcion]+' — '+meta.porQue); await sleep(2300);
    setRange('auto'); showToast('Paso 3 · AUTO busca el rango más bajo sin sobrerrango: más cuentas = mejor resolución.'); await sleep(2300);
    if(key==='fuente'){
      const rs=METER.ranges.vdc, best=mejorRango(VF), alto=rs.find(r=>r>best);
      if(alto){ setRange(alto); showToast('Paso 4 · A propósito en '+rangeName('vdc',alto)+': mira en el panel cómo U sube a ±'+uNom('vdc',VF,alto).toFixed(3)+' V.'); await sleep(2600); }
      setRange(best); showToast('Paso 5 · En '+rangeName('vdc',best)+' (el menor sin OL), U baja a ±'+uNom('vdc',VF,best).toFixed(3)+' V.'); await sleep(2600);
    }else if(key==='tomacorriente'){
      showToast('Paso 4 · Los botones Pared / Tablero / Acometida cambian el punto de medición: compara siempre la categoría del punto con la impresa en la carátula del DMM antes de medir.'); await sleep(3200);
    }else if(key==='resistor'){
      const rango=METER.ranges.ohm.find(r=>R_ACTUAL<r)??METER.ranges.ohm[METER.ranges.ohm.length-1];
      const U=uNom('ohm',R_ACTUAL,rango), tol=RN*RTOL/100;
      showToast('Paso 4 · Compara: U ≈ ±'+U.toFixed(U<10?1:0)+' Ω del DMM contra ±'+tol.toFixed(tol<10?1:0)+' Ω de tolerancia del componente de ejemplo (relación '+(tol/U).toFixed(1)+':1).'); await sleep(3000);
    }else{
      showToast('Paso 4 · Con los datos de ejemplo el nodo debería dar '+VNODE_IDEAL.toFixed(3)+' V pero lee '+VNODE_MED.toFixed(3)+' V: el instrumento carga al divisor.'); await sleep(3000);
    }
    const ok=buildQuiz(key).opciones.find(o=>o.ok);
    showToast('<span style="color:var(--good)">✔ Resultado del ejemplo</span><br>'+ok.t+'<br><span style="color:var(--dim);font-size:11px">'+ok.why+' Tu avance en el reto no cambió.</span>'); await sleep(2800);
  } finally {
    restauraDatos(prev.datos); rebuildScenario(scenarioKey);
    autoRunning=false;
    setFunc(prev.func); setRange(prev.rangeSel);
    if(connected!==prev.connected) el('btnConnect').click();
    solved=prev.solved; quizNow=prev.quiz; renderQuiz();
    btn.disabled=false; btn.classList.remove('on'); btn.textContent=label;
    refreshMeter();
  }
}
el('btnAuto').onclick=runAuto;

/* ---------- lazo de animación ---------- */
S.setAnimate((dt,time)=>{
  simT=time;
  knob.rotation.z += (knobTarget-knob.rotation.z)*Math.min(1,dt*8);
  mainsV=127.0+Math.sin(time*0.13)*0.9+Math.sin(time*0.031)*0.5;   // la red deriva ±1.4 V
  if(time-(drawScreen._t||0)>0.25){
    const m=measure(time);
    drawScreen(m,time); updateTele(m); updateReport(m);
    drawScreen._t=time;
  }
});

window.__labDebug={
  get mode(){ return scenarioKey; },
  get solved(){ return Object.values(answered).every(Boolean); },
  get intentos(){ return RETO.intentos; },
  state(){ return {caso:scenarioKey,conectado:connected,answered:{...answered},intentos:RETO.intentos,
    fallos:{...fallosCaso},resiembras:RETO.resiembras,resuelto:Object.values(answered).every(Boolean),autoRunning}; },
  datos(){ return guardaDatos(); },
  setScenario(k){ setScenario(k); },
  conecta(){ if(!connected) el('btnConnect').click(); },
  opciones(){ return [...document.querySelectorAll('#dxbtns .b.dx')].map((b,i)=>({t:b.textContent,ok:!!quizNow.opciones[i].ok})); },
};
setFunc('vdc');
setScenario('fuente');
