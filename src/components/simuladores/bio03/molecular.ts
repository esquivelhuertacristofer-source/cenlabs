/**
 * bio03/molecular.ts — la química y la física del dogma central, SIN three.
 *
 * De aquí salen la escena 3D, el dock y las pruebas (src/__tests__/bio03-sintesis.test.ts).
 * Escala de todo lo molecular: 1 u = 1 nm.
 *
 *  · ADN B (Arnott; Dickerson): 0,338 nm de subida y 10,5 pb por vuelta (giro de
 *    34,3°, paso de 3,55 nm), fosfatos a 0,89 nm del eje (Ø ≈ 2,0 nm con su radio
 *    de van der Waals) y C1′ a 0,59 nm. Las dos hebras están desfasadas en acimut lo
 *    justo para que los surcos midan 1,2 nm (menor) y 2,35 nm (mayor) a lo largo del eje.
 *    Hélice dextrógira (torsión positiva).
 *  · Complementariedad y puentes de hidrógeno (A–T/A–U: 2 · G–C: 3).
 *  · El código genético es el del dominio (NCBI tabla 1, 64 codones): aquí sólo se
 *    añade el marco de lectura y las propiedades de cada aminoácido (clase de su
 *    cadena lateral, volumen de Zamyatnin 1972 y propensión a hélice de Pace y
 *    Scholtz 1998).
 *  · Cinética: la Pol II alarga a ≈ 50 nt/s (2–4 kb/min, Jonkers y Lis 2015) y el
 *    ribosoma eucariota a ≈ 5,6 codones/s (Ingolia 2011). La animación de cada paso
 *    dura lo que dice DUR: el cociente es la cámara lenta que se rotula.
 *  · Agitación térmica: Stokes–Einstein, D = k_B·T / (6π·η·r). A velocidad real un
 *    NTP recorre su propio tamaño en un nanosegundo; se muestra ~10⁸ veces más lento.
 *  · Hélice α: Zimm–Bragg (matriz de transferencia) con s por residuo de Pace–Scholtz:
 *    una cadena de 4–6 residuos no se pliega (θ ≈ 1 %), y así se dibuja.
 *  · Geometría de la burbuja de transcripción (≈ 13 nt abiertos, híbrido ARN–ADN de
 *    8 pb) y de los sitios E · P · A del ribosoma.
 */
import { CODIGO_GENETICO, COMPLEMENTO_ARN, COMPLEMENTO_ARN_ARN } from '@/domain/biologia';

export type V3 = [number, number, number];

// ═════════════════════════════ colores ═════════════════════════════

/** Colores de las bases (los mismos de los botones del lab): A verde · U/T rosa · C azul · G ámbar. */
export const COLOR_BASE: Record<string, string> = { A: '#2fa56b', U: '#d6455d', T: '#d6455d', C: '#3f8fc7', G: '#e69b2e' };
/** Base cuya identidad el alumno aún no conoce (hebra codificante por delante de la polimerasa). */
export const COLOR_NEUTRO = '#b9c0cc';

// ═════════════════════════════ ADN B ═════════════════════════════

export const ADN_B = {
  /** nm por par de bases */
  subida: 0.338,
  pbPorVuelta: 10.5,
  /** radio de los fósforos (nm) */
  radioP: 0.89,
  /** radio de los C1′ (nm): de aquí arrancan las bases */
  radioC1: 0.59,
  /** radio de van der Waals del grupo fosfato (nm) */
  radioVdwP: 0.12,
  /** anchura axial del surco menor (nm) */
  surcoMenor: 1.2,
} as const;

/** Giro por par de bases (rad). */
export const GIRO = (2 * Math.PI) / ADN_B.pbPorVuelta;
/** Paso de la hélice (nm por vuelta). */
export const PASO_HELICE = ADN_B.pbPorVuelta * ADN_B.subida;
/** Desfase acimutal entre las dos hebras (rad), del lado del surco menor. */
export const DESFASE_HEBRAS = (2 * Math.PI * ADN_B.surcoMenor) / PASO_HELICE;

