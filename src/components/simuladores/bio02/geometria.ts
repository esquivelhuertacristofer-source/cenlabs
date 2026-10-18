/**
 * bio02/geometria.ts — las formas de la vista de la membrana, a escala (1 u = 1 nm).
 *
 *  · Hélices transmembrana: cápsulas de 1 nm de diámetro (la hélice α con sus cadenas laterales),
 *    la convención de los esquemas de proteínas de membrana.
 *  · Dominios globulares: elipsoides con lóbulos suaves de baja frecuencia (superficie
 *    «molecular», sin ruido fino).
 *  · Fosfolípido: cabeza polar de 0,8 nm y dos colas de ~1,6 nm (una recta, saturada; otra con el
 *    quiebro del doble enlace cis). Colesterol: el plano rígido de los cuatro anillos con su OH.
 *  · Moléculas: glucosa (anillo de piranosa), O₂ (dos átomos), H₂O, ATP/ADP/Pi, hemoglobina
 *    (tetrámero α₂β₂ de ~6 nm).
 * Todo indexado, con normales suaves y saneadas (cero normales nulas).
 */
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sanearNormales, azar } from '../_kit';

export type V3 = [number, number, number];
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Funde vértices repetidos (costuras) y recalcula normales suaves. */
export function suavizar(g: THREE.BufferGeometry): THREE.BufferGeometry {
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  const m = mergeVertices(g, 1e-4);
  m.computeVertexNormals();
  sanearNormales(m);
  return m;
}

/** Pinta todos los vértices de un color (atributo `color`, lineal). */
export function teñir(g: THREE.BufferGeometry, color: THREE.ColorRepresentation, variar = 0, semilla = 1): THREE.BufferGeometry {
  const c = new THREE.Color(color);
  const n = g.getAttribute('position').count;
  const col = new Float32Array(n * 3);
  const rnd = azar(semilla);
  const k = 1 + (rnd() - 0.5) * variar;
  for (let i = 0; i < n; i++) { col[3 * i] = c.r * k; col[3 * i + 1] = c.g * k; col[3 * i + 2] = c.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

/** Une geometrías ya teñidas en una sola (un dibujo). */
export function unir(partes: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(partes, false);
  partes.forEach((p) => p.dispose());
  if (!g) throw new Error('bio02: no se pudieron unir las geometrías');
  g.computeBoundingSphere();
  return g;
}

/** Cápsula de radio r entre a y b. */
export function helice(a: V3, b: V3, r = 0.5, color: THREE.ColorRepresentation = '#ffffff', semilla = 1, radial = 12): THREE.BufferGeometry {
  const pa = V(...a), pb = V(...b);
  const L = Math.max(0.01, pa.distanceTo(pb));
  const g = suavizar(new THREE.CapsuleGeometry(r, L, 4, radial));
  const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), pb.clone().sub(pa).normalize());
  g.applyQuaternion(q);
  const m = pa.clone().add(pb).multiplyScalar(0.5);
  g.translate(m.x, m.y, m.z);
  return teñir(g, color, 0.08, semilla);
}

/** Tubo suave por puntos (lazos, conectores, colas de lípido). */
export function tubo(puntos: V3[], r: number, color: THREE.ColorRepresentation = '#ffffff', seg = 16, radial = 8, cerrar = true): THREE.BufferGeometry {
  const curva = new THREE.CatmullRomCurve3(puntos.map((p) => V(...p)), false, 'centripetal');
  let g: THREE.BufferGeometry = new THREE.TubeGeometry(curva, seg, r, radial, false);
  if (cerrar) {
    // tapas redondas: una esfera en cada extremo, fundida con el tubo
    const e0 = new THREE.SphereGeometry(r, radial, Math.max(4, radial / 2));
    const e1 = e0.clone();
    const p0 = curva.getPoint(0), p1 = curva.getPoint(1);
    e0.translate(p0.x, p0.y, p0.z); e1.translate(p1.x, p1.y, p1.z);
    g.deleteAttribute('uv'); e0.deleteAttribute('uv'); e1.deleteAttribute('uv');
    g = mergeGeometries([g, e0, e1], false)!;
  }
  return teñir(suavizar(g), color);
}

