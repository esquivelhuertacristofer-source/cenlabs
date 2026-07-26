// Registros de desplazamiento: conversión serie/paralelo (SIPO/PISO), diagramas de tiempos,
// contadores de anillo y Johnson (D3 · digital). Física (verificada node -e, 17/17 exhaustiva):
//   DESPLAZAMIENTO A LA DERECHA: Q_i ← Q_{i+1}; entra por el MSB (Q_{n-1}), sale por el LSB (Q_0).
//     shiftR(s,n,sin) = (s>>1)|(sin<<(n-1)). Con sin=0 equivale a DIVIDIR entre 2.
//   DESPLAZAMIENTO A LA IZQUIERDA: Q_i ← Q_{i-1}; entra por el LSB (Q_0), sale por el MSB (Q_{n-1}).
//     shiftL(s,n,sin) = ((s<<1)|sin)&mask. Con sin=0 equivale a MULTIPLICAR por 2 (mód 2ⁿ).
//   SIPO (serie→paralelo): n flancos con la entrada serie MSB primero (shift-left) reconstruyen la palabra.
//   PISO (paralelo→serie): se carga la palabra y n flancos la sacan por el serial-out, MSB primero.
//   ENLACE SERIE: emisor PISO (MSB primero) + receptor SIPO. La dirección debe COINCIDIR (izquierda) o los
//     bits salen invertidos; hacen falta EXACTAMENTE n flancos o la palabra queda truncada.
//   CONTADOR DE ANILLO (realimenta serial-out→serial-in, one-hot desde 0..01): periodo n, siempre un solo 1.
//   CONTADOR JOHNSON (realimenta serial-out NEGADO→serial-in, desde 0): periodo 2n. n=4 → 0,8,12,14,15,7,3,1.
//   Ref: Mano & Ciletti, "Diseño Digital" · Wakerly, "Digital Design" · Roth, "Fundamentals of Logic Design"
//        · Floyd, "Digital Fundamentals" · TI 74x164 (SIPO), 74x165 (PISO), 74x194 (universal) · verif. propia.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.8,2.9,7.0],target:[0.4,1.05,0.3],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.44,minD:3.2,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. FÍSICA (VERIFICADA) =====================
function maskN(n){return (1<<n)-1;}
function shiftR(state,n,sin){return (((state>>1)|((sin?1:0)<<(n-1)))&maskN(n));}   // entra MSB, sale LSB (÷2)
function shiftRout(state){return state&1;}                                          // bit que sale (LSB)
function shiftL(state,n,sin){return (((state<<1)|(sin?1:0))&maskN(n));}             // entra LSB, sale MSB (×2)
function shiftLout(state,n){return (state>>(n-1))&1;}                               // bit que sale (MSB)
function bitsOf(word,n){const a=[];for(let i=n-1;i>=0;i--)a.push((word>>i)&1);return a;}  // MSB primero
function sipo(bits,n){let s=0;for(const b of bits)s=shiftL(s,n,b);return s;}        // serie(MSB)→paralelo
function pisoOut(word,n){let s=word&maskN(n);const out=[];for(let i=0;i<n;i++){out.push(shiftLout(s,n));s=shiftL(s,n,0);}return out;} // paralelo→serie(MSB)
function pisoStates(word,n){const st=[word&maskN(n)];let s=word&maskN(n);const out=[];for(let i=0;i<n;i++){out.push(shiftLout(s,n));s=shiftL(s,n,0);st.push(s);}return {st,out};}
function sipoStates(word,n){const bits=bitsOf(word,n);const st=[0];let s=0;for(const b of bits){s=shiftL(s,n,b);st.push(s);}return {st,bits};}
function ringNext(state,n){const sin=state&1;return shiftR(state,n,sin);}           // realimenta LSB→MSB
function johnsonNext(state,n){const sin=(state&1)^1;return shiftR(state,n,sin);}    // realimenta LSB negado→MSB
function ringSeq(n){const s=[];let x=1;for(let k=0;k<n;k++){s.push(x);x=ringNext(x,n);}return s;}
function johnsonSeq(n){const s=[];let x=0;for(let k=0;k<2*n;k++){s.push(x);x=johnsonNext(x,n);}return s;}
// enlace serie: emisor manda MSB primero; receptor desplaza en 'dir' durante 'clocks' flancos
function receive(txWord,n,dir,clocks){const stream=bitsOf(txWord,n);let s=0;for(let k=0;k<clocks;k++){const b=stream[k]||0;s=(dir==='left')?shiftL(s,n,b):shiftR(s,n,b);}return s&maskN(n);}
function binStr(v,n){return (v&((1<<n)-1)).toString(2).padStart(n,'0');}

// ===================== 3. ESTADO =====================
let mode='explora';
// explora — conduces cada bloque en vivo
let expKind='shift';                     // 'shift' | 'ring' | 'johnson'
let shN=4, shState=0b0110, shDir='right', shSin=1, shLastOut='—';
let ringN=4, ringState=1;                // one-hot
let johnN=4, johnState=0;
// aplica
let apTopic='sipo';                      // 'sipo' | 'piso' | 'counters'
const WORD_POOL=[{w:0b1011,n:4},{w:0b10110,n:5},{w:0b101100,n:6},{w:0b10011010,n:8}];
let apWordIdx=0;
let apCntN=4;                            // para comparación anillo vs Johnson
// reto — recuperar una palabra por un enlace serie: elegir dirección y número de flancos
const RETO_POOL=[
  {w:0b1011,     n:4, ctx:'un dato de 4 bits de un sensor (1011)'},
  {w:0b110,      n:3, ctx:'un código de 3 bits (110)'},
  {w:0b11010,    n:5, ctx:'una palabra de 5 bits (11010)'},
  {w:0b100110,   n:6, ctx:'una palabra de 6 bits (100110)'},
  {w:0b1001011,  n:7, ctx:'una trama de 7 bits (1001011)'},
  {w:0b10110100, n:8, ctx:'un byte de un carácter (10110100)'},
];
let retoIdx=0, retoDir='right', retoClocks=1, retoChecked=false, retoOkDir=false, retoOkClocks=false, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false, QUIZ={};
let hwStep=0, hwT=0;

