/* ============================================================
   LAB — DIODO ZENER: REGULADOR SHUNT DE VOLTAJE
   (Dominio D2 · Electrónica analógica — molde S+P: esquemático IEC 60617
    con motor de cálculo + banco de instrumentos)
   Normatividad / referencia: hojas de datos comerciales de diodos zener —
   ON Semiconductor 1N4728A–1N4764A (1 W, series completa) y
   Vishay General Semiconductor 1N5221B–1N5281B (500 mW, series completa).
   VZ, IZT, ZZT, IZK, ZZK e IZM tomados de esas hojas de datos.
   Motor de cálculo: modelo zener lineal por tramos (piecewise-linear) anclado
   al punto de prueba VZ@IZT de cada hoja de datos:
     VZK = VZ + (IZK − IZT)·ZZT   (voltaje de "codo", corregido de IZT a IZK)
     V0  = VZK − IZK·ZZK          (intersección de la recta de avalancha en V)
     Corte      (Vz ≤ V0)        : Iz = 0
     Codo       (V0 < Vz ≤ VZK)  : Iz = (Vz − V0)/ZZK
     Avalancha  (Vz > VZK)       : Iz = IZK + (Vz − VZK)/ZZT
   El circuito (fuente Vin, resistor serie Rs, zener en shunt, carga RL) se
   resuelve por bisección monótona exacta sobre
     f(V) = (Vin − V)/Rs − Iz(V) − V/RL = 0
   NO modela:
     - Coeficiente de temperatura αVZ dependiente de VZ: las hojas de datos
       consultadas no reportan un valor único confiable por parte — el efecto
       térmico se muestra solo como nota cualitativa, nunca como corrimiento
       numérico de VZ.
     - Corriente de fuga sub-codo (Vz ≤ V0): se idealiza como Iz = 0 exacto.
     - Capacitancia de unión ni respuesta transitoria/AC del zener.
     - Ruido de avalancha (avalanche noise).
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.1,2.5,7.2],target:[0.5,1.3,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ---------- 1) Modelo físico ---------- */
const DEVS={
  z4728:{name:'1N4728A',fam:'1N4728A–1N4764A (1 W)',vz:3.3, izt:0.076,zzt:10,  izk:0.001,zzk:400, izm:0.276,ptot:1.0},
  z4733:{name:'1N4733A',fam:'1N4728A–1N4764A (1 W)',vz:5.1, izt:0.049,zzt:7,   izk:0.001,zzk:500, izm:0.178,ptot:1.0},
  z5231:{name:'1N5231B',fam:'1N5221B–1N5281B (500 mW)',vz:5.1, izt:0.020,zzt:17,  izk:0.001,zzk:1600,izm:0.095,ptot:0.5},
};
function vzk(z){return z.vz+(z.izk-z.izt)*z.zzt;}
function v0(z){return vzk(z)-z.izk*z.zzk;}
function vAtIzm(z){return vzk(z)+(z.izm-z.izk)*z.zzt;}
function izOfV(z,v){
  const K=vzk(z),V0=v0(z);
  if(v<=V0)return 0;
  if(v<=K)return (v-V0)/z.zzk;
  return z.izk+(v-K)/z.zzt;
}
function solveShunt(z,vin,rs,rl){
  let lo=0,hi=vin;
  const f=function(v){return (vin-v)/rs - izOfV(z,v) - (isFinite(rl)?v/rl:0);};
  for(let k=0;k<80;k++){
    const mid=(lo+hi)/2;
    if(f(mid)>0)lo=mid;else hi=mid;
  }
  const v=(lo+hi)/2;
  const iz=izOfV(z,v);
  const ir=(vin-v)/rs;
  const il=isFinite(rl)?v/rl:0;
  return {v:v,iz:iz,ir:ir,il:il};
}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function fmtV(v){return v.toFixed(2)+' V';}
function fmtI(i){
  if(i>=1)return i.toFixed(3)+' A';
  if(i>=0.001)return (i*1000).toFixed(1)+' mA';
  return (i*1e6).toFixed(0)+' µA';
}
function fmtP(w){return w>=1?w.toFixed(3)+' W':(w*1000).toFixed(1)+' mW';}
function fmtR(r){return isFinite(r)?(r>=1000?(r/1000).toFixed(2)+' kΩ':r.toFixed(0)+' Ω'):'∞ (abierta)';}

/* ---------- 2) Estado ---------- */
const RSVALS=[47,68,100,150,220];
const RLVALS=[100,220,330,470,1000,Infinity];
let zsel='z4728', Rsidx=4, RLidx=3, Vin=9, TC=25;
let mode='explora', logY=false, solved=false;
let PRED=null, predSolved=false, predRevealed=false;
let RETO=null, retoSolved=false;
let sweeping=false;
const SWEEPV=[];
let RES=null;
function curRs(){return RSVALS[Rsidx];}
function curRl(){return RLVALS[RLidx];}
function curZ(){return DEVS[zsel];}
function curColor(){
  if(!RES)return '#2e6fe0';
  if(RES.zone==='over')return '#d23b3b';
  if(RES.zone==='valid')return '#2e6fe0';
  return '#5a6b66';
}

/* ---------- 3) Materiales ---------- */
const std=function(o){return new THREE.MeshStandardMaterial(o);};
const MAT={
  bench:std({color:0x0e1512,roughness:0.9,metalness:0.05}),
  frame:std({color:0x11201c,roughness:0.6,metalness:0.3}),
  pcb:std({color:0x0c2a20,roughness:0.75}),
  psu:std({color:0x1a2622,roughness:0.4,metalness:0.4}),
  scope:std({color:0x121a18,roughness:0.35,metalness:0.5}),
  lead:std({color:0xb9c2bd,metalness:0.8,roughness:0.3}),
  trace:std({color:0xffb703,metalness:0.2,roughness:0.5}),
  jackRed:std({color:0xd23b3b,roughness:0.4}),
  jackBlk:std({color:0x1a1a1a,roughness:0.4}),
  cableRed:std({color:0xc23a3a,roughness:0.6}),
  cableBlk:std({color:0x161616,roughness:0.6}),
  cap:std({color:0x2a3a52,roughness:0.35,metalness:0.5}),
  xfmr:std({color:0x33261a,roughness:0.5,metalness:0.2}),
  resistor:std({color:0xe8d9b0,roughness:0.5}),
  zenerBody:std({color:0x161616,roughness:0.25,metalness:0.15}),
  zenerBand:std({color:0xd8d8d8,metalness:0.6,roughness:0.3}),
};
const BAND_COLORS=['#1a1a1a','#7a4a1e','#d23b3b','#e8871e','#e8d21e','#3fae3f','#2e6fe0','#8a4fd6','#8a8a8a','#e8e8e8'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1,dd=Math.round(v/Math.pow(10,exp));return {d1:Math.floor(dd/10),d2:dd%10,mult:exp+1};}

