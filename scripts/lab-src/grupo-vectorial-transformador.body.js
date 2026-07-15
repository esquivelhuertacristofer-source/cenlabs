/* ============================================================
   LAB — GRUPO VECTORIAL: BANCOS TRIFÁSICOS DE TRANSFORMADORES
   (Dominio D5 · transformadores — molde S: esquemático + simulación numérica)
   Normatividad / referencia:
     · IEC 60076-1:2011 Ed.3.0, Cláusula 3.10.6 (desfase angular / grupo de
       conexión) y Nota 2: la convención de "reloj" — el fasor de alta tensión
       (AT) se fija a las 12; el fasor de baja tensión (BT) se lee en la
       posición horaria a la que "atrasa" respecto de AT (1 hora = 30°).
       CONFIRMADO contra el texto primario: Dyn11 significa que BT ATRASA a
       AT 330° (equivalente a decir que BT ADELANTA 30°) — NO "BT atrasa 30°"
       (ese es el grupo Dyn1, distinto).
     · IEC 60076-1:2011 Cláusula 7.1.5 — el grupo vectorial es un dato que
       debe declararse junto con la relación de transformación.
     · Convención de terminales por unidad monofásica: H1/H2 en alta tensión,
       X1/X2 en baja tensión (misma convención ANSI/CFE K0000-04 usada en las
       prácticas hermanas d5-01 y d5-02).
     ⚑ La designación de líneas del banco con mayúsculas (A,B,C en AT) y
       minúsculas (a,b,c en BT) es práctica de libro de texto ampliamente
       usada; no se verificó una cláusula IEC específica para ella en esta
       sesión — ver bandera en ficha.md.
   Modelo de ingeniería (didáctico):
     · El banco se arma con 3 transformadores monofásicos IDÉNTICOS. Cada
       lado (primario/secundario) se conecta en estrella (Y) o delta (D); la
       polaridad de AT puede ser normal o invertida. Esas 3 decisiones (2×2×2
       = 8 combinaciones) determinan el grupo vectorial resultante, calculado
       EN VIVO con las fórmulas verificadas más abajo — nunca tabulado a mano.
     · Invertir la polaridad de AT es un cambio de REFERENCIA (qué extremo del
       devanado se llama "H1"), no un recableado físico: el mismo devanado
       sigue conectado igual. Por eso, en este modelo, el amarre 3D del banco
       (los puentes/jumpers) solo se reconstruye cuando cambia la topología
       Y/D de un lado — la polaridad únicamente mueve la marca de polaridad y
       recalcula el fasor. Esta simplificación se declara explícitamente en
       el contrato de fidelidad (ver HUD) y en ficha.md.
     · CERO Math.random() en la física: primary/secondary/polarity solo
       cambian por clic del usuario, o —en el modo Reto— por una elección
       aleatoria de UI (newChallenge, igual que newNetwork() en la práctica
       de Kirchhoff) que decide QUÉ combinación se le pide calcular al
       estudiante; el cálculo del grupo vectorial en sí es 100% determinista.
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.6,3.2,6.4],target:[1.7,0.85,1.0],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ============================================================
   1) FÍSICA — modelo del grupo vectorial (verificado con node -e)
   ============================================================ */
function thetaRef(topo){return topo==='D'?30:0;}
function computeGroup(primary,secondary,polarity){
  const th1=thetaRef(primary)+(polarity==='reversed'?180:0);
  const outputAngle=th1-thetaRef(secondary);
  const lag=((-outputAngle%360)+360)%360;
  const clock=Math.round(lag/30)%12;
  const label=primary+secondary.toLowerCase()+(secondary==='Y'?'n':'')+clock;
  const family=(clock%2===0)?'0°/180°':'30°';
  return {th1,outputAngle,lag,clock,label,family};
}
const ALL_GROUPS=['Yyn0','Yyn6','Yd1','Yd7','Dyn11','Dyn5','Dd0','Dd6'];

/* ============================================================
   2) ESTADO
   ============================================================ */
let mode='explora';        // explora | conexion | fasor | reto
let primary='Y', secondary='Y', polarity='normal';
let retoSolved=false;      // en reto: desfase/hora/grupo ocultos hasta acertar
let retoMsg='';
let solved=false;          // pregunta de ingeniería del modo actual
let autoRunning=false;
let QUIZ={};

/* ============================================================
   3) MATERIALES
   ============================================================ */
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};
const alu=castAluminum(), brush=brushedMetal(), plas=techPlastic(0.12,0.14,0.15);
const MAT={
  bench:  std({...plas,color:0x3a464d,roughness:0.85,metalness:0.05}),
  frame:  std({...plas,color:0x232a2e,roughness:0.95,metalness:0}),
  leg:    std({...brush,color:0x77828a,metalness:0.35,roughness:0.85}),
  tank:   std({...alu,color:0x445055,metalness:0.45,roughness:0.55}),
  bushHV: std({color:0xB33A2E,roughness:0.35,metalness:0.15}),
  bushLV: std({color:0x2E6DB3,roughness:0.35,metalness:0.15}),
  jumper: std({...brush,color:0xC9A227,metalness:0.72,roughness:0.32}),
  bus:    std({...brush,color:0xd7dde0,metalness:0.6,roughness:0.4}),
  neutral:std({color:0x6f7a80,roughness:0.7,metalness:0.1}),
  dotMark:std({color:0xFFE066,roughness:0.3,metalness:0.1,emissive:0x664400,emissiveIntensity:0.4}),
};

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const lb=labelSprite(text,color);
  lb.position.copy(pos);if(scale)lb.scale.multiplyScalar(scale);
  lb.visible=false;lb.raycast=()=>{};
  obj.add(lb);HOVER_LABELS.set(obj,lb);
}