/**
 * Dominio globular: elipsoide de semiejes `r` con lóbulos suaves (3 armónicos de baja
 * frecuencia, amplitud ~8 %): parece una superficie molecular y no una esfera de juguete.
 */
export function globulo(c: V3, r: V3, color: THREE.ColorRepresentation, semilla = 1, detalle = 3, lobulos = 0.08): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(1, detalle);
  const rnd = azar(semilla);
  const f = [0, 1, 2].map(() => ({ a: 2 + Math.floor(rnd() * 3), b: 1 + Math.floor(rnd() * 3), p: rnd() * 6.28, q: rnd() * 6.28 }));
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const th = Math.acos(THREE.MathUtils.clamp(v.y, -1, 1)), ph = Math.atan2(v.z, v.x);
    let k = 1;
    f.forEach((h, j) => { k += (lobulos / (j + 1)) * Math.sin(h.a * th + h.p) * Math.cos(h.b * ph + h.q); });
    p.setXYZ(i, v.x * r[0] * k + c[0], v.y * r[1] * k + c[1], v.z * r[2] * k + c[2]);
  }
  return teñir(suavizar(g), color, 0.06, semilla);
}

// ───────────────────────────── lípidos ─────────────────────────────

/** Medidas de la bicapa (nm). */
export const BICAPA = {
  /** altura del centro de las cabezas (fosfato) de cada hoja */
  yCabeza: 2.05,
  rCabeza: 0.42,
  /** las colas van de ±1,65 a ±0,15 */
  yColaArriba: 1.65,
  yColaAbajo: 0.15,
  /** borde de la región que corta el plano z = 0 (la bicapa con sus cabezas) */
  eCorte: 2.6,
  /** paso de la red hexagonal: área por lípido (√3/2)·a² = 0,655 nm² */
  paso: 0.87,
} as const;

/** Dos colas de un fosfolípido de la hoja de arriba (bajan de y = 1,65 hacia el centro). Origen en la cabeza. */
export function colasLipido(radial = 5): THREE.BufferGeometry {
  const { yCabeza, yColaArriba, yColaAbajo } = BICAPA;
  const top = yColaArriba - yCabeza, fondo = yColaAbajo - yCabeza;
  const L = top - fondo;
  // sn-1 saturada (recta, leve ondulación) y sn-2 con el quiebro cis a media altura
  const recta: V3[] = [[-0.16, -0.2, 0], [-0.17, top, 0.02], [-0.15, top - L * 0.35, -0.02], [-0.18, top - L * 0.7, 0.03], [-0.14, fondo, 0]];
  const cis: V3[] = [[0.16, -0.2, 0], [0.17, top, 0], [0.16, top - L * 0.42, 0.02], [0.36, top - L * 0.55, 0.05], [0.4, top - L * 0.8, 0.02], [0.38, fondo + 0.05, 0]];
  const glicerol = new THREE.SphereGeometry(0.2, 6, 4); glicerol.translate(0, -0.3, 0);
  glicerol.deleteAttribute('uv');
  const a = tubo(recta, 0.12, '#ffffff', 6, radial);
  const b = tubo(cis, 0.12, '#ffffff', 7, radial);
  const gl = teñir(suavizar(glicerol), '#ffffff');
  return unir([a, b, gl]);
}

/** Colesterol de la hoja de arriba: OH (origen), el plano de los anillos y la cola isooctilo. */
export function colesterol(): THREE.BufferGeometry {
  const oh = teñir(suavizar(new THREE.SphereGeometry(0.2, 10, 8)), '#f6efe6');
  const anillos = globulo([0, -0.75, 0], [0.42, 0.62, 0.2], '#efe0b0', 7, 1, 0.03);
  const cola = tubo([[0, -1.3, 0], [0.05, -1.55, 0.02], [-0.02, -1.85, 0]], 0.1, '#e6d6a8', 6, 6);
  return unir([oh, anillos, cola]);
}

