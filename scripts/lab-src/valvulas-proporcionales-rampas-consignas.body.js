// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[6.8,3.7,8.6],target:[1.90,1.05,0.00],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.40,minD:3.2,maxD:24});
const {scene}=S;
const synth=makeSynth({type:'sawtooth',type2:'sine',filterFreq:1100,Q:0.90});
const el=id=>document.getElementById(id);

// ===================== 2. MOTOR =====================
// Fisica sellada del banco proporcional. Unidades internas SI (m, m2, m3/s, Pa,
// N, s, kg); el catalogo va en unidades de taller (L/min, bar, mm) y se
// convierte en el borde. Comentarios en ASCII.
//
// 1) Caudal por cada canto de control (ISO 4411):
//      Q = Qn * u * sqrt(dp_canto / dpn)
//    con Qn el caudal nominal a dpn bar POR CANTO. Dos valvulas solo se
//    comparan por Qn si comparten dpn.
// 2) Cilindro diferencial con corredera simetrica, en regimen:
//      v = (Qn*u/sqrt(dpn)) * sqrt(dF / (Aa^3 + Ab^3))
//    con dF = pS*Aa - pT*Ab - F - Fr la fuerza neta disponible. Consecuencia
//    sellada: el reparto de la caida NO depende de la valvula
//      dp_PA = dF*Aa^2/Om     dp_BT = dF*Ab^2/Om     Om = Aa^3 + Ab^3
//    y por tanto pA y pB en regimen son independientes de la valvula elegida.
// 3) Caracteristica estatica con banda muerta bm e histeresis H (juego):
//      subiendo u = g(y - H/2)   bajando u = g(y + H/2)   g(y)=clamp((y-bm)/(100-bm),0,1)
//    Al invertir, la corredera NO se mueve hasta que la senal ha cambiado H:
//    eso es el operador de juego y es lo que produce el retardo de parada.
// 4) Tiempos de subida en cuadratura: una transicion ordenada en dt_cmd se
//    realiza en sqrt(dt_cmd^2 + tv^2), con tv = G_RISE/fv.

const DPN_DEF = 5;      // bar por canto, convenio de catalogo
const J_EXC   = 4;      // % de salto de la sobrecompensacion
const A_REF   = 8;      // % de dither efectivo que satura la mejora
const H_MIN_F = 0.15;   // suelo: el dither nunca borra la histeresis
const U_MIN   = 0.12;   // apertura minima utilizable
const C_MIN   = 5;      // consigna minima utilizable, %
const G_RISE  = 0.35;   // tv = G_RISE/fv, subida 10-90 de un primer orden
const P_T     = 3;      // bar, contrapresion de retorno
const RHO     = 870;    // kg/m3, densidad del aceite

// ---------- catalogo de valvulas ----------
// qn = caudal nominal (L/min) a dpn bar POR CANTO de control.
const VALV = {
  p04:  { rot:'NG6 · 4 L/min',     abr:'NG6/4',   qn:4,  dpn:5,  bm:20.0, h0:6.0, fv:30, coste:6  },
  p12:  { rot:'NG6 · 12 L/min',    abr:'NG6/12',  qn:12, dpn:5,  bm:20.0, h0:6.0, fv:25, coste:7  },
  p24:  { rot:'NG10 · 24 L/min',   abr:'NG10/24', qn:24, dpn:5,  bm:22.0, h0:6.5, fv:15, coste:9  },
  p60:  { rot:'NG16 · 60 L/min',   abr:'NG16/60', qn:60, dpn:5,  bm:24.0, h0:7.0, fv:9,  coste:14 },
  r24:  { rot:'NG10 realimentada', abr:'NG10/24 R', qn:24, dpn:5, bm:4.0, h0:0.5, fv:40, coste:18 },
  sv40: { rot:'Servoválvula 40@35',abr:'Servo 40', qn:40, dpn:35, bm:0.5, h0:0.3, fv:80, coste:42 },
};
const VALV_KEYS = ['p04','p12','p24','p60','r24','sv40'];

// ---------- presets de dither de la tarjeta ----------
const DITH = {
  off:  { rot:'sin dither',   abr:'—',        a:0,  f:0   },
  d40:  { rot:'12 % @ 40 Hz', abr:'12/40',    a:12, f:40  },
  d60:  { rot:'10 % @ 60 Hz', abr:'10/60',    a:10, f:60  },
  d100: { rot:'6 % @ 100 Hz', abr:'6/100',    a:6,  f:100 },
  d180: { rot:'3 % @ 180 Hz', abr:'3/180',    a:3,  f:180 },
};
const DITH_KEYS = ['off','d40','d60','d100','d180'];

// ---------- rampas de la tarjeta (s para 0-100 % de senal) ----------
const RAMPAS = [0.1, 0.3, 0.6, 1.2, 2.5];

// ---------- compensacion de banda muerta ----------
const COMPS = ['no','si','exc'];
const COMP_ROT = { no:'sin compensar', si:'compensada', exc:'sobrecompensada' };

const EJES = ['valv','dith','ramp','comp'];
const CRIT = ['okVel','okZona','okArr','okPico','okCiclo','okPos','okRizo'];

// ---------- estaciones ----------
// dp: diametro de piston (mm), dv: diametro de vastago (mm), L: carrera util
// (mm), F: fuerza que se opone a la salida (N; negativa = carga que tira),
// Fr: rozamiento del cilindro (N), m: masa movida (kg), pS/pLim (bar),
// vReq (m/s), qb: caudal de la bomba (L/min), tMax (s), tol/riz (mm),
// tdMax (s), vk: salto de arranque admisible (mm/s).
const ESTACIONES = {
  prensa: { nombre:'Prensa de encolado', detalle:'Acercamiento del plato contra la fuerza de proceso',
    dp:100, dv:56, L:400, F:38000, Fr:900, m:2500, pS:160, pLim:210,
    vReq:0.200, qb:110, tMax:3.4, tol:1.5, riz:0.35, tdMax:0.40, vk:12 },
  carro:  { nombre:'Carro de transferencia', detalle:'Traslado horizontal de una masa grande',
    dp:63, dv:36, L:1200, F:1200, Fr:600, m:6000, pS:140, pLim:120,
    vReq:0.300, qb:60, tMax:5.5, tol:6.0, riz:1.20, tdMax:0.45, vk:15 },
  sierra: { nombre:'Avance de sierra de cinta', detalle:'Avance lento y constante contra el corte',
    dp:100, dv:56, L:300, F:26000, Fr:1200, m:900, pS:120, pLim:160,
    vReq:0.014, qb:20, tMax:30.0, tol:0.40, riz:0.060, tdMax:0.35, vk:1.5 },
  elevad: { nombre:'Plataforma elevadora', detalle:'Bajada con carga negativa: el peso tira del vástago',
    dp:80, dv:45, L:900, F:-14025, Fr:1500, m:1430, pS:150, pLim:110,
    vReq:0.140, qb:55, tMax:7.0, tol:4.0, riz:0.80, tdMax:0.55, vk:10 },
  dosif:  { nombre:'Unidad de dosificación', detalle:'Carrera corta y repetida: casi no hay meseta',
    dp:40, dv:22, L:90, F:3200, Fr:250, m:45, pS:100, pLim:140,
    vReq:0.090, qb:18, tMax:2.2, tol:0.25, riz:0.050, tdMax:0.30, vk:6 },
};
const EST_KEYS = ['prensa','carro','sierra','elevad','dosif'];

// ---------- nucleo ----------
const clamp = (x,a,b) => x<a?a:(x>b?b:x);
const area = d => Math.PI*d*d/4e6;                 // mm -> m2

function geo(E){
  const Aa = area(E.dp);
  const Ab = Aa - area(E.dv);
  return { Aa, Ab, Om: Aa*Aa*Aa + Ab*Ab*Ab, phi: Aa/Ab };
}
// Fuerza neta disponible para mover (N). Si sale <= 0 el cilindro no arranca.
function fuerzaNeta(E){
  const g = geo(E);
  return E.pS*1e5*g.Aa - P_T*1e5*g.Ab - E.F - E.Fr;
}
// Ganancia de caudal de la valvula, m3/s por raiz de Pa.
const kv = V => (V.qn/60000) / Math.sqrt(V.dpn*1e5);
// Velocidad a apertura u con la valvula metiendo (m/s), sin tope de bomba.
function vLibre(E,V,u){
  const uu = (u===undefined?1:u);
  const g = geo(E), dF = fuerzaNeta(E);
  if(dF<=0) return 0;
  return kv(V)*uu*Math.sqrt(dF/g.Om);
}
// Tope que impone la bomba (m/s): todo el caudal entra por la camara motriz.
const vBomba = E => (E.qb/60000)/geo(E).Aa;
// Caidas en regimen: NO dependen de la valvula ni de la apertura.
function presiones(E){
  const g = geo(E), dF = fuerzaNeta(E);
  const dpPA = dF*g.Aa*g.Aa/g.Om, dpBT = dF*g.Ab*g.Ab/g.Om;
  return { dpPA:dpPA/1e5, dpBT:dpBT/1e5,
           pA:E.pS - dpPA/1e5, pB:P_T + dpBT/1e5 };
}

// ---------- amplificador ----------
// Salida del amplificador (%) para una consigna de entrada (%).
function cout(cin, bm, comp){
  if(cin<=0) return 0;
  if(comp==='no')  return cin;
  if(comp==='si')  return bm + cin*(100-bm)/100;
  return bm + J_EXC + cin*(100-bm-J_EXC)/100;      // 'exc'
}
// Pendiente de la salida por punto de consigna.
function pendSal(bm, comp){
  if(comp==='no')  return 1;
  if(comp==='si')  return (100-bm)/100;
  return (100-bm-J_EXC)/100;
}
// Caracteristica nominal de la corredera.
const gNom = (y,bm) => clamp((y-bm)/(100-bm), 0, 1);
// Ramas de subida y de bajada del operador de juego.
const uSub = (cin,bm,H,comp) => gNom(cout(cin,bm,comp) - H/2, bm);
const uBaj = (cin,bm,H,comp) => gNom(cout(cin,bm,comp) + H/2, bm);
// Histeresis efectiva tras el dither. El dither solo sirve en la medida en que
// la corredera lo sigue: por eso entra atenuado por la respuesta de la valvula.
const gVal = (f,fv) => f<=0 ? 0 : 1/Math.sqrt(1+(f/fv)*(f/fv));
function histEfect(V,D){
  const aef = D.a*gVal(D.f,V.fv);
  return V.h0*Math.max(H_MIN_F, 1 - aef/A_REF);
}
// Rizado de posicion que mete el dither (m). No depende de la consigna.
function rizado(E,V,D){
  if(D.a<=0 || D.f<=0) return 0;
  const du = D.a*gVal(D.f,V.fv)/(100-V.bm);
  const vr = vLibre(E,V,1)*du;                     // rizado de velocidad, m/s
  return vr/(2*Math.PI*D.f);
}

// ---------- punto de trabajo ----------
function punto(estKey, valvKey, dithKey, ramp, comp){
  const E = ESTACIONES[estKey], V = VALV[valvKey], D = DITH[dithKey];
  const g = geo(E), dF = fuerzaNeta(E);
  const H = histEfect(V,D), bm = V.bm;
  const tv = G_RISE/V.fv;
  const vmaxV = vLibre(E,V,1);                       // valvula a tope
  const vb = vBomba(E);
  const uTop = uSub(100,bm,H,comp);                  // apertura maxima real
  const vTop = Math.min(vmaxV*uTop, vb);             // velocidad maxima real

  // --- consigna que pide la faena ---
  const uReq = vmaxV>0 ? E.vReq/vmaxV : Infinity;
  const ps = pendSal(bm,comp);
  const y0 = uReq*(100-bm) + bm + H/2;               // salida necesaria
  let c0 = comp==='no' ? y0 : (y0 - cout(1e-12,bm,comp))/ps;
  if(!Number.isFinite(c0)) c0 = Infinity;
  const c0c = clamp(c0, 0, 100);
  const u0 = uSub(c0c,bm,H,comp);
  const v0 = Math.min(vmaxV*u0, vb);

  // --- arranque ---
  const uKick = uSub(1e-12,bm,H,comp);               // escalon a consigna 0+
  const vKick = Math.min(vmaxV*uKick, vb);
  let cArr;                                          // consigna a la que abre
  if(uKick>0) cArr = 0;
  else {
    const yArr = bm + H/2;
    cArr = comp==='no' ? yArr : (yArr - cout(1e-12,bm,comp))/ps;
    cArr = Math.max(0, cArr);
  }
  const tMuerto = cArr*ramp/100;

  // --- aceleracion ordenada por la rampa (m/s2) ---
  // du/dt = (dy/dt)/(100-bm) con dy/dt = ps*100/ramp
  const aRamp = vmaxV*ps*100/((100-bm)*ramp);
  // --- retardo de juego al invertir: la senal tiene que cambiar H ---
  const tHold = (H/ps)*ramp/100;

  // --- residuo al cerrar: con salto, la valvula sigue abierta en cin=0+ ---
  // La rama descendente deja la corredera en cout(0+)+H/2: con salto queda
  // francamente abierta, y aun compensando justo queda H/2 de rendija.
  const uRes = gNom(cout(1e-12,bm,comp)+H/2, bm);
  const vResF = Math.min(vmaxV*uRes, vb);

  // --- perfil del movimiento ---
  const L = E.L/1000;
  const sAcc = v0>0 ? v0*v0/(2*aRamp) : 0;
  const sDec = v0*tHold + (v0*v0 - vResF*vResF)/(2*aRamp);
  let vPico = v0, meseta = true;
  if(sAcc + sDec > L){
    meseta = false;
    // v^2/a + v*tHold - (L + vRes^2/(2a)) = 0
    const A = 1/aRamp, B = tHold, C = -(L + vResF*vResF/(2*aRamp));
    vPico = (-B + Math.sqrt(B*B - 4*A*C))/(2*A);
    if(vPico > v0){ vPico = v0; meseta = true; }
  }
  const tAcc = vPico/aRamp;
  const tDec = tHold + Math.max(0,(vPico - vResF))/aRamp;
  const sA = vPico*vPico/(2*aRamp);
  const sD = vPico*tHold + Math.max(0,(vPico*vPico - vResF*vResF))/(2*aRamp);
  const sMes = Math.max(0, L - sA - sD);
  const tMes = vPico>0 ? sMes/vPico : Infinity;
  const tCiclo = tMuerto + tAcc + tMes + tDec;

  // --- aceleraciones reales (cuadratura con la propia valvula) ---
  const dtRampDn = Math.max(0,(vPico - vResF))/aRamp;
  const aDec = vPico>0 ? (vPico - vResF)/Math.sqrt(dtRampDn*dtRampDn + tv*tv) : 0;
  const aStep = vResF/tv;                            // cierre de golpe del salto
  const aKick = vKick/tv;                            // escalon de arranque
  const aPico = Math.max(aDec, aStep, aKick);

  // --- pico de presion en la camara de salida ---
  // Cota superior: mientras la corredera cierra, la camara motriz no sostiene
  // presion, asi que toda la inercia la para la camara de retorno.
  const pFren = (E.m*aPico - E.F - E.Fr)/g.Ab/1e5;
  const pr = presiones(E);
  const pPico = Math.max(pr.pB, pFren, P_T);
  // Si la carga resistente ya frena la masa ella sola no hay pico: lo que
  // ocurre es que la camara motriz se queda sin aceite y cavita.
  const cavita = pFren < P_T;

  // --- precision de parada y rizado ---
  // Dos sumandos: lo que anda mientras el juego se recorre (H) y lo que anda
  // mientras la corredera termina de cerrar desde el residuo (tv).
  const vResE = Math.min(vResF, vPico);
  const disp = vPico*tHold + vResE*tv;               // m
  const rip = rizado(E,V,D);

  // --- criterios ---
  const okVel  = vTop >= E.vReq - 1e-12 && dF > 0;
  const okZona = c0c >= C_MIN && u0 >= U_MIN && Number.isFinite(c0);
  // Arranque limpio: ni tarda en salir (compensar de menos) ni sale de un
  // salto (compensar de mas). Un mismo criterio con dos formas de fallar.
  const okArr  = tMuerto <= E.tdMax && vKick*1000 <= E.vk;
  const okPico = pPico <= E.pLim;
  const okCiclo= tCiclo <= E.tMax;
  const okPos  = disp*1000 <= E.tol;
  const okRizo = rip*1000 <= E.riz;
  const flags = { okVel, okZona, okArr, okPico, okCiclo, okPos, okRizo };
  const fallos = CRIT.filter(k => !flags[k]);

  return {
    est:estKey, valv:valvKey, dith:dithKey, ramp, comp,
    Aa:g.Aa, Ab:g.Ab, Om:g.Om, phi:g.phi, dF, H, bm, tv, ps,
    vmaxV, vb, uTop, vTop, uReq, c0, c0c, u0, v0, vPico, meseta,
    uKick, vKick, cArr, tMuerto, aRamp, tHold, uRes, vResF,
    tAcc, tMes, tDec, tCiclo, aDec, aStep, aKick, aPico,
    dpPA:pr.dpPA, dpBT:pr.dpBT, pA:pr.pA, pB:pr.pB, pFren, pPico, cavita,
    disp, rip, ...flags, fallos, valida: fallos.length===0,
    coste: VALV[valvKey].coste,
  };
}

// ---------- barrido y optimo ----------
function barrido(estKey){
  const out = [];
  for(const v of VALV_KEYS) for(const d of DITH_KEYS)
    for(const r of RAMPAS) for(const c of COMPS)
      out.push(punto(estKey,v,d,r,c));
  return out;
}
const validas = estKey => barrido(estKey).filter(p => p.valida);
// Orden lexicografico declarado: coste, ciclo, dispersion, pico.
function mejorQue(a,b){
  if(a.coste !== b.coste) return a.coste < b.coste;
  if(Math.abs(a.tCiclo-b.tCiclo) > 1e-9) return a.tCiclo < b.tCiclo;
  if(Math.abs(a.disp-b.disp) > 1e-12) return a.disp < b.disp;
  return a.pPico < b.pPico;
}
function solucion(estKey){
  const v = validas(estKey);
  if(!v.length) return null;
  let best = v[0];
  for(const p of v) if(mejorQue(p,best)) best = p;
  return best;
}
function empates(estKey){
  const s = solucion(estKey);
  if(!s) return [];
  return validas(estKey).filter(p =>
    p.coste===s.coste && Math.abs(p.tCiclo-s.tCiclo)<1e-9 &&
    Math.abs(p.disp-s.disp)<1e-12 && Math.abs(p.pPico-s.pPico)<1e-9);
}
// Valores de un eje que aparecen en alguna configuracion optima. Como el
// optimo es unico en las cinco estaciones, la lista tiene un solo elemento.
function ejeSolC(estKey, eje){
  const emp = empates(estKey), out = [];
  for(const p of emp) if(out.indexOf(p[eje])<0) out.push(p[eje]);
  return out;
}
function okEje(estKey, cfg, eje){ return ejeSolC(estKey,eje).indexOf(cfg[eje])>=0; }
// Arranque deterministicamente equivocado en los CUATRO ejes.
function startCfg(estKey){
  const s = solucion(estKey);
  const pick = (arr,v) => arr[(arr.indexOf(v)+2)%arr.length];
  if(!s) return { valv:VALV_KEYS[0], dith:DITH_KEYS[0], ramp:RAMPAS[0], comp:COMPS[0] };
  return { valv:pick(VALV_KEYS,s.valv), dith:pick(DITH_KEYS,s.dith),
           ramp:pick(RAMPAS,s.ramp), comp:pick(COMPS,s.comp) };
}

