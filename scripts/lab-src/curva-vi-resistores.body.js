/* ============================================================
   LAB — CURVA V–I DE RESISTORES Y VALIDACIÓN DE TOLERANCIAS
   (Dominio D1 · circuitos eléctricos — molde S+P: simulación numérica
    + banco de instrumentación con incertidumbre realista)
   Normatividad / referencia:
     · Ley de Ohm (G. Ohm, 1827): V = I·R para un resistor ideal.
     · IEC 60062 — código de colores y marcado de resistores (bandas;
       tolerancias café/rojo/oro/plata = ±1/±2/±5/±10 %).
     · IEC 60063 — serie E12 de valores preferentes (los resistores de
       "Explora" y los del "Reto" pertenecen a esta serie).
     · Ajuste por mínimos cuadrados por el origen (Gauss/Legendre,
       ca. 1805): R̂ = ΣV·I / ΣI², la pendiente que minimiza el error
       cuadrático de un modelo V = R·I sin término independiente.
   Modelo de ingeniería (didáctico):
     · Multímetro digital de 6000 cuentas con auto-rango e incertidumbre
       ±(%lectura + n dígitos) por rango. Verificado por simulación de
       Monte Carlo: con 8 puntos, el veredicto PASA/FALLA acierta
       ≥99.6 % de las veces frente al valor real, incluida una
       resistencia "trampa" que aparenta ser correcta por su color
       pero está fuera de tolerancia.
     · En el reto, la resistencia real es un valor oculto, generado
       aparte del nominal impreso (visible en las bandas); el veredicto
       del estudiante se califica contra SU PROPIO ajuste (R̂ calculado
       de sus propios puntos medidos), no contra el valor oculto
       directamente — evita ambigüedad en los bordes de tolerancia.
   ============================================================ */

const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[2.7,2.2,4.6],target:[1.6,1.0,0.5],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:2.6,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ============================================================
   1) MODELO FÍSICO — instrumento, barrido, ajuste, veredicto
   (verificado por simulación de Monte Carlo, ver bitácora del lab)
   ============================================================ */
const METER={
  counts:6000,
  vSpec:{pct:0.5,dig:2},
  iSpec:{pct:1.0,dig:3},
  vRanges:[0.6,6,60,600],   // V
  iRanges:[6,60,600],       // mA
};
const SETPOINTS=[0.15,0.30,0.45,0.60,0.75,0.85,0.95,1.05].map(f=>f*12);

function noisyReading(trueVal,spec,ranges,counts){
  const range=ranges.find(r=>Math.abs(trueVal)<r)??ranges[ranges.length-1];
  const res=range/counts;
  const U=spec.pct/100*Math.abs(trueVal)+spec.dig*res;
  const err=(Math.random()*2-1)*U;
  const reading=Math.round((trueVal+err)/res)*res;
  return {reading,range,res,U};
}
function takeMeasurement(pts,Rtrue){
  const idx=pts.length;
  if(idx>=SETPOINTS.length)return null;
  const Vset=SETPOINTS[idx];
  const Itrue_mA=(Vset/Rtrue)*1000;
  const vR=noisyReading(Vset,METER.vSpec,METER.vRanges,METER.counts);
  const iR=noisyReading(Itrue_mA,METER.iSpec,METER.iRanges,METER.counts);
  const point={V:vR.reading,I:iR.reading/1000,vRes:vR.res,iRes:iR.res};
  pts.push(point);
  return point;
}
function fitR(pts){
  if(!pts||pts.length<1)return null;
  let sumVI=0,sumII=0;
  pts.forEach(p=>{sumVI+=p.V*p.I;sumII+=p.I*p.I;});
  return sumII>0?sumVI/sumII:null;
}
function verdict(rHat,nominal,tol){
  if(rHat==null)return null;
  return Math.abs(rHat-nominal)<=nominal*tol/100;
}

const decimalsForRes=res=>Math.max(0,Math.ceil(-Math.log10(res)-1e-9));
const fmtOhm=v=>{
  if(v==null||!isFinite(v))return'—';
  return Math.abs(v)>=1000?(v/1000).toFixed(3)+' kΩ':v.toFixed(2)+' Ω';
};

/* Código de colores REAL (IEC 60062, serie E12 · IEC 60063) */
const BAND_COLORS=['#1a1a1a','#6b4226','#c73a3a','#d2691e','#e8c832','#3f8f3f','#2b5fb8','#7d3fc4','#8a8a8a','#e8e8e8'];
const BAND_NAMES=['negro','café','rojo','naranja','amarillo','verde','azul','violeta','gris','blanco'];
function bandsFor(v){
  const exp=Math.floor(Math.log10(v))-1;
  const dd=Math.round(v/Math.pow(10,exp));
  return {d1:Math.floor(dd/10),d2:dd%10,mult:exp};
}
const E12=[1.0,1.2,1.5,1.8,2.2,2.7,3.3,3.9,4.7,5.6,6.8,8.2];
const TOL_COLORS={1:'#6b4226',2:'#c73a3a',5:'#c9a227',10:'#c8ccd0'};
const TOL_NAMES={1:'café',2:'rojo',5:'oro',10:'plata'};
const TOLS=[1,2,5,10];

