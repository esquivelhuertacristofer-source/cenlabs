/* ============================================================
   LAB — PLACAS DE DATOS Y SELECCIÓN DE MOTORES (Dominio D5 ·
   Transformadores y máquinas eléctricas — molde S: esquemático +
   motor de cálculo, sin ensamble de hardware ni panel de
   instrumentos físico)
   Tema: lectura de los campos de la placa de datos NEMA (HP, V,
   Hz, RPM, FP, eficiencia, FS, letra de código, Diseño NEMA) y su
   uso para (a) estimar el rango de corriente de arranque a rotor
   bloqueado a partir de la letra de código, (b) calcular el HP
   continuo permitido según el Factor de Servicio, y (c) decidir si
   un motor candidato es apto para una aplicación real.
   Normas: NEMA MG-1 (letras de código de rotor bloqueado, Factor
   de Servicio, Diseños B/C/D) · NOM-016-ENER-2025 (DOF 19/08/2025,
   vigente 15/02/2026, Tabla 1 de eficiencia mínima — ⚠ NO usa las
   etiquetas IE1–IE4 de IEC 60034-30-1; son dos sistemas distintos,
   ver §13 de la norma).
     I_LR = (kVA/HP del rango de la letra × HP × 1000) / (√3 · V_línea)
     HP continuo permitido = HP nominal × FS
   NO modela: la Tabla 1 completa de NOM-016 (solo 4 puntos ancla
   verificados) · la curva de vida del aislamiento en función de la
   sobrecarga térmica · la derivación de la letra de código a partir
   del diseño interno del motor (se usa como dato de placa, no se
   calcula) · voltajes/frecuencias fuera de 220/440 V y 60 Hz.
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.6,2.9,6.4],target:[0,1.7,-0.7],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.3,minD:3.0,maxD:16,floor:true});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2400,Q:0.7});
const std=o=>new THREE.MeshStandardMaterial(o);

/* ---------- 1 · Modelo físico ---------- */
const CODE_LETTERS=[
  ['A',0,3.15],['B',3.15,3.55],['C',3.55,4.0],['D',4.0,4.5],['E',4.5,5.0],
  ['F',5.0,5.6],['G',5.6,6.3],['H',6.3,7.1],['J',7.1,8.0],['K',8.0,9.0],
  ['L',9.0,10.0],['M',10.0,11.2],['N',11.2,12.5],['P',12.5,14.0],['R',14.0,16.0],
  ['S',16.0,18.0],['T',18.0,20.0],['U',20.0,22.4],['V',22.4,26.0],
];
function lockedRotorRange(hp,vLL,letter){
  const entry=CODE_LETTERS.find(c=>c[0]===letter);
  const iLo=(entry[1]*hp*1000)/(Math.sqrt(3)*vLL);
  const iHi=(entry[2]*hp*1000)/(Math.sqrt(3)*vLL);
  return{iLo,iHi};
}
function continuousHP(hpNominal,fs){return hpNominal*fs;}
function fsQualitativeNote(fs){
  if(fs<=1.0)return 'FS = 1.00 → sin margen de sobrecarga continua: operar por encima de la potencia nominal de forma sostenida acorta la vida térmica del aislamiento.';
  if(fs<=1.15)return 'FS = 1.15 → margen moderado (típico en motores de baja potencia a 60 Hz). Es un margen para sobrecargas ocasionales, no un punto de operación continuo recomendado.';
  return 'FS = 1.25 → mayor margen de sobrecarga continua. Aun dentro del margen, operar sostenidamente cerca del límite reduce la vida útil del aislamiento por fatiga térmica.';
}
const NOM016_ANCHORS=[{hp:1,min:85.5},{hp:10,min:91.7},{hp:50,min:94.5},{hp:500,min:96.2}];
function efficiencyDisplay(hp){
  const a=NOM016_ANCHORS.find(x=>x.hp===hp);
  return a?a.min.toFixed(1)+'% (ancla NOM-016 verificada)':'— (consulta la Tabla 1 completa)';
}
const DESIGN_LETTERS={
  B:{par:'par de arranque 150–170% del nominal',deslizamiento:'deslizamiento bajo, ≤5%',uso:'uso general (bombas, ventiladores, la mayoría de las cargas industriales)'},
  C:{par:'par de arranque ≈200% del nominal',deslizamiento:'deslizamiento similar a B (bajo)',uso:'cargas difíciles de arrancar con corriente de irrupción limitada (bandas transportadoras cargadas, compresores)'},
  D:{par:'par de arranque ≈275–280% del nominal (muy alto)',deslizamiento:'deslizamiento alto, 5–13%',uso:'cargas de alta inercia o pulsantes (prensas, grúas, volantes de inercia)'},
};
const REF_NAMEPLATE={hp:10,v:220,hz:60,rpm:1750,fp:0.86,fs:1.15,cod:'F',dis:'B',fases:3};

const HP_POOL=[5,10,20,50];
const V_POOL=[220,440];
const FS_POOL=[1.0,1.15,1.25];
const CARGA_POOL=[
  {nombre:'Ventilador centrífugo',diseno:'B',detalle:'arranque suave, el par resistente crece con la velocidad'},
  {nombre:'Banda transportadora cargada',diseno:'C',detalle:'arranque bajo carga; requiere par elevado desde el reposo con corriente limitada'},
  {nombre:'Prensa mecánica con volante',diseno:'D',detalle:'carga de alta inercia y pulsante; necesita el mayor par y deslizamiento de arranque'},
];
const AMBIENTE_POOL=[
  {nombre:'Servicio continuo estándar',fsMin:1.0},
  {nombre:'Servicio con sobrecargas ocasionales',fsMin:1.15},
];
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function failLabel(m){
  return m==='hp'?'HP insuficiente':m==='fs'?'Factor de Servicio insuficiente':m==='corriente'?'corriente de arranque excede el límite':m==='diseno'?'Diseño NEMA no adecuado para la carga':'—';
}

