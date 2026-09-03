/* ============================================================
   LAB — CIRCUITO EQUIVALENTE POR ENSAYOS DE VACÍO Y CORTOCIRCUITO
   (Dominio D5 · transformadores — molde S+P: esquemático interactivo
   + panel de instrumentos virtual, sin ensamble mecánico)
   Normatividad de referencia:
     · IEC 60076-1 — Cláusula 11.4 "Measurement of short-circuit impedance
       and load loss" (ensayo de cortocircuito: Vsc, Isc, Psc) y Cláusula
       11.5 "Measurement of the no-load loss and current" (ensayo de
       vacío: Voc, Ioc, Poc).
     · ANSI/IEEE C57.12.90 — Cláusula 8, ensayos de rutina de vacío y
       cortocircuito sobre transformadores de potencia y distribución.
     Los números de cláusula se citan de la mejor referencia disponible al
     momento de escribir este lab y quedan marcados para verificación por
     un experto normativo (ver ficha.md, banderas_incertidumbre).
   Modelo de ingeniería (didáctico):
     · Ensayo de vacío: se excita el devanado de BT (X1-X2) con tensión
       reducida, dejando el de AT (H1-H2) en circuito abierto. Del
       triángulo de potencias S0=Voc·Ioc, Q0=√(S0²−Poc²) se obtienen
       Rc=Voc²/Poc y Xm=Voc²/Q0 en el lado de BT, y se refieren al lado
       de AT multiplicando por a²=(N1/N2)².
     · Ensayo de cortocircuito: se cortocircuita el devanado de BT
       (X1-X2) y se excita el de AT (H1-H2) hasta la corriente nominal.
       Del triángulo de impedancias Zeq=Vsc/Isc, Req=Psc/Isc²,
       Xeq=√(Zeq²−Req²) se obtiene la rama serie, ya referida a AT.
     · Con Req/Xeq ya obtenidos, la regulación de voltaje a plena carga
       usa la fórmula aproximada con corrección de 2° orden:
       %VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200 (signo "+"
       para FP en atraso).
     · La eficiencia usa directamente Poc y Psc:
       η(x)=x·S·FP/(x·S·FP+Poc+x²·Psc); eficiencia máxima cuando
       pérdidas fijas = pérdidas variables, x_máx=√(Poc/Psc).
     · Todos los valores de placa y de ensayo (Voc, Ioc, Poc, Vsc, Psc)
       son constantes fijas elegidas a mano: CERO Math.random() en la
       física del lab. Las cantidades derivadas se CALCULAN en código.
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.4,3.0,6.6],target:[0.3,1.4,-0.3],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.2,maxD:16});
const {scene}=S;
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};

const brush=brushedMetal(), alu=castAluminum(), plas=techPlastic(0.09,0.10,0.12), rub=rubber();
const MAT={
  tank:std({...alu,color:0x445055,metalness:0.45,roughness:0.55}),
  bushHV:std({color:0xB33A2E,roughness:0.35,metalness:0.15}),
  bushLV:std({color:0x2E6DB3,roughness:0.35,metalness:0.15}),
  cap:std({...brush,color:0xC9A227,metalness:0.70,roughness:0.35}),
  bench:std({...plas,color:0x3a464d,roughness:0.7}),
  variac:std({...brush,color:0xd7dde0,metalness:0.75,roughness:0.35}),
  knob:std({...rub,color:0x1c2226,roughness:0.85}),
  wireHV:std({color:0x8a2b22,roughness:0.55}),
  wireLV:std({color:0x244a7a,roughness:0.55}),
  jumper:std({...brush,color:0xC9A227,metalness:0.75,roughness:0.30}),
  bezel:std({color:0x0b0f12,roughness:0.4}),
  load:std({...plas,color:0x5a4632,roughness:0.75,metalness:0.10}),
};

let caseKey='ensayoVacio'; let active=false; let solved=false; let simT=0;
let vVal=0, vTarget=0, iVal=0, iTarget=0, pVal=0, pTarget=0;

const synth=makeSynth({type:'sine',type2:'sine',filterFreq:900,Q:1});
const toast=document.getElementById('toast');
function showToast(html){toast.innerHTML=html;toast.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>toast.classList.remove('show'),3200);}
const HOVER_LABELS=new Map();

const CASES={
  ensayoVacio:{
    mode:'test', excSide:'BT', otherTreatment:'open',
    nombre:'Ensayo de vacío (circuito abierto)',
    unidad:'Transformador de control 500 VA, 220/24 V — ensayo en BT',
    v1n:220, v2n:24, kva:0.5, Voc:24.00, Ioc:1.04, Poc:8.00,
    mision:'Caso 1 · ENSAYO DE VACÍO — con el devanado de AT (H1-H2) en circuito abierto, aplica tensión nominal reducida al devanado de BT (X1-X2) y mide corriente y potencia de vacío para obtener la rama de magnetización (Rc, Xm).',
  },
  ensayoCortocircuito:{
    mode:'test', excSide:'AT', otherTreatment:'short',
    nombre:'Ensayo de cortocircuito',
    unidad:'Transformador de control 500 VA, 220/24 V — ensayo en AT',
    v1n:220, v2n:24, kva:0.5, Vsc:13.20, Psc:12.90,
    mision:'Caso 2 · ENSAYO DE CORTOCIRCUITO — con el devanado de BT (X1-X2) en cortocircuito, aplica tensión reducida al devanado de AT (H1-H2) hasta alcanzar la corriente nominal y mide la potencia de cortocircuito para obtener la rama serie (Req, Xeq).',
  },
  regulacionVoltaje:{
    mode:'equiv', excSide:'AT',
    nombre:'Regulación de voltaje a plena carga',
    unidad:'Transformador de control 500 VA, 220/24 V — circuito equivalente referido a AT',
    v1n:220, v2n:24, kva:0.5, pf:0.8,
    mision:'Caso 3 · REGULACIÓN DE VOLTAJE — con el circuito equivalente ya obtenido (Req, Xeq), calcula la caída de tensión porcentual a plena carga con factor de potencia 0.80 en atraso.',
  },
  eficiencia:{
    mode:'equiv', excSide:'AT',
    nombre:'Eficiencia y condición de máxima eficiencia',
    unidad:'Transformador de control 500 VA, 220/24 V — circuito equivalente referido a AT',
    v1n:220, v2n:24, kva:0.5,
    mision:'Caso 4 · EFICIENCIA — usa directamente las pérdidas medidas (Poc, Psc) para calcular la eficiencia a plena carga con FP=1.0 y la fracción de carga x que produce la eficiencia máxima.',
  },
};
const CASE_ORDER=['ensayoVacio','ensayoCortocircuito','regulacionVoltaje','eficiencia'];
const CASE_CAM={
  ensayoVacio:[[2.8,2.2,4.6],[0.1,1.2,0.0]],
  ensayoCortocircuito:[[2.8,2.2,4.6],[0.1,1.2,0.0]],
  regulacionVoltaje:[[3.6,2.3,5.4],[0.3,1.1,0.0]],
  eficiencia:[[3.6,2.3,5.4],[0.3,1.1,0.0]],
};

function vacioStats(){
  const c=CASES.ensayoVacio;
  const S0=c.Voc*c.Ioc;
  const Q0=Math.sqrt(Math.max(0,S0*S0-c.Poc*c.Poc));
  const RcLV=c.Voc*c.Voc/c.Poc;
  const XmLV=c.Voc*c.Voc/Q0;
  const aNameplate=c.v1n/c.v2n;
  const a2=aNameplate*aNameplate;
  const RcHV=RcLV*a2;
  const XmHV=XmLV*a2;
  return {S0,Q0,RcLV,XmLV,aNameplate,a2,RcHV,XmHV};
}
function cortoStats(){
  const c=CASES.ensayoCortocircuito;
  const IpRated=c.kva*1000/c.v1n;
  const Zeq=c.Vsc/IpRated;
  const Req=c.Psc/(IpRated*IpRated);
  const Xeq=Math.sqrt(Math.max(0,Zeq*Zeq-Req*Req));
  const pctZ=c.Vsc/c.v1n*100;
  return {IpRated,Zeq,Req,Xeq,pctZ};
}
function regulacionStats(){
  const c=CASES.regulacionVoltaje;
  const st=cortoStats();
  const Zbase=c.v1n/st.IpRated;
  const ReqPct=st.Req/Zbase*100;
  const XeqPct=st.Xeq/Zbase*100;
  const cosT=c.pf, sinT=Math.sqrt(Math.max(0,1-c.pf*c.pf));
  const d=XeqPct*cosT-ReqPct*sinT;
  const vr=ReqPct*cosT+XeqPct*sinT+(d*d)/200;
  return {ReqPct,XeqPct,cosT,sinT,vr};
}
function eficienciaStats(){
  const c=CASES.eficiencia;
  const Poc=CASES.ensayoVacio.Poc;
  const Psc=CASES.ensayoCortocircuito.Psc;
  const Srated=c.kva*1000;
  const eta=(x,pf)=>{ const num=x*Srated*pf; return num/(num+Poc+x*x*Psc); };
  const etaRated=eta(1,1);
  const xMax=Math.sqrt(Poc/Psc);
  const etaMax=eta(xMax,1);
  return {Poc,Psc,Srated,eta,etaRated,xMax,etaMax};
}
function caseTargets(key){
  const c=CASES[key];
  if(key==='ensayoVacio'){ return {v:c.Voc,i:c.Ioc,p:c.Poc,vScale:30,iScale:1.5,pScale:12}; }
  if(key==='ensayoCortocircuito'){ const st=cortoStats(); return {v:c.Vsc,i:st.IpRated,p:c.Psc,vScale:18,iScale:3,pScale:18}; }
  if(key==='regulacionVoltaje'){ const st=cortoStats(); return {v:c.v1n,i:st.IpRated,p:c.v1n*st.IpRated*c.pf,vScale:260,iScale:3,pScale:520}; }
  const st=cortoStats(); return {v:c.v1n,i:st.IpRated,p:c.kva*1000,vScale:260,iScale:3,pScale:520};
}

const fmtV=v=>v.toFixed(2)+' V';
const fmtA=v=>v.toFixed(2)+' A';
const fmtW=v=>v.toFixed(2)+' W';
const fmtOhm=v=>v.toFixed(2)+' Ω';
const fmtPct=v=>v.toFixed(2)+'%';

function shuffle(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function vacioQuizText(){
  const c=CASES.ensayoVacio; const st=vacioStats();
  const pregunta=`${c.mision}<br>Con el devanado de BT excitado: Voc=<b>${fmtV(c.Voc)}</b>, Ioc=<b>${fmtA(c.Ioc)}</b>, Poc=<b>${fmtW(c.Poc)}</b>. Calcula Rc y Xm en el lado de BT y refiérelos al lado de AT usando a=N1/N2=${st.aNameplate.toFixed(4)}.`;
  const opciones=[
    {t:`Rc(BT)=Voc²/Poc=${fmtOhm(st.RcLV)}; S0=Voc·Ioc=${st.S0.toFixed(2)} VA, Q0=√(S0²−Poc²)=${st.Q0.toFixed(2)} VAR, Xm(BT)=Voc²/Q0=${fmtOhm(st.XmLV)}. Referidos a AT con a²=${st.a2.toFixed(2)}: Rc(AT)=${fmtOhm(st.RcHV)}, Xm(AT)=${fmtOhm(st.XmHV)}.`, ok:true,
      why:`La rama de magnetización se obtiene del triángulo de potencias del ensayo de vacío: S0=Voc·Ioc, Q0=√(S0²−Poc²), Rc=Voc²/Poc, Xm=Voc²/Q0 — todo en el lado donde se hizo la medición (BT). Para referir al lado de AT se multiplica por a²=(N1/N2)²=${st.a2.toFixed(2)}, no por a.`},
    {t:`Rc(BT)=Voc/Ioc=${(c.Voc/c.Ioc).toFixed(2)} Ω (impedancia total de vacío tratada como resistencia).`, ok:false,
      why:'Voc/Ioc da la IMPEDANCIA de vacío (Z0), no la resistencia de pérdidas en el núcleo Rc — confunde la rama paralelo Rc‖Xm con una sola resistencia serie.'},
    {t:`Xm(BT)=Voc²/Poc=${fmtOhm(st.RcLV)} (usa Poc en vez de Q0 para la reactancia de magnetización).`, ok:false,
      why:'Poc es la potencia ACTIVA (pérdidas en el hierro), asociada a Rc; Xm requiere la potencia REACTIVA Q0=√(S0²−Poc²), no Poc directamente.'},
    {t:`Al referir de BT a AT se divide entre a²: Rc(AT)=${(st.RcLV/st.a2).toFixed(4)} Ω.`, ok:false,
      why:`Referir una impedancia del lado de BAJA tensión al lado de ALTA tensión requiere MULTIPLICAR por a²=(N1/N2)², no dividir — las impedancias crecen al referirse hacia el lado de mayor número de vueltas.`},
  ];
  return {pregunta, opciones:shuffle(opciones)};
}
function cortoQuizText(){
  const c=CASES.ensayoCortocircuito; const st=cortoStats();
  const pregunta=`${c.mision}<br>Con el devanado de AT excitado hasta la corriente nominal: Vsc=<b>${fmtV(c.Vsc)}</b>, Isc=I_nominal(AT)=<b>${fmtA(st.IpRated)}</b> (=kVA·1000/V1n), Psc=<b>${fmtW(c.Psc)}</b>. Calcula Req y Xeq referidos a AT.`;
  const opciones=[
    {t:`Zeq=Vsc/Isc=${fmtOhm(st.Zeq)}; Req=Psc/Isc²=${fmtOhm(st.Req)}; Xeq=√(Zeq²−Req²)=${fmtOhm(st.Xeq)}. %Z=Vsc/V1n×100=${fmtPct(st.pctZ)}.`, ok:true,
      why:`El ensayo de cortocircuito mide la rama serie: Zeq=Vsc/Isc es la impedancia total; Psc=Isc²·Req da la parte resistiva Req=Psc/Isc²; Xeq se obtiene por Pitágoras del triángulo de impedancias Zeq²=Req²+Xeq². %Z=Vsc/V1n×100=${fmtPct(st.pctZ)} es la impedancia porcentual de placa.`},
    {t:`Req=Zeq=Vsc/Isc=${fmtOhm(st.Zeq)} (se asume que toda la impedancia de cortocircuito es resistiva).`, ok:false,
      why:`Zeq=Vsc/Isc es la impedancia TOTAL (Req y Xeq combinadas); igualarla a Req ignora la reactancia de dispersión Xeq, que en este transformador es la componente dominante (${fmtOhm(st.Xeq)} frente a ${fmtOhm(st.Req)}).`},
    {t:`Xeq=Zeq=${fmtOhm(st.Zeq)} (se asume Req≈0, ignorando las pérdidas de cortocircuito Psc).`, ok:false,
      why:`Ignorar Req descarta la información que aporta Psc — la potencia de cortocircuito existe precisamente porque hay una componente resistiva Req=Psc/Isc²=${fmtOhm(st.Req)} distinta de cero.`},
    {t:`%Z=Vsc/V2n×100=${(c.Vsc/c.v2n*100).toFixed(2)}% (usa la tensión nominal de BT en vez de la de AT).`, ok:false,
      why:`Vsc se aplicó y midió en el lado de AT, así que el %Z de placa debe referirse a V1n=${c.v1n} V, no a V2n.`},
  ];
  return {pregunta, opciones:shuffle(opciones)};
}
function regulacionQuizText(){
  const c=CASES.regulacionVoltaje; const st=regulacionStats();
  const pregunta=`${c.mision}<br>Del ensayo de cortocircuito: %Req=<b>${fmtPct(st.ReqPct)}</b>, %Xeq=<b>${fmtPct(st.XeqPct)}</b>. Con factor de potencia FP=0.80 en atraso (cosθ=0.80, sinθ=0.60), calcula la regulación de voltaje %VR a plena carga.`;
  const opciones=[
    {t:`%VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200=${fmtPct(st.vr)}.`, ok:true,
      why:`Fórmula aproximada de regulación de voltaje (con corrección de 2° orden): %VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200, válida para FP en atraso. Con %Req=${fmtPct(st.ReqPct)}, %Xeq=${fmtPct(st.XeqPct)}, cosθ=0.80, sinθ=0.60 → %VR=${fmtPct(st.vr)}.`},
    {t:`%VR=%Req·sinθ+%Xeq·cosθ=${(st.ReqPct*st.sinT+st.XeqPct*st.cosT).toFixed(2)}% (intercambia los papeles de cosθ y sinθ).`, ok:false,
      why:`El término resistivo %Req se multiplica por cosθ y el reactivo %Xeq por sinθ — invertir esos factores mezcla las proyecciones de la caída de tensión en el diagrama fasorial.`},
    {t:`%VR=%Req·cosθ−%Xeq·sinθ=${(st.ReqPct*st.cosT-st.XeqPct*st.sinT).toFixed(2)}% (signo de FP en adelanto aplicado a un caso en atraso).`, ok:false,
      why:`El signo negativo corresponde a FP en ADELANTO (capacitivo). Este caso es FP=0.80 en ATRASO (inductivo), que usa signo positivo.`},
    {t:`%VR=%Req+%Xeq=${(st.ReqPct+st.XeqPct).toFixed(2)}% (suma directa de magnitudes, ignorando el factor de potencia de la carga).`, ok:false,
      why:`Sumar %Req y %Xeq directamente ignora que ambas caídas se proyectan sobre el fasor de corriente según el ángulo de la carga.`},
  ];
  return {pregunta, opciones:shuffle(opciones)};
}
function eficienciaQuizText(){
  const c=CASES.eficiencia; const st=eficienciaStats();
  const pregunta=`${c.mision}<br>Pérdidas medidas: Poc=<b>${fmtW(st.Poc)}</b> (fijas, del ensayo de vacío), Psc=<b>${fmtW(st.Psc)}</b> (a corriente nominal, del ensayo de cortocircuito). Calcula la eficiencia a plena carga (x=1, FP=1.0) y la fracción de carga x que produce la eficiencia máxima.`;
  const opciones=[
    {t:`η(x=1)=${fmtPct(st.etaRated*100)}; x_máx=√(Poc/Psc)=${st.xMax.toFixed(2)}, con η_máx=${fmtPct(st.etaMax*100)}.`, ok:true,
      why:`η(x)=x·S·FP/(x·S·FP+Poc+x²·Psc). A plena carga: η=${fmtPct(st.etaRated*100)}. La eficiencia máxima ocurre cuando Poc=x²·Psc, es decir x_máx=√(Poc/Psc)=${st.xMax.toFixed(2)}, dando η_máx=${fmtPct(st.etaMax*100)}.`},
    {t:`La eficiencia máxima siempre ocurre a plena carga (x=1), igual que en este caso η_máx=η(x=1)=${fmtPct(st.etaRated*100)}.`, ok:false,
      why:`Error común: la eficiencia máxima ocurre donde las pérdidas fijas igualan a las variables — normalmente en x_máx=√(Poc/Psc)=${st.xMax.toFixed(2)}, no necesariamente en x=1.`},
    {t:`x_máx=Psc/Poc=${(st.Psc/st.Poc).toFixed(2)} (invierte la razón dentro de la raíz).`, ok:false,
      why:`Invertir la razón da un valor mayor que 1, sin sentido físico como fracción de carga — la condición correcta es x_máx=√(Poc/Psc)=${st.xMax.toFixed(2)}.`},
    {t:`Las pérdidas variables a una carga x se calculan como x·Psc (proporcionales a la corriente, no a su cuadrado).`, ok:false,
      why:`Las pérdidas variables son proporcionales al CUADRADO de la corriente: P_Cu(x)=x²·Psc, porque Psc=I²·Req.`},
  ];
  return {pregunta, opciones:shuffle(opciones)};
}
function currentQuiz(){
  switch(caseKey){
    case 'ensayoVacio': return vacioQuizText();
    case 'ensayoCortocircuito': return cortoQuizText();
    case 'regulacionVoltaje': return regulacionQuizText();
    default: return eficienciaQuizText();
  }
}

function line(ctx,x1,y1,x2,y2,w,col){ ctx.strokeStyle=col||'#8fe3d0'; ctx.lineWidth=w||2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
function groundGlyph(ctx,x,y){
  line(ctx,x,y,x,y+10,2,'#8fe3d0');
  line(ctx,x-14,y+10,x+14,y+10,2,'#8fe3d0');
  line(ctx,x-8,y+16,x+8,y+16,2,'#8fe3d0');
  line(ctx,x-3,y+22,x+3,y+22,2,'#8fe3d0');
}
function vResistorGlyph(ctx,x,y,h,col){ ctx.strokeStyle=col||'#e8c568'; ctx.lineWidth=2; ctx.strokeRect(x-8,y,16,h); }
function hResistorGlyph(ctx,x,y,w,col){ ctx.strokeStyle=col||'#e8c568'; ctx.lineWidth=2; ctx.strokeRect(x,y-8,w,16); }
function vCoilGlyph(ctx,x,y,h,col){
  ctx.strokeStyle=col||'#5fb8ff'; ctx.lineWidth=2;
  const n=4, step=h/n;
  ctx.beginPath();
  for(let i=0;i<n;i++){ const cy=y+i*step+step/2; ctx.arc(x,cy,step/2,Math.PI/2,-Math.PI/2,true); }
  ctx.stroke();
}
function hCoilGlyph(ctx,x,y,w,col){
  ctx.strokeStyle=col||'#5fb8ff'; ctx.lineWidth=2;
  const n=4, step=w/n;
  ctx.beginPath();
  for(let i=0;i<n;i++){ const cx=x+i*step+step/2; ctx.arc(cx,y,step/2,Math.PI,0,false); }
  ctx.stroke();
}
function acSourceGlyph(ctx,x,y,r,col){
  ctx.strokeStyle=col||'#c084fc'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x-r*0.55,y);
  ctx.bezierCurveTo(x-r*0.3,y-r*0.6, x-r*0.05,y+r*0.6, x+r*0.2,y);
  ctx.bezierCurveTo(x+r*0.35,y-r*0.35, x+r*0.45,y-r*0.35, x+r*0.55,y);
  ctx.stroke();
}
function circleMeter(ctx,x,y,r,letter,col){
  ctx.strokeStyle=col||'#EAF4F1'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle=col||'#EAF4F1'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(letter,x,y+1);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
}

let HIT=[];
function addHit(id,x,y,w,h,label){ HIT.push({id,x,y,w,h,label}); }
function scheHeader(ctx,title){
  ctx.clearRect(0,0,1024,768);
  ctx.fillStyle='#0b1310'; ctx.fillRect(0,0,1024,768);
  ctx.strokeStyle='rgba(79,209,197,.35)'; ctx.lineWidth=2; ctx.strokeRect(6,6,1012,756);
  ctx.fillStyle='#8fe3d0'; ctx.font='bold 16px sans-serif'; ctx.textAlign='left';
  ctx.fillText(title,24,32);
}
function drawTestCircuit(ctx){
  const c=CASES[caseKey];
  const isAT = c.excSide==='AT';
  const exCol = isAT ? '#B33A2E' : '#2E6DB3';
  const RT=140, RB=420;
  const SRC_X=110, AM_X=300, WM_X=420, VM_X=520, WND_X=680, OTH_X=860;
  line(ctx,SRC_X,RT,1000,RT,2,'#5fb8ff');
  line(ctx,SRC_X,RB,1000,RB,2,'#f59e0b');
  line(ctx,SRC_X,RT,SRC_X,RT+(RB-RT)/2-30,2,'#c084fc');
  line(ctx,SRC_X,RB,SRC_X,RT+(RB-RT)/2+30,2,'#c084fc');
  acSourceGlyph(ctx,SRC_X,(RT+RB)/2,30,'#c084fc');
  addHit('src',SRC_X-30,(RT+RB)/2-30,60,60,'Fuente de CA de tensión reducida — aplica '+(isAT?'Vsc a H1-H2 (AT)':'Voc a X1-X2 (BT)'));
  circleMeter(ctx,AM_X,RT,18,'A','#EAF4F1');
  addHit('amm',AM_X-18,RT-18,36,36,'Amperímetro — mide '+(isAT?'la corriente nominal Isc':'la corriente de vacío Ioc'));
  circleMeter(ctx,WM_X,RT,18,'W','#EAF4F1');
  addHit('watt',WM_X-18,RT-18,36,36,'Wattmetro — mide '+(isAT?'la potencia de cortocircuito Psc':'la potencia de vacío Poc'));
  line(ctx,VM_X,RT,VM_X,RT+40,2,'#EAF4F1');
  circleMeter(ctx,VM_X,RT+70,18,'V','#EAF4F1');
  line(ctx,VM_X,RT+100,VM_X,RB,2,'#EAF4F1');
  addHit('volt',VM_X-18,RT+52,36,36,'Voltímetro — mide '+(isAT?'la tensión aplicada Vsc':'la tensión aplicada Voc'));
  line(ctx,VM_X,RT,WND_X,RT,2,exCol);
  vCoilGlyph(ctx,WND_X,RT,RB-RT,exCol);
  line(ctx,WND_X,RB,VM_X,RB,2,exCol);
  addHit('wnd_ex',WND_X-14,RT,28,RB-RT,'Devanado excitado ('+(isAT?'AT, H1-H2':'BT, X1-X2')+') — recibe la tensión de prueba');
  ctx.setLineDash([4,4]); ctx.strokeStyle='#6b8a83'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo((WND_X+OTH_X)/2,RT-10); ctx.lineTo((WND_X+OTH_X)/2,RB+10); ctx.stroke();
  ctx.setLineDash([]);
  const othCol = isAT ? '#2E6DB3' : '#B33A2E';
  if(c.otherTreatment==='open'){
    line(ctx,OTH_X,RT,OTH_X,RT+(RB-RT)/2-34,2,othCol);
    line(ctx,OTH_X,RB,OTH_X,RT+(RB-RT)/2+34,2,othCol);
    addHit('wnd_oth',OTH_X-16,RT,32,RB-RT,'Devanado en circuito abierto ('+(isAT?'BT, X1-X2':'AT, H1-H2')+') — no se cierra el circuito');
  }else{
    line(ctx,OTH_X,RT,OTH_X,RB,2,othCol);
    ctx.strokeStyle='#C9A227'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(OTH_X-24,RT+18); ctx.lineTo(OTH_X+24,RT+18); ctx.stroke();
    addHit('short',OTH_X-24,RT+8,48,20,'Puente en corto ('+(isAT?'BT, X1-X2':'AT, H1-H2')+') — cierra el devanado en cortocircuito');
  }
  ctx.fillStyle='#EAF4F1'; ctx.font='12px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Fuente CA',SRC_X,(RT+RB)/2+52);
  ctx.fillText('A',AM_X,RT-26);
  ctx.fillText('W',WM_X,RT-26);
  ctx.fillText('V',VM_X,RT+108);
  ctx.fillText(isAT?'AT · H1-H2':'BT · X1-X2',WND_X,RB+26);
  ctx.fillText(c.otherTreatment==='open' ? (isAT?'BT · X1-X2 (abierto)':'AT · H1-H2 (abierto)') : (isAT?'BT · X1-X2 (corto)':'AT · H1-H2 (corto)'),OTH_X,RB+26);
  ctx.fillStyle='#6b8a83'; ctx.fillText('núcleo',(WND_X+OTH_X)/2,RT-16);
  ctx.textAlign='left';
}
function drawEquivCircuit(ctx){
  const c=CASES[caseKey];
  const vst=vacioStats(), cst=cortoStats();
  const RT=140, RB=420;
  const SRC_X=110, RC_X=260, XM_X=320, SER_X0=420, LOAD_X=860;
  line(ctx,SRC_X,RT,LOAD_X,RT,2,'#5fb8ff');
  line(ctx,SRC_X,RB,LOAD_X,RB,2,'#5fb8ff');
  acSourceGlyph(ctx,SRC_X,(RT+RB)/2,28,'#c084fc');
  addHit('src',SRC_X-28,(RT+RB)/2-28,56,56,'Fuente equivalente de tensión V1 (AT)');
  line(ctx,RC_X,RT,RC_X,RT+40,2,'#e8c568');
  vResistorGlyph(ctx,RC_X-8,RT+40,90,'#e8c568');
  line(ctx,RC_X,RT+130,RC_X,RB,2,'#e8c568');
  addHit('rc',RC_X-16,RT+40,32,90,'Rc referida a AT = '+fmtOhm(vst.RcHV)+' — pérdidas en el núcleo (Poc)');
  line(ctx,XM_X,RT,XM_X,RT+40,2,'#5fb8ff');
  vCoilGlyph(ctx,XM_X,RT+40,90,'#5fb8ff');
  line(ctx,XM_X,RT+130,XM_X,RB,2,'#5fb8ff');
  addHit('xm',XM_X-16,RT+40,32,90,'Xm referida a AT = '+fmtOhm(vst.XmHV)+' — reactancia de magnetización (Q0)');
  hResistorGlyph(ctx,SER_X0,RT,90,'#e8c568');
  addHit('req',SER_X0,RT-8,90,16,'Req referida a AT = '+fmtOhm(cst.Req)+' — resistencia equivalente serie (Psc)');
  hCoilGlyph(ctx,SER_X0+110,RT,90,'#5fb8ff');
  addHit('xeq',SER_X0+110,RT-8,90,16,'Xeq referida a AT = '+fmtOhm(cst.Xeq)+' — reactancia de dispersión equivalente');
  line(ctx,LOAD_X,RT,LOAD_X,RT+40,2,'#8fe3d0');
  vResistorGlyph(ctx,LOAD_X-8,RT+40,90,'#8fe3d0');
  line(ctx,LOAD_X,RT+130,LOAD_X,RB,2,'#8fe3d0');
  const loadDesc = caseKey==='regulacionVoltaje' ? 'a plena carga, FP=0.80 en atraso' : 'a plena carga, FP=1.0';
  addHit('load',LOAD_X-16,RT+40,32,90,'Carga — '+loadDesc);
  ctx.fillStyle='#EAF4F1'; ctx.font='12px sans-serif'; ctx.textAlign='center';
  ctx.fillText('V1 (AT)',SRC_X,(RT+RB)/2+50);
  ctx.fillText('Rc',RC_X,RT+28);
  ctx.fillText('Xm',XM_X,RT+28);
  ctx.fillText('Req',SER_X0+45,RT-14);
  ctx.fillText('Xeq',SER_X0+155,RT-14);
  ctx.fillText('carga',LOAD_X,RT+28);
  ctx.textAlign='left';
}
function drawSchematic(ctx){
  HIT=[];
  const c=CASES[caseKey];
  scheHeader(ctx, c.mode==='test' ? 'ENSAYO — '+c.nombre.toUpperCase() : 'CIRCUITO EQUIVALENTE — '+c.nombre.toUpperCase());
  if(c.mode==='test') drawTestCircuit(ctx); else drawEquivCircuit(ctx);
  scheStatus(ctx);
}
function scheStatus(ctx){
  let txt='';
  if(caseKey==='ensayoVacio'){ const st=vacioStats(); txt=`Rc(AT)=${fmtOhm(st.RcHV)} · Xm(AT)=${fmtOhm(st.XmHV)} (referidos con a²=${st.a2.toFixed(2)})`; }
  else if(caseKey==='ensayoCortocircuito'){ const st=cortoStats(); txt=`Req(AT)=${fmtOhm(st.Req)} · Xeq(AT)=${fmtOhm(st.Xeq)} · %Z=${fmtPct(st.pctZ)}`; }
  else if(caseKey==='regulacionVoltaje'){ const st=regulacionStats(); txt=`%Req=${fmtPct(st.ReqPct)} · %Xeq=${fmtPct(st.XeqPct)} · %VR=${fmtPct(st.vr)} (FP=0.80 atraso)`; }
  else { const st=eficienciaStats(); txt=`η(x=1)=${fmtPct(st.etaRated*100)} · x_máx=${st.xMax.toFixed(2)} · η_máx=${fmtPct(st.etaMax*100)}`; }
  ctx.fillStyle='#EAF4F1'; ctx.font='bold 13px sans-serif'; ctx.textAlign='left';
  ctx.fillText(txt,24,748);
}
function boardClick(u,v){
  const px=u*1024, py=(1-v)*768;
  for(const h of HIT){
    if(px>=h.x&&px<=h.x+h.w&&py>=h.y&&py<=h.y+h.h){ showToast(`<b style="color:var(--accent2)">${h.label}</b>`); return; }
  }
}

const boardCanvas=document.createElement('canvas');
boardCanvas.width=1024; boardCanvas.height=768;
const bctx=boardCanvas.getContext('2d');
const boardTex=new THREE.CanvasTexture(boardCanvas);
const boardMat=new THREE.MeshBasicMaterial({map:boardTex});
const boardPlane=new THREE.Mesh(new THREE.PlaneGeometry(4.2,3.15),boardMat);
boardPlane.position.set(0.4,2.15,-1.3);
const boardFrame=new THREE.Mesh(new THREE.BoxGeometry(4.32,3.27,0.06),std({color:0x1b1f24,roughness:0.8,metalness:0.2}));
boardFrame.position.set(0.4,2.15,-1.34);
const boardG=new THREE.Group();
boardG.add(boardFrame,boardPlane);
scene.add(boardG);
function drawBoard(){ drawSchematic(bctx); boardTex.needsUpdate=true; }

const bench=sh(roundedBox(6.4,0.5,2.2,MAT.bench,0.06));
bench.position.set(0,0.25,0);
scene.add(bench);

const variacG=new THREE.Group(); variacG.position.set(-2.6,0.5,0.1); scene.add(variacG);
const variacBody=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.46,0.5,32),MAT.variac));
variacBody.position.set(0,0.25,0);
const variacKnob=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.18,0.14,24),MAT.knob));
variacKnob.position.set(0,0.57,0);
const variacT1=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.14,12),MAT.cap));
variacT1.position.set(0.16,0.56,0.14);
const variacT2=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.14,12),MAT.cap));
variacT2.position.set(-0.16,0.56,0.14);
variacG.add(variacBody,variacKnob,variacT1,variacT2);
variacG.userData={title:'Autotransformador variable (Variac)',info:'Suministra la tensión de prueba reducida y ajustable al banco de ensayo.'};
HOVER_LABELS.set(variacBody,'Variac — fuente de tensión de prueba');

/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio:MAT.cap, acero:MAT.cap, cromo:MAT.cap,
  cobre:std({color:0xb87333,roughness:0.35,metalness:0.75}),
  chapa:MAT.tank, negro:std({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:std({color:0x14181e,roughness:0.80,metalness:0.02}),
  blanco:std({color:0xd7dee6,roughness:0.40,metalness:0.20}),
  ceramica:std({color:0xd7dee6,roughness:0.60,metalness:0.05}),
};
const xfmr=new THREE.Group(); xfmr.position.set(0,0.5,0); scene.add(xfmr);
const tank=sh(new THREE.Mesh(new THREE.BoxGeometry(1.3,0.7,0.9),MAT.tank));
tank.position.set(0,0.85,0);
xfmr.add(tank);
/* EL TANQUE, con lo que tiene un transformador de verdad y aqui faltaba: TAPA
   ATORNILLADA y RADIADORES en los costados. Los radiadores no son adorno: por
   ellos sale el calor de las perdidas que esta practica mide —las del cobre y
   las del hierro—, y sin ellos la maquina no aguanta su propia carga. */
