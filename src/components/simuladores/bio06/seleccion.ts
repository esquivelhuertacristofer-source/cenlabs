/**
 * bio06/seleccion.ts — LA CIENCIA del lab de selección natural (módulo puro: sin three ni React;
 * lo prueba `src/__tests__/bio06-seleccion.test.ts`).
 *
 * La polilla del abedul (Biston betularia) en un bosque que el hollín ennegrece. Un locus con dos
 * alelos: C (forma carbonaria, oscura) DOMINANTE sobre c (forma typica, clara). Una generación por
 * año (la especie es univoltina).
 *
 *  · CAMUFLAJE. El ave ve el CONTRASTE de Michelson entre el ala y la corteza,
 *    C = |R_ala − R_corteza|/(R_ala + R_corteza), con los albedos (reflectancia media en el visible).
 *    La corteza es una mezcla por ÁREA: R(h) = (1 − h)·R_líquenes + h·R_hollín, con h la fracción
 *    cubierta de hollín. La escena pinta exactamente esa cobertura y esos albedos.
 *  · DEPREDACIÓN. El riesgo acumulado de la temporada crece con el contraste y con el número de
 *    aves: Λ = λ·aves·(c₀ + C) y la supervivencia (viabilidad) es v = e^(−Λ). La eficacia
 *    biológica relativa es w = v/v_max y el coeficiente de selección s = 1 − w del peor fenotipo.
 *  · ECUACIÓN DE LA SELECCIÓN. Con eficacias de genotipo w_CC, w_Cc, w_cc y apareamiento al azar:
 *    w̄ = p²w_CC + 2pq·w_Cc + q²w_cc, w₁ = p·w_CC + q·w_Cc (eficacia marginal de C), p′ = p·w₁/w̄.
 *  · WRIGHT–FISHER. Tras la selección, los N hijos se forman con 2N gametos tomados al azar del
 *    acervo de los supervivientes: el número de copias de C es Binomial(2N, p_s) y cada hijo es
 *    CC, Cc o cc con p_s², 2p_s·q_s, q_s² (Hardy–Weinberg). La deriva tiene varianza p(1 − p)/(2N)
 *    por generación (2N = número de copias del gen).
 *  · MODELO INDIVIDUAL (el que se ve). Cada polilla vive o muere por un sorteo de Bernoulli con su
 *    viabilidad (el ave decide de verdad a quién come); su valor esperado es la ecuación de arriba
 *    y su varianza neutra es ≈ p(1 − p)/(2N·v): sólo los supervivientes dejan genes.
 *  · FIJACIÓN. Neutral: P(fijar) = p₀ y tiempo medio de absorción t̄ = −4N[p ln p + q ln q]
 *    (Kimura y Ohta, 1969). Con selección aditiva: u(p) = (1 − e^(−4Nsp))/(1 − e^(−4Ns)) (Kimura, 1962).
 */
import { crearPoblacionB6, reproducirB6, CUOTA_CAZA_B6, N_POLILLAS_B6, type Rng } from '@/domain/biologia';
import type { GenotipoB6 } from '@/store/types';

export type { Rng };
export type Genotipo = GenotipoB6;
export type Fenotipo = 'clara' | 'oscura';

// ───────────────────────────── azar reproducible ─────────────────────────────