/* ============================================================
   4) PIZARRÓN — esquema de devanados + reloj de fases (canvas → textura)
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
frame.userData={title:'Pizarrón del grupo vectorial',info:'Esquema vivo de los devanados y del reloj de fases. Toca el primario, el secundario o el reloj.'};
addHoverLabel(frame,'Esquema vivo · clic: primario, secundario, reloj','#4FD1C5',new THREE.Vector3(0,1.65,0.3),1.0);

/* Geometría del esquema en px del canvas (1024×768) */
const WPRI={cx:260,cy:270,r:100};
const WSEC={cx:760,cy:270,r:100};
const WCLK={cx:512,cy:595,r:95};
const HIT=[
  {x:WPRI.cx,y:WPRI.cy,r:170,zone:'primary'},
  {x:WSEC.cx,y:WSEC.cy,r:170,zone:'secondary'},
  {x:WCLK.cx,y:WCLK.cy,r:150,zone:'clock'},
];

function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
function ah(c,x,y,dx,dy){ // punta de flecha
  const nx=-dy,ny=dx;
  c.beginPath();c.moveTo(x+dx*13,y+dy*13);
  c.lineTo(x-dx*4+nx*8,y-dy*4+ny*8);c.lineTo(x-dx*4-nx*8,y-dy*4-ny*8);
  c.closePath();c.fill();
}
function earth(c,x,y){
  c.strokeStyle='#cfe8e2';c.lineWidth=3;
  line(c,x,y,x,y+22);line(c,x-20,y+22,x+20,y+22);
  line(c,x-13,y+32,x+13,y+32);line(c,x-6,y+42,x+6,y+42);
}
function dotMarkC(c,x,y,color,r){
  c.beginPath();c.arc(x,y,r||6,0,7);c.fillStyle=color;c.fill();
}
function labelAt(c,x,y,text,color){
  c.font='bold 17px Outfit, sans-serif';c.fillStyle=color;c.textAlign='center';
  c.fillText(text,x,y);
}
function hCoilGlyph(c,x,y,w,col){
  c.strokeStyle=col||'#5fb8ff';c.lineWidth=2.4;
  const n=4,step=w/n;
  c.beginPath();
  for(let i=0;i<n;i++){const cx2=x+i*step+step/2;c.arc(cx2,y,step/2,Math.PI,0,false);}
  c.stroke();
}
function coilAt(c,cx,cy,len,angleRad,color){
  c.save();c.translate(cx,cy);c.rotate(angleRad);
  hCoilGlyph(c,-len/2,0,len,color);
  c.restore();
}

/* Estrella (Y): 3 devanados radiando desde el centro (neutro) a cada línea.
   Delta (D): 3 devanados formando un anillo entre las 3 líneas.
   dotAtStart=true → la marca de polaridad está en el extremo de LÍNEA del
   devanado (vértice); false → está en el extremo COMÚN (centro / unión). */
function drawWindingPanel(c,cx,cy,r,topo,color,dotAtStart,phaseLabels,showNeutralLead){
  const angs=[-Math.PI/2,-Math.PI/2+2*Math.PI/3,-Math.PI/2+4*Math.PI/3];
  const V=angs.map(a=>[cx+r*Math.cos(a),cy+r*Math.sin(a)]);
  if(topo==='Y'){
    V.forEach((v,i)=>{
      const ang=Math.atan2(v[1]-cy,v[0]-cx);
      const midx=(cx+v[0])/2, midy=(cy+v[1])/2;
      coilAt(c,midx,midy,r*0.62,ang,color);
      const f=dotAtStart?0.86:0.16;
      dotMarkC(c,cx+(v[0]-cx)*f,cy+(v[1]-cy)*f,color,5);
      labelAt(c,v[0]+(v[0]-cx)*0.16,v[1]+(v[1]-cy)*0.16+(v[1]<cy?-8:18),phaseLabels[i],color);
    });
    dotMarkC(c,cx,cy,'#EAF4F1',4);
    if(showNeutralLead){
      c.strokeStyle='#cfe8e2';c.lineWidth=3;
      line(c,cx,cy,cx,cy+28);earth(c,cx,cy+28);
      labelAt(c,cx+18,cy+34,'N','#8FB3AC');
    }
  }else{
    for(let i=0;i<3;i++){
      const a=V[i], b=V[(i+1)%3];
      const ang=Math.atan2(b[1]-a[1],b[0]-a[0]);
      const midx=(a[0]+b[0])/2, midy=(a[1]+b[1])/2;
      const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
      coilAt(c,midx,midy,len*0.82,ang,color);
      const f=dotAtStart?0.14:0.86;
      dotMarkC(c,a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,color,5);
    }
    V.forEach((v,i)=>{
      labelAt(c,v[0]+(v[0]-cx)*0.22,v[1]+(v[1]-cy)*0.22+(v[1]<cy?-10:20),phaseLabels[i],color);
    });
  }
}

