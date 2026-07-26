// Sumadores y comparadores binarios (D3 · digital). Acarreo y complemento a 2.
// Física (verificada node -e, 20/20 exhaustiva):
//   SUMADOR COMPLETO (full adder): S = a ⊕ b ⊕ cin ; Cout = a·b + cin·(a⊕b) (mayoría de a,b,cin).
//   SUMADOR DE N BITS (ripple-carry): cadena de N sumadores completos; el acarreo se propaga del bit i al i+1.
//     Suma sin signo A+B+Cin: resultado de N bits + acarreo de salida (Cout). (2048 casos n=4 verificados)
//   COMPLEMENTO A 2: el negativo de B es ¬B + 1. Por eso RESTAR es SUMAR el complemento a 2:
//     A − B = A + ¬B + 1  →  un restador es un sumador con B invertido y Cin=1. (exhaustivo 4-bit)
//   DESBORDAMIENTO con signo: ocurre si los operandos tienen el MISMO signo y el resultado difiere;
//     equivale a Cin_MSB ⊕ Cout_MSB (acarreo que entra al bit de signo ⊕ el que sale). (ambos métodos coinciden)
//   COMPARADOR de magnitud: cascada desde el MSB; la primera posición que difiere decide A>B o A<B; si todas
//     coinciden, A=B. Salidas mutuamente excluyentes (gt+eq+lt=1). IGUALDAD = AND de los XNOR bit a bit.
//   Ref: Mano & Ciletti, "Diseño Digital" · Wakerly, "Digital Design" · Patterson & Hennessy, "Computer Org."
//        · TI 74x83/74x283 (sumador 4-bit), 74x85 (comparador 4-bit) · verificación numérica propia.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.8,2.9,7.0],target:[0.4,1.05,0.3],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.44,minD:3.2,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. FÍSICA (VERIFICADA) =====================
function fullAdder(a,b,cin){a=a?1:0;b=b?1:0;cin=cin?1:0;const s=a^b^cin;const cout=(a&b)|(cin&(a^b));return{s,cout};}
function rippleAdd(A,B,cin,n){
  const bits=new Array(n), carries=new Array(n+1);carries[0]=cin?1:0;let c=cin?1:0;
  for(let i=0;i<n;i++){const r=fullAdder((A>>i)&1,(B>>i)&1,c);bits[i]=r.s;c=r.cout;carries[i+1]=c;}
  const val=bits.reduce((acc,b,i)=>acc+(b<<i),0);
  return{bits,carries,cout:c,val};
}
function toSigned(u,n){return (u&(1<<(n-1)))?u-(1<<n):u;}
function twosComp(u,n){return ((~u)+1)&((1<<n)-1);}
function invBits(u,n){return (~u)&((1<<n)-1);}
function overflowOf(A,B,cin,n){const r=rippleAdd(A,B,cin,n);return r.carries[n-1]^r.carries[n];}
function compareU(A,B,n){
  let gt=0,lt=0,firstDiff=-1;
  for(let i=n-1;i>=0;i--){const a=(A>>i)&1,b=(B>>i)&1;if(!gt&&!lt){if(a&&!b){gt=1;firstDiff=i;}else if(!a&&b){lt=1;firstDiff=i;}}}
  return{gt,eq:(!gt&&!lt)?1:0,lt,firstDiff};
}
function binStr(v,n){return (v&((1<<n)-1)).toString(2).padStart(n,'0');}

// ===================== 3. ESTADO =====================
let mode='explora';
// explora — conduces cada bloque en vivo
let expKind='add';                       // 'fa' | 'add' | 'cmp'
let faA=1, faB=1, faCin=0;               // sumador completo (1 bit)
let addN=4, addA=6, addB=5, addCin=0;    // sumador de N bits
let cmpN=4, cmpA=9, cmpB=6;              // comparador de N bits
// aplica
const APLICA_POOL=[                      // parejas para resta (A−B) e igualdad
  {n:4, A:12, B:5},
  {n:4, A:3,  B:7},
  {n:4, A:7,  B:7},
  {n:4, A:10, B:4},
];
const OVF_POOL=[                         // suma con signo; casos con y sin desbordamiento
  {n:4, A:6,  B:5},                      // +6 + +5 = +11 > +7 → desborda
  {n:4, A:12, B:11},                     // −4 + −5 = −9 < −8 → desborda
  {n:4, A:3,  B:2},                      // +3 + +2 = +5 → ok
  {n:4, A:12, B:5},                      // −4 + +5 = +1 → ok
];
let apTopic='sub';                       // 'sub' | 'ovf' | 'eq'
let apFnIdx=0, apOvfIdx=0;
// reto — construir un restador A−B configurando ¬B y Cin
const RETO_POOL=[
  {n:4, A:12, B:5,  ctx:'Resta 12 − 5 con un sumador de 4 bits'},
  {n:4, A:9,  B:9,  ctx:'Resta 9 − 9 (debe dar 0 exacto)'},
  {n:4, A:3,  B:7,  ctx:'Resta 3 − 7 (resultado negativo, −4)'},
  {n:4, A:15, B:6,  ctx:'Resta 15 − 6'},
  {n:4, A:8,  B:1,  ctx:'Resta 8 − 1'},
  {n:4, A:10, B:10, ctx:'Resta 10 − 10 (cero)'},
];
let retoIdx=0, retoOpB=[], retoCin=0, retoChecked=false, retoOkData=false, retoOkEnable=false, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false, QUIZ={};
let hwStep=0, hwT=0;

