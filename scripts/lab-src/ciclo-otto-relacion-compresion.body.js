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
             // Dos pistas como máximo, registradas; ninguna da valores de la terna.
             pistas:{p1:false,p2:false}, pistaTxt:[], intentos:0, aviso:'' };
const MAX_INTENTOS=3, MAX_PISTAS=2;
const nPistas=()=>(RETO.pistas.p1?1:0)+(RETO.pistas.p2?1:0);
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
  // El eje llega al PMI: ahí acaba el lazo de bombeo SUPUESTO del periodo abierto.
  const Vmax=Math.ceil((s.Vc+s.Vd)*1e6/50)*50;
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
  curva(lazoAbierto(s,P).map(q=>[A.X(q[0]*1e6),A.Y(q[1]/1e5)]),WARN_HEX,1.8,[3,4]);
  // El punto que recorre las curvas no se pinta aquí: va pegado al pizarrón en el
  // 3D y lo mueve el mismo reloj que mueve el pistón (sección 9.4).
  PV_EJES={A,B:null,yMax:yT};
  texto('PMS',A.X(s.Vc*1e6)+6,A.Y(0)-6,'#7f8b9c',12,'left','700');
  leyenda(114,376,[['ciclo real (motor sellado)',AZUL],
                   ['ciclo ideal de aire frío, γ = 1,4, mismo calor','#6d7789',[6,5]]]);
  leyenda(114,397,[['periodo abierto: estado SUPUESTO, el motor no lo integra',WARN_HEX,[3,4]]]);

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
  PV_EJES.B=B;
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
    'apertura de escape ('+gra(TH_EVO)+'). Fuera de ese tramo el motor no calcula nada: el lazo '+
    'amarillo a trazos y el punto hueco que lo recorre son un estado supuesto.');
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
  if(!sol) q.row('calibraciones válidas','no hay ninguna',BAD_HEX);
  else q.nota('Cuál de las válidas es la más barata de alimentar es el reto, y no se dice aquí.');
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
    texto('Intentos '+f0(RETO.intentos)+' de '+MAX_INTENTOS+' · pistas '+f0(nPistas())+' de '+MAX_PISTAS,
      66,y,'#8f9bb0',14,'left','700'); y+=26;
    RETO.pistaTxt.forEach(t=>{
      y=wrapText(t,86,y,590,18,'#c8d3e2',13)+26;
    });
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
  q.row('r elegida',f0(RETO.ejes.r)+' : 1');
  q.row('λ elegido',f2(RETO.ejes.lam));
  q.row('avance elegido',f0(RETO.ejes.avance)+'°');
  q.sep();
  q.row('criterios que fallan',f0(fallosDe(s).length),colOk(s.valida));
  q.row('η al freno',pc1(s.etaB));
  q.row('consumo específico',fin(s.bsfc,0)+' g/kWh');
  q.sep();
  q.nota('Hay dos pistas como máximo y ninguna da un valor: orientan, no resuelven. Entre las '+
    'válidas hay que elegir por coste.');
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
/* El motor de este laboratorio, cortado por un plano que pasa por el eje del
   primer cilindro, como los motores seccionados de los talleres de formación:
   se conserva la mitad de atrás y las caras del corte van rayadas. El resto
   del bloque —uno, tres o cuatro cilindros según la máquina— sigue detrás SIN
   CORTAR, y se lee en la culata, en los colectores y en las bobinas.
   Nada de lo que se mueve tiene una cota inventada: carrera, biela, diámetro y
   relación de compresión se leen de la máquina elegida y del estado del motor;
   lo que se añade —culata, levas, válvulas— son proporciones de oficio que se
   declaran en la ficha y que el script de verificación comprueba. */

// ---- 8.1 · COTAS Y LEYES DEL 3D (aritmética pura, sin three.js) ----
// Todo lo que se mueve en la escena sale de aquí, y este bloque no sabe nada de
// mallas: un script de node lo extrae tal cual y lo comprueba contra el motor
// sellado (posición del pistón, Vc/Vd, sincronía 2:1, alzados y volumen del
// frente de llama). Las cotas de la máquina —B, S, L— y la r se LEEN del motor;
// lo que se añade aquí (culata, levas, válvulas) son proporciones de oficio que
// se declaran en la ficha, nunca cifras para que «se vea bien».
const ESC3=10;                         // 1 m del motor = 10 unidades de escena
const CRUCE=12;                        // ° de cruce a cada lado del PMS de escape (declarado)
// La distribución en grados de ciclo c ∈ [0,720), c = 0 en el PMS de encendido.
// IVC y EVO son los del motor sellado; IVO y EVC son los típicos y se declaran.
const DIST={ivo:360-CRUCE, ivc:TH_IVC+720, evo:TH_EVO, evc:360+CRUCE};
const LEVA_F=0.10;                     // flancos de aceleración: 10 % de la apertura a cada lado
const cicloDe=th=>((th%720)+720)%720;
// θ en [−360, 360): el mismo ángulo que usa la traza del motor (0 = PMS de encendido).
const thDe=c=>{ const x=cicloDe(c); return x>=360?x-720:x; };
const FASES=[['admisión',360,540],['compresión',540,720],['expansión',0,180],['escape',180,360]];
function faseDe(c){ c=cicloDe(c);
  for(const f of FASES) if(c>=f[1]&&c<f[2]) return f[0];
  return 'admisión'; }

/* LEY DE ALZADO: aceleración senoidal por tramos —un pulso positivo corto en
   cada flanco y uno negativo largo en la nariz—. Es continua hasta la
   aceleración (C²), así que el taqué no recibe ningún golpe al abrir ni al
   cerrar, y la deceleración de la nariz queda lo bastante suave como para que
   la leva que la genera sea CONVEXA con un taqué plano. Normalizada: L(0)=L(1)=0,
   L(½)=1. Devuelve alzado, velocidad y aceleración respecto de u. */
function leyAlzado(u){
  const f=LEVA_F, W=1-2*f, A=Math.PI/(f*(f+2*W/Math.PI)), D=2*A*f/W;
  if(u<=0||u>=1) return {L:0,v:0,a:0};
  if(u>0.5){ const r=leyAlzado(1-u); return {L:r.L,v:-r.v,a:r.a}; }
  if(u<=f){ const s=Math.sin(Math.PI*u/f), c=Math.cos(Math.PI*u/f);
    return {L:A*f/Math.PI*(u-f/Math.PI*s), v:A*f/Math.PI*(1-c), a:A*s}; }
  const vf=2*A*f/Math.PI, Lf=A*f*f/Math.PI, w=u-f;
  const s=Math.sin(Math.PI*w/W), c=Math.cos(Math.PI*w/W);
  return {L:Lf+vf*w-D*W/Math.PI*(w-W/Math.PI*s), v:vf-D*W/Math.PI*(1-c), a:-D*s};
}
// Alzado de una válvula en el ciclo c (°). `dL` es dL/dθ en unidades por RADIÁN
// de cigüeñal, que es lo que pide la síntesis de la leva.
function alzado(V,c){
  c=cicloDe(c);
  let d=c-V.c0; if(d<0) d+=720;
  if(d>=V.dur) return {L:0,dL:0};
  const k=leyAlzado(d/V.dur), durRad=V.dur*DEG;
  return {L:V.Lmax*k.L, dL:V.Lmax*k.v/durRad};
}

/* LAS COTAS DE LA MÁQUINA EN LA ESCENA. Origen en el eje del cigüeñal; y hacia
   arriba; el plano de corte es z = 0 y se conserva la mitad z ≤ 0.
   Cada culata es de DOS árboles en cabeza con taqués de vaso. En el corte se ve
   una válvula de admisión y una de escape EN EL PLANO, con la bujía en el
   centro, que es como lo dibujan los manuales: en la culata real de cuatro
   válvulas la gemela de cada una está desplazada a lo largo del cigüeñal. */
const PROP3D={            // proporciones de oficio respecto del diámetro B
  dAdm:0.37, dEsc:0.31,   // diámetro de las cabezas de válvula (culata de 4 válvulas)
  LDadm:0.230, LDesc:0.250, // alzado máximo / diámetro de válvula
  rb:0.23,                // radio del círculo base de la leva
  vastago:0.070, largoV:1.25, // diámetro del vástago y largo de la válvula
  vaso:0.200, vasoH:0.30, vasoT:0.040, // radio, altura y espesor de corona del taqué
  muelleR:0.135, muelleHilo:0.022, muelleL:0.48, muelleVueltas:5.5, // radio medio, radio del hilo
                          // (el muelle cabe en el vaso y no llega a espira contra espira con el alzado máximo)
  hComp:0.32,             // altura de compresión del pistón con la r máxima del bloque
  hMin:0.012,             // holgura cilíndrica mínima (pistón-culata en el PMS) con la r máxima
  junta:0.0010,           // junta de culata comprimida: 1 mm (en metros)
  tanAmax:Math.tan(14*Math.PI/180),
  separaBujia:0.030,      // pared entre el agujero de la bujía y la cabeza de válvula
};
function cotas3D(mk,r){
  const P=MAQ[mk], E=ESC3, B=P.B*E, R=B/2, a=P.S/2*E, L=P.L*E;
  const Ap=Math.PI*R*R, Vd=Ap*P.S*E;
  const Vc=Vd/(r-1), VcMin=Vd/(P.rMax-1);
  // Pendiente del techo a dos aguas: la mayor de oficio (14°) que todavía deja
  // la holgura mínima con la r más alta que admite el bloque. Un techo más alto
  // no cabría: la cámara tendría más volumen que el que pide r_máx.
  const kRoof=R*R*R*(Math.PI-4/3);                  // V_techo = tanα · R³ (π − 4/3)
  const tanA=Math.min(PROP3D.tanAmax,(VcMin-Ap*PROP3D.hMin*B)/kRoof);
  const alfa=Math.atan(tanA), Vroof=tanA*kRoof;
  const hCyl=(Vc-Vroof)/Ap, hCylMin=(VcMin-Vroof)/Ap;
  // La cámara cambia con r por la ALTURA DE COMPRESIÓN del pistón: el bloque y
  // la culata son los mismos, y la r se elige con el pistón (que es como se hace).
  const hCompMax=PROP3D.hComp*B, hComp=hCompMax-(hCyl-hCylMin);
  const yHd=a+L+hCompMax+hCylMin;                    // cara de fuego de la culata
  const tG=PROP3D.junta*E, yBd=yHd-tG;                // cara superior del bloque
  const yApex=yHd+R*tanA;
  // Bujía: rosca M12 en los motores de automóvil, M10 en la moto (B < 65 mm).
  const rRosca=(P.B<0.065?0.010:0.012)*E/2;
  const yE=yApex-0.035*B;                             // hueco de electrodos, 3,5 % de B bajo la cumbrera
  const valv=(lado,dRel,LD,c0,dur)=>{
    const d=dRel*B, rv=d/2, s=lado;
    const dist=rRosca+PROP3D.separaBujia*B+rv;       // de la cumbrera al centro del asiento, por el techo
    const cx=s*dist*Math.cos(alfa), cy=yApex-dist*Math.sin(alfa);
    const n=[s*Math.sin(alfa),Math.cos(alfa)];       // eje de la válvula, hacia arriba y afuera
    const Lv=PROP3D.largoV*B, tipS=Lv;               // la cara de la válvula en s = 0
    const camS=tipS+PROP3D.vasoT*B+PROP3D.rb*B;      // centro del árbol de levas sobre el eje
    return {lado:s, d, rv, cx, cy, n, Lv, c0, dur, Lmax:LD*d,
      borde:dist+rv,                                  // del eje del cilindro al borde, por el techo
      cam:[cx+n[0]*camS, cy+n[1]*camS], camS, rb:PROP3D.rb*B};
  };
  const VA=valv(-1,PROP3D.dAdm,PROP3D.LDadm,DIST.ivo,DIST.ivc-DIST.ivo);
  const VE=valv( 1,PROP3D.dEsc,PROP3D.LDesc,DIST.evo,DIST.evc-DIST.evo);
  return {mk,r,B,R,a,L,Ap,Vd,Vc,Vroof,tanA,alfa,hCyl,hCylMin,hComp,hCompMax,
    yHd,yBd,tG,yApex,yE,rRosca,VA,VE};
}
// Mecanismo biela-manivela exacto: y del eje del bulón medido desde el cigüeñal.
// x(θ) = a·cosθ + √(L² − a²·sen²θ) — la MISMA fórmula que alimenta vol() del motor.
function bulonY(G,th){ const t=th*DEG, s=Math.sin(t);
  return G.a*Math.cos(t)+Math.sqrt(G.L*G.L-G.a*G.a*s*s); }
const coronaY=(G,th)=>bulonY(G,th)+G.hComp;
// Volumen encerrado leído de la GEOMETRÍA dibujada (unidades de escena³).
const volCamara3D=(G,th)=>G.Ap*(G.yHd-coronaY(G,th))+G.Vroof;
// Inclinación de la biela (rad), positiva cuando la muñequilla está a +x.
function bielaAng(G,th){ const t=th*DEG; return Math.atan2(G.a*Math.sin(t),
  Math.sqrt(G.L*G.L-G.a*G.a*Math.sin(t)**2)); }

/* LA CARGA EN DOS ZONAS. El motor integra UNA masa con temperatura T y sigue
   aparte el gas sin quemar por compresión isentrópica (T_u). Con la misma R para
   las dos zonas, como en el motor, la energía cierra con
        T = (1 − x_b)·T_u + x_b·T_b
   de modo que el quemado está a T_b = [T − (1 − x_b)·T_u]/x_b y ocupa una
   fracción de VOLUMEN y_b = x_b·T_b/T, mayor que x_b porque está mucho más
   caliente. T_u se ajusta en la chispa para que coincida con T (la diferencia,
   de unos pocos K, es el calor de pared que la isentrópica no ve). */
function dosZonas(tr,thS){
  let iS=0; while(iS<tr.th.length-1&&tr.th[iS+1]<=thS) iS++;
  const kU=tr.T[iS]/tr.Tu[iS];
  const TuA=[], TbA=[], yb=[];
  let TbKernel=null;
  for(let i=0;i<tr.th.length;i++){
    const x=tr.xb[i], T=tr.T[i], Tu=tr.Tu[i]*(tr.th[i]>=thS?kU:T/tr.Tu[i]);
    let Tb=x>0.02?(T-(1-x)*Tu)/x:null;
    if(Tb!==null&&TbKernel===null) TbKernel=Tb;
    TuA.push(Tu); TbA.push(Tb);
  }
  for(let i=0;i<tr.th.length;i++){
    const x=tr.xb[i], T=tr.T[i];
    if(x<=0){ TbA[i]=null; yb.push(0); continue; }
    let Tb=TbA[i]; if(Tb===null) Tb=TbKernel||T;      // núcleo: aún no hay masa para cerrar la energía
    Tb=Math.max(TuA[i],Math.min(3600,Tb)); TbA[i]=Tb;
    const y=x*Tb/(x*Tb+(1-x)*TuA[i]);                // = x·T_b/T cuando la energía cierra
    yb.push(Math.min(1,Math.max(x,y)));
  }
  return {Tu:TuA,Tb:TbA,yb};
}
// Área de la rodaja horizontal de la cámara que queda dentro de una esfera
// centrada en el eje: disco de radio m = min(ρ, R) recortado por la franja |x| ≤ w.
function areaRodaja(m,w){
  if(m<=0||w<=0) return 0;
  if(w>=m) return Math.PI*m*m;
  return 2*(w*Math.sqrt(m*m-w*w)+m*m*Math.asin(w/m));
}
// Semi-ancho de la cámara a la altura y: el cilindro hasta la cara de fuego y,
// por encima, el techo a dos aguas.
function anchoCamara(G,y){ return y<=G.yHd?G.R:G.R-(y-G.yHd)/G.tanA; }
// Volumen de la esfera de radio Rf centrada en el electrodo que cae DENTRO de
// la cámara (recortada por la corona del pistón, la camisa y el techo).
function volFrente(G,yCor,Rf,n){
  const N=n||160, y0=Math.max(yCor,G.yE-Rf), y1=Math.min(G.yApex,G.yE+Rf);
  if(y1<=y0) return 0;
  const h=(y1-y0)/N; let s=0;
  for(let i=0;i<=N;i++){
    const y=y0+i*h, rho2=Rf*Rf-(y-G.yE)*(y-G.yE);
    const A=rho2>0?areaRodaja(Math.min(Math.sqrt(rho2),G.R),anchoCamara(G,y)):0;
    s+=A*(i===0||i===N?1:(i%2?4:2));
  }
  return s*h/3;
}
// Radio del frente tal que su volumen recortado sea y_b·V(θ). Bisección.
function radioFrente(G,th,yb){
  if(yb<=0) return 0;
  const yC=coronaY(G,th), V=volCamara3D(G,th), obj=Math.min(1,yb)*V;
  let lo=0, hi=Math.hypot(G.R,G.yE-yC)+1e-6;
  if(yb>=0.9999) return hi;
  for(let k=0;k<40;k++){ const m=(lo+hi)/2; if(volFrente(G,yC,m)<obj) lo=m; else hi=m; }
  return (lo+hi)/2;
}

/* SÍNTESIS DE LA LEVA para taqué plano. El taqué toca la leva en una recta
   perpendicular a su eje; con la leva girada, esa recta está a rb + L(θ) del
   centro. La envolvente de esas rectas ES el perfil:
        P(ψ) = (rb + L)·u(ψ) + (dL/dψ)·u⊥(ψ)
   donde ψ es la dirección del taqué vista desde la leva. La leva gira a la
   MITAD que el cigüeñal (ψ = ψ₀ + θ/2), así que dL/dψ = 2·dL/dθ. El perfil no
   se dibuja «a ojo»: es exactamente el que produce el alzado de arriba. */
const camRot=th=>-th*DEG/2;                           // giro del árbol (rotation.z), horario visto de frente
function perfilLeva(V,N){
  const n=N||240, w=Math.atan2(-V.n[1],-V.n[0]), pts=[];  // w: del centro de la leva hacia el taqué
  for(let k=0;k<n;k++){
    const c=720*k/n, al=alzado(V,c), psi=w+c*DEG/2;
    const R=V.rb+al.L, t=2*al.dL;
    pts.push([R*Math.cos(psi)-t*Math.sin(psi), R*Math.sin(psi)+t*Math.cos(psi)]);
  }
  return pts;
}
// Lo que la leva ya girada empuja: el apoyo del perfil en la dirección del taqué.
function empujeLeva(pts,V,th){
  const ph=camRot(th), c=Math.cos(ph), s=Math.sin(ph), wx=-V.n[0], wy=-V.n[1];
  let m=-1e9;
  for(const p of pts){ const x=c*p[0]-s*p[1], y=s*p[0]+c*p[1]; m=Math.max(m,x*wx+y*wy); }
  return m-V.rb;
}

/* EL PERIODO ABIERTO —de EVO a IVC— NO LO INTEGRA EL MOTOR. Para que el
   pistón, el pizarrón y el panel no se queden congelados 450° de cada 720, se
   dibuja con un estado SUPUESTO que empalma con la traza en sus dos extremos y
   que la pantalla declara como tal:
     · soplado (EVO → PMI): p cae de p_EVO a p_esc con una ley cuadrática en el
       ángulo, y T sigue la isentrópica del gas quemado —la misma con la que el
       motor calcula su T de escape—, así que en el PMI vale exactamente T_esc;
     · carrera de escape: p_esc y T_esc;
     · cruce (IVO → EVC): p pasa de p_esc a p_adm en línea recta;
     · admisión: p_adm, y T es la mezcla por masas del residual a T_esc con la
       carga fresca que ya entró, con el enfriamiento por evaporación repartido
       en proporción: en el IVC da la T₀ con la que arranca la traza;
     · PMI → IVC: p pasa de p_adm al p₀ con que arranca la traza.
   Q es la fracción de la carga fresca ya admitida, medida por volumen barrido
   (del PMI al IVC no se dibuja reflujo). V sale de vol(), la misma función que
   integra el motor. */
function estadoAbierto(R,P,c){
  c=cicloDe(c);
  const tr=R.traza, n=tr.th.length, Gm=geom(P,R.r);
  const Vde=x=>vol(Gm,thDe(x)*DEG);
  const pE=tr.p[n-1], TE=tr.T[n-1], pEsc=P.pEscBase, pAdm=P.pAdm, p0=tr.p[0];
  const g=gamma(TE,1), k=(g-1)/g;
  const mRes=R.fRes*R.mTot, mFres=R.mTot-mRes;
  const Vi=Vde(DIST.ivo), Vb=Vde(540);
  const Q=c<=DIST.ivo?0:clamp((Vde(Math.min(c,540))-Vi)/(Vb-Vi),0,1);
  let p, T, tramo;
  if(c<=180){ const u=clamp((c-TH_EVO)/(180-TH_EVO),0,1);
    p=pEsc+(pE-pEsc)*(1-u)*(1-u); T=TE*Math.pow(p/pE,k); tramo='soplado'; }
  else if(c<=DIST.ivo){ p=pEsc; T=R.Texh; tramo='escape'; }
  else{
    if(c<DIST.evc){ p=pEsc+(pAdm-pEsc)*(c-DIST.ivo)/(DIST.evc-DIST.ivo); tramo='cruce'; }
    else if(c<=540){ p=pAdm; tramo='admision'; }
    else { p=pAdm+(p0-pAdm)*(c-540)/(DIST.ivc-540); tramo='admision'; }
    T=(Q*mFres*P.Tadm+mRes*R.Texh-Q*R.mTot*R.dTev)/(Q*mFres+mRes);
  }
  return {p, T, Q, V:Vde(c), tramo};
}

// ---- 8.2 · CALIDAD, MATERIALES Y RAYADOS ----
/* Dos niveles de calidad. «media» —equipos con cuatro núcleos o menos,
   pantallas estrechas, móviles, o ?calidad=media en la dirección— lleva menos
   partículas, menos segmentos en las piezas de revolución, el pizarrón vivo a
   la mitad de frecuencia, píxel 1:1 y sin el desenfoque de profundidad, que es
   el pase de postproceso caro. Se puede cambiar en vivo desde la barra. */
const CAL3={nivel:'alta'};
(function(){
  const q=(location.search.match(/[?&]calidad=(alta|media)\b/)||[])[1];
  const flojo=(navigator.hardwareConcurrency||8)<=4||innerWidth<900||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  CAL3.nivel=q||(flojo?'media':'alta');
})();
const calAlta=()=>CAL3.nivel==='alta';
const SEG3=()=>calAlta()?40:24;          // segmentos de las medias piezas de revolución

/* Un solo juego de mapas de fundición para todo el motor: la arena del molde
   deja la misma piel en el bloque que en la culata, y hacerlos una vez ahorra
   medio segundo de arranque. */
const FUND=castAluminum();
const pbr=(c,r,m,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r,metalness:m},o||{}));
const conPiel=(k)=>({map:FUND.map, roughnessMap:FUND.roughnessMap, normalMap:FUND.normalMap,
  normalScale:new THREE.Vector2(k,k)});
