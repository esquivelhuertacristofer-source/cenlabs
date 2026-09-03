/* ============================================================
   LAB — Frenado Dinámico, Regenerativo y a Contracorriente
   Dominio: D5 Máquinas eléctricas · Molde: S+P (esquemático + panel)
   Física: balance de energía de tres familias de frenado eléctrico
   que detienen un motor más rápido que la fricción sola, partiendo
   todas de la misma energía cinética inicial E_k=½Jω₀².

   Cerrado en forma exacta (derivado analíticamente y verificado con
   node -e, no por muestreo aproximado):
     Dinámico:       E_disipada = E_k (100%, repartida entre R_ext y
                      R_a en proporción R_ext/(R_ext+R_a) y
                      R_a/(R_ext+R_a)); decaimiento EXACTO
                      ω(t)=ω₀·e^(-t/τ), τ=J(R_ext+R_a)/(kφ)²
                      (modelo de motor CD con freno dinámico: T(ω)=
                      (kφ)²ω/(R_ext+R_a), J·dω/dt=-T ⇒ exponencial).
     Regenerativo:    E_recuperada = η·E_k, E_perdida=(1-η)·E_k, con
                      η un parámetro de eficiencia de conversión
                      INSTANTÁNEA/ilustrativo (0.60–0.90). ⚑ La
                      energía neta recuperada en un ciclo real suele
                      ser MENOR (10–40%) porque no todo el frenado es
                      regenerativo y hay pérdidas adicionales en el
                      inversor y la red — esto se documenta como
                      advertencia explícita en el panel, no se oculta.
     Contracorriente: E_disipada = 3·E_k, caso IDEALIZADO sin carga
                      mecánica (resultado clásico de la teoría de
                      máquinas de inducción: durante el frenado el
                      deslizamiento recorre 2→1 en vez de 1→0 como en
                      un arranque normal, así que tanto la energía
                      cinética del rotor como la energía eléctrica
                      que sigue entrando desde la red terminan como
                      calor). Con carga mecánica real el rango típico
                      citado es 2–3× (no exactamente 3×) — también
                      documentado como advertencia.

   ⚑ J=0.6 kg·m², R_a=0.3 Ω y kφ=1.2 V·s/rad son valores
   ilustrativos de catálogo típico de un motor-volante industrial
   mediano, no de una máquina real verificada. Los multiplicadores
   de corriente pico (dinámico ≈1.5×, regenerativo ≈1.2×,
   contracorriente ≈6×) son ILUSTRATIVOS, representativos del rango
   500–800% de corriente de rotor bloqueado citado en NEMA MG-1 para
   motores de inducción Diseño B — no de una máquina real verificada.
   NO modela: la dinámica de par real de los frenados regenerativo y
   a contracorriente (curva par-deslizamiento derivada), saturación
   magnética, inercia de carga variable, ni el comportamiento
   transitorio real del inversor de red. Sin norma ancla en la lista
   maestra — ver ficha técnica para referencias tangenciales.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[6.6,4.6,8.4],target:[0.3,1.2,0],bgTop:'#0b1520',bgBot:'#03070a',bloom:0.35,minD:4,maxD:16});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2200,Q:0.7});

/* ---------- §1 Modelo físico ---------- */
const J=0.6;                       // ⚑ kg·m², inercia motor+volante ilustrativa
const Ra=0.3;                      // ⚑ Ω, resistencia interna de armadura ilustrativa
const KPHI=1.2;                    // ⚑ V·s/rad, constante de máquina ilustrativa
const CONTRA_MULT=3;               // caso ideal sin carga, forma cerrada
const IPICO_DINAMICO=1.5, IPICO_REGEN=1.2, IPICO_CONTRA=6; // ⚑ múltiplos ilustrativos
const RPM_MIN=500, RPM_MAX=3000;
const REXT_MIN=0.5, REXT_MAX=5;
const ETA_MIN=0.6, ETA_MAX=0.9;

function radPerS(rpmVal){ return rpmVal*2*Math.PI/60; }
function Ek(rpmVal){ const w=radPerS(rpmVal); return 0.5*J*w*w; }
function dinamico(rpmVal,Rext){
  const w=radPerS(rpmVal);
  const tau=J*(Rext+Ra)/(KPHI*KPHI);
  const t95=tau*Math.log(20);
  const T0=KPHI*KPHI*w/(Rext+Ra);
  const fracExt=Rext/(Rext+Ra), fracInt=Ra/(Rext+Ra);
  const E=Ek(rpmVal);
  return {w,tau,t95,T0,fracExt,fracInt,E,Eext:E*fracExt,Eint:E*fracInt};
}
function regen(rpmVal,etaVal){ const E=Ek(rpmVal); return {E,Erec:E*etaVal,Eperd:E*(1-etaVal)}; }
function contra(rpmVal){ const E=Ek(rpmVal); return {E,Edis:CONTRA_MULT*E}; }
function omegaT(rpmVal,Rext,t){ const w0=radPerS(rpmVal); const tau=J*(Rext+Ra)/(KPHI*KPHI); return w0*Math.exp(-t/tau); }

/* ---------- §2 Estado ---------- */
let mode='explora', tipo='dinamico';
let rpm0=1800, rext=2, eta=0.75;
let MYST=null, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false, simRunning=false;

function genMystery(){
  const r=Math.random();
  const rr50=(lo,hi)=>Math.round((lo+Math.random()*(hi-lo))/50)*50;
  if(r<1/3){
    const rpmv=rr50(800,2600);
    const rextv=Math.round((0.8+Math.random()*3.7)*10)/10;
    const E=Ek(rpmv), fracExt=rextv/(rextv+Ra);
    const target=Math.round(E*fracExt*10)/10;
    MYST={kind:'dinamicoExt',rpm:rpmv,rext:rextv,target,tol:Math.max(15,target*0.03)};
  } else if(r<2/3){
    const rpmv=rr50(800,2600);
    const etav=Math.round((0.6+Math.random()*0.3)*20)/20;
    const E=Ek(rpmv);
    const target=Math.round(E*etav*10)/10;
    MYST={kind:'regenRecuperada',rpm:rpmv,eta:etav,target,tol:Math.max(15,target*0.03)};
  } else {
    const rpmv=rr50(800,2600);
    const E=Ek(rpmv);
    const target=Math.round(E*CONTRA_MULT*10)/10;
    MYST={kind:'contracorrienteEnergia',rpm:rpmv,target,tol:Math.max(30,target*0.03)};
  }
  retoSolved=false; retoMsg='';
}

/* ---------- §3 Materiales ---------- */
const std=o=>new THREE.MeshStandardMaterial(o);
const MAT={
  frame:std({color:0x1c2a33,metalness:0.6,roughness:0.4}),
  board:std({color:0x0c141a,metalness:0.1,roughness:0.9}),
  bench:std({color:0x14202a,metalness:0.3,roughness:0.7}),
  bus:std({color:0xffb703,metalness:0.8,roughness:0.3,emissive:0x3a2600,emissiveIntensity:0.3}),
  motorBody:std({color:0x2c3e46,metalness:0.7,roughness:0.35}),
  motorEnd:std({color:0x40555f,metalness:0.7,roughness:0.3}),
  shaft:std({color:0xb9c4c9,metalness:0.9,roughness:0.2}),
  flywheel:std({color:0x35505c,metalness:0.75,roughness:0.3}),
  resBody:std({color:0x4a3320,metalness:0.4,roughness:0.6,emissive:0x2a1000,emissiveIntensity:0.25}),
  resFin:std({color:0x6b4a2a,metalness:0.5,roughness:0.5}),
  gridBody:std({color:0x1a3a42,metalness:0.5,roughness:0.5,emissive:0x0d3a3a,emissiveIntensity:0.25}),
  contBody:std({color:0x3a1e1e,metalness:0.45,roughness:0.55,emissive:0x3a0d0d,emissiveIntensity:0.25}),
  panelBody:std({color:0x101a20,metalness:0.4,roughness:0.6}),
  cable:std({color:0x1a1a1a,metalness:0.2,roughness:0.8}),
};
const TIPO_COLOR={dinamico:'#ff9f5c',regenerativo:'#4fd1c5',contracorriente:'#ff6b6b'};
const TIPO_NOMBRE={dinamico:'Dinámico',regenerativo:'Regenerativo',contracorriente:'A contracorriente'};

/* ---------- §4 Pizarrón ---------- */
const bCv=document.createElement('canvas'); bCv.width=1024; bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv);

