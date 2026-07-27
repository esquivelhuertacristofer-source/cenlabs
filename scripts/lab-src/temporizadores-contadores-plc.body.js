// Temporizadores y contadores de PLC (IEC 61131-3): TON, TOF, TP, CTU y CTD, y su uso en SECUENCIAS
// de etapas temporizadas con contador de lotes (D3 · digital). Motor verificado numéricamente
// (verify_timers.mjs, 33/33) y pegado aquí VERBATIM: simulación y verificación comparten implementación.
//   BASE DE TIEMPO: DT = 100 ms por ciclo de scan (idealizado, sin jitter).
//   TON (on-delay):  Q sube PT después de que IN se puso a 1 y sigue a IN a la caída. Si IN cae antes
//     de PT, ET se borra y hay que empezar de cero.
//   TOF (off-delay): Q sube con IN y cae PT después de que IN se puso a 0. Es REDISPARABLE.
//     Arranca con ET precargado en PT ⇒ Q=0 al energizar el PLC.
//   TP  (pulse):     un flanco de subida genera un pulso de duración PT exacta; NO es redisparable
//     (los flancos durante el pulso se ignoran) y con IN aún alto queda en HOLD hasta que IN caiga.
//   CTU/CTD:         cuentan FLANCOS de subida, no niveles. CTU: Q = CV ≥ PV, R dominante, CV satura
//     en 32767. CTD: LD carga PV, Q = CV ≤ 0 (sin carga previa Q ya está activa: trampa clásica).
//   SECUENCIA: cascada de TON; cada etapa dura EXACTAMENTE su PT porque el temporizador de etapa se
//     re-arma en el mismo scan de la transición. Un CTU cuenta los ciclos y detiene el lote en PV.
//   Ref: IEC 61131-3 (bloques funcionales estándar TON/TOF/TP/CTU/CTD) · Petruzella, "Programmable
//        Logic Controllers" · Bolton, "Programmable Logic Controllers" · Hackworth · verif. propia.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.8,2.9,7.0],target:[0.4,1.05,0.3],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.44,minD:3.2,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. MOTOR IEC 61131-3 (VERIFICADO 33/33) =====================
const DT=100; // ms por ciclo de scan (base de tiempo idealizada)

function newT(kind,pt){
  if(kind==='TOF')return {kind,et:pt,q:false,prev:false};
  if(kind==='TP')return {kind,st:'IDLE',et:0,q:false,prev:false};
  return {kind:'TON',et:0,q:false,prev:false};
}
function newC(kind){return {kind,cv:0,q:kind==='CTD',prev:false};}

function stepTON(s,IN,pt,dt){
  if(!IN)s.et=0;
  else if(!s.prev)s.et=0;                              // flanco de subida: arranca en 0
  else if(s.et<pt)s.et=Math.min(pt,s.et+dt);           // ET satura en PT
  s.q=IN&&s.et>=pt;
  s.prev=IN;return s.q;
}
function stepTOF(s,IN,pt,dt){
  if(IN)s.et=0;
  else if(s.prev)s.et=0;                               // flanco de bajada: arranca en 0
  else if(s.et<pt)s.et=Math.min(pt,s.et+dt);
  s.q=IN||s.et<pt;
  s.prev=IN;return s.q;
}
function stepTP(s,IN,pt,dt){
  if(s.st==='PULSE'){if(s.et<pt)s.et=Math.min(pt,s.et+dt);}
  else if(s.st==='IDLE'&&IN&&!s.prev){s.st='PULSE';s.et=0;}   // no redisparable
  if(s.st==='PULSE'&&s.et>=pt)s.st=IN?'HOLD':'IDLE';
  if(s.st==='HOLD'&&!IN)s.st='IDLE';
  if(s.st==='IDLE')s.et=0;
  if(s.st==='HOLD')s.et=pt;
  s.q=(s.st==='PULSE');
  s.prev=IN;return s.q;
}
function stepT(s,IN,pt,dt){
  return s.kind==='TON'?stepTON(s,IN,pt,dt):s.kind==='TOF'?stepTOF(s,IN,pt,dt):stepTP(s,IN,pt,dt);
}
function stepCTU(s,CU,R,pv){
  if(R)s.cv=0;
  else if(CU&&!s.prev)s.cv=Math.min(32767,s.cv+1);
  s.q=s.cv>=pv;s.prev=CU;return s.q;
}
function stepCTD(s,CD,LD,pv){
  if(LD)s.cv=pv;
  else if(CD&&!s.prev)s.cv=Math.max(-32768,s.cv-1);
  s.q=s.cv<=0;s.prev=CD;return s.q;
}
// ---- secuencia de etapas temporizadas + contador de lotes ----
// Cada etapa dura EXACTAMENTE su PT: al terminar, el temporizador de etapa se re-arma en el mismo
// scan (flanco de subida con ET=0) para la etapa siguiente.
function newSeq(){return {run:false,stage:0,t:newT('TON'),cv:0,done:false,cyc:0};}
function seqStep(s,PT,PV,dt){
  if(!s.run)return s;
  stepTON(s.t,true,PT[s.stage],dt);
  let guard=0;
  while(s.t.q&&guard++<8){
    if(s.stage===PT.length-1){
      s.cv=Math.min(9999,s.cv+1);s.cyc=s.cv;s.stage=0;
      if(s.cv>=PV){s.run=false;s.done=true;s.t=newT('TON');break;}
    }else s.stage++;
    s.t=newT('TON');
    stepTON(s.t,true,PT[s.stage],dt);
  }
  return s;
}
// corre una receta completa y devuelve las transiciones medidas (no supuestas)
function seqRun(PT,PV){
  const s=newSeq();s.run=true;const trans=[];let last=0,k=0;
  while(s.run&&k<5000){seqStep(s,PT,PV,DT);if(s.stage!==last){trans.push([k,s.stage]);last=s.stage;}k++;}
  return {scans:k,ms:(k-1)*DT,cv:s.cv,done:s.done,trans};
}

// ===================== 3. CALIFICACIÓN POR COMPORTAMIENTO (RETO) =====================
const OPT_TIPO=['TON','TOF','TP'];
const OPT_PT_ARR=[1000,2000,3000,5000];
const OPT_PT_PAR=[500,1000,1500,2000];
const OPT_CNT=['CTU','CTD','TON'];
const OPT_PV=[5,8,10,12];
const OPT_PT_CNT=[3000,5000,8000,10000];
// Cadencia IRREGULAR de piezas (scans de separación): por eso un temporizador no puede contar.
const GAPS=[3,7,2,9,4,6,2,11,5,3,8,4,6,2,9];

// A) Retardo de arranque: IN alto 80 scans (8 s). Debe encender EXACTAMENTE a tDelay y quedarse.
function behArr(tipo,pt,dt){
  const s=newT(tipo,pt);const h=[];
  for(let k=0;k<80;k++)h.push(stepT(s,true,pt,dt));
  const first=h.indexOf(true);
  return {first,hold:h[h.length-1]===true,h};
}
function okArr(tipo,pt,sc,dt){const r=behArr(tipo,pt,dt);return r.first>=0&&r.first*dt===sc.tDelay&&r.hold;}
// B) Sobre-marcha tras el paro: IN alto 30 scans y luego bajo 60. Debe estar ON al momento del paro,
//    seguir EXACTAMENTE tPurge y luego quedarse OFF. (El "atStop" evita el falso positivo clásico.)
function behPar(tipo,pt,dt){
  const s=newT(tipo,pt);const on=[],off=[];
  for(let k=0;k<30;k++)on.push(stepT(s,true,pt,dt));
  for(let k=0;k<60;k++)off.push(stepT(s,false,pt,dt));
  const offIdx=off.indexOf(false);
  return {atStop:on[on.length-1]===true,offIdx,stays:offIdx>=0&&off.slice(offIdx).every(q=>!q),on,off};
}
function okPar(tipo,pt,sc,dt){const r=behPar(tipo,pt,dt);return r.atStop&&r.offIdx>=0&&r.offIdx*dt===sc.tPurge&&r.stays;}
// C) Conteo del lote con cadencia irregular: LOTE COMPLETO debe activarse en el scan de la pieza N.
function behCnt(tipo,preset,dt){
  const scans=[];const pieceScan=[];
  for(const g of GAPS){for(let i=0;i<g;i++)scans.push(0);pieceScan.push(scans.length);scans.push(1);}
  for(let i=0;i<20;i++)scans.push(0);
  const s=tipo==='TON'?newT('TON'):newC(tipo);
  let first=-1,piecesAt=-1,pieces=0;const qs=[];
  scans.forEach((cu,i)=>{
    let q;
    if(tipo==='CTU')q=stepCTU(s,!!cu,false,preset);
    else if(tipo==='CTD')q=stepCTD(s,!!cu,false,preset);
    else q=stepTON(s,true,preset,dt);
    pieces+=cu;qs.push(q);
    if(q&&first<0){first=i;piecesAt=pieces;}
  });
  return {first,piecesAt,pieceScan,qs,scans};
}
function okCnt(tipo,preset,sc,dt){
  const r=behCnt(tipo,preset,dt);
  return r.first>=0&&r.piecesAt===sc.N&&r.first===r.pieceScan[sc.N-1];
}

