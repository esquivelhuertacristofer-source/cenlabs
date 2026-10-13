/**
 * bio03/superficie.ts — superficies moleculares (SIN three).
 *
 * Las proteínas y los ARN grandes (ARN polimerasa II, ribosoma 40S/60S, ARNt, factores)
 * se dibujan como en la gráfica molecular: una SUPERFICIE GAUSSIANA (Blinn) alrededor de
 * un racimo de esferas,
 *        ρ(p) = Σ exp(−B·(|p − cᵢ|²/rᵢ² − 1)),   superficie: ρ = 1,
 * de la que se restan los canales por donde pasan el ADN, el ARN, los NTP o el péptido
 * (resta suave: en el canal el campo cae a 0). La malla sale por «surface nets»: un
 * vértice por celda que corta la superficie (media de los cruces en sus aristas) y un
 * cuadrilátero por cada arista de la rejilla que cruza. Normales = −∇ρ (nunca nulas:
 * en un punto de la superficie el gradiente no se anula). El color de cada vértice es la
 * media de los colores de las esferas pesada por su aportación (dominios / ARNr y
 * proteína del ribosoma).
 *
 * Dos opciones de acabado (para que lea como proteína y ARN, no como plastilina):
 *  · RELIEVE: hundimiento suave a lo largo de la normal con ruido de BAJA frecuencia
 *    (dos octavas de ≈ 2,6 y 1,3 nm; nada de grano fino). Sólo hacia dentro: nunca
 *    invade un canal ni lo que pasa por él. Las normales se recalculan de las caras.
 *  · OCLUSIÓN de cavidades: por vértice, cuánta «materia» hay fuera de él a 1–3,5 nm en
 *    siete direcciones del hemisferio de la normal (el propio campo ρ). Oscurece el
 *    color en hendiduras y canales (≤ 60 %).
 *
 * Las formas son APROXIMADAS a escala (1 u = 1 nm): tamaños y canales de las estructuras
 * reales (Pol II ≈ 15 × 14 nm, Cramer 2001; 80S ≈ 28 nm; ARNt en L de ≈ 7 nm), no sus
 * coordenadas atómicas.
 */
import { rngConSemilla, type Rng } from '@/domain/biologia';
import { caminoSalidaARN, caminoTunel, LARGO_TUNEL, type V3 } from './molecular';

export type RGB = [number, number, number];
export interface Esfera { c: V3; r: number; color: RGB }
export interface Malla {
  posiciones: Float32Array;
  normales: Float32Array;
  colores: Float32Array;
  indices: Uint32Array;
}
export interface OpcionesSuperficie {
  /** lado de la celda de la rejilla (nm) */
  h: number;
  iso?: number;
  /** B de Blinn: más alto = más pegado a las esferas */
  dureza?: number;
  /** cuánto restar al campo en (x, y, z) (canales); 0 fuera */
  excavar?: (x: number, y: number, z: number) => number;
  /** relieve de baja frecuencia: hundimiento máximo (nm) y semilla */
  relieve?: { amplitud: number; semilla: number };
  /** oscurecer las cavidades (oclusión ambiental por vértice) */
  oclusion?: boolean;
}

/** Ruido de valor 3D suave (interpolación quíntica), en [0, 1]. Baja frecuencia: 1 celda = 1 u. */
function ruido3(x: number, y: number, z: number, s: number): number {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
  const fx = x - i, fy = y - j, fz = z - k;
  const q = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const u = q(fx), v = q(fy), w = q(fz);
  const hsh = (a: number, b: number, c: number) => {
    let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1440662683) + Math.imul(s, 1274126177)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(
    l(l(hsh(i, j, k), hsh(i + 1, j, k), u), l(hsh(i, j + 1, k), hsh(i + 1, j + 1, k), u), v),
    l(l(hsh(i, j, k + 1), hsh(i + 1, j, k + 1), u), l(hsh(i, j + 1, k + 1), hsh(i + 1, j + 1, k + 1), u), v),
    w);
}

export const hexRGB = (hex: string): RGB => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

// ───────────────────────────── superficie gaussiana ─────────────────────────────