/* ---------- 4) Ayudantes de dibujo 2D ---------- */
function line(c,x0,y0,x1,y1,col,w,dash){c.save();c.strokeStyle=col;c.lineWidth=w||2;if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
function rr(c,x,y,w,h,r,fill,stroke,sw){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=sw||2;c.stroke();}}
function groundGlyph(c,x,y){line(c,x,y,x,y+14,'#EAF4F1',2.5);line(c,x-16,y+14,x+16,y+14,'#EAF4F1',2.5);line(c,x-10,y+21,x+10,y+21,'#EAF4F1',2);line(c,x-4,y+28,x+4,y+28,'#EAF4F1',1.5);}
function resistorGlyph(c,cx,y0,y1,label){rr(c,cx-16,y0+8,32,(y1-y0)-16,4,'#1a2a26','#EAF4F1',2);line(c,cx,y0,cx,y0+8,'#EAF4F1',2.5);line(c,cx,y1-8,cx,y1,'#EAF4F1',2.5);if(label){c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='left';c.fillText(label,cx+22,(y0+y1)/2+4);}}
function hResistorGlyph(c,x0,x1,cy,label){rr(c,x0+8,cy-16,(x1-x0)-16,32,4,'#1a2a26','#EAF4F1',2);line(c,x0,cy,x0+8,cy,'#EAF4F1',2.5);line(c,x1-8,cy,x1,cy,'#EAF4F1',2.5);if(label){c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='center';c.fillText(label,(x0+x1)/2,cy-22);}}
function zenerGlyph(c,cx,y0,y1,color){
  const my=(y0+y1)/2,h=(y1-y0)/2;
  c.beginPath();c.moveTo(cx-15,my+h);c.lineTo(cx+15,my+h);c.lineTo(cx,my-h);c.closePath();
  c.fillStyle=color;c.fill();c.strokeStyle='#EAF4F1';c.lineWidth=2;c.stroke();
  line(c,cx-15,my-h,cx+15,my-h,'#EAF4F1',3);
  line(c,cx-15,my-h,cx-15,my-h+7,'#EAF4F1',2.5);
  line(c,cx+15,my-h,cx+15,my-h-7,'#EAF4F1',2.5);
}

/* ---------- 5) Pizarrón: esquemático + gráfica V-I ---------- */
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;
const PX0=130,PX1=940,PY0=308,PY1=676;
const WY=104,BY=256,srcX=150,srcY=(WY+BY)/2,rsX0=232,outX=460,zX=460,rlX=640;
const HIT=[
  {x:srcX,y:srcY,r:55,act:'src'},
  {x:(rsX0+outX)/2,y:WY,r:50,act:'rs'},
  {x:zX,y:(WY+BY)/2,r:55,act:'zen'},
  {x:rlX,y:(WY+BY)/2,r:50,act:'rl'},
  {x:890,y:333,r:46,act:'log'}
];
function xPix(v){const vm=RES?RES.vMaxG:6;return PX0+(v/vm)*(PX1-PX0);}
function gyPix(i){
  if(logY){const t=(Math.log10(Math.max(i,1e-9))+4)/4;return PY1-t*(PY1-PY0);}
  const im=RES?RES.iMaxG:0.3;
  return PY1-(i/im)*(PY1-PY0);
}
function drawSchematic(c){
  c.clearRect(0,0,1024,PY0-4);
  line(c,srcX,WY,rsX0,WY,'#EAF4F1',2.5);
  hResistorGlyph(c,rsX0,outX,WY,'Rs');
  line(c,outX,WY,rlX,WY,'#EAF4F1',2.5);
  c.beginPath();c.arc(outX,WY,4,0,7);c.fillStyle='#4FD1C5';c.fill();
  line(c,zX,WY,zX,WY+40,'#EAF4F1',2.5);
  zenerGlyph(c,zX,WY+40,BY-40,curColor());
  line(c,zX,BY-40,zX,BY,'#EAF4F1',2.5);
  if(isFinite(curRl())){
    line(c,rlX,WY,rlX,WY+40,'#EAF4F1',2.5);
    resistorGlyph(c,rlX,WY+40,BY-40,'RL');
    line(c,rlX,BY-40,rlX,BY,'#EAF4F1',2.5);
  }else{
    line(c,rlX,WY,rlX,WY+70,'#EAF4F1',2.5);
    c.beginPath();c.arc(rlX,WY+78,4,0,7);c.strokeStyle='#8FB3AC';c.lineWidth=2;c.stroke();
    c.beginPath();c.arc(rlX,BY-70,4,0,7);c.strokeStyle='#8FB3AC';c.lineWidth=2;c.stroke();
    line(c,rlX,BY-62,rlX,BY,'#EAF4F1',2.5);
    c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='center';c.fillText('RL abierta',rlX,(WY+BY)/2+5);
  }
  line(c,srcX,BY,rlX,BY,'#EAF4F1',2.5);
  groundGlyph(c,srcX,BY);
  c.beginPath();c.arc(srcX,srcY,32,0,7);c.strokeStyle='#4FD1C5';c.lineWidth=2.5;c.stroke();
  c.fillStyle='#4FD1C5';c.font='bold 18px system-ui';c.textAlign='center';
  c.fillText('+',srcX,srcY-4);c.fillText('−',srcX,srcY+20);
  c.font='11px monospace';c.fillStyle='#8FB3AC';c.fillText('Vin = '+Vin.toFixed(1)+' V',srcX,srcY+48);
  c.font='11px monospace';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText(DEVS[zsel].name,zX+22,(WY+BY)/2+4);
}
function drawGraph(c){
  const z=curZ(),vMaxG=RES.vMaxG,iMaxG=RES.iMaxG;
  rr(c,PX0-4,PY0-4,(PX1-PX0)+8,(PY1-PY0)+8,6,'#0c1a16','#1E3A34',2);
  const xt=vMaxG<=4?0.5:vMaxG<=8?1:2;
  c.font='10px monospace';
  for(let v=0;v<=vMaxG+1e-6;v+=xt){
    const x=xPix(v);
    line(c,x,PY0,x,PY1,'#12241f',1);
    c.fillStyle='#8FB3AC';c.textAlign='center';c.fillText(v.toFixed(1),x,PY1+16);
  }
  if(logY){
    const labels=['0.1 mA','1 mA','10 mA','100 mA','1 A'];
    for(let k=0;k<5;k++){
      const y=PY1-(k/4)*(PY1-PY0);
      line(c,PX0,y,PX1,y,'#12241f',1);
      c.fillStyle='#8FB3AC';c.textAlign='right';c.fillText(labels[k],PX0-8,y+4);
    }
  }else{
    const yt=iMaxG<=0.1?0.02:iMaxG<=0.4?0.05:0.1;
    for(let i=0;i<=iMaxG+1e-6;i+=yt){
      const y=gyPix(i);
      line(c,PX0,y,PX1,y,'#12241f',1);
      c.fillStyle='#8FB3AC';c.textAlign='right';c.fillText((i*1000).toFixed(0)+' mA',PX0-8,y+4);
    }
  }
  line(c,PX0,PY1,PX1,PY1,'#EAF4F1',2);
  line(c,PX0,PY0,PX0,PY1,'#EAF4F1',2);
  c.fillStyle='#EAF4F1';c.font='12px monospace';c.textAlign='center';
  c.fillText('Vz (V)',(PX0+PX1)/2,PY1+34);
  c.save();c.translate(PX0-46,(PY0+PY1)/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText('Iz',0,0);c.restore();
  c.beginPath();
  let started=false;
  for(let px=0;px<=200;px++){
    const v=vMaxG*px/200,iz=izOfV(z,v);
    const x=xPix(v),y=gyPix(Math.max(iz,1e-9));
    if(!started){c.moveTo(x,y);started=true;}else c.lineTo(x,y);
  }
  c.strokeStyle='#4FD1C5';c.lineWidth=2.5;c.stroke();
  if(!logY&&!(mode==='predice'&&!predRevealed)){
    const rs=curRs(),rl=curRl();
    const iAt0=Vin/rs;
    const p1v=isFinite(rl)?Vin*rl/(rl+rs):vMaxG;
    const p1i=(Vin-p1v)/rs-(isFinite(rl)?p1v/rl:0);
    const p0x=xPix(0),p0y=gyPix(Math.max(Math.min(iAt0,iMaxG),0));
    const p1x=xPix(Math.min(p1v,vMaxG)),p1y=gyPix(Math.max(Math.min(p1i,iMaxG),0));
    line(c,p0x,p0y,p1x,p1y,'#E8871E',2,[6,4]);
  }
  if(RES&&!logY&&!(mode==='predice'&&!predRevealed)){
    const qx=xPix(RES.v),qy=gyPix(Math.max(RES.iz,1e-9));
    c.beginPath();c.arc(qx,qy,6,0,7);c.fillStyle='#FFB703';c.fill();c.strokeStyle='#fff';c.lineWidth=1.5;c.stroke();
    c.fillStyle='#FFB703';c.font='bold 12px monospace';c.textAlign='left';
    c.fillText('Q ('+RES.v.toFixed(2)+'V, '+(RES.iz*1000).toFixed(1)+'mA)',qx+10,qy-10);
  }
  rr(c,846,318,88,30,8,'#11201c',logY?'#4FD1C5':'#8FB3AC',2);
  c.font='bold 15px system-ui';c.textAlign='center';
  c.fillStyle=logY?'#4FD1C5':'#8FB3AC';c.fillText(logY?'㏒ SEMILOG':'— LINEAL',890,338);
}
function drawBoard(){
  const c=bCx;
  c.clearRect(0,0,1024,768);
  c.fillStyle='#0a1512';c.fillRect(0,0,1024,768);
  drawSchematic(c);
  drawGraph(c);
  bTex.needsUpdate=true;
}
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  if(RES&&!logY&&!(mode==='predice'&&!predRevealed)){
    const qx=xPix(RES.v),qy=gyPix(Math.max(RES.iz,1e-9));
    if(Math.hypot(x-qx,y-qy)<40){
      showToast('Punto Q: Vout = '+fmtV(RES.v)+' · Iz = '+fmtI(RES.iz)+' · zona: '+RES.zone);
      return;
    }
  }
  let best=null,bd=1e9;
  for(let k=0;k<HIT.length;k++){
    const h=HIT[k],d=Math.hypot(x-h.x,y-h.y);
    if(d<h.r&&d<bd){bd=d;best=h;}
  }
  if(!best)return;
  synth.beep(720,.05,.05);
  if(best.act==='log'){toggleLog();return;}
  if(best.act==='src')showToast('Fuente Vin = '+Vin.toFixed(1)+' V (ideal, sin resistencia interna).');
  if(best.act==='rs')showToast('Rs = '+fmtR(curRs())+' — limita la corriente hacia el zener y disipa el excedente Vin−Vout.');
  if(best.act==='zen')showToast(DEVS[zsel].name+' · VZ nominal '+DEVS[zsel].vz.toFixed(1)+' V — mantiene Vout casi constante en avalancha.');
  if(best.act==='rl')showToast('RL = '+fmtR(curRl())+' — la carga alimentada; toma parte de la corriente que entrega Rs.');
}
function toggleLog(){
  logY=!logY;refreshAll();
  showToast(logY?'SEMILOG: se ven las 4 décadas de corriente (0.1 mA a 1 A) — útil para comparar IZK e IZM.':'LINEAL: se ve la recta de carga y el punto Q con claridad.');
}