// ===================== 4. ESTADO =====================
let mode='explora';
// explora — un bloque funcional conducido scan a scan
const EXP_KINDS=['TON','TOF','TP','CTU','CTD'];
const EXP_PTS=[300,500,1000,2000];
const EXP_PVS=[2,3,5];
let expKind='TON',expPT=500,expPV=3;
let expS=null,expIN=false,expHist=[];
function isCnt(k){return k==='CTU'||k==='CTD';}
// aplica
let apTopic='comparar';                  // 'comparar' | 'secuencia'
const AP_IN=[0,0,1,1,1,1,1,1,0,0,0,0,1,0,0,1,1,0,0,0,0,0,0,0];
const AP_PT=400;
const SEQ_RECIPES=[
  {name:'Reactor de mezclado',stages:['Llenado','Agitación','Vaciado'],PT:[3000,5000,2000],PV:3},
  {name:'Túnel de lavado',stages:['Prelavado','Lavado','Enjuague'],PT:[2000,4000,2000],PV:4},
  {name:'Cabina de pintura',stages:['Preparación','Aplicación','Secado'],PT:[1000,3000,6000],PV:2},
];
let apRecipe=0;
// reto — programar tres bloques de una máquina real
const RETO_POOL=[
  {name:'Cinta de embalaje',ctx:'la bomba de lubricación debe correr antes que la cinta; el extractor purga tras el paro',tDelay:2000,tPurge:1500,N:10,
   sArr:'la CINTA sólo puede arrancar cuando la bomba de lubricación lleve el tiempo indicado en marcha',sPar:'el EXTRACTOR debe seguir funcionando después del paro y detenerse solo',sCnt:'la señal LOTE COMPLETO debe activarse justo con la pieza N que pasa por el sensor'},
  {name:'Horno de secado',ctx:'el ventilador de circulación arranca primero; tras apagar, sigue purgando calor',tDelay:3000,tPurge:2000,N:8,
   sArr:'las RESISTENCIAS sólo pueden energizarse cuando el ventilador lleve el tiempo indicado girando',sPar:'el VENTILADOR debe seguir girando después del paro para purgar el calor y detenerse solo',sCnt:'la señal LOTE COMPLETO debe activarse justo con la bandeja N que sale del horno'},
  {name:'Prensa neumática',ctx:'el lubricador de línea precede a la prensa; el aspirador de viruta sigue tras el paro',tDelay:1000,tPurge:1000,N:12,
   sArr:'la PRENSA sólo puede habilitarse cuando el lubricador de línea lleve el tiempo indicado activo',sPar:'el ASPIRADOR de viruta debe seguir aspirando tras el paro y detenerse solo',sCnt:'la señal LOTE COMPLETO debe activarse justo con la pieza N prensada'},
  {name:'Molino de café',ctx:'el extractor de polvo arranca antes que el molino y sigue un instante tras el paro',tDelay:5000,tPurge:500,N:5,
   sArr:'el MOLINO sólo puede arrancar cuando el extractor de polvo lleve el tiempo indicado en marcha',sPar:'el EXTRACTOR debe seguir un instante tras el paro y detenerse solo',sCnt:'la señal LOTE COMPLETO debe activarse justo con el saco N llenado'},
];
let retoIdx=0;
let retoCh={arrT:'TP',arrP:1000,parT:'TON',parP:1000,cntT:'TON',cntP:3000};  // arranca sin resolver
let retoField='arr';
let retoChecked=false,retoOkArr=false,retoOkPar=false,retoOkCnt=false,retoSolved=false,retoMsg='';
let solved=false,autoRunning=false,QUIZ={};
let hwStep=0,hwT=0;

function pickIdx(n,ex){let v=Math.floor(Math.random()*n);if(n>1)while(v===ex)v=Math.floor(Math.random()*n);return v;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
function fmtS(ms){return (ms/1000).toFixed(ms%1000===0?1:1)+' s';}
function seedReto(idx){
  retoIdx=(idx==null)?pickIdx(RETO_POOL.length,retoIdx):idx;
  retoCh={arrT:'TP',arrP:1000,parT:'TON',parP:1000,cntT:'TON',cntP:3000};
  retoField='arr';
  retoChecked=false;retoOkArr=false;retoOkPar=false;retoOkCnt=false;retoSolved=false;retoMsg='';
}
seedReto(0);
function expReset(){
  expS=isCnt(expKind)?newC(expKind):newT(expKind,expPT);
  expIN=false;expHist=[];
}
function expScan(inVal,aux){
  expIN=!!inVal;
  let q;
  if(expKind==='CTU')q=stepCTU(expS,!!inVal,!!aux,expPV);
  else if(expKind==='CTD')q=stepCTD(expS,!!inVal,!!aux,expPV);
  else q=stepT(expS,!!inVal,expPT,DT);
  expHist.push({in:!!inVal,aux:!!aux,q,et:expS.et||0,cv:isCnt(expKind)?expS.cv:0});
  if(expHist.length>30)expHist.shift();
  hwStep=0;
}
expReset();

// ===================== 5. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
const MAT={bench:brush(0x2b2f34),frame:brush(0x22262c),leg:brush(0x14161b),pcb:std(0x123322,0.7,0.15),chip:std(0x14171b,0.5,0.3)};
const ACC='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A', VIO='#C08CF8';

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const cv=document.createElement('canvas');cv.width=256;cv.height=64;const cx=cv.getContext('2d');
  cx.fillStyle='rgba(10,14,17,0.88)';cx.fillRect(0,0,256,64);
  cx.strokeStyle=color;cx.lineWidth=2;cx.strokeRect(1,1,254,62);
  cx.fillStyle='#F4EFEA';cx.font='bold 20px Outfit, sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(text,128,32);
  const tex=new THREE.CanvasTexture(cv);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
  spr.position.copy(pos);spr.scale.set(scale||1.1,(scale||1.1)*0.28,1);spr.visible=false;spr.renderOrder=999;
  scene.add(spr);HOVER_LABELS.set(obj,spr);return spr;
}

// ===================== 6. PIZARRÓN =====================
const boardG=new THREE.Group();
boardG.position.set(-1.15,0,-0.95);boardG.rotation.y=0.2;scene.add(boardG);
const frame=roundedBox(3.9,2.9,0.12,MAT.frame,0.06);frame.position.set(0,1.9,0);boardG.add(frame);
[-1.65,1.65].forEach(x=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.9,16),MAT.leg);leg.position.set(x,0.92,0);boardG.add(leg);});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.68,2.72),new THREE.MeshBasicMaterial({map:bTex}));
board.position.set(0,1.9,0.065);boardG.add(board);
frame.userData={title:'Temporizadores y contadores (IEC 61131-3)',info:'TON, TOF, TP, CTU y CTD y su uso en secuencias · toca para inspeccionar'};
addHoverLabel(frame,'Temporizadores y contadores · IEC 61131-3',ACC,new THREE.Vector3(0,3.5,0.1).add(boardG.position),3.0);

function bg(c){c.fillStyle='#0c1016';c.fillRect(0,0,1024,768);}
function rpanel(c,x,y,w,h,title){
  c.fillStyle=hexA(ACC,0.06);c.fillRect(x,y,w,h);
  c.strokeStyle=hexA(ACC,0.22);c.lineWidth=1;c.strokeRect(x,y,w,h);
  c.fillStyle='#C7D6F5';c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.fillText(title,x+16,y+26);
}
function prow(c,x,y,w,l,v,col){
  c.fillStyle='#8f97a5';c.font='13px Outfit, sans-serif';c.textAlign='left';c.fillText(l,x+16,y);
  c.fillStyle=col||'#F4EFEA';c.font='bold 16px Outfit, sans-serif';c.textAlign='right';c.fillText(v,x+w-14,y);
}
function wrapText(c,text,x,y,maxW,lh){
  const words=text.split(' ');let line='',yy=y;
  for(const w of words){const test=line+w+' ';
    if(c.measureText(test).width>maxW && line){c.fillText(line,x,yy);line=w+' ';yy+=lh;}else line=test;}
  c.fillText(line,x,yy);return yy;
}
const PX={x:706,y:70,w:300};

// ---- bloque funcional IEC (rectángulo con pines) ----
function drawFB(c,x,y,w,h,kind,pins,active){
  c.fillStyle=hexA(active?OK_HEX:ACC,0.08);c.fillRect(x,y,w,h);
  c.strokeStyle=active?OK_HEX:hexA(ACC,0.55);c.lineWidth=2;c.strokeRect(x,y,w,h);
  c.fillStyle='#C7D6F5';c.font='bold 22px Outfit, sans-serif';c.textAlign='center';c.fillText(kind,x+w/2,y+30);
  c.font='12px Outfit, sans-serif';c.fillStyle='#7a8494';c.fillText('bloque funcional IEC 61131-3',x+w/2,y+50);
  const li=pins.left,ri=pins.right;
  li.forEach((p,i)=>{
    const py=y+72+i*30;
    c.strokeStyle=p.on?OK_HEX:'#4a525e';c.lineWidth=2;c.beginPath();c.moveTo(x-26,py);c.lineTo(x,py);c.stroke();
    c.fillStyle=p.on?OK_HEX:'#9fb0cf';c.font='bold 13px Outfit, sans-serif';c.textAlign='right';c.fillText(p.n,x-32,py+4);
    c.fillStyle='#C9D3E2';c.font='13px Outfit, sans-serif';c.textAlign='left';c.fillText(p.v,x+12,py+4);
  });
  ri.forEach((p,i)=>{
    const py=y+72+i*30;
    c.strokeStyle=p.on?OK_HEX:'#4a525e';c.lineWidth=2;c.beginPath();c.moveTo(x+w,py);c.lineTo(x+w+26,py);c.stroke();
    c.fillStyle=p.on?OK_HEX:'#9fb0cf';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillText(p.n,x+w+32,py+4);
    c.fillStyle='#C9D3E2';c.font='13px Outfit, sans-serif';c.textAlign='right';c.fillText(p.v,x+w-12,py+4);
  });
}
// ---- barra de progreso (ET/PT o CV/PV) ----
function drawBar(c,x,y,w,h,frac,label,col,right){
  c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';c.textAlign='left';c.fillText(label,x,y-8);
  c.fillStyle='rgba(255,255,255,0.06)';c.fillRect(x,y,w,h);
  c.fillStyle=hexA(col,0.75);c.fillRect(x,y,Math.max(0,Math.min(1,frac))*w,h);
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(x,y,w,h);
  c.fillStyle=col;c.font='bold 13px Outfit, sans-serif';c.textAlign='right';c.fillText(right,x+w,y-8);
}
// ---- cronograma digital ----
function drawWave(c,x,y,levels,label,col,cw,h){
  h=h||24;
  c.fillStyle=col;c.font='bold 12px Outfit, sans-serif';c.textAlign='left';c.fillText(label,x,y-h-8);
  c.strokeStyle='rgba(255,255,255,0.10)';c.lineWidth=1;
  c.beginPath();c.moveTo(x,y);c.lineTo(x+cw*Math.max(1,levels.length),y);c.stroke();
  if(!levels.length){c.fillStyle='#6b7280';c.font='12px Outfit, sans-serif';c.fillText('(sin scans aún — pulsa la botonera)',x+6,y-6);return;}
  c.strokeStyle=col;c.lineWidth=2;c.beginPath();
  let prevY=levels[0]?y-h:y;c.moveTo(x,prevY);c.lineTo(x+cw,prevY);
  for(let k=1;k<levels.length;k++){const yy=levels[k]?y-h:y,xx=x+k*cw;if(yy!==prevY)c.lineTo(xx,yy);c.lineTo(xx+cw,yy);prevY=yy;}
  c.stroke();
}
function drawTimeAxis(c,x,y,n,cw,every){
  every=every||10;
  c.strokeStyle='rgba(255,255,255,0.10)';c.lineWidth=1;
  c.fillStyle='#6b7280';c.font='10px Outfit, sans-serif';c.textAlign='center';
  for(let k=0;k<=n;k+=every){
    const xx=x+k*cw;
    c.beginPath();c.moveTo(xx,y);c.lineTo(xx,y+6);c.stroke();
    c.fillText((k*DT/1000).toFixed(1)+'s',xx,y+18);
  }
}

