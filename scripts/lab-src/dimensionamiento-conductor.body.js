// Dimensionamiento de conductores y protecciones de un circuito derivado (monofásico 2 hilos, 127 V).
// Física (verificada node -e):
//   Caída de tensión (ida y vuelta, factor 2):  e = 2·ρ·L·I / S   [V]
//     ρ = 0.0175 Ω·mm²/m  (cobre a temperatura de operación; conductividad ≈57 m/(Ω·mm²), tradición
//        Enríquez Harper para cálculo de caída — el cálculo debe usar R a temperatura de trabajo, no a 20 °C).
//     L = longitud de UN sentido (m), I = corriente (A), S = sección (mm²).  V_carga = V − e.
//   %e = e/V·100.  Límite de circuito derivado (branch) = 3 %.
//   Dos criterios que TODO conductor debe cumplir simultáneamente:
//     (1) AMPACIDAD:  ampacidad_usable ≥ I   (el conductor no se sobrecalienta)
//     (2) CAÍDA:      %e ≤ 3 %               (la carga recibe tensión suficiente)
//   El calibre correcto = el MÍNIMO del catálogo que cumple AMBOS. En corridas largas la CAÍDA
//   domina y obliga a subir varios calibres por encima de lo que la ampacidad sola pediría (trampa clásica).
//   Ampacidad USABLE = valor de tabla 310-15(b)(16) a 75 °C, salvo 14/12/10 AWG limitados por el
//   Art. 240.4(D) (protección máx.) a 15/20/30 A: por eso un circuito de 20 A usa calibre 12, no 14.
// Catálogo del Reto verificado (node -e): I ∈ {12,16,20,24,30,40} A, L ∈ {15,25,35,50,70,90} m → 36
//   escenarios, TODOS con solución en catálogo; en 30/36 (83 %) la caída obliga a subir calibre por
//   encima del que daría la ampacidad sola (la trampa falla); respuestas correctas AWG 14→2.
//   Ref: NOM-001-SEDE-2022 Art. 310 (ampacidad), Art. 240.4(D) (protección), Tabla 310-15(b)(16);
//        Enríquez Harper "El ABC de las instalaciones eléctricas"; NEC 310.16; verificación numérica propia.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[4.2,2.6,6.6],target:[0.2,1.0,0.2],bgTop:'#101410',bgBot:'#05060a',bloom:0.42,minD:3.2,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2200,Q:0.8});
const el=id=>document.getElementById(id);

// ===================== 2. FÍSICA =====================
const RHO=0.0175;        // Ω·mm²/m (cobre a T de operación)
const V=127;             // tensión nominal del circuito (V)
const VD_LIM=3;          // % máximo de caída en circuito derivado
// Catálogo de conductores de cobre THW.  S=sección (mm²), amp=ampacidad USABLE (A, ya con Art.240.4(D)),
// tabla=ampacidad de tabla 310-15(b)(16) a 75 °C (para la nota de honestidad).
const CAT=[
  {awg:'14',  S:2.08,  amp:15,  tabla:20},
  {awg:'12',  S:3.31,  amp:20,  tabla:25},
  {awg:'10',  S:5.26,  amp:30,  tabla:35},
  {awg:'8',   S:8.37,  amp:50,  tabla:50},
  {awg:'6',   S:13.3,  amp:65,  tabla:65},
  {awg:'4',   S:21.2,  amp:85,  tabla:85},
  {awg:'2',   S:33.6,  amp:115, tabla:115},
  {awg:'1/0', S:53.5,  amp:150, tabla:150},
  {awg:'2/0', S:67.4,  amp:175, tabla:175},
  {awg:'4/0', S:107.2, amp:230, tabla:230},
];
const I_STEPS=[12,16,20,24,30,40,50,60];         // corrientes de carga en Explora/Selección
const L_STEPS=[10,20,30,50,70,90,110];           // longitudes en Explora/Selección
const RETO_I=[12,16,20,24,30,40];                // catálogo del Reto (verificado)
const RETO_L=[15,25,35,50,70,90];

function vdVolts(S_,L,I){return 2*RHO*L*I/S_;}   // caída en volts
function vdPct(S_,L,I){return vdVolts(S_,L,I)/V*100;}
// evalúa un conductor idx para (I,L): cumplimiento de cada criterio
function evalCond(idx,I,L){
  const c=CAT[idx];
  const e=vdVolts(c.S,L,I), pe=e/V*100;
  return {idx,c,ampOk:c.amp>=I, pe, vdOk:pe<=VD_LIM, e, vload:V-e};
}
// mínimo calibre que cumple SOLO ampacidad, y el que cumple AMBOS
function selectMin(I,L){
  let byAmp=-1, byBoth=-1;
  for(let k=0;k<CAT.length;k++){
    if(byAmp<0 && CAT[k].amp>=I) byAmp=k;
    if(byBoth<0 && CAT[k].amp>=I && vdPct(CAT[k].S,L,I)<=VD_LIM) byBoth=k;
  }
  return {byAmp, byBoth};
}
function pickFrom(arr,exclude){if(arr.length<=1)return arr[0];let v=arr[Math.floor(Math.random()*arr.length)];while(v===exclude)v=arr[Math.floor(Math.random()*arr.length)];return v;}
function fmtA(v){return (Math.round(v*10)/10).toFixed(1)+' A';}
function fmtV(v){return (Math.round(v*10)/10).toFixed(1)+' V';}
function fmtPct(v){return (Math.round(v*100)/100).toFixed(2)+'%';}

// ===================== 3. ESTADO =====================
let mode='explora';               // explora | seleccion | reto
// Explora + Selección comparten I, L y el calibre elegido
let expI=20, expL=50, expIdx=1;   // idx en CAT (12 AWG por defecto)
// Reto — sorteado, calificado por selección exacta del calibre mínimo
let retoI=20, retoL=50, retoAns=0, retoPick=1, retoChecked=false, retoOk=false, retoMsg='';
let solved=false, autoRunning=false;
let QUIZ={};

function seedReto(){
  let I,L,sel;
  do{ I=pickFrom(RETO_I); L=pickFrom(RETO_L); sel=selectMin(I,L); }
  while(sel.byBoth<0);                         // garantiza solución en catálogo (siempre la hay)
  retoI=I; retoL=L; retoAns=sel.byBoth;
  retoPick=sel.byAmp>=0?sel.byAmp:0;          // el alumno arranca en el calibre "ampacidad-sola" (la trampa)
  retoChecked=false; retoOk=false; retoMsg='';
}
seedReto();

