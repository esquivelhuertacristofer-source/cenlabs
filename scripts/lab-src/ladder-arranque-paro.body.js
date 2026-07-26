// Lógica de contactos (ladder / IEC 61131-3): arranque-paro con sello (seal-in) e inversión de giro
// con enclavamiento (interlock), y el ciclo de scan de un PLC (D3 · digital). Lógica booleana verificada
// (verify_ladder.mjs, 15/15):
//   CONTACTO: NO(x)=x, NC(x)=!x. RUNG: valor = AND de bloques ( OR de ramas ( AND de contactos ) ):
//     serie = AND, paralelo = OR. SCAN: los rungs se resuelven en orden; una bobina actualizada la ven
//     los rungs POSTERIORES del mismo scan; el sello lee el valor de la bobina del scan anterior.
//   ARRANQUE-PARO: M = (Start OR M) AND /Stop. La rama "OR M" es el SELLO (retención): sin ella la
//     bobina sólo sigue al botón (jog). El /Stop en serie es NC ⇒ el paro es DOMINANTE (rompe el AND).
//   INVERSIÓN CON ENCLAVAMIENTO: rungF y rungR llevan en serie el NC de la bobina contraria ⇒ nunca
//     conducen a la vez; con arranque simultáneo desde reposo gana el rung SUPERIOR (prioridad de rung).
//   Verificado: sello [0,1,1,1,0,0]; jog [0,1,0,1,0]; paro dominante [1,0,1]; punto fijo del scan;
//     tabla 8/8 de (Start∨M)∧¬Stop; serie=AND y paralelo=OR (4/4); F y R nunca simultáneas; errores
//     detectables (sin sello ⇒ jog, Stop como NO ⇒ roto, sin enclavamiento ⇒ ambas encienden).
//   Ref: IEC 61131-3 (lenguajes de PLC, Ladder Diagram LD) · Petruzella, "Programmable Logic Controllers"
//        · Bolton, "Programmable Logic Controllers" · Hackworth, "Programmable Logic Controllers" · verif. propia.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.8,2.9,7.0],target:[0.4,1.05,0.3],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.44,minD:3.2,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. FÍSICA / LÓGICA (VERIFICADA 15/15) =====================
// contacto {ref,type:'NO'|'NC'} ; NO(x)=x ; NC(x)=!x
// rung {coil, blocks:[block,...]} ; block=[branch,...] (OR/paralelo) ; branch=[contact,...] (AND/serie)
function contactCond(c,val){const v=val(c.ref);return c.type==='NC'?!v:!!v;}
function evalRung(rung,val){return rung.blocks.every(block=>block.some(branch=>branch.every(c=>contactCond(c,val))));}
// un scan: recorre los rungs en orden; cada bobina actualizada la ven los rungs posteriores del mismo scan.
function scan(rungs,inputs,coils){
  const nc={...coils};
  const val=ref=>(ref in inputs)?!!inputs[ref]:!!nc[ref];
  for(const r of rungs)nc[r.coil]=evalRung(r,val);
  return nc;
}
function run(rungs,seq,coilNames){
  let coils={};coilNames.forEach(n=>coils[n]=false);
  const hist=[];
  for(const inp of seq){coils=scan(rungs,inp,coils);hist.push({...coils});}
  return hist;
}
// arranque-paro con sello:  M = (Start OR M) AND /Stop
const rungM={coil:'M',blocks:[
  [ [{ref:'Start',type:'NO'}], [{ref:'M',type:'NO'}] ],   // (Start OR M) ← rama de sello
  [ [{ref:'Stop',type:'NC'}] ],                           // AND /Stop
]};
// inversión de giro con enclavamiento (F = adelante, R = atrás)
const rungF={coil:'F',blocks:[
  [ [{ref:'StartF',type:'NO'}], [{ref:'F',type:'NO'}] ],
  [ [{ref:'Stop',type:'NC'}] ],
  [ [{ref:'R',type:'NC'}] ],   // enclavamiento: no arrancar si R está activo
]};
const rungR={coil:'R',blocks:[
  [ [{ref:'StartR',type:'NO'}], [{ref:'R',type:'NO'}] ],
  [ [{ref:'Stop',type:'NC'}] ],
  [ [{ref:'F',type:'NC'}] ],
]};
const RUNGS_INV=[rungF,rungR];
// construye una bobina a partir de las decisiones del Reto (sello / tipo de Stop / enclavamiento)
function buildRetoCoil(coil,startRef,otherCoil,ch){
  const b1=[[{ref:startRef,type:'NO'}]];
  if(ch.seal==='NO')b1.push([{ref:coil,type:'NO'}]);
  else if(ch.seal==='NC')b1.push([{ref:coil,type:'NC'}]);
  const blocks=[b1,[[{ref:'Stop',type:ch.stop}]]];
  if(ch.lock==='NC')blocks.push([[{ref:otherCoil,type:'NC'}]]);
  else if(ch.lock==='NO')blocks.push([[{ref:otherCoil,type:'NO'}]]);
  return {coil,blocks};
}
function retoRungs(ch){return [buildRetoCoil('F','StartF','R',ch),buildRetoCoil('R','StartR','F',ch)];}
// pruebas de comportamiento sobre una configuración del Reto (feedback honesto)
function retoBehavior(ch){
  const R=retoRungs(ch);
  const hRet=run(R,[{StartF:1},{}],['F','R']);           // ¿retiene tras soltar Marcha?
  const hStp=run(R,[{StartF:1},{Stop:1},{}],['F','R']);  // ¿arranca, el paro apaga y se mantiene apagada?
  const hLck=run(R,[{StartF:1},{StartR:1}],['F','R']);   // ¿nunca F y R a la vez?
  return {
    reten: hRet[1].F===true,
    paro:  hStp[0].F===true && hStp[1].F===false && hStp[2].F===false,
    lock:  hLck.every(s=>!(s.F&&s.R)),
  };
}

// ===================== 3. ESTADO =====================
let mode='explora';
// explora — simulación viva del scan
let expBlock='arranque';                 // 'arranque' | 'inversion'
let expCoils={M:false,F:false,R:false};
let expLast={};                          // último pulso (para resaltar entradas)
let expHist=[];                          // historial de bobinas (traza de scan)
// aplica
let apTopic='sello';                     // 'sello' | 'enclavamiento'
// reto — diseñar el ladder de inversión con arranque-paro
const RETO_POOL=[
  {name:'Banda transportadora reversible',ctx:'una banda que puede avanzar o retroceder',fwd:'Avanzar',rev:'Retroceder'},
  {name:'Portón automático',ctx:'un portón de nave que abre o cierra',fwd:'Abrir',rev:'Cerrar'},
  {name:'Husillo de torno',ctx:'el husillo de un torno con avance y retroceso',fwd:'Avance',rev:'Retroceso'},
  {name:'Polipasto',ctx:'un polipasto que iza o arría carga',fwd:'Subir',rev:'Bajar'},
];
let retoIdx=0;
let retoCh={seal:'none',stop:'NO',lock:'none'};   // arranca sin resolver: fuerza a diseñar
let retoField='seal';                             // decisión que se edita
let retoChecked=false,retoOkSeal=false,retoOkStop=false,retoOkLock=false,retoSolved=false,retoMsg='';
let solved=false,autoRunning=false,QUIZ={};
let hwStep=0,hwT=0;

