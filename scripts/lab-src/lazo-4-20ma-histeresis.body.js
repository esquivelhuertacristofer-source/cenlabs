// Lazo de corriente 4-20 mA: escalado y = mx + b, cumplimiento de tensión y control on/off con
// histéresis. Motor verificado numéricamente (verify_lazo420.mjs, 183/183) y pegado aquí VERBATIM:
// simulación y verificación comparten implementación.
//   ESCALADO: la señal es una CORRIENTE, no una tensión. i = 4 + 16·(PV − LRV)/(URV − LRV) mA.
//     El 4 mA de cero vivo permite distinguir "cero de proceso" de "lazo roto" (0 mA).
//   NAMUR NE 43: la banda de medida va de 3,8 a 20,5 mA. Por debajo de 3,6 y por encima de 21,0 mA
//     la señal ya no es medida: es un aviso de AVERÍA del transmisor. Entre 3,6 y 3,8 (y entre 20,5
//     y 21,0) el transmisor sigue midiendo y avisa de que el proceso se salió del rango calibrado.
//   CUMPLIMIENTO DE TENSIÓN: en un lazo de 2 hilos el transmisor necesita una tensión mínima para
//     funcionar. R_max = (V_alim − V_tx,min)/I. Si el lazo tiene más resistencia de la que admite,
//     la corriente SATURA y la lectura se congela: parece un sensor averiado y es un cable mal
//     dimensionado. Se dimensiona a 20,5 mA (NE 43), no a 20,0 mA.
//   CONTROL ON/OFF CON HISTÉRESIS: sin banda muerta el ruido de la medida hace conmutar el
//     contactor sin parar (chatter). Con banda muerta ancha se protege el motor pero el proceso
//     oscila más. La banda muerta se elige contra DOS límites: arranques/hora y banda de error.
//   Ref: NAMUR NE 43 · IEC 60381-1 · ISA-50.00.01 · IEC 61508 (diagnóstico por señal analógica) ·
//        NEMA MG-1 y guías de fabricantes de arrancadores (arranques/hora) · verificación propia.

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.2,3.1,7.4],target:[0.6,1.05,0.4],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.44,minD:3.2,maxD:16});
const {scene}=S;
const synth=makeSynth({type:'square',type2:'sine',filterFreq:2400,Q:0.7});
const el=id=>document.getElementById(id);

// ===================== 2. MOTOR (VERIFICADO 183/183 — VERBATIM) =====================
// --- NAMUR NE 43: banda de medida y señales de falla ---
const NE43 = { lo: 3.8, hi: 20.5, failLo: 3.6, failHi: 21.0 };
const clampMeas = i => Math.min(NE43.hi, Math.max(NE43.lo, i));
// Clasificación de la corriente leída, derivada de las MISMAS constantes de la NE 43.
// 'bajoRango'/'sobreRango' no son averías: el transmisor sigue midiendo y avisa de que
// el proceso se salió del rango calibrado. La avería empieza en 3,6 y en 21,0 mA.
function statusOf(i) {
  if (i < 1) return 'abierto';
  if (i <= NE43.failLo + 1e-9) return 'fallaBaja';
  if (i < NE43.lo - 1e-9) return 'bajoRango';
  if (i <= NE43.hi + 1e-9) return 'medida';
  if (i < NE43.failHi - 1e-9) return 'sobreRango';
  return 'fallaAlta';
}

// --- Escalado y = mx + b ---
const spanOf = r => r.urv - r.lrv;
const mAideal = (pv, r) => 4 + 16 * (pv - r.lrv) / spanOf(r);
const mAout = (pv, r) => clampMeas(mAideal(pv, r));
const pvFromMA = (i, r) => r.lrv + (i - 4) / 16 * spanOf(r);
const pctOf = i => (i - 4) / 16 * 100;
const inBand = (pv, r) => { const i = mAideal(pv, r); return i >= NE43.lo - 1e-9 && i <= NE43.hi + 1e-9; };

// --- Lazo eléctrico (2 hilos) ---
const RHO = { 16: 13.17, 18: 20.95, 20: 33.31, 22: 52.96 }; // ohm/km, cobre a 20 °C
const AWGS = [16, 18, 20, 22];
const rCable = (awg, len) => RHO[awg] * 2 * len / 1000;
const rTotal = lp => lp.rsense + rCable(lp.awg, lp.len) + lp.rextra;
const iMax = lp => (lp.vsup - lp.vtxmin) / rTotal(lp) * 1000;      // mA que el lazo puede sostener
const iLoop = (idem, lp) => Math.min(idem, iMax(lp));              // el transmisor se queda sin tensión
const vSense = (i, lp) => i / 1000 * lp.rsense;
const rMaxAt = (lp, mA) => (lp.vsup - lp.vtxmin) / (mA / 1000);
const okAt = (lp, mA) => iMax(lp) >= mA - 1e-9;
const lpWith = (sc, o) => ({ awg: sc.awg, len: sc.len, rsense: sc.rsense, rextra: sc.rextra, vsup: sc.vsup, vtxmin: sc.vtxmin, ...o });

// --- Errores de calibración: cero (desplaza) y span (inclina) ---
const iWithErr = (pv, r, e) => clampMeas(4 + (mAideal(pv, r) - 4) * (1 + e.span) + e.zero);
function calib2p(r, e) {                       // ajuste de 2 puntos: cero en LRV, span en URV
  const zero = 4 - (4 + e.zero);                                   // corrección de cero
  const at20 = 4 + 16 * (1 + e.span) + e.zero + zero;              // tras corregir el cero
  const span = at20 === 4 ? 0 : 16 / (at20 - 4) - 1;               // corrección de span
  return { zero, span };
}
const iCalibrado = (pv, r, e, c) => clampMeas(4 + ((4 + (mAideal(pv, r) - 4) * (1 + e.span) + e.zero + c.zero) - 4) * (1 + c.span));

// --- Ruido determinista ---
function lcg(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// --- Control on/off con histéresis sobre un tanque ---
const DT_T = 1;            // s
const WARM = 1800;         // s de calentamiento antes de medir
const TOT_T = 23400;       // s (media hora de calentamiento + 6 h de medida)
function runTank(sc, cfg, opt) {
  opt = opt || {};
  const r = { lrv: cfg.rango[0], urv: cfg.rango[1] };
  const lp = lpWith(sc, { awg: cfg.awg });
  const db = cfg.db / 100 * spanOf(r);
  const qin = opt.qin != null ? opt.qin : sc.qin;
  const hi = sc.sp + db / 2, lo = sc.sp - db / 2;
  const TOT = opt.tot || TOT_T;
  const rnd = lcg(20260726);
  let h = sc.sp, pump = false, starts = 0, over = false, dry = false;
  let hmin = Infinity, hmax = -Infinity;
  const trace = [];
  for (let t = 0; t < TOT; t += DT_T) {
    const hn = h + (rnd() * 2 - 1) * sc.noise;
    const i = iLoop(mAout(hn, r), lp);
    const hm = pvFromMA(i, r);
    const prev = pump;
    if (!pump && hm >= hi) pump = true;
    else if (pump && hm <= lo) pump = false;
    if (pump && !prev && t >= WARM) starts++;
    const q = qin - (pump ? sc.qout : 0);          // L/min
    h = h + q / 60000 / sc.A * DT_T;               // L/min -> m³/s -> m
    if (h > sc.hTank) { h = sc.hTank; over = true; }
    if (h < 0) { h = 0; dry = true; }
    if (t >= WARM) { if (h < hmin) hmin = h; if (h > hmax) hmax = h; }
    if (opt.trace && t % (opt.trace) === 0) trace.push({ t, h, hm, pump, i });
  }
  const horas = (TOT - WARM) / 3600;
  return { starts, startsH: starts / horas, band: hmax - hmin, hmin, hmax, over, dry, db, trace };
}
// Periodo teórico del ciclo (sin ruido) y peor caso
const cicloMin = (sc, db, qin) => db * sc.A * 1000 * (1 / qin + 1 / (sc.qout - qin));
const startsTeor = (sc, db, qin) => 60 / cicloMin(sc, db, qin);
const qinPeor = sc => sc.qout / 2;
const startsPeor = (sc, db) => 15 * sc.qout / (db * sc.A * 1000);

// ===================== ESCENARIOS =====================
const POOL = [
  {
    name: 'Cisterna de bombeo', tag: 'Vaciado de cisterna a colector',
    A: 3.0, qout: 180, qin: 70, hTank: 5.0, sp: 2.40, hProc: [0.20, 4.20], noise: 0.020,
    rangos: [[0, 5], [0, 10], [0, 3], [2, 6]], tolMeas: 0.030,
    len: 4000, rsense: 250, rextra: 0, vsup: 24, vtxmin: 12, awg: 20,
    dbOpts: [0.5, 2, 5, 12], tolBand: 0.28, maxStarts: 6,
  },
  {
    name: 'Pozo de achique', tag: 'Achique de sótano técnico',
    A: 1.2, qout: 120, qin: 40, hTank: 3.0, sp: 1.20, hProc: [0.10, 2.40], noise: 0.015,
    rangos: [[0, 3], [0, 6], [0, 2], [1, 4]], tolMeas: 0.020,
    len: 6000, rsense: 250, rextra: 0, vsup: 24, vtxmin: 12, awg: 18,
    dbOpts: [0.5, 2, 6, 15], tolBand: 0.22, maxStarts: 12,
  },
  {
    name: 'Tanque de proceso', tag: 'Trasiego a línea de llenado',
    A: 5.0, qout: 300, qin: 110, hTank: 4.0, sp: 1.80, hProc: [0.15, 3.20], noise: 0.025,
    rangos: [[0, 4], [0, 8], [0, 2.5], [1, 3]], tolMeas: 0.025,
    len: 2500, rsense: 250, rextra: 250, vsup: 24, vtxmin: 12, awg: 16,
    dbOpts: [1, 3, 8, 18], tolBand: 0.35, maxStarts: 5,
  },
  {
    name: 'Depósito de reactivo', tag: 'Dosificación a reactor',
    A: 0.8, qout: 60, qin: 22, hTank: 2.5, sp: 1.00, hProc: [0.08, 1.90], noise: 0.010,
    rangos: [[0, 2], [0, 5], [0, 1.5], [0.5, 2.5]], tolMeas: 0.015,
    len: 1200, rsense: 500, rextra: 0, vsup: 24, vtxmin: 12, awg: 20,
    dbOpts: [0.5, 2, 7, 16], tolBand: 0.16, maxStarts: 11,
  },
];

// ===================== CALIFICACIÓN DEL RETO =====================
const GOOD = sc => ({ rango: goodRango(sc), awg: goodAwg(sc), db: goodDb(sc) });
const cfgWith = (sc, o) => ({ ...GOOD(sc), ...o });

// 1) Rango: cubre TODO el recorrido del proceso dentro de 3,8-20,5 mA
//    y la incertidumbre del transmisor (0,5 % del span) cabe en la tolerancia pedida.
const ERR_SPAN = 0.005;
function okRango(sc, rg) {
  const r = { lrv: rg[0], urv: rg[1] };
  if (spanOf(r) <= 0) return false;
  if (!inBand(sc.hProc[0], r) || !inBand(sc.hProc[1], r)) return false;
  return ERR_SPAN * spanOf(r) <= sc.tolMeas + 1e-12;
}
function goodRango(sc) { return sc.rangos.find(rg => okRango(sc, rg)) || sc.rangos[0]; }

// 2) Calibre: el MENOR cobre que sostiene 20,5 mA (NE 43), no sólo 20,0 mA
function okAwg(sc, awg) {
  if (!okAt(lpWith(sc, { awg }), NE43.hi)) return false;
  const i = AWGS.indexOf(awg);
  const finer = AWGS[i + 1];
  return finer === undefined ? true : !okAt(lpWith(sc, { awg: finer }), NE43.hi);
}
function goodAwg(sc) { return AWGS.find(a => okAwg(sc, a)) || AWGS[0]; }

// 3) Banda muerta: arranques/hora en el PEOR caso (qin = qout/2) y banda de error
const _dbCache = {};
function okDb(sc, db) {
  const k = sc.name + '|' + db;
  if (_dbCache[k] === undefined) _dbCache[k] = okDbCalc(sc, db);
  return _dbCache[k];
}
function okDbCalc(sc, db) {
  const cfg = { rango: goodRango(sc), awg: goodAwg(sc), db };
  const r = { lrv: cfg.rango[0], urv: cfg.rango[1] };
  const dbM = db / 100 * spanOf(r);
  const peor = runTank(sc, cfg, { qin: qinPeor(sc) });
  if (peor.startsH > sc.maxStarts + 1e-9) return false;
  if (dbM > sc.tolBand + 1e-9) return false;
  const nom = runTank(sc, cfg);
  return !nom.over && !nom.dry;
}
function goodDb(sc) { return sc.dbOpts.find(d => okDb(sc, d)) || sc.dbOpts[0]; }

// --- Memoria de corridas: runTank se invoca en cada redibujado ---
const RUN_CACHE=new Map();
function runC(sc,cfg,opt){
  const key=sc.name+'|'+JSON.stringify(cfg)+'|'+JSON.stringify(opt||{});
  if(RUN_CACHE.has(key))return RUN_CACHE.get(key);
  const r=runTank(sc,cfg,opt);
  if(RUN_CACHE.size>60)RUN_CACHE.clear();
  RUN_CACHE.set(key,r);return r;
}

// ===================== 3. ESTADO =====================
let mode='explora';
const RETO_POOL=[0,1,2,3];
// explora — el lazo de un escenario, con la variable de proceso y las señales de falla
const FALLAS=[['no','Proceso'],['bajo','Bajo rango'],['sobre','Sobre rango'],['fb','Falla baja'],['fa','Falla alta'],['ab','Hilo roto']];
const FALLA_I={bajo:3.7,sobre:20.8,fb:NE43.failLo,fa:NE43.failHi,ab:0};
let expIdx=0,expStep=2,expFalla='no';           // expStep: 0..4 = 0 %, 25 %, 50 %, 75 %, 100 % del recorrido
// aplica
let apTopic='escala';                            // 'escala' | 'lazo' | 'histeresis'
let apIdx=0,apErr=0,apCal=false,apAwg=20,apDb=0;
// reto
let retoK=0;
let retoCh={rango:0,awg:22,db:0.5};
let retoChecked=false,retoOkRango=false,retoOkAwg=false,retoOkDb=false,retoSolved=false,retoMsg='';
let solved=false,autoRunning=false,QUIZ={};
let hwStep=0,hwT=0,framesCache=null;

const ERRS=[
  {k:'cero',t:'Cero +0,40 mA',e:{zero:0.40,span:0},d:'El transmisor entrega 4,40 mA con el tanque en el LRV.'},
  {k:'span',t:'Span +3 %',e:{zero:0,span:0.03},d:'El cero está bien, pero la pendiente es un 3 % mayor de la debida.'},
  {k:'ambos',t:'Cero −0,30 y span −2 %',e:{zero:-0.30,span:-0.02},d:'Los dos errores a la vez: la recta está desplazada y además inclinada.'},
];

function pickIdx(n,ex){let v=Math.floor(Math.random()*n);if(n>1)while(v===ex)v=Math.floor(Math.random()*n);return v;}
function hexA(hex,a){const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;}
const n0=x=>Math.round(x).toString();
const n1=x=>x.toFixed(1).replace('.',',');
const n2=x=>x.toFixed(2).replace('.',',');
const n3=x=>x.toFixed(3).replace('.',',');
const fmtR=rg=>n1(rg[0])+'–'+n1(rg[1])+' m';

const ST_META={
  abierto:['Lazo abierto (0 mA)','#ff6b6b'],
  fallaBaja:['Falla baja · NE 43','#ff6b6b'],
  bajoRango:['Bajo rango','#E9C46A'],
  medida:['Medida válida','#7CD992'],
  sobreRango:['Sobre rango','#E9C46A'],
  fallaAlta:['Falla alta · NE 43','#ff6b6b'],
};

// --- explora: derivados ---
const expSc=()=>POOL[expIdx];
const expR=()=>{const rg=goodRango(expSc());return {lrv:rg[0],urv:rg[1]};};
const expLp=()=>lpWith(expSc(),{awg:goodAwg(expSc())});
function expPv(){const sc=expSc();return sc.hProc[0]+(expStep/4)*(sc.hProc[1]-sc.hProc[0]);}
function expI(){
  if(expFalla!=='no')return FALLA_I[expFalla];
  return iLoop(mAout(expPv(),expR()),expLp());
}
const expSt=()=>statusOf(expI());

// --- reto: derivados ---
const retoSc=()=>POOL[RETO_POOL[retoK]];
const retoRango=()=>retoSc().rangos[retoCh.rango];
const retoCfg=()=>({rango:retoRango(),awg:retoCh.awg,db:retoCh.db});
function seedReto(k){
  retoK=(k==null)?pickIdx(RETO_POOL.length,retoK):k;
  const sc=retoSc();
  // configuración de partida deliberadamente MAL en las TRES decisiones
  const badRg=sc.rangos.findIndex(rg=>!okRango(sc,rg));
  const badAwg=[...AWGS].reverse().find(a=>!okAwg(sc,a));
  const badDb=sc.dbOpts.find(d=>!okDb(sc,d));
  retoCh={rango:badRg<0?0:badRg,awg:badAwg===undefined?AWGS[AWGS.length-1]:badAwg,db:badDb===undefined?sc.dbOpts[0]:badDb};
  retoChecked=false;retoOkRango=false;retoOkAwg=false;retoOkDb=false;retoSolved=false;retoMsg='';
}
seedReto(0);

// ===================== 4. MATERIALES =====================
function std(color,rough,metal){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
function brush(base){return std(base,0.55,0.35);}
const MAT={bench:brush(0x2b2f34),frame:brush(0x22262c),leg:brush(0x14161b),body:std(0x1b2028,0.6,0.25),
  steel:std(0x9aa4b2,0.35,0.75),shiny:std(0xd6dde8,0.22,0.9),dark:std(0x14171b,0.5,0.3),plate:brush(0x3a4048),
  copper:std(0xb87333,0.4,0.8)};
const ACC='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A', VIO='#C08CF8';

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

// ===================== 5. PIZARRÓN =====================
const boardG=new THREE.Group();
boardG.position.set(-1.15,0,-0.95);boardG.rotation.y=0.2;scene.add(boardG);
const frame=roundedBox(3.9,2.9,0.12,MAT.frame,0.06);frame.position.set(0,1.9,0);boardG.add(frame);
[-1.65,1.65].forEach(x=>{const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,1.9,16),MAT.leg);leg.position.set(x,0.92,0);boardG.add(leg);});
const bCv=document.createElement('canvas');bCv.width=1024;bCv.height=768;
const bTex=new THREE.CanvasTexture(bCv);
const board=new THREE.Mesh(new THREE.PlaneGeometry(3.68,2.72),new THREE.MeshBasicMaterial({map:bTex}));
board.position.set(0,1.9,0.065);boardG.add(board);
frame.userData={title:'Pizarrón de instrumentación',info:'Escalado, cumplimiento del lazo y control on/off · toca para inspeccionar'};
addHoverLabel(frame,'Lazo 4–20 mA · NE 43',ACC,new THREE.Vector3(0,3.5,0.1).add(boardG.position),2.6);

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
const PX={x:706,y:70,w:300};

