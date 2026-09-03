/* =====================================================================
   MEC-97 · d4-05 — Lógica neumática Y/O y temporización
   ---------------------------------------------------------------------
   El bloque MOTOR está pegado VERBATIM desde el verificador numérico
   scratchpad/verif_logica.mjs (181 comprobaciones, 0 fallos). No se toca
   aquí: si hay que cambiar física, se cambia en el verificador y se
   vuelve a pegar.

   Modelo:
   - La lógica neumática es ANALÓGICA: la válvula de simultaneidad
     entrega min(p1,p2) y la selectora max(p1,p2). El montaje sólo
     "funciona" si esa presión llega al umbral de pilotaje.
   - Caudal por ISO 6358 con relación crítica b = 0,45. El Qn de
     catálogo se mide de 7 a 6 bar absolutos, de ahí C = Qn/F_QN.
   - Temporizador = llenado del depósito a través del estrangulador,
     integrado numéricamente hasta el umbral de pilotaje.
   - El empalme en T da presión de nudo por equilibrio de caudales
     (bisección): entra por la fuente activa y sale por el escape de la
     otra válvula. Nunca es una solución válida.

   Ref: ISO 1219-1 (símbolos), ISO 6358 (caudal), ISO 8778 (aire ANR de
   referencia), ISO 15552 (parejas émbolo-vástago), ISO 4414 (seguridad),
   ISO 8573-1 (calidad del aire, citada), ISO 13851/EN 574 (mando a dos
   manos, citada y NO simulada).
   ===================================================================== */

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.4,3.0,7.6],target:[1.0,1.00,0.35],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.42,minD:3.0,maxD:18});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. MOTOR (verbatim del verificador) =====================
/* ===== MOTOR ===== */
const P_ANR=1.000, P_ATM=1.013;      // ISO 8778: aire de referencia ANR
const B_CRIT=0.45;                    // ISO 6358: relacion critica de presiones (rango 0,2-0,5)
const P_PILOT=2.5;                    // umbral de pilotaje estandar (criterio de fabricante, rango 1,5-3,0)
const P_PILOT_LP=1.2;                 // umbral del relevador de baja presion (rango 0,8-1,5)
const K_MIN=0.15;                     // apertura minima repetible del estrangulador (rango 0,10-0,20)
const P_CAIDA=1.0;                    // caida de red considerada en el proyecto (rango 0,5-1,5)
const C_ESTR=1.4;                     // conductancia sonica del estrangulador a plena apertura, l/(min*bar)
const E_AIRE=0.11;                    // kWh por m3 ANR a 7 bar (rango 0,10-0,12)
const CIL_ISO={32:12,40:16,50:20,63:20,80:25,100:25};   // ISO 15552: parejas embolo-vastago

const DEPOS=[
  {k:'d50',  V:0.05, rot:'50 cm³'},
  {k:'d100', V:0.10, rot:'100 cm³'},
  {k:'d250', V:0.25, rot:'250 cm³'},
  {k:'d500', V:0.50, rot:'500 cm³'},
  {k:'d1000',V:1.00, rot:'1000 cm³'},
];
const DEPK=DEPOS.map(d=>d.k);
const APERT=[0.10,0.15,0.25,0.40,0.60,0.80,1.00];

const ELEMS=[
  {k:'serie', fn:'Y', comps:0, rot:'Dos 3/2 en serie'},
  {k:'simult',fn:'Y', comps:1, rot:'Válvula de simultaneidad'},
  {k:'ampl',  fn:'Y', comps:2, rot:'Relevador + simultaneidad'},
  {k:'select',fn:'O', comps:1, rot:'Válvula selectora'},
  {k:'te',    fn:'O', comps:0, rot:'Empalme en T'},
];
const ELEMK=ELEMS.map(e=>e.k);
const EJES=['elem','dep','aper'];

const POOL=[
  {id:'prensa', nom:'Prensa de embutido', fn:'Y', pRed:6,
   ent:[{n:'Pulsador izquierdo',tipo:'organo',p:6,qn:100},{n:'Pulsador derecho',tipo:'organo',p:6,qn:100}],
   tMin:1.7, tMax:2.6, D:63, s:150, v:200,
   proc:'la matriz debe mantener la presión antes de abrir'},
  {id:'puerta', nom:'Puerta de horno', fn:'O', pRed:6,
   ent:[{n:'Pulsador de panel',tipo:'organo',p:6,qn:100},{n:'Pedal del puesto lejano',tipo:'organo',p:6,qn:350}],
   tMin:6, tMax:16, D:50, s:400, v:250,
   proc:'la puerta permanece abierta mientras se carga'},
  {id:'encolado', nom:'Estación de encolado', fn:'Y', pRed:6,
   ent:[{n:'Final de carrera a1',tipo:'senal',p:6,qn:100},{n:'Rama regulada a 2 bar',tipo:'senal',p:2,qn:100}],
   tMin:14, tMax:30, D:32, s:100, v:150,
   proc:'el adhesivo necesita fraguar con la pieza sujeta'},
  {id:'cabina', nom:'Cabina de pintura', fn:'Y', pRed:5,
   ent:[{n:'Final de carrera de puerta',tipo:'senal',p:5,qn:100},{n:'Presostato de línea',tipo:'senal',p:5,qn:100}],
   tMin:3, tMax:6.5, D:40, s:200, v:180,
   proc:'la purga barre el aire de la cabina antes de abrir'},
  {id:'alimentador', nom:'Alimentador vibrante', fn:'O', pRed:6,
   ent:[{n:'Pulsador de ciclo',tipo:'organo',p:6,qn:100},{n:'Señal de la célula',tipo:'senal',p:6,qn:100}],
   tMin:0.8, tMax:1.6, D:32, s:50, v:300,
   proc:'el empujador espera a que la pieza asiente'},
];

const ELEM=k=>ELEMS.find(e=>e.k===k);
const DEP =k=>DEPOS.find(d=>d.k===k);
const depIdx=k=>DEPK.indexOf(k);
const aperIdx=v=>APERT.indexOf(v);

const areaEmb=D=>Math.PI*D*D/400;                       // cm2
const areaAnu=D=>(Math.PI*D*D-Math.PI*CIL_ISO[D]*CIL_ISO[D])/400;

// --- ISO 6358: caudal masico expresado en l/min ANR ---
function qFlujo(C,p1abs,p2abs){
  if(p2abs>=p1abs)return 0;
  const r=p2abs/p1abs;
  if(r<=B_CRIT)return C*p1abs;
  const x=(r-B_CRIT)/(1-B_CRIT);
  return C*p1abs*Math.sqrt(Math.max(0,1-x*x));
}
// Qn de catalogo se mide de 7 a 6 bar absolutos: relaciona Qn con la conductancia sonica C
const F_QN=7*Math.sqrt(1-Math.pow((6/7-B_CRIT)/(1-B_CRIT),2));
const cDeQn=qn=>qn/F_QN;

// --- temporizador: llenado del deposito a traves del estrangulador ---
function tRetardo(V,k,pRed){
  const p1=pRed+P_ATM, pFin=P_PILOT+P_ATM;
  if(p1<=pFin)return Infinity;
  const C=C_ESTR*k, N=4000, dp=(pFin-P_ATM)/N;
  let p=P_ATM, t=0;
  for(let i=0;i<N;i++){
    const q=qFlujo(C,p1,p+dp/2);
    if(q<=0)return Infinity;
    t+=(V/P_ANR)*dp/q;
    p+=dp;
  }
  return t*60;
}
// --- nudo del empalme en T: entra por la fuente activa y sale por el escape de la otra ---
function pNodo(pAct,Ca,Ce){
  const p1=pAct+P_ATM;
  let lo=P_ATM, hi=p1;
  for(let i=0;i<70;i++){
    const m=(lo+hi)/2;
    if(qFlujo(Ca,p1,m)>qFlujo(Ce,m,P_ATM))lo=m;else hi=m;
  }
  return (lo+hi)/2-P_ATM;
}
function fugaTe(sc){
  const [a,b]=sc.ent, Ca=cDeQn(a.qn), Cb=cDeQn(b.qn);
  const pA=pNodo(a.p,Ca,Cb), pB=pNodo(b.p,Cb,Ca);
  return {pA,pB,pMin:Math.min(pA,pB),
          qA:qFlujo(Cb,pA+P_ATM,P_ATM), qB:qFlujo(Ca,pB+P_ATM,P_ATM)};
}
function pSalida(sc,ek){
  const [a,b]=sc.ent, pmin=Math.min(a.p,b.p), pmax=Math.max(a.p,b.p);
  if(ek==='simult')return pmin;
  if(ek==='select')return pmax;
  if(ek==='serie') return sc.pRed;
  if(ek==='ampl')  return pmin>=P_PILOT_LP?Math.min(sc.pRed,pmax):0;
  return fugaTe(sc).pMin;
}
const serieVale=sc=>sc.ent.every(e=>e.tipo==='organo'&&e.p===sc.pRed);

function evalCfg(sc,cfg){
  const E=ELEM(cfg.elem), V=DEP(cfg.dep).V, k=cfg.aper;
  const okFunc=E.fn===sc.fn;
  const okTopo=E.k!=='serie'||serieVale(sc);
  const pOut=pSalida(sc,E.k);
  const okPres=pOut>=P_PILOT-1e-9;
  const okFuga=E.k!=='te';
  const t=tRetardo(V,k,sc.pRed), tD=tRetardo(V,k,sc.pRed-P_CAIDA);
  const okVent=t>=sc.tMin-1e-9&&t<=sc.tMax+1e-9;
  const okRob=tD<=sc.tMax+1e-9;
  const okK=k>=K_MIN-1e-9;
  const vale=okFunc&&okTopo&&okPres&&okFuga&&okVent&&okRob&&okK;
  const margen=Math.min(t/sc.tMin,sc.tMax/tD);
  return {okFunc,okTopo,okPres,okFuga,okVent,okRob,okK,vale,pOut,t,tD,margen,
          comps:E.comps,coste:[E.comps,depIdx(cfg.dep),-margen]};
}
function cmpCoste(a,b){
  for(let i=0;i<3;i++){const d=a[i]-b[i];if(Math.abs(d)>1e-9)return d<0?-1:1;}
  return 0;
}
function elemVale(sc,ek){
  const E=ELEM(ek);
  return E.fn===sc.fn && (ek!=='serie'||serieVale(sc)) && pSalida(sc,ek)>=P_PILOT-1e-9 && ek!=='te';
}
function tempVale(sc,V,k){
  if(k<K_MIN-1e-9)return false;
  const t=tRetardo(V,k,sc.pRed), tD=tRetardo(V,k,sc.pRed-P_CAIDA);
  return t>=sc.tMin-1e-9&&t<=sc.tMax+1e-9&&tD<=sc.tMax+1e-9;
}
function GOOD(sc){
  const elem=ELEMK.filter(k=>elemVale(sc,k)).sort((x,y)=>ELEM(x).comps-ELEM(y).comps)[0];
  let dep=null,aper=null,mej=-1;
  for(const d of DEPOS){
    const oks=APERT.filter(k=>tempVale(sc,d.V,k));
    if(!oks.length)continue;
    dep=d.k;
    for(const k of oks){
      const m=Math.min(tRetardo(d.V,k,sc.pRed)/sc.tMin,sc.tMax/tRetardo(d.V,k,sc.pRed-P_CAIDA));
      if(m>mej){mej=m;aper=k;}
    }
    break;
  }
  return {elem,dep,aper};
}
const cfgWith=(g,eje,v)=>({elem:g.elem,dep:g.dep,aper:g.aper,[eje]:v});
function okEje(sc,eje,v){
  const g=GOOD(sc), c=cfgWith(g,eje,v), e=evalCfg(sc,c);
  return e.vale&&cmpCoste(e.coste,evalCfg(sc,g).coste)===0;
}
// --- diagnostico por eje ---
const compTxt=n=>n===1?'1 componente':n+' componentes';
function porQue(sc,eje,v){
  const g=GOOD(sc), c=cfgWith(g,eje,v), e=evalCfg(sc,c);
  if(okEje(sc,eje,v))return '';
  if(eje==='elem'){
    const E=ELEM(v);
    if(!e.okFunc)return `El montaje «${E.rot.toLowerCase()}» realiza la función ${E.fn} y la estación pide la función ${sc.fn}.`;
    if(!e.okFuga)return `El empalme en T fuga sin parar mientras se mantiene la señal: ${f1(fugaTe(sc).qA,0)} l/min ANR por el escape de la otra válvula.`;
    if(!e.okTopo)return `En serie sólo se pueden encadenar dos órganos alimentados por la misma línea; aquí al menos una entrada es una señal ya generada.`;
    if(!e.okPres)return `La salida se queda en ${f1(e.pOut,2)} bar y el pilotaje necesita ${f1(P_PILOT,1)}.`;
    return `Vale, pero monta ${compTxt(E.comps)} frente a ${compTxt(ELEM(g.elem).comps)} de la solución mínima: ${ELEM(g.elem).rot.toLowerCase()}.`;
  }
  if(eje==='dep'){
    const V=DEP(v).V;
    if(!APERT.some(k=>tempVale(sc,V,k))){
      const tMax_=tRetardo(V,K_MIN,sc.pRed), tMin_=tRetardo(V,1.0,sc.pRed);
      if(tMax_<sc.tMin)return `Con ${DEP(v).rot} el retardo no pasa de ${f1(tMax_,2)} s ni con el estrangulador en ${f1(K_MIN,2)}, y el proceso pide ${f1(sc.tMin,2)} s.`;
      return `Con ${DEP(v).rot} el retardo no baja de ${f1(tMin_,2)} s ni abriendo del todo, o se pasa de ${f1(sc.tMax,2)} s al caer la red.`;
    }
    return `Vale, pero ${DEP(g.dep).rot} también cumple y llena menos aire: ese depósito gasta ${f1(V*P_PILOT,2)} l ANR por ciclo y el mínimo se queda en ${f1(DEP(g.dep).V*P_PILOT,2)} l.`;
  }
  if(!e.okK)return `Por debajo de ${f1(K_MIN,2)} el estrangulador deja de repetir: el mismo tornillo da retardos distintos cada día.`;
  if(!e.okVent&&e.t<sc.tMin)return `El retardo se queda en ${f1(e.t,2)} s y el proceso pide al menos ${f1(sc.tMin,2)} s.`;
  if(!e.okVent)return `El retardo sube a ${f1(e.t,2)} s y el proceso admite ${f1(sc.tMax,2)} s como mucho.`;
  if(!e.okRob)return `A ${f1(sc.pRed,1)} bar da ${f1(e.t,2)} s, pero si la red cae ${f1(P_CAIDA,1)} bar sube a ${f1(e.tD,2)} s y se pasa de ${f1(sc.tMax,2)}.`;
  return `Vale, pero deja un margen de ×${f1(e.margen,3)} y la apertura ${f1(g.aper,2)} deja ×${f1(evalCfg(sc,g).margen,3)}.`;
}
function ciclo(sc,cfg){
  const aE=areaEmb(sc.D), aA=areaAnu(sc.D);
  const tIda=sc.s/sc.v, tVue=tIda*aA/aE, tT=evalCfg(sc,cfg).t;
  const total=tIda+tT+tVue;
  const consCil=(aE+aA)*(sc.s/10)*((sc.pRed+P_ATM)/P_ANR)/1000;
  const consDep=DEP(cfg.dep).V*P_PILOT/P_ANR;
  return {tIda,tT,tVue,total,ciclosH:3600/total,consCil,consDep,
          consTot:consCil+consDep, pctDep:100*consDep/(consCil+consDep)};
}
// Formato SI/ISO 80000 en español: coma decimal y espacio fino de millares
// (el punto de millares sería ambiguo para un lector que usa punto decimal).
const f1=(x,n)=>{
  if(!isFinite(x))return '∞';
  const s=Math.abs(x).toFixed(n), p=s.split('.');
  return (x<0?'-':'')+p[0].replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(p[1]?','+p[1]:'');
};
/* ===== FIN MOTOR ===== */