function pickIdx(n,ex){let v=Math.floor(Math.random()*n);if(n>1)while(v===ex)v=Math.floor(Math.random()*n);return v;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
function seedReto(idx){
  retoIdx=(idx==null)?pickIdx(RETO_POOL.length,retoIdx):idx;
  retoCh={seal:'none',stop:'NO',lock:'none'};
  retoField='seal';
  retoChecked=false;retoOkSeal=false;retoOkStop=false;retoOkLock=false;retoSolved=false;retoMsg='';
}
seedReto(0);

// ---- esquema de un rung para dibujar y para energizar desde el motor ----
// {coilKey, coilLabel, startRef, startLabel, seal:{ref,type,label}|null, series:[{ref,type,label},...]}
function schemArranque(){return {coilKey:'M',coilLabel:'M · motor',startRef:'Start',startLabel:'Marcha',
  seal:{ref:'M',type:'NO',label:'M'},series:[{ref:'Stop',type:'NC',label:'Paro'}]};}
function schemF(){return {coilKey:'F',coilLabel:'F · adelante',startRef:'StartF',startLabel:'Marcha F',
  seal:{ref:'F',type:'NO',label:'F'},series:[{ref:'Stop',type:'NC',label:'Paro'},{ref:'R',type:'NC',label:'R'}]};}
function schemR(){return {coilKey:'R',coilLabel:'R · atrás',startRef:'StartR',startLabel:'Marcha R',
  seal:{ref:'R',type:'NO',label:'R'},series:[{ref:'Stop',type:'NC',label:'Paro'},{ref:'F',type:'NC',label:'F'}]};}
function schemReto(coilKey){
  const p=RETO_POOL[retoIdx];const isF=coilKey==='F';
  const other=isF?'R':'F',startRef=isF?'StartF':'StartR';
  const startLabel='Marcha '+(isF?p.fwd:p.rev);
  const seal=retoCh.seal==='none'?null:{ref:coilKey,type:retoCh.seal,label:coilKey};
  const series=[{ref:'Stop',type:retoCh.stop,label:'Paro'}];
  if(retoCh.lock!=='none')series.push({ref:other,type:retoCh.lock,label:other});
  return {coilKey,coilLabel:(isF?p.fwd:p.rev)+' ('+coilKey+')',startRef,startLabel,seal,series};
}
// valor actual (para resaltar): las entradas del último pulso o el valor de bobina
function expVal(ref){return (ref in expLast)?!!expLast[ref]:!!expCoils[ref];}

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
frame.userData={title:'Lógica de contactos (ladder)',info:'Arranque-paro con sello e inversión con enclavamiento · toca para inspeccionar'};
addHoverLabel(frame,'Ladder · arranque-paro y enclavamientos',ACC,new THREE.Vector3(0,3.5,0.1).add(boardG.position),2.9);

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

// ---- dibujo de un rung de ladder ----
// rieles + grupo paralelo (Start / sello) + contactos serie + bobina. Verde = conduce/energizado.
function drawContact(c,x,y,label,type,cond){
  const w=44,g=9;const col=cond?OK_HEX:'#6b7280';
  c.strokeStyle=col;c.lineWidth=cond?3:2;
  c.beginPath();c.moveTo(x,y);c.lineTo(x+(w-2*g)/2,y);c.stroke();          // entra
  c.beginPath();c.moveTo(x+w-(w-2*g)/2,y);c.lineTo(x+w,y);c.stroke();      // sale
  c.beginPath();c.moveTo(x+(w-2*g)/2,y-11);c.lineTo(x+(w-2*g)/2,y+11);     // barra izq
  c.moveTo(x+w-(w-2*g)/2,y-11);c.lineTo(x+w-(w-2*g)/2,y+11);c.stroke();    // barra der
  if(type==='NC'){c.beginPath();c.moveTo(x+(w-2*g)/2-4,y+11);c.lineTo(x+w-(w-2*g)/2+4,y-11);c.stroke();} // diagonal NC
  c.fillStyle=cond?OK_HEX:'#9fb0cf';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';
  c.fillText(label,x+w/2,y-16);
  c.fillStyle='#6b7280';c.font='10px Outfit, sans-serif';c.fillText(type,x+w/2,y+24);
  return w;
}
function drawCoil(c,x,y,label,energ){
  const r=15,col=energ?OK_HEX:'#6b7280';
  c.strokeStyle=col;c.lineWidth=energ?3:2;
  c.beginPath();c.arc(x+r,y,r,Math.PI*0.62,Math.PI*1.38);c.stroke();          // paréntesis izq (
  c.beginPath();c.arc(x+r,y,r,Math.PI*1.62,Math.PI*0.38);c.stroke();          // paréntesis der )  -> "( )"
  c.fillStyle=energ?OK_HEX:'#9fb0cf';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.fillText(label,x+r,y-24);
  if(energ){c.fillStyle=OK_HEX;c.font='10px Outfit, sans-serif';c.fillText('ON',x+r,y+30);}
}
function drawRung(c,x0,y,w,schem,val){
  const railL=x0,railR=x0+w;
  const sealCond=schem.seal?contactCond(schem.seal,val):false;
  const startCond=contactCond({ref:schem.startRef,type:'NO'},val);
  const parCond=startCond||sealCond;
  // rieles
  c.strokeStyle=hexA(ACC,0.55);c.lineWidth=3;
  c.beginPath();c.moveTo(railL,y-40);c.lineTo(railL,y+40);c.stroke();
  c.beginPath();c.moveTo(railR,y-40);c.lineTo(railR,y+40);c.stroke();
  let x=railL;
  // grupo paralelo: Start arriba, sello abajo
  const px=x+10, cw=44, topY=y-16, botY=y+16;
  c.strokeStyle=hexA(ACC,0.5);c.lineWidth=2;
  if(schem.seal){
    // ramales verticales de unión
    c.strokeStyle=(startCond||sealCond)?OK_HEX:'#4a525e';c.lineWidth=2;
    c.beginPath();c.moveTo(px,topY);c.lineTo(px,botY);c.stroke();
    c.beginPath();c.moveTo(px+10+cw,topY);c.lineTo(px+10+cw,botY);c.stroke();
    c.strokeStyle=startCond?OK_HEX:'#4a525e';c.beginPath();c.moveTo(railL,topY);c.lineTo(px,topY);c.stroke();
    c.strokeStyle=parCond?OK_HEX:'#4a525e';c.beginPath();c.moveTo(px+10+cw,y-16);c.lineTo(px+10+cw+6,y-16);c.lineTo(px+10+cw+6,y);c.stroke();
    drawContact(c,px+10,topY,schem.startLabel,'NO',startCond);
    drawContact(c,px+10,botY,schem.seal.label,schem.seal.type,sealCond);
    x=px+10+cw+6;
  }else{
    c.strokeStyle=startCond?OK_HEX:'#4a525e';c.lineWidth=2;c.beginPath();c.moveTo(railL,y);c.lineTo(px+10,y);c.stroke();
    drawContact(c,px+10,y,schem.startLabel,'NO',startCond);
    x=px+10+cw;
  }
  // conexión al primer contacto serie
  let cond=parCond;
  for(const s of schem.series){
    c.strokeStyle=cond?OK_HEX:'#4a525e';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x+16,y);c.stroke();
    x+=16;
    const sc=contactCond(s,val);
    drawContact(c,x,y,s.label,s.type,cond&&sc);
    cond=cond&&sc;
    x+=44;
  }
  // hacia la bobina
  const energ=cond;
  c.strokeStyle=energ?OK_HEX:'#4a525e';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(railR-42,y);c.stroke();
  drawCoil(c,railR-40,y,schem.coilLabel,energ);
  return energ;
}