function axes(c,x,y,w,h,xl,yl){
  c.strokeStyle='rgba(255,255,255,0.16)';c.lineWidth=1;
  c.beginPath();c.moveTo(x,y);c.lineTo(x,y+h);c.lineTo(x+w,y+h);c.stroke();
  c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';
  c.textAlign='right';c.fillText(xl,x+w,y+h+18);
  c.textAlign='left';c.fillText(yl,x,y-8);
}
function trow(c,x,y,w,h,cols,widths,cols_col,head){
  c.fillStyle=head?hexA(ACC,0.10):'rgba(255,255,255,0.03)';c.fillRect(x,y,w,h);
  c.strokeStyle=hexA(ACC,0.16);c.lineWidth=1;c.strokeRect(x,y,w,h);
  let cx=x;
  cols.forEach((t,i)=>{
    c.fillStyle=head?'#C7D6F5':(cols_col&&cols_col[i]?cols_col[i]:'#F4EFEA');
    c.font=(head?'bold 12px':'13px')+' Outfit, sans-serif';c.textAlign='left';
    c.fillText(t,cx+10,y+h/2+5);
    cx+=widths[i];
  });
}
function drawBar(c,x,y,w,h,frac,label,col,right){
  c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';c.textAlign='left';c.fillText(label,x,y-8);
  c.fillStyle='rgba(255,255,255,0.06)';c.fillRect(x,y,w,h);
  c.fillStyle=hexA(col,0.75);c.fillRect(x,y,Math.max(0,Math.min(1,frac))*w,h);
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(x,y,w,h);
  c.fillStyle=col;c.font='bold 13px Outfit, sans-serif';c.textAlign='right';c.fillText(right,x+w,y-8);
}
// --- franja NE 43: de 3,2 a 21,4 mA con sus zonas y el cursor de la corriente leída ---
function drawNE43(c,x,y,w,h,i){
  const I0=3.2,I1=21.4,sx=v=>x+((v-I0)/(I1-I0))*w;
  const zonas=[
    [I0,NE43.failLo,'#ff6b6b','avería'],
    [NE43.failLo,NE43.lo,'#E9C46A','bajo rango'],
    [NE43.lo,NE43.hi,'#7CD992','medida 3,8 – 20,5 mA'],
    [NE43.hi,NE43.failHi,'#E9C46A','sobre rango'],
    [NE43.failHi,I1,'#ff6b6b','avería'],
  ];
  zonas.forEach(z=>{c.fillStyle=hexA(z[2],0.28);c.fillRect(sx(z[0]),y,sx(z[1])-sx(z[0]),h);});
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(x,y,w,h);
  c.font='10px Outfit, sans-serif';c.textAlign='center';
  zonas.forEach(z=>{const cx=(sx(z[0])+sx(z[1]))/2;if(sx(z[1])-sx(z[0])>40){c.fillStyle=z[2];c.fillText(z[3],cx,y+h/2+4);}});
  [3.6,3.8,12,20.5,21.0].forEach(v=>{
    c.strokeStyle='rgba(255,255,255,0.35)';c.lineWidth=1;
    c.beginPath();c.moveTo(sx(v),y);c.lineTo(sx(v),y+h+5);c.stroke();
    c.fillStyle='#8f97a5';c.font='10px Outfit, sans-serif';c.textAlign='center';c.fillText(n1(v),sx(v),y+h+18);
  });
  if(i!=null&&i>=I0){
    const px=sx(Math.min(i,I1));
    c.strokeStyle='#F4EFEA';c.lineWidth=2.5;c.beginPath();c.moveTo(px,y-8);c.lineTo(px,y+h+2);c.stroke();
    c.fillStyle='#F4EFEA';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.fillText(n2(i)+' mA',px,y-13);
  }else if(i!=null){
    c.fillStyle=BAD_HEX;c.font='bold 12px Outfit, sans-serif';c.textAlign='left';c.fillText('0 mA — fuera de la escala: el lazo está abierto',x+6,y-13);
  }
}

// ===================== 6. VISTAS POR MODO =====================
function drawExplora(c){
  const sc=expSc(),r=expR(),lp=expLp(),pv=expPv(),i=expI(),st=expSt();
  const ide=mAideal(pv,r);
  c.fillStyle='#F4EFEA';c.font='bold 26px Outfit, sans-serif';c.textAlign='left';
  c.fillText('El lazo de 4–20 mA: la medida viaja como CORRIENTE',30,54);
  c.fillStyle='#9fb0cf';c.font='14px Outfit, sans-serif';
  wrapText(c,'Dos hilos llevan la alimentación y la señal a la vez. El transmisor no genera tensión: regula la corriente que consume, entre 4 y 20 mA, en proporción lineal a la variable de proceso. Como la corriente es la misma en todo el lazo, la caída del cable no falsea la medida —eso es lo que no consigue una señal en tensión—. El receptor cierra el lazo con una resistencia de precisión y mide la caída sobre ella.',30,80,640,20);
  // --- diagrama del lazo ---
  const dx=30,dy=168,dw=640,dh=112;
  c.fillStyle=hexA(ACC,0.05);c.fillRect(dx,dy,dw,dh);
  c.strokeStyle=hexA(ACC,0.20);c.lineWidth=1;c.strokeRect(dx,dy,dw,dh);
  const cy=dy+dh/2;
  const okLoop=st!=='abierto';
  const wire=okLoop?ACC:BAD_HEX;
  c.strokeStyle=wire;c.lineWidth=2.5;
  c.beginPath();c.moveTo(dx+80,cy-30);c.lineTo(dx+250,cy-30);c.stroke();     // + hacia el transmisor
  c.beginPath();c.moveTo(dx+80,cy+30);c.lineTo(dx+250,cy+30);c.stroke();     // retorno
  c.beginPath();c.moveTo(dx+330,cy-30);c.lineTo(dx+520,cy-30);c.stroke();
  c.beginPath();c.moveTo(dx+330,cy+30);c.lineTo(dx+520,cy+30);c.stroke();
  if(!okLoop){c.strokeStyle=BAD_HEX;c.lineWidth=3;c.beginPath();c.moveTo(dx+400,cy-40);c.lineTo(dx+430,cy-20);c.stroke();
    c.fillStyle=BAD_HEX;c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.fillText('hilo roto',dx+415,cy-48);}
  // fuente
  c.fillStyle='rgba(255,255,255,0.05)';c.fillRect(dx+20,cy-40,60,80);
  c.strokeStyle=hexA(ACC,0.4);c.lineWidth=1;c.strokeRect(dx+20,cy-40,60,80);
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.textAlign='center';c.fillText(n0(lp.vsup)+' V',dx+50,cy-4);
  c.fillStyle='#8f97a5';c.font='10px Outfit, sans-serif';c.fillText('alimentación',dx+50,cy+14);
  // transmisor
  c.fillStyle=hexA(VIO,0.10);c.fillRect(dx+250,cy-42,80,84);
  c.strokeStyle=VIO;c.lineWidth=1.5;c.strokeRect(dx+250,cy-42,80,84);
  c.fillStyle='#F4EFEA';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.fillText('TRANSMISOR',dx+290,cy-18);
  c.fillStyle=VIO;c.font='bold 15px Outfit, sans-serif';c.fillText(n2(i)+' mA',dx+290,cy+4);
  c.fillStyle='#8f97a5';c.font='10px Outfit, sans-serif';c.fillText('2 hilos · V mín '+n0(lp.vtxmin)+' V',dx+290,cy+24);
  // resistencia de medida
  c.fillStyle=hexA(OK_HEX,0.10);c.fillRect(dx+520,cy-42,100,84);
  c.strokeStyle=OK_HEX;c.lineWidth=1.5;c.strokeRect(dx+520,cy-42,100,84);
  c.fillStyle='#F4EFEA';c.font='bold 12px Outfit, sans-serif';c.textAlign='center';c.fillText('R medida',dx+570,cy-18);
  c.fillStyle=OK_HEX;c.font='bold 15px Outfit, sans-serif';c.fillText(n0(lp.rsense)+' Ω',dx+570,cy+2);
  c.fillStyle='#C7D6F5';c.font='bold 13px Outfit, sans-serif';c.fillText(n3(vSense(i,lp))+' V',dx+570,cy+24);
  c.fillStyle='#8f97a5';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('cable de par trenzado · '+n0(lp.len)+' m · AWG '+lp.awg+' · '+n1(rCable(lp.awg,lp.len))+' Ω',dx+340,cy+54);
  // --- recta de escalado ---
  const gx=30,gy=320,gw=300,gh=180;
  axes(c,gx,gy,gw,gh,'PV (m)','i (mA)');
  const I0=3.2,I1=21.5;
  const sy=v=>gy+gh-((v-I0)/(I1-I0))*gh;
  const sxp=v=>gx+((v-r.lrv)/spanOf(r))*gw;
  // banda de medida
  c.fillStyle=hexA(OK_HEX,0.10);c.fillRect(gx,sy(NE43.hi),gw,sy(NE43.lo)-sy(NE43.hi));
  [4,12,20].forEach(v=>{c.strokeStyle='rgba(255,255,255,0.10)';c.lineWidth=1;c.beginPath();c.moveTo(gx,sy(v));c.lineTo(gx+gw,sy(v));c.stroke();
    c.fillStyle='#7a8494';c.font='10px Outfit, sans-serif';c.textAlign='right';c.fillText(n0(v),gx-4,sy(v)+4);});
  c.strokeStyle=ACC;c.lineWidth=2.5;c.beginPath();
  c.moveTo(sxp(r.lrv),sy(4));c.lineTo(sxp(r.urv),sy(20));c.stroke();
  // recorrido real del proceso
  c.strokeStyle=hexA(VIO,0.85);c.lineWidth=3;
  c.beginPath();c.moveTo(sxp(sc.hProc[0]),gy+gh);c.lineTo(sxp(sc.hProc[0]),gy+gh-8);c.stroke();
  c.beginPath();c.moveTo(sxp(sc.hProc[1]),gy+gh);c.lineTo(sxp(sc.hProc[1]),gy+gh-8);c.stroke();
  c.fillStyle=VIO;c.font='10px Outfit, sans-serif';c.textAlign='center';
  c.fillText('recorrido del proceso',(sxp(sc.hProc[0])+sxp(sc.hProc[1]))/2,gy+gh+16);
  if(expFalla==='no'){
    c.fillStyle='#F4EFEA';c.beginPath();c.arc(sxp(pv),sy(ide),5,0,Math.PI*2);c.fill();
    c.fillStyle='#F4EFEA';c.font='bold 11px Outfit, sans-serif';c.textAlign='left';
    c.fillText(n2(pv)+' m → '+n2(ide)+' mA',sxp(pv)+8,sy(ide)-6);
  }
  c.fillStyle='#8f97a5';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('m = 16/span = '+n3(16/spanOf(r))+' mA/m · b = 4 mA en LRV = '+n1(r.lrv)+' m',gx,gy+gh+34);
  // --- franja NE 43 ---
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText('NAMUR NE 43 · qué significa cada corriente',352,336);
  drawNE43(c,352,368,318,44,i);
  c.fillStyle=ST_META[st][1];c.font='bold 15px Outfit, sans-serif';c.textAlign='left';
  c.fillText(ST_META[st][0],352,452);
  c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';
  wrapText(c,'El 4 mA de cero vivo es lo que permite distinguir «el proceso está en el mínimo» de «el lazo está roto». Sin él, 0 mA sería una lectura legítima y ninguna avería sería detectable.',352,472,318,17);
  // --- tabla de puntos de la escala ---
  const ty=548,tw=640,tws=[150,170,160,160];
  trow(c,30,ty,tw,26,['Punto de la escala','PV','i ideal','% de la señal'],tws,null,true);
  [0,0.25,0.5,0.75,1].forEach((f,k)=>{
    const p=r.lrv+f*spanOf(r),ii=mAideal(p,r);
    trow(c,30,ty+26+k*26,tw,26,[k===0?'LRV (0 %)':k===4?'URV (100 %)':n0(f*100)+' % del span',n2(p)+' m',n2(ii)+' mA',n1(pctOf(ii))+' %'],tws,
      [null,null,k===0||k===4?ACC:null,null]);
  });
  // --- panel derecho ---
  rpanel(c,PX.x,PX.y,PX.w,428,sc.name);
  let y=PX.y+56;const L=16;
  prow(c,PX.x,y,PX.w,'Rango calibrado',fmtR(goodRango(sc)));y+=26;
  prow(c,PX.x,y,PX.w,'Span',n1(spanOf(r))+' m');y+=26;
  prow(c,PX.x,y,PX.w,'Variable de proceso',n2(pv)+' m',VIO);y+=26;
  prow(c,PX.x,y,PX.w,'i ideal (y = mx + b)',n3(ide)+' mA');y+=26;
  prow(c,PX.x,y,PX.w,'i en el lazo',n2(i)+' mA',ST_META[st][1]);y+=26;
  prow(c,PX.x,y,PX.w,'Señal',n1(pctOf(i))+' %');y+=26;
  prow(c,PX.x,y,PX.w,'V sobre R medida',n3(vSense(i,lp))+' V',OK_HEX);y+=26;
  prow(c,PX.x,y,PX.w,'Estado NE 43',ST_META[st][0],ST_META[st][1]);y+=30;
  c.strokeStyle=hexA(ACC,0.18);c.beginPath();c.moveTo(PX.x+L,y-14);c.lineTo(PX.x+PX.w-L,y-14);c.stroke();
  prow(c,PX.x,y,PX.w,'R total del lazo',n1(rTotal(lp))+' Ω');y+=26;
  prow(c,PX.x,y,PX.w,'i máx que sostiene',n2(iMax(lp))+' mA',iMax(lp)>=NE43.hi?OK_HEX:BAD_HEX);y+=26;
  prow(c,PX.x,y,PX.w,'R máx a 20,5 mA',n1(rMaxAt(lp,NE43.hi))+' Ω');y+=30;
  c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,expFalla==='no'
    ?'Mueve la variable de proceso y observa que la corriente sigue la recta. Después fuerza una señal de falla y compara: la NE 43 reserva los extremos para avisar, no para medir.'
    :'Estás forzando una señal que NO es una medida de proceso. Un receptor que la interprete como nivel dará una orden equivocada; por eso la NE 43 exige clasificarla antes de usarla.',
    PX.x+L,y,PX.w-2*L,17);
  // --- pie ---
  c.fillStyle='#6b7280';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('NAMUR NE 43 · IEC 60381-1 · ISA-50.00.01 — la corriente es la señal; la tensión sobre R sólo es su lectura',30,752);
}