function handAt(c,cx,cy,len,clock,color,w,label){
  const a=-Math.PI/2+clock*(Math.PI/6);
  const x2=cx+Math.cos(a)*len, y2=cy+Math.sin(a)*len;
  c.strokeStyle=color;c.lineWidth=w;line(c,cx,cy,x2,y2);
  c.fillStyle=color;ah(c,x2,y2,Math.cos(a),Math.sin(a));
  c.font='bold 16px Outfit, sans-serif';c.textAlign='center';
  c.fillText(label,cx+Math.cos(a)*(len+26),cy+Math.sin(a)*(len+26)+5);
}
function drawPhasorClock(c,cx,cy,r,clock,hide){
  c.strokeStyle='#cfe8e2';c.lineWidth=2;
  c.beginPath();c.arc(cx,cy,r,0,7);c.stroke();
  for(let hr=0;hr<12;hr++){
    const a=-Math.PI/2+hr*(Math.PI/6);
    const x1=cx+Math.cos(a)*(r-14), y1=cy+Math.sin(a)*(r-14);
    const x2=cx+Math.cos(a)*r, y2=cy+Math.sin(a)*r;
    line(c,x1,y1,x2,y2);
    c.font='bold 15px Outfit, sans-serif';c.fillStyle='#8FB3AC';c.textAlign='center';
    c.fillText(String(hr===0?12:hr),cx+Math.cos(a)*(r+22),cy+Math.sin(a)*(r+22)+5);
  }
  handAt(c,cx,cy,r*0.82,0,'#B33A2E',5,'AT');
  if(!hide){
    handAt(c,cx,cy,r*0.66,clock,'#2E6DB3',4,'BT');
  }else{
    c.font='bold 34px Outfit, sans-serif';c.fillStyle='#FFB703';c.textAlign='center';
    c.fillText('¿?',cx,cy+12);
  }
  dotMarkC(c,cx,cy,'#EAF4F1',5);
}

function drawBoard(){
  const c=bCv.getContext('2d');
  const g=computeGroup(primary,secondary,polarity);
  const hide=mode==='reto'&&!retoSolved;
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('BANCO TRIFÁSICO · grupo vectorial',26,44);
  if(hide){c.fillStyle='#FFB703';c.textAlign='right';c.fillText('🎯 RETO: predice el desfase y la hora',998,44);}
  c.textAlign='center';
  c.fillStyle='#B33A2E';c.font='bold 20px Outfit, sans-serif';
  c.fillText('PRIMARIO · AT · '+(primary==='Y'?'Estrella (Y)':'Delta (D)')+(polarity==='reversed'?' · polaridad invertida':''),WPRI.cx,90);
  c.fillStyle='#2E6DB3';
  c.fillText('SECUNDARIO · BT · '+(secondary==='Y'?'Estrella (Y)':'Delta (D)'),WSEC.cx,90);
  drawWindingPanel(c,WPRI.cx,WPRI.cy,WPRI.r,primary,'#B33A2E',polarity==='normal',['A','B','C'],false);
  drawWindingPanel(c,WSEC.cx,WSEC.cy,WSEC.r,secondary,'#2E6DB3',true,['a','b','c'],secondary==='Y');
  c.fillStyle='#8FB3AC';c.font='13px Outfit, sans-serif';c.textAlign='center';
  c.fillText('• = terminal de referencia (H1 en AT · X1 en BT, con polaridad normal)',512,410);
  c.font='bold 18px Outfit, sans-serif';
  c.fillText('GRUPO VECTORIAL (IEC 60076-1 · convención de reloj)',WCLK.cx,WCLK.cy-WCLK.r-38);
  drawPhasorClock(c,WCLK.cx,WCLK.cy,WCLK.r,g.clock,hide);
  c.font='bold 26px Outfit, sans-serif';c.textAlign='center';
  if(hide){
    c.fillStyle='#FFB703';
    c.fillText('Desfase = ¿? °  ·  Grupo = ¿?',WCLK.cx,WCLK.cy+WCLK.r+40);
  }else{
    c.fillStyle='#4FD1C5';
    c.fillText('Desfase = '+g.lag.toFixed(0)+'°  ·  Grupo = '+g.label,WCLK.cx,WCLK.cy+WCLK.r+40);
    c.font='14px Outfit, sans-serif';c.fillStyle='#8FB3AC';
    c.fillText('familia de paralelismo: '+g.family,WCLK.cx,WCLK.cy+WCLK.r+62);
  }
  bTex.needsUpdate=true;
}

function boardClick(u,v){
  const x=u*1024, y=(1-v)*768;
  let best=null,bd=1e9;
  HIT.forEach(h=>{const d=Math.hypot(x-h.x,y-h.y);if(d<h.r&&d<bd){bd=d;best=h;}});
  if(!best)return;
  const g=computeGroup(primary,secondary,polarity);
  if(best.zone==='primary'){
    if(mode!=='conexion')setMode('conexion');
    showToast(`<b>Devanado primario (AT)</b><br><span>Terminales H1/H2 de cada unidad. Topología actual: <b>${primary==='Y'?'Estrella (Y)':'Delta (D)'}</b>. El punto marca el terminal de referencia (H1) con polaridad normal.</span>`);
  }else if(best.zone==='secondary'){
    if(mode!=='conexion')setMode('conexion');
    showToast(`<b>Devanado secundario (BT)</b><br><span>Terminales X1/X2 de cada unidad. Topología actual: <b>${secondary==='Y'?'Estrella (Y)':'Delta (D)'}</b>.${secondary==='Y'?' El neutro (N) se deriva del punto común.':' Sin neutro accesible en delta.'}</span>`);
  }else if(best.zone==='clock'){
    if(mode!=='fasor')setMode('fasor');
    const info=(mode==='reto'&&!retoSolved)?'Resultado oculto: este es el modo Reto, calcula tú el desfase y la hora.':`Grupo actual: <b>${g.label}</b> (desfase ${g.lag.toFixed(0)}°, hora ${g.clock}).`;
    showToast(`<b>Diagrama de reloj (IEC 60076-1)</b><br><span>La manecilla de AT se fija a las 12; la de BT indica el desfase en "horas" (1 hora = 30°). ${info}</span>`);
  }
  synth.beep(660,0.05,0.04);
}