function pickIdx(n,ex){let v=Math.floor(Math.random()*n);if(n>1)while(v===ex)v=Math.floor(Math.random()*n);return v;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
function seedReto(idx){
  retoIdx=(idx==null)?pickIdx(RETO_POOL.length,retoIdx):idx;
  const f=RETO_POOL[retoIdx],n=f.n;
  retoOpB=new Array(n).fill(0); retoCin=0;
  retoChecked=false; retoOkData=false; retoOkEnable=false; retoSolved=false; retoMsg='';
}
seedReto(0);

// dispositivo activo (según el modo) que refleja el entrenador 3D
function curDevice(){
  if(mode==='reto'){const f=RETO_POOL[retoIdx];const opBval=retoOpB.reduce((a,b,i)=>a+((b?1:0)<<i),0);return{kind:'add',n:f.n,A:f.A,B:opBval,cin:retoCin};}
  if(mode==='aplica'){
    if(apTopic==='eq'){const f=APLICA_POOL[apFnIdx];return{kind:'cmp',n:f.n,A:f.A,B:f.B};}
    if(apTopic==='ovf'){const f=OVF_POOL[apOvfIdx];return{kind:'add',n:f.n,A:f.A,B:f.B,cin:0};}
    const f=APLICA_POOL[apFnIdx];return{kind:'add',n:f.n,A:f.A,B:invBits(f.B,f.n),cin:1};
  }
  if(expKind==='fa')return{kind:'fa',n:1,a:faA,b:faB,cin:faCin};
  if(expKind==='cmp')return{kind:'cmp',n:cmpN,A:cmpA,B:cmpB};
  return{kind:'add',n:addN,A:addA,B:addB,cin:addCin};
}

// ===================== 4. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
const MAT={bench:brush(0x2b2f34),frame:brush(0x22262c),leg:brush(0x14161b),pcb:std(0x123322,0.7,0.15),chip:std(0x14171b,0.5,0.3)};
const ACC='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A';

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
frame.userData={title:'Sumadores y comparadores binarios',info:'Cadena de acarreo, complemento a 2 y comparación · toca para inspeccionar'};
addHoverLabel(frame,'Aritmética binaria',ACC,new THREE.Vector3(0,3.5,0.1).add(boardG.position),2.2);

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

// ---- símbolo del sumador completo ----
function drawFASym(c,x,y,w,h,a,b,cin){
  const r=fullAdder(a,b,cin);
  c.strokeStyle=hexA(WARN_HEX,0.9);c.fillStyle=hexA(WARN_HEX,0.07);c.lineWidth=2.4;rr(c,x,y,w,h,10);c.fill();c.stroke();
  c.fillStyle=WARN_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='center';c.fillText('SUMADOR',x+w/2,y+h/2-6);c.font='bold 13px Outfit, sans-serif';c.fillText('COMPLETO',x+w/2,y+h/2+12);
  const ins=[['a',a],['b',b],['cin',cin]];
  ins.forEach((p,i)=>{const yy=y+h*(i+0.5)/3;c.strokeStyle=p[1]?OK_HEX:hexA('#9fb0cf',0.4);c.lineWidth=p[1]?3:1.4;c.beginPath();c.moveTo(x-54,yy);c.lineTo(x,yy);c.stroke();
    c.fillStyle=p[1]?OK_HEX:'#4a525e';c.beginPath();c.arc(x-64,yy,6,0,7);c.fill();
    c.fillStyle='#C9D3E2';c.font='bold 13px Outfit, sans-serif';c.textAlign='right';c.fillText(p[0]+'='+p[1],x-76,yy+4);});
  const yS=y+h*0.64;c.strokeStyle=r.s?OK_HEX:'#4a525e';c.lineWidth=3;c.beginPath();c.moveTo(x+w,yS);c.lineTo(x+w+50,yS);c.stroke();
  c.fillStyle=r.s?OK_HEX:'#4a525e';c.font='bold 20px Outfit, sans-serif';c.textAlign='left';c.fillText('S = '+r.s,x+w+58,yS+7);
  const yC=y+h*0.30;c.strokeStyle=r.cout?WARN_HEX:'#4a525e';c.lineWidth=3;c.beginPath();c.moveTo(x+w,yC);c.lineTo(x+w+50,yC);c.stroke();
  c.fillStyle=r.cout?WARN_HEX:'#4a525e';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';c.fillText('Cout = '+r.cout,x+w+58,yC+6);
  return r;
}

// ---- tabla del sumador completo (8 filas) ----
function drawFATruth(c,x0,y0,hot){
  const cols=['a','b','cin','S','Cout'],cw=[30,30,38,32,44],W=cw.reduce((a,b)=>a+b,0),rh=26;
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';c.fillText('TABLA DE VERDAD',x0+W/2,y0-10);
  let cx=x0;c.font='bold 12px Outfit, sans-serif';
  for(let i=0;i<cols.length;i++){c.fillStyle=i>=3?ACC:'#9fb0cf';c.fillText(cols[i],cx+cw[i]/2,y0+rh*0.7);cx+=cw[i];}
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.beginPath();c.moveTo(x0,y0+rh*0.95);c.lineTo(x0+W,y0+rh*0.95);c.stroke();
  for(let s=0;s<8;s++){const a=(s>>2)&1,b=(s>>1)&1,ci=s&1,r=fullAdder(a,b,ci),row=[a,b,ci,r.s,r.cout];
    const yy=y0+rh*(s+1);if(s===hot){c.fillStyle=hexA(ACC,0.16);c.fillRect(x0,yy+rh*0.12,W,rh);}
    cx=x0;
    for(let i=0;i<5;i++){const v=row[i];c.fillStyle=(i>=3)?(v?OK_HEX:'#4a525e'):(v?'#C9D3E2':'#5a6472');c.font=(i>=3?'bold ':'')+'13px Outfit, sans-serif';c.textAlign='center';c.fillText(v,cx+cw[i]/2,yy+rh*0.72);cx+=cw[i];}}
  return {W,H:rh*9};
}

// ---- cadena ripple-carry de N bits ----
function drawRipple(c,A,B,cin,n,x0,y0){
  const r=rippleAdd(A,B,cin,n),cw=100,h=92,gap=10;
  for(let i=0;i<n;i++){
    const col=n-1-i, x=x0+col*(cw+gap);
    c.strokeStyle=hexA(ACC,0.75);c.fillStyle=hexA(ACC,0.06);c.lineWidth=2;rr(c,x,y0,cw,h,8);c.fill();c.stroke();
    c.fillStyle='#9fb0cf';c.font='bold 11px Outfit, sans-serif';c.textAlign='center';c.fillText('FA'+i,x+cw/2,y0+15);
    const ai=(A>>i)&1, bi=(B>>i)&1, s=r.bits[i];
    c.font='bold 14px Outfit, sans-serif';
    c.fillStyle=ai?OK_HEX:'#5a6472';c.fillText('A'+i+'='+ai,x+cw/2,y0+40);
    c.fillStyle=bi?OK_HEX:'#5a6472';c.fillText('B'+i+'='+bi,x+cw/2,y0+58);
    c.fillStyle=s?OK_HEX:'#4a525e';c.font='bold 22px Outfit, sans-serif';c.fillText('S'+i+'='+s,x+cw/2,y0+h+34);
    // acarreo de entrada (borde derecho de la celda)
    const cinV=r.carries[i];
    c.fillStyle=cinV?WARN_HEX:'#33342a';c.beginPath();c.arc(x+cw+gap/2,y0+h/2,8,0,7);c.fill();
    c.fillStyle=cinV?'#0c1016':'#7a7a66';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.fillText(cinV,x+cw+gap/2,y0+h/2+4);
  }
  // Cout final (borde izquierdo del MSB)
  const lx=x0;
  c.fillStyle=r.cout?WARN_HEX:'#33342a';c.beginPath();c.arc(lx-gap/2,y0+h/2,8,0,7);c.fill();
  c.fillStyle=r.cout?'#0c1016':'#7a7a66';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.fillText(r.cout,lx-gap/2,y0+h/2+4);
  c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';c.fillText('Cout',lx-gap/2,y0+h/2-16);
  c.fillStyle=cin?WARN_HEX:'#5a6472';c.fillText('Cin='+cin,x0+n*(cw+gap)-gap/2,y0+h/2-16);
  return r;
}

// ===================== 6. VISTAS POR MODO =====================
function drawExplora(c){
  if(expKind==='fa'){
    const r=fullAdder(faA,faB,faCin);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Sumador completo (1 bit)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Suma tres bits (a, b y el acarreo de entrada cin) y produce la suma S y el acarreo de salida Cout.',30,64);
    drawFASym(c,200,170,150,220,faA,faB,faCin);
    drawFATruth(c,470,150,faA*4+faB*2+faCin);
    rpanel(c,PX.x,PX.y,PX.w,180,'COMPORTAMIENTO');
    prow(c,PX.x,PX.y+56,PX.w,'Entradas (a b cin)',faA+' '+faB+' '+faCin);
    prow(c,PX.x,PX.y+86,PX.w,'Suma  S = a⊕b⊕cin',String(r.s),r.s?OK_HEX:'#C9D3E2');
    prow(c,PX.x,PX.y+116,PX.w,'Acarreo  Cout',String(r.cout),r.cout?WARN_HEX:'#C9D3E2');
    prow(c,PX.x,PX.y+146,PX.w,'Total (a+b+cin)',String(faA+faB+faCin));
    const by=PX.y+200;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,280);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,280);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('LA CELDA BÁSICA',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El sumador completo es el ladrillo de toda la aritmética. La suma S es 1 cuando hay un número impar de entradas en 1 (a⊕b⊕cin). El acarreo Cout es 1 cuando al menos DOS de las tres entradas valen 1 (es la función mayoría): Cout = a·b + cin·(a⊕b). Encadenando N de estas celdas —la Cout de una es la Cin de la siguiente— se suman números de N bits.',PX.x+14,by+48,PX.w-28,17);
  }else if(expKind==='add'){
    const N=addN,r=rippleAdd(addA,addB,addCin,N);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Sumador de '+N+' bits (ripple-carry)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('N sumadores completos en cadena: el acarreo se propaga del bit menos significativo hacia el más significativo.',30,64);
    drawRipple(c,addA,addB,addCin,N,80,150);
    rpanel(c,PX.x,PX.y,PX.w,210,'RESULTADO');
    prow(c,PX.x,PX.y+52,PX.w,'A (sin signo)',addA+' = '+binStr(addA,N));
    prow(c,PX.x,PX.y+80,PX.w,'B (sin signo)',addB+' = '+binStr(addB,N));
    prow(c,PX.x,PX.y+108,PX.w,'Cin',String(addCin),addCin?WARN_HEX:'#C9D3E2');
    prow(c,PX.x,PX.y+136,PX.w,'Suma (N bits)',r.val+' = '+binStr(r.val,N),OK_HEX);
    prow(c,PX.x,PX.y+164,PX.w,'Cout (acarreo)',String(r.cout),r.cout?WARN_HEX:'#C9D3E2');
    prow(c,PX.x,PX.y+192,PX.w,'A+B+Cin real',String(addA+addB+addCin),(addA+addB+addCin)>((1<<N)-1)?WARN_HEX:'#C9D3E2');
    const by=PX.y+230;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,260);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,260);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('DOS LECTURAS DEL MISMO RESULTADO',PX.x+14,by+24);
    c.fillStyle=ACC;c.font='bold 13px Outfit, sans-serif';c.fillText('Sin signo: '+r.val+(r.cout?'  (+ Cout: '+(r.val+(1<<N))+')':''),PX.x+14,by+50);
    c.fillStyle=WARN_HEX;c.fillText('Con signo (compl. a 2): '+toSigned(r.val,N),PX.x+14,by+72);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'Los MISMOS bits se interpretan de dos formas. Sin signo, el acarreo de salida Cout indica que el resultado no cabe en N bits. Con signo (complemento a 2), el bit más alto es el signo y el rango es −'+(1<<(N-1))+' a +'+((1<<(N-1))-1)+'. Enciende Cin para ver cómo cambia el bit menos significativo.',PX.x+14,by+96,PX.w-28,17);
  }else{
    const N=cmpN,r=compareU(cmpA,cmpB,N);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('EXPLORA · Comparador de '+N+' bits',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Compara dos números bit a bit desde el MÁS significativo: la primera posición que difiere decide el resultado.',30,64);
    const xEnd=drawNumRow(c,120,150,'A = '+cmpA,cmpA,N,ACC,40);
    drawNumRow(c,120,210,'B = '+cmpB,cmpB,N,'#C08CF8',40);
    // resaltar la primera posición que difiere
    if(r.firstDiff>=0){const k=N-1-r.firstDiff;const bx=120+k*40;c.strokeStyle=BAD_HEX;c.lineWidth=2.5;c.strokeRect(bx-2,148,39,124);
      c.fillStyle=BAD_HEX;c.font='11px Outfit, sans-serif';c.textAlign='center';c.fillText('1ª diferencia',bx+17,290);}
    // tres salidas
    const outs=[['A > B',r.gt,OK_HEX],['A = B',r.eq,ACC],['A < B',r.lt,BAD_HEX]];
    outs.forEach((o,i)=>{const oy=340+i*46;const on=o[1];
      c.strokeStyle=on?o[2]:hexA('#9fb0cf',0.3);c.fillStyle=on?hexA(o[2],0.18):'rgba(0,0,0,0.15)';c.lineWidth=on?2.4:1;rr(c,120,oy,180,38,8);c.fill();c.stroke();
      c.fillStyle=on?o[2]:'#5a6472';c.font='bold 17px Outfit, sans-serif';c.textAlign='center';c.fillText(o[0]+'  = '+o[1],210,oy+25);});
    rpanel(c,PX.x,PX.y,PX.w,170,'RESULTADO');
    prow(c,PX.x,PX.y+52,PX.w,'A',cmpA+' = '+binStr(cmpA,N));
    prow(c,PX.x,PX.y+80,PX.w,'B',cmpB+' = '+binStr(cmpB,N));
    prow(c,PX.x,PX.y+108,PX.w,'Veredicto',r.gt?'A > B':(r.lt?'A < B':'A = B'),r.gt?OK_HEX:(r.lt?BAD_HEX:ACC));
    prow(c,PX.x,PX.y+136,PX.w,'Salidas activas',String(r.gt+r.eq+r.lt)+' (siempre 1)');
    const by=PX.y+190;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,300);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,300);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('CÓMO DECIDE',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El comparador recorre los bits del más significativo (MSB) al menos significativo. Mientras los bits coincidan, sigue mirando. En la PRIMERA posición donde difieren, gana el que tenga 1 ahí: si A tiene 1 y B tiene 0, A>B; al revés, A<B. Si nunca difieren, A=B. Sus tres salidas (>, =, <) son mutuamente excluyentes: exactamente una vale 1. La igualdad se puede construir como la AND de los XNOR de cada par de bits (lo verás en Aplica).',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawAplica(c){
  if(apTopic==='sub'){
    const f=APLICA_POOL[apFnIdx],n=f.n,nb=invBits(f.B,n),r=rippleAdd(f.A,nb,1,n);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Restar sumando (complemento a 2)',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Objetivo: '+f.A+' − '+f.B+'.  La resta se hace con un sumador:  A − B = A + ¬B + 1.',30,64);
    drawNumRow(c,150,140,'A = '+f.A,f.A,n,ACC,40);
    drawNumRow(c,150,190,'B = '+f.B,f.B,n,'#C08CF8',40);
    drawNumRow(c,150,240,'¬B (invertir)',nb,n,WARN_HEX,40);
    c.fillStyle=WARN_HEX;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('+ Cin = 1',150,300);
    c.strokeStyle=hexA('#9fb0cf',0.4);c.lineWidth=1;c.beginPath();c.moveTo(150,315);c.lineTo(150+n*40,315);c.stroke();
    drawNumRow(c,150,330,'Suma =',r.val,n,OK_HEX,40);
    c.fillStyle=r.cout?WARN_HEX:'#5a6472';c.font='12px Outfit, sans-serif';c.fillText('(Cout descartado = '+r.cout+')',150,400);
    const correct=(r.val===((f.A-f.B)&((1<<n)-1)));
    rpanel(c,PX.x,PX.y,PX.w,180,'VERIFICACIÓN');
    prow(c,PX.x,PX.y+52,PX.w,'¬B (compl. a 1)',binStr(nb,n));
    prow(c,PX.x,PX.y+80,PX.w,'A + ¬B + 1',binStr(r.val,n)+' = '+r.val);
    prow(c,PX.x,PX.y+108,PX.w,'Interpretado con signo',String(toSigned(r.val,n)),OK_HEX);
    prow(c,PX.x,PX.y+136,PX.w,'A − B esperado',String(f.A-f.B),correct?OK_HEX:BAD_HEX);
    prow(c,PX.x,PX.y+164,PX.w,'¿Coincide?',correct?'✔ sí':'✗ no',correct?OK_HEX:BAD_HEX);
    const by=PX.y+200;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,280);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,280);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('POR QUÉ FUNCIONA',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'En complemento a 2, el negativo de B es ¬B + 1. Por eso restar es sumar el negativo: A − B = A + (¬B + 1). El "+1" no cuesta una compuerta extra: se inyecta como acarreo inicial Cin = 1 del sumador. Así, el MISMO circuito suma y resta sólo con invertir B y poner Cin=1. Es exactamente lo que harás en el Reto.',PX.x+14,by+48,PX.w-28,17);
  }else if(apTopic==='ovf'){
    const f=OVF_POOL[apOvfIdx],n=f.n,r=rippleAdd(f.A,f.B,0,n);
    const cinMsb=r.carries[n-1],coutMsb=r.carries[n],ovfCarry=cinMsb^coutMsb;
    const sA=(f.A>>(n-1))&1,sB=(f.B>>(n-1))&1,sS=(r.val>>(n-1))&1,ovfSign=(sA===sB&&sS!==sA)?1:0;
    const trueSum=toSigned(f.A,n)+toSigned(f.B,n);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Desbordamiento con signo',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Suma con signo '+toSigned(f.A,n)+' + '+toSigned(f.B,n)+'.  El desbordamiento se detecta de dos formas equivalentes.',30,64);
    drawNumRow(c,150,140,'A = '+toSigned(f.A,n),f.A,n,ACC,40);
    drawNumRow(c,150,190,'B = '+toSigned(f.B,n),f.B,n,'#C08CF8',40);
    c.strokeStyle=hexA('#9fb0cf',0.4);c.lineWidth=1;c.beginPath();c.moveTo(150,238);c.lineTo(150+n*40,238);c.stroke();
    drawNumRow(c,150,250,'Suma =',r.val,n,ovfSign?BAD_HEX:OK_HEX,40);
    c.fillStyle=ovfSign?BAD_HEX:OK_HEX;c.font='bold 15px Outfit, sans-serif';c.textAlign='left';
    c.fillText('Resultado con signo: '+toSigned(r.val,n)+(ovfSign?'  ✗ (debía ser '+trueSum+')':'  ✔'),150,320);
    // dos métodos
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.fillText('MÉTODO 1 · signos:',150,370);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';c.fillText('signo(A)=signo(B)='+sA+' y signo(S)='+sS+'  →  '+(ovfSign?'DESBORDA':'ok'),150,392);
    c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.fillText('MÉTODO 2 · acarreos:',150,424);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';c.fillText('Cin_MSB('+cinMsb+') ⊕ Cout_MSB('+coutMsb+') = '+ovfCarry+'  →  '+(ovfCarry?'DESBORDA':'ok'),150,446);
    rpanel(c,PX.x,PX.y,PX.w,180,'DIAGNÓSTICO');
    prow(c,PX.x,PX.y+52,PX.w,'Suma real (con signo)',String(trueSum));
    prow(c,PX.x,PX.y+80,PX.w,'Rango N bits','−'+(1<<(n-1))+' a +'+((1<<(n-1))-1));
    prow(c,PX.x,PX.y+108,PX.w,'Método signos',ovfSign?'desborda':'ok',ovfSign?BAD_HEX:OK_HEX);
    prow(c,PX.x,PX.y+136,PX.w,'Método acarreos',ovfCarry?'desborda':'ok',ovfCarry?BAD_HEX:OK_HEX);
    prow(c,PX.x,PX.y+164,PX.w,'¿Coinciden?',ovfSign===ovfCarry?'✔ sí':'✗ no',ovfSign===ovfCarry?OK_HEX:BAD_HEX);
    const by=PX.y+200;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,280);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,280);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('OJO: DESBORDAMIENTO ≠ ACARREO',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El acarreo de salida (Cout) importa en aritmética SIN signo. El desbordamiento importa en aritmética CON signo: ocurre cuando dos operandos del mismo signo dan un resultado del signo contrario (imposible), y el número real no cabe en el rango. Los dos métodos son equivalentes: mirar los signos, o comparar el acarreo que ENTRA al bit de signo con el que SALE. Si son distintos, hay desbordamiento.',PX.x+14,by+48,PX.w-28,17);
  }else{
    const f=APLICA_POOL[apFnIdx],n=f.n;
    let eq=1;const xnor=[];for(let i=0;i<n;i++){const x=(((f.A>>i)&1)===((f.B>>i)&1))?1:0;xnor[i]=x;eq&=x;}
    const cmp=compareU(f.A,f.B,n);
    c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('APLICA · Igualdad = AND de XNOR',30,42);
    c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
    c.fillText('Dos números son iguales si cada par de bits coincide. "Bits iguales" es un XNOR; la AND de todos da A = B.',30,64);
    drawNumRow(c,150,140,'A = '+f.A,f.A,n,ACC,40);
    drawNumRow(c,150,190,'B = '+f.B,f.B,n,'#C08CF8',40);
    // fila XNOR
    c.fillStyle='#9fb0cf';c.font='bold 14px Outfit, sans-serif';c.textAlign='right';c.fillText('XNOR',138,254);
    for(let k=0;k<n;k++){const i=n-1-k;const bx=150+k*40;const x=xnor[i];
      c.strokeStyle=x?OK_HEX:BAD_HEX;c.lineWidth=2;rr(c,bx,240,35,29,4);c.stroke();
      c.fillStyle=x?OK_HEX:BAD_HEX;c.font='bold 17px Outfit, sans-serif';c.textAlign='center';c.fillText(x,bx+17,262);}
    // AND
    c.fillStyle='#C7D6F5';c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.fillText('AND de todos los XNOR  →',150,320);
    c.fillStyle=eq?OK_HEX:BAD_HEX;c.font='bold 22px Outfit, sans-serif';c.fillText('A = B es '+eq,150,354);
    rpanel(c,PX.x,PX.y,PX.w,160,'COMPARADOR COMPLETO');
    prow(c,PX.x,PX.y+52,PX.w,'A vs B',f.A+' vs '+f.B);
    prow(c,PX.x,PX.y+80,PX.w,'Igualdad (AND XNOR)',String(eq),eq?OK_HEX:'#C9D3E2');
    prow(c,PX.x,PX.y+108,PX.w,'A > B',String(cmp.gt),cmp.gt?OK_HEX:'#C9D3E2');
    prow(c,PX.x,PX.y+136,PX.w,'A < B',String(cmp.lt),cmp.lt?BAD_HEX:'#C9D3E2');
    const by=PX.y+180;
    c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,300);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,300);
    c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('DE LA IGUALDAD A LA MAGNITUD',PX.x+14,by+24);
    c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
    wrapText(c,'El XNOR vale 1 cuando sus dos entradas son iguales (es el complemento del XOR). Si TODOS los pares de bits son iguales, la AND vale 1 y A = B. Para saber CUÁL es mayor no basta la igualdad: se compara desde el MSB y en la primera diferencia gana el que tenga 1. El circuito comercial 74x85 hace exactamente esto y se puede encadenar para más bits.',PX.x+14,by+48,PX.w-28,17);
  }
}

