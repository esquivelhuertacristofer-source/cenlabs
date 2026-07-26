// Contadores síncronos módulo N y tablas de excitación (D3 · digital).
// Física (verificada node -e, 14/14 exhaustiva):
//   FLIP-FLOPS (ecuación característica): D → Qn = D ; JK → Qn = J·Q' + K'·Q ; T → Qn = Q ⊕ T.
//   TABLAS DE EXCITACIÓN (qué entrada logra la transición Q→Qn, con "don't cares"):
//     D: D=Qn.  T: T=Q⊕Qn.  JK: 0→0 {J0,Kx} · 0→1 {J1,Kx} · 1→0 {Jx,K1} · 1→1 {Jx,K0}.
//   CONTADOR BINARIO SÍNCRONO de n bits: todos los flip-flops cambian con el mismo reloj; el estado avanza
//     state → (state+1) mód 2ⁿ. Con flip-flops T (o JK con J=K), el bit i conmuta cuando TODOS los de abajo
//     valen 1: T_i = Q0·Q1···Q(i-1). Con flip-flops D, D_i = bit i de (state+1). (exhaustivo n=1..4)
//   CONTADOR MÓDULO N (borrado síncrono): se detecta el estado terminal DET=N−1 y en el siguiente flanco se
//     fuerza a 0. Da la secuencia 0,1,…,N−1 de periodo N (verificado N=2..16). Error clásico off-by-one:
//     poner DET=N (en vez de N−1) da un contador módulo N+1. n = techo(log2 N) flip-flops.
//   AUTOCORRECCIÓN: si arranca en un estado no usado, el borrado síncrono lo devuelve al ciclo 0..N−1.
//   Ref: Mano & Ciletti, "Diseño Digital" · Wakerly, "Digital Design" · Roth, "Fundamentals of Logic Design"
//        · TI 74x161/74x163 (contador binario síncrono), 74x190/191 · verificación numérica propia.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.8,2.9,7.0],target:[0.4,1.05,0.3],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.44,minD:3.2,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. FÍSICA (VERIFICADA) =====================
function dFF(Q,D){return D?1:0;}
function jkFF(Q,J,K){Q=Q?1:0;J=J?1:0;K=K?1:0;return((J&(Q^1))|((K^1)&Q))?1:0;}   // Qn = J·Q' + K'·Q
function tFF(Q,T){return (Q?1:0)^(T?1:0);}
function excD(Q,Qn){return {D:Qn?1:0};}
function excT(Q,Qn){return {T:((Q?1:0)^(Qn?1:0))};}
function excJK(Q,Qn){Q=Q?1:0;Qn=Qn?1:0;
  if(Q===0&&Qn===0)return{J:0,K:'x'};
  if(Q===0&&Qn===1)return{J:1,K:'x'};
  if(Q===1&&Qn===0)return{J:'x',K:1};
  return{J:'x',K:0};}                                                            // 1→1
function mask(n){return (1<<n)-1;}
function binNext(state,n){return (state+1)&mask(n);}
function bitsFor(N){let n=1;while((1<<n)<N)n++;return n;}
function modNext(state,n,DET,clear){return (clear&&state===DET)?0:(state+1)&mask(n);}
function simulate(n,DET,clear){const seen=[];let s=0;for(let step=0;step<(1<<n)+2;step++){if(seen.includes(s))break;seen.push(s);s=modNext(s,n,DET,clear);}return{seq:seen,period:seen.length};}
// entradas por bit para un contador ASCENDENTE de n bits con el tipo de flip-flop dado
function ffInputs(state,n,type){
  const nx=binNext(state,n),rows=[];
  for(let i=0;i<n;i++){const q=(state>>i)&1,qn=(nx>>i)&1;
    if(type==='d')rows.push(excD(q,qn));
    else if(type==='t')rows.push(excT(q,qn));
    else rows.push(excJK(q,qn));}
  return rows;
}
function binStr(v,n){return (v&((1<<n)-1)).toString(2).padStart(n,'0');}

// ===================== 3. ESTADO =====================
let mode='explora';
// explora — conduces cada bloque en vivo
let expKind='cnt';                       // 'ff' | 'cnt' | 'mod'
let ffType='jk';                         // 'd' | 'jk' | 't'
let ffQ=0, ffD=1, ffJ=1, ffK=0, ffT=1;   // entradas del flip-flop suelto
let cntType='t';                         // flip-flop usado en el contador binario: 'd'|'t'|'jk'
let cntN=3, cntState=0;                  // contador binario de n bits
let modN=5, modState=0;                  // contador módulo N (con borrado síncrono)
// aplica
let apTopic='exc';                       // 'exc' | 'design' | 'selfcorr'
let apFFType='jk';                       // tabla de excitación mostrada
const DESIGN_POOL=[{N:5},{N:10},{N:6},{N:12},{N:7}];
let apDesignIdx=0;
const SELF_POOL=[{N:5,start:6},{N:5,start:7},{N:6,start:6},{N:6,start:7}];  // estados no usados (n=3)
let apSelfIdx=0;
// reto — diseñar un contador módulo N ajustando DET (detección del terminal) y el borrado
const RETO_POOL=[
  {N:5,  ctx:'Contador módulo 5 (secuencia 0,1,2,3,4)'},
  {N:10, ctx:'Contador módulo 10 — un dígito decimal (0..9)'},
  {N:6,  ctx:'Contador módulo 6 (segundos de un reloj: 0..5)'},
  {N:12, ctx:'Contador módulo 12 (horas de un reloj)'},
  {N:3,  ctx:'Contador módulo 3 (0,1,2)'},
  {N:7,  ctx:'Contador módulo 7 (días de la semana)'},
];
let retoIdx=0, retoDET=0, retoClear=false, retoChecked=false, retoOkDetect=false, retoOkClear=false, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false, QUIZ={};
let hwStep=0, hwT=0;