// ===================== 3. ESTADO =====================
const ANIM_CICLO=6.0;   // el banco conserva las PROPORCIONES del ciclo, no cronometra
let mode='logica';
let lgIdx=3, lgElem='simult';
let tmIdx=2, tmDep='d250', tmAper=0.25;
let fgIdx=1;
let retoK=0, retoCh=null;
let retoChecked=false, retoOkElem=false, retoOkDep=false, retoOkAper=false, retoSolved=false, retoMsg='';
let solved=false, autoRunning=false, QUIZ={};
let animT=0, animP=0, animLlen=0, animFase='espera';

function pickIdx(n,ex){if(n<=1)return 0;let i=ex;while(i===ex)i=Math.floor(Math.random()*n);return i;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}

function startCfg(sc){
  const g=GOOD(sc);
  return {
    elem:ELEMK.find(k=>k!==g.elem),
    dep:DEPK.slice().reverse().find(k=>k!==g.dep),
    aper:APERT.slice().reverse().find(v=>v!==g.aper),
  };
}
const retoSc=()=>POOL[retoK];
const retoCfg=()=>({elem:retoCh.elem,dep:retoCh.dep,aper:retoCh.aper});
function seedReto(k){
  retoK=(k==null)?pickIdx(POOL.length,retoK):k;
  retoCh=startCfg(retoSc());
  retoChecked=false;retoOkElem=false;retoOkDep=false;retoOkAper=false;retoSolved=false;retoMsg='';
}
seedReto(0);

function curSc(){
  if(mode==='logica')return POOL[lgIdx];
  if(mode==='tiempo')return POOL[tmIdx];
  if(mode==='fuga')return POOL[fgIdx];
  return retoSc();
}
function curCfg(){
  const sc=curSc(), g=GOOD(sc);
  if(mode==='logica')return {elem:lgElem,dep:g.dep,aper:g.aper};
  if(mode==='tiempo')return {elem:g.elem,dep:tmDep,aper:tmAper};
  if(mode==='fuga')return {elem:'te',dep:g.dep,aper:g.aper};
  return retoCfg();
}
const curEval=()=>evalCfg(curSc(),curCfg());
const curCiclo=()=>ciclo(curSc(),curCfg());

const CRIT=[
  {k:'okFunc',rot:'Función Y/O',det:'El montaje realiza la función que pide la estación.'},
  {k:'okTopo',rot:'Topología válida',det:'La serie sólo encadena dos órganos de la misma línea.'},
  {k:'okPres',rot:'Presión de pilotaje',det:'La salida llega al umbral de 2,5 bar.'},
  {k:'okFuga',rot:'Sin fuga permanente',det:'El montaje no descarga a la atmósfera mientras se mantiene la señal.'},
  {k:'okVent',rot:'Ventana de tiempo',det:'El retardo cae dentro de la ventana del proceso.'},
  {k:'okRob',rot:'Aguanta la caída',det:'Con la red 1 bar más baja el retardo sigue dentro de la ventana.'},
  {k:'okK',rot:'Apertura repetible',det:'El estrangulador queda por encima de su mínimo repetible.'},
];

// ===================== 4. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
const MAT={
  bench:brush(0x2b2f34), frame:brush(0x22262c), leg:brush(0x14161b),
  body:std(0x1b2028,0.6,0.25), barrel:std(0x9aa4b2,0.35,0.75), rod:std(0xd6dde8,0.22,0.9),
  valve:std(0x14171b,0.5,0.3), valve2:std(0x1a1f26,0.5,0.3), plate:brush(0x3a4048),
  spool:std(0xb9c3d1,0.3,0.85), carga:std(0x3a2f24,0.7,0.15), post:brush(0x2a3038),
  tuboA:std(0x4a90d9,0.4,0.4), tuboB:std(0xC08CF8,0.4,0.4), tuboP:std(0x8f97a5,0.45,0.5),
  dep:std(0x2f3a48,0.35,0.55), knob:std(0xE9C46A,0.45,0.35),
};
const AZUL='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A', VIO='#C08CF8', GRIS='#8f97a5';

const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const cv=document.createElement('canvas');cv.width=256;cv.height=64;
  const c=cv.getContext('2d');
  c.fillStyle='rgba(8,10,14,0.86)';c.fillRect(0,0,256,64);
  c.strokeStyle=color||AZUL;c.lineWidth=2;c.strokeRect(1,1,254,62);
  c.fillStyle=color||'#F4EFEA';c.font='bold 22px Outfit, sans-serif';c.textAlign='center';c.textBaseline='middle';
  c.fillText(text,128,32);
  const tex=new THREE.CanvasTexture(cv);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true}));
  spr.scale.set(scale||0.62,(scale||0.62)/4,1);
  spr.position.set(pos[0],pos[1],pos[2]);
  spr.renderOrder=999;spr.visible=false;
  scene.add(spr);HOVER_LABELS.set(obj,spr);
}

// ===================== 5. PIZARRÓN =====================
const boardG=new THREE.Group();
boardG.position.set(-1.35,0,-0.95);boardG.rotation.y=0.22;scene.add(boardG);
const frame=roundedBox(3.9,2.9,0.12,MAT.frame,0.06);frame.position.set(0,1.9,0);boardG.add(frame);
[-1.65,1.65].forEach(x=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.9,16),MAT.leg);leg.position.set(x,0.92,0);boardG.add(leg);});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.68,2.72),new THREE.MeshBasicMaterial({map:bTex}));
board.position.set(0,1.9,0.065);boardG.add(board);

function bg(c){c.fillStyle='#0c1016';c.fillRect(0,0,1024,768);}
function rpanel(c,x,y,w,h,title){
  c.fillStyle=hexA(AZUL,0.06);c.fillRect(x,y,w,h);
  c.strokeStyle=hexA(AZUL,0.22);c.lineWidth=1;c.strokeRect(x,y,w,h);
  c.fillStyle='#C7D6F5';c.font='bold 15px Outfit, sans-serif';c.textAlign='left';c.fillText(title,x+16,y+26);
}
function prow(c,x,y,w,l,v,col){
  c.fillStyle=GRIS;c.font='13px Outfit, sans-serif';c.textAlign='left';c.fillText(l,x+16,y);
  c.fillStyle=col||'#F4EFEA';c.font='bold 15px Outfit, sans-serif';c.textAlign='right';c.fillText(v,x+w-14,y);
}
function wrapText(c,text,x,y,maxW,lh){
  const words=String(text).split(' ');let line='',yy=y;
  for(const w of words){const test=line+w+' ';
    if(c.measureText(test).width>maxW&&line){c.fillText(line,x,yy);line=w+' ';yy+=lh;}else line=test;}
  c.fillText(line,x,yy);return yy;
}
function title2(c,t,sub){
  c.fillStyle='#F4EFEA';c.font='bold 26px Outfit, sans-serif';c.textAlign='left';c.fillText(t,30,54);
  c.fillStyle=GRIS;c.font='14px Outfit, sans-serif';wrapText(c,sub,30,80,660,20);
}
function nota(c,y,txt,col){
  c.fillStyle=hexA(col||WARN_HEX,0.08);c.fillRect(30,y,650,78);
  c.strokeStyle=hexA(col||WARN_HEX,0.30);c.lineWidth=1;c.strokeRect(30,y,650,78);
  c.fillStyle=col||WARN_HEX;c.font='13px Outfit, sans-serif';c.textAlign='left';wrapText(c,txt,46,y+24,618,19);
}
const PX={x:706,y:70,w:300};
function hbar(c,x,y,w,h,frac,col){
  c.fillStyle=hexA('#8f97a5',0.16);c.fillRect(x,y,w,h);
  c.fillStyle=col;c.fillRect(x,y,Math.max(0,Math.min(1,frac))*w,h);
  c.strokeStyle=hexA(col,0.55);c.lineWidth=1;c.strokeRect(x,y,w,h);
}
function marca(c,x,y,w,h,frac,col,txt){
  const xx=x+Math.max(0,Math.min(1,frac))*w;
  c.strokeStyle=col;c.lineWidth=2;c.setLineDash([3,3]);
  c.beginPath();c.moveTo(xx,y-3);c.lineTo(xx,y+h+3);c.stroke();c.setLineDash([]);
  if(txt){c.fillStyle=col;c.font='11px Outfit, sans-serif';c.textAlign='center';c.fillText(txt,xx,y-6);}
}
function tabla(c,x,y,w,cols,widths,rows,heads){
  const rh=30;
  c.fillStyle=hexA(AZUL,0.10);c.fillRect(x,y,w,rh);
  let cx=x;
  c.font='bold 13px Outfit, sans-serif';c.textBaseline='middle';
  cols.forEach((t,i)=>{c.fillStyle='#C7D6F5';c.textAlign=i===0?'left':'center';
    c.fillText(t,i===0?cx+12:cx+widths[i]/2,y+rh/2);cx+=widths[i];});
  rows.forEach((r,ri)=>{
    const yy=y+rh+ri*rh;
    if(ri%2===0){c.fillStyle=hexA('#8f97a5',0.05);c.fillRect(x,yy,w,rh);}
    if(r.hl){c.fillStyle=hexA(r.hl,0.14);c.fillRect(x,yy,w,rh);}
    let xx=x;
    r.c.forEach((t,i)=>{
      c.font=(i===0?'bold 13px':'13px')+' Outfit, sans-serif';
      c.fillStyle=(r.cols&&r.cols[i])||'#F4EFEA';
      c.textAlign=i===0?'left':'center';
      c.fillText(t,i===0?xx+12:xx+widths[i]/2,yy+rh/2);xx+=widths[i];
    });
  });
  c.textBaseline='alphabetic';
  c.strokeStyle=hexA(AZUL,0.18);c.lineWidth=1;c.strokeRect(x,y,w,rh+rows.length*rh);
  return y+rh+rows.length*rh;
}

// ===================== 6. SÍMBOLOS ISO 1219 =====================
function conducto(c,x1,y1,x2,y2,col,dash){
  c.strokeStyle=col;c.lineWidth=2;if(dash)c.setLineDash(dash);
  c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);
}
function texto(c,t,x,y,col,font,align){
  c.fillStyle=col;c.font=font||'12px Outfit, sans-serif';c.textAlign=align||'center';c.fillText(t,x,y);
}
// valvula 3/2 monoestable (dos casillas)
function simb32(c,x,y,w,h,col,rot,activa){
  const cw=w/2;
  c.strokeStyle=col;c.lineWidth=2;
  c.strokeRect(x,y,w,h);
  c.beginPath();c.moveTo(x+cw,y);c.lineTo(x+cw,y+h);c.stroke();
  // casilla de reposo: cerrada + escape ; casilla activa: paso
  c.lineWidth=1.6;
  c.beginPath();c.moveTo(x+cw+6,y+h-8);c.lineTo(x+w-8,y+8);c.stroke();
  c.beginPath();c.moveTo(x+8,y+h-8);c.lineTo(x+8,y+h-16);c.lineTo(x+cw-8,y+h-16);c.stroke();
  // muelle a la derecha
  c.beginPath();
  for(let i=0;i<5;i++){c.moveTo(x+w+2+i*3,y+h/2-5);c.lineTo(x+w+4+i*3,y+h/2+5);}
  c.stroke();
  // accionamiento manual a la izquierda
  c.beginPath();c.moveTo(x-4,y+h/2);c.lineTo(x-16,y+h/2-9);c.stroke();
  c.beginPath();c.arc(x-4,y+h/2,2.4,0,6.3);c.fillStyle=col;c.fill();
  if(activa){c.strokeStyle=hexA(OK_HEX,0.9);c.lineWidth=3;c.strokeRect(x-1,y-1,w+2,h+2);}
  if(rot)texto(c,rot,x+w/2,y+h+18,col,'11px Outfit, sans-serif');
}
// valvula logica: cuadro con bola que bloquea una entrada.
// fn='Y' -> la bola bloquea la entrada de MAYOR presion (sale la menor)
// fn='O' -> la bola bloquea la entrada de MENOR presion (sale la mayor)
function simbLog(c,x,y,s,fn,pA,pB,col){
  c.strokeStyle=col;c.lineWidth=2;c.strokeRect(x,y,s,s);
  const xa=x+s*0.28, xb=x+s*0.72, yb=y+s;
  conducto(c,xa,yb,xa,yb+16,col);
  conducto(c,xb,yb,xb,yb+16,col);
  conducto(c,x+s/2,y,x+s/2,y-16,col);
  // asiento y bola
  const bloqA=(fn==='Y')?(pA>=pB):(pA<pB);
  const bx=bloqA?xa:xb;
  c.beginPath();c.arc(bx,y+s*0.72,s*0.13,0,6.3);
  c.fillStyle=hexA(BAD_HEX,0.85);c.fill();c.strokeStyle=col;c.lineWidth=1.5;c.stroke();
  // paso libre desde la otra entrada
  const px=bloqA?xb:xa;
  conducto(c,px,y+s*0.88,px,y+s*0.30,hexA(OK_HEX,0.9));
  conducto(c,px,y+s*0.30,x+s/2,y+s*0.16,hexA(OK_HEX,0.9));
  texto(c,fn==='Y'?'∧':'∨',x+s/2,y+s*0.55,col,'bold 22px Outfit, sans-serif');
  texto(c,'X',xa,yb+30,GRIS,'11px Outfit, sans-serif');
  texto(c,'Y',xb,yb+30,GRIS,'11px Outfit, sans-serif');
  texto(c,'A',x+s/2,y-22,GRIS,'11px Outfit, sans-serif');
}
// empalme en T con la fuga hacia el escape de la otra valvula
function simbTe(c,x,y,s,col){
  const cx=x+s/2, cy=y+s/2;
  conducto(c,x,cy,x+s,cy,col);
  conducto(c,cx,cy,cx,y-16,col);
  c.beginPath();c.arc(cx,cy,4,0,6.3);c.fillStyle=col;c.fill();
  texto(c,'A',cx,y-22,GRIS,'11px Outfit, sans-serif');
}
// triangulo de escape a la atmosfera
function simbEscape(c,x,y,r,col){
  c.beginPath();c.moveTo(x-r,y);c.lineTo(x+r,y);c.lineTo(x,y+r*1.4);c.closePath();
  c.fillStyle=hexA(col,0.75);c.fill();c.strokeStyle=col;c.lineWidth=1.4;c.stroke();
}
// estrangulador regulable
function simbEstr(c,x,y,w,h,k,col){
  conducto(c,x,y+h/2,x+w,y+h/2,col);
  c.strokeStyle=col;c.lineWidth=2;
  c.beginPath();c.moveTo(x+w*0.34,y);c.lineTo(x+w*0.44,y+h*0.34);c.stroke();
  c.beginPath();c.moveTo(x+w*0.66,y+h);c.lineTo(x+w*0.56,y+h*0.66);c.stroke();
  // flecha de regulacion
  const fl=hexA(k<K_MIN?BAD_HEX:WARN_HEX,0.95);
  c.strokeStyle=fl;c.lineWidth=2;
  c.beginPath();c.moveTo(x+w*0.18,y+h*1.05);c.lineTo(x+w*0.82,y-h*0.10);c.stroke();
  texto(c,'k = '+f1(k,2),x+w/2,y+h+26,k<K_MIN?BAD_HEX:WARN_HEX,'bold 12px Outfit, sans-serif');
}
// deposito de temporizacion
function simbDep(c,x,y,w,h,frac,col){
  c.strokeStyle=col;c.lineWidth=2;c.strokeRect(x,y,w,h);
  c.fillStyle=hexA(AZUL,0.30);c.fillRect(x+2,y+h-2-(h-4)*frac,w-4,(h-4)*frac);
  conducto(c,x,y+h/2,x-14,y+h/2,col);
  conducto(c,x+w,y+h/2,x+w+14,y+h/2,col);
}
// cilindro de doble efecto con embolo en frac
function simbCil(c,x,y,w,h,frac,col){
  c.strokeStyle=col;c.lineWidth=2;c.strokeRect(x,y,w,h);
  const px=x+8+(w-30)*frac;
  c.fillStyle=hexA(col,0.55);c.fillRect(px,y+3,8,h-6);
  c.lineWidth=3;c.beginPath();c.moveTo(px+8,y+h/2);c.lineTo(x+w+26,y+h/2);c.stroke();
  c.fillStyle=hexA(WARN_HEX,0.6);c.fillRect(x+w+26,y+h*0.18,14,h*0.64);
}