// ---------- formato sellado ----------
const NBSP = String.fromCharCode(0x202F);
function f1(x, d){
  if(!Number.isFinite(x)) return '—';
  const n = (d===undefined?1:d);
  const s = Math.abs(x).toFixed(n);
  const par = s.split('.');
  let ent = par[0], grp = '';
  while(ent.length>3){ grp = NBSP + ent.slice(-3) + grp; ent = ent.slice(0,-3); }
  ent = ent + grp;
  return (x<0?'−':'') + ent + (par[1]?','+par[1]:'');
}
const pc1 = (x,d) => f1(100*x, d===undefined?1:d) + ' %';
// ===================== 3. ESTADO =====================
const MODES = ['consigna','carga','rampa','proyecto','reto'];
const MODE_ROT = { consigna:'Consigna', carga:'Carga', rampa:'Rampa', proyecto:'Proyecto', reto:'Reto' };
let mode = 'consigna';

const ST = {
  consigna: { est:'prensa', valv:'p24', dith:'off', ramp:0.6, comp:'no',  cin:60 },
  carga:    { est:'prensa', valv:'p24', dith:'off', ramp:0.6, comp:'no',  u:0.50 },
  rampa:    { est:'prensa', valv:'p24', dith:'off', ramp:0.6, comp:'si' },
  proyecto: { est:'prensa', valv:'p24', dith:'d40', ramp:0.1, comp:'exc' },
  reto:     { est:'prensa' },
};
const RETO = { cfg:{valv:'p24',dith:'off',ramp:0.6,comp:'no'}, sol:null, ejes:{}, resuelto:false, msg:'', nval:0 };

let CUR = null;          // punto de trabajo vigente
let hw = {};             // manijas del grupo 3D
let animT = 0;           // reloj de la animacion, s
let autoRunning = false;
let solved = false;

function cfgDe(m){
  if(m==='reto') return { est:ST.reto.est, valv:RETO.cfg.valv, dith:RETO.cfg.dith, ramp:RETO.cfg.ramp, comp:RETO.cfg.comp };
  const s = ST[m];
  return { est:s.est, valv:s.valv, dith:s.dith, ramp:s.ramp, comp:s.comp };
}
const estKey = () => (mode==='reto' ? ST.reto.est : ST[mode].est);
const estAct = () => ESTACIONES[estKey()];
function computa(){
  const c = cfgDe(mode);
  CUR = punto(c.est, c.valv, c.dith, c.ramp, c.comp);
  return CUR;
}
// Apertura vigente en el modo de carga (el unico con corredera de mando manual).
const uMan = () => clamp(ST.carga.u, 0, 1);

// ===================== 4. MATERIALES =====================
const AZUL='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A',
      VIO='#C08CF8', GRIS='#8f97a5', NARANJA='#F2A65A', CIAN='#5BD4E5', TINTA='#dbe4f0';
const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const MAT = {
  cuerpo:  std('#2b3242',0.55,0.45),
  cuerpo2: std('#39415a',0.50,0.50),
  acero:   std('#c3cbd8',0.28,0.85),
  cromo:   std('#e6ecf5',0.15,0.95),
  tarjeta: std('#1a2a24',0.70,0.20),
  bobina:  std('#8a5a2b',0.60,0.35),
  aceiteP: new THREE.MeshStandardMaterial({color:NARANJA,roughness:0.35,metalness:0.20,emissive:NARANJA,emissiveIntensity:0.55}),
  aceiteR: new THREE.MeshStandardMaterial({color:CIAN,roughness:0.35,metalness:0.20,emissive:CIAN,emissiveIntensity:0.45}),
  tuboP:   std('#3a2a1c',0.60,0.35),
  tuboR:   std('#1c2c34',0.60,0.35),
  base:    std('#171b25',0.85,0.10),
  carga:   std('#4a5163',0.65,0.30),
  vidrio:  new THREE.MeshStandardMaterial({color:'#0b0f16',roughness:0.20,metalness:0.10,transparent:true,opacity:0.86}),
};
const emis = (hex,i)=>new THREE.MeshStandardMaterial({color:hex,roughness:0.35,metalness:0.10,emissive:hex,emissiveIntensity:i===undefined?0.9:i});
// ===================== 5. PIZARRÓN =====================
const board=new THREE.Group();
board.position.set(-3.10,0,-0.55); board.rotation.y=0.44; scene.add(board);
(function(){
  const marco=roundedBox(3.90,2.94,0.10,std('#0b0f16',0.90,0.10),0.05);
  marco.position.set(0,1.86,0); board.add(marco);
  const pata=x=>{ const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.42,14),MAT.acero);
    p.position.set(x,0.21,0); board.add(p); };
  pata(-1.55); pata(1.55);
})();
const BW=1024, BH=768;
const bcv=document.createElement('canvas'); bcv.width=BW; bcv.height=BH;
const bx=bcv.getContext('2d');
const btex=new THREE.CanvasTexture(bcv);
const bmesh=new THREE.Mesh(new THREE.PlaneGeometry(3.68,2.72),
  new THREE.MeshBasicMaterial({map:btex,toneMapped:false}));
bmesh.position.set(0,1.86,0.056); board.add(bmesh);
function bg(){
  bx.fillStyle='#080b11'; bx.fillRect(0,0,BW,BH);
  bx.strokeStyle='rgba(138,180,248,0.06)'; bx.lineWidth=1;
  for(let x=0;x<=BW;x+=64){ bx.beginPath(); bx.moveTo(x+0.5,0); bx.lineTo(x+0.5,BH); bx.stroke(); }
  for(let y=0;y<=BH;y+=64){ bx.beginPath(); bx.moveTo(0,y+0.5); bx.lineTo(BW,y+0.5); bx.stroke(); }
}

// ---- primitivas de dibujo ----
function texto(t,x,y,col,size,align,weight){
  bx.fillStyle=col||'#dbe4f0';
  bx.font=(weight||'600')+' '+(size||18)+'px ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif';
  bx.textAlign=align||'left'; bx.textBaseline='alphabetic';
  bx.fillText(t,x,y); bx.textAlign='left';
}
function linea(x1,y1,x2,y2,col,w,dash){
  bx.strokeStyle=col||'#2b3446'; bx.lineWidth=w||1.5;
  bx.setLineDash(dash||[]); bx.beginPath(); bx.moveTo(x1,y1); bx.lineTo(x2,y2); bx.stroke();
  bx.setLineDash([]);
}
function curva(pts,col,w,dash){
  if(!pts.length) return;
  bx.strokeStyle=col||AZUL; bx.lineWidth=w||2; bx.setLineDash(dash||[]);
  bx.beginPath(); bx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) bx.lineTo(pts[i][0],pts[i][1]);
  bx.stroke(); bx.setLineDash([]);
}
function wrapText(t,x,y,maxW,lh,col,size){
  bx.fillStyle=col||'#8f9bb0';
  bx.font='500 '+(size||14)+'px ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif';
  const pal=String(t).split(' '); let ln='', yy=y;
  for(const p of pal){
    const pr=ln?ln+' '+p:p;
    if(bx.measureText(pr).width>maxW && ln){ bx.fillText(ln,x,yy); ln=p; yy+=(lh||18); }
    else ln=pr;
  }
  if(ln) bx.fillText(ln,x,yy);
  return yy;
}
const PX={x:706,y:70,w:300};
function rpanel(h){
  bx.fillStyle='rgba(13,18,26,0.92)'; bx.strokeStyle='rgba(138,180,248,0.22)'; bx.lineWidth=1.5;
  bx.beginPath(); bx.roundRect(PX.x,PX.y,PX.w,h,12); bx.fill(); bx.stroke();
}
function prow(y,k,v,col){
  texto(k,PX.x+14,y,'#8f9bb0',14,'left','500');
  texto(v,PX.x+PX.w-14,y,col||'#dbe4f0',15,'right','700');
}
function title2(t,sub){
  texto(t,44,52,'#eaf1fb',26,'left','800');
  if(sub) texto(sub,44,78,'#8f9bb0',15,'left','500');
}
function nota(t,y){ wrapText(t,44,y,620,19,'#8f9bb0',14); }
function hbar(x,y,w,h,frac,col,bgc){
  bx.fillStyle=bgc||'rgba(255,255,255,0.06)';
  bx.beginPath(); bx.roundRect(x,y,w,h,h/2); bx.fill();
  const f=Math.max(0,Math.min(1,frac));
  if(f>0){ bx.fillStyle=col||AZUL; bx.beginPath(); bx.roundRect(x,y,Math.max(h,w*f),h,h/2); bx.fill(); }
}
function marca(x,y,ok){
  bx.strokeStyle=ok?OK_HEX:BAD_HEX; bx.lineWidth=2.4; bx.beginPath();
  if(ok){ bx.moveTo(x-6,y); bx.lineTo(x-2,y+5); bx.lineTo(x+7,y-6); }
  else  { bx.moveTo(x-5,y-5); bx.lineTo(x+6,y+6); bx.moveTo(x+6,y-5); bx.lineTo(x-5,y+6); }
  bx.stroke();
}
const colOk=b=>b?OK_HEX:BAD_HEX;
function tabla(x,y,cols,rows,anchos,colFn){
  let yy=y;
  cols.forEach((c,i)=>texto(c,x+anchos.slice(0,i).reduce((a,b)=>a+b,0),yy,'#7f8b9c',13,'left','700'));
  yy+=8; linea(x,yy,x+anchos.reduce((a,b)=>a+b,0)-10,yy,'#243043',1); yy+=18;
  rows.forEach((r,ri)=>{
    r.forEach((c,ci)=>texto(c,x+anchos.slice(0,ci).reduce((a,b)=>a+b,0),yy,
      (colFn&&colFn(ri,ci))||'#c8d3e2',14,'left','600'));
    yy+=22;
  });
  return yy;
}
// ===================== 6. VISTAS DEL PIZARRÓN =====================
const CRIT_ROT={ okVel:'Velocidad alcanzable', okZona:'Zona de trabajo', okArr:'Arranque limpio',
  okPico:'Presión de frenado', okCiclo:'Tiempo de ciclo', okPos:'Precisión de parada',
  okRizo:'Rizado del dither' };
const CRIT_LIM=E=>({ okVel:'v_máx ≥ '+f1(E.vReq*1000,0)+' mm/s', okZona:'c ≥ 5 % y u ≥ 0,12',
  okArr:'t_m ≤ '+f1(E.tdMax,2)+' s y salto ≤ '+f1(E.vk,1)+' mm/s',
  okPico:'p_pico ≤ '+f1(E.pLim,0)+' bar', okCiclo:'t ≤ '+f1(E.tMax,1)+' s',
  okPos:'|Δs| ≤ '+f1(E.tol,2)+' mm', okRizo:'rizado ≤ '+f1(E.riz,3)+' mm' });
const critMed=(p,E)=>({
  okVel:  f1(p.vTop*1000,1)+' mm/s',
  okZona: 'c = '+f1(p.c0c,1)+' %, u = '+f1(p.u0,3),
  okArr:  f1(p.tMuerto,3)+' s / '+f1(p.vKick*1000,2)+' mm/s',
  okPico: f1(p.pPico,1)+' bar',
  okCiclo:f1(p.tCiclo,2)+' s',
  okPos:  f1(p.disp*1000,3)+' mm',
  okRizo: f1(p.rip*1000,3)+' mm',
});

function ejes(P,xmin,xmax,ymin,ymax,rotX,rotY,fmtX,fmtY,nx,ny){
  bx.fillStyle='rgba(10,14,20,0.72)';
  bx.beginPath(); bx.roundRect(P.x-52,P.y-18,P.w+72,P.h+72,10); bx.fill();
  const NX=nx||5, NY=ny||5;
  for(let i=0;i<=NX;i++){ const t=i/NX, X=P.x+P.w*t;
    linea(X,P.y,X,P.y+P.h,'rgba(138,180,248,0.07)',1);
    texto(fmtX(xmin+(xmax-xmin)*t),X,P.y+P.h+20,'#7f8b9c',12,'center','600'); }
  for(let i=0;i<=NY;i++){ const t=i/NY, Y=P.y+P.h-P.h*t;
    linea(P.x,Y,P.x+P.w,Y,'rgba(138,180,248,0.07)',1);
    texto(fmtY(ymin+(ymax-ymin)*t),P.x-10,Y+4,'#7f8b9c',12,'right','600'); }
  linea(P.x,P.y,P.x,P.y+P.h,'#3a465c',1.6);
  linea(P.x,P.y+P.h,P.x+P.w,P.y+P.h,'#3a465c',1.6);
  texto(rotX,P.x+P.w/2,P.y+P.h+46,'#8f9bb0',13,'center','700');
  bx.save(); bx.translate(P.x-42,P.y+P.h/2); bx.rotate(-Math.PI/2);
  texto(rotY,0,0,'#8f9bb0',13,'center','700'); bx.restore();
  return { X:v=>P.x+P.w*(v-xmin)/(xmax-xmin), Y:v=>P.y+P.h-P.h*(v-ymin)/(ymax-ymin) };
}
function punteo(x,y,col,r){
  bx.fillStyle=col||AZUL; bx.beginPath(); bx.arc(x,y,r||5,0,Math.PI*2); bx.fill();
  bx.strokeStyle='#080b11'; bx.lineWidth=1.6; bx.stroke();
}
function banda(A,x1,x2,y1,y2,col){
  bx.fillStyle=col||'rgba(255,107,107,0.09)';
  bx.fillRect(A.X(x1),A.Y(y2),A.X(x2)-A.X(x1),A.Y(y1)-A.Y(y2));
}

// ---------- 6.1 consigna: la caracteristica estatica ----------
function drawConsigna(){
  const s=ST.consigna, E=ESTACIONES[s.est], V=VALV[s.valv], D=DITH[s.dith];
  const H=CUR.H, bmv=V.bm, cin=s.cin;
  title2('Característica estática de la válvula proporcional',
    V.rot+' · '+D.rot+' · '+COMP_ROT[s.comp]+' — apertura de la corredera frente a la consigna');
  const P={x:118,y:118,w:520,h:330};
  const A=ejes(P,0,100,0,1,'consigna de entrada c (%)','apertura relativa u',
    v=>f1(v,0),v=>f1(v,2),5,5);
  // ventana utilizable
  banda(A,0,C_MIN,0,1,'rgba(255,107,107,0.10)');
  banda(A,C_MIN,100,0,U_MIN,'rgba(255,107,107,0.10)');
  texto('zona no utilizable',A.X(C_MIN)+8,A.Y(U_MIN)-8,'rgba(255,107,107,0.75)',12,'left','700');
  // banda muerta de la corredera, en unidades de consigna
  const cAbre=CUR.cArr;
  if(cAbre>0.001){
    bx.fillStyle='rgba(233,196,74,0.10)'; bx.fillRect(A.X(0),A.Y(1),A.X(cAbre)-A.X(0),A.Y(0)-A.Y(1));
    texto('banda muerta',A.X(cAbre/2),A.Y(0.93),'rgba(233,196,74,0.85)',12,'center','700');
  }
  // ramas del operador de juego
  const sub=[], baj=[];
  for(let c=0;c<=100.001;c+=0.5){
    const cc=Math.min(100,c);
    sub.push([A.X(cc),A.Y(uSub(cc<=0?1e-12:cc,bmv,H,s.comp))]);
    baj.push([A.X(cc),A.Y(uBaj(cc<=0?1e-12:cc,bmv,H,s.comp))]);
  }
  sub.unshift([A.X(0),A.Y(0)]); baj.unshift([A.X(0),A.Y(0)]);
  curva(baj,NARANJA,2.6);
  curva(sub,AZUL,2.6);
  // punto de trabajo en las dos ramas
  const us=uSub(cin<=0?1e-12:cin,bmv,H,s.comp), ub=uBaj(cin<=0?1e-12:cin,bmv,H,s.comp);
  linea(A.X(cin),P.y,A.X(cin),P.y+P.h,'rgba(219,228,240,0.35)',1.2,[5,5]);
  punteo(A.X(cin),A.Y(us),AZUL); punteo(A.X(cin),A.Y(ub),NARANJA);
  if(Math.abs(us-ub)>1e-6){
    linea(A.X(cin),A.Y(us),A.X(cin),A.Y(ub),VIO,2.4);
    texto('Δu del lazo',A.X(cin)+10,(A.Y(us)+A.Y(ub))/2+4,VIO,12,'left','700');
  }
  texto('subiendo',P.x+P.w-10,P.y+18,AZUL,13,'right','700');
  texto('bajando',P.x+P.w-10,P.y+36,NARANJA,13,'right','700');
  // panel
  rpanel(392);
  let y=PX.y+30;
  texto('LECTURA',PX.x+14,y,'#7f8b9c',13,'left','800'); y+=26;
  prow(y,'consigna c',f1(cin,1)+' %',TINTA); y+=24;
  prow(y,'salida del amplificador',f1(cout(cin<=0?1e-12:cin,bmv,s.comp),1)+' %',CIAN); y+=24;
  prow(y,'banda muerta b_m',f1(bmv,1)+' %',WARN_HEX); y+=24;
  prow(y,'histéresis de catálogo',f1(V.h0,1)+' %',GRIS); y+=24;
  prow(y,'seguimiento del dither',pc1(gVal(D.f,V.fv),0),GRIS); y+=24;
  prow(y,'histéresis efectiva H',f1(H,2)+' %',VIO); y+=26;
  linea(PX.x+14,y-14,PX.x+PX.w-14,y-14,'#243043',1);
  prow(y,'u subiendo',f1(us,3),AZUL); y+=24;
  prow(y,'u bajando',f1(ub,3),NARANJA); y+=24;
  prow(y,'abre en c =',f1(cAbre,1)+' %',colOk(cAbre<=1e-9||us>0)); y+=24;
  prow(y,'ancho del lazo en c',f1(H/CUR.ps,2)+' %',VIO); y+=26;
  linea(PX.x+14,y-14,PX.x+PX.w-14,y-14,'#243043',1);
  prow(y,'v subiendo',f1(Math.min(CUR.vmaxV*us,CUR.vb)*1000,1)+' mm/s',TINTA); y+=24;
  prow(y,'v bajando',f1(Math.min(CUR.vmaxV*ub,CUR.vb)*1000,1)+' mm/s',TINTA); y+=24;
  prow(y,'v que pide la faena',f1(E.vReq*1000,1)+' mm/s',WARN_HEX);
  // notas
  let ny=P.y+P.h+80;
  nota('La corredera tiene un solapo positivo: hasta b_m = '+f1(bmv,1)+' % de señal la válvula sigue cerrada. '+
       'La compensación de banda muerta no la elimina, la salta: el amplificador entrega '+
       (s.comp==='no'?'la consigna tal cual':'b_m'+(s.comp==='exc'?' + '+f1(J_EXC,0)+' %':'')+' en cuanto la consigna despega de cero')+'.',ny);
  ny+=58;
  nota('Las dos ramas no coinciden: al invertir el sentido, la señal tiene que cambiar H = '+f1(H,2)+
       ' % antes de que la corredera se mueva. Ese es el juego, y es lo que después se paga en precisión de parada.',ny);
  ny+=42;
  nota('El dither no borra la histéresis: la reduce mientras la corredera pueda seguir la vibración. '+
       'A '+f1(D.f,0)+' Hz con una válvula de '+f1(V.fv,0)+' Hz sólo llega el '+pc1(gVal(D.f,V.fv),0)+' de la amplitud.',ny);
}