const tapa=sh(new THREE.Mesh(new THREE.BoxGeometry(1.38,0.07,0.98),MAT.tank));
tapa.position.set(0,1.235,0); xfmr.add(tapa);
for(let i=0;i<14;i++){
  const a=i/14*Math.PI*2;
  const t=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.026,6),MAT.cap));
  t.position.set(Math.cos(a)*0.63,1.283,Math.sin(a)*0.44); xfmr.add(t);
}
[-1,1].forEach(sx=>{
  for(let k=0;k<6;k++){
    const al=sh(new THREE.Mesh(new THREE.BoxGeometry(0.11,0.50,0.052),MAT.tank));
    al.position.set(sx*0.705,0.86,-0.325+k*0.13); xfmr.add(al);
  }
  [1.10,0.62].forEach(y=>{
    const col=sh(new THREE.Mesh(new THREE.BoxGeometry(0.09,0.05,0.76),MAT.tank));
    col.position.set(sx*0.705,y,0); xfmr.add(col);
  });
});
/* LOS BUJES, de porcelana con FALDAS: alargan el camino que tendria que
   recorrer el agua o la suciedad hasta el tanque —que esta a tierra—, y por eso
   los de ALTA llevan mas faldas que los de BAJA. Un poste liso con una bola
   encima no distinguia uno de otro. */