// ===================== 7. VISTAS POR MODO =====================
const KIND_DESC={
  TON:'RETARDO A LA CONEXIÓN. Al ponerse IN a 1 empieza a contar; Q sube cuando ET alcanza PT y cae en cuanto IN vuelve a 0. Si IN cae antes de PT, ET se borra: hay que empezar de cero.',
  TOF:'RETARDO A LA DESCONEXIÓN. Q sube con IN y, al caer IN, sigue activa PT más y luego cae. Es REDISPARABLE: si IN vuelve durante el retardo, la cuenta se reinicia. Arranca con Q=0.',
  TP:'PULSO DE DURACIÓN FIJA. Un flanco de subida de IN lanza un pulso que dura exactamente PT, aunque IN caiga antes o siga alto. NO es redisparable: los flancos durante el pulso se ignoran.',
  CTU:'CONTADOR ASCENDENTE. Cuenta los FLANCOS de subida de CU (no los niveles): mantener CU en 1 no sigue contando. Q se activa cuando CV ≥ PV. La entrada R es dominante y pone CV a 0.',
  CTD:'CONTADOR DESCENDENTE. LD carga CV con PV; cada flanco de CD resta uno y Q se activa cuando CV ≤ 0. Ojo: sin cargar antes, CV arranca en 0 y Q ya está activa (falsa alarma clásica).',
};
function expPins(){
  const cnt=isCnt(expKind),q=expS.q;
  if(expKind==='CTU')return {left:[{n:'CU',v:expIN?'1':'0',on:expIN},{n:'R',v:'—',on:false},{n:'PV',v:String(expPV),on:false}],
                             right:[{n:'Q',v:q?'1':'0',on:q},{n:'CV',v:String(expS.cv),on:expS.cv>0}]};
  if(expKind==='CTD')return {left:[{n:'CD',v:expIN?'1':'0',on:expIN},{n:'LD',v:'—',on:false},{n:'PV',v:String(expPV),on:false}],
                             right:[{n:'Q',v:q?'1':'0',on:q},{n:'CV',v:String(expS.cv),on:expS.cv>0}]};
  return {left:[{n:'IN',v:expIN?'1':'0',on:expIN},{n:'PT',v:fmtS(expPT),on:false}],
          right:[{n:'Q',v:q?'1':'0',on:q},{n:'ET',v:fmtS(expS.et||0),on:(expS.et||0)>0}]};
}
function drawExplora(c){
  const cnt=isCnt(expKind);
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';
  c.fillText('EXPLORA · Bloque '+expKind+(cnt?' (contador)':' (temporizador)'),30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  wrapText(c,KIND_DESC[expKind],30,66,660,18);
  drawFB(c,120,130,240,190,expKind,expPins(),expS.q);
  // barra ET/PT o CV/PV
  if(cnt){
    drawBar(c,420,190,240,20,expPV>0?expS.cv/expPV:0,'CV / PV',VIO,expS.cv+' / '+expPV);
    c.fillStyle=expS.q?OK_HEX:'#6b7280';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
    c.fillText(expS.q?(expKind==='CTU'?'✔ Q = 1  (CV ≥ PV)':'✔ Q = 1  (CV ≤ 0)'):'Q = 0',420,250);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    wrapText(c,'Pulsa "'+(expKind==='CTU'?'CU':'CD')+' ▲" dos veces seguidas: sólo cuenta UNA vez, porque cuenta flancos. Hay que soltar («▼») entre pulsos.',420,278,240,17);
  }else{
    drawBar(c,420,190,240,20,expPT>0?(expS.et||0)/expPT:1,'ET / PT',WARN_HEX,fmtS(expS.et||0)+' / '+fmtS(expPT));
    c.fillStyle=expS.q?OK_HEX:'#6b7280';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
    c.fillText(expS.q?'✔ Q = 1':'Q = 0',420,250);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    wrapText(c,'Cada pulsación de la botonera = un ciclo de scan = '+DT+' ms. Mantén IN en 1 el número de scans necesario para llegar a PT.',420,278,240,17);
  }
  // cronogramas
  const n=Math.max(expHist.length,1),cw=Math.min(22,600/Math.max(12,n));
  drawWave(c,60,410,expHist.map(h=>h.in?1:0),(cnt?(expKind==='CTU'?'CU':'CD'):'IN')+' (entrada)',ACC,cw);
  drawWave(c,60,500,expHist.map(h=>h.q?1:0),'Q (salida)',OK_HEX,cw);
  drawTimeAxis(c,60,530,Math.max(expHist.length,12),cw,5);
  c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Historial de los últimos '+expHist.length+' ciclos de scan (el más reciente, a la derecha).',60,570);
  // panel
  rpanel(c,PX.x,PX.y,PX.w,cnt?180:180,'PARÁMETROS');
  prow(c,PX.x,PX.y+52,PX.w,'Bloque',expKind,ACC);
  prow(c,PX.x,PX.y+82,PX.w,cnt?'PV (preselección)':'PT (preselección)',cnt?String(expPV):fmtS(expPT),WARN_HEX);
  prow(c,PX.x,PX.y+112,PX.w,cnt?'CV (cuenta)':'ET (transcurrido)',cnt?String(expS.cv):fmtS(expS.et||0),VIO);
  prow(c,PX.x,PX.y+142,PX.w,'Q (salida)',expS.q?'1':'0',expS.q?OK_HEX:'#6b7280');
  const by=PX.y+200;
  c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,280);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,280);
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('CÓMO SE USA',PX.x+14,by+24);
  c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
  const uso={
    TON:'Retardos de arranque en cascada: no energizar el equipo principal hasta que el auxiliar (bomba de lubricación, ventilador, extractor) lleve un tiempo en marcha. También para filtrar señales: si un sensor no se mantiene PT, el TON no dispara y el ruido se ignora.',
    TOF:'Sobre-marcha o purga: el ventilador de un horno debe seguir girando tras el paro para evacuar calor; un extractor sigue aspirando tras cerrar la máquina. También mantiene una alarma visible un tiempo mínimo aunque la falla desaparezca.',
    TP:'Pulsos de duración garantizada: abrir una electroválvula exactamente 0,5 s por cada dosis, dar un bip de aviso, o generar un impulso de reset. Como no es redisparable, un operario que aporree el botón no alarga ni multiplica el pulso.',
    CTU:'Conteo de producción: piezas por lote, botellas por caja, vueltas de un eje con un encoder de un pulso. Q avisa "lote completo" y R lo pone a cero para el siguiente lote.',
    CTD:'Dosificación regresiva: cargar con LD las N unidades que faltan y descontar hasta 0; también inventarios y "quedan N ciclos de vida útil". Cargar SIEMPRE antes de contar.',
  }[expKind];
  wrapText(c,uso,PX.x+14,by+48,PX.w-28,17);
}

