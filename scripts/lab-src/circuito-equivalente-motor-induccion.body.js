/* ============================================================
   LAB — CIRCUITO EQUIVALENTE DEL MOTOR DE INDUCCIÓN POR ENSAYOS
   (Dominio D5 · máquinas eléctricas — motor asíncrono trifásico)
   MOLDE S+P: esquemático + motor de cálculo + instrumentos virtuales
   digitales, banco 3D modesto (motor + fuente de ensayo), sin objeto
   físico de inspección detallada ni fase de ensamble — mismo patrón
   que arranque-motor-induccion (d5-07).
   Norma ancla citada en la lista maestra (d5-08): IEEE Std 112-2004
   (Standard Test Procedure for Polyphase Induction Motors and
   Generators). Cláusulas usadas:
     · §5.4     ensayo de CD (resistencia de estátor en frío)
     · §5.7      ensayo de vacío (sin carga)
     · §5.9.1    ensayo de rotor bloqueado a frecuencia reducida (≤25% fn)
     · §5.9.2.2  reparto NEMA de reactancia de fuga X1/X2' por diseño
   Modelo de ingeniería (circuito equivalente en T, referido al estátor):
     Ensayo de CD:            R1 = R_línea-línea / 2   (estátor en Y)
     Ensayo de vacío:         Znl=Vf/Inl · Rnl_ef=(P3/3)/Inl² (núcleo+F&V+cobre)
                               Xnl=√(Znl²−Rnl_ef²) · Pscl=3·Inl²·R1 · Prot=Pnl3−Pscl
     Rotor bloqueado (f red.): Zbl=Vf/Ibl · Rbl=(P3/3)/Ibl² (NO se corrige por f)
                               Xbl(ftest)=√(Zbl²−Rbl²) · Xbl(fn)=(fn/ftest)·Xbl(ftest)
     Ensamble (Diseño NEMA B): X1=0.4·Xbl(fn) · X2'=0.6·Xbl(fn)
                               Xm=Xnl−X1 · R2'=Rbl−R1
   IMPORTANTE — topología: en el circuito en T, la rama de magnetización
   jXm cuelga DESPUÉS de la rama serie del estátor (R1+jX1), en paralelo
   con la rama del rotor (R2'/s + jX2'). Esto es distinto de la
   aproximación de transformador de d5-02 (Rc/Xm en la fuente, ANTES de
   la rama serie) — aquí no se aproxima así porque Xm es comparable en
   magnitud a X1, no despreciable frente a ella.
   Curva par-deslizamiento (Thévenin visto desde el entrehierro):
     Zth = jXm·(R1+jX1) / (R1+j(X1+Xm))     Vth = V1·jXm / (R1+j(X1+Xm))
     T(s) = 3·|Vth|²·(R2'/s) / (ws·[(Rth+R2'/s)²+(Xth+X2')²])
     s_Tmax = R2' / √(Rth²+(Xth+X2')²)       ws = ns(rad/s), ns=120·f/p
   Fuera de alcance (documentado en ficha.md, NO modelado aquí):
     corrección por temperatura (§5.2.1 IEEE 112), dependencia de R2'
     con la frecuencia de deslizamiento (efecto piel en barras del
     rotor — tema avanzado de doble jaula), saturación de Xm con la
     tensión aplicada.
   CERO Math.random() en la física del lab: los cuatro ensayos son
   datos fijos de un motor ilustrativo del simulador (NO un datasheet
   real — bandera ⚑, ver ficha.md); toda la física se deriva de ellos
   de forma determinista.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.9,2.7,5.0],target:[0.1,1.35,-0.1],bgTop:'#0d1a1e',bgBot:'#04070a',bloom:0.35,minD:2.8,maxD:15});
const {scene}=S;
const el=id=>document.getElementById(id);
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:1800,Q:0.9});
const std=o=>new THREE.MeshStandardMaterial(o);
const alu=castAluminum(), brush=brushedMetal(), plastic=techPlastic();
const MAT={
  carcasa: std({...brush, color:0x2f4f66, metalness:0.5, roughness:0.55, envMapIntensity:0.9}),
  cap:     std({...alu, color:0x6a7078, metalness:0.75, roughness:0.5, envMapIntensity:1.1}),
  shaft:   std({...brush, color:0xc9ced3, metalness:0.95, roughness:0.18, envMapIntensity:1.4}),
  lock:    std({color:0xd6483c, metalness:0.3, roughness:0.5, emissive:0x5a140f, emissiveIntensity:0.35}),
  termBox: std({color:0x22262b, metalness:0.3, roughness:0.7}),
  dark:    std({color:0x05070a, roughness:0.8, metalness:0.2}),
  bench:   std({...brush, color:0x2b3138, metalness:0.55, roughness:0.5, envMapIntensity:0.7}),
  benchLeg:std({color:0x171b20, metalness:0.7, roughness:0.4}),
  dial:    std({...alu, color:0x828a93, metalness:0.9, roughness:0.3, envMapIntensity:1.1}),
  needle:  std({color:0x2A9D8F, metalness:0.2, roughness:0.5, emissive:0x1e6f63, emissiveIntensity:0.6}),
  cableRed:std({color:0xb03a3a, roughness:0.55}),
  cableBlk:std({color:0x1c1f22, roughness:0.55}),
};

/* ---------- física (ensayos IEEE 112) ---------- */
const MEAS={
  dc:{Rll:0.612},
  vacio:{Vline:230, I:8.2, P3:640},
  bloqueado:{fTest:15, fRated:60, Vline:44.5, I:27.6, P3:1650},
  motor:{poles:4, freqRated:60},
};
function cmul(a,b){ return [a[0]*b[0]-a[1]*b[1], a[0]*b[1]+a[1]*b[0]]; }
function cdiv(a,b){ const d=b[0]*b[0]+b[1]*b[1]; return [(a[0]*b[0]+a[1]*b[1])/d, (a[1]*b[0]-a[0]*b[1])/d]; }
function cabs(a){ return Math.hypot(a[0],a[1]); }
function dcStats(){
  const {Rll}=MEAS.dc;
  const R1=Rll/2;
  return {Rll,R1};
}
function vacioStats(){
  const {Vline,I,P3}=MEAS.vacio;
  const Vf=Vline/Math.sqrt(3);
  const Znl=Vf/I;
  const Rnl=(P3/3)/(I*I);
  const Xnl=Math.sqrt(Znl*Znl-Rnl*Rnl);
  const {R1}=dcStats();
  const Pscl=3*I*I*R1;
  const Prot=P3-Pscl;
  return {Vline,Vf,I,P3,Znl,Rnl,Xnl,Pscl,Prot};
}
function rotorBloqueadoStats(){
  const {fTest,fRated,Vline,I,P3}=MEAS.bloqueado;
  const Vf=Vline/Math.sqrt(3);
  const Zbl=Vf/I;
  const Rbl=(P3/3)/(I*I);
  const XblTest=Math.sqrt(Zbl*Zbl-Rbl*Rbl);
  const XblRated=(fRated/fTest)*XblTest;
  return {fTest,fRated,Vline,Vf,I,P3,Zbl,Rbl,XblTest,XblRated};
}
function torqueAt(s,cs){
  if(s<=0) return 0;
  const denomR=cs.Zth[0]+cs.R2/s, denomX=cs.Zth[1]+cs.X2;
  const Zt2=denomR*denomR+denomX*denomX;
  const I2=cs.Vth/Math.sqrt(Zt2);
  const Pag=3*I2*I2*(cs.R2/s);
  return Pag/cs.ws;
}
function circuitoStats(){
  const {R1}=dcStats();
  const {Xnl}=vacioStats();
  const {Rbl,XblRated}=rotorBloqueadoStats();
  const X1=0.4*XblRated, X2=0.6*XblRated;
  const Xm=Xnl-X1, R2=Rbl-R1;
  const V1=MEAS.vacio.Vline/Math.sqrt(3);
  const jXm=[0,Xm], Z1=[R1,X1];
  const Zth=cdiv(cmul(jXm,Z1),[R1,X1+Xm]);
  const Vth=cabs(cdiv(cmul([V1,0],jXm),[R1,X1+Xm]));
  const {poles,freqRated}=MEAS.motor;
  const nsRpm=120*freqRated/poles;
  const ws=nsRpm*2*Math.PI/60;
  const cs={R1,Xnl,Rbl,XblRated,X1,X2,Xm,R2,Zth,Vth,nsRpm,ws};
  cs.Tstart=torqueAt(1,cs);
  cs.sMaxT=R2/Math.sqrt(Zth[0]*Zth[0]+(Zth[1]+X2)*(Zth[1]+X2));
  cs.Tmax=torqueAt(cs.sMaxT,cs);
  return cs;
}
function torqueCurvePoints(cs,n=140){
  const pts=[];
  for(let i=0;i<=n;i++){ const s=0.003+(1-0.003)*(i/n); pts.push({s,n:cs.nsRpm*(1-s),T:torqueAt(s,cs)}); }
  return pts;
}
const DC=dcStats(), VAC=vacioStats(), RB=rotorBloqueadoStats(), CIR=circuitoStats();

