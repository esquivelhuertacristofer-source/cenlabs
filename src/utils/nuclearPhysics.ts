/**
 * nuclearPhysics.ts
 * Motor científico para cálculos de física nuclear a nivel licenciatura.
 * Fórmula sempiempírica de Weizsäcker, estabilidad, y clasificación de nuclídeos.
 */

// ─── ISOTÓPOS ESTABLES (Base de datos [Z, N]) ────────────────────────────────
export const STABLE_ISOTOPES: [number, number][] = [
  [1, 0], [1, 1],                   // H-1, H-2 (deuterio)
  [2, 1], [2, 2],                   // He-3, He-4
  [3, 3], [3, 4],                   // Li-6, Li-7
  [4, 5],                           // Be-9 (único estable)
  [5, 5], [5, 6],                   // B-10, B-11
  [6, 6], [6, 7],                   // C-12, C-13 (C-14 es radiactivo)
  [7, 7], [7, 8],                   // N-14, N-15
  [8, 8], [8, 9], [8, 10],         // O-16, O-17, O-18
  [9, 10],                          // F-19 (único estable)
  [10, 10], [10, 11], [10, 12],    // Ne-20, Ne-21, Ne-22
];

// ─── ENERGÍA DE ENLACE (Fórmula de Weizsäcker) ───────────────────────────────
/**
 * Calcula la energía de enlace por nucleón (B/A) en MeV.
 * Basado en el modelo de la gota líquida.
 */
export function calcBindingEnergyPerNucleon(Z: number, A: number): number {
  if (Z <= 0 || A <= 0 || A < Z) return 0;
  const N = A - Z;

  // Coeficientes de Weizsäcker (MeV)
  const aV = 15.753; // Volumen
  const aS = 17.804; // Superficie
  const aC = 0.7103; // Coulomb
  const aA = 23.690; // Asimetría

  // Energía de apareamiento (pairing)
  let delta = 0;
  const evenZ = Z % 2 === 0;
  const evenN = N % 2 === 0;
  if (evenZ && evenN)  delta = +34 / Math.pow(A, 0.75);  // par-par: más estable
  if (!evenZ && !evenN) delta = -34 / Math.pow(A, 0.75); // impar-impar: menos estable

  const B = aV * A
    - aS * Math.pow(A, 2 / 3)
    - aC * Z * (Z - 1) / Math.pow(A, 1 / 3)
    - aA * Math.pow(A - 2 * Z, 2) / A
    + delta;

  return Math.max(0, B / A);
}

// ─── NIVEL DE ESTABILIDAD DEL NÚCLEO ──────────────────────────────────────────
export type StabilityLevel = 'stable' | 'metastable' | 'unstable' | 'critical';

export interface NuclearStatus {
  level: StabilityLevel;
  ratioNZ: number;
  isKnownStable: boolean;
  decay: string;       // Tipo de decaimiento probable
  label: string;       // Descripción corta
  color: string;       // Color HEX del glow
}

export function assessNuclearStability(Z: number, N: number): NuclearStatus {
  if (Z === 0 && N === 0) {
    return { level: 'stable', ratioNZ: 0, isKnownStable: true, decay: '—', label: 'Sin nucleones', color: '#64748B' };
  }

  const isKnownStable = STABLE_ISOTOPES.some(([sz, sn]) => sz === Z && sn === N);
  const A = Z + N;
  const ratioNZ = Z > 0 ? N / Z : 0;

  if (isKnownStable) {
    return { level: 'stable', ratioNZ, isKnownStable: true, decay: 'Ninguno', label: 'Isótopo estable', color: '#22c55e' };
  }

  const deviation = Math.abs(ratioNZ - 1.0);
  const total = Z + N;
  const diff = Math.abs(Z - N);

  // 1. GOLPE DE GRACIA: Solo explota si la masa es absurda o el desequilibrio es masivo
  if (total > 30 || diff > 12) {
    return { level: 'critical', ratioNZ, isKnownStable: false, decay: 'Fisión Espontánea', label: 'Altamente inestable', color: '#ef4444' };
  }

  // 2. Clasificación de Inestabilidad (sin explotar)
  if (deviation <= 0.5 || Z < 3) {
    return { level: 'metastable', ratioNZ, isKnownStable: false, decay: 'β±', label: 'Isótopo metaestable', color: '#facc15' };
  }

  return { level: 'unstable', ratioNZ, isKnownStable: false, decay: ratioNZ > 1.3 ? 'β⁻ (exceso N)' : 'β⁺ (exceso P)', label: 'Radiactivo', color: '#f97316' };
}

// ─── NOTACIÓN IUPAC DEL NUCLÍDO ───────────────────────────────────────────────
const SUPERSCRIPTS: Record<number, string> = {
  0:'⁰',1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶',7:'⁷',8:'⁸',9:'⁹',
  10:'¹⁰',11:'¹¹',12:'¹²',13:'¹³',14:'¹⁴',15:'¹⁵',16:'¹⁶',17:'¹⁷',18:'¹⁸',19:'¹⁹',20:'²⁰',
};
const SUBSCRIPTS: Record<number, string> = {
  0:'₀',1:'₁',2:'₂',3:'₃',4:'₄',5:'₅',6:'₆',7:'₇',8:'₈',9:'₉',10:'₁₀',
};
const ELEMENT_SYMBOLS: Record<number, string> = {
  0:'?', 1:'H', 2:'He', 3:'Li', 4:'Be', 5:'B', 6:'C', 7:'N', 8:'O', 9:'F', 10:'Ne',
};
const CHARGE_STR: Record<number, string> = {
  0: '', 1: '⁺', 2: '²⁺', 3: '³⁺', [-1]: '⁻', [-2]: '²⁻',
};

export function buildIUPACNotation(Z: number, A: number, charge: number = 0): string {
  const sym = ELEMENT_SYMBOLS[Z] ?? '?';
  const massStr = SUPERSCRIPTS[A] ?? `^${A}`;
  const zStr = SUBSCRIPTS[Z] ?? `_${Z}`;
  const chargeStr = charge !== 0 ? (CHARGE_STR[charge] ?? `${charge > 0 ? '+' : ''}${charge}`) : '';
  return `${massStr}${zStr}${sym}${chargeStr}`;
}
