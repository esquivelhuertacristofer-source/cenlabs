/**
 * bio02/transporte.ts — LA CIENCIA del lab de transporte celular (módulo puro: sin three ni
 * React; lo prueba `src/__tests__/bio02-transporte.test.ts`).
 *
 * Un glóbulo rojo humano y su membrana. Unidades de trabajo: concentraciones en mM
 * (= mOsm/L para la osmolaridad), volúmenes en fL, cantidades en amol (= mM·fL), tiempo
 * en s REALES (la escena lo ralentiza con un factor rotulado), presiones en atm y pO₂ en mmHg.
 *
 *  · ÓSMOSIS (Boyle–van 't Hoff). dV/dt = P_f·A·V̄w·(Osm_in − Osm_out). Los solutos que no
 *    cruzan se conservan (Osm_in·V = n), así que el agua deja de moverse cuando Osm_in = Osm_out:
 *    V = V₀·Osm₀/Osm_ext. Presión osmótica de van 't Hoff: Π = i·M·R·T.
 *  · DIFUSIÓN SIMPLE (1.ª ley de Fick). J = −D·dC/dx; a través de una membrana de grosor L con
 *    coeficiente de reparto K el perfil es lineal y J = P·(C_fuera − C_dentro), P = K·D/L.
 *    Así cruza el O₂ la bicapa; dentro, la hemoglobina lo atrapa (Hill).
 *  · DIFUSIÓN FACILITADA (GLUT1). Transportador simétrico de Michaelis–Menten: cada
 *    transportador gira entre las dos caras a ritmo k = 2·k_cat (cargado o vacío) y
 *    J = k_cat·[S_o/(K_m + S_o) − S_i/(K_m + S_i)]: se satura y nunca va contra el gradiente.
 *  · TRANSPORTE ACTIVO (Na⁺/K⁺-ATPasa). v = V_max·Hill(Na⁺_i)·Hill(K⁺_o)·[ATP]/(K_ATP + [ATP]):
 *    3 Na⁺ fuera y 2 K⁺ dentro por cada ATP; sin ATP se detiene.
 */
import { I_NACL, I_GLUCOSA, UMBRAL_LISIS_B2, VMAX_VEGETAL_B2 } from '@/domain/biologia';

// ───────────────────────────── constantes ─────────────────────────────

/** J/(mol·K) (CODATA 2018) */
export const R_J = 8.314462618;
/** L·atm/(mol·K) */
export const R_ATM = 0.082057366;
/** 1/mol */
export const N_A = 6.02214076e23;
/** C/mol */
export const FARADAY = 96485.33212;
export const T0 = 273.15;
/** volumen molar parcial del agua (cm³/mol, 25 °C) */
export const V_AGUA = 18.07;
export const kelvin = (tC: number) => tC + T0;

/** Glóbulo rojo humano (valores de libro: VCM, área, CHCM; Lew y Bookchin, Hoffman). */
export const ERITROCITO = {
  /** fL (volumen corpuscular medio) */
  V0: 90,
  /** µm² (la membrana casi no se estira: el área se conserva) */
  A: 140,
  /** mOsm/L del citoplasma en reposo */
  osm0: 290,
  /** mM de tetrámeros de hemoglobina con V₀ (CHCM 33 g/dL ÷ 64,5 kg/mol) */
  hb: 5.1,
  /** mM con V₀ (estado estacionario: la fuga pasiva iguala a la bomba en horas) */
  na: 10, k: 140, cl: 75, atp: 1.5,
} as const;
/** µm² → cm² */
const AREA_CM2 = ERITROCITO.A * 1e-8;
/** amol de solutos que no cruzan (los del citoplasma en reposo) */
export const N_IMPERMEANTE = ERITROCITO.osm0 * ERITROCITO.V0;
/** amol de tetrámeros de hemoglobina (fijos) */
export const N_HB = ERITROCITO.hb * ERITROCITO.V0;

// ───────────────────────────── presión osmótica ─────────────────────────────

/** Π = Osm·R·T (atm), con Osm en Osm/L. */
export function presionOsmotica(osm: number, tC: number): number {
  return osm * R_ATM * kelvin(tC);
}
/** Π = i·M·R·T de van 't Hoff (atm), con M en mol/L. */
export const presionVanTHoff = (i: number, M: number, tC: number) => presionOsmotica(i * M, tC);
/** Osmolaridad (Osm/L) de un medio de NaCl y glucosa (mol/L), como la cuenta el reto. */
export const osmolaridadReto = (nacl: number, glucosa: number) => I_NACL * nacl + I_GLUCOSA * glucosa;