// ===================== 7. VISTAS DEL PIZARRÓN =====================
function colOk(b){return b?OK_HEX:BAD_HEX;}
function fnTxt(f){return f==='Y'?'Y (las dos)':'O (cualquiera)';}

function drawCircLog(c,x0,y0,W,H,sc,ek){
  c.fillStyle=hexA(AZUL,0.04);c.fillRect(x0,y0,W,H);
  c.strokeStyle=hexA(AZUL,0.16);c.lineWidth=1;c.strokeRect(x0,y0,W,H);
  const [a,b]=sc.ent, E=ELEM(ek), pOut=pSalida(sc,ek);
  const yV=y0+H-72, xa=x0+70, xb=x0+200;
  simb32(c,xa-22,yV,44,38,GRIS,null,true);
  simb32(c,xb-22,yV,44,38,GRIS,null,true);
  texto(c,f1(a.p,0)+' bar',xa,yV+62,AZUL,'bold 12px Outfit, sans-serif');
  texto(c,f1(b.p,0)+' bar',xb,yV+62,VIO,'bold 12px Outfit, sans-serif');
  texto(c,a.n.length>18?a.n.slice(0,17)+'…':a.n,xa,yV+78,GRIS,'10px Outfit, sans-serif');
  texto(c,b.n.length>18?b.n.slice(0,17)+'…':b.n,xb,yV+78,GRIS,'10px Outfit, sans-serif');
  const xm=x0+352, ym=y0+72;
  if(ek==='serie'){
    conducto(c,xa,yV,xa,ym+40,AZUL);
    conducto(c,xa,ym+40,xb,ym+40,AZUL);
    conducto(c,xb,ym+40,xb,yV,AZUL);
    conducto(c,xb+24,yV+19,xm+40,yV+19,hexA(OK_HEX,0.9));
    conducto(c,xm+40,yV+19,xm+40,ym+18,hexA(OK_HEX,0.9));
    texto(c,'la salida de la primera alimenta la segunda',x0+W/2,ym+24,GRIS,'12px Outfit, sans-serif');
  }else if(ek==='te'){
    const fu=fugaTe(sc);
    conducto(c,xa,yV,xa,ym+50,AZUL);
    conducto(c,xb,yV,xb,ym+50,VIO);
    simbTe(c,xa-6,ym+34,(xb-xa)+12,GRIS);
    simbEscape(c,xa,yV-6,9,BAD_HEX);
    simbEscape(c,xb,yV-6,9,BAD_HEX);
    conducto(c,(xa+xb)/2,ym+18,xm+40,ym+18,hexA(BAD_HEX,0.9),[5,4]);
    texto(c,'fuga '+f1(Math.max(fu.qA,fu.qB),0)+' l/min ANR por el escape de la otra',x0+W/2,y0+H-14,BAD_HEX,'12px Outfit, sans-serif');
  }else if(ek==='ampl'){
    conducto(c,xa,yV,xa,ym+66,AZUL);
    conducto(c,xb,yV,xb,ym+66,VIO);
    simbLog(c,(xa+xb)/2-26,ym+66,52,'Y',a.p,b.p,GRIS);
    const okLp=Math.min(a.p,b.p)>=P_PILOT_LP;
    c.strokeStyle=okLp?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(xm-4,ym+2,84,44);
    texto(c,'relevador',xm+38,ym+20,okLp?OK_HEX:BAD_HEX,'bold 12px Outfit, sans-serif');
    texto(c,'pilota a '+f1(P_PILOT_LP,1)+' bar',xm+38,ym+36,GRIS,'10px Outfit, sans-serif');
    conducto(c,(xa+xb)/2,ym+50,xm-4,ym+24,GRIS);
    conducto(c,xm+80,ym+24,xm+40,ym+24,okLp?hexA(OK_HEX,0.9):hexA(BAD_HEX,0.9));
    texto(c,'línea '+f1(sc.pRed,0)+' bar',xm+120,ym+28,GRIS,'11px Outfit, sans-serif');
  }else{
    conducto(c,xa,yV,xa,ym+66,AZUL);
    conducto(c,xb,yV,xb,ym+66,VIO);
    simbLog(c,(xa+xb)/2-26,ym+66,52,E.fn,a.p,b.p,GRIS);
    conducto(c,(xa+xb)/2,ym+50,xm+40,ym+50,hexA(OK_HEX,0.9));
    conducto(c,xm+40,ym+50,xm+40,ym+18,hexA(OK_HEX,0.9));
  }
  // salida hacia el pilotaje
  const okP=pOut>=P_PILOT-1e-9;
  c.strokeStyle=okP?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(xm+96,ym-2,150,42);
  texto(c,'pilotaje ≥ '+f1(P_PILOT,1)+' bar',xm+171,ym+16,GRIS,'11px Outfit, sans-serif');
  texto(c,f1(pOut,2)+' bar',xm+171,ym+33,okP?OK_HEX:BAD_HEX,'bold 15px Outfit, sans-serif');
  conducto(c,xm+40,ym+18,xm+96,ym+18,okP?hexA(OK_HEX,0.9):hexA(BAD_HEX,0.9));
  texto(c,E.rot,x0+W/2,y0+24,'#F4EFEA','bold 15px Outfit, sans-serif');
}

function drawLogica(c){
  const sc=POOL[lgIdx], E=ELEM(lgElem), e=evalCfg(sc,curCfg()), fu=fugaTe(sc);
  const [a,b]=sc.ent, pOut=pSalida(sc,lgElem);
  title2(c,'Lógica neumática: el 1 lógico vale una PRESIÓN',
    'En neumática la función Y/O no la decide el símbolo: la decide la presión que sale del montaje. La simultaneidad entrega la MENOR de las dos entradas y la selectora la MAYOR. Si esa presión no llega al umbral de pilotaje, la señal existe y la máquina no se mueve.');
  drawCircLog(c,30,124,650,196,sc,lgElem);
  const rows=ELEMK.map(k=>{
    const E2=ELEM(k), p=pSalida(sc,k), ok=elemVale(sc,k);
    let ver='Vale';
    if(E2.fn!==sc.fn)ver='Función equivocada';
    else if(k==='te')ver='Fuga permanente';
    else if(k==='serie'&&!serieVale(sc))ver='Topología imposible';
    else if(p<P_PILOT-1e-9)ver='No llega al pilotaje';
    return {c:[E2.rot,E2.fn,String(E2.comps),f1(p,2)+' bar',ver],
      cols:[null,E2.fn===sc.fn?OK_HEX:BAD_HEX,null,p>=P_PILOT-1e-9?OK_HEX:BAD_HEX,ok?OK_HEX:BAD_HEX],
      hl:k===lgElem?AZUL:null};
  });
  tabla(c,30,340,650,['Montaje','Fn','Comp.','Presión de salida','Veredicto'],[214,54,66,138,178],rows);
  const g=GOOD(sc);
  nota(c,532,'La solución mínima de esta estación es «'+ELEM(g.elem).rot.toLowerCase()+'» ('+compTxt(ELEM(g.elem).comps)+'). '+
    (g.elem==='serie'?'Dos 3/2 en serie hacen la función Y sin comprar nada: sólo se puede cuando las dos entradas son órganos de mando alimentados por la misma línea.':
     g.elem==='ampl'?'Aquí la simultaneidad entrega '+f1(Math.min(a.p,b.p),2)+' bar y no alcanza los '+f1(P_PILOT,1)+' de pilotaje: hay que comprar un relevador que pilota a '+f1(P_PILOT_LP,1)+' bar y conmuta la línea entera.':
     'Se compra un componente porque la topología no permite encadenar en serie o porque la función es O.'),
    g.elem==='ampl'?WARN_HEX:OK_HEX);
  nota(c,626,'ISO 13851 / EN 574 (mando a dos manos) exige además simultaneidad temporal, comprobación de las dos señales y liberación antes del siguiente ciclo. Este laboratorio la CITA y no la simula: aquí sólo se resuelve la función lógica y su presión.',VIO);

  rpanel(c,PX.x,70,PX.w,182,'Señales de entrada');
  prow(c,PX.x,96,PX.w,a.n.length>20?a.n.slice(0,19)+'…':a.n,f1(a.p,2)+' bar',AZUL);
  hbar(c,PX.x+16,106,PX.w-32,12,a.p/7,hexA(AZUL,0.7));
  prow(c,PX.x,146,PX.w,b.n.length>20?b.n.slice(0,19)+'…':b.n,f1(b.p,2)+' bar',VIO);
  hbar(c,PX.x+16,156,PX.w-32,12,b.p/7,hexA(VIO,0.7));
  prow(c,PX.x,196,PX.w,'Salida del montaje',f1(pOut,2)+' bar',colOk(pOut>=P_PILOT-1e-9));
  hbar(c,PX.x+16,206,PX.w-32,14,pOut/7,hexA(pOut>=P_PILOT-1e-9?OK_HEX:BAD_HEX,0.75));
  marca(c,PX.x+16,206,PX.w-32,14,P_PILOT/7,WARN_HEX,'umbral '+f1(P_PILOT,1));
  prow(c,PX.x,240,PX.w,'Tipo de entradas',a.tipo==='organo'&&b.tipo==='organo'?'dos órganos':'con señal generada',GRIS);

  rpanel(c,PX.x,266,PX.w,140,'Función pedida por el proceso');
  prow(c,PX.x,296,PX.w,'Función',fnTxt(sc.fn),AZUL);
  c.fillStyle=GRIS;c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,'«'+sc.proc+'»',PX.x+16,320,PX.w-32,17);
  prow(c,PX.x,384,PX.w,'Serie posible',serieVale(sc)?'sí':'no',colOk(serieVale(sc)));

  rpanel(c,PX.x,420,PX.w,152,'Si montas el empalme en T');
  prow(c,PX.x,450,PX.w,'Presión desde '+(a.tipo==='organo'?'la 1.ª':'la 1.ª')+' entrada',f1(fu.pA,2)+' bar',colOk(fu.pA>=P_PILOT));
  prow(c,PX.x,476,PX.w,'Presión desde la 2.ª entrada',f1(fu.pB,2)+' bar',colOk(fu.pB>=P_PILOT));
  prow(c,PX.x,502,PX.w,'Fuga mientras se mantiene',f1(Math.max(fu.qA,fu.qB),0)+' l/min',BAD_HEX);
  prow(c,PX.x,528,PX.w,'Coste por turno de 8 h',f1(Math.max(fu.qA,fu.qB)*60*8/1000*E_AIRE,1)+' kWh',BAD_HEX);
  prow(c,PX.x,554,PX.w,'¿Vale?','nunca',BAD_HEX);

  rpanel(c,PX.x,586,PX.w,152,'Montaje seleccionado');
  prow(c,PX.x,616,PX.w,'Componentes de más',String(E.comps),E.comps===ELEM(g.elem).comps?OK_HEX:WARN_HEX);
  prow(c,PX.x,642,PX.w,'Función del montaje',E.fn,colOk(E.fn===sc.fn));
  prow(c,PX.x,668,PX.w,'Llega al pilotaje',pOut>=P_PILOT-1e-9?'sí':'no',colOk(pOut>=P_PILOT-1e-9));
  c.fillStyle=elemVale(sc,lgElem)?OK_HEX:BAD_HEX;c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,elemVale(sc,lgElem)?'Montaje válido para esta estación.':porQue(sc,'elem',lgElem)||'Válido pero no mínimo.',PX.x+16,694,PX.w-32,16);
}

