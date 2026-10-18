/**
 * bio04/fotosintesis.ts — LA FÍSICA del lab de fotosíntesis (módulo puro: sin three ni React).
 *
 * Se apoya en el modelo del dominio (`@/domain/biologia`, el que juzga el reto) y lo
 * EXTIENDE sin cambiarlo: con las condiciones del reto (25 °C y NaHCO₃ al 0,1 %) la tasa
 * de este módulo es, número por número, `tasaNetaB4` (lo comprueba la prueba de jest).
 *
 *  · Luz: PPFD(d) = 1000·(10/d)² µmol·m⁻²·s⁻¹ (inverso del cuadrado) y la energía de cada
 *    fotón E = hc/λ (constantes exactas del SI 2019).
 *  · Curva de respuesta a la luz: P(I) = Pmax·(1 − e^(−I/Ik)) − R, con Ik = Pmax/(φ·η(λ)).
 *  · CO₂: Pmax sigue a Michaelis–Menten con el carbono inorgánico disuelto (CID) que da el
 *    NaHCO₃ del agua. Temperatura: Pmax(T) de June, Evans y Farquhar (2004) y respiración
 *    con Q₁₀ = 2.
 *  · Punto de compensación I_c = −Ik·ln(1 − R/Pmax) y saturación I₉₅ = Ik·ln 20.
 *  · Espectros: absorción de clorofila a, clorofila b y β-caroteno (bandas gaussianas con
 *    los máximos de Lichtenthaler, 1987), emisión de cada lámpara LED y espectro de acción
 *    medio de McCree (1972); absorptancia típica de hoja.
 *  · Estequiometría: 6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂, gas ideal para pasar de mL a mol y el
 *    balance del esquema Z (2 fotones y 3 H⁺ por e⁻, anillo c de 14 subunidades).
 *
 * Unidades: tasas en mL O₂/min (las del dominio), luz en µmol fotones·m⁻²·s⁻¹, λ en nm,
 * T en °C, CID en mmol/L.
 */
import {
  EFICIENCIA_ESPECTRAL_B4, PPFD_10CM_B4, PMAX_B4, PHI_B4, RESPIRACION_B4, DURACION_B4, D_MAX_B4,
  ppfdB4, tasaNetaB4,
} from '@/domain/biologia';
import type { ColorLuzB4 } from '@/store/types';

export { ppfdB4, D_MAX_B4, DURACION_B4 };
export type { ColorLuzB4 };

// ───────────────────────────── constantes físicas (SI 2019, exactas) ─────────────────────────────

export const H_PLANCK = 6.62607015e-34;   // J·s
export const C_LUZ = 299792458;           // m/s
export const N_AVOGADRO = 6.02214076e23;  // 1/mol
export const Q_E = 1.602176634e-19;       // C
export const R_GAS = 8.314462618;         // J/(mol·K)
export const P_ATM = 101325;              // Pa

/** Energía de un fotón de longitud de onda λ (nm), en J. */
export const energiaFotonJ = (lambdaNm: number) => (H_PLANCK * C_LUZ) / (lambdaNm * 1e-9);
/** …en eV (hc ≈ 1239,84 eV·nm). */
export const energiaFotonEV = (lambdaNm: number) => energiaFotonJ(lambdaNm) / Q_E;
/** …de un mol de fotones (un «einstein»), en kJ/mol. */
export const energiaMolFotonesKJ = (lambdaNm: number) => (energiaFotonJ(lambdaNm) * N_AVOGADRO) / 1000;

// ───────────────────────────── lámparas LED ─────────────────────────────

/** Gaussiana de área relativa: exp(−4 ln2·(λ − c)²/w²), w = anchura a media altura. */
export const gauss = (x: number, c: number, w: number) => Math.exp((-4 * Math.LN2 * (x - c) ** 2) / (w * w));