// ───────────────────────────── Fick ─────────────────────────────

/** 1.ª ley de Fick: J = −D·dC/dx (unidades coherentes: mol·m⁻²·s⁻¹ con D en m²/s y C en mol/m³). */
export const flujoFick = (D: number, dCdx: number) => -D * dCdx;
/** Permeabilidad de una membrana homogénea: P = K·D/L. */
export const permeabilidad = (D: number, K: number, L: number) => (K * D) / L;
/** Flujo de fuera hacia dentro a través de la membrana: J = P·(C_fuera − C_dentro). */
export const flujoMembrana = (P: number, cFuera: number, cDentro: number) => P * (cFuera - cDentro);
/**
 * Perfil estacionario DENTRO de la membrana (x = 0 cara de fuera, x = L cara de dentro): la
 * concentración en el lípido es K veces la del agua de cada lado y entre medias es lineal.
 */
export function perfilMembrana(cFuera: number, cDentro: number, K: number, L: number, x: number): number {
  const s = Math.min(1, Math.max(0, x / L));
  return K * (cFuera + (cDentro - cFuera) * s);
}
/**
 * Difusión 1D explícita (FTCS) en la membrana con las caras fijas a K·C de cada lado, hasta
 * `t`. Devuelve el perfil y el flujo en la cara de dentro (−D·dC/dx). Sirve de prueba
 * numérica independiente de la forma cerrada.
 */
export function difusionMembrana(D: number, K: number, L: number, cFuera: number, cDentro: number, t: number, nodos = 41) {
  const dx = L / (nodos - 1);
  const dt = (0.4 * dx * dx) / D;
  let c = new Float64Array(nodos);
  c[0] = K * cFuera; c[nodos - 1] = K * cDentro;
  const pasos = Math.ceil(t / dt);
  for (let k = 0; k < pasos; k++) {
    const n = new Float64Array(nodos);
    n[0] = c[0]; n[nodos - 1] = c[nodos - 1];
    for (let i = 1; i < nodos - 1; i++) n[i] = c[i] + (D * dt / (dx * dx)) * (c[i + 1] - 2 * c[i] + c[i - 1]);
    c = n;
  }
  const flujo = flujoFick(D, (c[nodos - 1] - c[nodos - 2]) / dx);
  return { perfil: Array.from(c), flujo };
}
/** Dos compartimentos por difusión simple: C_in(t) = C_out + (C_in0 − C_out)·e^(−t·P·A/V). */
export function equilibrioFick(cIn0: number, cOut: number, P: number, A: number, V: number, t: number): number {
  return cOut + (cIn0 - cOut) * Math.exp((-t * P * A) / V);
}

// ───────────────────────────── Michaelis–Menten y Hill ─────────────────────────────

/** v = V_max·S/(K_m + S) */
export const mm = (vmax: number, km: number, s: number) => (s <= 0 ? 0 : (vmax * s) / (km + s));
/** v = V_max·Sⁿ/(Kⁿ + Sⁿ) */
export const hill = (vmax: number, k: number, n: number, s: number) => (s <= 0 ? 0 : (vmax * s ** n) / (k ** n + s ** n));

// ───────────────────────────── agua ─────────────────────────────

/** Permeabilidad osmótica del glóbulo rojo (≈ 2·10⁻² cm/s a 25 °C, ~85 % por la acuaporina 1). */
export const AGUA = { pf25: 0.02, q10: 1.5, fraccionAQP1: 0.85, tetramerosAQP1: 5e4 } as const;
export const pfAgua = (tC: number) => AGUA.pf25 * AGUA.q10 ** ((tC - 25) / 10);
/** L_p de la célula entera: fL/(s·mOsm/L) = P_f·A·V̄w (con 1 mM = 10⁻⁶ mol/cm³ y 1 cm³ = 10¹² fL). */
export const lpCelula = (tC: number) => pfAgua(tC) * AREA_CM2 * V_AGUA * 1e-6 * 1e12;
/** Moléculas de agua por fL. */
export const MOLECULAS_POR_FL = (1e-12 / V_AGUA) * N_A;

// ───────────────────────────── glucosa: GLUT1 ─────────────────────────────

/** GLUT1 del glóbulo rojo (K_m y k_cat de entrada sin glucosa dentro; ~3·10⁵ copias por célula). */
export const GLUT1 = { km: 3, kcat37: 200, q10: 2.3, copias: 3e5 } as const;
export const kcatGlut1 = (tC: number) => GLUT1.kcat37 * GLUT1.q10 ** ((tC - 37) / 10);
/**
 * Flujos UNIDIRECCIONALES por transportador (moléculas/s). El transportador simétrico gira a
 * ritmo `giros` = 2·k_cat esté cargado o no: la mitad del tiempo mira a cada cara y en cada giro
 * lleva una glucosa con probabilidad S/(K_m + S) de la cara de la que sale.
 */