function line(c,x1,y1,x2,y2,col,w,dash){
  c.strokeStyle=col; c.lineWidth=w||1.5; c.setLineDash(dash||[]);
  c.beginPath(); c.moveTo(x1,y1); c.lineTo(x2,y2); c.stroke(); c.setLineDash([]);
}
function rr(c,x,y,w,h,r,fill,stroke,lw){
  c.beginPath(); c.roundRect(x,y,w,h,r);
  if(fill){ c.fillStyle=fill; c.fill(); }
  if(stroke){ c.strokeStyle=stroke; c.lineWidth=lw||1.5; c.stroke(); }
}

function drawSchematic(c,tipoActivo){
  const mx=210,my=150;
  c.beginPath(); c.arc(mx,my,42,0,Math.PI*2); c.fillStyle='#16232a'; c.fill(); c.strokeStyle='#8ab4f8'; c.lineWidth=2.5; c.stroke();
  c.fillStyle='#eaf4f1'; c.font='bold 18px system-ui'; c.textAlign='center'; c.fillText('M',mx,my+7);
  c.font='13px system-ui'; c.fillStyle='#9fb'; c.fillText('motor + volante',mx,my+62);
  c.fillText(`ω₀=${rpm0} rpm`,mx,my+80);

  const boxes=[
    {key:'dinamico',x:470,y:90,w:150,h:60,label:'BANCO R_ext',sub:'frenado dinámico'},
    {key:'regenerativo',x:470,y:190,w:150,h:60,label:'INVERSOR → RED',sub:'frenado regenerativo'},
    {key:'contracorriente',x:470,y:290,w:150,h:60,label:'CONTACTORES INV.',sub:'a contracorriente'},
  ];
  boxes.forEach(b=>{
    const on=b.key===tipoActivo;
    const col=TIPO_COLOR[b.key];
    line(c,mx+42,my,b.x,b.y+b.h/2,on?col:'#33454e',on?2.4:1.4,on?[]:[4,3]);
    rr(c,b.x,b.y,b.w,b.h,8,on?'#152025':'#0d161c',on?col:'#33454e',on?2:1.2);
    c.fillStyle=on?'#eaf4f1':'#5a6a72'; c.font='bold 14px system-ui'; c.textAlign='center';
    c.fillText(b.label,b.x+b.w/2,b.y+26);
    c.font='11px system-ui'; c.fillStyle=on?col:'#4a5a62';
    c.fillText(b.sub,b.x+b.w/2,b.y+44);
  });

  const active=boxes.find(b=>b.key===tipoActivo);
  const heatX=760,heatY=my; const recX=760,recY=my-60;
  line(c,active.x+active.w,active.y+active.h/2,heatX-6,heatY,TIPO_COLOR[tipoActivo],2.2);
  c.beginPath(); c.arc(heatX+18,heatY,26,0,Math.PI*2); c.fillStyle='#1a1210'; c.fill(); c.strokeStyle='#ff9f5c'; c.lineWidth=2; c.stroke();
  c.font='18px system-ui'; c.fillStyle='#ff9f5c'; c.textAlign='center'; c.fillText('🔥',heatX+18,heatY+7);
  c.font='12px system-ui'; c.fillStyle='#9fb'; c.fillText('calor',heatX+18,heatY+42);

  const showRec=(tipoActivo==='regenerativo');
  line(c,active.x+active.w,active.y+active.h/2,recX-6,recY,showRec?TIPO_COLOR.regenerativo:'#33454e',showRec?2.2:1.2,showRec?[]:[3,3]);
  c.beginPath(); c.arc(recX+18,recY,26,0,Math.PI*2); c.fillStyle=showRec?'#0d2a28':'#101718'; c.fill(); c.strokeStyle=showRec?'#4fd1c5':'#33454e'; c.lineWidth=2; c.stroke();
  c.font='18px system-ui'; c.fillStyle=showRec?'#4fd1c5':'#3a4a52'; c.textAlign='center'; c.fillText('🔋',recX+18,recY+7);
  c.font='12px system-ui'; c.fillStyle=showRec?'#9fb':'#3a4a52'; c.fillText(showRec?'recuperada':'sin recuperación',recX+18,recY+42);
}

function drawEnergyBars(c,x0,y0,w,h,Ekv,groups,scaleMax){
  const padTop=34,padBottom=44,padSide=16;
  const plotH=h-padTop-padBottom;
  const y100=y0+padTop+plotH*(1-1/scaleMax);
  line(c,x0+padSide,y100,x0+w-padSide,y100,'#ffffff55',1.4,[4,3]);
  c.fillStyle='#8aa'; c.font='11px system-ui'; c.textAlign='left';
  c.fillText('100% de E_k',x0+padSide+4,y100-6);
  if(scaleMax>1.5){
    const y300=y0+padTop+plotH*(1-3/scaleMax);
    line(c,x0+padSide,y300,x0+w-padSide,y300,'#ffffff33',1.2,[3,3]);
    c.fillText('300% de E_k',x0+padSide+4,y300-6);
  }
  const gap=(w-2*padSide)/groups.length;
  const barW=Math.min(76,gap*0.55);
  groups.forEach((g,i)=>{
    const cx=x0+padSide+gap*i+gap/2;
    let acc=0;
    g.segments.forEach(seg=>{
      const frac0=acc/(Ekv*scaleMax), frac1=(acc+seg.val)/(Ekv*scaleMax);
      const by0=y0+padTop+plotH*(1-frac1), by1=y0+padTop+plotH*(1-frac0);
      rr(c,cx-barW/2,by0,barW,by1-by0,4,seg.color,null);
      acc+=seg.val;
    });
    const topY=y0+padTop+plotH*(1-Math.min(scaleMax,acc/Ekv)/scaleMax);
    c.fillStyle='#eaf4f1'; c.font='bold 12px system-ui'; c.textAlign='center';
    c.fillText(acc.toFixed(0)+' J',cx,topY-20);
    c.fillText((acc/Ekv*100).toFixed(0)+'%',cx,topY-6);
    c.fillStyle='#9ab'; c.font='12px system-ui';
    c.fillText(g.label,cx,y0+padTop+plotH+22);
  });
}

function drawOmegaCurve(c,x0,y0,w,h,rpmv,Rext){
  const {tau,t95}=dinamico(rpmv,Rext);
  const w0=radPerS(rpmv);
  const padL=52,padR=18,padT=24,padB=34;
  const px0=x0+padL, px1=x0+w-padR, py0=y0+padT, py1=y0+h-padB;
  const tmax=t95*1.15;
  line(c,px0,py0,px0,py1,'#33454e',1.4);
  line(c,px0,py1,px1,py1,'#33454e',1.4);
  c.fillStyle='#9ab'; c.font='12px system-ui'; c.textAlign='center';
  c.fillText('t (s)',(px0+px1)/2,py1+26);
  c.save(); c.translate(x0+14,(py0+py1)/2); c.rotate(-Math.PI/2);
  c.fillText('ω (rad/s)',0,0); c.restore();
  c.strokeStyle='#ff9f5c'; c.lineWidth=2.6; c.beginPath();
  for(let i=0;i<=200;i++){
    const t=tmax*i/200;
    const w=omegaT(rpmv,Rext,t);
    const px=px0+(t/tmax)*(px1-px0);
    const py=py1-(w/w0)*(py1-py0);
    i===0?c.moveTo(px,py):c.lineTo(px,py);
  }
  c.stroke();
  const px95=px0+(t95/tmax)*(px1-px0);
  line(c,px95,py0,px95,py1,'#ffd39955',1.2,[3,3]);
  c.fillStyle='#ffd399'; c.font='11px system-ui'; c.textAlign='left';
  c.fillText(`t₉₅≈${t95.toFixed(2)}s`,px95+5,py0+12);
  c.fillStyle='#6a8088'; c.font='11px system-ui'; c.textAlign='right';
  c.fillText(w0.toFixed(0),px0-6,py0+10);
  c.fillText('0',px0-6,py1+4);
}

function drawIpicoBar(c,x0,y0,w,h,items){
  const padL=110,padR=20,padT=26,padB=30;
  const px0=x0+padL, px1=x0+w-padR, py0=y0+padT;
  const maxMult=8;
  c.fillStyle='#9ab'; c.font='12px system-ui'; c.textAlign='left';
  c.fillText('Corriente pico relativa (× corriente nominal, ilustrativa ⚑)',x0+6,y0+14);
  const rowH=(h-padT-padB)/items.length;
  items.forEach((it,i)=>{
    const cy=py0+rowH*i+rowH*0.5;
    c.fillStyle='#9ab'; c.font='12px system-ui'; c.textAlign='right';
    c.fillText(it.label,px0-10,cy+4);
    const bw=(Math.min(maxMult,it.mult)/maxMult)*(px1-px0);
    rr(c,px0,cy-9,bw,18,4,it.color,null);
    c.fillStyle='#eaf4f1'; c.font='bold 12px system-ui'; c.textAlign='left';
    c.fillText(it.mult.toFixed(1)+'×',px0+bw+8,cy+4);
  });
  const px1x=px0+(1/maxMult)*(px1-px0);
  line(c,px1x,py0-6,px1x,py0+rowH*items.length,'#ffffff55',1.2,[3,3]);
  c.fillStyle='#8aa'; c.font='10px system-ui'; c.textAlign='center';
  c.fillText('1× (arranque normal)',px1x,py0-10);
}

