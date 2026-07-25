// Desbalance trifásico y corriente por el conductor de neutro (sistema Y de 4 hilos).
// Física (fuente trifásica RÍGIDA y balanceada VF=127 V/fase a 120°; 3 cargas resistivas
// independientes fase-a-neutro que drenan corrientes Ia, Ib, Ic; neutro ideal sin impedancia):
//   Fasores de corriente de fase (resistivas ⇒ en fase con su tensión de fase):
//     IA=Ia∠0°, IB=Ib∠−120°, IC=Ic∠+120°.
//   Corriente por el neutro = suma FASORIAL de las tres (retorno por el 4º hilo):
//     IN = IA + IB + IC  (¡NO la suma aritmética!). Balanceado (Ia=Ib=Ic) ⇒ IN=0.
//   Componentes simétricas (a=1∠120°):
//     I0 = (IA+IB+IC)/3            (secuencia cero)   ⇒  IN = 3·I0   [relación central]
//     I1 = (IA + a·IB + a²·IC)/3   (secuencia positiva) = promedio (Ia+Ib+Ic)/3 para cargas resistivas
//     I2 = (IA + a²·IB + a·IC)/3   (secuencia negativa) = mide el desbalance
//   Reconstrucción exacta: IA=I0+I1+I2 (verificado node -e). Factor de desbalance = |I2|/|I1|.
// Catálogo del Reto verificado numéricamente (node -e): corrientes ∈ {5,10,15,20,25,30} A con
//   desbalance visible (max−min ≥ 10). 180 escenarios; |IN| ∈ [8.66, 25] A (nunca trivial); la
//   trampa de "suma aritmética" (Ia+Ib+Ic) queda SIEMPRE ≥ 15 A del |IN| real y JAMÁS cae dentro
//   de la tolerancia de la predicción (tol=máx(1.5 A, 6%·|IN|)). Ref: NOM-001-SEDE-2022 (Art. 220,
//   dimensionamiento del neutro), Fortescue (componentes simétricas), Enríquez Harper.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[3.6,2.5,6.9],target:[0.4,1.05,0.1],bgTop:'#141410',bgBot:'#05060a',bloom:0.4,minD:3.0,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2400,Q:0.8});
const el=id=>document.getElementById(id);
const R3=Math.sqrt(3);
const D2R=Math.PI/180;

// ===================== 2. FÍSICA =====================
const VF=127;                                 // tensión de fase nominal (contexto; VL=√3·127≈220 V)
const EXP_STEPS=[0,5,10,15,20,25,30];         // corrientes de fase en Explora (incluye 0 = fase abierta)
const RETO_STEPS=[5,10,15,20,25,30];          // corrientes en el Reto (desbalance con carga en las 3)
const INtol=v=>Math.max(1.5,0.06*v);          // tolerancia de la predicción de |IN|

function cpx(m,angDeg){return {x:m*Math.cos(angDeg*D2R), y:m*Math.sin(angDeg*D2R)};}
function cadd(...v){return v.reduce((a,b)=>({x:a.x+b.x,y:a.y+b.y}),{x:0,y:0});}
function cscale(v,k){return {x:v.x*k, y:v.y*k};}
function crot(v,deg){const c=Math.cos(deg*D2R),s=Math.sin(deg*D2R);return {x:v.x*c-v.y*s, y:v.x*s+v.y*c};}
function cmag(v){return Math.hypot(v.x,v.y);}
function cang(v){return Math.atan2(v.y,v.x)/D2R;}

function up(Ia,Ib,Ic){
  const IA=cpx(Ia,0), IB=cpx(Ib,-120), IC=cpx(Ic,120);
  const IN=cadd(IA,IB,IC);                       // corriente de neutro = suma fasorial
  const I0=cscale(IN,1/3);                       // secuencia cero  (IN = 3·I0)
  const I1=cscale(cadd(IA,crot(IB,120),crot(IC,240)),1/3);   // secuencia positiva
  const I2=cscale(cadd(IA,crot(IB,240),crot(IC,120)),1/3);   // secuencia negativa
  const arith=Ia+Ib+Ic;                          // trampa: suma aritmética (incorrecta)
  const unbal=cmag(I1)>1e-9?cmag(I2)/cmag(I1):0; // factor de desbalance de corriente
  return {Ia,Ib,Ic,IA,IB,IC,IN,I0,I1,I2,arith,unbal,
          INmag:cmag(IN),INang:cang(IN),I0mag:cmag(I0),I1mag:cmag(I1),I2mag:cmag(I2)};
}
function pickFrom(arr,exclude){if(arr.length<=1)return arr[0];let v=arr[Math.floor(Math.random()*arr.length)];while(v===exclude)v=arr[Math.floor(Math.random()*arr.length)];return v;}
function fmtA(v){return (Math.round(v*100)/100).toFixed(2)+' A';}
function fmtA1(v){return (Math.round(v*10)/10).toFixed(1)+' A';}
function fmtDeg(v){return (Math.round(v*10)/10).toFixed(1)+'°';}
function fmtPct(v){return (Math.round(v*1000)/10).toFixed(1)+'%';}

// ===================== 3. ESTADO =====================
let mode='explora';               // explora | componentes | reto
// Explora + Componentes comparten la misma carga (misma carga, dos lecturas)
let expIa=20,expIb=12,expIc=8;
// Reto — sorteado, calificado por predicción de |IN|
let retoIa=20,retoIb=15,retoIc=10,retoINtrue=0,predIN=10;
let retoChecked=false,retoOk=false,retoMsg='';
let solved=false,autoRunning=false;
let QUIZ={};

function seedReto(){
  let a,b,c;
  do{a=pickFrom(RETO_STEPS);b=pickFrom(RETO_STEPS);c=pickFrom(RETO_STEPS);}
  while((Math.max(a,b,c)-Math.min(a,b,c))<10);   // garantiza desbalance visible
  retoIa=a;retoIb=b;retoIc=c;
  retoINtrue=up(a,b,c).INmag;
  predIN=10;retoChecked=false;retoOk=false;retoMsg='';
}
seedReto();

function curIa(){return mode==='reto'?retoIa:expIa;}
function curIb(){return mode==='reto'?retoIb:expIb;}
function curIc(){return mode==='reto'?retoIc:expIc;}
function curSys(){return up(curIa(),curIb(),curIc());}

