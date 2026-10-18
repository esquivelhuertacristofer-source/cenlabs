/**
 * fis10/geometria.ts — geometría del motor (three, 1 u = 1 cm). Las cotas magnéticas salen
 * de motor.ts (inducido Ø 40 mm, entrehierro 0,8 mm, imanes de 4 mm en arcos de 100°,
 * yugo de 7 mm, longitud activa 50 mm): la escena es la máquina que se calcula.
 *
 * Eje del motor = Z; el corte transversal está en z = 0 (se quitó la mitad delantera) y
 * todo lo demás queda detrás (z < 0). Normales SIEMPRE suaves y no nulas: las superficies
 * curvas llevan normal radial y las piezas extruidas pasan por `toCreasedNormals`.
 */
import * as THREE from 'three';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { sanearNormales } from '../_kit/geometria';
import { GEOM, R_M, R_Y, R_O } from './motor';

const GRAD = Math.PI / 180;
export const CM = 100;

/** Cotas de la escena (cm). */
export const COTA = {
  Rr: GEOM.Rr * CM,
  Rm: R_M * CM,
  Ry: R_Y * CM,
  Ro: R_O * CM,
  alfa: GEOM.alfa,
  /** medio paquete visible (el corte está a media longitud) */
  zPaquete: -(GEOM.L * CM) / 2,
  /** franja delantera del yugo que queda entera (la ventana empieza detrás) */
  zVentana: -0.6,
  zYugo: -3.9,
  rEje: 0.4,
  /** ranura: boca, cuello y cuerpo */
  ranura: { rBoca: 1.86, mBoca: 0.11, rHombro: 1.78, mCuerpo: 0.28, rFondo: 1.05 },
  /** escudo trasero */
  zEscudo: [-3.9, -4.3] as [number, number],
  /** conmutador */
  zColector: [-4.95, -6.15] as [number, number],
  rColector: 0.85,
  zEscobilla: -5.55,
  /** acople y cinta del tacómetro */
  zAcople: [-6.8, -8.6] as [number, number],
  rAcople: 1.1,
  zCinta: -7.15,
  /** freno */
  zFreno: [-9.2, -13.2] as [number, number],
  rFreno: 3.0,
  /** placa base (cara superior) */
  yBase: -4.6,
};

/** Cobre por espira en la ranura: alambre de 0,46 mm (R = 0,02 Ω por espira de 19 cm) con factor de relleno 0,6. */
export const AREA_ESPIRA_CM2 = (Math.PI / 4) * 0.046 * 0.046 / 0.6;

// ───────────────────────────── utilidades ─────────────────────────────

/** Normales suaves en lo curvo y aristas vivas en lo recto. */
export function suavizar(g: THREE.BufferGeometry, angulo = 35 * GRAD): THREE.BufferGeometry {
  const s = toCreasedNormals(g.index ? g.toNonIndexed() : g, angulo);
  if (s !== g) g.dispose();
  // los triángulos degenerados (área nula, p. ej. en el eje de un torno) dejan normal (0,0,0)
  return sanearNormales(s);
}

/**
 * Prisma de sector anular (r0–r1, a0–a1, z0–z1) con grupos de material:
 *  0 = superficie exterior (r1); 1 = caras de corte (rayadas); 2 = superficie interior (r0) y
 *  caras «de pieza» (no cortadas).
 */