export function superficieGaussiana(esferas: readonly Esfera[], op: OpcionesSuperficie): Malla {
  const B = op.dureza ?? 2.2, iso = op.iso ?? 1, h = op.h;
  const corte2 = 1 + 7 / B;
  const corte = Math.sqrt(corte2);
  const lo: V3 = [Infinity, Infinity, Infinity], hi: V3 = [-Infinity, -Infinity, -Infinity];
  for (const e of esferas) for (let a = 0; a < 3; a++) {
    lo[a] = Math.min(lo[a], e.c[a] - e.r * corte);
    hi[a] = Math.max(hi[a], e.c[a] + e.r * corte);
  }
  for (let a = 0; a < 3; a++) { lo[a] -= 2 * h; hi[a] += 2 * h; }
  const nx = Math.ceil((hi[0] - lo[0]) / h) + 1, ny = Math.ceil((hi[1] - lo[1]) / h) + 1, nz = Math.ceil((hi[2] - lo[2]) / h) + 1;
  const N = nx * ny * nz;
  const w = new Float32Array(N);           // campo de las esferas
  const cr = new Float32Array(N), cg = new Float32Array(N), cb = new Float32Array(N);
  const id = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  for (const e of esferas) {
    const R = e.r * corte, r2 = e.r * e.r;
    const i0 = Math.max(0, Math.floor((e.c[0] - R - lo[0]) / h)), i1 = Math.min(nx - 1, Math.ceil((e.c[0] + R - lo[0]) / h));
    const j0 = Math.max(0, Math.floor((e.c[1] - R - lo[1]) / h)), j1 = Math.min(ny - 1, Math.ceil((e.c[1] + R - lo[1]) / h));
    const k0 = Math.max(0, Math.floor((e.c[2] - R - lo[2]) / h)), k1 = Math.min(nz - 1, Math.ceil((e.c[2] + R - lo[2]) / h));
    for (let k = k0; k <= k1; k++) {
      const dz = lo[2] + k * h - e.c[2];
      for (let j = j0; j <= j1; j++) {
        const dy = lo[1] + j * h - e.c[1];
        const dyz = dy * dy + dz * dz;
        if (dyz > R * R) continue;
        for (let i = i0; i <= i1; i++) {
          const dx = lo[0] + i * h - e.c[0];
          const q = (dx * dx + dyz) / r2;
          if (q >= corte2) continue;
          const g = Math.exp(-B * (q - 1));
          const n = id(i, j, k);
          w[n] += g; cr[n] += g * e.color[0]; cg[n] += g * e.color[1]; cb[n] += g * e.color[2];
        }
      }
    }
  }
  // campo con los canales restados
  const f = new Float32Array(N);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const n = id(i, j, k);
    let v = w[n];
    if (op.excavar && v > 0.02) v -= op.excavar(lo[0] + i * h, lo[1] + j * h, lo[2] + k * h);
    f[n] = v;
  }

  // ── surface nets: un vértice por celda cortada
  const cx = nx - 1, cy = ny - 1, cz = nz - 1;
  const celda = new Int32Array(cx * cy * cz).fill(-1);
  const P: number[] = [];
  const v = new Float64Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const val = f[id(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))];
      v[c] = val;
      if (val > iso) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, nCruces = 0;
    for (let c = 0; c < 8; c++) for (const b of [1, 2, 4]) {
      if (c & b) continue;
      const d = c | b;
      const a0 = (mask >> c) & 1, a1 = (mask >> d) & 1;
      if (a0 === a1) continue;
      const t = (iso - v[c]) / (v[d] - v[c]);
      sx += (c & 1) + (b === 1 ? t : 0);
      sy += ((c >> 1) & 1) + (b === 2 ? t : 0);
      sz += ((c >> 2) & 1) + (b === 4 ? t : 0);
      nCruces++;
    }
    celda[i + cx * (j + cy * k)] = P.length / 3;
    P.push(lo[0] + (i + sx / nCruces) * h, lo[1] + (j + sy / nCruces) * h, lo[2] + (k + sz / nCruces) * h);
  }
  const ic = (i: number, j: number, k: number) => celda[i + cx * (j + cy * k)];

  // ── caras: un cuadrilátero por arista de la rejilla que cruza la superficie
  const I: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, dentroPrimero: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (!dentroPrimero) { const t = b; b = d; d = t; }
    // diagonal más corta
    const l = (p: number, q: number) => (P[3 * p] - P[3 * q]) ** 2 + (P[3 * p + 1] - P[3 * q + 1]) ** 2 + (P[3 * p + 2] - P[3 * q + 2]) ** 2;
    if (l(a, c) <= l(b, d)) I.push(a, b, c, a, c, d);
    else I.push(a, b, d, b, c, d);
  };
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const dentro = f[id(i, j, k)] > iso;
    // arista en x: celdas (i, j−1..j, k−1..k), vistas desde +x (y a la derecha, z arriba)
    if (i < cx && j >= 1 && k >= 1 && j < cy && k < cz && dentro !== (f[id(i + 1, j, k)] > iso)) {
      quad(ic(i, j - 1, k - 1), ic(i, j, k - 1), ic(i, j, k), ic(i, j - 1, k), dentro);
    }
    // arista en y: vistas desde +y (z a la derecha, x arriba)
    if (j < cy && i >= 1 && k >= 1 && i < cx && k < cz && dentro !== (f[id(i, j + 1, k)] > iso)) {
      quad(ic(i - 1, j, k - 1), ic(i - 1, j, k), ic(i, j, k), ic(i, j, k - 1), dentro);
    }
    // arista en z: vistas desde +z (x a la derecha, y arriba)
    if (k < cz && i >= 1 && j >= 1 && i < cx && j < cy && dentro !== (f[id(i, j, k + 1)] > iso)) {
      quad(ic(i - 1, j - 1, k), ic(i, j - 1, k), ic(i, j, k), ic(i - 1, j, k), dentro);
    }
  }

  // ── normales (−∇ρ, trilineal) y colores
  const tri = (arr: Float32Array, x: number, y: number, z: number) => {
    const gx = Math.min(nx - 1.001, Math.max(0, (x - lo[0]) / h));
    const gy = Math.min(ny - 1.001, Math.max(0, (y - lo[1]) / h));
    const gz = Math.min(nz - 1.001, Math.max(0, (z - lo[2]) / h));
    const i = Math.floor(gx), j = Math.floor(gy), k = Math.floor(gz);
    const tx = gx - i, ty = gy - j, tz = gz - k;
    const a = (ii: number, jj: number, kk: number) => arr[id(i + ii, j + jj, k + kk)];
    const x00 = a(0, 0, 0) * (1 - tx) + a(1, 0, 0) * tx, x10 = a(0, 1, 0) * (1 - tx) + a(1, 1, 0) * tx;
    const x01 = a(0, 0, 1) * (1 - tx) + a(1, 0, 1) * tx, x11 = a(0, 1, 1) * (1 - tx) + a(1, 1, 1) * tx;
    return (x00 * (1 - ty) + x10 * ty) * (1 - tz) + (x01 * (1 - ty) + x11 * ty) * tz;
  };
  const nv = P.length / 3;
  const posiciones = new Float32Array(P);
  const normales = new Float32Array(nv * 3);
  const colores = new Float32Array(nv * 3);
  for (let n = 0; n < nv; n++) {
    const x = P[3 * n], y = P[3 * n + 1], z = P[3 * n + 2];
    let gx = tri(f, x + h, y, z) - tri(f, x - h, y, z);
    let gy = tri(f, x, y + h, z) - tri(f, x, y - h, z);
    let gz = tri(f, x, y, z + h) - tri(f, x, y, z - h);
    let l = Math.hypot(gx, gy, gz);
    if (!(l > 1e-9)) {
      // caso degenerado: la normal media de sus caras se pone después
      gx = 0; gy = 0; gz = 0; l = 0;
    }
    normales[3 * n] = l ? -gx / l : 0; normales[3 * n + 1] = l ? -gy / l : 0; normales[3 * n + 2] = l ? -gz / l : 0;
    const ww = Math.max(1e-6, tri(w, x, y, z));
    colores[3 * n] = Math.min(1, tri(cr, x, y, z) / ww);
    colores[3 * n + 1] = Math.min(1, tri(cg, x, y, z) / ww);
    colores[3 * n + 2] = Math.min(1, tri(cb, x, y, z) / ww);
  }
  // normales que el gradiente no dio: media de las caras
  const indices = new Uint32Array(I);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t], b = indices[t + 1], c = indices[t + 2];
    for (const p of [a, b, c]) {
      if (normales[3 * p] || normales[3 * p + 1] || normales[3 * p + 2]) continue;
      const ux = P[3 * b] - P[3 * a], uy = P[3 * b + 1] - P[3 * a + 1], uz = P[3 * b + 2] - P[3 * a + 2];
      const vx = P[3 * c] - P[3 * a], vy = P[3 * c + 1] - P[3 * a + 1], vz = P[3 * c + 2] - P[3 * a + 2];
      const nx_ = uy * vz - uz * vy, ny_ = uz * vx - ux * vz, nz_ = ux * vy - uy * vx;
      const l = Math.hypot(nx_, ny_, nz_) || 1;
      normales[3 * p] = nx_ / l; normales[3 * p + 1] = ny_ / l; normales[3 * p + 2] = nz_ / l;
    }
  }
  for (let n = 0; n < nv; n++) {
    if (!normales[3 * n] && !normales[3 * n + 1] && !normales[3 * n + 2]) normales[3 * n + 1] = 1;
  }

  // ── relieve: hundimiento suave (sólo hacia dentro) y normales de las caras
  if (op.relieve && op.relieve.amplitud > 0) {
    const { amplitud: A, semilla: S } = op.relieve;
    for (let n = 0; n < nv; n++) {
      const x = posiciones[3 * n], y = posiciones[3 * n + 1], z = posiciones[3 * n + 2];
      const r = 0.68 * ruido3(x / 2.6, y / 2.6, z / 2.6, S) + 0.32 * ruido3(x / 1.3 + 17, y / 1.3, z / 1.3, S + 1);
      const d = -A * Math.min(1, Math.max(0, (r - 0.18) / 0.64));
      posiciones[3 * n] += d * normales[3 * n]; posiciones[3 * n + 1] += d * normales[3 * n + 1]; posiciones[3 * n + 2] += d * normales[3 * n + 2];
    }
    const acc = new Float64Array(nv * 3);
    for (let t = 0; t < indices.length; t += 3) {
      const a = indices[t], b = indices[t + 1], c = indices[t + 2];
      const ux = posiciones[3 * b] - posiciones[3 * a], uy = posiciones[3 * b + 1] - posiciones[3 * a + 1], uz = posiciones[3 * b + 2] - posiciones[3 * a + 2];
      const vx = posiciones[3 * c] - posiciones[3 * a], vy = posiciones[3 * c + 1] - posiciones[3 * a + 1], vz = posiciones[3 * c + 2] - posiciones[3 * a + 2];
      const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;   // ponderada por el área
      for (const p of [a, b, c]) { acc[3 * p] += fx; acc[3 * p + 1] += fy; acc[3 * p + 2] += fz; }
    }
    for (let n = 0; n < nv; n++) {
      const l = Math.hypot(acc[3 * n], acc[3 * n + 1], acc[3 * n + 2]);
      if (l > 1e-9) { normales[3 * n] = acc[3 * n] / l; normales[3 * n + 1] = acc[3 * n + 1] / l; normales[3 * n + 2] = acc[3 * n + 2] / l; }
    }
  }

  // ── oclusión de cavidades: materia (ρ) fuera del vértice, en el hemisferio de la normal
  if (op.oclusion) {
    const dist = [1.0, 2.0, 3.5], peso = [0.45, 0.33, 0.22];
    const dirs: V3[] = [];
    for (let n = 0; n < nv; n++) {
      const nx_ = normales[3 * n], ny_ = normales[3 * n + 1], nz_ = normales[3 * n + 2];
      // base tangente
      const ax = Math.abs(nx_) < 0.8 ? 1 : 0, ay = ax ? 0 : 1;
      let tx = ny_ * 0 - nz_ * ay, ty = nz_ * ax - nx_ * 0, tz = nx_ * ay - ny_ * ax;
      const lt = Math.hypot(tx, ty, tz) || 1; tx /= lt; ty /= lt; tz /= lt;
      const bx = ny_ * tz - nz_ * ty, by = nz_ * tx - nx_ * tz, bz = nx_ * ty - ny_ * tx;
      dirs.length = 0;
      dirs.push([nx_, ny_, nz_]);
      for (let m = 0; m < 6; m++) {
        const a = (m / 6) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
        // 50° fuera de la normal
        dirs.push([0.643 * nx_ + 0.766 * (c * tx + s * bx), 0.643 * ny_ + 0.766 * (c * ty + s * by), 0.643 * nz_ + 0.766 * (c * tz + s * bz)]);
      }
      const x = posiciones[3 * n], y = posiciones[3 * n + 1], z = posiciones[3 * n + 2];
      let occ = 0;
      for (const d of dirs) for (let q = 0; q < 3; q++) {
        const v = tri(f, x + d[0] * dist[q], y + d[1] * dist[q], z + d[2] * dist[q]);
        occ += peso[q] * Math.min(1, Math.max(0, (v - 0.2) / 0.8));
      }
      occ /= dirs.length;
      const k = 1 - 0.62 * Math.min(1, occ * 2.6);
      colores[3 * n] *= k; colores[3 * n + 1] *= k; colores[3 * n + 2] *= k;
    }
  }
  return { posiciones, normales, colores, indices };
}