function pickIdx(n,ex){let v=Math.floor(Math.random()*n);if(n>1)while(v===ex)v=Math.floor(Math.random()*n);return v;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
function seedReto(idx){
  retoIdx=(idx==null)?pickIdx(RETO_POOL.length,retoIdx):idx;
  const f=RETO_POOL[retoIdx],n=bitsFor(f.N);
  retoDET=0; retoClear=false;
  retoChecked=false; retoOkDetect=false; retoOkClear=false; retoSolved=false; retoMsg='';
}
seedReto(0);

// número de flip-flops del dispositivo activo (para el entrenador 3D)
function curBits(){
  if(mode==='reto')return bitsFor(RETO_POOL[retoIdx].N);
  if(mode==='aplica'){if(apTopic==='design')return bitsFor(DESIGN_POOL[apDesignIdx].N);if(apTopic==='selfcorr')return bitsFor(SELF_POOL[apSelfIdx].N);return 1;}
  if(expKind==='ff')return 1;
  if(expKind==='mod')return bitsFor(modN);
  return cntN;
}
// secuencia de estados que recorre el entrenador 3D
function curSeq(){
  if(mode==='reto'){const f=RETO_POOL[retoIdx],n=bitsFor(f.N);return simulate(n,retoDET,retoClear).seq;}
  if(mode==='aplica'){
    if(apTopic==='design'){const N=DESIGN_POOL[apDesignIdx].N,n=bitsFor(N);return simulate(n,N-1,true).seq;}
    if(apTopic==='selfcorr'){const f=SELF_POOL[apSelfIdx],n=bitsFor(f.N),DET=f.N-1;const s=[];let x=f.start;for(let k=0;k<n+f.N+2;k++){s.push(x);x=modNext(x,n,DET,true);}return s;}
    return [ffType==='d'?ffD:(ffType==='t'?(ffQ^ffT):jkFF(ffQ,ffJ,ffK))];
  }
  if(expKind==='ff')return [0,1];
  if(expKind==='mod'){const n=bitsFor(modN);return simulate(n,modN-1,true).seq;}
  const n=cntN,s=[];for(let k=0;k<(1<<n);k++)s.push(k);return s;
}

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
frame.userData={title:'Contadores síncronos módulo N',info:'Flip-flops, tablas de excitación y borrado síncrono · toca para inspeccionar'};
addHoverLabel(frame,'Contadores síncronos',ACC,new THREE.Vector3(0,3.5,0.1).add(boardG.position),2.2);

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

// ---- fila de un número binario (MSB→LSB) ----
function drawNumRow(c,x,y,label,val,n,color,cw){
  cw=cw||34;
  c.fillStyle='#9fb0cf';c.font='bold 14px Outfit, sans-serif';c.textAlign='right';c.fillText(label,x-12,y+cw*0.6);
  for(let k=0;k<n;k++){const i=n-1-k;const b=(val>>i)&1;const bx=x+k*cw;
    c.strokeStyle=hexA(color,0.45);c.lineWidth=1;rr(c,bx,y,cw-5,cw-5,4);c.stroke();
    c.fillStyle=b?color:'#4a525e';c.font='bold 17px Outfit, sans-serif';c.textAlign='center';c.fillText(b,bx+(cw-5)/2,y+(cw-5)*0.72);}
  return x+n*cw;
}

// ---- símbolo de un flip-flop ----
function drawFFSym(c,x,y,w,h,type,ins,Q,Qn){
  c.strokeStyle=hexA(ACC,0.9);c.fillStyle=hexA(ACC,0.07);c.lineWidth=2.4;rr(c,x,y,w,h,8);c.fill();c.stroke();
  c.fillStyle=ACC;c.font='bold 22px Outfit, sans-serif';c.textAlign='center';c.fillText(type.toUpperCase(),x+w/2,y+30);
  c.fillStyle='#9fb0cf';c.font='11px Outfit, sans-serif';c.fillText('flip-flop',x+w/2,y+48);
  // entradas a la izquierda
  ins.forEach((p,i)=>{const yy=y+h*(i+1)/(ins.length+1);const on=p[1]===1;
    c.strokeStyle=on?OK_HEX:hexA('#9fb0cf',0.4);c.lineWidth=on?3:1.4;c.beginPath();c.moveTo(x-52,yy);c.lineTo(x,yy);c.stroke();
    c.fillStyle=on?OK_HEX:'#4a525e';c.beginPath();c.arc(x-62,yy,6,0,7);c.fill();
    c.fillStyle='#C9D3E2';c.font='bold 14px Outfit, sans-serif';c.textAlign='right';c.fillText(p[0]+'='+p[1],x-74,yy+5);});
  // reloj (esquina inferior izquierda, símbolo de flanco)
  c.strokeStyle='#9fb0cf';c.lineWidth=1.4;c.beginPath();c.moveTo(x,y+h-18);c.lineTo(x+12,y+h-24);c.lineTo(x,y+h-30);c.stroke();
  c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';c.textAlign='left';c.fillText('CLK',x+16,y+h-20);
  // salidas Q, Q'
  c.strokeStyle=Q?OK_HEX:'#4a525e';c.lineWidth=3;c.beginPath();c.moveTo(x+w,y+h*0.4);c.lineTo(x+w+48,y+h*0.4);c.stroke();
  c.fillStyle=Q?OK_HEX:'#4a525e';c.font='bold 18px Outfit, sans-serif';c.textAlign='left';c.fillText('Q = '+Q,x+w+56,y+h*0.4+6);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';c.fillText("Q' = "+(Q^1),x+w+56,y+h*0.4+30);
  // próximo estado (después del flanco)
  c.fillStyle=WARN_HEX;c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.fillText('tras el flanco:  Q → '+Qn,x-62,y+h+34);
}

// ---- tabla de verdad / característica de un flip-flop ----
function drawFFTruth(c,x0,y0,type){
  let cols,rows;
  if(type==='d'){cols=['Q','D','Qn'];rows=[];for(let q=0;q<2;q++)for(let d=0;d<2;d++)rows.push([q,d,dFF(q,d)]);}
  else if(type==='t'){cols=['Q','T','Qn','acción'];rows=[];for(let q=0;q<2;q++)for(let t=0;t<2;t++)rows.push([q,t,tFF(q,t),t?'conmuta':'retiene']);}
  else{cols=['Q','J','K','Qn','acción'];const act=['retiene','pone 0','pone 1','conmuta'];rows=[];for(let q=0;q<2;q++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)rows.push([q,j,k,jkFF(q,j,k),act[j*2+k]]);}
  const cw=cols.map(cn=>cn==='acción'?86:34),W=cw.reduce((a,b)=>a+b,0),rh=26;
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';c.fillText('TABLA CARACTERÍSTICA',x0+W/2,y0-10);
  let cx=x0;c.font='bold 12px Outfit, sans-serif';
  for(let i=0;i<cols.length;i++){c.fillStyle=(cols[i]==='Qn')?ACC:'#9fb0cf';c.textAlign='center';c.fillText(cols[i],cx+cw[i]/2,y0+rh*0.7);cx+=cw[i];}
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.beginPath();c.moveTo(x0,y0+rh*0.95);c.lineTo(x0+W,y0+rh*0.95);c.stroke();
  rows.forEach((row,s)=>{const yy=y0+rh*(s+1);cx=x0;
    row.forEach((v,i)=>{const isQn=(cols[i]==='Qn');const isAct=(cols[i]==='acción');
      c.fillStyle=isAct?'#9fb0cf':(isQn?(v?OK_HEX:'#4a525e'):(v?'#C9D3E2':'#5a6472'));
      c.font=(isQn?'bold ':'')+(isAct?'11px':'13px')+' Outfit, sans-serif';c.textAlign='center';c.fillText(v,cx+cw[i]/2,yy+rh*0.72);cx+=cw[i];});});
  return {W,H:rh*(rows.length+1)};
}

// ---- tabla de excitación (Q→Qn ⇒ entradas) ----
function drawExcTable(c,x0,y0,type){
  const trans=[[0,0],[0,1],[1,0],[1,1]];
  let cols,cw;
  if(type==='d'){cols=['Q','Qn','D'];cw=[40,40,40];}
  else if(type==='t'){cols=['Q','Qn','T'];cw=[40,40,40];}
  else{cols=['Q','Qn','J','K'];cw=[40,40,40,40];}
  const W=cw.reduce((a,b)=>a+b,0),rh=34;
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='center';c.fillText('EXCITACIÓN '+type.toUpperCase(),x0+W/2,y0-12);
  let cx=x0;c.font='bold 13px Outfit, sans-serif';
  for(let i=0;i<cols.length;i++){c.fillStyle=(i>=2)?WARN_HEX:'#9fb0cf';c.textAlign='center';c.fillText(cols[i],cx+cw[i]/2,y0+rh*0.6);cx+=cw[i];}
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.beginPath();c.moveTo(x0,y0+rh*0.85);c.lineTo(x0+W,y0+rh*0.85);c.stroke();
  trans.forEach((t,s)=>{const Q=t[0],Qn=t[1],yy=y0+rh*(s+1);cx=x0;
    let vals;if(type==='d')vals=[Q,Qn,excD(Q,Qn).D];else if(type==='t')vals=[Q,Qn,excT(Q,Qn).T];else{const e=excJK(Q,Qn);vals=[Q,Qn,e.J,e.K];}
    vals.forEach((v,i)=>{const isIn=(i>=2),dc=(v==='x');
      c.fillStyle=dc?VIO:(isIn?(v?WARN_HEX:'#8a8f66'):(v?'#C9D3E2':'#5a6472'));
      c.font='bold 16px Outfit, sans-serif';c.textAlign='center';c.fillText(v,cx+cw[i]/2,yy+rh*0.62);cx+=cw[i];});});
  return {W,H:rh*5};
}

// ---- anillo de estados 0..2ⁿ-1 con el ciclo módulo N resaltado ----
function drawRing(c,cx,cy,rad,n,N,cur,det,showClear){
  const tot=1<<n;
  // arco de borrado (de DET a 0)
  for(let s=0;s<tot;s++){
    const ang=-Math.PI/2+s*2*Math.PI/tot;
    const x=cx+Math.cos(ang)*rad,y=cy+Math.sin(ang)*rad;
    const inCycle=s<N,isCur=(s===cur),isDet=(s===det);
    c.beginPath();c.arc(x,y,17,0,7);
    c.fillStyle=isCur?ACC:(inCycle?hexA(OK_HEX,0.14):'rgba(255,107,107,0.10)');
    c.fill();
    c.strokeStyle=isCur?ACC:(isDet?WARN_HEX:(inCycle?hexA(OK_HEX,0.5):hexA(BAD_HEX,0.4)));
    c.lineWidth=isCur?3:(isDet?2.4:1.4);c.stroke();
    c.fillStyle=isCur?'#0c1016':(inCycle?'#C9D3E2':'#7a6a6a');c.font='bold 14px Outfit, sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.fillText(s,x,y);
    if(isDet){c.fillStyle=WARN_HEX;c.font='10px Outfit, sans-serif';c.fillText('DET',x,y+27);}
  }
  c.textBaseline='alphabetic';
  // flecha de borrado DET→0
  if(showClear && det>=0 && det<tot){
    const a0=-Math.PI/2+det*2*Math.PI/tot,x0=cx+Math.cos(a0)*rad,y0=cy+Math.sin(a0)*rad;
    const xz=cx,yz=cy-rad;
    c.strokeStyle=hexA(WARN_HEX,0.7);c.lineWidth=2;c.setLineDash([5,4]);
    c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(cx,cy,xz,yz);c.stroke();c.setLineDash([]);
    c.fillStyle=WARN_HEX;c.font='11px Outfit, sans-serif';c.textAlign='center';c.fillText('borrado',cx,cy+4);
  }
}

// ===================== 6. VISTAS POR MODO =====================
function drawExplora(c){
  if(expKind==='ff'){
    let ins,Qn;
    if(ffType==='d'){ins=[['D',ffD]];Qn=dFF(ffQ,ffD);}
    else if(ffType==='t'){ins=[['T',ffT]];Qn=tFF(ffQ,ffT);}
    else{ins=[['J',ffJ],['K',ffK]];Qn=jkFF(ffQ,ffJ,ffK);}
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Flip-flop '+ffType.toUpperCase()+' (1 bit de memoria)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Un flip-flop guarda un bit. Sus entradas y el estado actual Q deciden el próximo estado Qn en el flanco de reloj.',30,64);
    drawFFSym(c,180,150,150,150,ffType,ins,ffQ,Qn);
    drawFFTruth(c,470,150,ffType);
    const eqTxt=ffType==='d'?'Qn = D':(ffType==='t'?'Qn = Q ⊕ T':"Qn = J·Q' + K'·Q");
    rpanel(c,PX.x,PX.y,PX.w,170,'ECUACIÓN CARACTERÍSTICA');
    c.fillStyle=ACC;c.font='bold 20px Outfit, sans-serif';c.textAlign='center';c.fillText(eqTxt,PX.x+PX.w/2,PX.y+70);
    prow(c,PX.x,PX.y+108,PX.w,'Estado actual  Q',String(ffQ));
    prow(c,PX.x,PX.y+138,PX.w,'Próximo estado  Qn',String(Qn),Qn?OK_HEX:'#C9D3E2');
    const by=PX.y+190;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,290);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,290);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('LOS TRES TIPOS',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    const txt = ffType==='d'?'El flip-flop D copia su entrada: Qn = D, sin importar el estado previo. Es el más simple para memoria y registros; para contar necesita lógica externa que calcule el siguiente valor.'
      : ffType==='t'?'El flip-flop T (toggle) conmuta cuando T=1 y retiene cuando T=0: Qn = Q ⊕ T. Es ideal para contadores: el bit i conmuta cuando todos los de menor peso valen 1.'
      : "El flip-flop JK es el más versátil: retiene (0,0), pone a 0 (0,1), pone a 1 (1,0) o conmuta (1,1). Con J=K se comporta como un T. Su tabla de excitación tiene 'don't cares' (x) que facilitan el diseño.";
    wrapText(c,txt,PX.x+14,by+48,PX.w-28,17);
    c.fillStyle=VIO;c.font='12px Outfit, sans-serif';c.fillText('Cambia el tipo y las entradas arriba.',PX.x+14,by+200);
  }else if(expKind==='cnt'){
    const n=cntN,nx=binNext(cntState,n),rows=ffInputs(cntState,n,cntType);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Contador binario síncrono de '+n+' bits',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Todos los flip-flops comparten el mismo reloj. El estado avanza al siguiente en cada flanco: '+cntState+' → '+nx+'.',30,64);
    drawNumRow(c,150,120,'Estado Q  = '+cntState,cntState,n,ACC,42);
    drawNumRow(c,150,175,'Próximo   = '+nx,nx,n,OK_HEX,42);
    // tabla de entradas por bit
    const inLbl=cntType==='d'?['D']:(cntType==='t'?['T']:['J','K']);
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillText('Entradas de cada flip-flop ('+cntType.toUpperCase()+') para avanzar:',60,255);
    const bx0=90,cw=90;
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';c.textAlign='center';
    ['bit','Qi','Qi→',...inLbl].forEach(()=>{});
    for(let k=0;k<n;k++){const i=n-1-k;const bx=bx0+k*cw;const q=(cntState>>i)&1,qn=(nx>>i)&1,e=rows[i];
      c.strokeStyle=hexA(ACC,0.4);c.lineWidth=1;rr(c,bx,275,cw-10,96,6);c.stroke();
      c.fillStyle='#9fb0cf';c.font='bold 12px Outfit, sans-serif';c.fillText('bit '+i,bx+(cw-10)/2,293);
      c.fillStyle=q?ACC:'#5a6472';c.font='13px Outfit, sans-serif';c.fillText('Q='+q+'→'+qn,bx+(cw-10)/2,314);
      let iy=338;
      if(cntType==='jk'){c.fillStyle=e.J==='x'?VIO:WARN_HEX;c.font='bold 14px Outfit, sans-serif';c.fillText('J='+e.J,bx+(cw-10)/2,iy);c.fillStyle=e.K==='x'?VIO:WARN_HEX;c.fillText('K='+e.K,bx+(cw-10)/2,iy+20);}
      else{const key=cntType==='d'?'D':'T';c.fillStyle=e[key]?WARN_HEX:'#8a8f66';c.font='bold 16px Outfit, sans-serif';c.fillText(key+'='+e[key],bx+(cw-10)/2,iy+8);}
    }
    rpanel(c,PX.x,PX.y,PX.w,160,'FLIP-FLOP DEL CONTADOR');
    prow(c,PX.x,PX.y+52,PX.w,'Tipo',cntType.toUpperCase());
    prow(c,PX.x,PX.y+80,PX.w,'Estado → próximo',cntState+' → '+nx,OK_HEX);
    prow(c,PX.x,PX.y+108,PX.w,'Módulo (2ⁿ)',String(1<<n));
    prow(c,PX.x,PX.y+136,PX.w,'Binario',binStr(cntState,n)+' → '+binStr(nx,n));
    const by=PX.y+180;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,300);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,300);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('SÍNCRONO vs ASÍNCRONO',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    const t2=cntType==='t'?'Con flip-flops T, el bit i conmuta (T=1) sólo cuando TODOS los bits de menor peso valen 1: T_i = Q0·Q1···Q(i-1). Por eso el bit 0 conmuta siempre, el 1 cada 2 pasos, el 2 cada 4…'
      :cntType==='d'?'Con flip-flops D hay que calcular D_i = bit i de (estado+1) con compuertas. Es directo pero usa más lógica que el esquema con T.'
      :'Con flip-flops JK y J=K se logra lo mismo que con T: conmutan cuando todos los bits de abajo valen 1. Los "don\'t care" de la tabla JK simplifican las compuertas.';
    wrapText(c,'En un contador SÍNCRONO todos los flip-flops cambian a la vez con el mismo reloj, así no se acumulan retardos. '+t2,PX.x+14,by+48,PX.w-28,17);
  }else{
    const N=modN,n=bitsFor(N);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Contador módulo '+N,30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Cuenta 0,1,…,'+(N-1)+' y vuelve a 0. Necesita n = ⌈log₂ '+N+'⌉ = '+n+' flip-flops y detectar el estado terminal.',30,64);
    drawRing(c,300,320,150,n,N,modState%N,N-1,true);
    rpanel(c,PX.x,PX.y,PX.w,190,'MÓDULO '+N);
    prow(c,PX.x,PX.y+52,PX.w,'Estados usados','0 … '+(N-1)+'  ('+N+')');
    prow(c,PX.x,PX.y+80,PX.w,'Flip-flops (n)',String(n));
    prow(c,PX.x,PX.y+108,PX.w,'Capacidad (2ⁿ)',String(1<<n)+((1<<n)>N?'  (sobran '+((1<<n)-N)+')':'  (exacto)'));
    prow(c,PX.x,PX.y+136,PX.w,'Detección terminal','DET = '+(N-1),WARN_HEX);
    prow(c,PX.x,PX.y+164,PX.w,'Estado actual',String(modState%N),ACC);
    const by=PX.y+210;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,270);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,270);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('BORRADO SÍNCRONO',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Con n flip-flops el contador querría llegar hasta '+((1<<n)-1)+', pero sólo queremos '+N+' estados. La solución: una compuerta detecta el estado terminal DET = '+(N-1)+' y, en el siguiente flanco, el borrado síncrono lleva el contador a 0. Así el ciclo es 0..'+(N-1)+' (periodo '+N+'). El punto fino: se detecta N−1, NO N — ése es el error clásico que evitarás en el Reto.',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawAplica(c){
  if(apTopic==='exc'){
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Tablas de excitación',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Para DISEÑAR un contador se invierte la pregunta: dada la transición Q→Qn deseada, ¿qué entrada la produce?',30,64);
    // las tres tablas lado a lado, resaltando la elegida
    drawExcTable(c,90,150,'d');
    drawExcTable(c,300,150,'t');
    drawExcTable(c,510,150,'jk');
    // resaltar la seleccionada
    const hx={d:90,t:300,jk:510}[apFFType],hw={d:120,t:120,jk:160}[apFFType];
    c.strokeStyle=ACC;c.lineWidth=2.5;c.strokeRect(hx-8,130,hw+16,34*5+16);
    c.fillStyle=ACC;c.font='12px Outfit, sans-serif';c.textAlign='center';c.fillText('◄ seleccionada',hx+hw/2,34*5+165);
    rpanel(c,PX.x,PX.y,PX.w,170,'LOS "DON\'T CARE" (x)');
    prow(c,PX.x,PX.y+52,PX.w,'Tabla activa',apFFType.toUpperCase());
    prow(c,PX.x,PX.y+80,PX.w,'D: entradas fijas','2 de 2');
    prow(c,PX.x,PX.y+108,PX.w,'T: entradas fijas','2 de 2');
    prow(c,PX.x,PX.y+136,PX.w,'JK: don\'t care','2 de 4 celdas',VIO);
    const by=PX.y+190;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,290);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,290);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('POR QUÉ IMPORTAN',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'La tabla de excitación es el reverso de la característica: dice qué poner en las entradas para lograr cada transición. En JK, la mitad de las celdas son "don\'t care" (x): por ejemplo para pasar de 0 a 0 basta J=0 y K da igual. Esos x se aprovechan al simplificar con mapas de Karnaugh y producen circuitos con menos compuertas que los basados en D. El T es un punto medio: T = Q ⊕ Qn (conmuta si cambia).',PX.x+14,by+48,PX.w-28,17);
  }else if(apTopic==='design'){
    const N=DESIGN_POOL[apDesignIdx].N,n=bitsFor(N),seq=simulate(n,N-1,true).seq;
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Diseñar un contador módulo '+N,30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Tres pasos: elegir n = ⌈log₂ N⌉ flip-flops, detectar el terminal DET = N−1 y borrar de forma síncrona.',30,64);
    // paso 1: bits
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('1) Flip-flops:  n = ⌈log₂ '+N+'⌉ = '+n+'   (capacidad 2ⁿ = '+(1<<n)+')',60,120);
    // paso 2: DET
    c.fillStyle='#C7D6F5';c.fillText('2) Detección del terminal:  DET = N − 1 = '+(N-1),60,150);
    drawNumRow(c,340,132,'',N-1,n,WARN_HEX,34);
    // paso 3: secuencia
    c.fillStyle='#C7D6F5';c.fillText('3) Secuencia (periodo '+N+'):',60,192);
    const seqStr=seq.join(' → ')+' → 0';
    c.fillStyle=OK_HEX;c.font='bold 15px Outfit, sans-serif';wrapText(c,seqStr,60,218,600,24);
    // estados sobrantes
    if((1<<n)>N){c.fillStyle=BAD_HEX;c.font='12px Outfit, sans-serif';
      const extra=[];for(let s=N;s<(1<<n);s++)extra.push(s);
      c.fillText('Estados no usados (autocorrección los recupera): '+extra.join(', '),60,300);}
    rpanel(c,PX.x,PX.y,PX.w,170,'RESUMEN DEL DISEÑO');
    prow(c,PX.x,PX.y+52,PX.w,'Módulo N',String(N));
    prow(c,PX.x,PX.y+80,PX.w,'Flip-flops n',String(n));
    prow(c,PX.x,PX.y+108,PX.w,'DET (terminal)',String(N-1),WARN_HEX);
    prow(c,PX.x,PX.y+136,PX.w,'Periodo',String(simulate(n,N-1,true).period),OK_HEX);
    const by=PX.y+190;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,290);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,290);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('EL ERROR OFF-BY-ONE',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Para N estados (0..N−1) el estado terminal es N−1, no N. Si detectas DET = N por descuido, el contador cuenta 0..N (un estado de más) y se convierte en módulo '+(N+1)+'. Verifícalo: con DET='+N+' el periodo sería '+simulate(n,N,true).period+'. La regla es siempre DET = N − 1.',PX.x+14,by+48,PX.w-28,17);
  }else{
    const f=SELF_POOL[apSelfIdx],N=f.N,n=bitsFor(N),DET=N-1;
    const path=[];let x=f.start;for(let k=0;k<6;k++){path.push(x);x=modNext(x,n,DET,true);}
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Autocorrección',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('¿Qué pasa si el contador módulo '+N+' arranca en un estado NO usado (p. ej. por ruido al encender)?',30,64);
    drawRing(c,300,330,150,n,N,f.start,DET,true);
    // trayectoria
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('Trayectoria desde el estado '+f.start+':',30,540);
    c.fillStyle=OK_HEX;c.font='bold 15px Outfit, sans-serif';c.fillText(path.join(' → '),30,568);
    const entered=path.findIndex(v=>v<N);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';c.fillText('En '+(entered)+' flanco(s) entra al ciclo válido 0..'+(N-1)+' y ya no sale.',30,592);
    rpanel(c,PX.x,PX.y,PX.w,150,'ESTADO INICIAL');
    prow(c,PX.x,PX.y+52,PX.w,'Arranca en',String(f.start),BAD_HEX);
    prow(c,PX.x,PX.y+80,PX.w,'Estados válidos','0 … '+(N-1));
    prow(c,PX.x,PX.y+116,PX.w,'Flancos hasta ciclo',String(entered),OK_HEX);
    const by=PX.y+170;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,310);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,310);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('¿ES AUTOCORRECTIVO?',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Este diseño con borrado síncrono ES autocorrectivo: desde cualquier estado, tras sumar 1 unas cuantas veces se llega a un estado válido (o al terminal, que borra a 0). No se queda atrapado en un ciclo muerto. Un buen diseño de contador módulo N SIEMPRE verifica que los estados no usados regresen al ciclo principal; si no, un glitch podría dejarlo contando fuera de rango para siempre.',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawReto(c){
  const f=RETO_POOL[retoIdx],N=f.N,n=bitsFor(N);
  const sim=simulate(n,retoDET,retoClear);
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('RETO · Construye un contador módulo '+N,30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  wrapText(c,'Objetivo: '+f.ctx+'. Con '+n+' flip-flops (capacidad '+(1<<n)+') define la detección del terminal DET y activa el borrado síncrono para que cuente 0..'+(N-1)+'.',30,64,660,18);
  drawRing(c,290,330,145,n,N,sim.seq.length?sim.seq[sim.seq.length-1]%(1<<n):0,retoDET,retoClear);
  // tu configuración
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('Tu DET (binario):',30,540);
  drawNumRow(c,200,522,'',retoDET,n,retoChecked?(retoOkDetect?OK_HEX:BAD_HEX):WARN_HEX,34);
  c.fillStyle=retoClear?OK_HEX:BAD_HEX;c.font='bold 14px Outfit, sans-serif';c.fillText('Borrado síncrono: '+(retoClear?'ACTIVO':'inactivo'),30,580);
  c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';c.fillText('Secuencia resultante (periodo '+sim.period+'): '+sim.seq.join(',')+' →…',30,606);
  rpanel(c,PX.x,PX.y,PX.w,150,'TU CONFIGURACIÓN');
  prow(c,PX.x,PX.y+52,PX.w,'DET elegido',retoDET+'  (objetivo '+(N-1)+')',retoDET===N-1?OK_HEX:WARN_HEX);
  prow(c,PX.x,PX.y+86,PX.w,'Borrado síncrono',retoClear?'activo':'inactivo',retoClear?OK_HEX:BAD_HEX);
  prow(c,PX.x,PX.y+116,PX.w,'Periodo obtenido',String(sim.period),sim.period===N?OK_HEX:'#C9D3E2');
  const by=PX.y+170;
  if(retoChecked){
    c.fillStyle='rgba(0,0,0,0.24)';c.fillRect(PX.x,by,PX.w,320);
    c.strokeStyle=retoSolved?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(PX.x,by,PX.w,320);
    c.fillStyle=retoSolved?OK_HEX:BAD_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='left';c.fillText(retoSolved?'✔ CORRECTO':'✗ REVISA',PX.x+14,by+26);
    c.font='bold 13px Outfit, sans-serif';
    c.fillStyle=retoOkDetect?OK_HEX:BAD_HEX;c.fillText((retoOkDetect?'✔':'✗')+' Detección terminal DET = N−1 = '+(N-1),PX.x+14,by+54);
    c.fillStyle=retoOkClear?OK_HEX:BAD_HEX;c.fillText((retoOkClear?'✔':'✗')+' Borrado síncrono activo',PX.x+14,by+78);
    c.fillStyle='#C9D3E2';c.font='12px Outfit, sans-serif';wrapText(c,retoExplain(f,n),PX.x+14,by+106,PX.w-28,17);
  }else{
    c.fillStyle='rgba(0,0,0,0.20)';c.fillRect(PX.x,by,PX.w,320);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,320);
    c.fillStyle=WARN_HEX;c.font='13px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Regla: para contar N estados (0..N−1), el estado terminal es DET = N − 1 = '+(N-1)+'. Ajusta DET con los botones y activa el borrado síncrono para que, al llegar a DET, el siguiente flanco vuelva a 0.',PX.x+14,by+26,PX.w-28,18);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    wrapText(c,'Cuidado con el error clásico: si pones DET = N ('+N+') cuentas un estado de más → módulo '+(N+1)+'. Y sin borrado, el contador corre libre hasta '+((1<<n)-1)+' (módulo '+(1<<n)+').',PX.x+14,by+110,PX.w-28,18);
  }
}
function retoExplain(f,n){
  const N=f.N,sim=simulate(n,retoDET,retoClear);
  if(retoSolved)return 'DET = N−1 = '+(N-1)+' y borrado síncrono activo: al llegar a '+(N-1)+' el siguiente flanco fuerza 0, dando el ciclo 0..'+(N-1)+' (periodo '+N+'). Así se construye cualquier contador módulo N con n = ⌈log₂ N⌉ flip-flops.';
  let s='';
  if(!retoOkClear)s+='Sin borrado síncrono el contador corre libre hasta '+((1<<n)-1)+' (módulo '+(1<<n)+', periodo '+sim.period+'); nunca vuelve a 0 en N−1. Actívalo. ';
  if(!retoOkDetect){
    if(retoDET===N)s+='Detectas DET='+N+' en vez de N−1='+(N-1)+': cuentas un estado de más → módulo '+(N+1)+' (periodo '+(retoClear?N+1:sim.period)+'). El terminal de N estados es N−1. ';
    else s+='DET debe ser N−1 = '+(N-1)+' (el último de los '+N+' estados 0..'+(N-1)+'); pusiste '+retoDET+'. ';
  }
  return s||'Revisa la detección del terminal y el borrado.';
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='aplica')drawAplica(c);else if(mode==='reto')drawReto(c);else drawExplora(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='aplica')showToast('🧩 La tabla de excitación dice qué entrada logra cada transición Q→Qn. Un contador módulo N detecta el terminal N−1 y borra de forma síncrona. Un buen diseño se autocorrige desde estados no usados.');
  else if(mode==='reto')showToast('🎯 Define DET = N−1 (el último estado válido) y activa el borrado síncrono. Si detectas N, cuentas de más (módulo N+1); sin borrado, corre libre hasta 2ⁿ−1.');
  else showToast('🔧 Conduce el bloque: cambia el tipo de flip-flop, el número de bits o el módulo y observa el próximo estado, las entradas de excitación y el ciclo de conteo.');
}