function makeBushing(x,z,mat,alta,label,info){
  const g=new THREE.Group(); g.position.set(x,1.27,z);
  const b=P3.bujePorcelana(MATP,{alto:alta?0.30:0.22,d:alta?0.15:0.13,
    faldas:alta?4:2,color:mat.color.getHex()});
  g.add(b);
  sh(b.userData.porcelana); sh(b.userData.borne);
  g.userData={title:label,info:info,borneY:b.userData.borneY};
  HOVER_LABELS.set(b.userData.porcelana,label);
  xfmr.add(g);
  return g;
}
const H1=makeBushing(-0.32,0.22,MAT.bushHV,true,'H1 (AT)','Terminal de alta tensión H1 — devanado primario');
const H2=makeBushing(0.32,0.22,MAT.bushHV,true,'H2 (AT)','Terminal de alta tensión H2 — devanado primario');
const X1=makeBushing(-0.32,-0.22,MAT.bushLV,false,'X1 (BT)','Terminal de baja tensión X1 — devanado secundario');
const X2=makeBushing(0.32,-0.22,MAT.bushLV,false,'X2 (BT)','Terminal de baja tensión X2 — devanado secundario');
// Cada cable se ata AL BORNE de su buje: los de alta quedan mas altos que los
// de baja, como en la maquina.
function topOf(g){ return new THREE.Vector3(g.position.x,g.position.y+g.userData.borneY,g.position.z); }