function drawReto(c){
  const f=RETO_POOL[retoIdx],n=f.n,target=invBits(f.B,n);
  const opBval=retoOpB.reduce((a,b,i)=>a+((b?1:0)<<i),0);
  const r=rippleAdd(f.A,opBval,retoCin,n);
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';c.fillText('RETO · Construye un restador',30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  wrapText(c,'Calcula '+f.A+' − '+f.B+' con un SUMADOR: invierte B (¬B, complemento a 1) en los bits de abajo y activa Cin=1 (el +1). '+f.ctx+'.',30,64,660,18);
  drawNumRow(c,170,130,'A = '+f.A,f.A,n,ACC,42);
  drawNumRow(c,170,180,'B = '+f.B,f.B,n,'#C08CF8',42);
  // fila que el usuario configura (¬B)
  c.fillStyle='#9fb0cf';c.font='bold 14px Outfit, sans-serif';c.textAlign='right';c.fillText('tu ¬B',158,254);
  for(let k=0;k<n;k++){const i=n-1-k;const bx=170+k*42;const b=retoOpB[i]?1:0;const good=(b===((target>>i)&1));
    c.strokeStyle=retoChecked?(good?OK_HEX:BAD_HEX):hexA(WARN_HEX,0.6);c.lineWidth=2;rr(c,bx,240,37,29,4);c.stroke();
    c.fillStyle=b?WARN_HEX:'#4a525e';c.font='bold 17px Outfit, sans-serif';c.textAlign='center';c.fillText(b,bx+18,262);}
  c.fillStyle=retoCin?WARN_HEX:BAD_HEX;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('+ Cin = '+retoCin,170,308);
  c.strokeStyle=hexA('#9fb0cf',0.4);c.lineWidth=1;c.beginPath();c.moveTo(170,320);c.lineTo(170+n*42,320);c.stroke();
  drawNumRow(c,170,332,'Suma =',r.val,n,OK_HEX,42);
  c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';c.textAlign='left';c.fillText('con signo: '+toSigned(r.val,n)+'   (objetivo: '+(f.A-f.B)+')',170,400);
  rpanel(c,PX.x,PX.y,PX.w,150,'TU CONFIGURACIÓN');
  const nGood=retoOpB.reduce((a,b,i)=>a+(((b?1:0)===((target>>i)&1))?1:0),0);
  prow(c,PX.x,PX.y+56,PX.w,'Bits de ¬B correctos',nGood+' / '+n,nGood===n?OK_HEX:WARN_HEX);
  prow(c,PX.x,PX.y+86,PX.w,'Acarreo inicial (Cin)',String(retoCin),retoCin?OK_HEX:BAD_HEX);
  prow(c,PX.x,PX.y+116,PX.w,'Tu resultado (con signo)',String(toSigned(r.val,n)),(toSigned(r.val,n)===(f.A-f.B))?OK_HEX:'#C9D3E2');
  const by=PX.y+170;
  if(retoChecked){
    c.fillStyle='rgba(0,0,0,0.24)';c.fillRect(PX.x,by,PX.w,320);
    c.strokeStyle=retoSolved?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(PX.x,by,PX.w,320);
    c.fillStyle=retoSolved?OK_HEX:BAD_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='left';c.fillText(retoSolved?'✔ CORRECTO':'✗ REVISA',PX.x+14,by+26);
    c.font='bold 13px Outfit, sans-serif';
    c.fillStyle=retoOkData?OK_HEX:BAD_HEX;c.fillText((retoOkData?'✔':'✗')+' B invertido bit a bit (¬B)',PX.x+14,by+54);
    c.fillStyle=retoOkEnable?OK_HEX:BAD_HEX;c.fillText((retoOkEnable?'✔':'✗')+' Acarreo inicial Cin = 1',PX.x+14,by+78);
    c.fillStyle='#C9D3E2';c.font='12px Outfit, sans-serif';wrapText(c,retoExplain(f,n),PX.x+14,by+106,PX.w-28,17);
  }else{
    c.fillStyle='rgba(0,0,0,0.20)';c.fillRect(PX.x,by,PX.w,320);c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,320);
    c.fillStyle=WARN_HEX;c.font='13px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Regla: A − B = A + ¬B + 1. Paso 1: invierte CADA bit de B (0→1, 1→0) en la fila ¬B. Paso 2: activa Cin=1 para inyectar el "+1". El sumador hará el resto.',PX.x+14,by+26,PX.w-28,18);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    wrapText(c,'Cuidado con el error clásico: si inviertes B pero olvidas Cin=1, obtienes A − B − 1 (una unidad de menos). Ajusta abajo y pulsa "Comprobar".',PX.x+14,by+96,PX.w-28,18);
  }
}
function retoExplain(f,n){
  const target=invBits(f.B,n);
  const opBval=retoOpB.reduce((a,b,i)=>a+((b?1:0)<<i),0);
  const r=rippleAdd(f.A,opBval,retoCin,n);
  if(retoSolved)return 'A + ¬B + 1 = '+f.A+' + '+target+' + 1 = '+f.A+' − '+f.B+' = '+toSigned(r.val,n)+'. Un restador es un sumador con B invertido y acarreo inicial 1: el mismo hardware suma y resta.';
  let s='';
  if(!retoOkData){let bad=0;for(let i=0;i<n;i++)if((( opBval>>i)&1)!==((target>>i)&1))bad++;s+='Hay '+bad+' bit(s) de ¬B mal: cada bit de la fila ¬B debe ser el opuesto del bit de B ('+binStr(f.B,n)+' → '+binStr(target,n)+'). ';}
  if(!retoOkEnable)s+='Falta el acarreo inicial: con Cin=0 el sumador da A + ¬B = A − B − 1 = '+toSigned(r.val,n)+' (te falta el +1). Activa Cin=1. ';
  return s||'Revisa ¬B y el acarreo inicial.';
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='aplica')drawAplica(c);else if(mode==='reto')drawReto(c);else drawExplora(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='aplica')showToast('🧮 La resta es una suma disfrazada: A − B = A + ¬B + 1. El desbordamiento (con signo) no es lo mismo que el acarreo (sin signo). La igualdad es la AND de los XNOR bit a bit.');
  else if(mode==='reto')showToast('🎯 Invierte cada bit de B en la fila ¬B y activa Cin=1. El sumador calculará A − B. Si olvidas Cin, te faltará 1.');
  else showToast('🔧 Conduce el bloque: cambia las entradas del sumador o los números a comparar y observa el acarreo, la suma y el veredicto.');
}

