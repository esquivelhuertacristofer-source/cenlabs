// ===================== 1. ESCENA =====================
const mount=document.getElementById('stage');
const S=createStage(mount,{cam:[7.2,4.8,10.8],target:[0.95,1.35,0.10],bgTop:'#0d1017',bgBot:'#05060a',bloom:0.46,minD:3.2,maxD:30});
const {scene}=S;
const synth=makeSynth({type:'sine',type2:'triangle',filterFreq:880,Q:0.80});
const el=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:(v>b?b:v);

// ============================================================================
// MOTOR SELLADO — se copia tal cual desde el fichero de Capa 1, sin tocar una
// sola cifra. Lo unico que cambia es que se le quitan los `export`. Cualquier
// numero que aparezca en el pizarron, en la telemetria, en el informe o en el
// cuestionario sale de aqui: la interfaz no recalcula nada por su cuenta.
// ============================================================================
// ============================================================================
//  motor_otto.mjs — CAPA 1 · motor sellado del laboratorio d6-01
//  "Analiza el ciclo Otto y su eficiencia frente a la relacion de compresion"
//
//  Ciclo cerrado (IVC -> EVO) de una zona con:
//   - volumen de biela-manivela exacto
//   - gamma(T, x_b) por tabla de aire ideal + correlacion de gas quemado
//   - liberacion de calor de Wiebe con duracion escalada por velocidad de llama
//     laminar (Metghalchi-Keck) y dilucion por residuales
//   - transferencia de calor de Woschni
//   - autoencendido por Douaud-Eyzat integrado con Livengood-Wu
//   - friccion mecanica de Chen-Flynn y bombeo por diferencia admision-escape
//   - fraccion de residuales resuelta por iteracion de punto fijo
// ============================================================================

// ---------------------------------------------------------------- constantes
const R_GAS   = 287.0;      // J/(kg K)  — la mezcla se trata como aire
const P_ATM   = 101325;     // Pa
const CP_REF  = 1005;       // J/(kg K)  — cp para el balance de mezcla
const DEG     = Math.PI / 180;
const H_PASO  = 0.5;        // grados de cigueñal por paso
const TH_IVC  = -140;       // ° ATDC — cierre de admision
const TH_EVO  = 130;        // ° ATDC — apertura de escape
const A_WIEBE = 6.908;      // 99,9 % quemado en Δθ
const M_WIEBE = 2;
const C1_WOS  = 2.28;       // Woschni, periodo cerrado
const C2_WOS  = 3.24e-3;    // Woschni, combustion y expansion
const N_MOT   = 1.35;       // politropico de la presion de arrastre
const CU_TURB = 0.5;        // u' = CU_TURB * velocidad media del piston
const Q_DAMK  = 0.35;       // mezcla Damkohler  S_T = S_L^(1-q) * u'^q
const T_U_REF = 750;        // K   — estado de referencia de la llama
const P_U_REF = 25e5;       // Pa  — estado de referencia de la llama
const ETA_COMB= 0.97;       // combustion incompleta / intersticios
const CF_A    = 0.30;       // Chen-Flynn  [bar]
const CF_B    = 0.0080;     // Chen-Flynn  [bar/bar]
const CF_C    = 0.0350;     // Chen-Flynn  [bar/(m/s)]
const CF_D    = 0.00060;    // Chen-Flynn  [bar/(m/s)^2]
const XB_KNOCK= 0.90;       // fin efectivo de combustion para Livengood-Wu
const DE_A    = 17.68;      // Douaud-Eyzat  τ[ms]
const DE_N    = 3.402;
const DE_P    = -1.7;
const DE_B    = 3800;       // K
const K_TAU   = 1.60;       // anclaje declarado del prefactor de Douaud-Eyzat
const K_PORT  = 0.78;       // perdida en el conducto hasta la brida del colector
const ANIOS   = 5;

const R_G      = [8, 9, 10, 11, 12, 13, 14];
const AV_G     = [4, 10, 16, 22, 28, 34];
const LAM_G    = [0.85, 0.95, 1.00, 1.10, 1.25];

// ------------------------------------------------------------- combustibles
// MK: fila de Metghalchi-Keck  S_L0 = Bm + B2 (phi - phi_m)^2
const FUEL = {
  magna: {
    nom: 'Gasolina Magna', ron: 91, iad: 87, lhv: 43.4e6, afr: 14.6,
    hlv: 350e3, rho: 0.745, precio: 1.52,
    Bm: 0.305, phim: 1.21, B2: -0.549, alfa0: 2.18, beta0: -0.16,
  },
  premium: {
    nom: 'Gasolina Premium', ron: 96, iad: 92, lhv: 43.0e6, afr: 14.7,
    hlv: 350e3, rho: 0.750, precio: 1.68,
    Bm: 0.305, phim: 1.21, B2: -0.549, alfa0: 2.18, beta0: -0.16,
  },
  glp: {
    nom: 'Gas LP 60/40', ron: 105, iad: 103, lhv: 46.1e6, afr: 15.6,
    hlv: 0, rho: 0.540, precio: 0.88,
    Bm: 0.342, phim: 1.08, B2: -1.387, alfa0: 2.18, beta0: -0.16,
  },
  metanol: {
    nom: 'Metanol', ron: 109, iad: 104, lhv: 20.0e6, afr: 6.45,
    hlv: 1100e3, rho: 0.792, precio: 0.62,
    Bm: 0.369, phim: 1.11, B2: -1.405, alfa0: 2.18, beta0: -0.16,
  },
};

// ------------------------------------------------------------------ maquinas
const MAQ = {
  moto: {
    nom: 'Motocicleta 150 cm3', fuel: 'magna', iny: 'PFI', fevap: 0.20,
    B: 0.0573, S: 0.0578, L: 0.100, ncil: 1, rpm: 7500,
    pAdm: 95e3, Tadm: 310, Tpar: 430, pEscBase: 126e3,
    dth0: 42, rMax: 13, pLim: 72e5, tEscLim: 1100,
    bmepMin: 9.1, dthLim: 52, cat: false, lamMin: 0.85, lamMax: 1.10,
    horas: 320, wAnio: 1150,
  },
  sedan: {
    nom: 'Sedan 1.6 L MPI', fuel: 'magna', iny: 'PFI', fevap: 0.20,
    B: 0.0790, S: 0.0815, L: 0.137, ncil: 4, rpm: 4400,
    pAdm: 96e3, Tadm: 320, Tpar: 450, pEscBase: 116e3,
    dth0: 48, rMax: 12, pLim: 65e5, tEscLim: 1150,
    bmepMin: 9.8, dthLim: 55, cat: true, lamMin: 0.98, lamMax: 1.02,
    horas: 420, wAnio: 9800,
  },
  planta: {
    nom: 'Planta de gas LP 2.0 L', fuel: 'glp', iny: 'GAS', fevap: 1.00,
    B: 0.0950, S: 0.0950, L: 0.160, ncil: 3, rpm: 1800,
    pAdm: 98e3, Tadm: 305, Tpar: 440, pEscBase: 105e3,
    dth0: 55, rMax: 14, pLim: 72e5, tEscLim: 1040,
    bmepMin: 8.4, dthLim: 72, cat: false, lamMin: 0.90, lamMax: 1.25,
    horas: 4200, wAnio: 108000,
  },
  turbo: {
    nom: 'Turbo 1.4 L GDI', fuel: 'premium', iny: 'GDI', fevap: 0.60,
    B: 0.0745, S: 0.0800, L: 0.139, ncil: 4, rpm: 2800,
    pAdm: 145e3, Tadm: 300, Tpar: 460, pEscBase: 160e3,
    dth0: 45, rMax: 11, pLim: 105e5, tEscLim: 1165,
    bmepMin: 15.2, dthLim: 58, cat: true, lamMin: 0.98, lamMax: 1.02,
    horas: 380, wAnio: 8600,
  },
  compet: {
    nom: 'Competicion 1.0 L metanol', fuel: 'metanol', iny: 'PFI', fevap: 0.35,
    B: 0.0810, S: 0.0485, L: 0.105, ncil: 4, rpm: 9000,
    pAdm: 99e3, Tadm: 315, Tpar: 470, pEscBase: 122e3,
    dth0: 38, rMax: 14, pLim: 78e5, tEscLim: 1160,
    bmepMin: 10.6, dthLim: 52, cat: false, lamMin: 0.85, lamMax: 1.05,
    horas: 90, wAnio: 2400,
  },
};

const MAQ_KEYS = ['moto', 'sedan', 'planta', 'turbo', 'compet'];
const CRIT = ['okDeton', 'okPres', 'okEsc', 'okPar', 'okLam', 'okEstab', 'okPico'];

// ------------------------------------------------------- propiedades del gas
// cp del aire como gas ideal [J/(kg K)] — tabla de propiedades, 200..2500 K
const T_TAB = [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800,
  850, 900, 950, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900,
  2000, 2100, 2200, 2300, 2400, 2500];
const CP_TAB = [1002.5, 1003.4, 1004.9, 1008.2, 1014.0, 1020.7, 1029.5, 1039.2,
  1051.0, 1063.5, 1075.2, 1087.0, 1098.7, 1110.1, 1121.2, 1132.1, 1141.7,
  1160.0, 1176.0, 1190.0, 1202.0, 1212.0, 1220.0, 1229.0, 1237.0, 1244.0,
  1250.0, 1256.0, 1261.0, 1265.0, 1270.0, 1274.0];

function cpAire(T) {
  if (T <= T_TAB[0]) return CP_TAB[0];
  const n = T_TAB.length;
  if (T >= T_TAB[n - 1]) {
    const p = (CP_TAB[n - 1] - CP_TAB[n - 2]) / (T_TAB[n - 1] - T_TAB[n - 2]);
    return CP_TAB[n - 1] + p * (T - T_TAB[n - 1]);
  }
  let i = 0;
  while (T > T_TAB[i + 1]) i++;
  const f = (T - T_TAB[i]) / (T_TAB[i + 1] - T_TAB[i]);
  return CP_TAB[i] + f * (CP_TAB[i + 1] - CP_TAB[i]);
}
function gammaAire(T) { const cp = cpAire(T); return cp / (cp - R_GAS); }
// Brunt, Rai & Emtage (SAE 981052) para el gas quemado
function gammaQuem(T) { return 1.338 - 6.0e-5 * T + 1.0e-8 * T * T; }
function gamma(T, xb) {
  const g = (1 - xb) * gammaAire(T) + xb * gammaQuem(T);
  return g < 1.15 ? 1.15 : g;
}
// Nombre largo a proposito: el kit compartido del laboratorio ya tiene una
// funcion cv() que fabrica lienzos, y dos declaraciones del mismo nombre en el
// mismo modulo tumban la pagina entera antes de dibujar nada.
function cvGas(T, xb) { return R_GAS / (gamma(T, xb) - 1); }

// ------------------------------------------------------------------ geometria
function geom(P, r) {
  const Ap = Math.PI / 4 * P.B * P.B;
  const Vd = Ap * P.S;
  return { Ap, Vd, Vc: Vd / (r - 1), a: P.S / 2, L: P.L };
}
function vol(G, th) {
  const st = Math.sin(th);
  const s = Math.sqrt(G.L * G.L - G.a * G.a * st * st);
  return G.Vc + G.Ap * (G.L + G.a - G.a * Math.cos(th) - s);
}
function dvol(G, th) {
  const st = Math.sin(th), ct = Math.cos(th);
  const s = Math.sqrt(G.L * G.L - G.a * G.a * st * st);
  return G.Ap * G.a * (st + G.a * st * ct / s);
}
function area(G, V, B) { return Math.PI * B * B / 2 + 4 * V / B; }

// ---------------------------------------------------- velocidad de llama (MK)
function sLam(F, lam, T, p, fdil) {
  const phi = 1 / lam;
  let s0 = F.Bm + F.B2 * (phi - F.phim) * (phi - F.phim);
  if (s0 < 0.02) s0 = 0.02;
  const alfa = F.alfa0 - 0.8 * (phi - 1);
  const beta = F.beta0 + 0.22 * (phi - 1);
  const d = 1 - 2.1 * fdil;
  const s = s0 * Math.pow(T / 298, alfa) * Math.pow(p / P_ATM, beta) * (d > 0.05 ? d : 0.05);
  return s < 0.02 ? 0.02 : s;
}

// --------------------------------------------------------------------- Wiebe
function wiebe(th, ths, dth) {
  if (th <= ths) return 0;
  const y = (th - ths) / dth;
  if (y >= 1) return 1;
  return 1 - Math.exp(-A_WIEBE * Math.pow(y, M_WIEBE + 1));
}
function dwiebe(th, ths, dth) {
  if (th <= ths || th >= ths + dth) return 0;
  const y = (th - ths) / dth;
  return A_WIEBE * (M_WIEBE + 1) / dth * Math.pow(y, M_WIEBE)
       * Math.exp(-A_WIEBE * Math.pow(y, M_WIEBE + 1));
}

// ------------------------------------------------ retardo de autoencendido
function tauDE(F, p, T) {
  const patm = p / P_ATM;
  return K_TAU * DE_A * Math.pow(F.ron / 100, DE_N) * Math.pow(patm, DE_P)
       * Math.exp(DE_B / T);   // ms
}

// ============================================================== simulacion
function sim(mk, r, avance, lam, opts) {
  const o = opts || {};
  const P = MAQ[mk], F = FUEL[P.fuel];
  const G = geom(P, r);
  const w = P.rpm * 2 * Math.PI / 60;
  const Sp = 2 * P.S * P.rpm / 60;
  const uPrim = CU_TURB * Sp;
  const ths = -avance;                       // ° ATDC del salto de chispa
  const Vivc = vol(G, TH_IVC * DEG);
  const rEf = Vivc / G.Vc;
  const pEsc = P.pEscBase;
  const guardar = !!o.traza;
  const h = (o.paso || H_PASO);

  // velocidad de llama de referencia (lam = 1, sin dilucion)
  const sRef = sLam(F, 1, T_U_REF, P_U_REF, 0);

  let Texh = 1000, out = null;
  for (let it = 0; it < 8; it++) {
    // ---- mezcla en el cierre de admision -------------------------------
    const mRes = pEsc * G.Vc / (R_GAS * Texh);
    const Tfresco = P.Tadm;
    let Tivc = Tfresco + 40, mTot = 0, mFres = 0;
    for (let k = 0; k < 40; k++) {
      mTot = P.pAdm * Vivc / (R_GAS * Tivc);
      mFres = mTot - mRes;
      if (mFres < 1e-9) mFres = 1e-9;
      Tivc = (mFres * Tfresco + mRes * Texh) / (mFres + mRes);
    }
    const fRes = mRes / mTot;
    // aire y combustible
    const fDesp = (P.iny === 'GDI') ? 0 : P.fevap;   // vapor presente en el IVC
    const mAire = mFres / (1 + fDesp / (lam * F.afr));
    const mComb = mAire / (lam * F.afr);
    // enfriamiento por evaporacion (en PFI enfria la carga en el conducto,
    // en GDI dentro del cilindro; en ambos casos baja la T atrapada)
    const dTev = P.fevap * mComb * F.hlv / (mTot * CP_REF);
    const T0 = Tivc - dTev;
    const etaC = ETA_COMB * (lam < 1 ? lam : 1);
    const Q = mComb * F.lhv * etaC;

    // ---- duracion de combustion ----------------------------------------
    // estado sin quemar en la chispa por compresion politropica
    const Vs = vol(G, ths * DEG);
    const pS = P.pAdm * Math.pow(Vivc / Vs, N_MOT);
    const gU = gammaAire(T0 * 1.15);
    const Ts = T0 * Math.pow(pS / P.pAdm, (gU - 1) / gU);
    const sAct = sLam(F, lam, Ts, pS, fRes);
    const sT_r = Math.pow(sRef, 1 - Q_DAMK) * Math.pow(uPrim, Q_DAMK);
    const sT_a = Math.pow(sAct, 1 - Q_DAMK) * Math.pow(uPrim, Q_DAMK);
    let dth = P.dth0 * sT_r / sT_a;
    if (dth > 200) dth = 200;

    // ---- integracion del ciclo cerrado ---------------------------------
    const N = Math.round((TH_EVO - TH_IVC) / h);
    let T = T0, Wg = 0, Ilw = 0, pmax = 0, thPmax = 0, Tmax = 0, Qht = 0;
    let pPrev = P.pAdm, Vprev = Vivc, tPrev = TH_IVC;
    const tz = guardar ? { th: [], V: [], p: [], T: [], xb: [], Tu: [], I: [] } : null;

    const dTdth = (th, T, xb) => {
      const V = vol(G, th * DEG), dV = dvol(G, th * DEG);
      const m = mTot;
      const p = m * R_GAS * T / V;
      const dQc = Q * dwiebe(th, ths, dth) ;
      // Woschni
      const pMot = P.pAdm * Math.pow(Vivc / V, N_MOT);
      const c2 = (th > ths) ? C2_WOS : 0;
      const wg = C1_WOS * Sp + c2 * (G.Vd * T0 / (P.pAdm * Vivc)) * (p - pMot);
      const wg2 = wg > 0.5 ? wg : 0.5;
      const hc = 3.26 * Math.pow(P.B, -0.2) * Math.pow(p / 1000, 0.8)
               * Math.pow(T, -0.55) * Math.pow(wg2, 0.8);
      const dQh = hc * area(G, V, P.B) * (T - P.Tpar) / w;   // J/rad
      const dQh_deg = dQh * DEG;                              // J/grado
      return { d: (dQc - dQh_deg - p * dV * DEG) / (m * cvGas(T, xb)), p, V, dQh_deg };
    };

    for (let i = 0; i <= N; i++) {
      const th = TH_IVC + i * h;
      const xb = wiebe(th, ths, dth);
      const V = vol(G, th * DEG);
      const p = mTot * R_GAS * T / V;
      if (p > pmax) { pmax = p; thPmax = th; }
      if (T > Tmax) Tmax = T;
      // trabajo (trapecio)
      if (i > 0) Wg += 0.5 * (p + pPrev) * (V - Vprev);
      // gas sin quemar y Livengood-Wu
      let gu = gammaAire(T0), Tu = T0;
      for (let k = 0; k < 3; k++) {
        Tu = T0 * Math.pow(p / P.pAdm, (gu - 1) / gu);
        gu = gammaAire(0.5 * (T0 + Tu));
      }
      if (xb < XB_KNOCK && th > TH_IVC) {
        const dt = h / (6 * P.rpm);              // s por paso
        Ilw += dt * 1000 / tauDE(F, p, Tu);
      }
      if (guardar && (i % Math.max(1, Math.round(2 / h)) === 0)) {
        tz.th.push(th); tz.V.push(V); tz.p.push(p); tz.T.push(T);
        tz.xb.push(xb); tz.Tu.push(Tu); tz.I.push(Ilw);
      }
      pPrev = p; Vprev = V; tPrev = th;
      if (i === N) break;
      // RK4 en T
      const k1 = dTdth(th, T, xb);
      const k2 = dTdth(th + h / 2, T + h / 2 * k1.d, wiebe(th + h / 2, ths, dth));
      const k3 = dTdth(th + h / 2, T + h / 2 * k2.d, wiebe(th + h / 2, ths, dth));
      const k4 = dTdth(th + h, T + h * k3.d, wiebe(th + h, ths, dth));
      Qht += (k1.dQh_deg + 2 * k2.dQh_deg + 2 * k3.dQh_deg + k4.dQh_deg) / 6 * h;
      T = T + h / 6 * (k1.d + 2 * k2.d + 2 * k3.d + k4.d);
      if (T < 200) T = 200;
      if (T > 4000) T = 4000;
    }

    const Vevo = vol(G, TH_EVO * DEG);
    const pEvo = mTot * R_GAS * T / Vevo;
    const Tevo = T;
    const gE = gamma(Tevo, 1);
    const TexhNew = Tevo * Math.pow(pEsc / pEvo, (gE - 1) / gE);
    // la sonda va en la brida del colector: el conducto ya cedio calor
    const Tbrida = P.Tpar + (TexhNew - P.Tpar) * K_PORT;

    // ---- indicadores ----------------------------------------------------
    const imepG = Wg / G.Vd / 1e5;                 // bar
    const pmep = (pEsc - P.pAdm) / 1e5;            // bar
    const imepN = imepG - pmep;
    const fmep = CF_A + CF_B * (pmax / 1e5) + CF_C * Sp + CF_D * Sp * Sp;
    const bmep = imepN - fmep;
    const par = bmep * 1e5 * G.Vd * P.ncil / (4 * Math.PI);
    const pot = par * w;
    const etaI = imepG * 1e5 * G.Vd / (mComb * F.lhv);
    const etaB = bmep * 1e5 * G.Vd / (mComb * F.lhv);
    const bsfc = etaB > 0 ? 3.6e9 / (etaB * F.lhv) : Infinity;
    const etaOtto = 1 - Math.pow(r, -0.4);
    const etaOttoEf = 1 - Math.pow(rEf, -0.4);
    const rhoAdm = P.pAdm / (R_GAS * P.Tadm);
    const etaV = mAire / (rhoAdm * G.Vd);
    const coste5 = etaB > 0
      ? ANIOS * P.wAnio * 3.6e6 / (etaB * F.lhv) / F.rho * F.precio
      : Infinity;

    out = {
      r, avance, lam, rEf, dth, fRes, dTev, mAire, mComb, Q, Tivc: T0,
      imepG, pmep, imepN, fmep, bmep, par, pot, etaI, etaB, bsfc,
      etaOtto, etaOttoEf, etaV, pmax, thPmax, Tmax, Tevo, Ilw, Qht,
      Qfrac: Qht / Q, coste5, Texh: TexhNew, Tbrida, sT: sT_a, sL: sAct, Ts, pS,
      traza: tz, mTot, Sp, Vd: G.Vd, Vc: G.Vc, Vivc,
    };
    if (Math.abs(TexhNew - Texh) < 0.05) { Texh = TexhNew; break; }
    Texh = TexhNew;
  }
  // ---- pliego -----------------------------------------------------------
  const P2 = MAQ[mk];
  out.okDeton = out.Ilw < 1;
  out.okPres  = out.pmax <= P2.pLim;
  out.okEsc   = out.Tbrida <= P2.tEscLim;
  out.okPar   = out.bmep >= P2.bmepMin;
  out.okLam   = lam >= P2.lamMin - 1e-9 && lam <= P2.lamMax + 1e-9;
  out.okEstab = out.dth <= P2.dthLim;
  out.okPico  = out.thPmax >= 5 && out.thPmax <= 25;
  out.rMecOk  = r <= P2.rMax;
  out.valida  = CRIT.every(k => out[k]) && out.rMecOk;
  return out;
}

