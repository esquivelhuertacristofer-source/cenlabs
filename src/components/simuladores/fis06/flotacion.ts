/**
 * fis06/flotacion.ts — LA FÍSICA del tanque de Arquímedes (módulo puro: sin three ni React).
 *
 * Unidades SI (m, kg, s, N). Origen: el FONDO INTERIOR del tanque en y = 0 y el centro del
 * tanque en x = 0; el cuerpo se mueve en el plano x–y (sube, baja y gira alrededor de z) y
 * su centro de masa G se queda en x = 0.
 *
 * EL CUERPO es un prisma recto de sección rectangular b × h (plano x–y) y largo L (eje z):
 * el juego de cuatro bloques de IGUAL VOLUMEN (8 × 4 × 8 cm, 256 cm³) de la exploración, o
 * el cilindro problema del reto, que cuelga vertical y no gira (se trata como el prisma de
 * sección 2r × h y largo πr/2: mismo volumen, misma área de flotación πr², mismo calado).
 *
 * HIDROSTÁTICA EXACTA (en 2D, porque la sección no cambia a lo largo de z):
 *   · la sección sumergida es el polígono del rectángulo girado recortado por la superficie
 *     y = ys (Sutherland–Hodgman); V_sum = A·L y el centro de empuje B es su centroide;
 *   · E = ρ_l·g·V_sum, vertical, aplicado en B (Arquímedes);
 *   · el tanque es finito: el nivel ys cumple A_tanque·ys = V_agua + V_sum(ys) (Newton). El
 *     agua que «sube» al meter el cuerpo es exactamente el volumen desalojado.
 *
 * DINÁMICA (subpasos de ≤ 0,5 ms, Euler semimplícito):
 *   (m + m_a)·ÿ = −m·g + E + N + T − c_h·ẏ + F_arrastre
 *   (I + I_a)·θ̈ = (x_B − x_G)·E + τ_N + τ_T − c_θ·θ̇ − τ_viscoso
 * con masa añadida m_a = C_A·ρ_l·V_sum (C_A = ½, la de una esfera; declarado), amortiguamiento
 * por ondas radiadas con razón ζ = 0,12 sobre la rigidez de flotación, arrastre de la esfera de
 * igual volumen con la correlación de White, C_d = 24/Re + 6/(1 + √Re) + C∞ (C∞ = 1,05 del
 * bloque de caras planas), contacto con el fondo por penalización en las esquinas y, en el
 * reto, el muelle del dinamómetro (T = k·alargamiento, el hilo no empuja).
 *
 * Fuentes de datos: densidades a 20 °C del CRC Handbook (agua 998, etanol 789, glicerina
 * 1261 kg/m³, las del dominio), viscosidades (1,002 mPa·s; 1,20 mPa·s; 1,412 Pa·s), tensión
 * superficial (72,8; 22,3; 63,4 mN/m) e índices de refracción n_D (1,333; 1,361; 1,474).
 * Hielo 917 kg/m³ a 0 °C, aluminio 2700, hierro 7874 (CRC). Pino: 500 kg/m³, valor típico
 * de una madera de pino seca (varía de 350 a 600 kg/m³ según especie y humedad).
 */
import { G_TIERRA, FLUIDOS } from '@/domain/fisica';

export const G = G_TIERRA;
export type P2 = [number, number];

// ───────────────────────────── líquidos ─────────────────────────────

export type IdLiquido = 'agua' | 'alcohol' | 'glicerina';
export interface Liquido {
  id: IdLiquido;
  nombre: string;
  /** densidad (kg/m³) */
  rho: number;
  /** viscosidad dinámica (Pa·s) */
  mu: number;
  /** tensión superficial (N/m) */
  sigma: number;
  /** índice de refracción (línea D del sodio) */
  n: number;
}
export const LIQUIDOS: Record<IdLiquido, Liquido> = {
  agua: { id: 'agua', nombre: 'Agua', rho: FLUIDOS.agua.rho, mu: 1.002e-3, sigma: 0.0728, n: 1.333 },
  alcohol: { id: 'alcohol', nombre: 'Etanol', rho: FLUIDOS.alcohol.rho, mu: 1.2e-3, sigma: 0.0223, n: 1.361 },
  glicerina: { id: 'glicerina', nombre: 'Glicerina', rho: FLUIDOS.glicerina.rho, mu: 1.412, sigma: 0.0634, n: 1.474 },
};
export const esLiquido = (s: string): s is IdLiquido => s in LIQUIDOS;