// ───────────────────────────── canales ─────────────────────────────

/** Distancia de p al segmento ab y parámetro t ∈ [0, 1] del punto más cercano. */
function distSegmento(px: number, py: number, pz: number, a: V3, b: V3): [number, number] {
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
  const L2 = ux * ux + uy * uy + uz * uz || 1e-12;
  let t = ((px - a[0]) * ux + (py - a[1]) * uy + (pz - a[2]) * uz) / L2;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (a[0] + t * ux), dy = py - (a[1] + t * uy), dz = pz - (a[2] + t * uz);
  return [Math.hypot(dx, dy, dz), t];
}

/** Canal tubular: polilínea con radio (del hueco que queda) en cada extremo de tramo. */
export interface Canal { puntos: V3[]; radios: number[] }

const K_EXCAVAR = 60;
const RAMPA = 1.4;
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * Función de excavado para varios canales. El hueco que queda es ≈ radio pedido: la
 * resta es total hasta r − 1 nm y se desvanece en 1,4 nm (bordes suaves, sin aristas).
 */
export function excavarCanales(canales: readonly Canal[]): (x: number, y: number, z: number) => number {
  // cajas de cada tramo para descartar rápido
  const tramos: { a: V3; b: V3; ra: number; rb: number; lo: V3; hi: V3 }[] = [];
  for (const c of canales) for (let i = 0; i + 1 < c.puntos.length; i++) {
    const a = c.puntos[i], b = c.puntos[i + 1], ra = c.radios[i], rb = c.radios[i + 1];
    const m = Math.max(ra, rb) + RAMPA;
    tramos.push({ a, b, ra, rb, lo: [Math.min(a[0], b[0]) - m, Math.min(a[1], b[1]) - m, Math.min(a[2], b[2]) - m], hi: [Math.max(a[0], b[0]) + m, Math.max(a[1], b[1]) + m, Math.max(a[2], b[2]) + m] });
  }
  return (x, y, z) => {
    let s = 0;
    for (const t of tramos) {
      if (x < t.lo[0] || x > t.hi[0] || y < t.lo[1] || y > t.hi[1] || z < t.lo[2] || z > t.hi[2]) continue;
      const [d, u] = distSegmento(x, y, z, t.a, t.b);
      const r = t.ra + (t.rb - t.ra) * u - 1.0;
      const k = 1 - sstep(r, r + RAMPA, d);
      if (k > s) s = k;
    }
    return K_EXCAVAR * s;
  };
}

