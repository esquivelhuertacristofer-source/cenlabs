/* ============================================================================
 * CEN Labs - d4-09 / mecanica-101
 * "Configura la unidad FRL y evalua la calidad del aire"
 * Dominio 4 - Hidraulica y Neumatica - fila 9 de la lista maestra
 * ----------------------------------------------------------------------------
 * MOLDE E+S: ensamble 3D pieza por pieza del tren de tratamiento de aire
 * (posenfriador -> separador -> filtros finos -> secador -> regulador ->
 * lubricador -> punto de uso) y, una vez montado, cinco modos de exploracion
 * sobre un pizarron esquematico dibujado en canvas. Ver el patron completo en
 * memory/patron_molde_e_s_hibrido.md
 * ----------------------------------------------------------------------------
 * NORMAS ANCLA
 *   - ISO 8573-1:2010  clases de pureza [A:B:C] = solidos : agua : aceite.
 *     Las tablas de umbrales (TAB_SOL, TAB_PDP, TAB_LIQ, TAB_ACE) reproducen
 *     los limites de la norma; la clase se asigna al primer escalon que cumple.
 *   - ISO 6358        caida de presion en componentes neumaticos a partir de la
 *     conductancia sonica C y de la relacion critica b, con el mismo tramo
 *     subsonico elipticio de la norma y bloqueo sonico cuando se supera C*p1.
 *   - ISA / practica de aire de instrumentacion: margen de 10 K entre el punto
 *     de rocio a presion y la temperatura minima de la linea.
 *   - Magnus-Sonntag para la presion de saturacion del vapor de agua
 *     (validez declarada -45 C a +60 C; fuera de ese rango el lab avisa de que
 *     esta extrapolando en lugar de callarselo).
 *
 * LO QUE **NO** ES NORMA - criterios de proyecto declarados en el catalogo:
 *   - Los pliegos de cada estacion (presion requerida, caudal, clases exigidas,
 *     lubricacion, tope de energia) son CRITERIOS DE PROYECTO de este lab, no
 *     cifras de norma. Se eligieron para que cada escena tenga una tension
 *     didactica distinta y solucion unica.
 *   - Los costes van en "unidades de catalogo" (u.c.), no en pesos: sirven para
 *     ordenar alternativas, no para presupuestar.
 *   - Las conductancias C y las relaciones b de cada elemento, sus rendimientos
 *     de separacion y sus pisos de saturacion son valores de catalogo tipicos
 *     redondeados, no ensayos.
 *   - 6,7 kW por cada m3/min de aire libre a 7 bar y +7 % de consumo por cada
 *     bar de mas son reglas de dedo del sector, utiles como orden de magnitud.
 *   - El arrastre de aceite del compresor (3 mg/m3 a 30 C, duplicando cada
 *     10 K) es un modelo simplificado propio del lab.
 *
 * MOTOR: copiado VERBATIM del verificador numerico sellado
 * scratchpad/verif_frl.mjs (43 794 aserciones, 0 fallos) entre las marcas
 * MOTOR / FIN MOTOR. Ni una formula reescrita a mano.
 *
 * CERO Math.random() salvo en newReto() (sorteo de escena) y en el barajado
 * Fisher-Yates de las opciones del quiz.
 * ========================================================================== */

/* ============================ MOTOR ============================
 * Unidades: presiones en bar (g = manometrica, abs = absoluta) salvo pSat/pv
 * en mbar; temperaturas en C; caudales en Nl/min salvo donde se indica
 * dm3/s; concentraciones en mg/m3 y contenidos de agua en g/m3 de referencia.
 * NO EDITAR A MANO: regenerar con scratchpad/arma_frl.mjs
 * ============================================================== */

// ---------- constantes fisicas y del banco ----------
const P_ATM      = 1013.25;   // mbar, presion de referencia del banco
const PATM_BAR   = 1.01325;   // bar
const R_V        = 461.5;     // J/(kg K) vapor de agua
const MAG_A      = 6.112;     // hPa  Magnus-Sonntag sobre agua liquida
const MAG_B      = 17.62;
const MAG_C      = 243.12;    // grados C
const MAG_TMIN   = -45;       // banda de validez declarada
const MAG_TMAX   = 60;
const N_REF      = 41.027;    // mol de aire seco por m3 a 20 C y 100 kPa (referencia ISO 8573-1)
const M_H2O      = 18.015;    // g/mol
const WREF_K     = N_REF * M_H2O; // g por m3(ref) al multiplicar por pv/(p-pv)

const DT_POST    = 10;        // K, salto del posenfriador sobre la temperatura ambiente
const DP_REG_MIN = 0.7;       // bar, diferencial minimo que exige el regulador
const DP_TUB     = 0.25;      // bar, caida fija de la tuberia hasta el punto de uso
const P_MAX_RED  = 8.0;       // bar g, presion maxima que puede dar el compresor de la planta
const P_RED_NOM  = 7.0;       // bar g, presion de red de referencia para el consumo especifico
const POT_ESP    = 6.7;       // kW por (m3/min) de aire libre a 7 bar g
const K_BAR      = 0.07;      // +7 % de energia especifica por bar de descarga
const HORAS_ANIO = 6000;      // h/ano
const PRECIO_KWH = 2.5;       // MXN/kWh
const T0_ISO_K   = 293.15;    // K, temperatura de referencia del caudal ANR (20 C)

const ACEITE_BASE = 3.0;      // mg/m3 de arrastre de aceite a 30 C
const T_ACE_REF   = 30;       // grados C
const DEC_ACE     = 10;       // K por duplicacion del arrastre
const FRAC_VAP0   = 0.15;     // fraccion de vapor a 30 C
const FRAC_VAP_MAX= 0.90;

const D0_DROOP   = 0.30;      // bar de caida caracteristica del regulador a caudal nominal
const Q_NOM_G14  = 700;       // Nl/min nominales del cuerpo G1/4

// ---------- psicrometria ----------
function pSat(T){ return MAG_A * Math.exp(MAG_B * T / (MAG_C + T)); }   // mbar
function tRocio(p){                                                     // mbar -> grados C
  if(!(p > 0)) return -Infinity;
  const L = Math.log(p / MAG_A);
  return MAG_C * L / (MAG_B - L);
}
// agua en g por m3 de aire a condiciones de referencia ISO 8573-1
function wRef(pv, pTot){ return WREF_K * pv / (pTot - pv); }
// humedad absoluta clasica g/m3 a (p_parcial, T)
// densidad de vapor de agua en g/m3 a partir de su presion parcial en mbar
function rhoV(pv, T){ return 100 * pv / (R_V * (T + 273.15)) * 1000; }

// ---------- catalogo ----------
const CLIMAS = {
  toluca:    { nom:'Nave templada (Toluca)',        T:18, HR:0.60, Tmin:  8, polvo:0.7 },
  cdmx:      { nom:'Taller general (CDMX)',         T:22, HR:0.45, Tmin:  6, polvo:1.1 },
  veracruz:  { nom:'Nave costera (Veracruz)',       T:32, HR:0.85, Tmin: 20, polvo:0.5 },
  monterrey: { nom:'Verano seco (Monterrey)',       T:38, HR:0.30, Tmin: 12, polvo:1.6 },
  intemperie:{ nom:'Líneas a la intemperie (invierno)', T:4, HR:0.90, Tmin:-12, polvo:0.3 },
};
const CLIMAK = ['toluca','cdmx','veracruz','monterrey','intemperie'];

// escalones acumulativos de filtracion
const FINOS = {
  f0:{ nom:'Solo separador',                      corto:'ninguno',  sol:null, el:[],                       coste: 0 },
  f1:{ nom:'Prefiltro 5 µm',                      corto:'pre',      sol:5,    el:['pre'],                  coste: 5 },
  f2:{ nom:'Pre + coalescente 1 µm',              corto:'coal',     sol:3,    el:['pre','coal'],           coste:14 },
  f3:{ nom:'Pre + coal + microfiltro 0,01 µm',    corto:'micro',    sol:1,    el:['pre','coal','micro'],   coste:28 },
  f4:{ nom:'Pre + coal + micro + carbón activado',corto:'carbón',   sol:1,    el:['pre','coal','micro','carb'], coste:40 },
};
const FINOK = ['f0','f1','f2','f3','f4'];

// elementos filtrantes: C base (dm3/(s bar)) para cuerpo G1/4, b, y cascada de aceite
const ELEM = {
  sep:  { nom:'Separador ciclónico', C:7.0, b:0.30, effAe:0.00,  pisoAe:Infinity, effVa:0.00, pisoVa:Infinity },
  pre:  { nom:'Prefiltro 5 µm',      C:6.0, b:0.30, effAe:0.60,  pisoAe:1.00,     effVa:0.00, pisoVa:Infinity },
  coal: { nom:'Coalescente 1 µm',    C:5.0, b:0.32, effAe:0.98,  pisoAe:0.10,     effVa:0.00, pisoVa:Infinity },
  micro:{ nom:'Microfiltro 0,01 µm', C:4.0, b:0.33, effAe:0.999, pisoAe:0.01,     effVa:0.00, pisoVa:Infinity },
  carb: { nom:'Carbón activado',     C:4.5, b:0.30, effAe:0.999, pisoAe:0.003,    effVa:0.999,pisoVa:0.003 },
  lub:  { nom:'Lubricador',          C:5.5, b:0.30, effAe:0.00,  pisoAe:Infinity, effVa:0.00, pisoVa:Infinity },
};

const SECADORES = {
  s0:{ nom:'Sin secador',                       corto:'ninguno',     pdp:null, purga:0.00, C:0,   b:0.30, sol:null, coste: 0, req:null },
  sf:{ nom:'Secador frigorífico',               corto:'frigorífico', pdp:  3,  purga:0.00, C:6.0, b:0.30, sol:null, coste:18, req:null },
  sm:{ nom:'Secador de membrana',               corto:'membrana',    pdp:-20,  purga:0.18, C:2.4, b:0.35, sol:null, coste:26, req:'f3' },
  sa:{ nom:'Secador de adsorción sin aporte de calor', corto:'adsorción', pdp:-40, purga:0.15, C:5.5, b:0.30, sol:2, coste:34, req:'f2' },
};
const SECK = ['s0','sf','sm','sa'];

const TAMS = {
  g14:{ nom:'Cuerpo G1/4', fC:1.00, fCoste:1.00 },
  g38:{ nom:'Cuerpo G3/8', fC:1.90, fCoste:1.35 },
  g12:{ nom:'Cuerpo G1/2', fC:3.20, fCoste:1.80 },
};
const TAMK = ['g14','g38','g12'];

const LUBK = [false, true];
const COSTE_BASE = 12;   // separador + regulador + manometro

// pliegos de las estaciones
const ESTACIONES = {
  martillo:{ nom:'Martillo cincelador (taller)',  pReq:6.0, Q:900, cl:{A:7,B:8,C:4}, lub:'exige',   margen:false, Emax:44000 },
  pintura: { nom:'Cabina de pintura',             pReq:4.0, Q:400, cl:{A:2,B:4,C:2}, lub:'prohibe', margen:false, Emax:17000 },
  alimento:{ nom:'Envasado con contacto directo', pReq:5.0, Q:250, cl:{A:1,B:4,C:1}, lub:'prohibe', margen:false, Emax:11000 },
  instrum: { nom:'Aire de instrumentación',       pReq:6.0, Q:120, cl:{A:2,B:3,C:2}, lub:'prohibe', margen:true,  Emax: 6000 },
  soplado: { nom:'Soplado en línea de electrónica',pReq:3.0,Q:450, cl:{A:1,B:3,C:1}, lub:'prohibe', margen:false, Emax:19000 },
};
const ESTK = ['martillo','pintura','alimento','instrum','soplado'];

const CRIT = ['okMontaje','okSolidos','okAgua','okAceite','okLub','okPresion','okEnergia'];

// ---------- clases ISO 8573-1 ----------
const TAB_PDP  = [[-70,1],[-40,2],[-20,3],[3,4],[7,5],[10,6]];
const TAB_LIQ  = [[0.5,7],[5,8],[10,9]];
const TAB_ACE  = [[0.01,1],[0.1,2],[1,3],[5,4]];
const TAB_SOL  = [[5,6],[10,7]];

function claseAgua(pdp, cw){
  if(pdp <= 10){ for(const [t,c] of TAB_PDP) if(pdp <= t) return c; }
  for(const [v,c] of TAB_LIQ) if(cw <= v) return c;
  return 10; // clase X
}
function claseAceite(mg){ for(const [v,c] of TAB_ACE) if(mg <= v) return c; return 10; }
function claseSolBase(mg){ for(const [v,c] of TAB_SOL) if(mg <= v) return c; return 10; }

// ---------- aire de entrada al tren ----------
function entrada(climaK){
  const cl = CLIMAS[climaK];
  const Tpost = cl.T + DT_POST;
  const aceite = ACEITE_BASE * Math.pow(2, (Tpost - T_ACE_REF) / DEC_ACE);
  const fracVap = Math.min(FRAC_VAP_MAX, FRAC_VAP0 * Math.pow(2, (Tpost - T_ACE_REF) / DEC_ACE));
  return {
    T: cl.T, HR: cl.HR, Tmin: cl.Tmin, Tpost,
    pvAmb: cl.HR * pSat(cl.T),
    aceite, fracVap,
    aerosol: aceite * (1 - fracVap),
    vapor:   aceite * fracVap,
    polvo: cl.polvo,
  };
}

// condensado del posenfriador, g/min, para un caudal de aire libre FAD en m3/min
function condensado(climaK, fadM3min, pRedBarG){
  const e = entrada(climaK);
  // 216,685 = M_H2O*1e5/(R_universal*1000) en g K / (m3 mbar); ver rhoV
  const factor = 216.685 * fadM3min * P_ATM / (e.T + 273.15); // g/min por unidad de pv/pTot
  const wIn  = factor * (e.pvAmb / P_ATM);
  const pAbs = (pRedBarG + PATM_BAR) * 1000; // mbar
  const wOut = factor * (Math.min(pSat(e.Tpost), pAbs) / pAbs);
  return { wIn, wOut, cond: Math.max(0, wIn - wOut), factor, pAbs };
}

// ---------- cascada de aceite ----------
function pasoAceite(x, eff, piso){
  if(x <= piso) return x;
  return Math.max(x * (1 - eff), piso);
}
function aceiteTren(climaK, finoK){
  const e = entrada(climaK);
  let ae = e.aerosol, va = e.vapor;
  for(const id of FINOS[finoK].el){
    const el = ELEM[id];
    ae = pasoAceite(ae, el.effAe, el.pisoAe);
    if(el.effVa > 0) va = pasoAceite(va, el.effVa, el.pisoVa);
  }
  return { aerosol: ae, vapor: va, total: ae + va };
}

// ---------- solidos ----------
function solidosTren(climaK, finoK, secK, pRedBarG){
  const e = entrada(climaK);
  const conc = e.polvo * (pRedBarG + PATM_BAR) / PATM_BAR;  // mg/m3 comprimido
  let cls = FINOS[finoK].sol !== null ? FINOS[finoK].sol : claseSolBase(conc);
  const cap = SECADORES[secK].sol;
  if(cap !== null && cap > cls) cls = cap;
  return { conc, clase: cls };
}

// ---------- agua ----------
const MARGEN_ISA = 10;   // K de margen que exige el aire de instrumentacion

function aguaTren(climaK, secK, pUsoBarG){
  const e = entrada(climaK);
  const pdp = SECADORES[secK].pdp === null ? e.Tpost : SECADORES[secK].pdp;
  const pAbs = (pUsoBarG + PATM_BAR) * 1000;   // mbar
  const pv   = Math.min(pSat(pdp), pAbs * 0.999);
  const pv2  = Math.min(pv, pSat(e.Tmin));
  const cw   = Math.max(0, wRef(pv, pAbs) - wRef(pv2, pAbs));
  const pdpAtm = tRocio(pv * P_ATM / pAbs);
  return { pdp, pv, cw, pdpAtm, extrapolado: pdpAtm < MAG_TMIN, clase: claseAgua(pdp, cw), condensa: pdp > e.Tmin };
}

// ---------- hidraulica del tren (ISO 6358) ----------
function caidaISO(C, b, qDm3s, p1BarAbs){
  const f = qDm3s / (C * p1BarAbs);
  if(!(f < 1)) return { dp: NaN, bloqueo: true, f };
  const p2 = p1BarAbs * (b + (1 - b) * Math.sqrt(1 - f * f));
  return { dp: p1BarAbs - p2, bloqueo: false, f, p2 };
}

