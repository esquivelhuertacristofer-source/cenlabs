/**
 * bio02/forma.ts — la FORMA del glóbulo rojo con el VOLUMEN del modelo (three, sin React).
 *
 * El volumen de la malla dibujada es el que da el modelo (Boyle–van 't Hoff), no una animación:
 * la familia de formas tiene un parámetro p y una tabla volumen(p) medida SOBRE LA MALLA
 * (suma de tetraedros); para dibujar un volumen V se invierte la tabla.
 *
 *   · p = 0 → disco bicóncavo de Evans–Fung (radio R elegido para que V = 90 fL):
 *       z(ρ) = ± R·√(1−ρ²)·(0,2072 + 0,5006·ρ² − 0,0702·ρ⁴),   ρ = r/R
 *   · 0 < p ≤ 1 → se hincha hacia la ESFERA DE IGUAL ÁREA (la membrana casi no se estira:
 *       área ≈ constante): es el camino del glóbulo en medio hipotónico.
 *   · 1 < p ≤ P_MAX → la esfera ya no puede crecer sin estirar la membrana: crece estirándola
 *       (unos pocos % de área), hasta el volumen de lisis.
 *   · p < 0 → medio hipertónico: pierde agua, se aplana y le salen espículas (equinocito).
 */
import * as THREE from 'three';
import { ERITROCITO } from './transporte';

export const NQ = 64;
export const NT = 96;
const EF = [0.2072, 0.5006, -0.0702] as const;
const P_MIN = -1.3, P_MAX = 1.25, PASO_P = 0.01;

const zEF = (rho: number) => Math.sqrt(Math.max(0, 1 - rho * rho)) * (EF[0] + EF[1] * rho * rho + EF[2] * rho ** 4);

/** Volumen y área del disco de Evans–Fung con R = 1 (integración numérica). */
const UNIDAD = (() => {
  const n = 4000;
  let v = 0, a = 0;
  for (let i = 0; i < n; i++) {
    const r0 = i / n, r1 = (i + 1) / n, rm = (r0 + r1) / 2;
    v += 2 * 2 * Math.PI * rm * zEF(rm) / n;
    const dz = zEF(Math.min(r1, 0.999999)) - zEF(r0);
    a += 2 * 2 * Math.PI * rm * Math.hypot(1 / n, dz);
  }
  return { v, a };
})();
/** Radio (µm) del disco de reposo: su volumen es V₀ = 90 fL. */
export const R_E = Math.cbrt(ERITROCITO.V0 / UNIDAD.v);
/** Radio de la esfera de igual área (en unidades de R). */
const RS = Math.sqrt(UNIDAD.a / (4 * Math.PI));
/** Área del disco de reposo (µm²). */
export const AREA_REPOSO = UNIDAD.a * R_E * R_E;

const ESPICULAS: THREE.Vector3[] = (() => {
  const n = 46, out: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
    out.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
  }
  return out;
})();
const suave01 = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/** Peso de espícula de cada vértice de la rejilla (constante: depende sólo de su dirección). */
const BULTO = (() => {
  const b = new Float32Array((NQ + 1) * (NT + 1));
  const d = new THREE.Vector3();
  for (let i = 0; i <= NQ; i++) {
    const q = i / NQ, rho = Math.sin(Math.PI * q), lado = q < 0.5 ? -1 : 1;
    for (let j = 0; j <= NT; j++) {
      const t = (j / NT) * Math.PI * 2;
      d.set(rho * Math.cos(t), lado * Math.max(0.35, zEF(rho)) * 1.6, rho * Math.sin(t)).normalize();
      let s = 0;
      for (const e of ESPICULAS) { const ang = Math.acos(Math.min(1, Math.max(-1, d.dot(e)))); s += Math.exp(-(ang * ang) / (2 * 0.075 * 0.075)); }
      b[i * (NT + 1) + j] = Math.min(1, s);
    }
  }
  return b;
})();

