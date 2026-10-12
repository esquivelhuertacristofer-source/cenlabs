/**
 * _kit/geometria.ts — utilidades de geometría (three) compartidas por el kit.
 *
 * Todas las geometrías "de catálogo" (cristalería, piezas fijas) se cachean a nivel
 * de módulo y se comparten entre instancias: NUNCA se desechan (son pocas y
 * pequeñas). Las que dependen de props continuas (curvas, cables, resortes) las
 * crea su componente en un useMemo y las libera con dispose() al cambiar.
 *
 * Trampas cubiertas aquí:
 *  - `sanearNormales`: una normal (0,0,0) es finita, pasa cualquier comprobación y
 *    deja la escena entera en NEGRO (normalize(0) = NaN en el sombreador).
 *  - LatheGeometry mide el ángulo desde +Z hacia +X (x = r·sin φ, z = r·cos φ).
 */
import * as THREE from 'three';
import type { P2 } from './perfiles';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const cache = new Map<string, THREE.BufferGeometry>();
/** Cachea una geometría compartida por clave. */
export function geoCache<T extends THREE.BufferGeometry>(clave: string, crear: () => T): T {
  let g = cache.get(clave) as T | undefined;
  if (!g) { g = crear(); cache.set(clave, g); }
  return g;
}

/** Sustituye normales nulas o no finitas por la dirección radial (o +Y) y normaliza todas. */
export function sanearNormales(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const n = g.getAttribute('normal') as THREE.BufferAttribute | undefined;
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  if (!n) { g.computeVertexNormals(); return sanearNormales(g); }
  for (let i = 0; i < n.count; i++) {
    let x = n.getX(i), y = n.getY(i), z = n.getZ(i);
    let l = Math.hypot(x, y, z);
    if (!(l > 1e-8) || !Number.isFinite(l)) {
      x = p.getX(i); y = 0; z = p.getZ(i);
      l = Math.hypot(x, z);
      if (l < 1e-8) { x = 0; y = 1; z = 0; l = 1; }
    }
    n.setXYZ(i, x / l, y / l, z / l);
  }
  n.needsUpdate = true;
  return g;
}

/** Torno: LatheGeometry con normales saneadas. `fase` gira el inicio (rad). */
export function tornear(perfil: P2[], segmentos: number, fase = 0, arco = Math.PI * 2): THREE.LatheGeometry {
  const pts = perfil.map(([r, y]) => new THREE.Vector2(Math.max(0, r), y));
  const g = new THREE.LatheGeometry(pts, segmentos, fase, arco);
  sanearNormales(g);
  return g;
}

/**
 * Pico vertedor: empuja hacia fuera el borde alrededor del ángulo `angulo` (rad del
 * torno). Se deforma sólo la franja superior; las normales del torno se conservan
 * (la desviación es de pocos grados y no se nota).
 */
export function deformarPico(
  g: THREE.BufferGeometry,
  { angulo, alto, salida, ancho, yTop }: { angulo: number; alto: number; salida: number; ancho: number; yTop: number },
) {
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const s = (y - (yTop - alto)) / alto;
    if (s <= 0) continue;
    const phi = Math.atan2(x, z);
    let d = phi - angulo;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const w = Math.abs(d) / ancho;
    if (w >= 1) continue;
    const peso = Math.pow(Math.cos((w * Math.PI) / 2), 2) * Math.pow(Math.min(1, s), 2.2);
    const r = Math.hypot(x, z);
    if (r < 1e-6) continue;
    const k = (r + salida * peso) / r;
    p.setXYZ(i, x * k, y - salida * 0.35 * peso * Math.min(1, s), z * k);
  }
  p.needsUpdate = true;
  g.computeBoundingSphere();
}

/**
 * Banda impresa sobre una superficie de revolución: torno de la polilínea
 * exterior entre y0 e y1, remuestreada UNIFORME en altura (así la coordenada v de
 * la textura es proporcional a y) y separada `holgura` hacia fuera. Centrada en el
 * ángulo `centro` (0 = mira a +Z) y abarcando `arco` radianes.
 */