/** mulberry32: el mismo generador que usa el dominio (`rngConSemilla`). */
export function rngSemilla(semilla: number): Rng {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Binomial(n, p) exacta: suma de n ensayos de Bernoulli (n ≤ unos miles en este lab). */
export function binomial(n: number, p: number, rng: Rng): number {
  if (!(p > 0) || n <= 0) return 0;
  if (p >= 1) return n;
  let k = 0;
  for (let i = 0; i < n; i++) if (rng() < p) k++;
  return k;
}

// ───────────────────────────── camuflaje (óptica) ─────────────────────────────

/**
 * Albedos medios en el visible (0–1). Orden de magnitud de la corteza de roble con líquenes
 * foliosos y crustáceos frente a la ennegrecida por hollín, y de las dos formas de la polilla
 * (typica: blanca con motas negras; carbonaria: casi negra). La escena usa EXACTAMENTE estos.
 */
export const ALBEDO = { liquenes: 0.40, hollin: 0.055, typica: 0.38, carbonaria: 0.06 } as const;

export const albedoFenotipo = (f: Fenotipo) => (f === 'clara' ? ALBEDO.typica : ALBEDO.carbonaria);
const sat01 = (x: number) => Math.min(1, Math.max(0, x));

/** Albedo medio de la corteza con una fracción h (0–1) de su ÁREA cubierta de hollín. */
export function albedoCorteza(h: number): number {
  const k = sat01(h);
  return (1 - k) * ALBEDO.liquenes + k * ALBEDO.hollin;
}

/** Contraste de Michelson entre dos albedos. */
export function contraste(a: number, b: number): number {
  const s = a + b;
  return s > 0 ? Math.abs(a - b) / s : 0;
}

export const contrasteFenotipo = (f: Fenotipo, h: number) => contraste(albedoFenotipo(f), albedoCorteza(h));

/** Hollín con el que las dos formas contrastan igual (el cruce de las curvas de supervivencia). */
export function hollinNeutro(): number {
  let a = 0, b = 1;
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2;
    if (contrasteFenotipo('clara', m) - contrasteFenotipo('oscura', m) < 0) a = m; else b = m;
  }
  return (a + b) / 2;
}

// ───────────────────────────── depredación ─────────────────────────────

/**
 * Riesgo por temporada: Λ = λ·aves·(c₀ + C). Con 3 aves y la corteza negra (C de la typica ≈ 0,75)
 * la typica sobrevive la mitad que la carbonaria (s ≈ 0,47, el orden de las recapturas de Kettlewell,
 * 1955); con 90 % de hollín, s ≈ 0,31, el valor que Haldane (1924) dedujo para Mánchester.
 */
export const DEPREDACION = { lambdaPorAve: 0.30, c0: 0.20, avesMax: 3 } as const;

export function riesgoTemporada(c: number, aves: number): number {
  return DEPREDACION.lambdaPorAve * Math.max(0, aves) * (DEPREDACION.c0 + c);
}

/** Viabilidad (probabilidad de sobrevivir a la temporada de caza) de un fenotipo. */
export function viabilidad(f: Fenotipo, h: number, aves: number): number {
  return Math.exp(-riesgoTemporada(contrasteFenotipo(f, h), aves));
}

export interface Eficacias { CC: number; Cc: number; cc: number }

/** Viabilidades por genotipo: C es dominante (CC y Cc son oscuras). */
export function viabilidadesGenotipo(h: number, aves: number): Eficacias {
  const vo = viabilidad('oscura', h, aves), vc = viabilidad('clara', h, aves);
  return { CC: vo, Cc: vo, cc: vc };
}

export interface Seleccion {
  vClara: number; vOscura: number;
  /** eficacias relativas (la mejor = 1) */
  wClara: number; wOscura: number;
  /** coeficiente de selección contra el fenotipo desfavorecido (0 si no hay) */
  s: number;
  favorecido: Fenotipo | null;
}

export function seleccionDe(h: number, aves: number): Seleccion {
  const vClara = viabilidad('clara', h, aves), vOscura = viabilidad('oscura', h, aves);
  const m = Math.max(vClara, vOscura);
  const wClara = vClara / m, wOscura = vOscura / m;
  const s = 1 - Math.min(wClara, wOscura);
  const favorecido: Fenotipo | null = s < 1e-9 ? null : wOscura > wClara ? 'oscura' : 'clara';
  return { vClara, vOscura, wClara, wOscura, s, favorecido };
}

// ───────────────────────────── genética de poblaciones ─────────────────────────────

export const fenotipoDe = (g: Genotipo): Fenotipo => (g.includes('C') ? 'oscura' : 'clara');

/** Frecuencias genotípicas de Hardy–Weinberg [CC, Cc, cc]. */
export function hardyWeinberg(p: number): [number, number, number] {
  const q = 1 - p;
  return [p * p, 2 * p * q, q * q];
}

export function wMedia(p: number, w: Eficacias): number {
  const q = 1 - p;
  return p * p * w.CC + 2 * p * q * w.Cc + q * q * w.cc;
}

/** Eficacia marginal del alelo C: w₁ = p·w_CC + q·w_Cc. */
export function wMarginalC(p: number, w: Eficacias): number {
  return p * w.CC + (1 - p) * w.Cc;
}