function pickIdx(n,ex){let v=Math.floor(Math.random()*n);if(n>1)while(v===ex)v=Math.floor(Math.random()*n);return v;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
function seedReto(idx){
  retoIdx=(idx==null)?pickIdx(RETO_POOL.length,retoIdx):idx;
  retoDir='right'; retoClocks=1;
  retoChecked=false; retoOkDir=false; retoOkClocks=false; retoSolved=false; retoMsg='';
}
seedReto(0);

// número de flip-flops del dispositivo activo (para el entrenador 3D)
function curBits(){
  if(mode==='reto')return RETO_POOL[retoIdx].n;
  if(mode==='aplica'){if(apTopic==='counters')return apCntN;return WORD_POOL[apWordIdx].n;}
  if(expKind==='ring')return ringN;
  if(expKind==='johnson')return johnN;
  return shN;
}
// secuencia de estados que recorre el entrenador 3D
function curSeq(){
  if(mode==='reto'){const f=RETO_POOL[retoIdx];const bits=bitsOf(f.w,f.n);const st=[0];let s=0;for(let k=0;k<retoClocks;k++){const b=bits[k]||0;s=(retoDir==='left')?shiftL(s,f.n,b):shiftR(s,f.n,b);st.push(s);}return st;}
  if(mode==='aplica'){
    if(apTopic==='sipo')return sipoStates(WORD_POOL[apWordIdx].w,WORD_POOL[apWordIdx].n).st;
    if(apTopic==='piso')return pisoStates(WORD_POOL[apWordIdx].w,WORD_POOL[apWordIdx].n).st;
    return ringSeq(apCntN);
  }
  if(expKind==='ring')return ringSeq(ringN);
  if(expKind==='johnson')return johnsonSeq(johnN);
  // shift: rellena con un patrón alterno y luego vacía
  const seq=[];let s=0;for(let k=0;k<shN;k++){s=shiftR(s,shN,k%2);seq.push(s);}for(let k=0;k<shN;k++){s=shiftR(s,shN,0);seq.push(s);}return seq;
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
frame.userData={title:'Registros de desplazamiento',info:'SIPO/PISO, diagramas de tiempos y contadores de anillo/Johnson · toca para inspeccionar'};
addHoverLabel(frame,'Registros de desplazamiento',ACC,new THREE.Vector3(0,3.5,0.1).add(boardG.position),2.4);

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

// ---- registro de n celdas (MSB izquierda → LSB derecha) con flechas serie ----
function drawRegister(c,x,y,n,state,color,cw,dir,sinBit,soutBit){
  cw=cw||46;
  for(let k=0;k<n;k++){const i=n-1-k;const b=(state>>i)&1;const bx=x+k*cw;
    c.strokeStyle=hexA(color,0.55);c.lineWidth=1.6;rr(c,bx,y,cw-6,cw-6,5);c.stroke();
    c.fillStyle=b?color:'#4a525e';c.font='bold 20px Outfit, sans-serif';c.textAlign='center';c.fillText(b,bx+(cw-6)/2,y+(cw-6)*0.7);
    c.fillStyle='#7a8494';c.font='10px Outfit, sans-serif';c.fillText('Q'+i,bx+(cw-6)/2,y+cw+4);}
  const rightX=x+n*cw-6, midY=y+(cw-6)/2;
  // dirección de desplazamiento (flecha interior)
  c.fillStyle=hexA(color,0.5);c.font='12px Outfit, sans-serif';c.textAlign='center';
  c.fillText(dir==='right'?'desplaza →':'← desplaza',x+(n*cw-6)/2,y-10);
  if(dir==='right'){
    // entra MSB (izquierda), sale LSB (derecha)
    c.strokeStyle=OK_HEX;c.lineWidth=2;c.beginPath();c.moveTo(x-34,midY);c.lineTo(x,midY);c.stroke();
    c.beginPath();c.moveTo(x-8,midY-5);c.lineTo(x,midY);c.lineTo(x-8,midY+5);c.stroke();
    if(sinBit!=null){c.fillStyle=OK_HEX;c.font='bold 14px Outfit, sans-serif';c.textAlign='right';c.fillText('SIN='+sinBit,x-38,midY+5);}
    c.strokeStyle=WARN_HEX;c.beginPath();c.moveTo(rightX,midY);c.lineTo(rightX+34,midY);c.stroke();
    c.beginPath();c.moveTo(rightX+26,midY-5);c.lineTo(rightX+34,midY);c.lineTo(rightX+26,midY+5);c.stroke();
    if(soutBit!=null&&soutBit!=='—'){c.fillStyle=WARN_HEX;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('SOUT='+soutBit,rightX+40,midY+5);}
  }else{
    // entra LSB (derecha), sale MSB (izquierda)
    c.strokeStyle=OK_HEX;c.lineWidth=2;c.beginPath();c.moveTo(rightX+34,midY);c.lineTo(rightX,midY);c.stroke();
    c.beginPath();c.moveTo(rightX+8,midY-5);c.lineTo(rightX,midY);c.lineTo(rightX+8,midY+5);c.stroke();
    if(sinBit!=null){c.fillStyle=OK_HEX;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('SIN='+sinBit,rightX+40,midY+5);}
    c.strokeStyle=WARN_HEX;c.beginPath();c.moveTo(x,midY);c.lineTo(x-34,midY);c.stroke();
    c.beginPath();c.moveTo(x-26,midY-5);c.lineTo(x-34,midY);c.lineTo(x-26,midY+5);c.stroke();
    if(soutBit!=null&&soutBit!=='—'){c.fillStyle=WARN_HEX;c.font='bold 14px Outfit, sans-serif';c.textAlign='right';c.fillText('SOUT='+soutBit,x-38,midY+5);}
  }
  return x+n*cw;
}

// ---- forma de onda digital ----
function drawWave(c,x,y,cellW,levels,color,label,h){
  h=h||20;
  c.fillStyle='#9fb0cf';c.font='11px Outfit, sans-serif';c.textAlign='right';c.textBaseline='middle';c.fillText(label,x-8,y-h/2);c.textBaseline='alphabetic';
  if(!levels.length)return;
  c.strokeStyle=color;c.lineWidth=2;c.beginPath();
  let prevY=levels[0]?y-h:y;c.moveTo(x,prevY);c.lineTo(x+cellW,prevY);
  for(let k=1;k<levels.length;k++){const yy=levels[k]?y-h:y;const xx=x+k*cellW;if(yy!==prevY)c.lineTo(xx,yy);c.lineTo(xx+cellW,yy);prevY=yy;}
  c.stroke();
}
// reloj: un pulso por flanco (sub-resolución 2×)
function clkLevels(steps){const a=[];for(let k=0;k<steps;k++){a.push(0);a.push(1);}return a;}

// ---- anillo de estados de un contador (anillo / Johnson) ----
function drawCounterRing(c,cx,cy,rad,seq,cur,n){
  const tot=seq.length;
  for(let k=0;k<tot;k++){
    const ang=-Math.PI/2+k*2*Math.PI/tot;
    const x=cx+Math.cos(ang)*rad,y=cy+Math.sin(ang)*rad;
    const isCur=(seq[k]===cur);
    c.beginPath();c.arc(x,y,21,0,7);
    c.fillStyle=isCur?ACC:hexA(ACC,0.10);c.fill();
    c.strokeStyle=isCur?ACC:hexA(ACC,0.4);c.lineWidth=isCur?3:1.4;c.stroke();
    c.fillStyle=isCur?'#0c1016':'#C9D3E2';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.fillText(binStr(seq[k],n),x,y);
  }
  c.textBaseline='alphabetic';
  c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';c.textAlign='center';c.fillText('periodo '+tot,cx,cy+4);
}

// ===================== 6. VISTAS POR MODO =====================
function drawExplora(c){
  if(expKind==='shift'){
    const n=shN,sout=shDir==='right'?shiftRout(shState):shiftLout(shState,n);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Registro de desplazamiento de '+n+' bits',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('En cada flanco los bits avanzan una posición. Entra un bit por un extremo (SIN) y sale otro por el otro (SOUT).',30,64);
    drawRegister(c,180,160,n,shState,ACC,54,shDir,shSin,shLastOut);
    // valor decimal y relación ×2 / ÷2
    c.fillStyle='#9fb0cf';c.font='13px Outfit, sans-serif';c.textAlign='left';
    c.fillText('Estado: '+binStr(shState,n)+'  =  '+shState+' (decimal)',180,270);
    if(shSin===0){
      const rel=shDir==='right'?('÷2 → '+(shState>>1)):('×2 → '+((shState<<1)&maskN(n)));
      c.fillStyle=VIO;c.font='bold 13px Outfit, sans-serif';c.fillText('Con SIN=0, desplazar equivale a '+rel+' (mód 2ⁿ)',180,294);
    }
    c.fillStyle=WARN_HEX;c.font='13px Outfit, sans-serif';c.fillText('Último bit que salió (SOUT): '+shLastOut,180,322);
    // panel
    rpanel(c,PX.x,PX.y,PX.w,180,'REGISTRO');
    prow(c,PX.x,PX.y+52,PX.w,'Bits (n)',String(n));
    prow(c,PX.x,PX.y+80,PX.w,'Dirección',shDir==='right'?'a la derecha →':'← a la izquierda');
    prow(c,PX.x,PX.y+108,PX.w,'Entrada serie (SIN)',String(shSin),OK_HEX);
    prow(c,PX.x,PX.y+136,PX.w,'Salida serie (SOUT)',String(sout),WARN_HEX);
    const by=PX.y+200;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,280);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,280);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('DERECHA vs IZQUIERDA',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Desplazar a la DERECHA mueve Q_i ← Q_{i+1}: el bit entra por el MSB (Q'+(n-1)+') y sale por el LSB (Q0). Con SIN=0 eso divide el número entre 2. Desplazar a la IZQUIERDA mueve Q_i ← Q_{i-1}: entra por el LSB (Q0) y sale por el MSB; con SIN=0 multiplica por 2 (módulo 2ⁿ, se pierde el bit que se sale). Pulsa "Flanco de reloj ▸" para desplazar; cambia SIN y la dirección arriba.',PX.x+14,by+48,PX.w-28,17);
  }else if(expKind==='ring'){
    const n=ringN,seq=ringSeq(n);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Contador de anillo ('+n+' bits)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Un registro que realimenta su salida serie a su entrada: el único 1 circula. Periodo = n = '+n+' estados.',30,64);
    drawRegister(c,200,150,n,ringState,ACC,54,'right',ringState&1,null);
    drawCounterRing(c,300,400,120,seq,ringState,n);
    rpanel(c,PX.x,PX.y,PX.w,170,'ANILLO (ONE-HOT)');
    prow(c,PX.x,PX.y+52,PX.w,'Bits (n)',String(n));
    prow(c,PX.x,PX.y+80,PX.w,'Estado',binStr(ringState,n),ACC);
    prow(c,PX.x,PX.y+108,PX.w,'Periodo',String(n),OK_HEX);
    prow(c,PX.x,PX.y+136,PX.w,'Unos activos','1 (siempre)');
    const by=PX.y+190;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,290);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,290);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('PARA QUÉ SIRVE',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El contador de anillo realimenta el serial-out al serial-in. Si arranca con un solo 1 (one-hot), ese 1 recorre las n posiciones y vuelve al inicio: periodo n. Cada salida Q_i se activa en un flanco distinto, sin decodificar: es un generador de fases o un secuenciador de pasos directo (semáforos, motores paso a paso). El precio: usa n flip-flops para n estados, frente a ⌈log₂n⌉ de un contador binario.',PX.x+14,by+48,PX.w-28,17);
  }else{
    const n=johnN,seq=johnsonSeq(n);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Contador Johnson ('+n+' bits)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Como el anillo, pero realimenta la salida serie NEGADA. Duplica el conteo: periodo = 2n = '+(2*n)+' estados.',30,64);
    drawRegister(c,200,150,n,johnState,ACC,54,'right',(johnState&1)^1,null);
    drawCounterRing(c,300,420,130,seq,johnState,n);
    rpanel(c,PX.x,PX.y,PX.w,170,'JOHNSON (TORCIDO)');
    prow(c,PX.x,PX.y+52,PX.w,'Bits (n)',String(n));
    prow(c,PX.x,PX.y+80,PX.w,'Estado',binStr(johnState,n),ACC);
    prow(c,PX.x,PX.y+108,PX.w,'Periodo',String(2*n),OK_HEX);
    prow(c,PX.x,PX.y+136,PX.w,'Realimentación','SOUT negado');
    const by=PX.y+190;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,290);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,290);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('ANILLO vs JOHNSON',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El contador Johnson (o de anillo torcido) realimenta el serial-out INVERTIDO. Partiendo de 0 se llena de 1s por un lado y luego se vacía, recorriendo 2n estados con n flip-flops: el doble que el anillo. Sus salidas dan n fases con solape del 50% (útil para generar ondas o relojes multifase). Sus estados forman una secuencia sin decodificar y sólo dos flip-flops adyacentes cambian por flanco (código tipo Gray), lo que reduce glitches.',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawAplica(c){
  if(apTopic==='sipo'){
    const W=WORD_POOL[apWordIdx].w,n=WORD_POOL[apWordIdx].n,{st,bits}=sipoStates(W,n),recov=st[n];
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · SIPO (serie → paralelo)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Un solo cable trae los bits en serie (MSB primero). Tras n flancos, el registro contiene la palabra completa.',30,64);
    // diagrama de tiempos
    const tx=140,ty=130,cw=64,steps=n;
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillText('DIAGRAMA DE TIEMPOS ('+n+' flancos):',tx-100,ty-16);
    drawWave(c,tx,ty+14,cw/2,clkLevels(steps),'#9fb0cf','CLK',16);
    drawWave(c,tx,ty+58,cw,bits,OK_HEX,'SIN',16);
    // etiquetas de bit sobre SIN
    for(let k=0;k<steps;k++){c.fillStyle=hexA(OK_HEX,0.8);c.font='10px Outfit, sans-serif';c.textAlign='center';c.fillText('b'+(n-1-k),tx+k*cw+cw/2,ty+36);}
    // filas Q (de MSB a LSB)
    let ry=ty+92;
    for(let p=n-1;p>=0;p--){const levels=[];for(let k=0;k<steps;k++)levels.push((st[k+1]>>p)&1);drawWave(c,tx,ry,cw,levels,ACC,'Q'+p,14);ry+=30;}
    // registro final
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillText('Tras '+n+' flancos:',30,ry+34);
    drawRegister(c,200,ry+16,n,recov,recov===W?OK_HEX:BAD_HEX,46,'right',null,null);
    rpanel(c,PX.x,PX.y,PX.w,180,'CONVERSIÓN SERIE→PARALELO');
    prow(c,PX.x,PX.y+52,PX.w,'Palabra enviada',binStr(W,n));
    prow(c,PX.x,PX.y+80,PX.w,'Orden','MSB primero');
    prow(c,PX.x,PX.y+108,PX.w,'Flancos necesarios',String(n));
    prow(c,PX.x,PX.y+136,PX.w,'Recuperada',binStr(recov,n),recov===W?OK_HEX:BAD_HEX);
    const by=PX.y+200;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,280);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,280);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('POR QUÉ SIPO',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El SIPO (74x164) recibe datos por un solo cable —ahorra pines y conductores— y los presenta en paralelo. Con desplazamiento a la izquierda y enviando MSB primero, tras n flancos cada bit queda en su posición. Es la base de la recepción serie (UART, SPI) y de expandir salidas de un microcontrolador.',PX.x+14,by+48,PX.w-28,17);
  }else if(apTopic==='piso'){
    const W=WORD_POOL[apWordIdx].w,n=WORD_POOL[apWordIdx].n,{st,out}=pisoStates(W,n);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · PISO (paralelo → serie)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Se carga la palabra en paralelo y n flancos la sacan bit a bit por el serial-out (MSB primero).',30,64);
    const tx=140,ty=130,cw=64,steps=n;
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillText('DIAGRAMA DE TIEMPOS ('+n+' flancos):',tx-100,ty-16);
    drawWave(c,tx,ty+14,cw/2,clkLevels(steps),'#9fb0cf','CLK',16);
    drawWave(c,tx,ty+58,cw,out,WARN_HEX,'SOUT',16);
    for(let k=0;k<steps;k++){c.fillStyle=hexA(WARN_HEX,0.85);c.font='10px Outfit, sans-serif';c.textAlign='center';c.fillText('b'+(n-1-k),tx+k*cw+cw/2,ty+36);}
    let ry=ty+92;
    for(let p=n-1;p>=0;p--){const levels=[];for(let k=0;k<steps;k++)levels.push((st[k]>>p)&1);drawWave(c,tx,ry,cw,levels,ACC,'Q'+p,14);ry+=30;}
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillText('Carga inicial:',30,ry+34);
    drawRegister(c,200,ry+16,n,W,ACC,46,'left',null,out[0]);
    rpanel(c,PX.x,PX.y,PX.w,180,'CONVERSIÓN PARALELO→SERIE');
    prow(c,PX.x,PX.y+52,PX.w,'Palabra cargada',binStr(W,n));
    prow(c,PX.x,PX.y+80,PX.w,'Salida serie',out.join(''),WARN_HEX);
    prow(c,PX.x,PX.y+108,PX.w,'Orden','MSB primero');
    prow(c,PX.x,PX.y+136,PX.w,'Round-trip SIPO',binStr(sipo(out,n),n),sipo(out,n)===W?OK_HEX:BAD_HEX);
    const by=PX.y+200;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,280);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,280);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('POR QUÉ PISO',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El PISO (74x165) hace lo inverso: toma datos en paralelo y los transmite por un solo cable. Es la transmisión serie (el lado emisor de UART/SPI) y sirve para leer muchas entradas —botones, sensores— con pocos pines. Un PISO emisor y un SIPO receptor forman un enlace serie completo: lo que sale del uno se reconstruye en el otro (round-trip = palabra original).',PX.x+14,by+48,PX.w-28,17);
  }else{
    const n=apCntN,rs=ringSeq(n),js=johnsonSeq(n);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Anillo vs Johnson',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Dos contadores hechos con un registro de desplazamiento realimentado. Cambian su periodo con el mismo hardware.',30,64);
    c.fillStyle=ACC;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('ANILLO (realimenta SOUT):  periodo n = '+n,60,120);
    c.fillStyle='#9fb0cf';c.font='13px Outfit, sans-serif';c.fillText(rs.map(v=>binStr(v,n)).join(' → '),60,146);
    c.fillStyle=VIO;c.font='bold 14px Outfit, sans-serif';c.fillText('JOHNSON (realimenta SOUT negado):  periodo 2n = '+(2*n),60,200);
    c.fillStyle='#9fb0cf';c.font='13px Outfit, sans-serif';wrapText(c,js.map(v=>binStr(v,n)).join(' → '),60,226,620,22);
    drawCounterRing(c,300,470,120,js,-1,n);
    rpanel(c,PX.x,PX.y,PX.w,180,'COMPARACIÓN');
    prow(c,PX.x,PX.y+52,PX.w,'Flip-flops (n)',String(n));
    prow(c,PX.x,PX.y+80,PX.w,'Anillo: periodo',String(n),OK_HEX);
    prow(c,PX.x,PX.y+108,PX.w,'Johnson: periodo',String(2*n),VIO);
    prow(c,PX.x,PX.y+136,PX.w,'Binario: periodo','2ⁿ = '+(1<<n));
    const by=PX.y+200;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,280);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,280);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('EL COMPROMISO',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Con n flip-flops: el contador binario da 2ⁿ estados pero necesita compuertas para decodificar cada uno; el anillo da sólo n estados pero cada salida ya es una fase lista para usar; el Johnson da 2n con la misma sencillez y sus estados cambian un bit a la vez (menos glitches). Se elige anillo/Johnson cuando importa más la decodificación limpia que el número de estados: relojes multifase, secuenciadores y generadores de patrones.',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawReto(c){
  const f=RETO_POOL[retoIdx],W=f.w,n=f.n;
  const recv=receive(W,n,retoDir,retoClocks);
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('RETO · Recupera la palabra por el enlace serie',30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  wrapText(c,'Un emisor PISO manda '+f.ctx+' por un solo cable, MSB primero. Configura el receptor SIPO: elige la DIRECCIÓN de desplazamiento y el NÚMERO DE FLANCOS para reconstruirla intacta.',30,64,660,18);
  // emisor
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';c.fillText('Emisor envía:',30,150);
  c.fillStyle=OK_HEX;c.font='bold 15px Outfit, sans-serif';c.fillText(binStr(W,n)+'  →  serie: '+bitsOf(W,n).join(' '),150,150);
  // receptor
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.fillText('Receptor SIPO reconstruye:',30,220);
  drawRegister(c,220,240,n,recv,retoChecked?(retoSolved?OK_HEX:BAD_HEX):WARN_HEX,52,retoDir==='left'?'left':'right',null,null);
  c.fillStyle=recv===W?OK_HEX:BAD_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Recuperada: '+binStr(recv,n)+(recv===W?'  ✓ = enviada':'  ✗ ≠ enviada'),150,360);
  // pista de errores
  c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
  c.fillText('Dirección: '+(retoDir==='left'?'← izquierda':'derecha →')+'    ·    Flancos: '+retoClocks+' (palabra = '+n+' bits)',150,392);
  rpanel(c,PX.x,PX.y,PX.w,150,'TU CONFIGURACIÓN');
  prow(c,PX.x,PX.y+52,PX.w,'Dirección',retoDir==='left'?'izquierda':'derecha',retoDir==='left'?OK_HEX:WARN_HEX);
  prow(c,PX.x,PX.y+86,PX.w,'Flancos',retoClocks+'  (objetivo '+n+')',retoClocks===n?OK_HEX:WARN_HEX);
  prow(c,PX.x,PX.y+116,PX.w,'Recuperada',binStr(recv,n),recv===W?OK_HEX:BAD_HEX);
  const by=PX.y+170;
  if(retoChecked){
    c.fillStyle='rgba(0,0,0,0.24)';c.fillRect(PX.x,by,PX.w,320);
    c.strokeStyle=retoSolved?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(PX.x,by,PX.w,320);
    c.fillStyle=retoSolved?OK_HEX:BAD_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='left';c.fillText(retoSolved?'✔ CORRECTO':'✗ REVISA',PX.x+14,by+26);
    c.font='bold 13px Outfit, sans-serif';
    c.fillStyle=retoOkDir?OK_HEX:BAD_HEX;c.fillText((retoOkDir?'✔':'✗')+' Dirección a la izquierda (MSB primero)',PX.x+14,by+54);
    c.fillStyle=retoOkClocks?OK_HEX:BAD_HEX;c.fillText((retoOkClocks?'✔':'✗')+' Exactamente n = '+n+' flancos',PX.x+14,by+78);
    c.fillStyle='#C9D3E2';c.font='12px Outfit, sans-serif';wrapText(c,retoExplain(f),PX.x+14,by+106,PX.w-28,17);
  }else{
    c.fillStyle='rgba(0,0,0,0.20)';c.fillRect(PX.x,by,PX.w,320);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,320);
    c.fillStyle=WARN_HEX;c.font='13px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Regla: el emisor manda MSB primero. Para conservar el orden, el receptor debe desplazar a la IZQUIERDA; y para cargar toda la palabra hacen falta EXACTAMENTE n = '+n+' flancos.',PX.x+14,by+26,PX.w-28,18);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    wrapText(c,'Errores clásicos: desplazar a la derecha invierte los bits; menos de n flancos truncan la palabra; más de n la desbordan.',PX.x+14,by+108,PX.w-28,18);
  }
}
function retoExplain(f){
  const W=f.w,n=f.n,recv=receive(W,n,retoDir,retoClocks);
  if(retoSolved)return 'Desplazando a la izquierda durante n = '+n+' flancos, cada bit enviado MSB primero cae en su posición: se recupera '+binStr(W,n)+' intacta. Así funciona un enlace serie (UART/SPI): PISO emisor + SIPO receptor con la misma dirección y el número justo de flancos.';
  let s='';
  if(!retoOkDir)s+='Con desplazamiento a la derecha el primer bit enviado acaba en el LSB, invirtiendo el orden ('+binStr(recv,n)+' en vez de '+binStr(W,n)+'). Usa desplazamiento a la izquierda. ';
  if(!retoOkClocks){
    if(retoClocks<n)s+='Con sólo '+retoClocks+' flancos la palabra queda truncada; faltan bits por entrar. Necesitas n = '+n+'. ';
    else s+='Con '+retoClocks+' flancos (más de n = '+n+') los primeros bits ya se salieron por el otro extremo. Usa exactamente n. ';
  }
  return s||'Revisa la dirección y el número de flancos.';
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='aplica')drawAplica(c);else if(mode==='reto')drawReto(c);else drawExplora(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='aplica')showToast('🧩 SIPO convierte serie→paralelo (recibe por un cable); PISO convierte paralelo→serie (transmite por un cable). Realimentados dan contadores de anillo (periodo n) y Johnson (periodo 2n).');
  else if(mode==='reto')showToast('🎯 El emisor manda MSB primero: desplaza a la IZQUIERDA y usa exactamente n flancos. A la derecha se invierten los bits; con menos flancos se trunca la palabra.');
  else showToast('🔧 Conduce el registro: cambia la dirección, la entrada serie (SIN) y pulsa el flanco de reloj. En anillo/Johnson observa cómo la realimentación crea un contador.');
}