/** Anchuras axiales de los surcos (nm): menor y mayor suman el paso. */
export function surcos(): { menor: number; mayor: number } {
  const f = DESFASE_HEBRAS / (2 * Math.PI);
  return { menor: f * PASO_HELICE, mayor: (1 - f) * PASO_HELICE };
}

/** Diámetro exterior de la doble hélice (nm): fósforos más su radio de van der Waals. */
export const DIAMETRO_ADN = 2 * (ADN_B.radioP + ADN_B.radioVdwP);

/** Punto de una hélice de eje +x (dextrógira para θ creciente con x). */
export function puntoHelice(x: number, theta: number, radio: number): V3 {
  return [x, radio * Math.cos(theta), radio * Math.sin(theta)];
}

/** Purinas (dos anillos): ocupan más de la mitad del travesaño del par. */
export const esPurina = (b: string) => b === 'A' || b === 'G';
/** Fracción del travesaño (C1′–C1′) que ocupa una base: purina 0,56 · pirimidina 0,44. */
export const fraccionBase = (b: string) => (esPurina(b) ? 0.56 : 0.44);

export const COMPLEMENTO_ADN: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' };

/**
 * Puentes de hidrógeno de un par de bases (ADN o ARN, en cualquier orden): 2 en A–T y
 * A–U, 3 en G–C; 0 si no son complementarias (un mal apareamiento).
 */
export function puentesH(a: string, b: string): 0 | 2 | 3 {
  const par = [a, b].sort().join('');
  if (par === 'AT' || par === 'AU') return 2;
  if (par === 'CG') return 3;
  return 0;
}

/** Base de ARN que aparea con una base de la hebra molde. */
export const baseARN = (molde: string) => COMPLEMENTO_ARN[molde] ?? '?';
/** Anticodón (3′→5′, alineado con el codón) de un codón. */
export const anticodonDe = (codon: string) => codon.split('').map((b) => COMPLEMENTO_ARN_ARN[b] ?? '?').join('');

// ═════════════════════════════ código genético ═════════════════════════════

export const BASES_ARN = ['U', 'C', 'A', 'G'] as const;

/** Los 64 codones en el orden de la tabla clásica (1.ª, 2.ª, 3.ª base en U C A G). */
export const CODONES: readonly string[] = BASES_ARN.flatMap((a) => BASES_ARN.flatMap((b) => BASES_ARN.map((c) => a + b + c)));
export const CODON_INICIO = 'AUG';
export const CODONES_PARO: readonly string[] = CODONES.filter((c) => CODIGO_GENETICO[c]?.name === 'STOP');

export type ClaseAA = 'apolar' | 'aromatico' | 'polar' | 'basico' | 'acido';

/** Clases de cadena lateral (Lehninger) y su color en la escena y el dock. */
export const CLASES_AA: Record<ClaseAA, { nombre: string; color: string }> = {
  apolar: { nombre: 'apolar', color: '#f0c24f' },
  aromatico: { nombre: 'aromático', color: '#ec8a3c' },
  polar: { nombre: 'polar', color: '#45c4a0' },
  basico: { nombre: 'básico (+)', color: '#5b93f2' },
  acido: { nombre: 'ácido (−)', color: '#ef5d6c' },
};

export interface InfoAA {
  nombre: string;
  letra: string;
  clase: ClaseAA;
  /** volumen del residuo (Å³), Zamyatnin 1972 */
  volumen: number;
  /** ΔΔG de hélice respecto a Ala (kcal/mol), Pace y Scholtz 1998 */
  ddgHelice: number;
}

