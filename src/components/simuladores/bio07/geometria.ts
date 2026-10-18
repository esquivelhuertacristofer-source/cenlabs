/**
 * bio07/geometria.ts — geometrías del lab (three, sin React).
 *
 *  · tuboVariable: tubo de radio variable a lo largo de una curva (marcos de Frenet
 *    suavizados), con puntas redondeadas y normales analíticas (inclinadas por dr/ds):
 *    ninguna normal nula. Escribe `aU` (posición 0–1 en el perfil de la fibra).
 *  · fibraMielinica: axón + vainas (internodos) con los nodos de Ranvier en `nodos`.
 *  · somaNeurona: soma con lóbulos hacia las dendritas y su árbol dendrítico ramificado.
 *  · forma de mariposa de la sustancia gris, perfiles de torno de huesos y músculos.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { azar } from './materiales';

export type V3 = [number, number, number];
export const v3 = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);

export interface OpcionesTubo {
  /** tramo de la curva (0–1) */
  u0?: number;
  u1?: number;
  /** segmentos a lo largo y alrededor */
  segs?: number;
  radial?: number;
  /** puntas redondeadas (anillos que cierran el tubo) */
  tapaIni?: boolean;
  tapaFin?: boolean;
  /** valor de `aU` en u0 y en u1 (por defecto u0 y u1) */
  perfil?: [number, number];
  /** 1 donde hay canal (nodo) en función de u */
  nodo?: (u: number) => number;
  /** coordenadas de textura: x a lo largo (0–1 en el tramo), y alrededor */
  uv?: boolean;
}

/**
 * Tubo de radio r(u) a lo largo de `curva` entre u0 y u1. Las normales salen del radio
 * y de su pendiente: n = (cos θ·N + sen θ·B) − (dr/ds)·T, normalizada.
 */