// ===================== 7. ESCENA 3D: ENTRENADOR =====================
const bench=roundedBox(3.7,0.5,1.8,MAT.bench,0.05);bench.position.set(1.9,0.25,0.55);scene.add(bench);
bench.userData={title:'Banco de registros de desplazamiento',info:'Los LEDs muestran el contenido del registro; se desplaza un bit en cada flanco.'};
const pcb=roundedBox(2.4,0.08,1.2,MAT.pcb,0.03);pcb.position.set(1.95,0.54,0.5);scene.add(pcb);
pcb.userData={title:'Tarjeta del registro',info:'Cadena de flip-flops encadenados: la salida de uno alimenta la entrada del siguiente, con un reloj común.'};
addHoverLabel(pcb,'Entrenador de desplazamiento',ACC,new THREE.Vector3(1.95,1.35,0.5),1.7);
const chip=roundedBox(0.56,0.14,0.5,MAT.chip,0.02);chip.position.set(1.35,0.63,0.55);scene.add(chip);
const chCv=document.createElement('canvas');chCv.width=180;chCv.height=180;const chTex=new THREE.CanvasTexture(chCv);
const chFace=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.5),new THREE.MeshBasicMaterial({map:chTex,transparent:true}));
chFace.rotation.x=-Math.PI/2;chFace.position.set(1.35,0.705,0.55);scene.add(chFace);
chip.userData={title:'Registro de desplazamiento',info:'SIPO/PISO, anillo o Johnson según el modo.'};
function makeLED(x,z,color){const m=new THREE.Mesh(new THREE.SphereGeometry(0.045,16,16),std(color,0.4,0.1));m.position.set(x,0.62,z);m.material.emissive=new THREE.Color(color);m.material.emissiveIntensity=0.15;scene.add(m);return m;}
// LEDs de estado (8 bits, MSB a la izquierda) + LED de serial-in + LED de serial-out + LED de reloj
const stateLEDs=[];for(let i=0;i<8;i++)stateLEDs.push(makeLED(2.75-i*0.20,0.62,0x8AB4F8));
const sinLED=makeLED(2.95,0.90,0x7CD992);
const soutLED=makeLED(1.10,0.90,0xE9C46A);
const clkLED=makeLED(1.95,0.35,0xC08CF8);
addHoverLabel(stateLEDs[0],'contenido del registro',ACC,new THREE.Vector3(1.95,1.05,0.62),1.5);
sinLED.userData={title:'Entrada serie (SIN)',info:'El bit que entra en el próximo flanco.'};
soutLED.userData={title:'Salida serie (SOUT)',info:'El bit que sale del registro.'};
clkLED.userData={title:'Reloj (CLK)',info:'Un flanco por paso; todo el registro se desplaza a la vez.'};

