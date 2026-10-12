// ============================== 1) ESCENA ==============================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[0,4.3,6.9],target:[0,1.15,0.5],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.3,minD:2.6,maxD:14});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'square',filterFreq:1200,Q:1});

// ============================== 2) FÍSICA ==============================
const RNOM=[220,330,470,150,680,100,390,560];
const V_SRC=24;
function effR(k,ftype,fidx,dfac){
  const nom=RNOM[k-1];
  if(k!==fidx||ftype==='ninguna')return nom;
  if(ftype==='abierto')return 1e9;
  if(ftype==='corto')return 0;
  if(ftype==='deriva')return nom*dfac;
  return nom;
}
function solveChain(ftype,fidx,dfac){
  const Reffs=RNOM.map((_,i)=>effR(i+1,ftype,fidx,dfac));
  const Rtot=Reffs.reduce((a,b)=>a+b,0);
  const I=V_SRC/Rtot;
  const nodeV=[V_SRC];
  for(let i=1;i<=8;i++)nodeV.push(nodeV[i-1]-I*Reffs[i-1]);
  return {Reffs,Rtot,I,nodeV};
}
function randomDriftFactor(){
  return Math.random()<0.5 ? 3+Math.random()*3 : 0.15+Math.random()*0.2;
}
function fmtR(v){
  if(v>=1e6)return (v/1e6).toFixed(2)+' MΩ';
  if(v>=1e3)return (v/1e3).toFixed(2)+' kΩ';
  return Math.round(v)+' Ω';
}
function fmtV(v){return v.toFixed(2)+' V';}
const BAND_COLORS=['#1a1a1a','#7B4B2A','#D62828','#F4A300','#F4E04D','#4CAF50','#2E6FF2','#9B59B6','#B0B0B0','#FFFFFF'];
const BAND_NAMES=['negro','café','rojo','naranja','amarillo','verde','azul','violeta','gris','blanco'];
function bandsFor(v){
  const exp=Math.floor(Math.log10(v)+1e-9);
  const twoDig=Math.round(v/Math.pow(10,exp-1));
  return {d1:Math.floor(twoDig/10),d2:twoDig%10,mult:exp-1};
}

// ============================== 3) ESTADO ==============================
let mode='explora'; // explora | diagnostico | reto
const DRIFT_CANDIDATES=[0.2,0.3,3,5];
let exType='ninguna', exIdx=1, exDriftFactor=3;
let dxIdx=1+Math.floor(Math.random()*8), dxPrevIdx=null, dxInterval={lo:0,hi:8}, dxLog=[], dxDone=false;
const FAULT_TYPES=['abierto','corto','deriva'];
let retoType=FAULT_TYPES[Math.floor(Math.random()*3)], retoIdx=1+Math.floor(Math.random()*8);
let retoDriftFactor=randomDriftFactor();
let retoLog=[], retoMeasCount=0, retoSolved=false, retoMsg='';
let intentos=0, resiembras=0; const FALLOS_MAX=3;   // fallos del diagnóstico de reto actual; a los 3 se resiembra
let retoGuessType='abierto', retoGuessIdx=1;
let solved=false, autoRunning=false;
let QUIZ={};

// ============================== 4) MATERIALES ==============================
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};
const MAT={
  bench: std({color:0x1c2622,roughness:0.85,metalness:0.05}),
  psu: std({color:0x24302b,roughness:0.55,metalness:0.25}),
  lead: std({color:0xc9c9c9,roughness:0.35,metalness:0.7}),
  jackRed: std({color:0xD62828,roughness:0.4,metalness:0.3}),
  jackBlk: std({color:0x141414,roughness:0.4,metalness:0.3}),
  cableRed: std({color:0x8a1f1f,roughness:0.7,metalness:0}),
  cableBlk: std({color:0x161616,roughness:0.7,metalness:0}),
  trace: std({color:0x0e3b33,roughness:0.6,metalness:0.1}),
};
const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const lbl=labelSprite(text,color);
  lbl.position.copy(obj.position.clone().add(pos));
  lbl.scale.multiplyScalar(scale||1);
  lbl.visible=false;
  scene.add(lbl);
  HOVER_LABELS.set(obj,lbl);
}

// ============================== 5) PIZARRÓN ==============================
function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function nodeDot(c,x,y,big){
  c.beginPath();c.arc(x,y,big?7:5,0,Math.PI*2);c.fillStyle='#4FD1C5';c.fill();
  c.lineWidth=1.5;c.strokeStyle='#0c1512';c.stroke();
}
function wrapText(c,text,x,y,maxW,lh){
  const words=text.split(' ');
  let ln='',yy=y;
  for(const w of words){
    const test=ln?ln+' '+w:w;
    if(c.measureText(test).width>maxW&&ln){c.fillText(ln,x,yy);ln=w;yy+=lh;}
    else ln=test;
  }
  if(ln)c.fillText(ln,x,yy);
}
function earth(c,x,y){
  c.strokeStyle='#cfe8e2';c.lineWidth=2;
  line(c,x,y,x,y+10);
  [14,9,4].forEach((w,i)=>line(c,x-w/2,y+10+i*6,x+w/2,y+10+i*6));
}
function drawSourceSym(c,x,yTop,yBot){
  const midY=(yTop+yBot)/2;
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,x,yTop,x,midY-24);
  line(c,x,midY+24,x,yBot);
  c.lineWidth=4;line(c,x-16,midY-24,x+16,midY-24);
  c.lineWidth=2;line(c,x-9,midY-8,x+9,midY-8);
  c.lineWidth=4;line(c,x-16,midY+8,x+16,midY+8);
  c.lineWidth=2;line(c,x-9,midY+24,x+9,midY+24);
  c.save();
  c.translate(x-34,midY);c.rotate(-Math.PI/2);
  c.fillStyle='#4FD1C5';c.font='bold 15px Outfit, sans-serif';c.textAlign='center';
  c.fillText('V1 = 24 V',0,0);
  c.restore();
}
function drawZigzagH(c,cx,cy,halfW){
  const x0=cx-halfW,seg=(halfW*2)/6,amp=14;
  line(c,x0,cy,x0+seg,cy-amp);
  line(c,x0+seg,cy-amp,x0+2*seg,cy+amp);
  line(c,x0+2*seg,cy+amp,x0+3*seg,cy-amp);
  line(c,x0+3*seg,cy-amp,x0+4*seg,cy+amp);
  line(c,x0+4*seg,cy+amp,x0+5*seg,cy-amp);
  line(c,x0+5*seg,cy-amp,x0+6*seg,cy);
}