const EXPLORA_R=[
  {id:'RX1',nominal:220,tol:5,true:224},
  {id:'RX2',nominal:1000,tol:1,true:1000},
  {id:'RX3',nominal:10000,tol:2,true:9950},
  {id:'RX4',nominal:4700,tol:10,true:3800},
];
const MYSTERY_NOMINALS=[220,1000,4700,10000];

/* ============================================================
   2) ESTADO
   ============================================================ */
let mode='explora';     // explora | reto
let selR=0;              // índice en EXPLORA_R
let points=[];
let mystery=null;
let retoSolved=false;
let retoMsg='';
let solved=false;        // pregunta de ingeniería del modo actual
let autoRunning=false;
let QUIZ={};

function currentNominal(){return mode==='reto'?mystery.nominal:EXPLORA_R[selR].nominal;}
function currentTol(){return mode==='reto'?mystery.tol:EXPLORA_R[selR].tol;}
function currentTrue(){return mode==='reto'?mystery.true:EXPLORA_R[selR].true;}
function currentLabel(){return mode==='reto'?'Resistor misterioso':EXPLORA_R[selR].id;}

function makeMystery(){
  const nominal=MYSTERY_NOMINALS[Math.floor(Math.random()*MYSTERY_NOMINALS.length)];
  const tol=TOLS[Math.floor(Math.random()*TOLS.length)];
  const within=Math.random()<0.5;
  const maxDrift=tol/100;
  const drift=within
    ?(Math.random()*2-1)*maxDrift*0.5
    :(Math.random()<0.5?-1:1)*(maxDrift*1.5+Math.random()*maxDrift*1.0);
  return {nominal,tol,true:Math.round(nominal*(1+drift)*100)/100,within};
}

/* ============================================================
   3) MATERIALES
   ============================================================ */
const std=o=>new THREE.MeshStandardMaterial(o);
const sh=m=>{m.castShadow=true;m.receiveShadow=true;return m;};
const brush=brushedMetal(), rub=rubber(), plas=techPlastic(0.16,0.19,0.18);
const MAT={
  bench:  std({...plas.maps,color:0x3a464d,roughness:0.85,metalness:0.05}),
  frame:  std({...plas.maps,color:0x232a2e,roughness:0.95,metalness:0}),
  leg:    std({...brush.maps,color:0x77828a,metalness:0.35,roughness:0.85}),
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
   4) PANTALLA — curva V–I en vivo (canvas → textura)
   ============================================================ */
const boardG=new THREE.Group();boardG.position.set(-0.95,0,-0.55);boardG.rotation.y=0.12;scene.add(boardG);
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
frame.userData={title:'Pantalla de la curva V–I',info:'Grafica en vivo cada punto medido, la recta de ajuste por mínimos cuadrados y la banda de tolerancia del resistor bajo prueba.'};
board.userData=frame.userData;
addHoverLabel(frame,'Curva V–I en vivo','#4FD1C5',new THREE.Vector3(0,1.65,0.3),1.0);

function line(c,x1,y1,x2,y2){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}

