/* ============================================================
   LAB — LEYES DE KIRCHHOFF: REDES MULTIMALLA
   (Dominio D1 · circuitos eléctricos — molde S: esquemático + simulación numérica)
   Normatividad / referencia:
     · LCK y LVK (G. Kirchhoff, 1845): conservación de la carga en cada
       nodo (ΣI = 0) y de la energía por unidad de carga en cada lazo
       cerrado (ΣV = 0).
     · IEC 60617 — símbolos gráficos para esquemas (resistor rectangular,
       batería, tierra). Se cita como estándar de REPRESENTACIÓN; el
       ancla física del lab son las propias leyes.
   Modelo de ingeniería (didáctico):
     · La red se declara como DATOS (nodos + ramas {tipo, valor, a, b}) y
       se resuelve EN VIVO por análisis nodal modificado (MNA): matriz de
       conductancias + fuentes de tensión como incógnitas de corriente,
       eliminación gaussiana con pivoteo parcial.
     · El MISMO motor (solveMNA + pizarrón esquemático) se reutiliza en
       las demás prácticas del molde S (divisores, Thévenin, máxima
       transferencia): solo cambia la declaración de la red.
     · Fuentes ideales y resistores exactos: el contrato de fidelidad
       declara explícitamente lo que el modelo NO incluye.
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.1,2.5,7.2],target:[0.5,1.3,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ============================================================
   1) RED ELÉCTRICA COMO DATOS + SOLVER MNA (reutilizable molde S)
   ============================================================ */
/* Nodos: 0=ref (tierra), 1=P, 2=A, 3=B, 4=Q. Incógnitas reales: V_A y V_B
   (P y Q los fijan las fuentes ideales V1 y V2). */
const NODE_NAME=['ref','P','A','B','Q'];
const NET={
  nodes:4,
  elems:[
    {id:'V1',type:'V',a:1,b:0,value:12},
    {id:'R1',type:'R',a:1,b:2,value:1000},
    {id:'R2',type:'R',a:2,b:0,value:2200},
    {id:'R3',type:'R',a:2,b:3,value:3300},
    {id:'R4',type:'R',a:3,b:0,value:4700},
    {id:'R5',type:'R',a:4,b:3,value:1500},
    {id:'V2',type:'V',a:4,b:0,value:5},
  ],
};
const EL=id=>NET.elems.find(e=>e.id===id);

/* Análisis nodal modificado: incógnitas = n voltajes de nodo + 1 corriente
   por fuente de tensión. Gaussiana con pivoteo parcial. */
function solveMNA(net){
  const n=net.nodes;
  const vs=net.elems.filter(e=>e.type==='V');
  const N=n+vs.length;
  const A=Array.from({length:N},()=>new Array(N).fill(0));
  const z=new Array(N).fill(0);
  net.elems.forEach(e=>{
    if(e.type==='R'){
      const g=1/e.value, a=e.a-1, b=e.b-1;
      if(a>=0)A[a][a]+=g;
      if(b>=0)A[b][b]+=g;
      if(a>=0&&b>=0){A[a][b]-=g;A[b][a]-=g;}
    }
  });
  vs.forEach((e,k)=>{
    const r=n+k, a=e.a-1, b=e.b-1;
    if(a>=0){A[r][a]=1;A[a][r]=1;}
    if(b>=0){A[r][b]=-1;A[b][r]=-1;}
    z[r]=e.value;
  });
  // eliminación gaussiana con pivoteo parcial
  for(let c=0;c<N;c++){
    let p=c;
    for(let r=c+1;r<N;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;
    [A[c],A[p]]=[A[p],A[c]];[z[c],z[p]]=[z[p],z[c]];
    for(let r=c+1;r<N;r++){
      const f=A[r][c]/A[c][c];
      if(!f)continue;
      for(let k=c;k<N;k++)A[r][k]-=f*A[c][k];
      z[r]-=f*z[c];
    }
  }
  const x=new Array(N).fill(0);
  for(let r=N-1;r>=0;r--){
    let s=z[r];
    for(let k=r+1;k<N;k++)s-=A[r][k]*x[k];
    x[r]=s/A[r][r];
  }
  return {V:[0,...x.slice(0,n)],srcI:x.slice(n)};
}

let SOL=null;
function resolve(){SOL=solveMNA(NET);}

/* Corrientes SIEMPRE derivadas de los resistores (convención: positiva de a→b) */
const iThru=e=>(SOL.V[e.a]-SOL.V[e.b])/e.value;
/* Para la LCK en ref: la corriente de cada fuente es la de su resistor en serie */
const SRC_SERIES={V1:'R1',V2:'R5'};

function nodeCurrents(k){
  const list=[];
  NET.elems.forEach(e=>{
    if(e.type==='R'&&(e.a===k||e.b===k)){
      const otro=e.a===k?e.b:e.a;
      list.push({id:e.id,otro:NODE_NAME[otro],into:(SOL.V[otro]-SOL.V[k])/e.value});
    }else if(e.type==='V'&&e.b===k){
      list.push({id:e.id,otro:NODE_NAME[e.a],into:-iThru(EL(SRC_SERIES[e.id]))});
    }
  });
  return list;
}
const kclSum=k=>nodeCurrents(k).reduce((s,f)=>s+f.into,0)*1e3;   // en mA

/* Mallas: recorrido nodo a nodo; LVK = Σ(V[to]−V[from]) = 0 */
const MESHES=[
  {nombre:'Malla 1 (V1–R1–R2)',color:'#4FD1C5',pasos:[{el:'V1',from:0,to:1},{el:'R1',from:1,to:2},{el:'R2',from:2,to:0}]},
  {nombre:'Malla 2 (R2–R3–R4) · sin fuentes',color:'#FFB703',pasos:[{el:'R2',from:0,to:2},{el:'R3',from:2,to:3},{el:'R4',from:3,to:0}]},
  {nombre:'Malla 3 (R4–R5–V2)',color:'#c084fc',pasos:[{el:'R4',from:0,to:3},{el:'R5',from:3,to:4},{el:'V2',from:4,to:0}]},
];
function kvlSteps(mi){
  return MESHES[mi].pasos.map(p=>{
    const e=EL(p.el), dV=SOL.V[p.to]-SOL.V[p.from];
    const det=e.type==='V'
      ?(dV>=0?'fuente, de − a +':'fuente, de + a −')
      :(dV<0?'caída I·R, a favor de la corriente':'subida I·R, contra la corriente');
    return {desde:NODE_NAME[p.from],hasta:NODE_NAME[p.to],el:p.el,dV,det};
  });
}
const kvlSum=mi=>MESHES[mi].pasos.reduce((s,p)=>s+SOL.V[p.to]-SOL.V[p.from],0);  // en V

/* Formato (ASCII en signos: los tests hacen grep) */
const fmtR=v=>v>=1000?(((v/1000)%1)?(v/1000).toFixed(1):String(Math.round(v/1000)))+' kΩ':v+' Ω';
const fmtV=v=>(v%1?v.toFixed(1):String(v))+' V';
const sg=x=>(x>=0?'+':'-')+Math.abs(x).toFixed(3);
const fmtSum=x=>{const v=Math.abs(x)<5e-7?0:x;return(v>=0?'+':'-')+Math.abs(v).toFixed(6);};

/* Código de colores REAL (E12, ±5 %): bandas en vivo sobre los resistores 3D */
const BAND_COLORS=['#1a1a1a','#6b4226','#c73a3a','#d2691e','#e8c832','#3f8f3f','#2b5fb8','#7d3fc4','#8a8a8a','#e8e8e8'];
const BAND_NAMES=['negro','café','rojo','naranja','amarillo','verde','azul','violeta','gris','blanco'];
function bandsFor(v){
  const exp=Math.floor(Math.log10(v))-1;
  const dd=Math.round(v/Math.pow(10,exp));
  return {d1:Math.floor(dd/10),d2:dd%10,mult:exp};
}
const E12=[1.0,1.2,1.5,1.8,2.2,2.7,3.3,3.9,4.7,5.6,6.8,8.2];

/* ============================================================
   2) ESTADO
   ============================================================ */
let mode='explora';       // explora | nodos | mallas | reto
let selNode=2;            // 2=A, 3=B, 0=ref
let selMesh=0;
let retoSolved=false;     // en reto: V_A/V_B/corrientes ocultos hasta acertar
let retoMsg='';
let solved=false;         // pregunta de ingeniería del modo actual
let autoRunning=false;
let QUIZ={};

/* ============================================================
   3) MATERIALES (regla: los roughnessMap procedurales MULTIPLICAN
      la roughness → carcasas con roughness alta y metalness ~0)
   ============================================================ */
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};
const alu=castAluminum(), brush=brushedMetal(), rub=rubber(), plas=techPlastic(0.16,0.19,0.18);
const MAT={
  bench:  std({...plas.maps,color:0x3a464d,roughness:0.85,metalness:0.05}),
  frame:  std({...plas.maps,color:0x232a2e,roughness:0.95,metalness:0}),
  leg:    std({...brush.maps,color:0x77828a,metalness:0.35,roughness:0.85}),
  pcb:    std({color:0x14532d,roughness:0.62,metalness:0}),
  trace:  std({...brush.maps,color:0xc08a3e,metalness:0.8,roughness:0.5}),
  psu:    std({...brush.maps,color:0x707c85,metalness:0.35,roughness:0.85}),
  lead:   std({...brush.maps,color:0xbfc8ce,metalness:0.9,roughness:0.35}),
  jackRed:std({color:0xc23434,roughness:0.55,metalness:0}),
  jackBlk:std({color:0x14181c,roughness:0.55,metalness:0}),
  cableRed:std({...rub.maps,color:0x9e2b2b,roughness:1.0,metalness:0}),
  cableBlk:std({...rub.maps,color:0x15181b,roughness:1.0,metalness:0}),
};

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const lb=labelSprite(text,color);
  lb.position.copy(pos);if(scale)lb.scale.multiplyScalar(scale);
  lb.visible=false;lb.raycast=()=>{};
  obj.add(lb);HOVER_LABELS.set(obj,lb);
}