const NODE_XY=[[80,230],[280,230],[480,230],[680,230],[880,230],[680,430],[480,430],[280,430],[80,430]];
const RES_CENTER=[null,[180,230],[380,230],[580,230],[780,230],[780,430],[580,430],[380,430],[180,430]];
const RES_HALF_W=60;

function drawFaultDecoration(c,k){
  const [rcx,rcy]=RES_CENTER[k];
  if(exType==='abierto'){
    c.strokeStyle='#e05a5a';c.lineWidth=4;
    line(c,rcx-8,rcy-10,rcx+8,rcy+10);
    line(c,rcx-8,rcy+10,rcx+8,rcy-10);
    c.fillStyle='#e05a5a';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';
    c.fillText('ABIERTO',rcx,rcy-34);
  }else if(exType==='corto'){
    c.strokeStyle='#3fbf6f';c.lineWidth=3;
    c.beginPath();c.moveTo(rcx-RES_HALF_W,rcy);c.quadraticCurveTo(rcx,rcy-34,rcx+RES_HALF_W,rcy);c.stroke();
    c.fillStyle='#3fbf6f';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';
    c.fillText('CORTO',rcx,rcy-40);
  }else if(exType==='deriva'){
    c.fillStyle='#FFB703';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';
    c.fillText('DERIVA ×'+exDriftFactor.toFixed(2),rcx,rcy-34);
  }
}
function nodeStatusLabel(i){
  if(i===0)return {text:'24.0 V',color:'#8FB3AC'};
  if(i===8)return {text:'0.0 V',color:'#8FB3AC'};
  if(mode==='explora'){
    const v=solveChain(exType,exIdx,exDriftFactor).nodeV[i];
    return {text:v.toFixed(1)+' V',color:'#8FB3AC'};
  }
  if(mode==='diagnostico'){
    const rec=dxLog.find(l=>l.node===i);
    if(!rec)return {text:'?',color:'#5a6b66'};
    return rec.isHigh?{text:'ALTO',color:'#3fbf6f'}:{text:'BAJO',color:'#e05a5a'};
  }
  const rec=retoLog.find(l=>l.node===i);
  if(!rec)return {text:'?',color:'#5a6b66'};
  return {text:rec.v.toFixed(2)+' V',color:'#4FD1C5'};
}
function drawSchem(c){
  c.fillStyle='#8FB3AC';c.font='bold 19px Outfit, sans-serif';c.textAlign='left';
  c.fillText('ESQUEMA · CADENA SERIE DE 8 RESISTORES (CD)',20,38);

  for(let k=1;k<=8;k++){
    const [fx,fy]=(k===5)?[880,430]:NODE_XY[k-1];
    const [tx]=NODE_XY[k];
    const [rcx,rcy]=RES_CENTER[k];
    const leftX=Math.min(fx,tx),rightX=Math.max(fx,tx);
    c.strokeStyle='#cfe8e2';c.lineWidth=3;
    line(c,leftX,rcy,rcx-RES_HALF_W,rcy);
    line(c,rcx+RES_HALF_W,rcy,rightX,rcy);
    drawZigzagH(c,rcx,rcy,RES_HALF_W);
    c.fillStyle='#4FD1C5';c.font='bold 14px Outfit, sans-serif';c.textAlign='center';
    c.fillText('R'+k,rcx,rcy-24);
    c.font='11px Outfit, sans-serif';c.fillStyle='#5a6b66';
    c.fillText(fmtR(RNOM[k-1]),rcx,rcy+32);
    if(mode==='explora'&&exType!=='ninguna'&&exIdx===k)drawFaultDecoration(c,k);
  }
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,880,230,880,430);
  drawSourceSym(c,80,230,430);
  earth(c,80,430);

  NODE_XY.forEach((p,i)=>{
    nodeDot(c,p[0],p[1],i===0||i===8);
    c.fillStyle='#cfe8e2';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';
    c.fillText('P'+i,p[0],p[1]-16);
    const st=nodeStatusLabel(i);
    c.fillStyle=st.color;c.font='11px Outfit, sans-serif';
    c.fillText(st.text,p[0],p[1]+22);
  });
}
function drawProfileGraph(c){
  const x0=80,w=800,y0=530,h=170;
  c.fillStyle='#8FB3AC';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText('PERFIL DE VOLTAJE P0→P8',x0,y0-12);
  c.fillStyle='#07120e';c.fillRect(x0,y0,w,h);
  c.strokeStyle='rgba(79,209,197,0.22)';c.lineWidth=1;
  for(let i=0;i<=8;i++){const x=x0+(i/8)*w;line(c,x,y0,x,y0+h);}
  for(let g=0;g<=4;g++){const y=y0+(g/4)*h;line(c,x0,y,x0+w,y);}
  const {nodeV}=solveChain(exType,exIdx,exDriftFactor);
  const xToPx=i=>x0+(i/8)*w, yToPx=v=>y0+h-(Math.max(0,Math.min(V_SRC,v))/V_SRC)*h;
  c.strokeStyle='#4FD1C5';c.lineWidth=2.5;c.beginPath();
  nodeV.forEach((v,i)=>{const px=xToPx(i),py=yToPx(v);if(i===0)c.moveTo(px,py);else c.lineTo(px,py);});
  c.stroke();
  nodeV.forEach((v,i)=>{
    const px=xToPx(i),py=yToPx(v);
    c.fillStyle='#4FD1C5';c.beginPath();c.arc(px,py,4,0,Math.PI*2);c.fill();
    c.fillStyle='#8FB3AC';c.font='11px Outfit, sans-serif';c.textAlign='center';
    c.fillText('P'+i,px,y0+h+18);
  });
}
function drawIntervalBar(c){
  const x0=80,w=800,y=590,h=40;
  c.fillStyle='#8FB3AC';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText('TRAMO SOSPECHOSO (bisección)',x0,y-14);
  const segW=w/8;
  for(let k=1;k<=8;k++){
    const inRange=k>dxInterval.lo&&k<=dxInterval.hi;
    c.fillStyle=inRange?'rgba(255,183,3,0.35)':'rgba(255,255,255,0.03)';
    c.fillRect(x0+(k-1)*segW,y,segW,h);
    c.strokeStyle='rgba(207,232,226,0.25)';c.lineWidth=1;
    c.strokeRect(x0+(k-1)*segW,y,segW,h);
    c.fillStyle='#cfe8e2';c.font='12px Outfit, sans-serif';c.textAlign='center';
    c.fillText('R'+k,x0+(k-1)*segW+segW/2,y+h/2+4);
  }
  c.fillStyle='#8FB3AC';c.font='12px Outfit, sans-serif';c.textAlign='left';
  c.fillText(dxDone?('Localizado: R'+dxInterval.hi+' ('+dxLog.length+' mediciones, óptimo 3)'):('Mediciones: '+dxLog.length+' · óptimo 3'),x0,y+h+22);
}
function drawRetoLegend(c){
  const x0=80,y=560;
  c.fillStyle='#8FB3AC';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText('FALLA SELLADA · tipo y posición desconocidos',x0,y);
  c.font='12px Outfit, sans-serif';c.fillStyle='#5a6b66';
  wrapText(c,'Mide los nodos P1–P7 con el circuito energizado y compara contra el perfil sano esperado (24 V a 0 V, decreciente). Reporta el tipo de falla y el resistor afectado con los controles del panel.',x0,y+26,800,16);
  c.fillStyle='#8FB3AC';c.font='12px Outfit, sans-serif';
  c.fillText('Mediciones realizadas: '+retoLog.length,x0,y+90);
}
function drawBoard(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  drawSchem(c);
  if(mode==='explora')drawProfileGraph(c);
  else if(mode==='diagnostico')drawIntervalBar(c);
  else drawRetoLegend(c);
  bTex.needsUpdate=true;
}
const boardG=new THREE.Group();
boardG.position.set(0,2.3,-1.55);boardG.scale.setScalar(0.85);
scene.add(boardG);
const bFrame=sh(roundedBox(3.14,2.4,0.08,std({color:0x1a2420,roughness:0.7}),0.04));
boardG.add(bFrame);
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
bTex.colorSpace=THREE.SRGBColorSpace;bTex.minFilter=THREE.LinearFilter;bTex.generateMipmaps=false;
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.0,2.25),new THREE.MeshBasicMaterial({map:bTex,toneMapped:false}));
board.position.set(0,0,0.045);
boardG.add(board);