function drawAplica(c){
  if(apTopic==='comparar'){
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · TON vs TOF vs TP con el mismo estímulo',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'La misma entrada IN alimenta los tres temporizadores con el mismo PT = '+fmtS(AP_PT)+' ('+(AP_PT/DT)+' scans). Compara dónde sube y dónde cae cada Q: el TON retrasa el encendido, el TOF retrasa el apagado y el TP entrega siempre un pulso de la misma anchura.',30,66,660,18);
    const a=newT('TON'),b=newT('TOF',AP_PT),d=newT('TP');
    const qA=[],qB=[],qC=[];
    AP_IN.forEach(v=>{qA.push(stepTON(a,!!v,AP_PT,DT)?1:0);qB.push(stepTOF(b,!!v,AP_PT,DT)?1:0);qC.push(stepTP(d,!!v,AP_PT,DT)?1:0);});
    const cw=640/AP_IN.length;
    drawWave(c,45,175,AP_IN,'IN (estímulo común)',ACC,cw);
    drawWave(c,45,265,qA,'Q del TON — retardo a la CONEXIÓN',OK_HEX,cw);
    drawWave(c,45,355,qB,'Q del TOF — retardo a la DESCONEXIÓN',WARN_HEX,cw);
    drawWave(c,45,445,qC,'Q del TP — PULSO de anchura fija',VIO,cw);
    drawTimeAxis(c,45,475,AP_IN.length,cw,4);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Fíjate en el pulso corto de IN (un solo scan): el TON NO llega a disparar —por eso sirve de filtro antirruido— mientras que el TP sí entrega su pulso completo. Y el TOF nunca deja caer Q mientras los pulsos se sucedan a menos de PT: es redisparable.',45,525,640,18);
    rpanel(c,PX.x,PX.y,PX.w,200,'RESUMEN');
    prow(c,PX.x,PX.y+52,PX.w,'TON','retrasa el ON',OK_HEX);
    prow(c,PX.x,PX.y+82,PX.w,'TOF','retrasa el OFF',WARN_HEX);
    prow(c,PX.x,PX.y+112,PX.w,'TP','ancho fijo',VIO);
    prow(c,PX.x,PX.y+142,PX.w,'Redisparable','sólo el TOF',ACC);
    prow(c,PX.x,PX.y+172,PX.w,'Filtra ruido','sólo el TON',ACC);
    const by=PX.y+220;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,260);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,260);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('LA REGLA PRÁCTICA',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Pregúntate QUÉ hay que retrasar. Si lo que debe llegar tarde es el ARRANQUE, es un TON. Si lo que debe llegar tarde es el PARO (que algo siga funcionando después), es un TOF. Si lo que necesitas es una acción de duración garantizada independiente de cuánto dure el disparo, es un TP. Elegir mal no da "casi lo mismo": da un comportamiento distinto.',PX.x+14,by+48,PX.w-28,17);
  }else{
    const R=SEQ_RECIPES[apRecipe];
    const r=seqRun(R.PT,R.PV);
    const cycMs=R.PT.reduce((a,b)=>a+b,0);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Secuencia de etapas + contador de lotes',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'Un TON por etapa en cascada: cuando su Q sube, la secuencia salta a la etapa siguiente y re-arma el temporizador. Al cerrar la última etapa, un CTU suma un ciclo; cuando CV llega a PV, el lote termina. Los tiempos de abajo están MEDIDOS corriendo el programa, no supuestos.',30,66,660,18);
    // gantt de un ciclo
    const gx=45,gy=170,gw=620,gh=44;
    const cols=[ACC,WARN_HEX,VIO];
    let ax=gx;
    R.PT.forEach((pt,i)=>{
      const w=gw*pt/cycMs;
      c.fillStyle=hexA(cols[i],0.35);c.fillRect(ax,gy,w,gh);
      c.strokeStyle=cols[i];c.lineWidth=2;c.strokeRect(ax,gy,w,gh);
      c.fillStyle='#F4EFEA';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';
      c.fillText(R.stages[i],ax+w/2,gy+20);
      c.fillStyle=cols[i];c.font='12px Outfit, sans-serif';c.fillText('TON '+fmtS(pt),ax+w/2,gy+37);
      ax+=w;
    });
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';c.textAlign='left';c.fillText('Un ciclo completo = '+fmtS(cycMs),gx,gy-10);
    // transiciones medidas
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.fillText('TRANSICIONES MEDIDAS (primer ciclo)',gx,gy+80);
    const t0=r.trans.slice(0,3);
    let ty=gy+108;
    t0.forEach((tr,i)=>{
      const dest=tr[1],from=R.stages[i],to=R.stages[dest];
      c.fillStyle='#9fb0cf';c.font='13px Outfit, sans-serif';c.textAlign='left';
      c.fillText('scan '+tr[0]+'  ('+fmtS(tr[0]*DT)+')  →  '+from+' termina, entra '+to,gx+10,ty);
      ty+=26;
    });
    const durs=[r.trans[0][0]*DT,(r.trans[1][0]-r.trans[0][0])*DT,(r.trans[2][0]-r.trans[1][0])*DT];
    c.fillStyle=OK_HEX;c.font='bold 13px Outfit, sans-serif';
    c.fillText('✓ Duración medida de cada etapa: '+durs.map(fmtS).join(' · ')+'  =  exactamente sus PT',gx+10,ty+6);
    // barra de lotes
    const by2=gy+230;
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('CONTADOR DE LOTE (CTU, PV = '+R.PV+')',gx,by2);
    const bw=620/R.PV;
    for(let k=0;k<R.PV;k++){
      c.fillStyle=hexA(OK_HEX,0.25);c.fillRect(gx+k*bw+2,by2+16,bw-4,30);
      c.strokeStyle=OK_HEX;c.lineWidth=1.5;c.strokeRect(gx+k*bw+2,by2+16,bw-4,30);
      c.fillStyle='#F4EFEA';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';
      c.fillText('ciclo '+(k+1)+' · CV='+(k+1),gx+k*bw+bw/2,by2+36);
    }
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Tiempo total del lote medido: '+fmtS(r.ms)+' = '+R.PV+' ciclos × '+fmtS(cycMs)+'. Al llegar CV = PV el CTU activa Q, la secuencia se detiene y la máquina espera un nuevo arranque (con R se pone el contador a cero).',gx,by2+80,620,18);
    rpanel(c,PX.x,PX.y,PX.w,200,'RECETA');
    prow(c,PX.x,PX.y+52,PX.w,'Proceso',R.name,ACC);
    prow(c,PX.x,PX.y+82,PX.w,'Ciclo',fmtS(cycMs),WARN_HEX);
    prow(c,PX.x,PX.y+112,PX.w,'Lote (PV)',String(R.PV),VIO);
    prow(c,PX.x,PX.y+142,PX.w,'Total medido',fmtS(r.ms),OK_HEX);
    prow(c,PX.x,PX.y+172,PX.w,'CV final',String(r.cv),OK_HEX);
    const by=PX.y+220;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,260);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,260);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('POR QUÉ EN CASCADA',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Un solo temporizador por etapa, re-armado en la transición, hace que cada etapa dure exactamente su PT y que el ciclo sea la SUMA de los PT. La alternativa ingenua —un único temporizador con umbrales acumulados (2 s, 7 s, 9 s)— funciona hasta que hay que pausar, repetir o saltar una etapa: entonces hay que recalcular todos los umbrales. Por eso la industria programa secuencias por ETAPAS (y, cuando crecen, con GRAFCET/SFC).',PX.x+14,by+48,PX.w-28,17);
  }
}

// ---- Reto ----
function retoOptsFor(field){
  if(field==='arr')return {tipos:OPT_TIPO,presets:OPT_PT_ARR,ms:true};
  if(field==='par')return {tipos:OPT_TIPO,presets:OPT_PT_PAR,ms:true};
  return {tipos:OPT_CNT,presets:retoCh.cntT==='TON'?OPT_PT_CNT:OPT_PV,ms:retoCh.cntT==='TON'};
}
function retoLevels(field){
  if(field==='arr')return behArr(retoCh.arrT,retoCh.arrP,DT).h.map(q=>q?1:0);
  if(field==='par'){const r=behPar(retoCh.parT,retoCh.parP,DT);return r.on.concat(r.off).map(q=>q?1:0);}
  return behCnt(retoCh.cntT,retoCh.cntP,DT).qs.map(q=>q?1:0);
}
function retoChosen(field){
  if(field==='arr')return retoCh.arrT+' · PT = '+fmtS(retoCh.arrP);
  if(field==='par')return retoCh.parT+' · PT = '+fmtS(retoCh.parP);
  return retoCh.cntT+' · '+(retoCh.cntT==='TON'?'PT = '+fmtS(retoCh.cntP):'PV = '+retoCh.cntP);
}
function drawRetoRow(c,x,y,w,h,title,req,chosen,levels,ok,checked,editing){
  c.fillStyle=checked?hexA(ok?OK_HEX:BAD_HEX,0.10):hexA(editing?ACC:'#8f97a5',0.06);c.fillRect(x,y,w,h);
  c.strokeStyle=checked?(ok?OK_HEX:BAD_HEX):(editing?ACC:hexA(ACC,0.22));c.lineWidth=editing?2:1.5;c.strokeRect(x,y,w,h);
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText(title,x+14,y+22);
  c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';wrapText(c,req,x+14,y+42,320,16);
  c.fillStyle=checked?(ok?OK_HEX:BAD_HEX):'#F4EFEA';c.font='bold 15px Outfit, sans-serif';c.textAlign='left';
  c.fillText(chosen+(checked?(ok?'  ✓':'  ✗'):''),x+352,y+24);
  const wx=x+352,wy=y+h-16,ww=w-372;
  drawWave(c,wx,wy,levels,'Q resultante',checked?(ok?OK_HEX:BAD_HEX):'#9fb0cf',ww/Math.max(1,levels.length),18);
}
function drawReto(c){
  const p=RETO_POOL[retoIdx];
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('RETO · Programa los bloques de la máquina',30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  wrapText(c,'Máquina: '+p.name+'. Elige el BLOQUE y su PRESELECCIÓN para cada una de las tres funciones. Cada elección se simula sobre el motor verificado y se califica por separado: no basta acertar el tipo, el tiempo o la cuenta también tienen que ser exactos.',30,66,660,18);
  const rw=640,rh=118;
  drawRetoRow(c,30,126,rw,rh,'1 · Retardo de arranque  ('+fmtS(p.tDelay)+')',p.sArr+'. Debe encender exactamente a los '+fmtS(p.tDelay)+' y mantenerse.',
    retoChosen('arr'),retoLevels('arr'),retoOkArr,retoChecked,retoField==='arr');
  drawRetoRow(c,30,258,rw,rh,'2 · Sobre-marcha tras el paro  ('+fmtS(p.tPurge)+')',p.sPar+'. Debe estar encendido al parar y apagarse '+fmtS(p.tPurge)+' después.',
    retoChosen('par'),retoLevels('par'),retoOkPar,retoChecked,retoField==='par');
  drawRetoRow(c,30,390,rw,rh,'3 · Conteo del lote  ('+p.N+' unidades)',p.sCnt+'. Las unidades llegan con cadencia IRREGULAR.',
    retoChosen('cnt'),retoLevels('cnt'),retoOkCnt,retoChecked,retoField==='cnt');
  c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,'Las trazas de la derecha son la salida Q real de tu elección ante el estímulo de prueba: 8 s con la máquina en marcha (fila 1), 3 s en marcha y 6 s tras el paro (fila 2) y el desfile completo de unidades con separaciones desiguales (fila 3).',30,532,640,17);
  rpanel(c,PX.x,PX.y,PX.w,160,'CALIFICACIÓN');
  prow(c,PX.x,PX.y+52,PX.w,'Retardo',retoChecked?(retoOkArr?'✓':'✗'):'—',retoChecked?(retoOkArr?OK_HEX:BAD_HEX):'#6b7280');
  prow(c,PX.x,PX.y+86,PX.w,'Sobre-marcha',retoChecked?(retoOkPar?'✓':'✗'):'—',retoChecked?(retoOkPar?OK_HEX:BAD_HEX):'#6b7280');
  prow(c,PX.x,PX.y+120,PX.w,'Conteo',retoChecked?(retoOkCnt?'✓':'✗'):'—',retoChecked?(retoOkCnt?OK_HEX:BAD_HEX):'#6b7280');
  const by=PX.y+180;
  if(retoChecked){
    c.fillStyle='rgba(0,0,0,0.24)';c.fillRect(PX.x,by,PX.w,300);
    c.strokeStyle=retoSolved?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(PX.x,by,PX.w,300);
    c.fillStyle=retoSolved?OK_HEX:BAD_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='left';c.fillText(retoSolved?'✔ CORRECTO':'✗ REVISA',PX.x+14,by+26);
    c.fillStyle='#C9D3E2';c.font='12px Outfit, sans-serif';wrapText(c,retoExplain(),PX.x+14,by+52,PX.w-28,17);
  }else{
    c.fillStyle='rgba(0,0,0,0.20)';c.fillRect(PX.x,by,PX.w,300);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,300);
    c.fillStyle=WARN_HEX;c.font='13px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Pregúntate qué hay que retrasar en cada caso: ¿el encendido, el apagado, o hace falta un pulso de anchura fija? Y para contar unidades que no llegan a intervalos regulares, ningún temporizador sirve: hace falta un contador de flancos.',PX.x+14,by+26,PX.w-28,18);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    wrapText(c,'Errores clásicos: usar TP para un retardo (el pulso llega de inmediato y se acaba solo), usar TON para la purga (cae en el mismo instante del paro), y usar CTD sin cargarlo con LD (marca lote completo desde la unidad cero).',PX.x+14,by+150,PX.w-28,18);
  }
}
function retoExplain(){
  const p=RETO_POOL[retoIdx];
  if(retoSolved)return 'Programa correcto: TON con PT = '+fmtS(p.tDelay)+' retrasa el arranque; TOF con PT = '+fmtS(p.tPurge)+' mantiene la sobre-marcha tras el paro y luego apaga solo; y CTU con PV = '+p.N+' cuenta flancos y marca el lote completo justo con la unidad '+p.N+'. Éste es el trío básico de bloques de IEC 61131-3 en cualquier máquina.';
  let s='';
  if(!retoOkArr){
    const r=behArr(retoCh.arrT,retoCh.arrP,DT);
    s+='Retardo: con '+retoCh.arrT+'/'+fmtS(retoCh.arrP)+' '+(r.first<0?'la salida nunca enciende':'enciende a los '+fmtS(r.first*DT)+(r.hold?'':' pero no se mantiene (se apaga sola)'))+'; hace falta que encienda a los '+fmtS(p.tDelay)+' y siga. ';
  }
  if(!retoOkPar){
    const r=behPar(retoCh.parT,retoCh.parP,DT);
    s+='Sobre-marcha: con '+retoCh.parT+'/'+fmtS(retoCh.parP)+' '+(!r.atStop?'la salida ya estaba apagada en el instante del paro (no hay nada que purgar)':'sigue '+fmtS(r.offIdx*DT)+' tras el paro')+'; se necesitan '+fmtS(p.tPurge)+'. ';
  }
  if(!retoOkCnt){
    const r=behCnt(retoCh.cntT,retoCh.cntP,DT);
    s+='Conteo: con '+retoCh.cntT+'/'+(retoCh.cntT==='TON'?fmtS(retoCh.cntP):retoCh.cntP)+' la señal salta '+(r.first<0?'nunca':'con '+r.piecesAt+' unidad(es) contadas')+'; debe saltar exactamente con la unidad '+p.N+'. ';
  }
  return s||'Revisa el programa.';
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='aplica')drawAplica(c);else if(mode==='reto')drawReto(c);else drawExplora(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='aplica')showToast('🧩 TON retrasa el encendido, TOF retrasa el apagado y TP da un pulso de anchura fija. Encadenados por etapas construyen una secuencia; el CTU cuenta los ciclos del lote.');
  else if(mode==='reto')showToast('🎯 Elige bloque Y preselección: el tipo correcto con el tiempo equivocado sigue estando mal.');
  else showToast('🔧 Cada pulsación de la botonera es un ciclo de scan de '+DT+' ms. Observa ET (o CV) y cuándo sube Q.');
}