// ===================== 4. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
function plas(base){return std(base,0.35,0.08);}
const MAT={bench:brush(0x33322a),frame:brush(0x27261f),leg:brush(0x16150f),src:brush(0x353226)};
const PH_COL=[0xff6b6b,0x7CD992,0x5b8dff];      // A rojo, B verde, C azul
const PH_HEX=['#ff6b6b','#7CD992','#5b8dff'];
const NEU_HEX='#E9C46A';                          // neutro = ámbar (protagonista)
const NEU_COL=0xE9C46A;

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const cv=document.createElement('canvas');cv.width=256;cv.height=64;
  const cx=cv.getContext('2d');
  cx.fillStyle='rgba(14,12,6,0.88)';cx.fillRect(0,0,256,64);
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

// ===================== 5. PIZARRÓN (FASORES) =====================
const boardG=new THREE.Group();
boardG.position.set(-1.15,0,-0.9);boardG.rotation.y=0.18;
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
frame.userData={title:'Pizarrón de fasores',info:'Suma fasorial de las 3 corrientes de fase → corriente de neutro · descomposición en componentes simétricas · toca para inspeccionar'};
addHoverLabel(frame,'Pizarrón fasorial del neutro',NEU_HEX,new THREE.Vector3(0,3.38,0.1).add(boardG.position),1.7);

const PXA=4.6;                                    // px por amperio en el pizarrón
function v2px(cx,cy,v){return [cx+v.x*PXA, cy-v.y*PXA];}   // eje y invertido (canvas)
function arrow(c,x0,y0,x1,y1,color,w,dash){
  c.strokeStyle=color;c.lineWidth=w||3;if(dash)c.setLineDash(dash);
  c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();c.setLineDash([]);
  const ang=Math.atan2(y1-y0,x1-x0),s=(w||3)*3.2;
  c.fillStyle=color;c.save();c.translate(x1,y1);c.rotate(ang);
  c.beginPath();c.moveTo(0,0);c.lineTo(-s,s*0.5);c.lineTo(-s,-s*0.5);c.closePath();c.fill();c.restore();
}
function grid(c){
  c.fillStyle='#0e0f0a';c.fillRect(0,0,1024,768);
  c.fillStyle='rgba(233,196,106,0.05)';
  for(let gx=64;gx<1024;gx+=64)for(let gy=64;gy<768;gy+=64)c.fillRect(gx-1,gy-1,3,3);
}
function axes(c,cx,cy,R){
  c.strokeStyle='rgba(233,196,106,0.12)';c.lineWidth=1;
  [0.5,1.0].forEach(f=>{c.beginPath();c.arc(cx,cy,R*f,0,Math.PI*2);c.stroke();});
  c.strokeStyle='rgba(233,196,106,0.28)';c.lineWidth=1.2;
  c.beginPath();c.moveTo(cx-R-14,cy);c.lineTo(cx+R+14,cy);c.moveTo(cx,cy-R-14);c.lineTo(cx,cy+R-14+28);c.stroke();
}

function drawExplora(c,sy){
  c.fillStyle='#C9B487';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('SUMA FASORIAL DE CORRIENTES → CORRIENTE DE NEUTRO',30,44);
  c.fillStyle='#7a7360';c.font='13px Outfit, sans-serif';
  c.fillText('Cargas resistivas fase-neutro · IA=Ia∠0°, IB=Ib∠−120°, IC=Ic∠+120° · IN = IA+IB+IC (suma FASORIAL, no aritmética)',30,70);

  // --- Izquierda: fasores desde el origen + cadena punta-cola ---
  const cx=300,cy=420,R=180;
  axes(c,cx,cy,R);
  // fasores desde el origen (tenues)
  const V=[sy.IA,sy.IB,sy.IC];
  V.forEach((v,i)=>{const [x,y]=v2px(cx,cy,v);arrow(c,cx,cy,x,y,PH_HEX[i],2,[4,4]);});
  // cadena punta-cola (bold): IA, luego IB, luego IC
  let px=cx,py=cy;
  V.forEach((v,i)=>{const [nx,ny]=v2px(px,py,v);if(cmag(v)>0.01)arrow(c,px,py,nx,ny,PH_HEX[i],3.4);px=nx;py=ny;});
  // resultante IN desde el origen hasta el final de la cadena
  arrow(c,cx,cy,px,py,NEU_HEX,4.5);
  c.fillStyle=NEU_HEX;c.font='bold 16px Outfit, sans-serif';c.textAlign='center';
  c.fillText('IN='+fmtA1(sy.INmag),(cx+px)/2+18,(cy+py)/2-8);
  c.fillStyle='#7a7360';c.font='12px Outfit, sans-serif';
  c.fillText('(cadena punta-cola: IA→IB→IC; IN cierra el polígono)',cx,cy+R+30);

  // --- Derecha: tabla de magnitudes + contraste con la suma aritmética ---
  const bx=600,by=120,bw=394;
  c.fillStyle='rgba(233,196,106,0.06)';c.fillRect(bx,by,bw,520);
  c.strokeStyle='rgba(233,196,106,0.22)';c.lineWidth=1;c.strokeRect(bx,by,bw,520);
  c.fillStyle='#C9B487';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText('LECTURAS',bx+18,by+30);
  const rows=[
    ['Corriente fase A (Ia)',fmtA(sy.Ia),PH_HEX[0]],
    ['Corriente fase B (Ib)',fmtA(sy.Ib),PH_HEX[1]],
    ['Corriente fase C (Ic)',fmtA(sy.Ic),PH_HEX[2]],
    ['▸ Corriente de NEUTRO |IN|',fmtA(sy.INmag),NEU_HEX],
    ['   ángulo de IN',fmtDeg(sy.INang),'#9a9482'],
    ['Secuencia cero |I0| = |IN|/3',fmtA(sy.I0mag),'#C9B487'],
    ['Factor de desbalance |I2|/|I1|',fmtPct(sy.unbal),'#C9B487'],
  ];
  c.font='13px Outfit, sans-serif';
  rows.forEach((r,i)=>{
    const yy=by+64+i*46;
    c.fillStyle='#9a9482';c.textAlign='left';c.font='13px Outfit, sans-serif';c.fillText(r[0],bx+18,yy);
    c.fillStyle=r[2];c.font='bold 17px Outfit, sans-serif';c.textAlign='right';c.fillText(r[1],bx+bw-16,yy+2);
    if(i<rows.length-1){c.strokeStyle='rgba(233,196,106,0.10)';c.beginPath();c.moveTo(bx+14,yy+16);c.lineTo(bx+bw-14,yy+16);c.stroke();}
  });
  // contraste con la trampa aritmética
  const wy=by+520-46;
  c.fillStyle='rgba(255,107,107,0.10)';c.fillRect(bx+10,wy-4,bw-20,40);
  c.fillStyle='#ff9a9a';c.font='12px Outfit, sans-serif';c.textAlign='left';
  c.fillText('✗ Suma aritmética Ia+Ib+Ic = '+fmtA1(sy.arith)+' — ¡NO es la corriente de neutro!',bx+18,wy+16);
  c.fillText('   El neutro real ('+fmtA1(sy.INmag)+') es mucho menor: los fasores se cancelan parcialmente.',bx+18,wy+32);

  // pie
  c.fillStyle=sy.INmag<0.5?'#7CD992':NEU_HEX;c.font='bold 15px Outfit, sans-serif';c.textAlign='left';
  c.fillText(sy.INmag<0.5?'Sistema balanceado (Ia=Ib=Ic) → IN=0: el neutro no lleva corriente.'
                          :'Sistema desbalanceado → el neutro conduce IN='+fmtA1(sy.INmag)+' de retorno.',30,712);
  c.fillStyle='#7a7360';c.font='12px Outfit, sans-serif';
  c.fillText('Relación central: IN = 3·I0 (tres veces la componente de secuencia cero).',30,738);
}