export function tuboVariable(curva: THREE.Curve<THREE.Vector3>, radio: (u: number) => number, o: OpcionesTubo = {}): THREE.BufferGeometry {
  const u0 = o.u0 ?? 0, u1 = o.u1 ?? 1;
  const segs = Math.max(2, o.segs ?? 64), rad = Math.max(3, o.radial ?? 12);
  const p0 = o.perfil?.[0] ?? u0, p1 = o.perfil?.[1] ?? u1;
  // marcos a lo largo del tramo (transporte paralelo para que no se retuerza)
  const T: THREE.Vector3[] = [], N: THREE.Vector3[] = [], B: THREE.Vector3[] = [], P: THREE.Vector3[] = [], U: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const u = u0 + ((u1 - u0) * i) / segs;
    U.push(u);
    P.push(curva.getPointAt(Math.min(1, Math.max(0, u))));
    T.push(curva.getTangentAt(Math.min(1, Math.max(0, u))).normalize());
  }
  const ref = Math.abs(T[0].y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  N.push(new THREE.Vector3().crossVectors(T[0], ref).normalize());
  B.push(new THREE.Vector3().crossVectors(T[0], N[0]).normalize());
  for (let i = 1; i <= segs; i++) {
    const eje = new THREE.Vector3().crossVectors(T[i - 1], T[i]);
    const n = N[i - 1].clone();
    if (eje.length() > 1e-6) { eje.normalize(); const ang = Math.acos(Math.min(1, Math.max(-1, T[i - 1].dot(T[i])))); n.applyAxisAngle(eje, ang); }
    N.push(n.normalize());
    B.push(new THREE.Vector3().crossVectors(T[i], n).normalize());
  }
  const largo = curva.getLength() * (u1 - u0);
  const ds = largo / segs;
  const pos: number[] = [], nor: number[] = [], aU: number[] = [], aN: number[] = [], idx: number[] = [], uvs: number[] = [];
  let uvX = 0;
  const anillo = (P0: THREE.Vector3, t: THREE.Vector3, n: THREE.Vector3, b: THREE.Vector3, r: number, drds: number, uPerfil: number, nodo: number) => {
    const base = pos.length / 3;
    for (let j = 0; j <= rad; j++) {
      const th = (j / rad) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      const dx = n.x * c + b.x * s, dy = n.y * c + b.y * s, dz = n.z * c + b.z * s;
      pos.push(P0.x + r * dx, P0.y + r * dy, P0.z + r * dz);
      const nn = new THREE.Vector3(dx - drds * t.x, dy - drds * t.y, dz - drds * t.z).normalize();
      nor.push(nn.x, nn.y, nn.z);
      aU.push(uPerfil); aN.push(nodo);
      uvs.push(uvX, j / rad);
    }
    return base;
  };
  const anillos: number[] = [];
  const perfilDe = (u: number) => p0 + ((p1 - p0) * (u - u0)) / Math.max(1e-9, u1 - u0);
  // tapa inicial: casquete (radio de 0 a r en 4 anillos)
  const rIni = radio(u0), rFin = radio(u1);
  if (o.tapaIni) {
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * (Math.PI / 2);
      const r = Math.max(1e-4, rIni * Math.sin(a + 0.02));
      const back = rIni * Math.cos(a);
      const Pk = P[0].clone().addScaledVector(T[0], -back);
      // normal de esfera: sen a·radial − cos a·T  →  n ∝ radial − cot(a)·T
      anillos.push(anillo(Pk, T[0], N[0], B[0], r, 1 / Math.max(0.05, Math.tan(a + 0.02)), perfilDe(u0), o.nodo?.(u0) ?? 0));
    }
  }
  for (let i = 0; i <= segs; i++) {
    const r = radio(U[i]);
    const ra = radio(U[Math.max(0, i - 1)]), rb = radio(U[Math.min(segs, i + 1)]);
    const drds = (rb - ra) / (ds * (Math.min(segs, i + 1) - Math.max(0, i - 1)) || 1);
    uvX = i / segs;
    anillos.push(anillo(P[i], T[i], N[i], B[i], Math.max(1e-4, r), drds, perfilDe(U[i]), o.nodo?.(U[i]) ?? 0));
  }
  if (o.tapaFin) {
    for (let k = 1; k <= 4; k++) {
      const a = (k / 4) * (Math.PI / 2);
      const r = Math.max(1e-4, rFin * Math.cos(Math.min(a, Math.PI / 2 - 0.02)));
      const fw = rFin * Math.sin(a);
      const Pk = P[segs].clone().addScaledVector(T[segs], fw);
      // normal de esfera: cos a·radial + sen a·T  →  n ∝ radial + tan(a)·T
      anillos.push(anillo(Pk, T[segs], N[segs], B[segs], r, -Math.min(20, Math.tan(Math.min(a, Math.PI / 2 - 0.05))), perfilDe(u1), o.nodo?.(u1) ?? 0));
    }
  }
  // triángulos con la cara frontal hacia FUERA: (a lo largo del anillo) × T = radial
  for (let a = 0; a < anillos.length - 1; a++) {
    const i0 = anillos[a], i1 = anillos[a + 1];
    for (let j = 0; j < rad; j++) idx.push(i0 + j, i0 + j + 1, i1 + j, i0 + j + 1, i1 + j + 1, i1 + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(aU, 1));
  g.setAttribute('aNodo', new THREE.Float32BufferAttribute(aN, 1));
  if (o.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  return g;
}

/** Une geometrías con los mismos atributos (null si no hay ninguna). */
export function unir(partes: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = partes.length === 1 ? partes[0] : mergeGeometries(partes, false)!;
  if (partes.length > 1) partes.forEach((p) => p.dispose());
  return g;
}

/** Garantiza `aU` y `aNodo` (para unir piezas que no los traen). */
export function conAtributos(g: THREE.BufferGeometry, u = 0, nodo = 0): THREE.BufferGeometry {
  const n = g.getAttribute('position').count;
  if (!g.getAttribute('aU')) g.setAttribute('aU', new THREE.Float32BufferAttribute(new Float32Array(n).fill(u), 1));
  if (!g.getAttribute('aNodo')) g.setAttribute('aNodo', new THREE.Float32BufferAttribute(new Float32Array(n).fill(nodo), 1));
  if (g.getAttribute('uv')) g.deleteAttribute('uv');
  if (!g.index) { const idx = Array.from({ length: n }, (_, i) => i); g.setIndex(idx); }
  return g;
}

export interface Fibra {
  axon: THREE.BufferGeometry;
  vainas: THREE.BufferGeometry | null;
  /** posición de cada nodo en la curva (u) */
  nodos: number[];
}

/**
 * Fibra nerviosa a lo largo de `curva`: axón de radio rAx y, si hay mielina, vainas de
 * radio rMy entre nodos (huecos de `hueco` en u), con los extremos afinados como los
 * paranodos. `perfilU(u)` da la coordenada del perfil (para el color).
 */
export function fibraMielinica(curva: THREE.Curve<THREE.Vector3>, o: {
  rAx: number; rMy: number; nodos: number[]; hueco: number; mielina: boolean;
  perfilU?: (u: number) => number; segsPorU?: number; radial?: number; u0?: number; u1?: number; tapaIni?: boolean; tapaFin?: boolean;
}): Fibra {
  const u0 = o.u0 ?? 0, u1 = o.u1 ?? 1;
  const perfilU = o.perfilU ?? ((u: number) => u);
  const largo = curva.getLength();
  const segsAx = o.segsPorU ? Math.max(24, Math.round(o.segsPorU * (u1 - u0))) : Math.max(24, Math.round((largo * (u1 - u0)) / Math.max(0.01, o.rAx * 1.6)));
  const enNodo = (u: number) => (o.nodos.some((n) => Math.abs(u - n) <= o.hueco * 0.75) ? 1 : 0);
  // el axón: tramos para que aU siga a perfilU (que puede no ser lineal)
  const partes: THREE.BufferGeometry[] = [];
  const cortes = 12;
  for (let k = 0; k < cortes; k++) {
    const a = u0 + ((u1 - u0) * k) / cortes, b = u0 + ((u1 - u0) * (k + 1)) / cortes;
    partes.push(tuboVariable(curva, () => o.rAx, {
      u0: a, u1: b, segs: Math.max(4, Math.round(segsAx / cortes)), radial: o.radial ?? 10, perfil: [perfilU(a), perfilU(b)], nodo: enNodo,
      tapaIni: k === 0 && o.tapaIni, tapaFin: k === cortes - 1 && o.tapaFin,
    }));
  }
  const axon = unir(partes);
  let vainas: THREE.BufferGeometry | null = null;
  if (o.mielina) {
    const vs: THREE.BufferGeometry[] = [];
    const lim = [u0 - o.hueco, ...o.nodos.filter((n) => n > u0 && n < u1), u1 + o.hueco];
    for (let k = 0; k < lim.length - 1; k++) {
      const a = Math.max(u0, lim[k] + o.hueco / 2), b = Math.min(u1, lim[k + 1] - o.hueco / 2);
      if (b - a < o.hueco * 0.5) continue;
      const L = (b - a) * largo;
      // paranodo corto: la vaina se cierra sobre el axón sólo en sus extremos
      const afilado = Math.min(0.22, (o.rMy * 0.7) / Math.max(1e-6, L));
      const radio = (u: number) => {
        const s = (u - a) / (b - a);
        const e = Math.min(s, 1 - s) / afilado;
        const k2 = e >= 1 ? 1 : Math.sin((Math.PI / 2) * e);
        return o.rAx + (o.rMy - o.rAx) * k2;
      };
      vs.push(tuboVariable(curva, radio, { u0: a, u1: b, segs: Math.max(10, Math.round(L / (o.rMy * 0.8))), radial: o.radial ? o.radial + 4 : 16, perfil: [perfilU(a), perfilU(b)] }));
    }
    if (vs.length) vainas = unir(vs);
  }
  return { axon, vainas, nodos: o.nodos };
}

/** Árbol dendrítico: ramas que salen de la superficie del soma y se bifurcan dos veces. */
export function arbolDendritico(centro: V3, rSoma: number, o: {
  semilla: number; ramas: number; largo: number; r0: number; niveles?: number; aplastar?: number; excluir?: V3;
}): { geo: THREE.BufferGeometry; bases: THREE.Vector3[] } {
  const rnd = azar(o.semilla);
  const c = v3(centro);
  const partes: THREE.BufferGeometry[] = [];
  const bases: THREE.Vector3[] = [];
  const excluir = o.excluir ? v3(o.excluir).normalize() : null;
  const rama = (ini: THREE.Vector3, dir: THREE.Vector3, largo: number, r0: number, nivel: number) => {
    const pts: THREE.Vector3[] = [ini.clone()];
    const d = dir.clone();
    let p = ini.clone();
    const n = 5;
    for (let i = 1; i <= n; i++) {
      d.add(new THREE.Vector3((rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.35 * (o.aplastar ?? 1))).normalize();
      p = p.clone().addScaledVector(d, largo / n);
      pts.push(p);
    }
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const r1 = r0 * 0.42;
    partes.push(tuboVariable(curva, (u) => r0 + (r1 - r0) * Math.pow(u, 0.8), { segs: 22, radial: 9, tapaFin: nivel >= (o.niveles ?? 2) }));
    if (nivel < (o.niveles ?? 2)) {
      for (const signo of [-1, 1]) {
        const giro = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, (rnd() - 0.5) * (o.aplastar ?? 1)).cross(d).normalize();
        const nd = d.clone().applyAxisAngle(giro, signo * (0.45 + 0.35 * rnd())).normalize();
        rama(p.clone(), nd, largo * (0.62 + 0.2 * rnd()), r1 * 1.02, nivel + 1);
      }
    }
  };
  let colocadas = 0, intentos = 0;
  while (colocadas < o.ramas && intentos < 200) {
    intentos++;
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
    const dir = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph) * (o.aplastar ?? 1)).normalize();
    if (excluir && dir.dot(excluir) > 0.55) continue;
    if (bases.some((b) => b.dot(dir) > 0.72)) continue;
    bases.push(dir.clone());
    const ini = c.clone().addScaledVector(dir, rSoma * 0.82);
    rama(ini, dir, o.largo * (0.75 + 0.5 * rnd()), o.r0 * (0.8 + 0.4 * rnd()), 1);
    colocadas++;
  }
  return { geo: unir(partes.map((p) => conAtributos(p))), bases };
}