/** Ecuación de la selección: p′ = p·w₁/w̄ (las eficacias pueden ser absolutas o relativas). */
export function pSiguiente(p: number, w: Eficacias): number {
  const wb = wMedia(p, w);
  if (!(wb > 0)) return p;
  return sat01((p * wMarginalC(p, w)) / wb);
}

export function trayectoriaDeterminista(p0: number, w: Eficacias, generaciones: number): number[] {
  const out = [sat01(p0)];
  for (let g = 0; g < generaciones; g++) out.push(pSiguiente(out[out.length - 1], w));
  return out;
}

/** Generaciones deterministas hasta que p cruza `meta` (hacia arriba o hacia abajo); Infinity si no llega. */
export function generacionesHasta(p0: number, w: Eficacias, meta: number, max = 5000): number {
  let p = p0;
  const sube = meta > p0;
  for (let g = 0; g <= max; g++) {
    if (sube ? p >= meta : p <= meta) return g;
    p = pSiguiente(p, w);
  }
  return Infinity;
}

/** Varianza de la deriva en una generación: p(1 − p)/n, con n las copias del gen muestreadas (2N). */
export const varianzaDeriva = (p: number, nCopias: number) => (p * (1 - p)) / nCopias;

/** Tiempo medio hasta la absorción (fijar o perder) de un alelo neutro (Kimura y Ohta 1969). */
export function tiempoAbsorcionNeutral(p: number, N: number): number {
  if (p <= 0 || p >= 1) return 0;
  const q = 1 - p;
  return -4 * N * (p * Math.log(p) + q * Math.log(q));
}

/** Tiempo medio hasta la FIJACIÓN de un alelo neutro, condicionado a que se fije. */
export function tiempoFijacionNeutral(p: number, N: number): number {
  if (p <= 0) return Infinity;
  if (p >= 1) return 0;
  const q = 1 - p;
  return (-4 * N * q * Math.log(q)) / p;
}

/** Probabilidad de fijación con selección aditiva (s por copia; Kimura 1962). s → 0: p. */
export function probFijacionKimura(p: number, N: number, s: number): number {
  const a = 4 * N * s;
  if (Math.abs(a) < 1e-9) return p;
  return -Math.expm1(-a * p) / -Math.expm1(-a);
}

// ───────────────────────────── Wright–Fisher clásico (por frecuencias) ─────────────────────────────

/** Una generación de Wright–Fisher: selección determinista y muestreo binomial de 2N gametos. */
export function pasoWF(p: number, N: number, w: Eficacias, rng: Rng): number {
  return binomial(2 * N, pSiguiente(p, w), rng) / (2 * N);
}

// ───────────────────────────── modelo individual (el que se ve) ─────────────────────────────

export interface Conteo { CC: number; Cc: number; cc: number }

export const totalConteo = (c: Conteo) => c.CC + c.Cc + c.cc;
export function frecuenciaCConteo(c: Conteo): number {
  const n = totalConteo(c);
  return n > 0 ? (2 * c.CC + c.Cc) / (2 * n) : 0;
}
export function conteoDe(gs: readonly Genotipo[]): Conteo {
  const c: Conteo = { CC: 0, Cc: 0, cc: 0 };
  for (const g of gs) c[g]++;
  return c;
}
export function frecuenciaC(gs: readonly Genotipo[]): number { return frecuenciaCConteo(conteoDe(gs)); }

/** Un hijo de Hardy–Weinberg: dos gametos independientes, cada uno C con probabilidad p. */
export function hijoHW(p: number, rng: Rng): Genotipo {
  const a = rng() < p, b = rng() < p;
  return a && b ? 'CC' : a || b ? 'Cc' : 'cc';
}

/** N hijos de Wright–Fisher a partir del acervo de los supervivientes (frecuencia p_s). */
export function reproducir(pS: number, N: number, rng: Rng): Genotipo[] {
  return Array.from({ length: N }, () => hijoHW(pS, rng));
}