function drawPlate(key){
  const cv=document.createElement('canvas'); cv.width=420; cv.height=260;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#e9e4d8'; ctx.fillRect(0,0,420,260);
  ctx.strokeStyle='#333'; ctx.lineWidth=4; ctx.strokeRect(6,6,408,248);
  ctx.fillStyle='#111'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
  ctx.fillText('TRANSFORMADOR DE CONTROL',210,34);
  const c=CASES[key];
  const rows=[
    ['Unidad', c.unidad.split('—')[0].trim()],
    ['Potencia nominal', (c.kva*1000).toFixed(0)+' VA'],
    ['Tensión AT', c.v1n+' V'],
    ['Tensión BT', c.v2n+' V'],
    ['Relación nominal', 'a = '+(c.v1n/c.v2n).toFixed(4)],
    ['Terminales', 'H1 H2 · X1 X2'],
  ];
  ctx.font='14px sans-serif'; ctx.textAlign='left';
  rows.forEach((r,i)=>{
    const y=64+i*30;
    ctx.fillStyle='#333'; ctx.fillText(r[0]+':',28,y);
    ctx.fillStyle='#111'; ctx.font='bold 14px sans-serif'; ctx.fillText(r[1],190,y);
    ctx.font='14px sans-serif';
  });
  ctx.textAlign='left';
  plateTex.image=cv; plateTex.needsUpdate=true;
}
const plateTex=new THREE.CanvasTexture(document.createElement('canvas'));
const plateMesh=sh(new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.31),new THREE.MeshStandardMaterial({map:plateTex,roughness:0.6})));
plateMesh.position.set(0,0.85,0.46);
xfmr.add(plateMesh);