// ───────────────────────────── racimos ─────────────────────────────

export interface Elipsoide { c: V3; r: V3; color: string; rMin?: number; rMax?: number; densidad?: number }

/** Llena elipsoides de esferas (racimo) con un generador con semilla. */
export function racimo(elipsoides: readonly Elipsoide[], rng: Rng): Esfera[] {
  const out: Esfera[] = [];
  for (const e of elipsoides) {
    const rMin = e.rMin ?? 0.8, rMax = e.rMax ?? 1.5;
    const rMed = (rMin + rMax) / 2;
    const vol = (4 / 3) * Math.PI * e.r[0] * e.r[1] * e.r[2];
    const n = Math.max(3, Math.round((vol / ((4 / 3) * Math.PI * rMed ** 3)) * 1.6 * (e.densidad ?? 1)));
    const col = hexRGB(e.color);
    let k = 0, intentos = 0;
    while (k < n && intentos < n * 40) {
      intentos++;
      const r = rMin + (rMax - rMin) * rng();
      const p: V3 = [(rng() * 2 - 1), (rng() * 2 - 1), (rng() * 2 - 1)];
      // dentro del elipsoide encogido por r (la superficie sigue al elipsoide)
      const ex = Math.max(0.3, e.r[0] - r * 0.8), ey = Math.max(0.3, e.r[1] - r * 0.8), ez = Math.max(0.3, e.r[2] - r * 0.8);
      if (p[0] * p[0] + p[1] * p[1] + p[2] * p[2] > 1) continue;
      out.push({ c: [e.c[0] + p[0] * ex, e.c[1] + p[1] * ey, e.c[2] + p[2] * ez], r, color: col });
      k++;
    }
  }
  return out;
}