/* ---------- 6) Banco 3D ---------- */
const boardG=new THREE.Group();
const board=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.95),new THREE.MeshStandardMaterial({map:bTex,roughness:0.55,metalness:0.05}));
board.userData.title='Esquemático + gráfica V-I del regulador zener';
const boardFrame=new THREE.Mesh(new THREE.BoxGeometry(2.68,2.03,0.05),MAT.frame);
boardFrame.position.z=-0.03;
boardG.add(boardFrame,board);
boardG.position.set(-1.05,1.75,-0.85);boardG.rotation.y=0.16;
S.scene.add(boardG);

const benchG=new THREE.Group();
const mesa=new THREE.Mesh(new THREE.BoxGeometry(3.6,0.12,2.2),MAT.bench);
mesa.position.set(0.6,-0.06,0.9);benchG.add(mesa);
const pcb=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.03,1.5),MAT.pcb);
pcb.position.set(0.6,0.02,0.9);benchG.add(pcb);

function makeDisplayBox(w,h,dp,cw,ch){
  const g=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,dp),MAT.scope);
  g.add(body);
  const cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
  const cx=cv.getContext('2d');
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(w*0.86,h*0.78),new THREE.MeshStandardMaterial({map:tex,emissive:0x0a1512,emissiveMap:tex,emissiveIntensity:0.6,roughness:0.4}));
  screen.position.z=dp/2+0.001;g.add(screen);
  return {g:g,cv:cv,cx:cx,tex:tex,screen:screen};
}
const fuenteBox=makeDisplayBox(0.62,0.42,0.14,256,180);
fuenteBox.g.position.set(-0.15,0.42,0.55);
fuenteBox.g.userData.act='src3d';fuenteBox.g.userData.title='Fuente Vin';
benchG.add(fuenteBox.g);
const medidorBox=makeDisplayBox(0.62,0.42,0.14,256,180);
medidorBox.g.position.set(0.55,0.42,0.55);
medidorBox.g.userData.title='Medidor Vout / Iz';
benchG.add(medidorBox.g);

function leads(g){
  const l1=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.16,10),MAT.lead);
  l1.rotation.z=Math.PI/2;l1.position.x=-0.16;g.add(l1);
  const l2=l1.clone();l2.position.x=0.16;g.add(l2);
}

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
/* LOS COMPONENTES, con la forma que tienen en la mano. Lo que convierte un taco
   en un componente son las PATAS —por donde entra la corriente y por donde se
   suelda— y las MARCAS: las bandas de la resistencia, la banda del catodo, la
   cara plana del TO-92, la aleta del TO-220. Cada marca evita una averia
   distinta, y ninguna estaba dibujada. */
