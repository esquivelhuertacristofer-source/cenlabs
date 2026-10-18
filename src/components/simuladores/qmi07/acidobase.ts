/**
 * qmi07/acidobase.ts — LA QUÍMICA de la titulación (módulo puro, sin three ni React).
 *
 * EQUILIBRIO EXACTO. El pH no sale de atajos por tramos («exceso de ácido», «sólo la
 * sal», «Henderson»): sale de resolver el BALANCE DE CARGA de la disolución completa,
 *
 *   [H⁺] + [Na⁺] = [OH⁻] + [Cl⁻] + C_A·n̄([H⁺])          [OH⁻] = K_w/[H⁺]
 *
 * donde n̄ = Σ j·α_j es la carga media del anión de un ácido débil HₙA (α_j, fracción de
 * cada forma, sale de las K_a) y, para el HCl (fuerte), [Cl⁻] = C_A. La función es
 * monótona en [H⁺]: bisección en log[H⁺] hasta la precisión de máquina. Las fórmulas de
 * libro (Henderson–Hasselbalch, hidrólisis del anión, pH = 7) quedan como CASOS
 * PARTICULARES que las pruebas comparan con este cálculo.
 *
 * INDICADOR. HIn ⇌ H⁺ + In⁻ con su pK_In: fracción básica f = 1/(1 + 10^(pK_In − pH)).
 * El color es Beer–Lambert por canal: A = ℓ·c_In·[(1 − f)·ε_HIn + f·ε_In].
 *
 * BURETA. Gota de Tate (con el factor de Harkins–Brown), llave de macho cuyo paso es el
 * área común de dos círculos, caudal ∝ √h (Torricelli) calibrado a un vaciado de norma, y
 * paso de goteo a chorro por el número de Weber.
 *
 * ESTELA. Cada gota (o paquete de chorro) es una zona que arrastra disolución del matraz
 * a un ritmo exponencial (mezcla turbulenta, N·τ constante); su pH se resuelve con el
 * MISMO balance de carga. Por eso lejos del equivalente el color de la gota se apaga en
 * un instante y cerca de él dura segundos: no es una animación, es la química de la zona.
 *
 * Unidades: concentraciones en mol/L, volúmenes en mL, longitudes en cm (salvo donde se
 * dice), tiempos en s. 25 °C.
 */

// ───────────────────────────── constantes ─────────────────────────────

/** pK_w y K_w del agua a 25 °C (se usa 14,00 para que el equivalente fuerte–fuerte sea 7,00). */
export const PKW = 14;
export const KW = 10 ** -PKW;
export const T_C = 25;
const R_GAS = 8.314462618;
const FARADAY = 96485.33212;
/** Pendiente nernstiana del electrodo de vidrio a 25 °C (V por unidad de pH): RT·ln10/F. */
export const PENDIENTE_NERNST = (R_GAS * (T_C + 273.15) * Math.LN10) / FARADAY;

// ───────────────────────────── ácidos ─────────────────────────────

export type IdAcido = 'HCl' | 'CH3COOH' | 'H3PO4';

export interface Acido {
  id: IdAcido;
  nombre: string;
  formula: string;
  /** pK_a sucesivos (vacío = ácido fuerte, disociado por completo) */
  pKa: readonly number[];
  /** fórmula de cada forma, de la más protonada a la menos (para el dock) */
  formas: readonly string[];
}

/** pK_a a 25 °C: CRC Handbook of Chemistry and Physics (97.ª ed.), «Dissociation constants of inorganic/organic acids». */
export const ACIDOS: Record<IdAcido, Acido> = {
  HCl: { id: 'HCl', nombre: 'Ácido clorhídrico', formula: 'HCl', pKa: [], formas: ['Cl⁻'] },
  CH3COOH: { id: 'CH3COOH', nombre: 'Ácido acético', formula: 'CH₃COOH', pKa: [4.756], formas: ['CH₃COOH', 'CH₃COO⁻'] },
  H3PO4: { id: 'H3PO4', nombre: 'Ácido fosfórico', formula: 'H₃PO₄', pKa: [2.16, 7.21, 12.32], formas: ['H₃PO₄', 'H₂PO₄⁻', 'HPO₄²⁻', 'PO₄³⁻'] },
};
export const ACIDOS_LISTA: IdAcido[] = ['HCl', 'CH3COOH', 'H3PO4'];
export const esFuerte = (a: IdAcido) => ACIDOS[a].pKa.length === 0;
/** Protones que cede cada molécula (los que se valoran). */
export const protones = (a: IdAcido) => Math.max(1, ACIDOS[a].pKa.length);

