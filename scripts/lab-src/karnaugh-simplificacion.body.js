// Síntesis de funciones lógicas y simplificación con mapas de Karnaugh (D3 · digital).
// Física (verificada node -e, 1200/1200 vs fuerza bruta):
//   Una función lógica de n variables queda definida por su TABLA DE VERDAD (para cada una de las 2^n
//   combinaciones de entrada, la salida F vale 0 o 1). Los "1" de la tabla son los MINTÉRMINOS.
//   · FORMA CANÓNICA (suma de mintérminos, SOP): un producto por cada 1, con las n variables → mucha lógica.
//   · MAPA DE KARNAOUGH: reacomoda la tabla en una rejilla con código Gray (celdas vecinas difieren en UN
//     solo bit). Agrupar 2^k unos adyacentes elimina k variables (las que cambian dentro del grupo).
//   · SIMPLIFICACIÓN MÍNIMA: el mínimo coste (literales) se obtiene con implicantes primos (Quine-McCluskey)
//     y una cobertura exacta de coste mínimo. Coste de un término = n − (variables eliminadas).
//   COSTE en compuertas (realización AND-OR de 2 niveles): un AND por cada producto de ≥2 literales,
//     un OR si hay ≥2 términos; los inversores cuentan por variable complementada distinta.
//   HONESTIDAD: no toda función simplifica. La paridad impar (XOR de 3+ variables) no tiene celdas
//     adyacentes agrupables → su forma mínima es la canónica (ningún ahorro). El simulador lo muestra.
//   Ref: IEEE Std 91-1984 (símbolos lógicos) · Mano & Ciletti, "Diseño Digital" · Wakerly, "Digital Design"
//        · Quine (1952) / McCluskey (1956), minimización de funciones booleanas · verificación numérica propia.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.2,3.3,5.4],target:[0.9,0.65,0.8],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.42,minD:3.2,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. FÍSICA (motor de minimización — VERIFICADO) =====================
const VN=['A','B','C','D'];
function popcount(x){let c=0;while(x){c+=x&1;x>>=1;}return c;}
function combine(a,b){if(a.mask!==b.mask)return null;const d=a.bits^b.bits;if(d&&(d&(d-1))===0)return{bits:a.bits&~d,mask:a.mask|d};return null;}
function covers(imp,m){return (m&~imp.mask)===imp.bits;}
function primeImplicants(minterms,dc){
  const all=[...new Set([...minterms,...(dc||[])])];
  let groups=all.map(m=>({bits:m,mask:0}));
  const primes=[],seen=new Set();const key=i=>i.bits+'/'+i.mask;
  while(groups.length){
    const used=new Array(groups.length).fill(false);const next=[],nseen=new Set();
    for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){
      const c=combine(groups[i],groups[j]);
      if(c){used[i]=used[j]=true;const k=key(c);if(!nseen.has(k)){nseen.add(k);next.push(c);}}}
    for(let i=0;i<groups.length;i++)if(!used[i]){const k=key(groups[i]);if(!seen.has(k)){seen.add(k);primes.push(groups[i]);}}
    groups=next;
  }
  return primes;
}
function litCost(imp,n){return n-popcount(imp.mask);}
function minimize(minterms,n,dc){
  const MT=[...new Set(minterms)].sort((a,b)=>a-b);
  if(MT.length===0)return{terms:[],cost:0,nterms:0,special:'0'};
  const full=1<<n;
  if(MT.length===full)return{terms:[{bits:0,mask:full-1}],cost:0,nterms:1,special:'1'};
  const primes=primeImplicants(MT,dc);
  const P=primes.length, need=(1<<MT.length)-1;
  const pcov=primes.map(pi=>{let cm=0;MT.forEach((m,i)=>{if(covers(pi,m))cm|=1<<i;});return cm;});
  let best=null;
  for(let sub=0;sub<(1<<P);sub++){
    let cov=0,cost=0,cnt=0;
    for(let k=0;k<P;k++)if(sub&(1<<k)){cov|=pcov[k];cost+=litCost(primes[k],n);cnt++;}
    if(cov===need){if(!best||cost<best.cost||(cost===best.cost&&cnt<best.nterms))best={sub,cost,nterms:cnt};}
  }
  const chosen=[];for(let k=0;k<P;k++)if(best.sub&(1<<k))chosen.push(primes[k]);
  return{terms:chosen,cost:best.cost,nterms:chosen.length};
}
function termStr(imp,n){let s='';for(let v=0;v<n;v++){const p=1<<(n-1-v);if(imp.mask&p)continue;s+=VN[v]+((imp.bits&p)?'':'′');}return s||'1';}
function sopStr(terms,n){if(!terms.length)return '0';return terms.map(t=>termStr(t,n)).join(' + ');}
function evalTerms(terms,m){for(const t of terms)if(covers(t,m))return 1;return 0;}
function canonList(mts){return mts.map(m=>({bits:m,mask:0}));}
function gateCost(terms,n){
  if(terms.length===1&&terms[0].mask===(1<<n)-1)return{and:0,or:0,inv:0,tot:0};   // constante 1
  if(terms.length===0)return{and:0,or:0,inv:0,tot:0};                              // constante 0
  let and=0;const invSet=new Set();
  for(const t of terms){const l=litCost(t,n);if(l>=2)and++;
    for(let v=0;v<n;v++){const p=1<<(n-1-v);if(t.mask&p)continue;if(!(t.bits&p))invSet.add(v);}}
  const or=terms.length>=2?1:0;
  return{and,or,inv:invSet.size,tot:and+or};
}

// ===================== 3. GEOMETRÍA DEL MAPA (código Gray) =====================
function grayList(bits){return bits===1?[0,1]:[0,1,3,2];}          // 1 o 2 bits
function kmapDims(n){return n===2?{rb:1,cb:1}:(n===3?{rb:1,cb:2}:{rb:2,cb:2});}
function mtOf(n,r,c){const d=kmapDims(n);const rg=grayList(d.rb),cg=grayList(d.cb);return rg[r]*(1<<d.cb)+cg[c];}
function nRows(n){return 1<<kmapDims(n).rb;}
function nCols(n){return 1<<kmapDims(n).cb;}
function grayBits(v,bits){return bits===1?String(v):(v.toString(2).padStart(2,'0'));}

// ===================== 4. ESTADO =====================
let mode='explora';
// Explora — construyes la función
let expN=3, expSet=new Set([3,5,6,7]);       // mayoría 2-de-3 como arranque
// Agrupa — presets con agrupaciones bonitas
const AGRUPA_POOL=[
  {n:3, mts:[3,5,6,7],                       nm:'Mayoría (votación 2 de 3)'},
  {n:4, mts:[0,2,5,7,8,10,13,15],            nm:'Coincidencia de dos bits (XNOR B,D)'},
  {n:4, mts:[0,4,5,7,8,12,13,15],            nm:'Habilitación con dos condiciones'},
  {n:4, mts:[0,1,2,3,5,7,8,10,14,15],        nm:'Función combinada (grupos de distinto tamaño)'},
  {n:3, mts:[1,2,4,7],                        nm:'Paridad impar (XOR) — no simplifica'},
];
let agIdx=0, agSpot=-1;                        // agSpot=-1: todos los grupos; ≥0: enfoca uno
// Reto — elige los implicantes primos que cubren la función al mínimo coste
const RETO_POOL=[
  {n:3, mts:[0,1,2,5],                        ctx:'Lógica de un semáforo de prioridad'},
  {n:3, mts:[1,2,3,4,5],                      ctx:'Control de acceso de 3 sensores'},
  {n:3, mts:[2,3,4,5,7],                      ctx:'Selector de modo de operación'},
  {n:4, mts:[2,3,5,7,8,9,10,11,13],          ctx:'Enclavamiento de seguridad (4 señales)'},
  {n:4, mts:[0,1,2,5,8,9,10],                ctx:'Decodificador parcial de dirección'},
  {n:4, mts:[0,1,2,5,6,7,8,9,10,14],         ctx:'Lógica de habilitación de 4 entradas'},
  {n:3, mts:[0,1,3,7],                        ctx:'Demostración del recorrido guiado'},   // SOLO la usa el recorrido: nunca se sortea
];
const RETO_N=RETO_POOL.length-1, RETO_DEMO=RETO_POOL.length-1;   // los retos reales son los primeros RETO_N
let retoIdx=0, retoPIs=[], retoSel=new Set(), retoChecked=false, retoOkCover=false, retoOkMin=false, retoSolved=false, retoMsg='';
let intentos=0, demoShow=false;      // intentos fallidos con el caso actual (3 → caso nuevo) · demoShow: veredicto de DEMOSTRACIÓN sin tocar el reto
let solved=false, autoRunning=false, QUIZ={};
// entrenador 3D — cicla las entradas y enciende el LED de salida
let hwInput=0, hwT=0;