function drawTiempo(c){
  const sc=POOL[tmIdx], V=DEP(tmDep).V, k=tmAper;
  const t=tRetardo(V,k,sc.pRed), tD=tRetardo(V,k,sc.pRed-P_CAIDA);
  const t2=tRetardo(V,k,sc.pRed-2*P_CAIDA);
  const ok=tempVale(sc,V,k), g=GOOD(sc);
  title2(c,'Temporizador neumático: llenar un depósito hasta el umbral',
    'El retardo no es un ajuste "de tiempo": es el llenado de un volumen a través de un estrangulador hasta que la presión alcanza el umbral de pilotaje. El depósito manda en la ESCALA y el estrangulador en el AJUSTE FINO.');

  // esquema del temporizador
  c.fillStyle=hexA(AZUL,0.04);c.fillRect(30,120,650,118);
  c.strokeStyle=hexA(AZUL,0.16);c.lineWidth=1;c.strokeRect(30,120,650,118);
  conducto(c,52,180,120,180,AZUL);
  texto(c,f1(sc.pRed,0)+' bar',72,168,AZUL,'bold 12px Outfit, sans-serif');
  simbEstr(c,120,158,74,44,k,GRIS);
  conducto(c,194,180,232,180,GRIS);
  simbDep(c,246,150,86,60,Math.min(1,animLlen),AZUL);
  texto(c,DEP(tmDep).rot,289,228,AZUL,'bold 12px Outfit, sans-serif');
  conducto(c,346,180,392,180,GRIS);
  c.strokeStyle=ok?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(392,154,120,52);
  texto(c,'pilotaje',452,176,GRIS,'11px Outfit, sans-serif');
  texto(c,f1(P_PILOT,1)+' bar',452,196,WARN_HEX,'bold 14px Outfit, sans-serif');
  texto(c,'t = '+f1(t,2)+' s',600,172,ok?OK_HEX:BAD_HEX,'bold 22px Outfit, sans-serif');
  texto(c,'ventana '+f1(sc.tMin,2)+'–'+f1(sc.tMax,2)+' s',600,194,GRIS,'12px Outfit, sans-serif');

  // curva t(k) en escala logaritmica
  const gx=30, gy=256, gw=650, gh=196;
  c.fillStyle=hexA(AZUL,0.04);c.fillRect(gx,gy,gw,gh);
  c.strokeStyle=hexA(AZUL,0.16);c.lineWidth=1;c.strokeRect(gx,gy,gw,gh);
  const tLo=0.5, tHi=200;
  const yT=v=>gy+gh-14-(gh-34)*(Math.log(Math.max(tLo,Math.min(tHi,v)))-Math.log(tLo))/(Math.log(tHi)-Math.log(tLo));
  const xK=v=>gx+42+(gw-80)*(v-0.05)/0.98;
  // banda de la ventana
  c.fillStyle=hexA(OK_HEX,0.12);
  c.fillRect(gx+42,yT(sc.tMax),gw-80,Math.max(2,yT(sc.tMin)-yT(sc.tMax)));
  texto(c,'ventana del proceso',gx+gw-70,yT(sc.tMax)-5,OK_HEX,'11px Outfit, sans-serif');
  [1,2,5,10,20,50,100].forEach(v=>{
    conducto(c,gx+42,yT(v),gx+gw-16,yT(v),hexA('#8f97a5',0.14));
    texto(c,String(v),gx+30,yT(v)+4,GRIS,'10px Outfit, sans-serif','right');
  });
  texto(c,'s',gx+22,gy+20,GRIS,'11px Outfit, sans-serif','right');
  // curvas
  const traza=(pR,col,dash)=>{
    c.strokeStyle=col;c.lineWidth=2;if(dash)c.setLineDash(dash);
    c.beginPath();
    APERT.forEach((kk,i)=>{const X=xK(kk),Y=yT(tRetardo(V,kk,pR));if(i===0)c.moveTo(X,Y);else c.lineTo(X,Y);});
    c.stroke();c.setLineDash([]);
  };
  traza(sc.pRed-P_CAIDA,hexA(BAD_HEX,0.75),[5,4]);
  traza(sc.pRed,AZUL);
  APERT.forEach(kk=>{
    const X=xK(kk),Y=yT(tRetardo(V,kk,sc.pRed));
    const good=tempVale(sc,V,kk);
    c.beginPath();c.arc(X,Y,kk===k?6:4,0,6.3);
    c.fillStyle=kk<K_MIN?hexA(GRIS,0.8):(good?OK_HEX:BAD_HEX);c.fill();
    if(kk===k){c.strokeStyle='#F4EFEA';c.lineWidth=2;c.stroke();}
    texto(c,f1(kk,2),X,gy+gh-2,kk<K_MIN?BAD_HEX:GRIS,'10px Outfit, sans-serif');
  });
  conducto(c,xK(K_MIN),gy+8,xK(K_MIN),gy+gh-16,hexA(BAD_HEX,0.5),[4,4]);
  texto(c,'k mín repetible',xK(K_MIN)+52,gy+20,BAD_HEX,'10px Outfit, sans-serif');
  texto(c,'línea llena: red a '+f1(sc.pRed,0)+' bar · discontinua: red '+f1(P_CAIDA,1)+' bar más baja',gx+gw/2,gy+gh+16,GRIS,'11px Outfit, sans-serif');

  // matriz de veredictos
  const mx=30,my=486,mw=650,rh=26;
  c.fillStyle=hexA(AZUL,0.10);c.fillRect(mx,my,mw,rh);
  texto(c,'depósito \\ apertura',mx+88,my+17,'#C7D6F5','bold 12px Outfit, sans-serif');
  APERT.forEach((kk,i)=>texto(c,f1(kk,2),mx+180+i*66,my+17,'#C7D6F5','bold 12px Outfit, sans-serif'));
  DEPOS.forEach((d,ri)=>{
    const yy=my+rh+ri*rh;
    if(ri%2===0){c.fillStyle=hexA('#8f97a5',0.05);c.fillRect(mx,yy,mw,rh);}
    if(d.k===tmDep){c.fillStyle=hexA(AZUL,0.12);c.fillRect(mx,yy,mw,rh);}
    texto(c,d.rot,mx+88,yy+17,'#F4EFEA','bold 12px Outfit, sans-serif');
    APERT.forEach((kk,i)=>{
      const tt=tRetardo(d.V,kk,sc.pRed), good=tempVale(sc,d.V,kk);
      const sel=(d.k===tmDep&&kk===k);
      if(sel){c.fillStyle=hexA(good?OK_HEX:BAD_HEX,0.28);c.fillRect(mx+150+i*66,yy+2,64,rh-4);}
      texto(c,f1(tt,tt<10?2:1),mx+182+i*66,yy+17,good?OK_HEX:(kk<K_MIN?hexA(GRIS,0.7):hexA(BAD_HEX,0.65)),good?'bold 12px Outfit, sans-serif':'12px Outfit, sans-serif');
    });
  });
  c.strokeStyle=hexA(AZUL,0.18);c.lineWidth=1;c.strokeRect(mx,my,mw,rh*6);
  nota(c,656,'Con este depósito y esta apertura, la red a '+f1(sc.pRed,0)+' bar da '+f1(t,2)+' s y con '+f1(P_CAIDA,1)+' bar menos sube a '+f1(tD,2)+' s (+'+f1(100*(tD/t-1),1)+' %). El segundo bar cuesta todavía más: '+f1(t2,2)+' s (+'+f1(100*(t2/tD-1),1)+' % sobre el anterior). Un temporizador neumático NO es un reloj: se corre con la red.',
    ok?OK_HEX:WARN_HEX);

  rpanel(c,PX.x,70,PX.w,158,'Retardo medido');
  prow(c,PX.x,100,PX.w,'A '+f1(sc.pRed,0)+' bar',f1(t,3)+' s',colOk(ok));
  prow(c,PX.x,126,PX.w,'Con la red '+f1(P_CAIDA,1)+' bar más baja',f1(tD,3)+' s',colOk(tD<=sc.tMax+1e-9));
  prow(c,PX.x,152,PX.w,'Ventana del proceso',f1(sc.tMin,2)+'–'+f1(sc.tMax,2)+' s',GRIS);
  prow(c,PX.x,178,PX.w,'Margen',f1(evalCfg(sc,{elem:g.elem,dep:tmDep,aper:k}).margen,3)+'×',GRIS);
  prow(c,PX.x,204,PX.w,'Repetible (k ≥ '+f1(K_MIN,2)+')',k>=K_MIN?'sí':'no',colOk(k>=K_MIN));

  rpanel(c,PX.x,242,PX.w,132,'Sensibilidad a la red');
  prow(c,PX.x,272,PX.w,'−'+f1(P_CAIDA,1)+' bar','+'+f1(100*(tD/t-1),1)+' %',WARN_HEX);
  prow(c,PX.x,298,PX.w,'−'+f1(2*P_CAIDA,1)+' bar','+'+f1(100*(t2/t-1),1)+' %',BAD_HEX);
  c.fillStyle=GRIS;c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,'El caudal cae con la presión de origen: cada bar perdido pesa más que el anterior.',PX.x+16,322,PX.w-32,16);

  rpanel(c,PX.x,388,PX.w,158,'Aire de temporización');
  prow(c,PX.x,418,PX.w,'Llenado del depósito',f1(V*P_PILOT,3)+' l ANR',AZUL);
  prow(c,PX.x,444,PX.w,'Aire del cilindro',f1(curCiclo().consCil,3)+' l ANR',GRIS);
  prow(c,PX.x,470,PX.w,'Peso del temporizador',f1(curCiclo().pctDep,1)+' %',curCiclo().pctDep>25?BAD_HEX:OK_HEX);
  prow(c,PX.x,496,PX.w,'Ciclo completo',f1(curCiclo().total,2)+' s',GRIS);
  prow(c,PX.x,522,PX.w,'Ciclos por hora',f1(curCiclo().ciclosH,0),GRIS);

  rpanel(c,PX.x,560,PX.w,178,'Regla de proyecto');
  c.fillStyle=GRIS;c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,'1. El depósito más pequeño que alcance la ventana con k ≥ '+f1(K_MIN,2)+'.',PX.x+16,592,PX.w-32,16);
  wrapText(c,'2. Dentro de ese depósito, la apertura de mayor margen.',PX.x+16,628,PX.w-32,16);
  wrapText(c,'3. El montaje tiene que seguir dentro con la red '+f1(P_CAIDA,1)+' bar más baja.',PX.x+16,656,PX.w-32,16);
  prow(c,PX.x,706,PX.w,'Mínimo de esta estación',DEP(g.dep).rot+' · k = '+f1(g.aper,2),OK_HEX);
}

function drawFuga(c){
  const sc=POOL[fgIdx], fu=fugaTe(sc), [a,b]=sc.ent;
  const qmax=Math.max(fu.qA,fu.qB), m3=qmax*60*8/1000;
  title2(c,'El empalme en T: la avería que «funciona» en el banco de pruebas',
    'Unir dos salidas con una T parece una función O gratis. Y a veces enciende. Pero cada válvula tiene su escape a la atmósfera: la que no está accionada se convierte en un agujero permanente, y el nudo se queda en la presión donde el caudal que entra iguala al que se escapa.');

  c.fillStyle=hexA(BAD_HEX,0.05);c.fillRect(30,124,650,206);
  c.strokeStyle=hexA(BAD_HEX,0.20);c.lineWidth=1;c.strokeRect(30,124,650,206);
  const xa=110, xb=320, yV=262;
  simb32(c,xa-22,yV,44,38,GRIS,null,true);
  simb32(c,xb-22,yV,44,38,GRIS,null,false);
  texto(c,'accionada · '+f1(a.p,0)+' bar',xa,yV+62,OK_HEX,'bold 12px Outfit, sans-serif');
  texto(c,'en reposo · escape abierto',xb,yV+62,BAD_HEX,'bold 12px Outfit, sans-serif');
  texto(c,'Qn '+f1(a.qn,0)+' l/min',xa,yV+78,GRIS,'10px Outfit, sans-serif');
  texto(c,'Qn '+f1(b.qn,0)+' l/min',xb,yV+78,GRIS,'10px Outfit, sans-serif');
  conducto(c,xa,yV,xa,190,AZUL);
  conducto(c,xb,yV,xb,190,hexA(BAD_HEX,0.8),[6,4]);
  conducto(c,xa,190,xb,190,GRIS);
  c.beginPath();c.arc((xa+xb)/2,190,5,0,6.3);c.fillStyle=GRIS;c.fill();
  conducto(c,(xa+xb)/2,190,(xa+xb)/2,152,GRIS);
  simbEscape(c,xb,yV-8,10,BAD_HEX);
  texto(c,'escape',xb+38,yV-2,BAD_HEX,'11px Outfit, sans-serif');
  texto(c,'nudo: '+f1(fu.pA,2)+' bar',(xa+xb)/2,142,fu.pA>=P_PILOT?OK_HEX:BAD_HEX,'bold 15px Outfit, sans-serif');
  c.strokeStyle=fu.pA>=P_PILOT?OK_HEX:BAD_HEX;c.lineWidth=2;c.strokeRect(470,168,180,52);
  texto(c,'pilotaje ≥ '+f1(P_PILOT,1)+' bar',560,190,GRIS,'11px Outfit, sans-serif');
  texto(c,fu.pA>=P_PILOT?'conmuta':'NO conmuta',560,210,fu.pA>=P_PILOT?OK_HEX:BAD_HEX,'bold 15px Outfit, sans-serif');
  conducto(c,(xa+xb)/2,152,470,194,hexA(fu.pA>=P_PILOT?OK_HEX:BAD_HEX,0.85));
  texto(c,'caudal que se pierde: '+f1(fu.qA,1)+' l/min ANR',560,246,BAD_HEX,'12px Outfit, sans-serif');

  const rows=POOL.map(s=>{
    const f=fugaTe(s), q=Math.max(f.qA,f.qB), m=q*60*8/1000;
    const asim=Math.abs(f.pA-f.pB)>0.3;
    return {c:[s.nom,f1(f.pA,2),f1(f.pB,2),f1(q,0)+' l/min',f1(m,1)+' m³',f1(m*E_AIRE,1)+' kWh'],
      cols:[null,f.pA>=P_PILOT?OK_HEX:BAD_HEX,f.pB>=P_PILOT?OK_HEX:BAD_HEX,BAD_HEX,BAD_HEX,BAD_HEX],
      hl:s.id===sc.id?AZUL:(asim?WARN_HEX:null)};
  });
  tabla(c,30,348,650,['Estación','p desde 1.ª','p desde 2.ª','Fuga','Por turno 8 h','Energía'],[200,86,86,92,96,90],rows);
  nota(c,538,'La fila resaltada en ámbar es la trampa clásica: en la puerta de horno el nudo se queda en '+f1(fugaTe(POOL[1]).pA,2)+' bar con el pulsador del panel (Qn 100) y sube a '+f1(fugaTe(POOL[1]).pB,2)+' bar con el pedal (Qn 350). La misma máquina «funciona desde un botón y no desde el otro», y el electricista busca el fallo en el pulsador.',WARN_HEX);
  nota(c,632,'La válvula selectora cuesta un componente y cierra el escape de la rama que no manda: misma función O, cero fuga. Con '+f1(qmax,0)+' l/min y '+f1(E_AIRE,2)+' kWh/m³ ANR (rango 0,10–0,12), esta T se paga sola en energía en pocas semanas.',BAD_HEX);

  rpanel(c,PX.x,70,PX.w,182,'Nudo del empalme');
  prow(c,PX.x,100,PX.w,'Desde '+(a.n.length>16?a.n.slice(0,15)+'…':a.n),f1(fu.pA,2)+' bar',colOk(fu.pA>=P_PILOT));
  hbar(c,PX.x+16,110,PX.w-32,12,fu.pA/7,hexA(fu.pA>=P_PILOT?OK_HEX:BAD_HEX,0.7));
  marca(c,PX.x+16,110,PX.w-32,12,P_PILOT/7,WARN_HEX,null);
  prow(c,PX.x,152,PX.w,'Desde '+(b.n.length>16?b.n.slice(0,15)+'…':b.n),f1(fu.pB,2)+' bar',colOk(fu.pB>=P_PILOT));
  hbar(c,PX.x+16,162,PX.w-32,12,fu.pB/7,hexA(fu.pB>=P_PILOT?OK_HEX:BAD_HEX,0.7));
  marca(c,PX.x+16,162,PX.w-32,12,P_PILOT/7,WARN_HEX,null);
  prow(c,PX.x,204,PX.w,'Umbral de pilotaje',f1(P_PILOT,1)+' bar',WARN_HEX);
  prow(c,PX.x,230,PX.w,'¿Arranca siempre?',(fu.pA>=P_PILOT&&fu.pB>=P_PILOT)?'sí, y aun así fuga':'no',BAD_HEX);

  rpanel(c,PX.x,266,PX.w,158,'Lo que cuesta la fuga');
  prow(c,PX.x,296,PX.w,'Caudal perdido',f1(qmax,1)+' l/min ANR',BAD_HEX);
  prow(c,PX.x,322,PX.w,'Por turno de 8 h',f1(m3,1)+' m³ ANR',BAD_HEX);
  prow(c,PX.x,348,PX.w,'Energía equivalente',f1(m3*E_AIRE,1)+' kWh',BAD_HEX);
  prow(c,PX.x,374,PX.w,'Aire de un ciclo entero',f1(ciclo(sc,GOOD(sc)).consTot,2)+' l',GRIS);
  prow(c,PX.x,400,PX.w,'Equivale a',f1(m3*1000/ciclo(sc,GOOD(sc)).consTot,0)+' ciclos',WARN_HEX);

  rpanel(c,PX.x,438,PX.w,150,'Cómo se detecta');
  c.fillStyle=GRIS;c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,'1. Silbido continuo en el escape de la válvula que NO se está accionando.',PX.x+16,468,PX.w-32,16);
  wrapText(c,'2. El compresor arranca con la máquina parada y la señal mantenida.',PX.x+16,504,PX.w-32,16);
  wrapText(c,'3. Manómetro en el nudo: marca menos que la línea aunque no haya consumo.',PX.x+16,540,PX.w-32,16);

  rpanel(c,PX.x,602,PX.w,136,'Modelo empleado');
  c.fillStyle=GRIS;c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,'Presión de nudo por equilibrio de caudales ISO 6358 (b = '+f1(B_CRIT,2)+'), resuelto por bisección. C se obtiene del Qn de catálogo medido de 7 a 6 bar absolutos.',PX.x+16,632,PX.w-32,16);
  prow(c,PX.x,712,PX.w,'C de una Qn 100',f1(cDeQn(100),1)+' l/(min·bar)',GRIS);
}