// ============================================================== barrido
function barrido(mk) {
  const res = [];
  for (const r of R_G) for (const av of AV_G) for (const lam of LAM_G) {
    res.push(sim(mk, r, av, lam));
  }
  return res;
}
function validas(mk) { return barrido(mk).filter(s => s.valida); }

function solucion(mk) {
  const v = validas(mk);
  if (!v.length) return null;
  v.sort((a, b) => (a.coste5 - b.coste5) || (a.pmax - b.pmax) || (a.avance - b.avance));
  return v[0];
}

function censo(mk) {
  const b = barrido(mk).filter(s => s.rMecOk);
  const tot = {}, solo = {};
  for (const k of CRIT) { tot[k] = 0; solo[k] = 0; }
  let val = 0;
  for (const s of b) {
    const fallan = CRIT.filter(k => !s[k]);
    if (!fallan.length) { val++; continue; }
    for (const k of fallan) tot[k]++;
    if (fallan.length === 1) solo[fallan[0]]++;
  }
  return { n: b.length, validas: val, tot, solo };
}

// ------------------------------------------------------------------- pistas
function pistas(mk) {
  const v = validas(mk);
  if (!v.length) return [];
  const s = solucion(mk);
  const out = [];
  let c = v.slice();
  c = c.filter(x => x.r === s.r);
  out.push({ txt: 'relacion de compresion', v: s.r, n: c.length });
  c = c.filter(x => x.lam === s.lam);
  out.push({ txt: 'mezcla', v: s.lam, n: c.length });
  c = c.filter(x => x.avance === s.avance);
  out.push({ txt: 'avance', v: s.avance, n: c.length });
  return out;
}

// ---- formato ----
// Separador de millares en espacio fino (U+202F) y coma decimal; el signo menos
// es U+2212. Nunca toLocaleString: el locale del navegador no se controla.
const NBSP=' ';
const sepMil=s=>s.replace(/\B(?=(\d{3})+(?!\d))/g,NBSP);
function fN(x,n){
  if(!isFinite(x)) return '∞';
  const neg=x<0||Object.is(x,-0);
  const a=Math.abs(x).toFixed(n);
  const [e,d]=a.split('.');
  return (neg?'−':'')+sepMil(e)+(d?','+d:'');
}
const f0=x=>fN(x,0), f1=x=>fN(x,1), f2=x=>fN(x,2), f3=x=>fN(x,3), f4=x=>fN(x,4);
const pc1=x=>fN(100*x,1)+NBSP+'%';
const pcm=x=>Number.isFinite(x)?((x>=0?'+':'')+pc1(x)):'—';
const fin=(x,n)=>Number.isFinite(x)?fN(x,n===undefined?1:n):'∞';
const bar=p=>fN(p/1e5,1);            // Pa  → bar
const cm3=v=>fN(v*1e6,1);            // m³  → cm³
const gra=t=>fN(t,0)+'°';            // grados de cigüeñal

// ===================== 3. ESTADO =====================
const MODES=['ciclo','compresion','mezcla','censo','reto'];
let mode='ciclo', animT=0, autoRunning=false, solved=false;
// Se arranca en el sedán con la compresión más floja de la rejilla: el ciclo
// completo se ve, pero la eficiencia todavía tiene mucho margen por arriba.
const ST={ mk:'sedan', r:8, av:16, lam:1.00 };
const RETO={ cfg:{mk:'sedan'}, ejes:{r:R_G[0], lam:LAM_G[0], avance:AV_G[0]},
             sol:null, nval:0, resuelto:false, msg:'',
             pistas:{r:false,lam:false,avance:false} };
let CUR=null;

const ICONO={moto:'🏍️',sedan:'🚗',planta:'🏭',turbo:'🌀',compet:'🏁'};
const ROT={moto:'Moto 150',sedan:'Sedán 1.6',planta:'Planta LP',turbo:'Turbo GDI',compet:'Metanol'};

function cfgDe(m){
  if(m==='reto') return {mk:RETO.cfg.mk, r:RETO.ejes.r, av:RETO.ejes.avance, lam:RETO.ejes.lam};
  return {mk:ST.mk, r:ST.r, av:ST.av, lam:ST.lam};
}
// La traza son 136 fotogramas con siete señales: se memoriza por configuración.
const _traz={};
function simT(c){
  const k=c.mk+'|'+c.r+'|'+c.av+'|'+c.lam;
  if(_traz[k]) return _traz[k];
  return (_traz[k]=sim(c.mk,c.r,c.av,c.lam,{traza:true}));
}
function computa(){ const c=cfgDe(mode); CUR=simT(c); return CUR; }

// Cachés de los agregados: el barrido de una máquina son hasta 210 ciclos.
const CENSO_C={}, SOL_C={}, VAL_C={}, EMP_C={}, PIS_C={}, SWR_C={}, SWL_C={};
function censoM(mk){ if(!CENSO_C[mk]) CENSO_C[mk]=censo(mk); return CENSO_C[mk]; }
function solM(mk){ if(!(mk in SOL_C)) SOL_C[mk]=solucion(mk); return SOL_C[mk]; }
function valM(mk){ if(!VAL_C[mk]) VAL_C[mk]=validas(mk); return VAL_C[mk]; }
function empates(mk){ const s=solM(mk); if(!s) return [];
  return valM(mk).filter(x=>Math.abs(x.coste5-s.coste5)<1e-6); }
function empM(mk){ if(!EMP_C[mk]) EMP_C[mk]=empates(mk); return EMP_C[mk]; }
// El embudo del reto: pistas() devuelve el orden r → λ → avance; aquí se le pone
// el nombre del eje encima para que el botón sepa cuál le toca destapar.
const PIS_EJE=['r','lam','avance'];
const EJE_ROT={r:'relación de compresión',lam:'dosado relativo λ',avance:'avance de encendido'};
function pistasEje(mk){
  return pistas(mk).map((p,i)=>({eje:PIS_EJE[i], rot:EJE_ROT[PIS_EJE[i]], v:p.v, n:p.n}));
}
function pisM(mk){ if(!PIS_C[mk]) PIS_C[mk]=pistasEje(mk); return PIS_C[mk]; }
// Barridos de una sola variable con las otras dos congeladas: son las dos vistas
// de estudio, y cada una vale un barrido completo de siete u ocho ciclos.
function sweepR(mk,av,lam){ const k=mk+'|'+av+'|'+lam;
  if(!SWR_C[k]) SWR_C[k]=R_G.map(r=>sim(mk,r,av,lam)); return SWR_C[k]; }
function sweepL(mk,r,av){ const k=mk+'|'+r+'|'+av;
  if(!SWL_C[k]) SWL_C[k]=LAM_G.map(l=>sim(mk,r,av,l)); return SWL_C[k]; }
const maqAct=()=>MAQ[cfgDe(mode).mk];
const fallosDe=r=>CRIT.filter(c=>!r[c]);
// Rejilla total y rejilla mecánicamente admisible: la segunda es la que se barre.
const NPTS=MAQ_KEYS.length*R_G.length*AV_G.length*LAM_G.length;
const NMEC=MAQ_KEYS.reduce((s,k)=>s+R_G.filter(r=>r<=MAQ[k].rMax).length*AV_G.length*LAM_G.length,0);
// Ninguna máquina puede pasar de su relación de compresión mecánica: al cambiar
// de motor se recorta la selección en vez de dejarla en un valor imposible.
function aplicaMaquina(){
  const P=MAQ[ST.mk];
  if(ST.r>P.rMax) ST.r=R_G.filter(r=>r<=P.rMax).slice(-1)[0];
}

// ===================== 4. MATERIALES =====================
const AZUL='#8AB4F8', OK_HEX='#7CD992', BAD_HEX='#ff6b6b', WARN_HEX='#E9C46A',
      VIO='#C08CF8', GRIS='#8f97a5', NARANJA='#F2A65A', CIAN='#5BD4E5', TINTA='#dbe4f0',
      AMBAR='#E0A33E';
const std=(c,r,m)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const emis=(hex,i)=>new THREE.MeshStandardMaterial({color:hex,roughness:0.35,metalness:0.10,emissive:hex,emissiveIntensity:i===undefined?0.9:i});
const MAT={
  acero:  std('#7e8798',0.42,0.72),
  aceroC: std('#5a6270',0.50,0.65),
  bancada:std('#2a3140',0.85,0.10),
  bloque: std('#39424f',0.66,0.22),
  culata: std('#4a5361',0.58,0.30),
  aluminio:std('#b9c2ce',0.28,0.86),
  piston: std('#cfd6e0',0.22,0.90),
  aro:    std('#3c4452',0.60,0.40),
  camisa: new THREE.MeshStandardMaterial({color:'#cfe0f5',roughness:0.12,metalness:0.05,transparent:true,opacity:0.20,side:THREE.DoubleSide}),
  oro:    std('#c9a227',0.35,0.85),
  rojo:   emis(BAD_HEX,0.85),
  verde:  emis(OK_HEX,0.85),
  ambar:  emis(WARN_HEX,0.85),
  cian:   emis(CIAN,0.85),
  azul:   emis(AZUL,0.80),
  violeta:emis(VIO,0.80),
  negro:  std('#161b25',0.90,0.05),
  cristal:new THREE.MeshStandardMaterial({color:'#dfe8f5',roughness:0.10,metalness:0.05,transparent:true,opacity:0.35}),
};

// ===================== 5. PIZARRÓN =====================
const board=new THREE.Group();
board.position.set(-4.15,0,-0.95); board.rotation.y=0.40; scene.add(board);
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

function bg(){ bx.fillStyle='#080b11'; bx.fillRect(0,0,BW,BH);
  bx.strokeStyle='rgba(138,180,248,0.06)'; bx.lineWidth=1;
  for(let x=0;x<=BW;x+=64){ bx.beginPath(); bx.moveTo(x+0.5,0); bx.lineTo(x+0.5,BH); bx.stroke(); }
  for(let y=0;y<=BH;y+=64){ bx.beginPath(); bx.moveTo(0,y+0.5); bx.lineTo(BW,y+0.5); bx.stroke(); } }
function texto(t,x,y,col,size,align,weight){
  bx.fillStyle=col||'#dbe4f0';
  bx.font=(weight||'600')+' '+(size||18)+'px ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif';
  bx.textAlign=align||'left'; bx.textBaseline='alphabetic';
  bx.fillText(t,x,y); bx.textAlign='left'; }
function linea(x1,y1,x2,y2,col,w,dash){
  bx.strokeStyle=col||'#2b3446'; bx.lineWidth=w||1.5;
  bx.setLineDash(dash||[]); bx.beginPath(); bx.moveTo(x1,y1); bx.lineTo(x2,y2); bx.stroke();
  bx.setLineDash([]); }
function curva(pts,col,w,dash){ if(!pts.length) return;
  bx.strokeStyle=col||AZUL; bx.lineWidth=w||2; bx.setLineDash(dash||[]);
  bx.beginPath(); bx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<pts.length;i++) bx.lineTo(pts[i][0],pts[i][1]);
  bx.stroke(); bx.setLineDash([]); }
function wrapText(t,x,y,maxW,lh,col,size){
  bx.fillStyle=col||'#8f9bb0';
  bx.font='500 '+(size||14)+'px ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif';
  const pal=String(t).split(' '); let ln='', yy=y;
  for(const p of pal){ const pr=ln?ln+' '+p:p;
    if(bx.measureText(pr).width>maxW && ln){ bx.fillText(ln,x,yy); ln=p; yy+=(lh||18); }
    else ln=pr; }
  if(ln) bx.fillText(ln,x,yy); return yy; }
const PX={x:706,y:70,w:300};
function rpanel(h){ bx.fillStyle='rgba(13,18,26,0.92)'; bx.strokeStyle='rgba(138,180,248,0.22)';
  bx.lineWidth=1.5; bx.beginPath(); bx.roundRect(PX.x,PX.y,PX.w,h,12); bx.fill(); bx.stroke(); }
function prow(y,k,v,col){ texto(k,PX.x+14,y,'#8f9bb0',14,'left','500');
  texto(v,PX.x+PX.w-14,y,col||'#dbe4f0',15,'right','700'); }
function title2(t,sub){ texto(t,44,52,'#eaf1fb',26,'left','800');
  if(sub) texto(sub,44,78,'#8f9bb0',15,'left','500'); }
function nota(t,y){ wrapText(t,44,y,620,19,'#8f9bb0',14); }
function hbar(x,y,w,h,frac,col,bgc){ bx.fillStyle=bgc||'rgba(255,255,255,0.06)';
  bx.beginPath(); bx.roundRect(x,y,w,h,h/2); bx.fill();
  const f=Math.max(0,Math.min(1,frac));
  if(f>0){ bx.fillStyle=col||AZUL; bx.beginPath(); bx.roundRect(x,y,Math.max(h,w*f),h,h/2); bx.fill(); } }
function marca(x,y,ok){ bx.strokeStyle=ok?OK_HEX:BAD_HEX; bx.lineWidth=2.4; bx.beginPath();
  if(ok){ bx.moveTo(x-6,y); bx.lineTo(x-2,y+5); bx.lineTo(x+7,y-6); }
  else  { bx.moveTo(x-5,y-5); bx.lineTo(x+6,y+6); bx.moveTo(x+6,y-5); bx.lineTo(x-5,y+6); }
  bx.stroke(); }
const colOk=b=>b?OK_HEX:BAD_HEX;
function tabla(x,y,cols,rows,anchos,colFn){ let yy=y;
  cols.forEach((c,i)=>texto(c,x+anchos.slice(0,i).reduce((a,b)=>a+b,0),yy,'#7f8b9c',13,'left','700'));
  yy+=8; linea(x,yy,x+anchos.reduce((a,b)=>a+b,0)-10,yy,'#243043',1); yy+=18;
  rows.forEach((r,ri)=>{ r.forEach((c,ci)=>texto(c,x+anchos.slice(0,ci).reduce((a,b)=>a+b,0),yy,
      (colFn&&colFn(ri,ci))||'#c8d3e2',14,'left','600')); yy+=22; });
  return yy; }

// ===================== 6. PRIMITIVAS DE GRÁFICA =====================
function ejes(P,xmin,xmax,ymin,ymax,rotX,rotY,fmtX,fmtY,nx,ny){
  const NX=nx||6, NY=ny||5;
  bx.fillStyle='rgba(10,14,20,0.72)';
  bx.beginPath(); bx.roundRect(P.x-52,P.y-18,P.w+72,P.h+72,10); bx.fill();
  bx.strokeStyle='rgba(138,180,248,0.10)'; bx.lineWidth=1;
  for(let i=0;i<=NX;i++){ const x=P.x+P.w*i/NX; bx.beginPath(); bx.moveTo(x,P.y); bx.lineTo(x,P.y+P.h); bx.stroke(); }
  for(let i=0;i<=NY;i++){ const y=P.y+P.h*i/NY; bx.beginPath(); bx.moveTo(P.x,y); bx.lineTo(P.x+P.w,y); bx.stroke(); }
  linea(P.x,P.y+P.h,P.x+P.w,P.y+P.h,'#3a465c',1.5);
  linea(P.x,P.y,P.x,P.y+P.h,'#3a465c',1.5);
  for(let i=0;i<=NX;i++){ const v=xmin+(xmax-xmin)*i/NX;
    texto(fmtX?fmtX(v):fN(v,1),P.x+P.w*i/NX,P.y+P.h+20,'#7f8b9c',12,'center','600'); }
  for(let i=0;i<=NY;i++){ const v=ymin+(ymax-ymin)*(NY-i)/NY;
    texto(fmtY?fmtY(v):fN(v,1),P.x-8,P.y+P.h*i/NY+4,'#7f8b9c',12,'right','600'); }
  if(rotX) texto(rotX,P.x+P.w/2,P.y+P.h+44,'#8f9bb0',13,'center','700');
  if(rotY){ bx.save(); bx.translate(P.x-42,P.y+P.h/2); bx.rotate(-Math.PI/2);
    texto(rotY,0,0,'#8f9bb0',13,'center','700'); bx.restore(); }
  return { X:v=>P.x+P.w*(v-xmin)/(xmax-xmin), Y:v=>P.y+P.h-P.h*(v-ymin)/(ymax-ymin) }; }
function punteo(x,y,col,r){ bx.fillStyle=col||AZUL; bx.beginPath(); bx.arc(x,y,r||5,0,Math.PI*2);
  bx.fill(); bx.strokeStyle='#080b11'; bx.lineWidth=1.5; bx.stroke(); }
function anillo(x,y,col,r){ bx.strokeStyle=col||'#eaf1fb'; bx.lineWidth=2.2;
  bx.beginPath(); bx.arc(x,y,r||9,0,Math.PI*2); bx.stroke(); }
function banda(A,x1,x2,y1,y2,col){ bx.fillStyle=col;
  bx.fillRect(A.X(x1),A.Y(y2),A.X(x2)-A.X(x1),A.Y(y1)-A.Y(y2)); }
function leyenda(x,y,items){ let xx=x;
  items.forEach(it=>{ linea(xx,y-5,xx+22,y-5,it[1],3,it[2]||[]);
    texto(it[0],xx+28,y,'#a9b6c8',13,'left','600');
    xx += 28 + bx.measureText(it[0]).width + 22; }); }
// Traza del ciclo contra el ángulo de cigüeñal.
function serieTh(A,tr,campo,esc){
  const pts=[]; const k=esc===undefined?1:esc;
  for(let i=0;i<tr.th.length;i++) pts.push([A.X(tr.th[i]),A.Y(tr[campo][i]*k)]);
  return pts; }
// Traza del ciclo en el plano p–V: volumen en cm³, presión en bar.
function seriePV(A,tr){
  const pts=[];
  for(let i=0;i<tr.V.length;i++) pts.push([A.X(tr.V[i]*1e6),A.Y(tr.p[i]/1e5)]);
  return pts; }
// Serie de un barrido (una lista de ciclos ya resueltos) contra el eje elegido.
function serieBar(A,arr,ejeX,fnY){
  return arr.map(s=>[A.X(s[ejeX]),A.Y(fnY(s))]); }

// ===================== 7. VISTAS DEL PIZARRÓN =====================
// Las siete filas del pliego con el valor medido y el límite al lado. Es la
// única fuente del veredicto: la vista, el informe y el reto leen de aquí.
// Un solo sitio para el nombre de cada criterio: el largo para las vistas y el
// informe, el corto para las tablas apretadas del censo.
const CRIT_ROT={okDeton:'sin detonación',okPres:'presión máxima',okEsc:'temperatura de escape',
  okPar:'par entregado',okLam:'ventana de mezcla',okEstab:'estabilidad de combustión',
  okPico:'posición del pico'};
const CRIT_COR={okDeton:'detonación',okPres:'presión',okEsc:'escape',okPar:'par',
  okLam:'mezcla',okEstab:'estabilidad',okPico:'pico'};
function pliegoFilas(mk,s){
  const P=MAQ[mk];
  return [
    ['okDeton','I = '+f3(s.Ilw),'< 1'],
    ['okPres',f1(s.pmax/1e5)+' bar','≤ '+f0(P.pLim/1e5)+' bar'],
    ['okEsc',f0(s.Tbrida)+' K','≤ '+f0(P.tEscLim)+' K'],
    ['okPar',f2(s.bmep)+' bar','≥ '+f1(P.bmepMin)+' bar'],
    ['okLam','λ = '+f2(s.lam),f2(P.lamMin)+'–'+f2(P.lamMax)],
    ['okEstab',f1(s.dth)+'°','≤ '+f0(P.dthLim)+'°'],
    ['okPico',f1(s.thPmax)+'°','5–25°'],
  ].map(f=>[f[0],CRIT_ROT[f[0]],f[1],f[2],s[f[0]]]);
}
// Cursor de filas del panel derecho: evita cuadrar a mano decenas de coordenadas.
function pcur(y0,paso){ let y=y0; const p=paso||25;
  return { row:(k,v,col)=>{ prow(y,k,v,col); y+=p; },
           sep:()=>{ linea(PX.x+14,y-9,PX.x+PX.w-14,y-9,'#243043',1); y+=8; },
           nota:(t)=>{ y=wrapText(t,PX.x+14,y,PX.w-28,16,'#7f8b9c',12)+p; },
           y:()=>y }; }