function curFn(){                              // función activa según el modo
  if(mode==='agrupa'){const f=AGRUPA_POOL[agIdx];return{n:f.n,mts:[...f.mts]};}
  if(mode==='reto'){const f=RETO_POOL[retoIdx];return{n:f.n,mts:[...f.mts]};}
  return{n:expN,mts:[...expSet].sort((a,b)=>a-b)};
}
function seedReto(idx){
  retoIdx=(idx==null)?pickIdx(RETO_N,retoIdx):idx;
  const f=RETO_POOL[retoIdx];
  retoPIs=primeImplicants(f.mts,[]);
  retoSel=new Set(); retoChecked=false; retoOkCover=false; retoOkMin=false; retoSolved=false; retoMsg=''; intentos=0;
}
// El reto «cubre esta Σm» no puede resolverse tecleando la misma función en Explora (la telemetría da la forma mínima):
// si Explora coincide con el caso del reto sin resolver, el reto se resiembra con otro caso.
function guardaReto(){
  if(mode==='reto'||retoSolved||retoIdx===RETO_DEMO||autoRunning)return;
  const f=RETO_POOL[retoIdx];
  if(f.n!==expN||f.mts.length!==expSet.size||!f.mts.every(m=>expSet.has(m)))return;
  seedReto();updateRetoSpec();
  showToast('🔀 Esa función era la del reto: se renovó el caso. El reto se resuelve sin la respuesta a la vista.');
}
function pickIdx(n,ex){let v=Math.floor(Math.random()*n);if(n>1)while(v===ex)v=Math.floor(Math.random()*n);return v;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
seedReto(0);

// ===================== 5. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
const MAT={bench:brush(0x2b2f34),frame:brush(0x22262c),leg:brush(0x14161b),pcb:std(0x123322,0.7,0.15),chip:std(0x14171b,0.5,0.3)};
const ACC='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A';
const GRP=['#8AB4F8','#7CD992','#E9C46A','#F28B82','#C58AF9','#6DD3C4','#F5A97F','#B0C4B1'];

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

// ===================== 6. PIZARRÓN (TABLA · MAPA · EXPRESIÓN) =====================
const boardG=new THREE.Group();
boardG.position.set(-1.15,0,-0.95);boardG.rotation.y=0.2;scene.add(boardG);
const frame=roundedBox(3.9,2.9,0.12,MAT.frame,0.06);frame.position.set(0,1.9,0);boardG.add(frame);
[-1.65,1.65].forEach(x=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.9,16),MAT.leg);leg.position.set(x,0.92,0);boardG.add(leg);});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.68,2.72),new THREE.MeshBasicMaterial({map:bTex}));
board.position.set(0,1.9,0.065);boardG.add(board);
frame.userData={title:'Tabla · Mapa de Karnaugh · Expresión',info:'La misma función vista de tres formas · toca para inspeccionar'};
addHoverLabel(frame,'Mapa de Karnaugh',ACC,new THREE.Vector3(0,3.5,0.1).add(boardG.position),1.9);

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

// ---- tabla de verdad ----
function drawTruth(c,fn,x0,y0,probe){
  const {n,mts}=fn, N=1<<n, set=new Set(mts);
  const cols=1+n+1;                              // idx + vars + F
  const cw=[34, ...Array(n).fill(22), 30];
  const W=cw.reduce((a,b)=>a+b,0), rh=Math.min(30,(560/(N+1)));
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';
  c.fillText('TABLA DE VERDAD',x0+W/2,y0-10);
  // encabezado
  let cx=x0;const hdr=['#',...VN.slice(0,n),'F'];
  c.font='bold 12px Outfit, sans-serif';
  for(let i=0;i<cols;i++){c.fillStyle=i===cols-1?ACC:'#9fb0cf';c.fillText(hdr[i],cx+cw[i]/2,y0+rh*0.7);cx+=cw[i];}
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.beginPath();c.moveTo(x0,y0+rh*0.95);c.lineTo(x0+W,y0+rh*0.95);c.stroke();
  for(let m=0;m<N;m++){
    const yy=y0+rh*(m+1), F=set.has(m)?1:0, hot=(m===probe);
    if(hot){c.fillStyle=hexA(ACC,0.16);c.fillRect(x0,yy+rh*0.12,W,rh);}
    cx=x0;
    c.font='12px Outfit, sans-serif';c.textAlign='center';
    c.fillStyle='#6f7887';c.fillText(m,cx+cw[0]/2,yy+rh*0.75);cx+=cw[0];
    for(let v=0;v<n;v++){const b=(m>>(n-1-v))&1;c.fillStyle=b?'#C9D3E2':'#5a6472';c.fillText(b,cx+cw[v+1]/2,yy+rh*0.75);cx+=cw[v+1];}
    c.fillStyle=F?OK_HEX:'#4a525e';c.font='bold 13px Outfit, sans-serif';c.fillText(F,cx+cw[cols-1]/2,yy+rh*0.75);
  }
  return {W,H:rh*(N+1)};
}