/* ============================================================
   5) BANCO 3D — 3 unidades monofásicas amarradas en banco trifásico
   ============================================================ */
const bench=sh(roundedBox(3.4,0.5,2.0,MAT.bench,0.05));bench.position.set(1.7,0.25,1.0);scene.add(bench);
bench.userData={title:'Banco trifásico',info:'Tres transformadores monofásicos idénticos, amarrados en banco. Cada unidad conserva sus 4 terminales propios (H1,H2 en AT; X1,X2 en BT).'};
addHoverLabel(bench,'Banco de 3 unidades monofásicas','#4FD1C5',new THREE.Vector3(0,0.32,0.9),0.8);

const UNITS=[];
['A','B','C'].forEach((letter,i)=>{
  const ux=0.9+i*0.8;
  const tank=sh(roundedBox(0.46,0.40,0.46,MAT.tank,0.08));
  tank.position.set(ux,0.70,1.0);scene.add(tank);
  tank.userData={title:'Unidad monofásica '+letter,info:'Transformador monofásico independiente del banco. Conserva sus 4 terminales propios: H1/H2 en alta tensión, X1/X2 en baja tensión.'};
  addHoverLabel(tank,'Unidad '+letter,'#cfe8e2',new THREE.Vector3(0,0.28,0),0.6);
  const H1=[ux-0.09,0.97,0.86], H2=[ux+0.09,0.97,0.86];
  const X1=[ux-0.09,0.97,1.14], X2=[ux+0.09,0.97,1.14];
  const mkBush=(pos,mat,label,info)=>{
    const b=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.04,0.14,14),mat));
    b.position.set(pos[0],pos[1],pos[2]);scene.add(b);
    b.userData={title:label,info};
    addHoverLabel(b,label,mat===MAT.bushHV?'#e08a80':'#8ab4e0',new THREE.Vector3(0,0.14,0),0.5);
  };
  mkBush(H1,MAT.bushHV,'H1 · unidad '+letter,'Terminal de alta tensión — inicio del devanado primario (referencia de polaridad).');
  mkBush(H2,MAT.bushHV,'H2 · unidad '+letter,'Terminal de alta tensión — final del devanado primario.');
  mkBush(X1,MAT.bushLV,'X1 · unidad '+letter,'Terminal de baja tensión — inicio del devanado secundario.');
  mkBush(X2,MAT.bushLV,'X2 · unidad '+letter,'Terminal de baja tensión — final del devanado secundario.');
  UNITS.push({letter,H1,H2,X1,X2});
});

const HVline=[0,1,2].map(i=>[0.9+i*0.8,1.25,0.55]);
const LVline=[0,1,2].map(i=>[0.9+i*0.8,1.25,1.45]);
const HVneutral=[1.7,1.25,0.55];
const LVneutral=[1.7,1.25,1.45];
function mkPost(pos,mat,label,info){
  const p=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.16,12),mat));
  p.position.set(pos[0],pos[1],pos[2]);scene.add(p);
  p.userData={title:label,info};
  addHoverLabel(p,label,'#cfe8e2',new THREE.Vector3(0,0.16,0),0.5);
  return p;
}
['A','B','C'].forEach((l,i)=>mkPost(HVline[i],MAT.bus,'Línea '+l+' (AT)','Terminal de línea del banco en alta tensión.'));
['a','b','c'].forEach((l,i)=>mkPost(LVline[i],MAT.bus,'Línea '+l+' (BT)','Terminal de línea del banco en baja tensión.'));
const HVneutralMesh=mkPost(HVneutral,MAT.neutral,'Neutro (AT)','Punto común de los devanados primarios cuando están en estrella.');
const LVneutralMesh=mkPost(LVneutral,MAT.neutral,'Neutro (BT) · N','Punto común de los devanados secundarios en estrella — en la práctica suele aterrizarse aquí.');

let wiringG=new THREE.Group();scene.add(wiringG);
function cableTo(group,a,b,mat){
  const va=new THREE.Vector3(a[0],a[1],a[2]),vb=new THREE.Vector3(b[0],b[1],b[2]);
  const m=va.clone().lerp(vb,0.5);m.y=Math.max(va.y,vb.y)+0.10;
  const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([va,m,vb]),24,0.012,8),mat);
  t.castShadow=true;group.add(t);
}
function clearGroup(g){while(g.children.length){const c=g.children.pop();c.geometry&&c.geometry.dispose();g.remove(c);}}
function rebuildWiring3D(){
  clearGroup(wiringG);
  UNITS.forEach((u,i)=>{
    if(primary==='Y'){
      cableTo(wiringG,u.H1,HVline[i],MAT.jumper);
      cableTo(wiringG,u.H2,HVneutral,MAT.jumper);
    }else{
      const nxt=UNITS[(i+1)%3];
      cableTo(wiringG,u.H2,nxt.H1,MAT.jumper);
      cableTo(wiringG,u.H1,HVline[i],MAT.jumper);
    }
    if(secondary==='Y'){
      cableTo(wiringG,u.X1,LVline[i],MAT.jumper);
      cableTo(wiringG,u.X2,LVneutral,MAT.jumper);
    }else{
      const nxt=UNITS[(i+1)%3];
      cableTo(wiringG,u.X2,nxt.X1,MAT.jumper);
      cableTo(wiringG,u.X1,LVline[i],MAT.jumper);
    }
  });
  HVneutralMesh.visible=primary==='Y';
  LVneutralMesh.visible=secondary==='Y';
}

