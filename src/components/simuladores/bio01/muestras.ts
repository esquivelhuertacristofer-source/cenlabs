/**
 * bio01/muestras.ts — las tres preparaciones del microscopio, como DATOS puros
 * (sin three): posiciones y tamaños en micrómetros, deterministas.
 *
 * Cada célula se deduce de su índice de rejilla con un hash entero, de modo que
 * la MISMA preparación se vea igual a 4x, 10x, 40x y 100x y al desplazar la
 * platina: lo único que cambia es la ventana de mundo que se genera.
 *
 *   vegetal  — hoja de Elodea: células rectangulares en hileras, pared celulósica,
 *              cloroplastos (≈ 5 µm) en la capa parietal, vacuola central.
 *   animal   — mucosa bucal teñida con azul de metileno: células escamosas planas
 *              (≈ 60–80 µm), membrana fina, núcleo (≈ 9 µm) azul oscuro.
 *   bacteria — yogur con tinción de Gram: bacilos (≈ 1 × 4 µm) y estreptococos en
 *              cadena (≈ 1 µm), todos Gram-positivos (violeta).
 */

/** Diámetro del campo visual (µm): número de campo del ocular 10x (≈ 18 mm) / aumento del objetivo. */
export const CAMPO_UM: Record<number, number> = { 4: 4500, 10: 1800, 40: 450, 100: 180 };
export const campoUm = (mag: number) => CAMPO_UM[mag] ?? 4500;

/** Hash entero → [0, 1). Determinista, sin estado. */
export function hash(i: number, j: number, k = 0): number {
  let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(k, 1442695041)) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  n ^= n >>> 16;
  return (n >>> 0) / 4294967296;
}

export interface Ventana { cx: number; cy: number; semi: number }

// ───────────────────────────── vegetal: Elodea ─────────────────────────────

export interface CelulaVegetal {
  x: number; y: number; w: number; h: number;
  /** semilla de la célula (i, j) para sus cloroplastos */
  i: number; j: number;
}
export const ELODEA = { pasoX: 118, pasoY: 52, parietal: 6 };

export function celulasElodea(v: Ventana): CelulaVegetal[] {
  const { pasoX, pasoY } = ELODEA;
  const j0 = Math.floor((v.cy - v.semi) / pasoY) - 1, j1 = Math.ceil((v.cy + v.semi) / pasoY) + 1;
  const out: CelulaVegetal[] = [];
  for (let j = j0; j <= j1; j++) {
    const desfase = (j & 1 ? 0.37 : 0) * pasoX;
    const i0 = Math.floor((v.cx - v.semi - desfase) / pasoX) - 1, i1 = Math.ceil((v.cx + v.semi - desfase) / pasoX) + 1;
    for (let i = i0; i <= i1; i++) {
      const x = i * pasoX + desfase;
      const y = j * pasoY;
      if (Math.abs(x - v.cx) > v.semi + pasoX || Math.abs(y - v.cy) > v.semi + pasoY) continue;
      // las células de una hilera comparten pared: teselan el plano sin huecos
      out.push({ x, y, w: pasoX, h: pasoY, i, j });
    }
  }
  return out;
}

export interface Cloroplasto { x: number; y: number; a: number; r: number; L: number; A: number; w: number }

/** Cloroplastos de una célula: sobre la capa parietal (anillo interior), con ciclosis (ω ≠ 0). */
export function cloroplastosDe(c: CelulaVegetal): Cloroplasto[] {
  const n = 26 + Math.floor(hash(c.i, c.j, 5) * 18);
  const out: Cloroplasto[] = [];
  const ax = c.w / 2 - ELODEA.parietal - 2, ay = c.h / 2 - ELODEA.parietal - 2;
  const sentido = hash(c.i, c.j, 6) > 0.5 ? 1 : -1;
  for (let k = 0; k < n; k++) {
    const t = (k + hash(c.i, c.j, 10 + k) * 0.8) / n; // fracción del perímetro
    const r = (hash(c.i, c.j, 40 + k) - 0.5) * 3.4;
    out.push({
      x: 0, y: 0, a: t, r, L: 4.6 + hash(c.i, c.j, 70 + k) * 1.6, A: 3 + hash(c.i, c.j, 100 + k) * 1.2,
      w: sentido * (0.004 + hash(c.i, c.j, 130 + k) * 0.003),
    });
  }
  // x,y se resuelven con `posicionParietal` (cambian con el tiempo)
  void ax; void ay;
  return out;
}