// ---------- 6.2 carga: la ley de caudal y el reparto de presiones ----------
function drawCarga(){
  const s=ST.carga, E=ESTACIONES[s.est], V=VALV[s.valv];
  const g=geo(E), pr=presiones(E), u=uMan();
  const vmaxAll=Math.max(...VALV_KEYS.map(k=>vLibre(E,VALV[k],1)));
  const ytop=Math.max(vmaxAll,CUR.vb,E.vReq)*1000*1.10;
  title2('Ley de caudal y reparto de la caída',
    E.nombre+' — φ = A_A/A_B = '+f1(g.phi,3)+' · la carga fija el reparto, la válvula sólo fija el caudal');
  const P={x:118,y:118,w:520,h:320};
  const A=ejes(P,0,1,0,ytop,'apertura relativa u','velocidad de salida (mm/s)',
    v=>f1(v,2),v=>f1(v,ytop>200?0:1),5,5);
  // las seis valvulas
  for(const k of VALV_KEYS){
    const vm=vLibre(E,VALV[k],1), pts=[];
    for(let i=0;i<=60;i++){ const uu=i/60; pts.push([A.X(uu),A.Y(Math.min(vm*uu,CUR.vb)*1000)]); }
    const act=(k===s.valv);
    curva(pts,act?AZUL:'rgba(143,151,165,0.35)',act?3:1.4);
    if(act) texto(VALV[k].abr,A.X(1)-6,A.Y(Math.min(vm,CUR.vb)*1000)-10,AZUL,13,'right','700');
  }
  // topes
  linea(P.x,A.Y(CUR.vb*1000),P.x+P.w,A.Y(CUR.vb*1000),CIAN,1.8,[7,5]);
  texto('tope de bomba '+f1(CUR.vb*1000,1)+' mm/s',P.x+8,A.Y(CUR.vb*1000)-8,CIAN,12,'left','700');
  linea(P.x,A.Y(E.vReq*1000),P.x+P.w,A.Y(E.vReq*1000),WARN_HEX,1.8,[4,4]);
  texto('v requerida '+f1(E.vReq*1000,1)+' mm/s',P.x+P.w-8,A.Y(E.vReq*1000)-8,WARN_HEX,12,'right','700');
  const vAct=Math.min(CUR.vmaxV*u,CUR.vb);
  linea(A.X(u),P.y,A.X(u),P.y+P.h,'rgba(219,228,240,0.30)',1.2,[5,5]);
  punteo(A.X(u),A.Y(vAct*1000),AZUL,6);
  // panel
  rpanel(414);
  let y=PX.y+30;
  texto('CILINDRO',PX.x+14,y,'#7f8b9c',13,'left','800'); y+=26;
  prow(y,'A_A (pistón)',f1(g.Aa*1e4,2)+' cm²',TINTA); y+=24;
  prow(y,'A_B (corona)',f1(g.Ab*1e4,2)+' cm²',TINTA); y+=24;
  prow(y,'φ = A_A/A_B',f1(g.phi,3),VIO); y+=24;
  prow(y,'ΔF disponible',f1(fuerzaNeta(E),0)+' N',colOk(fuerzaNeta(E)>0)); y+=26;
  linea(PX.x+14,y-14,PX.x+PX.w-14,y-14,'#243043',1);
  texto('REPARTO EN RÉGIMEN',PX.x+14,y,'#7f8b9c',13,'left','800'); y+=26;
  prow(y,'Δp_PA',f1(pr.dpPA,1)+' bar',NARANJA); y+=24;
  prow(y,'Δp_BT',f1(pr.dpBT,1)+' bar',CIAN); y+=24;
  prow(y,'Δp_PA/Δp_BT',f1(pr.dpPA/pr.dpBT,3),VIO); y+=24;
  prow(y,'φ²',f1(g.phi*g.phi,3),VIO); y+=24;
  prow(y,'p_A',f1(pr.pA,1)+' bar',NARANJA); y+=24;
  prow(y,'p_B',f1(pr.pB,1)+' bar',CIAN); y+=26;
  linea(PX.x+14,y-14,PX.x+PX.w-14,y-14,'#243043',1);
  prow(y,'u de mando',f1(u,3),AZUL); y+=24;
  prow(y,'v con esta válvula',f1(vAct*1000,1)+' mm/s',TINTA); y+=24;
  prow(y,'v a u = 1',f1(CUR.vTop*1000,1)+' mm/s',colOk(CUR.okVel));
  // escalera de presiones
  const LY=P.y+P.h+66, LW=520, pmax=Math.max(E.pS,pr.pA,pr.pB,E.pLim)*1.02;
  const w=v=>LW*clamp(v/pmax,0,1);
  const fila=(yy,rot,val,col)=>{ texto(rot,P.x-10,yy+11,'#8f9bb0',12,'right','700');
    hbar(P.x,yy,w(val),14,1,col); texto(f1(val,1)+' bar',P.x+w(val)+8,yy+12,col,12,'left','700'); };
  fila(LY,'p_S bomba',E.pS,GRIS);
  fila(LY+22,'p_A cámara motriz',pr.pA,NARANJA);
  fila(LY+44,'p_B cámara de retorno',pr.pB,CIAN);
  fila(LY+66,'p_T tanque',P_T,'#5f6b7c');
  // notas
  let ny=LY+112;
  nota('Los dos cantos de la corredera están en serie con el cilindro, y la corona empuja el aceite '
      +'contra el mismo par de cantos: por eso la caída se reparte como φ² = '+f1(g.phi*g.phi,3)
      +' y NO depende de la válvula que se monte. Cambiar de válvula cambia el caudal, no p_A ni p_B.',ny);
  ny+=58;
  nota('La velocidad sigue v = (Q_n·u/√Δp_n)·√(ΔF/(A_A³+A_B³)): crece con la raíz de la fuerza '
      +'disponible, no linealmente. Comparar dos válvulas por Q_n sólo vale si comparten Δp_n — '
      +'la servoválvula está tarada a '+f1(VALV.sv40.dpn,0)+' bar por canto y las proporcionales a '+f1(DPN_DEF,0)+'.',ny);
}
// ---------- 6.3 rampa: el perfil de movimiento ----------
function perfil(p){
  // Devuelve los vertices (t,v) del perfil real, en s y m/s.
  const tDn=Math.max(0,(p.vPico-p.vResF))/p.aRamp;
  const t0=p.tMuerto, t1=t0+p.tAcc, t2=t1+(Number.isFinite(p.tMes)?p.tMes:0),
        t3=t2+p.tHold, t4=t3+tDn, t5=t4+p.tv;
  return { pts:[[0,0],[t0,0],[t1,p.vPico],[t2,p.vPico],[t3,p.vPico],[t4,p.vResF],[t5,0]],
           t0,t1,t2,t3,t4,t5,tDn };
}
function drawRampa(){
  const s=ST.rampa, E=ESTACIONES[s.est], V=VALV[s.valv], p=CUR;
  title2('Rampa, juego y parada',
    E.nombre+' · '+V.rot+' · rampa '+f1(s.ramp,1)+' s · '+COMP_ROT[s.comp]);
  const P={x:118,y:118,w:520,h:300};
  if(!(p.vPico>0) || !Number.isFinite(p.tCiclo)){
    ejes(P,0,1,0,1,'tiempo (s)','velocidad (mm/s)',v=>f1(v,1),v=>f1(v,1),5,5);
    texto('Con esta combinación el vástago no se mueve: la fuerza neta o la apertura son nulas.',
      P.x+P.w/2,P.y+P.h/2,BAD_HEX,16,'center','700');
    rpanel(120); prow(PX.y+40,'v de meseta',f1(p.vPico*1000,2)+' mm/s',BAD_HEX);
    prow(PX.y+66,'ΔF disponible',f1(p.dF,0)+' N',colOk(p.dF>0));
    prow(PX.y+92,'u a tope',f1(p.uTop,3),colOk(p.uTop>0));
    return;
  }
  const R=perfil(p), T=R.t5*1.04, ymax=p.vPico*1000*1.30;
  const A=ejes(P,0,T,0,ymax,'tiempo (s)','velocidad de salida (mm/s)',
    v=>f1(v,T<3?2:1),v=>f1(v,ymax>50?0:2),5,5);
  // perfil ordenado por la tarjeta: sin banda muerta ni juego
  const tAo=p.v0>0?p.v0/p.aRamp:0;
  const ord=[[A.X(0),A.Y(0)],[A.X(tAo),A.Y(p.vPico*1000)],
             [A.X(Math.max(tAo,R.t2-p.tMuerto)),A.Y(p.vPico*1000)],
             [A.X(Math.max(tAo,R.t2-p.tMuerto)+p.vPico/p.aRamp),A.Y(0)]];
  curva(ord,'rgba(143,151,165,0.55)',1.8,[6,5]);
  texto('lo que ordena la tarjeta',P.x+P.w-8,P.y+18,'rgba(143,151,165,0.85)',12,'right','700');
  // zonas que no se controlan
  if(p.tHold>1e-6){
    bx.fillStyle='rgba(192,140,248,0.20)';
    bx.fillRect(A.X(R.t2),A.Y(p.vPico*1000),A.X(R.t3)-A.X(R.t2),A.Y(0)-A.Y(p.vPico*1000));
  }
  const vRe=Math.min(p.vResF,p.vPico);
  if(vRe>1e-9){
    bx.fillStyle='rgba(192,140,248,0.20)';
    bx.fillRect(A.X(R.t4),A.Y(vRe*1000),A.X(R.t5)-A.X(R.t4),A.Y(0)-A.Y(vRe*1000));
  }
  if(p.tMuerto>1e-6){
    bx.fillStyle='rgba(233,196,74,0.14)';
    bx.fillRect(A.X(0),A.Y(ymax),A.X(R.t0)-A.X(0),A.Y(0)-A.Y(ymax));
    texto('tiempo muerto',A.X(R.t0/2),A.Y(0)-10,'rgba(233,196,74,0.9)',12,'center','700');
  }
  curva(R.pts.map(q=>[A.X(q[0]),A.Y(q[1]*1000)]),AZUL,3);
  // orden de parar
  linea(A.X(R.t2),P.y,A.X(R.t2),P.y+P.h,'rgba(255,255,255,0.35)',1.4,[5,5]);
  texto('orden de parar',A.X(R.t2),P.y-4,'#c8d3e2',12,'center','700');
  texto('el juego se recorre',A.X((R.t2+R.t3)/2),A.Y(p.vPico*1000)-10,VIO,12,'center','700');
  if(p.vKick>0){ punteo(A.X(R.t0),A.Y(p.vKick*1000),colOk(p.okArr),5);
    texto('salto '+f1(p.vKick*1000,2)+' mm/s',A.X(R.t0)+8,A.Y(p.vKick*1000)-8,colOk(p.okArr),12,'left','700'); }
  // panel
  rpanel(414);
  let y=PX.y+30;
  texto('LA TARJETA ORDENA',PX.x+14,y,'#7f8b9c',13,'left','800'); y+=26;
  prow(y,'rampa 0→100 %',f1(s.ramp,1)+' s',TINTA); y+=24;
  prow(y,'aceleración ordenada',f1(p.aRamp*1000,1)+' mm/s²',TINTA); y+=24;
  prow(y,'consigna de meseta',f1(p.c0c,1)+' %',colOk(p.okZona)); y+=26;
  linea(PX.x+14,y-14,PX.x+PX.w-14,y-14,'#243043',1);
  texto('LA MÁQUINA HACE',PX.x+14,y,'#7f8b9c',13,'left','800'); y+=26;
  prow(y,'tiempo muerto',f1(p.tMuerto,3)+' s',colOk(p.tMuerto<=E.tdMax)); y+=24;
  prow(y,'salto de arranque',f1(p.vKick*1000,2)+' mm/s',colOk(p.vKick*1000<=E.vk)); y+=24;
  prow(y,'v de meseta',f1(p.vPico*1000,1)+' mm/s',TINTA); y+=24;
  prow(y,'tiempo de ciclo',f1(p.tCiclo,2)+' s',colOk(p.okCiclo)); y+=26;
  linea(PX.x+14,y-14,PX.x+PX.w-14,y-14,'#243043',1);
  texto('LA PARADA',PX.x+14,y,'#7f8b9c',13,'left','800'); y+=26;
  prow(y,'retardo del juego',f1(p.tHold,3)+' s',VIO); y+=24;
  prow(y,'rendija residual',f1(p.uRes,3)+' → '+f1(p.vResF*1000,1)+' mm/s',VIO); y+=24;
  prow(y,'τ de la válvula',f1(p.tv*1000,1)+' ms',GRIS); y+=24;
  prow(y,'a de frenado',f1(p.aPico,2)+' m/s²',TINTA); y+=24;
  prow(y,'p en la corona',f1(p.pPico,1)+' bar',colOk(p.okPico)); y+=24;
  prow(y,'dispersión de parada',f1(p.disp*1000,3)+' mm',colOk(p.okPos));
  // notas
  let ny=P.y+P.h+96;
  nota('El tiempo muerto no es de la rampa: es la rampa recorriendo la banda muerta. Con rampa de '
      +f1(s.ramp,1)+' s la consigna tarda '+f1(p.tMuerto,3)+' s en llegar a '+f1(p.cArr,1)
      +' %, que es donde la corredera abre. Compensar la banda muerta lo suprime, pero entonces la '
      +'máquina arranca de un salto de '+f1(p.vKick*1000,2)+' mm/s.',ny);
  ny+=76;
  nota('Las dos zonas moradas son lo que la tarjeta NO controla: '+f1(p.vPico*1000*p.tHold,3)
      +' mm mientras se recorre el juego y '+f1(vRe*p.tv*1000,3)+' mm mientras cierra la rendija que '
      +'deja la compensación. Suman '+f1(p.disp*1000,3)+' mm frente a una tolerancia de '+f1(E.tol,2)+' mm.',ny);
  ny+=58;
  nota(p.cavita
    ? 'Aquí la carga frena sola: la corona no llega ni a la contrapresión de tanque, así que el riesgo '
      +'no es reventar sino que la cámara motriz se vacíe y cavite.'
    : 'Al cerrar, la masa de '+f1(E.m,0)+' kg sigue empujando y sólo la corona puede pararla: '
      +f1(p.pPico,1)+' bar frente a un límite de '+f1(E.pLim,0)+' bar. Rampas cortas suben este pico.',ny);
}
// ---------- 6.4 censo del proyecto ----------
const CACHE={};
function censo(k){
  if(!CACHE[k]){
    const B=barrido(k), V=B.filter(p=>p.valida), solo={};
    for(const c of CRIT) solo[c]=B.filter(p=>p.fallos.length===1&&p.fallos[0]===c).length;
    CACHE[k]={B,V,solo,best:solucion(k)};
  }
  return CACHE[k];
}
const COSTE_MAX=Math.max(...VALV_KEYS.map(k=>VALV[k].coste));
function barraCoste(y,p,C){
  const cmin=C.best?C.best.coste:COSTE_MAX;
  texto('coste del equipo',44,y,'#8f9bb0',13,'left','700');
  texto(f1(p.coste,0)+' u.',644,y,p.coste<=cmin?OK_HEX:WARN_HEX,15,'right','800');
  hbar(44,y+10,600,14,p.coste/COSTE_MAX,p.coste<=cmin?OK_HEX:WARN_HEX);
  const xm=44+600*cmin/COSTE_MAX;
  linea(xm,y+6,xm,y+28,'#eaf1fb',2);
  texto('mínimo viable '+f1(cmin,0),xm+6,y+42,'#c8d3e2',12,'left','700');
  return y+56;
}
function tablaCrit(p,E,y){
  const med=critMed(p,E), lim=CRIT_LIM(E);
  const rows=CRIT.map(c=>[CRIT_ROT[c],med[c],lim[c],'']);
  const yy=tabla(44,y,['criterio','medido','límite',''],rows,[196,168,232,40],
    (ri,ci)=>ci===1?(p[CRIT[ri]]?OK_HEX:BAD_HEX):null);
  CRIT.forEach((c,i)=>marca(44+196+168+232+8,y+26+22*i-5,p[c]));
  return yy;
}
function veredicto(p,y){
  if(p.valida){ texto('COMBINACIÓN VÁLIDA: cumple los siete criterios',44,y,OK_HEX,17,'left','800'); }
  else { texto('NO VÁLIDA — falla '+p.fallos.map(c=>CRIT_ROT[c].toLowerCase()).join(', '),
    44,y,BAD_HEX,17,'left','800'); }
  return y+26;
}
function drawProyecto(){
  const s=ST.proyecto, E=ESTACIONES[s.est], p=CUR, C=censo(s.est);
  title2('Censo del proyecto',
    E.nombre+' — las '+f1(C.B.length,0)+' combinaciones del catálogo, criterio por criterio');
  let y=tablaCrit(p,E,126);
  y=veredicto(p,y+16);
  y=barraCoste(y+14,p,C);
  rpanel(400);
  let py=PX.y+30;
  texto('MONTADO',PX.x+14,py,'#7f8b9c',13,'left','800'); py+=26;
  prow(py,'válvula',VALV[s.valv].abr,TINTA); py+=24;
  prow(py,'dither',DITH[s.dith].abr,TINTA); py+=24;
  prow(py,'rampa',f1(s.ramp,1)+' s',TINTA); py+=24;
  prow(py,'compensación',COMP_ROT[s.comp],TINTA); py+=24;
  prow(py,'coste',f1(p.coste,0)+' u.',WARN_HEX); py+=26;
  linea(PX.x+14,py-14,PX.x+PX.w-14,py-14,'#243043',1);
  texto('CENSO DE LA ESTACIÓN',PX.x+14,py,'#7f8b9c',13,'left','800'); py+=26;
  prow(py,'combinaciones',f1(C.B.length,0),TINTA); py+=24;
  prow(py,'válidas',f1(C.V.length,0),colOk(C.V.length>0)); py+=24;
  prow(py,'más barata válida',C.best?VALV[C.best.valv].abr:'—',C.best?OK_HEX:BAD_HEX); py+=24;
  prow(py,'coste mínimo',C.best?f1(C.best.coste,0)+' u.':'—',C.best?OK_HEX:BAD_HEX); py+=26;
  linea(PX.x+14,py-14,PX.x+PX.w-14,py-14,'#243043',1);
  texto('CRITERIOS QUE FALLAN SOLOS',PX.x+14,py,'#7f8b9c',13,'left','800'); py+=26;
  for(const c of CRIT){ prow(py,CRIT_ROT[c],f1(C.solo[c],0),C.solo[c]>0?TINTA:GRIS); py+=22; }
  let ny=y+18;
  nota('Ningún criterio sobra: en esta estación cada uno de los siete es el ÚNICO que rompe alguna '
      +'combinación del censo. Quitar cualquiera dejaría pasar configuraciones que en el taller no sirven.',ny);
  ny+=44;
  nota('De '+f1(C.B.length,0)+' combinaciones sólo '+f1(C.V.length,0)+' cumplen a la vez. '
      +'Los cuatro ajustes se estorban: la rampa que arregla el pico de presión alarga el ciclo, y la '
      +'compensación que quita el tiempo muerto mete el salto de arranque.',ny);
  ny+=44;
  nota('El criterio de compra es el coste, y sólo cuando dos equipos empatan se mira ciclo, luego '
      +'dispersión y luego pico. La válvula cara no es mejor si la barata ya cumple.',ny);
}