function drawChip3D(state,n,kind){
  const c=chCv.getContext('2d');c.clearRect(0,0,180,180);
  c.fillStyle='rgba(20,23,27,0.92)';c.fillRect(0,0,180,180);
  c.strokeStyle=ACC;c.lineWidth=4;c.strokeRect(4,4,172,172);
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';c.fillText(kind,90,26);
  c.font='12px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText(n+' bits',90,48);
  c.font='bold 30px Outfit, sans-serif';c.fillStyle=OK_HEX;c.fillText(binStr(state,n),90,102);
  c.font='12px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText('= '+state,90,132);
  chTex.needsUpdate=true;
}
function hwCount(){const seq=curSeq();return Math.max(1,seq.length);}
function updateHW(){
  const seq=curSeq(),n=Math.max(1,curBits()),step=hwStep%Math.max(1,seq.length),state=seq[step]||0;
  const kind=(mode==='reto')?'ENLACE SERIE':(mode==='aplica'?(apTopic==='sipo'?'SIPO':apTopic==='piso'?'PISO':'ANILLO'):(expKind==='ring'?'ANILLO':expKind==='johnson'?'JOHNSON':'DESPLAZAM.'));
  stateLEDs.forEach((l,i)=>{const bit=n-1-i;const on=bit>=0?((state>>bit)&1):0;l.visible=i<n;l.material.emissiveIntensity=on?1.4:0.12;l.material.color.setHex(on?0x8AB4F8:0x2a3550);});
  const nextStep=(step+1)%Math.max(1,seq.length),nextState=seq[nextStep]||0;
  // serial-in ≈ MSB del próximo estado (aprox. didáctica), serial-out ≈ LSB del actual
  const sinBit=(nextState>>(n-1))&1, soutBit=state&1;
  sinLED.visible=true;sinLED.material.emissiveIntensity=sinBit?1.3:0.15;
  soutLED.visible=true;soutLED.material.emissiveIntensity=soutBit?1.3:0.15;
  clkLED.visible=true;clkLED.material.emissiveIntensity=(step%2)?1.3:0.2;
  drawChip3D(state,n,kind);
}