/* ---------- formatters ---------- */
const fmtV=v=>v.toFixed(2)+' V';
const fmtA=v=>v.toFixed(2)+' A';
const fmtW=v=>v.toFixed(1)+' W';
const fmtOhm=v=>v.toFixed(3)+' Ω';
const fmtNm=v=>v.toFixed(2)+' N·m';
const fmtRpm=v=>v.toFixed(0)+' rpm';
const fmtHz=v=>v.toFixed(0)+' Hz';
const fmtS=v=>v.toFixed(4);

/* ---------- CASES ---------- */
const CASES={
  ensayoDC:{ key:'ensayoDC', nombre:'Ensayo de CD', mode:'test', testType:'dc',
    mision:'Motor detenido y DESenergizado: mide la resistencia de línea a línea del estátor con un óhmetro/fuente de CD y una pinza amperimétrica.' },
  ensayoVacio:{ key:'ensayoVacio', nombre:'Ensayo de vacío (sin carga)', mode:'test', testType:'ac',
    mision:'Motor girando LIBRE (sin carga en el eje), a tensión y frecuencia nominales: mide V, I y P de línea para hallar la rama de magnetización.' },
  rotorBloqueado:{ key:'rotorBloqueado', nombre:'Ensayo de rotor bloqueado', mode:'test', testType:'blocked',
    mision:'Rotor mecánicamente TRABADO: aplica tensión reducida a frecuencia reducida (≤25% de la nominal) para hallar la rama serie sin distorsión por efecto piel.' },
  circuitoEquivalente:{ key:'circuitoEquivalente', nombre:'Circuito equivalente y curva par-deslizamiento', mode:'equiv',
    mision:'Ensambla los tres ensayos en el circuito equivalente en T (Diseño NEMA B) y observa la curva par-deslizamiento resultante.' },
};
const CASE_ORDER=['ensayoDC','ensayoVacio','rotorBloqueado','circuitoEquivalente'];
const CASE_CAM={
  ensayoDC:            [[3.4,2.2,3.6],[0.5,1.15,0.1]],
  ensayoVacio:          [[3.9,2.7,5.0],[0.1,1.35,-0.1]],
  rotorBloqueado:       [[3.4,2.2,3.6],[0.5,1.15,0.1]],
  circuitoEquivalente:  [[0.2,1.9,4.6],[-1.7,1.55,-0.85]],
};

/* ---------- estado ---------- */
let caseKey='ensayoDC', active=false, solved=false, simT=0;
let vVal=0,vTarget=0, iVal=0,iTarget=0, pVal=0,pTarget=0;
let toastT=null;
function showToast(html,ms=3300){ const t=el('toast'); t.innerHTML=html; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms); }

/* ---------- targets de aguja/telemetría por caso ---------- */
function caseTargets(key){
  if(key==='ensayoDC') return {v:0, i:0, p:0};
  if(key==='ensayoVacio') return {v:VAC.Vf, i:VAC.I, p:VAC.P3};
  if(key==='rotorBloqueado') return {v:RB.Vf, i:RB.I, p:RB.P3};
  return {v:0, i:0, p:0};
}