function drawBoard(){
  bCx.fillStyle='#0a1116'; bCx.fillRect(0,0,1024,768);
  rr(bCx,4,4,1016,760,14,null,'#22323b',2);

  bCx.fillStyle='#eaf4f1'; bCx.font='bold 26px system-ui'; bCx.textAlign='left';
  bCx.fillText('Frenado Eléctrico — Dinámico · Regenerativo · Contracorriente',36,44);

  if(mode==='reto'){
    rr(bCx,650,14,350,38,8,retoSolved?'#123a2a':'#3a1f12',retoSolved?'#4fd1c5':'#e0a35c',1.5);
    bCx.fillStyle=retoSolved?'#8ff0d0':'#ffcf8a'; bCx.font='bold 14px system-ui'; bCx.textAlign='center';
    bCx.fillText(retoSolved?'✔ RETO RESUELTO':'🎯 RETO: dato desconocido',825,38);
  }

  const tipoMostrado=(mode==='reto'&&MYST)?({dinamicoExt:'dinamico',regenRecuperada:'regenerativo',contracorrienteEnergia:'contracorriente'})[MYST.kind]:tipo;
  drawSchematic(bCx,mode==='comparar'?tipo:tipoMostrado);

  bCx.font='13px system-ui'; bCx.fillStyle='#8aa'; bCx.textAlign='left';
  bCx.fillText('E_k=½Jω₀²   Dinámico: E_dis=E_k, τ=J(R_ext+R_a)/(kφ)²   Regenerativo: E_rec=η·E_k   Contracorriente: E_dis≈3·E_k (ideal)',36,352);

  const Ekv=Ek(rpm0);
  const leftX=40,leftY=372,leftW=430,leftH=360;
  const rightX=534,rightY=372,rightW=450,rightH=360;
  rr(bCx,leftX,leftY,leftW,leftH,10,'#0d161c','#22323b',1.5);
  rr(bCx,rightX,rightY,rightW,rightH,10,'#0d161c','#22323b',1.5);

  const hideDinExt=(mode==='reto'&&MYST&&MYST.kind==='dinamicoExt'&&!retoSolved);
  const hideRegen=(mode==='reto'&&MYST&&MYST.kind==='regenRecuperada'&&!retoSolved);
  const hideContra=(mode==='reto'&&MYST&&MYST.kind==='contracorrienteEnergia'&&!retoSolved);

  if(mode==='comparar'){
    const d=dinamico(rpm0,rext), rg=regen(rpm0,eta);
    const groups=[
      {label:'Dinámico',segments:[{val:d.E,color:'#ff9f5c'}]},
      {label:'Regenerativo',segments:[{val:rg.Eperd,color:'#c97a3f'},{val:rg.Erec,color:'#4fd1c5'}]},
      {label:'Contracorriente',segments:[{val:CONTRA_MULT*Ekv,color:'#ff6b6b'}]},
    ];
    bCx.fillStyle='#eaf4f1'; bCx.font='bold 14px system-ui'; bCx.textAlign='left';
    bCx.fillText(`Comparación a ω₀=${rpm0} rpm (mismo E_k=${Ekv.toFixed(0)} J)`,leftX+14,leftY+22);
    drawEnergyBars(bCx,leftX,leftY+30,leftW,leftH-30,Ekv,groups,3.3);

    bCx.fillStyle='#eaf4f1'; bCx.font='bold 14px system-ui'; bCx.textAlign='left';
    bCx.fillText('Corriente pico y velocidad relativa de frenado',rightX+14,rightY+22);
    drawIpicoBar(bCx,rightX+6,rightY+40,rightW-12,150,[
      {label:'Dinámico',mult:IPICO_DINAMICO,color:'#ff9f5c'},
      {label:'Regenerativo',mult:IPICO_REGEN,color:'#4fd1c5'},
      {label:'Contracorriente',mult:IPICO_CONTRA,color:'#ff6b6b'},
    ]);
    bCx.font='12px system-ui'; bCx.fillStyle='#9ab'; bCx.textAlign='left';
    const notes=[
      'Contracorriente: el más rápido para detener la carga, pero el de mayor calor y corriente — exige relé anti-plugging.',
      'Dinámico: velocidad de frenado ajustable con R_ext; todo el calor queda en las resistencias, sin recuperación.',
      'Regenerativo: el más eficiente energéticamente cuando aplica, pero solo funciona mientras el rotor gira por arriba de la velocidad síncrona.',
    ];
    notes.forEach((t,i)=>bCx.fillText('• '+t,rightX+14,rightY+210+i*24));
  } else if(tipoMostrado==='dinamico'){
    bCx.fillStyle='#eaf4f1'; bCx.font='bold 14px system-ui'; bCx.textAlign='left';
    bCx.fillText('Balance de energía',leftX+14,leftY+22);
    if(hideDinExt){
      bCx.fillStyle='#ffcf8a'; bCx.font='italic 14px system-ui'; bCx.textAlign='center';
      bCx.fillText('Barra oculta — calcula E_ext a mano',leftX+leftW/2,leftY+leftH/2);
    } else {
      const d=dinamico(rpm0,rext);
      drawEnergyBars(bCx,leftX,leftY+30,leftW,leftH-30,Ekv,[
        {label:'En R_ext',segments:[{val:d.Eext,color:'#ff9f5c'}]},
        {label:'En R_a (motor)',segments:[{val:d.Eint,color:'#c97a3f'}]},
      ],1.05);
    }
    bCx.fillStyle='#eaf4f1'; bCx.font='bold 14px system-ui'; bCx.textAlign='left';
    bCx.fillText('Decaimiento exacto ω(t)=ω₀·e^(-t/τ)',rightX+14,rightY+22);
    drawOmegaCurve(bCx,rightX+6,rightY+34,rightW-12,leftH-40,rpm0,rext);
  } else if(tipoMostrado==='regenerativo'){
    bCx.fillStyle='#eaf4f1'; bCx.font='bold 14px system-ui'; bCx.textAlign='left';
    bCx.fillText('Balance de energía',leftX+14,leftY+22);
    if(hideRegen){
      bCx.fillStyle='#ffcf8a'; bCx.font='italic 14px system-ui'; bCx.textAlign='center';
      bCx.fillText('Barra oculta — calcula E_recuperada a mano',leftX+leftW/2,leftY+leftH/2);
    } else {
      const rg=regen(rpm0,eta);
      drawEnergyBars(bCx,leftX,leftY+30,leftW,leftH-30,Ekv,[
        {label:'Recuperada + perdida',segments:[{val:rg.Eperd,color:'#c97a3f'},{val:rg.Erec,color:'#4fd1c5'}]},
      ],1.05);
    }
    bCx.fillStyle='#eaf4f1'; bCx.font='bold 14px system-ui'; bCx.textAlign='left';
    bCx.fillText('⚠ η es una eficiencia INSTANTÁNEA ilustrativa',rightX+14,rightY+22);
    bCx.font='13px system-ui'; bCx.fillStyle='#9ab'; bCx.textAlign='left';
    const warn=[
      `η=${eta.toFixed(2)} representa la fracción de E_k convertida a energía eléctrica útil EN ESTE frenado.`,
      'En un ciclo real de trabajo, la energía neta recuperada suele ser bastante menor',
      '(≈10–40%): no todos los frenados son regenerativos, y hay pérdidas adicionales',
      'en el inversor y en la red que no están modeladas aquí.',
      '',
      'Además: en un motor de inducción, el frenado regenerativo solo entrega par',
      'mientras el rotor gira POR ARRIBA de la velocidad síncrona (deslizamiento',
      'negativo) — no puede, por sí solo, llevar la velocidad hasta cero.',
    ];
    warn.forEach((t,i)=>bCx.fillText(t,rightX+14,rightY+50+i*22));
  } else {
    bCx.fillStyle='#eaf4f1'; bCx.font='bold 14px system-ui'; bCx.textAlign='left';
    bCx.fillText('Balance de energía (caso ideal, sin carga)',leftX+14,leftY+22);
    if(hideContra){
      bCx.fillStyle='#ffcf8a'; bCx.font='italic 14px system-ui'; bCx.textAlign='center';
      bCx.fillText('Barra oculta — calcula E_disipada a mano',leftX+leftW/2,leftY+leftH/2);
    } else {
      const cd=contra(rpm0);
      drawEnergyBars(bCx,leftX,leftY+30,leftW,leftH-30,Ekv,[
        {label:'Dinámico (ref.)',segments:[{val:Ekv,color:'#ff9f5c'}]},
        {label:'Contracorriente',segments:[{val:cd.Edis,color:'#ff6b6b'}]},
      ],3.3);
    }
    bCx.fillStyle='#eaf4f1'; bCx.font='bold 14px system-ui'; bCx.textAlign='left';
    bCx.fillText('Corriente pico y protección',rightX+14,rightY+22);
    drawIpicoBar(bCx,rightX+6,rightY+40,rightW-12,110,[
      {label:'Dinámico',mult:IPICO_DINAMICO,color:'#ff9f5c'},
      {label:'Contracorriente',mult:IPICO_CONTRA,color:'#ff6b6b'},
    ]);
    bCx.font='13px system-ui'; bCx.fillStyle='#9ab'; bCx.textAlign='left';
    const warn=[
      'Requiere un relé de velocidad cero / anti-plugging: si el motor no se',
      'desconecta exactamente en ω=0, seguirá conectado con secuencia',
      'invertida y arrancará a girar en reversa.',
      'Con carga mecánica real, el calor disipado suele estar en el rango',
      '2–3× E_k (no exactamente 3×) — aquí se modela el caso ideal sin carga.',
    ];
    warn.forEach((t,i)=>bCx.fillText(t,rightX+14,rightY+220+i*22));
  }

  bTex.needsUpdate=true;
}