export interface Lampara {
  /** longitud de onda del pico (nm) */
  pico: number;
  /** anchura a media altura (nm) */
  fwhm: number;
  nombre: string;
  /** color de la pastilla y de los fotones (el mismo del panel) */
  hex: string;
}
/** Las cinco lámparas del banco (mismo flujo de fotones). El blanco es un LED cálido: diodo azul + fósforo. */
export const LAMPARA: Record<ColorLuzB4, Lampara> = {
  rojo: { pico: 640, fwhm: 20, nombre: 'Rojo 640 nm', hex: '#e5503f' },
  amarillo: { pico: 590, fwhm: 15, nombre: 'Ámbar 590 nm', hex: '#f0b02e' },
  verde: { pico: 530, fwhm: 30, nombre: 'Verde 530 nm', hex: '#49b565' },
  azul: { pico: 450, fwhm: 20, nombre: 'Azul 450 nm', hex: '#4673d6' },
  blanco: { pico: 600, fwhm: 120, nombre: 'Blanco cálido', hex: '#fff1d6' },
};
/** Fracción de fotones del diodo azul en el LED blanco (el resto, del fósforo). */
export const FRACCION_AZUL_BLANCO = 0.12;

/**
 * Espectro de emisión de la lámpara por fotón, normalizado a 1 en su máximo. El blanco
 * mezcla el diodo (450 nm, 20 nm) y el fósforo (600 nm, 120 nm) en fracción de fotones.
 */
export function emisionLED(color: ColorLuzB4, lambdaNm: number): number {
  if (color === 'blanco') {
    const f = FRACCION_AZUL_BLANCO;
    const s = (f * gauss(lambdaNm, 450, 20)) / 20 + ((1 - f) * gauss(lambdaNm, 600, 120)) / 120;
    return s / (f / 20); // el diodo azul es el pico más alto
  }
  const l = LAMPARA[color];
  return gauss(lambdaNm, l.pico, l.fwhm);
}

/** Rejilla espectral de las integrales (nm). */
export const LAMBDA_MIN = 380, LAMBDA_MAX = 760, PASO_LAMBDA = 0.5;

/** Promedio de f(λ) pesado con el espectro de fotones de la lámpara. */
export function promedioLED(color: ColorLuzB4, f: (l: number) => number): number {
  let s = 0, sf = 0;
  for (let l = LAMBDA_MIN; l <= LAMBDA_MAX; l += PASO_LAMBDA) { const w = emisionLED(color, l); s += w; sf += w * f(l); }
  return sf / s;
}

/**
 * Longitud de onda de un fotón de la lámpara a partir de un número uniforme u ∈ [0, 1)
 * (inversa de la distribución acumulada, tabulada una vez por color).
 */
const cdfCache = new Map<ColorLuzB4, { l: Float64Array; F: Float64Array }>();
export function muestrearLambda(color: ColorLuzB4, u: number): number {
  let t = cdfCache.get(color);
  if (!t) {
    const n = Math.round((LAMBDA_MAX - LAMBDA_MIN) / PASO_LAMBDA) + 1;
    const l = new Float64Array(n), F = new Float64Array(n);
    let acc = 0;
    for (let i = 0; i < n; i++) { l[i] = LAMBDA_MIN + i * PASO_LAMBDA; acc += emisionLED(color, l[i]); F[i] = acc; }
    for (let i = 0; i < n; i++) F[i] /= acc;
    t = { l, F };
    cdfCache.set(color, t);
  }
  const { l, F } = t;
  let lo = 0, hi = F.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (F[m] < u) lo = m; else hi = m; }
  return l[hi];
}

// ───────────────────────────── pigmentos ─────────────────────────────