// ---------- 6.5 reto ----------
function drawReto(){
  const E=estAct(), p=CUR, C=censo(ST.reto.est);
  title2('Reto · '+E.nombre, E.detalle+' — monta la combinación más barata que cumpla los siete criterios');
  let y=tablaCrit(p,E,126);
  y=veredicto(p,y+16);
  y=barraCoste(y+14,p,C);
  rpanel(392);
  let py=PX.y+30;
  texto('LO QUE EXIGE LA FAENA',PX.x+14,py,'#7f8b9c',13,'left','800'); py+=26;
  prow(py,'velocidad de trabajo',f1(E.vReq*1000,1)+' mm/s',TINTA); py+=24;
  prow(py,'carrera',f1(E.L,0)+' mm',TINTA); py+=24;
  prow(py,'ciclo máximo',f1(E.tMax,1)+' s',TINTA); py+=24;
  prow(py,'tolerancia de parada',f1(E.tol,2)+' mm',TINTA); py+=24;
  prow(py,'rizado máximo',f1(E.riz,3)+' mm',TINTA); py+=24;
  prow(py,'tiempo muerto máximo',f1(E.tdMax,2)+' s',TINTA); py+=24;
  prow(py,'salto de arranque máximo',f1(E.vk,1)+' mm/s',TINTA); py+=24;
  prow(py,'presión límite',f1(E.pLim,0)+' bar',TINTA); py+=26;
  linea(PX.x+14,py-14,PX.x+PX.w-14,py-14,'#243043',1);
  texto('TU MONTAJE',PX.x+14,py,'#7f8b9c',13,'left','800'); py+=26;
  prow(py,'válvula',VALV[RETO.cfg.valv].abr,colOk(RETO.ejes.valv)); py+=24;
  prow(py,'dither',DITH[RETO.cfg.dith].abr,colOk(RETO.ejes.dith)); py+=24;
  prow(py,'rampa',f1(RETO.cfg.ramp,1)+' s',colOk(RETO.ejes.ramp)); py+=24;
  prow(py,'compensación',COMP_ROT[RETO.cfg.comp],colOk(RETO.ejes.comp)); py+=26;
  linea(PX.x+14,py-14,PX.x+PX.w-14,py-14,'#243043',1);
  prow(py,'válidas en el censo',f1(C.V.length,0),TINTA); py+=24;
  prow(py,'estado',RETO.resuelto?'RESUELTO':'en curso',RETO.resuelto?OK_HEX:WARN_HEX);
  let ny=y+18;
  if(RETO.resuelto){
    nota('Resuelto. Ésta es la combinación más barata que cumple: '+VALV[p.valv].rot+', '
        +DITH[p.dith].rot+', rampa de '+f1(p.ramp,1)+' s y amplificador '+COMP_ROT[p.comp]
        +'. Ciclo '+f1(p.tCiclo,2)+' s, parada '+f1(p.disp*1000,3)+' mm, pico '+f1(p.pPico,1)+' bar.',ny);
  } else {
    nota(RETO.msg||'Ajusta los cuatro mandos y comprueba. La marca blanca de la barra señala el coste '
        +'mínimo con el que esta faena se puede resolver.',ny);
  }
  ny+=62;
  nota('Ojo con el orden: no se busca la combinación más rápida ni la más precisa, sino la más barata '
      +'que cumpla TODO. Entre iguales de coste gana la de menor tiempo de ciclo.',ny);
}

function drawBoard(){
  bg();
  if(mode==='consigna') drawConsigna();
  else if(mode==='carga') drawCarga();
  else if(mode==='rampa') drawRampa();
  else if(mode==='proyecto') drawProyecto();
  else drawReto();
  btex.needsUpdate=true;
}
// ===================== 7. GRUPO 3D =====================
const rig=new THREE.Group(); scene.add(rig);
const HOVER_LABELS=new Map();
function addHoverLabel(obj,text,color,pos,scale){
  const cv=document.createElement('canvas'); cv.width=256; cv.height=64;
  const g=cv.getContext('2d');
  g.fillStyle='rgba(8,11,17,0.88)'; g.beginPath(); g.roundRect(2,2,252,60,12); g.fill();
  g.strokeStyle=color||AZUL; g.lineWidth=2; g.beginPath(); g.roundRect(2,2,252,60,12); g.stroke();
  g.fillStyle=color||'#dbe4f0'; g.font='700 22px ui-sans-serif,system-ui,sans-serif';
  g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,128,34,236);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),
    depthTest:false,transparent:true}));
  sp.scale.set((scale||0.62)*2,(scale||0.62)*0.5,1);
  sp.position.set(pos[0],pos[1],pos[2]);
  sp.renderOrder=999; sp.visible=false;
  rig.add(sp); HOVER_LABELS.set(obj,sp);
  return sp;
}
const LINEAS={};
function linea3(key,pts,mat,r){
  const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,72,r||0.040,12,false),mat);
  rig.add(m); LINEAS[key]={mesh:m,curve};
  return LINEAS[key];
}
const PART=[];
function particulas(key,n,mat){
  const grupo=new THREE.Group(); rig.add(grupo);
  const ms=[], fase=[];
  for(let i=0;i<n;i++){
    const s=new THREE.Mesh(new THREE.SphereGeometry(0.036,10,8),mat);
    grupo.add(s); ms.push(s); fase.push(i/n);
  }
  const p={key,curve:LINEAS[key].curve,ms,fase,grupo};
  PART.push(p); return p;
}
function marcaPick(obj,key){ obj.traverse(o=>{o.userData.pick=key;}); obj.userData.pick=key; return obj; }

// ---- bancada ----
(function(){
  const b=roundedBox(5.90,0.16,2.00,MAT.base,0.05);
  b.position.set(1.70,0.08,0); rig.add(b);
  const tr=new THREE.Mesh(new THREE.BoxGeometry(5.90,0.02,0.02),std('#2a3346',0.7,0.3));
  tr.position.set(1.70,0.17,0.98); rig.add(tr);
})();

// ---- central: depósito y bomba ----
const grpCentral=new THREE.Group(); rig.add(grpCentral);
(function(){
  const tk=roundedBox(1.14,0.62,0.94,MAT.cuerpo,0.06);
  tk.position.set(-0.58,0.47,0); grpCentral.add(tk);
  const vidrio=new THREE.Mesh(new THREE.BoxGeometry(0.74,0.34,0.02),MAT.vidrio);
  vidrio.position.set(-0.58,0.44,0.48); grpCentral.add(vidrio);
  const nivel=new THREE.Mesh(new THREE.BoxGeometry(0.70,0.20,0.015),MAT.aceiteP);
  nivel.position.set(-0.58,0.38,0.49); grpCentral.add(nivel);
  const mot=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.40,24),MAT.cuerpo2);
  mot.position.set(-0.58,0.98,0); grpCentral.add(mot);
  const bom=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.14,0.22,20),MAT.acero);
  bom.position.set(-0.58,1.28,0); grpCentral.add(bom);
  const ale=new THREE.Mesh(new THREE.TorusGeometry(0.21,0.02,8,24),MAT.acero);
  ale.position.set(-0.58,0.98,0); ale.rotation.x=Math.PI/2; grpCentral.add(ale);
  marcaPick(grpCentral,'central');
  addHoverLabel(grpCentral,'Central y bomba',CIAN,[-0.58,1.68,0],0.62);
})();

// ---- válvula proporcional ----
const grpValv=new THREE.Group(); rig.add(grpValv);
const hwV={};
(function(){
  const cuerpo=roundedBox(1.06,0.44,0.54,MAT.cuerpo2,0.05);
  cuerpo.position.set(1.30,1.02,0); grpValv.add(cuerpo);
  const sub=roundedBox(1.20,0.18,0.62,MAT.cuerpo,0.04);
  sub.position.set(1.30,0.72,0); grpValv.add(sub);
  const bob=x=>{ const b=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.30,20),MAT.bobina);
    b.position.set(x,1.02,0); b.rotation.z=Math.PI/2; grpValv.add(b);
    const t=new THREE.Mesh(new THREE.CylinderGeometry(0.145,0.145,0.06,20),MAT.acero);
    t.position.set(x+(x>1.3?0.16:-0.16),1.02,0); t.rotation.z=Math.PI/2; grpValv.add(t); return b; };
  hwV.bobA=bob(0.62); hwV.bobB=bob(1.98);
  // ventana con la corredera a la vista
  const hueco=new THREE.Mesh(new THREE.BoxGeometry(0.86,0.13,0.03),std('#05070c',0.9,0.05));
  hueco.position.set(1.30,1.02,0.275); grpValv.add(hueco);
  hwV.spoolGrp=new THREE.Group(); grpValv.add(hwV.spoolGrp);
  hwV.spool=new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.052,0.80,18),MAT.cromo);
  hwV.spool.rotation.z=Math.PI/2; hwV.spool.position.set(1.30,1.02,0.29); hwV.spoolGrp.add(hwV.spool);
  const anillo=x=>{ const a=new THREE.Mesh(new THREE.CylinderGeometry(0.078,0.078,0.10,16),MAT.acero);
    a.rotation.z=Math.PI/2; a.position.set(x,1.02,0.29); hwV.spoolGrp.add(a); return a; };
  hwV.anA=anillo(1.06); hwV.anB=anillo(1.54);
  // orificios de control: su altura es la apertura
  const orif=(x,mat)=>{ const o=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.12,0.02),mat);
    o.position.set(x,1.02,0.285); grpValv.add(o); return o; };
  hwV.orPA=orif(1.03,MAT.aceiteP); hwV.orBT=orif(1.57,MAT.aceiteR);
  marcaPick(grpValv,'valvula');
  addHoverLabel(grpValv,'Válvula proporcional',AZUL,[1.30,1.42,0],0.66);
})();

// ---- tarjeta amplificadora ----
const grpTarj=new THREE.Group(); rig.add(grpTarj);
const hwT={};
(function(){
  const t=roundedBox(0.92,0.58,0.09,MAT.tarjeta,0.04);
  t.position.set(1.30,1.86,-0.06); grpTarj.add(t);
  const riel=new THREE.Mesh(new THREE.BoxGeometry(1.00,0.05,0.05),MAT.acero);
  riel.position.set(1.30,1.55,-0.06); grpTarj.add(riel);
  const led=(x,hex)=>{ const l=new THREE.Mesh(new THREE.SphereGeometry(0.032,12,10),emis(hex,1.2));
    l.position.set(x,2.04,-0.01); grpTarj.add(l); return l; };
  hwT.ledOn=led(1.06,OK_HEX); hwT.ledRamp=led(1.18,WARN_HEX);
  hwT.ledDith=led(1.30,VIO); hwT.ledComp=led(1.42,CIAN);
  const pot=x=>{ const p=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.05,14),MAT.acero);
    p.position.set(x,1.74,-0.01); p.rotation.x=Math.PI/2; grpTarj.add(p);
    const m=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.05,0.012),emis('#eaf1fb',0.7));
    m.position.set(0,0.024,0.03); p.add(m); return p; };
  hwT.potRamp=pot(1.10); hwT.potDith=pot(1.30); hwT.potComp=pot(1.50);
  marcaPick(grpTarj,'tarjeta');
  addHoverLabel(grpTarj,'Tarjeta amplificadora',VIO,[1.30,2.26,0],0.68);
})();

// ---- cilindro diferencial ----
const grpCil=new THREE.Group(); rig.add(grpCil);
const hwC={};
const CIL={x0:2.32, len:1.86, y:1.02, r:0.24};
(function(){
  const cam=new THREE.Mesh(new THREE.CylinderGeometry(CIL.r,CIL.r,CIL.len,28),MAT.cuerpo);
  cam.rotation.z=Math.PI/2; cam.position.set(CIL.x0+CIL.len/2,CIL.y,0); grpCil.add(cam);
  const tapa=x=>{ const t=new THREE.Mesh(new THREE.CylinderGeometry(CIL.r+0.04,CIL.r+0.04,0.10,28),MAT.cuerpo2);
    t.rotation.z=Math.PI/2; t.position.set(x,CIL.y,0); grpCil.add(t); return t; };
  tapa(CIL.x0); tapa(CIL.x0+CIL.len);
  const sop=x=>{ const s=roundedBox(0.16,0.72,0.52,MAT.cuerpo2,0.03);
    s.position.set(x,CIL.y-0.44,0); grpCil.add(s); };
  sop(CIL.x0+0.14); sop(CIL.x0+CIL.len-0.14);
  hwC.vast=new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.085,1.60,20),MAT.cromo);
  hwC.vast.rotation.z=Math.PI/2; grpCil.add(hwC.vast);
  hwC.piston=new THREE.Mesh(new THREE.CylinderGeometry(CIL.r-0.03,CIL.r-0.03,0.10,26),MAT.acero);
  hwC.piston.rotation.z=Math.PI/2; grpCil.add(hwC.piston);
  hwC.camA=new THREE.Mesh(new THREE.CylinderGeometry(CIL.r-0.05,CIL.r-0.05,1,26),MAT.aceiteP.clone());
  hwC.camA.material.transparent=true; hwC.camA.material.opacity=0.55;
  hwC.camA.rotation.z=Math.PI/2; grpCil.add(hwC.camA);
  hwC.camB=new THREE.Mesh(new THREE.CylinderGeometry(CIL.r-0.05,CIL.r-0.05,1,26),MAT.aceiteR.clone());
  hwC.camB.material.transparent=true; hwC.camB.material.opacity=0.45;
  hwC.camB.rotation.z=Math.PI/2; grpCil.add(hwC.camB);
  marcaPick(grpCil,'cilindro');
  addHoverLabel(grpCil,'Cilindro diferencial',NARANJA,[CIL.x0+CIL.len/2,CIL.y+0.52,0],0.66);
})();

// ---- carga ----
const grpCarga=new THREE.Group(); rig.add(grpCarga);
(function(){
  const c=roundedBox(0.46,0.78,0.78,MAT.carga,0.05);
  c.position.set(0,0,0); grpCarga.add(c);
  const ceja=new THREE.Mesh(new THREE.BoxGeometry(0.10,0.20,0.20),MAT.acero);
  ceja.position.set(-0.26,0,0); grpCarga.add(ceja);
  grpCarga.position.set(4.60,CIL.y,0);
  marcaPick(grpCarga,'carga');
  addHoverLabel(grpCarga,'Carga',WARN_HEX,[0,0.62,0],0.56);
})();

// ---- manómetros ----
const grpMan=new THREE.Group(); rig.add(grpMan);
const hwM={};
function manometro(x,y,z,hex,rot,pick){
  const g=new THREE.Group(); g.position.set(x,y,z); grpMan.add(g);
  const caja=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.07,26),MAT.acero);
  caja.rotation.x=Math.PI/2; g.add(caja);
  const esf=new THREE.Mesh(new THREE.CircleGeometry(0.175,26),std('#0d1218',0.8,0.05));
  esf.position.z=0.038; g.add(esf);
  const arco=new THREE.Mesh(new THREE.RingGeometry(0.145,0.165,26,1,Math.PI*0.75,Math.PI*1.5),emis(hex,0.45));
  arco.position.z=0.041; g.add(arco);
  const ag=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.15,0.008),emis('#eaf1fb',0.8));
  ag.position.set(0,0.070,0.046); const piv=new THREE.Group(); piv.add(ag);
  piv.position.z=0.0; g.add(piv);
  const tubo=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.30,12),MAT.acero);
  tubo.position.set(0,-0.30,0); g.add(tubo);
  addHoverLabel(g,rot,hex,[0,0.34,0],0.54);
  marcaPick(g,pick);
  return {g,piv};
}
hwM.A=manometro(2.42,1.72,0.30,NARANJA,'Manómetro p_A','manoA');
hwM.B=manometro(3.92,1.72,0.30,CIAN,'Manómetro p_B','manoB');

// ---- escala de posición ----
const grpEsc=new THREE.Group(); rig.add(grpEsc);
const hwE={};
(function(){
  const riel=new THREE.Mesh(new THREE.BoxGeometry(1.60,0.05,0.10),std('#1e2533',0.8,0.2));
  riel.position.set(4.30,0.40,0.46); grpEsc.add(riel);
  for(let i=0;i<=10;i++){
    const t=new THREE.Mesh(new THREE.BoxGeometry(0.014,i%5===0?0.14:0.08,0.02),
      std(i%5===0?'#c8d3e2':'#5f6b7c',0.7,0.2));
    t.position.set(3.52+1.56*i/10,0.50,0.50); grpEsc.add(t);
  }
  hwE.marca=new THREE.Mesh(new THREE.ConeGeometry(0.06,0.14,4),emis(OK_HEX,1.0));
  hwE.marca.rotation.x=Math.PI; hwE.marca.position.set(3.52,0.64,0.50); grpEsc.add(hwE.marca);
  marcaPick(grpEsc,'escala');
  addHoverLabel(grpEsc,'Escala de carrera',OK_HEX,[4.30,0.92,0.46],0.58);
})();