function boardClick(u,v){
  const px=u*1024, py=(1-v)*768;
  if(px>168&&px<252&&py>108&&py<192){
    showToast('El motor y su volante acumulan energía cinética E_k=½Jω₀² que hay que disipar o recuperar para detenerlos.');
    synth.beep(520,0.08,0.06); return;
  }
  if(mode==='explora'&&px>470&&px<620&&py>90&&py<350){
    if(py<150){ setTipo('dinamico'); }
    else if(py<250){ setTipo('regenerativo'); }
    else { setTipo('contracorriente'); }
    synth.beep(560,0.08,0.06); return;
  }
  showToast('Toca el motor-volante, uno de los tres bloques de frenado, o los paneles del pizarrón para explorar.');
  synth.beep(420,0.08,0.05);
}

/* ---------- §5 Banco 3D modesto ---------- */
function cable(pts,mat){
  const curve=new THREE.CatmullRomCurve3(pts);
  const geo=new THREE.TubeGeometry(curve,24,0.035,8,false);
  return new THREE.Mesh(geo,mat);
}
function makeDisplayBox(w,h,dp,cw,ch){
  const g=new THREE.Group();
  const body=roundedBox(w,h,dp,MAT.panelBody,0.05); g.add(body);
  const cv=document.createElement('canvas'); cv.width=cw; cv.height=ch;
  const cx=cv.getContext('2d');
  const tx=new THREE.CanvasTexture(cv);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*0.86,h*0.78),new THREE.MeshBasicMaterial({map:tx}));
  screen.position.set(0,0,dp/2+0.005);
  g.add(screen);
  return {g,cv,cx,tx};
}

const boardG=new THREE.Group();
const boardFrame=roundedBox(3.2,2.35,0.12,MAT.frame,0.06);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.0,2.15),new THREE.MeshBasicMaterial({map:bTex}));
board.position.z=0.07;
board.userData={title:'Tablero — balance de energía de los tres frenados'};
boardFrame.userData=board.userData;
boardG.add(boardFrame,board);
boardG.position.set(0.3,2.35,-1.55);
S.scene.add(boardG);

const benchG=new THREE.Group();
const mesa=roundedBox(6.6,0.28,3.0,MAT.bench,0.08);
mesa.position.set(0.3,0.85,0); mesa.receiveShadow=true;
benchG.add(mesa);

const busBar=new THREE.Mesh(new THREE.BoxGeometry(4.9,0.06,0.06),MAT.bus);
busBar.position.set(0.3,1.85,-0.8);
benchG.add(busBar);

// motor + volante
const motG=new THREE.Group();
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio:MAT.motorBody, acero:MAT.shaft, cromo:MAT.shaft, chapa:MAT.motorBody,
  cobre:std({color:0xb87333,roughness:0.35,metalness:0.75}),
  negro:std({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:std({color:0x14181e,roughness:0.80,metalness:0.02}),
  blanco:std({color:0xd7dee6,roughness:0.40,metalness:0.20}),
  ceramica:std({color:0xd7dee6,roughness:0.60,metalness:0.05}),
};
/* LA MAQUINA, con la silueta por la que se reconoce desde el otro lado del
   taller: ALETAS —la superficie por la que evacua lo que no convierte en par—,
   TAPA DEL VENTILADOR con su rejilla y el ventilador calado al eje, PATAS por
   donde se atornilla a la bancada, CAJA DE BORNES por donde entra la
   alimentacion y placa de datos. Ninguna de las cinco es decorativa, y ninguna
   estaba dibujada: era un tubo liso con un disco pegado en la punta. */
const maq=P3.maquinaElectrica(MATP,{d:0.80,largo:0.70,eje:0.42,aletas:14});
const flyG=new THREE.Group();
const flyDisc=new THREE.Mesh(new THREE.CylinderGeometry(0.34,0.34,0.1,28),MAT.flywheel);
flyDisc.rotation.z=Math.PI/2;
flyG.add(flyDisc);
for(let i=0;i<6;i++){
  const spoke=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.6),MAT.shaft);
  spoke.position.z=0; spoke.rotation.x=(i/6)*Math.PI*2;
  flyG.add(spoke);
}
flyG.position.x=0.55;
motG.add(maq,flyG);
motG.add(labelSprite('M+J','#8ab4f8'));
motG.position.set(-1.7,1.15,-0.05);
motG.userData={act:'mot3d',title:'Motor + volante de inercia (energía cinética a disipar)'};
maq.traverse(o=>{ if(o.isMesh) o.userData=motG.userData; });
benchG.add(motG);

// banco de resistencias (dinámico)
const resG=new THREE.Group();
const resBody=roundedBox(0.6,0.55,0.4,MAT.resBody,0.05);
resG.add(resBody);
for(let i=0;i<4;i++){
  const fin=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.5,10),MAT.resFin);
  fin.position.set(-0.2+i*0.13,0,0.25); fin.rotation.x=Math.PI/2;
  resG.add(fin);
}
resG.add(labelSprite('R_ext','#ff9f5c'));
resG.position.set(-0.35,1.3,-0.05);
resG.userData={act:'res3d',title:'Banco de resistencias externas (frenado dinámico)'};
resBody.userData=resG.userData;
benchG.add(resG);

// inversor a red (regenerativo)
const gridG=new THREE.Group();
const gridBody=roundedBox(0.6,0.6,0.4,MAT.gridBody,0.06);
gridG.add(gridBody);
gridG.add(labelSprite('RED','#4fd1c5'));
gridG.position.set(0.9,1.3,-0.05);
gridG.userData={act:'grid3d',title:'Inversor de regreso a la red (frenado regenerativo)'};
gridBody.userData=gridG.userData;
benchG.add(gridG);

// contactores de inversión (contracorriente)
const contG=new THREE.Group();
const cont1=roundedBox(0.32,0.5,0.35,MAT.contBody,0.05); cont1.position.x=-0.2;
const cont2=roundedBox(0.32,0.5,0.35,MAT.contBody,0.05); cont2.position.x=0.2;
contG.add(cont1,cont2);
contG.add(labelSprite('K1/K2','#ff6b6b'));
contG.position.set(2.15,1.28,-0.05);
contG.userData={act:'cont3d',title:'Contactores de inversión de fases (frenado a contracorriente)'};
cont1.userData=contG.userData; cont2.userData=contG.userData;
benchG.add(contG);

const panelD=makeDisplayBox(1.0,0.6,0.08,256,160);
panelD.g.position.set(-1.95,1.85,0.7);
panelD.g.userData={act:'paneld3d',title:'Display — tipo de frenado y ω₀'};
benchG.add(panelD.g);

const meter=makeDisplayBox(1.0,0.6,0.08,256,160);
meter.g.position.set(2.15,1.85,0.7);
meter.g.userData={act:'meter3d',title:'Medidor de energía disipada/recuperada'};
benchG.add(meter.g);