export const AMINOACIDOS: Record<string, InfoAA> = {
  Gly: { nombre: 'glicina', letra: 'G', clase: 'apolar', volumen: 60.1, ddgHelice: 1.0 },
  Ala: { nombre: 'alanina', letra: 'A', clase: 'apolar', volumen: 88.6, ddgHelice: 0 },
  Pro: { nombre: 'prolina', letra: 'P', clase: 'apolar', volumen: 112.7, ddgHelice: 3.16 },
  Val: { nombre: 'valina', letra: 'V', clase: 'apolar', volumen: 140.0, ddgHelice: 0.61 },
  Leu: { nombre: 'leucina', letra: 'L', clase: 'apolar', volumen: 166.7, ddgHelice: 0.21 },
  Ile: { nombre: 'isoleucina', letra: 'I', clase: 'apolar', volumen: 166.7, ddgHelice: 0.41 },
  Met: { nombre: 'metionina', letra: 'M', clase: 'apolar', volumen: 162.9, ddgHelice: 0.24 },
  Phe: { nombre: 'fenilalanina', letra: 'F', clase: 'aromatico', volumen: 189.9, ddgHelice: 0.54 },
  Tyr: { nombre: 'tirosina', letra: 'Y', clase: 'aromatico', volumen: 193.6, ddgHelice: 0.53 },
  Trp: { nombre: 'triptófano', letra: 'W', clase: 'aromatico', volumen: 227.8, ddgHelice: 0.49 },
  Ser: { nombre: 'serina', letra: 'S', clase: 'polar', volumen: 89.0, ddgHelice: 0.5 },
  Thr: { nombre: 'treonina', letra: 'T', clase: 'polar', volumen: 116.1, ddgHelice: 0.66 },
  Cys: { nombre: 'cisteína', letra: 'C', clase: 'polar', volumen: 108.5, ddgHelice: 0.68 },
  Asn: { nombre: 'asparagina', letra: 'N', clase: 'polar', volumen: 114.1, ddgHelice: 0.65 },
  Gln: { nombre: 'glutamina', letra: 'Q', clase: 'polar', volumen: 143.8, ddgHelice: 0.39 },
  Lys: { nombre: 'lisina', letra: 'K', clase: 'basico', volumen: 168.6, ddgHelice: 0.26 },
  Arg: { nombre: 'arginina', letra: 'R', clase: 'basico', volumen: 173.4, ddgHelice: 0.21 },
  His: { nombre: 'histidina', letra: 'H', clase: 'basico', volumen: 153.2, ddgHelice: 0.61 },
  Asp: { nombre: 'aspartato', letra: 'D', clase: 'acido', volumen: 111.1, ddgHelice: 0.69 },
  Glu: { nombre: 'glutamato', letra: 'E', clase: 'acido', volumen: 138.4, ddgHelice: 0.4 },
};

/** Color de un aminoácido (por la clase de su cadena lateral). */
export const colorAA = (aa: string) => CLASES_AA[AMINOACIDOS[aa]?.clase ?? 'apolar'].color;

/** Aminoácido (tres letras) o 'STOP' de un codón. */
export const aminoacidoDe = (codon: string) => CODIGO_GENETICO[codon]?.name ?? '???';

export interface CodonLeido { inicio: number; codon: string; aa: string }

/**
 * Lee el ARNm en el marco que empieza en `desde`, codón a codón, hasta el primer codón
 * de paro (incluido, con aa 'STOP') o hasta que no queden tres bases.
 */
export function leerMarco(arn: string, desde = 0): CodonLeido[] {
  const out: CodonLeido[] = [];
  for (let i = desde; i + 3 <= arn.length; i += 3) {
    const codon = arn.slice(i, i + 3);
    const aa = aminoacidoDe(codon);
    out.push({ inicio: i, codon, aa });
    if (aa === 'STOP') break;
  }
  return out;
}

/** Proteína (aminoácidos, sin el paro) desde el primer AUG; [] si no hay AUG. */
export function traducirDesdeAUG(arn: string): string[] {
  const i = arn.indexOf(CODON_INICIO);
  if (i < 0) return [];
  return leerMarco(arn, i).filter((c) => c.aa !== 'STOP').map((c) => c.aa);
}

// ═════════════════════════════ cinética y cámara lenta ═════════════════════════════

/** Velocidad de alargamiento de la ARN polimerasa II (nt/s). */
export const TASA_POL_II = 50;
/** Velocidad de alargamiento del ribosoma eucariota (codones/s). */
export const TASA_RIBOSOMA = 5.6;