// ---- 7.1 el ciclo cerrado ----
function vistaCiclo(){
  const c=cfgDe(mode), P=MAQ[c.mk], F=FUEL[P.fuel], s=CUR, tr=s.traza;
  title2('El ciclo cerrado, del cierre de admisión a la apertura de escape',
    ICONO[c.mk]+' '+P.nom+' · r = '+f0(c.r)+' · avance '+f0(c.av)+'° antes del PMS · λ = '+
    f2(c.lam)+' · '+F.nom+' · '+f0(P.rpm)+' min⁻¹');

  // --- p–V: ciclo real contra ciclo ideal de aire frío con el MISMO calor ---
  const Vmax=Math.ceil(s.Vivc*1e6/50)*50;
  const yT=Math.max(20,Math.ceil(s.pmax/1e5/10)*10+10);
  const A=ejes({x:110,y:112,w:520,h:236},0,Vmax,0,yT,
    'volumen del cilindro (cm³)','presión (bar)',v=>f0(v),v=>f0(v),6,5);
  const p1=s.mTot*R_GAS*s.Tivc/s.Vivc, rEf=s.rEf;
  const T2=s.Tivc*Math.pow(rEf,0.4), p2=p1*Math.pow(rEf,1.4);
  const T3=T2+s.Q/(s.mTot*(R_GAS/0.4)), p3=p2*T3/T2;
  const ideal=[];
  for(let i=0;i<=40;i++){ const V=s.Vivc+(s.Vc-s.Vivc)*i/40;
    ideal.push([A.X(V*1e6),A.Y(p1*Math.pow(s.Vivc/V,1.4)/1e5)]); }
  ideal.push([A.X(s.Vc*1e6),A.Y(p3/1e5)]);
  for(let i=0;i<=40;i++){ const V=s.Vc+(s.Vivc-s.Vc)*i/40;
    ideal.push([A.X(V*1e6),A.Y(p3*Math.pow(s.Vc/V,1.4)/1e5)]); }
  ideal.push([A.X(s.Vivc*1e6),A.Y(p1/1e5)]);
  curva(ideal,'#6d7789',2,[6,5]);
  curva(seriePV(A,tr),AZUL,3);
  const fr=clamp(FR,0,tr.th.length-1);
  punteo(A.X(tr.V[fr]*1e6),A.Y(tr.p[fr]/1e5),AMBAR,6);
  texto('PMS',A.X(s.Vc*1e6)+6,A.Y(0)-6,'#7f8b9c',12,'left','700');
  leyenda(114,376,[['ciclo real (motor sellado)',AZUL],
                   ['ciclo ideal de aire frío, γ = 1,4, mismo calor','#6d7789',[6,5]]]);

  // --- fracción quemada y reloj de la detonación ---
  const B=ejes({x:110,y:452,w:520,h:172},TH_IVC,TH_EVO,0,1.25,
    'ángulo de cigüeñal (° respecto al PMS)','x_b · I',v=>f0(v)+'°',v=>f2(v),6,5);
  banda(B,TH_IVC,TH_EVO,1,1.25,'rgba(255,107,107,0.10)');
  linea(B.X(TH_IVC),B.Y(1),B.X(TH_EVO),B.Y(1),BAD_HEX,1.6,[6,5]);
  linea(B.X(0),B.Y(0),B.X(0),B.Y(1.25),'#3a465c',1.4,[3,4]);
  linea(B.X(-c.av),B.Y(0),B.X(-c.av),B.Y(1.25),WARN_HEX,1.6,[4,4]);
  linea(B.X(s.thPmax),B.Y(0),B.X(s.thPmax),B.Y(1.25),CIAN,1.4,[2,4]);
  curva(serieTh(B,tr,'xb'),NARANJA,3);
  curva(serieTh(B,tr,'I'),BAD_HEX,2.4);
  punteo(B.X(tr.th[fr]),B.Y(clamp(tr.xb[fr],0,1.25)),AMBAR,5);
  texto('chispa',B.X(-c.av)+5,468,WARN_HEX,12,'left','700');
  texto('PMS',B.X(0)+5,468,'#7f8b9c',12,'left','700');
  texto('p máx',B.X(s.thPmax)+5,486,CIAN,12,'left','700');
  leyenda(114,652,[['fracción de masa quemada x_b',NARANJA],
                   ['integral de autoencendido I (Livengood–Wu)',BAD_HEX]]);
  nota('El pico de presión llega '+f1(s.thPmax)+'° después del PMS: la combustión dura '+
    f1(s.dth)+'° y el calor sigue entrando cuando el pistón ya baja. El área encerrada por la '+
    'curva azul es el trabajo indicado bruto; para llegar al par todavía hay que restarle el '+
    'bombeo y la fricción, y eso el diagrama p–V no lo dibuja.',700);

  // --- panel ---
  rpanel(548);
  const q=pcur(96);
  q.row('r geométrica',f0(c.r)+' : 1');
  q.row('r efectiva desde el IVC',f2(s.rEf)+' : 1',VIO);
  q.row('techo ideal 1 − r_ef^−0,4',pc1(s.etaOttoEf),GRIS);
  q.row('η indicada',pc1(s.etaI));
  q.row('η al freno',pc1(s.etaB),OK_HEX);
  q.row('consumo específico',fin(s.bsfc,0)+' g/kWh');
  q.sep();
  q.row('imep bruta',f2(s.imepG)+' bar');
  q.row('bombeo pmep',f2(s.pmep)+' bar');
  q.row('fricción fmep',f2(s.fmep)+' bar');
  q.row('bmep al freno',f2(s.bmep)+' bar',colOk(s.okPar));
  q.row('par · potencia',f1(s.par)+' N·m · '+f1(s.pot/1000)+' kW');
  q.sep();
  q.row('presión máxima',f1(s.pmax/1e5)+' bar @ '+f1(s.thPmax)+'°',colOk(s.okPres));
  q.row('temperatura máxima',f0(s.Tmax)+' K');
  q.row('temperatura en la brida',f0(s.Tbrida)+' K',colOk(s.okEsc));
  q.row('integral de detonación',f3(s.Ilw),colOk(s.okDeton));
  q.row('duración de combustión',f1(s.dth)+'°',colOk(s.okEstab));
  q.row('residuales atrapados',pc1(s.fRes));
  q.row('calor a las paredes',pc1(s.Qfrac),WARN_HEX);
  q.sep();
  q.nota('El ciclo sólo se resuelve entre el cierre de admisión ('+gra(TH_IVC)+') y la '+
    'apertura de escape ('+gra(TH_EVO)+'). Fuera de ese tramo no hay nada calculado.');
}

// ---- 7.2 la relación de compresión ----
function vistaCompresion(){
  const c=cfgDe(mode), P=MAQ[c.mk], sw=sweepR(c.mk,c.av,c.lam);
  const rHi=R_G[R_G.length-1];
  title2('Sube la compresión: el techo ideal corre, la eficiencia real no lo alcanza',
    ICONO[c.mk]+' '+P.nom+' · avance '+f0(c.av)+'° · λ = '+f2(c.lam)+
    ' · límite mecánico r ≤ '+f0(P.rMax));

  const A=ejes({x:110,y:112,w:520,h:226},R_G[0],rHi,0,60,
    'relación de compresión r','eficiencia (%)',v=>f0(v),v=>f0(v),6,6);
  if(P.rMax<rHi) banda(A,P.rMax,rHi,0,60,'rgba(255,107,107,0.09)');
  curva(serieBar(A,sw,'r',x=>x.etaOtto*100),GRIS,2.4,[7,5]);
  curva(serieBar(A,sw,'r',x=>x.etaOttoEf*100),VIO,2.2,[3,4]);
  curva(serieBar(A,sw,'r',x=>x.etaB*100),OK_HEX,3);
  sw.forEach(x=>{ if(x.r>P.rMax) return;
    punteo(A.X(x.r),A.Y(x.etaB*100),x.valida?OK_HEX:BAD_HEX,4.5); });
  anillo(A.X(c.r),A.Y(sw[R_G.indexOf(c.r)].etaB*100),'#eaf1fb',9);
  if(P.rMax<rHi) texto('imposible en esta máquina',A.X(P.rMax)+8,132,BAD_HEX,12,'left','700');
  leyenda(114,366,[['techo ideal con r geométrica',GRIS,[7,5]],
                   ['techo ideal con r efectiva',VIO,[3,4]],
                   ['η al freno (real)',OK_HEX]]);

  const Imx=Math.max(1.3,...sw.map(x=>x.Ilw));
  const B=ejes({x:110,y:442,w:520,h:170},R_G[0],rHi,0,Math.ceil(Imx*10)/10,
    'relación de compresión r','integral de detonación I',v=>f0(v),v=>f2(v),6,4);
  if(P.rMax<rHi) banda(B,P.rMax,rHi,0,Math.ceil(Imx*10)/10,'rgba(255,107,107,0.09)');
  linea(B.X(R_G[0]),B.Y(1),B.X(rHi),B.Y(1),BAD_HEX,1.8,[6,5]);
  texto('I = 1 · el gas sin quemar se autoenciende',B.X(R_G[0])+8,B.Y(1)-8,BAD_HEX,12,'left','700');
  curva(serieBar(B,sw,'r',x=>x.Ilw),NARANJA,3);
  sw.forEach(x=>{ if(x.r>P.rMax) return;
    punteo(B.X(x.r),B.Y(clamp(x.Ilw,0,Math.ceil(Imx*10)/10)),colOk(x.okDeton),4.5); });

  const s0=sw[0], sM=sw[R_G.indexOf(P.rMax)];
  const dTecho=(sM.etaOtto-s0.etaOtto)*100, dReal=(sM.etaB-s0.etaB)*100;
  nota('De r = '+f0(R_G[0])+' a r = '+f0(P.rMax)+', el techo ideal gana '+f2(dTecho)+
    ' puntos de eficiencia y la máquina real gana '+f2(dReal)+
    (dReal>=0?'':' (los pierde)')+'. La diferencia no se evapora: se va en calor a las paredes, '+
    'en una combustión que empieza más tarde de lo que le conviene y, cuando I pasa de 1, en '+
    'una detonación que ya no es una pérdida de rendimiento sino una avería.',652);

  rpanel(470);
  const q=pcur(96,24);
  q.row('barrido',f0(sw.filter(x=>x.r<=P.rMax).length)+' compresiones');
  q.sep();
  let yy=q.y();
  yy=tabla(PX.x+14,yy,['r','η_b','I','p máx',''],
    sw.filter(x=>x.r<=P.rMax).map(x=>[f0(x.r),pc1(x.etaB),f3(x.Ilw),f1(x.pmax/1e5),x.valida?'✓':'✗']),
    [40,72,62,58,26],
    (ri,ci)=>{ const x=sw.filter(v=>v.r<=P.rMax)[ri];
      if(ci===4) return colOk(x.valida);
      if(ci===2) return colOk(x.okDeton);
      if(ci===3) return colOk(x.okPres);
      return x.r===c.r?'#eaf1fb':'#c8d3e2'; });
  const best=sw.filter(x=>x.r<=P.rMax&&x.valida).sort((a,b)=>b.etaB-a.etaB)[0];
  yy+=10; linea(PX.x+14,yy-14,PX.x+PX.w-14,yy-14,'#243043',1);
  if(best) prow(yy,'mejor η_b que pasa','r = '+f0(best.r)+' · '+pc1(best.etaB),OK_HEX);
  else prow(yy,'mejor η_b que pasa','ninguna con este avance y este λ',BAD_HEX);
  wrapText('El techo ideal no sabe de detonación ni de paredes: sólo mira r. Por eso sube '+
    'siempre, y por eso no sirve para elegir.',PX.x+14,yy+26,PX.w-28,16,'#7f8b9c',12);
}

// ---- 7.3 la mezcla ----
function vistaMezcla(){
  const c=cfgDe(mode), P=MAQ[c.mk], F=FUEL[P.fuel], sw=sweepL(c.mk,c.r,c.av);
  const lo=LAM_G[0], hi=LAM_G[LAM_G.length-1];
  title2('La mezcla: dónde está el máximo de cada eficiencia',
    ICONO[c.mk]+' '+P.nom+' · r = '+f0(c.r)+' · avance '+f0(c.av)+'° · '+F.nom+
    ' · AFR estequiométrico '+f2(F.afr));

  const A=ejes({x:110,y:112,w:520,h:226},lo,hi,0,50,
    'dosado relativo λ (1 = estequiométrico)','eficiencia (%)',v=>f2(v),v=>f0(v),5,5);
  banda(A,Math.max(lo,P.lamMin),Math.min(hi,P.lamMax),0,50,'rgba(124,217,146,0.10)');
  curva(serieBar(A,sw,'lam',x=>x.etaI*100),AZUL,2.6,[5,4]);
  curva(serieBar(A,sw,'lam',x=>x.etaB*100),OK_HEX,3);
  sw.forEach(x=>punteo(A.X(x.lam),A.Y(x.etaB*100),colOk(x.valida),4.5));
  anillo(A.X(c.lam),A.Y(sw[LAM_G.indexOf(c.lam)].etaB*100),'#eaf1fb',9);
  texto('ventana del pliego',A.X(Math.max(lo,P.lamMin))+6,132,OK_HEX,12,'left','700');
  leyenda(114,366,[['η indicada',AZUL,[5,4]],['η al freno',OK_HEX]]);

  const Tlo=Math.floor(Math.min(...sw.map(x=>x.Tbrida),P.tEscLim)/50)*50-50;
  const Thi=Math.ceil(Math.max(...sw.map(x=>x.Tbrida),P.tEscLim)/50)*50+50;
  const B=ejes({x:110,y:442,w:520,h:170},lo,hi,Tlo,Thi,
    'dosado relativo λ','temperatura en la brida (K)',v=>f2(v),v=>f0(v),5,4);
  linea(B.X(lo),B.Y(P.tEscLim),B.X(hi),B.Y(P.tEscLim),BAD_HEX,1.8,[6,5]);
  texto('límite del colector: '+f0(P.tEscLim)+' K',B.X(lo)+8,B.Y(P.tEscLim)-8,BAD_HEX,12,'left','700');
  curva(serieBar(B,sw,'lam',x=>x.Tbrida),NARANJA,3);
  sw.forEach(x=>punteo(B.X(x.lam),B.Y(clamp(x.Tbrida,Tlo,Thi)),colOk(x.okEsc),4.5));

  const pI=sw.slice().sort((a,b)=>b.etaI-a.etaI)[0];
  const pB=sw.slice().sort((a,b)=>b.etaB-a.etaB)[0];
  nota('El máximo de η indicada cae en λ = '+f2(pI.lam)+' y el de η al freno en λ = '+f2(pB.lam)+
    '. '+(pI.lam===pB.lam
      ? 'Aquí coinciden, pero no por la misma razón: la fricción resta presión media, no un tanto por ciento.'
      : 'No coinciden porque la fricción es una resta fija en presión media: al empobrecer baja la '+
        'imep y esa misma fmep pesa cada vez más en proporción.')+
    ' Y por encima de todo eso manda la ventana del pliego: '+
    (P.cat?'con catalizador de tres vías la mezcla no es negociable.'
          :'sin catalizador de tres vías queda margen para empobrecer.'),652);

  rpanel(430);
  const q=pcur(96,24);
  q.row('combustible',F.nom);
  q.row('poder calorífico',f1(F.lhv/1e6)+' MJ/kg');
  q.row('ventana admitida',f2(P.lamMin)+' – '+f2(P.lamMax),P.cat?WARN_HEX:'#dbe4f0');
  q.sep();
  let yy=q.y();
  yy=tabla(PX.x+14,yy,['λ','η_i','η_b','T brida','Δθ',''],
    sw.map(x=>[f2(x.lam),pc1(x.etaI),pc1(x.etaB),f0(x.Tbrida),f0(x.dth),x.valida?'✓':'✗']),
    [42,58,58,52,36,26],
    (ri,ci)=>{ const x=sw[ri];
      if(ci===5) return colOk(x.valida);
      if(ci===3) return colOk(x.okEsc);
      if(ci===4) return colOk(x.okEstab);
      return x.lam===c.lam?'#eaf1fb':'#c8d3e2'; });
  wrapText('Δθ es la duración de la combustión. Empobrecer frena la llama: la mezcla tarda más '+
    'en quemarse y llega un punto en el que el pliego lo rechaza por inestable.',
    PX.x+14,yy+16,PX.w-28,16,'#7f8b9c',12);
}

// ---- 7.4 el censo ----
function vistaCenso(){
  const c=cfgDe(mode), P=MAQ[c.mk], C=censoM(c.mk), sol=solM(c.mk);
  title2('El censo del pliego: qué criterio tumba de verdad a esta máquina',
    ICONO[c.mk]+' '+P.nom+' · '+f0(C.n)+' configuraciones mecánicamente posibles · '+
    f0(C.validas)+' válidas');
  let y=150;
  CRIT.forEach(k=>{
    texto(CRIT_ROT[k],56,y,TINTA,15,'left','700');
    hbar(300,y-15,300,15,C.tot[k]/C.n,AZUL);
    texto(f0(C.tot[k]),612,y-3,'#a9b6c8',14,'left','700');
    hbar(300,y+6,300,10,C.solo[k]/C.n,BAD_HEX);
    texto(f0(C.solo[k]),612,y+15,C.solo[k]?BAD_HEX:'#5b6474',13,'left','700');
    y+=62;
  });
  leyenda(114,y+4,[['configuraciones que ese criterio reprueba',AZUL],
                   ['configuraciones en que es el ÚNICO que reprueba',BAD_HEX]]);
  const soloMax=CRIT.slice().sort((a,b)=>C.solo[b]-C.solo[a])[0];
  nota(C.solo[soloMax]>0
    ? 'El cuello de botella real de esta máquina es «'+CRIT_ROT[soloMax]+'»: '+f0(C.solo[soloMax])+
      ' configuraciones se caen sólo por él. Si mañana pudieras relajar un único criterio del '+
      'pliego, ése es el que más configuraciones te devolvería.'
    : 'Ningún criterio reprueba en solitario en esta máquina: las que se caen se caen por dos o '+
      'más a la vez, así que relajar un solo criterio no devolvería ni una configuración.',y+40);

  rpanel(300);
  const q=pcur(96,25);
  q.row('rejilla barrida',f0(C.n)+' de '+f0(R_G.length*AV_G.length*LAM_G.length));
  q.row('descartadas por r > r_máx',f0(R_G.length*AV_G.length*LAM_G.length-C.n),GRIS);
  q.row('cumplen las siete',f0(C.validas),C.validas?OK_HEX:BAD_HEX);
  q.sep();
  if(sol){
    q.row('la más barata a '+f0(ANIOS)+' años','r '+f0(sol.r)+' · '+f0(sol.avance)+'° · λ '+f2(sol.lam),AMBAR);
    q.row('coste de combustible',f0(sol.coste5)+' €');
    q.row('η al freno',pc1(sol.etaB),OK_HEX);
    q.row('empates en coste',f0(empM(c.mk).length));
  }else q.row('la más barata','no hay ninguna válida',BAD_HEX);
  q.sep();
  q.nota('La barra azul cuenta todas las veces que un criterio reprueba, aunque otros también lo '+
    'hagan. La roja cuenta sólo las veces que reprueba él solo. Manda la roja.');
}

// ---- 7.5 el reto ----
function vistaReto(){
  const mk=RETO.cfg.mk, P=MAQ[mk], F=FUEL[P.fuel], s=CUR;
  title2('Reto · elige la calibración más barata que pase el pliego',
    ICONO[mk]+' '+P.nom+' · '+F.nom+' · '+f0(P.horas)+' h/año · '+f0(P.wAnio)+' kWh/año al freno');
  const fil=pliegoFilas(mk,s);
  let y=140;
  texto('criterio',60,y,'#7f8b9c',13,'left','700');
  texto('tu calibración',330,y,'#7f8b9c',13,'left','700');
  texto('exige el pliego',500,y,'#7f8b9c',13,'left','700');
  y+=10; linea(56,y,660,y,'#243043',1); y+=26;
  fil.forEach(f=>{
    marca(66,y-5,f[4]);
    texto(f[1],86,y,f[4]?TINTA:BAD_HEX,15,'left','600');
    texto(f[2],330,y,f[4]?'#c8d3e2':BAD_HEX,15,'left','700');
    texto(f[3],500,y,'#8f9bb0',14,'left','600');
    y+=34;
  });
  y+=6; linea(56,y-14,660,y-14,'#243043',1);
  texto('coste de combustible a '+f0(ANIOS)+' años',86,y+6,TINTA,15,'left','700');
  texto(s.valida?f0(s.coste5)+' €':'—',330,y+6,s.valida?AMBAR:'#5b6474',15,'left','700');
  y+=44;
  if(RETO.resuelto){
    texto('✅ calibración firmada',66,y,OK_HEX,18,'left','800');
  }else{
    const abiertas=PIS_EJE.filter(e=>RETO.pistas[e]);
    if(abiertas.length){
      texto('Pistas destapadas',66,y,'#8f9bb0',14,'left','700'); y+=26;
      pisM(mk).forEach(p=>{
        if(!RETO.pistas[p.eje]) return;
        texto(p.rot,86,y,TINTA,14,'left','600');
        texto('= '+(p.eje==='lam'?f2(p.v):f0(p.v)),330,y,AMBAR,15,'left','700');
        texto('quedan '+f0(p.n)+' de '+f0(RETO.nval),430,y,'#7f8b9c',13,'left','600');
        y+=24;
      });
    }
  }
  nota(RETO.msg||('De las '+f0(RETO.nval)+' calibraciones que pasan los siete criterios, sólo una '+
    'gasta menos combustible en '+f0(ANIOS)+' años. Y el combustible no cuesta lo mismo por litro '+
    'en todas las máquinas: la eficiencia sola no decide.'),706);

  rpanel(346);
  const q=pcur(96,25);
  q.row('máquina',ICONO[mk]+' '+ROT[mk]);
  q.row('cilindrada unitaria',cm3(s.Vd)+' cm³');
  q.row('límite mecánico','r ≤ '+f0(P.rMax));
  q.sep();
  q.row('r elegida',f0(RETO.ejes.r)+' : 1',RETO.pistas.r?AMBAR:'#dbe4f0');
  q.row('λ elegido',f2(RETO.ejes.lam),RETO.pistas.lam?AMBAR:'#dbe4f0');
  q.row('avance elegido',f0(RETO.ejes.avance)+'°',RETO.pistas.avance?AMBAR:'#dbe4f0');
  q.sep();
  q.row('criterios que fallan',f0(fallosDe(s).length),colOk(s.valida));
  q.row('η al freno',pc1(s.etaB));
  q.row('consumo específico',fin(s.bsfc,0)+' g/kWh');
  q.sep();
  q.nota('Cada pista fija un eje. Ninguna te da la terna: entre las que quedan hay que elegir '+
    'por coste.');
}