const POL_DOTS=UNITS.map(()=>{
  const s=new THREE.Mesh(new THREE.SphereGeometry(0.028,12,10),MAT.dotMark);
  s.castShadow=true;scene.add(s);return s;
});
function updatePolarityDots(){
  UNITS.forEach((u,i)=>{
    const p=polarity==='normal'?u.H1:u.H2;
    POL_DOTS[i].position.set(p[0],p[1]+0.09,p[2]);
  });
}

const rdCv=document.createElement('canvas');rdCv.width=320;rdCv.height=120;
const rdTex=new THREE.CanvasTexture(rdCv);
rdTex.colorSpace=THREE.SRGBColorSpace;rdTex.minFilter=THREE.LinearFilter;rdTex.generateMipmaps=false;
const rdPlate=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.19),new THREE.MeshBasicMaterial({map:rdTex,toneMapped:false}));
rdPlate.position.set(1.7,0.30,1.87);scene.add(rdPlate);
function drawReadout(){
  const c=rdCv.getContext('2d');
  const hide=mode==='reto'&&!retoSolved;
  c.fillStyle='#071410';c.fillRect(0,0,320,120);
  c.strokeStyle='rgba(79,209,197,0.4)';c.lineWidth=3;c.strokeRect(3,3,314,114);
  c.fillStyle='#4FD1C5';c.font='bold 18px Outfit, sans-serif';c.textAlign='center';
  c.fillText('GRUPO VECTORIAL',160,32);
  c.font='bold 40px Outfit, sans-serif';
  c.fillStyle=hide?'#FFB703':'#EAF4F1';
  c.fillText(hide?'¿ ? ?':computeGroup(primary,secondary,polarity).label,160,84);
  rdTex.needsUpdate=true;
}

function refreshNet3D(){
  rebuildWiring3D();
  updatePolarityDots();
  drawReadout();
}

/* ============================================================
   6) HUD + PANEL
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Transformadores · Bancos trifásicos (D5)</div>
  <h2>Grupo vectorial: bancos trifásicos y el reloj de fases</h2>
  <p>Tres transformadores monofásicos idénticos, amarrados en <b>estrella (Y)</b> o <b>delta (D)</b> en cada lado, con la <b>polaridad</b> de alta tensión normal o invertida. Esas tres decisiones fijan el <b>desfase angular</b> entre primario y secundario — el <b>grupo vectorial</b> (p. ej. <b>Dyn11</b>), leído como la hora de un reloj.</p>
  <div class="formula">θ1 = θ_ref(primario) + 180°·(polaridad invertida)<br>desfase = ((−(θ1 − θ_ref(secundario))) mod 360)°<br>hora = redondeo(desfase / 30°) mod 12 · θ_ref(Y)=0° · θ_ref(D)=30°</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#B33A2E"></span>Primario · alta tensión (H1/H2)</div>
    <div class="li"><span class="dot" style="background:#2E6DB3"></span>Secundario · baja tensión (X1/X2)</div>
    <div class="li"><span class="dot" style="background:#FFE066"></span>Marca de polaridad (terminal de referencia)</div>
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Grupo vectorial resultante</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> las 8 combinaciones posibles de este banco (Y/D en cada lado × polaridad de AT) y su grupo vectorial exacto según la convención de reloj de IEC 60076-1 (referencia de AT a las 12; BT se lee en la hora a la que atrasa); el efecto de invertir la polaridad de AT (giro de 180° del fasor de referencia).</div>
    <div class="fl no"><b>NO modela:</b> el re-alambrado físico del banco cuando solo cambia la polaridad — invertir la polaridad es una convención de referencia (qué extremo se marca "H1"), no un recableado; aquí solo se mueve la marca de polaridad y se recalcula el fasor, mientras que los amarres 3D del banco se reconstruyen únicamente cuando cambia la topología Y/D de un lado. Tampoco modela impedancias, corrientes de excitación ni el detalle interno de cada unidad (ver práctica hermana d5-02).</div>
  </div>
  <div class="src">Ref: IEC 60076-1:2011 Cl. 3.10.6 / 7.1.5 · convención de reloj</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Banco trifásico · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_conexion">Y/D · Conexión</button>
    <button class="b" id="m_fasor">🕐 Fasor</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:8px;margin:10px 0">
    <div>
      <div style="font-size:11px;color:var(--ink);margin-bottom:4px">Primario (AT)</div>
      <div class="modebar"><button class="b" id="c_priY">Estrella (Y)</button><button class="b" id="c_priD">Delta (D)</button></div>
    </div>
    <div>
      <div style="font-size:11px;color:var(--ink);margin-bottom:4px">Secundario (BT)</div>
      <div class="modebar"><button class="b" id="c_secY">Estrella (Y)</button><button class="b" id="c_secD">Delta (D)</button></div>
    </div>
    <div>
      <div style="font-size:11px;color:var(--ink);margin-bottom:4px">Polaridad (AT)</div>
      <div class="modebar"><button class="b" id="c_polN">Normal</button><button class="b" id="c_polR">Invertida</button></div>
    </div>
  </div>
  <div id="tele">
    <div class="g"><div class="l">Primario</div><b id="t_pri">—</b></div>
    <div class="g"><div class="l">Secundario</div><b id="t_sec">—</b></div>
    <div class="g"><div class="l">Polaridad</div><b id="t_pol">—</b></div>
    <div class="g"><div class="l">Desfase</div><b id="t_lag">—</b></div>
    <div class="g"><div class="l">Hora</div><b id="t_clock">—</b></div>
    <div class="g"><div class="l">Grupo</div><b id="t_label">—</b></div>
  </div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Tu predicción (grupo vectorial)</h4>
  <div id="retoBox" style="display:none">
    <div style="font-size:12px;color:var(--ink);margin:2px 0 8px">La conexión ya está fijada arriba (resultado oculto). Calcula θ1, el ángulo de salida y predice el desfase y la hora:</div>
    <div style="display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:var(--ink)">
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inLag">Desfase =</label><input id="inLag" inputmode="decimal" autocomplete="off" style="width:64px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span>°</span></span>
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inClock">Hora =</label><input id="inClock" inputmode="decimal" autocomplete="off" style="width:56px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"></span>
    </div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar predicción</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nueva conexión (reto)</button>
  </div>`;

const el=id=>document.getElementById(id);
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3200);
}

/* ============================================================
   7) MODOS
   ============================================================ */