export type Pigmento = 'clorofilaA' | 'clorofilaB' | 'carotenoides';
/** Bandas [centro nm, anchura nm, altura relativa]. Máximos: Chl a 429/661, Chl b 453/642 (éter dietílico), β-caroteno 426/450/478 (hexano). */
const BANDAS: Record<Pigmento, [number, number, number][]> = {
  clorofilaA: [[430.5, 26, 1.2], [410, 22, 0.42], [661, 17, 1.0], [614, 20, 0.14], [578, 24, 0.08], [533, 30, 0.03]],
  clorofilaB: [[453, 24, 2.7], [430, 20, 0.7], [642, 16, 1.0], [595, 22, 0.13], [550, 26, 0.05]],
  carotenoides: [[425, 20, 0.7], [450, 22, 1.0], [478, 24, 0.86]],
};
const MAX_PIGMENTO: Record<Pigmento, number> = { clorofilaA: 0, clorofilaB: 0, carotenoides: 0 };
/** Absorbancia relativa del pigmento (1 en su máximo). */
export function absorcionPigmento(p: Pigmento, lambdaNm: number): number {
  const crudo = (l: number) => BANDAS[p].reduce((s, [c, w, h]) => s + h * gauss(l, c, w), 0);
  if (!MAX_PIGMENTO[p]) {
    // máximo: barrido grueso y refinado fino alrededor
    let m = 0, lm = LAMBDA_MIN;
    for (let l = LAMBDA_MIN; l <= LAMBDA_MAX; l += 0.25) { const y = crudo(l); if (y > m) { m = y; lm = l; } }
    for (let l = lm - 0.3; l <= lm + 0.3; l += 0.0005) m = Math.max(m, crudo(l));
    MAX_PIGMENTO[p] = m;
  }
  return crudo(lambdaNm) / MAX_PIGMENTO[p];
}
export const COLOR_PIGMENTO: Record<Pigmento, string> = { clorofilaA: '#34d399', clorofilaB: '#bef264', carotenoides: '#fb923c' };
export const NOMBRE_PIGMENTO: Record<Pigmento, string> = { clorofilaA: 'Clorofila a', clorofilaB: 'Clorofila b', carotenoides: 'Carotenoides' };

// ───────────────────────────── espectro de acción y absorptancia de la hoja ─────────────────────────────

const L_TABLA = [400, 425, 450, 475, 500, 525, 550, 575, 600, 625, 650, 675, 700];
/** Rendimiento cuántico relativo por fotón INCIDENTE: media de McCree (1972), digitalizada y redondeada a 0,01. */
const MCCREE = [0.52, 0.71, 0.76, 0.70, 0.65, 0.68, 0.75, 0.84, 0.93, 1.0, 0.98, 0.93, 0.48];
/** Absorptancia de una hoja verde típica (McCree 1972, media), redondeada a 0,01. */
const ABSORPTANCIA = [0.91, 0.92, 0.92, 0.91, 0.88, 0.80, 0.75, 0.80, 0.86, 0.89, 0.90, 0.90, 0.62];
function tabla(t: number[], l: number): number {
  if (l <= L_TABLA[0]) return t[0];
  if (l >= L_TABLA[L_TABLA.length - 1]) return t[t.length - 1];
  const i = Math.min(L_TABLA.length - 2, Math.floor((l - L_TABLA[0]) / 25));
  return t[i] + ((t[i + 1] - t[i]) * (l - L_TABLA[i])) / 25;
}
/** Espectro de acción relativo (McCree 1972) a λ (nm). */
export const accionMcCree = (lambdaNm: number) => tabla(MCCREE, lambdaNm);
/** Fracción de los fotones incidentes que absorbe la hoja a λ (nm). */
export const absorptanciaHoja = (lambdaNm: number) => tabla(ABSORPTANCIA, lambdaNm);
/** Valores de las tablas (para dibujarlas tal cual en el dock). */
export const TABLA_ESPECTRAL = { lambdas: L_TABLA, mccree: MCCREE, absorptancia: ABSORPTANCIA } as const;

/** Absorptancia media de la hoja con la luz de la lámpara. */
const absCache = new Map<ColorLuzB4, number>();
export function absorptanciaLED(color: ColorLuzB4): number {
  let a = absCache.get(color);
  if (a === undefined) { a = promedioLED(color, absorptanciaHoja); absCache.set(color, a); }
  return a;
}
/** Eficiencia por fotón incidente de la lámpara: la del dominio (el juez), η(rojo) = 1. */
export const eficiencia = (color: ColorLuzB4) => EFICIENCIA_ESPECTRAL_B4[color];

/**
 * Rendimiento cuántico máximo por fotón ABSORBIDO con luz roja: 0,106 O₂ por fotón
 * (Björkman y Demmig, 1987; 9,4 fotones por O₂ frente al mínimo teórico de 8).
 */