// ===================== 7. ESCENA 3D: ENTRENADOR =====================
const bench=roundedBox(3.7,0.5,1.8,MAT.bench,0.05);bench.position.set(1.9,0.25,0.55);scene.add(bench);
bench.userData={title:'Banco de contadores síncronos',info:'Recorre la secuencia de conteo: los LEDs muestran el estado binario en cada flanco.'};
const pcb=roundedBox(2.4,0.08,1.2,MAT.pcb,0.03);pcb.position.set(1.95,0.54,0.5);scene.add(pcb);
pcb.userData={title:'Tarjeta del contador',info:'Cadena de flip-flops sincronizados por un reloj común; el LED de borrado marca el retorno a 0.'};
addHoverLabel(pcb,'Entrenador de conteo',ACC,new THREE.Vector3(1.95,1.35,0.5),1.6);
const chip=roundedBox(0.56,0.14,0.5,MAT.chip,0.02);chip.position.set(1.35,0.63,0.55);scene.add(chip);
const chCv=document.createElement('canvas');chCv.width=180;chCv.height=180;const chTex=new THREE.CanvasTexture(chCv);
const chFace=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.5),new THREE.MeshBasicMaterial({map:chTex,transparent:true}));
chFace.rotation.x=-Math.PI/2;chFace.position.set(1.35,0.705,0.55);scene.add(chFace);
chip.userData={title:'Contador',info:'Flip-flops D/JK/T contando en módulo 2ⁿ o módulo N.'};
function makeLED(x,z,color){const m=new THREE.Mesh(new THREE.SphereGeometry(0.045,16,16),std(color,0.4,0.1));m.position.set(x,0.62,z);m.material.emissive=new THREE.Color(color);m.material.emissiveIntensity=0.15;scene.add(m);return m;}
// LEDs de estado (4 bits, LSB a la derecha) + LED de reloj + LED de borrado
const stateLEDs=[];for(let i=0;i<4;i++)stateLEDs.push(makeLED(2.55-i*0.32,0.62,0x8AB4F8));
const clkLED=makeLED(2.75,0.90,0x7CD992);
const clrLED=makeLED(1.85,0.35,0xff6b6b);
addHoverLabel(stateLEDs[0],'estado (binario)',ACC,new THREE.Vector3(1.95,1.05,0.62),1.3);
clkLED.userData={title:'Reloj (CLK)',info:'Un flanco por paso; todos los flip-flops cambian a la vez (síncrono).'};
clrLED.userData={title:'Borrado síncrono',info:'Se enciende al detectar el estado terminal DET y volver a 0.'};