const M3={
  alu:     pbr('#c9cfd7',0.62,0.78,conPiel(0.45)),     // culata y tapa: aluminio fundido
  hierro:  pbr('#7d838c',0.78,0.55,conPiel(0.70)),     // bloque: fundición gris
  escape:  pbr('#55585e',0.82,0.45,Object.assign(conPiel(0.8),{emissive:'#000000',emissiveIntensity:1})),
  chapa:   pbr('#3a414b',0.55,0.45),                   // cárter de chapa pintada
  escapeB: pbr('#55585e',0.82,0.45,Object.assign(conPiel(0.8),{emissive:'#000000',emissiveIntensity:1,side:THREE.BackSide})),
  acero:   pbr('#8e96a0',0.30,1.00),                   // forjados: cigüeñal, biela, levas
  pulido:  pbr('#b9c1cb',0.22,1.00),                   // muñequillas, vástagos, vasos
  piston:  pbr('#cdd3da',0.34,0.88,conPiel(0.15)),
  segmento:pbr('#2c3036',0.36,0.90),
  camisa:  pbr('#959ba4',0.26,0.90),                   // fundición bruñida
  bronce:  pbr('#b08a55',0.34,0.95),
  ceramica:pbr('#f0ede6',0.20,0.00),
  cobre:   pbr('#c9824f',0.30,1.00),
  plastico:pbr('#262b33',0.55,0.05),
  goma:    pbr('#15171b',0.88,0.00),
  muelle:  pbr('#3e5266',0.34,0.80),                   // acero de muelle pavonado
  junta:   pbr('#7a3a30',0.55,0.55),                   // junta multicapa con su recubrimiento
  aceite:  pbr('#6e4710',0.08,0.00,{transparent:true,opacity:0.86}),
  agua:    pbr('#2a7f93',0.22,0.10,{side:THREE.BackSide}),   // camisa de agua vista por dentro
  huecoF:  pbr('#5d636c',0.74,0.50),                   // cavidades en hierro (cárter), vistas por dentro
  huecoAlu:pbr('#7f8790',0.62,0.62),                   // conductos y alojamientos de la culata
  huecoAluB:pbr('#7a828b',0.62,0.62,{side:THREE.BackSide}),
  aguaF:   pbr('#2a7f93',0.22,0.10),                   // camisa de agua de la culata
  chapaIn: pbr('#4a525c',0.60,0.40),                   // el interior del cárter de aceite
  pintura: pbr('#2b3542',0.62,0.30),                   // banco
  negro:   pbr('#14181e',0.85,0.10),
  liso:    (c)=>new THREE.MeshStandardMaterial({color:c,roughness:0.6,metalness:0.2}),
};
/* Las caras de sección: color del material y rayado a ±45°, anclado al mundo
   para que dos piezas vecinas se distingan por el sentido de las rayas, como en
   un plano de conjunto. El paso se ajusta a la máquina: unas doce rayas por
   diámetro de cilindro, ni moaré ni manchas. */
const RAYA_TEX=[];
function rayado(fondo,linea,sentido,densidad){
  const t=P3.texturaRayado({fondo,linea,sentido,lineas:4,grueso:0.16,px:128,porUnidad:4,grano:0.05});
  t.userData={densidad:densidad||1}; RAYA_TEX.push(t);
  return new THREE.MeshStandardMaterial({map:t,roughness:0.80,metalness:0.05,envMapIntensity:0.55});
}
const H3={
  aluP:    rayado('#a3abb5','#5f6873', 1),
  aluN:    rayado('#a3abb5','#5f6873',-1),
  hierroN: rayado('#6c727a','#33383f',-1),
  hierroP: rayado('#757b83','#393e45', 1,1.4),
  aceroP:  rayado('#868d96','#444a53', 1,1.6),
  aceroN:  rayado('#7a8089','#3a4048',-1,1.6),
  valvula: rayado('#7d92a9','#33465b',-1,2.4),           // las válvulas, en azul acero: se leen sueltas de la culata
  pistonN: rayado('#bab4a6','#6e685c',-1),
  bronceN: rayado('#a07c4a','#5a4023',-1,1.6),
  ceramP:  rayado('#d4cfc4','#948e83', 1,2.2),
  cobreN:  rayado('#b0714a','#673a1f',-1,2.2),
  plastN:  rayado('#3d434c','#1c2026',-1),
  gomaP:   rayado('#2a2d33','#0e0f12', 1),
  chapaP:  rayado('#56606c','#262c34', 1),
};
// Lo que en un plano va relleno, no rayado: segmentos, junta, hilo del muelle.
const LLENO={
  segmento:new THREE.MeshStandardMaterial({color:'#1b1e23',roughness:0.5,metalness:0.6}),
  junta:   new THREE.MeshStandardMaterial({color:'#5c2a24',roughness:0.6,metalness:0.4}),
  muelle:  new THREE.MeshStandardMaterial({color:'#2c3a49',roughness:0.4,metalness:0.7}),
};
function escalaRayado(B){
  for(const t of RAYA_TEX){ const k=12/B/4*t.userData.densidad; t.repeat.set(k,k); }
}

// ---- 8.3 · LA MAQUETA: cotas derivadas, secciones y piezas ----
/* La maqueta se presenta a 0,72: 1 m del motor son 7,2 unidades de escena.
   Es UNA escala para todas las máquinas, así que la moto se ve más pequeña que
   la planta de gas, como es. Dentro del grupo todo va en las unidades de ESC3. */
const K3=0.72;
const MOTOR=new THREE.Group(); MOTOR.scale.setScalar(K3); scene.add(MOTOR);
const MAQUETAS={};                      // una por máquina, hecha la primera vez que se pide
let MQ=null;                            // la que se está viendo
const SD=P3.SDF2;

function dims3D(G){
  const P=MAQ[G.mk], B=G.B, R=G.R, a=G.a, L=G.L, mm=ESC3/1000;
  const d={B,R,a,L};
  d.aire=G.mk==='moto';                                // la moto va refrigerada por aire
  d.pitch=1.12*B; d.ncil=P.ncil;                       // paso entre cilindros
  d.rLin=R+0.035*B; d.rCil=d.rLin+0.05*B; d.rAgua=d.rCil+0.075*B;
  d.xD=d.aire?d.rCil+0.035*B:d.rAgua+0.06*B;           // media anchura de la cara del bloque
  d.yLb=L-a-0.22*B;                                    // fondo de la camisa
  d.yJb=G.yBd-1.6*a;                                   // fondo de la camisa de agua (80 % de la carrera)
  d.xCi=a+0.40*B; d.xC=d.xCi+0.06*B;                   // cárter: hueco y pared
  d.yRail=-0.32*B; d.yPan=-(a+0.55*B);                 // junta del cárter y fondo del cárter
  d.zFin=-((P.ncil-1)*d.pitch+d.pitch/2+0.20*B);       // cara trasera del motor
  d.zMam=-(d.pitch/2-0.11*B);                          // cara del primer mamparo de bancada
  // cigüeñal y biela
  d.rMuq=0.255*B; d.rCab=d.rMuq+0.10*B; d.rBul=0.10*B; d.rPie=d.rBul+0.06*B; d.wBie=0.25*B;
  d.rApo=0.29*B; d.tBra=0.16*B; d.rCw=Math.min(a+0.15*B, L-a-0.30*B-0.06*B);
  // culata y tapa de levas
  d.camY=Math.min(G.VA.cam[1],G.VE.cam[1]);
  const alcance=V=>Math.abs(V.cam[0])+V.rb+V.Lmax+0.03*B;
  d.Hw=Math.max(alcance(G.VA),alcance(G.VE))+0.08*B;
  d.yCov=d.camY+Math.max(G.VA.rb+G.VA.Lmax,G.VE.rb+G.VE.Lmax)+0.14*B;
  d.Hc=d.Hw+0.02*B; d.tCov=0.045*B;
  // bujía: rosca M12 (M10 en la moto), hexágono de 16 mm, en milímetros de verdad
  d.reach=(P.B<0.065?12.7:19)*mm; d.hexR=16*mm/Math.sqrt(3); d.rIns=5.2*mm;
  d.rPozo=Math.max(0.14*B,d.hexR+2.5*mm); d.xT=d.rPozo+0.05*B;
  d.yAsiento=G.yApex+d.reach; d.yTorre=d.yCov+0.02*B;
  // tren de válvulas sobre el eje de cada válvula (s = 0 en la cara del plato)
  d.sRet=G.VA.Lv-0.085*B; d.sMue=d.sRet-PROP3D.muelleL*B;
  d.sGuia0=0.30*B; d.sGuia1=d.sMue+0.09*B;
  d.rVaso=PROP3D.vaso*B; d.rTaq=d.rVaso+0.006*B;
  d.anchoLeva=0.18*B; d.rArbol=0.15*B;
  d.h=B/72;                                            // paso de la rejilla de las secciones
  return d;
}
// Punto a lo largo del eje de una válvula y perpendicular hacia fuera.
const ejeV=(V,s)=>[V.cx+V.n[0]*s, V.cy+V.n[1]*s];
const fueraV=V=>[V.lado*V.n[1], -V.lado*V.n[0]];
const phiV=V=>Math.atan2(-V.n[0],V.n[1]);             // giro que lleva +Y al eje de la válvula
function conductoDe(G,d,V){
  /* Línea media del conducto: sube recto por la garganta, se dobla por debajo
     del alojamiento del muelle y sale por el flanco de la culata. El de
     admisión sale alto (conducto de «tumble»), el de escape casi horizontal. */
  const B=G.B, s=V.lado, adm=s<0;
  const p1=ejeV(V,adm?0.30*B:0.26*B);
  const p2=[s*(adm?0.62:0.60)*B, G.yHd+(adm?0.43:0.36)*B];
  const p3=[s*(d.Hw+0.14*B), G.yHd+(adm?0.68:0.42)*B];
  const pm=[(p1[0]+p2[0])/2+s*0.02*B,(p1[1]+p2[1])/2+0.035*B];
  return P3.curvaPlana([ejeV(V,0.05*B),ejeV(V,0.16*B),p1,pm,p2,p3],40);
}
// La y de una polilínea en la x dada (primer cruce).
function yEnX(pts,x){
  for(let i=1;i<pts.length;i++){ const a=pts[i-1], b=pts[i];
    if((a[0]-x)*(b[0]-x)<=0&&a[0]!==b[0]){ const t=(x-a[0])/(b[0]-a[0]); return a[1]+t*(b[1]-a[1]); } }
  return pts[pts.length-1][1];
}
const cajaRed=(cx,cy,hx,hy,r)=>{ const f=SD.caja(cx,cy,hx-r,hy-r); return (x,y)=>f(x,y)-r; };
const semiplanoArriba=y0=>(x,y)=>y0-y;
const ccw=p=>{ let a=0; for(let i=0;i<p.length;i++){ const q=p[i], r=p[(i+1)%p.length]; a+=q[0]*r[1]-r[0]*q[1]; }
  return a<0?p.slice().reverse():p; };
const mk3=(geo,mat,sombra)=>{ const m=new THREE.Mesh(geo,mat); if(sombra){ m.castShadow=true; m.receiveShadow=true; } return m; };
function marca3(o,k){ o.traverse(n=>{ n.userData.key=k; }); return o; }
// Media pieza de revolución en un marco (posición y giro en z): cuerpo y cara.
function mediaEn(perfil,x,y,rz){
  const m=P3.mediaRevolucion(perfil,{seg:SEG3()});
  P3.coloca(m.cuerpo,x,y,0,rz); P3.coloca(m.corte,x,y,0,rz);
  return m;
}
// Semianillo horizontal (z ≤ 0) en el plano perpendicular a un eje del plano xy.
function semiAnillo(r0,r1,cx,cy,rz){
  const g=new THREE.RingGeometry(r0,r1,24,1,0,Math.PI);
  g.rotateX(-Math.PI/2); P3.coloca(g,cx,cy,0,rz); return g;
}
// Junta las geometrías de un grupo de la biblioteca en una sola (un material).
function aplana(grupo){
  grupo.updateMatrixWorld(true); const gs=[];
  grupo.traverse(o=>{ if(o.isMesh){ const g=o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    if(!g.attributes.uv) g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
    gs.push(g.index?g:g); } });
  return P3.fusiona(gs);
}

/* ---------- LA CULATA: sección por distancias con signo ---------- */
function seccionesCulata(G,d){
  const B=G.B, R=G.R, ab=[], oc=[];
  // cámara (un poco por debajo de la cara de fuego, para cortar también la junta)
  ab.push(SD.poligono([[-R,G.yHd-0.03*B],[R,G.yHd-0.03*B],[R,G.yHd],[0,G.yApex],[-R,G.yHd]]));
  for(const V of [G.VA,G.VE]){
    const ph=phiV(V);
    const caja=(s0,s1,r)=>{ const m=(s0+s1)/2, c=ejeV(V,m); return SD.caja(c[0],c[1],r,(s1-s0)/2,ph); };
    oc.push(caja(-0.03*B,0.17*V.d,V.rIns));                       // alojamiento del asiento postizo
    ab.push(caja(0.06*V.d,0.30*B,0.43*V.d));                      // garganta
    ab.push(SD.banda(V.conducto,V.rp));                           // conducto
    oc.push(caja(d.sGuia0,d.sGuia1,0.07*B));                      // guía
    ab.push(caja(d.sMue-0.012*B,V.camS,d.rTaq));                  // pozo del muelle y del vaso
    ab.push(SD.circulo(V.cam[0],V.cam[1],V.rb+V.Lmax+0.03*B));    // holgura del lóbulo
  }
  oc.push(SD.caja(0,(G.yApex-0.02*B+d.yAsiento)/2,G.rRosca,(d.yAsiento-G.yApex+0.02*B)/2)); // rosca de la bujía
  ab.push(SD.caja(0,(d.yAsiento+d.yTorre+0.3*B)/2,d.rPozo,(d.yTorre+0.3*B-d.yAsiento)/2));  // pozo de la bujía
  if(d.gdi) oc.push(SD.caja(d.gdi.cx,d.gdi.cy,d.gdi.r+0.004*B,d.gdi.hl,d.gdi.ang));          // inyector directo
  // contorno exterior (antihorario)
  const ext=[[-d.xD,G.yHd],[d.xD,G.yHd],[d.xD,G.yHd+0.10*B],[d.Hw,G.yHd+0.30*B],[d.Hw,d.camY],
    [d.xT,d.camY],[d.xT,d.yTorre],[-d.xT,d.yTorre],[-d.xT,d.camY],[-d.Hw,d.camY],
    [-d.Hw,G.yHd+0.30*B],[-d.xD,G.yHd+0.10*B]];
  let fExt=SD.poligono(ext);
  if(d.aire){                         // aletas de la culata de la moto, por encima de los conductos
    const al=[]; for(let y=G.yHd+0.86*B;y<d.camY-0.05*B;y+=0.09*B)
      for(const s of [-1,1]) al.push(SD.caja(s*(d.Hw+0.10*B),y,0.11*B,0.016*B));
    fExt=SD.union(fExt,...al);
  }
  const huecos=SD.union(...ab,...oc);
  // Camisa de agua de la culata: núcleos donde caben, con 3,5 % de B de pared.
  const agua=[];
  if(!d.aire){
    const cand=[];
    for(const s of [-1,1]){
      cand.push([s*(R+0.13*B),G.yHd+0.10*B,0.065*B]);
      cand.push([s*0.20*B,G.yHd+0.62*B,0.08*B]);
      cand.push([s*0.86*B,G.yHd+0.98*B,0.08*B]);
      cand.push([s*0.30*B,G.yHd+1.02*B,0.06*B]);
    }
    for(const [cx,cy,r0] of cand){
      const lib=Math.min(huecos(cx,cy),-fExt(cx,cy))-0.035*B;
      const r=Math.min(r0,lib); if(r>0.022*B) agua.push(SD.circulo(cx,cy,r));
    }
  }
  const fAgua=agua.length?SD.union(...agua):(()=>1e9);
  const fCul=SD.resta(fExt,SD.union(huecos,fAgua));
  // Tapa de levas: cáscara con la torre de la bujía pasando por ella.
  const hTap=(d.yCov-d.camY)+0.3*B, yTapC=d.camY-0.3*B+hTap/2;
  const tapExt=SD.interseccion(cajaRed(0,yTapC,d.Hc,hTap/2,0.16*B),semiplanoArriba(d.camY));
  const tapInt=cajaRed(0,yTapC-0.001,d.Hc-d.tCov,hTap/2-d.tCov,0.16*B-d.tCov);
  const torre=SD.caja(0,d.yTorre,d.xT+0.004*B,d.yTorre-d.camY+0.1*B);
  const fTapa=SD.resta(SD.resta(tapExt,tapInt),torre);
  // Cavidad de las levas (la que se ve detrás del corte, hasta el primer apoyo).
  const leva=[G.VA,G.VE].map(V=>SD.circulo(V.cam[0],V.cam[1],V.rb+V.Lmax+0.03*B));
  const fLevas=SD.resta(SD.union(SD.interseccion(tapInt,semiplanoArriba(d.camY)),...leva),torre);
  return {ext,fExt,fCul,fTapa,tapExt,fLevas,fAgua,nAgua:agua.length};
}

/* ---------- EL BLOQUE Y EL CÁRTER ---------- */
function seccionesBloque(G,d){
  const B=G.B, R=G.R;
  const yFl=d.aire?d.yLb+0.06*B:d.yJb-0.06*B, yFl2=yFl-(d.xC-d.xD);
  const ext=[[-d.xD,G.yBd],[-d.xD,yFl],[-d.xC,yFl2],[-d.xC,d.yRail+0.07*B],[-d.xC-0.05*B,d.yRail+0.07*B],
    [-d.xC-0.05*B,d.yRail],[d.xC+0.05*B,d.yRail],[d.xC+0.05*B,d.yRail+0.07*B],[d.xC,d.yRail+0.07*B],
    [d.xC,yFl2],[d.xD,yFl],[d.xD,G.yBd]];
  let fExt=SD.poligono(ext);
  if(d.aire){                          // aletas del cilindro de la moto
    const al=[]; for(let y=d.yLb+0.12*B;y<G.yBd-0.03*B;y+=0.085*B)
      for(const s of [-1,1]) al.push(SD.caja(s*(d.xD+0.11*B),y,0.12*B,0.016*B));
    fExt=SD.union(fExt,...al);
  }
  const bore=SD.caja(0,(d.yLb+G.yBd+0.2*B)/2,d.rLin,(G.yBd+0.2*B-d.yLb)/2);
  const camisas=d.aire?[]:[-1,1].map(s=>SD.caja(s*(d.rCil+d.rAgua)/2,(d.yJb+G.yBd+0.1*B)/2,
    (d.rAgua-d.rCil)/2,(G.yBd+0.1*B-d.yJb)/2));
  const yK=yFl2-0.06*B, yTop=yFl-0.05*B;
  const barril=[-1,1].map(s=>SD.caja(s*(d.rLin+d.rCil)/2,(d.yLb+G.yBd)/2,(d.rCil-d.rLin)/2,(G.yBd-d.yLb)/2));
  const carter=SD.resta(SD.union(SD.caja(0,(d.yRail-0.6*B+yK)/2,d.xCi,(yK-d.yRail+0.6*B)/2),
    SD.poligono([[-d.xCi,yK],[d.xCi,yK],[d.rCil,yTop],[-d.rCil,yTop]])),SD.union(...barril));
  const fBlo=SD.resta(fExt,SD.union(bore,carter,...camisas));
  const fCarter=SD.interseccion(carter,SD.poligono(ext),(x,y)=>d.yRail-0.0005-y);
  // Cárter de aceite de chapa embutida: pared de 2,8 % de B, abierto por arriba.
  const xP=d.xC+0.05*B, xS=0.72*d.xC, t=0.028*B;
  const panExt=SD.poligono([[-xP,d.yRail],[-xP,d.yRail-0.05*B],[-xP+0.07*B,d.yRail-0.08*B],[-xS,d.yPan],
    [xS,d.yPan],[xP-0.07*B,d.yRail-0.08*B],[xP,d.yRail-0.05*B],[xP,d.yRail]]);
  const panInt=(x,y)=>panExt(x,y)+t;
  const fPan=SD.resta(SD.resta(panExt,panInt),SD.caja(0,d.yRail,d.xCi,0.035*B));
  const fPanHueco=SD.interseccion(panInt,(x,y)=>y-(d.yRail-0.0005));
  const yAceite=d.yPan+0.30*(d.yRail-d.yPan);
  const fAceite=SD.interseccion(panInt,(x,y)=>y-yAceite);
  return {ext,fExt,fBlo,fCarter,fPan,panExt,fPanHueco,fAceite,yAceite,t};
}
// Media anchura de una región en una altura (bisección sobre la distancia).
function anchoEn(f,y,x1){ let lo=0, hi=x1; if(f(0,y)>=0) return 0;
  for(let k=0;k<30;k++){ const m=(lo+hi)/2; if(f(m,y)<0) lo=m; else hi=m; } return lo; }

/* ---------- PERFILES DE LAS PIEZAS DE REVOLUCIÓN (r, y) ---------- */
// Válvula, platillo y vaso de taqué en el marco de la válvula (s = y local).
function perfilesValvula(G,d,V){
  const B=G.B, D=V.d, rs=PROP3D.vastago*B/2, Lv=V.Lv;
  const valv=[[0,0],[0.47*D,0],[0.5*D,0.025*D],[0.5*D,0.045*D],[0.43*D,0.115*D],[0.30*D,0.17*D],
    [0.19*D,0.25*D],[rs*1.7,0.40*D],[rs,0.62*D],[rs,Lv-0.10*B],[rs*0.74,Lv-0.09*B],[rs*0.74,Lv-0.055*B],
    [rs,Lv-0.045*B],[rs,Lv],[0,Lv]];
  const plat=[[rs*1.02,d.sRet-0.045*B],[0.07*B,d.sRet-0.045*B],[0.125*B,d.sRet],[0.125*B,d.sRet+0.02*B],[rs*1.02,d.sRet+0.02*B]];
  const T=PROP3D.vasoT*B, H=PROP3D.vasoH*B;
  const vaso=[[0,Lv],[d.rVaso-0.016*B,Lv],[d.rVaso-0.016*B,Lv+T-H],[d.rVaso,Lv+T-H],[d.rVaso,Lv+T],[0,Lv+T]];
  const asiento=[[0.43*D,0.115*D],[0.50*D,0.045*D],[0.52*D,0],[V.rIns,0],[V.rIns,0.17*D],[0.43*D,0.17*D]];
  const guia=[[rs*1.06,d.sGuia0],[0.07*B,d.sGuia0+0.02*B],[0.07*B,d.sGuia1],[rs*1.06,d.sGuia1]];
  return {valv,plat,vaso,asiento,guia};
}
// Pistón con la altura de compresión de ESTA r: cabeza, tres ranuras, falda.
function perfilPiston(G,d){
  const B=G.B, R=G.R, hc=G.hComp;
  const y1=hc-0.035*B, y2=y1-0.016*B-0.030*B, y3=y2-0.016*B-0.028*B, ys=-0.30*B;
  const p=[[0,hc],[R-0.012*B,hc],[R-0.004*B,hc-0.006*B],[R-0.004*B,y1],
    [R-0.045*B,y1],[R-0.045*B,y1-0.016*B],[R-0.002*B,y1-0.016*B],[R-0.002*B,y2],
    [R-0.045*B,y2],[R-0.045*B,y2-0.016*B],[R-0.002*B,y2-0.016*B],[R-0.002*B,y3],
    [R-0.050*B,y3],[R-0.050*B,y3-0.030*B],[R-0.001*B,y3-0.030*B],[R-0.001*B,ys],
    [R-0.035*B,ys],[R-0.035*B,y3-0.05*B],[R-0.080*B,y3-0.02*B],[R-0.080*B,hc-0.075*B],[0,hc-0.075*B]];
  const aro=(y,h,f)=>[[R-0.040*B*f,y-h],[R-0.0005*B,y-h],[R-0.0005*B,y],[R-0.040*B*f,y]];
  const aros=[aro(y1-0.001*B,0.014*B,1),aro(y2-0.001*B,0.014*B,1),aro(y3-0.001*B,0.028*B,1.1)];
  return {p,aros,ys};
}

/* ---------- CONSTRUCCIÓN DE UNA MAQUETA ----------
   Lo fijo se agrupa por material en una sola malla (una llamada de dibujo por
   material, no una por pieza); lo que se mueve va en mallas propias. */