export const RENDIMIENTO_CUANTICO_ROJO = 0.106;
/** Rendimiento cuántico por fotón absorbido de cada lámpara: η/A escalado al del rojo. */
export function rendimientoAbsorbido(color: ColorLuzB4): number {
  const k = (c: ColorLuzB4) => eficiencia(c) / absorptanciaLED(c);
  return (RENDIMIENTO_CUANTICO_ROJO * k(color)) / k('rojo');
}
/** Fotones que el esquema Z gasta por O₂: 2 por electrón × 4 electrones. */
export const FOTONES_POR_O2 = 8;

// ───────────────────────────── condiciones: CO₂ y temperatura ─────────────────────────────

/** Concentraciones de NaHCO₃ que ofrece el lab (% masa/volumen). */
export const NAHCO3_OPCIONES = [0, 0.02, 0.05, 0.1] as const;
export type NaHCO3 = (typeof NAHCO3_OPCIONES)[number];
/** Condiciones del reto: las de `tasaNetaB4`. */
export const REFERENCIA = { T: 25, nahco3: 0.1 as NaHCO3 } as const;
export const M_NAHCO3 = 84.007;     // g/mol
/** CID del agua sin bicarbonato añadido (agua de grifo blanda), mmol/L. */
export const CID_BASE = 0.5;
/** Constante de semisaturación aparente de la ramita para el CID, mmol/L (incluye la capa límite). */
export const K_CID = 2.0;
/** CID (mmol/L) con un % de NaHCO₃: 0,1 % = 1 g/L = 11,9 mmol/L. */
export const cid = (nahco3: number) => CID_BASE + ((nahco3 * 10) / M_NAHCO3) * 1000;
/** Factor de CO₂ sobre Pmax (Michaelis–Menten), 1 en la referencia. */
export function factorCO2(nahco3: number): number {
  const mm = (c: number) => c / (K_CID + c);
  return mm(cid(nahco3)) / mm(cid(REFERENCIA.nahco3));
}
/** Óptimo y anchura de Pmax(T) = Pmax(Topt)·exp(−((T − Topt)/Ω)²) (June, Evans y Farquhar, 2004). */
export const T_OPT = 25, OMEGA_T = 13;
export const factorTemperatura = (T: number) => Math.exp(-(((T - T_OPT) / OMEGA_T) ** 2));
/** Temperaturas del baño termostático (°C, de 5 en 5). */
export const TEMPERATURAS = [5, 10, 15, 20, 25, 30, 35, 40] as const;
/** Respiración: R(T) = R₂₅·Q₁₀^((T − 25)/10), Q₁₀ = 2. */
export const Q10_RESPIRACION = 2;
export const factorRespiracion = (T: number) => Q10_RESPIRACION ** ((T - 25) / 10);

export interface Condiciones {
  color: ColorLuzB4;
  /** distancia lámpara–ramita, cm */
  distancia: number;
  /** % de NaHCO₃ */
  nahco3: number;
  /** °C */
  T: number;
}
export const esReferencia = (c: Pick<Condiciones, 'nahco3' | 'T'>) => c.nahco3 === REFERENCIA.nahco3 && c.T === REFERENCIA.T;

/** Pmax (mL O₂/min) y R (mL O₂/min) en unas condiciones. */
export const pmax = (c: Pick<Condiciones, 'nahco3' | 'T'>) => PMAX_B4 * factorCO2(c.nahco3) * factorTemperatura(c.T);
export const respiracion = (T: number) => RESPIRACION_B4 * factorRespiracion(T);
/** Ik = Pmax/(φ·η): irradiancia a la que la recta inicial alcanza Pmax (µmol·m⁻²·s⁻¹). */
export const irradianciaIk = (c: Pick<Condiciones, 'color' | 'nahco3' | 'T'>) => pmax(c) / (PHI_B4 * eficiencia(c.color));

