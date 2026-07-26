// Máquinas de estados finitos (FSM): Moore vs Mealy, diagrama de estados y diseño de un
// controlador para un proceso industrial (D3 · digital). Lógica secuencial verificada (verify_fsm.mjs, 14/14):
//   DETECTOR DE SECUENCIA (KMP): la failure-function permite solape. MOORE usa len+1 estados (0..len),
//     la salida = (estado===len) y se lee del estado actual; MEALY usa len estados (0..len-1), la salida
//     se emite en el mismo flanco del bit que completa el patrón. Ambos reconocen EL MISMO lenguaje
//     (mismas posiciones de coincidencia), verificado contra fuerza bruta (6 patrones × 3 flujos).
//   RELACIÓN DE TIEMPOS: la salida Moore es función SÓLO del estado -> registrada, aparece un ciclo
//     después (mooreReg[i]=mealy[i-1]); la Mealy es combinacional (estado+entrada) -> reacciona en el
//     mismo ciclo pero puede tener glitches con la entrada.
//   PROCESO INDUSTRIAL (Moore): controlador de tanque de mezcla IDLE->FILL->MIX->DRAIN. Cada estado
//     retiene (self-loop) hasta que llega su señal (start, nivel alto, tiempo, nivel bajo); actuadores
//     dependen SÓLO del estado. Determinista sobre las 16 combinaciones de entrada por estado.
//   Ref: Mano & Ciletti, "Diseño Digital" (FSM, Moore/Mealy, tablas de estado) · Wakerly, "Digital Design"
//        · Roth, "Fundamentals of Logic Design" · Katz, "Contemporary Logic Design" · verif. propia.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.8,2.9,7.0],target:[0.4,1.05,0.3],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.44,minD:3.2,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. FÍSICA (VERIFICADA) =====================
// ---- detector de secuencia (KMP con solape) ----
function kmpFail(P){const n=P.length,f=new Array(n).fill(0);let k=0;for(let i=1;i<n;i++){while(k>0&&P[i]!==P[k])k=f[k-1];if(P[i]===P[k])k++;f[i]=k;}return f;}
function kmpNext(P,f,s,b){let k=s;while(k>0&&b!==P[k])k=f[k-1];if(b===P[k])k++;return k;}   // k en 0..len
// MOORE: estados 0..len; salida=(estado===len). states[k+1] es el estado tras consumir stream[k].
function mooreRun(P,stream){const len=P.length,f=kmpFail(P);let s=0;const outs=[],states=[s];
  for(let k=0;k<stream.length;k++){let sc=(s===len)?f[len-1]:s;s=kmpNext(P,f,sc,stream[k]);states.push(s);outs.push(s===len?1:0);}
  return {outs,states};}
// MEALY: estados 0..len-1; salida en el flanco del bit que completa el patrón.
function mealyRun(P,stream){const len=P.length,f=kmpFail(P);let s=0;const outs=[],states=[s];
  for(let k=0;k<stream.length;k++){let sc=(s===len)?f[len-1]:s;const t=kmpNext(P,f,sc,stream[k]);outs.push(t===len?1:0);s=(t===len)?f[len-1]:t;states.push(s);}
  return {outs,states};}
// fuerza bruta: índices i donde stream[i-len+1..i]===P (solape permitido)
function bruteMatches(P,stream){const len=P.length,res=[];for(let i=len-1;i<stream.length;i++){let m=true;for(let j=0;j<len;j++)if(stream[i-len+1+j]!==P[j]){m=false;break;}if(m)res.push(i);}return res;}
function matchIdx(outs){const r=[];outs.forEach((o,i)=>{if(o)r.push(i);});return r;}

// ---- proceso industrial: controlador Moore de tanque de mezcla ----
const TS={IDLE:0,FILL:1,MIX:2,DRAIN:3};
const TANK_LBL=['ESPERA','LLENADO','MEZCLA','VACIADO'];
const TANK_TRIG=['arranque','nivel alto','tiempo cumplido','nivel bajo'];
const ACT_LBL=['Válvula entrada','Bomba','Motor mezcla','Válvula drenaje'];
function tankNext(s,inp){
  switch(s){
    case TS.IDLE:  return inp.start ?TS.FILL :TS.IDLE;
    case TS.FILL:  return inp.hi    ?TS.MIX  :TS.FILL;
    case TS.MIX:   return inp.tdone ?TS.DRAIN:TS.MIX;
    case TS.DRAIN: return inp.lo    ?TS.IDLE :TS.DRAIN;
  }
  return s;
}
// salidas Moore por estado: [válvula entrada, bomba, motor mezcla, válvula drenaje]
function tankOut(s){return [ [0,0,0,0],[1,1,0,0],[0,0,1,0],[0,0,0,1] ][s];}
function tankTrigFor(s){return [{start:true},{hi:true},{tdone:true},{lo:true}][s];}
function tankStepAdvance(s){return tankNext(s,tankTrigFor(s));}

// ===================== 3. ESTADO =====================
let mode='explora';
// explora
let expKind='detector';                  // 'detector' | 'proceso'
const PATTERNS=[
  {bits:[1,0,1,1],name:'1011'},
  {bits:[1,1,0,1],name:'1101'},
  {bits:[0,1,1,0],name:'0110'},
  {bits:[1,0,1],  name:'101' },
];
let detType='moore';                     // 'moore' | 'mealy'
let detPatIdx=0;
let detStream=[];                        // bits alimentados
let tankState=TS.IDLE;
// aplica
let apTopic='compara';                   // 'compara' (Moore vs Mealy) | 'proceso' (ciclo del tanque)
let apPatIdx=0;
// reto — completar la FSM de un proceso industrial (tabla de transición + salidas Moore)
const RETO_POOL=[
  { name:'Embotelladora',
    ctx:'una embotelladora que repite un ciclo de 4 etapas',
    stages:['Espera','Llenado','Tapado','Etiquetado'],
    trig:'sensor de fin de etapa',
    acts:['— (ninguno)','Bomba de llenado','Tapadora','Etiquetadora'],
    out:[0,1,2,3] },
  { name:'Lavadora industrial',
    ctx:'una lavadora industrial con ciclo de 4 fases',
    stages:['Llenado','Lavado','Enjuague','Centrifugado'],
    trig:'temporizador de fase',
    acts:['Válvula de agua','Motor de agitación','Válvula de enjuague','Motor de centrifugado'],
    out:[0,1,2,3] },
  { name:'Prensa neumática',
    ctx:'una prensa neumática con ciclo de 4 pasos',
    stages:['Reposo','Bajar','Prensar','Subir'],
    trig:'fin de carrera / temporizador',
    acts:['— (ninguno)','Cilindro baja','Retención de prensa','Cilindro sube'],
    out:[0,1,2,3] },
  { name:'Semáforo de cruce',
    ctx:'un semáforo con 4 fases',
    stages:['Verde','Amarillo','Rojo','Rojo+peatón'],
    trig:'temporizador de fase',
    acts:['Luz verde','Luz amarilla','Luz roja','Roja + peatón'],
    out:[0,1,2,3] },
];
let retoIdx=0;
let retoOrder=[0,1,2,3];                  // orden de presentación (barajado) de los stage-id
let retoNextSel=[1,2,3,0];                // por stage-id: siguiente stage-id elegido
let retoOutSel=[0,0,0,0];                 // por stage-id: actuador elegido (índice)
let retoChecked=false, retoOkNext=false, retoOkOut=false, retoSolved=false, retoMsg='';
let editRow=0;                            // fila del reto que se está editando
let solved=false, autoRunning=false, QUIZ={};
let hwStep=0, hwT=0;