function construyeMaqueta(mk){
  const P=MAQ[mk], G=cotas3D(mk,P.rMax), B=G.B, R=G.R;
  const d=dims3D(G), g=new THREE.Group(), mq={mk,G,d,g,pistones:{},rotulos:{}};
  const uMax=R/Math.cos(G.alfa);
  for(const V of [G.VA,G.VE]){
    const dist=Math.hypot(V.cx,V.cy-G.yApex);
    V.dist=dist; V.rIns=Math.min(0.60*V.d,uMax-dist-0.012*B);
    V.rp=(V.lado<0?0.42:0.40)*V.d;
    V.conducto=conductoDe(G,d,V);
  }
  // Inyector directo del turbo: bajo el conducto de admisión, apuntando a la cámara.
  if(P.iny==='GDI'){
    const ax=[-Math.cos(22*DEG),Math.sin(22*DEG)];                               // de la punta hacia fuera
    const punta=[-(R-0.03*B),G.yHd+0.045*B], r=0.065*B;
    const largo=(d.Hw-(R-0.03*B))/Math.cos(22*DEG)+0.20*B;
    d.gdi={punta,ax,largo,r,cx:punta[0]+ax[0]*largo/2,cy:punta[1]+ax[1]*largo/2,hl:largo/2,
      ang:Math.atan2(ax[1],ax[0])+Math.PI/2};
  }
  const SC=seccionesCulata(G,d), SB=seccionesBloque(G,d);
  const L=(geo,mat,key,sombra)=>{ const m=mk3(geo,mat,sombra); if(key) marca3(m,key); g.add(m); return m; };
  const zF=d.zFin, h=d.h;
  const cajaCul=[-d.Hw-0.4*B,G.yHd-0.05*B,d.Hw+0.4*B,d.yTorre+0.05*B];
  const cajaBlo=[-d.xC-0.4*B,d.yRail-0.02*B,d.xC+0.4*B,G.yBd+0.02*B];

  // --- culata ---
  const secCul=P3.seccionSDF(SC.fCul,cajaCul,h);
  L(secCul.cara,H3.aluP,'culata');
  L(P3.prismaZ([ccw(SC.ext)],zF,0),M3.alu,'culata',true);
  // tapa de levas: cara, cuerpo, y la cavidad de las levas hasta el primer apoyo
  L(P3.seccionSDF(SC.fTapa,cajaCul,h).cara,H3.aluN,'culata');
  L(P3.prismaZ(P3.contornosSDF(SC.tapExt,cajaCul,h).map(ccw),zF,0),M3.alu,'culata',true);
  if(d.aire){                       // aletas de la culata de la moto
    const al=[]; for(let y=G.yHd+0.86*B;y<d.camY-0.05*B;y+=0.09*B) for(const s of [-1,1]){
      const x0=s>0?d.Hw-0.01*B:-d.Hw-0.21*B, x1=x0+0.22*B;
      al.push([[x0,y-0.016*B],[x1,y-0.016*B],[x1,y+0.016*B],[x0,y+0.016*B]]); }
    L(P3.prismaZ(al,zF,0),M3.alu,'culata');
  }
  const matCul=(x,y)=>Math.min(SC.fCul(x,y),SC.fTapa(x,y))<0;
  const pared=f=>(a,b,nx,ny)=>{ const mx=(a[0]+b[0])/2-nx*0.6*h, my=(a[1]+b[1])/2-ny*0.6*h; return f(mx,my); };
  L(P3.bolsillo(P3.contornosSDF(SC.fLevas,cajaCul,h),d.pitch/2-0.06*B,{pared:pared(matCul)}),M3.huecoAlu,'levas');
  if(SC.nAgua) L(P3.bolsillo(P3.contornosSDF(SC.fAgua,cajaCul,h),0.30*B,{pared:pared(matCul)}),M3.aguaF,'culata');
  // techo a dos aguas de la cámara, conductos, gargantas, pozos de los vasos y de la bujía
  const huecos=[];
  for(const V of [G.VA,G.VE]){
    huecos.push(techoMitad(G,d,V));
    huecos.push(P3.medioTubo(V.conducto,V.rp,{adentro:true,seg:40,radial:12}));
    huecos.push(P3.medioTubo([ejeV(V,0.04*V.d),ejeV(V,0.30*B)],0.43*V.d,{adentro:true,seg:2,radial:14}));
    const sTop=V.camS-(V.rb+V.Lmax+0.03*B);
    huecos.push(P3.medioTubo([ejeV(V,d.sMue-0.012*B),ejeV(V,sTop)],d.rTaq,{adentro:true,seg:2,radial:16}));
    const fo=ejeV(V,d.sMue-0.012*B); huecos.push(semiAnillo(0.07*B,d.rTaq,fo[0],fo[1],phiV(V)));
  }
  huecos.push(P3.medioTubo([[0,d.yAsiento],[0,d.yTorre]],d.rPozo,{adentro:true,seg:2,radial:16}));
  huecos.push(semiAnillo(G.rRosca,d.rPozo,0,d.yAsiento,0));
  L(P3.fusiona(huecos),M3.huecoAlu,'culata');

  // --- junta de culata: tiras en el corte y su canto ---
  const tiras=[];
  const tramo=(x0,x1)=>{ tiras.push([[x0,G.yBd],[x1,G.yBd],[x1,G.yHd],[x0,G.yHd]]); };
  if(d.aire){ tramo(R,d.xD); tramo(-d.xD,-R); } else { tramo(R,d.rCil); tramo(d.rAgua,d.xD); tramo(-d.rCil,-R); tramo(-d.xD,-d.rAgua); }
  L(P3.caraPlana(tiras),LLENO.junta,'culata');
  // canto exterior de la junta, y su anillo de fuego asomando a la camisa (no una losa que tape el cilindro)
  { const e=0.004*B, sh=[[[d.xD-e,G.yBd],[d.xD,G.yBd],[d.xD,G.yHd],[d.xD-e,G.yHd]],[[-d.xD,G.yBd],[-d.xD+e,G.yBd],[-d.xD+e,G.yHd],[-d.xD,G.yHd]]];
    L(P3.prismaZ(sh,zF,0,{tapaAtras:false}),M3.junta,'culata');
    L(P3.mediaRevolucion([[R+0.0015*B,G.yBd],[R+0.012*B,G.yBd],[R+0.012*B,G.yHd],[R+0.0015*B,G.yHd]],{seg:SEG3()}).cuerpo,LLENO.segmento,'culata'); }

  // --- bloque ---
  L(P3.seccionSDF(SB.fBlo,cajaBlo,h).cara,H3.hierroN,'bloque');
  L(P3.prismaZ([ccw(SB.ext)],zF,0),M3.hierro,'bloque',true);
  if(d.aire){                       // las aletas, extruidas hacia atrás como en un cilindro de moto
    const al=[]; for(let y=d.yLb+0.12*B;y<G.yBd-0.03*B;y+=0.085*B) for(const s of [-1,1]){
      const x0=s>0?d.xD:-d.xD-0.23*B, x1=x0+0.23*B;
      al.push([[x0,y-0.016*B],[x1,y-0.016*B],[x1,y+0.016*B],[x0,y+0.016*B]]); }
    L(P3.prismaZ(al,zF,0),M3.hierro,'bloque');
  }
  const matBlo=(x,y)=>SB.fBlo(x,y)<0;
  L(P3.bolsillo(P3.contornosSDF(SB.fCarter,cajaBlo,h),-d.zMam,{pared:pared(matBlo)}),M3.huecoF,'bloque');
  // camisa del cilindro (fundición bruñida) y camisa de agua vista por dentro
  const lin=P3.mediaRevolucion([[R,d.yLb],[d.rLin,d.yLb],[d.rLin,G.yBd],[R,G.yBd]],{seg:SEG3()+8});
  L(lin.cuerpo,M3.camisa,'camisa'); L(lin.corte,H3.hierroP,'camisa');
  if(!d.aire) L(P3.mediaRevolucion([[d.rCil,d.yJb],[d.rAgua,d.yJb],[d.rAgua,G.yBd],[d.rCil,G.yBd]],{seg:SEG3()}).cuerpo,M3.agua,'bloque');

  // --- cárter de aceite y aceite ---
  const cajaPan=[-d.xC-0.2*B,d.yPan-0.05*B,d.xC+0.2*B,d.yRail+0.01*B];
  L(P3.seccionSDF(SB.fPan,cajaPan,h*0.7).cara,H3.chapaP,'bloque');
  L(P3.prismaZ(P3.contornosSDF(SB.panExt,cajaPan,h*0.7).map(ccw),zF,0),M3.chapa,'bloque',true);
  const matPan=(x,y)=>SB.fPan(x,y)<0;
  L(P3.bolsillo(P3.contornosSDF(SB.fPanHueco,cajaPan,h*0.7),-zF-0.03*B,{pared:pared(matPan)}),M3.chapaIn,'bloque');
  L(P3.seccionSDF(SB.fAceite,cajaPan,h*0.7,{z:0.0004}).cara,M3.aceite,'bloque');
  { const w=anchoEn((x,y)=>SB.panExt(x,y)+SB.t,SB.yAceite,d.xC+0.2*B);
    const sup=new THREE.PlaneGeometry(2*w,-zF-0.03*B); sup.rotateX(-Math.PI/2);
    sup.translate(0,SB.yAceite,(zF+0.03*B)/2); L(sup,M3.aceite,'bloque'); }

  // --- asientos postizos y guías (bronce) ---
  const bro=[], broC=[];
  for(const V of [G.VA,G.VE]){
    const pf=perfilesValvula(G,d,V), ph=phiV(V);
    for(const per of [pf.asiento,pf.guia]){ const m=mediaEn(per,V.cx,V.cy,ph); bro.push(m.cuerpo); broC.push(m.corte); }
    V.perfiles=pf;
  }
  L(P3.fusiona(bro),M3.bronce,'culata'); L(P3.fusiona(broC),H3.bronceN,'culata');

  // --- bujía (rosca, hexágono, aislador, electrodos) y bobina ---
  construyeBujia(mq,L);
  // --- colectores, inyectores, otros cilindros, banco ---
  construyeColectores(mq,L);
  construyeBanco(mq,L);

  // lo fijo con el mismo material y la misma pieza, en una sola malla
  compacta(g);
  // --- lo que se mueve ---
  construyeMovil(mq);
  escalaRayado(B);
  mq.caja=new THREE.Box3().setFromObject(g);
  return mq;
}

// Mitad del techo a dos aguas (z ≤ 0), con los recortes del asiento y de la bujía.
function techoMitad(G,d,V){
  const ca=Math.cos(G.alfa), sa=Math.sin(G.alfa), R=G.R, s=V.lado;
  const rA=V.rIns, rR=G.rRosca, dist=V.dist, uMax=R/ca, pts=[];
  pts.push([rR,0],[dist-rA,0]);
  for(let i=1;i<20;i++){ const a=Math.PI-i*Math.PI/20; pts.push([dist+rA*Math.cos(a),-rA*Math.sin(a)]); }
  pts.push([dist+rA,0],[uMax,0]);
  for(let i=1;i<=28;i++){ const t=i/28*Math.PI/2; pts.push([R*Math.cos(t)/ca,-R*Math.sin(t)]); }
  for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/20; pts.push([rR*Math.cos(a),rR*Math.sin(a)]); }
  const v2=pts.map(p=>new THREE.Vector2(p[0],p[1]));
  const tri=THREE.ShapeUtils.triangulateShape(v2,[]);
  const pos=[], nor=[], uv=[], idx=[];
  const nx=-s*sa, ny=-ca;                                  // mira a la cámara de combustión
  for(const p of pts){ pos.push(s*p[0]*ca,G.yApex-p[0]*sa,p[1]); nor.push(nx,ny,0); uv.push(p[0],p[1]); }
  for(const t of tri){
    const A=t[0]*3, Bq=t[1]*3, C=t[2]*3;
    const ux=pos[Bq]-pos[A], uy=pos[Bq+1]-pos[A+1], uz=pos[Bq+2]-pos[A+2];
    const vx=pos[C]-pos[A], vy=pos[C+1]-pos[A+1], vz=pos[C+2]-pos[A+2];
    const cx=uy*vz-uz*vy, cy=uz*vx-ux*vz;
    if(cx*nx+cy*ny>=0) idx.push(t[0],t[1],t[2]); else idx.push(t[0],t[2],t[1]);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(idx); return geo;
}

/* Bujía M12 (M10 en la moto) a escala real: cuerpo roscado con su arandela y
   su hexágono, aislador cerámico con sus corrugas, electrodo central y el de
   masa en «J». Encima, la bobina de lápiz con su bota. Todo cortado. */
function construyeBujia(mq,L){
  const {G,d}=mq, B=G.B, mm=ESC3/1000, y0=G.yApex-0.004*B;      // extremo del cuerpo, al ras del techo
  const rr=G.rRosca, prof=0.62*mm, paso=(rr*2/mm>11?1.25:1.0)*mm;
  const yS=d.yAsiento;                                           // asiento de la arandela
  const cuerpo=[[3.6*mm,y0]];
  for(let y=y0;y<yS-paso;y+=paso){ cuerpo.push([rr,y+0.15*paso],[rr,y+0.45*paso],[rr-prof,y+0.75*paso],[rr-prof,y+paso]); }
  cuerpo.push([rr,yS-0.6*mm],[rr+2.2*mm,yS-0.4*mm],[rr+2.2*mm,yS],[d.hexR*0.92,yS+0.3*mm],
    [d.hexR*0.92,yS+10*mm],[d.rIns+0.6*mm,yS+13*mm],[d.rIns+0.4*mm,yS+13*mm],[d.rIns+0.4*mm,yS+2*mm],[3.6*mm,yS+0.8*mm]);
  const aisl=[[0.9*mm,y0+1.0*mm],[2.9*mm,y0+3*mm],[3.3*mm,y0+9*mm],[3.4*mm,yS+0.8*mm],[d.rIns,yS+2*mm]];
  for(let k=0;k<5;k++){ const yb=yS+15*mm+k*4.2*mm; aisl.push([d.rIns,yb],[d.rIns+0.9*mm,yb+1.2*mm],[d.rIns+0.9*mm,yb+2.6*mm],[d.rIns,yb+3.6*mm]); }
  aisl.push([d.rIns*0.9,yS+38*mm],[2.2*mm,yS+39*mm],[1.3*mm,yS+39*mm],[1.3*mm,y0+1.2*mm]);
  const elec=[[0,G.yE+0.4*mm],[1.25*mm,G.yE+0.4*mm],[1.25*mm,y0+1.0*mm],[0.9*mm,y0+1.2*mm],[0.9*mm,yS+39*mm],
    [2.0*mm,yS+39.5*mm],[2.0*mm,yS+46*mm],[0,yS+46*mm]];
  const A=mediaEn(cuerpo,0,0,0), C=mediaEn(aisl,0,0,0), E=mediaEn(elec,0,0,0);
  L(A.cuerpo,M3.pulido,'bujia'); L(A.corte,H3.aceroN,'bujia');
  L(C.cuerpo,M3.ceramica,'bujia'); L(C.corte,H3.ceramP,'bujia');
  L(E.cuerpo,M3.cobre,'bujia'); L(E.corte,H3.cobreN,'bujia');
  // electrodo de masa en «J», soldado al borde del cuerpo
  const ge=[[-rr+0.6*mm,y0],[-rr+1.9*mm,y0],[-rr+1.9*mm,G.yE-0.4*mm],[1.6*mm,G.yE-0.4*mm],
    [1.6*mm,G.yE-1.7*mm],[-rr+0.6*mm,G.yE-1.7*mm]];
  L(P3.prismaZ([ccw(ge)],-1.25*mm,0,{tapaAtras:true,tapaDelante:true}),M3.pulido,'bujia');
  // bobina de lápiz: bota de goma sobre el aislador y cuerpo hasta salir por la tapa
  const rb=Math.min(d.rPozo-1.5*mm,0.11*B), yb0=yS+18*mm, ytop=d.yTorre+0.10*B;
  const ri=d.rIns+1.2*mm;
  const bota=[[ri,yb0],[rb*0.86,yb0],[rb*0.92,yb0+0.04*B],[rb*0.70,yb0+0.14*B],[rb*0.70,yb0+0.20*B],[ri,yb0+0.20*B]];
  const bob=[[0,yb0+0.18*B],[rb*0.74,yb0+0.18*B],[rb*0.92,yb0+0.30*B],[rb*0.92,ytop],[rb*1.25,ytop+0.02*B],
    [rb*1.25,ytop+0.16*B],[0,ytop+0.16*B]];
  const Bo=mediaEn(bota,0,0,0), Bc=mediaEn(bob,0,0,0);
  L(Bo.cuerpo,M3.goma,'bujia'); L(Bo.corte,H3.gomaP,'bujia');
  L(Bc.cuerpo,M3.plastico,'bujia'); L(Bc.corte,H3.plastN,'bujia');
  // las bobinas de los demás cilindros, enteras, asomando por la tapa
  if(d.ncil>1){
    const pieza=aplana(P3.bobinaEncendido({goma:M3.goma,negro:M3.plastico,acero:M3.pulido},{alto:0.55*B,d:0.17*B,brida:true}));
    const gs=[]; for(let k=1;k<d.ncil;k++){ const c=pieza.clone(); c.translate(0,d.yCov-0.36*B,-k*d.pitch); gs.push(c); }
    L(P3.fusiona(gs),M3.plastico,'bujia');
  }
  mq.electrodo=[0,G.yE];
}

/* Una llamada de dibujo por material y por pieza: las mallas fijas que comparten
   material, clave de selección y sombra se funden en una (con su posición
   horneada). Lo que se mueve va en grupos y no se toca. */
function compacta(g){
  const lotes=new Map(), sueltas=[];
  for(const m of g.children.slice()){
    if(!m.isMesh||m.children.length){ continue; }
    const k=m.material.uuid+'|'+(m.userData.key||'')+'|'+m.castShadow+'|'+m.renderOrder;
    if(!lotes.has(k)) lotes.set(k,[]); lotes.get(k).push(m);
  }
  for(const lista of lotes.values()){
    if(lista.length<2) continue;
    const geos=lista.map(m=>{ m.updateMatrix(); const q=m.geometry.clone(); q.applyMatrix4(m.matrix); return q; });
    const f=P3.fusiona(geos), m0=lista[0];
    const n=new THREE.Mesh(f,m0.material); n.castShadow=m0.castShadow; n.receiveShadow=m0.receiveShadow;
    n.renderOrder=m0.renderOrder; n.userData.key=m0.userData.key;
    for(const m of lista){ g.remove(m); m.geometry.dispose(); }
    for(const q of geos) q.dispose();
    g.add(n);
  }
}

/* Colectores. El primer cilindro tiene su conducto en el plano de corte, así
   que su runner y su colector de escape también van cortados; los de los demás
   cilindros siguen detrás, enteros. */
function tuboZ(r0,r1,z0,z1,x,y,mat,matIn,matC,L,key){   // tubo a lo largo de z, cortado en z = 0
  const len=z0-z1, seg=SEG3()+8;
  const ext=new THREE.CylinderGeometry(r1,r1,len,seg,1,true); ext.rotateX(Math.PI/2); ext.translate(x,y,(z0+z1)/2);
  const int=new THREE.CylinderGeometry(r0,r0,len,seg,1,true); int.rotateX(Math.PI/2); int.translate(x,y,(z0+z1)/2);
  const cara=new THREE.RingGeometry(r0,r1,seg,1); cara.translate(x,y,z0);
  const fondo=new THREE.CircleGeometry(r1,seg); fondo.rotateY(Math.PI); fondo.translate(x,y,z1);
  const tapa=new THREE.CircleGeometry(r0,seg); tapa.translate(x,y,z1+0.002);
  L(P3.fusiona([ext,fondo]),mat,key,true); L(int,matIn,key); L(cara,matC,key); L(tapa,mat===M3.escape?M3.escape:M3.huecoAlu,key);
}
function rutaEntera(pts,r,dz){                   // runner entero de otro cilindro
  const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(p[0],p[1],dz)),false,'centripetal');
  return new THREE.TubeGeometry(c,40,r,14,false);
}
function construyeColectores(mq,L){
  const {G,d}=mq, P=MAQ[mq.mk], B=G.B, VA=G.VA, VE=G.VE, zF=d.zFin;
  // ---------------- admisión ----------------
  const xH=-d.Hw, yeA=yEnX(VA.conducto,xH), rA=VA.rp, tA=0.035*B;
  const ruta=[[xH,yeA],[xH-0.26*B,yeA+0.12*B],[xH-0.52*B,yeA+0.36*B],[xH-0.70*B,yeA+0.72*B],[xH-0.78*B,yeA+1.02*B]];
  const tc=P3.tuboCortado(ruta,rA,rA+tA,{seg:44,radial:14});
  L(tc.pared,M3.alu,'admision',true); L(tc.interior,M3.huecoAlu,'admision'); L(tc.corte,H3.aluN,'admision');
  mq.rutaAdm=tc.linea;
  // brida del runner contra la culata
  { const y0=yeA-rA-0.07*B, y1=yeA+rA+0.07*B, x0=xH-0.07*B, x1=xH;
    const f=SD.resta(SD.caja((x0+x1)/2,(y0+y1)/2,(x1-x0)/2,(y1-y0)/2),SD.banda(tc.linea,rA+tA));
    const caja=[x0-0.02*B,y0-0.02*B,x1+0.02*B,y1+0.02*B];
    L(P3.seccionSDF(f,caja,d.h*0.6).cara,H3.aluN,'admision');
    L(P3.prismaZ([[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]],-(rA+0.10*B),0),M3.alu,'admision'); }
  const otros=[];
  for(let k=1;k<d.ncil;k++) otros.push(rutaEntera(tc.linea,rA+tA,-k*d.pitch));
  const fin=ruta[ruta.length-1];
  if(mq.mk==='compet'||mq.mk==='moto'){
    // trompetas de admisión: la competición lleva una mariposa por cilindro; la moto, su cuerpo de mariposa
    const tromp=[];
    for(let k=0;k<d.ncil;k++){
      const prof=[[rA+tA*0.5,0],[rA+tA*0.5,0.20*B],[rA+0.05*B,0.30*B],[rA+0.12*B,0.36*B],[rA+0.15*B,0.40*B],
        [rA+0.12*B,0.41*B],[rA+0.06*B,0.36*B],[rA,0.28*B],[rA,0]];
      const m=k===0?P3.mediaRevolucion(prof,{seg:SEG3()}):{cuerpo:P3.revolucion(P3.perfilCerrado(prof),{seg:SEG3()}),corte:null};
      const t=tc.linea, a=t[t.length-2], b=t[t.length-1], ang=Math.atan2(-(b[0]-a[0]),b[1]-a[1]);
      P3.coloca(m.cuerpo,b[0],b[1],-k*d.pitch,ang); tromp.push(m.cuerpo);
      if(m.corte){ P3.coloca(m.corte,b[0],b[1],0,ang); L(m.corte,H3.aluN,'admision'); }
    }
    L(P3.fusiona(tromp),M3.alu,'admision',true);
  } else {
    // plenum a lo largo del motor y cuerpo de mariposa (o mezclador de gas) atrás
    const rPl=0.42*B, xPl=fin[0]-0.06*B, yPl=fin[1]+0.30*B;
    tuboZ(rPl-tA,rPl,0,zF+0.05*B,xPl,yPl,M3.alu,M3.huecoAluB,H3.aluN,L,'admision');
    const mar=new THREE.CylinderGeometry(0.30*B,0.30*B,0.34*B,SEG3()); mar.rotateX(Math.PI/2); mar.translate(xPl,yPl,zF-0.12*B);
    const ani=new THREE.TorusGeometry(0.31*B,0.035*B,10,SEG3()); ani.translate(xPl,yPl,zF-0.29*B);
    otros.push(mar,ani);
    mq.plenum=[xPl,yPl,rPl];
  }
  if(otros.length) L(P3.fusiona(otros),M3.alu,'admision',true);

  // inyección: en el conducto (PFI) apuntando al plato, o directa en la culata (GDI)
  if(P.iny==='PFI'){
    const T=[xH-0.05*B,yeA+0.62*rA], Q=ejeV(VA,0.14*B);
    const dir=[Q[0]-T[0],Q[1]-T[1]], l=Math.hypot(dir[0],dir[1]); dir[0]/=l; dir[1]/=l;
    const ang=Math.atan2(dir[0],-dir[1]);           // +Y local = de la punta hacia fuera
    construyeInyector(mq,L,T,ang,0.70*B);
    mq.inyector={punta:T,dir};
  } else if(P.iny==='GDI'){
    const g=d.gdi, ang=Math.atan2(-g.ax[0],g.ax[1]);
    construyeInyector(mq,L,g.punta,ang,g.largo);
    mq.inyector={punta:g.punta,dir:[-g.ax[0],-g.ax[1]]};
  } else mq.inyector=null;                          // planta de gas: mezclador, sin inyector

  // ---------------- escape ----------------
  const xE=d.Hw, yeE=yEnX(VE.conducto,xE), rE=VE.rp, tE=0.05*B;
  const rutaE=[[xE,yeE],[xE+0.30*B,yeE-0.02*B],[xE+0.58*B,yeE-0.24*B],[xE+0.70*B,yeE-0.60*B],[xE+0.74*B,yeE-0.98*B]];
  const te=P3.tuboCortado(rutaE,rE,rE+tE,{seg:44,radial:14});
  L(te.pared,M3.escape,'brida',true); L(te.interior,M3.escape,'brida'); L(te.corte,H3.hierroN,'brida');
  mq.rutaEsc=te.linea;
  { const y0=yeE-rE-0.08*B, y1=yeE+rE+0.08*B, x0=xE, x1=xE+0.08*B;
    const f=SD.resta(SD.caja((x0+x1)/2,(y0+y1)/2,(x1-x0)/2,(y1-y0)/2),SD.banda(te.linea,rE+tE));
    L(P3.seccionSDF(f,[x0-0.02*B,y0-0.02*B,x1+0.02*B,y1+0.02*B],d.h*0.6).cara,H3.hierroN,'brida');
    L(P3.prismaZ([[[x0,y0],[x1,y0],[x1,y1],[x0,y1]]],-(rE+0.12*B),0),M3.escape,'brida'); }
  const finE=rutaE[rutaE.length-1], rCo=0.34*B, xCo=finE[0]+0.02*B, yCo=finE[1]-0.20*B;
  tuboZ(rCo-tE,rCo,0,zF+0.05*B,xCo,yCo,M3.escape,M3.escapeB,H3.hierroN,L,'brida');
  const oE=[];
  for(let k=1;k<d.ncil;k++) oE.push(rutaEntera(te.linea,rE+tE,-k*d.pitch));
  const sal=new THREE.CylinderGeometry(0.26*B,0.26*B,0.9*B,SEG3()); sal.translate(xCo,yCo-0.5*B,zF+0.35*B); oE.push(sal);
  L(P3.fusiona(oE),M3.escape,'brida',true);
  // termopar en el runner, justo después de la brida: es el que mide T_brida
  const tp=P3.termoparVaina({acero:M3.pulido},{largo:0.62*B,d:0.05*B,mango:0.24*B});
  const pt=P3.curvaPlana(rutaE,40)[7];
  tp.position.set(pt[0],pt[1],0); tp.rotation.z=-0.32; marca3(tp,'brida'); mq.g.add(tp);
  mq.termopar=pt;
}
function construyeInyector(mq,L,punta,ang,largo){
  const B=mq.G.B;
  const acero=[[0,0],[0.020*B,0],[0.026*B,0.05*B],[0.040*B,0.07*B],[0.045*B,largo*0.55],[0.060*B,largo*0.58],
    [0.060*B,largo*0.62],[0,largo*0.62]];
  const plas=[[0,largo*0.62],[0.075*B,largo*0.62],[0.080*B,largo*0.86],[0.050*B,largo*0.90],[0.050*B,largo],[0,largo]];
  for(const [per,mat,hat] of [[acero,M3.pulido,H3.aceroP],[plas,M3.plastico,H3.plastN]]){
    const m=P3.mediaRevolucion(per,{seg:SEG3()});
    P3.coloca(m.cuerpo,punta[0],punta[1],0,ang); P3.coloca(m.corte,punta[0],punta[1],0.0012,ang);
    L(m.cuerpo,mat,'admision'); L(m.corte,hat,'admision');
  }
  // los inyectores de los demás cilindros y la rampa de combustible
  const d=mq.d, gs=[];
  const sx=-Math.sin(ang), sy=Math.cos(ang), ext=[punta[0]+sx*largo,punta[1]+sy*largo];
  for(let k=1;k<d.ncil;k++){ const c=P3.revolucion(acero.slice(0,-1).concat(plas.slice(1)),{seg:16}); P3.coloca(c,punta[0],punta[1],-k*d.pitch,ang); gs.push(c); }
  const rampa=new THREE.CylinderGeometry(0.07*B,0.07*B,(d.ncil-1)*d.pitch+0.35*B,SEG3()); rampa.rotateX(Math.PI/2);
  rampa.translate(ext[0]+sx*0.05*B,ext[1]+sy*0.05*B,-((d.ncil-1)*d.pitch+0.35*B)/2-0.06*B);
  gs.push(rampa);
  L(P3.fusiona(gs),M3.pulido,'admision',true);
}