// ===================== 7. ESCENA 3D: ENTRENADOR =====================
const bench=roundedBox(3.7,0.5,1.8,MAT.bench,0.05);bench.position.set(1.9,0.25,0.55);scene.add(bench);
bench.userData={title:'Banco de aritmética binaria',info:'Conduce el bloque activo: entradas → cadena de acarreo → resultado.'};
const pcb=roundedBox(2.4,0.08,1.2,MAT.pcb,0.03);pcb.position.set(1.95,0.54,0.5);scene.add(pcb);
pcb.userData={title:'Tarjeta del sumador/comparador',info:'Recorre las posiciones y enciende bits de suma, acarreos y salidas de comparación.'};
addHoverLabel(pcb,'Entrenador aritmético',ACC,new THREE.Vector3(1.95,1.35,0.5),1.6);
const chip=roundedBox(0.56,0.14,0.5,MAT.chip,0.02);chip.position.set(1.35,0.63,0.55);scene.add(chip);
const chCv=document.createElement('canvas');chCv.width=180;chCv.height=180;const chTex=new THREE.CanvasTexture(chCv);
const chFace=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.5),new THREE.MeshBasicMaterial({map:chTex,transparent:true}));
chFace.rotation.x=-Math.PI/2;chFace.position.set(1.35,0.705,0.55);scene.add(chFace);
chip.userData={title:'Bloque aritmético',info:'Sumador completo, sumador de N bits o comparador.'};
function makeLED(x,z,color){const m=new THREE.Mesh(new THREE.SphereGeometry(0.045,16,16),std(color,0.4,0.1));m.position.set(x,0.62,z);m.material.emissive=new THREE.Color(color);m.material.emissiveIntensity=0.15;scene.add(m);return m;}
// LEDs de bits de suma (LSB a la derecha), acarreos (fila trasera) y comparación
const bitLEDs=[];for(let i=0;i<4;i++)bitLEDs.push(makeLED(2.55-i*0.32,0.62,0x8AB4F8));
const carryLEDs=[];for(let i=0;i<5;i++)carryLEDs.push(makeLED(2.71-i*0.32,0.90,0xE9C46A));
const cmpLEDs=[makeLED(2.05,0.35,0x7CD992),makeLED(2.4,0.35,0x8AB4F8),makeLED(2.75,0.35,0xff6b6b)];
addHoverLabel(bitLEDs[0],'bits de suma',ACC,new THREE.Vector3(1.95,1.05,0.62),1.2);
addHoverLabel(carryLEDs[0],'cadena de acarreo',WARN_HEX,new THREE.Vector3(1.95,1.05,0.90),1.4);
cmpLEDs[0].userData={title:'Salidas del comparador',info:'A>B (verde), A=B (azul), A<B (rojo).'};

