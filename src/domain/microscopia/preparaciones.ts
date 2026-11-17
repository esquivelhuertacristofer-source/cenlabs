/**
 * Las preparaciones del microscopio como DATOS puros (sin lienzo): posiciones y
 * tamaños en micrómetros, deterministas a partir de la semilla del intento.
 *
 * Cada célula se deduce de su índice de rejilla con un hash entero: la MISMA
 * preparación se ve igual a 4×, 10×, 40× y 100× y al mover la platina; lo único que
 * cambia es la ventana de mundo que se pide. De aquí salen tanto el dibujo del
 * visor como la «verdad» con la que el juez compara los conteos y medidas.
 *
 * Ejes: x hacia la derecha, y hacia abajo de la pantalla.
 */

/** Hash entero → [0, 1). Determinista, sin estado. */
export function hash(i: number, j: number, k = 0): number {
  let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

/** Hash con semilla del intento. */
export function hs(semilla: number, i: number, j: number, k = 0): number {
  return hash(i + Math.imul(semilla | 0, 7919), j - Math.imul(semilla | 0, 104729), k + (semilla | 0));
}

/** Ruido de valor 2D suave (bilineal con suavizado), en [0, 1). */
export function ruido(semilla: number, x: number, y: number, k = 0): number {
  const i = Math.floor(x), j = Math.floor(y);
  const fx = x - i, fy = y - j;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hs(semilla, i, j, k), b = hs(semilla, i + 1, j, k), c = hs(semilla, i, j + 1, k), d = hs(semilla, i + 1, j + 1, k);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

export interface Rect { x0: number; y0: number; x1: number; y1: number }
export const rectCentrado = (cx: number, cy: number, lado: number): Rect => ({ x0: cx - lado / 2, y0: cy - lado / 2, x1: cx + lado / 2, y1: cy + lado / 2 });
const dentro = (r: Rect, x: number, y: number) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1;

// ═══════════════════════ 1 · Frotis sanguíneo (Giemsa) con Plasmodium ═══════════════════════

export type TipoLeucocito = 'neutrofilo' | 'linfocito' | 'eosinofilo' | 'monocito';
export interface Leucocito { x: number; y: number; r: number; tipo: TipoLeucocito; i: number; j: number }
export interface Eritrocito {
  x: number; y: number;
  /** radio (µm): un eritrocito mide 7–8 µm de diámetro */
  r: number;
  /** anillos de Plasmodium dentro de la célula (0 = sana) */
  parasitos: 0 | 1 | 2;
  i: number; j: number;
}
export const SANGRE = { paso: 8.3, pasoLeuco: 105 } as const;

/** Fracción de eritrocitos parasitados de la preparación (5–14 %). */
export const parasitemiaSangre = (semilla: number): number => 0.05 + hs(semilla, 11, 3, 901) * 0.09;

export function leucocitosSangre(semilla: number, r: Rect, margen = 20): Leucocito[] {
  const p = SANGRE.pasoLeuco;
  const out: Leucocito[] = [];
  for (let j = Math.floor((r.y0 - margen) / p); j <= Math.floor((r.y1 + margen) / p); j++)
    for (let i = Math.floor((r.x0 - margen) / p); i <= Math.floor((r.x1 + margen) / p); i++) {
      if (hs(semilla, i, j, 700) > 0.3) continue;
      const t = hs(semilla, i, j, 701);
      const tipo: TipoLeucocito = t < 0.58 ? 'neutrofilo' : t < 0.88 ? 'linfocito' : t < 0.95 ? 'monocito' : 'eosinofilo';
      const radio = tipo === 'linfocito' ? 4.4 + hs(semilla, i, j, 702) * 0.8 : tipo === 'monocito' ? 8 + hs(semilla, i, j, 702) : 6.2 + hs(semilla, i, j, 702) * 0.9;
      out.push({ x: (i + 0.15 + hs(semilla, i, j, 703) * 0.7) * p, y: (j + 0.15 + hs(semilla, i, j, 704) * 0.7) * p, r: radio, tipo, i, j });
    }
  return out;
}

export function eritrocitosSangre(semilla: number, r: Rect, margen = 6): Eritrocito[] {
  const p = SANGRE.paso, py = p * 0.9;
  // leucocitos por celda de su rejilla: cada eritrocito sólo consulta las 9 celdas vecinas
  const pl = SANGRE.pasoLeuco;
  const leucos = new Map<number, Leucocito>();
  for (const l of leucocitosSangre(semilla, r, margen + pl)) leucos.set(l.i * 131071 + l.j, l);
  const frac = parasitemiaSangre(semilla);
  const out: Eritrocito[] = [];
  for (let j = Math.floor((r.y0 - margen) / py) - 1; j <= Math.floor((r.y1 + margen) / py) + 1; j++) {
    const corr = (j & 1) * 0.5;
    for (let i = Math.floor((r.x0 - margen) / p) - 1; i <= Math.floor((r.x1 + margen) / p) + 1; i++) {
      const x = (i + corr + (hs(semilla, i, j, 1) - 0.5) * 0.62) * p;
      const y = (j + (hs(semilla, i, j, 2) - 0.5) * 0.62) * py;
      // El frotis no es uniforme: zonas más ralas y más densas a escala de décimas de milímetro.
      const hueco = 0.1 + 0.34 * ruido(semilla, x / 260, y / 260, 5) ** 2;
      if (hs(semilla, i, j, 3) < hueco) continue;
      if (x < r.x0 - margen || x > r.x1 + margen || y < r.y0 - margen || y > r.y1 + margen) continue;
      const radio = 3.55 + hs(semilla, i, j, 4) * 0.5;
      let tapado = false;
      const li = Math.floor(x / pl), lj = Math.floor(y / pl);
      for (let dj = -1; dj <= 1 && !tapado; dj++) for (let di = -1; di <= 1; di++) {
        const l = leucos.get((li + di) * 131071 + lj + dj); if (!l) continue;
        const dx = x - l.x, dy = y - l.y, d = l.r + radio * 0.75;
        if (dx * dx + dy * dy < d * d) { tapado = true; break; }
      }
      if (tapado) continue;
      const h = hs(semilla, i, j, 6);
      const parasitos = h < frac ? (hs(semilla, i, j, 7) < 0.16 ? 2 : 1) : 0;
      out.push({ x, y, r: radio, parasitos, i, j });
    }
  }
  return out;
}

/** Lo que hay dentro del marco de conteo: eritrocitos cuyo centro cae en el cuadrado. */
export function contarSangre(semilla: number, marco: Rect): { total: number; parasitados: number } {
  let total = 0, parasitados = 0;
  for (const e of eritrocitosSangre(semilla, marco, 0)) if (dentro(marco, e.x, e.y)) { total++; if (e.parasitos) parasitados++; }
  return { total, parasitados };
}

// ═══════════════════════ 2 · Tinción de Gram ═══════════════════════

export type BacteriaGram = 'estafilococo' | 'estreptococo' | 'bacilo_pos' | 'bacilo_neg' | 'diplococo_neg';
export const GRAM_POSITIVAS: readonly BacteriaGram[] = ['estafilococo', 'estreptococo', 'bacilo_pos'];
export const GRAM_NEGATIVAS: readonly BacteriaGram[] = ['bacilo_neg', 'diplococo_neg'];
export const ORDEN_GRAM: readonly BacteriaGram[] = ['estafilococo', 'estreptococo', 'bacilo_pos', 'bacilo_neg', 'diplococo_neg'];
export const GRAM = { chunk: 46, fraccionDominante: 0.76 } as const;

/** La muestra lleva siempre una bacteria Gram positiva y otra Gram negativa; una de las dos domina. */
export function mezclaGram(semilla: number): { dominante: BacteriaGram; secundaria: BacteriaGram } {
  const pos = GRAM_POSITIVAS[Math.floor(hs(semilla, 5, 9, 810) * GRAM_POSITIVAS.length)];
  const neg = GRAM_NEGATIVAS[Math.floor(hs(semilla, 6, 9, 811) * GRAM_NEGATIVAS.length)];
  return hs(semilla, 7, 9, 812) < 0.5 ? { dominante: pos, secundaria: neg } : { dominante: neg, secundaria: pos };
}

export interface ColoniaGram { x: number; y: number; tipo: BacteriaGram; n: number; ang: number; i: number; j: number; c: number }

/** Agrupaciones (racimo, cadena, par o bacilos sueltos); cada una se despliega en células al dibujar. */
export function coloniasGram(semilla: number, r: Rect, margen = 18): ColoniaGram[] {
  const { chunk, fraccionDominante } = GRAM;
  const { dominante, secundaria } = mezclaGram(semilla);
  const out: ColoniaGram[] = [];
  for (let j = Math.floor((r.y0 - margen) / chunk); j <= Math.floor((r.y1 + margen) / chunk); j++)
    for (let i = Math.floor((r.x0 - margen) / chunk); i <= Math.floor((r.x1 + margen) / chunk); i++) {
      const n = 1 + Math.floor(hs(semilla, i, j, 20) * 6.5 * (0.35 + ruido(semilla, i / 5, j / 5, 21) * 1.4));
      for (let c = 0; c < n; c++) {
        const tipo = hs(semilla, i, j, 30 + c) < fraccionDominante ? dominante : secundaria;
        const u = hs(semilla, i, j, 50 + c);
        const cuenta = tipo === 'estafilococo' ? 4 + Math.floor(u * u * 38) : tipo === 'estreptococo' ? 4 + Math.floor(u * 14)
          : tipo === 'bacilo_pos' ? 1 + Math.floor(u * 5) : tipo === 'bacilo_neg' ? 2 + Math.floor(u * 9) : 1 + Math.floor(u * 4);
        out.push({ x: (i + hs(semilla, i, j, 60 + c)) * chunk, y: (j + hs(semilla, i, j, 70 + c)) * chunk, tipo, n: cuenta, ang: hs(semilla, i, j, 80 + c) * Math.PI * 2, i, j, c });
      }
    }
  return out;
}

// ═══════════════════════ 3 · Mitosis en la punta de la raíz de cebolla ═══════════════════════

export type FaseMitosis = 'interfase' | 'profase' | 'metafase' | 'anafase' | 'telofase';
export type ZonaRaiz = 'cofia' | 'meristemo' | 'elongacion';
export interface CelulaRaiz {
  /** centro (µm) */
  x: number; y: number;
  /** ancho (a lo ancho de la raíz) y largo (a lo largo del eje) */
  w: number; h: number;
  fase: FaseMitosis; zona: ZonaRaiz;
  fila: number; k: number;
}
/** Eje de la raíz vertical; la punta mira hacia abajo. yApice: ápice del meristemo; la cofia lo cubre. */
export const RAIZ = { pasoFila: 21, largo: 22, yApice: 620, cofia: 170, semiAncho: 370, curvatura: 250, finMeristemo: 900, finMitosis: 1250 } as const;

/** Índice mitótico del meristemo de esta preparación (10–22 %). */
export const indiceMitoticoRaiz = (semilla: number): number => 0.1 + hs(semilla, 2, 17, 820) * 0.12;

/** Semiancho del contorno a una distancia d del ápice (paraboloide que se abre hasta el cilindro). */
const semiAnchoRaiz = (d: number, ancho: number, curv: number) => (d <= 0 ? 0 : Math.min(ancho, Math.sqrt(2 * curv * d)));
export const contornoRaiz = (y: number) => semiAnchoRaiz(RAIZ.yApice - y, RAIZ.semiAncho, RAIZ.curvatura);
export const contornoCofia = (y: number) => {
  const d = RAIZ.yApice + RAIZ.cofia - y;
  // la cofia envuelve la punta y se adelgaza hacia arriba hasta desaparecer
  const base = semiAnchoRaiz(d, RAIZ.semiAncho + 46, RAIZ.curvatura * 1.25);
  const fin = Math.max(0, Math.min(1, (900 - d) / 500));
  return Math.max(contornoRaiz(y), contornoRaiz(y) + (base - contornoRaiz(y)) * fin);
};

/** Distancia al ápice ↔ coordenada «número de célula»: las células se alargan pasada la zona meristemática. */
const L0 = RAIZ.largo, D1 = RAIZ.finMeristemo, ESC = 320;
const aIndice = (d: number) => (d <= D1 ? d / L0 : D1 / L0 + (ESC / L0) * Math.log(1 + (d - D1) / ESC));
const aDistancia = (g: number) => (g <= D1 / L0 ? g * L0 : D1 + ESC * (Math.exp((g - D1 / L0) * (L0 / ESC)) - 1));

export function celulasRaiz(semilla: number, r: Rect, margen = 30): CelulaRaiz[] {
  const { pasoFila, yApice, cofia } = RAIZ;
  const im = indiceMitoticoRaiz(semilla);
  const out: CelulaRaiz[] = [];
  const dMin = yApice - (r.y1 + margen), dMax = yApice - (r.y0 - margen);
  if (dMax < -cofia) return out;
  const fMax = Math.ceil((RAIZ.semiAncho + 60) / pasoFila);
  const f0 = Math.max(-fMax, Math.floor((r.x0 - margen) / pasoFila)), f1 = Math.min(fMax, Math.ceil((r.x1 + margen) / pasoFila));
  for (let fila = f0; fila <= f1; fila++) {
    const x = fila * pasoFila;
    const corr = hs(semilla, fila, 0, 40);
    const borde = (k: number) => aDistancia(k + corr + (hs(semilla, fila, k, 41) - 0.5) * 0.5);
    // la cofia vive en índices negativos (células más grandes): se recorre con paso propio
    const k0 = Math.floor(aIndice(Math.max(0, dMin)) - corr) - 1, k1 = Math.ceil(aIndice(Math.max(0, dMax)) - corr) + 1;
    for (let k = Math.max(0, k0); k <= k1; k++) {
      const da = borde(k), db = borde(k + 1);
      const d = (da + db) / 2, y = yApice - d;
      if (Math.abs(x) > contornoRaiz(y) - pasoFila * 0.35) continue;
      const zona: ZonaRaiz = d < D1 ? 'meristemo' : 'elongacion';
      const prob = d < 55 ? im * 0.25 : d < 780 ? im : d < RAIZ.finMitosis ? im * (RAIZ.finMitosis - d) / (RAIZ.finMitosis - 780) : 0;
      let fase: FaseMitosis = 'interfase';
      if (hs(semilla, fila, k, 42) < prob) {
        const f = hs(semilla, fila, k, 43);
        fase = f < 0.42 ? 'profase' : f < 0.64 ? 'metafase' : f < 0.78 ? 'anafase' : 'telofase';
      }
      out.push({ x, y, w: pasoFila, h: db - da, fase, zona, fila, k });
    }
    // cofia: células grandes y pálidas por delante y a los lados de la punta
    const pc = 30;
    for (let k = Math.floor((r.y0 - margen) / pc); k <= Math.ceil((r.y1 + margen) / pc); k++) {
      const y = (k + hs(semilla, fila, k, 45) * 0.4) * pc;
      if (y < yApice - 760 || Math.abs(x) > contornoCofia(y) - 6 || Math.abs(x) <= contornoRaiz(y) - pasoFila * 0.35) continue;
      if (y > yApice + cofia) continue;
      out.push({ x, y, w: pasoFila, h: pc, fase: 'interfase', zona: 'cofia', fila, k: -1 - k - 100000 });
    }
  }
  return out;
}

/** Células del meristemo (no de la cofia) con el centro dentro del marco, y cuántas están en mitosis. */
export function contarMitosis(semilla: number, marco: Rect): { total: number; enMitosis: number; porFase: Record<FaseMitosis, number> } {
  const porFase: Record<FaseMitosis, number> = { interfase: 0, profase: 0, metafase: 0, anafase: 0, telofase: 0 };
  let total = 0;
  for (const c of celulasRaiz(semilla, marco, 60)) if (c.zona !== 'cofia' && dentro(marco, c.x, c.y)) { total++; porFase[c.fase]++; }
  return { total, enMitosis: total - porFase.interfase, porFase };
}

// ═══════════════════════ 4 · Epidermis de cebolla (lugol) ═══════════════════════

export interface CelulaCebolla {
  /** extremos izquierdo y derecho a media altura (µm) */
  x0: number; x1: number; y0: number; y1: number;
  /** inclinación de las paredes de los extremos (desplazamiento en x entre arriba y abajo) */
  inc0: number; inc1: number;
  /** núcleo */
  nx: number; ny: number; nr: number;
  j: number; k: number;
}
export const CEBOLLA = { alto: 64 } as const;

/** Largo medio (µm) de las células de la epidermis en esta preparación: 190–310 µm. */
export const largoMedioCebolla = (semilla: number): number => Math.round(190 + hs(semilla, 4, 21, 830) * 120);

export function celulasCebolla(semilla: number, r: Rect, margen = 40): CelulaCebolla[] {
  const L = largoMedioCebolla(semilla), A = CEBOLLA.alto;
  const out: CelulaCebolla[] = [];
  const yFila = (j: number) => (j + (hs(semilla, j, 0, 50) - 0.5) * 0.22) * A;
  for (let j = Math.floor((r.y0 - margen) / A) - 1; j <= Math.ceil((r.y1 + margen) / A); j++) {
    const corr = hs(semilla, j, 1, 51);
    const borde = (k: number) => (k + corr + (hs(semilla, j, k, 52) - 0.5) * 0.3) * L;
    for (let k = Math.floor((r.x0 - margen) / L - corr) - 1; k <= Math.ceil((r.x1 + margen) / L - corr); k++) {
      const x0 = borde(k), x1 = borde(k + 1);
      if (x1 < r.x0 - margen || x0 > r.x1 + margen) continue;
      const y0 = yFila(j), y1 = yFila(j + 1);
      const lado = hs(semilla, j, k, 55);
      out.push({
        x0, x1, y0, y1,
        inc0: (hs(semilla, j, k, 53) - 0.5) * 44, inc1: (hs(semilla, j, k + 1, 53) - 0.5) * 44,
        nx: x0 + (x1 - x0) * (0.25 + hs(semilla, j, k, 54) * 0.5),
        // el núcleo suele quedar pegado a una pared, empujado por la vacuola
        ny: lado < 0.38 ? y0 + 13 : lado < 0.76 ? y1 - 13 : (y0 + y1) / 2,
        nr: 8 + hs(semilla, j, k, 56) * 2.5, j, k,
      });
    }
  }
  return out;
}

// ═══════════════════════ 5 · Estomas en la epidermis de Tradescantia ═══════════════════════

export interface SitioEpidermis {
  x: number; y: number;
  estoma: boolean;
  /** peso del diagrama de potencias: los estomas ocupan una celda pequeña */
  peso: number;
  i: number; j: number;
}
export const HOJA = { pasoX: 118, pasoY: 84 } as const;

const candidatoEstoma = (semilla: number, i: number, j: number) => hs(semilla, i, j, 60) < 0.2 + hs(semilla, 8, 13, 840) * 0.22;
/** Un estoma nunca toca a otro: de dos candidatos vecinos sólo queda el de hash menor. */
function esEstoma(semilla: number, i: number, j: number): boolean {
  if (!candidatoEstoma(semilla, i, j)) return false;
  const h = hs(semilla, i, j, 61);
  for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    if (!di && !dj) continue;
    if (candidatoEstoma(semilla, i + di, j + dj) && hs(semilla, i + di, j + dj, 61) < h) return false;
  }
  return true;
}

export function sitiosEpidermis(semilla: number, r: Rect, margen = 0): SitioEpidermis[] {
  const { pasoX, pasoY } = HOJA;
  const out: SitioEpidermis[] = [];
  for (let j = Math.floor((r.y0 - margen) / pasoY) - 1; j <= Math.ceil((r.y1 + margen) / pasoY); j++)
    for (let i = Math.floor((r.x0 - margen) / pasoX) - 1; i <= Math.ceil((r.x1 + margen) / pasoX); i++) {
      const estoma = esEstoma(semilla, i, j);
      const corr = (j & 1) * 0.5;
      const amp = estoma ? 0.2 : 0.56;
      out.push({
        x: (i + corr + 0.5 + (hs(semilla, i, j, 62) - 0.5) * amp) * pasoX,
        y: (j + 0.5 + (hs(semilla, i, j, 63) - 0.5) * amp) * pasoY,
        estoma, peso: estoma ? -5200 : 0, i, j,
      });
    }
  return out;
}

/** Estomas con el centro dentro del marco. */
export function contarEstomas(semilla: number, marco: Rect): number {
  let n = 0;
  for (const s of sitiosEpidermis(semilla, marco, 0)) if (s.estoma && dentro(marco, s.x, s.y)) n++;
  return n;
}

// ═══════════════════════ 6 · Agua de estanque (en vivo) ═══════════════════════

/** Largo (µm) de los paramecios de esta muestra (Paramecium caudatum: 170–290 µm). */
export const largoParamecio = (semilla: number): number => Math.round(175 + hs(semilla, 3, 29, 850) * 105);