// ───────────────────────────── moléculas ─────────────────────────────

/** Glucosa: anillo de piranosa (6 vértices) visto como un hexágono redondeado de ~0,8 nm. */
export function glucosa(): THREE.BufferGeometry {
  const g = new THREE.TorusGeometry(0.3, 0.1, 6, 6);
  g.rotateX(Math.PI / 2);
  return teñir(suavizar(g), '#ffffff');
}
/** O₂: dos átomos de oxígeno (0,24 nm de radio dibujado). */
export function oxigeno(): THREE.BufferGeometry {
  const a = new THREE.SphereGeometry(0.22, 10, 8); a.translate(-0.15, 0, 0);
  const b = new THREE.SphereGeometry(0.22, 10, 8); b.translate(0.15, 0, 0);
  a.deleteAttribute('uv'); b.deleteAttribute('uv');
  return teñir(suavizar(mergeGeometries([a, b])!), '#ffffff');
}
/** H₂O: el oxígeno y los dos hidrógenos a 104,5°. */
export function agua(): THREE.BufferGeometry {
  const o = teñir(suavizar(new THREE.SphereGeometry(0.17, 10, 8)), '#3f9fe0');
  const ang = THREE.MathUtils.degToRad(104.5) / 2;
  const h1 = teñir(suavizar(new THREE.SphereGeometry(0.1, 8, 6)), '#e8f6ff'); h1.translate(Math.sin(ang) * 0.17, Math.cos(ang) * 0.17, 0);
  const h2 = teñir(suavizar(new THREE.SphereGeometry(0.1, 8, 6)), '#e8f6ff'); h2.translate(-Math.sin(ang) * 0.17, Math.cos(ang) * 0.17, 0);
  return unir([o, h1, h2]);
}
/** ATP (n = 3), ADP (n = 2) o Pi (n = 1, sin nucleósido): adenina, ribosa y la cadena de fosfatos. */
export function nucleotido(n: 1 | 2 | 3): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = [];
  if (n > 1) {
    const ad = new THREE.TorusGeometry(0.22, 0.09, 6, 6); ad.rotateX(Math.PI / 2); ad.translate(-0.62, 0.05, 0);
    const ad2 = new THREE.TorusGeometry(0.17, 0.08, 6, 5); ad2.rotateX(Math.PI / 2); ad2.translate(-0.95, 0.12, 0);
    const rib = new THREE.TorusGeometry(0.17, 0.08, 6, 5); rib.rotateX(Math.PI / 2); rib.translate(-0.22, -0.08, 0);
    partes.push(teñir(suavizar(ad), '#4fc3c9'), teñir(suavizar(ad2), '#4fc3c9'), teñir(suavizar(rib), '#d9d2b8'));
  }
  for (let i = 0; i < n; i++) {
    const p = new THREE.SphereGeometry(0.17, 10, 8);
    p.translate(n > 1 ? 0.12 + i * 0.33 : 0, n > 1 ? -0.1 + (i % 2) * 0.05 : 0, 0);
    partes.push(teñir(suavizar(p), i === n - 1 && n === 3 ? '#ffb347' : '#f0a23a'));
  }
  return unir(partes);
}
/** Hemoglobina: tetrámero α₂β₂ (~6 nm) con sus cuatro hemos insinuados por el color de cada subunidad. */
export function hemoglobina(detalle = 2): THREE.BufferGeometry {
  const s = 1.35;
  const pos: V3[] = [[s, s * 0.7, s * 0.4], [-s, s * 0.7, -s * 0.4], [s * 0.4, -s * 0.7, -s], [-s * 0.4, -s * 0.7, s]];
  return unir(pos.map((p, i) => globulo(p, [1.45, 1.3, 1.35], i < 2 ? '#ffffff' : '#ece6ea', 40 + i, detalle, 0.1)));
}