function curI(){return mode==='reto'?retoI:expI;}
function curL(){return mode==='reto'?retoL:expL;}
function curIdx(){return mode==='reto'?retoPick:expIdx;}
function curEval(){return evalCond(curIdx(),curI(),curL());}
function curSel(){return selectMin(curI(),curL());}

// ===================== 4. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
function plas(base){return std(base,0.35,0.08);}
const MAT={bench:brush(0x2f3330),frame:brush(0x24272a),leg:brush(0x141613),panel:brush(0x353b3f),load:brush(0x2c2622)};
const ACC='#4FB0AE';              // acento teal-cobre del lab
const COP='#C97C46';              // cobre
const OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A';

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const cv=document.createElement('canvas');cv.width=256;cv.height=64;
  const cx=cv.getContext('2d');
  cx.fillStyle='rgba(10,14,13,0.88)';cx.fillRect(0,0,256,64);
  cx.strokeStyle=color;cx.lineWidth=2;cx.strokeRect(1,1,254,62);
  cx.fillStyle='#F4EFEA';cx.font='bold 20px Outfit, sans-serif';cx.textAlign='center';cx.textBaseline='middle';
  cx.fillText(text,128,32);
  const tex=new THREE.CanvasTexture(cv);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));
  spr.position.copy(pos);spr.scale.set(scale||1.1,(scale||1.1)*0.28,1);spr.visible=false;spr.renderOrder=999;
  scene.add(spr);
  HOVER_LABELS.set(obj,spr);
  return spr;
}

// ===================== 5. PIZARRÓN =====================
const boardG=new THREE.Group();
boardG.position.set(-1.25,0,-0.95);boardG.rotation.y=0.2;
scene.add(boardG);
const frame=roundedBox(3.72,2.80,0.12,MAT.frame,0.06);
frame.position.set(0,1.85,0);
boardG.add(frame);
[-1.55,1.55].forEach(x=>{
  const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.85,16),MAT.leg);
  leg.position.set(x,0.9,0);boardG.add(leg);
});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2.58),new THREE.MeshBasicMaterial({map:bTex}));
board.position.set(0,1.85,0.065);
boardG.add(board);
frame.userData={title:'Pizarrón de selección',info:'Los dos criterios (ampacidad y caída de tensión) y el calibre mínimo que cumple ambos · toca para inspeccionar'};
addHoverLabel(frame,'Pizarrón de dimensionamiento',ACC,new THREE.Vector3(0,3.38,0.1).add(boardG.position),1.9);

function bg(c){
  c.fillStyle='#0d100f';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(79,176,174,0.05)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
}
// barra de criterio horizontal (valor vs límite)
function critBar(c,x,y,w,h,frac,ok,label,valTxt,limTxt){
  c.fillStyle='rgba(255,255,255,0.05)';c.fillRect(x,y,w,h);
  c.strokeStyle='rgba(255,255,255,0.15)';c.lineWidth=1;c.strokeRect(x,y,w,h);
  const f=Math.max(0,Math.min(1.3,frac));
  c.fillStyle=ok?'rgba(124,217,146,0.55)':'rgba(255,107,107,0.6)';
  c.fillRect(x,y,Math.min(w,w*f),h);
  // línea de límite (100%)
  c.strokeStyle=WARN_HEX;c.lineWidth=2;c.setLineDash([5,4]);
  c.beginPath();c.moveTo(x+w,y-4);c.lineTo(x+w,y+h+4);c.stroke();c.setLineDash([]);
  c.fillStyle='#C9C4BB';c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.fillText(label,x,y-10);
  c.fillStyle=ok?OK_HEX:BAD_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='right';c.fillText(valTxt,x+w-6,y+h-9);
  c.fillStyle=WARN_HEX;c.font='11px Outfit, sans-serif';c.textAlign='left';c.fillText('límite: '+limTxt,x+w+8,y+h/2+4);
}

function drawExplora(c,ev){
  const {c:cd,ampOk,pe,vdOk,vload}=ev, I=curI(), L=curL();
  c.fillStyle='#B9D9D7';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('DOS CRITERIOS QUE EL CONDUCTOR DEBE CUMPLIR',30,44);
  c.fillStyle='#7a8380';c.font='13px Outfit, sans-serif';
  c.fillText('Circuito derivado monofásico · V='+V+' V · I='+I+' A · L='+L+' m (un sentido) · e = 2·ρ·L·I / S',30,70);

  // Criterio 1: ampacidad
  critBar(c,30,150,520,42, I/cd.amp, ampOk,
    '① AMPACIDAD — ¿el conductor aguanta la corriente?  (I ≤ ampacidad)',
    I.toFixed(0)+' A de '+cd.amp+' A', cd.amp+' A');
  // Criterio 2: caída de tensión
  critBar(c,30,258,520,42, pe/VD_LIM, vdOk,
    '② CAÍDA DE TENSIÓN — ¿llega bastante tensión a la carga?  (%e ≤ 3%)',
    fmtPct(pe), '3.00%');

  // panel derecho: lecturas del conductor elegido
  const bx=620,by=120,bw=374,bh=430;
  c.fillStyle='rgba(79,176,174,0.06)';c.fillRect(bx,by,bw,bh);
  c.strokeStyle='rgba(79,176,174,0.22)';c.lineWidth=1;c.strokeRect(bx,by,bw,bh);
  c.fillStyle='#B9D9D7';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText('CONDUCTOR ELEGIDO: AWG '+cd.awg,bx+18,by+30);
  const rows=[
    ['Sección S',cd.S.toFixed(2)+' mm²','#C9C4BB'],
    ['Ampacidad usable',cd.amp+' A','#C9C4BB'],
    ['Corriente de carga I',I.toFixed(0)+' A','#C9C4BB'],
    ['Caída e = 2ρLI/S',fmtV(ev.e),'#C9C4BB'],
    ['Caída porcentual %e',fmtPct(pe),vdOk?OK_HEX:BAD_HEX],
    ['Tensión en la carga',fmtV(vload),vdOk?OK_HEX:BAD_HEX],
  ];
  c.font='13px Outfit, sans-serif';
  rows.forEach((r,i)=>{
    const yy=by+70+i*46;
    c.fillStyle='#8f9793';c.textAlign='left';c.font='13px Outfit, sans-serif';c.fillText(r[0],bx+18,yy);
    c.fillStyle=r[2];c.font='bold 17px Outfit, sans-serif';c.textAlign='right';c.fillText(r[1],bx+bw-16,yy+2);
    c.strokeStyle='rgba(79,176,174,0.10)';c.beginPath();c.moveTo(bx+14,yy+16);c.lineTo(bx+bw-14,yy+16);c.stroke();
  });

  // veredicto inferior
  const sel=curSel(), minC=CAT[sel.byBoth];
  const bothOk=ampOk&&vdOk;
  const isMin=curIdx()===sel.byBoth;
  let msg,col;
  if(!ampOk){msg='✗ FALLA AMPACIDAD — la corriente ('+I+' A) supera la ampacidad ('+cd.amp+' A): el cable se sobrecalienta. Sube de calibre.';col=BAD_HEX;}
  else if(!vdOk){msg='✗ FALLA CAÍDA — '+fmtPct(pe)+' > 3%: la carga recibe solo '+fmtV(vload)+'. La corrida es larga; necesitas AWG '+minC.awg+'.';col=BAD_HEX;}
  else if(!isMin){msg='✔ Cumple ambos, pero está SOBREDIMENSIONADO — el mínimo que basta es AWG '+minC.awg+' (más barato). El tuyo desperdicia cobre.';col=WARN_HEX;}
  else{msg='✔ ÓPTIMO — AWG '+cd.awg+' es el calibre MÍNIMO que cumple ampacidad Y caída ≤3%. Ni se sobrecalienta ni la carga pierde tensión.';col=OK_HEX;}
  c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(30,600,964,120);
  c.strokeStyle=col;c.lineWidth=2;c.strokeRect(30,600,964,120);
  c.fillStyle=col;c.font='bold 17px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,msg,50,634,920,24);
}

