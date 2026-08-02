/* ============================================================
   LAB — d4-12 · Válvula de contrabalance: control de cargas negativas
   Molde S: cinco modos, sin ensamble.

   Lo que el alumno decide, en cuatro ejes:
     · relación de pilotaje R   (1,5 · 3 · 4,5 · 8 · 10)
     · tarado de la válvula     (70 · 105 · 140 · 210 · 280 bar)
     · drenaje del muelle       (interno · balanceado · ventilado)
     · montaje de la válvula    (en bloque · manguera corta · brida sobre el actuador)

   Los seis criterios que se juzgan a la vez:
     S  sujecion  tarado >= 1,3 x presion inducida por la carga
     F  fuga      deriva en 10 min por debajo de la tolerancia de la estacion
     A  apertura  la valvula abre, con margen sobre el tarado del grupo, y pMot > 0
     P  presion   ni la camara motriz ni la resistente pasan del limite del actuador
     E  estabilidad  margen sobre la frontera de Routh: R*Amot*Vres < Ares*Vmot
     T  termico   el calor disipado cabe en lo que la estacion puede evacuar

   Ref: ISO 4413 · ISO 1219-1 · ISO 3448 · ASTM D341 · ISO 6020-2 · NFPA/T2.6.1
   ============================================================ */

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[6.4,3.6,7.6],target:[1.10,1.30,0.10],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.40,minD:3.2,maxD:22});
const {scene}=S;
const synth=makeSynth({type:'triangle',type2:'sine',filterFreq:1400,Q:0.90});
const el=id=>document.getElementById(id);

// ===================== 2. MOTOR =====================
// MOTOR d4-12 - Contrabalance: control de cargas negativas
// Unidades: presion bar (relativa), area mm2, fuerza N, caudal L/min,
// velocidad mm/s, volumen cm3, potencia kW, temperatura C, masa kg.
// Comentarios en ASCII. Los textos que ve el alumno llevan acentos, pero
// eso pasa fuera de este bloque.
const BETA = 1.4e9;        // Pa, modulo volumetrico EFECTIVO (aceite con aire arrastrado)
const OV_NOM = 12;         // bar de sobrepresion de la contrabalance a caudal nominal
const Q_NOM = 60;          // L/min, caudal nominal de la valvula
const QF_REF = 0.30;       // cm3/min de fuga por asiento al 80 % del tarado y 40 C
const KF = Math.log(10) / 0.2;   // 11.5129: x10 de fuga entre el 80 % y el 100 % del tarado
const T_FUGA_REF = 40;     // C, temperatura del dato de catalogo de fuga
const K_SUJ = 1.3;         // tarado minimo = 1,3 x presion inducida
const MARG_AB = 10;        // bar de margen entre la presion motriz y el tarado del grupo
const ME_MIN = 1.15;       // margen exigido sobre la frontera de Routh
const D_RES = 12;          // mm, diametro interior de la linea actuador-contrabalance
const ALFA_RHO = 0.00065, T_REF_RHO = 15, WAL_C = 0.7;
const T_WAL_MIN = -20, T_WAL_MAX = 120;
const ACEITE = { v40: 46, v100: 6.8, rho15: 875 };   // ISO VG 46 (ISO 3448)

const _W = v => Math.log10(Math.log10(v + WAL_C));
const WAL_B = (_W(ACEITE.v40) - _W(ACEITE.v100)) / (Math.log10(373.15) - Math.log10(313.15));
const WAL_A = _W(ACEITE.v40) + WAL_B * Math.log10(313.15);
function nuT(T){ return Math.pow(10, Math.pow(10, WAL_A - WAL_B*Math.log10(T+273.15))) - WAL_C; }
function rhoT(T){ return ACEITE.rho15*(1 - ALFA_RHO*(T - T_REF_RHO)); }
function muT(T){ return nuT(T)*1e-6*rhoT(T); }
function extrapola(T){ return T < T_WAL_MIN || T > T_WAL_MAX; }

// ---------- ejes de decision ----------
const RATIOS = [1.5, 3, 4.5, 8, 10];          // relacion de pilotaje
const TARADOS = [70, 105, 140, 210, 280];     // bar
const DRENES = { int:{fbp:null, coste:0}, bal:{fbp:1, coste:3}, vent:{fbp:0, coste:5} };
const MONTAJES = { bloque:{L:3.5, coste:0}, corta:{L:0.8, coste:4}, brida:{L:0.05, coste:7} };
const COSTE_R = { 1.5:14, 3:11, 4.5:10, 8:9, 10:9 };
const R_KEYS = RATIOS.slice();
const DREN_KEYS = Object.keys(DRENES);
const MONT_KEYS = Object.keys(MONTAJES);
const EJES = ['ratio','tarado','dren','mont'];

// factor por el que la contrapresion se suma al tarado
function fbp(drenK, R){ const d = DRENES[drenK]; return d.fbp === null ? 1 + R : d.fbp; }

// volumen de una manguera: d en mm, L en m -> cm3
function volMang(dMm, Lm){ return Math.PI*dMm*dMm*Lm/4; }

// ---------- estaciones ----------
function mkEst(o){
  if(o.tipo === 'mot'){
    // area equivalente de un motor con reduccion: p[bar]*Aeq[mm2]/10 = F[N]
    const aeq = o.disp*o.red/(2*Math.PI*o.rTam);
    return {...o, amot:aeq, ares:aeq, vCamMot:o.vInt, vCamRes:o.vInt};
  }
  const ap = Math.PI*o.dInt*o.dInt/4;
  const aa = ap - Math.PI*o.dVas*o.dVas/4;
  const amot = o.camMot === 'p' ? ap : aa;
  const ares = o.camMot === 'p' ? aa : ap;
  return {...o, ap, aa, amot, ares, vCamMot:amot*o.carrera/2/1000, vCamRes:ares*o.carrera/2/1000};
}

const ESTACIONES = {
  pluma: mkEst({ nom:'Pluma de grúa articulada', tipo:'cil', dInt:125, dVas:70, carrera:700,
    camMot:'a', F:68000, masa:6900, qb:30, pLim:250, pMaxCil:250, pBp:6, T:45,
    Lmot:14, dMot:20, Pdis:6.0, horas:900, tolDer:4.0 }),
  tijera: mkEst({ nom:'Plataforma de tijera', tipo:'cil', dInt:100, dVas:56, carrera:800,
    camMot:'a', F:38000, masa:3900, qb:24, pLim:210, pMaxCil:250, pBp:10, T:40,
    Lmot:8, dMot:16, Pdis:3.5, horas:1400, tolDer:8.0 }),
  volquete: mkEst({ nom:'Caja basculante de volquete', tipo:'cil', dInt:160, dVas:110, carrera:1200,
    camMot:'a', F:95000, masa:9700, qb:40, pLim:250, pMaxCil:250, pBp:12, T:50,
    Lmot:20, dMot:20, Pdis:8.0, horas:300, tolDer:20.0 }),
  prensa: mkEst({ nom:'Prensa vertical de bajada controlada', tipo:'cil', dInt:125, dVas:70, carrera:400,
    camMot:'p', F:42000, masa:4300, qb:20, pLim:250, pMaxCil:160, pBp:5, T:65,
    Lmot:12, dMot:16, Pdis:2.6, horas:3000, tolDer:0.30 }),
  cabrestante: mkEst({ nom:'Cabrestante de motor hidráulico', tipo:'mot', disp:250, red:10, rTam:0.25,
    vInt:300, F:22000, masa:2250, qb:20, pLim:250, pMaxCil:210, pBp:15, T:45,
    Lmot:8, dMot:16, Pdis:7.5, horas:1200, tolDer:15.0 }),
};
const EST_KEYS = Object.keys(ESTACIONES);

// ---------- punto de trabajo del descenso ----------
function pInducida(estK){ const E = ESTACIONES[estK]; return 10*E.F/E.ares; }

function punto(estK, R, tarado, drenK, montK){
  const E = ESTACIONES[estK];
  const pInd = pInducida(estK);
  const v = E.qb*1e6/60/E.amot;                 // mm/s
  const qRes = E.qb*E.ares/E.amot;              // L/min por la contrabalance
  const dpOv = OV_NOM*qRes/Q_NOM;               // sobrepresion por caudal
  const F_bp = fbp(drenK, R);
  const pEff = tarado + F_bp*E.pBp + dpOv;      // presion que hay que vencer
  const pMot = (pEff - pInd)*E.ares/(E.amot + R*E.ares);
  const pRes = pMot*E.amot/E.ares + pInd;
  const noAbre = pMot > E.pLim - MARG_AB;
  const sinTarado = pEff <= pInd;               // la valvula no sujeta: ya esta abierta
  const pCalor = E.qb*Math.max(0,pMot)/600 + E.F*v/1e6;
  const pCbv = qRes*Math.max(0, pRes - E.pBp)/600;   // la que se tira EN la contrabalance
  return { estK, R, tarado, drenK, montK, pInd, v, qRes, dpOv, F_bp, pEff, pMot, pRes,
    noAbre, sinTarado, pCalor, pCbv, kWh:pCalor*E.horas };
}

// ---------- sujecion en reposo: fuga por el asiento ----------
function fuga(estK, tarado){
  const E = ESTACIONES[estK];
  const ratio = pInducida(estK)/tarado;                       // sin contrapresion: no hay caudal
  const q = QF_REF*Math.exp(KF*(ratio - 0.8))*(muT(T_FUGA_REF)/muT(E.T));   // cm3/min
  const vDer = q*1000/E.ares;                                  // mm/min
  // Por encima del 100 % del tarado la valvula ya no fuga: esta ABIERTA. El ajuste
  // exponencial de catalogo solo tiene sentido por debajo de ese punto.
  return { ratio, q, vDer, der10:vDer*10, abierta: ratio >= 1 };
}

// ---------- estabilidad: Routh-Hurwitz del sistema linealizado ----------
// Estados: presion resistente, presion motriz, velocidad. Caudal de alimentacion
// constante, sin rozamiento y sin fuga de la direccional. El polinomio caracteristico
// sale s^3 + c2 s^2 + c1 s + c0 y la condicion c2*c1 > c0 se reduce EXACTAMENTE a
//    a*Ares > b*R*Amot,  con a = beta/Vres y b = beta/Vmot,
// es decir  R * Amot * Vres < Ares * Vmot.  Ni la masa ni la ganancia de la valvula
// aparecen en la condicion.
function volumenes(estK, montK){
  const E = ESTACIONES[estK];
  const vRes = E.vCamRes + volMang(D_RES, MONTAJES[montK].L);
  const vMot = E.vCamMot + volMang(E.dMot, E.Lmot);
  return { vRes, vMot };
}
function margenEstab(estK, R, montK){
  const E = ESTACIONES[estK];
  const { vRes, vMot } = volumenes(estK, montK);
  return (E.ares*vMot)/(R*E.amot*vRes);
}
// Coeficientes del polinomio, para comprobar el criterio contra las raices de verdad.
function poli(estK, R, montK, K, masa){
  const E = ESTACIONES[estK];
  const { vRes, vMot } = volumenes(estK, montK);
  const a = BETA/(vRes*1e-6), b = BETA/(vMot*1e-6);
  const Ar = E.ares*1e-6, Am = E.amot*1e-6;
  const c2 = a*K;
  const c1 = (b*Am*Am + a*Ar*Ar)/masa;
  const c0 = a*K*b*Am*(Am + R*Ar)/masa;
  return { c2, c1, c0, routh: c2*c1 - c0 };
}
// Raices reales/complejas de s^3 + c2 s^2 + c1 s + c0 (Cardano/trigonometrico).
function raices(c2, c1, c0){
  const p = c1 - c2*c2/3, q = 2*c2*c2*c2/27 - c2*c1/3 + c0;
  const disc = q*q/4 + p*p*p/27;
  const sh = -c2/3;
  if(disc > 0){
    const s = Math.cbrt(-q/2 + Math.sqrt(disc)), t = Math.cbrt(-q/2 - Math.sqrt(disc));
    const r1 = s + t + sh;                       // real
    const re = -(s + t)/2 + sh, im = Math.sqrt(3)/2*(s - t);
    return [{re:r1, im:0}, {re, im}, {re, im:-im}];
  }
  const m = 2*Math.sqrt(-p/3);
  const th = Math.acos(3*q/(p*m))/3;
  return [0,1,2].map(k => ({ re: m*Math.cos(th - 2*Math.PI*k/3) + sh, im:0 }));
}

// ---------- evaluacion completa ----------
const CRIT = ['okSujecion','okFuga','okApertura','okPresion','okEstab','okTermico'];
const CRIT_LET = { okSujecion:'S', okFuga:'F', okApertura:'A', okPresion:'P', okEstab:'E', okTermico:'T' };

function evalua(estK, R, tarado, drenK, montK){
  const E = ESTACIONES[estK];
  const pt = punto(estK, R, tarado, drenK, montK);
  const fg = fuga(estK, tarado);
  const me = margenEstab(estK, R, montK);
  const okSujecion = tarado >= K_SUJ*pt.pInd;
  const okFuga     = fg.der10 <= E.tolDer;
  const okApertura = !pt.sinTarado && !pt.noAbre && pt.pMot > 0;
  const okPresion  = pt.pRes <= E.pMaxCil && pt.pMot <= E.pMaxCil;
  const okEstab    = me >= ME_MIN;
  const okTermico  = pt.pCalor <= E.Pdis;
  const res = { okSujecion, okFuga, okApertura, okPresion, okEstab, okTermico };
  const fallos = CRIT.filter(c => !res[c]);
  return { estK, R, tarado, drenK, montK, ...res, fallos, valido:fallos.length===0,
    primero:fallos[0]||null, me, ...pt, ...fg, tolDer:E.tolDer, Pdis:E.Pdis,
    coste: COSTE_R[R] + DRENES[drenK].coste + MONTAJES[montK].coste };
}

/** Barrido de una estacion: 5 R x 5 tarados x 3 drenes x 3 montajes = 225. */
function barrido(estK){
  const r = [];
  for(const R of RATIOS) for(const t of TARADOS) for(const d of DREN_KEYS) for(const m of MONT_KEYS)
    r.push(evalua(estK, R, t, d, m));
  return r;
}
// Orden LEXICOGRAFICO declarado: primero el coste del conjunto valvula+drenaje+montaje,
// y a igualdad de coste la menor potencia disipada. El tarado no cuesta dinero, asi que
// solo el segundo criterio puede separarlo: por eso el orden se declara al alumno.
function mejorQue(a, b){ return (a.coste - b.coste) || (a.pCalor - b.pCalor); }
function optimo(estK){
  const val = barrido(estK).filter(x => x.valido);
  if(!val.length) return null;
  val.sort(mejorQue);
  const best = val[0];
  return { best, validas:val.length,
    empates:val.filter(x => x.coste===best.coste).length,                       // igual coste
    empatesTot:val.filter(x => mejorQue(x,best)===0).length, todas:val };       // igual coste Y calor
}

// ---------- reto: cuatro ejes ----------
const EJE_VAL = { ratio:RATIOS, tarado:TARADOS, dren:DREN_KEYS, mont:MONT_KEYS };
const EJE_ROT = { ratio:'Relación de pilotaje', tarado:'Tarado de la contrabalance',
  dren:'Drenaje del muelle', mont:'Montaje de la válvula' };

function validas(estK){ const o = optimo(estK); return o ? o.todas : []; }
function costeMin(estK){ const o = optimo(estK); return o ? o.best.coste : null; }
function solucion(estK){ const o = optimo(estK); if(!o) return null;
  const b = o.best; return { ratio:b.R, tarado:b.tarado, dren:b.drenK, mont:b.montK }; }
function evalC(estK, c){ return evalua(estK, c.ratio, c.tarado, c.dren, c.mont); }
/** Un eje esta resuelto cuando, partiendo de la solucion, ese valor da EL optimo. */
function okEje(estK, eje, val){
  const s = solucion(estK); if(!s) return false;
  const o = optimo(estK);
  const r = evalC(estK, { ...s, [eje]:val });
  return r.valido && mejorQue(r, o.best) === 0;
}
/** Valores del eje que dan una configuracion VALIDA aunque no sea la optima. */
function ejeValidos(estK, eje){
  const s = solucion(estK); if(!s) return [];
  return EJE_VAL[eje].filter(v => evalC(estK, { ...s, [eje]:v }).valido);
}
function ejeSol(estK, eje){ return EJE_VAL[eje].filter(v => okEje(estK, eje, v)); }
function startCfg(estK){
  const o = solucion(estK);
  for(const R of RATIOS) for(const t of TARADOS) for(const d of DREN_KEYS) for(const m of MONT_KEYS){
    const c = { ratio:R, tarado:t, dren:d, mont:m };
    if(c.ratio!==o.ratio && c.tarado!==o.tarado && c.dren!==o.dren && c.mont!==o.mont) return c;
  }
  return { ratio:RATIOS[0], tarado:TARADOS[0], dren:DREN_KEYS[0], mont:MONT_KEYS[0] };
}

