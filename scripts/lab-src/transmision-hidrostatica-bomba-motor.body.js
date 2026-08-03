/* ============================================================
   LAB — d4-13 · Transmisión hidrostática bomba-motor
   Molde S: cinco modos, sin ensamble.

   Ley clave:  T = Δp·D / 2π   (par ideal de una máquina volumétrica)

   Modelo de pérdidas: Wilson (1946) en forma adimensional
     σ = K_S·Δp/(μ·ω)   pérdida volumétrica (fuga)
     τ = K_V·μ·ω/Δp     pérdida de par por fricción viscosa
     K_F                pérdida de par de Coulomb
   El producto σ·τ = K_S·K_V no depende del punto de trabajo.

   Cierre térmico: la temperatura del aceite NO es un dato, es el punto fijo
   de calor(T) = UA·(T − T_amb). Se resuelve con barrido de 0,5 °C + bisección.

   Ref: ISO 3448 · ASTM D341 · ISO 4413 · ISO 4409 · ISO 4391 · Wilson 1946
   ============================================================ */

// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[7.0,3.9,8.4],target:[2.05,1.15,0.00],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.42,minD:3.4,maxD:24});
const {scene}=S;
const synth=makeSynth({type:'sawtooth',type2:'sine',filterFreq:1200,Q:0.85});
const el=id=>document.getElementById(id);

// ===================== 2. MOTOR =====================
// Unidades: cilindrada cm3/rev, regimen rpm, presion bar (diferencial),
// viscosidad cinematica mm2/s, dinamica Pa*s, par N*m, caudal L/min,
// potencia kW, temperatura C, UA kW/K. Comentarios en ASCII. Los textos que
// ve el alumno llevan acentos, pero eso pasa fuera de este bloque.

// ---------- constantes selladas ----------
// Propiedad util del modelo: el rendimiento maximo alcanzable depende SOLO del
// producto K_S*K_V, y la viscosidad optima SOLO del cociente K_S/K_V.
const K_S = 4.0e-9;    // coeficiente de deslizamiento (fuga), adimensional
const K_F = 0.030;     // coeficiente de friccion de Coulomb, adimensional
const K_V = 4.0e5;     // coeficiente de friccion viscosa, adimensional
const ALFA_MAX = 0.95; // reserva de mando: la bomba no se usa al tope
const NU_MIN = 10;     // mm2/s, ventana de servicio del fabricante
const NU_MAX = 80;     // mm2/s
const NU_OPT_LO = 16;  // mm2/s, franja optima declarada por el fabricante
const NU_OPT_HI = 36;  // mm2/s
const T_MAX = 80;      // C, limite de servicio continuo del fluido
const P_CARGA = 25;    // bar, presion del circuito de alimentacion
const FR_CARGA = 0.20; // cilindrada de la bomba de carga / cilindrada principal
const ETA_V_CARGA = 0.92;
const F_BARR = 0.10;   // caudal de barrido del lazo, fraccion del caudal del motor
const ALFA_RHO = 0.00065, T_REF_RHO = 15, WAL_C = 0.7;
const T_WAL_MIN = 0, T_WAL_MAX = 140;   // banda declarada de la correlacion
const T_SCAN_PASO = 0.5, T_SCAN_TOPE = 140, BISEC = 60;

// ---------- aceites (ISO 3448, valores tipicos de HLP mineral VI ~ 100) ----------
const ACEITES = {
  32:  { v40: 32,  v100: 5.4,  rho15: 865 },
  46:  { v40: 46,  v100: 6.8,  rho15: 875 },
  68:  { v40: 68,  v100: 8.7,  rho15: 880 },
  100: { v40: 100, v100: 11.4, rho15: 885 },
};
const GRADOS = [32, 46, 68, 100];

// ---------- ejes del catalogo ----------
const DB = [28, 45, 71, 90, 125];        // cm3/rev, bomba de cilindrada variable
const DM = [28, 45, 63, 80, 107];        // cm3/rev, motor de cilindrada fija
const NB = [1500, 1800, 2200];           // rpm, regimen del diesel
const COSTE_DB = { 28: 8, 45: 10, 71: 13, 90: 15, 125: 19 };
const COSTE_DM = { 28: 7, 45: 9, 63: 11, 80: 13, 107: 16 };
// Limite de regimen del grupo rotativo a plena cilindrada (dato de catalogo):
// cuanto mayor es la cilindrada, mas despacio puede girar el bloque de pistones.
const NMAX_DB = { 28: 3200, 45: 2600, 71: 2100, 90: 1900, 125: 1600 };
const NMAX_DM = { 28: 4000, 45: 3000, 63: 2500, 80: 1800, 107: 1400 };
const EJES = ['db', 'dm', 'vg', 'nb'];

// ---------- estaciones del banco ----------
const ESTACIONES = {
  cargadora: {
    nombre: 'Cargadora compacta', detalle: 'tracción sobre el eje delantero',
    nReq: 900, tReq: 280, pLim: 420, tAmb: 30, UA: 0.36, horas: 1400,
    pDies: { 1500: 26, 1800: 35, 2200: 44 },
  },
  cosechadora: {
    nombre: 'Cosechadora', detalle: 'propulsión de vendimia',
    nReq: 2400, tReq: 130, pLim: 400, tAmb: 35, UA: 0.30, horas: 600,
    pDies: { 1500: 38, 1800: 45, 2200: 50 },
  },
  cabrestante: {
    nombre: 'Cabrestante forestal', detalle: 'arrastre de fuste',
    nReq: 200, tReq: 480, pLim: 420, tAmb: 12, UA: 0.24, horas: 900,
    pDies: { 1500: 18, 1800: 24, 2200: 29 },
  },
  ventilador: {
    nombre: 'Ventilador de radiador', detalle: 'accionamiento reversible',
    nReq: 2600, tReq: 30, pLim: 250, tAmb: 50, UA: 0.14, horas: 2600,
    pDies: { 1500: 12, 1800: 15, 2200: 18 },
  },
  hormigonera: {
    nombre: 'Tambor de hormigonera', detalle: 'giro continuo de cuba',
    nReq: 1200, tReq: 190, pLim: 350, tAmb: 28, UA: 0.28, horas: 2200,
    pDies: { 1500: 22, 1800: 29, 2200: 36 },
  },
};
const EST_KEYS = ['cargadora', 'cosechadora', 'cabrestante', 'ventilador', 'hormigonera'];

// okVel y okCarga acotan la MISMA variable (el mando alfa) desde dos sitios
// distintos: el regulador de la bomba y el caudal que hay que reponer. Estan
// las dos porque con solo seis el panel declara valida una maquina que no rueda.
const CRIT = ['okTerm', 'okVel', 'okPres', 'okPot', 'okVisc', 'okRpm', 'okCarga'];

// ---------- viscosidad: Walther / ASTM D341 ----------
function walther(vg) {
  const a = ACEITES[vg];
  const y1 = Math.log10(Math.log10(a.v40 + WAL_C));
  const y2 = Math.log10(Math.log10(a.v100 + WAL_C));
  const x1 = Math.log10(40 + 273.15), x2 = Math.log10(100 + 273.15);
  const B = (y1 - y2) / (x2 - x1);
  const A = y1 + B * x1;
  return { A, B };
}
const WAL = {}; GRADOS.forEach(g => { WAL[g] = walther(g); });

function nu(vg, T) {
  const w = WAL[vg];
  const z = w.A - w.B * Math.log10(T + 273.15);
  return Math.pow(10, Math.pow(10, z)) - WAL_C;   // mm2/s
}
function rho(vg, T) {
  return ACEITES[vg].rho15 / (1 + ALFA_RHO * (T - T_REF_RHO));
}
function mu(vg, T) {
  return nu(vg, T) * 1e-6 * rho(vg, T);            // Pa*s
}
function extrapola(T) { return T < T_WAL_MIN || T > T_WAL_MAX; }

// ---------- identidades geometricas ----------
function omega(n) { return 2 * Math.PI * n / 60; }           // rad/s desde rpm
function parIdeal(D, dp) { return D * dp / (20 * Math.PI); } // N*m desde cm3/rev y bar
function caudalIdeal(D, n) { return D * n / 1000; }          // L/min

// ---------- modelo de Wilson ----------
// sigma = K_S*dp/(mu*w)  ->  perdida volumetrica
// tau   = K_V*mu*w/dp    ->  perdida de par por friccion viscosa
// El producto sigma*tau = K_S*K_V NO depende del punto de trabajo.
function sigma(dp, m, w) { return K_S * (dp * 1e5) / (m * w); }
function tau(dp, m, w) { return K_V * m * w / (dp * 1e5); }

// ---------- punto de trabajo a temperatura dada ----------
// El termino viscoso del motor no depende de dp, asi que dp se despeja EXPLICITO
// del punto de servicio (nReq, tReq); no hace falta iterar.
function punto(estK, db, dm, vg, nb, T) {
  const E = ESTACIONES[estK];
  const m = mu(vg, T);
  const wm = omega(E.nReq), wb = omega(nb);

  const dp = (E.tReq * 20 * Math.PI / dm + K_V * m * wm / 1e5) / (1 - K_F);  // bar

  const sm = sigma(dp, m, wm), tm = tau(dp, m, wm);
  const sb = sigma(dp, m, wb), tb = tau(dp, m, wb);

  const etaVm = 1 / (1 + sm);
  const etaTm = 1 - K_F - tm;
  const etaVb = 1 - sb;
  const etaTb = 1 / (1 + K_F + tb);

  // grado de bomba que exige el equilibrio de caudal del lazo cerrado
  const alfa = (E.nReq * dm * (1 + sm)) / (nb * db * (1 - sb));

  const qMotIdeal = caudalIdeal(dm, E.nReq);
  const qBomIdeal = caudalIdeal(db * alfa, nb);
  const qLazo = qBomIdeal * etaVb;                  // L/min por el lazo de alta
  const qFugaB = qBomIdeal * sb;
  const qFugaM = qMotIdeal * sm;
  const qBarr = F_BARR * qMotIdeal;

  const tIdealM = parIdeal(dm, dp), tIdealB = parIdeal(db * alfa, dp);
  const parMotor = tIdealM * etaTm;                 // = tReq por construccion
  const parBomba = tIdealB / etaTb;

  const dCarga = FR_CARGA * db;
  const qCarga = caudalIdeal(dCarga, nb) * ETA_V_CARGA;
  const pCarga = qCarga * P_CARGA / 600;

  const pOut = E.tReq * wm / 1000;                  // kW
  const pIn = parBomba * wb / 1000;
  const etaTot = etaVb * etaTb * etaVm * etaTm;
  const etaSist = pOut / (pIn + pCarga);
  const calor = pIn + pCarga - pOut;

  // par que pediria la bomba si el limitador topase a plena cilindrada
  const parCalado = parIdeal(db, E.pLim) * (1 + K_F + tau(E.pLim, m, wb));

  return {
    T, dp, alfa, m, nu: nu(vg, T), rho: rho(vg, T), wm, wb,
    sm, tm, sb, tb, etaVm, etaTm, etaVb, etaTb, etaTot, etaSist,
    qLazo, qFugaB, qFugaM, qBarr, qCarga, dCarga, qMotIdeal, qBomIdeal,
    tIdealM, tIdealB, parMotor, parBomba, parCalado,
    pOut, pIn, pCarga, calor,
    relGeom: (db * alfa) / dm,
    relCin: E.nReq / nb,
    desliz: 1 - etaVb * etaVm,
  };
}

// calor generado menos calor evacuado, a temperatura T
function desbalance(estK, db, dm, vg, nb, T) {
  const E = ESTACIONES[estK];
  const p = punto(estK, db, dm, vg, nb, T);
  if (!(p.sb < 1) || !(p.etaTm > 0) || !Number.isFinite(p.calor)) return NaN;
  return p.calor - E.UA * (T - E.tAmb);
}

// ---------- cierre termico: primer cruce por cero subiendo desde el ambiente ----------
// Arrancando en frio la maquina se calienta hasta que generacion = evacuacion,
// asi que la raiz fisica es la PRIMERA. Barrido de 0,5 C para acotar y 60
// biseciones para afinar: algoritmo determinista, mismo resultado en motor y lab.
function equilibrio(estK, db, dm, vg, nb) {
  const E = ESTACIONES[estK];
  const T0 = Math.max(E.tAmb, T_WAL_MIN);
  let ta = T0, ga = desbalance(estK, db, dm, vg, nb, ta);
  if (!Number.isFinite(ga)) return { ok: false, T: T0, raices: 0 };
  let raices = 0, lo = null, hi = null;
  for (let k = 1; ; k++) {
    const t = T0 + k * T_SCAN_PASO;
    if (t > T_SCAN_TOPE + 1e-9) break;
    const g = desbalance(estK, db, dm, vg, nb, t);
    if (!Number.isFinite(g)) break;
    if ((ga > 0 && g <= 0) || (ga < 0 && g >= 0)) {
      raices++;
      if (lo === null) { lo = ta; hi = t; }
    }
    ta = t; ga = g;
  }
  if (lo === null) return { ok: false, T: T_SCAN_TOPE, raices: 0 };
  const gLo = desbalance(estK, db, dm, vg, nb, lo) > 0;
  for (let i = 0; i < BISEC; i++) {
    const md = 0.5 * (lo + hi);
    const g = desbalance(estK, db, dm, vg, nb, md) > 0;
    if (g === gLo) lo = md; else hi = md;
  }
  return { ok: true, T: 0.5 * (lo + hi), raices };
}

// ---------- viscosidad optima (forma cerrada) ----------
// Bomba:  eta = (1 - a/mu)/(1 + K_F + b*mu),  a = K_S*dp/w,  b = K_V*w/dp
//   -> mu* = a + sqrt(a^2 + a*(1+K_F)/b)
// Motor:  eta = (1/(1 + a/mu))*(1 - K_F - b*mu)
//   -> mu* = -a + sqrt(a^2 + a*(1-K_F)/b)
// En ambos casos mu* es PROPORCIONAL a dp/w.
function muOptBomba(dp, w) {
  const a = K_S * (dp * 1e5) / w, b = K_V * w / (dp * 1e5);
  return a + Math.sqrt(a * a + a * (1 + K_F) / b);
}
function muOptMotor(dp, w) {
  const a = K_S * (dp * 1e5) / w, b = K_V * w / (dp * 1e5);
  return -a + Math.sqrt(a * a + a * (1 - K_F) / b);
}
// regimen optimo de la bomba a viscosidad dada: mismo algebra con w en lugar de mu
function omegaOptBomba(dp, m) {
  const y = (dp * 1e5) / m;
  return y * (K_S + Math.sqrt(K_S * K_S + K_S * (1 + K_F) / K_V));
}
// rendimiento total del par bomba-motor a viscosidad dinamica m
function etaDeMu(dp, m, wb, wm) {
  const sb = sigma(dp, m, wb), tb = tau(dp, m, wb);
  const sm = sigma(dp, m, wm), tm = tau(dp, m, wm);
  return (1 - sb) * (1 / (1 + K_F + tb)) * (1 / (1 + sm)) * (1 - K_F - tm);
}
// Viscosidad que maximiza el rendimiento del CONJUNTO. Bomba y motor giran a
// regimenes distintos, asi que cada uno pide su propia viscosidad y el conjunto
// se queda en un compromiso. No hay forma cerrada: barrido logaritmico de 400
// puntos para acotar y 200 biseciones aureas para afinar. Determinista.
const MU_LO = 1e-4, MU_HI = 1.0, MU_PASOS = 400, AUREA = 200;
function muOptSistema(dp, wb, wm) {
  const L0 = Math.log(MU_LO), L1 = Math.log(MU_HI), h = (L1 - L0) / MU_PASOS;
  let iBest = 0, eBest = -Infinity;
  for (let i = 0; i <= MU_PASOS; i++) {
    const e = etaDeMu(dp, Math.exp(L0 + i * h), wb, wm);
    if (Number.isFinite(e) && e > eBest) { eBest = e; iBest = i; }
  }
  let a = Math.exp(L0 + Math.max(0, iBest - 1) * h);
  let b = Math.exp(L0 + Math.min(MU_PASOS, iBest + 1) * h);
  const G = (Math.sqrt(5) - 1) / 2;
  let c = b - G * (b - a), d = a + G * (b - a);
  let fc = etaDeMu(dp, c, wb, wm), fd = etaDeMu(dp, d, wb, wm);
  for (let i = 0; i < AUREA; i++) {
    if (fc > fd) { b = d; d = c; fd = fc; c = b - G * (b - a); fc = etaDeMu(dp, c, wb, wm); }
    else { a = c; c = d; fc = fd; d = a + G * (b - a); fd = etaDeMu(dp, d, wb, wm); }
  }
  return 0.5 * (a + b);
}
// paso de viscosidad dinamica a cinematica con la densidad del punto de trabajo
function nuDeMu(m, rhoT) { return m / (rhoT * 1e-6); }