/** Punto del anillo parietal de una célula (fracción t del perímetro del rectángulo redondeado). */
export function posicionParietal(c: CelulaVegetal, t: number, r: number): [number, number, number] {
  const ax = c.w / 2 - ELODEA.parietal - 2 + r, ay = c.h / 2 - ELODEA.parietal - 2 + r;
  const per = 4 * (ax + ay);
  let d = (((t % 1) + 1) % 1) * per;
  // recorre: arriba (izq→der), derecha (arriba→abajo), abajo (der→izq), izquierda (abajo→arriba)
  if (d < 2 * ax) return [-ax + d, ay, 0];
  d -= 2 * ax;
  if (d < 2 * ay) return [ax, ay - d, -Math.PI / 2];
  d -= 2 * ay;
  if (d < 2 * ax) return [ax - d, -ay, Math.PI];
  d -= 2 * ax;
  return [-ax, -ay + d, Math.PI / 2];
}

// ───────────────────────────── animal: mucosa bucal ─────────────────────────────

export interface CelulaEscamosa {
  x: number; y: number; rot: number;
  contorno: [number, number][];
  nx: number; ny: number; nr: number;
  i: number; j: number;
}
export const MUCOSA = { paso: 84 };

export function celulasMucosa(v: Ventana): CelulaEscamosa[] {
  const { paso } = MUCOSA;
  const i0 = Math.floor((v.cx - v.semi) / paso) - 1, i1 = Math.ceil((v.cx + v.semi) / paso) + 1;
  const j0 = Math.floor((v.cy - v.semi) / paso) - 1, j1 = Math.ceil((v.cy + v.semi) / paso) + 1;
  const out: CelulaEscamosa[] = [];
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    if (hash(i, j, 0) < 0.18) continue; // huecos entre células (frotis disperso)
    const x = i * paso + (hash(i, j, 1) - 0.5) * 30;
    const y = j * paso + (hash(i, j, 2) - 0.5) * 30;
    const rx = 35 + hash(i, j, 3) * 14, ry = 30 + hash(i, j, 4) * 13;
    const rot = hash(i, j, 5) * Math.PI;
    const lados = 11;
    const contorno: [number, number][] = [];
    for (let k = 0; k < lados; k++) {
      const a = (k / lados) * Math.PI * 2;
      const ruido = 1 + (hash(i, j, 20 + k) - 0.5) * 0.26;
      contorno.push([Math.cos(a) * rx * ruido, Math.sin(a) * ry * ruido]);
    }
    out.push({
      x, y, rot, contorno,
      nx: (hash(i, j, 7) - 0.5) * 12, ny: (hash(i, j, 8) - 0.5) * 10, nr: 4.2 + hash(i, j, 9) * 1.2, i, j,
    });
  }
  return out;
}

// ───────────────────────────── bacteria: yogur Gram+ ─────────────────────────────

export interface Bacteria { x: number; y: number; rot: number; L: number; r: number; coco: boolean }
export const YOGUR = { chunk: 60 };

export function bacteriasYogur(v: Ventana): Bacteria[] {
  const { chunk } = YOGUR;
  const i0 = Math.floor((v.cx - v.semi) / chunk), i1 = Math.ceil((v.cx + v.semi) / chunk);
  const j0 = Math.floor((v.cy - v.semi) / chunk), j1 = Math.ceil((v.cy + v.semi) / chunk);
  const out: Bacteria[] = [];
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const nCum = 2 + Math.floor(hash(i, j, 1) * 4); // racimos por celda
    for (let c = 0; c < nCum; c++) {
      const cx = (i + hash(i, j, 10 + c)) * chunk, cy = (j + hash(i, j, 20 + c)) * chunk;
      const tipo = hash(i, j, 30 + c);
      const ang = hash(i, j, 40 + c) * Math.PI * 2;
      if (tipo < 0.5) {
        // estreptococos en cadena curva
        const n = 4 + Math.floor(hash(i, j, 50 + c) * 7);
        const curva = (hash(i, j, 60 + c) - 0.5) * 0.5;
        let px = cx, py = cy, a = ang;
        for (let k = 0; k < n; k++) {
          out.push({ x: px, y: py, rot: a, L: 0, r: 0.5, coco: true });
          px += Math.cos(a) * 1.05; py += Math.sin(a) * 1.05; a += curva * 0.35;
        }
      } else {
        // bacilos agrupados
        const n = 2 + Math.floor(hash(i, j, 70 + c) * 6);
        for (let k = 0; k < n; k++) {
          out.push({
            x: cx + (hash(i, j, 80 + c * 7 + k) - 0.5) * 7, y: cy + (hash(i, j, 90 + c * 7 + k) - 0.5) * 7,
            rot: ang + (hash(i, j, 100 + c * 7 + k) - 0.5) * 0.9, L: 2.6 + hash(i, j, 110 + c * 7 + k) * 2.4, r: 0.48, coco: false,
          });
        }
      }
    }
  }
  return out.filter((b) => Math.abs(b.x - v.cx) <= v.semi && Math.abs(b.y - v.cy) <= v.semi);
}