/** Duración en pantalla (s, a velocidad ×1) de cada acontecimiento. */
export const DUR = {
  incorporacion: 0.9,
  rechazoNTP: 1.2,
  exportacion: 4.6,
  iniciacion: 3.2,
  elongacion: 2.8,
  rechazoARNt: 1.9,
  terminacion: 5.0,
} as const;

/** Cámara lenta de la animación respecto al proceso real (factor > 1: más lento). */
export function camaraLenta(proceso: 'transcripcion' | 'traduccion', velocidad = 1): number {
  const real = proceso === 'transcripcion' ? 1 / TASA_POL_II : 1 / TASA_RIBOSOMA;
  const mostrado = (proceso === 'transcripcion' ? DUR.incorporacion : DUR.elongacion) / velocidad;
  return mostrado / real;
}

// ═════════════════════════════ difusión (Stokes–Einstein) ═════════════════════════════

export const K_BOLTZMANN = 1.380649e-23;   // J/K
/** Viscosidad del agua a 25 °C (Pa·s). */
export const ETA_AGUA = 0.89e-3;

/** Coeficiente de difusión (m²/s) de una esfera de radio hidrodinámico `radio` (m). */
export const difusion = (radio: number, T = 298.15, eta = ETA_AGUA) => (K_BOLTZMANN * T) / (6 * Math.PI * eta * radio);

/** Radios hidrodinámicos (m). */
export const RADIO_HIDRO = { ntp: 0.65e-9, arnt: 2.9e-9, proteina: 3.5e-9 } as const;

/**
 * Factor de cámara lenta de la agitación térmica: cuántas veces más despacio corre el
 * movimiento browniano que se dibuja para que una molécula de coeficiente D (m²/s)
 * recorra `nmPorSegundo` nm de media cuadrática por segundo de pantalla (3D: ⟨x²⟩ = 6Dt).
 */
export function factorBrowniano(D: number, nmPorSegundo: number): number {
  const d2 = (nmPorSegundo * 1e-9) ** 2;      // m² en 1 s de pantalla
  const tReal = d2 / (6 * D);                  // s reales que tarda en recorrerlo
  return 1 / tReal;
}

/** Desviación típica del paso browniano por eje (nm) en dt s de pantalla con la difusión «mostrada». */
export const pasoBrowniano = (nmPorSegundo: number, dt: number) => nmPorSegundo * Math.sqrt(dt / 3);

// ═════════════════════════════ hélice α (Zimm–Bragg) ═════════════════════════════

/** Parámetro de nucleación de Zimm–Bragg (hélices de péptidos en agua, ~10⁻³). */
export const SIGMA_ZB = 3e-3;
/** s de la alanina (≈ 1,6, Scholtz y Baldwin a baja temperatura). */
export const S_ALA = 1.6;
const RT_KCAL = 0.0019872 * 298.15;

/** Constante de propagación s de un residuo (Pace–Scholtz: s = s_Ala·e^(−ΔΔG/RT)). */
export const sResiduo = (aa: string) => S_ALA * Math.exp(-(AMINOACIDOS[aa]?.ddgHelice ?? 1) / RT_KCAL);

/** ln Z de Zimm–Bragg para una cadena con s_i por residuo (estados h/c, cadena precedida de c). */
function lnZ(s: readonly number[], sigma: number): number {
  // vector fila (peso de terminar en h, en c), normalizado en cada paso
  let h = 0, c = 1, ln = 0;
  for (const si of s) {
    const nh = h * si + c * sigma * si;
    const nc = h + c;
    const m = Math.max(nh, nc);
    h = nh / m; c = nc / m; ln += Math.log(m);
  }
  return ln + Math.log(h + c);
}

/** Fracción helicoidal media θ = (1/N)·∂lnZ/∂ln s de una cadena (s por residuo). */
export function helicidadZB(s: readonly number[], sigma = SIGMA_ZB): number {
  const N = s.length;
  if (N === 0) return 0;
  const e = 1e-4;
  const up = lnZ(s.map((x) => x * (1 + e)), sigma);
  const dn = lnZ(s.map((x) => x * (1 - e)), sigma);
  return (up - dn) / (Math.log((1 + e) / (1 - e)) * N);
}