// ---------- evaluacion de una configuracion ----------
function evalua(estK, db, dm, vg, nb) {
  const E = ESTACIONES[estK];
  const eq = equilibrio(estK, db, dm, vg, nb);
  const p = punto(estK, db, dm, vg, nb, eq.T);
  const r = Object.assign({ estK, db, dm, vg, nb, equil: eq.ok, raices: eq.raices }, p);
  r.coste = COSTE_DB[db] + COSTE_DM[dm];
  r.qCargaReq = p.qFugaB + p.qFugaM + p.qBarr;
  // Sin equilibrio termico se evalua en el tope del barrido: la fuga termica cae
  // sobre okTerm y NO envenena a los otros cinco criterios.
  r.fisico = p.sb < 1 && p.etaTm > 0 && p.dp > 0 && p.alfa > 0 && Number.isFinite(p.calor);
  r.okTerm = r.fisico && eq.ok && p.T <= T_MAX;
  r.okVel = r.fisico && p.alfa <= ALFA_MAX;
  r.okPres = r.fisico && p.dp <= E.pLim;
  r.okPot = r.fisico && (p.pIn + p.pCarga) <= E.pDies[nb];
  r.okVisc = r.fisico && p.nu >= NU_MIN && p.nu <= NU_MAX;
  r.okRpm = nb <= NMAX_DB[db] && E.nReq <= NMAX_DM[dm];
  // La bomba de carga debe reponer las dos fugas mas el caudal de barrido. Su
  // cota exacta sobre alfa vale 0,184*(1+sm)/[(1+sm)*sb + (sm+F_BARR)*(1-sb)],
  // que segun el punto de trabajo cae por encima o por debajo de ALFA_MAX.
  r.okCarga = r.fisico && p.qCarga >= r.qCargaReq;
  r.kwh = (p.pIn + p.pCarga) * E.horas;
  r.fallos = CRIT.filter(c => !r[c]);
  r.valida = r.fallos.length === 0;
  return r;
}

// El barrido de una estacion son 300 configuraciones y cada una resuelve su
// punto fijo termico: se memoriza porque es una funcion pura de la estacion.
const _BAR = {};
function barrido(estK) {
  if (_BAR[estK]) return _BAR[estK];
  const out = [];
  for (const db of DB) for (const dm of DM) for (const vg of GRADOS) for (const nb of NB)
    out.push(evalua(estK, db, dm, vg, nb));
  _BAR[estK] = out;
  return out;
}
function validas(estK) { return barrido(estK).filter(r => r.valida); }

// Orden lexicografico DECLARADO: primero coste del conjunto, despues energia anual.
function mejor(lista) {
  let best = null;
  for (const r of lista) {
    if (!r.valida) continue;
    if (!best) { best = r; continue; }
    if (r.coste < best.coste - 1e-9) { best = r; continue; }
    if (Math.abs(r.coste - best.coste) < 1e-9 && r.kwh < best.kwh - 1e-9) best = r;
  }
  return best;
}
function solucion(estK) { return mejor(barrido(estK)); }
function empates(estK) {
  const b = solucion(estK); if (!b) return 0;
  return barrido(estK).filter(r => r.valida && r.coste === b.coste &&
    Math.abs(r.kwh - b.kwh) < 1e-9).length;
}
function optimo(estK) {
  const b = solucion(estK);
  return b ? { best: b, empates: empates(estK), validas: validas(estK).length } : null;
}

// ---------- ayudas del reto ----------
const OPT_EJE = { db: DB, dm: DM, vg: GRADOS, nb: NB };
function conEje(cfg, eje, v) {
  const c = { db: cfg.db, dm: cfg.dm, vg: cfg.vg, nb: cfg.nb };
  c[eje] = v; return c;
}
// valores de un eje que hacen valida la configuracion actual dejando los otros
// tres donde estan: la pista honesta, la que puede salir vacia
function ejeValidos(estK, cfg, eje) {
  return OPT_EJE[eje].filter(v => {
    const c = conEje(cfg, eje, v);
    return evalua(estK, c.db, c.dm, c.vg, c.nb).valida;
  });
}
// valores de un eje presentes en alguna configuracion optima: con esto se corrige
function ejeSolC(estK, eje) {
  const b = solucion(estK); if (!b) return [];
  const out = [];
  for (const r of barrido(estK)) {
    if (!r.valida || r.coste !== b.coste || Math.abs(r.kwh - b.kwh) > 1e-9) continue;
    if (out.indexOf(r[eje]) < 0) out.push(r[eje]);
  }
  return out;
}
function ejeSol(estK, eje) { const b = solucion(estK); return b ? b[eje] : null; }
function okEje(estK, cfg, eje) { return ejeSolC(estK, eje).indexOf(cfg[eje]) >= 0; }
// arranque deterministicamente equivocado en los CUATRO ejes
function startCfg(estK) {
  const s = solucion(estK);
  const pick = (arr, v) => arr[(arr.indexOf(v) + 2) % arr.length];
  return { db: pick(DB, s.db), dm: pick(DM, s.dm), vg: pick(GRADOS, s.vg), nb: pick(NB, s.nb) };
}

// ---------- formato sellado ----------
const NBSP = String.fromCharCode(0x202F);
function f1(x, d) {
  if (!Number.isFinite(x)) return '—';
  const n = (d === undefined ? 1 : d);
  const s = Math.abs(x).toFixed(n);
  const par = s.split('.');
  let ent = par[0], grp = '';
  while (ent.length > 3) { grp = NBSP + ent.slice(-3) + grp; ent = ent.slice(0, -3); }
  ent = ent + grp;
  return (x < 0 ? '−' : '') + ent + (par[1] ? ',' + par[1] : '');
}
const pc1 = (x, d) => f1(100 * x, d === undefined ? 1 : d) + ' %';

// ===================== 3. ESTADO =====================
const MODES=['par','relacion','rend','aceite','reto'];
let mode='par';
// Conjunto de referencia: lo que trae el banco montado cuando el eje no se toca.
const BASE={db:45,dm:45,vg:46,nb:1800};
const ST={
  par:      { est:'cargadora',   dm:45 },
  relacion: { est:'cargadora',   db:45,  nb:1800 },
  rend:     { est:'cosechadora', dm:45,  nb:1800 },
  aceite:   { est:'cargadora',   vg:46,  nb:1800 },
  reto:     { est:'cargadora' },
};
const RETO={ cfg:{db:45,dm:45,vg:46,nb:1800}, sol:null, ejes:{}, resuelto:false, msg:'', nval:0 };
let CUR=null; let hw={}; let animT=0; let giroB=0, giroM=0, giroV=0;
let autoRunning=false; let solved=false;

// En el modo del aceite se monta el conjunto que gana esa estación y sólo se
// cambia el bidón: así el efecto que se ve es el del fluido y no el del hierro.
function cfgDe(m){
  const s=ST[m];
  if(m==='par')      return {est:s.est, db:BASE.db, dm:s.dm,    vg:BASE.vg, nb:BASE.nb};
  if(m==='relacion') return {est:s.est, db:s.db,    dm:BASE.dm, vg:BASE.vg, nb:s.nb};
  if(m==='rend')     return {est:s.est, db:BASE.db, dm:s.dm,    vg:BASE.vg, nb:s.nb};
  if(m==='aceite'){
    const o=solucion(s.est);
    return {est:s.est, db:o?o.db:BASE.db, dm:o?o.dm:BASE.dm, vg:s.vg, nb:s.nb};
  }
  return {est:ST.reto.est, db:RETO.cfg.db, dm:RETO.cfg.dm, vg:RETO.cfg.vg, nb:RETO.cfg.nb};
}
function estAct(){ return cfgDe(mode).est; }
function computa(){ const c=cfgDe(mode); CUR=evalua(c.est,c.db,c.dm,c.vg,c.nb); return CUR; }

// ===================== 4. MATERIALES =====================
const AZUL='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A',
      VIO='#C08CF8', GRIS='#8f97a5', NARANJA='#F2A65A', CIAN='#5BD4E5';
const COL_VG={32:'#e8c86a',46:'#d9a441',68:'#b97a2c',100:'#8f5a1e'};
const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const MAT={
  base:     std('#11151d',0.94,0.06),
  bancada:  std('#1a2330',0.78,0.22),
  acero:    std('#9aa6b6',0.36,0.86),
  acero2:   std('#65707f',0.48,0.78),
  crom:     std('#cfd9e6',0.16,0.96),
  diesel:   std('#2f3a2c',0.62,0.34),
  bomba:    std('#3b4a63',0.42,0.72),
  motorH:   std('#4a3f63',0.42,0.72),
  plato:    std('#c8d2e0',0.22,0.92),
  deposito: std('#232c3a',0.60,0.30),
  radiador: std('#2a3340',0.58,0.44),
  aleta:    std('#7f8b9c',0.44,0.72),
  carga:    std('#20262f',0.86,0.12),
  goma:     std('#15181d',0.96,0.04),
  tuboA:    std('#c2534a',0.44,0.60),
  tuboB:    std('#4a7fc2',0.44,0.60),
  tuboD:    std('#6f7a88',0.52,0.52),
  tuboC:    std('#5fae7a',0.46,0.58),
  aceite:   new THREE.MeshStandardMaterial({color:COL_VG[46],roughness:0.22,metalness:0.10,transparent:true,opacity:0.86}),
  vidrio:   new THREE.MeshPhysicalMaterial({color:'#9fc2e8',roughness:0.08,metalness:0.0,transparent:true,opacity:0.22}),
  panel:    std('#0f141c',0.88,0.14),
};

// ===================== 5. PIZARRÓN =====================
const board=new THREE.Group();
board.position.set(-3.05,0,-0.50); board.rotation.y=0.44; scene.add(board);
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
const EST_ROT=k=>ESTACIONES[k].nombre;
const CRIT_ROT={okTerm:'Temperatura',okVel:'Reserva de mando',okPres:'Presión',
  okPot:'Potencia del diésel',okVisc:'Ventana del aceite',okRpm:'Régimen admisible',
  okCarga:'Bomba de carga'};
const CRIT_POR={okTerm:'T ≤ 80 °C',okVel:'α ≤ 0,95',okPres:'Δp ≤ p_lím',
  okPot:'P_ent + P_carga ≤ P_diésel',okVisc:'10 ≤ ν ≤ 80 mm²/s',
  okRpm:'n ≤ n_máx de cada grupo',okCarga:'Q_carga ≥ fugas + barrido'};

// ---- 6.1 Par y caudal ----
function drawPar(){
  const c=cfgDe('par'), E=ESTACIONES[c.est], r=CUR;
  title2('Par y caudal · T = Δp·D / 2π',
    'La carga pide par; la cilindrada del motor decide a qué presión se paga');
  // cadena de razonamiento
  let y=118;
  texto(E.nombre+' ('+E.detalle+') pide '+f1(E.tReq,0)+' N·m a '+f1(E.nReq,0)+' rpm.',44,y,'#c8d3e2',16,'left','700'); y+=26;
  texto('Motor de '+f1(c.dm,0)+' cm³/rev  →  Δp_ideal = 2π·T/D = '+f1(E.tReq*20*Math.PI/c.dm,1)+' bar',44,y,AZUL,15); y+=22;
  texto('Rozamiento del grupo  →  Δp_real = '+f1(r.dp,1)+' bar   ('+pc1(r.dp/(E.tReq*20*Math.PI/c.dm)-1,1)+' de más)',44,y,'#c8d3e2',15); y+=30;

  // barras de presion por cilindrada de motor
  const y0=498, H=232, x0=62, W=560, bw=64;
  const maxDp=Math.max(E.pLim,...DM.map(d=>evalua(c.est,c.db,d,c.vg,c.nb).dp))*1.08;
  texto('Δp que exige cada motor del catálogo (bar)',44,y,'#8f9bb0',14,'left','700');
  linea(x0,y0,x0+W,y0,'#2b3446',1.5);
  DM.forEach((d,i)=>{
    const rr=evalua(c.est,c.db,d,c.vg,c.nb);
    const h=Math.max(2,H*Math.min(1,rr.dp/maxDp));
    const cx=x0+38+i*((W-70)/(DM.length-1))-bw/2;
    const col=rr.dp>E.pLim?BAD_HEX:(d===c.dm?AZUL:'#3b5170');
    bx.fillStyle=col; bx.globalAlpha=d===c.dm?1:0.68;
    bx.beginPath(); bx.roundRect(cx,y0-h,bw,h,5); bx.fill(); bx.globalAlpha=1;
    texto(f1(rr.dp,0),cx+bw/2,y0-h-8,col,13,'center','700');
    texto(f1(d,0),cx+bw/2,y0+18,d===c.dm?'#dbe4f0':'#7f8b9c',13,'center','700');
  });
  texto('cm³/rev',x0+W-6,y0+18,'#5d6878',12,'right','600');
  const yl=y0-H*Math.min(1,E.pLim/maxDp);
  linea(x0,yl,x0+W,yl,BAD_HEX,1.6,[7,5]);
  texto('límite de la máquina  '+f1(E.pLim,0)+' bar',x0+W,yl-7,BAD_HEX,12,'right','700');
  nota('Un motor pequeño da el mismo par con más presión: el catálogo no elige por gusto. '+
       'El régimen del motor no aparece en la fórmula del par — sólo manda en el caudal.',y0+52);

  rpanel(452);
  texto('Punto de trabajo',PX.x+14,PX.y+26,'#eaf1fb',16,'left','800');
  let py=PX.y+58;
  prow(py,'Estación',E.nombre); py+=26;
  prow(py,'Par pedido',f1(E.tReq,0)+' N·m'); py+=26;
  prow(py,'Régimen pedido',f1(E.nReq,0)+' rpm'); py+=26;
  prow(py,'Cilindrada motor',f1(c.dm,0)+' cm³/rev',AZUL); py+=26;
  prow(py,'Δp de trabajo',f1(r.dp,1)+' bar',colOk(r.okPres)); py+=26;
  prow(py,'Límite de presión',f1(E.pLim,0)+' bar'); py+=32;
  prow(py,'Par ideal del motor',f1(r.tIdealM,1)+' N·m'); py+=26;
  prow(py,'× rendimiento de par',pc1(r.etaTm,1)); py+=26;
  prow(py,'= par en el eje',f1(r.parMotor,1)+' N·m',OK_HEX); py+=32;
  prow(py,'Caudal ideal del motor',f1(r.qMotIdeal,1)+' L/min'); py+=26;
  prow(py,'Fuga del motor',f1(r.qFugaM,2)+' L/min',WARN_HEX); py+=26;
  prow(py,'Caudal por el lazo',f1(r.qLazo,1)+' L/min'); py+=26;
  prow(py,'Potencia útil',f1(r.pOut,2)+' kW',OK_HEX);
}