export function glut1(so: number, si: number, tC: number) {
  const k = kcatGlut1(tC);
  const entra = mm(k, GLUT1.km, so), sale = mm(k, GLUT1.km, si);
  return { entra, sale, neto: entra - sale, giros: 2 * k, pFuera: so / (GLUT1.km + so), pDentro: si / (GLUT1.km + si) };
}

// ───────────────────────────── Na⁺/K⁺-ATPasa ─────────────────────────────

/** Bomba de sodio y potasio (Na⁺ interno con Hill 3, K⁺ externo con Hill 2, ATP Michaelis–Menten). */
export const BOMBA = { vmax37: 100, q10: 3, kNa: 10, nNa: 3, kK: 1.5, nK: 2, kATP: 0.2, copias: 250 } as const;
export const vmaxBomba = (tC: number) => BOMBA.vmax37 * BOMBA.q10 ** ((tC - 37) / 10);
/** Ciclos por segundo de UNA bomba y los iones que mueve (3 Na⁺ fuera y 2 K⁺ dentro por ATP). */
export function bomba(naIn: number, kOut: number, atp: number, tC: number) {
  const fNa = hill(1, BOMBA.kNa, BOMBA.nNa, naIn);
  const fK = hill(1, BOMBA.kK, BOMBA.nK, kOut);
  const fAtp = mm(1, BOMBA.kATP, atp);
  const vmaxEf = vmaxBomba(tC) * fNa * fK;
  const ciclos = vmaxEf * fAtp;
  return { ciclos, naFuera: 3 * ciclos, kDentro: 2 * ciclos, atp: ciclos, vmaxEf, fNa, fK, fAtp };
}
/**
 * Energía libre (kJ/mol de ciclos) de sacar 3 Na⁺ y meter 2 K⁺ contra sus gradientes con el
 * potencial de membrana Vm (V, dentro respecto a fuera). La debe pagar la hidrólisis del ATP.
 */
export function energiaBomba(naIn: number, naOut: number, kIn: number, kOut: number, Vm: number, tC: number): number {
  const RT = R_J * kelvin(tC);
  const naSale = RT * Math.log(naOut / naIn) - FARADAY * Vm;  // +1 de dentro afuera
  const kEntra = RT * Math.log(kIn / kOut) + FARADAY * Vm;     // +1 de fuera adentro
  return (3 * naSale + 2 * kEntra) / 1000;
}

// ───────────────────────────── O₂ y hemoglobina ─────────────────────────────

/**
 * O₂: solubilidad en el citoplasma α (mM/mmHg, 37 °C), curva de Hill de la hemoglobina
 * (P50 = 26,8 mmHg, n = 2,7; la P50 sube con T: Δlog P50/ΔT = 0,024 /°C) y la permeabilidad
 * EFECTIVA del glóbulo rojo (la bicapa deja pasar el O₂ ~10³ veces más deprisa: frena la
 * difusión dentro de la célula y la reacción con la hemoglobina).
 */
export const OXIGENO = { alfa: 1.38e-3, p50: 26.8, n: 2.7, dLogP50: 0.024, pEf: 0.05, pulmon: 100, tejido: 40 } as const;
export const p50 = (tC: number) => OXIGENO.p50 * 10 ** (OXIGENO.dLogP50 * (tC - 37));
export function saturacionHb(pO2: number, tC = 37): number {
  if (!(pO2 > 0)) return 0;
  const x = (pO2 / p50(tC)) ** OXIGENO.n;
  return x / (1 + x);
}
/** amol de O₂ en la célula (disuelto + unido) con pO₂ y volumen V (fL). */
export const contenidoO2 = (pO2: number, V: number, tC = 37) => OXIGENO.alfa * pO2 * V + 4 * N_HB * saturacionHb(pO2, tC);
/** pO₂ (mmHg) que corresponde a un contenido n (amol): la inversa (monótona) por bisección. */
export function pO2DeContenido(n: number, V: number, tC = 37): number {
  if (!(n > 0)) return 0;
  let lo = 0, hi = 2000;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (contenidoO2(m, V, tC) < n) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}
/** amol/(s·mmHg): P_ef·A·α (α en mol/cm³ por mmHg). */
export const CONDUCTANCIA_O2 = OXIGENO.pEf * AREA_CM2 * OXIGENO.alfa * 1e-6 * 1e18;

// ───────────────────────────── la célula de la exploración ─────────────────────────────