// ---------- APLICA ----------
function drawAplicaEscala(c){
  const sc=POOL[apIdx],rg=goodRango(sc),r={lrv:rg[0],urv:rg[1]};
  const E=ERRS[apErr],e=E.e,cal=calib2p(r,e);
  c.fillStyle='#F4EFEA';c.font='bold 25px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Errores de cero y de span, y el ajuste de dos puntos',30,54);
  c.fillStyle='#9fb0cf';c.font='14px Outfit, sans-serif';
  wrapText(c,'Un error de CERO desplaza la recta entera: todas las lecturas se equivocan en la misma cantidad de mA. Un error de SPAN la inclina: el fallo crece con la medida y en el LRV puede ser nulo. Por eso se calibra en dos puntos —primero el cero en el LRV, después el span en el URV— y en ese orden: corregir el span antes que el cero obliga a repetir los dos.',30,80,640,20);
  // gráfica
  const gx=30,gy=176,gw=310,gh=210;
  axes(c,gx,gy,gw,gh,'PV (m)','i (mA)');
  const I0=3.2,I1=21.5,sy=v=>gy+gh-((v-I0)/(I1-I0))*gh,sxp=v=>gx+((v-r.lrv)/spanOf(r))*gw;
  c.fillStyle=hexA(OK_HEX,0.08);c.fillRect(gx,sy(NE43.hi),gw,sy(NE43.lo)-sy(NE43.hi));
  [4,12,20].forEach(v=>{c.strokeStyle='rgba(255,255,255,0.10)';c.beginPath();c.moveTo(gx,sy(v));c.lineTo(gx+gw,sy(v));c.stroke();
    c.fillStyle='#7a8494';c.font='10px Outfit, sans-serif';c.textAlign='right';c.fillText(n0(v),gx-4,sy(v)+4);});
  const line=(fn,col,w,dash)=>{c.strokeStyle=col;c.lineWidth=w;c.setLineDash(dash||[]);c.beginPath();
    for(let k=0;k<=40;k++){const p=r.lrv+k/40*spanOf(r),v=fn(p),xx=sxp(p),yy=sy(v);if(k)c.lineTo(xx,yy);else c.moveTo(xx,yy);}
    c.stroke();c.setLineDash([]);};
  line(p=>mAideal(p,r),'#8f97a5',2,[5,4]);
  line(p=>iWithErr(p,r,e),BAD_HEX,2.5);
  if(apCal)line(p=>iCalibrado(p,r,e,cal),OK_HEX,2.5);
  c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillStyle='#8f97a5';c.fillText('— — ideal',gx+6,gy+16);
  c.fillStyle=BAD_HEX;c.fillText('—— con el error',gx+6,gy+32);
  if(apCal){c.fillStyle=OK_HEX;c.fillText('—— tras el ajuste de 2 puntos',gx+6,gy+48);}
  // tabla
  const ty=176,tw=316,tws=[74,80,80,82];
  trow(c,354,ty,tw,26,['PV','ideal','con error','error'],tws,null,true);
  const pts=[0,0.25,0.5,0.75,1];
  pts.forEach((f,k)=>{
    const p=r.lrv+f*spanOf(r),id=mAideal(p,r),ie=iWithErr(p,r,e);
    const err=(ie-id)/16*100;
    trow(c,354,ty+26+k*26,tw,26,[n2(p),n3(id),n3(ie),(err>=0?'+':'')+n2(err)+' %'],tws,
      [null,null,BAD_HEX,Math.abs(err)>0.5?BAD_HEX:WARN_HEX]);
  });
  const ty2=ty+26+5*26+18;
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Tras el ajuste de dos puntos',354,ty2);
  trow(c,354,ty2+10,tw,26,['PV','ideal','ajustada','error'],tws,null,true);
  pts.forEach((f,k)=>{
    const p=r.lrv+f*spanOf(r),id=mAideal(p,r),ic=iCalibrado(p,r,e,cal);
    const err=(ic-id)/16*100;
    trow(c,354,ty2+36+k*26,tw,26,[n2(p),n3(id),n3(ic),(err>=0?'+':'')+n3(err)+' %'],tws,
      [null,null,OK_HEX,Math.abs(err)<1e-6?OK_HEX:WARN_HEX]);
  });
  // conclusión
  const cy2=ty2+36+5*26+26;
  c.fillStyle='#9fb0cf';c.font='13px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,E.d+' Corrección calculada: cero '+(cal.zero>=0?'+':'')+n3(cal.zero)+' mA y span '+(cal.span>=0?'+':'')+n2(cal.span*100)+' %. Con ella los tres puntos de comprobación —4, 12 y 20 mA— vuelven a ser exactos, y no sólo los dos que se tocaron.',30,cy2,640,19);
  // panel
  rpanel(c,PX.x,PX.y,PX.w,428,'Escalado · '+sc.name);
  let y=PX.y+56;
  prow(c,PX.x,y,PX.w,'Rango',fmtR(rg));y+=26;
  prow(c,PX.x,y,PX.w,'Pendiente m',n3(16/spanOf(r))+' mA/m');y+=26;
  prow(c,PX.x,y,PX.w,'Ordenada b',n1(4-16*r.lrv/spanOf(r))+' mA');y+=26;
  prow(c,PX.x,y,PX.w,'Error de cero',(e.zero>=0?'+':'')+n2(e.zero)+' mA',e.zero?BAD_HEX:'#8f97a5');y+=26;
  prow(c,PX.x,y,PX.w,'Error de span',(e.span>=0?'+':'')+n1(e.span*100)+' %',e.span?BAD_HEX:'#8f97a5');y+=26;
  const errLrv=(iWithErr(r.lrv,r,e)-4)/16*100,errUrv=(iWithErr(r.urv,r,e)-20)/16*100;
  prow(c,PX.x,y,PX.w,'Error en el LRV',(errLrv>=0?'+':'')+n2(errLrv)+' %',Math.abs(errLrv)>0.01?BAD_HEX:OK_HEX);y+=26;
  prow(c,PX.x,y,PX.w,'Error en el URV',(errUrv>=0?'+':'')+n2(errUrv)+' %',Math.abs(errUrv)>0.01?BAD_HEX:OK_HEX);y+=30;
  c.strokeStyle=hexA(ACC,0.18);c.beginPath();c.moveTo(PX.x+16,y-14);c.lineTo(PX.x+PX.w-16,y-14);c.stroke();
  prow(c,PX.x,y,PX.w,'Corrección de cero',(cal.zero>=0?'+':'')+n3(cal.zero)+' mA',ACC);y+=26;
  prow(c,PX.x,y,PX.w,'Corrección de span',(cal.span>=0?'+':'')+n2(cal.span*100)+' %',ACC);y+=26;
  prow(c,PX.x,y,PX.w,'Ajuste aplicado',apCal?'sí':'no',apCal?OK_HEX:WARN_HEX);y+=30;
  c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,'Un error de cero se ve igual en toda la escala; uno de span sólo se ve cuando la medida se acerca al URV. Comprobar la calibración únicamente en el cero es la forma más común de no encontrar un error de span.',PX.x+16,y,PX.w-32,17);
  c.fillStyle='#6b7280';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Ajuste de dos puntos: primero el cero en el LRV, después el span en el URV — en ese orden',30,752);
}