function makeResistor3D(){
  const g=P3.resistencia(MATP,{largo:0.24,d:0.095,patas:0.10,paso:0.36,
    bandas:[0x333333,0x333333,0x333333],cuerpo:MAT.resistor.color.getHex()});
  g.userData.bands=g.userData.bandas;
  g.userData.body=g.userData.cuerpo;
  return g;
}
function paintBands(g,r){
  const b=bandsFor(r);
  const cols=[BAND_COLORS[b.d1],BAND_COLORS[b.d2],BAND_COLORS[b.mult]];
  g.userData.bands.forEach(function(band,i){band.material=std({color:parseInt(cols[i].slice(1),16)});});
}
function makeZener3D(){
  const g=P3.diodoAxial(MATP,{largo:0.17,d:0.075,patas:0.10,paso:0.36,
    cuerpo:MAT.zenerBody.color.getHex(),banda:MAT.zenerBand.color.getHex(),catodo:1});
  g.userData.bodyMesh=g.userData.cuerpo;
  return g;
}
// Todos apoyan en la CARA de la placa: la biblioteca dibuja cada componente
// con y = 0 en la placa y las patas por debajo. Antes flotaban dos decimas
// por encima, que con patas horizontales no se notaba y con patas si.
const Y_PCB=0.035;
const rsG=makeResistor3D();
rsG.position.set(-0.15,Y_PCB,1.15);
rsG.userData.act='rs3d';rsG.userData.title='Resistor serie Rs';
benchG.add(rsG);
const zenG=makeZener3D();
zenG.position.set(0.15,Y_PCB,1.15);zenG.rotation.y=Math.PI/2;
zenG.userData.act='zen3d';zenG.userData.title='Diodo zener';
benchG.add(zenG);
const rlG=makeResistor3D();
rlG.position.set(0.45,Y_PCB,1.15);
rlG.userData.act='rl3d';rlG.userData.title='Resistor de carga RL';
benchG.add(rlG);

benchG.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
board.castShadow=false;boardFrame.receiveShadow=true;
S.scene.add(benchG);

function refreshBenchSel(){
  paintBands(rsG,curRs());
  rlG.visible=isFinite(curRl());
  if(rlG.visible)paintBands(rlG,curRl());
}
function drawFuenteScreen(){
  const cx=fuenteBox.cx,cv=fuenteBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#08120f';cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='#4FD1C5';cx.font='bold 30px monospace';cx.textAlign='center';
  cx.fillText('Vin',cv.width/2,54);
  cx.font='bold 42px monospace';
  cx.fillText(Vin.toFixed(1)+' V',cv.width/2,118);
  fuenteBox.tex.needsUpdate=true;
}
function drawMedidorScreen(){
  const cx=medidorBox.cx,cv=medidorBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#08120f';cx.fillRect(0,0,cv.width,cv.height);
  const hide=(mode==='predice'&&!predRevealed);
  cx.fillStyle='#FFB703';cx.font='bold 18px monospace';cx.textAlign='center';
  cx.fillText('Vout / Iz',cv.width/2,32);
  cx.font='bold 28px monospace';
  if(hide){
    cx.fillText('¿?  /  ¿?',cv.width/2,110);
  }else if(RES){
    cx.fillText(RES.v.toFixed(2)+' V',cv.width/2,88);
    cx.fillText(fmtI(RES.iz),cv.width/2,136);
  }
  medidorBox.tex.needsUpdate=true;
}
function refreshBenchDyn(){drawFuenteScreen();drawMedidorScreen();}

/* ---------- 7) HUD + panel ---------- */
const devBtnsHtml=Object.keys(DEVS).map(function(k){
  const d=DEVS[k];
  return '<button class="b'+(k===zsel?' on':'')+'" style="flex:1 0 100%" id="z_'+k+'">'+d.name+' · '+d.vz.toFixed(1)+' V · '+(d.ptot*1000).toFixed(0)+' mW</button>';
}).join('');
const rsBtnsHtml=RSVALS.map(function(v,i){
  return '<button class="b'+(i===Rsidx?' on':'')+'" style="flex:1 0 18%" id="rs_'+i+'">'+v+' Ω</button>';
}).join('');
const rlBtnsHtml=RLVALS.map(function(v,i){
  const lbl=isFinite(v)?((v>=1000?(v/1000)+'k':v)+' Ω'):'∞';
  return '<button class="b'+(i===RLidx?' on':'')+'" style="flex:1 0 15%" id="rl_'+i+'">'+lbl+'</button>';
}).join('');