/* ---------- shuffle (Fisher-Yates) ---------- */
function shuffle(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/* ---------- generadores de pregunta ---------- */
function dcQuizText(){
  return { pregunta:`Mediste R_línea-línea = ${DC.Rll} Ω entre dos terminales del estátor (conexión estrella), motor detenido y desenergizado. ¿Cuál es R1 (resistencia de una fase)?`,
    opciones: shuffle([
      {t:`R1 = R_línea-línea / 2 = ${DC.R1.toFixed(3)} Ω`, ok:true, why:'En estrella, entre dos terminales de línea hay DOS devanados en serie (R1+R1=2R1), así que R1=Rll/2.'},
      {t:`R1 = R_línea-línea = ${DC.Rll.toFixed(3)} Ω`, ok:false, why:'Eso ignora que la medición entre dos terminales en estrella incluye dos fases en serie, no una sola.'},
      {t:`R1 = R_línea-línea / 3 = ${(DC.Rll/3).toFixed(3)} Ω`, ok:false, why:'Dividir entre 3 confunde con un promedio trifásico o con la conexión delta; en estrella el factor correcto es 2.'},
      {t:`R1 = (R_línea-línea / 2) × 1.15 (factor de corrección CA)`, ok:false, why:'IEEE 112 no define ningún factor de corrección CA/efecto piel para R1 en el ensayo de CD — esa cifra no existe en la norma.'},
    ]) };
}
function vacioQuizText(){
  return { pregunta:`En el ensayo de vacío: Vlínea=${VAC.Vline}V, I=${VAC.I}A, P3φ=${VAC.P3}W. P3φ incluye pérdidas en el cobre del estátor (3·I²·R1) ADEMÁS de las pérdidas rotacionales (núcleo + fricción y ventilación). ¿Cómo se obtiene Prot?`,
    opciones: shuffle([
      {t:`Prot = P3φ − 3·Inl²·R1 = ${VAC.Prot.toFixed(2)} W`, ok:true, why:`Pscl=3·${VAC.I}²·${DC.R1.toFixed(3)}=${VAC.Pscl.toFixed(2)}W es cobre del estátor; el resto, ${VAC.Prot.toFixed(2)}W, son pérdidas rotacionales agrupadas (núcleo+F&V).`},
      {t:`Prot = P3φ = ${VAC.P3} W directamente`, ok:false, why:'Confunde la potencia total de entrada en vacío con las pérdidas rotacionales puras — ignora el cobre del estátor.'},
      {t:`Prot = P3φ − Znl·Inl² = ${(VAC.P3-VAC.Znl*VAC.I*VAC.I).toFixed(2)} W`, ok:false, why:'Usa la impedancia total Znl en vez de R1 (o Rnl_ef) para estimar pérdidas — mezcla resistencia con impedancia.'},
      {t:`Prot = P3φ / 3 = ${(VAC.P3/3).toFixed(2)} W`, ok:false, why:'Dividir entre 3 no tiene sentido físico aquí: P3φ ya es la potencia trifásica total, no hay que repartirla entre fases para esta resta.'},
    ]) };
}
function rotorQuizText(){
  return { pregunta:`El ensayo de rotor bloqueado se hizo a f=${RB.fTest}Hz (25% de la nominal ${RB.fRated}Hz) para evitar que el efecto piel distorsione la resistencia del rotor. Mediste Rbl=${RB.Rbl.toFixed(3)}Ω y Xbl(${RB.fTest}Hz)=${RB.XblTest.toFixed(3)}Ω. ¿Cómo se refieren a la frecuencia nominal?`,
    opciones: shuffle([
      {t:`Rbl no se corrige; Xbl(${RB.fRated}Hz) = (${RB.fRated}/${RB.fTest})·Xbl(${RB.fTest}Hz) = ${RB.XblRated.toFixed(3)} Ω`, ok:true, why:'La reactancia escala linealmente con la frecuencia (X=ωL); la resistencia de CD/rotor bloqueado no depende de f de esta forma.'},
      {t:`Ambas, Rbl y Xbl, se multiplican por ${RB.fRated}/${RB.fTest}=${(RB.fRated/RB.fTest).toFixed(0)}`, ok:false, why:'La corrección por frecuencia aplica solo a la reactancia (X=ωL); aplicarla también a R sobrestimaría R2\' drásticamente.'},
      {t:`Xbl(${RB.fRated}Hz) = Xbl(${RB.fTest}Hz) × (${RB.fTest}/${RB.fRated}) = ${(RB.XblTest*RB.fTest/RB.fRated).toFixed(4)} Ω`, ok:false, why:'Invierte la razón de frecuencias: al subir la frecuencia la reactancia debe AUMENTAR, no disminuir.'},
      {t:'No se corrige nada: el ensayo ya se hizo "a la frecuencia correcta"', ok:false, why:'El ensayo se hace deliberadamente a frecuencia REDUCIDA (para no distorsionar R2\' por efecto piel) y luego se refiere a la nominal — omitir ese paso invalida Xbl.'},
    ]) };
}
function equivQuizText(){
  return { pregunta:`Con Xbl(${RB.fRated}Hz)=${RB.XblRated.toFixed(3)}Ω y el motor clasificado NEMA Diseño B, ¿cómo se reparte esta reactancia entre X1 (estátor) y X2' (rotor referido), y cómo se obtiene Xm?`,
    opciones: shuffle([
      {t:`X1=0.4·Xbl=${CIR.X1.toFixed(3)}Ω, X2'=0.6·Xbl=${CIR.X2.toFixed(3)}Ω; Xm=Xnl−X1=${CIR.Xnl.toFixed(3)}−${CIR.X1.toFixed(3)}=${CIR.Xm.toFixed(3)}Ω`, ok:true, why:'Diseño B reparte 40/60 (más peso al rotor); Xm se obtiene restando la reactancia de fuga del estátor de la reactancia total de vacío.'},
      {t:`X1=X2'=0.5·Xbl=${(RB.XblRated/2).toFixed(3)}Ω (reparto igual)`, ok:false, why:'El reparto 50/50 corresponde a Diseño A/D o rotor devanado — el motor de este ensayo es Diseño B (40/60), no ese caso.'},
      {t:`Xm=Xnl=${CIR.Xnl.toFixed(3)}Ω directamente, sin restar X1`, ok:false, why:'Xnl ya incluye la reactancia de fuga del estátor X1 en serie con Xm; hay que restarla o Xm queda sobrestimado.'},
      {t:`X1=0.6·Xbl=${(0.6*RB.XblRated).toFixed(3)}Ω, X2'=0.4·Xbl=${(0.4*RB.XblRated).toFixed(3)}Ω (reparto invertido)`, ok:false, why:'Invierte la tabla NEMA — Diseño B da MÁS peso a X2\' (0.6) que a X1 (0.4), no al revés.'},
    ]) };
}
function currentQuiz(){
  switch(caseKey){
    case 'ensayoDC': return dcQuizText();
    case 'ensayoVacio': return vacioQuizText();
    case 'rotorBloqueado': return rotorQuizText();
    default: return equivQuizText();
  }
}

/* ---------- glifos de esquemático ---------- */
let HIT=[];
function addHit(id,x,y,w,h,label){ HIT.push({id,x,y,w,h,label}); }
function line(ctx,x1,y1,x2,y2,w,col){ ctx.strokeStyle=col; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
function labelAt(ctx,x,y,text,color='#dfe7ee',size=18,align='left'){ ctx.fillStyle=color; ctx.font=`${size}px 'Segoe UI',sans-serif`; ctx.textAlign=align; ctx.fillText(text,x,y); }
function hResistorGlyph(ctx,x,y,w,col){ ctx.strokeStyle=col; ctx.lineWidth=3; ctx.strokeRect(x,y-14,w,28); }
function vResistorGlyph(ctx,x,y,h,col){ ctx.strokeStyle=col; ctx.lineWidth=3; ctx.strokeRect(x-14,y,28,h); }
function hCoilGlyph(ctx,x,y,w,col){ ctx.strokeStyle=col; ctx.lineWidth=3; const n=5, seg=w/n;
  ctx.beginPath(); ctx.moveTo(x,y);
  for(let i=0;i<n;i++){ const cx=x+seg*(i+0.5); ctx.arc(cx,y,seg/2,Math.PI,0,false); }
  ctx.stroke(); }
function vCoilGlyph(ctx,x,y,h,col){ ctx.strokeStyle=col; ctx.lineWidth=3; const n=5, seg=h/n;
  ctx.beginPath(); ctx.moveTo(x,y);
  for(let i=0;i<n;i++){ const cy=y+seg*(i+0.5); ctx.arc(x,cy,seg/2,-Math.PI/2,Math.PI/2,false); }
  ctx.stroke(); }
function circleMeter(ctx,x,y,r,letter,col){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.strokeStyle=col; ctx.lineWidth=3; ctx.stroke();
  ctx.fillStyle=col; ctx.font=`bold ${Math.round(r*1.1)}px 'Segoe UI',sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(letter,x,y+1); ctx.textBaseline='alphabetic'; }
function acSourceGlyph(ctx,x,y,r,col){ ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.strokeStyle=col; ctx.lineWidth=3; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x-r*0.55,y); ctx.bezierCurveTo(x-r*0.25,y-r*0.7,x+r*0.25,y+r*0.7,x+r*0.55,y); ctx.strokeStyle=col; ctx.lineWidth=2.4; ctx.stroke(); }
function dcSourceGlyph(ctx,x,y,r,col){ ctx.strokeStyle=col; ctx.lineWidth=3;
  line(ctx,x-r*0.7,y-r*0.5,x-r*0.7,y+r*0.5,4,col); line(ctx,x-r*0.28,y-r*0.25,x-r*0.28,y+r*0.25,2,col);
  line(ctx,x+r*0.28,y-r*0.5,x+r*0.28,y+r*0.5,4,col); line(ctx,x+r*0.7,y-r*0.25,x+r*0.7,y+r*0.25,2,col);
  labelAt(ctx,x,y-r*0.9,'CD','#8A94A0',14,'center'); }
function padlockGlyph(ctx,x,y,s,col){ ctx.strokeStyle=col; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(x,y-s*0.35,s*0.32,Math.PI,0,false); ctx.stroke();
  ctx.fillStyle=col; ctx.fillRect(x-s*0.4,y-s*0.1,s*0.8,s*0.55); }
function scheHeader(ctx,title){ ctx.clearRect(0,0,1024,768); ctx.fillStyle='#0b1116'; ctx.fillRect(0,0,1024,768);
  ctx.strokeStyle='#26313a'; ctx.lineWidth=2; ctx.strokeRect(6,6,1012,756);
  labelAt(ctx,40,50,title,'#8fd1ff',26); }

/* ---------- circuito de ensayo (por caso) ---------- */
function drawTestCircuit(ctx){
  HIT=[]; const c=CASES[caseKey];
  scheHeader(ctx, c.nombre);
  if(c.testType==='dc'){
    dcSourceGlyph(ctx,150,300,44,'#e0b23c'); addHit('src',106,256,88,88,'Fuente de CD ajustable');
    line(ctx,194,300,300,300,3,'#dfe7ee');
    circleMeter(ctx,340,300,26,'A','#43D9AD'); addHit('am',314,274,52,52,'Amperímetro de CD (en serie)');
    line(ctx,366,300,470,300,3,'#dfe7ee');
    line(ctx,470,240,470,360,3,'#dfe7ee');
    vCoilGlyph(ctx,470,240,60,'#d64545'); addHit('w1',450,236,40,68,'Devanado del estátor — fase T1');
    line(ctx,470,300,470,360,0,'#dfe7ee');
    labelAt(ctx,470,395,'T1',dc_col(),16,'center');
    line(ctx,470,360,650,360,3,'#dfe7ee');
    line(ctx,650,300,650,360,3,'#dfe7ee');
    vCoilGlyph(ctx,650,240,60,'#3d7fd6'); addHit('w2',630,236,40,68,'Devanado del estátor — fase T2 (en serie con T1 al medir línea-línea)');
    labelAt(ctx,650,395,'T2','#dfe7ee',16,'center');
    line(ctx,650,300,650,240,0,'#dfe7ee');
    line(ctx,650,300,760,300,3,'#dfe7ee'); line(ctx,760,300,760,300,3,'#dfe7ee');
    line(ctx,150,344,650,344,0,'transparent');
    line(ctx,760,300,760,300,0,'transparent');
    line(ctx,760,300,150,300,0,'transparent');
    line(ctx,760,300,760,150,0,'transparent');
    line(ctx,760,150,150,150,0,'transparent');
    line(ctx,150,150,150,256,3,'#dfe7ee');
    line(ctx,760,150,760,300,3,'#dfe7ee'); line(ctx,760,150,650,150,3,'#dfe7ee'); line(ctx,650,150,650,236,3,'#dfe7ee');
    labelAt(ctx,470,470,'Motor DESenergizado y detenido — medición estrella: Rll = 2·R1','#8A94A0',18,'center');
  } else if(c.testType==='ac'||c.testType==='blocked'){
    acSourceGlyph(ctx,150,300,44,'#e0b23c'); addHit('src',106,256,88,88,c.testType==='blocked'?'Fuente trifásica a frecuencia reducida (≤25% fn)':'Fuente trifásica a tensión y frecuencia nominales');
    line(ctx,194,300,290,300,3,'#dfe7ee');
    circleMeter(ctx,320,300,26,'A','#43D9AD'); addHit('am',294,274,52,52,'Amperímetro de línea');
    line(ctx,346,300,420,300,3,'#dfe7ee');
    circleMeter(ctx,450,300,26,'W','#f4c95d'); addHit('wm',424,274,52,52,'Wattmetro (potencia activa de línea)');
    line(ctx,476,300,560,300,3,'#dfe7ee');
    line(ctx,560,240,560,360,2,'#3d7fd6'); circleMeter(ctx,560,240,20,'V','#3d7fd6'); addHit('vm',534,214,52,52,'Voltímetro (tensión de línea)');
    line(ctx,560,300,660,300,3,'#dfe7ee');
    vCoilGlyph(ctx,660,240,120,'#d64545'); addHit('w',630,236,60,128,'Devanado del estátor (esquema unifilar, motor trifásico)');
    line(ctx,660,360,150,360,3,'#dfe7ee'); line(ctx,150,360,150,344,3,'#dfe7ee');
    if(c.testType==='ac'){
      const cx=880,cy=300; line(ctx,780,300,cx-60,300,3,'#dfe7ee');
      ctx.beginPath(); ctx.arc(cx,cy,26,0,Math.PI*2); ctx.strokeStyle='#43D9AD'; ctx.lineWidth=3; ctx.stroke(); addHit('shaft',cx-30,cy-30,60,60,'Eje LIBRE — sin carga mecánica acoplada');
      ctx.save(); ctx.translate(cx,cy); const a=simT*4;
      line(ctx,0,0,Math.cos(a)*22,Math.sin(a)*22,3,'#43D9AD'); ctx.restore();
      labelAt(ctx,cx,cy+56,'sin carga','#43D9AD',16,'center');
    } else {
      const cx=880,cy=300; line(ctx,780,300,cx-40,300,3,'#dfe7ee');
      padlockGlyph(ctx,cx,cy,44,'#ff6b6b'); addHit('shaft',cx-30,cy-46,60,80,'Eje TRABADO mecánicamente — rotor bloqueado');
      labelAt(ctx,cx,cy+56,'rotor bloqueado','#ff6b6b',16,'center');
    }
    labelAt(ctx,470,470,c.testType==='blocked'?`Frecuencia de ensayo reducida: f=${RB.fTest}Hz (nominal ${RB.fRated}Hz)`:'Motor girando LIBRE, sin carga en el eje','#8A94A0',18,'center');
  }
}
function dc_col(){ return '#dfe7ee'; }

/* ---------- circuito equivalente en T + curva par-deslizamiento ---------- */
function drawEquivCircuit(ctx){
  HIT=[]; scheHeader(ctx,'Circuito equivalente en T (Diseño NEMA B)');
  const hideAns=!solved, pend=t=>hideAns?t+' = ¿? (resuelve la pregunta)':t;
  const y=180, x0=90, x1=260, xNode=430, x2=620, xEnd=880;
  line(ctx,x0,y,x0,y-40,3,'#8fd1ff'); acSourceGlyph(ctx,x0,y-40,26,'#8fd1ff'); addHit('src',x0-26,y-92,52,52,'Fuente — tensión de fase nominal V1');
  line(ctx,x0,y,x1,y,3,'#dfe7ee');
  hResistorGlyph(ctx,x1,y,90,'#d64545'); addHit('r1',x1,y-14,90,28, hideAns?pend('R1 (estátor)'):`R1 (estátor) = ${CIR.R1.toFixed(3)} Ω`);
  labelAt(ctx,x1+45,y-24,'R1','#d64545',15,'center');
  line(ctx,x1+90,y,x1+150,y,3,'#dfe7ee');
  hCoilGlyph(ctx,x1+150,y,90,'#e0b23c'); addHit('x1',x1+150,y-14,90,28, hideAns?pend('X1 (fuga estátor)'):`X1 (fuga estátor) = ${CIR.X1.toFixed(3)} Ω`);
  labelAt(ctx,x1+195,y-24,'X1','#e0b23c',15,'center');
  line(ctx,x1+240,y,xNode,y,3,'#dfe7ee');
  ctx.beginPath(); ctx.arc(xNode,y,5,0,Math.PI*2); ctx.fillStyle='#dfe7ee'; ctx.fill();
  line(ctx,xNode,y,xNode,y+120,3,'#3d7fd6');
  vCoilGlyph(ctx,xNode-14,y+120,90,'#3d7fd6'); addHit('xm',xNode-28,y+120,56,90, hideAns?pend('Xm (magnetización)'):`Xm (magnetización) = ${CIR.Xm.toFixed(3)} Ω`);
  labelAt(ctx,xNode+34,y+165,'Xm','#3d7fd6',15,'left');
  line(ctx,xNode,y+210,xNode,y+236,3,'#3d7fd6'); line(ctx,xNode-30,y+236,xNode+30,y+236,3,'#3d7fd6');
  line(ctx,xNode,y,x2,y,3,'#dfe7ee');
  hResistorGlyph(ctx,x2,y,90,'#43D9AD'); addHit('r2s',x2,y-14,90,28, hideAns?pend("R2'/s (rotor referido / deslizamiento)"):`R2'/s (rotor referido / deslizamiento) — a s=1: ${CIR.R2.toFixed(3)} Ω`);
  labelAt(ctx,x2+45,y-24,"R2'/s",'#43D9AD',15,'center');
  line(ctx,x2+90,y,x2+150,y,3,'#dfe7ee');
  hCoilGlyph(ctx,x2+150,y,90,'#f4c95d'); addHit('x2',x2+150,y-14,90,28, hideAns?pend("X2' (fuga rotor referida)"):`X2' (fuga rotor referida) = ${CIR.X2.toFixed(3)} Ω`);
  labelAt(ctx,x2+195,y-24,"X2'",'#f4c95d',15,'center');
  line(ctx,x2+240,y,xEnd,y,3,'#dfe7ee');
  line(ctx,xEnd,y,xEnd,y+236,3,'#dfe7ee'); line(ctx,xEnd,y+236,xNode,y+236,0,'transparent');
  line(ctx,x0,y+236,xEnd,y+236,3,'#dfe7ee'); line(ctx,x0,y,x0,y+236,0,'transparent');
  labelAt(ctx,970,y+90,'entrehierro','#8A94A0',14,'right');

  /* curva par-deslizamiento */
  const ox=110, oyBase=730, w=850, h=210, NMAX=CIR.nsRpm+50, TGMAX=Math.ceil(CIR.Tmax/5)*5+5;
  labelAt(ctx,40,oyBase-h-26,'Curva par-deslizamiento T(s) — Thévenin visto desde el entrehierro','#8fd1ff',20);
  line(ctx,ox,oyBase,ox+w,oyBase,2,'#5b6672'); line(ctx,ox,oyBase,ox,oyBase-h,2,'#5b6672');
  labelAt(ctx,ox+w,oyBase+20,'n (rpm) →','#dfe7ee',14,'right');
  labelAt(ctx,ox,oyBase-h-8,'T (N·m)','#dfe7ee',14,'left');
  const px=n=>ox+Math.min(1,n/NMAX)*w, py=T=>oyBase-Math.min(1,T/TGMAX)*h;
  const pts=torqueCurvePoints(CIR);
  ctx.beginPath(); pts.forEach((p,i)=>{ const X=px(p.n),Y=py(p.T); if(i===0) ctx.moveTo(X,Y); else ctx.lineTo(X,Y); });
  ctx.strokeStyle='#43D9AD'; ctx.lineWidth=3; ctx.stroke();
  const nStart=0, TStart=CIR.Tstart, xS=px(nStart), yS=py(TStart);
  ctx.beginPath(); ctx.arc(xS,yS,6,0,Math.PI*2); ctx.fillStyle='#f4c95d'; ctx.fill(); addHit('tstart',xS-14,yS-14,28,28,`Par de arranque Tarr = ${CIR.Tstart.toFixed(2)} N·m (s=1)`);
  labelAt(ctx,xS+12,yS-12,`Tarr=${CIR.Tstart.toFixed(2)}`,'#f4c95d',14);
  const nMax=CIR.nsRpm*(1-CIR.sMaxT), xM=px(nMax), yM=py(CIR.Tmax);
  ctx.beginPath(); ctx.arc(xM,yM,6,0,Math.PI*2); ctx.fillStyle='#ff9f5b'; ctx.fill(); addHit('tmax',xM-14,yM-14,28,28,`Par máximo (de vuelco) Tmáx = ${CIR.Tmax.toFixed(2)} N·m en s=${CIR.sMaxT.toFixed(3)}`);
  labelAt(ctx,xM+12,yM-12,`Tmáx=${CIR.Tmax.toFixed(2)}`,'#ff9f5b',14);
  line(ctx,px(CIR.nsRpm),oyBase,px(CIR.nsRpm),oyBase-h,1,'#3d7fd6'); labelAt(ctx,px(CIR.nsRpm),oyBase-h-8,`ns=${CIR.nsRpm.toFixed(0)}`,'#3d7fd6',13,'center');
}

function drawSchematic(ctx){
  const c=CASES[caseKey];
  if(c.mode==='test') drawTestCircuit(ctx); else drawEquivCircuit(ctx);
}
function boardClick(u,v){
  const x=u*1024, y=(1-v)*768;
  for(const h of HIT){ if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){ showToast(`<b>${h.label}</b>`); synth.beep(700,0.05,0.04); return; } }
}

/* ---------- tablero (canvas) ---------- */
const boardCanvas=document.createElement('canvas'); boardCanvas.width=1024; boardCanvas.height=768;
const bctx=boardCanvas.getContext('2d');
const boardTex=new THREE.CanvasTexture(boardCanvas); boardTex.colorSpace=THREE.SRGBColorSpace; boardTex.minFilter=THREE.LinearFilter; boardTex.generateMipmaps=false;
const boardG=new THREE.Group();
const boardFrame=roundedBox(4.32,3.27,0.06,MAT.dark,0.04); boardFrame.castShadow=true; boardG.add(boardFrame);
const boardPlane=new THREE.Mesh(new THREE.PlaneGeometry(4.2,3.15),new THREE.MeshBasicMaterial({map:boardTex,toneMapped:false}));
boardPlane.position.z=0.035; boardG.add(boardPlane);
boardPlane.userData={act:'board'};
boardG.position.set(0.3,2.15,-1.3); scene.add(boardG);
function drawBoard(){ drawSchematic(bctx); boardTex.needsUpdate=true; }

/* ---------- banco 3D (modesto) ---------- */
function cable(pts,mat){ const cur=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));
  const m=new THREE.Mesh(new THREE.TubeGeometry(cur,24,0.014,8),mat); m.castShadow=true; scene.add(m); return m; }