/** Fotosíntesis BRUTA (mL O₂/min) a la irradiancia I. */
export function brutaI(c: Pick<Condiciones, 'color' | 'nahco3' | 'T'>, I: number): number {
  const P = pmax(c);
  if (!(P > 0) || !(I > 0)) return 0;
  return P * (1 - Math.exp(-I / irradianciaIk(c)));
}
/** Tasa NETA (mL O₂/min) a la irradiancia I: P(I) = Pmax·(1 − e^(−I/Ik)) − R. */
export const netaI = (c: Pick<Condiciones, 'color' | 'nahco3' | 'T'>, I: number) => brutaI(c, I) - respiracion(c.T);
/** Tasa neta con la lámpara a `distancia` cm. En la referencia es exactamente `tasaNetaB4`. */
export const tasaNeta = (c: Condiciones) => netaI(c, ppfdB4(c.distancia));
export const tasaBruta = (c: Condiciones) => brutaI(c, ppfdB4(c.distancia));
/** O₂ recogido en un ensayo de 10 min (bajo el punto de compensación no hay burbujas). */
export const o2Ensayo = (c: Condiciones) => Math.max(0, tasaNeta(c) * DURACION_B4);

/** Punto de compensación luminoso (µmol·m⁻²·s⁻¹): la bruta iguala a la respiración. Infinity si nunca. */
export function compensacion(c: Pick<Condiciones, 'color' | 'nahco3' | 'T'>): number {
  const P = pmax(c), R = respiracion(c.T);
  if (!(P > R)) return Infinity;
  return -irradianciaIk(c) * Math.log(1 - R / P);
}
/** Irradiancia de saturación: la bruta llega al 95 % de Pmax (I₉₅ = Ik·ln 20 ≈ 3·Ik). */
export const saturacion95 = (c: Pick<Condiciones, 'color' | 'nahco3' | 'T'>) => irradianciaIk(c) * Math.log(20);
/** Distancia (cm) a la que la lámpara da la irradiancia I. */
export const distanciaParaI = (I: number) => 10 * Math.sqrt(PPFD_10CM_B4 / I);

/**
 * Factor de saturación s = P_bruta / (φ·η·I): 1 con poca luz (todo fotón útil cuenta),
 * Ik/I con mucha (sobran fotones). Es la fracción de la recta inicial que se cumple.
 */
export function factorSaturacion(c: Pick<Condiciones, 'color' | 'nahco3' | 'T'>, I: number): number {
  if (!(I > 0)) return 1;
  const lin = PHI_B4 * eficiencia(c.color) * I;
  return lin > 0 ? brutaI(c, I) / lin : 1;
}

// ───────────────────────────── estequiometría ─────────────────────────────

/** Fórmulas de la ecuación global: 6 CO₂ + 6 H₂O → C₆H₁₂O₆ + 6 O₂ (átomos C, H, O). */
export const ECUACION_GLOBAL = {
  reactivos: [{ n: 6, C: 1, H: 0, O: 2 }, { n: 6, C: 0, H: 2, O: 1 }],
  productos: [{ n: 1, C: 6, H: 12, O: 6 }, { n: 6, C: 0, H: 0, O: 2 }],
} as const;
export const M_GLUCOSA = 180.156; // g/mol
/** Volumen molar de un gas ideal a T (°C) y 1 atm, en L/mol (= mL/mmol): V = RT/p. */
export const volumenMolar = (T: number) => ((R_GAS * (T + 273.15)) / P_ATM) * 1000;
/** µmol de gas en V mL a T (°C) y 1 atm (n = pV/RT). */
export const micromoles = (VmL: number, T: number) => ((P_ATM * VmL * 1e-6) / (R_GAS * (T + 273.15))) * 1e6;

export interface Balance {
  /** µmol de O₂ liberados (netos) */
  o2: number;
  /** µmol de CO₂ fijados en el ciclo de Calvin (cociente fotosintético 1) */
  co2: number;
  /** µmol de H₂O oxidadas en el fotosistema II (2 por O₂) */
  h2o: number;
  /** mg de glucosa equivalentes (1 por 6 CO₂) */
  glucosaMg: number;
  /** µmol de fotones absorbidos mínimos (8 por O₂) */
  fotones: number;
}
/** Balance de un volumen de O₂ recogido (mL) a la temperatura del baño. */
export function balanceO2(VmL: number, T: number): Balance {
  const o2 = micromoles(Math.max(0, VmL), T);
  return { o2, co2: o2, h2o: 2 * o2, glucosaMg: (o2 / 6) * M_GLUCOSA / 1000, fotones: FOTONES_POR_O2 * o2 };
}

