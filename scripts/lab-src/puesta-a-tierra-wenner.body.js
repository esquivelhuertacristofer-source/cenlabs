/* ============================================================
   LAB — PUESTA A TIERRA Y RESISTENCIA DE TIERRA
   (Dominio D1 · Circuitos Eléctricos — instalaciones eléctricas)
   MOLDE E+S — ensamble 3D interactivo del sistema de puesta a
   tierra + medición (molde E) + panel esquemático con modos de
   exploración sobre canvas (molde S), mismo patrón que los labs
   de máquinas eléctricas de D5 (ver patron_molde_e_s_hibrido).
   Referencia curricular: programa ELE-I (fila d1-17 de la lista
   maestra). Norma ancla: NOM-001-SEDE-2022 Art. 250 (puesta a
   tierra) · IEEE 81 (medición de resistencia de tierra) ·
   NOM-022-STPS-2015 (requisitos de sistemas de tierra en centros
   de trabajo).
   Modelo de ingeniería (didáctico, suelo homogéneo, valores de
   catálogo de texto de referencia — NO una medición de campo real):
     · MÉTODO DE WENNER (4 electrodos equidistantes, separación a,
       clavados a poca profundidad b con a ≥ 20b): el telurómetro
       marca R = ρ/(2πa); la resistividad aparente se despeja como
       ρ = 2π·a·R. Para suelo homogéneo ρ es constante con a (es una
       propiedad del suelo, no del arreglo de medición).
     · RESISTENCIA DE UNA VARILLA VERTICAL (fórmula de Dwight,
       IEEE 142): R = ρ/(2πL)·[ln(8L/d) − 1], con L = longitud,
       d = diámetro de la varilla (copperweld 5/8" = 0.0159 m).
     · N VARILLAS EN PARALELO separadas ≥ 2·L (acople mutuo
       despreciable): R_N ≈ R₁/N. En separaciones menores la mejora
       es menor (rendimiento < 100%) — simplificación declarada.
   Todo verificado con node -e antes de escribir este archivo:
     Wenner ρ=2πaR recupera ρ exacto en suelo homogéneo;
     grid Dwight R(ρ,L,N); 11 pares (suelo,objetivo) del Reto con
     config mínima (min N, luego min L) única y verificada.
   CERO Math.random() salvo en newChallenge() del modo Reto (única
   selección aleatoria: qué par suelo/objetivo se sortea).
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[0.0,4.0,7.4],target:[-0.15,1.55,0.9],bgTop:'#0d1620',bgBot:'#05070a',bloom:0.4,minD:2.6,maxD:18});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2400,Q:0.8});
const std=o=>new THREE.MeshStandardMaterial(o);
const el=id=>document.getElementById(id);
const tf=(x,d=0)=>Number(x).toFixed(d);
function ease(x){return x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}

/* ---------- toast ---------- */
let toastT=null;
function showToast(html,ms=3300){ const t=el('toast'); t.innerHTML=html; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms); }

/* ---------- materiales PBR (biblioteca compartida) ---------- */
const alu=castAluminum(), brush=brushedMetal();
const MAT={
  copper:  std({color:0xa8602f, metalness:0.55, roughness:0.5,  envMapIntensity:0.6}),   // cobre desnudo (varilla / conductor)
  copperW: std({...brush, color:0xb7bec4, metalness:0.9, roughness:0.32, envMapIntensity:1.1}), // alma de acero copperweld (punta)
  bronze:  std({color:0xa07a3c, metalness:0.85, roughness:0.4,  envMapIntensity:1.1}),    // abrazadera de bronce
  busbar:  std({color:0xc9853f, metalness:0.9,  roughness:0.3,  envMapIntensity:1.2}),    // barra de tierra (cobre)
  panel:   std({color:0x2f4f66, metalness:0.4, roughness:0.6, envMapIntensity:0.7}), // placa/tablero
  meter:   std({color:0xd9a521, metalness:0.35, roughness:0.55, envMapIntensity:0.8}),    // caja del telurómetro (amarillo instrumento)
  meterDk: std({color:0x2a2410, metalness:0.3,  roughness:0.6}),                           // carátula / detalle oscuro
  probe:   std({...brush, color:0xa8b0b6, metalness:0.9, roughness:0.35, envMapIntensity:1.1}), // electrodos auxiliares (acero)
  dark:    std({color:0x05070a, roughness:0.8, metalness:0.2}),
  bench:   std({color:0x262c33, metalness:0.4, roughness:0.62, envMapIntensity:0.5}),
  benchLeg:std({color:0x171b20, metalness:0.7, roughness:0.4}),
  ped:     std({color:0x2c333b, metalness:0.5, roughness:0.55, envMapIntensity:0.6}),
  pedTop:  std({color:0x555d66, metalness:0.55, roughness:0.5, envMapIntensity:0.6}),
  pedRing: std({color:0x1f7f74, metalness:0.1, roughness:0.7, emissive:0x1e6f63, emissiveIntensity:0.12}),
};

/* ---------- datos de ingeniería (verificados con node -e antes de escribir este archivo) ---------- */
const D_ROD=0.0159;                 // diámetro varilla copperweld 5/8" (m)
const SOILS={
  pantano:{n:'Pantano / suelo orgánico', rho:30,   color:'#4a6b45', ej:'Terrenos húmedos, cerca de cuerpos de agua.'},
  arcilla:{n:'Arcilla / limo húmedo',    rho:100,  color:'#8a6d3b', ej:'Suelos arcillosos comunes con humedad.'},
  arena_h:{n:'Arena húmeda',             rho:200,  color:'#b8a06a', ej:'Suelos arenosos con algo de humedad.'},
  arena_s:{n:'Arena seca / grava',       rho:500,  color:'#c9b78f', ej:'Terrenos secos, arena o grava.'},
  roca:   {n:'Roca / terreno seco',      rho:1000, color:'#9aa0a6', ej:'Terreno rocoso o muy seco: el peor caso.'},
};
const SOIL_ORDER=['pantano','arcilla','arena_h','arena_s','roca'];
const A_STEPS=[1,2,4,8,16];          // separaciones Wenner (m)
const L_STEPS=[1.5,3.0,4.5,6.0];     // longitudes de varilla (m) — 3 m = estándar (varillas acoplables)
const N_STEPS=[1,2,3,4,6,8];         // n.º de varillas en paralelo
const TARGETS=[25,10,5];             // objetivos de resistencia (Ω)
function dwight(rho,L){ return rho/(2*Math.PI*L)*(Math.log(8*L/D_ROD)-1); } // R de una varilla vertical
function Rn(rho,L,N){ return dwight(rho,L)/N; }                              // N varillas paralelas (acople despreciable)
function wennerR(rho,a){ return rho/(2*Math.PI*a); }                         // lo que marca el telurómetro
function rhoFromWenner(a,R){ return 2*Math.PI*a*R; }                         // despeje del alumno
/* «Mínimo material» = menor LONGITUD TOTAL de varilla clavada (N×L). Si varias combinaciones
   empatan en metros (p. ej. 4×6 y 8×3), TODAS son mínimas y valen en el reto. */
function minimos(rho,target){
  let mejor=Infinity, lista=[];
  for(const N of N_STEPS){ for(const L of L_STEPS){ if(Rn(rho,L,N)<=target){
    const tot=N*L;
    if(tot<mejor-1e-9){ mejor=tot; lista=[{N,L,R:Rn(rho,L,N),tot}]; }
    else if(Math.abs(tot-mejor)<1e-9) lista.push({N,L,R:Rn(rho,L,N),tot});
  } } }
  return lista;
}
function bestConfig(rho,target){ const m=minimos(rho,target); return m.length?m[0]:null; }
/* R con los decimales justos para que «≤» y «>» se lean coherentes (nunca «5,0 Ω > 5 Ω») */
function tfVs(R,t){ let d=1; while(d<4 && (Number(R.toFixed(d))<=t)!==(R<=t)) d++; return tf(R,d); }
// pares (suelo,objetivo) del Reto que SÍ tienen solución en catálogo (11 de 15) — los 4 imposibles
// (arena seca/roca a ≤10 y ≤5 Ω) se dejan solo para exploración libre en el modo Electrodo.
const RETO_PAIRS=[];
SOIL_ORDER.forEach(sk=>TARGETS.forEach(t=>{ if(bestConfig(SOILS[sk].rho,t)) RETO_PAIRS.push({soil:sk,target:t}); }));

/* ---------- constructores de piezas (3D de oficio) ---------- */
const {extruido,contornoRedondeado,normalizaUV,telurometro,picaTierra,abrazaderaTierra,carreteCable,registroTierra,gabinete}=P3;   // §17-B de la biblioteca
const _V=(x,y,z)=>new THREE.Vector3(x,y,z);
function _etiqueta(w,h,pinta){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const c=cv.getContext('2d'); pinta(c,w,h);
  const t=new THREE.CanvasTexture(cv); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t; }