/* ---------- 2 · Estado ---------- */
let mode='explora';
let hpSel=10, vSel=220, letterIdx=5, fsSel=1.0;   // letterIdx=5 → 'F'
let scenario=null, candidate=null, retoSolved=false;
let autoRunning=false;

function newChallenge(){
  const hpReq=pick(HP_POOL), vLL=pick(V_POOL), carga=pick(CARGA_POOL), ambiente=pick(AMBIENTE_POOL);
  const iArranqueMax=Math.round(lockedRotorRange(hpReq,vLL,'H').iHi/10)*10;
  const modes=['ninguno','hp','corriente','diseno'].concat(ambiente.fsMin===1.15?['fs']:[]);
  const failMode=pick(modes);
  let candHp=hpReq, candLetter='F', candDiseno=carga.diseno, candFs=ambiente.fsMin;
  if(failMode==='hp')candHp=Math.round(hpReq*0.6);
  else if(failMode==='fs')candFs=1.0;
  else if(failMode==='corriente')candLetter=pick(['R','S','T','U','V']);
  else if(failMode==='diseno'){const otros=['B','C','D'].filter(x=>x!==carga.diseno);candDiseno=pick(otros);}
  const plate={hp:candHp,v:vLL,hz:60,rpm:1750,fp:0.86,fs:candFs,cod:candLetter,dis:candDiseno,fases:3};
  scenario={hpReq,vLL,carga,ambiente,iArranqueMax,failMode};
  candidate={plate};
  retoSolved=false;
}
function currentNameplate(){
  if(mode==='reto'&&candidate)return candidate.plate;
  if(mode==='corriente')return{...REF_NAMEPLATE,hp:hpSel,v:vSel,cod:CODE_LETTERS[letterIdx][0]};
  if(mode==='fs')return{...REF_NAMEPLATE,hp:hpSel,fs:fsSel};
  return REF_NAMEPLATE;
}
function verdictExplain(){
  const s=scenario;
  if(s.failMode==='ninguno')return 'El candidato cumple HP≥'+s.hpReq+' HP, FS≥'+s.ambiente.fsMin.toFixed(2)+', corriente de arranque ≤'+s.iArranqueMax+' A y Diseño '+s.carga.diseno+'.';
  if(s.failMode==='hp')return 'El candidato ofrece '+candidate.plate.hp+' HP, por debajo de los '+s.hpReq+' HP requeridos por la carga.';
  if(s.failMode==='fs')return 'El candidato tiene FS='+candidate.plate.fs.toFixed(2)+', por debajo del mínimo '+s.ambiente.fsMin.toFixed(2)+' exigido por el ambiente de operación.';
  if(s.failMode==='corriente'){const r=lockedRotorRange(candidate.plate.hp,candidate.plate.v,candidate.plate.cod);return 'Con letra '+candidate.plate.cod+', la corriente de arranque llega hasta ≈'+r.iHi.toFixed(0)+' A, por encima del máximo permitido de '+s.iArranqueMax+' A.';}
  return 'El candidato es Diseño '+candidate.plate.dis+', pero la carga ('+s.carga.nombre+') requiere Diseño '+s.carga.diseno+' ('+s.carga.detalle+').';
}

/* ---------- 3 · Materiales ---------- */
const alu=castAluminum(), brushed=brushedMetal();
const MAT={
  frame:std({color:0x232a2e,roughness:0.95,metalness:0}),
  body:std({map:alu.map,roughnessMap:alu.roughnessMap,normalMap:alu.normalMap,color:0xaeb4b8,metalness:0.55,roughness:0.6}),
  bell:std({map:brushed.map,roughnessMap:brushed.roughnessMap,normalMap:brushed.normalMap,color:0x9aa1a6,metalness:0.7,roughness:0.4}),
  box:std({color:0x2c3338,roughness:0.6,metalness:0.4}),
  plate:std({color:0xd8b24a,roughness:0.3,metalness:0.7}),
  base:std({color:0x1c2226,roughness:0.7,metalness:0.3}),
};

/* ---------- 4 · Tablero: placa de datos dibujada en canvas ---------- */
const boardCv=document.createElement('canvas');boardCv.width=1000;boardCv.height=760;
const boardTex=new THREE.CanvasTexture(boardCv);boardTex.colorSpace=THREE.SRGBColorSpace;
boardTex.minFilter=THREE.LinearFilter;boardTex.generateMipmaps=false;
function rr(c,x,y,w,h,r,fill,stroke,lw){c.beginPath();c.roundRect(x,y,w,h,r);
  if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw||2;c.stroke();}}