function tubeBetween(a,b,mat,r,sag){
  sag=sag||0.05;
  const mid=new THREE.Vector3().addVectors(a,b).multiplyScalar(0.5); mid.y-=sag;
  const curve=new THREE.CatmullRomCurve3([a,mid,b]);
  const geo=new THREE.TubeGeometry(curve,20,r,8,false);
  return sh(new THREE.Mesh(geo,mat));
}
const secShort=tubeBetween(topOf(X1),topOf(X2),MAT.jumper,0.022,0.08);
scene.add(secShort);

const loadG=new THREE.Group(); loadG.position.set(2.6,0.5,0.1); scene.add(loadG);
const loadBody=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.34,0.42,24),MAT.load));
loadBody.position.set(0,0.21,0);
const loadT1=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.14,12),MAT.cap));
loadT1.position.set(0.16,0.44,0.1);
const loadT2=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.14,12),MAT.cap));
loadT2.position.set(-0.16,0.44,0.1);
loadG.add(loadBody,loadT1,loadT2);
loadG.userData={title:'Banco de carga',info:'Representa la carga a plena capacidad conectada del lado de BT para los casos de regulación y eficiencia.'};
HOVER_LABELS.set(loadBody,'Banco de carga — carga nominal referida a BT');

const wireGroup=new THREE.Group(); scene.add(wireGroup);
function rebuildWiring(){
  while(wireGroup.children.length) wireGroup.remove(wireGroup.children[0]);
  const c=CASES[caseKey];
  const srcT1=new THREE.Vector3(-2.44,1.06,0.14), srcT2=new THREE.Vector3(-2.76,1.06,0.14);
  if(c.excSide==='BT'){
    wireGroup.add(tubeBetween(srcT1,topOf(X1),MAT.wireLV,0.02));
    wireGroup.add(tubeBetween(srcT2,topOf(X2),MAT.wireLV,0.02));
  }else{
    wireGroup.add(tubeBetween(srcT1,topOf(H1),MAT.wireHV,0.02));
    wireGroup.add(tubeBetween(srcT2,topOf(H2),MAT.wireHV,0.02));
  }
  if(c.mode==='equiv'){
    const loadAnchor1=new THREE.Vector3(2.44,1.06,0.14), loadAnchor2=new THREE.Vector3(2.76,1.06,0.14);
    wireGroup.add(tubeBetween(topOf(X1),loadAnchor1,MAT.wireLV,0.018));
    wireGroup.add(tubeBetween(topOf(X2),loadAnchor2,MAT.wireLV,0.018));
  }
  secShort.visible = c.otherTreatment==='short';
  loadG.visible = c.mode==='equiv';
}