/* Banco: placa al suelo y cuatro postes en doble T atornillados a la brida del
   cárter, todos por detrás del corte para no tapar la sección. */
function construyeBanco(mq,L){
  const {G,d}=mq, B=G.B, yPl=d.yPan-0.26/K3, ePl=0.10/K3;
  const xs=d.xC+0.62*B, z0=d.zFin-0.25*B, z1=0.45*B;
  const pl=new THREE.BoxGeometry(2*xs,ePl,z1-z0); pl.translate(0,yPl-ePl/2,(z0+z1)/2);
  const gs=[pl], h=d.yRail-yPl;
  for(const s of [-1,1]) for(const zf of [0.25,0.80]){
    const x=s*(d.xC+0.02*B), z=d.zFin*zf, a=0.16*B, e=0.022*B;
    const alma=new THREE.BoxGeometry(e,h,a); alma.translate(x,yPl+h/2,z);
    for(const k of [-1,1]){ const ala=new THREE.BoxGeometry(a*0.8,h,e); ala.translate(x,yPl+h/2,z+k*a/2); gs.push(ala); }
    const pie=new THREE.BoxGeometry(a*1.2,e*1.5,a*1.4); pie.translate(x,yPl+e*0.75,z);
    const cab=new THREE.BoxGeometry(a*1.1,e*1.2,a*1.2); cab.translate(x,d.yRail-e*0.6,z);
    gs.push(alma,pie,cab);
  }
  L(P3.fusiona(gs),M3.pintura,null,true);
  mq.yPlaca=yPl;
}

/* ---------- LO QUE SE MUEVE ---------- */
function envolvente(pts){                      // envolvente convexa (cadena monótona)
  const p=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
  const lo=[], hi=[];
  for(const q of p){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0) lo.pop(); lo.push(q); }
  for(let i=p.length-1;i>=0;i--){ const q=p[i]; while(hi.length>=2&&cr(hi[hi.length-2],hi[hi.length-1],q)<=0) hi.pop(); hi.push(q); }
  return lo.slice(0,-1).concat(hi.slice(0,-1));
}
function geometriaBiela(G,d){
  /* Biela en doble T, ENTERA —en un plano de conjunto los ejes, los bulones y
     las bielas no se cortan—: ojo de la cabeza con su sombrerete y sus dos
     tornillos, caña con dos alas a todo el ancho y el alma a un tercio, y pie. */
  const B=G.B, L=G.L, w=d.wBie, P=[];
  P.push(P3.extruido(P3.circulo(0,0,d.rCab,44),{huecos:[P3.circulo(0,0,d.rMuq,36)],espesor:w,bisel:0.012*B}));
  P.push(P3.extruido(P3.circulo(0,L,d.rPie,36),{huecos:[P3.circulo(0,L,d.rBul,28)],espesor:w*0.86,bisel:0.010*B}));
  const y0=d.rCab*0.78, y1=L-d.rPie*0.70, a0=0.17*B, a1=0.095*B, fl=0.05*B;
  P.push(P3.extruido([[-a0+fl*0.5,y0],[a0-fl*0.5,y0],[a1-fl*0.5,y1],[-a1+fl*0.5,y1]],{espesor:w*0.36,bisel:0}));
  for(const s of [-1,1]) P.push(P3.extruido(ccw([[s*a0,y0],[s*(a0-fl),y0],[s*(a1-fl),y1],[s*a1,y1]]),{espesor:w*0.96,bisel:0.006*B}));
  for(const s of [-1,1]){ const t=new THREE.CylinderGeometry(0.05*B,0.05*B,0.07*B,6); t.translate(s*(d.rMuq+0.05*B),-d.rCab*0.93,0); P.push(t); }
  const cas=new THREE.TorusGeometry(d.rBul+0.012*B,0.010*B,6,28); cas.translate(0,L,w*0.43); P.push(cas);
  return P3.fusiona(P);
}
function geometriaCiguenal(G,d){
  const B=G.B, a=G.a, z0=-(d.wBie/2+0.012*B), z1=z0-d.tBra, zA=d.zMam-0.04*B;
  const muq=new THREE.CylinderGeometry(d.rMuq,d.rMuq,-z0,36); muq.rotateX(Math.PI/2); muq.translate(0,a,z0/2);
  const apo=new THREE.CylinderGeometry(d.rApo,d.rApo,z1-zA,36); apo.rotateX(Math.PI/2); apo.translate(0,0,(z1+zA)/2);
  const pts=[];
  for(let i=0;i<28;i++){ const t=i/28*2*Math.PI;
    pts.push([Math.cos(t)*(d.rMuq+0.08*B),a+Math.sin(t)*(d.rMuq+0.08*B)]);
    pts.push([Math.cos(t)*(d.rApo+0.07*B),Math.sin(t)*(d.rApo+0.07*B)]); }
  for(let i=0;i<=24;i++){ const t=-Math.PI/2+(-64+128*i/24)*DEG; pts.push([Math.cos(t)*d.rCw,Math.sin(t)*d.rCw]); }
  const br=P3.extruido(P3.contornoRedondeado(envolvente(pts),0.025*B,3),{espesor:d.tBra,bisel:0.014*B});
  br.translate(0,0,(z0+z1)/2);
  return {acero:br, pulido:P3.fusiona([muq,apo])};
}
function construyeMovil(mq){
  const {G,d,g}=mq, B=G.B;
  // cigüeñal
  mq.cig=new THREE.Group(); g.add(mq.cig);
  const cg=geometriaCiguenal(G,d);
  mq.cig.add(mk3(cg.acero,M3.acero,true)); mq.cig.add(mk3(cg.pulido,M3.pulido,true)); marca3(mq.cig,'cigue');
  // biela
  mq.bie=new THREE.Group(); g.add(mq.bie);
  mq.bie.add(mk3(geometriaBiela(G,d),M3.acero,true)); marca3(mq.bie,'biela');
  // válvulas con su platillo y su vaso, muelles, levas
  mq.valv=[];
  for(const V of [G.VA,G.VE]){
    const pf=V.perfiles, cu=[], co=[];
    for(const per of [pf.valv,pf.plat,pf.vaso]){ const m=P3.mediaRevolucion(per,{seg:SEG3()}); cu.push(m.cuerpo); co.push(m.corte); }
    const grp=new THREE.Group(); grp.rotation.z=phiV(V);
    grp.add(mk3(P3.fusiona(cu),M3.pulido,true)); grp.add(mk3(P3.fusiona(co),H3.valvula));
    g.add(grp);
    const mu=P3.muelleCortado({r:PROP3D.muelleR*B,hilo:PROP3D.muelleHilo*B,vueltas:PROP3D.muelleVueltas,
      largo:PROP3D.muelleL*B,seg:calAlta()?18:12,radial:calAlta()?8:6});
    const gm=new THREE.Group(); const base=ejeV(V,d.sMue); gm.position.set(base[0],base[1],0); gm.rotation.z=phiV(V);
    gm.add(mk3(mu.tubo,M3.muelle)); gm.add(mk3(mu.caras,LLENO.muelle)); g.add(gm);
    const lc=P3.levaCortada(perfilLeva(V,240),d.anchoLeva);
    const arb=new THREE.CylinderGeometry(d.rArbol,d.rArbol,-d.zFin-d.anchoLeva/2,SEG3()); arb.rotateX(Math.PI/2);
    arb.translate(0,0,(d.zFin-d.anchoLeva/2)/2);
    const gl=new THREE.Group(); gl.position.set(V.cam[0],V.cam[1],0);
    gl.add(mk3(P3.fusiona([lc.cuerpo,arb]),M3.acero,true)); gl.add(mk3(lc.corte,H3.aceroN)); g.add(gl);
    const key=V.lado<0?'vadm':'vesc';
    marca3(grp,key); marca3(gm,key); marca3(gl,'levas');
    mq.valv.push({V,grp,muelle:mu,gm,leva:gl});
  }
  mq.pis=new THREE.Group(); g.add(mq.pis); marca3(mq.pis,'piston');
}
// El pistón depende de r (su altura de compresión), y se guarda uno por r.
function pistonDe(mq,r){
  if(mq.pistones[r]) return mq.pistones[r];
  const G=cotas3D(mq.mk,r), d=mq.d, B=G.B, R=G.R, pf=perfilPiston(G,d), grp=new THREE.Group();
  const m=P3.mediaRevolucion(pf.p,{seg:SEG3()+8});
  const pin=new THREE.CylinderGeometry(d.rBul,d.rBul,R-0.05*B,24); pin.rotateX(Math.PI/2); pin.translate(0,0,-(R-0.05*B)/2);
  const z0=-(d.wBie/2+0.01*B), z1=-(R-0.07*B);
  const boss=new THREE.CylinderGeometry(0.17*B,0.17*B,z0-z1,24); boss.rotateX(Math.PI/2); boss.translate(0,0,(z0+z1)/2);
  const pun=new THREE.BoxGeometry(0.22*B,G.hComp-0.075*B-0.06*B,z0-z1); pun.translate(0,(G.hComp-0.075*B+0.06*B)/2,(z0+z1)/2);
  grp.add(mk3(P3.fusiona([m.cuerpo,boss,pun]),M3.piston,true)); grp.add(mk3(m.corte,H3.pistonN));
  grp.add(mk3(pin,M3.pulido));
  const ac=[], aco=[];
  for(const a of pf.aros){ const s=P3.mediaRevolucion(a,{seg:SEG3()+8}); ac.push(s.cuerpo); aco.push(s.corte); }
  grp.add(mk3(P3.fusiona(ac),M3.segmento)); grp.add(mk3(P3.fusiona(aco),LLENO.segmento));
  marca3(grp,'piston');
  return (mq.pistones[r]=grp);
}

// ---- 8.4 · LA CARGA: gas, frente de llama, chispa, autoencendido y partículas ----
/* ESCALA TÉRMICA ÚNICA. La misma tabla pinta el gas, las partículas y la
   leyenda rotulada de la barra: un color quiere decir una temperatura. */
const ESCALA_T=[[250,'#1c3f94'],[400,'#2f6fd0'],[650,'#5a5fc8'],[900,'#9a46a8'],[1200,'#d23f5c'],
  [1600,'#f0642c'],[2000,'#f98a1c'],[2500,'#ffb627'],[3000,'#ffd84a'],[3500,'#fff1a6']];
const ESCALA_C=ESCALA_T.map(([t,h])=>[t,new THREE.Color(h)]);
function colorT(T,out){
  const o=out||new THREE.Color(), E=ESCALA_C;
  if(!(T>E[0][0])) return o.copy(E[0][1]);
  for(let i=1;i<E.length;i++) if(T<=E[i][0]){ const f=(T-E[i-1][0])/(E[i][0]-E[i-1][0]);
    return o.copy(E[i-1][1]).lerp(E[i][1],f); }
  return o.copy(E[E.length-1][1]);
}

/* EL GAS EN EL PLANO DE CORTE: una lámina detrás de las caras de sección, que
   sólo se ve por el hueco de la cámara. El sombreador recorta la cámara de
   verdad —la corona del pistón, la camisa y el techo a dos aguas— y pinta dos
   zonas: la sin quemar a T_u y la quemada a T_b, separadas por el frente, que
   en este plano es un círculo de radio R_f centrado en el electrodo. */
const GAS_U={uCor:{value:0},uApex:{value:0},uTan:{value:0.25},uR:{value:0.4},uB:{value:0.8},
  uE:{value:new THREE.Vector2()},uRf:{value:0},uCu:{value:new THREE.Color()},uCb:{value:new THREE.Color()},
  uAu:{value:0.5},uAb:{value:0.88},uK:{value:new THREE.Vector2()},uRk:{value:0},uKon:{value:0},
  uCk:{value:new THREE.Color()},uOnda:{value:0},uTh:{value:0},uFr:{value:0}};