const VISTAS={ciclo:vistaCiclo,compresion:vistaCompresion,mezcla:vistaMezcla,censo:vistaCenso,reto:vistaReto};
function pintaBoard(){
  bg();
  try{ VISTAS[mode](); }
  catch(err){ texto('error de pintado',44,52,BAD_HEX,20,'left','800');
    wrapText(String(err&&err.message||err),44,86,600,18,'#8f9bb0',13); }
  btex.needsUpdate=true;
}

// ===================== 8. MÁQUINA EN 3D =====================
// Escala única: ESC3 metros→unidades de escena. Todo lo que se ve —diámetro,
// carrera, longitud de biela y ALTURA DE LA CÁMARA— sale de la máquina elegida
// y de la r elegida. No hay ninguna cota inventada para que «se vea bien».
const ESC3=10, CY=0.85;                 // eje del cigüeñal a 0,85 de la bancada
const G3=new THREE.Group(); G3.position.set(0.95,0,0.35); scene.add(G3);
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function tubo(a,b,r,mat){
  const d=b.clone().sub(a), L=d.length();
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,14),mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V3(0,1,0),d.clone().normalize());
  return m;
}
const cilY=mat=>new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,28),mat);
const caja=mat=>new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat);
/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
   ya importa), traducidos una vez a los materiales de este laboratorio. */
const MATP={aluminio:MAT.piston, acero:MAT.aceroC, hierro:MAT.aro, cobre:MAT.oro,
  cromo:MAT.acero, chapa:MAT.acero, negro:MAT.negro, goma:MAT.negro,
  blanco:MAT.aluminio, ceramica:MAT.aluminio};
/* Este laboratorio REHACE cuatro piezas cada vez que cambia la geometría del
   motor, porque su forma depende del diámetro y de la carrera. Al rehacerlas
   hay que soltar la geometría vieja: si no, cada vuelta del mando deja en la
   tarjeta gráfica un pistón que ya nadie dibuja. */
const tira=(o)=>{ o.traverse(n=>{ if(n.isMesh) n.geometry.dispose(); }); };
function marcaKey(o,k){ o.traverse(n=>{ n.userData.key=k; }); o.userData.key=k; return o; }

// --- bancada ---
(function(){
  const b=roundedBox(3.7,0.16,2.3,MAT.bancada,0.05); b.position.set(0,0.08,0); G3.add(b);
  for(const x of [-1.35,1.35]) for(const z of [-0.85,0.85]){
    const p=new THREE.Mesh(new THREE.BoxGeometry(0.20,0.28,0.20),MAT.aceroC);
    p.position.set(x,-0.14,z); G3.add(p);
  }
})();

// --- bloque: dos costados y un fondo, sin pared delantera, para ver dentro ---
const BLOQ=new THREE.Group(); G3.add(BLOQ);
const bIzq=caja(MAT.bloque), bDer=caja(MAT.bloque), bFon=caja(MAT.bloque),
      carter=caja(MAT.bloque);
(function(){
  BLOQ.add(bIzq); BLOQ.add(bDer); BLOQ.add(bFon); BLOQ.add(carter);
  marcaKey(BLOQ,'bloque');
})();

// --- camisa y columna de gas encerrada sobre el pistón ---
const CAM=new THREE.Group(); G3.add(CAM);
const camisa=cilY(MAT.camisa);
const gas=cilY(new THREE.MeshStandardMaterial({color:CIAN,transparent:true,opacity:0.28,
  emissive:CIAN,emissiveIntensity:0.35,roughness:0.40,depthWrite:false}));
(function(){ CAM.add(camisa); CAM.add(gas); marcaKey(CAM,'camisa'); })();

// --- pistón con sus dos aros ---
const PIS=new THREE.Group(); G3.add(PIS);
const bulon=cilY(MAT.aceroC);
let pisP3=null;               // se construye en aplicaGeom(), con el diámetro
(function(){
  bulon.rotation.x=Math.PI/2; PIS.add(bulon);
  marcaKey(PIS,'piston');
})();

// --- biela ---
const BIE=new THREE.Group(); G3.add(BIE);
let bieP3=null;               // se construye en aplicaGeom(), con la longitud

// --- cigüeñal: muñequilla, contrapesos y volante ---
const CIG=new THREE.Group(); CIG.position.set(0,CY,0); G3.add(CIG);
const muñ=cilY(MAT.acero), cp1=cilY(MAT.aceroC), cp2=cilY(MAT.aceroC), volante=cilY(MAT.acero);
(function(){
  const eje=cilY(MAT.acero); eje.rotation.x=Math.PI/2; eje.scale.set(0.13,1.90,0.13);
  CIG.add(eje);
  muñ.rotation.x=Math.PI/2; CIG.add(muñ);
  cp1.rotation.x=Math.PI/2; cp2.rotation.x=Math.PI/2; CIG.add(cp1); CIG.add(cp2);
  volante.rotation.x=Math.PI/2; volante.position.z=-1.02; CIG.add(volante);
  for(let i=0;i<14;i++){
    const d=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.10,0.05),MAT.negro);
    const a=i/14*Math.PI*2; d.position.set(0.52*Math.cos(a),0.52*Math.sin(a),-1.02);
    d.rotation.z=a; CIG.add(d);
  }
  marcaKey(CIG,'cigue');
})();
volante.scale.set(0.50,0.10,0.50);

// --- culata ---
const CUL=new THREE.Group(); G3.add(CUL);
const culata=caja(MAT.culata), junta=caja(MAT.rojo.clone());
(function(){
  CUL.add(culata); CUL.add(junta);
  marcaKey(CUL,'culata');
})();

// --- bujía ---
const BUJ=new THREE.Group(); G3.add(BUJ);
const bujEle=cilY(emis('#c9a227',0.10));
const chispa=new THREE.Mesh(new THREE.SphereGeometry(1,12,10),
  new THREE.MeshBasicMaterial({color:'#eaf1fb',transparent:true,opacity:0}));
(function(){
  /* La bujía viene entera de la biblioteca: hexágono de la llave, aislador con
     sus corrugas —que alargan el camino de fuga para que los 25 kV salten en la
     punta y no por fuera—, cuerpo roscado y los dos electrodos. El electrodo
     central de la pieza HEREDA el material del que este laboratorio enciende al
     saltar la chispa, para que la que se ilumine sea la punta de verdad. */
  const bj=P3.bujia({...MATP,acero:MAT.acero,ceramica:MAT.aluminio},{d:0.11,largo:0.52});
  bj.userData.chispa.material=bujEle.material;
  bujEle.visible=false;
  BUJ.add(bj); BUJ.add(bujEle); BUJ.add(chispa);
  BUJ.userData.pieza=bj;
  marcaKey(BUJ,'bujia');
})();

// --- válvulas: en este laboratorio permanecen cerradas de IVC a EVO ---
function valvula(col){
  /* La válvula sale de la biblioteca, con lo único que de verdad la define: el
     CHAFLÁN de 45° de la cabeza —la única superficie de la pieza que se
     rectifica, porque es donde sella— y la garganta de los semiconos. El anillo
     de color no es la válvula: es el ASIENTO, y está para poder decir de un
     vistazo cuál es la de admisión y cuál la de escape. */
  const g=new THREE.Group();
  const as=new THREE.Mesh(new THREE.TorusGeometry(1,0.035,8,26),
    new THREE.MeshStandardMaterial({color:col,roughness:0.4,metalness:0.3,emissive:col,emissiveIntensity:0.35}));
  as.rotation.x=Math.PI/2; as.position.y=0.055; g.add(as);
  const mu=cilY(MAT.negro); mu.scale.set(0.085,0.16,0.085); mu.position.y=0.66; g.add(mu);
  return {g,as,p3:null};
}
const VAD=valvula(CIAN), VES=valvula(NARANJA);
G3.add(VAD.g); G3.add(VES.g);
marcaKey(VAD.g,'vadm'); marcaKey(VES.g,'vesc');

// --- frente de llama ---
const llama=new THREE.Mesh(new THREE.SphereGeometry(1,22,16),
  new THREE.MeshBasicMaterial({color:'#ffb347',transparent:true,opacity:0,depthWrite:false}));
G3.add(llama); marcaKey(llama,'llama');

// --- manómetro de cilindro ---
function manometro(){
  const g=new THREE.Group(); G3.add(g);
  const cja=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.06,26),MAT.acero);
  cja.rotation.x=Math.PI/2; g.add(cja);
  const esf=new THREE.Mesh(new THREE.CircleGeometry(0.172,26),
    new THREE.MeshBasicMaterial({color:'#0d1220'}));
  esf.position.z=0.032; g.add(esf);
  for(let i=0;i<=10;i++){
    const a=-Math.PI*0.75+1.5*Math.PI*i/10;
    const t=new THREE.Mesh(new THREE.BoxGeometry(0.018,0.034,0.005),
      new THREE.MeshBasicMaterial({color:i>=8?BAD_HEX:'#6b7788'}));
    t.position.set(0.138*Math.sin(a),0.138*Math.cos(a),0.035); t.rotation.z=-a; g.add(t);
  }
  const piv=new THREE.Group(); g.add(piv);
  const ag=new THREE.Mesh(new THREE.BoxGeometry(0.014,0.145,0.006),
    new THREE.MeshBasicMaterial({color:BAD_HEX}));
  ag.position.set(0,0.072,0.038); piv.add(ag);
  const cen=new THREE.Mesh(new THREE.CircleGeometry(0.026,16),
    new THREE.MeshBasicMaterial({color:'#c8d3e2'}));
  cen.position.z=0.042; g.add(cen);
  marcaKey(g,'mano');
  return {g,piv};
}
const MAN=manometro();

// --- escape: codo, brida y termopar ---
const ESCP=new THREE.Group(); G3.add(ESCP);
const matEsc=new THREE.MeshStandardMaterial({color:'#6b7788',roughness:0.55,metalness:0.55,
  emissive:'#000000',emissiveIntensity:0.9});
const brida=cilY(matEsc), tcCab=caja(MAT.negro);
(function(){
  brida.rotation.z=Math.PI/2; ESCP.add(brida); ESCP.add(tcCab);
  marcaKey(ESCP,'brida');
})();
const TUBO_ESC=new THREE.Group(); ESCP.add(TUBO_ESC);

// --- sensor de detonación ---
const KNK=new THREE.Group(); G3.add(KNK);
const knkLed=new THREE.Mesh(new THREE.SphereGeometry(0.055,16,12),MAT.verde.clone());
(function(){
  const cu=cilY(MAT.negro); cu.rotation.z=Math.PI/2; cu.scale.set(0.13,0.14,0.13); KNK.add(cu);
  const to=cilY(MAT.aceroC); to.rotation.z=Math.PI/2; to.scale.set(0.05,0.22,0.05);
  to.position.x=0.16; KNK.add(to);
  knkLed.position.set(-0.10,0,0); KNK.add(knkLed);
  marcaKey(KNK,'deton');
})();

// --- cuadro de recepción: siete pilotos, uno por criterio ---
const CUADRO=new THREE.Group(); CUADRO.position.set(-2.05,1.12,-0.62); G3.add(CUADRO);
const pilotos=[];
(function(){
  const p=roundedBox(0.74,1.58,0.16,std('#1b2230',0.72,0.18),0.04); CUADRO.add(p);
  const t=roundedBox(0.66,0.12,0.02,MAT.negro,0.01); t.position.set(0,0.86,0.09); CUADRO.add(t);
  CRIT.forEach((c,i)=>{
    const led=new THREE.Mesh(new THREE.SphereGeometry(0.055,18,14),MAT.verde.clone());
    led.position.set(-0.20,0.62-i*0.20,0.09); CUADRO.add(led);
    const rr=new THREE.Mesh(new THREE.TorusGeometry(0.075,0.014,10,20),MAT.aceroC);
    rr.position.copy(led.position); rr.position.z-=0.01; CUADRO.add(rr);
    const b=new THREE.Mesh(new THREE.BoxGeometry(0.30,0.05,0.02),std('#39424f',0.8,0.1));
    b.position.set(0.16,0.62-i*0.20,0.09); CUADRO.add(b);
    pilotos.push(led);
  });
  const pa=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.30,12),MAT.acero);
  pa.position.set(0,-0.94,0); CUADRO.add(pa);
  marcaKey(CUADRO,'cuadro');
})();

// ===================== 9. LA MÁQUINA SIGUE A LA TRAZA =====================
// Contrato de fidelidad: la geometría dibujada es la geometría simulada.
// El pistón va donde lo manda el mecanismo biela-manivela exacto, no un seno;
// la altura de la cámara es S/(r−1) a escala, así que al subir r la cámara
// ADELGAZA en pantalla; y sólo se anima el tramo cerrado, de IVC a EVO.
const GE={a:0.3,Lb:1.0,Rb:0.3,hc:0.1,hp:0.2,deck:2.0};
function aplicaGeom(){
  const P=maqAct(), c=cfgDe(mode);
  const a=P.S/2*ESC3, Lb=P.L*ESC3, Rb=P.B/2*ESC3, hc=(P.S/(c.r-1))*ESC3, hp=0.62*Rb;
  GE.a=a; GE.Lb=Lb; GE.Rb=Rb; GE.hc=hc; GE.hp=hp;
  GE.deck=CY+a+Lb+hp/2+hc;
  const H=GE.deck-0.16, yM=0.16+H/2, e=0.16, hol=Rb+0.12;
  bIzq.scale.set(e,H,2*hol); bIzq.position.set(-(hol+e/2),yM,0);
  bDer.scale.set(e,H,2*hol); bDer.position.set( (hol+e/2),yM,0);
  bFon.scale.set(2*(hol+e),H,e); bFon.position.set(0,yM,-(hol+e/2));
  const hCar=CY-0.16+a+0.30;
  carter.scale.set(2*(hol+e)+0.30,hCar,2*hol+0.44);
  carter.position.set(0,0.16+hCar/2,-(0.22+e/2));

  const yBDC=CY+(Lb-a), yLinB=yBDC-hp*1.10, hLin=GE.deck-yLinB;
  camisa.scale.set(Rb+0.045,hLin,Rb+0.045);
  camisa.position.set(0,yLinB+hLin/2,0);

  /* EL PISTÓN Y LA BIELA se REHACEN, no se estiran. Escalar una malla estira
     también las ranuras de los segmentos y el ojo del pie, y un pistón con las
     ranuras estiradas ya no es un pistón. La cota que se le pasa es la ALTURA DE
     COMPRESIÓN —del eje del bulón a la cara de la cabeza, aquí hp/2—, que es
     justamente la que, con la carrera y la biela, decide dónde queda la corona
     en el PMS y por tanto la relación de compresión de la que va el laboratorio. */
  if(pisP3){ PIS.remove(pisP3); tira(pisP3); }
  pisP3=P3.piston(MATP,{D:2*(Rb-0.015),hCorona:hp/2,seg:34,bulon:false});
  pisP3.position.y=-pisP3.userData.alturaBulon;
  PIS.add(pisP3); marcaKey(PIS,'piston');
  bulon.scale.set(0.055,2*Rb*0.92,0.055);

  if(bieP3){ BIE.remove(bieP3); tira(bieP3); }
  bieP3=P3.biela({...MATP,acero:MAT.acero},
    {largo:Lb,dPie:0.115,dCabeza:0.235,espesor:0.115});
  BIE.add(bieP3); marcaKey(BIE,'biela');
  muñ.scale.set(0.115,0.52,0.115);
  cp1.scale.set(a*0.92,0.16,a*0.92); cp2.scale.set(a*0.92,0.16,a*0.92);
  cp1.position.set(0,0,0.34); cp2.position.set(0,0,-0.34);

  culata.scale.set(2*(hol+e),0.44,2*(hol+e));
  culata.position.set(0,GE.deck+0.22,0);
  junta.scale.set(2*(hol+e)+0.04,0.05,2*(hol+e)+0.04);
  junta.position.set(0,GE.deck+0.005,0);

  // La bujía entra por la culata y su punta asoma a la cámara: la chispa salta
  // ahí dentro, que es lo único que hay que ver.
  BUJ.userData.pieza.position.set(0,GE.deck-hc*0.30+0.52*0.40,0);
  chispa.scale.setScalar(Math.max(0.035,hc*0.30));
  chispa.position.set(0,GE.deck-hc*0.55,0);

  const rV=Rb*0.30, xV=Rb*0.46;
  [[VAD,-1],[VES,1]].forEach(([V,s])=>{
    if(V.p3){ V.g.remove(V.p3); tira(V.p3); }
    V.p3=P3.valvula({...MATP,acero:MAT.aceroC},{d:rV*2,largo:0.62,vastago:0.052});
    V.g.add(V.p3);
    V.as.scale.set(rV*0.97,rV*0.97,1);
    V.g.position.set(0,GE.deck-0.05,s*xV);
    marcaKey(V.g,s<0?'vadm':'vesc');
  });
  llama.position.set(0,GE.deck-hc*0.5,0);

  MAN.g.position.set(hol+e+0.34,GE.deck+0.16,0.30);
  KNK.position.set(-(hol+e+0.14),CY+a+0.55,0.18);

  while(TUBO_ESC.children.length){ const ch=TUBO_ESC.children.pop(); ch.geometry.dispose(); }
  const y0=GE.deck+0.22, xs=hol+e;
  [[V3(xV*0+0.02,y0,xV),V3(xs+0.10,y0,xV)],
   [V3(xs+0.10,y0,xV),V3(xs+0.55,y0-0.30,0.62)],
   [V3(xs+0.55,y0-0.30,0.62),V3(xs+0.55,y0-1.00,1.05)]].forEach(seg=>{
    TUBO_ESC.add(tubo(seg[0],seg[1],0.085,matEsc)); });
  brida.scale.set(0.20,0.09,0.20); brida.rotation.set(Math.PI/2,0,0);
  brida.position.set(xs+0.55,y0-1.04,1.05);
  tcCab.scale.set(0.16,0.16,0.16); tcCab.position.set(xs+0.55,y0-0.62,1.30);

  el('geoTxt').textContent='Ø'+f1(P.B*1000)+' × '+f1(P.S*1000)+' mm · biela '+f0(P.L*1000)
    +' mm · V_d '+cm3(Math.PI/4*P.B*P.B*P.S)+' cm³ · V_c '+cm3(Math.PI/4*P.B*P.B*P.S/(c.r-1))
    +' cm³ · cámara '+f2(P.S/(c.r-1)*1000)+' mm';
}

const LERP=(a,b,t)=>a+(b-a)*clamp(t,0,1);
let FR=0;                       // índice del fotograma dibujado
const PER3D=5.2;                // segundos por recorrido IVC→EVO
function pinta3D(){
  const R=CUR; if(!R||!R.traza) return;
  const tr=R.traza, n=tr.th.length, P=maqAct();
  FR=clamp(Math.floor(((animT/PER3D)%1)*(n-1)),0,n-1);
  const th=tr.th[FR]*DEG, p=tr.p[FR], T=tr.T[FR], xb=tr.xb[FR], I=tr.I[FR];
  const a=GE.a, Lb=GE.Lb, st=Math.sin(th), ct=Math.cos(th);
  const s=Math.sqrt(Math.max(1e-9,Lb*Lb-a*a*st*st));
  const pinY=CY+a*ct+s;

  CIG.rotation.z=-th;
  muñ.position.set(0,a,0);
  cp1.position.set(0,-a*0.55,0.34); cp2.position.set(0,-a*0.55,-0.34);

  PIS.position.set(0,pinY,0);

  // La biela de la biblioteca tiene la CABEZA en su origen y el pie en +Y: se
  // ancla en la muñequilla del cigüeñal, no en el punto medio.
  const cpx=a*st, cpy=CY+a*ct;
  BIE.position.set(cpx,cpy,0);
  BIE.rotation.z=Math.atan2(a*st,s);

  // La columna de gas es el volumen del cilindro a escala: su altura por el
  // área del pistón es exactamente V(θ). En el PMS mide la altura de la cámara.
  const corona=pinY+GE.hp/2, hg=Math.max(0.012,GE.deck-corona);
  gas.scale.set(GE.Rb-0.02,hg,GE.Rb-0.02);
  gas.position.set(0,corona+hg/2,0);
  const q=clamp(p/P.pLim,0,1);
  gas.material.color.setHSL(LERP(0.56,0.02,q),0.85,LERP(0.45,0.58,q));
  gas.material.emissive.copy(gas.material.color);
  gas.material.emissiveIntensity=0.20+0.60*q;
  gas.material.opacity=0.16+0.34*q;
  MAN.piv.rotation.z=Math.PI*0.75-1.5*Math.PI*clamp(p/(P.pLim*1.10),0,1);

  // frente de llama: radio ∝ x_b^(1/3), como un núcleo esférico que crece
  const vis=xb>1e-4&&xb<0.999;
  llama.visible=vis;
  if(vis){
    llama.scale.setScalar(Math.min(GE.Rb*1.12,GE.Rb*1.25*Math.cbrt(xb)));
    llama.material.opacity=0.22+0.42*(1-xb);
    llama.material.color.setHSL(LERP(0.13,0.02,clamp((T-1400)/1400,0,1)),0.95,0.60);
  }
  const dch=Math.abs(tr.th[FR]+cfgDe(mode).av);
  chispa.material.opacity=dch<3?0.95:0;
  bujEle.material.emissiveIntensity=dch<3?1.6:0.10;

  // escape: el codo se pone al rojo con la temperatura de brida
  const qt=clamp((R.Tbrida-700)/600,0,1);
  matEsc.emissive.setHSL(0.03,0.95,0.10+0.34*qt);
  matEsc.color.setHSL(LERP(0.58,0.03,qt),LERP(0.10,0.85,qt),LERP(0.45,0.52,qt));

  // sensor de detonación: mira la integral EN ESTE INSTANTE, no el resumen
  const kc=I>=1?BAD_HEX:(I>=0.5?WARN_HEX:OK_HEX);
  knkLed.material.color.set(kc); knkLed.material.emissive.set(kc);
  knkLed.material.emissiveIntensity=I>=1?(0.55+0.75*Math.abs(Math.sin(animT*9))):0.55;

  pilotos.forEach((led,i)=>{
    const ok=R[CRIT[i]];
    led.material.color.set(ok?OK_HEX:BAD_HEX);
    led.material.emissive.set(ok?OK_HEX:BAD_HEX);
    led.material.emissiveIntensity=ok?0.85:(0.45+0.45*Math.sin(animT*5+i));
  });
}