/** Esferas a lo largo de una polilínea (para los brazos de los ARN). */
function tubo(puntos: V3[], radio: number, paso: number, color: string, rng: Rng, rugosidad = 0.12): Esfera[] {
  const out: Esfera[] = [];
  const col = hexRGB(color);
  for (let i = 0; i + 1 < puntos.length; i++) {
    const a = puntos[i], b = puntos[i + 1];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const n = Math.max(1, Math.round(L / paso));
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const j = (): number => (rng() * 2 - 1) * rugosidad;
      out.push({ c: [a[0] + (b[0] - a[0]) * t + j(), a[1] + (b[1] - a[1]) * t + j(), a[2] + (b[2] - a[2]) * t + j()], r: radio * (0.9 + 0.2 * rng()), color: col });
    }
  }
  const u = puntos[puntos.length - 1];
  out.push({ c: [...u] as V3, r: radio, color: col });
  return out;
}

const muestrear = (f: (s: number) => V3, s0: number, s1: number, n: number): V3[] => Array.from({ length: n + 1 }, (_, i) => f(s0 + ((s1 - s0) * i) / n));

// ───────────────────────────── formas ─────────────────────────────

export interface Forma { esferas: Esfera[]; excavar?: (x: number, y: number, z: number) => number; h: number; dureza?: number; relieve?: { amplitud: number; semilla: number }; oclusion?: boolean }