/** Helicidad de un péptido dado por sus aminoácidos (tres letras). */
export const helicidadPeptido = (aas: readonly string[]) => helicidadZB(aas.map(sResiduo));

// ═════════════════════════════ péptido ═════════════════════════════

/** Distancia Cα–Cα de un enlace peptídico trans (nm). */
export const CA_CA = 0.38;
/** Radio (nm) de la esfera del volumen del residuo. */
export const radioResiduo = (aa: string) => Math.cbrt((3 * (AMINOACIDOS[aa]?.volumen ?? 120)) / (4 * Math.PI)) / 10;

// ═════════════════════════════ burbuja de transcripción ═════════════════════════════
//
// Marco de la polimerasa: eje del ADN en +x; el nucleótido de la hebra molde que se
// lee en el sitio i+1 está en x = 0. u = j − s es la posición de un nucleótido respecto
// a ese sitio (s = nucleótidos ya incorporados, continuo durante la translocación).
// Como la polimerasa sigue el surco, en su marco el ADN avanza en tornillo: Δx = subida,
// Δθ = giro por nucleótido. Las hebras molde (h = 0) y codificante (h = 1) del dúplex:

export const BURBUJA = {
  /** borde corriente arriba (ya transcrito) y corriente abajo de la burbuja, en u */
  arriba: -11.5,
  abajo: 1.5,
  /** pares del híbrido ARN–ADN (u = −8 … −1) */
  hibrido: 8,
  /** altura (nm) del bucle que forma la hebra codificante desplazada */
  lazoY: 2.35,
  lazoZ: 0.75,
  /** rampa (nt) con que se abren y cierran las hebras */
  rampa: 1.6,
} as const;

/** Nucleótidos de la 5′ UTR ya transcritos cuando arranca el lab (el capuchón ya está puesto). */
export const UTR5 = 44;
/**
 * Acimut (rad) de la base molde en el sitio i+1: 90° − Δ/2 (≈ 29°) deja el travesaño de
 * ese par en vertical y de cara a la cámara (molde arriba, hueco del NTP abajo, junto al
 * embudo de los NTP).
 */
export const THETA0 = Math.PI / 2 - DESFASE_HEBRAS / 2;

const suave = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mezcla = (p: V3, q: V3, k: number): V3 => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
const envolver = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Apertura de la burbuja (0 = dúplex, 1 = hebras separadas) en la posición u. */
export function aperturaBurbuja(u: number): number {
  const r = BURBUJA.rampa;
  return suave(BURBUJA.arriba - r / 2, BURBUJA.arriba + r / 2, u) * (1 - suave(BURBUJA.abajo - r / 2, BURBUJA.abajo + r / 2, u));
}

export interface Nucleotido {
  /** C1′ del azúcar (de aquí sale la base) */
  azucar: V3;
  /** fósforo del enlace con el vecino */
  fosfato: V3;
  /** extremo interior de la base (el que aparea) */
  punta: V3;
}

/** Ángulo del travesaño de la posición u (hebra molde). */
export const thetaU = (u: number) => THETA0 + u * GIRO;

/** Nucleótido de la hebra molde (h = 0) o codificante (h = 1) del dúplex sin abrir, con base `b`. */
export function nucleotidoDuplex(u: number, h: 0 | 1, b: string): Nucleotido {
  const x = u * ADN_B.subida;
  const t = thetaU(u) + (h === 1 ? DESFASE_HEBRAS : 0);
  const otro = thetaU(u) + (h === 1 ? 0 : DESFASE_HEBRAS);
  const azucar = puntoHelice(x, t, ADN_B.radioC1);
  const frente = puntoHelice(x, otro, ADN_B.radioC1);
  // cada base cubre su fracción del travesaño C1′–C1′ (purina + pirimidina = 1)
  const punta = mezcla(azucar, frente, fraccionBase(b));
  // antiparalelas: el fósforo de la molde va hacia −x, el de la codificante hacia +x
  const dx = (h === 0 ? -0.5 : 0.5) * ADN_B.subida;
  const fosfato = puntoHelice(x + dx, t + (h === 0 ? -0.5 : 0.5) * GIRO, ADN_B.radioP);
  return { azucar, fosfato, punta };
}