export function bandaSobrePerfil(
  radioEn: (y: number) => number, y0: number, y1: number,
  { arco, centro = 0, holgura = 0.0006, filas = 24, segmentos = 24 }:
  { arco: number; centro?: number; holgura?: number; filas?: number; segmentos?: number },
): THREE.LatheGeometry {
  const pts: THREE.Vector2[] = [];
  for (let j = 0; j <= filas; j++) {
    const y = y0 + ((y1 - y0) * j) / filas;
    pts.push(new THREE.Vector2(radioEn(y) + holgura, y));
  }
  const g = new THREE.LatheGeometry(pts, segmentos, centro - arco / 2, arco);
  sanearNormales(g);
  return g;
}

/**
 * Tubo a lo largo de una polilínea 3D con marcos de transporte paralelo (sin
 * giros bruscos). Se usa para curvas de funciones, cables y cuerdas.
 * Si `geo` se pasa y tiene el mismo número de puntos, se reescribe en el sitio.
 */
export function tuboPolilinea(
  pts: ArrayLike<number>, radio: number, radiales = 8, tapas = true,
): THREE.BufferGeometry {
  const n = Math.floor(pts.length / 3);
  const g = new THREE.BufferGeometry();
  if (n < 2) return g;
  const filas = n, cols = radiales;
  const nv = filas * cols + (tapas ? 2 * (cols + 1) : 0);
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3);
  const idx: number[] = [];
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), tmp = new THREE.Vector3();
  const P = (i: number, v: THREE.Vector3) => v.set(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2]);
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  const tangente = (i: number) => {
    P(Math.min(n - 1, i + 1), a); P(Math.max(0, i - 1), b);
    T.subVectors(a, b);
    if (T.lengthSq() < 1e-16) T.set(1, 0, 0);
    T.normalize();
  };
  tangente(0);
  // normal inicial: cualquier perpendicular estable
  tmp.set(0, 0, 1);
  if (Math.abs(T.dot(tmp)) > 0.9) tmp.set(0, 1, 0);
  N.crossVectors(T, tmp).normalize();
  const Ts: THREE.Vector3[] = [], Ns: THREE.Vector3[] = [];
  for (let i = 0; i < n; i++) {
    tangente(i);
    N.addScaledVector(T, -N.dot(T));
    if (N.lengthSq() < 1e-12) { tmp.set(0, 0, 1); if (Math.abs(T.dot(tmp)) > 0.9) tmp.set(0, 1, 0); N.crossVectors(T, tmp); }
    N.normalize();
    Ts.push(T.clone()); Ns.push(N.clone());
  }
  for (let i = 0; i < n; i++) {
    P(i, a);
    B.crossVectors(Ts[i], Ns[i]);
    for (let j = 0; j < cols; j++) {
      const f = (j / cols) * Math.PI * 2;
      const c = Math.cos(f), s = Math.sin(f);
      const k = (i * cols + j) * 3;
      const nx = c * Ns[i].x + s * B.x, ny = c * Ns[i].y + s * B.y, nz = c * Ns[i].z + s * B.z;
      nor[k] = nx; nor[k + 1] = ny; nor[k + 2] = nz;
      pos[k] = a.x + radio * nx; pos[k + 1] = a.y + radio * ny; pos[k + 2] = a.z + radio * nz;
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < cols; j++) {
    const j2 = (j + 1) % cols;
    const A = i * cols + j, Bq = i * cols + j2, C = (i + 1) * cols + j2, D = (i + 1) * cols + j;
    // (Bq−A)×(D−A) = dirección del anillo × T = +N → cara hacia fuera
    idx.push(A, Bq, D, Bq, C, D);
  }
  if (tapas) {
    let base = filas * cols;
    for (const [fila, signo] of [[0, -1], [n - 1, 1]] as const) {
      P(fila, a);
      const c0 = base;
      pos.set([a.x, a.y, a.z], c0 * 3);
      nor.set([Ts[fila].x * signo, Ts[fila].y * signo, Ts[fila].z * signo], c0 * 3);
      for (let j = 0; j < cols; j++) {
        const k = (fila * cols + j) * 3;
        pos.set([pos[k], pos[k + 1], pos[k + 2]], (c0 + 1 + j) * 3);
        nor.set([Ts[fila].x * signo, Ts[fila].y * signo, Ts[fila].z * signo], (c0 + 1 + j) * 3);
      }
      for (let j = 0; j < cols; j++) {
        const j2 = (j + 1) % cols;
        if (signo < 0) idx.push(c0, c0 + 1 + j2, c0 + 1 + j); else idx.push(c0, c0 + 1 + j, c0 + 1 + j2);
      }
      base += cols + 1;
    }
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}


/** Caja de esquinas redondeadas (RoundedBoxGeometry de three, sin triángulos degenerados). */
export function cajaRedondeada(ancho: number, alto: number, fondo: number, radio: number, segs = 3): THREE.BufferGeometry {
  return geoCache(`rbox:${ancho.toFixed(4)}:${alto.toFixed(4)}:${fondo.toFixed(4)}:${radio.toFixed(4)}:${segs}`, () => {
    const g = new RoundedBoxGeometry(ancho, alto, fondo, segs, Math.min(radio, ancho / 2.01, alto / 2.01, fondo / 2.01));
    return sanearNormales(g);
  });
}

/** Cilindro compartido (eje Y, centrado). */
export function cilindro(rArriba: number, rAbajo: number, alto: number, segs = 32, abierto = false): THREE.BufferGeometry {
  return geoCache(`cil:${rArriba.toFixed(5)}:${rAbajo.toFixed(5)}:${alto.toFixed(5)}:${segs}:${abierto}`, () =>
    new THREE.CylinderGeometry(rArriba, rAbajo, alto, segs, 1, abierto));
}

/** Toro compartido. */
export function toro(R: number, r: number, segR = 12, segT = 48, arco = Math.PI * 2): THREE.BufferGeometry {
  return geoCache(`toro:${R.toFixed(5)}:${r.toFixed(5)}:${segR}:${segT}:${arco.toFixed(4)}`, () =>
    new THREE.TorusGeometry(R, r, segR, segT, arco));
}

/** Esfera compartida. */
export function esfera(r: number, segs = 24): THREE.BufferGeometry {
  return geoCache(`esf:${r.toFixed(5)}:${segs}`, () => new THREE.SphereGeometry(r, segs, Math.max(8, Math.round(segs * 0.66))));
}

/** Perfil 2D extruido SIN bisel (el bisel de ExtrudeGeometry fabrica triángulos
 *  degenerados). Devuelve la geometría con normales saneadas y UV normalizadas a [0,1]. */
export function extruir(forma: THREE.Shape, profundidad: number, curva = 24): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(forma, { depth: profundidad, bevelEnabled: false, curveSegments: curva });
  g.computeVertexNormals();
  sanearNormales(g);
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const w = bb.max.x - bb.min.x || 1, h = bb.max.y - bb.min.y || 1;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) - bb.min.x) / w, (p.getY(i) - bb.min.y) / h);
  uv.needsUpdate = true;
  return g;
}

/** Contorno de un rectángulo de esquinas redondeadas (para extruir). */
export function formaRectRedondeado(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2 - 1e-5, h / 2 - 1e-5);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Cuenta normales nulas de una geometría (diagnóstico para la vitrina/pruebas). */
export function contarNormalesNulas(g: THREE.BufferGeometry): number {
  const n = g.getAttribute('normal') as THREE.BufferAttribute | undefined;
  if (!n) return 0;
  let k = 0;
  for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) k++;
  return k;
}