function drawSeleccion(c,ev){
  const I=curI(), L=curL(), sel=curSel();
  c.fillStyle='#B9D9D7';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('TABLA DE SELECCIÓN — ¿QUÉ CALIBRE CUMPLE AMBOS?',30,44);
  c.fillStyle='#7a8380';c.font='13px Outfit, sans-serif';
  c.fillText('Para I='+I+' A y L='+L+' m: cada calibre evaluado por ampacidad (I≤amp) y por caída (%e≤3%). El correcto = el más delgado que pasa ambos.',30,70);

  // encabezados
  const x0=40, colAwg=x0+10, colS=x0+150, colAmp=x0+290, colAmpChk=x0+430, colVd=x0+610, colVdChk=x0+780;
  const y0=110, rh=54;
  c.fillStyle='#8f9793';c.font='bold 13px Outfit, sans-serif';c.textAlign='left';
  c.fillText('AWG',colAwg,y0);c.fillText('S (mm²)',colS,y0);c.fillText('Ampac.',colAmp,y0);
  c.fillText('① I≤amp',colAmpChk,y0);c.fillText('%e (2ρLI/S)',colVd,y0);c.fillText('② %e≤3%',colVdChk,y0);
  c.strokeStyle='rgba(79,176,174,0.25)';c.beginPath();c.moveTo(x0,y0+8);c.lineTo(984,y0+8);c.stroke();

  CAT.forEach((cd,k)=>{
    const yy=y0+28+k*rh;
    const ampOk=cd.amp>=I, pe=vdPct(cd.S,L,I), vdOk=pe<=VD_LIM, both=ampOk&&vdOk;
    const isMin=k===sel.byBoth;
    if(isMin){c.fillStyle='rgba(124,217,146,0.14)';c.fillRect(x0,yy-24,944,rh-6);
      c.strokeStyle=OK_HEX;c.lineWidth=2;c.strokeRect(x0,yy-24,944,rh-6);}
    c.textAlign='left';
    c.fillStyle=both?'#F4EFEA':'#6f7773';c.font='bold 17px Outfit, sans-serif';c.fillText(cd.awg,colAwg,yy);
    c.fillStyle=both?'#C9C4BB':'#6f7773';c.font='14px Outfit, sans-serif';c.fillText(cd.S.toFixed(2),colS,yy);
    c.fillText(cd.amp+' A',colAmp,yy);
    c.fillStyle=ampOk?OK_HEX:BAD_HEX;c.font='bold 15px Outfit, sans-serif';c.fillText(ampOk?'✔':'✗',colAmpChk+18,yy);
    c.fillStyle=both?'#C9C4BB':(vdOk?'#8f9793':'#c98a8a');c.font='14px Outfit, sans-serif';c.fillText(fmtPct(pe),colVd,yy);
    c.fillStyle=vdOk?OK_HEX:BAD_HEX;c.font='bold 15px Outfit, sans-serif';c.fillText(vdOk?'✔':'✗',colVdChk+22,yy);
    if(isMin){c.fillStyle=OK_HEX;c.font='bold 12px Outfit, sans-serif';c.textAlign='left';c.fillText('◀ MÍNIMO CORRECTO',colVdChk+70,yy);}
  });

  // resumen inferior: contraste ampacidad-sola vs correcto
  const ay=y0+28+CAT.length*rh+8;
  const minC=CAT[sel.byBoth], ampC=sel.byAmp>=0?CAT[sel.byAmp]:null;
  const gap=ampC&&sel.byAmp!==sel.byBoth;
  c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(30,ay,964,88);
  c.strokeStyle=gap?WARN_HEX:ACC;c.lineWidth=2;c.strokeRect(30,ay,964,88);
  c.fillStyle=gap?WARN_HEX:'#B9D9D7';c.font='bold 15px Outfit, sans-serif';c.textAlign='left';
  if(gap){
    wrapText(c,'⚠ La ampacidad sola pediría AWG '+ampC.awg+' ('+fmtPct(vdPct(ampC.S,L,I))+' de caída → la carga quedaría a '+fmtV(V-vdVolts(ampC.S,L,I))+'). La CAÍDA obliga a subir hasta AWG '+minC.awg+'. En corridas largas la caída, no la ampacidad, decide el calibre.',48,ay+30,910,22);
  }else{
    wrapText(c,'✔ Aquí la ampacidad ya basta: AWG '+minC.awg+' cumple los dos criterios ('+fmtPct(vdPct(minC.S,L,I))+' de caída). La corrida es corta, así que la caída no obliga a subir. No siempre domina la longitud.',48,ay+30,910,22);
  }
}