function drawComponentes(c,sy){
  c.fillStyle='#C9B487';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('COMPONENTES SIMÉTRICAS (FORTESCUE)',30,44);
  c.fillStyle='#7a7360';c.font='13px Outfit, sans-serif';
  c.fillText('Toda terna desbalanceada = suma de 3 ternas balanceadas: secuencia positiva (I1), negativa (I2) y cero (I0).',30,70);

  // tres mini-diagramas: I1, I2, I0
  const setY=250,R=95;
  const sets=[
    {cx:210,I:sy.I1,ang:[0,-120,120],tit:'POSITIVA I1',col:'#7CD992',sub:'giro normal · = promedio (Ia+Ib+Ic)/3'},
    {cx:512,I:sy.I2,ang:[0,120,-120],tit:'NEGATIVA I2',col:'#ff6b6b',sub:'giro inverso · calienta motores'},
    {cx:814,I:sy.I0,ang:[0,0,0],  tit:'CERO I0',    col:NEU_HEX, sub:'en fase en las 3 · IN=3·I0'},
  ];
  sets.forEach(st=>{
    const cy=setY;
    c.strokeStyle='rgba(233,196,106,0.12)';c.lineWidth=1;c.beginPath();c.arc(st.cx,cy,R,0,Math.PI*2);c.stroke();
    c.strokeStyle='rgba(233,196,106,0.22)';c.beginPath();c.moveTo(st.cx-R-8,cy);c.lineTo(st.cx+R+8,cy);c.moveTo(st.cx,cy-R-8);c.lineTo(st.cx,cy+R+8);c.stroke();
    const m=cmag(st.I), base=cang(st.I);
    st.ang.forEach((da,i)=>{
      const v=cpx(m, base+da);
      const [x,y]=v2px(st.cx,cy,cscale(v,1.9));   // escala visual mayor para componentes
      if(m>0.05)arrow(c,st.cx,cy,x,y,PH_HEX[i],2.6);
    });
    c.fillStyle=st.col;c.font='bold 15px Outfit, sans-serif';c.textAlign='center';
    c.fillText(st.tit+' = '+fmtA1(m),st.cx,cy-R-22);
    c.fillStyle='#7a7360';c.font='11px Outfit, sans-serif';
    c.fillText(st.sub,st.cx,cy+R+22);
  });

  // panel inferior: reconstrucción + relaciones
  const by=470,bw=964;
  c.fillStyle='rgba(233,196,106,0.06)';c.fillRect(30,by,bw,250);
  c.strokeStyle='rgba(233,196,106,0.22)';c.strokeRect(30,by,bw,250);
  c.fillStyle='#C9B487';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText('RELACIONES CLAVE',48,by+30);
  const lines=[
    ['IA = I0 + I1 + I2', 'cada corriente de fase es la suma de sus 3 componentes (reconstrucción exacta)'],
    ['IN = 3·I0 = '+fmtA1(3*sy.I0mag), 'la corriente de neutro es SOLO secuencia cero: '+fmtA1(sy.INmag)+' medidos'],
    ['|I2|/|I1| = '+fmtPct(sy.unbal), 'factor de desbalance de corriente (0% = perfectamente balanceado)'],
    ['Balanceado ⇒ I2=0 e I0=0', 'entonces IN=0 y solo queda la secuencia positiva útil'],
  ];
  c.font='13px Outfit, sans-serif';
  lines.forEach((ln,i)=>{
    const yy=by+64+i*44;
    c.fillStyle=NEU_HEX;c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.fillText(ln[0],48,yy);
    c.fillStyle='#9a9482';c.font='13px Outfit, sans-serif';c.fillText('— '+ln[1],300,yy);
  });
}