function drawReto(c){
  const sc=retoSc(), cfg=retoCfg(), e=evalCfg(sc,cfg), g=GOOD(sc);
  title2(c,'Reto de proyecto · '+sc.nom,
    'Elige el montaje lógico, el depósito y la apertura del estrangulador. Los tres ejes se califican por separado: cada uno se juzga con los otros dos ya correctos, así que no hay forma de acertar por casualidad.');

  c.fillStyle=hexA(VIO,0.06);c.fillRect(30,110,650,92);
  c.strokeStyle=hexA(VIO,0.24);c.lineWidth=1;c.strokeRect(30,110,650,92);
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Pliego de condiciones',46,134);
  c.fillStyle=GRIS;c.font='13px Outfit, sans-serif';
  wrapText(c,'Función '+fnTxt(sc.fn)+' · entradas: '+sc.ent[0].n+' a '+f1(sc.ent[0].p,0)+' bar y '+sc.ent[1].n+' a '+f1(sc.ent[1].p,0)+' bar · red '+f1(sc.pRed,0)+' bar · retardo entre '+f1(sc.tMin,2)+' y '+f1(sc.tMax,2)+' s porque '+sc.proc+' · debe seguir cumpliendo con la red '+f1(P_CAIDA,1)+' bar más baja.',46,156,618,19);

  drawCircLog(c,30,214,650,180,sc,cfg.elem);

  // checklist de criterios
  const cy0=412;
  c.fillStyle=hexA(AZUL,0.04);c.fillRect(30,cy0,650,132);
  c.strokeStyle=hexA(AZUL,0.16);c.lineWidth=1;c.strokeRect(30,cy0,650,132);
  CRIT.forEach((cr,i)=>{
    const col=i%2, row=Math.floor(i/2);
    const x=46+col*326, y=cy0+30+row*30;
    const okv=e[cr.k];
    c.beginPath();c.arc(x+7,y-5,6,0,6.3);c.fillStyle=okv?OK_HEX:BAD_HEX;c.fill();
    texto(c,cr.rot,x+22,y,okv?'#F4EFEA':BAD_HEX,'13px Outfit, sans-serif','left');
  });
  texto(c,retoChecked?(retoSolved?'PROYECTO ACEPTADO':'PROYECTO RECHAZADO'):'sin comprobar',
    594,cy0+120,retoChecked?(retoSolved?OK_HEX:BAD_HEX):GRIS,'bold 14px Outfit, sans-serif');

  const diag=EJES.map(ej=>porQue(sc,ej,cfg[ej])).filter(Boolean);
  c.fillStyle=hexA(diag.length?BAD_HEX:OK_HEX,0.07);c.fillRect(30,558,650,180);
  c.strokeStyle=hexA(diag.length?BAD_HEX:OK_HEX,0.26);c.lineWidth=1;c.strokeRect(30,558,650,180);
  c.fillStyle=diag.length?BAD_HEX:OK_HEX;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText(diag.length?'Qué falla':'Terna válida y mínima',46,582);
  c.fillStyle=GRIS;c.font='13px Outfit, sans-serif';
  let yy=606;
  if(diag.length){diag.forEach(d=>{yy=wrapText(c,'• '+d,46,yy,618,18)+24;});}
  else{wrapText(c,'Cumple los siete criterios y no hay ninguna combinación más barata: mismo número de componentes, mismo depósito y el mejor margen dentro de ese depósito.',46,606,618,18);}

  const ejeP=(y,tit,val,okv,det)=>{
    rpanel(c,PX.x,y,PX.w,146,tit);
    prow(c,PX.x,y+32,PX.w,'Elegido',val,okv?OK_HEX:(retoChecked?BAD_HEX:GRIS));
    prow(c,PX.x,y+58,PX.w,'Estado',retoChecked?(okv?'correcto':'incorrecto'):'sin comprobar',retoChecked?colOk(okv):GRIS);
    c.fillStyle=GRIS;c.font='12px Outfit, sans-serif';c.textAlign='left';
    wrapText(c,det,PX.x+16,y+84,PX.w-32,16);
  };
  ejeP(70,'Eje 1 · Montaje lógico',ELEM(cfg.elem).rot,retoOkElem,'Función correcta, presión de pilotaje alcanzada, sin fuga y con el mínimo de componentes.');
  ejeP(228,'Eje 2 · Depósito',DEP(cfg.dep).rot,retoOkDep,'El más pequeño que permita caer dentro de la ventana con una apertura repetible.');
  ejeP(386,'Eje 3 · Apertura',f1(cfg.aper,2),retoOkAper,'k ≥ '+f1(K_MIN,2)+', dentro de la ventana, robusto a la caída y con el mayor margen.');
  rpanel(c,PX.x,544,PX.w,194,'Números del montaje propuesto');
  prow(c,PX.x,574,PX.w,'Presión de salida',f1(e.pOut,2)+' bar',colOk(e.okPres));
  prow(c,PX.x,600,PX.w,'Retardo',f1(e.t,2)+' s',colOk(e.okVent));
  prow(c,PX.x,626,PX.w,'Con la red baja',f1(e.tD,2)+' s',colOk(e.okRob));
  prow(c,PX.x,652,PX.w,'Margen',isFinite(e.margen)?f1(e.margen,3)+'×':'—',GRIS);
  prow(c,PX.x,678,PX.w,'Componentes',String(e.comps),GRIS);
  prow(c,PX.x,704,PX.w,'Aire por ciclo',f1(ciclo(sc,cfg).consTot,2)+' l ANR',GRIS);
  prow(c,PX.x,730,PX.w,'Combinaciones válidas',(function(){let n=0;ELEMK.forEach(ek=>DEPK.forEach(dk=>APERT.forEach(ap=>{if(evalCfg(sc,{elem:ek,dep:dk,aper:ap}).vale)n++;})));return n+' de 175';})(),GRIS);
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='tiempo')drawTiempo(c);
  else if(mode==='fuga')drawFuga(c);
  else if(mode==='reto')drawReto(c);
  else drawLogica(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='logica')showToast('<b>Pizarrón · Lógica</b><br>La columna «presión de salida» es la clave: la simultaneidad entrega la MENOR de las dos entradas y la selectora la MAYOR. El veredicto compara esa presión con el umbral de pilotaje.');
  else if(mode==='tiempo')showToast('<b>Pizarrón · Tiempo</b><br>La línea llena es el retardo con la red nominal y la discontinua con '+f1(P_CAIDA,1)+' bar menos. La banda verde es la ventana del proceso: el proyecto tiene que caber en ella con las DOS curvas.');
  else if(mode==='fuga')showToast('<b>Pizarrón · Fuga</b><br>El nudo del empalme en T se resuelve por equilibrio de caudales ISO 6358: entra por la válvula accionada y sale por el escape de la que está en reposo.');
  else showToast('<b>Pizarrón · Reto</b><br>Los siete indicadores del centro son los criterios del proyecto. Los tres paneles de la derecha califican cada eje por separado.');
}

// ===================== 8. BANCO 3D =====================
const bench=roundedBox(4.6,0.5,1.9,MAT.bench,0.05);bench.position.set(1.85,0.25,0.55);scene.add(bench);
[[-0.25,-0.25],[3.95,-0.25],[-0.25,1.35],[3.95,1.35]].forEach(p=>{
  const l=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.5,12),MAT.leg);
  l.position.set(p[0],0.25,p[1]);scene.add(l);
});
const GEO_CIL=new THREE.CylinderGeometry(1,1,1,28);
const GEO_TUB=new THREE.CylinderGeometry(1,1,1,14);
const _vA=new THREE.Vector3(),_vB=new THREE.Vector3(),_vD=new THREE.Vector3(),_up=new THREE.Vector3(0,1,0);
function tuboAB(mat){const m=new THREE.Mesh(GEO_TUB,mat);scene.add(m);return m;}
function setTuboAB(m,a,b,r){
  _vA.set(a[0],a[1],a[2]);_vB.set(b[0],b[1],b[2]);_vD.copy(_vB).sub(_vA);
  const L=_vD.length();
  m.position.copy(_vA).addScaledVector(_vD,0.5);
  m.scale.set(r,Math.max(L,0.001),r);
  m.quaternion.setFromUnitVectors(_up,_vD.normalize());
}

// puesto de mando: dos entradas
const postM=roundedBox(0.42,0.34,0.92,MAT.post,0.05);postM.position.set(0.28,0.67,0.35);scene.add(postM);
function mkEntrada(z,col){
  const g=new THREE.Group();
  const cuerpo=roundedBox(0.22,0.16,0.20,MAT.valve,0.03);cuerpo.position.set(0.28,0.92,z);g.add(cuerpo);
  const bot=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.065,0.08,18),std(col,0.4,0.3));
  bot.position.set(0.28,1.04,z);g.add(bot);
  scene.add(g);
  return {g,cuerpo,bot};
}
const entA=mkEntrada(0.62,0x4a90d9), entB=mkEntrada(0.08,0xC08CF8);

// elemento logico
const elemBox=roundedBox(0.26,0.22,0.26,MAT.body,0.04);elemBox.position.set(1.02,0.86,0.35);scene.add(elemBox);
const elemBola=new THREE.Mesh(new THREE.SphereGeometry(0.05,16,12),std(0xff6b6b,0.35,0.2));
elemBola.position.set(1.02,0.86,0.35);scene.add(elemBola);
const relBox=roundedBox(0.22,0.20,0.22,MAT.valve2,0.04);relBox.position.set(1.02,0.86,0.74);scene.add(relBox);
const relTubo=tuboAB(MAT.tuboP);
const teNudo=new THREE.Mesh(new THREE.SphereGeometry(0.055,16,12),MAT.tuboP);
teNudo.position.set(1.02,0.86,0.35);scene.add(teNudo);
const escCono=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.14,14),std(0xff6b6b,0.4,0.1));
escCono.rotation.x=Math.PI;escCono.position.set(1.02,0.72,0.35);scene.add(escCono);

// estrangulador
const estrBase=roundedBox(0.20,0.16,0.20,MAT.body,0.03);estrBase.position.set(1.52,0.83,0.35);scene.add(estrBase);
const estrKnob=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.045,0.10,18),MAT.knob);
estrKnob.position.set(1.52,0.96,0.35);scene.add(estrKnob);
const estrMarca=roundedBox(0.012,0.012,0.09,std(0x14161b,0.5,0.2),0.004);
estrMarca.position.set(1.52,1.01,0.35);scene.add(estrMarca);

// deposito
const depBody=new THREE.Mesh(GEO_CIL,MAT.dep);depBody.position.set(1.94,0.86,0.35);scene.add(depBody);
const depFill=new THREE.Mesh(GEO_CIL,std(0x4a90d9,0.3,0.1));
depFill.material.emissive=new THREE.Color(0x4a90d9);depFill.material.emissiveIntensity=0.4;
depFill.position.set(1.94,0.70,0.35);scene.add(depFill);

// valvula de potencia 5/2 pilotada
const vPot=roundedBox(0.40,0.24,0.28,MAT.valve,0.03);vPot.position.set(2.38,0.74,0.35);scene.add(vPot);
const spool=roundedBox(0.12,0.11,0.30,MAT.spool,0.02);spool.position.set(2.38,0.74,0.35);scene.add(spool);

// cilindro
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio: std(0x757d85,0.58,0.45), acero: std(0x848c93,0.42,0.75),
  cromo: std(0xaeb6bb,0.26,0.88),    chapa: std(0x6f777e,0.50,0.65),
  cobre: std(0xb87333,0.35,0.75),    negro: std(0x14181e,0.62,0.06),
  goma: std(0x101418,0.92,0.02),     blanco: std(0xd7dee6,0.42,0.15),
  rojo: std(0xd64545,0.50,0.10),     ceramica: std(0xd9dcd6,0.62,0.04),
};
/* EL CILINDRO, con lo que de verdad lo hace reconocible: las dos tapas, los
   cuatro TIRANTES que las sujetan contra la presión —por eso un cilindro de
   tirantes se puede desarmar y uno soldado no— y las tomas de aire, una a cada
   lado del émbolo. Antes eran dos cilindros lisos escalados, que es la silueta
   de cualquier cosa. Se rearma sólo cuando cambia el diámetro de la estación,
   no en cada fotograma, porque un cilindro de tirantes no se puede estirar con
   `scale` sin deformarle las tapas. Y el vástago se coloca en carrera·(p−1):
   así en p = 0 asoma sólo lo que sobresale de la tapa —el cilindro está
   DENTRO— y en p = 1 ha hecho la carrera entera. */
const X_CULATA=2.60, CARRERA3D=0.55;
const cilG=new THREE.Group();cilG.position.set(0,0.70,0.35);scene.add(cilG);
let cilD3=-1, cilP3=null;
function ponCilindro(dC,vas){
  if(cilD3===dC) return;
  cilD3=dC;
  if(cilP3){ cilG.remove(cilP3); cilP3.traverse(o=>{ if(o.isMesh) o.geometry.dispose(); }); }
  cilP3=P3.cilindroHidraulico(MATP,{d:dC,carrera:CARRERA3D,vastago:vas,
    tirantes:4,horquilla:false,tomas:true});
  cilP3.rotation.z=-Math.PI/2;                 // el +Y de la pieza es el +X del banco
  cilP3.position.set(X_CULATA+(CARRERA3D+dC*0.85)/2,0,0);
  cilP3.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  cilG.add(cilP3);
}
/* La punta del vástago en x del banco, sacada de la geometría de la pieza. */
const puntaCil=(dC,p)=>X_CULATA+CARRERA3D+1.17*dC+CARRERA3D*p;