function drawBoard(){
  const c=bCv.getContext('2d');
  c.fillStyle='#0c1512';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,209,197,0.06)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);

  const R0=currentNominal(),tol=currentTol();
  c.fillStyle='#8FB3AC';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('CURVA V–I · '+currentLabel(),26,40);
  c.textAlign='right';c.fillText(points.length+'/'+SETPOINTS.length+' puntos',998,40);

  let maxI=(13.6/R0)*1000*1.15;
  points.forEach(p=>{maxI=Math.max(maxI,p.I*1000*1.15);});
  const px0=110,py0=680,pw=830,ph=580;
  const xOf=iMA=>px0+(iMA/maxI)*pw;
  const yOf=v=>py0-(v/14)*ph;

  c.strokeStyle='rgba(207,232,226,0.35)';c.lineWidth=2;
  line(c,px0,py0,px0+pw,py0);line(c,px0,py0,px0,py0-ph);
  c.fillStyle='#8FB3AC';c.font='14px Outfit, sans-serif';c.textAlign='center';
  c.fillText('I (mA) →',px0+pw/2,py0+38);
  c.save();c.translate(46,py0-ph/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText('V (volts) →',0,0);c.restore();

  c.strokeStyle='rgba(207,232,226,0.10)';c.lineWidth=1;c.font='12px Outfit, sans-serif';c.fillStyle='#5c7169';
  for(let k=0;k<=7;k++){
    const v=k*14/7,y=yOf(v);
    line(c,px0,y,px0+pw,y);c.textAlign='right';c.fillText(v.toFixed(1),px0-10,y+4);
  }
  for(let k=0;k<=6;k++){
    const iv=k*maxI/6,x=xOf(iv);
    line(c,x,py0,x,py0-ph);c.textAlign='center';c.fillText(iv.toFixed(1),x,py0+18);
  }

  c.save();c.beginPath();c.rect(px0,py0-ph,pw,ph);c.clip();
  const drawFrom0=(Rval,color,dash)=>{
    c.strokeStyle=color;c.lineWidth=2;c.setLineDash(dash||[]);
    const vAtMax=Rval*(maxI/1000);
    c.beginPath();c.moveTo(xOf(0),yOf(0));c.lineTo(xOf(maxI),yOf(vAtMax));c.stroke();c.setLineDash([]);
  };
  drawFrom0(R0*(1+tol/100),'rgba(255,183,3,0.55)',[9,7]);
  drawFrom0(R0*(1-tol/100),'rgba(255,183,3,0.55)',[9,7]);
  drawFrom0(R0,'rgba(143,179,172,0.55)',[2,5]);
  const rHat=fitR(points);
  if(rHat!=null)drawFrom0(rHat,'#4FD1C5',null);
  points.forEach(p=>{
    const x=xOf(p.I*1000),y=yOf(p.V);
    const instR=p.I>0?p.V/p.I:null;
    const okp=instR!=null&&verdict(instR,R0,tol);
    c.beginPath();c.arc(x,y,7,0,7);c.fillStyle=okp?'#34d399':'#f4475e';c.fill();
    c.strokeStyle='#0c1512';c.lineWidth=1.5;c.stroke();
  });
  c.restore();

  c.textAlign='left';
  if(rHat!=null){
    const okEnough=points.length>=3;
    const pass=verdict(rHat,R0,tol);
    c.font='bold 20px Outfit, sans-serif';c.fillStyle=okEnough?(pass?'#34d399':'#f4475e'):'#FFB703';
    c.fillText('R̂ = '+fmtOhm(rHat)+(okEnough?(pass?' · dentro de tolerancia':' · fuera de tolerancia'):' · (mínimo 3 puntos para veredicto)'),px0+14,py0-ph+30);
  }else{
    c.font='14px Outfit, sans-serif';c.fillStyle='#5c7169';
    c.fillText('Mide al menos 1 punto para iniciar el ajuste por mínimos cuadrados.',px0+14,py0-ph+30);
  }
  bTex.needsUpdate=true;
}

/* ============================================================
   5) BANCO 3D — fuente, resistor bajo prueba, voltímetro y amperímetro
   ============================================================ */
const bench=sh(roundedBox(3.0,0.5,1.7,MAT.bench,0.05));bench.position.set(1.6,0.25,0.6);scene.add(bench);
bench.userData={title:'Banco de medición',info:'Fuente ajustable, resistor bajo prueba y dos multímetros: uno en SERIE (amperímetro) y otro en PARALELO (voltímetro).'};

function makeMeterCase(x,z,mat){
  const cv=document.createElement('canvas');cv.width=256;cv.height=96;
  const tx=new THREE.CanvasTexture(cv);
  tx.colorSpace=THREE.SRGBColorSpace;tx.minFilter=THREE.LinearFilter;tx.generateMipmaps=false;
  const g=new THREE.Group();g.position.set(x,0.72,z);scene.add(g);
  const box=sh(roundedBox(0.50,0.42,0.38,mat,0.06));g.add(box);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(0.38,0.15),new THREE.MeshBasicMaterial({map:tx,toneMapped:false}));
  pl.position.set(0,0.05,0.20);g.add(pl);
  return {g,cv,tx};
}
const PSU=makeMeterCase(0.62,0.6,MAT.psu);
const postR=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.10,10),MAT.jackRed));postR.position.set(-0.13,0.27,0.10);PSU.g.add(postR);
const postB=sh(new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.10,10),MAT.jackBlk));postB.position.set(0.13,0.27,0.10);PSU.g.add(postB);
PSU.g.userData={title:'Fuente ajustable',info:'Barre 8 tensiones fijas (0.15×…1.05× de 12 V) para trazar la curva V–I.'};
addHoverLabel(PSU.g,'Fuente de banco','#f0a5a5',new THREE.Vector3(0,0.5,0),0.75);