// ===================== 8. ESCENA 3D: BANCO DE PLC =====================
const bench=roundedBox(3.7,0.5,1.8,MAT.bench,0.05);bench.position.set(1.9,0.25,0.55);scene.add(bench);
bench.userData={title:'Banco de pruebas del PLC',info:'Los pilotos muestran la entrada, la salida de cada bloque y el reloj de scan.'};
const pcb=roundedBox(2.4,0.08,1.2,MAT.pcb,0.03);pcb.position.set(1.95,0.54,0.5);scene.add(pcb);
pcb.userData={title:'PLC con bloques funcionales',info:'Los temporizadores y contadores son bloques con memoria propia: cada instancia guarda su ET/CV.'};
addHoverLabel(pcb,'PLC · TON / TOF / TP / CTU / CTD',ACC,new THREE.Vector3(1.95,1.35,0.5),1.9);
const chip=roundedBox(0.56,0.14,0.5,MAT.chip,0.02);chip.position.set(1.35,0.63,0.55);scene.add(chip);
const chCv=document.createElement('canvas');chCv.width=180;chCv.height=180;const chTex=new THREE.CanvasTexture(chCv);
const chFace=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.5),new THREE.MeshBasicMaterial({map:chTex,transparent:true}));
chFace.rotation.x=-Math.PI/2;chFace.position.set(1.35,0.705,0.55);scene.add(chFace);
chip.userData={title:'CPU del PLC',info:'Ejecuta el scan: lee entradas, actualiza los bloques (ET/CV) y escribe salidas.'};
function makeLED(x,z,color){const m=new THREE.Mesh(new THREE.SphereGeometry(0.045,16,16),std(color,0.4,0.1));m.position.set(x,0.62,z);m.material.emissive=new THREE.Color(color);m.material.emissiveIntensity=0.15;scene.add(m);return m;}
// pilotos: [entrada IN, salida Q(1), salida Q(2), cuenta/lote] + salida general + reloj de scan
const actLEDs=[makeLED(2.65,0.75,0x8AB4F8),makeLED(2.35,0.75,0x7CD992),makeLED(2.05,0.75,0xE9C46A),makeLED(1.75,0.75,0xC08CF8)];
const outLED=makeLED(2.85,0.35,0x7CD992);
const clkLED=makeLED(1.95,0.35,0xC08CF8);
addHoverLabel(actLEDs[0],'IN · Q · Q · cuenta',ACC,new THREE.Vector3(2.2,1.05,0.75),1.6);
outLED.userData={title:'Salida activa',info:'Se enciende cuando alguna salida Q del bloque en pantalla está en 1.'};
clkLED.userData={title:'Reloj de scan',info:'Un flanco por ciclo de scan del PLC ('+DT+' ms en este modelo).'};

function drawChip3D(label,accept){
  const c=chCv.getContext('2d');c.clearRect(0,0,180,180);
  c.fillStyle='rgba(20,23,27,0.92)';c.fillRect(0,0,180,180);
  c.strokeStyle=accept?OK_HEX:ACC;c.lineWidth=4;c.strokeRect(4,4,172,172);
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';c.fillText('PLC · SCAN',90,30);
  c.font='bold 20px Outfit, sans-serif';c.fillStyle=accept?OK_HEX:'#F4EFEA';
  c.fillText(label.length>10?label.slice(0,9)+'…':label,90,100);
  if(accept){c.font='bold 14px Outfit, sans-serif';c.fillStyle=OK_HEX;c.fillText('▶ Q = 1',90,140);}
  chTex.needsUpdate=true;
}
function hwFrames(){
  if(mode==='reto'){
    const a=newT(retoCh.arrT,retoCh.arrP),b=newT(retoCh.parT,retoCh.parP);const fr=[];
    for(let k=0;k<90;k++){
      const IN=k<30;
      const qa=stepT(a,IN,retoCh.arrP,DT),qb=stepT(b,IN,retoCh.parP,DT);
      if(k%9===0)fr.push({label:fmtS(k*DT),acts:[IN?1:0,qa?1:0,qb?1:0,0],accept:qa||qb});
    }
    return fr;
  }
  if(mode==='aplica'){
    if(apTopic==='comparar'){
      const a=newT('TON'),b=newT('TOF',AP_PT),d=newT('TP');const fr=[];
      AP_IN.forEach((v,k)=>{
        const qa=stepTON(a,!!v,AP_PT,DT),qb=stepTOF(b,!!v,AP_PT,DT),qc=stepTP(d,!!v,AP_PT,DT);
        if(k%2===0)fr.push({label:fmtS(k*DT),acts:[v?1:0,qa?1:0,qb?1:0,qc?1:0],accept:qa||qb||qc});
      });
      return fr;
    }
    const R=SEQ_RECIPES[apRecipe];const s=newSeq();s.run=true;const fr=[];let k=0;
    while(s.run&&k<5000){seqStep(s,R.PT,R.PV,DT);if(k%Math.max(1,Math.floor(R.PT.reduce((a,b)=>a+b,0)/DT/6))===0)fr.push({label:R.stages[s.stage],acts:[s.stage===0?1:0,s.stage===1?1:0,s.stage===2?1:0,s.cv>0?1:0],accept:true});k++;}
    fr.push({label:'LOTE OK',acts:[0,0,0,1],accept:true});
    return fr;
  }
  if(!expHist.length)return [{label:expKind,acts:[0,0,0,0],accept:false}];
  return expHist.map(h=>({label:expKind,acts:[h.in?1:0,h.q?1:0,(h.et>0||h.cv>0)?1:0,h.q?1:0],accept:h.q}));
}
function hwCount(){return Math.max(1,hwFrames().length);}
function updateHW(){
  const frames=hwFrames(),step=hwStep%Math.max(1,frames.length),fr=frames[step]||{label:'—',acts:[0,0,0,0]};
  actLEDs.forEach((l,i)=>{const on=fr.acts&&fr.acts[i];l.material.emissiveIntensity=on?1.4:0.12;});
  const outOn=fr.accept;
  outLED.material.emissiveIntensity=outOn?1.4:0.15;outLED.material.color.setHex(outOn?0x7CD992:0x2a3550);
  clkLED.material.emissiveIntensity=(step%2)?1.3:0.2;
  drawChip3D(fr.label,!!fr.accept);
}