const tip=roundedBox(0.10,0.16,0.16,MAT.plate,0.02);tip.position.set(3.86,0.70,0.35);scene.add(tip);
const carga=roundedBox(0.24,0.26,0.30,MAT.carga,0.03);carga.position.set(4.02,0.70,0.35);scene.add(carga);
[[2.68],[3.36]].forEach(p=>{
  const s=roundedBox(0.10,0.22,0.26,MAT.post,0.02);s.position.set(p[0],0.59,0.35);scene.add(s);
});

// tubos
const tuA=tuboAB(MAT.tuboA), tuB=tuboAB(MAT.tuboB), tuC=tuboAB(MAT.tuboP);
const tuD=tuboAB(MAT.tuboP), tuE=tuboAB(MAT.tuboP), tuF=tuboAB(MAT.tuboP);

// LEDs de criterio
function makeLED(x,color){
  const m=new THREE.Mesh(new THREE.SphereGeometry(0.042,16,12),std(color,0.3,0.1));
  m.material.emissive=new THREE.Color(color);m.material.emissiveIntensity=0.1;
  m.position.set(x,0.53,-0.20);scene.add(m);return m;
}
const LEDS=CRIT.map((cr,i)=>makeLED(0.62+i*0.26));

// placa de datos
const pCv=document.createElement('canvas');pCv.width=256;pCv.height=160;
const pTex=new THREE.CanvasTexture(pCv);
const placa=new THREE.Mesh(new THREE.PlaneGeometry(0.62,0.39),new THREE.MeshBasicMaterial({map:pTex}));
placa.position.set(1.28,1.16,0.05);placa.lookAt(new THREE.Vector3(5.2,2.4,5.6));scene.add(placa);
function drawPlaca(sc,cfg,e){
  const c=pCv.getContext('2d');
  c.fillStyle='#0c1016';c.fillRect(0,0,256,160);
  c.strokeStyle=e.vale?OK_HEX:BAD_HEX;c.lineWidth=3;c.strokeRect(2,2,252,156);
  c.fillStyle='#F4EFEA';c.font='bold 15px Outfit, sans-serif';c.textAlign='left';
  c.fillText(sc.nom.length>22?sc.nom.slice(0,21)+'…':sc.nom,12,26);
  c.fillStyle=GRIS;c.font='11px Outfit, sans-serif';
  c.fillText(ELEM(cfg.elem).rot,12,46);
  c.fillText(DEP(cfg.dep).rot+' · k = '+f1(cfg.aper,2),12,62);
  c.fillStyle=e.okPres?OK_HEX:BAD_HEX;c.font='bold 13px Outfit, sans-serif';
  c.fillText('p salida  '+f1(e.pOut,2)+' bar',12,88);
  c.fillStyle=e.okVent?OK_HEX:BAD_HEX;
  c.fillText('retardo   '+f1(e.t,2)+' s',12,108);
  c.fillStyle=e.okRob?OK_HEX:BAD_HEX;
  c.fillText('red baja  '+f1(e.tD,2)+' s',12,128);
  c.fillStyle=e.vale?OK_HEX:BAD_HEX;c.font='bold 13px Outfit, sans-serif';c.textAlign='right';
  c.fillText(e.vale?'VÁLIDO':'NO VÁLIDO',244,150);
  pTex.needsUpdate=true;
}

// etiquetas al pasar el ratón
addHoverLabel(entA.g,'Entrada 1',AZUL,[0.28,1.24,0.62],0.66);
addHoverLabel(entB.g,'Entrada 2',VIO,[0.28,1.24,0.08],0.66);
addHoverLabel(elemBox,'Elemento lógico','#C7D6F5',[1.02,1.14,0.35],0.72);
addHoverLabel(estrKnob,'Estrangulador',WARN_HEX,[1.52,1.20,0.35],0.72);
addHoverLabel(depBody,'Depósito',AZUL,[1.94,1.18,0.35],0.66);
addHoverLabel(vPot,'Válvula 5/2 pilotada','#C7D6F5',[2.38,1.06,0.35],0.86);
addHoverLabel(cilG,'Cilindro de la estación','#C7D6F5',[3.06,1.02,0.35],0.90);
entA.g.userData={title:'Entrada 1',info:'Primera señal de la estación. Su presión es la que entra por la vía X del elemento lógico.'};
entB.g.userData={title:'Entrada 2',info:'Segunda señal. En algunas estaciones no es un pulsador sino una señal ya generada (final de carrera, presostato, rama regulada).'};
elemBox.userData={title:'Elemento lógico',info:'La bola roja marca la entrada que queda bloqueada: en la simultaneidad se bloquea la de MAYOR presión (sale la menor) y en la selectora la de MENOR (sale la mayor).'};
elemBola.userData=elemBox.userData;
relBox.userData={title:'Relevador de baja presión',info:'Pilota con sólo '+f1(P_PILOT_LP,1)+' bar y conmuta la línea completa. Se compra cuando la señal existe pero no llega al umbral de pilotaje estándar.'};
teNudo.userData={title:'Empalme en T',info:'Nunca es una solución: la válvula que no está accionada deja su escape abierto y el nudo se queda por debajo de la línea, fugando sin parar.'};
escCono.userData=teNudo.userData;
estrKnob.userData={title:'Estrangulador regulable',info:'Ajuste fino del retardo. Por debajo de k = '+f1(K_MIN,2)+' deja de ser repetible: el mismo tornillo da tiempos distintos cada día.'};
estrBase.userData=estrKnob.userData;
depBody.userData={title:'Depósito de temporización',info:'Decide la ESCALA del retardo. El aire que se mete aquí en cada ciclo no hace trabajo: es consumo puro.'};
depFill.userData=depBody.userData;
vPot.userData={title:'Válvula de potencia 5/2 pilotada',info:'Conmuta cuando el depósito alcanza el umbral de pilotaje. Si la salida del elemento lógico no llega a ese umbral, no se mueve nunca.'};
cilG.userData={title:'Cilindro de la estación',info:'Cilindro de doble efecto de tirantes. Diámetro y carrera vienen de la estación (ISO 15552). El banco conserva las proporciones del ciclo, no lo cronometra.'};
LEDS.forEach((l,i)=>{l.userData={title:'Criterio · '+CRIT[i].rot,info:CRIT[i].det};});

function updateHW(){
  const sc=curSc(), cfg=curCfg(), e=evalCfg(sc,cfg);
  const ek=cfg.elem, E=ELEM(ek), [a,b]=sc.ent;
  // entradas
  entA.bot.position.y=1.04-(a.p>=P_PILOT?0.012:0);
  entB.bot.position.y=1.04-(b.p>=P_PILOT?0.012:0);
  entA.bot.material.color.set(a.p>=P_PILOT?0x4a90d9:0x33404f);
  entB.bot.material.color.set(b.p>=P_PILOT?0xC08CF8:0x3b3450);
  // elemento
  const esT=ek==='te', esSerie=ek==='serie', esAmpl=ek==='ampl';
  elemBox.visible=!esT&&!esSerie;
  elemBola.visible=elemBox.visible;
  teNudo.visible=esT;escCono.visible=esT;
  relBox.visible=esAmpl;relTubo.visible=esAmpl;
  if(elemBola.visible){
    const bloqA=(E.fn==='Y')?(a.p>=b.p):(a.p<b.p);
    elemBola.position.z=0.35+(bloqA?0.09:-0.09);
  }
  if(esAmpl)setTuboAB(relTubo,[1.02,0.86,0.60],[1.02,0.86,0.47],0.022);
  if(esT){escCono.scale.set(1,0.8+0.5*Math.abs(Math.sin(animT*3.4)),1);}
  // tubos de entrada
  if(esSerie){
    setTuboAB(tuA,[0.28,0.92,0.52],[0.28,0.92,0.18],0.022);
    setTuboAB(tuB,[0.39,0.92,0.08],[1.44,0.85,0.35],0.022);
    setTuboAB(tuC,[1.44,0.85,0.35],[1.44,0.85,0.35],0.001);
  }else{
    setTuboAB(tuA,[0.39,0.92,0.62],[0.93,0.87,0.35],0.022);
    setTuboAB(tuB,[0.39,0.92,0.08],[0.93,0.87,0.35],0.022);
    setTuboAB(tuC,[1.11,0.86,0.35],[1.44,0.84,0.35],0.022);
  }
  setTuboAB(tuD,[1.61,0.83,0.35],[1.84,0.86,0.35],0.020);
  setTuboAB(tuE,[2.04,0.86,0.35],[2.24,0.78,0.35],0.020);
  setTuboAB(tuF,[2.56,0.72,0.35],[2.66,0.70,0.35],0.024);
  // estrangulador
  estrKnob.rotation.y=cfg.aper*3.4;
  estrMarca.position.set(1.52+0.055*Math.sin(cfg.aper*3.4),1.01,0.35+0.055*Math.cos(cfg.aper*3.4));
  estrKnob.material.color.set(cfg.aper<K_MIN?0xff6b6b:0xE9C46A);
  // deposito
  const V=DEP(cfg.dep).V;
  const r=0.055+0.10*Math.cbrt(V);
  depBody.scale.set(r,0.30,r);
  depFill.scale.set(r*0.92,Math.max(0.004,0.28*animLlen),r*0.92);
  depFill.position.y=0.86-0.15+0.14*animLlen;
  depFill.material.emissiveIntensity=0.25+0.9*animLlen;
  // valvula de potencia y cilindro
  const conmuta=animFase==='ida'||animFase==='vuelta';
  const xs=2.38+(conmuta?0.055:-0.055);
  spool.position.x+=(xs-spool.position.x)*0.16;
  const D=sc.D, rB=0.055+D/1000*0.9, rR=rB*CIL_ISO[D]/D;
  ponCilindro(2*rB,2*rR);
  cilP3.userData.vastago.position.y=CARRERA3D*(animP-1);   // en p = 0 está DENTRO
  const xp=puntaCil(2*rB,animP);
  tip.position.x=xp;
  carga.position.x=xp+0.16;
  // LEDs
  CRIT.forEach((cr,i)=>{
    const okv=e[cr.k];
    LEDS[i].material.color.set(okv?0x7CD992:0xff6b6b);
    LEDS[i].material.emissive.set(okv?0x7CD992:0xff6b6b);
    LEDS[i].material.emissiveIntensity=okv?1.3:0.55;
  });
  drawPlaca(sc,cfg,e);
}

// ===================== 9. HUD Y PANEL =====================
document.getElementById('hud').innerHTML=`
  <div class="eyebrow">Hidráulica y Neumática · Mecánica</div>
  <h2>Lógica neumática Y/O y temporización</h2>
  <p>En neumática un «1 lógico» no es un bit: es una presión. La válvula de simultaneidad entrega la <b>menor</b> de sus dos entradas y la selectora la <b>mayor</b>, y el montaje sólo funciona si esa presión alcanza el umbral de pilotaje. El temporizador tampoco es un reloj: es el llenado de un depósito a través de un estrangulador.</p>
  <div class="formula">Q = C·p₁·√(1 − ((r − b)/(1 − b))²) · · · t = ∫ (V/p₀)·dp / Q(p)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#7CD992"></span>criterio cumplido</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>criterio incumplido</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>umbral de pilotaje / apertura</div>
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>entrada 1</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>entrada 2</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> caudal por ISO 6358 con relación crítica b = 0,45; presión de salida de la simultaneidad y de la selectora; presión de nudo del empalme en T por equilibrio de caudales; llenado del depósito integrado numéricamente hasta el umbral; sensibilidad del retardo a la caída de red; consumo de aire del ciclo y del temporizador.</div>
    <div class="fl no"><b>NO modela:</b> temperatura, humedad ni calidad del aire (ISO 8573-1 se cita); histéresis mecánica de la bola; longitud de las mangueras; la simultaneidad temporal y la comprobación de señales que exige la ISO 13851/EN 574 para mando a dos manos; el desgaste del asiento.</div>
  </div>
  <div class="src">Ref: ISO 1219-1 (símbolos) · ISO 6358 (caudal) · ISO 8778 (aire ANR) · ISO 15552 (émbolo-vástago) · ISO 4414 (seguridad) · ISO 8573-1 y ISO 13851/EN 574 (citadas)</div>`;