/** Radio y acimut del bucle de la hebra codificante desplazada (encima del ADN). */
const R_LAZO = Math.hypot(BURBUJA.lazoY, BURBUJA.lazoZ);
const A_LAZO = Math.atan2(BURBUJA.lazoZ, BURBUJA.lazoY);

/**
 * Nucleótido de la hebra codificante en la burbuja: se aparta hacia el bucle girando por
 * FUERA de la hélice (radio y acimut interpolados, sin cruzar el eje) en proporción a la
 * apertura; su base deja de apuntar a la molde y queda suelta hacia el eje.
 */
export function nucleotidoCodificante(u: number, b: string): Nucleotido {
  const d = nucleotidoDuplex(u, 1, b);
  const a = aperturaBurbuja(u);
  if (a <= 1e-4) return d;
  const x = u * ADN_B.subida;
  const t0 = thetaU(u) + DESFASE_HEBRAS;
  const dt = envolver(A_LAZO + 0.18 * Math.sin(u * 0.9) - t0);
  const ang = t0 + dt * a;
  const r = ADN_B.radioC1 + (R_LAZO - ADN_B.radioC1) * a;
  const azucar = puntoHelice(x, ang, r);
  const fosfato = puntoHelice(x + 0.5 * ADN_B.subida, ang + 0.5 * GIRO * (1 - a), r + (ADN_B.radioP - ADN_B.radioC1));
  // base suelta: apunta hacia el eje, algo más corta (no hay pareja que la sujete)
  const largo = 0.48 * (esPurina(b) ? 1.15 : 0.9);
  const puntaLibre: V3 = [azucar[0] + 0.12, azucar[1] - Math.cos(ang) * largo, azucar[2] - Math.sin(ang) * largo];
  return { azucar, fosfato, punta: mezcla(d.punta, puntaLibre, a) };
}

/** Nucleótido de ARN en el híbrido (u ∈ [−8, 0]): ocupa el hueco de la hebra codificante. */
export const nucleotidoHibrido = (u: number, base: string): Nucleotido => {
  const d = nucleotidoDuplex(u, 1, 'A');
  const molde = nucleotidoDuplex(u, 0, 'A');
  return { azucar: d.azucar, fosfato: d.fosfato, punta: mezcla(d.azucar, molde.azucar, fraccionBase(base)) };
};

/** Inicio del canal de salida del ARN: el hueco codificante en u = −8 (fijo en el marco de la polimerasa). */
export const inicioSalidaARN = (): V3 => nucleotidoDuplex(-BURBUJA.hibrido, 1, 'A').azucar;

/** Separación entre nucleótidos del ARN monocatenario (nm). */
export const NT_ARN_LIBRE = 0.6;

/**
 * Canal de salida del ARN (marco de la polimerasa): el ARN se separa del híbrido hacia
 * fuera y atrás, sube por detrás del dúplex (bajo la tapa y la pinza) y sale por arriba,
 * junto al tallo Rpb4/7. Curva de Catmull–Rom por puntos de control parametrizada por
 * longitud de arco; pasado el último punto sigue en una cola que se curva despacio.
 */