function drawChip3D(dev,step){
  const c=chCv.getContext('2d');c.clearRect(0,0,180,180);
  const acc=dev.kind==='cmp'?ACC:(dev.kind==='fa'?WARN_HEX:OK_HEX);
  c.fillStyle='rgba(20,23,27,0.92)';c.fillRect(0,0,180,180);
  c.strokeStyle=acc;c.lineWidth=4;c.strokeRect(4,4,172,172);
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='center';
  if(dev.kind==='fa'){const a=(step>>2)&1,b=(step>>1)&1,ci=step&1,r=fullAdder(a,b,ci);
    c.fillText('SUMADOR COMPLETO',90,28);
    c.font='13px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText('a='+a+' b='+b+' cin='+ci,90,58);
    c.font='bold 28px Outfit, sans-serif';c.fillStyle=r.s?OK_HEX:'#5a6472';c.fillText('S='+r.s,58,108);
    c.fillStyle=r.cout?WARN_HEX:'#5a6472';c.fillText('C='+r.cout,126,108);
    c.font='12px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText('S=a⊕b⊕cin',90,150);
  }else if(dev.kind==='cmp'){const r=compareU(dev.A,dev.B,dev.n),sym=r.gt?'A > B':(r.lt?'A < B':'A = B');
    c.fillText('COMPARADOR '+dev.n+' bit',90,28);
    c.font='14px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText(dev.A+' vs '+dev.B,90,60);
    c.font='bold 30px Outfit, sans-serif';c.fillStyle=ACC;c.fillText(sym,90,112);
    c.font='12px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText('cascada desde MSB',90,150);
  }else{const N=dev.n,r=rippleAdd(dev.A,dev.B,dev.cin,N);
    c.fillText('SUMADOR '+N+' bit',90,28);
    c.font='14px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText(dev.A+' + '+dev.B+(dev.cin?' + 1':''),90,58);
    c.font='bold 30px Outfit, sans-serif';c.fillStyle=OK_HEX;c.fillText('= '+r.val,90,108);
    c.font='12px Outfit, sans-serif';c.fillStyle=r.cout?WARN_HEX:'#9fb0cf';c.fillText('Cout = '+r.cout,90,148);
  }
  chTex.needsUpdate=true;
}
function hwCount(){const dev=curDevice();return dev.kind==='fa'?8:(dev.n||4);}
function updateHW(){
  const dev=curDevice(),step=hwStep%hwCount();
  bitLEDs.forEach(l=>l.visible=false);carryLEDs.forEach(l=>l.visible=false);cmpLEDs.forEach(l=>l.visible=false);
  if(dev.kind==='fa'){
    const a=(step>>2)&1,b=(step>>1)&1,ci=step&1,r=fullAdder(a,b,ci);
    bitLEDs[0].visible=true;bitLEDs[0].material.emissiveIntensity=r.s?1.5:0.12;bitLEDs[0].material.color.setHex(r.s?0x7CD992:0x243026);
    carryLEDs[0].visible=true;carryLEDs[0].material.emissiveIntensity=r.cout?1.5:0.12;carryLEDs[0].material.color.setHex(r.cout?0xE9C46A:0x2a2a20);
  }else if(dev.kind==='cmp'){
    const r=compareU(dev.A,dev.B,dev.n),arr=[r.gt,r.eq,r.lt],cols=[0x7CD992,0x8AB4F8,0xff6b6b];
    cmpLEDs.forEach((l,i)=>{l.visible=true;l.material.emissiveIntensity=arr[i]?1.5:0.1;l.material.color.setHex(arr[i]?cols[i]:0x2a3550);});
  }else{
    const N=dev.n,r=rippleAdd(dev.A,dev.B,dev.cin,N);
    for(let i=0;i<N;i++){const l=bitLEDs[i];l.visible=true;const s=r.bits[i],active=(i===step);
      l.material.emissiveIntensity=active?1.5:(s?0.7:0.12);l.material.color.setHex(s?(active?0x7CD992:0x3a5a44):(active?0x8AB4F8:0x2a3550));}
    for(let i=0;i<=N;i++){const l=carryLEDs[i];l.visible=true;const cv=r.carries[i],active=(i===step||i===step+1);
      l.material.emissiveIntensity=(cv&&active)?1.5:(cv?0.6:0.1);l.material.color.setHex(cv?0xE9C46A:0x2a2a20);}
  }
  drawChip3D(dev,step);
}