/**
 * Soma: esfera deformada con lóbulos suaves hacia las dendritas y el cono axónico (forma
 * de estrella redondeada de una motoneurona), sin ruido fino.
 */
export function geoSoma(r: number, lobulos: THREE.Vector3[], semilla = 1, segs = 64): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(r, segs, Math.round(segs * 0.75));
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const rnd = azar(semilla);
  const fases = [rnd() * 6, rnd() * 6, rnd() * 6];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = v.clone().normalize();
    let k = 1 + 0.05 * Math.sin(3 * d.x + fases[0]) * Math.sin(2 * d.y + fases[1]) + 0.04 * Math.sin(2.5 * d.z + fases[2]);
    for (const l of lobulos) { const c = d.dot(l); if (c > 0.6) k += 0.28 * Math.pow((c - 0.6) / 0.4, 2); }
    v.copy(d).multiplyScalar(r * k);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.deleteAttribute('uv');
  g.computeVertexNormals();
  // los vértices duplicados de los polos que no usa ningún triángulo quedan con normal nula
  const n = g.getAttribute('normal') as THREE.BufferAttribute;
  for (let i = 0; i < n.count; i++) {
    if (Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6) continue;
    v.fromBufferAttribute(p, i).normalize();
    n.setXYZ(i, v.x, v.y, v.z);
  }
  return conAtributos(g);
}