function wrapText(c,text,x,y,maxW,lh){
  const words=text.split(' ');let line='',yy=y;
  words.forEach(w=>{const test=line+w+' ';
    if(c.measureText(test).width>maxW&&line){c.fillText(line,x,yy);line=w+' ';yy+=lh;}else line=test;});
  c.fillText(line,x,yy);
}
const NP_FIELDS=[
  {key:'hp',label:'HP nominal',x:30,y:110,w:300,h:140,fmt:np=>np.hp+' HP'},
  {key:'v',label:'Voltios (V)',x:350,y:110,w:300,h:140,fmt:np=>np.v+' V'},
  {key:'hz',label:'Frecuencia',x:670,y:110,w:300,h:140,fmt:np=>np.hz+' Hz'},
  {key:'rpm',label:'RPM nominal',x:30,y:264,w:300,h:140,fmt:np=>np.rpm+' rpm'},
  {key:'fp',label:'Factor de potencia',x:350,y:264,w:300,h:140,fmt:np=>np.fp.toFixed(2)},
  {key:'efic',label:'Eficiencia nominal',x:670,y:264,w:300,h:140,fmt:np=>efficiencyDisplay(np.hp)},
  {key:'fs',label:'Factor de Servicio',x:30,y:418,w:300,h:140,fmt:np=>np.fs.toFixed(2)},
  {key:'cod',label:'Letra de Código',x:350,y:418,w:300,h:140,fmt:np=>np.cod},
  {key:'dis',label:'Diseño NEMA',x:670,y:418,w:300,h:140,fmt:np=>np.dis},
];
const FIELD_INFO={
  hp:'Potencia nominal en el eje (HP). Es la base para el HP continuo permitido (HP×FS) y para dimensionar la carga mecánica que puede mover el motor.',
  v:'Voltaje nominal de línea del bobinado. Alimentar a un voltaje distinto altera la corriente y el par disponibles.',
  hz:'Frecuencia nominal de la red (60 Hz en México). Junto con el número de polos define la velocidad síncrona.',
  rpm:'Velocidad nominal a plena carga; siempre algo menor que la síncrona por el deslizamiento propio del motor de inducción.',
  fp:'Factor de potencia nominal (cosφ): relaciona potencia activa y aparente, afecta la corriente de línea para una potencia dada.',
  efic:'Eficiencia nominal a plena carga declarada por el fabricante. ⚠ NOM-016-ENER-2025 (Tabla 1) y las clases IE (IEC 60034-30-1) son DOS sistemas distintos — no se deben mezclar.',
  fs:'Factor de Servicio (FS, NEMA MG-1): margen de sobrecarga continua permitida sobre el HP nominal. No es una recomendación de operación continua por encima de FS=1.00.',
  cod:'Letra de Código NEMA (kVA por HP a rotor bloqueado): define el rango de corriente de arranque esperado — clave para dimensionar la protección contra sobrecorriente.',
  dis:'Diseño NEMA (B, C o D): describe el par de arranque, el par máximo y el deslizamiento típicos — determina si el motor es apto para el tipo de carga.',
};
function onFieldClick(key){
  const np=currentNameplate();
  let extra='';
  if(key==='cod'){
    const e=CODE_LETTERS.find(x=>x[0]===np.cod),r=lockedRotorRange(np.hp,np.v,np.cod);
    extra=' Para esta placa (letra '+np.cod+', '+np.hp+' HP, '+np.v+' V): kVA/HP '+e[1].toFixed(2)+'–'+e[2].toFixed(2)+' ⇒ I arranque ≈ '+r.iLo.toFixed(0)+'–'+r.iHi.toFixed(0)+' A.';
  }else if(key==='dis'){
    const d=DESIGN_LETTERS[np.dis];
    extra=' Diseño '+np.dis+': '+d.par+', '+d.deslizamiento+' — típico en '+d.uso+'.';
  }else if(key==='fs'){
    extra=' '+fsQualitativeNote(np.fs);
  }else if(key==='efic'){
    extra=' Valor mostrado: '+efficiencyDisplay(np.hp)+'.';
  }
  showToast(FIELD_INFO[key]+extra);
  synth.beep(880,.06,.05);
}
function drawField(c,f,np){
  const active=(mode==='corriente'&&(f.key==='hp'||f.key==='v'||f.key==='cod'))||(mode==='fs'&&(f.key==='hp'||f.key==='fs'));
  const fill=active?'#0f2620':'#0c1512', stroke=active?'#4FD1C5':'#1E3A34';
  rr(c,f.x,f.y,f.w,f.h,10,fill,stroke,active?3:2);
  c.font='13px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText(f.label,f.x+16,f.y+26);
  c.font='bold 30px system-ui';c.fillStyle='#EAF4F1';
  c.fillText(f.fmt(np),f.x+16,f.y+f.h/2+18);
}
function drawFooter(c,np){
  rr(c,30,572,940,168,10,'#0c1512','#1E3A34',2);
  if(mode==='explora'){
    c.font='bold 15px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
    c.fillText('NOM-016-ENER-2025 · Tabla 1 (puntos ancla verificados, trifásico 4 polos):',44,598);
    c.font='14px system-ui';c.fillStyle='#EAF4F1';
    c.fillText('1 HP → 85.5%   ·   10 HP → 91.7%   ·   50 HP → 94.5%   ·   500 HP → 96.2%',44,624);
    c.font='13px system-ui';c.fillStyle='#FFB703';
    wrapText(c,'⚠ NOM-016-ENER-2025 define su propia Tabla 1 de % mínimo — NO usa las etiquetas internacionales IE1–IE4 (IEC 60034-30-1); la norma aclara que no buscó concordancia con otra norma.',44,650,900,20);
    c.font='13px system-ui';c.fillStyle='#8FB3AC';
    c.fillText('Haz clic en cada casilla de la placa para conocer su significado.',44,718);
  }else if(mode==='corriente'){
    const r=lockedRotorRange(np.hp,np.v,np.cod),e=CODE_LETTERS.find(x=>x[0]===np.cod);
    c.font='bold 16px system-ui';c.fillStyle='#4FD1C5';c.textAlign='left';
    c.fillText('I arranque (rotor bloqueado) ≈ '+r.iLo.toFixed(0)+'–'+r.iHi.toFixed(0)+' A',44,600);
    c.font='13px system-ui';c.fillStyle='#8FB3AC';
    c.fillText('I_LR = (kVA/HP del rango de la letra × HP × 1000) / (√3 × V)',44,626);
    c.fillText('Letra '+np.cod+': kVA/HP entre '+e[1].toFixed(2)+' y '+e[2].toFixed(2)+' (NEMA MG-1).',44,650);
    c.fillStyle='#FFB703';
    wrapText(c,'⚠ La letra de código NO es la corriente nominal de placa (FLA): describe el arranque, no la marcha.',44,678,900,20);
  }else if(mode==='fs'){
    const hpc=continuousHP(np.hp,np.fs);
    c.font='bold 16px system-ui';c.fillStyle='#4FD1C5';c.textAlign='left';
    c.fillText('HP continuo permitido ≈ HP × FS = '+np.hp+' × '+np.fs.toFixed(2)+' = '+hpc.toFixed(2)+' HP',44,600);
    c.font='13px system-ui';c.fillStyle='#8FB3AC';
    wrapText(c,fsQualitativeNote(np.fs),44,628,900,20);
  }else{
    const s=scenario;
    c.font='bold 15px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
    c.fillText('Requisitos: '+s.carga.nombre+' · '+s.ambiente.nombre,44,598);
    c.font='13px system-ui';
    c.fillText('HP requerido ≥ '+s.hpReq+' HP  ·  Diseño NEMA requerido: '+s.carga.diseno+' ('+s.carga.detalle+')',44,624);
    c.fillText('FS mínimo: '+s.ambiente.fsMin.toFixed(2)+'  ·  Corriente de arranque máxima permitida: '+s.iArranqueMax+' A',44,648);
    c.font='bold 14px system-ui';c.fillStyle=retoSolved?'#4FD1C5':'#FFB703';
    c.fillText(retoSolved?('Veredicto: '+(s.failMode==='ninguno'?'✔ APTO':'✘ NO APTO — '+failLabel(s.failMode))):'Analiza la placa del candidato y responde en el panel →',44,682);
  }
}
function drawBoard(){
  const c=boardCv.getContext('2d');
  const np=currentNameplate();
  c.fillStyle='#0c1512';c.fillRect(0,0,1000,760);
  c.strokeStyle='#1E3A34';c.lineWidth=3;c.strokeRect(8,8,984,744);
  c.font='bold 20px system-ui';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText('PLACA DE DATOS DEL MOTOR'+(mode==='explora'?' (referencia)':mode==='reto'?' — CANDIDATO':''),30,42);
  if(mode==='reto'){c.textAlign='right';c.fillStyle='#FFB703';
    c.fillText(retoSolved?'✔ RESUELTO':'🎯 ANALIZA Y DECIDE',970,42);c.textAlign='left';}
  NP_FIELDS.forEach(f=>drawField(c,f,np));
  drawFooter(c,np);
  boardTex.needsUpdate=true;
}
function boardClick(u,v){
  const x=u*1000,y=(1-v)*760;
  const hit=NP_FIELDS.find(f=>x>=f.x&&x<=f.x+f.w&&y>=f.y&&y<=f.y+f.h);
  if(hit)onFieldClick(hit.key);
}