// ===================== 10. HUD Y PANEL =====================
el('hud').innerHTML =
  '<div class="eyebrow">Motor de combustión interna · ciclo Otto</div>'+
  '<h2>La relación de compresión no es un número que se sube</h2>'+
  '<p>El techo ideal de aire frío dice que subir <b>r</b> siempre mejora. El motor sellado '+
  'integra el periodo cerrado del ciclo paso a paso y cobra lo que el techo ideal no cobra: '+
  'la mezcla sin quemar se calienta al comprimirse y empieza a contar el reloj del '+
  'autoencendido, la pared se lleva calor, y la fricción crece con la presión de pico. '+
  'Aquí decides <b>r</b>, el <b>avance de encendido</b> y el <b>dosado relativo λ</b> de '+
  f0(MAQ_KEYS.length)+' motores reales, y el pliego de '+f0(CRIT.length)+' criterios dice si '+
  'esa combinación se puede vender o no. De las '+f0(NPTS)+' combinaciones de la rejilla, '+
  f0(NMEC)+' son mecánicamente construibles y sólo un puñado pasa el pliego.</p>'+
  '<div class="formula">'+
    'p·V(θ) = m·R·T &nbsp;·&nbsp; R = '+f0(R_GAS)+' J/(kg·K)<br>'+
    'm·c<sub>v</sub>(T)·dT/dθ = η<sub>c</sub>·Q·(dx<sub>b</sub>/dθ) − p·(dV/dθ) − dQ<sub>pared</sub>/dθ '+
    '&nbsp;·&nbsp; RK4, paso '+f1(H_PASO)+'°<br>'+
    'x<sub>b</sub>(θ) = 1 − exp[−'+f3(A_WIEBE)+'·((θ−θ<sub>s</sub>)/Δθ)<sup>'+f0(M_WIEBE+1)+'</sup>] '+
    '&nbsp;·&nbsp; Wiebe<br>'+
    'S<sub>T</sub> = S<sub>L</sub><sup>'+f2(1-Q_DAMK)+'</sup>·u′<sup>'+f2(Q_DAMK)+'</sup>, '+
    'u′ = '+f1(CU_TURB)+'·S<sub>p</sub> &nbsp;·&nbsp; Δθ = Δθ<sub>0</sub>·S<sub>T,ref</sub>/S<sub>T</sub><br>'+
    'h<sub>c</sub> = '+f2(C1_WOS)+'·S<sub>p</sub> (Woschni) &nbsp;·&nbsp; '+
    'I = ∫ dt/τ, τ = '+f2(K_TAU)+'·'+f2(DE_A)+'·(RON/100)<sup>'+f3(DE_N)+'</sup>·p<sub>atm</sub><sup>'+f1(DE_P)+'</sup>·e<sup>'+f0(DE_B)+'/T<sub>u</sub></sup> ms<br>'+
    'FMEP = '+f2(CF_A)+' + '+f4(CF_B)+'·p<sub>máx</sub>[bar] + '+f4(CF_C)+'·S<sub>p</sub> + '+f4(CF_D)+'·S<sub>p</sub>²'+
  '</div>'+
  '<div class="legend">'+
    '<div class="li"><span class="dot" style="background:'+AZUL+'"></span>el ciclo real y todo lo <b>indicado</b>: lo que el gas hace sobre el pistón</div>'+
    '<div class="li"><span class="dot" style="background:'+OK_HEX+'"></span>lo que queda <b>al freno</b> tras restar bombeo y fricción</div>'+
    '<div class="li"><span class="dot" style="background:'+GRIS+'"></span>techo ideal de aire frío con la r <b>geométrica</b></div>'+
    '<div class="li"><span class="dot" style="background:'+VIO+'"></span>el mismo techo con la r <b>efectiva</b>, la que ve el motor tras el cierre de admisión</div>'+
    '<div class="li"><span class="dot" style="background:'+NARANJA+'"></span>el reloj de la combustión: x<sub>b</sub>, y en los barridos la temperatura de escape</div>'+
    '<div class="li"><span class="dot" style="background:'+BAD_HEX+'"></span>la cuenta del autoencendido: I de Livengood–Wu</div>'+
  '</div>'+
  '<div class="fid">'+
    '<div class="ft">🔒 Contrato de fidelidad</div>'+
    '<div class="fl"><b>Sí modela:</b> gas ideal con c<sub>p</sub>(T) por tramos y γ distinto para '+
    'la fracción quemada y la sin quemar (Brunt SAE 981052); residual atrapado resuelto por punto '+
    'fijo; liberación de calor de Wiebe con a='+f3(A_WIEBE)+', m='+f0(M_WIEBE)+'; velocidad laminar '+
    'de Metghalchi–Keck con corrección por dilución; paso a turbulenta por Damköhler; transferencia '+
    'a la pared de Woschni; retardo de autoencendido de Douaud–Eyzat integrado por Livengood–Wu '+
    'hasta x<sub>b</sub> = '+f0(XB_KNOCK*100)+' %; fricción de Chen–Flynn (SAE 650733); '+
    'RK4 sobre T(θ) con paso '+f1(H_PASO)+'°.</div>'+
    '<div class="fl no"><b>NO modela:</b> sólo se integra el <b>periodo cerrado</b>, de IVC '+
    '('+f0(TH_IVC)+'°) a EVO (+'+f0(TH_EVO)+'°): el lazo de bombeo no se integra, se cobra aparte como '+
    'PMEP = p<sub>esc</sub> − p<sub>adm</sub>, y por eso el diagrama p–V salta al volver de EVO a IVC. '+
    'Las válvulas no se abren en el 3D. Un cilindro representa a los demás. No hay EGR externo, ni '+
    'transitorio de turbo, ni emisiones químicas, ni desgaste. El coste de '+f0(ANIOS)+' años cuenta '+
    '<b>sólo combustible</b>, no mantenimiento ni aceite.</div>'+
  '</div>'+
  '<div class="src">Ref: Heywood, <i>Internal Combustion Engine Fundamentals</i> (1988) · '+
  'Metghalchi &amp; Keck, <i>Combust. Flame</i> 48 (1982) · Woschni SAE 670931 · '+
  'Douaud &amp; Eyzat SAE 780080 · Livengood &amp; Wu, <i>5th Symp. Combustion</i> (1955) · '+
  'Chen &amp; Flynn SAE 650733 · Brunt, Rai &amp; Emtage SAE 981052</div>';

el('panel').innerHTML =
  '<h4>Banco de ensayo <span id="p_mode"></span></h4>'+
  '<div class="modebar">'+
    '<button class="b" id="m_ciclo">1 · Ciclo</button>'+
    '<button class="b" id="m_compresion">2 · Compresión</button>'+
    '<button class="b" id="m_mezcla">3 · Mezcla</button>'+
    '<button class="b" id="m_censo">4 · Censo</button>'+
    '<button class="b" id="m_reto">5 · Reto</button>'+
  '</div>'+
  '<div id="scenarioInfo" class="scen"></div>'+
  '<div class="modebar" id="selbar"></div>'+
  '<div style="border:1px solid #243043;border-radius:10px;padding:10px 12px;margin:10px 0">'+
    '<div id="hwrot" style="font-weight:700"></div>'+
    '<div id="hwsub" class="mut" style="font-size:12px;margin-top:3px"></div>'+
    '<div id="geoTxt" class="mut" style="font-size:12px;margin-top:6px;line-height:1.5"></div>'+
  '</div>'+
  '<div id="tele"></div>'+
  '<div class="console" id="report"></div>'+
  '<h4 class="sec" id="retoTitle">Reto de calibración</h4>'+
  '<div id="retoBox">'+
    '<div id="retoSpec" class="mut" style="font-size:12px;line-height:1.55"></div>'+
    '<button class="b primary" id="btnCheck" style="margin-top:8px">Entregar la calibración</button>'+
  '</div>'+
  '<h4 class="sec">Pregunta de ingeniería</h4>'+
  '<div id="q_text" style="font-size:13px;line-height:1.5"></div>'+
  '<div class="btns" id="dxbtns"></div>'+
  '<button class="b auto" id="btnAuto">▶︎ Recorrido guiado</button>'+
  '<button class="b primary" id="btnNew">🔀 Otro caso</button>';

// ===================== 11. AVISO FLOTANTE =====================
function showToast(html){
  const t=el('toast'); t.innerHTML=html; t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t=setTimeout(()=>t.classList.remove('show'),4600);
}

// ===================== 12. MODOS Y CONTROLES =====================
const MODE_META={
  ciclo:{nombre:'El ciclo cerrado',cam:[[6.4,4.4,10.2],[-1.10,1.55,-0.25]],
    mision:'El motor integra el periodo cerrado, de IVC ('+f0(TH_IVC)+'°) a EVO (+'+f0(TH_EVO)+
      '°), con paso de '+f1(H_PASO)+'° y RK4. Arriba, el diagrama p–V: el área encerrada es el '+
      'trabajo indicado bruto. Abajo, el reloj de la combustión —la fracción quemada x_b— y la '+
      'cuenta de la detonación I. Mira dónde cae el pico de presión: si llega antes de los 5° o '+
      'después de los 25° después del PMS, el motor está empujando en el momento equivocado.'},
  compresion:{nombre:'El barrido de r',cam:[[1.2,4.2,8.6],[-2.60,1.75,-0.60]],
    mision:'Con el avance y el λ que has fijado, el motor recorre las '+f0(R_G.length)+
      ' relaciones de compresión de la rejilla. El techo ideal de aire frío sube siempre; la '+
      'eficiencia al freno no. Y por debajo corre la integral de detonación: cuando pasa de 1, el '+
      'gas sin quemar se enciende solo antes de que le llegue la llama. Ese es el muro real.'},
  mezcla:{nombre:'La mezcla',cam:[[0.2,3.9,7.8],[-3.20,1.80,-0.75]],
    mision:'Ahora se barren los '+f0(LAM_G.length)+' dosados relativos. λ = 1 es la mezcla '+
      'estequiométrica; por debajo sobra combustible y por encima sobra aire. El máximo de la '+
      'eficiencia indicada y el de la eficiencia al freno no tienen por qué caer en el mismo λ, '+
      'porque la fricción se resta en presión media, no en tanto por ciento. Y encima manda la '+
      'ventana del pliego: un catalizador de tres vías sólo trabaja en λ = 1.'},
  censo:{nombre:'El censo del pliego',cam:[[-1.4,3.7,5.9],[-4.05,1.86,-0.90]],
    mision:'Todas las configuraciones mecánicamente posibles de esta máquina pasadas por los '+
      f0(CRIT.length)+' criterios. La barra larga dice qué criterio reprueba más veces; la roja, '+
      'cuántas veces ese criterio es el ÚNICO que reprueba. Manda la roja: quitarla es lo único '+
      'que abre configuraciones nuevas.'},
  reto:{nombre:'Reto',cam:[[5.6,4.2,9.6],[-1.30,1.60,-0.30]],
    mision:'Elige relación de compresión, avance de encendido y dosado. Gana la calibración '+
      'válida —los '+f0(CRIT.length)+' criterios a la vez— más barata de alimentar a '+f0(ANIOS)+
      ' años, contando SÓLO el combustible que consume la carga anual de esa máquina.'},
};
const lbl=t=>'<span style="align-self:center;color:var(--muted);font-size:12px;margin:0 4px 0 2px">'+t+'</span>';
function optBtns(key,opts,cur){
  return opts.map(o=>{
    const v=Array.isArray(o)?o[0]:o, t=Array.isArray(o)?o[1]:o;
    return '<button class="b sm '+(String(cur)===String(v)?'on':'')+'" data-'+key+'="'+v+'">'+t+'</button>';
  }).join('');
}
const beep=()=>synth.beep(680,0.05,0.04);
const OPT_MAQ=MAQ_KEYS.map(k=>[k,ICONO[k]+' '+ROT[k]]);
const OPT_AV=AV_G.map(v=>[v,f0(v)+'°']);
const OPT_LAM=LAM_G.map(v=>[v,f2(v)]);
// La rejilla de r se recorta al límite mecánico de cada máquina: lo que el bloque
// no aguanta no se ofrece como si fuera una opción de calibración.
const optR=mk=>R_G.filter(r=>r<=MAQ[mk].rMax).map(v=>[v,f0(v)]);

function buildControls(){
  const bar=el('selbar'); let h='';
  if(mode!=='reto'){
    h+=lbl('Máquina')+optBtns('mq',OPT_MAQ,ST.mk);
    h+=lbl('r · relación de compresión')+optBtns('rr',optR(ST.mk),ST.r);
    h+=lbl('avance · ° antes del PMS')+optBtns('av',OPT_AV,ST.av);
    h+=lbl('λ · dosado relativo')+optBtns('lm',OPT_LAM,ST.lam);
  }else{
    h+=lbl('r')+optBtns('xr',optR(RETO.cfg.mk),RETO.ejes.r);
    h+=lbl('avance')+optBtns('xa',OPT_AV,RETO.ejes.avance);
    h+=lbl('λ')+optBtns('xl',OPT_LAM,RETO.ejes.lam);
    h+='<button class="b sm" id="btnPista">💡 Pista</button>';
  }
  bar.innerHTML=h; bar.style.display='flex';
  const wire=(attr,fn)=>bar.querySelectorAll('['+attr+']').forEach(b=>{
    b.onclick=()=>{ if(autoRunning)return; fn(b.getAttribute(attr)); beep(); afterEdit(); };
  });
  wire('data-mq',v=>{ ST.mk=v; aplicaMaquina(); });
  wire('data-rr',v=>{ ST.r=Number(v); });
  wire('data-av',v=>{ ST.av=Number(v); });
  wire('data-lm',v=>{ ST.lam=Number(v); });
  wire('data-xr',v=>{ RETO.ejes.r=Number(v); RETO.msg=''; RETO.resuelto=false; });
  wire('data-xa',v=>{ RETO.ejes.avance=Number(v); RETO.msg=''; RETO.resuelto=false; });
  wire('data-xl',v=>{ RETO.ejes.lam=Number(v); RETO.msg=''; RETO.resuelto=false; });
  const bp=el('btnPista');
  if(bp) bp.onclick=()=>{ if(autoRunning)return; pista(); };
}
// Una pista destapa UN eje de la calibración ganadora, en orden r → λ → avance, y
// dice cuántas calibraciones válidas siguen compatibles con lo destapado. Ninguna
// cierra la terna: el embudo llega a 1 sólo cuando ya has visto los tres ejes.
function pista(){
  const eje=PIS_EJE.find(e=>!RETO.pistas[e]);
  if(!eje){ showToast('💡 Ya has destapado los tres ejes: la calibración está sobre la mesa, sólo falta entregarla.'); return; }
  RETO.pistas[eje]=true; beep();
  const P=pisM(RETO.cfg.mk).find(p=>p.eje===eje);
  const val=eje==='lam'?f2(P.v):(eje==='avance'?f0(P.v)+'°':f0(P.v));
  const quedan=f0(P.n)+' de las '+f0(RETO.nval)+' calibraciones válidas de esta máquina';
  showToast('💡 <b>'+EJE_ROT[eje]+' = '+val+'.</b> Con eso quedan '+quedan+
    (P.n===RETO.nval?'. Esta pista no descarta ninguna: todas las válidas ya coincidían en ese eje.':'.'));
  afterEdit();
}
function retoSolveBuild(){
  const mk=RETO.cfg.mk;
  RETO.sol=solM(mk); RETO.nval=valM(mk).length;
  RETO.ejes={r:R_G[0], lam:LAM_G[0], avance:AV_G[0]};
  RETO.pistas={r:false,lam:false,avance:false};
  RETO.resuelto=false; RETO.msg='';
}
function updateScenarioInfo(){
  const d=el('scenarioInfo');
  d.style.display='block';
  d.innerHTML='<b>'+MODE_META[mode].nombre+'.</b> '+MODE_META[mode].mision;
}
function updateHwRot(){
  const c=cfgDe(mode), P=MAQ[c.mk], F=FUEL[P.fuel], R=CUR;
  el('hwrot').textContent=ICONO[c.mk]+' '+P.nom+' · '+f0(P.ncil)+
    (P.ncil===1?' cilindro':' cilindros')+' · '+f0(P.rpm)+' rpm · '+F.nom+' ('+P.iny+')';
  const fal=fallosDe(R).length;
  el('hwsub').textContent='r '+f0(c.r)+' · avance '+f0(c.av)+'° · λ '+f2(c.lam)+' → '+
    (R.valida?'calibración aceptada'
             :'rechazada por '+f0(fal)+(fal===1?' criterio':' criterios')+
              (R.rMecOk?'':' (y r supera el límite mecánico)'));
  el('geoTxt').textContent=
    'Ø '+f1(P.B*1000)+' × '+f1(P.S*1000)+' mm, biela '+f0(P.L*1000)+' mm · '+
    'cilindrada unitaria '+cm3(R.Vd)+' cm³ · cámara '+cm3(R.Vc)+' cm³ · '+
    'r efectiva tras el cierre de admisión '+f2(R.rEf)+' · '+
    'pistón a '+f2(R.Sp)+' m/s · servicio '+f0(P.horas)+' h/año y '+f0(P.wAnio)+
    ' kWh/año al freno → '+f1(P.wAnio/P.horas)+' kW medios frente a '+f1(R.pot/1000)+' kW aquí.';
}
function afterEdit(){
  buildControls();
  updateScenarioInfo();
  if(mode==='reto')updateRetoSpec();
  refreshAll();
}
function setMode(k){
  mode=k; animT=0;
  // El reto barre toda la rejilla de la máquina: se arma la primera vez que se
  // entra, no al cargar la página, para que el arranque no cueste cientos de ciclos.
  if(k==='reto'&&!RETO.sol) retoSolveBuild();
  MODES.forEach(m=>el('m_'+m).classList.toggle('on',m===k));
  el('p_mode').textContent=MODE_META[k].nombre;
  el('retoTitle').style.display=k==='reto'?'':'none';
  el('retoBox').style.display=k==='reto'?'':'none';
  buildControls(); updateScenarioInfo();
  clearDx(); buildQuiz(); refreshQuestion();
  if(k==='reto')updateRetoSpec();
  const cam=MODE_META[k].cam; S.moveTo(cam[0],cam[1]);
  aplicaMaquina();
  refreshAll();
}
// "Otro caso": en el reto cambia de máquina y rearma la partida; en los modos de
// estudio avanza al siguiente caso que enseña algo distinto del anterior.
function newSignal(){
  const sig=(arr,v)=>arr[(arr.indexOf(v)+1)%arr.length];
  const alOptimo=()=>{ const o=solM(ST.mk);
    if(o){ ST.r=o.r; ST.av=o.avance; ST.lam=o.lam; }
    else { ST.r=R_G[0]; ST.av=AV_G[0]; ST.lam=1.00; } };
  if(mode==='ciclo'){
    ST.mk=sig(MAQ_KEYS,ST.mk); alOptimo();
  }else if(mode==='compresion'){
    ST.av=sig(AV_G,ST.av);
    if(ST.av===AV_G[0]){ ST.mk=sig(MAQ_KEYS,ST.mk); alOptimo(); }
  }else if(mode==='mezcla'){
    ST.lam=sig(LAM_G,ST.lam);
    if(ST.lam===LAM_G[0]){ ST.mk=sig(MAQ_KEYS,ST.mk); alOptimo(); }
  }else if(mode==='censo'){
    ST.mk=sig(MAQ_KEYS,ST.mk); alOptimo();
  }else{
    RETO.cfg.mk=sig(MAQ_KEYS,RETO.cfg.mk);
    retoSolveBuild();
  }
  solved=false;
  aplicaMaquina();
  buildControls(); updateScenarioInfo();
  clearDx(); buildQuiz(); refreshQuestion();
  if(mode==='reto')updateRetoSpec();
  refreshAll();
  showToast('🔀 <b>Escenario nuevo.</b> '+MODE_META[mode].mision);
}