// ===================== 9. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Sistemas digitales (D3) · Bloques funcionales de PLC · IEC 61131-3</div>
  <h2>Temporizadores y Contadores en Secuencias</h2>
  <p>Con contactos y bobinas sólo se escribe lógica <b>combinacional</b> y retención. Para que una máquina
  haga cosas <b>en el tiempo</b> —esperar, purgar, dosificar, contar— la norma <b>IEC 61131-3</b> define
  bloques funcionales con <b>memoria propia</b>. Los tres temporizadores comparten entradas <b>IN</b> y
  <b>PT</b> (preselección) y salidas <b>Q</b> y <b>ET</b> (tiempo transcurrido), pero se comportan distinto:
  el <b>TON</b> retrasa el <b>encendido</b> (Q sube PT después de IN y cae con IN); el <b>TOF</b> retrasa el
  <b>apagado</b> (Q sube con IN y cae PT después, y es <b>redisparable</b>); y el <b>TP</b> entrega un
  <b>pulso de anchura fija</b> PT, <b>no redisparable</b>, pase lo que pase con IN. Los contadores
  <b>CTU</b> y <b>CTD</b> cuentan <b>flancos</b> de subida —no niveles— con <b>PV</b>, <b>CV</b> y <b>Q</b>:
  el CTU activa Q cuando CV ≥ PV (con R dominante) y el CTD, cargado con LD, cuando CV ≤ 0. Encadenando un
  TON por etapa se construye una <b>secuencia</b> en la que cada etapa dura exactamente su PT, y un CTU
  cuenta los ciclos del <b>lote</b>. Explóralos uno a uno, compáralos ante el mismo estímulo y prográmalos.</p>
  <div class="formula">TON: Q ⇑ a PT tras IN⇑ · TOF: Q ⇓ a PT tras IN⇓ (redisparable) · TP: pulso = PT (no redisparable) · CTU: Q = CV ≥ PV · CTD: Q = CV ≤ 0 · scan = ${DT} ms</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Entrada IN / CU</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Salida Q activa / correcto</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Tiempo transcurrido ET</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>Cuenta CV / etapa</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la semántica exacta de los cinco bloques funcionales estándar de IEC 61131-3 sobre una base de scan idealizada de ${DT} ms: TON (ET arranca en el flanco de IN, satura en PT, se borra si IN cae antes; Q = IN ∧ ET ≥ PT), TOF (ET precargado en PT ⇒ Q = 0 al energizar; redisparable; Q = IN ∨ ET &lt; PT), TP (pulso de PT exacto, no redisparable, estado HOLD mientras IN siga alto), CTU (cuenta flancos, Q = CV ≥ PV, R dominante, CV satura en 32767) y CTD (LD carga PV, Q = CV ≤ 0, CV satura en −32768). Además la SECUENCIA por etapas con TON en cascada —cada etapa dura exactamente su PT y el ciclo es la suma de los PT— con un CTU que cierra el lote en PV. Verificado numéricamente (33/33), incluida la unicidad de la solución del Reto en sus cuatro escenarios.</div>
    <div class="fl no"><b>NO modela:</b> el tiempo real del ciclo de scan ni su variación (jitter), la resolución del reloj del PLC ni el error de cuantización cuando PT no es múltiplo del scan; los temporizadores retentivos (TONR/RTO) y sus instrucciones de reset; los contadores bidireccionales CTUD; la detección de flancos como instrucción independiente (R_TRIG/F_TRIG); el desbordamiento real ni el formato TIME de cada fabricante; el rebote de los sensores de conteo y su filtrado; el comportamiento ante corte de alimentación (retención de CV en memoria no volátil); las señales analógicas y el control PID; y el juego de instrucciones concreto de ningún PLC comercial.</div>
  </div>
  <div class="src">Ref: IEC 61131-3 (bloques funcionales estándar) · Petruzella, Programmable Logic Controllers · Bolton, Programmable Logic Controllers · Hackworth, Programmable Logic Controllers · Verificación numérica propia (33/33)</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Temporizadores · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_aplica">🧩 Aplica</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Programa de la máquina</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nuevo escenario</button>
  </div>`;

// ===================== 10. TOASTS =====================
function showToast(html){const t=el('toast');t.innerHTML=html;t.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),4200);}

// ===================== 11. MODOS Y CONTROLES =====================
const MODE_META={
  explora:{nombre:'Explora',cam:[[4.8,2.9,7.0],[0.4,1.05,0.3]],mision:'Conduce cada bloque scan a scan: sube y baja IN y observa cuándo empieza a contar ET y cuándo sube Q. Prueba a soltar IN antes de PT en el TON y a redisparar el TOF.'},
  aplica:{nombre:'Aplica',cam:[[4.6,2.8,6.8],[0.4,1.05,0.3]],mision:'Compara TON, TOF y TP ante el mismo estímulo, y estudia la secuencia de etapas en cascada con su contador de lote.'},
  reto:{nombre:'Reto',cam:[[4.7,2.7,6.9],[0.5,1.0,0.4]],mision:'Programa las tres funciones de una máquina real: retardo de arranque, sobre-marcha tras el paro y conteo del lote. Se califica bloque Y preselección.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function optBtns(key,opts,cur){return opts.map(([v,t])=>`<button class="b sm ${String(cur)===String(v)?'on':''}" data-${key}="${v}">${t}</button>`).join('');}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';let html='';
  if(mode==='explora'){
    html+=lbl('Bloque:')+optBtns('ek',EXP_KINDS.map(k=>[k,k]),expKind);
    if(isCnt(expKind)){
      html+=lbl('PV:')+optBtns('ev',EXP_PVS.map(v=>[v,String(v)]),expPV);
      const up=expKind==='CTU'?'CU':'CD';
      html+=lbl('Scan:')+`<button class="b sm" data-es="1">${up} ▲ ▸</button><button class="b sm" data-es="0">${up} ▼ ▸</button>`+
        `<button class="b sm" data-ea="1">${expKind==='CTU'?'R (reset) ▸':'LD (cargar) ▸'}</button><button class="b sm" data-er="t">Reiniciar</button>`;
    }else{
      html+=lbl('PT:')+optBtns('ep',EXP_PTS.map(v=>[v,fmtS(v)]),expPT);
      html+=lbl('Scan:')+`<button class="b sm" data-es="1">IN = 1 ▸</button><button class="b sm" data-es="0">IN = 0 ▸</button><button class="b sm" data-e5="1">×5 con IN = 1</button><button class="b sm" data-er="t">Reiniciar</button>`;
    }
    bar.innerHTML=html;
    bar.querySelectorAll('[data-ek]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expKind=b.dataset.ek;expReset();synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ep]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expPT=parseInt(b.dataset.ep,10);expReset();synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expPV=parseInt(b.dataset.ev,10);expReset();synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-es]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expScan(b.dataset.es==='1',false);synth.beep(b.dataset.es==='1'?820:420,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-e5]').forEach(b=>b.onclick=()=>{if(autoRunning)return;for(let k=0;k<5;k++)expScan(true,false);synth.beep(880,0.06,0.05);afterEdit();});
    bar.querySelectorAll('[data-ea]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expScan(false,true);synth.beep(320,0.06,0.05);afterEdit();});
    bar.querySelectorAll('[data-er]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expReset();synth.beep(440,0.05,0.04);afterEdit();});
  }else if(mode==='aplica'){
    html+=lbl('Tema:')+`<button class="b sm ${apTopic==='comparar'?'on':''}" data-at="comparar">TON vs TOF vs TP</button><button class="b sm ${apTopic==='secuencia'?'on':''}" data-at="secuencia">Secuencia + lote</button>`;
    if(apTopic==='secuencia')html+=lbl('Receta:')+optBtns('ar',SEQ_RECIPES.map((r,i)=>[i,r.name]),apRecipe);
    bar.innerHTML=html;
    bar.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apTopic=b.dataset.at;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ar]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apRecipe=parseInt(b.dataset.ar,10);hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
  }else{
    html+=lbl('Función:')+`<button class="b sm ${retoField==='arr'?'on':''}" data-rf="arr">1 · Retardo</button><button class="b sm ${retoField==='par'?'on':''}" data-rf="par">2 · Sobre-marcha</button><button class="b sm ${retoField==='cnt'?'on':''}" data-rf="cnt">3 · Conteo</button>`;
    const o=retoOptsFor(retoField);
    const curT=retoField==='arr'?retoCh.arrT:retoField==='par'?retoCh.parT:retoCh.cntT;
    const curP=retoField==='arr'?retoCh.arrP:retoField==='par'?retoCh.parP:retoCh.cntP;
    html+=lbl('Bloque:')+optBtns('rt',o.tipos.map(t=>[t,t]),curT);
    html+=lbl(o.ms?'PT:':'PV:')+optBtns('rp',o.presets.map(v=>[v,o.ms?fmtS(v):String(v)]),curP);
    bar.innerHTML=html;
    bar.querySelectorAll('[data-rf]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoField=b.dataset.rf;synth.beep(640,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rt]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoSetType(b.dataset.rt);synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoSetPreset(parseInt(b.dataset.rp,10));synth.beep(760,0.05,0.04);afterEdit();});
  }
}
function retoSetType(t){
  if(retoField==='arr')retoCh.arrT=t;
  else if(retoField==='par')retoCh.parT=t;
  else{
    retoCh.cntT=t;
    const list=t==='TON'?OPT_PT_CNT:OPT_PV;
    if(list.indexOf(retoCh.cntP)<0)retoCh.cntP=list[0];
  }
  retoChecked=false;retoSolved=false;
}
function retoSetPreset(v){
  if(retoField==='arr')retoCh.arrP=v;else if(retoField==='par')retoCh.parP=v;else retoCh.cntP=v;
  retoChecked=false;retoSolved=false;
}
function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='reto'){box.style.display='none';return;}
  const p=RETO_POOL[retoIdx];box.style.display='block';
  box.innerHTML=`Máquina: <b>${p.name}</b> — ${p.ctx}.`;
}
function setMode(k){
  mode=k;hwStep=0;
  ['explora','aplica','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('retoTitle').style.display=k==='reto'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  if(k==='reto')updateRetoSpec();
  if(k==='explora')expReset();
  buildControls();updateScenarioInfo();
  solved=(k==='reto')?retoSolved:false;
  clearDx();buildQuiz();refreshQuestion();
  const cam=MODE_META[k].cam;S.moveTo(cam[0],cam[1]);refreshAll();
}
function afterEdit(){buildControls();updateScenarioInfo();refreshAll();}
function newSignal(){
  if(mode==='reto'){seedReto();updateRetoSpec();afterEdit();solved=false;showToast('🔀 Nueva máquina: '+RETO_POOL[retoIdx].name+'.');}
  else if(mode==='aplica'){
    if(apTopic==='comparar'){apTopic='secuencia';}else{apRecipe=(apRecipe+1)%SEQ_RECIPES.length;if(apRecipe===0)apTopic='comparar';}
    afterEdit();showToast('🔀 Nuevo tema.');
  }else{
    expKind=EXP_KINDS[(EXP_KINDS.indexOf(expKind)+1)%EXP_KINDS.length];expReset();afterEdit();
    showToast('🔀 Bloque '+expKind+'. Condúcelo con la botonera.');
  }
  synth.beep(520,0.08,0.05);hwStep=0;
}

// ===================== 12. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele');
  if(mode==='reto'){
    const p=RETO_POOL[retoIdx];
    t.innerHTML=teleRow('Máquina',p.name)+
      teleRow('Editando',retoField==='arr'?'Retardo':retoField==='par'?'Sobre-marcha':'Conteo','good')+
      teleRow('Retardo',retoChecked?(retoOkArr?'✓':'✗'):'—',retoChecked&&retoOkArr?'good':'warn')+
      teleRow('Sobre-marcha',retoChecked?(retoOkPar?'✓':'✗'):'—',retoChecked&&retoOkPar?'good':'warn')+
      teleRow('Conteo',retoChecked?(retoOkCnt?'✓':'✗'):'—',retoChecked&&retoOkCnt?'good':'warn');
    return;
  }
  if(mode==='aplica'){
    if(apTopic==='comparar')t.innerHTML=teleRow('Tema','TON / TOF / TP')+teleRow('PT común',fmtS(AP_PT))+teleRow('TON','retrasa ON','good')+teleRow('TOF','retrasa OFF','good')+teleRow('TP','ancho fijo','good');
    else{
      const R=SEQ_RECIPES[apRecipe],r=seqRun(R.PT,R.PV),cyc=R.PT.reduce((a,b)=>a+b,0);
      t.innerHTML=teleRow('Receta',R.name)+teleRow('Etapas',String(R.PT.length))+teleRow('Ciclo',fmtS(cyc))+teleRow('Lote (PV)',String(R.PV))+teleRow('Total medido',fmtS(r.ms),'good');
    }
    return;
  }
  const cnt=isCnt(expKind);
  t.innerHTML=teleRow('Bloque',expKind)+
    teleRow(cnt?'PV':'PT',cnt?String(expPV):fmtS(expPT))+
    teleRow(cnt?'CV':'ET',cnt?String(expS.cv):fmtS(expS.et||0),'warn')+
    teleRow('Q',expS.q?'1':'0',expS.q?'good':'')+
    teleRow('Scans',String(expHist.length));
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='reto'){
    const p=RETO_POOL[retoIdx];
    html+=retoMsg||`<span class="mono">${p.name}: elige bloque y preselección para las tres funciones. Pista: pregúntate si hay que retrasar el encendido, el apagado, o si hace falta contar flancos.</span>`;
  }else if(mode==='aplica'){
    if(apTopic==='comparar')html+=`<span class="mono">Mismo IN y mismo PT para los tres bloques. El pulso corto de un solo scan no dispara el TON (filtro antirruido) pero sí el TP; y el TOF se redispara si IN vuelve antes de agotar PT.</span>`;
    else html+=`<span class="mono">Cada etapa es un TON que, al cumplir su PT, salta a la siguiente y re-arma el temporizador: por eso el ciclo dura exactamente la suma de los PT. El CTU cuenta los ciclos y cierra el lote en PV.</span>`;
  }else{
    if(isCnt(expKind))html+=`<span class="mono">Pulsa "${expKind==='CTU'?'CU':'CD'} ▲ ▸" y luego "▼ ▸" para generar un flanco completo. Dos "▲" seguidos cuentan UNA sola vez: los contadores cuentan flancos, no niveles.</span>`;
    else html+=`<span class="mono">Cada pulsación es un ciclo de scan de ${DT} ms. Con "IN = 1 ▸" mantienes la entrada activa; observa ET crecer y Q dispararse al llegar a PT (${fmtS(expPT)} = ${expPT/DT} scans).</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();updateHW();}