function makeGauge(x,z,label,color,unit){
  const cv=document.createElement('canvas'); cv.width=300; cv.height=240;
  const c=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);
  const mesh=sh(new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.34),new THREE.MeshStandardMaterial({map:tex,roughness:0.5})));
  mesh.position.set(x,1.62,z);
  const bezel=sh(new THREE.Mesh(new THREE.BoxGeometry(0.46,0.38,0.03),MAT.bezel));
  bezel.position.set(x,1.62,z-0.02);
  scene.add(bezel,mesh);
  function draw(value,maxV){
    c.clearRect(0,0,300,240);
    c.fillStyle='#111417'; c.fillRect(0,0,300,240);
    c.strokeStyle='rgba(255,255,255,.15)'; c.lineWidth=2; c.strokeRect(4,4,292,232);
    c.fillStyle=color; c.font='bold 15px sans-serif'; c.textAlign='center';
    c.fillText(label,150,26);
    const cx=150, cy=150, r=90;
    c.strokeStyle='rgba(255,255,255,.3)'; c.lineWidth=3;
    c.beginPath(); c.arc(cx,cy,r,Math.PI*1.15,Math.PI*1.85); c.stroke();
    const frac=Math.max(0,Math.min(1,value/maxV));
    const ang=Math.PI*1.15+frac*(Math.PI*0.7);
    c.strokeStyle=color; c.lineWidth=4;
    c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(ang)*r*0.85,cy+Math.sin(ang)*r*0.85); c.stroke();
    c.fillStyle=color; c.beginPath(); c.arc(cx,cy,6,0,Math.PI*2); c.fill();
    c.fillStyle='#EAF4F1'; c.font='bold 20px sans-serif';
    c.fillText(value.toFixed(2)+' '+unit,150,214);
  }
  return {draw};
}
const gaugeV=makeGauge(-1.0,0.85,'V · tensión','#8FB3AC','V');
const gaugeI=makeGauge(0,0.85,'A · corriente','#4FD1C5','A');
const gaugeP=makeGauge(1.0,0.85,'W · potencia','#FFD166','W');

S.start();

