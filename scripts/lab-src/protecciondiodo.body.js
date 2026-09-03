/* ============================================================
   LAB — LED, SCHOTTKY Y TVS: SELECCIÓN DE DISPOSITIVO Y PROTECCIÓN
   (Dominio D2 · Electrónica analógica — molde S+P: esquemático IEC 60617
    con motor de cálculo + banco de instrumentos)
   Normatividad / referencia: hojas de datos comerciales —
   LED rojo 5 mm genérico (SparkFun COM-09590 / Adafruit #299, familia
   Kingbright), Vishay/ST 1N5817-1N5818-1N5819 (Schottky), rectificador de
   silicio 1N4007 (mismo Is/n que mecanica-15), zener 1N4733A (mismo DEVS
   que mecanica-16) y TVS Littelfuse/Vishay/Bourns SMAJ5.0A.
   Motor de cálculo — dos familias de circuito comparadas lado a lado:
     CONDUCCIÓN (LED / Schottky / Si): lazo serie Vs—Rs—DUT—GND resuelto
       con la ecuación de Shockley a temperatura fija (300.15 K):
         I = Is·[exp(V/(n·VT)) − 1]
       bisección sobre f(V) = (Vs−V)/Rs − I(V) = 0.
     PROTECCIÓN (Zener / TVS): lazo shunt Vs—Rs—NODO—DUT—GND, carga aguas
       abajo idealizada como alta impedancia (no consume corriente):
         Zener: modelo lineal por tramos igual al de mecanica-16
                (corte / codo / avalancha, anclado a VZ/IZT/ZZT/IZK/ZZK).
         TVS:   modelo lineal por 2 tramos anclado a VBR(mín) y VC(máx)@IPP
                del datasheet: I=0 bajo VBR; I=(V−VBR)/Rdyn sobre VBR.
       bisección sobre f(V) = (Vs−V)/Rs − I_clamp(V) = 0.
   NO modela (ver ficha técnica para el detalle completo):
     - Dependencia de temperatura (Eg/XTI): se asume T de unión constante
       en toda la práctica — el enfoque pedagógico es selección de
       dispositivo, no coeficientes térmicos (ya cubiertos en mecanica-14).
     - Salida óptica del LED en unidades fotométricas: el brillo 3D es
       cualitativo (más If → más brillo aparente), nunca una cifra en lm.
     - Curva de derateo de potencia pico de pulso del TVS vs. duración:
       solo se usa el punto de la forma de onda estándar 10/1000 µs.
     - Impedancia de carga aguas abajo del nodo protegido: se idealiza
       como infinita (no consume corriente) — una aproximación común para
       proteger una entrada digital de bajo consumo.
   ============================================================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.1,2.5,7.2],target:[0.5,1.3,0.1],bgTop:'#0d1a17',bgBot:'#04060a',bloom:0.35,minD:3.0,maxD:18});
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2600,Q:0.8});

/* ---------- 1) Modelo físico ---------- */
const KB=1.380649e-23, QE=1.602176634e-19, TNOM=300.15;
const VT=KB*TNOM/QE; // ≈ 25.87 mV, fijo (no se modela dependencia térmica en esta práctica)

const DIODES={
  led:{name:'LED rojo (genérico 5mm)',kind:'fwd',Is:1e-14,n:2.6,ifmax:0.02,ifTxt:'20 mA',vfTyp:2.0,vfLo:1.8,vfHi:2.2,color:0xd23b3b},
  sch:{name:'Schottky (tipo 1N5819)',kind:'fwd',Is:9.3e-8,n:1.373,ifmax:1.0,ifTxt:'1 A',vfTyp:0.575,vfLo:0.55,vfHi:0.60,color:0x8a8a8a},
  si :{name:'Silicio (tipo 1N4007)',kind:'fwd',Is:8.4e-10,n:1.85,ifmax:1.0,ifTxt:'1 A',vfTyp:1.0,vfLo:0.9,vfHi:1.1,color:0x2e2e2e},
};
const CLAMPS={
  zen:{name:'Zener 1N4733A (5.1 V)',kind:'zen',vz:5.1,izt:0.049,zzt:7,izk:0.001,zzk:500,izm:0.178,ptot:1.0,color:0x2e6fe0},
  tvs:{name:'TVS SMAJ5.0A',kind:'tvs',vbr:6.4,rdyn:0.0644,ipp:43.48,vcmax:9.2,pppm:400,vrwm:5,color:0x3fae3f},
};
function iFwd(d,v){return d.Is*(Math.exp(v/(d.n*VT))-1);}
function vFwdAt(d,i){return d.n*VT*Math.log(i/d.Is+1);}
function vzk(z){return z.vz+(z.izk-z.izt)*z.zzt;}
function v0(z){return vzk(z)-z.izk*z.zzk;}
function vAtIzm(z){return vzk(z)+(z.izm-z.izk)*z.zzt;}
function izOfV(z,v){
  const K=vzk(z),V0=v0(z);
  if(v<=V0)return 0;
  if(v<=K)return (v-V0)/z.zzk;
  return z.izk+(v-K)/z.zzt;
}
function iTvsOfV(t,v){return v<=t.vbr?0:(v-t.vbr)/t.rdyn;}
function solveFwd(d,vs,rs){
  let lo=0,hi=vs;
  const f=function(v){return (vs-v)/rs - iFwd(d,v);};
  for(let k=0;k<80;k++){const mid=(lo+hi)/2; if(f(mid)>0)lo=mid;else hi=mid;}
  const v=(lo+hi)/2;
  return {v:v,i:Math.max(iFwd(d,v),0)};
}
function solveClamp(iOfVFn,vs,rs){
  let lo=0,hi=Math.max(vs,0);
  const f=function(v){return (vs-v)/rs - iOfVFn(v);};
  for(let k=0;k<80;k++){const mid=(lo+hi)/2; if(f(mid)>0)lo=mid;else hi=mid;}
  const v=(lo+hi)/2;
  return {v:v,i:Math.max(iOfVFn(v),0)};
}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}
function fmtV(v){return v.toFixed(3)+' V';}
function fmtI(i){
  if(i>=1)return i.toFixed(3)+' A';
  if(i>=0.001)return (i*1000).toFixed(1)+' mA';
  return (i*1e6).toFixed(0)+' µA';
}
function fmtP(w){return w>=1?w.toFixed(3)+' W':(w*1000).toFixed(1)+' mW';}
function fmtR(r){return r>=1000?(r/1000).toFixed(2)+' kΩ':r.toFixed(0)+' Ω';}

/* ---------- 2) Estado ---------- */
const RVALS=[47,100,220,330,470,680,1000,2200];
let cat='cond';           // 'cond' (conducción) | 'prot' (protección)
let dsel='led', csel='zen';
let Ridx=3, Vs=6;
let mode='explora', solved=false;
let PRED=null, predSolved=false, predRevealed=false, predType='B';
let RETO=null, retoSolved=false;
let sweeping=false;
const SWEEP=[];
let RES=null;
function curR(){return RVALS[Ridx];}
function curFwd(){return DIODES[dsel];}
function curClamp(){return CLAMPS[csel];}
function curDut(){return cat==='cond'?curFwd():curClamp();}
function iOfCurClamp(v){return csel==='zen'?izOfV(curClamp(),v):iTvsOfV(curClamp(),v);}