// ---- mapa de Karnaugh ----
function kmGeom(fn,x0,y0,cell){
  const R=nRows(fn.n), C=nCols(fn.n);
  return {R,C,x0,y0,cell, cellXY:(r,c)=>[x0+c*cell,y0+r*cell]};
}
function drawKmap(c,fn,G,groups,spot){
  const {n,mts}=fn, set=new Set(mts), d=kmapDims(n);
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';
  c.fillText('MAPA DE KARNAUGH',G.x0+G.C*G.cell/2,G.y0-34);
  // etiquetas de columnas (variables bajas)
  const colVars=VN.slice(n-d.cb,n).join(''), rowVars=VN.slice(0, d.rb).join('');
  c.fillStyle=ACC;c.font='bold 13px Outfit, sans-serif';
  c.fillText(colVars,G.x0+G.C*G.cell/2,G.y0-12);
  c.save();c.translate(G.x0-42,G.y0+G.R*G.cell/2);c.rotate(-Math.PI/2);c.fillText(rowVars,0,0);c.restore();
  const cg=grayList(d.cb), rg=grayList(d.rb);
  // etiquetas gray de columnas (encima de cada columna)
  c.font='12px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.textAlign='center';
  for(let cc=0;cc<G.C;cc++)c.fillText(grayBits(cg[cc],d.cb),G.x0+cc*G.cell+G.cell/2,G.y0-6);
  // celdas
  for(let r=0;r<G.R;r++)for(let cc=0;cc<G.C;cc++){
    const [x,y]=G.cellXY(r,cc), m=mtOf(n,r,cc), F=set.has(m);
    c.fillStyle=F?'rgba(124,217,146,0.10)':'rgba(255,255,255,0.02)';
    c.fillRect(x,y,G.cell,G.cell);
    c.strokeStyle='rgba(255,255,255,0.14)';c.lineWidth=1;c.strokeRect(x,y,G.cell,G.cell);
    c.fillStyle=F?OK_HEX:'#4a525e';c.font='bold 22px Outfit, sans-serif';c.textAlign='center';c.textBaseline='middle';
    c.fillText(F?'1':'0',x+G.cell/2,y+G.cell*0.42);
    c.fillStyle='#5a6472';c.font='10px Outfit, sans-serif';c.textBaseline='alphabetic';
    c.fillText('m'+m,x+G.cell/2,y+G.cell-8);
  }
  // etiquetas gray de filas (izquierda)
  c.textAlign='right';c.font='12px Outfit, sans-serif';c.fillStyle='#9fb0cf';
  for(let r=0;r<G.R;r++)c.fillText(grayBits(rg[r],d.rb),G.x0-8,G.y0+r*G.cell+G.cell/2+4);
  // grupos
  if(groups&&groups.length)drawGroups(c,fn,G,groups,spot);
}
// dibuja cada implicante como uno o más rectángulos redondeados (componentes planos = tramos sin wrap)
function drawGroups(c,fn,G,groups,spot){
  groups.forEach((imp,gi)=>{
    if(spot!=null && spot>=0 && spot!==gi) return;
    const col=GRP[gi%GRP.length];
    const cells=[];
    for(let r=0;r<G.R;r++)for(let cc=0;cc<G.C;cc++)if(covers(imp,mtOf(fn.n,r,cc)))cells.push([r,cc]);
    const seen=new Set(),key=(r,cc)=>r+'_'+cc;
    for(const [r0,c0] of cells){
      if(seen.has(key(r0,c0)))continue;
      // flood-fill planar (4-vecinos, sin wrap)
      const stack=[[r0,c0]],comp=[];seen.add(key(r0,c0));
      while(stack.length){const [r,cc]=stack.pop();comp.push([r,cc]);
        [[r-1,cc],[r+1,cc],[r,cc-1],[r,cc+1]].forEach(([nr,nc])=>{
          if(nr<0||nc<0||nr>=G.R||nc>=G.C)return;
          if(seen.has(key(nr,nc)))return;
          if(cells.some(e=>e[0]===nr&&e[1]===nc)){seen.add(key(nr,nc));stack.push([nr,nc]);}});}
      let rmin=99,rmax=-1,cmin=99,cmax=-1;
      comp.forEach(([r,cc])=>{rmin=Math.min(rmin,r);rmax=Math.max(rmax,r);cmin=Math.min(cmin,cc);cmax=Math.max(cmax,cc);});
      const pad=6+gi*4;
      const x=G.x0+cmin*G.cell+pad, y=G.y0+rmin*G.cell+pad;
      const w=(cmax-cmin+1)*G.cell-2*pad, h=(rmax-rmin+1)*G.cell-2*pad, rad=14;
      c.strokeStyle=col;c.lineWidth=(spot===gi)?4:2.6;c.globalAlpha=(spot!=null&&spot>=0&&spot!==gi)?0.25:1;
      c.beginPath();
      c.moveTo(x+rad,y);c.arcTo(x+w,y,x+w,y+h,rad);c.arcTo(x+w,y+h,x,y+h,rad);
      c.arcTo(x,y+h,x,y,rad);c.arcTo(x,y,x+w,y,rad);c.closePath();c.stroke();
      c.globalAlpha=1;
    }
  });
}

// ---- expresión + coste (panel derecho) ----
const PX={x:706,y:70,w:300};
function exprPanel(c,fn){
  const {n,mts}=fn, res=minimize(mts,n,[]), gm=gateCost(res.terms,n);
  const canon=canonList(mts), gc=gateCost(canon,n), cLit=mts.length*n;
  const minSop=res.special||sopStr(res.terms,n);
  const isConst=(res.special==='0'||res.special==='1');
  rpanel(c,PX.x,PX.y,PX.w,150,'EXPRESIÓN');
  c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Canónica (suma de mintérminos):',PX.x+14,PX.y+52);
  c.fillStyle='#C9D3E2';c.font='13px Outfit, sans-serif';
  const sm = mts.length? ('Σm('+mts.join(',')+')') : 'F = 0';
  wrapText(c,sm,PX.x+14,PX.y+72,PX.w-28,16);
  c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';
  c.fillText('Mínima (Karnaugh / Q-M):',PX.x+14,PX.y+108);
  c.fillStyle=ACC;c.font='bold 16px Outfit, sans-serif';
  wrapText(c,'F = '+minSop,PX.x+14,PX.y+130,PX.w-28,20);
  // tabla de coste
  const ty=PX.y+168;
  rpanel(c,PX.x,ty,PX.w,150,'COSTE  (canónica → mínima)');
  const rowY=ty+58;
  const rowsC=[
    ['Literales', cLit, res.cost],
    ['Términos', mts.length, res.nterms],
    ['Compuertas AND-OR', gc.tot, gm.tot],
    ['Inversores', gc.inv, gm.inv],
  ];
  c.font='13px Outfit, sans-serif';
  c.fillStyle='#8f97a5';c.textAlign='right';c.fillText('canónica',PX.x+PX.w-96,rowY-24);
  c.fillStyle=OK_HEX;c.textAlign='right';c.fillText('mínima',PX.x+PX.w-16,rowY-24);
  rowsC.forEach((rw,i)=>{
    const yy=rowY+i*22;
    c.fillStyle='#8f97a5';c.font='13px Outfit, sans-serif';c.textAlign='left';c.fillText(rw[0],PX.x+14,yy);
    c.fillStyle='#8f97a5';c.textAlign='right';c.fillText(rw[1],PX.x+PX.w-96,yy);
    const better=rw[2]<rw[1];
    c.fillStyle=better?OK_HEX:(rw[2]===rw[1]?'#C9D3E2':WARN_HEX);c.font='bold 14px Outfit, sans-serif';
    c.fillText(rw[2],PX.x+PX.w-16,yy);
  });
  const saved=cLit-res.cost, pct=cLit? Math.round(100*saved/cLit):0;
  return {res,gm,gc,cLit,saved,pct,isConst,minSop};
}