// ───────────────────────────── proteínas ─────────────────────────────

/** Acuaporina-1: un monómero (6 hélices TM y las dos semihélices NPA), poro en el eje y local. */
export function monomeroAcuaporina(color: string, semilla: number): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = [];
  const claro = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.25).getStyle();
  for (let i = 0; i < 6; i++) {
    const a = THREE.MathUtils.degToRad(i * 60 + 30);
    const t = (i % 2 ? 1 : -1) * 0.35;
    const r0 = 1.32, r1 = 1.12;
    partes.push(helice(
      [Math.cos(a + t) * r0, -2.25, Math.sin(a + t) * r0],
      [Math.cos(a - t) * r1, 2.25, Math.sin(a - t) * r1],
      0.48, color, semilla * 10 + i,
    ));
  }
  // semihélices B y E: entran desde cada cara y se encuentran en el centro (motivos NPA)
  partes.push(helice([0.95, -2.0, 0.55], [0.32, -0.15, 0.22], 0.36, claro, semilla * 10 + 7));
  partes.push(helice([-0.95, 2.0, -0.55], [-0.32, 0.15, -0.22], 0.36, claro, semilla * 10 + 8));
  // lazos de fuera (C) y de dentro (B, D)
  partes.push(tubo([[1.1, 2.3, 0.6], [1.6, 3.0, 0.1], [0.7, 3.1, -1.0], [-0.4, 2.4, -1.1]], 0.2, claro, 14, 6));
  partes.push(tubo([[-1.1, -2.3, 0.6], [-1.6, -2.95, -0.2], [-0.4, -3.0, -1.1], [0.6, -2.4, -1.1]], 0.2, claro, 14, 6));
  return unir(partes);
}

/** GLUT1: un haz de 6 hélices (dominio N o C), centrado en su pivote; `lado` −1 izquierda, +1 derecha. */
export function hazGlut1(lado: -1 | 1, color: string, semilla: number): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = [];
  const cx = lado * 1.45;
  // semicírculo de hélices abierto hacia la cavidad central (x = 0): las de ±135° forman sus
  // paredes de delante y de detrás y dejan un hueco de ~0,6 nm de radio para la glucosa
  const angs = [-135, -80, -25, 25, 80, 135].map((d) => THREE.MathUtils.degToRad(d));
  angs.forEach((a, i) => {
    const r = 1.15;
    const x = cx + lado * Math.cos(a) * r, z = Math.sin(a) * r;
    const inc = (i % 2 ? 1 : -1) * 0.2;
    partes.push(helice([x + inc * lado, -2.2, z - inc], [x - inc * lado, 2.2, z + inc], 0.46, color, semilla + i));
  });
  const claro = new THREE.Color(color).lerp(new THREE.Color('#fff6e0'), 0.3).getStyle();
  partes.push(tubo([[cx + lado * 0.3, 2.3, 0.9], [cx + lado * 1.4, 2.9, 0.2], [cx + lado * 0.6, 3.0, -1.0]], 0.2, claro, 12, 6));
  partes.push(tubo([[cx + lado * 0.4, -2.3, -0.9], [cx + lado * 1.4, -2.85, -0.2], [cx + lado * 0.5, -2.9, 0.9]], 0.2, claro, 12, 6));
  return unir(partes);
}
/** Dominio helicoidal intracelular (ICH) de GLUT1: 4 hélices cortas bajo la membrana. */
export function ichGlut1(color: string): THREE.BufferGeometry {
  return unir([
    helice([-2.2, -3.25, -0.9], [-0.4, -3.45, -1.3], 0.36, color, 61),
    helice([0.4, -3.4, -1.3], [2.1, -3.2, -0.8], 0.36, color, 62),
    helice([-1.9, -3.7, 0.1], [-0.6, -3.9, -0.4], 0.34, color, 63),
    helice([0.7, -3.85, -0.4], [1.9, -3.65, 0.2], 0.34, color, 64),
  ]);
}