function drawAplicaLazo(c){
  const sc=POOL[apIdx],lp=lpWith(sc,{awg:apAwg});
  const disp=lp.vsup-lp.vtxmin;
  c.fillStyle='#F4EFEA';c.font='bold 25px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Cumplimiento de tensión: por qué la lectura se congela',30,54);
  c.fillStyle='#9fb0cf';c.font='14px Outfit, sans-serif';
  wrapText(c,'El transmisor de dos hilos necesita una tensión mínima en sus bornes para funcionar. Lo que sobra de la alimentación es lo que puede caer en el cable, en la resistencia de medida y en cualquier barrera intermedia: R_max = (V_alim − V_tx,mín)/I. Si el lazo tiene más resistencia de la que admite, el transmisor no consigue subir la corriente y la lectura SATURA en un valor por debajo del que debería. Parece un sensor averiado y es un cable mal elegido.',30,80,640,20);
  // presupuesto
  const bx=30,by=186,bw=310;
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Presupuesto de tensión a 20,5 mA',bx,by-8);
  const parts=[['R medida',lp.rsense,OK_HEX],['Cable ida y vuelta',rCable(lp.awg,lp.len),ACC],['Barrera / extras',lp.rextra,VIO]];
  let yy=by+22;
  parts.forEach(p=>{
    const v=p[1]*NE43.hi/1000;
    drawBar(c,bx,yy,bw,18,v/disp,p[0]+' · '+n1(p[1])+' Ω',p[2],n2(v)+' V');
    yy+=44;
  });
  const vtot=rTotal(lp)*NE43.hi/1000;
  drawBar(c,bx,yy,bw,18,vtot/disp,'TOTAL a 20,5 mA · '+n1(rTotal(lp))+' Ω',vtot<=disp?OK_HEX:BAD_HEX,n2(vtot)+' V de '+n0(disp)+' V');
  yy+=48;
  c.fillStyle=vtot<=disp?OK_HEX:BAD_HEX;c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText(vtot<=disp?'✔ El lazo cumple hasta 20,5 mA':'✗ El lazo NO cumple: la corriente satura en '+n2(iMax(lp))+' mA',bx,yy);
  // los dos criterios de dimensionado
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';
  c.fillText('Dimensionar a 20,0 mA no basta',bx,yy+32);
  const lpN={...lp};
  c.fillStyle='#9fb0cf';c.font='13px Outfit, sans-serif';
  wrapText(c,'R máx a 20,0 mA = '+n0(rMaxAt(lpN,20))+' Ω · R máx a 20,5 mA = '+n1(rMaxAt(lpN,NE43.hi))+' Ω. Son '+n1(rMaxAt(lpN,20)-rMaxAt(lpN,NE43.hi))+' Ω menos de margen: justo los que hacen falta para que la señal de sobre-rango de la NE 43 llegue a verse.',bx,yy+54,bw,19);
  // tabla de calibres
  const tx=354,ty=186,tw=316,tws=[52,74,72,118];
  c.fillStyle='#C7D6F5';c.font='bold 14px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Calibres de cobre · '+n0(sc.len)+' m',tx,ty-8);
  trow(c,tx,ty,tw,26,['AWG','R cable','i máx','¿sostiene 20,5 mA?'],tws,null,true);
  AWGS.forEach((a,k)=>{
    const l2=lpWith(sc,{awg:a}),ok=okAt(l2,NE43.hi),best=okAwg(sc,a);
    trow(c,tx,ty+26+k*26,tw,26,[String(a),n1(rCable(a,sc.len))+' Ω',n2(iMax(l2))+' mA',(ok?'sí':'no')+(best?'  ← el mínimo':'')],tws,
      [a===apAwg?'#F4EFEA':'#9fb0cf',null,ok?OK_HEX:BAD_HEX,best?OK_HEX:(ok?'#9fb0cf':BAD_HEX)]);
  });
  // curva de saturación
  const gx=tx,gy=ty+26+4*26+40,gw=316,gh=170;
  axes(c,gx,gy,gw,gh,'PV (m)','i (mA)');
  const rg=goodRango(sc),r={lrv:rg[0],urv:rg[1]};
  const I0=3.2,I1=21.5,sy=v=>gy+gh-((v-I0)/(I1-I0))*gh,sxp=v=>gx+((v-r.lrv)/spanOf(r))*gw;
  c.fillStyle=hexA(OK_HEX,0.08);c.fillRect(gx,sy(NE43.hi),gw,sy(NE43.lo)-sy(NE43.hi));
  [4,12,20].forEach(v=>{c.strokeStyle='rgba(255,255,255,0.10)';c.beginPath();c.moveTo(gx,sy(v));c.lineTo(gx+gw,sy(v));c.stroke();
    c.fillStyle='#7a8494';c.font='10px Outfit, sans-serif';c.textAlign='right';c.fillText(n0(v),gx-4,sy(v)+4);});
  c.strokeStyle='#8f97a5';c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();
  c.moveTo(sxp(r.lrv),sy(4));c.lineTo(sxp(r.urv),sy(20));c.stroke();c.setLineDash([]);
  c.strokeStyle=okAt(lp,NE43.hi)?OK_HEX:BAD_HEX;c.lineWidth=2.5;c.beginPath();
  for(let k=0;k<=40;k++){const p=r.lrv+k/40*spanOf(r),v=iLoop(mAout(p,r),lp),xx=sxp(p),yy2=sy(v);if(k)c.lineTo(xx,yy2);else c.moveTo(xx,yy2);}
  c.stroke();
  if(!okAt(lp,NE43.hi)){
    c.strokeStyle=hexA(BAD_HEX,0.5);c.lineWidth=1;c.setLineDash([3,3]);
    c.beginPath();c.moveTo(gx,sy(iMax(lp)));c.lineTo(gx+gw,sy(iMax(lp)));c.stroke();c.setLineDash([]);
    c.fillStyle=BAD_HEX;c.font='bold 11px Outfit, sans-serif';c.textAlign='left';
    c.fillText('techo del lazo: '+n2(iMax(lp))+' mA',gx+8,sy(iMax(lp))-6);
  }
  // panel
  rpanel(c,PX.x,PX.y,PX.w,428,'Lazo · '+sc.name);
  let y=PX.y+56;
  prow(c,PX.x,y,PX.w,'Alimentación',n0(lp.vsup)+' V');y+=26;
  prow(c,PX.x,y,PX.w,'V mín del transmisor',n0(lp.vtxmin)+' V');y+=26;
  prow(c,PX.x,y,PX.w,'Tensión disponible',n0(disp)+' V',ACC);y+=26;
  prow(c,PX.x,y,PX.w,'Longitud del cable',n0(lp.len)+' m');y+=26;
  prow(c,PX.x,y,PX.w,'Calibre elegido','AWG '+apAwg,okAwg(sc,apAwg)?OK_HEX:WARN_HEX);y+=26;
  prow(c,PX.x,y,PX.w,'R cable (ida y vuelta)',n1(rCable(apAwg,lp.len))+' Ω');y+=26;
  prow(c,PX.x,y,PX.w,'R medida + extras',n0(lp.rsense+lp.rextra)+' Ω');y+=26;
  prow(c,PX.x,y,PX.w,'R total',n1(rTotal(lp))+' Ω');y+=26;
  prow(c,PX.x,y,PX.w,'i máx del lazo',n2(iMax(lp))+' mA',okAt(lp,NE43.hi)?OK_HEX:BAD_HEX);y+=30;
  c.strokeStyle=hexA(ACC,0.18);c.beginPath();c.moveTo(PX.x+16,y-14);c.lineTo(PX.x+PX.w-16,y-14);c.stroke();
  prow(c,PX.x,y,PX.w,'R máx a 20,0 mA',n0(rMaxAt(lp,20))+' Ω');y+=26;
  prow(c,PX.x,y,PX.w,'R máx a 20,5 mA',n1(rMaxAt(lp,NE43.hi))+' Ω',ACC);y+=26;
  prow(c,PX.x,y,PX.w,'Calibre mínimo válido','AWG '+goodAwg(sc),OK_HEX);y+=30;
  c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,sc.rextra?'Esta célula lleva además una barrera de seguridad intrínseca de '+n0(sc.rextra)+' Ω en el lazo: se come la mitad del presupuesto y obliga a subir de calibre.':'El criterio no es «que llegue a 20 mA»: es que llegue a 20,5 mA, porque por encima de 20 mA es donde la NE 43 coloca el aviso de sobre-rango.',PX.x+16,y,PX.w-32,17);
  c.fillStyle='#6b7280';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('R_max = (V_alim − V_tx,mín)/I — cobre a 20 °C; en caliente la resistencia sube y el margen baja',30,752);
}

function drawAplicaHist(c){
  const sc=POOL[apIdx],db=sc.dbOpts[apDb],cfg=cfgWith(sc,{db});
  const rg=cfg.rango,r={lrv:rg[0],urv:rg[1]},dbM=db/100*spanOf(r);
  const nom=runC(sc,cfg,{trace:20});
  const peor=runC(sc,cfg,{qin:qinPeor(sc)});
  c.fillStyle='#F4EFEA';c.font='bold 25px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Control on/off: la banda muerta no es un ajuste fino',30,54);
  c.fillStyle='#9fb0cf';c.font='14px Outfit, sans-serif';
  wrapText(c,'Un control todo-nada arranca la bomba al llegar a un umbral y la para al llegar al otro. La distancia entre los dos umbrales es la BANDA MUERTA. Sin ella, el ruido de la medida hace conmutar el contactor sin parar. Con ella el motor descansa, pero el proceso oscila más: la banda muerta se paga en precisión. Se elige contra dos límites a la vez, y ninguno de los dos se puede leer en la hoja de datos del transmisor.',30,80,640,20);
  // traza
  const gx=30,gy=190,gw=640,gh=200;
  const tr=nom.trace.filter(v=>v.t>=WARM);
  const t0=tr.length?tr[0].t:0,t1=t0+5400;                 // ventana de 1,5 h
  const win=tr.filter(v=>v.t<=t1);
  const hLo=Math.min(sc.sp-dbM,...win.map(v=>v.h))-0.05,hHi=Math.max(sc.sp+dbM,...win.map(v=>v.h))+0.05;
  const sx=t=>gx+((t-t0)/(t1-t0))*gw, sy=h=>gy+gh-((h-hLo)/(hHi-hLo))*gh;
  c.fillStyle='rgba(255,255,255,0.03)';c.fillRect(gx,gy,gw,gh);
  // banda muerta
  c.fillStyle=hexA(WARN_HEX,0.12);c.fillRect(gx,sy(sc.sp+dbM/2),gw,sy(sc.sp-dbM/2)-sy(sc.sp+dbM/2));
  c.strokeStyle=hexA(WARN_HEX,0.6);c.lineWidth=1;c.setLineDash([4,4]);
  [sc.sp+dbM/2,sc.sp-dbM/2].forEach(v=>{c.beginPath();c.moveTo(gx,sy(v));c.lineTo(gx+gw,sy(v));c.stroke();});
  c.setLineDash([]);
  c.fillStyle=WARN_HEX;c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('arranca a '+n3(sc.sp+dbM/2)+' m',gx+6,sy(sc.sp+dbM/2)-5);
  c.fillText('para a '+n3(sc.sp-dbM/2)+' m',gx+6,sy(sc.sp-dbM/2)+14);
  // bomba (bandas)
  win.forEach((v,k)=>{if(!v.pump)return;const x0=sx(v.t),x1=k+1<win.length?sx(win[k+1].t):x0+2;
    c.fillStyle=hexA(VIO,0.16);c.fillRect(x0,gy,Math.max(1,x1-x0),gh);});
  // nivel real y lectura
  c.strokeStyle=ACC;c.lineWidth=2;c.beginPath();
  win.forEach((v,k)=>{const xx=sx(v.t),yy=sy(v.h);if(k)c.lineTo(xx,yy);else c.moveTo(xx,yy);});c.stroke();
  c.strokeStyle=hexA(OK_HEX,0.55);c.lineWidth=1;c.beginPath();
  win.forEach((v,k)=>{const xx=sx(v.t),yy=sy(v.hm);if(k)c.lineTo(xx,yy);else c.moveTo(xx,yy);});c.stroke();
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(gx,gy,gw,gh);
  c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';c.textAlign='left';
  for(let m=0;m<=90;m+=15){const t=t0+m*60;if(t>t1)break;
    c.fillText(m+' min',sx(t)+3,gy+gh+16);
    c.strokeStyle='rgba(255,255,255,0.08)';c.beginPath();c.moveTo(sx(t),gy);c.lineTo(sx(t),gy+gh);c.stroke();}
  c.font='11px Outfit, sans-serif';
  c.fillStyle=ACC;c.fillText('— nivel real',gx+520,gy+16);
  c.fillStyle=OK_HEX;c.fillText('— lectura del transmisor',gx+520,gy+30);
  c.fillStyle=VIO;c.fillText('▮ bomba en marcha',gx+520,gy+44);
  // tabla de bandas muertas
  const ty=440,tw=640,tws=[92,110,116,150,172];
  trow(c,30,ty,tw,26,['Banda','en metros','arranques/h','peor caso (q=q_out/2)','veredicto'],tws,null,true);
  sc.dbOpts.forEach((d,k)=>{
    const cf=cfgWith(sc,{db:d}),m=d/100*spanOf(r);
    const rn=runC(sc,cf),rp=runC(sc,cf,{qin:qinPeor(sc)});
    const ok=okDb(sc,d);
    const razon=ok?'válida':(rp.startsH>sc.maxStarts?'demasiados arranques':(m>sc.tolBand?'banda de error excesiva':'el tanque se desborda o se seca'));
    trow(c,30,ty+26+k*26,tw,26,[n1(d)+' %',n3(m)+' m',n1(rn.startsH),n1(rp.startsH)+' /h  (máx '+n0(sc.maxStarts)+')',razon],tws,
      [d===db?'#F4EFEA':'#9fb0cf',m>sc.tolBand?BAD_HEX:null,null,rp.startsH>sc.maxStarts?BAD_HEX:OK_HEX,ok?OK_HEX:BAD_HEX]);
  });
  c.fillStyle='#9fb0cf';c.font='13px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,'El caudal de entrada que más castiga al motor no es el máximo: es la MITAD del caudal de la bomba, porque entonces llenar y vaciar tardan lo mismo y el ciclo es el más corto posible. Arranques máximos = 15·q_out/(banda·A·1000) por hora. Por eso la banda muerta se dimensiona contra ese caso y no contra el caudal nominal.',30,ty+26+sc.dbOpts.length*26+30,640,19);
  // panel
  rpanel(c,PX.x,PX.y,PX.w,428,'Histéresis · '+sc.name);
  let y=PX.y+56;
  prow(c,PX.x,y,PX.w,'Consigna',n2(sc.sp)+' m');y+=26;
  prow(c,PX.x,y,PX.w,'Banda muerta',n1(db)+' % = '+n3(dbM)+' m',dbM>sc.tolBand?BAD_HEX:OK_HEX);y+=26;
  prow(c,PX.x,y,PX.w,'Umbral de arranque',n3(sc.sp+dbM/2)+' m');y+=26;
  prow(c,PX.x,y,PX.w,'Umbral de paro',n3(sc.sp-dbM/2)+' m');y+=26;
  prow(c,PX.x,y,PX.w,'Ruido de la medida','± '+n3(sc.noise)+' m',dbM<2*sc.noise?BAD_HEX:'#F4EFEA');y+=26;
  prow(c,PX.x,y,PX.w,'Arranques/h medidos',n1(nom.startsH));y+=26;
  prow(c,PX.x,y,PX.w,'Teóricos sin ruido',n1(startsTeor(sc,dbM,sc.qin)));y+=26;
  prow(c,PX.x,y,PX.w,'Peor caso medido',n1(peor.startsH),peor.startsH>sc.maxStarts?BAD_HEX:OK_HEX);y+=26;
  prow(c,PX.x,y,PX.w,'Peor caso teórico',n1(startsPeor(sc,dbM)));y+=26;
  prow(c,PX.x,y,PX.w,'Banda de error medida',n3(nom.band)+' m',nom.band>sc.tolBand?BAD_HEX:OK_HEX);y+=30;
  c.strokeStyle=hexA(ACC,0.18);c.beginPath();c.moveTo(PX.x+16,y-14);c.lineTo(PX.x+PX.w-16,y-14);c.stroke();
  prow(c,PX.x,y,PX.w,'Máx. admisible',n0(sc.maxStarts)+' arr/h · '+n2(sc.tolBand)+' m');y+=26;
  prow(c,PX.x,y,PX.w,'¿Banda válida?',okDb(sc,db)?'sí':'no',okDb(sc,db)?OK_HEX:BAD_HEX);y+=30;
  c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,dbM<2*sc.noise
    ?'La banda muerta es MENOR que el ruido de pico a pico de la medida: el contactor conmuta por ruido, no por proceso. Eso es el chatter, y ningún filtro lo arregla si la banda no crece.'
    :'Los arranques medidos superan a los teóricos: el ruido de la medida provoca conmutaciones extra que la fórmula ideal no ve. La fórmula sirve para dimensionar, no para prometer.',PX.x+16,y,PX.w-32,17);
  c.fillStyle='#6b7280';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Simulación de 6 h con paso de 1 s y ruido determinista, tras 30 min de estabilización',30,752);
}

function drawAplica(c){
  if(apTopic==='lazo')drawAplicaLazo(c);
  else if(apTopic==='histeresis')drawAplicaHist(c);
  else drawAplicaEscala(c);
}