/** Mariposa de la sustancia gris de la médula lumbar (contorno en coordenadas −1..1). */
export function formaMariposa(rx: number, ry: number): THREE.Shape {
  // semicontorno derecho de arriba (asta dorsal) a abajo (asta ventral ancha, lumbar)
  const der: [number, number][] = [
    [0.0, 0.16], [0.07, 0.2], [0.16, 0.36], [0.24, 0.56], [0.31, 0.74], [0.37, 0.83], [0.43, 0.8], [0.42, 0.66],
    [0.36, 0.46], [0.36, 0.3], [0.46, 0.18], [0.58, 0.09], [0.66, -0.02], [0.72, -0.18], [0.72, -0.36], [0.66, -0.52],
    [0.55, -0.64], [0.4, -0.68], [0.27, -0.62], [0.17, -0.48], [0.09, -0.34], [0.0, -0.3],
  ];
  const izq = der.slice(1, -1).reverse().map(([x, y]) => [-x, y] as [number, number]);
  const pts = [...der, ...izq].map(([x, y]) => new THREE.Vector2(x * rx, y * ry));
  const curva = new THREE.SplineCurve([...pts, pts[0]]);
  return new THREE.Shape(curva.getPoints(220));
}

/** Contorno exterior de la médula: elipse con el surco medio dorsal y la fisura media ventral. */
export function contornoMedula(rx: number, ry: number): THREE.Vector2[] {
  const pts: THREE.Vector2[] = [];
  const n = 200;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx;
    let y = Math.sin(a) * ry;
    // un poco más ancha por delante (asta ventral lumbar)
    y *= 1 - 0.05 * Math.sin(a);
    // fisura ventral (abajo) y surco dorsal (arriba)
    const dv = Math.abs(((a - (3 * Math.PI) / 2 + Math.PI) % (2 * Math.PI)) - Math.PI);
    if (dv < 0.09) y += ry * 0.2 * (1 - dv / 0.09) ** 2;
    const dd = Math.abs(((a - Math.PI / 2 + Math.PI) % (2 * Math.PI)) - Math.PI);
    if (dd < 0.05) y -= ry * 0.08 * (1 - dd / 0.05) ** 2;
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
}

/** Torno a partir de un perfil (r, y) con normales suaves; eje +Y. */
export function torno(perfil: [number, number][], segs = 48, conUV = false): THREE.BufferGeometry {
  const g = new THREE.LatheGeometry(perfil.map(([r, y]) => new THREE.Vector2(Math.max(1e-4, r), y)), segs);
  // LatheGeometry ya trae normales suaves y bien orientadas (también en la costura)
  if (!conUV) return conAtributos(g);
  // uv con x a lo largo del eje (las fibras de la textura van en x) e y alrededor
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) { const a = uv.getX(i), b = uv.getY(i); uv.setXY(i, b, a); }
  const n = g.getAttribute('position').count;
  g.setAttribute('aU', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  g.setAttribute('aNodo', new THREE.Float32BufferAttribute(new Float32Array(n), 1));
  return g;
}

/** Huso: perfil fusiforme de longitud L y radio máximo R (para músculos y husos). */
export function perfilHuso(L: number, R: number, n = 28, punta = 0.08): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = -L / 2 + L * t;
    const r = Math.max(R * punta, R * Math.pow(Math.sin(Math.PI * t), 0.75));
    out.push([i === 0 || i === n ? 1e-4 : r, y]);
  }
  return out;
}