function cadena(cfg){
  // devuelve los elementos pasivos aguas arriba del regulador, en orden
  const out = [{ id:'sep', ...ELEM.sep, antes:true }];
  for(const id of FINOS[cfg.fino].el) out.push({ id, ...ELEM[id], antes:true });
  const s = SECADORES[cfg.sec];
  if(s.C > 0) out.push({ id:'sec_' + cfg.sec, nom:s.nom, C:s.C, b:s.b, antes:true });
  return out;
}

function resuelvePresion(estK, cfg){
  const est = ESTACIONES[estK];
  const tam = TAMS[cfg.tam];
  const Qs  = est.Q / 60;                       // dm3/s ANR en el punto de uso
  const purga = SECADORES[cfg.sec].purga;
  const droop = D0_DROOP * Math.pow(est.Q / (Q_NOM_G14 * tam.fC), 2);

  // lubricador (aguas abajo del regulador)
  let pSet = est.pReq + DP_TUB + droop, dpLub = 0, bloqueo = false;
  for(let it = 0; it < 60; it++){
    let nl = 0;
    if(cfg.lub){
      const r = caidaISO(ELEM.lub.C * tam.fC, ELEM.lub.b, Qs, pSet + PATM_BAR);
      if(r.bloqueo){ bloqueo = true; break; }
      nl = r.dp;
    }
    const nuevo = est.pReq + DP_TUB + droop + nl;
    if(Math.abs(nuevo - pSet) < 1e-9){ pSet = nuevo; dpLub = nl; break; }
    pSet = nuevo; dpLub = nl;
  }
  if(bloqueo) return { bloqueo:true, pRed:Infinity, pSet, droop, dpLub, dps:[], sumDp:Infinity };

  const comps = cadena(cfg);
  let pRed = pSet + DP_REG_MIN, dps = [], sumDp = 0;
  for(let it = 0; it < 120; it++){
    let p = pRed + PATM_BAR;
    dps = []; sumDp = 0;
    let mal = false;
    for(const c of comps){
      const q = Qs * (1 + (c.antes ? purga : 0));
      const r = caidaISO(c.C * tam.fC, c.b, q, p);
      if(r.bloqueo){ mal = true; break; }
      dps.push({ id:c.id, nom:c.nom, dp:r.dp, f:r.f });
      sumDp += r.dp; p = r.p2;
    }
    if(mal) return { bloqueo:true, pRed:Infinity, pSet, droop, dpLub, dps:[], sumDp:Infinity };
    const nuevo = pSet + DP_REG_MIN + sumDp;
    if(Math.abs(nuevo - pRed) < 1e-9){ pRed = nuevo; break; }
    pRed = nuevo;
    if(pRed > 40) return { bloqueo:true, pRed:Infinity, pSet, droop, dpLub, dps:[], sumDp:Infinity };
  }
  return { bloqueo:false, pRed, pSet, droop, dpLub, dps, sumDp, pRegIn: pRed - sumDp, pUso: pSet - droop - dpLub - DP_TUB };
}

// consumo electrico propio del tratamiento, kW por (m3/min) aspirado
const K_SEC = { s0:0, sf:0.30, sm:0, sa:0.05 };
const K_SEC_T = 0.025;   // +2,5 % de consumo del frigorifico por K sobre 30 C

function energia(estK, climaK, cfg, pRed){
  const est = ESTACIONES[estK];
  const e = entrada(climaK);
  const purga = SECADORES[cfg.sec].purga;
  // el pliego pide caudal NORMAL (masa); el compresor aspira volumen a la temperatura del sitio
  const fTemp = (e.T + 273.15) / T0_ISO_K;
  const fad = est.Q * (1 + purga) / 1000 * fTemp;               // m3/min aspirados
  const kWc = fad * POT_ESP * (1 + K_BAR * (pRed - P_RED_NOM));
  const kWs = fad * K_SEC[cfg.sec] * (cfg.sec === 'sf' ? 1 + K_SEC_T * (e.Tpost - 30) : 1);
  const kW = kWc + kWs;
  return { fad, fTemp, kWc, kWs, kW, kWh: kW * HORAS_ANIO, mxn: kW * HORAS_ANIO * PRECIO_KWH };
}

function costeCfg(cfg){
  const base = COSTE_BASE + FINOS[cfg.fino].coste + SECADORES[cfg.sec].coste + (cfg.lub ? 6 : 0);
  return Math.round(base * TAMS[cfg.tam].fCoste);
}

// ---------- evaluacion ----------
function evalua(estK, climaK, cfg){
  const est = ESTACIONES[estK];
  const sec = SECADORES[cfg.sec];

  // 1 montaje: prerrequisitos de la cadena
  const okMontaje = sec.req === null ? true : FINOK.indexOf(cfg.fino) >= FINOK.indexOf(sec.req);

  const pres = resuelvePresion(estK, cfg);
  const pRed = pres.bloqueo ? P_MAX_RED : pres.pRed;
  const pUso = pres.bloqueo ? 0 : pres.pUso;

  const sol  = solidosTren(climaK, cfg.fino, cfg.sec, pRed);
  const agua = aguaTren(climaK, cfg.sec, pUso);
  const ace  = aceiteTren(climaK, cfg.fino);
  const clAce = claseAceite(ace.total);

  const okSolidos = sol.clase <= est.cl.A;
  // el punto de rocio a presion debe quedar por DEBAJO de la temperatura mas fria de la linea;
  // el aire de instrumentacion exige ademas el margen de 10 K de la practica ISA
  const pdpMax    = CLIMAS[climaK].Tmin - (est.margen ? MARGEN_ISA : 0);
  const margenOk  = agua.pdp <= pdpMax;
  const okAgua    = agua.clase <= est.cl.B && margenOk;
  const okAceite  = clAce <= est.cl.C;
  const okLub     = est.lub === 'exige' ? cfg.lub === true : est.lub === 'prohibe' ? cfg.lub === false : true;
  const okPresion = !pres.bloqueo && pres.pRed <= P_MAX_RED + 1e-9;

  const ene = energia(estK, climaK, cfg, pRed);
  const okEnergia = ene.kWh <= est.Emax + 1e-9;

  const res = { okMontaje, okSolidos, okAgua, okAceite, okLub, okPresion, okEnergia };
  let primero = null;
  for(const k of CRIT) if(!res[k]){ primero = k; break; }
  const fallos = CRIT.filter(k => !res[k]);

  return {
    ...res, primero, fallos, valido: fallos.length === 0,
    clase: { A: sol.clase, B: agua.clase, C: clAce },
    sol, agua, ace, clAce, pres, ene, margenOk, pdpMax,
    coste: costeCfg(cfg),
  };
}

// ---------- barrido ----------
const CFGS = (() => {
  const a = [];
  for(const fino of FINOK) for(const sec of SECK) for(const lub of LUBK) for(const tam of TAMK) a.push({ fino, sec, lub, tam });
  return a;
})();

function validas(estK, climaK){ return CFGS.filter(c => evalua(estK, climaK, c).valido); }
function costeMin(estK, climaK){
  const v = validas(estK, climaK);
  return v.length ? Math.min(...v.map(costeCfg)) : null;
}
function optimas(estK, climaK){
  const cm = costeMin(estK, climaK);
  if(cm === null) return [];
  return validas(estK, climaK).filter(c => costeCfg(c) === cm);
}

// ---------- reto: cuatro ejes de decision ----------
const EJES = ['fino', 'sec', 'lub', 'tam'];
const LISTA_EJE = { fino: FINOK, sec: SECK, lub: LUBK, tam: TAMK };

// valores de un eje que aparecen en alguna configuracion optima (valida y de coste minimo)
function ejeSol(estK, climaK, eje){
  const o = optimas(estK, climaK);
  const vs = [];
  for(const c of o) if(!vs.includes(c[eje])) vs.push(c[eje]);
  return vs;
}
function okEje(estK, climaK, eje, val){
  return ejeSol(estK, climaK, eje).includes(val);
}

// configuracion de arranque: equivocada en los cuatro ejes cuando se puede
function startCfg(estK, climaK){
  const cfg = {};
  for(const eje of EJES){
    const sol = ejeSol(estK, climaK, eje);
    const lista = LISTA_EJE[eje];
    const malo = lista.find(v => !sol.includes(v));
    cfg[eje] = (malo === undefined) ? lista[0] : malo;
  }
  return cfg;
}

// ---------- motivos legibles ----------
const MOTIVO = {
  okMontaje: 'El secador elegido exige una filtración previa que no está montada.',
  okSolidos: 'Las partículas sólidas superan la clase que pide la estación.',
  okAgua:    'El punto de rocío a presión no baja lo suficiente: hay riesgo de condensado.',
  okAceite:  'El aceite residual supera la clase que pide la estación.',
  okLub:     'La lubricación no corresponde: la estación la exige o la prohíbe.',
  okPresion: 'La presión de red necesaria se sale del máximo disponible.',
  okEnergia: 'El consumo anual se pasa del presupuesto energético.',
};

function whyCfg(estK, climaK, cfg){
  const r = evalua(estK, climaK, cfg);
  if(r.valido) return null;
  return { criterio: r.primero, texto: MOTIVO[r.primero], r };
}

// ---------- formato ----------
function f1(x, d){
  if(!isFinite(x)) return '\u2014';
  const dd = (d === undefined) ? 1 : d;
  const s = Math.abs(x).toFixed(dd);
  const ent = s.split('.')[0], dec = s.split('.')[1] || '';
  let out = '';
  for(let i = 0; i < ent.length; i++){
    if(i > 0 && (ent.length - i) % 3 === 0) out += '\u202F';
    out += ent[i];
  }
  return (x < 0 ? '-' : '') + out + (dd > 0 ? ',' + dec : '');
}

// ---------- escenarios curados del reto ----------
const ESCENAS = [
  { est: 'martillo', clima: 'toluca' },
  { est: 'pintura',  clima: 'intemperie' },
  { est: 'alimento', clima: 'monterrey' },
  { est: 'instrum',  clima: 'monterrey' },
  { est: 'soplado',  clima: 'intemperie' },
];

// ==================== FIN MOTOR ====================
/* ============================ ESCENA 3D ============================ */
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[5.8,3.6,7.0],target:[0.2,1.5,0.3],bgTop:'#101a22',bgBot:'#05070a',bloom:0.40,minD:3.2,maxD:26});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:2100,Q:0.9});
const std=o=>new THREE.MeshStandardMaterial(o);
const el=id=>document.getElementById(id);
function ease(x){return x<0.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
let toastT=null;
function showToast(html,ms=3300){ const t=el('toast'); t.innerHTML=html; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),ms); }

/* ---------- materiales ---------- */
const alu=castAluminum(), brush=brushedMetal();
const MAT={
  frame:   std({...brush,color:0x2b333c,metalness:0.85,roughness:0.42,envMapIntensity:1.0}),
  suelo:   std({color:0x11171d,metalness:0.55,roughness:0.30}),
  muro:    std({color:0x16202a,metalness:0.20,roughness:0.75}),
  steel:   std({...alu,color:0x9aa4ac,metalness:0.90,roughness:0.34,envMapIntensity:1.15}),
  steelDk: std({...alu,color:0x5c666f,metalness:0.88,roughness:0.44,envMapIntensity:1.0}),
  chrome:  std({color:0xd7dde3,metalness:1.0,roughness:0.10,envMapIntensity:1.5}),
  brass:   std({color:0xb98b3c,metalness:0.95,roughness:0.28,envMapIntensity:1.3}),
  azul:    std({color:0x2b6f8a,metalness:0.55,roughness:0.38}),
  azulDk:  std({color:0x1d4d61,metalness:0.55,roughness:0.42}),
  tubo:    std({color:0x8f9aa3,metalness:0.92,roughness:0.26,envMapIntensity:1.25}),
  manguera:std({color:0x14171a,metalness:0.10,roughness:0.80}),
  rojo:    std({color:0xC1442E,metalness:0.30,roughness:0.45}),
  vidrio:  std({color:0xbfe6ef,metalness:0.05,roughness:0.05,transparent:true,opacity:0.30}),
  aceite:  std({color:0xE7A94B,metalness:0.10,roughness:0.15,transparent:true,opacity:0.55,emissive:0x6b4a12,emissiveIntensity:0.25}),
  agua:    std({color:0x4FD1C5,metalness:0.10,roughness:0.10,transparent:true,opacity:0.55,emissive:0x14524d,emissiveIntensity:0.3}),
  dark:    std({color:0x0d1218,metalness:0.30,roughness:0.60}),
  bench:   std({color:0x2a3138,metalness:0.35,roughness:0.62}),
  benchLeg:std({color:0x1b2127,metalness:0.55,roughness:0.45}),
  ped:     std({color:0x232a31,metalness:0.45,roughness:0.55}),
  pedTop:  std({color:0x2e3740,metalness:0.50,roughness:0.42}),
  pedRing: std({color:0x2A9D8F,metalness:0.30,roughness:0.35,emissive:0x2A9D8F,emissiveIntensity:0.9}),
  panel:   std({color:0x101820,metalness:0.25,roughness:0.55}),
  led:     std({color:0x2A9D8F,metalness:0.20,roughness:0.40,emissive:0x2A9D8F,emissiveIntensity:1.2}),
};

/* ---------- decorado fijo ---------- */
(function decorado(){
  const g=new THREE.Group();
  const suelo=roundedBox(8.2,0.12,3.8,MAT.suelo,0.02); suelo.position.set(0,-0.06,0); g.add(suelo);
  const muro=roundedBox(7.6,2.9,0.14,MAT.muro,0.01); muro.position.set(0,1.45,-0.86); g.add(muro);
  for(let i=-3;i<=3;i++){
    const v=roundedBox(0.06,2.7,0.06,MAT.frame,0.2); v.position.set(i*1.15,1.45,-0.76); g.add(v);
  }
  // riel de tuberia principal
  const riel=new THREE.Mesh(new THREE.CylinderGeometry(0.030,0.030,5.9,20),MAT.tubo);
  riel.rotation.z=Math.PI/2; riel.position.set(-0.05,1.46,0); riel.castShadow=true; g.add(riel);
  // compresor de la planta, a la izquierda
  const comp=new THREE.Group();
  comp.add(roundedBox(0.86,0.60,0.62,MAT.azulDk,0.10));
  const mot=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.52,26),MAT.steelDk);
  mot.rotation.z=Math.PI/2; mot.position.set(0,0.44,0); mot.castShadow=true; comp.add(mot);
  const tanque=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.94,26),MAT.rojo);
  tanque.position.set(0,0.30,0.52); tanque.castShadow=true; comp.add(tanque);
  const sube=new THREE.Mesh(new THREE.CylinderGeometry(0.026,0.026,0.95,16),MAT.tubo);
  sube.position.set(0.32,1.00,0); comp.add(sube);
  comp.position.set(-3.15,0.32,0); g.add(comp);
  const lb=labelSprite('Compresor de planta','#8A94A0'); lb.position.set(-3.15,1.28,0); lb.scale.multiplyScalar(0.52); g.add(lb);
  // colector de condensados bajo el tren
  const col=roundedBox(2.2,0.16,0.34,MAT.steelDk,0.12); col.position.set(-1.3,0.24,0.30); g.add(col);
  scene.add(g);
})();

/* ---------- constructores de piezas ---------- */
const rig={ aguja:null, secLed:null, lubLed:null, bowls:{}, gota:null, aceiteNivel:null };

function nipples(g,ancho){
  const n1=new THREE.Mesh(new THREE.CylinderGeometry(0.030,0.030,0.16,16),MAT.tubo);
  n1.rotation.z=Math.PI/2; n1.position.set(-ancho/2-0.06,0,0); g.add(n1);
  const n2=n1.clone(); n2.position.set(ancho/2+0.06,0,0); g.add(n2);
}