// ---- memoizacion: el barrido de 225 configuraciones se pide muchas veces por cuadro ----
const _mEval={}, _evaluaRaw=evalua;
evalua=function(estK,R,tarado,drenK,montK){
  const k=estK+'|'+R+'|'+tarado+'|'+drenK+'|'+montK;
  if(!(k in _mEval)) _mEval[k]=_evaluaRaw(estK,R,tarado,drenK,montK);
  return _mEval[k];
};
const _memo1=f=>{const m={};return k=>{if(!(k in m))m[k]=f(k);return m[k];};};
const _optimoRaw=optimo; optimo=_memo1(_optimoRaw);
const _mEje={};
function ejeSolC(estK,eje){const k=estK+'|'+eje;if(!(k in _mEje))_mEje[k]=ejeSol(estK,eje);return _mEje[k];}
const _mEjeV={};
function ejeValC(estK,eje){const k=estK+'|'+eje;if(!(k in _mEjeV))_mEjeV[k]=ejeValidos(estK,eje);return _mEjeV[k];}

// ---- formato sellado: coma decimal y separador fino de millares ----
const NBSP=String.fromCharCode(0x202F);
function f1(x, d){
  if(!isFinite(x)) return '—';
  const dd = (d === undefined) ? 1 : d;
  const s = Math.abs(x).toFixed(dd);
  const ent = s.split('.')[0], dec = s.split('.')[1] || '';
  let out = '';
  for(let i = 0; i < ent.length; i++){
    if(i > 0 && (ent.length - i) % 3 === 0) out += NBSP;
    out += ent[i];
  }
  return (x < 0 ? '-' : '') + out + (dd > 0 ? ',' + dec : '');
}
const pc1 = x => isFinite(x) ? f1(x*100,1)+' %' : '—';

// ---- rotulos de los ejes y de los criterios ----
const R_ROT   = { 1.5:'1,5 : 1', 3:'3 : 1', 4.5:'4,5 : 1', 8:'8 : 1', 10:'10 : 1' };
const DREN_ROT= { int:'Interno', bal:'Balanceado', vent:'Ventilado' };
const DREN_SUB= { int:'el muelle ve la contrapresión multiplicada por (R+1)',
                  bal:'la contrapresión se suma una sola vez',
                  vent:'el muelle drena al tanque: la contrapresión no lo afecta' };
const MONT_ROT= { bloque:'En bloque de mando', corta:'Manguera corta', brida:'Brida sobre el actuador' };
const MONT_SUB= { bloque:'3,5 m de línea entre el actuador y la válvula',
                  corta:'0,8 m de línea',
                  brida:'0,05 m: la válvula va atornillada al actuador' };
const CRIT_ROT= { okSujecion:'Sujeción en reposo', okFuga:'Deriva por fuga', okApertura:'Apertura',
                  okPresion:'Presión en el actuador', okEstab:'Estabilidad', okTermico:'Térmico' };
const CRIT_POR= {
  okSujecion:'el tarado debe llegar a 1,3 veces la presión que induce la carga',
  okFuga:'el asiento gotea y el actuador se desploma poco a poco',
  okApertura:'la válvula no abre o pide más presión de la que da el grupo',
  okPresion:'la contrabalance intensifica la presión en la cámara resistente',
  okEstab:'R·A_mot·V_res debe quedar por debajo de A_res·V_mot',
  okTermico:'todo lo que estrangula la válvula acaba en calor' };
const EST_SUB = { pluma:'Carga suspendida en voladizo', tijera:'Personas a bordo, bajada lenta',
  volquete:'Volteo de gran carrera y mucho caudal', prensa:'Bajada fina y aceite caliente',
  cabrestante:'Motor giratorio: dos cámaras iguales' };

// ===================== 3. ESTADO =====================
const MODES=['induc','descenso','pilotaje','estab','reto'];
let mode='induc';
const ST={
  induc:    { est:'pluma',       tarado:105 },
  descenso: { est:'pluma',       ratio:1.5, tarado:105, dren:'int' },
  pilotaje: { est:'pluma',       ratio:8,   tarado:105, dren:'int' },
  estab:    { est:'pluma',       ratio:3,   mont:'corta' },
  reto:     { est:'pluma' },
};
const RETO={ cfg:{ratio:1.5,tarado:70,dren:'int',mont:'bloque'}, sol:null, hechos:[], resuelto:false, msg:'', ejes:{} };
let CUR=null;               // resultado de evalua() de la configuracion visible
let hw={};                  // estado geometrico de la maquina para el 3D
let animT=0;                // fase de la animacion de descenso
let autoRunning=false;
let solved=false;           // el reto se ha cerrado al menos una vez

/** Completa los cuatro ejes a partir del modo activo. */
function cfgDe(m){
  const s=ST[m];
  if(m==='induc')    return { est:s.est, ratio:1.5, tarado:s.tarado, dren:'vent', mont:'corta' };
  if(m==='descenso') return { est:s.est, ratio:s.ratio, tarado:s.tarado, dren:s.dren, mont:'corta' };
  if(m==='pilotaje') return { est:s.est, ratio:s.ratio, tarado:s.tarado, dren:s.dren, mont:'corta' };
  if(m==='estab'){ const o=solucion(s.est); return { est:s.est, ratio:s.ratio, tarado:o.tarado, dren:o.dren, mont:s.mont }; }
  return { est:ST.reto.est, ...RETO.cfg };
}
function estAct(){ return cfgDe(mode).est; }

function computa(){
  const c=cfgDe(mode);
  CUR=evalua(c.est, c.ratio, c.tarado, c.dren, c.mont);
  return CUR;
}

// ===================== 4. MATERIALES =====================
const AZUL='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A',
      VIO='#C08CF8', GRIS='#8f97a5', NARANJA='#F2A65A', VERDE='#7CD992';
const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const brush=b=>new THREE.MeshStandardMaterial({color:b,roughness:0.34,metalness:0.86});
const MAT={
  base:   std('#161b24',0.92,0.05),
  bancada:std('#1d2430',0.80,0.20),
  acero:  brush('#8d97a6'),
  acero2: brush('#6f7887'),
  crom:   new THREE.MeshStandardMaterial({color:'#c9d3e0',roughness:0.14,metalness:0.98}),
  tanque: std('#22303f',0.62,0.35),
  motor:  std('#2c3a4d',0.55,0.45),
  bomba:  brush('#7a8391'),
  valv:   std('#3a4557',0.48,0.55),
  valvOn: new THREE.MeshStandardMaterial({color:'#2f6f4a',roughness:0.42,metalness:0.45,emissive:'#123a24',emissiveIntensity:0.55}),
  cbal:   std('#4a3a2a',0.50,0.55),
  muelle: brush('#b9a06a'),
  carga:  std('#3b2f3f',0.72,0.25),
  cable:  std('#2a2f38',0.85,0.30),
  tubo:   std('#39465a',0.42,0.62),
  tuboP:  new THREE.MeshStandardMaterial({color:'#C08CF8',roughness:0.38,metalness:0.55,emissive:'#3a1d55',emissiveIntensity:0.35}),
  tuboT:  std('#2f4a3a',0.50,0.45),
  aceite: new THREE.MeshStandardMaterial({color:'#F2A65A',roughness:0.30,metalness:0.10,emissive:'#7a4410',emissiveIntensity:0.85}),
  aceiteA:new THREE.MeshStandardMaterial({color:'#ff6b6b',roughness:0.30,metalness:0.10,emissive:'#7a1414',emissiveIntensity:0.95}),
  vidrio: new THREE.MeshStandardMaterial({color:'#cfe3ff',roughness:0.06,metalness:0.02,transparent:true,opacity:0.24}),
  panel:  std('#10161f',0.86,0.10),
};

// ===================== 5. PIZARRON =====================
const board=new THREE.Group();
board.position.set(-2.95,0,-0.55); board.rotation.y=0.42; scene.add(board);
(function(){
  const marco=roundedBox(3.90,2.94,0.10,std('#0b0f16',0.90,0.10),0.05);
  marco.position.set(0,1.86,0); board.add(marco);
  const pata=(x)=>{ const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.42,14),MAT.acero2);
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
  for(let x=0;x<BW;x+=64){ bx.beginPath(); bx.moveTo(x,0); bx.lineTo(x,BH); bx.stroke(); }
  for(let y=0;y<BH;y+=64){ bx.beginPath(); bx.moveTo(0,y); bx.lineTo(BW,y); bx.stroke(); }
}
function texto(t,x,y,col,size,align,weight){
  bx.fillStyle=col||'#dbe4f0';
  bx.font=(weight||'600')+' '+(size||18)+'px ui-sans-serif,system-ui,sans-serif';
  bx.textAlign=align||'left'; bx.textBaseline='alphabetic';
  bx.fillText(t,x,y);
}
function linea(x1,y1,x2,y2,col,w,dash){
  bx.save(); bx.strokeStyle=col||'#2b3446'; bx.lineWidth=w||1.5;
  if(dash) bx.setLineDash(dash);
  bx.beginPath(); bx.moveTo(x1,y1); bx.lineTo(x2,y2); bx.stroke(); bx.restore();
}
function curva(pts,col,w,dash){
  if(!pts.length) return;
  bx.save(); bx.strokeStyle=col; bx.lineWidth=w||2.2;
  if(dash) bx.setLineDash(dash);
  bx.beginPath(); bx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) bx.lineTo(pts[i][0],pts[i][1]);
  bx.stroke(); bx.restore();
}
function wrapText(t,x,y,maxW,lh,col,size){
  bx.fillStyle=col||'#9fb0c6';
  bx.font='500 '+(size||15)+'px ui-sans-serif,system-ui,sans-serif';
  bx.textAlign='left'; bx.textBaseline='alphabetic';
  const words=String(t).split(' '); let ln='', yy=y;
  for(const w of words){
    const test=ln?ln+' '+w:w;
    if(bx.measureText(test).width>maxW && ln){ bx.fillText(ln,x,yy); ln=w; yy+=lh||19; }
    else ln=test;
  }
  if(ln) bx.fillText(ln,x,yy);
  return yy;
}
const PX={x:706,y:70,w:300};
function rpanel(h){
  bx.fillStyle='rgba(13,18,26,0.92)'; bx.strokeStyle='rgba(138,180,248,0.20)'; bx.lineWidth=1.5;
  bx.beginPath(); bx.roundRect(PX.x,PX.y,PX.w,h,12); bx.fill(); bx.stroke();
}
function prow(y,k,v,col){
  texto(k,PX.x+16,y,'#8f9bb0',14,'left','500');
  texto(v,PX.x+PX.w-16,y,col||'#e8eef8',15,'right','700');
}
function title2(t,sub){
  texto(t,44,52,'#e8eef8',26,'left','800');
  if(sub) texto(sub,44,78,'#8f9bb0',15,'left','500');
}
function nota(t,y){ wrapText(t,44,y,620,19,'#8f9bb0',14); }
function hbar(x,y,w,h,frac,col,bgc){
  bx.fillStyle=bgc||'rgba(255,255,255,0.07)';
  bx.beginPath(); bx.roundRect(x,y,w,h,h/2); bx.fill();
  const ww=Math.max(0,Math.min(1,frac))*w;
  if(ww>0.5){ bx.fillStyle=col; bx.beginPath(); bx.roundRect(x,y,ww,h,h/2); bx.fill(); }
}
function marca(x,y,ok){
  bx.save(); bx.strokeStyle=ok?OK_HEX:BAD_HEX; bx.lineWidth=2.6; bx.beginPath();
  if(ok){ bx.moveTo(x-5,y); bx.lineTo(x-1,y+5); bx.lineTo(x+6,y-6); }
  else { bx.moveTo(x-5,y-5); bx.lineTo(x+5,y+5); bx.moveTo(x+5,y-5); bx.lineTo(x-5,y+5); }
  bx.stroke(); bx.restore();
}
const colOk=b=>b?OK_HEX:BAD_HEX;
function tabla(x,y,cols,rows,anchos,colFn){
  let yy=y;
  cols.forEach((c,i)=>texto(c,x+anchos.slice(0,i).reduce((a,b)=>a+b,0),yy,'#7d8798',13,'left','700'));
  linea(x,yy+8,x+anchos.reduce((a,b)=>a+b,0)-10,yy+8,'rgba(138,180,248,0.18)',1);
  yy+=28;
  rows.forEach((r,ri)=>{
    r.forEach((c,i)=>texto(String(c),x+anchos.slice(0,i).reduce((a,b)=>a+b,0),yy,
      (colFn?colFn(ri,i):null)||'#dbe4f0',14,'left', i===0?'700':'500'));
    yy+=24;
  });
  return yy;
}

// =============== 6. VISTAS DEL PIZARRON ===============

// ---------- 6.1 presion inducida y sujecion en reposo ----------
function drawInduc(){
  const c=cfgDe('induc'), E=ESTACIONES[c.est], r=CUR;
  title2('Presión inducida y sujeción en reposo',
    'La carga fija la presión. El tarado se elige DESPUÉS, con margen sobre ella.');

  texto('p_ind = 10 · F / A_res   ·   tarado mínimo = 1,3 · p_ind',44,118,AZUL,16,'left','700');
  const x0=250, wB=300, esc=wB/150;
  let y=150;
  for(const k of EST_KEYS){
    const pi=pInducida(k), act=(k===c.est);
    texto(ESTACIONES[k].nom,44,y+5,act?'#e8eef8':'#7d8798',13,'left',act?'800':'500');
    hbar(x0,y-9,wB,14,pi/150,act?NARANJA:'rgba(242,166,90,0.35)');
    const xm=x0+K_SUJ*pi*esc;
    linea(xm,y-14,xm,y+9,act?VIO:'rgba(192,140,248,0.35)',2.2);
    texto(f1(pi,1),x0+wB+12,y+5,act?NARANJA:'#7d8798',13,'left','700');
    texto(f1(K_SUJ*pi,1),x0+wB+66,y+5,act?VIO:'#6b7688',13,'left','700');
    y+=30;
  }
  texto('bar',x0+wB+12,y+2,'#7d8798',11,'left','600');
  texto('mín.',x0+wB+66,y+2,'#7d8798',11,'left','600');
  texto('◼ presión inducida por la carga',44,y+2,NARANJA,12,'left','600');
  texto('▮ tarado mínimo exigido',260,y+2,VIO,12,'left','600');

  // tabla de deriva por fuga del asiento
  texto('Deriva en reposo: el asiento gotea y el actuador se cae solo',44,342,AZUL,16,'left','700');
  const rows=TARADOS.map(t=>{
    const g=fuga(c.est,t);
    return [f1(t,0)+' bar', pc1(g.ratio),
      g.abierta?'abierta':f1(g.q,3), g.abierta?'—':f1(g.der10,3),
      t>=K_SUJ*pInducida(c.est)?'sujeta':'se cae',
      g.abierta?'—':(g.der10<=E.tolDer?'dentro':'fuera')];
  });
  tabla(44,378,['Tarado','p_ind / tarado','Fuga cm³/min','Deriva 10 min mm','Sujeción','Deriva'],
    rows,[110,130,130,150,90,90],(ri,ci)=>{
      const t=TARADOS[ri], g=fuga(c.est,t);
      if(t===c.tarado && ci===0) return WARN_HEX;
      if(ci===4) return colOk(t>=K_SUJ*pInducida(c.est));
      if(ci===5) return g.abierta?GRIS:colOk(g.der10<=E.tolDer);
      return null;
    });
  texto('Tolerancia de esta estación: '+f1(E.tolDer,2)+' mm en 10 min',44,548,'#9fb0c6',14,'left','600');
  nota('Por encima del 100 % del tarado la válvula ya no gotea: está ABIERTA, y el ajuste '+
    'exponencial de catálogo deja de tener sentido. Por eso esas casillas no llevan número. '+
    'La fuga se corrige con la viscosidad del aceite a la temperatura de la estación ('+
    f1(E.T,0)+' °C): μ(40 °C)/μ(T) = '+f1(muT(T_FUGA_REF)/muT(E.T),3)+'.',592);

  rpanel(320);
  prow(PX.y+34,'Estación',E.nom.length>22?E.nom.slice(0,21)+'…':E.nom,'#e8eef8');
  prow(PX.y+62,'Carga F',f1(E.F/1000,1)+' kN');
  prow(PX.y+90,'Área resistente',f1(E.ares,0)+' mm²');
  prow(PX.y+118,'Presión inducida',f1(r.pInd,1)+' bar',NARANJA);
  prow(PX.y+146,'Tarado mínimo',f1(K_SUJ*r.pInd,1)+' bar',VIO);
  prow(PX.y+174,'Tarado elegido',f1(c.tarado,0)+' bar',colOk(r.okSujecion));
  prow(PX.y+202,'p_ind / tarado',pc1(r.ratio));
  prow(PX.y+230,'Fuga',r.abierta?'válvula abierta':f1(r.q,3)+' cm³/min',r.abierta?BAD_HEX:null);
  prow(PX.y+258,'Deriva 10 min',r.abierta?'—':f1(r.der10,3)+' mm',r.abierta?GRIS:colOk(r.okFuga));
  prow(PX.y+286,'Sujeción · Deriva',(r.okSujecion?'✓':'✗')+'  ·  '+(r.okFuga?'✓':'✗'),
    colOk(r.okSujecion&&r.okFuga));
}