// ===================== 8. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Sistemas digitales (D3) · Aritmética binaria · Acarreo y complemento a 2</div>
  <h2>Sumadores y Comparadores Binarios</h2>
  <p>La aritmética de toda computadora se construye con una celda: el <b>sumador completo</b>, que suma tres
  bits (a, b y el acarreo de entrada) y entrega la suma <b>S = a⊕b⊕cin</b> y el acarreo de salida
  <b>Cout</b> (la mayoría de las tres entradas). Encadenando N celdas —la Cout de una es la Cin de la
  siguiente— nace el <b>sumador de N bits</b> (ripple-carry). Lo más elegante: el mismo circuito RESTA sin
  hardware extra, porque en <b>complemento a 2</b> el negativo de B es ¬B+1, así que
  <b>A − B = A + ¬B + 1</b> (basta invertir B y poner Cin=1). En aritmética con signo aparece el
  <b>desbordamiento</b>, que se detecta comparando el acarreo que entra al bit de signo con el que sale
  (Cin_MSB ⊕ Cout_MSB). Y el <b>comparador</b> decide A&gt;B, A=B o A&lt;B recorriendo los bits desde el más
  significativo; la igualdad es la AND de los XNOR bit a bit.</p>
  <div class="formula">S = a⊕b⊕cin · Cout = a·b + cin·(a⊕b) · A−B = A+¬B+1 · Desbordamiento = Cin_MSB⊕Cout_MSB · A=B = Π XNOR(Ai,Bi)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#7CD992"></span>Suma / bit activo / A&gt;B</div>
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Operandos / A=B</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Acarreo (Cin/Cout)</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Desbordamiento / A&lt;B / error</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el comportamiento lógico exacto del sumador completo (S=a⊕b⊕cin, Cout=mayoría), del sumador ripple-carry de 2/3/4 bits con propagación del acarreo, y del comparador de magnitud (A&gt;B, A=B, A&lt;B mutuamente excluyentes); la resta por complemento a 2 (A−B = A+¬B+1, con Cin=1); la detección de desbordamiento con signo por los dos métodos equivalentes (signos y acarreos Cin_MSB⊕Cout_MSB); y la igualdad como AND de los XNOR bit a bit. Todo verificado numéricamente de forma exhaustiva (sumador 4 bits: 2048 casos; resta y desbordamiento: 256 casos cada uno; comparador: 256 casos; coincide con Mano &amp; Ciletti y Patterson &amp; Hennessy).</div>
    <div class="fl no"><b>NO modela:</b> los tiempos de propagación reales del acarreo (aquí es instantáneo; el ripple-carry real es lento por eso existen el carry-lookahead y el carry-save); los glitches durante la propagación; la aritmética de más de 4 bits, con signo en punto flotante, BCD o saturada; el acarreo/pedido (borrow) explícito de un restador dedicado; las banderas de estado de un ALU (Z, N, C, V) más allá de las mostradas; ni la implementación física (familias TTL/CMOS, retardos, fan-out, consumo del 74x83/74x283/74x85).</div>
  </div>
  <div class="src">Ref: Mano &amp; Ciletti, Diseño Digital · Wakerly, Digital Design · Patterson &amp; Hennessy, Computer Organization · TI 74x83/74x283/74x85 · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Aritmética · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
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
  explora:{nombre:'Explora',cam:[[4.8,2.9,7.0],[0.4,1.05,0.3]],mision:'Elige un bloque (sumador completo, sumador de N bits o comparador) y condúcelo: cambia las entradas y observa el acarreo, la suma o el veredicto.'},
  aplica:{nombre:'Aplica',cam:[[4.6,2.8,6.8],[0.4,1.05,0.3]],mision:'Comprueba que restar es sumar el complemento a 2 (A−B=A+¬B+1), cómo se detecta el desbordamiento con signo, y que la igualdad es la AND de los XNOR.'},
  reto:{nombre:'Reto',cam:[[4.7,2.7,6.9],[0.5,1.0,0.4]],mision:'Construye un restador: invierte B (¬B) y activa Cin=1 para que el sumador calcule A − B. D_i = ¬B_i.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';let html='';
  if(mode==='explora'){
    html+=lbl('Bloque:')+`<button class="b sm ${expKind==='fa'?'on':''}" data-k="fa">Sumador completo</button><button class="b sm ${expKind==='add'?'on':''}" data-k="add">Sumador N bits</button><button class="b sm ${expKind==='cmp'?'on':''}" data-k="cmp">Comparador</button>`;
    if(expKind==='fa'){
      html+=lbl('Entradas:')+`<button class="b sm ${faA?'on':''}" data-fa="a">a:${faA}</button><button class="b sm ${faB?'on':''}" data-fa="b">b:${faB}</button><button class="b sm ${faCin?'on':''}" data-fa="cin">cin:${faCin}</button>`;
    }else if(expKind==='add'){
      html+=lbl('Tamaño:')+[2,3,4].map(b=>`<button class="b sm ${b===addN?'on':''}" data-an="${b}">${b} bits</button>`).join('');
      html+=lbl('Cin:')+`<button class="b sm ${addCin?'on':''}" data-acin="t">${addCin}</button>`;
      html+=lbl('A ('+binStr(addA,addN)+'='+addA+'):')+Array.from({length:addN},(_,k)=>{const i=addN-1-k;return `<button class="b sm ${(addA>>i)&1?'on':''}" data-abit="${i}">A${i}:${(addA>>i)&1}</button>`;}).join('');
      html+=lbl('B ('+binStr(addB,addN)+'='+addB+'):')+Array.from({length:addN},(_,k)=>{const i=addN-1-k;return `<button class="b sm ${(addB>>i)&1?'on':''}" data-bbit="${i}">B${i}:${(addB>>i)&1}</button>`;}).join('');
    }else{
      html+=lbl('Tamaño:')+[2,3,4].map(b=>`<button class="b sm ${b===cmpN?'on':''}" data-cn="${b}">${b} bits</button>`).join('');
      html+=lbl('A ('+binStr(cmpA,cmpN)+'='+cmpA+'):')+Array.from({length:cmpN},(_,k)=>{const i=cmpN-1-k;return `<button class="b sm ${(cmpA>>i)&1?'on':''}" data-cabit="${i}">A${i}:${(cmpA>>i)&1}</button>`;}).join('');
      html+=lbl('B ('+binStr(cmpB,cmpN)+'='+cmpB+'):')+Array.from({length:cmpN},(_,k)=>{const i=cmpN-1-k;return `<button class="b sm ${(cmpB>>i)&1?'on':''}" data-cbbit="${i}">B${i}:${(cmpB>>i)&1}</button>`;}).join('');
    }
    bar.innerHTML=html;
    bar.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expKind=b.dataset.k;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-fa]').forEach(b=>b.onclick=()=>{if(autoRunning)return;const k=b.dataset.fa;if(k==='a')faA=faA?0:1;else if(k==='b')faB=faB?0:1;else faCin=faCin?0:1;synth.beep(760,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-an]').forEach(b=>b.onclick=()=>{if(autoRunning)return;addN=parseInt(b.dataset.an,10);addA&=(1<<addN)-1;addB&=(1<<addN)-1;hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-acin]').forEach(b=>b.onclick=()=>{if(autoRunning)return;addCin=addCin?0:1;synth.beep(addCin?820:360,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-abit]').forEach(b=>b.onclick=()=>{if(autoRunning)return;addA^=(1<<parseInt(b.dataset.abit,10));synth.beep(880,0.04,0.035);afterEdit();});
    bar.querySelectorAll('[data-bbit]').forEach(b=>b.onclick=()=>{if(autoRunning)return;addB^=(1<<parseInt(b.dataset.bbit,10));synth.beep(840,0.04,0.035);afterEdit();});
    bar.querySelectorAll('[data-cn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;cmpN=parseInt(b.dataset.cn,10);cmpA&=(1<<cmpN)-1;cmpB&=(1<<cmpN)-1;hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-cabit]').forEach(b=>b.onclick=()=>{if(autoRunning)return;cmpA^=(1<<parseInt(b.dataset.cabit,10));synth.beep(880,0.04,0.035);afterEdit();});
    bar.querySelectorAll('[data-cbbit]').forEach(b=>b.onclick=()=>{if(autoRunning)return;cmpB^=(1<<parseInt(b.dataset.cbbit,10));synth.beep(840,0.04,0.035);afterEdit();});
  }else if(mode==='aplica'){
    html+=lbl('Tema:')+`<button class="b sm ${apTopic==='sub'?'on':''}" data-at="sub">Resta (compl. a 2)</button><button class="b sm ${apTopic==='ovf'?'on':''}" data-at="ovf">Desbordamiento</button><button class="b sm ${apTopic==='eq'?'on':''}" data-at="eq">Igualdad (XNOR)</button>`;
    if(apTopic==='ovf'){
      html+=lbl('Caso:')+OVF_POOL.map((f,i)=>`<button class="b sm ${i===apOvfIdx?'on':''}" data-ao="${i}">${toSigned(f.A,f.n)} + ${toSigned(f.B,f.n)}</button>`).join('');
    }else{
      const sep=apTopic==='eq'?' vs ':' − ';
      html+=lbl(apTopic==='eq'?'Comparar:':'Resta:')+APLICA_POOL.map((f,i)=>`<button class="b sm ${i===apFnIdx?'on':''}" data-af="${i}">${f.A}${sep}${f.B}</button>`).join('');
    }
    bar.innerHTML=html;
    bar.querySelectorAll('[data-at]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apTopic=b.dataset.at;hwStep=0;synth.beep(680,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-af]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apFnIdx=parseInt(b.dataset.af,10);hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-ao]').forEach(b=>b.onclick=()=>{if(autoRunning)return;apOvfIdx=parseInt(b.dataset.ao,10);hwStep=0;synth.beep(700,0.05,0.04);afterEdit();});
  }else{
    const f=RETO_POOL[retoIdx],n=f.n;
    html+=lbl('Cin:')+`<button class="b sm ${retoCin?'on':''}" data-rcin="t">${retoCin}</button>`;
    html+=lbl('¬B (clic=0/1):')+Array.from({length:n},(_,k)=>{const i=n-1-k;return `<button class="b sm ${retoOpB[i]?'on':''}" data-rb="${i}" style="min-width:42px">b${i}:${retoOpB[i]?1:0}</button>`;}).join('');
    bar.innerHTML=html;
    bar.querySelectorAll('[data-rcin]').forEach(b=>b.onclick=()=>{if(autoRunning)return;retoCin=retoCin?0:1;retoChecked=false;retoSolved=false;synth.beep(retoCin?820:360,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-rb]').forEach(b=>b.onclick=()=>{if(autoRunning)return;const i=parseInt(b.dataset.rb,10);retoOpB[i]=retoOpB[i]?0:1;retoChecked=false;retoSolved=false;synth.beep(retoOpB[i]?900:420,0.04,0.035);afterEdit();});
  }
}
function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='reto'){box.style.display='none';return;}
  const f=RETO_POOL[retoIdx];box.style.display='block';
  box.innerHTML=`Objetivo: <b>${f.A} − ${f.B} = ${f.A-f.B}</b>. Método: A + ¬B + 1 (complemento a 2). Invierte cada bit de B (B=${binStr(f.B,f.n)}) y activa Cin=1.`;
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
    if(apTopic==='ovf'){apOvfIdx=pickIdx(OVF_POOL.length,apOvfIdx);}else{apFnIdx=pickIdx(APLICA_POOL.length,apFnIdx);}
    afterEdit();showToast('🔀 Nuevo caso.');
  }else{
    const ks=['fa','add','cmp'];expKind=ks[pickIdx(3,ks.indexOf(expKind))];
    if(expKind==='fa'){faA=Math.random()<0.5?1:0;faB=Math.random()<0.5?1:0;faCin=Math.random()<0.5?1:0;}
    else if(expKind==='add'){addN=[2,3,4][pickIdx(3)];addA=Math.floor(Math.random()*(1<<addN));addB=Math.floor(Math.random()*(1<<addN));addCin=Math.random()<0.5?1:0;}
    else{cmpN=[2,3,4][pickIdx(3)];cmpA=Math.floor(Math.random()*(1<<cmpN));cmpB=Math.floor(Math.random()*(1<<cmpN));}
    afterEdit();showToast('🔀 Bloque: '+(expKind==='fa'?'sumador completo':expKind==='add'?'sumador de N bits':'comparador')+'. Condúcelo.');
  }
  synth.beep(520,0.08,0.05);hwStep=0;
}