/* ============================================================
   4) PIZARRÓN — esquema IEC 60617 vivo (canvas → textura)
   ============================================================ */
const boardG=new THREE.Group();boardG.position.set(-1.05,0,-0.85);boardG.rotation.y=0.16;scene.add(boardG);
const frame=sh(roundedBox(3.62,2.77,0.12,MAT.frame,0.03));frame.position.set(0,1.85,0);boardG.add(frame);
[-1.5,1.5].forEach(x=>{
  const leg=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.56,10),MAT.leg));
  leg.position.set(x,0.28,0);boardG.add(leg);
});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
bTex.colorSpace=THREE.SRGBColorSpace;bTex.minFilter=THREE.LinearFilter;bTex.generateMipmaps=false;
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.4,2.55),new THREE.MeshBasicMaterial({map:bTex,toneMapped:false}));
board.position.set(0,1.85,0.065);boardG.add(board);
frame.userData={title:'Pizarrón del esquema',info:'Esquema vivo de la red (símbolos IEC 60617). Toca nodos, insignias de malla o componentes.'};
addHoverLabel(frame,'Esquema vivo · clic: nodos, mallas, componentes','#4FD1C5',new THREE.Vector3(0,1.65,0.3),1.0);

/* Geometría del esquema en px del canvas (1024×768) */
const NODE_XY={2:[390,150],3:[650,150],0:[520,640],1:[110,150],4:[930,150]};
const HIT=[
  {x:390,y:150,r:48,node:2},{x:650,y:150,r:48,node:3},{x:520,y:640,r:70,node:0},
  {x:250,y:470,r:44,mesh:0},{x:520,y:470,r:44,mesh:1},{x:790,y:470,r:44,mesh:2},
  {x:250,y:150,r:52,el:'R1'},{x:520,y:150,r:52,el:'R3'},{x:790,y:150,r:52,el:'R5'},
  {x:390,y:395,r:55,el:'R2'},{x:650,y:395,r:55,el:'R4'},
  {x:110,y:395,r:55,el:'V1'},{x:930,y:395,r:55,el:'V2'},
];