// ---------- 6.2 punto de trabajo del descenso ----------
function drawDescenso(){
  const c=cfgDe('descenso'), E=ESTACIONES[c.est], r=CUR;
  title2('Punto de trabajo del descenso',
    'El carrete se equilibra: p_res + R · p_mot = p_eff. De ahí sale todo lo demás.');

  // equilibrio del carrete
  texto('Equilibrio del carrete',44,120,AZUL,16,'left','700');
  const bx0=44, bw=620, tot=Math.max(r.pEff,1);
  const wRes=Math.max(0,r.pRes)/tot*bw, wPil=Math.max(0,r.R*r.pMot)/tot*bw;
  bx.fillStyle='rgba(255,255,255,0.07)'; bx.beginPath(); bx.roundRect(bx0,138,bw,30,8); bx.fill();
  bx.fillStyle='rgba(124,217,146,0.55)'; bx.beginPath(); bx.roundRect(bx0,138,Math.max(2,wRes),30,8); bx.fill();
  bx.fillStyle='rgba(192,140,248,0.60)'; bx.beginPath(); bx.roundRect(bx0+wRes,138,Math.max(2,wPil),30,8); bx.fill();
  texto('p_res '+f1(r.pRes,1),bx0+8,159,'#0b0f16',14,'left','800');
  if(wPil>90) texto('R · p_mot '+f1(r.R*r.pMot,1),bx0+wRes+8,159,'#0b0f16',14,'left','800');
  texto('p_eff = '+f1(r.pEff,1)+' bar',bx0+bw,190,'#e8eef8',14,'right','700');
  texto('tarado '+f1(c.tarado,0)+'  +  f_bp·p_Bp '+f1(r.F_bp*E.pBp,1)+'  +  Δp_ov '+f1(r.dpOv,1),
    bx0,190,'#8f9bb0',14,'left','600');

  // reparto de la energia
  texto('¿De dónde sale el calor?',44,238,AZUL,16,'left','700');
  const pb=E.qb*Math.max(0,r.pMot)/600, pc=E.F*r.v/1e6, mx=Math.max(r.pCalor,E.Pdis)*1.12;
  const wb=pb/mx*bw, wc=pc/mx*bw, wd=E.Pdis/mx*bw;
  bx.fillStyle='rgba(255,255,255,0.07)'; bx.beginPath(); bx.roundRect(bx0,256,bw,30,8); bx.fill();
  bx.fillStyle='rgba(138,180,248,0.60)'; bx.beginPath(); bx.roundRect(bx0,256,Math.max(2,wb),30,8); bx.fill();
  bx.fillStyle='rgba(242,166,90,0.65)'; bx.beginPath(); bx.roundRect(bx0+wb,256,Math.max(2,wc),30,8); bx.fill();
  linea(bx0+wd,248,bx0+wd,294,BAD_HEX,2.4,[5,4]);
  texto('límite '+f1(E.Pdis,1)+' kW',bx0+wd+6,250,BAD_HEX,12,'left','700');
  texto('bomba '+f1(pb,2)+' kW',bx0+8,277,'#0b0f16',13,'left','800');
  if(wc>110) texto('carga que baja '+f1(pc,2)+' kW',bx0+wb+8,277,'#0b0f16',13,'left','800');
  texto('total disipado '+f1(r.pCalor,2)+' kW  ·  '+f1(r.kWh,0)+' kWh/año',bx0,310,
    colOk(r.okTermico),14,'left','700');
  texto('en la contrabalance: '+f1(r.pCbv,2)+' kW',bx0+bw,310,'#8f9bb0',13,'right','600');

  // curva pMot vs tarado
  texto('Presión motriz que hay que meter, tarado a tarado',44,356,AZUL,16,'left','700');
  const gx=90, gy=580, gw=560, gh=180;
  const yMax=Math.max(60,E.pLim);
  linea(gx,gy,gx+gw,gy,'#3a4658',1.6); linea(gx,gy,gx,gy-gh,'#3a4658',1.6);
  for(let i=0;i<=3;i++){ const yy=gy-gh*i/3; linea(gx,yy,gx+gw,yy,'rgba(138,180,248,0.10)',1);
    texto(f1(yMax*i/3,0),gx-10,yy+4,'#7d8798',12,'right','600'); }
  texto('p_mot (bar)',gx-10,gy-gh-12,'#7d8798',12,'right','700');
  const lim=E.pLim-MARG_AB;
  linea(gx,gy-gh*lim/yMax,gx+gw,gy-gh*lim/yMax,BAD_HEX,1.8,[6,5]);
  texto('grupo − margen = '+f1(lim,0)+' bar',gx+gw,gy-gh*lim/yMax-6,BAD_HEX,12,'right','700');
  const pts=TARADOS.map((t,i)=>{
    const p=punto(c.est,c.ratio,t,c.dren,c.mont);
    return [gx+gw*i/(TARADOS.length-1), gy-gh*Math.max(0,Math.min(yMax,p.pMot))/yMax, t, p];
  });
  curva(pts.map(p=>[p[0],p[1]]),AZUL,2.6);
  pts.forEach(p=>{
    const act=(p[2]===c.tarado);
    bx.fillStyle=act?WARN_HEX:AZUL; bx.beginPath(); bx.arc(p[0],p[1],act?7:4.5,0,Math.PI*2); bx.fill();
    texto(f1(p[2],0),p[0],gy+20,act?WARN_HEX:'#7d8798',12,'center','700');
    if(act) texto(f1(p[3].pMot,1),p[0],p[1]-14,WARN_HEX,13,'center','800');
  });
  texto('tarado de la contrabalance (bar)',gx+gw/2,gy+42,'#7d8798',12,'center','600');

  rpanel(348);
  prow(PX.y+34,'Estación',E.nom.length>22?E.nom.slice(0,21)+'…':E.nom,'#e8eef8');
  prow(PX.y+62,'Relación de pilotaje',R_ROT[c.ratio],VIO);
  prow(PX.y+90,'Drenaje',DREN_ROT[c.dren]);
  prow(PX.y+118,'Presión inducida',f1(r.pInd,1)+' bar',NARANJA);
  prow(PX.y+146,'p_eff a vencer',f1(r.pEff,1)+' bar');
  prow(PX.y+174,'Presión motriz',r.pMot>0?f1(r.pMot,1)+' bar':'no abre',colOk(r.okApertura));
  prow(PX.y+202,'Presión resistente',f1(r.pRes,1)+' bar',colOk(r.okPresion));
  prow(PX.y+230,'Velocidad',f1(r.v,1)+' mm/s');
  prow(PX.y+258,'Caudal de retorno',f1(r.qRes,1)+' L/min');
  prow(PX.y+286,'Sobrepresión Δp_ov',f1(r.dpOv,1)+' bar');
  prow(PX.y+314,'Calor · límite',f1(r.pCalor,2)+' / '+f1(E.Pdis,1)+' kW',colOk(r.okTermico));

  nota(r.sinTarado
    ? 'p_eff no llega a la presión inducida: la válvula está abierta de par en par y la carga baja sola. '+
      'Ese es el fallo que la contrabalance existe para evitar.'
    : 'La bomba mete '+f1(pb,2)+' kW y la carga que baja aporta '+f1(pc,2)+' kW. Ninguno de los dos '+
      'sale por el eje: los dos acaban calentando el aceite. Bajar despacio no ahorra energía, '+
      'la tira más despacio.',640);
}

// ---------- 6.3 relacion de pilotaje y drenaje del muelle ----------
function drawPilotaje(){
  const c=cfgDe('pilotaje'), E=ESTACIONES[c.est], r=CUR;
  title2('Relación de pilotaje y drenaje del muelle',
    'Dos decisiones que parecen de catálogo y deciden la presión, el calor y la estabilidad.');

  texto('p_eff = tarado + f_bp · p_Bp + Δp_ov      f_bp:  interno 1+R  ·  balanceado 1  ·  ventilado 0',
    44,118,AZUL,15,'left','700');
  texto('Contrapresión de retorno de esta estación: p_Bp = '+f1(E.pBp,0)+' bar',44,142,'#8f9bb0',14,'left','600');

  const gx=104, gy=380, gw=546, gh=196;
  let yMax=0;
  for(const d of DREN_KEYS) for(const R of RATIOS)
    yMax=Math.max(yMax, punto(c.est,R,c.tarado,d,c.mont).pEff);
  yMax=Math.ceil(yMax/50)*50;
  linea(gx,gy,gx+gw,gy,'#3a4658',1.6); linea(gx,gy,gx,gy-gh,'#3a4658',1.6);
  for(let i=0;i<=4;i++){ const yy=gy-gh*i/4; linea(gx,yy,gx+gw,yy,'rgba(138,180,248,0.10)',1);
    texto(f1(yMax*i/4,0),gx-10,yy+4,'#7d8798',12,'right','600'); }
  texto('p_eff (bar)',gx-10,gy-gh-12,'#7d8798',12,'right','700');
  const COLD={int:BAD_HEX,bal:WARN_HEX,vent:OK_HEX};
  const px=i=>gx+gw*i/(RATIOS.length-1);
  for(const d of DREN_KEYS){
    const pts=RATIOS.map((R,i)=>[px(i), gy-gh*punto(c.est,R,c.tarado,d,c.mont).pEff/yMax]);
    curva(pts,COLD[d],d===c.dren?3.2:1.8,d===c.dren?null:[6,5]);
    pts.forEach((p,i)=>{ const act=(d===c.dren&&RATIOS[i]===c.ratio);
      bx.fillStyle=act?WARN_HEX:COLD[d]; bx.beginPath(); bx.arc(p[0],p[1],act?7:4,0,Math.PI*2); bx.fill(); });
  }
  RATIOS.forEach((R,i)=>texto(R_ROT[R],px(i),gy+20,R===c.ratio?WARN_HEX:'#7d8798',12,'center','700'));
  texto('relación de pilotaje R',gx+gw/2,gy+42,'#7d8798',12,'center','600');
  let lx=gx+16;
  for(const d of DREN_KEYS){
    bx.fillStyle=COLD[d]; bx.beginPath(); bx.arc(lx,gy-gh+6,5,0,Math.PI*2); bx.fill();
    texto(DREN_ROT[d],lx+12,gy-gh+11,COLD[d],13,'left','700');
    lx+=bx.measureText(DREN_ROT[d]).width+46;
  }

  texto('Lo que cuesta cada drenaje AQUÍ (R = '+R_ROT[c.ratio]+', tarado '+f1(c.tarado,0)+' bar)',
    44,452,AZUL,16,'left','700');
  const rows=DREN_KEYS.map(d=>{
    const p=punto(c.est,c.ratio,c.tarado,d,c.mont), e=evalua(c.est,c.ratio,c.tarado,d,c.mont);
    return [DREN_ROT[d], f1(fbp(d,c.ratio),1), f1(fbp(d,c.ratio)*E.pBp,1)+' bar', f1(p.pEff,1)+' bar',
      p.pMot>0?f1(p.pMot,1)+' bar':'no abre', f1(p.pCalor,2)+' kW',
      e.fallos.length?e.fallos.map(x=>CRIT_LET[x]).join(' '):'✓'];
  });
  tabla(44,488,['Drenaje','f_bp','f_bp · p_Bp','p_eff','p_mot','Calor','Criterios'],
    rows,[150,70,110,100,100,100,100],(ri,ci)=>{
      const d=DREN_KEYS[ri];
      if(ci===0) return d===c.dren?WARN_HEX:null;
      if(ci===6){ const e=evalua(c.est,c.ratio,c.tarado,d,c.mont); return colOk(e.valido); }
      return null;
    });

  nota('El drenaje interno hace que la contrapresión de retorno entre en la cuenta multiplicada por (1+R): '+
    'con R = 10 y sólo '+f1(E.pBp,0)+' bar de retorno el muelle ve '+f1(11*E.pBp,0)+' bar de más. '+
    'El ventilado lo elimina, pero exige una línea de drenaje limpia hasta el tanque y cuesta más. '+
    'La sobrepresión Δp_ov = '+f1(r.dpOv,1)+' bar no depende del drenaje: sale del caudal que pasa.',612);

  rpanel(292);
  prow(PX.y+34,'Estación',E.nom.length>22?E.nom.slice(0,21)+'…':E.nom,'#e8eef8');
  prow(PX.y+62,'Relación R',R_ROT[c.ratio],VIO);
  prow(PX.y+90,'Drenaje',DREN_ROT[c.dren],COLD[c.dren]);
  prow(PX.y+118,'Factor f_bp',f1(r.F_bp,1));
  prow(PX.y+146,'Contrapresión p_Bp',f1(E.pBp,0)+' bar');
  prow(PX.y+174,'Aporte al muelle',f1(r.F_bp*E.pBp,1)+' bar',r.F_bp>1?BAD_HEX:OK_HEX);
  prow(PX.y+202,'p_eff',f1(r.pEff,1)+' bar');
  prow(PX.y+230,'p_mot',r.pMot>0?f1(r.pMot,1)+' bar':'no abre',colOk(r.okApertura));
  prow(PX.y+258,'Calor',f1(r.pCalor,2)+' kW',colOk(r.okTermico));
}