benchG.add(
  cable([new THREE.Vector3(-1.7,1.5,-0.05),new THREE.Vector3(-1.0,1.6,-0.4),new THREE.Vector3(-0.35,1.55,-0.05)],MAT.cable),
  cable([new THREE.Vector3(-1.7,1.5,-0.05),new THREE.Vector3(-0.3,1.7,-0.7),new THREE.Vector3(0.9,1.58,-0.05)],MAT.cable),
  cable([new THREE.Vector3(-1.7,1.5,-0.05),new THREE.Vector3(0.5,1.75,-0.8),new THREE.Vector3(2.15,1.52,-0.05)],MAT.cable),
);

benchG.traverse(o=>{ if(o.isMesh&&o!==board){ o.castShadow=true; o.receiveShadow=true; } });
S.scene.add(benchG);

function drawPanelD(){
  const c=panelD.cx;
  c.fillStyle='#0a1116'; c.fillRect(0,0,256,160);
  c.fillStyle='#6a8088'; c.font='13px system-ui'; c.textAlign='left';
  c.fillText('FRENADO',10,20);
  c.font='bold 20px system-ui'; c.fillStyle=TIPO_COLOR[tipo];
  c.fillText(TIPO_NOMBRE[tipo],10,58);
  c.font='13px system-ui'; c.fillStyle='#eaf4f1';
  c.fillText(`ω₀ = ${rpm0} rpm`,10,90);
  c.font='12px system-ui'; c.fillStyle='#7a9098';
  c.fillText(mode==='comparar'?'modo Comparar activo':`E_k = ${Ek(rpm0).toFixed(0)} J`,10,118);
  panelD.tx.needsUpdate=true;
}
function drawMeter3D(){
  const c=meter.cx;
  c.fillStyle='#0a1116'; c.fillRect(0,0,256,160);
  c.fillStyle='#6a8088'; c.font='13px system-ui'; c.textAlign='left';
  c.fillText('ENERGÍA',10,20);
  const hide=(mode==='reto'&&!retoSolved&&MYST);
  c.font='bold 18px system-ui';
  if(hide){
    c.fillStyle='#ffcf8a'; c.fillText('¿? J',10,58);
  } else if(tipo==='dinamico'){
    c.fillStyle='#eaf4f1'; c.fillText(`E_dis = ${Ek(rpm0).toFixed(0)} J`,10,58);
  } else if(tipo==='regenerativo'){
    c.fillStyle='#4fd1c5'; c.fillText(`E_rec = ${regen(rpm0,eta).Erec.toFixed(0)} J`,10,58);
  } else {
    c.fillStyle='#ff6b6b'; c.fillText(`E_dis = ${contra(rpm0).Edis.toFixed(0)} J`,10,58);
  }
  c.font='12px system-ui'; c.fillStyle='#7a9098';
  c.fillText(`100% E_k = ${Ek(rpm0).toFixed(0)} J`,10,90);
  meter.tx.needsUpdate=true;
}
function refreshBenchDyn(){
  drawPanelD(); drawMeter3D();
  ['res3d','grid3d','cont3d'].forEach((act,i)=>{
    const key=['dinamico','regenerativo','contracorriente'][i];
    const g=[resG,gridG,contG][i];
    const on=(tipo===key);
    g.traverse(o=>{ if(o.isMesh&&o.material&&o.material.emissiveIntensity!==undefined) o.material.emissiveIntensity=on?0.55:0.2; });
  });
}

/* ---------- §6 HUD + panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">D5 · Máquinas eléctricas — Frenado eléctrico</div>
  <h2>Frenado Dinámico, Regenerativo y a Contracorriente</h2>
  <p>Cuando un motor debe detenerse más rápido de lo que permite la fricción, se recurre al <b>frenado eléctrico</b>. Los tres métodos parten de la misma energía cinética inicial E_k=½Jω₀², pero difieren radicalmente en a dónde va esa energía.</p>
  <p>El <b>frenado dinámico</b> desconecta el motor de la red y lo conecta a un banco de resistencias: toda la energía cinética se convierte en calor. El <b>regenerativo</b> devuelve energía a la red a través del inversor — solo funciona mientras el rotor gira por arriba de la velocidad síncrona. El <b>a contracorriente</b> invierte dos fases de alimentación para frenar casi de inmediato, al costo de disipar mucho más calor y demandar una corriente pico muy alta.</p>
  <div class="formula">E_k=½Jω₀²<br>Dinámico: E_dis=E_k, τ=J(R_ext+R_a)/(kφ)²<br>Regenerativo: E_rec=η·E_k (η ilustrativo)<br>Contracorriente: E_dis≈3·E_k (caso ideal, sin carga)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#ff9f5c"></span>frenado dinámico (calor)</div>
    <div class="li"><span class="dot" style="background:#4fd1c5"></span>regenerativo (recuperada)</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>a contracorriente (calor)</div>
  </div>
  <div class="fid">
    <span class="ft">CONTRATO DE FIDELIDAD</span>
    <span class="fl">SÍ:</span> modela el balance energético EXACTO de los tres métodos a partir de E_k=½Jω₀² (forma cerrada), incluida la curva de decaimiento exponencial exacta ω(t)=ω₀e^(-t/τ) del frenado dinámico, el reparto de calor entre R_ext y R_a, y el resultado clásico de que el frenado a contracorriente idealizado sin carga disipa 3× la energía cinética inicial.
    <span class="no">NO:</span> la dinámica de par real (curva par-deslizamiento) de los frenados regenerativo y a contracorriente — usa una eficiencia η y multiplicadores de corriente ⚑ ilustrativos en su lugar; saturación magnética; inercia de carga variable; ni el comportamiento transitorio real del inversor de red.
  </div>
  <div class="src">Fitzgerald/Kingsley/Umans, "Electric Machinery"; Chapman, "Electric Machinery Fundamentals" (frenado dinámico y a contracorriente de máquinas de inducción y CD); Rockwell Automation DRIVES-WP007A-EN-P (comparación práctica de métodos de frenado); NEMA MG-1 §14.46/§18.224 (referencias tangenciales, sin norma ancla específica). La energía recuperada en el frenado regenerativo puede almacenarse en un banco de baterías como el de mecanica-8 — la relación es conceptual (destino de la energía), no una extensión directa del mismo motor.</div>
`;

document.getElementById('panel').innerHTML=`
  <h4>Frenado eléctrico · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">Explora</button>
    <button class="b" id="m_comparar">Comparar</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" class="mision"></div>

  <div class="modebar" id="tipobar">
    <button class="b on" id="tp_dinamico">⚡ Dinámico</button>
    <button class="b" id="tp_regen">🔋 Regenerativo</button>
    <button class="b" id="tp_contra">🔁 Contracorriente</button>
  </div>

  <label class="slabel">Velocidad inicial ω₀ (<b id="avRpm0">1800</b> rpm)
    <input type="range" id="sRpm0" min="${RPM_MIN}" max="${RPM_MAX}" step="50" value="1800">
  </label>
  <label class="slabel" id="lRext">Resistencia externa R_ext (<b id="avRext">2.0</b> Ω)
    <input type="range" id="sRext" min="${REXT_MIN}" max="${REXT_MAX}" step="0.1" value="2">
  </label>
  <label class="slabel" id="lEta">Eficiencia de recuperación η (<b id="avEta">0.75</b>)
    <input type="range" id="sEta" min="${ETA_MIN}" max="${ETA_MAX}" step="0.05" value="0.75">
  </label>

  <div id="tele">
    <div class="g"><span class="l">Tipo</span><b id="t_tipo">—</b></div>
    <div class="g"><span class="l">E_k inicial</span><b id="t_ek">—</b></div>
    <div class="g"><span class="l">E_disipada</span><b id="t_edis">—</b></div>
    <div class="g"><span class="l">E_recuperada</span><b id="t_erec">—</b></div>
    <div class="g"><span class="l">τ (dinámico)</span><b id="t_tau">—</b></div>
    <div class="g"><span class="l">t₉₅ (dinámico)</span><b id="t_t95">—</b></div>
  </div>

  <div class="console"><div id="report"></div></div>

  <div class="btns">
    <button class="b" id="btnSimular">▶ Simular frenado</button>
  </div>

  <div id="retoBox" style="display:none">
    <h4 class="sec">Tu respuesta</h4>
    <p id="retoHint" class="hint"></p>
    <div class="row">
      <input type="text" id="retoInput" placeholder="0.00">
      <span id="retoUnit" class="unit">J</span>
      <button class="b primary" id="btnCheck">Comprobar</button>
    </div>
    <span id="retoOut"></span>
  </div>

  <h4 class="sec">Pregunta de ingeniería</h4>
  <p id="q_text"></p>
  <div class="btns" id="dxbtns"></div>

  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado</button>
    <button class="b" id="btnNew">🔀 Nuevo caso misterioso</button>
  </div>
`;
const el=id=>document.getElementById(id);

/* ---------- §7 Toast ---------- */
let toastTimer=null;
function showToast(msg){ const t=el('toast'); t.textContent=msg; t.classList.add('on'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('on'),5200); }