/* ---------- 5 · Escena 3D: tablero + motor de banco (modesto) ---------- */
const boardG=new THREE.Group();boardG.position.set(-0.95,0,-0.95);boardG.rotation.y=0.14;S.scene.add(boardG);
const BOARD_W=3.6,BOARD_H=3.6*(760/1000);
const bFrame=roundedBox(BOARD_W+0.22,BOARD_H+0.22,0.12,MAT.frame,0.03);
bFrame.position.set(0,1.9,0);boardG.add(bFrame);
const board=new THREE.Mesh(new THREE.PlaneGeometry(BOARD_W,BOARD_H),new THREE.MeshBasicMaterial({map:boardTex,toneMapped:false}));
board.position.set(0,1.9,0.065);boardG.add(board);
board.userData={title:'Placa de datos (toca cada casilla)'};
[-1,1].forEach(sx=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,1.9,12),MAT.frame);
  leg.position.set(sx*(BOARD_W/2-0.15),0.95,-0.05);boardG.add(leg);});
const footBar=roundedBox(BOARD_W*0.7,0.06,0.22,MAT.frame,0.02);
footBar.position.set(0,0.05,-0.05);boardG.add(footBar);

const motG=new THREE.Group();motG.position.set(1.6,0.62,1.05);motG.rotation.y=-0.35;S.scene.add(motG);
const body=new THREE.Mesh(new THREE.CylinderGeometry(0.42,0.42,1.35,28),MAT.body);
body.rotation.z=Math.PI/2;motG.add(body);
body.userData={act:'motorBody',title:'Carcasa del motor (toca para inspeccionar)'};
[[-0.72,0.30],[0.72,0.44]].forEach(([x,r2])=>{
  const bell=new THREE.Mesh(new THREE.CylinderGeometry(0.44,r2,0.16,28),MAT.bell);
  bell.rotation.z=Math.PI/2;bell.position.x=x;motG.add(bell);});
const fanCover=new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.44,0.22,28,1,true),MAT.bell);
fanCover.rotation.z=Math.PI/2;fanCover.position.x=-0.86;motG.add(fanCover);
const fanBlade=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.02,16),MAT.base);
fanBlade.rotation.z=Math.PI/2;fanBlade.position.x=-0.9;motG.add(fanBlade);
const condBox=roundedBox(0.28,0.24,0.24,MAT.box,0.03);
condBox.position.set(0.05,0.5,0);motG.add(condBox);
condBox.userData={act:'condBox',title:'Caja de conexión / terminal box (toca para inspeccionar)'};
const plateMesh=roundedBox(0.22,0.14,0.01,MAT.plate,0.01);
plateMesh.position.set(0.35,0.2,0.4);plateMesh.rotation.y=0.5;motG.add(plateMesh);
plateMesh.userData={act:'plateMount',title:'Punto de montaje de la placa real (toca para entender por qué usamos el tablero grande)'};
const baseRail=roundedBox(1.7,0.1,0.5,MAT.base,0.03);
baseRail.position.set(0,-0.48,0);motG.add(baseRail);
[boardG,motG].forEach(g=>g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}}));
board.castShadow=false;