/** Escribe en `pos` (y `col` si se da) la forma del parámetro p. Unidades: µm. */
function escribir(pos: Float32Array, col: Float32Array | null, p: number) {
  const c = Math.max(0, -p);
  const e = Math.min(1, Math.max(0, p));
  const estira = p > 1 ? 1 + (p - 1) * 0.4 : 1;
  const crena = suave01((c - 0.06) / 0.55);
  const v = new THREE.Vector3(), dir = new THREE.Vector3();
  for (let i = 0; i <= NQ; i++) {
    const q = i / NQ, rho = Math.sin(Math.PI * q), lado = q < 0.5 ? -1 : 1;
    const s2 = Math.sqrt(Math.max(0, 1 - rho * rho));
    const rB = rho * (1 - 0.14 * c), zB = zEF(rho) * (1 - 0.6 * c);
    const r = THREE.MathUtils.lerp(rB, RS * rho, e) * estira;
    const z = lado * THREE.MathUtils.lerp(zB, RS * s2, e) * estira;
    // palidez central: sólo con el disco bicóncavo (la hemoglobina es más delgada en el centro)
    const pal = (1 - e) * (1 - crena) * suave01((0.62 - rho) / 0.62);
    for (let j = 0; j <= NT; j++) {
      const k = i * (NT + 1) + j;
      const t = (j / NT) * Math.PI * 2;
      v.set(r * Math.cos(t), z, r * Math.sin(t));
      if (crena > 0) {
        dir.copy(v).normalize();
        v.addScaledVector(dir, BULTO[k] * 0.2 * crena);
      }
      pos[3 * k] = v.x * R_E; pos[3 * k + 1] = v.y * R_E; pos[3 * k + 2] = v.z * R_E;
      // el centro, más delgado, tiene menos hemoglobina: más claro y rosado (se pierde al esferizarse)
      if (col) { col[3 * k] = 0.78 + 0.5 * pal; col[3 * k + 1] = 0.78 + 0.62 * pal; col[3 * k + 2] = 0.78 + 0.62 * pal; }
    }
  }
}

let INDICE: number[] | null = null;
function indice(): number[] {
  if (INDICE) return INDICE;
  const idx: number[] = [];
  for (let i = 0; i < NQ; i++) for (let j = 0; j < NT; j++) {
    const a = i * (NT + 1) + j, b = a + 1, c = a + NT + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  // orienta las caras hacia fuera (volumen con signo positivo)
  const pos = new Float32Array((NQ + 1) * (NT + 1) * 3);
  escribir(pos, null, 0);
  if (volumenSigno(pos, idx) < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  INDICE = idx;
  return idx;
}

function volumenSigno(pos: ArrayLike<number>, idx: ArrayLike<number>): number {
  let v = 0;
  for (let k = 0; k < idx.length; k += 3) {
    const a = 3 * idx[k], b = 3 * idx[k + 1], c = 3 * idx[k + 2];
    const ax = pos[a], ay = pos[a + 1], az = pos[a + 2], bx = pos[b], by = pos[b + 1], bz = pos[b + 2], cx = pos[c], cy = pos[c + 1], cz = pos[c + 2];
    v += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx);
  }
  return v / 6;
}
function areaMalla(pos: ArrayLike<number>, idx: ArrayLike<number>): number {
  let s = 0;
  const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
  for (let k = 0; k < idx.length; k += 3) {
    A.fromArray(pos as number[], 3 * idx[k]); B.fromArray(pos as number[], 3 * idx[k + 1]); C.fromArray(pos as number[], 3 * idx[k + 2]);
    s += B.sub(A).cross(C.sub(A)).length() / 2;
  }
  return s;
}

/** Tabla volumen(p) medida sobre la malla (fL). */
let TABLA: { p: number[]; v: number[] } | null = null;
function tabla() {
  if (TABLA) return TABLA;
  const idx = indice();
  const pos = new Float32Array((NQ + 1) * (NT + 1) * 3);
  const p: number[] = [], v: number[] = [];
  for (let x = P_MIN; x <= P_MAX + 1e-9; x += PASO_P) {
    escribir(pos, null, x);
    p.push(x); v.push(volumenSigno(pos, idx));
  }
  // la tabla debe ser monótona para poder invertirla
  for (let i = 1; i < v.length; i++) if (v[i] <= v[i - 1]) v[i] = v[i - 1] + 1e-9;
  TABLA = { p, v };
  return TABLA;
}

/** Volúmenes (fL) que puede dibujar la familia de formas. */
export function rangoVolumen(): [number, number] { const t = tabla(); return [t.v[0], t.v[t.v.length - 1]]; }

/** Parámetro de forma que da el volumen V (fL). */
export function pDeVolumen(V: number): number {
  const t = tabla();
  if (V <= t.v[0]) return t.p[0];
  const n = t.v.length;
  if (V >= t.v[n - 1]) return t.p[n - 1];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (t.v[m] < V) lo = m; else hi = m; }
  const u = (V - t.v[lo]) / (t.v[hi] - t.v[lo]);
  return t.p[lo] + u * (t.p[hi] - t.p[lo]);
}