// ===================== 11. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele');
  if(mode==='reto'){
    const f=RETO_POOL[retoIdx],n=f.n,target=invBits(f.B,n);
    const opBval=retoOpB.reduce((a,b,i)=>a+((b?1:0)<<i),0),r=rippleAdd(f.A,opBval,retoCin,n);
    const nGood=retoOpB.reduce((a,b,i)=>a+(((b?1:0)===((target>>i)&1))?1:0),0);
    t.innerHTML=teleRow('Objetivo',f.A+' − '+f.B+' = '+(f.A-f.B))+
      teleRow('¬B correctos',nGood+'/'+n,nGood===n?'good':'warn')+
      teleRow('Cin',String(retoCin),retoCin?'good':'warn')+
      teleRow('Tu resultado',String(toSigned(r.val,n)),(toSigned(r.val,n)===(f.A-f.B))?'good':'warn')+
      teleRow('Estado',retoChecked?(retoSolved?'✔ correcto':'✗ revisa'):'configura y comprueba',(retoChecked&&retoSolved)?'good':'warn');
    return;
  }
  if(mode==='aplica'){
    if(apTopic==='sub'){const f=APLICA_POOL[apFnIdx],n=f.n,r=rippleAdd(f.A,invBits(f.B,n),1,n);
      t.innerHTML=teleRow('Tema','Resta = A + ¬B + 1')+teleRow('Operación',f.A+' − '+f.B)+teleRow('¬B',binStr(invBits(f.B,n),n))+teleRow('A+¬B+1',String(r.val)+' → '+toSigned(r.val,n))+teleRow('A−B esperado',String(f.A-f.B),(toSigned(r.val,n)===(f.A-f.B))?'good':'warn');
    }else if(apTopic==='ovf'){const f=OVF_POOL[apOvfIdx],n=f.n,r=rippleAdd(f.A,f.B,0,n);const ov=r.carries[n-1]^r.carries[n];
      t.innerHTML=teleRow('Tema','Desbordamiento con signo')+teleRow('Operación',toSigned(f.A,n)+' + '+toSigned(f.B,n))+teleRow('Resultado',String(toSigned(r.val,n)),ov?'warn':'good')+teleRow('Suma real',String(toSigned(f.A,n)+toSigned(f.B,n)))+teleRow('Desbordamiento',ov?'SÍ':'no',ov?'warn':'good');
    }else{const f=APLICA_POOL[apFnIdx],n=f.n;let eq=1;for(let i=0;i<n;i++)eq&=(((f.A>>i)&1)===((f.B>>i)&1))?1:0;const cmp=compareU(f.A,f.B,n);
      t.innerHTML=teleRow('Tema','Igualdad = AND de XNOR')+teleRow('Comparar',f.A+' vs '+f.B)+teleRow('A = B',String(eq),eq?'good':'')+teleRow('Veredicto',cmp.gt?'A > B':(cmp.lt?'A < B':'A = B'))+teleRow('Salidas activas',String(cmp.gt+cmp.eq+cmp.lt)+' (una)');
    }
    return;
  }
  if(expKind==='fa'){const r=fullAdder(faA,faB,faCin);
    t.innerHTML=teleRow('Bloque','Sumador completo')+teleRow('a b cin',faA+' '+faB+' '+faCin)+teleRow('Suma S',String(r.s),r.s?'good':'')+teleRow('Acarreo Cout',String(r.cout),r.cout?'warn':'')+teleRow('a+b+cin',String(faA+faB+faCin));
  }else if(expKind==='add'){const r=rippleAdd(addA,addB,addCin,addN);
    t.innerHTML=teleRow('Bloque','Sumador '+addN+' bits')+teleRow('A + B + Cin',addA+' + '+addB+' + '+addCin)+teleRow('Suma (N bits)',r.val+' = '+binStr(r.val,addN),'good')+teleRow('Cout',String(r.cout),r.cout?'warn':'')+teleRow('Con signo',String(toSigned(r.val,addN)));
  }else{const r=compareU(cmpA,cmpB,cmpN);
    t.innerHTML=teleRow('Bloque','Comparador '+cmpN+' bits')+teleRow('A vs B',cmpA+' vs '+cmpB)+teleRow('Veredicto',r.gt?'A > B':(r.lt?'A < B':'A = B'),'good')+teleRow('1ª diferencia',r.firstDiff>=0?('bit '+r.firstDiff):'ninguna')+teleRow('Salidas activas',String(r.gt+r.eq+r.lt)+' (una)');
  }
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='reto'){
    const f=RETO_POOL[retoIdx];
    html+=retoMsg||`<span class="mono">Calcula ${f.A} − ${f.B}: invierte B (¬B) y pon Cin=1 para que el sumador dé A + ¬B + 1 = A − B. Comprueba.</span>`;
  }else if(mode==='aplica'){
    if(apTopic==='sub'){const f=APLICA_POOL[apFnIdx],n=f.n;html+=`<span class="mono">${f.A} − ${f.B} = ${f.A} + ¬${f.B} + 1 = ${f.A} + ${invBits(f.B,n)} + 1. El mismo sumador resta con sólo invertir B y Cin=1.</span>`;}
    else if(apTopic==='ovf'){const f=OVF_POOL[apOvfIdx],n=f.n,r=rippleAdd(f.A,f.B,0,n);const ov=r.carries[n-1]^r.carries[n];html+=`<span class="mono">${toSigned(f.A,n)} + ${toSigned(f.B,n)} ${ov?'DESBORDA':'cabe'}: los métodos de signos y de acarreos (Cin_MSB⊕Cout_MSB) coinciden.</span>`;}
    else{const f=APLICA_POOL[apFnIdx];html+=`<span class="mono">${f.A} vs ${f.B}: la AND de los XNOR bit a bit da la igualdad; la comparación desde el MSB da la magnitud (>, =, <).</span>`;}
  }else{
    if(expKind==='fa'){const r=fullAdder(faA,faB,faCin);html+=`<span class="mono">Sumador completo: ${faA}+${faB}+${faCin} → S=${r.s}, Cout=${r.cout}. S=a⊕b⊕cin, Cout=mayoría.</span>`;}
    else if(expKind==='add'){const r=rippleAdd(addA,addB,addCin,addN);html+=`<span class="mono">Sumador ${addN} bits: ${addA}+${addB}+${addCin} = ${r.val} (Cout=${r.cout}). Con signo: ${toSigned(r.val,addN)}.</span>`;}
    else{const r=compareU(cmpA,cmpB,cmpN);html+=`<span class="mono">Comparador: ${cmpA} ${r.gt?'>':(r.lt?'<':'=')} ${cmpB}. Se decide en el primer bit que difiere desde el MSB.</span>`;}
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();updateHW();}

// ===================== 12. RETO =====================
function updateRetoSpec(){
  const f=RETO_POOL[retoIdx],n=f.n;
  el('retoSpec').innerHTML=`Calcula <b>${f.A} − ${f.B}</b> con un sumador de ${n} bits. Un restador = sumador con <b>B invertido</b> (¬B, complemento a 1) y <b>Cin=1</b> (que aporta el +1). Configura cada bit de ¬B y activa Cin. Pulsa "Comprobar".`;
}
function checkReto(){
  const f=RETO_POOL[retoIdx],n=f.n,target=invBits(f.B,n);
  const opBval=retoOpB.reduce((a,b,i)=>a+((b?1:0)<<i),0);
  retoOkData=(opBval===target);
  retoOkEnable=(retoCin===1);
  retoSolved=retoOkData&&retoOkEnable;retoChecked=true;solved=retoSolved;
  synth.beep(retoSolved?1046:220,retoSolved?0.14:0.15,0.06);
  retoMsg=`<span class="mono"><span class="${retoSolved?'ok':'dtc'}">${retoSolved?'✔ Correcto':'✗ Revisa'}</span> — ${retoExplain(f,n)}</span>`;
  refreshAll();
}