function _tinta(tex,w,h){ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:0.55,metalness:0,
  depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})); m.renderOrder=2; return m; }
/* ---------- piezas de la biblioteca (_piezas3d.js §17-B) y materiales de oficio ---------- */
const MATP={
  aluminio:std({color:0xb6bdc4,roughness:0.42,metalness:0.7,envMapIntensity:1.0}),
  acero:std({color:0x8f979f,roughness:0.38,metalness:0.85,envMapIntensity:1.0}),
  cromo:std({color:0xc4cad0,roughness:0.28,metalness:0.9,envMapIntensity:1.1}),
  chapa:std({color:0x9aa2aa,roughness:0.5,metalness:0.6}),
  cobre:std({color:0xb87333,roughness:0.32,metalness:0.85}),
  negro:std({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:std({color:0x14181e,roughness:0.85,metalness:0.02}),
  blanco:std({color:0xd7dee6,roughness:0.40,metalness:0.20}),
  ceramica:std({color:0xd7dee6,roughness:0.60,metalness:0.05}),
};
const GY=1.70;                       // cota de la superficie del terreno (el bloque de suelo apoya en el piso)
const lbl=(g,txt,col,y,sc)=>{ const lb=labelSprite(txt,col); lb.position.set(0,y,0); lb.scale.multiplyScalar(sc); g.add(lb); };

/* ---------- constructores de piezas (el 3D real: telurómetro, picas, abrazadera, gabinete) ---------- */
const WEN_A=0.44;                    // separación entre picas del arreglo de Wenner (unidades de escena)
function buildVarilla(l=true){
  const g=new THREE.Group();
  g.add(picaTierra(MATP,{largo:1.4,sobre:0.16,r:0.04,color:0xb87333,cabeza:'hongo'}));
  if(l) lbl(g,'Varilla de tierra (copperweld 5/8")','#8A94A0',0.62,0.58);
  return g;
}
function buildAbrazadera(l=true){
  const g=new THREE.Group();
  g.add(abrazaderaTierra(MATP,{r:0.04}));
  if(l) lbl(g,'Conector / abrazadera','#8A94A0',0.28,0.52);
  return g;
}
const COND_PATH=[[0,0,0],[0.17,0,0],[0.40,-0.04,0.01],[1.2,-0.04,0.02],[2.8,-0.04,0],[3.20,-0.04,-0.6],[3.01,-0.05,-1.28],[2.73,-0.02,-1.68],[2.69,0.01,-1.90],[2.69,0.23,-2.12],[2.55,0.55,-2.12],[2.495,0.73,-2.11]];
function buildConductor(l=true){
  const g=new THREE.Group();
  // del lado de la abrazadera por el pasamuros del registro, sobre el terreno y hasta la barra del gabinete
  const curve=new THREE.CatmullRomCurve3(COND_PATH.map(p=>V(p[0],p[1],p[2])),false,'catmullrom',0.2);
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,120,0.019,10,false),MAT.copper); tube.castShadow=true; g.add(tube);
  const ter=new THREE.Mesh(new THREE.CylinderGeometry(0.034,0.034,0.03,12),MAT.bronze); ter.rotation.x=Math.PI/2; ter.position.set(2.495,0.73,-2.11); g.add(ter);
  if(l) lbl(g,'Conductor de puesta a tierra (Cu)','#8A94A0',0.45,0.56);
  return g;
}
function buildBarraTierra(l=true){
  const g=new THREE.Group();
  const plate=roundedBox(0.5,0.7,0.05,std({color:0x6c7782,metalness:0.4,roughness:0.55,envMapIntensity:0.6}),0.03); plate.castShadow=true; g.add(plate);
  const bar=new THREE.Mesh(extruido(contornoRedondeado([[-0.21,-0.035],[0.21,-0.035],[0.21,0.035],[-0.21,0.035]],0.008,2),{espesor:0.012,bisel:0.002}),MAT.busbar);
  bar.position.set(0,0.0,0.052); bar.castShadow=true; g.add(bar);
  for(const sx of [-1,1]){ const ais=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,0.03,10),MATP.ceramica); ais.rotation.x=Math.PI/2; ais.position.set(sx*0.17,0,0.036); g.add(ais); }
  for(let i=0;i<6;i++){ const hx=-0.165+i*0.066;
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.011,0.011,0.012,6),MATP.acero); t.rotation.x=Math.PI/2; t.position.set(hx,0.0,0.064); g.add(t);
    const ho=new THREE.Mesh(new THREE.CylinderGeometry(0.0055,0.0055,0.002,8),MATP.negro); ho.rotation.x=Math.PI/2; ho.position.set(hx,0.0,0.0705); g.add(ho); }
  const gs=_etiqueta(128,128,(c,w,h)=>{ c.clearRect(0,0,w,h); c.strokeStyle='#e6c15a'; c.lineWidth=8; c.beginPath(); c.moveTo(64,20); c.lineTo(64,62); c.stroke();
    for(let i=0;i<3;i++){ c.beginPath(); c.moveTo(64-(40-i*13),66+i*15); c.lineTo(64+(40-i*13),66+i*15); c.stroke(); } });
  const ink=_tinta(gs,0.2,0.2); ink.position.set(0,-0.19,0.0275); g.add(ink);
  if(l) lbl(g,'Barra de tierra (tablero)','#8A94A0',0.46,0.56);
  return g;
}
function buildTelurometro(l=true){
  const g=new THREE.Group();
  const t=telurometro(MATP,{}); g.add(t); g.userData.tele=t;
  if(l) lbl(g,'Telurómetro (4 terminales)','#8A94A0',0.62,0.56);
  return g;
}
function buildElectrodosAux(l=true){
  const g=new THREE.Group();
  // cuatro picas de acero en línea, equidistantes (a): C1 · P1 · P2 · C2 — el arreglo de Wenner
  const cols=[0xd64545,0xc9a02c,0x3aa86b,0x3a7fd6];
  for(let i=0;i<4;i++){
    const p=picaTierra(MATP,{largo:0.62,sobre:0.30,r:0.016,color:0x9aa2aa,cabeza:'anilla',borna:cols[i],punta:0.12});
    p.position.set((i-1.5)*WEN_A,0,0); g.add(p);
  }
  if(l) lbl(g,'Electrodos auxiliares (P · C)','#8A94A0',0.62,0.52);
  return g;
}