export function sectorAnular(o: {
  r0: number; r1: number; a0: number; a1: number; z0: number; z1: number; segs?: number;
  corte?: { frente?: boolean; fondo?: boolean; lados?: boolean | [boolean, boolean] };
  caras?: { frente?: boolean; fondo?: boolean; lados?: boolean; interior?: boolean };
}): THREE.BufferGeometry {
  const { r0, r1, a0, a1, z0, z1 } = o;
  const completo = Math.abs(a1 - a0 - Math.PI * 2) < 1e-9;
  const n = o.segs ?? Math.max(6, Math.ceil(((a1 - a0) / (Math.PI * 2)) * 128));
  const corte = { frente: true, fondo: false, lados: true, ...o.corte };
  const caras = { frente: true, fondo: true, lados: !completo, interior: r0 > 1e-6, ...o.caras };
  const pos: number[] = [], nor: number[] = [], uv: number[] = [];
  const idx: Record<0 | 1 | 2, number[]> = { 0: [], 1: [], 2: [] };
  const v = (x: number, y: number, z: number, nx: number, ny: number, nz: number, u = 0, w = 0) => {
    pos.push(x, y, z); nor.push(nx, ny, nz); uv.push(u, w); return pos.length / 3 - 1;
  };
  // cilindros
  const cil = (r: number, fuera: boolean, grupo: 0 | 2) => {
    const base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n, c = Math.cos(a), s = Math.sin(a), sg = fuera ? 1 : -1;
      v(r * c, r * s, z0, sg * c, sg * s, 0, i / n, 0);
      v(r * c, r * s, z1, sg * c, sg * s, 0, i / n, 1);
    }
    for (let i = 0; i < n; i++) {
      const a = base + i * 2, b = a + 2;
      if (fuera) idx[grupo].push(a, b, a + 1, b, b + 1, a + 1); else idx[grupo].push(a, a + 1, b, b, a + 1, b + 1);
    }
  };
  cil(r1, true, 0);
  if (caras.interior) cil(r0, false, 2);
  // tapas z
  const tapa = (z: number, nz: 1 | -1, grupo: 0 | 1 | 2) => {
    const base = pos.length / 3;
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n, c = Math.cos(a), s = Math.sin(a);
      v(r0 * c, r0 * s, z, 0, 0, nz); v(r1 * c, r1 * s, z, 0, 0, nz);
    }
    for (let i = 0; i < n; i++) {
      const a = base + i * 2, b = a + 2;
      if (nz > 0) idx[grupo].push(a, a + 1, b, b, a + 1, b + 1); else idx[grupo].push(a, b, a + 1, b, b + 1, a + 1);
    }
  };
  if (caras.frente) tapa(z1, 1, corte.frente ? 1 : 2);
  if (caras.fondo) tapa(z0, -1, corte.fondo ? 1 : 2);
  // lados (planos radiales)
  if (caras.lados && !completo) {
    const cl = corte.lados;
    for (const [a, sg, k] of [[a0, -1, 0], [a1, 1, 1]] as const) {
      const c = Math.cos(a), s = Math.sin(a);
      const nx = -s * sg, ny = c * sg;
      const b = pos.length / 3;
      v(r0 * c, r0 * s, z0, nx, ny, 0); v(r1 * c, r1 * s, z0, nx, ny, 0);
      v(r1 * c, r1 * s, z1, nx, ny, 0); v(r0 * c, r0 * s, z1, nx, ny, 0);
      const g = (Array.isArray(cl) ? cl[k] : cl) ? 1 : 2;
      if (sg > 0) idx[g].push(b, b + 2, b + 1, b, b + 3, b + 2); else idx[g].push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const todo = [...idx[0], ...idx[1], ...idx[2]];
  g.setIndex(todo);
  g.addGroup(0, idx[0].length, 0);
  g.addGroup(idx[0].length, idx[1].length, 1);
  g.addGroup(idx[0].length + idx[1].length, idx[2].length, 2);
  g.computeBoundingSphere();
  return g;
}

// ───────────────────────────── chapa del inducido ─────────────────────────────

/** Punto de una ranura en el marco de la ranura: u radial, v tangencial. */
const enRanura = (beta: number, u: number, w: number) =>
  new THREE.Vector2(u * Math.cos(beta) - w * Math.sin(beta), u * Math.sin(beta) + w * Math.cos(beta));

/** Contorno de una ranura (sin la boca), en el marco del rotor, a ángulo `beta`. */
export function contornoRanura(beta: number, holgura = 0, nArco = 14): THREE.Vector2[] {
  const { rBoca, mBoca, rHombro, mCuerpo, rFondo } = COTA.ranura;
  const m = mCuerpo - holgura, mb = Math.max(0.02, mBoca - holgura);
  const p: THREE.Vector2[] = [];
  p.push(enRanura(beta, rBoca - holgura, -mb), enRanura(beta, rHombro - holgura, -m), enRanura(beta, rFondo, -m));
  for (let i = 1; i < nArco; i++) {
    const a = -Math.PI / 2 - (i / nArco) * Math.PI;
    p.push(enRanura(beta, rFondo + m * Math.cos(a), m * Math.sin(a)));
  }
  p.push(enRanura(beta, rFondo, m), enRanura(beta, rHombro - holgura, m), enRanura(beta, rBoca - holgura, mb));
  return p;
}

/** Chapa del inducido: círculo con cuatro ranuras abiertas al entrehierro y el agujero del eje. */
export function formaInducido(): THREE.Shape {
  const { Rr } = COTA;
  const { mBoca, rBoca } = COTA.ranura;
  const d0 = Math.asin(mBoca / Rr);
  const s = new THREE.Shape();
  const nArco = 40;
  for (let k = 0; k < 4; k++) {
    const b = (k * Math.PI) / 2, bSig = ((k + 1) * Math.PI) / 2;
    // arco del diente entre la ranura k y la k+1
    for (let i = 0; i <= nArco; i++) {
      const a = b + d0 + ((bSig - b - 2 * d0) * i) / nArco;
      const x = Rr * Math.cos(a), y = Rr * Math.sin(a);
      if (k === 0 && i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    // ranura k+1: baja por su lado −v y sube por el +v
    const c = contornoRanura(bSig);
    c.unshift(enRanura(bSig, Math.sqrt(Rr * Rr - mBoca * mBoca), -mBoca));
    c.push(enRanura(bSig, Math.sqrt(Rr * Rr - mBoca * mBoca), mBoca));
    void rBoca;
    for (const q of c) s.lineTo(q.x, q.y);
  }
  s.closePath();
  const eje = new THREE.Path();
  eje.absarc(0, 0, COTA.rEje, 0, Math.PI * 2, true);
  s.holes.push(eje);
  return s;
}

/** Área de un polígono (cm²). */
function area(p: THREE.Vector2[]) {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a.x * b.y - b.x * a.y; }
  return Math.abs(s) / 2;
}

/**
 * Sección del haz de cobre de un lado de bobina con N espiras: rellena la ranura desde el
 * fondo hasta cubrir N·(área por espira). Devuelve el polígono en el marco de la ranura β.
 */
export function haz(beta: number, N: number): THREE.Vector2[] {
  const objetivo = N * AREA_ESPIRA_CM2;
  const { rFondo, rHombro, mCuerpo } = COTA.ranura;
  const forro = 0.025;
  const m = mCuerpo - forro;
  const poligono = (uTop: number) => {
    const p: THREE.Vector2[] = [];
    const nA = 18;
    // fondo semicircular (centro rFondo, radio m), recortado a u ≤ uTop
    for (let i = 0; i <= nA; i++) {
      const a = -Math.PI / 2 - (i / nA) * Math.PI;
      const u = rFondo + m * Math.cos(a), w = m * Math.sin(a);
      if (u <= uTop) p.push(new THREE.Vector2(u, w));
    }
    if (uTop > rFondo) { p.push(new THREE.Vector2(Math.min(uTop, rHombro - 0.04), m)); p.push(new THREE.Vector2(Math.min(uTop, rHombro - 0.04), -m)); }
    else {
      const w = Math.sqrt(Math.max(0, m * m - (uTop - rFondo) ** 2));
      p.push(new THREE.Vector2(uTop, w), new THREE.Vector2(uTop, -w));
    }
    return p;
  };
  let lo = rFondo - m + 1e-4, hi = rHombro - 0.04;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (area(poligono(mid)) < objetivo) lo = mid; else hi = mid; }
  return poligono(hi).map((q) => enRanura(beta, q.x, q.y));
}

/** Centro de masas aproximado del haz (para flechas y símbolos). */
export function centroHaz(beta: number, N: number): THREE.Vector2 {
  const p = haz(beta, N);
  const c = new THREE.Vector2();
  for (const q of p) c.add(q);
  return c.multiplyScalar(1 / p.length);
}

/** Polígono → ShapeGeometry plana (normal +z) en z. */
export function plano(p: THREE.Vector2[], z = 0, agujeros: THREE.Vector2[][] = []): THREE.BufferGeometry {
  const s = new THREE.Shape(p);
  for (const h of agujeros) s.holes.push(new THREE.Path(h));
  const g = new THREE.ShapeGeometry(s, 24);
  g.translate(0, 0, z);
  return g;
}

/** Extrusión de una forma entre z0 y z1 con normales suaves en lo curvo. */
export function extruirZ(forma: THREE.Shape, z0: number, z1: number, curva = 48): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(forma, { depth: z1 - z0, bevelEnabled: false, curveSegments: curva });
  g.translate(0, 0, z0);
  return suavizar(g);
}