document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Transformadores (D5) · Circuito equivalente</div>
  <h2>Circuito Equivalente por Ensayos de Vacío y Cortocircuito</h2>
  <p>Obtén la rama de magnetización (Rc, Xm) y la rama serie (Req, Xeq) a partir de dos ensayos de rutina, y úsalas para predecir la regulación de voltaje y la eficiencia a plena carga.</p>
  <div class="formula">
    Rc=Voc²/Poc · Xm=Voc²/Q0 (Q0=√(S0²−Poc²), S0=Voc·Ioc)<br>
    Zeq=Vsc/Isc · Req=Psc/Isc² · Xeq=√(Zeq²−Req²)<br>
    %VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200<br>
    η(x)=x·S·FP/(x·S·FP+Poc+x²·Psc) · x_máx=√(Poc/Psc)
  </div>
  <div class="legend">
    <span style="color:#B33A2E">■</span> H1 / H2 (AT) &nbsp;
    <span style="color:#2E6DB3">■</span> X1 / X2 (BT) &nbsp;
    <span style="color:#C9A227">■</span> puente de cortocircuito
  </div>
  <div class="fid">
    <div class="fl">Sí modela: procedimiento OC en BT / SC en AT, referencia por a², fórmula aproximada de %VR con corrección de 2° orden, fórmula de eficiencia con condición de η máxima.</div>
    <div class="fl no">No modela: ubicación exacta aproximada-vs-exacta de la rama shunt, Rc/Xm tratadas como constantes (no varían con saturación), pérdidas dispersas no separadas, sin corrección de Req por temperatura.</div>
  </div>
  <div class="src">Ref: IEC 60076-1, Cláusulas 11.4 y 11.5 · ANSI/IEEE C57.12.90, Cláusula 8</div>
`;

document.getElementById('panel').innerHTML=`
  <div class="modebar">
    <button id="c_ensayoVacio">Vacío</button>
    <button id="c_ensayoCortocircuito">Cortocircuito</button>
    <button id="c_regulacionVoltaje">Regulación</button>
    <button id="c_eficiencia">Eficiencia</button>
  </div>
  <div id="tele">
    <div class="g"><span id="l_v" class="gl"></span><span id="t_v"></span></div>
    <div class="g"><span id="l_i" class="gl"></span><span id="t_i"></span></div>
    <div class="g"><span id="l_p" class="gl"></span><span id="t_p"></span></div>
    <div class="g"><span id="l_par1" class="gl"></span><span id="t_par1"></span></div>
    <div class="g"><span id="l_par2" class="gl"></span><span id="t_par2"></span></div>
    <div class="g"><span id="l_res" class="gl"></span><span id="t_res"></span></div>
  </div>
  <div class="console" id="report"></div>
  <div id="q_text"></div>
  <div id="dxbtns"></div>
  <button id="btnAuto">✨ Ensayo automático (guiado)</button>
  <button id="btnPower">⚡ Energizar banco</button>
  <button id="btnNew">🔀 Nuevo caso</button>
`;

const el=id=>document.getElementById(id);

const TELE_LABELS={
  ensayoVacio:{v:'Tensión aplicada (Voc, BT)', i:'Corriente de vacío (Ioc)', p:'Potencia de vacío (Poc)', par1:'Rc (lado BT)', par2:'Xm (lado BT)', res:'Resultado referido a AT'},
  ensayoCortocircuito:{v:'Tensión aplicada (Vsc, AT)', i:'Corriente nominal (Isc)', p:'Potencia de cortocircuito (Psc)', par1:'Req (lado AT)', par2:'%Z', res:'Resultado'},
  regulacionVoltaje:{v:'Tensión nominal (AT)', i:'Corriente nominal (AT)', p:'Potencia de salida (FP=0.80 atraso)', par1:'%Req', par2:'%Xeq', res:'Regulación de voltaje'},
  eficiencia:{v:'Tensión nominal (AT)', i:'Corriente nominal (AT)', p:'Potencia de salida (FP=1.0, x=1.0)', par1:'η a plena carga', par2:'x de η máxima', res:'Eficiencia máxima'},
};
function caseParams(key){
  if(key==='ensayoVacio'){ const st=vacioStats(); return {par1:fmtOhm(st.RcLV), par2:fmtOhm(st.XmLV), res:'Rc(AT)='+fmtOhm(st.RcHV)+' · Xm(AT)='+fmtOhm(st.XmHV)+' (referidos con a²='+st.a2.toFixed(2)+')'}; }
  if(key==='ensayoCortocircuito'){ const st=cortoStats(); return {par1:fmtOhm(st.Req), par2:fmtPct(st.pctZ), res:'Xeq(AT)='+fmtOhm(st.Xeq)+' · Zeq(AT)='+fmtOhm(st.Zeq)}; }
  if(key==='regulacionVoltaje'){ const st=regulacionStats(); return {par1:fmtPct(st.ReqPct), par2:fmtPct(st.XeqPct), res:'%VR='+fmtPct(st.vr)}; }
  const st=eficienciaStats(); return {par1:fmtPct(st.etaRated*100), par2:st.xMax.toFixed(2), res:'η_max='+fmtPct(st.etaMax*100)+' en x='+st.xMax.toFixed(2)};
}
function updateTele(){
  const labels=TELE_LABELS[caseKey]; const tg=caseTargets(caseKey);
  el('l_v').textContent=labels.v; el('l_i').textContent=labels.i; el('l_p').textContent=labels.p;
  el('l_par1').textContent=labels.par1; el('l_par2').textContent=labels.par2; el('l_res').textContent=labels.res;
  const set=(id,txt,cls)=>{ const b=el(id); b.textContent=txt; b.className=cls||''; };
  set('t_v', active? fmtV(tg.v):'—', active?'good':'');
  set('t_i', active? fmtA(tg.i):'—', active?'good':'');
  set('t_p', active? fmtW(tg.p):'—', active?'good':'');
  if(!active){ set('t_par1','—',''); set('t_par2','—',''); set('t_res','Banco apagado','warn'); return; }
  if(!solved){ set('t_par1','—',''); set('t_par2','—',''); set('t_res','Calcula y responde ↓','warn'); return; }
  const cp=caseParams(caseKey);
  set('t_par1',cp.par1,''); set('t_par2',cp.par2,''); set('t_res',cp.res,'good');
}
function updateReport(){
  const c=CASES[caseKey]; let html='';
  if(!active){ html='<span class="mono">Banco apagado. Pulsa "Energizar banco" para aplicar la excitación de prueba y leer los instrumentos.</span>'; }
  else if(caseKey==='ensayoVacio'){
    const st=vacioStats();
    html=`<b>${c.mision}</b><br><span class="mono">Voc=${fmtV(c.Voc)} · Ioc=${fmtA(c.Ioc)} · Poc=${fmtW(c.Poc)}</span>`;
    if(solved) html+=`<br><span class="mono">S0=Voc·Ioc=${st.S0.toFixed(2)} VA · Q0=√(S0²−Poc²)=${st.Q0.toFixed(2)} VAR<br>Rc(BT)=${fmtOhm(st.RcLV)} · Xm(BT)=${fmtOhm(st.XmLV)}<br>Referidos a AT (a²=${st.a2.toFixed(2)}): Rc(AT)=${fmtOhm(st.RcHV)} · Xm(AT)=${fmtOhm(st.XmHV)}</span>`;
  }
  else if(caseKey==='ensayoCortocircuito'){
    const st=cortoStats();
    html=`<b>${c.mision}</b><br><span class="mono">Vsc=${fmtV(c.Vsc)} · Isc=${fmtA(st.IpRated)} · Psc=${fmtW(c.Psc)}</span>`;
    if(solved) html+=`<br><span class="mono">Zeq=Vsc/Isc=${fmtOhm(st.Zeq)} · Req=Psc/Isc²=${fmtOhm(st.Req)} · Xeq=√(Zeq²−Req²)=${fmtOhm(st.Xeq)}<br>%Z=Vsc/V1n×100=${fmtPct(st.pctZ)}</span>`;
  }
  else if(caseKey==='regulacionVoltaje'){
    const st=regulacionStats();
    html=`<b>${c.mision}</b><br><span class="mono">%Req=${fmtPct(st.ReqPct)} · %Xeq=${fmtPct(st.XeqPct)} · FP=0.80 en atraso (cosθ=0.80, sinθ=0.60)</span>`;
    if(solved) html+=`<br><span class="mono">%VR=%Req·cosθ+%Xeq·sinθ+(%Xeq·cosθ−%Req·sinθ)²/200=${fmtPct(st.vr)}</span>`;
  }
  else {
    const st=eficienciaStats();
    html=`<b>${c.mision}</b><br><span class="mono">Poc=${fmtW(st.Poc)} · Psc=${fmtW(st.Psc)} · S=${st.Srated.toFixed(0)} VA</span>`;
    if(solved) html+=`<br><span class="mono">η(x=1,FP=1.0)=${fmtPct(st.etaRated*100)}<br>x_máx=√(Poc/Psc)=${st.xMax.toFixed(2)} → η_máx=${fmtPct(st.etaMax*100)}</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){ drawPlate(caseKey); updateTele(); updateReport(); drawBoard(); }