// ---------- 6.4 estabilidad: la frontera de Routh ----------
function drawEstab(){
  const c=cfgDe('estab'), E=ESTACIONES[c.est], r=CUR;
  const V=volumenes(c.est,c.mont);
  const Rc=E.ares*V.vMot/(E.amot*V.vRes);
  title2('Estabilidad: por qué la carga se pone a botar',
    'Routh–Hurwitz sobre el modelo linealizado: la condición se reduce a R·A_mot·V_res < A_res·V_mot.');

  texto('ME = A_res · V_mot / (R · A_mot · V_res) = R_c / R      exige ME ≥ '+f1(ME_MIN,2),
    44,118,AZUL,15,'left','700');

  // lugar de las raices
  const gx=104, gy=430, gw=380, gh=270, cy=gy-gh/2;
  const xRe=6.5, yIm=118;
  linea(gx,cy,gx+gw,cy,'#3a4658',1.4);
  const x0=gx+gw*(xRe)/(2*xRe);
  linea(x0,gy,x0,gy-gh,'#e8eef8',2.0);
  texto('Re = 0',x0+6,gy-gh-8,'#e8eef8',12,'left','700');
  texto('Im (rad/s)',gx-10,gy-gh-8,'#7d8798',12,'right','700');
  for(let i=-2;i<=2;i++){ const yy=cy-gh/2*i/2; if(i) linea(gx,yy,gx+gw,yy,'rgba(138,180,248,0.10)',1);
    texto(f1(yIm*i/2,0),gx-10,yy+4,'#7d8798',11,'right','600'); }
  for(let i=-3;i<=3;i++){ const xx=gx+gw*(i/xRe+1)/2; if(i) linea(xx,gy,xx,gy-gh,'rgba(138,180,248,0.08)',1);
    texto(f1(i*xRe/3,1),xx,gy+18,'#7d8798',11,'center','600'); }
  texto('Re (1/s)',gx+gw/2,gy+38,'#7d8798',12,'center','600');
  bx.save(); bx.beginPath(); bx.rect(gx,gy-gh,gw,gh); bx.clip();
  for(const R of RATIOS){
    const p=poli(c.est,R,c.mont,1e-11,E.masa), rr=raices(p.c2,p.c1,p.c0);
    const act=(R===c.ratio), est=(margenEstab(c.est,R,c.mont)>=1);
    for(const z of rr){
      if(Math.abs(z.im)<1) continue;                       // la raiz real se sale de escala
      const X=gx+gw*(z.re/xRe+1)/2, Y=cy-gh/2*z.im/yIm;
      bx.fillStyle=est?OK_HEX:BAD_HEX; bx.globalAlpha=act?1:0.42;
      bx.beginPath(); bx.arc(X,Y,act?8:5,0,Math.PI*2); bx.fill(); bx.globalAlpha=1;
      if(act){ bx.strokeStyle=WARN_HEX; bx.lineWidth=2.4; bx.beginPath(); bx.arc(X,Y,12,0,Math.PI*2); bx.stroke(); }
    }
  }
  bx.restore();
  RATIOS.forEach(R=>{
    const p=poli(c.est,R,c.mont,1e-11,E.masa), rr=raices(p.c2,p.c1,p.c0);
    const z=rr.find(q=>Math.abs(q.im)>1); if(!z) return;
    const X=gx+gw*(z.re/xRe+1)/2, Y=cy-gh/2*z.im/yIm;
    if(X>gx+6&&X<gx+gw-6) texto('R '+R_ROT[R].split(' ')[0],X+14,Y+4,
      R===c.ratio?WARN_HEX:'#7d8798',11,'left','700');
  });
  texto('◀ estable    inestable ▶',x0,gy-gh-26,'#8f9bb0',12,'center','600');

  // margen de estabilidad por montaje
  texto('Margen por montaje',514,150,AZUL,16,'left','700');
  let y=186;
  for(const m of MONT_KEYS){
    const me=margenEstab(c.est,c.ratio,m), act=(m===c.mont);
    texto(MONT_ROT[m],514,y,act?'#e8eef8':'#7d8798',13,'left',act?'800':'500');
    hbar(514,y+8,150,12,me/2.5,me>=ME_MIN?OK_HEX:BAD_HEX);
    texto(f1(me,2),674,y+18,me>=ME_MIN?OK_HEX:BAD_HEX,14,'left','800');
    const xu=514+150*ME_MIN/2.5; linea(xu,y+4,xu,y+24,VIO,2);
    y+=54;
  }
  texto('▮ ME mínimo = '+f1(ME_MIN,2),514,y+2,VIO,12,'left','600');
  texto('V_res crece con la manguera: '+f1(V.vRes,0)+' cm³',514,y+28,'#8f9bb0',13,'left','600');
  texto('V_mot es el lado motriz: '+f1(V.vMot,0)+' cm³',514,y+50,'#8f9bb0',13,'left','600');

  nota('Ni la masa ni la ganancia de la válvula aparecen en la condición: la frontera es puramente '+
    'geométrica. Subir R baja la presión de pilotaje y el calor, pero acerca el sistema al límite. '+
    'Acortar la manguera entre el actuador y la válvula sube R_c y devuelve margen: aquí pasa de '+
    f1(E.ares*volumenes(c.est,'bloque').vMot/(E.amot*volumenes(c.est,'bloque').vRes),2)+' en bloque a '+
    f1(E.ares*volumenes(c.est,'brida').vMot/(E.amot*volumenes(c.est,'brida').vRes),2)+' con la válvula '+
    'atornillada al actuador. Modelo sin rozamiento ni fugas de la direccional y con caudal de '+
    'alimentación constante: sirve para situar la frontera, no para predecir la amplitud.',560);

  rpanel(292);
  prow(PX.y+34,'Estación',E.nom.length>22?E.nom.slice(0,21)+'…':E.nom,'#e8eef8');
  prow(PX.y+62,'Relación R',R_ROT[c.ratio],VIO);
  prow(PX.y+90,'Montaje',MONT_ROT[c.mont].length>18?MONT_ROT[c.mont].slice(0,17)+'…':MONT_ROT[c.mont]);
  prow(PX.y+118,'V_res',f1(V.vRes,0)+' cm³');
  prow(PX.y+146,'V_mot',f1(V.vMot,0)+' cm³');
  prow(PX.y+174,'R crítica',f1(Rc,2),VIO);
  prow(PX.y+202,'Margen ME',f1(r.me,2),colOk(r.okEstab));
  const pl=poli(c.est,c.ratio,c.mont,1e-11,E.masa), rz=raices(pl.c2,pl.c1,pl.c0);
  const zc=rz.find(q=>Math.abs(q.im)>1);
  prow(PX.y+230,'Parte real',zc?f1(zc.re,2)+' 1/s':'—',zc?colOk(zc.re<0):null);
  prow(PX.y+258,'Frecuencia',zc?f1(Math.abs(zc.im)/(2*Math.PI),2)+' Hz':'—');
}

// ---------- 6.5 reto: cuatro ejes, seis criterios ----------
function drawReto(){
  const estK=ST.reto.est, E=ESTACIONES[estK], r=CUR, o=optimo(estK);
  title2('Reto · '+E.nom,
    'Cuatro ejes. Seis criterios a la vez. A igualdad de coste gana la que menos calienta.');

  texto('Coste del conjunto = válvula (según R) + drenaje + montaje.  Orden declarado: primero coste, '+
    'luego calor.',44,116,'#8f9bb0',13,'left','600');

  const EJES_D=[
    {k:'ratio', vals:RATIOS,    rot:v=>R_ROT[v],    cur:RETO.cfg.ratio},
    {k:'tarado',vals:TARADOS,   rot:v=>f1(v,0)+' bar', cur:RETO.cfg.tarado},
    {k:'dren',  vals:DREN_KEYS, rot:v=>DREN_ROT[v], cur:RETO.cfg.dren},
    {k:'mont',  vals:MONT_KEYS, rot:v=>MONT_ROT[v], cur:RETO.cfg.mont},
  ];
  let y=152;
  for(const e of EJES_D){
    const sol=ejeSolC(estK,e.k), vis=RETO.ejes[e.k];
    texto(EJE_ROT[e.k],44,y,'#dbe4f0',14,'left','700');
    if(vis) texto('pista: '+sol.map(e.rot).join(' · '),640,y,VIO,13,'right','700');
    let x=44; const yy=y+14;
    for(const v of e.vals){
      bx.font='600 13px ui-sans-serif,system-ui,sans-serif';
      const w=Math.max(74,bx.measureText(e.rot(v)).width+18);
      const act=(v===e.cur), ok=vis&&sol.indexOf(v)>=0;
      bx.fillStyle=act?'rgba(233,196,106,0.22)':'rgba(255,255,255,0.05)';
      bx.strokeStyle=act?WARN_HEX:(ok?VIO:'rgba(138,180,248,0.18)');
      bx.lineWidth=act?2.2:1.4;
      bx.beginPath(); bx.roundRect(x,yy,w,30,8); bx.fill(); bx.stroke();
      texto(e.rot(v),x+w/2,yy+20,act?'#f4e3b6':(ok?VIO:'#9fb0c6'),13,'center',act?'800':'600');
      x+=w+8;
    }
    y+=68;
  }

  texto('Cómo va la configuración de ahora',44,y+16,AZUL,16,'left','700');
  let cy2=y+50;
  for(const c of CRIT){
    const ok=r[c];
    marca(56,cy2,ok);
    texto(CRIT_ROT[c],74,cy2+5,ok?'#dbe4f0':BAD_HEX,13,'left','700');
    texto(ok?'':CRIT_POR[c],250,cy2+5,'#8f9bb0',12,'left','500');
    cy2+=26;
  }

  rpanel(300);
  prow(PX.y+34,'Configuraciones válidas',o?f1(o.validas,0)+' de 225':'ninguna');
  prow(PX.y+62,'Coste mínimo posible',o?f1(o.best.coste,0):'—',VIO);
  prow(PX.y+90,'Coste de la tuya',f1(r.coste,0),r.valido?colOk(r.coste===o.best.coste):GRIS);
  prow(PX.y+118,'Calor de la tuya',f1(r.pCalor,2)+' kW');
  prow(PX.y+146,'Calor del óptimo',o?f1(o.best.pCalor,2)+' kW':'—',VIO);
  prow(PX.y+174,'Criterios cumplidos',f1(CRIT.filter(c=>r[c]).length,0)+' de 6',
    colOk(r.valido));
  prow(PX.y+202,'Ejes acertados',
    f1(EJES.filter(k=>ejeSolC(estK,k).indexOf(RETO.cfg[k])>=0).length,0)+' de 4');
  prow(PX.y+230,'Estado',RETO.resuelto?'resuelto':(r.valido?'válida, no óptima':'no válida'),
    RETO.resuelto?OK_HEX:(r.valido?WARN_HEX:BAD_HEX));
  prow(PX.y+258,'Soluciones equivalentes',o?f1(o.empatesTot,0):'—');

  if(RETO.msg) wrapText(RETO.msg,PX.x+16,PX.y+318,PX.w-32,18,'#9fb0c6',13);
}

// ---------- 6.6 despacho ----------
function drawBoard(){
  bg();
  if(mode==='induc') drawInduc();
  else if(mode==='descenso') drawDescenso();
  else if(mode==='pilotaje') drawPilotaje();
  else if(mode==='estab') drawEstab();
  else drawReto();
  btex.needsUpdate=true;
}

// ===================== 7. GRUPO 3D =====================
const rig=new THREE.Group(); scene.add(rig);

// ---- etiquetas flotantes ----
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
  rig.add(sp);
  HOVER_LABELS.set(obj,sp);
  return sp;
}

// ---- tubos como curvas ----
const LINEAS={};
function linea3(key,pts,mat,r){
  const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,64,r||0.035,10,false),mat);
  rig.add(m); LINEAS[key]={mesh:m,curve};
  return LINEAS[key];
}
const PART=[];
function particulas(key,n,mat){
  const grupo=new THREE.Group(); rig.add(grupo);
  const ms=[], fase=[];
  for(let i=0;i<n;i++){
    const s=new THREE.Mesh(new THREE.SphereGeometry(0.045,10,8),mat);
    grupo.add(s); ms.push(s); fase.push(i/n);
  }
  const p={key,curve:LINEAS[key].curve,ms,fase,grupo};
  PART.push(p); return p;
}

// ---- bancada ----
(function(){
  const b=roundedBox(4.10,0.14,1.90,MAT.bancada,0.04);
  b.position.set(1.10,0.07,0); rig.add(b);
  const t=roundedBox(4.16,0.03,1.96,std('#0e131b',0.95,0.05),0.02);
  t.position.set(1.10,0.155,0); rig.add(t);
  for(const x of [-0.75,2.95]) for(const z of [-0.78,0.78]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.055,0.14,12),MAT.acero2);
    p.position.set(x,0.07,z); rig.add(p);
  }
})();

// ---- grupo de accionamiento: deposito, motor y bomba ----
const gGrupo=new THREE.Group(); rig.add(gGrupo);
(function(){
  const tk=roundedBox(0.98,0.56,0.74,MAT.tanque,0.05);
  tk.position.set(-0.14,0.45,0); gGrupo.add(tk);
  const niv=new THREE.Mesh(new THREE.BoxGeometry(0.90,0.32,0.66),MAT.aceite);
  niv.position.set(-0.14,0.36,0); gGrupo.add(niv);
  const vis=new THREE.Mesh(new THREE.BoxGeometry(0.99,0.58,0.75),MAT.vidrio);
  vis.position.set(-0.14,0.45,0); gGrupo.add(vis);
  const mot=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.17,0.44,24),MAT.motor);
  mot.rotation.z=Math.PI/2; mot.position.set(-0.42,0.92,0); gGrupo.add(mot);
  for(let i=0;i<10;i++){
    const a=new THREE.Mesh(new THREE.BoxGeometry(0.42,0.03,0.03),MAT.acero2);
    a.position.set(-0.42,0.92+0.175*Math.cos(i/10*Math.PI*2),0.175*Math.sin(i/10*Math.PI*2));
    gGrupo.add(a);
  }
  const bo=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.24,20),MAT.bomba);
  bo.rotation.z=Math.PI/2; bo.position.set(-0.06,0.92,0); gGrupo.add(bo);
  const eje=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.10,12),MAT.crom);
  eje.rotation.z=Math.PI/2; eje.position.set(-0.24,0.92,0); gGrupo.add(eje);
  addHoverLabel(tk,'Depósito y bomba',NARANJA,[-0.14,1.32,0],0.66);
  addHoverLabel(mot,'Motor eléctrico',AZUL,[-0.42,1.32,0],0.60);
  gGrupo.userData.pick='grupo';
  tk.userData.pick='grupo'; mot.userData.pick='grupo'; bo.userData.pick='grupo';
})();

// ---- valvula direccional 4/3 ----
const gDir=new THREE.Group(); rig.add(gDir);
let dirCarrete=null;
(function(){
  const cuerpo=roundedBox(0.46,0.30,0.34,MAT.valv,0.04);
  cuerpo.position.set(0.86,0.36,0); gDir.add(cuerpo);
  for(const s of [-1,1]){
    const sol=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,0.16,16),MAT.acero2);
    sol.rotation.z=Math.PI/2; sol.position.set(0.86+s*0.30,0.36,0); gDir.add(sol);
    const tap=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.04,12),MAT.crom);
    tap.rotation.z=Math.PI/2; tap.position.set(0.86+s*0.40,0.36,0); gDir.add(tap);
  }
  dirCarrete=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.30,12),MAT.crom);
  dirCarrete.rotation.z=Math.PI/2; dirCarrete.position.set(0.86,0.36,0.175); gDir.add(dirCarrete);
  const base=roundedBox(0.54,0.10,0.42,MAT.acero2,0.02);
  base.position.set(0.86,0.21,0); gDir.add(base);
  addHoverLabel(cuerpo,'Direccional 4/3',AZUL,[0.86,0.74,0],0.60);
  cuerpo.userData.pick='dir';
})();

// ---- valvula de contrabalance ----
const gCB=new THREE.Group(); rig.add(gCB);
let cbMuelle=null, cbPomo=null, cbCuerpo=null, cbPiloto=null, cbLbl=null;
(function(){
  cbCuerpo=roundedBox(0.24,0.30,0.22,MAT.cbal,0.03);
  gCB.add(cbCuerpo);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.085,0.20,16),MAT.acero2);
  cap.position.set(0,0.24,0); gCB.add(cap);
  cbMuelle=new THREE.Mesh(new THREE.TorusGeometry(0.055,0.014,8,20),MAT.muelle);
  cbMuelle.rotation.x=Math.PI/2; cbMuelle.position.set(0,0.24,0); gCB.add(cbMuelle);
  cbPomo=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.062,0.10,14),MAT.crom);
  cbPomo.position.set(0,0.40,0); gCB.add(cbPomo);
  // antirretorno en paralelo: la subida es libre
  const chk=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.16,14),MAT.acero);
  chk.rotation.z=Math.PI/2; chk.position.set(0,-0.11,0.14); gCB.add(chk);
  cbPiloto=new THREE.Mesh(new THREE.CylinderGeometry(0.032,0.032,0.12,12),MAT.tuboP);
  cbPiloto.rotation.z=Math.PI/2; cbPiloto.position.set(-0.16,0.02,0); gCB.add(cbPiloto);
  cbLbl=addHoverLabel(cbCuerpo,'Contrabalance',NARANJA,[0,0,0],0.62);
  cbCuerpo.userData.pick='cb'; cap.userData.pick='cb'; cbPomo.userData.pick='cb';
})();

// ---- actuador: cilindro (dos montajes) o cabrestante ----
const gCil=new THREE.Group(), gPed=new THREE.Group(), gPortal=new THREE.Group(),
      gTam=new THREE.Group();