function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function rr(c,x,y,w,h,r){
  c.beginPath();
  c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);
  c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);
  c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);
  c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();
}
function ah(c,x,y,dx,dy){ // punta de flecha
  const nx=-dy,ny=dx;
  c.beginPath();c.moveTo(x+dx*13,y+dy*13);
  c.lineTo(x-dx*4+nx*8,y-dy*4+ny*8);c.lineTo(x-dx*4-nx*8,y-dy*4-ny*8);
  c.closePath();c.fill();
}
function resH(c,cx,cy,id){
  const e=EL(id);
  c.fillStyle='#0c1512';c.fillRect(cx-52,cy-19,104,38);
  c.strokeStyle='#cfe8e2';c.lineWidth=3;c.strokeRect(cx-48,cy-15,96,30);
  c.fillStyle='#8FB3AC';c.font='bold 19px Outfit, sans-serif';c.textAlign='center';
  c.fillText(id+' · '+fmtR(e.value),cx,cy-28);
}
function resV(c,cx,cy,id){
  const e=EL(id);
  c.fillStyle='#0c1512';c.fillRect(cx-19,cy-52,38,104);
  c.strokeStyle='#cfe8e2';c.lineWidth=3;c.strokeRect(cx-15,cy-48,30,96);
  c.fillStyle='#8FB3AC';c.font='bold 19px Outfit, sans-serif';c.textAlign='left';
  c.fillText(id+' · '+fmtR(e.value),cx+24,cy+6);
}
function battV(c,cx,cy,id){
  const e=EL(id);
  c.fillStyle='#0c1512';c.fillRect(cx-30,cy-26,60,52);
  c.strokeStyle='#cfe8e2';
  c.lineWidth=3;line(c,cx-26,cy-9,cx+26,cy-9);   // placa larga (+ hacia arriba)
  c.lineWidth=9;line(c,cx-13,cy+9,cx+13,cy+9);   // placa corta (−)
  c.lineWidth=3;
  c.fillStyle='#f0a5a5';c.font='bold 22px Outfit, sans-serif';c.textAlign='center';
  c.fillText('+',cx<512?cx-42:cx+42,cy-4);   // '+' hacia afuera: la etiqueta ocupa el lado interior
  c.font='bold 19px Outfit, sans-serif';
  c.textAlign=cx<512?'left':'right';
  c.fillText(id+' · '+fmtV(e.value),cx<512?cx+40:cx-40,cy+6);
}
function earth(c,x,y){
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,x,y,x,y+22);line(c,x-20,y+22,x+20,y+22);
  line(c,x-13,y+32,x+13,y+32);line(c,x-6,y+42,x+6,y+42);
}
function curH(c,x,y,name,e,geoDir,hide){
  const i=iThru(e), dir=(i>=0?1:-1)*geoDir;
  c.fillStyle='#FFB703';c.strokeStyle='#FFB703';c.lineWidth=4;
  line(c,x-16,y,x+16,y);ah(c,x+dir*10,y,dir,0);
  c.font='bold 18px Outfit, sans-serif';c.textAlign='center';
  c.fillText(name+' = '+(hide?'¿?':(Math.abs(i)*1e3).toFixed(3)+' mA'),x,y+40);
}
function curV(c,x,y,name,e,hide){
  const i=iThru(e), dir=i>=0?1:-1;  // positiva = hacia abajo (a arriba, b abajo)
  c.fillStyle='#FFB703';c.strokeStyle='#FFB703';c.lineWidth=4;
  line(c,x,y-16,x,y+16);ah(c,x,y+dir*10,0,dir);
  c.font='bold 18px Outfit, sans-serif';c.textAlign='left';
  c.fillText(name+' = '+(hide?'¿?':(Math.abs(i)*1e3).toFixed(3)+' mA'),x+16,y+6);
}
function nodeDot(c,x,y,big){
  c.beginPath();c.arc(x,y,big?9:6,0,7);
  c.fillStyle=big?'#4FD1C5':'#cfe8e2';c.fill();
}

function drawBoard(){
  const c=bCv.getContext('2d');
  const hide=mode==='reto'&&!retoSolved;
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('RED MULTIMALLA · símbolos IEC 60617',26,44);
  if(hide){c.fillStyle='#FFB703';c.textAlign='right';c.fillText('🎯 RETO: calcula V_A y V_B',998,44);}
  // malla seleccionada (lazo resaltado detrás de los cables)
  if(mode==='mallas'){
    const MX=[[110,390],[390,650],[650,930]][selMesh];
    c.strokeStyle=MESHES[selMesh].color;c.globalAlpha=0.22;c.lineWidth=18;
    rr(c,MX[0],150,MX[1]-MX[0],490,26);c.stroke();c.globalAlpha=1;
  }
  // nodo seleccionado (halo)
  if(mode==='nodos'){
    const p=NODE_XY[selNode];
    const g=c.createRadialGradient(p[0],p[1],4,p[0],p[1],46);
    g.addColorStop(0,'rgba(79,209,197,0.55)');g.addColorStop(1,'rgba(79,209,197,0)');
    c.fillStyle=g;c.beginPath();c.arc(p[0],p[1],46,0,7);c.fill();
  }
  // cables
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,110,150,930,150);line(c,110,640,930,640);
  line(c,110,150,110,640);line(c,930,150,930,640);
  line(c,390,150,390,640);line(c,650,150,650,640);
  // elementos (pintan encima del cable)
  resH(c,250,150,'R1');resH(c,520,150,'R3');resH(c,790,150,'R5');
  resV(c,390,395,'R2');resV(c,650,395,'R4');
  battV(c,110,395,'V1');battV(c,930,395,'V2');
  earth(c,520,640);
  // insignias de malla
  [[250,'M1'],[520,'M2'],[790,'M3']].forEach(([mx,t],i)=>{
    const on=mode==='mallas'&&selMesh===i;
    c.beginPath();c.arc(mx,470,24,0,7);
    c.fillStyle=on?MESHES[i].color:'rgba(207,232,226,0.10)';c.fill();
    c.fillStyle=on?'#06110e':'#8FB3AC';c.font='bold 20px Outfit, sans-serif';c.textAlign='center';
    c.fillText(t,mx,477);
  });
  // nodos + etiquetas
  nodeDot(c,390,150,true);nodeDot(c,650,150,true);
  nodeDot(c,110,150,false);nodeDot(c,930,150,false);
  c.font='bold 26px Outfit, sans-serif';c.textAlign='center';c.fillStyle='#4FD1C5';
  c.fillText('A · '+(hide?'¿?':SOL.V[2].toFixed(3)+' V'),390,112);
  c.fillText('B · '+(hide?'¿?':SOL.V[3].toFixed(3)+' V'),650,112);
  c.font='18px Outfit, sans-serif';c.fillStyle='#8FB3AC';
  c.fillText('P · '+fmtV(EL('V1').value),110,112);
  c.fillText('Q · '+fmtV(EL('V2').value),930,112);
  c.fillText('ref · 0 V',520,712);
  // corrientes de rama (dirección real según el signo de la solución)
  curH(c,344,150,'I1',EL('R1'),1,hide);
  curH(c,609,150,'I3',EL('R3'),1,hide);
  curH(c,884,150,'I5',EL('R5'),-1,hide);
  curV(c,390,555,'I2',EL('R2'),hide);
  curV(c,650,555,'I4',EL('R4'),hide);
  bTex.needsUpdate=true;
}