/**
 * Fracciones α_j de cada forma de un ácido débil HₙA a [H⁺] = h (α_0 = HₙA … α_n = Aⁿ⁻).
 * Se calculan en logaritmos y se normalizan por el término mayor: estables en todo el rango.
 */
export function fracciones(pKa: readonly number[], h: number): number[] {
  const n = pKa.length;
  const lh = Math.log10(h);
  const lt: number[] = [];
  let acum = 0;
  for (let j = 0; j <= n; j++) {
    if (j > 0) acum -= pKa[j - 1];
    lt.push((n - j) * lh + acum);
  }
  const m = Math.max(...lt);
  const t = lt.map((x) => 10 ** (x - m));
  const s = t.reduce((a, b) => a + b, 0);
  return t.map((x) => x / s);
}

/** Carga media del anión: n̄ = Σ j·α_j. */
export function cargaMedia(pKa: readonly number[], h: number): number {
  return fracciones(pKa, h).reduce((s, a, j) => s + j * a, 0);
}

/** Totales analíticos de una disolución (mol/L). */
export interface Totales {
  /** ácido total (todas sus formas) */
  CA: number;
  /** sodio (de la sosa) */
  CNa: number;
}

/** Balance de carga (cationes − aniones, mol/L) a [H⁺] = h: es cero en el equilibrio. */
export function residuoCarga(a: IdAcido, c: Totales, h: number): number {
  const pKa = ACIDOS[a].pKa;
  const aniones = KW / h + (pKa.length === 0 ? c.CA : c.CA * cargaMedia(pKa, h));
  return h + c.CNa - aniones;
}

/**
 * [H⁺] de equilibrio: raíz del balance de carga (monótono creciente en h) por bisección en
 * log h entre 10⁻¹⁶ y 10² M, hasta que el intervalo deja de estrecharse.
 */
export function resolverH(a: IdAcido, c: Totales): number {
  let lo = -16, hi = 2;
  for (let i = 0; i < 200; i++) {
    const m = (lo + hi) / 2;
    if (m === lo || m === hi) break;
    if (residuoCarga(a, c, 10 ** m) > 0) hi = m; else lo = m;
  }
  return 10 ** ((lo + hi) / 2);
}
export const pH = (a: IdAcido, c: Totales) => -Math.log10(resolverH(a, c));

// ───────────────────────────── el matraz ─────────────────────────────

/** El montaje: alícuota de ácido (ca, va) diluida con agua y valorada con sosa (cb). */
export interface Sistema {
  acido: IdAcido;
  /** mol/L del ácido en la alícuota */
  ca: number;
  /** mL de alícuota */
  va: number;
  /** mL de agua destilada añadida para cubrir el electrodo (no cambia los moles) */
  vAgua: number;
  /** mol/L de NaOH */
  cb: number;
}

/** Agua que se añade a la alícuota para que el bulbo del electrodo quede sumergido. */
export const AGUA_ML = 75;

/** Volumen total del matraz (mL) tras añadir vb mL de base. */
export const volumenMatraz = (s: Sistema, vb: number) => s.va + s.vAgua + vb;

/** Totales del matraz tras añadir vb mL de base. */
export function totales(s: Sistema, vb: number): Totales {
  const V = volumenMatraz(s, vb);
  return { CA: (s.ca * s.va) / V, CNa: (s.cb * vb) / V };
}

export const phMatraz = (s: Sistema, vb: number) => pH(s.acido, totales(s, vb));

/** Volumen de base (mL) del j-ésimo punto de equivalencia: j·n(ácido)/C_b. */
export const volumenEquivalencia = (s: Sistema, j = 1) => (j * s.ca * s.va) / s.cb;

/** K_b del anión conjugado de la última disociación que se valora (K_w/K_a). */
export function kbConjugada(a: IdAcido, j = 1): number {
  const pKa = ACIDOS[a].pKa;
  if (pKa.length === 0) return 0;
  return KW / 10 ** -pKa[j - 1];
}