// ---- vista por modo ----
function drawExplora(c){
  const fn=curFn();
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';
  c.fillText('EXPLORA · construye la función  ('+fn.n+' variables)',30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  c.fillText('Enciende salidas en la tabla y mira cómo se llena el mapa y cómo cambia la forma mínima. La celda resaltada es la que prueba el entrenador 3D.',30,64);
  drawTruth(c,fn,30,110,hwInput);
  const cell=fn.n===4?86:104, kx=fn.n===4?300:320, ky=fn.n===4?170:210;
  const G=kmGeom(fn,kx,ky,cell);
  drawKmap(c,fn,G,null,null);
  const info=exprPanel(c,fn);
  const by=PX.y+330;
  c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,200);
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,200);
  c.fillStyle=info.saved>0?OK_HEX:WARN_HEX;c.font='bold 15px Outfit, sans-serif';c.textAlign='left';
  c.fillText(info.saved>0?('Ahorro: '+info.saved+' literales ('+info.pct+'%)'):'Sin ahorro posible',PX.x+14,by+26);
  c.fillStyle='#C9D3E2';c.font='12px Outfit, sans-serif';
  let msg;
  if(info.res.special==='0')msg='La función es constante 0: nunca vale 1. No requiere lógica.';
  else if(info.res.special==='1')msg='La función es constante 1: siempre vale 1. No requiere lógica.';
  else if(info.saved>0)msg='Agrupar unos adyacentes elimina variables: la forma mínima usa '+info.res.cost+' literales frente a '+info.cLit+' de la canónica. Menos literales = menos y más pequeñas compuertas.';
  else msg='Esta función no simplifica: sus unos no son adyacentes en el mapa (p. ej. una paridad/XOR). La forma mínima coincide con la canónica — la honestidad del método: no todo se reduce.';
  wrapText(c,msg,PX.x+14,by+50,PX.w-28,17);
}
function drawAgrupa(c){
  const fn=curFn(), res=minimize(fn.mts,fn.n,[]);
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';
  c.fillText('AGRUPA · '+AGRUPA_POOL[agIdx].nm,30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  c.fillText('Cada lazo agrupa 2^k unos adyacentes y elimina las k variables que cambian dentro del lazo. Enfoca un grupo para ver qué variables sobreviven.',30,64);
  drawTruth(c,fn,30,110,-1);
  const cell=fn.n===4?86:104, kx=fn.n===4?300:320, ky=fn.n===4?170:210;
  const G=kmGeom(fn,kx,ky,cell);
  drawKmap(c,fn,G,res.terms,agSpot);
  exprPanel(c,fn);
  // leyenda de grupos + explicación
  const by=PX.y+330;
  c.fillStyle='rgba(0,0,0,0.22)';c.fillRect(PX.x,by,PX.w,200);
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,200);
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';c.fillText('GRUPOS (implicantes primos)',PX.x+14,by+24);
  if(res.special){c.fillStyle='#C9D3E2';c.font='12px Outfit, sans-serif';wrapText(c,'Función constante '+res.special+': sin grupos.',PX.x+14,by+48,PX.w-28,16);return;}
  res.terms.forEach((t,i)=>{
    const yy=by+48+i*22, foc=(agSpot===i);
    c.fillStyle=GRP[i%GRP.length];c.globalAlpha=(agSpot>=0&&!foc)?0.4:1;
    c.fillRect(PX.x+14,yy-10,14,14);c.globalAlpha=1;
    const size=1<<popcount(t.mask), drop=popcount(t.mask);
    c.fillStyle=foc?'#F4EFEA':'#C9D3E2';c.font=(foc?'bold ':'')+'13px Outfit, sans-serif';c.textAlign='left';
    c.fillText(termStr(t,fn.n)+'  ('+size+' celdas, '+drop+' var. eliminada'+(drop===1?'':'s')+')',PX.x+34,yy+2);
  });
  if(agSpot>=0&&res.terms[agSpot]){
    const t=res.terms[agSpot], kept=[];for(let v=0;v<fn.n;v++){const p=1<<(fn.n-1-v);if(!(t.mask&p))kept.push(VN[v]+((t.bits&p)?'=1':'=0'));}
    c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';
    wrapText(c,'En este lazo se mantienen constantes '+kept.join(', ')+' → término '+termStr(t,fn.n)+'.',PX.x+14,by+48+res.terms.length*22+12,PX.w-28,16);
  }
}
function drawReto(c){
  const f=RETO_POOL[retoIdx], fn={n:f.n,mts:[...f.mts]};
  const res=minimize(fn.mts,fn.n,[]);
  const selTerms=[...retoSel].map(i=>retoPIs[i]);
  c.fillStyle='#C7D6F5';c.font='bold 21px Outfit, sans-serif';c.textAlign='left';
  c.fillText('RETO · cubre la función al MÍNIMO coste',30,42);
  c.fillStyle='#7a8494';c.font='13px Outfit, sans-serif';
  c.fillText('Selecciona los implicantes primos (abajo) que cubran TODOS los unos usando el mínimo de literales. '+f.ctx+'.',30,64);
  drawTruth(c,fn,30,110,-1);
  const cell=fn.n===4?86:104, kx=fn.n===4?300:320, ky=fn.n===4?170:210;
  const G=kmGeom(fn,kx,ky,cell);
  drawKmap(c,fn,G,selTerms,null);
  // panel: tu cobertura vs mínimo
  const selCost=selTerms.reduce((a,t)=>a+litCost(t,fn.n),0);
  const covered=new Set();selTerms.forEach(t=>fn.mts.forEach(m=>{if(covers(t,m))covered.add(m);}));
  const allCov=fn.mts.every(m=>covered.has(m));
  rpanel(c,PX.x,PX.y,PX.w,150,'TU COBERTURA');
  prow(c,PX.x,PX.y+58,PX.w,'Implicantes elegidos',String(retoSel.size));
  prow(c,PX.x,PX.y+90,PX.w,'Unos cubiertos',covered.size+' / '+fn.mts.length, allCov?OK_HEX:WARN_HEX);
  prow(c,PX.x,PX.y+122,PX.w,'Literales elegidos',String(selCost));   // sin «→ mín.»: el veredicto llega con «Comprobar»
  // veredicto (solo tras comprobar; en la demostración se dibuja sin tocar el estado del reto)
  const by=PX.y+168;
  const vCh=retoChecked||demoShow;
  const vCov=demoShow?allCov:retoOkCover, vMin=demoShow?(allCov&&selCost===res.cost):retoOkMin, vSol=demoShow?(vCov&&vMin):retoSolved;
  if(vCh){
    c.fillStyle='rgba(0,0,0,0.24)';c.fillRect(PX.x,by,PX.w,360);
    c.strokeStyle=vSol?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(PX.x,by,PX.w,360);
    c.fillStyle=vSol?OK_HEX:BAD_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
    c.fillText(vSol?(demoShow?'✔ CORRECTO (demostración)':'✔ CORRECTO'):'✗ REVISA',PX.x+14,by+26);
    c.font='bold 13px Outfit, sans-serif';
    c.fillStyle=vCov?OK_HEX:BAD_HEX;c.fillText((vCov?'✔':'✗')+' Cubre todos los unos',PX.x+14,by+54);
    c.fillStyle=vMin?OK_HEX:BAD_HEX;c.fillText((vMin?'✔ Coste mínimo ('+res.cost+' literales)':'✗ Coste mínimo'),PX.x+14,by+78);
    c.fillStyle='#C9D3E2';c.font='12px Outfit, sans-serif';wrapText(c,retoExplain(fn,res,selTerms,allCov,selCost,vSol),PX.x+14,by+106,PX.w-28,17);
    if(!demoShow){c.fillStyle='#7a8494';c.fillText('Intentos fallidos con esta función: '+intentos+' / 3',PX.x+14,by+344);}
  }else{
    c.fillStyle='rgba(0,0,0,0.20)';c.fillRect(PX.x,by,PX.w,360);
    c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(PX.x,by,PX.w,360);
    c.fillStyle=WARN_HEX;c.font='13px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,'Un implicante primo es el mayor grupo posible de unos adyacentes. Elige los que, juntos, tapan todos los 1 con el menor coste. Elegir de más (redundante) o grupos pequeños sube el coste.',PX.x+14,by+26,PX.w-28,18);
    c.fillStyle='#7a8494';c.font='12px Outfit, sans-serif';
    wrapText(c,'Marca implicantes abajo y pulsa "Comprobar". Tras 3 intentos fallidos la función se renueva.',PX.x+14,by+120,PX.w-28,18);
    c.fillText('Intentos fallidos con esta función: '+intentos+' / 3',PX.x+14,by+344);
  }
}
function retoExplain(fn,res,selTerms,allCov,selCost,sol){
  if(sol) return 'Cobertura mínima: '+sopStr(selTerms,fn.n)+' cubre los '+fn.mts.length+' unos con '+res.cost+' literales, el mínimo posible.';
  // Retroalimentación cualitativa: solo lo que el alumno puede razonar con lo que ve (no la cifra mínima ni los términos)
  if(!allCov){
    const cub=new Set();selTerms.forEach(t=>fn.mts.forEach(m=>{if(covers(t,m))cub.add(m);}));
    const falta=fn.mts.filter(m=>!cub.has(m)).length;
    return 'Te '+(falta===1?'queda':'quedan')+' '+falta+' uno'+(falta===1?'':'s')+' sin cubrir en el mapa: elige un implicante primo que los tape.';
  }
  const redund=selTerms.some((t,i)=>fn.mts.every(m=>!covers(t,m)||selTerms.some((u,j)=>j!==i&&covers(u,m))));
  return redund
    ?'Cubres todos los unos, pero alguno de tus implicantes es redundante: todos sus unos ya los tapan los demás. Quita los que sobren.'
    :'Cubres todos los unos y ningún implicante sobra, pero otra combinación de implicantes primos cuesta menos literales. Compara cuántos unos tapa cada grupo y cuántos literales aporta.';
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='agrupa')drawAgrupa(c);else if(mode==='reto')drawReto(c);else drawExplora(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='agrupa')showToast('🔷 Cada lazo de color agrupa 2^k unos vecinos y elimina k variables. Usa "Enfocar grupo" para ver qué variables sobreviven en cada término.');
  else if(mode==='reto')showToast('🎯 Los rectángulos son los implicantes que marcaste. Deben tapar TODOS los unos con el menor número de literales posible.');
  else showToast('📊 La tabla, el mapa y la expresión son la MISMA función. Enciende salidas y observa cómo el mapa y la forma mínima cambian al instante.');
}