/**
 * ARN polimerasa II (marco de la polimerasa: sitio activo en el origen, ADN en +x).
 * Dominios: Rpb1 (núcleo y pinza), Rpb2 (lóbulo y protrusión), mandíbulas, tallo
 * Rpb4/7 junto a la salida del ARN, subunidades pequeñas. Canales: el ADN, la burbuja
 * con la hebra codificante, la salida del ARN y el embudo de los NTP (canal secundario).
 */
export function formaPolimerasa(semilla = 11): Forma {
  const rng = rngConSemilla(semilla);
  const E: Elipsoide[] = [
    { c: [-0.4, -2.4, -1.4], r: [6.0, 3.5, 4.6], color: '#d98f6c' },     // Rpb1 núcleo
    { c: [-1.0, 2.1, -3.0], r: [5.6, 3.5, 3.3], color: '#e2a86a' },      // Rpb2
    { c: [-1.3, 3.5, 2.3], r: [4.8, 2.3, 3.1], color: '#cf6a5c' },       // pinza (clamp): techo de la hendidura
    { c: [-4.6, 4.4, 4.2], r: [2.2, 1.9, 1.9], color: '#cf6a5c' },       // pinza: núcleo, junto al tallo
    { c: [5.4, -2.3, 1.8], r: [2.8, 2.1, 2.6], color: '#d9a55a' },       // mandíbula inferior (Rpb1/Rpb5)
    { c: [5.3, 2.5, -1.7], r: [2.7, 1.9, 2.3], color: '#d9a55a' },       // mandíbula superior (Rpb9)
    { c: [-4.4, 5.6, 3.6], r: [1.7, 3.0, 1.7], color: '#e8bf72' },       // tallo Rpb4/7
    { c: [-3.0, -2.2, -6.1], r: [3.6, 2.8, 2.3], color: '#c98482' },     // Rpb3/10/11/12
    { c: [-6.2, -3.4, 2.1], r: [2.4, 2.4, 2.4], color: '#d0948a' },      // Rpb6/8
    { c: [2.0, -5.0, -3.0], r: [3.0, 1.8, 2.5], color: '#d98f6c' },      // pie
  ];
  const esferas = racimo(E.map((e) => ({ ...e, rMin: 1.15, rMax: 1.95 })), rng);
  const salida = muestrear((s) => caminoSalidaARN(s, 0), 0, 13, 13);
  const canales: Canal[] = [
    { puntos: [[-40, 0, 0], [40, 0, 0]], radios: [1.45, 1.45] },                          // ADN
    { puntos: [[-4.6, 1.5, 0.5], [0.8, 1.5, 0.5]], radios: [1.75, 1.75] },               // burbuja (hebra codificante)
    { puntos: salida, radios: salida.map(() => 1.05) },                                   // salida del ARN
    { puntos: [[0.3, -0.7, 0.8], [0.9, -4, 2.0], [1.4, -8.5, 3.6]], radios: [0.9, 1.5, 2.4] }, // embudo de NTP
  ];
  return { esferas, excavar: excavarCanales(canales), h: 0.34, dureza: 1.75, relieve: { amplitud: 0.42, semilla: 3 }, oclusion: true };
}

/** Subunidad menor 40S (marco del ribosoma: ARNm en +x a y = 0). ARNr 18S (oro) con proteínas. */
export function formaSubunidadMenor(semilla = 23): Forma {
  const rng = rngConSemilla(semilla);
  const E: Elipsoide[] = [
    { c: [0.5, -4.8, -0.2], r: [9.4, 4.6, 7.2], color: '#f1c56c' },     // cuerpo
    { c: [-1.2, 0.6, -7.3], r: [6.2, 3.8, 3.3], color: '#f3cd7c' },     // cabeza (detrás del canal del ARNm)
    { c: [-5.6, 3.2, -6.6], r: [2.3, 2.0, 1.9], color: '#f3cd7c' },     // pico de la cabeza
    { c: [6.6, -1.6, 4.4], r: [3.4, 2.9, 3.0], color: '#efbf62' },      // hombro
    { c: [-8.0, -1.8, 3.4], r: [3.6, 2.7, 3.3], color: '#f1c56c' },     // plataforma
    { c: [3.2, -10.0, 1.2], r: [3.2, 2.4, 2.8], color: '#efbf62' },     // pie (espolón)
  ];
  const esferas = racimo(E, rng);
  marcarProteinas(esferas, rng, '#e7905e', 0.3);
  const canales: Canal[] = [
    { puntos: [[-40, 0, 0], [40, 0, 0]], radios: [0.95, 0.95] },                         // canal del ARNm
    { puntos: [[-3.6, 1.6, 0.6], [3.8, 1.6, 0.6]], radios: [1.55, 1.55] },              // tallos anticodón (A, P, E)
    { puntos: [[0.9, 1.6, 0.8], [6, 3.5, 9]], radios: [1.8, 3.2] },                      // entrada al sitio A
  ];
  return { esferas, excavar: excavarCanales(canales), h: 0.42, dureza: 1.9, relieve: { amplitud: 0.5, semilla: 5 }, oclusion: true };
}