// ───────────────────────────── materiales ─────────────────────────────

export type IdMaterial = 'pino' | 'hielo' | 'aluminio' | 'hierro';
export interface Material { id: IdMaterial; nombre: string; rho: number }
export const MATERIALES: Record<IdMaterial, Material> = {
  pino: { id: 'pino', nombre: 'Pino', rho: 500 },
  hielo: { id: 'hielo', nombre: 'Hielo', rho: 917 },
  aluminio: { id: 'aluminio', nombre: 'Aluminio', rho: 2700 },
  hierro: { id: 'hierro', nombre: 'Hierro', rho: 7874 },
};

// ───────────────────────────── tanque ─────────────────────────────

/** Medidas INTERIORES del tanque (m) y altura del agua sin cuerpo dentro. */
export const TANQUE = { largo: 0.32, ancho: 0.2, alto: 0.26, agua: 0.17 } as const;
export const AREA_TANQUE = TANQUE.largo * TANQUE.ancho;
export const V_AGUA = AREA_TANQUE * TANQUE.agua;

// ───────────────────────────── cuerpos ─────────────────────────────

export interface Cuerpo {
  /** ancho (x), alto (y) y largo (z) de la sección prismática (m) */
  b: number;
  h: number;
  L: number;
  rho: number;
  /** ¿puede girar? (el cilindro colgado no) */
  giro: boolean;
  /** coeficiente de arrastre a Reynolds alto */
  Cinf: number;
  forma: 'bloque' | 'cilindro';
  /** radio del cilindro (sólo forma = cilindro) */
  r: number;
}

/** Bloque del juego de igual volumen: 8 × 4 × 8 cm tumbado (de canto: 4 × 8 × 8 cm). */
export const BLOQUE = { largo: 0.08, alto: 0.04, fondo: 0.08 } as const;
export type Postura = 'tumbado' | 'canto';
export function bloque(material: IdMaterial, postura: Postura): Cuerpo {
  const tumbado = postura === 'tumbado';
  return {
    b: tumbado ? BLOQUE.largo : BLOQUE.alto, h: tumbado ? BLOQUE.alto : BLOQUE.largo, L: BLOQUE.fondo,
    rho: MATERIALES[material].rho, giro: true, Cinf: 1.05, forma: 'bloque', r: 0,
  };
}
/** Proporción del cilindro problema del reto: h = 2,8·r. */
export const ESBELTEZ_CILINDRO = 2.8;
export function dimensionesCilindro(V: number) {
  const r = Math.cbrt(V / (Math.PI * ESBELTEZ_CILINDRO));
  return { r, h: ESBELTEZ_CILINDRO * r };
}
export function cilindroProblema(V: number, rho: number): Cuerpo {
  const { r, h } = dimensionesCilindro(V);
  return { b: 2 * r, h, L: (Math.PI * r) / 2, rho, giro: false, Cinf: 0.85, forma: 'cilindro', r };
}
export const volumen = (c: Cuerpo) => c.b * c.h * c.L;
export const masa = (c: Cuerpo) => c.rho * volumen(c);
export const peso = (c: Cuerpo) => masa(c) * G;
/** Momento de inercia del prisma alrededor de su eje z por G. */
export const inercia = (c: Cuerpo) => (masa(c) * (c.b * c.b + c.h * c.h)) / 12;
/** Diámetro de la esfera de igual volumen (escala del arrastre). */
export const diametroEquivalente = (c: Cuerpo) => Math.cbrt((6 * volumen(c)) / Math.PI);

// ───────────────────────────── hidrostática ─────────────────────────────

/** Esquinas de la sección en el mundo (x_G = 0), en orden antihorario. */
export function esquinas(c: Cuerpo, y: number, th: number): P2[] {
  const co = Math.cos(th), si = Math.sin(th), hb = c.b / 2, hh = c.h / 2;
  const loc: P2[] = [[-hb, -hh], [hb, -hh], [hb, hh], [-hb, hh]];
  return loc.map(([a, b]) => [a * co - b * si, y + a * si + b * co]);
}