// ===================== 7. ESCENA 3D: ENTRENADOR LÓGICO =====================
// Entrenador lógico de banco (biblioteca de piezas §19): protoboard con 74HC04 (NOT), 74HC08 (AND) y 74HC32 (OR) —la realización AND-OR
// de dos niveles—, interruptores A…D, LED de entrada y de salida F, display de 7 segmentos con el mintérmino y pantalla de la función.
const MATP={aluminio:std(0xb6bdc4,0.42,0.7),acero:std(0x8f979f,0.38,0.85),cromo:std(0xc4cad0,0.3,0.9),cobre:std(0xb87333,0.4,0.8),
  negro:std(0x14181e,0.62,0.06),goma:std(0x14181e,0.85,0.02),blanco:std(0xd7dee6,0.4,0.2),ceramica:std(0xd7dee6,0.6,0.05),hierro:std(0x4a4f55,0.55,0.7),chapa:std(0x9aa2aa,0.5,0.6)};
const TR=P3.entrenadorLogico(MATP,{cols:26,nLed:5,nSw:4,nDisp:1,pantalla:{ancho:1.0,alto:1.0},dispAlto:0.74,
  ledColores:[0x8AB4F8,0x8AB4F8,0x8AB4F8,0x8AB4F8,0x7CD992],ledRotulos:['A','B','C','D','F'],swRotulos:['A','B','C','D'],
  rotulo:'ENTRENADOR LÓGICO',serie:'74HC04 · 08 · 32',pantallaRotulo:'FUNCIÓN',dispColor:0xff4a35});
TR.scale.setScalar(0.92);TR.position.set(1.0,0,0.9);scene.add(TR);
const TU=TR.userData;
TR.userData=Object.assign(TU,{title:'Banco del entrenador lógico',info:'Aplica la función: entradas → circuito → salida.'});
{ // 74HC04 (NOT), 74HC08 (AND) y 74HC32 (OR): una realización AND-OR decorativa, F = A'·B + C·D, con su Vcc, GND, entradas y salida
  const c1=2,c2=10,c3=18,rl=TU.prot.userData.riel;
  TU.dip(c1,{pines:14,rotulo:'74HC04',rotulo2:'NOT ×6'});
  TU.dip(c2,{pines:14,rotulo:'74HC08',rotulo2:'AND ×4'});
  TU.dip(c3,{pines:14,rotulo:'74HC32',rotulo2:'OR ×4'});
  [c1,c2,c3].forEach((c,i)=>{
    TU.cable([c,'j'],rl('+','tras',1+i*7),0xb83232);                              // pata 14 (Vcc)
    TU.cable([c+6,'a'],rl('-','tras',3+i*7),0x2a2e34);                            // pata 7 (GND)
  });
  TU.cable([c1+1,'c'],[c2,'c'],0x2f8f56);                                         // A' (salida de la NOT) → entrada de la AND
  TU.cable([c2+2,'d'],[c3,'d'],0x2f8f56);                                         // A'·B → OR
  TU.cable([c2+5,'c'],[c3+1,'c'],0x2f8f56);                                       // C·D → OR
  TU.hilo(TU.swJack(0),TU.Hg(c1,'a'),0xc9a227,{alto:0.32});                       // A → NOT
  TU.hilo(TU.swJack(1),TU.Hg(c2+1,'a'),0xc9a227,{alto:0.32});                     // B → AND
  TU.hilo(TU.swJack(2),TU.Hg(c2+3,'a'),0xc9a227,{alto:0.32});                     // C → AND
  TU.hilo(TU.swJack(3),TU.Hg(c2+4,'a'),0xc9a227,{alto:0.32});                     // D → AND
  [[c1,0],[c2+1,1],[c2+3,2],[c2+4,3]].forEach(([col,i])=>TU.hilo(TU.Hg(col,'b'),TU.ledJack(i),0x2f6fc0,{alto:0.32}));   // LED de entrada
  TU.hilo(TU.Hg(c3+2,'a'),TU.ledJack(4),0x2f8f56,{alto:0.32});                    // F (salida de la OR)
}
// compatibilidad con el resto del lab: los mismos nombres que usaba la placa anterior
const inLEDs=TU.leds.slice(0,4), outLED=TU.leds[4];
const HEX7=[[1,1,1,1,1,1,0],[0,1,1,0,0,0,0],[1,1,0,1,1,0,1],[1,1,1,1,0,0,1],[0,1,1,0,0,1,1],[1,0,1,1,0,1,1],[1,0,1,1,1,1,1],[1,1,1,0,0,0,0],
  [1,1,1,1,1,1,1],[1,1,1,1,0,1,1],[1,1,1,0,1,1,1],[0,0,1,1,1,1,1],[1,0,0,1,1,1,0],[0,1,1,1,1,0,1],[1,0,0,1,1,1,1],[1,0,0,0,1,1,1]];   // 0…F (a…g)
const chCv=document.createElement('canvas');chCv.width=160;chCv.height=160;const chTex=new THREE.CanvasTexture(chCv);
chTex.colorSpace=THREE.SRGBColorSpace;chTex.anisotropy=8;TU.pantalla.material.map=chTex;TU.pantalla.material.color.setHex(0xffffff);TU.pantalla.material.needsUpdate=true;
TU.pantalla.userData={title:'Circuito lógico',info:'Realiza la función mínima F(A,B,C,D).'};
TU.disp[0].userData=Object.assign(TU.disp[0].userData,{title:'Mintérmino actual',info:'La combinación de entrada ABCD en hexadecimal (m0…m15).'});
addHoverLabel(TR,'Entrenador lógico',ACC,new THREE.Vector3(1.0,2.05,1.0),1.2);
outLED.userData={title:'Salida F',info:'Se enciende cuando la función vale 1 para la combinación de entrada actual.'};
inLEDs[0].userData={title:'Entradas A…D',info:'La combinación de entrada que se está aplicando (A es el bit más significativo).'};
function drawChip(fn,input,F){
  const c=chCv.getContext('2d');c.clearRect(0,0,160,160);
  c.fillStyle='#14171b';c.fillRect(0,0,160,160);   // fondo opaco: el material de la pantalla ignora el alfa
  if(F){c.fillStyle='rgba(124,217,146,0.18)';c.fillRect(0,0,160,160);}
  c.strokeStyle=F?OK_HEX:hexA(ACC,0.5);c.lineWidth=4;c.strokeRect(4,4,152,152);
  c.fillStyle='#C7D6F5';c.font='bold 15px Outfit, sans-serif';c.textAlign='center';c.fillText('F(A..'+VN[fn.n-1]+')',80,30);
  c.font='bold 34px Outfit, sans-serif';c.fillStyle=F?OK_HEX:'#5a6472';c.fillText('F='+F,80,86);
  let bits='';for(let v=0;v<fn.n;v++)bits+=((input>>(fn.n-1-v))&1);
  c.font='16px Outfit, sans-serif';c.fillStyle='#9fb0cf';c.fillText('m'+input+' = '+bits,80,124);
  chTex.needsUpdate=true;
}
function updateHW(){
  const fn=curFn();const N=1<<fn.n;hwInput=hwInput%N;
  const set=new Set(fn.mts), F=set.has(hwInput)?1:0;
  inLEDs.forEach((l,i)=>{const on=(i<fn.n)&&(((hwInput>>(fn.n-1-i))&1)===1);
    l.visible=(i<fn.n);l.material.emissiveIntensity=on?0.95:0.12;l.material.color.setHex(on?0x8AB4F8:0x2a3550);});
  outLED.material.emissiveIntensity=F?0.95:0.12;outLED.material.color.setHex(F?0x7CD992:0x243026);
  // interruptores y display: reflejan la combinación de entrada ABCD (A = bit más significativo; con n<4 las altas quedan en 0)
  for(let k=0;k<4;k++){const bit=3-k-(4-fn.n);TU.sw[k].userData.pon(bit>=0?((hwInput>>bit)&1):0);}
  TU.disp[0].userData.ponSeg(HEX7[hwInput&15],0.8,0xff4a35);
  drawChip(fn,hwInput,F);
}