// ───────────────────────────── cabezas de bobina ─────────────────────────────

/** Radio del haz (cm) de un lado de bobina con N espiras (tubo equivalente). */
export const radioHaz = (N: number) => Math.sqrt((N * AREA_ESPIRA_CM2) / Math.PI);

const P3 = (r: number, a: number, z: number) => new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z);

/**
 * Recorrido de la cabeza de bobina trasera de cada bobina (marco del rotor). La A (ranuras
 * 0° y 180°) pasa por 90° metiéndose hacia el eje; la B (90° y 270°) pasa por 180° más atrás.
 * Así no se tocan con ningún N (los haces de 100 espiras miden 6 mm).
 */
export function recorridoCabeza(bobina: 0 | 1, N: number): THREE.CatmullRomCurve3 {
  const rc = centroHaz(0, N).length();
  const z0 = COTA.zPaquete;
  const pts: THREE.Vector3[] = [];
  if (bobina === 0) {
    const zA = z0 - 0.38, rMin = Math.max(COTA.rEje + radioHaz(N) + 0.08, 0.86);
    pts.push(P3(rc, 0, z0 + 0.3), P3(rc, 0, z0 - 0.12));
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI;
      const r = rc - (rc - rMin) * Math.sin(a);
      pts.push(P3(r, a, zA - 0.06 * Math.sin(a)));
    }
    pts.push(P3(rc, Math.PI, z0 - 0.12), P3(rc, Math.PI, z0 + 0.3));
  } else {
    const zB = z0 - 0.98;
    pts.push(P3(rc, Math.PI / 2, z0 + 0.3), P3(rc, Math.PI / 2, z0 - 0.3), P3(rc, Math.PI / 2 + 0.12, zB + 0.28));
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI / 2 + 0.2 + (i / 8) * (Math.PI - 0.4);
      pts.push(P3(rc + 0.12 * Math.sin(((a - Math.PI / 2) / Math.PI) * Math.PI), a, zB));
    }
    pts.push(P3(rc, (3 * Math.PI) / 2 - 0.12, zB + 0.28), P3(rc, (3 * Math.PI) / 2, z0 - 0.3), P3(rc, (3 * Math.PI) / 2, z0 + 0.3));
  }
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}