// ===================== 13. RETO =====================
function updateRetoSpec(){
  const p=RETO_POOL[retoIdx];
  el('retoSpec').innerHTML=`Programa <b>${p.name}</b>: retardo de arranque de <b>${fmtS(p.tDelay)}</b>, sobre-marcha de <b>${fmtS(p.tPurge)}</b> tras el paro y lote de <b>${p.N}</b> unidades. Elige bloque y preselección de cada función y pulsa "Comprobar".`;
}
function checkReto(){
  const sc=RETO_POOL[retoIdx];
  retoOkArr=okArr(retoCh.arrT,retoCh.arrP,sc,DT);
  retoOkPar=okPar(retoCh.parT,retoCh.parP,sc,DT);
  retoOkCnt=okCnt(retoCh.cntT,retoCh.cntP,sc,DT);
  retoSolved=retoOkArr&&retoOkPar&&retoOkCnt;retoChecked=true;solved=retoSolved;
  synth.beep(retoSolved?1046:220,retoSolved?0.14:0.15,0.06);
  retoMsg=`<span class="mono"><span class="${retoSolved?'ok':'dtc'}">${retoSolved?'✔ Correcto':'✗ Revisa'}</span> — ${retoExplain()}</span>`;
  refreshAll();
}

// ===================== 14. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿En qué se diferencian exactamente un TON y un TOF con el mismo PT?',
      opciones:[
        {t:'El TON retrasa la SUBIDA de Q (arranca a contar cuando IN se pone a 1) y el TOF retrasa la BAJADA (arranca a contar cuando IN se pone a 0).',ok:true,why:'Correcto. TON = on-delay: Q sube PT después del flanco de subida y cae a la vez que IN. TOF = off-delay: Q sube con IN y sigue PT más tras la caída.'},
        {t:'El TON cuenta hacia arriba y el TOF hacia abajo, pero ambos activan Q en el mismo instante.',ok:false,why:'No. Ninguno de los dos "cuenta hacia abajo": ambos acumulan ET desde 0 hasta PT. Lo que cambia es QUÉ flanco de IN los pone en marcha y, por tanto, cuándo cambia Q.'},
        {t:'El TOF es más preciso porque no depende del ciclo de scan.',ok:false,why:'Los dos dependen igual del scan: ET sólo se actualiza una vez por ciclo, así que la resolución de ambos es el tiempo de scan. La diferencia es funcional, no de precisión.'},
        {t:'El TON se usa con entradas digitales y el TOF con analógicas.',ok:false,why:'Ambos trabajan con una entrada booleana IN. Las señales analógicas se tratan con bloques de escalado y comparación, no con temporizadores.'},
      ],
    },
    aplica:{
      pregunta:'Las piezas llegan al sensor con separaciones desiguales. ¿Por qué hay que usar un CTU y no un TON para avisar "lote de 10 completo"?',
      opciones:[
        {t:'Porque el contador cuenta FLANCOS (un evento por pieza) mientras que el temporizador sólo mide tiempo: con cadencia irregular no existe un PT que caiga siempre en la pieza 10.',ok:true,why:'Correcto. Contar sucesos y medir tiempo son cosas distintas. Sólo si la cadencia fuera perfectamente regular podría un tiempo equivaler a una cuenta, y aun así fallaría al primer atasco.'},
        {t:'Porque los temporizadores del PLC no pueden pasar de 10 segundos.',ok:false,why:'No hay tal límite: el tipo TIME de IEC 61131-3 llega a días. El problema no es el alcance del temporizador sino que mide la magnitud equivocada.'},
        {t:'Porque el CTU es más rápido que el TON y no pierde piezas.',ok:false,why:'La velocidad es la misma: ambos se actualizan una vez por scan (y por eso un pulso más corto que el scan sí se puede perder, con contador o sin él). La razón es qué magnitud mide cada bloque.'},
        {t:'Porque el TON no tiene salida Q y no podría avisar.',ok:false,why:'El TON sí tiene Q (y ET). Podría avisar… pero avisaría a los PT milisegundos, no a la décima pieza.'},
      ],
    },
    reto:{
      pregunta:'Un ventilador debe seguir girando 2 s DESPUÉS de que se pulse el paro, para purgar el calor. ¿Qué bloque lo resuelve?',
      opciones:[
        {t:'Un TOF con PT = 2 s gobernado por la señal de marcha: Q sigue activa 2 s tras la caída de IN y luego se apaga sola.',ok:true,why:'Correcto. Eso es exactamente un retardo a la desconexión. Además, si la marcha vuelve dentro de esos 2 s, el TOF se redispara y el ventilador no llega a pararse.'},
        {t:'Un TON con PT = 2 s: cuando se pulsa el paro empieza a contar y a los 2 s apaga el ventilador.',ok:false,why:'No: el Q de un TON cae en el MISMO scan en que cae IN, sin retardo alguno a la desconexión. El ventilador se pararía de inmediato.'},
        {t:'Un TP con PT = 2 s disparado por la marcha.',ok:false,why:'El TP entrega su pulso al ARRANCAR y de duración fija; cuando llega el paro ese pulso hace rato que terminó. No hay nada que prolongar.'},
        {t:'Un CTU con PV = 20 contando ciclos de scan de 100 ms.',ok:false,why:'Contar scans para medir tiempo es un apaño frágil: depende de que el scan sea exactamente 100 ms y desaparece al cambiar de CPU o al crecer el programa. Para tiempo se usan temporizadores.'},
      ],
    },
  };
  Object.values(QUIZ).forEach(q=>{for(let i=q.opciones.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const tmp=q.opciones[i];q.opciones[i]=q.opciones[j];q.opciones[j]=tmp;}});
}
function clearDx(){const box=el('dxbtns');if(box)box.innerHTML='';}
function refreshQuestion(){
  const q=QUIZ[mode];if(!q)return;
  el('q_text').textContent=q.pregunta;
  const box=el('dxbtns');
  box.innerHTML=q.opciones.map((o,i)=>`<button class="b sm" data-i="${i}">${String.fromCharCode(65+i)}) ${o.t}</button>`).join('');
  box.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>answer(parseInt(b.dataset.i,10)));
}
function answer(i){
  const q=QUIZ[mode];if(!q)return;
  const box=el('dxbtns'),btns=box.querySelectorAll('[data-i]');
  if(!btns.length||btns[0].disabled)return;
  const o=q.opciones[i];btns.forEach(b=>b.disabled=true);btns[i].classList.add(o.ok?'right':'wrong');
  if(o.ok){synth.beep(1046,0.12,0.06);}else{synth.beep(220,0.15,0.06);}
  showToast((o.ok?'✔ ':'✗ ')+o.why);
}

