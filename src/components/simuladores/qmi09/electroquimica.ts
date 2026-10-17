/**
 * qmi09/electroquimica.ts — la física de la celda galvánica (módulo PURO, sin three).
 *
 * Todo lo que se mueve, cambia de tamaño o se colorea en la escena y en el dock sale
 * de aquí, y aquí lo prueba `src/__tests__/qmi09-galvanica.test.ts`.
 *
 *  · Potencial de cada semicelda (Nernst):  E = E°(T) + (RT/zF)·ln[Mᶻ⁺]
 *    E°(T) = E°(25 °C) + (dE°/dT)·(T − 298,15), con el coeficiente isotérmico que sale
 *    de las entropías molares estándar (NBS): dE°/dT = [S°(M) − S°(Mᶻ⁺) − (z/2)·S°(H₂)]/(zF).
 *    Lo que marca el voltímetro en circuito abierto es E(der) − E(izq): la punta COM
 *    (negra) va al vaso izquierdo y la V (roja) al derecho, como en el reto.
 *  · Celda completa: E = E° − (RT/nF)·ln Q, n = mcm(z_ánodo, z_cátodo),
 *    Q = [ánodo]^(n/z_a) / [cátodo]^(n/z_c); K = exp(nFE°/RT); ΔG = −nFE.
 *  · Circuito: la fem empuja la corriente por la resistencia interna (puente salino
 *    de KNO₃ más las dos disoluciones) y la externa (carga ∥ voltímetro de 10 MΩ):
 *    I = E/(R_ext + R_int); el voltímetro lee la tensión en bornes V = I·R_ext.
 *  · Faraday: la carga q que pasa disuelve q·M/(zF) gramos de ánodo y deposita
 *    q·M/(zF) del cátodo; las concentraciones cambian en ±q/(zF·V).
 *  · La celda se agota: se integra con Euler implícito sobre los moles del catión del
 *    cátodo (en escala logarítmica, para poder llegar a 10⁻⁴⁰ M), así que E → 0 y
 *    Q → K sin oscilar ni pasarse, con el paso que sea.
 */
import { E0_REDUCCION } from '@/domain/quimica';
import { defVaso } from '../_kit/perfiles';

// ───────────────────────────── constantes ─────────────────────────────

/** C/mol — CODATA 2018 (exacta en el SI de 2019). */
export const FARADAY = 96485.33212;
/** J/(mol·K) — CODATA 2018. */
export const R_GAS = 8.314462618;
export const T_REF = 298.15;
/** C — carga elemental (exacta). */
export const CARGA_E = 1.602176634e-19;
/** J/(mol·K) — S° del H₂(g), NBS (Wagman et al., 1982). */
export const S0_H2 = 130.684;

export type IdMetal = 'Zn' | 'Cu' | 'Ag' | 'Mg';
export const METALES_Q9: IdMetal[] = ['Zn', 'Cu', 'Ag', 'Mg'];

export interface Metal {
  id: IdMetal;
  nombre: string;
  /** carga del catión */
  z: number;
  /** g/mol (IUPAC 2021) */
  M: number;
  /** g/cm³ a 20 °C (CRC) */
  rho: number;
  /** V a 25 °C — la MISMA tabla que usan el validador y el voltímetro del reto */
  E0: number;
  /** S° del metal y del catión acuoso, J/(mol·K) (NBS, Wagman et al., 1982) */
  S0Metal: number;
  S0Ion: number;
  ion: string;
  sal: string;
  contraIon: string;
  /** absortividad molar EFECTIVA por canal (R, G, B) en M⁻¹·cm⁻¹; 0 = incolora */
  epsRGB: [number, number, number];
}

/**
 * El [Cu(H₂O)₆]²⁺ absorbe en una banda ancha centrada en ~810 nm (ε ≈ 12 M⁻¹cm⁻¹):
 * quita casi todo el rojo, algo del verde y apenas el azul. Los tres valores son la
 * media de ese espectro sobre cada primario sRGB (aprox.); los demás cationes son
 * incoloros en el visible.
 */