/** Especies del matraz a vb (mol/L): para el dock y para las pruebas de balance. */
export interface Especies {
  h: number; oh: number; na: number;
  /** concentraciones de cada forma del ácido (HCl: sólo Cl⁻) */
  formas: number[];
  /** suma de cargas positivas y negativas (mol/L) */
  positivas: number; negativas: number;
  /** ácido total en todas sus formas (mol/L) */
  CA: number;
}
export function especies(s: Sistema, vb: number): Especies {
  const c = totales(s, vb);
  const h = resolverH(s.acido, c);
  const pKa = ACIDOS[s.acido].pKa;
  const formas = pKa.length === 0 ? [c.CA] : fracciones(pKa, h).map((al) => al * c.CA);
  const negAcido = pKa.length === 0 ? c.CA : formas.reduce((acc, x, j) => acc + j * x, 0);
  return { h, oh: KW / h, na: c.CNa, formas, positivas: h + c.CNa, negativas: KW / h + negAcido, CA: c.CA };
}

/** Curva teórica pH(vb) en n + 1 puntos entre 0 y vMax. */
export function curva(s: Sistema, vMax: number, n = 400): { v: number; ph: number }[] {
  const out: { v: number; ph: number }[] = [];
  for (let i = 0; i <= n; i++) { const v = (vMax * i) / n; out.push({ v, ph: phMatraz(s, v) }); }
  return out;
}

// ───────────────────────────── indicadores ─────────────────────────────

export type IdIndicador = 'fenolftaleina' | 'naranjaMetilo' | 'azulBromotimol';

/** Canales RGB como tres bandas del visible: R ≈ 610 nm, G ≈ 545 nm, B ≈ 450 nm. */
export type RGB = [number, number, number];

export interface Indicador {
  id: IdIndicador;
  nombre: string;
  /** pK del equilibrio que da el color (HIn ⇌ H⁺ + In⁻) */
  pKIn: number;
  /** intervalo de viraje de tabla (el ojo lo distingue ahí) */
  rango: [number, number];
  /** g/mol, g/L de la disolución madre, gotas y mL por gota del frasco gotero */
  M: number; stockGL: number; gotas: number; mlGota: number;
  /** absortividad molar por canal de la forma ácida y de la básica (L·mol⁻¹·cm⁻¹) */
  epsHIn: RGB; epsIn: RGB;
  /** color de la disolución madre en su frasco (sólo para la pieza) */
  colorFrasco: string;
}

/**
 * Datos: pK_In y viraje de Harris, «Quantitative Chemical Analysis», tabla 11-4; máximos de
 * absorción y ε de los espectros publicados (fenolftaleína In²⁻ 553 nm, ε ≈ 3,0·10⁴;
 * naranja de metilo ácido 507 nm ≈ 4,6·10⁴ y básico 464 nm ≈ 2,7·10⁴; azul de
 * bromotimol ácido 433 nm ≈ 1,6·10⁴ y básico 617 nm ≈ 3,8·10⁴), repartidos en las
 * tres bandas. Disoluciones madre de uso escolar.
 */
export const INDICADORES: Record<IdIndicador, Indicador> = {
  fenolftaleina: {
    id: 'fenolftaleina', nombre: 'Fenolftaleína', pKIn: 9.5, rango: [8.2, 10.0],
    M: 318.3, stockGL: 10, gotas: 3, mlGota: 0.025,
    epsHIn: [0, 0, 0], epsIn: [2.4e3, 3.0e4, 1.05e4], colorFrasco: '#eef3f5',
  },
  naranjaMetilo: {
    id: 'naranjaMetilo', nombre: 'Naranja de metilo', pKIn: 3.46, rango: [3.1, 4.4],
    M: 327.3, stockGL: 1, gotas: 4, mlGota: 0.03,
    epsHIn: [2.3e3, 4.6e4, 3.8e4], epsIn: [0, 6.5e3, 2.7e4], colorFrasco: '#d9531e',
  },
  azulBromotimol: {
    id: 'azulBromotimol', nombre: 'Azul de bromotimol', pKIn: 7.1, rango: [6.0, 7.6],
    M: 624.4, stockGL: 1, gotas: 8, mlGota: 0.06,
    epsHIn: [0, 2.4e3, 1.6e4], epsIn: [3.8e4, 1.7e4, 1.9e3], colorFrasco: '#2f6f5e',
  },
};
export const INDICADORES_LISTA: IdIndicador[] = ['fenolftaleina', 'naranjaMetilo', 'azulBromotimol'];

/** Fracción de indicador en su forma básica In⁻ a un pH: 1/(1 + 10^(pK_In − pH)). */
export const fraccionBasica = (ind: Indicador, ph: number) => 1 / (1 + 10 ** (ind.pKIn - ph));