rig.add(gCil); rig.add(gPed); rig.add(gPortal); rig.add(gTam);
let cilVas=null, cilMasa=null, anMot=null, anRes=null, tamMasa=null, tamCable=null, tamTambor=null;
(function(){
  const cam=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,1.10,28),MAT.acero);
  cam.position.set(2.35,1.35,0); gCil.add(cam);
  for(const y of [0.84,1.86]){
    const br=new THREE.Mesh(new THREE.CylinderGeometry(0.225,0.225,0.07,28),MAT.acero2);
    br.position.set(2.35,y,0); gCil.add(br);
  }
  anRes=new THREE.Mesh(new THREE.CylinderGeometry(0.207,0.207,0.24,28),
    new THREE.MeshStandardMaterial({color:'#7CD992',roughness:0.4,metalness:0.3,
      emissive:'#1c4a2c',emissiveIntensity:0.6,transparent:true,opacity:0.85}));
  anRes.position.set(2.35,1.02,0); gCil.add(anRes);
  anMot=new THREE.Mesh(new THREE.CylinderGeometry(0.207,0.207,0.24,28),
    new THREE.MeshStandardMaterial({color:'#8AB4F8',roughness:0.4,metalness:0.3,
      emissive:'#1b3358',emissiveIntensity:0.6,transparent:true,opacity:0.85}));
  anMot.position.set(2.35,1.68,0); gCil.add(anMot);
  cilVas=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,1.00,18),MAT.crom);
  cilVas.position.set(2.35,1.60,0); gCil.add(cilVas);
  cilMasa=roundedBox(0.62,0.30,0.62,MAT.carga,0.04);
  cilMasa.position.set(2.35,2.60,0); gCil.add(cilMasa);
  addHoverLabel(anRes,'Cámara resistente',OK_HEX,[2.35,1.02,0.46],0.66);
  addHoverLabel(anMot,'Cámara motriz',AZUL,[2.35,1.68,0.46],0.62);
  addHoverLabel(cilMasa,'La carga',VIO,[2.35,2.60,0.50],0.50);
  cam.userData.pick='act'; anRes.userData.pick='act'; anMot.userData.pick='act';
  cilMasa.userData.pick='carga';

  const ped=roundedBox(0.46,0.68,0.46,MAT.acero2,0.03);
  ped.position.set(2.35,0.50,0); gPed.add(ped);
  for(const s of [-1,1]){
    const col=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,1.86,12),MAT.acero2);
    col.position.set(2.35+s*0.36,1.09,0); gPortal.add(col);
  }
  const trav=roundedBox(0.92,0.10,0.24,MAT.acero2,0.02);
  trav.position.set(2.35,1.97,0); gPortal.add(trav);

  const mtr=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.17,0.34,22),MAT.motor);
  mtr.rotation.z=Math.PI/2; mtr.position.set(1.90,1.31,0); gTam.add(mtr);
  const red=roundedBox(0.22,0.34,0.34,MAT.valv,0.03);
  red.position.set(2.16,1.31,0); gTam.add(red);
  tamTambor=new THREE.Mesh(new THREE.CylinderGeometry(0.32,0.32,0.46,26),MAT.acero);
  tamTambor.rotation.z=Math.PI/2; tamTambor.position.set(2.55,1.31,0); gTam.add(tamTambor);
  for(const s of [-1,1]){
    const bd=new THREE.Mesh(new THREE.CylinderGeometry(0.38,0.38,0.04,26),MAT.acero2);
    bd.rotation.z=Math.PI/2; bd.position.set(2.55+s*0.24,1.31,0); gTam.add(bd);
  }
  const sop=roundedBox(0.30,1.00,0.50,MAT.acero2,0.03);
  sop.position.set(2.55,0.66,0); gTam.add(sop);
  tamCable=new THREE.Mesh(new THREE.CylinderGeometry(0.020,0.020,1.00,10),MAT.cable);
  tamCable.position.set(2.55,0.60,0.32); gTam.add(tamCable);
  tamMasa=roundedBox(0.46,0.26,0.46,MAT.carga,0.04);
  tamMasa.position.set(2.55,0.20,0.32); gTam.add(tamMasa);
  addHoverLabel(tamTambor,'Tambor y motor',NARANJA,[2.55,1.86,0],0.60);
  addHoverLabel(tamMasa,'La carga',VIO,[2.55,0.20,0.62],0.48);
  mtr.userData.pick='act'; tamTambor.userData.pick='act'; tamMasa.userData.pick='carga';
})();

// ---- tablero de instrumentos ----
const gTab=new THREE.Group(); rig.add(gTab);
const tcv=document.createElement('canvas'); tcv.width=512; tcv.height=256;
const tx=tcv.getContext('2d');
const ttex=new THREE.CanvasTexture(tcv);
(function(){
  const m=roundedBox(1.22,0.66,0.06,MAT.panel,0.03);
  m.position.set(0.60,1.44,-0.52); m.rotation.y=0.20; gTab.add(m);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(1.14,0.58),
    new THREE.MeshBasicMaterial({map:ttex,toneMapped:false}));
  p.position.set(0.60,1.44,-0.487); p.rotation.y=0.20; gTab.add(p);
  const pat=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.035,1.06,12),MAT.acero2);
  pat.position.set(0.60,0.63,-0.55); gTab.add(pat);
  m.userData.pick='tab'; p.userData.pick='tab';
  addHoverLabel(m,'Instrumentos',AZUL,[0.60,1.92,-0.52],0.56);
})();
function gauge(c,cx,cy,r,frac,col,val,rot){
  c.save();
  c.strokeStyle='rgba(255,255,255,0.10)'; c.lineWidth=8;
  c.beginPath(); c.arc(cx,cy,r,Math.PI*0.75,Math.PI*0.75+Math.PI*1.5); c.stroke();
  c.strokeStyle=col; c.lineWidth=8;
  c.beginPath(); c.arc(cx,cy,r,Math.PI*0.75,Math.PI*0.75+Math.PI*1.5*Math.max(0,Math.min(1,frac)));
  c.stroke();
  const a=Math.PI*0.75+Math.PI*1.5*Math.max(0,Math.min(1,frac));
  c.strokeStyle='#e8eef8'; c.lineWidth=3;
  c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(a)*(r-6),cy+Math.sin(a)*(r-6)); c.stroke();
  c.fillStyle='#e8eef8'; c.font='700 18px ui-sans-serif,system-ui,sans-serif';
  c.textAlign='center'; c.textBaseline='middle'; c.fillText(val,cx,cy+r+18);
  c.fillStyle='#8f9bb0'; c.font='600 12px ui-sans-serif,system-ui,sans-serif';
  c.fillText(rot,cx,cy+r+38);
  c.restore();
}
function drawTablero(){
  const r=CUR, E=ESTACIONES[estAct()];
  tx.fillStyle='#0a0e15'; tx.fillRect(0,0,512,256);
  tx.strokeStyle='rgba(138,180,248,0.18)'; tx.lineWidth=2;
  tx.beginPath(); tx.roundRect(6,6,500,244,10); tx.stroke();
  gauge(tx,92,92,48,Math.max(0,r.pMot)/E.pLim,r.okApertura?AZUL:BAD_HEX,
    r.pMot>0?f1(r.pMot,1):'—','p motriz (bar)');
  gauge(tx,256,92,48,Math.max(0,r.pRes)/E.pMaxCil,r.okPresion?OK_HEX:BAD_HEX,
    f1(r.pRes,1),'p resistente (bar)');
  gauge(tx,420,92,48,r.pCalor/Math.max(E.Pdis,0.001),r.okTermico?WARN_HEX:BAD_HEX,
    f1(r.pCalor,2),'calor (kW)');
  tx.fillStyle='#8f9bb0'; tx.font='600 13px ui-sans-serif,system-ui,sans-serif';
  tx.textAlign='left'; tx.textBaseline='alphabetic';
  tx.fillText('v = '+f1(r.v,1)+' mm/s',22,214);
  tx.fillText('ME = '+f1(r.me,2),176,214);
  tx.fillText('q_res = '+f1(r.qRes,1)+' L/min',300,214);
  tx.fillStyle=r.valido?OK_HEX:BAD_HEX;
  tx.fillText(r.valido?'configuración válida':'fallan: '+r.fallos.map(c=>CRIT_LET[c]).join(' '),22,238);
  ttex.needsUpdate=true;
}

// ---- lineas flexibles: se rehacen cuando cambia la estacion o el montaje ----
function esMotor(){ return ESTACIONES[estAct()].tipo==='mot'; }
function anclas(){
  return esMotor()
    ? { res:[1.90,1.14,0.20], mot:[1.90,1.48,0.20], brida:[1.62,1.31,0.34] }
    : { res:[2.35,0.86,0.24], mot:[2.35,1.84,0.24], brida:[2.35,1.06,0.46] };
}
function cbPos(){
  const m=cfgDe(mode).mont, a=anclas();
  if(m==='bloque') return [1.16,0.44,0.24];
  if(m==='corta')  return [1.70,0.66,0.36];
  return a.brida;
}
let _linKey='';
function rebuildLineas(){
  const m=cfgDe(mode).mont;
  const key=estAct()+'|'+m;
  if(key===_linKey) return;
  _linKey=key;
  for(const k of Object.keys(LINEAS)){
    rig.remove(LINEAS[k].mesh);
    LINEAS[k].mesh.geometry.dispose();
    delete LINEAS[k];
  }
  const a=anclas(), c=cbPos();
  linea3('pres',[[0.06,0.92,0],[0.45,0.86,0.10],[0.80,0.54,0.14],[0.86,0.50,0.16],
    [1.30,0.96,0.20],[1.90,1.60,0.22],[a.mot[0]-0.14,a.mot[1]+0.10,a.mot[2]],a.mot],MAT.tubo,0.036);
  linea3('res',[a.res,[(a.res[0]+c[0])/2,(a.res[1]+c[1])/2-0.20,(a.res[2]+c[2])/2+0.12],
    [c[0]+0.06,c[1]-0.14,c[2]+0.06],[c[0],c[1]-0.15,c[2]]],MAT.tubo,0.034);
  linea3('tank',[[c[0],c[1]+0.02,c[2]-0.11],[c[0]-0.26,c[1]-0.02,-0.22],
    [0.60,0.44,-0.30],[0.10,0.62,-0.22],[-0.14,0.72,-0.10]],MAT.tuboT,0.032);
  linea3('pil',[[1.36,1.00,0.20],[c[0]-0.30,c[1]+0.22,c[2]+0.02],[c[0]-0.16,c[1]+0.02,c[2]]],
    MAT.tuboP,0.022);
  for(const p of PART) p.curve=LINEAS[p.key].curve;
}
rebuildLineas();
const partPres=particulas('pres',18,MAT.aceite);
const partRes=particulas('res',10,MAT.aceiteA);
const partTank=particulas('tank',12,MAT.aceite);

// ===================== 8. ESTADO DE LA MAQUINA =====================
const _c1=new THREE.Color(), _c2=new THREE.Color();
function tintaPresion(mesh,frac,base){
  const f=Math.max(0,Math.min(1,frac));
  _c1.set(base); _c2.set(BAD_HEX);
  mesh.material.color.copy(_c1).lerp(_c2,Math.max(0,(f-0.55)/0.45));
  mesh.material.emissiveIntensity=0.30+0.75*f;
}
function updateHW(){
  const c=cfgDe(mode), E=ESTACIONES[c.est], r=CUR;
  rebuildLineas();
  const mot=esMotor(), arriba=(E.camMot==='a');
  gCil.visible=!mot; gPed.visible=!mot&&arriba; gPortal.visible=!mot&&!arriba; gTam.visible=mot;

  // la contrabalance viaja con el montaje: en el bloque de mando, en manguera
  // corta o abridada al actuador. La manguera que se rehace ES el volumen V_res
  // que decide la estabilidad, asi que el montaje se ve, no solo se tabula.
  const cp=cbPos();
  gCB.position.set(cp[0],cp[1],cp[2]);
  if(cbLbl) cbLbl.position.set(cp[0],cp[1]+0.60,cp[2]);
  const kt=(c.tarado-TARADOS[0])/(TARADOS[TARADOS.length-1]-TARADOS[0]);
  cbPomo.position.y=0.40+0.09*kt;
  cbMuelle.scale.setScalar(1-0.26*kt);
  cbCuerpo.material=r.sinTarado?MAT.valvOn:MAT.cbal;

  const ext=(hw.ext===undefined)?0.35:hw.ext;
  const trem=hw.trem||0;
  if(!mot){
    // el vastago sale hacia arriba (pluma, tijera, volquete) o hacia abajo (prensa)
    const L=arriba?(0.67-0.55*ext):(0.12+0.50*ext);
    if(arriba){
      cilVas.position.set(2.35,1.90+L-0.50,0);
      cilMasa.position.set(2.35+trem,1.90+L+0.16,0);
    } else {
      cilVas.position.set(2.35,0.80-L+0.50,0);
      cilMasa.position.set(2.35+trem,0.80-L-0.16,0);
    }
    // la camara resistente es SIEMPRE la de abajo: con el vastago arriba es el
    // fondo, con el vastago abajo es la corona, y en los dos casos el piston
    // baja al bajar la carga, asi que ella se vacia y la motriz se llena.
    const hRes=0.20+0.62*(1-ext), hMot=1.02-hRes;
    anRes.scale.y=hRes/0.24; anRes.position.y=0.85+hRes/2;
    anMot.scale.y=hMot/0.24;  anMot.position.y=1.87-hMot/2;
    tintaPresion(anRes,r.pRes/E.pMaxCil,'#7CD992');
    tintaPresion(anMot,Math.max(0,r.pMot)/E.pLim,'#8AB4F8');
  } else {
    const yl=0.86-0.52*ext, ycab=yl+0.13, largo=Math.max(0.05,1.31-ycab);
    tamMasa.position.set(2.55+trem,yl,0.32);
    tamCable.position.set(2.55,(1.31+ycab)/2,0.32);
    tamCable.scale.y=largo;
    tamTambor.rotation.x=-ext*6.0;
  }
  dirCarrete.position.x=0.86+(r.sinTarado?0.05:0.09);
  hw.v=r.v; hw.q=r.qRes; hw.me=r.me;
  drawTablero();
}

// ===================== 9. HUD Y PANEL =====================
el('hud').innerHTML=`
  <div class="eyebrow">Hidráulica y Neumática · Mecánica</div>
  <h2>Controla cargas negativas con válvula de contrabalance</h2>
  <p>Una carga que <b>tira</b> del actuador no es una resistencia: es un motor. Si la dejas suelta, se desboca y el aceite que debería frenarla se lo lleva ella. La contrabalance hace dos trabajos a la vez: sujeta la carga en reposo con su tarado y la frena al bajar dejando salir sólo el caudal que la bomba mete. Ajusta el tarado, la relación de pilotaje, el drenaje del muelle y dónde va montada la válvula, y mira qué le pasa a la sujeción, al calor y —lo que casi nadie mira— a la <b>estabilidad</b>.</p>
  <div class="formula">p<sub>res</sub> + R·p<sub>mot</sub> = tarado + f<sub>bp</sub>·p<sub>Bp</sub> + Δp<sub>ov</sub> · ME = A<sub>res</sub>·V<sub>mot</sub> / (R·A<sub>mot</sub>·V<sub>res</sub>) ≥ 1,15</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Cámara motriz: la presión que mete la bomba y que además pilota la válvula</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Cámara resistente: la que aguanta la carga y la que la contrabalance estrangula</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>Línea de pilotaje: lo que abre el carrete contra el muelle</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Energía que se queda en la válvula convertida en calor</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el equilibrio del carrete con relación de pilotaje R, p<sub>res</sub>+R·p<sub>mot</sub>=p<sub>eff</sub>, y los tres drenajes del muelle mediante f<sub>bp</sub>=1+R (interno), 1 (balanceado) y 0 (ventilado); la presión inducida por la carga p<sub>ind</sub>=10·F/A<sub>res</sub> y el criterio de sujeción de 1,3·p<sub>ind</sub>; la fuga de asiento con un ajuste exponencial de catálogo corregido por viscosidad con la ecuación de Walther (ASTM D341) sobre un ISO VG 46 (ISO 3448), y la deriva de la carga en diez minutos; el equilibrio de presiones del actuador con sus dos áreas, incluida la intensificación en la cámara resistente; el balance de energía q<sub>b</sub>·p<sub>mot</sub>/600 + F·v·10⁻⁶ = q<sub>res</sub>·p<sub>res</sub>/600; el criterio de estabilidad de Routh–Hurwitz sobre el modelo lineal de tercer orden con la rigidez hidráulica de los dos volúmenes (β = 1,4 GPa) y las raíces del polinomio; la sobrepresión de apertura, el coste del conjunto y la potencia disipada.</div>
    <div class="fl no"><b>NO modela:</b> fricción de las juntas, fugas por el vástago, dinámica del carrete de la direccional, golpe de ariete ni aire disuelto. El modelo dinámico está linealizado alrededor del punto de trabajo y supone caudal de bomba constante: sirve para decidir <i>si</i> el lazo es estable y con cuánto margen, no para predecir la amplitud de la oscilación. El temblor de la carga en el 3D es ilustrativo, igual que la carrera del vástago: marcan el sentido y la velocidad relativa, no resuelven la cinemática de la máquina. Los coeficientes de fuga y de coste son representativos del tipo constructivo, no de un fabricante concreto.</div>
  </div>
  <div class="src">Ref: ISO 4413 · ISO 1219-1 · ISO 3448 · ASTM D341 · ISO 6020-2 · NFPA/T2.6.1</div>`;