export const METAL: Record<IdMetal, Metal> = {
  Zn: { id: 'Zn', nombre: 'zinc', z: 2, M: 65.38, rho: 7.134, E0: E0_REDUCCION.Zn, S0Metal: 41.63, S0Ion: -112.1, ion: 'Zn²⁺', sal: 'ZnSO₄', contraIon: 'SO₄²⁻', epsRGB: [0, 0, 0] },
  Cu: { id: 'Cu', nombre: 'cobre', z: 2, M: 63.546, rho: 8.96, E0: E0_REDUCCION.Cu, S0Metal: 33.15, S0Ion: -99.6, ion: 'Cu²⁺', sal: 'CuSO₄', contraIon: 'SO₄²⁻', epsRGB: [3.0, 0.22, 0.03] },
  Ag: { id: 'Ag', nombre: 'plata', z: 1, M: 107.8682, rho: 10.49, E0: E0_REDUCCION.Ag, S0Metal: 42.55, S0Ion: 72.68, ion: 'Ag⁺', sal: 'AgNO₃', contraIon: 'NO₃⁻', epsRGB: [0, 0, 0] },
  Mg: { id: 'Mg', nombre: 'magnesio', z: 2, M: 24.305, rho: 1.738, E0: E0_REDUCCION.Mg, S0Metal: 32.68, S0Ion: -138.1, ion: 'Mg²⁺', sal: 'MgSO₄', contraIon: 'SO₄²⁻', epsRGB: [0, 0, 0] },
};

export const esMetal = (m: string | null | undefined): m is IdMetal => !!m && m in METAL;

// ───────────────────────────── el banco (medidas reales) ─────────────────────────────

/**
 * Medidas del montaje. Escala del kit: 1 u = 10 cm. La escena se construye con ESTOS
 * números, así que la resistencia del puente sale del tubo que se dibuja.
 */
export const BANCO = (() => {
  const vaso = defVaso(250);
  const volumenML = 200;
  const ySuperficie = vaso.alturaParaVolumen(volumenML);       // u
  const yPunta = vaso.y0 + 0.05;                                 // la varilla queda a 5 mm del fondo
  // puente salino en U: patas verticales unidas por un travesaño con esquinas de radio rEsq
  const xVaso = 0.9;                       // centro de cada vaso: ±xVaso
  const xPata = xVaso - 0.15;              // patas del puente, hacia dentro
  const yPata = ySuperficie - 0.25;        // sumergidas 2,5 cm
  const yTecho = 1.12;                     // eje del travesaño
  const rEsq = 0.16;
  const largoPuenteU = 2 * (yTecho - rEsq - yPata) + Math.PI * rEsq + (2 * xPata - 2 * rEsq);
  return {
    vaso,
    volumenL: volumenML / 1000,
    volumenML,
    ySuperficie,
    yPunta,
    xVaso,
    /** varilla de electrodo: Ø 10 mm, hacia fuera del centro del vaso */
    xVarilla: xVaso + 0.13,
    rVarillaCm: 0.5,
    /** largo sumergido de la varilla, cm */
    hSumergidaCm: (ySuperficie - yPunta) * 10,
    xPata, yPata, yTecho, rEsq,
    /** puente: tubo de vidrio de Ø interior 10 mm */
    largoPuenteCm: largoPuenteU * 10,
    diamPuenteCm: 1.0,
  };
})();

/** KNO₃ 1 M en agar al 2 %: conductividad ≈ 0,10 S/cm a 25 °C, +2 %/K (aprox.). */
export const KAPPA_PUENTE_25 = 0.10;
export const ALFA_KAPPA = 0.02;
/** Las dos disoluciones, del electrodo a la punta del puente (estimado, se toma constante). */
export const R_DISOLUCIONES = 30;
/** Voltímetro analógico de alta impedancia. */
export const R_VOLTIMETRO = 1e7;
/** Número de transporte del K⁺ en KNO₃ (≈ 0,508 a 0,1 M, 25 °C); el NO₃⁻ lleva el resto. */
export const T_POTASIO = 0.508;
/** Electrones libres del cobre (m⁻³) y sección de los cables de prueba (m²). */
export const N_E_COBRE = 8.49e28;
export const SECCION_CABLE = 0.5e-6;
/** Concentración del KNO₃ del puente (mol/m³). */
export const C_PUENTE = 1000;