function makeDisplayBox(w,h,d,cw,ch){
  const g=new THREE.Group();
  const body=roundedBox(w,h,d,MAT.dark,0.03); body.castShadow=true; g.add(body);
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
  const cx=cv.getContext('2d');
  const tx=new THREE.CanvasTexture(cv); tx.colorSpace=THREE.SRGBColorSpace; tx.minFilter=THREE.LinearFilter; tx.generateMipmaps=false;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*0.82,h*0.6),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  screen.position.set(0,0.03,d/2+0.001); g.add(screen);
  return {g,cv,cx,tx};
}
const benchG=new THREE.Group(); scene.add(benchG);
const mesa=roundedBox(3.6,0.14,1.9,MAT.bench,0.05); mesa.position.set(0.3,0.82,0.55); mesa.receiveShadow=true; mesa.castShadow=true; benchG.add(mesa);
[[-1.35,0.15],[1.35,0.15],[-1.35,0.95],[1.35,0.95]].forEach(([dx,dz])=>{
  const leg=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.75,0.09),MAT.benchLeg); leg.position.set(0.3+dx,0.42,0.55+dz); leg.castShadow=true; benchG.add(leg);
});

/* motor bajo prueba */
const motG=new THREE.Group(); motG.position.set(-0.85,0.96,0.5);
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio:MAT.carcasa, acero:MAT.shaft, cromo:MAT.shaft, chapa:MAT.carcasa,
  cobre:std({color:0xb87333,roughness:0.35,metalness:0.75}),
  negro:std({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:std({color:0x14181e,roughness:0.80,metalness:0.02}),
  blanco:std({color:0xd7dee6,roughness:0.40,metalness:0.20}),
  ceramica:std({color:0xd7dee6,roughness:0.60,metalness:0.05}),
};
/* LA MAQUINA, con la silueta por la que se reconoce un motor desde el otro lado
   del taller: ALETAS —la superficie por la que evacua lo que no convierte en
   par—, TAPA DEL VENTILADOR con su rejilla y el ventilador calado al eje
   —por eso a media velocidad ventila la mitad—, PATAS por donde se atornilla a
   la bancada, CAJA DE BORNES por donde entra la alimentacion y placa de datos.
   Ninguna de las cinco es decorativa, y ninguna estaba dibujada: era un tubo
   liso con un disco pegado en la punta. */
const motMaq=P3.maquinaElectrica(MATP,{d:0.52,largo:0.62,eje:0.34,aletas:14});
let motGiro=0;   // el angulo del eje y del ventilador, que van calados juntos
motG.add(motMaq);
/* LA POLEA, con sus GARGANTAS: es por donde se traba el eje en el ensayo de
   rotor bloqueado. */
const pulleyG=new THREE.Group(); pulleyG.position.x=0.74;
const pol=P3.polea({acero:MAT.cap},{d:0.26,ancho:0.10,gargantas:2,dEje:0.09});
pol.rotation.z=Math.PI/2;pulleyG.add(pol);
motG.add(pulleyG);
const lockClamp=roundedBox(0.11,0.15,0.11,MAT.lock,0.02); lockClamp.position.set(0.7,-0.16,0); lockClamp.visible=false; lockClamp.castShadow=true; motG.add(lockClamp);
motG.userData={act:'motor',title:'Motor de inducción bajo prueba'};
motG.traverse(o=>{ if(o.isMesh) o.userData.act='motor'; });
benchG.add(motG);

/* fuente de ensayo */
const fuenteG=new THREE.Group(); fuenteG.position.set(-0.05,1.0,0.9);
const fBody=roundedBox(0.4,0.46,0.3,MAT.termBox,0.04); fBody.castShadow=true; fuenteG.add(fBody);
const dialG=new THREE.Group(); dialG.position.set(0,0.14,0.16);
const dialFace=new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.085,0.03,24),MAT.dial); dialFace.rotation.x=Math.PI/2; dialG.add(dialFace);
const needle=new THREE.Mesh(new THREE.BoxGeometry(0.075,0.012,0.012),MAT.needle); needle.position.x=0.03; dialG.add(needle);
fuenteG.add(dialG);
fuenteG.userData={act:'fuente',title:'Fuente / banco de ensayo (CD y CA a frecuencia variable)'};
fuenteG.traverse(o=>{ if(o.isMesh) o.userData.act='fuente'; });
benchG.add(fuenteG);