export function crearGeoEritrocito(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const n = (NQ + 1) * (NT + 1);
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setIndex(indice());
  formarEritrocito(g, ERITROCITO.V0);
  return g;
}

/** Da a la malla la forma de volumen V (fL). Devuelve el volumen medido de la malla. */
export function formarEritrocito(g: THREE.BufferGeometry, V: number): number {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const col = g.getAttribute('color') as THREE.BufferAttribute;
  escribir(pos.array as Float32Array, col.array as Float32Array, pDeVolumen(V));
  pos.needsUpdate = true; col.needsUpdate = true;
  g.computeVertexNormals();
  // costura (j = 0 ↔ j = NT) y polos: promedia las normales de los vértices repetidos
  const nor = g.getAttribute('normal') as THREE.BufferAttribute;
  const a = nor.array as Float32Array;
  const sumar = (ks: number[]) => {
    let x = 0, y = 0, z = 0;
    for (const k of ks) { x += a[3 * k]; y += a[3 * k + 1]; z += a[3 * k + 2]; }
    const l = Math.hypot(x, y, z) || 1;
    for (const k of ks) { a[3 * k] = x / l; a[3 * k + 1] = y / l; a[3 * k + 2] = z / l; }
  };
  for (let i = 1; i < NQ; i++) sumar([i * (NT + 1), i * (NT + 1) + NT]);
  for (const i of [0, NQ]) sumar(Array.from({ length: NT + 1 }, (_, j) => i * (NT + 1) + j));
  // ninguna normal nula (pantalla negra): si alguna lo fuera, la radial
  for (let k = 0; k < a.length; k += 3) {
    if (Math.hypot(a[k], a[k + 1], a[k + 2]) > 1e-6) continue;
    const pa = pos.array as Float32Array;
    const l = Math.hypot(pa[k], pa[k + 1], pa[k + 2]) || 1;
    a[k] = pa[k] / l || 0; a[k + 1] = pa[k + 1] / l || 1; a[k + 2] = pa[k + 2] / l || 0;
  }
  nor.needsUpdate = true;
  g.computeBoundingSphere();
  const v = volumenSigno(pos.array as Float32Array, g.getIndex()!.array);
  g.userData.volumen = v;
  return v;
}

/** Volumen (fL = µm³) y área (µm²) de la malla tal como está. */
export function medirMalla(g: THREE.BufferGeometry): { volumen: number; area: number } {
  const pos = g.getAttribute('position').array as Float32Array, idx = g.getIndex()!.array;
  return { volumen: volumenSigno(pos, idx), area: areaMalla(pos, idx) };
}