const CONTROL_SALIDA: V3[] = (() => {
  const q = inicioSalidaARN();
  return [
    q,
    [q[0] - 0.35, q[1] - 0.55, q[2] - 1.15],
    [-4.0, 0.7, -2.75],
    [-5.0, 3.1, -2.7],
    [-5.8, 5.5, -1.3],
    [-6.6, 7.5, 0.7],
    [-8.2, 9.1, 2.5],
    [-10.4, 10.2, 4.2],
  ];
})();
const POLI_SALIDA: { p: V3[]; s: number[] } = (() => {
  const c = CONTROL_SALIDA;
  const cr = (p0: number, p1: number, p2: number, p3: number, t: number) =>
    0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  const p: V3[] = [];
  for (let i = 0; i + 1 < c.length; i++) {
    const a = c[Math.max(0, i - 1)], b = c[i], d = c[i + 1], e = c[Math.min(c.length - 1, i + 2)];
    for (let k = 0; k < 24; k++) {
      const t = k / 24;
      p.push([cr(a[0], b[0], d[0], e[0], t), cr(a[1], b[1], d[1], e[1], t), cr(a[2], b[2], d[2], e[2], t)]);
    }
  }
  p.push(c[c.length - 1]);
  const s = [0];
  for (let i = 1; i < p.length; i++) s.push(s[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1], p[i][2] - p[i - 1][2]));
  return { p, s };
})();
/** Longitud (nm) del tramo guiado del canal de salida. */
export const LARGO_SALIDA = POLI_SALIDA.s[POLI_SALIDA.s.length - 1];

/**
 * Centro del ARN a σ nm del híbrido. `t` (s) mueve la parte libre (fuera de la
 * polimerasa) con una ondulación lenta: el ARN es flexible; dentro no ondula.
 */
export function caminoSalidaARN(sigma: number, t: number): V3 {
  const { p, s } = POLI_SALIDA;
  const L = s[s.length - 1];
  let out: V3;
  if (sigma <= 0) out = [...p[0]] as V3;
  else if (sigma < L) {
    let lo = 0, hi = s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (s[m] <= sigma) lo = m; else hi = m; }
    out = mezcla(p[lo], p[hi], (sigma - s[lo]) / Math.max(1e-9, s[hi] - s[lo]));
  } else {
    // cola libre: sigue la última dirección y se curva despacio (hacia la cámara y abajo)
    const a = p[p.length - 2], b = p[p.length - 1];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
    const d: V3 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l];
    const e = sigma - L;
    out = [b[0] + d[0] * e - 0.012 * e * e, b[1] + d[1] * e - 0.03 * e * e, b[2] + d[2] * e + 0.004 * e * e];
  }
  // ondulación de la parte libre (crece al salir de la proteína)
  const libre = suave(L - 5, L + 2, sigma);
  if (libre > 0) {
    const amp = 0.7 * libre;
    out[0] += amp * Math.sin(0.5 * sigma + 0.42 * t);
    out[1] += amp * 0.7 * Math.sin(0.37 * sigma - 0.33 * t + 1.3);
    out[2] += amp * Math.sin(0.29 * sigma + 0.28 * t + 2.1);
  }
  return out;
}

// ═════════════════════════════ ribosoma ═════════════════════════════
//
// Marco del ribosoma: ARNm a lo largo de +x (5′ a la izquierda), entre la subunidad
// menor (40S, abajo) y la mayor (60S, arriba). El centro del codón del sitio P está en
// x = 0; el A queda a +1 codón (lado 3′) y el E a −1 codón. Los ARNt se levantan entre
// las subunidades: anticodón abajo, extremo CCA en el centro peptidiltransferasa (CPT).

/** Separación de los nucleótidos del ARNm en el canal (nm; monocatenario extendido). */
export const NT_ARNM = 0.6;
export const LARGO_CODON = 3 * NT_ARNM;
/** Desplazamiento (en codones) de cada sitio respecto al P. */
export const SITIOS = { E: -1, P: 0, A: 1 } as const;
export type Sitio = keyof typeof SITIOS;

/**
 * x (nm) del nucleótido m del marco abierto (m = 0 es la A del AUG) cuando el codón
 * kP está en el sitio P (kP continuo durante la translocación).
 */
export const xNucleotidoRibosoma = (m: number, kP: number) => (m - 3 * kP - 1) * NT_ARNM;

/** Centro del anticodón en un sitio (nm), justo encima del ARNm. */
export const anclaSitio = (s: Sitio): V3 => [SITIOS[s] * LARGO_CODON, 0.62, 0];

/** Centro peptidiltransferasa (nm): donde se encuentran los extremos CCA de los ARNt A y P. */
export const CPT: V3 = [0.9, 7.6, -2.35];
/** Inclinación (rad, en torno a z) de los ARNt A y P para que sus extremos CCA se junten en el CPT. */
export const INCLINACION_AP = Math.asin(0.9 / 7.05);