function drawReto(c,ev){
  const I=curI(), L=curL(), cd=ev.c;
  c.fillStyle='#B9D9D7';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('RETO — ELIGE EL CALIBRE MÍNIMO CORRECTO',30,44);
  c.fillStyle='#7a8380';c.font='13px Outfit, sans-serif';
  c.fillText('Circuito de I='+I+' A, longitud L='+L+' m, V='+V+' V. Elige el conductor MÁS DELGADO que cumpla ampacidad Y caída ≤3%.',30,70);

  // criterios del calibre ACTUALMENTE elegido (sin decir si es el mínimo hasta comprobar)
  critBar(c,30,150,520,42, I/cd.amp, cd.amp>=I,
    '① AMPACIDAD (I ≤ ampacidad)', I+' A de '+cd.amp+' A', cd.amp+' A');
  critBar(c,30,258,520,42, ev.pe/VD_LIM, ev.vdOk,
    '② CAÍDA (%e ≤ 3%)', fmtPct(ev.pe), '3.00%');

  const bx=620,by=120,bw=374,bh=300;
  c.fillStyle='rgba(79,176,174,0.06)';c.fillRect(bx,by,bw,bh);
  c.strokeStyle='rgba(79,176,174,0.22)';c.strokeRect(bx,by,bw,bh);
  c.fillStyle='#B9D9D7';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText('DATOS DEL CIRCUITO',bx+18,by+32);
  [['Tensión V',V+' V'],['Corriente I',I+' A'],['Longitud L (un sentido)',L+' m'],['Límite de caída',VD_LIM+' %'],['Tu calibre',('AWG '+cd.awg)]].forEach((r,i)=>{
    const yy=by+72+i*44;
    c.fillStyle='#8f9793';c.font='14px Outfit, sans-serif';c.textAlign='left';c.fillText(r[0],bx+18,yy);
    c.fillStyle='#F4EFEA';c.font='bold 17px Outfit, sans-serif';c.textAlign='right';c.fillText(r[1],bx+bw-16,yy);
  });

  // veredicto
  if(retoChecked){
    const ansC=CAT[retoAns];
    c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(30,470,964,250);
    c.strokeStyle=retoOk?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(30,470,964,250);
    c.fillStyle=retoOk?OK_HEX:BAD_HEX;c.font='bold 18px Outfit, sans-serif';c.textAlign='left';
    c.fillText(retoOk?'✔ CORRECTO':'✗ INCORRECTO',48,504);
    c.fillStyle='#C9C4BB';c.font='15px Outfit, sans-serif';
    wrapText(c,'El calibre mínimo correcto es AWG '+ansC.awg+' (S='+ansC.S+' mm², caída '+fmtPct(vdPct(ansC.S,L,I))+', ampacidad '+ansC.amp+' A ≥ '+I+' A).',48,536,920,22);
    c.fillStyle='#8f9793';c.font='14px Outfit, sans-serif';
    wrapText(c,retoMsgLong(),48,600,920,22);
  }else{
    c.fillStyle='#7a8380';c.font='14px Outfit, sans-serif';c.textAlign='left';
    c.fillText('Usa los botones de calibre para elegir y pulsa "Comprobar selección".',30,540);
    c.fillStyle=WARN_HEX;c.font='13px Outfit, sans-serif';
    c.fillText('Pista: si la corrida es larga, la ampacidad NO basta — revisa la caída antes de decidir.',30,566);
  }
}
function retoMsgLong(){
  const I=retoI,L=retoL,pick=CAT[retoPick],ans=CAT[retoAns],sel=selectMin(I,L);
  if(retoOk) return 'Con L='+L+' m la caída fue el criterio que decidió; elegiste el calibre justo, sin sobrecoste de cobre.';
  if(retoPick<retoAns){
    const pe=vdPct(pick.S,L,I);
    if(pick.amp<I) return 'Tu AWG '+pick.awg+' ni siquiera aguanta la corriente (ampacidad '+pick.amp+' A < '+I+' A). Además la caída sería '+fmtPct(pe)+'.';
    return 'Tu AWG '+pick.awg+' aguanta la corriente (ampacidad OK), pero la caída es '+fmtPct(pe)+' > 3%: la carga quedaría a '+fmtV(V-vdVolts(pick.S,L,I))+'. Esa es la trampa de dimensionar solo por ampacidad.';
  }
  return 'Tu AWG '+pick.awg+' cumple, pero está sobredimensionado: AWG '+ans.awg+' ya bastaba y cuesta menos cobre. El objetivo es el MÍNIMO que cumple ambos.';
}

function wrapText(c,text,x,y,maxW,lh){
  const words=text.split(' ');let line='',yy=y;
  for(const w of words){
    const test=line+w+' ';
    if(c.measureText(test).width>maxW && line){c.fillText(line,x,yy);line=w+' ';yy+=lh;}
    else line=test;
  }
  c.fillText(line,x,yy);
}

function drawBoard(){
  const c=bCv.getContext('2d');
  bg(c);
  const ev=curEval();
  if(mode==='seleccion')drawSeleccion(c,ev);
  else if(mode==='reto')drawReto(c,ev);
  else drawExplora(c,ev);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='seleccion')showToast('📋 Cada fila es un calibre. La columna ① marca si su ampacidad aguanta la corriente; la ② si su caída de tensión queda bajo 3%. El calibre correcto es el más delgado (más arriba) con ✔ en AMBAS.');
  else if(mode==='reto')showToast('🎯 Ajusta el calibre con los botones y observa las dos barras: ambas deben quedar dentro del límite (línea punteada). Busca el calibre más delgado que lo logre.');
  else showToast('📊 Barra ①: corriente contra ampacidad del cable. Barra ②: caída de tensión contra el 3% permitido. La línea punteada ámbar es el límite: si la barra la rebasa (se pone roja), ese criterio falla.');
}

// ===================== 6. ESCENA 3D: TABLERO → CORRIDA → CARGA =====================
const bench=roundedBox(3.4,0.5,1.7,MAT.bench,0.05);
bench.position.set(1.6,0.25,0.6);
scene.add(bench);
bench.userData={title:'Banco del circuito derivado',info:'Tablero con interruptor → corrida de 2 conductores → carga'};

// tablero (panel) con interruptor a la izquierda
const panel=roundedBox(0.5,0.9,0.6,MAT.panel,0.05);
panel.position.set(0.35,0.98,0.6);scene.add(panel);
panel.userData={title:'Tablero e interruptor termomagnético',info:'La protección (breaker) debe ser ≥ carga y ≤ el límite del conductor (Art. 240.4). Aquí V='+V+' V.'};
addHoverLabel(panel,'Tablero + breaker',ACC,new THREE.Vector3(0.35,1.6,0.6),1.1);
const breaker=roundedBox(0.14,0.22,0.08,brush(0x1a1c1b),0.02);
breaker.position.set(0.35,1.15,0.92);scene.add(breaker);

// carga a la derecha (motor / tablero de utilización) con voltímetro
const load=roundedBox(0.55,0.7,0.6,MAT.load,0.05);
load.position.set(3.0,0.9,0.6);scene.add(load);
load.userData={title:'Carga (utilización)',info:'Recibe V_carga = V − e. Si la caída es alta, la carga trabaja con baja tensión (motores calientan, lámparas parpadean).'};
addHoverLabel(load,'Carga',WARN_HEX,new THREE.Vector3(3.0,1.42,0.6),0.9);