/* ---------- el terreno: un bloque en corte con sus estratos ---------- */
const _rng=(s)=>()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
function granoTex(base,seed,tam=256,manchas=70,pedr=0){
  const r=_rng(seed);
  return _etiqueta(tam,tam,(c,w,h)=>{
    c.fillStyle=base; c.fillRect(0,0,w,h);
    for(let i=0;i<manchas;i++){ c.fillStyle=r()<0.5?'rgba(0,0,0,.07)':'rgba(255,255,255,.06)'; c.beginPath(); c.ellipse(r()*w,r()*h,10+r()*30,4+r()*12,0,0,7); c.fill(); }
    for(let i=0;i<pedr;i++){ const x=r()*w,y=r()*h,rr=4+r()*9; c.fillStyle='rgba(60,56,50,.55)'; c.beginPath(); c.ellipse(x,y,rr*1.2,rr,0,0,7); c.fill();
      c.fillStyle='rgba(235,228,214,.25)'; c.beginPath(); c.ellipse(x-1,y-1.5,rr*0.8,rr*0.55,0,0,7); c.fill(); }
  });
}
let soilTop=null;
const SOIL_W=4.4, SOIL_D=2.8, SOIL_Y0=0.10;
const REG={x:-1.30,z:1.18};                       // posición de la varilla: el corte pasa justo por ella
function buildSuelo(){
  const g=new THREE.Group();
  const hw=SOIL_W/2, hd=SOIL_D/2;
  // contorno visto desde arriba: x → x, z del mundo → −y del contorno; el frente (z=+hd) lleva el registro y la ranura de la varilla
  const mk=(pit,slot)=>{
    const P=[[-hw,-hd],[hw,-hd],[hw,hd]];
    P.push([REG.x+0.28,hd]);
    if(pit){ P.push([REG.x+0.23,hd],[REG.x+0.23,hd-0.43],[REG.x-0.23,hd-0.43],[REG.x-0.23,hd]); }
    else if(slot){ P.push([REG.x+0.08,hd],[REG.x+0.08,hd-0.30],[REG.x-0.08,hd-0.30],[REG.x-0.08,hd]); }
    P.push([REG.x-0.28,hd],[-hw,hd]);
    return P.map(([x,z])=>[x,-z]);
  };
  const capas=[ // de arriba abajo: espesor, color, semilla, pedriscos
    {t:0.40,c:0x5a4a38,s:11,p:0,top:true},
    {t:0.38,c:0x70502f,s:23,p:0},
    {t:0.36,c:0x8f8a7e,s:37,p:42},
    {t:0.26,c:0xcdb98f,s:51,p:0},
    {t:0.20,c:0x626a72,s:67,p:6},
  ];
  let y=GY;
  capas.forEach((cp,i)=>{
    const geo=extruido(mk(cp.top,!cp.top),{espesor:cp.t,bisel:0,curvaSeg:2});
    normalizaUV(geo,1.5);
    const tx=granoTex('#e6e6e6',cp.s,256,cp.top?60:70,cp.p); tx.wrapS=tx.wrapT=THREE.RepeatWrapping;
    const m=new THREE.MeshStandardMaterial({color:cp.c,map:tx,roughness:0.97,metalness:0.0});
    const me=new THREE.Mesh(geo,m); me.rotation.x=-Math.PI/2; me.position.y=y-cp.t/2; me.castShadow=me.receiveShadow=true; g.add(me);
    if(cp.top) soilTop=me;
    y-=cp.t;
  });
  // zócalo de acero bajo el corte
  const base=roundedBox(SOIL_W+0.16,0.1,SOIL_D+0.16,MAT.bench,0.12); base.position.y=SOIL_Y0-0.04; g.add(base);
  return g;
}
/* escenografía fija alrededor del terreno: registro, cabina de medición, carretes */
const escenario=new THREE.Group();
function buildEscenario(){
  const g=escenario;
  // registro de concreto sobre la varilla, cortado por el frente
  const reg=registroTierra(MATP,{ancho:0.60,fondo:0.50,alto:0.26,pared:0.07,corte:true,tapa:true});
  reg.position.set(REG.x,GY,SOIL_D/2-0.25); g.add(reg);
  // pasamuros de PVC por donde sale el conductor del registro
  const pv=new THREE.Mesh(new THREE.CylinderGeometry(0.034,0.034,0.2,14),std({color:0xd9d4c4,roughness:0.6,metalness:0.0}));
  pv.rotation.z=Math.PI/2; pv.position.set(REG.x+0.30,GY+0.09,REG.z); g.add(pv);
  // gabinete con la barra de tierra
  const gab=gabinete(MATP,{ancho:0.92,alto:1.36,fondo:0.40,apertura:2.2,puerta:true});
  gab.position.set(1.55,GY,-0.86); g.add(gab); escenario.userData.gab=gab;
  // dos carretes de cable de medida, junto al instrumento
  const c1=carreteCable(MATP,{d:0.46,ancho:0.20,color:0xd64545}); c1.position.set(-1.78,GY,-0.18); c1.rotation.y=0.35; g.add(c1);
  const c2=carreteCable(MATP,{d:0.46,ancho:0.20,color:0xc9a02c}); c2.position.set(-0.20,GY,-0.55); c2.rotation.y=-0.5; g.add(c2);
  // cable suelto de cada carrete tendido en el terreno
  [[c1,0xd64545],[c2,0xc9a02c]].forEach(([c,col],i)=>{
    g.updateMatrixWorld(true); const p0=c.localToWorld(c.userData.punta.clone());
    const dir=i?V(0.5,0,0.6):V(0.3,0,0.8);
    const cur=new THREE.CatmullRomCurve3([p0,p0.clone().add(V(0,-0.1,0.02)),V(p0.x+dir.x*0.5,GY+0.015,p0.z+dir.z*0.4),V(p0.x+dir.x*0.9,GY+0.015,p0.z+dir.z*0.8)]);
    const t=new THREE.Mesh(new THREE.TubeGeometry(cur,24,0.009,6,false),std({color:col,roughness:0.7})); g.add(t);
  });
  scene.add(g);
}

/* cables de medida del arreglo de Wenner y cotas «a»: sólo aparecen con telurómetro y picas instalados */
const medida=new THREE.Group(); medida.visible=false; scene.add(medida);
function buildMedida(){
  const tel=PART.telurometro.home, aux=PART.electrodosAux.home;
  const T=telurometro(MATP,{}); const bornas=T.userData.bornas;
  const cols=[0xd64545,0xc9a02c,0x3aa86b,0x3a7fd6];
  for(let i=0;i<4;i++){
    const a=V(tel.x+bornas[i].x,tel.y+bornas[i].y,tel.z+bornas[i].z);
    const px=aux.x+(i-1.5)*WEN_A, b=V(px+0.03,GY+0.285,aux.z-0.01);
    const cur=new THREE.CatmullRomCurve3([a,a.clone().add(V(0,-0.01,0.10+0.03*i)),V(px-0.06,GY+0.018,aux.z-0.20),V(px,GY+0.14,aux.z-0.05),b]);
    const tu=new THREE.Mesh(new THREE.TubeGeometry(cur,40,0.0095,6,false),std({color:cols[i],roughness:0.6})); tu.castShadow=true; medida.add(tu);
  }
  // cotas «a» entre picas, pintadas sobre el terreno
  for(let i=0;i<3;i++){
    const x0=aux.x+(i-1.5)*WEN_A+0.02, x1=aux.x+(i-0.5)*WEN_A-0.02, z=aux.z+0.26;
    const ln=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,0.004,0.012),std({color:0x9aa6b0,roughness:0.7})); ln.position.set((x0+x1)/2,GY+0.032,z); medida.add(ln);
    for(const x of [x0,x1]){ const tk=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.004,0.08),std({color:0x9aa6b0,roughness:0.7})); tk.position.set(x,GY+0.032,z); medida.add(tk); }
    const sp=labelSprite('a','#43D9AD'); sp.position.set((x0+x1)/2,GY+0.14,z); sp.scale.multiplyScalar(0.28); medida.add(sp);
  }
}


/* ---------- registro de piezas (posición HOGAR en mundo) ---------- */
const HUB=[0,0,0];                      // punto de instalación en la superficie del suelo
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const H=(dx,dy,dz)=>V(HUB[0]+dx,HUB[1]+dy,HUB[2]+dz);
const PARTS=[
  {id:'varilla',       name:'Varilla de tierra',           build:(l)=>buildVarilla(l),       home:V(REG.x,GY,REG.z),            note:'Electrodo copperweld 5/8": alma de acero recubierta de cobre. Se clava vertical en el suelo; a mayor longitud, menor resistencia (fórmula de Dwight).'},
  {id:'abrazadera',    name:'Conector / abrazadera',       build:(l)=>buildAbrazadera(l),    home:V(REG.x,GY+0.07,REG.z),       note:'Sujeta mecánica y eléctricamente el conductor a la varilla. Debe ser del material adecuado (bronce/cobre) para evitar corrosión galvánica.'},
  {id:'conductor',     name:'Conductor de puesta a tierra',build:(l)=>buildConductor(l),     home:V(REG.x+0.19,GY+0.07,REG.z), s:0.17, note:'Une el electrodo con la barra de tierra del tablero. Su calibre lo fija la NOM (Tabla 250-*) según la protección de la instalación.'},
  {id:'barraTierra',   name:'Barra de tierra (tablero)',   build:(l)=>buildBarraTierra(l),   home:V(1.55,GY+0.80,-0.995), s:0.55, note:'Punto común donde se conectan todas las tierras de la instalación. De aquí parte el conductor al electrodo.'},
  {id:'telurometro',   name:'Telurómetro',                 build:(l)=>buildTelurometro(l),   home:V(-1.0,GY,-0.10), s:0.6, note:'Instrumento de 4 terminales que inyecta corriente y mide tensión para obtener la resistencia. Es la herramienta del método de Wenner y de la caída de potencial.'},
  {id:'electrodosAux', name:'Electrodos auxiliares (P·C)', build:(l)=>buildElectrodosAux(l), home:V(0.50,GY,0.55), s:0.4, note:'Picas auxiliares de potencial (P) y corriente (C). En el método de Wenner van en línea y equidistantes con el electrodo bajo prueba.'},
];
const ORDER=PARTS.map(p=>p.id);
const PART=Object.fromEntries(PARTS.map(p=>[p.id,p]));

/* ---------- estado ---------- */
const STAGE_S=0.5;
const stageS=id=>PART[id].s||STAGE_S;
const groups={}, ghosts={}, labels={};
let placed={}, selectedId=null, progress=0, simUnlocked=false;
const tweens=[];
const trayObjs=[], ghostObjs=[], scratch=[];
const suelo=buildSuelo(); scene.add(suelo);
buildEscenario(); buildMedida();

/* ---------- banco de trabajo + pedestales (paramétrico, plantilla reutilizable) ---------- */
const BENCH={cx:0, cz:3.15, top:0.9, cols:6, dx:0.58, dz:1.1, pedH:0.28};
const N_ROWS=Math.ceil(PARTS.length/BENCH.cols);
const PED_TOP_Y=BENCH.top+BENCH.pedH;
function pedBaseXZ(i){ const c=i%BENCH.cols, r=(i/BENCH.cols)|0;
  return { x:BENCH.cx+(c-(BENCH.cols-1)/2)*BENCH.dx, z:BENCH.cz+(r-(N_ROWS-1)/2)*BENCH.dz }; }