// ===================== 6. VISTAS POR MODO =====================
function drawExplora(c){
  if(expBlock==='arranque'){
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Arranque-paro con sello (seal-in)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'Pulsa Marcha: la bobina se enciende y se RETIENE por la rama de sello (contacto NO de sí misma en paralelo con el botón). Suéltalo (Reposo) y sigue encendida. Pulsa Paro: el contacto NC se abre y rompe el enclave.',30,64,660,18);
    drawRung(c,70,220,600,schemArranque(),expVal);
    c.fillStyle=expCoils.M?OK_HEX:'#9fb0cf';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
    c.fillText('Motor: '+(expCoils.M?'EN MARCHA ▶':'parado'),70,320);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    c.fillText('Último evento: '+(inpLabel(expLast)||'—'),70,346);
    // traza de scan
    drawTrace(c,70,400,expHist.map(h=>h.M),'M',600);
    c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';
    c.fillText('Cada pulso = un ciclo de scan. La rama de sello lee el valor de M del scan anterior: por eso se mantiene.',70,470);
    rpanel(c,PX.x,PX.y,PX.w,160,'ECUACIÓN DEL RUNG');
    c.fillStyle=ACC;c.font='bold 15px Outfit, sans-serif';c.textAlign='center';c.fillText('M = (Marcha ∨ M) ∧ /Paro',PX.x+PX.w/2,PX.y+64);
    prow(c,PX.x,PX.y+96,PX.w,'Bobina M',expCoils.M?'ON':'—',expCoils.M?OK_HEX:'#6b7280');
    prow(c,PX.x,PX.y+124,PX.w,'Sello',expCoils.M?'reteniendo':'inactivo',expCoils.M?OK_HEX:'#6b7280');
    const by=PX.y+180;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,300);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,300);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('POR QUÉ SE RETIENE',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Los botones son momentáneos (pulsar y soltar). Sin sello, la bobina sólo estaría ON mientras aprietas: eso es un "jog" (impulso). La rama en paralelo con el botón realimenta la propia bobina: una vez encendida, ella misma se sostiene. El Paro es un contacto NC en serie: al pulsarlo se abre y corta la corriente del rung; como es AND, DOMINA sobre la marcha (paro dominante = seguridad).',PX.x+14,by+48,PX.w-28,17);
  }else{
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Inversión de giro con enclavamiento',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'Dos bobinas: ADELANTE (F) y ATRÁS (R). Cada una lleva su sello y su paro; y en serie, el contacto NC de la contraria (enclavamiento): mientras una corre, la otra no puede arrancar. Para invertir hay que PARAR primero.',30,64,660,18);
    drawRung(c,70,190,600,schemF(),expVal);
    drawRung(c,70,330,600,schemR(),expVal);
    c.fillStyle=expCoils.F?OK_HEX:(expCoils.R?ACC:'#9fb0cf');c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
    c.fillText('Sentido: '+(expCoils.F?'ADELANTE ▶':expCoils.R?'◀ ATRÁS':'detenido'),70,420);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';c.fillText('Último evento: '+(inpLabel(expLast)||'—'),70,446);
    c.fillStyle=(expCoils.F&&expCoils.R)?BAD_HEX:OK_HEX;c.font='bold 13px Outfit, sans-serif';
    c.fillText((expCoils.F&&expCoils.R)?'⚠ CORTOCIRCUITO (no debería ocurrir)':'✓ F y R nunca a la vez (enclavamiento)',70,474);
    rpanel(c,PX.x,PX.y,PX.w,170,'ENCLAVAMIENTO');
    prow(c,PX.x,PX.y+52,PX.w,'ADELANTE (F)',expCoils.F?'ON':'—',expCoils.F?OK_HEX:'#6b7280');
    prow(c,PX.x,PX.y+80,PX.w,'ATRÁS (R)',expCoils.R?'ON':'—',expCoils.R?ACC:'#6b7280');
    prow(c,PX.x,PX.y+108,PX.w,'Simultáneas','imposible ✓',OK_HEX);
    prow(c,PX.x,PX.y+136,PX.w,'Prioridad','rung superior (F)',ACC);
    const by=PX.y+190;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,290);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,290);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('POR QUÉ ENCLAVAR',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Si ambos contactores cerraran a la vez, se cortocircuitarían dos fases de la red: falla grave. El enclavamiento por software (NC de la bobina contraria en serie) impide eléctricamente esa combinación. En la industria se refuerza con enclavamiento por hardware (contactos auxiliares NC de los propios contactores) y a veces mecánico. Si pulsas ambas marchas desde reposo, gana el rung SUPERIOR (F): el orden del scan resuelve el empate.',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawAplica(c){
  if(apTopic==='sello'){
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Con sello vs. sin sello (jog)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'La misma secuencia de pulsos sobre dos rungs: uno CON rama de sello y otro SIN ella. El de sello se retiene; el de jog sigue exactamente al botón.',30,64,680,18);
    const seq=[{Start:1},{},{},{Stop:1},{}];
    const withSeal=run([rungM],seq,['M']).map(s=>s.M?1:0);
    const rungJog={coil:'M',blocks:[[[{ref:'Start',type:'NO'}]],[[{ref:'Stop',type:'NC'}]]]};
    const jog=run([rungJog],seq,['M']).map(s=>s.M?1:0);
    const labels=['Marcha','(soltar)','(soltar)','Paro','(soltar)'];
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.fillText('SECUENCIA DE PULSOS (un scan cada uno):',40,130);
    const tx=60,cw=110;
    for(let i=0;i<seq.length;i++){c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';c.textAlign='center';c.fillText(labels[i],tx+i*cw+cw/2,158);}
    drawTraceLabeled(c,tx,210,withSeal,'CON sello',cw,OK_HEX);
    drawTraceLabeled(c,tx,300,jog,'SIN sello (jog)',cw,WARN_HEX);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Con sello (verde): tras soltar Marcha la bobina permanece ON hasta el Paro. Jog (amarillo): sólo está ON en el scan del pulso de Marcha; al soltar cae. El jog se usa a propósito para movimientos "a impulsos" (posicionar), pero NO para marcha continua.',40,360,660,18);
    rpanel(c,PX.x,PX.y,PX.w,150,'LA CLAVE');
    c.fillStyle=OK_HEX;c.font='bold 14px Outfit, sans-serif';c.textAlign='center';c.fillText('Sello = OR con la propia bobina',PX.x+PX.w/2,PX.y+58);
    prow(c,PX.x,PX.y+90,PX.w,'Con sello','se retiene',OK_HEX);
    prow(c,PX.x,PX.y+118,PX.w,'Sin sello','sigue al botón',WARN_HEX);
    const by=PX.y+170;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,310);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,310);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('EL SCAN DEL PLC',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El PLC lee entradas, resuelve todos los rungs de arriba a abajo y escribe salidas; repite miles de veces por segundo. La rama de sello funciona porque, en el scan siguiente, la bobina ya vale 1 y el OR se sostiene sola aunque el botón esté suelto. Es memoria construida con realimentación, no un flip-flop físico.',PX.x+14,by+48,PX.w-28,17);
  }else{
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Tabla de verdad del enclavamiento',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    wrapText(c,'Un scan de los dos rungs de inversión (F arriba, R abajo) para cada combinación de marchas, partiendo de reposo. El NC de la bobina contraria impide que ambas conduzcan.',30,64,680,18);
    const rows=[
      {inp:{},lbl:'reposo'},
      {inp:{StartF:1},lbl:'sólo Marcha F'},
      {inp:{StartR:1},lbl:'sólo Marcha R'},
      {inp:{StartF:1,StartR:1},lbl:'ambas a la vez'},
    ];
    const tx=40,ty=130,cw=[230,110,110,180];const heads=['Entrada (desde reposo)','F','R','Resultado'];
    let cx=tx;c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillStyle='#C7D6F5';
    for(let k=0;k<heads.length;k++){c.fillText(heads[k],cx+8,ty);cx+=cw[k];}
    c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.beginPath();c.moveTo(tx,ty+8);c.lineTo(tx+cw.reduce((a,b)=>a+b,0),ty+8);c.stroke();
    rows.forEach((r,i)=>{const h=scan(RUNGS_INV,r.inp,{F:false,R:false});const ry=ty+40+i*46;
      cx=tx;c.font='13px Outfit, sans-serif';
      c.fillStyle='#9fb0cf';c.fillText(r.lbl,cx+8,ry);cx+=cw[0];
      c.fillStyle=h.F?OK_HEX:'#6b7280';c.font='bold 14px Outfit, sans-serif';c.fillText(h.F?'ON':'—',cx+8,ry);cx+=cw[1];
      c.fillStyle=h.R?ACC:'#6b7280';c.fillText(h.R?'ON':'—',cx+8,ry);cx+=cw[2];
      c.fillStyle=(h.F&&h.R)?BAD_HEX:'#C9D3E2';c.font='12px Outfit, sans-serif';
      c.fillText((h.F&&h.R)?'⚠ ambas':(h.F?'gira ADELANTE':h.R?'gira ATRÁS':'detenido'),cx+8,ry);
    });
    c.fillStyle=OK_HEX;c.font='bold 13px Outfit, sans-serif';c.textAlign='left';
    c.fillText('✓ En "ambas a la vez", gana F (rung superior): el enclavamiento evita el conflicto.',tx,ty+40+4*46+10);
    rpanel(c,PX.x,PX.y,PX.w,160,'DOMINANCIA');
    prow(c,PX.x,PX.y+52,PX.w,'Paro','dominante (NC)',OK_HEX);
    prow(c,PX.x,PX.y+80,PX.w,'F y R','excluyentes',OK_HEX);
    prow(c,PX.x,PX.y+108,PX.w,'Empate','gana rung 1 (F)',ACC);
    prow(c,PX.x,PX.y+136,PX.w,'Refuerzo','HW auxiliar NC',WARN_HEX);
    const by=PX.y+180;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,300);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,300);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('DEFENSA EN PROFUNDIDAD',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El enclavamiento por software (NC de la contraria) es la primera línea. La norma pide además enclavamiento por hardware: contactos auxiliares NC de cada contactor cableados en la bobina del otro, e incluso enclavamiento mecánico. Así, aunque el programa fallara o un contacto se pegara, sigue siendo imposible cerrar ambos contactores a la vez.',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawReto(c){
  const p=RETO_POOL[retoIdx];
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('RETO · Diseña el ladder de inversión',30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  wrapText(c,'Programa el arranque-paro con inversión para '+p.ctx+'. Decide las tres piezas de cada rung: la rama de retención (sello), el contacto de Paro y el enclavamiento. Se califica cada decisión por separado.',30,64,660,18);
  // dibuja los dos rungs según las decisiones actuales
  drawRung(c,60,180,560,schemReto('F'),r=>false);
  drawRung(c,60,300,560,schemReto('R'),r=>false);
  c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Vista del programa que estás diseñando (F arriba, R abajo). Ajústalo con los selectores del panel.',60,370);
  // calificación por decisión
  const dy=410;
  drawDecision(c,40,dy,'Retención (sello)',retoCh.seal==='none'?'sin rama':(retoCh.seal==='NO'?'NO de la bobina':'NC de la bobina'),retoChecked,retoOkSeal);
  drawDecision(c,40,dy+56,'Paro en serie',retoCh.stop==='NC'?'contacto NC':'contacto NO',retoChecked,retoOkStop);
  drawDecision(c,40,dy+112,'Enclavamiento',retoCh.lock==='none'?'ninguno':(retoCh.lock==='NC'?'NC de la contraria':'NO de la contraria'),retoChecked,retoOkLock);
  rpanel(c,PX.x,PX.y,PX.w,150,'CALIFICACIÓN');
  prow(c,PX.x,PX.y+48,PX.w,'Retención',retoChecked?(retoOkSeal?'✓':'✗'):'—',retoChecked?(retoOkSeal?OK_HEX:BAD_HEX):'#6b7280');
  prow(c,PX.x,PX.y+80,PX.w,'Paro',retoChecked?(retoOkStop?'✓':'✗'):'—',retoChecked?(retoOkStop?OK_HEX:BAD_HEX):'#6b7280');
  prow(c,PX.x,PX.y+112,PX.w,'Enclavamiento',retoChecked?(retoOkLock?'✓':'✗'):'—',retoChecked?(retoOkLock?OK_HEX:BAD_HEX):'#6b7280');
  const by=PX.y+170;
  if(retoChecked){
    c.fillStyle='rgba(0,0,0,0.24)';c.fillRect(PX.x,by,PX.w,310);
    c.strokeStyle=retoSolved?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(PX.x,by,PX.w,310);
    c.fillStyle=retoSolved?OK_HEX:BAD_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='left';c.fillText(retoSolved?'✔ CORRECTO':'✗ REVISA',PX.x+14,by+26);
    c.fillStyle='#C9D3E2';c.font='12px Outfit, sans-serif';wrapText(c,retoExplain(),PX.x+14,by+52,PX.w-28,17);
  }else{
    c.fillStyle='rgba(0,0,0,0.20)';c.fillRect(PX.x,by,PX.w,310);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,310);
    c.fillStyle=WARN_HEX;c.font='13px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Un arranque-paro seguro necesita: (1) retención por sello para no depender del botón; (2) Paro como contacto NC en serie, para que sea dominante; (3) enclavamiento con el NC de la bobina contraria, para que nunca giren ambos sentidos.',PX.x+14,by+26,PX.w-28,18);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    wrapText(c,'Errores clásicos: sin sello (queda como jog), Paro con NO (el motor sólo corre mientras pulsas Paro) o sin enclavamiento (pueden cerrarse ambos contactores).',PX.x+14,by+140,PX.w-28,18);
  }
}
function drawDecision(c,x,y,title,val,checked,ok){
  const w=620,h=46;
  c.fillStyle=checked?hexA(ok?OK_HEX:BAD_HEX,0.10):hexA(ACC,0.06);c.fillRect(x,y,w,h);
  c.strokeStyle=checked?(ok?OK_HEX:BAD_HEX):hexA(ACC,0.25);c.lineWidth=1.5;c.strokeRect(x,y,w,h);
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText(title,x+14,y+28);
  c.fillStyle=checked?(ok?OK_HEX:BAD_HEX):'#F4EFEA';c.font='bold 15px Outfit, sans-serif';c.textAlign='right';
  c.fillText(val+(checked?(ok?'  ✓':'  ✗'):''),x+w-16,y+28);
}
function retoExplain(){
  if(retoSolved)return 'Programa correcto: cada bobina se retiene por su sello, el Paro NC es dominante y el NC de la contraria impide el arranque simultáneo. Éste es el patrón universal de arranque-paro con inversión (IEC 61131-3).';
  let s='';
  const b=retoBehavior(retoCh);
  if(!retoOkSeal)s+='Retención: usa el contacto NO de la propia bobina en paralelo con la marcha ('+(b.reten?'':'ahora no se retiene: es un jog')+'). ';
  if(!retoOkStop)s+='Paro: debe ser NC en serie para que sea dominante ('+(b.paro?'':'con NO el rung sólo conduce mientras se pulsa Paro: ni arranca con la marcha ni se puede parar')+'). ';
  if(!retoOkLock)s+='Enclavamiento: falta el NC de la bobina contraria ('+(b.lock?'':'ahora pueden encenderse ambas')+'). ';
  return s||'Revisa el programa.';
}