/* ---------- 3) Materiales ---------- */
const std=function(o){return new THREE.MeshStandardMaterial(o);};
const MAT={
  bench:std({color:0x0e1512,roughness:0.9,metalness:0.05}),
  frame:std({color:0x11201c,roughness:0.6,metalness:0.3}),
  pcb:std({color:0x0c2a20,roughness:0.75}),
  psu:std({color:0x1a2622,roughness:0.4,metalness:0.4}),
  scope:std({color:0x121a18,roughness:0.35,metalness:0.5}),
  lead:std({color:0xb9c2bd,metalness:0.8,roughness:0.3}),
  resistor:std({color:0xe8d9b0,roughness:0.5}),
  diodeBand:std({color:0xd8d8d8,metalness:0.6,roughness:0.3}),
  ledLens:std({color:0xff4040,roughness:0.15,transparent:true,opacity:0.85,emissive:0x330000,emissiveIntensity:0.2}),
  ledHalo:std({color:0xff6060,transparent:true,opacity:0.0}),
};
const BAND_COLORS=['#1a1a1a','#7a4a1e','#d23b3b','#e8871e','#e8d21e','#3fae3f','#2e6fe0','#8a4fd6','#8a8a8a','#e8e8e8'];
function bandsFor(v){const exp=Math.floor(Math.log10(v))-1,dd=Math.round(v/Math.pow(10,exp));return {d1:Math.floor(dd/10),d2:dd%10,mult:exp+1};}

/* ---------- 4) Ayudantes de dibujo 2D ---------- */
function line(c,x0,y0,x1,y1,col,w,dash){c.save();c.strokeStyle=col;c.lineWidth=w||2;if(dash)c.setLineDash(dash);c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.restore();}
function rr(c,x,y,w,h,r,fill,stroke,sw){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=sw||2;c.stroke();}}
function groundGlyph(c,x,y){line(c,x,y,x,y+14,'#EAF4F1',2.5);line(c,x-16,y+14,x+16,y+14,'#EAF4F1',2.5);line(c,x-10,y+21,x+10,y+21,'#EAF4F1',2);line(c,x-4,y+28,x+4,y+28,'#EAF4F1',1.5);}
function hResistorGlyph(c,x0,x1,cy,label){rr(c,x0+8,cy-16,(x1-x0)-16,32,4,'#1a2a26','#EAF4F1',2);line(c,x0,cy,x0+8,cy,'#EAF4F1',2.5);line(c,x1-8,cy,x1,cy,'#EAF4F1',2.5);if(label){c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='center';c.fillText(label,(x0+x1)/2,cy-22);}}
function diodeGlyph(c,cx,y0,y1,color,flip){
  const my=(y0+y1)/2,h=(y1-y0)/2;
  if(!flip){
    c.beginPath();c.moveTo(cx-15,y0+8);c.lineTo(cx+15,y0+8);c.lineTo(cx,my+h*0.4>my?my:my);c.closePath();
  }
  c.beginPath();
  c.moveTo(cx-15,my-h*0.5);c.lineTo(cx+15,my-h*0.5);c.lineTo(cx,my+h*0.5);c.closePath();
  c.fillStyle=color;c.fill();c.strokeStyle='#EAF4F1';c.lineWidth=2;c.stroke();
  line(c,cx-15,my+h*0.5,cx+15,my+h*0.5,'#EAF4F1',3);
}
function tvsGlyph(c,cx,y0,y1,color){
  const my=(y0+y1)/2,h=(y1-y0)/2;
  diodeGlyph(c,cx,y0,y1,color,false);
  c.beginPath();c.moveTo(cx-15,my-h*0.5);c.lineTo(cx+15,my-h*0.5);c.lineTo(cx,my+h*0.5);c.closePath();
  c.fillStyle=color;c.fill();c.strokeStyle='#EAF4F1';c.lineWidth=2;c.stroke();
}