const pedestals=[];
(function buildStaging(){
  const staging=new THREE.Group(); scene.add(staging);
  const spanX=(BENCH.cols-1)*BENCH.dx+0.70, spanZ=(N_ROWS-1)*BENCH.dz+0.95;
  const topSlab=roundedBox(spanX,0.16,spanZ,MAT.bench,0.05); topSlab.position.set(BENCH.cx,BENCH.top-0.08,BENCH.cz); topSlab.receiveShadow=true; staging.add(topSlab);
  const legH=BENCH.top-0.08;
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const leg=new THREE.Mesh(new THREE.BoxGeometry(0.13,legH,0.13),MAT.benchLeg);
    leg.position.set(BENCH.cx+sx*(spanX/2-0.18),legH/2,BENCH.cz+sz*(spanZ/2-0.18)); leg.castShadow=true; staging.add(leg);
  }
  const rail=roundedBox(spanX-0.1,0.05,spanZ-0.1,MAT.benchLeg,0.03); rail.position.set(BENCH.cx,0.18,BENCH.cz); staging.add(rail);
  PARTS.forEach((p,i)=>{
    const {x,z}=pedBaseXZ(i);
    const pg=new THREE.Group(); pg.position.set(x,0,z);
    const post=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.24,BENCH.pedH,28),MAT.ped); post.position.y=BENCH.top+BENCH.pedH/2; post.castShadow=true; pg.add(post);
    const plate=new THREE.Mesh(new THREE.CylinderGeometry(0.27,0.27,0.05,40),MAT.pedTop); plate.position.y=PED_TOP_Y; plate.receiveShadow=true; pg.add(plate);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.275,0.016,12,44),MAT.pedRing.clone()); ring.rotation.x=Math.PI/2; ring.position.y=PED_TOP_Y+0.035; pg.add(ring);
    const lb=labelSprite(p.name.split('(')[0].trim(),'#9fb2c0'); lb.position.set(0,BENCH.top+0.12,0.46); lb.scale.multiplyScalar(0.34); pg.add(lb);
    const ck=labelSprite('✓ colocada','#43D9AD'); ck.position.set(0,PED_TOP_Y+0.42,0); ck.scale.multiplyScalar(0.42); ck.visible=false; pg.add(ck);
    staging.add(pg);
    pedestals[i]={g:pg, ring, plate, label:lb, check:ck};
  });
})();
function resetPedestals(){ pedestals.forEach(pd=>{ pd.check.visible=false; if(pd.label)pd.label.visible=true;
  pd.ring.material.color.set(0x1f7f74); pd.ring.material.emissive.set(0x1e6f63); pd.ring.material.emissiveIntensity=0.12; }); }
function markPedestalDone(i){ const pd=pedestals[i]; if(!pd)return; pd.check.visible=true; if(pd.label)pd.label.visible=false;
  pd.ring.material.color.set(0x2a9a7e); pd.ring.material.emissive.set(0x1e6f56); pd.ring.material.emissiveIntensity=0.1; }

function ghostMat(){ return new THREE.MeshStandardMaterial({color:0x4FD1C5, transparent:true, opacity:0.3, metalness:0.0, roughness:0.6, emissive:0x2A9D8F, emissiveIntensity:0.6, depthWrite:false}); }
function makeGhost(part){
  const gh=part.build(true); const gm=ghostMat();
  gh.traverse(o=>{ if(o.isMesh){ o.material=gm; o.castShadow=false; o.receiveShadow=false; } });
  gh.position.copy(part.home); gh.userData={kind:'slot',id:part.id,gm,homeX:part.home.x,shake:0,fading:false}; return gh;
}
function showGhostFor(id){
  ghostObjs.forEach(gh=>{ if(gh.parent) scene.remove(gh); });
  if(id && !placed[id] && ghosts[id]){ const gh=ghosts[id]; gh.userData.fading=false; gh.userData.gm.opacity=0.3; gh.visible=true; scene.add(gh); }
}
function updateLabels(){ pedestals.forEach((pd,i)=>{ if(pd&&pd.label) pd.label.visible=!placed[PARTS[i].id]; }); }
function makePart(part,i){
  const g=part.build(false); g.scale.setScalar(part.s||STAGE_S);
  const {x,z}=pedBaseXZ(i);
  const box=new THREE.Box3().setFromObject(g);
  const baseY=PED_TOP_Y+0.03-box.min.y;
  g.position.set(x,baseY,z);
  Object.assign(g.userData,{kind:'part',id:part.id,baseY,phase:i*1.7,lift:0});
  return g;
}

function initAssembly(){
  [...trayObjs,...ghostObjs,...scratch].forEach(o=>scene.remove(o));
  trayObjs.length=ghostObjs.length=scratch.length=tweens.length=0;
  placed={}; selectedId=null; progress=0; simUnlocked=false;
  resetPedestals();
  PARTS.forEach((p,i)=>{
    const g=makePart(p,i); groups[p.id]=g; scene.add(g); trayObjs.push(g);
    const gh=makeGhost(p); ghosts[p.id]=gh; ghostObjs.push(gh);
  });
  showGhostFor(null);
  updateLabels(); renderChecklist(); renderProg();
  syncCtrlbar();
  if(mode!=='ensamble') setMode('ensamble');
  S.moveTo([0.0,4.0,7.4],[-0.15,1.55,0.9],1.2);
  el('asmStatus').innerHTML='Toca una <b>pieza</b> del banco (derecha) y luego su <b>hueco luminoso</b>.';
}

/* ---------- selección / colocación ---------- */
function selectPart(id){
  if(placed[id]) return;
  selectedId=id;
  updateLabels(); showGhostFor(id);
  el('asmStatus').innerHTML=`▶ <b style="color:var(--accent2)">${PART[id].name}</b> seleccionada — ahora toca su <b>hueco luminoso</b>.`;
  synth.beep(660,0.06,0.05);
  renderChecklist();
}
function deselect(){ selectedId=null; updateLabels(); showGhostFor(null); renderChecklist(); }
function placePart(id){
  const p=PART[id], g=groups[id], gh=ghosts[id];
  tweens.push({obj:g, fromP:g.position.clone(), toP:p.home.clone(), fromS:g.scale.x, toS:1, t:0, dur:0.9, roty0:g.rotation.y, onDone:()=>{ g.rotation.set(0,0,0); }});
  if(gh){ gh.userData.fading=true; }
  g.userData.kind='placed';
  placed[id]=true; selectedId=null; progress++;
  markPedestalDone(ORDER.indexOf(id));
  updateLabels();
  synth.beep(880,0.08,0.05); setTimeout(()=>synth.beep(1174,0.1,0.05),110);
  showToast(`<span style="color:var(--good)">✔ ${p.name} colocada.</span><br><span style="color:var(--dim);font-size:11px">${p.note}</span>`);
  renderChecklist(); renderProg();
  if(progress>=PARTS.length) finishAssembly();
  else el('asmStatus').innerHTML=`Bien. Faltan <b>${PARTS.length-progress}</b>. Toca otra pieza y luego su hueco.`;
}
function wrongSlot(slotId){
  synth.beep(180,0.16,0.06);
  const g=ghosts[slotId]; if(g) g.userData.shake=0.5;
  showToast(`<span style="color:var(--bad)">✗ Ahí no va esa pieza.</span><br><span style="color:var(--dim);font-size:11px">Ese hueco es para: ${PART[slotId].name}.</span>`);
}
function finishAssembly(){
  simUnlocked=true;
  syncCtrlbar();
  el('asmStatus').innerHTML='<span style="color:var(--good)">✅ Sistema de tierra instalado.</span> Ahora mide el suelo y diseña el electrodo (arriba).';
  showToast('<span style="color:var(--good)">✅ Sistema instalado.</span><br><span style="color:var(--dim);font-size:11px">Cambia de modo arriba: mide la resistividad (Wenner), diseña el electrodo y resuelve el reto.</span>',4200);
  synth.beep(1046,0.14,0.06); setTimeout(()=>synth.beep(1568,0.16,0.06),150);
  S.moveTo([0.0,4.0,7.4],[-0.15,1.55,0.9],1.4); S.setCinematicIdle(true);
}