function buildPosenf(){
  const g=new THREE.Group();
  const cuerpo=roundedBox(0.60,0.52,0.46,MAT.azul,0.10); cuerpo.position.y=0.02; g.add(cuerpo);
  for(let i=0;i<7;i++){
    const al=roundedBox(0.54,0.012,0.40,MAT.steel,0.05);
    al.position.set(0,-0.20+i*0.07,0.0); g.add(al);
  }
  const vent=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.17,0.06,26),MAT.steelDk);
  vent.rotation.x=Math.PI/2; vent.position.set(0,0.02,0.26); g.add(vent);
  for(let i=0;i<5;i++){
    const asp=roundedBox(0.15,0.010,0.05,MAT.chrome,0.3);
    asp.position.set(0,0.02,0.29); asp.rotation.z=i*Math.PI*2/5; g.add(asp);
  }
  const drenaje=new THREE.Mesh(new THREE.CylinderGeometry(0.018,0.018,0.14,14),MAT.brass);
  drenaje.position.set(0,-0.30,0.0); g.add(drenaje);
  nipples(g,0.60);
  const lb=labelSprite('Posenfriador','#8A94A0'); lb.position.set(0,0.44,0); lb.scale.multiplyScalar(0.55); g.add(lb);
  return g;
}

function buildSeparador(){
  const g=new THREE.Group();
  const cil=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.17,0.34,26),MAT.steel);
  cil.position.y=0.13; cil.castShadow=true; g.add(cil);
  const cono=new THREE.Mesh(new THREE.CylinderGeometry(0.17,0.055,0.30,26),MAT.steelDk);
  cono.position.y=-0.19; cono.castShadow=true; g.add(cono);
  const tapa=new THREE.Mesh(new THREE.CylinderGeometry(0.185,0.185,0.05,26),MAT.steelDk);
  tapa.position.y=0.32; g.add(tapa);
  const purga=new THREE.Mesh(new THREE.CylinderGeometry(0.030,0.030,0.12,16),MAT.brass);
  purga.position.y=-0.39; g.add(purga);
  const gota=new THREE.Mesh(new THREE.SphereGeometry(0.030,14,12),MAT.agua);
  gota.position.set(0,-0.48,0); gota.visible=false; g.add(gota); rig.gota=gota;
  nipples(g,0.34);
  const lb=labelSprite('Separador ciclónico','#8A94A0'); lb.position.set(0,0.52,0); lb.scale.multiplyScalar(0.55); g.add(lb);
  return g;
}

/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={aluminio:MAT.steel, acero:MAT.steelDk, cobre:MAT.brass, cromo:MAT.chrome,
  chapa:MAT.steelDk, hierro:MAT.steelDk, negro:MAT.dark, goma:MAT.dark,
  blanco:MAT.chrome, ceramica:MAT.chrome,
  papel:std({color:0xd9d2bc,roughness:0.92,metalness:0.03})};

function buildFiltros(){
  const g=new THREE.Group();
  const ids=['pre','coal','micro','carb'];
  const cols={pre:0x8f9aa3,coal:0x6FB6FF,micro:0x4FD1C5,carb:0x3a4048};
  const barra=roundedBox(1.04,0.09,0.16,MAT.steelDk,0.20); barra.position.y=0.20; g.add(barra);
  ids.forEach((id,i)=>{
    const x=-0.39+i*0.26;
    const cab=roundedBox(0.21,0.17,0.19,MAT.steel,0.14); cab.position.set(x,0.08,0); g.add(cab);
    const vasoMat=MAT.vidrio.clone(); vasoMat.color=new THREE.Color(cols[id]);
    const vaso=new THREE.Mesh(new THREE.CylinderGeometry(0.078,0.078,0.24,22),vasoMat);
    vaso.position.set(x,-0.13,0); g.add(vaso);
    /* EL CARTUCHO. Lo que filtra es la SUPERFICIE, y el plisado es la manera de
       meter un metro cuadrado de papel en un vaso de un palmo: un cilindro liso
       no dice de dónde sale el área ni por qué un filtro se «cansa». El de
       carbón activado es la excepción y va macizo a propósito: no retiene por
       superficie sino por adsorción en un lecho de granos, y es el único de los
       cuatro que se lleva el vapor de aceite. */
    const cart = id==='carb'
      ? new THREE.Mesh(new THREE.CylinderGeometry(0.052,0.052,0.19,20),
          std({color:0x1a1c1f,roughness:0.96,metalness:0.02}))
      : P3.filtroPlisado(MATP,{rExt:0.058,rInt:0.028,alto:0.19,pliegues:26});
    cart.position.set(x,-0.13,0); g.add(cart);
    const fondo=new THREE.Mesh(new THREE.CylinderGeometry(0.082,0.070,0.05,22),MAT.steelDk);
    fondo.position.set(x,-0.27,0); g.add(fondo);
    // La JAULA del vaso: un vaso de plastico a 10 bar es una granada, y por eso
    // todos los vasos de un tren de aire llevan una.
    for(let k=0;k<5;k++){
      const a=(k/5)*Math.PI*2;
      const b=new THREE.Mesh(new THREE.BoxGeometry(0.009,0.22,0.009),MAT.steelDk);
      b.position.set(x+Math.cos(a)*0.081,-0.13,Math.sin(a)*0.081); g.add(b);
    }
    rig.bowls[id]={vaso,cab,mat:vasoMat};
  });
  nipples(g,1.04);
  const lb=labelSprite('Torre de filtros finos','#8A94A0'); lb.position.set(0,0.42,0); lb.scale.multiplyScalar(0.55); g.add(lb);
  return g;
}

function buildSecador(){
  const g=new THREE.Group();
  const arm=roundedBox(0.62,0.72,0.50,MAT.azulDk,0.08); arm.position.y=0.04; g.add(arm);
  const t1=new THREE.Mesh(new THREE.CylinderGeometry(0.085,0.085,0.60,22),MAT.steel);
  t1.position.set(-0.15,0.10,0.30); t1.castShadow=true; g.add(t1);
  const t2=t1.clone(); t2.position.set(0.15,0.10,0.30); g.add(t2);
  const disp=roundedBox(0.30,0.14,0.03,MAT.dark,0.14); disp.position.set(0,0.26,0.27); g.add(disp);
  const ledMat=MAT.led.clone();
  const led=new THREE.Mesh(new THREE.SphereGeometry(0.030,14,12),ledMat);
  led.position.set(0.20,0.26,0.27); g.add(led); rig.secLed={m:ledMat,o:led};
  const purga=new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.16,14),MAT.brass);
  purga.position.set(0,-0.40,0.10); g.add(purga);
  nipples(g,0.62);
  const lb=labelSprite('Secador','#8A94A0'); lb.position.set(0,0.56,0); lb.scale.multiplyScalar(0.55); g.add(lb);
  return g;
}

function buildRegulador(){
  const g=new THREE.Group();
  const cab=roundedBox(0.24,0.22,0.22,MAT.steel,0.14); cab.position.y=0.06; g.add(cab);
  const perilla=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.090,0.11,24),MAT.dark);
  perilla.position.y=0.23; g.add(perilla);
  for(let i=0;i<10;i++){
    const est=roundedBox(0.012,0.11,0.014,MAT.frame,0.3);
    est.position.set(Math.cos(i*Math.PI/5)*0.086,0.23,Math.sin(i*Math.PI/5)*0.086); g.add(est);
  }
  // manometro
  const mg=new THREE.Group();
  const caja=new THREE.Mesh(new THREE.CylinderGeometry(0.095,0.095,0.035,28),MAT.chrome);
  caja.rotation.x=Math.PI/2; mg.add(caja);
  const cara=new THREE.Mesh(new THREE.CircleGeometry(0.082,28),std({color:0xf2f4f6,metalness:0.05,roughness:0.6}));
  cara.position.z=0.019; mg.add(cara);
  for(let i=0;i<=10;i++){
    const a=Math.PI*0.75-(i/10)*Math.PI*1.5;
    const mk=roundedBox(0.006,0.018,0.004,MAT.dark,0.2);
    mk.position.set(Math.cos(a)*0.066,Math.sin(a)*0.066,0.021); mk.rotation.z=a-Math.PI/2; mg.add(mk);
  }
  const aguja=new THREE.Group();
  const ag=roundedBox(0.008,0.062,0.006,MAT.rojo,0.3); ag.position.y=0.031; aguja.add(ag);
  aguja.position.z=0.023; mg.add(aguja); rig.aguja=aguja;
  const eje=new THREE.Mesh(new THREE.CylinderGeometry(0.010,0.010,0.012,14),MAT.dark);
  eje.rotation.x=Math.PI/2; eje.position.z=0.026; mg.add(eje);
  mg.position.set(0,0.06,0.16); g.add(mg);
  const vaso=new THREE.Mesh(new THREE.CylinderGeometry(0.070,0.070,0.18,22),MAT.vidrio);
  vaso.position.y=-0.14; g.add(vaso);
  nipples(g,0.24);
  const lb=labelSprite('Regulador + manómetro','#8A94A0'); lb.position.set(0,0.40,0); lb.scale.multiplyScalar(0.55); g.add(lb);
  return g;
}

function buildLubricador(){
  const g=new THREE.Group();
  const cab=roundedBox(0.22,0.20,0.20,MAT.steel,0.14); cab.position.y=0.06; g.add(cab);
  const cupula=new THREE.Mesh(new THREE.SphereGeometry(0.048,18,14),MAT.vidrio);
  cupula.position.y=0.19; g.add(cupula);
  const goteo=new THREE.Mesh(new THREE.CylinderGeometry(0.007,0.007,0.05,12),MAT.brass);
  goteo.position.y=0.19; g.add(goteo);
  const vasoM=MAT.vidrio.clone();
  const vaso=new THREE.Mesh(new THREE.CylinderGeometry(0.072,0.072,0.20,22),vasoM);
  vaso.position.y=-0.13; g.add(vaso);
  const nivM=MAT.aceite.clone();
  const niv=new THREE.Mesh(new THREE.CylinderGeometry(0.066,0.066,0.11,22),nivM);
  niv.position.y=-0.17; g.add(niv); rig.aceiteNivel={m:nivM,o:niv};
  const ledM=MAT.led.clone();
  const led=new THREE.Mesh(new THREE.SphereGeometry(0.024,14,12),ledM);
  led.position.set(0,0.06,0.13); g.add(led); rig.lubLed={m:ledM,o:led};
  nipples(g,0.22);
  const lb=labelSprite('Lubricador','#8A94A0'); lb.position.set(0,0.38,0); lb.scale.multiplyScalar(0.55); g.add(lb);
  return g;
}

function buildEstacion(){
  const g=new THREE.Group();
  const col=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.52,18),MAT.tubo);
  col.position.y=-0.16; g.add(col);
  const cop=roundedBox(0.13,0.12,0.13,MAT.brass,0.18); cop.position.y=0.14; g.add(cop);
  const cur=new THREE.Mesh(new THREE.TorusGeometry(0.11,0.026,12,26,Math.PI*1.4),MAT.manguera);
  cur.position.set(0.14,0.02,0); cur.rotation.z=0.6; g.add(cur);
  const pistola=new THREE.Group();
  pistola.add(roundedBox(0.26,0.07,0.07,MAT.steelDk,0.25));
  const gat=roundedBox(0.05,0.11,0.05,MAT.dark,0.25); gat.position.set(-0.05,-0.08,0); pistola.add(gat);
  const boq=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.022,0.10,14),MAT.chrome);
  boq.rotation.z=-Math.PI/2; boq.position.set(0.18,0,0); pistola.add(boq);
  pistola.position.set(0.22,-0.16,0.10); pistola.rotation.z=-0.25; g.add(pistola);
  const base=roundedBox(0.34,0.05,0.28,MAT.frame,0.12); base.position.y=-0.44; g.add(base);
  nipples(g,0.14);
  const lb=labelSprite('Punto de uso','#8A94A0'); lb.position.set(0,0.36,0); lb.scale.multiplyScalar(0.55); g.add(lb);
  return g;
}

/* ---------- registro de piezas ---------- */
const HUB=[0,0,0];
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const H=(dx,dy,dz)=>V3(HUB[0]+dx,HUB[1]+dy,HUB[2]+dz);

const PARTS=[
  {id:'posenf',  name:'Posenfriador',           build:buildPosenf,    home:H(-2.42,1.48,0), note:'Baja el aire a unos 10 K sobre el ambiente: ahí condensa la mayor parte del agua, antes de tocar ningún filtro.'},
  {id:'sep',     name:'Separador ciclónico',    build:buildSeparador, home:H(-1.72,1.44,0), note:'Tira por fuerza centrífuga el agua y el aceite ya condensados. No toca lo que sigue en fase de vapor.'},
  {id:'filtros', name:'Torre de filtros finos', build:buildFiltros,   home:H(-0.86,1.48,0), note:'Prefiltro, coalescente, microfiltro y carbón activado. Sólo el último retiene vapor de aceite.'},
  {id:'secador', name:'Secador',                build:buildSecador,   home:H(0.14,1.46,0),  note:'Fija el punto de rocío a presión. Frigorífico +3 °C, membrana −20 °C, adsorción −40 °C.'},
  {id:'reg',     name:'Regulador + manómetro',  build:buildRegulador, home:H(0.92,1.46,0),  note:'Fija la presión de trabajo. Necesita 0,7 bar de diferencial y cae con el caudal (droop).'},
  {id:'lubri',   name:'Lubricador',             build:buildLubricador,home:H(1.48,1.46,0),  note:'Sólo donde la herramienta lo exige: en pintura, envasado o instrumentación es una contaminación.'},
  {id:'estacion',name:'Punto de uso',           build:buildEstacion,  home:H(2.18,1.46,0),  note:'Aquí se mide si la presión y las tres clases de pureza cumplen el pliego.'},
];
const ORDER=PARTS.map(p=>p.id);
const PART=Object.fromEntries(PARTS.map(p=>[p.id,p]));

/* ---------- banco de piezas ---------- */
const STAGE_S=0.5;
const BENCH={cx:5.15,cz:0.85,top:1.00,cols:3,dx:1.05,dz:1.20,pedH:0.30};
const N_ROWS=Math.ceil(PARTS.length/BENCH.cols);
const PED_TOP_Y=BENCH.top+BENCH.pedH;
function pedBaseXZ(i){
  const c=i%BENCH.cols, r=Math.floor(i/BENCH.cols);
  return [BENCH.cx+(c-(BENCH.cols-1)/2)*BENCH.dx, BENCH.cz+(r-(N_ROWS-1)/2)*BENCH.dz];
}
const peds=[];
(function buildStaging(){
  const g=new THREE.Group();
  const w=BENCH.cols*BENCH.dx+0.5, d=N_ROWS*BENCH.dz+0.5;
  const slab=roundedBox(w,0.10,d,MAT.bench,0.05); slab.position.set(BENCH.cx,BENCH.top,BENCH.cz); g.add(slab);
  for(const sx of [-1,1]) for(const sz of [-1,1]){
    const leg=roundedBox(0.10,BENCH.top,0.10,MAT.benchLeg,0.20);
    leg.position.set(BENCH.cx+sx*(w/2-0.16),BENCH.top/2,BENCH.cz+sz*(d/2-0.16)); g.add(leg);
  }
  const rail=roundedBox(w,0.05,0.05,MAT.frame,0.30); rail.position.set(BENCH.cx,BENCH.top+0.28,BENCH.cz-d/2+0.06); g.add(rail);
  PARTS.forEach((p,i)=>{
    const [x,z]=pedBaseXZ(i);
    const pg=new THREE.Group(); pg.position.set(x,0,z);
    const cyl=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.30,BENCH.pedH,26),MAT.ped);
    cyl.position.y=BENCH.top+BENCH.pedH/2; cyl.castShadow=true; pg.add(cyl);
    const plate=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.03,26),MAT.pedTop);
    plate.position.y=PED_TOP_Y; pg.add(plate);
    const ringMat=MAT.pedRing.clone();
    const ring=new THREE.Mesh(new THREE.TorusGeometry(0.29,0.014,10,40),ringMat);
    ring.rotation.x=-Math.PI/2; ring.position.y=PED_TOP_Y+0.02; pg.add(ring);
    const lb=labelSprite(p.name,'#8A94A0'); lb.position.set(0,BENCH.top+0.12,0); lb.scale.multiplyScalar(0.48); pg.add(lb);
    g.add(pg);
    peds.push({g:pg,ring,mat:ringMat,label:lb});
  });
  scene.add(g);
})();
function resetPedestals(){ peds.forEach(p=>{ p.mat.color.setHex(0x2A9D8F); p.mat.emissive.setHex(0x2A9D8F); p.mat.emissiveIntensity=0.9; }); }
function markPedestalDone(i){ const p=peds[i]; if(!p)return; p.mat.color.setHex(0x43D9AD); p.mat.emissive.setHex(0x43D9AD); p.mat.emissiveIntensity=0.35; }