function pickIdx(n,ex){let v=Math.floor(Math.random()*n);if(n>1)while(v===ex)v=Math.floor(Math.random()*n);return v;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}
function seedReto(idx){
  retoIdx=(idx==null)?pickIdx(RETO_POOL.length,retoIdx):idx;
  retoOrder=shuffle([0,1,2,3]);
  // arranca en un estado inicial NO resuelto (todos apuntan a Espera=0, actuador 0): fuerza al alumno a diseñar
  retoNextSel=[0,0,0,0]; retoOutSel=[0,0,0,0];
  editRow=0;
  retoChecked=false; retoOkNext=false; retoOkOut=false; retoSolved=false; retoMsg='';
}
seedReto(0);

// contexto activo (para el entrenador 3D): devuelve fotogramas {label, acts:[4], accept}
function hwFrames(){
  if(mode==='reto'){const p=RETO_POOL[retoIdx];return [0,1,2,3].map(s=>({label:p.stages[s],acts:oneHot(p.out[s]),accept:false}));}
  if(mode==='aplica'){
    if(apTopic==='proceso')return [0,1,2,3].map(s=>({label:TANK_LBL[s],acts:tankOut(s),accept:false}));
    // compara: recorre los estados del detector Moore sobre el flujo demo
    const P=PATTERNS[apPatIdx].bits,st=apStream(),tr=mooreRun(P,st);
    return tr.states.map((s,i)=>({label:'S'+s,acts:oneHot(-1),accept:s===P.length,out:i>0?tr.outs[i-1]:0}));
  }
  if(expKind==='proceso')return [0,1,2,3].map(s=>({label:TANK_LBL[s],acts:tankOut(s),accept:false}));
  // detector: recorre los estados alcanzados por el flujo actual (o una demo si está vacío)
  const P=PATTERNS[detPatIdx].bits;const st=detStream.length?detStream:P.concat([0]).concat(P);
  const tr=(detType==='moore')?mooreRun(P,st):mealyRun(P,st);
  return tr.states.map((s,i)=>({label:'S'+s,acts:oneHot(-1),accept:(detType==='moore'&&s===P.length),out:i>0?tr.outs[i-1]:0}));
}
function oneHot(i){return [0,1,2,3].map(k=>k===i?1:0);}

// ===================== 4. MATERIALES =====================
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

// ===================== 5. PIZARRÓN =====================
const boardG=new THREE.Group();
boardG.position.set(-1.15,0,-0.95);boardG.rotation.y=0.2;scene.add(boardG);
const frame=roundedBox(3.9,2.9,0.12,MAT.frame,0.06);frame.position.set(0,1.9,0);boardG.add(frame);
[-1.65,1.65].forEach(x=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.9,16),MAT.leg);leg.position.set(x,0.92,0);boardG.add(leg);});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.68,2.72),new THREE.MeshBasicMaterial({map:bTex}));
board.position.set(0,1.9,0.065);boardG.add(board);
frame.userData={title:'Máquinas de estados finitos',info:'Moore vs Mealy, diagrama de estados y diseño de un controlador industrial · toca para inspeccionar'};
addHoverLabel(frame,'Máquinas de estados finitos',ACC,new THREE.Vector3(0,3.5,0.1).add(boardG.position),2.6);