// ───────────────────────────── esquema Z y ATP sintasa ─────────────────────────────

/** Por electrón que recorre la cadena lineal. */
export const FOTONES_POR_E = 2;
export const E_POR_O2 = 4;
/** H⁺ al lumen por e⁻: 1 del agua (PSII) + 2 del ciclo Q (citocromo b₆f). */
export const H_LUMEN_POR_E = 3;
/** Subunidades c del anillo de la ATP sintasa del cloroplasto (espinaca: Seelert et al., 2000). */
export const SUBUNIDADES_C = 14;
/** ATP por vuelta completa (tres sitios catalíticos β). */
export const ATP_POR_VUELTA = 3;
export const H_POR_ATP = SUBUNIDADES_C / ATP_POR_VUELTA;
/** Por O₂ liberado: 12 H⁺ al lumen, 18/7 ATP y 2 NADPH. */
export const H_POR_O2 = H_LUMEN_POR_E * E_POR_O2;
export const ATP_POR_O2 = H_POR_O2 / H_POR_ATP;
export const NADPH_POR_O2 = E_POR_O2 / 2;
/** Ciclo de Calvin: por CO₂ fijado, 3 ATP y 2 NADPH; 1 G3P sale por cada 3 CO₂. */
export const CALVIN = { atpPorCO2: 3, nadphPorCO2: 2, co2PorG3P: 3 } as const;

/**
 * Potenciales medios de reducción (V, pH 7) de los portadores del esquema Z (Blankenship,
 * 2014). Los dos saltos «hacia arriba» son la energía del fotón E₀₀ de P680 y P700.
 */
export interface Portador { id: string; nombre: string; E: number; foto?: boolean }
export const E00_P680 = energiaFotonEV(680);
export const E00_P700 = energiaFotonEV(700);
export const ESQUEMA_Z: Portador[] = [
  { id: 'h2o', nombre: 'H₂O/O₂', E: 0.82 },
  { id: 'p680', nombre: 'P680', E: 1.25 },
  { id: 'p680x', nombre: 'P680*', E: 1.25 - E00_P680, foto: true },
  { id: 'feo', nombre: 'Feo', E: -0.5 },
  { id: 'qa', nombre: 'QA', E: -0.08 },
  { id: 'pq', nombre: 'PQ', E: 0.08 },
  { id: 'b6f', nombre: 'b₆f', E: 0.32 },
  { id: 'pc', nombre: 'PC', E: 0.37 },
  { id: 'p700', nombre: 'P700', E: 0.45 },
  { id: 'p700x', nombre: 'P700*', E: 0.45 - E00_P700, foto: true },
  { id: 'a0', nombre: 'A₀', E: -1.05 },
  { id: 'fx', nombre: 'Fₓ', E: -0.73 },
  { id: 'fd', nombre: 'Fd', E: -0.42 },
  { id: 'nadp', nombre: 'NADP⁺', E: -0.32 },
];

/** pH del estroma en la luz y del lumen en oscuridad; caída máxima del lumen (Kramer et al., 1999). */
export const PH_ESTROMA = 8.0;
export const PH_LUMEN_OSCURO = 7.5;
export const DELTA_PH_LUMEN = 1.7;
/**
 * pH del lumen con conductancia constante de la ATP sintasa: el flujo de H⁺ es
 * proporcional a la fuerza protónica, así que el pH cae en línea con el flujo de
 * electrones (J/Jmax = bruta/Pmax de la referencia).
 */
export const phLumen = (bruta: number) => PH_LUMEN_OSCURO - DELTA_PH_LUMEN * Math.min(1, Math.max(0, bruta / PMAX_B4));

// ───────────────────────────── burbujas y escala visual ─────────────────────────────

/** Volumen de una burbuja de O₂ de Elodea (Ø ≈ 2,7 mm), mL. */
export const V_BURBUJA_ML = 0.01;
/** Burbujas por minuto con una tasa neta (mL/min). */
export const burbujasPorMin = (neta: number) => Math.max(0, neta) / V_BURBUJA_ML;