function drawChip3D(state,n,N,det,clear){
  const c=chCv.getContext('2d');c.clearRect(0,0,180,180);
  c.fillStyle='rgba(20,23,27,0.92)';c.fillRect(0,0,180,180);
  c.strokeStyle=ACC;c.lineWidth=4;c.strokeRect(4,4,172,172);
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='center';
  c.fillText('MÓDULO '+N,90,28);
  c.font='13px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText(n+' flip-flops',90,52);
  c.font='bold 40px Outfit, sans-serif';c.fillStyle=OK_HEX;c.fillText(String(state),90,108);
  c.font='13px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText(binStr(state,n),90,138);
  if(clear&&state===det){c.fillStyle=BAD_HEX;c.font='bold 12px Outfit, sans-serif';c.fillText('→ borra a 0',90,160);}
  chTex.needsUpdate=true;
}
function hwCount(){const seq=curSeq();return Math.max(1,seq.length);}
function updateHW(){
  const seq=curSeq(),n=Math.max(1,curBits()),step=hwStep%Math.max(1,seq.length),state=seq[step]||0;
  const N=(mode==='reto')?RETO_POOL[retoIdx].N:(expKind==='mod'&&mode==='explora')?modN:(mode==='aplica'&&apTopic==='design')?DESIGN_POOL[apDesignIdx].N:(mode==='aplica'&&apTopic==='selfcorr')?SELF_POOL[apSelfIdx].N:(1<<n);
  const det=(mode==='reto')?retoDET:N-1;
  const clear=(mode==='reto')?retoClear:(mode!=='explora'||expKind==='mod');
  stateLEDs.forEach((l,i)=>{const on=(state>>i)&1;l.visible=i<n;l.material.emissiveIntensity=on?1.4:0.12;l.material.color.setHex(on?0x8AB4F8:0x2a3550);});
  clkLED.visible=true;clkLED.material.emissiveIntensity=(step%2)?1.3:0.2;
  const borra=clear&&state===det;
  clrLED.visible=true;clrLED.material.emissiveIntensity=borra?1.5:0.1;clrLED.material.color.setHex(borra?0xff6b6b:0x2a2020);
  drawChip3D(state,n,N,det,clear);
}

