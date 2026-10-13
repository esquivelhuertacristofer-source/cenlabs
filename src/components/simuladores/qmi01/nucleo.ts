/**
 * qmi01/nucleo.ts — empaquetado y materiales de los nucleones (los usan los tres
 * modelos de la escena: Átomo, Orbitales y Bohr).
 */
import * as THREE from 'three';

export type V3 = [number, number, number];

/** Colores de los nucleones: protón coral cálido, neutrón gris azulado. */
export const COL_PROTON = '#ff6a5a';
export const COL_NEUTRON = '#a7b4c8';

/** Posiciones del núcleo: los N sitios de una red FCC más cercanos al centro, recentrados. */
export function sitiosNucleo(n: number, r: number): V3[] {
  const cand: { p: V3; d: number }[] = [];
  const paso = (2 * r) / Math.SQRT2; // vecinos a 2r → se tocan
  const off: V3 = [0.07, 0.05, 0.03];
  for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) for (let k = -6; k <= 6; k++) {
    if ((i + j + k) % 2 !== 0) continue;
    const p: V3 = [i * paso, j * paso, k * paso];
    cand.push({ p, d: Math.hypot(p[0] - off[0] * r, p[1] - off[1] * r, p[2] - off[2] * r) });
  }
  cand.sort((a, b) => a.d - b.d || a.p[0] - b.p[0] || a.p[1] - b.p[1] || a.p[2] - b.p[2]);
  const sel = cand.slice(0, n).map((c) => c.p);
  if (sel.length === 0) return [];
  const c: V3 = [0, 0, 0];
  sel.forEach((p) => { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
  c[0] /= sel.length; c[1] /= sel.length; c[2] /= sel.length;
  return sel.map((p) => [p[0] - c[0], p[1] - c[1], p[2] - c[2]] as V3);
}

/** ¿El sitio i es protón? Reparto uniforme (Bresenham) para que se vean mezclados. */
export function esProton(i: number, total: number, p: number): boolean {
  return Math.floor(((i + 1) * p) / total) > Math.floor((i * p) / total);
}

export function radioNucleonDibujado(total: number, rBase: number) {
  return rBase * Math.min(1, Math.cbrt(40 / Math.max(1, total)));
}

const cacheCumulo = new Map<number, number>();
/** Radio del cúmulo de `total` esferas de radio 1 (centro → borde de la más alejada). */
export function radioCumuloUnidad(total: number): number {
  if (total <= 0) return 0;
  let v = cacheCumulo.get(total);
  if (v === undefined) {
    v = sitiosNucleo(total, 1).reduce((m, p) => Math.max(m, Math.hypot(p[0], p[1], p[2])), 0) + 1;
    cacheCumulo.set(total, v);
  }
  return v;
}

/** Radio del cúmulo dibujado con el radio de nucleón de radioNucleonDibujado. */
export function radioCumulo(total: number, rBase: number): number {
  if (total <= 0) return 0;
  return radioCumuloUnidad(total) * radioNucleonDibujado(total, rBase);
}

/**
 * Nucleón PBR: barniz (clearcoat) y brillo de borde (sheen) para que se lea como
 * una esfera pulida y no como una bolita mate. `color` blanco = lo tiñe el
 * instanceColor de un InstancedMesh.
 */
export function materialNucleon(color: string, alta: boolean): THREE.MeshPhysicalMaterial {
  const c = new THREE.Color(color);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: 0.3,
    metalness: 0,
    clearcoat: alta ? 1 : 0.6,
    clearcoatRoughness: 0.12,
    sheen: alta ? 0.7 : 0,
    sheenColor: new THREE.Color('#ffe7dc'),
    sheenRoughness: 0.35,
    emissive: color === '#ffffff' ? new THREE.Color('#1c1410') : c.clone().multiplyScalar(0.06),
    envMapIntensity: 1.2,
    name: 'qmi01-nucleon',
  });
}