/* ---------- picker: tocar pieza → tocar hueco ---------- */
function tagged(obj){ let o=obj; while(o){ if(o.userData && o.userData.kind) return o; o=o.parent; } return null; }
pickerFor(scene,S.camera,mount,(hit)=>{
  const t=hit?tagged(hit.object):null;
  if(!t){ if(selectedId) deselect(); return; }
  if(t.userData.kind==='part'){ selectPart(t.userData.id); }
  else if(t.userData.kind==='slot'){
    if(!selectedId){ el('asmStatus').innerHTML='Primero toca una <b>pieza</b> del banco (derecha) →'; synth.beep(300,0.08,0.05); }
    else if(selectedId===t.userData.id){ placePart(selectedId); }
    else { wrongSlot(t.userData.id); }
  }
  else if(t.userData.kind==='placed'){ const p=PART[t.userData.id]; if(p) showToast(`<b>${p.name}</b><br><span style="color:var(--dim);font-size:11px">${p.note}</span>`); }
});

/* ---------- checklist / progreso ---------- */
function renderChecklist(){
  el('checklist').innerHTML=PARTS.map(p=>{
    const done=placed[p.id], sel=selectedId===p.id;
    const mk=done?'<span style="color:var(--good)">●</span>':sel?'<span style="color:var(--accent2)">◉</span>':'<span style="color:#48555f">○</span>';
    const c=done?'color:var(--good)':sel?'color:var(--accent2)':'color:var(--dim)';
    return `<div style="${c}">${mk} ${p.name}</div>`;
  }).join('');
}
function renderProg(){ el('p_prog').textContent=`${progress} / ${PARTS.length}`; el('p_prog').className=progress>=PARTS.length?'good':''; }

/* ---------- tablero esquemático (canvas) — suelo / electrodo / reto ---------- */
const boardG=new THREE.Group();
const bFrame=roundedBox(1.66,1.26,0.06,MAT.panel,0.04); bFrame.position.set(0,0,-0.02); bFrame.castShadow=true; boardG.add(bFrame);
const bLeg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.6,16),MAT.panel); bLeg.position.set(0,-1.35,0); bLeg.castShadow=true; boardG.add(bLeg);
const bCv=document.createElement('canvas'); bCv.width=1024; bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv); bTex.colorSpace=THREE.SRGBColorSpace; bTex.minFilter=THREE.LinearFilter; bTex.generateMipmaps=false;
const board=new THREE.Mesh(new THREE.PlaneGeometry(1.56,1.16),new THREE.MeshBasicMaterial({map:bTex,toneMapped:false}));
board.position.set(0,0,0.015); boardG.add(board);
boardG.position.set(-3.3,2.5,-0.2); boardG.rotation.y=0.3;
scene.add(boardG);

function line(x1,y1,x2,y2,color,w=3){ bCx.strokeStyle=color; bCx.lineWidth=w; bCx.beginPath(); bCx.moveTo(x1,y1); bCx.lineTo(x2,y2); bCx.stroke(); }
function labelAt(x,y,text,color='#dfe7ee',size=20,align='left'){ bCx.fillStyle=color; bCx.font=`${size}px 'Segoe UI',sans-serif`; bCx.textAlign=align; bCx.fillText(text,x,y); }
function wrapText(x,y,text,color,size,maxW,lh){
  lh=lh||size*1.35;
  bCx.fillStyle=color; bCx.font=`${size}px 'Segoe UI',sans-serif`; bCx.textAlign='left';
  const words=text.split(' '); let cur='', yy=y;
  for(const w of words){
    const test=cur?cur+' '+w:w;
    if(bCx.measureText(test).width>maxW && cur){ bCx.fillText(cur,x,yy); cur=w; yy+=lh; }
    else cur=test;
  }
  if(cur) bCx.fillText(cur,x,yy);
  return yy;
}

/* ---------- estado de los modos de simulación ---------- */
const WEN={soil:'arcilla', a:4};        // método de Wenner (suelo + separación)
const ELE={soil:'arcilla', L:3.0, N:1}; // diseño del electrodo

function drawSuelo(){
  const s=SOILS[WEN.soil], rho=s.rho;
  const R=wennerR(rho,WEN.a), rhoCalc=rhoFromWenner(WEN.a,R);
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Método de Wenner — 4 electrodos equidistantes','#8fd1ff',26);
  // diagrama: 4 electrodos en línea, separación a, corriente por los externos, tensión entre internos
  const gy=150, xs=[140,340,540,740];
  bCx.fillStyle='#5a4a38'; bCx.fillRect(60,gy,900,150); // suelo
  xs.forEach((x,i)=>{ line(x,gy-40,x,gy+80,'#c9ced3',5); const cap=(i===0||i===3)?'#8fd1ff':'#43D9AD'; bCx.fillStyle=cap; bCx.beginPath(); bCx.arc(x,gy-46,10,0,Math.PI*2); bCx.fill();
    labelAt(x,gy-58,(i===0||i===3)?'C':'P',cap,16,'center'); });
  // cotas de separación a
  for(let i=0;i<3;i++){ const x0=xs[i],x1=xs[i+1]; line(x0,gy+100,x1,gy+100,'#7a8a96',2); labelAt((x0+x1)/2,gy+124,'a',' #7a8a96',16,'center'); }
  labelAt(500,gy+100+2,'','#7a8a96',16,'center');
  // telurómetro simbólico
  labelAt(500,gy-90,`I  →  entra por los externos (C) · V  →  se mide entre los internos (P)`,'#8A94A0',16,'center');
  // lecturas
  const oy=380;
  labelAt(40,oy,`Suelo: ${s.n}`,s.color,24);
  labelAt(40,oy+40,`Separación a = ${WEN.a} m`,'#dfe7ee',22);
  labelAt(40,oy+78,`Telurómetro marca:  R = ρ/(2πa) = ${tf(R,2)} Ω`,'#dfe7ee',22);
  labelAt(40,oy+120,`Resistividad del suelo:  ρ = 2π·a·R = ${tf(rhoCalc,0)} Ω·m`,'#43D9AD',24);
  // mini-tabla: ρ constante con a (suelo homogéneo)
  labelAt(560,oy,'ρ = 2π·a·R  (constante con a)','#8fd1ff',18);
  A_STEPS.forEach((a,i)=>{ const rr=wennerR(rho,a); const rc=rhoFromWenner(a,rr); const y=oy+30+i*30; const sel=a===WEN.a;
    labelAt(560,y,`a=${String(a).padStart(2)} m`,sel?'#dfe7ee':'#7a8a96',16);
    labelAt(660,y,`R=${tf(rr,2)} Ω`,sel?'#dfe7ee':'#7a8a96',16);
    labelAt(820,y,`ρ=${tf(rc,0)} Ω·m`,sel?'#43D9AD':'#5b6672',16); });
  wrapText(40,oy+160,'La resistividad ρ es una propiedad del suelo: cambia la separación a y la lectura R cambia, pero el ρ despejado se mantiene (suelo homogéneo). Real: los suelos suelen ser estratificados y ρ varía con a.','#8A94A0',15,900);
  labelAt(40,740,'⚠ Modelo de suelo homogéneo, electrodos someros (a ≥ 20b). IEEE 81.','#f4c95d',15);
  bTex.needsUpdate=true;
}

function critMet(R,t){ return R<=t; }
function drawElectrodo(){
  const s=SOILS[ELE.soil], rho=s.rho;
  const R1=dwight(rho,ELE.L), R=Rn(rho,ELE.L,ELE.N);
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Diseño del electrodo — resistencia de tierra','#8fd1ff',26);
  labelAt(40,96,`Suelo: ${s.n}   ·   ρ = ${rho} Ω·m`,s.color,20);
  labelAt(40,140,`Fórmula de Dwight:  R₁ = ρ/(2πL)·[ln(8L/d) − 1]`,'#dfe7ee',20);
  labelAt(40,178,`Una varilla L=${ELE.L} m, d=5/8":  R₁ = ${tf(R1,1)} Ω`,'#dfe7ee',20);
  labelAt(40,216,`${ELE.N} varilla(s) en paralelo:  R = R₁/N = ${tf(R,1)} Ω`,'#43D9AD',24);
  // barra de resistencia vs objetivos 25/10/5
  const ox=90, oy=290, w=820, h=44, maxR=Math.max(30, R*1.15);
  bCx.fillStyle='#20262c'; bCx.fillRect(ox,oy,w,h);
  const frac=Math.min(1,R/maxR);
  bCx.fillStyle = R<=5?'#43D9AD' : R<=25?'#e0b23c' : '#d64545';
  bCx.fillRect(ox,oy,w*frac,h);
  labelAt(ox,oy-12,`Resistencia obtenida: ${tf(R,1)} Ω`,'#dfe7ee',18);
  TARGETS.forEach(t=>{ const x=ox+w*Math.min(1,t/maxR); line(x,oy-6,x,oy+h+6,'#8fd1ff',2);
    labelAt(x,oy+h+24,`${t} Ω`,'#8fd1ff',15,'center'); });
  // veredicto por objetivo
  let vy=oy+90;
  TARGETS.forEach(t=>{ const ok=critMet(R,t); labelAt(40,vy,`Objetivo ≤ ${t} Ω:`,'#dfe7ee',18);
    labelAt(260,vy,ok?'✔ se cumple':'✗ no se cumple',ok?'#43D9AD':'#d64545',18); vy+=34; });
  if(!bestConfig(rho,10)) wrapText(560,oy+92,'Este suelo es tan resistivo que ni 8 varillas de 6 m ('+tf(Rn(rho,6,8),1)+' Ω) bajan de 10 Ω: en la práctica se recurre a malla de tierra, anillo perimetral o tratamiento del suelo (bentonita/GEM).','#f4c95d',15,420);
  labelAt(40,740,'⚠ Suelo homogéneo; varillas separadas ≥ 2L (acople mutuo despreciable). Dwight / IEEE 142.','#f4c95d',15);
  bTex.needsUpdate=true;
}