/** Moles de indicador que lleva una dosis del frasco gotero. */
export const molesDosis = (ind: Indicador) => (ind.gotas * ind.mlGota * 1e-3 * ind.stockGL) / ind.M;
/** Moles de indicador de una sola gota del frasco. */
export const molesGotaIndicador = (ind: Indicador) => (ind.mlGota * 1e-3 * ind.stockGL) / ind.M;

/** Absorbancia decimal por cm de recorrido, por canal: c·[(1 − f)·ε_HIn + f·ε_In]. */
export function absorbanciaPorCm(ind: Indicador, cIn: number, ph: number): RGB {
  const f = fraccionBasica(ind, ph);
  return [0, 1, 2].map((k) => cIn * ((1 - f) * ind.epsHIn[k] + f * ind.epsIn[k])) as RGB;
}

/** Transmitancia por canal tras ℓ cm: T = 10^(−A·ℓ). */
export function transmitancia(ind: Indicador, cIn: number, ph: number, lCm: number): RGB {
  return absorbanciaPorCm(ind, cIn, ph).map((a) => 10 ** (-a * lCm)) as RGB;
}

/** Lineal → sRGB (0–255), para pintar en el DOM el color que da Beer–Lambert. */
export function aSRGB(t: RGB): [number, number, number] {
  const enc = (x: number) => {
    const v = Math.max(0, Math.min(1, x));
    return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
  };
  return [enc(t[0]), enc(t[1]), enc(t[2])];
}
export const cssRGB = (t: RGB) => { const [r, g, b] = aSRGB(t); return `rgb(${r},${g},${b})`; };

// ───────────────────────────── electrodo ─────────────────────────────

/** Potencial del electrodo combinado (mV) frente a la referencia: E = −S·(pH − 7), electrodo ideal. */
export const mVElectrodo = (ph: number) => -1000 * PENDIENTE_NERNST * (ph - 7);

// ───────────────────────────── bureta: gota, llave y caudal ─────────────────────────────

/** Punta de la bureta: radio exterior (cm) donde cuelga la gota y diámetro interior (cm). */
export const PUNTA = { radioExtCm: 0.15, diamIntCm: 0.1 };
/** Tensión superficial (N/m) y densidad (kg/m³) de NaOH 0,1 M a 25 °C; g estándar. */
export const LIQUIDO_BURETA = { gamma: 0.0720, rho: 1003 };
export const G = 9.80665;
/** Factor de Harkins–Brown para r/V^(1/3) ≈ 0,43 (la gota no se desprende entera). */
export const HARKINS_BROWN = 0.62;

/** Volumen de la gota (mL) por la ley de Tate con el factor de Harkins–Brown: V = 2π·r·γ·φ/(ρ·g). */
export function volumenGotaTate(rCm = PUNTA.radioExtCm, gamma = LIQUIDO_BURETA.gamma, rho = LIQUIDO_BURETA.rho, phi = HARKINS_BROWN): number {
  const r = rCm / 100;
  return ((2 * Math.PI * r * gamma * phi) / (rho * G)) * 1e6;
}
/** Gota de la bureta (mL), redondeada a la milésima en que la apunta el registro. */
export const V_GOTA_ML = Math.round(volumenGotaTate() * 1000) / 1000;

/**
 * Paso de la llave: el taladro del macho (círculo) frente al conducto (círculo igual); al
 * girar se desplazan d = 1 − apertura diámetros. Fracción de área común:
 * (2/π)·[acos d − d·√(1 − d²)].
 */
export function areaLlave(apertura: number): number {
  const p = Math.max(0, Math.min(1, apertura));
  if (p <= 0) return 0;
  const d = 1 - p;
  return (2 / Math.PI) * (Math.acos(d) - d * Math.sqrt(1 - d * d));
}

/** Tiempo de vaciado de 0 a 50 mL con la llave abierta (s): ISO 385, clase A, 70–100 s. */
export const T_VACIADO_S = 75;

/**
 * Caudal (mL/s) con la llave a `apertura` y una altura de columna h (cm sobre la punta):
 * Q = Q₀·área·√(h/h₀). Q₀ se calibra para que la bureta llena se vacíe en T_VACIADO_S con
 * la altura real de cada lectura (`alturaDeLectura`, en cm).
 */