/* ---------- fantasmas y piezas móviles ---------- */
function ghostMat(){ return std({color:0x4FD1C5,transparent:true,opacity:0.30,emissive:0x2A9D8F,emissiveIntensity:0.55,depthWrite:false,roughness:0.5,metalness:0.1}); }
let ghosts=[], movibles=[], tweens=[];
const placed={}; let progress=0, simUnlocked=false, selected=null;

function makeGhost(part){
  // los constructores escriben en rig (aguja, LED, vasos...); el fantasma NO debe
  // robarle esas referencias a la pieza real, asi que se aisla y se restaura.
  const keep={aguja:rig.aguja,secLed:rig.secLed,lubLed:rig.lubLed,gota:rig.gota,aceiteNivel:rig.aceiteNivel,bowls:rig.bowls};
  rig.bowls={};
  const g=part.build();
  Object.assign(rig,keep);
  const gm=ghostMat();
  g.traverse(o=>{ if(o.isMesh){ o.material=gm; o.castShadow=false; o.receiveShadow=false; } if(o.isSprite){ o.visible=false; } });
  g.position.copy(part.home);
  g.userData={kind:'slot',id:part.id,gm,shake:0,fading:false};
  scene.add(g); ghosts.push(g);
  return g;
}
function showGhostFor(id){ ghosts.forEach(g=>{ g.visible=!placed[g.userData.id] && (!id || g.userData.id===id); }); }
function makePart(part,i){
  const g=part.build();
  g.scale.setScalar(STAGE_S);
  const box=new THREE.Box3().setFromObject(g);
  const [x,z]=pedBaseXZ(i);
  const baseY=PED_TOP_Y+0.03-box.min.y+g.position.y;
  g.position.set(x,baseY,z);
  g.userData={kind:'part',id:part.id,baseY,phase:i*1.7,lift:0};
  scene.add(g); movibles.push(g);
  return g;
}

/* ---------- flujo animado ---------- */
const flow=new THREE.Group();
const flowPts=[];
(function buildFlow(){
  const m=std({color:0x4FD1C5,emissive:0x4FD1C5,emissiveIntensity:1.4,metalness:0.1,roughness:0.4,transparent:true,opacity:0.85});
  for(let i=0;i<18;i++){
    const s=new THREE.Mesh(new THREE.SphereGeometry(0.028,10,8),m.clone());
    s.position.set(-2.7+i*0.3,1.46,0); flow.add(s); flowPts.push(s);
  }
  flow.visible=false; scene.add(flow);
})();
let flujoOn=false, flowT=0, gotaT=0;

/* ---------- ensamble ---------- */
function initAssembly(){
  [...ghosts,...movibles].forEach(o=>scene.remove(o));
  ghosts=[]; movibles=[]; tweens=[]; selected=null;
  ORDER.forEach(id=>placed[id]=false);
  progress=0; simUnlocked=false; flujoOn=false; flow.visible=false;
  resetPedestals();
  PARTS.forEach((p,i)=>{ makePart(p,i); makeGhost(p); });
  showGhostFor(null);
  el('asmStatus').innerHTML='Toca una <b>pieza</b> del banco (derecha) y luego su <b>hueco luminoso</b> sobre el riel.';
  renderChecklist(); renderProg(); syncCtrlbar();
  if(mode!=='ensamble') setMode('ensamble');
  S.setCinematicIdle(false);
  S.moveTo([5.8,3.6,7.0],[0.2,1.5,0.3],1.2);
}

function selectPart(obj){
  if(selected===obj){ deselect(); return; }
  deselect();
  selected=obj; obj.userData.lift=0.18;
  showGhostFor(obj.userData.id);
  synth.beep(660,0.06,0.04);
  const p=PART[obj.userData.id];
  el('asmStatus').innerHTML='<b>'+p.name+'</b> seleccionada. Ahora toca su <b>hueco luminoso</b>.';
}
function deselect(){ if(selected){ selected.userData.lift=0; selected=null; } showGhostFor(null); }

function placePart(obj,ghost){
  const id=obj.userData.id, p=PART[id], i=ORDER.indexOf(id);
  ghost.userData.fading=true;
  tweens.push({obj,fromP:obj.position.clone(),toP:p.home.clone(),fromS:STAGE_S,toS:1,t:0,dur:0.9,roty0:obj.rotation.y,
    onDone:()=>{ obj.userData.kind='placed'; obj.userData.lift=0; }});
  placed[id]=true; progress++; selected=null;
  markPedestalDone(i);
  synth.beep(880,0.07,0.05); setTimeout(()=>synth.beep(1174,0.09,0.05),90);
  showToast('✔ <b>'+p.name+'</b> colocada. '+p.note,4200);
  renderChecklist(); renderProg(); showGhostFor(null);
  if(progress===PARTS.length) finishAssembly();
}
function wrongSlot(ghost){
  ghost.userData.shake=0.5; synth.beep(200,0.12,0.05);
  showToast('<span style="color:var(--bad)">✗ Esa pieza no va en ese hueco.</span>',2200);
}
function finishAssembly(){
  simUnlocked=true; syncCtrlbar();
  el('asmStatus').innerHTML='<b style="color:var(--ok)">Tren completo.</b> Ya puedes explorar la cascada de aceite, el agua, la escalera de presiones, la malla de proyecto y el reto.';
  synth.beep(523,0.1,0.05); setTimeout(()=>synth.beep(784,0.14,0.05),130);
  showToast('🎉 <b>Unidad de tratamiento montada.</b> Se desbloquean los cinco modos de análisis.',4600);
  S.setCinematicIdle(true);
}

function tagged(obj){ let o=obj; while(o){ if(o.userData && o.userData.kind) return o; o=o.parent; } return null; }
pickerFor(scene,S.camera,mount,(hit)=>{
  if(!hit){ deselect(); return; }
  const t=tagged(hit.object);
  if(!t) { deselect(); return; }
  const k=t.userData.kind;
  if(k==='part'){ selectPart(t); }
  else if(k==='slot'){
    if(!selected){ showToast('Primero toca una <b>pieza</b> del banco.',2200); return; }
    if(t.userData.id===selected.userData.id) placePart(selected,t); else wrongSlot(t);
  }
  else if(k==='placed'){
    const p=PART[t.userData.id];
    showToast('<b>'+p.name+'</b> — '+p.note,4200);
  }
});

function renderChecklist(){
  el('checklist').innerHTML=PARTS.map(p=>
    `<div class="ck ${placed[p.id]?'on':''}"><span>${placed[p.id]?'✔':'○'}</span> ${p.name}</div>`).join('');
}
function renderProg(){ el('p_prog').textContent=progress+' / '+PARTS.length; }

/* ============================ PIZARRÓN ============================ */
const bcv=document.createElement('canvas'); bcv.width=1024; bcv.height=768;
const bx=bcv.getContext('2d');
const btex=new THREE.CanvasTexture(bcv); btex.colorSpace=THREE.SRGBColorSpace;
btex.minFilter=THREE.LinearFilter; btex.generateMipmaps=false;
const boardG=new THREE.Group();
{
  const marco=roundedBox(1.66,1.26,0.05,MAT.frame,0.04); marco.position.z=-0.03; boardG.add(marco);
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.56,1.16),new THREE.MeshBasicMaterial({map:btex}));
  boardG.add(pl);
  boardG.position.set(-3.9,2.10,0.45); boardG.rotation.y=0.34;
  scene.add(boardG);
}
const CL={fg:'#dfe7ef',dim:'#8A94A0',ok:'#43D9AD',bad:'#FF6B6B',warn:'#FFB454',ac:'#4FD1C5',am:'#F4A261',vi:'#B197FC',az:'#6FB6FF',grid:'#1d2833'};

function bg(t,s){
  bx.clearRect(0,0,1024,768);
  bx.fillStyle='#0b1118'; bx.fillRect(0,0,1024,768);
  bx.strokeStyle='#1a2733'; bx.lineWidth=3; bx.strokeRect(6,6,1012,756);
  bx.textAlign='left'; bx.textBaseline='alphabetic';
  bx.fillStyle=CL.fg; bx.font='bold 29px Outfit, system-ui, sans-serif'; bx.fillText(t,32,50);
  if(s){ bx.fillStyle=CL.dim; bx.font='18px Outfit, system-ui, sans-serif'; bx.fillText(s,32,78); }
}
function line(x1,y1,x2,y2,color,w,dash){
  bx.save(); bx.strokeStyle=color; bx.lineWidth=w||2; if(dash)bx.setLineDash(dash);
  bx.beginPath(); bx.moveTo(x1,y1); bx.lineTo(x2,y2); bx.stroke(); bx.restore();
}
function labelAt(x,y,text,color,size,align,bold){
  bx.save(); bx.fillStyle=color||CL.fg;
  bx.font=(bold?'bold ':'')+(size||16)+'px Outfit, system-ui, sans-serif';
  bx.textAlign=align||'left'; bx.textBaseline='alphabetic'; bx.fillText(text,x,y); bx.restore();
}
function wrapText(x,y,text,color,size,maxW,lh){
  bx.save(); bx.fillStyle=color||CL.dim; bx.font=(size||16)+'px Outfit, system-ui, sans-serif';
  bx.textAlign='left'; bx.textBaseline='alphabetic';
  const words=String(text).split(' '); let ln='', yy=y;
  for(const w of words){
    const test=ln?ln+' '+w:w;
    if(bx.measureText(test).width>maxW && ln){ bx.fillText(ln,x,yy); yy+=(lh||size+6); ln=w; }
    else ln=test;
  }
  if(ln){ bx.fillText(ln,x,yy); yy+=(lh||size+6); }
  bx.restore(); return yy;
}
function caja(x,y,w,h,color,fill){
  bx.save(); if(fill){ bx.fillStyle=fill; bx.fillRect(x,y,w,h); }
  bx.strokeStyle=color||CL.grid; bx.lineWidth=2; bx.strokeRect(x,y,w,h); bx.restore();
}

const NOM_DP={sep:'Separador',pre:'Prefiltro',coal:'Coalescente',micro:'Microfiltro',carb:'Carbón act.',lub:'Lubricador'};
function nomDp(id){ return id.indexOf('sec_')===0 ? 'Secador '+SECADORES[id.slice(4)].corto : (NOM_DP[id]||id); }
const LETRA={okMontaje:'m',okSolidos:'s',okAgua:'a',okAceite:'c',okLub:'l',okPresion:'p',okEnergia:'e'};
const CRITNOM={okMontaje:'montaje',okSolidos:'sólidos',okAgua:'agua',okAceite:'aceite',okLub:'lubricación',okPresion:'presión',okEnergia:'energía'};
const CLIMA_CORTO={toluca:'Toluca 18 °C',cdmx:'CDMX 22 °C',veracruz:'Veracruz 32 °C',monterrey:'Monterrey 38 °C',intemperie:'Intemperie 4 °C'};
const EST_CORTO={martillo:'Martillo',pintura:'Pintura',alimento:'Envasado',instrum:'Instrum.',soplado:'Soplado'};
const TAM_CORTO={g14:'G1/4',g38:'G3/8',g12:'G1/2'};
const COLOR_SEC={s0:'#8A94A0',sf:'#6FB6FF',sm:'#4FD1C5',sa:'#B197FC'};

/* ---------- ① cascada de aceite y sólidos ---------- */
function drawTren(){
  const e=entrada(TR.clima);
  bg('Cascada de aceite — escalón por escalón',
     CLIMAS[TR.clima].nom+' · sale del posenfriador a '+f1(e.Tpost,0)+' °C · arrastre total '+f1(e.aceite,3)+' mg/m³ ('+f1(e.fracVap*100,0)+' % en fase vapor)');

  const OX=96, OY=520, W=800, H=390;
  const LMIN=Math.log10(0.002), LMAX=Math.log10(14);
  const hOf=v=> v>0 ? H*clamp((Math.log10(v)-LMIN)/(LMAX-LMIN),0,1) : 0;
  caja(OX,OY-H,W,H,CL.grid);
  // umbrales de clase ISO 8573-1
  for(const [v,c] of TAB_ACE){
    const y=OY-hOf(v);
    line(OX,y,OX+W,y,'#33424f',1.5,[7,7]);
    labelAt(OX+W-6,y-7,'clase '+c+'  ('+f1(v,v<1?2:0)+' mg/m³)',CL.dim,14,'right');
  }
  const gw=W/FINOK.length;
  FINOK.forEach((f,i)=>{
    const a=aceiteTren(TR.clima,f);
    const cx=OX+gw*i+gw/2;
    const sel=(f===TR.fino);
    if(sel) caja(OX+gw*i+4,OY-H+4,gw-8,H-8,CL.ac,'rgba(79,209,197,.06)');
    const bw=44;
    const hA=hOf(a.aerosol), hV=hOf(a.vapor);
    bx.fillStyle=CL.am; bx.fillRect(cx-bw-6,OY-hA,bw,hA);
    bx.fillStyle=CL.vi; bx.fillRect(cx+6,OY-hV,bw,hV);
    const yT=OY-hOf(a.total);
    line(cx-bw-14,yT,cx+bw+14,yT,CL.ok,3);
    labelAt(cx,yT-10,f1(a.total,a.total<0.1?4:3),CL.ok,16,'center',true);
    labelAt(cx,OY+24,FINOS[f].corto,sel?CL.ac:CL.fg,17,'center',sel);
    labelAt(cx,OY+46,'clase C '+claseAceite(a.total),claseAceite(a.total)<=2?CL.ok:CL.warn,15,'center');
    const sol=solidosTren(TR.clima,f,'s0',P_RED_NOM);
    labelAt(cx,OY+68,'clase A '+sol.clase,CL.dim,15,'center');
    labelAt(cx,OY+90,f1(FINOS[f].coste,0)+' u.c.',CL.dim,14,'center');
  });
  labelAt(OX,OY-H-14,'escala logarítmica  ·  ▮ aerosol  ▮ vapor  ·  ▬ total',CL.dim,15);
  bx.fillStyle=CL.am; bx.fillRect(OX+300,OY-H-25,16,12);
  bx.fillStyle=CL.vi; bx.fillRect(OX+400,OY-H-25,16,12);

  let y=OY+128;
  y=wrapText(OX,y,'El aerosol lo tumban los filtros mecánicos, pero cada uno tiene un piso de saturación: por debajo de él ya no separa nada. El vapor de aceite atraviesa todos los filtros mecánicos y sólo lo retiene el carbón activado. A '+f1(e.Tpost,0)+' °C el vapor ya es el '+f1(e.fracVap*100,0)+' % del arrastre, así que sin carbón la clase C se queda clavada.',CL.dim,17,W,24);
  labelAt(OX,y+8,'Sólidos: el polvo ambiental de '+f1(e.polvo,1)+' mg/m³ se concentra al comprimir hasta '+f1(solidosTren(TR.clima,'f0','s0',P_RED_NOM).conc,2)+' mg/m³ a '+f1(P_RED_NOM,1)+' bar. Un secador de adsorción añade finos de desecante y topa la clase A en 2.',CL.dim,16);
}