/* ---------- reto ---------- */
let RETO={active:false, soil:'arcilla', target:25, rho:SOILS.arcilla.rho};
let retoN=1, retoL=3.0, retoChecked=false, retoSolved=false, retoMsg='';
let intentos=0, resiembras=0; const FALLOS_MAX=3;   // fallos del caso actual; a los 3, caso nuevo
function drawReto(){
  const s=SOILS[RETO.soil], rho=RETO.rho, t=RETO.target;
  const R=Rn(rho,retoL,retoN), best=bestConfig(rho,t);
  bCx.clearRect(0,0,1024,768); bCx.fillStyle='#0b1116'; bCx.fillRect(0,0,1024,768);
  labelAt(40,50,'Reto — diseña el electrodo mínimo','#8fd1ff',26);
  labelAt(40,110,`Suelo: ${s.n}`,s.color,22);
  labelAt(40,148,`Resistividad medida:  ρ = ${rho} Ω·m`,'#dfe7ee',20);
  labelAt(40,186,`Objetivo normativo:  R ≤ ${t} Ω`,'#f4c95d',22);
  labelAt(40,250,'Tu selección:','#8fd1ff',20);
  labelAt(40,290,`${retoN} varilla(s) × ${retoL} m  =  ${tf(retoN*retoL,1)} m de varilla`,'#dfe7ee',22);
  labelAt(40,340,'Calcula R con Dwight, elige N y L y pulsa Comprobar (la R de tu elección no se muestra antes).','#8A94A0',16);
  labelAt(40,376,`Mínimo = menor longitud total de varilla (N×L); los empates valen.  Fallos: ${intentos} de ${FALLOS_MAX}.`,'#8A94A0',16);
  if(retoChecked){
    labelAt(40,450,retoSolved?'✔ Correcto':'✗ Aún no',retoSolved?'#43D9AD':'#d64545',26);
    wrapText(40,490,retoMsg,retoSolved?'#43D9AD':'#f4c95d',18,900);
    if(retoSolved&&best) labelAt(40,600,`Mínimo del caso: ${best.tot} m de varilla (p. ej. ${best.N} × ${best.L} m = ${tf(best.R,1)} Ω)`,'#43D9AD',20);
  }
  bTex.needsUpdate=true;
  const rt=el('retoText');
  if(rt) rt.textContent=`Suelo ${s.n}, ρ medida = ${rho} Ω·m, objetivo ≤${t} Ω. Selección ${retoN}×${retoL} m. Fallos de este caso: ${intentos}/${FALLOS_MAX}.`+(retoChecked?` ${retoSolved?'✔ Correcto':'✗ '+retoMsg}`:'');
}

function drawBoard(){ if(mode==='suelo') drawSuelo(); else if(mode==='electrodo') drawElectrodo(); else if(mode==='reto') drawReto(); }

function updateTele(){
  if(mode==='suelo'){
    const rho=SOILS[WEN.soil].rho, R=wennerR(rho,WEN.a);
    el('t_soil').textContent=SOILS[WEN.soil].n;
    el('t_a').textContent=`${WEN.a} m`;
    el('t_R').textContent=`${tf(R,2)} Ω`;
    el('t_rho').textContent=`${tf(rhoFromWenner(WEN.a,R),0)} Ω·m`;
  } else if(mode==='electrodo'){
    const rho=SOILS[ELE.soil].rho, R1=dwight(rho,ELE.L), R=Rn(rho,ELE.L,ELE.N);
    el('e_soil').textContent=SOILS[ELE.soil].n;
    el('e_R1').textContent=`${tf(R1,1)} Ω`;
    el('e_R').textContent=`${tf(R,1)} Ω`;
    el('e_verd').textContent = R<=5?'≤ 5 Ω (excelente)' : R<=10?'≤ 10 Ω (bueno)' : R<=25?'≤ 25 Ω (aceptable)' : '> 25 Ω (no cumple)';
    el('e_verd').className = R<=25?'good':'bad';
  }
}
function refreshAll(){ updateTele(); if(mode!=='ensamble') drawBoard(); syncSoilBtns(); syncEleBtns(); syncRetoBtns(); }

/* ---------- máquina de modos ---------- */
const MODE_META={
  ensamble:{nombre:'Ensamble', cam:[[0.0,4.0,7.4],[-0.15,1.55,0.9]]},
  suelo:{nombre:'Suelo (Wenner)', cam:[[-1.5,2.75,2.5],[-3.3,2.45,-0.2]]},
  electrodo:{nombre:'Electrodo', cam:[[-1.5,2.75,2.5],[-3.3,2.45,-0.2]]},
  reto:{nombre:'Reto', cam:[[-1.5,2.75,2.5],[-3.3,2.45,-0.2]]},
};
const modes=['ensamble','suelo','electrodo','reto'];
let mode='ensamble';
function setMode(k){
  if(k!=='ensamble' && !simUnlocked){ showToast('<span style="color:var(--bad)">🔒 Termina el ensamble primero.</span>'); synth.beep(220,0.08,0.05); return; }
  mode=k; boardG.visible=(k!=='ensamble');
  modes.forEach(m=>{ const b=el('m_'+m); if(b) b.classList.toggle('on',m===k); });
  el('p_mode').textContent=MODE_META[k].nombre;
  el('secEnsamble').style.display=k==='ensamble'?'':'none';
  el('secSuelo').style.display=k==='suelo'?'':'none';
  el('secElectrodo').style.display=k==='electrodo'?'':'none';
  el('secReto').style.display=k==='reto'?'':'none';
  if(soilTop){ const sk = k==='suelo'?WEN.soil : k==='electrodo'?ELE.soil : k==='reto'?RETO.soil : null; if(sk) soilTop.material.color.set(SOILS[sk].color); }
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  if(k==='reto' && !RETO.active) newChallenge();
  refreshAll();
}
function syncCtrlbar(){ modes.forEach(m=>{ const b=el('m_'+m); if(b && m!=='ensamble') b.disabled=!simUnlocked; }); }

/* ---------- reto de diseño ---------- */
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function newChallenge(silencio){
  const p=pick(RETO_PAIRS);
  /* la ρ «medida» del caso se aparta del valor de catálogo (±), para que el modo Electrodo no sea una tabla de respuestas */
  let rho=SOILS[p.soil].rho;
  for(let k=0;k<20;k++){ const c=Math.round(SOILS[p.soil].rho*pick([0.7,0.8,0.9,1.1,1.2,1.35])); if(bestConfig(c,p.target)){ rho=c; break; } }
  RETO={active:true, soil:p.soil, target:p.target, rho};
  retoN=1; retoL=3.0; retoChecked=false; retoSolved=false; retoMsg=''; intentos=0;
  if(soilTop) soilTop.material.color.set(SOILS[RETO.soil].color);
  drawReto(); syncRetoBtns();
  if(!silencio){ showToast('🎲 Nuevo reto de diseño generado.'); synth.beep(520,0.08,0.05); }
}
function checkReto(){
  if(retoSolved) return;
  const rho=RETO.rho, t=RETO.target;
  const R=Rn(rho,retoL,retoN), mins=minimos(rho,t);
  const tot=retoN*retoL, totMin=mins[0].tot;
  retoChecked=true;
  if(R>t){ intentos++; retoSolved=false; retoMsg=`R=${tfVs(R,t)} Ω > ${t} Ω: con esa elección el electrodo NO baja de lo pedido. Necesitas más varilla enterrada.`; }
  else if(Math.abs(tot-totMin)<1e-9){ retoSolved=true; retoMsg=`R=${tfVs(R,t)} Ω ≤ ${t} Ω con el mínimo de material (${tf(tot,1)} m de varilla), en ${intentos+1} ${intentos?'intentos':'intento'}.`; }
  else { intentos++; retoSolved=false; retoMsg=`R=${tfVs(R,t)} Ω ≤ ${t} Ω: sí cumple, pero hay una elección que también cumple con MENOS metros totales de varilla (N×L).`; }
  if(retoSolved){ showToast('<span style="color:var(--good)">✔ Correcto: electrodo de mínimo material que cumple.</span>'); synth.beep(1046,0.12,0.06); }
  else if(intentos>=FALLOS_MAX){
    resiembras++;
    showToast('<span style="color:var(--bad)">✗ '+FALLOS_MAX+' intentos fallidos.</span> Ese caso se retira sin revelarse: aquí tienes uno nuevo.');
    synth.beep(180,0.14,0.06);
    newChallenge(true);
    return;
  }
  else { showToast('<span style="color:var(--bad)">✗ Revisa tu diseño</span> (fallo '+intentos+' de '+FALLOS_MAX+').'); synth.beep(180,0.14,0.06); }
  drawReto();
}