// ===================== 8. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Sistemas digitales (D3) · Lógica secuencial · Registros de desplazamiento</div>
  <h2>Registros de Desplazamiento · SIPO / PISO</h2>
  <p>Un <b>registro de desplazamiento</b> es una fila de flip-flops encadenados por un <b>reloj común</b>: en
  cada flanco cada bit avanza una posición. Entra un bit por un extremo (<b>serial-in</b>) y sale otro por el
  otro (<b>serial-out</b>). Desplazar a la <b>derecha</b> (entra por el MSB, sale por el LSB) equivale a
  <b>dividir entre 2</b>; a la <b>izquierda</b> (entra por el LSB, sale por el MSB), a <b>multiplicar por 2</b>.
  Con eso se hacen dos conversiones clave: <b>SIPO</b> (serie→paralelo) recibe una palabra bit a bit por un
  solo cable y la presenta completa tras n flancos; <b>PISO</b> (paralelo→serie) carga una palabra y la
  transmite por un cable. Juntos forman un <b>enlace serie</b> (la idea detrás de UART/SPI). Si el registro
  <b>realimenta</b> su salida serie a su entrada se convierte en un <b>contador de anillo</b> (one-hot,
  periodo n) o, con la salida <b>negada</b>, en un <b>contador Johnson</b> (periodo 2n).</p>
  <div class="formula">derecha: Q_i←Q_{i+1} (÷2) · izquierda: Q_i←Q_{i-1} (×2) · SIPO: n flancos MSB primero · anillo: periodo n · Johnson: periodo 2n</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Bit del registro / Qi</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Entrada serie (SIN) / correcto</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Salida serie (SOUT) / objetivo</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>Reloj / Johnson</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el desplazamiento lógico exacto a la derecha (Q_i←Q_{i+1}, entra por MSB, sale por LSB, ÷2 con SIN=0) y a la izquierda (Q_i←Q_{i-1}, entra por LSB, sale por MSB, ×2 mód 2ⁿ); la conversión SIPO (n flancos con la entrada serie MSB primero reconstruyen la palabra) y PISO (carga en paralelo y salida serie MSB primero), verificadas como round-trip; el enlace serie (dirección que debe coincidir y número de flancos = n, con truncamiento/inversión si no); y los contadores de anillo (one-hot, periodo n) y Johnson (periodo 2n), con sus secuencias exactas. Verificado numéricamente de forma exhaustiva (÷2/×2 n=2..8; SIPO/PISO y round-trip n=2..8; anillo periodo n y one-hot n=2..10; Johnson periodo 2n n=2..8).</div>
    <div class="fl no"><b>NO modela:</b> los tiempos reales (setup/hold, retardo reloj-a-Q, sesgo de reloj) ni la frecuencia máxima; los glitches, las carreras ni la metaestabilidad; el desplazamiento aritmético con extensión de signo, ni la rotación (aquí el bit que sale se pierde); la carga/salida paralela con habilitación, el registro universal 74x194 completo (modo hold/carga) ni los registros con realimentación lineal (LFSR); ni la implementación física (familias TTL/CMOS, 74x164/165/194/195, consumo, fan-out).</div>
  </div>
  <div class="src">Ref: Mano &amp; Ciletti, Diseño Digital · Wakerly, Digital Design · Floyd, Digital Fundamentals · TI 74x164/165/194 · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Registros · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_aplica">🧩 Aplica</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Reto del enlace serie</h4>
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
  explora:{nombre:'Explora',cam:[[4.8,2.9,7.0],[0.4,1.05,0.3]],mision:'Elige un bloque (registro con desplazamiento, contador de anillo o Johnson) y condúcelo: cambia la dirección y la entrada serie, y pulsa el flanco de reloj para desplazar.'},
  aplica:{nombre:'Aplica',cam:[[4.6,2.8,6.8],[0.4,1.05,0.3]],mision:'Recorre las conversiones serie/paralelo: SIPO (serie→paralelo) y PISO (paralelo→serie) con sus diagramas de tiempos, y compara los contadores de anillo y Johnson.'},
  reto:{nombre:'Reto',cam:[[4.7,2.7,6.9],[0.5,1.0,0.4]],mision:'Recupera una palabra por un enlace serie: elige la dirección de desplazamiento y el número exacto de flancos.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';let html='';
  if(mode==='explora'){
    html+=lbl('Bloque:')+`<button class="b sm ${expKind==='shift'?'on':''}" data-k="shift">Desplazamiento</button><button class="b sm ${expKind==='ring'?'on':''}" data-k="ring">Anillo</button><button class="b sm ${expKind==='johnson'?'on':''}" data-k="johnson">Johnson</button>`;
    if(expKind==='shift'){
      html+=lbl('Bits:')+[3,4,5,8].map(b=>`<button class="b sm ${b===shN?'on':''}" data-shn="${b}">${b}</button>`).join('');
      html+=lbl('Dirección:')+`<button class="b sm ${shDir==='right'?'on':''}" data-shd="right">derecha →</button><button class="b sm ${shDir==='left'?'on':''}" data-shd="left">← izquierda</button>`;
      html+=lbl('SIN:')+`<button class="b sm ${shSin?'on':''}" data-shsin="t">SIN:${shSin}</button>`;
      html+=lbl('Reloj:')+`<button class="b sm" data-shpulse="t">Flanco ▸</button><button class="b sm" data-shclr="t">Limpiar</button>`;
    }else if(expKind==='ring'){
      html+=lbl('Bits:')+[3,4,5,6].map(b=>`<button class="b sm ${b===ringN?'on':''}" data-rn="${b}">${b}</button>`).join('');
      html+=lbl('Reloj:')+`<button class="b sm" data-rpulse="t">Flanco ▸</button>`;
    }else{
      html+=lbl('Bits:')+[3,4,5].map(b=>`<button class="b sm ${b===johnN?'on':''}" data-jn="${b}">${b}</button>`).join('');
      html+=lbl('Reloj:')+`<button class="b sm" data-jpulse="t">Flanco ▸</button>`;
    }
    bar.innerHTML=html;
    bar.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expKind=b.dataset.k;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-shn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;shN=parseInt(b.dataset.shn,10);shState&=maskN(shN);hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-shd]').forEach(b=>b.onclick=()=>{if(autoRunning)return;shDir=b.dataset.shd;synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-shsin]').forEach(b=>b.onclick=()=>{if(autoRunning)return;shSin=shSin?0:1;synth.beep(760,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-shpulse]').forEach(b=>b.onclick=()=>{if(autoRunning)return;doShift();synth.beep(880,0.06,0.05);afterEdit();});
    bar.querySelectorAll('[data-shclr]').forEach(b=>b.onclick=()=>{if(autoRunning)return;shState=0;shLastOut='—';synth.beep(400,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;ringN=parseInt(b.dataset.rn,10);ringState=1;hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rpulse]').forEach(b=>b.onclick=()=>{if(autoRunning)return;ringState=ringNext(ringState,ringN);synth.beep(840,0.06,0.05);afterEdit();});
    bar.querySelectorAll('[data-jn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;johnN=parseInt(b.dataset.jn,10);johnState=0;hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-jpulse]').forEach(b=>b.onclick=()=>{if(autoRunning)return;johnState=johnsonNext(johnState,johnN);synth.beep(840,0.06,0.05);afterEdit();});
  }else if(mode==='aplica'){
    html+=lbl('Tema:')+`<button class="b sm ${apTopic==='sipo'?'on':''}" data-at="sipo">SIPO</button><button class="b sm ${apTopic==='piso'?'on':''}" data-at="piso">PISO</button><button class="b sm ${apTopic==='counters'?'on':''}" data-at="counters">Anillo/Johnson</button>`;
    if(apTopic==='counters'){
      html+=lbl('Bits:')+[3,4,5].map(b=>`<button class="b sm ${b===apCntN?'on':''}" data-acn="${b}">${b}</button>`).join('');
    }else{
      html+=lbl('Palabra:')+WORD_POOL.map((f,i)=>`<button class="b sm ${i===apWordIdx?'on':''}" data-aw="${i}">${f.n} bits</button>`).join('');
    }
    bar.innerHTML=html;
    bar.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apTopic=b.dataset.at;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-aw]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apWordIdx=parseInt(b.dataset.aw,10);hwStep=0;synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-acn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apCntN=parseInt(b.dataset.acn,10);hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
  }else{
    html+=lbl('Dirección:')+`<button class="b sm ${retoDir==='right'?'on':''}" data-rdir="right">derecha →</button><button class="b sm ${retoDir==='left'?'on':''}" data-rdir="left">← izquierda</button>`;
    html+=lbl('Flancos:')+`<button class="b sm" data-rclk="-1">−</button><button class="b sm on" data-nostep>${retoClocks}</button><button class="b sm" data-rclk="1">+</button>`;
    bar.innerHTML=html;
    bar.querySelectorAll('[data-rdir]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoDir=b.dataset.rdir;retoChecked=false;retoSolved=false;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rclk]').forEach(b=>b.onclick=()=>{if(autoRunning)return;const d=parseInt(b.dataset.rclk,10);retoClocks=Math.max(1,Math.min(2*RETO_POOL[retoIdx].n,retoClocks+d));retoChecked=false;retoSolved=false;synth.beep(640,0.05,0.04);afterEdit();});
  }
}
function doShift(){
  if(shDir==='right'){shLastOut=String(shiftRout(shState));shState=shiftR(shState,shN,shSin);}
  else{shLastOut=String(shiftLout(shState,shN));shState=shiftL(shState,shN,shSin);}
}
function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='reto'){box.style.display='none';return;}
  const f=RETO_POOL[retoIdx];box.style.display='block';
  box.innerHTML=`Objetivo: recuperar <b>${binStr(f.w,f.n)}</b> (${f.n} bits) enviada MSB primero. Elige la dirección y el número de flancos.`;
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
  if(mode==='reto'){seedReto();updateRetoSpec();afterEdit();solved=false;showToast('🔀 Nueva palabra: '+RETO_POOL[retoIdx].ctx+'.');}
  else if(mode==='aplica'){
    if(apTopic==='counters'){apCntN=[3,4,5][pickIdx(3,[3,4,5].indexOf(apCntN))];}
    else{apWordIdx=pickIdx(WORD_POOL.length,apWordIdx);}
    afterEdit();showToast('🔀 Nuevo caso.');
  }else{
    const ks=['shift','ring','johnson'];expKind=ks[pickIdx(3,ks.indexOf(expKind))];
    if(expKind==='shift'){shN=[3,4,5,8][pickIdx(4)];shState=Math.floor(Math.random()*(1<<shN));shDir=Math.random()<0.5?'right':'left';shSin=Math.random()<0.5?1:0;shLastOut='—';}
    else if(expKind==='ring'){ringN=[3,4,5,6][pickIdx(4)];ringState=1;}
    else{johnN=[3,4,5][pickIdx(3)];johnState=0;}
    afterEdit();showToast('🔀 Bloque: '+(expKind==='shift'?'registro de desplazamiento':expKind==='ring'?'contador de anillo':'contador Johnson')+'. Condúcelo.');
  }
  synth.beep(520,0.08,0.05);hwStep=0;
}