export interface Seccion {
  /** área sumergida de la sección (m²) */
  A: number;
  /** centroide de esa área: el centro de empuje B (m) */
  cx: number;
  cy: number;
  /** cuerda de flotación [x1, x2] (m); `corta` = la superficie corta el cuerpo */
  x1: number;
  x2: number;
  corta: boolean;
}

/** Recorta un polígono convexo por el semiplano y ≤ ys y devuelve área, centroide y cuerda. */
export function recortarPoligono(poly: P2[], ys: number): Seccion {
  const out: P2[] = [];
  let x1 = Infinity, x2 = -Infinity, cortes = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const P = poly[i], Q = poly[(i + 1) % n];
    const pin = P[1] <= ys, qin = Q[1] <= ys;
    if (pin) out.push(P);
    if (pin !== qin) {
      const t = (ys - P[1]) / (Q[1] - P[1]);
      const x = P[0] + t * (Q[0] - P[0]);
      out.push([x, ys]);
      x1 = Math.min(x1, x); x2 = Math.max(x2, x); cortes++;
    }
  }
  if (out.length < 3) return { A: 0, cx: 0, cy: ys, x1: 0, x2: 0, corta: false };
  let A2 = 0, sx = 0, sy = 0;
  for (let i = 0; i < out.length; i++) {
    const [xa, ya] = out[i], [xb, yb] = out[(i + 1) % out.length];
    const cr = xa * yb - xb * ya;
    A2 += cr; sx += (xa + xb) * cr; sy += (ya + yb) * cr;
  }
  const A = A2 / 2;
  if (!(Math.abs(A) > 1e-14)) return { A: 0, cx: 0, cy: ys, x1: 0, x2: 0, corta: false };
  const corta = cortes >= 2;
  return { A: Math.abs(A), cx: sx / (3 * A2), cy: sy / (3 * A2), x1: corta ? x1 : 0, x2: corta ? x2 : 0, corta };
}

export function seccionSumergida(c: Cuerpo, y: number, th: number, ys: number): Seccion {
  return recortarPoligono(esquinas(c, y, th), ys);
}

/** Empuje de Arquímedes (N). */
export const empuje = (rhoL: number, Vsum: number) => rhoL * G * Vsum;

/**
 * Nivel del agua con el cuerpo dentro: A_tanque·ys = V_agua + V_sum(ys). La función es
 * creciente (su derivada A_tanque − cuerda·L > 0), así que Newton con salvaguarda converge.
 */
export function nivelLibre(c: Cuerpo, y: number, th: number, Vagua: number, ys0?: number): { ys: number; sec: Seccion } {
  const lo0 = Vagua / AREA_TANQUE, hi0 = (Vagua + volumen(c)) / AREA_TANQUE;
  let lo = lo0, hi = hi0;
  let ys = ys0 !== undefined && ys0 >= lo && ys0 <= hi ? ys0 : lo;
  let sec = seccionSumergida(c, y, th, ys);
  for (let i = 0; i < 30; i++) {
    const g = AREA_TANQUE * ys - sec.A * c.L - Vagua;
    if (Math.abs(g) < 1e-13) break;
    if (g > 0) hi = ys; else lo = ys;
    const dg = AREA_TANQUE - (sec.corta ? (sec.x2 - sec.x1) * c.L : 0);
    let nuevo = ys - g / dg;
    // el corchete es CERRADO: con el cuerpo entero bajo el agua la raíz es justo hi0 (y fuera,
    // lo0). Con desigualdades estrictas el paso exacto de Newton se rechazaba y caía en 30
    // bisecciones (error 4 mm/2³⁰ ≈ 3,7·10⁻¹² m y 30 recortes por paso de integración).
    const dentro = Math.min(hi, Math.max(lo, nuevo));
    if (nuevo !== dentro) nuevo = Math.abs(nuevo - dentro) < 1e-12 ? dentro : (lo + hi) / 2;
    if (Math.abs(nuevo - ys) < 1e-14) { ys = nuevo; break; }
    ys = nuevo;
    sec = seccionSumergida(c, y, th, ys);
  }
  return { ys, sec };
}