document.getElementById('hud').innerHTML=`
  <div class="eyebrow">D2 · Semiconductores — Práctica d2-03</div>
  <h2>Diodo Zener: Regulador Shunt de Voltaje</h2>
  <p>Un diodo zener polarizado en <b>inversa</b>, al alcanzar su voltaje de avalancha VZ, mantiene un voltaje casi constante en sus terminales aunque la corriente que lo atraviesa cambie mucho. Conectado en <b>paralelo</b> (shunt) con la carga RL y alimentado a través de un resistor serie Rs que limita la corriente, forma el regulador de voltaje más simple: Rs absorbe el excedente de voltaje (Vin − Vout) y el zener desvía la corriente sobrante para mantener Vout regulado.</p>
  <div class="formula">
    Vout = VZK + (Iz − IZK)·ZZT&nbsp; (en avalancha)<br>
    Iz = (Vin − Vout)/Rs − Vout/RL
  </div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Fuente Vin</div>
    <div class="li"><span class="dot" style="background:#EAF4F1"></span>Resistor Rs (serie)</div>
    <div class="li"><span class="dot" style="background:#2e6fe0"></span>Diodo zener (shunt)</div>
    <div class="li"><span class="dot" style="background:#e8d9b0"></span>Carga RL</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Punto de operación Q</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> Modelo zener lineal por tramos (corte / codo / avalancha) con VZK, V0, IZK e IZM derivados de parámetros reales de hoja de datos (VZ, IZT, ZZT, IZK, ZZK, IZM, PD). Solución de circuito por bisección exacta.<br>
  <span class="no">NO:</span> Coeficiente de temperatura αVZ (sin valor único confiable en las hojas de datos consultadas — solo nota cualitativa). Corriente de fuga sub-codo (idealizada en 0). Capacitancia de unión ni respuesta transitoria/AC.</div>
  <div class="src">Ref: hojas de datos ON Semiconductor 1N4728A–1N4764A (1 W) y Vishay 1N5221B–1N5281B (500 mW).</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Regulador Zener · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_predice">🔮 Predice</button>
    <button class="b" id="m_barrido">📉 Barrido</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>

  <div style="font-size:12px;color:#8FB3AC;margin:6px 0 4px">Diodo zener</div>
  <div class="btns">${devBtnsHtml}</div>

  <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">Resistor serie Rs</div>
  <div class="btns">${rsBtnsHtml}</div>

  <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">Carga RL</div>
  <div class="btns">${rlBtnsHtml}</div>

  <div style="margin-top:10px">
    <label style="font-size:12px;color:#8FB3AC">Vin: <span id="vVin">9.0 V</span></label><br>
    <input type="range" id="sVin" min="5" max="15" step="0.1" value="9" style="width:100%">
  </div>
  <div style="margin-top:6px">
    <label style="font-size:12px;color:#8FB3AC">T ambiente: <span id="vTC">25 °C</span> (nota cualitativa, no numérica)</label><br>
    <input type="range" id="sTC" min="0" max="70" step="1" value="25" style="width:100%">
  </div>

  <div class="btns" style="margin-top:8px">
    <button class="b" id="btnLog">㏒ LIN ⇄ SEMILOG</button>
    <button class="b auto" id="btnAuto">🚀 Tour guiado</button>
  </div>

  <div class="tele" style="margin-top:10px">
    <div class="g"><div class="l">Vout</div><div id="tVout">—</div></div>
    <div class="g"><div class="l">Iz</div><div id="tIz">—</div></div>
    <div class="g"><div class="l">Ir (Rs)</div><div id="tIr">—</div></div>
    <div class="g"><div class="l">Il (RL)</div><div id="tIl">—</div></div>
    <div class="g"><div class="l">Pz</div><div id="tPz">—</div></div>
    <div class="g"><div class="l">Zona</div><div id="tZone">—</div></div>
  </div>

  <div id="predBox" style="display:none;margin-top:10px">
    <div style="font-size:12px;color:#8FB3AC">Predicción</div>
    <label style="font-size:11px">Vout (V) <input type="number" id="predV" step="0.01" style="background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px;width:70px"></label>
    <label style="font-size:11px">Iz (mA) <input type="number" id="predI" step="0.1" style="background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px;width:70px"></label>
    <div class="btns" style="margin-top:6px">
      <button class="b primary" id="btnPred">Verificar</button>
      <button class="b sec" id="btnPredNew">Nuevo caso</button>
    </div>
    <div id="predResult" style="margin-top:6px;font-size:12px"></div>
  </div>

  <div id="barBox" style="display:none;margin-top:10px">
    <div class="btns"><button class="b primary" id="btnSweep">▶ Barrer Vin</button></div>
    <div id="sweepResult" style="margin-top:6px;font-size:12px"></div>
  </div>

  <div id="retoBox" style="display:none;margin-top:10px">
    <div class="btns">
      <button class="b primary" id="btnReto">Verificar diseño</button>
      <button class="b sec" id="btnRetoNew">Nuevo reto</button>
    </div>
    <div id="retoResult" style="margin-top:6px;font-size:12px"></div>
  </div>

  <div class="console" id="report" style="margin-top:10px"></div>

  <div style="margin-top:10px">
    <div id="q_text" class="mono" style="font-size:12px;margin-bottom:6px"></div>
    <div id="dxbtns" class="btns"></div>
  </div>`;
const el=function(id){return document.getElementById(id);};

/* ---------- 8) Toast + modos ---------- */
let toastT=null;
function showToast(msg){
  const t=el('toast');t.textContent=msg;t.classList.add('show');
  clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('show');},4200);
}
const MODES=['explora','predice','barrido','reto'];
const MODE_META={
  explora:{cam:[[3.1,2.5,7.2],[0.5,1.3,0.1]]},
  predice:{cam:[[-0.1,2.2,4.3],[-0.9,1.75,-0.8]]},
  barrido:{cam:[[-0.2,2.1,3.9],[-0.9,1.75,-0.8]]},
  reto:{cam:[[0.6,2.3,5.6],[0.2,1.3,0.2]]},
};
const MISIONES={
  explora:'Explora libremente cómo Rs, RL y Vin afectan la regulación del zener.',
  predice:'Predice Vout e Iz antes de revelar el medidor.',
  barrido:'Mide la regulación de línea barriendo Vin y compara con la fórmula teórica.',
  reto:'Diseña Rs para que el regulador funcione en todo el rango de Vin especificado.',
};
function setMode(k){
  mode=k;solved=false;
  MODES.forEach(function(m){el('m_'+m).classList.toggle('on',m===k);});
  el('p_mode').textContent=k==='explora'?'Explora':k==='predice'?'Predicción':k==='barrido'?'Barrido':'Reto';
  el('p_mision').textContent=MISIONES[k];
  el('predBox').style.display=k==='predice'?'block':'none';
  el('barBox').style.display=k==='barrido'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  const lockAll=(k==='predice');
  const inputs=document.querySelectorAll('#panel input[type=range]');
  for(let i=0;i<inputs.length;i++)inputs[i].disabled=lockAll;
  if(k==='predice')genPredice();
  if(k==='reto'){if(!RETO)newReto();zsel=RETO.zk;RLidx=RLVALS.indexOf(RETO.rl);}
  syncCtrlBtns();clearDx();refreshQuestion();refreshBenchSel();refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}
function syncCtrlBtns(){
  Object.keys(DEVS).forEach(function(k){el('z_'+k).classList.toggle('on',k===zsel);});
  RSVALS.forEach(function(v,i){el('rs_'+i).classList.toggle('on',i===Rsidx);});
  RLVALS.forEach(function(v,i){el('rl_'+i).classList.toggle('on',i===RLidx);});
  const retoLock=(mode==='reto');
  Object.keys(DEVS).forEach(function(k){el('z_'+k).disabled=retoLock;});
}
function selDevice(k){
  if(mode==='predice'){showToast('En modo Predicción el diodo se elige aleatoriamente. Cambia a Explora para elegirlo tú.');return;}
  if(mode==='reto'){showToast('En el Reto el diodo zener objetivo está fijo — ajusta Rs, RL y Vin para cumplir la especificación.');return;}
  zsel=k;onChange();
}
function selRs(i){
  if(mode==='predice'){showToast('En modo Predicción Rs se elige aleatoriamente.');return;}
  Rsidx=i;onChange();
}
function selRl(i){
  if(mode==='predice'){showToast('En modo Predicción RL se elige aleatoriamente.');return;}
  RLidx=i;onChange();
}
function onChange(){syncCtrlBtns();buildQuiz();clearDx();refreshQuestion();refreshBenchSel();refreshAll();}