/* ---------- ② agua ---------- */
function drawAgua(){
  const e=entrada(AG.clima);
  const a=aguaTren(AG.clima,AG.sec,AG.pUso);
  bg('Agua — punto de rocío a presión frente al punto más frío de la línea',
     CLIMAS[AG.clima].nom+' · '+SECADORES[AG.sec].nom+' · uso a '+f1(AG.pUso,1)+' bar');

  const OX=92, OY=470, W=640, HH=330, TMN=-45, TMX=50, PMAX=130;
  const px=T=>OX+W*(T-TMN)/(TMX-TMN);
  const py=p=>OY-HH*clamp(p/PMAX,0,1);
  caja(OX,OY-HH,W,HH,CL.grid);
  for(let p=0;p<=PMAX;p+=26) line(OX,py(p),OX+W,py(p),'#182430',1);
  for(let T=-40;T<=50;T+=10){ line(px(T),OY,px(T),OY+6,CL.dim,1.5); labelAt(px(T),OY+24,String(T),CL.dim,14,'center'); }
  for(let p=0;p<=PMAX;p+=26) labelAt(OX-8,py(p)+5,f1(p,0),CL.dim,13,'right');
  labelAt(OX+W/2,OY+48,'temperatura (°C)',CL.dim,15,'center');
  bx.save(); bx.translate(OX-52,OY-HH/2); bx.rotate(-Math.PI/2);
  labelAt(0,0,'presión de saturación (mbar)',CL.dim,15,'center'); bx.restore();

  // zona por debajo del punto mas frio de la linea
  bx.save(); bx.fillStyle='rgba(111,182,255,.09)'; bx.fillRect(OX,OY-HH,Math.max(0,px(e.Tmin)-OX),HH); bx.restore();

  bx.save(); bx.strokeStyle=CL.ac; bx.lineWidth=3; bx.beginPath();
  let first=true;
  for(let T=TMN;T<=TMX;T+=0.5){ const X=px(T), Y=py(pSat(T)); if(first){bx.moveTo(X,Y);first=false;} else bx.lineTo(X,Y); }
  bx.stroke(); bx.restore();

  const marca=(T,color,txt,dy)=>{
    if(!isFinite(T)||T<TMN||T>TMX) return;
    line(px(T),OY,px(T),py(pSat(T)),color,2,[6,5]);
    line(OX,py(pSat(T)),px(T),py(pSat(T)),color,1.5,[4,6]);
    bx.save(); bx.fillStyle=color; bx.beginPath(); bx.arc(px(T),py(pSat(T)),6,0,7); bx.fill(); bx.restore();
    labelAt(px(T)+8,py(pSat(T))+(dy||-12),txt,color,15,'left',true);
  };
  marca(e.Tpost,CL.bad,'salida del posenfriador '+f1(e.Tpost,0)+' °C',-14);
  marca(e.Tmin,CL.warn,'punto más frío de la línea '+f1(e.Tmin,0)+' °C',18);
  marca(a.pdp,CL.az,'rocío a presión '+f1(a.pdp,0)+' °C',-14);

  const RX=770;
  labelAt(RX,150,'Lectura',CL.fg,20,'left',true);
  const filas=[
    ['Rocío a presión',f1(a.pdp,1)+' °C',a.condensa?CL.bad:CL.ok],
    ['Presión parcial',f1(a.pv,3)+' mbar',CL.fg],
    ['Rocío atmosférico',f1(a.pdpAtm,1)+' °C',a.extrapolado?CL.warn:CL.dim],
    ['Agua líquida',f1(a.cw,3)+' g/m³',a.cw>0?CL.warn:CL.ok],
    ['Clase B ISO 8573-1',String(a.clase),a.clase<=4?CL.ok:CL.warn],
  ];
  filas.forEach((f,i)=>{ labelAt(RX,186+i*46,f[0],CL.dim,15); labelAt(RX,208+i*46,f[1],f[2],19,'left',true); });

  const c=condensado(AG.clima,1,P_RED_NOM);
  labelAt(RX,430,'Posenfriador',CL.fg,18,'left',true);
  labelAt(RX,456,'por cada m³/min de aire libre',CL.dim,14);
  labelAt(RX,480,'entra  '+f1(c.wIn,2)+' g/min',CL.dim,16);
  labelAt(RX,502,'sale   '+f1(c.wOut,2)+' g/min',CL.dim,16);
  labelAt(RX,528,'drena '+f1(c.cond,2)+' g/min',CL.az,19,'left',true);

  let y=OY+90;
  y=wrapText(OX,y,a.condensa
    ? 'El rocío a presión ('+f1(a.pdp,0)+' °C) queda POR ENCIMA del punto más frío de la línea ('+f1(e.Tmin,0)+' °C): en ese tramo el aire vuelve a condensar y aparece agua líquida aguas abajo de todos los filtros.'
    : 'El rocío a presión ('+f1(a.pdp,0)+' °C) queda por debajo del punto más frío de la línea ('+f1(e.Tmin,0)+' °C): el aire ya no condensa en ningún punto del recorrido.',
    a.condensa?CL.bad:CL.ok,17,660,24);
  if(a.extrapolado) wrapText(OX,y+6,'Aviso: el rocío atmosférico equivalente ('+f1(a.pdpAtm,1)+' °C) cae fuera de la banda de validez declarada de Magnus-Sonntag (−45 °C); la cifra es una extrapolación, no una medida.',CL.warn,15,660,21);
  else wrapText(OX,y+6,'Bajar la presión al expandir sube el rocío equivalente a la atmósfera: '+f1(a.pdp,0)+' °C a '+f1(AG.pUso,1)+' bar equivalen a '+f1(a.pdpAtm,1)+' °C al aire libre. Por eso la norma habla de rocío A PRESIÓN.',CL.dim,15,660,21);
}

/* ---------- ③ escalera de presiones ---------- */
function drawPresion(){
  const cfg=cfgPR();
  const est=ESTACIONES[PR.est];
  const r=evalua(PR.est,PR.clima,cfg);
  const p=r.pres;
  bg('Escalera de presiones — ISO 6358 elemento a elemento',
     est.nom+' · '+f1(est.Q,0)+' Nl/min · pide '+f1(est.pReq,1)+' bar · cuerpo '+TAM_CORTO[cfg.tam]+' · purga '+f1(SECADORES[cfg.sec].purga*100,0)+' %');

  const OX=92, OY=430, W=610, HH=300, PMX=9;
  const py=v=>OY-HH*clamp(v/PMX,0,1);
  caja(OX,OY-HH,W,HH,CL.grid);
  for(let v=0;v<=PMX;v+=1){ line(OX,py(v),OX+W,py(v),'#182430',1); labelAt(OX-8,py(v)+5,f1(v,0),CL.dim,13,'right'); }
  labelAt(OX-64,OY-HH-14,'bar g',CL.dim,14);

  line(OX,py(P_MAX_RED),OX+W,py(P_MAX_RED),CL.bad,2,[8,6]);
  labelAt(OX+W-6,py(P_MAX_RED)-8,'máximo del compresor '+f1(P_MAX_RED,1)+' bar',CL.bad,14,'right');
  line(OX,py(est.pReq),OX+W,py(est.pReq),CL.ok,2,[8,6]);
  labelAt(OX+W-6,py(est.pReq)+20,'pide la estación '+f1(est.pReq,1)+' bar',CL.ok,14,'right');

  if(p.bloqueo){
    labelAt(OX+W/2,OY-HH/2,'BLOQUEO SÓNICO',CL.bad,40,'center',true);
    wrapText(OX,OY+40,'Con este cuerpo el caudal supera C·p₁ en algún elemento: la relación q/(C·p₁) llega a 1 y la norma ya no da solución. Hay que subir de talla.',CL.bad,17,W,24);
  } else {
    const nodos=[{n:'Red',v:p.pRed}];
    let acc=p.pRed;
    for(const d of p.dps){ acc-=d.dp; nodos.push({n:nomDp(d.id),v:acc,dp:d.dp,f:d.f}); }
    nodos.push({n:'Regulador (consigna)',v:p.pSet,reg:true});
    nodos.push({n:'Droop a caudal',v:p.pSet-p.droop});
    if(cfg.lub) nodos.push({n:'Lubricador',v:p.pSet-p.droop-p.dpLub});
    nodos.push({n:'Tubería',v:p.pUso,fin:true});
    const sw=W/nodos.length;
    let prev=null;
    nodos.forEach((nd,i)=>{
      const x0=OX+sw*i, x1=x0+sw, Y=py(nd.v);
      if(prev!==null) line(x0,prev,x0,Y,nd.reg?CL.warn:CL.az,2.5);
      line(x0,Y,x1,Y,nd.fin?CL.ok:CL.ac,3.5);
      prev=Y;
      bx.save(); bx.translate(x0+sw/2,OY+14); bx.rotate(-Math.PI/2.6);
      labelAt(0,0,nd.n,CL.dim,13,'right'); bx.restore();
      labelAt(x0+sw/2,Y-10,f1(nd.v,2),nd.fin?CL.ok:CL.fg,13,'center');
    });
  }

  const RX=740;
  labelAt(RX,140,'Caídas del tren',CL.fg,19,'left',true);
  if(!p.bloqueo){
    const dmax=Math.max(0.02,...p.dps.map(d=>d.dp),p.dpLub);
    p.dps.forEach((d,i)=>{
      const y=170+i*36;
      labelAt(RX,y,nomDp(d.id),CL.dim,14);
      bx.fillStyle=d.f>0.7?CL.warn:CL.ac; bx.fillRect(RX,y+6,240*(d.dp/dmax),9);
      labelAt(RX+246,y+15,f1(d.dp,3)+' bar',CL.fg,13);
      labelAt(RX+246,y+30,'q/(C·p₁) = '+f1(d.f,3),d.f>0.7?CL.warn:CL.dim,12);
    });
    const y2=170+p.dps.length*36+8;
    labelAt(RX,y2,'Suma del tren',CL.dim,14);
    labelAt(RX,y2+22,f1(p.sumDp,3)+' bar',CL.fg,19,'left',true);
    labelAt(RX,y2+52,'Droop del regulador',CL.dim,14);
    labelAt(RX,y2+74,f1(p.droop,3)+' bar',CL.fg,19,'left',true);
    if(cfg.lub){ labelAt(RX,y2+104,'Lubricador',CL.dim,14); labelAt(RX,y2+126,f1(p.dpLub,3)+' bar',CL.fg,19,'left',true); }
  }

  let y=OY+90;
  const dur=r.okPresion?CL.ok:CL.bad;
  labelAt(OX,y,r.okPresion
    ? '✔ Presión de red viable: '+f1(p.pRed,2)+' bar'
    : (p.bloqueo ? '✗ Bloqueo sónico: con este cuerpo no hay solución a ninguna presión.'
                 : '✗ Haría falta '+f1(p.pRed,2)+' bar de red y sólo hay '+f1(P_MAX_RED,1)),dur,21,'left',true);
  y=wrapText(OX,y+30,'El cálculo va al revés que la intuición: se parte de lo que pide la herramienta, se suman la tubería, el droop y el lubricador para fijar la consigna del regulador, se añade el diferencial mínimo de 0,7 bar y por último se suben las caídas de todo el tren. Como cada caída depende de la presión aguas arriba, el motor itera hasta que la escalera cierra.',CL.dim,16,W,22);
  wrapText(OX,y+4,'La purga de los secadores de membrana y de adsorción atraviesa el tren: los elementos anteriores al regulador ven '+f1((1+SECADORES[cfg.sec].purga)*100,0)+' % del caudal de la estación.',CL.dim,15,W,21);
}

/* ---------- ④ malla de proyecto ---------- */
function drawProyecto(){
  const est=ESTACIONES[PY.est];
  bg('Malla de proyecto — filtración × secador',
     est.nom+' · '+CLIMAS[PY.clima].nom+' · '+(PY.lub?'con lubricador':'sin lubricador')+' · cuerpo '+TAM_CORTO[PY.tam]);

  const OX=228, OY=176, CW=176, CH=92;
  SECK.forEach((s,j)=>labelAt(OX+CW*j+CW/2,OY-14,SECADORES[s].corto,COLOR_SEC[s],17,'center',true));
  const vals=validas(PY.est,PY.clima), cm=costeMin(PY.est,PY.clima);
  const opt=optimas(PY.est,PY.clima);
  const esOpt=(f,s)=>opt.some(c=>c.fino===f&&c.sec===s&&c.lub===PY.lub&&c.tam===PY.tam);

  FINOK.forEach((f,i)=>{
    labelAt(OX-14,OY+CH*i+CH/2+6,FINOS[f].corto,CL.fg,17,'right',true);
    SECK.forEach((s,j)=>{
      const x=OX+CW*j, y=OY+CH*i;
      const r=evalua(PY.est,PY.clima,{fino:f,sec:s,lub:PY.lub,tam:PY.tam});
      const fill=r.valido?(r.coste===cm?'rgba(67,217,173,.24)':'rgba(67,217,173,.10)'):'rgba(255,107,107,.07)';
      caja(x+3,y+3,CW-6,CH-6,r.valido?CL.ok:'#3a2b30',fill);
      if(esOpt(f,s)){ caja(x+7,y+7,CW-14,CH-14,CL.warn); }
      if(r.valido){
        labelAt(x+CW/2,y+40,f1(r.coste,0)+' u.c.',r.coste===cm?CL.ok:CL.fg,24,'center',true);
        labelAt(x+CW/2,y+64,'['+r.clase.A+':'+r.clase.B+':'+r.clase.C+']',CL.dim,15,'center');
      } else {
        labelAt(x+CW/2,y+42,LETRA[r.primero],CL.bad,30,'center',true);
        labelAt(x+CW/2,y+66,CRITNOM[r.primero],CL.dim,14,'center');
      }
    });
  });

  const LY=OY+CH*FINOK.length+34;
  labelAt(OX-14,LY,'Letra = primer criterio que falla:',CL.dim,15,'right');
  labelAt(OX,LY,CRIT.map(k=>LETRA[k]+' '+CRITNOM[k]).join('   ·   '),CL.dim,15);
  labelAt(OX-14,LY+26,'Marco ámbar = óptimo global de la estación',CL.warn,15,'right');
  labelAt(OX,LY+26,opt.length?opt.map(c=>FINOS[c.fino].corto+' + '+SECADORES[c.sec].corto+(c.lub?' + lubricador':'')+' · '+TAM_CORTO[c.tam]).join('   |   '):'sin solución',CL.warn,15);

  labelAt(60,LY+70,'Válidas en el catálogo completo (5×4×2×3 = '+CFGS.length+' combinaciones): '+vals.length+'  ·  coste mínimo: '+(cm===null?'—':f1(cm,0)+' u.c.'),CL.fg,18,'left',true);
  wrapText(60,LY+100,'La malla sólo muestra el corte con el lubricador y el cuerpo elegidos: cambiando esos dos selectores se recorre el catálogo entero. El coste va en unidades de catálogo, no en pesos: sirve para ordenar alternativas.',CL.dim,15,900,21);
}

/* ---------- ⑤ reto ---------- */
function drawReto(){
  const esc=ESCENAS[retoK], est=ESTACIONES[esc.est];
  const r=evalua(esc.est,esc.clima,{...RET});
  bg('Reto '+(retoK+1)+' / '+ESCENAS.length+' — elige el tren válido más barato',
     est.nom+' · '+CLIMAS[esc.clima].nom);

  caja(40,110,460,250,CL.grid,'rgba(255,255,255,.02)');
  labelAt(60,142,'Pliego de la estación',CL.fg,19,'left',true);
  const pl=[
    ['Presión en el punto de uso','≥ '+f1(est.pReq,1)+' bar'],
    ['Caudal',f1(est.Q,0)+' Nl/min'],
    ['Clases ISO 8573-1','['+est.cl.A+':'+est.cl.B+':'+est.cl.C+']'],
    ['Lubricación',est.lub==='exige'?'la exige':'la prohíbe'],
    ['Margen ISA de 10 K',est.margen?'sí (aire de instrumentación)':'no'],
    ['Tope de energía',f1(est.Emax,0)+' kWh/año'],
  ];
  pl.forEach((f,i)=>{ labelAt(60,176+i*30,f[0],CL.dim,15); labelAt(480,176+i*30,String(f[1]).trim(),CL.fg,16,'right',true); });

  caja(524,110,460,250,CL.grid,'rgba(255,255,255,.02)');
  labelAt(544,142,'Aire de entrada',CL.fg,19,'left',true);
  const e=entrada(esc.clima);
  const am=[
    ['Ambiente',f1(e.T,0)+' °C · '+f1(e.HR*100,0)+' % HR'],
    ['Salida del posenfriador',f1(e.Tpost,0)+' °C'],
    ['Punto más frío de la línea',f1(e.Tmin,0)+' °C'],
    ['Arrastre de aceite',f1(e.aceite,3)+' mg/m³ ('+f1(e.fracVap*100,0)+' % vapor)'],
    ['Polvo ambiental',f1(e.polvo,1)+' mg/m³'],
    ['Rocío máximo admisible',f1(r.pdpMax,0)+' °C'],
  ];
  am.forEach((f,i)=>{ labelAt(544,176+i*30,f[0],CL.dim,15); labelAt(964,176+i*30,f[1],CL.fg,16,'right',true); });

  labelAt(40,404,'Tu tren',CL.fg,20,'left',true);
  const ejesTxt={fino:FINOS[RET.fino].corto,sec:SECADORES[RET.sec].corto,lub:RET.lub?'con lubricador':'sin lubricador',tam:TAM_CORTO[RET.tam]};
  EJES.forEach((j,i)=>{
    const x=40+i*246;
    const okj=retoChecked?retoOk[j]:null;
    const col=okj===null?CL.grid:(okj?CL.ok:CL.bad);
    caja(x,420,232,74,col,okj===null?'rgba(255,255,255,.02)':(okj?'rgba(67,217,173,.10)':'rgba(255,107,107,.10)'));
    labelAt(x+14,444,{fino:'Filtración',sec:'Secador',lub:'Lubricación',tam:'Cuerpo'}[j],CL.dim,14);
    labelAt(x+14,470,ejesTxt[j],CL.fg,18,'left',true);
    if(okj!==null) labelAt(x+214,470,okj?'✔':'✗',col,22,'right',true);
  });

  labelAt(40,540,'Resultado del tren',CL.fg,19,'left',true);
  const res=[
    ['Clases obtenidas','['+r.clase.A+':'+r.clase.B+':'+r.clase.C+']'],
    ['Rocío a presión',f1(r.agua.pdp,0)+' °C'],
    ['Presión de red',r.pres.bloqueo?'bloqueo':f1(r.pres.pRed,2)+' bar'],
    ['Energía anual',f1(r.ene.kWh,0)+' kWh'],
    ['Coste',f1(r.coste,0)+' u.c.'],
  ];
  res.forEach((f,i)=>{ const x=40+i*192; labelAt(x,566,f[0],CL.dim,14); labelAt(x,592,f[1],CL.fg,19,'left',true); });

  let y=628;
  CRIT.forEach((k,i)=>{
    const x=40+(i%4)*246, yy=y+Math.floor(i/4)*28;
    labelAt(x,yy,(r[k]?'✔ ':'✗ ')+CRITNOM[k],r[k]?CL.ok:CL.bad,16);
  });
  y+=64;
  if(!r.valido) wrapText(40,y+8,MOTIVO[r.primero],CL.bad,17,940,22);
  else if(!retoSolved) wrapText(40,y+8,'El tren es válido: ahora comprueba si además es el más barato. Coste actual '+f1(r.coste,0)+' u.c. y el mínimo del catálogo es '+f1(costeMin(esc.est,esc.clima),0)+' u.c.',CL.warn,17,940,22);
  else wrapText(40,y+8,'Resuelto: válido y de coste mínimo en los cuatro ejes.',CL.ok,17,940,22);
}