/* pantallas digitales */
const readings=makeDisplayBox(0.5,0.32,0.1,300,192); readings.g.position.set(0.85,1.15,0.95); readings.g.userData={act:'readings',title:'Lecturas de instrumentos'}; benchG.add(readings.g);
const params=makeDisplayBox(0.5,0.32,0.1,300,192); params.g.position.set(1.5,1.15,0.95); params.g.userData={act:'params',title:'Parámetros calculados'}; benchG.add(params.g);

cable([[-0.05,0.86,0.78],[0.35,0.9,0.86],[0.62,0.94,0.7],[0.75,0.96,0.55]],MAT.cableRed);
cable([[0.75,0.9,0.55],[0.85,1.0,0.75],[0.85,1.1,0.9]],MAT.cableBlk);
cable([[0.85,1.1,0.95],[1.2,1.15,0.95],[1.5,1.15,0.95]],MAT.cableBlk);

function drawReadings(){
  const {cx,cv,tx}=readings; cx.clearRect(0,0,cv.width,cv.height); cx.fillStyle='#0b1116'; cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='#8fd1ff'; cx.font='16px monospace'; cx.textAlign='left'; cx.fillText('LECTURAS',12,26);
  const c=CASES[caseKey]; cx.font='15px monospace'; cx.fillStyle='#43D9AD';
  if(c.testType==='dc'){
    cx.fillText(`I = ${active?iVal.toFixed(3):'0.000'} A`,12,66);
    cx.fillText(`R(línea) = ${active?DC.Rll.toFixed(3):'—'} Ω`,12,96);
  } else if(c.mode==='test'){
    cx.fillText(`V = ${active?vVal.toFixed(1):'0.0'} V`,12,66);
    cx.fillText(`I = ${active?iVal.toFixed(2):'0.00'} A`,12,96);
    cx.fillText(`P = ${active?pVal.toFixed(0):'0'} W`,12,126);
  } else {
    cx.fillText('Circuito ensamblado','12',66);
    cx.fillText(`Tarr = ${CIR.Tstart.toFixed(2)} N·m`,12,96);
    cx.fillText(`Tmáx = ${CIR.Tmax.toFixed(2)} N·m`,12,126);
  }
  tx.needsUpdate=true;
}
function drawParams(){
  const {cx,cv,tx}=params; cx.clearRect(0,0,cv.width,cv.height); cx.fillStyle='#0b1116'; cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='#f4c95d'; cx.font='16px monospace'; cx.textAlign='left'; cx.fillText('PARÁMETROS',12,26);
  cx.font='14px monospace'; cx.fillStyle='#dfe7ee';
  if(!solved){
    cx.fillStyle='#8FB3AC'; cx.fillText('Resuelve la pregunta',12,60); cx.fillText('para ver el resultado.',12,82);
  } else if(caseKey==='ensayoDC') cx.fillText(`R1 = ${DC.R1.toFixed(3)} Ω`,12,66);
  else if(caseKey==='ensayoVacio'){ cx.fillText(`Znl = ${VAC.Znl.toFixed(3)} Ω`,12,60); cx.fillText(`Xnl = ${VAC.Xnl.toFixed(3)} Ω`,12,86); cx.fillText(`Prot = ${VAC.Prot.toFixed(1)} W`,12,112); }
  else if(caseKey==='rotorBloqueado'){ cx.fillText(`Rbl = ${RB.Rbl.toFixed(3)} Ω`,12,60); cx.fillText(`Xbl(fn) = ${RB.XblRated.toFixed(3)} Ω`,12,86); }
  else { cx.fillText(`X1=${CIR.X1.toFixed(3)}Ω  X2'=${CIR.X2.toFixed(3)}Ω`,12,60); cx.fillText(`Xm=${CIR.Xm.toFixed(3)}Ω  R2'=${CIR.R2.toFixed(3)}Ω`,12,86); }
  tx.needsUpdate=true;
}