/* ---------- 9) Telemetría + reporte ---------- */
function set(id,txt,cls){const n=el(id);n.textContent=txt;n.classList.remove('good','warn','bad');if(cls)n.classList.add(cls);}
function updateTele(){
  const hide=(mode==='predice'&&!predRevealed);
  if(hide||!RES){
    set('tVout','¿?','warn');set('tIz','¿?','warn');set('tIr','¿?','warn');set('tIl','¿?','warn');set('tPz','¿?','warn');set('tZone','¿?','warn');
    return;
  }
  const z=curZ();
  set('tVout',fmtV(RES.v));
  const izCls=(RES.iz<z.izk||RES.iz>z.izm)?'bad':(RES.iz>0.9*z.izm?'warn':'good');
  set('tIz',fmtI(RES.iz),izCls);
  set('tIr',fmtI(RES.ir));
  set('tIl',fmtI(RES.il));
  const pzCls=RES.pz>z.ptot?'bad':(RES.pz>0.8*z.ptot?'warn':'good');
  set('tPz',fmtP(RES.pz),pzCls);
  const zoneTxt={cutoff:'Corte (no regula)',knee:'Codo (transición)',valid:'Regulación válida',over:'¡Sobrecorriente!'}[RES.zone];
  const zoneCls=RES.zone==='valid'?'good':(RES.zone==='over'?'bad':'warn');
  set('tZone',zoneTxt,zoneCls);
}
function updateReport(){
  const z=curZ();
  let L=[];
  if(mode==='explora'){
    L.push('Diodo: '+z.name+' ('+z.fam+') — VZ nominal '+z.vz.toFixed(1)+' V');
    L.push('Vout = '+fmtV(RES.v)+' · Iz = '+fmtI(RES.iz)+' · Pz = '+fmtP(RES.pz));
    L.push('Zona: '+RES.zone);
    if(RES.zone==='cutoff')L.push('El zener no conduce todavía — Vin es insuficiente para alcanzar V0 = '+fmtV(RES.v0)+'.');
    if(RES.zone==='over')L.push('¡Cuidado! Iz excede IZM = '+fmtI(z.izm)+' — en un circuito real el diodo se dañaría.');
  }else if(mode==='predice'){
    if(!predRevealed)L.push('Predice Vout e Iz para Vin = '+PRED.vin.toFixed(1)+' V, Rs = '+fmtR(RSVALS[PRED.rsIdx])+', RL = '+fmtR(RLVALS[PRED.rlIdx])+', diodo '+DEVS[PRED.zk].name+'.');
    else L.push(predSolved?'¡Correcto! Revisa el detalle abajo.':'Revisa tu cálculo — detalle abajo.');
  }else if(mode==='barrido'){
    L.push(sweeping?'Barriendo Vin…':'Pulsa "Barrer Vin" para medir la regulación de línea.');
    if(SWEEPV.length>1)L.push(SWEEPV.length+' puntos medidos entre '+SWEEPV[0].vin.toFixed(1)+' V y '+SWEEPV[SWEEPV.length-1].vin.toFixed(1)+' V.');
  }else if(mode==='reto'){
    L.push('Diseña con '+RETO.z.name+', RL = '+fmtR(RETO.rl)+': Rs debe regular entre Vin = '+RETO.vinMin+' V (con carga) y Vin = '+RETO.vinMax+' V (sin carga).');
    L.push(retoSolved?'¡Diseño válido!':'Ajusta Rs y pulsa "Verificar diseño".');
  }
  el('report').innerHTML=L.map(function(x){return '<div>• '+x+'</div>';}).join('');
}
function refreshAll(){
  const z=curZ();
  const r=solveShunt(z,Vin,curRs(),curRl());
  const V0v=v0(z),VZKv=vzk(z);
  const zone=r.v<=V0v?'cutoff':(r.v<=VZKv?'knee':((r.v*r.iz)>z.ptot?'over':'valid'));
  const vm=vAtIzm(z);
  RES={v:r.v,iz:r.iz,ir:r.ir,il:r.il,zone:zone,pz:r.v*r.iz,vzk:VZKv,v0:V0v,vAtIzm:vm,vMaxG:vm*1.15,iMaxG:z.izm*1.2};
  drawBoard();
  updateTele();
  updateReport();
  refreshBenchDyn();
}

/* ---------- 10) Barrido (regulación de línea) ---------- */
async function runSweepV(){
  if(sweeping)return;
  sweeping=true;
  const b=el('btnSweep');b.disabled=true;b.textContent='Barriendo…';
  const lock={zk:zsel,rs:curRs(),rl:curRl()};
  SWEEPV.length=0;
  const v0v=Math.max(2,Vin-4),v1v=Vin+4;
  const N=17;
  for(let i=0;i<N;i++){
    if(zsel!==lock.zk||curRs()!==lock.rs||curRl()!==lock.rl)break;
    const vin=v0v+(v1v-v0v)*i/(N-1);
    const r=solveShunt(DEVS[lock.zk],vin,lock.rs,lock.rl);
    SWEEPV.push({vin:vin,v:r.v,iz:r.iz});
    Vin=vin;el('sVin').value=vin.toFixed(1);el('vVin').textContent=vin.toFixed(1)+' V';
    refreshAll();
    await sleep(140);
  }
  let n=SWEEPV.length,sx=0,sy=0,sxy=0,sxx=0;
  SWEEPV.forEach(function(p){sx+=p.vin;sy+=p.v;sxy+=p.vin*p.v;sxx+=p.vin*p.vin;});
  const slope=n>1?(n*sxy-sx*sy)/(n*sxx-sx*sx):0;
  const z=DEVS[lock.zk];
  const rp=1/(1/z.zzt+(isFinite(lock.rl)?1/lock.rl:0));
  const theo=rp/(rp+lock.rs);
  el('sweepResult').innerHTML='<div>Pendiente medida dVout/dVin ≈ '+slope.toFixed(4)+'</div><div>Teórica Rp/(Rp+Rs) ≈ '+theo.toFixed(4)+' (Rp = ZZT ∥ RL en avalancha)</div>';
  sweeping=false;b.disabled=false;b.textContent='▶ Barrer Vin';
  showToast('Barrido completo: el regulador mantiene Vout casi constante mientras Vin varía — esa es la regulación de línea.');
  refreshAll();
}