function drawReto(c,sy){
  c.fillStyle='#C9B487';c.font='bold 22px Outfit, sans-serif';c.textAlign='left';
  c.fillText('RETO — PREDICE LA CORRIENTE DE NEUTRO',30,44);
  c.fillStyle='#7a7360';c.font='13px Outfit, sans-serif';
  c.fillText('Las 3 corrientes de fase están fijas. Suma los fasores mentalmente y predice |IN| con los controles, luego comprueba.',30,70);

  // izquierda: fasores dados + cadena punta-cola (SIN revelar IN hasta comprobar)
  const cx=300,cy=420,R=180;
  axes(c,cx,cy,R);
  const V=[sy.IA,sy.IB,sy.IC];
  V.forEach((v,i)=>{const [x,y]=v2px(cx,cy,v);arrow(c,cx,cy,x,y,PH_HEX[i],2,[4,4]);});
  let px=cx,py=cy;
  V.forEach((v,i)=>{const [nx,ny]=v2px(px,py,v);if(cmag(v)>0.01)arrow(c,px,py,nx,ny,PH_HEX[i],3.4);px=nx;py=ny;});
  // círculo punteado del radio = predicción del estudiante
  c.strokeStyle='rgba(233,196,106,0.6)';c.lineWidth=1.5;c.setLineDash([6,5]);
  c.beginPath();c.arc(cx,cy,predIN*PXA,0,Math.PI*2);c.stroke();c.setLineDash([]);
  c.fillStyle=NEU_HEX;c.font='bold 13px Outfit, sans-serif';c.textAlign='center';
  c.fillText('tu predicción: '+fmtA1(predIN),cx,cy-predIN*PXA-8);
  if(retoChecked){
    arrow(c,cx,cy,px,py,retoOk?'#7CD992':'#ff6b6b',4.5);
    c.fillStyle=retoOk?'#7CD992':'#ff6b6b';c.font='bold 15px Outfit, sans-serif';
    c.fillText('IN real = '+fmtA1(sy.INmag),(cx+px)/2+22,(cy+py)/2-8);
  }else{
    c.fillStyle='#9a9482';c.font='bold 30px Outfit, sans-serif';
    c.fillText('?',px+14,py+6);
  }

  // derecha: corrientes dadas
  const bx=600,by=160,bw=394;
  c.fillStyle='rgba(233,196,106,0.06)';c.fillRect(bx,by,bw,300);
  c.strokeStyle='rgba(233,196,106,0.22)';c.strokeRect(bx,by,bw,300);
  c.fillStyle='#C9B487';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText('CORRIENTES DE FASE (DADAS)',bx+18,by+32);
  [['Ia',sy.Ia,PH_HEX[0]],['Ib',sy.Ib,PH_HEX[1]],['Ic',sy.Ic,PH_HEX[2]]].forEach((r,i)=>{
    const yy=by+72+i*46;
    c.fillStyle=r[2];c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.fillText(r[0]+' ∠'+[0,-120,120][i]+'°',bx+18,yy);
    c.fillStyle='#F4EFEA';c.font='bold 18px Outfit, sans-serif';c.textAlign='right';c.fillText(fmtA(r[1]),bx+bw-16,yy);
  });
  c.fillStyle='#7a7360';c.font='12px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Recuerda: IN NO es Ia+Ib+Ic ('+fmtA1(sy.arith)+').',bx+18,by+232);
  c.fillText('Es la suma FASORIAL: los ángulos a 120° cancelan parte.',bx+18,by+254);
  c.fillStyle=NEU_HEX;c.font='bold 14px Outfit, sans-serif';
  c.fillText('Tu predicción actual: '+fmtA1(predIN),bx+18,by+282);

  // pie: veredicto
  if(retoChecked){
    c.fillStyle=retoOk?'#7CD992':'#ff6b6b';c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
    c.fillText(retoOk?('✔ CORRECTO — |IN|='+fmtA1(sy.INmag)+' (tu predicción '+fmtA1(predIN)+', tolerancia ±'+fmtA1(INtol(sy.INmag))+')')
                     :('✗ error de '+fmtA1(Math.abs(predIN-sy.INmag))+' — |IN| real = '+fmtA1(sy.INmag)+', tolerancia ±'+fmtA1(INtol(sy.INmag))),30,712);
  }else{
    c.fillStyle='#7a7360';c.font='13px Outfit, sans-serif';c.textAlign='left';
    c.fillText('Ajusta la predicción con −/+ y pulsa "Comprobar predicción".',30,712);
  }
}

function drawBoard(){
  const c=bCv.getContext('2d');
  grid(c);
  const sy=curSys();
  if(mode==='componentes')drawComponentes(c,sy);
  else if(mode==='reto')drawReto(c,sy);
  else drawExplora(c,sy);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='componentes')showToast('🔬 Tres ternas balanceadas suman la real: la POSITIVA (I1, giro normal), la NEGATIVA (I2, giro inverso que calienta motores) y la CERO (I0, en fase en las 3). La corriente de neutro es exactamente 3·I0.');
  else showToast('📐 Izquierda: los 3 fasores de corriente puestos punta-cola; el vector ámbar que cierra el polígono es la corriente de NEUTRO (suma fasorial). Derecha: cómo la suma aritmética Ia+Ib+Ic engaña — el neutro real es mucho menor porque los fasores a 120° se cancelan en parte.');
}

// ===================== 6. ESCENA 3D: FUENTE, 3 CARGAS, NEUTRO =====================
const bench=roundedBox(3.1,0.5,1.7,MAT.bench,0.05);
bench.position.set(1.9,0.25,0.9);
scene.add(bench);
bench.userData={title:'Tablero trifásico de 4 hilos',info:'Fuente Y con neutro + 3 cargas independientes fase-neutro + pinza amperimétrica en el neutro'};

const srcBox=roundedBox(0.55,0.95,0.72,MAT.src,0.05);
srcBox.position.set(0.72,0.98,0.9);
scene.add(srcBox);
srcBox.userData={title:'Fuente trifásica de 4 hilos',info:'Tres fases a 120° (VF=127 V) + neutro. Se supone rígida y balanceada.'};
addHoverLabel(srcBox,'Fuente Y + neutro','#C9B487',new THREE.Vector3(0.72,1.62,0.9),1.2);

// 3 módulos de carga en fila (A,B,C), cada uno con corriente ajustable
const loadX=[1.55,2.05,2.55];
const loadZ=0.55;
const loads=[];
loadX.forEach((x,i)=>{
  const m=new THREE.Mesh(new THREE.BoxGeometry(0.32,0.42,0.32),new THREE.MeshStandardMaterial({color:0x2c352f,roughness:0.4,metalness:0.3,emissive:PH_COL[i],emissiveIntensity:0.2}));
  m.position.set(x,0.78,loadZ);m.castShadow=m.receiveShadow=true;
  m.userData={loadIndex:i,title:'Carga fase '+'ABC'[i],info:'Carga resistiva fase-neutro · toca y usa los controles para variar su corriente'};
  scene.add(m);
  addHoverLabel(m,'Carga '+'ABC'[i],PH_HEX[i],new THREE.Vector3(x,1.06,loadZ),0.8);
  loads.push(m);
});
// punto de estrella de la carga (unión de los 3 neutros de carga)
const STAR=new THREE.Vector3(2.05,0.66,1.25);
const starNode=new THREE.Mesh(new THREE.SphereGeometry(0.075,16,16),plas(0xF4EFEA));
starNode.position.copy(STAR);scene.add(starNode);
starNode.userData={title:'Punto de estrella de la carga',info:'Une los retornos de las 3 cargas; de aquí sale el conductor de neutro hacia la fuente.'};

// terminales de fuente (fase + neutro)
const srcTerms=[new THREE.Vector3(1.00,0.98,0.60),new THREE.Vector3(1.00,1.12,0.9),new THREE.Vector3(1.00,0.98,1.20)];
const srcNeutral=new THREE.Vector3(1.00,0.72,1.30);