function boardClick(u,v){
  const px=u*1024, py=(1-v)*768;
  let bestNode=-1,bestNodeD=Infinity;
  NODE_XY.forEach((p,i)=>{const d=Math.hypot(px-p[0],py-p[1]);if(d<bestNodeD){bestNodeD=d;bestNode=i;}});
  if(bestNodeD<32){handleNodeClick(bestNode);return;}
  let bestRes=-1,bestResD=Infinity;
  for(let k=1;k<=8;k++){const p=RES_CENTER[k];const d=Math.hypot(px-p[0],py-p[1]);if(d<bestResD){bestResD=d;bestRes=k;}}
  if(bestResD<60){toastResistor(bestRes);return;}
  showToast('Toca un nodo (círculo) para medir su voltaje, o un resistor (zigzag) para ver su valor nominal.');
}
function handleNodeClick(i){
  if(i===0||i===8){
    showToast('Nodo P'+i+' es trivial por definición ('+(i===0?'24.0 V, terminal + de la fuente':'0.0 V, referencia — retorno de la fuente')+') — no cuenta como medición.');
    return;
  }
  if(mode==='explora'){
    const v=solveChain(exType,exIdx,exDriftFactor).nodeV[i];
    showToast('Nodo P'+i+': <b>'+v.toFixed(2)+' V</b> (medición directa, modo Explora).');
    return;
  }
  if(mode==='diagnostico'){probeDiagnostico(i);return;}
  probeReto(i);
}
function toastResistor(k){
  const {d1,d2,mult}=bandsFor(RNOM[k-1]);
  showToast('R'+k+' · valor nominal <b>'+fmtR(RNOM[k-1])+'</b><br><span style="color:var(--dim);font-size:11px">Bandas: '+BAND_NAMES[d1]+'-'+BAND_NAMES[d2]+'-'+BAND_NAMES[mult]+'-oro. El valor nominal siempre es visible, como en una hoja de datos real — no revela si este es el resistor fallado.</span>');
}