const VM=makeMeterCase(2.55,0.22,MAT.psu);
VM.g.userData={title:'Voltímetro (en PARALELO)',info:'Se conecta EN PARALELO con el resistor: mide la misma diferencia de potencial en sus dos terminales, con alta impedancia de entrada (idealmente infinita) para no desviar corriente.'};
addHoverLabel(VM.g,'Voltímetro · paralelo','#4FD1C5',new THREE.Vector3(0,0.5,0),0.75);

const AM=makeMeterCase(2.55,0.98,MAT.psu);
AM.g.userData={title:'Amperímetro (en SERIE)',info:'Se conecta EN SERIE dentro del lazo: toda la corriente del resistor pasa también por él, con baja impedancia (idealmente cero) para no añadir caída de tensión.'};
addHoverLabel(AM.g,'Amperímetro · serie','#FFB703',new THREE.Vector3(0,0.5,0),0.75);

/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio:MAT.lead, acero:MAT.lead, cromo:MAT.lead, chapa:MAT.lead,
  cobre:std({color:0xb87333,roughness:0.35,metalness:0.75}),
  negro:std({color:0x14181e,roughness:0.62,metalness:0.06}),
  goma:std({color:0x14181e,roughness:0.80,metalness:0.02}),
  blanco:std({color:0xd7dee6,roughness:0.40,metalness:0.20}),
  ceramica:std({color:0xd7dee6,roughness:0.60,metalness:0.05}),
};
/* LA RESISTENCIA, que es de lo que trata esta practica. Cuerpo abarrilado con
   hombros, las TRES BANDAS DE VALOR agrupadas y la de TOLERANCIA separada al
   otro extremo —esa separacion es la que dice por que lado se empieza a leer, y
   sin ella el mismo dibujo vale para dos valores distintos— y las patas
   dobladas. El panel cambia las cuatro bandas con el valor y la tolerancia
   elegidos, asi que aqui el codigo de colores se lee de verdad. */
const RES={};
(function(){
  const g=P3.resistencia(MATP,{largo:0.22,d:0.10,patas:0.06,paso:0.38,
    bandas:[0x1a1a1a,0x1a1a1a,0x1a1a1a,0x1a1a1a],cuerpo:0x9a815c});
  g.position.set(1.6,0.62-g.userData.alturaEje,0.6);
  g.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
  g.userData.special='resistor';
  scene.add(g);RES.g=g;RES.bands=g.userData.bandas;
  addHoverLabel(g,'Toca para leer las bandas','#4FD1C5',new THREE.Vector3(0,0.22,0),0.7);
})();

function cable(ax,ay,az,bx,by,bz,mat){
  const a=new THREE.Vector3(ax,ay,az),b=new THREE.Vector3(bx,by,bz);
  const m=a.clone().lerp(b,0.5);m.y=Math.max(a.y,b.y)+0.16;
  const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,m,b]),24,0.014,8),mat);
  t.castShadow=true;scene.add(t);
}
// lazo serie: PSU(+) → amperímetro → resistor → amperímetro → PSU(−)
cable(0.49,0.99,0.70,1.41,0.62,0.60,MAT.cableRed);
cable(1.79,0.62,0.60,2.55,0.72,1.16,MAT.cableRed);
cable(2.55,0.72,1.16,0.75,0.99,0.70,MAT.cableBlk);
// voltímetro en PARALELO: ambas puntas a los mismos nodos que el resistor
cable(1.41,0.62,0.60,2.55,0.72,0.40,MAT.cableBlk);
cable(1.79,0.62,0.60,2.55,0.72,0.40,MAT.cableRed);