// ===================== 13. TELEMETRÍA E INFORME =====================
function teleRow(l,v,cls){
  return '<div class="trow"><span class="tl">'+l+'</span><span class="tv'+(cls?' '+cls:'')+'">'+v+'</span></div>';
}
const cls2=b=>b?'ok':'bad';
function filasPliego(mk,R){
  return pliegoFilas(mk,R).map(f=>
    teleRow(f[1],f[2]+'  <span style="opacity:.55">/ '+f[3]+'</span>',cls2(f[4]))).join('');
}
// Las cuatro filas que cambian con el fotograma. El resto de la telemetría es
// propiedad de la calibración, no del instante del ciclo.
function filasVivas(){
  return teleRow('ángulo de cigüeñal','<span id="tvTh">—</span>')+
         teleRow('presión en el cilindro','<span id="tvP">—</span>')+
         teleRow('temperatura de la masa','<span id="tvT">—</span>')+
         teleRow('quemado · detonación','<span id="tvX">—</span>');
}
function updateTele(){
  const c=cfgDe(mode), P=MAQ[c.mk], F=FUEL[P.fuel], R=CUR;
  let h='';
  h+=teleRow('máquina',ICONO[c.mk]+' '+P.nom);
  h+=teleRow('calibración','r '+f0(c.r)+' · avance '+f0(c.av)+'° · λ '+f2(c.lam));
  if(mode==='ciclo'||mode==='reto'){
    h+=filasVivas();
    h+=teleRow('presión de pico',f1(R.pmax/1e5)+' bar a '+f1(R.thPmax)+'° después del PMS');
    h+=teleRow('temperatura de pico',f0(R.Tmax)+' K');
    h+=teleRow('duración de la combustión Δθ',f1(R.dth)+'°');
    h+=teleRow('imep bruta − PMEP − FMEP',
      f2(R.imepG)+' − '+f2(R.pmep)+' − '+f2(R.fmep)+' bar');
    h+=teleRow('presión media al freno',f2(R.bmep)+' bar → '+f1(R.par)+' N·m, '+f1(R.pot/1000)+' kW');
    h+=teleRow('η indicada → η al freno',pc1(R.etaI)+' → '+pc1(R.etaB));
    h+=filasPliego(c.mk,R);
    h+=teleRow('coste de combustible a '+f0(ANIOS)+' años',fin(R.coste5,0)+' €',cls2(R.valida));
  }else if(mode==='compresion'){
    const sw=sweepR(c.mk,c.av,c.lam), s0=sw[0], sM=sw[R_G.indexOf(P.rMax)];
    const best=sw.filter(x=>x.r<=P.rMax&&x.valida).sort((a,b)=>b.etaB-a.etaB)[0];
    h+=teleRow('cilindrada unitaria · cámara',cm3(R.Vd)+' · '+cm3(R.Vc)+' cm³');
    h+=teleRow('r geométrica → r efectiva',f0(R.r)+' → '+f2(R.rEf));
    h+=teleRow('techo ideal con r geométrica',pc1(R.etaOtto));
    h+=teleRow('techo ideal con r efectiva',pc1(R.etaOttoEf));
    h+=teleRow('η al freno medida',pc1(R.etaB),cls2(R.valida));
    h+=teleRow('lo que se queda por el camino',f1(100*(R.etaOtto-R.etaB))+' puntos');
    h+=teleRow('calor a las paredes',pc1(R.Qfrac)+' del calor liberado');
    h+=teleRow('integral de detonación','I = '+f3(R.Ilw)+'  <span style="opacity:.55">/ < 1</span>',cls2(R.okDeton));
    h+=teleRow('de r '+f0(R_G[0])+' a r '+f0(P.rMax)+' el techo gana',
      f2((sM.etaOtto-s0.etaOtto)*100)+' puntos');
    h+=teleRow('y la máquina real gana',f2((sM.etaB-s0.etaB)*100)+' puntos',
      cls2(sM.etaB>=s0.etaB));
    h+=teleRow('mejor η al freno que pasa',
      best?'r = '+f0(best.r)+' · '+pc1(best.etaB):'ninguna con este avance y este λ',cls2(!!best));
  }else if(mode==='mezcla'){
    const sw=sweepL(c.mk,c.r,c.av);
    const pI=sw.slice().sort((a,b)=>b.etaI-a.etaI)[0];
    const pB=sw.slice().sort((a,b)=>b.etaB-a.etaB)[0];
    h+=teleRow('combustible',F.nom+' · RON '+f0(F.ron)+' · AFR '+f2(F.afr));
    h+=teleRow('dosado relativo λ · φ',f2(c.lam)+' · '+f3(1/c.lam));
    h+=teleRow('aire atrapado · combustible',f1(R.mAire*1e6)+' · '+f1(R.mComb*1e6)+' mg');
    h+=teleRow('calor liberado',f0(R.Q)+' J por ciclo y cilindro');
    h+=teleRow('rendimiento volumétrico',pc1(R.etaV));
    h+=teleRow('η indicada · η al freno',pc1(R.etaI)+' · '+pc1(R.etaB));
    h+=teleRow('consumo específico al freno',fin(R.bsfc,0)+' g/kWh');
    h+=teleRow('duración de la combustión Δθ',f1(R.dth)+'°  <span style="opacity:.55">/ ≤ '+f0(P.dthLim)+'°</span>',cls2(R.okEstab));
    h+=teleRow('temperatura en la brida',f0(R.Tbrida)+' K  <span style="opacity:.55">/ ≤ '+f0(P.tEscLim)+' K</span>',cls2(R.okEsc));
    h+=teleRow('ventana del pliego',f2(P.lamMin)+' – '+f2(P.lamMax)+(P.cat?' (catalizador)':''),cls2(R.okLam));
    h+=teleRow('máximo de η indicada','λ = '+f2(pI.lam));
    h+=teleRow('máximo de η al freno','λ = '+f2(pB.lam));
  }else{
    const cn=censoM(c.mk), s=solM(c.mk);
    const peor=CRIT.slice().sort((a,b)=>cn.tot[b]-cn.tot[a])[0];
    const dec=CRIT.slice().sort((a,b)=>cn.solo[b]-cn.solo[a])[0];
    h+=teleRow('configuraciones construibles',f0(cn.n)+' de '+f0(R_G.length*AV_G.length*LAM_G.length));
    h+=teleRow('válidas',f0(cn.validas),cls2(cn.validas>0));
    h+=teleRow('criterio con más bajas',CRIT_COR[peor]+' · '+f0(cn.tot[peor]));
    h+=teleRow('criterio decisor (en solitario)',
      cn.solo[dec]>0?CRIT_COR[dec]+' · '+f0(cn.solo[dec]):'ninguno');
    h+=teleRow('tu calibración',
      R.valida?'válida':'falla '+fallosDe(R).map(k=>CRIT_COR[k]).join(', '),cls2(R.valida));
    h+=teleRow('coste de combustible a '+f0(ANIOS)+' años',fin(R.coste5,0)+' €');
    h+=teleRow('la más barata válida',s?f0(s.coste5)+' €':'—',cls2(!!s));
  }
  el('tele').innerHTML=h;
  updateLive();
}
function updateLive(){
  const R=CUR; if(!R||!R.traza) return;
  const e1=el('tvTh'); if(!e1) return;
  const tr=R.traza, i=clamp(FR,0,tr.th.length-1);
  e1.textContent=gra(tr.th[i])+' ('+(tr.th[i]<0?'antes':'después')+' del PMS) · '+cm3(tr.V[i])+' cm³';
  el('tvP').textContent=f1(tr.p[i]/1e5)+' bar';
  el('tvT').textContent=f0(tr.T[i])+' K  ·  sin quemar '+f0(tr.Tu[i])+' K';
  el('tvX').textContent=pc1(tr.xb[i])+'  ·  I = '+f3(tr.I[i])+
    (tr.I[i]>=1?'  · AUTOENCENDIDO':'');
}

function updateReport(){
  const c=cfgDe(mode), P=MAQ[c.mk], F=FUEL[P.fuel], R=CUR;
  let t='';
  if(mode==='ciclo'){
    t='> '+P.nom+' a '+f0(P.rpm)+' rpm con '+F.nom+'. Se integra sólo el periodo cerrado, de IVC ('+
      f0(TH_IVC)+'°) a EVO (+'+f0(TH_EVO)+'°): '+f0((TH_EVO-TH_IVC)/H_PASO)+' pasos de '+f1(H_PASO)+'°.\n';
    t+='> En el cierre de admisión quedan atrapados '+cm3(R.Vivc)+' cm³ a '+f0(R.Tivc)+
      ' K, con '+pc1(R.fRes)+' de gas residual del ciclo anterior. Por eso la r que ve el gas es '+
      f2(R.rEf)+' y no '+f0(R.r)+': cuando la válvula se cerró, el pistón ya había subido '+
      f0(180+TH_IVC)+'° de cigüeñal desde el punto muerto inferior.\n';
    t+='> La chispa salta '+f0(c.av)+'° antes del PMS y la combustión dura '+f1(R.dth)+
      '°, así que el pico de presión cae en '+f1(R.thPmax)+'° con '+f1(R.pmax/1e5)+' bar y '+
      f0(R.Tmax)+' K.\n';
    t+='> El área del diagrama da '+f2(R.imepG)+' bar de presión media indicada bruta. El bombeo se '+
      'lleva '+f2(R.pmep)+' y la fricción '+f2(R.fmep)+', y queda '+f2(R.bmep)+' bar al freno: '+
      f1(R.par)+' N·m y '+f1(R.pot/1000)+' kW con '+f0(P.ncil)+
      (P.ncil===1?' cilindro.\n':' cilindros.\n');
    t+='> De todo el calor liberado, '+pc1(R.Qfrac)+' se va a las paredes antes de llegar al pistón. '+
      'La eficiencia baja de '+pc1(R.etaI)+' indicada a '+pc1(R.etaB)+' al freno.\n';
    t+='> Mientras tanto el gas sin quemar llega a '+f0(Math.max.apply(null,R.traza.Tu))+
      ' K y la cuenta de Livengood–Wu acaba en I = '+f3(R.Ilw)+
      (R.okDeton?': no le da tiempo a autoencenderse.\n':': el gas se enciende solo antes de que le llegue la llama.\n');
    t+=R.valida?'> Los '+f0(CRIT.length)+' criterios se cumplen. Coste de combustible a '+f0(ANIOS)+
        ' años: '+f0(R.coste5)+' €.'
      :'> Rechazada: falla '+fallosDe(R).map(k=>CRIT_ROT[k]).join(', ')+'.';
  }else if(mode==='compresion'){
    const sw=sweepR(c.mk,c.av,c.lam), s0=sw[0], sM=sw[R_G.indexOf(P.rMax)];
    const prim=sw.find(x=>x.r<=P.rMax&&!x.okDeton);
    const mejor=sw.filter(x=>x.r<=P.rMax&&x.valida).sort((a,b)=>b.etaB-a.etaB)[0];
    t='> Barrido de r con el avance en '+f0(c.av)+'° y λ = '+f2(c.lam)+
      '. El bloque no admite más de r = '+f0(P.rMax)+', así que de las '+f0(R_G.length)+
      ' relaciones de la rejilla sólo se pueden construir '+f0(sw.filter(x=>x.r<=P.rMax).length)+'.\n';
    t+='> El techo ideal de aire frío pasa de '+pc1(s0.etaOtto)+' a '+pc1(sM.etaOtto)+' ('+
      f2((sM.etaOtto-s0.etaOtto)*100)+' puntos). La máquina real pasa de '+pc1(s0.etaB)+' a '+
      pc1(sM.etaB)+' ('+f2((sM.etaB-s0.etaB)*100)+' puntos). El techo corre más del doble.\n';
    t+='> La diferencia no se pierde en el aire: al subir r la cámara se hace más estrecha, la '+
      'superficie por unidad de volumen crece y el calor a las paredes sube de '+pc1(s0.Qfrac)+
      ' a '+pc1(sM.Qfrac)+' del calor liberado.\n';
    t+=prim
      ? '> Y por debajo corre el reloj del autoencendido: I pasa de '+f3(s0.Ilw)+' en r = '+
        f0(s0.r)+' a '+f3(sM.Ilw)+' en r = '+f0(P.rMax)+', y cruza el 1 en r = '+f0(prim.r)+
        '. A partir de ahí no es que rinda menos: es que se rompe.\n'
      : '> Aquí el autoencendido no manda: I nunca llega a 1 ('+f3(s0.Ilw)+' → '+f3(sM.Ilw)+
        '), porque el '+F.nom.toLowerCase()+' resiste RON '+f0(F.ron)+
        '. El muro lo pone otro criterio del pliego.\n';
    t+=mejor
      ? '> Con este avance y este λ, la mejor que pasa el pliego entero es r = '+f0(mejor.r)+
        ' con '+pc1(mejor.etaB)+' al freno.'
      : '> Con este avance y este λ NINGUNA r pasa el pliego entero: hay que mover el avance o la mezcla.';
  }else if(mode==='mezcla'){
    const sw=sweepL(c.mk,c.r,c.av);
    const pI=sw.slice().sort((a,b)=>b.etaI-a.etaI)[0];
    const pB=sw.slice().sort((a,b)=>b.etaB-a.etaB)[0];
    const pobre=sw[sw.length-1], rico=sw[0];
    t='> '+F.nom+': AFR estequiométrico '+f2(F.afr)+' kg de aire por kg de combustible, '+
      f1(F.lhv/1e6)+' MJ/kg. Con λ = '+f2(c.lam)+' entran '+f1(R.mAire*1e6)+' mg de aire y '+
      f1(R.mComb*1e6)+' mg de combustible por ciclo y cilindro.\n';
    t+='> La llama no corre igual en todas las mezclas: la velocidad laminar de Metghalchi–Keck '+
      'tiene su máximo en λ = '+f3(1/F.phim)+' para este combustible, ligeramente del lado rico. '+
      'Por eso Δθ va de '+f1(rico.dth)+'° en λ = '+f2(rico.lam)+' a '+f1(pobre.dth)+'° en λ = '+
      f2(pobre.lam)+'.\n';
    t+='> El máximo de eficiencia indicada cae en λ = '+f2(pI.lam)+' y el de eficiencia al freno en '+
      'λ = '+f2(pB.lam)+'. '+(pI.lam===pB.lam
        ? 'Aquí coinciden, pero no por la misma razón: la fricción resta presión media, no un tanto por ciento.'
        : 'No coinciden: la fricción es una resta fija en presión media, así que al empobrecer baja la '+
          'imep y esa misma fmep pesa cada vez más.')+'\n';
    t+='> La temperatura en la brida va de '+f0(rico.Tbrida)+' K en λ = '+f2(rico.lam)+' a '+
      f0(pobre.Tbrida)+' K en λ = '+f2(pobre.lam)+', contra un límite de '+f0(P.tEscLim)+' K.\n';
    t+=P.cat
      ? '> Pero esta máquina lleva catalizador de tres vías, y ese sólo trabaja en λ = 1: la ventana '+
        'del pliego es '+f2(P.lamMin)+'–'+f2(P.lamMax)+' y no es negociable por mucho que la '+
        'eficiencia mejore fuera de ella.'
      : '> Esta máquina no lleva catalizador de tres vías, así que la ventana del pliego es '+
        f2(P.lamMin)+'–'+f2(P.lamMax)+' y queda margen real para empobrecer.';
  }else if(mode==='censo'){
    const cn=censoM(c.mk), s=solM(c.mk);
    const peor=CRIT.slice().sort((a,b)=>cn.tot[b]-cn.tot[a])[0];
    const dec=CRIT.slice().sort((a,b)=>cn.solo[b]-cn.solo[a])[0];
    const nulos=CRIT.filter(k=>cn.solo[k]===0);
    t='> De las '+f0(R_G.length*AV_G.length*LAM_G.length)+' combinaciones de la rejilla, esta '+
      'máquina sólo puede construir '+f0(cn.n)+' (r ≤ '+f0(P.rMax)+'), y de ésas pasan el pliego '+
      f0(cn.validas)+'.\n';
    t+='> El criterio que más reprueba es «'+CRIT_ROT[peor]+'» con '+f0(cn.tot[peor])+' bajas. '+
      'Pero eso no basta para saber qué hay que arreglar: casi siempre reprueba acompañado.\n';
    t+=cn.solo[dec]>0
      ? '> El decisor es «'+CRIT_ROT[dec]+'»: '+f0(cn.solo[dec])+' configuraciones que TODO lo demás '+
        'aprueba y sólo él tumba. Ésas son las que se recuperarían si se pudiera relajar ese único '+
        'criterio, y ninguna otra.\n'
      : '> Aquí ningún criterio tumba nada en solitario: todas las bajas van acompañadas, así que '+
        'relajar un criterio suelto no recupera ni una sola configuración.\n';
    t+=nulos.length
      ? '> Nunca deciden en solitario: '+nulos.map(k=>CRIT_ROT[k]).join(', ')+
        '. Aflojar cualquiera de ésos no abre ni una configuración nueva.\n'
      : '> Los '+f0(CRIT.length)+' criterios llegan a decidir en solitario alguna vez.\n';
    t+=s
      ? '> La más barata que pasa: r = '+f0(s.r)+', avance '+f0(s.avance)+'°, λ = '+f2(s.lam)+
        ' → '+f0(s.coste5)+' € de combustible a '+f0(ANIOS)+' años.'
      : '> Ninguna configuración pasa el pliego entero en esta máquina.';
  }else{
    const vistas=PIS_EJE.filter(e=>RETO.pistas[e]).length;
    t='> Reto sobre '+P.nom+'. Rejilla construible: '+f0(censoM(c.mk).n)+' calibraciones, de las '+
      'que '+f0(RETO.nval)+' pasan el pliego entero.\n';
    t+='> Se paga el combustible de '+f0(P.wAnio)+' kWh/año al freno durante '+f0(ANIOS)+
      ' años, a '+f2(F.precio)+' €/L de '+F.nom+' ('+f3(F.rho)+' kg/L).\n';
    t+='> Pistas destapadas: '+f0(vistas)+' de '+f0(PIS_EJE.length)+
      '. Ninguna cierra la terna ella sola.\n';
    t+='> Tu calibración: r = '+f0(c.r)+', avance '+f0(c.av)+'°, λ = '+f2(c.lam)+' → '+
      (R.valida?'válida, '+f0(R.coste5)+' €.\n':'rechazada por '+fallosDe(R).map(k=>CRIT_ROT[k]).join(', ')+'.\n');
    t+=RETO.msg?'> '+RETO.msg
      :'> Entrega cuando la tengas: se compara contra la más barata de las '+f0(RETO.nval)+' válidas.';
  }
  el('report').textContent=t;
}
function refreshAll(){
  computa();
  aplicaGeom();
  pintaBoard();
  updateTele();
  updateReport();
  updateHwRot();
}

// ===================== 14. RETO =====================
// El reto no compara contra una terna escrita a mano: barre la rejilla completa
// de la máquina, se queda con las que pasan los siete criterios y elige la de
// menor gasto de combustible. Se acepta CUALQUIER calibración válida que iguale
// ese gasto, no una terna concreta.
function updateRetoSpec(){
  const mk=RETO.cfg.mk, P=MAQ[mk], F=FUEL[P.fuel], s=RETO.sol, R=CUR;
  const emp=empM(mk).length, cn=censoM(mk);
  let h='<b>'+ICONO[mk]+' '+P.nom+'.</b> '+f0(P.ncil)+(P.ncil===1?' cilindro':' cilindros')+
        ' de Ø '+f1(P.B*1000)+' × '+f1(P.S*1000)+' mm a '+f0(P.rpm)+' rpm con '+F.nom+
        ' (RON '+f0(F.ron)+', '+f2(F.precio)+' €/L).<br>';
  h+='Servicio: '+f0(P.horas)+' h/año y '+f0(P.wAnio)+' kWh/año al freno durante '+f0(ANIOS)+
     ' años. Límite mecánico del bloque: r ≤ '+f0(P.rMax)+'.<br>';
  h+='<span style="color:var(--muted)">Pliego: detonación I &lt; 1 · presión ≤ '+f0(P.pLim/1e5)+
     ' bar · brida de escape ≤ '+f0(P.tEscLim)+' K · <b>bmep ≥ '+f1(P.bmepMin)+' bar</b> · λ en '+
     f2(P.lamMin)+'–'+f2(P.lamMax)+(P.cat?' (catalizador de tres vías)':'')+' · Δθ ≤ '+f0(P.dthLim)+
     '° · pico de presión entre 5 y 25° después del PMS.</span><br>';
  h+='Objetivo: la calibración <b>válida</b> más barata de alimentar a '+f0(ANIOS)+' años. Hay '+
     f0(RETO.nval)+' válidas de las '+f0(cn.n)+' construibles'+
     (emp>1?' y '+f0(emp)+' empatan en el mínimo.':' y el mínimo es único.')+'<br>';
  h+='Ahora mismo: <b>'+(R.valida?'válida':'no válida')+'</b>, '+fin(R.coste5,0)+' €'+
     (s&&R.valida&&R.coste5>s.coste5?' ('+f0(R.coste5-s.coste5)+' € por encima de la mejor)':'')+'.';
  if(RETO.msg) h+='<br><span style="color:'+(RETO.resuelto?OK_HEX:WARN_HEX)+'">'+RETO.msg+'</span>';
  el('retoSpec').innerHTML=h;
}
function checkReto(){
  const R=CUR, s=RETO.sol, P=MAQ[RETO.cfg.mk];
  if(!s){ RETO.msg='Esta máquina no tiene ninguna calibración válida en la rejilla.'; }
  else if(!R.valida){
    const f=fallosDe(R);
    RETO.msg='Todavía no: falla '+f.map(k=>CRIT_ROT[k]).join(', ')+
      (R.rMecOk?'':' (y además r supera el límite mecánico del bloque)')+
      '. Una calibración barata que no pasa el pliego no es barata: es un motor roto.';
  }else if(R.coste5>s.coste5+1e-9){
    RETO.msg='Válida, pero se bebe '+f0(R.coste5-s.coste5)+' € más de combustible en '+f0(ANIOS)+
      ' años ('+pcm(R.coste5/s.coste5-1)+'). Con '+f0(P.wAnio)+' kWh/año al freno, cada punto de '+
      'eficiencia que dejas sobre la mesa se paga '+f0(ANIOS)+' veces.';
    RETO.resuelto=false;
  }else{
    RETO.resuelto=true; solved=true;
    RETO.msg='✅ Calibración firmada: r '+f0(R.r)+' · avance '+f0(R.avance)+'° · λ '+f2(R.lam)+
      ' → '+pc1(R.etaB)+' al freno y '+f0(R.coste5)+' € a '+f0(ANIOS)+' años.';
    [523,659,784].forEach((f,i)=>setTimeout(()=>synth.beep(f,0.16,0.05),i*90));
  }
  if(!RETO.resuelto) synth.beep(220,0.12,0.05);
  afterEdit();
  showToast((RETO.resuelto?'✅ ':'⚠️ ')+RETO.msg);
}