/** Na⁺/K⁺-ATPasa: la parte transmembrana de α (10 hélices; dos son compuertas que se mueven aparte). */
export const BOMBA_TM: { a: V3; b: V3 }[] = [
  { a: [-1.75, -2.3, -0.2], b: [-1.55, 2.3, -0.5] },
  { a: [-1.1, -2.3, -1.45], b: [-1.3, 2.3, -1.1] },
  { a: [0.1, -2.3, -1.75], b: [-0.1, 2.3, -1.55] },
  { a: [1.25, -2.3, -1.3], b: [1.05, 2.3, -1.55] },
  { a: [1.75, -2.3, -0.15], b: [1.65, 2.3, 0.15] },
  { a: [-0.6, -2.3, -0.7], b: [-0.45, 2.3, -0.95] },
  { a: [0.75, -2.3, -0.55], b: [0.6, 2.3, -0.8] },
  { a: [1.15, -2.3, 0.75], b: [1.35, 2.3, 0.6] },
];
export function bombaTM(color: string): THREE.BufferGeometry {
  const claro = new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.22).getStyle();
  return unir([
    ...BOMBA_TM.map((h, i) => helice(h.a, h.b, 0.48, i % 3 ? color : claro, 80 + i)),
    // tallo hacia el dominio P y lazos de fuera
    tubo([[0.2, -2.4, -0.9], [0.1, -2.9, -0.9], [0.0, -3.1, -1.0]], 0.3, claro, 8, 8),
    tubo([[-1.4, 2.4, -0.7], [-0.9, 3.0, -1.0], [-0.3, 2.5, -1.5]], 0.2, claro, 10, 6),
    tubo([[0.9, 2.4, -1.4], [1.5, 2.95, -1.0], [1.6, 2.45, -0.1]], 0.2, claro, 10, 6),
  ]);
}
/** Compuerta: una hélice que se inclina para abrir el camino hacia una cara. */
export function compuertaBomba(color: string): THREE.BufferGeometry {
  return helice([0, -2.3, 0], [0, 2.3, 0], 0.46, color, 99);
}
/** Subunidad β: una hélice TM y el dominio de fuera con sus tres N-glicanos. */
export function subunidadBeta(color: string): THREE.BufferGeometry {
  const partes = [
    helice([2.55, -2.2, -1.6], [2.45, 2.4, -1.4], 0.42, color, 120),
    globulo([1.6, 3.85, -1.2], [1.65, 0.95, 1.35], color, 121, 3),
  ];
  // N-glicanos: cadenas ramificadas de azúcares (anillos pequeños)
  const rnd = azar(122);
  for (const base of [[0.6, 4.6, -0.4], [2.4, 4.7, -0.6], [1.6, 4.6, -2.1]] as V3[]) {
    let p = new THREE.Vector3(...base);
    for (let k = 0; k < 5; k++) {
      const s = new THREE.SphereGeometry(0.2, 8, 6); s.translate(p.x, p.y, p.z); s.deleteAttribute('uv');
      partes.push(teñir(suavizar(s), k % 2 ? '#f3f7fb' : '#cfe7f5'));
      p = p.clone().add(new THREE.Vector3((rnd() - 0.5) * 0.5, 0.36, (rnd() - 0.5) * 0.5));
      if (k === 2) {
        const r = p.clone().add(new THREE.Vector3(0.38, -0.05, 0.1));
        const s2 = new THREE.SphereGeometry(0.19, 8, 6); s2.translate(r.x, r.y, r.z); s2.deleteAttribute('uv');
        partes.push(teñir(suavizar(s2), '#e8f1f8'));
      }
    }
  }
  return unir(partes);
}