// ---- tuberías y partículas ----
linea3('P',[[-0.58,1.36,0],[-0.58,0.60,0.44],[0.40,0.52,0.46],[1.10,0.62,0.34],[1.24,0.74,0.12]],MAT.tuboP,0.042);
linea3('T',[[1.42,0.74,-0.12],[1.60,0.56,-0.42],[0.40,0.48,-0.46],[-0.58,0.62,-0.36],[-0.58,0.74,-0.20]],MAT.tuboR,0.042);
linea3('A',[[1.86,1.10,0.14],[2.06,1.44,0.26],[2.26,1.36,0.20],[2.34,1.20,0.12]],MAT.tuboP,0.038);
linea3('B',[[3.98,1.20,0.12],[4.08,1.56,0.26],[2.30,1.72,0.30],[1.90,1.36,0.16]],MAT.tuboR,0.038);
const PP=particulas('P',10,MAT.aceiteP);
const PA=particulas('A',6,MAT.aceiteP);
const PB=particulas('B',10,MAT.aceiteR);
const PT=particulas('T',10,MAT.aceiteR);
// ===================== 8. ACTUALIZACIÓN 3D =====================
// La animacion no inventa nada: la velocidad del vastago sale del perfil
// sellado, la apertura de la corredera es v/v_max y las gotas corren con el
// caudal. Si la combinacion no mueve la carga, la maquina se queda quieta.
const ANIM={ t:0, s:0, fase:'ext', esp:0 };
function vDe(R,t){
  const P=R.pts;
  for(let i=1;i<P.length;i++){
    if(t<=P[i][0]){ const a=P[i-1], b=P[i];
      const w=(b[0]-a[0])>1e-12?(t-a[0])/(b[0]-a[0]):1;
      return a[1]+(b[1]-a[1])*w; }
  }
  return 0;
}
function cinDe(p,R,t){
  const cm=p.c0c, r=p.ramp;
  if(t<=R.t2) return Math.min(cm,100*t/r);
  return Math.max(0,cm-100*(t-R.t2)/r);
}
function updateHW(){
  const p=CUR, E=estAct();
  hw.p=p; hw.E=E; hw.L=E.L/1000;
  hw.vivo = p.vPico>0 && Number.isFinite(p.tCiclo) && Number.isFinite(p.tAcc);
  hw.prof = hw.vivo ? perfil(p) : null;
  if(mode==='consigna'){
    hw.modo3d='estatico';
    const c=ST.consigna.cin;
    hw.uFijo=uSub(c<=0?1e-12:c,VALV[ST.consigna.valv].bm,p.H,ST.consigna.comp);
    hw.vFijo=Math.min(p.vmaxV*hw.uFijo,p.vb);
    hw.cinFijo=c;
  } else if(mode==='carga'){
    hw.modo3d='constante';
    hw.uFijo=uMan();
    hw.vFijo=Math.min(p.vmaxV*hw.uFijo,p.vb);
    hw.cinFijo=null;
  } else {
    hw.modo3d= hw.vivo ? 'ciclo' : 'parado';
    hw.uFijo=0; hw.vFijo=0; hw.cinFijo=0;
  }
  hw.vRef=Math.max(p.vTop,p.vPico,hw.vFijo||0,1e-9);
  hw.pRef=Math.max(E.pS,E.pLim,p.pPico,1)*1.05;
  ANIM.t=0; ANIM.s=(hw.modo3d==='estatico')?hw.L*0.34:0; ANIM.fase='ext'; ANIM.esp=0;
}
const _pv=new THREE.Vector3();
function colocaHW(dt){
  const p=hw.p, E=hw.E;
  if(!p) return;
  let v=0, u=0, cin=0;
  if(hw.modo3d==='estatico'){ v=0; u=hw.uFijo; cin=hw.cinFijo; }
  else if(hw.modo3d==='constante'){
    u=hw.uFijo; v=hw.vFijo;
    ANIM.s+=v*dt*(ANIM.fase==='ext'?1:-1);
    if(ANIM.s>=hw.L){ ANIM.s=hw.L; ANIM.fase='ret'; }
    if(ANIM.s<=0){ ANIM.s=0; ANIM.fase='ext'; }
  } else if(hw.modo3d==='ciclo'){
    const R=hw.prof;
    if(ANIM.fase==='ext'){
      ANIM.t+=dt; v=vDe(R,ANIM.t); cin=cinDe(p,R,ANIM.t);
      ANIM.s=Math.min(hw.L,ANIM.s+v*dt);
      if(ANIM.t>=R.t5){ ANIM.fase='esp1'; ANIM.esp=0; }
    } else if(ANIM.fase==='esp1'){
      ANIM.esp+=dt; if(ANIM.esp>0.7){ ANIM.fase='ret'; }
    } else if(ANIM.fase==='ret'){
      const vr=hw.L/1.1; ANIM.s-=vr*dt;
      if(ANIM.s<=0){ ANIM.s=0; ANIM.fase='esp2'; ANIM.esp=0; }
    } else { ANIM.esp+=dt; if(ANIM.esp>0.5){ ANIM.fase='ext'; ANIM.t=0; ANIM.s=0; } }
    if(ANIM.fase!=='ext'){ v=0; cin=0; }
    u=p.vmaxV>0?clamp(v/p.vmaxV,0,1):0;
    if(v>=p.vb-1e-12 && p.vb>0) u=Math.max(u,p.uTop);
  }
  hw.vAct=v; hw.uAct=u; hw.cinAct=cin;
  hw.frac=hw.L>0?clamp(ANIM.s/hw.L,0,1):0;
  const retro=(ANIM.fase==='ret');
  hw.flujo=clamp((retro?hw.L/1.1:v)/hw.vRef,0,1);
  // corredera
  hwV.spoolGrp.position.x=0.16*(retro?-0.70:u);
  hwV.orPA.scale.y=Math.max(0.06,u); hwV.orBT.scale.y=Math.max(0.06,u);
  hwV.orPA.material.emissiveIntensity=0.25+0.9*u;
  hwV.orBT.material.emissiveIntensity=0.20+0.7*u;
  hwV.bobA.material.emissiveIntensity=retro?0.08:(0.10+1.1*u);
  hwV.bobB.material.emissiveIntensity=retro?1.0:0.08;
  // cilindro
  const x0=CIL.x0+0.12, x1=CIL.x0+CIL.len-0.12;
  const xp=x0+(x1-x0)*hw.frac;
  hwC.piston.position.set(xp,CIL.y,0);
  hwC.vast.position.set(xp+0.80,CIL.y,0);
  grpCarga.position.set(xp+1.60+0.24,CIL.y,0);
  const la=Math.max(0.02,xp-CIL.x0-0.05);
  hwC.camA.scale.y=la; hwC.camA.position.set((CIL.x0+0.05+xp)/2,CIL.y,0);
  const lb=Math.max(0.02,CIL.x0+CIL.len-0.05-xp);
  hwC.camB.scale.y=lb; hwC.camB.position.set((xp+CIL.x0+CIL.len-0.05)/2,CIL.y,0);
  // manometros: aguja de 0 a p_ref sobre 270 grados
  const ang=q=>Math.PI*0.75-1.5*Math.PI*clamp(q/hw.pRef,0,1);
  const activo=v>1e-9;
  hwM.A.piv.rotation.z=ang(activo?p.pA:E.pS)-Math.PI/2;
  hwM.B.piv.rotation.z=ang(activo?p.pB:P_T)-Math.PI/2;
  // escala
  hwE.marca.position.x=3.52+1.56*hw.frac;
  hwE.marca.material.emissiveIntensity=activo?1.2:0.35;
  // tarjeta
  const cfg=cfgDe(mode);
  hwT.ledOn.material.emissiveIntensity=hw.vivo?1.2:0.15;
  hwT.ledRamp.material.emissiveIntensity=0.25+0.9*clamp(cin/100,0,1);
  hwT.ledDith.material.emissiveIntensity=DITH[cfg.dith].a>0?(0.5+0.6*Math.abs(Math.sin(animT*6))):0.10;
  hwT.ledComp.material.emissiveIntensity=cfg.comp==='no'?0.10:(cfg.comp==='si'?0.85:1.3);
  hwT.potRamp.rotation.z=-2.4*RAMPAS.indexOf(cfg.ramp)/(RAMPAS.length-1);
  hwT.potDith.rotation.z=-2.4*DITH_KEYS.indexOf(cfg.dith)/(DITH_KEYS.length-1);
  hwT.potComp.rotation.z=-2.4*COMPS.indexOf(cfg.comp)/(COMPS.length-1);
  // gotas
  for(const q of PART){
    const vv=0.55*hw.flujo;
    q.grupo.visible=vv>0.002;
    if(!q.grupo.visible) continue;
    for(let i=0;i<q.ms.length;i++){
      // Modulo, no una resta: con dt grande (pestaña en segundo plano, GC) la fase
      // se pasa de 1 mas de una vez y getPointAt(u>1) revienta dentro de three.
      q.fase[i]=(q.fase[i]+dt*vv)%1;
      q.curve.getPointAt(q.fase[i],_pv);
      q.ms[i].position.copy(_pv);
    }
  }
}
// ===================== 9. HUD Y PANEL =====================
el('hud').innerHTML=`
  <div class="eyebrow">Hidráulica y Neumática · Mecánica</div>
  <h2>Opera válvulas proporcionales con rampas y consignas</h2>
  <p>Una válvula proporcional no es un grifo lineal. Entre la señal que manda la tarjeta y el aceite que sale hay tres cosas que nadie te enseña en el catálogo: una <b>banda muerta</b> donde la corredera se mueve y no pasa caudal, una <b>histéresis</b> que hace que subir y bajar no den la misma apertura, y un <b>tiempo de respuesta</b> que se suma a la rampa que tú programas. Aquí montas válvula, dither, rampa y compensación, y compruebas si la máquina llega a tiempo, para donde debe y sin reventar el manómetro.</p>
  <div class="formula">v = (Q<sub>n</sub>·u/√Δp<sub>n</sub>)·√(ΔF/(A<sub>a</sub>³+A<sub>b</sub>³)) · Δp<sub>PA</sub> = ΔF·A<sub>a</sub>²/Ω · u = g(c ∓ H/2) · t<sub>real</sub> = √(t<sub>orden</sub>² + t<sub>v</sub>²)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Rama subiendo: la consigna crece y la corredera va por detrás H/2</div>
    <div class="li"><span class="dot" style="background:#F2A65A"></span>Rama bajando: la misma señal da otra apertura, esa es la histéresis</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>Zonas sin control: banda muerta al arrancar y juego al parar</div>
    <div class="li"><span class="dot" style="background:#5BD4E5"></span>Cámara anular: su presión sube con φ² y no la elige la válvula</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Criterio cumplido: los siete se juzgan a la vez, no de uno en uno</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el caudal por cada canto de control según la ley de raíz de ISO 4411, Q = Q<sub>n</sub>·u·√(Δp<sub>canto</sub>/Δp<sub>n</sub>), con el caudal nominal referido a su propia Δp<sub>n</sub> (por eso dos válvulas sólo se comparan si comparten Δp<sub>n</sub>); el cilindro diferencial en régimen resuelto con la fuerza neta disponible ΔF = p<sub>S</sub>A<sub>a</sub> − p<sub>T</sub>A<sub>b</sub> − F − F<sub>r</sub>, del que sale la consecuencia sellada de que el reparto de la caída Δp<sub>PA</sub> = ΔF·A<sub>a</sub>²/Ω y Δp<sub>BT</sub> = ΔF·A<sub>b</sub>²/Ω <b>no depende de la válvula</b>; el tope de caudal de la bomba; la característica estática con banda muerta y con la histéresis tratada como <b>operador de juego</b> (subiendo u = g(c − H/2), bajando u = g(c + H/2)), que es lo que produce el retardo al parar; las tres compensaciones de la tarjeta (ninguna, salto de banda muerta y sobrecompensación con escalón J = 4 %); el dither como reducción de la histéresis efectiva con suelo del 15 % y como rizado de posición filtrado por la respuesta propia de la válvula, g(f) = 1/√(1+(f/f<sub>v</sub>)²); la rampa ejecutada en cuadratura con el tiempo de subida de la válvula, t = √(t<sub>orden</sub>²+t<sub>v</sub>²); el perfil real de movimiento completo con tiempo muerto, aceleración, meseta, arrastre del juego, frenado y cola; el tiempo de ciclo, la dispersión del punto de parada, la presión de frenado con su aviso de cavitación y el rizado; y el censo de las 450 combinaciones de cada estación contra siete criterios y su coste.</div>
    <div class="fl no"><b>NO modela:</b> el lazo cerrado de posición con captador y regulador —eso es otra práctica—; la compresibilidad del aceite y la frecuencia natural de la columna, que en un eje largo manda tanto como la válvula; la dinámica interna de la corredera más allá de un primer orden con su frecuencia de corte; el detalle de la etapa de potencia (PWM, corriente de bobina, saturación magnética); la deriva de la banda muerta y de la histéresis con la temperatura y el desgaste; ni las fugas internas de la propia válvula en centro cerrado. Los catálogos de válvula y dither son representativos del tipo constructivo, no de un fabricante concreto, y el coste es relativo entre ellas, no un precio de compra.</div>
  </div>
  <div class="src">Ref: ISO 4413 · ISO 4411 · ISO 10770-1 · ISO 1219-1</div>`;

el('panel').innerHTML=`
  <h4>Banco proporcional · <span id="p_mode" style="color:var(--accent2)">Consigna</span></h4>
  <div class="modebar">
    <button class="b on" id="m_consigna">1 · Consigna</button>
    <button class="b" id="m_carga">2 · Carga</button>
    <button class="b" id="m_rampa">3 · Rampa</button>
    <button class="b" id="m_proyecto">4 · Proyecto</button>
    <button class="b" id="m_reto">5 · Reto</button>
  </div>
  <div id="scenarioInfo" style="display:none;margin:8px 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:12.5px;line-height:1.45"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div style="margin:8px 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px">
    <div style="font-size:12px;color:var(--muted)" id="hwrot">Prensa de encolado</div>
    <div style="font-size:13px;font-weight:600" id="hwsub">Eje hidráulico proporcional</div>
  </div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Reto</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12.5px;line-height:1.5;margin-bottom:8px"></div>
    <button class="b primary" id="btnCheck">✅ Comprobar</button>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:13px;line-height:1.5;margin-bottom:8px"></div>
  <div class="btns" id="dxbtns"></div>
  <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
  <button class="b primary" id="btnNew">🔀 Nuevo escenario</button>`;

// ===================== 10. TOAST =====================
function showToast(html){
  const t=el('toast');t.innerHTML=html;t.classList.add('show');
  clearTimeout(showToast._t);showToast._t=setTimeout(()=>t.classList.remove('show'),4600);
}
// ===================== 11. MODOS Y CONTROLES =====================
const MODE_META={
  consigna:{nombre:'Consigna',cam:[[5.0,2.9,7.2],[1.70,1.20,0.00]],
    mision:'Sube la consigna desde cero y mira cuándo empieza de verdad a moverse la corredera. Hasta la banda muerta no pasa nada; después, la misma señal da dos aperturas distintas según vengas subiendo o bajando. Eso es la histéresis, y la tarjeta sólo puede disimularla: con el salto de banda muerta y con el dither.'},
  carga:{nombre:'Carga',cam:[[4.2,2.7,7.8],[2.60,1.05,0.00]],
    mision:'Con la apertura fija en la mano, cambia de estación. La velocidad no es proporcional a la carga: va con la raíz de la fuerza neta que queda. Y hay un reparto de presiones entre las dos cámaras que no depende de la válvula que montes, sino sólo de la geometría del cilindro.'},
  rampa:{nombre:'Rampa',cam:[[6.2,3.3,8.6],[3.10,1.05,0.00]],
    mision:'Programa una rampa y compara lo que ordena la tarjeta con lo que hace la máquina. Entre las dos hay un tiempo muerto al arrancar, una subida que se suma en cuadratura con la de la válvula y, al parar, un arrastre por el juego de la histéresis: ahí está la dispersión del punto de parada.'},
  proyecto:{nombre:'Proyecto',cam:[[6.6,3.8,9.2],[2.60,1.10,0.00]],
    mision:'Siete criterios a la vez sobre la estación montada: velocidad, zona útil, arranque, presión de pico, tiempo de ciclo, precisión de parada y rizado. El censo de las 450 combinaciones te dice cuántas caen por cada criterio y cuántas caen sólo por ése.'},
  reto:{nombre:'Reto',cam:[[7.0,4.0,9.4],[2.30,1.10,0.00]],
    mision:'Monta el eje válido más barato para la faena que te toca. Cuatro ejes —válvula, dither, rampa y compensación— y siete criterios que hay que cumplir juntos; a igualdad de coste gana el ciclo más rápido.'},
};
const lbl=t=>`<span style="align-self:center;color:var(--muted);font-size:12px;margin:0 4px 0 2px">${t}</span>`;
function optBtns(key,opts,cur){
  return opts.map(o=>{
    const v=Array.isArray(o)?o[0]:o, t=Array.isArray(o)?o[1]:o;
    return `<button class="b sm ${String(cur)===String(v)?'on':''}" data-${key}="${v}">${t}</button>`;
  }).join('');
}
const beep=()=>synth.beep(680,0.05,0.04);
const EST_ABR={prensa:'Prensa',carro:'Carro',sierra:'Sierra',elevad:'Elevador',dosif:'Dosificador'};
const OPT_EST =EST_KEYS.map(k=>[k,EST_ABR[k]]);
const OPT_VALV=VALV_KEYS.map(k=>[k,VALV[k].abr]);
const OPT_DITH=DITH_KEYS.map(k=>[k,DITH[k].abr]);
const OPT_RAMP=RAMPAS.map(r=>[r,f1(r,1)+' s']);
const OPT_COMP=COMPS.map(c=>[c,COMP_ROT[c]]);
const CINS=[0,5,10,15,20,25,30,40,55,70,85,100];
const OPT_CIN=CINS.map(c=>[c,f1(c,0)+' %']);
const US=[0.10,0.25,0.40,0.55,0.70,0.85,1.00];
const OPT_U=US.map(u=>[u,f1(100*u,0)+' %']);
const EJE_ROT={valv:'Válvula',dith:'Dither',ramp:'Rampa',comp:'Compensación'};
const EJE_VAL_ROT={valv:v=>VALV[v].rot,dith:v=>DITH[v].rot,
  ramp:v=>f1(v,1)+' s',comp:v=>COMP_ROT[v]};

function buildControls(){
  const bar=el('selbar');let h='';
  if(mode==='consigna'){
    h+=lbl('Estación')+optBtns('ae',OPT_EST,ST.consigna.est);
    h+=lbl('Válvula')+optBtns('av',OPT_VALV,ST.consigna.valv);
    h+=lbl('Dither')+optBtns('ad',OPT_DITH,ST.consigna.dith);
    h+=lbl('Tarjeta')+optBtns('ac',OPT_COMP,ST.consigna.comp);
    h+=lbl('Consigna')+optBtns('an',OPT_CIN,ST.consigna.cin);
  }else if(mode==='carga'){
    h+=lbl('Estación')+optBtns('be',OPT_EST,ST.carga.est);
    h+=lbl('Válvula')+optBtns('bv',OPT_VALV,ST.carga.valv);
    h+=lbl('Apertura')+optBtns('bu',OPT_U,ST.carga.u);
  }else if(mode==='rampa'){
    h+=lbl('Estación')+optBtns('ce',OPT_EST,ST.rampa.est);
    h+=lbl('Válvula')+optBtns('cv',OPT_VALV,ST.rampa.valv);
    h+=lbl('Rampa')+optBtns('cr',OPT_RAMP,ST.rampa.ramp);
    h+=lbl('Tarjeta')+optBtns('cc',OPT_COMP,ST.rampa.comp);
    h+=lbl('Dither')+optBtns('cd',OPT_DITH,ST.rampa.dith);
  }else if(mode==='proyecto'){
    h+=lbl('Estación')+optBtns('de',OPT_EST,ST.proyecto.est);
    h+=lbl('Válvula')+optBtns('dv',OPT_VALV,ST.proyecto.valv);
    h+=lbl('Dither')+optBtns('dd',OPT_DITH,ST.proyecto.dith);
    h+=lbl('Rampa')+optBtns('dr',OPT_RAMP,ST.proyecto.ramp);
    h+=lbl('Tarjeta')+optBtns('dc',OPT_COMP,ST.proyecto.comp);
  }else{
    h+=lbl('Válvula')+optBtns('xv',OPT_VALV,RETO.cfg.valv);
    h+=lbl('Dither')+optBtns('xd',OPT_DITH,RETO.cfg.dith);
    h+=lbl('Rampa')+optBtns('xr',OPT_RAMP,RETO.cfg.ramp);
    h+=lbl('Tarjeta')+optBtns('xc',OPT_COMP,RETO.cfg.comp);
    h+='<button class="b sm" id="btnPista">💡 Pista</button>';
  }
  bar.innerHTML=h;bar.style.display='flex';
  const wire=(attr,fn)=>bar.querySelectorAll('['+attr+']').forEach(b=>{
    b.onclick=()=>{if(autoRunning)return;fn(b.getAttribute(attr));beep();afterEdit();};
  });
  wire('data-ae',v=>{ST.consigna.est=v;});
  wire('data-av',v=>{ST.consigna.valv=v;});
  wire('data-ad',v=>{ST.consigna.dith=v;});
  wire('data-ac',v=>{ST.consigna.comp=v;});
  wire('data-an',v=>{ST.consigna.cin=Number(v);});
  wire('data-be',v=>{ST.carga.est=v;});
  wire('data-bv',v=>{ST.carga.valv=v;});
  wire('data-bu',v=>{ST.carga.u=Number(v);});
  wire('data-ce',v=>{ST.rampa.est=v;});
  wire('data-cv',v=>{ST.rampa.valv=v;});
  wire('data-cr',v=>{ST.rampa.ramp=Number(v);});
  wire('data-cc',v=>{ST.rampa.comp=v;});
  wire('data-cd',v=>{ST.rampa.dith=v;});
  wire('data-de',v=>{ST.proyecto.est=v;});
  wire('data-dv',v=>{ST.proyecto.valv=v;});
  wire('data-dd',v=>{ST.proyecto.dith=v;});
  wire('data-dr',v=>{ST.proyecto.ramp=Number(v);});
  wire('data-dc',v=>{ST.proyecto.comp=v;});
  wire('data-xv',v=>{RETO.cfg={...RETO.cfg,valv:v};RETO.msg='';RETO.resuelto=false;});
  wire('data-xd',v=>{RETO.cfg={...RETO.cfg,dith:v};RETO.msg='';RETO.resuelto=false;});
  wire('data-xr',v=>{RETO.cfg={...RETO.cfg,ramp:Number(v)};RETO.msg='';RETO.resuelto=false;});
  wire('data-xc',v=>{RETO.cfg={...RETO.cfg,comp:v};RETO.msg='';RETO.resuelto=false;});
  const bp=el('btnPista');
  if(bp) bp.onclick=()=>{if(autoRunning)return;pista();};
}
// Una pista destapa UN eje: dice que valores de ese eje aparecen en alguna
// combinacion optima. No resuelve el reto, porque los cuatro ejes se juzgan
// juntos y acertar uno no garantiza que el conjunto valga.
function pista(){
  const eje=EJES.find(e=>!RETO.ejes[e]);
  if(!eje){showToast('💡 Ya has destapado los cuatro ejes. La combinación la tienes que cerrar tú.');return;}
  RETO.ejes[eje]=true;beep();
  const vals=ejeSolC(ST.reto.est,eje).map(v=>EJE_VAL_ROT[eje](v)).join(' · ');
  showToast('💡 <b>'+EJE_ROT[eje]+'.</b> En el montaje más barato aparece: '+(vals||'ningún valor: esta estación no tiene solución'));
  afterEdit();
}