// ---- 6.2 Relación de transmisión ----
function drawRelacion(){
  const c=cfgDe('relacion'), E=ESTACIONES[c.est], r=CUR;
  title2('Relación de transmisión · el mando α es la única marcha',
    'Y no es la relación que has montado: entre las dos está el deslizamiento');
  let y=118;
  texto('α = n_m·D_m·(1+σ_m) / [ n_b·D_b·(1−σ_b) ]  =  '+f1(r.alfa,3),44,y,AZUL,16,'left','700'); y+=28;
  texto('Relación geométrica  (D_b·α)/D_m = '+f1(r.relGeom,3),44,y,'#c8d3e2',15); y+=22;
  texto('Relación real        n_m/n_b     = '+f1(r.relCin,3),44,y,'#c8d3e2',15); y+=22;
  texto('Se pierde por el camino: '+pc1(r.desliz,2)+'  =  1 − η_v,bomba·η_v,motor',44,y,WARN_HEX,15); y+=28;

  const y0=506, H=214, x0=62, W=560, bw=64;
  const alfas=DB.map(d=>evalua(c.est,d,c.dm,c.vg,c.nb).alfa);
  const maxA=Math.max(ALFA_MAX,...alfas)*1.10;
  texto('Mando α que hace falta con cada bomba, a '+f1(c.nb,0)+' rpm',44,y,'#8f9bb0',14,'left','700');
  linea(x0,y0,x0+W,y0,'#2b3446',1.5);
  DB.forEach((d,i)=>{
    const a=alfas[i];
    const h=Math.max(2,H*Math.min(1,a/maxA));
    const cx=x0+38+i*((W-70)/(DB.length-1))-bw/2;
    const col=a>ALFA_MAX?BAD_HEX:(d===c.db?AZUL:'#3b5170');
    bx.fillStyle=col; bx.globalAlpha=d===c.db?1:0.68;
    bx.beginPath(); bx.roundRect(cx,y0-h,bw,h,5); bx.fill(); bx.globalAlpha=1;
    texto(f1(a,2),cx+bw/2,y0-h-8,col,13,'center','700');
    texto(f1(d,0),cx+bw/2,y0+18,d===c.db?'#dbe4f0':'#7f8b9c',13,'center','700');
  });
  texto('cm³/rev',x0+W-6,y0+18,'#5d6878',12,'right','600');
  const yl=y0-H*Math.min(1,ALFA_MAX/maxA);
  linea(x0,yl,x0+W,yl,WARN_HEX,1.6,[7,5]);
  texto('reserva de mando  α ≤ '+f1(ALFA_MAX,2),x0+W,yl-7,WARN_HEX,12,'right','700');
  nota('Con α por encima de 1 el plato ya está al tope: la máquina no llega al régimen pedido '+
       'por mucho que el manómetro diga que hay presión de sobra.',y0+50);

  rpanel(430);
  texto('Cadena cinemática',PX.x+14,PX.y+26,'#eaf1fb',16,'left','800');
  let py=PX.y+58;
  prow(py,'Diésel',f1(c.nb,0)+' rpm'); py+=26;
  prow(py,'Bomba',f1(c.db,0)+' cm³/rev'); py+=26;
  prow(py,'Motor',f1(c.dm,0)+' cm³/rev'); py+=26;
  prow(py,'Mando α',f1(r.alfa,3),colOk(r.okVel)); py+=26;
  prow(py,'Cilindrada en uso',f1(c.db*r.alfa,1)+' cm³/rev',AZUL); py+=32;
  prow(py,'Caudal ideal bomba',f1(r.qBomIdeal,1)+' L/min'); py+=26;
  prow(py,'− fuga de la bomba',f1(r.qFugaB,2)+' L/min',WARN_HEX); py+=26;
  prow(py,'= caudal del lazo',f1(r.qLazo,1)+' L/min'); py+=26;
  prow(py,'que el motor traga',f1(r.qMotIdeal+r.qFugaM,1)+' L/min',OK_HEX); py+=32;
  prow(py,'Relación geométrica',f1(r.relGeom,3)); py+=26;
  prow(py,'Relación real',f1(r.relCin,3),AZUL); py+=26;
  prow(py,'Deslizamiento',pc1(r.desliz,2),WARN_HEX); py+=26;
  prow(py,'Régimen conseguido',f1(E.nReq,0)+' rpm',OK_HEX);
}

// ---- 6.3 Rendimiento ----
function drawRend(){
  const c=cfgDe('rend'), E=ESTACIONES[c.est], r=CUR;
  title2('Rendimiento · cuatro pérdidas en cadena',
    'η_total = η_v,b · η_t,b · η_v,m · η_t,m — y ninguna de las cuatro se salva');
  const et=[
    ['Fuga de la bomba',       r.etaVb, AZUL],
    ['Rozamiento de la bomba', r.etaTb, VIO],
    ['Fuga del motor',         r.etaVm, CIAN],
    ['Rozamiento del motor',   r.etaTm, NARANJA],
  ];
  const x0=252, W=352; let y=140, acc=1;
  texto('100 % del par que entrega el diésel',44,y,'#c8d3e2',15,'left','700'); y+=30;
  et.forEach(e=>{
    const antes=acc; acc*=e[1];
    texto(e[0],44,y+13,'#8f9bb0',13.5,'left','600');
    bx.fillStyle='rgba(255,255,255,0.05)';
    bx.beginPath(); bx.roundRect(x0,y,W,18,4); bx.fill();
    bx.fillStyle='rgba(255,107,107,0.55)';
    bx.beginPath(); bx.roundRect(x0+W*acc,y,Math.max(1.5,W*(antes-acc)),18,4); bx.fill();
    bx.fillStyle=e[2];
    bx.beginPath(); bx.roundRect(x0,y,Math.max(4,W*acc),18,4); bx.fill();
    texto('−'+f1(100*(antes-acc),2),x0+W+10,y+13,BAD_HEX,13,'left','700');
    y+=32;
  });
  linea(x0,y+2,x0+W,y+2,'#2b3446',1.2);
  y+=26;
  texto('llega al eje de salida',44,y+13,'#c8d3e2',14,'left','700');
  bx.fillStyle='rgba(255,255,255,0.05)';
  bx.beginPath(); bx.roundRect(x0,y,W,20,4); bx.fill();
  bx.fillStyle=OK_HEX; bx.beginPath(); bx.roundRect(x0,y,Math.max(4,W*r.etaTot),20,4); bx.fill();
  texto(pc1(r.etaTot,2),x0+W+10,y+15,OK_HEX,15,'left','800');
  y+=54;

  texto('Modelo de Wilson: σ = K_S·Δp/(μ·ω)   τ = K_V·μ·ω/Δp',44,y,'#8f9bb0',14,'left','700'); y+=16;
  const yy=tabla(44,y+16,['','σ  (fuga)','τ  (par)','σ · τ','η_v','η_t'],
    [['Bomba  '+f1(c.nb,0)+' rpm',f1(r.sb,4),f1(r.tb,4),f1(r.sb*r.tb,5),pc1(r.etaVb,2),pc1(r.etaTb,2)],
     ['Motor  '+f1(E.nReq,0)+' rpm',f1(r.sm,4),f1(r.tm,4),f1(r.sm*r.tm,5),pc1(r.etaVm,2),pc1(r.etaTm,2)]],
    [172,104,104,110,86,86],
    (ri,ci)=>ci===3?WARN_HEX:null);
  nota('Las dos columnas del centro se mueven en sentidos contrarios: si el aceite espesa baja la '+
       'fuga y sube el rozamiento. Su producto σ·τ = K_S·K_V = '+f1(K_S*K_V,5)+' es el mismo en las dos '+
       'máquinas y en cualquier punto de trabajo: por eso existe una viscosidad óptima y no una regla '+
       'de «cuanto más espeso, mejor».',yy+18);

  rpanel(456);
  texto('Balance de potencia',PX.x+14,PX.y+26,'#eaf1fb',16,'left','800');
  let py=PX.y+58;
  prow(py,'Estación',E.nombre); py+=26;
  prow(py,'Motor',f1(c.dm,0)+' cm³/rev'); py+=26;
  prow(py,'Diésel',f1(c.nb,0)+' rpm'); py+=26;
  prow(py,'Δp de trabajo',f1(r.dp,1)+' bar',colOk(r.okPres)); py+=26;
  prow(py,'Viscosidad',f1(r.nu,1)+' mm²/s',colOk(r.okVisc)); py+=26;
  prow(py,'Temperatura',f1(r.T,1)+' °C',colOk(r.okTerm)); py+=32;
  prow(py,'η volumétrico bomba',pc1(r.etaVb,2),AZUL); py+=26;
  prow(py,'η mecánico bomba',pc1(r.etaTb,2),VIO); py+=26;
  prow(py,'η volumétrico motor',pc1(r.etaVm,2),CIAN); py+=26;
  prow(py,'η mecánico motor',pc1(r.etaTm,2),NARANJA); py+=26;
  prow(py,'η del par hidráulico',pc1(r.etaTot,2),OK_HEX); py+=32;
  prow(py,'Potencia de entrada',f1(r.pIn,2)+' kW'); py+=26;
  prow(py,'Bomba de carga',f1(r.pCarga,2)+' kW',WARN_HEX); py+=26;
  prow(py,'Potencia útil',f1(r.pOut,2)+' kW',OK_HEX); py+=26;
  prow(py,'η con la carga incluida',pc1(r.etaSist,2)); py+=26;
  prow(py,'Calor al aceite',f1(r.calor,2)+' kW',BAD_HEX);
}

// ---- 6.4 Aceite y cierre térmico ----
function drawAceite(){
  const c=cfgDe('aceite'), E=ESTACIONES[c.est], r=CUR;
  title2('El aceite · la temperatura no es un dato, es un punto fijo',
    'calor(T) = UA·(T − T_amb): la máquina se calienta hasta que las dos curvas se cruzan');
  const Tlo=E.tAmb;
  const Thi=Math.min(T_SCAN_TOPE, Tlo+Math.max(50, 1.8*(r.T-Tlo)));
  const gx=76, gy=428, gw=540, gh=272;
  // muestreo de las dos curvas
  const N=180, pc=[], pr=[];
  let maxY=E.UA*(Thi-Tlo);
  for(let i=0;i<=N;i++){
    const t=Tlo+i*(Thi-Tlo)/N;
    const p=punto(c.est,c.db,c.dm,c.vg,c.nb,t);
    const q=(p.sb<1 && p.etaTm>0 && Number.isFinite(p.calor))?p.calor:NaN;
    pc.push([t,q]); pr.push([t,E.UA*(t-Tlo)]);
    if(Number.isFinite(q)) maxY=Math.max(maxY,q);
  }
  maxY*=1.10;
  const X=t=>gx+gw*(t-Tlo)/(Thi-Tlo), Y=v=>gy-gh*Math.min(1,Math.max(0,v/maxY));
  // ejes
  linea(gx,gy,gx+gw,gy,'#2b3446',1.5); linea(gx,gy,gx,gy-gh,'#2b3446',1.5);
  for(let k=0;k<=4;k++){
    const t=Tlo+k*(Thi-Tlo)/4;
    linea(X(t),gy,X(t),gy+5,'#2b3446',1.2);
    texto(f1(t,0)+' °C',X(t),gy+20,'#7f8b9c',12,'center','600');
  }
  for(let k=1;k<=4;k++){
    const v=k*maxY/4;
    linea(gx-5,Y(v),gx,Y(v),'#2b3446',1.2);
    texto(f1(v,1),gx-9,Y(v)+4,'#7f8b9c',12,'right','600');
  }
  texto('kW',gx-9,gy-gh-8,'#7f8b9c',12,'right','700');
  // curva de calor troceada donde el modelo deja de tener sentido
  let seg=[];
  const segs=[];
  pc.forEach(p=>{
    if(Number.isFinite(p[1])) seg.push([X(p[0]),Y(p[1])]);
    else { if(seg.length>1) segs.push(seg); seg=[]; }
  });
  if(seg.length>1) segs.push(seg);
  segs.forEach(s=>curva(s,NARANJA,2.6));
  curva(pr.map(p=>[X(p[0]),Y(p[1])]),CIAN,2.2);
  texto('calor generado',gx+10,gy-gh+18,NARANJA,13,'left','700');
  texto('calor evacuado  UA = '+f1(E.UA,2)+' kW/K',gx+10,gy-gh+36,CIAN,13,'left','700');
  // cruce
  if(r.equil && r.T<=Thi+1e-9){
    linea(X(r.T),gy,X(r.T),Y(r.calor),OK_HEX,1.6,[6,5]);
    bx.fillStyle=OK_HEX; bx.beginPath(); bx.arc(X(r.T),Y(r.calor),5.5,0,Math.PI*2); bx.fill();
    texto('T_eq = '+f1(r.T,1)+' °C',X(r.T)+10,Y(r.calor)-12,OK_HEX,14,'left','800');
  } else {
    texto('sin cruce por debajo de '+f1(T_SCAN_TOPE,0)+' °C: el aceite se va',gx+gw-8,gy-gh+18,BAD_HEX,14,'right','800');
  }
  linea(X(Math.min(Thi,T_MAX)),gy,X(Math.min(Thi,T_MAX)),gy-gh,BAD_HEX,1.4,[4,6]);
  texto('T ≤ '+f1(T_MAX,0)+' °C',X(Math.min(Thi,T_MAX))-8,gy-gh+20,BAD_HEX,12,'right','700');

  // franja de viscosidad, escala logaritmica
  const vx=76, vy=486, vw=540, VLO=3, VHI=250;
  const LX=v=>vx+vw*(Math.log(Math.min(VHI,Math.max(VLO,v)))-Math.log(VLO))/(Math.log(VHI)-Math.log(VLO));
  bx.fillStyle='rgba(255,255,255,0.05)'; bx.beginPath(); bx.roundRect(vx,vy,vw,26,6); bx.fill();
  bx.fillStyle='rgba(124,217,146,0.18)';
  bx.beginPath(); bx.roundRect(LX(NU_MIN),vy,LX(NU_MAX)-LX(NU_MIN),26,6); bx.fill();
  texto('ventana de lubricación  '+f1(NU_MIN,0)+' – '+f1(NU_MAX,0)+' mm²/s',
    (LX(NU_MIN)+LX(NU_MAX))/2,vy+17,OK_HEX,12,'center','700');
  const nuB=nuDeMu(muOptBomba(r.dp,r.wb),r.rho);
  const nuM=nuDeMu(muOptMotor(r.dp,r.wm),r.rho);
  const nuS=nuDeMu(muOptSistema(r.dp,r.wb,r.wm),r.rho);
  const tick=(v,col,rot,arriba)=>{
    linea(LX(v),vy-(arriba?9:0),LX(v),vy+26+(arriba?0:9),col,2);
    texto(rot,LX(v),arriba?vy-14:vy+48,col,12,'center','700');
  };
  tick(nuB,AZUL,'ν* bomba '+f1(nuB,1),true);
  tick(nuM,NARANJA,'ν* motor '+f1(nuM,1),false);
  tick(nuS,VIO,'ν* conjunto '+f1(nuS,1),true);
  bx.fillStyle=colOk(r.okVisc);
  bx.beginPath(); bx.arc(LX(r.nu),vy+13,7,0,Math.PI*2); bx.fill();
  texto('VG'+f1(c.vg,0)+' a '+f1(r.T,1)+' °C  →  '+f1(r.nu,1)+' mm²/s',
    vx,vy+66,colOk(r.okVisc),14,'left','700');
  nota('La bomba gira a '+f1(c.nb,0)+' rpm y el motor a '+f1(E.nReq,0)+' rpm: como ν* es proporcional '+
       'a Δp/ω, la máquina que más deprisa gira es la que pide el aceite más fluido, y el conjunto se '+
       'queda en el compromiso. El techo de este punto de trabajo es '+
       pc1(etaDeMu(r.dp,muOptSistema(r.dp,r.wb,r.wm),r.wb,r.wm),2)+
       ' y con este bidón se saca '+pc1(r.etaTot,2)+'.',vy+92);

  rpanel(430);
  texto('Cierre térmico',PX.x+14,PX.y+26,'#eaf1fb',16,'left','800');
  let py=PX.y+58;
  prow(py,'Estación',E.nombre); py+=26;
  prow(py,'Ambiente',f1(E.tAmb,0)+' °C'); py+=26;
  prow(py,'Intercambio UA',f1(E.UA,2)+' kW/K'); py+=26;
  prow(py,'Grado ISO',(c.vg===32?'VG 32':c.vg===46?'VG 46':c.vg===68?'VG 68':'VG 100'),COL_VG[c.vg]); py+=32;
  prow(py,'ν a 40 °C',f1(ACEITES[c.vg].v40,1)+' mm²/s'); py+=26;
  prow(py,'ν a 100 °C',f1(ACEITES[c.vg].v100,1)+' mm²/s'); py+=26;
  prow(py,'Temperatura de equilibrio',r.equil?f1(r.T,1)+' °C':'no hay',colOk(r.okTerm)); py+=26;
  prow(py,'ν en el equilibrio',f1(r.nu,1)+' mm²/s',colOk(r.okVisc)); py+=26;
  prow(py,'ν* del conjunto',f1(nuS,1)+' mm²/s',VIO); py+=32;
  prow(py,'Calor generado',f1(r.calor,2)+' kW',NARANJA); py+=26;
  prow(py,'Rendimiento',pc1(r.etaTot,2),colOk(r.valida)); py+=26;
  prow(py,'Techo del punto',pc1(etaDeMu(r.dp,muOptSistema(r.dp,r.wb,r.wm),r.wb,r.wm),2),VIO); py+=26;
  prow(py,'Energía anual',f1(r.kwh,0)+' kWh'); py+=26;
  prow(py,'Veredicto',r.valida?'cumple':'incumple '+r.fallos.length,colOk(r.valida));
}