/* ---------- sincronización de botones ---------- */
function syncSoilBtns(){ document.querySelectorAll('#soilBtns [data-soil]').forEach(b=>b.classList.toggle('on',b.dataset.soil===WEN.soil));
  document.querySelectorAll('#aBtns [data-a]').forEach(b=>b.classList.toggle('on',+b.dataset.a===WEN.a)); }
function syncEleBtns(){ document.querySelectorAll('#eSoilBtns [data-soil]').forEach(b=>b.classList.toggle('on',b.dataset.soil===ELE.soil));
  document.querySelectorAll('#eLBtns [data-l]').forEach(b=>b.classList.toggle('on',+b.dataset.l===ELE.L));
  document.querySelectorAll('#eNBtns [data-n]').forEach(b=>b.classList.toggle('on',+b.dataset.n===ELE.N)); }
function syncRetoBtns(){ document.querySelectorAll('#rNBtns [data-n]').forEach(b=>b.classList.toggle('on',+b.dataset.n===retoN));
  document.querySelectorAll('#rLBtns [data-l]').forEach(b=>b.classList.toggle('on',+b.dataset.l===retoL)); }
function setSoil(k){ WEN.soil=k; refreshAll(); }
function setA(a){ WEN.a=a; refreshAll(); }
function setL(l){ ELE.L=l; refreshAll(); }
function setN(n){ ELE.N=n; refreshAll(); }

/* ---------- demos guiados ---------- */
const sleep=ms=>new Promise(res=>setTimeout(res,ms));
let autoRunning=false;
async function autoAssemble(){
  if(autoRunning) return; autoRunning=true; const btn=el('btnAuto'); if(btn) btn.disabled=true;
  for(const id of ORDER){ if(placed[id]) continue; selectPart(id); await sleep(550); placePart(id); await sleep(950); }
  if(btn) btn.disabled=false; autoRunning=false;
}
async function autoWennerTour(){
  if(autoRunning) return; autoRunning=true; const btn=el('btnAutoW'); if(btn) btn.disabled=true;
  for(const a of A_STEPS){ WEN.a=a; refreshAll(); await sleep(1200); }
  if(btn) btn.disabled=false; autoRunning=false;
}

/* ---------- lazo de animación ---------- */
S.setAnimate((dt,t)=>{
  medida.visible=!!(placed.telurometro&&placed.electrodosAux&&!tweens.length);
  { const tg=groups.telurometro; if(tg&&tg.userData.tele){ const tt=tg.userData.tele.userData; const txt=simUnlocked?tf(wennerR(SOILS[WEN.soil].rho,WEN.a),2):'0.00'; if(tt._txt!==txt){ tt._txt=txt; tt.pinta(txt); } } }
  for(let i=tweens.length-1;i>=0;i--){ const w=tweens[i]; w.t=Math.min(1,w.t+dt/w.dur); const e=ease(w.t);
    w.obj.position.lerpVectors(w.fromP,w.toP,e); const s=w.fromS+(w.toS-w.fromS)*e; w.obj.scale.setScalar(s);
    if('roty0' in w) w.obj.rotation.y=w.roty0*(1-e);
    if(w.t>=1){ if(w.onDone)w.onDone(); tweens.splice(i,1); } }
  trayObjs.forEach(g=>{ if(g.userData.kind!=='part')return; const id=g.userData.id; if(placed[id])return;
    const sel=selectedId===id;
    g.userData.lift=Math.max(0,Math.min(1,(g.userData.lift||0)+(sel?1:-1)*dt*3.2));
    const L=ease(g.userData.lift);
    g.position.y=g.userData.baseY + L*0.5 + (1-L)*0.02*Math.sin(t*1.8+g.userData.phase);
    if(sel) g.rotation.y+=dt*1.25; else g.rotation.y*=(1-Math.min(1,dt*5));
    g.scale.setScalar(stageS(id)*(1+L*0.06)); });
  ghostObjs.forEach(gh=>{ if(!gh.parent) return; const gm=gh.userData.gm;
    if(gh.userData.fading){ gm.opacity=Math.max(0,gm.opacity-dt*1.4); if(gm.opacity<=0){ gh.visible=false; scene.remove(gh); } return; }
    gm.opacity=0.24+0.14*Math.sin(t*3.2);
    if(gh.userData.shake>0){ gh.userData.shake=Math.max(0,gh.userData.shake-dt*2.2); gh.position.x=gh.userData.homeX+Math.sin(t*45)*0.05*gh.userData.shake; }
    else if(gh.position.x!==gh.userData.homeX){ gh.position.x=gh.userData.homeX; } });
});
S.start();

/* ---------- HUD ---------- */
el('hud').innerHTML=`
  <div class="eyebrow">Circuitos Eléctricos · Instalaciones eléctricas</div>
  <h2>Diseña el sistema de puesta a tierra y mide su resistencia</h2>
  <p>Instala el sistema de puesta a tierra pieza por pieza (<b>toca la pieza, luego su hueco</b>). Luego mide la <b>resistividad del suelo</b> con el método de Wenner (4 electrodos), <b>diseña el electrodo</b> (longitud y número de varillas) para bajar de la resistencia objetivo, y resuelve el reto eligiendo el electrodo <b>mínimo</b> que cumple.</p>
  <div class="formula">ρ = 2π·a·R (Wenner) · R₁ = ρ/(2πL)·[ln(8L/d) − 1] (Dwight) · R_N = R₁/N</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#c0703a"></span>Varilla / conductor de cobre</div>
    <div class="li"><span class="dot" style="background:#a07a3c"></span>Abrazadera de bronce</div>
    <div class="li"><span class="dot" style="background:#c9853f"></span>Barra de tierra</div>
    <div class="li"><span class="dot" style="background:#d9a521"></span>Telurómetro</div>
    <div class="li"><span class="dot" style="background:#a8b0b6"></span>Electrodos auxiliares</div>
  </div>
  <div class="fid">
    <div class="ft">Contrato de fidelidad</div>
    <div class="fl">SÍ modela: <b>el método de Wenner de 4 electrodos para obtener la resistividad del suelo (ρ = 2π·a·R) y el hecho de que ρ es una propiedad del suelo (constante con la separación a en suelo homogéneo); la resistencia de una varilla vertical por la fórmula de Dwight R₁ = ρ/(2πL)·[ln(8L/d) − 1]; la reducción por varillas en paralelo R_N = R₁/N; y el diseño para cumplir objetivos normativos (25 / 10 / 5 Ω), incluyendo suelos donde solo con varillas no se alcanza el objetivo.</b></div>
    <div class="fl no">NO modela: <b>suelos estratificados (multicapa), donde ρ aparente varía con a; el acople mutuo entre varillas cercanas (se supone separación ≥ 2·L, acople despreciable → R_N = R₁/N es una cota optimista); la estacionalidad (humedad/temperatura) de la resistividad; ni el detalle de instrumento del telurómetro (impedancia, corrientes parásitas, método de caída de potencial al 62 %).</b></div>
    <div class="fl">Norma ancla: <b>NOM-001-SEDE-2022 Art. 250; IEEE 81; NOM-022-STPS-2015.</b> Valores de resistividad de suelo tomados de rangos típicos de literatura de referencia.</div>
  </div>
  <div class="src">Varilla de referencia: copperweld 5/8" (d = 0.0159 m). Objetivos: 25 Ω (general), 10 Ω (deseable), 5 Ω (subestaciones / pararrayos). Referencias: NOM-001-SEDE-2022 Art. 250 · IEEE 81 · IEEE 142 (Dwight) · NOM-022-STPS-2015. Programa curricular ELE-I.</div>
  <div class="modebar">
    <button class="b on" id="m_ensamble">① Ensamble</button>
    <button class="b" id="m_suelo" disabled>② Suelo (Wenner)</button>
    <button class="b" id="m_electrodo" disabled>③ Electrodo</button>
    <button class="b" id="m_reto" disabled>④ Reto</button>
  </div>`;