// ===================== 15. CUESTIONARIO =====================
// Una pregunta por modo. Todas las cifras salen del motor sellado, no de la
// intuición: están comprobadas contra la simulación de la máquina que se nombra.
let QORD=[], answered=false;
const QUIZ={
  ciclo:{pregunta:'El sedán con su calibración aceptada (r 12 · avance 4° · λ 1,00) tiene un techo ideal de aire frío del 62,99 %, pero entrega el 37,42 % al freno. De esos 25,57 puntos que se pierden por el camino, ¿dónde se va la mayor parte?',
    opciones:[
      {t:'En la combustión real y el calor a las paredes: 19,01 puntos entre el techo con r efectiva y la eficiencia indicada.',ok:true,
       why:'Exacto. Ese tramo se lo comen cuatro cosas a la vez: la combustión dura 41,2° y no es instantánea, el 11,23 % del calor liberado se va a las paredes antes de empujar, el gas caliente tiene un γ mucho menor que el 1,4 del aire frío, y el escape se abre en +130° con presión todavía dentro. La fricción y el bombeo sólo se llevan 5,33 puntos, y el cierre tardío de admisión 1,24.'},
      {t:'En la fricción y el bombeo, que son lo que separa la eficiencia indicada de la eficiencia al freno.',
       why:'Sólo 5,33 puntos: la imep bruta es 11,728 bar, el bombeo se lleva 0,200 y la fricción 1,262, y queda 10,266 bar al freno. Es un quinto de la brecha, no la mayor parte.'},
      {t:'En el cierre tardío de la válvula de admisión, que baja la relación de compresión de 12 a 11,05.',
       why:'Ese efecto existe y está medido, pero es pequeño: el techo ideal pasa de 62,99 % con r geométrica a 61,75 % con r efectiva. 1,24 puntos de 25,57.'},
      {t:'En el gas residual del ciclo anterior, que ocupa sitio y no quema.',
       why:'El residual atrapado es el 2,84 % de la masa. Calienta la carga fresca a 344,5 K y diluye la mezcla, pero no es de lejos la partida grande: está incluido dentro del tramo de la combustión real.'},
    ]},
  compresion:{pregunta:'El motor de competición quema metanol, RON 109, y en TODA la rejilla su integral de detonación no pasa de 0,438: nunca pica. Con avance 10° y λ 1,00 su eficiencia al freno sigue subiendo hasta r = 14 (40,60 %). ¿Por qué el pliego se planta en r = 13?',
    opciones:[
      {t:'Porque en r = 14 la presión de pico llega a 80,89 bar y el bloque admite 78: el muro deja de ser químico y pasa a ser estructural.',ok:true,
       why:'Eso es. En r = 13 la presión de pico es 74,82 bar y pasa; en r = 14 son 80,89 contra un límite de 78 y se cae por presión, con I = 0,202. Que el combustible aguante no significa que el motor aguante: subir r sube la presión de pico aunque no haya la menor detonación.'},
      {t:'Porque a partir de r = 13 la eficiencia al freno empieza a caer.',
       why:'No cae: 39,89 % en r = 13 y 40,60 % en r = 14. El pliego no rechaza r = 14 por rendir menos, sino por romper el bloque.'},
      {t:'Porque el metanol no admite relaciones de compresión tan altas.',
       why:'Al revés: RON 109 y un calor de vaporización de 1 100 kJ/kg que enfría la carga. En esta máquina la detonación no reprueba ni una sola de las 210 configuraciones.'},
      {t:'Porque la temperatura en la brida de escape se dispara al subir r.',
       why:'Baja, no sube: de 1 227 K en r = 8 a 1 100 K en r = 14, porque el gas se expande más antes de abrir el escape. De hecho las r bajas son las que se caen por temperatura de escape.'},
    ]},
  mezcla:{pregunta:'En la planta de gas LP con r 12 y avance 10°, la eficiencia INDICADA es máxima en λ = 1,10 (41,49 %) pero la eficiencia AL FRENO es máxima en λ = 1,00 (37,71 %). ¿Por qué no caen en el mismo dosado?',
    opciones:[
      {t:'Porque la fricción se resta en presión media, no en tanto por ciento: al empobrecer la imep cae mucho más de lo que cae la fmep.',ok:true,
       why:'Exacto. De λ 1,00 a λ 1,10 la imep bruta baja de 11,690 a 10,701 bar (−8,5 %) mientras la fmep sólo baja de 0,982 a 0,931 bar (−5,2 %). Esa resta casi fija pesa cada vez más sobre una imep menor, y el máximo al freno se corre hacia el lado rico. Y aquí viene el remate: la que de verdad se puede vender es λ = 1,10, porque en λ = 1,00 la integral de detonación vale 1,169.'},
      {t:'Porque a λ = 1,10 la combustión dura más (55,3° frente a 52,0°) y eso ya está descontado en la eficiencia indicada.',
       why:'La duración sí cambia y sí está dentro de la indicada, pero entonces la indicada tendría que ser peor en λ = 1,10, y es mejor. La duración no explica que los dos máximos se separen.'},
      {t:'Porque a λ = 1,10 entra menos combustible y por eso el rendimiento sale más alto.',
       why:'La eficiencia ya está dividida por el combustible que entra: es trabajo por unidad de energía química. Meter menos combustible no sube la eficiencia por sí solo.'},
      {t:'Porque son dos medidas de cosas distintas y no tienen por qué compararse.',
       why:'Se comparan todo el rato, y en el mismo ciclo: la indicada es lo que el gas hace sobre el pistón y la del freno es lo que sale por el cigüeñal. Lo que hay entre las dos son el bombeo y la fricción, que es justo lo que mueve el máximo.'},
    ]},
  censo:{pregunta:'En la moto, «par entregado» reprueba 98 de las 180 configuraciones construibles y «temperatura de escape» reprueba 97: prácticamente empatan. Pero en solitario, el par sólo tumba 3 y el escape tumba 33. Si pudieras relajar UN criterio del pliego, ¿cuál te devolvería más configuraciones?',
    opciones:[
      {t:'La temperatura de escape: 33 configuraciones se caen sólo por él y todo lo demás ya lo cumplen.',ok:true,
       why:'Ésa es la lectura correcta del censo. Relajar el par recuperaría 3 configuraciones, porque las otras 95 que reprueba también fallan otra cosa a la vez y seguirían fuera. Un total alto sólo dice que ese criterio acompaña mucho; el que decide es el que reprueba solo.'},
      {t:'El par entregado, porque es el que más configuraciones reprueba de todos.',
       why:'Es la trampa del censo. Reprueba 98 veces, pero 95 de ellas en compañía de otro criterio: si mañana bajaras el par mínimo exigido, esas 95 seguirían suspendiendo por lo otro. Recuperarías 3.'},
      {t:'La presión máxima, que reprueba 72 veces y 18 en solitario.',
       why:'Es el segundo decisor de esta máquina, no el primero: 18 frente a 33. Buena intuición, cifra equivocada.'},
      {t:'Los dos por igual, porque 98 y 97 son prácticamente el mismo número.',
       why:'Los totales son casi iguales y las consecuencias no: 3 frente a 33, once veces más. Por eso el censo dibuja dos barras y no una.'},
    ]},
  reto:{pregunta:'El turbo GDI rinde 38,52 % al freno con r = 11 y avance 10°, casi dos puntos más que la calibración que sí se acepta (36,58 % con r = 10 y avance 4°). Todos los demás criterios los cumple: 88,51 bar contra un límite de 105, brida a 1 090 K contra 1 165, 17,13 bar de bmep contra 15,2 mínimos, λ = 1,00 dentro de la ventana del catalizador y r = 11 justo en el límite del bloque. ¿Por qué se descarta?',
    opciones:[
      {t:'Porque su integral de detonación vale 1,530: la mezcla sin quemar se autoenciende antes de que le llegue la llama.',ok:true,
       why:'Ése es el único criterio que falla, y basta. La cuenta de Livengood–Wu suma en cada paso el tiempo transcurrido dividido entre el retardo de autoencendido de Douaud–Eyzat; cuando llega a 1, la carga sin quemar se ha encendido sola. Una eficiencia que sólo existe hasta que el motor pica no es una eficiencia: la calibración aceptada retrasa la chispa a 4° y baja a r = 10 para dejar I en 0,880.'},
      {t:'Porque la presión de pico se pasa del límite del bloque.',
       why:'88,51 bar contra un límite de 105: sobra margen. El turbo tiene el bloque más fuerte de las cinco máquinas y aun así es el que peor lleva la compresión, por la presión de admisión.'},
      {t:'Porque λ = 1,00 deja al catalizador de tres vías fuera de su ventana de trabajo.',
       why:'λ = 1,00 es justo el centro de la ventana 0,98–1,02 que exige el catalizador. Ese criterio lo cumple.'},
      {t:'Porque el bloque no admite una relación de compresión de 11.',
       why:'La admite exactamente: r_máx del turbo es 11. Es la única de las cinco máquinas que no puede pasar de ahí, pero 11 sí es construible.'},
    ]},
};
function buildQuiz(){
  const q=QUIZ[mode];
  QORD=q.opciones.map((o,i)=>i);
  for(let i=QORD.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));
    const t=QORD[i];QORD[i]=QORD[j];QORD[j]=t; }
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
  btns.forEach((b,k)=>{ b.disabled=true; const o=q.opciones[QORD[k]];
    if(o.ok) b.classList.add('right'); else if(k===i) b.classList.add('wrong'); });
  const o=q.opciones[QORD[i]];
  synth.beep(o.ok?880:200,0.10,0.05);
  showToast((o.ok?'✅ ':'❌ ')+o.why);
}
function quizCorrectIndex(){ return QORD.indexOf(QUIZ[mode].opciones.findIndex(o=>o.ok)); }

// ===================== 16. SELECCIÓN Y ETIQUETAS =====================
// Cada pieza contesta con lo que decide en ESTA calibración y en ESTE fotograma.
// Ninguna cifra está escrita a mano: todas salen de la traza, de la máquina
// elegida o de las constantes selladas del motor.
function pickCtx(){
  const c=cfgDe(mode), P=MAQ[c.mk], R=CUR, tr=R&&R.traza;
  const i=tr?clamp(FR,0,tr.th.length-1):0;
  return {c,P,F:FUEL[P.fuel],R,tr,i,G:geom(P,c.r)};
}
const PICK_INFO={
  bloque:()=>{ const {P,R,G}=pickCtx();
    return ['Bloque y cárter',
      P.nom+': '+f0(P.ncil)+(P.ncil===1?' cilindro':' cilindros')+' de Ø '+f1(P.B*1000)+' × '+
      f1(P.S*1000)+' mm, '+cm3(G.Vd)+' cm³ por cilindro y '+cm3(G.Vd*P.ncil)+' cm³ en total. '+
      'A '+f0(P.rpm)+' rpm la velocidad media del pistón es '+f2(R.Sp)+' m/s, y ese número aparece '+
      'dos veces en el resultado: fija la turbulencia que acelera la llama ('+f2(CU_TURB)+' × Sp) y '+
      'pesa en la fricción por Chen-Flynn, ahora '+f3(R.fmep)+' bar de fmep. En 3D se dibuja UN '+
      'cilindro: par y potencia sí multiplican por '+f0(P.ncil)+', pero la masa, la presión y el calor '+
      'que ves son los de este cilindro solo.'];
  },
  camisa:()=>{ const {P,R,tr,i,G}=pickCtx();
    return ['Camisa y columna de gas',
      'La columna translúcida es el volumen encerrado V(θ) que se está integrando: ahora '+
      cm3(tr.V[i])+' cm³, entre '+cm3(G.Vc)+' cm³ en el punto muerto superior y '+cm3(R.Vivc)+
      ' cm³ en el cierre de admisión. Su altura por el área del pistón es exactamente V(θ), y su '+
      'color sigue la presión. La superficie que cede calor se toma como A = πB²/2 + 4V/B: con este '+
      'volumen son '+f1(area(G,tr.V[i],P.B)*1e4)+' cm², y por ahí se escapa '+pc1(R.Qfrac)+
      ' del calor liberado según Woschni (C₁ = '+f2(C1_WOS)+').'];
  },
  piston:()=>{ const {P,R,tr,i,G}=pickCtx();
    const th=tr.th[i]*DEG, st=Math.sin(th);
    const s=Math.sqrt(Math.max(1e-12,G.L*G.L-G.a*G.a*st*st));
    const x=G.L+G.a-G.a*Math.cos(th)-s;
    return ['Pistón, aros y bulón',
      'A '+gra(tr.th[i])+' del punto muerto superior la corona está '+f1(x*1000)+' mm por debajo del '+
      'PMS, o sea '+pc1(x/P.S)+' de la carrera. Esa posición sale del mecanismo biela-manivela exacto, '+
      'la misma fórmula que alimenta la física; no hay un seno de adorno por debajo. Los dos aros se '+
      'dibujan, pero el modelo NO tiene fuga: entre el cierre de admisión y la apertura de escape la '+
      'masa encerrada es constante, '+f2(R.mTot*1e6)+' mg.'];
  },
  biela:()=>{ const {P,G}=pickCtx();
    return ['Biela',
      'L = '+f0(P.L*1000)+' mm sobre una manivela de a = '+f2(G.a*1000)+' mm: la relación L/a vale '+
      f2(P.L/G.a)+'. Ese cociente es lo único que separa el mecanismo real del seno de libro. Cuanto '+
      'más corta es la biela frente a la manivela, más se adelanta el pistón en la primera mitad de la '+
      'carrera y más se deforma V(θ) respecto de la curva ideal. Aquí se integra s = √(L² − a²·sen²θ) '+
      'tanto en el dibujo como en la ecuación de estado.'];
  },
  cigue:()=>{ const {P,R}=pickCtx();
    const ms=(TH_EVO-TH_IVC)/(P.rpm*6)*1000;
    return ['Cigüeñal, contrapesos y volante',
      'Gira a '+f0(P.rpm)+' rpm, así que los '+gra(TH_EVO-TH_IVC)+' del tramo cerrado que se simulan '+
      'duran '+f1(ms)+' ms en el motor real; el pizarrón los estira a '+f1(PER3D)+' s para que se '+
      'puedan mirar. Lo que sale por este eje es par y potencia de la máquina completa: '+f1(R.par)+
      ' N·m y '+f1(R.pot/1000)+' kW con los '+f0(P.ncil)+(P.ncil===1?' cilindro':' cilindros')+
      '. La presión media efectiva, en cambio, es por unidad de cilindrada: '+f2(R.bmep)+' bar.'];
  },
  culata:()=>{ const {c,P,R,G}=pickCtx();
    return ['Culata y junta',
      'La altura libre de la cámara vale S/(r−1) = '+f2(P.S/(c.r-1)*1000)+' mm con r = '+f0(c.r)+
      ', y el volumen muerto '+cm3(G.Vc)+' cm³. Sube un punto la relación de compresión y la cámara '+
      'ADELGAZA en pantalla: no es un efecto decorativo, es la misma cota que entra en V(θ). La '+
      'relación efectiva, medida desde donde de verdad empieza la compresión, es r_ef = '+f3(R.rEf)+
      ', siempre menor que la nominal porque la admisión cierra '+f0(180+TH_IVC)+
      '° después del punto muerto inferior. Con r se calcula el rendimiento de libro ('+pc1(R.etaOtto)+
      '); con r_ef, el honesto ('+pc1(R.etaOttoEf)+').'];
  },
  bujia:()=>{ const {c,R}=pickCtx();
    return ['Bujía',
      'Salta a '+gra(c.av)+' antes del PMS. En ese instante la mezcla sin quemar está a '+f0(R.Ts)+
      ' K y '+bar(R.pS)+' bar; con esa presión y esa temperatura la velocidad laminar de llama de '+
      'Metghalchi-Keck vale '+f3(R.sL)+' m/s y, mezclada con la turbulencia por Damköhler (exponente '+
      f2(Q_DAMK)+'), la turbulenta sube a '+f2(R.sT)+' m/s. De ahí sale la duración de la combustión: '+
      'Δθ = '+f1(R.dth)+'°. La chispa no es un instante mágico: es el arranque de una Wiebe con '+
      'a = '+f3(A_WIEBE)+' y m = '+f0(M_WIEBE)+'.'];
  },
  vadm:()=>{ const {P,R}=pickCtx();
    return ['Válvula de admisión (permanece cerrada)',
      'Este laboratorio integra SÓLO el tramo cerrado, de '+gra(TH_IVC)+' a '+gra(TH_EVO)+
      ': la válvula no se abre en el 3D porque el modelo no simula ni el cruce ni el llenado. Lo que sí '+
      'sale de aquí es el estado atrapado: con p_adm = '+bar(P.pAdm)+' bar y T_adm = '+f0(P.Tadm)+
      ' K quedan encerrados '+f2(R.mTot*1e6)+' mg, de los cuales '+pc1(R.fRes)+
      ' son gas residual caliente del ciclo anterior. El rendimiento volumétrico que resulta ('+
      pc1(R.etaV)+') es una CONSECUENCIA de esa presión impuesta, no una curva de llenado medida.'];
  },
  vesc:()=>{ const {P,R}=pickCtx();
    return ['Válvula de escape (permanece cerrada)',
      'Abre a '+gra(TH_EVO)+' y ahí termina la integración. El gas se expande desde ese punto hasta '+
      bar(P.pEscBase)+' bar de forma isentrópica: de '+f0(R.Tevo)+' K en la apertura quedan '+
      f0(R.Texh)+' K en el conducto. No hay pulso de escape ni pérdida real de bombeo; el bombeo entra '+
      'como un pmep constante de '+f2(R.pmep)+' bar, que es lo que separa la '+f3(R.imepG)+
      ' bar indicada bruta de la '+f3(R.imepN)+' bar neta. Lo que quede sin quemar después de esta '+
      'apertura no se contabiliza.'];
  },
  llama:()=>{ const {R,tr,i}=pickCtx();
    return ['Frente de llama',
      'La esfera es la fracción quemada x_b de la Wiebe, ahora '+pc1(tr.xb[i])+'; su radio crece como '+
      'la raíz cúbica de x_b, como un núcleo esférico. La masa sin quemar está a '+f0(tr.Tu[i])+
      ' K y el promedio del cilindro a '+f0(tr.T[i])+' K: esa diferencia es la que decide si el extremo '+
      'se autoenciende antes de que la llama llegue. La combustión completa dura '+f1(R.dth)+
      '° de cigüeñal y suelta '+f0(R.Q)+' J por ciclo y cilindro, de los que '+pc1(R.Qfrac)+
      ' se van por las paredes.'];
  },
  mano:()=>{ const {P,R,tr,i}=pickCtx();
    return ['Manómetro de cilindro',
      'La aguja sigue p(θ) = m·R·T/V con la masa encerrada constante: ahora '+bar(tr.p[i])+
      ' bar. El pico del ciclo es '+f1(R.pmax/1e5)+' bar a '+f1(R.thPmax)+'° después del PMS, contra '+
      'un límite de bloque de '+f0(P.pLim/1e5)+' bar; la escala llega un 10 % más arriba ('+
      f0(P.pLim*1.1/1e5)+' bar) y las marcas rojas empiezan al 80 % de esa escala. La posición del '+
      'pico importa tanto como su altura: por debajo de 5° el gas empuja contra un pistón que todavía '+
      'sube, y por encima de 25° la expansión ya no aprovecha la presión.'];
  },
  brida:()=>{ const {P,R}=pickCtx();
    return ['Brida de escape y termopar',
      'El termopar no está pegado a la válvula: está en la brida del colector, y para cuando el gas '+
      'llega ya cedió calor al conducto. Se modela como T_brida = T_pared + '+f2(K_PORT)+
      '·(T_escape − T_pared) con T_pared = '+f0(P.Tpar)+' K, así que de los '+f0(R.Texh)+
      ' K del gas quedan '+f0(R.Tbrida)+' K en la sonda, contra un límite de '+f0(P.tEscLim)+
      ' K. El codo se pone al rojo con la temperatura de brida, no con la del cilindro: es la que '+
      'aguantan la válvula, el colector y —si lo hay— el catalizador.'];
  },
  deton:()=>{ const {F,R,tr,i}=pickCtx();
    const I=tr.I[i];
    return ['Sensor de detonación',
      'El piezoeléctrico se pinta con la integral de Livengood-Wu I = ∫dθ/(6N·τ) acumulada HASTA ESTE '+
      'fotograma: I = '+f3(I)+(I>=1?', o sea que la mezcla del extremo ya se autoencendió.':
      '; el testigo pasa a ámbar a media integral y parpadea en rojo al llegar a 1.')+' Al final del '+
      'ciclo la integral vale '+f3(R.Ilw)+'. El retraso τ es el de Douaud-Eyzat, τ = '+f2(DE_A)+
      '·(RON/100)^'+f3(DE_N)+'·p^('+f1(DE_P)+')·exp('+f0(DE_B)+'/T) ms, evaluado sobre el gas SIN '+
      'quemar; el combustible es '+F.nom+' con RON '+f0(F.ron)+'. La integral se corta cuando la llama '+
      'ya consumió el '+pc1(XB_KNOCK)+' de la carga: lo quemado no puede detonar.'];
  },
  cuadro:()=>{ const {c,R}=pickCtx();
    const FS=pliegoFilas(c.mk,R), mal=FS.filter(f=>!f[4]);
    return ['Cuadro de recepción',
      'Siete pilotos, uno por criterio del pliego, de arriba abajo: '+FS.map(f=>f[1]).join(', ')+'. '+
      (mal.length? ('Ahora hay '+f0(mal.length)+' en rojo: '+
        mal.map(f=>f[1]+' ('+f[2]+' contra '+f[3]+')').join('; ')+'.')
                 : 'Ahora los siete están en verde.')+
      ' Verde no quiere decir buena calibración: quiere decir ENTREGABLE. La más barata de alimentar '+
      'entre las entregables es otra cosa, y ésa es la que pide el reto.'];
  },
};