/* ---------- HUD ---------- */
el('hud').innerHTML=`
  <div class="eyebrow">Transformadores y máquinas eléctricas (D5)</div>
  <h2>Circuito equivalente del motor de inducción por ensayos</h2>
  <p>Realiza los tres ensayos IEEE 112 (CD, vacío, rotor bloqueado a frecuencia reducida) sobre el mismo motor y ensambla el circuito equivalente en T para obtener la curva par-deslizamiento.</p>
  <div class="formula">R1=Rll/2 · Znl=Vf/Inl · Xnl=√(Znl²−Rnl_ef²) · Prot=Pnl3−3·Inl²·R1<br>Xbl(fn)=(fn/ftest)·Xbl(ftest) · X1=0.4·Xbl · X2'=0.6·Xbl (NEMA B) · Xm=Xnl−X1 · R2'=Rbl−R1</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#d64545"></span>R1 — resistencia de estátor</div>
    <div class="li"><span class="dot" style="background:#e0b23c"></span>X1 — fuga de estátor</div>
    <div class="li"><span class="dot" style="background:#3d7fd6"></span>Xm — magnetización</div>
    <div class="li"><span class="dot" style="background:#43D9AD"></span>R2'/s — rama de rotor</div>
  </div>
  <div class="fid">
    <div class="ft">Contrato de fidelidad</div>
    <div class="fl">SÍ modela: <b>los tres ensayos IEEE 112 (§5.4 CD, §5.7 vacío, §5.9.1 rotor bloqueado a frecuencia reducida), la corrección de Xbl por frecuencia, el reparto NEMA Diseño B (§5.9.2.2, X1=0.4·Xbl, X2'=0.6·Xbl), y la curva par-deslizamiento exacta vía el equivalente de Thévenin del circuito en T (sin las simplificaciones de rotor-bloqueado-igual-a-Tmáx).</b></div>
    <div class="fl no">NO modela: <b>corrección por temperatura de los devanados (§5.2.1 IEEE 112), dependencia de R2' con la frecuencia de deslizamiento (efecto piel en barras del rotor — doble jaula), saturación de Xm con la tensión aplicada, ni transitorios de arranque.</b></div>
    <div class="fl no">Motor <b>ilustrativo</b> del simulador (no un datasheet real): los cuatro ensayos son datos fijos elegidos para dar un Diseño NEMA B razonable. ⚑ Ver ficha.md para el detalle de cada cifra.</div>
  </div>
  <div class="src">Norma ancla: IEEE Std 112-2004, Standard Test Procedure for Polyphase Induction Motors and Generators (§5.4, §5.7, §5.9.1, §5.9.2.2). Programa curricular: UAX Máquinas.</div>
  <div class="modebar">
    <button class="b on" id="c_ensayoDC">① CD</button>
    <button class="b" id="c_ensayoVacio">② Vacío</button>
    <button class="b" id="c_rotorBloqueado">③ Rotor bloqueado</button>
    <button class="b" id="c_circuitoEquivalente">④ Circuito equiv.</button>
  </div>`;