/** Subunidad mayor 60S: ARNr 28S/5,8S/5S (azul) con proteínas; cavidad de los ARNt y túnel. */
export function formaSubunidadMayor(semilla = 37): Forma {
  const rng = rngConSemilla(semilla);
  const E: Elipsoide[] = [
    { c: [0.4, 8.6, -1.4], r: [12.0, 6.9, 9.9], color: '#93b3f2' },     // cuerpo
    { c: [-0.4, 16.2, -3.6], r: [4.2, 3.4, 3.4], color: '#9bbaf4' },     // protuberancia central (ARNr 5S)
  ];
  const esferas = [
    ...racimo(E, rng),
    // tallo L1 (lado E): brazo hacia arriba y fuera, con su nudo (proteína L1)
    ...tubo([[-10.4, 9.2, 1.2], [-13.0, 11.6, 2.2], [-14.6, 13.6, 2.6]], 1.45, 0.6, '#9bbaf4', rng, 0.1),
    { c: [-15.2, 14.4, 2.6] as V3, r: 2.3, color: hexRGB('#b39cf2') },
    // tallo P (lado A): brazo fino con su nudo (proteínas P)
    ...tubo([[10.4, 7.2, 1.0], [13.2, 8.8, 1.6], [14.8, 10.2, 1.9]], 0.95, 0.5, '#8aaced', rng, 0.08),
    { c: [15.4, 10.8, 1.9] as V3, r: 1.6, color: hexRGB('#b39cf2') },
  ];
  marcarProteinas(esferas, rng, '#b39cf2', 0.32);
  const tunel = muestrear(caminoTunel, -0.5, LARGO_TUNEL + 2, 12);
  const canales: Canal[] = [
    { puntos: [[-4.2, 3.4, 1.0], [4.4, 3.4, 1.0]], radios: [3.6, 3.6] },                // cavidad de los ARNt
    { puntos: [[0, 4.5, 1.5], [0, 4.8, 10]], radios: [3.0, 3.6] },                       // ventana frontal
    { puntos: [[-0.8, 6.6, -2.2], [2.4, 6.8, -2.2]], radios: [1.6, 1.6] },               // brazos aceptores → CPT
    { puntos: [[-4.2, 5.5, -1.0], [-11, 6, 5]], radios: [1.9, 2.6] },                     // salida del sitio E
    { puntos: [[3.0, 4.0, 2.5], [9, 5, 10]], radios: [2.6, 3.4] },                        // entrada al sitio A
    { puntos: tunel, radios: tunel.map(() => 0.85) },                                     // túnel de salida
  ];
  return { esferas, excavar: excavarCanales(canales), h: 0.44, dureza: 1.9, relieve: { amplitud: 0.5, semilla: 7 }, oclusion: true };
}

/**
 * Marca como proteína (otro color) racimos de esferas cercanas a la superficie: ~frac
 * de las esferas, en manchas (semillas + vecinas), no esferas sueltas.
 */
function marcarProteinas(esferas: Esfera[], rng: Rng, color: string, frac: number) {
  const col = hexRGB(color);
  const cen: V3 = [0, 0, 0];
  for (const e of esferas) for (let a = 0; a < 3; a++) cen[a] += e.c[a] / esferas.length;
  const dist = esferas.map((e) => Math.hypot(e.c[0] - cen[0], e.c[1] - cen[1], e.c[2] - cen[2]));
  const dMax = Math.max(...dist);
  const meta = Math.round(esferas.length * frac);
  let marcadas = 0, intentos = 0;
  while (marcadas < meta && intentos < 400) {
    intentos++;
    const s = Math.floor(rng() * esferas.length);
    if (dist[s] < 0.55 * dMax) continue;
    const rad = 2.0 + 1.8 * rng();
    for (let i = 0; i < esferas.length; i++) {
      const e = esferas[i];
      if (e.color === col) continue;
      if (Math.hypot(e.c[0] - esferas[s].c[0], e.c[1] - esferas[s].c[1], e.c[2] - esferas[s].c[2]) < rad) { e.color = col; marcadas++; }
    }
  }
}