// ============================== 6) BANCO 3D ==============================
/* El pizarrón (esquema + perfil de voltaje) va arriba y al fondo; debajo, la
   cadena de 8 resistores MONTADA de verdad sobre un protoboard: cuatro en la
   fila delantera, de izquierda a derecha, y los otros cuatro en la trasera, de
   vuelta, cableados a mano con la fuente en el estante. */
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio:std({color:0x9aa3ad,roughness:0.34,metalness:0.86}),
  acero:MAT.lead, cromo:MAT.lead,
  cobre:std({color:0xb87333,roughness:0.35,metalness:0.75}),
  chapa:std({color:0x8f98a3,roughness:0.40,metalness:0.80}),
  negro:std({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:std({color:0x14181e,roughness:0.80,metalness:0.02}),
  blanco:std({color:0xd7dee6,roughness:0.40,metalness:0.20}),
  ceramica:std({color:0xd7dee6,roughness:0.60,metalness:0.05}),
};
const BANCO=P3.bancoPrototipos(MATP,{cols:22,K:1.45,instrumentos:1});
const prot=BANCO.userData.prot,circG=BANCO.userData.circ,H=BANCO.userData.H,KB=BANCO.userData.K;
const railNear=BANCO.userData.rielCerca;
prot.userData.title='Protoboard';prot.userData.info='Placa de pruebas sin soldadura: las cinco posiciones de cada columna están unidas por dentro; los rieles + y − llevan la alimentación a todo lo largo.';
const fuenteBox=BANCO.userData.instrumento(0);
fuenteBox.g.position.x=-1.65;   // a la izquierda, sobre sus rieles: los cables no cruzan el visor
fuenteBox.g.userData.el='V';
addHoverLabel(fuenteBox.g,'Fuente V','#f0a5a5',new THREE.Vector3(0,0.45,0),0.75);
const cableMat={rojo:0xd64545,negro:0x1b1f24,azul:0x2a5fa8,amarillo:0xe0a21c,verde:0x2f9e5b,naranja:0xe07b22};
function rotula(obj,txt,col,y){addHoverLabel(obj,txt,col,new THREE.Vector3(0,y,0),0.5/KB);}

/* LA CADENA, sobre la placa: R1…R4 delante y R5…R8 detrás. Los resistores
   consecutivos se alternan de fila para no compartir agujero (los une la
   columna), y el paso de la fila delantera a la trasera se hace con un puente
   que cruza el canal. Los valores son los nominales; la falla no se dibuja:
   encontrarla es justo lo que se pide. */
const RES3D={};
(function armaCircuito(){
  BANCO.userData.limpia();BANCO.userData.reiniciaRieles();
  function wire(a,b,col,o){const w=P3.puente(MATP,a,b,Object.assign({color:col},o||{}));circG.add(w);return w;}
  function res(k,c1,f1,c2,f2){
    const g=P3.resistorAxial(MATP,{ohm:RNOM[k-1],paso:Math.abs(c2-c1)*0.1});
    const A=H(c1,f1),B=H(c2,f2);g.position.copy(A).lerp(B,0.5);g.position.y=A.y;
    g.userData.el='R'+k;circG.add(g);rotula(g,'R'+k,'#4FD1C5',0.30);RES3D['R'+k]=g;return g;
  }
  const C=[3,7,11,15,19];
  for(let k=1;k<=4;k++)res(k,C[k-1],k%2?'c':'a',C[k],k%2?'c':'a');
  // el paso al segundo tramo: P4 (col 19) cruza el canal
  wire(H(19,'e'),H(19,'f'),cableMat.azul,{minAlto:0.18,alto:0.2});
  for(let k=5;k<=8;k++){const i=k-5;res(k,C[4-i],k%2?'h':'j',C[3-i],k%2?'h':'j');}
  // la fuente: + a la entrada de R1, − al final de R8 (P8)
  wire(H(3,'e'),railNear('+',3),cableMat.rojo);
  const gnd=wire(H(3,'g'),railNear('-',3),cableMat.negro);
  gnd.userData.title='Referencia (P8)';
  gnd.userData.info='Terminal de referencia (0 V) — el retorno de la fuente ideal.';
  BANCO.userData.cable(0,0,railNear('+',1),cableMat.rojo,{alto:0.09});
  BANCO.userData.cable(0,1,railNear('-',2),cableMat.negro,{alto:0.09});
  circG.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
})();
BANCO.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
scene.add(BANCO);

function drawPSU(){
  const cx=fuenteBox.cx,cv=fuenteBox.cv,w=cv.width,h=cv.height;
  cx.clearRect(0,0,w,h);
  cx.fillStyle='#08120f';cx.fillRect(0,0,w,h);
  cx.fillStyle='#4FD1C5';cx.textAlign='center';
  cx.font='bold '+Math.round(h*0.22)+'px monospace';
  cx.fillText('V',w/2,h*0.30);
  cx.font='bold '+Math.round(h*0.44)+'px monospace';
  cx.fillText(V_SRC.toFixed(2)+' V',w/2,h*0.80);
  fuenteBox.tex.needsUpdate=true;
}
drawPSU();

function refreshNet3D(){drawPSU();}

// ============================== 7) HUD Y PANEL ==============================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos CD (D1) · Diagnóstico y localización de fallas</div>
  <h2>Diagnóstico de Fallas en CD · Localización por Bisección</h2>
  <p>Cadena serie de 8 resistores alimentada por una fuente ideal de 24 V. Un circuito abierto detiene
  la corriente de TODA la cadena y absorbe TODO el voltaje de la fuente de un solo salto, produciendo un
  escalón limpio en un solo nodo — la firma que permite localizar la falla por bisección (half-splitting):
  mides el nodo de en medio del tramo sospechoso, descartas la mitad, repites. Un corto o una deriva de
  valor no anulan la corriente, la alteran — desplazan el perfil completo de forma más sutil.</p>
  <div class="formula">I=V/R_tot (Ohm) · V(Pk)=V(Pk−1)−I·R_ef(k) (KVL) · bisección: cada medición descarta la mitad del tramo sospechoso</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Nodo medido / voltaje exacto</div>
    <div class="li"><span class="dot" style="background:#3fbf6f"></span>ALTO (≈24 V)</div>
    <div class="li"><span class="dot" style="background:#e05a5a"></span>BAJO (≈0 V) / falla abierta</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Tramo sospechoso / deriva</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> firma de escalón limpio de un circuito abierto en una cadena serie, verificada algebraicamente por KVL; bisección formal sobre circuito abierto (óptimo ⌈log₂8⌉=3 mediciones, con seguimiento del conteo real); comparación libre de las 3 firmas de falla en Explora, con gráfica de perfil de voltaje nodo a nodo; diagnóstico de tipo Y posición desconocidos en Reto.</div>
    <div class="fl no"><b>NO modela:</b> la garantía formal de bisección NO se extiende a corto ni deriva de valor — ambas desplazan el perfil completo de voltaje en vez de producir un escalón limpio en un solo nodo, así que se exploran libremente pero sin la ayuda de un algoritmo de localización. Tampoco modela el efecto de carga del multímetro (impedancia infinita, ideal), fallas simultáneas, tolerancias de fabricación de los resistores, ni efectos térmicos o de arco progresivos en un corto real.</div>
  </div>
  <div class="src">Ref: EC&amp;M "The Beauty of Half-Splitting" · AllAboutCircuits · Hayt/Kemmerly/Durbin · IEC 60617 · IEC 60063</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Diagnóstico de fallas · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔬 Explora</button>
    <button class="b" id="m_diagnostico">🎯 Diagnóstico</button>
    <button class="b" id="m_reto">🏆 Reto</button>
  </div>
  <div class="modebar" id="selbar" style="display:none"></div>
  <div style="margin:6px 0 10px">
    <div style="font-size:11px;color:var(--dim);margin-bottom:4px">Sondas de medición (P1–P7):</div>
    <div class="btns" id="probeBtnsDiag" style="display:none"></div>
    <div class="btns" id="probeBtnsReto" style="display:none"></div>
  </div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <div class="btns" id="diagNewBox" style="display:none;margin-top:8px">
    <button class="b" id="btnNewDx">🔀 Nueva falla (abierto)</button>
  </div>
  <div class="btns" id="retoNewBox" style="display:none;margin-top:8px">
    <button class="b" id="btnNewReto">🔀 Nueva falla sellada</button>
  </div>
  <h4 class="sec" id="retoTitle" style="display:none">Reporta tu diagnóstico</h4>
  <div id="retoBox" style="display:none">
    <div class="btns">
      <select id="guessType" class="b sm"><option value="abierto">Abierto</option><option value="corto">Corto</option><option value="deriva">Deriva</option></select>
      <select id="guessIdx" class="b sm">${[1,2,3,4,5,6,7,8].map(i=>`<option value="${i}">R${i}</option>`).join('')}</select>
      <button class="b primary" id="btnCheckReto">✔ Verificar diagnóstico</button>
    </div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
  </div>`;

const el=id=>document.getElementById(id);
function buildProbeBtns(containerId,handler){
  const box=el(containerId);
  box.innerHTML=[1,2,3,4,5,6,7].map(i=>`<button class="b sm" data-p="${i}">P${i}</button>`).join('');
  box.querySelectorAll('[data-p]').forEach(b=>{b.onclick=()=>handler(+b.dataset.p);});
}

// ============================== 8) TOASTS ==============================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3200);
}
function toastPart(id){
  if(id==='V'){
    showToast(`<b style="color:var(--accent2)">V · Fuente ideal de CD</b><br><span style="color:var(--dim);font-size:11px">${fmtV(V_SRC)} — sin resistencia interna (modelo).</span>`);
    return;
  }
  if(id[0]==='R'){toastResistor(+id.slice(1));}
}

// ============================== 9) MODOS Y SELBAR ==============================
const MODE_META={
  explora:{nombre:'Explora',cam:[[0,4.3,6.9],[0,1.15,0.5]],mision:'Provoca cualquier falla en cualquier resistor y compara las 3 firmas de voltaje en la gráfica de perfil.'},
  diagnostico:{nombre:'Diagnóstico',cam:[[0,4.0,6.1],[0,1.45,0.1]],mision:'Localiza el circuito abierto sellado por bisección — mide el punto medio del tramo sospechoso.'},
  reto:{nombre:'Reto',cam:[[0,4.0,6.1],[0,1.45,0.1]],mision:'Falla sellada de tipo Y posición desconocidos. Mide libremente y reporta tu diagnóstico.'},
};
function buildSelBar(){
  const bar=el('selbar');
  if(mode!=='explora'){bar.style.display='none';bar.innerHTML='';return;}
  bar.style.display='flex';
  let html=`<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin-right:4px">Falla:</span>`+
    ['ninguna','abierto','corto','deriva'].map(t=>`<button class="b sm ${exType===t?'on':''}" data-ft="${t}">${t==='ninguna'?'Ninguna':t[0].toUpperCase()+t.slice(1)}</button>`).join('')+
    `</div>`;
  if(exType!=='ninguna'){
    html+=`<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">Resistor:</span>`+
      [1,2,3,4,5,6,7,8].map(i=>`<button class="b sm ${exIdx===i?'on':''}" data-fr="${i}">R${i}</button>`).join('')+
      `</div>`;
  }
  if(exType==='deriva'){
    html+=`<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">Factor:</span>`+
      DRIFT_CANDIDATES.map(f=>`<button class="b sm ${Math.abs(exDriftFactor-f)<1e-6?'on':''}" data-fd="${f}">×${f}</button>`).join('')+
      `</div>`;
  }
  bar.innerHTML=html;
  bar.querySelectorAll('[data-ft]').forEach(b=>{b.onclick=()=>{exType=b.dataset.ft;if(exType==='deriva')exDriftFactor=DRIFT_CANDIDATES[0];afterEdit();};});
  bar.querySelectorAll('[data-fr]').forEach(b=>{b.onclick=()=>{exIdx=+b.dataset.fr;afterEdit();};});
  bar.querySelectorAll('[data-fd]').forEach(b=>{b.onclick=()=>{exDriftFactor=+b.dataset.fd;afterEdit();};});
}
function setMode(k){
  mode=k;
  ['explora','diagnostico','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('probeBtnsDiag').style.display=(k==='diagnostico')?'':'none';
  el('probeBtnsReto').style.display=(k==='reto')?'':'none';
  el('diagNewBox').style.display=(k==='diagnostico')?'':'none';
  el('retoNewBox').style.display=(k==='reto')?'':'none';
  el('retoBox').style.display=(k==='reto')?'':'none';
  el('retoTitle').style.display=(k==='reto')?'':'none';
  buildSelBar();
  solved=false;clearDx();buildQuiz();refreshQuestion();
  const {cam}=MODE_META[k];
  S.moveTo(cam[0],cam[1],1.3);
  refreshAll();
}
function afterEdit(){
  buildSelBar();
  solved=false;clearDx();buildQuiz();refreshQuestion();
  refreshAll();
}

// ============================== 10) TELEMETRÍA Y REPORTE ==============================
function teleRow(l,v,cls){return `<div class="g"><div class="l">${l}</div><b class="${cls||''}">${v}</b></div>`;}
function updateTele(){
  let h='';
  if(mode==='explora'){
    const {Rtot,I,nodeV}=solveChain(exType,exIdx,exDriftFactor);
    h+=teleRow('Falla activa',exType==='ninguna'?'ninguna (sano)':exType+' en R'+exIdx);
    h+=teleRow('R total',fmtR(Rtot));
    h+=teleRow('Corriente I',(I*1000).toFixed(2)+' mA');
    h+=teleRow('V(P8) [debe ser 0 V]',nodeV[8].toFixed(3)+' V',Math.abs(nodeV[8])<0.01?'good':'warn');
  }else if(mode==='diagnostico'){
    h+=teleRow('Tramo sospechoso','R'+(dxInterval.lo+1)+'–R'+dxInterval.hi);
    h+=teleRow('Mediciones',dxLog.length+' (óptimo 3)',dxLog.length<=3?'good':'warn');
    h+=teleRow('Estado',dxDone?('Localizada en R'+dxInterval.hi):'En curso');
  }else{
    h+=teleRow('Mediciones tomadas',String(retoLog.length));
    h+=teleRow('Diagnóstico reportado',retoSolved?'Correcto':(intentos?'Incorrecto':'—'),retoSolved?'good':'');
    h+=teleRow('Intentos fallidos',intentos+' / '+FALLOS_MAX,intentos?'warn':'');
  }
  el('tele').innerHTML=h;
}
function updateReport(){
  let h='<b>'+MODE_META[mode].mision+'</b><br>';
  if(mode==='explora'){
    h+='<span class="mono">Toca cualquier nodo o resistor. El voltaje de nodo cae de forma monótona de 24 V a 0 V en un circuito sano; observa cómo cada tipo de falla altera ese perfil.</span>';
  }else if(mode==='diagnostico'){
    const mid=Math.round((dxInterval.lo+dxInterval.hi)/2);
    h+='<span class="mono">'+(dxDone?'Falla localizada — pulsa "Nueva falla" para otra ronda.':('Mide el nodo P'+mid+' (punto medio del tramo actual) para una bisección óptima.'))+'</span>';
  }else{
    h+='<span class="mono">'+(retoMsg||'Mide los nodos que necesites, luego selecciona el tipo de falla y el resistor y verifica.')+'</span>';
  }
  el('report').innerHTML=h;
}
function refreshAll(){drawBoard();updateTele();updateReport();refreshNet3D();}

// ============================== 11) MEDICIÓN Y DIAGNÓSTICO ==============================
function probeDiagnostico(node){
  if(node<1||node>7)return;
  if(dxDone){showToast('Ya localizaste la falla en R'+dxInterval.hi+'. Pulsa "Nueva falla" para otra ronda.');return;}
  const {nodeV}=solveChain('abierto',dxIdx,1);
  const v=nodeV[node];
  const isHigh=v>V_SRC/2;
  const optimal=node===Math.round((dxInterval.lo+dxInterval.hi)/2);
  dxLog=dxLog.filter(l=>l.node!==node);
  dxLog.push({node,isHigh,optimal,v});
  if(isHigh)dxInterval={lo:Math.max(dxInterval.lo,node),hi:dxInterval.hi};
  else dxInterval={lo:dxInterval.lo,hi:Math.min(dxInterval.hi,node)};
  const justDone=dxInterval.hi-dxInterval.lo===1;
  if(justDone){dxDone=true;solved=true;}
  synth.beep(optimal?1046:660,0.12,0.06);
  if(justDone){
    showToast(`<span style="color:var(--good)">✔ Falla localizada: R${dxInterval.hi}</span> · ${dxLog.length} mediciones (óptimo 3)${dxLog.length===3?' — ¡bisección perfecta!':''}.`);
  }else{
    showToast('P'+node+': <b>'+v.toFixed(2)+' V</b> → '+(isHigh?'ALTO':'BAJO')+'. Tramo sospechoso ahora: R'+(dxInterval.lo+1)+'–R'+dxInterval.hi+(optimal?' · medición óptima':''));
  }
  refreshAll();
}
function newDiagnostico(){
  let next=dxIdx;
  while(next===dxIdx)next=1+Math.floor(Math.random()*8);
  dxPrevIdx=dxIdx;dxIdx=next;
  dxInterval={lo:0,hi:8};dxLog=[];dxDone=false;
  showToast('🔀 Nueva falla sellada (circuito abierto) generada.');
  synth.beep(440,0.1,0.05);
  afterEdit();
}
function probeReto(node){
  if(node<1||node>7)return;
  const {nodeV}=solveChain(retoType,retoIdx,retoDriftFactor);
  const v=nodeV[node];
  retoLog=retoLog.filter(l=>l.node!==node);
  retoLog.push({node,v});
  retoMeasCount++;
  synth.beep(880,0.08,0.05);
  showToast('P'+node+': <b>'+v.toFixed(2)+' V</b>');
  refreshAll();
}
/* Retroalimentación de RAZONAMIENTO: contrasta la hipótesis del alumno con SUS propias lecturas */
function pistaHipotesis(){
  if(retoGuessType==='deriva')return 'Una deriva no da escalón limpio ni anula la corriente: compara el perfil que mediste con el de la cadena sana (cae de 24 V a 0 V de forma pareja).';
  const g=solveChain(retoGuessType,retoGuessIdx,1).nodeV;
  const malo=retoLog.find(l=>Math.abs(l.v-g[l.node])>0.05);
  if(malo)return 'Con '+retoGuessType+' en R'+retoGuessIdx+', P'+malo.node+' marcaría '+g[malo.node].toFixed(2)+' V, pero mediste '+malo.v.toFixed(2)+' V: esa hipótesis no cuadra con tu lectura.';
  return 'Tu hipótesis es compatible con las lecturas que tomaste, pero con ellas no se descartan otras: mide en más nodos antes de reportar.';
}
function checkReto(){
  if(retoSolved)return;
  if(retoLog.length===0){showToast('⚠️ Mide al menos un nodo antes de reportar tu diagnóstico.');return;}
  const typeOk=retoGuessType===retoType;
  const idxOk=retoGuessIdx===retoIdx;
  retoSolved=typeOk&&idxOk;
  if(retoSolved){
    retoMsg='<span class="mono"><span class="ok">✔ Diagnóstico correcto</span> en '+(intentos+1)+(intentos?' intentos':' intento')+', con '+retoLog.length+' lectura(s).</span>';
    synth.beep(1046,0.14,0.07);solved=true;
    showToast('<span style="color:var(--good)">✔ Diagnóstico correcto</span>');
  }else{
    intentos++;synth.beep(220,0.16,0.07);
    /* no se dice cuál de los dos campos falla (daría la respuesta por partes) ni se revela la falla */
    const base='<span class="dtc">✗ Diagnóstico incorrecto</span> — '+pistaHipotesis();
    if(intentos>=FALLOS_MAX){
      resiembras++;
      retoMsg='<span class="mono">'+base+'<br><span class="dtc">'+FALLOS_MAX+' intentos fallidos:</span> esta falla se retira sin revelarse. Te toca una nueva.</span>';
      const msg=retoMsg;
      newReto(true);
      retoMsg=msg;refreshAll();
      showToast('🔀 '+FALLOS_MAX+' fallos: falla nueva, tipo y posición desconocidos.');
      return;
    }
    retoMsg='<span class="mono">'+base+' (intento '+intentos+' de '+FALLOS_MAX+'; a los '+FALLOS_MAX+' fallos la falla cambia).</span>';
    showToast('Diagnóstico incorrecto — revisa tus lecturas.');
  }
  refreshAll();
}
function newReto(auto){
  let nt,ni;
  do{
    nt=FAULT_TYPES[Math.floor(Math.random()*3)];
    ni=1+Math.floor(Math.random()*8);
  }while(nt===retoType&&ni===retoIdx);
  retoType=nt;retoIdx=ni;retoDriftFactor=randomDriftFactor();
  retoLog=[];retoMeasCount=0;retoSolved=false;retoMsg='';intentos=0;
  retoGuessType='abierto';retoGuessIdx=1;
  el('guessType').value='abierto';el('guessIdx').value='1';
  if(auto!==true){showToast('🔀 Nueva falla sellada (tipo y posición desconocidos).');}
  synth.beep(440,0.1,0.05);
  afterEdit();
}

// ============================== 12) QUIZ ==============================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'Cuando un resistor de la cadena se abre, ¿qué ocurre con el voltaje de los nodos posteriores a la falla?',
      opciones:[
        {t:'Caen a 0 V, porque la corriente de toda la cadena se vuelve prácticamente nula',ok:true,why:'El resistor abierto absorbe todo el voltaje de la fuente; sin corriente, no hay caída de voltaje en los resistores restantes.'},
        {t:'Suben a 24 V, porque el resistor abierto actúa como un cortocircuito hacia la fuente',ok:false,why:'Un abierto es lo opuesto de un corto: bloquea la corriente, no la desvía.'},
        {t:'No cambian, porque cada resistor de la cadena es independiente de los demás',ok:false,why:'En un circuito serie todos los resistores comparten la misma corriente — una falla afecta a toda la cadena.'},
        {t:'Oscilan aleatoriamente un rato hasta estabilizarse en un valor intermedio',ok:false,why:'El modelo es estático (Ley de Ohm + KVL), no hay dinámica oscilatoria.'},
      ],
    },
    diagnostico:{
      pregunta:'¿Por qué conviene medir el nodo de en medio del tramo sospechoso primero, en vez de un extremo?',
      opciones:[
        {t:'Porque cada medición bien colocada descarta la mitad del tramo restante',ok:true,why:'Es la esencia del half-splitting: minimizar el número esperado de mediciones necesarias.'},
        {t:'Porque el nodo de en medio es siempre el punto donde está la falla',ok:false,why:'No necesariamente — solo reduce el tramo a la mitad, no localiza directamente salvo que ya quede un solo resistor.'},
        {t:'Porque los nodos extremos del circuito no se pueden medir con el multímetro',ok:false,why:'P0 y P8 sí se pueden medir, pero son triviales por definición y no aportan información nueva.'},
        {t:'Porque el multímetro solo funciona bien en el centro del circuito',ok:false,why:'El multímetro simulado es ideal y mide cualquier nodo accesible por igual.'},
      ],
    },
    reto:{
      pregunta:'¿Por qué en este banco la bisección formal solo se garantiza para el circuito abierto, y no para el corto o la deriva?',
      opciones:[
        {t:'Porque el abierto da un escalón limpio en un solo nodo; el corto y la deriva desplazan todo el perfil y no admiten localización binaria',ok:true,why:'Es la firma de falla lo que permite o no la bisección — no una limitación arbitraria del instrumento.'},
        {t:'Porque el corto y la deriva son fallas menos importantes y mucho menos frecuentes en la práctica real de mantenimiento',ok:false,why:'Al contrario: ambas son comunes en campo, solo requieren una técnica de diagnóstico distinta (comparar contra los valores nominales esperados).'},
        {t:'Porque el simulador no puede calcular el voltaje de los nodos cuando hay un corto o una deriva en la cadena',ok:false,why:'El simulador sí calcula esos voltajes (los ves libremente en Explora y Reto); lo que no ofrece es la garantía formal de convergencia por bisección.'},
        {t:'Porque el corto y la deriva nunca ocurren en una cadena serie real, solo aparecen en circuitos conectados en paralelo',ok:false,why:'Sí ocurren — por ejemplo, daño térmico o envejecimiento producen derivas de valor con frecuencia.'},
      ],
    },
  };
  /* Fisher–Yates: la correcta no va en posición fija */
  Object.keys(QUIZ).forEach(k=>{
    const o=QUIZ[k].opciones;
    for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]];}
  });
}
function clearDx(){el('dxbtns').querySelectorAll('.b.dx').forEach(b=>b.classList.remove('right','wrong'));}
function refreshQuestion(){
  const q=QUIZ[mode];
  el('q_text').innerHTML=q.pregunta;
  el('dxbtns').innerHTML=q.opciones.map((o,i)=>`<button class="b dx" data-i="${i}">${'ABCD'[i]} · ${o.t}</button>`).join('');
  el('dxbtns').querySelectorAll('.b.dx').forEach(btn=>{btn.onclick=()=>answer(+btn.dataset.i);});
}
function answer(i){
  const o=QUIZ[mode].opciones[i];clearDx();
  const btn=el('dxbtns').children[i];
  if(o.ok){
    btn.classList.add('right');solved=true;synth.beep(1046,0.12,0.06);
    showToast(`<span style="color:var(--good)">✔ Correcto.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }else{
    btn.classList.add('wrong');synth.beep(220,0.15,0.06);
    showToast(`<span style="color:var(--bad)">✗ Revisa el modelo.</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }
}

// ============================== 13) PICKING Y HOVER ==============================
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return;
  if(hit.object===board&&hit.uv){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object;
  while(o){
    const u=o.userData||{};
    if(u.el){toastPart(u.el);return;}
    if(u.title){showToast(`<b style="color:var(--accent2)">${u.title}</b><br><span style="color:var(--dim);font-size:11px">${u.info}</span>`);return;}
    o=o.parent;
  }
});