/* ============================ QUIZ ============================ */
const QUIZ=[
  { q:'El martillo cincelador pide 900 Nl/min. Con el cuerpo G1/4 el tren necesita 8,20 bar de red y con el G3/8 sólo 7,31. ¿Por qué el cuerpo grande resuelve el problema?',
    opts:[
      'Porque la conductancia sónica C de cada elemento crece con el cuerpo (×1,90 en el G3/8) y en ISO 6358 la caída depende de la relación q/(C·p₁): al subir C baja la caída y ya no hay que empujar la red por encima de los 8,0 bar disponibles.',
      'Porque el cuerpo grande tiene más volumen interno y almacena aire, así que amortigua los picos del martillo.',
      'Porque con el cuerpo G3/8 el regulador puede entregar una presión de consigna más alta.',
      'Porque al aumentar la sección del cuerpo circula menos caudal por cada filtro.'],
    ok:0 },
  { q:'En la cabina de pintura a la intemperie el aceite residual sólo puede llegar a clase 2 (≤ 0,1 mg/m³). Con prefiltro y coalescente quedan 0,149 mg/m³. ¿Qué falta?',
    opts:[
      'El microfiltro de 0,01 µm: baja el aerosol hasta su piso de 0,01 mg/m³ y deja el total en 0,059 mg/m³, que ya es clase 2.',
      'Un segundo coalescente en serie: dos coalescentes iguales multiplican su rendimiento.',
      'El carbón activado, porque es el único elemento que retiene aerosol.',
      'Un secador frigorífico: al condensar el agua arrastra también el aceite.'],
    ok:0 },
  { q:'El envasado con contacto directo exige clase C 1 (≤ 0,01 mg/m³ de aceite) pero admite clase B 4 (rocío a presión ≤ +3 °C). ¿Por qué basta un secador frigorífico y en cambio hace falta carbón activado?',
    opts:[
      'Porque el punto más frío de esa línea está a 12 °C y un rocío de +3 °C ya no condensa allí; pero ningún filtro mecánico toca el vapor de aceite, y a 48 °C de salida del posenfriador el vapor ya son 5,46 mg/m³: sólo el carbón lo baja a 0,003.',
      'Porque el secador frigorífico también adsorbe el aceite en su intercambiador.',
      'Porque el carbón activado seca el aire y el frigorífico limpia el aceite.',
      'Porque la clase C se mide únicamente sobre el aceite líquido, que el frigorífico purga con el condensado.'],
    ok:0 },
  { q:'Para el aire de instrumentación el secador de membrana (26 u.c.) es más barato que el de adsorción (34 u.c.) y su rocío de −20 °C también cumple el margen ISA de 10 K. Aun así la solución es el de adsorción. ¿Por qué?',
    opts:[
      'Porque la membrana purga un 18 % del aire de forma permanente frente al 15 % de la adsorción: ese aire extra que el compresor tiene que aspirar sube el consumo a 6 061 kWh/año y el pliego topa en 6 000.',
      'Porque la membrana no puede bajar de −20 °C y el pliego exige un rocío a presión de −40 °C.',
      'Porque la membrana suelta finos de desecante y limita la clase A a 2.',
      'Porque la membrana exige un microfiltro previo y el de adsorción no exige nada.'],
    ok:0 },
  { q:'El soplado en la línea de electrónica exige clase A 1 (partículas). El secador de adsorción es el que da el rocío más bajo, pero aquí queda descartado. ¿Por qué?',
    opts:[
      'Porque el lecho de desecante se desgasta por atrición y suelta finos aguas abajo: en este catálogo la adsorción topa la clase A en 2 por muy fino que sea el filtro anterior, y la estación pide 1.',
      'Porque un rocío de −40 °C reseca tanto el aire que carga de electricidad estática las placas.',
      'Porque su purga del 15 % dispara el consumo por encima del presupuesto energético.',
      'Porque el secador de adsorción no puede trabajar a los 3 bar que pide el soplado.'],
    ok:0 },
];
let quizOrder=[], quizPick=-1, quizOkIdx=0;
function shuffleQuiz(){
  const n=QUIZ[retoK].opts.length;
  quizOrder=Array.from({length:n},(_,i)=>i);
  for(let i=n-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=quizOrder[i]; quizOrder[i]=quizOrder[j]; quizOrder[j]=t; }
  quizOkIdx=quizOrder.indexOf(QUIZ[retoK].ok);
  quizPick=-1;
}
function renderQuiz(){
  const Q=QUIZ[retoK];
  el('quizQ').innerHTML=Q.q;
  el('dxbtns').innerHTML=quizOrder.map((oi,i)=>{
    let cls='b';
    if(quizPick>=0){ if(i===quizOkIdx) cls='b ok'; else if(i===quizPick) cls='b bad'; }
    return `<button class="${cls}" data-i="${i}">${String.fromCharCode(65+i)}. ${Q.opts[oi]}</button>`;
  }).join('');
  document.querySelectorAll('#dxbtns [data-i]').forEach(b=>{ b.onclick=()=>answerQuiz(+b.dataset.i); });
  const v=el('quizVerd');
  v.textContent=quizPick<0?'Sin responder':(quizPick===quizOkIdx?'Correcta':'Incorrecta');
  v.className=quizPick<0?'':(quizPick===quizOkIdx?'ok':'bad');
}
function answerQuiz(i){
  if(quizPick>=0) return;
  quizPick=i;
  const good=(i===quizOkIdx);
  renderQuiz();
  if(good){ synth.beep(1046,0.12,0.06); showToast('✔ Correcta.'); }
  else { synth.beep(200,0.18,0.06); showToast('<span style="color:var(--bad)">✗ Incorrecta. La respuesta buena queda marcada en verde.</span>',4200); }
}

/* ============================ ESTADO DE LOS MODOS ============================ */
let TR={clima:'monterrey',fino:'f0'};
let AG={clima:'veracruz',sec:'s0',pUso:6};
let PR={est:'martillo',clima:'toluca',fino:'f0',sec:'sf',lub:true,tam:'g14'};
let PY={est:'instrum',clima:'monterrey',lub:false,tam:'g14'};
let retoK=0, RET=null, retoChecked=false, retoSolved=false;
const retoOk={fino:false,sec:false,lub:false,tam:false};
let RIGR=null;
function cfgPR(){ return {fino:PR.fino,sec:PR.sec,lub:PR.lub,tam:PR.tam}; }

function newReto(){
  let k=retoK;
  if(ESCENAS.length>1){ while(k===retoK) k=Math.floor(Math.random()*ESCENAS.length); }
  retoK=k;
  RET=startCfg(ESCENAS[k].est,ESCENAS[k].clima);
  retoChecked=false; retoSolved=false;
  EJES.forEach(j=>retoOk[j]=false);
  shuffleQuiz(); renderQuiz();
  refreshAll();
  showToast('🎲 Nueva estación asignada.');
}
function checkReto(){
  const esc=ESCENAS[retoK];
  retoChecked=true;
  EJES.forEach(j=>retoOk[j]=okEje(esc.est,esc.clima,j,RET[j]));
  const todo=EJES.every(j=>retoOk[j]);
  retoSolved=todo;
  refreshAll();
  if(todo){ synth.beep(523,0.1,0.05); setTimeout(()=>synth.beep(784,0.14,0.05),130);
    showToast('✔ Correcto: tren válido y de coste mínimo en los cuatro ejes.',4200); }
  else { synth.beep(220,0.14,0.05);
    const r=evalua(esc.est,esc.clima,{...RET});
    showToast('<span style="color:var(--bad)">✗ '+(r.valido?'El tren funciona pero no es el más barato.':MOTIVO[r.primero])+'</span>',4600); }
}

/* ============================ TELEMETRÍA ============================ */
function updateTele(){
  const set=(id,v,cls)=>{ const e=el(id); if(!e)return; e.textContent=v; e.className=cls||''; };
  // tren
  {
    const e=entrada(TR.clima), a=aceiteTren(TR.clima,TR.fino), s=solidosTren(TR.clima,TR.fino,'s0',P_RED_NOM);
    set('tr_T',f1(e.T,0)+' °C'); set('tr_Tpost',f1(e.Tpost,0)+' °C');
    set('tr_ace',f1(e.aceite,3)+' mg/m³'); set('tr_frac',f1(e.fracVap*100,0)+' %');
    set('tr_aero',f1(a.aerosol,4)+' mg/m³'); set('tr_vap',f1(a.vapor,4)+' mg/m³');
    set('tr_tot',f1(a.total,4)+' mg/m³');
    set('tr_clC','clase '+claseAceite(a.total),claseAceite(a.total)<=2?'ok':'warn');
    set('tr_pol',f1(s.conc,2)+' mg/m³'); set('tr_clA','clase '+s.clase);
    set('tr_coste',f1(FINOS[TR.fino].coste,0)+' u.c.');
  }
  // agua
  {
    const e=entrada(AG.clima), a=aguaTren(AG.clima,AG.sec,AG.pUso), c=condensado(AG.clima,1,P_RED_NOM);
    set('ag_pdp',f1(a.pdp,1)+' °C',a.condensa?'bad':'ok');
    set('ag_tmin',f1(e.Tmin,0)+' °C');
    set('ag_pv',f1(a.pv,3)+' mbar');
    set('ag_atm',f1(a.pdpAtm,1)+' °C',a.extrapolado?'warn':'');
    set('ag_cw',f1(a.cw,3)+' g/m³',a.cw>0?'warn':'ok');
    set('ag_clB','clase '+a.clase,a.clase<=4?'ok':'warn');
    set('ag_cond',f1(c.cond,2)+' g/min');
    set('ag_purga',f1(SECADORES[AG.sec].purga*100,0)+' %');
  }
  // presion
  {
    const r=RIGR, p=r.pres;
    set('pr_pred',p.bloqueo?'bloqueo':f1(p.pRed,2)+' bar',r.okPresion?'ok':'bad');
    set('pr_pset',p.bloqueo?'—':f1(p.pSet,2)+' bar');
    set('pr_droop',p.bloqueo?'—':f1(p.droop,3)+' bar');
    set('pr_sum',p.bloqueo?'—':f1(p.sumDp,3)+' bar');
    set('pr_dplub',(!p.bloqueo&&PR.lub)?f1(p.dpLub,3)+' bar':'—');
    set('pr_puso',p.bloqueo?'—':f1(p.pUso,2)+' bar',(!p.bloqueo&&p.pUso>=ESTACIONES[PR.est].pReq-1e-9)?'ok':'bad');
    const fmax=p.bloqueo?1:Math.max(0,...p.dps.map(d=>d.f));
    set('pr_f',p.bloqueo?'≥ 1':f1(fmax,3),fmax>0.7?'warn':'');
    set('pr_kwh',f1(r.ene.kWh,0)+' kWh/año',r.okEnergia?'ok':'bad');
  }
  // proyecto
  {
    const v=validas(PY.est,PY.clima), cm=costeMin(PY.est,PY.clima), o=optimas(PY.est,PY.clima);
    set('py_tot',String(CFGS.length));
    set('py_val',String(v.length),v.length?'ok':'bad');
    set('py_cmin',cm===null?'—':f1(cm,0)+' u.c.');
    set('py_opt',o.length?o.map(c=>FINOS[c.fino].corto+'+'+SECADORES[c.sec].corto+(c.lub?'+lub':'')+' '+TAM_CORTO[c.tam]).join(' | '):'—');
    const enMalla=FINOK.length*SECK.length;
    let okMalla=0;
    for(const f of FINOK) for(const s of SECK) if(evalua(PY.est,PY.clima,{fino:f,sec:s,lub:PY.lub,tam:PY.tam}).valido) okMalla++;
    set('py_here',okMalla+' / '+enMalla);
  }
  // reto
  {
    const esc=ESCENAS[retoK];
    const r=evalua(esc.est,esc.clima,{...RET});
    set('re_est',ESTACIONES[esc.est].nom);
    set('re_clima',CLIMAS[esc.clima].nom);
    set('re_clase','['+r.clase.A+':'+r.clase.B+':'+r.clase.C+']');
    set('re_pide','['+ESTACIONES[esc.est].cl.A+':'+ESTACIONES[esc.est].cl.B+':'+ESTACIONES[esc.est].cl.C+']');
    set('re_coste',f1(r.coste,0)+' u.c.');
    set('re_kwh',f1(r.ene.kWh,0)+' / '+f1(ESTACIONES[esc.est].Emax,0),r.okEnergia?'ok':'bad');
    set('re_verd',!retoChecked?'sin comprobar':(retoSolved?'resuelto':'revisa el eje marcado'),!retoChecked?'':(retoSolved?'ok':'bad'));
    el('retoText').innerHTML='<b>'+ESTACIONES[esc.est].nom+'</b> en <b>'+CLIMAS[esc.clima].nom+'</b>. '+
      'Elige filtración, secador, lubricación y cuerpo para que el tren cumpla el pliego <b>['+ESTACIONES[esc.est].cl.A+':'+ESTACIONES[esc.est].cl.B+':'+ESTACIONES[esc.est].cl.C+']</b> al <b>coste mínimo</b>.';
  }
}