// ───────────────────────────── equilibrio y estabilidad ─────────────────────────────

/** Fracción sumergida en equilibrio libre: ρ_c/ρ_l (1 si se hunde). */
export const fraccionEquilibrio = (rhoC: number, rhoL: number) => Math.min(1, rhoC / rhoL);
export const flota = (c: Cuerpo, liq: Liquido) => c.rho < liq.rho;

/**
 * Estabilidad inicial del prisma derecho (θ = 0) flotando: calado d = h·ρ_c/ρ_l,
 * KB = d/2, BM = I_flotación/V_sum = b²/(12·d), KG = h/2 y GM = KB + BM − KG.
 * GM > 0: un pequeño giro desplaza B hacia el lado hundido y el par endereza.
 */
export function alturaMetacentrica(c: Cuerpo, liq: Liquido) {
  const d = c.h * fraccionEquilibrio(c.rho, liq.rho);
  const KB = d / 2, BM = (c.b * c.b) / (12 * d), KG = c.h / 2;
  return { d, KB, BM, KG, GM: KB + BM - KG };
}

/**
 * Brazo adrizante GZ(θ) (m) del cuerpo libre en un lago (nivel fijo y = 0): se busca la
 * altura de G que desaloja m/ρ_l y GZ = −x_B (positivo = el par devuelve el cuerpo a θ = 0).
 */
export function brazoAdrizante(c: Cuerpo, liq: Liquido, th: number): number {
  const Vd = masa(c) / liq.rho;
  const Ad = Vd / c.L;
  let lo = -(c.b + c.h), hi = c.b + c.h;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    const s = seccionSumergida(c, m, th, 0);
    if (s.A > Ad) lo = m; else hi = m;
  }
  const s = seccionSumergida(c, (lo + hi) / 2, th, 0);
  return -s.cx;
}

// ───────────────────────────── constantes del modelo dinámico ─────────────────────────────

/** Coeficiente de masa añadida (el de una esfera; declarado). */
export const C_A = 0.5;
/** Razón de amortiguamiento por las ondas que irradia el cuerpo al subir y bajar. */
export const ZETA_ONDAS = 0.12;
/** Lo mismo para el balanceo. */
export const ZETA_BALANCEO = 0.12;
/** Rigidez y razón de amortiguamiento del contacto con el fondo (penalización por esquina). */
export const K_FONDO = 4e4;
export const ZETA_FONDO = 0.6;
/** Muelle del dinamómetro: recorrido de su escala (m) y amortiguamiento (roce del índice). */
export const ESCALA_DINAMOMETRO = 0.12;
export const ZETA_MUELLE = 0.18;
/** Hilo del dinamómetro al cuerpo (m) y holgura sobre el agua al 0 % (m). */
export const HILO = 0.03;
export const HOLGURA_AIRE = 0.03;
/** Al 100 % la tapa queda 4 mm bajo la superficie (las ondas no la destapan). */
export const MARGEN_SUMERGIDO = 0.004;
/** Subpaso mecánico máximo (s de modelo). */
export const DT_MECANICO = 0.0005;

/** Alcance del dinamómetro: el menor de la serie comercial que cubre el peso en el aire. */
export function alcanceDinamometro(W: number): number {
  return [5, 10, 20, 50].find((a) => a >= W * 1.02) ?? 50;
}
export const rigidezDinamometro = (alcance: number) => alcance / ESCALA_DINAMOMETRO;

/** Área proyectada contra el movimiento vertical (m²). */
export const areaVertical = (c: Cuerpo, th: number) => c.L * (Math.abs(c.b * Math.cos(th)) + Math.abs(c.h * Math.sin(th)));

/**
 * Fuerza de arrastre (N, módulo) a velocidad v sobre el cuerpo entero sumergido: la
 * correlación de White para la esfera de igual diámetro, con la parte de Stokes escrita
 * sin dividir por Re (24/Re·½ρAv² = 12·μ·A·v/D) y C∞ del bloque.
 */