(()=>{
  const ray=new THREE.Raycaster(),v2=new THREE.Vector2();
  S.renderer.domElement.addEventListener('pointermove',ev=>{
    const r=S.renderer.domElement.getBoundingClientRect();
    v2.x=((ev.clientX-r.left)/r.width)*2-1;v2.y=-((ev.clientY-r.top)/r.height)*2+1;
    ray.setFromCamera(v2,S.camera);
    const hits=ray.intersectObjects(scene.children,true);
    HOVER_LABELS.forEach(lb=>lb.visible=false);
    let cursor='default';
    if(hits.length){
      let o=hits[0].object;
      while(o){
        if(HOVER_LABELS.has(o)){HOVER_LABELS.get(o).visible=true;cursor='pointer';break;}
        if(o.userData&&(o.userData.el||o.userData.title||o===board))cursor='pointer';
        o=o.parent;
      }
      if(hits[0].object===board)cursor='pointer';
    }
    S.renderer.domElement.style.cursor=cursor;
  });
})();

// ============================== 14) RECORRIDO AUTOMÁTICO ==============================
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorrido guiado en curso…';
  /* DEMOSTRACIÓN: no toca el reto ni deja nada resuelto; al terminar se restituye el estado del alumno */
  const previo={modo:mode,solved,exType,exIdx,exDriftFactor,dxIdx,dxInterval:{...dxInterval},dxLog:dxLog.slice(),dxDone,dxPrevIdx};
  try{
    synth.init();synth.resume();
    clearDx();
    setMode('explora');
    exType='ninguna';afterEdit();
    showToast('Paso 1 · Circuito sano: el voltaje cae suavemente de 24 V a 0 V, nodo por nodo.');await sleep(2200);
    exType='abierto';exIdx=5;afterEdit();
    showToast('Ahora provoca un ABIERTO en R5: observa el escalón limpio — nodos antes en 24 V, después en 0 V.');await sleep(2600);
    exType='corto';exIdx=3;afterEdit();
    showToast('Ahora un CORTO en R3: la corriente total sube y el perfil se desplaza, sin escalón limpio.');await sleep(2600);
    exType='deriva';exIdx=6;exDriftFactor=4;afterEdit();
    showToast('Ahora una DERIVA ×4 en R6: el perfil se desplaza de forma más sutil todavía.');await sleep(2600);
    answer(QUIZ.explora.opciones.findIndex(o=>o.ok));await sleep(1800);

    setMode('diagnostico');
    newDiagnostico();
    showToast('Paso 2 · Localiza el circuito abierto sellado por bisección.');await sleep(2000);
    let guard=0;
    while(!dxDone&&guard<6){
      const m=Math.round((dxInterval.lo+dxInterval.hi)/2);
      probeDiagnostico(m);
      await sleep(1700);
      guard++;
    }
    await sleep(1000);
    answer(QUIZ.diagnostico.opciones.findIndex(o=>o.ok));await sleep(1800);

    showToast('Paso 3 · El Reto es tuyo: falla sellada de tipo Y posición desconocidos. Mide los nodos que necesites y reporta. Este recorrido no lo resuelve ni lo marca como hecho.');await sleep(3400);
  }finally{
    exType=previo.exType;exIdx=previo.exIdx;exDriftFactor=previo.exDriftFactor;
    dxIdx=previo.dxIdx;dxInterval=previo.dxInterval;dxLog=previo.dxLog;dxDone=previo.dxDone;dxPrevIdx=previo.dxPrevIdx;
    setMode(previo.modo);solved=previo.solved;
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ============================== 15) EVENTOS E INICIO ==============================
['explora','diagnostico','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=runAuto;
el('btnNewDx').onclick=()=>newDiagnostico();
el('btnNewReto').onclick=()=>newReto();
el('btnCheckReto').onclick=()=>checkReto();
el('guessType').onchange=()=>{retoGuessType=el('guessType').value;};
el('guessIdx').onchange=()=>{retoGuessIdx=+el('guessIdx').value;};
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊 Sonido':'🔇 Sonido';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildProbeBtns('probeBtnsDiag',probeDiagnostico);
buildProbeBtns('probeBtnsReto',probeReto);
buildQuiz();refreshNet3D();
S.start();
setMode('explora');

window.__labDebug={
  mode:()=>mode,
  RNOM:()=>RNOM.slice(), V_SRC:()=>V_SRC,
  profile:(ftype,idx,dfac)=>solveChain(ftype??exType,idx??exIdx,dfac??exDriftFactor),
  nodeVoltage:i=>solveChain(exType,exIdx,exDriftFactor).nodeV[i],
  exType:()=>exType, exIdx:()=>exIdx, exDriftFactor:()=>exDriftFactor,
  setExplora:(t,i,f)=>{exType=t;if(i!=null)exIdx=i;if(f!=null)exDriftFactor=f;afterEdit();},
  dxIdx:()=>dxIdx, dxInterval:()=>({...dxInterval}), dxLog:()=>dxLog.slice(), dxDone:()=>dxDone,
  probeDiagnostico:node=>probeDiagnostico(node), newDiagnostico:()=>newDiagnostico(),
  retoType:()=>retoType, retoIdx:()=>retoIdx, retoDriftFactor:()=>retoDriftFactor,
  retoLog:()=>retoLog.slice(), retoMeasCount:()=>retoMeasCount, retoSolved:()=>retoSolved, retoMsg:()=>retoMsg,
  intentos:()=>intentos, resiembras:()=>resiembras, runAuto:()=>runAuto(),
  probeReto:node=>probeReto(node),
  setGuess:(t,i)=>{retoGuessType=t;retoGuessIdx=i;el('guessType').value=t;el('guessIdx').value=String(i);},
  checkReto:()=>checkReto(), newReto:()=>newReto(),
  boardClick:(u,v)=>boardClick(u,v), setMode:k=>setMode(k),
  reportText:()=>el('report').innerText,
  quizAnswer:i=>answer(i), quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  solved:()=>solved,
};