/* ---------- 5) Pizarrón: esquemático + gráfica V-I ---------- */
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bCx=bCv.getContext('2d');
const bTex=new THREE.CanvasTexture(bCv);bTex.colorSpace=THREE.SRGBColorSpace;
const PX0=130,PX1=940,PY0=308,PY1=676;
const WY=104,BY=256,srcX=150,srcY=(WY+BY)/2,rsX0=232,outX=460,dutX=460,rlX=640;
const HIT=[
  {x:srcX,y:srcY,r:55,act:'src'},
  {x:(rsX0+outX)/2,y:WY,r:50,act:'rs'},
  {x:dutX,y:(WY+BY)/2,r:55,act:'dut'},
  {x:890,y:333,r:46,act:'cat'}
];
function graphRange(){
  if(cat==='cond'){const d=curFwd();return {vMaxG:d.vfHi*1.6,iMaxG:d.ifmax*1.35};}
  const c=curClamp();
  if(csel==='zen')return {vMaxG:vAtIzm(c)*1.15,iMaxG:c.izm*1.2};
  return {vMaxG:c.vcmax*1.15,iMaxG:(c.vcmax-c.vbr)/c.rdyn*0.6};
}
function xPix(v){const g=graphRange();return PX0+(v/g.vMaxG)*(PX1-PX0);}
function gyPix(i){const g=graphRange();return PY1-(Math.max(Math.min(i,g.iMaxG),0)/g.iMaxG)*(PY1-PY0);}
function drawSchematic(c){
  c.clearRect(0,0,1024,PY0-4);
  line(c,srcX,WY,rsX0,WY,'#EAF4F1',2.5);
  hResistorGlyph(c,rsX0,outX,WY,'Rs');
  line(c,outX,WY,rlX,WY,'#EAF4F1',2.5);
  c.beginPath();c.arc(outX,WY,4,0,7);c.fillStyle='#4FD1C5';c.fill();
  line(c,dutX,WY,dutX,WY+40,'#EAF4F1',2.5);
  const hideCol=(mode==='predice'&&!predRevealed);
  const dut=curDut(),col=(RES&&!hideCol)?curColor():'#8FB3AC';
  if(cat==='cond')diodeGlyph(c,dutX,WY+40,BY-40,col,false);
  else if(csel==='zen')diodeGlyph(c,dutX,WY+40,BY-40,col,true);
  else tvsGlyph(c,dutX,WY+40,BY-40,col);
  line(c,dutX,BY-40,dutX,BY,'#EAF4F1',2.5);
  if(cat==='prot'){
    line(c,rlX,WY,rlX,WY+70,'#EAF4F1',2.5);
    c.beginPath();c.arc(rlX,WY+78,4,0,7);c.strokeStyle='#8FB3AC';c.lineWidth=2;c.stroke();
    c.beginPath();c.arc(rlX,BY-70,4,0,7);c.strokeStyle='#8FB3AC';c.lineWidth=2;c.stroke();
    line(c,rlX,BY-62,rlX,BY,'#EAF4F1',2.5);
    c.fillStyle='#8FB3AC';c.font='11px monospace';c.textAlign='center';c.fillText('componente protegido (Z alta)',rlX,(WY+BY)/2+5);
  }
  line(c,srcX,BY,(cat==='prot'?rlX:dutX),BY,'#EAF4F1',2.5);
  groundGlyph(c,srcX,BY);
  c.beginPath();c.arc(srcX,srcY,32,0,7);c.strokeStyle='#4FD1C5';c.lineWidth=2.5;c.stroke();
  c.fillStyle='#4FD1C5';c.font='bold 18px system-ui';c.textAlign='center';
  c.fillText('+',srcX,srcY-4);c.fillText('−',srcX,srcY+20);
  c.font='11px monospace';c.fillStyle='#8FB3AC';c.fillText('Vs = '+Vs.toFixed(1)+' V',srcX,srcY+48);
  c.font='11px monospace';c.fillStyle='#8FB3AC';c.textAlign='left';
  c.fillText(dut.name,dutX+22,(WY+BY)/2+4);
}
function drawGraph(c){
  const g=graphRange();
  rr(c,PX0-4,PY0-4,(PX1-PX0)+8,(PY1-PY0)+8,6,'#0c1a16','#1E3A34',2);
  const xt=g.vMaxG<=2?0.25:g.vMaxG<=6?0.5:g.vMaxG<=10?1:2;
  c.font='10px monospace';
  for(let v=0;v<=g.vMaxG+1e-6;v+=xt){
    const x=xPix(v);
    line(c,x,PY0,x,PY1,'#12241f',1);
    c.fillStyle='#8FB3AC';c.textAlign='center';c.fillText(v.toFixed(v<1?2:1),x,PY1+16);
  }
  const yt=g.iMaxG<=0.03?0.005:g.iMaxG<=0.3?0.05:g.iMaxG<=1?0.2:5;
  for(let i=0;i<=g.iMaxG+1e-9;i+=yt){
    const y=gyPix(i);
    line(c,PX0,y,PX1,y,'#12241f',1);
    c.fillStyle='#8FB3AC';c.textAlign='right';
    c.fillText(g.iMaxG<=1?(i*1000).toFixed(0)+' mA':i.toFixed(0)+' A',PX0-8,y+4);
  }
  line(c,PX0,PY1,PX1,PY1,'#EAF4F1',2);
  line(c,PX0,PY0,PX0,PY1,'#EAF4F1',2);
  c.fillStyle='#EAF4F1';c.font='12px monospace';c.textAlign='center';
  c.fillText('V (V)',(PX0+PX1)/2,PY1+34);
  c.save();c.translate(PX0-46,(PY0+PY1)/2);c.rotate(-Math.PI/2);c.textAlign='center';c.fillText('I',0,0);c.restore();

  // curva(s) del dispositivo activo — en Conducción se sobreponen las 3 familias
  function traceFwd(d,color){
    c.beginPath();let started=false;
    for(let px=0;px<=200;px++){
      const v=g.vMaxG*px/200,i=iFwd(d,v);
      const x=xPix(v),y=gyPix(Math.max(i,0));
      if(!started){c.moveTo(x,y);started=true;}else c.lineTo(x,y);
    }
    c.strokeStyle=color;c.lineWidth=2.5;c.stroke();
  }
  function traceClamp(iOfVFn,color){
    c.beginPath();let started=false;
    for(let px=0;px<=200;px++){
      const v=g.vMaxG*px/200,i=iOfVFn(v);
      const x=xPix(v),y=gyPix(Math.max(i,0));
      if(!started){c.moveTo(x,y);started=true;}else c.lineTo(x,y);
    }
    c.strokeStyle=color;c.lineWidth=2.5;c.stroke();
  }
  if(cat==='cond'){
    if(mode==='barrido'&&barCompare){
      traceFwd(DIODES.led,'#d23b3b');traceFwd(DIODES.sch,'#8FB3AC');traceFwd(DIODES.si,'#4FD1C5');
      c.font='11px monospace';c.textAlign='left';
      c.fillStyle='#d23b3b';c.fillText('● LED',PX0+8,PY0+16);
      c.fillStyle='#8FB3AC';c.fillText('● Schottky',PX0+80,PY0+16);
      c.fillStyle='#4FD1C5';c.fillText('● Si (ref.)',PX0+178,PY0+16);
    }else traceFwd(curFwd(),'#4FD1C5');
  }else{
    if(mode==='barrido'&&barCompare){
      traceClamp(function(v){return izOfV(CLAMPS.zen,v);},'#2e6fe0');
      traceClamp(function(v){return iTvsOfV(CLAMPS.tvs,v);},'#3fae3f');
      c.font='11px monospace';c.textAlign='left';
      c.fillStyle='#2e6fe0';c.fillText('● Zener 1N4733A',PX0+8,PY0+16);
      c.fillStyle='#3fae3f';c.fillText('● TVS SMAJ5.0A',PX0+150,PY0+16);
    }else traceClamp(iOfCurClamp,'#4FD1C5');
  }
  if(!(mode==='predice'&&!predRevealed)){
    const rs=curR();
    const iAt0=Vs/rs,p0x=xPix(0),p0y=gyPix(iAt0);
    const p1x=xPix(g.vMaxG),p1y=gyPix(Math.max((Vs-g.vMaxG)/rs,0));
    line(c,p0x,p0y,p1x,p1y,'#E8871E',2,[6,4]);
  }
  if(RES&&!(mode==='predice'&&!predRevealed)){
    const qx=xPix(RES.v),qy=gyPix(RES.i);
    c.beginPath();c.arc(qx,qy,6,0,7);c.fillStyle='#FFB703';c.fill();c.strokeStyle='#fff';c.lineWidth=1.5;c.stroke();
    c.fillStyle='#FFB703';c.font='bold 12px monospace';c.textAlign='left';
    c.fillText('Q ('+RES.v.toFixed(2)+'V, '+fmtI(RES.i)+')',qx+10,qy-10);
  }
  rr(c,846,318,88,30,8,'#11201c',cat==='prot'?'#4FD1C5':'#8FB3AC',2);
  c.font='bold 13px system-ui';c.textAlign='center';
  c.fillStyle=cat==='prot'?'#4FD1C5':'#8FB3AC';c.fillText(cat==='prot'?'PROTECCIÓN':'CONDUCCIÓN',890,338);
}
function drawBoard(){
  const c=bCx;
  c.clearRect(0,0,1024,768);
  c.fillStyle='#0a1512';c.fillRect(0,0,1024,768);
  drawSchematic(c);
  drawGraph(c);
  bTex.needsUpdate=true;
}
function curColor(){
  if(!RES)return '#4FD1C5';
  if(RES.status==='over'||RES.status==='overIPP')return '#d23b3b';
  if(RES.status==='clamp')return '#3fae3f';
  return '#4FD1C5';
}
function boardClick(u,v){
  const x=u*1024,y=(1-v)*768;
  if(RES&&!(mode==='predice'&&!predRevealed)){
    const qx=xPix(RES.v),qy=gyPix(RES.i);
    if(Math.hypot(x-qx,y-qy)<40){
      showToast('Punto Q: V = '+fmtV(RES.v)+' · I = '+fmtI(RES.i)+' · estado: '+RES.status);
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
  if(best.act==='cat'){toggleCat();return;}
  if(best.act==='src')showToast('Fuente Vs = '+Vs.toFixed(1)+' V (ideal, sin resistencia interna).');
  if(best.act==='rs')showToast('Rs = '+fmtR(curR())+' — '+(cat==='cond'?'limita la corriente hacia el dispositivo.':'representa la impedancia de línea que ve el transitorio antes del dispositivo de protección.'));
  if(best.act==='dut')showToast(curDut().name+' — '+(cat==='cond'?'Vf ≈ '+curFwd().vfTyp.toFixed(2)+' V típico.':(csel==='zen'?'VZ nominal '+CLAMPS.zen.vz.toFixed(1)+' V.':'VBR mín '+CLAMPS.tvs.vbr.toFixed(1)+' V, VC máx '+CLAMPS.tvs.vcmax.toFixed(1)+' V @ IPP.')));
}
function toggleCat(){
  cat=cat==='cond'?'prot':'cond';
  el('catCond').classList.toggle('on',cat==='cond');
  el('catProt').classList.toggle('on',cat==='prot');
  el('condPanel').style.display=cat==='cond'?'block':'none';
  el('protPanel').style.display=cat==='prot'?'block':'none';
  showToast(cat==='cond'?'CONDUCCIÓN: lazo serie Vs—Rs—dispositivo—GND. Comparas la caída directa de LED, Schottky y Si.':'PROTECCIÓN: lazo shunt Vs—Rs—NODO—dispositivo. El dispositivo desvía corriente para limitar el voltaje del nodo ante un transitorio.');
  onChange();
}

/* ---------- 6) Banco 3D ---------- */
const boardG=new THREE.Group();
const board=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.95),new THREE.MeshStandardMaterial({map:bTex,roughness:0.55,metalness:0.05}));
board.userData.title='Esquemático + gráfica V-I';
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
fuenteBox.g.userData.act='src3d';fuenteBox.g.userData.title='Fuente Vs';
benchG.add(fuenteBox.g);
const medidorBox=makeDisplayBox(0.62,0.42,0.14,256,180);
medidorBox.g.position.set(0.55,0.42,0.55);
medidorBox.g.userData.title='Medidor V / I';
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
function makeDiode3D(colorHex){
  const g=P3.diodoAxial(MATP,{largo:0.17,d:0.075,patas:0.10,paso:0.36,
    cuerpo:colorHex,banda:MAT.diodeBand.color.getHex(),catodo:1});
  g.userData.bodyMesh=g.userData.cuerpo;
  return g;
}
function makeLed3D(){
  const g=P3.led(MATP,{d:0.12,color:MAT.ledLens.color.getHex(),patas:0.14});
  const halo=new THREE.Mesh(new THREE.SphereGeometry(0.11,12,10),MAT.ledHalo);
  halo.position.y=0.09; g.add(halo);
  g.userData.lens=g.children[0];
  g.userData.halo=halo;
  return g;
}
// Todos apoyan en la CARA de la placa: la biblioteca dibuja cada componente
// con y = 0 en la placa y las patas por debajo. Antes flotaban dos decimas
// por encima, que con patas horizontales no se notaba y con patas si.
const Y_PCB=0.035;
const rsG=makeResistor3D();
rsG.position.set(-0.15,Y_PCB,1.15);
rsG.userData.act='rs3d';rsG.userData.title='Resistor Rs';
benchG.add(rsG);
const ledG=makeLed3D();
ledG.position.set(0.18,Y_PCB,1.15);
ledG.userData.act='dut3d';ledG.userData.title='Dispositivo bajo prueba';
benchG.add(ledG);
const diodeG=makeDiode3D(0x8a8a8a);
diodeG.position.set(0.18,Y_PCB,1.15);diodeG.rotation.y=Math.PI/2;
diodeG.userData.act='dut3d';diodeG.userData.title='Dispositivo bajo prueba';
benchG.add(diodeG);