function updateScenarioInfo(){
  const d=el('scenarioInfo');
  d.style.display='block';
  d.innerHTML='<b>'+MODE_META[mode].nombre+'.</b> '+MODE_META[mode].mision;
}
function updateHwRot(){
  const E=estAct(), c=cfgDe(mode);
  el('hwrot').textContent=E.nombre;
  let ex='';
  if(mode==='consigna') ex=' · consigna '+f1(ST.consigna.cin,0)+' %';
  else if(mode==='carga') ex=' · apertura '+f1(100*uMan(),0)+' %';
  el('hwsub').textContent=E.detalle+' · '+VALV[c.valv].abr+' · '+DITH[c.dith].abr+
    ' · rampa '+f1(c.ramp,1)+' s · '+COMP_ROT[c.comp]+ex;
}
function afterEdit(){
  computa();
  buildControls();
  updateScenarioInfo();
  if(mode==='reto')updateRetoSpec();
  refreshAll();
}
function setMode(k){
  mode=k;animT=0;
  MODES.forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('retoTitle').style.display=k==='reto'?'':'none';
  el('retoBox').style.display=k==='reto'?'':'none';
  computa();
  buildControls();updateScenarioInfo();
  clearDx();buildQuiz();refreshQuestion();
  if(k==='reto')updateRetoSpec();
  const cam=MODE_META[k].cam;S.moveTo(cam[0],cam[1]);
  refreshAll();
}
// "Nuevo escenario": en el reto cambia de faena y rearma el montaje de partida;
// en los modos de estudio mueve el ensayo al siguiente caso que ensena algo.
function newSignal(){
  if(mode==='consigna'){
    const i=CINS.indexOf(ST.consigna.cin);ST.consigna.cin=CINS[(i+1)%CINS.length];
    if(i+1>=CINS.length){const j=VALV_KEYS.indexOf(ST.consigna.valv);ST.consigna.valv=VALV_KEYS[(j+1)%VALV_KEYS.length];}
  }else if(mode==='carga'){
    const i=EST_KEYS.indexOf(ST.carga.est);ST.carga.est=EST_KEYS[(i+1)%EST_KEYS.length];
    const o=solucion(ST.carga.est); if(o)ST.carga.valv=o.valv;
  }else if(mode==='rampa'){
    const i=RAMPAS.indexOf(ST.rampa.ramp);ST.rampa.ramp=RAMPAS[(i+1)%RAMPAS.length];
    if(i+1>=RAMPAS.length){
      const j=EST_KEYS.indexOf(ST.rampa.est);ST.rampa.est=EST_KEYS[(j+1)%EST_KEYS.length];
      const o=solucion(ST.rampa.est); if(o){ST.rampa.valv=o.valv;ST.rampa.comp=o.comp;ST.rampa.dith=o.dith;}
    }
  }else if(mode==='proyecto'){
    const i=EST_KEYS.indexOf(ST.proyecto.est);ST.proyecto.est=EST_KEYS[(i+1)%EST_KEYS.length];
    const s=startCfg(ST.proyecto.est);
    ST.proyecto.valv=s.valv;ST.proyecto.dith=s.dith;ST.proyecto.ramp=s.ramp;ST.proyecto.comp=s.comp;
  }else{
    const i=EST_KEYS.indexOf(ST.reto.est);ST.reto.est=EST_KEYS[(i+1)%EST_KEYS.length];
    retoSolveBuild(true);
  }
  RETO.resuelto=false;solved=false;RETO.msg='';
  computa();buildControls();updateScenarioInfo();
  clearDx();buildQuiz();refreshQuestion();
  if(mode==='reto')updateRetoSpec();
  refreshAll();
  showToast('🔀 <b>Escenario nuevo.</b> '+MODE_META[mode].mision);
}
// ===================== 12. TELEMETRÍA E INFORME =====================
function teleRow(l,v,cls){
  return '<div class="trow"><span class="tl">'+l+'</span><span class="tv'+(cls?' '+cls:'')+'">'+v+'</span></div>';
}
const cls2=b=>b?'ok':'bad';
const mm=(x,d)=>f1(1000*x,d===undefined?2:d)+' mm';
const mms=(x,d)=>f1(1000*x,d===undefined?1:d)+' mm/s';

function updateTele(){
  const c=cfgDe(mode), E=ESTACIONES[c.est], r=CUR, V=VALV[c.valv];
  let h='';
  if(mode==='consigna'){
    const cin=ST.consigna.cin;
    const us=uSub(cin<=0?1e-12:cin,r.bm,r.H,c.comp), ub=uBaj(cin<=0?1e-12:cin,r.bm,r.H,c.comp);
    h+=teleRow('Válvula montada',V.rot);
    h+=teleRow('Banda muerta de catálogo',f1(r.bm,1)+' %');
    h+=teleRow('Histéresis de catálogo',f1(V.h0,1)+' %');
    h+=teleRow('Histéresis efectiva H',f1(r.H,2)+' %',cls2(r.H<V.h0-1e-9));
    h+=teleRow('Consigna de entrada',f1(cin,0)+' %');
    h+=teleRow('Salida del amplificador',f1(cout(cin<=0?1e-12:cin,r.bm,c.comp),1)+' %');
    h+=teleRow('Apertura subiendo',f1(us,3));
    h+=teleRow('Apertura bajando',f1(ub,3));
    h+=teleRow('Salto de histéresis Δu',f1(ub-us,3));
    h+=teleRow('Velocidad subiendo',mms(Math.min(r.vmaxV*us,r.vb)));
    h+=teleRow('Consigna de arranque',f1(r.cArr,1)+' %');
    h+=teleRow('Apertura a consigna 0⁺',f1(r.uKick,3)+' → '+mms(r.vKick,2),cls2(r.vKick*1000<=E.vk));
    h+=teleRow('Zona útil exigida','c ≥ '+f1(C_MIN,0)+' % · u ≥ '+f1(U_MIN,2));
    h+=teleRow('Rizado que mete el dither',mm(r.rip,3),cls2(r.okRizo));
  }else if(mode==='carga'){
    const u=uMan();
    const vv=r.vmaxV*u, vr=Math.min(vv,r.vb);
    h+=teleRow('Ø pistón / Ø vástago',f1(E.dp,0)+' / '+f1(E.dv,0)+' mm');
    h+=teleRow('Área motriz A_a',f1(r.Aa*1e4,2)+' cm²');
    h+=teleRow('Área anular A_b',f1(r.Ab*1e4,2)+' cm²');
    h+=teleRow('Relación φ = A_a/A_b',f1(r.phi,3));
    h+=teleRow('Carga que se opone',f1(E.F,0)+' N');
    h+=teleRow('Rozamiento del cilindro',f1(E.Fr,0)+' N');
    h+=teleRow('Fuerza neta ΔF',f1(r.dF,0)+' N',cls2(r.dF>0));
    h+=teleRow('Caída P→A',f1(r.dpPA,1)+' bar');
    h+=teleRow('Caída B→T',f1(r.dpBT,1)+' bar');
    h+=teleRow('Presión en A / en B',f1(r.pA,1)+' / '+f1(r.pB,1)+' bar');
    h+=teleRow('Apertura de mando',f1(100*u,0)+' %');
    h+=teleRow('Velocidad que da la válvula',mms(vv));
    h+=teleRow('Tope de la bomba',mms(r.vb));
    h+=teleRow('Velocidad real',mms(vr),cls2(vr>=E.vReq-1e-12));
  }else if(mode==='rampa'){
    h+=teleRow('Rampa ordenada',f1(c.ramp,1)+' s');
    h+=teleRow('Tiempo propio de la válvula',f1(r.tv,3)+' s');
    h+=teleRow('Consigna de trabajo',f1(r.c0c,1)+' %',cls2(r.okZona));
    h+=teleRow('Apertura de trabajo',f1(r.u0,3));
    h+=teleRow('Velocidad ordenada',mms(r.v0));
    h+=teleRow('Tiempo muerto de salida',f1(r.tMuerto,3)+' s',cls2(r.tMuerto<=E.tdMax));
    h+=teleRow('Aceleración ordenada',f1(r.aRamp,3)+' m/s²');
    h+=teleRow('Arrastre del juego',f1(r.tHold,3)+' s');
    h+=teleRow('Velocidad de pico',mms(r.vPico)+(r.meseta?' (con meseta)':' (sin meseta)'));
    h+=teleRow('Tiempo de ciclo',f1(r.tCiclo,2)+' / '+f1(E.tMax,1)+' s',cls2(r.okCiclo));
    h+=teleRow('Dispersión de parada',mm(r.disp,3)+' / '+f1(E.tol,2)+' mm',cls2(r.okPos));
    h+=teleRow('Deceleración real',f1(r.aPico,2)+' m/s²');
    h+=teleRow('Presión de frenado',f1(r.pFren,1)+' bar',cls2(!r.cavita));
    h+=teleRow('Pico en la cámara de salida',f1(r.pPico,1)+' / '+f1(E.pLim,0)+' bar',cls2(r.okPico));
  }else if(mode==='proyecto'){
    const C=censo(c.est);
    h+=teleRow('Estación',E.nombre);
    h+=teleRow('Combinaciones ensayadas',f1(C.B.length,0));
    h+=teleRow('Combinaciones válidas',f1(C.V.length,0),cls2(C.V.length>0));
    h+=teleRow('Coste montado',f1(r.coste,0)+' u.');
    h+=teleRow('Coste mínimo viable',C.best?f1(C.best.coste,0)+' u.':'sin solución');
    h+=teleRow('Criterios cumplidos',f1(CRIT.length-r.fallos.length,0)+' / '+f1(CRIT.length,0),cls2(r.valida));
    const M=critMed(r,E);
    for(const k of CRIT) h+=teleRow(CRIT_ROT[k],M[k],cls2(r[k]));
    h+=teleRow('Coinciden con el óptimo',f1(empates(c.est).length,0)+' combinaciones');
  }else{
    const s=RETO.sol;
    h+=teleRow('Estación',E.nombre);
    h+=teleRow('Montaje',V.abr+' · '+DITH[c.dith].abr+' · '+f1(c.ramp,1)+' s · '+COMP_ROT[c.comp]);
    h+=teleRow('Coste del montaje',f1(r.coste,0)+' u.');
    h+=teleRow('Criterios cumplidos',f1(CRIT.length-r.fallos.length,0)+' / '+f1(CRIT.length,0),cls2(r.valida));
    h+=teleRow('Velocidad máxima',mms(r.vTop)+' ≥ '+mms(E.vReq,0),cls2(r.okVel));
    h+=teleRow('Zona de trabajo','c = '+f1(r.c0c,1)+' % · u = '+f1(r.u0,3),cls2(r.okZona));
    h+=teleRow('Arranque',f1(r.tMuerto,3)+' s · salto '+mms(r.vKick,2),cls2(r.okArr));
    h+=teleRow('Presión de pico',f1(r.pPico,1)+' / '+f1(E.pLim,0)+' bar',cls2(r.okPico));
    h+=teleRow('Tiempo de ciclo',f1(r.tCiclo,2)+' / '+f1(E.tMax,1)+' s',cls2(r.okCiclo));
    h+=teleRow('Dispersión de parada',mm(r.disp,3)+' / '+f1(E.tol,2)+' mm',cls2(r.okPos));
    h+=teleRow('Rizado',mm(r.rip,3)+' / '+f1(E.riz,3)+' mm',cls2(r.okRizo));
    h+=teleRow('Montajes válidos',f1(RETO.nval,0));
    h+=teleRow('Coste mínimo posible',s?f1(s.coste,0)+' u.':'sin solución');
  }
  el('tele').innerHTML=h;
}

// El informe explica el POR QUE de lo que se ve, con las cifras del propio
// punto de trabajo. Nunca repite un numero sin decir de donde sale.
function updateReport(){
  const c=cfgDe(mode), E=ESTACIONES[c.est], r=CUR, V=VALV[c.valv];
  let t='';
  if(mode==='consigna'){
    const cin=ST.consigna.cin;
    const us=uSub(cin<=0?1e-12:cin,r.bm,r.H,c.comp), ub=uBaj(cin<=0?1e-12:cin,r.bm,r.H,c.comp);
    t='> '+V.rot+': banda muerta '+f1(r.bm,1)+' % e histéresis de catálogo '+f1(V.h0,1)+' %.\n';
    t+=DITH[c.dith].a>0
      ? '> El dither de '+DITH[c.dith].rot+' llega a la corredera atenuado a '+
        pc1(gVal(DITH[c.dith].f,V.fv),0)+' (f_v = '+f1(V.fv,0)+' Hz): H baja a '+f1(r.H,2)+' %.\n'
      : '> Sin dither la histéresis se queda entera: H = '+f1(r.H,2)+' %.\n';
    t+='> Con '+COMP_ROT[c.comp]+', la consigna de '+f1(cin,0)+' % sale del amplificador como '+
       f1(cout(cin<=0?1e-12:cin,r.bm,c.comp),1)+' %.\n';
    t+=(ub-us)>1e-9
      ? '> Subiendo abre '+f1(us,3)+' y bajando '+f1(ub,3)+': la misma señal, dos aperturas. Ese Δu = '+
        f1(ub-us,3)+' es el juego.\n'
      : '> Aquí las dos ramas coinciden: la corredera está pegada a un tope, no porque no haya histéresis.\n';
    t+=r.uKick>0
      ? '> Ojo: a consigna 0⁺ la válvula ya está abierta '+f1(r.uKick,3)+' y la máquina sale de un salto a '+
        mms(r.vKick,2)+' (tope '+f1(E.vk,1)+' mm/s).\n'
      : '> Hasta el '+f1(r.cArr,1)+' % de consigna no pasa caudal: por eso el arranque tarda '+
        f1(r.tMuerto,3)+' s con la rampa de '+f1(c.ramp,1)+' s.\n';
    t+='> Compensar es mover el cero, no quitar el juego: el ancho H sigue ahí y se paga al parar.';
  }else if(mode==='carga'){
    const u=uMan(), vv=r.vmaxV*u, vr=Math.min(vv,r.vb);
    t='> '+E.nombre+': A_a = '+f1(r.Aa*1e4,2)+' cm², A_b = '+f1(r.Ab*1e4,2)+' cm², φ = '+f1(r.phi,3)+'.\n';
    t+='> Fuerza neta ΔF = p_S·A_a − p_T·A_b − F − F_r = '+f1(r.dF,0)+' N.\n';
    t+=r.dF>0
      ? '> Con la válvula al '+f1(100*u,0)+' %: v = k_v·u·√(ΔF/Ω) = '+mms(vv)+'.\n'
      : '> ΔF ≤ 0: con esta presión de alimentación el cilindro no arranca, abras lo que abras.\n';
    t+=vr<vv-1e-12
      ? '> Pero la bomba sólo da '+f1(E.qb,0)+' L/min: el tope real es '+mms(r.vb)+' y ahí se queda.\n'
      : '> La bomba da de sobra ('+mms(r.vb)+'), así que manda la válvula.\n';
    t+='> Δp_PA = ΔF·A_a²/Ω = '+f1(r.dpPA,1)+' bar y Δp_BT = ΔF·A_b²/Ω = '+f1(r.dpBT,1)+
       ' bar: su cociente es φ² = '+f1(r.phi*r.phi,3)+'.\n';
    t+='> Fíjate en lo que eso significa: p_A y p_B en régimen NO dependen de la válvula que montes.';
  }else if(mode==='rampa'){
    t='> Ordenas '+f1(c.ramp,1)+' s de rampa; la válvula tiene lo suyo, t_v = 0,35/f_v = '+f1(r.tv,3)+' s.\n';
    t+='> Para ir a '+mms(E.vReq,0)+' hace falta consigna '+f1(r.c0c,1)+' % (apertura '+f1(r.u0,3)+').\n';
    t+=r.tMuerto>1e-9
      ? '> La máquina no sale hasta el '+f1(r.cArr,1)+' % de señal: '+f1(r.tMuerto,3)+' s de tiempo muerto (tope '+
        f1(E.tdMax,2)+' s).\n'
      : '> Con '+COMP_ROT[c.comp]+' no hay tiempo muerto, pero el arranque es un escalón de '+mms(r.vKick,2)+'.\n';
    t+=r.meseta
      ? '> Hay meseta: acelera '+f1(r.tAcc,2)+' s, mantiene '+f1(r.tMes,2)+' s y frena '+f1(r.tDec,2)+' s.\n'
      : '> No llega a la meseta: la carrera se acaba antes y el pico se queda en '+mms(r.vPico)+'.\n';
    t+='> Al ordenar la parada, la corredera no se mueve hasta que la señal cambie H: '+f1(r.tHold,3)+
       ' s andando a '+mms(r.vPico)+'.\n';
    t+='> Eso más la cola de cierre da |Δs| = v·t_juego + v_res·t_v = '+mm(r.disp,3)+' (tolerancia '+
       f1(E.tol,2)+' mm).\n';
    t+=r.cavita
      ? '> La carga frena sola: la cámara motriz se queda sin aceite y cavita. El pico no es de presión, es de vacío.\n'
      : '> Frenar '+f1(E.m,0)+' kg a '+f1(r.aPico,2)+' m/s² pide '+f1(r.pFren,1)+' bar en la cámara de salida'+
        (r.okPico?'.\n':', por encima del límite de '+f1(E.pLim,0)+' bar.\n');
    t+='> Ciclo total '+f1(r.tCiclo,2)+' s frente a '+f1(E.tMax,1)+' s de tacto: '+(r.okCiclo?'entra.':'no entra.');
  }else if(mode==='proyecto'){
    const C=censo(c.est);
    t='> '+E.nombre+' · '+E.detalle+'.\n';
    t+='> Censo de '+f1(C.B.length,0)+' combinaciones: '+f1(C.V.length,0)+' válidas'+
       (C.best?' y la más barata cuesta '+f1(C.best.coste,0)+' u.\n':'; ninguna cumple los siete.\n');
    const solos=CRIT.filter(k=>C.solo[k]>0)
      .sort((a,b)=>C.solo[b]-C.solo[a]).slice(0,3)
      .map(k=>CRIT_ROT[k].toLowerCase()+' ('+f1(C.solo[k],0)+')');
    t+='> Criterios que tumban una combinación ellos solos: '+(solos.join(', ')||'ninguno')+'.\n';
    t+='> Montado ahora: '+V.abr+' · '+DITH[c.dith].abr+' · '+f1(c.ramp,1)+' s · '+COMP_ROT[c.comp]+
       ' → '+f1(r.coste,0)+' u.\n';
    t+=r.valida?'> Cumple los siete criterios.\n'
               :'> Falla: '+r.fallos.map(k=>CRIT_ROT[k].toLowerCase()).join(', ')+'.\n';
    t+='> Los siete se juzgan a la vez: arreglar uno moviendo un eje suele romper otro.';
  }else{
    const s=RETO.sol;
    t='> '+E.nombre+' · '+E.detalle+'.\n';
    t+='> Pide '+mms(E.vReq,0)+' con ciclo ≤ '+f1(E.tMax,1)+' s, |Δs| ≤ '+f1(E.tol,2)+' mm y p ≤ '+
       f1(E.pLim,0)+' bar.\n';
    t+='> Montado: '+V.abr+' · '+DITH[c.dith].abr+' · rampa '+f1(c.ramp,1)+' s · '+COMP_ROT[c.comp]+
       ' → '+f1(r.coste,0)+' u.\n';
    t+=r.valida?'> Cumple los siete criterios.\n'
               :'> Falla: '+r.fallos.map(k=>CRIT_ROT[k].toLowerCase()).join(', ')+'.\n';
    t+=RETO.msg?'> '+RETO.msg+'\n':'';
    t+='> De '+f1(RETO.nval,0)+' montajes válidos, el más barato cuesta '+(s?f1(s.coste,0)+' u.':'—')+'.';
  }
  el('report').textContent=t;
}