/** Población de N con exactamente round(2N·p) copias de C repartidas al azar (sin deriva de partida). */
export function poblacionInicial(p: number, N: number, rng: Rng): Genotipo[] {
  const nC = Math.round(2 * N * sat01(p));
  const al = Array.from({ length: 2 * N }, (_, i) => i < nC);
  for (let i = al.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [al[i], al[j]] = [al[j], al[i]]; }
  return Array.from({ length: N }, (_, i) => (al[2 * i] && al[2 * i + 1] ? 'CC' : al[2 * i] || al[2 * i + 1] ? 'Cc' : 'cc'));
}

/** Sorteo de la temporada: cada individuo muere con probabilidad 1 − v de su genotipo. */
export function sortearMuertes(gs: readonly Genotipo[], v: Eficacias, rng: Rng): boolean[] {
  return gs.map((g) => rng() >= v[g]);
}

/** Frecuencia de C en los supervivientes; si no sobrevive nadie, el bosque se repuebla con la previa. */
export function frecuenciaSupervivientes(gs: readonly Genotipo[], muere: readonly boolean[]): number {
  const vivos = gs.filter((_, i) => !muere[i]);
  return vivos.length ? frecuenciaC(vivos) : frecuenciaC(gs);
}

/** Generación completa por conteos (lo mismo que hace la escena, sin posiciones): selección + WF. */
export function generacionConteo(c: Conteo, v: Eficacias, Nhijos: number, rng: Rng): Conteo {
  const s: Conteo = { CC: binomial(c.CC, v.CC, rng), Cc: binomial(c.Cc, v.Cc, rng), cc: binomial(c.cc, v.cc, rng) };
  const pS = totalConteo(s) > 0 ? frecuenciaCConteo(s) : frecuenciaCConteo(c);
  // hijos multinomiales de HW: CC ~ Bin(N, p²), Cc ~ Bin(N − CC, 2pq/(1 − p²))
  const [fCC, fCc] = hardyWeinberg(pS);
  const CC = binomial(Nhijos, fCC, rng);
  const resto = 1 - fCC;
  const Cc = resto > 0 ? binomial(Nhijos - CC, fCc / resto, rng) : 0;
  return { CC, Cc, cc: Nhijos - CC - Cc };
}

/** Conteo esperado de HW para una población de N con frecuencia p (redondeado al entero). */
export function conteoHW(p: number, N: number, rng?: Rng): Conteo {
  if (rng) return conteoDe(reproducir(p, N, rng));
  const [a, b] = hardyWeinberg(p);
  const CC = Math.round(N * a), Cc = Math.round(N * b);
  return { CC, Cc, cc: N - CC - Cc };
}

// ───────────────────────────── pronóstico: muchas réplicas ─────────────────────────────

export interface CuantilGen { g: number; p05: number; p25: number; p50: number; p75: number; p95: number; media: number }
export interface Pronostico {
  /** generación de partida */
  g0: number;
  cuantiles: CuantilGen[];
  /** curva determinista p′ = p·w₁/w̄ desde la misma p */
  det: number[];
  replicas: number;
  /** fracción de réplicas que fijan / pierden C antes del horizonte */
  fijaC: number;
  pierdeC: number;
  /** generaciones medias hasta fijar C (sólo las que fijan; NaN si ninguna) */
  tFijaC: number;
  tPierdeC: number;
  horizonte: number;
}

function cuantil(ordenado: number[], q: number): number {
  const i = (ordenado.length - 1) * q;
  const a = Math.floor(i), b = Math.ceil(i);
  return ordenado[a] + (ordenado[b] - ordenado[a]) * (i - a);
}

/**
 * R réplicas del MISMO modelo individual (selección por sorteo + Wright–Fisher) desde el mismo
 * conteo inicial: la banda de deriva es el intervalo 5–95 % de las réplicas en cada generación.
 */