/** Lado de bobina dentro de la ranura (prisma recto del haz entre el paquete y el corte). */
export function ladoBobina(beta: number, N: number): THREE.BufferGeometry {
  const s = new THREE.Shape(haz(beta, N));
  return extruirZ(s, COTA.zPaquete - 0.05, -0.002, 12);
}

/**
 * Hilo de salida de una bobina a su delga: sale del haz junto a la ranura, cruza el escudo
 * por una de sus ventanas y llega al talón (riser) de la delga en el frente del colector.
 */
export function recorridoSalida(aRanura: number, aDelga: number, N: number): THREE.CatmullRomCurve3 {
  const rc = centroHaz(0, N).length();
  const z0 = COTA.zPaquete;
  const zr = COTA.zColector[0] + 0.12;
  const pts = [
    P3(rc + 0.05, aRanura, z0 - 0.25),
    P3(1.32, aRanura + (aDelga - aRanura) * 0.25, z0 - 1.1),
    P3(1.25, aRanura + (aDelga - aRanura) * 0.7, (COTA.zEscudo[0] + COTA.zEscudo[1]) / 2),
    P3(1.12, aDelga, zr + 0.25),
    P3(1.02, aDelga, zr),
  ];
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}

/** Tubo a lo largo de una curva (u = arco normalizado, para los trazos de corriente). */
export function tubo(curva: THREE.Curve<THREE.Vector3>, radio: number, segs = 96, radiales = 12): THREE.BufferGeometry {
  return new THREE.TubeGeometry(curva, segs, radio, radiales, false);
}

// ───────────────────────────── piezas de banco ─────────────────────────────

/** Silla de apoyo del motor: bloque con la cuna del yugo (radio rCuna, centrada en el eje), extruido en z. */
export function formaSilla(ancho: number, yBase: number, rCuna: number): THREE.Shape {
  const s = new THREE.Shape();
  const m = ancho / 2;
  const yBorde = -Math.sqrt(Math.max(0, rCuna * rCuna - m * m));
  s.moveTo(-m, yBase);
  s.lineTo(m, yBase);
  s.lineTo(m, yBorde);
  const a0 = Math.atan2(yBorde, m), a1 = -Math.PI - a0;
  for (let i = 1; i < 32; i++) {
    const t = a0 + ((a1 - a0) * i) / 32;
    s.lineTo(rCuna * Math.cos(t), rCuna * Math.sin(t));
  }
  s.lineTo(-m, yBorde);
  s.closePath();
  return s;
}

/** Perfil del freno de partículas (torno): cuerpo con aletas y tapas redondeadas. */
export function perfilFreno(): THREE.Vector2[] {
  const [zf, zb] = COTA.zFreno;
  const L = zf - zb, R = COTA.rFreno;
  const p: [number, number][] = [[0.42, 0], [1.3, 0], [1.35, 0.06], [R - 0.25, 0.06], [R - 0.05, 0.22], [R, 0.45]];
  // cinco aletas suaves
  const nA = 5, z0 = 0.9, z1 = L - 0.9;
  p.push([R, z0 - 0.15]);
  for (let i = 0; i < nA; i++) {
    const c = z0 + ((z1 - z0) * (i + 0.5)) / nA;
    p.push([R, c - 0.22], [R + 0.18, c - 0.12], [R + 0.18, c + 0.12], [R, c + 0.22]);
  }
  p.push([R, L - 0.45], [R - 0.05, L - 0.22], [R - 0.3, L - 0.06], [0.9, L - 0.06], [0.85, L], [0.0001, L]);
  return p.map(([r, z]) => new THREE.Vector2(r, z));
}