function drawReto(c){
  const sc=retoSc(),rg=retoRango(),r={lrv:rg[0],urv:rg[1]};
  const cfg=retoCfg(),lp=lpWith(sc,{awg:cfg.awg});
  const dbM=cfg.db/100*spanOf(r);
  c.fillStyle='#F4EFEA';c.font='bold 25px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Reto · Pon en marcha el lazo de '+sc.name,30,54);
  c.fillStyle='#9fb0cf';c.font='14px Outfit, sans-serif';
  wrapText(c,sc.tag+'. El proceso recorre de '+n2(sc.hProc[0])+' a '+n2(sc.hProc[1])+' m y hay que medirlo con una incertidumbre de '+n0(sc.tolMeas*1000)+' mm o mejor. El cable tiene '+n0(sc.len)+' m'+(sc.rextra?' y el lazo lleva una barrera de '+n0(sc.rextra)+' Ω':'')+'. La bomba admite '+n0(sc.maxStarts)+' arranques/hora y el nivel no debe apartarse más de '+n2(sc.tolBand)+' m de la consigna. Tres decisiones independientes: el rango, el calibre y la banda muerta. Cada una se califica con las otras dos correctas.',30,80,640,20);
  const mk=(ok,checked)=>checked?(ok?'✔':'✗'):'·';
  const kc=(ok,checked)=>checked?(ok?OK_HEX:BAD_HEX):'#8f97a5';
  // 1) rango
  let y=196;
  c.fillStyle=kc(retoOkRango,retoChecked);c.font='bold 16px Outfit, sans-serif';c.textAlign='left';
  c.fillText(mk(retoOkRango,retoChecked)+'  1 · Rango calibrado: '+fmtR(rg),30,y);
  c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
  const cubre=inBand(sc.hProc[0],r)&&inBand(sc.hProc[1],r);
  const inc=ERR_SPAN*spanOf(r);
  c.fillText('¿cubre el recorrido dentro de 3,8–20,5 mA? '+(cubre?'sí':'NO')+'   ·   incertidumbre 0,5 % del span = '+n0(inc*1000)+' mm (máx '+n0(sc.tolMeas*1000)+' mm)',30,y+20);
  const rgok=okRango(sc,rg);
  c.fillStyle=rgok?OK_HEX:WARN_HEX;c.font='12px Outfit, sans-serif';
  c.fillText(rgok?'Un span más estrecho da mejor resolución; uno demasiado estrecho deja el proceso fuera de la banda de medida.'
    :(cubre?'El proceso cabe, pero el span es tan ancho que la incertidumbre del transmisor no cumple la tolerancia pedida.'
           :'Con este rango el proceso sale de la banda 3,8–20,5 mA: parte del recorrido no se puede medir.'),30,y+38);
  // 2) calibre
  y=282;
  c.fillStyle=kc(retoOkAwg,retoChecked);c.font='bold 16px Outfit, sans-serif';
  c.fillText(mk(retoOkAwg,retoChecked)+'  2 · Calibre del cable: AWG '+cfg.awg,30,y);
  c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
  c.fillText('R total '+n1(rTotal(lp))+' Ω   ·   i máx '+n2(iMax(lp))+' mA   ·   R máx a 20,5 mA = '+n1(rMaxAt(lp,NE43.hi))+' Ω',30,y+20);
  const aok=okAwg(sc,cfg.awg);
  c.fillStyle=aok?OK_HEX:WARN_HEX;c.font='12px Outfit, sans-serif';
  c.fillText(aok?'Es el cobre mínimo que sostiene 20,5 mA: cumple sin pagar sección de más.'
    :(okAt(lp,NE43.hi)?'Cumple, pero hay un calibre más fino que también cumple: estás pagando cobre de más.'
                      :'No sostiene 20,5 mA: la corriente satura y la lectura se congela por debajo del fondo de escala.'),30,y+38);
  // 3) banda muerta
  y=368;
  const rn=runC(sc,cfg),rp=runC(sc,cfg,{qin:qinPeor(sc)});
  c.fillStyle=kc(retoOkDb,retoChecked);c.font='bold 16px Outfit, sans-serif';
  c.fillText(mk(retoOkDb,retoChecked)+'  3 · Banda muerta: '+n1(cfg.db)+' % = '+n3(dbM)+' m',30,y);
  c.fillStyle='#9fb0cf';c.font='12px Outfit, sans-serif';
  c.fillText('arranques/h nominales '+n1(rn.startsH)+'   ·   peor caso '+n1(rp.startsH)+' (máx '+n0(sc.maxStarts)+')   ·   banda de error '+n3(rn.band)+' m (máx '+n2(sc.tolBand)+')',30,y+20);
  const dok=okDb(sc,cfg.db);
  c.fillStyle=dok?OK_HEX:WARN_HEX;c.font='12px Outfit, sans-serif';
  c.fillText(dok?'Protege al motor en el peor caudal y mantiene el nivel dentro de la tolerancia.'
    :(rp.startsH>sc.maxStarts?'Demasiados arranques por hora en el peor caudal: el motor no lo aguanta.'
                             :'El nivel se aparta más de lo admitido: la banda muerta se paga en precisión.'),30,y+38);
  // gráfica de la corrida actual
  const gx=30,gy=444,gw=640,gh=170;
  const tr=runC(sc,cfg,{trace:20}).trace.filter(v=>v.t>=WARM);
  const t0=tr.length?tr[0].t:0,t1=t0+5400,win=tr.filter(v=>v.t<=t1);
  const hLo=Math.min(sc.sp-dbM,...win.map(v=>v.h))-0.05,hHi=Math.max(sc.sp+dbM,...win.map(v=>v.h))+0.05;
  const sx=t=>gx+((t-t0)/(t1-t0))*gw, syh=h=>gy+gh-((h-hLo)/(hHi-hLo))*gh;
  c.fillStyle='rgba(255,255,255,0.03)';c.fillRect(gx,gy,gw,gh);
  c.fillStyle=hexA(WARN_HEX,0.12);c.fillRect(gx,syh(sc.sp+dbM/2),gw,syh(sc.sp-dbM/2)-syh(sc.sp+dbM/2));
  win.forEach((v,k)=>{if(!v.pump)return;const x0=sx(v.t),x1=k+1<win.length?sx(win[k+1].t):x0+2;
    c.fillStyle=hexA(VIO,0.16);c.fillRect(x0,gy,Math.max(1,x1-x0),gh);});
  c.strokeStyle=ACC;c.lineWidth=2;c.beginPath();
  win.forEach((v,k)=>{const xx=sx(v.t),yy=syh(v.h);if(k)c.lineTo(xx,yy);else c.moveTo(xx,yy);});c.stroke();
  c.strokeStyle=hexA(OK_HEX,0.5);c.lineWidth=1;c.beginPath();
  win.forEach((v,k)=>{const xx=sx(v.t),yy=syh(v.hm);if(k)c.lineTo(xx,yy);else c.moveTo(xx,yy);});c.stroke();
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(gx,gy,gw,gh);
  c.fillStyle='#7a8494';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('90 min de la corrida nominal · nivel real (azul), lectura (verde) y bomba (violeta)',gx+4,gy+gh+16);
  // panel
  rpanel(c,PX.x,PX.y,PX.w,428,'Reto · '+sc.name);
  let py=PX.y+56;
  prow(c,PX.x,py,PX.w,'Recorrido del proceso',n2(sc.hProc[0])+' – '+n2(sc.hProc[1])+' m');py+=26;
  prow(c,PX.x,py,PX.w,'Tolerancia de medida',n0(sc.tolMeas*1000)+' mm');py+=26;
  prow(c,PX.x,py,PX.w,'Longitud del cable',n0(sc.len)+' m');py+=26;
  prow(c,PX.x,py,PX.w,'Barrera / extras',n0(sc.rextra)+' Ω');py+=26;
  prow(c,PX.x,py,PX.w,'Consigna',n2(sc.sp)+' m');py+=26;
  prow(c,PX.x,py,PX.w,'Máx. arranques/h',n0(sc.maxStarts));py+=26;
  prow(c,PX.x,py,PX.w,'Máx. banda de error',n2(sc.tolBand)+' m');py+=30;
  c.strokeStyle=hexA(ACC,0.18);c.beginPath();c.moveTo(PX.x+16,py-14);c.lineTo(PX.x+PX.w-16,py-14);c.stroke();
  prow(c,PX.x,py,PX.w,'Rango elegido',fmtR(rg),kc(retoOkRango,retoChecked));py+=26;
  prow(c,PX.x,py,PX.w,'Calibre elegido','AWG '+cfg.awg,kc(retoOkAwg,retoChecked));py+=26;
  prow(c,PX.x,py,PX.w,'Banda muerta elegida',n1(cfg.db)+' %',kc(retoOkDb,retoChecked));py+=30;
  c.fillStyle='#8f97a5';c.font='12px Outfit, sans-serif';c.textAlign='left';
  wrapText(c,'Hay 4 rangos × 4 calibres × 4 bandas = 64 combinaciones y sólo UNA es válida. Acertar dos de tres deja el lazo inservible: un rango bueno con un cable corto de sección congela la lectura, y un cable correcto con una banda muerta estrecha quema el contactor.',PX.x+16,py,PX.w-32,17);
  if(retoChecked){
    c.fillStyle=retoSolved?OK_HEX:BAD_HEX;c.font='bold 15px Outfit, sans-serif';c.textAlign='left';
    c.fillText(retoSolved?'✔ Lazo correcto: los tres criterios se cumplen':'✗ Todavía no: revisa los criterios marcados',30,700);
  }
  c.fillStyle='#6b7280';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('Cada criterio se simula con los otros dos correctos, para que un acierto no tape un error',30,752);
}

function drawBoard(){
  const c=bCv.getContext('2d');bg(c);
  if(mode==='aplica')drawAplica(c);else if(mode==='reto')drawReto(c);else drawExplora(c);
  bTex.needsUpdate=true;
}
function boardClick(){
  if(mode==='aplica')showToast('🧩 Tres estudios: la recta y sus errores, el presupuesto de tensión del lazo y la banda muerta del control on/off.');
  else if(mode==='reto')showToast('🎯 Tres decisiones ortogonales: rango, calibre y banda muerta. 64 combinaciones, una sola válida.');
  else showToast('🔧 La señal es una CORRIENTE. Por eso la caída del cable no falsea la medida, y por eso 0 mA significa avería y no cero de proceso.');
}

// ===================== 7. ESCENA 3D: LAZO CON PANEL DE INSTRUMENTOS =====================
const bench=roundedBox(3.9,0.5,1.9,MAT.bench,0.05);bench.position.set(1.95,0.25,0.55);scene.add(bench);
bench.userData={title:'Banco de instrumentación',info:'Tanque con transmisor de nivel de 2 hilos, cable de par trenzado, panel de instrumentos y grupo de bombeo.'};

// --- tanque con nivel ---
const tankG=new THREE.Group();tankG.position.set(0.85,0.5,0.55);scene.add(tankG);
const tankMat=new THREE.MeshStandardMaterial({color:0x8fa3bd,roughness:0.15,metalness:0.1,transparent:true,opacity:0.22});
const tankShell=new THREE.Mesh(new THREE.BoxGeometry(0.86,1.20,0.86),tankMat);tankShell.position.y=0.62;tankG.add(tankShell);
const liquid=new THREE.Mesh(new THREE.BoxGeometry(0.80,1,0.80),std(0x2f6fb5,0.25,0.05));
liquid.material.transparent=true;liquid.material.opacity=0.75;tankG.add(liquid);
const tankBase=roundedBox(0.96,0.06,0.96,MAT.plate,0.02);tankBase.position.y=0.03;tankG.add(tankBase);
tankShell.userData={title:'Tanque del proceso',info:'La variable de proceso es el nivel. El transmisor la convierte en una corriente de 4 a 20 mA proporcional al rango calibrado.'};
addHoverLabel(tankShell,'Proceso',VIO,new THREE.Vector3(0.85,1.95,0.55),1.5);

// --- transmisor de 2 hilos ---
const txG=new THREE.Group();txG.position.set(0.85,0.5,0.55);scene.add(txG);
const txBody=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.22,20),MAT.steel);txBody.position.set(0,1.36,0);txG.add(txBody);
const txHead=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.11,0.10,20),MAT.dark);txHead.position.set(0,1.51,0);txG.add(txHead);
txBody.userData={title:'Transmisor de nivel (2 hilos)',info:'No genera tensión: REGULA la corriente que consume, entre 4 y 20 mA. Necesita una tensión mínima en bornes para funcionar.'};
addHoverLabel(txBody,'Transmisor 2 hilos',ACC,new THREE.Vector3(0.85,2.15,0.55),2.0);

// --- cable de par trenzado hacia el panel ---
const cableMat=new THREE.MeshStandardMaterial({color:0x3a6ea5,roughness:0.5,metalness:0.2});
const cablePts=[new THREE.Vector3(0.85,1.56,0.55),new THREE.Vector3(1.35,1.72,0.35),new THREE.Vector3(2.05,1.60,0.15),new THREE.Vector3(2.62,1.28,0.12)];
const cable=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePts),40,0.022,10,false),cableMat);scene.add(cable);
cable.userData={title:'Cable de par trenzado',info:'Su resistencia de ida y vuelta se come parte del presupuesto de tensión del lazo. No falsea la medida, pero puede impedir que la corriente llegue a 20,5 mA.'};
addHoverLabel(cable,'Cable del lazo',ACC,new THREE.Vector3(1.7,2.0,0.2),1.9);

// --- PANEL DE INSTRUMENTOS (molde S+P) ---
const panelG=new THREE.Group();panelG.position.set(2.95,0.5,0.10);panelG.rotation.y=-0.22;scene.add(panelG);
const panelBox=roundedBox(1.50,1.00,0.14,MAT.body,0.04);panelBox.position.set(0,0.62,0);panelG.add(panelBox);
const pCv=document.createElement('canvas');pCv.width=600;pCv.height=400;
const pTex=new THREE.CanvasTexture(pCv);
const panelFace=new THREE.Mesh(new THREE.PlaneGeometry(1.40,0.92),new THREE.MeshBasicMaterial({map:pTex}));
panelFace.position.set(0,0.62,0.075);panelG.add(panelFace);
[-0.62,0.62].forEach(x=>{const scr=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.03,10),MAT.shiny);
  scr.rotation.x=Math.PI/2;scr.position.set(x,0.62,0.075);panelG.add(scr);});
panelBox.userData={title:'Panel de instrumentos',info:'Indicador de corriente, porcentaje de señal, tensión sobre la resistencia de medida, estado NAMUR NE 43 y salida al contactor.'};
addHoverLabel(panelBox,'Panel de instrumentos',OK_HEX,new THREE.Vector3(2.95,1.85,0.10),2.4);