function refreshAll(){
  updateHW();
  drawBoard();
  updateTele();
  updateReport();
  updateHwRot();
}
// ===================== 13. RETO =====================
// El reto no compara contra una respuesta escrita a mano: resuelve las 450
// combinaciones de la estacion (6 valvulas x 5 dither x 5 rampas x 3
// compensaciones), se queda con las validas y de esas con la mas barata,
// desempatando por ciclo, dispersion y presion de pico.
const CRIT_POR={
  okVel:'de nada sirve afinar si la válvula no da la velocidad que pide la máquina',
  okZona:'si la consigna cae dentro de la banda muerta, el mando no manda',
  okArr:'la banda muerta se cruza a ciegas: ni tarde ni de un salto',
  okPico:'al cerrar, la inercia comprime el aceite y esa punta la paga el sello',
  okCiclo:'la máquina tiene un tiempo de ciclo comprometido',
  okPos:'lo que se recorre después de dar la orden de parar es error de posición',
  okRizo:'el dither que cura la histéresis mete temblor en el vástago' };
function retoSolveBuild(reset){
  const est=ST.reto.est;
  RETO.sol=solucion(est);
  RETO.nval=validas(est).length;
  if(reset){
    RETO.cfg=startCfg(est);
    RETO.ejes={};
    RETO.resuelto=false;
    RETO.msg='';
  }
}
function updateRetoSpec(){
  const est=ST.reto.est, E=ESTACIONES[est], lim=CRIT_LIM(E);
  let h='<b>'+E.nombre+' · '+E.detalle+'.</b> Monta el eje <b>válido más barato</b>: elige válvula, dither, rampa y compensación. ';
  h+='Recorrido de '+f1(E.L,0)+' mm con '+f1(E.pS,0)+' bar de central. Los siete criterios se juzgan juntos:';
  h+='<ul style="margin:6px 0 0 16px;padding:0">';
  CRIT.forEach(k=>{ h+='<li><b>'+CRIT_ROT[k]+'</b> ('+lim[k]+') — '+CRIT_POR[k]+'</li>'; });
  h+='</ul>';
  h+='<div style="margin-top:6px;color:var(--muted)">De las 450 combinaciones de esta estación, '+
     f1(RETO.nval,0)+' cumplen las siete. Empate de precio: gana el ciclo más corto, luego la parada más precisa, luego el pico más bajo.</div>';
  el('retoSpec').innerHTML=h;
}
// Explica por que la configuracion puesta no vale, mirando eje por eje.
function retoExplain(r,c,est){
  if(r.valida) return '';
  const E=ESTACIONES[est];
  const fal=r.fallos.map(k=>CRIT_ROT[k].toLowerCase()).join(', ');
  let p='Falla '+fal+'. ';
  if(!r.okVel) p+=(r.dF<=0
      ? 'Con '+f1(E.pS,0)+' bar la fuerza neta es '+f1(r.dF,0)+' N: el vástago ni se mueve, y eso no lo arregla ninguna válvula. '
      : 'A tope de corredera da '+f1(r.vTop*1000,1)+' mm/s y la máquina pide '+f1(E.vReq*1000,0)+
        ': hace falta más caudal nominal, no más mando. ');
  else if(!r.okZona) p+='La consigna de régimen cae en '+f1(r.c0c,1)+' % con u = '+f1(r.u0,3)+
    ', y esta válvula tiene '+f1(r.bm,1)+' % de banda muerta: sobra caudal, así que el mando trabaja pegado al solape. Una válvula más pequeña abre más para la misma velocidad. ';
  else if(!r.okArr) p+=(r.tMuerto>E.tdMax
      ? 'Tarda '+f1(r.tMuerto,3)+' s en cruzar la banda muerta y el tope son '+f1(E.tdMax,2)+
        ' s: acorta la rampa o baja el solape con dither. '
      : 'Al salir del solape pega un salto de '+f1(r.vKick*1000,2)+' mm/s y el tope son '+f1(E.vk,1)+
        ': la rampa es demasiado rápida para tanta banda muerta. ');
  else if(!r.okPico) p+='Frenar '+f1(E.m,0)+' kg en '+f1(r.tDec,2)+' s exige '+f1(r.aDec,3)+
    ' m/s² y la punta llega a '+f1(r.pPico,1)+' bar frente a '+f1(E.pLim,0)+': alarga la rampa. ';
  else if(!r.okCiclo) p+='El ciclo sale en '+f1(r.tCiclo,2)+' s y el techo son '+f1(E.tMax,1)+
    ' s: '+f1(r.tAcc+r.tDec,2)+' s se van en las dos rampas. ';
  else if(!r.okPos) p+='Después de la orden de parar todavía recorre '+f1(r.disp*1000,3)+
    ' mm y la tolerancia es '+f1(E.tol,2)+': la rampa larga y la histéresis de '+f1(r.H,2)+
    ' % son las dos que empujan ese error. ';
  else if(!r.okRizo) p+='El dither imprime '+f1(r.rip*1000,3)+' mm de temblor y el acabado admite '+
    f1(E.riz,3)+': baja la amplitud o sube la frecuencia. ';
  return p;
}
function checkReto(){
  const est=ST.reto.est, c=RETO.cfg, s=RETO.sol;
  const r=punto(est,c.valv,c.dith,c.ramp,c.comp);
  if(!s){
    RETO.msg='Esta estación no tiene ninguna combinación válida en el catálogo.';
    RETO.resuelto=false;
  }else if(r.valida && r.coste===s.coste && Math.abs(r.tCiclo-s.tCiclo)<1e-9 &&
           Math.abs(r.disp-s.disp)<1e-12 && Math.abs(r.pPico-s.pPico)<1e-9){
    RETO.resuelto=true; solved=true;
    RETO.msg='Correcto: coste '+f1(r.coste,0)+', ciclo '+f1(r.tCiclo,2)+' s y parada con '+
      f1(r.disp*1000,3)+' mm de dispersión, el mínimo de las '+f1(RETO.nval,0)+' válidas.';
    synth.beep(880,0.10,0.06);
    showToast('✅ <b>Eje óptimo.</b> '+VALV[c.valv].rot+' · '+DITH[c.dith].rot+' · rampa '+
      f1(c.ramp,1)+' s · '+COMP_ROT[c.comp]+'.');
  }else if(r.valida){
    RETO.resuelto=false;
    RETO.msg=(r.coste===s.coste)
      ? 'Válido y al precio mínimo, pero '+(r.tCiclo>s.tCiclo+1e-9
          ? 'tarda '+f1(r.tCiclo,2)+' s por ciclo y hay otro igual de barato con '+f1(s.tCiclo,2)+'.'
          : 'para con '+f1(r.disp*1000,3)+' mm de dispersión y hay otro igual de barato con '+f1(s.disp*1000,3)+'.')
      : 'Válido, pero no es el más barato: coste '+f1(r.coste,0)+' frente a '+f1(s.coste,0)+'.';
    synth.beep(520,0.09,0.05);
    showToast('🟡 <b>Cumple, pero no es el óptimo.</b> '+RETO.msg);
  }else{
    RETO.resuelto=false;
    RETO.msg=retoExplain(r,c,est);
    synth.beep(240,0.12,0.05);
    showToast('❌ <b>No cumple.</b> '+RETO.msg);
  }
  computa();
  refreshAll();
}
// ===================== 14. CUESTIONARIO =====================
const QUIZ={
  consigna:{pregunta:'La NG10 de 24 L/min tiene 6,5 % de histéresis y 15 Hz de ancho de banda. Con dither del 12 % a 40 Hz la histéresis efectiva baja a 3,08 %, pero con el 3 % a 180 Hz apenas baja a 6,30 %. ¿Por qué el dither rápido casi no sirve en esta válvula?',
    opciones:[
      {t:'Porque la corredera tiene que seguir físicamente el temblor: a 180 Hz sobre una válvula de 15 Hz la respuesta se atenúa a 0,083 y los 3 % de orden se quedan en 0,25 % de movimiento real',ok:true,why:'El dither sólo despega el vástago del sello si de verdad se mueve. La atenuación es 1/√(1+(f/f_v)²): a 40 Hz vale 0,351 y quedan 4,21 % efectivos; a 180 Hz vale 0,083 y quedan 0,25 %. Por eso el dither se elige contra el ancho de banda de la válvula que tienes, no contra la teoría.'},
      {t:'Porque a 180 Hz el aceite ya no tiene tiempo de atravesar el orificio de mando',ok:false,why:'El aceite atraviesa el canto en microsegundos. Lo lento no es el fluido: es la masa de la corredera con su muelle y su solenoide, y eso es lo que mide f_v.'},
      {t:'Porque el dither de 180 Hz lleva cuatro veces menos amplitud y la histéresis sólo depende de la amplitud ordenada',ok:false,why:'La amplitud ordenada baja de 12 a 3 (×4), pero la efectiva baja de 4,21 a 0,25 (×17). Las otras cuatro veces las pone la atenuación de la válvula.'},
      {t:'Porque por encima de 100 Hz el dither excita la resonancia del cilindro y hay que quitarlo',ok:false,why:'Un dither que la corredera no reproduce tampoco puede excitar nada aguas abajo. Aquí el problema no es que llegue de más, es que no llega.'}]},
  carga:{pregunta:'En el carro de transferencia, cambiar la NG6 de 4 L/min por la NG16 de 60 sube la velocidad de 92,6 a 320,8 mm/s, pero p_A se queda clavada en 38,7 bar y p_B en 48,9. ¿Por qué el reparto de presiones no se entera del cambio de válvula?',
    opciones:[
      {t:'Porque el reparto sale de Δp_PA = ΔF·A_a²/Ω y Δp_BT = ΔF·A_b²/Ω: sólo entran la fuerza neta y las dos áreas. La válvula fija el caudal, y con él la velocidad',ok:true,why:'Ésta es la separación que hay que interiorizar: la carga fija las presiones, la válvula fija la velocidad. Por eso Δp_PA/Δp_BT = φ² = 2,20 en el carro pase lo que pase con el catálogo.'},
      {t:'Porque las dos válvulas comparten el mismo Δp nominal de 5 bar por canto',ok:false,why:'Ese dato fija la ganancia de caudal, no el reparto. La servoválvula de 40 L/min a 35 bar por canto tiene otro nominal y da exactamente los mismos 38,7 y 48,9 bar.'},
      {t:'Porque a esas velocidades la caída en la válvula es despreciable frente a la carga',ok:false,why:'Al contrario: entre los dos cantos se pierden 147,2 bar de los 140 de central. La caída es enorme; lo que pasa es que se reparte siempre en la misma proporción.'},
      {t:'Porque p_B no puede ser mayor que p_A y el modelo satura las dos presiones',ok:false,why:'p_B sí puede ser mayor, y aquí lo es: es la intensificación del cilindro diferencial. La corona es menor, así que para tragar el mismo caudal necesita más presión que la que empuja el pistón.'}]},
  rampa:{pregunta:'En el carro, la rampa de 0,1 s revienta la presión de frenado (141 bar frente a los 120 del grupo) y la de 2,5 s se sale de tolerancia con 29,8 mm de dispersión; sólo la de 0,3 s vale, con 3,82 mm. ¿Por qué la rampa lenta empeora la precisión de parada en vez de mejorarla?',
    opciones:[
      {t:'Porque al dar la orden de parar el mando todavía tiene que atravesar la histéresis, y con la rampa lenta tarda 8,4 veces más; mientras la atraviesa el vástago sigue casi a velocidad de meseta',ok:true,why:'t_hold = (H/pendiente) crece proporcional a la rampa: 11,8 ms con 0,3 s y 98,6 ms con 2,5 s. La velocidad de meseta no cambia, así que el recorrido perdido se multiplica igual: 3,82 → 29,85 mm.'},
      {t:'Porque la rampa lenta deja más tiempo para que la inercia del carro arrastre el vástago',ok:false,why:'La inercia manda en la punta de presión, no en la dispersión: aquí el vástago no se va de más porque le empuje la masa, sino porque todavía le están mandando caudal.'},
      {t:'Porque con la rampa lenta la velocidad de meseta es mayor y hay más carrera que descontar',ok:false,why:'La meseta es la misma en las cinco rampas: la fija la apertura de régimen, no la pendiente. Comprueba la telemetría cambiando sólo la rampa.'},
      {t:'Porque la rampa lenta obliga a abrir más la válvula para llegar a tiempo',ok:false,why:'La consigna de régimen no se toca. Lo único que cambia es cuánto tarda el mando en subir hasta ella y en volver a bajar.'}]},
  proyecto:{pregunta:'De las 2 250 combinaciones del censo (5 estaciones × 450 ejes) sólo 475 cumplen los siete criterios. La precisión de parada la fallan 1 098, y 391 de ellas no fallan nada más. ¿Qué te dice ese 391?',
    opciones:[
      {t:'Que la precisión de parada es la restricción que manda: hay 391 ejes que ya cumplen los otros seis y se caen sólo por ahí, así que es donde renta gastar el esfuerzo',ok:true,why:'Es la lectura de un censo: no interesa cuántos fallan un criterio, interesa cuántos fallan sólo ése. Arreglar la parada convertiría 391 ejes en válidos y casi duplicaría el catálogo útil, de 475 a 866.'},
      {t:'Que arreglando la precisión de parada las 1 098 pasarían a ser válidas',ok:false,why:'Sólo 391. Las otras 707 fallan además otra cosa: llegarían a la parada correcta sin llegar a la velocidad, al tiempo de ciclo o a la presión.'},
      {t:'Que la precisión de parada es el criterio más fácil, porque es el único que se falla en solitario',ok:false,why:'Es el más difícil: lo falla casi la mitad del censo. Y no es el único que se falla solo — el arranque limpio se falla solo 93 veces y la zona de trabajo 82.'},
      {t:'Que la tolerancia de parada está mal puesta y habría que relajarla para tener más opciones',ok:false,why:'La tolerancia la impone la máquina, no el catálogo. Un censo sirve para elegir hierro dentro de la especificación, no para negociar la especificación.'}]},
  reto:{pregunta:'En la prensa hay un eje válido que cierra el ciclo en 2,06 s, cuarenta milésimas más rápido que el que el reto da por bueno (2,10 s). ¿Por qué no es ése la respuesta?',
    opciones:[
      {t:'Porque la primera clave del orden declarado es el coste: la NG16 vale 14 y la NG10 vale 9. El tiempo sólo desempata entre montajes que cuestan lo mismo',ok:true,why:'Un criterio de selección se declara antes de barrer, no después. Aquí es coste → ciclo → dispersión → pico, y 40 ms no compran cinco unidades de coste. Si el ciclo fuera lo primero, el reto pediría otra cosa y la respuesta sería otra.'},
      {t:'Porque ese eje incumple alguno de los siete criterios',ok:false,why:'Los cumple todos: por eso está en la lista de válidos. Lo que pasa es que cuesta más.'},
      {t:'Porque el tiempo de ciclo no es un objetivo de este laboratorio',ok:false,why:'Lo es dos veces: como criterio duro (t ≤ 3,4 s en la prensa) y como segunda clave del desempate. Simplemente no es la primera.'},
      {t:'Porque el reto pide siempre la válvula más pequeña que cumpla',ok:false,why:'No: pide la más barata de las que cumplen. En la plataforma elevadora la más pequeña, la NG6 de 4 L/min, no llega a la velocidad y no aparece en ningún montaje válido.'}]},
};
let QORD=[], answered=false;
function buildQuiz(){
  const q=QUIZ[mode];
  QORD=q.opciones.map((o,i)=>i);
  for(let i=QORD.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=QORD[i];QORD[i]=QORD[j];QORD[j]=t; }
  answered=false;
}
function clearDx(){ answered=false; }
function refreshQuestion(){
  const q=QUIZ[mode];
  el('q_text').textContent=q.pregunta;
  el('dxbtns').innerHTML=QORD.map((oi,i)=>'<button class="b" data-i="'+i+'">'+q.opciones[oi].t+'</button>').join('');
  el('dxbtns').querySelectorAll('[data-i]').forEach(b=>{
    b.onclick=()=>answer(Number(b.getAttribute('data-i')));
  });
}
function answer(i){
  if(answered) return;
  answered=true;
  const q=QUIZ[mode], btns=el('dxbtns').querySelectorAll('[data-i]');
  btns.forEach((b,k)=>{
    b.disabled=true;
    const o=q.opciones[QORD[k]];
    if(o.ok) b.classList.add('right');
    else if(k===i) b.classList.add('wrong');
  });
  const o=q.opciones[QORD[i]];
  synth.beep(o.ok?880:200,0.10,0.05);
  showToast((o.ok?'✅ ':'❌ ')+o.why);
}
function quizCorrectIndex(){ return QORD.indexOf(QUIZ[mode].opciones.findIndex(o=>o.ok)); }
// ===================== 15. SELECCIÓN Y ETIQUETAS =====================
const PICK_INFO={
  central:()=>{const E=estAct();
    return ['Central hidráulica','Grupo de '+f1(E.pS,0)+' bar y '+f1(E.qb,0)+
      ' L/min con la válvula de máxima tarada en '+f1(E.pLim,0)+
      ' bar. Ese caudal es un techo duro: por muy grande que sea la proporcional, el vástago no pasa de '+
      f1(CUR.vb*1000,1)+' mm/s. El retorno vuelve al depósito a '+f1(P_T,0)+' bar.'];},
  valvula:()=>{const c=cfgDe(mode), V=VALV[c.valv];
    return ['Válvula proporcional '+V.rot,f1(V.qn,0)+' L/min a '+f1(V.dpn,0)+
      ' bar por canto, es decir una ganancia de '+f1(kv(V)*Math.sqrt(1e5)*60000,2)+
      ' L/min por cada √bar de caída. Banda muerta '+f1(V.bm,1)+' %, histéresis de catálogo '+
      f1(V.h0,1)+' % y ancho de banda '+f1(V.fv,0)+' Hz. Con el dither montado la histéresis efectiva queda en '+
      f1(CUR.H,2)+' %. Ahora trabaja al '+f1(100*CUR.u0,1)+' % de corredera y deja pasar '+
      f1(CUR.v0*CUR.Aa*60000,1)+' L/min.'];},
  tarjeta:()=>{const c=cfgDe(mode);
    return ['Tarjeta amplificadora','Rampa de '+f1(c.ramp,1)+' s de 0 a 100 % (pendiente '+
      f1(CUR.ps,1)+' %/s), '+DITH[c.dith].rot+' y curva '+COMP_ROT[c.comp]+
      '. La rampa es lo único que puedes cambiar sin tocar hierro, y decide a la vez la punta de presión al frenar ('+
      f1(CUR.pPico,1)+' bar) y la dispersión de parada ('+f1(CUR.disp*1000,3)+
      ' mm). La corredera no sigue la orden al instante: le añade '+f1(CUR.tv,3)+' s de retardo propio.'];},
  cilindro:()=>{const E=estAct();
    return ['Cilindro diferencial','Ø '+f1(E.dp,0)+' de pistón y Ø '+f1(E.dv,0)+
      ' de vástago: A_a = '+f1(CUR.Aa*1e6,0)+' mm² y A_b = '+f1(CUR.Ab*1e6,0)+
      ' mm², relación φ = '+f1(CUR.phi,3)+'. Carrera de '+f1(E.L,0)+
      ' mm. Esa φ es la que reparte la caída entre los dos cantos de la válvula en proporción φ² = '+
      f1(CUR.phi*CUR.phi,3)+', y no cambia por mucho que cambies de válvula.'];},
  carga:()=>{const E=estAct();
    return ['La máquina accionada',E.nombre+' · '+E.detalle+'. Opone '+f1(E.F,0)+
      ' N de proceso y '+f1(E.Fr,0)+' N de rozamiento sobre '+f1(E.m,0)+
      ' kg de masa móvil, y pide '+f1(E.vReq*1000,0)+' mm/s. La fuerza neta que queda para mover aceite es ΔF = '+
      f1(CUR.dF,0)+' N'+(E.F<0?': aquí la carga tira del vástago en vez de frenarlo, y por eso ΔF es mayor que la fuerza de la central.':'.')];},
  manoA:()=>{const E=estAct();
    return ['Manómetro p_A','Cámara del pistón: '+f1(CUR.pA,1)+' bar. La central da '+f1(E.pS,0)+
      ' y el canto P→A se come Δp_PA = ΔF·A_a²/Ω = '+f1(CUR.dpPA,1)+
      ' bar. Fíjate en que ahí no aparece la válvula: cambia el catálogo y esta aguja no se mueve.'];},
  manoB:()=>['Manómetro p_B','Cámara anular: '+f1(CUR.pB,1)+' bar, con Δp_BT = ΔF·A_b²/Ω = '+
    f1(CUR.dpBT,1)+' bar hasta el tanque. '+(CUR.pB>CUR.pA
      ? 'Está por encima de p_A: es la intensificación del cilindro diferencial, la corona tiene que apretar más para tragar el mismo caudal por menos sección.'
      : 'Queda por debajo de p_A, que es el caso cómodo: la carga es lo bastante grande como para dominar el reparto.')],
  escala:()=>{const E=estAct();
    return ['Escala de carrera','El vástago va por el '+f1(100*(hw.frac||0),0)+
      ' % de los '+f1(E.L,0)+' mm. Al dar la orden de parar todavía recorre '+f1(CUR.disp*1000,3)+
      ' mm y la tolerancia de la máquina es '+f1(E.tol,2)+' mm. El dither, además, deja un temblor de '+
      f1(CUR.rip*1000,3)+' mm sobre el techo de '+f1(E.riz,3)+'.'];},
};
function boardClick(){
  showToast('<b>'+MODE_META[mode].nombre+'.</b> '+MODE_META[mode].mision);
}
pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  const o=hit&&hit.object; if(!o) return;
  if(o===bmesh){ boardClick(); return; }
  let n=o, k=null;
  while(n && !k){ k=n.userData&&n.userData.pick; n=n.parent; }
  if(!k || !PICK_INFO[k]) return;
  const inf=PICK_INFO[k]();
  synth.beep(760,0.05,0.05);
  showToast('<b>'+inf[0]+'</b> · '+inf[1]);
});
// Las etiquetas flotan al pasar por encima. Raycaster.intersectObjects comprueba
// la visibilidad de los objetos que le pasas y de sus hijos, pero NO la de sus
// padres: hay que filtrar a mano subiendo por la jerarquia.
(function(){
  const ray=new THREE.Raycaster(), ndc=new THREE.Vector2(), dom=S.renderer.domElement;
  let dentro=false;
  dom.addEventListener('pointermove',e=>{
    const r=dom.getBoundingClientRect();
    ndc.x=((e.clientX-r.left)/r.width)*2-1;
    ndc.y=-((e.clientY-r.top)/r.height)*2+1;
    dentro=true;
  });
  dom.addEventListener('pointerleave',()=>{dentro=false;});
  (function tick(){
    requestAnimationFrame(tick);
    if(!dentro){ HOVER_LABELS.forEach(sp=>{sp.visible=false;}); return; }
    const vis=[...HOVER_LABELS.keys()].filter(o=>{
      let p=o; while(p){ if(!p.visible) return false; p=p.parent; } return true;
    });
    ray.setFromCamera(ndc,S.camera);
    const hits=ray.intersectObjects(vis,true);
    let ganador=null;
    if(hits.length){
      let n=hits[0].object;
      while(n && !ganador){ if(HOVER_LABELS.has(n)) ganador=n; n=n.parent; }
    }
    HOVER_LABELS.forEach((sp,o)=>{ sp.visible=(o===ganador); });
  })();
})();
// ===================== 16. RECORRIDO GUIADO =====================
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const b=el('btnAuto'), rot=b.textContent;
  b.textContent='⏳ Recorriendo…';
  synth.init(); synth.resume(); clearDx();
  try{
    // --- 1. banda muerta e histeresis ---
    setMode('consigna');
    ST.consigna.est='prensa'; ST.consigna.valv='p24'; ST.consigna.dith='off';
    ST.consigna.comp='no'; ST.consigna.cin=10; afterEdit();
    showToast('Una proporcional no es una llave de paso. Con la consigna al '+
      f1(ST.consigna.cin,0)+' % la corredera de esta NG10 todavía está dentro de sus '+
      f1(CUR.bm,1)+' % de banda muerta: la orden existe y el caudal no. Salida u = '+
      f1(uSub(ST.consigna.cin,CUR.bm,CUR.H,ST.consigna.comp),3)+'.');
    await sleep(5000);
    ST.consigna.cin=60; afterEdit();
    const uS=uSub(60,CUR.bm,CUR.H,ST.consigna.comp), uB=uBaj(60,CUR.bm,CUR.H,ST.consigna.comp);
    showToast('Al 60 % ya manda: subiendo abre u = '+f1(uS,3)+' y bajando u = '+
      f1(uB,3)+' para la misma consigna. Esa diferencia de '+f1(uB-uS,3)+
      ' es la histéresis: la corredera no vuelve por donde fue.');
    await sleep(5400);
    ST.consigna.dith='d40'; afterEdit();
    const hDith=CUR.H;
    showToast('Dither: '+DITH.d40.rot+' de temblor superpuesto al mando. La histéresis efectiva cae de '+
      f1(VALV.p24.h0,1)+' % a '+f1(hDith,2)+' %, porque la corredera vibra y nunca llega a agarrarse.');
    await sleep(5200);
    ST.consigna.dith='d180'; afterEdit();
    showToast('El mismo truco a 180 Hz apenas deja '+f1(CUR.H,2)+
      ' %: esta válvula tiene '+f1(VALV.p24.fv,0)+' Hz de ancho de banda y a 180 Hz sólo reproduce el 8 % de lo que le mandas. El dither se elige contra el hierro, no contra el papel.');
    await sleep(5600);
    ST.consigna.valv='r24'; ST.consigna.dith='off'; afterEdit();
    showToast('Y así se compra el problema resuelto: la NG10 realimentada tiene '+
      f1(VALV.r24.bm,1)+' % de banda muerta y '+f1(VALV.r24.h0,1)+
      ' % de histéresis, contra '+f1(VALV.p24.bm,1)+' y '+f1(VALV.p24.h0,1)+
      '. Cuesta '+f1(VALV.r24.coste,0)+' en vez de '+f1(VALV.p24.coste,0)+'.');
    await sleep(5600);

    // --- 2. la carga manda en las presiones ---
    setMode('carga');
    ST.carga.est='carro'; ST.carga.valv='p04'; ST.carga.u=1.00; afterEdit();
    const vChica=CUR.vTop, pA0=CUR.pA, pB0=CUR.pB;
    showToast('Carro de transferencia, corredera a tope. Con la NG6 de '+f1(VALV.p04.qn,0)+
      ' L/min el vástago da '+f1(vChica*1000,1)+' mm/s, y las cámaras están a '+
      f1(pA0,1)+' y '+f1(pB0,1)+' bar.');
    await sleep(5000);
    ST.carga.valv='p60'; afterEdit();
    showToast('Cambio a la NG16 de '+f1(VALV.p60.qn,0)+' L/min: la velocidad sube a '+
      f1(CUR.vTop*1000,1)+' mm/s (ya la limita la bomba) y las presiones siguen en '+
      f1(CUR.pA,1)+' y '+f1(CUR.pB,1)+' bar. Ni un bar. La válvula manda en el caudal; la carga, en la presión.');
    await sleep(5800);
    showToast('El reparto sale de Δp_PA = ΔF·A_a²/Ω y Δp_BT = ΔF·A_b²/Ω, así que su razón es φ² = '+
      f1(CUR.phi*CUR.phi,3)+' pase lo que pase. Fíjate en que p_B ('+f1(CUR.pB,1)+
      ') está por encima de p_A ('+f1(CUR.pA,1)+'): eso es la intensificación del cilindro diferencial.');
    await sleep(6000);
    ST.carga.est='elevad'; afterEdit();
    showToast('La plataforma elevadora baja con '+f1(Math.abs(ESTACIONES.elevad.F),0)+
      ' N de peso tirando del vástago: la carga ayuda en vez de estorbar y ΔF sube a '+
      f1(CUR.dF,0)+' N. Una carga que arrastra es la que de verdad necesita control.');
    await sleep(5400);

    // --- 3. la rampa, entre el pico y la parada ---
    setMode('rampa');
    ST.rampa.est='carro'; ST.rampa.valv='p24'; ST.rampa.dith='d40';
    ST.rampa.comp='si'; ST.rampa.ramp=0.1; afterEdit();
    showToast('Rampa de '+f1(ST.rampa.ramp,1)+' s. Para con '+f1(CUR.disp*1000,2)+
      ' mm de dispersión, precioso... pero frenar '+f1(ESTACIONES.carro.m,0)+
      ' kg tan deprisa levanta una punta de '+f1(CUR.pPico,1)+' bar contra un grupo de '+
      f1(ESTACIONES.carro.pLim,0)+'. No vale.');
    await sleep(5800);
    ST.rampa.ramp=2.5; afterEdit();
    showToast('Al otro extremo, '+f1(ST.rampa.ramp,1)+' s: la punta baja a '+f1(CUR.pPico,1)+
      ' bar, pero la parada se va a '+f1(CUR.disp*1000,2)+' mm y la tolerancia son '+
      f1(ESTACIONES.carro.tol,1)+'. La rampa lenta NO afina la parada: la estropea.');
    await sleep(5800);
    showToast('El motivo está en t_hold = '+f1(CUR.tHold*1000,1)+
      ' ms: al ordenar el paro, el mando todavía tiene que atravesar la histéresis, y con rampa lenta tarda más. Mientras la cruza, el vástago sigue a velocidad de meseta.');
    await sleep(5800);
    ST.rampa.ramp=0.3; afterEdit();
    showToast('La ventana está en '+f1(ST.rampa.ramp,1)+' s: '+f1(CUR.pPico,1)+
      ' bar de pico, '+f1(CUR.disp*1000,2)+' mm de parada y '+f1(CUR.tCiclo,2)+
      ' s de ciclo. Los siete criterios a la vez, y sólo una rampa de las cinco lo consigue.');
    await sleep(5600);

    // --- 4. el censo ---
    setMode('proyecto');
    ST.proyecto.est='prensa'; afterEdit();
    const CP=censo('prensa');
    showToast('Cambio de oficio: en vez de tocar mandos, se barren las '+f1(CP.B.length,0)+
      ' combinaciones de la prensa. Sólo '+f1(CP.V.length,0)+' cumplen los siete criterios.');
    await sleep(5200);
    showToast('Y lo que hay que mirar no es cuántas fallan cada criterio, sino cuántas fallan SÓLO ése: la precisión de parada tumba '+
      f1(CP.solo.okPos,0)+' montajes que ya cumplían todo lo demás. Ahí es donde renta gastar.');
    await sleep(5800);
    const sp=solucion('prensa');
    if(sp){
      ST.proyecto.valv=sp.valv; ST.proyecto.dith=sp.dith;
      ST.proyecto.ramp=sp.ramp; ST.proyecto.comp=sp.comp; afterEdit();
      showToast('El más barato de los válidos: '+VALV[sp.valv].rot+', '+DITH[sp.dith].rot+
        ', rampa de '+f1(sp.ramp,1)+' s y curva '+COMP_ROT[sp.comp]+'. Coste '+f1(sp.coste,0)+
        ', ciclo '+f1(sp.tCiclo,2)+' s, parada '+f1(sp.disp*1000,3)+' mm.');
      await sleep(5600);
    }

    // --- 5. reto ---
    setMode('reto'); ST.reto.est='prensa'; retoSolveBuild(true); afterEdit();
    showToast('Reto: misma prensa, montaje de partida equivocado en los cuatro ejes. De las '+
      f1(VALV_KEYS.length*DITH_KEYS.length*RAMPAS.length*COMPS.length,0)+
      ' combinaciones, '+f1(RETO.nval,0)+' valen y una sola es la más barata.');
    await sleep(5000);
    checkReto();
    await sleep(3400);
    const s=RETO.sol;
    if(s){
      RETO.cfg={valv:s.valv,dith:s.dith,ramp:s.ramp,comp:s.comp}; afterEdit();
      checkReto();
      await sleep(1600);
      showToast('Hay un eje válido que cierra el ciclo en 2,06 s, más rápido que estos '+
        f1(s.tCiclo,2)+' s, pero monta una NG16 que cuesta '+f1(VALV.p60.coste,0)+
        ' en vez de '+f1(VALV[s.valv].coste,0)+'. El criterio se declara antes de barrer: coste, y luego el tiempo.');
      await sleep(5600);
    }
    answer(quizCorrectIndex());
  } finally {
    autoRunning=false;
    el('btnAuto').textContent=rot;
  }
}
// ===================== 17. ANIMACIÓN, EVENTOS Y ARRANQUE =====================
// El vastago no se mueve a una velocidad de adorno: recorre el mismo perfil que
// calculo el motor (banda muerta, rampa, meseta y frenado), y si el montaje no
// es fisico el conjunto se queda quieto. Una maquina imposible no puede verse
// funcionando.
S.setAnimate((dt,tGlob)=>{
  animT+=dt;
  colocaHW(Math.min(dt,0.05));
});