function refreshCaseLabel(){}
function clearDx(){ el('dxbtns').innerHTML=''; }
function refreshQuestion(){
  const q=currentQuiz();
  el('q_text').innerHTML=q.pregunta;
  const box=el('dxbtns'); box.innerHTML='';
  q.opciones.forEach((o,i)=>{
    const b=document.createElement('button');
    b.textContent=o.t;
    b.onclick=()=>answer(i,q);
    box.appendChild(b);
  });
}
function answer(i,q){
  const chosen=q.opciones[i];
  const box=el('dxbtns');
  Array.from(box.children).forEach((b,idx)=>{
    b.disabled=true;
    if(q.opciones[idx].ok) b.classList.add('ok');
    else if(idx===i) b.classList.add('bad');
  });
  solved=chosen.ok;
  synth.beep(chosen.ok?880:220,0.12,0.05);
  updateTele(); updateReport();
  showToast(`<b style="color:${chosen.ok?'var(--good)':'var(--bad)'}">${chosen.ok?'✔ Correcto':'✘ Revisa'}</b><br><span style="font-size:11px">${chosen.why}</span>`);
}

function setCase(key){
  caseKey=key; active=false;
  rebuildWiring();
  CASE_ORDER.forEach(k=>el('c_'+k).classList.toggle('on',k===key));
  el('btnPower').classList.remove('on'); el('btnPower').textContent='⚡ Energizar banco';
  vTarget=0; iTarget=0; pTarget=0;
  solved=false; clearDx(); refreshQuestion(); refreshCaseLabel();
  const meta=CASE_CAM[key]; S.moveTo(meta[0],meta[1],1.3);
  refreshAll();
  showToast('🔀 '+CASES[key].nombre+' — '+CASES[key].unidad);
}

CASE_ORDER.forEach(k=>{ el('c_'+k).onclick=()=>setCase(k); });
el('btnNew').onclick=()=>{ setCase(CASE_ORDER[(CASE_ORDER.indexOf(caseKey)+1)%CASE_ORDER.length]); };

el('btnPower').onclick=e=>{
  active=!active;
  synth.init(); synth.resume();
  e.target.classList.toggle('on',active);
  e.target.textContent=active?'⚡ Apagar banco':'⚡ Energizar banco';
  const tg=caseTargets(caseKey);
  vTarget = active? tg.v : 0;
  iTarget = active? tg.i : 0;
  pTarget = active? tg.p : 0;
  if(active){ S.setCinematicIdle(true); synth.beep(880,0.1,0.06); } else S.setCinematicIdle(false);
  refreshAll();
};

pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit) return;
  if(hit.object===boardPlane && hit.uv){ boardClick(hit.uv.x,hit.uv.y); return; }
  let o=hit.object;
  while(o){
    if(o.userData&&o.userData.info){
      showToast(`<b style="color:var(--accent2)">${o.userData.title}</b><br><span style="color:var(--dim);font-size:11px">${o.userData.info}</span>`);
      return;
    }
    o=o.parent;
  }
});

(function hoverLabels(){
  const raycaster=new THREE.Raycaster();
  const mouse=new THREE.Vector2();
  const dom=S.renderer.domElement;
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    mouse.x=((e.clientX-r.left)/r.width)*2-1;
    mouse.y=-((e.clientY-r.top)/r.height)*2+1;
    raycaster.setFromCamera(mouse,S.camera);
    const objs=Array.from(HOVER_LABELS.keys());
    const hits=raycaster.intersectObjects(objs,false);
    if(hits.length){
      dom.style.cursor='pointer';
      mount.title=HOVER_LABELS.get(hits[0].object)||'';
    }else{
      dom.style.cursor='default';
      mount.title='';
    }
  });
  dom.addEventListener('pointerleave',()=>{ dom.style.cursor='default'; mount.title=''; });
})();

const soundBtn=document.getElementById('soundBtn');
if(soundBtn){
  soundBtn.onclick=()=>{
    synth.init(); synth.resume();
    const on=soundBtn.classList.toggle('on');
    synth.setMuted(!on);
  };
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
async function runAuto(){
  const c=CASES[caseKey];
  if(!active){ el('btnPower').click(); await sleep(1400); }
  if(c.mode==='test'){
    showToast(c.otherTreatment==='open' ? '1️⃣ Deja el devanado no excitado en circuito abierto.' : '1️⃣ Cortocircuita el devanado de BT (X1-X2).');
    await sleep(1600);
    showToast('2️⃣ Aplica tensión reducida al devanado indicado y observa V, A y W.');
    await sleep(1800);
  }else{
    showToast('1️⃣ Conecta la carga nominal del lado de BT.');
    await sleep(1600);
    showToast('2️⃣ Con Req/Xeq ya calculados, observa el resultado en el panel.');
    await sleep(1800);
  }
  showToast('3️⃣ Lee los resultados calculados en el panel de telemetría.');
  await sleep(1800);
  const q=currentQuiz();
  refreshQuestion();
  const idx=q.opciones.findIndex(o=>o.ok);
  showToast('4️⃣ Responde la pregunta de diagnóstico.');
  await sleep(1200);
  el('dxbtns').children[idx].click();
}
el('btnAuto').onclick=runAuto;

let lastDraw=0;
S.setAnimate((dt,time)=>{
  simT=time;
  vVal += (vTarget-vVal)*Math.min(1,dt*4);
  iVal += (iTarget-iVal)*Math.min(1,dt*4);
  pVal += (pTarget-pVal)*Math.min(1,dt*4);
  const tg=caseTargets(caseKey);
  variacKnob.rotation.y = (vTarget>0 ? vVal/tg.vScale : 0) * Math.PI*1.4;
  if(time-lastDraw>0.08){
    gaugeV.draw(vVal,tg.vScale);
    gaugeI.draw(iVal,tg.iScale);
    gaugeP.draw(pVal,tg.pScale);
    lastDraw=time;
  }
});

setCase('ensayoVacio');