// voltímetro en la carga (lectura digital)
const vmCv=document.createElement('canvas');vmCv.width=256;vmCv.height=140;
const vmTex=new THREE.CanvasTexture(vmCv);
const vmScreen=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.23),new THREE.MeshBasicMaterial({map:vmTex,transparent:true}));
vmScreen.position.set(3.0,1.02,0.92);scene.add(vmScreen);
vmScreen.userData={title:'Voltímetro en la carga',info:'Mide la tensión que realmente llega tras la caída del cable.'};
function drawVM(){
  const c=vmCv.getContext('2d'),ev=curEval();
  c.fillStyle='#0a0d0c';c.fillRect(0,0,256,140);
  c.strokeStyle=ev.vdOk?OK_HEX:BAD_HEX;c.lineWidth=3;c.strokeRect(3,3,250,134);
  c.fillStyle='#7a8380';c.font='bold 16px Outfit, sans-serif';c.textAlign='center';c.fillText('V EN LA CARGA',128,28);
  c.fillStyle=ev.vdOk?OK_HEX:BAD_HEX;c.font='bold 46px Outfit, monospace';c.fillText(fmtV(ev.vload),128,80);
  c.fillStyle='#5a625e';c.font='13px Outfit, sans-serif';c.fillText('caída '+fmtPct(ev.pe)+' (máx 3%)',128,110);
  vmTex.needsUpdate=true;
}

// dos conductores paralelos (ida arriba, retorno abajo) de tablero a carga; el radio ∝ calibre
const wireOutA=new THREE.Vector3(0.6,1.10,0.5), wireOutB=new THREE.Vector3(2.72,1.10,0.5);
const wireRetA=new THREE.Vector3(0.6,0.78,0.72), wireRetB=new THREE.Vector3(2.72,0.78,0.72);
const copMat=new THREE.MeshStandardMaterial({color:0xC97C46,roughness:0.42,metalness:0.55,emissive:0x000000,emissiveIntensity:0});
const copMatR=new THREE.MeshStandardMaterial({color:0x9a9a9a,roughness:0.5,metalness:0.4,emissive:0x000000,emissiveIntensity:0});
function tubeBetween(a,b,radius,mat){
  const dir=new THREE.Vector3().subVectors(b,a),len=dir.length();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,len,12),mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());
  return m;
}
let wireOut=tubeBetween(wireOutA,wireOutB,0.03,copMat);
let wireRet=tubeBetween(wireRetA,wireRetB,0.03,copMatR);
scene.add(wireOut);scene.add(wireRet);
wireOut.userData={title:'Conductor de fase (ida)',info:'Su grosor crece con el calibre. La corriente lo calienta si supera la ampacidad.'};
wireRet.userData={title:'Conductor de retorno (neutro)',info:'La corriente va y vuelve: por eso la caída lleva factor 2 (e=2ρLI/S).'};
// etiqueta de longitud
const lenLabel=addHoverLabel(wireOut,'L',ACC,new THREE.Vector3(1.66,1.32,0.5),0.9);

function gaugeRadius(idx){return 0.014+0.055*(idx/(CAT.length-1));}  // grosor visual ∝ calibre
function rebuildWires(){
  const r=gaugeRadius(curIdx());
  scene.remove(wireOut);scene.remove(wireRet);
  wireOut=tubeBetween(wireOutA,wireOutB,r,copMat);
  wireRet=tubeBetween(wireRetA,wireRetB,r,copMatR);
  wireOut.userData={title:'Conductor de fase (ida)',info:'Su grosor crece con el calibre. La corriente lo calienta si supera la ampacidad.'};
  wireRet.userData={title:'Conductor de retorno (neutro)',info:'La corriente va y vuelve: por eso la caída lleva factor 2 (e=2ρLI/S).'};
  scene.add(wireOut);scene.add(wireRet);
  HOVER_LABELS.set(wireOut,lenLabel);
}
function refreshWireGlow(){
  const ev=curEval();
  const over=ev.c.amp>0?curI()/ev.c.amp:0;                 // >1 = sobrecarga
  const heat=Math.max(0,Math.min(1,(over-0.7)/0.6));       // empieza a calentar cerca del límite
  copMat.emissive.setHex(0xff3b1a);copMat.emissiveIntensity=heat*1.1;
  // brillo de la carga ∝ tensión que le llega
  const litf=Math.max(0,Math.min(1,(ev.vload-V*0.85)/(V*0.15)));
  load.material.emissive.setHex(0xE9C46A);load.material.emissiveIntensity=0.06+0.5*litf;
}