el('panel').innerHTML=`
  <h4>Banco de cargas negativas · <span id="p_mode" style="color:var(--accent2)">Presión inducida</span></h4>
  <div class="modebar">
    <button class="b on" id="m_induc">1 · Inducida</button>
    <button class="b" id="m_descenso">2 · Descenso</button>
    <button class="b" id="m_pilotaje">3 · Pilotaje</button>
    <button class="b" id="m_estab">4 · Estabilidad</button>
    <button class="b" id="m_reto">5 · Reto</button>
  </div>
  <div id="scenarioInfo" style="display:none;margin:8px 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:12.5px;line-height:1.45"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div style="margin:8px 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px">
    <div style="font-size:12px;color:var(--muted)" id="hwrot">Pluma articulada</div>
    <div style="font-size:13px;font-weight:600" id="hwsub">Carga suspendida en voladizo</div>
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
  induc:{nombre:'Presión inducida',cam:[[5.6,3.0,7.4],[1.60,1.30,0.10]],
    mision:'La máquina parada y la carga colgando. La carga sola ya pone presión en la cámara resistente: p_ind = 10·F/A_res. El tarado tiene que quedar por encima de esa presión con margen, y el asiento tiene que gotear poco, porque lo que gotea se convierte en carga que baja sola.'},
  descenso:{nombre:'El punto de trabajo',cam:[[4.4,3.2,7.8],[1.30,1.35,0.05]],
    mision:'Ahora baja. La bomba manda caudal a la cámara motriz y la contrabalance decide qué sale por la resistente. Mira las dos presiones, la velocidad y de dónde sale el calor: una parte la pone la bomba y la otra la pone la propia carga al caer.'},
  pilotaje:{nombre:'Relación de pilotaje y drenaje',cam:[[3.2,2.6,7.0],[1.10,1.00,0.20]],
    mision:'La misma estación con distinta relación R y distinto drenaje del muelle. R alta pide menos presión de pilotaje, pero con drenaje interno multiplica la contrapresión del retorno por (R+1). Seis bar de retorno pueden convertirse en sesenta y seis.'},
  estab:{nombre:'Estabilidad del lazo',cam:[[3.8,3.4,8.2],[1.20,1.30,0.00]],
    mision:'Una contrabalance es un lazo cerrado: la presión motriz abre la válvula, la válvula deja bajar la carga, y al bajar cambia la presión motriz. Con R alta y mucho volumen entre la válvula y el actuador, el lazo se hace inestable y la máquina cabecea.'},
  reto:{nombre:'Reto',cam:[[4.8,3.6,8.6],[1.20,1.30,0.05]],
    mision:'Cuatro ejes y seis criterios que hay que cumplir a la vez. Monta el conjunto válido más barato para la estación que te toca; a igualdad de coste gana el que menos calienta.'},
};
const lbl=t=>`<span style="align-self:center;color:var(--muted);font-size:12px;margin:0 4px 0 2px">${t}</span>`;
function optBtns(key,opts,cur){
  return opts.map(o=>{
    const v=Array.isArray(o)?o[0]:o, t=Array.isArray(o)?o[1]:o;
    return `<button class="b sm ${String(cur)===String(v)?'on':''}" data-${key}="${v}">${t}</button>`;
  }).join('');
}
const beep=()=>synth.beep(680,0.05,0.04);
const OPT_EST =EST_KEYS.map(k=>[k,ESTACIONES[k].nom.split(' ')[0]]);
const OPT_R   =RATIOS.map(r=>[r,R_ROT[r]]);
const OPT_TAR =TARADOS.map(t=>[t,f1(t,0)+' bar']);
const OPT_DREN=DREN_KEYS.map(k=>[k,DREN_ROT[k]]);
const OPT_MONT=MONT_KEYS.map(k=>[k,MONT_ROT[k].replace('En bloque de mando','Bloque').replace('Brida sobre el actuador','Brida').replace('Manguera corta','Manguera')]);

function buildControls(){
  const bar=el('selbar');let h='';
  if(mode==='induc'){
    h+=lbl('Estación')+optBtns('ie',OPT_EST,ST.induc.est);
    h+=lbl('Tarado')+optBtns('it',OPT_TAR,ST.induc.tarado);
  }else if(mode==='descenso'){
    h+=lbl('Estación')+optBtns('de',OPT_EST,ST.descenso.est);
    h+=lbl('Relación')+optBtns('dr',OPT_R,ST.descenso.ratio);
    h+=lbl('Tarado')+optBtns('dt',OPT_TAR,ST.descenso.tarado);
    h+=lbl('Drenaje')+optBtns('dd',OPT_DREN,ST.descenso.dren);
  }else if(mode==='pilotaje'){
    h+=lbl('Estación')+optBtns('pe',OPT_EST,ST.pilotaje.est);
    h+=lbl('Relación')+optBtns('pr',OPT_R,ST.pilotaje.ratio);
    h+=lbl('Tarado')+optBtns('pt',OPT_TAR,ST.pilotaje.tarado);
    h+=lbl('Drenaje')+optBtns('pd',OPT_DREN,ST.pilotaje.dren);
  }else if(mode==='estab'){
    h+=lbl('Estación')+optBtns('ee',OPT_EST,ST.estab.est);
    h+=lbl('Relación')+optBtns('er',OPT_R,ST.estab.ratio);
    h+=lbl('Montaje')+optBtns('em',OPT_MONT,ST.estab.mont);
  }else{
    h+=lbl('Relación')+optBtns('xr',OPT_R,RETO.cfg.ratio);
    h+=lbl('Tarado')+optBtns('xt',OPT_TAR,RETO.cfg.tarado);
    h+=lbl('Drenaje')+optBtns('xd',OPT_DREN,RETO.cfg.dren);
    h+=lbl('Montaje')+optBtns('xm',OPT_MONT,RETO.cfg.mont);
    h+='<button class="b sm" id="btnPista">💡 Pista</button>';
  }
  bar.innerHTML=h;bar.style.display='flex';
  const wire=(attr,fn)=>bar.querySelectorAll('['+attr+']').forEach(b=>{
    b.onclick=()=>{if(autoRunning)return;fn(b.getAttribute(attr));beep();afterEdit();};
  });
  wire('data-ie',v=>{ST.induc.est=v;});
  wire('data-it',v=>{ST.induc.tarado=Number(v);});
  wire('data-de',v=>{ST.descenso.est=v;});
  wire('data-dr',v=>{ST.descenso.ratio=Number(v);});
  wire('data-dt',v=>{ST.descenso.tarado=Number(v);});
  wire('data-dd',v=>{ST.descenso.dren=v;});
  wire('data-pe',v=>{ST.pilotaje.est=v;});
  wire('data-pr',v=>{ST.pilotaje.ratio=Number(v);});
  wire('data-pt',v=>{ST.pilotaje.tarado=Number(v);});
  wire('data-pd',v=>{ST.pilotaje.dren=v;});
  wire('data-ee',v=>{ST.estab.est=v;});
  wire('data-er',v=>{ST.estab.ratio=Number(v);});
  wire('data-em',v=>{ST.estab.mont=v;});
  wire('data-xr',v=>{RETO.cfg={...RETO.cfg,ratio:Number(v)};RETO.msg='';RETO.resuelto=false;});
  wire('data-xt',v=>{RETO.cfg={...RETO.cfg,tarado:Number(v)};RETO.msg='';RETO.resuelto=false;});
  wire('data-xd',v=>{RETO.cfg={...RETO.cfg,dren:v};RETO.msg='';RETO.resuelto=false;});
  wire('data-xm',v=>{RETO.cfg={...RETO.cfg,mont:v};RETO.msg='';RETO.resuelto=false;});
  const bp=el('btnPista');
  if(bp) bp.onclick=()=>{if(autoRunning)return;pista();};
}
// Una pista destapa UN eje: dice que valores de ese eje llevan a una solucion
// de coste minimo. No resuelve el reto, porque los cuatro ejes se juzgan juntos
// y acertar uno no garantiza que la combinacion valga.
const EJE_VAL_ROT={ratio:v=>R_ROT[v],tarado:v=>f1(v,0)+' bar',dren:v=>DREN_ROT[v],mont:v=>MONT_ROT[v]};
function pista(){
  const eje=EJES.find(e=>!RETO.ejes[e]);
  if(!eje){showToast('💡 Ya has destapado los cuatro ejes. La combinación la tienes que cerrar tú.');return;}
  RETO.ejes[eje]=true;beep();
  const vals=ejeSolC(ST.reto.est,eje).map(v=>EJE_VAL_ROT[eje](v)).join(' · ');
  showToast('💡 <b>'+EJE_ROT[eje]+'.</b> Con el resto en su sitio, sirve: '+(vals||'ninguno de los valores disponibles'));
  afterEdit();
}

function updateScenarioInfo(){
  const d=el('scenarioInfo');
  d.style.display='block';
  d.innerHTML='<b>'+MODE_META[mode].nombre+'.</b> '+MODE_META[mode].mision;
}
function updateHwRot(){
  const k=estAct(), E=ESTACIONES[k], c=cfgDe(mode);
  el('hwrot').textContent=E.nom;
  el('hwsub').textContent=EST_SUB[k]+' · '+R_ROT[c.ratio]+' · '+f1(c.tarado,0)+' bar · '+
    DREN_ROT[c.dren]+' · '+MONT_ROT[c.mont];
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
// "Nuevo escenario": en el reto cambia de estacion y rearma la configuracion de
// partida; en los modos de estudio mueve el ensayo al siguiente caso que ensena
// algo, en vez de dejarlo donde estaba.
function newSignal(){
  if(mode==='induc'){
    const i=EST_KEYS.indexOf(ST.induc.est);ST.induc.est=EST_KEYS[(i+1)%EST_KEYS.length];
    const j=TARADOS.indexOf(ST.induc.tarado);ST.induc.tarado=TARADOS[(j+1)%TARADOS.length];
  }else if(mode==='descenso'){
    const i=EST_KEYS.indexOf(ST.descenso.est);ST.descenso.est=EST_KEYS[(i+1)%EST_KEYS.length];
    const o=solucion(ST.descenso.est);
    if(o){ST.descenso.tarado=o.tarado;ST.descenso.dren=o.dren;}
  }else if(mode==='pilotaje'){
    const i=RATIOS.indexOf(ST.pilotaje.ratio);ST.pilotaje.ratio=RATIOS[(i+1)%RATIOS.length];
    const j=DREN_KEYS.indexOf(ST.pilotaje.dren);
    if(i+1>=RATIOS.length)ST.pilotaje.dren=DREN_KEYS[(j+1)%DREN_KEYS.length];
  }else if(mode==='estab'){
    const i=MONT_KEYS.indexOf(ST.estab.mont);ST.estab.mont=MONT_KEYS[(i+1)%MONT_KEYS.length];
    if(i+1>=MONT_KEYS.length){const j=EST_KEYS.indexOf(ST.estab.est);ST.estab.est=EST_KEYS[(j+1)%EST_KEYS.length];}
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

// ===================== 12. TELEMETRIA E INFORME =====================
function teleRow(l,v,cls){
  return '<div class="trow"><span class="tl">'+l+'</span><span class="tv'+(cls?' '+cls:'')+'">'+v+'</span></div>';
}
const cls2=b=>b?'ok':'bad';
// R critica: el valor de relacion de pilotaje al que ME cae justo a 1. Como ME es
// inversamente proporcional a R, sale de una division y no hace falta barrer.
function rCrit(estK,montK){ return margenEstab(estK,1,montK); }

function updateTele(){
  const c=cfgDe(mode), E=ESTACIONES[c.est], r=CUR;
  let h='';
  if(mode==='induc'){
    h+=teleRow('Carga que cuelga',f1(E.F/1000,1)+' kN');
    h+=teleRow('Área resistente',f1(E.ares,0)+' mm²');
    h+=teleRow('Presión inducida p_ind',f1(r.pInd,1)+' bar');
    h+=teleRow('Tarado mínimo (1,3·p_ind)',f1(K_SUJ*r.pInd,1)+' bar');
    h+=teleRow('Tarado puesto',f1(c.tarado,0)+' bar',cls2(r.okSujecion));
    h+=teleRow('Relación p_ind / tarado',pc1(r.ratio),cls2(r.ratio<1));
    h+=teleRow('Fuga por el asiento',r.abierta?'la válvula está abierta':f1(r.q,3)+' cm³/min',cls2(!r.abierta));
    h+=teleRow('Deriva en 10 min',r.abierta?'—':f1(r.der10,3)+' mm',cls2(r.okFuga));
    h+=teleRow('Tolerancia de la máquina',f1(E.tolDer,2)+' mm');
  }else if(mode==='descenso'){
    h+=teleRow('Caudal de la bomba',f1(E.qb,0)+' L/min');
    h+=teleRow('Velocidad de bajada',f1(r.v,1)+' mm/s');
    h+=teleRow('Caudal por la contrabalance',f1(r.qRes,1)+' L/min');
    h+=teleRow('Presión motriz p_mot',r.sinTarado?'la carga se desboca':f1(r.pMot,1)+' bar',cls2(r.okApertura));
    h+=teleRow('Presión resistente p_res',f1(r.pRes,1)+' bar',cls2(r.okPresion));
    h+=teleRow('Máxima admisible',f1(E.pMaxCil,0)+' bar');
    h+=teleRow('Aporta la bomba',f1(E.qb*Math.max(0,r.pMot)/600,2)+' kW');
    h+=teleRow('Aporta la carga al caer',f1(E.F*r.v/1e6,2)+' kW');
    h+=teleRow('Calor total',f1(r.pCalor,2)+' kW',cls2(r.okTermico));
    h+=teleRow('Puede disipar',f1(E.Pdis,1)+' kW');
  }else if(mode==='pilotaje'){
    h+=teleRow('Relación de pilotaje',R_ROT[c.ratio]);
    h+=teleRow('Drenaje del muelle',DREN_ROT[c.dren]);
    h+=teleRow('Factor f_bp',f1(r.F_bp,1)+' ×');
    h+=teleRow('Contrapresión del retorno',f1(E.pBp,0)+' bar');
    h+=teleRow('Lo que el muelle ve de ella',f1(r.F_bp*E.pBp,1)+' bar',cls2(r.F_bp*E.pBp<=E.pBp*1.05));
    h+=teleRow('Sobrepresión por caudal',f1(r.dpOv,1)+' bar');
    h+=teleRow('Presión efectiva p_eff',f1(r.pEff,1)+' bar');
    h+=teleRow('Presión motriz p_mot',r.sinTarado?'la carga se desboca':f1(r.pMot,1)+' bar',cls2(r.okApertura));
    h+=teleRow('Límite del grupo − margen',f1(E.pLim-MARG_AB,0)+' bar');
    h+=teleRow('Calor total',f1(r.pCalor,2)+' kW',cls2(r.okTermico));
  }else if(mode==='estab'){
    const vv=volumenes(c.est,c.mont), pl=poli(c.est,c.ratio,c.mont,1e-11,E.masa), rz=raices(pl.c2,pl.c1,pl.c0);
    const wn=Math.max(...rz.map(z=>Math.abs(z.im)));
    h+=teleRow('Volumen resistente V_res',f1(vv.vRes,0)+' cm³');
    h+=teleRow('Volumen motriz V_mot',f1(vv.vMot,0)+' cm³');
    h+=teleRow('R·A_mot·V_res',f1(c.ratio*E.amot*vv.vRes/1000,0)+' ×10³');
    h+=teleRow('A_res·V_mot',f1(E.ares*vv.vMot/1000,0)+' ×10³');
    h+=teleRow('Margen ME',f1(r.me,2),cls2(r.okEstab));
    h+=teleRow('Exigido',f1(ME_MIN,2));
    h+=teleRow('R crítica de este montaje',f1(rCrit(c.est,c.mont),2)+' : 1');
    h+=teleRow('Parte real mayor',f1(Math.max(...rz.map(z=>z.re)),2)+' 1/s',cls2(Math.max(...rz.map(z=>z.re))<0));
    h+=teleRow('Frecuencia del par complejo',wn>0?f1(wn/2/Math.PI,2)+' Hz':'sin par complejo');
    h+=teleRow('Routh c₂c₁ − c₀',f1(pl.routh,0),cls2(pl.routh>0));
  }else{
    const o=optimo(ST.reto.est);
    h+=teleRow('Estación',E.nom);
    h+=teleRow('Coste de tu conjunto',f1(r.coste,0),o?cls2(r.valido&&r.coste===o.best.coste):'');
    h+=teleRow('Coste mínimo posible',o?f1(o.best.coste,0):'—');
    h+=teleRow('Calor de tu conjunto',f1(r.pCalor,2)+' kW',cls2(r.okTermico));
    h+=teleRow('Criterios cumplidos',f1(CRIT.filter(k=>r[k]).length,0)+' de 6',cls2(r.valido));
    h+=teleRow('Ejes acertados',f1(EJES.filter(k=>ejeSolC(ST.reto.est,k).indexOf(RETO.cfg[k])>=0).length,0)+' de 4');
    h+=teleRow('Configuraciones válidas',o?f1(o.validas,0)+' de 225':'ninguna');
    h+=teleRow('Estado',RETO.resuelto?'resuelto':(r.valido?'válida, no óptima':'no válida'),
      RETO.resuelto?'ok':(r.valido?'':'bad'));
  }
  el('tele').innerHTML=h;
}

// El informe es la parte que el alumno se lleva escrita: dice por que sale lo que
// sale, no solo cuanto vale. Cada modo cierra con la consecuencia de ingenieria.
function updateReport(){
  const c=cfgDe(mode), E=ESTACIONES[c.est], r=CUR;
  let L=[];
  if(mode==='induc'){
    L.push('Estación: '+E.nom+'.');
    L.push('La carga de '+f1(E.F/1000,1)+' kN empuja sobre '+f1(E.ares,0)+' mm² de cámara resistente,');
    L.push('así que ella sola pone p_ind = 10·F/A_res = '+f1(r.pInd,1)+' bar en esa cámara.');
    L.push('Para sujetarla con margen hace falta un tarado de al menos 1,3·p_ind = '+f1(K_SUJ*r.pInd,1)+' bar.');
    L.push('Tienes '+f1(c.tarado,0)+' bar → '+(r.okSujecion?'sujeta.':'NO sujeta: la carga baja sola.'));
    if(r.abierta){
      L.push('Con este tarado la presión inducida iguala o supera el ajuste: la válvula no gotea,');
      L.push('está abierta de par en par y el actuador se desploma. Aquí no hay fuga que medir.');
    }else{
      L.push('Al '+pc1(r.ratio)+' del tarado el asiento deja pasar '+f1(r.q,3)+' cm³/min a '+f1(E.T,0)+' °C,');
      L.push('que sobre '+f1(E.ares,0)+' mm² son '+f1(r.der10,3)+' mm de caída en diez minutos');
      L.push('frente a los '+f1(E.tolDer,2)+' mm que admite la máquina → '+(r.okFuga?'aguanta.':'NO aguanta.'));
      L.push('Ojo: la fuga cae con el tarado porque el asiento trabaja más cerrado, y cae con');
      L.push('el aceite frío porque es más viscoso. En la prensa, a '+f1(ESTACIONES.prensa.T,0)+' °C, el aceite es');
      L.push('1,5 veces menos viscoso que a 40 °C y por eso su tolerancia es la más difícil.');
    }
  }else if(mode==='descenso'){
    L.push('La bomba mete '+f1(E.qb,0)+' L/min en la cámara motriz de '+f1(E.amot,0)+' mm²:');
    L.push('la máquina baja a '+f1(r.v,1)+' mm/s y por la contrabalance salen '+f1(r.qRes,1)+' L/min.');
    L.push('El carrete se equilibra con p_res + R·p_mot = p_eff = '+f1(r.pEff,1)+' bar,');
    L.push('y con p_res = p_mot·A_mot/A_res + p_ind sale p_mot = '+f1(r.pMot,1)+' y p_res = '+f1(r.pRes,1)+' bar.');
    if(r.sinTarado) L.push('AVISO: p_eff no llega a p_ind. La válvula ni siquiera cierra: la carga manda.');
    L.push('Energía: la bomba pone '+f1(E.qb*Math.max(0,r.pMot)/600,2)+' kW y la carga al caer pone');
    L.push(f1(E.F*r.v/1e6,2)+' kW. Las dos acaban en la válvula: '+f1(r.pCalor,2)+' kW de calor');
    L.push('frente a '+f1(E.Pdis,1)+' kW que el equipo puede disipar → '+(r.okTermico?'bien.':'se calienta.'));
    L.push('Ésa es la clave: al bajar, la carga NO cuesta energía, la REGALA, y toda la regala');
    L.push('a la contrabalance en forma de calor. Bajar más despacio es la única forma de bajarla.');
  }else if(mode==='pilotaje'){
    L.push('Drenaje '+DREN_ROT[c.dren]+': '+DREN_SUB[c.dren]+'.');
    L.push('Con R = '+R_ROT[c.ratio]+' eso da f_bp = '+f1(r.F_bp,1)+', así que los '+f1(E.pBp,0)+' bar de');
    L.push('retorno se convierten en '+f1(r.F_bp*E.pBp,1)+' bar que el muelle tiene que vencer.');
    L.push('Sumado al tarado y a los '+f1(r.dpOv,1)+' bar de sobrepresión por caudal, p_eff = '+f1(r.pEff,1)+' bar.');
    L.push('De ahí sale la presión de pilotaje: p_mot = '+f1(r.pMot,1)+' bar'+
      (r.noAbre?' — por encima del límite útil del grupo.':'.'));
    L.push('Subir R baja el pilotaje y baja el calor, y ésa es la tentación.');
    L.push('Pero con drenaje interno subir R multiplica la contrapresión: es el mismo mando');
    L.push('el que abarata el pilotaje y el que encarece el retorno. Ventilar el muelle rompe');
    L.push('ese acoplamiento de un plumazo, y cuesta '+f1(DRENES.vent.coste,0)+' unidades más.');
  }else if(mode==='estab'){
    const vv=volumenes(c.est,c.mont), pl=poli(c.est,c.ratio,c.mont,1e-11,E.masa), rz=raices(pl.c2,pl.c1,pl.c0);
    const rmax=Math.max(...rz.map(z=>z.re));
    L.push('Montaje '+MONT_ROT[c.mont]+': '+MONT_SUB[c.mont]+'.');
    L.push('Eso deja V_res = '+f1(vv.vRes,0)+' cm³ contra V_mot = '+f1(vv.vMot,0)+' cm³.');
    L.push('Routh sobre el modelo de tercer orden reduce c₂c₁ > c₀ a R·A_mot·V_res < A_res·V_mot,');
    L.push('es decir ME = A_res·V_mot / (R·A_mot·V_res) = '+f1(r.me,2)+' frente a '+f1(ME_MIN,2)+' exigido.');
    L.push('Ni la masa ni la ganancia del carrete aparecen en la condición: el que la máquina');
    L.push('sea pesada o la válvula muy sensible no salva un montaje mal hecho.');
    L.push('Raíces con K = 1e-11 y '+f1(E.masa,0)+' kg: parte real mayor '+f1(rmax,2)+' 1/s → '+
      (rmax<0?'se amortigua.':'CRECE: la máquina cabecea.'));
    L.push('Fíjate en que mover R apenas toca la frecuencia; lo que mueve es el amortiguamiento.');
    L.push('Por eso el cabeceo de una contrabalance suena siempre igual y sólo cambia si se va o no.');
    L.push('Con este montaje la R crítica está en '+f1(rCrit(c.est,c.mont),2)+' : 1.');
  }else{
    const o=optimo(ST.reto.est);
    L.push('Estación: '+E.nom+' · '+EST_SUB[ST.reto.est]+'.');
    L.push('De las 225 combinaciones, '+(o?f1(o.validas,0):'0')+' cumplen los seis criterios.');
    L.push('Tu conjunto cuesta '+f1(r.coste,0)+' y calienta '+f1(r.pCalor,2)+' kW.');
    if(r.fallos.length) L.push('Fallan: '+r.fallos.map(k=>CRIT_ROT[k]).join(' · ')+'.');
    else L.push('Cumple los seis. '+(o&&r.coste===o.best.coste?'Y con el coste mínimo.':'Pero la hay más barata.'));
    if(RETO.msg) L.push(RETO.msg);
    L.push('Recuerda el orden: primero el coste del conjunto, y sólo a igualdad de coste, el calor.');
  }
  el('report').innerHTML=L.map(t=>'<div>'+t+'</div>').join('');
}

function refreshAll(){
  computa();
  drawBoard();
  updateTele();
  updateReport();
  updateHwRot();
  updateHW();
}

// ===================== 13. RETO =====================
function retoSolveBuild(silent){
  const estK=ST.reto.est;
  RETO.sol=solucion(estK);
  RETO.cfg=startCfg(estK);
  RETO.ejes={};
  RETO.hechos=[];
  RETO.resuelto=false;
  RETO.msg='';
  solved=false;
  if(!silent) showToast('🎯 <b>Reto nuevo.</b> '+ESTACIONES[estK].nom);
}
function updateRetoSpec(){
  const estK=ST.reto.est, E=ESTACIONES[estK], o=optimo(estK);
  const c=RETO.cfg, r=CUR;
  const crit=CRIT.map(k=>'<span style="color:'+(r[k]?OK_HEX:BAD_HEX)+'">'+
    (r[k]?'✓':'✗')+' '+CRIT_LET[k]+'</span>').join(' &nbsp; ');
  el('retoSpec').innerHTML=
    '<b>'+E.nom+'</b> · '+EST_SUB[estK]+'<br>'+
    'Carga '+f1(E.F/1000,1)+' kN · bomba '+f1(E.qb,0)+' L/min · retorno '+f1(E.pBp,0)+' bar · '+
    'aceite a '+f1(E.T,0)+' °C · deriva máxima '+f1(E.tolDer,2)+' mm/10 min · '+
    'disipación '+f1(E.Pdis,1)+' kW · límite del actuador '+f1(E.pMaxCil,0)+' bar.<br>'+
    'Monta el conjunto <b>válido más barato</b>; a igualdad de coste, el que menos caliente.<br>'+
    '<span style="color:var(--muted)">Ahora: '+R_ROT[c.ratio]+' · '+f1(c.tarado,0)+' bar · '+
    DREN_ROT[c.dren]+' · '+MONT_ROT[c.mont]+' → coste '+f1(r.coste,0)+
    (o?' (mínimo '+f1(o.best.coste,0)+')':'')+'</span><br>'+crit;
}
// El texto de cierre no repite la respuesta: dice POR QUE cada eje esta donde esta,
// y de paso avisa de los empates, porque en varias estaciones hay mas de una solucion.
function retoExplain(){
  const estK=ST.reto.est, E=ESTACIONES[estK], o=optimo(estK), s=RETO.sol;
  if(!o||!s) return 'Esta estación no tiene ninguna configuración válida.';
  const b=o.best;
  const p=[];
  p.push('La carga induce '+f1(b.pInd,1)+' bar, así que el tarado no puede bajar de '+
    f1(K_SUJ*b.pInd,1)+' bar; con '+f1(s.tarado,0)+' bar sujeta y la deriva se queda en '+
    f1(b.der10,3)+' mm frente a '+f1(E.tolDer,2)+' admitidos.');
  p.push('La relación '+R_ROT[s.ratio]+' es la que deja ME = '+f1(b.me,2)+
    ' por encima del '+f1(ME_MIN,2)+' exigido: subirla abarata la válvula pero se lleva el margen por delante.');
  p.push('El drenaje '+DREN_ROT[s.dren].toLowerCase()+' hace que la contrapresión pese '+
    f1(b.F_bp*E.pBp,1)+' bar en el muelle en vez de multiplicarse.');
  p.push('El montaje ('+MONT_ROT[s.mont].toLowerCase()+') fija V_res, y V_res es el que decide la estabilidad.');
  p.push('Resultado: coste '+f1(b.coste,0)+' y '+f1(b.pCalor,2)+' kW de calor, dentro de los '+
    f1(E.Pdis,1)+' kW que se pueden evacuar.');
  if(o.empatesTot>1) p.push('Hay '+f1(o.empatesTot,0)+' configuraciones exactamente igual de buenas: cualquiera vale.');
  return p.join(' ');
}
function checkReto(){
  const estK=ST.reto.est, o=optimo(estK), r=CUR;
  // destapar los ejes que ya estan bien: no regala la solucion, confirma lo acertado
  EJES.forEach(k=>{ if(ejeSolC(estK,k).indexOf(RETO.cfg[k])>=0) RETO.ejes[k]=true; });
  const optimoOk=!!o && r.valido && r.coste===o.best.coste && Math.abs(r.pCalor-o.best.pCalor)<1e-9;
  RETO.resuelto=optimoOk;
  if(optimoOk){
    solved=true;
    RETO.msg=retoExplain();
    if(!autoRunning) showToast('✅ <b>Conjunto óptimo.</b> '+retoExplain());
  }else if(r.valido){
    RETO.msg='Cumple los seis criterios, pero cuesta '+f1(r.coste,0)+
      (o?' y se puede bajar a '+f1(o.best.coste,0)+'.':'.')+
      ' Mira qué eje te está cobrando de más.';
    if(!autoRunning) showToast('🟡 <b>Válida, pero no la más barata.</b> '+RETO.msg);
  }else{
    const f=r.fallos.map(k=>CRIT_ROT[k]+' ('+CRIT_POR[k]+')');
    RETO.msg='Todavía falla: '+f.join('; ')+'.';
    if(!autoRunning) showToast('❌ <b>Aún no.</b> '+RETO.msg);
  }
  synth.beep(optimoOk?880:200,0.10,0.05);
  refreshAll();
  updateRetoSpec();
  return optimoOk;
}

// ===================== 14. CUESTIONARIO =====================
const QUIZ={
  induc:{pregunta:'La pluma cuelga 68,0 kN sobre 12 272 mm² de cámara resistente. ¿Cuál es el tarado más bajo de la lista que la sujeta en reposo con el margen que pide la norma de taller?',
    opciones:[
      {t:'105 bar',ok:true,why:'p_ind = 10·68 000/12 272 = 55,4 bar y el criterio pide 1,3·p_ind = 72,0 bar. 70 se queda a dos bar; el siguiente escalón disponible es 105.'},
      {t:'70 bar',ok:false,why:'Se queda corto por poco: hacen falta 72,0 bar y 70 no llega. Y "por poco" en una pluma significa que baja sola.'},
      {t:'55 bar, justo la presión inducida',ok:false,why:'Tarar justo en p_ind deja la válvula en el punto de abrir: no sujeta nada y además fuga a chorro.'},
      {t:'280 bar, cuanto más alto mejor',ok:false,why:'Tarar de más no es gratis: obliga a más presión de pilotaje, calienta más y puede pasarse del límite del actuador.'}]},
  descenso:{pregunta:'La pluma baja con su conjunto óptimo: la bomba aporta 1,68 kW y el calor total es 5,71 kW. ¿De dónde sale la diferencia?',
    opciones:[
      {t:'De la propia carga, que al caer devuelve energía potencial',ok:true,why:'F·v = 68 000·59,4 mm/s = 4,04 kW. Bajar una carga no consume energía: la libera, y la contrabalance es quien tiene que tragársela en forma de calor.'},
      {t:'Del motor eléctrico, que trabaja más al bajar',ok:false,why:'El motor sólo mueve la bomba, y la bomba aporta 1,68 kW. Los otros 4 kW no pasan por el motor.'},
      {t:'De la fricción de las juntas del cilindro',ok:false,why:'La fricción existe, pero este modelo ni la incluye y aun así el balance cierra: la energía es de la carga.'},
      {t:'De la compresibilidad del aceite',ok:false,why:'La compresibilidad almacena y devuelve energía dentro del ciclo, no la aporta de forma sostenida.'}]},
  pilotaje:{pregunta:'Pluma con 6 bar de contrapresión en el retorno, relación 10:1 y drenaje interno del muelle. ¿Cuánta presión de más tiene que vencer la válvula por culpa de esa contrapresión?',
    opciones:[
      {t:'66 bar',ok:true,why:'Con drenaje interno f_bp = 1 + R = 11, así que 6 bar de retorno se convierten en 66 bar sobre el muelle. Seis bar que nadie mira acaban costando sesenta y seis.'},
      {t:'6 bar, los mismos que hay en el retorno',ok:false,why:'Eso sería con drenaje balanceado (f_bp = 1). Con drenaje interno la contrapresión entra multiplicada por (1+R).'},
      {t:'60 bar',ok:false,why:'Casi: el factor es 1 + R = 11, no R = 10. La contrapresión actúa también sobre el área del asiento.'},
      {t:'Ninguna: el retorno no afecta a la contrabalance',ok:false,why:'Sólo con el muelle ventilado al tanque. Con drenaje interno o balanceado el retorno sí entra en el equilibrio.'}]},
  estab:{pregunta:'En la pluma con manguera corta, subir la relación de 1,5:1 a 10:1 lleva las raíces de −0,48 ± 94,5i a +3,81 ± 94,8i. ¿Qué te está diciendo ese movimiento?',
    opciones:[
      {t:'Que R se come el amortiguamiento sin tocar la frecuencia: el cabeceo pasa de apagarse a crecer, y suena igual en los dos casos',ok:true,why:'La parte imaginaria apenas se mueve (15,04 → 15,09 Hz) y la real cruza a positiva. Por eso el cabeceo de una contrabalance siempre suena parecido: lo que cambia es si se va o no.'},
      {t:'Que la máquina va a vibrar mucho más rápido',ok:false,why:'La frecuencia se queda en ~15 Hz en los dos casos. Lo que cambia es el signo de la parte real.'},
      {t:'Que hace falta más masa para estabilizarla',ok:false,why:'La condición de Routh se reduce a R·A_mot·V_res < A_res·V_mot: la masa se cancela y no aparece.'},
      {t:'Que hay que bajar la ganancia del carrete',ok:false,why:'La ganancia K tampoco aparece en la condición de estabilidad. Cambia la velocidad del transitorio, no si converge.'}]},
  reto:{pregunta:'Dos conjuntos cumplen los seis criterios. Uno cuesta 14 y disipa 6,1 kW; el otro cuesta 17 y disipa 4,6 kW. ¿Cuál gana con el orden declarado en este laboratorio?',
    opciones:[
      {t:'El de coste 14: primero el coste del conjunto y sólo a igualdad de coste, el calor',ok:true,why:'El orden es lexicográfico y está declarado: coste primero, calor como desempate. En una máquina real el orden lo fija el pliego; lo que no vale es dejarlo implícito.'},
      {t:'El de 4,6 kW, porque el calor es lo que mata las máquinas',ok:false,why:'Es un criterio defendible, pero no es el declarado aquí. Cambiar el orden a mitad de un estudio es cómo se cuelan las decisiones arbitrarias.'},
      {t:'Da igual: los dos son válidos',ok:false,why:'Los dos son válidos, sí, pero el reto pide el óptimo, y sin un orden total no hay óptimo.'},
      {t:'El que tenga la relación de pilotaje más alta',ok:false,why:'La relación de pilotaje no es un criterio de decisión: es una de las variables que se ajustan.'}]},
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

// ===================== 15. SELECCION Y ETIQUETAS =====================
const PICK_INFO={
  grupo:()=>{const E=ESTACIONES[estAct()];
    return ['Grupo de accionamiento','La bomba entrega '+f1(E.qb,0)+' L/min contra un límite de '+
      f1(E.pLim,0)+' bar. Al bajar la carga sólo aporta '+f1(E.qb*Math.max(0,CUR.pMot)/600,2)+
      ' kW: el resto lo pone la carga al caer.'];},
  dir:()=>{const E=ESTACIONES[estAct()];
    return ['Válvula direccional 4/3','Manda el caudal a la cámara motriz y devuelve el retorno al tanque con '+
      f1(E.pBp,0)+' bar de contrapresión. Esos bar no son inocentes: según el drenaje del muelle, la contrabalance los ve multiplicados por '+
      f1(CUR.F_bp,1)+'.'];},
  cb:()=>{const c=cfgDe(mode);
    return ['Válvula de contrabalance','Tarada a '+f1(c.tarado,0)+' bar con relación '+R_ROT[c.ratio]+
      ' y drenaje '+DREN_ROT[c.dren].toLowerCase()+'. Ahora mismo su carrete se equilibra con p_res + R·p_mot = '+
      f1(CUR.pEff,1)+' bar y se está comiendo '+f1(CUR.pCbv,2)+' kW en forma de calor.'];},
  act:()=>{const E=ESTACIONES[estAct()];
    return [E.tipo==='mot'?'Motor hidráulico y tambor':'Cilindro',
      'Cámara motriz '+f1(E.amot,0)+' mm² a '+f1(Math.max(0,CUR.pMot),1)+' bar · cámara resistente '+
      f1(E.ares,0)+' mm² a '+f1(CUR.pRes,1)+' bar. Límite del componente: '+f1(E.pMaxCil,0)+' bar'+
      (CUR.okPresion?'.':' — lo estás pasando.')];},
  carga:()=>{const E=ESTACIONES[estAct()];
    return ['La carga negativa',f1(E.F/1000,1)+' kN que tiran en el sentido del movimiento. Sola pone '+
      f1(CUR.pInd,1)+' bar en la cámara resistente, y al bajar a '+f1(CUR.v,1)+' mm/s devuelve '+
      f1(E.F*CUR.v/1e6,2)+' kW que hay que quemar en algún sitio.'];},
  tab:()=>['Instrumentos','Presión motriz, presión resistente y calor disipado, con el veredicto de los seis criterios. '+
    (CUR.valido?'Ahora mismo la configuración es válida.':'Ahora fallan: '+CUR.fallos.map(k=>CRIT_ROT[k]).join(', ')+'.')],
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
// padres: hay que filtrar a mano subiendo por la jerarquia, o la etiqueta de la
// camara del cilindro aparece con el cabrestante montado.
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
    // --- 1. presion inducida ---
    setMode('induc'); ST.induc.est='pluma'; ST.induc.tarado=70; afterEdit();
    showToast('Empezamos con la máquina parada. La carga cuelga y ya pone presión en la cámara resistente sin que nadie toque nada.');
    await sleep(3600);
    showToast('Pluma: '+f1(CUR.pInd,1)+' bar de presión inducida. El criterio de sujeción pide 1,3 veces eso, es decir '+
      f1(K_SUJ*CUR.pInd,1)+' bar. Con 70 bar tarados '+(CUR.okSujecion?'llega':'NO llega')+'.');
    await sleep(4200);
    ST.induc.tarado=105; afterEdit();
    showToast('Con 105 bar sí sujeta, y además la deriva baja a '+f1(CUR.der10,3)+
      ' mm en diez minutos frente a los '+f1(ESTACIONES.pluma.tolDer,2)+' que admite la máquina. Tarar más cierra el asiento.');
    await sleep(4400);
    ST.induc.est='prensa'; ST.induc.tarado=70; afterEdit();
    showToast('La prensa trabaja a 65 °C: el aceite es '+f1(muT(40)/muT(ESTACIONES.prensa.T),1)+
      ' veces menos viscoso que a 40 °C y su tolerancia es de sólo '+
      f1(ESTACIONES.prensa.tolDer,2)+' mm. Con 70 bar la deriva sale '+f1(CUR.der10,3)+' mm: la única que falla la fuga en solitario.');
    await sleep(5000);

    // --- 2. el punto de trabajo ---
    setMode('descenso');
    ST.descenso.est='pluma'; ST.descenso.ratio=1.5; ST.descenso.tarado=105; ST.descenso.dren='int'; afterEdit();
    showToast('Ahora baja. La bomba mete '+f1(ESTACIONES.pluma.qb,0)+' L/min y la máquina desciende a '+
      f1(CUR.v,1)+' mm/s con '+f1(CUR.pMot,1)+' bar de pilotaje y '+f1(CUR.pRes,1)+' bar en la cámara resistente.');
    await sleep(4600);
    showToast('Mira el reparto: la bomba pone '+f1(ESTACIONES.pluma.qb*CUR.pMot/600,2)+
      ' kW y la carga al caer pone '+f1(ESTACIONES.pluma.F*CUR.v/1e6,2)+' kW. Total '+f1(CUR.pCalor,2)+
      ' kW de calor. Bajar una carga no cuesta energía: la regala, y hay que quemarla.');
    await sleep(5200);
    ST.descenso.est='prensa'; ST.descenso.tarado=280; afterEdit();
    showToast('En la prensa el vástago baja hacia dentro: la cámara resistente es la corona y la contrabalance INTENSIFICA. Con 280 bar tarados la corona llega a '+
      f1(CUR.pRes,1)+' bar, por encima de los '+f1(ESTACIONES.prensa.pMaxCil,0)+' que aguanta el cilindro.');
    await sleep(5200);

    // --- 3. pilotaje y drenaje ---
    setMode('pilotaje');
    ST.pilotaje.est='pluma'; ST.pilotaje.ratio=1.5; ST.pilotaje.tarado=105; ST.pilotaje.dren='int'; afterEdit();
    const pm15=CUR.pMot, bp15=CUR.F_bp*ESTACIONES.pluma.pBp;
    showToast('Relación 1,5:1 con drenaje interno: f_bp = '+f1(CUR.F_bp,1)+', así que los 6 bar de retorno pesan '+
      f1(bp15,1)+' bar en el muelle, y el pilotaje pide '+f1(pm15,1)+' bar.');
    await sleep(4600);
    ST.pilotaje.ratio=10; afterEdit();
    showToast('Subo a 10:1. El pilotaje baja a '+f1(CUR.pMot,1)+' bar, que es lo que todo el mundo busca… pero f_bp sube a '+
      f1(CUR.F_bp,1)+' y esos mismos 6 bar de retorno ahora pesan '+f1(CUR.F_bp*ESTACIONES.pluma.pBp,1)+' bar.');
    await sleep(5200);
    ST.pilotaje.dren='vent'; afterEdit();
    showToast('Ventilando el muelle al tanque la contrapresión deja de contar: el pilotaje baja a '+
      f1(CUR.pMot,1)+' bar. Cuesta '+f1(DRENES.vent.coste,0)+' unidades más de válvula y rompe el acoplamiento de un plumazo.');
    await sleep(5000);

    // --- 4. estabilidad ---
    setMode('estab');
    ST.estab.est='pluma'; ST.estab.ratio=1.5; ST.estab.mont='corta'; afterEdit();
    showToast('Cuarto capítulo: la contrabalance es un lazo cerrado. Con 1,5:1 y manguera corta el margen es ME = '+
      f1(CUR.me,2)+' y las raíces se apagan.');
    await sleep(4400);
    ST.estab.ratio=10; afterEdit();
    showToast('Con 10:1 el margen cae a '+f1(CUR.me,2)+
      ': las raíces cruzan al semiplano derecho y la pluma cabecea. Y fíjate en que la frecuencia se queda en 15 Hz — lo que R mueve es el amortiguamiento.');
    await sleep(5200);
    ST.estab.est='cabrestante'; ST.estab.ratio=4.5; ST.estab.mont='bloque'; afterEdit();
    const meB=CUR.me;
    ST.estab.mont='brida'; afterEdit();
    showToast('Y el montaje decide tanto como R. Cabrestante a 4,5:1: en el bloque de mando el margen es '+
      f1(meB,2)+' y no aguanta; atornillando la misma válvula al actuador sube a '+f1(CUR.me,2)+
      ' y aguanta. Es el mismo hardware: sólo cambia el volumen de manguera que hay que comprimir.');
    await sleep(5400);

    // --- 5. reto ---
    setMode('reto');
    ST.reto.est='tijera'; retoSolveBuild(true); afterEdit();
    showToast('Reto: plataforma de tijera con personas a bordo. De las 225 combinaciones sólo UNA cumple los seis criterios a la vez.');
    await sleep(4400);
    checkReto();
    await sleep(3000);
    const s=solucion('tijera');
    RETO.cfg={ratio:s.ratio,tarado:s.tarado,dren:s.dren,mont:s.mont}; afterEdit();
    checkReto();
    await sleep(1200);
    showToast('Ahí está: '+R_ROT[s.ratio]+' · '+f1(s.tarado,0)+' bar · '+DREN_ROT[s.dren]+' · '+MONT_ROT[s.mont]+
      '. Coste '+f1(CUR.coste,0)+' y '+f1(CUR.pCalor,2)+' kW. Ni un eje se puede mover.');
    await sleep(4600);
    answer(quizCorrectIndex());
  } finally {
    autoRunning=false;
    el('btnAuto').textContent=rot;
  }
}

// ===================== 17. ANIMACION, EVENTOS Y ARRANQUE =====================
// animT recorre [0,2): de 0 a 1 la carga BAJA (es el tramo que estudia el
// laboratorio) y de 1 a 2 la maquina la vuelve a subir deprisa para reponer el
// ciclo. hw.ext es la fraccion de descenso consumida: 0 carga arriba, 1 abajo.
const _pv=new THREE.Vector3();
function faseAnim(){ hw.ext = animT<1 ? animT : (2-animT); }
S.setAnimate((dt,tGlob)=>{
  const r=CUR; if(!r) return;
  const parado=(mode==='induc');
  // sin tarado suficiente la carga se desboca: baja al triple y ni la bomba manda
  const spd=Math.max(0.05, r.v/120)*(r.sinTarado?3:1);
  if(!parado){
    animT+=dt*spd*(animT<1?1:3.2);
    while(animT>=2) animT-=2;
  }
  // el cabeceo del lazo es de ~15 Hz y crece con lo que falta de margen
  const falta=Math.max(0, 1 - r.me/ME_MIN);
  hw.trem = (!r.okEstab && !parado) ? 0.045*falta*Math.sin(tGlob*2*Math.PI*15) : 0;
  faseAnim();
  updateHW();
  // el aceite sigue las lineas; rebuildLineas() rehace las curvas al cambiar de
  // montaje o de estacion, asi que hay que leerlas de LINEAS y no de p.curve.
  for(const p of PART){
    const L=LINEAS[p.key];
    const on = !!L && !parado && (p.key!=='res' || !r.noAbre);
    for(let i=0;i<p.ms.length;i++){
      const m=p.ms[i]; m.visible=on; if(!on) continue;
      p.fase[i]=(p.fase[i]+dt*Math.max(0.05,r.v/90)*0.30)%1;
      L.curve.getPointAt(p.fase[i],_pv);
      m.position.copy(_pv);
    }
  }
});
MODES.forEach(m=>{ el('m_'+m).onclick=()=>{ if(!autoRunning) setMode(m); }; });
el('btnAuto').onclick=()=>{ if(!autoRunning) runAuto(); };
el('btnNew').onclick=()=>{ if(autoRunning) return; newSignal(); };
el('btnCheck').onclick=()=>{ if(autoRunning) return; checkReto(); };
const soundBtn=el('soundBtn');
if(soundBtn){ soundBtn.onclick=()=>{ synth.toggle(); soundBtn.textContent=synth.isOn()?'🔊':'🔇'; }; }
document.addEventListener('pointerdown',()=>{ synth.init(); synth.resume(); },{once:true});

retoSolveBuild(true);
buildQuiz();
computa();          // CUR poblado ANTES del primer cuadro: updateHW lo lee
faseAnim();
updateHW();
drawBoard();
S.start();
setMode('induc');

/* ============================================================
   18. GANCHO DE DEPURACION
   ============================================================ */
window.__labDebug={
  mode:()=>mode, setMode, modes:()=>MODES.slice(),
  // --- constantes del dominio ---
  BETA, OV_NOM, Q_NOM, QF_REF, KF, T_FUGA_REF, K_SUJ, MARG_AB, ME_MIN, D_RES, ACEITE,
  RATIOS, TARADOS, DRENES, MONTAJES, COSTE_R,
  R_KEYS, DREN_KEYS, MONT_KEYS, EJES, EJE_VAL, EJE_ROT,
  ESTACIONES, EST_KEYS, CRIT, CRIT_LET, CRIT_ROT, CRIT_POR,
  R_ROT, DREN_ROT, MONT_ROT, EST_SUB,
  // --- motor ---
  nuT, rhoT, muT, extrapola, fbp, volMang, pInducida,
  punto, fuga, volumenes, margenEstab, poli, raices,
  evalua:(e,R,t,d,m)=>evalua(e,R,t,d,m), evalC, barrido, mejorQue,
  optimo:(e)=>optimo(e), validas, costeMin, solucion,
  okEje, ejeValidos, ejeSol, ejeSolC, ejeValC, startCfg,
  f1, pc1,
  // --- animacion y maquina ---
  animT:()=>animT,
  setAnimT:(t)=>{ animT=((t%2)+2)%2; faseAnim(); refreshAll(); },
  hw:()=>({...hw}),
  cfg:()=>({...cfgDe(mode)}),
  // --- un par Get/Set por modo ---
  inducGet:()=>({...ST.induc}),
  inducSet:(est,tarado)=>{ if(est)ST.induc.est=est; if(tarado!==undefined)ST.induc.tarado=tarado; afterEdit(); },
  descensoGet:()=>({...ST.descenso}),
  descensoSet:(est,ratio,tarado,dren)=>{ if(est)ST.descenso.est=est; if(ratio!==undefined)ST.descenso.ratio=ratio;
    if(tarado!==undefined)ST.descenso.tarado=tarado; if(dren)ST.descenso.dren=dren; afterEdit(); },
  pilotajeGet:()=>({...ST.pilotaje}),
  pilotajeSet:(est,ratio,tarado,dren)=>{ if(est)ST.pilotaje.est=est; if(ratio!==undefined)ST.pilotaje.ratio=ratio;
    if(tarado!==undefined)ST.pilotaje.tarado=tarado; if(dren)ST.pilotaje.dren=dren; afterEdit(); },
  estabGet:()=>({...ST.estab}),
  estabSet:(est,ratio,mont)=>{ if(est)ST.estab.est=est; if(ratio!==undefined)ST.estab.ratio=ratio;
    if(mont)ST.estab.mont=mont; afterEdit(); },
  // --- reto ---
  retoGet:()=>({est:ST.reto.est, cfg:{...RETO.cfg}, sol:RETO.sol?{...RETO.sol}:null}),
  retoSet:(est,cfg)=>{ if(est&&est!==ST.reto.est){ ST.reto.est=est; retoSolveBuild(true); }
    if(cfg){ if(cfg.ratio!==undefined)RETO.cfg.ratio=cfg.ratio; if(cfg.tarado!==undefined)RETO.cfg.tarado=cfg.tarado;
      if(cfg.dren)RETO.cfg.dren=cfg.dren; if(cfg.mont)RETO.cfg.mont=cfg.mont; }
    afterEdit(); },
  retoSolveBuild, checkReto, retoExplain, pista,
  retoSolved:()=>RETO.resuelto, retoMsg:()=>RETO.msg, retoAxes:()=>({...RETO.ejes}),
  // --- cuestionario y control ---
  quizCorrectIndex, quizAnswer:answer, quizText:()=>QUIZ[mode].pregunta,
  quizOptions:()=>QORD.map(i=>QUIZ[mode].opciones[i].t),
  newSignal, cur:()=>CUR, solved:()=>solved, autoRunning:()=>autoRunning,
  runAuto,
};