// El pizarrón también responde: cada modo explica qué se está mirando.
function boardClick(){
  const c=cfgDe(mode), P=MAQ[c.mk], R=CUR;
  if(mode==='ciclo'){
    showToast('<b>El ciclo cerrado</b> · Arriba, p(θ) y T(θ) integradas con Runge-Kutta de cuarto '+
      'orden entre '+gra(TH_IVC)+' y '+gra(TH_EVO)+'. Abajo a la izquierda, el mismo ciclo en p–V: '+
      'el área encerrada es el trabajo indicado bruto, '+f3(R.imepG)+' bar de imep. La escalera de '+
      'la derecha reparte los '+f1(100*(R.etaOtto-R.etaB))+' puntos que separan el rendimiento de libro del que '+
      'llega al freno.');
  }else if(mode==='compresion'){
    const sw=sweepR(c.mk,c.av,c.lam), val=sw.filter(x=>x.valida).length;
    showToast('<b>Barrido de r</b> · Con avance '+gra(c.av)+' y λ = '+f2(c.lam)+' fijos, la eficiencia '+
      'sube con r por el aire ideal, pero la integral de detonación sube más deprisa. De las '+
      f0(R_G.length)+' relaciones de la rejilla, '+f0(sw.filter(x=>x.rMecOk).length)+' caben en este '+
      'bloque y '+f0(val)+(val===1?' pasa':' pasan')+' el pliego completo. La curva no tiene un tope '+
      'termodinámico: tiene un tope de material y de combustible.');
  }else if(mode==='mezcla'){
    showToast('<b>Barrido de λ</b> · La curva de rendimiento indicado y la de rendimiento al freno '+
      'no tienen por qué picar en el mismo sitio: la primera premia el aire de sobra, la segunda paga '+
      'la fricción con el par que queda. '+(P.cat?('Además este motor lleva catalizador de tres vías, '+
      'que sólo trabaja entre λ '+f2(P.lamMin)+' y '+f2(P.lamMax)+': fuera de esa ventana la mezcla es '+
      'inadmisible aunque el motor ande.'):('Este motor no lleva catalizador de tres vías, así que la '+
      'ventana de mezcla es ancha —de '+f2(P.lamMin)+' a '+f2(P.lamMax)+'— y la decide el propio motor, '+
      'no el postratamiento.')));
  }else if(mode==='censo'){
    const cn=censoM(c.mk);
    showToast('<b>Censo del pliego</b> · Se construyen las '+f0(cn.n)+' calibraciones que caben en '+
      'este bloque y se cuenta cada criterio dos veces: cuántas veces falla en total y cuántas veces '+
      'falla EN SOLITARIO. La segunda columna es la que manda, porque un criterio que nunca decide '+
      'solo nunca es la razón real de un rechazo. Sobreviven '+f0(cn.validas)+'.');
  }else{
    showToast('<b>Reto</b> · Se te pide la calibración válida más barata de alimentar durante '+
      f0(ANIOS)+' años, no la más eficiente. Las tres pistas se abren de una en una y cada una dice '+
      'cuántas de las válidas comparten un valor de ese eje: eso estrecha la búsqueda sin regalar la '+
      'terna. Hay '+f0(RETO.nval)+' válidas.');
  }
}

pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  const o=hit&&hit.object;
  if(!o) return;
  if(o===bmesh){ boardClick(); synth.beep(620,0.05,0.05); return; }
  let n=o, k=null;
  while(n&&!k){ if(n.userData&&n.userData.key) k=n.userData.key; n=n.parent; }
  if(!k||!PICK_INFO[k]) return;
  const inf=PICK_INFO[k]();
  if(!inf) return;
  synth.beep(760,0.05,0.05);
  showToast('<b>'+inf[0]+'</b> · '+inf[1]);
});

// ===================== 17. RECORRIDO GUIADO =====================
// Una sola historia: subir la relación de compresión paga, pero el que pone el
// techo no es la termodinámica sino la detonación; el techo se mueve si cambias
// el combustible; la mezcla que más rinde por dentro no es la que más entrega
// al freno; y la calibración que se firma es la más barata de las ENTREGABLES.
// Ninguna cifra de los avisos está escrita a mano: todas se recalculan aquí.
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function runAuto(){
  if(autoRunning) return;
  autoRunning=true;
  const b=el('btnAuto'), rot=b.textContent;
  b.textContent='⏳ Recorriendo…';
  synth.init();synth.resume();clearDx();
  try{
    // --- 1. un ciclo entero, y dónde se queda cada punto ----------------
    ST.mk='sedan'; ST.r=R_G[0]; ST.av=16; ST.lam=1.00;
    setMode('ciclo');
    {
      const P=maqAct(), R=CUR;
      showToast('🔧 <b>Un ciclo cerrado, entero.</b> '+P.nom+' con la compresión más floja de la '+
        'rejilla (r = '+f0(R.r)+'). El aire frío de libro promete '+pc1(R.etaOtto)+
        ', pero al freno llegan '+pc1(R.etaB)+'. Los '+f1(100*(R.etaOtto-R.etaB))+' puntos que '+
        'faltan tienen destinatario: '+f1(100*(R.etaOtto-R.etaOttoEf))+' porque la compresión no '+
        'empieza en el punto muerto inferior sino en el cierre de admisión (r_ef = '+f3(R.rEf)+'), '+
        f1(100*(R.etaOttoEf-R.etaI))+' por la combustión real, las paredes y la apertura de escape, '+
        'y '+f1(100*(R.etaI-R.etaB))+' por bombeo y fricción. Ninguno es un factor de corrección: '+
        'los tres salen de integrar el ciclo.');
    }
    await sleep(6200);

    // --- 2. subir r paga… hasta que detona -----------------------------
    setMode('compresion');
    {
      const P=maqAct(), sw=sweepR(ST.mk,ST.av,ST.lam);
      const cabe=sw.filter(x=>x.rMecOk), a=cabe[0], z=cabe[cabe.length-1];
      const val=cabe.filter(x=>x.valida);
      const knock=cabe.find(x=>!x.okDeton);
      showToast('📈 <b>Sube la compresión.</b> De r = '+f0(a.r)+' a r = '+f0(z.r)+' el rendimiento de '+
        'aire frío sube de '+pc1(a.etaOtto)+' a '+pc1(z.etaOtto)+' y el que llega al freno de '+
        pc1(a.etaB)+' a '+pc1(z.etaB)+': '+f1(100*(z.etaB-a.etaB))+' puntos reales. Pero la integral '+
        'de detonación sube más deprisa —de '+f3(a.Ilw)+' a '+f3(z.Ilw)+'— y el pico de presión pasa '+
        'de '+f1(a.pmax/1e5)+' a '+f1(z.pmax/1e5)+' bar contra los '+f0(P.pLim/1e5)+' que aguanta el '+
        'bloque. De las '+f0(cabe.length)+' que caben (r ≤ '+f0(P.rMax)+') sólo '+f0(val.length)+
        (val.length===1?' pasa':' pasan')+' el pliego entero'+
        (knock?'; la primera que se autoenciende es r = '+f0(knock.r)+' con I = '+f3(knock.Ilw):'')+
        '. El techo no lo pone la termodinámica.');
    }
    await sleep(6200);

    // --- 3. el techo no es termodinámico: es el combustible -------------
    ST.mk='compet'; ST.av=10; ST.lam=1.00; aplicaMaquina();
    ST.r=R_G.filter(x=>x<=MAQ[ST.mk].rMax).pop();
    afterEdit();
    {
      const P=maqAct(), F=FUEL[P.fuel], R=CUR;
      let peor=null;
      for(const av of AV_G) for(const l of LAM_G){
        const x=sim(ST.mk,ST.r,av,l); if(!peor||x.Ilw>peor.Ilw) peor=x;
      }
      showToast('⛽ <b>Cambia el combustible y el techo se mueve.</b> Este motor quema '+F.nom+
        ': RON '+f0(F.ron)+' y '+f0(F.hlv/1000)+' kJ/kg de calor de vaporización, tanto que al '+
        'evaporarse enfría la carga '+f1(R.dTev)+' K antes de comprimirla. Con r = '+f0(R.r)+
        ' —la más alta que aguanta el bloque— y probando los '+f0(AV_G.length*LAM_G.length)+
        ' encendidos y mezclas del catálogo, la integral de detonación no pasa de '+f3(peor.Ilw)+
        ': aquí no se autoenciende. Y aun así r = '+f0(R.r)+' no se puede firmar — el pico llega a '+
        f2(R.pmax/1e5)+' bar contra los '+f0(P.pLim/1e5)+' del bloque. Quitas un techo y aparece otro.');
    }
    await sleep(6200);

    // --- 4. la mezcla que más rinde no es la que más entrega ------------
    ST.mk='planta'; ST.r=12; ST.av=10; ST.lam=LAM_G[0]; aplicaMaquina();
    setMode('mezcla');
    {
      const sl=sweepL(ST.mk,ST.r,ST.av);
      const mI=sl.reduce((a,x)=>x.etaI>a.etaI?x:a);
      const mB=sl.reduce((a,x)=>x.etaB>a.etaB?x:a);
      const val=sl.filter(x=>x.valida);
      showToast('🌬️ <b>Empobrece la mezcla.</b> El rendimiento INDICADO pica en λ = '+f2(mI.lam)+
        ' con '+fN(100*mI.etaI,2)+' %, y el que llega al FRENO pica en λ = '+f2(mB.lam)+' con '+
        fN(100*mB.etaB,2)+' %: dos picos separados por centésimas pero en mezclas distintas. Con más '+
        'aire el ciclo mejora y la presión media al freno cae de '+f2(mB.bmep)+' a '+f2(mI.bmep)+
        ' bar, mientras la fricción sólo baja de '+f3(mB.fmep)+' a '+f3(mI.fmep)+' bar: el par se '+
        'resiente antes que el ciclo. Y aquí decide un tercero — la de más par tiene I = '+
        f3(mB.Ilw)+' y la de más ciclo, '+f3(mI.Ilw)+'. De las '+f0(LAM_G.length)+' mezclas del '+
        'catálogo '+(val.length===1?'sólo 1 es entregable: λ = '+f2(val[0].lam):
        'son entregables '+f0(val.length))+'.');
    }
    await sleep(6200);

    // --- 5. y si hay catalizador, la ventana la decide el postratamiento -
    ST.mk='sedan'; ST.r=12; ST.av=AV_G[0]; ST.lam=1.00; aplicaMaquina(); afterEdit();
    {
      const P=maqAct(), sl=sweepL(ST.mk,ST.r,ST.av);
      const mI=sl.reduce((a,x)=>x.etaI>a.etaI?x:a);
      const base=sl.find(x=>Math.abs(x.lam-1)<1e-9);
      const val=sl.filter(x=>x.valida), fmI=fallosDe(mI);
      showToast('🧪 <b>Ahora con catalizador de tres vías.</b> '+P.nom+' sólo puede trabajar entre '+
        'λ '+f2(P.lamMin)+' y '+f2(P.lamMax)+': fuera de esa ventana el catalizador no puede reducir '+
        'NOx y oxidar CO al mismo tiempo. Mira λ = '+f2(mI.lam)+': iguala el rendimiento indicado de '+
        'λ = '+f2(base.lam)+' —'+fN(100*mI.etaI,2)+' % contra '+fN(100*base.etaI,2)+' %— y aun así '+
        (fmI.length?'está descartada por '+fmI.map(k=>CRIT_COR[k]).join(' y ')
                   :'pasa el pliego entero')+'. Encima gastaría más combustible por kWh al freno que '+
        'la de dosado exacto: '+f1(mI.bsfc)+' contra '+f1(base.bsfc)+' g/kWh, porque su presión media '+
        'cae a '+f2(mI.bmep)+' bar frente a los '+f1(P.bmepMin)+' que exige el pliego. De las '+
        f0(LAM_G.length)+' mezclas queda '+f0(val.length)+'. El límite no siempre está dentro del '+
        'cilindro.');
    }
    await sleep(6200);

    // --- 6. el censo: quién decide de verdad ---------------------------
    ST.mk='moto'; ST.r=R_G[0]; ST.av=AV_G[0]; ST.lam=1.00; aplicaMaquina();
    setMode('censo');
    {
      const C=censoM(ST.mk);
      const peor=CRIT.slice().sort((a,b)=>C.tot[b]-C.tot[a])[0];
      const solos=CRIT.filter(k=>C.solo[k]>0).sort((a,b)=>C.solo[b]-C.solo[a]);
      showToast('📊 <b>Las '+f0(C.n)+' calibraciones que caben en este bloque, por el pliego.</b> '+
        'Sobreviven '+f0(C.validas)+'. El criterio que más tumba es «'+CRIT_ROT[peor]+'» con '+
        f0(C.tot[peor])+' bajas, pero esa columna engaña: casi siempre falla acompañado. La que '+
        'manda es la de fallar EN SOLITARIO, porque ahí es donde el criterio es la razón real del '+
        'rechazo: '+(solos.length?solos.map(k=>CRIT_ROT[k]+' '+f0(C.solo[k])).join(', ')
                                 :'aquí ninguno la tiene')+'.');
    }
    await sleep(6200);

    // --- 7. el encargo -------------------------------------------------
    RETO.cfg.mk='turbo'; retoSolveBuild();
    setMode('reto');
    {
      const P=MAQ[RETO.cfg.mk], F=FUEL[P.fuel], s=RETO.sol;
      showToast('🎯 <b>El encargo.</b> De las '+f0(RETO.nval)+' calibraciones válidas del '+P.nom+
        ', la más barata de ALIMENTAR durante '+f0(ANIOS)+' años. El servicio son '+f0(P.wAnio)+
        ' kWh/año al freno; con '+pc1(s.etaB)+' de rendimiento eso son '+f0(s.bsfc)+
        ' g/kWh de '+F.nom+' a '+f2(F.precio)+' €/L, es decir '+fin(s.coste5,0)+' € en total. Cada '+
        'punto de rendimiento que dejes sobre la mesa se paga '+f0(ANIOS)+' veces.');
    }
    await sleep(6000);

    // --- 8. la mejor de todas no siempre se puede firmar ----------------
    {
      const P=MAQ[RETO.cfg.mk], s=RETO.sol;
      const rs=R_G.filter(r=>r<=P.rMax);
      let mejor=null;
      for(const r of rs) for(const av of AV_G) for(const l of LAM_G){
        const x=sim(RETO.cfg.mk,r,av,l); if(!mejor||x.etaB>mejor.etaB) mejor=x;
      }
      RETO.ejes={r:mejor.r, avance:mejor.avance, lam:mejor.lam};
      RETO.msg=''; RETO.resuelto=false; afterEdit();
      showToast('🏁 <b>La que más rinde.</b> De las '+f0(rs.length*AV_G.length*LAM_G.length)+
        ' calibraciones que caben en este bloque, la de mayor rendimiento al freno es r = '+
        f0(mejor.r)+' · avance '+gra(mejor.avance)+' · λ = '+f2(mejor.lam)+' con '+pc1(mejor.etaB)+
        ', frente a '+pc1(s.etaB)+' de la aceptada más barata ('+pcm(mejor.etaB/s.etaB-1)+
        '). Entrégala y mira qué contesta el pliego.');
      await sleep(2400);
      checkReto();
    }
    await sleep(6200);

    // --- 9. la que sí se firma -----------------------------------------
    {
      const s=RETO.sol;
      RETO.ejes={r:s.r, avance:s.avance, lam:s.lam};
      RETO.msg=''; RETO.resuelto=false; afterEdit();
      await sleep(1800);
      checkReto();
    }
    await sleep(6000);
    answer(quizCorrectIndex());
  } finally {
    autoRunning=false;
    el('btnAuto').textContent=rot;
    buildControls();
  }
}

// ===================== 18. ANIMACIÓN, EVENTOS Y ARRANQUE =====================
// El 3D se repinta en cada cuadro porque el pistón, la biela y el frente de llama
// van sobre la traza; la telemetría viva se refresca a ~12 Hz, que es de sobra
// para leerla y evita rehacer el HTML del panel sesenta veces por segundo.
let liveT=0;
S.setAnimate(dt=>{
  animT+=dt;
  pinta3D();
  liveT+=dt;
  if(liveT>=0.08){ liveT=0; updateLive(); }
});

MODES.forEach(m=>{ el('m_'+m).onclick=()=>{ if(!autoRunning) setMode(m); }; });
el('btnAuto').onclick=()=>{ if(!autoRunning) runAuto(); };
el('btnNew').onclick=()=>{ if(autoRunning) return; newSignal(); };
el('btnCheck').onclick=()=>{ if(autoRunning) return; checkReto(); };
const soundBtn=el('soundBtn');
if(soundBtn){ soundBtn.onclick=()=>{ synth.toggle(); soundBtn.textContent=synth.isOn()?'🔊':'🔇'; }; }
document.addEventListener('pointerdown',()=>{ synth.init(); synth.resume(); },{once:true});

S.start();
setMode('ciclo');

// ===================== 19. PUENTE DE PRUEBAS =====================
// Todo lo que la Capa 2 necesita para comprobar en un navegador de verdad que lo
// que se ve en pantalla es exactamente lo que calculó el motor sellado.
window.__labDebug={
  // --- modos
  mode:()=>mode, setMode, modes:()=>MODES.slice(), modeMeta:()=>MODE_META,
  // --- constantes del dominio
  R_GAS, P_ATM, CP_REF, DEG, H_PASO, TH_IVC, TH_EVO, A_WIEBE, M_WIEBE,
  C1_WOS, C2_WOS, N_MOT, CU_TURB, Q_DAMK, T_U_REF, P_U_REF, ETA_COMB,
  CF_A, CF_B, CF_C, CF_D, XB_KNOCK, DE_A, DE_N, DE_P, DE_B, K_TAU, K_PORT, ANIOS,
  R_G, AV_G, LAM_G, NPTS, NMEC, PER3D, ESC3,
  // --- catálogo y pliego
  FUEL, MAQ, MAQ_KEYS, CRIT, CRIT_ROT, CRIT_COR, ICONO, ROT,
  // --- motor sellado
  cpAire, gammaAire, gammaQuem, gamma, cv:cvGas, geom, vol, dvol, area, sLam, wiebe, dwiebe, tauDE,
  sim, barrido, censo, solucion, validas, pistas, pliegoFilas, fallosDe,
  simT, censoM, solM, valM, empates, empM, pistasEje, pisM, sweepR, sweepL,
  // --- estado vivo
  st:()=>({...ST}), cur:()=>CUR, cfg:()=>cfgDe(mode), frame:()=>FR, maq:()=>maqAct(),
  reto:()=>({cfg:{...RETO.cfg}, ejes:{...RETO.ejes}, sol:RETO.sol, nval:RETO.nval,
             resuelto:RETO.resuelto, msg:RETO.msg, pistas:{...RETO.pistas}}),
  // --- setters equivalentes a los botones
  setMaquina:v=>{ ST.mk=v; aplicaMaquina(); afterEdit(); },
  setR:v=>{ ST.r=Number(v); aplicaMaquina(); afterEdit(); },
  setAv:v=>{ ST.av=Number(v); afterEdit(); },
  setLam:v=>{ ST.lam=Number(v); afterEdit(); },
  setST:(mk,r,av,lam)=>{ ST.mk=mk; ST.r=Number(r); ST.av=Number(av); ST.lam=Number(lam);
    aplicaMaquina(); afterEdit(); },
  newSignal,
  // --- reto
  setRetoMaquina:v=>{ RETO.cfg.mk=v; retoSolveBuild(); afterEdit(); },
  setRetoR:v=>{ RETO.ejes.r=Number(v); RETO.msg=''; RETO.resuelto=false; afterEdit(); },
  setRetoAv:v=>{ RETO.ejes.avance=Number(v); RETO.msg=''; RETO.resuelto=false; afterEdit(); },
  setRetoLam:v=>{ RETO.ejes.lam=Number(v); RETO.msg=''; RETO.resuelto=false; afterEdit(); },
  setReto:(r,av,lam)=>{ RETO.ejes={r:Number(r), avance:Number(av), lam:Number(lam)};
    RETO.msg=''; RETO.resuelto=false; afterEdit(); },
  check:()=>checkReto(), pista:()=>pista(), retoSolveBuild,
  solved:()=>solved,
  // --- cuestionario
  quizCorrectIndex, answer, quiz:()=>QUIZ[mode], qorden:()=>QORD.slice(),
  // --- etiquetas de selección
  pickKeys:()=>Object.keys(PICK_INFO), pick:k=>(PICK_INFO[k]?PICK_INFO[k]():null),
  boardClick,
  // --- formato y recorrido
  fN, f0, f1, f2, f3, f4, pc1, pcm, fin, bar, cm3, gra,
  runAuto, autoRunning:()=>autoRunning,
};

// __END__