/** Escena del cloroplasto: fotones dibujados por segundo por cada µmol·m⁻²·s⁻¹. */
export const K_FOTONES = 0.4;
/**
 * Turnover del PSII con la bruta máxima de la referencia: 200 e⁻/s (50 O₂/s) por PSII,
 * mostrado a cámara lenta ×1/40 en la vista de la membrana.
 */
export const TURNOVER_PSII_MAX = 200;
export const CAMARA_LENTA_MEMBRANA = 40;

/** Tasas que la escena dibuja (por segundo de pantalla), todas del mismo estado del modelo. */
export interface TasasVisuales {
  /** fotones que llegan al cloroplasto */
  fotones: number;
  /** probabilidad de que la hoja absorba un fotón de la lámpara */
  pAbsorber: number;
  /** de los absorbidos, probabilidad de que muevan un electrón (el resto se disipa: calor y fluorescencia) */
  pUsar: number;
  /** O₂ bruto liberado por los grana */
  o2: number;
  /** O₂ que respira la mitocondria (y CO₂ que suelta) */
  resp: number;
  /** CO₂ fijado por el ciclo de Calvin (= O₂ bruto: cociente 1) */
  co2: number;
  /** ATP y NADPH que el estroma recibe de los tilacoides */
  atp: number;
  nadph: number;
  /** G3P que sale del ciclo */
  g3p: number;
  /** membrana (vista ampliada): electrones por segundo de pantalla en un PSII */
  eMembrana: number;
}
export function tasasVisuales(c: Condiciones): TasasVisuales {
  const I = ppfdB4(c.distancia);
  const fotones = K_FOTONES * I;
  const pAbsorber = absorptanciaLED(c.color);
  const s = factorSaturacion(c, I);
  const pUsar = Math.min(1, FOTONES_POR_O2 * rendimientoAbsorbido(c.color) * s);
  const o2 = (fotones * pAbsorber * pUsar) / FOTONES_POR_O2;
  const bruta = brutaI(c, I);
  const resp = respiracion(c.T) * escalaParticulas();
  return {
    fotones, pAbsorber, pUsar, o2, resp, co2: o2, atp: CALVIN.atpPorCO2 * o2, nadph: CALVIN.nadphPorCO2 * o2, g3p: o2 / CALVIN.co2PorG3P,
    eMembrana: (TURNOVER_PSII_MAX * (bruta / PMAX_B4)) / CAMARA_LENTA_MEMBRANA,
  };
}
/**
 * O₂ dibujados por segundo por cada mL/min de la ramita. Es constante (no depende de la luz
 * ni del color): o2 = K·I·A·Φ_abs·s y bruta = φ·η·I·s, con Φ_abs = Φ_rojo·(η/A)/(η_rojo/A_rojo).
 */
export const escalaParticulas = () => (K_FOTONES * RENDIMIENTO_CUANTICO_ROJO * absorptanciaLED('rojo')) / (PHI_B4 * eficiencia('rojo'));

/** Color sRGB aproximado de la luz de longitud de onda λ (nm), para los fotones y la barra del espectro. */
export function colorLambda(l: number): [number, number, number] {
  let r = 0, g = 0, b = 0;
  if (l < 440) { r = -(l - 440) / 60; b = 1; }
  else if (l < 490) { g = (l - 440) / 50; b = 1; }
  else if (l < 510) { g = 1; b = -(l - 510) / 20; }
  else if (l < 580) { r = (l - 510) / 70; g = 1; }
  else if (l < 645) { r = 1; g = -(l - 645) / 65; }
  else { r = 1; }
  // caída de intensidad en los extremos de la visión
  const f = l < 420 ? 0.3 + (0.7 * (l - 380)) / 40 : l > 700 ? 0.3 + (0.7 * (780 - l)) / 80 : 1;
  const k = (x: number) => Math.pow(Math.max(0, x * f), 0.8);
  return [k(r), k(g), k(b)];
}

/** Comprobación de coherencia con el juez: en la referencia, esta tasa ES la del dominio. */
export const tasaDominio = (color: ColorLuzB4, distancia: number) => tasaNetaB4(color, distancia);