/** Túnel de salida: de CPT a la superficie de la 60S (≈ 10 nm). */
export function caminoTunel(sigma: number): V3 {
  const s = Math.max(0, sigma);
  return [CPT[0] - 0.28 * s - 0.01 * s * s, CPT[1] + 0.9 * s - 0.008 * s * s, CPT[2] - 0.32 * s];
}
export const LARGO_TUNEL = 10;

// ═════════════════════════════ secuencias que rodean al gen ═════════════════════════════
//
// El gen del reto es sólo el marco abierto (AUG … paro). En la escena el ADN sigue a los
// dos lados y el ARN lleva su 5′ UTR (ya transcrita al empezar, con el contexto de
// Kozak GCCACC justo antes del AUG) y, en el citoplasma, una 3′ UTR y la cola poli(A).
// Son FIJAS: no dependen del gen, así que no dicen nada de él.

const UTR5_ARN = 'AGGAACUCUUCUGGUCCCCACAGACUCAGAGAGAACCCGCCACC';
const ABAJO_ARN = 'CUGCCUAGCCCAACCUCGUUUCCCAAGGACUCCGAUCGGCUUCACUGGCCUGAACCAGGAGGCAGC';
const ARN_A_MOLDE: Record<string, string> = { A: 'T', U: 'A', C: 'G', G: 'C' };
const molde = (arn: string) => arn.split('').map((b) => ARN_A_MOLDE[b] ?? 'A').join('');

export const SECUENCIAS = {
  /** 5′ UTR (ARN, 5′→3′) */
  utr5: UTR5_ARN,
  /** ARN que seguiría al gen (3′ UTR) */
  utr3: ABAJO_ARN.slice(0, 24),
  /** hebra molde del promotor (antes del inicio de la transcripción) */
  promotorMolde: molde('GCGCUAUAAAAGGCCGCAGGCU'),
  /** hebra molde de la 5′ UTR */
  utr5Molde: molde(UTR5_ARN),
  /** hebra molde corriente abajo del gen */
  abajoMolde: molde(ABAJO_ARN),
  /** largo de la cola poli(A) que se dibuja */
  poliA: 26,
} as const;

// ═════════════════════════════ recorrido del ARNm en el ribosoma ═════════════════════════════

const X_CANAL = 8.5, R_CURVA = 10, PHI_MAX = 1.15;
/** Hacia dónde se curva cada extremo fuera del ribosoma (abajo y hacia la cámara). */
const CURVA_3P: V3 = [0, -0.78, 0.62];
const CURVA_5P: V3 = [0, -0.5, 0.86];

/**
 * Centro del ARNm a la abscisa lineal x (nm a lo largo de la molécula; x = 0 en el
 * sitio P): recto en el canal de la 40S (|x| ≤ 8,5 nm) y, fuera, un arco de 10 nm de
 * radio (conserva la longitud: la separación entre nucleótidos no cambia) seguido de
 * un tramo recto que ondula despacio (`t`, s).
 */
export function caminoARNm(x: number, t: number): V3 {
  const sg = x >= 0 ? 1 : -1;
  const d = Math.abs(x) - X_CANAL;
  if (d <= 0) return [x, 0, 0];
  const e2 = sg > 0 ? CURVA_3P : CURVA_5P;
  const phi = Math.min(d / R_CURVA, PHI_MAX);
  const resto = d - phi * R_CURVA;
  const a = R_CURVA * Math.sin(phi) + resto * Math.cos(phi);
  const b = R_CURVA * (1 - Math.cos(phi)) + resto * Math.sin(phi);
  const amp = 0.55 * suave(0, 7, d);
  return [
    sg * (X_CANAL + a) + amp * Math.sin(0.45 * d + 0.4 * t),
    e2[1] * b + amp * 0.8 * Math.sin(0.33 * d - 0.31 * t + 1.1),
    e2[2] * b + amp * Math.sin(0.27 * d + 0.26 * t + 2.3),
  ];
}