// ===================== 15. PICKING Y HOVER =====================
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return;
  if(hit.object===board){boardClick();return;}
  let o=hit.object;while(o){if(o.userData&&o.userData.title){showToast('<b>'+o.userData.title+'</b><br>'+(o.userData.info||''));return;}o=o.parent;}
});
(function hoverLoop(){
  const ray=new THREE.Raycaster(),dom=S.renderer.domElement;let mx=0,my=0;
  dom.addEventListener('pointermove',e=>{const r=dom.getBoundingClientRect();mx=((e.clientX-r.left)/r.width)*2-1;my=-((e.clientY-r.top)/r.height)*2+1;});
  function tick(){
    ray.setFromCamera({x:mx,y:my},S.camera);let hovered=false;
    for(const [obj,spr] of HOVER_LABELS){if(!obj.visible){spr.visible=false;continue;}const on=ray.intersectObject(obj,true).length>0;spr.visible=on;if(on)hovered=true;}
    dom.style.cursor=hovered?'pointer':'default';requestAnimationFrame(tick);
  }
  tick();
})();

// ===================== 16. RECORRIDO AUTOMÁTICO =====================
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorriendo…';
  try{
    synth.init();synth.resume();clearDx();
    setMode('explora');
    expKind='TON';expPT=500;expReset();afterEdit();
    showToast('🔧 TON con PT = 0,5 s (5 scans). Mantenemos IN = 1 y vemos crecer ET.');
    await sleep(3200);
    for(let k=0;k<5;k++){expScan(true,false);afterEdit();await sleep(360);}
    showToast('▶ Q sube justo al quinto scan: ET ha alcanzado PT. Ahora soltamos IN.');
    await sleep(3000);
    expScan(false,false);afterEdit();
    showToast('⏹ Al caer IN, Q cae en el MISMO scan y ET se borra: el TON no retrasa el apagado.');
    await sleep(3200);
    expKind='TOF';expReset();afterEdit();
    showToast('🔁 Ahora el TOF, mismo PT. Subimos IN dos scans y lo soltamos.');
    await sleep(2800);
    expScan(true,false);afterEdit();await sleep(500);expScan(true,false);afterEdit();await sleep(700);
    for(let k=0;k<6;k++){expScan(false,false);afterEdit();await sleep(360);}
    showToast('✔ Q siguió 5 scans DESPUÉS de soltar IN y luego cayó sola: retardo a la desconexión.');
    await sleep(3200);
    expKind='CTU';expPV=3;expReset();afterEdit();
    showToast('🔢 Contador CTU con PV = 3: cada flanco de CU suma uno; mantenerlo alto no cuenta más.');
    await sleep(3000);
    for(let k=0;k<3;k++){expScan(true,false);afterEdit();await sleep(320);expScan(true,false);afterEdit();await sleep(320);expScan(false,false);afterEdit();await sleep(320);}
    showToast('✔ Tres flancos → CV = 3 = PV, Q se activa. Los dos scans altos seguidos contaron UNA vez.');
    await sleep(3400);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('aplica');
    apTopic='comparar';afterEdit();
    showToast('🧩 Mismo estímulo para TON, TOF y TP: el pulso corto no dispara el TON pero sí el TP.');
    await sleep(4600);
    apTopic='secuencia';apRecipe=0;afterEdit();
    showToast('⛓ Secuencia de tres etapas en cascada y contador de lote: cada etapa dura exactamente su PT.');
    await sleep(4600);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('reto');
    seedReto(0);updateRetoSpec();afterEdit();
    showToast('🎯 Reto: la cinta de embalaje. Primero comprobamos el programa de partida, que está mal a propósito…');
    await sleep(3400);
    checkReto();
    showToast('…TP no sirve de retardo, TON no purga nada tras el paro y un temporizador no cuenta piezas. Lo arreglamos.');
    await sleep(4000);
    const sc=RETO_POOL[retoIdx];
    retoCh={arrT:'TON',arrP:sc.tDelay,parT:'TOF',parP:sc.tPurge,cntT:'CTU',cntP:sc.N};
    retoChecked=false;retoSolved=false;afterEdit();
    showToast('✔ TON para el retardo, TOF para la sobre-marcha y CTU para el lote. Comprobamos.');
    await sleep(2800);
    checkReto();await sleep(2400);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 17. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt,time)=>{
  hwT+=dt;
  if(hwT>0.7){hwT=0;hwStep=(hwStep+1)%hwCount();updateHW();}
});
['explora','aplica','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=()=>{if(!autoRunning)runAuto();};
el('btnNew').onclick=()=>{if(autoRunning)return;newSignal();};
el('btnCheck').onclick=()=>{if(autoRunning)return;checkReto();};
const soundBtn=el('soundBtn');if(soundBtn){soundBtn.onclick=()=>{synth.toggle();soundBtn.textContent=synth.isOn()?'🔊':'🔇';};}
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildQuiz();
S.start();
setMode('explora');

// ===================== DEBUG HOOK =====================
window.__labDebug={
  mode:()=>mode, setMode:k=>setMode(k),
  DT,
  // motor
  newT,newC,stepTON,stepTOF,stepTP,stepT,stepCTU,stepCTD,newSeq,seqStep,seqRun,
  behArr,behPar,behCnt,okArr,okPar,okCnt,
  // explora
  expKind:()=>expKind, setExpKind:k=>{expKind=k;expReset();afterEdit();},
  expPT:()=>expPT, setExpPT:v=>{expPT=v;expReset();afterEdit();},
  expPV:()=>expPV, setExpPV:v=>{expPV=v;expReset();afterEdit();},
  expScan:(inVal,aux)=>{expScan(!!inVal,!!aux);afterEdit();},
  expReset:()=>{expReset();afterEdit();},
  expInfo:()=>({kind:expKind,pt:expPT,pv:expPV,in:expIN,q:!!expS.q,et:expS.et||0,cv:isCnt(expKind)?expS.cv:null,scans:expHist.length}),
  expTrace:()=>expHist.map(h=>({in:h.in,q:h.q,et:h.et,cv:h.cv})),
  // aplica
  apTopic:()=>apTopic, setApTopic:k=>{apTopic=k;afterEdit();},
  apRecipe:()=>apRecipe, setApRecipe:i=>{apRecipe=i;afterEdit();},
  apCompare:()=>{const a=newT('TON'),b=newT('TOF',AP_PT),d=newT('TP');const r={IN:AP_IN.slice(),TON:[],TOF:[],TP:[]};
    AP_IN.forEach(v=>{r.TON.push(stepTON(a,!!v,AP_PT,DT)?1:0);r.TOF.push(stepTOF(b,!!v,AP_PT,DT)?1:0);r.TP.push(stepTP(d,!!v,AP_PT,DT)?1:0);});return r;},
  seqInfo:()=>{const R=SEQ_RECIPES[apRecipe],r=seqRun(R.PT,R.PV);return {name:R.name,PT:R.PT,PV:R.PV,cycle:R.PT.reduce((a,b)=>a+b,0),ms:r.ms,cv:r.cv,trans:r.trans.slice(0,3)};},
  // reto
  retoIdx:()=>retoIdx, seedReto:i=>{seedReto(i);updateRetoSpec();afterEdit();},
  retoName:()=>RETO_POOL[retoIdx].name,
  retoSpec:()=>{const p=RETO_POOL[retoIdx];return {name:p.name,tDelay:p.tDelay,tPurge:p.tPurge,N:p.N};},
  retoGet:()=>({...retoCh}),
  retoSetField:f=>{retoField=f;afterEdit();},
  retoSet:(field,tipo,preset)=>{retoField=field;retoSetType(tipo);retoSetPreset(preset);afterEdit();},
  retoSolveBuild:()=>{const p=RETO_POOL[retoIdx];retoCh={arrT:'TON',arrP:p.tDelay,parT:'TOF',parP:p.tPurge,cntT:'CTU',cntP:p.N};retoChecked=false;retoSolved=false;afterEdit();},
  checkReto:()=>checkReto(),
  retoChecked:()=>retoChecked, retoOkArr:()=>retoOkArr, retoOkPar:()=>retoOkPar, retoOkCnt:()=>retoOkCnt, retoSolved:()=>retoSolved,
  // quiz / general
  quizCorrectIndex:()=>{const q=QUIZ[mode];return q?q.opciones.findIndex(o=>o.ok):-1;},
  quizAnswer:i=>answer(i),
  newSignal:()=>newSignal(),
  solved:()=>solved,
};