/* ---------- §8 Modos ---------- */
const MODE_META={
  explora:{nombre:'Explora',cam:[[6.6,4.6,8.4],[0.3,1.2,0]],mision:'EXPLORA · elige un tipo de frenado, ajusta ω₀ y su parámetro (R_ext o η), y observa a dónde va la energía cinética.'},
  comparar:{nombre:'Comparar',cam:[[0.3,4.6,9.6],[0.3,1.4,-0.6]],mision:'COMPARA · los tres métodos lado a lado con la misma ω₀: calor disipado, energía recuperada y corriente pico relativa.'},
  reto:{nombre:'Reto',cam:[[2.0,3.6,7.4],[0.3,1.4,-0.2]],mision:'RETO · calcula a mano la energía pedida usando E_k=½Jω₀² y la fórmula del método correspondiente.'},
};
const KIND_TIPO={dinamicoExt:'dinamico',regenRecuperada:'regenerativo',contracorrienteEnergia:'contracorriente'};

function tolText(){ if(!MYST) return ''; return `± ${MYST.tol.toFixed(1)} J`; }

function syncTipoButtons(){
  ['tp_dinamico','tp_regen','tp_contra'].forEach(id=>el(id).classList.remove('on'));
  const hit={dinamico:'tp_dinamico',regenerativo:'tp_regen',contracorriente:'tp_contra'}[tipo];
  if(hit) el(hit).classList.add('on');
  el('lRext').style.display=(tipo==='dinamico')?'block':'none';
  el('lEta').style.display=(tipo==='regenerativo')?'block':'none';
}

function syncLocks(){
  const locked=(mode==='reto');
  el('sRpm0').disabled=locked;
  el('sRext').disabled=locked;
  el('sEta').disabled=locked;
  ['tp_dinamico','tp_regen','tp_contra'].forEach(id=>el(id).disabled=locked||mode==='comparar');
  el('tipobar').style.display=(mode==='comparar')?'none':'flex';
}

function setTipo(k){
  if(mode==='reto'||mode==='comparar') return;
  tipo=k; syncTipoButtons(); clearDx(); refreshQuestion(); refreshAll();
}