/* ---------- 11) Predicción ---------- */
function genPredice(){
  const keys=Object.keys(DEVS);
  const zk=keys[Math.floor(Math.random()*keys.length)];
  const rsIdx=Math.floor(Math.random()*RSVALS.length);
  const rlIdx=Math.floor(Math.random()*(RLVALS.length-1));
  const vin=Math.round((6+Math.random()*7)*10)/10;
  const z=DEVS[zk];
  const rl=RLVALS[rlIdx];
  const r=solveShunt(z,vin,RSVALS[rsIdx],rl);
  PRED={zk:zk,rsIdx:rsIdx,rlIdx:rlIdx,vin:vin,target:{v:r.v,iz:r.iz}};
  predSolved=false;predRevealed=false;
  zsel=zk;Rsidx=rsIdx;RLidx=rlIdx;Vin=vin;
  el('sVin').value=vin;el('vVin').textContent=vin.toFixed(1)+' V';
  el('predV').value='';el('predI').value='';
  el('predResult').innerHTML='';
  syncCtrlBtns();
}
function checkPredice(){
  const vIn=parseFloat(el('predV').value);
  const iIn=parseFloat(el('predI').value)/1000;
  const okV=Number.isFinite(vIn)&&Math.abs(vIn-PRED.target.v)<=0.08*PRED.target.v+0.05;
  const okI=Number.isFinite(iIn)&&Math.abs(iIn-PRED.target.iz)<=0.15*PRED.target.iz+0.002;
  const chip=function(ok){return ok?'✔':'✘';};
  el('predResult').innerHTML=
    '<div>'+chip(okV)+' Vout: tu valor '+(Number.isFinite(vIn)?vIn.toFixed(2):'—')+' V · real '+PRED.target.v.toFixed(2)+' V</div>'+
    '<div>'+chip(okI)+' Iz: tu valor '+(Number.isFinite(iIn)?(iIn*1000).toFixed(1):'—')+' mA · real '+(PRED.target.iz*1000).toFixed(1)+' mA</div>';
  predSolved=okV&&okI;predRevealed=true;solved=predSolved;
  synth.beep(predSolved?880:220,.08,.06);
  refreshAll();
}

/* ---------- 12) Reto de diseño ---------- */
function cornerOK(z,rs,rl,vin){
  const r=solveShunt(z,vin,rs,rl);
  return r.iz>=z.izk*1.05&&r.iz<=z.izm*0.98;
}
function rsValidFor(z,rs,vinMin,vinMax,rl){
  return cornerOK(z,rs,rl,vinMin)&&cornerOK(z,rs,Infinity,vinMax);
}
function newReto(){
  const keys=Object.keys(DEVS);
  let tries=0,ok=false,zk,z,rl,vinMin,vinMax;
  while(!ok&&tries<40){
    tries++;
    zk=keys[Math.floor(Math.random()*keys.length)];
    z=DEVS[zk];
    rl=RLVALS[1+Math.floor(Math.random()*(RLVALS.length-2))];
    const vz=vzk(z);
    vinMin=Math.round((vz+1.2+Math.random()*1.5)*10)/10;
    vinMax=Math.round((vinMin+2.5+Math.random()*3.5)*10)/10;
    const validRs=RSVALS.filter(function(rs){return rsValidFor(z,rs,vinMin,vinMax,rl);});
    if(validRs.length>0)ok=true;
  }
  if(!ok){zk='z4728';z=DEVS[zk];rl=470;vinMin=6;vinMax=12;}
  RETO={zk:zk,z:z,rl:rl,vinMin:vinMin,vinMax:vinMax};
  retoSolved=false;
  el('retoResult').innerHTML='';
}
function checkReto(){
  const z=RETO.z,rs=curRs();
  const c1=solveShunt(z,RETO.vinMin,rs,RETO.rl);
  const c2=solveShunt(z,RETO.vinMax,rs,Infinity);
  const ok1=c1.iz>=z.izk;
  const ok2=c2.iz<=z.izm;
  const okZsel=(zsel===RETO.zk);
  const chip=function(ok){return ok?'✔':'✘';};
  el('retoResult').innerHTML=
    '<div>'+chip(okZsel)+' Diodo correcto: '+DEVS[RETO.zk].name+'</div>'+
    '<div>'+chip(ok1)+' Regulación a Vin mín ('+RETO.vinMin+' V, con carga): Iz = '+fmtI(c1.iz)+' ≥ IZK = '+fmtI(z.izk)+'</div>'+
    '<div>'+chip(ok2)+' Seguridad a Vin máx ('+RETO.vinMax+' V, sin carga): Iz = '+fmtI(c2.iz)+' ≤ IZM = '+fmtI(z.izm)+'</div>';
  retoSolved=okZsel&&ok1&&ok2;solved=retoSolved;
  synth.beep(retoSolved?880:220,.08,.06);
  refreshAll();
}

/* ---------- 13) Quiz ---------- */
let QUIZ={};
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Por qué el zener se conecta en polarización inversa en un regulador shunt?',
      opciones:[
        {t:'Porque en inversa opera en avalancha controlada, manteniendo un voltaje casi constante',ok:true,why:'Exacto: la región de avalancha es la que da la meseta plana de voltaje que hace útil al zener como regulador.'},
        {t:'Porque así disipa menos potencia que en directa',ok:false,why:'No — de hecho en avalancha el zener puede disipar bastante potencia; se conecta así porque esa región regula voltaje, no por eficiencia.'},
        {t:'Porque en directa el zener no conduce corriente',ok:false,why:'Falso — en directa un zener conduce igual que cualquier diodo normal (≈0.7 V), pero esa región no regula nada útil.'}
      ]
    },
    predice:{
      pregunta:'Si RL disminuye (más carga) y Rs, Vin y el zener no cambian, ¿qué le pasa a Vout mientras el zener siga en avalancha?',
      opciones:[
        {t:'Se mantiene casi constante — el zener absorbe la corriente que ya no toma RL',ok:true,why:'Correcto: esa es la esencia de la regulación shunt — el zener compensa cambios de carga mientras Iz no caiga bajo IZK.'},
        {t:'Baja proporcionalmente a RL',ok:false,why:'No — eso pasaría sin zener (divisor resistivo simple). Con el zener en avalancha, Vout queda "clavado" cerca de VZK.'},
        {t:'Sube porque hay menos corriente circulando',ok:false,why:'No — Vout no sube; el zener mantiene el voltaje casi fijo mientras siga regulando.'}
      ]
    },
    barrido:{
      pregunta:'¿Qué mide la "regulación de línea" dVout/dVin?',
      opciones:[
        {t:'Cuánto cambia Vout cuando cambia Vin, con Rs y RL fijos',ok:true,why:'Correcto: es la sensibilidad de Vout ante variaciones de la fuente — idealmente cercana a 0 en un buen regulador.'},
        {t:'Cuánto cambia Vout cuando cambia RL',ok:false,why:'Eso es la regulación de carga (load regulation), no la de línea.'},
        {t:'La eficiencia energética del regulador',ok:false,why:'No — la regulación de línea no mide eficiencia, mide estabilidad de Vout ante Vin.'}
      ]
    },
    reto:{
      pregunta:'¿Por qué el Reto verifica dos "esquinas" (Vin mín con carga, y Vin máx sin carga) y no solo un punto?',
      opciones:[
        {t:'Porque son los casos extremos: mínima corriente disponible para el zener y máxima corriente que debe soportar',ok:true,why:'Correcto: Vin mín + carga conectada minimiza Iz (riesgo de perder regulación); Vin máx + sin carga maximiza Iz (riesgo de exceder IZM).'},
        {t:'Porque el zener cambia de VZ según el punto de operación',ok:false,why:'No — VZ nominal no cambia con el punto de operación en este modelo; lo que cambia es Iz.'},
        {t:'Por convención arbitraria de diseño',ok:false,why:'No es arbitrario — son los dos escenarios físicos donde el diseño puede fallar.'}
      ]
    }
  };
}
function clearDx(){el('dxbtns').innerHTML='';}
function refreshQuestion(){
  const q=QUIZ[mode];
  if(!q)return;
  el('q_text').textContent=q.pregunta;
  const opciones=q.opciones.slice();
  for(let i=opciones.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    const tmp=opciones[i];opciones[i]=opciones[j];opciones[j]=tmp;
  }
  el('dxbtns').innerHTML=opciones.map(function(o,i){return '<button class="b" data-i="'+i+'">'+o.t+'</button>';}).join('');
  const btns=el('dxbtns').querySelectorAll('button');
  btns.forEach(function(b,i){
    b.onclick=function(){
      if(b.classList.contains('right')||b.classList.contains('wrong'))return;
      const o=opciones[i];
      b.classList.add(o.ok?'right':'wrong');
      showToast(o.why);
      synth.beep(o.ok?880:220,.08,.06);
    };
  });
}