/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={
  aluminio:MAT.plate, acero:MAT.shiny, cromo:MAT.shiny, chapa:MAT.plate,
  cobre:MAT.copper, negro:MAT.dark,
  goma:std(0x14181e,0.8,0.02), blanco:std(0xd7dee6,0.4,0.2),
  ceramica:std(0xd7dee6,0.6,0.05),
};
/* LA RESISTENCIA DE MEDIDA, con sus bandas: aqui el codigo de colores importa
   de verdad, porque la practica se juega entre 250 Ω (1-5 V) y 500 Ω (2-10 V) y
   confundirlas cambia toda la escala de la entrada analogica. */
const rBlock=P3.resistencia(MATP,{largo:0.22,d:0.095,patas:0.07,paso:0.36,
  bandas:[0xd42a2a,0xb03a2e,0x8a5a2c,0xc9a227],cuerpo:0xe8d9b0});
rBlock.position.set(2.95,0.52,0.62);
rBlock.traverse(o=>{ if(o.isMesh){o.castShadow=true;o.receiveShadow=true;} });
scene.add(rBlock);
rBlock.userData={title:'Resistencia de medida',info:'Cierra el lazo y convierte la corriente en tensión para la entrada analógica: 250 Ω dan 1–5 V y 500 Ω dan 2–10 V.'};

// --- grupo de bombeo ---
const pumpG=new THREE.Group();pumpG.position.set(1.75,0.5,1.15);scene.add(pumpG);
/* EL GRUPO DE BOMBEO. El motor gana su silueta —aletas, tapa del ventilador,
   patas, caja de bornes—, y la bomba deja de ser un disco: una VOLUTA es una
   espiral cuya seccion crece con el angulo, y esa espiral es lo que convierte
   la velocidad que el rodete da al agua en presion. Un cilindro liso no dice
   por que una bomba centrifuga da presion. */
const motor=P3.maquinaElectrica(MATP,{d:0.32,largo:0.42,eje:0.18,aletas:12});
motor.position.set(0,0.22,0);pumpG.add(motor);
const volute=new THREE.Mesh(P3.voluta({r0:0.105,r1:0.185,espesor:0.022,ancho:0.15,
  eje:'z',fase:Math.PI*0.5}),MAT.dark);
volute.rotation.y=Math.PI/2;volute.position.set(0.34,0.22,0);pumpG.add(volute);
const vTapa=new THREE.Mesh(new THREE.CylinderGeometry(0.207,0.207,0.022,24),MAT.dark);
vTapa.rotation.z=Math.PI/2;vTapa.position.set(0.425,0.22,0);pumpG.add(vTapa);
const vBoca=new THREE.Mesh(new THREE.CylinderGeometry(0.062,0.062,0.12,16),MAT.dark);
vBoca.rotation.z=Math.PI/2;vBoca.position.set(0.49,0.22,0);pumpG.add(vBoca);
const vBrida=new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.085,0.02,16),MAT.plate);
vBrida.rotation.z=Math.PI/2;vBrida.position.set(0.552,0.22,0);pumpG.add(vBrida);
const vImp=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.16,16),MAT.dark);
vImp.position.set(0.34,0.46,0);pumpG.add(vImp);
const vImpBrida=new THREE.Mesh(new THREE.CylinderGeometry(0.078,0.078,0.02,16),MAT.plate);
vImpBrida.position.set(0.34,0.545,0);pumpG.add(vImpBrida);
const pumpBase=roundedBox(0.80,0.06,0.34,MAT.plate,0.02);pumpBase.position.set(0.10,0.03,0);pumpG.add(pumpBase);
Object.assign(motor.userData,{title:'Grupo de bombeo',info:'El contactor lo arranca y lo para. Cada arranque calienta el motor: por eso el número de arranques por hora es un límite de diseño, no un capricho.'});
addHoverLabel(motor,'Bomba',VIO,new THREE.Vector3(1.75,1.15,1.15),1.5);

// --- LEDs de estado ---
function makeLED(x,z,color){const m=new THREE.Mesh(new THREE.SphereGeometry(0.042,16,16),std(color,0.4,0.1));
  m.position.set(x,0.53,z);m.material.emissive=new THREE.Color(color);m.material.emissiveIntensity=0.15;scene.add(m);return m;}
const ledOk=makeLED(3.55,0.62,0x7CD992);
const ledWarn=makeLED(3.55,0.42,0xE9C46A);
const ledBad=makeLED(3.55,0.22,0xff6b6b);
const ledPump=makeLED(1.75,0.53,1.52);

// --- fotogramas DERIVADOS de una corrida medida (nunca escritos a mano) ---
function framesFromTank(sc,cfg){
  const r={lrv:cfg.rango[0],urv:cfg.rango[1]};
  const tr=runC(sc,cfg,{trace:60}).trace.filter(v=>v.t>=WARM);
  if(!tr.length)return [{pv:sc.sp,i:12,st:'medida',pump:false,frac:0.5,lab:'—'}];
  const win=tr.filter(v=>v.t<=tr[0].t+5400);
  const N=Math.min(48,win.length),out=[];
  for(let k=0;k<N;k++){
    const v=win[N===1?0:Math.floor(k*(win.length-1)/(N-1))];
    out.push({pv:v.h,i:v.i,st:statusOf(v.i),pump:v.pump,frac:Math.max(0,Math.min(1,v.h/sc.hTank)),
      lab:Math.round(v.t/60)+' min'});
  }
  return out;
}
function framesFromSweep(sc,rg,awg){
  const r={lrv:rg[0],urv:rg[1]},lp=lpWith(sc,{awg});
  const out=[];
  for(let k=0;k<48;k++){
    const f=k<24?k/23:(47-k)/23;
    const pv=sc.hProc[0]+f*(sc.hProc[1]-sc.hProc[0]);
    const i=iLoop(mAout(pv,r),lp);
    out.push({pv,i,st:statusOf(i),pump:false,frac:Math.max(0,Math.min(1,pv/sc.hTank)),lab:n2(pv)+' m'});
  }
  return out;
}
function hwFrames(){
  if(mode==='reto')return framesFromTank(retoSc(),retoCfg());
  if(mode==='aplica'){
    const sc=POOL[apIdx];
    if(apTopic==='histeresis')return framesFromTank(sc,cfgWith(sc,{db:sc.dbOpts[apDb]}));
    return framesFromSweep(sc,goodRango(sc),apTopic==='lazo'?apAwg:goodAwg(sc));
  }
  const sc=expSc();
  if(expFalla!=='no'){
    const i=FALLA_I[expFalla];
    return [{pv:expPv(),i,st:statusOf(i),pump:false,frac:Math.max(0,Math.min(1,expPv()/sc.hTank)),lab:'forzada'}];
  }
  const i=expI();
  return [{pv:expPv(),i,st:statusOf(i),pump:false,frac:Math.max(0,Math.min(1,expPv()/sc.hTank)),lab:n2(expPv())+' m'}];
}
function frames(){if(!framesCache)framesCache=hwFrames();return framesCache;}
function hwCount(){return Math.max(1,frames().length);}

function drawPanel3D(fr,lp){
  const c=pCv.getContext('2d');
  c.fillStyle='#0e1218';c.fillRect(0,0,600,400);
  c.strokeStyle=hexA(ACC,0.35);c.lineWidth=3;c.strokeRect(6,6,588,388);
  c.fillStyle='#C7D6F5';c.font='bold 17px Outfit, sans-serif';c.textAlign='left';
  c.fillText('INDICADOR DE LAZO 4–20 mA',24,40);
  c.fillStyle='#6b7280';c.font='12px Outfit, sans-serif';c.textAlign='right';c.fillText(fr.lab,576,40);
  const col=ST_META[fr.st][1];
  c.fillStyle=col;c.font='bold 64px Outfit, sans-serif';c.textAlign='left';
  c.fillText(n2(fr.i),24,120);
  c.fillStyle='#8f97a5';c.font='bold 22px Outfit, sans-serif';c.fillText('mA',188,120);
  c.fillStyle='#F4EFEA';c.font='bold 28px Outfit, sans-serif';c.textAlign='right';
  c.fillText(n1(pctOf(fr.i))+' %',576,120);
  // barra 0-100 %
  const bx=24,by=146,bw=552,bh=24;
  c.fillStyle='rgba(255,255,255,0.06)';c.fillRect(bx,by,bw,bh);
  c.fillStyle=hexA(col,0.7);c.fillRect(bx,by,Math.max(0,Math.min(1,pctOf(fr.i)/100))*bw,bh);
  c.strokeStyle=hexA(ACC,0.3);c.lineWidth=1;c.strokeRect(bx,by,bw,bh);
  // franja NE 43 compacta
  const I0=3.2,I1=21.4,sx=v=>bx+((v-I0)/(I1-I0))*bw;
  const zn=[[I0,NE43.failLo,'#ff6b6b'],[NE43.failLo,NE43.lo,'#E9C46A'],[NE43.lo,NE43.hi,'#7CD992'],[NE43.hi,NE43.failHi,'#E9C46A'],[NE43.failHi,I1,'#ff6b6b']];
  zn.forEach(z=>{c.fillStyle=hexA(z[2],0.30);c.fillRect(sx(z[0]),by+42,sx(z[1])-sx(z[0]),18);});
  c.strokeStyle=hexA(ACC,0.25);c.strokeRect(bx,by+42,bw,18);
  if(fr.i>=I0){c.strokeStyle='#F4EFEA';c.lineWidth=2.5;c.beginPath();c.moveTo(sx(fr.i),by+38);c.lineTo(sx(fr.i),by+64);c.stroke();}
  // filas
  const row=(y,l,v,cc)=>{c.fillStyle='#8f97a5';c.font='14px Outfit, sans-serif';c.textAlign='left';c.fillText(l,24,y);
    c.fillStyle=cc||'#F4EFEA';c.font='bold 17px Outfit, sans-serif';c.textAlign='right';c.fillText(v,576,y);};
  row(252,'V sobre R medida',n3(vSense(fr.i,lp))+' V',OK_HEX);
  row(282,'Variable de proceso',n2(fr.pv)+' m',VIO);
  row(312,'Estado NAMUR NE 43',ST_META[fr.st][0],col);
  row(342,'Salida al contactor',fr.pump?'BOMBA EN MARCHA':'bomba parada',fr.pump?VIO:'#6b7280');
  c.fillStyle='#6b7280';c.font='11px Outfit, sans-serif';c.textAlign='left';
  c.fillText('R = '+n0(lp.rsense)+' Ω · AWG '+lp.awg+' · '+n0(lp.len)+' m · i máx '+n2(iMax(lp))+' mA',24,376);
  pTex.needsUpdate=true;
}

function curLp(){
  if(mode==='reto')return lpWith(retoSc(),{awg:retoCh.awg});
  if(mode==='aplica')return lpWith(POOL[apIdx],{awg:apTopic==='lazo'?apAwg:goodAwg(POOL[apIdx])});
  return expLp();
}
function curSc(){return mode==='reto'?retoSc():(mode==='aplica'?POOL[apIdx]:expSc());}
function updateHW(){
  const fs=frames(),step=hwStep%Math.max(1,fs.length);
  const fr=fs[step]||{pv:0,i:4,st:'medida',pump:false,frac:0,lab:'—'};
  const sc=curSc();
  // nivel del tanque
  const hLiq=Math.max(0.02,fr.frac*1.16);
  liquid.scale.y=hLiq;liquid.position.y=0.03+hLiq/2;
  // LEDs
  const st=fr.st;
  ledOk.material.emissiveIntensity=st==='medida'?1.4:0.10;
  ledWarn.material.emissiveIntensity=(st==='bajoRango'||st==='sobreRango')?1.4:0.10;
  ledBad.material.emissiveIntensity=(st==='abierto'||st==='fallaBaja'||st==='fallaAlta')?1.6:0.10;
  ledPump.material.emissiveIntensity=fr.pump?1.5:0.10;
  // eje de la bomba girando cuando está en marcha
  if(fr.pump)motor.rotation.x+=0.35;
  drawPanel3D(fr,curLp());
}

// ===================== 8. HUD Y PANEL =====================
el('hud').innerHTML=`
  <div class="eyebrow">D3 · Sistemas digitales y automatización — NAMUR NE 43 · IEC 60381-1 · ISA-50.00.01</div>
  <h2>Lazo de 4–20 mA: escalado y control on/off con histéresis</h2>
  <p>La medida de un instrumento de campo llega a la sala de control como una <b>corriente</b> de 4 a 20 mA por dos hilos que también lo alimentan. Ese detalle —que sea corriente y no tensión— es lo que hace que la caída del cable no falsee la lectura, y que 0 mA signifique <b>lazo roto</b> y no «cero de proceso». Aquí se recorre entero: la recta de escalado, los errores de cero y de span con su ajuste de dos puntos, el presupuesto de tensión que decide el calibre del cable, y el control todo-nada con banda muerta que arranca y para la bomba.</p>
  <div class="formula">i = 4 + 16·(PV − LRV)/(URV − LRV) mA · R<sub>máx</sub> = (V<sub>alim</sub> − V<sub>tx,mín</sub>)/I · banda NE 43: 3,8 – 20,5 mA · avería &lt; 3,6 y &gt; 21,0 mA · arranques máx/h = 15·q<sub>out</sub>/(banda·A·1000)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>recta de escalado y nivel real</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>banda de medida válida y lectura del transmisor</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>banda muerta y avisos de fuera de rango</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>proceso, transmisor y bomba</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el escalado lineal con cero vivo, la clasificación completa de la NAMUR NE 43, el cumplimiento de tensión de un lazo de dos hilos con cable de cobre y barrera, los errores de cero y span con ajuste de dos puntos, y un control on/off con histéresis simulado durante seis horas con ruido de medida, del que se MIDEN arranques por hora y banda de error.</div>
    <div class="fl no"><b>NO modela:</b> el protocolo HART superpuesto, la dinámica del sensor ni su tiempo de respuesta, la deriva térmica del transmisor, la inductancia y capacidad del cable, el arranque real del motor ni su calentamiento, la hidráulica de la bomba, ni el control PID —que es otra práctica—.</div>
  </div>
  <div class="src">Ref: NAMUR NE 43 · IEC 60381-1 · ISA-50.00.01 · IEC 61508 · verificación numérica propia (183/183)</div>`;