function drawPSU(){
  const c=PSU.cv.getContext('2d');
  c.fillStyle='#071410';c.fillRect(0,0,256,96);
  c.strokeStyle='rgba(240,165,165,0.4)';c.lineWidth=3;c.strokeRect(3,3,250,90);
  const n=points.length,done=n>=SETPOINTS.length;
  c.fillStyle='#f0a5a5';c.font='bold 14px Outfit, sans-serif';c.textAlign='center';
  c.fillText(done?'BARRIDO COMPLETO':'PUNTO '+(n+1)+'/'+SETPOINTS.length,128,26);
  c.font='bold 30px Outfit, sans-serif';
  c.fillText((done?SETPOINTS[SETPOINTS.length-1]:SETPOINTS[n]).toFixed(2)+' V',128,64);
  PSU.tx.needsUpdate=true;
}
function drawVM(){
  const c=VM.cv.getContext('2d');
  c.fillStyle='#071410';c.fillRect(0,0,256,96);
  c.strokeStyle='rgba(79,209,197,0.4)';c.lineWidth=3;c.strokeRect(3,3,250,90);
  const last=points[points.length-1];
  c.fillStyle='#4FD1C5';c.font='bold 15px Outfit, sans-serif';c.textAlign='center';
  c.fillText('VOLTS',128,26);
  c.font='bold 32px Outfit, sans-serif';
  c.fillText(last?last.V.toFixed(decimalsForRes(last.vRes))+' V':'— V',128,64);
  VM.tx.needsUpdate=true;
}
function drawAM(){
  const c=AM.cv.getContext('2d');
  c.fillStyle='#071410';c.fillRect(0,0,256,96);
  c.strokeStyle='rgba(255,183,3,0.4)';c.lineWidth=3;c.strokeRect(3,3,250,90);
  const last=points[points.length-1];
  c.fillStyle='#FFB703';c.font='bold 15px Outfit, sans-serif';c.textAlign='center';
  c.fillText('AMPS',128,26);
  c.font='bold 32px Outfit, sans-serif';
  c.fillText(last?(last.I*1000).toFixed(decimalsForRes(last.iRes))+' mA':'— mA',128,64);
  AM.tx.needsUpdate=true;
}
function refresh3D(){
  const R0=currentNominal(),tol=currentTol();
  const b=bandsFor(R0);
  [b.d1,b.d2,b.mult].forEach((dig,i)=>RES.bands[i].material.color.set(BAND_COLORS[dig]));
  RES.bands[3].material.color.set(TOL_COLORS[tol]);
  drawPSU();drawVM();drawAM();
}