// ===================== 8. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Sistemas digitales (D3) · Lógica secuencial · Flip-flops y contadores</div>
  <h2>Contadores Síncronos Módulo N</h2>
  <p>Un <b>flip-flop</b> guarda un bit; su <b>ecuación característica</b> dice cómo cambia en cada flanco de
  reloj: el <b>D</b> copia su entrada (Qn=D), el <b>T</b> conmuta (Qn=Q⊕T) y el <b>JK</b> hace las cuatro
  cosas (retener, poner 0, poner 1, conmutar). Para <b>diseñar</b> se usa la <b>tabla de excitación</b>: dada
  la transición Q→Qn deseada, qué poner en las entradas (con "don't care" en JK). Un <b>contador síncrono</b>
  encadena flip-flops con un <b>reloj común</b> —así no se acumulan retardos— y avanza el estado en cada
  flanco. Con n flip-flops cuenta en <b>módulo 2ⁿ</b>; para un <b>módulo N</b> arbitrario se detecta el
  estado terminal <b>DET = N−1</b> y un <b>borrado síncrono</b> lo devuelve a 0, dando el ciclo 0..N−1. El
  error clásico es detectar N en vez de N−1 (queda un módulo N+1). Un buen diseño además <b>se autocorrige</b>
  desde estados no usados.</p>
  <div class="formula">D: Qn=D · T: Qn=Q⊕T · JK: Qn=J·Q'+K'·Q · módulo N ⇒ n=⌈log₂N⌉, DET=N−1, borrado síncrono</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Estado / bit activo</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Próximo estado / correcto</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Entradas (excitación) / DET</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Borrado / error</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> las ecuaciones características exactas de los flip-flops D (Qn=D), T (Qn=Q⊕T) y JK (Qn=J·Q'+K'·Q); las tablas de excitación de los tres tipos, incluidos los "don't care" del JK; el contador binario síncrono de n bits (avance state→(state+1) mód 2ⁿ) con las entradas de cada flip-flop por tipo (T_i = producto de los bits de menor peso); el contador módulo N por detección del terminal DET=N−1 y borrado síncrono (secuencia 0..N−1, periodo N); el error off-by-one (DET=N ⇒ módulo N+1); y la autocorrección desde estados no usados. Verificado numéricamente de forma exhaustiva (flip-flops 8/8 JK; excitación con todas las resoluciones de don't-care; contador binario n=1..4; módulo N para N=2..16).</div>
    <div class="fl no"><b>NO modela:</b> los tiempos reales (setup/hold, retardo reloj-a-Q, sesgo de reloj), los glitches ni las carreras; el borrado ASÍNCRONO (aquí sólo síncrono) ni sus estados transitorios espurios; los contadores descendentes, up/down, de anillo/Johnson o con carga paralela; el diseño físico con mapas de Karnaugh y compuertas concretas; ni la implementación (familias TTL/CMOS, 74x161/163/190, consumo, fan-out).</div>
  </div>
  <div class="src">Ref: Mano &amp; Ciletti, Diseño Digital · Wakerly, Digital Design · Roth, Fundamentals of Logic Design · TI 74x161/74x163 · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Contadores · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_aplica">🧩 Aplica</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Reto de construcción</h4>
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
  explora:{nombre:'Explora',cam:[[4.8,2.9,7.0],[0.4,1.05,0.3]],mision:'Elige un bloque (flip-flop suelto, contador binario o contador módulo N) y condúcelo: cambia el tipo, los bits o el módulo y observa el próximo estado.'},
  aplica:{nombre:'Aplica',cam:[[4.6,2.8,6.8],[0.4,1.05,0.3]],mision:'Usa las tablas de excitación para diseñar, comprueba el error off-by-one (DET=N vs N−1) y verifica que el diseño se autocorrige.'},
  reto:{nombre:'Reto',cam:[[4.7,2.7,6.9],[0.5,1.0,0.4]],mision:'Construye un contador módulo N: fija DET = N−1 y activa el borrado síncrono. Evita contar un estado de más.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';let html='';
  if(mode==='explora'){
    html+=lbl('Bloque:')+`<button class="b sm ${expKind==='ff'?'on':''}" data-k="ff">Flip-flop</button><button class="b sm ${expKind==='cnt'?'on':''}" data-k="cnt">Contador binario</button><button class="b sm ${expKind==='mod'?'on':''}" data-k="mod">Módulo N</button>`;
    if(expKind==='ff'){
      html+=lbl('Tipo:')+['d','jk','t'].map(k=>`<button class="b sm ${ffType===k?'on':''}" data-fft="${k}">${k.toUpperCase()}</button>`).join('');
      html+=lbl('Q:')+`<button class="b sm ${ffQ?'on':''}" data-ffq="t">Q:${ffQ}</button>`;
      if(ffType==='d')html+=lbl('Entrada:')+`<button class="b sm ${ffD?'on':''}" data-ffd="t">D:${ffD}</button>`;
      else if(ffType==='t')html+=lbl('Entrada:')+`<button class="b sm ${ffT?'on':''}" data-fftg="t">T:${ffT}</button>`;
      else html+=lbl('Entradas:')+`<button class="b sm ${ffJ?'on':''}" data-ffj="t">J:${ffJ}</button><button class="b sm ${ffK?'on':''}" data-ffk="t">K:${ffK}</button>`;
    }else if(expKind==='cnt'){
      html+=lbl('Flip-flop:')+['t','d','jk'].map(k=>`<button class="b sm ${cntType===k?'on':''}" data-ct="${k}">${k.toUpperCase()}</button>`).join('');
      html+=lbl('Bits:')+[2,3,4].map(b=>`<button class="b sm ${b===cntN?'on':''}" data-cnn="${b}">${b}</button>`).join('');
      html+=lbl('Estado:')+`<button class="b sm" data-cstep="-1">◄</button><button class="b sm on" data-nostep>${cntState}</button><button class="b sm" data-cstep="1">►</button>`;
    }else{
      html+=lbl('Módulo N:')+[3,5,6,10,12].map(v=>`<button class="b sm ${v===modN?'on':''}" data-mn="${v}">${v}</button>`).join('');
      html+=lbl('Estado:')+`<button class="b sm" data-mstep="-1">◄</button><button class="b sm on" data-nostep>${modState%modN}</button><button class="b sm" data-mstep="1">►</button>`;
    }
    bar.innerHTML=html;
    bar.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expKind=b.dataset.k;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-fft]').forEach(b=>b.onclick=()=>{if(autoRunning)return;ffType=b.dataset.fft;synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ffq]').forEach(b=>b.onclick=()=>{if(autoRunning)return;ffQ=ffQ?0:1;synth.beep(760,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ffd]').forEach(b=>b.onclick=()=>{if(autoRunning)return;ffD=ffD?0:1;synth.beep(800,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-fftg]').forEach(b=>b.onclick=()=>{if(autoRunning)return;ffT=ffT?0:1;synth.beep(800,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ffj]').forEach(b=>b.onclick=()=>{if(autoRunning)return;ffJ=ffJ?0:1;synth.beep(840,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ffk]').forEach(b=>b.onclick=()=>{if(autoRunning)return;ffK=ffK?0:1;synth.beep(880,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ct]').forEach(b=>b.onclick=()=>{if(autoRunning)return;cntType=b.dataset.ct;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-cnn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;cntN=parseInt(b.dataset.cnn,10);cntState&=mask(cntN);hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-cstep]').forEach(b=>b.onclick=()=>{if(autoRunning)return;const d=parseInt(b.dataset.cstep,10);cntState=(cntState+d+ (1<<cntN))&mask(cntN);synth.beep(620,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-mn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;modN=parseInt(b.dataset.mn,10);modState=0;hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-mstep]').forEach(b=>b.onclick=()=>{if(autoRunning)return;const d=parseInt(b.dataset.mstep,10);modState=(modState+d+modN)%modN;synth.beep(620,0.05,0.04);afterEdit();});
  }else if(mode==='aplica'){
    html+=lbl('Tema:')+`<button class="b sm ${apTopic==='exc'?'on':''}" data-at="exc">Excitación</button><button class="b sm ${apTopic==='design'?'on':''}" data-at="design">Diseño módulo N</button><button class="b sm ${apTopic==='selfcorr'?'on':''}" data-at="selfcorr">Autocorrección</button>`;
    if(apTopic==='exc'){
      html+=lbl('Tabla:')+['d','t','jk'].map(k=>`<button class="b sm ${apFFType===k?'on':''}" data-aff="${k}">${k.toUpperCase()}</button>`).join('');
    }else if(apTopic==='design'){
      html+=lbl('Módulo:')+DESIGN_POOL.map((f,i)=>`<button class="b sm ${i===apDesignIdx?'on':''}" data-ad="${i}">N=${f.N}</button>`).join('');
    }else{
      html+=lbl('Caso:')+SELF_POOL.map((f,i)=>`<button class="b sm ${i===apSelfIdx?'on':''}" data-as="${i}">mod ${f.N}, inicia ${f.start}</button>`).join('');
    }
    bar.innerHTML=html;
    bar.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apTopic=b.dataset.at;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-aff]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apFFType=b.dataset.aff;synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ad]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apDesignIdx=parseInt(b.dataset.ad,10);hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-as]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apSelfIdx=parseInt(b.dataset.as,10);hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
  }else{
    const f=RETO_POOL[retoIdx],n=bitsFor(f.N);
    html+=lbl('DET:')+`<button class="b sm" data-rdet="-1">− </button><button class="b sm on" data-nostep>${retoDET} (${binStr(retoDET,n)})</button><button class="b sm" data-rdet="1">+</button>`;
    html+=lbl('Borrado:')+`<button class="b sm ${retoClear?'on':''}" data-rclr="t">${retoClear?'ACTIVO':'inactivo'}</button>`;
    bar.innerHTML=html;
    bar.querySelectorAll('[data-rdet]').forEach(b=>b.onclick=()=>{if(autoRunning)return;const d=parseInt(b.dataset.rdet,10),n=bitsFor(RETO_POOL[retoIdx].N);retoDET=(retoDET+d+(1<<n))&mask(n);retoChecked=false;retoSolved=false;synth.beep(640,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rclr]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoClear=!retoClear;retoChecked=false;retoSolved=false;synth.beep(retoClear?860:380,0.05,0.04);afterEdit();});
  }
}
function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='reto'){box.style.display='none';return;}
  const f=RETO_POOL[retoIdx],n=bitsFor(f.N);box.style.display='block';
  box.innerHTML=`Objetivo: <b>módulo ${f.N}</b> (cuenta 0..${f.N-1}). Con ${n} flip-flops, fija <b>DET = ${f.N-1}</b> y activa el borrado síncrono.`;
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
  if(mode==='reto'){seedReto();updateRetoSpec();afterEdit();solved=false;showToast('🔀 Nuevo objetivo: '+RETO_POOL[retoIdx].ctx+'.');}
  else if(mode==='aplica'){
    if(apTopic==='exc'){const ks=['d','t','jk'];apFFType=ks[pickIdx(3,ks.indexOf(apFFType))];}
    else if(apTopic==='design'){apDesignIdx=pickIdx(DESIGN_POOL.length,apDesignIdx);}
    else{apSelfIdx=pickIdx(SELF_POOL.length,apSelfIdx);}
    afterEdit();showToast('🔀 Nuevo caso.');
  }else{
    const ks=['ff','cnt','mod'];expKind=ks[pickIdx(3,ks.indexOf(expKind))];
    if(expKind==='ff'){ffType=['d','jk','t'][pickIdx(3)];ffQ=Math.random()<0.5?1:0;ffD=Math.random()<0.5?1:0;ffT=Math.random()<0.5?1:0;ffJ=Math.random()<0.5?1:0;ffK=Math.random()<0.5?1:0;}
    else if(expKind==='cnt'){cntType=['t','d','jk'][pickIdx(3)];cntN=[2,3,4][pickIdx(3)];cntState=Math.floor(Math.random()*(1<<cntN));}
    else{modN=[3,5,6,10,12][pickIdx(5)];modState=0;}
    afterEdit();showToast('🔀 Bloque: '+(expKind==='ff'?'flip-flop':expKind==='cnt'?'contador binario':'contador módulo N')+'. Condúcelo.');
  }
  synth.beep(520,0.08,0.05);hwStep=0;
}