/** Medio de la exploración: NaCl, KCl y glucosa en mM, ATP del citoplasma en mM, pO₂ en mmHg. */
export interface Medio { nacl: number; kcl: number; glucosa: number; atp: number; pO2: number; tC: number }
export const MEDIO_INICIAL: Medio = { nacl: 120, kcl: 5, glucosa: 5, atp: 1.5, pO2: OXIGENO.pulmon, tC: 37 };
/** Rangos de los mandos: el NaCl no baja tanto como para la hemólisis (V < 160 %). */
export const RANGO = { nacl: [90, 220], glucosa: [0, 20], atp: [0, 3], tC: [5, 40] } as const;

/** Estado de la célula (lo único que se integra). */
export interface EstadoCelula { t: number; V: number; nGlu: number; nO2: number }

/** La célula ANTES de la transferencia: en suero isotónico sin glucosa, sangre venosa (pO₂ 40). */
export function estadoTransferencia(tC = 37): EstadoCelula {
  return { t: 0, V: ERITROCITO.V0, nGlu: 0, nO2: contenidoO2(OXIGENO.tejido, ERITROCITO.V0, tC) };
}

/** Osmolaridad del medio (mOsm/L): todo lo disuelto. */
export const osmMedio = (m: Medio) => 2 * m.nacl + 2 * m.kcl + m.glucosa;
/** Tonicidad efectiva (mOsm/L): sólo lo que no entra en la célula (la glucosa acaba dentro). */
export const tonicidad = (m: Medio) => 2 * m.nacl + 2 * m.kcl;
/** Volumen de equilibrio (fL) cuando la glucosa ya se igualó: V = n_imp/tonicidad. */
export const volumenEquilibrio = (m: Medio) => N_IMPERMEANTE / tonicidad(m);

interface Derivadas { dV: number; dGlu: number; dO2: number }
function derivadas(m: Medio, e: EstadoCelula): Derivadas {
  const V = Math.max(e.V, 1);
  const osmIn = (N_IMPERMEANTE + e.nGlu) / V;
  const dV = lpCelula(m.tC) * (osmIn - osmMedio(m));
  const gIn = e.nGlu / V;
  const g = glut1(m.glucosa, gIn, m.tC);
  const dGlu = GLUT1.copias * g.neto / N_A * 1e18;
  const pIn = pO2DeContenido(e.nO2, V, m.tC);
  const dO2 = CONDUCTANCIA_O2 * (m.pO2 - pIn);
  return { dV, dGlu, dO2 };
}

/** Avanza la célula `dt` s reales con RK4 (subpasos de ≤ 4 ms: el O₂ tiene τ ≈ 20 ms al final). */
export function avanzarCelula(m: Medio, e: EstadoCelula, dt: number): EstadoCelula {
  if (!(dt > 0)) return e;
  const n = Math.max(1, Math.ceil(dt / 0.004));
  const h = dt / n;
  let s = e;
  const mas = (a: EstadoCelula, d: Derivadas, k: number): EstadoCelula => ({ t: a.t, V: a.V + d.dV * k, nGlu: Math.max(0, a.nGlu + d.dGlu * k), nO2: Math.max(0, a.nO2 + d.dO2 * k) });
  for (let i = 0; i < n; i++) {
    const k1 = derivadas(m, s);
    const k2 = derivadas(m, mas(s, k1, h / 2));
    const k3 = derivadas(m, mas(s, k2, h / 2));
    const k4 = derivadas(m, mas(s, k3, h));
    s = {
      t: s.t + h,
      V: s.V + (h / 6) * (k1.dV + 2 * k2.dV + 2 * k3.dV + k4.dV),
      nGlu: Math.max(0, s.nGlu + (h / 6) * (k1.dGlu + 2 * k2.dGlu + 2 * k3.dGlu + k4.dGlu)),
      nO2: Math.max(0, s.nO2 + (h / 6) * (k1.dO2 + 2 * k2.dO2 + 2 * k3.dO2 + k4.dO2)),
    };
  }
  return s;
}

/** Área de bicapa que dibuja la escena (nm²) y volumen de cada caja de partículas (nm³). */
export const PARCHE = { areaNm2: 40 * 5, cajaNm3: 40 * 5 * 7 } as const;
/** Moléculas de una especie a `mM` en un volumen de `nm3`: c·V·N_A (1 mM·nm³ = 6,022·10⁻⁴). */
export const enCaja = (mM: number, nm3: number) => mM * 1e-3 * nm3 * 1e-24 * N_A;
/** Cuántas moléculas reales representa cada una de las que se dibujan cruzando. */
export const PAQUETE = { agua: 1e4, o2: 10 } as const;