export type Carga = 'abierta' | 10 | 100 | 1000;
export const CARGAS: Carga[] = ['abierta', 1000, 100, 10];

// ───────────────────────────── semiceldas ─────────────────────────────

/** Coeficiente isotérmico dE°/dT (V/K) de la semicelda Mᶻ⁺/M frente al electrodo de hidrógeno. */
export function coefTemperatura(m: IdMetal): number {
  const d = METAL[m];
  return (d.S0Metal - d.S0Ion - (d.z / 2) * S0_H2) / (d.z * FARADAY);
}

/** E° de reducción a la temperatura T (K). */
export function E0aT(m: IdMetal, T: number): number {
  return METAL[m].E0 + coefTemperatura(m) * (T - T_REF);
}

/** Potencial de reducción de Mᶻ⁺/M con [Mᶻ⁺] = c (M) a T (K): Nernst de la semicelda. */
export function potencialReduccion(m: IdMetal, c: number, T: number): number {
  const d = METAL[m];
  return E0aT(m, T) + ((R_GAS * T) / (d.z * FARADAY)) * Math.log(Math.max(c, 1e-300));
}

/** Mínimo común múltiplo de las cargas: electrones de la reacción ajustada. */
export function electronesReaccion(za: number, zc: number): number {
  const mcd = (a: number, b: number): number => (b === 0 ? a : mcd(b, a % b));
  return (za * zc) / mcd(za, zc);
}

/** E°celda, n, K y ΔG° para un ánodo y un cátodo dados (a T). */
export function datosReaccion(anodo: IdMetal, catodo: IdMetal, T = T_REF) {
  const za = METAL[anodo].z, zc = METAL[catodo].z;
  const n = electronesReaccion(za, zc);
  const E0 = E0aT(catodo, T) - E0aT(anodo, T);
  const lnK = (n * FARADAY * E0) / (R_GAS * T);
  return {
    n, E0, lnK, log10K: lnK / Math.LN10,
    /** ΔG° en J por mol de reacción (tal como se ajusta con n electrones) */
    dG0: -n * FARADAY * E0,
    /** coeficientes de la reacción ajustada: νa·A + νc·Cᶻ⁺ → νa·Aᶻ⁺ + νc·C */
    nuA: n / za, nuC: n / zc,
  };
}

/** ln Q de la reacción espontánea con las concentraciones dadas. */
export function lnCociente(anodo: IdMetal, catodo: IdMetal, cA: number, cC: number): number {
  const { nuA, nuC } = datosReaccion(anodo, catodo);
  return nuA * Math.log(Math.max(cA, 1e-300)) - nuC * Math.log(Math.max(cC, 1e-300));
}

/** Nernst de la celda completa: E = E° − (RT/nF)·ln Q. */
export function nernstCelda(anodo: IdMetal, catodo: IdMetal, cA: number, cC: number, T: number): number {
  const r = datosReaccion(anodo, catodo, T);
  return r.E0 - ((R_GAS * T) / (r.n * FARADAY)) * lnCociente(anodo, catodo, cA, cC);
}

/** Masa (g) que deposita o disuelve una carga q (C): m = q·M/(zF). */
export function masaFaraday(m: IdMetal, q: number): number {
  return (q * METAL[m].M) / (METAL[m].z * FARADAY);
}

/** Transmitancia por canal de una disolución (Beer–Lambert): T = 10^(−ε·c·l), l en cm. */
export function transmitancia(m: IdMetal, c: number, lCm: number): [number, number, number] {
  const e = METAL[m].epsRGB;
  return [0, 1, 2].map((i) => Math.pow(10, -e[i] * Math.max(0, c) * lCm)) as [number, number, number];
}

// ───────────────────────────── circuito ─────────────────────────────