/* ---------- 14) Picking, hover, tour, eventos, init ---------- */
pickerFor(S.scene,S.camera,S.renderer.domElement,function(hit){
  if(hit.object===board){boardClick(hit.uv.x,hit.uv.y);return;}
  let o=hit.object;
  while(o){
    if(o.userData&&o.userData.act){dispatch3D(o.userData.act);return;}
    o=o.parent;
  }
});
function dispatch3D(act){
  synth.beep(720,.05,.05);
  if(act==='src3d')showToast('Fuente Vin = '+Vin.toFixed(1)+' V (ideal, sin resistencia interna).');
  else if(act==='rs3d')showToast('Rs = '+fmtR(curRs())+' — limita la corriente hacia el zener.');
  else if(act==='zen3d')showToast(DEVS[zsel].name+' · VZ nominal '+DEVS[zsel].vz.toFixed(1)+' V.');
  else if(act==='rl3d')showToast('RL = '+fmtR(curRl())+' — la carga alimentada.');
}
(function(){
  const dom=S.renderer.domElement;
  const ray=new THREE.Raycaster();
  dom.addEventListener('pointermove',function(e){
    const rect=dom.getBoundingClientRect();
    const mx=((e.clientX-rect.left)/rect.width)*2-1;
    const my=-((e.clientY-rect.top)/rect.height)*2+1;
    ray.setFromCamera({x:mx,y:my},S.camera);
    const hits=ray.intersectObjects(S.scene.children,true);
    let title='';
    for(let i=0;i<hits.length;i++){
      let o=hits[i].object;
      while(o){if(o.userData&&o.userData.title){title=o.userData.title;break;}o=o.parent;}
      if(title)break;
    }
    dom.style.cursor=title?'pointer':'default';
    dom.title=title;
  });
})();

let autoRunning=false;
async function runAuto(){
  if(autoRunning)return;
  autoRunning=true;
  const b=el('btnAuto');b.disabled=true;b.textContent='Tour…';
  try{
    setMode('explora');
    showToast('Bienvenido: un regulador zener shunt mantiene Vout casi constante pese a variaciones en Vin o RL.');
    await sleep(2600);
    selDevice('z4728');await sleep(1600);
    Vin=4;el('sVin').value=4;el('vVin').textContent='4.0 V';onChange();
    showToast('Con Vin bajo, el zener no llega a la avalancha: Vout sigue a Vin, sin regular.');
    await sleep(2600);
    Vin=9;el('sVin').value=9;el('vVin').textContent='9.0 V';onChange();
    showToast('Al subir Vin, el zener entra en avalancha y Vout se "clava" cerca de VZ.');
    await sleep(2600);
    if(!logY)toggleLog();
    showToast('En SEMILOG se ven las 4 décadas de corriente — IZK e IZM en la misma gráfica.');
    await sleep(2800);
    if(logY)toggleLog();
    setMode('barrido');
    showToast('Modo Barrido: mide cuánto varía Vout cuando Vin cambia — la regulación de línea.');
    await sleep(1800);
    await runSweepV();
    await sleep(1000);
    setMode('reto');
    showToast('Reto: elige Rs para que el regulador funcione en todo el rango de Vin especificado.');
  }finally{
    autoRunning=false;b.disabled=false;b.textContent='🚀 Tour guiado';
  }
}

Object.keys(DEVS).forEach(function(k){el('z_'+k).onclick=function(){selDevice(k);};});
RSVALS.forEach(function(v,i){el('rs_'+i).onclick=function(){selRs(i);};});
RLVALS.forEach(function(v,i){el('rl_'+i).onclick=function(){selRl(i);};});
el('sVin').addEventListener('input',function(){
  if(mode==='predice'){this.value=Vin;return;}
  Vin=parseFloat(this.value);el('vVin').textContent=Vin.toFixed(1)+' V';onChange();
});
el('sTC').addEventListener('input',function(){
  TC=parseFloat(this.value);el('vTC').textContent=TC+' °C';
  showToast('Nota: el coeficiente térmico αVZ no se modela numéricamente en este laboratorio (dato no confiable en las hojas de datos consultadas). Cualitativamente, en zeners de VZ < 5 V, VZ tiende a bajar levemente con la temperatura; en VZ > 5 V, a subir levemente.');
});
el('m_explora').onclick=function(){setMode('explora');};
el('m_predice').onclick=function(){setMode('predice');};
el('m_barrido').onclick=function(){setMode('barrido');};
el('m_reto').onclick=function(){setMode('reto');};
el('btnPred').onclick=checkPredice;
el('btnPredNew').onclick=function(){genPredice();refreshAll();};
el('btnSweep').onclick=runSweepV;
el('btnReto').onclick=checkReto;
el('btnRetoNew').onclick=function(){newReto();zsel=RETO.zk;RLidx=RLVALS.indexOf(RETO.rl);syncCtrlBtns();refreshAll();};
el('btnLog').onclick=toggleLog;
el('btnAuto').onclick=runAuto;

S.setAnimate(function(){});
newReto();
buildQuiz();
syncCtrlBtns();
refreshBenchSel();
S.start();
setMode('explora');

window.__labDebug={
  state:function(){return {zsel:zsel,Rsidx:Rsidx,RLidx:RLidx,Vin:Vin,TC:TC,mode:mode,logY:logY};},
  res:function(){return RES;},
  pred:function(){return PRED;},
  reto:function(){return RETO;},
  sweep:function(){return SWEEPV.slice();},
  vzk:vzk,v0:v0,vAtIzm:vAtIzm,izOfV:izOfV,solveShunt:solveShunt,
  setDevice:selDevice,setRs:selRs,setRl:selRl,
  setVin:function(v){if(mode==='predice')return;Vin=v;el('sVin').value=v;el('vVin').textContent=v.toFixed(1)+' V';onChange();},
  mode:function(){return mode;},setMode:setMode,
  checkPredice:checkPredice,newPredice:genPredice,
  checkReto:checkReto,newReto:newReto,
  sweepV:runSweepV,boardClick:boardClick,
};