/** Todo lo que se lee de la célula en un instante (escena, dock y barra leen ESTO). */
export interface Lectura {
  V: number; vRel: number; dVdt: number;
  osmIn: number; osmOut: number; tonicidad: number;
  piIn: number; piOut: number;
  gIn: number; gOut: number; glut: ReturnType<typeof glut1>;
  pO2In: number; pO2Out: number; sat: number; dO2: number;
  bomba: ReturnType<typeof bomba>;
  naIn: number; naOut: number; kIn: number; kOut: number; clIn: number; clOut: number; atp: number; hb: number;
  /** H₂O netas por segundo real en UNA acuaporina (tetrámero), + = entran */
  aguaTetramero: number;
  /** O₂ netas por segundo real en el parche dibujado, + = entran */
  o2Parche: number;
}

export function leerCelula(m: Medio, e: EstadoCelula): Lectura {
  const V = Math.max(e.V, 1);
  const dil = ERITROCITO.V0 / V;
  const osmIn = (N_IMPERMEANTE + e.nGlu) / V;
  const osmOut = osmMedio(m);
  const gIn = e.nGlu / V;
  const pIn = pO2DeContenido(e.nO2, V, m.tC);
  const dV = lpCelula(m.tC) * (osmIn - osmOut);
  const dO2 = CONDUCTANCIA_O2 * (m.pO2 - pIn);
  const naIn = ERITROCITO.na * dil;
  return {
    V, vRel: (100 * V) / ERITROCITO.V0, dVdt: dV,
    osmIn, osmOut, tonicidad: tonicidad(m),
    piIn: presionOsmotica(osmIn / 1000, m.tC), piOut: presionOsmotica(osmOut / 1000, m.tC),
    gIn, gOut: m.glucosa, glut: glut1(m.glucosa, gIn, m.tC),
    pO2In: pIn, pO2Out: m.pO2, sat: saturacionHb(pIn, m.tC), dO2,
    bomba: bomba(naIn, m.kcl, m.atp, m.tC),
    naIn, naOut: m.nacl, kIn: ERITROCITO.k * dil, kOut: m.kcl, clIn: ERITROCITO.cl * dil, clOut: m.nacl + m.kcl,
    atp: m.atp, hb: ERITROCITO.hb * dil,
    aguaTetramero: (dV * MOLECULAS_POR_FL * AGUA.fraccionAQP1) / AGUA.tetramerosAQP1,
    // la célula entera reparte el flujo por su área: el parche (nm²) es una fracción de A (1 µm² = 10⁶ nm²)
    o2Parche: dO2 * 1e-18 * N_A * (PARCHE.areaNm2 / (ERITROCITO.A * 1e6)),
  };
}

// ───────────────────────────── la célula del reto ─────────────────────────────

/**
 * Ósmosis del reto con el MISMO equilibrio que el juez del dominio (V = V₀·Osm₀/Osm_ext; la
 * pared vegetal la frena en 108 %), y la velocidad REAL: dV/dt (%V₀/s) = L_p·(Osm₀·100/V − Osm_ext)
 * con L_p de la célula entera. En el reto el NaCl y la glucosa del medio cuentan los dos: la
 * glucosa entra por GLUT1 en minutos y la medición dura segundos.
 */
export const lpRetoPorcentaje = (tC: number) => (lpCelula(tC) / ERITROCITO.V0) * 100 * 1000; // %V₀/(s·Osm/L)
export function pasoVolumenReto(v: number, tipo: 'animal' | 'vegetal', osmInt0: number, osmExt: number, tC: number, dt: number): number {
  const n = Math.max(1, Math.ceil(dt / 0.01));
  const h = dt / n;
  const lp = lpRetoPorcentaje(tC);
  const f = (x: number) => lp * ((osmInt0 * 100) / Math.max(x, 1) - osmExt);
  let x = v;
  for (let i = 0; i < n; i++) {
    const k1 = f(x), k2 = f(x + (h / 2) * k1), k3 = f(x + (h / 2) * k2), k4 = f(x + h * k3);
    x += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    if (tipo === 'vegetal') x = Math.min(x, VMAX_VEGETAL_B2);
    x = Math.max(20, x);
  }
  return x;
}
export { UMBRAL_LISIS_B2, VMAX_VEGETAL_B2 };

// ───────────────────────────── cámara lenta ─────────────────────────────

/** Factor de cámara lenta de cada vista (1 s de pantalla = 1/N s reales). */
export const CAMARA_LENTA = { membrana: 300, celula: 10, reto: 10 } as const;