// ===================== 7. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos (D1) · Instalaciones · Dimensionamiento</div>
  <h2>Dimensionamiento de Conductores y Protecciones</h2>
  <p>Elegir el calibre de un cable no es solo "que aguante la corriente". Un conductor de un circuito
  derivado debe cumplir <b>dos criterios a la vez</b>: (1) su <b>ampacidad</b> —la corriente máxima que
  soporta sin sobrecalentarse— debe ser mayor o igual que la corriente de la carga; y (2) la <b>caída de
  tensión</b> a lo largo de la corrida debe quedar por debajo del <b>3 %</b> para un circuito derivado,
  de modo que a la carga le llegue tensión suficiente. La caída se calcula con
  <b>e = 2·ρ·L·I / S</b> (el factor 2 es porque la corriente va y regresa por dos conductores). El calibre
  correcto es el <b>más delgado</b> que cumple ambos criterios: ni sobrecalentado ni con la carga a media
  tensión, y sin desperdiciar cobre. En corridas <b>largas</b>, la caída manda: obliga a un cable mucho más
  grueso del que la ampacidad sola pediría. La protección (breaker) debe además ser ≥ carga y ≤ el límite
  del conductor (Art. 240.4).</p>
  <div class="formula">e = 2·ρ·L·I / S · %e = e/V·100 ≤ 3% · ρ_Cu ≈ 0.0175 Ω·mm²/m · V_carga = V − e · calibre = mín(cumple ① ampacidad Y ② caída)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#7CD992"></span>Criterio cumplido</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Criterio incumplido</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Límite (3% / ampacidad)</div>
    <div class="li"><span class="dot" style="background:#C97C46"></span>Conductor de cobre</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la selección de calibre de un circuito derivado monofásico de 2 hilos por los dos criterios simultáneos —ampacidad (I ≤ ampacidad de tabla 310-15(b)(16) a 75 °C, con el tope de protección del Art. 240.4(D) para 14/12/10 AWG = 15/20/30 A) y caída de tensión e=2ρLI/S con límite del 3 %— sobre un catálogo real de conductores de cobre THW (14 AWG a 4/0). Muestra por qué en corridas largas la caída, no la ampacidad, decide el calibre (verificado: 30/36 escenarios del Reto). Calcula la tensión que llega a la carga (V−e).</div>
    <div class="fl no"><b>NO modela:</b> el factor de 125 % para cargas continuas (Art. 210.19/210.20); factores de corrección por temperatura ambiente y por agrupamiento de conductores en un mismo tubo (Art. 310.15(B)); sistemas trifásicos (usarían e=√3·ρLI/S) ni la reactancia del cable (solo resistencia, válido en calibres pequeños/medios y FP≈1); la variación de la resistividad del cobre con la temperatura real de operación (se usa ρ fijo = 0.0175 Ω·mm²/m); calibres en kcmil mayores a 4/0; conductores de aluminio.</div>
  </div>
  <div class="src">Ref: NOM-001-SEDE-2022 Art. 310 (ampacidad), Art. 240.4(D) (protección), Tabla 310-15(b)(16) · Enríquez Harper · NEC 310.16 · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Dimensionamiento · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_seleccion">📋 Selección</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Reto de selección</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar selección</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nuevo escenario</button>
  </div>`;

// ===================== 8. TOASTS =====================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3800);
}

// ===================== 9. MODOS Y CONTROLES =====================
const MODE_META={
  explora:{nombre:'Explora',cam:[[4.2,2.6,6.6],[0.2,1.0,0.2]],mision:'Fija la corriente y la longitud, cambia el calibre y observa las DOS barras. Busca el calibre más delgado con ambas en verde: ese es el óptimo.'},
  seleccion:{nombre:'Selección',cam:[[4.0,2.5,6.4],[0.1,1.05,0.1]],mision:'La tabla evalúa TODOS los calibres para la misma corriente y longitud. Ve cómo la caída (columna ②) descarta los cables delgados en corridas largas.'},
  reto:{nombre:'Reto',cam:[[3.4,2.2,5.4],[1.6,0.95,0.5]],mision:'Circuito sorteado. Elige el calibre MÍNIMO que cumple ampacidad Y caída ≤3%. Cuidado con la trampa de mirar solo la ampacidad.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function stepBtns(items,dataAttr,fmt){return items.map(it=>`<button class="b sm ${it.on?'on':''}" data-${dataAttr}="${it.v}">${fmt(it)}</button>`).join('');}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';
  let html='';
  if(mode==='reto'){
    html+=lbl('Datos (fijos):')+
      `<button class="b sm" data-lock="1" style="cursor:default">I=${retoI} A</button>`+
      `<button class="b sm" data-lock="1" style="cursor:default">L=${retoL} m</button>`+
      `<button class="b sm" data-lock="1" style="cursor:default">V=${V} V</button>`;
    html+=lbl('Elige calibre AWG:')+CAT.map((cd,k)=>`<button class="b sm ${k===retoPick?'on':''}" data-gr="${k}">${cd.awg}</button>`).join('');
    bar.innerHTML=html;
    bar.querySelectorAll('[data-gr]').forEach(b=>b.onclick=()=>{
      if(autoRunning)return;retoPick=parseInt(b.dataset.gr,10);
      retoChecked=false;retoOk=false;retoMsg='';synth.beep(600,0.05,0.04);afterEdit();
    });
    return;
  }
  html+=lbl('Corriente I (A):')+stepBtns(I_STEPS.map(v=>({v,on:v===expI})),'ci',it=>it.v);
  html+=lbl('Longitud L (m):')+stepBtns(L_STEPS.map(v=>({v,on:v===expL})),'cl',it=>it.v);
  html+=lbl('Calibre AWG:')+CAT.map((cd,k)=>`<button class="b sm ${k===expIdx?'on':''}" data-gx="${k}">${cd.awg}</button>`).join('');
  bar.innerHTML=html;
  bar.querySelectorAll('[data-ci]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expI=parseFloat(b.dataset.ci);synth.beep(640,0.05,0.04);afterEdit();});
  bar.querySelectorAll('[data-cl]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expL=parseFloat(b.dataset.cl);synth.beep(600,0.05,0.04);afterEdit();});
  bar.querySelectorAll('[data-gx]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expIdx=parseInt(b.dataset.gx,10);synth.beep(680,0.05,0.04);afterEdit();});
}

function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='reto'){box.style.display='none';return;}
  box.style.display='block';
  box.innerHTML=`Circuito: <b>I=${retoI} A</b>, <b>L=${retoL} m</b>, <b>V=${V} V</b>. Elige el conductor de cobre más delgado que cumpla ampacidad (I≤amp) <b>y</b> caída ≤3%.`;
}

function setMode(k){
  mode=k;
  ['explora','seleccion','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('retoTitle').style.display=k==='reto'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  if(k==='reto')updateRetoSpec();
  buildControls();updateScenarioInfo();
  solved=false;
  clearDx();buildQuiz();refreshQuestion();
  const cam=MODE_META[k].cam;S.moveTo(cam[0],cam[1]);
  refreshAll();
}
function afterEdit(){buildControls();updateScenarioInfo();refreshAll();}

function newSignal(){
  if(mode==='reto'){
    seedReto();updateRetoSpec();afterEdit();solved=false;
    showToast('🔀 Nuevo circuito: I='+retoI+' A, L='+retoL+' m. Elige el calibre mínimo correcto.');
  }else{
    expI=pickFrom(I_STEPS,expI);expL=pickFrom(L_STEPS,expL);
    afterEdit();showToast('🔀 Nuevo caso: I='+expI+' A, L='+expL+' m. Prueba calibres y observa las dos barras.');
  }
  synth.beep(520,0.08,0.05);
}

// ===================== 10. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele'),ev=curEval(),sel=curSel();
  let html=
    teleRow('Conductor',('AWG '+ev.c.awg)+' · '+ev.c.S.toFixed(2)+' mm²')+
    teleRow('① Ampacidad',ev.c.amp+' A vs I='+curI()+' A',ev.ampOk?'good':'warn')+
    teleRow('② Caída %e',fmtPct(ev.pe)+' (máx 3%)',ev.vdOk?'good':'warn')+
    teleRow('Tensión en carga',fmtV(ev.vload),ev.vdOk?'good':'warn');
  if(mode==='reto'){
    html+=teleRow('Estado',retoChecked?(retoOk?'✔ CORRECTO':'✗ revisa'):'Elige y comprueba',(retoChecked&&retoOk)?'good':'warn');
  }else{
    const minC=CAT[sel.byBoth],isMin=curIdx()===sel.byBoth;
    html+=teleRow('Calibre mínimo válido',('AWG '+minC.awg))+
      teleRow('¿Tu elección es la mínima?',isMin?'✔ óptimo':(ev.ampOk&&ev.vdOk?'sobredimensionado':'no cumple'),isMin?'good':'warn');
  }
  t.innerHTML=html;
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  const ev=curEval(),I=curI(),L=curL(),sel=curSel();
  if(mode==='seleccion'){
    const minC=CAT[sel.byBoth],ampC=sel.byAmp>=0?CAT[sel.byAmp]:null;
    html+=`<span class="mono">I=${I} A, L=${L} m ⇒ calibre mínimo = AWG ${minC.awg} (caída ${fmtPct(vdPct(minC.S,L,I))}). ${ampC&&sel.byAmp!==sel.byBoth?'La ampacidad sola pediría AWG '+ampC.awg+', pero su caída sería '+fmtPct(vdPct(ampC.S,L,I))+' >3%: la CAÍDA obliga a subir.':'Aquí la ampacidad ya basta; la corrida es corta.'}</span>`;
  }else if(mode==='reto'){
    html+=retoMsg||`<span class="mono">Datos: I=${retoI} A, L=${retoL} m, V=${V} V. No basta con que "aguante la corriente": revisa también la caída (e=2ρLI/S ≤ 3%). Elige el calibre más delgado que cumpla ambos.</span>`;
  }else{
    html+=`<span class="mono">AWG ${ev.c.awg}: I=${I} A vs ampacidad ${ev.c.amp} A (${ev.ampOk?'OK':'SOBRECARGA'}); caída ${fmtPct(ev.pe)} ${ev.vdOk?'≤3% OK':'>3% baja tensión'}; la carga recibe ${fmtV(ev.vload)}. Mínimo válido: AWG ${CAT[sel.byBoth].awg}.</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();drawVM();updateTele();updateReport();rebuildWires();refreshWireGlow();}