/* ============================================================
   6) HUD + PANEL
   ============================================================ */
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos · Instrumentación y metrología (D1)</div>
  <h2>Curva V–I de resistores: caracterización y validación de tolerancias</h2>
  <p>Un banco con fuente ajustable, amperímetro (serie) y voltímetro (paralelo) mide
  <b>8 puntos V–I</b> de un resistor. Con esos datos, ajusta una recta por
  <b>mínimos cuadrados que pasa por el origen</b> (V = R·I) y decide si la resistencia
  <b>real</b> del componente cae dentro de la tolerancia impresa en sus bandas de colores.</p>
  <div class="formula">Ley de Ohm: V = I·R<br>Ajuste (recta por el origen): R̂ = ΣV·I / ΣI²<br>Veredicto: |R̂ − R_nominal| ≤ R_nominal·tol%</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Recta de ajuste (R̂)</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Banda de tolerancia (± tol %)</div>
    <div class="li"><span class="dot" style="background:#34d399"></span>Punto dentro de tolerancia</div>
    <div class="li"><span class="dot" style="background:#f4475e"></span>Punto fuera de tolerancia</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> barrido de tensión ideal (8 puntos fijos), ruido de medición realista tipo multímetro digital de 6000 cuentas con incertidumbre ±(%lectura + dígitos) según su rango (auto-rango), resistor óhmico ideal (V = IR exacto, sin autocalentamiento), ajuste por mínimos cuadrados por el origen, código de colores real (IEC 60062, serie E12 de IEC 60063).</div>
    <div class="fl no"><b>NO modela:</b> coeficiente de temperatura ni autocalentamiento del resistor a corrientes altas, resistencia de cables y contactos, offset o deriva del instrumento, componentes no óhmicos (diodos, termistores) — es el resistor ideal de parámetros concentrados, medido con un instrumento realista.</div>
  </div>
  <div class="src">Ref: Ley de Ohm (G. Ohm, 1827) · IEC 60062 · IEC 60063 (serie E12) · mínimos cuadrados (Gauss/Legendre, ca. 1805)</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Banco V–I · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div class="modebar" id="selbar"></div>
  <div class="btns">
    <button class="b primary" id="btnMeasure">📏 Medir siguiente punto (0/8)</button>
  </div>
  <div id="tele">
    <div class="g"><div class="gl"><span>Última V</span><b id="t_v">—</b></div></div>
    <div class="g"><div class="gl"><span>Última I</span><b id="t_i">—</b></div></div>
    <div class="g"><div class="gl"><span>Puntos</span><b id="t_n">—</b></div></div>
    <div class="g"><div class="gl"><span>R̂ (ajuste)</span><b id="t_rhat">—</b></div></div>
    <div class="g"><div class="gl"><span>Veredicto</span><b id="t_verdict">—</b></div></div>
  </div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Tu veredicto</h4>
  <div id="retoBox" style="display:none">
    <div style="font-size:12px;color:var(--ink);margin:2px 0 8px">Lee las bandas (nominal y tolerancia), mide al menos 3 puntos y decide: ¿la resistencia REAL está dentro de tolerancia?</div>
    <div class="btns">
      <button class="b" id="btnPasa" disabled>✅ PASA</button>
      <button class="b" id="btnFalla" disabled>❌ FALLA</button>
      <button class="b primary" id="btnNew">🔀 Nuevo caso</button>
    </div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
  </div>`;

const el=id=>document.getElementById(id);

/* ============================================================
   7) TOASTS + INFO DE ELEMENTO
   ============================================================ */
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3200);
}
function toastResistor(){
  const R0=currentNominal(),tol=currentTol();
  const b=bandsFor(R0);
  const bandas=`${BAND_NAMES[b.d1]}-${BAND_NAMES[b.d2]}-${BAND_NAMES[b.mult]}-${TOL_NAMES[tol]}`;
  showToast(`<b style="color:var(--accent2)">${currentLabel()} · nominal ${fmtOhm(R0)} ±${tol}%</b><br><span style="color:var(--dim);font-size:11px">Bandas: ${bandas}. La resistencia REAL solo se conoce midiendo (ley de Ohm + ajuste por mínimos cuadrados).</span>`);
}

/* ============================================================
   8) MODOS + SELECCIÓN
   ============================================================ */
const MODE_META={
  explora:{nombre:'Explora',cam:[[2.7,2.2,4.6],[1.6,1.0,0.5]],mision:'Mide la curva V–I de 4 resistores conocidos y valida su tolerancia con datos reales.'},
  reto:{nombre:'Reto',cam:[[2.9,2.0,4.2],[1.6,1.0,0.5]],mision:'La resistencia real está oculta. Lee las bandas, mide, ajusta y decide: PASA o FALLA.'},
};
function setMode(k){
  mode=k;
  ['explora','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  const reto=k==='reto';
  el('retoTitle').style.display=reto?'':'none';
  el('retoBox').style.display=reto?'':'none';
  points=[];
  if(reto&&!mystery){mystery=makeMystery();retoSolved=false;retoMsg='';}
  buildSelBar();
  solved=false;clearDx();refreshQuestion();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  refresh3D();refreshAll();
}
function buildSelBar(){
  const bar=el('selbar');
  if(mode==='explora'){
    bar.style.display='';
    bar.innerHTML=EXPLORA_R.map((r,i)=>`<button class="b" id="r_${i}">${r.id} · ${fmtOhm(r.nominal)}</button>`).join('');
    EXPLORA_R.forEach((r,i)=>{el('r_'+i).onclick=()=>selectR(i);});
    syncRBtns();
  }else{bar.style.display='none';bar.innerHTML='';}
}
function syncRBtns(){if(mode!=='explora')return;EXPLORA_R.forEach((r,i)=>el('r_'+i).classList.toggle('on',selR===i));}
function selectR(i){
  selR=i;points=[];syncRBtns();
  synth.beep(660,0.05,0.04);
  refresh3D();refreshAll();
}

/* ============================================================
   9) MEDICIÓN + TELEMETRÍA
   ============================================================ */
function measure(){
  if(points.length>=SETPOINTS.length){showToast('Barrido completo: ya tienes los 8 puntos.');return;}
  const p=takeMeasurement(points,currentTrue());
  synth.beep(880,0.05,0.04);
  refresh3D();refreshAll();
  showToast(`Punto ${points.length}/${SETPOINTS.length} · V=${p.V.toFixed(decimalsForRes(p.vRes))} V · I=${(p.I*1000).toFixed(decimalsForRes(p.iRes))} mA`);
}
function updateTele(){
  const set=(id,txt,cls)=>{const b=el(id);b.textContent=txt;b.className=cls||'';};
  const last=points[points.length-1];
  set('t_v',last?last.V.toFixed(decimalsForRes(last.vRes))+' V':'—');
  set('t_i',last?(last.I*1000).toFixed(decimalsForRes(last.iRes))+' mA':'—');
  set('t_n',points.length+' / '+SETPOINTS.length);
  const rHat=fitR(points);
  set('t_rhat',rHat!=null?fmtOhm(rHat):'—');
  if(rHat!=null&&points.length>=3){
    const pass=verdict(rHat,currentNominal(),currentTol());
    set('t_verdict',pass?'PASA':'FALLA',pass?'good':'bad');
  }else{
    set('t_verdict',points.length===0?'—':'faltan puntos','warn');
  }
}
function updateReport(){
  const R0=currentNominal(),tol=currentTol();
  let html;
  if(mode==='explora'){
    html=`<span class="mono">Resistor ${currentLabel()} · nominal ${fmtOhm(R0)} · tolerancia ±${tol}% (${TOL_NAMES[tol]})</span><br>`+
      `<span class="mono">Cada clic en "Medir" toma un punto (V,I) en el siguiente escalón de tensión con ruido realista de instrumento.</span><br>`+
      `<span class="mono">Con ≥3 puntos, R̂ = ΣV·I/ΣI² y comparas contra el nominal.</span>`;
  }else{
    html=retoMsg||`<span class="mono">Lee las bandas del resistor: nominal ${fmtOhm(R0)}, tolerancia ±${tol}% (${TOL_NAMES[tol]}). La resistencia REAL está oculta — mide para descubrirla y decide PASA/FALLA.</span>`;
  }
  el('report').innerHTML=html;
}
function updatePanelButtons(){
  const n=points.length,done=n>=SETPOINTS.length;
  el('btnMeasure').textContent=done?'✔ Barrido completo (8/8)':'📏 Medir siguiente punto ('+n+'/8)';
  el('btnMeasure').disabled=done;
  if(mode==='reto'){
    const canDecide=n>=3&&!retoSolved;
    el('btnPasa').disabled=!canDecide;el('btnFalla').disabled=!canDecide;
  }
}
function refreshAll(){drawBoard();updateTele();updateReport();updatePanelButtons();}

/* ============================================================
   10) RETO — caso misterioso + veredicto autocalificado
   ============================================================ */
function checkReto(decision){
  if(points.length<3){showToast('Mide al menos 3 puntos antes de decidir.');return;}
  const rHat=fitR(points);
  const pass=verdict(rHat,mystery.nominal,mystery.tol);
  const correct=decision===pass;
  if(correct){
    retoSolved=true;synth.beep(1046,0.12,0.06);
    const errPct=(mystery.true-mystery.nominal)/mystery.nominal*100;
    retoMsg=`<span class="mono"><span class="ok">✔ Correcto.</span> Con tus ${points.length} puntos, R̂ = ${fmtOhm(rHat)} → ${pass?'PASA':'FALLA'} (nominal ${fmtOhm(mystery.nominal)} ±${mystery.tol}%).</span><br>`+
      `<span class="mono">Valor real de fábrica: ${fmtOhm(mystery.true)} (${errPct>=0?'+':''}${errPct.toFixed(1)}% del nominal) — tu ajuste quedó dentro del error esperado del instrumento.</span>`;
  }else{
    synth.beep(220,0.15,0.06);
    retoMsg=`<span class="mono"><span class="dtc">✗ Revisa tu propio ajuste.</span> Con tus ${points.length} puntos, R̂ = ${fmtOhm(rHat)}. El nominal es ${fmtOhm(mystery.nominal)} ±${mystery.tol}% → rango [${fmtOhm(mystery.nominal*(1-mystery.tol/100))}, ${fmtOhm(mystery.nominal*(1+mystery.tol/100))}]. ¿R̂ cae dentro o fuera de ese rango?</span>`;
  }
  refreshAll();
}
function newMystery(){
  mystery=makeMystery();
  points=[];retoSolved=false;retoMsg='';solved=false;clearDx();refreshQuestion();
  refresh3D();refreshAll();
  showToast('🔀 <b>Nuevo caso.</b> Lee las bandas del resistor y mide para verificar si está dentro de tolerancia.');
  synth.beep(520,0.08,0.05);
}

/* ============================================================
   11) PREGUNTAS DE INGENIERÍA
   ============================================================ */
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'El ajuste usa una recta que pasa por el origen (V = R̂·I) en vez de una recta general V = m·I + b. ¿Por qué?',
      opciones:[
        {t:'Porque el modelo físico (ley de Ohm ideal) no tiene término independiente: a I = 0, V = 0 exactamente',ok:true,why:'Un resistor ideal no almacena carga ni tiene offset: sin corriente no hay caída de tensión. Forzar la recta por el origen usa esa restricción física y mejora el ajuste con pocos puntos.'},
        {t:'Porque el multímetro siempre empieza midiendo en 0 V',ok:false,why:'El barrido empieza en 1.8 V (15% de 12 V), no en 0. El origen es una restricción del MODELO físico, no del procedimiento de medición.'},
        {t:'Porque una recta general siempre da un ajuste peor',ok:false,why:'No siempre: si hubiera un offset real (por ejemplo, resistencia de contacto), forzar el origen introduciría un sesgo. Aquí se justifica porque el modelo (V=IR) no tiene ese término.'},
        {t:'Es una convención arbitraria sin justificación física',ok:false,why:'Todo lo contrario: viene directamente de la ley de Ohm, V=IR, que no tiene término constante.'},
      ],
    },
    reto:{
      pregunta:'Tomaste 3 puntos y tu R̂ cae muy cerca del borde de la tolerancia. ¿Qué deberías hacer antes de dar tu veredicto final?',
      opciones:[
        {t:'Tomar más puntos (hasta 8): más datos reducen el error del ajuste por mínimos cuadrados',ok:true,why:'El ruido del instrumento es aleatorio; con más puntos independientes, el ajuste por mínimos cuadrados promedia ese ruido y R̂ converge mejor al valor real.'},
        {t:'Confiar en el color de las bandas: si "se ve" del valor correcto, ya basta',ok:false,why:'Las bandas indican el valor NOMINAL impreso, no el valor real del componente — ese es justo el punto del reto: verificarlo con datos.'},
        {t:'Repetir el mismo punto de tensión varias veces en vez de barrer otros puntos',ok:false,why:'Repetir el mismo punto solo promedia el ruido de ESE punto; barrer distintos puntos de tensión aprovecha mejor el rango dinámico y la física del ajuste lineal.'},
        {t:'Detenerte: 3 puntos siempre son suficientes, sin importar la tolerancia',ok:false,why:'Con tolerancias ajustadas (±1%), el ruido del instrumento puede confundir el veredicto con pocos puntos; conviene medir más antes de decidir en casos límite.'},
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
   12) PICKING + HOVER
   ============================================================ */
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return;
  let o=hit.object;
  while(o){
    const u=o.userData||{};
    if(u.special==='resistor'){toastResistor();return;}
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
        if(o.userData&&(o.userData.title||o.userData.special))cursor='pointer';
        o=o.parent;
      }
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
    setMode('explora');selectR(0);
    showToast('Paso 1 · Banco de medición: fuente ajustable, amperímetro en serie y voltímetro en paralelo con el resistor.');await sleep(2800);
    for(let i=0;i<SETPOINTS.length;i++){measure();await sleep(450);}
    showToast(`Paso 2 · 8 puntos medidos en ${EXPLORA_R[0].id}. R̂ = ${fmtOhm(fitR(points))} → ${verdict(fitR(points),currentNominal(),currentTol())?'PASA':'FALLA'} tolerancia.`);await sleep(3000);
    selectR(3);
    showToast(`Paso 3 · Ojo con ${EXPLORA_R[3].id}: la etiqueta dice ${fmtOhm(EXPLORA_R[3].nominal)}, pero mide antes de confiar en ella…`);await sleep(2800);
    for(let i=0;i<SETPOINTS.length;i++){measure();await sleep(400);}
    await sleep(1200);
    const qE=QUIZ.explora,ie=qE.opciones.findIndex(o=>o.ok);
    clearDx();
    const dxE=el('dxbtns').children[ie];
    if(dxE){dxE.classList.add('right');solved=true;synth.beep(1046,0.12,0.06);}
    showToast(`<span style="color:var(--good)">✔ ${qE.opciones[ie].t}</span><br><span style="color:var(--dim);font-size:11px">${qE.opciones[ie].why}</span>`);await sleep(2600);

    setMode('reto');
    showToast('Paso 4 · Reto: la resistencia real está oculta. Mide y decide PASA/FALLA con tu propio ajuste.');await sleep(2600);
    for(let i=0;i<SETPOINTS.length;i++){measure();await sleep(400);}
    await sleep(600);
    const rHat=fitR(points),pass=verdict(rHat,mystery.nominal,mystery.tol);
    checkReto(pass);await sleep(2600);
    const qR=QUIZ.reto,ir=qR.opciones.findIndex(o=>o.ok);
    clearDx();
    const dxR=el('dxbtns').children[ir];
    if(dxR){dxR.classList.add('right');solved=true;synth.beep(1046,0.12,0.06);}
    showToast(`<span style="color:var(--good)">✔ ${qR.opciones[ir].t}</span><br><span style="color:var(--dim);font-size:11px">${qR.opciones[ir].why}</span>`);await sleep(2400);
    newMystery();
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

/* ============================================================
   14) SONIDO + INIT
   ============================================================ */
['explora','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnMeasure').onclick=measure;
el('btnPasa').onclick=()=>checkReto(true);
el('btnFalla').onclick=()=>checkReto(false);
el('btnNew').onclick=newMystery;
el('btnAuto').onclick=runAuto;
el('soundBtn').onclick=()=>{const on=synth.toggle();el('soundBtn').textContent=on?'🔊 Sonido':'🔇 Sonido';};
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildQuiz();
S.start();
setMode('explora');

/* gancho de verificación independiente (tests re-verifican la física en Node) */
window.__labDebug={
  state:()=>({mode,selR,points:points.slice(),mystery:mystery?{...mystery}:null,retoSolved,solved}),
  measure,
  fitR,
  verdict,
  noisyReading,
  takeMeasurement,
  mystery:()=>mystery?{...mystery}:null,
  setMode,
  selectR,
  newMystery,
  checkReto,
};