// materiales de cable
function wireMatOf(hex){return new THREE.MeshStandardMaterial({color:hex,roughness:0.5,metalness:0.2,emissive:hex,emissiveIntensity:0.25});}
const phaseWireMat=[wireMatOf(PH_COL[0]),wireMatOf(PH_COL[1]),wireMatOf(PH_COL[2])];
const neutralWireMat=new THREE.MeshStandardMaterial({color:NEU_COL,roughness:0.45,metalness:0.25,emissive:NEU_COL,emissiveIntensity:0.2});
function tubeBetween(a,b,radius,mat){
  const dir=new THREE.Vector3().subVectors(b,a),len=dir.length();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,len,10),mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());
  return m;
}
// cableado fijo: fase→carga, carga→estrella, estrella→neutro fuente
const wireG=new THREE.Group();scene.add(wireG);
loads.forEach((m,i)=>{
  wireG.add(tubeBetween(srcTerms[i],m.position,0.017,phaseWireMat[i]));
  wireG.add(tubeBetween(m.position,STAR,0.014,new THREE.MeshStandardMaterial({color:0x555049,roughness:0.6,metalness:0.2})));
});
// conductor de NEUTRO (protagonista): estrella → neutro de la fuente, con nodo intermedio para la pinza
const NCLAMP=new THREE.Vector3(1.55,0.66,1.30);
const neutralSeg1=tubeBetween(STAR,NCLAMP,0.02,neutralWireMat);
const neutralSeg2=tubeBetween(NCLAMP,srcNeutral,0.02,neutralWireMat);
wireG.add(neutralSeg1);wireG.add(neutralSeg2);

// pinza amperimétrica (toroide) alrededor del neutro + lectura digital
const clamp=new THREE.Group();clamp.position.copy(NCLAMP);scene.add(clamp);
const clampRing=new THREE.Mesh(new THREE.TorusGeometry(0.11,0.028,12,28),brush(0x1a1c22));
clampRing.rotation.y=Math.PI/2;clamp.add(clampRing);
const clampBody=roundedBox(0.14,0.2,0.1,brush(0x20232b),0.03);
clampBody.position.set(0,0.2,0);clamp.add(clampBody);
clamp.userData={title:'Pinza amperimétrica en el neutro',info:'Mide directamente la corriente que retorna por el 4º hilo: |IN|.'};
addHoverLabel(clampRing,'Pinza en el neutro',NEU_HEX,new THREE.Vector3(NCLAMP.x,NCLAMP.z-0.02,0).set(NCLAMP.x,1.05,NCLAMP.z),0.9);
// lectura digital de la pinza
const clampCv=document.createElement('canvas');clampCv.width=256;clampCv.height=128;
const clampTex=new THREE.CanvasTexture(clampCv);
const clampScreen=new THREE.Mesh(new THREE.PlaneGeometry(0.34,0.17),new THREE.MeshBasicMaterial({map:clampTex,transparent:true}));
clampScreen.position.set(0,0.34,0.06);clamp.add(clampScreen);
function drawClamp(){
  const c=clampCv.getContext('2d');
  c.fillStyle='#0a0b10';c.fillRect(0,0,256,128);
  c.strokeStyle=NEU_HEX;c.lineWidth=3;c.strokeRect(3,3,250,122);
  const sy=curSys();
  c.fillStyle='#7a7360';c.font='bold 18px Outfit, sans-serif';c.textAlign='center';c.fillText('NEUTRO |IN|',128,30);
  c.fillStyle=sy.INmag<0.5?'#7CD992':NEU_HEX;c.font='bold 48px Outfit, monospace';
  c.fillText((mode==='reto'&&!retoChecked)?'-- A':fmtA1(sy.INmag),128,82);
  c.fillStyle='#5a5648';c.font='12px Outfit, sans-serif';c.fillText('4º hilo · retorno',128,110);
  clampTex.needsUpdate=true;
}

function refreshLoadGlow(){
  const sy=curSys();
  [sy.Ia,sy.Ib,sy.Ic].forEach((I,i)=>{loads[i].material.emissiveIntensity=0.12+0.7*Math.min(1,I/30);});
  const ng=Math.min(1,sy.INmag/30);
  neutralWireMat.emissiveIntensity=0.12+0.9*ng;
  neutralSeg1.scale.setScalar(1);neutralSeg2.scale.setScalar(1);
}

// ===================== 7. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Circuitos eléctricos CA (D1) · Desbalance trifásico</div>
  <h2>Desbalance Trifásico y Corriente por el Neutro</h2>
  <p>En un sistema trifásico de cuatro hilos (Y con neutro), tres cargas <b>independientes</b> —una por
  fase— rara vez drenan la misma corriente. Cuando están <b>desbalanceadas</b>, sus corrientes ya no se
  cancelan y el conductor de <b>neutro</b> transporta la diferencia de retorno. Esa corriente de neutro es
  la <b>suma fasorial</b> de las tres corrientes de fase (IN=IA+IB+IC), no su suma aritmética: como los
  fasores están a 120°, se cancelan en parte. Solo si la carga es perfectamente balanceada el neutro no
  lleva corriente (IN=0). Este laboratorio también introduce las <b>componentes simétricas</b>: toda terna
  desbalanceada se descompone en secuencia positiva (I1), negativa (I2) y cero (I0), con la relación
  central <b>IN=3·I0</b>.</p>
  <div class="formula">IN = IA+IB+IC (fasorial) · IN = 3·I0 · I1=(Ia+Ib+Ic)/3 · desbalance=|I2|/|I1| · balanceado ⇒ IN=0</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Corriente fase A (∠0°)</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Corriente fase B (∠−120°)</div>
    <div class="li"><span class="dot" style="background:#5b8dff"></span>Corriente fase C (∠+120°)</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Corriente de neutro IN</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> la corriente de neutro como suma fasorial exacta de tres corrientes de fase resistivas a 0°/−120°/+120° (IN=IA+IB+IC); el caso balanceado (Ia=Ib=Ic ⇒ IN=0) y el desbalanceado (IN≠0); la descomposición en componentes simétricas de Fortescue con I0=(IA+IB+IC)/3, I1 (positiva, = promedio de las tres para cargas resistivas), I2 (negativa) y la reconstrucción exacta IA=I0+I1+I2; la relación central IN=3·I0 y el factor de desbalance |I2|/|I1|. El contraste con la suma aritmética (la trampa clásica) está verificado numéricamente: la trampa queda siempre ≥15 A del valor real en el catálogo del Reto.</div>
    <div class="fl no"><b>NO modela:</b> desfase de las corrientes por cargas reactivas (aquí cada carga es resistiva, corriente en fase con su tensión de fase); impedancia del conductor de neutro y el corrimiento del punto de estrella que aparecería sin neutro o con neutro impedante; la elevación de tensión en fases con carga ligera; armónicos triples (3ª, 9ª…) que se SUMAN en el neutro y son la otra gran causa de sobrecarga del neutro en la práctica real; efectos térmicos del conductor. La fuente se supone rígida y perfectamente balanceada (VF=127 V constante).</div>
  </div>
  <div class="src">Ref: Fortescue (componentes simétricas) · Enríquez Harper · Hayt/Kemmerly/Durbin · NOM-001-SEDE-2022 (Art. 220, neutro) · Verificación numérica propia</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Desbalance trifásico · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_componentes">🔬 Componentes</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Reto de predicción</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar predicción</button></div>
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
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),3600);
}