// ===================== 11. RETO =====================
function updateRetoSpec(){
  el('retoSpec').innerHTML=`Circuito fijo: <b>I=${retoI} A</b>, <b>L=${retoL} m</b>, <b>V=${V} V</b>. Elige el conductor de cobre más delgado que cumpla ampacidad (I≤amp) <b>y</b> caída de tensión ≤3%, y pulsa "Comprobar selección".`;
}
function checkReto(){
  retoOk=(retoPick===retoAns);retoChecked=true;solved=retoOk;
  synth.beep(retoOk?1046:220,retoOk?0.14:0.15,0.06);
  const ansC=CAT[retoAns];
  if(retoOk){
    retoMsg=`<span class="mono"><span class="ok">✔ Correcto</span> — AWG ${ansC.awg} es el calibre mínimo (caída ${fmtPct(vdPct(ansC.S,retoL,retoI))}, ampacidad ${ansC.amp} A ≥ ${retoI} A). ${retoMsgLong()}</span>`;
  }else{
    retoMsg=`<span class="mono"><span class="dtc">✗ Incorrecto</span> — el mínimo correcto es AWG ${ansC.awg}. ${retoMsgLong()}</span>`;
  }
  refreshAll();
}

// ===================== 12. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'Un conductor tiene ampacidad de 30 A y alimenta una carga de 16 A por una corrida de 60 m, con caída resultante del 8%. ¿Es un calibre adecuado?',
      opciones:[
        {t:'No: aunque su ampacidad sobra (30 A ≥ 16 A), la caída del 8% supera el límite del 3%. La carga recibiría muy baja tensión; hay que subir a un calibre más grueso aunque la corriente no lo exija.',ok:true,why:'Correcto: se deben cumplir AMBOS criterios. En corridas largas la caída de tensión, no la ampacidad, es la que obliga a engrosar el conductor.'},
        {t:'Sí: la ampacidad (30 A) es mayor que la corriente (16 A), así que el cable es suficiente.',ok:false,why:'La ampacidad es solo el primer criterio. Con 8% de caída la carga queda muy por debajo de su tensión nominal: el conductor NO es adecuado.'},
        {t:'Sí, pero solo si se instala un breaker más grande.',ok:false,why:'Un breaker mayor no arregla la caída de tensión (ni debe superar el límite del conductor). El problema es la sección insuficiente para esa longitud.'},
        {t:'No, porque la ampacidad de 30 A es demasiado alta para 16 A (sobredimensionado peligroso).',ok:false,why:'Sobredimensionar la ampacidad no es peligroso, solo un poco más caro. El problema real aquí es la caída del 8% > 3%.'},
      ],
    },
    seleccion:{
      pregunta:'¿Por qué la fórmula de caída de tensión de un circuito monofásico lleva un factor 2 (e = 2·ρ·L·I / S)?',
      opciones:[
        {t:'Porque la corriente recorre dos conductores: va por el de fase y regresa por el neutro, así que la longitud efectiva del cobre es 2·L.',ok:true,why:'Correcto: la caída se produce en el trayecto de ida Y de vuelta. Por eso se usa 2·L (o, en trifásico balanceado, un factor √3 en su lugar).'},
        {t:'Porque hay que dejar un margen de seguridad del doble.',ok:false,why:'No es un margen: el 2 es físico, corresponde a los dos conductores (ida y retorno) que la corriente recorre.'},
        {t:'Porque la tensión es de 127 V, el doble de un sistema de 63 V.',ok:false,why:'El 2 no tiene que ver con el nivel de tensión; representa los dos conductores del circuito (ida y vuelta).'},
        {t:'Porque la resistividad del cobre se duplica en corriente alterna.',ok:false,why:'La resistividad no se duplica; el efecto piel es despreciable en estos calibres. El 2 es por los dos conductores.'},
      ],
    },
    reto:{
      pregunta:'En un circuito derivado de 20 A, ¿por qué la norma exige calibre 12 AWG y no 14 AWG, si la ampacidad de tabla del 14 AWG (20 A a 75 °C) igualaría la carga?',
      opciones:[
        {t:'Porque el Art. 240.4(D) limita la protección del 14 AWG a 15 A: no se puede proteger con un breaker de 20 A. El 12 AWG es el mínimo que admite protección de 20 A.',ok:true,why:'Correcto: por su historial de fallas, 14/12/10 AWG tienen topes de protección de 15/20/30 A independientemente de su ampacidad de tabla. Por eso un circuito de 20 A usa calibre 12.'},
        {t:'Porque el 14 AWG no existe comercialmente para instalaciones.',ok:false,why:'El 14 AWG sí existe y se usa mucho (circuitos de 15 A). El motivo es el tope de protección del Art. 240.4(D), no la disponibilidad.'},
        {t:'Porque el 14 AWG siempre tiene una caída de tensión mayor al 3%.',ok:false,why:'La caída depende de la longitud y la corriente, no siempre supera el 3%. La razón aquí es el límite de protección (240.4(D)).'},
        {t:'Porque el cobre del 12 AWG conduce mejor la corriente alterna.',ok:false,why:'Ambos son cobre; la diferencia es la sección. El motivo normativo es el tope de protección de 15 A del 14 AWG.'},
      ],
    },
  };
  // Baraja las opciones de cada modo para que la respuesta correcta no quede en posición fija
  // (regla de revisión adversarial: posición-de-quiz-fija = bloqueante). El hook de debug resuelve
  // el índice correcto buscando ok:true, así que la verificación sigue siendo consistente.
  Object.values(QUIZ).forEach(q=>{
    for(let i=q.opciones.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      const tmp=q.opciones[i];q.opciones[i]=q.opciones[j];q.opciones[j]=tmp;
    }
  });
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
  const o=q.opciones[i];
  btns.forEach(b=>b.disabled=true);
  btns[i].classList.add(o.ok?'right':'wrong');
  if(o.ok){solved=true;synth.beep(1046,0.12,0.06);}else{synth.beep(220,0.15,0.06);}
  showToast((o.ok?'✔ ':'✗ ')+o.why);
  updateReport();
}