/* ---------- PANEL ---------- */
el('panel').innerHTML=`
  <div class="g"><div class="gl"><span>Modo actual</span><b id="p_mode">Ensamble</b></div></div>

  <div id="secEnsamble">
    <h4>① Ensamble — toca pieza, toca hueco</h4>
    <div class="console" id="asmStatus">Toca una <b>pieza</b> del banco (derecha) y luego su <b>hueco luminoso</b>.</div>
    <div class="g"><div class="gl"><span>Piezas colocadas</span><b id="p_prog">0 / 6</b></div></div>
    <div id="checklist" style="font-family:var(--mono);font-size:11px;line-height:1.85;margin:6px 0"></div>
    <div class="btns">
      <button class="b auto" id="btnAuto">✨ Instalación automática (guiada)</button>
      <button class="b" id="btnReset">↺ Reiniciar ensamble</button>
    </div>
  </div>

  <div id="secSuelo" style="display:none">
    <h4 class="sec">② Suelo — método de Wenner</h4>
    <div class="lbl">Tipo de suelo</div>
    <div class="btns" id="soilBtns">
      <button class="b" data-soil="pantano">Pantano</button>
      <button class="b" data-soil="arcilla">Arcilla</button>
      <button class="b" data-soil="arena_h">Arena húm.</button>
      <button class="b" data-soil="arena_s">Arena seca</button>
      <button class="b" data-soil="roca">Roca</button>
    </div>
    <div class="lbl">Separación a (m)</div>
    <div class="btns" id="aBtns">
      <button class="b" data-a="1">1</button>
      <button class="b" data-a="2">2</button>
      <button class="b" data-a="4">4</button>
      <button class="b" data-a="8">8</button>
      <button class="b" data-a="16">16</button>
    </div>
    <h4 class="sec">Telemetría</h4>
    <div class="g"><div class="gl"><span>Suelo</span><b id="t_soil">—</b></div></div>
    <div class="g"><div class="gl"><span>Separación a</span><b id="t_a">—</b></div></div>
    <div class="g"><div class="gl"><span>Telurómetro R</span><b id="t_R">—</b></div></div>
    <div class="g"><div class="gl"><span>ρ = 2π·a·R</span><b id="t_rho">—</b></div></div>
    <div class="btns"><button class="b auto" id="btnAutoW">✨ Barrer separaciones (a)</button></div>
  </div>

  <div id="secElectrodo" style="display:none">
    <h4 class="sec">③ Electrodo — diseño de la puesta a tierra</h4>
    <div class="lbl">Tipo de suelo</div>
    <div class="btns" id="eSoilBtns">
      <button class="b" data-soil="pantano">Pantano</button>
      <button class="b" data-soil="arcilla">Arcilla</button>
      <button class="b" data-soil="arena_h">Arena húm.</button>
      <button class="b" data-soil="arena_s">Arena seca</button>
      <button class="b" data-soil="roca">Roca</button>
    </div>
    <div class="lbl">Longitud de varilla L (m)</div>
    <div class="btns" id="eLBtns">
      <button class="b" data-l="1.5">1.5</button>
      <button class="b" data-l="3">3.0</button>
      <button class="b" data-l="4.5">4.5</button>
      <button class="b" data-l="6">6.0</button>
    </div>
    <div class="lbl">N.º de varillas en paralelo</div>
    <div class="btns" id="eNBtns">
      <button class="b" data-n="1">1</button>
      <button class="b" data-n="2">2</button>
      <button class="b" data-n="3">3</button>
      <button class="b" data-n="4">4</button>
      <button class="b" data-n="6">6</button>
      <button class="b" data-n="8">8</button>
    </div>
    <h4 class="sec">Telemetría</h4>
    <div class="g"><div class="gl"><span>Suelo</span><b id="e_soil">—</b></div></div>
    <div class="g"><div class="gl"><span>R₁ (una varilla)</span><b id="e_R1">—</b></div></div>
    <div class="g"><div class="gl"><span>R (N varillas)</span><b id="e_R">—</b></div></div>
    <div class="g"><div class="gl"><span>Veredicto</span><b id="e_verd">—</b></div></div>
  </div>

  <div id="secReto" style="display:none">
    <h4 class="sec">④ Reto — electrodo mínimo</h4>
    <div class="console" id="retoText">Lee el tablero (izquierda) para ver el escenario.</div>
    <div class="lbl">N.º de varillas</div>
    <div class="btns" id="rNBtns">
      <button class="b" data-n="1">1</button>
      <button class="b" data-n="2">2</button>
      <button class="b" data-n="3">3</button>
      <button class="b" data-n="4">4</button>
      <button class="b" data-n="6">6</button>
      <button class="b" data-n="8">8</button>
    </div>
    <div class="lbl">Longitud L (m)</div>
    <div class="btns" id="rLBtns">
      <button class="b" data-l="1.5">1.5</button>
      <button class="b" data-l="3">3.0</button>
      <button class="b" data-l="4.5">4.5</button>
      <button class="b" data-l="6">6.0</button>
    </div>
    <div class="btns">
      <button class="b" id="btnCheck">✓ Comprobar</button>
      <button class="b" id="btnNew">🎲 Nuevo reto</button>
    </div>
  </div>`;

/* ---------- wiring ---------- */
modes.forEach(m=>{ const b=el('m_'+m); if(b) b.onclick=()=>{
  if(mode==='reto'&&!retoSolved&&m!=='reto'){
    showToast('<span style="color:var(--bad)">🔒 Resuelve el reto (diseña el electrodo mínimo que cumple) antes de salir a otro modo.</span>');
    synth.beep(220,0.1,0.05);
    return;
  }
  setMode(m);
}; });
el('btnReset').onclick=()=>initAssembly();
el('btnAuto').onclick=()=>autoAssemble();
el('btnAutoW').onclick=()=>autoWennerTour();
el('btnCheck').onclick=()=>checkReto();
el('btnNew').onclick=()=>newChallenge();
document.querySelectorAll('#soilBtns [data-soil]').forEach(b=>{ b.onclick=()=>setSoil(b.dataset.soil); });
document.querySelectorAll('#aBtns [data-a]').forEach(b=>{ b.onclick=()=>setA(+b.dataset.a); });
document.querySelectorAll('#eSoilBtns [data-soil]').forEach(b=>{ b.onclick=()=>{ ELE.soil=b.dataset.soil; if(soilTop)soilTop.material.color.set(SOILS[ELE.soil].color); refreshAll(); }; });
document.querySelectorAll('#eLBtns [data-l]').forEach(b=>{ b.onclick=()=>setL(+b.dataset.l); });
document.querySelectorAll('#eNBtns [data-n]').forEach(b=>{ b.onclick=()=>setN(+b.dataset.n); });
document.querySelectorAll('#rNBtns [data-n]').forEach(b=>{ b.onclick=()=>{ retoN=+b.dataset.n; retoChecked=false; syncRetoBtns(); drawReto(); }; });
document.querySelectorAll('#rLBtns [data-l]').forEach(b=>{ b.onclick=()=>{ retoL=+b.dataset.l; retoChecked=false; syncRetoBtns(); drawReto(); }; });
const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{const on=synth.toggle();soundBtn.textContent=on?'🔊':'🔇';soundBtn.classList.toggle('on',on);};

initAssembly();
syncCtrlbar();
setMode('ensamble');

window.__labDebug={
  mode:()=>mode,
  progress:()=>({placed:{...placed},progress,simUnlocked}),
  soil:()=>WEN.soil,
  wenner:()=>{ const rho=SOILS[WEN.soil].rho, R=wennerR(rho,WEN.a); return {soil:WEN.soil, a:WEN.a, R, rho:rhoFromWenner(WEN.a,R), rhoTrue:rho}; },
  elec:()=>{ const rho=SOILS[ELE.soil].rho; return {soil:ELE.soil, rho, L:ELE.L, N:ELE.N, R1:dwight(rho,ELE.L), R:Rn(rho,ELE.L,ELE.N)}; },
  reto:()=>{ const rho=RETO.rho; return {...RETO, rho, best:bestConfig(rho,RETO.target), minimos:minimos(rho,RETO.target), intentos, resiembras, pick:{N:retoN,L:retoL}, R:Rn(rho,retoL,retoN), checked:retoChecked, solved:retoSolved, msg:retoMsg}; },
  pairs:()=>RETO_PAIRS.slice(),
  setSoil, setA, setL, setN, setMode, checkReto, newChallenge,
  intentos:()=>intentos, resiembras:()=>resiembras, solved:()=>retoSolved,
  setReto:(soil,target,rho)=>{ RETO={active:true,soil,target,rho:rho||SOILS[soil].rho}; intentos=0; retoN=1; retoL=3.0; retoChecked=false; retoSolved=false; retoMsg=''; if(soilTop)soilTop.material.color.set(SOILS[soil].color); drawReto(); syncRetoBtns(); },
  setRetoPick:(N,L)=>{ retoN=N; retoL=L; retoChecked=false; syncRetoBtns(); drawReto(); },
};