export function crearCaudal(alturaDeLectura: (mL: number) => number) {
  const h0 = alturaDeLectura(25);
  let integral = 0;
  const N = 500;
  for (let i = 0; i < N; i++) {
    const v = ((i + 0.5) * 50) / N;
    integral += (50 / N) / Math.sqrt(alturaDeLectura(v) / h0);
  }
  const Q0 = integral / T_VACIADO_S;
  return {
    Q0, h0,
    caudal: (apertura: number, lecturaML: number) => {
      if (lecturaML >= 50) return 0;
      return Q0 * areaLlave(apertura) * Math.sqrt(Math.max(0, alturaDeLectura(lecturaML)) / h0);
    },
    /** apertura que da un caudal (inversa por bisección; 1 si no se alcanza) */
    aperturaPara: (q: number, lecturaML: number) => {
      const qMax = Q0 * Math.sqrt(Math.max(1e-9, alturaDeLectura(lecturaML)) / h0);
      if (q >= qMax) return 1;
      if (q <= 0) return 0;
      let lo = 0, hi = 1;
      for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (qMax * areaLlave(m) < q) lo = m; else hi = m; }
      return (lo + hi) / 2;
    },
  };
}

/**
 * Caudal (mL/s) a partir del cual la punta deja de gotear y sale un chorro: número de Weber
 * ρ·v²·d/γ = 4 con v = Q/(π·d²/4) en el diámetro interior.
 */
export function caudalChorro(weber = 4): number {
  const d = PUNTA.diamIntCm / 100;
  const v = Math.sqrt((weber * LIQUIDO_BURETA.gamma) / (LIQUIDO_BURETA.rho * d));
  return v * Math.PI * (d / 2) ** 2 * 1e6;
}
export const Q_CHORRO = caudalChorro();

/** Caída libre de la gota (s) desde una altura h (cm). */
export const tiempoCaida = (hCm: number) => Math.sqrt((2 * Math.max(0, hCm) / 100) / G);

/** Velocidad mínima de las ondas capilar-gravitatorias (m/s): (4·g·γ/ρ)^(1/4). Anillo de la gota. */
export const C_ONDA = (4 * G * 0.0720 / 997) ** 0.25;

/** Radio del chorro (cm) a una distancia y bajo la punta, por continuidad con caída libre. */
export function radioChorro(qMLs: number, yCm: number): number {
  const q = qMLs * 1e-6;
  const d = PUNTA.diamIntCm / 100;
  const v0 = q / (Math.PI * (d / 2) ** 2);
  const v = Math.sqrt(v0 * v0 + 2 * G * (yCm / 100));
  return Math.sqrt(q / (Math.PI * Math.max(v, 1e-6))) * 100;
}

// ───────────────────────────── agitación y estela ─────────────────────────────

/**
 * Mezcla turbulenta de una gota: el volumen de disolución que arrastra crece como
 * V_e(t) = v·(e^(t/τ) − 1), con N·τ = 2,6 (equivale a N·θ₉₅ ≈ 20, dentro de lo medido en
 * tanques agitados). Sin agitación queda la convección natural: τ ≈ 20 s.
 */
export const N_TAU = 2.6;
export function tauMezcla(rpm: number): number {
  const N = rpm / 60;
  return N <= 0 ? 20 : Math.min(20, N_TAU / N);
}
export const volumenArrastrado = (vGota: number, t: number, tau: number) => vGota * Math.expm1(Math.max(0, t) / tau);

/**
 * pH de la zona de una gota: la gota de base (vGota mL a cb) con V_e mL del matraz que
 * tenía los totales `matraz`. Mismo balance de carga que el matraz.
 */
export function phZona(a: IdAcido, matraz: Totales, cb: number, vGota: number, vE: number): number {
  const V = vGota + vE;
  return pH(a, { CA: (matraz.CA * vE) / V, CNa: (cb * vGota + matraz.CNa * vE) / V });
}

// ───────────────────────────── derivada de las lecturas ─────────────────────────────

/** Primera derivada ΔpH/ΔV de una serie de lecturas (en el punto medio de cada par). */
export function derivada(p: { v: number; ph: number }[], dvMin = 0.004): { v: number; d: number }[] {
  const out: { v: number; d: number }[] = [];
  let k = 0;
  for (let i = 1; i < p.length; i++) {
    const dv = p[i].v - p[k].v;
    if (dv < dvMin) continue;
    out.push({ v: (p[i].v + p[k].v) / 2, d: (p[i].ph - p[k].ph) / dv });
    k = i;
  }
  return out;
}