// ---- trazas ----
function drawTrace(c,x,y,levels,label,w){
  c.fillStyle='#9fb0cf';c.font='11px Outfit, sans-serif';c.textAlign='left';c.fillText('Traza de '+label+' (por scan):',x,y-14);
  if(!levels.length){c.fillStyle='#6b7280';c.fillText('(sin pulsos aún)',x,y+8);return;}
  const cw=Math.min(46,w/Math.max(1,levels.length)),h=26;
  c.strokeStyle=OK_HEX;c.lineWidth=2;c.beginPath();
  let prevY=levels[0]?y-h:y;c.moveTo(x,prevY);c.lineTo(x+cw,prevY);
  for(let k=1;k<levels.length;k++){const yy=levels[k]?y-h:y,xx=x+k*cw;if(yy!==prevY)c.lineTo(xx,yy);c.lineTo(xx+cw,yy);prevY=yy;}
  c.stroke();
  for(let k=0;k<levels.length;k++){c.fillStyle=levels[k]?OK_HEX:'#6b7280';c.font='10px Outfit, sans-serif';c.textAlign='center';c.fillText(levels[k]?'1':'0',x+k*cw+cw/2,y+18);}
}
function drawTraceLabeled(c,x,y,levels,label,cw,col){
  c.fillStyle=col;c.font='bold 12px Outfit, sans-serif';c.textAlign='left';c.fillText(label,x,y-30);
  const h=26;c.strokeStyle=col;c.lineWidth=2;c.beginPath();
  let prevY=levels[0]?y-h:y;c.moveTo(x,prevY);c.lineTo(x+cw,prevY);
  for(let k=1;k<levels.length;k++){const yy=levels[k]?y-h:y,xx=x+k*cw;if(yy!==prevY)c.lineTo(xx,yy);c.lineTo(xx+cw,yy);prevY=yy;}
  c.stroke();
  for(let k=0;k<levels.length;k++){c.fillStyle=levels[k]?col:'#6b7280';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.fillText(levels[k]?'1':'0',x+k*cw+cw/2,y+20);}
}