// ---- 6.5 Reto ----
function drawReto(){
  const c=cfgDe('reto'), E=ESTACIONES[c.est], r=CUR;
  const sol=RETO.sol;
  title2('Reto · el conjunto más barato que aguante la máquina',
    'Siete criterios a la vez; a igualdad de precio manda la factura de gasóleo');
  texto(E.nombre+' · '+E.detalle,44,116,'#c8d3e2',15,'left','700');
  texto(f1(E.tReq,0)+' N·m a '+f1(E.nReq,0)+' rpm  ·  p_lím '+f1(E.pLim,0)+' bar  ·  '+
        f1(E.tAmb,0)+' °C de ambiente  ·  '+f1(E.horas,0)+' h/año',44,138,'#8f9bb0',14);
  // tabla de criterios
  const med={
    okTerm: r.equil?f1(r.T,1)+' °C':'sin equilibrio',
    okVel:  f1(r.alfa,3),
    okPres: f1(r.dp,0)+' bar',
    okPot:  f1(r.pIn+r.pCarga,1)+' / '+f1(E.pDies[c.nb],0)+' kW',
    okVisc: f1(r.nu,1)+' mm²/s',
    okRpm:  f1(c.nb,0)+' / '+f1(NMAX_DB[c.db],0)+'  ·  '+f1(E.nReq,0)+' / '+f1(NMAX_DM[c.dm],0),
    okCarga:f1(r.qCarga,1)+' / '+f1(r.qCargaReq,1)+' L/min',
  };
  let y=182;
  texto('CRITERIO',72,y,'#7f8b9c',12,'left','700');
  texto('LÍMITE',250,y,'#7f8b9c',12,'left','700');
  texto('MEDIDO',470,y,'#7f8b9c',12,'left','700');
  y+=8; linea(44,y,660,y,'#243043',1); y+=22;
  CRIT.forEach(k=>{
    marca(56,y-5,r[k]);
    texto(CRIT_ROT[k],72,y,r[k]?'#c8d3e2':BAD_HEX,14,'left','600');
    texto(CRIT_POR[k],250,y,'#7f8b9c',13,'left','500');
    texto(med[k],470,y,colOk(r[k]),13.5,'left','700');
    y+=27;
  });
  y+=8;
  const coste=COSTE_DB[c.db]+COSTE_DM[c.dm];
  texto('Precio del conjunto  '+f1(coste,0)+' k$',44,y,r.valida?OK_HEX:'#8f9bb0',16,'left','800');
  texto('Energía  '+f1(r.kwh,0)+' kWh/año',300,y,'#8f9bb0',15,'left','700'); y+=26;
  if(sol) texto(RETO.resuelto
      ? 'Resuelto: '+f1(sol.db,0)+' / '+f1(sol.dm,0)+' cm³/rev · VG'+f1(sol.vg,0)+' · '+f1(sol.nb,0)+' rpm'
      : 'Objetivo declarado: precio mínimo entre las '+f1(RETO.nval,0)+' combinaciones que cumplen las siete.',
    44,y,RETO.resuelto?OK_HEX:'#8f9bb0',14,'left','700');
  y+=28;
  if(RETO.msg) wrapText(RETO.msg,44,y,620,19,RETO.resuelto?OK_HEX:WARN_HEX,14);

  rpanel(392);
  texto('Tu conjunto',PX.x+14,PX.y+26,'#eaf1fb',16,'left','800');
  let py=PX.y+58;
  const ejeRow=(rot,val,eje)=>{
    const bien=RETO.resuelto||RETO.ejes[eje];
    texto(rot,PX.x+14,py,'#8f9bb0',14,'left','500');
    texto(val,PX.x+PX.w-30,py,bien?OK_HEX:'#dbe4f0',15,'right','700');
    if(bien) marca(PX.x+PX.w-14,py-5,true);
    py+=28;
  };
  ejeRow('Bomba',f1(c.db,0)+' cm³/rev','db');
  ejeRow('Motor',f1(c.dm,0)+' cm³/rev','dm');
  ejeRow('Aceite','VG '+f1(c.vg,0),'vg');
  ejeRow('Diésel',f1(c.nb,0)+' rpm','nb');
  py+=6;
  prow(py,'Precio bomba',f1(COSTE_DB[c.db],0)+' k$'); py+=26;
  prow(py,'Precio motor',f1(COSTE_DM[c.dm],0)+' k$'); py+=26;
  prow(py,'Precio total',f1(coste,0)+' k$',AZUL); py+=32;
  prow(py,'Criterios cumplidos',f1(CRIT.length-r.fallos.length,0)+' de '+f1(CRIT.length,0),colOk(r.valida)); py+=26;
  prow(py,'Rendimiento',pc1(r.etaTot,2)); py+=26;
  prow(py,'Energía anual',f1(r.kwh,0)+' kWh'); py+=32;
  prow(py,'Combinaciones válidas',f1(RETO.nval,0)+' de '+f1(DB.length*DM.length*GRADOS.length*NB.length,0)); py+=26;
  prow(py,'Precio mínimo posible',sol?f1(sol.coste,0)+' k$':'—',VIO);
}

function drawBoard(){
  bg();
  if(mode==='par') drawPar();
  else if(mode==='relacion') drawRelacion();
  else if(mode==='rend') drawRend();
  else if(mode==='aceite') drawAceite();
  else drawReto();
  btex.needsUpdate=true;
}

// ===================== 7. GRUPO 3D =====================
const rig=new THREE.Group(); scene.add(rig);
// inclinacion del plato a cilindrada plena: es la traduccion visual del mando
const TILT_MAX=0.42;

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

// ---- mangueras como curvas ----
const LINEAS={};
function linea3(key,pts,mat,r){
  const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],p[2])));
  const m=new THREE.Mesh(new THREE.TubeGeometry(curve,72,r||0.045,12,false),mat);
  rig.add(m); LINEAS[key]={mesh:m,curve};
  return LINEAS[key];
}
const PART=[];
function particulas(key,n,mat){
  const grupo=new THREE.Group(); rig.add(grupo);
  const ms=[], fase=[];
  for(let i=0;i<n;i++){
    const s=new THREE.Mesh(new THREE.SphereGeometry(0.042,10,8),mat);
    grupo.add(s); ms.push(s); fase.push(i/n);
  }
  const p={key,curve:LINEAS[key].curve,ms,fase,grupo};
  PART.push(p); return p;
}

// ---- bancada ----
(function(){
  const b=roundedBox(6.30,0.16,2.60,MAT.bancada,0.03);
  b.position.set(2.20,0.08,0); rig.add(b);
  const t=roundedBox(6.36,0.03,2.66,std('#0e131b',0.95,0.05),0.02);
  t.position.set(2.20,0.175,0); rig.add(t);
  for(const x of [-0.60,4.95]) for(const z of [-1.10,1.10]){
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.062,0.16,12),MAT.acero2);
    p.position.set(x,0.08,z); rig.add(p);
  }
})();

// ---- motor diesel ----
const gDiesel=new THREE.Group(); rig.add(gDiesel);
let volante=null;
(function(){
  const cuerpo=roundedBox(1.16,0.82,0.90,MAT.diesel,0.06);
  cuerpo.position.set(0.20,0.62,0); gDiesel.add(cuerpo);
  const culata=roundedBox(1.02,0.16,0.72,MAT.acero2,0.05);
  culata.position.set(0.20,1.10,0); gDiesel.add(culata);
  for(let i=0;i<4;i++){
    const es=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.26,12),MAT.acero);
    es.position.set(-0.16+i*0.24,1.30,0); gDiesel.add(es);
  }
  const escape=new THREE.Mesh(new THREE.CylinderGeometry(0.08,0.08,0.62,16),MAT.acero2);
  escape.position.set(0.20,1.45,-0.28); escape.rotation.z=Math.PI/2; gDiesel.add(escape);
  volante=new THREE.Mesh(new THREE.CylinderGeometry(0.31,0.31,0.13,30),MAT.acero);
  volante.rotation.z=Math.PI/2; volante.position.set(0.86,0.62,0); gDiesel.add(volante);
  // dientes de la corona: hijos del volante, giran con el
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2;
    const d=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.10,0.05),MAT.acero2);
    d.position.set(0.315*Math.cos(a),0,0.315*Math.sin(a));
    volante.add(d);
  }
  const eje=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.30,14),MAT.crom);
  eje.rotation.z=Math.PI/2; eje.position.set(1.12,0.62,0); gDiesel.add(eje);
  addHoverLabel(cuerpo,'Motor diésel',OK_HEX,[0.20,1.68,0],0.62);
  cuerpo.userData.pick='diesel'; culata.userData.pick='diesel';
  volante.userData.pick='diesel'; eje.userData.pick='diesel';
})();

// ---- bomba de cilindrada variable ----
const gBomba=new THREE.Group(); rig.add(gBomba);
let platoB=null, mandoArm=null, bombaCuerpo=null, bombaLbl=null;
(function(){
  bombaCuerpo=roundedBox(0.52,0.86,0.86,MAT.bomba,0.07);
  bombaCuerpo.position.set(1.56,0.62,0); gBomba.add(bombaCuerpo);
  // ventana de cristal: dentro se ve el plato inclinable
  const caja=new THREE.Mesh(new THREE.CylinderGeometry(0.36,0.36,0.62,28),MAT.vidrio);
  caja.rotation.z=Math.PI/2; caja.position.set(2.06,0.62,0); gBomba.add(caja);
  const tapa=roundedBox(0.12,0.80,0.80,MAT.bomba,0.06);
  tapa.position.set(2.42,0.62,0); gBomba.add(tapa);
  // barrilete con pistones
  const barr=new THREE.Mesh(new THREE.CylinderGeometry(0.26,0.26,0.30,24),MAT.acero2);
  barr.rotation.z=Math.PI/2; barr.position.set(1.92,0.62,0); gBomba.add(barr);
  const PIS=[];
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2;
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.045,0.30,12),MAT.crom);
    p.rotation.z=Math.PI/2;
    p.position.set(2.06,0.62+0.185*Math.cos(a),0.185*Math.sin(a));
    p.userData.ang=a; gBomba.add(p); PIS.push(p);
  }
  gBomba.userData.pistones=PIS;
  // plato inclinable: su angulo ES el mando alfa
  platoB=new THREE.Mesh(new THREE.CylinderGeometry(0.30,0.30,0.045,28),MAT.plato);
  platoB.rotation.z=Math.PI/2; platoB.position.set(2.26,0.62,0); gBomba.add(platoB);
  // palanca externa que repite la inclinacion
  mandoArm=new THREE.Group(); mandoArm.position.set(2.26,1.10,0); gBomba.add(mandoArm);
  const brazo=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.34,0.05),MAT.crom);
  brazo.position.set(0,0.17,0); mandoArm.add(brazo);
  const pomo=new THREE.Mesh(new THREE.SphereGeometry(0.065,16,12),MAT.tuboA);
  pomo.position.set(0,0.36,0); mandoArm.add(pomo);
  const eje=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,0.26,14),MAT.crom);
  eje.rotation.z=Math.PI/2; eje.position.set(1.30,0.62,0); gBomba.add(eje);
  bombaLbl=addHoverLabel(bombaCuerpo,'Bomba variable',AZUL,[1.72,1.72,0],0.64);
  bombaCuerpo.userData.pick='bomba'; barr.userData.pick='bomba';
  platoB.userData.pick='bomba'; tapa.userData.pick='bomba'; eje.userData.pick='bomba';
  pomo.userData.pick='bomba'; brazo.userData.pick='bomba';
})();

// ---- motor hidraulico de plato fijo ----
const gMotor=new THREE.Group(); rig.add(gMotor);
let platoM=null, ejeMotor=null, motorCuerpo=null;
(function(){
  motorCuerpo=roundedBox(0.50,0.80,0.80,MAT.motorH,0.07);
  motorCuerpo.position.set(3.62,0.62,0); gMotor.add(motorCuerpo);
  const caja=new THREE.Mesh(new THREE.CylinderGeometry(0.33,0.33,0.56,26),MAT.vidrio);
  caja.rotation.z=Math.PI/2; caja.position.set(3.20,0.62,0); gMotor.add(caja);
  const tapa=roundedBox(0.12,0.74,0.74,MAT.motorH,0.06);
  tapa.position.set(2.88,0.62,0); gMotor.add(tapa);
  const barr=new THREE.Mesh(new THREE.CylinderGeometry(0.24,0.24,0.28,22),MAT.acero2);
  barr.rotation.z=Math.PI/2; barr.position.set(3.30,0.62,0); gMotor.add(barr);
  const PISM=[];
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2;
    const p=new THREE.Mesh(new THREE.CylinderGeometry(0.042,0.042,0.28,12),MAT.crom);
    p.rotation.z=Math.PI/2;
    p.position.set(3.18,0.62+0.168*Math.cos(a),0.168*Math.sin(a));
    p.userData.ang=a; gMotor.add(p); PISM.push(p);
  }
  gMotor.userData.pistones=PISM;
  // plato FIJO: cilindrada constante, inclinacion invariable
  platoM=new THREE.Mesh(new THREE.CylinderGeometry(0.28,0.28,0.045,26),MAT.plato);
  platoM.position.set(3.00,0.62,0);
  platoM.rotation.z=Math.PI/2-TILT_MAX; gMotor.add(platoM);
  ejeMotor=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.46,16),MAT.crom);
  ejeMotor.rotation.z=Math.PI/2; ejeMotor.position.set(4.06,0.62,0); gMotor.add(ejeMotor);
  const chav=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.24,0.03),MAT.acero);
  chav.position.set(0,0,0.062); ejeMotor.add(chav);
  addHoverLabel(motorCuerpo,'Motor hidráulico',VIO,[3.34,1.62,0],0.66);
  motorCuerpo.userData.pick='motorh'; barr.userData.pick='motorh';
  platoM.userData.pick='motorh'; tapa.userData.pick='motorh'; ejeMotor.userData.pick='motorh';
})();

// ---- carga accionada ----
const gCarga=new THREE.Group(); rig.add(gCarga);
let tambor=null, cargaLbl=null;
(function(){
  const sop=roundedBox(0.20,1.00,0.90,MAT.acero2,0.05);
  sop.position.set(4.34,0.66,0); gCarga.add(sop);
  tambor=new THREE.Mesh(new THREE.CylinderGeometry(0.46,0.46,0.70,30),MAT.carga);
  tambor.rotation.z=Math.PI/2; tambor.position.set(4.86,0.66,0); gCarga.add(tambor);
  for(let i=0;i<8;i++){
    const a=i/8*Math.PI*2;
    const t=new THREE.Mesh(new THREE.BoxGeometry(0.66,0.07,0.09),MAT.acero2);
    t.position.set(0,0.465*Math.cos(a),0.465*Math.sin(a));
    t.rotation.x=-a; tambor.add(t);
  }
  const marca=new THREE.Mesh(new THREE.BoxGeometry(0.70,0.10,0.10),MAT.tuboC);
  marca.position.set(0,0.50,0); tambor.add(marca);
  cargaLbl=addHoverLabel(tambor,'Carga',NARANJA,[4.86,1.46,0],0.58);
  tambor.userData.pick='carga'; sop.userData.pick='carga';
})();

// ---- deposito con el aceite ----
const gDep=new THREE.Group(); rig.add(gDep);
let nivel=null, depCuerpo=null;
(function(){
  depCuerpo=roundedBox(1.30,0.62,0.62,MAT.deposito,0.06);
  depCuerpo.position.set(1.30,0.50,-1.28); gDep.add(depCuerpo);
  const mirilla=roundedBox(1.06,0.40,0.03,MAT.vidrio,0.04);
  mirilla.position.set(1.30,0.48,-0.965); gDep.add(mirilla);
  nivel=roundedBox(1.02,0.26,0.50,MAT.aceite,0.03);
  nivel.position.set(1.30,0.40,-1.28); gDep.add(nivel);
  const tapon=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.09,0.09,14),MAT.acero2);
  tapon.position.set(0.92,0.85,-1.28); gDep.add(tapon);
  const resp=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.16,12),MAT.acero);
  resp.position.set(1.68,0.89,-1.28); gDep.add(resp);
  addHoverLabel(depCuerpo,'Depósito · aceite',WARN_HEX,[1.30,1.36,-1.28],0.64);
  depCuerpo.userData.pick='deposito'; mirilla.userData.pick='deposito'; nivel.userData.pick='deposito';
  tapon.userData.pick='deposito';
})();

// ---- bomba de carga ----
const gCargaB=new THREE.Group(); rig.add(gCargaB);
let rotCarga=null;
(function(){
  const c=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.30,22),MAT.bomba);
  c.rotation.z=Math.PI/2; c.position.set(2.30,0.40,-0.96); gCargaB.add(c);
  rotCarga=new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.13,0.34,16),MAT.crom);
  rotCarga.rotation.z=Math.PI/2; rotCarga.position.set(2.30,0.40,-0.96); gCargaB.add(rotCarga);
  for(let i=0;i<6;i++){
    const a=i/6*Math.PI*2;
    const p=new THREE.Mesh(new THREE.BoxGeometry(0.36,0.10,0.02),MAT.acero);
    p.position.set(0,0.075*Math.cos(a),0.075*Math.sin(a)); p.rotation.x=-a;
    rotCarga.add(p);
  }
  const val=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.20,14),MAT.tuboC);
  val.position.set(2.62,0.44,-0.96); gCargaB.add(val);
  addHoverLabel(c,'Bomba de carga',OK_HEX,[2.30,1.02,-0.96],0.60);
  c.userData.pick='carga_b'; rotCarga.userData.pick='carga_b'; val.userData.pick='carga_b';
})();