// ===================== 13. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Qué produce el acarreo de salida (Cout) de un sumador completo?',
      opciones:[
        {t:'Cout = 1 cuando al menos DOS de las tres entradas (a, b, cin) valen 1: es la función mayoría, Cout = a·b + cin·(a⊕b). Representa el acarreo que se lleva al bit siguiente.',ok:true,why:'Correcto: sumar tres bits puede dar hasta 3 (=11 binario); el bit alto es el acarreo. Aparece justo cuando hay dos o tres unos entre a, b y cin.'},
        {t:'Cout = a ⊕ b ⊕ cin, igual que la suma S.',ok:false,why:'Esa es la SUMA S, no el acarreo. Cout es la mayoría de las entradas (a·b + cin·(a⊕b)), que es distinta de la paridad.'},
        {t:'Cout siempre vale lo mismo que cin.',ok:false,why:'No: con a=b=1 y cin=0, Cout=1 aunque cin=0. El acarreo de salida depende de las tres entradas, no sólo del de entrada.'},
        {t:'Cout es 1 sólo cuando las tres entradas valen 1.',ok:false,why:'Eso lo cumple la AND, pero Cout también es 1 con exactamente dos unos (p. ej. a=1, b=1, cin=0). Es la mayoría, no la AND.'},
      ],
    },
    aplica:{
      pregunta:'¿Por qué A − B se calcula como A + ¬B + 1 con un sumador?',
      opciones:[
        {t:'Porque en complemento a 2 el negativo de B es ¬B + 1; sumar ese negativo equivale a restar B. El "+1" se inyecta gratis como acarreo inicial Cin = 1, así el mismo sumador resta.',ok:true,why:'Correcto: −B = ¬B + 1 (complemento a 2). Entonces A − B = A + (−B) = A + ¬B + 1. Invertir B y poner Cin=1 convierte el sumador en restador sin hardware extra.'},
        {t:'Porque invertir los bits de B ya es, por sí solo, el negativo de B.',ok:false,why:'Casi: ¬B es el complemento a UNO, que da −B − 1. Falta sumar 1 (el Cin=1) para obtener el complemento a DOS, el verdadero −B.'},
        {t:'Porque restar y sumar son la misma operación para cualquier representación.',ok:false,why:'No en general: en signo-magnitud o BCD no basta invertir y sumar 1. El truco A+¬B+1 es específico del complemento a 2.'},
        {t:'Porque el acarreo de salida (Cout) siempre corrige la resta.',ok:false,why:'El Cout se descarta en esta resta; lo que hace la magia es el acarreo de ENTRADA (Cin=1), no el de salida.'},
      ],
    },
    reto:{
      pregunta:'Invertiste B correctamente pero el resultado sale una unidad de menos. ¿Qué falta?',
      opciones:[
        {t:'El acarreo inicial Cin = 1. Sin él calculas A + ¬B = A − B − 1 (complemento a 1). El +1 que convierte ¬B en el verdadero −B lo aporta Cin = 1.',ok:true,why:'Correcto: ¬B es el complemento a uno (−B − 1). Para llegar al complemento a dos (−B) hay que sumar 1, y ese 1 entra por el acarreo inicial. Es el error clásico "off-by-one".'},
        {t:'Hay que invertir también los bits de A.',ok:false,why:'No: A no se toca. Sólo B se invierte, y el ajuste es el Cin=1. Invertir A cambiaría la operación por completo.'},
        {t:'Falta descartar el acarreo de salida (Cout).',ok:false,why:'El Cout no cambia el valor de los N bits del resultado; el problema es el +1 que falta, aportado por Cin=1.',},
        {t:'El sumador está mal; hay que usar un restador dedicado.',ok:false,why:'No hace falta: el sumador resta perfectamente con B invertido y Cin=1. El fallo es sólo que Cin quedó en 0.'},
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
    expKind='fa';faA=1;faB=1;faCin=1;afterEdit();
    showToast('🧱 Sumador completo: 1+1+1 = 3 → S=1 y Cout=1. La suma es a⊕b⊕cin; el acarreo es la mayoría.');
    await sleep(4200);
    expKind='add';addN=4;addA=6;addB=5;addCin=0;afterEdit();
    showToast('➕ Sumador de 4 bits: 6+5 = 11. Observa el acarreo propagándose de bit en bit.');
    await sleep(4200);
    expKind='cmp';cmpN=4;cmpA=9;cmpB=6;afterEdit();
    showToast('⚖️ Comparador: 9 vs 6. Se decide en el primer bit que difiere desde el MSB → A > B.');
    await sleep(4000);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('aplica');
    apTopic='sub';apFnIdx=0;afterEdit();
    showToast('🔄 Restar sumando: 12 − 5 = 12 + ¬5 + 1. El sumador resta con sólo invertir B y Cin=1.');
    await sleep(4400);
    apTopic='ovf';apOvfIdx=0;afterEdit();
    showToast('💥 Desbordamiento: +6 + +5 no cabe en 4 bits con signo. Signos y acarreos lo detectan igual.');
    await sleep(4400);
    apTopic='eq';apFnIdx=2;afterEdit();
    showToast('🟰 Igualdad: 7 vs 7. La AND de los XNOR bit a bit vale 1 → A = B.');
    await sleep(4000);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('reto');
    seedReto(0);updateRetoSpec();afterEdit();
    showToast('🎯 Reto: '+RETO_POOL[retoIdx].ctx+'. Primero invertimos B pero dejamos Cin=0 a propósito…');
    (function(){const f=RETO_POOL[retoIdx],n=f.n,t=invBits(f.B,n);retoOpB=Array.from({length:n},(_,i)=>(t>>i)&1);retoCin=0;})();
    afterEdit();await sleep(3400);
    checkReto();
    showToast('…¬B correcto pero con Cin=0 da A − B − 1 (una unidad de menos). Activamos Cin.');
    await sleep(3600);
    retoCin=1;afterEdit();
    showToast('✔ ¬B + Cin=1: el sumador calcula A − B. Comprobamos.');
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
  // física pura
  fullAdder:(a,b,ci)=>fullAdder(a,b,ci),
  rippleAdd:(A,B,ci,n)=>{const r=rippleAdd(A,B,ci,n);return{bits:r.bits.slice(),carries:r.carries.slice(),cout:r.cout,val:r.val};},
  toSigned:(u,n)=>toSigned(u,n),
  twosComp:(u,n)=>twosComp(u,n),
  invBits:(u,n)=>invBits(u,n),
  compareU:(A,B,n)=>compareU(A,B,n),
  overflow:(A,B,ci,n)=>overflowOf(A,B,ci,n),
  // explora
  expKind:()=>expKind, setExpKind:k=>{if(mode==='explora'){expKind=k;afterEdit();}},
  faState:()=>({a:faA,b:faB,cin:faCin,...fullAdder(faA,faB,faCin)}),
  setFA:(a,b,ci)=>{if(mode==='explora'){if(a!=null)faA=a?1:0;if(b!=null)faB=b?1:0;if(ci!=null)faCin=ci?1:0;afterEdit();}},
  addState:()=>{const r=rippleAdd(addA,addB,addCin,addN);return{n:addN,A:addA,B:addB,cin:addCin,val:r.val,cout:r.cout,bits:r.bits.slice(),carries:r.carries.slice(),signed:toSigned(r.val,addN)};},
  setAdd:(n,A,B,ci)=>{if(mode==='explora'){if(n!=null)addN=n;if(A!=null)addA=A&((1<<addN)-1);if(B!=null)addB=B&((1<<addN)-1);if(ci!=null)addCin=ci?1:0;afterEdit();}},
  cmpState:()=>{const r=compareU(cmpA,cmpB,cmpN);return{n:cmpN,A:cmpA,B:cmpB,gt:r.gt,eq:r.eq,lt:r.lt,firstDiff:r.firstDiff};},
  setCmp:(n,A,B)=>{if(mode==='explora'){if(n!=null)cmpN=n;if(A!=null)cmpA=A&((1<<cmpN)-1);if(B!=null)cmpB=B&((1<<cmpN)-1);afterEdit();}},
  // aplica
  apTopic:()=>apTopic, setApTopic:t=>{if(mode==='aplica'){apTopic=t;afterEdit();}},
  apFn:()=>({...APLICA_POOL[apFnIdx]}), setApFn:i=>{if(mode==='aplica'){apFnIdx=i;afterEdit();}},
  apOvf:()=>({...OVF_POOL[apOvfIdx]}), setApOvf:i=>{if(mode==='aplica'){apOvfIdx=i;afterEdit();}},
  apSubResult:()=>{const f=APLICA_POOL[apFnIdx],n=f.n,r=rippleAdd(f.A,invBits(f.B,n),1,n);return{val:r.val,signed:toSigned(r.val,n),expected:((f.A-f.B)&((1<<n)-1)),ok:(r.val===((f.A-f.B)&((1<<n)-1)))};},
  apOvfResult:()=>{const f=OVF_POOL[apOvfIdx],n=f.n,r=rippleAdd(f.A,f.B,0,n);const carry=r.carries[n-1]^r.carries[n];const sA=(f.A>>(n-1))&1,sB=(f.B>>(n-1))&1,sS=(r.val>>(n-1))&1;const sign=(sA===sB&&sS!==sA)?1:0;return{carryMethod:carry,signMethod:sign,agree:carry===sign,trueSum:toSigned(f.A,n)+toSigned(f.B,n),fits:!(carry)};},
  apEqResult:()=>{const f=APLICA_POOL[apFnIdx],n=f.n;let eq=1;for(let i=0;i<n;i++)eq&=(((f.A>>i)&1)===((f.B>>i)&1))?1:0;return{eq,expected:(f.A===f.B?1:0)};},
  // reto
  retoIdx:()=>retoIdx, retoFn:()=>({...RETO_POOL[retoIdx]}),
  retoOpB:()=>retoOpB.slice(), retoCin:()=>retoCin,
  retoTarget:()=>{const f=RETO_POOL[retoIdx],n=f.n,t=invBits(f.B,n);return Array.from({length:n},(_,i)=>(t>>i)&1);},
  retoSetOpB:arr=>{if(mode==='reto'){retoOpB=arr.slice();retoChecked=false;afterEdit();}},
  retoSetCin:e=>{if(mode==='reto'){retoCin=e?1:0;retoChecked=false;afterEdit();}},
  retoToggle:i=>{if(mode==='reto'){retoOpB[i]=retoOpB[i]?0:1;retoChecked=false;afterEdit();}},
  retoSolveSub:()=>{if(mode==='reto'){const f=RETO_POOL[retoIdx],n=f.n,t=invBits(f.B,n);retoOpB=Array.from({length:n},(_,i)=>(t>>i)&1);retoCin=1;afterEdit();}},
  checkReto:()=>checkReto(),
  retoChecked:()=>retoChecked, retoOkData:()=>retoOkData, retoOkEnable:()=>retoOkEnable, retoSolved:()=>retoSolved,
  seedReto:idx=>{seedReto(idx);updateRetoSpec();afterEdit();},
  newSignal:()=>newSignal(),
  hwStep:()=>hwStep,
  reportText:()=>el('report').innerText,
  quizAnswer:i=>answer(i), quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  solved:()=>solved,
};