const gasMat=new THREE.ShaderMaterial({uniforms:GAS_U,transparent:true,depthWrite:false,
  vertexShader:`varying vec2 vP; void main(){ vP=position.xy; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader:`
uniform float uCor,uApex,uTan,uR,uB,uRf,uAu,uAb,uRk,uKon,uOnda,uTh,uFr;
uniform vec2 uE,uK; uniform vec3 uCu,uCb,uCk; varying vec2 vP;
float hs(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float rd(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hs(i),hs(i+vec2(1.0,0.0)),f.x),mix(hs(i+vec2(0.0,1.0)),hs(i+vec2(1.0,1.0)),f.x),f.y); }
void main(){
  float x=vP.x, y=vP.y;
  if(abs(x)>uR||y<uCor||y>uApex-abs(x)*uTan) discard;
  vec2 q=vP/uB*6.0+vec2(uTh*0.011,-uTh*0.017);
  float n=0.84+0.16*(0.6*rd(q)+0.4*rd(q*2.3+3.1));
  vec3 c=uCu*n; float a=uAu;
  float d=length(vP-uE);
  if(uRf>0.0){
    float w=0.005*uB;
    float qb=1.0-smoothstep(uRf-w,uRf+w,d);
    c=mix(c,uCb*(0.80+0.14*n),qb); a=mix(a,uAb,qb);
    float an=exp(-pow((d-uRf)/(0.011*uB),2.0))*uFr;
    c+=vec3(1.30,0.62,0.16)*an*(0.6+0.5*n); a=max(a,an*0.92);
  }
  if(uKon>0.0){
    float dk=length(vP-uK);
    // el foco: nace en el último gas sin quemar y se extiende a c_u; el plano de corte
    // apenas corta ese gas, así que se dibuja encima, con su borde, y no más allá de 0,16·B
    float rk=min(uRk,0.16*uB);
    float qk=1.0-smoothstep(rk-0.006*uB,rk+0.006*uB,dk);
    float bk=exp(-pow((dk-rk)/(0.010*uB),2.0));
    c=mix(c,uCk*(1.05+0.2*n),qk*uKon); c=mix(c,vec3(0.85,0.04,0.42),0.95*bk*uKon); a=mix(a,0.97,max(qk,bk)*uKon);
    // frentes de presión: salen del foco a la velocidad del sonido y, como rebotan en
    // las paredes, se dibujan saliendo una y otra vez mientras dura el golpeteo
    float s=0.02*uB, on=0.0;
    for(int k=0;k<3;k++){ float rr=mod(uRk+float(k)*uOnda/3.0,uOnda); on+=exp(-pow((dk-rr)/s,2.0))*(1.0-rr/uOnda); }
    c=mix(c,vec3(0.02,0.42,0.85),min(1.0,1.3*on)*uKon); a=max(a,min(1.0,on)*uKon);
  }
  gl_FragColor=vec4(c,a);
}`});
const gasPlano=new THREE.Mesh(new THREE.PlaneGeometry(1,1),gasMat);
gasPlano.renderOrder=3; gasPlano.frustumCulled=false; MOTOR.add(gasPlano);
// Sólo contesta al clic donde se dibuja: dentro de la cámara, no en el hueco del pistón.
gasPlano.raycast=function(rc,out){
  const tmp=[]; THREE.Mesh.prototype.raycast.call(this,rc,tmp);
  for(const h of tmp){ const p=MOTOR.worldToLocal(h.point.clone()), U=GAS_U;
    if(Math.abs(p.x)<=U.uR.value&&p.y>=U.uCor.value&&p.y<=U.uApex.value-Math.abs(p.x)*U.uTan.value) out.push(h); }
};

/* EL FRENTE EN 3D: media esfera del mismo radio detrás del corte, recortada
   por las mismas paredes en el sombreador. Su volumen recortado es y_b·V. */
const LLAMA_U={uRf:{value:0},uE:{value:new THREE.Vector2()},uCor:{value:0},uApex:{value:0},uTan:{value:0.25},
  uR:{value:0.4},uCol:{value:new THREE.Color('#ff9a3c')},uI:{value:0}};
const llamaMat=new THREE.ShaderMaterial({uniforms:LLAMA_U,transparent:true,depthWrite:false,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending,
  vertexShader:`uniform float uRf; uniform vec2 uE; varying vec3 vL; varying vec3 vN; varying vec3 vV;
void main(){ vec3 p=position*uRf+vec3(uE,0.0); vL=p; vec4 mv=modelViewMatrix*vec4(p,1.0); vV=-mv.xyz;
  vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*mv; }`,
  fragmentShader:`uniform float uCor,uApex,uTan,uR,uI; uniform vec3 uCol; varying vec3 vL; varying vec3 vN; varying vec3 vV;
void main(){
  if(vL.z>0.0||vL.x*vL.x+vL.z*vL.z>uR*uR||vL.y<uCor||vL.y>uApex-abs(vL.x)*uTan) discard;
  float f=1.0-abs(dot(normalize(vN),normalize(vV))); f=f*f;
  gl_FragColor=vec4(uCol*(0.05+0.60*f)*uI,(0.03+0.30*f)*uI);
}`});
const llamaMalla=new THREE.Mesh(new THREE.SphereGeometry(1,48,32),llamaMat);
llamaMalla.renderOrder=1; llamaMalla.frustumCulled=false; MOTOR.add(llamaMalla); marca3(llamaMalla,'llama');
// la esfera la coloca el sombreador: el clic sobre la llama lo resuelve la lámina de gas
llamaMalla.raycast=()=>{};

/* LA CHISPA: arco y descarga luminiscente entre los electrodos, y una luz que
   alumbra la cámara —la misma luz sigue luego a la llama—. */
const chispa=(function(){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const x=c.getContext('2d'), gr=x.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.18,'rgba(200,225,255,0.95)');
  gr.addColorStop(0.45,'rgba(120,160,255,0.35)'); gr.addColorStop(1,'rgba(80,120,255,0)');
  x.fillStyle=gr; x.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
  s.renderOrder=5; s.raycast=()=>{}; MOTOR.add(s); return s;
})();
const luzCamara=new THREE.PointLight('#ffb070',0,3.2,2); MOTOR.add(luzCamara);
/* EL FOCO DE AUTOENCENDIDO, marcado delante del corte: la cámara cerca del PMS es
   tan delgada que el foco y sus frentes caben en una rendija; esta marca dice dónde. */
const focoK=(function(){
  const c=document.createElement('canvas'); c.width=c.height=128;
  const x=c.getContext('2d'), gr=x.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.22,'rgba(255,170,230,0.95)');
  gr.addColorStop(0.5,'rgba(220,40,140,0.45)'); gr.addColorStop(1,'rgba(160,0,90,0)');
  x.fillStyle=gr; x.fillRect(0,0,128,128);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,blending:THREE.AdditiveBlending,depthWrite:false,depthTest:false,transparent:true}));
  s.renderOrder=6; s.visible=false; s.raycast=()=>{}; MOTOR.add(s); return s;
})();

/* PARTÍCULAS: un solo `Points` con color y tamaño por punto. Cada una es una
   porción de carga y su posición es función del ángulo, no del tiempo: parada
   la reproducción, quietas; un paso atrás, vuelven. */
const PART={geo:null,pts:null,n:0};
const partMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
  uniforms:{uTam:{value:300}},
  vertexShader:`attribute vec4 aCol; attribute float aTam; uniform float uTam; varying vec4 vC;
void main(){ vC=aCol; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv;
  gl_PointSize=aCol.a>0.003?max(1.5,uTam*aTam/max(0.05,-mv.z)):0.0; }`,
  fragmentShader:`varying vec4 vC; void main(){ vec2 q=gl_PointCoord*2.0-1.0; float r=dot(q,q); if(r>1.0) discard;
  gl_FragColor=vec4(vC.rgb*(1.1-0.35*r),vC.a*(1.0-r)*(1.0-r)); }`});
function preparaParticulas(){
  const alta=calAlta();
  const Nc=alta?380:150, Ni=alta?150:60, Ne=alta?130:50, Ns=alta?70:28;
  const n=Nc+Ni+Ne+Ns;
  if(PART.pts){ MOTOR.remove(PART.pts); PART.geo.dispose(); }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aCol',new THREE.BufferAttribute(new Float32Array(n*4),4).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aTam',new THREE.BufferAttribute(new Float32Array(n),1));
  const pts=new THREE.Points(geo,partMat); pts.frustumCulled=false; pts.renderOrder=4; pts.raycast=()=>{}; MOTOR.add(pts);
  // semillas deterministas: las mismas porciones en cada visita
  const h=new Float32Array(n*4); let s=20251012;
  for(let i=0;i<h.length;i++){ s=(s*1664525+1013904223)>>>0; h[i]=s/4294967296; }
  Object.assign(PART,{geo,pts,n,Nc,Ni,Ne,Ns,h,cfg:''});
}

// ---- 8.5 · INSTRUMENTOS DEL BANCO ----
// Manómetro de cilindro: la aguja lee p(θ), con la escala hasta 1,1 veces el
// límite de la máquina y las marcas rojas desde el 80 %.
function manometro(){
  const g=new THREE.Group();
  const cja=new THREE.Mesh(new THREE.CylinderGeometry(0.20,0.20,0.06,32),M3.pulido);
  cja.rotation.x=Math.PI/2; g.add(cja);
  const bis=new THREE.Mesh(new THREE.TorusGeometry(0.192,0.014,10,40),M3.pulido); bis.position.z=0.03; g.add(bis);
  const esf=new THREE.Mesh(new THREE.CircleGeometry(0.178,32),new THREE.MeshBasicMaterial({color:'#0d1220'}));
  esf.position.z=0.032; g.add(esf);
  const marcas=[], rojas=[];
  for(let i=0;i<=10;i++){
    const a=-Math.PI*0.75+1.5*Math.PI*i/10, t=new THREE.BoxGeometry(0.016,0.036,0.004);
    t.rotateZ(-a); t.translate(0.140*Math.sin(a),0.140*Math.cos(a),0.035); (i>=8?rojas:marcas).push(t);
  }
  g.add(new THREE.Mesh(P3.fusiona(marcas),new THREE.MeshBasicMaterial({color:'#7b8798'})));
  g.add(new THREE.Mesh(P3.fusiona(rojas),new THREE.MeshBasicMaterial({color:BAD_HEX})));
  const piv=new THREE.Group(); g.add(piv);
  const ag=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.150,0.005),new THREE.MeshBasicMaterial({color:'#ff5a4f'}));
  ag.position.set(0,0.07,0.039); piv.add(ag);
  const cen=new THREE.Mesh(new THREE.CircleGeometry(0.022,16),new THREE.MeshBasicMaterial({color:'#c8d3e2'}));
  cen.position.z=0.043; g.add(cen);
  const rac=new THREE.Mesh(new THREE.CylinderGeometry(0.035,0.035,0.16,12),M3.pulido); rac.position.y=-0.26; g.add(rac);
  marca3(g,'mano');
  return {g,piv};
}
const MAN=manometro(); MOTOR.add(MAN.g);
const capilar=new THREE.Mesh(new THREE.BufferGeometry(),M3.pulido); MOTOR.add(capilar); marca3(capilar,'mano');

// Sensor de detonación: un piezoeléctrico atornillado al flanco del bloque.
const KNK=new THREE.Group(); MOTOR.add(KNK);
const knkLed=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),new THREE.MeshStandardMaterial({color:OK_HEX,
  emissive:OK_HEX,emissiveIntensity:0.6,roughness:0.35,metalness:0.1}));
(function(){
  const cu=new THREE.Mesh(P3.revolucion([[0,0],[1,0],[1,0.42],[0.82,0.60],[0.42,0.60],[0.42,0.95],[0,0.95]],{seg:28}),M3.plastico);
  KNK.add(cu);
  const con=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.36,0.62),M3.plastico); con.position.set(0,0.30,0.75); KNK.add(con);
  knkLed.scale.setScalar(0.17); knkLed.position.set(0,1.02,0); KNK.add(knkLed);
  marca3(KNK,'deton');
})();

// Cuadro de recepción: siete pilotos, uno por criterio del pliego.
const CUADRO=new THREE.Group(); scene.add(CUADRO);
const pilotos=[];
(function(){
  const p=roundedBox(0.74,1.58,0.16,std('#1b2230',0.72,0.18),0.04); CUADRO.add(p);
  const t=roundedBox(0.66,0.12,0.02,MAT.negro,0.01); t.position.set(0,0.86,0.09); CUADRO.add(t);
  const aros=[], barras=[];
  CRIT.forEach((c,i)=>{
    const led=new THREE.Mesh(new THREE.SphereGeometry(0.055,18,14),MAT.verde.clone());
    led.position.set(-0.20,0.62-i*0.20,0.09); CUADRO.add(led); pilotos.push(led);
    const rr=new THREE.TorusGeometry(0.075,0.014,10,20); rr.translate(-0.20,0.62-i*0.20,0.08); aros.push(rr);
    const b=new THREE.BoxGeometry(0.30,0.05,0.02); b.translate(0.16,0.62-i*0.20,0.09); barras.push(b);
  });
  CUADRO.add(new THREE.Mesh(P3.fusiona(aros),MAT.aceroC));
  CUADRO.add(new THREE.Mesh(P3.fusiona(barras),std('#39424f',0.8,0.1)));
  const pa=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.30,12),MAT.acero);
  pa.position.set(0,-0.94,0); CUADRO.add(pa);
  marca3(CUADRO,'cuadro');
})();

// ===================== 9. LA MÁQUINA SIGUE A LA TRAZA =====================
/* Contrato de fidelidad: la geometría dibujada es la geometría simulada y hay
   UN solo reloj, el ángulo de cigüeñal. De él salen en cada cuadro el pistón
   (biela-manivela exacta), las levas (a media vuelta), los alzados, el color
   del gas, el frente de llama, el punto del pizarrón y los números del panel.
   Dentro del periodo cerrado todo se lee de la traza del motor, interpolada
   entre sus muestras de 2°; fuera, del estado supuesto de 8.1, y la pantalla lo
   dice. */

// ---- 9.1 · EL RELOJ ÚNICO ----
const VEL_N=[50,100,200,500,1000,2000,5000,10000];
const REDUCIDO=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
const RELOJ={c:556, pausa:REDUCIDO, N:200, lento:true, k:1, auto:true};
// Cámara lenta por defecto: la que deja un ciclo entero en unos siete segundos.
function nPorDefecto(mk){
  const T=720/(6*MAQ[mk].rpm); let mejor=VEL_N[0], e=1e9;
  for(const N of VEL_N){ const x=Math.abs(Math.log(T*N/7)); if(x<e){ e=x; mejor=N; } }
  return mejor;
}
let PER3D=720/(6*MAQ.sedan.rpm)*nPorDefecto('sedan');   // segundos por ciclo de 720° a la velocidad elegida
const suave=x=>{ x=clamp(x,0,1); return x*x*(3-2*x); };
/* «Lento en la combustión»: alrededor de la chispa y de los Δθ de la llama la
   reproducción se frena seis veces más, y el rótulo de la barra dice en cada
   instante cuántas veces más lenta que el motor real va la imagen. */
function factorLento(c){
  if(!RELOJ.lento||!CUR) return 1;
  const th=thDe(c), a=-CUR.avance-10, b=-CUR.avance+CUR.dth+10, r=12;
  return 1+5*Math.min(suave((th-(a-r))/r),suave(((b+r)-th)/r));
}
function avanzaReloj(dt){
  RELOJ.k=factorLento(RELOJ.c);
  if(RELOJ.pausa) return;
  const rpm=maqAct().rpm;
  RELOJ.c=cicloDe(RELOJ.c+Math.min(dt,0.1)*6*rpm/(RELOJ.N*RELOJ.k));
}

// ---- 9.2 · EL ESTADO EN CADA ÁNGULO ----
const ZON={R:null};
function zonas(){
  if(ZON.R===CUR) return ZON;
  const R=CUR, tr=R.traza, P=maqAct();
  ZON.R=R; ZON.z=dosZonas(tr,-R.avance);
  // El autoencendido: el primer ángulo con I ≥ 1, interpolado entre muestras.
  ZON.thK=null;
  if(R.Ilw>=1) for(let i=1;i<tr.th.length;i++) if(tr.I[i]>=1){
    const f=(1-tr.I[i-1])/(tr.I[i]-tr.I[i-1]);
    ZON.thK=tr.th[i-1]+f*(tr.th[i]-tr.th[i-1]);
    const Tu=ZON.z.Tu[i-1]+f*(ZON.z.Tu[i]-ZON.z.Tu[i-1]);
    ZON.TuK=Tu; ZON.cU=Math.sqrt(gammaAire(Tu)*R_GAS*Tu);        // velocidad del sonido del gas sin quemar
    break;
  }
  // Tablas de grado en grado de la carga fresca admitida y del gas expulsado.
  const QI=new Float32Array(721), QE=new Float32Array(721), m=R.mTot;
  for(let c=0;c<=720;c++){
    if(c>=TH_EVO&&c<=DIST.ivc){ const A=estadoAbierto(R,P,c);
      QI[c]=A.Q; QE[c]=c<=DIST.evc?Math.max(0,1-A.p*A.V/(R_GAS*A.T*m)):0; }
    else { QI[c]=c>DIST.ivc||c<TH_EVO?1:0; QE[c]=0; }
  }
  for(let c=DIST.evc+1;c<=720;c++) QE[c]=QE[DIST.evc];
  for(let c=0;c<TH_EVO;c++) QE[c]=0;
  ZON.QI=QI; ZON.QE=QE; ZON.qeFin=QE[DIST.evc];
  PART.cfg='';
  return ZON;
}
const tablaQ=(T,c)=>{ c=cicloDe(c); const i=Math.floor(c), f=c-i; return T[i]+(T[Math.min(720,i+1)]-T[i])*f; };
const ESTADO={};
let FR=0;                        // la muestra de la traza más cercana al ángulo dibujado
function estadoEn(c){
  const R=CUR, tr=R.traza, P=maqAct(), Z=zonas(), E=ESTADO;
  c=cicloDe(c); const th=thDe(c);
  E.c=c; E.th=th; E.fase=faseDe(c);
  E.cerrado=th>=TH_IVC&&th<=TH_EVO;
  FR=clamp(Math.round((th-TH_IVC)/2),0,tr.th.length-1);
  if(E.cerrado){
    const u=(th-TH_IVC)/2, i=Math.min(tr.th.length-2,Math.floor(u)), f=u-i, I=a=>a[i]+(a[i+1]-a[i])*f;
    E.p=I(tr.p); E.T=I(tr.T); E.xb=I(tr.xb); E.I=I(tr.I); E.Tu=I(Z.z.Tu); E.yb=I(Z.z.yb);
    const b0=Z.z.Tb[i], b1=Z.z.Tb[i+1];
    E.Tb=b0===null&&b1===null?null:(b0===null?b1:(b1===null?b0:b0+(b1-b0)*f));
    E.tramo='cerrado'; E.Q=1;
  } else {
    const A=estadoAbierto(R,P,c);
    E.p=A.p; E.T=A.T; E.Q=A.Q; E.tramo=A.tramo;
    E.xb=c<=DIST.ivo?1:0; E.I=c<=DIST.ivo?R.Ilw:0; E.Tu=A.T; E.Tb=null; E.yb=E.xb;
  }
  E.V=vol(geom(P,R.r),th*DEG);
  const G=MQ.Gr;
  E.yBul=bulonY(G,th); E.yCor=E.yBul+G.hComp;
  E.ardiendo=E.cerrado&&E.xb>0&&E.xb<0.9995;
  E.Rf=E.ardiendo?radioFrente(G,th,E.yb):0;
  E.chispa=-R.avance; E.dGlow=6*P.rpm*1.2e-3;      // descarga luminiscente de ~1,2 ms, en grados
  E.knock=ZON.thK!==null&&E.cerrado&&th>=ZON.thK;
  return E;
}

// ---- 9.3 · MONTAJE DE LA MÁQUINA ELEGIDA ----
const X0=0.95, Z0=0.55;
S.controls.minDistance=0.7;                     // la vista de la cámara se acerca a una cuarta de metro                          // dónde se apoya la maqueta en el banco
let mkVisto=null;
function aplicaGeom(){
  const c=cfgDe(mode), P=MAQ[c.mk];
  if(!MAQUETAS[c.mk]) MAQUETAS[c.mk]=construyeMaqueta(c.mk);
  const mq=MAQUETAS[c.mk], cambio=MQ!==mq;
  if(cambio){
    if(MQ) MOTOR.remove(MQ.g);
    MQ=mq; MOTOR.add(mq.g); escalaRayado(mq.G.B);
    MOTOR.position.set(X0,0.36-K3*mq.d.yPan,Z0);
    colocaInstrumentos(mq);
    construyeRotulos(mq);
  }
  // el pistón de ESTA relación de compresión
  const pis=pistonDe(mq,c.r);
  if(mq.pis.children[0]!==pis){ while(mq.pis.children.length) mq.pis.remove(mq.pis.children[0]); mq.pis.add(pis); }
  mq.Gr=cotas3D(c.mk,c.r);
  // la culata no cambia con r: las válvulas guardan lo que se les calculó al construirla
  for(const k of ['VA','VE']) for(const f of ['dist','rIns','rp','conducto']) mq.Gr[k][f]=mq.G[k][f];
  // la lámina de gas cubre toda la carrera; las cotas del recorte son fijas por máquina
  const G=mq.Gr, yBaja=coronaY(G,180)-0.01, yAlta=G.yApex+0.01;
  // la geometría va en coordenadas del motor: el sombreador recorta con ellas
  gasPlano.geometry.dispose();
  gasPlano.geometry=new THREE.PlaneGeometry(2*G.R+0.01,yAlta-yBaja).translate(0,(yAlta+yBaja)/2,0);
  gasPlano.position.set(0,0,-0.004);
  for(const U of [GAS_U,LLAMA_U]){ U.uApex.value=G.yApex; U.uTan.value=G.tanA; U.uR.value=G.R-0.0015; U.uE.value.set(0,G.yE); }
  GAS_U.uB.value=G.B;
  // el colector se pone al rojo con la temperatura de BRIDA de esta calibración
  const qt=clamp((CUR.Tbrida-650)/600,0,1);
  for(const m of [M3.escape,M3.escapeB]){ m.emissive.setHSL(0.008,1,0.006+0.045*qt*qt); }
  if(mkVisto!==c.mk){
    if(RELOJ.auto) RELOJ.N=nPorDefecto(c.mk);
    if(mkVisto!==null&&(mode==='ciclo'||mode==='reto')){ const v=vistaCam(VISTA.actual); S.moveTo(v[0],v[1]); }
    mkVisto=c.mk;
  }
  PER3D=720/(6*P.rpm)*RELOJ.N;
  if(!PART.pts) preparaParticulas();
  PART.cfg='';
  ZON.R=null;
  pintaBarra(true);
}
function colocaInstrumentos(mq){
  const {G,d}=mq, B=G.B;
  // manómetro sobre el lado de escape, con su capilar hasta la culata
  const k=0.34*B/0.20;
  MAN.g.scale.setScalar(k); MAN.g.position.set(d.Hw+0.62*B,G.yHd+1.18*B,0.30*B);
  const a=new THREE.Vector3(d.Hw-0.02*B,G.yHd+0.72*B,-0.10*B), b=new THREE.Vector3(d.Hw+0.62*B,G.yHd+1.18*B-0.34*k,0.30*B);
  const m=new THREE.Vector3(d.Hw+0.40*B,G.yHd+0.72*B,0.15*B);
  capilar.geometry.dispose();
  capilar.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,m,b]),24,0.012*B,8,false);
  // sensor de detonación atornillado al flanco de admisión del bloque
  const zK=d.ncil>1?-1.5*d.pitch:-0.45*d.pitch;
  KNK.scale.setScalar(0.12*B); KNK.rotation.set(0,0,Math.PI/2);
  KNK.position.set(-d.xD,d.aire?d.yLb+0.06*B:d.yJb+0.30*(G.yBd-d.yJb),zK);
  // el cuadro de pilotos, de pie a la izquierda del motor
  CUADRO.position.set(X0+K3*(-d.Hw-1.75*B)-0.55,1.02,Z0-0.15);
}

// ---- 9.4 · EL CURSOR DEL PIZARRÓN ----
/* El pizarrón se pinta una vez por calibración; lo que se mueve con θ son dos
   marcas pegadas a su cara —un punto en p–V y otro en x_b–θ con su línea—,
   colocadas con los MISMOS ejes con que se dibujaron las curvas. Así el punto
   recorre el diagrama sin repintar el lienzo sesenta veces por segundo. */
let PV_EJES=null;
const CURSOR=new THREE.Group(); board.add(CURSOR);
const curMat=new THREE.MeshBasicMaterial({color:AMBAR,toneMapped:false});
const curAro=new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false});
const curPV=new THREE.Group(), curXB=new THREE.Group();
for(const g of [curPV,curXB]){
  g.add(new THREE.Mesh(new THREE.CircleGeometry(0.030,24),curMat));
  const ar=new THREE.Mesh(new THREE.RingGeometry(0.040,0.050,28),curAro); g.add(ar);
  CURSOR.add(g);
}
const curLin=new THREE.Mesh(new THREE.PlaneGeometry(0.006,1),new THREE.MeshBasicMaterial({color:AMBAR,toneMapped:false,transparent:true,opacity:0.7}));
CURSOR.add(curLin);
// las marcas no se tocan: un clic sobre ellas es un clic sobre el pizarrón
CURSOR.traverse(o=>{ if(o.isMesh) o.raycast=()=>{}; });
const pxBoard=(u,v,o)=>o.set((u/BW-0.5)*3.68,1.86+(0.5-v/BH)*2.72,0.061);
function pintaCursor(E){
  const ver=mode==='ciclo'&&PV_EJES;
  CURSOR.visible=!!ver; if(!ver) return;
  const A=PV_EJES.A, B=PV_EJES.B;
  const u=A.X(E.V*1e6), v=A.Y(Math.min(E.p,PV_EJES.yMax*1e5)/1e5);
  pxBoard(u,v,curPV.position);
  curPV.children[0].visible=E.cerrado;              // en el periodo abierto el punto va hueco: estado supuesto
  const enB=E.cerrado;
  curXB.visible=enB; curLin.visible=enB;
  if(enB){
    pxBoard(B.X(E.th),B.Y(clamp(E.xb,0,1.25)),curXB.position);
    const y0=B.Y(0), y1=B.Y(1.25), p=new THREE.Vector3();
    pxBoard(B.X(E.th),(y0+y1)/2,p); curLin.position.copy(p); curLin.position.z=0.059;
    curLin.scale.y=(y0-y1)/BH*2.72;
  }
}
// El lazo de bombeo SUPUESTO para el pizarrón: V y p del periodo abierto.
function lazoAbierto(R,P){
  const pts=[];
  for(let c=TH_EVO;c<=DIST.ivc;c+=2){ const A=estadoAbierto(R,P,c); pts.push([A.V,A.p]); }
  return pts;
}

// ---- 9.5 · LA ESCENA EN CADA CUADRO ----
const _c=new THREE.Color(), _c2=new THREE.Color(), _c3=new THREE.Color();
let rotT=0;
function pinta3D(dt){
  const R=CUR; if(!R||!R.traza||!MQ) return;
  avanzaReloj(dt||0);
  const E=estadoEn(RELOJ.c), mq=MQ, G=mq.Gr, d=mq.d, P=maqAct();
  const th=E.th*DEG;
  // biela-manivela exacta
  mq.cig.rotation.z=-th;
  mq.pis.position.set(0,E.yBul,0);
  mq.bie.position.set(G.a*Math.sin(th),G.a*Math.cos(th),0);
  mq.bie.rotation.z=bielaAng(G,E.th);
  // distribución: alzado de cada válvula y giro de las levas a media vuelta
  for(const it of mq.valv){
    const L=alzado(it.V,E.c).L;
    it.grp.position.set(it.V.cx-it.V.n[0]*L,it.V.cy-it.V.n[1]*L,0);
    it.muelle.ajusta(PROP3D.muelleL*G.B-L);
    it.leva.rotation.z=camRot(E.th);
    it.L=L;
  }
  // el gas
  const yC=E.yCor;
  GAS_U.uCor.value=yC; LLAMA_U.uCor.value=yC; GAS_U.uTh.value=E.c;
  if(E.ardiendo){
    colorT(E.Tu,GAS_U.uCu.value); colorT(E.Tb||E.T,GAS_U.uCb.value);
    GAS_U.uRf.value=E.Rf; GAS_U.uFr.value=1;
  } else {
    colorT(E.T,GAS_U.uCu.value); GAS_U.uRf.value=0; GAS_U.uFr.value=0;
  }
  GAS_U.uAu.value=E.tramo==='cerrado'?0.55:0.42;
  // el frente en 3D
  LLAMA_U.uRf.value=E.Rf; LLAMA_U.uI.value=E.ardiendo?0.55+0.45*(1-E.xb):0;
  colorT(Math.min(3400,(E.Tb||E.T)+400),LLAMA_U.uCol.value);
  llamaMalla.visible=E.ardiendo;
  // autoencendido: foco en el gas del extremo, del lado de escape, y frentes de presión
  if(E.knock){
    const dth=E.th-ZON.thK, s=dth/(6*P.rpm)*ZON.cU*ESC3;      // c_u·Δt, en unidades de escena
    // el foco, en el último gas sin quemar: la esquina del lado de escape, lo más lejos de la bujía
    if(!ZON.kc){ const yk=coronaY(G,ZON.thK), xk=G.R-0.02*G.B, techo=G.yApex-xk*G.tanA;
      ZON.kc=[xk,yk+0.35*Math.max(0.004,techo-yk)]; }
    GAS_U.uK.value.set(ZON.kc[0],ZON.kc[1]); GAS_U.uRk.value=s; GAS_U.uOnda.value=2*G.R;
    GAS_U.uKon.value=1-suave((dth-35)/25);
    colorT(Math.min(3400,(E.Tb||E.T)+250),GAS_U.uCk.value);
    focoK.visible=GAS_U.uKon.value>0.03; focoK.position.set(ZON.kc[0],ZON.kc[1],0.01);
    focoK.scale.setScalar(G.B*0.24*(0.75+0.25*Math.cos(s/(0.5*G.R)*Math.PI*2)));
    focoK.material.opacity=GAS_U.uKon.value;
  } else { GAS_U.uKon.value=0; ZON.kc=null; focoK.visible=false; }
  // la chispa y la luz de la cámara
  const ds=E.th-E.chispa;
  const arco=E.cerrado&&ds>=0&&ds<1.5, brillo=E.cerrado&&ds>=0&&ds<E.dGlow;
  chispa.visible=brillo;
  if(brillo){ const k=arco?1:0.45*(1-ds/E.dGlow); chispa.position.set(0,G.yE,0.004);
    chispa.scale.setScalar(G.B*(arco?0.16:0.08)*(0.6+0.4*k)); chispa.material.opacity=0.35+0.65*k; }
  let luz=0;
  if(brillo) luz+=arco?2.2:0.7*(1-ds/E.dGlow);
  if(E.ardiendo){ const tb=(E.Tb||E.T)/2600; luz+=3.2*Math.min(1,E.yb*3)*tb*tb; }
  if(E.knock) luz+=2.5*GAS_U.uKon.value;
  // detrás del plano de corte, dentro de la cámara: alumbra el techo, la camisa y la
  // corona, no las caras de sección que miran al alumno
  const d0=K3*0.5*G.B; luzCamara.intensity=0.25*luz*d0*d0; luzCamara.visible=luz>0.01;
  luzCamara.position.set(0,(yC+G.yApex)/2,-0.45*G.R);
  if(E.ardiendo) colorT(Math.min(3000,(E.Tb||E.T)),luzCamara.color); else luzCamara.color.set('#bcd4ff');
  // partículas
  pintaParticulas(E);
  // manómetro y sensor de detonación: la presión y la integral EN ESTE INSTANTE
  MAN.piv.rotation.z=Math.PI*0.75-1.5*Math.PI*clamp(E.p/(P.pLim*1.10),0,1);
  const kc=E.I>=1?BAD_HEX:(E.I>=0.5?WARN_HEX:OK_HEX);
  knkLed.material.color.set(kc); knkLed.material.emissive.set(kc);
  knkLed.material.emissiveIntensity=E.I>=1&&E.knock?(0.6+0.8*Math.abs(Math.sin(animT*14))):0.55;
  pilotos.forEach((led,i)=>{
    const ok=R[CRIT[i]];
    led.material.color.set(ok?OK_HEX:BAD_HEX); led.material.emissive.set(ok?OK_HEX:BAD_HEX);
    led.material.emissiveIntensity=ok?0.85:(0.45+0.45*Math.sin(animT*5+i));
  });
  pintaCursor(E);
  rotT+=dt||0;
  if(rotT>=(calAlta()?1/30:1/15)){ rotT=0; pintaRotulos(); pintaBarra(false); }
}

/* Las porciones de carga. Cada porción fresca k entra cuando la fracción
   admitida Q pasa por su turno y sale cuando la fracción expulsada pasa por el
   suyo; las round(f_res·N) últimas no salen nunca: son el residual atrapado. */
function pintaParticulas(E){
  if(!PART.pts) return;
  const Z=zonas(), R=CUR, mq=MQ, G=mq.Gr, d=mq.d, B=G.B, c=E.c;
  const {Nc,Ni,Ne,Ns,h}=PART;
  const pos=PART.geo.attributes.position.array, col=PART.geo.attributes.aCol.array, tam=PART.geo.attributes.aTam.array;
  const nRes=Math.round(clamp(R.fRes,0,0.5)*Nc), Nf=Nc-nRes;
  if(PART.cfg!==mq.mk+'|'+R.r+'|'+R.avance+'|'+R.lam+'|'+Nc){
    PART.cfg=mq.mk+'|'+R.r+'|'+R.avance+'|'+R.lam+'|'+Nc;
    PART.tIn=new Float32Array(Nf); PART.tOut=new Float32Array(Nf);
    for(let k=0;k<Nf;k++){
      const q=(k+0.5)/Nf;
      let ci=DIST.ivo; while(ci<540&&Z.QI[ci+1]<q) ci++;
      const a=Z.QI[ci], b=Z.QI[Math.min(720,ci+1)]; PART.tIn[k]=ci+(b>a?(q-a)/(b-a):0);
      let co=TH_EVO; const qe=q*Z.qeFin; while(co<DIST.evc&&Z.QE[co+1]<qe) co++;
      const e0=Z.QE[co], e1=Z.QE[Math.min(720,co+1)]; PART.tOut[k]=co+(e1>e0?(qe-e0)/(e1-e0):0);
    }
    // recorridos: del plenum a la garganta de admisión y de la garganta de escape al colector
    const VA=G.VA, VE=G.VE, xA=-d.Hw, xE=d.Hw;
    const dentroA=VA.conducto.filter(p=>p[0]>xA), dentroE=VE.conducto.filter(p=>p[0]<xE);
    PART.rutaA=polilinea(mq.rutaAdm.slice().reverse().concat(dentroA.slice().reverse()));
    PART.rutaE=polilinea(dentroE.concat(mq.rutaEsc));
    for(let i=0;i<PART.n;i++) tam[i]=i<Nc?0.026*B:(i<Nc+Ni?0.024*B:(i<Nc+Ni+Ne?0.030*B:0.012*B));
    PART.geo.attributes.aTam.needsUpdate=true;
  }
  const VA=G.VA, VE=G.VE, LA=alzado(VA,c).L, LE=alzado(VE,c).L;
  const gargA=[VA.cx-VA.n[0]*(LA*0.5+0.02*B),VA.cy-VA.n[1]*(LA*0.5+0.02*B)];
  const gargE=[VE.cx-VE.n[0]*(LE*0.5+0.02*B),VE.cy-VE.n[1]*(LE*0.5+0.02*B)];
  const yC=E.yCor, techo=x=>G.yApex-Math.abs(x)*G.tanA;
  const mezcla=_c.set('#bfe6ff'), Tq=E.ardiendo?(E.Tb||E.T):E.T;
  const ardido=colorT(Tq,_c2);
  const set=(i,x,y,z,r,g2,b2,a)=>{ pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z; col[i*4]=r; col[i*4+1]=g2; col[i*4+2]=b2; col[i*4+3]=a; };
  // 1) porciones dentro del cilindro
  for(let k=0;k<Nc;k++){
    const h1=h[k*4], h2=h[k*4+1], h3=h[k*4+2];
    const fresca=k<Nf;
    let dentro=true, x, y, z;
    const xs=(2*h1-1)*G.R*0.90;
    const top=techo(xs), yy=yC+(top-yC)*(0.06+0.86*h2);
    x=xs+0.025*B*Math.sin(c*DEG*2+h3*6.28); y=yy; z=-(0.04+0.80*h3)*Math.sqrt(Math.max(0,G.R*G.R-xs*xs))*0.9;
    if(fresca){
      const ti=PART.tIn[k], to=PART.tOut[k];
      dentro=c>=ti||c<to;
      if(dentro&&c>=ti&&c<ti+30){ const u=suave((c-ti)/30); x=gargA[0]+(x-gargA[0])*u; y=gargA[1]+(y-gargA[1])*u; z*=u; }
      const t0=Math.max(TH_EVO,to-28);
      if(dentro&&c<to&&c>=t0){ const u=suave((c-t0)/(to-t0)); x=x+(gargE[0]-x)*u; y=y+(gargE[1]-y)*u; z*=1-u; }
    }
    if(!dentro){ col[k*4+3]=0; continue; }
    // color: mezcla fresca, quemada si la alcanzó el frente, gas quemado después
    const dE=Math.hypot(x,y-G.yE,z);
    let quemada=!fresca||(E.cerrado?(E.xb>=0.9995||(E.ardiendo&&dE<=E.Rf)):(c<=DIST.ivo&&c>=TH_EVO));
    if(fresca&&!E.cerrado&&c>DIST.ivo) quemada=false;
    if(!quemada) set(k,x,y,z,mezcla.r,mezcla.g,mezcla.b,0.55);
    else if(!fresca){ colorT(E.cerrado?E.T:R.Texh,_c3); set(k,x,y,z,_c3.r*0.75,_c3.g*0.75,_c3.b*0.75,0.40); }
    else { const kk=E.ardiendo&&dE>E.Rf*0.85?1.15:0.85; set(k,x,y,z,ardido.r*kk,ardido.g*kk,ardido.b*kk,0.6); }
  }
  // 2) la corriente de admisión: avanza sólo cuando entra carga (Q)
  const Qa=tablaQ(Z.QI,c), LA_=PART.rutaA.L;
  for(let j=0;j<Ni;j++){
    const i=Nc+j, h1=h[i*4], h2=h[i*4+1], h3=h[i*4+2];
    const s=((j+0.5)/Ni+Qa)%1, p=enPolilinea(PART.rutaA,s*LA_);
    const rr=G.VA.rp*0.72*Math.sqrt(h1), an=Math.PI*(1+h2);
    const a=0.55*suave(s/0.08)*suave((1-s)/0.04);
    set(i,p[0]+p[2]*rr*Math.cos(an),p[1]+p[3]*rr*Math.cos(an),rr*Math.sin(an)-0.002,mezcla.r,mezcla.g,mezcla.b,a);
  }
  // 3) la corriente de escape, que se enfría por el conducto hasta la brida
  const Qe=tablaQ(Z.QE,c)/Z.qeFin, LE_=PART.rutaE.L;
  for(let j=0;j<Ne;j++){
    const i=Nc+Ni+j, h1=h[i*4], h2=h[i*4+1];
    const s=((j+0.5)/Ne+Qe)%1, p=enPolilinea(PART.rutaE,s*LE_);
    const rr=G.VE.rp*0.72*Math.sqrt(h1), an=Math.PI*(1+h2);
    const T=R.Texh-(R.Texh-R.Tbrida)*clamp(s/0.35,0,1)-(s>0.35?(s-0.35)*400:0);
    colorT(T,_c3);
    const a=0.6*suave(s/0.05)*suave((1-s)/0.15);
    set(i,p[0]+p[2]*rr*Math.cos(an),p[1]+p[3]*rr*Math.cos(an),rr*Math.sin(an)-0.002,_c3.r,_c3.g,_c3.b,a);
  }
  // 4) el chorro del inyector: en el conducto con la válvula cerrada (PFI, de 200° a 300° de ciclo)
  //    o directo en la cámara durante la admisión (GDI, de 410° a 470°). Ventanas típicas, declaradas.
  const iny=mq.inyector, gdi=maqAct().iny==='GDI';
  for(let j=0;j<Ns;j++){
    const i=Nc+Ni+Ne+j;
    if(!iny){ col[i*4+3]=0; continue; }
    const c0=gdi?410:200, c1=gdi?470:300, vida=gdi?32:45, cj=c0+(c1-c0)*j/Ns;
    const u=(cicloDe(c-cj))/vida;
    if(u<0||u>1){ col[i*4+3]=0; continue; }
    const h1=h[i*4]*2-1, h2=h[i*4+1], dx=iny.dir[0], dy=iny.dir[1], L=(gdi?0.55:0.9)*Math.hypot(VA.cx-iny.punta[0],VA.cy-iny.punta[1]);
    const ab=Math.tan((gdi?14:9)*DEG)*u*L;
    set(i,iny.punta[0]+dx*u*L-dy*ab*h1,iny.punta[1]+dy*u*L+dx*ab*h1,-ab*h2-0.002,1.0,0.80,0.40,0.85*(1-u*u));
  }
  PART.geo.attributes.position.needsUpdate=true; PART.geo.attributes.aCol.needsUpdate=true;
  partMat.uniforms.uTam.value=K3*S.renderer.domElement.height/(2*Math.tan(S.camera.fov*DEG/2));
}
function polilinea(pts){
  const s=[0]; for(let i=1;i<pts.length;i++) s.push(s[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
  return {pts,s,L:s[s.length-1]};
}
function enPolilinea(pl,x){
  const {pts,s}=pl; let i=1; while(i<s.length-1&&s[i]<x) i++;
  const f=(x-s[i-1])/((s[i]-s[i-1])||1), a=pts[i-1], b=pts[i];
  const tx=b[0]-a[0], ty=b[1]-a[1], l=Math.hypot(tx,ty)||1;
  return [a[0]+tx*f,a[1]+ty*f,-ty/l,tx/l];
}

// ---- 9.6 · VISTAS, BARRA DE REPRODUCCIÓN, RÓTULOS Y CALIDAD ----
const VISTA={actual:'corte'};
const NOM_VISTA={'34':'3/4 con pizarrón',corte:'Corte',camara:'Cámara'};
// Cámaras calculadas con las cotas de la máquina y ENCAJADAS en el hueco libre de
// la pantalla —entre los dos paneles, bajo la cabecera y sobre la barra—, dejando
// sitio a las columnas de rótulos: la moto, la planta y una pantalla de 1366 caben igual.
function huecoLibre(conRotulos){
  const W=innerWidth, H=innerHeight, r=(id)=>{ const e=el(id); return e?e.getBoundingClientRect():null; };
  const hud=r('hud'), pan=r('panel'), bar=r('tbar');
  let x0=8, x1=W-8, y0=58, y1=H-70;
  if(W>820){ if(hud&&hud.width) x0=hud.right+10; if(pan&&pan.width) x1=pan.left-10;
    if(bar&&bar.height) y1=Math.min(y1,bar.top-8); }
  else if(bar&&bar.height) y0=Math.max(y0,bar.bottom+6);
  const lab=conRotulos&&W>820?Math.min(175,(x1-x0)*0.2):0;
  return {x0:x0+lab, x1:x1-lab, y0, y1};
}
function encaja(t, dir, pts, caja){
  const cam=S.camera.clone(), W=innerWidth, H=innerHeight, tan=Math.tan(cam.fov*DEG/2);
  cam.aspect=W/H; cam.updateProjectionMatrix();
  const cw=caja.x1-caja.x0, ch=caja.y1-caja.y0, cx=(caja.x0+caja.x1)/2, cy=(caja.y0+caja.y1)/2;
  let dist=4; const q=new THREE.Vector3(), der=new THREE.Vector3(), arr=new THREE.Vector3();
  for(let it=0;it<6;it++){
    cam.position.copy(t).addScaledVector(dir,dist); cam.lookAt(t); cam.updateMatrixWorld();
    let a0=1e9,a1=-1e9,b0=1e9,b1=-1e9;
    for(const p of pts){ q.copy(p).project(cam); const sx=(q.x+1)/2*W, sy=(1-q.y)/2*H;
      a0=Math.min(a0,sx); a1=Math.max(a1,sx); b0=Math.min(b0,sy); b1=Math.max(b1,sy); }
    const k=Math.max((a1-a0)/cw,(b1-b0)/ch), wpp=2*tan*dist/H;
    der.setFromMatrixColumn(cam.matrixWorld,0); arr.setFromMatrixColumn(cam.matrixWorld,1);
    t.addScaledVector(der,((a0+a1)/2-cx)*wpp).addScaledVector(arr,-((b0+b1)/2-cy)*wpp);
    dist*=k;
  }
  const p=t.clone().addScaledVector(dir,dist);
  return [[p.x,p.y,p.z],[t.x,t.y,t.z]];
}
function vistaCam(v){
  const mk=cfgDe(mode).mk;
  if(!MAQUETAS[mk]) MAQUETAS[mk]=construyeMaqueta(mk);
  const mq=MAQUETAS[mk], {G,d}=mq, B=G.B, Y0=0.36-K3*d.yPan;
  const w=(x,y,z)=>new THREE.Vector3(X0+K3*x,Y0+K3*y,Z0+K3*z);
  const esquinas=(a,b)=>{ const r=[]; for(const x of [a[0],b[0]]) for(const y of [a[1],b[1]]) for(const z of [a[2],b[2]]) r.push(w(x,y,z)); return r; };
  const cj=mq.caja, motor=esquinas(cj.min.toArray(),cj.max.toArray());
  if(v==='34'){
    // el motor y el pizarrón entero, con su marco
    board.updateMatrixWorld();
    const tab=[]; for(const x of [-1.95,1.95]) for(const y of [0.0,3.33]) tab.push(new THREE.Vector3(x,y,0.06).applyMatrix4(board.matrixWorld));
    const t=w(-d.Hw-2.6*B,(d.yPan+d.yCov)/2,-0.4*B);
    return encaja(t,new THREE.Vector3(0.42,0.30,1).normalize(),motor.concat(tab),huecoLibre(false));
  }
  if(v==='camara'){
    // la cámara de combustión con las válvulas, la bujía y la corona en el PMI de admisión
    const yBaja=coronaY(G,0)-0.30*B, yAlta=G.yApex+0.62*B;
    const pts=esquinas([-G.R-0.22*B,yBaja,0],[G.R+0.22*B,yAlta,0]);
    return encaja(w(0,(yBaja+yAlta)/2,0),new THREE.Vector3(0.16,0.07,1).normalize(),pts,huecoLibre(ROT3.on));
  }
  return encaja(w(0,(cj.min.y+cj.max.y)/2,-0.2*B),new THREE.Vector3(0.30,0.16,1).normalize(),motor,huecoLibre(ROT3.on));
}
function camModo(k){ return (k==='ciclo'||k==='reto')?vistaCam(VISTA.actual):MODE_META[k].cam; }

// --- la barra ---
(function(){
  const css=document.createElement('style');
  css.textContent=
  '.tbar{position:fixed;left:50%;transform:translateX(-50%);bottom:66px;z-index:16;display:flex;flex-direction:column;gap:5px;'+
  'background:var(--panel);backdrop-filter:blur(14px);border:1px solid var(--line);border-radius:14px;padding:7px 12px 6px;'+
  'width:max-content;max-width:min(780px,calc(100vw - 700px));font-family:var(--mono);font-size:11px;color:var(--dim)}'+
  '.tbar .fila{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center}'+
  '.tbar .b.sm{padding:4px 8px;font-size:11px;border-radius:7px;line-height:1.2}'+
  '.tbar .th{min-width:178px;color:var(--ink);font-variant-numeric:tabular-nums;text-align:center;font-size:12px}'+
  '.tbar select{background:#1b242f;color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:3px 5px;font-size:11px;font-family:inherit}'+
  '.tbar label{display:flex;align-items:center;gap:4px;cursor:pointer}'+
  '.tbar .vel{color:var(--accent2)} .tbar .sup{color:var(--hv)}'+
  '.tbar .esc{display:flex;align-items:center;gap:7px}'+
  '.tbar .grad{position:relative;width:210px;height:9px;border-radius:5px;margin:0 2px 11px}'+
  '.tbar .tk{position:absolute;top:11px;font-size:9px;transform:translateX(-50%);color:var(--dim);white-space:nowrap}'+
  '.tbar .mk{position:absolute;top:-7px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;transform:translateX(-50%);display:none}'+
  '.rot3{position:fixed;z-index:13;pointer-events:none;font-family:var(--mono);font-size:10.5px;color:#dfe9ef;'+
  'background:rgba(9,22,24,.78);border:1px solid rgba(79,209,197,.25);padding:2px 7px;border-radius:6px;white-space:nowrap}'+
  '.rot3svg{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:12;pointer-events:none;overflow:visible}'+
  '@media(max-width:820px){.tbar{top:58px;bottom:auto;max-width:calc(100vw - 16px)}.rot3,.rot3svg{display:none}}';
  document.head.appendChild(css);
  const lo=250, hi=3500, pc=t=>((t-lo)/(hi-lo)*100).toFixed(1)+'%';
  const grad='linear-gradient(90deg,'+ESCALA_T.map(([t,h])=>h+' '+pc(t)).join(',')+')';
  const b=document.createElement('div'); b.className='tbar'; b.id='tbar';
  b.innerHTML=
    '<div class="fila">'+
      '<button class="b sm" id="tb_m10" title="10° de cigüeñal atrás">−10°</button>'+
      '<button class="b sm" id="tb_m1" title="1° atrás">−1°</button>'+
      '<button class="b sm" id="tb_play" title="Reproducir o pausar">⏸</button>'+
      '<button class="b sm" id="tb_p1" title="1° adelante">+1°</button>'+
      '<button class="b sm" id="tb_p10" title="10° adelante">+10°</button>'+
      '<span class="th" id="tb_th">—</span>'+
      '<select id="tb_vel" title="Cámara lenta respecto de las rpm reales">'+
        VEL_N.map(n=>'<option value="'+n+'">×1/'+sepMil(String(n))+'</option>').join('')+'</select>'+
      '<label title="Frena seis veces más alrededor de la chispa y de la combustión"><input type="checkbox" id="tb_lento" checked>lento en la combustión</label>'+
    '</div>'+
    '<div class="fila">'+
      '<span class="vel" id="tb_vtxt">—</span>'+
      '<span class="esc">T del gas <span class="grad" id="tb_grad" style="background:'+grad+'">'+
        [300,1000,2000,3000].map(t=>'<span class="tk" style="left:'+pc(t)+'">'+sepMil(String(t))+' K</span>').join('')+
        '<span class="mk" id="tb_mu" style="border-top:7px solid #9fd2ff" title="gas sin quemar"></span>'+
        '<span class="mk" id="tb_mb" style="border-top:7px solid #ffb35a" title="gas quemado"></span>'+
      '</span></span>'+
    '</div>'+
    '<div class="fila">'+
      ['corte','camara','34'].map(v=>'<button class="b sm" data-vista="'+v+'">'+NOM_VISTA[v]+'</button>').join('')+
      '<button class="b sm" id="tb_rot">Rótulos</button>'+
      '<button class="b sm" id="tb_cal">Calidad</button>'+
    '</div>';
  document.body.appendChild(b);
  const paso=k=>{ RELOJ.pausa=true; RELOJ.c=cicloDe(Math.round(RELOJ.c)+k); pintaBarra(true); };
  el('tb_m10').onclick=()=>paso(-10); el('tb_m1').onclick=()=>paso(-1);
  el('tb_p1').onclick=()=>paso(1); el('tb_p10').onclick=()=>paso(10);
  el('tb_play').onclick=()=>{ RELOJ.pausa=!RELOJ.pausa; pintaBarra(true); };
  el('tb_vel').onchange=e=>{ RELOJ.N=Number(e.target.value); RELOJ.auto=false; PER3D=720/(6*maqAct().rpm)*RELOJ.N; pintaBarra(true); };
  el('tb_lento').onchange=e=>{ RELOJ.lento=e.target.checked; pintaBarra(true); };
  b.querySelectorAll('[data-vista]').forEach(x=>{ x.onclick=()=>{ VISTA.actual=x.getAttribute('data-vista');
    const v=vistaCam(VISTA.actual); S.moveTo(v[0],v[1]); pintaBarra(true); }; });
  el('tb_rot').onclick=()=>{ ROT3.on=!ROT3.on; pintaRotulos(); pintaBarra(true); };
  el('tb_cal').onclick=()=>{ CAL3.nivel=calAlta()?'media':'alta'; aplicaCalidad(true); pintaBarra(true); };
  // teclado: espacio pausa, flechas paso a paso (con Mayúsculas, de 10 en 10)
  document.addEventListener('keydown',e=>{
    if(/INPUT|SELECT|TEXTAREA/.test((e.target&&e.target.tagName)||'')) return;
    if(e.code==='Space'){ e.preventDefault(); RELOJ.pausa=!RELOJ.pausa; pintaBarra(true); }
    else if(e.code==='ArrowRight'){ paso(e.shiftKey?10:1); }
    else if(e.code==='ArrowLeft'){ paso(e.shiftKey?-10:-1); }
  });
})();
const TRAMO_ROT={cerrado:'',soplado:'soplado de escape',escape:'carrera de escape',cruce:'cruce de válvulas',admision:'admisión'};
function pintaBarra(){
  if(!CUR||!MQ) return;
  const E=ESTADO, P=maqAct(); if(E.c===undefined) return;
  const rel=E.th===0?'en el PMS':(f0(Math.abs(E.th))+'° '+(E.th<0?'antes':'después')+' del PMS'+(Math.abs(E.th)>180?'':''));
  el('tb_th').innerHTML='θ '+f0(E.c)+'° · <b>'+E.fase+'</b> · '+rel;
  const Nef=RELOJ.N*RELOJ.k, tc=720/(6*P.rpm);
  el('tb_vtxt').innerHTML=(RELOJ.pausa?'⏸ en pausa · ':'')+'×1/'+sepMil(String(Math.round(Nef/10)*10))+
    ' respecto a las '+sepMil(String(P.rpm))+' rpm reales'+(RELOJ.k>1.05?' (lento en la combustión)':'')+
    ' · un ciclo real dura '+f1(tc*1000)+' ms'+
    (E.cerrado?'':' · <span class="sup">periodo abierto: estado supuesto</span>');
  el('tb_play').textContent=RELOJ.pausa?'▶':'⏸';
  el('tb_vel').value=String(RELOJ.N);
  el('tb_lento').checked=RELOJ.lento;
  el('tb_rot').classList.toggle('on',ROT3.on);
  el('tb_cal').textContent='Calidad '+CAL3.nivel;
  document.querySelectorAll('#tbar [data-vista]').forEach(x=>x.classList.toggle('on',x.getAttribute('data-vista')===VISTA.actual));
  const lo=250, hi=3500, pos=t=>clamp((t-lo)/(hi-lo),0,1)*100+'%';
  const mu=el('tb_mu'), mb=el('tb_mb');
  mu.style.display='block'; mu.style.left=pos(E.ardiendo?E.Tu:E.T);
  mu.title=(E.ardiendo?'gas sin quemar ':'gas ')+f0(E.ardiendo?E.Tu:E.T)+' K';
  mb.style.display=E.ardiendo&&E.Tb?'block':'none'; if(E.Tb) { mb.style.left=pos(E.Tb); mb.title='gas quemado '+f0(E.Tb)+' K'; }
}

// --- rótulos con líneas guía, en dos columnas que no se pisan ---
const ROT3={on:true, items:[], capa:null, svg:null, divs:[]};
(function(){
  ROT3.svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); ROT3.svg.setAttribute('class','rot3svg');
  document.body.appendChild(ROT3.svg);
})();
function construyeRotulos(mq){
  const {G,d}=mq, B=G.B, VA=G.VA, VE=G.VE, P=MAQ[mq.mk], it=[];
  const vv=i=>mq.valv[i];
  const add=(txt,lado,fn)=>it.push({txt,lado,fn});
  add('Árbol de levas de admisión',-1,()=>[VA.cam[0]-0.10*B,VA.cam[1]+0.12*B,0]);
  add('Muelle y taqué de vaso',-1,()=>{ const p=ejeV(VA,d.sMue+0.20*B-(vv(0).L||0)); return [p[0]-0.10*B,p[1],0]; });
  add('Válvula de admisión',-1,()=>{ const L=vv(0).L||0; return [VA.cx-VA.n[0]*L-0.30*VA.d,VA.cy-VA.n[1]*L+0.02*B,0]; });
  add(P.iny==='PFI'?'Colector de admisión e inyector':(P.iny==='GDI'?'Colector de admisión':'Colector y mezclador de gas'),-1,
    ()=>{ const p=mq.rutaAdm[Math.floor(mq.rutaAdm.length*0.55)]; return [p[0],p[1],0]; });
  if(P.iny==='GDI') add('Inyector directo',-1,()=>[d.gdi.punta[0]+d.gdi.ax[0]*0.35*B,d.gdi.punta[1]+d.gdi.ax[1]*0.35*B,0]);
  add('Pistón y segmentos',-1,()=>[-G.R*0.72,(ESTADO.yCor||0)-0.06*B,0]);
  add('Biela en doble T',-1,()=>{ const t=(ESTADO.th||0)*DEG, x=G.a*Math.sin(t)*0.55, y=G.a*Math.cos(t)+((ESTADO.yBul||0)-G.a*Math.cos(t))*0.45; return [x,y,0.12*B]; });
  add('Cárter y aceite',-1,()=>[-d.xC*0.55,d.yRail-0.18*B,0]);
  add('Árbol de levas de escape',1,()=>[VE.cam[0]+0.10*B,VE.cam[1]+0.12*B,0]);
  add('Bujía y bobina',1,()=>[0.05*B,d.yAsiento+0.06*B,0]);
  add('Válvula de escape',1,()=>{ const L=vv(1).L||0; return [VE.cx-VE.n[0]*L+0.30*VE.d,VE.cy-VE.n[1]*L+0.02*B,0]; });
  add('Cámara de combustión',1,()=>[G.R*0.55,((ESTADO.yCor||G.yHd)+G.yHd)/2,0]);
  add('Colector de escape y termopar',1,()=>{ const p=mq.termopar; return [p[0],p[1],0]; });
  add('Junta de culata',1,()=>[d.xD*0.92,G.yBd,0]);
  add(d.aire?'Aletas de refrigeración':'Camisa de agua',1,()=>d.aire?[d.xD+0.15*B,(d.yLb+G.yBd)/2,0]:[(d.rCil+d.rAgua)/2,(d.yJb+G.yBd)/2,0]);
  add('Cigüeñal y contrapeso',1,()=>{ const t=(ESTADO.th||0)*DEG; return [-d.rCw*0.7*Math.sin(t),-d.rCw*0.7*Math.cos(t),-0.2*B]; });
  // los que sólo existen un instante: el frente mientras arde y el foco si hay detonación
  add('Frente de llama',-1,()=>{ const E=ESTADO, Gr=mq.Gr; if(!E.ardiendo||!(E.Rf>0)) return null;
    const x=-Math.min(E.Rf*0.6,Gr.R*0.85), y=Math.max(Gr.yE-Math.sqrt(Math.max(0,E.Rf*E.Rf-x*x)),(E.yCor||0)+0.004);
    return [x,y,0]; });
  add('Foco de autoencendido',1,()=>focoK.visible?[focoK.position.x,focoK.position.y,0]:null);
  ROT3.items=it;
  for(const x of ROT3.divs) x.remove();
  ROT3.divs=it.map(r=>{ const e=document.createElement('div'); e.className='rot3'; e.textContent=r.txt; document.body.appendChild(e); return e; });
}
const _p=new THREE.Vector3();
function pintaRotulos(){
  const ver=ROT3.on&&MQ&&(mode==='ciclo'||mode==='reto')&&VISTA.actual!=='34';
  ROT3.svg.style.display=ver?'':'none';
  if(!ver){ for(const e of ROT3.divs) e.style.display='none'; return; }
  const W=innerWidth, H=innerHeight, cam=S.camera;
  const scr=(x,y,z)=>{ _p.set(x,y,z); MOTOR.localToWorld(_p); _p.project(cam);
    return [(_p.x+1)/2*W,(1-_p.y)/2*H,_p.z<1]; };
  // la caja del motor en pantalla
  const b=MQ.caja; let x0=1e9, x1=-1e9;
  for(const X of [b.min.x,b.max.x]) for(const Y of [b.min.y,b.max.y]) for(const Zz of [b.min.z,0]){
    const s=scr(X,Y,Zz); x0=Math.min(x0,s[0]); x1=Math.max(x1,s[0]); }
  const hud=el('hud').getBoundingClientRect(), pan=el('panel').getBoundingClientRect();
  const minX=(W>820?hud.right:0)+8, maxX=(W>820?pan.left:W)-8;
  const lados={'-1':[],'1':[]};
  ROT3.items.forEach((r,i)=>{ const a=r.fn(); if(!a){ ROT3.divs[i].style.display='none'; return; } const s=scr(a[0],a[1],a[2]);
    const dentro=s[2]&&s[0]>minX&&s[0]<maxX&&s[1]>60&&s[1]<H-120;
    if(dentro) lados[r.lado].push({i,ax:s[0],ay:s[1]}); else ROT3.divs[i].style.display='none'; });
  let svg='';
  for(const lado of [-1,1]){
    const L=lados[lado].sort((p,q)=>p.ay-q.ay);
    let y=70; for(const q of L){ q.y=Math.max(q.ay,y); y=q.y+21; }
    const tope=H-130; let exceso=L.length?L[L.length-1].y-tope:0;
    if(exceso>0) for(let k=L.length-1;k>=0;k--){ const lim=k<L.length-1?L[k+1].y-21:tope; L[k].y=Math.min(L[k].y,lim); }
    for(const q of L){
      const e=ROT3.divs[q.i]; e.style.display='block';
      const w=e.offsetWidth||140;
      let x=lado<0?Math.max(minX,x0-24-w):Math.min(maxX-w,x1+24);
      e.style.left=x+'px'; e.style.top=(q.y-9)+'px';
      const xl=lado<0?x+w:x;
      svg+='<polyline points="'+xl+','+q.y+' '+(xl+lado*10)+','+q.y+' '+q.ax+','+q.ay+'" fill="none" stroke="rgba(160,220,214,.55)" stroke-width="1"/>'+
        '<circle cx="'+q.ax+'" cy="'+q.ay+'" r="2.4" fill="#bfeee8"/>';
    }
  }
  ROT3.svg.innerHTML=svg;
}

// --- calidad ---
function aplicaCalidad(rehacer){
  const alta=calAlta(), pr=alta?Math.min(devicePixelRatio,2):1;
  S.renderer.setPixelRatio(pr); if(S.composer.setPixelRatio) S.composer.setPixelRatio(pr); S.resize();
  S.composer.passes.forEach(p=>{ if(p instanceof BokehPass) p.enabled=alta; });
  const sol=scene.children.find(o=>o.isDirectionalLight&&o.castShadow);
  if(sol){ const n=alta?2048:1024; if(sol.shadow.mapSize.x!==n){ sol.shadow.mapSize.set(n,n);
    if(sol.shadow.map){ sol.shadow.map.dispose(); sol.shadow.map=null; } } }
  if(!rehacer) return;
  for(const k in MAQUETAS){ const m=MAQUETAS[k];
    if(m===MQ) MOTOR.remove(m.g);
    const tira=o=>o.traverse(n=>{ if(n.isMesh||n.isPoints) n.geometry.dispose(); });
    tira(m.g); for(const r in m.pistones) tira(m.pistones[r]);
    delete MAQUETAS[k]; }
  MQ=null; mkVisto=null; preparaParticulas(); aplicaGeom();
}
aplicaCalidad(false);

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
    '<div class="li"><span class="dot" style="background:'+AZUL+'"></span><span>el ciclo real y todo lo <b>indicado</b>: lo que el gas hace sobre el pistón</span></div>'+
    '<div class="li"><span class="dot" style="background:'+OK_HEX+'"></span><span>lo que queda <b>al freno</b> tras restar bombeo y fricción</span></div>'+
    '<div class="li"><span class="dot" style="background:'+GRIS+'"></span><span>techo ideal de aire frío con la r <b>geométrica</b></span></div>'+
    '<div class="li"><span class="dot" style="background:'+VIO+'"></span><span>el mismo techo con la r <b>efectiva</b>, la que ve el motor tras el cierre de admisión</span></div>'+
    '<div class="li"><span class="dot" style="background:'+NARANJA+'"></span><span>el reloj de la combustión: x<sub>b</sub>, y en los barridos la temperatura de escape</span></div>'+
    '<div class="li"><span class="dot" style="background:'+BAD_HEX+'"></span><span>la cuenta del autoencendido: I de Livengood–Wu</span></div>'+
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
    'PMEP = p<sub>esc</sub> − p<sub>adm</sub>, y en el diagrama p–V ese lazo va a trazos porque es supuesto. '+
    'En el 3D, el periodo abierto (soplado, escape, cruce y admisión) se dibuja con un estado <b>supuesto</b> que '+
    'empalma con la traza; la ley de leva y los ángulos IVO y EVC son típicos; el frente de llama es una esfera cuyo '+
    'volumen recortado es y<sub>b</sub> = x<sub>b</sub>·T<sub>b</sub>/T; el foco de autoencendido y sus frentes de presión son '+
    'ilustrativos. Un cilindro representa a los demás. No hay EGR externo, ni '+
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
// Dos pistas como máximo, y ninguna da un valor de la terna: orientan hacia DÓNDE
// mirar. La primera dice cuál es el muro de esta máquina (el criterio que más
// veces tumba EN SOLITARIO, que es el dato del censo); la segunda, en qué eje se
// decide el gasto de combustible entre las calibraciones válidas.
function ejeDecisivo(mk){
  const v=valM(mk); let mejor=null, sp=-1;
  for(const e of PIS_EJE){
    const porVal={};
    v.forEach(x=>{ const k=x[e]; if(porVal[k]===undefined||x.coste5<porVal[k]) porVal[k]=x.coste5; });
    const cs=Object.keys(porVal).map(k=>porVal[k]);
    const spread=cs.length>1?Math.max.apply(null,cs)-Math.min.apply(null,cs):0;
    if(spread>sp){ sp=spread; mejor=e; }
  }
  return mejor;
}
function pista(){
  if(nPistas()>=MAX_PISTAS){ showToast('💡 Ya has usado las '+MAX_PISTAS+' pistas de este caso.'); return; }
  const mk=RETO.cfg.mk, cn=censoM(mk);
  let txt;
  if(!RETO.pistas.p1){
    RETO.pistas.p1=true;
    const dec=CRIT.slice().sort((a,b)=>cn.solo[b]-cn.solo[a])[0];
    txt=cn.solo[dec]>0
      ? 'De las '+f0(cn.n)+' calibraciones que caben en este bloque pasan '+f0(cn.validas)+
        '. El muro de esta máquina es «'+CRIT_ROT[dec]+'»: es el criterio que más veces tumba una calibración él solo.'
      : 'De las '+f0(cn.n)+' calibraciones que caben en este bloque pasan '+f0(cn.validas)+
        '. Aquí ningún criterio tumba nada en solitario: las que se caen se caen por varios a la vez.';
  }else{
    RETO.pistas.p2=true;
    txt='Entre las '+f0(RETO.nval)+' válidas, el eje donde más cambia el gasto de combustible es el de «'+
      EJE_ROT[ejeDecisivo(mk)]+'». Compara el coste de las válidas moviendo ése.';
  }
  RETO.pistaTxt.push(txt);
  beep();
  showToast('💡 <b>Pista '+nPistas()+' de '+MAX_PISTAS+'.</b> '+txt);
  afterEdit();
}
function retoSolveBuild(){
  const mk=RETO.cfg.mk;
  RETO.sol=solM(mk); RETO.nval=valM(mk).length;
  RETO.ejes={r:R_G[0], lam:LAM_G[0], avance:AV_G[0]};
  RETO.pistas={p1:false,p2:false}; RETO.pistaTxt=[];
  RETO.intentos=0; RETO.aviso='';
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
  const cam=camModo(k); S.moveTo(cam[0],cam[1],REDUCIDO?0.01:1.4);
  aplicaMaquina();
  refreshAll();
}
// "Otro caso": en el reto cambia de máquina y rearma la partida; en los modos de
// estudio avanza al siguiente caso que enseña algo distinto del anterior.
function newSignal(){
  const sig=(arr,v)=>arr[(arr.indexOf(v)+1)%arr.length];
  // Un ejemplo VÁLIDO pero no el más barato: llevar los mandos a la solución del
  // reto era regalar la respuesta desde un modo de estudio.
  const alOptimo=()=>{ const v=valM(ST.mk), o=solM(ST.mk);
    const ej=v.filter(x=>x!==o).sort((a,b)=>b.coste5-a.coste5)[0]||o;
    if(ej){ ST.r=ej.r; ST.av=ej.avance; ST.lam=ej.lam; }
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
  }
  el('tele').innerHTML=h;
  updateLive();
}
function updateLive(){
  const R=CUR, E=ESTADO; if(!R||!R.traza||E.c===undefined) return;
  const e1=el('tvTh'); if(!e1) return;
  // los mismos formatos cortos de antes: la fila es estrecha; la fase va en la barra
  const sup=E.cerrado?'':' (supuesta)';
  e1.textContent=gra(E.th)+' ('+(E.th<0?'antes':'después')+' del PMS) · '+cm3(E.V)+' cm³';
  el('tvP').textContent=f1(E.p/1e5)+' bar'+sup;
  el('tvT').textContent=E.cerrado?(f0(E.T)+' K  ·  sin quemar '+f0(E.Tu)+' K'):(f0(E.T)+' K'+sup);
  el('tvX').textContent=E.cerrado?(pc1(E.xb)+'  ·  I = '+f3(E.I)+(E.I>=1?'  · AUTOENCENDIDO':''))
                                 :(E.c<=DIST.ivo?'escape (supuesto)':'admisión (supuesta)');
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
      ? '> Cuál de las '+f0(cn.validas)+' que pasan es la más barata de alimentar a '+f0(ANIOS)+
        ' años no se dice aquí: es lo que pide el reto.'
      : '> Ninguna configuración pasa el pliego entero en esta máquina.';
  }else{
    t='> Reto sobre '+P.nom+'. Rejilla construible: '+f0(censoM(c.mk).n)+' calibraciones, de las '+
      'que '+f0(RETO.nval)+' pasan el pliego entero.\n';
    t+='> Se paga el combustible de '+f0(P.wAnio)+' kWh/año al freno durante '+f0(ANIOS)+
      ' años, a '+f2(F.precio)+' €/L de '+F.nom+' ('+f3(F.rho)+' kg/L).\n';
    t+='> Intentos: '+f0(RETO.intentos)+' de '+MAX_INTENTOS+' · pistas: '+f0(nPistas())+' de '+MAX_PISTAS+
      '. Ninguna pista da un valor de la terna.\n';
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
  // Lo que la simulación dice de TU calibración (válida o no, y cuánto gasta). Si es
  // la más barata o no lo dice sólo «Entregar»: antes de entregar no hay veredicto.
  h+='Ahora mismo: <b>'+(R.valida?'válida':'no válida')+'</b>, '+fin(R.coste5,0)+' €.<br>';
  h+='Intentos: '+f0(RETO.intentos)+' de '+MAX_INTENTOS+' · pistas: '+f0(nPistas())+' de '+MAX_PISTAS+'.';
  if(RETO.aviso) h+='<br><span style="color:'+WARN_HEX+'">'+RETO.aviso+'</span>';
  if(RETO.msg) h+='<br><span style="color:'+(RETO.resuelto?OK_HEX:WARN_HEX)+'">'+RETO.msg+'</span>';
  el('retoSpec').innerHTML=h;
}
// El juicio puro: no toca ni `solved` ni los intentos. Lo usa Entregar y también
// el recorrido guiado, que sólo DEMUESTRA y jamás firma el reto del alumno.
function juzgaReto(){
  const R=CUR, s=RETO.sol, P=MAQ[RETO.cfg.mk];
  if(!s) return {ok:false, msg:'Esta máquina no tiene ninguna calibración válida en la rejilla.'};
  if(!R.valida){
    const f=fallosDe(R);
    return {ok:false, msg:'Todavía no: falla '+f.map(k=>CRIT_ROT[k]).join(', ')+
      (R.rMecOk?'':' (y además r supera el límite mecánico del bloque)')+
      '. Una calibración barata que no pasa el pliego no es barata: es un motor roto.'};
  }
  if(R.coste5>s.coste5+1e-9)
    return {ok:false, msg:'Es válida, pero no es la que menos combustible gasta en '+f0(ANIOS)+
      ' años: hay otra válida más barata. Con '+f0(P.wAnio)+' kWh/año al freno, cada punto de '+
      'eficiencia que dejas sobre la mesa se paga '+f0(ANIOS)+' veces. Compara el coste de las '+
      'válidas de esta máquina.'};
  return {ok:true, msg:'✅ Calibración firmada: r '+f0(R.r)+' · avance '+f0(R.avance)+'° · λ '+f2(R.lam)+
    ' → '+pc1(R.etaB)+' al freno y '+f0(R.coste5)+' € a '+f0(ANIOS)+' años.'};
}
// Al fallar NO se dice cuánto falta ni cuál era: se dice qué no cuadra. A los tres
// fallos el caso se cambia por otro (otra máquina), para que nadie apruebe
// recorriendo las pocas válidas hasta que una acierte.
function checkReto(){
  if(RETO.resuelto) return;
  const j=juzgaReto();
  RETO.aviso='';
  if(j.ok){
    RETO.resuelto=true; solved=true; RETO.msg=j.msg;
    [523,659,784].forEach((f,i)=>setTimeout(()=>synth.beep(f,0.16,0.05),i*90));
    afterEdit();
    showToast('✅ '+RETO.msg);
    return;
  }
  RETO.resuelto=false; solved=false;
  RETO.intentos++;
  RETO.msg=j.msg+' Intento '+f0(RETO.intentos)+' de '+MAX_INTENTOS+'.';
  synth.beep(220,0.12,0.05);
  if(RETO.intentos>=MAX_INTENTOS){
    const sig=(arr,v)=>arr[(arr.indexOf(v)+1)%arr.length];
    RETO.cfg.mk=sig(MAQ_KEYS,RETO.cfg.mk);
    retoSolveBuild();
    RETO.aviso='Tres entregas sin acertar: este caso se cierra sin revelarlo y llega otra máquina.';
    afterEdit();
    showToast('🔀 <b>Caso nuevo.</b> Tres intentos sin acertar. Otra máquina, otro encargo.');
    return;
  }
  afterEdit();
  showToast('⚠️ '+RETO.msg);
}

// ===================== 15. CUESTIONARIO =====================
// Una pregunta por modo. Todas las cifras salen del motor sellado, no de la
// intuición: están comprobadas contra la simulación de la máquina que se nombra.
let QORD=[], answered=false;
const QUIZ={
  ciclo:{pregunta:'El sedán con una calibración que el pliego acepta tiene un techo ideal de aire frío del 62,99 %, pero entrega el 37,42 % al freno. De esos 25,57 puntos que se pierden por el camino, ¿dónde se va la mayor parte?',
    opciones:[
      {t:'En la combustión real y el calor a las paredes: 19,01 puntos entre el techo con r efectiva y la eficiencia indicada.',ok:true,
       why:'Exacto. Ese tramo se lo comen cuatro cosas a la vez: la combustión dura 41,2° y no es instantánea, el 11,23 % del calor liberado se va a las paredes antes de empujar, el gas caliente tiene un γ mucho menor que el 1,4 del aire frío, y el escape se abre en +130° con presión todavía dentro. La fricción y el bombeo sólo se llevan 5,33 puntos, y el cierre tardío de admisión 1,24.'},
      {t:'En la fricción y el bombeo, que son lo que separa la eficiencia indicada de la eficiencia al freno en cualquier motor.',
       why:'Sólo 5,33 puntos: la imep bruta es 11,728 bar, el bombeo se lleva 0,200 y la fricción 1,262, y queda 10,266 bar al freno. Es un quinto de la brecha, no la mayor parte.'},
      {t:'En el cierre tardío de la válvula de admisión, que baja la relación de compresión efectiva respecto de la geométrica.',
       why:'Ese efecto existe y está medido, pero es pequeño: el techo ideal pasa de 62,99 % con r geométrica a 61,75 % con r efectiva. 1,24 puntos de 25,57.'},
      {t:'En el gas residual del ciclo anterior, que ocupa sitio en el cilindro y no llega a quemar nunca.',
       why:'El residual atrapado es el 2,84 % de la masa. Calienta la carga fresca a 344,5 K y diluye la mezcla, pero no es de lejos la partida grande: está incluido dentro del tramo de la combustión real.'},
    ]},
  compresion:{pregunta:'El motor de competición quema metanol, RON 109, y en TODA la rejilla su integral de detonación no pasa de 0,438: nunca pica. Con avance 10° y λ 1,00 su eficiencia al freno sigue subiendo hasta r = 14 (40,60 %), y sin embargo ese punto no pasa el pliego. ¿Por qué?',
    opciones:[
      {t:'Porque en r = 14 la presión de pico llega a 80,89 bar y el bloque admite 78: el muro deja de ser químico y pasa a ser estructural.',ok:true,
       why:'Eso es. En r = 14 la presión de pico son 80,89 bar contra un límite de 78 y se cae por presión, con I = 0,202. Que el combustible aguante no significa que el motor aguante: subir r sube la presión de pico aunque no haya la menor detonación.'},
      {t:'Porque a partir de cierta relación de compresión la eficiencia al freno empieza a caer y deja de compensar.',
       why:'No cae: sigue subiendo hasta el 40,60 % en r = 14. El pliego no rechaza ese punto por rendir menos, sino por romper el bloque.'},
      {t:'Porque el metanol no admite relaciones de compresión tan altas sin que la mezcla se autoencienda.',
       why:'Al revés: RON 109 y un calor de vaporización de 1 100 kJ/kg que enfría la carga. En esta máquina la detonación no reprueba ni una sola de las 210 configuraciones.'},
      {t:'Porque la temperatura en la brida de escape se dispara al subir r y supera el límite del termopar.',
       why:'Baja, no sube: de 1 227 K en r = 8 a 1 100 K en r = 14, porque el gas se expande más antes de abrir el escape. De hecho las r bajas son las que se caen por temperatura de escape.'},
    ]},
  mezcla:{pregunta:'En la planta de gas LP con r 12 y avance 10°, la eficiencia INDICADA es máxima en λ = 1,10 (41,49 %) pero la eficiencia AL FRENO es máxima en λ = 1,00 (37,71 %). ¿Por qué no caen en el mismo dosado?',
    opciones:[
      {t:'Porque la fricción se resta en presión media, no en tanto por ciento: al empobrecer la imep cae mucho más de lo que cae la fmep.',ok:true,
       why:'Exacto. De λ 1,00 a λ 1,10 la imep bruta baja de 11,690 a 10,701 bar (−8,5 %) mientras la fmep sólo baja de 0,982 a 0,931 bar (−5,2 %). Esa resta casi fija pesa cada vez más sobre una imep menor, y el máximo al freno se corre hacia el lado rico.'},
      {t:'Porque a λ = 1,10 la combustión dura más (55,3° frente a 52,0°) y eso ya está descontado en la eficiencia indicada.',
       why:'La duración sí cambia y sí está dentro de la indicada, pero entonces la indicada tendría que ser peor en λ = 1,10, y es mejor. La duración no explica que los dos máximos se separen.'},
      {t:'Porque a λ = 1,10 entra menos combustible por ciclo y por eso el rendimiento calculado sale más alto.',
       why:'La eficiencia ya está dividida por el combustible que entra: es trabajo por unidad de energía química. Meter menos combustible no sube la eficiencia por sí solo.'},
      {t:'Porque son dos medidas de cosas distintas, una del gas y otra del eje, y no tienen por qué compararse.',
       why:'Se comparan todo el rato, y en el mismo ciclo: la indicada es lo que el gas hace sobre el pistón y la del freno es lo que sale por el cigüeñal. Lo que hay entre las dos son el bombeo y la fricción, que es justo lo que mueve el máximo.'},
    ]},
  censo:{pregunta:'En la moto, «par entregado» reprueba 98 de las 180 configuraciones construibles y «temperatura de escape» reprueba 97: prácticamente empatan. Pero en solitario, el par sólo tumba 3 y el escape tumba 33. Si pudieras relajar UN criterio del pliego, ¿cuál te devolvería más configuraciones?',
    opciones:[
      {t:'La temperatura de escape: 33 configuraciones se caen sólo por él y todo lo demás ya lo cumplen.',ok:true,
       why:'Ésa es la lectura correcta del censo. Relajar el par recuperaría 3 configuraciones, porque las otras 95 que reprueba también fallan otra cosa a la vez y seguirían fuera. Un total alto sólo dice que ese criterio acompaña mucho; el que decide es el que reprueba solo.'},
      {t:'El par entregado, porque es el criterio que más configuraciones reprueba de todos, con 98 bajas.',
       why:'Es la trampa del censo. Reprueba 98 veces, pero 95 de ellas en compañía de otro criterio: si mañana bajaras el par mínimo exigido, esas 95 seguirían suspendiendo por lo otro. Recuperarías 3.'},
      {t:'La presión máxima, que reprueba 72 configuraciones y es la única en tumbar a 18 de ellas.',
       why:'Es el segundo decisor de esta máquina, no el primero: 18 frente a 33. Buena intuición, cifra equivocada.'},
      {t:'Los dos por igual, porque 98 y 97 bajas son prácticamente el mismo número y dan el mismo resultado.',
       why:'Los totales son casi iguales y las consecuencias no: 3 frente a 33, once veces más. Por eso el censo dibuja dos barras y no una.'},
    ]},
  reto:{pregunta:'El turbo GDI rinde 38,52 % al freno con r = 11 y avance 10°, más que cualquier calibración que el pliego acepta. Todos los demás criterios los cumple: 88,51 bar contra un límite de 105, brida a 1 090 K contra 1 165, 17,13 bar de bmep contra 15,2 mínimos, λ = 1,00 dentro de la ventana del catalizador y r = 11 justo en el límite del bloque. ¿Por qué se descarta?',
    opciones:[
      {t:'Porque su integral de detonación vale 1,530: la mezcla sin quemar se autoenciende antes de que le llegue la llama.',ok:true,
       why:'Ése es el único criterio que falla, y basta. La cuenta de Livengood–Wu suma en cada paso el tiempo transcurrido dividido entre el retardo de autoencendido de Douaud–Eyzat; cuando llega a 1, la carga sin quemar se ha encendido sola. Una eficiencia que sólo existe hasta que el motor pica no es una eficiencia: para que el pliego la acepte hay que retrasar la chispa o bajar la compresión hasta dejar I por debajo de 1.'},
      {t:'Porque la presión de pico se pasa del límite que aguanta el bloque y el cilindro acabaría fisurándose.',
       why:'88,51 bar contra un límite de 105: sobra margen. El turbo tiene el bloque más fuerte de las cinco máquinas y aun así es el que peor lleva la compresión, por la presión de admisión.'},
      {t:'Porque λ = 1,00 deja al catalizador de tres vías fuera de su ventana de trabajo y los gases saldrían sin tratar.',
       why:'λ = 1,00 es justo el centro de la ventana 0,98–1,02 que exige el catalizador. Ese criterio lo cumple.'},
      {t:'Porque el bloque no admite una relación de compresión de 11, que supera el máximo mecánico de esta máquina.',
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
  return {c,P,F:FUEL[P.fuel],R,tr,i,G:geom(P,c.r),E:ESTADO};
}
const PICK_INFO={
  bloque:()=>{ const {P,R,G}=pickCtx();
    return ['Bloque, camisa de agua y cárter',
      P.nom+': '+f0(P.ncil)+(P.ncil===1?' cilindro':' cilindros')+' de Ø '+f1(P.B*1000)+' × '+
      f1(P.S*1000)+' mm, '+cm3(G.Vd)+' cm³ por cilindro y '+cm3(G.Vd*P.ncil)+' cm³ en total. El corte pasa '+
      'por el eje del primero'+(P.ncil>1?'; los otros '+f0(P.ncil-1)+' siguen detrás sin cortar, y se cuentan por '+
      'las bobinas y los conductos':'')+'. A '+f0(P.rpm)+' rpm la velocidad media del pistón es '+f2(R.Sp)+
      ' m/s, y ese número aparece dos veces en el resultado: fija la turbulencia que acelera la llama ('+
      f2(CU_TURB)+' × Sp) y pesa en la fricción por Chen-Flynn, ahora '+f3(R.fmep)+' bar de fmep. La masa, la '+
      'presión y el calor que ves son los de UN cilindro; par y potencia sí multiplican por '+f0(P.ncil)+'.'];
  },
  camisa:()=>{ const {P,R,G,E}=pickCtx();
    return ['Camisa y carga del cilindro',
      'El hueco entre la corona del pistón y el techo es el volumen V(θ) que integra el motor: ahora '+
      cm3(E.V)+' cm³, entre '+cm3(G.Vc)+' cm³ en el punto muerto superior y '+cm3(G.Vc+G.Vd)+
      ' cm³ en el inferior. La lámina de color es la carga cortada por el plano, pintada con su temperatura '+
      'en la escala de la barra: '+(E.cerrado?f0(E.T)+' K de media'+(E.ardiendo?' y '+f0(E.Tu)+' K la parte sin quemar':'')
      :f0(E.T)+' K SUPUESTOS, porque el motor no integra este tramo')+'. La superficie que cede calor se toma como '+
      'A = πB²/2 + 4V/B: con este volumen son '+f1(area(G,E.V,P.B)*1e4)+' cm², y por ahí se escapa '+pc1(R.Qfrac)+
      ' del calor liberado según Woschni (C₁ = '+f2(C1_WOS)+').'];
  },
  piston:()=>{ const {c,P,R,E}=pickCtx(); const G3=cotas3D(c.mk,c.r);
    const x=(G3.a+G3.L-E.yBul)/ESC3;
    return ['Pistón, segmentos y bulón',
      'A '+gra(E.th)+' del PMS de encendido la corona está '+f1(x*1000)+' mm por debajo de su punto más alto, '+
      pc1(x/P.S)+' de la carrera: x = a·cos θ + √(L² − a²·sen²θ), la misma fórmula que alimenta la física. La '+
      'altura de compresión —del eje del bulón a la corona— es '+f1(G3.hComp/ESC3*1000)+' mm: con esta r el pistón '+
      'se hace a medida para que la holgura en el PMS deje exactamente V_c. Los tres segmentos se dibujan, pero el '+
      'modelo NO tiene fuga: entre IVC y EVO la masa encerrada es constante, '+f2(R.mTot*1e6)+' mg.'];
  },
  biela:()=>{ const {P,G}=pickCtx();
    return ['Biela',
      'L = '+f0(P.L*1000)+' mm sobre una manivela de a = '+f2(G.a*1000)+' mm: la relación L/a vale '+
      f2(P.L/G.a)+'. Ese cociente es lo único que separa el mecanismo real del seno de libro. Cuanto '+
      'más corta es la biela frente a la manivela, más se adelanta el pistón en la primera mitad de la '+
      'carrera y más se deforma V(θ) respecto de la curva ideal. Aquí se integra s = √(L² − a²·sen²θ) '+
      'tanto en el dibujo como en la ecuación de estado. Va entera, sin cortar, como manda el dibujo '+
      'de conjunto para bielas y ejes.'];
  },
  cigue:()=>{ const {P,R}=pickCtx();
    const ms=720/(P.rpm*6)*1000;
    return ['Cigüeñal y contrapeso',
      'Gira a '+f0(P.rpm)+' rpm: un ciclo de 720° dura '+f1(ms)+' ms en el motor real. La imagen va a ×1/'+
      sepMil(String(Math.round(RELOJ.N*RELOJ.k)))+', así que ese ciclo tarda aquí '+f1(PER3D)+' s'+
      (RELOJ.lento?', y más alrededor de la combustión':'')+'. Los dos árboles de levas giran a la mitad: una '+
      'vuelta por ciclo. Lo que sale por este eje es par y potencia de la máquina completa: '+f1(R.par)+
      ' N·m y '+f1(R.pot/1000)+' kW con '+f0(P.ncil)+(P.ncil===1?' cilindro':' cilindros')+
      '. La presión media efectiva, en cambio, es por unidad de cilindrada: '+f2(R.bmep)+' bar.'];
  },
  culata:()=>{ const {c,R,G}=pickCtx(); const G3=cotas3D(c.mk,c.r), E3=ESC3*ESC3*ESC3;
    return ['Culata de dos árboles y junta',
      'Cámara de techo a dos aguas inclinado '+f1(G3.alfa/DEG)+'°. El volumen muerto es V_c = V_d/(r − 1) = '+
      cm3(G.Vc)+' cm³ con r = '+f0(c.r)+': '+cm3(G3.Vroof/E3)+' cm³ en el techo, que es de la culata y no cambia, y '+
      cm3(G.Vc-G3.Vroof/E3)+' cm³ en la holgura de '+f2(G3.hCyl/ESC3*1000)+' mm entre la corona en el PMS y la cara '+
      'de la culata. Sube r y esa holgura ADELGAZA en pantalla: el pistón se hace más alto, la culata no cambia. La '+
      'relación efectiva, medida desde donde de verdad empieza la compresión, es r_ef = '+f3(R.rEf)+
      ', menor que la nominal porque la admisión cierra '+f0(180+TH_IVC)+'° después del punto muerto inferior. '+
      'Con r sale el rendimiento de libro ('+pc1(R.etaOtto)+'); con r_ef, el honesto ('+pc1(R.etaOttoEf)+').'];
  },
  bujia:()=>{ const {c,R}=pickCtx();
    return ['Bujía',
      'Salta a '+gra(c.av)+' antes del PMS. En ese instante la mezcla sin quemar está a '+f0(R.Ts)+
      ' K y '+bar(R.pS)+' bar; con esa presión y esa temperatura la velocidad laminar de llama de '+
      'Metghalchi-Keck vale '+f3(R.sL)+' m/s y, mezclada con la turbulencia por Damköhler (exponente '+
      f2(Q_DAMK)+'), la turbulenta sube a '+f2(R.sT)+' m/s. De ahí sale la duración de la combustión: '+
      'Δθ = '+f1(R.dth)+'°. La chispa no es un instante mágico: es el arranque de una Wiebe con '+
      'a = '+f3(A_WIEBE)+' y m = '+f0(M_WIEBE)+'. La descarga se dibuja durante 1,2 ms, que es lo que '+
      'dura la fase luminiscente de una bobina inductiva.'];
  },
  vadm:()=>{ const {c,P,R,E}=pickCtx(); const V=cotas3D(c.mk,c.r).VA, L=alzado(V,E.c).L;
    return ['Válvula de admisión, muelle y taqué de vaso',
      'Abre a '+f0(DIST.ivo)+'° de ciclo —'+f0(CRUCE)+'° antes del PMS de escape, valor típico declarado— y cierra '+
      'a '+gra(TH_IVC)+' del PMS de encendido, que es el IVC del motor: '+f0(V.dur)+'° abierta, con un alzado máximo '+
      'de '+f1(V.Lmax/ESC3*1000)+' mm; ahora '+f1(L/ESC3*1000)+' mm. La ley es de aceleración senoidal, continua '+
      'hasta la aceleración, y el lóbulo está sintetizado para que el taqué plano reproduzca exactamente ese alzado. '+
      'El motor no simula el llenado: con p_adm = '+bar(P.pAdm)+' bar y T_adm = '+f0(P.Tadm)+' K quedan encerrados '+
      f2(R.mTot*1e6)+' mg, de los cuales '+pc1(R.fRes)+' son gas residual. El rendimiento volumétrico ('+
      pc1(R.etaV)+') es una CONSECUENCIA de esa presión impuesta, no una curva de llenado medida.'];
  },
  vesc:()=>{ const {c,P,R,E}=pickCtx(); const V=cotas3D(c.mk,c.r).VE, L=alzado(V,E.c).L;
    return ['Válvula de escape',
      'Abre a '+gra(TH_EVO)+', donde termina la integración del motor, y cierra a '+f0(DIST.evc)+'° de ciclo —'+
      f0(CRUCE)+'° después del PMS, valor típico declarado—: '+f0(V.dur)+'° abierta, alzado máximo '+
      f1(V.Lmax/ESC3*1000)+' mm; ahora '+f1(L/ESC3*1000)+' mm. Desde la apertura el gas se expande hasta '+
      bar(P.pEscBase)+' bar de forma isentrópica: de '+f0(R.Tevo)+' K quedan '+f0(R.Texh)+' K en el conducto. '+
      'El soplado y la carrera de escape que se ven son un estado SUPUESTO; el bombeo entra en la cuenta como un '+
      'pmep constante de '+f2(R.pmep)+' bar, lo que separa la '+f3(R.imepG)+' bar indicada bruta de la '+
      f3(R.imepN)+' bar neta.'];
  },
  llama:()=>{ const {R,E}=pickCtx();
    return ['Frente de llama',
      'Una esfera centrada en el electrodo y recortada por la corona, la camisa y el techo, cuyo volumen recortado '+
      'es la fracción de VOLUMEN quemada y_b = x_b·T_b/T: la masa quemada x_b de la Wiebe ocupa más sitio porque '+
      'está mucho más caliente. '+(E.ardiendo?'Ahora x_b = '+pc1(E.xb)+' en masa e y_b = '+pc1(E.yb)+
      ' en volumen, con el frente a '+f1(E.Rf/ESC3*1000)+' mm del electrodo; el gas quemado está a '+f0(E.Tb||E.T)+
      ' K y el que falta por quemar a '+f0(E.Tu)+' K. ':'En este ángulo no hay frente: '+
      (E.cerrado&&E.xb<=0?'aún no saltó la chispa. ':'la carga ya se quemó entera. '))+
      'La combustión completa dura '+f1(R.dth)+'° de cigüeñal y suelta '+f0(R.Q)+' J por ciclo y cilindro, de '+
      'los que '+pc1(R.Qfrac)+' se van por las paredes. La esfera lisa es una simplificación: la llama real se '+
      'arruga con la turbulencia.'];
  },
  levas:()=>{ const {c,E}=pickCtx(); const G3=cotas3D(c.mk,c.r);
    return ['Árboles de levas',
      'Dos árboles en cabeza que giran a la MITAD que el cigüeñal: una vuelta por ciclo de 720°. Ahora el cigüeñal '+
      'va por '+f0(E.c)+'° de ciclo y cada árbol por '+f0(E.c/2)+'°. El lóbulo no está dibujado a ojo: es la '+
      'envolvente de las posiciones del taqué plano, P(ψ) = (r_b + L)·u + (dL/dψ)·u⊥, sobre un círculo base de '+
      f1(2*G3.VA.rb/ESC3*1000)+' mm, así que empuja exactamente el alzado de la ley. Admisión: '+f0(G3.VA.dur)+
      '° y '+f1(G3.VA.Lmax/ESC3*1000)+' mm; escape: '+f0(G3.VE.dur)+'° y '+f1(G3.VE.Lmax/ESC3*1000)+' mm.'];
  },
  admision:()=>{ const {P,R,F,E}=pickCtx();
    return ['Colector de admisión'+(P.iny==='PFI'?' e inyector':(P.iny==='GDI'?' e inyección directa':' y mezclador')),
      (P.iny==='PFI'?'Inyección en el conducto: el chorro se dibuja con la válvula cerrada, de 200° a 300° de '+
        'ciclo, contra el dorso del plato (ventana típica, declarada). ':
       P.iny==='GDI'?'Inyección directa: el chorro entra en la cámara durante la admisión, de 410° a 470° de '+
        'ciclo (ventana típica, declarada). ':'El gas LP llega ya mezclado desde el mezclador del plenum: no hay chorro. ')+
      'La niebla del conducto avanza sólo cuando entra carga, al paso de la fracción admitida por volumen barrido; '+
      'ahora '+(E.cerrado||E.c<=DIST.ivo?'la admisión está cerrada':pc1(E.Q)+' admitida')+'. Del '+F.nom+', '+
      pc1(P.fevap)+' se evapora antes del cierre y enfría la carga '+f1(R.dTev)+' K: eso sí lo calcula el motor.'];
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
      f0(ANIOS)+' años, no la más eficiente. Hay dos pistas como máximo: orientan hacia dónde '+
      'mirar sin dar ningún valor de la terna, y a los tres intentos fallados el caso cambia. '+
      'Hay '+f0(RETO.nval)+' válidas.');
  }
}

pickerFor(scene,S.camera,S.renderer.domElement,hit=>{
  const o=hit&&hit.object;
  if(!o) return;
  if(o===bmesh){ boardClick(); synth.beep(620,0.05,0.05); return; }
  // La lámina de gas contesta según dónde se toque: dentro del frente, la llama.
  if(o===gasPlano&&MQ){ const p=MOTOR.worldToLocal(hit.point.clone()), E=ESTADO;
    const k=E.Rf>0&&Math.hypot(p.x,p.y-MQ.Gr.yE)<=E.Rf?'llama':'camisa', inf=PICK_INFO[k]();
    synth.beep(760,0.05,0.05); showToast('<b>'+inf[0]+'</b> · '+inf[1]); return; }
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
  // El recorrido es una DEMOSTRACIÓN: guarda el reto del alumno, hace la demo sobre
  // OTRA máquina y al terminar lo devuelve tal cual estaba (sin resolver si no lo
  // estaba). Jamás deja `solved` en true.
  const snap={ mk:RETO.cfg.mk, ejes:{...RETO.ejes}, pistas:{...RETO.pistas},
    pistaTxt:RETO.pistaTxt.slice(), intentos:RETO.intentos, aviso:RETO.aviso, msg:RETO.msg,
    resuelto:RETO.resuelto, solved, tenia:!!RETO.sol, st:{...ST}, mode };
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
    RETO.cfg.mk=(snap.mk==='turbo')?'compet':'turbo'; retoSolveBuild();
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
      RETO.msg=juzgaReto().msg; afterEdit();
    }
    await sleep(6200);

    // --- 9. la que sí se firma -----------------------------------------
    {
      const s=RETO.sol;
      RETO.ejes={r:s.r, avance:s.avance, lam:s.lam};
      RETO.msg=''; RETO.resuelto=false; afterEdit();
      await sleep(1800);
      RETO.msg=juzgaReto().msg; afterEdit();
    }
    await sleep(6000);
    answer(quizCorrectIndex());
  } finally {
    // Devuelve el reto del alumno, sin resolver si no lo estaba.
    Object.assign(ST,snap.st);
    RETO.cfg.mk=snap.mk;
    if(snap.tenia){
      RETO.sol=solM(snap.mk); RETO.nval=valM(snap.mk).length;
      RETO.ejes=snap.ejes; RETO.pistas=snap.pistas; RETO.pistaTxt=snap.pistaTxt;
      RETO.intentos=snap.intentos; RETO.aviso=snap.aviso; RETO.msg=snap.msg;
      RETO.resuelto=snap.resuelto;
    } else { RETO.sol=null; retoSolveBuild(); }
    solved=snap.solved;
    aplicaMaquina();
    buildControls(); updateScenarioInfo(); updateRetoSpec(); refreshAll();
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
  pinta3D(dt);
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
  R_G, AV_G, LAM_G, NPTS, NMEC, ESC3, get PER3D(){ return PER3D; },
  // --- catálogo y pliego
  FUEL, MAQ, MAQ_KEYS, CRIT, CRIT_ROT, CRIT_COR, ICONO, ROT,
  // --- motor sellado
  cpAire, gammaAire, gammaQuem, gamma, cv:cvGas, geom, vol, dvol, area, sLam, wiebe, dwiebe, tauDE,
  sim, barrido, censo, solucion, validas, pistas, pliegoFilas, fallosDe,
  simT, censoM, solM, valM, empates, empM, pistasEje, pisM, sweepR, sweepL,
  // --- estado vivo
  st:()=>({...ST}), cur:()=>CUR, cfg:()=>cfgDe(mode), frame:()=>FR, maq:()=>maqAct(),
  reto:()=>({cfg:{...RETO.cfg}, ejes:{...RETO.ejes}, sol:RETO.sol, nval:RETO.nval,
             resuelto:RETO.resuelto, msg:RETO.msg, pistas:{...RETO.pistas},
             nPistas:nPistas(), intentos:RETO.intentos}),
  intentos:()=>RETO.intentos,
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
  // --- el motor en 3D: un solo reloj, el ángulo de ciclo c ∈ [0, 720) con 0 en el PMS de encendido
  theta:()=>RELOJ.c,
  setTheta:v=>{ RELOJ.c=cicloDe(Number(v)); RELOJ.pausa=true; pinta3D(0); updateLive(); pintaBarra(true); return ESTADO.c; },
  pausa:v=>{ if(v!==undefined) RELOJ.pausa=!!v; return RELOJ.pausa; },
  velocidad:v=>{ if(v!==undefined){ RELOJ.N=Number(v); RELOJ.auto=false; PER3D=720/(6*maqAct().rpm)*RELOJ.N; }
    return {N:RELOJ.N, k:RELOJ.k, lento:RELOJ.lento, per3d:PER3D}; },
  lento:v=>{ if(v!==undefined) RELOJ.lento=!!v; return RELOJ.lento; },
  estado3D:()=>Object.assign({},ESTADO),
  cotas3D, dims3D:()=>MQ&&MQ.d, DIST, CRUCE, PROP3D, alzado, leyAlzado, perfilLeva, empujeLeva, camRot,
  bulonY, coronaY, volCamara3D, bielaAng, dosZonas, volFrente, radioFrente, estadoAbierto, colorT, ESCALA_T,
  piezas3D:()=>{ if(!MQ) return null; const p={valvA:MQ.valv[0].grp.position.toArray(), valvE:MQ.valv[1].grp.position.toArray(),
    levaA:MQ.valv[0].leva.rotation.z, levaE:MQ.valv[1].leva.rotation.z, cig:MQ.cig.rotation.z,
    piston:MQ.pis.position.y, biela:[MQ.bie.position.x,MQ.bie.position.y,MQ.bie.rotation.z],
    corona:GAS_U.uCor.value, frente:GAS_U.uRf.value, knock:GAS_U.uKon.value,
    caja:[MQ.caja.min.toArray(),MQ.caja.max.toArray()]}; return p; },
  calidad:v=>{ if(v){ CAL3.nivel=v; aplicaCalidad(true); } return CAL3.nivel; },
  vista:v=>{ if(v){ VISTA.actual=v; const c=vistaCam(v); S.moveTo(c[0],c[1],0.01); pintaBarra(true); } return VISTA.actual; },
  rotulos:v=>{ if(v!==undefined){ ROT3.on=!!v; pintaRotulos(); } return ROT3.on; },
  // --- formato y recorrido
  fN, f0, f1, f2, f3, f4, pc1, pcm, fin, bar, cm3, gra,
  runAuto, autoRunning:()=>autoRunning,
};

// __END__