// ===================== 11. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele');
  if(mode==='reto'){
    const f=RETO_POOL[retoIdx],recv=receive(f.w,f.n,retoDir,retoClocks);
    t.innerHTML=teleRow('Palabra enviada',binStr(f.w,f.n))+
      teleRow('Dirección',retoDir==='left'?'izquierda':'derecha',retoDir==='left'?'good':'warn')+
      teleRow('Flancos',retoClocks+' / '+f.n,retoClocks===f.n?'good':'warn')+
      teleRow('Recuperada',binStr(recv,f.n),recv===f.w?'good':'warn')+
      teleRow('Estado',retoChecked?(retoSolved?'✔ correcto':'✗ revisa'):'configura y comprueba',(retoChecked&&retoSolved)?'good':'warn');
    return;
  }
  if(mode==='aplica'){
    if(apTopic==='sipo'){const W=WORD_POOL[apWordIdx].w,n=WORD_POOL[apWordIdx].n,r=sipo(bitsOf(W,n),n);
      t.innerHTML=teleRow('Conversión','SIPO (serie→paralelo)')+teleRow('Palabra',binStr(W,n))+teleRow('Flancos',String(n))+teleRow('Recuperada',binStr(r,n),r===W?'good':'warn');
    }else if(apTopic==='piso'){const W=WORD_POOL[apWordIdx].w,n=WORD_POOL[apWordIdx].n,out=pisoOut(W,n);
      t.innerHTML=teleRow('Conversión','PISO (paralelo→serie)')+teleRow('Palabra',binStr(W,n))+teleRow('Salida serie',out.join(''))+teleRow('Round-trip',binStr(sipo(out,n),n),sipo(out,n)===W?'good':'warn');
    }else{const n=apCntN;
      t.innerHTML=teleRow('Comparación','anillo vs Johnson')+teleRow('Flip-flops',String(n))+teleRow('Anillo: periodo',String(n),'good')+teleRow('Johnson: periodo',String(2*n),'good');
    }
    return;
  }
  if(expKind==='shift'){const sout=shDir==='right'?shiftRout(shState):shiftLout(shState,shN);
    t.innerHTML=teleRow('Bloque','Registro de '+shN+' bits')+teleRow('Estado',binStr(shState,shN)+' = '+shState)+teleRow('Dirección',shDir==='left'?'izquierda (×2)':'derecha (÷2)')+teleRow('SIN → SOUT',shSin+' → '+sout,'good')+teleRow('Último SOUT',shLastOut);
  }else if(expKind==='ring'){
    t.innerHTML=teleRow('Bloque','Contador de anillo')+teleRow('Bits',String(ringN))+teleRow('Estado',binStr(ringState,ringN),'good')+teleRow('Periodo',String(ringN))+teleRow('Código','one-hot');
  }else{
    t.innerHTML=teleRow('Bloque','Contador Johnson')+teleRow('Bits',String(johnN))+teleRow('Estado',binStr(johnState,johnN),'good')+teleRow('Periodo',String(2*johnN))+teleRow('Realimentación','SOUT negado');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='reto'){
    const f=RETO_POOL[retoIdx];
    html+=retoMsg||`<span class="mono">Enlace serie: el emisor manda ${binStr(f.w,f.n)} MSB primero. Elige desplazar a la izquierda y ${f.n} flancos para recuperarla. Comprueba.</span>`;
  }else if(mode==='aplica'){
    if(apTopic==='sipo'){const W=WORD_POOL[apWordIdx].w,n=WORD_POOL[apWordIdx].n;html+=`<span class="mono">SIPO: los ${n} bits de ${binStr(W,n)} entran en serie (MSB primero); tras ${n} flancos el registro los tiene en paralelo. Es la recepción serie (UART/SPI) y la expansión de salidas.</span>`;}
    else if(apTopic==='piso'){const W=WORD_POOL[apWordIdx].w,n=WORD_POOL[apWordIdx].n;html+=`<span class="mono">PISO: se carga ${binStr(W,n)} en paralelo y ${n} flancos la sacan por un cable (MSB primero). Es la transmisión serie y la lectura de muchas entradas con pocos pines.</span>`;}
    else{const n=apCntN;html+=`<span class="mono">Con ${n} flip-flops: anillo = ${n} estados (one-hot, sin decodificar); Johnson = ${2*n} estados (código tipo Gray). El binario daría ${1<<n} pero necesita decodificación.</span>`;}
  }else{
    if(expKind==='shift'){html+=`<span class="mono">Registro de ${shN} bits: cada flanco desplaza a la ${shDir==='left'?'izquierda (×2)':'derecha (÷2)'}. Entra SIN=${shSin} por un extremo y sale un bit por el otro. Pulsa "Flanco ▸".</span>`;}
    else if(expKind==='ring'){html+=`<span class="mono">Anillo de ${ringN} bits: un solo 1 circula por realimentación serial-out→serial-in. Periodo ${ringN}; cada salida es una fase lista para usar.</span>`;}
    else{html+=`<span class="mono">Johnson de ${johnN} bits: realimenta la salida serie NEGADA. Recorre ${2*johnN} estados con ${johnN} flip-flops, cambiando un bit por flanco.</span>`;}
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();updateHW();}