/* ---------- PANEL ---------- */
el('panel').innerHTML=`
  <div class="g"><div class="gl"><span>Ensayo actual</span><b id="p_case">Ensayo de CD</b></div></div>
  <div class="console" id="p_mision"></div>
  <div id="tele">
    <div class="g"><div class="l" id="l1">—</div><b id="t_1">—</b></div>
    <div class="g"><div class="l" id="l2">—</div><b id="t_2">—</b></div>
    <div class="g"><div class="l" id="l3">—</div><b id="t_3">—</b></div>
    <div class="g"><div class="l" id="l4">—</div><b id="t_4">—</b></div>
    <div class="g"><div class="l" id="l5">—</div><b id="t_5">—</b></div>
    <div class="g"><div class="l" id="l6">—</div><b id="t_6">—</b></div>
  </div>
  <div class="console" id="report"></div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b" id="btnPower">⚡ Energizar</button>
    <button class="b auto" id="btnAuto">✨ Demo guiada</button>
    <button class="b" id="btnNew">→ Siguiente ensayo</button>
  </div>`;

/* ---------- telemetría / reporte ---------- */
const TELE_LABELS={
  ensayoDC:['R línea-línea','R1 (por fase)','—','—','—','Estado'],
  ensayoVacio:['V (fase)','I (línea)','P₃φ','Znl','Xnl','Prot'],
  rotorBloqueado:['V (fase)','I (línea)','P₃φ','Zbl','Rbl','Xbl (fn)'],
  circuitoEquivalente:['X1 (estátor)',"X2' (rotor)",'Xm','R2\' (rotor)','Tarranque','Tmáx'],
};
function caseParams(key){
  const s=solved, a=active;
  if(key==='ensayoDC') return [
    a?fmtOhm(DC.Rll):'—',
    s?fmtOhm(DC.R1):'¿?',
    '—','—','—',
    active?'Energizado':'Desenergizado'
  ];
  if(key==='ensayoVacio') return [
    a?fmtV(VAC.Vf):'—', a?fmtA(VAC.I):'—', a?fmtW(VAC.P3):'—',
    (a&&s)?fmtOhm(VAC.Znl):'¿?', (a&&s)?fmtOhm(VAC.Xnl):'¿?', (a&&s)?fmtW(VAC.Prot):'¿?'
  ];
  if(key==='rotorBloqueado') return [
    a?fmtV(RB.Vf):'—', a?fmtA(RB.I):'—', a?fmtW(RB.P3):'—',
    (a&&s)?fmtOhm(RB.Zbl):'¿?', (a&&s)?fmtOhm(RB.Rbl):'¿?', (a&&s)?fmtOhm(RB.XblRated):'¿?'
  ];
  return [
    s?fmtOhm(CIR.X1):'¿?', s?fmtOhm(CIR.X2):'¿?', s?fmtOhm(CIR.Xm):'¿?', s?fmtOhm(CIR.R2):'¿?',
    s?fmtNm(CIR.Tstart):'¿?', s?fmtNm(CIR.Tmax):'¿?'
  ];
}
function updateTele(){
  const labels=TELE_LABELS[caseKey], vals=caseParams(caseKey);
  for(let i=0;i<6;i++){
    el('l'+(i+1)).textContent=labels[i];
    const v=el('t_'+(i+1)); v.textContent=vals[i];
    v.style.color = vals[i]==='¿?' ? 'var(--hv)' : (vals[i]==='—' ? 'var(--dim)' : '');
  }
}
function updateReport(){
  if(!solved){
    el('report').innerHTML=`<span style="color:var(--dim)">Responde la pregunta de ingeniería para ver la derivación completa de este ensayo.</span>`;
    return;
  }
  let html='';
  if(caseKey==='ensayoDC'){
    html=`R1 = Rll/2 = ${DC.Rll}/2 = <b>${DC.R1.toFixed(3)} Ω</b> (estátor conectado en estrella; entre dos terminales de línea hay dos fases en serie).`;
  } else if(caseKey==='ensayoVacio'){
    html=`Vf=${VAC.Vf.toFixed(2)}V, Znl=Vf/I=${VAC.Znl.toFixed(3)}Ω · Rnl_ef=(P₃φ/3)/I²=${VAC.Rnl.toFixed(3)}Ω · Xnl=√(Znl²−Rnl_ef²)=<b>${VAC.Xnl.toFixed(3)}Ω</b><br>Pscl=3·I²·R1=${VAC.Pscl.toFixed(2)}W · Prot=P₃φ−Pscl=<b>${VAC.Prot.toFixed(2)}W</b>`;
  } else if(caseKey==='rotorBloqueado'){
    html=`Vf=${RB.Vf.toFixed(2)}V, Zbl=Vf/I=${RB.Zbl.toFixed(3)}Ω · Rbl=(P₃φ/3)/I²=<b>${RB.Rbl.toFixed(3)}Ω</b> (no se corrige por f)<br>Xbl(${RB.fTest}Hz)=√(Zbl²−Rbl²)=${RB.XblTest.toFixed(3)}Ω · Xbl(${RB.fRated}Hz)=(fn/ftest)·Xbl(ftest)=<b>${RB.XblRated.toFixed(3)}Ω</b>`;
  } else {
    html=`X1=0.4·Xbl=<b>${CIR.X1.toFixed(3)}Ω</b> · X2'=0.6·Xbl=<b>${CIR.X2.toFixed(3)}Ω</b> · Xm=Xnl−X1=<b>${CIR.Xm.toFixed(3)}Ω</b> · R2'=Rbl−R1=<b>${CIR.R2.toFixed(3)}Ω</b><br>Zth=${CIR.Zth[0].toFixed(3)}+j${CIR.Zth[1].toFixed(3)}Ω, |Vth|=${CIR.Vth.toFixed(2)}V · Tarr=<b>${CIR.Tstart.toFixed(2)}N·m</b> · Tmáx=<b>${CIR.Tmax.toFixed(2)}N·m</b> en s=${CIR.sMaxT.toFixed(3)}`;
  }
  el('report').innerHTML=html;
}
function refreshBench(){ drawReadings(); drawParams();
  if(needle) needle.rotation.z=(active?(vVal/(caseTargets(caseKey).v||1)):0)*1.6-0.1;
}
function refreshAll(){ updateTele(); updateReport(); drawBoard(); refreshBench(); }