function inpLabel(inp){
  if(!inp||!Object.keys(inp).length)return 'Reposo (soltar)';
  if(inp.Start)return 'Marcha';if(inp.Stop)return 'Paro';
  if(inp.StartF)return 'Marcha ADELANTE';if(inp.StartR)return 'Marcha ATRÁS';
  return '—';
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='aplica')drawAplica(c);else if(mode==='reto')drawReto(c);else drawExplora(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='aplica')showToast('🔀 El sello (OR con la propia bobina) construye memoria; el Paro NC es dominante; el NC de la contraria enclava. Todo se resuelve en el ciclo de scan del PLC.');
  else if(mode==='reto')showToast('🎯 Diseña el rung: rama de sello (NO de la bobina), Paro NC en serie y NC de la contraria para enclavar.');
  else showToast('🔧 Pulsa Marcha y suéltala: el sello retiene. Pulsa Paro: el NC lo rompe. En inversión, para antes de invertir.');
}

// ===================== 7. ESCENA 3D: TABLERO DE CONTROL =====================
const bench=roundedBox(3.7,0.5,1.8,MAT.bench,0.05);bench.position.set(1.9,0.25,0.55);scene.add(bench);
bench.userData={title:'Tablero de control',info:'Los pilotos muestran los contactores y el estado de retención; el chip, el modo.'};
const pcb=roundedBox(2.4,0.08,1.2,MAT.pcb,0.03);pcb.position.set(1.95,0.54,0.5);scene.add(pcb);
pcb.userData={title:'PLC + contactores',info:'El PLC resuelve el ladder cada scan y energiza las bobinas de los contactores.'};
addHoverLabel(pcb,'PLC · lógica de contactos',ACC,new THREE.Vector3(1.95,1.35,0.5),1.7);
const chip=roundedBox(0.56,0.14,0.5,MAT.chip,0.02);chip.position.set(1.35,0.63,0.55);scene.add(chip);
const chCv=document.createElement('canvas');chCv.width=180;chCv.height=180;const chTex=new THREE.CanvasTexture(chCv);
const chFace=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.5),new THREE.MeshBasicMaterial({map:chTex,transparent:true}));
chFace.rotation.x=-Math.PI/2;chFace.position.set(1.35,0.705,0.55);scene.add(chFace);
chip.userData={title:'CPU del PLC',info:'Ejecuta el ciclo de scan: lee entradas, resuelve rungs, escribe salidas.'};
function makeLED(x,z,color){const m=new THREE.Mesh(new THREE.SphereGeometry(0.045,16,16),std(color,0.4,0.1));m.position.set(x,0.62,z);m.material.emissive=new THREE.Color(color);m.material.emissiveIntensity=0.15;scene.add(m);return m;}
// pilotos: [contactor F, contactor R, retención/sello, paro] + salida (motor energizado) + reloj de scan
const actLEDs=[makeLED(2.65,0.75,0x7CD992),makeLED(2.35,0.75,0x8AB4F8),makeLED(2.05,0.75,0xE9C46A),makeLED(1.75,0.75,0xff6b6b)];
const outLED=makeLED(2.85,0.35,0x7CD992);
const clkLED=makeLED(1.95,0.35,0xC08CF8);
addHoverLabel(actLEDs[0],'F · R · sello · paro',ACC,new THREE.Vector3(2.2,1.05,0.75),1.6);
outLED.userData={title:'Motor energizado',info:'Se enciende cuando alguna bobina de marcha está activa.'};
clkLED.userData={title:'Reloj de scan',info:'Un flanco por ciclo de scan del PLC.'};