export function arrastre(c: Cuerpo, liq: Liquido, v: number, A: number): number {
  const D = diametroEquivalente(c);
  const av = Math.abs(v);
  const Re = (liq.rho * av * D) / liq.mu;
  return (12 * liq.mu * A * av) / D + 0.5 * liq.rho * A * (6 / (1 + Math.sqrt(Re)) + c.Cinf) * av * av;
}

/** Velocidad límite (m/s) de un cuerpo que se hunde, cayendo tumbado (θ = 0). 0 si flota. */
export function velocidadTerminal(c: Cuerpo, liq: Liquido): number {
  const neto = (masa(c) - liq.rho * volumen(c)) * G;
  if (neto <= 0) return 0;
  const A = areaVertical(c, 0);
  let lo = 0, hi = 50;
  for (let i = 0; i < 100; i++) { const m = (lo + hi) / 2; if (arrastre(c, liq, m, A) > neto) hi = m; else lo = m; }
  return (lo + hi) / 2;
}

/**
 * Periodo de la oscilación vertical pequeña del cuerpo que flota derecho (s), sin
 * amortiguar: T₀ = 2π·√((m + m_a)/k) con k = ρ_l·g·A_f·A_tanque/(A_tanque − A_f) (al bajar
 * δ el nivel sube A_f·δ/(A_tanque − A_f): el tanque finito endurece el «muelle»).
 */
export function periodoVertical(c: Cuerpo, liq: Liquido): number {
  const m = masa(c);
  const Vd = Math.min(volumen(c), m / liq.rho);
  const Af = c.b * c.L;
  const k = liq.rho * G * Af * (AREA_TANQUE / (AREA_TANQUE - Af));
  return 2 * Math.PI * Math.sqrt((m + C_A * liq.rho * Vd) / k);
}
/** El mismo periodo con el amortiguamiento de las ondas (T = T₀/√(1 − ζ²)). */
export const periodoAmortiguado = (c: Cuerpo, liq: Liquido) => periodoVertical(c, liq) / Math.sqrt(1 - ZETA_ONDAS * ZETA_ONDAS);

// ───────────────────────────── estado y montaje ─────────────────────────────

export interface Montaje {
  c: Cuerpo;
  liq: Liquido;
  /** volumen de líquido en el tanque (m³) */
  Vagua: number;
  /** ¿cuelga del dinamómetro? */
  colgado: boolean;
  /** altura (m) del gancho del dinamómetro con el muelle sin estirar */
  ySoporte: number;
  /** rigidez del muelle del dinamómetro (N/m) */
  kMuelle: number;
}

export interface Estado {
  /** tiempo de modelo (s) */
  t: number;
  /** altura de G sobre el fondo (m), su velocidad, ángulo (rad, antihorario) y velocidad angular */
  y: number;
  vy: number;
  th: number;
  w: number;
  /** nivel medio de la superficie (m) */
  ys: number;
  /** volumen sumergido (m³), centro de empuje y cuerda de flotación */
  V: number;
  xB: number;
  yB: number;
  x1: number;
  x2: number;
  corta: boolean;
  /** fuerzas (N): peso, empuje, apoyo del fondo, tensión del hilo y arrastre (con signo) */
  P: number;
  E: number;
  N: number;
  T: number;
  Fd: number;
  /** alargamiento del muelle del dinamómetro (m, ≥ 0) */
  ext: number;
}

/** Estado vacío con la hidrostática del cuerpo en (y, θ). */
export function estadoEn(m: Montaje, y: number, th: number): Estado {
  const s: Estado = { t: 0, y, vy: 0, th, w: 0, ys: m.Vagua / AREA_TANQUE, V: 0, xB: 0, yB: 0, x1: 0, x2: 0, corta: false, P: 0, E: 0, N: 0, T: 0, Fd: 0, ext: 0 };
  evaluar(m, s);
  return s;
}

/** Media altura vertical del rectángulo girado (de G al punto más bajo). */
export const semialtura = (c: Cuerpo, th: number) => (Math.abs(c.b * Math.sin(th)) + Math.abs(c.h * Math.cos(th))) / 2;