// ===================== 8. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Sistemas digitales (D3) · Álgebra de Boole · Diseño combinacional</div>
  <h2>Síntesis Lógica y Simplificación con Mapas de Karnaugh</h2>
  <p>Una función lógica queda totalmente definida por su <b>tabla de verdad</b>. Escribirla directamente como
  <b>suma de mintérminos</b> (un producto por cada 1) funciona, pero gasta muchísima lógica. El <b>mapa de
  Karnaugh</b> reordena la tabla en una rejilla con <b>código Gray</b> —celdas vecinas difieren en un solo
  bit— de modo que <b>agrupar</b> unos adyacentes hace desaparecer las variables que cambian dentro del grupo.
  Cuanto más grande el grupo (2, 4, 8… celdas), más variables se eliminan. La forma <b>mínima</b> se obtiene
  cubriendo todos los unos con los mayores grupos posibles (implicantes primos) al menor coste en literales.
  Menos literales significa menos compuertas y más pequeñas: circuito más barato, más rápido y con menos
  consumo. Y hay una lección honesta: <b>no toda función se simplifica</b> —una paridad (XOR) no tiene celdas
  agrupables y su forma mínima es la canónica.</p>
  <div class="formula">F = Σm(mintérminos) · agrupar 2^k celdas ⇒ −k variables · coste = Σ literales · realización AND-OR de 2 niveles</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#7CD992"></span>Salida = 1 (mintérmino)</div>
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Grupo / implicante</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Coste no mínimo</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Cobertura incompleta</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la síntesis de funciones lógicas combinacionales de 2 a 4 variables a partir de su tabla de verdad; el mapa de Karnaugh con código Gray; la obtención de la forma mínima SOP mediante implicantes primos y cobertura exacta de coste mínimo (algoritmo Quine-McCluskey verificado numéricamente contra fuerza bruta, 1200/1200); el conteo de literales, términos y compuertas AND-OR de dos niveles; y la comparación canónica vs. mínima.</div>
    <div class="fl no"><b>NO modela:</b> funciones de más de 4 variables (donde el K-map deja de ser práctico y se usan métodos tabulares/software); productos de sumas (POS) y formas mixtas; condiciones "don't care" en el reto (el motor las soporta pero el reto no las usa); realizaciones multinivel o con NAND/NOR y su factorización; retardos de propagación, hazards/glitches y consumo real; ni la implementación física (compuertas TTL/CMOS específicas, tecnología del circuito).</div>
  </div>
  <div class="src">Ref: IEEE Std 91-1984 (símbolos lógicos) · Mano & Ciletti, Diseño Digital · Wakerly, Digital Design · Quine (1952)/McCluskey (1956) · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Karnaugh · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_agrupa">🔗 Agrupa</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Reto de cobertura</h4>
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
  explora:{nombre:'Explora',cam:[[4.2,3.3,5.4],[0.9,0.65,0.8]],mision:'Elige el número de variables y enciende salidas en la tabla. Observa el mapa, la forma canónica y la mínima, y cuánto se ahorra.'},
  agrupa:{nombre:'Agrupa',cam:[[4.1,3.2,5.3],[0.9,0.65,0.8]],mision:'Estudia cómo los lazos del mapa eliminan variables. Enfoca cada grupo para ver qué variables sobreviven en su término.'},
  reto:{nombre:'Reto',cam:[[4.15,3.25,5.35],[0.9,0.65,0.8]],mision:'Cubre todos los unos de la función usando implicantes primos con el mínimo coste en literales.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';let html='';
  if(mode==='explora'){
    html+=lbl('Variables:')+[2,3,4].map(v=>`<button class="b sm ${v===expN?'on':''}" data-vn="${v}">${v}</button>`).join('');
    html+=lbl('Presets:')+`<button class="b sm" data-pre="clear">Limpiar</button><button class="b sm" data-pre="full">Llenar</button><button class="b sm" data-pre="xor">Paridad</button><button class="b sm" data-pre="maj">Mayoría</button>`;
    html+=lbl('Salidas (clic = 0/1):');
    const N=1<<expN;let cells='';
    for(let m=0;m<N;m++){const on=expSet.has(m);cells+=`<button class="b sm ${on?'on':''}" data-mt="${m}" style="min-width:34px">${m}:${on?1:0}</button>`;}
    html+=cells;
    bar.innerHTML=html;
    bar.querySelectorAll('[data-vn]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expN=parseInt(b.dataset.vn,10);expSet=new Set([...expSet].filter(m=>m<(1<<expN)));synth.beep(680,0.05,0.04);hwInput=0;afterEdit();});
    bar.querySelectorAll('[data-pre]').forEach(b=>b.onclick=()=>{if(autoRunning)return;applyPreset(b.dataset.pre);synth.beep(720,0.05,0.04);afterEdit();});
    bar.querySelectorAll('[data-mt]').forEach(b=>b.onclick=()=>{if(autoRunning)return;const m=parseInt(b.dataset.mt,10);if(expSet.has(m))expSet.delete(m);else expSet.add(m);synth.beep(expSet.has(m)?900:420,0.04,0.035);afterEdit();});
  }else if(mode==='agrupa'){
    html+=lbl('Función:')+AGRUPA_POOL.map((f,i)=>`<button class="b sm ${i===agIdx?'on':''}" data-ag="${i}">${i+1}</button>`).join('');
    const res=minimize(AGRUPA_POOL[agIdx].mts,AGRUPA_POOL[agIdx].n,[]);
    html+=lbl('Enfocar grupo:')+`<button class="b sm ${agSpot===-1?'on':''}" data-spot="-1">Todos</button>`+
      res.terms.map((t,i)=>`<button class="b sm ${agSpot===i?'on':''}" data-spot="${i}">${termStr(t,AGRUPA_POOL[agIdx].n)}</button>`).join('');
    bar.innerHTML=html;
    bar.querySelectorAll('[data-ag]').forEach(b=>b.onclick=()=>{if(autoRunning)return;agIdx=parseInt(b.dataset.ag,10);agSpot=-1;synth.beep(640,0.05,0.04);hwInput=0;afterEdit();});
    bar.querySelectorAll('[data-spot]').forEach(b=>b.onclick=()=>{if(autoRunning)return;agSpot=parseInt(b.dataset.spot,10);synth.beep(760,0.05,0.04);afterEdit();});
  }else{
    const f=RETO_POOL[retoIdx];
    html+=lbl('Implicantes primos (clic = incluir):');
    html+=retoPIs.map((t,i)=>`<button class="b sm ${retoSel.has(i)?'on':''}" data-pi="${i}">${termStr(t,f.n)}</button>`).join('');
    bar.innerHTML=html;
    bar.querySelectorAll('[data-pi]').forEach(b=>b.onclick=()=>{if(autoRunning)return;const i=parseInt(b.dataset.pi,10);if(retoSel.has(i))retoSel.delete(i);else retoSel.add(i);retoChecked=false;retoSolved=false;synth.beep(retoSel.has(i)?900:420,0.04,0.035);afterEdit();});
  }
}
function applyPreset(p){
  const N=1<<expN;
  if(p==='clear')expSet=new Set();
  else if(p==='full')expSet=new Set(Array.from({length:N},(_,i)=>i));
  else if(p==='xor'){expSet=new Set();for(let m=0;m<N;m++)if(popcount(m)&1)expSet.add(m);}   // paridad impar
  else if(p==='maj'){expSet=new Set();const half=expN/2;for(let m=0;m<N;m++)if(popcount(m)>expN/2)expSet.add(m);}
  hwInput=0;
}
function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='reto'){box.style.display='none';return;}
  const f=RETO_POOL[retoIdx];box.style.display='block';
  box.innerHTML=`Función <b>F(${VN.slice(0,f.n).join(',')})</b> = Σm(${f.mts.join(',')}) — ${f.ctx}. Marca los implicantes primos que la cubran con el mínimo de literales.`;
}
function setMode(k){
  mode=k;hwInput=0;
  ['explora','agrupa','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
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
  if(mode==='reto'){seedReto();updateRetoSpec();afterEdit();solved=false;showToast('🔀 Nueva función: '+RETO_POOL[retoIdx].ctx+'. Cúbrela al mínimo coste.');}
  else if(mode==='agrupa'){agIdx=pickIdx(AGRUPA_POOL.length,agIdx);agSpot=-1;afterEdit();showToast('🔀 '+AGRUPA_POOL[agIdx].nm+'.');}
  else{expN=[2,3,4][pickIdx(3)];const N=1<<expN;expSet=new Set();for(let m=0;m<N;m++)if(Math.random()<0.5)expSet.add(m);afterEdit();showToast('🔀 Función aleatoria de '+expN+' variables. Observa su forma mínima.');}
  synth.beep(520,0.08,0.05);hwInput=0;
}

// ===================== 11. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele'),fn=curFn(),res=minimize(fn.mts,fn.n,[]),cLit=fn.mts.length*fn.n;
  if(mode==='reto'){
    const selTerms=[...retoSel].map(i=>retoPIs[i]);
    const covered=new Set();selTerms.forEach(x=>fn.mts.forEach(m=>{if(covers(x,m))covered.add(m);}));
    const selCost=selTerms.reduce((a,x)=>a+litCost(x,fn.n),0);
    t.innerHTML=teleRow('Función','Σm('+fn.mts.join(',')+')')+
      teleRow('Implicantes elegidos',String(retoSel.size))+
      teleRow('Unos cubiertos',covered.size+'/'+fn.mts.length,covered.size===fn.mts.length?'good':'warn')+
      teleRow('Literales elegidos',String(selCost))+
      teleRow('Intentos fallidos',intentos+' / 3',intentos?'warn':'')+
      teleRow('Estado',retoChecked?(retoSolved?'✔ correcto':'✗ revisa'):'elige y comprueba',(retoChecked&&retoSolved)?'good':'warn');
    return;
  }
  const gm=gateCost(res.terms,fn.n),gc=gateCost(canonList(fn.mts),fn.n);
  t.innerHTML=teleRow('Variables',String(fn.n))+
    teleRow('Mintérminos (unos)',String(fn.mts.length))+
    teleRow('Forma mínima',res.special||sopStr(res.terms,fn.n),'good')+
    teleRow('Literales (canón→mín)',cLit+' → '+res.cost,res.cost<cLit?'good':'warn')+
    teleRow('Compuertas (canón→mín)',gc.tot+' → '+gm.tot,gm.tot<gc.tot?'good':'warn');
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  const fn=curFn(),res=minimize(fn.mts,fn.n,[]),cLit=fn.mts.length*fn.n;
  if(mode==='reto'){
    html+=retoMsg||`<span class="mono">F = Σm(${fn.mts.join(',')}). Elige implicantes primos que cubran los ${fn.mts.length} unos con el mínimo de literales. Ajusta y comprueba.</span>`;
  }else if(mode==='agrupa'){
    html+=`<span class="mono">${AGRUPA_POOL[agIdx].nm}: F = ${res.special||sopStr(res.terms,fn.n)}. ${res.special?'Función constante.':(res.nterms+' grupo(s), '+res.cost+' literales frente a '+cLit+' de la canónica.')}</span>`;
  }else{
    html+=`<span class="mono">${fn.n} variables, ${fn.mts.length} unos. Mínima: F = ${res.special||sopStr(res.terms,fn.n)} (${res.cost} literales; canónica ${cLit}).</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){guardaReto();drawBoard();updateTele();updateReport();updateHW();}

// ===================== 12. RETO =====================
function updateRetoSpec(){
  const f=RETO_POOL[retoIdx],res=minimize(f.mts,f.n,[]);
  el('retoSpec').innerHTML=`F(${VN.slice(0,f.n).join(',')}) = Σm(${f.mts.join(',')}). Hay <b>${retoPIs.length}</b> implicantes primos. Elige los que cubran todos los unos con el menor número de literales y pulsa "Comprobar" (tras 3 intentos fallidos la función se renueva).`;
}
function checkReto(){
  const f=RETO_POOL[retoIdx],res=minimize(f.mts,f.n,[]);
  const selTerms=[...retoSel].map(i=>retoPIs[i]);
  const covered=new Set();selTerms.forEach(t=>f.mts.forEach(m=>{if(covers(t,m))covered.add(m);}));
  retoOkCover=f.mts.every(m=>covered.has(m)) && retoSel.size>0;
  const selCost=selTerms.reduce((a,t)=>a+litCost(t,f.n),0);
  retoOkMin=retoOkCover && (selCost===res.cost);
  retoSolved=retoOkCover&&retoOkMin;retoChecked=true;solved=retoSolved;
  synth.beep(retoSolved?1046:220,retoSolved?0.14:0.15,0.06);
  retoMsg=`<span class="mono"><span class="${retoSolved?'ok':'dtc'}">${retoSolved?'✔ Correcto':'✗ Revisa'}</span> — ${retoExplain(f,res,selTerms,retoOkCover,selCost,retoSolved)}</span>`;
  if(!retoSolved){
    intentos++;
    if(intentos>=3){
      // 3 fallos: caso nuevo (no se aprueba por eliminación) y sin revelar la solución del anterior
      seedReto();updateRetoSpec();solved=false;
      retoMsg='<span class="mono"><span class="dtc">✗ Revisa</span> — Tres intentos fallidos: la función se renovó. Analiza el mapa con calma antes de comprobar.</span>';
      showToast('🔀 Tres intentos fallidos: nueva función, '+RETO_POOL[retoIdx].ctx+'.');
      afterEdit();return;
    }
  }
  refreshAll();
}

// ===================== 13. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'En un mapa de Karnaugh, ¿por qué agrupar 2 celdas adyacentes (que difieren en un solo bit) elimina una variable del término?',
      opciones:[
        {t:'Porque en esas dos celdas la salida vale 1 con la variable en 0 y también en 1: no depende de ella y desaparece del producto.',ok:true,why:'Correcto: si F=1 con la variable en 0 y también en 1 (y el resto igual), esa variable es irrelevante en ese grupo y se elimina. Por eso el código Gray coloca vecinos que difieren en un solo bit.'},
        {t:'Porque el mapa trae siempre una variable de sobra, y al formar el primer grupo de celdas vecinas se descarta por simple convención de lectura.',ok:false,why:'No hay variables "de más": todas importan. Lo que ocurre es que dentro del grupo una variable toma ambos valores sin cambiar la salida, y solo por eso se elimina.'},
        {t:'Porque al agrupar las dos celdas se suman sus mintérminos, y esa suma anula la variable que las distingue en el producto.',ok:false,why:'No se "suman" celdas. La eliminación viene del álgebra de Boole: XY + XY′ = X, es decir, la variable que cambia (Y) se cancela.'},
        {t:'Porque las dos celdas vecinas corresponden a la misma combinación de entrada, así que una sobra y se elimina del mapa.',ok:false,why:'Son combinaciones DISTINTAS (difieren en un bit). Precisamente por diferir en una sola variable, esa variable puede eliminarse al agruparlas.'},
      ],
    },
    agrupa:{
      pregunta:'Para minimizar coste, ¿conviene usar los grupos más grandes posibles al cubrir los unos?',
      opciones:[
        {t:'Sí: un grupo de 2^k celdas elimina k variables, así que cuanto mayor es el grupo, menos literales tiene su término.',ok:true,why:'Correcto: doblar el tamaño del grupo elimina una variable más. Por eso se buscan los grupos máximos (implicantes primos) y se cubren todos los unos con los menos posibles.'},
        {t:'No: conviene usar muchos grupos pequeños, porque cada uno aporta más precisión al término y deja menos errores de lectura.',ok:false,why:'Al revés: los grupos pequeños dejan más literales por término y encarecen el circuito. Se buscan los grupos más grandes que sean válidos.'},
        {t:'Da igual el tamaño de los grupos: lo único que importa es que cada uno de los unos quede cubierto exactamente una vez.',ok:false,why:'El tamaño es clave: define cuántas variables se eliminan. Cubrir con grupos grandes reduce el coste; con grupos pequeños lo aumenta.'},
        {t:'Sí, pero solo mientras los grupos no se solapen: una celda compartida entre dos grupos siempre encarece la expresión final.',ok:false,why:'El solape está permitido y a menudo ayuda: una celda puede pertenecer a varios grupos si eso hace grupos mayores. Lo que se minimiza es el coste total, no el solape.'},
      ],
    },
    reto:{
      pregunta:'¿Qué es un "implicante primo esencial" y por qué siempre debe estar en la solución?',
      opciones:[
        {t:'Es un implicante primo que es el único que cubre algún mintérmino: como nadie más tapa ese 1, la solución mínima debe incluirlo.',ok:true,why:'Correcto: si un 1 solo puede cubrirse con un implicante primo, ese implicante es esencial y no puede faltar. Los esenciales se eligen primero; el resto se completa al mínimo coste.'},
        {t:'Es el implicante primo de mayor tamaño del mapa: por ser el más grande, siempre forma parte de la cobertura mínima de la función.',ok:false,why:'Ser el mayor no lo hace esencial: puede que sus unos estén cubiertos por otros. Esencial = único que cubre a algún mintérmino.'},
        {t:'Es cualquier grupo de 4 o más celdas, porque elimina al menos dos variables y por eso resulta siempre imprescindible.',ok:false,why:'El tamaño no define lo esencial. Un grupo grande puede ser prescindible si sus unos se cubren de otro modo; uno pequeño puede ser esencial.'},
        {t:'Es el primer implicante primo que aparece al leer el mapa de izquierda a derecha y de arriba abajo, y por eso se elige antes.',ok:false,why:'El orden de lectura es irrelevante. Lo esencial se define por la cobertura: un mintérmino que solo un implicante puede tapar.'},
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
  // Es una DEMOSTRACIÓN: guarda el estado del alumno (Explora, Agrupa y, sobre todo, el reto en curso) y lo restituye al terminar.
  // El reto de la demostración usa un caso aparte (RETO_DEMO) y jamás toca solved ni el reto real.
  const prev={mode,expN,expSet:new Set(expSet),agIdx,agSpot,retoIdx,retoPIs,retoSel:new Set(retoSel),retoChecked,retoOkCover,retoOkMin,retoSolved,retoMsg,intentos,solved};
  try{
    synth.init();synth.resume();clearDx();
    setMode('explora');
    expN=4;expSet=new Set([0,2,5,7,8,10,13,15]);afterEdit();
    showToast('🧭 Función de 4 variables con 8 unos: la canónica gastaría 32 literales y 9 compuertas.');
    await sleep(4200);
    showToast('✨ Pero su forma mínima es F = B′D′ + BD: solo 4 literales y 3 compuertas. Dos grupos de 4 celdas eliminan 2 variables cada uno.');
    await sleep(4400);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2800);

    setMode('agrupa');
    agIdx=AGRUPA_POOL.findIndex(f=>f.nm.indexOf('Mayoría')>=0);agSpot=-1;afterEdit();
    showToast('🔗 Mayoría 2-de-3: F = BC + AC + AB. Tres lazos de 2 celdas; cada uno elimina una variable.');
    await sleep(4200);
    agSpot=0;afterEdit();
    showToast('🔍 Enfocamos el primer grupo: dentro de él dos variables se mantienen constantes y son las que quedan en el término.');
    await sleep(4000);
    agSpot=-1;
    agIdx=AGRUPA_POOL.findIndex(f=>f.nm.indexOf('Paridad')>=0);afterEdit();
    showToast('⚠️ Honestidad: la paridad impar (XOR) no tiene celdas adyacentes agrupables → su mínima es la canónica. No todo simplifica.');
    await sleep(4400);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2800);

    // Reto de DEMOSTRACIÓN (caso aparte): primero todos los primos (cubre, pero sobra uno), luego la cobertura mínima
    setMode('reto');
    seedReto(RETO_DEMO);updateRetoSpec();afterEdit();
    const fd=RETO_POOL[RETO_DEMO], rd=minimize(fd.mts,fd.n,[]);
    showToast('🎯 Demostración con otra función, F = Σm('+fd.mts.join(',')+') ('+retoPIs.length+' implicantes primos). Primero marcamos TODOS: cubren los unos, pero alguno sobra.');
    retoSel=new Set(retoPIs.map((_,k)=>k));afterEdit();
    await sleep(4200);
    retoSel=new Set();
    rd.terms.forEach(t=>{const idx=retoPIs.findIndex(p=>p.bits===t.bits&&p.mask===t.mask);if(idx>=0)retoSel.add(idx);});
    demoShow=true;afterEdit();
    showToast('✔ Quitamos el redundante y queda la cobertura mínima: '+sopStr(rd.terms,fd.n)+' ('+rd.cost+' literales). Esto es solo una demostración: tu reto sigue intacto.');
    await sleep(4200);
    demoShow=false;
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2400);
  }finally{
    demoShow=false;
    // restitución del estado del alumno (el reto vuelve a estar como lo dejó, sin resolver si no lo estaba)
    expN=prev.expN;expSet=prev.expSet;agIdx=prev.agIdx;agSpot=prev.agSpot;
    retoIdx=prev.retoIdx;retoPIs=prev.retoPIs;retoSel=prev.retoSel;retoChecked=prev.retoChecked;retoOkCover=prev.retoOkCover;
    retoOkMin=prev.retoOkMin;retoSolved=prev.retoSolved;retoMsg=prev.retoMsg;intentos=prev.intentos;
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
    setMode(prev.mode);
    solved=(prev.mode==='reto')?retoSolved:false;
    if(prev.mode==='reto')updateRetoSpec();
  }
}

// ===================== 16. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt,time)=>{
  hwT+=dt;
  if(hwT>0.7){hwT=0;const N=1<<curFn().n;hwInput=(hwInput+1)%N;updateHW();if(mode!=='reto')drawBoard();}
});
['explora','agrupa','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
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
  minimize:(mts,n)=>{const r=minimize(mts,n,[]);return{sop:r.special||sopStr(r.terms,n),cost:r.cost,nterms:r.nterms};},
  primeImplicants:(mts,n)=>primeImplicants(mts,[]).map(p=>termStr(p,n)),
  gateCost:(mts,n)=>{const r=minimize(mts,n,[]);return gateCost(r.terms,n);},
  canonCost:(mts,n)=>mts.length*n,
  // explora
  expN:()=>expN, expSet:()=>[...expSet].sort((a,b)=>a-b),
  expMin:()=>{const r=minimize([...expSet],expN,[]);return r.special||sopStr(r.terms,expN);},
  setExp:(n,mts)=>{if(mode==='explora'){if(n!=null)expN=n;if(mts)expSet=new Set(mts);afterEdit();}},
  toggleMt:m=>{if(mode==='explora'){if(expSet.has(m))expSet.delete(m);else expSet.add(m);afterEdit();}},
  // agrupa
  agIdx:()=>agIdx, agSpot:()=>agSpot, agName:()=>AGRUPA_POOL[agIdx].nm,
  setAg:(i,spot)=>{if(mode==='agrupa'){if(i!=null)agIdx=i;if(spot!=null)agSpot=spot;afterEdit();}},
  // reto
  retoIdx:()=>retoIdx, retoFn:()=>({...RETO_POOL[retoIdx]}),
  retoPIs:()=>retoPIs.map(p=>termStr(p,RETO_POOL[retoIdx].n)),
  retoMinCost:()=>minimize(RETO_POOL[retoIdx].mts,RETO_POOL[retoIdx].n,[]).cost,
  retoSel:()=>[...retoSel], retoSetSel:arr=>{if(mode==='reto'){retoSel=new Set(arr);retoChecked=false;afterEdit();}},
  retoToggle:i=>{if(mode==='reto'){if(retoSel.has(i))retoSel.delete(i);else retoSel.add(i);retoChecked=false;afterEdit();}},
  retoSolveMin:()=>{if(mode==='reto'){const r=minimize(RETO_POOL[retoIdx].mts,RETO_POOL[retoIdx].n,[]);retoSel=new Set();r.terms.forEach(t=>{const i=retoPIs.findIndex(p=>p.bits===t.bits&&p.mask===t.mask);if(i>=0)retoSel.add(i);});afterEdit();}},
  checkReto:()=>checkReto(), intentos:()=>intentos,
  retoChecked:()=>retoChecked, retoOkCover:()=>retoOkCover, retoOkMin:()=>retoOkMin, retoSolved:()=>retoSolved,
  seedReto:idx=>{seedReto(idx);updateRetoSpec();afterEdit();},
  newSignal:()=>newSignal(),
  hwInput:()=>hwInput, hwF:()=>{const fn=curFn();return new Set(fn.mts).has(hwInput)?1:0;},
  reportText:()=>el('report').innerText,
  quizAnswer:i=>answer(i), quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  solved:()=>solved,
};