// ===================== 11. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele');
  if(mode==='reto'){
    const f=RETO_POOL[retoIdx],n=bitsFor(f.N),sim=simulate(n,retoDET,retoClear);
    t.innerHTML=teleRow('Objetivo','módulo '+f.N+' (0..'+(f.N-1)+')')+
      teleRow('DET elegido',retoDET+' / objetivo '+(f.N-1),retoDET===f.N-1?'good':'warn')+
      teleRow('Borrado',retoClear?'activo':'inactivo',retoClear?'good':'warn')+
      teleRow('Periodo obtenido',String(sim.period),sim.period===f.N?'good':'warn')+
      teleRow('Estado',retoChecked?(retoSolved?'✔ correcto':'✗ revisa'):'configura y comprueba',(retoChecked&&retoSolved)?'good':'warn');
    return;
  }
  if(mode==='aplica'){
    if(apTopic==='exc'){
      t.innerHTML=teleRow('Tema','Tabla de excitación')+teleRow('Tipo',apFFType.toUpperCase())+teleRow('Transiciones','4 (0→0,0→1,1→0,1→1)')+teleRow('Don\'t care',apFFType==='jk'?'sí (2 celdas)':'no');
    }else if(apTopic==='design'){const N=DESIGN_POOL[apDesignIdx].N,n=bitsFor(N);
      t.innerHTML=teleRow('Tema','Diseño módulo '+N)+teleRow('Flip-flops n',String(n))+teleRow('DET = N−1',String(N-1))+teleRow('Periodo',String(simulate(n,N-1,true).period),'good');
    }else{const f=SELF_POOL[apSelfIdx],n=bitsFor(f.N),DET=f.N-1;let x=f.start,steps=0;while(x>=f.N&&steps<8){x=modNext(x,n,DET,true);steps++;}
      t.innerHTML=teleRow('Tema','Autocorrección')+teleRow('Arranca en',String(f.start),'warn')+teleRow('Válidos','0..'+(f.N-1))+teleRow('Flancos hasta ciclo',String(steps),'good');
    }
    return;
  }
  if(expKind==='ff'){let ins,Qn;
    if(ffType==='d'){ins='D='+ffD;Qn=dFF(ffQ,ffD);}else if(ffType==='t'){ins='T='+ffT;Qn=tFF(ffQ,ffT);}else{ins='J='+ffJ+' K='+ffK;Qn=jkFF(ffQ,ffJ,ffK);}
    t.innerHTML=teleRow('Bloque','Flip-flop '+ffType.toUpperCase())+teleRow('Entradas',ins)+teleRow('Estado Q',String(ffQ))+teleRow('Próximo Qn',String(Qn),Qn?'good':'')+teleRow('Ecuación',ffType==='d'?'Qn=D':(ffType==='t'?'Qn=Q⊕T':"Qn=JQ'+K'Q"));
  }else if(expKind==='cnt'){const nx=binNext(cntState,cntN);
    t.innerHTML=teleRow('Bloque','Contador '+cntN+' bits ('+cntType.toUpperCase()+')')+teleRow('Estado',cntState+' = '+binStr(cntState,cntN))+teleRow('Próximo',nx+' = '+binStr(nx,cntN),'good')+teleRow('Módulo',String(1<<cntN))+teleRow('Reloj','flanco común (síncrono)');
  }else{const n=bitsFor(modN);
    t.innerHTML=teleRow('Bloque','Contador módulo '+modN)+teleRow('Flip-flops',String(n))+teleRow('DET terminal',String(modN-1),'warn')+teleRow('Estado actual',String(modState%modN),'good')+teleRow('Periodo',String(simulate(n,modN-1,true).period));
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='reto'){
    const f=RETO_POOL[retoIdx];
    html+=retoMsg||`<span class="mono">Contador módulo ${f.N}: fija DET = ${f.N-1} (el último estado válido) y activa el borrado síncrono. Comprueba.</span>`;
  }else if(mode==='aplica'){
    if(apTopic==='exc'){html+=`<span class="mono">Excitación ${apFFType.toUpperCase()}: reverso de la tabla característica. Dado Q→Qn, ¿qué entrada? ${apFFType==='jk'?'El JK tiene "don\'t care" que simplifican el diseño.':''}</span>`;}
    else if(apTopic==='design'){const N=DESIGN_POOL[apDesignIdx].N,n=bitsFor(N);html+=`<span class="mono">Módulo ${N}: n=⌈log₂${N}⌉=${n} flip-flops, DET=${N-1}, borrado síncrono → cuenta 0..${N-1}. Si detectaras ${N} tendrías módulo ${N+1}.</span>`;}
    else{const f=SELF_POOL[apSelfIdx];html+=`<span class="mono">Módulo ${f.N} arrancando en ${f.start} (no usado): el borrado síncrono lo devuelve al ciclo 0..${f.N-1}. Buen diseño = autocorrectivo.</span>`;}
  }else{
    if(expKind==='ff'){html+=`<span class="mono">Flip-flop ${ffType.toUpperCase()}: memoria de un bit. Su ecuación característica decide Qn en el flanco de reloj.</span>`;}
    else if(expKind==='cnt'){const nx=binNext(cntState,cntN);html+=`<span class="mono">Contador síncrono ${cntN} bits: ${cntState} → ${nx}. Todos los flip-flops cambian con el mismo reloj.</span>`;}
    else{const n=bitsFor(modN);html+=`<span class="mono">Contador módulo ${modN}: ${n} flip-flops, detecta DET=${modN-1} y borra a 0 → ciclo 0..${modN-1}.</span>`;}
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();updateHW();}