// ---- radiador de aceite ----
const gRad=new THREE.Group(); rig.add(gRad);
let ventRad=null, radLbl=null;
const ALETAS=[];
(function(){
  const cuerpo=roundedBox(1.10,0.86,0.16,MAT.radiador,0.04);
  cuerpo.position.set(3.60,0.78,-1.24); gRad.add(cuerpo);
  for(let i=0;i<11;i++){
    const a=new THREE.Mesh(new THREE.BoxGeometry(0.94,0.045,0.20),MAT.aleta);
    a.position.set(3.60,0.44+i*0.068,-1.24); gRad.add(a); ALETAS.push(a);
  }
  ventRad=new THREE.Group(); ventRad.position.set(3.60,0.78,-1.44); gRad.add(ventRad);
  const buje=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.07,0.10,14),MAT.acero2);
  buje.rotation.x=Math.PI/2; ventRad.add(buje);
  for(let i=0;i<5;i++){
    const p=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.10,0.02),MAT.acero);
    const a=i/5*Math.PI*2;
    p.position.set(0.19*Math.cos(a),0.19*Math.sin(a),0);
    p.rotation.z=a; p.rotation.y=0.5; ventRad.add(p);
  }
  radLbl=addHoverLabel(cuerpo,'Radiador de aceite',CIAN,[3.60,1.48,-1.24],0.66);
  cuerpo.userData.pick='radiador';
  ALETAS.forEach(a=>{ a.userData.pick='radiador'; });
})();

// ---- lazo cerrado: alta por arriba, retorno por abajo ----
MAT.tuboAlta=MAT.tuboA.clone();
MAT.tuboRet =MAT.tuboB.clone();
linea3('alta',[[2.46,0.98,0.30],[2.62,1.26,0.30],[2.90,1.32,0.30],[3.10,1.06,0.30],
               [3.10,0.80,0.26]],MAT.tuboAlta,0.052);
linea3('ret', [[2.46,0.30,-0.30],[2.66,0.22,-0.30],[2.94,0.22,-0.30],[3.14,0.30,-0.30],
               [3.14,0.46,-0.26]],MAT.tuboRet,0.052);
// aporte de la bomba de carga al lazo (baja presion)
linea3('carga',[[1.30,0.34,-1.02],[1.72,0.30,-1.00],[2.10,0.36,-0.98],
                [2.62,0.44,-0.80],[2.66,0.36,-0.36]],MAT.tuboC,0.034);
// barrido caliente hacia el radiador y vuelta al deposito
linea3('barr',[[3.44,0.44,-0.22],[3.50,0.52,-0.70],[3.58,0.62,-1.06]],MAT.tuboD,0.032);
linea3('frio',[[3.58,0.94,-1.06],[3.00,1.06,-1.30],[2.10,1.02,-1.32],[1.66,0.88,-1.30]],
       MAT.tuboD,0.032);
const FLU_ALTA =particulas('alta', 14,std('#ff8a72',0.35,0.20));
const FLU_RET  =particulas('ret',  14,std('#7fb2ff',0.35,0.20));
const FLU_CARGA=particulas('carga', 9,std('#7CD992',0.35,0.20));
const FLU_BARR =particulas('barr',  6,std('#c9d3e2',0.40,0.20));
const FLU_FRIO =particulas('frio',  8,std('#5BD4E5',0.40,0.20));
LINEAS.alta.mesh.userData.pick='alta';
LINEAS.ret.mesh.userData.pick='ret';
LINEAS.carga.mesh.userData.pick='carga_b';
LINEAS.barr.mesh.userData.pick='radiador';
LINEAS.frio.mesh.userData.pick='radiador';
addHoverLabel(LINEAS.alta.mesh,'Línea de alta',BAD_HEX,[2.80,1.62,0.30],0.60);
addHoverLabel(LINEAS.ret.mesh,'Retorno del lazo',AZUL,[2.80,-0.06,-0.30],0.60);

// ---- barras de estado: presion y temperatura ----
function barra(x,z,col,rot){
  const g=new THREE.Group(); g.position.set(x,0.20,z); rig.add(g);
  const tubo=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.075,1.40,16),
    new THREE.MeshStandardMaterial({color:'#0d1219',roughness:0.9,metalness:0.05,
      transparent:true,opacity:0.55}));
  tubo.position.y=0.70; g.add(tubo);
  const rel=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,1.0,16),
    new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:0.55,
      roughness:0.35,metalness:0.1}));
  rel.position.y=0.5; g.add(rel);
  const lim=new THREE.Mesh(new THREE.TorusGeometry(0.088,0.012,8,24),MAT.crom);
  lim.rotation.x=Math.PI/2; lim.position.y=1.20; g.add(lim);
  const lbl=labelSprite(rot,col); lbl.position.set(0,1.58,0); lbl.scale.multiplyScalar(0.62);
  g.add(lbl);
  return {g,rel,lim,lbl,col};
}
const BAR_DP=barra(1.20,1.22,BAD_HEX,'Δp');
const BAR_T =barra(1.72,1.22,WARN_HEX,'T');
BAR_DP.rel.userData.pick='bar_dp'; BAR_T.rel.userData.pick='bar_t';
function setBarra(b,frac,limFrac,col){
  const f=Math.max(0.02,Math.min(1,frac));
  b.rel.scale.y=1.40*f; b.rel.position.y=0.70*f;
  b.lim.position.y=1.40*Math.max(0.02,Math.min(1,limFrac));
  b.rel.material.color.set(col); b.rel.material.emissive.set(col);
}

// ===================== 8. ACTUALIZACIÓN 3D =====================
// El hierro no decora: cada pieza repite un numero del motor de calculo.
//  - el plato de la bomba se inclina con alfa (la unica marcha del conjunto)
//  - las cilindradas cambian el diametro real de cada barrilete
//  - el aceite del deposito toma el color de su grado ISO
//  - las mangueras se tinen con la presion y el radiador con la temperatura

// radio visual del barrilete: crece con la raiz de la cilindrada, como el area
const rBar=d=>0.150+0.170*Math.sqrt(d/125);
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp01=x=>x<0?0:x>1?1:x;
// mezcla de dos colores hex sobre el color de un material ya existente
const _c1=new THREE.Color(), _c2=new THREE.Color();
function mezcla(mat,a,b,t){
  _c1.set(a); _c2.set(b); _c1.lerp(_c2,clamp01(t));
  mat.color.copy(_c1);
}
// plato de la bomba clavado en el tope de cilindrada: material propio, sin clonar por cuadro
MAT.platoTope=std(BAD_HEX,0.28,0.60);

// Coloca los pistones de los dos barriletes. El angulo de cada uno es su reparto
// fijo mas el giro acumulado de su grupo; la carrera axial sale de proyectar el
// circulo de pistones sobre el plato inclinado (x = R·cos(ang)·tan(inclinacion)).
function colocaPistones(){
  const rb=hw.rb||0.18, rm=hw.rm||0.17, cb=hw.carrB||0, cm=hw.carrM||0;
  gBomba.userData.pistones.forEach(p=>{
    const an=p.userData.ang+giroB;
    p.position.set(2.06-cb*Math.cos(an), 0.62+rb*Math.cos(an), rb*Math.sin(an));
  });
  gMotor.userData.pistones.forEach(p=>{
    const an=p.userData.ang+giroM;
    p.position.set(3.18+cm*Math.cos(an), 0.62+rm*Math.cos(an), rm*Math.sin(an));
  });
}

function updateHW(){
  const r=CUR; if(!r) return;
  const c=cfgDe(mode), E=ESTACIONES[c.est];

  // --- mando de la bomba: el plato y su palanca dicen alfa ---
  const a=Math.max(0,Math.min(1,r.alfa));
  platoB.rotation.z=Math.PI/2-TILT_MAX*a;
  mandoArm.rotation.z=-TILT_MAX*a;
  // sobre el tope: el plato se queda clavado en el maximo y se enciende en rojo
  platoB.material=(r.alfa>ALFA_MAX)?MAT.platoTope:MAT.plato;

  // --- cilindradas: barrilete y pistones ---
  // el radio del circulo de pistones lo fija la cilindrada; la carrera, la
  // inclinacion del plato. Con alfa=0 el plato queda recto y NO hay carrera:
  // el barrilete gira pero la bomba no desplaza nada.
  hw.rb=rBar(c.db)*0.72; hw.rm=rBar(c.dm)*0.66;
  hw.carrB=hw.rb*Math.tan(TILT_MAX*a);   // plato de la bomba: inclinacion de mando
  hw.carrM=hw.rm*Math.tan(TILT_MAX);     // plato del motor: fijo al maximo
  colocaPistones();

  // --- aceite: color del grado y nivel segun la temperatura de equilibrio ---
  MAT.aceite.color.set(COL_VG[c.vg]);
  const tOK=Number.isFinite(r.T);
  const fT=tOK?clamp01((r.T-E.tAmb)/(T_MAX-E.tAmb+1e-9)):0;
  nivel.scale.y=lerp(1.0,1.16,fT);            // el aceite caliente se dilata
  nivel.position.y=0.40+0.13*(nivel.scale.y-1);
  MAT.aceite.opacity=lerp(0.86,0.70,fT);

  // --- mangueras: la de alta se tine con Delta p, el retorno queda frio ---
  const fP=clamp01(r.dp/(E.pLim||400));
  mezcla(MAT.tuboAlta,'#7a4a44','#ff5a3c',fP);
  MAT.tuboRet.color.set('#4a7fc2');

  // --- radiador: las aletas se calientan con la potencia que hay que evacuar ---
  const fC=clamp01((Number.isFinite(r.calor)?r.calor:0)/14);
  mezcla(MAT.aleta,'#7f8b9c','#e0703c',fC);

  // --- barras: presion contra su limite, temperatura contra 80 grados C ---
  setBarra(BAR_DP, r.dp/(E.pLim*1.25), 1/1.25, r.okPres?OK_HEX:BAD_HEX);
  setBarra(BAR_T,  tOK?r.T/(T_MAX*1.25):0.02, 1/1.25, r.okTerm?OK_HEX:BAD_HEX);

  // --- velocidades de giro para la animacion ---
  hw.wB=(c.nb/60)*Math.PI*2*0.10;
  hw.wM=tOK?(E.nReq/60)*Math.PI*2*0.10:0;
  hw.wV=hw.wB;
  hw.flujo=r.fisico&&tOK?clamp01(r.qLazo/260):0;
  hw.fC=fC;
  hw.vivo=r.fisico&&tOK;
}

// ===================== 9. HUD Y PANEL =====================
el('hud').innerHTML=`
  <div class="eyebrow">Hidráulica y Neumática · Mecánica</div>
  <h2>Analiza una transmisión hidrostática bomba-motor</h2>
  <p>En una transmisión hidrostática no hay caja de cambios: la marcha es el <b>plato inclinado</b> de la bomba. Inclinas más, la bomba desplaza más por vuelta y el motor gira más deprisa; el par, en cambio, no lo pone el plato sino la presión, porque <b>T = Δp·D/2π</b>. Aquí montas el conjunto —cilindrada de bomba, cilindrada de motor, grado del aceite y régimen del diésel— y compruebas que la máquina hace su trabajo sin pasarse de presión, de temperatura ni de mando.</p>
  <div class="formula">T = Δp·D / 2π · Q = D·n·α / 1000 · η<sub>tot</sub> = η<sub>vb</sub>·η<sub>tb</sub>·η<sub>vm</sub>·η<sub>tm</sub> · σ·τ = K<sub>S</sub>·K<sub>V</sub> = const</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#8AB4F8"></span>Bomba de cilindrada variable: el plato inclinado es la única marcha</div>
    <div class="li"><span class="dot" style="background:#C08CF8"></span>Motor de plato fijo: cilindrada constante, el par lo pone la presión</div>
    <div class="li"><span class="dot" style="background:#ff6b6b"></span>Línea de alta: la que lleva Δp y la que fija el par en el eje</div>
    <div class="li"><span class="dot" style="background:#7CD992"></span>Bomba de carga: repone fugas y barrido, o el lazo se vacía</div>
    <div class="li"><span class="dot" style="background:#E9C46A"></span>Aceite: su viscosidad decide entre fugar y arrastrar</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> el par y el caudal ideales de una máquina de desplazamiento positivo (T = Δp·D/2π, Q = D·n/1000) y la Δp que exige el punto de servicio; las pérdidas de bomba y motor con el modelo de coeficientes adimensionales de Wilson (1946), con fuga laminar σ = K<sub>S</sub>·Δp/(μ·ω), arrastre viscoso τ = K<sub>V</sub>·μ·ω/Δp y rozamiento de Coulomb K<sub>F</sub>, aplicados con el signo que corresponde a cada máquina (la bomba pierde caudal, el motor lo consume de más); el mando α que cierra la cinemática, la relación de transmisión geométrica frente a la cinemática y el deslizamiento que las separa; la viscosidad del aceite frente a la temperatura por la ecuación de Walther (ASTM D341) sobre los grados ISO VG de la norma ISO 3448 y la densidad corregida por dilatación; el <b>equilibrio térmico como incógnita</b>, resolviendo calor(T) = UA·(T − T<sub>amb</sub>) por barrido y bisección; el circuito de barrido y la bomba de carga con su rendimiento volumétrico y su presión de alimentación; el balance de potencia completo, el consumo anual en kWh y el coste del conjunto.</div>
    <div class="fl no"><b>NO modela:</b> la dinámica del arranque, la respuesta del regulador del plato, el golpe de ariete ni la cavitación en la aspiración. Los coeficientes de Wilson se toman constantes para toda la familia de cilindradas, cuando en una máquina real dependen algo del tamaño y del desgaste. El intercambio con el ambiente se resume en un único coeficiente UA constante, sin distinguir depósito, tuberías y radiador ni la velocidad del aire. Las cilindradas y los grados ISO son los de catálogo, no los de un fabricante concreto, y el precio es representativo del tipo constructivo. El giro de las piezas en el 3D marca el sentido y la velocidad relativa; no resuelve la cinemática de los pistones.</div>
  </div>
  <div class="src">Ref: ISO 4391 · ISO 4409 · ISO 3448 · ASTM D341 · ISO 4413 · Wilson (1946)</div>`;