const MODE_META={
  explora:{nombre:'Explora',cam:[[4.6,3.2,6.4],[1.7,0.85,1.0]],mision:'Reconoce el banco: 3 unidades monofásicas idénticas, cada una con sus 4 terminales (H1/H2 en AT, X1/X2 en BT).'},
  conexion:{nombre:'Conexión Y/D',cam:[[-0.2,2.1,3.9],[-0.9,1.75,-0.8]],mision:'Cambia la topología Y/D de cada lado y observa cómo se re-alambra el amarre del banco.'},
  fasor:{nombre:'Fasor · reloj',cam:[[-0.1,2.2,4.3],[-0.9,1.75,-0.8]],mision:'Invierte la polaridad de AT y sigue el diagrama de reloj para entender el grupo vectorial resultante.'},
  reto:{nombre:'Reto',cam:[[0.6,2.3,5.6],[0.2,1.3,0.2]],mision:'Con la conexión dada, predice el desfase (°) y la hora del grupo vectorial antes de revelarlo.'},
};
function setMode(k){
  mode=k;
  ['explora','conexion','fasor','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  const reto=k==='reto';
  el('retoTitle').style.display=reto?'':'none';
  el('retoBox').style.display=reto?'':'none';
  syncCtrlbar();
  solved=false;clearDx();refreshQuestion();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  refreshAll();
}
function syncCtrlbar(){
  const lock=mode==='reto'&&!retoSolved;
  el('c_priY').classList.toggle('on',primary==='Y');el('c_priD').classList.toggle('on',primary==='D');
  el('c_secY').classList.toggle('on',secondary==='Y');el('c_secD').classList.toggle('on',secondary==='D');
  el('c_polN').classList.toggle('on',polarity==='normal');el('c_polR').classList.toggle('on',polarity==='reversed');
  ['c_priY','c_priD','c_secY','c_secD','c_polN','c_polR'].forEach(id=>{el(id).disabled=lock;});
}

function setPrimary(v){
  if(mode==='reto'&&!retoSolved)return;
  if(primary===v)return;
  primary=v;synth.beep(660,0.05,0.04);
  refreshNet3D();syncCtrlbar();buildQuiz();
  solved=false;clearDx();refreshQuestion();refreshAll();
}
function setSecondary(v){
  if(mode==='reto'&&!retoSolved)return;
  if(secondary===v)return;
  secondary=v;synth.beep(660,0.05,0.04);
  refreshNet3D();syncCtrlbar();buildQuiz();
  solved=false;clearDx();refreshQuestion();refreshAll();
}
function setPolarity(v){
  if(mode==='reto'&&!retoSolved)return;
  if(polarity===v)return;
  polarity=v;synth.beep(660,0.05,0.04);
  updatePolarityDots();drawReadout();syncCtrlbar();buildQuiz();
  solved=false;clearDx();refreshQuestion();refreshAll();
}

function updateTele(){
  const g=computeGroup(primary,secondary,polarity);
  const hide=mode==='reto'&&!retoSolved;
  el('t_pri').textContent=primary==='Y'?'Estrella (Y)':'Delta (D)';
  el('t_sec').textContent=secondary==='Y'?'Estrella (Y)':'Delta (D)';
  el('t_pol').textContent=polarity==='normal'?'Normal':'Invertida';
  el('t_lag').textContent=hide?'¿?':g.lag.toFixed(0)+'°';
  el('t_clock').textContent=hide?'¿?':String(g.clock);
  el('t_label').textContent=hide?'¿?':g.label;
}
function updateReport(){
  const g=computeGroup(primary,secondary,polarity);
  let html='';
  if(mode==='explora'){
    html=`<div class="ln">Banco de <b>3 unidades monofásicas</b> idénticas: cada una aporta un par AT (H1,H2) y un par BT (X1,X2).</div>
    <div class="ln">Combinaciones posibles: 2 topologías (Y/D) × 2 topologías (Y/D) × 2 polaridades = <b>8 grupos vectoriales</b> distintos con este banco.</div>
    <div class="ln">Combinación actual → <b>${g.label}</b> (desfase ${g.lag.toFixed(0)}°, hora ${g.clock}).</div>`;
  }else if(mode==='conexion'){
    html=`<div class="ln"><b>Estrella (Y):</b> los tres finales (H2 o X2) se unen en un punto común (neutro); los inicios (H1 o X1) salen como las 3 líneas.</div>
    <div class="ln"><b>Delta (D):</b> el final de un devanado se une al inicio del siguiente, formando un anillo cerrado; las 3 líneas salen de esas uniones — no hay neutro accesible.</div>
    <div class="ln">Primario: <b>${primary==='Y'?'Y':'D'}</b> · Secundario: <b>${secondary==='Y'?'Y':'D'}</b> → θ_ref(primario)=${thetaRef(primary)}° · θ_ref(secundario)=${thetaRef(secondary)}°.</div>`;
  }else if(mode==='fasor'){
    html=`<div class="ln">El fasor de AT se toma como <b>referencia</b> (12 en punto). Invertir su polaridad (H1↔H2) lo gira exactamente <b>180°</b>.</div>
    <div class="ln">θ1 = θ_ref(primario) ${polarity==='reversed'?'+ 180°':''} = <b>${g.th1}°</b>. Ángulo de salida = θ1 − θ_ref(secundario) = <b>${g.outputAngle}°</b>.</div>
    <div class="ln">Desfase (BT atrasa a AT) = ((−ángulo_salida) mod 360) = <b>${g.lag.toFixed(0)}°</b> → hora = redondeo(desfase/30) mod 12 = <b>${g.clock}</b>.</div>
    <div class="ln">Grupo vectorial → <b>${g.label}</b> (familia ${g.family}).</div>`;
  }else{
    html=retoMsg||`<div class="ln">Con la conexión dada (oculta arriba), calcula θ1, el ángulo de salida, el desfase en grados y la hora del reloj. Escribe tu predicción.</div>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();updateTele();updateReport();}

/* ============================================================
   8) RETO
   ============================================================ */
function checkReto(){
  const pl=parseFloat((el('inLag').value||'').replace(',','.'));
  const pc=parseFloat((el('inClock').value||'').replace(',','.'));
  if(!isFinite(pl)||!isFinite(pc)){showToast('Escribe tu predicción de desfase (°) y hora.');return;}
  const g=computeGroup(primary,secondary,polarity);
  const okL=Math.abs(pl-g.lag)<=0.5;
  const okC=Math.round(pc)===g.clock;
  if(okL&&okC){
    retoSolved=true;synth.beep(1046,0.12,0.06);
    retoMsg=`<div class="ln ok">✔ Correcto: desfase = ${g.lag.toFixed(0)}° · hora = ${g.clock} · grupo = <b>${g.label}</b> (familia ${g.family}).</div>`;
  }else{
    synth.beep(220,0.15,0.06);
    retoMsg=`<div class="ln bad">✗ Aún no. Revisa θ1 = θ_ref(primario)${polarity==='reversed'?' + 180°':''}, y el desfase = ((−(θ1 − θ_ref(secundario))) mod 360).</div>`;
  }
  syncCtrlbar();refreshAll();
}
function newChallenge(){
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  primary=pick(['Y','D']);secondary=pick(['Y','D']);polarity=pick(['normal','reversed']);
  retoSolved=false;retoMsg='';el('inLag').value='';el('inClock').value='';
  refreshNet3D();buildQuiz();
  if(mode!=='reto')setMode('reto');
  else{syncCtrlbar();solved=false;clearDx();refreshQuestion();refreshAll();}
  showToast('🔀 <b>Nueva conexión.</b> El resultado permanece oculto — observa el banco y el esquema, y calcula.');
  synth.beep(520,0.08,0.05);
}

/* ============================================================
   9) QUIZ
   ============================================================ */
function buildFasorOptions(correct,g){
  const idx=ALL_GROUPS.indexOf(correct);
  const opts=[correct,ALL_GROUPS[(idx+1)%8],ALL_GROUPS[(idx+3)%8],ALL_GROUPS[(idx+5)%8]];
  const rot=idx%4;
  const ordered=opts.slice(rot).concat(opts.slice(0,rot));
  return ordered.map(label=>({
    t:label,
    ok:label===correct,
    why:label===correct
      ?`Correcto: θ1=${g.th1}° (θ_ref del primario${polarity==='reversed'?' + 180° por polaridad':''}), ángulo de salida=${g.outputAngle}°, desfase=${g.lag.toFixed(0)}°, hora=${g.clock}.`
      :'No corresponde a esta combinación: revisa θ_ref de cada lado (0° en Y, 30° en D) y si la polaridad suma 180° al lado primario.',
  }));
}
function buildQuiz(){
  const g=computeGroup(primary,secondary,polarity);
  QUIZ.explora={
    pregunta:'¿Cuántos grupos vectoriales distintos puede formar este banco con sus 3 interruptores (primario Y/D, secundario Y/D, polaridad)?',
    opciones:[
      {t:'4 — solo cuentan las topologías, no la polaridad',ok:false,why:'La polaridad también cambia el resultado: agrega un factor 2 adicional (2×2×2=8).'},
      {t:'8 — 2 topologías × 2 topologías × 2 polaridades',ok:true,why:'Correcto: cada interruptor es independiente y los 8 rótulos resultantes (Yyn0, Yyn6, Yd1, Yd7, Dyn11, Dyn5, Dd0, Dd6) son todos distintos entre sí.'},
      {t:'2 — solo Dyn11 y Yyn0 son grupos reales',ok:false,why:'Las 8 combinaciones producen 8 grupos IEC válidos, no solo dos.'},
      {t:'16 — hay que contar también las 3 unidades por separado',ok:false,why:'Las 3 unidades siempre están amarradas igual entre sí; lo que varía es la topología del banco completo, no unidad por unidad.'},
    ],
  };
  QUIZ.conexion={
    pregunta:'¿Qué distingue físicamente a la conexión en delta (D) de la conexión en estrella (Y)?',
    opciones:[
      {t:'En delta los tres devanados forman un anillo cerrado; en estrella los tres finales se unen en un neutro común',ok:true,why:'Correcto: por eso la delta no tiene neutro accesible, y la estrella sí (si se necesita, se puede aterrizar).'},
      {t:'En delta hay más devanados que en estrella',ok:false,why:'El número de devanados es siempre 3 (uno por unidad); lo que cambia es cómo se interconectan sus terminales.'},
      {t:'La estrella siempre maneja más corriente que la delta',ok:false,why:'La corriente depende de la carga, no de la topología en sí; ambas configuraciones son válidas para distintos niveles de tensión de línea.'},
      {t:'Son eléctricamente idénticas, solo cambia el dibujo',ok:false,why:'No son idénticas: cambian la tensión de línea vs. de fase, la disponibilidad de neutro, y el ángulo θ_ref que aporta cada lado (0° en Y, 30° en D).'},
    ],
  };
  QUIZ.fasor={
    pregunta:`Con primario ${primary==='Y'?'Y':'D'}, secundario ${secondary==='Y'?'Y':'D'} y polaridad ${polarity==='normal'?'normal':'invertida'}, ¿cuál es el grupo vectorial resultante?`,
    opciones:buildFasorOptions(g.label,g),
  };
  QUIZ.reto={
    pregunta:'En el reto, ¿qué debes predecir antes de que el simulador revele el resultado?',
    opciones:[
      {t:'El desfase en grados y la hora del reloj de la combinación dada',ok:true,why:'Correcto: la topología y polaridad ya están fijas (son el dato); tú calculas θ1, el ángulo de salida, el desfase y la hora.'},
      {t:'Qué combinación de interruptores produce un grupo objetivo',ok:false,why:'En este reto los interruptores ya están fijados por el simulador; tu tarea es calcular el resultado, no buscarlo por ensayo y error.'},
      {t:'El valor en volts de cada fase',ok:false,why:'Esta práctica no involucra magnitudes de tensión — solo el desfase angular relativo entre AT y BT.'},
      {t:'El número de unidades del banco',ok:false,why:'El banco siempre tiene 3 unidades; eso no varía en el reto.'},
    ],
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
  const q=QUIZ[mode],o=q.opciones[i],btn=el('dxbtns').querySelector(`[data-i="${i}"]`);
  if(o.ok){btn.classList.add('right');solved=true;synth.beep(880,0.08,0.05);showToast('✅ <b>Correcto.</b><br><span>'+o.why+'</span>');}
  else{btn.classList.add('wrong');synth.beep(180,0.12,0.05);showToast('❌ <b>No exactamente.</b><br><span>'+o.why+'</span>');}
}

/* ============================================================
   10) INTERACCIÓN — picker + hover
   ============================================================ */
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return;
  if(hit.object===board&&hit.uv){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object;
  while(o){
    const u=o.userData||{};
    if(u.title){showToast(`<b>${u.title}</b><br><span>${u.info}</span>`);synth.beep(660,0.05,0.04);return;}
    o=o.parent;
  }
});

const hoverRay=new THREE.Raycaster();
S.renderer.domElement.addEventListener('pointermove',e=>{
  const r=S.renderer.domElement.getBoundingClientRect();
  const mouse=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  hoverRay.setFromCamera(mouse,S.camera);
  HOVER_LABELS.forEach(lb=>lb.visible=false);
  const hits=hoverRay.intersectObjects(scene.children,true);
  let cursor='default';
  for(const h of hits){
    let o=h.object;
    while(o){
      if(HOVER_LABELS.has(o)){HOVER_LABELS.get(o).visible=true;cursor='pointer';break;}
      o=o.parent;
    }
    if(cursor==='pointer')break;
  }
  S.renderer.domElement.style.cursor=cursor;
});

const sleep=ms=>new Promise(res=>setTimeout(res,ms));
async function runAuto(){
  if(autoRunning)return;
  autoRunning=true;el('btnAuto').disabled=true;
  for(const m of ['explora','conexion','fasor']){setMode(m);await sleep(3800);}
  setPolarity(polarity==='normal'?'reversed':'normal');await sleep(2600);
  setPolarity(polarity==='normal'?'reversed':'normal');await sleep(1200);
  newChallenge();await sleep(1200);
  el('btnAuto').disabled=false;autoRunning=false;
}

S.setAnimate((dt,time)=>{
  const pulse=0.5+0.35*Math.sin(time*3.2);
  MAT.dotMark.emissiveIntensity=(mode==='fasor'||mode==='conexion')?pulse*1.4:0.4;
});

['explora','conexion','fasor','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('c_priY').onclick=()=>{if(!autoRunning)setPrimary('Y');};
el('c_priD').onclick=()=>{if(!autoRunning)setPrimary('D');};
el('c_secY').onclick=()=>{if(!autoRunning)setSecondary('Y');};
el('c_secD').onclick=()=>{if(!autoRunning)setSecondary('D');};
el('c_polN').onclick=()=>{if(!autoRunning)setPolarity('normal');};
el('c_polR').onclick=()=>{if(!autoRunning)setPolarity('reversed');};
el('btnAuto').onclick=runAuto;
el('btnNew').onclick=newChallenge;
el('btnCheck').onclick=checkReto;
['inLag','inClock'].forEach(id=>{el(id).addEventListener('keydown',e=>{if(e.key==='Enter')checkReto();});});
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊':'🔇';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildQuiz();
refreshNet3D();
S.start();
setMode('explora');

/* gancho de verificación independiente (tests re-verifican la física en Node) */
window.__labDebug={
  state:()=>({primary,secondary,polarity}),
  group:()=>computeGroup(primary,secondary,polarity),
  boardClick,
  mode:()=>mode,
};