// ===================== 13. PICKING Y HOVER =====================
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit)return;
  if(hit.object===board){boardClick();return;}
  let o=hit.object;
  while(o){
    if(o.userData&&o.userData.title){showToast('<b>'+o.userData.title+'</b><br>'+(o.userData.info||''));return;}
    o=o.parent;
  }
});
(function hoverLoop(){
  const ray=new THREE.Raycaster(),dom=S.renderer.domElement;let mx=0,my=0;
  dom.addEventListener('pointermove',e=>{const r=dom.getBoundingClientRect();mx=((e.clientX-r.left)/r.width)*2-1;my=-((e.clientY-r.top)/r.height)*2+1;});
  function tick(){
    ray.setFromCamera({x:mx,y:my},S.camera);let hovered=false;
    for(const [obj,spr] of HOVER_LABELS){
      if(!obj.visible){spr.visible=false;continue;}
      const on=ray.intersectObject(obj,true).length>0;spr.visible=on;if(on)hovered=true;
    }
    dom.style.cursor=hovered?'pointer':'default';requestAnimationFrame(tick);
  }
  tick();
})();

// ===================== 14. RECORRIDO AUTOMÁTICO =====================
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
async function runAuto(){
  if(autoRunning)return;autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorriendo…';
  try{
    synth.init();synth.resume();clearDx();
    setMode('explora');
    expI=16;expL=15;expIdx=CAT.findIndex(c=>c.awg==='12');afterEdit();
    showToast('🧭 Corrida corta (16 A, 15 m) con AWG 12: ambos criterios en verde. La caída es pequeña.');
    await sleep(3400);
    expL=70;afterEdit();
    showToast('⚠️ Alargamos a 70 m: la caída se dispara a '+fmtPct(curEval().pe)+' (>3%). El mismo cable ya NO sirve, aunque la ampacidad sigue de sobra.');
    await sleep(3800);
    expIdx=CAT.findIndex(c=>c.awg==='6');afterEdit();
    showToast('🔧 Subimos a AWG 6: la caída baja a '+fmtPct(curEval().pe)+' ≤3%. La longitud obligó a engrosar el cobre.');
    await sleep(3600);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('seleccion');
    showToast('📋 La tabla muestra todos los calibres para 16 A y 70 m: la columna ② (caída) descarta los delgados. El mínimo correcto queda resaltado.');
    await sleep(3800);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('reto');
    retoPick=selectMin(retoI,retoL).byAmp;afterEdit();
    showToast('🎯 Reto: I='+retoI+' A, L='+retoL+' m. Empezamos en el calibre "ampacidad-sola" (la trampa)…');
    await sleep(3200);
    retoPick=retoAns;afterEdit();
    showToast('✔ …y lo corregimos al mínimo que cumple AMBOS: AWG '+CAT[retoAns].awg+'. Comprobamos.');
    await sleep(2600);
    checkReto();await sleep(2400);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 15. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt,time)=>{
  const pulse=0.5+0.5*Math.sin(time*3.0);
  const ev=curEval();
  const over=ev.c.amp>0?curI()/ev.c.amp:0;
  const heat=Math.max(0,Math.min(1,(over-0.7)/0.6));
  copMat.emissiveIntensity=heat*(0.8+0.5*pulse);
});
['explora','seleccion','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=()=>{if(!autoRunning)runAuto();};
el('btnNew').onclick=()=>{if(autoRunning)return;newSignal();};
el('btnCheck').onclick=()=>{if(autoRunning)return;checkReto();};
const soundBtn=el('soundBtn');
if(soundBtn){soundBtn.onclick=()=>{synth.toggle();soundBtn.textContent=synth.isOn()?'🔊':'🔇';};}
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});

buildQuiz();
S.start();
setMode('explora');

// ===================== DEBUG HOOK =====================
window.__labDebug={
  mode:()=>mode,
  I:()=>curI(), L:()=>curL(),
  awg:()=>curEval().c.awg,
  idx:()=>curIdx(),
  S:()=>curEval().c.S,
  amp:()=>curEval().c.amp,
  ampOk:()=>curEval().ampOk,
  vdPct:()=>curEval().pe,
  vdOk:()=>curEval().vdOk,
  vload:()=>curEval().vload,
  minIdx:()=>curSel().byBoth,
  minAwg:()=>CAT[curSel().byBoth].awg,
  ampIdx:()=>curSel().byAmp,
  ampAwg:()=>CAT[curSel().byAmp].awg,
  setI:v=>{if(mode!=='reto'){expI=v;afterEdit();}},
  setL:v=>{if(mode!=='reto'){expL=v;afterEdit();}},
  setIdx:v=>{if(mode==='reto'){retoPick=v;retoChecked=false;retoOk=false;}else{expIdx=v;}afterEdit();},
  retoI:()=>retoI, retoL:()=>retoL,
  retoAns:()=>retoAns, retoAnsAwg:()=>CAT[retoAns].awg,
  retoPick:()=>retoPick,
  retoChecked:()=>retoChecked, retoOk:()=>retoOk, retoMsg:()=>retoMsg,
  checkReto:()=>checkReto(),
  newSignal:()=>newSignal(),
  setMode:k=>setMode(k),
  reportText:()=>el('report').innerText,
  quizAnswer:i=>answer(i),
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  solved:()=>solved,
};