function bg(c){c.fillStyle='#0c1016';c.fillRect(0,0,1024,768);}
function rr(c,x,y,w,h,r){r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
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

// ---- diagrama en cadena (detector): estados 0..n-1 con flechas de avance ----
function drawChain(c,x,y,n,cur,acceptIdx){
  const r=24,gap=Math.min(96,(640)/Math.max(1,n));
  for(let i=0;i<n;i++){
    const bx=x+i*gap,isCur=(i===cur),isAcc=(i===acceptIdx);
    if(i<n-1){c.strokeStyle=hexA(ACC,0.5);c.lineWidth=2;c.beginPath();c.moveTo(bx+r,y);c.lineTo(bx+gap-r,y);c.stroke();
      c.beginPath();c.moveTo(bx+gap-r-8,y-5);c.lineTo(bx+gap-r,y);c.lineTo(bx+gap-r-8,y+5);c.stroke();}
    c.beginPath();c.arc(bx,y,r,0,7);c.fillStyle=isCur?ACC:hexA(ACC,0.10);c.fill();
    c.strokeStyle=isAcc?OK_HEX:(isCur?ACC:hexA(ACC,0.4));c.lineWidth=isAcc?3.5:(isCur?3:1.4);c.stroke();
    if(isAcc){c.beginPath();c.arc(bx,y,r+5,0,7);c.strokeStyle=OK_HEX;c.lineWidth=1.5;c.stroke();}
    c.fillStyle=isCur?'#0c1016':'#C9D3E2';c.font='bold 15px Outfit, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('S'+i,bx,y);
  }
  c.textBaseline='alphabetic';
}
// ---- diagrama en ciclo (proceso): n nodos con flechas i->(i+1) ----
function drawCycle(c,cx,cy,rad,labels,cur){
  const n=labels.length,pos=[];
  for(let i=0;i<n;i++){const ang=-Math.PI/2+i*2*Math.PI/n;pos.push([cx+Math.cos(ang)*rad,cy+Math.sin(ang)*rad]);}
  for(let i=0;i<n;i++){const a=pos[i],b=pos[(i+1)%n];
    const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,R=32;
    const x1=a[0]+ux*R,y1=a[1]+uy*R,x2=b[0]-ux*R,y2=b[1]-uy*R;
    c.strokeStyle=hexA(ACC,0.45);c.lineWidth=2;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
    const ah=9;c.beginPath();c.moveTo(x2,y2);c.lineTo(x2-ux*ah-uy*ah*0.6,y2-uy*ah+ux*ah*0.6);c.moveTo(x2,y2);c.lineTo(x2-ux*ah+uy*ah*0.6,y2-uy*ah-ux*ah*0.6);c.stroke();
  }
  for(let i=0;i<n;i++){const p=pos[i],isCur=(i===cur);
    c.beginPath();c.arc(p[0],p[1],30,0,7);c.fillStyle=isCur?ACC:hexA(ACC,0.10);c.fill();
    c.strokeStyle=isCur?ACC:hexA(ACC,0.4);c.lineWidth=isCur?3:1.4;c.stroke();
    c.fillStyle=isCur?'#0c1016':'#C9D3E2';c.font='bold 11px Outfit, sans-serif';c.textAlign='center';c.textBaseline='middle';
    const t=labels[i];c.fillText(t.length>10?t.slice(0,9)+'…':t,p[0],p[1]);
  }
  c.textBaseline='alphabetic';
}
// ---- forma de onda digital ----
function drawWave(c,x,y,cellW,levels,color,label,h){
  h=h||18;
  c.fillStyle='#9fb0cf';c.font='11px Outfit, sans-serif';c.textAlign='right';c.textBaseline='middle';c.fillText(label,x-8,y-h/2);c.textBaseline='alphabetic';
  if(!levels.length)return;
  c.strokeStyle=color;c.lineWidth=2;c.beginPath();
  let prevY=levels[0]?y-h:y;c.moveTo(x,prevY);c.lineTo(x+cellW,prevY);
  for(let k=1;k<levels.length;k++){const yy=levels[k]?y-h:y;const xx=x+k*cellW;if(yy!==prevY)c.lineTo(xx,yy);c.lineTo(xx+cellW,yy);prevY=yy;}
  c.stroke();
}
function clkLevels(steps){const a=[];for(let k=0;k<steps;k++){a.push(0);a.push(1);}return a;}
// flujo demostrativo para "aplica compara": garantiza ≥2 coincidencias del patrón
function apStream(){const p=PATTERNS[apPatIdx].bits;return [1,0].concat(p,[0],p);}

// ===================== 6. VISTAS POR MODO =====================
function drawExplora(c){
  if(expKind==='detector'){
    const P=PATTERNS[detPatIdx].bits,len=P.length;
    const tr=(detType==='moore')?mooreRun(P,detStream):mealyRun(P,detStream);
    const cur=tr.states[tr.states.length-1],mi=matchIdx(tr.outs),lastOut=tr.outs.length?tr.outs[tr.outs.length-1]:0;
    const nStates=(detType==='moore')?len+1:len;
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Detector de la secuencia '+PATTERNS[detPatIdx].name+'  ('+detType.toUpperCase()+')',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'Alimenta bits de uno en uno; la máquina recuerda cuánto del patrón lleva reconocido y avanza de estado. Emite 1 cuando el patrón acaba de aparecer (se permite solape).',30,64,660,18);
    // flujo alimentado con marcas de coincidencia
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.fillText('Flujo alimentado:',30,120);
    const sx=180,sw=34;
    if(!detStream.length){c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';c.fillText('(vacío — pulsa 1 ó 0)',sx,120);}
    for(let i=0;i<detStream.length;i++){const bx=sx+i*sw,hit=tr.outs[i]===1;
      c.fillStyle=hit?OK_HEX:(detStream[i]?ACC:'#4a525e');c.font='bold 18px Outfit, sans-serif';c.textAlign='center';c.fillText(detStream[i],bx,120);
      if(hit){c.fillStyle=OK_HEX;c.font='10px Outfit, sans-serif';c.fillText('▲',bx,136);}}
    // diagrama de estados en cadena
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillText('Diagrama de estados ('+nStates+' estados):',30,190);
    drawChain(c,80,250,nStates,cur,detType==='moore'?len:-1);
    c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';c.textAlign='left';
    c.fillText(detType==='moore'?'S'+len+' (verde) = estado de aceptación: en él la salida vale 1.':'Salida 1 en la transición que completa el patrón (Mealy no tiene estado de aceptación).',30,300);
    // salida
    c.fillStyle=lastOut?OK_HEX:'#9fb0cf';c.font='bold 17px Outfit, sans-serif';c.fillText('Salida actual: '+lastOut+(lastOut?'  ✓ ¡patrón detectado!':''),30,342);
    c.fillStyle='#9fb0cf';c.font='13px Outfit, sans-serif';c.fillText('Coincidencias hasta ahora: '+mi.length+(mi.length?'  (posiciones '+mi.join(', ')+')':''),30,368);
    rpanel(c,PX.x,PX.y,PX.w,180,detType.toUpperCase());
    prow(c,PX.x,PX.y+52,PX.w,'Tipo',detType==='moore'?'Moore':'Mealy');
    prow(c,PX.x,PX.y+80,PX.w,'Estados',String(nStates),ACC);
    prow(c,PX.x,PX.y+108,PX.w,'Estado actual','S'+cur,cur===len&&detType==='moore'?OK_HEX:'#F4EFEA');
    prow(c,PX.x,PX.y+136,PX.w,'Salida',String(lastOut),lastOut?OK_HEX:'#F4EFEA');
    const by=PX.y+200;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,280);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,280);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('CÓMO RECUERDA',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El estado codifica cuántos bits del patrón se llevan acertados. Un bit correcto avanza al estado siguiente; uno incorrecto NO siempre vuelve a cero: retrocede al prefijo más largo que aún sirve (por eso "1011" puede solaparse). Cambia entre Moore y Mealy arriba y observa que ambos detectan las MISMAS posiciones.',PX.x+14,by+48,PX.w-28,17);
  }else{
    const s=tankState,acts=tankOut(s);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Controlador Moore de un proceso',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'Un tanque de mezcla recorre 4 etapas. Cada etapa RETIENE hasta que llega su señal (arranque, nivel, tiempo); las salidas dependen sólo del estado (Moore).',30,64,660,18);
    drawCycle(c,290,320,150,TANK_LBL,s);
    c.fillStyle=ACC;c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.fillText('Etapa: '+TANK_LBL[s],30,540);
    c.fillStyle='#9fb0cf';c.font='13px Outfit, sans-serif';c.fillText('Avanza cuando llega: '+TANK_TRIG[s],30,566);
    rpanel(c,PX.x,PX.y,PX.w,190,'ACTUADORES (salida Moore)');
    for(let i=0;i<4;i++)prow(c,PX.x,PX.y+52+i*30,PX.w,ACT_LBL[i],acts[i]?'ON':'—',acts[i]?OK_HEX:'#6b7280');
    const by=PX.y+210;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,270);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,270);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('POR QUÉ MOORE',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'En un controlador de proceso las salidas se atan al ESTADO, no a las entradas instantáneas: así los actuadores no parpadean si una señal tiene glitches (Moore es glitch-free). Cada etapa se queda quieta (self-loop) hasta que su sensor confirma que puede avanzar: es la base segura de todo secuenciador industrial (PLC).',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawAplica(c){
  const P=PATTERNS[apPatIdx].bits,len=P.length;
  if(apTopic==='compara'){
    const st=apStream(),me=mealyRun(P,st).outs,mo=mooreRun(P,st).outs;
    const moReg=st.map((_,i)=>i>0?me[i-1]:0);   // Moore registrada: mismo evento, un ciclo después
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Moore vs Mealy (detector '+PATTERNS[apPatIdx].name+')',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'La misma función con dos estilos. Mealy responde en el ciclo del bit que completa el patrón; Moore lo registra y aparece un ciclo después, pero con menos glitches y a costa de un estado más.',30,64,680,18);
    const tx=150,ty=150,cw=Math.min(60,540/st.length);
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.fillText('DIAGRAMA DE TIEMPOS:',30,ty-18);
    drawWave(c,tx,ty,cw/2,clkLevels(st.length),'#9fb0cf','CLK',14);
    drawWave(c,tx,ty+44,cw,st,ACC,'entrada',16);
    for(let i=0;i<st.length;i++){c.fillStyle=hexA(ACC,0.85);c.font='10px Outfit, sans-serif';c.textAlign='center';c.fillText(st[i],tx+i*cw+cw/2,ty+22);}
    drawWave(c,tx,ty+96,cw,me,WARN_HEX,'Mealy',16);
    drawWave(c,tx,ty+140,cw,moReg,OK_HEX,'Moore',16);
    c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';c.textAlign='left';
    c.fillText('Mealy (amarillo) alta en el bit que completa; Moore (verde, registrada) un ciclo después.',tx-100,ty+170);
    rpanel(c,PX.x,PX.y,PX.w,190,'MOORE vs MEALY');
    prow(c,PX.x,PX.y+52,PX.w,'Estados Moore',String(len+1),OK_HEX);
    prow(c,PX.x,PX.y+80,PX.w,'Estados Mealy',String(len),WARN_HEX);
    prow(c,PX.x,PX.y+108,PX.w,'Coincidencias',String(matchIdx(me).length));
    prow(c,PX.x,PX.y+136,PX.w,'Mismo lenguaje',JSON.stringify(matchIdx(me))===JSON.stringify(matchIdx(mo))?'sí ✓':'no','#7CD992');
    const by=PX.y+210;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,270);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,270);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('EL COMPROMISO',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Mealy usa menos estados y reacciona antes (salida combinacional de estado + entrada), pero puede glitchear con la entrada. Moore usa un estado más y su salida llega un ciclo después, pero al depender sólo del estado es estable y registrada. Se elige Mealy cuando importa la latencia mínima y Moore cuando importa la robustez de la salida (control de actuadores).',PX.x+14,by+48,PX.w-28,17);
  }else{
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Tabla de estados del proceso (tanque)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'Toda FSM se especifica con una tabla: estado actual → (señal) → estado siguiente, y las salidas de cada estado. Ésta es la del controlador Moore del tanque de mezcla.',30,64,680,18);
    // tabla
    const tx=40,ty=120,cw=[130,150,150,150];const heads=['Estado','Señal para avanzar','Estado siguiente','Actuadores ON'];
    let cx=tx;c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillStyle='#C7D6F5';
    for(let k=0;k<heads.length;k++){c.fillText(heads[k],cx+8,ty);cx+=cw[k];}
    c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.beginPath();c.moveTo(tx,ty+8);c.lineTo(tx+cw.reduce((a,b)=>a+b,0),ty+8);c.stroke();
    for(let s=0;s<4;s++){const ry=ty+34+s*40;const acts=tankOut(s),on=ACT_LBL.filter((_,i)=>acts[i]);
      cx=tx;c.font='13px Outfit, sans-serif';
      c.fillStyle=ACC;c.fillText(TANK_LBL[s],cx+8,ry);cx+=cw[0];
      c.fillStyle='#9fb0cf';c.fillText(TANK_TRIG[s],cx+8,ry);cx+=cw[1];
      c.fillStyle='#F4EFEA';c.fillText(TANK_LBL[(s+1)%4],cx+8,ry);cx+=cw[2];
      c.fillStyle=on.length?OK_HEX:'#6b7280';c.font='11px Outfit, sans-serif';wrapText(c,on.length?on.join(', '):'—',cx+8,ry,cw[3]-12,13);
    }
    drawCycle(c,300,540,120,TANK_LBL,-1);
    rpanel(c,PX.x,PX.y,PX.w,170,'LA FSM COMPLETA');
    prow(c,PX.x,PX.y+52,PX.w,'Estados',String(4));
    prow(c,PX.x,PX.y+80,PX.w,'Tipo','Moore');
    prow(c,PX.x,PX.y+108,PX.w,'Ciclo','ESPERA→…→VACIADO',ACC);
    prow(c,PX.x,PX.y+136,PX.w,'Salidas','una por estado',OK_HEX);
    const by=PX.y+190;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,290);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,290);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('DE LA TABLA AL CIRCUITO',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'La tabla de estados es el puente entre la idea y el hardware: se codifican los 4 estados en 2 flip-flops, se escriben las ecuaciones del estado siguiente (lógica combinacional a la entrada de los FF) y las de salida (sólo función del estado, por ser Moore). Un PLC hace lo mismo en software: una variable de estado y un bloque CASE por etapa.',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawReto(c){
  const p=RETO_POOL[retoIdx];
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('RETO · Diseña la FSM del proceso',30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  wrapText(c,'Controla '+p.ctx+'. Completa la máquina de estados: para cada etapa elige a qué etapa AVANZA (cuando llega el '+p.trig+') y qué ACTUADOR enciende. Se califican por separado la tabla de transición y la de salidas.',30,64,660,18);
  // tabla editable
  const tx=40,ty=140,cw=[150,190,190];const heads=['Etapa','Siguiente (avance)','Actuador ON'];
  let cx=tx;c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillStyle='#C7D6F5';
  for(let k=0;k<heads.length;k++){c.fillText(heads[k],cx+8,ty);cx+=cw[k];}
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.beginPath();c.moveTo(tx,ty+8);c.lineTo(tx+cw.reduce((a,b)=>a+b,0),ty+8);c.stroke();
  for(let r=0;r<4;r++){const s=retoOrder[r];const ry=ty+40+r*54,rowY=ty+22+r*54;
    if(r===editRow){c.fillStyle=hexA(WARN_HEX,0.10);c.fillRect(tx,rowY,cw.reduce((a,b)=>a+b,0),48);
      c.strokeStyle=hexA(WARN_HEX,0.5);c.strokeRect(tx,rowY,cw.reduce((a,b)=>a+b,0),48);}
    cx=tx;
    c.fillStyle=ACC;c.font='bold 14px Outfit, sans-serif';c.fillText(p.stages[s],cx+8,ry);cx+=cw[0];
    const nextOk=retoChecked&&retoNextSel[s]===((s+1)%4),nextBad=retoChecked&&!nextOk;
    c.fillStyle=nextOk?OK_HEX:(nextBad?BAD_HEX:'#F4EFEA');c.font='14px Outfit, sans-serif';
    c.fillText(p.stages[retoNextSel[s]]+(nextOk?' ✓':nextBad?' ✗':''),cx+8,ry);cx+=cw[1];
    const outOk=retoChecked&&retoOutSel[s]===p.out[s],outBad=retoChecked&&!outOk;
    c.fillStyle=outOk?OK_HEX:(outBad?BAD_HEX:'#F4EFEA');c.font='12px Outfit, sans-serif';
    wrapText(c,p.acts[retoOutSel[s]]+(outOk?' ✓':outBad?' ✗':''),cx+8,ry,cw[2]-12,13);
  }
  c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Edita la fila resaltada con los botones del panel. La etapa que sigue a la última vuelve a la primera (ciclo).',tx,ty+40+4*54+8);
  rpanel(c,PX.x,PX.y,PX.w,140,'CALIFICACIÓN');
  prow(c,PX.x,PX.y+48,PX.w,'Tabla de transición',retoChecked?(retoOkNext?'✓ correcta':'✗ revisa'):'—',retoChecked?(retoOkNext?OK_HEX:BAD_HEX):'#6b7280');
  prow(c,PX.x,PX.y+80,PX.w,'Salidas Moore',retoChecked?(retoOkOut?'✓ correctas':'✗ revisa'):'—',retoChecked?(retoOkOut?OK_HEX:BAD_HEX):'#6b7280');
  prow(c,PX.x,PX.y+112,PX.w,'Resultado',retoChecked?(retoSolved?'✔ RESUELTO':'incompleto'):'configura',retoSolved?OK_HEX:'#F4EFEA');
  const by=PX.y+160;
  if(retoChecked){
    c.fillStyle='rgba(0,0,0,0.24)';c.fillRect(PX.x,by,PX.w,320);
    c.strokeStyle=retoSolved?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(PX.x,by,PX.w,320);
    c.fillStyle=retoSolved?OK_HEX:BAD_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='left';c.fillText(retoSolved?'✔ CORRECTO':'✗ REVISA',PX.x+14,by+26);
    c.fillStyle='#C9D3E2';c.font='12px Outfit, sans-serif';wrapText(c,retoExplain(),PX.x+14,by+52,PX.w-28,17);
  }else{
    c.fillStyle='rgba(0,0,0,0.20)';c.fillRect(PX.x,by,PX.w,320);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,320);
    c.fillStyle=WARN_HEX;c.font='13px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Un proceso cíclico avanza etapa por etapa y vuelve al inicio: la tabla de transición debe recorrer las 4 etapas en el orden correcto sin saltarse ninguna. Y cada etapa acciona su propio actuador (Moore: la salida depende sólo del estado).',PX.x+14,by+26,PX.w-28,18);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    wrapText(c,'Errores clásicos: saltarse una etapa (el proceso no la ejecuta), dejar un estado estancado (nunca vuelve a empezar) o encender el actuador equivocado.',PX.x+14,by+120,PX.w-28,18);
  }
}
function retoExplain(){
  const p=RETO_POOL[retoIdx];
  if(retoSolved)return 'La FSM recorre '+p.stages.join(' → ')+' → '+p.stages[0]+', y cada etapa acciona su actuador. Así se diseña cualquier secuenciador industrial: define los estados (etapas), las condiciones de avance y las salidas de cada estado.';
  let s='';
  if(!retoOkNext)s+='La tabla de transición no forma el ciclo correcto: debe avanzar '+p.stages.join('→')+' y volver al inicio, sin saltar ni estancar etapas. ';
  if(!retoOkOut)s+='Algún actuador está mal: cada etapa debe encender su propio actuador (Moore = salida por estado). ';
  return s||'Revisa la tabla.';
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='aplica')drawAplica(c);else if(mode==='reto')drawReto(c);else drawExplora(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='aplica')showToast('🔀 Moore y Mealy reconocen lo mismo, pero Moore ata la salida al estado (estable, un ciclo después) y Mealy al estado+entrada (rápida, un estado menos). La tabla de estados es el puente al circuito o al PLC.');
  else if(mode==='reto')showToast('🎯 Diseña la FSM: la tabla de transición debe recorrer las 4 etapas en orden y volver al inicio; cada etapa enciende su propio actuador.');
  else showToast('🔧 Conduce la máquina: en el detector alimenta bits y observa el estado avanzar; en el proceso avanza el ciclo del tanque y mira los actuadores.');
}