/** El cuerpo, suelto desde `altura` (m) sobre la superficie en calma, inclinado `th0`. */
export function estadoSoltar(m: Montaje, altura = 0.015, th0 = (4 * Math.PI) / 180): Estado {
  const th = m.c.giro ? th0 : 0;
  return estadoEn(m, m.Vagua / AREA_TANQUE + altura + semialtura(m.c, th), th);
}

interface Fuerzas { Fy: number; tau: number; mEff: number; IEff: number }

/** Calcula hidrostática y fuerzas en la pose actual (las deja en `s`) y devuelve la dinámica. */
export function evaluar(m: Montaje, s: Estado, vSoporte = 0): Fuerzas {
  const { c, liq } = m;
  const masaC = masa(c);
  const { ys, sec } = nivelLibre(c, s.y, s.th, m.Vagua, s.ys);
  s.ys = ys;
  s.V = sec.A * c.L;
  s.xB = sec.cx; s.yB = sec.cy;
  s.x1 = sec.x1; s.x2 = sec.x2; s.corta = sec.corta;
  const Vtot = volumen(c);
  const frac = Math.min(1, s.V / Vtot);
  s.P = masaC * G;
  s.E = empuje(liq.rho, s.V);
  const mA = C_A * liq.rho * s.V;
  const mEff = masaC + mA;
  const I = inercia(c);
  const IEff = I * (1 + mA / masaC);
  let Fy = -s.P + s.E;
  let tau = c.giro ? sec.cx * s.E : 0;

  // ondas radiadas: amortiguamiento lineal sobre la rigidez de flotación (tanque finito)
  const Af = sec.corta ? (sec.x2 - sec.x1) * c.L : 0;
  if (Af > 0) {
    const kH = liq.rho * G * Af * (AREA_TANQUE / (AREA_TANQUE - Af));
    Fy -= 2 * ZETA_ONDAS * Math.sqrt(kH * mEff) * s.vy;
    if (c.giro) {
      const kR = liq.rho * G * (c.L * Math.pow(sec.x2 - sec.x1, 3)) / 12;
      tau -= 2 * ZETA_BALANCEO * Math.sqrt(kR * IEff) * s.w;
    }
  }
  // arrastre en el líquido (sólo la parte sumergida)
  if (frac > 0) {
    const Fd = arrastre(c, liq, s.vy, areaVertical(c, s.th)) * frac;
    s.Fd = -Math.sign(s.vy) * Fd;
    Fy += s.Fd;
    if (c.giro) tau -= frac * Math.PI * liq.mu * Math.pow(diametroEquivalente(c), 3) * s.w;
  } else s.Fd = 0;

  // fondo: penalización en las esquinas (y en el disco del cilindro)
  s.N = 0;
  const kc = K_FONDO, cc = 2 * ZETA_FONDO * Math.sqrt(K_FONDO * masaC);
  if (c.giro) {
    for (const [x, yc] of esquinas(c, s.y, s.th)) {
      if (yc >= 0) continue;
      const vC = s.vy + s.w * x;
      const F = Math.max(0, kc * -yc - cc * vC);
      s.N += F; Fy += F; tau += x * F;
    }
  } else {
    const yb = s.y - c.h / 2;
    if (yb < 0) { const F = Math.max(0, 2 * kc * -yb - 2 * cc * s.vy); s.N += F; Fy += F; }
  }

  // hilo y muelle del dinamómetro: el gancho está en ySoporte − alargamiento
  s.T = 0; s.ext = 0;
  if (m.colgado) {
    const co = Math.cos(s.th), si = Math.sin(s.th);
    const ax = -si * (c.h / 2), ay = s.y + co * (c.h / 2);
    const e = m.ySoporte - HILO - ay;
    if (e > 0) {
      const de = vSoporte - (s.vy + s.w * ax);
      const T = Math.max(0, m.kMuelle * e + 2 * ZETA_MUELLE * Math.sqrt(m.kMuelle * masaC) * de);
      s.T = T; s.ext = e;
      Fy += T;
      if (c.giro) tau += ax * T;
    }
  }
  return { Fy, tau, mEff, IEff };
}