/* ============================ SINCRONÍA DE BOTONES ============================ */
const onOff=(sel,val)=>document.querySelectorAll(sel).forEach(b=>b.classList.toggle('on',b.dataset.k===String(val)));
function syncBtns(){
  onOff('#trClima [data-k]',TR.clima); onOff('#trFino [data-k]',TR.fino);
  onOff('#agClima [data-k]',AG.clima); onOff('#agSec [data-k]',AG.sec); onOff('#agP [data-k]',AG.pUso);
  onOff('#prEst [data-k]',PR.est); onOff('#prClima [data-k]',PR.clima); onOff('#prFino [data-k]',PR.fino);
  onOff('#prSec [data-k]',PR.sec); onOff('#prLub [data-k]',PR.lub?1:0); onOff('#prTam [data-k]',PR.tam);
  onOff('#pyEst [data-k]',PY.est); onOff('#pyClima [data-k]',PY.clima); onOff('#pyLub [data-k]',PY.lub?1:0); onOff('#pyTam [data-k]',PY.tam);
  if(RET){ onOff('#reFino [data-k]',RET.fino); onOff('#reSec [data-k]',RET.sec); onOff('#reLub [data-k]',RET.lub?1:0); onOff('#reTam [data-k]',RET.tam); }
  const bf=el('btnFlujo'); if(bf){ bf.classList.toggle('on',flujoOn); bf.textContent=flujoOn?'⏸ Detener flujo':'▶ Ver el flujo'; }
}
function drawBoard(){
  if(mode==='tren') drawTren();
  else if(mode==='agua') drawAgua();
  else if(mode==='presion') drawPresion();
  else if(mode==='proyecto') drawProyecto();
  else if(mode==='reto') drawReto();
  else {
    bg('Unidad de tratamiento de aire comprimido','Monta las siete piezas para desbloquear los cinco modos de análisis.');
    let y=140;
    y=wrapText(40,y,'El aire que sale de un compresor no sirve tal cual: llega caliente, saturado de humedad, cargado con el aceite del propio compresor y con todo el polvo que aspiró del ambiente ya concentrado por la compresión.',CL.dim,20,940,28);
    y=wrapText(40,y+10,'ISO 8573-1 lo resume en tres cifras entre corchetes: [A:B:C] = sólidos : agua : aceite. Cada estación de trabajo pide las suyas, y el tren de tratamiento es lo que las consigue — pagando siempre en dinero y en energía.',CL.dim,20,940,28);
    const pasos=['Posenfriador','Separador','Filtros finos','Secador','Regulador','Lubricador','Punto de uso'];
    pasos.forEach((p,i)=>{
      const x=48+i*136, ok=placed[ORDER[i]];
      caja(x,y+40,118,84,ok?CL.ok:CL.grid,ok?'rgba(67,217,173,.12)':'rgba(255,255,255,.02)');
      labelAt(x+59,y+76,ok?'✔':String(i+1),ok?CL.ok:CL.dim,26,'center',true);
      labelAt(x+59,y+108,p,ok?CL.fg:CL.dim,13,'center');
      if(i<6) labelAt(x+126,y+82,'→',CL.dim,20,'center');
    });
    labelAt(40,y+178,progress+' / '+PARTS.length+' piezas montadas',CL.fg,22,'left',true);
  }
  btex.needsUpdate=true;
}
function refreshAll(){
  RIGR=evalua(PR.est,PR.clima,cfgPR());
  syncBtns(); drawBoard(); updateTele(); applyRig();
}

/* ============================ MODOS ============================ */
const BOARD_CAM=[[-2.0,2.9,3.6],[-3.9,2.05,0.45]];
const MODE_META={
  ensamble:{nombre:'Ensamble',    cam:[[5.8,3.6,7.0],[0.2,1.5,0.3]]},
  tren:    {nombre:'Aceite y sólidos', cam:BOARD_CAM},
  agua:    {nombre:'Agua',        cam:BOARD_CAM},
  presion: {nombre:'Presiones',   cam:BOARD_CAM},
  proyecto:{nombre:'Proyecto',    cam:BOARD_CAM},
  reto:    {nombre:'Reto',        cam:BOARD_CAM},
};
const modes=['ensamble','tren','agua','presion','proyecto','reto'];
let mode='ensamble';
function setMode(k){
  if(k!=='ensamble' && !simUnlocked){
    showToast('<span style="color:var(--bad)">🔒 Termina el ensamble primero.</span>');
    synth.beep(220,0.08,0.05); return;
  }
  mode=k;
  modes.forEach(m=>{ const b=el('m_'+m); if(b) b.classList.toggle('on',m===k); });
  el('p_mode').textContent=MODE_META[k].nombre;
  el('secEnsamble').style.display=k==='ensamble'?'':'none';
  el('secTren').style.display=k==='tren'?'':'none';
  el('secAgua').style.display=k==='agua'?'':'none';
  el('secPresion').style.display=k==='presion'?'':'none';
  el('secProyecto').style.display=k==='proyecto'?'':'none';
  el('secReto').style.display=k==='reto'?'':'none';
  if(k==='reto'){ shuffleQuiz(); renderQuiz(); }
  S.moveTo(MODE_META[k].cam[0],MODE_META[k].cam[1],1.3);
  refreshAll();
}
function syncCtrlbar(){ modes.forEach(m=>{ const b=el('m_'+m); if(b && m!=='ensamble') b.disabled=!simUnlocked; }); }

/* ============================ RIG 3D ============================ */
function applyRig(){
  if(!RIGR) return;
  const p=RIGR.pres;
  if(rig.aguja){
    const v=p.bloqueo?P_MAX_RED:clamp(p.pSet,0,10);
    rig.aguja.rotation.z=Math.PI*0.75-(v/10)*Math.PI*1.5;
  }
  if(rig.secLed){
    const c=new THREE.Color(COLOR_SEC[PR.sec]);
    rig.secLed.m.color.copy(c); rig.secLed.m.emissive.copy(c);
    rig.secLed.m.emissiveIntensity=PR.sec==='s0'?0.15:1.3;
  }
  if(rig.lubLed){
    const c=new THREE.Color(PR.lub?0xE7A94B:0x3a4048);
    rig.lubLed.m.color.copy(c); rig.lubLed.m.emissive.copy(c);
    rig.lubLed.m.emissiveIntensity=PR.lub?1.4:0.05;
  }
  if(rig.aceiteNivel){ rig.aceiteNivel.o.visible=PR.lub; }
  const activos=FINOS[PR.fino].el;
  for(const id of ['pre','coal','micro','carb']){
    const b=rig.bowls[id]; if(!b) continue;
    const on=activos.indexOf(id)>=0;
    b.mat.opacity=on?0.34:0.08;
    b.vaso.visible=true;
  }
  if(rig.gota){
    const fad=RIGR.ene.fad;
    const c=condensado(PR.clima,fad,p.bloqueo?P_MAX_RED:p.pRed);
    rig.gota.userData.rate=c.cond;
  }
}

/* ============================ ANIMACIÓN ============================ */
S.setAnimate((dt,t)=>{
  for(let i=tweens.length-1;i>=0;i--){
    const w=tweens[i];
    w.t=Math.min(1,w.t+dt/w.dur);
    const u=ease(w.t);
    w.obj.position.lerpVectors(w.fromP,w.toP,u);
    w.obj.position.y+=Math.sin(u*Math.PI)*0.45;
    const s=w.fromS+(w.toS-w.fromS)*u;
    w.obj.scale.setScalar(s);
    w.obj.rotation.y=w.roty0*(1-u);
    if(w.t>=1){ w.obj.position.copy(w.toP); w.obj.scale.setScalar(w.toS); w.obj.rotation.y=0; if(w.onDone)w.onDone(); tweens.splice(i,1); }
  }
  for(const g of movibles){
    const d=g.userData;
    if(d.kind==='part'){
      g.position.y=d.baseY+Math.sin(t*1.6+d.phase)*0.02+d.lift;
      g.rotation.y+=dt*0.35;
    }
  }
  for(const gh of ghosts){
    const d=gh.userData;
    if(placed[d.id]){ if(!d.fading){ d.fading=true; } }
    if(d.fading){
      d.gm.opacity=Math.max(0,d.gm.opacity-dt*1.4);
      if(d.gm.opacity<=0.001) gh.visible=false;
    } else if(gh.visible){
      d.gm.opacity=0.24+0.14*Math.sin(t*3.2);
      d.gm.emissiveIntensity=0.45+0.25*Math.sin(t*3.2);
    }
    if(d.shake>0){
      d.shake=Math.max(0,d.shake-dt*2.2);
      gh.position.x=PART[d.id].home.x+Math.sin(t*48)*d.shake*0.04;
    }
  }
  if(simUnlocked && tweens.length===0){
    // flujo de aire por el riel
    flow.visible=flujoOn;
    if(flujoOn){
      const q=ESTACIONES[PR.est].Q;
      const vel=0.5+q/900*1.3;
      flowT=(flowT+dt*vel)%0.3;
      const col=new THREE.Color(RIGR&&RIGR.clAce<=2?0x4FD1C5:0xF4A261);
      flowPts.forEach((s,i)=>{
        s.position.x=-2.7+((i*0.3+flowT)%5.4);
        s.material.color.copy(col); s.material.emissive.copy(col);
        s.material.opacity=0.55+0.35*Math.sin(t*4+i);
      });
    }
    // goteo del separador
    if(rig.gota){
      const rate=rig.gota.userData.rate||0;
      if(rate>0.2){
        gotaT+=dt*clamp(rate/6,0.4,3.0);
        const u=gotaT%1;
        rig.gota.visible=true;
        rig.gota.position.y=-0.45-u*0.55;
        rig.gota.scale.setScalar(1-u*0.4);
      } else { rig.gota.visible=false; }
    }
  } else { flow.visible=false; if(rig.gota) rig.gota.visible=false; }
});
S.start();

/* ============================ AUTOMATISMOS ============================ */
const sleep=ms=>new Promise(res=>setTimeout(res,ms));
let autoRunning=false;
async function autoAssemble(){
  if(autoRunning) return;
  autoRunning=true;
  const ba=el('btnAuto'), bt=el('btnTour');
  if(ba)ba.disabled=true; if(bt)bt.disabled=true;
  try{
    for(const id of ORDER){
      if(placed[id]) continue;
      const obj=movibles.find(o=>o.userData.id===id);
      const gh=ghosts.find(g=>g.userData.id===id);
      if(!obj||!gh) continue;
      selectPart(obj);
      await sleep(340);
      placePart(obj,gh);
      await sleep(720);
    }
  } finally {
    if(ba)ba.disabled=false; if(bt)bt.disabled=false; autoRunning=false;
  }
}
async function runAuto(){
  if(autoRunning) return;
  const bt=el('btnTour'), ba=el('btnAuto');
  autoRunning=true;
  if(bt)bt.disabled=true; if(ba)ba.disabled=true;
  try{
    if(!simUnlocked){
      showToast('🎬 Monto el tren y después recorro los cinco modos.',2600);
      await sleep(1200);
      for(const id of ORDER){
        if(placed[id]) continue;
        const obj=movibles.find(o=>o.userData.id===id);
        const gh=ghosts.find(g=>g.userData.id===id);
        if(!obj||!gh) continue;
        selectPart(obj); await sleep(260); placePart(obj,gh); await sleep(620);
      }
      await sleep(1200);
    }

    setMode('tren');
    TR.clima='monterrey'; TR.fino='f0'; refreshAll();
    showToast('① Verano seco en Monterrey: el aire sale del posenfriador a 48 °C y arrastra 10,45 mg/m³ de aceite. Clase C 10, o sea fuera de tabla.',5200);
    await sleep(5400);
    TR.fino='f2'; refreshAll();
    showToast('Prefiltro + coalescente: el aerosol baja muchísimo… y el total sigue en 5,56 mg/m³. Clase C 10 otra vez.',5000);
    await sleep(5200);
    TR.fino='f4'; refreshAll();
    showToast('El culpable es el VAPOR: a 48 °C es el 52 % del arrastre y ningún filtro mecánico lo toca. Con carbón activado, 0,0085 mg/m³ y clase C 1.',5600);
    await sleep(5800);

    setMode('agua');
    AG.clima='veracruz'; AG.sec='s0'; refreshAll();
    showToast('② Nave costera: sin secador, el rocío a presión es la propia temperatura del aire, 42 °C. Clase B 9.',5000);
    await sleep(5200);
    AG.sec='sf'; refreshAll();
    showToast('El secador frigorífico lo fija en +3 °C: clase B 4 y ni una gota mientras la línea no baje de ahí.',4800);
    await sleep(5000);
    AG.clima='intemperie'; refreshAll();
    showToast('Pero a la intemperie en invierno la línea llega a −12 °C: ese mismo +3 °C vuelve a condensar aguas abajo de todos los filtros.',5400);
    await sleep(5600);
    AG.sec='sm'; refreshAll();
    showToast('Con membrana, −20 °C de rocío a presión: por debajo del punto más frío. El agua deja de ser un problema.',4800);
    await sleep(5000);

    setMode('presion');
    PR.est='martillo'; PR.clima='toluca'; PR.fino='f0'; PR.sec='sf'; PR.lub=true; PR.tam='g14'; refreshAll();
    flujoOn=true; refreshAll();
    showToast('③ El martillo pide 6,0 bar y 900 Nl/min. Con el cuerpo G1/4 la escalera exige 8,20 bar de red y el compresor sólo da 8,0.',5400);
    await sleep(5600);
    PR.tam='g38'; refreshAll();
    showToast('Con el cuerpo G3/8 la conductancia sónica sube ×1,90: las caídas se hunden y bastan 7,31 bar. Mismo tren, otro tamaño.',5200);
    await sleep(5400);
    flujoOn=false; refreshAll();

    setMode('proyecto');
    PY.est='instrum'; PY.clima='monterrey'; PY.lub=false; PY.tam='g14'; refreshAll();
    showToast('④ Aire de instrumentación: sólo 3 de las 120 combinaciones cumplen, y la más barata cuesta 86 u.c. La letra de cada celda dice qué criterio cae primero.',5600);
    await sleep(5800);
    showToast('⑤ Ahora tú: en el reto tienes que acertar los cuatro ejes — filtración, secador, lubricación y cuerpo — válidos y al coste mínimo.',4800);
  } finally {
    if(bt)bt.disabled=false; if(ba)ba.disabled=false; autoRunning=false;
  }
}

/* ============================ HUD ============================ */
el('hud').innerHTML=`
  <div class="eyebrow">Hidráulica y Neumática · Aire comprimido</div>
  <h2>Configura la unidad FRL y evalúa la calidad del aire</h2>
  <p>Monta el tren de tratamiento pieza por pieza (<b>toca la pieza, luego su hueco</b>). Después sigue la <b>cascada de aceite</b> escalón a escalón (y descubre por qué el vapor no lo tumba ningún filtro mecánico), compara el <b>punto de rocío a presión</b> con el punto más frío de la línea, levanta la <b>escalera de presiones</b> con las caídas ISO 6358 y resuelve el reto: elegir <b>filtración, secador, lubricación y cuerpo</b> válidos y de coste mínimo para cinco estaciones reales.</p>
  <div class="formula">ISO 8573-1 [A:B:C] = sólidos : agua : aceite · p<sub>sat</sub>(T) = 6,112·e^(17,62·T/(243,12+T)) · ISO 6358: q = C·p₁ · Δp = p₁(1−b−(1−b)·√(1−f²)) · kW ∝ 1 + 0,07·(p−7)</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#2b6f8a"></span>Posenfriador y secador</div>
    <div class="li"><span class="dot" style="background:#9aa4ac"></span>Separador y filtros</div>
    <div class="li"><span class="dot" style="background:#d7dde3"></span>Regulador y manómetro</div>
    <div class="li"><span class="dot" style="background:#E7A94B"></span>Lubricador y aceite</div>
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Agua y aire tratado</div>
  </div>
  <div class="fid">
    <div class="ft">Contrato de fidelidad</div>
    <div class="fl"><b>SÍ modela:</b> las clases ISO 8573-1 [A:B:C] con sus tablas de umbrales; el punto de rocío a presión y su equivalente atmosférico; el condensado del posenfriador; la cascada de aceite separando aerosol y vapor con el piso de saturación de cada elemento; la concentración de sólidos por efecto de la compresión; la caída de presión ISO 6358 con bloqueo sónico; el droop del regulador con el caudal; la purga permanente de los secadores; y el consumo anual del compresor.</div>
    <div class="fl no"><b>NO modela:</b> la dinámica de arranque y parada; la regeneración cíclica real del lecho de adsorción; el ensuciamiento progresivo de los cartuchos con las horas; las pérdidas de codos, racores y accesorios; la evolución de la temperatura a lo largo de la línea; los aceites sintéticos; ni la contaminación microbiológica.</div>
    <div class="fl"><b>Norma ancla:</b> ISO 8573-1:2010 (clases de pureza) e ISO 6358 (conductancia sónica y caída de presión), con el margen de 10 K sobre el punto de rocío que la práctica ISA pide al aire de instrumentación y Magnus-Sonntag para la presión de saturación.</div>
    <div class="fl no"><b>Criterios de proyecto, no norma:</b> los pliegos de las cinco estaciones, los costes en unidades de catálogo, las conductancias y rendimientos del catálogo de elementos, la regla de 6,7 kW por m³/min y +7 % por bar, y el modelo de arrastre de aceite del compresor (3 mg/m³ a 30 °C duplicando cada 10 K).</div>
  </div>
  <div class="src">Magnus-Sonntag declarado válido entre −45 °C y +60 °C: fuera de esa banda el laboratorio avisa de que está extrapolando.</div>
  <div class="modebar">
    <button class="b on" id="m_ensamble">① Ensamble</button>
    <button class="b" id="m_tren" disabled>② Aceite y sólidos</button>
    <button class="b" id="m_agua" disabled>③ Agua</button>
    <button class="b" id="m_presion" disabled>④ Presiones</button>
    <button class="b" id="m_proyecto" disabled>⑤ Proyecto</button>
    <button class="b" id="m_reto" disabled>⑥ Reto</button>
  </div>`;