el('panel').innerHTML=`
  <h4>Lazo 4–20 mA · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🧭 Explora</button>
    <button class="b" id="m_aplica">🧩 Aplica</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div id="scenarioInfo" style="font-size:12px;color:var(--ink);margin:2px 0 8px;display:none"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Puesta en marcha del lazo</h4>
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
  explora:{nombre:'Explora',cam:[[5.2,3.1,7.4],[0.6,1.05,0.4]],mision:'Recorre la variable de proceso y comprueba qué corriente sale, qué tensión se lee y cómo clasifica la NE 43 cada valor.'},
  aplica:{nombre:'Aplica',cam:[[5.0,3.0,7.2],[0.7,1.00,0.5]],mision:'Tres estudios: errores de calibración, presupuesto de tensión del lazo y banda muerta del control on/off.'},
  reto:{nombre:'Reto',cam:[[5.1,2.9,7.3],[0.7,1.00,0.5]],mision:'Elige rango, calibre y banda muerta. Los tres se califican por separado sobre el motor verificado.'},
};
function lbl(t){return `<span class="lbl">${t}</span>`;}
function optBtns(key,opts,cur){return opts.map(([v,t])=>`<button class="b sm ${String(cur)===String(v)?'on':''}" data-${key}="${v}">${t}</button>`).join('');}

function buildControls(){
  const bar=el('selbar');bar.style.display='flex';bar.style.flexWrap='wrap';let html='';
  if(mode==='explora'){
    html+=lbl('Instalación')+optBtns('sc',POOL.map((s,i)=>[i,s.name]),expIdx);
    html+=lbl('Variable de proceso')+optBtns('pv',[[0,'mínimo'],[1,'25 %'],[2,'50 %'],[3,'75 %'],[4,'máximo']],expStep);
    html+=lbl('Señal')+optBtns('fa',FALLAS,expFalla);
  }else if(mode==='aplica'){
    html+=lbl('Estudio')+optBtns('tp',[['escala','📐 Escalado y calibración'],['lazo','🔌 Cumplimiento del lazo'],['histeresis','🔁 Banda muerta']],apTopic);
    html+=lbl('Instalación')+optBtns('sc',POOL.map((s,i)=>[i,s.name]),apIdx);
    if(apTopic==='escala'){
      html+=lbl('Error del transmisor')+optBtns('er',ERRS.map((e,i)=>[i,e.t]),apErr);
      html+=lbl('Ajuste de 2 puntos')+optBtns('cal',[[0,'sin ajustar'],[1,'ajustado']],apCal?1:0);
    }else if(apTopic==='lazo'){
      html+=lbl('Calibre del cable')+optBtns('awg',AWGS.map(a=>[a,'AWG '+a]),apAwg);
    }else{
      html+=lbl('Banda muerta')+optBtns('db',POOL[apIdx].dbOpts.map((d,i)=>[i,n1(d)+' %']),apDb);
    }
  }else{
    const sc=retoSc();
    html+=lbl('1 · Rango calibrado')+optBtns('rg',sc.rangos.map((rg,i)=>[i,fmtR(rg)]),retoCh.rango);
    html+=lbl('2 · Calibre del cable')+optBtns('rawg',AWGS.map(a=>[a,'AWG '+a]),retoCh.awg);
    html+=lbl('3 · Banda muerta')+optBtns('rdb',sc.dbOpts.map(d=>[d,n1(d)+' %']),retoCh.db);
  }
  bar.innerHTML=html;
  const wire=(attr,fn)=>bar.querySelectorAll('['+attr+']').forEach(b=>b.onclick=()=>{
    if(autoRunning)return;fn(b.getAttribute(attr));synth.beep(720,0.05,0.04);afterEdit();});
  wire('data-sc',v=>{const i=parseInt(v,10);if(mode==='explora'){expIdx=i;expStep=2;expFalla='no';}else{apIdx=i;apDb=0;apAwg=goodAwg(POOL[i]);}});
  wire('data-pv',v=>{expStep=parseInt(v,10);});
  wire('data-fa',v=>{expFalla=v;});
  wire('data-tp',v=>{apTopic=v;if(v==='lazo')apAwg=goodAwg(POOL[apIdx]);});
  wire('data-er',v=>{apErr=parseInt(v,10);});
  wire('data-cal',v=>{apCal=v==='1';});
  wire('data-awg',v=>{apAwg=parseInt(v,10);});
  wire('data-db',v=>{apDb=parseInt(v,10);});
  wire('data-rg',v=>{retoSet('rango',parseInt(v,10));});
  wire('data-rawg',v=>{retoSet('awg',parseInt(v,10));});
  wire('data-rdb',v=>{retoSet('db',parseFloat(v));});
}
function retoSet(field,v){retoCh[field]=v;retoChecked=false;retoSolved=false;solved=false;}

function updateScenarioInfo(){
  const box=el('scenarioInfo');box.style.display='block';
  if(mode==='explora'){
    const sc=expSc();
    box.innerHTML=`<b>${sc.name}</b> — ${sc.tag}. Rango calibrado ${fmtR(goodRango(sc))} · cable ${n0(sc.len)} m AWG ${goodAwg(sc)} · R medida ${n0(sc.rsense)} Ω.`;
  }else if(mode==='aplica'){
    const sc=POOL[apIdx];
    const t=apTopic==='escala'?'Un error de cero desplaza la recta; uno de span la inclina. El ajuste de dos puntos corrige primero el cero y después el span.'
      :apTopic==='lazo'?'La resistencia total del lazo decide hasta qué corriente puede llegar el transmisor. Se dimensiona a 20,5 mA, no a 20,0.'
      :'La banda muerta se elige contra dos límites: arranques por hora en el peor caudal y desviación admisible del nivel.';
    box.innerHTML=`<b>${sc.name}</b> — ${t}`;
  }else{
    const sc=retoSc();
    box.innerHTML=`<b>${sc.name}</b> — ${sc.tag}. Tres decisiones, 64 combinaciones posibles, una sola válida.`;
  }
}

function setMode(k){
  mode=k;hwStep=0;
  ['explora','aplica','reto'].forEach(m=>el('m_'+m).classList.toggle('on',m===k));
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
  if(mode==='explora'){expIdx=pickIdx(POOL.length,expIdx);expStep=2;expFalla='no';
    showToast('🔧 '+expSc().name+' — '+expSc().tag+'.');}
  else if(mode==='aplica'){apIdx=pickIdx(POOL.length,apIdx);apDb=0;apAwg=goodAwg(POOL[apIdx]);
    showToast('🧩 '+POOL[apIdx].name+' — '+POOL[apIdx].tag+'.');}
  else{seedReto();updateRetoSpec();
    showToast('🎯 Nueva instalación: '+retoSc().name+'. La configuración de partida vuelve a estar mal en las tres decisiones.');}
  synth.beep(520,0.08,0.05);hwStep=0;afterEdit();
}

// ===================== 11. TELEMETRÍA Y REPORTE =====================
function teleRow(l,v,cls){return `<div class="trow"><span class="tl">${l}</span><span class="tv ${cls||''}">${v}</span></div>`;}
function updateTele(){
  let h='';
  if(mode==='explora'){
    const sc=expSc(),r=expR(),lp=expLp(),i=expI(),st=expSt();
    const cls=st==='medida'?'good':(st==='bajoRango'||st==='sobreRango')?'warn':'bad';
    h+=teleRow('Variable de proceso',n2(expPv())+' m');
    h+=teleRow('Corriente del lazo',n2(i)+' mA',cls);
    h+=teleRow('Señal',n1(pctOf(i))+' %');
    h+=teleRow('V sobre R medida',n3(vSense(i,lp))+' V','good');
    h+=teleRow('Estado NE 43',ST_META[st][0],cls);
  }else if(mode==='aplica'){
    const sc=POOL[apIdx];
    if(apTopic==='escala'){
      const rg=goodRango(sc),r={lrv:rg[0],urv:rg[1]},e=ERRS[apErr].e,cal=calib2p(r,e);
      const mid=r.lrv+spanOf(r)/2;
      const errMid=((apCal?iCalibrado(mid,r,e,cal):iWithErr(mid,r,e))-12)/16*100;
      h+=teleRow('Pendiente m',n3(16/spanOf(r))+' mA/m');
      h+=teleRow('Error de cero',(e.zero>=0?'+':'')+n2(e.zero)+' mA',e.zero?'bad':'');
      h+=teleRow('Error de span',(e.span>=0?'+':'')+n1(e.span*100)+' %',e.span?'bad':'');
      h+=teleRow('Error al 50 %',(errMid>=0?'+':'')+n3(errMid)+' %',Math.abs(errMid)<1e-6?'good':'bad');
      h+=teleRow('Ajuste aplicado',apCal?'sí':'no',apCal?'good':'warn');
    }else if(apTopic==='lazo'){
      const lp=lpWith(sc,{awg:apAwg});
      h+=teleRow('R cable (ida y vuelta)',n1(rCable(apAwg,sc.len))+' Ω');
      h+=teleRow('R total del lazo',n1(rTotal(lp))+' Ω');
      h+=teleRow('i máx del lazo',n2(iMax(lp))+' mA',okAt(lp,NE43.hi)?'good':'bad');
      h+=teleRow('R máx a 20,5 mA',n1(rMaxAt(lp,NE43.hi))+' Ω');
      h+=teleRow('Calibre mínimo válido','AWG '+goodAwg(sc),apAwg===goodAwg(sc)?'good':'warn');
    }else{
      const db=sc.dbOpts[apDb],cfg=cfgWith(sc,{db});
      const rn=runC(sc,cfg),rp=runC(sc,cfg,{qin:qinPeor(sc)});
      h+=teleRow('Banda muerta',n1(db)+' % = '+n3(rn.db)+' m');
      h+=teleRow('Arranques/h nominales',n1(rn.startsH));
      h+=teleRow('Arranques/h peor caso',n1(rp.startsH),rp.startsH>sc.maxStarts?'bad':'good');
      h+=teleRow('Banda de error',n3(rn.band)+' m',rn.band>sc.tolBand?'bad':'good');
      h+=teleRow('¿Banda válida?',okDb(sc,db)?'sí':'no',okDb(sc,db)?'good':'bad');
    }
  }else{
    const sc=retoSc(),cfg=retoCfg(),lp=lpWith(sc,{awg:cfg.awg});
    const rn=runC(sc,cfg),rp=runC(sc,cfg,{qin:qinPeor(sc)});
    h+=teleRow('Rango',fmtR(cfg.rango),retoChecked?(retoOkRango?'good':'bad'):'');
    h+=teleRow('Calibre','AWG '+cfg.awg,retoChecked?(retoOkAwg?'good':'bad'):'');
    h+=teleRow('Banda muerta',n1(cfg.db)+' %',retoChecked?(retoOkDb?'good':'bad'):'');
    h+=teleRow('i máx del lazo',n2(iMax(lp))+' mA',okAt(lp,NE43.hi)?'good':'bad');
    h+=teleRow('Arranques/h peor caso',n1(rp.startsH),rp.startsH>sc.maxStarts?'bad':'good');
  }
  el('tele').innerHTML=h;
}
function updateReport(){
  let html=`<b>${MODE_META[mode].mision}</b><br>`;
  if(mode==='explora'){
    const sc=expSc(),r=expR(),lp=expLp(),i=expI(),st=expSt();
    html+=`Rango <span class="mono">${fmtR(goodRango(sc))}</span> · m = <span class="mono">${n3(16/spanOf(r))} mA/m</span><br>`;
    if(expFalla==='no'){
      html+=`PV = <span class="mono">${n2(expPv())} m</span> → i = <span class="mono">${n3(mAideal(expPv(),r))} mA</span> (${n1(pctOf(i))} %)<br>`;
    }else{
      html+=`<span class="dtc">Señal forzada</span>: ${n2(i)} mA — no procede de la medida.<br>`;
    }
    html+=`Estado NE 43: <span class="${st==='medida'?'ok':'dtc'}">${ST_META[st][0]}</span><br>`;
    html+=`R total <span class="mono">${n1(rTotal(lp))} Ω</span> · i máx <span class="mono">${n2(iMax(lp))} mA</span>`;
  }else if(mode==='aplica'){
    const sc=POOL[apIdx];
    if(apTopic==='escala'){
      const rg=goodRango(sc),r={lrv:rg[0],urv:rg[1]},e=ERRS[apErr].e,cal=calib2p(r,e);
      html+=`${ERRS[apErr].d}<br>Corrección: cero <span class="mono">${cal.zero>=0?'+':''}${n3(cal.zero)} mA</span>, span <span class="mono">${cal.span>=0?'+':''}${n2(cal.span*100)} %</span><br>`;
      html+=apCal?`<span class="ok">Con el ajuste aplicado los puntos de 4, 12 y 20 mA vuelven a ser exactos.</span>`
                 :`<span class="dtc">Sin ajustar: el error crece hacia el URV si hay error de span.</span>`;
    }else if(apTopic==='lazo'){
      const lp=lpWith(sc,{awg:apAwg});
      html+=`AWG ${apAwg} · R cable <span class="mono">${n1(rCable(apAwg,sc.len))} Ω</span> · R total <span class="mono">${n1(rTotal(lp))} Ω</span><br>`;
      html+=okAt(lp,NE43.hi)?`<span class="ok">Sostiene 20,5 mA (i máx ${n2(iMax(lp))} mA).</span>`
                            :`<span class="dtc">No sostiene 20,5 mA: la lectura satura en ${n2(iMax(lp))} mA.</span>`;
      html+=`<br>R máx: <span class="mono">${n0(rMaxAt(lp,20))} Ω</span> a 20,0 mA y <span class="mono">${n1(rMaxAt(lp,NE43.hi))} Ω</span> a 20,5 mA.`;
    }else{
      const db=sc.dbOpts[apDb],cfg=cfgWith(sc,{db});
      const rn=runC(sc,cfg),rp=runC(sc,cfg,{qin:qinPeor(sc)});
      html+=`Banda <span class="mono">${n1(db)} % = ${n3(rn.db)} m</span> · ruido ±<span class="mono">${n3(sc.noise)} m</span><br>`;
      html+=`Arranques/h: <span class="mono">${n1(rn.startsH)}</span> nominal y <span class="mono">${n1(rp.startsH)}</span> en el peor caudal (máx ${n0(sc.maxStarts)}).<br>`;
      html+=okDb(sc,db)?`<span class="ok">Banda válida.</span>`:`<span class="dtc">Banda no válida.</span>`;
    }
  }else{
    const sc=retoSc();
    html+=`Instalación: <b>${sc.name}</b> · proceso ${n2(sc.hProc[0])}–${n2(sc.hProc[1])} m · tolerancia ${n0(sc.tolMeas*1000)} mm.<br>`;
    if(retoChecked)html+=retoMsg;
    else html+=`<span class="mono">Elige rango, calibre y banda muerta, y pulsa Comprobar.</span>`;
  }
  el('report').innerHTML=html;
}
function refreshAll(){framesCache=null;drawBoard();updateTele();updateReport();updateHW();}

// ===================== 12. RETO =====================
function updateRetoSpec(){
  const sc=retoSc();
  el('retoSpec').innerHTML=`Pon en marcha el lazo de <b>${sc.name}</b>: (1) el <b>rango calibrado</b> del transmisor, que debe cubrir el recorrido del proceso dentro de la banda de medida y cumplir una tolerancia de ${n0(sc.tolMeas*1000)} mm; (2) el <b>calibre</b> del cable de ${n0(sc.len)} m, que debe sostener 20,5 mA sin pagar cobre de más; y (3) la <b>banda muerta</b> del control on/off, limitada a ${n0(sc.maxStarts)} arranques/hora en el peor caudal y a ${n2(sc.tolBand)} m de desviación.`;
}
function retoExplain(){
  const sc=retoSc(),cfg=retoCfg(),lp=lpWith(sc,{awg:cfg.awg});
  const parts=[];
  parts.push(retoOkRango?'rango correcto':'rango: '+(inBand(sc.hProc[0],{lrv:cfg.rango[0],urv:cfg.rango[1]})&&inBand(sc.hProc[1],{lrv:cfg.rango[0],urv:cfg.rango[1]})?'la incertidumbre no cumple la tolerancia':'el proceso se sale de la banda de medida'));
  parts.push(retoOkAwg?'calibre correcto':'calibre: '+(okAt(lp,NE43.hi)?'cumple, pero hay uno más fino que también':'no sostiene 20,5 mA'));
  const rp=runC(sc,cfg,{qin:qinPeor(sc)});
  parts.push(retoOkDb?'banda muerta correcta':'banda muerta: '+(rp.startsH>sc.maxStarts?n1(rp.startsH)+' arranques/h en el peor caudal':'la desviación del nivel excede lo admitido'));
  return parts.join(' · ');
}
function checkReto(){
  const sc=retoSc();
  retoOkRango=okRango(sc,retoRango());
  retoOkAwg=okAwg(sc,retoCh.awg);
  retoOkDb=okDb(sc,retoCh.db);
  retoSolved=retoOkRango&&retoOkAwg&&retoOkDb;retoChecked=true;solved=retoSolved;
  synth.beep(retoSolved?1046:220,retoSolved?0.14:0.15,0.06);
  retoMsg=`<span class="mono"><span class="${retoSolved?'ok':'dtc'}">${retoSolved?'✔ Correcto':'✗ Revisa'}</span> — ${retoExplain()}</span>`;
  refreshAll();
}

// ===================== 13. QUIZ =====================
function buildQuiz(){
  QUIZ={
    explora:{
      pregunta:'¿Por qué la señal analógica de campo se transmite como corriente de 4 a 20 mA y no como una tensión de 0 a 10 V?',
      opciones:[
        {t:'Porque la corriente es la misma en todo el lazo: la caída del cable no altera la medida, y el arranque en 4 mA permite distinguir «proceso en el mínimo» de «lazo roto».',ok:true,why:'Correcto. Son las dos ventajas y van juntas: inmunidad a la resistencia del cable y cero vivo, que es lo que hace detectable la avería.'},
        {t:'Porque una señal de corriente no se ve afectada por el ruido electromagnético, mientras que una de tensión sí.',ok:false,why:'El lazo de corriente es más robusto frente al ruido de modo común, pero no es inmune: por eso se usa par trenzado y apantallado. La razón principal es otra: la corriente no se pierde por el camino.'},
        {t:'Porque 20 mA es la corriente máxima que puede entregar sin peligro una fuente de 24 V.',ok:false,why:'Una fuente de 24 V entrega mucho más de 20 mA. El valor de 20 mA es un convenio histórico de la instrumentación neumática trasladado a la eléctrica, no un límite de la fuente.'},
        {t:'Porque el transmisor de dos hilos no puede generar tensión, sólo consumir corriente.',ok:false,why:'Es cierto que un transmisor de dos hilos regula la corriente que consume, pero eso es consecuencia del formato de señal elegido, no su causa. Existen transmisores de cuatro hilos y siguen entregando 4–20 mA.'},
      ],
    },
    aplica:{
      pregunta:'Un lazo con cable largo lee correctamente en la parte baja de la escala, pero al subir el proceso la lectura se queda clavada en 18 mA. ¿Qué está pasando?',
      opciones:[
        {t:'La resistencia total del lazo supera la que admite el presupuesto de tensión: el transmisor no consigue subir más la corriente y satura. Es un problema de dimensionado, no del sensor.',ok:true,why:'Correcto. R_max = (V_alim − V_tx,mín)/I. Con demasiada resistencia el transmisor se queda sin la tensión mínima que necesita y la corriente se topa. El síntoma imita a un sensor averiado.'},
        {t:'El transmisor tiene un error de span negativo y hay que recalibrarlo en el URV.',ok:false,why:'Un error de span inclina la recta pero la mantiene recta: la lectura seguiría subiendo, sólo que con la pendiente equivocada. Aquí la lectura no sube: se congela.'},
        {t:'La resistencia de medida es demasiado pequeña y no deja llegar la corriente al receptor.',ok:false,why:'Al revés: una resistencia de medida pequeña consume menos tensión y deja más margen. Lo que estrangula el lazo es tener demasiada resistencia total, no demasiado poca.'},
        {t:'El proceso está por encima del URV y la NAMUR NE 43 limita la señal a 20,5 mA.',ok:false,why:'Si fuera eso la lectura se quedaría en 20,5 mA, que es el tope de la NE 43, no en 18 mA. Un tope por debajo de 20 mA no lo pone ninguna norma: lo pone el cable.'},
      ],
    },
    reto:{
      pregunta:'¿Contra qué caudal de entrada se debe dimensionar la banda muerta de un control on/off de nivel?',
      opciones:[
        {t:'Contra un caudal de entrada igual a la MITAD del caudal de la bomba, porque entonces llenar y vaciar tardan lo mismo y el ciclo es el más corto posible: ahí se dan los arranques por hora máximos.',ok:true,why:'Correcto. El periodo del ciclo es proporcional a 1/q_in + 1/(q_out − q_in), que es mínimo en q_in = q_out/2. Dimensionar con el caudal nominal deja el motor sin protección justo en el caso peor.'},
        {t:'Contra el caudal de entrada máximo, que es cuando el tanque se llena más deprisa.',ok:false,why:'Con el caudal de entrada máximo el tanque se llena rápido, pero la bomba tarda mucho más en vaciarlo —le queda poco caudal neto— y el ciclo se alarga. Los arranques bajan, no suben.'},
        {t:'Contra el caudal de entrada nominal de la instalación, que es el que se da la mayor parte del tiempo.',ok:false,why:'Es el que se da la mayor parte del tiempo, sí, pero un límite de arranques por hora protege un motor frente al caso peor. Dimensionar con el caso típico deja el equipo desprotegido justo cuando importa.'},
        {t:'Contra un caudal de entrada nulo, que es cuando la bomba trabaja a pleno caudal.',ok:false,why:'Con caudal de entrada nulo el tanque no vuelve a llenarse: la bomba arranca una vez y ya no vuelve a hacerlo. Ese es el caso más benigno de todos.'},
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
  try{
    synth.init();synth.resume();clearDx();
    setMode('explora');
    expIdx=0;expStep=0;expFalla='no';afterEdit();
    showToast('🔧 Cisterna de bombeo. El transmisor está calibrado 0–5 m: en el mínimo del proceso entrega poco más de 4 mA.');
    await sleep(4000);
    expStep=2;afterEdit();
    showToast('📐 A media escala, 12 mA. La recta es y = mx + b y no depende de la longitud del cable: la corriente es la misma en todo el lazo.');
    await sleep(4200);
    expStep=4;afterEdit();
    showToast('🔺 Cerca del fondo de escala la tensión sobre la resistencia de medida llega a su valor máximo: 250 Ω dan 1–5 V.');
    await sleep(4200);
    expFalla='ab';afterEdit();
    showToast('⚠ Ahora se rompe un hilo: 0 mA. Con cero vivo esa lectura es imposible como medida, así que el sistema SABE que hay avería.');
    await sleep(4600);
    expFalla='fa';afterEdit();
    showToast('🚨 21,0 mA no es «el tanque muy lleno»: es la señal de falla alta de la NAMUR NE 43. La medida acaba en 20,5 mA.');
    await sleep(4600);
    expFalla='no';expStep=2;afterEdit();
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('aplica');
    apTopic='escala';apIdx=0;apErr=0;apCal=false;afterEdit();
    showToast('🧩 Error de cero: la recta entera se desplaza 0,40 mA. El fallo es el mismo en todos los puntos de la escala.');
    await sleep(4400);
    apErr=1;afterEdit();
    showToast('📈 Error de span: el cero está bien y el fallo crece hacia el fondo de escala. Comprobar sólo el cero no lo detecta.');
    await sleep(4600);
    apCal=true;afterEdit();
    showToast('✔ Ajuste de dos puntos: primero el cero en el LRV, después el span en el URV. Los tres puntos de comprobación quedan exactos.');
    await sleep(4400);
    apTopic='lazo';apAwg=22;afterEdit();
    showToast('🔌 Con AWG 22 en 4 km el lazo no llega a 20,5 mA: la lectura se congela por debajo del fondo de escala.');
    await sleep(4600);
    apAwg=goodAwg(POOL[apIdx]);afterEdit();
    showToast('📏 El criterio no es llegar a 20,0 mA sino a 20,5: son unos 15 Ω menos de margen, y ahí es donde la NE 43 pone el aviso de sobre-rango.');
    await sleep(4800);
    apTopic='histeresis';apDb=0;afterEdit();
    showToast('🔁 Con la banda muerta más estrecha del menú el contactor conmuta por el RUIDO de la medida, no por el proceso: eso es chatter.');
    await sleep(4800);
    apDb=POOL[apIdx].dbOpts.indexOf(goodDb(POOL[apIdx]));afterEdit();
    showToast('⚖ Con la banda correcta los arranques bajan por debajo del límite del motor y el nivel sigue dentro de la tolerancia.');
    await sleep(4600);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));await sleep(2600);

    setMode('reto');
    seedReto(0);updateRetoSpec();afterEdit();
    showToast('🎯 Reto: la configuración de partida está mal en las tres decisiones. Lo comprobamos tal cual…');
    await sleep(3800);
    checkReto();
    await sleep(4400);
    const sc=retoSc();
    retoCh={rango:sc.rangos.findIndex(rg=>okRango(sc,rg)),awg:goodAwg(sc),db:goodDb(sc)};
    retoChecked=false;retoSolved=false;solved=false;afterEdit();
    showToast('✔ Rango que cubre el proceso con la resolución pedida, el cobre mínimo que sostiene 20,5 mA y la banda muerta que protege al motor.');
    await sleep(3800);
    checkReto();await sleep(2600);
    answer(QUIZ[mode].opciones.findIndex(o=>o.ok));
  }finally{
    btn.disabled=false;btn.classList.remove('on');btn.textContent=label;autoRunning=false;
  }
}

// ===================== 16. ANIMACIÓN, EVENTOS E INICIO =====================
S.setAnimate((dt,time)=>{
  hwT+=dt;
  if(hwT>0.12){hwT=0;hwStep=(hwStep+1)%hwCount();updateHW();}
});
['explora','aplica','reto'].forEach(m=>{el('m_'+m).onclick=()=>{if(!autoRunning)setMode(m);};});
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
  POOL, RETO_POOL, NE43, AWGS, RHO, ERRS, ERR_SPAN, DT_T, WARM, TOT_T,
  // motor
  statusOf,clampMeas,spanOf,mAideal,mAout,pvFromMA,pctOf,inBand,
  rCable,rTotal,iMax,iLoop,vSense,rMaxAt,okAt,lpWith,
  iWithErr,calib2p,iCalibrado,
  runTank,runC,cicloMin,startsTeor,qinPeor,startsPeor,
  okRango,goodRango,okAwg,goodAwg,okDb,goodDb,GOOD,cfgWith,
  // explora
  expIdx:()=>expIdx, setExpIdx:i=>{expIdx=i;expStep=2;expFalla='no';afterEdit();},
  expStep:()=>expStep, setExpStep:i=>{expStep=i;afterEdit();},
  expFalla:()=>expFalla, setExpFalla:v=>{expFalla=v;afterEdit();},
  expInfo:()=>({idx:expIdx,pv:expPv(),i:expI(),st:expSt(),rango:goodRango(expSc()),
    awg:goodAwg(expSc()),v:vSense(expI(),expLp()),pct:pctOf(expI())}),
  // aplica
  apTopic:()=>apTopic, setApTopic:k=>{apTopic=k;if(k==='lazo')apAwg=goodAwg(POOL[apIdx]);afterEdit();},
  apIdx:()=>apIdx, setApIdx:i=>{apIdx=i;apDb=0;apAwg=goodAwg(POOL[i]);afterEdit();},
  apErr:()=>apErr, setApErr:i=>{apErr=i;afterEdit();},
  apCal:()=>apCal, setApCal:v=>{apCal=!!v;afterEdit();},
  apAwg:()=>apAwg, setApAwg:v=>{apAwg=v;afterEdit();},
  apDb:()=>apDb, setApDb:i=>{apDb=i;afterEdit();},
  apRun:()=>{const sc=POOL[apIdx];return runC(sc,cfgWith(sc,{db:sc.dbOpts[apDb]}));},
  // reto
  retoK:()=>retoK, seedReto:k=>{seedReto(k);updateRetoSpec();afterEdit();},
  retoName:()=>retoSc().name, retoCfg:()=>retoCfg(),
  retoGet:()=>({rango:retoCh.rango,awg:retoCh.awg,db:retoCh.db}),
  retoSet:(f,v)=>{retoSet(f,v);afterEdit();},
  retoSolveBuild:()=>{const sc=retoSc();
    retoCh={rango:sc.rangos.findIndex(rg=>okRango(sc,rg)),awg:goodAwg(sc),db:goodDb(sc)};
    retoChecked=false;retoSolved=false;solved=false;afterEdit();},
  checkReto:()=>checkReto(),
  retoChecked:()=>retoChecked, retoOkRango:()=>retoOkRango, retoOkAwg:()=>retoOkAwg, retoOkDb:()=>retoOkDb, retoSolved:()=>retoSolved,
  // quiz / general
  quizCorrectIndex:()=>{const q=QUIZ[mode];return q?q.opciones.findIndex(o=>o.ok):-1;},
  quizAnswer:i=>answer(i),
  frames:()=>frames(),
  newSignal:()=>newSignal(),
  solved:()=>solved,
};