MODES.forEach(m=>{ el('m_'+m).onclick=()=>{ if(!autoRunning) setMode(m); }; });
el('btnAuto').onclick=()=>{ if(!autoRunning) runAuto(); };
el('btnNew').onclick=()=>{ if(autoRunning) return; newSignal(); };
el('btnCheck').onclick=()=>{ if(autoRunning) return; checkReto(); };
const soundBtn=el('soundBtn');
if(soundBtn){ soundBtn.onclick=()=>{ synth.toggle(); soundBtn.textContent=synth.isOn()?'🔊':'🔇'; }; }
document.addEventListener('pointerdown',()=>{ synth.init(); synth.resume(); },{once:true});

retoSolveBuild(true); buildQuiz(); computa(); updateHW(); drawBoard(); S.start(); setMode('consigna');

// ===================== 18. PUENTE DE PRUEBAS =====================
// Superficie estable para las pruebas automatizadas: expone el motor de calculo
// y el estado de cada modo sin tocar el DOM.
window.__labDebug={
  mode:()=>mode,
  setMode,
  modes:()=>MODES.slice(),
  // --- constantes del dominio ---
  DPN_DEF, J_EXC, A_REF, H_MIN_F, U_MIN, C_MIN, G_RISE, P_T, RHO,
  VALV, VALV_KEYS, DITH, DITH_KEYS, RAMPAS, COMPS, COMP_ROT,
  EJES, CRIT, CRIT_ROT, CRIT_POR, CRIT_LIM, ESTACIONES, EST_KEYS, CINS,
  // --- motor de calculo ---
  clamp, area, geo, fuerzaNeta, kv, vLibre, vBomba, presiones, cout, pendSal,
  gNom, uSub, uBaj, gVal, histEfect, rizado, punto, barrido, validas, mejorQue,
  solucion, empates, ejeSolC, okEje, startCfg, censo, critMed, perfil, f1, pc1,
  // --- estado vivo ---
  animT:()=>animT,
  setAnimT:v=>{animT=v;},
  hw:()=>({...hw}),
  cfg:()=>({...cfgDe(mode)}),
  cur:()=>CUR,
  solved:()=>solved,
  // --- un par por modo ---
  consignaGet:()=>({est:ST.consigna.est, valv:ST.consigna.valv, dith:ST.consigna.dith,
    comp:ST.consigna.comp, cin:ST.consigna.cin}),
  consignaSet:(est,valv,dith,comp,cin)=>{
    if(est)ST.consigna.est=est; if(valv)ST.consigna.valv=valv; if(dith)ST.consigna.dith=dith;
    if(comp)ST.consigna.comp=comp; if(cin!==undefined&&cin!==null)ST.consigna.cin=Number(cin);
    afterEdit(); },
  cargaGet:()=>({est:ST.carga.est, valv:ST.carga.valv, dith:ST.carga.dith,
    comp:ST.carga.comp, u:ST.carga.u}),
  cargaSet:(est,valv,u)=>{
    if(est)ST.carga.est=est; if(valv)ST.carga.valv=valv;
    if(u!==undefined&&u!==null)ST.carga.u=Number(u);
    afterEdit(); },
  rampaGet:()=>({est:ST.rampa.est, valv:ST.rampa.valv, dith:ST.rampa.dith,
    ramp:ST.rampa.ramp, comp:ST.rampa.comp}),
  rampaSet:(est,valv,dith,ramp,comp)=>{
    if(est)ST.rampa.est=est; if(valv)ST.rampa.valv=valv; if(dith)ST.rampa.dith=dith;
    if(ramp!==undefined&&ramp!==null)ST.rampa.ramp=Number(ramp); if(comp)ST.rampa.comp=comp;
    afterEdit(); },
  proyectoGet:()=>({est:ST.proyecto.est, valv:ST.proyecto.valv, dith:ST.proyecto.dith,
    ramp:ST.proyecto.ramp, comp:ST.proyecto.comp}),
  proyectoSet:(est,valv,dith,ramp,comp)=>{
    if(est)ST.proyecto.est=est; if(valv)ST.proyecto.valv=valv; if(dith)ST.proyecto.dith=dith;
    if(ramp!==undefined&&ramp!==null)ST.proyecto.ramp=Number(ramp); if(comp)ST.proyecto.comp=comp;
    afterEdit(); },
  // --- reto ---
  retoGet:()=>({est:ST.reto.est, ...RETO.cfg, resuelto:RETO.resuelto, msg:RETO.msg,
    nval:RETO.nval, sol:RETO.sol?{valv:RETO.sol.valv, dith:RETO.sol.dith, ramp:RETO.sol.ramp,
    comp:RETO.sol.comp, coste:RETO.sol.coste, tCiclo:RETO.sol.tCiclo, disp:RETO.sol.disp,
    pPico:RETO.sol.pPico}:null, ejes:{...RETO.ejes}}),
  retoSet:(valv,dith,ramp,comp)=>{
    if(valv)RETO.cfg.valv=valv; if(dith)RETO.cfg.dith=dith;
    if(ramp!==undefined&&ramp!==null)RETO.cfg.ramp=Number(ramp); if(comp)RETO.cfg.comp=comp;
    RETO.msg=''; RETO.resuelto=false; afterEdit();
  },
  retoEst:e=>{ ST.reto.est=e; retoSolveBuild(true); afterEdit(); },
  check:()=>checkReto(),
  pista:()=>pista(),
  newSignal,
  // --- cuestionario y recorrido ---
  quizPregunta:()=>QUIZ[mode].pregunta,
  quizOpciones:()=>QORD.map(i=>QUIZ[mode].opciones[i].t),
  quizCorrectIndex,
  answer,
  answered:()=>answered,
  runAuto,
  autoRunning:()=>autoRunning,
};
// __END__