/* ---------- 6 · HUD + panel ---------- */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Transformadores y máquinas eléctricas (D5)</div>
  <h2>Placas de datos y selección de motores</h2>
  <p>La placa de datos de un motor eléctrico condensa la información normada (NEMA MG-1) que un
  técnico necesita para operarlo con seguridad y seleccionarlo correctamente: potencia, voltaje,
  velocidad, eficiencia, margen de sobrecarga (FS), rango de corriente de arranque (letra de código)
  y el tipo de par disponible (Diseño NEMA). Explora cada campo, calcula rangos y decide si un motor
  candidato es apto para una aplicación real.</p>
  <div class="formula">I_LR = (kVA/HP de la letra × HP × 1000) / (√3 × V_línea)<br>
  HP continuo permitido = HP nominal × FS</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Campos de la placa (haz clic en el tablero)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Corriente de arranque / HP continuo (calculados)</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Requisitos de la aplicación (modo Reto)</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> las 19 letras de código NEMA MG-1 (A a V, sin I ni O) y sus rangos exactos
  de kVA/HP · la fórmula de corriente de arranque a rotor bloqueado · el Factor de Servicio como margen
  de sobrecarga (no como punto de operación continua) · los Diseños NEMA B/C/D con su par y deslizamiento
  típicos · los 4 puntos ancla verificados de la Tabla 1 de NOM-016-ENER-2025 · la distinción explícita
  entre NOM-016 y las clases IE de IEC 60034-30-1 (dos sistemas distintos).<br>
  <span class="no">NO:</span> la Tabla 1 completa de NOM-016 (solo 4 puntos ancla) · la curva de vida del
  aislamiento en función de la sobrecarga térmica · la derivación de la letra de código a partir del
  diseño interno del motor (se usa como dato de placa) · voltajes/frecuencias fuera de 220/440 V y 60 Hz.</div>
  <div class="src">Ref: NEMA MG-1 (letras de código, FS, Diseños B/C/D) · NOM-016-ENER-2025 (DOF
  19/08/2025, vigente 15/02/2026, Tabla 1) · IEC 60034-30-1 (clases IE, solo como referencia contextual)</div>`;
document.getElementById('panel').innerHTML=`
  <h4>Placas de datos · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_corriente">⚡ Código</button>
    <button class="b" id="m_fs">📈 FS</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>

  <div id="ctrlHp" style="display:none">
    <div style="font-size:12px;margin:6px 0 2px">HP nominal</div>
    <div class="modebar" style="margin-bottom:8px">
      <button class="b on" id="hp0">5</button><button class="b" id="hp1">10</button>
      <button class="b" id="hp2">20</button><button class="b" id="hp3">50</button>
    </div>
  </div>
  <div id="ctrlV" style="display:none">
    <div style="font-size:12px;margin:6px 0 2px">Voltaje de línea</div>
    <div class="modebar" style="margin-bottom:8px">
      <button class="b on" id="v0">220 V</button><button class="b" id="v1">440 V</button>
    </div>
  </div>
  <div id="ctrlCod" style="display:none">
    <div style="font-size:12px;margin:6px 0 2px">Letra de código · <b id="codVal" class="mono">—</b></div>
    <input type="range" id="sCod" min="0" max="18" step="1" value="5" style="width:100%;accent-color:#4FD1C5;margin-bottom:8px">
  </div>
  <div id="ctrlFs" style="display:none">
    <div style="font-size:12px;margin:6px 0 2px">Factor de Servicio</div>
    <div class="modebar" style="margin-bottom:8px">
      <button class="b on" id="fsb0">1.00</button><button class="b" id="fsb1">1.15</button><button class="b" id="fsb2">1.25</button>
    </div>
  </div>

  <div id="tele">
    <div class="g"><div class="l">Modo actual</div><b id="t_mode">—</b></div>
    <div class="g"><div class="l">Motor bajo análisis</div><b id="t_motor">—</b></div>
  </div>
  <div class="console" id="report"></div>

  <div id="retoBox" style="display:none">
    <h4 class="sec">¿Es apto el candidato?</h4>
    <div class="btns" id="verdictBtns"></div>
    <div class="btns" style="margin-top:8px">
      <button class="b" id="btnNew">🔀 Nuevo candidato</button>
    </div>
  </div>

  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="quizQ" style="font-size:12px;margin-bottom:6px"></div>
  <div class="btns" id="quizOpts"></div>
  <div class="btns" style="margin-top:8px">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado</button>
  </div>`;
const el=id=>document.getElementById(id);

/* ---------- 7 · Toast ---------- */
let toastTimer=null;
function showToast(msg){const t=el('toast');t.innerHTML=msg;t.classList.add('on');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),5200);}

/* ---------- 8 · Modos ---------- */
const MODE_META={
  explora:{nombre:'Explora',cam:[[4.6,2.9,6.4],[0,1.7,-0.7]],mision:'Haz clic en cada casilla de la placa de referencia para entender qué significa cada campo.'},
  corriente:{nombre:'Código',cam:[[2.4,2.15,3.5],[-0.6,1.85,-0.9]],mision:'Ajusta HP, voltaje y letra de código — observa cómo cambia el rango de corriente de arranque.'},
  fs:{nombre:'FS',cam:[[2.4,2.15,3.5],[-0.6,1.85,-0.9]],mision:'Ajusta el Factor de Servicio y el HP — observa el HP continuo permitido.'},
  reto:{nombre:'Reto',cam:[[3.1,2.3,4.2],[-0.6,1.9,-0.85]],mision:'Lee los requisitos de la aplicación y decide si el motor candidato es apto.'},
};
function syncHpBtns(){HP_POOL.forEach((h,i)=>el('hp'+i).classList.toggle('on',h===hpSel));}
function syncVBtns(){V_POOL.forEach((v,i)=>el('v'+i).classList.toggle('on',v===vSel));}
function syncFsBtns(){FS_POOL.forEach((f,i)=>el('fsb'+i).classList.toggle('on',f===fsSel));}
function syncCodVal(){const l=CODE_LETTERS[letterIdx];el('codVal').textContent=l[0]+' ('+l[1].toFixed(2)+'–'+l[2].toFixed(2)+' kVA/HP)';}

function setMode(k){
  if(mode==='reto'&&!retoSolved&&k!=='reto'){
    showToast('<span style="color:var(--bad)">🔒 Resuelve el reto (o pide otro candidato con 🔀) antes de salir.</span>');
    synth.beep(220,0.1,0.05);
    return;
  }
  mode=k;
  ['explora','corriente','fs','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('p_mision').textContent=MODE_META[k].mision;
  el('ctrlHp').style.display=(k==='corriente'||k==='fs')?'block':'none';
  el('ctrlV').style.display=(k==='corriente')?'block':'none';
  el('ctrlCod').style.display=(k==='corriente')?'block':'none';
  el('ctrlFs').style.display=(k==='fs')?'block':'none';
  el('retoBox').style.display=(k==='reto')?'block':'none';
  if(k==='reto'&&!scenario){newChallenge();refreshVerdictBtns();}
  buildQuiz();refreshQuestion();refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}

/* ---------- 9 · Telemetría + reporte ---------- */
function set(id,txt,cls){const n=el(id);n.textContent=txt;n.classList.remove('good','warn','bad');if(cls)n.classList.add(cls);}
function updateTele(){
  const np=currentNameplate();
  set('t_mode',MODE_META[mode].nombre,'good');
  set('t_motor',np.hp+' HP · '+np.v+' V · '+np.cod+' · '+np.dis,'good');
}
function updateReport(){
  const L=[],np=currentNameplate();
  if(mode==='explora'){
    L.push('Motor de referencia: '+np.hp+' HP, '+np.v+' V, '+np.fases+'φ, '+np.hz+' Hz, '+np.rpm+' rpm, FP '+np.fp.toFixed(2)+', FS '+np.fs.toFixed(2)+', letra '+np.cod+', diseño '+np.dis+'.');
    L.push('Toca cada casilla de la placa para conocer su significado técnico.');
  }else if(mode==='corriente'){
    const r=lockedRotorRange(np.hp,np.v,np.cod);
    L.push('I arranque (rotor bloqueado) ≈ '+r.iLo.toFixed(0)+'–'+r.iHi.toFixed(0)+' A, con letra '+np.cod+' a '+np.hp+' HP / '+np.v+' V.');
    L.push('Sube o baja el HP, el voltaje o la letra para ver cómo cambia el rango.');
  }else if(mode==='fs'){
    L.push('HP continuo permitido ≈ '+np.hp+' × '+np.fs.toFixed(2)+' = '+continuousHP(np.hp,np.fs).toFixed(2)+' HP.');
    L.push(fsQualitativeNote(np.fs));
  }else{
    L.push('Candidato: '+np.hp+' HP, FS '+np.fs.toFixed(2)+', letra '+np.cod+', diseño '+np.dis+'.');
    L.push(retoSolved?verdictExplain():'Compara cada dato del candidato contra los 4 requisitos mostrados en el tablero.');
  }
  el('report').innerHTML=L.map(s=>'<div>'+s+'</div>').join('');
}
function refreshAll(){drawBoard();updateTele();updateReport();}

/* ---------- 10 · Reto: veredicto de aptitud ---------- */
const VERDICT_OPTS=[
  {k:'ninguno',t:'✔ Apto — cumple los 4 criterios'},
  {k:'hp',t:'✘ No apto — HP insuficiente'},
  {k:'fs',t:'✘ No apto — Factor de Servicio insuficiente'},
  {k:'corriente',t:'✘ No apto — corriente de arranque excede el límite'},
  {k:'diseno',t:'✘ No apto — Diseño NEMA no adecuado para la carga'},
];
function refreshVerdictBtns(){
  const bx=el('verdictBtns');bx.innerHTML='';
  VERDICT_OPTS.forEach(o=>{
    const b=document.createElement('button');b.className='b dx';b.textContent=o.t;
    b.onclick=()=>checkVerdict(o.k);
    bx.appendChild(b);
  });
}
function checkVerdict(k){
  if(retoSolved)return;
  const btns=[...el('verdictBtns').children];
  const idx=VERDICT_OPTS.findIndex(o=>o.k===k);
  if(k===scenario.failMode){
    retoSolved=true;
    btns[idx].classList.add('right');btns.forEach(b=>b.disabled=true);
    showToast('<span class="ok">✔ Correcto.</span> '+verdictExplain());
    synth.beep(880,.1,.08);setTimeout(()=>synth.beep(1175,.15,.08),140);
  }else{
    btns[idx].classList.add('wrong');
    showToast('✘ Aún no. Revisa los 4 criterios con calma: HP, FS, corriente de arranque y Diseño NEMA.');
    synth.beep(220,.15,.08);
  }
  refreshAll();
}
function startNewChallenge(){
  newChallenge();refreshVerdictBtns();buildQuiz();refreshQuestion();refreshAll();
  showToast('Nuevo motor candidato servido. Analiza la placa y decide si es apto.');
}

/* ---------- 11 · Quiz de ingeniería ---------- */
function shuffle(arr){const a2=arr.slice();
  for(let i=a2.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a2[i],a2[j]]=[a2[j],a2[i]];}
  return a2;}
let QUIZ={};
function buildQuiz(){
  QUIZ.explora={pregunta:'¿La norma mexicana NOM-016-ENER-2025 usa las etiquetas internacionales IE1–IE4 para clasificar la eficiencia de los motores?',
    opciones:shuffle([
      {t:'No: define su propia Tabla 1 de eficiencia mínima y aclara que no buscó concordancia con otra norma internacional',ok:true,why:'Correcto: NOM-016-ENER-2025 declara explícitamente que su Tabla 1 es un sistema propio, distinto de las clases IE de IEC 60034-30-1.'},
      {t:'Sí: NOM-016 adoptó directamente las clases IE1 a IE4 de IEC 60034-30-1',ok:false,why:'No — NOM-016-ENER-2025 usa su propia Tabla 1 de porcentajes mínimos, no las etiquetas IE1–IE4.'},
      {t:'Sí, pero solo para motores trifásicos de más de 100 HP',ok:false,why:'La Tabla 1 de NOM-016 aplica por rango de potencia con sus propios valores, pero en ningún caso usa las etiquetas IE1–IE4.'},
      {t:'No aplica a motores eléctricos, solo a electrodomésticos',ok:false,why:'NOM-016-ENER-2025 es precisamente la norma mexicana de eficiencia energética para motores eléctricos.'},
    ])};
  const letter=CODE_LETTERS[letterIdx][0],r=lockedRotorRange(hpSel,vSel,letter),e=CODE_LETTERS[letterIdx];
  const otherIdx=(letterIdx+6)%CODE_LETTERS.length,otherLetter=CODE_LETTERS[otherIdx][0],r2=lockedRotorRange(hpSel,vSel,otherLetter);
  QUIZ.corriente={pregunta:'Con '+hpSel+' HP, '+vSel+' V y letra de código '+letter+' (kVA/HP '+e[1].toFixed(2)+'–'+e[2].toFixed(2)+'), ¿cuál es el rango de corriente de arranque a rotor bloqueado?',
    opciones:shuffle([
      {t:'≈ '+r.iLo.toFixed(0)+'–'+r.iHi.toFixed(0)+' A',ok:true,why:'Correcto: I_LR = (kVA/HP × HP × 1000)/(√3 × V), evaluado en los dos extremos del rango de la letra de código.'},
      {t:'Es la misma que la corriente nominal de placa (FLA)',ok:false,why:'No: la letra de código describe la corriente de ARRANQUE (rotor bloqueado), varias veces mayor que la corriente nominal de marcha (FLA).'},
      {t:'≈ '+r2.iLo.toFixed(0)+'–'+r2.iHi.toFixed(0)+' A (rango de la letra '+otherLetter+')',ok:false,why:'Ese rango corresponde a la letra '+otherLetter+', no a la letra '+letter+' seleccionada.'},
      {t:'No se puede calcular sin conocer la eficiencia del motor',ok:false,why:'La corriente de arranque a rotor bloqueado se calcula con el kVA/HP de la letra de código, el HP y el voltaje — la eficiencia no interviene en esta fórmula.'},
    ])};
  QUIZ.fs={pregunta:'¿Qué es el Factor de Servicio (FS) de un motor según NEMA MG-1?',
    opciones:shuffle([
      {t:'Un margen de sobrecarga continua permitida sobre el HP nominal — no una recomendación de operación continua por encima de FS=1.00',ok:true,why:'Correcto: FS es un margen para sobrecargas ocasionales; operar sostenidamente por encima del HP nominal reduce la vida térmica del aislamiento.'},
      {t:'La eficiencia mínima garantizada por el fabricante',ok:false,why:'Eso es la eficiencia nominal (otro campo de la placa) — el FS es un multiplicador de potencia, no un porcentaje de eficiencia.'},
      {t:'El número máximo de arranques por hora permitidos',ok:false,why:'Ese es otro parámetro (ciclos de arranque), no lo que mide el Factor de Servicio.'},
      {t:'El factor por el que se reduce el par de arranque',ok:false,why:'El FS no afecta directamente el par de arranque — es un margen de potencia continua, no un factor de reducción de par.'},
    ])};
  if(scenario){
    QUIZ.reto={pregunta:'De los siguientes, ¿cuál NO es uno de los 4 criterios que este simulador evalúa para decidir si un motor candidato es apto?',
      opciones:shuffle([
        {t:'La eficiencia energética exacta declarada en la placa',ok:true,why:'Correcto: la eficiencia se muestra de forma informativa, pero NO es uno de los 4 criterios de aprobación de este reto.'},
        {t:'Que el HP nominal alcance el HP requerido por la carga',ok:false,why:'Sí es uno de los 4 criterios evaluados.'},
        {t:'Que el Factor de Servicio cumpla el mínimo exigido por el ambiente de operación',ok:false,why:'Sí es uno de los 4 criterios evaluados.'},
        {t:'Que la corriente de arranque no exceda el máximo permitido por la protección',ok:false,why:'Sí es uno de los 4 criterios evaluados (junto con el Diseño NEMA adecuado a la carga).'},
      ])};
  }
}
function refreshQuestion(){
  const q=QUIZ[mode];const bx=el('quizOpts');bx.innerHTML='';
  if(!q){el('quizQ').textContent='';return;}
  el('quizQ').textContent=q.pregunta;
  q.opciones.forEach((o,i)=>{
    const b=document.createElement('button');b.className='b dx';b.textContent='ABCD'[i]+') '+o.t;
    b.onclick=()=>{if(b.classList.contains('right')||b.classList.contains('wrong'))return;
      b.classList.add(o.ok?'right':'wrong');
      showToast((o.ok?'✔ ':'✘ ')+o.why);synth.beep(o.ok?980:220,.12,.07);};
    bx.appendChild(b);
  });
}

/* ---------- 12 · Picking, recorrido guiado, animación e init ---------- */
pickerFor(S.scene,S.camera,S.renderer.domElement,hit=>{
  if(hit.object===board&&hit.uv){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object,act=null;
  while(o){if(o.userData&&o.userData.act){act=o.userData.act;break;}o=o.parent;}
  if(!act)return;
  synth.beep(700,.05,.05);
  if(act==='motorBody')showToast('Carcasa (marco NEMA): aloja el estátor y disipa el calor por sus aletas. El tamaño de marco (frame size) está normalizado por NEMA MG-1 y se relaciona con la altura del eje.');
  else if(act==='condBox')showToast('Caja de conexión: aquí se conectan las líneas de alimentación a las terminales del devanado; el diagrama de conexión Y/Δ suele venir grabado en la tapa.');
  else if(act==='plateMount')showToast('Aquí iría la placa de datos real (grabada, ilegible a esta distancia). Este simulador usa el tablero grande para que puedas leer y analizar cada campo con claridad.');
});
(function(){ // hover con etiquetas nativas
  const ray=new THREE.Raycaster(),p=new THREE.Vector2(),dom=S.renderer.domElement;
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    p.x=((e.clientX-r.left)/r.width)*2-1;p.y=-((e.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(p,S.camera);
    const hits=ray.intersectObjects(S.scene.children,true);
    let tt=null;
    for(const h of hits){let o=h.object;
      while(o){if(o.userData&&o.userData.title){tt=o.userData.title;break;}o=o.parent;}
      if(tt)break;}
    dom.style.cursor=tt?'pointer':'default';dom.title=tt||'';
  });
})();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const b=el('btnAuto');b.disabled=true;b.textContent='✨ Recorriendo…';
  try{
    synth.init();synth.resume();
    setMode('explora');
    showToast('1/4 · Explora: cada casilla de la placa es un dato normado — toca varias para conocer su significado.');
    await sleep(2600);
    onFieldClick('cod');await sleep(2400);
    onFieldClick('fs');await sleep(2600);
    setMode('corriente');
    showToast('2/4 · Código: la letra de código NEMA acota el rango de corriente de arranque a rotor bloqueado.');
    await sleep(1200);
    hpSel=20;syncHpBtns();vSel=220;syncVBtns();letterIdx=CODE_LETTERS.findIndex(c=>c[0]==='H');
    el('sCod').value=letterIdx;syncCodVal();buildQuiz();refreshQuestion();refreshAll();
    await sleep(2800);
    setMode('fs');
    showToast('3/4 · FS: el Factor de Servicio es un margen de sobrecarga, no un punto de operación continua.');
    await sleep(1200);
    fsSel=1.15;syncFsBtns();buildQuiz();refreshQuestion();refreshAll();
    await sleep(2600);
    setMode('reto');
    showToast('4/4 · Reto: revisa los 4 criterios (HP, FS, corriente de arranque, Diseño NEMA) antes de decidir.');
    await sleep(2600);
    if(!retoSolved)checkVerdict(scenario.failMode);
    await sleep(2400);
    startNewChallenge();
    showToast('Recorrido completo: te dejo un motor candidato nuevo sin resolver — analízalo tú.');
  }finally{autoRunning=false;b.disabled=false;b.textContent='✨ Recorrido guiado';}
}
S.setAnimate(()=>{fanBlade.rotation.x+=0.02;});

/* wiring */
['explora','corriente','fs','reto'].forEach(m=>el('m_'+m).onclick=()=>setMode(m));
HP_POOL.forEach((h,i)=>{el('hp'+i).onclick=()=>{hpSel=h;syncHpBtns();buildQuiz();refreshQuestion();refreshAll();};});
V_POOL.forEach((v,i)=>{el('v'+i).onclick=()=>{vSel=v;syncVBtns();buildQuiz();refreshQuestion();refreshAll();};});
FS_POOL.forEach((f,i)=>{el('fsb'+i).onclick=()=>{fsSel=f;syncFsBtns();buildQuiz();refreshQuestion();refreshAll();};});
el('sCod').addEventListener('input',()=>{letterIdx=parseInt(el('sCod').value,10);syncCodVal();buildQuiz();refreshQuestion();refreshAll();});
el('btnNew').onclick=startNewChallenge;
el('btnAuto').onclick=runAuto;

/* init */
syncHpBtns();syncVBtns();syncFsBtns();syncCodVal();refreshVerdictBtns();
S.start();setMode('explora');
window.__labDebug={
  state:()=>({mode,hpSel,vSel,letter:CODE_LETTERS[letterIdx][0],fsSel,scenario:scenario?{...scenario}:null,candidate:candidate?{plate:{...candidate.plate}}:null,retoSolved}),
  lockedRotorRange,continuousHP,efficiencyDisplay,
  onFieldClick,boardClick,
  setMode,mode:()=>mode,
  checkVerdict,newChallenge:startNewChallenge,
  setHp:v=>{hpSel=v;syncHpBtns();buildQuiz();refreshQuestion();refreshAll();},
  setV:v=>{vSel=v;syncVBtns();buildQuiz();refreshQuestion();refreshAll();},
  setFs:v=>{fsSel=v;syncFsBtns();buildQuiz();refreshQuestion();refreshAll();},
  setLetter:l=>{letterIdx=CODE_LETTERS.findIndex(c=>c[0]===l);el('sCod').value=letterIdx;syncCodVal();buildQuiz();refreshQuestion();refreshAll();},
};