function boardClick(u,v){
  const x=u*1024, y=(1-v)*768;
  let best=null,bd=1e9;
  HIT.forEach(h=>{const d=Math.hypot(x-h.x,y-h.y);if(d<h.r&&d<bd){bd=d;best=h;}});
  if(!best)return;
  if(best.el)toastEl(best.el);
  else if(best.mesh!==undefined){if(mode!=='mallas')setMode('mallas');selectMesh(best.mesh);}
  else{if(mode!=='nodos')setMode('nodos');selectNode(best.node);}
}

/* ============================================================
   5) BANCO 3D — realización física de la red
   ============================================================ */
const bench=sh(roundedBox(3.1,0.5,1.9,MAT.bench,0.05));bench.position.set(1.7,0.25,0.9);scene.add(bench);
bench.userData={title:'Banco de trabajo',info:'La misma red del esquema, montada físicamente: fuentes, resistores con su código de colores y puntos de prueba.'};
const pcb=sh(roundedBox(2.3,0.06,1.3,MAT.pcb,0.02));pcb.position.set(1.7,0.53,1.05);scene.add(pcb);
pcb.userData={title:'Tarjeta de la red',info:'Cada resistor lleva las bandas de su valor REAL (código de colores E12 ±5 %). Tócalos para leerlos.'};
addHoverLabel(pcb,'Realización física de la red','#4FD1C5',new THREE.Vector3(0,0.62,0),0.9);

function trace(x1,z1,x2,z2){
  const w=Math.abs(x2-x1)||0.045,d=Math.abs(z2-z1)||0.045;
  const t=new THREE.Mesh(new THREE.BoxGeometry(Math.max(w,0.045),0.015,Math.max(d,0.045)),MAT.trace);
  t.position.set((x1+x2)/2,0.565,(z1+z2)/2);t.receiveShadow=true;scene.add(t);
}
// riel superior segmentado entre terminales (P→R1→A→R3→B→R5→Q)
trace(0.80,0.70,0.955,0.70);trace(1.295,0.70,1.45,0.70);trace(1.45,0.70,1.575,0.70);
trace(1.925,0.70,2.05,0.70);trace(2.05,0.70,2.175,0.70);trace(2.525,0.70,2.65,0.70);
// derivaciones verticales A y B (a R2 / R4)
trace(1.45,0.70,1.45,0.93);trace(1.45,1.27,1.45,1.50);
trace(2.05,0.70,2.05,0.93);trace(2.05,1.27,2.05,1.50);
// riel de referencia (un solo nodo: continuo)
trace(0.80,1.50,2.65,1.50);

const RES3D={};
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
/* LA RESISTENCIA, con la forma que tiene en la mano: cuerpo abarrilado con
   hombros, las CUATRO BANDAS —tres de valor y la de tolerancia, separada, que
   es la que dice por que lado se empieza a leer— y las patas dobladas que bajan
   a la placa. Un tubo con cuatro rayas equiespaciadas vale para dos valores
   distintos segun por donde se lea, y ese es justo el ejercicio. */
function makeRes3D(id,x,z,vert){
  const g=P3.resistencia(MATP,{largo:0.20,d:0.090,patas:0.11,paso:0.34,
    bandas:[0x1a1a1a,0x1a1a1a,0x1a1a1a,0x1a1a1a]});
  g.position.set(x,0.56,z); if(vert)g.rotation.y=Math.PI/2;
  g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
  g.userData.el=id;
  scene.add(g);RES3D[id]={g,bands:g.userData.bandas};
}
makeRes3D('R1',1.125,0.70,false);makeRes3D('R3',1.75,0.70,false);makeRes3D('R5',2.35,0.70,false);
makeRes3D('R2',1.45,1.10,true);makeRes3D('R4',2.05,1.10,true);

const psCv=[],psTex=[];
function makePSU(i,x,id){
  const g=new THREE.Group();g.position.set(x,0.72,0.25);scene.add(g);
  const box=sh(roundedBox(0.52,0.44,0.40,MAT.psu,0.06));g.add(box);
  const cv=document.createElement('canvas');cv.width=256;cv.height=96;
  const tx=new THREE.CanvasTexture(cv);
  tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.40,0.15),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  pl.position.set(0,0.06,0.205);g.add(pl);
  const postR=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.10,10),MAT.jackRed));postR.position.set(-0.13,0.27,0.10);g.add(postR);
  const postB=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.10,10),MAT.jackBlk));postB.position.set(0.13,0.27,0.10);g.add(postB);
  g.userData={el:id};
  psCv[i]=cv;psTex[i]=tx;
  addHoverLabel(g,'Fuente '+id,'#f0a5a5',new THREE.Vector3(0,0.55,0),0.8);
}
makePSU(0,0.85,'V1');makePSU(1,2.55,'V2');
function drawPSU(i){
  const cv=psCv[i],c=cv.getContext('2d'),v=EL(i===0?'V1':'V2').value;
  c.fillStyle='#071410';c.fillRect(0,0,256,96);
  c.strokeStyle='rgba(79,209,197,0.4)';c.lineWidth=3;c.strokeRect(3,3,250,90);
  c.fillStyle='#4FD1C5';c.font='bold 40px Outfit, sans-serif';c.textAlign='center';
  c.fillText(v.toFixed(2)+' V',128,62);
  psTex[i].needsUpdate=true;
}

function cable(ax,ay,az,bx,by,bz,mat){
  const a=new THREE.Vector3(ax,ay,az),b=new THREE.Vector3(bx,by,bz);
  const m=a.clone().lerp(b,0.5);m.y=Math.max(a.y,b.y)+0.18;
  const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,m,b]),24,0.015,8),mat);
  t.castShadow=true;scene.add(t);
}
cable(0.72,0.99,0.35,0.80,0.60,0.70,MAT.cableRed);
cable(0.98,0.99,0.35,0.80,0.60,1.50,MAT.cableBlk);
cable(2.42,0.99,0.35,2.65,0.60,0.70,MAT.cableRed);
cable(2.68,0.99,0.35,2.65,0.60,1.50,MAT.cableBlk);