/** Resistencia del puente salino: R = ℓ/(κ·A), con κ(T) = κ₂₅·(1 + α·(T − 25 °C)). */
export function resistenciaPuente(T: number): number {
  const kappa = KAPPA_PUENTE_25 * (1 + ALFA_KAPPA * (T - T_REF));
  const area = (Math.PI * BANCO.diamPuenteCm * BANCO.diamPuenteCm) / 4;
  return BANCO.largoPuenteCm / (kappa * area);
}

export function resistenciaInterna(T: number): number {
  return resistenciaPuente(T) + R_DISOLUCIONES;
}

/** Resistencia externa: la carga en paralelo con el voltímetro (o sólo éste). */
export function resistenciaExterna(carga: Carga): number {
  return carga === 'abierta' ? R_VOLTIMETRO : (carga * R_VOLTIMETRO) / (carga + R_VOLTIMETRO);
}

/** Velocidad de deriva (m/s) de los electrones en el cable de cobre: v = I/(n·e·A). */
export function derivaElectrones(I: number): number {
  return I / (N_E_COBRE * CARGA_E * SECCION_CABLE);
}

/** Velocidad de deriva (m/s) de un ion del puente: v = t·I/(z·F·c·A). */
export function derivaPuente(I: number, t: number): number {
  const area = (Math.PI * (BANCO.diamPuenteCm / 100) ** 2) / 4;
  return (t * I) / (FARADAY * C_PUENTE * area);
}

// ───────────────────────────── electrodos ─────────────────────────────

/** Volumen sumergido inicial (cm³) de una varilla de electrodo. */
export const VOLUMEN_VARILLA_CM3 = Math.PI * BANCO.rVarillaCm ** 2 * BANCO.hSumergidaCm;

/**
 * Forma de la parte sumergida de la varilla con volumen V (cm³), suponiendo que se
 * disuelve o recubre por igual en toda su superficie mojada: la cara lateral y la
 * punta retroceden (o avanzan) la misma δ. Devuelve radio y largo en cm.
 */
export function formaVarilla(V: number): { r: number; h: number; delta: number } {
  const r0 = BANCO.rVarillaCm, h0 = BANCO.hSumergidaCm;
  const vol = (d: number) => Math.PI * (r0 + d) ** 2 * (h0 + d);
  const V0 = vol(0);
  if (!(V > 1e-9)) return { r: 0, h: 0, delta: -r0 };
  let lo: number, hi: number;
  if (V < V0) { lo = -r0; hi = 0; } else { lo = 0; hi = r0 * 4; }
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (vol(m) < V) lo = m; else hi = m;
  }
  const d = (lo + hi) / 2;
  return { r: r0 + d, h: h0 + d, delta: d };
}

// ───────────────────────────── estado y paso ─────────────────────────────

export interface Montaje {
  izq: IdMetal | null;
  der: IdMetal | null;
  puente: boolean;
  cables: boolean;
  carga: Carga;
  /** K */
  T: number;
}

export interface EstadoCelda {
  /** concentraciones iniciales con que se prepararon las disoluciones (M) */
  c0Izq: number;
  c0Der: number;
  /** moles del catión de cada vaso */
  nIzq: number;
  nDer: number;
  /** cm³ de metal sumergido de cada varilla */
  vIzq: number;
  vDer: number;
  /** C que han pasado por fuera: + cuando los electrones van de izq. a der. */
  q: number;
  /** s simulados */
  t: number;
  /** moles de K⁺ y de NO₃⁻ que el puente ha cedido a cada vaso */
  kIzq: number;
  kDer: number;
  nitIzq: number;
  nitDer: number;
}

export function estadoInicial(c0Izq = 1, c0Der = 1): EstadoCelda {
  const V = BANCO.volumenL;
  return {
    c0Izq, c0Der, nIzq: c0Izq * V, nDer: c0Der * V, vIzq: VOLUMEN_VARILLA_CM3, vDer: VOLUMEN_VARILLA_CM3,
    q: 0, t: 0, kIzq: 0, kDer: 0, nitIzq: 0, nitDer: 0,
  };
}