el('panel').innerHTML=`
  <h4>Banco hidrostático · <span id="p_mode" style="color:var(--accent2)">Par y caudal</span></h4>
  <div class="modebar">
    <button class="b on" id="m_par">1 · Par</button>
    <button class="b" id="m_relacion">2 · Relación</button>
    <button class="b" id="m_rend">3 · Rendimiento</button>
    <button class="b" id="m_aceite">4 · Aceite</button>
    <button class="b" id="m_reto">5 · Reto</button>
  </div>
  <div id="scenarioInfo" style="display:none;margin:8px 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:12.5px;line-height:1.45"></div>
  <div class="modebar" id="selbar" style="display:none;flex-wrap:wrap"></div>
  <div style="margin:8px 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px">
    <div style="font-size:12px;color:var(--muted)" id="hwrot">Cargadora de ruedas</div>
    <div style="font-size:13px;font-weight:600" id="hwsub">Tracción hidrostática de la máquina</div>
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
  par:{nombre:'Par y caudal',cam:[[5.0,3.0,7.6],[3.10,1.00,0.00]],
    mision:'El motor tiene que dar un par concreto a un régimen concreto. El par no lo pone el plato: lo pone la presión, porque T = Δp·D/2π. Cambia la cilindrada del motor y mira cómo la presión sube o baja para dar el mismo par, hasta chocar con el límite del grupo.'},
  relacion:{nombre:'Relación de transmisión',cam:[[3.6,2.6,7.2],[2.20,1.00,0.00]],
    mision:'Aquí no hay marchas: la única marcha es el mando α del plato. La relación geométrica vale D_b·α/D_m, pero la que se mide en los ejes es menor, porque las dos máquinas fugan. Esa diferencia es el deslizamiento, y no se puede quitar con más mando.'},
  rend:{nombre:'Rendimiento del conjunto',cam:[[4.2,2.8,7.0],[2.60,1.05,0.00]],
    mision:'Cuatro rendimientos en cascada: la bomba pierde caudal y par, el motor los pierde otra vez. El total es su producto. Fíjate en σ·τ: el producto de la fuga por el arrastre es una constante del par de máquinas, no depende del punto de trabajo. Por eso no puedes bajar los dos a la vez.'},
  aceite:{nombre:'El aceite decide',cam:[[3.0,2.4,6.4],[2.20,0.90,-0.60]],
    mision:'Con el mismo hierro montado, cambia sólo el bidón. Un aceite fino fuga y uno espeso arrastra, y la temperatura de equilibrio no la eliges tú: sale de igualar el calor generado con el que la máquina puede evacuar. Busca el cruce de las dos curvas y mira dónde cae la viscosidad resultante.'},
  reto:{nombre:'Reto',cam:[[5.4,3.4,8.4],[2.40,1.10,0.00]],
    mision:'Cuatro ejes y siete criterios que hay que cumplir a la vez. Monta el conjunto válido más barato para la estación que te toca; a igualdad de coste gana el que menos energía consume al año.'},
};
const lbl=t=>`<span style="align-self:center;color:var(--muted);font-size:12px;margin:0 4px 0 2px">${t}</span>`;
function optBtns(key,opts,cur){
  return opts.map(o=>{
    const v=Array.isArray(o)?o[0]:o, t=Array.isArray(o)?o[1]:o;
    return `<button class="b sm ${String(cur)===String(v)?'on':''}" data-${key}="${v}">${t}</button>`;
  }).join('');
}
const beep=()=>synth.beep(680,0.05,0.04);
const OPT_EST=EST_KEYS.map(k=>[k,ESTACIONES[k].nombre.split(' ')[0]]);
const OPT_DB =DB.map(d=>[d,f1(d,0)+' cm³']);
const OPT_DM =DM.map(d=>[d,f1(d,0)+' cm³']);
const OPT_VG =GRADOS.map(v=>[v,'VG '+v]);
const OPT_NB =NB.map(n=>[n,f1(n,0)+' rpm']);
const VG_ROT=v=>'ISO VG '+v;
const EJE_ROT={db:'Cilindrada de la bomba',dm:'Cilindrada del motor',
  vg:'Grado del aceite',nb:'Régimen del diésel'};
const EJE_VAL_ROT={db:v=>f1(v,0)+' cm³/rev',dm:v=>f1(v,0)+' cm³/rev',
  vg:v=>VG_ROT(v),nb:v=>f1(v,0)+' rpm'};

function buildControls(){
  const bar=el('selbar');let h='';
  if(mode==='par'){
    h+=lbl('Estación')+optBtns('ae',OPT_EST,ST.par.est);
    h+=lbl('Cilindrada del motor')+optBtns('am',OPT_DM,ST.par.dm);
  }else if(mode==='relacion'){
    h+=lbl('Estación')+optBtns('be',OPT_EST,ST.relacion.est);
    h+=lbl('Cilindrada de la bomba')+optBtns('bb',OPT_DB,ST.relacion.db);
    h+=lbl('Régimen')+optBtns('bn',OPT_NB,ST.relacion.nb);
  }else if(mode==='rend'){
    h+=lbl('Estación')+optBtns('ce',OPT_EST,ST.rend.est);
    h+=lbl('Cilindrada del motor')+optBtns('cm',OPT_DM,ST.rend.dm);
    h+=lbl('Régimen')+optBtns('cn',OPT_NB,ST.rend.nb);
  }else if(mode==='aceite'){
    h+=lbl('Estación')+optBtns('de',OPT_EST,ST.aceite.est);
    h+=lbl('Aceite')+optBtns('dv',OPT_VG,ST.aceite.vg);
    h+=lbl('Régimen')+optBtns('dn',OPT_NB,ST.aceite.nb);
  }else{
    h+=lbl('Bomba')+optBtns('xb',OPT_DB,RETO.cfg.db);
    h+=lbl('Motor')+optBtns('xm',OPT_DM,RETO.cfg.dm);
    h+=lbl('Aceite')+optBtns('xv',OPT_VG,RETO.cfg.vg);
    h+=lbl('Régimen')+optBtns('xn',OPT_NB,RETO.cfg.nb);
    h+='<button class="b sm" id="btnPista">💡 Pista</button>';
  }
  bar.innerHTML=h;bar.style.display='flex';
  const wire=(attr,fn)=>bar.querySelectorAll('['+attr+']').forEach(b=>{
    b.onclick=()=>{if(autoRunning)return;fn(b.getAttribute(attr));beep();afterEdit();};
  });
  wire('data-ae',v=>{ST.par.est=v;});
  wire('data-am',v=>{ST.par.dm=Number(v);});
  wire('data-be',v=>{ST.relacion.est=v;});
  wire('data-bb',v=>{ST.relacion.db=Number(v);});
  wire('data-bn',v=>{ST.relacion.nb=Number(v);});
  wire('data-ce',v=>{ST.rend.est=v;});
  wire('data-cm',v=>{ST.rend.dm=Number(v);});
  wire('data-cn',v=>{ST.rend.nb=Number(v);});
  wire('data-de',v=>{ST.aceite.est=v;});
  wire('data-dv',v=>{ST.aceite.vg=Number(v);});
  wire('data-dn',v=>{ST.aceite.nb=Number(v);});
  wire('data-xb',v=>{RETO.cfg={...RETO.cfg,db:Number(v)};RETO.msg='';RETO.resuelto=false;});
  wire('data-xm',v=>{RETO.cfg={...RETO.cfg,dm:Number(v)};RETO.msg='';RETO.resuelto=false;});
  wire('data-xv',v=>{RETO.cfg={...RETO.cfg,vg:Number(v)};RETO.msg='';RETO.resuelto=false;});
  wire('data-xn',v=>{RETO.cfg={...RETO.cfg,nb:Number(v)};RETO.msg='';RETO.resuelto=false;});
  const bp=el('btnPista');
  if(bp) bp.onclick=()=>{if(autoRunning)return;pista();};
}
// Una pista destapa UN eje: dice que valores de ese eje aparecen en alguna
// configuracion optima. No resuelve el reto, porque los cuatro ejes se juzgan
// juntos y acertar uno no garantiza que la combinacion valga.
function pista(){
  const eje=EJES.find(e=>!RETO.ejes[e]);
  if(!eje){showToast('💡 Ya has destapado los cuatro ejes. La combinación la tienes que cerrar tú.');return;}
  RETO.ejes[eje]=true;beep();
  const vals=ejeSolC(ST.reto.est,eje).map(v=>EJE_VAL_ROT[eje](v)).join(' · ');
  showToast('💡 <b>'+EJE_ROT[eje]+'.</b> En el conjunto más barato aparece: '+(vals||'ningún valor: esta estación no tiene solución'));
  afterEdit();
}

function updateScenarioInfo(){
  const d=el('scenarioInfo');
  d.style.display='block';
  d.innerHTML='<b>'+MODE_META[mode].nombre+'.</b> '+MODE_META[mode].mision;
}
function updateHwRot(){
  const k=estAct(), E=ESTACIONES[k], c=cfgDe(mode);
  el('hwrot').textContent=E.nombre;
  el('hwsub').textContent=E.detalle+' · bomba '+f1(c.db,0)+' / motor '+f1(c.dm,0)+
    ' cm³ · '+VG_ROT(c.vg)+' · '+f1(c.nb,0)+' rpm';
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
// "Nuevo escenario": en el reto cambia de estacion y rearma el conjunto de
// partida; en los modos de estudio mueve el ensayo al siguiente caso que ensena
// algo, en vez de dejarlo donde estaba.
function newSignal(){
  if(mode==='par'){
    const i=DM.indexOf(ST.par.dm);ST.par.dm=DM[(i+1)%DM.length];
    if(i+1>=DM.length){const j=EST_KEYS.indexOf(ST.par.est);ST.par.est=EST_KEYS[(j+1)%EST_KEYS.length];}
  }else if(mode==='relacion'){
    const i=DB.indexOf(ST.relacion.db);ST.relacion.db=DB[(i+1)%DB.length];
    if(i+1>=DB.length){const j=NB.indexOf(ST.relacion.nb);ST.relacion.nb=NB[(j+1)%NB.length];}
  }else if(mode==='rend'){
    const i=EST_KEYS.indexOf(ST.rend.est);ST.rend.est=EST_KEYS[(i+1)%EST_KEYS.length];
    const o=solucion(ST.rend.est);
    if(o){ST.rend.dm=o.dm;ST.rend.nb=o.nb;}
  }else if(mode==='aceite'){
    const i=GRADOS.indexOf(ST.aceite.vg);ST.aceite.vg=GRADOS[(i+1)%GRADOS.length];
    if(i+1>=GRADOS.length){
      const j=EST_KEYS.indexOf(ST.aceite.est);ST.aceite.est=EST_KEYS[(j+1)%EST_KEYS.length];
      const o=solucion(ST.aceite.est); if(o)ST.aceite.nb=o.nb;
    }
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

function updateTele(){
  const c=cfgDe(mode), E=ESTACIONES[c.est], r=CUR;
  const tOK=Number.isFinite(r.T);
  let h='';
  if(mode==='par'){
    h+=teleRow('Par que pide la máquina',f1(E.tReq,0)+' N·m');
    h+=teleRow('Régimen que pide',f1(E.nReq,0)+' rpm');
    h+=teleRow('Cilindrada del motor',f1(c.dm,0)+' cm³/rev');
    h+=teleRow('Δp ideal (T·2π/D)',f1(E.tReq*20*Math.PI/c.dm,1)+' bar');
    h+=teleRow('Δp real que hace falta',f1(r.dp,1)+' bar',cls2(r.okPres));
    h+=teleRow('Límite del grupo',f1(E.pLim,0)+' bar');
    h+=teleRow('Par ideal a esa Δp',f1(r.tIdealM,0)+' N·m');
    h+=teleRow('Rendimiento mecánico η_t',pc1(r.etaTm,1));
    h+=teleRow('Par en el eje',f1(r.parMotor,0)+' N·m');
    h+=teleRow('Caudal ideal del motor',f1(r.qMotIdeal,1)+' L/min');
    h+=teleRow('Fuga del motor',f1(r.qFugaM,2)+' L/min');
    h+=teleRow('Potencia útil',f1(r.pOut,1)+' kW');
  }else if(mode==='relacion'){
    h+=teleRow('Cilindrada de la bomba',f1(c.db,0)+' cm³/rev');
    h+=teleRow('Cilindrada del motor',f1(c.dm,0)+' cm³/rev');
    h+=teleRow('Régimen del diésel',f1(c.nb,0)+' rpm');
    h+=teleRow('Mando α del plato',f1(r.alfa,3),cls2(r.okVel));
    h+=teleRow('Tope de mando',f1(ALFA_MAX,2));
    h+=teleRow('Relación geométrica D_b·α/D_m',f1(r.relGeom,3));
    h+=teleRow('Relación cinemática n_m/n_b',f1(r.relCin,3));
    h+=teleRow('Deslizamiento 1 − η_vb·η_vm',pc1(r.desliz,2));
    h+=teleRow('Caudal ideal de la bomba',f1(r.qBomIdeal,1)+' L/min');
    h+=teleRow('Fuga de la bomba',f1(r.qFugaB,2)+' L/min');
    h+=teleRow('Caudal por el lazo',f1(r.qLazo,1)+' L/min');
    h+=teleRow('Régimen del motor',f1(E.nReq,0)+' rpm',cls2(r.okRpm));
  }else if(mode==='rend'){
    h+=teleRow('η volumétrico bomba',pc1(r.etaVb,2));
    h+=teleRow('η mecánico bomba',pc1(r.etaTb,2));
    h+=teleRow('η volumétrico motor',pc1(r.etaVm,2));
    h+=teleRow('η mecánico motor',pc1(r.etaTm,2));
    h+=teleRow('η total del conjunto',pc1(r.etaTot,2));
    h+=teleRow('σ de la bomba',f1(r.sb,4));
    h+=teleRow('τ de la bomba',f1(r.tb,4));
    h+=teleRow('σ·τ (constante)',f1(r.sb*r.tb,5));
    h+=teleRow('Potencia en el eje del diésel',f1(r.pIn,1)+' kW');
    h+=teleRow('Potencia de la bomba de carga',f1(r.pCarga,2)+' kW');
    h+=teleRow('Diésel disponible',f1(E.pDies[c.nb],0)+' kW',cls2(r.okPot));
    h+=teleRow('Calor a evacuar',f1(r.calor,2)+' kW');
  }else if(mode==='aceite'){
    const nuS=tOK?nuDeMu(muOptSistema(r.dp,r.wb,r.wm),r.rho):NaN;
    h+=teleRow('Grado del aceite',VG_ROT(c.vg));
    h+=teleRow('Viscosidad a 40 °C',f1(nu(c.vg,40),1)+' mm²/s');
    h+=teleRow('Viscosidad a 100 °C',f1(nu(c.vg,100),2)+' mm²/s');
    h+=teleRow('Ambiente',f1(E.tAmb,0)+' °C');
    h+=teleRow('Evacuación UA',f1(E.UA,2)+' kW/°C');
    h+=teleRow('Temperatura de equilibrio',tOK?f1(r.T,1)+' °C':'no cierra',cls2(r.okTerm));
    h+=teleRow('Viscosidad en servicio',f1(r.nu,1)+' mm²/s',cls2(r.okVisc));
    h+=teleRow('Ventana de trabajo',f1(NU_MIN,0)+' – '+f1(NU_MAX,0)+' mm²/s');
    h+=teleRow('Viscosidad óptima del conjunto',f1(nuS,1)+' mm²/s');
    h+=teleRow('Calor generado',f1(r.calor,2)+' kW');
    h+=teleRow('Rendimiento total',pc1(r.etaTot,2));
    h+=teleRow('Energía al año',f1(r.kwh,0)+' kWh');
  }else{
    const s=RETO.sol;
    h+=teleRow('Estación',E.nombre);
    h+=teleRow('Conjunto montado',f1(c.db,0)+' / '+f1(c.dm,0)+' cm³ · VG '+c.vg+' · '+f1(c.nb,0)+' rpm');
    h+=teleRow('Precio del conjunto',f1(r.coste,0)+' k€');
    h+=teleRow('Criterios cumplidos',f1(CRIT.length-r.fallos.length,0)+' / '+f1(CRIT.length,0),
      cls2(r.valida));
    h+=teleRow('Temperatura',tOK?f1(r.T,1)+' °C':'no cierra',cls2(r.okTerm));
    h+=teleRow('Mando α',f1(r.alfa,3),cls2(r.okVel));
    h+=teleRow('Presión Δp',f1(r.dp,1)+' bar',cls2(r.okPres));
    h+=teleRow('Potencia pedida',f1(r.pIn+r.pCarga,1)+' kW',cls2(r.okPot));
    h+=teleRow('Viscosidad',f1(r.nu,1)+' mm²/s',cls2(r.okVisc));
    h+=teleRow('Régimen admisible',f1(NMAX_DB[c.db],0)+' / '+f1(NMAX_DM[c.dm],0)+' rpm',cls2(r.okRpm));
    h+=teleRow('Bomba de carga',f1(r.qCarga,1)+' ≥ '+f1(r.qCargaReq,1)+' L/min',cls2(r.okCarga));
    h+=teleRow('Precio mínimo posible',s?f1(s.coste,0)+' k€':'sin solución');
  }
  el('tele').innerHTML=h;
}

// El informe explica el POR QUE de lo que se ve, con las cifras del propio punto
// de trabajo. Nunca repite un numero sin decir de donde sale.
function updateReport(){
  const c=cfgDe(mode), E=ESTACIONES[c.est], r=CUR;
  const tOK=Number.isFinite(r.T);
  let t='';
  if(mode==='par'){
    const dpId=E.tReq*20*Math.PI/c.dm;
    t='> '+E.nombre+': '+f1(E.tReq,0)+' N·m a '+f1(E.nReq,0)+' rpm.\n';
    t+='> Con D = '+f1(c.dm,0)+' cm³/rev, T = Δp·D/2π pide '+f1(dpId,1)+' bar sólo para el par útil.\n';
    t+='> El arrastre viscoso y el rozamiento suben la cuenta a '+f1(r.dp,1)+' bar ('+
       f1(100*(r.dp/dpId-1),1)+' % de recargo).\n';
    t+=r.okPres?'> Cabe: el límite del grupo son '+f1(E.pLim,0)+' bar.\n'
              :'> NO cabe: el límite del grupo son '+f1(E.pLim,0)+' bar. Hace falta más cilindrada.\n';
    t+='> Doblar la cilindrada del motor no dobla el par: divide la presión que hace falta para darlo.';
  }else if(mode==='relacion'){
    t='> Bomba '+f1(c.db,0)+' cm³ a '+f1(c.nb,0)+' rpm contra motor '+f1(c.dm,0)+' cm³.\n';
    t+='> El plato tiene que ponerse en α = '+f1(r.alfa,3)+
       (r.okVel?' y el tope está en '+f1(ALFA_MAX,2)+'.\n':' pero el tope está en '+f1(ALFA_MAX,2)+': no llega.\n');
    t+='> Geométricamente la relación es '+f1(r.relGeom,3)+', pero medida en los ejes sale '+f1(r.relCin,3)+'.\n';
    t+='> La diferencia es el deslizamiento: '+pc1(r.desliz,2)+' del giro se pierde en fuga, no en fricción.\n';
    t+='> No es un ajuste: 1 − η_vb·η_vm sale de las mismas fugas que ya cuenta el rendimiento.';
  }else if(mode==='rend'){
    t='> Cuatro rendimientos en cascada, uno por cada forma de perder.\n';
    t+='> Bomba: fuga '+pc1(1-r.etaVb,2)+' del caudal, gasta '+pc1(1-r.etaTb,2)+' de más en par.\n';
    t+='> Motor: consume '+pc1(1-1/(1+r.sm),2)+' de caudal de más, entrega '+pc1(1-r.etaTm,2)+' menos de par.\n';
    t+='> Producto: η_tot = '+pc1(r.etaTot,2)+'. De '+f1(r.pIn,1)+' kW que entran salen '+f1(r.pOut,1)+' kW.\n';
    t+='> σ·τ = '+f1(r.sb*r.tb,5)+' en la bomba y '+f1(r.sm*r.tm,5)+' en el motor: la MISMA cifra.\n';
    t+='> Es K_S·K_V y no depende del punto de trabajo: bajar la fuga sube el arrastre en la misma proporción.';
  }else if(mode==='aceite'){
    const nuS=tOK?nuDeMu(muOptSistema(r.dp,r.wb,r.wm),r.rho):NaN;
    const techo=tOK?etaDeMu(r.dp,muOptSistema(r.dp,r.wb,r.wm),r.wb,r.wm):NaN;
    t='> '+VG_ROT(c.vg)+': '+f1(nu(c.vg,40),1)+' mm²/s a 40 °C y '+f1(nu(c.vg,100),2)+' a 100 °C.\n';
    t+=tOK?'> El aceite se para a '+f1(r.T,1)+' °C: ahí el calor generado ('+f1(r.calor,2)+
           ' kW) iguala al evacuado.\n'
          :'> No hay cruce: el calor generado supera a UA·(T−T_amb) en todo el rango. Se dispara.\n';
    t+='> A esa temperatura la viscosidad es '+f1(r.nu,1)+' mm²/s'+
       (r.okVisc?' y cae dentro de la ventana '+f1(NU_MIN,0)+'–'+f1(NU_MAX,0)+'.\n'
               :' y se sale de la ventana '+f1(NU_MIN,0)+'–'+f1(NU_MAX,0)+'.\n');
    t+='> El conjunto pediría '+f1(nuS,1)+' mm²/s para rendir '+pc1(techo,2)+'; con este bidón rinde '+
       pc1(r.etaTot,2)+'.\n';
    t+='> La temperatura NO se elige: se calcula. Un aceite más espeso calienta más y se adelgaza solo.';
  }else{
    const s=RETO.sol;
    t='> '+E.nombre+' · '+E.detalle+'.\n';
    t+='> Pide '+f1(E.tReq,0)+' N·m a '+f1(E.nReq,0)+' rpm, con '+f1(E.tAmb,0)+' °C de ambiente y UA = '+
       f1(E.UA,2)+' kW/°C.\n';
    t+='> Montado: bomba '+f1(c.db,0)+', motor '+f1(c.dm,0)+' cm³, '+VG_ROT(c.vg)+', '+f1(c.nb,0)+' rpm → '+
       f1(r.coste,0)+' k€.\n';
    t+=r.valida?'> Cumple los siete criterios.\n':'> Falla: '+r.fallos.map(k=>CRIT_ROT[k]).join(', ')+'.\n';
    t+=RETO.msg?'> '+RETO.msg+'\n':'';
    t+='> De '+f1(RETO.nval,0)+' conjuntos válidos, el más barato cuesta '+(s?f1(s.coste,0)+' k€':'—')+'.';
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
// El reto no compara contra una respuesta escrita a mano: resuelve el catalogo
// entero de la estacion (300 conjuntos, cada uno con su punto fijo termico) y
// se queda con el mas barato, desempatando por energia anual.
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
  const est=ST.reto.est, E=ESTACIONES[est];
  let h='<b>'+E.nombre+' · '+E.detalle+'.</b> Monta el conjunto <b>válido más barato</b>. ';
  h+='Tiene que dar '+f1(E.tReq,0)+' N·m a '+f1(E.nReq,0)+' rpm con '+f1(E.tAmb,0)+
     ' °C de ambiente, y cumplir los siete criterios a la vez:';
  h+='<ul style="margin:6px 0 0 16px;padding:0">';
  CRIT.forEach(k=>{ h+='<li>'+CRIT_ROT[k]+' — '+CRIT_POR[k]+'</li>'; });
  h+='</ul>';
  h+='<div style="margin-top:6px;color:var(--muted)">Empate de precio: gana el que menos energía consume al año ('+
     f1(E.horas,0)+' h de servicio).</div>';
  el('retoSpec').innerHTML=h;
}
// Explica por que la configuracion puesta no vale, mirando eje por eje.
function retoExplain(r,c,est){
  if(r.valida) return '';
  const fal=r.fallos.map(k=>CRIT_ROT[k]).join(', ');
  let p='Falla '+fal+'. ';
  if(!r.okPres) p+='Con '+f1(c.dm,0)+' cm³ el motor necesita '+f1(r.dp,1)+
    ' bar y el grupo aguanta '+f1(ESTACIONES[est].pLim,0)+': más cilindrada baja la presión. ';
  else if(!r.okVel) p+='El plato pediría α = '+f1(r.alfa,3)+' y el tope es '+f1(ALFA_MAX,2)+
    ': o más cilindrada de bomba o más régimen. ';
  else if(!r.okRpm) p+='El catálogo no deja girar ese grupo tan deprisa: '+
    f1(NMAX_DB[c.db],0)+' rpm la bomba y '+f1(NMAX_DM[c.dm],0)+' el motor. ';
  else if(!r.okTerm) p+='El aceite se para en '+(Number.isFinite(r.T)?f1(r.T,1)+' °C':'ningún punto: se dispara')+
    ' y el techo son '+f1(T_MAX,0)+'. ';
  else if(!r.okVisc) p+='A esa temperatura la viscosidad queda en '+f1(r.nu,1)+
    ' mm²/s, fuera de la ventana '+f1(NU_MIN,0)+'–'+f1(NU_MAX,0)+'. ';
  else if(!r.okPot) p+='Pide '+f1(r.pIn+r.pCarga,1)+' kW y el diésel da '+
    f1(ESTACIONES[est].pDies[c.nb],0)+' a ese régimen. ';
  else if(!r.okCarga) p+='La bomba de carga repone '+f1(r.qCarga,1)+' L/min y el lazo pierde '+
    f1(r.qCargaReq,1)+': se queda sin aceite. ';
  return p;
}
function checkReto(){
  const est=ST.reto.est, c=RETO.cfg, s=RETO.sol;
  const r=evalua(est,c.db,c.dm,c.vg,c.nb);
  if(!s){
    RETO.msg='Esta estación no tiene ningún conjunto válido en el catálogo.';
    RETO.resuelto=false;
  }else if(r.valida && r.coste===s.coste && Math.abs(r.kwh-s.kwh)<1e-9){
    RETO.resuelto=true; solved=true;
    RETO.msg='Correcto: '+f1(r.coste,0)+' k€ y '+f1(r.kwh,0)+' kWh al año, el mínimo del catálogo.';
    synth.beep(880,0.10,0.06);
    showToast('✅ <b>Conjunto óptimo.</b> '+f1(r.coste,0)+' k€ · '+pc1(r.etaTot,2)+' de rendimiento · '+
      f1(r.T,1)+' °C de aceite.');
  }else if(r.valida){
    RETO.resuelto=false;
    RETO.msg=(r.coste===s.coste)
      ? 'Válido y al precio mínimo, pero gasta '+f1(r.kwh,0)+' kWh al año y hay otro conjunto igual de barato con '+f1(s.kwh,0)+'.'
      : 'Válido, pero no es el más barato: '+f1(r.coste,0)+' k€ frente a '+f1(s.coste,0)+' k€.';
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
  par:{pregunta:'El motor de la cargadora tiene que entregar 280 N·m. Con una cilindrada de 45 cm³/rev el lazo se equilibra en 413 bar; al montar uno de 28 cm³/rev la presión se dispara a 655 bar y revienta el límite de 420 bar de la estación. ¿Por qué sube tanto?',
    opciones:[
      {t:'Porque el par sale de Δp·D/2π: si recortas D a 0,62 de su valor, Δp tiene que crecer en esa misma proporción para dar el mismo par',ok:true,why:'413 / 0,62 = 663 bar, y el modelo da 655 porque de paso mejora un poco el rendimiento mecánico. La cilindrada del motor no es un detalle de catálogo: es el brazo de palanca con el que la presión hace par.'},
      {t:'Porque un motor más pequeño necesita más caudal y el caudal empuja la presión',ok:false,why:'Al revés: con 28 cm³/rev el caudal del lazo baja de 43 a 29 L/min. Y el caudal no fija la presión, fija la velocidad.'},
      {t:'Porque cae el rendimiento volumétrico del motor y hay que compensarlo con presión',ok:false,why:'El volumétrico sí cae (0,934 → 0,871), pero eso se paga en revoluciones, no en par. Un 7 % de fuga no explica un 59 % de presión.'},
      {t:'Porque la bomba de 45 cm³ no puede llenar un motor tan pequeño y estrangula',ok:false,why:'Sobra caudal, no falta: la bomba se limita bajando el mando α. Aquí no hay ninguna estrangulación.'}]},
  relacion:{pregunta:'Con el motor de 45 cm³ y el diésel a 1800 rpm, cambiar la bomba de 28 a 125 cm³/rev mueve el mando de α = 0,889 a α = 0,203, pero la presión se queda en 412 bar y la relación cinemática en 0,500 clavada. ¿Por qué no se mueven?',
    opciones:[
      {t:'Porque el trabajo lo fija la máquina, no la bomba: la carga pide 280 N·m (y eso fija Δp) y 900 rpm (y eso fija la relación). La bomba grande sólo hace lo mismo con menos mando',ok:true,why:'Ésta es la idea que más cuesta: en una transmisión hidrostática el punto de trabajo lo impone el consumidor. Elegir la bomba no cambia la faena, cambia dónde queda el mando y cuánto cuesta el hierro.'},
      {t:'Porque el caudal se conserva y es el caudal quien fija la presión',ok:false,why:'El caudal sí se conserva (43,3 → 43,8 L/min), pero el caudal fija la velocidad. La presión la fija el par.'},
      {t:'Porque el modelo mantiene Δp constante por construcción',ok:false,why:'No: en cuanto tocas la cilindrada del motor, Δp se mueve de 178 a 655 bar. Aquí se queda quieta porque no has tocado el motor.'},
      {t:'Porque la bomba grande tiene menos fugas relativas y compensa el resto',ok:false,why:'Tiene más: el deslizamiento sube de 9,60 % a 11,26 % y el aceite se calienta de 50,0 a 54,4 °C. La bomba sobredimensionada trabaja peor, sólo que no se nota en la relación.'}]},
  rend:{pregunta:'En todos los puntos de este laboratorio σ·τ vale exactamente 0,0016 —en la bomba y en el motor, con cualquier aceite, presión o velocidad—. ¿Qué te está diciendo ese número que no cambia nunca?',
    opciones:[
      {t:'Que fuga y arrastre son las dos caras de la misma moneda: σ = K_S·Δp/(μω) y τ = K_V·μω/Δp, y al multiplicarlas μ, ω y Δp se cancelan y sólo queda K_S·K_V',ok:true,why:'Por eso bajar una sube la otra y existe una viscosidad óptima. Un aceite fino apenas roza pero se escapa; uno espeso sella pero hay que arrastrarlo.'},
      {t:'Que las pérdidas totales del conjunto son constantes',ok:false,why:'No lo son: en este barrido el rendimiento mecánico de la bomba va de 0,938 a 0,894. Lo constante es el producto, no la suma.'},
      {t:'Que el modelo está mal calibrado: dos pérdidas independientes no pueden dar un producto constante',ok:false,why:'Es que no son independientes. Wilson (1946) las escribió así a propósito, y esa estructura es la que predice el óptimo de viscosidad que se mide en banco.'},
      {t:'Que 0,0016 es el rendimiento mínimo garantizado por la norma',ok:false,why:'σ y τ son coeficientes adimensionales de pérdida, no un rendimiento. Ninguna norma garantiza un producto de coeficientes.'}]},
  aceite:{pregunta:'En el cabrestante la bomba pide un aceite de 31 cSt y el motor uno de 207. En la cosechadora la bomba pide 21 y el motor 14. ¿Qué regla explica los dos casos a la vez?',
    opciones:[
      {t:'La máquina que gira más deprisa pide el aceite más fino, porque ν* es proporcional a Δp/ω',ok:true,why:'En el cabrestante el motor va a 21 rad/s frente a 157 de la bomba, y por eso pide aceite espeso; en la cosechadora va a 251 frente a 189 y pide el más fino de los dos. El depósito es uno solo, así que el óptimo del conjunto cae siempre entre los dos.'},
      {t:'Los motores piden siempre aceite más espeso que las bombas, porque trabajan a menos vueltas',ok:false,why:'La cosechadora lo desmiente: allí el motor gira más que la bomba y pide aceite más fino. La regla es la velocidad, no la etiqueta de la máquina.'},
      {t:'Depende del ambiente: el cabrestante trabaja a 12 °C y necesita aceite más espeso para no adelgazar',ok:false,why:'El ambiente decide qué viscosidad tendrás, no cuál te conviene. ν* sale del punto de trabajo (Δp y ω) y no cambia si mueves la temperatura.'},
      {t:'Depende de la cilindrada: el motor de 80 cm³ tiene más superficie por donde fugar',ok:false,why:'La cilindrada se cancela en el cociente: entra igual en la fuga y en el arrastre. Dos máquinas de tamaños distintos al mismo Δp y ω piden el mismo aceite.'}]},
  reto:{pregunta:'La cargadora admite 43 conjuntos válidos y cinco empatan en el precio mínimo de 17 k€, con consumos de 46 991 a 48 362 kWh al año. ¿Cuál gana con el orden declarado en este laboratorio?',
    opciones:[
      {t:'El de 46 991 kWh: primero el precio del conjunto y, sólo a igualdad de precio, la energía del año',ok:true,why:'El orden es lexicográfico y está escrito en la ficha del reto. Sin un orden total declarado no existe "el óptimo": existen preferencias, y cada quien defiende la suya.'},
      {t:'Cualquiera de los cinco: si empatan en precio son equivalentes',ok:false,why:'Empatan en el primer criterio, y para eso está el segundo. 1 371 kWh al año es dinero real que se paga en gasóleo.'},
      {t:'El de menor consumo de los 43, aunque cueste más caro',ok:false,why:'Es un criterio defendible, pero no es el declarado aquí. Cambiar el orden a mitad de un estudio es exactamente cómo se cuelan las decisiones arbitrarias.'},
      {t:'El que quede más frío, porque el calor es lo que mata las transmisiones',ok:false,why:'La temperatura ya está filtrada antes, en el criterio de equilibrio térmico: los 43 conjuntos que llegan a esta comparación ya son térmicamente sanos.'}]},
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
  diesel:()=>{const c=cfgDe(mode),E=ESTACIONES[c.est];
    return ['Motor diésel','Gira a '+f1(c.nb,0)+' rpm y puede dar '+f1(E.pDies[c.nb],0)+
      ' kW en ese régimen. Ahora la bomba principal le pide '+f1(CUR.pIn,2)+
      ' kW y la de carga otros '+f1(CUR.pCarga,2)+' kW'+
      (CUR.okPot?'.':', más de lo que tiene: se cala.')];},
  bomba:()=>{const c=cfgDe(mode);
    return ['Bomba de cilindrada variable',f1(c.db,0)+' cm³/rev con el plato al '+f1(100*CUR.alfa,1)+
      ' % de su carrera (el tope de trabajo es '+f1(100*ALFA_MAX,0)+' %). Manda '+f1(CUR.qLazo,1)+
      ' L/min al lazo y se le escapan '+f1(CUR.qFugaB,2)+' L/min por los patines: η_v = '+
      f1(100*CUR.etaVb,1)+' % y η_t = '+f1(100*CUR.etaTb,1)+' %.'];},
  motorh:()=>{const c=cfgDe(mode),E=ESTACIONES[c.est];
    return ['Motor hidráulico de plato fijo',f1(c.dm,0)+' cm³/rev a '+f1(CUR.dp,0)+
      ' bar dan un par ideal de '+f1(CUR.tIdealM,1)+' N·m; después de la fricción quedan '+
      f1(CUR.parMotor,1)+' N·m en el eje, que es justo lo que pide la máquina. El brazo de palanca de la presión es la cilindrada: T = Δp·D/2π.'];},
  carga:()=>{const E=ESTACIONES[estAct()];
    return ['La máquina accionada',E.nombre+' · '+E.detalle+'. Pide '+f1(E.nReq,0)+' rpm y '+
      f1(E.tReq,0)+' N·m, es decir '+f1(CUR.pOut,2)+' kW en el eje durante '+f1(E.horas,0)+
      ' horas al año. Esa exigencia es la que fija el punto de trabajo: la transmisión sólo decide cómo llegar a él.'];},
  deposito:()=>{const c=cfgDe(mode);
    return ['Depósito y aceite','ISO VG '+f1(c.vg,0)+'. En equilibrio el aceite se estabiliza a '+
      f1(CUR.T,1)+' °C y allí mide '+f1(CUR.nu,1)+' mm²/s. La ventana del fabricante va de '+
      f1(NU_MIN,0)+' a '+f1(NU_MAX,0)+' y la franja fina de '+f1(NU_OPT_LO,0)+' a '+f1(NU_OPT_HI,0)+
      '. El grado no se elige en el catálogo: se elige mirando dónde acaba caliente.'];},
  carga_b:()=>{const c=cfgDe(mode);
    return ['Bomba de carga','Cilindrada fija de '+f1(CUR.dCarga,1)+' cm³/rev ('+f1(100*FR_CARGA,0)+
      ' % de la principal) a '+f1(P_CARGA,0)+' bar. Repone '+f1(CUR.qCarga,2)+' L/min y el lazo pierde '+
      f1(CUR.qCargaReq,2)+' L/min entre fugas y barrido'+
      (CUR.okCarga?'. Sobra caudal: el lazo se mantiene lleno.':'. Falta caudal: el lazo cavita y la máquina no rueda.')];},
  radiador:()=>{const E=ESTACIONES[estAct()];
    return ['Radiador de aceite','Evacúa UA·(T − T_amb) con UA = '+f1(E.UA,2)+' kW/K sobre un ambiente de '+
      f1(E.tAmb,0)+' °C. Ahora se generan '+f1(CUR.calor,2)+' kW, así que la temperatura se para donde generación y evacuación se igualan: '+
      f1(CUR.T,1)+' °C (límite '+f1(T_MAX,0)+' °C). La temperatura no se ajusta, sale.'];},
  alta:()=>{const E=ESTACIONES[estAct()];
    return ['Línea de alta presión',f1(CUR.dp,0)+' bar contra un límite de '+f1(E.pLim,0)+' bar, con '+
      f1(CUR.qLazo,1)+' L/min circulando. Eso son '+f1(CUR.dp*CUR.qLazo/600,2)+
      ' kW de potencia hidráulica atravesando una manguera del grueso de una muñeca.'];},
  ret:()=>['Retorno del lazo','El circuito es cerrado: el aceite del motor vuelve a la aspiración de la bomba sin pasar por el depósito. '+
    'Por eso sólo hay que reponer '+f1(CUR.qCargaReq,2)+' L/min y no los '+f1(CUR.qLazo,1)+
    ' que circulan. El depósito de un lazo cerrado es diez veces más pequeño que el de un circuito abierto.'],
  bar_dp:()=>{const E=ESTACIONES[estAct()];
    return ['Barra de presión',f1(CUR.dp,0)+' bar frente al límite de '+f1(E.pLim,0)+' bar de la estación. '+
      (CUR.okPres?'Queda margen.':'Estás por encima: la válvula de máxima abriría y toda la potencia se iría en calor.')];},
  bar_t:()=>['Barra de temperatura',f1(CUR.T,1)+' °C de equilibrio frente a los '+f1(T_MAX,0)+
    ' °C de servicio continuo. '+(CUR.okTerm?'El aceite aguanta.':'Por encima de 80 °C el aceite se oxida y las juntas envejecen al doble por cada diez grados.')],
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
    // --- 1. par y caudal ---
    setMode('par'); ST.par.est='cargadora'; ST.par.dm=45; afterEdit();
    showToast('La cargadora pide '+f1(ESTACIONES.cargadora.tReq,0)+' N·m a '+
      f1(ESTACIONES.cargadora.nReq,0)+' rpm. Con un motor de 45 cm³/rev el lazo se equilibra en '+
      f1(CUR.dp,0)+' bar: la presión no la eliges, la pide la carga.');
    await sleep(4400);
    ST.par.dm=28; afterEdit();
    showToast('Mismo par con menos cilindrada: la presión salta a '+f1(CUR.dp,0)+' bar y revienta el límite de '+
      f1(ESTACIONES.cargadora.pLim,0)+' bar. T = Δp·D/2π, así que recortar D obliga a subir Δp en la misma proporción.');
    await sleep(5000);
    ST.par.dm=107; afterEdit();
    showToast('Y por el otro lado: con 107 cm³/rev bastan '+f1(CUR.dp,0)+
      ' bar, pero el mando pide α = '+f1(CUR.alfa,2)+' y la bomba sólo llega a '+f1(ALFA_MAX,2)+
      '. El motor grande es cómodo para la presión y caro para el caudal.');
    await sleep(5200);

    // --- 2. relacion de transmision ---
    setMode('relacion'); ST.relacion.est='cargadora'; ST.relacion.db=28; ST.relacion.nb=1800; afterEdit();
    const a28=CUR.alfa, d28=CUR.desliz;
    showToast('Aquí no hay marchas. Con una bomba de 28 cm³/rev el plato se planta en α = '+
      f1(a28,3)+' para dar las '+f1(ESTACIONES.cargadora.nReq,0)+' rpm que pide la rueda.');
    await sleep(4400);
    ST.relacion.db=125; afterEdit();
    showToast('Bomba de 125: el mando baja a α = '+f1(CUR.alfa,3)+
      ', pero la presión sigue en '+f1(CUR.dp,0)+' bar y la relación cinemática sigue clavada en '+
      f1(CUR.relCin,3)+'. La faena la fija la máquina, no la bomba.');
    await sleep(5400);
    showToast('Lo que sí empeora es la fuga: el deslizamiento sube de '+f1(100*d28,2)+' % a '+
      f1(100*CUR.desliz,2)+' % y el aceite se calienta '+f1(CUR.T,1)+' °C. Sobredimensionar no es gratis.');
    await sleep(5000);

    // --- 3. rendimiento del conjunto ---
    setMode('rend'); ST.rend.est='cosechadora'; ST.rend.dm=28; ST.rend.nb=1800; afterEdit();
    showToast('Cuatro rendimientos en cascada: η_vb = '+f1(100*CUR.etaVb,1)+' %, η_tb = '+
      f1(100*CUR.etaTb,1)+' %, η_vm = '+f1(100*CUR.etaVm,1)+' % y η_tm = '+f1(100*CUR.etaTm,1)+
      ' %. El total es su producto: '+f1(100*CUR.etaTot,1)+' %.');
    await sleep(5200);
    showToast('Mira el par σ·τ de la bomba: '+f1(CUR.sb,4)+' × '+f1(CUR.tb,4)+' = '+
      f1(CUR.sb*CUR.tb,4)+'. Y el del motor da exactamente lo mismo. Fuga y arrastre son la misma constante repartida de otra manera.');
    await sleep(5400);
    ST.rend.dm=107; afterEdit();
    showToast('Con un motor de 107 cm³ la bomba mejora (η_vb = '+f1(100*CUR.etaVb,1)+
      ' %) y el motor empeora (η_tm = '+f1(100*CUR.etaTm,1)+' %): el conjunto cae a '+
      f1(100*CUR.etaTot,1)+' %. No se pueden bajar las dos pérdidas a la vez.');
    await sleep(5400);

    // --- 4. el aceite decide ---
    setMode('aceite'); ST.aceite.est='cabrestante'; ST.aceite.nb=1500; ST.aceite.vg=32; afterEdit();
    showToast('Cabrestante forestal a '+f1(ESTACIONES.cabrestante.tAmb,0)+
      ' °C de ambiente. Con ISO VG 32 el aceite se para en '+f1(CUR.T,1)+' °C y mide '+
      f1(CUR.nu,1)+' mm²/s: dentro de la ventana.');
    await sleep(4600);
    ST.aceite.vg=46; afterEdit();
    showToast('Con VG 46 el rendimiento sube a '+f1(100*CUR.etaTot,1)+
      ' %, el mejor de los cuatro grados... pero la viscosidad se va a '+f1(CUR.nu,1)+' mm²/s, por encima de los '+
      f1(NU_MAX,0)+' que admite el grupo. El óptimo teórico cae fuera de la ventana del fabricante, y manda la ventana.');
    await sleep(5400);
    ST.aceite.est='ventilador'; ST.aceite.nb=1800; ST.aceite.vg=32; afterEdit();
    showToast('El ventilador trabaja a '+f1(ESTACIONES.ventilador.tAmb,0)+' °C de ambiente y con VG 32 el aceite queda en '+
      f1(CUR.nu,1)+' mm²/s: ahora falla por abajo. El mismo bidón sirve para una máquina y arruina la otra.');
    await sleep(5400);
    ST.aceite.vg=68; afterEdit();
    showToast('Y con VG 68 se estabiliza en '+f1(CUR.T,1)+' °C, por encima del límite de '+
      f1(T_MAX,0)+' °C. La temperatura no se ajusta: sale de igualar el calor generado con el que el radiador puede sacar.');
    await sleep(5400);

    // --- 5. reto ---
    setMode('reto'); ST.reto.est='cargadora'; retoSolveBuild(true); afterEdit();
    showToast('Reto: de las '+f1(DB.length*DM.length*GRADOS.length*NB.length,0)+
      ' combinaciones del catálogo, '+f1(RETO.nval,0)+' cumplen los siete criterios a la vez en esta cargadora. Sólo una es la más barata.');
    await sleep(4800);
    checkReto();
    await sleep(3200);
    const s=RETO.sol;
    if(s){
      RETO.cfg={db:s.db,dm:s.dm,vg:s.vg,nb:s.nb}; afterEdit();
      checkReto();
      await sleep(1400);
      showToast('Ahí está: bomba de '+f1(s.db,0)+' cm³, motor de '+f1(s.dm,0)+' cm³, ISO VG '+
        f1(s.vg,0)+' y diésel a '+f1(s.nb,0)+' rpm. '+f1(CUR.coste,0)+' k€ y '+f1(CUR.kwh,0)+
        ' kWh al año. Ni un eje se puede mover sin romper algo.');
      await sleep(5000);
    }
    answer(quizCorrectIndex());
  } finally {
    autoRunning=false;
    el('btnAuto').textContent=rot;
  }
}

// ===================== 17. ANIMACIÓN, EVENTOS Y ARRANQUE =====================
// La animacion no inventa velocidades: el volante gira al regimen del diesel,
// el eje de salida al regimen que exige la faena y las gotas corren con el
// caudal del lazo. Si el conjunto no es fisico (sin punto fijo termico o con
// fuga mayor que el desplazamiento) todo se detiene: una maquina imposible no
// puede verse funcionando.
const _pv=new THREE.Vector3();
S.setAnimate((dt,tGlob)=>{
  animT+=dt;
  const vivo=!!hw.vivo;
  const wB=vivo?(hw.wB||0):0, wM=vivo?(hw.wM||0):0, wV=vivo?(hw.wV||0):0;
  giroB+=dt*wB; giroM+=dt*wM; giroV+=dt*wV;
  if(giroB>1e6){giroB=0;} if(giroM>1e6){giroM=0;} if(giroV>1e6){giroV=0;}

  // --- ejes: el diesel arrastra bomba y volante; el motor arrastra la carga ---
  if(volante) volante.rotation.x=giroV;
  if(ejeMotor) ejeMotor.rotation.x=giroM;
  if(tambor) tambor.rotation.x=-giroM;
  if(rotCarga) rotCarga.rotation.x=giroB;              // bomba de carga, al eje del diesel
  if(ventRad) ventRad.rotation.z=tGlob*(1.4+5.0*(hw.fC||0)); // el ventilador acelera con el calor

  // --- barriletes: giran, y su carrera axial la manda la inclinacion del plato ---
  colocaPistones();

  // --- gotas de aceite: velocidad proporcional al caudal del lazo ---
  for(const p of PART){
    const esCarga=(p.key==='carga');
    const v=esCarga?(vivo?0.17:0):0.34*(hw.flujo||0);
    p.grupo.visible=v>0.001;
    if(!p.grupo.visible) continue;
    for(let i=0;i<p.ms.length;i++){
      p.fase[i]+=dt*v; if(p.fase[i]>=1) p.fase[i]-=1;
      p.curve.getPointAt(p.fase[i],_pv);
      p.ms[i].position.copy(_pv);
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

retoSolveBuild(true); buildQuiz(); computa(); updateHW(); drawBoard(); S.start(); setMode('par');

// ===================== 18. PUENTE DE PRUEBAS =====================
// Superficie estable para las pruebas automatizadas: expone el motor de calculo
// y el estado de cada modo sin tocar el DOM.
window.__labDebug={
  mode:()=>mode,
  setMode,
  modes:()=>MODES.slice(),
  // --- constantes del dominio ---
  K_S, K_V, K_F, ALFA_MAX, NU_MIN, NU_MAX, NU_OPT_LO, NU_OPT_HI, T_MAX,
  P_CARGA, FR_CARGA, ETA_V_CARGA, F_BARR, T_WAL_MIN, T_WAL_MAX,
  T_SCAN_PASO, T_SCAN_TOPE, BISEC,
  ACEITES, GRADOS, DB, DM, NB, COSTE_DB, COSTE_DM, NMAX_DB, NMAX_DM,
  EJES, ESTACIONES, EST_KEYS, CRIT, CRIT_ROT, CRIT_POR,
  // --- motor de calculo ---
  nu, rho, mu, walther, extrapola, omega, parIdeal, caudalIdeal, sigma, tau,
  punto, desbalance, equilibrio, evalua, barrido, validas, mejor, solucion,
  empates, optimo, conEje, ejeValidos, ejeSolC, ejeSol, okEje, startCfg,
  muOptBomba, muOptMotor, omegaOptBomba, muOptSistema, etaDeMu, nuDeMu, f1,
  // --- estado vivo ---
  animT:()=>animT,
  setAnimT:v=>{animT=v;},
  hw:()=>({...hw}),
  cfg:()=>({...cfgDe(mode)}),
  cur:()=>CUR,
  solved:()=>solved,
  // --- un par por modo ---
  parGet:()=>({est:ST.par.est, dm:ST.par.dm}),
  parSet:(est,dm)=>{ if(est)ST.par.est=est; if(dm)ST.par.dm=Number(dm); afterEdit(); },
  relacionGet:()=>({est:ST.relacion.est, db:ST.relacion.db, nb:ST.relacion.nb}),
  relacionSet:(est,db,nb)=>{ if(est)ST.relacion.est=est; if(db)ST.relacion.db=Number(db);
    if(nb)ST.relacion.nb=Number(nb); afterEdit(); },
  rendGet:()=>({est:ST.rend.est, dm:ST.rend.dm, nb:ST.rend.nb}),
  rendSet:(est,dm,nb)=>{ if(est)ST.rend.est=est; if(dm)ST.rend.dm=Number(dm);
    if(nb)ST.rend.nb=Number(nb); afterEdit(); },
  aceiteGet:()=>({est:ST.aceite.est, vg:ST.aceite.vg, nb:ST.aceite.nb}),
  aceiteSet:(est,vg,nb)=>{ if(est)ST.aceite.est=est; if(vg)ST.aceite.vg=Number(vg);
    if(nb)ST.aceite.nb=Number(nb); afterEdit(); },
  // --- reto ---
  retoGet:()=>({est:ST.reto.est, ...RETO.cfg, resuelto:RETO.resuelto, msg:RETO.msg,
    nval:RETO.nval, sol:RETO.sol?{db:RETO.sol.db,dm:RETO.sol.dm,vg:RETO.sol.vg,
    nb:RETO.sol.nb,coste:RETO.sol.coste,kwh:RETO.sol.kwh}:null,
    ejes:{...RETO.ejes}}),
  retoSet:(db,dm,vg,nb)=>{
    if(db)RETO.cfg.db=Number(db); if(dm)RETO.cfg.dm=Number(dm);
    if(vg)RETO.cfg.vg=Number(vg); if(nb)RETO.cfg.nb=Number(nb);
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