// ===================== 12. RETO =====================
function updateRetoSpec(){
  const f=RETO_POOL[retoIdx];
  el('retoSpec').innerHTML=`Recupera la palabra <b>${binStr(f.w,f.n)}</b> (${f.n} bits), enviada MSB primero por un enlace serie. Elige la <b>dirección</b> de desplazamiento y el <b>número de flancos</b>, y pulsa "Comprobar".`;
}
function checkReto(){
  const f=RETO_POOL[retoIdx];
  retoOkDir=(retoDir==='left');
  retoOkClocks=(retoClocks===f.n);
  retoSolved=retoOkDir&&retoOkClocks;retoChecked=true;solved=retoSolved;
  synth.beep(retoSolved?1046:220,retoSolved?0.14:0.15,0.06);
  retoMsg=`<span class="mono"><span class="${retoSolved?'ok':'dtc'}">${retoSolved?'✔ Correcto':'✗ Revisa'}</span> — ${retoExplain(f)}</span>`;
  refreshAll();
}

// ===================== 13. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'En un registro que desplaza a la DERECHA, ¿qué ocurre con el bit de entrada y con el valor?',
      opciones:[
        {t:'El bit de entrada entra por el MSB (Q_{n-1}) y el que estaba en el LSB (Q0) sale; con serial-in = 0 el valor se DIVIDE entre 2.',ok:true,why:'Correcto: desplazar a la derecha es Q_i←Q_{i+1}. El hueco del MSB lo llena el serial-in y el LSB se pierde por el serial-out; con SIN=0 equivale a ÷2 (descartando el resto).'},
        {t:'El bit entra por el LSB (Q0) y el valor se multiplica por 2.',ok:false,why:'Eso describe el desplazamiento a la IZQUIERDA (×2). A la derecha se entra por el MSB y se divide entre 2.'},
        {t:'Todos los bits se copian a sí mismos; el registro no cambia.',ok:false,why:'No: desplazar mueve cada bit una posición. Lo que no cambia el estado es el modo "hold" (sin flanco de desplazamiento).'},
        {t:'El bit que sale por el LSB vuelve a entrar por el MSB (rotación).',ok:false,why:'Eso sería una ROTACIÓN. En un registro de desplazamiento simple el bit que sale se pierde y entra el serial-in; la rotación es un caso especial con realimentación.'},
      ],
    },
    aplica:{
      pregunta:'¿Cuál es la diferencia esencial entre un registro SIPO y uno PISO?',
      opciones:[
        {t:'SIPO recibe los bits en serie (por un cable) y los presenta en paralelo; PISO carga la palabra en paralelo y la transmite en serie. Son inversos.',ok:true,why:'Correcto: SIPO = serie-in/paralelo-out (recepción), PISO = paralelo-in/serie-out (transmisión). Un PISO emisor y un SIPO receptor forman un enlace serie completo.'},
        {t:'SIPO cuenta hacia arriba y PISO cuenta hacia abajo.',ok:false,why:'Ninguno es un contador por sí mismo. Son conversores serie/paralelo; se vuelven contadores sólo si se realimenta la salida (anillo/Johnson).'},
        {t:'SIPO desplaza a la izquierda y PISO siempre a la derecha, sin más diferencia.',ok:false,why:'La dirección es una convención, no la diferencia esencial. Lo que los distingue es por dónde entran y salen los datos: serie vs paralelo.'},
        {t:'PISO necesita reloj y SIPO no.',ok:false,why:'Ambos son secuenciales y necesitan reloj: desplazan un bit por flanco. El PISO además tiene una carga paralela inicial.'},
      ],
    },
    reto:{
      pregunta:'Un contador de anillo y uno Johnson usan los mismos n flip-flops. ¿En qué se diferencian sus periodos?',
      opciones:[
        {t:'El anillo realimenta el serial-out tal cual y tiene periodo n (one-hot); el Johnson lo realimenta NEGADO y tiene periodo 2n.',ok:true,why:'Correcto: la inversión en la realimentación del Johnson hace que el registro se llene y se vacíe, duplicando la secuencia a 2n estados con el mismo hardware.'},
        {t:'Ambos tienen periodo 2ⁿ, como un contador binario.',ok:false,why:'No: un contador binario de n bits tiene 2ⁿ estados, pero necesita lógica para decodificarlos. El anillo tiene n y el Johnson 2n.'},
        {t:'El Johnson tiene periodo n y el anillo 2n.',ok:false,why:'Es al revés: el anillo (sin inversión) tiene periodo n; el Johnson (con inversión) lo duplica a 2n.'},
        {t:'Ambos tienen periodo n; la inversión no cambia el número de estados.',ok:false,why:'Sí lo cambia: invertir la realimentación hace que el patrón tarde 2n flancos en repetirse, no n.'},
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
    expKind='shift';shN=4;shState=0b0110;shDir='right';shSin=1;shLastOut='—';afterEdit();
    showToast('🔧 Registro de 4 bits. Desplazando a la derecha, entra SIN=1 por el MSB y sale el LSB. Con SIN=0 sería ÷2.');
    await sleep(3800);
    doShift();afterEdit();showToast('▸ Un flanco: los bits avanzaron una posición y salió un bit por el serial-out.');
    await sleep(3600);
    expKind='ring';ringN=4;ringState=1;afterEdit();
    showToast('💍 Contador de anillo: un solo 1 circula por realimentación. Periodo n = 4.');
    await sleep(4000);
    expKind='johnson';johnN=4;johnState=0;afterEdit();
    showToast('🔄 Contador Johnson: realimenta la salida NEGADA. Periodo 2n = 8, el doble con el mismo hardware.');
    await sleep(4000);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('aplica');
    apTopic='sipo';apWordIdx=0;afterEdit();
    showToast('🧩 SIPO: los bits entran en serie (MSB primero); tras 4 flancos la palabra está completa en paralelo.');
    await sleep(4400);
    apTopic='piso';apWordIdx=0;afterEdit();
    showToast('📤 PISO: se carga la palabra y 4 flancos la sacan por un cable. Es el inverso del SIPO.');
    await sleep(4400);
    apTopic='counters';apCntN=4;afterEdit();
    showToast('⚖️ Anillo (periodo 4) vs Johnson (periodo 8): la inversión en la realimentación duplica los estados.');
    await sleep(4200);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('reto');
    seedReto(0);updateRetoSpec();afterEdit();
    const f0=RETO_POOL[retoIdx];
    showToast('🎯 Reto: recuperar '+binStr(f0.w,f0.n)+'. Primero el error clásico: pocos flancos y dirección equivocada…');
    retoDir='right';retoClocks=Math.max(1,f0.n-1);afterEdit();await sleep(3400);
    checkReto();
    showToast('…a la derecha se invierten los bits y con '+(f0.n-1)+' flancos la palabra queda truncada. Corregimos.');
    await sleep(3800);
    retoDir='left';retoClocks=f0.n;afterEdit();
    showToast('✔ Izquierda y '+f0.n+' flancos: se recupera '+binStr(f0.w,f0.n)+' intacta. Comprobamos.');
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
  maskN, shiftR, shiftRout, shiftL, shiftLout, bitsOf, sipo, pisoOut, ringNext, johnsonNext, ringSeq, johnsonSeq, receive,
  // explora
  expKind:()=>expKind, setExpKind:k=>{expKind=k;afterEdit();},
  setShift:(dir,n,state,sin)=>{shDir=dir;shN=n;shState=state&maskN(n);if(sin!=null)shSin=sin?1:0;shLastOut='—';afterEdit();},
  pulseShift:()=>{doShift();afterEdit();},
  shiftState:()=>({dir:shDir,n:shN,state:shState,sin:shSin,sout:shDir==='right'?shiftRout(shState):shiftLout(shState,shN),lastOut:shLastOut}),
  setRing:n=>{ringN=n;ringState=1;afterEdit();},
  ringState:()=>({n:ringN,state:ringState,period:ringSeq(ringN).length,seq:ringSeq(ringN)}),
  pulseRing:()=>{ringState=ringNext(ringState,ringN);afterEdit();},
  setJohnson:n=>{johnN=n;johnState=0;afterEdit();},
  johnsonState:()=>({n:johnN,state:johnState,period:johnsonSeq(johnN).length,seq:johnsonSeq(johnN)}),
  pulseJohnson:()=>{johnState=johnsonNext(johnState,johnN);afterEdit();},
  // aplica
  apTopic:()=>apTopic, setApTopic:k=>{apTopic=k;afterEdit();},
  setApWord:i=>{apWordIdx=i;afterEdit();},
  sipoResult:()=>{const W=WORD_POOL[apWordIdx].w,n=WORD_POOL[apWordIdx].n,r=sipo(bitsOf(W,n),n);return{word:W,n,recovered:r,ok:r===W};},
  pisoResult:()=>{const W=WORD_POOL[apWordIdx].w,n=WORD_POOL[apWordIdx].n,out=pisoOut(W,n);return{word:W,n,out,roundtrip:sipo(out,n),ok:sipo(out,n)===W};},
  setApCntN:n=>{apCntN=n;afterEdit();},
  countersResult:()=>({n:apCntN,ringPeriod:ringSeq(apCntN).length,johnsonPeriod:johnsonSeq(apCntN).length}),
  // reto
  retoWord:()=>RETO_POOL[retoIdx].w, retoN:()=>RETO_POOL[retoIdx].n, retoIdx:()=>retoIdx, seedReto:i=>{seedReto(i);afterEdit();},
  retoDir:()=>retoDir, retoSetDir:v=>{retoDir=v;retoChecked=false;retoSolved=false;afterEdit();},
  retoClocks:()=>retoClocks, retoSetClocks:v=>{retoClocks=Math.max(1,Math.min(2*RETO_POOL[retoIdx].n,v));retoChecked=false;retoSolved=false;afterEdit();},
  retoSolveBuild:()=>{const f=RETO_POOL[retoIdx];retoDir='left';retoClocks=f.n;retoChecked=false;retoSolved=false;afterEdit();},
  checkReto:()=>checkReto(),
  retoReceived:()=>{const f=RETO_POOL[retoIdx];return receive(f.w,f.n,retoDir,retoClocks);},
  retoChecked:()=>retoChecked, retoOkDir:()=>retoOkDir, retoOkClocks:()=>retoOkClocks, retoSolved:()=>retoSolved,
  // quiz / general
  quizCorrectIndex:()=>{const q=QUIZ[mode];return q?q.opciones.findIndex(o=>o.ok):-1;},
  quizAnswer:i=>answer(i),
  newSignal:()=>newSignal(),
  solved:()=>solved,
};