const TP_GLOW={};
function makeTP(node,x,z,mat,color,name,info){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const post=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.028,0.034,0.16,12),mat));post.position.y=0.66;g.add(post);
  const glow=new THREE.Mesh(new THREE.SphereGeometry(0.045,12,10),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.45,toneMapped:false}));
  glow.position.y=0.78;glow.raycast=()=>{};g.add(glow);TP_GLOW[node]=glow;
  g.userData={node,title:name,info};
  addHoverLabel(g,name,'#4FD1C5',new THREE.Vector3(0,1.02,0),0.7);
}
makeTP(2,1.45,0.70,MAT.jackRed,0x4FD1C5,'TP-A · nodo A','Punto de prueba del nodo A: clic para ver su balance de corrientes (LCK).');
makeTP(3,2.05,0.70,MAT.jackRed,0x4FD1C5,'TP-B · nodo B','Punto de prueba del nodo B: clic para ver su balance de corrientes (LCK).');
makeTP(0,1.75,1.50,MAT.jackBlk,0x8a9299,'TP-ref · 0 V','Referencia de la red (la tierra del esquema): también cumple la LCK.');

function refreshNet3D(){
  ['R1','R2','R3','R4','R5'].forEach(id=>{
    const e=EL(id),r=RES3D[id],b=bandsFor(e.value);
    [b.d1,b.d2,b.mult].forEach((dig,i)=>r.bands[i].material.color.set(BAND_COLORS[dig]));
    r.bands[3].material.color.set('#c9a227'); // oro = ±5 % (serie E12)
  });
  drawPSU(0);drawPSU(1);
}

/* ============================================================
   6) HUD + PANEL
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos · Análisis de redes (D1)</div>
  <h2>Leyes de Kirchhoff: la red multimalla</h2>
  <p>Una red de <b>3 mallas</b> con 2 fuentes y 5 resistores, resuelta en vivo por
  <b>análisis nodal modificado (MNA)</b>. Verifica con números reales que ΣI = 0 en cada
  <b>nodo</b> y ΣV = 0 en cada <b>malla</b> — y en el reto, predice V_A y V_B
  <b>antes</b> de que el esquema los revele.</p>
  <div class="formula">LCK: ΣI = 0 en cada nodo<br>LVK: ΣV = 0 en cada lazo cerrado<br>nodo A: (V_P−V_A)/R1 = V_A/R2 + (V_A−V_B)/R3</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Nodos incógnita A y B</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Corrientes de rama I1…I5</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Fuentes ideales V1 y V2</div>
    <div class="li"><span class="dot" style="background:#8a9299"></span>Referencia (ref · 0 V)</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> red resistiva lineal en CD con fuentes ideales, resuelta en vivo por análisis nodal modificado (MNA, eliminación gaussiana); corrientes y voltajes exactos del modelo con verificación numérica de LCK y LVK; código de colores real de cada resistor (serie E12).</div>
    <div class="fl no"><b>NO modela:</b> tolerancias reales de los componentes (±5 % de las bandas), resistencia interna de las fuentes, resistencia de conductores y contactos, deriva térmica, elementos parásitos (L, C) ni transitorios — es el circuito ideal de parámetros concentrados. En un montaje físico, cada medición lleva su incertidumbre (ver la práctica del multímetro).</div>
  </div>
  <div class="src">Ref: LCK/LVK (Kirchhoff, 1845) · IEC 60617 · MNA (1975)</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Red de Kirchhoff · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_nodos">ΣI=0 · Nodos</button>
    <button class="b" id="m_mallas">ΣV=0 · Mallas</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div class="modebar" id="selbar" style="display:none"></div>
  <div id="tele">
    <div class="g"><div class="l">V_A (nodo A)</div><b id="t_va">—</b></div>
    <div class="g"><div class="l">V_B (nodo B)</div><b id="t_vb">—</b></div>
    <div class="g"><div class="l">ΣI nodo A</div><b id="t_ia">—</b></div>
    <div class="g"><div class="l">ΣI nodo B</div><b id="t_ib">—</b></div>
    <div class="g"><div class="l">ΣV malla</div><b id="t_vm">—</b></div>
    <div class="g"><div class="l">Estado</div><b id="t_est">—</b></div>
  </div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Tu predicción (análisis nodal)</h4>
  <div id="retoBox" style="display:none">
    <div style="font-size:12px;color:var(--ink);margin:2px 0 8px">Con los valores del esquema, plantea LCK en A y B (sistema 2×2), resuelve y escribe tu predicción (tolerancia ±1 % o ±0.02 V):</div>
    <div style="display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:var(--ink)">
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inVA">V_A =</label><input id="inVA" inputmode="decimal" autocomplete="off" style="width:64px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>V</span></span>
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inVB">V_B =</label><input id="inVB" inputmode="decimal" autocomplete="off" style="width:64px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>V</span></span>
    </div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar predicción</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nueva red (reto)</button>
  </div>`;

const el=id=>document.getElementById(id);

/* ============================================================
   7) TOASTS + INFO DE ELEMENTO
   ============================================================ */
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3200);
}
function toastEl(id){
  const e=EL(id),hide=mode==='reto'&&!retoSolved;
  let info;
  if(e.type==='V'){
    info=`Fuente ideal de ${fmtV(e.value)}: fija el potencial del nodo ${NODE_NAME[e.a]} y entrega la corriente que la red le pida (sin resistencia interna — modelo).`;
  }else{
    const i=iThru(e),b=bandsFor(e.value);
    const bandas=`${BAND_NAMES[b.d1]}-${BAND_NAMES[b.d2]}-${BAND_NAMES[b.mult]}-oro`;
    info=`Conecta ${NODE_NAME[e.a]} con ${NODE_NAME[e.b]} · bandas: ${bandas}. I = ΔV/R = ${hide?'¿? (resuélvelo)':(Math.abs(i)*1e3).toFixed(3)+' mA ('+(i>=0?NODE_NAME[e.a]+'→'+NODE_NAME[e.b]:NODE_NAME[e.b]+'→'+NODE_NAME[e.a])+')'}`;
  }
  showToast(`<b style="color:var(--accent2)">${id} · ${e.type==='V'?fmtV(e.value):fmtR(e.value)}</b><br><span style="color:var(--dim);font-size:11px">${info}</span>`);
}