function setMode(k){
  mode=k; solved=false;
  ['m_explora','m_comparar','m_reto'].forEach(id=>el(id).classList.toggle('on',id==='m_'+k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('p_mision').textContent=MODE_META[k].mision;
  el('retoBox').style.display=(k==='reto')?'block':'none';

  if(k==='reto'){
    if(!MYST) genMystery();
    tipo=KIND_TIPO[MYST.kind];
    rpm0=MYST.rpm; el('sRpm0').value=rpm0; el('avRpm0').textContent=rpm0;
    if(MYST.kind==='dinamicoExt'){
      rext=MYST.rext; el('sRext').value=rext; el('avRext').textContent=rext.toFixed(1);
      el('retoHint').textContent=`Con ω₀=${MYST.rpm} rpm y R_ext=${MYST.rext} Ω fijos (R_a=${Ra} Ω, J=${J} kg·m² conocidos), calcula la energía disipada específicamente en la resistencia externa durante el frenado dinámico. Usa E_k=½Jω₀² (ω₀ en rad/s) y E_ext=E_k·R_ext/(R_ext+R_a).`;
    } else if(MYST.kind==='regenRecuperada'){
      eta=MYST.eta; el('sEta').value=eta; el('avEta').textContent=eta.toFixed(2);
      el('retoHint').textContent=`Con ω₀=${MYST.rpm} rpm y una eficiencia de conversión η=${MYST.eta} (ilustrativa) fijas, calcula la energía recuperada hacia la red durante el frenado regenerativo. Usa E_k=½Jω₀² y E_recuperada=η·E_k.`;
    } else {
      el('retoHint').textContent=`Con ω₀=${MYST.rpm} rpm, calcula la energía TOTAL disipada como calor durante un frenado a contracorriente idealizado (sin carga mecánica) — tres veces la energía cinética inicial. Usa E_k=½Jω₀² y E_disipada=3·E_k.`;
    }
    el('retoUnit').textContent='J';
  }
  syncTipoButtons(); syncLocks(); clearDx(); refreshQuestion(); refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}

function setRpm0(v){
  if(mode==='reto') return;
  rpm0=Math.max(RPM_MIN,Math.min(RPM_MAX,v));
  el('sRpm0').value=rpm0; el('avRpm0').textContent=rpm0.toFixed(0);
  refreshAll();
}
function setRext(v){
  if(mode==='reto') return;
  rext=Math.max(REXT_MIN,Math.min(REXT_MAX,v));
  el('sRext').value=rext; el('avRext').textContent=rext.toFixed(1);
  refreshAll();
}
function setEta(v){
  if(mode==='reto') return;
  eta=Math.max(ETA_MIN,Math.min(ETA_MAX,v));
  el('sEta').value=eta; el('avEta').textContent=eta.toFixed(2);
  refreshAll();
}

/* ---------- §9 Telemetría + reporte ---------- */
function set(id,txt,cls){ const n=el(id); n.textContent=txt; n.classList.remove('good','warn','bad'); if(cls) n.classList.add(cls); }

function updateTele(){
  const hide=(mode==='reto'&&MYST&&!retoSolved);
  const Ekv=Ek(rpm0);
  set('t_tipo',TIPO_NOMBRE[tipo]);
  set('t_ek',Ekv.toFixed(0)+' J');
  if(hide){
    set('t_edis','¿?','warn'); set('t_erec','¿?','warn'); set('t_tau','—'); set('t_t95','—');
    return;
  }
  if(tipo==='dinamico'){
    const d=dinamico(rpm0,rext);
    set('t_edis',d.E.toFixed(0)+' J');
    set('t_erec','0 J');
    set('t_tau',d.tau.toFixed(3)+' s');
    set('t_t95',d.t95.toFixed(2)+' s');
  } else if(tipo==='regenerativo'){
    const rg=regen(rpm0,eta);
    set('t_edis',rg.Eperd.toFixed(0)+' J');
    set('t_erec',rg.Erec.toFixed(0)+' J','good');
    set('t_tau','—'); set('t_t95','—');
  } else {
    const cd=contra(rpm0);
    set('t_edis',cd.Edis.toFixed(0)+' J','bad');
    set('t_erec','0 J');
    set('t_tau','—'); set('t_t95','—');
  }
}

function updateReport(){
  const L=[];
  const Ekv=Ek(rpm0);
  if(mode==='explora'){
    if(tipo==='dinamico'){
      const d=dinamico(rpm0,rext);
      L.push(`ω₀=<b>${rpm0} rpm</b>, R_ext=<b>${rext.toFixed(1)} Ω</b> → E_k=${Ekv.toFixed(0)} J, toda disipada como calor: ${d.Eext.toFixed(0)} J en R_ext (${(d.fracExt*100).toFixed(0)}%) y ${d.Eint.toFixed(0)} J en la resistencia interna del motor (${(d.fracInt*100).toFixed(0)}%).`);
      L.push(`Decae exponencialmente con τ=${d.tau.toFixed(3)} s — a mayor R_ext, más rápido frena pero más calor queda en las resistencias externas (más fácil de disipar sin dañar el motor).`);
    } else if(tipo==='regenerativo'){
      const rg=regen(rpm0,eta);
      L.push(`ω₀=<b>${rpm0} rpm</b>, η=<b>${eta.toFixed(2)}</b> → de E_k=${Ekv.toFixed(0)} J se recuperan ${rg.Erec.toFixed(0)} J (${(eta*100).toFixed(0)}%) hacia la red y se pierden ${rg.Eperd.toFixed(0)} J (${((1-eta)*100).toFixed(0)}%).`);
      L.push('Recuerda: η aquí es instantánea/ilustrativa — la recuperación neta real en un ciclo de trabajo suele ser menor.');
    } else {
      const cd=contra(rpm0);
      L.push(`ω₀=<b>${rpm0} rpm</b> → E_k=${Ekv.toFixed(0)} J, pero el frenado a contracorriente idealizado disipa ${cd.Edis.toFixed(0)} J (3× E_k) — casi el triple que el dinámico equivalente.`);
      L.push('Es el más rápido de los tres, pero exige protección térmica y de sobrecorriente adicional, y un relé anti-plugging.');
    }
  } else if(mode==='comparar'){
    const d=dinamico(rpm0,rext), rg=regen(rpm0,eta), cd=contra(rpm0);
    L.push(`A ω₀=${rpm0} rpm (E_k=${Ekv.toFixed(0)} J): dinámico disipa ${d.E.toFixed(0)} J (100%); regenerativo recupera ${rg.Erec.toFixed(0)} J y pierde ${rg.Eperd.toFixed(0)} J; contracorriente disipa ${cd.Edis.toFixed(0)} J (${CONTRA_MULT*100}%).`);
    L.push('El contracorriente es el más rápido pero el más agresivo en calor y corriente; el regenerativo es el más eficiente cuando aplica; el dinámico es el más simple y controlable vía R_ext.');
  } else {
    if(MYST.kind==='dinamicoExt'){
      L.push(`Reto: con ω₀=${MYST.rpm} rpm y R_ext=${MYST.rext} Ω, calcula la energía disipada en R_ext.`);
    } else if(MYST.kind==='regenRecuperada'){
      L.push(`Reto: con ω₀=${MYST.rpm} rpm y η=${MYST.eta}, calcula la energía recuperada.`);
    } else {
      L.push(`Reto: con ω₀=${MYST.rpm} rpm, calcula la energía total disipada en un frenado a contracorriente ideal.`);
    }
    L.push(retoSolved?`<span class="ok">${retoMsg}</span>`:'Escribe tu resultado en J y comprueba.');
  }
  el('report').innerHTML=L.map(s=>'<div>'+s+'</div>').join('');
}

function refreshAll(){ drawBoard(); updateTele(); updateReport(); refreshBenchDyn(); }

/* ---------- §10 Reto ---------- */
function checkReto(){
  if(!MYST) return;
  const v=parseFloat(el('retoInput').value.replace(',','.'));
  if(!isFinite(v)){
    el('retoOut').innerHTML='<span class="dtc">Escribe un número.</span>'; return;
  }
  const ok=Math.abs(v-MYST.target)<=MYST.tol;
  if(ok){
    if(MYST.kind==='dinamicoExt'){
      const d=dinamico(MYST.rpm,MYST.rext);
      retoMsg=`E_k=½×${J}×(${MYST.rpm}×2π/60)²=${d.E.toFixed(1)} J. Fracción en R_ext=${MYST.rext}/(${MYST.rext}+${Ra})=${d.fracExt.toFixed(4)}. E_ext=${d.E.toFixed(1)}×${d.fracExt.toFixed(4)}=${MYST.target.toFixed(1)} J.`;
    } else if(MYST.kind==='regenRecuperada'){
      const E=Ek(MYST.rpm);
      retoMsg=`E_k=½×${J}×(${MYST.rpm}×2π/60)²=${E.toFixed(1)} J. E_recuperada=${MYST.eta}×${E.toFixed(1)}=${MYST.target.toFixed(1)} J.`;
    } else {
      const E=Ek(MYST.rpm);
      retoMsg=`E_k=½×${J}×(${MYST.rpm}×2π/60)²=${E.toFixed(1)} J. E_disipada=3×${E.toFixed(1)}=${MYST.target.toFixed(1)} J — casi el triple del calor de un frenado dinámico equivalente.`;
    }
    retoSolved=true; solved=true;
    el('retoOut').innerHTML=`<span class="ok">✔ ¡Correcto! (tolerancia ${tolText()})</span>`;
    synth.beep(880,.1,.08); setTimeout(()=>synth.beep(1175,.15,.08),140);
  } else {
    retoMsg='';
    el('retoOut').innerHTML=`<span class="dtc">✘ Aún no. Tolerancia: ${tolText()}</span>`;
    synth.beep(180,.12,.08);
  }
  refreshAll();
}

function newMystery(){
  genMystery();
  el('retoInput').value=''; el('retoOut').innerHTML='';
  buildQuiz();
  setMode('reto');
  const label={dinamicoExt:`E_ext con ω₀=${MYST.rpm} rpm, R_ext=${MYST.rext} Ω`,regenRecuperada:`E_recuperada con ω₀=${MYST.rpm} rpm, η=${MYST.eta}`,contracorrienteEnergia:`E_disipada (contracorriente) con ω₀=${MYST.rpm} rpm`}[MYST.kind];
  showToast(`Nuevo caso: calcula ${label}.`);
}

/* ---------- §11 Quiz ---------- */
function shuffle(arr){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
let QUIZ={};
function buildQuiz(){
  QUIZ.explora={
    pregunta:'¿Cuál de los tres métodos de frenado eléctrico permite recuperar energía en vez de disiparla toda como calor?',
    opciones:shuffle([
      {t:'El regenerativo — devuelve energía a la red a través del inversor',ok:true,why:'Correcto: en el regenerativo, mientras el rotor gira por arriba de la velocidad síncrona, el motor actúa como generador y entrega energía de vuelta a la red.'},
      {t:'El dinámico — toda la energía cinética se disipa en las resistencias',ok:false,why:'El dinámico disipa el 100% de E_k como calor en las resistencias; no recupera nada hacia la red.'},
      {t:'El a contracorriente — disipa incluso más calor que el dinámico',ok:false,why:'El a contracorriente disipa aproximadamente 3× la energía cinética inicial como calor, más que el dinámico, no menos.'},
      {t:'Los tres recuperan energía por igual',ok:false,why:'No: solo el regenerativo tiene una ruta de retorno de energía a la red; los otros dos disipan toda la energía como calor.'},
    ]),
  };
  QUIZ.comparar={
    pregunta:'¿Por qué el frenado a contracorriente genera tanto calor (≈3×E_k) comparado con el dinámico (1×E_k), en el caso ideal sin carga?',
    opciones:shuffle([
      {t:'Porque la energía eléctrica que sigue entrando desde la red durante el frenado se suma a la energía cinética del rotor, y ambas terminan como calor',ok:true,why:'Correcto: al invertir la secuencia, el campo del entrehierro gira en sentido contrario al rotor — la potencia eléctrica de la red y la energía cinética del rotor se convierten juntas en calor, en vez de solo la cinética como en el dinámico.'},
      {t:'Porque la resistencia del rotor es tres veces mayor en este modo',ok:false,why:'No: la resistencia del rotor no cambia entre modos de frenado; lo que cambia es de dónde viene la energía que se disipa.'},
      {t:'Porque el motor gira en sentido contrario más rápido que antes',ok:false,why:'El motor no llega a girar en reversa durante el frenado — se detiene en ω=0 (y ahí debe desconectarse); el factor 3× viene del balance energético, no de la velocidad.'},
      {t:'Es un error de medición típico del modelo ideal, no un efecto real',ok:false,why:'Es un resultado real y clásico de la teoría de máquinas de inducción, no un artefacto de medición.'},
    ]),
  };
  if(MYST){
    if(MYST.kind==='dinamicoExt'){
      QUIZ.reto={
        pregunta:'¿Qué fracción de la energía cinética inicial se disipa en la resistencia externa (no en la resistencia interna del motor) durante un frenado dinámico?',
        opciones:shuffle([
          {t:'R_ext/(R_ext+R_a)',ok:true,why:'Correcto: la energía se reparte entre las dos resistencias en serie en la misma proporción que se repartiría la disipación de potencia I²R en cualquier instante.'},
          {t:'R_a/(R_ext+R_a)',ok:false,why:'Esa es la fracción que queda en la resistencia INTERNA del motor, no en la externa.'},
          {t:'R_ext/R_a',ok:false,why:'Falta normalizar entre la suma de ambas resistencias — esta expresión no está acotada entre 0 y 1.'},
          {t:'Siempre el 50%, sin importar los valores de R_ext y R_a',ok:false,why:'Solo sería 50% si R_ext=R_a; en general depende de la proporción entre ambas.'},
        ]),
      };
    } else if(MYST.kind==='regenRecuperada'){
      QUIZ.reto={
        pregunta:'¿Qué representa η en el modelo de frenado regenerativo de este simulador?',
        opciones:shuffle([
          {t:'Una eficiencia de conversión instantánea/ilustrativa (0.60–0.90); la energía neta recuperada en un ciclo real suele ser menor',ok:true,why:'Correcto: η aquí es un parámetro simplificado para este frenado puntual, no la eficiencia de todo un ciclo de trabajo real, que suele ser bastante menor.'},
          {t:'La eficiencia térmica del motor en operación normal',ok:false,why:'No: η no describe la eficiencia normal del motor, sino la fracción de energía cinética de ESTE frenado que se convierte en energía eléctrica útil.'},
          {t:'El factor de potencia del inversor',ok:false,why:'El factor de potencia es una cantidad distinta (relación entre potencia activa y aparente); η aquí mide un balance de energía.'},
          {t:'El deslizamiento del motor durante el frenado',ok:false,why:'El deslizamiento es una cantidad cinemática (diferencia relativa de velocidades); η es una eficiencia energética.'},
        ]),
      };
    } else {
      QUIZ.reto={
        pregunta:'¿Por qué el frenado a contracorriente necesita un relé de velocidad cero o anti-plugging?',
        opciones:shuffle([
          {t:'Porque si el motor no se desconecta exactamente en ω=0, seguirá conectado con secuencia invertida y arrancará a girar en reversa',ok:true,why:'Correcto: al invertir dos fases el motor frena, pero si sigue alimentado después de llegar a cero, simplemente continúa acelerando — ahora en sentido contrario.'},
          {t:'Porque las resistencias externas se sobrecalientan a velocidad cero',ok:false,why:'El contracorriente típicamente no usa resistencias externas — el calor se disipa dentro de la propia máquina.'},
          {t:'Porque el inversor de red no admite corriente cero',ok:false,why:'El contracorriente no involucra necesariamente un inversor de red — se implementa con contactores que invierten la secuencia de fases.'},
          {t:'Por estética del arrancador, no por una razón física',ok:false,why:'Es una razón física real: sin ese relé, el motor arrancaría en reversa de forma automática e inesperada.'},
        ]),
      };
    }
  }
}
function clearDx(){ el('dxbtns').innerHTML=''; }
function refreshQuestion(){
  const q=QUIZ[mode]; if(!q) return;
  el('q_text').textContent=q.pregunta;
  const box=el('dxbtns'); box.innerHTML='';
  q.opciones.forEach((o,i)=>{
    const b=document.createElement('button');
    b.className='b dx';
    b.textContent=String.fromCharCode(65+i)+') '+o.t;
    b.onclick=()=>{
      if(b.classList.contains('right')||b.classList.contains('wrong')) return;
      b.classList.add(o.ok?'right':'wrong');
      showToast(o.why); synth.beep(o.ok?760:220,.1,.07);
    };
    box.appendChild(b);
  });
}

/* ---------- §12 Picking / demos / tour / init ---------- */
pickerFor(S.scene,S.camera,S.renderer.domElement,hit=>{
  if(hit.object===board&&hit.uv){ boardClick(hit.uv.x,hit.uv.y); return; }
  let o=hit.object;
  while(o&&!o.userData?.act) o=o.parent;
  const act=o&&o.userData?.act;
  if(act==='mot3d'){ showToast(`Motor + volante: acumula E_k=½Jω₀²=${Ek(rpm0).toFixed(0)} J a ω₀=${rpm0} rpm que hay que disipar o recuperar.`); synth.beep(520,.08,.06); }
  else if(act==='res3d'){ if(mode==='explora') setTipo('dinamico'); showToast('Banco de resistencias: recibe toda la energía cinética como calor durante el frenado dinámico.'); synth.beep(560,.08,.06); }
  else if(act==='grid3d'){ if(mode==='explora') setTipo('regenerativo'); showToast('Inversor a red: devuelve una fracción η de la energía cinética como energía eléctrica durante el frenado regenerativo.'); synth.beep(600,.08,.06); }
  else if(act==='cont3d'){ if(mode==='explora') setTipo('contracorriente'); showToast('Contactores de inversión: invierten dos fases para frenar casi de inmediato — a costa de mucho calor y corriente pico.'); synth.beep(500,.08,.06); }
  else if(act==='paneld3d'){ showToast('Display: muestra el tipo de frenado activo y la velocidad inicial ω₀.'); synth.beep(600,.08,.06); }
  else if(act==='meter3d'){ showToast('Medidor de energía: muestra la energía disipada o recuperada del método de frenado actual.'); synth.beep(600,.08,.06); }
});

(function hoverTip(){
  const ray=new THREE.Raycaster(); const dom=S.renderer.domElement;
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width)*2-1, y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera({x,y},S.camera);
    const hits=ray.intersectObjects(S.scene.children,true);
    let title='';
    for(const h of hits){ let o=h.object; while(o){ if(o.userData?.title){ title=o.userData.title; break; } o=o.parent; } if(title) break; }
    dom.style.cursor=title?'pointer':'default'; dom.title=title;
  });
})();

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let flySpeedFrac=1;