/* ============================ PANEL ============================ */
const btnsK=(id,items)=>`<div class="btns" id="${id}">${items.map(o=>`<button class="b" data-k="${o.k}">${o.t}</button>`).join('')}</div>`;
const climaBtns=id=>btnsK(id,CLIMAK.map(k=>({k,t:CLIMA_CORTO[k]})));
const finoBtns=id=>btnsK(id,FINOK.map(k=>({k,t:FINOS[k].corto})));
const secBtns=id=>btnsK(id,SECK.map(k=>({k,t:SECADORES[k].corto})));
const estBtns=id=>btnsK(id,ESTK.map(k=>({k,t:EST_CORTO[k]})));
const tamBtns=id=>btnsK(id,TAMK.map(k=>({k,t:TAM_CORTO[k]})));
const lubBtns=id=>btnsK(id,[{k:0,t:'sin lubricador'},{k:1,t:'con lubricador'}]);
const g1=(lab,id)=>`<div class="g"><div class="gl"><span>${lab}</span><b id="${id}">—</b></div></div>`;

el('panel').innerHTML=`
  <div class="g"><div class="gl"><span>Modo actual</span><b id="p_mode">Ensamble</b></div></div>

  <div id="secEnsamble">
    <h4>① Ensamble — toca pieza, toca hueco</h4>
    <div class="console" id="asmStatus">Toca una <b>pieza</b> del banco (derecha) y luego su <b>hueco luminoso</b> sobre el riel.</div>
    <div class="g"><div class="gl"><span>Piezas colocadas</span><b id="p_prog">0 / 7</b></div></div>
    <div id="checklist"></div>
    <div class="btns">
      <button class="b" id="btnAuto">⚙ Montaje automático</button>
      <button class="b" id="btnReset">↺ Reiniciar</button>
      <button class="b" id="btnTour">🎬 Recorrido guiado</button>
    </div>
  </div>

  <div id="secTren" style="display:none">
    <h4>② Aceite y sólidos — la cascada escalón a escalón</h4>
    <div class="lbl">Clima y sitio</div>${climaBtns('trClima')}
    <div class="lbl">Escalón de filtración</div>${finoBtns('trFino')}
    <h4 class="sec">Telemetría</h4>
    ${g1('Ambiente','tr_T')}${g1('Salida del posenfriador','tr_Tpost')}
    ${g1('Arrastre de aceite','tr_ace')}${g1('Fracción en fase vapor','tr_frac')}
    ${g1('Aerosol tras el tren','tr_aero')}${g1('Vapor tras el tren','tr_vap')}
    ${g1('Aceite total','tr_tot')}${g1('Clase C ISO 8573-1','tr_clC')}
    ${g1('Sólidos comprimidos','tr_pol')}${g1('Clase A ISO 8573-1','tr_clA')}
    ${g1('Coste de la filtración','tr_coste')}
  </div>

  <div id="secAgua" style="display:none">
    <h4>③ Agua — rocío a presión frente al punto más frío</h4>
    <div class="lbl">Clima y sitio</div>${climaBtns('agClima')}
    <div class="lbl">Secador</div>${secBtns('agSec')}
    <div class="lbl">Presión en el punto de uso</div>${btnsK('agP',[4,5,6,7].map(v=>({k:v,t:v+' bar'})))}
    <h4 class="sec">Telemetría</h4>
    ${g1('Rocío a presión','ag_pdp')}${g1('Punto más frío de la línea','ag_tmin')}
    ${g1('Presión parcial de vapor','ag_pv')}${g1('Rocío atmosférico equivalente','ag_atm')}
    ${g1('Agua líquida','ag_cw')}${g1('Clase B ISO 8573-1','ag_clB')}
    ${g1('Condensado por m³/min','ag_cond')}${g1('Purga del secador','ag_purga')}
  </div>

  <div id="secPresion" style="display:none">
    <h4>④ Presiones — ISO 6358 elemento a elemento</h4>
    <div class="lbl">Estación</div>${estBtns('prEst')}
    <div class="lbl">Clima y sitio</div>${climaBtns('prClima')}
    <div class="lbl">Filtración</div>${finoBtns('prFino')}
    <div class="lbl">Secador</div>${secBtns('prSec')}
    <div class="lbl">Lubricación</div>${lubBtns('prLub')}
    <div class="lbl">Tamaño de cuerpo</div>${tamBtns('prTam')}
    <div class="btns"><button class="b" id="btnFlujo">▶ Ver el flujo</button></div>
    <h4 class="sec">Telemetría</h4>
    ${g1('Presión de red necesaria','pr_pred')}${g1('Consigna del regulador','pr_pset')}
    ${g1('Droop a caudal','pr_droop')}${g1('Suma de caídas del tren','pr_sum')}
    ${g1('Caída del lubricador','pr_dplub')}${g1('Presión en el punto de uso','pr_puso')}
    ${g1('Máximo de q/(C·p₁)','pr_f')}${g1('Energía anual','pr_kwh')}
  </div>

  <div id="secProyecto" style="display:none">
    <h4>⑤ Proyecto — la malla completa</h4>
    <div class="lbl">Estación</div>${estBtns('pyEst')}
    <div class="lbl">Clima y sitio</div>${climaBtns('pyClima')}
    <div class="lbl">Lubricación</div>${lubBtns('pyLub')}
    <div class="lbl">Tamaño de cuerpo</div>${tamBtns('pyTam')}
    <h4 class="sec">Telemetría</h4>
    ${g1('Combinaciones del catálogo','py_tot')}${g1('Válidas en total','py_val')}
    ${g1('Válidas en esta malla','py_here')}${g1('Coste mínimo','py_cmin')}
    ${g1('Configuración óptima','py_opt')}
  </div>

  <div id="secReto" style="display:none">
    <h4>⑥ Reto — el tren válido más barato</h4>
    <div class="console" id="retoText">—</div>
    <div class="lbl">Filtración</div>${finoBtns('reFino')}
    <div class="lbl">Secador</div>${secBtns('reSec')}
    <div class="lbl">Lubricación</div>${lubBtns('reLub')}
    <div class="lbl">Tamaño de cuerpo</div>${tamBtns('reTam')}
    <div class="btns">
      <button class="b" id="btnCheck">✔ Comprobar</button>
      <button class="b" id="btnNew">🎲 Otra estación</button>
    </div>
    <h4 class="sec">Telemetría</h4>
    ${g1('Estación','re_est')}${g1('Sitio','re_clima')}
    ${g1('Clases obtenidas','re_clase')}${g1('Clases exigidas','re_pide')}
    ${g1('Coste','re_coste')}${g1('kWh/año frente al tope','re_kwh')}
    ${g1('Veredicto','re_verd')}
    <h4 class="sec">Diagnóstico</h4>
    <div class="console" id="quizQ">—</div>
    <div class="btns" id="dxbtns"></div>
    <div class="g"><div class="gl"><span>Respuesta</span><b id="quizVerd">Sin responder</b></div></div>
  </div>`;

/* ============================ CABLEADO ============================ */
modes.forEach(m=>{ const b=el('m_'+m); if(b) b.onclick=()=>{
  if(mode==='reto'&&!retoSolved&&m!=='reto'){
    showToast('<span style="color:var(--bad)">🔒 Resuelve el reto (filtración, secador, lubricación y cuerpo correctos) antes de salir a otro modo.</span>');
    synth.beep(220,0.1,0.05);
    return;
  }
  setMode(m);
}; });
el('btnReset').onclick=()=>initAssembly();
el('btnAuto').onclick=()=>autoAssemble();
el('btnTour').onclick=()=>runAuto();
el('btnCheck').onclick=()=>checkReto();
el('btnNew').onclick=()=>newReto();
el('btnFlujo').onclick=()=>{ flujoOn=!flujoOn; refreshAll(); };

document.querySelectorAll('#trClima [data-k]').forEach(b=>{ b.onclick=()=>{ TR.clima=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#trFino [data-k]').forEach(b=>{ b.onclick=()=>{ TR.fino=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#agClima [data-k]').forEach(b=>{ b.onclick=()=>{ AG.clima=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#agSec [data-k]').forEach(b=>{ b.onclick=()=>{ AG.sec=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#agP [data-k]').forEach(b=>{ b.onclick=()=>{ AG.pUso=+b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#prEst [data-k]').forEach(b=>{ b.onclick=()=>{ PR.est=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#prClima [data-k]').forEach(b=>{ b.onclick=()=>{ PR.clima=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#prFino [data-k]').forEach(b=>{ b.onclick=()=>{ PR.fino=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#prSec [data-k]').forEach(b=>{ b.onclick=()=>{ PR.sec=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#prLub [data-k]').forEach(b=>{ b.onclick=()=>{ PR.lub=b.dataset.k==='1'; refreshAll(); }; });
document.querySelectorAll('#prTam [data-k]').forEach(b=>{ b.onclick=()=>{ PR.tam=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#pyEst [data-k]').forEach(b=>{ b.onclick=()=>{ PY.est=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#pyClima [data-k]').forEach(b=>{ b.onclick=()=>{ PY.clima=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#pyLub [data-k]').forEach(b=>{ b.onclick=()=>{ PY.lub=b.dataset.k==='1'; refreshAll(); }; });
document.querySelectorAll('#pyTam [data-k]').forEach(b=>{ b.onclick=()=>{ PY.tam=b.dataset.k; refreshAll(); }; });
document.querySelectorAll('#reFino [data-k]').forEach(b=>{ b.onclick=()=>{ RET.fino=b.dataset.k; retoChecked=false; retoSolved=false; refreshAll(); }; });
document.querySelectorAll('#reSec [data-k]').forEach(b=>{ b.onclick=()=>{ RET.sec=b.dataset.k; retoChecked=false; retoSolved=false; refreshAll(); }; });
document.querySelectorAll('#reLub [data-k]').forEach(b=>{ b.onclick=()=>{ RET.lub=b.dataset.k==='1'; retoChecked=false; retoSolved=false; refreshAll(); }; });
document.querySelectorAll('#reTam [data-k]').forEach(b=>{ b.onclick=()=>{ RET.tam=b.dataset.k; retoChecked=false; retoSolved=false; refreshAll(); }; });

const soundBtn=document.getElementById('soundBtn');
soundBtn.onclick=()=>{const on=synth.toggle();soundBtn.textContent=on?'🔊':'🔇';soundBtn.classList.toggle('on',on);};

RET=startCfg(ESCENAS[retoK].est,ESCENAS[retoK].clima);
shuffleQuiz();
renderQuiz();
initAssembly();
syncCtrlbar();
setMode('ensamble');

/* ============================ DEPURACIÓN ============================ */
window.__labDebug={
  mode:()=>mode,
  progress:()=>({placed:{...placed},progress,simUnlocked}),
  parts:()=>PARTS.map(p=>p.id),
  // constantes
  consts:()=>({P_ATM,PATM_BAR,R_V,MAG_A,MAG_B,MAG_C,MAG_TMIN,MAG_TMAX,N_REF,M_H2O,WREF_K,
    DT_POST,DP_REG_MIN,DP_TUB,P_MAX_RED,P_RED_NOM,POT_ESP,K_BAR,HORAS_ANIO,PRECIO_KWH,T0_ISO_K,
    ACEITE_BASE,T_ACE_REF,DEC_ACE,FRAC_VAP0,FRAC_VAP_MAX,D0_DROOP,Q_NOM_G14,MARGEN_ISA,COSTE_BASE,K_SEC_T}),
  catalogo:()=>({CLIMAS,CLIMAK,FINOS,FINOK,ELEM,SECADORES,SECK,TAMS,TAMK,LUBK,ESTACIONES,ESTK,CRIT,
    TAB_PDP,TAB_LIQ,TAB_ACE,TAB_SOL,K_SEC,EJES,LISTA_EJE,MOTIVO,ESCENAS,nCfgs:CFGS.length}),
  // motor
  pSat:(T)=>pSat(T),
  tRocio:(p)=>tRocio(p),
  wRef:(pv,pT)=>wRef(pv,pT),
  rhoV:(pv,T)=>rhoV(pv,T),
  claseAgua:(pdp,cw)=>claseAgua(pdp,cw),
  claseAceite:(mg)=>claseAceite(mg),
  claseSolBase:(mg)=>claseSolBase(mg),
  entrada:(c)=>entrada(c),
  condensado:(c,fad,p)=>condensado(c,fad,p),
  aceiteTren:(c,f)=>aceiteTren(c,f),
  solidosTren:(c,f,s,p)=>solidosTren(c,f,s,p),
  aguaTren:(c,s,p)=>aguaTren(c,s,p),
  caidaISO:(C,b,q,p1)=>caidaISO(C,b,q,p1),
  resuelvePresion:(e,cfg)=>resuelvePresion(e,cfg),
  energia:(e,c,cfg,p)=>energia(e,c,cfg,p),
  costeCfg:(cfg)=>costeCfg(cfg),
  evalua:(e,c,cfg)=>evalua(e,c,cfg),
  validas:(e,c)=>validas(e,c),
  costeMin:(e,c)=>costeMin(e,c),
  optimas:(e,c)=>optimas(e,c),
  ejeSol:(e,c,j)=>ejeSol(e,c,j),
  okEje:(e,c,j,v)=>okEje(e,c,j,v),
  startCfg:(e,c)=>startCfg(e,c),
  whyCfg:(e,c,cfg)=>whyCfg(e,c,cfg),
  f1:(x,d)=>f1(x,d),
  // estado por modo
  tren:()=>({...TR,entrada:entrada(TR.clima),aceite:aceiteTren(TR.clima,TR.fino),
    solidos:solidosTren(TR.clima,TR.fino,'s0',P_RED_NOM),clase:claseAceite(aceiteTren(TR.clima,TR.fino).total)}),
  agua:()=>({...AG,r:aguaTren(AG.clima,AG.sec,AG.pUso),cond:condensado(AG.clima,1,P_RED_NOM)}),
  presion:()=>({...PR,r:evalua(PR.est,PR.clima,cfgPR()),flujo:flujoOn}),
  proyecto:()=>({...PY,validas:validas(PY.est,PY.clima).length,costeMin:costeMin(PY.est,PY.clima),
    optimas:optimas(PY.est,PY.clima)}),
  retoCfg:()=>({...RET}),
  reto:()=>({k:retoK,escena:ESCENAS[retoK],cfg:{...RET},checked:retoChecked,solved:retoSolved,
    ok:{...retoOk},r:evalua(ESCENAS[retoK].est,ESCENAS[retoK].clima,{...RET}),
    costeMin:costeMin(ESCENAS[retoK].est,ESCENAS[retoK].clima)}),
  quiz:()=>({q:QUIZ[retoK].q,opts:quizOrder.map(i=>QUIZ[retoK].opts[i]),pick:quizPick,ok:quizOkIdx}),
  quizAnswer:(i)=>answerQuiz(i),
  // setters
  setTren:(o)=>{ Object.assign(TR,o); refreshAll(); },
  setAgua:(o)=>{ Object.assign(AG,o); refreshAll(); },
  setPresion:(o)=>{ Object.assign(PR,o); refreshAll(); },
  setProyecto:(o)=>{ Object.assign(PY,o); refreshAll(); },
  setReto:(o)=>{ Object.assign(RET,o); retoChecked=false; retoSolved=false; refreshAll(); },
  setEscena:(k)=>{ retoK=k; RET=startCfg(ESCENAS[k].est,ESCENAS[k].clima); retoChecked=false; retoSolved=false;
    EJES.forEach(j=>retoOk[j]=false); shuffleQuiz(); renderQuiz(); refreshAll(); },
  setFlujo:(v)=>{ flujoOn=!!v; refreshAll(); },
  setMode, checkReto, newReto, runAuto, autoAssemble,
};