/* ============================================================
   8) MODOS + SELECCIÓN
   ============================================================ */
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.1,2.5,7.2],[0.5,1.3,0.1]],mision:'Reconoce la red: 2 fuentes, 5 resistores, los nodos A y B, y las 3 mallas.'},
  nodos:{nombre:'Nodos · LCK',cam:[[-0.2,2.1,3.9],[-0.9,1.75,-0.8]],mision:'LCK: en cada nodo, la suma algebraica de corrientes es cero. Selecciona un nodo.'},
  mallas:{nombre:'Mallas · LVK',cam:[[-0.1,2.2,4.3],[-0.9,1.75,-0.8]],mision:'LVK: alrededor de cualquier lazo cerrado, subidas y caídas de tensión suman cero.'},
  reto:{nombre:'Reto',cam:[[0.6,2.3,5.6],[0.2,1.3,0.2]],mision:'Predice V_A y V_B ANTES de que el simulador te los muestre.'},
};
function setMode(k){
  mode=k;
  ['explora','nodos','mallas','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  buildSelBar();
  const reto=k==='reto';
  el('retoTitle').style.display=reto?'':'none';
  el('retoBox').style.display=reto?'':'none';
  solved=false;clearDx();refreshQuestion();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  refreshAll();
}
function buildSelBar(){
  const bar=el('selbar');
  if(mode==='nodos'){
    bar.style.display='';
    bar.innerHTML=`<button class="b" id="n_a">Nodo A</button><button class="b" id="n_b">Nodo B</button><button class="b" id="n_ref">Nodo ref</button>`;
    el('n_a').onclick=()=>selectNode(2);el('n_b').onclick=()=>selectNode(3);el('n_ref').onclick=()=>selectNode(0);
    syncNodeBtns();
  }else if(mode==='mallas'){
    bar.style.display='';
    bar.innerHTML=[0,1,2].map(i=>`<button class="b" id="mm_${i+1}">Malla ${i+1}</button>`).join('');
    [0,1,2].forEach(i=>{el('mm_'+(i+1)).onclick=()=>selectMesh(i);});
    syncMeshBtns();
  }else{bar.style.display='none';bar.innerHTML='';}
}
function syncNodeBtns(){if(mode!=='nodos')return;[['n_a',2],['n_b',3],['n_ref',0]].forEach(([id,k])=>el(id).classList.toggle('on',selNode===k));}
function syncMeshBtns(){if(mode!=='mallas')return;[0,1,2].forEach(i=>el('mm_'+(i+1)).classList.toggle('on',selMesh===i));}
function selectNode(k){selNode=k;syncNodeBtns();synth.beep(660,0.05,0.04);refreshAll();}
function selectMesh(i){selMesh=i;syncMeshBtns();synth.beep(660,0.05,0.04);refreshAll();}

/* ============================================================
   9) TELEMETRÍA + REPORTE
   ============================================================ */
function updateTele(){
  const hide=mode==='reto'&&!retoSolved;
  const set=(id,txt,cls)=>{const b=el(id);b.textContent=txt;b.className=cls||'';};
  set('t_va',hide?'?':SOL.V[2].toFixed(3)+' V',hide?'warn':'good');
  set('t_vb',hide?'?':SOL.V[3].toFixed(3)+' V',hide?'warn':'good');
  set('t_ia',hide?'?':fmtSum(kclSum(2))+' mA',hide?'warn':'good');
  set('t_ib',hide?'?':fmtSum(kclSum(3))+' mA',hide?'warn':'good');
  set('t_vm',hide?'?':fmtSum(kvlSum(selMesh))+' V · M'+(selMesh+1),hide?'warn':'good');
  set('t_est',mode!=='reto'?'RESUELTA · MNA':(retoSolved?'✔ PREDICCIÓN OK':'RETO · predice'),mode!=='reto'?'good':(retoSolved?'good':'warn'));
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='explora'){
    const t1=iThru(EL('R1'))*1e3,t2=iThru(EL('R2'))*1e3,t3=iThru(EL('R3'))*1e3;
    const u5=iThru(EL('R5'))*1e3,u4=iThru(EL('R4'))*1e3;
    html+=`<span class="mono">LCK nodo A: (V_P−V_A)/R1 − V_A/R2 − (V_A−V_B)/R3 = 0</span><br>`+
      `<span class="mono">→ ${sg(t1)} ${sg(-t2)} ${sg(-t3)} = ${fmtSum(t1-t2-t3)} mA <span class="ok">✔</span></span><br>`+
      `<span class="mono">LCK nodo B: (V_A−V_B)/R3 + (V_Q−V_B)/R5 − V_B/R4 = 0</span><br>`+
      `<span class="mono">→ ${sg(t3)} ${sg(u5)} ${sg(-u4)} = ${fmtSum(t3+u5-u4)} mA <span class="ok">✔</span></span><br>`+
      `<span class="mono">Toca el esquema: nodos A/B/ref, insignias M1–M3 y componentes.</span>`;
  }else if(mode==='nodos'){
    const flows=nodeCurrents(selNode);
    html+=`<span class="mono"><b>LCK — nodo ${NODE_NAME[selNode]}</b></span><br>`+
      flows.map(f=>`<span class="mono">${f.into>=0?'entra':'sale'} ${(Math.abs(f.into)*1e3).toFixed(3)} mA por ${f.id} (${f.into>=0?'desde':'hacia'} ${f.otro})</span>`).join('<br>')+
      `<br><span class="mono">ΣI = ${fmtSum(kclSum(selNode))} mA <span class="ok">✔ carga conservada</span></span>`;
  }else if(mode==='mallas'){
    html+=`<span class="mono"><b>LVK — ${MESHES[selMesh].nombre}</b></span><br>`+
      kvlSteps(selMesh).map(s=>`<span class="mono">${s.desde} → ${s.hasta} · ${s.el}: ${sg(s.dV)} V (${s.det})</span>`).join('<br>')+
      `<br><span class="mono">ΣV = ${fmtSum(kvlSum(selMesh))} V <span class="ok">✔ el lazo regresa al mismo potencial</span></span>`;
  }else{
    html+=retoMsg||`<span class="mono">Los valores de R y de las fuentes están en el esquema; V_A, V_B y las corrientes están OCULTOS. Resuelve el sistema 2×2 y escribe tu predicción abajo.</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();}

/* ============================================================
   10) RETO — predicción numérica + red aleatoria
   ============================================================ */
function checkReto(){
  const pa=parseFloat((el('inVA').value||'').replace(',','.'));
  const pb=parseFloat((el('inVB').value||'').replace(',','.'));
  if(!isFinite(pa)||!isFinite(pb)){showToast('Escribe ambas predicciones (en volts).');return;}
  const ta=SOL.V[2],tb=SOL.V[3];
  const tol=v=>Math.max(0.02,Math.abs(v)*0.01);
  const okA=Math.abs(pa-ta)<=tol(ta),okB=Math.abs(pb-tb)<=tol(tb);
  if(okA&&okB){
    retoSolved=true;synth.beep(1046,0.12,0.06);
    retoMsg=`<span class="mono"><span class="ok">✔ Predicción verificada.</span> V_A = ${ta.toFixed(3)} V (tuyo: ${pa.toFixed(3)}) · V_B = ${tb.toFixed(3)} V (tuyo: ${pb.toFixed(3)}). El esquema revela voltajes y corrientes.</span>`;
  }else{
    synth.beep(220,0.15,0.06);
    retoMsg=`<span class="mono"><span class="dtc">✗ Aún no.</span> ${okA?'V_A ✓':'V_A fuera de tolerancia'} · ${okB?'V_B ✓':'V_B fuera de tolerancia'}. Plantea LCK en A y en B (2 ecuaciones, 2 incógnitas) y reintenta.</span>`;
  }
  refreshAll();
}
function newNetwork(){
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  ['R1','R2','R3','R4','R5'].forEach(id=>{EL(id).value=Math.round(pick(E12)*1000);});
  EL('V1').value=pick([9,12,15,18,24]);
  EL('V2').value=pick([3.3,5,9]);
  resolve();buildQuiz();refreshNet3D();
  retoSolved=false;retoMsg='';
  el('inVA').value='';el('inVB').value='';
  if(mode!=='reto')setMode('reto');
  else{solved=false;clearDx();refreshQuestion();refreshAll();}
  showToast('🔀 <b>Red nueva.</b> Los valores están en el esquema (y en las bandas de colores); V_A y V_B te esperan.');
  synth.beep(520,0.08,0.05);
}

/* ============================================================
   11) PREGUNTAS DE INGENIERÍA (reconstruidas con la red viva)
   ============================================================ */
function buildQuiz(){
  const fA=nodeCurrents(2);
  const ins=fA.filter(f=>f.into>=0),outs=fA.filter(f=>f.into<0);
  const txt=fs=>fs.map(f=>`${(Math.abs(f.into)*1e3).toFixed(3)} mA (${f.id})`).join(' + ');
  const okBal=`Entra${ins.length>1?'n':''} ${txt(ins)} y sale${outs.length>1?'n':''} ${txt(outs)}`;
  const allIn=`Entran ${fA.map(f=>`${(Math.abs(f.into)*1e3).toFixed(3)} mA (${f.id})`).join(' + ')} — todas hacia el nodo`;
  let swapBal;
  if(outs.length===2&&Math.abs(Math.abs(outs[0].into)-Math.abs(outs[1].into))>0.005*Math.max(Math.abs(outs[0].into),Math.abs(outs[1].into))){
    swapBal=`Entra${ins.length>1?'n':''} ${txt(ins)} y salen ${(Math.abs(outs[1].into)*1e3).toFixed(3)} mA (${outs[0].id}) + ${(Math.abs(outs[0].into)*1e3).toFixed(3)} mA (${outs[1].id})`;
  }else swapBal='La corriente se reparte a partes iguales entre las ramas conectadas al nodo';
  const alt=JSON.parse(JSON.stringify(NET));
  alt.elems.find(e=>e.id==='R4').value*=2;
  const vb2=solveMNA(alt).V[3],vb=SOL.V[3];
  const cR2=Math.abs(iThru(EL('R2')))*EL('R2').value,cR4=Math.abs(iThru(EL('R4')))*EL('R4').value;
  QUIZ={
    explora:{
      pregunta:'Para resolver esta red por <b>análisis nodal</b>, ¿cuántas incógnitas de voltaje necesitas?',
      opciones:[
        {t:'5 — una por cada nodo (P, A, B, Q y ref)',ok:false,why:'ref es el cero por definición, y P y Q los fijan las fuentes ideales (V_P = V1, V_Q = V2). No son incógnitas.'},
        {t:'2 — solo V_A y V_B (P y Q los fijan las fuentes)',ok:true,why:'Con ref = 0, V_P = V1 y V_Q = V2, quedan V_A y V_B: dos ecuaciones LCK, sistema 2×2. Eso resuelve TODA la red.'},
        {t:'3 — una por cada malla',ok:false,why:'Las mallas dan CORRIENTES en el método de mallas; en análisis nodal las incógnitas son voltajes de nodo.'},
        {t:'1 — solo V_A, porque V_B depende de él',ok:false,why:'V_B es un nodo independiente: sin su propia ecuación LCK el sistema queda indeterminado.'},
      ],
    },
    nodos:{
      pregunta:'Con la red resuelta, ¿cuál es el balance de corrientes (LCK) correcto en el <b>nodo A</b>?',
      opciones:[
        {t:allIn,ok:false,why:'Si TODAS las corrientes entraran, ΣI > 0 y el nodo acumularía carga. La LCK exige que lo que entra, salga.'},
        {t:okBal,ok:true,why:'Cada rama lleva I = ΔV/R con la solución nodal; la suma algebraica en el nodo es exactamente cero (conservación de la carga).'},
        {t:swapBal,ok:false,why:'Las magnitudes no se reparten por igual ni se intercambian: cada rama toma I = ΔV/R con SU resistencia y SU diferencia de potencial.'},
        {t:'No se puede saber sin medir físicamente cada rama',ok:false,why:'El análisis nodal lo determina por completo: conocidos V_A y V_B, cada corriente es ΔV/R. Medir sirve para VERIFICAR el modelo.'},
      ],
    },
    mallas:{
      pregunta:'La malla 2 (R2–R3–R4) <b>no contiene ninguna fuente</b>. ¿Por qué su ΣV sigue siendo 0?',
      opciones:[
        {t:'Porque el potencial es función de punto: al cerrar el lazo regresas al mismo potencial',ok:true,why:'LVK es conservación de energía por unidad de carga: con o sin fuentes, el lazo cerrado vuelve al nodo (y potencial) de partida.'},
        {t:'Porque no circula corriente por esa malla',ok:false,why:'Sí circula: I2, I3 e I4 son distintas de cero. La LVK se cumple CON corrientes presentes.'},
        {t:'Porque las caídas de R2 y R4 se cancelan entre sí',ok:false,why:`No se cancelan por pareja: valen ${cR2.toFixed(3)} V y ${cR4.toFixed(3)} V. Es la suma algebraica del LAZO completo la que da cero.`},
        {t:'Solo las mallas que contienen una fuente cumplen la LVK',ok:false,why:'La LVK vale para TODO lazo cerrado de cualquier red de parámetros concentrados, tenga o no fuentes.'},
      ],
    },
    reto:{
      pregunta:`Reto de diseño: si duplicas R4 (${fmtR(EL('R4').value)} → ${fmtR(EL('R4').value*2)}), ¿qué pasa con V_B?`,
      opciones:[
        {t:'V_B no cambia: lo fija la fuente V2',ok:false,why:'V2 fija el nodo Q, no B: entre ellos está R5. V_B resulta del balance de TODA la red.'},
        {t:`V_B sube a ${vb2.toFixed(3)} V`,ok:true,why:`Con más resistencia hacia ref, el nodo B "se descarga" menos: el MNA con R4 duplicado da V_B = ${vb2.toFixed(3)} V (antes ${vb.toFixed(3)} V).`},
        {t:`V_B se duplica (${(vb*2).toFixed(3)} V)`,ok:false,why:'La red no es proporcional a un solo elemento: V_B depende de todas las conductancias (sistema 2×2), no linealmente de R4.'},
        {t:'V_B baja: más resistencia significa menos voltaje',ok:false,why:'Al revés: R4 conecta B con ref (0 V). Debilitar ese lazo (más Ω) deja a B más cerca de los potenciales positivos.'},
      ],
    },
  };
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

/* ============================================================
   12) PICKING — pizarrón (por UV) + banco (por userData)
   ============================================================ */
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return;
  if(hit.object===board&&hit.uv){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object;
  while(o){
    const u=o.userData||{};
    if(u.el){toastEl(u.el);return;}
    if(u.node!==undefined){if(mode!=='nodos')setMode('nodos');selectNode(u.node);return;}
    if(u.title){showToast(`<b style="color:var(--accent2)">${u.title}</b><br><span style="color:var(--dim);font-size:11px">${u.info}</span>`);return;}
    o=o.parent;
  }
});

/* hover: etiquetas flotantes + cursor */
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
        if(o.userData&&(o.userData.el||o.userData.node!==undefined||o.userData.title||o===board))cursor='pointer';
        o=o.parent;
      }
      if(hits[0].object===board)cursor='pointer';
    }
    S.renderer.domElement.style.cursor=cursor;
  });
})();

/* ============================================================
   13) RECORRIDO AUTOMÁTICO
   ============================================================ */
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorrido guiado en curso…';
  try{
    synth.init();synth.resume();
    clearDx();
    setMode('explora');
    showToast('Paso 1 · La red: V1 y V2 alimentan 5 resistores. Solo hay 2 incógnitas: V_A y V_B.');await sleep(2600);
    setMode('nodos');selectNode(2);
    const fA=nodeCurrents(2),ins=fA.filter(f=>f.into>=0),outs=fA.filter(f=>f.into<0);
    const res=fs=>fs.map(f=>`${(Math.abs(f.into)*1e3).toFixed(3)} mA (${f.id})`).join(' y ');
    showToast(`Paso 2 · LCK en A: entra ${res(ins)}; sale ${res(outs)} — la suma algebraica es 0.`);await sleep(3000);
    selectNode(3);
    showToast('Paso 3 · LCK en B: mismo principio. ΣI = 0.000000 mA, sin importar cuántas ramas lleguen.');await sleep(2600);
    setMode('mallas');selectMesh(0);
    showToast('Paso 4 · LVK malla 1: la subida de V1 se gasta exactamente en R1 y R2. ΣV = 0.');await sleep(3000);
    selectMesh(1);
    showToast('Paso 5 · Malla 2, SIN fuentes: el lazo regresa al mismo potencial — ΣV = 0 de todos modos.');await sleep(3000);
    setMode('reto');
    showToast('Paso 6 · El reto: predecir V_A y V_B. Planteamos LCK en A y B y resolvemos el sistema 2×2…');await sleep(2800);
    el('inVA').value=SOL.V[2].toFixed(3);el('inVB').value=SOL.V[3].toFixed(3);
    checkReto();await sleep(2200);
    const q=QUIZ.reto,i=q.opciones.findIndex(o=>o.ok);
    clearDx();
    const dxBtn=el('dxbtns').children[i];
    if(dxBtn){dxBtn.classList.add('right');solved=true;synth.beep(1046,0.12,0.06);}
    showToast(`<span style="color:var(--good)">✔ ${q.opciones[i].t}</span><br><span style="color:var(--dim);font-size:11px">${q.opciones[i].why}</span>`);
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

/* ============================================================
   14) ANIMACIÓN + SONIDO + INIT
   ============================================================ */
S.setAnimate((dt,time)=>{
  const s=1+Math.sin(time*4)*0.25;
  [2,3,0].forEach(k=>{
    const g=TP_GLOW[k];if(!g)return;
    const on=(mode==='nodos'&&selNode===k);
    g.material.opacity=on?0.85:0.45;
    g.scale.setScalar(on?s:1);
  });
});

['explora','nodos','mallas','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newNetwork;
el('btnCheck').onclick=checkReto;
['inVA','inVB'].forEach(id=>{el(id).addEventListener('keydown',e=>{if(e.key==='Enter')checkReto();});});
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊 Sonido':'🔇 Sonido';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

resolve();buildQuiz();refreshNet3D();
S.start();
setMode('explora');

/* gancho de verificación independiente (tests re-resuelven la red en Node) */
window.__labDebug={
  net:()=>JSON.parse(JSON.stringify(NET)),
  sol:()=>({V:SOL.V.slice()}),
  boardClick,
  mode:()=>mode,
};