/* ---------- quiz UI ---------- */
let currentQ=null;
function clearDx(){ el('dxbtns').innerHTML=''; solved=false; }
function refreshQuestion(){
  currentQ=currentQuiz();
  el('q_text').innerHTML=currentQ.pregunta;
  clearDx();
  currentQ.opciones.forEach((o,i)=>{
    const b=document.createElement('button'); b.className='b'; b.textContent=o.t;
    b.onclick=()=>answer(i,currentQ); el('dxbtns').appendChild(b);
  });
}
function answer(i,q){
  const btns=[...el('dxbtns').children]; btns.forEach(b=>b.disabled=true);
  const o=q.opciones[i];
  btns[i].classList.add(o.ok?'ok':'bad');
  if(!o.ok){ const okIdx=q.opciones.findIndex(x=>x.ok); btns[okIdx].classList.add('ok'); }
  solved=o.ok;
  synth.beep(o.ok?1046:220,o.ok?0.14:0.16,0.06);
  showToast(`<b style="color:${o.ok?'var(--good)':'var(--bad)'}">${o.ok?'✔ Correcto.':'✗ No es correcto.'}</b><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`,4600);
  refreshAll();
}

/* ---------- máquina de casos ---------- */
function setCase(key){
  caseKey=key; active=false; solved=false;
  const tg=caseTargets(key); vTarget=tg.v; iTarget=tg.i; pTarget=tg.p;
  CASE_ORDER.forEach(k=>{ const b=el('c_'+k); if(b) b.classList.toggle('on',k===key); });
  el('p_case').textContent=CASES[key].nombre;
  el('p_mision').textContent=CASES[key].mision;
  el('btnPower').textContent='⚡ Energizar'; el('btnPower').classList.remove('on');
  lockClamp.visible=(key==='rotorBloqueado');
  const meta=CASE_CAM[key]; S.moveTo(meta[0],meta[1],1.3);
  clearDx(); refreshQuestion();
  refreshAll();
  showToast(`<b>${CASES[key].nombre}</b>`);
}

/* ---------- picker / interacción ---------- */
function tagged(obj){ let o=obj; while(o){ if(o.userData&&o.userData.act) return o; o=o.parent; } return null; }
pickerFor(scene,S.camera,mount,(hit)=>{
  if(!hit) return;
  if(hit.object===boardPlane){ boardClick(hit.uv.x,hit.uv.y); return; }
  const t=tagged(hit.object);
  if(!t) return;
  if(t.userData.act==='motor') showToast(`<b>Motor de inducción</b><br><span style="color:var(--dim);font-size:11px">${caseKey==='rotorBloqueado'?'Rotor trabado mecánicamente para este ensayo.':'Bajo prueba en el ensayo actual.'}</span>`);
  else if(t.userData.act==='fuente') showToast('<b>Fuente / banco de ensayo</b><br><span style="color:var(--dim);font-size:11px">Suministra CD (ensayo de CD) o CA trifásica a tensión/frecuencia según el ensayo.</span>');
  else if(t.userData.act==='readings') showToast('<b>Lecturas de instrumentos</b><br><span style="color:var(--dim);font-size:11px">V/I/P medidos en el ensayo activo.</span>');
  else if(t.userData.act==='params') showToast('<b>Parámetros calculados</b><br><span style="color:var(--dim);font-size:11px">Resultado del ensayo, derivado de las lecturas.</span>');
});

/* ---------- wiring de UI ---------- */
CASE_ORDER.forEach(k=>{ const b=el('c_'+k); if(b) b.onclick=()=>setCase(k); });
el('btnNew').onclick=()=>{ const i=CASE_ORDER.indexOf(caseKey); setCase(CASE_ORDER[(i+1)%CASE_ORDER.length]); };
el('btnPower').onclick=()=>{
  if(caseKey==='circuitoEquivalente'){ showToast('Este caso no requiere energizar: ya combina los tres ensayos.'); return; }
  active=!active; el('btnPower').classList.toggle('on',active); el('btnPower').textContent=active?'⏻ Desenergizar':'⚡ Energizar';
  const tg=caseTargets(caseKey); vTarget=active?tg.v:0; iTarget=active?tg.i:0; pTarget=active?tg.p:0;
  S.setCinematicIdle(active); refreshAll();
};
const sleep=ms=>new Promise(res=>setTimeout(res,ms));
let autoRunning=false;
async function runAuto(){
  if(autoRunning) return; autoRunning=true; const btn=el('btnAuto'); if(btn) btn.disabled=true;
  if(!active && caseKey!=='circuitoEquivalente'){ el('btnPower').click(); await sleep(1200); }
  if(caseKey==='ensayoDC') showToast('Con el motor desenergizado, mide Rll con el óhmetro y calcula R1.',2600);
  else if(caseKey==='rotorBloqueado') showToast('Rotor trabado: aplica tensión reducida a frecuencia reducida y lee V/I/P.',2600);
  else if(caseKey==='ensayoVacio') showToast('Motor girando libre: lee V/I/P sin carga en el eje.',2600);
  else showToast('Observa el circuito en T ensamblado y la curva par-deslizamiento resultante.',2600);
  await sleep(1600);
  refreshQuestion();
  const okIdx=currentQ.opciones.findIndex(o=>o.ok);
  await sleep(900);
  const btns=[...el('dxbtns').children]; if(btns[okIdx]) btns[okIdx].click();
  if(btn) btn.disabled=false; autoRunning=false;
}
el('btnAuto').onclick=()=>runAuto();
const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{ const on=synth.toggle(); soundBtn.textContent=on?'🔊':'🔇'; soundBtn.classList.toggle('on',on); };

/* ---------- animación ---------- */
S.setAnimate((dt,t)=>{
  simT=t;
  const rate=Math.min(1,dt*4);
  vVal+=(vTarget-vVal)*rate; iVal+=(iTarget-iVal)*rate; pVal+=(pTarget-pVal)*rate;
  if(active && caseKey==='ensayoVacio' && pulleyG){ pulleyG.rotation.x+=dt*10; motGiro+=dt*10; motMaq.userData.gira(motGiro); }
  if((!active || caseKey==='rotorBloqueado' || caseKey==='ensayoDC') && pulleyG){ /* sin giro */ }
  if(t-((S.__lastDraw)||0)>0.09){ S.__lastDraw=t; drawBoard(); refreshBench(); }
});
S.start();

setCase('ensayoDC');

window.__labDebug={
  caseKey:()=>caseKey,
  setCase,
  active:()=>active,
  dcStats,
  vacioStats,
  rotorBloqueadoStats,
  circuitoStats,
  torqueAt:(s)=>torqueAt(s,CIR),
  torqueCurvePoints:()=>torqueCurvePoints(CIR),
  currentQuiz:()=>currentQ,
  answer,
  boardClick,
};