// ===================== 7. ESCENA 3D: ENTRENADOR =====================
const bench=roundedBox(3.7,0.5,1.8,MAT.bench,0.05);bench.position.set(1.9,0.25,0.55);scene.add(bench);
bench.userData={title:'Banco del controlador',info:'Los LEDs muestran los actuadores/salida; el chip muestra el estado actual de la FSM.'};
const pcb=roundedBox(2.4,0.08,1.2,MAT.pcb,0.03);pcb.position.set(1.95,0.54,0.5);scene.add(pcb);
pcb.userData={title:'Tarjeta de la FSM',info:'Registro de estado (flip-flops) + lógica de estado siguiente + lógica de salida.'};
addHoverLabel(pcb,'Controlador de estados',ACC,new THREE.Vector3(1.95,1.35,0.5),1.7);
const chip=roundedBox(0.56,0.14,0.5,MAT.chip,0.02);chip.position.set(1.35,0.63,0.55);scene.add(chip);
const chCv=document.createElement('canvas');chCv.width=180;chCv.height=180;const chTex=new THREE.CanvasTexture(chCv);
const chFace=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.5),new THREE.MeshBasicMaterial({map:chTex,transparent:true}));
chFace.rotation.x=-Math.PI/2;chFace.position.set(1.35,0.705,0.55);scene.add(chFace);
chip.userData={title:'Registro de estado',info:'El estado actual de la máquina; cambia en cada flanco según la lógica de estado siguiente.'};
function makeLED(x,z,color){const m=new THREE.Mesh(new THREE.SphereGeometry(0.045,16,16),std(color,0.4,0.1));m.position.set(x,0.62,z);m.material.emissive=new THREE.Color(color);m.material.emissiveIntensity=0.15;scene.add(m);return m;}
// 4 LEDs de actuador + 1 LED de salida/aceptación + 1 LED de reloj
const actLEDs=[makeLED(2.65,0.75,0x7CD992),makeLED(2.35,0.75,0x8AB4F8),makeLED(2.05,0.75,0xE9C46A),makeLED(1.75,0.75,0xC08CF8)];
const outLED=makeLED(2.85,0.35,0x7CD992);
const clkLED=makeLED(1.95,0.35,0xC08CF8);
addHoverLabel(actLEDs[0],'actuadores / salida',ACC,new THREE.Vector3(2.2,1.05,0.75),1.5);
outLED.userData={title:'Salida / aceptación',info:'Se enciende cuando la FSM emite 1 (detector: patrón hallado).'};
clkLED.userData={title:'Reloj (CLK)',info:'Un flanco por paso; el estado avanza según la lógica de estado siguiente.'};