export interface Lectura {
  /** ¿hay circuito? (los dos electrodos, el puente y las puntas) */
  cerrado: boolean;
  cIzq: number;
  cDer: number;
  /** potenciales de reducción de cada semicelda (V) */
  eIzq: number;
  eDer: number;
  /** fem con signo de voltímetro: E(der) − E(izq) */
  fem: number;
  /** lo que marca el voltímetro (tensión en bornes, con signo) */
  V: number;
  /** A — electrones de izq. a der. por fuera (con signo) */
  I: number;
  Rint: number;
  Rext: number;
  /** ánodo/cátodo físicos (null si no hay celda) */
  anodo: 'izq' | 'der' | null;
  /** n, E°, ln Q, ln K y ΔG (J/mol de reacción) de la reacción espontánea */
  n: number;
  E0: number;
  lnQ: number;
  lnK: number;
  dG: number;
}

/** Todas las magnitudes del instante, desde el estado. */
export function leer(m: Montaje, e: EstadoCelda): Lectura {
  const V = BANCO.volumenL;
  const cIzq = e.nIzq / V, cDer = e.nDer / V;
  const hay = esMetal(m.izq) && esMetal(m.der);
  const eIzq = hay ? potencialReduccion(m.izq!, cIzq, m.T) : 0;
  const eDer = hay ? potencialReduccion(m.der!, cDer, m.T) : 0;
  const cerrado = hay && m.puente && m.cables && m.izq !== m.der;
  const Rint = resistenciaInterna(m.T), Rext = resistenciaExterna(m.carga);
  const fem = hay && m.izq !== m.der ? eDer - eIzq : 0;
  const I = cerrado ? fem / (Rext + Rint) : 0;
  const Vb = cerrado ? I * Rext : 0;
  let n = 0, E0 = 0, lnQ = 0, lnK = 0, anodo: Lectura['anodo'] = null;
  if (hay && m.izq !== m.der) {
    anodo = fem >= 0 ? 'izq' : 'der';
    const a = anodo === 'izq' ? m.izq! : m.der!, c = anodo === 'izq' ? m.der! : m.izq!;
    const r = datosReaccion(a, c, m.T);
    n = r.n; E0 = r.E0; lnK = r.lnK;
    lnQ = lnCociente(a, c, anodo === 'izq' ? cIzq : cDer, anodo === 'izq' ? cDer : cIzq);
  }
  return { cerrado, cIzq, cDer, eIzq, eDer, fem, V: Vb, I, Rint, Rext, anodo, n, E0, lnQ, lnK, dG: -n * FARADAY * Math.abs(fem) };
}

/**
 * Avanza `dt` segundos simulados con Euler IMPLÍCITO. La incógnita es x', los moles
 * del catión del cátodo al final del paso: (x − x') = dt·|I(x')|/(z_c·F). Como |I|
 * crece con x', la ecuación tiene una sola raíz entre el equilibrio (I = 0) y x, y se
 * busca por bisección en ln x'. Si el ánodo sumergido se acaba antes, el paso se corta
 * ahí (el circuito queda abierto por falta de electrodo).
 */