document.getElementById('panel').innerHTML=`
  <h4>Lógica y temporización · <span id="p_mode" style="color:var(--accent2)">Lógica</span></h4>
  <div class="modebar">
    <button class="b on" id="m_logica">🔀 Lógica</button>
    <button class="b" id="m_tiempo">⏱️ Tiempo</button>
    <button class="b" id="m_fuga">🚱 Fuga</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Proyecto propuesto</h4>
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

// ===================== 10. TOAST =====================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),4200);
}

// ===================== 11. MODOS Y CONTROLES =====================
const MODE_META={
  logica:{nombre:'Lógica',cam:[[3.6,2.5,6.4],[0.75,1.00,0.35]],
    mision:'Compara los cinco montajes sobre la misma estación y mira qué presión sale de cada uno.'},
  tiempo:{nombre:'Tiempo',cam:[[2.4,2.4,5.6],[1.70,0.95,0.35]],
    mision:'Cambia el depósito y la apertura y observa cómo se mueve el retardo dentro (o fuera) de la ventana.'},
  fuga:{nombre:'Fuga',cam:[[1.6,1.9,3.8],[1.05,0.90,0.35]],
    mision:'Monta el empalme en T y mide lo que se pierde por el escape de la válvula en reposo.'},
  reto:{nombre:'Reto',cam:[[5.4,3.0,7.6],[1.00,1.00,0.35]],
    mision:'Proyecta el montaje completo: elemento lógico, depósito y apertura.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function optBtns(key,opts,cur){
  return opts.map(([v,t])=>`<button class="b sm ${String(cur)===String(v)?'on':''}" data-${key}="${v}">${t}</button>`).join('');
}
const beep=()=>synth.beep(680,0.05,0.04);
const estOpts=()=>POOL.map((s,i)=>[i,s.nom]);
const elemOpts=()=>ELEMS.map(e=>[e.k,e.rot]);
const depOpts=()=>DEPOS.map(d=>[d.k,d.rot]);
const aperOpts=()=>APERT.map(v=>[v,f1(v,2)]);

function buildControls(){
  const bar=el('selbar');
  let h='';
  if(mode==='logica'){
    h+=lbl('Estación')+optBtns('est',estOpts(),lgIdx);
    h+=lbl('Montaje')+optBtns('elem',elemOpts(),lgElem);
  }else if(mode==='tiempo'){
    h+=lbl('Estación')+optBtns('est',estOpts(),tmIdx);
    h+=lbl('Depósito')+optBtns('dep',depOpts(),tmDep);
    h+=lbl('Apertura k')+optBtns('aper',aperOpts(),tmAper);
  }else if(mode==='fuga'){
    h+=lbl('Estación')+optBtns('est',estOpts(),fgIdx);
  }else{
    h+=lbl('Montaje')+optBtns('relem',elemOpts(),retoCh.elem);
    h+=lbl('Depósito')+optBtns('rdep',depOpts(),retoCh.dep);
    h+=lbl('Apertura k')+optBtns('raper',aperOpts(),retoCh.aper);
  }
  bar.innerHTML=h;bar.style.display='flex';
  bar.querySelectorAll('[data-est]').forEach(b=>b.onclick=()=>{
    if(autoRunning)return;
    const i=+b.dataset.est;
    if(mode==='logica')lgIdx=i;else if(mode==='tiempo')tmIdx=i;else fgIdx=i;
    beep();afterEdit();
  });
  bar.querySelectorAll('[data-elem]').forEach(b=>b.onclick=()=>{if(autoRunning)return;lgElem=b.dataset.elem;beep();afterEdit();});
  bar.querySelectorAll('[data-dep]').forEach(b=>b.onclick=()=>{if(autoRunning)return;tmDep=b.dataset.dep;beep();afterEdit();});
  bar.querySelectorAll('[data-aper]').forEach(b=>b.onclick=()=>{if(autoRunning)return;tmAper=+b.dataset.aper;beep();afterEdit();});
  bar.querySelectorAll('[data-relem]').forEach(b=>b.onclick=()=>retoSet('elem',b.dataset.relem));
  bar.querySelectorAll('[data-rdep]').forEach(b=>b.onclick=()=>retoSet('dep',b.dataset.rdep));
  bar.querySelectorAll('[data-raper]').forEach(b=>b.onclick=()=>retoSet('aper',+b.dataset.raper));
}
function retoSet(field,v){
  if(autoRunning)return;
  retoCh[field]=v;
  retoChecked=false;retoOkElem=false;retoOkDep=false;retoOkAper=false;retoSolved=false;retoMsg='';solved=false;
  beep();afterEdit();
}
function afterEdit(){
  buildControls();updateScenarioInfo();
  if(mode==='reto')updateRetoSpec();
  refreshAll();
}
function updateScenarioInfo(){
  const sc=curSc();
  const box=el('scenarioInfo');
  box.style.display='block';
  box.innerHTML=`<b>${sc.nom}</b> · función ${fnTxt(sc.fn)} · red ${f1(sc.pRed,0)} bar · ventana ${f1(sc.tMin,2)}–${f1(sc.tMax,2)} s<br><span style="color:var(--muted)">${MODE_META[mode].mision}</span>`;
}
function setMode(k){
  mode=k;
  ['logica','tiempo','fuga','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('retoTitle').style.display=k==='reto'?'block':'none';
  el('retoBox').style.display=k==='reto'?'block':'none';
  buildControls();updateScenarioInfo();
  solved=k==='reto'?retoSolved:false;
  clearDx();buildQuiz();refreshQuestion();
  const cam=MODE_META[k].cam;S.moveTo(cam[0],cam[1]);
  if(k==='reto')updateRetoSpec();
  animT=0;
  refreshAll();
}
function newSignal(){
  if(mode==='logica'){
    lgIdx=pickIdx(POOL.length,lgIdx);
    lgElem=ELEMK[Math.floor(Math.random()*ELEMK.length)];
  }else if(mode==='tiempo'){
    tmIdx=pickIdx(POOL.length,tmIdx);
    tmDep=DEPK[Math.floor(Math.random()*DEPK.length)];
    tmAper=APERT[Math.floor(Math.random()*APERT.length)];
  }else if(mode==='fuga'){
    fgIdx=pickIdx(POOL.length,fgIdx);
  }else{
    seedReto(null);solved=false;
  }
  animT=0;
  clearDx();refreshQuestion();
  afterEdit();
}

// ===================== 12. TELEMETRÍA =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  const sc=curSc(), cfg=curCfg(), e=curEval(), cy=curCiclo();
  let h='';
  if(mode==='logica'){
    const [a,b]=sc.ent;
    h+=teleRow('Entrada 1',f1(a.p,2)+' bar');
    h+=teleRow('Entrada 2',f1(b.p,2)+' bar');
    h+=teleRow('Montaje',ELEM(cfg.elem).rot);
    h+=teleRow('Función del montaje',ELEM(cfg.elem).fn,e.okFunc?'ok':'bad');
    h+=teleRow('Presión de salida',f1(e.pOut,2)+' bar',e.okPres?'ok':'bad');
    h+=teleRow('Umbral de pilotaje',f1(P_PILOT,1)+' bar','warn');
    h+=teleRow('Componentes de más',String(e.comps));
    h+=teleRow('Veredicto',elemVale(sc,cfg.elem)?'válido':'no válido',elemVale(sc,cfg.elem)?'ok':'bad');
  }else if(mode==='tiempo'){
    h+=teleRow('Depósito',DEP(cfg.dep).rot);
    h+=teleRow('Apertura k',f1(cfg.aper,2),cfg.aper<K_MIN?'bad':'');
    h+=teleRow('Retardo',f1(e.t,3)+' s',e.okVent?'ok':'bad');
    h+=teleRow('Con la red −'+f1(P_CAIDA,1)+' bar',f1(e.tD,3)+' s',e.okRob?'ok':'bad');
    h+=teleRow('Ventana del proceso',f1(sc.tMin,2)+'–'+f1(sc.tMax,2)+' s');
    h+=teleRow('Margen',isFinite(e.margen)?f1(e.margen,3)+'×':'—');
    h+=teleRow('Aire del temporizador',f1(cy.consDep,3)+' l ANR');
    h+=teleRow('Peso sobre el ciclo',f1(cy.pctDep,1)+' %',cy.pctDep>25?'bad':'ok');
  }else if(mode==='fuga'){
    const fu=fugaTe(sc), q=Math.max(fu.qA,fu.qB), m3=q*60*8/1000;
    h+=teleRow('Nudo desde la 1.ª entrada',f1(fu.pA,2)+' bar',fu.pA>=P_PILOT?'ok':'bad');
    h+=teleRow('Nudo desde la 2.ª entrada',f1(fu.pB,2)+' bar',fu.pB>=P_PILOT?'ok':'bad');
    h+=teleRow('Umbral de pilotaje',f1(P_PILOT,1)+' bar','warn');
    h+=teleRow('Fuga permanente',f1(q,1)+' l/min ANR','bad');
    h+=teleRow('Por turno de 8 h',f1(m3,1)+' m³ ANR','bad');
    h+=teleRow('Energía equivalente',f1(m3*E_AIRE,1)+' kWh','bad');
    h+=teleRow('Alternativa correcta','Válvula selectora','ok');
    h+=teleRow('Coste de la alternativa','1 componente');
  }else{
    h+=teleRow('Montaje',ELEM(cfg.elem).rot,retoChecked?(retoOkElem?'ok':'bad'):'');
    h+=teleRow('Depósito',DEP(cfg.dep).rot,retoChecked?(retoOkDep?'ok':'bad'):'');
    h+=teleRow('Apertura k',f1(cfg.aper,2),retoChecked?(retoOkAper?'ok':'bad'):'');
    h+=teleRow('Presión de salida',f1(e.pOut,2)+' bar',e.okPres?'ok':'bad');
    h+=teleRow('Retardo',f1(e.t,2)+' s',e.okVent?'ok':'bad');
    h+=teleRow('Con la red −'+f1(P_CAIDA,1)+' bar',f1(e.tD,2)+' s',e.okRob?'ok':'bad');
    h+=teleRow('Criterios cumplidos',CRIT.filter(cr=>e[cr.k]).length+' de '+CRIT.length,e.vale?'ok':'bad');
    h+=teleRow('Estado',retoChecked?(retoSolved?'aceptado':'rechazado'):'sin comprobar',retoChecked?(retoSolved?'ok':'bad'):'');
  }
  el('tele').innerHTML=h;
}
function updateReport(){
  const sc=curSc(), cfg=curCfg(), e=curEval(), cy=curCiclo();
  let h='';
  if(mode==='logica'){
    const g=GOOD(sc);
    h='<b>'+sc.nom+'</b><br>Función pedida: '+fnTxt(sc.fn)+'.<br>'+
      'Montaje: '+ELEM(cfg.elem).rot+' → '+f1(e.pOut,2)+' bar.<br>'+
      (elemVale(sc,cfg.elem)?'Válido. ':'<span style="color:#ff6b6b">'+porQue(sc,'elem',cfg.elem)+'</span> ')+
      '<br>Solución mínima: '+ELEM(g.elem).rot.toLowerCase()+' ('+compTxt(ELEM(g.elem).comps)+').';
  }else if(mode==='tiempo'){
    const t2=tRetardo(DEP(cfg.dep).V,cfg.aper,sc.pRed-2*P_CAIDA);
    h='<b>'+sc.nom+'</b> · ventana '+f1(sc.tMin,2)+'–'+f1(sc.tMax,2)+' s<br>'+
      DEP(cfg.dep).rot+' con k = '+f1(cfg.aper,2)+' → <b>'+f1(e.t,3)+' s</b>.<br>'+
      'Con la red '+f1(P_CAIDA,1)+' bar más baja: '+f1(e.tD,3)+' s (+'+f1(100*(e.tD/e.t-1),1)+' %).<br>'+
      'Con 2 bar menos: '+f1(t2,3)+' s (+'+f1(100*(t2/e.t-1),1)+' %).<br>'+
      'Ciclo completo '+f1(cy.total,2)+' s → '+f1(cy.ciclosH,0)+' ciclos/h.';
  }else if(mode==='fuga'){
    const fu=fugaTe(sc), q=Math.max(fu.qA,fu.qB);
    h='<b>'+sc.nom+'</b> con empalme en T<br>'+
      'Nudo: '+f1(fu.pA,2)+' bar desde la 1.ª entrada y '+f1(fu.pB,2)+' desde la 2.ª.<br>'+
      (Math.abs(fu.pA-fu.pB)>0.3?'<span style="color:#E9C46A">Asimétrico: arranca desde una entrada y no desde la otra.</span><br>':'')+
      '<span style="color:#ff6b6b">Fuga '+f1(q,1)+' l/min ANR mientras se mantenga la señal.</span>';
  }else{
    h='<b>'+sc.nom+'</b><br>'+
      (retoChecked?(retoSolved?'<span style="color:#7CD992">Proyecto aceptado: terna válida y mínima.</span>':'<span style="color:#ff6b6b">'+retoMsg+'</span>')
        :'Elige montaje, depósito y apertura y pulsa «Comprobar».')+
      '<br>Criterios: '+CRIT.map(cr=>(e[cr.k]?'🟢':'🔴')+' '+cr.rot).join(' · ');
  }
  el('report').innerHTML=h;
}
function refreshAll(){drawBoard();updateTele();updateReport();updateHW();}

// ===================== 13. RETO =====================
function updateRetoSpec(){
  const sc=retoSc();
  el('retoSpec').innerHTML=`<b>${sc.nom}</b> · función ${fnTxt(sc.fn)}<br>`+
    `Entradas: ${sc.ent[0].n} a ${f1(sc.ent[0].p,0)} bar (Qn ${f1(sc.ent[0].qn,0)}) y ${sc.ent[1].n} a ${f1(sc.ent[1].p,0)} bar (Qn ${f1(sc.ent[1].qn,0)}).<br>`+
    `Red ${f1(sc.pRed,0)} bar · retardo entre ${f1(sc.tMin,2)} y ${f1(sc.tMax,2)} s porque ${sc.proc}.<br>`+
    `<span style="color:var(--muted)">Debe seguir cumpliendo con la red ${f1(P_CAIDA,1)} bar más baja y con el mínimo de componentes.</span>`;
}
function retoExplain(){
  return EJES.map(ej=>porQue(retoSc(),ej,retoCfg()[ej])).filter(Boolean).join(' · ');
}
function checkReto(){
  const sc=retoSc(), cfg=retoCfg();
  retoOkElem=okEje(sc,'elem',cfg.elem);
  retoOkDep=okEje(sc,'dep',cfg.dep);
  retoOkAper=okEje(sc,'aper',cfg.aper);
  retoChecked=true;
  retoSolved=retoOkElem&&retoOkDep&&retoOkAper;
  solved=retoSolved;
  retoMsg=retoSolved?'Terna válida y mínima.':retoExplain();
  synth.beep(retoSolved?880:200,0.10,0.05);
  refreshAll();
  if(!autoRunning){
    showToast((retoSolved?'✅ <b>Proyecto aceptado.</b> ':'❌ <b>Proyecto rechazado.</b> ')+retoMsg);
  }
  return retoSolved;
}
function retoSolveBuild(){
  const g=GOOD(retoSc());
  retoCh={elem:g.elem,dep:g.dep,aper:g.aper};
  retoChecked=false;retoOkElem=false;retoOkDep=false;retoOkAper=false;retoSolved=false;retoMsg='';
}

// ===================== 14. CUESTIONARIO =====================
function buildQuiz(){
  const scL=POOL[lgIdx], scT=POOL[tmIdx], scF=POOL[fgIdx];
  QUIZ={
    logica:{
      pregunta:'Las dos señales de una función Y están «a 1», pero el cilindro no se mueve. ¿Qué explica mejor lo que pasa?',
      opciones:[
        {t:'La válvula de simultaneidad entrega la MENOR de las dos presiones y esa no llega al umbral de pilotaje',ok:true,
         why:'Exacto. En neumática el 1 lógico vale una presión: la simultaneidad saca min(p₁,p₂), y si la rama más baja está por debajo de '+f1(P_PILOT,1)+' bar la válvula de potencia no conmuta aunque las dos señales existan.'},
        {t:'La válvula de simultaneidad suma las dos presiones y se pasa del máximo admisible',ok:false,
         why:'No suma nada: la bola bloquea una de las dos entradas. En la simultaneidad bloquea la de mayor presión, así que sale la menor.'},
        {t:'Hace falta más caudal: hay que montar tubo más grueso',ok:false,
         why:'El problema no es de caudal sino de nivel de presión. El pilotaje necesita alcanzar un umbral; un tubo más grueso llega antes, pero al mismo valor insuficiente.'},
        {t:'La función Y no se puede hacer en neumática sin electrónica',ok:false,
         why:'Sí se puede, y de dos formas: dos válvulas 3/2 en serie (sin comprar nada) o una válvula de simultaneidad.'},
      ],
    },
    tiempo:{
      pregunta:'El temporizador está ajustado y en la ventana. La red pierde 1 bar por una fuga en otra máquina. ¿Qué le pasa al retardo?',
      opciones:[
        {t:'Se alarga alrededor de un 17 % porque el caudal a través del estrangulador cae con la presión de origen',ok:true,
         why:'Correcto. El caudal sónico es proporcional a p₁: menos presión de origen, menos caudal, más tiempo en llenar el mismo depósito. Por eso el proyecto se comprueba también con la red baja.'},
        {t:'No cambia: el depósito y el estrangulador son los mismos',ok:false,
         why:'El volumen es el mismo, pero el caudal que lo llena no. Con la red 1 bar más baja el mismo montaje tarda sensiblemente más.'},
        {t:'Se acorta, porque hay menos presión que vencer hasta el umbral',ok:false,
         why:'El umbral de pilotaje no baja con la red: sigue siendo '+f1(P_PILOT,1)+' bar. Lo que baja es el caudal disponible para alcanzarlo.'},
        {t:'Se dispara antes y el cilindro sale sin retardo',ok:false,
         why:'Nunca se acorta por bajar la presión de alimentación. Y si la red cae por debajo del umbral, el temporizador no dispara jamás.'},
      ],
    },
    fuga:{
      pregunta:'Un empalme en T entre dos válvulas 3/2 enciende la máquina en el banco de pruebas. ¿Por qué no se acepta?',
      opciones:[
        {t:'Porque la válvula que no está accionada deja su escape abierto y el nudo fuga sin parar mientras se mantiene la señal',ok:true,
         why:'Exacto. Y no siempre da la misma presión: depende del Qn de cada válvula, así que puede arrancar desde un mando y no desde el otro. La selectora cierra ese escape por un componente.'},
        {t:'Porque la T no está normalizada en la ISO 1219',ok:false,
         why:'El empalme se dibuja perfectamente en ISO 1219; el problema no es de símbolo sino de física: hay un camino permanente a la atmósfera.'},
        {t:'Porque una función O necesita obligatoriamente dos válvulas selectoras',ok:false,
         why:'Con dos entradas basta una selectora. El problema del empalme no es el número de componentes, es la fuga.'},
        {t:'Porque el aire comprimido no puede circular en dos sentidos por la misma tubería',ok:false,
         why:'Sí puede: precisamente por eso el aire de la rama activa se va por el escape de la rama en reposo.'},
      ],
    },
    reto:{
      pregunta:'¿Cuándo se compra el relevador de baja presión en vez de quedarse con la válvula de simultaneidad?',
      opciones:[
        {t:'Cuando la menor de las dos señales no llega al umbral de pilotaje pero sí alcanza el del relevador',ok:true,
         why:'Correcto. El relevador pilota con '+f1(P_PILOT_LP,1)+' bar y conmuta la línea entera: convierte una señal débil pero existente en una orden a presión de red. Es el único caso en que se paga un segundo componente.'},
        {t:'Siempre que la función sea Y: es el montaje recomendado',ok:false,
         why:'No. Si las dos señales llegan al umbral, la simultaneidad basta; y si las dos entradas son órganos de la misma línea, ni siquiera hace falta: dos 3/2 en serie salen gratis.'},
        {t:'Cuando el retardo pedido supera los 10 s',ok:false,
         why:'El retardo lo fijan el depósito y el estrangulador. El relevador resuelve un problema de presión, no de tiempo.'},
        {t:'Cuando la red puede caer 1 bar',ok:false,
         why:'La robustez frente a la caída de red se resuelve eligiendo depósito y apertura con margen, no añadiendo un relevador.'},
      ],
    },
  };
  Object.keys(QUIZ).forEach(k=>{
    const o=QUIZ[k].opciones;
    for(let i=o.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[o[i],o[j]]=[o[j],o[i]];}
  });
  void scL;void scT;void scF;
}
function clearDx(){el('dxbtns').innerHTML='';}
function refreshQuestion(){
  const q=QUIZ[mode];el('q_text').textContent=q.pregunta;
  el('dxbtns').innerHTML=q.opciones.map((o,i)=>`<button class="b sm" data-i="${i}">${String.fromCharCode(65+i)}) ${o.t}</button>`).join('');
  el('dxbtns').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>answer(+b.dataset.i));
}
function answer(i){
  const q=QUIZ[mode],o=q.opciones[i];
  el('dxbtns').querySelectorAll('[data-i]').forEach(b=>{
    b.disabled=true;
    const oo=q.opciones[+b.dataset.i];
    const cls=oo.ok?'right':(+b.dataset.i===i?'wrong':'');
    if(cls)b.classList.add(cls);
  });
  synth.beep(o.ok?880:200,0.09,0.05);
  showToast((o.ok?'✅ ':'❌ ')+o.why);
}

// ===================== 15. PICKING Y HOVER =====================
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  if(!hit){return;}
  let o=hit.object;
  if(o===board||o===frame){boardClick();return;}
  while(o){
    if(o.userData&&o.userData.title){showToast('<b>'+o.userData.title+'</b><br>'+(o.userData.info||''));return;}
    o=o.parent;
  }
});
(function hoverLoop(){
  const ray=new THREE.Raycaster();const m=new THREE.Vector2(-2,-2);
  S.renderer.domElement.addEventListener('pointermove',ev=>{
    const r=S.renderer.domElement.getBoundingClientRect();
    m.x=((ev.clientX-r.left)/r.width)*2-1;m.y=-((ev.clientY-r.top)/r.height)*2+1;
  });
  function tick(){
    ray.setFromCamera(m,S.camera);
    const objs=[...HOVER_LABELS.keys()];
    const hits=ray.intersectObjects(objs,true);
    const hitSet=new Set();
    hits.forEach(h=>{let o=h.object;while(o){if(HOVER_LABELS.has(o)){hitSet.add(o);break;}o=o.parent;}});
    HOVER_LABELS.forEach((spr,obj)=>{spr.visible=hitSet.has(obj);});
    requestAnimationFrame(tick);
  }
  tick();
})();

// ===================== 16. RECORRIDO AUTOMÁTICO =====================
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning)return;
  autoRunning=true;
  const btn=el('btnAuto'),label=btn.textContent;
  btn.disabled=true;btn.classList.add('on');btn.textContent='⏳ Recorriendo…';
  synth.init();synth.resume();clearDx();
  try{
    // --- 1. LÓGICA: la señal vale una presión ---
    setMode('logica');
    lgIdx=3;lgElem='simult';afterEdit();
    const scC=POOL[3];
    showToast('🔀 <b>Cabina de pintura</b>: función Y con dos señales a '+f1(scC.pRed,0)+' bar. La válvula de simultaneidad entrega la MENOR de las dos: <b>'+f1(pSalida(scC,'simult'),2)+' bar</b>, por encima de los '+f1(P_PILOT,1)+' de pilotaje.');
    await sleep(5000);
    lgElem='select';afterEdit();
    showToast('❌ La <b>selectora</b> entrega la MAYOR: aquí también '+f1(pSalida(scC,'select'),2)+' bar, así que la presión no delata el error. Pero es función <b>O</b>: dispararía con UNA sola señal y la cabina exige las dos.');
    await sleep(5200);
    lgIdx=2;lgElem='simult';afterEdit();
    const scE=POOL[2];
    showToast('⚠️ <b>Estación de encolado</b>: la segunda entrada es una rama regulada a '+f1(scE.ent[1].p,0)+' bar. La simultaneidad saca <b>'+f1(pSalida(scE,'simult'),2)+' bar</b> y el pilotaje pide '+f1(P_PILOT,1)+': la señal existe y la válvula no se mueve.');
    await sleep(5400);
    lgElem='ampl';afterEdit();
    showToast('✅ Con el <b>relevador de baja presión</b> (pilota a '+f1(P_PILOT_LP,1)+' bar) la salida sube a <b>'+f1(pSalida(scE,'ampl'),2)+' bar</b>. Se compra un segundo componente para comprar PRESIÓN, no lógica.');
    await sleep(5200);
    lgIdx=0;lgElem='serie';afterEdit();
    showToast('🧰 <b>Prensa de embutido</b>: dos pulsadores a '+f1(POOL[0].pRed,0)+' bar sobre la misma línea. Dos 3/2 <b>en serie</b> hacen la función Y con <b>'+compTxt(0)+'</b> de más: la simultaneidad aquí sobra.');
    await sleep(5200);

    // --- 2. FUGA: el empalme en T ---
    setMode('fuga');
    fgIdx=1;afterEdit();
    const fu=fugaTe(POOL[1]);
    showToast('🚱 <b>Empalme en T</b> en la puerta de horno: el nudo se queda en <b>'+f1(fu.pA,2)+' bar</b> con el pulsador del panel y sube a <b>'+f1(fu.pB,2)+'</b> con el pedal. La máquina funciona desde un mando y no desde el otro.');
    await sleep(5400);
    showToast('💸 Y mientras se mantiene la señal fuga <b>'+f1(Math.max(fu.qA,fu.qB),0)+' l/min ANR</b> por el escape de la válvula en reposo: '+f1(Math.max(fu.qA,fu.qB)*60*8/1000,1)+' m³ por turno, '+f1(Math.max(fu.qA,fu.qB)*60*8/1000*E_AIRE,1)+' kWh tirados. La selectora cuesta '+compTxt(1)+'.');
    await sleep(5200);

    // --- 3. TIEMPO: depósito, apertura y caída de red ---
    setMode('tiempo');
    tmIdx=2;tmDep='d250';tmAper=0.25;afterEdit();
    const tE=tRetardo(0.25,0.25,POOL[2].pRed);
    showToast('⏱️ <b>Encolado</b> otra vez, ahora el temporizador: '+DEP('d250').rot+' con la apertura '+f1(0.25,2)+' dan <b>'+f1(tE,2)+' s</b>, dentro de la ventana '+f1(POOL[2].tMin,2)+'–'+f1(POOL[2].tMax,2)+' s que pide el fraguado.');
    await sleep(5200);
    tmAper=0.10;afterEdit();
    showToast('🚫 Con la apertura en '+f1(0.10,2)+' el retardo sube a '+f1(tRetardo(0.25,0.10,POOL[2].pRed),2)+' s, pero el estrangulador ya <b>no repite</b>: por debajo de '+f1(K_MIN,2)+' el mismo tornillo da tiempos distintos cada día. El ajuste fino tiene un suelo.');
    await sleep(5400);
    tmAper=0.25;afterEdit();
    const tD=tRetardo(0.25,0.25,POOL[2].pRed-P_CAIDA), tD2=tRetardo(0.25,0.25,POOL[2].pRed-2*P_CAIDA);
    showToast('📉 Si la red cae '+f1(P_CAIDA,1)+' bar el mismo montaje tarda <b>'+f1(tD,2)+' s</b> (+'+f1(100*(tD/tE-1),1)+' %). Con dos bares menos, '+f1(tD2,2)+' s (+'+f1(100*(tD2/tE-1),1)+' %): el segundo bar cuesta más que el primero.');
    await sleep(5400);
    tmIdx=4;tmDep='d1000';tmAper=0.60;afterEdit();
    showToast('🪣 Y el depósito no es gratis: en el alimentador vibrante, '+DEP('d1000').rot+' mete '+f1(1.0*P_PILOT,2)+' l ANR por ciclo en aire que <b>no hace trabajo</b>. Con '+DEP('d50').rot+' serían '+f1(0.05*P_PILOT,3)+' l.');
    await sleep(5400);

    // --- 4. RETO ---
    setMode('reto');
    seedReto(2);afterEdit();
    showToast('🎯 <b>Reto</b>: proyecta la estación de encolado completa. Arranca mal en los tres ejes a propósito.');
    await sleep(4400);
    checkReto();
    showToast('❌ Comprobado con la propuesta de arranque: '+retoMsg);
    await sleep(5400);
    retoSolveBuild();afterEdit();
    const gE=GOOD(POOL[2]);
    showToast('✅ La única terna <b>válida y mínima</b>: '+ELEM(gE.elem).rot.toLowerCase()+', '+DEP(gE.dep).rot+' y apertura '+f1(gE.aper,2)+'. Comprobamos.');
    await sleep(4400);
    checkReto();
    await sleep(600);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 17. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt)=>{
  const sc=curSc(), cfg=curCfg(), e=evalCfg(sc,cfg), cy=ciclo(sc,cfg);
  const bloqueado=!e.okPres||!isFinite(cy.total);
  if(bloqueado){
    animT+=dt;
    animFase='bloqueo';
    animLlen=Math.min(0.86,(animT%4.0)/4.0*1.2);
    animP=0;
  }else{
    const T=cy.total;
    animT=(animT+dt*T/ANIM_CICLO)%T;
    if(animT<cy.tT){animFase='espera';animLlen=animT/cy.tT;animP=0;}
    else if(animT<cy.tT+cy.tIda){animFase='ida';animLlen=1;animP=(animT-cy.tT)/cy.tIda;}
    else{animFase='vuelta';animLlen=1;animP=Math.max(0,1-(animT-cy.tT-cy.tIda)/cy.tVue);}
  }
  updateHW();
});
['logica','tiempo','fuga','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
el('btnAuto').onclick=()=>{if(!autoRunning)runAuto();};
el('btnNew').onclick=()=>{if(autoRunning)return;newSignal();};
el('btnCheck').onclick=()=>{if(autoRunning)return;checkReto();};
const soundBtn=el('soundBtn');if(soundBtn){soundBtn.onclick=()=>{synth.toggle();soundBtn.textContent=synth.isOn()?'🔊':'🔇';};}
document.addEventListener('pointerdown',()=>{synth.init();synth.resume();},{once:true});
buildQuiz();
S.start();
setMode('logica');

// ===================== DEBUG HOOK =====================
window.__labDebug={
  mode:()=>mode,setMode,
  // constantes selladas
  P_ANR:()=>P_ANR,P_ATM:()=>P_ATM,B_CRIT:()=>B_CRIT,P_PILOT:()=>P_PILOT,P_PILOT_LP:()=>P_PILOT_LP,
  K_MIN:()=>K_MIN,P_CAIDA:()=>P_CAIDA,C_ESTR:()=>C_ESTR,E_AIRE:()=>E_AIRE,F_QN:()=>F_QN,
  CIL_ISO:()=>CIL_ISO,DEPOS:()=>DEPOS,DEPK:()=>DEPK,APERT:()=>APERT,ELEMS:()=>ELEMS,ELEMK:()=>ELEMK,
  POOL:()=>POOL,EJES:()=>EJES,CRIT:()=>CRIT,
  // motor
  areaEmb,areaAnu,qFlujo,cDeQn,tRetardo,pNodo,fugaTe,pSalida,serieVale,
  evalCfg,cmpCoste,elemVale,tempVale,GOOD,okEje,porQue,cfgWith,ciclo,ELEM,DEP,
  // estado
  curSc,curCfg,curEval,curCiclo,
  lgGet:()=>({idx:lgIdx,elem:lgElem}),
  lgSet:(o)=>{if(o.idx!==undefined)lgIdx=o.idx;if(o.elem)lgElem=o.elem;afterEdit();},
  tmGet:()=>({idx:tmIdx,dep:tmDep,aper:tmAper}),
  tmSet:(o)=>{if(o.idx!==undefined)tmIdx=o.idx;if(o.dep)tmDep=o.dep;if(o.aper!==undefined)tmAper=o.aper;afterEdit();},
  fgGet:()=>({idx:fgIdx}),
  fgSet:(o)=>{if(o.idx!==undefined)fgIdx=o.idx;afterEdit();},
  // reto
  retoK:()=>retoK,seedReto,retoName:()=>retoSc().nom,retoId:()=>retoSc().id,
  retoGet:()=>retoCfg(),retoSet,retoSolveBuild,checkReto,retoExplain,
  retoChecked:()=>retoChecked,retoOkElem:()=>retoOkElem,retoOkDep:()=>retoOkDep,retoOkAper:()=>retoOkAper,
  retoSolved:()=>retoSolved,retoMsg:()=>retoMsg,retoGood:()=>GOOD(retoSc()),retoStart:()=>startCfg(retoSc()),
  // cuestionario
  quizCorrectIndex:()=>QUIZ[mode].opciones.findIndex(o=>o.ok),
  quizAnswer:answer,newSignal,
  solved:()=>solved,autoRunning:()=>autoRunning,
};