// ===================== 9. MODOS Y CONTROLES =====================
const MODE_META={
  explora:{nombre:'Explora',cam:[[3.6,2.5,6.9],[0.4,1.05,0.1]],mision:'Ajusta las tres corrientes de fase (Ia, Ib, Ic) y observa cómo el neutro conduce su suma fasorial. Igualalas para ver IN→0; desbalancéalas para ver crecer el neutro.'},
  componentes:{nombre:'Componentes',cam:[[3.4,2.4,6.6],[0.3,1.1,0.0]],mision:'La misma carga descompuesta en componentes simétricas: positiva (I1), negativa (I2) y cero (I0). Comprueba que IN=3·I0 y que el balance anula I2 e I0.'},
  reto:{nombre:'Reto',cam:[[2.9,2.1,5.2],[1.9,0.9,0.9]],mision:'Carga desbalanceada sorteada con las corrientes fijas. Predice la magnitud de la corriente de neutro |IN| y comprueba tu estimación.'},
};

function lbl(t){return `<span class="lbl">${t}</span>`;}
function stepBtns(items,dataAttr,fmt){return items.map(it=>`<button class="b sm ${it.on?'on':''}" data-${dataAttr}="${it.v}">${fmt(it)}</button>`).join('');}
function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';
  let html='';
  if(mode==='reto'){
    // corrientes fijas (solo lectura) + steppers de predicción
    html+=lbl('Corrientes dadas:')+
      `<button class="b sm" data-lock="1" style="cursor:default">Ia=${retoIa} A</button>`+
      `<button class="b sm" data-lock="1" style="cursor:default">Ib=${retoIb} A</button>`+
      `<button class="b sm" data-lock="1" style="cursor:default">Ic=${retoIc} A</button>`;
    html+=lbl('Predicción |IN|:')+
      `<button class="b sm" data-pin="-2">−2</button>`+
      `<button class="b sm" data-pin="-0.5">−0.5</button>`+
      `<button class="b sm on" data-pin="0" style="cursor:default">${fmtA1(predIN)}</button>`+
      `<button class="b sm" data-pin="0.5">+0.5</button>`+
      `<button class="b sm" data-pin="2">+2</button>`;
    bar.innerHTML=html;
    bar.querySelectorAll('[data-pin]').forEach(b=>b.onclick=()=>{
      if(autoRunning)return;const d=parseFloat(b.dataset.pin);if(d===0)return;
      predIN=Math.max(0,Math.min(45,Math.round((predIN+d)*10)/10));
      retoChecked=false;retoOk=false;retoMsg='';synth.beep(d>0?720:560,0.05,0.04);afterEdit();
    });
    return;
  }
  // Explora / Componentes: 3 barras de corriente (comparten estado)
  html+=lbl('Ia (fase A):')+stepBtns(EXP_STEPS.map(v=>({v,on:v===expIa})),'ia',it=>it.v);
  html+=lbl('Ib (fase B):')+stepBtns(EXP_STEPS.map(v=>({v,on:v===expIb})),'ib',it=>it.v);
  html+=lbl('Ic (fase C):')+stepBtns(EXP_STEPS.map(v=>({v,on:v===expIc})),'ic',it=>it.v);
  bar.innerHTML=html;
  bar.querySelectorAll('[data-ia]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expIa=parseFloat(b.dataset.ia);synth.beep(660,0.05,0.04);afterEdit();});
  bar.querySelectorAll('[data-ib]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expIb=parseFloat(b.dataset.ib);synth.beep(660,0.05,0.04);afterEdit();});
  bar.querySelectorAll('[data-ic]').forEach(b=>b.onclick=()=>{if(autoRunning)return;expIc=parseFloat(b.dataset.ic);synth.beep(660,0.05,0.04);afterEdit();});
}

function updateScenarioInfo(){
  const box=el('scenarioInfo');
  if(mode!=='reto'){box.style.display='none';return;}
  box.style.display='block';
  box.innerHTML=`Carga desbalanceada: <b>Ia=${retoIa} A</b>, <b>Ib=${retoIb} A</b>, <b>Ic=${retoIc} A</b> (resistivas, a 0°/−120°/+120°). Predice la magnitud de la corriente de neutro <b>|IN|</b> (tolerancia ±${fmtA1(INtol(retoINtrue))}).`;
}

function setMode(k){
  mode=k;
  ['explora','componentes','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
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
    showToast('🔀 Nueva carga desbalanceada. Predice la corriente de neutro.');
  }else{
    do{expIa=pickFrom(EXP_STEPS);expIb=pickFrom(EXP_STEPS);expIc=pickFrom(EXP_STEPS);}
    while(expIa+expIb+expIc===0);
    afterEdit();showToast('🔀 Nueva carga en Explora: Ia='+expIa+', Ib='+expIb+', Ic='+expIc+' A.');
  }
  synth.beep(520,0.08,0.05);
}

// ===================== 10. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const t=el('tele'),sy=curSys();
  const bal=sy.INmag<0.5;
  let html=
    teleRow('Ia / Ib / Ic',fmtA1(sy.Ia)+' / '+fmtA1(sy.Ib)+' / '+fmtA1(sy.Ic))+
    teleRow('Suma aritmética (trampa)',fmtA1(sy.arith)+' ✗','warn')+
    teleRow('▸ Corriente de neutro |IN|',fmtA(sy.INmag),bal?'good':'warn')+
    teleRow('ángulo de IN',fmtDeg(sy.INang));
  if(mode==='componentes'){
    html+=
      teleRow('Positiva |I1|',fmtA(sy.I1mag))+
      teleRow('Negativa |I2|',fmtA(sy.I2mag))+
      teleRow('Cero |I0| (IN=3·I0)',fmtA(sy.I0mag))+
      teleRow('Desbalance |I2|/|I1|',fmtPct(sy.unbal),sy.unbal>0.2?'warn':'good');
  }else if(mode==='reto'){
    html+=
      teleRow('Tu predicción |IN|',fmtA1(predIN))+
      teleRow('Tolerancia',' ±'+fmtA1(INtol(retoINtrue)))+
      teleRow('Estado',retoChecked?(retoOk?'✔ CORRECTO':'✗ vuelve a estimar'):'Predice y comprueba',(retoChecked&&retoOk)?'good':'warn');
  }else{
    html+=
      teleRow('Secuencia cero |I0|',fmtA(sy.I0mag))+
      teleRow('Desbalance |I2|/|I1|',fmtPct(sy.unbal),sy.unbal>0.2?'warn':'good')+
      teleRow('¿Balanceado?',bal?'✔ sí — IN≈0':'✗ no — el neutro conduce',bal?'good':'warn');
  }
  t.innerHTML=html;
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  const sy=curSys();
  if(mode==='componentes'){
    html+=`<span class="mono">I1=${fmtA1(sy.I1mag)} (positiva) · I2=${fmtA1(sy.I2mag)} (negativa) · I0=${fmtA1(sy.I0mag)} (cero). IN=3·I0=${fmtA1(3*sy.I0mag)} coincide con |IN|=${fmtA1(sy.INmag)}. Desbalance |I2|/|I1|=${fmtPct(sy.unbal)}.</span>`;
  }else if(mode==='reto'){
    html+=retoMsg||`<span class="mono">Corrientes fijas Ia=${retoIa}, Ib=${retoIb}, Ic=${retoIc} A. La suma aritmética (${fmtA1(sy.arith)}) NO es la respuesta: predice la suma fasorial y comprueba.</span>`;
  }else{
    html+=`<span class="mono">Ia=${fmtA1(sy.Ia)}, Ib=${fmtA1(sy.Ib)}, Ic=${fmtA1(sy.Ic)} ⇒ |IN|=${fmtA1(sy.INmag)} ∠${fmtDeg(sy.INang)}. ${sy.INmag<0.5?'Balanceado: el neutro no lleva corriente.':'Suma aritmética sería '+fmtA1(sy.arith)+', pero el neutro real es '+fmtA1(sy.INmag)+' (los fasores se cancelan en parte).'}</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){drawBoard();drawClamp();updateTele();updateReport();refreshLoadGlow();}

// ===================== 11. RETO =====================
function updateRetoSpec(){
  el('retoSpec').innerHTML=`Carga desbalanceada fija: <b>Ia=${retoIa} A</b>, <b>Ib=${retoIb} A</b>, <b>Ic=${retoIc} A</b> (resistivas, a 0°/−120°/+120°). Estima la magnitud de la corriente que retorna por el neutro, <b>|IN|</b>, con los botones −/+ y pulsa "Comprobar predicción" (tolerancia ±${fmtA1(INtol(retoINtrue))}).`;
}
function checkReto(){
  const sy=up(retoIa,retoIb,retoIc);
  const err=Math.abs(predIN-sy.INmag),tol=INtol(sy.INmag);
  retoOk=err<=tol;retoChecked=true;solved=retoOk;
  synth.beep(retoOk?1046:220,retoOk?0.14:0.15,0.06);
  if(retoOk){
    retoMsg=`<span class="mono"><span class="ok">✔ Predicción correcta</span> — |IN|=${fmtA1(sy.INmag)} (predijiste ${fmtA1(predIN)}, error ${fmtA1(err)} ≤ ±${fmtA1(tol)}). El neutro conduce mucho menos que la suma aritmética (${fmtA1(sy.arith)}) porque los fasores a 120° se cancelan en parte. Recuerda: |IN|=3·|I0|=${fmtA1(3*sy.I0mag)}.</span>`;
  }else{
    const hi=predIN>sy.INmag;
    retoMsg=`<span class="mono"><span class="dtc">✗ Fuera de tolerancia</span> — |IN| real = ${fmtA1(sy.INmag)}, tu predicción ${fmtA1(predIN)} (error ${fmtA1(err)} > ±${fmtA1(tol)}). ${hi?'Sobreestimaste: quizá sumaste de más hacia la aritmética ('+fmtA1(sy.arith)+').':'Subestimaste: el desbalance es mayor de lo que parece.'} Suma los fasores punta-cola en el pizarrón.</span>`;
  }
  refreshAll();
}

// ===================== 12. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'Tres cargas resistivas drenan Ia=30 A, Ib=15 A, Ic=10 A. ¿Cuánto vale la corriente por el neutro y por qué NO es 55 A?',
      opciones:[
        {t:'≈18 A: la corriente de neutro es la suma FASORIAL de las tres (a 0°/−120°/+120°), y como los fasores apuntan en direcciones distintas se cancelan en parte; nunca es la suma aritmética 55 A.',ok:true,why:'Correcto: IN=IA+IB+IC como fasores; con 30,15,10 A a 120° el resultado es ≈18 A, muy por debajo de la suma aritmética 55 A.'},
        {t:'55 A: la corriente de neutro es la suma de las tres corrientes de fase.',ok:false,why:'Esa es la suma ARITMÉTICA, la trampa clásica. Las corrientes están a 120° entre sí, así que su suma es fasorial (vectorial) y da mucho menos.'},
        {t:'0 A: en todo sistema trifásico el neutro no lleva corriente.',ok:false,why:'Solo en BALANCEADO (Ia=Ib=Ic) el neutro es cero. Aquí la carga está desbalanceada, así que el neutro sí conduce.'},
        {t:'5 A: la corriente de neutro es la diferencia entre la fase mayor y la menor (30−25).',ok:false,why:'No es una simple resta de magnitudes; es la suma fasorial de los tres vectores, que da ≈18 A.'},
      ],
    },
    componentes:{
      pregunta:'¿Qué relación conecta la corriente de neutro con las componentes simétricas de las corrientes de fase?',
      opciones:[
        {t:'IN = 3·I0: la corriente de neutro es exactamente tres veces la componente de secuencia cero, porque I0=(IA+IB+IC)/3 e IN=IA+IB+IC.',ok:true,why:'Correcto: por definición I0 es el promedio de las tres corrientes; el neutro lleva su suma, que es 3·I0. Sin secuencia cero no hay corriente de neutro.'},
        {t:'IN = 3·I1: el neutro es tres veces la secuencia positiva.',ok:false,why:'La secuencia positiva (I1) es la parte balanceada útil; su suma fasorial en las tres fases es cero, no aparece en el neutro. El neutro es 3·I0.'},
        {t:'IN = I1 + I2: el neutro es la suma de las secuencias positiva y negativa.',ok:false,why:'Ni la positiva ni la negativa contribuyen al neutro (ambas suman cero en las tres fases). Solo la secuencia cero, y IN=3·I0.'},
        {t:'IN = I0 + I1 + I2: el neutro es la suma de las tres componentes.',ok:false,why:'Esa suma reconstruye la corriente de UNA fase (IA=I0+I1+I2), no la del neutro. El neutro es 3·I0.'},
      ],
    },
    reto:{
      pregunta:'Además del desbalance de cargas, ¿qué otra causa muy común hace que el neutro conduzca corriente incluso con fases "balanceadas" en magnitud?',
      opciones:[
        {t:'Los armónicos de orden triple (3ª, 9ª, 15ª…) de cargas no lineales: en lugar de cancelarse, se SUMAN en el neutro y pueden sobrecargarlo aunque las corrientes fundamentales estén balanceadas.',ok:true,why:'Correcto: los armónicos triples están en fase en las tres líneas (secuencia cero) y se suman en el neutro; por eso en instalaciones con muchas fuentes conmutadas el neutro puede llevar más corriente que las fases.'},
        {t:'Nada más: con magnitudes iguales el neutro siempre lleva cero.',ok:false,why:'Falso para cargas no lineales: aunque las magnitudes de la fundamental sean iguales, los armónicos triples se suman en el neutro. Es un caso real y peligroso.'},
        {t:'La resistencia del propio conductor de neutro genera la corriente.',ok:false,why:'La resistencia produce caída de tensión, no crea corriente. La corriente de neutro proviene del desbalance o de los armónicos de secuencia cero.'},
        {t:'La secuencia de fases ABC vs ACB cambia la corriente de neutro.',ok:false,why:'La secuencia afecta el sentido de giro de motores, no la corriente de neutro, que depende del desbalance y de los armónicos triples.'},
      ],
    },
  };
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
    if(o.userData&&o.userData.loadIndex!==undefined){
      if(mode==='reto'){showToast('🎯 En el Reto las corrientes están fijas. Predice |IN| con los controles −/+.');return;}
      const i=o.userData.loadIndex,cur=[expIa,expIb,expIc][i];
      const idx=(EXP_STEPS.indexOf(cur)+1)%EXP_STEPS.length,nv=EXP_STEPS[idx];
      if(i===0)expIa=nv;else if(i===1)expIb=nv;else expIc=nv;
      synth.beep(660,0.05,0.04);
      showToast('🔧 Carga fase '+'ABC'[i]+' → '+nv+' A. Observa cómo cambia la corriente de neutro.');
      afterEdit();return;
    }
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
    expIa=20;expIb=20;expIc=20;afterEdit();
    showToast('🧭 Explora: carga balanceada (20/20/20 A). Las tres corrientes se cancelan: la corriente de neutro es ≈0.');
    await sleep(3200);
    expIa=30;expIb=15;expIc=10;afterEdit();
    showToast('⚖️ Desbalanceamos (30/15/10 A): el neutro ahora conduce |IN|='+fmtA1(curSys().INmag)+' — pero NO 55 A (suma aritmética): los fasores se cancelan en parte.');
    await sleep(3600);
    answer(0);await sleep(2600);

    setMode('componentes');
    showToast('🔬 Componentes: la misma carga = positiva (I1) + negativa (I2) + cero (I0). Comprueba IN=3·I0='+fmtA1(3*curSys().I0mag)+'.');
    await sleep(3400);
    answer(0);await sleep(2600);

    setMode('reto');
    predIN=curSys().INmag;afterEdit();     // fijar predicción al valor real
    showToast('🎯 Reto: sumando los fasores punta-cola, |IN|≈'+fmtA1(curSys().INmag)+'. Ajustamos la predicción y comprobamos…');
    await sleep(3000);
    checkReto();await sleep(2600);
    answer(0);
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 15. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt,time)=>{
  const pulse=0.5+0.5*Math.sin(time*2.4);
  const sy=curSys();
  const ng=Math.min(1,sy.INmag/30);
  neutralWireMat.emissiveIntensity=0.12+0.9*ng*(0.7+0.3*pulse);
  [sy.Ia,sy.Ib,sy.Ic].forEach((I,i)=>{loads[i].material.emissiveIntensity=0.12+0.6*Math.min(1,I/30)+0.08*pulse*Math.min(1,I/30);});
});
['explora','componentes','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
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
  Ia:()=>curIa(), Ib:()=>curIb(), Ic:()=>curIc(),
  INmag:()=>curSys().INmag,
  INang:()=>curSys().INang,
  I0mag:()=>curSys().I0mag,
  I1mag:()=>curSys().I1mag,
  I2mag:()=>curSys().I2mag,
  unbal:()=>curSys().unbal,
  arith:()=>curSys().arith,
  setIa:v=>{if(mode!=='reto'){expIa=v;afterEdit();}},
  setIb:v=>{if(mode!=='reto'){expIb=v;afterEdit();}},
  setIc:v=>{if(mode!=='reto'){expIc=v;afterEdit();}},
  retoIa:()=>retoIa, retoIb:()=>retoIb, retoIc:()=>retoIc,
  retoINtrue:()=>retoINtrue,
  predIN:()=>predIN,
  setPred:v=>{predIN=Math.max(0,Math.min(45,v));retoChecked=false;retoOk=false;afterEdit();},
  tol:()=>INtol(retoINtrue),
  retoChecked:()=>retoChecked,
  retoOk:()=>retoOk,
  retoMsg:()=>retoMsg,
  checkReto:()=>checkReto(),
  newSignal:()=>newSignal(),
  setMode:k=>setMode(k),
  reportText:()=>el('report').innerText,
  quizAnswer:i=>answer(i),
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  solved:()=>solved,
};