export function pronosticar(o: {
  inicio: Conteo; v: Eficacias; N: number; g0?: number; horizonte?: number; replicas?: number; semilla?: number;
}): Pronostico {
  const H = o.horizonte ?? 120, R = o.replicas ?? 240, g0 = o.g0 ?? 0;
  const rng = rngSemilla(o.semilla ?? 12345);
  const p0 = frecuenciaCConteo(o.inicio);
  const tray: Float64Array[] = Array.from({ length: H + 1 }, () => new Float64Array(R));
  let fija = 0, pierde = 0, tF = 0, tP = 0;
  for (let r = 0; r < R; r++) {
    let c = { ...o.inicio };
    let p = p0;
    let absorbida = p <= 0 || p >= 1;
    tray[0][r] = p;
    for (let g = 1; g <= H; g++) {
      if (!absorbida) {
        c = generacionConteo(c, o.v, o.N, rng);
        p = frecuenciaCConteo(c);
        if (p >= 1) { absorbida = true; fija++; tF += g; } else if (p <= 0) { absorbida = true; pierde++; tP += g; }
      }
      tray[g][r] = p;
    }
  }
  const cuantiles: CuantilGen[] = tray.map((fila, g) => {
    const s = Array.from(fila).sort((a, b) => a - b);
    let m = 0; for (const x of s) m += x;
    return { g: g0 + g, p05: cuantil(s, 0.05), p25: cuantil(s, 0.25), p50: cuantil(s, 0.5), p75: cuantil(s, 0.75), p95: cuantil(s, 0.95), media: m / s.length };
  });
  return {
    g0, cuantiles, det: trayectoriaDeterminista(p0, o.v, H), replicas: R, horizonte: H,
    fijaC: fija / R, pierdeC: pierde / R, tFijaC: fija ? tF / fija : NaN, tPierdeC: pierde ? tP / pierde : NaN,
  };
}

// ───────────────────────────── el reto (la caza del alumno) ─────────────────────────────

/** q estimada a partir del fenotipo recesivo, como un naturalista: q ≈ √f(claras). */
export const qEstimada = (fClaras: number) => Math.sqrt(Math.max(0, Math.min(1, fClaras)));

/**
 * Banda neutra del reto: qué hace q estimada si el ave cazara AL AZAR (16 de 40 por generación) con
 * las MISMAS funciones del juez (`crearPoblacionB6`, `reproducirB6`). Es simétrica: no dice qué
 * fenotipo conviene cazar, sólo cuánto puede moverse q por pura deriva.
 */
export function bandaNeutraReto(o: { pC0: number; generaciones: number; replicas?: number; semilla?: number; inicial?: readonly Genotipo[] }) {
  const R = o.replicas ?? 400, G = o.generaciones;
  const rng = rngSemilla(o.semilla ?? 777);
  const filas: number[][] = Array.from({ length: G + 1 }, () => []);
  for (let r = 0; r < R; r++) {
    let pob = o.inicial
      ? o.inicial.map((g, i) => ({ id: i, genotipo: g, tipo: fenotipoDe(g), x: 0, y: 0, angle: 0, cazada: false }))
      : crearPoblacionB6(o.pC0, N_POLILLAS_B6, rng);
    filas[0].push(qEstimada(pob.filter((b) => b.tipo === 'clara').length / pob.length));
    for (let g = 1; g <= G; g++) {
      // el ave al azar: 16 distintas, sin mirar la corteza
      const idx = pob.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      const caz = new Set(idx.slice(0, CUOTA_CAZA_B6));
      pob = reproducirB6(pob.map((b, i) => ({ ...b, cazada: caz.has(i) })), N_POLILLAS_B6, rng);
      filas[g].push(qEstimada(pob.filter((b) => b.tipo === 'clara').length / pob.length));
    }
  }
  return filas.map((f, g) => {
    const s = [...f].sort((a, b) => a - b);
    return { g, p05: cuantil(s, 0.05), p50: cuantil(s, 0.5), p95: cuantil(s, 0.95) };
  });
}

/**
 * Lo que hizo la caza del alumno en una generación, a partir del registro del juez: con la
 * selectividad σ = (cazadas conspicuas)/cuota − f_conspicuas se recupera cuántas conspicuas cazó.
 */
export function supervivenciaRealizada(fConspicuas: number, selectividad: number, cuota = CUOTA_CAZA_B6, N = N_POLILLAS_B6) {
  const nC = Math.round(fConspicuas * N), nI = N - nC;
  const kC = Math.min(nC, Math.max(0, Math.round(cuota * (selectividad + fConspicuas))));
  const kI = cuota - kC;
  return {
    vConspicua: nC > 0 ? (nC - kC) / nC : NaN,
    vCamuflada: nI > 0 ? (nI - kI) / nI : NaN,
    cazadasConspicuas: kC, cazadasCamufladas: kI,
  };
}