export function avanzar(m: Montaje, e: EstadoCelda, dt: number): EstadoCelda {
  if (!(dt > 0)) return e;
  const l = leer(m, e);
  if (!l.cerrado || !(Math.abs(l.fem) > 1e-15) || l.anodo === null) return { ...e, t: e.t + dt };
  const izqAnodo = l.anodo === 'izq';
  const A = (izqAnodo ? m.izq : m.der)!, C = (izqAnodo ? m.der : m.izq)!;
  const za = METAL[A].z, zc = METAL[C].z;
  const Vl = BANCO.volumenL;
  const x = izqAnodo ? e.nDer : e.nIzq;           // catión del cátodo
  const nA = izqAnodo ? e.nIzq : e.nDer;          // catión del ánodo
  const vA = izqAnodo ? e.vIzq : e.vDer;          // metal del ánodo (cm³)
  const nMetalA = (vA * METAL[A].rho) / METAL[A].M;
  const Rtot = l.Rint + l.Rext;
  const r = datosReaccion(A, C, m.T);
  const kT = (R_GAS * m.T) / FARADAY;
  // fem de la reacción espontánea si el catión del cátodo baja a xp (≥ 0 hasta el equilibrio)
  const fem = (xp: number) => {
    const cA = (nA + (zc / za) * (x - xp)) / Vl, cC = xp / Vl;
    return r.E0 + (kT / zc) * Math.log(Math.max(cC, 1e-300)) - (kT / za) * Math.log(Math.max(cA, 1e-300));
  };
  // equilibrio: fem(x_eq) = 0, en ln x
  let lo = Math.log(1e-300), hi = Math.log(x);
  if (fem(x) <= 0) return { ...e, t: e.t + dt };
  for (let i = 0; i < 90; i++) { const mid = (lo + hi) / 2; if (fem(Math.exp(mid)) > 0) hi = mid; else lo = mid; }
  const xEq = Math.exp(hi);
  // si el ánodo sumergido se agota antes del equilibrio, el límite es ése
  const xMetal = x - (za / zc) * nMetalA;
  const xMin = Math.max(xEq, xMetal);
  const g = (xp: number) => (x - xp) - (dt * Math.max(0, fem(xp))) / (Rtot * zc * FARADAY);
  let xn: number;
  if (g(xMin) <= 0) xn = xMin;
  else {
    let a = Math.log(Math.max(xMin, 1e-300)), b = Math.log(x);
    for (let i = 0; i < 90; i++) { const mid = (a + b) / 2; if (g(Math.exp(mid)) > 0) a = mid; else b = mid; }
    xn = Math.exp(b);
  }
  const dx = Math.max(0, x - xn);                 // mol de catión del cátodo reducidos
  const molE = zc * dx;                           // mol de e⁻
  const dq = FARADAY * molE;
  const dnA = molE / za;                          // mol de catión del ánodo formados
  const dvA = (dnA * METAL[A].M) / METAL[A].rho;  // cm³ de ánodo disueltos
  const dvC = (dx * METAL[C].M) / METAL[C].rho;   // cm³ de cátodo depositados
  const kPas = (T_POTASIO * molE), nitPas = ((1 - T_POTASIO) * molE);
  const s: EstadoCelda = { ...e, t: e.t + dt };
  if (izqAnodo) {
    s.nDer = xn; s.nIzq = nA + dnA; s.vIzq = Math.max(0, vA - dvA); s.vDer = e.vDer + dvC; s.q = e.q + dq;
    s.kDer = e.kDer + kPas; s.nitIzq = e.nitIzq + nitPas;
  } else {
    s.nIzq = xn; s.nDer = nA + dnA; s.vDer = Math.max(0, vA - dvA); s.vIzq = e.vIzq + dvC; s.q = e.q - dq;
    s.kIzq = e.kIzq + kPas; s.nitDer = e.nitDer + nitPas;
  }
  return s;
}

/** Carga máxima (C) que puede dar la celda: la del reactivo limitante. */
export function cargaMaxima(m: Montaje, e: EstadoCelda): number {
  const l = leer(m, e);
  if (l.anodo === null) return 0;
  const izqAnodo = l.anodo === 'izq';
  const A = (izqAnodo ? m.izq : m.der)!, C = (izqAnodo ? m.der : m.izq)!;
  const x = izqAnodo ? e.nDer : e.nIzq;
  const vA = izqAnodo ? e.vIzq : e.vDer;
  const porCation = METAL[C].z * FARADAY * x;
  const porMetal = METAL[A].z * FARADAY * ((vA * METAL[A].rho) / METAL[A].M);
  return Math.abs(e.q) + Math.min(porCation, porMetal);
}

/** Formatea una duración simulada (s) en la unidad más legible (coma decimal). */
export function duracion(s: number): string {
  const a = Math.abs(s);
  const f = (v: number, d: number) => v.toFixed(d).replace('.', ',');
  if (a < 120) return `${f(a, 0)} s`;
  if (a < 7200) return `${f(a / 60, 0)} min`;
  if (a < 172800) return `${f(a / 3600, 1)} h`;
  if (a < 3.15e7 * 2) return `${f(a / 86400, a < 864000 ? 1 : 0)} días`;
  return `${f(a / 3.156e7, 1)} años`;
}