/** Puntos del ARNt en L (marco del ARNt: centro del anticodón en el origen, eje y hacia arriba). */
export const L_ARNT = {
  /** arranque del brazo del anticodón (sobre el bucle) */
  base: [0, 0.75, 0] as V3,
  /** codo (bucles D y T) */
  codo: [0, 5.25, 2.55] as V3,
  /** extremo 3′ CCA (lleva el aminoácido) */
  cca: [0, 7.05, -2.35] as V3,
};

/** ARNt: dos hélices coaxiales en L (anticodón + D, aceptor + T), ≈ 7 nm. */
export function formaARNt(semilla = 5): Forma {
  const rng = rngConSemilla(semilla);
  const { base, codo, cca } = L_ARNT;
  const esferas = [
    ...tubo([base, [0, 2.9, 1.25], codo], 0.7, 0.34, '#e4eeec', rng, 0.05),
    ...tubo([codo, [0, 6.2, 0.2], [0, 6.75, -1.6]], 0.68, 0.34, '#e4eeec', rng, 0.05),
    // bucles del codo, algo más anchos
    { c: [0.3, 5.45, 2.85] as V3, r: 0.86, color: hexRGB('#f2f7f6') },
    { c: [-0.35, 4.95, 2.7] as V3, r: 0.78, color: hexRGB('#f2f7f6') },
    // bucle del anticodón
    { c: [0, 0.95, 0] as V3, r: 0.74, color: hexRGB('#dfe9e7') },
    // extremo CCA monocatenario, fino
    ...tubo([[0, 6.75, -1.6], cca], 0.42, 0.26, '#ffffff', rng, 0.03),
  ];
  return { esferas, h: 0.2, dureza: 2.6, oclusion: true };
}

/** Factor de liberación eRF1 (imita la forma del ARNt: dominio N al codón, GGQ al CPT). */
export function formaFactorLiberacion(semilla = 7): Forma {
  const rng = rngConSemilla(semilla);
  const { base, codo, cca } = L_ARNT;
  const esferas = [
    ...racimo([{ c: [0, 1.9, 0.5], r: [1.6, 1.8, 1.6], color: '#a87cf0', rMin: 0.7, rMax: 1.1 }], rng),
    ...tubo([[0, 3.4, 1.4], codo], 1.15, 0.45, '#a87cf0', rng, 0.15),
    ...tubo([codo, [0, 6.4, 0], [0, 6.8, -1.6]], 1.05, 0.45, '#b58bf3', rng, 0.15),
    ...racimo([{ c: [0.4, 5.6, 3.8], r: [2.0, 1.7, 1.6], color: '#9a6fe6', rMin: 0.7, rMax: 1.2 }], rng),
    { c: [...cca] as V3, r: 0.7, color: hexRGB('#c7a3f6') },
    { c: [...base] as V3, r: 0.8, color: hexRGB('#a87cf0') },
  ];
  return { esferas, h: 0.24 };
}

/** Factor de alargamiento eEF1A (EF-Tu): tres dominios globulares, ≈ 6 × 4 nm. */
export function formaFactorAlargamiento(semilla = 9): Forma {
  const rng = rngConSemilla(semilla);
  const esferas = racimo([
    { c: [0, 0, 0], r: [2.2, 1.9, 1.8], color: '#ef8f7a', rMin: 0.6, rMax: 1.0 },
    { c: [2.3, -1.2, 0.6], r: [1.5, 1.4, 1.4], color: '#f3a08c', rMin: 0.6, rMax: 0.9 },
    { c: [1.9, 1.6, -0.5], r: [1.5, 1.4, 1.3], color: '#e98270', rMin: 0.6, rMax: 0.9 },
  ], rng);
  return { esferas, h: 0.24 };
}

/** Proteína globular genérica (para el fondo), de radio ≈ R. */
export function formaGlobular(semilla: number, R: number, color: string): Forma {
  const rng = rngConSemilla(semilla);
  const n = 2 + Math.floor(rng() * 3);
  const E: Elipsoide[] = Array.from({ length: n }, () => ({
    c: [(rng() - 0.5) * R, (rng() - 0.5) * R, (rng() - 0.5) * R] as V3,
    r: [R * (0.45 + 0.3 * rng()), R * (0.45 + 0.3 * rng()), R * (0.45 + 0.3 * rng())] as V3,
    color, rMin: R * 0.18, rMax: R * 0.3,
  }));
  return { esferas: racimo(E, rng), h: R / 9 };
}

/** Malla de una forma. */
export const mallaDe = (f: Forma): Malla => superficieGaussiana(f.esferas, { h: f.h, excavar: f.excavar, dureza: f.dureza ?? 2.2, relieve: f.relieve, oclusion: f.oclusion });