benchG.traverse(function(o){if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
board.castShadow=false;boardFrame.receiveShadow=true;
S.scene.add(benchG);

function refreshBenchSel(){
  paintBands(rsG,curR());
  if(cat==='cond'&&dsel==='led'){
    ledG.visible=true;diodeG.visible=false;
  }else{
    ledG.visible=false;diodeG.visible=true;
    const colorHex=cat==='cond'?DIODES[dsel].color:CLAMPS[csel].color;
    diodeG.userData.bodyMesh.material=std({color:colorHex,roughness:0.25,metalness:0.15});
  }
}
function drawFuenteScreen(){
  const cx=fuenteBox.cx,cv=fuenteBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#08120f';cx.fillRect(0,0,cv.width,cv.height);
  cx.fillStyle='#4FD1C5';cx.font='bold 30px monospace';cx.textAlign='center';
  cx.fillText('Vs',cv.width/2,54);
  cx.font='bold 42px monospace';
  cx.fillText(Vs.toFixed(1)+' V',cv.width/2,118);
  fuenteBox.tex.needsUpdate=true;
}
function drawMedidorScreen(){
  const cx=medidorBox.cx,cv=medidorBox.cv;
  cx.clearRect(0,0,cv.width,cv.height);
  cx.fillStyle='#08120f';cx.fillRect(0,0,cv.width,cv.height);
  const hide=(mode==='predice'&&!predRevealed);
  cx.fillStyle='#FFB703';cx.font='bold 18px monospace';cx.textAlign='center';
  cx.fillText('V / I',cv.width/2,32);
  cx.font='bold 26px monospace';
  if(hide){
    cx.fillText('¿?  /  ¿?',cv.width/2,110);
  }else if(RES){
    cx.fillText(RES.v.toFixed(2)+' V',cv.width/2,88);
    cx.fillText(fmtI(RES.i),cv.width/2,136);
  }
  medidorBox.tex.needsUpdate=true;
}
function refreshBenchDyn(){
  drawFuenteScreen();drawMedidorScreen();
  if(cat==='cond'&&dsel==='led'&&RES){
    const t=Math.min(RES.i/DIODES.led.ifmax,1.4);
    ledG.userData.lens.material.emissiveIntensity=0.15+t*1.2;
    ledG.userData.halo.material.opacity=Math.min(t*0.5,0.6)*(0.7+0.3*Math.sin(performance.now()/1000*3));
  }else if(ledG.userData.halo){
    ledG.userData.halo.material.opacity=0;
  }
}

/* ---------- 7) HUD + panel ---------- */
const condBtnsHtml=Object.keys(DIODES).map(function(k){
  const d=DIODES[k];
  return '<button class="b'+(k===dsel?' on':'')+'" style="flex:1 0 100%" id="d_'+k+'">'+d.name+' · Vf≈'+d.vfTyp.toFixed(2)+' V · '+d.ifTxt+' máx</button>';
}).join('');
const protBtnsHtml=Object.keys(CLAMPS).map(function(k){
  const c=CLAMPS[k];
  const spec=k==='zen'?('VZ '+c.vz.toFixed(1)+' V · '+(c.ptot*1000).toFixed(0)+' mW'):('VBR '+c.vbr.toFixed(1)+' V · VC '+c.vcmax.toFixed(1)+' V');
  return '<button class="b'+(k===csel?' on':'')+'" style="flex:1 0 100%" id="c_'+k+'">'+c.name+' · '+spec+'</button>';
}).join('');
const rBtnsHtml=RVALS.map(function(v,i){
  return '<button class="b'+(i===Ridx?' on':'')+'" style="flex:1 0 22%" id="r_'+i+'">'+v+' Ω</button>';
}).join('');

document.getElementById('hud').innerHTML=`
  <div class="eyebrow">D2 · Semiconductores — Práctica d2-05</div>
  <h2>LED, Schottky y TVS: Selección de Dispositivo y Protección</h2>
  <p>No todos los diodos se eligen igual. Un <b>LED</b> necesita un resistor limitador porque su corriente crece muy rápido con el voltaje; un <b>Schottky</b> se elige quan la meta es la mínima caída directa posible; un rectificador de <b>silicio</b> es la referencia de comparación. Para <b>protección</b>, un <b>zener</b> o un <b>TVS</b> se conectan en paralelo (shunt) a un nodo para "recortar" (clampear) un transitorio de sobrevoltaje antes de que llegue a un componente sensible aguas abajo.</p>
  <div class="formula">
    Conducción: R = (Vs − Vf)/If &nbsp;·&nbsp; I = Is·[exp(V/(n·VT)) − 1]<br>
    Protección: V = VBR + Ipp·Rdyn &nbsp;(o el zener por tramos de mecanica-16)
  </div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Fuente Vs</div>
    <div class="li"><span class="dot" style="background:#EAF4F1"></span>Resistor Rs (serie/línea)</div>
    <div class="li"><span class="dot" style="background:#d23b3b"></span>LED</div>
    <div class="li"><span class="dot" style="background:#2e6fe0"></span>Zener 1N4733A</div>
    <div class="li"><span class="dot" style="background:#3fae3f"></span>TVS SMAJ5.0A</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Punto de operación Q</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> Ecuación de Shockley con Is/n verificados por dispositivo (temperatura fija 300.15 K); modelo zener por tramos idéntico al de mecanica-16; modelo TVS por 2 tramos anclado a VBR(mín) y VC(máx)@IPP del datasheet SMAJ5.0A. Solución de circuito por bisección exacta en ambas topologías.<br>
  <span class="no">NO:</span> Dependencia de temperatura (Eg/XTI). Salida óptica del LED en lm/mcd (el brillo 3D es solo cualitativo). Curva de derateo del TVS vs. duración del pulso. Impedancia de carga aguas abajo del nodo protegido (idealizada como infinita).</div>
  <div class="src">Ref: Vishay/ST 1N5817-1N5819, Diodes Inc. ds18007 (1N4733A), Littelfuse/Vishay/Bourns SMAJ5.0A, datasheets genéricos LED rojo 5mm.</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Selección y Protección · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🔍 Explora</button>
    <button class="b" id="m_predice">🔮 Predice</button>
    <button class="b" id="m_barrido">📉 Barrido</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="p_mision" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>

  <div class="btns" style="margin-bottom:8px">
    <button class="b on" id="catCond" style="flex:1 0 48%">⚡ Conducción</button>
    <button class="b" id="catProt" style="flex:1 0 48%">🛡️ Protección</button>
  </div>

  <div id="condPanel">
    <div style="font-size:12px;color:#8FB3AC;margin:6px 0 4px">Dispositivo (conducción)</div>
    <div class="btns">${condBtnsHtml}</div>
  </div>
  <div id="protPanel" style="display:none">
    <div style="font-size:12px;color:#8FB3AC;margin:6px 0 4px">Dispositivo (protección)</div>
    <div class="btns">${protBtnsHtml}</div>
  </div>

  <div style="font-size:12px;color:#8FB3AC;margin:10px 0 4px">Resistor Rs</div>
  <div class="btns">${rBtnsHtml}</div>

  <div style="margin-top:10px">
    <label style="font-size:12px;color:#8FB3AC">Vs: <span id="vVs">6.0 V</span></label><br>
    <input type="range" id="sVs" min="2" max="15" step="0.1" value="6" style="width:100%">
  </div>

  <div class="tele" style="margin-top:10px">
    <div class="g"><div class="l">V</div><div id="tV">—</div></div>
    <div class="g"><div class="l">I</div><div id="tI">—</div></div>
    <div class="g"><div class="l">P_R</div><div id="tPR">—</div></div>
    <div class="g"><div class="l">P_dut</div><div id="tPD">—</div></div>
    <div class="g"><div class="l">Estado</div><div id="tSt">—</div></div>
  </div>

  <div id="predBox" style="display:none;margin-top:10px">
    <div id="predAsk" style="font-size:12px;color:#8FB3AC"></div>
    <div id="predInputsA" style="display:none">
      <label style="font-size:11px">R predicha (Ω) <input type="number" id="predR" step="1" style="background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px;width:90px"></label>
    </div>
    <div id="predInputsB" style="display:none">
      <label style="font-size:11px">V (V) <input type="number" id="predV" step="0.01" style="background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px;width:70px"></label>
      <label style="font-size:11px">I (mA) <input type="number" id="predI" step="0.1" style="background:#11201c;border:1px solid #1E3A34;color:#EAF4F1;border-radius:6px;padding:4px;width:70px"></label>
    </div>
    <div id="predInputsC" style="display:none">
      <button class="b" id="predSi" style="flex:1 0 45%">SÍ protege</button>
      <button class="b" id="predNo" style="flex:1 0 45%">NO protege</button>
    </div>
    <div class="btns" style="margin-top:6px">
      <button class="b primary" id="btnPred">Verificar</button>
      <button class="b sec" id="btnPredNew">Nuevo caso</button>
    </div>
    <div id="predResult" style="margin-top:6px;font-size:12px"></div>
  </div>

  <div id="barBox" style="display:none;margin-top:10px">
    <div class="btns">
      <button class="b primary" id="btnSweep">▶ Barrer Vs</button>
      <button class="b sec" id="btnCompare">⇄ Comparar familia</button>
    </div>
    <div id="sweepResult" style="margin-top:6px;font-size:12px"></div>
  </div>

  <div id="retoBox" style="display:none;margin-top:10px">
    <div id="retoAsk" style="font-size:12px;color:#8FB3AC"></div>
    <div class="btns" style="margin-top:6px">
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
  explora:'Explora libremente: cambia de categoría, dispositivo, Rs y Vs, y observa V, I y potencia.',
  predice:'Predice antes de ver: diseño de R, punto de operación, o si un transitorio pasa la protección.',
  barrido:'Barre Vs y compara la curva del dispositivo activo contra las otras de su misma familia.',
  reto:'Diseña una protección que mantenga el nodo por debajo del voltaje máximo del componente aguas abajo.',
};
let barCompare=false;
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
  if(k==='reto'){cat='prot';if(!RETO)newReto();}
  syncCtrlBtns();clearDx();refreshQuestion();refreshBenchSel();refreshAll();
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
}
function syncCtrlBtns(){
  Object.keys(DIODES).forEach(function(k){el('d_'+k).classList.toggle('on',k===dsel);});
  Object.keys(CLAMPS).forEach(function(k){el('c_'+k).classList.toggle('on',k===csel);});
  RVALS.forEach(function(v,i){el('r_'+i).classList.toggle('on',i===Ridx);});
  el('catCond').classList.toggle('on',cat==='cond');
  el('catProt').classList.toggle('on',cat==='prot');
  el('condPanel').style.display=cat==='cond'?'block':'none';
  el('protPanel').style.display=cat==='prot'?'block':'none';
  const retoLock=(mode==='reto');
  Object.keys(DIODES).forEach(function(k){el('d_'+k).disabled=retoLock;});
  el('catCond').disabled=retoLock;el('catProt').disabled=retoLock;
}
function selCat(k){
  if(mode==='predice'){showToast('En modo Predicción la categoría se elige aleatoriamente.');return;}
  if(mode==='reto'){showToast('En el Reto la categoría (protección) está fija.');return;}
  if(cat!==k){cat=k;onChange();}
}
function selDevice(k){
  if(mode==='predice'){showToast('En modo Predicción el dispositivo se elige aleatoriamente. Cambia a Explora para elegirlo tú.');return;}
  if(mode==='reto'){showToast('En el Reto el dispositivo de protección se elige como parte de la verificación.');return;}
  dsel=k;onChange();
}
function selClamp(k){
  if(mode==='predice'){showToast('En modo Predicción el dispositivo se elige aleatoriamente.');return;}
  csel=k;onChange();
}
function selR(i){
  if(mode==='predice'){showToast('En modo Predicción Rs se elige aleatoriamente.');return;}
  Ridx=i;onChange();
}
function onChange(){syncCtrlBtns();buildQuiz();clearDx();refreshQuestion();refreshBenchSel();refreshAll();}

/* ---------- 9) Telemetría + reporte ---------- */
function set(id,txt,cls){const n=el(id);n.textContent=txt;n.classList.remove('good','warn','bad');if(cls)n.classList.add(cls);}
function updateTele(){
  const hide=(mode==='predice'&&!predRevealed);
  if(hide||!RES){
    set('tV','¿?','warn');set('tI','¿?','warn');set('tPR','¿?','warn');set('tPD','¿?','warn');set('tSt','¿?','warn');
    return;
  }
  set('tV',fmtV(RES.v));
  const iCls=RES.status==='over'||RES.status==='overIPP'?'bad':(RES.status==='warn'?'warn':'good');
  set('tI',fmtI(RES.i),iCls);
  set('tPR',fmtP(RES.pr));
  const pdCls=RES.pd!=null&&RES.pdMax!=null?(RES.pd>RES.pdMax?'bad':(RES.pd>0.8*RES.pdMax?'warn':'good')):'good';
  set('tPD',RES.pd!=null?fmtP(RES.pd):'—',pdCls);
  const stTxt={ok:'Normal',standby:'Reposo (fuga despreciable)',clamp:'Clampeando (protegiendo)',knee:'Codo (transición)',warn:'Cerca del límite',over:'¡Sobrecorriente!',overIPP:'¡Excede IPP de pulso!'}[RES.status]||RES.status;
  const stCls=RES.status==='ok'||RES.status==='standby'||RES.status==='clamp'?'good':(RES.status==='over'||RES.status==='overIPP'?'bad':'warn');
  set('tSt',stTxt,stCls);
}
function updateReport(){
  let L=[];
  if(mode==='explora'){
    if(cat==='cond'){
      const d=curFwd();
      L.push('Dispositivo: '+d.name+' — Vf típico ≈ '+d.vfTyp.toFixed(2)+' V ('+d.vfLo.toFixed(2)+'–'+d.vfHi.toFixed(2)+' V según lote/fabricante)');
      L.push('V = '+fmtV(RES.v)+' · I = '+fmtI(RES.i)+' · P_R = '+fmtP(RES.pr)+' · P_dut = '+fmtP(RES.pd));
      if(RES.status==='over')L.push('¡Cuidado! I excede el máximo del datasheet ('+d.ifTxt+') — en un circuito real el dispositivo se dañaría.');
    }else{
      const c=curClamp();
      if(csel==='zen'){
        L.push('Zener 1N4733A — VZ nominal '+c.vz.toFixed(1)+' V, IZM = '+fmtI(c.izm));
        L.push('V(nodo) = '+fmtV(RES.v)+' · Iz = '+fmtI(RES.i)+' · Pz = '+fmtP(RES.pd));
      }else{
        L.push('TVS SMAJ5.0A — VBR mín '+c.vbr.toFixed(1)+' V, VC máx '+c.vcmax.toFixed(1)+' V @ IPP '+c.ipp.toFixed(1)+' A');
        L.push('V(nodo) = '+fmtV(RES.v)+' · I = '+fmtI(RES.i));
      }
      if(RES.status==='standby')L.push('Vs está por debajo del voltaje de ruptura: el dispositivo no conduce (fuga despreciable) y el nodo sigue a Vs.');
      if(RES.status==='clamp')L.push('El dispositivo está clampeando: el nodo queda limitado muy por debajo de Vs.');
    }
  }else if(mode==='predice'){
    L.push(predAskText());
    if(predRevealed)L.push(predSolved?'¡Correcto! Revisa el detalle abajo.':'Revisa tu cálculo — detalle abajo.');
  }else if(mode==='barrido'){
    L.push(sweeping?'Barriendo Vs…':'Pulsa "Barrer Vs" para trazar la curva del punto de operación, o "Comparar familia" para sobreponer las curvas de datasheet.');
    if(SWEEP.length>1)L.push(SWEEP.length+' puntos medidos entre '+SWEEP[0].vs.toFixed(1)+' V y '+SWEEP[SWEEP.length-1].vs.toFixed(1)+' V.');
  }else if(mode==='reto'){
    L.push('Transitorio Vs = '+RETO.vs.toFixed(1)+' V a través de Rs(línea) = '+fmtR(RETO.rsLine)+'. El componente aguas abajo tolera hasta Vmax = '+RETO.vmax.toFixed(1)+' V.');
    L.push('Elige el dispositivo de protección y Rs de tu circuito para que el nodo no supere Vmax, y (si usas el zener) que Iz se mantenga entre IZK e IZM.');
    L.push(retoSolved?'¡Diseño válido!':'Ajusta y pulsa "Verificar diseño".');
  }
  el('report').innerHTML=L.map(function(x){return '<div>• '+x+'</div>';}).join('');
}
function refreshAll(){
  let r,pr,pd=null,pdMax=null,status;
  if(cat==='cond'){
    const d=curFwd();
    r=solveFwd(d,Vs,curR());
    pr=r.i*r.i*curR();
    pd=r.v*r.i;pdMax=d.ifmax*d.vfHi*1.3;
    status=r.i>d.ifmax?'over':(r.i>0.9*d.ifmax?'warn':'ok');
  }else if(csel==='zen'){
    const z=curClamp();
    r=solveClamp(function(v){return izOfV(z,v);},Vs,curR());
    pr=r.i*r.i*curR();
    pd=r.v*r.i;pdMax=z.ptot;
    const K=vzk(z),V0=v0(z);
    status=r.v<=V0?'standby':(r.v<=K?'knee':(r.i>z.izm?'over':'clamp'));
  }else{
    const t=curClamp();
    r=solveClamp(function(v){return iTvsOfV(t,v);},Vs,curR());
    pr=r.i*r.i*curR();
    status=r.v<=t.vbr?'standby':(r.i>t.ipp?'overIPP':'clamp');
  }
  RES={v:r.v,i:r.i,pr:pr,pd:pd,pdMax:pdMax,status:status};
  drawBoard();
  updateTele();
  updateReport();
  refreshBenchDyn();
}

/* ---------- 10) Barrido comparativo ---------- */
function toggleCompare(){
  barCompare=!barCompare;
  el('btnCompare').classList.toggle('on',barCompare);
  showToast(barCompare?'Comparando las curvas de datasheet de toda la familia activa.':'Mostrando solo la curva del dispositivo seleccionado.');
  refreshAll();
}
async function runSweep(){
  if(sweeping)return;
  sweeping=true;
  const b=el('btnSweep');b.disabled=true;b.textContent='Barriendo…';
  const lockCat=cat,lockD=dsel,lockC=csel,lockR=curR();
  SWEEP.length=0;
  const v0v=2,v1v=15,N=17;
  for(let i=0;i<N;i++){
    if(cat!==lockCat||dsel!==lockD||csel!==lockC||curR()!==lockR)break;
    const vs=v0v+(v1v-v0v)*i/(N-1);
    Vs=vs;el('sVs').value=vs.toFixed(1);el('vVs').textContent=vs.toFixed(1)+' V';
    refreshAll();
    SWEEP.push({vs:vs,v:RES.v,i:RES.i});
    await sleep(120);
  }
  el('sweepResult').innerHTML='<div>'+SWEEP.length+' puntos trazados. '+(cat==='cond'?'Observa cómo la caída directa de cada familia se mantiene casi plana mientras crece I.':'Observa cómo el nodo sigue a Vs hasta la ruptura, y luego queda "clavado" cerca de VBR/VC.')+'</div>';
  sweeping=false;b.disabled=false;b.textContent='▶ Barrer Vs';
  showToast('Barrido completo.');
  refreshAll();
}

/* ---------- 11) Predicción (3 tipos rotativos) ---------- */
function predAskText(){
  if(!PRED)return '';
  if(predType==='A')return 'Tipo A — Diseño de R: para '+DIODES[PRED.d].name+', con Vs = '+PRED.vs.toFixed(1)+' V y un objetivo If = '+(PRED.ifTarget*1000).toFixed(1)+' mA, usando Vf típico de datasheet ≈ '+DIODES[PRED.d].vfTyp.toFixed(2)+' V, calcula R = (Vs−Vf)/If.';
  if(predType==='B')return 'Tipo B — Punto de operación: para '+curDut().name+', con Vs = '+PRED.vs.toFixed(1)+' V y Rs = '+fmtR(RVALS[PRED.rIdx])+', predice V e I.';
  return 'Tipo C — ¿Protege?: un transitorio de Vs = '+PRED.vs.toFixed(1)+' V llega a través de Rs(línea) = '+fmtR(RVALS[PRED.rIdx])+' hasta un nodo protegido por '+CLAMPS[PRED.c].name+'. El componente aguas abajo tolera hasta Vmax = '+PRED.vmax.toFixed(1)+' V. ¿El nodo queda por debajo de Vmax?';
}
function genPredice(){
  const types=['A','B','C'];
  predType=types[Math.floor(Math.random()*3)];
  el('predInputsA').style.display=predType==='A'?'block':'none';
  el('predInputsB').style.display=predType==='B'?'block':'none';
  el('predInputsC').style.display=predType==='C'?'block':'none';
  if(predType==='A'){
    const keys=Object.keys(DIODES);
    const d=keys[Math.floor(Math.random()*keys.length)];
    const vs=Math.round((3+Math.random()*10)*10)/10;
    const ifTarget=d==='led'?(0.005+Math.random()*0.013):(0.05+Math.random()*0.4);
    const vExact=vFwdAt(DIODES[d],ifTarget);
    const rExact=(vs-vExact)/ifTarget;
    PRED={d:d,vs:vs,ifTarget:ifTarget,target:{r:rExact,v:vExact}};
    cat='cond';dsel=d;Vs=vs;
  }else if(predType==='B'){
    const useProt=Math.random()<0.5;
    cat=useProt?'prot':'cond';
    const vs=Math.round((2+Math.random()*13)*10)/10;
    const rIdx=Math.floor(Math.random()*RVALS.length);
    let target;
    if(cat==='cond'){
      const keys=Object.keys(DIODES);dsel=keys[Math.floor(Math.random()*keys.length)];
      target=solveFwd(DIODES[dsel],vs,RVALS[rIdx]);
    }else{
      const keys=Object.keys(CLAMPS);csel=keys[Math.floor(Math.random()*keys.length)];
      target=csel==='zen'?solveClamp(function(v){return izOfV(CLAMPS.zen,v);},vs,RVALS[rIdx]):solveClamp(function(v){return iTvsOfV(CLAMPS.tvs,v);},vs,RVALS[rIdx]);
    }
    PRED={vs:vs,rIdx:rIdx,target:{v:target.v,i:target.i}};
    Vs=vs;Ridx=rIdx;
  }else{
    cat='prot';
    const keys=Object.keys(CLAMPS);const c=keys[Math.floor(Math.random()*keys.length)];csel=c;
    const rIdx=Math.floor(Math.random()*RVALS.length);
    const vs=Math.round((6+Math.random()*9)*10)/10;
    const vmax=Math.round((6.5+Math.random()*3)*10)/10;
    const iOfV=c==='zen'?function(v){return izOfV(CLAMPS.zen,v);}:function(v){return iTvsOfV(CLAMPS.tvs,v);};
    const r=solveClamp(iOfV,vs,RVALS[rIdx]);
    PRED={c:c,vs:vs,rIdx:rIdx,vmax:vmax,target:{v:r.v,pass:r.v<=vmax}};
    Vs=vs;Ridx=rIdx;
  }
  predSolved=false;predRevealed=false;
  el('sVs').value=Vs;el('vVs').textContent=Vs.toFixed(1)+' V';
  el('predR').value='';el('predV').value='';el('predI').value='';
  el('predSi').classList.remove('right','wrong');el('predNo').classList.remove('right','wrong');
  el('predResult').innerHTML='';
  el('predAsk').textContent=predAskText();
  syncCtrlBtns();
}
function checkPredice(){
  let okAll=false,html='';
  const chip=function(ok){return ok?'✔':'✘';};
  if(predType==='A'){
    const rIn=parseFloat(el('predR').value);
    const okR=Number.isFinite(rIn)&&Math.abs(rIn-PRED.target.r)<=0.25*PRED.target.r+10;
    html='<div>'+chip(okR)+' R: tu valor '+(Number.isFinite(rIn)?rIn.toFixed(0):'—')+' Ω · R exacto (con Vf real a ese If) '+PRED.target.r.toFixed(0)+' Ω</div>'+
         '<div style="color:#8FB3AC;font-size:11px">El Vf de datasheet es un típico; por eso se acepta un margen de ±25% en R.</div>';
    okAll=okR;
  }else if(predType==='B'){
    const vIn=parseFloat(el('predV').value);
    const iIn=parseFloat(el('predI').value)/1000;
    const okV=Number.isFinite(vIn)&&Math.abs(vIn-PRED.target.v)<=0.08*PRED.target.v+0.05;
    const okI=Number.isFinite(iIn)&&Math.abs(iIn-PRED.target.i)<=0.15*PRED.target.i+0.002;
    html='<div>'+chip(okV)+' V: tu valor '+(Number.isFinite(vIn)?vIn.toFixed(2):'—')+' V · real '+PRED.target.v.toFixed(2)+' V</div>'+
         '<div>'+chip(okI)+' I: tu valor '+(Number.isFinite(iIn)?(iIn*1000).toFixed(1):'—')+' mA · real '+fmtI(PRED.target.i)+'</div>';
    okAll=okV&&okI;
  }else{
    const said=predAnswerC;
    const ok=(said===PRED.target.pass);
    html='<div>'+chip(ok)+' Tu respuesta: '+(said===true?'SÍ protege':said===false?'NO protege':'—')+' · real: V(nodo) = '+PRED.target.v.toFixed(2)+' V, Vmax = '+PRED.vmax.toFixed(1)+' V → '+(PRED.target.pass?'SÍ protege':'NO protege')+'</div>';
    okAll=ok;
  }
  el('predResult').innerHTML=html;
  predSolved=okAll;predRevealed=true;solved=okAll;
  synth.beep(okAll?880:220,.08,.06);
  refreshAll();
}
let predAnswerC=null;

/* ---------- 12) Reto de diseño de protección ---------- */
function newReto(){
  const keys=Object.keys(CLAMPS);
  const rsLine=RVALS[1+Math.floor(Math.random()*(RVALS.length-2))];
  const vs=Math.round((8+Math.random()*7)*10)/10;
  const vmax=Math.round((6.6+Math.random()*2.2)*10)/10;
  RETO={rsLine:rsLine,vs:vs,vmax:vmax};
  csel=keys[0];Ridx=RVALS.indexOf(rsLine);Vs=vs;
  retoSolved=false;
  el('retoResult').innerHTML='';
  el('retoAsk').textContent='';
}
function checkReto(){
  const c=curClamp();
  const iOfV=csel==='zen'?function(v){return izOfV(c,v);}:function(v){return iTvsOfV(c,v);};
  const r=solveClamp(iOfV,RETO.vs,curR());
  const okV=r.v<=RETO.vmax;
  const okI=csel==='zen'?(r.i>=c.izk&&r.i<=c.izm):true;
  const chip=function(ok){return ok?'✔':'✘';};
  let html='<div>'+chip(okV)+' Voltaje del nodo: '+r.v.toFixed(2)+' V ≤ Vmax = '+RETO.vmax.toFixed(1)+' V</div>';
  if(csel==='zen')html+='<div>'+chip(okI)+' Corriente del zener: '+fmtI(r.i)+' dentro de [IZK='+fmtI(c.izk)+', IZM='+fmtI(c.izm)+']</div>';
  else html+='<div style="color:#8FB3AC;font-size:11px">TVS: IPP nominal ('+c.ipp.toFixed(1)+' A) muy por encima de la corriente de este circuito — no hay riesgo de exceder su capacidad de pulso aquí.</div>';
  el('retoResult').innerHTML=html;
  retoSolved=okV&&okI;solved=retoSolved;
  synth.beep(retoSolved?880:220,.08,.06);
  refreshAll();
}

/* ---------- 13) Quiz ---------- */
let QUIZ={};
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Por qué un LED necesita un resistor limitador en serie y un rectificador de silicio, en un circuito bien diseñado, casi siempre también?',
      opciones:[
        {t:'Porque su corriente crece muy rápido (exponencialmente) con pequeños cambios de voltaje, sin el resistor no hay forma de fijar el punto de operación',ok:true,why:'Correcto: sin un elemento que limite corriente, un voltaje de fuente fijo sobre un diodo sin resistencia serie llevaría a una corriente descontrolada.'},
        {t:'Porque el LED no conduce corriente sin un resistor',ok:false,why:'No — el LED sí conduce sin resistor, y eso es justamente el problema: conduce demasiado.'},
        {t:'Porque el resistor cambia el color de la luz del LED',ok:false,why:'No — el resistor no afecta el color; solo limita la corriente (y por tanto el brillo).'}
      ]
    },
    predice:{
      pregunta:'Al comparar Schottky vs. silicio a la misma corriente, ¿qué familia tiene menor caída de voltaje directo Vf?',
      opciones:[
        {t:'Schottky — su unión metal-semiconductor tiene una barrera de potencial menor que una unión P-N de silicio',ok:true,why:'Correcto: por eso el Schottky se elige quan la prioridad es minimizar pérdidas de conducción (p.ej. rectificación de baja caída).'},
        {t:'Silicio — siempre tiene menor Vf que cualquier Schottky',ok:false,why:'No — es al revés: el silicio típicamente cae ≈0.9-1.1 V a 1 A, más que el Schottky (≈0.55-0.60 V).'},
        {t:'Son iguales — la familia de diodo no afecta Vf',ok:false,why:'No — Vf depende fuertemente de la tecnología de unión del diodo.'}
      ]
    },
    barrido:{
      pregunta:'En el barrido comparativo de protección (Zener vs. TVS), ¿por qué la curva del TVS es más "vertical" cerca de la ruptura que la del zener?',
      opciones:[
        {t:'Porque su resistencia dinámica (Rdyn) es mucho menor que la impedancia dinámica del zener (Zzt)',ok:true,why:'Correcto: un Rdyn pequeño significa que el voltaje casi no sube aunque la corriente crezca mucho — ideal para clampear picos rápidos de alta corriente.'},
        {t:'Porque el TVS no tiene resistencia dinámica',ok:false,why:'No — sí tiene (Rdyn≈0.064 Ω en este dispositivo), solo que es mucho menor que la del zener.'},
        {t:'Porque el TVS se satura a una corriente fija',ok:false,why:'No — en este circuito el TVS no llega ni cerca de su límite de corriente de pulso (IPP).'}
      ]
    },
    reto:{
      pregunta:'¿Por qué la condición de diseño exige VRWM del dispositivo protector por debajo del voltaje normal de operación del circuito, pero VBR(mín) por arriba?',
      opciones:[
        {t:'Para que el dispositivo no conduzca (ni tenga fuga relevante) en operación normal, pero sí limite el voltaje cuando llegue un transitorio por encima de lo normal',ok:true,why:'Correcto: VRWM marca el techo seguro de "no hacer nada"; VBR marca el piso donde empieza a actuar como protección.'},
        {t:'Para que el dispositivo se destruya de forma segura ante cualquier transitorio',ok:false,why:'No — el objetivo es justo lo contrario: que el dispositivo sobreviva y proteja, no que se destruya.'},
        {t:'Es una convención arbitraria sin relación con el voltaje normal del circuito',ok:false,why:'No es arbitrario — está directamente ligado al voltaje normal del circuito que se protege.'}
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
  if(act==='src3d')showToast('Fuente Vs = '+Vs.toFixed(1)+' V (ideal, sin resistencia interna).');
  else if(act==='rs3d')showToast('Rs = '+fmtR(curR())+'.');
  else if(act==='dut3d')showToast(curDut().name+'.');
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
    selCat('cond');selDevice('led');
    showToast('Bienvenido: LED, Schottky y silicio son tres familias de diodo con Vf muy distinto.');
    await sleep(2400);
    selDevice('sch');showToast('Schottky: caída directa mucho menor que un LED o un rectificador de silicio.');
    await sleep(2400);
    toggleCat();
    showToast('Cambiamos a Protección: ahora el dispositivo va en shunt (paralelo) para clampear el nodo.');
    await sleep(2600);
    Vs=12;el('sVs').value=12;el('vVs').textContent='12.0 V';onChange();
    showToast('Con Vs por encima de la ruptura, el zener/TVS "clava" el voltaje del nodo cerca de su VZ/VBR.');
    await sleep(2600);
    setMode('barrido');
    toggleCompare();
    showToast('Modo Barrido con comparación: superpone las curvas de zener y TVS para ver quién clampea más "duro".');
    await sleep(2400);
    await runSweep();
    await sleep(800);
    setMode('reto');
    showToast('Reto: diseña la protección para que el nodo no supere el voltaje máximo del componente aguas abajo.');
  }finally{
    autoRunning=false;b.disabled=false;b.textContent='🚀 Tour guiado';
  }
}

Object.keys(DIODES).forEach(function(k){el('d_'+k).onclick=function(){selDevice(k);};});
Object.keys(CLAMPS).forEach(function(k){el('c_'+k).onclick=function(){selClamp(k);};});
RVALS.forEach(function(v,i){el('r_'+i).onclick=function(){selR(i);};});
el('catCond').onclick=function(){selCat('cond');};
el('catProt').onclick=function(){selCat('prot');};
el('sVs').addEventListener('input',function(){
  if(mode==='predice'){this.value=Vs;return;}
  Vs=parseFloat(this.value);el('vVs').textContent=Vs.toFixed(1)+' V';onChange();
});
el('m_explora').onclick=function(){setMode('explora');};
el('m_predice').onclick=function(){setMode('predice');};
el('m_barrido').onclick=function(){setMode('barrido');};
el('m_reto').onclick=function(){setMode('reto');};
el('btnPred').onclick=checkPredice;
el('btnPredNew').onclick=function(){genPredice();refreshAll();};
el('predSi').onclick=function(){predAnswerC=true;el('predSi').classList.add('on');el('predNo').classList.remove('on');};
el('predNo').onclick=function(){predAnswerC=false;el('predNo').classList.add('on');el('predSi').classList.remove('on');};
el('btnSweep').onclick=runSweep;
el('btnCompare').onclick=toggleCompare;
el('btnReto').onclick=checkReto;
el('btnRetoNew').onclick=function(){newReto();refreshAll();};

S.setAnimate(function(){});
newReto();
buildQuiz();
syncCtrlBtns();
refreshBenchSel();
S.start();
setMode('explora');

window.__labDebug={
  state:function(){return {cat:cat,dsel:dsel,csel:csel,Ridx:Ridx,Vs:Vs,mode:mode,barCompare:barCompare};},
  res:function(){return RES;},
  pred:function(){return PRED?Object.assign({},PRED,{type:predType}):null;},
  reto:function(){return RETO;},
  sweep:function(){return SWEEP.slice();},
  iFwd:iFwd,vFwdAt:vFwdAt,izOfV:izOfV,iTvsOfV:iTvsOfV,solveFwd:solveFwd,solveClamp:solveClamp,
  setCat:selCat,setDevice:selDevice,setClamp:selClamp,setR:selR,
  setVs:function(v){if(mode==='predice')return;Vs=v;el('sVs').value=v;el('vVs').textContent=v.toFixed(1)+' V';onChange();},
  mode:function(){return mode;},setMode:setMode,
  checkPredice:checkPredice,newPredice:genPredice,setPredAnswerC:function(v){predAnswerC=v;},
  checkReto:checkReto,newReto:newReto,
  sweepV:runSweep,toggleCompare:toggleCompare,boardClick:boardClick,
};