async function runSimular(silent){
  if(mode==='reto'||simRunning) return;
  simRunning=true;
  const b=el('btnSimular'); if(b){ b.disabled=true; }
  try{
    const steps=40;
    for(let i=0;i<=steps;i++){
      const frac=1-i/steps;
      flySpeedFrac=Math.max(0,frac*frac);
      await sleep(30);
    }
    flySpeedFrac=1;
    if(!silent){
      if(tipo==='dinamico'){
        const d=dinamico(rpm0,rext);
        showToast(`Frenado dinámico simulado: t₉₅≈${d.t95.toFixed(2)} s, ${d.E.toFixed(0)} J disipados (${d.Eext.toFixed(0)} J en R_ext, ${d.Eint.toFixed(0)} J en el motor).`);
      } else if(tipo==='regenerativo'){
        const rg=regen(rpm0,eta);
        showToast(`Frenado regenerativo simulado: ${rg.Erec.toFixed(0)} J recuperados hacia la red, ${rg.Eperd.toFixed(0)} J perdidos (visual ilustrativo, no una curva de par verificada).`);
      } else {
        const cd=contra(rpm0);
        showToast(`Frenado a contracorriente simulado: ${cd.Edis.toFixed(0)} J disipados como calor — el más rápido, pero el más agresivo (visual ilustrativo).`);
      }
      synth.beep(700,.1,.08);
    }
  } finally {
    simRunning=false; if(b){ b.disabled=false; }
  }
}

async function runAuto(){
  if(autoRunning) return; autoRunning=true;
  const b=el('btnAuto'); b.disabled=true; b.textContent='▶ En curso…';
  try{
    synth.init(); synth.resume();
    setMode('explora'); setTipo('dinamico'); setRpm0(1800); setRext(2);
    showToast('1/5 · Explora: frenado dinámico — toda la energía se disipa como calor.');
    await runSimular(true);
    await sleep(300);

    setTipo('regenerativo'); setEta(0.75);
    showToast('2/5 · Explora: frenado regenerativo — parte de la energía se recupera hacia la red.');
    await runSimular(true);
    await sleep(300);

    setTipo('contracorriente');
    showToast('3/5 · Explora: a contracorriente — el más rápido, pero el que más calor y corriente exige.');
    await runSimular(true);
    await sleep(300);

    showToast('4/5 · Comparar: los tres métodos lado a lado a la misma ω₀.');
    setMode('comparar');
    await sleep(600);

    showToast('5/5 · Reto: resolvemos un caso misterioso.');
    setMode('reto');
    el('retoInput').value=MYST.target.toFixed(1);
    checkReto();
    await sleep(300);
    const idx=QUIZ.reto.opciones.findIndex(o=>o.ok);
    if(idx>=0) el('dxbtns').children[idx].click();
    await sleep(600);
    newMystery();
  } finally {
    autoRunning=false; b.disabled=false; b.textContent='✨ Recorrido guiado';
  }
}

S.setAnimate(()=>{
  flyG.rotation.x += 0.01 + 0.14*flySpeedFrac*(rpm0/RPM_MAX);
});

['m_explora','m_comparar','m_reto'].forEach(id=>{
  el(id).addEventListener('click',()=>{
    const m=id.slice(2);
    if(mode==='reto'&&!retoSolved&&m!=='reto'){ showToast('🔒 Resuelve el reto actual (o pide un nuevo caso) antes de salir.'); synth.beep(220,.1,.07); return; }
    setMode(m);
  });
});
el('tp_dinamico').addEventListener('click',()=>setTipo('dinamico'));
el('tp_regen').addEventListener('click',()=>setTipo('regenerativo'));
el('tp_contra').addEventListener('click',()=>setTipo('contracorriente'));
el('sRpm0').addEventListener('input',e=>setRpm0(parseFloat(e.target.value)));
el('sRext').addEventListener('input',e=>setRext(parseFloat(e.target.value)));
el('sEta').addEventListener('input',e=>setEta(parseFloat(e.target.value)));
el('btnCheck').addEventListener('click',checkReto);
el('btnAuto').addEventListener('click',runAuto);
el('btnNew').addEventListener('click',newMystery);
el('btnSimular').addEventListener('click',()=>{ if(!autoRunning) runSimular(false); });

genMystery(); buildQuiz();
S.start();
setMode('explora');

window.__labDebug={
  state:()=>({mode,tipo,rpm0,rext,eta,retoSolved,solved}),
  point:()=>({ek:Ek(rpm0),dinamico:dinamico(rpm0,rext),regen:regen(rpm0,eta),contra:contra(rpm0)}),
  Ek, dinamico, regen, contra, omegaT,
  mystery:()=>MYST?{...MYST}:null,
  setRpm0, setRext, setEta, setTipo,
  checkReto, newMystery, boardClick,
  mode:()=>mode, setMode,
  runSimular,
};