function drawChip3D(label,accept){
  const c=chCv.getContext('2d');c.clearRect(0,0,180,180);
  c.fillStyle='rgba(20,23,27,0.92)';c.fillRect(0,0,180,180);
  c.strokeStyle=accept?OK_HEX:ACC;c.lineWidth=4;c.strokeRect(4,4,172,172);
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';c.fillText('ESTADO',90,30);
  c.font='bold 24px Outfit, sans-serif';c.fillStyle=accept?OK_HEX:'#F4EFEA';
  c.fillText(label.length>9?label.slice(0,8)+'…':label,90,100);
  if(accept){c.font='bold 14px Outfit, sans-serif';c.fillStyle=OK_HEX;c.fillText('▲ salida=1',90,140);}
  chTex.needsUpdate=true;
}
function hwCount(){return Math.max(1,hwFrames().length);}
function updateHW(){
  const frames=hwFrames(),step=hwStep%Math.max(1,frames.length),fr=frames[step]||{label:'—',acts:[0,0,0,0]};
  actLEDs.forEach((l,i)=>{const on=fr.acts&&fr.acts[i];l.material.emissiveIntensity=on?1.4:0.12;});
  const outOn=fr.accept||fr.out;
  outLED.material.emissiveIntensity=outOn?1.4:0.15;outLED.material.color.setHex(outOn?0x7CD992:0x2a3550);
  clkLED.material.emissiveIntensity=(step%2)?1.3:0.2;
  drawChip3D(fr.label,!!fr.accept);
}

// ===================== 8. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Sistemas digitales (D3) · Lógica secuencial · Máquinas de estados finitos</div>
  <h2>Máquinas de Estados Finitos · Moore / Mealy</h2>
  <p>Una <b>máquina de estados finitos (FSM)</b> es un circuito secuencial que en cada flanco pasa de un
  <b>estado</b> a otro según su <b>entrada</b>, y produce una <b>salida</b>. El estado es la memoria: resume
  todo el pasado que importa. Hay dos estilos: en una máquina de <b>Moore</b> la salida depende <b>sólo del
  estado</b> (es estable y registrada, pero necesita un estado más); en una de <b>Mealy</b> depende del
  <b>estado y de la entrada</b> (reacciona un ciclo antes y usa menos estados, pero puede tener glitches).
  Ambas se especifican con un <b>diagrama</b> y una <b>tabla de estados</b>, el puente entre la idea y el
  circuito (o el programa de un PLC). Aquí las verás en dos usos: un <b>detector de secuencia</b> (que
  reconoce un patrón de bits, con solape) y un <b>controlador de proceso industrial</b> (un tanque de mezcla
  que recorre sus etapas de forma segura). Diséñalas tú en el Reto.</p>
  <div class="formula">Moore: salida = f(estado) · Mealy: salida = f(estado, entrada) · detector: #estados Moore = len+1, Mealy = len · proceso: 1 salida por estado</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Estado / diagrama</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Salida = 1 / correcto</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Mealy / edición</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>Reloj / actuador</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el comportamiento lógico exacto de una FSM en forma de Moore (salida = función del estado, len+1 estados para el detector) y de Mealy (salida = función del estado y la entrada, len estados); el detector de secuencia con solape (mediante la failure-function de KMP), verificado contra fuerza bruta como reconocedor de las mismas posiciones; la equivalencia Moore↔Mealy (reconocen el mismo lenguaje) y la relación de tiempos (la salida Moore es la de Mealy registrada un ciclo después); y un controlador Moore de un proceso industrial (tanque de mezcla de 4 etapas) con self-loops de retención, transición por señal y salidas por estado, determinista sobre las 16 combinaciones de entrada por estado. Verificado numéricamente (6 patrones × 3 flujos; barrido 4×16 del proceso).</div>
    <div class="fl no"><b>NO modela:</b> los tiempos reales (setup/hold, retardo reloj-a-Q, frecuencia máxima, metaestabilidad al muestrear entradas asíncronas); los glitches concretos de una salida Mealy; la minimización/asignación óptima de estados (aquí los estados ya están dados); la codificación de estados (binaria/Gray/one-hot) y la síntesis de las ecuaciones de excitación de los flip-flops; ni la implementación física (familia lógica, tipo de flip-flop, PLC/HDL concretos, arranque/reset asíncrono).</div>
  </div>
  <div class="src">Ref: Mano &amp; Ciletti, Diseño Digital · Wakerly, Digital Design · Roth, Fundamentals of Logic Design · Katz, Contemporary Logic Design · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>FSM · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_aplica">🧩 Aplica</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Diseño de la FSM</h4>
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