// ===================== 12. RETO =====================
function updateRetoSpec(){
  const f=RETO_POOL[retoIdx],n=bitsFor(f.N);
  el('retoSpec').innerHTML=`Construye un contador <b>módulo ${f.N}</b> (cuenta 0..${f.N-1}) con ${n} flip-flops. Fija la detección del terminal <b>DET = N−1 = ${f.N-1}</b> y activa el <b>borrado síncrono</b>. Pulsa "Comprobar".`;
}
function checkReto(){
  const f=RETO_POOL[retoIdx],n=bitsFor(f.N);
  retoOkDetect=(retoDET===f.N-1);
  retoOkClear=(retoClear===true);
  retoSolved=retoOkDetect&&retoOkClear;retoChecked=true;solved=retoSolved;
  synth.beep(retoSolved?1046:220,retoSolved?0.14:0.15,0.06);
  retoMsg=`<span class="mono"><span class="${retoSolved?'ok':'dtc'}">${retoSolved?'✔ Correcto':'✗ Revisa'}</span> — ${retoExplain(f,n)}</span>`;
  refreshAll();
}

// ===================== 13. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Cuál es la ecuación característica del flip-flop JK?',
      opciones:[
        {t:"Qn = J·Q' + K'·Q — retiene con J=K=0, pone a 0 con (0,1), pone a 1 con (1,0) y conmuta con J=K=1.",ok:true,why:"Correcto: el JK hace las cuatro operaciones. Con J=K=1 conmuta (Qn=Q'), por eso sirve para contadores; con J=K se comporta como un flip-flop T."},
        {t:'Qn = D, copia siempre la entrada sin importar el estado previo.',ok:false,why:'Esa es la ecuación del flip-flop D, no del JK. El JK depende del estado actual Q y de dos entradas.'},
        {t:'Qn = Q ⊕ T, conmuta cuando la entrada vale 1.',ok:false,why:'Esa es la del flip-flop T. El JK se reduce a un T sólo cuando J=K, pero su ecuación general usa J y K por separado.'},
        {t:'Qn = J·K, la AND de sus dos entradas.',ok:false,why:'No: con J=1,K=0 el JK pone Qn=1 aunque J·K=0. La salida depende también del estado previo Q, no sólo de las entradas.'},
      ],
    },
    aplica:{
      pregunta:'Para un contador síncrono módulo N (que cuente 0,1,…,N−1), ¿qué estado terminal se detecta para borrar?',
      opciones:[
        {t:'DET = N − 1: es el último de los N estados válidos (0..N−1). Al alcanzarlo, el siguiente flanco borra a 0 y el ciclo tiene periodo N.',ok:true,why:'Correcto: N estados van de 0 a N−1, así que el terminal es N−1. Detectarlo y borrar de forma síncrona da exactamente el módulo N.'},
        {t:'DET = N: se cuenta hasta N y entonces se borra.',ok:false,why:'Ése es el error clásico off-by-one: contar 0..N son N+1 estados → módulo N+1. El terminal correcto es N−1.'},
        {t:'DET = 2ⁿ − 1, el máximo que caben n flip-flops.',ok:false,why:'Eso daría el módulo natural 2ⁿ (contador libre), no el módulo N deseado. Hay que detectar N−1 antes de llegar al máximo.'},
        {t:'DET = N/2, la mitad del recorrido.',ok:false,why:'No tiene relación con el fin del conteo. El terminal es siempre el último estado válido, N−1.'},
      ],
    },
    reto:{
      pregunta:'Detectaste el terminal correcto (N−1) pero el contador cuenta libre hasta 2ⁿ−1. ¿Qué falta?',
      opciones:[
        {t:'Activar el borrado síncrono: la detección de N−1 debe FORZAR el estado a 0 en el siguiente flanco. Sin esa acción, detectar el terminal no hace nada y el contador sigue hasta 2ⁿ−1.',ok:true,why:'Correcto: detectar el terminal es sólo la mitad; hay que conectar esa señal al borrado (síncrono) para que el contador regrese a 0 y se cierre el ciclo 0..N−1.'},
        {t:'Aumentar el número de flip-flops.',ok:false,why:'No: con más flip-flops la capacidad crece pero el problema persiste. Lo que falta es actuar (borrar) cuando se detecta el terminal.'},
        {t:'Cambiar los flip-flops de T a D.',ok:false,why:'El tipo de flip-flop no cambia el módulo. La cuenta se recorta con la detección del terminal más el borrado, sin importar el tipo.'},
        {t:'Poner DET = N en lugar de N − 1.',ok:false,why:'Eso empeora las cosas: daría módulo N+1. El DET ya era correcto; lo que falta es habilitar el borrado.'},
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
    expKind='ff';ffType='jk';ffQ=0;ffJ=1;ffK=1;afterEdit();
    showToast('🔁 Flip-flop JK con J=K=1: conmuta en cada flanco (Qn=Q\'). Es la base de un contador.');
    await sleep(4200);
    expKind='cnt';cntType='t';cntN=3;cntState=3;afterEdit();
    showToast('🔢 Contador síncrono de 3 bits: 3 → 4. Con flip-flops T, el bit i conmuta cuando todos los de abajo valen 1.');
    await sleep(4200);
    expKind='mod';modN=5;modState=0;afterEdit();
    showToast('🔟 Contador módulo 5: cuenta 0..4 y detecta DET=4 para borrar a 0. Necesita 3 flip-flops.');
    await sleep(4200);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('aplica');
    apTopic='exc';apFFType='jk';afterEdit();
    showToast('🧩 Tabla de excitación JK: los "don\'t care" (x) dan libertad para simplificar las compuertas.');
    await sleep(4400);
    apTopic='design';apDesignIdx=0;afterEdit();
    showToast('📐 Diseño módulo 5: n=3 flip-flops, DET=4, borrado síncrono → 0,1,2,3,4,0…');
    await sleep(4400);
    apTopic='selfcorr';apSelfIdx=0;afterEdit();
    showToast('♻️ Autocorrección: aunque arranque en un estado no usado (6), el borrado lo devuelve al ciclo 0..4.');
    await sleep(4200);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('reto');
    seedReto(0);updateRetoSpec();afterEdit();
    showToast('🎯 Reto: '+RETO_POOL[retoIdx].ctx+'. Primero probamos el error clásico: DET=N con borrado…');
    const f0=RETO_POOL[retoIdx];retoDET=f0.N;retoClear=true;afterEdit();await sleep(3400);
    checkReto();
    showToast('…DET='+f0.N+' cuenta un estado de más → módulo '+(f0.N+1)+'. Corregimos a DET=N−1.');
    await sleep(3600);
    retoDET=f0.N-1;retoClear=true;afterEdit();
    showToast('✔ DET=N−1='+(f0.N-1)+' y borrado síncrono: contador módulo '+f0.N+'. Comprobamos.');
    await sleep(2400);
    checkReto();await sleep(2400);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 16. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt,time)=>{
  hwT+=dt;
  if(hwT>0.8){hwT=0;hwStep=(hwStep+1)%hwCount();updateHW();}
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
  dFF, jkFF, tFF, excD, excT, excJK, mask, binNext, modNext, simulate, bitsFor, ffInputs,
  // explora
  expKind:()=>expKind, setExpKind:k=>{expKind=k;afterEdit();},
  ffType:()=>ffType, setFFType:k=>{ffType=k;afterEdit();},
  setFF:(type,q,a,b)=>{ffType=type;ffQ=q?1:0;if(type==='d')ffD=a?1:0;else if(type==='t')ffT=a?1:0;else{ffJ=a?1:0;ffK=b?1:0;}afterEdit();},
  ffState:()=>{let Qn;if(ffType==='d')Qn=dFF(ffQ,ffD);else if(ffType==='t')Qn=tFF(ffQ,ffT);else Qn=jkFF(ffQ,ffJ,ffK);return{type:ffType,Q:ffQ,D:ffD,T:ffT,J:ffJ,K:ffK,Qn};},
  setCnt:(type,n,state)=>{cntType=type;cntN=n;cntState=state&mask(n);afterEdit();},
  cntState:()=>({type:cntType,n:cntN,state:cntState,next:binNext(cntState,cntN),inputs:ffInputs(cntState,cntN,cntType)}),
  setMod:(N,state)=>{modN=N;modState=state%N;afterEdit();},
  modState:()=>{const n=bitsFor(modN);return{N:modN,n,state:modState%modN,det:modN-1,period:simulate(n,modN-1,true).period};},
  // aplica
  apTopic:()=>apTopic, setApTopic:k=>{apTopic=k;afterEdit();},
  apFFType:()=>apFFType, setApFFType:k=>{apFFType=k;afterEdit();},
  setApDesign:i=>{apDesignIdx=i;afterEdit();},
  apDesignResult:()=>{const N=DESIGN_POOL[apDesignIdx].N,n=bitsFor(N),sim=simulate(n,N-1,true);return{N,n,det:N-1,period:sim.period,seq:sim.seq,ok:sim.period===N};},
  setApSelf:i=>{apSelfIdx=i;afterEdit();},
  apSelfResult:()=>{const f=SELF_POOL[apSelfIdx],n=bitsFor(f.N),DET=f.N-1;let x=f.start,steps=0;const path=[x];while(x>=f.N&&steps<10){x=modNext(x,n,DET,true);path.push(x);steps++;}return{N:f.N,start:f.start,stepsToValid:steps,entersCycle:x<f.N,path};},
  offByOne:(N)=>{const n=bitsFor(N);return{modNm1:simulate(n,N-1,true).period,modN:simulate(n,N,true).period};},
  // reto
  retoN:()=>RETO_POOL[retoIdx].N, retoIdx:()=>retoIdx, seedReto:i=>{seedReto(i);afterEdit();},
  retoDET:()=>retoDET, retoSetDET:v=>{const n=bitsFor(RETO_POOL[retoIdx].N);retoDET=v&mask(n);retoChecked=false;retoSolved=false;afterEdit();},
  retoClear:()=>retoClear, retoSetClear:v=>{retoClear=!!v;retoChecked=false;retoSolved=false;afterEdit();},
  retoSolveBuild:()=>{const f=RETO_POOL[retoIdx];retoDET=f.N-1;retoClear=true;retoChecked=false;retoSolved=false;afterEdit();},
  checkReto:()=>checkReto(),
  retoChecked:()=>retoChecked, retoOkDetect:()=>retoOkDetect, retoOkClear:()=>retoOkClear, retoSolved:()=>retoSolved,
  retoPeriod:()=>{const f=RETO_POOL[retoIdx],n=bitsFor(f.N);return simulate(n,retoDET,retoClear).period;},
  // quiz / general
  quizCorrectIndex:()=>{const q=QUIZ[mode];return q?q.opciones.findIndex(o=>o.ok):-1;},
  quizAnswer:i=>answer(i),
  newSignal:()=>newSignal(),
  solved:()=>solved,
};