function drawChip3D(label,accept){
  const c=chCv.getContext('2d');c.clearRect(0,0,180,180);
  c.fillStyle='rgba(20,23,27,0.92)';c.fillRect(0,0,180,180);
  c.strokeStyle=accept?OK_HEX:ACC;c.lineWidth=4;c.strokeRect(4,4,172,172);
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';c.fillText('PLC · SCAN',90,30);
  c.font='bold 20px Outfit, sans-serif';c.fillStyle=accept?OK_HEX:'#F4EFEA';
  c.fillText(label.length>10?label.slice(0,9)+'…':label,90,100);
  if(accept){c.font='bold 14px Outfit, sans-serif';c.fillStyle=OK_HEX;c.fillText('▶ marcha',90,140);}
  chTex.needsUpdate=true;
}
// fotogramas de demostración para animar los pilotos
function demoFrames(rungs,seq){
  let coils={M:false,F:false,R:false};const fr=[];
  for(const inp of seq){
    coils=scan(rungs,inp,coils);
    const on1=coils.M||coils.F,on2=coils.R;
    const started=('Start'in inp)||('StartF'in inp)||('StartR'in inp);
    const reten=(on1||on2)&&!started;
    fr.push({label:inpLabel(inp),acts:[on1?1:0,on2?1:0,reten?1:0,('Stop'in inp)?1:0],accept:on1||on2});
  }
  return fr;
}
function hwFrames(){
  if(mode==='reto')return demoFrames(retoRungs(retoCh),[{StartF:1},{},{StartR:1},{Stop:1},{StartR:1},{}]);
  if(mode==='aplica'){
    if(apTopic==='enclavamiento')return demoFrames(RUNGS_INV,[{StartF:1},{},{StartR:1},{Stop:1},{StartR:1},{}]);
    return demoFrames([rungM],[{Start:1},{},{},{Stop:1},{}]);
  }
  if(expBlock==='inversion')return demoFrames(RUNGS_INV,[{StartF:1},{},{StartR:1},{Stop:1},{StartR:1},{}]);
  return demoFrames([rungM],[{Start:1},{},{},{Stop:1},{}]);
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

// ===================== 8. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Sistemas digitales (D3) · Lógica de contactos · Ladder (IEC 61131-3)</div>
  <h2>Arranque-Paro con Sello y Enclavamientos</h2>
  <p>El <b>diagrama de escalera</b> (ladder, LD) es el lenguaje de PLC más usado en la industria: cada
  <b>rung</b> (peldaño) es una ecuación booleana entre dos rieles de alimentación. Un <b>contacto</b>
  <b>normalmente abierto (NO)</b> conduce si su señal vale 1; uno <b>normalmente cerrado (NC)</b> conduce si
  vale 0. En serie forman un <b>AND</b>; en paralelo, un <b>OR</b>. El PLC ejecuta un <b>ciclo de scan</b>:
  lee entradas, resuelve los rungs de arriba abajo y escribe salidas, miles de veces por segundo. Con eso se
  construyen dos patrones universales: el <b>arranque-paro con sello</b> —una rama en paralelo con el botón
  que realimenta la propia bobina para que se <b>retenga</b> tras soltar la marcha, con el <b>paro NC</b>
  <b>dominante</b> en serie— y la <b>inversión de giro con enclavamiento</b> —el contacto <b>NC de la bobina
  contraria</b> en serie impide que ambos contactores cierren a la vez—. Explóralos, compáralos y diséñalos tú.</p>
  <div class="formula">M = (Marcha ∨ M) ∧ /Paro · serie = AND · paralelo = OR · NO(x)=x · NC(x)=¬x · F y R excluyentes por /R y /F</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Rung / contacto R</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Conduce / energizado / correcto</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Sello / sin sello</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Paro / error</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la lógica booleana exacta de un diagrama de escalera resuelto por el ciclo de scan de un PLC: contactos NO(x)=x y NC(x)=¬x; serie = AND y paralelo = OR; el peldaño de arranque-paro con sello M=(Marcha∨M)∧¬Paro (retención por realimentación, jog sin sello, paro NC dominante); la inversión de giro con enclavamiento (NC de la bobina contraria en serie ⇒ F y R nunca simultáneas) y la resolución de empates por prioridad de rung (gana el superior). Los rungs se evalúan en orden y una bobina actualizada la ven los rungs posteriores del mismo scan. Verificado numéricamente (15/15): tabla 8/8, punto fijo del scan, y los errores detectables de diseño.</div>
    <div class="fl no"><b>NO modela:</b> el tiempo real del scan ni el retardo entrada→salida; el rebote de contactos ni la dinámica física del contactor (tiempo de cierre, arco, desgaste); temporizadores y contadores (TON/TOF/TP/CTU/CTD), flancos/one-shots, ni bloques funcionales; señales analógicas o PID; el enclavamiento por hardware/mecánico real (aquí sólo el de software); las categorías de seguridad (ISO 13849 / paro de emergencia cableado) ni el juego de instrucciones concreto de ningún fabricante.</div>
  </div>
  <div class="src">Ref: IEC 61131-3 (LD) · Petruzella, Programmable Logic Controllers · Bolton, Programmable Logic Controllers · Hackworth, Programmable Logic Controllers · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Ladder · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_aplica">🧩 Aplica</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Diseño del ladder</h4>
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
  explora:{nombre:'Explora',cam:[[4.8,2.9,7.0],[0.4,1.05,0.3]],mision:'Conduce el ladder: pulsa Marcha y suéltala para ver el sello retener la bobina, y Paro para romperlo (NC dominante). En inversión, comprueba que hay que parar antes de invertir (enclavamiento).'},
  aplica:{nombre:'Aplica',cam:[[4.6,2.8,6.8],[0.4,1.05,0.3]],mision:'Compara el rung con sello contra el jog (sin sello) ante la misma secuencia, y lee la tabla de verdad del enclavamiento de inversión.'},
  reto:{nombre:'Reto',cam:[[4.7,2.7,6.9],[0.5,1.0,0.4]],mision:'Diseña el ladder de inversión de un proceso: elige la rama de sello, el tipo de contacto del Paro y el enclavamiento. Se califica cada decisión.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';let html='';
  if(mode==='explora'){
    html+=lbl('Circuito:')+`<button class="b sm ${expBlock==='arranque'?'on':''}" data-eb="arranque">Arranque-paro</button><button class="b sm ${expBlock==='inversion'?'on':''}" data-eb="inversion">Inversión</button>`;
    if(expBlock==='arranque'){
      html+=lbl('Pulsar:')+`<button class="b sm" data-pl="Start">Marcha ▸</button><button class="b sm" data-pl="Stop">Paro ▸</button><button class="b sm" data-pl="reposo">Reposo ▸</button><button class="b sm" data-prst="t">Reiniciar</button>`;
    }else{
      html+=lbl('Pulsar:')+`<button class="b sm" data-pl="StartF">Marcha ADEL ▸</button><button class="b sm" data-pl="StartR">Marcha ATRÁS ▸</button><button class="b sm" data-pl="Stop">Paro ▸</button><button class="b sm" data-pl="reposo">Reposo ▸</button><button class="b sm" data-prst="t">Reiniciar</button>`;
    }
    bar.innerHTML=html;
    bar.querySelectorAll('[data-eb]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expBlock=b.dataset.eb;expReset();synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-pl]').forEach(b=>b.onclick=()=>{if(autoRunning)return;pulse(b.dataset.pl);synth.beep(b.dataset.pl==='Stop'?300:820,0.06,0.05);afterEdit();});
    bar.querySelectorAll('[data-prst]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expReset();synth.beep(440,0.05,0.04);afterEdit();});
  }else if(mode==='aplica'){
    html+=lbl('Tema:')+`<button class="b sm ${apTopic==='sello'?'on':''}" data-at="sello">Sello vs jog</button><button class="b sm ${apTopic==='enclavamiento'?'on':''}" data-at="enclavamiento">Enclavamiento</button>`;
    bar.innerHTML=html;
    bar.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apTopic=b.dataset.at;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
  }else{
    html+=lbl('Decisión:')+`<button class="b sm ${retoField==='seal'?'on':''}" data-rf="seal">Retención</button><button class="b sm ${retoField==='stop'?'on':''}" data-rf="stop">Paro</button><button class="b sm ${retoField==='lock'?'on':''}" data-rf="lock">Enclavamiento</button>`;
    if(retoField==='seal')html+=lbl('Sello:')+optBtns('rs',[['NO','NO de la bobina'],['NC','NC de la bobina'],['none','Sin sello']],retoCh.seal);
    else if(retoField==='stop')html+=lbl('Paro:')+optBtns('rp',[['NC','Contacto NC'],['NO','Contacto NO']],retoCh.stop);
    else html+=lbl('Enclav.:')+optBtns('rl',[['NC','NC de la contraria'],['NO','NO de la contraria'],['none','Sin enclavamiento']],retoCh.lock);
    bar.innerHTML=html;
    bar.querySelectorAll('[data-rf]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoField=b.dataset.rf;synth.beep(640,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rs]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoCh.seal=b.dataset.rs;retoChecked=false;retoSolved=false;synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoCh.stop=b.dataset.rp;retoChecked=false;retoSolved=false;synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rl]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoCh.lock=b.dataset.rl;retoChecked=false;retoSolved=false;synth.beep(720,0.05,0.04);afterEdit();});
  }
}
function optBtns(key,opts,cur){return opts.map(([v,t])=>`<button class="b sm ${cur===v?'on':''}" data-${key}="${v}">${t}</button>`).join('');}

function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='reto'){box.style.display='none';return;}
  const p=RETO_POOL[retoIdx];box.style.display='block';
  box.innerHTML=`Proceso: <b>${p.name}</b> — ${p.ctx}. Diseña sus rungs de inversión.`;
}
function expReset(){expCoils={M:false,F:false,R:false};expLast={};expHist=[];}
function pulse(name){
  const inputs=name==='reposo'?{}:{[name]:1};
  const rungs=expBlock==='inversion'?RUNGS_INV:[rungM];
  expCoils=scan(rungs,inputs,expCoils);
  expLast=inputs;expHist.push({...expCoils});if(expHist.length>14)expHist.shift();
  hwStep=0;
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
  if(mode==='reto'){seedReto();updateRetoSpec();afterEdit();solved=false;showToast('🔀 Nuevo proceso: '+RETO_POOL[retoIdx].name+'.');}
  else if(mode==='aplica'){apTopic=apTopic==='sello'?'enclavamiento':'sello';afterEdit();showToast('🔀 Nuevo tema.');}
  else{expBlock=expBlock==='arranque'?'inversion':'arranque';expReset();afterEdit();showToast('🔀 '+(expBlock==='arranque'?'Arranque-paro con sello':'Inversión con enclavamiento')+'. Condúcelo.');}
  synth.beep(520,0.08,0.05);hwStep=0;
}

// ===================== 11. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele');
  if(mode==='reto'){
    const p=RETO_POOL[retoIdx];
    t.innerHTML=teleRow('Proceso',p.name)+
      teleRow('Editando',retoField==='seal'?'Retención':retoField==='stop'?'Paro':'Enclavamiento','good')+
      teleRow('Sello',retoChecked?(retoOkSeal?'✓':'✗'):'—',retoChecked&&retoOkSeal?'good':'warn')+
      teleRow('Paro',retoChecked?(retoOkStop?'✓':'✗'):'—',retoChecked&&retoOkStop?'good':'warn')+
      teleRow('Enclav.',retoChecked?(retoOkLock?'✓':'✗'):'—',retoChecked&&retoOkLock?'good':'warn');
    return;
  }
  if(mode==='aplica'){
    if(apTopic==='sello')t.innerHTML=teleRow('Tema','Sello vs jog')+teleRow('Con sello','se retiene','good')+teleRow('Sin sello','sigue al botón','warn')+teleRow('Paro','NC dominante');
    else t.innerHTML=teleRow('Tema','Enclavamiento')+teleRow('F y R','excluyentes','good')+teleRow('Empate','gana F (rung 1)')+teleRow('Refuerzo','HW auxiliar');
    return;
  }
  if(expBlock==='arranque'){
    t.innerHTML=teleRow('Circuito','Arranque-paro')+teleRow('Motor',expCoils.M?'EN MARCHA':'parado',expCoils.M?'good':'')+teleRow('Sello',expCoils.M?'reteniendo':'inactivo',expCoils.M?'good':'')+teleRow('Scans',String(expHist.length));
  }else{
    t.innerHTML=teleRow('Circuito','Inversión')+teleRow('ADELANTE (F)',expCoils.F?'ON':'—',expCoils.F?'good':'')+teleRow('ATRÁS (R)',expCoils.R?'ON':'—',expCoils.R?'good':'')+teleRow('Simultáneas',(expCoils.F&&expCoils.R)?'⚠':'no ✓',(expCoils.F&&expCoils.R)?'warn':'good');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='reto'){
    const p=RETO_POOL[retoIdx];
    html+=retoMsg||`<span class="mono">${p.name}: elige cada pieza con los selectores. La solución robusta lleva sello (NO de la bobina), Paro NC en serie y NC de la contraria para enclavar. Comprueba.</span>`;
  }else if(mode==='aplica'){
    if(apTopic==='sello')html+=`<span class="mono">La rama de sello (OR con la propia bobina) hace que, tras soltar Marcha, el rung se sostenga solo en el siguiente scan. Sin ella, la bobina cae al soltar (jog).</span>`;
    else html+=`<span class="mono">El NC de la bobina contraria en serie hace que F y R sean excluyentes. Ante marchas simultáneas desde reposo, gana el rung superior (F): el orden del scan resuelve el empate.</span>`;
  }else{
    if(expBlock==='arranque')html+=`<span class="mono">Pulsa "Marcha ▸" y luego "Reposo ▸": la bobina se retiene por el sello. "Paro ▸" abre el NC en serie y la apaga (dominante). Cada pulso es un ciclo de scan.</span>`;
    else html+=`<span class="mono">Arranca F, intenta arrancar R sin parar: el enclavamiento lo impide. Pulsa "Paro ▸" y luego "Marcha ATRÁS ▸": ahora sí invierte. Nunca conducen F y R a la vez.</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();updateHW();}

// ===================== 12. RETO =====================
function updateRetoSpec(){
  const p=RETO_POOL[retoIdx];
  el('retoSpec').innerHTML=`Diseña el ladder de inversión de <b>${p.name}</b>. Elige la <b>retención</b> (sello), el contacto de <b>Paro</b> y el <b>enclavamiento</b>. Pulsa "Comprobar".`;
}
function checkReto(){
  retoOkSeal=retoCh.seal==='NO';
  retoOkStop=retoCh.stop==='NC';
  retoOkLock=retoCh.lock==='NC';
  retoSolved=retoOkSeal&&retoOkStop&&retoOkLock;retoChecked=true;solved=retoSolved;
  synth.beep(retoSolved?1046:220,retoSolved?0.14:0.15,0.06);
  retoMsg=`<span class="mono"><span class="${retoSolved?'ok':'dtc'}">${retoSolved?'✔ Correcto':'✗ Revisa'}</span> — ${retoExplain()}</span>`;
  refreshAll();
}

// ===================== 13. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Para qué sirve la rama de sello (contacto NO de la propia bobina en paralelo con el botón de marcha)?',
      opciones:[
        {t:'Para que la bobina se RETENGA encendida tras soltar el botón de marcha (memoria por realimentación).',ok:true,why:'Correcto. Sin esa rama, la bobina sólo estaría ON mientras aprietas (jog). El OR con la propia bobina la sostiene en los scans siguientes.'},
        {t:'Para apagar la bobina más rápido cuando se pulsa el paro.',ok:false,why:'No: el apagado lo hace el contacto NC de Paro en serie. El sello es lo contrario: MANTIENE encendido, no apaga.'},
        {t:'Para invertir el sentido de giro del motor.',ok:false,why:'La inversión la dan dos bobinas (F y R) con enclavamiento, no el sello. El sello sólo aporta retención.'},
        {t:'Para limitar la corriente de arranque del motor.',ok:false,why:'El ladder es lógica de mando (bobinas de contactores), no de potencia. La corriente de arranque se limita con arrancadores (estrella-triángulo, suave), no con un contacto de sello.'},
      ],
    },
    aplica:{
      pregunta:'En la inversión de giro, ¿qué garantiza el contacto NC de la bobina contraria en serie con cada marcha?',
      opciones:[
        {t:'Que F y R nunca conduzcan a la vez (enclavamiento): mientras una corre, la otra no puede arrancar.',ok:true,why:'Correcto. Es el enclavamiento por software; evita cerrar ambos contactores y cortocircuitar la red. Hay que parar antes de invertir.'},
        {t:'Que el motor arranque más suave al invertir.',ok:false,why:'El enclavamiento es lógico (impide una combinación), no controla la rampa de arranque. La suavidad se logra con temporizadores o arrancadores, no con el NC.'},
        {t:'Que la bobina se retenga sin necesidad de sello.',ok:false,why:'La retención la da la rama de sello, no el enclavamiento. Son piezas distintas del mismo rung.'},
        {t:'Que el paro deje de ser necesario.',ok:false,why:'Al revés: por el enclavamiento hay que PARAR para poder invertir (soltar la bobina activa antes de energizar la otra).'},
      ],
    },
    reto:{
      pregunta:'¿Por qué el Paro se cablea como contacto NC (normalmente cerrado) y no como NO?',
      opciones:[
        {t:'Para que sea dominante y a prueba de fallos: en serie, abrir el NC corta el rung; y si se rompe el cable del pulsador, el motor se detiene (falla segura).',ok:true,why:'Correcto. El Paro NC en serie hace AND: pulsar (o perder el cable) abre el circuito y detiene. Un Paro NO no pararía si se cortara su cable: inseguro.'},
        {t:'Porque un contacto NC conduce más corriente que uno NO.',ok:false,why:'No hay diferencia de capacidad de corriente por ser NO o NC; es lógica de mando. La razón es la lógica dominante y la falla segura.'},
        {t:'Porque el NC hace que el motor arranque solo al energizar el PLC.',ok:false,why:'Eso sería un arranque involuntario peligroso. El arranque exige pulsar Marcha; el NC de Paro sólo permite que el rung conduzca cuando NO se pulsa Paro.'},
        {t:'Porque con NC no hace falta la rama de sello.',ok:false,why:'Son independientes: el sello da retención; el Paro NC da el corte dominante. Se necesitan ambos.'},
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
    expBlock='arranque';expReset();afterEdit();
    showToast('🔧 Arranque-paro con sello. Pulsamos Marcha y la soltamos: el sello retiene la bobina.');
    await sleep(3400);
    pulse('Start');afterEdit();await sleep(1500);
    pulse('reposo');afterEdit();
    showToast('▶ Marcha soltada y el motor SIGUE en marcha: la rama de sello lo sostiene.');
    await sleep(3200);
    pulse('Stop');afterEdit();
    showToast('⏹ Paro (NC): abre el rung y detiene. El paro es dominante.');
    await sleep(3000);
    expBlock='inversion';expReset();afterEdit();
    showToast('🔁 Inversión: arrancamos ADELANTE y probamos ATRÁS sin parar.');
    await sleep(3000);
    pulse('StartF');afterEdit();await sleep(1500);
    pulse('StartR');afterEdit();
    showToast('🔒 El enclavamiento impide arrancar ATRÁS mientras ADELANTE corre: sigue en F.');
    await sleep(3200);
    pulse('Stop');afterEdit();await sleep(1200);
    pulse('StartR');afterEdit();
    showToast('✔ Tras parar, ahora sí invierte a ATRÁS. Nunca F y R a la vez.');
    await sleep(3000);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('aplica');
    apTopic='sello';afterEdit();
    showToast('🧩 Con sello vs sin sello (jog): misma secuencia, el de sello se retiene y el jog sigue al botón.');
    await sleep(4400);
    apTopic='enclavamiento';afterEdit();
    showToast('📋 Tabla del enclavamiento: en "ambas a la vez" gana F (rung superior); nunca conducen las dos.');
    await sleep(4400);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('reto');
    seedReto(0);updateRetoSpec();afterEdit();
    showToast('🎯 Reto: diseñar el ladder de una banda reversible. Primero, un intento sin sello ni enclavamiento…');
    await sleep(3400);
    checkReto();
    showToast('…sin sello queda como jog, y sin enclavamiento pueden encenderse ambos sentidos. Lo diseñamos bien.');
    await sleep(3600);
    retoCh={seal:'NO',stop:'NC',lock:'NC'};afterEdit();
    showToast('✔ Sello NO, Paro NC y enclavamiento NC de la contraria. Comprobamos.');
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
  // lógica
  evalRung, scan, run, contactCond, rungM, rungF, rungR, retoRungs, retoBehavior,
  // explora
  expBlock:()=>expBlock, setExpBlock:b=>{expBlock=b;expReset();afterEdit();},
  pulse:name=>{pulse(name);afterEdit();},
  expReset:()=>{expReset();afterEdit();},
  expInfo:()=>({block:expBlock,coils:{M:!!expCoils.M,F:!!expCoils.F,R:!!expCoils.R},last:inpLabel(expLast),scans:expHist.length}),
  // aplica
  apTopic:()=>apTopic, setApTopic:k=>{apTopic=k;afterEdit();},
  interlockTable:()=>[{},{StartF:1},{StartR:1},{StartF:1,StartR:1}].map(inp=>{const h=scan(RUNGS_INV,inp,{F:false,R:false});return {inp,F:h.F,R:h.R};}),
  // reto
  retoIdx:()=>retoIdx, seedReto:i=>{seedReto(i);afterEdit();},
  retoName:()=>RETO_POOL[retoIdx].name,
  retoGet:()=>({...retoCh}),
  retoSet:(field,val)=>{retoCh[field]=val;retoChecked=false;retoSolved=false;afterEdit();},
  retoSolveBuild:()=>{retoCh={seal:'NO',stop:'NC',lock:'NC'};retoChecked=false;retoSolved=false;afterEdit();},
  checkReto:()=>checkReto(),
  retoChecked:()=>retoChecked, retoOkSeal:()=>retoOkSeal, retoOkStop:()=>retoOkStop, retoOkLock:()=>retoOkLock, retoSolved:()=>retoSolved,
  // quiz / general
  quizCorrectIndex:()=>{const q=QUIZ[mode];return q?q.opciones.findIndex(o=>o.ok):-1;},
  quizAnswer:i=>answer(i),
  newSignal:()=>newSignal(),
  solved:()=>solved,
};