// ===================== 9. TOASTS =====================
function showToast(html){const t=el('toast');t.innerHTML=html;t.classList.add('show');clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),4200);}

// ===================== 10. MODOS Y CONTROLES =====================
const MODE_META={
  explora:{nombre:'Explora',cam:[[4.8,2.9,7.0],[0.4,1.05,0.3]],mision:'Conduce una FSM: en el detector de secuencia alimenta bits y observa el estado avanzar (cambia entre Moore y Mealy); en el proceso industrial avanza el ciclo del tanque y mira las salidas por estado.'},
  aplica:{nombre:'Aplica',cam:[[4.6,2.8,6.8],[0.4,1.05,0.3]],mision:'Compara Moore y Mealy sobre el mismo detector (diagrama de tiempos: Mealy reacciona antes, Moore registra un ciclo después) y lee la tabla de estados completa del proceso.'},
  reto:{nombre:'Reto',cam:[[4.7,2.7,6.9],[0.5,1.0,0.4]],mision:'Diseña la máquina de estados de un proceso industrial: completa la tabla de transición (el ciclo de etapas) y la de salidas (un actuador por estado).'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';let html='';
  if(mode==='explora'){
    html+=lbl('Bloque:')+`<button class="b sm ${expKind==='detector'?'on':''}" data-k="detector">Detector</button><button class="b sm ${expKind==='proceso'?'on':''}" data-k="proceso">Proceso</button>`;
    if(expKind==='detector'){
      html+=lbl('Tipo:')+`<button class="b sm ${detType==='moore'?'on':''}" data-dt="moore">Moore</button><button class="b sm ${detType==='mealy'?'on':''}" data-dt="mealy">Mealy</button>`;
      html+=lbl('Patrón:')+PATTERNS.map((p,i)=>`<button class="b sm ${i===detPatIdx?'on':''}" data-dp="${i}">${p.name}</button>`).join('');
      html+=lbl('Alimenta:')+`<button class="b sm" data-fb="1">bit 1 ▸</button><button class="b sm" data-fb="0">bit 0 ▸</button><button class="b sm" data-fclr="t">Limpiar</button>`;
    }else{
      html+=lbl('Ciclo:')+`<button class="b sm" data-tadv="t">Avanzar ▸</button><button class="b sm" data-thold="t">Señal irrelevante</button><button class="b sm" data-trst="t">Reiniciar</button>`;
    }
    bar.innerHTML=html;
    bar.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expKind=b.dataset.k;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-dt]').forEach(b=>b.onclick=()=>{if(autoRunning)return;detType=b.dataset.dt;synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-dp]').forEach(b=>b.onclick=()=>{if(autoRunning)return;detPatIdx=parseInt(b.dataset.dp,10);detStream=[];hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-fb]').forEach(b=>b.onclick=()=>{if(autoRunning)return;detStream.push(parseInt(b.dataset.fb,10));synth.beep(860,0.06,0.05);afterEdit();});
    bar.querySelectorAll('[data-fclr]').forEach(b=>b.onclick=()=>{if(autoRunning)return;detStream=[];synth.beep(400,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-tadv]').forEach(b=>b.onclick=()=>{if(autoRunning)return;tankState=tankStepAdvance(tankState);synth.beep(840,0.06,0.05);afterEdit();});
    bar.querySelectorAll('[data-thold]').forEach(b=>b.onclick=()=>{if(autoRunning)return;tankState=tankNext(tankState,{});synth.beep(300,0.06,0.05);showToast('Sin la señal correcta, la etapa se RETIENE (self-loop): '+TANK_LBL[tankState]+'.');afterEdit();});
    bar.querySelectorAll('[data-trst]').forEach(b=>b.onclick=()=>{if(autoRunning)return;tankState=TS.IDLE;synth.beep(440,0.05,0.04);afterEdit();});
  }else if(mode==='aplica'){
    html+=lbl('Tema:')+`<button class="b sm ${apTopic==='compara'?'on':''}" data-at="compara">Moore vs Mealy</button><button class="b sm ${apTopic==='proceso'?'on':''}" data-at="proceso">Tabla del proceso</button>`;
    if(apTopic==='compara')html+=lbl('Patrón:')+PATTERNS.map((p,i)=>`<button class="b sm ${i===apPatIdx?'on':''}" data-ap="${i}">${p.name}</button>`).join('');
    bar.innerHTML=html;
    bar.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apTopic=b.dataset.at;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ap]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apPatIdx=parseInt(b.dataset.ap,10);hwStep=0;synth.beep(720,0.05,0.04);afterEdit();});
  }else{
    const p=RETO_POOL[retoIdx],s=retoOrder[editRow];
    html+=lbl('Fila:')+retoOrder.map((sid,r)=>`<button class="b sm ${r===editRow?'on':''}" data-er="${r}">${p.stages[sid]}</button>`).join('');
    html+=lbl('Siguiente:')+p.stages.map((nm,i)=>`<button class="b sm ${retoNextSel[s]===i?'on':''}" data-rn="${i}">${nm}</button>`).join('');
    html+=lbl('Actuador:')+p.acts.map((nm,i)=>`<button class="b sm ${retoOutSel[s]===i?'on':''}" data-ro="${i}">${nm}</button>`).join('');
    bar.innerHTML=html;
    bar.querySelectorAll('[data-er]').forEach(b=>b.onclick=()=>{if(autoRunning)return;editRow=parseInt(b.dataset.er,10);synth.beep(640,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoNextSel[s]=parseInt(b.dataset.rn,10);retoChecked=false;retoSolved=false;synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ro]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoOutSel[s]=parseInt(b.dataset.ro,10);retoChecked=false;retoSolved=false;synth.beep(760,0.05,0.04);afterEdit();});
  }
}
function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='reto'){box.style.display='none';return;}
  const p=RETO_POOL[retoIdx];box.style.display='block';
  box.innerHTML=`Proceso: <b>${p.name}</b> — ${p.ctx}. Completa el ciclo de etapas y las salidas.`;
}
function setMode(k){
  mode=k;hwStep=0;
  ['explora','aplica','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('retoTitle').style.display=k==='reto'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  if(k==='reto')updateRetoSpec();
  buildControls();updateScenarioInfo();
  solved=(k==='reto')?retoSolved:false;
  clearDx();buildQuiz();refreshQuestion();
  const cam=MODE_META[k].cam;S.moveTo(cam[0],cam[1]);refreshAll();
}
function afterEdit(){buildControls();updateScenarioInfo();refreshAll();}
function newSignal(){
  if(mode==='reto'){seedReto();updateRetoSpec();afterEdit();solved=false;showToast('🔀 Nuevo proceso: '+RETO_POOL[retoIdx].name+'.');}
  else if(mode==='aplica'){
    if(apTopic==='compara')apPatIdx=pickIdx(PATTERNS.length,apPatIdx);
    else apTopic='compara';
    afterEdit();showToast('🔀 Nuevo caso.');
  }else{
    if(expKind==='detector'){detPatIdx=pickIdx(PATTERNS.length,detPatIdx);detStream=[];detType=Math.random()<0.5?'moore':'mealy';}
    else{tankState=TS.IDLE;}
    afterEdit();showToast('🔀 '+(expKind==='detector'?'Detector del patrón '+PATTERNS[detPatIdx].name:'Proceso del tanque')+'. Condúcelo.');
  }
  synth.beep(520,0.08,0.05);hwStep=0;
}

// ===================== 11. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele');
  if(mode==='reto'){
    const p=RETO_POOL[retoIdx];
    t.innerHTML=teleRow('Proceso',p.name)+
      teleRow('Etapas',String(4))+
      teleRow('Editando',p.stages[retoOrder[editRow]],'good')+
      teleRow('Transición',retoChecked?(retoOkNext?'✓':'✗'):'—',retoChecked&&retoOkNext?'good':'warn')+
      teleRow('Salidas',retoChecked?(retoOkOut?'✓':'✗'):'—',retoChecked&&retoOkOut?'good':'warn');
    return;
  }
  if(mode==='aplica'){
    const P=PATTERNS[apPatIdx].bits,len=P.length;
    if(apTopic==='compara'){const st=apStream(),me=mealyRun(P,st).outs;
      t.innerHTML=teleRow('Detector',PATTERNS[apPatIdx].name)+teleRow('Estados Moore',String(len+1),'good')+teleRow('Estados Mealy',String(len),'warn')+teleRow('Coincidencias',String(matchIdx(me).length));
    }else{
      t.innerHTML=teleRow('Proceso','Tanque de mezcla')+teleRow('Estados',String(4))+teleRow('Tipo','Moore')+teleRow('Salidas','1 por estado','good');
    }
    return;
  }
  if(expKind==='detector'){
    const P=PATTERNS[detPatIdx].bits,len=P.length,tr=(detType==='moore')?mooreRun(P,detStream):mealyRun(P,detStream),cur=tr.states[tr.states.length-1],lastOut=tr.outs.length?tr.outs[tr.outs.length-1]:0;
    t.innerHTML=teleRow('Detector',PATTERNS[detPatIdx].name+' ('+detType+')')+teleRow('Estados',String(detType==='moore'?len+1:len))+teleRow('Estado actual','S'+cur,cur===len&&detType==='moore'?'good':'')+teleRow('Salida',String(lastOut),lastOut?'good':'')+teleRow('Bits',String(detStream.length));
  }else{
    const acts=tankOut(tankState),on=ACT_LBL.filter((_,i)=>acts[i]);
    t.innerHTML=teleRow('Proceso','Tanque (Moore)')+teleRow('Etapa',TANK_LBL[tankState],'good')+teleRow('Avanza con',TANK_TRIG[tankState])+teleRow('Actuador',on.length?on.join(', '):'—',on.length?'good':'');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='reto'){
    const p=RETO_POOL[retoIdx];
    html+=retoMsg||`<span class="mono">${p.name}: elige la fila (etapa) con el primer selector; luego su etapa siguiente y su actuador. El ciclo correcto recorre las 4 etapas y vuelve al inicio. Comprueba.</span>`;
  }else if(mode==='aplica'){
    const P=PATTERNS[apPatIdx].bits,len=P.length;
    if(apTopic==='compara')html+=`<span class="mono">Detector ${PATTERNS[apPatIdx].name}: Moore usa ${len+1} estados y registra la salida (aparece un ciclo después); Mealy usa ${len} y responde en el mismo ciclo. Ambos detectan las mismas posiciones.</span>`;
    else html+=`<span class="mono">La tabla de estados especifica, por cada etapa, la señal de avance, el estado siguiente y las salidas. De ahí se derivan las ecuaciones de los flip-flops (o el CASE de un PLC).</span>`;
  }else{
    if(expKind==='detector'){const P=PATTERNS[detPatIdx].bits;html+=`<span class="mono">Detector ${PATTERNS[detPatIdx].name} (${detType}): alimenta bits y observa el estado avanzar. Un bit correcto sube de estado; uno incorrecto retrocede al prefijo útil (permite solape). Emite 1 al completar el patrón.</span>`;}
    else html+=`<span class="mono">Tanque de mezcla: pulsa "Avanzar ▸" para dar la señal de la etapa (arranque/nivel/tiempo) y ver el ciclo ESPERA→LLENADO→MEZCLA→VACIADO. "Señal irrelevante" muestra que la etapa se retiene.</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();updateHW();}

// ===================== 12. RETO =====================
function updateRetoSpec(){
  const p=RETO_POOL[retoIdx];
  el('retoSpec').innerHTML=`Diseña la FSM de <b>${p.name}</b>. Para cada etapa, elige a qué etapa <b>avanza</b> (al llegar el ${p.trig}) y qué <b>actuador</b> enciende. Pulsa "Comprobar".`;
}
function checkReto(){
  const p=RETO_POOL[retoIdx];
  retoOkNext=[0,1,2,3].every(s=>retoNextSel[s]===((s+1)%4));
  retoOkOut =[0,1,2,3].every(s=>retoOutSel[s]===p.out[s]);
  retoSolved=retoOkNext&&retoOkOut;retoChecked=true;solved=retoSolved;
  synth.beep(retoSolved?1046:220,retoSolved?0.14:0.15,0.06);
  retoMsg=`<span class="mono"><span class="${retoSolved?'ok':'dtc'}">${retoSolved?'✔ Correcto':'✗ Revisa'}</span> — ${retoExplain()}</span>`;
  refreshAll();
}

// ===================== 13. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Qué distingue a una máquina de Moore de una de Mealy?',
      opciones:[
        {t:'En Moore la salida depende SÓLO del estado; en Mealy depende del estado Y de la entrada actual.',ok:true,why:'Correcto. Por eso Moore da una salida estable/registrada (y suele necesitar un estado más) y Mealy reacciona en el mismo ciclo con menos estados, pero puede glitchear con la entrada.'},
        {t:'Moore es combinacional y Mealy es secuencial.',ok:false,why:'No: ambas son secuenciales (tienen estado y reloj). La diferencia está en de qué depende la SALIDA, no en si tienen memoria.'},
        {t:'Mealy no tiene estados; sólo Moore los tiene.',ok:false,why:'Ambas tienen estados. Mealy suele necesitar menos (para un detector: len frente a len+1 de Moore), pero no cero.'},
        {t:'Moore sólo sirve para contadores y Mealy sólo para detectores.',ok:false,why:'Las dos formas sirven para cualquier FSM; de hecho son equivalentes (reconocen el mismo lenguaje). La elección es por tiempos y robustez, no por aplicación.'},
      ],
    },
    aplica:{
      pregunta:'Un detector Moore y uno Mealy reconocen el mismo patrón. ¿Cómo difieren sus salidas en el tiempo?',
      opciones:[
        {t:'Mealy se activa en el ciclo del bit que completa el patrón; la salida Moore, al depender del estado, aparece registrada un ciclo después.',ok:true,why:'Correcto: es la relación clásica salida_Moore[i]=salida_Mealy[i−1]. Mealy minimiza latencia; Moore da una salida limpia y sincronizada.'},
        {t:'La salida Moore aparece un ciclo antes que la de Mealy.',ok:false,why:'Es al revés: Mealy reacciona antes (combinacional); Moore la registra y sale un ciclo después.'},
        {t:'Ambas salidas son idénticas ciclo a ciclo, sin diferencia de tiempo.',ok:false,why:'Detectan las mismas posiciones, pero no en el mismo ciclo: la Moore está desplazada un ciclo por ser registrada.'},
        {t:'Mealy detecta más ocurrencias que Moore.',ok:false,why:'No: reconocen el mismo lenguaje (las mismas ocurrencias, incluso con solape). Sólo cambian el número de estados y el instante de la salida.'},
      ],
    },
    reto:{
      pregunta:'Al diseñar la FSM de un proceso cíclico industrial, ¿qué garantiza que funcione y sea seguro?',
      opciones:[
        {t:'Que la tabla de transición recorra todas las etapas en orden y vuelva al inicio, y que cada etapa (estado) accione sólo su actuador (Moore).',ok:true,why:'Correcto: un ciclo completo sin etapas saltadas ni estancadas, con salidas atadas al estado, es un secuenciador robusto. Cada avance espera la señal de su sensor (self-loop hasta entonces).'},
        {t:'Que cada actuador dependa de las entradas instantáneas para reaccionar lo más rápido posible.',ok:false,why:'Eso (estilo Mealy puro sobre entradas ruidosas) puede hacer parpadear los actuadores con glitches. En control de proceso se prefiere Moore: salida por estado, estable.'},
        {t:'Que la máquina cambie de etapa en cada flanco de reloj sin esperar señales.',ok:false,why:'No: cada etapa debe RETENERSE (self-loop) hasta que su sensor confirme que puede avanzar; avanzar a ciegas es inseguro.'},
        {t:'Que use el mayor número posible de estados para tener margen.',ok:false,why:'Más estados no es mejor: se usan los estados necesarios (las etapas del proceso). Estados de más complican la lógica y la depuración.'},
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

// ===================== 14. PICKING Y HOVER =====================
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

// ===================== 15. RECORRIDO AUTOMÁTICO =====================
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorriendo…';
  try{
    synth.init();synth.resume();clearDx();
    setMode('explora');
    expKind='detector';detType='moore';detPatIdx=0;detStream=[];afterEdit();
    showToast('🔧 Detector Moore del patrón 1011. Alimentamos bits y el estado avanza al reconocer el patrón.');
    await sleep(3600);
    for(const b of [1,0,1,1]){detStream.push(b);afterEdit();await sleep(1100);}
    showToast('▲ Al llegar el último 1 el estado alcanza la ACEPTACIÓN (S4) y la salida vale 1.');
    await sleep(3400);
    detType='mealy';afterEdit();
    showToast('🔁 El mismo caso en Mealy: un estado menos y la salida en el mismo bit que completa el patrón.');
    await sleep(3800);
    expKind='proceso';tankState=TS.IDLE;afterEdit();
    showToast('🏭 Proceso Moore: el tanque recorre sus etapas; cada una acciona sólo su actuador.');
    await sleep(3200);
    for(let k=0;k<4;k++){tankState=tankStepAdvance(tankState);afterEdit();await sleep(1500);}
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('aplica');
    apTopic='compara';apPatIdx=0;afterEdit();
    showToast('🧩 Moore vs Mealy: fíjate en el diagrama de tiempos — Mealy (amarillo) reacciona antes, Moore (verde) registra un ciclo después.');
    await sleep(4600);
    apTopic='proceso';afterEdit();
    showToast('📋 La tabla de estados del tanque: estado → señal → siguiente, y la salida de cada estado. Es el puente al circuito o al PLC.');
    await sleep(4400);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('reto');
    seedReto(0);updateRetoSpec();afterEdit();
    showToast('🎯 Reto: diseñar la FSM de una embotilladora. Primero, un intento incompleto…');
    await sleep(3000);
    checkReto();
    showToast('…con la tabla sin completar, ni el ciclo ni las salidas son correctos. Lo diseñamos bien.');
    await sleep(3400);
    retoNextSel=[1,2,3,0];retoOutSel=[...RETO_POOL[retoIdx].out];afterEdit();
    showToast('✔ Ciclo completo Espera→Llenado→Tapado→Etiquetado→Espera, y un actuador por etapa. Comprobamos.');
    await sleep(2600);
    checkReto();await sleep(2400);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 16. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt,time)=>{
  hwT+=dt;
  if(hwT>0.85){hwT=0;hwStep=(hwStep+1)%hwCount();updateHW();}
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
  // física
  kmpFail, kmpNext, mooreRun, mealyRun, bruteMatches, matchIdx, tankNext, tankOut, tankStepAdvance,
  // explora detector
  expKind:()=>expKind, setExpKind:k=>{expKind=k;afterEdit();},
  detType:()=>detType, setDetType:t=>{detType=t;afterEdit();},
  setDetPattern:i=>{detPatIdx=i;detStream=[];afterEdit();},
  feedBit:b=>{detStream.push(b?1:0);afterEdit();},
  clearStream:()=>{detStream=[];afterEdit();},
  detState:()=>{const P=PATTERNS[detPatIdx].bits,tr=(detType==='moore')?mooreRun(P,detStream):mealyRun(P,detStream);const cur=tr.states[tr.states.length-1];return {type:detType,pattern:PATTERNS[detPatIdx].name,state:cur,nStates:(detType==='moore')?P.length+1:P.length,matches:matchIdx(tr.outs),lastOut:tr.outs.length?tr.outs[tr.outs.length-1]:0,accept:(detType==='moore'&&cur===P.length)};},
  // explora proceso
  tankState:()=>tankState, setTankState:s=>{tankState=s;afterEdit();},
  tankAdvance:()=>{tankState=tankStepAdvance(tankState);afterEdit();},
  tankHold:()=>{tankState=tankNext(tankState,{});afterEdit();},
  tankReset:()=>{tankState=TS.IDLE;afterEdit();},
  tankInfo:()=>({state:tankState,label:TANK_LBL[tankState],acts:tankOut(tankState),trig:TANK_TRIG[tankState]}),
  // aplica
  apTopic:()=>apTopic, setApTopic:k=>{apTopic=k;afterEdit();},
  setApPattern:i=>{apPatIdx=i;afterEdit();},
  compareResult:()=>{const P=PATTERNS[apPatIdx].bits,st=apStream(),me=mealyRun(P,st).outs,mo=mooreRun(P,st).outs;return {pattern:PATTERNS[apPatIdx].name,mooreStates:P.length+1,mealyStates:P.length,mealyMatches:matchIdx(me),mooreMatches:matchIdx(mo),sameLanguage:JSON.stringify(matchIdx(me))===JSON.stringify(matchIdx(mo)),bruteMatches:bruteMatches(P,st)};},
  // reto
  retoIdx:()=>retoIdx, seedReto:i=>{seedReto(i);afterEdit();},
  retoName:()=>RETO_POOL[retoIdx].name, retoStages:()=>RETO_POOL[retoIdx].stages.slice(),
  retoSetNext:(s,v)=>{retoNextSel[s]=v;retoChecked=false;retoSolved=false;afterEdit();},
  retoSetOut:(s,v)=>{retoOutSel[s]=v;retoChecked=false;retoSolved=false;afterEdit();},
  retoNextSel:()=>retoNextSel.slice(), retoOutSel:()=>retoOutSel.slice(),
  retoSolveBuild:()=>{retoNextSel=[1,2,3,0];retoOutSel=[...RETO_POOL[retoIdx].out];retoChecked=false;retoSolved=false;afterEdit();},
  checkReto:()=>checkReto(),
  retoChecked:()=>retoChecked, retoOkNext:()=>retoOkNext, retoOkOut:()=>retoOkOut, retoSolved:()=>retoSolved,
  // quiz / general
  quizCorrectIndex:()=>{const q=QUIZ[mode];return q?q.opciones.findIndex(o=>o.ok):-1;},
  quizAnswer:i=>answer(i),
  newSignal:()=>newSignal(),
  solved:()=>solved,
};