/** Avanza el estado `dt` segundos de modelo (subpasos de ≤ DT_MECANICO). `vSoporte`: velocidad del soporte. */
export function avanzar(m: Montaje, s: Estado, dt: number, vSoporte = 0): Estado {
  const n = Math.max(1, Math.ceil(dt / DT_MECANICO));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    if (vSoporte) m.ySoporte += vSoporte * h;
    const f = evaluar(m, s, vSoporte);
    s.vy += (f.Fy / f.mEff) * h;
    s.y += s.vy * h;
    if (m.c.giro) {
      s.w += (f.tau / f.IEff) * h;
      s.th += s.w * h;
      if (s.th > Math.PI) s.th -= 2 * Math.PI; else if (s.th < -Math.PI) s.th += 2 * Math.PI;
    }
    s.t += h;
  }
  evaluar(m, s, vSoporte);
  return s;
}

// ───────────────────────────── reto: el dinamómetro ─────────────────────────────

/**
 * Altura del soporte (gancho sin carga) que deja el cilindro con la fracción `f` de su
 * altura bajo la superficie, en reposo: nivel ys = (V_agua + f·V)/A_tanque, base del
 * cilindro en ys − f·h, tensión T = m·g − ρ_l·g·f·V y alargamiento T/k. Con f = 0 el
 * cilindro cuelga HOLGURA_AIRE por encima del agua.
 */
export function soporteParaInmersion(c: Cuerpo, liq: Liquido, f: number, Vagua: number, k: number): number {
  const fr = Math.min(1, Math.max(0, f));
  const V = volumen(c);
  const ys = (Vagua + fr * V) / AREA_TANQUE;
  const yBase = fr > 0 ? ys - fr * c.h - (fr >= 1 ? MARGEN_SUMERGIDO : 0) : ys + HOLGURA_AIRE;
  const T = masa(c) * G - liq.rho * G * fr * V;
  return yBase + c.h + HILO + T / k;
}

/** Montaje del reto: el cilindro problema colgado del dinamómetro con la inmersión `f`. */
export function montajeReto(rho: number, V: number, liq: Liquido, f: number): Montaje {
  const c = cilindroProblema(V, rho);
  const k = rigidezDinamometro(alcanceDinamometro(peso(c)));
  return { c, liq, Vagua: V_AGUA, colgado: true, ySoporte: soporteParaInmersion(c, liq, f, V_AGUA, k), kMuelle: k };
}

/** Estado de reposo del cilindro colgado (para arrancar sin rebote). */
export function reposoColgado(m: Montaje, f: number): Estado {
  const { c } = m;
  const fr = Math.min(1, Math.max(0, f));
  const ys = (m.Vagua + fr * volumen(c)) / AREA_TANQUE;
  const yBase = fr > 0 ? ys - fr * c.h - (fr >= 1 ? MARGEN_SUMERGIDO : 0) : ys + HOLGURA_AIRE;
  return estadoEn(m, yBase + c.h / 2, 0);
}

// ───────────────────────────── menisco ─────────────────────────────

/** Longitud capilar l_c = √(σ/(ρ·g)) (m): agua 2,7 mm. */
export const longitudCapilar = (liq: Liquido) => Math.sqrt(liq.sigma / (liq.rho * G));
/** Altura que trepa el líquido por una pared vertical con ángulo de contacto θ: h₀ = l_c·√(2(1 − sen θ)). */
export const alturaMenisco = (liq: Liquido, theta = 0) => longitudCapilar(liq) * Math.sqrt(2 * (1 - Math.sin(theta)));
/**
 * Perfil EXACTO del menisco contra una pared vertical (solución de Laplace–Young en 2D):
 * distancia a la pared x (m) a la que la superficie está a la altura z (0 < z ≤ h₀):
 *   x(z) = l_c·[acosh(2l_c/z) − acosh(2l_c/h₀)] − √(4l_c² − z²) + √(4l_c² − h₀²).
 */
export function perfilMenisco(liq: Liquido, z: number, theta = 0): number {
  const lc = longitudCapilar(liq), h0 = alturaMenisco(liq, theta);
  const zz = Math.min(h0, Math.max(1e-9, z));
  return lc * (Math.acosh((2 * lc) / zz) - Math.acosh((2 * lc) / h0)) - Math.sqrt(4 * lc * lc - zz * zz) + Math.sqrt(4 * lc * lc - h0 * h0);
}
