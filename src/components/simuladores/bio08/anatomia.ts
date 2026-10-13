/**
 * bio08/anatomia.ts — EL CORAZÓN como geometría (sin three).
 *
 * El corazón es un SÓLIDO definido por una función de distancia con signo (SDF):
 * ventrículos (elipsoides ahusados hacia el ápex), aurículas con sus orejuelas,
 * tractos de salida, anillos valvulares y grandes vasos (tubos por polilínea), con
 * uniones suaves. Del mismo campo, muestreado UNA vez en una rejilla, salen:
 *   · la malla visual (superficie cero, «surface nets»), entera o con el CORTE de
 *     cuatro cámaras (la cara de sección es plana porque es la del plano);
 *   · las mallas cerradas del miocardio auricular y del ventricular, que usa el
 *     modelo eléctrico para la doble capa (electro.ts);
 *   · la máscara de tejido excitable sobre la que se propaga la activación.
 *
 * Unidades: 1 u = 1 dm (como el kit). Ejes del PACIENTE: +x = izquierda del
 * paciente (derecha de la pantalla en vista anterior), +y = craneal, +z = anterior.
 * El eje largo apunta del centro de la base al ápex: abajo, a la izquierda y
 * adelante; medidas de un adulto (≈ 12 cm de la base al ápex, pared del VI ≈ 1 cm).
 */

export type V3 = [number, number, number];

// ───────────────────────────── utilidades ─────────────────────────────

export function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const norm = (v: V3): V3 => { const l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
export const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const punto = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const suma = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
export const dist = (a: V3, b: V3) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

/** Unión suave polinómica (k = radio de la transición). */
function smin(a: number, b: number, k: number) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

// ───────────────────────────── marco cardiaco ─────────────────────────────

/**
 * Hitos anatómicos en ejes del PACIENTE (u), como en la vista anterior de un adulto:
 * el VD forma casi toda la cara anterior, el VI el borde izquierdo y el ápex, la AD
 * el borde derecho; la válvula pulmonar queda delante, arriba y a la izquierda de la
 * aórtica; la AI es la cámara más posterior.
 */
export const REF = {
  apex: [0.44, -0.74, 0.22] as V3,
  mitral: [0.08, 0.16, -0.2] as V3,
  tricuspide: [-0.26, 0.05, 0.02] as V3,
  aortica: [-0.06, 0.22, -0.05] as V3,
  pulmonar: [0.05, 0.4, 0.19] as V3,
  centroVI: [0.15, -0.17, -0.03] as V3,
  centroVD: [-0.08, -0.16, 0.19] as V3,
  centroAI: [0.0, 0.3, -0.36] as V3,
  centroAD: [-0.42, 0.17, -0.08] as V3,
};
/** Centro de la base = punto medio de los anillos mitral y tricuspídeo. */
const BASE: V3 = [(REF.mitral[0] + REF.tricuspide[0]) / 2, (REF.mitral[1] + REF.tricuspide[1]) / 2, (REF.mitral[2] + REF.tricuspide[2]) / 2];
/** Dirección del eje largo (base → ápex). */
export const EJE_APEX: V3 = norm([REF.apex[0] - BASE[0], REF.apex[1] - BASE[1], REF.apex[2] - BASE[2]]);
/**
 * Marco cardiaco: ey = hacia la base (−eje largo), ez = lo más anterior posible,
 * ex = ey × ez. Origen `o` = centro de la base.
 */
export const MARCO = (() => {
  const ey = norm([-EJE_APEX[0], -EJE_APEX[1], -EJE_APEX[2]]);
  const ant: V3 = [0, 0, 1];
  const ez = norm(suma(ant, ey, -punto(ant, ey)));
  const ex = norm(cruz(ey, ez));
  return { o: BASE, ex, ey, ez };
})();

/** Coordenadas cardiacas locales → paciente. */
export function aPaciente(l: V3): V3 {
  const { o, ex, ey, ez } = MARCO;
  return [
    o[0] + l[0] * ex[0] + l[1] * ey[0] + l[2] * ez[0],
    o[1] + l[0] * ex[1] + l[1] * ey[1] + l[2] * ez[1],
    o[2] + l[0] * ex[2] + l[1] * ey[2] + l[2] * ez[2],
  ];
}
/** Paciente → coordenadas cardiacas locales. */
export function aLocal(p: V3): V3 {
  const { o, ex, ey, ez } = MARCO;
  const d: V3 = [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
  return [punto(d, ex), punto(d, ey), punto(d, ez)];
}

// ───────────────────────────── primitivas ─────────────────────────────

export type Campo = (x: number, y: number, z: number) => number;

/**
 * Elipsoide con centro en el paciente y semiejes en el marco cardiaco (ventrículos:
 * eje largo = y local) o en el del paciente (aurículas), con un giro opcional y un
 * ahusado hacia el ápex (−y local): el ancho cae como 1 − ahusado·u², u = −y/b.
 * Distancia aproximada de Íñigo Quílez (exacta en la superficie, buena cerca).
 */
export interface Elipsoide { c: V3; semi: V3; ahusado?: number; giro?: [number, number]; marco?: 'cardiaco' | 'paciente' }
function campoElipsoide(e: Elipsoide): Campo {
  const cardiaco = (e.marco ?? 'cardiaco') === 'cardiaco';
  const ex: V3 = cardiaco ? MARCO.ex : [1, 0, 0], ey: V3 = cardiaco ? MARCO.ey : [0, 1, 0], ez: V3 = cardiaco ? MARCO.ez : [0, 0, 1];
  const c = e.c;
  const [a, b, cc] = e.semi;
  const ahusado = e.ahusado ?? 0;
  const [ix, iz] = e.giro ?? [0, 0];
  const cxr = Math.cos(ix), sxr = Math.sin(ix), czr = Math.cos(iz), szr = Math.sin(iz);
  const ia2 = 1 / (a * a), ib2 = 1 / (b * b), ic2 = 1 / (cc * cc);
  const mn = Math.min(a, b, cc), mx = Math.max(a, b, cc);
  return (x, y, z) => {
    const dx = x - c[0], dy = y - c[1], dz = z - c[2];
    const d2 = dx * dx + dy * dy + dz * dz;
    if (d2 > (mx + 0.2) * (mx + 0.2)) return Math.sqrt(d2) - mx; // cota inferior lejos
    let lx = dx * ex[0] + dy * ex[1] + dz * ex[2];
    let ly = dx * ey[0] + dy * ey[1] + dz * ey[2];
    let lz = dx * ez[0] + dy * ez[1] + dz * ez[2];
    if (iz) { const t = lx * czr - ly * szr; ly = lx * szr + ly * czr; lx = t; }
    if (ix) { const t = ly * cxr - lz * sxr; lz = ly * sxr + lz * cxr; ly = t; }
    let k = 1;
    if (ahusado > 0 && ly < 0) { const u = Math.min(1, -ly / b); k = 1 - ahusado * u * u; lx /= k; lz /= k; }
    const qx = lx / a, qy = ly / b, qz = lz / cc;
    const k0 = Math.sqrt(qx * qx + qy * qy + qz * qz);
    if (k0 < 1e-9) return -mn * k;
    const k1 = Math.sqrt(qx * qx * ia2 + qy * qy * ib2 + qz * qz * ic2);
    return (k0 * (k0 - 1) / k1) * k;
  };
}

/** Tubo por una polilínea (paciente) con radio por punto. */
export interface Tubo { puntos: V3[]; radios: number[] }

/** Catmull-Rom centrípeta muestreada: suaviza las polilíneas de control. */
export function curva(ctrl: V3[], porTramo = 8): V3[] {
  if (ctrl.length < 3) return ctrl.slice();
  const P = [suma(ctrl[0], suma(ctrl[0], ctrl[1], -1)), ...ctrl, suma(ctrl[ctrl.length - 1], suma(ctrl[ctrl.length - 1], ctrl[ctrl.length - 2], -1))];
  const out: V3[] = [];
  for (let i = 1; i < P.length - 2; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const t0 = 0, t1 = t0 + Math.sqrt(dist(p0, p1)) + 1e-6, t2 = t1 + Math.sqrt(dist(p1, p2)) + 1e-6, t3 = t2 + Math.sqrt(dist(p2, p3)) + 1e-6;
    for (let k = 0; k < porTramo; k++) {
      const t = t1 + ((t2 - t1) * k) / porTramo;
      const L = (a: V3, b: V3, ta: number, tb: number): V3 => {
        const u = (t - ta) / (tb - ta);
        return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
      };
      const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
      out.push(L(B1, B2, t1, t2));
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}
export const tuboSuave = (ctrl: V3[], r: number[] | number, porTramo = 4): Tubo => {
  const puntos = curva(ctrl, porTramo);
  const rr = Array.isArray(r) ? r : [r, r];
  const L = [0]; for (let i = 1; i < puntos.length; i++) L.push(L[i - 1] + dist(puntos[i - 1], puntos[i]));
  const tot = L[L.length - 1] || 1;
  const radios = L.map((l) => {
    const u = (l / tot) * (rr.length - 1), i = Math.min(rr.length - 2, Math.floor(u));
    return rr[i] + (rr[i + 1] - rr[i]) * (u - i);
  });
  return { puntos, radios };
};

/**
 * Índice espacial de los segmentos de TODOS los tubos: celdas de `G` u con la lista
 * de segmentos cuyo cilindro (más un margen) toca la celda. Una consulta sólo mide
 * los segmentos de su celda; fuera de ellos la distancia es ≥ MARGEN.
 */
const G = 0.1, MARGEN = 0.14;
class IndiceTubos {
  n: number; seg: Float64Array; tuboDe: Int32Array; celdas: Map<number, Int32Array>; dist: Float64Array;
  constructor(tubos: Tubo[]) {
    this.n = tubos.length;
    const s: number[] = [], tid: number[] = [];
    tubos.forEach((t, k) => {
      for (let i = 0; i < t.puntos.length - 1; i++) {
        const p = t.puntos[i], q = t.puntos[i + 1];
        s.push(p[0], p[1], p[2], q[0] - p[0], q[1] - p[1], q[2] - p[2], t.radios[i], t.radios[i + 1]);
        tid.push(k);
      }
    });
    this.seg = new Float64Array(s); this.tuboDe = new Int32Array(tid);
    const listas = new Map<number, number[]>();
    const ns = tid.length;
    for (let i = 0; i < ns; i++) {
      const o = i * 8;
      const ax = this.seg[o], ay = this.seg[o + 1], az = this.seg[o + 2], bx = ax + this.seg[o + 3], by = ay + this.seg[o + 4], bz = az + this.seg[o + 5];
      const r = Math.max(this.seg[o + 6], this.seg[o + 7]) + MARGEN + G * 0.87;
      for (let cx = Math.floor((Math.min(ax, bx) - r) / G); cx <= Math.floor((Math.max(ax, bx) + r) / G); cx++)
        for (let cy = Math.floor((Math.min(ay, by) - r) / G); cy <= Math.floor((Math.max(ay, by) + r) / G); cy++)
          for (let cz = Math.floor((Math.min(az, bz) - r) / G); cz <= Math.floor((Math.max(az, bz) + r) / G); cz++) {
            const mx = (cx + 0.5) * G, my = (cy + 0.5) * G, mz = (cz + 0.5) * G;
            if (distSeg(mx, my, mz, this.seg, o) > r) continue;
            const key = clave(cx, cy, cz);
            let l = listas.get(key); if (!l) { l = []; listas.set(key, l); }
            l.push(i);
          }
    }
    this.celdas = new Map([...listas].map(([k, v]) => [k, Int32Array.from(v)]));
    this.dist = new Float64Array(this.n);
  }
  /** Rellena `dist[k]` = distancia con signo al tubo k (≥ MARGEN si está lejos). */
  medir(x: number, y: number, z: number): Float64Array {
    const d = this.dist; d.fill(MARGEN);
    const l = this.celdas.get(clave(Math.floor(x / G), Math.floor(y / G), Math.floor(z / G)));
    if (!l) return d;
    const s = this.seg;
    for (let n = 0; n < l.length; n++) {
      const i = l[n], o = i * 8;
      const wx = x - s[o], wy = y - s[o + 1], wz = z - s[o + 2];
      const dx = s[o + 3], dy = s[o + 4], dz = s[o + 5];
      const l2 = dx * dx + dy * dy + dz * dz || 1e-12;
      let h = (wx * dx + wy * dy + wz * dz) / l2;
      h = h < 0 ? 0 : h > 1 ? 1 : h;
      const ex = wx - dx * h, ey = wy - dy * h, ez = wz - dz * h;
      const v = Math.sqrt(ex * ex + ey * ey + ez * ez) - (s[o + 6] + (s[o + 7] - s[o + 6]) * h);
      const k = this.tuboDe[i];
      if (v < d[k]) d[k] = v;
    }
    return d;
  }
}
const clave = (x: number, y: number, z: number) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
function distSeg(x: number, y: number, z: number, s: Float64Array, o: number) {
  const wx = x - s[o], wy = y - s[o + 1], wz = z - s[o + 2];
  const dx = s[o + 3], dy = s[o + 4], dz = s[o + 5];
  const l2 = dx * dx + dy * dy + dz * dz || 1e-12;
  let h = (wx * dx + wy * dy + wz * dz) / l2;
  h = h < 0 ? 0 : h > 1 ? 1 : h;
  return Math.sqrt((wx - dx * h) ** 2 + (wy - dy * h) ** 2 + (wz - dz * h) ** 2);
}

/** Orificio valvular: cilindro corto a lo largo del eje de la base. */
function campoOrificio(c: V3, r: number, alto: number): Campo {
  // centro en el paciente; eje = normal de la base
  const e = MARCO.ey;
  return (x, y, z) => {
    const dx = x - c[0], dy = y - c[1], dz = z - c[2];
    const h = dx * e[0] + dy * e[1] + dz * e[2];
    const rx = dx - e[0] * h, ry = dy - e[1] * h, rz = dz - e[2] * h;
    const dr = Math.sqrt(rx * rx + ry * ry + rz * rz) - r;
    const dh = Math.abs(h) - alto / 2;
    const ox = Math.max(dr, 0), oh = Math.max(dh, 0);
    return Math.min(Math.max(dr, dh), 0) + Math.sqrt(ox * ox + oh * oh);
  };
}

// ───────────────────────────── anatomía ─────────────────────────────

// Grosores (u): VI ≈ 1,1 cm, VD ≈ 0,45 cm, aurículas ≈ 0,35 cm (real 0,2–0,3). La pared de los vasos
// se dibuja de 0,4 cm (la real mide ≈ 0,2 cm) para que la rejilla la resuelva.
export const GROSOR = { vd: 0.045, auricula: 0.035, vaso: 0.04 };

export const FORMAS = {
  viExt: { c: REF.centroVI, semi: [0.36, 0.62, 0.35], ahusado: 0.4 } as Elipsoide,
  viCav: { c: suma(REF.centroVI, MARCO.ey, 0.07), semi: [0.24, 0.55, 0.23], ahusado: 0.45 } as Elipsoide,
  vdExt: { c: REF.centroVD, semi: [0.34, 0.52, 0.27], ahusado: 0.3, giro: [0.12, 0] } as Elipsoide,
  vdInt: { c: REF.centroVD, semi: [0.34 - GROSOR.vd, 0.52 - GROSOR.vd, 0.27 - GROSOR.vd], ahusado: 0.3, giro: [0.12, 0] } as Elipsoide,
  ai: { c: REF.centroAI, semi: [0.26, 0.18, 0.18], marco: 'paciente', giro: [0, 0.15] } as Elipsoide,
  oi: { c: [0.3, 0.3, -0.02], semi: [0.14, 0.06, 0.09], marco: 'paciente', giro: [-0.5, -0.5] } as Elipsoide,
  ad: { c: REF.centroAD, semi: [0.2, 0.26, 0.22], marco: 'paciente', giro: [0, -0.2] } as Elipsoide,
  od: { c: [-0.24, 0.33, 0.13], semi: [0.15, 0.08, 0.1], marco: 'paciente', giro: [-0.3, 0.55] } as Elipsoide,
};
const LV_EXT = campoElipsoide(FORMAS.viExt), LV_CAV = campoElipsoide(FORMAS.viCav);
const RV_EXT = campoElipsoide(FORMAS.vdExt), RV_INT = campoElipsoide(FORMAS.vdInt);
const LA = campoElipsoide(FORMAS.ai), LAA = campoElipsoide(FORMAS.oi), RA = campoElipsoide(FORMAS.ad), RAA = campoElipsoide(FORMAS.od);

const AO = REF.aortica, PU = REF.pulmonar;
/** Tracto de salida del VD (infundíbulo) hasta la válvula pulmonar. */
const TSVD: Tubo = tuboSuave([[-0.1, -0.06, 0.3], [-0.06, 0.12, 0.32], [0.0, 0.28, 0.28], PU], [0.17, 0.155, 0.14, 0.13]);
/** Tracto de salida del VI hasta la válvula aórtica (sólo luz). */
const TSVI: Tubo = tuboSuave([[0.12, -0.1, -0.04], [0.02, 0.08, -0.04], AO], [0.12, 0.11, 0.1]);

// grandes vasos (ejes del paciente)
const BIF: V3 = [0.06, 0.66, -0.05];
export const VASOS = {
  aorta: tuboSuave([
    suma(AO, MARCO.ey, -0.06), AO, [-0.12, 0.45, 0.02], [-0.14, 0.68, -0.02], [-0.06, 0.86, -0.16], [0.1, 0.9, -0.34],
    [0.24, 0.74, -0.56], [0.3, 0.4, -0.72], [0.3, -0.2, -0.74], [0.28, -0.95, -0.72],
  ], [0.135, 0.15, 0.145, 0.14, 0.135, 0.13, 0.125, 0.12, 0.115, 0.11]),
  tronco: tuboSuave([suma(PU, MARCO.ey, -0.06), PU, [0.09, 0.54, 0.12], BIF], [0.13, 0.13, 0.125, 0.12]),
  pulmonarIzq: tuboSuave([BIF, [0.22, 0.7, -0.14], [0.42, 0.66, -0.22], [0.62, 0.6, -0.26]], [0.1, 0.09, 0.085, 0.08]),
  pulmonarDer: tuboSuave([BIF, [-0.1, 0.62, -0.24], [-0.34, 0.6, -0.27], [-0.64, 0.56, -0.28]], [0.1, 0.095, 0.09, 0.085]),
  cavaSup: tuboSuave([[-0.43, 0.3, -0.08], [-0.45, 0.5, -0.11], [-0.45, 0.8, -0.13], [-0.45, 1.08, -0.14]], 0.1),
  cavaInf: tuboSuave([[-0.41, 0.06, -0.12], [-0.39, -0.22, -0.2], [-0.36, -0.6, -0.24]], 0.12),
  // venas pulmonares: dos por lado, entran por detrás en la AI
  vp1: tuboSuave([[0.12, 0.36, -0.42], [0.34, 0.42, -0.52], [0.52, 0.45, -0.58]], 0.06),
  vp2: tuboSuave([[0.12, 0.22, -0.44], [0.34, 0.17, -0.54], [0.52, 0.14, -0.6]], 0.06),
  vp3: tuboSuave([[-0.12, 0.36, -0.42], [-0.32, 0.42, -0.52], [-0.52, 0.45, -0.56]], 0.06),
  vp4: tuboSuave([[-0.12, 0.22, -0.44], [-0.32, 0.17, -0.54], [-0.5, 0.14, -0.58]], 0.06),
};
export type ClaveVaso = keyof typeof VASOS;
/** Ramas del cayado (tronco braquiocefálico, carótida y subclavia izquierdas). */
export const RAMAS_CAYADO: Tubo[] = [
  tuboSuave([[-0.06, 0.88, -0.16], [-0.12, 1.06, -0.12], [-0.2, 1.24, -0.1]], [0.062, 0.056, 0.052]),
  tuboSuave([[0.04, 0.92, -0.25], [0.04, 1.1, -0.22], [0.02, 1.26, -0.2]], [0.05, 0.046, 0.044]),
  tuboSuave([[0.14, 0.9, -0.36], [0.2, 1.06, -0.36], [0.28, 1.2, -0.36]], [0.054, 0.05, 0.047]),
];
/** Tipo de sangre de cada vaso: arterial (roja) o venosa (azul). */
export const SANGRE_VASO: Record<ClaveVaso, 'arterial' | 'venosa'> = {
  aorta: 'arterial', tronco: 'venosa', pulmonarIzq: 'venosa', pulmonarDer: 'venosa', cavaSup: 'venosa', cavaInf: 'venosa',
  vp1: 'arterial', vp2: 'arterial', vp3: 'arterial', vp4: 'arterial',
};

// índice: 0 = infundíbulo (ext), 1 = TSVI (luz), 2.. = vasos, luego ramas del cayado
const CLAVES_VASO = Object.keys(VASOS) as ClaveVaso[];
const TUBOS: Tubo[] = [TSVD, TSVI, ...CLAVES_VASO.map((k) => VASOS[k]), ...RAMAS_CAYADO];
const ES_ARTERIAL = TUBOS.map((_, i) => i >= 2 + CLAVES_VASO.length || (i >= 2 && SANGRE_VASO[CLAVES_VASO[i - 2]] === 'arterial'));
const INDICE = new IndiceTubos(TUBOS);
const ORIF_MITRAL = campoOrificio(REF.mitral, 0.12, 0.2);
const ORIF_TRICUSPIDE = campoOrificio(REF.tricuspide, 0.13, 0.2);

/** Ejes de los ventrículos: eje largo, normal del tabique (del VI al VD) y tangente. */
export const EJES = (() => {
  const ey = MARCO.ey;
  const dVD = suma(REF.centroVD, REF.centroVI, -1);
  const e1 = norm(suma(dVD, ey, -punto(dVD, ey)));   // hacia el VD (normal del tabique)
  const e2 = norm(cruz(ey, e1));                     // hacia la pared anterolateral
  return { ey, e1, e2 };
})();
/** Punto de la pared de la cavidad del VI a la altura h (sobre su centro) y ángulo φ (0 = tabique). */
export function paredCavidadVI(h: number, phi: number, f = 1): V3 {
  const { c, semi, ahusado = 0 } = FORMAS.viCav;
  const b = semi[1], u = Math.min(0.999, Math.abs(h) / b);
  const k = h < 0 ? 1 - ahusado * u * u : 1;
  const R = ((semi[0] + semi[2]) / 2) * Math.sqrt(1 - u * u) * k * f;
  const d = norm(suma(suma([0, 0, 0], EJES.e1, Math.cos(phi)), EJES.e2, Math.sin(phi)));
  return suma(suma(c, EJES.ey, h), d, R);
}
/**
 * Músculos papilares del VI (anterolateral y posteromedial): salen de la pared a
 * media altura y apuntan a la válvula mitral; de sus puntas nacen las cuerdas.
 * Se tallan en la cavidad, así que son miocardio (se activan con la eikonal).
 */
export const PAPILARES = [2.05, -1.95].map((phi) => {
  const base = paredCavidadVI(-0.24, phi, 1.08);
  const punta = paredCavidadVI(-0.06, phi, 0.5);
  const tubo: Tubo = { puntos: [base, suma(base, suma(punta, base, -1), 0.55), punta], radios: [0.055, 0.045, 0.03] };
  return { base, punta, tubo };
});
const INDICE_PAP = new IndiceTubos(PAPILARES.map((p) => p.tubo));

/** Canales del campo en un punto (se reutiliza el objeto para no crear basura). */
export interface Canales {
  /** sólido completo (paredes + vasos); < 0 dentro del tejido */
  solido: number;
  /** miocardio ventricular y auricular (cerrados, separados por el anillo fibroso) */
  vMio: number; aMio: number;
  /** superficie epicárdica ventricular y cavidades ventriculares (coordenada transmural) */
  vEpi: number; vEndo: number;
  /** vasos: distancia a la pared de los arteriales y de los venosos */
  arterial: number; venoso: number;
  /** altura sobre el plano de la base (u) */
  hBase: number;
}
export const nuevoCanales = (): Canales => ({ solido: 0, vMio: 0, aMio: 0, vEpi: 0, vEndo: 0, arterial: 0, venoso: 0, hBase: 0 });

/** Anillo fibroso: separa eléctricamente aurículas y ventrículos (u). */
export const ANILLO = 0.016;

export function campoCorazon(x: number, y: number, z: number, out: Canales): Canales {
  const { o, ey } = MARCO;
  const hb = (x - o[0]) * ey[0] + (y - o[1]) * ey[1] + (z - o[2]) * ey[2];
  const t = INDICE.medir(x, y, z);
  // ventrículos
  const lvE = LV_EXT(x, y, z), rvE = RV_EXT(x, y, z);
  const vE0 = smax(smin(lvE, rvE, 0.08), hb - 0.03, 0.08);
  const tsvd = t[0];
  const vE = smin(vE0, tsvd, 0.07);
  const tp = INDICE_PAP.medir(x, y, z);
  // los papilares se tallan en la cavidad: quedan unidos a la pared con un filete suave
  const lvC = smax(smin(LV_CAV(x, y, z), t[1], 0.06), -Math.min(tp[0], tp[1]), 0.04);
  const rvC = smin(Math.max(RV_INT(x, y, z), -lvE), tsvd + GROSOR.vd, 0.05);
  const vC = Math.min(lvC, rvC);
  // aurículas (pared delgada; el tabique interauricular queda entre las dos cavidades)
  const la = smin(LA(x, y, z), LAA(x, y, z), 0.06), ra = smin(RA(x, y, z), RAA(x, y, z), 0.06);
  const aE = smin(la, ra, 0.07);
  const aC = Math.min(la, ra) + GROSOR.auricula;
  // orificios AV
  const orAV = Math.min(ORIF_MITRAL(x, y, z), ORIF_TRICUSPIDE(x, y, z));
  // vasos (la luz es el tubo adelgazado por la pared)
  let arterial = MARGEN, venoso = MARGEN;
  for (let k = 2; k < t.length; k++) {
    if (ES_ARTERIAL[k]) { if (t[k] < arterial) arterial = t[k]; } else if (t[k] < venoso) venoso = t[k];
  }
  const vasoE = Math.min(arterial, venoso);
  const vasoL = vasoE + GROSOR.vaso;
  const exterior = smin(smin(vE, aE, 0.07), vasoE, 0.05);
  const cavidad = Math.min(vC, aC, orAV, vasoL);
  out.solido = Math.max(exterior, -cavidad);
  // miocardio eléctrico (sin vasos): ventricular bajo el anillo salvo el infundíbulo
  out.vMio = Math.max(vE, -Math.min(vC, orAV), Math.min(hb + ANILLO * 0.5, tsvd));
  out.aMio = Math.max(aE, -Math.min(aC, orAV, vasoL), ANILLO * 0.5 - hb);
  out.vEpi = vE; out.vEndo = vC;
  out.arterial = arterial; out.venoso = venoso;
  out.hBase = hb;
  return out;
}

/** Caja que contiene el corazón con sus vasos (paciente, u). */
export const CAJA: [V3, V3] = [[-0.98, -1.12, -1.02], [0.98, 1.22, 0.86]];

// ───────────────────────────── corte de cuatro cámaras ─────────────────────────────

/**
 * Plano del corte: contiene el eje largo y pasa entre las válvulas AV, como el
 * ecocardiograma apical de cuatro cámaras. Se quita la mitad anterior; por encima
 * de `techo` (u sobre la base) no se corta, para que el cayado siga entero.
 */
export const CORTE = (() => {
  const m = REF.mitral, t = REF.tricuspide;
  const dir = norm([t[0] - m[0], t[1] - m[1], t[2] - m[2]]);
  let n = norm(cruz(MARCO.ey, dir));
  if (n[2] < 0) n = [-n[0], -n[1], -n[2]];
  const p0: V3 = [(m[0] + t[0]) / 2 + n[0] * 0.04, (m[1] + t[1]) / 2 + n[1] * 0.04, (m[2] + t[2]) / 2 + n[2] * 0.04];
  return { n, p0, techo: 0.42 };
})();
/** Región que el corte quita (< 0 dentro): semiespacio anterior bajo el techo. */
export function quitadoPorCorte(x: number, y: number, z: number, hBase: number): number {
  const { n, p0, techo } = CORTE;
  const d = (x - p0[0]) * n[0] + (y - p0[1]) * n[1] + (z - p0[2]) * n[2];
  return Math.max(-d, hBase - techo);
}

// ───────────────────────────── rejilla de canales ─────────────────────────────

export interface Rejilla {
  mn: V3; h: number; nx: number; ny: number; nz: number;
  solido: Float32Array; vMio: Float32Array; aMio: Float32Array;
  vEpi: Float32Array; vEndo: Float32Array; arterial: Float32Array; venoso: Float32Array; hBase: Float32Array;
}

/**
 * Muestrea todos los canales en una rejilla de paso `h`. Banda estrecha: primero
 * una rejilla gruesa (paso 3h); los puntos finos lejos de toda superficie toman el
 * valor interpolado (sólo importa su signo) y los cercanos se evalúan exactos.
 */
export function muestrear(h: number, caja: [V3, V3] = CAJA): Rejilla {
  const [mn, mx] = caja;
  const nx = Math.ceil((mx[0] - mn[0]) / h) + 1, ny = Math.ceil((mx[1] - mn[1]) / h) + 1, nz = Math.ceil((mx[2] - mn[2]) / h) + 1;
  const N = nx * ny * nz;
  const sol = new Float32Array(N), vMio = new Float32Array(N), aMio = new Float32Array(N), vEpi = new Float32Array(N);
  const vEndo = new Float32Array(N), arterial = new Float32Array(N), venoso = new Float32Array(N), hBase = new Float32Array(N);
  const r: Rejilla = { mn, h, nx, ny, nz, solido: sol, vMio, aMio, vEpi, vEndo, arterial, venoso, hBase };
  const c = nuevoCanales();
  const K = 3, H = h * K;
  const gx = Math.ceil((nx - 1) / K) + 2, gy = Math.ceil((ny - 1) / K) + 2, gz = Math.ceil((nz - 1) / K) + 2;
  // rejilla gruesa: los canales cuyo signo importa lejos de las superficies
  const G0 = new Float32Array(gx * gy * gz), G1 = new Float32Array(gx * gy * gz), G2 = new Float32Array(gx * gy * gz);
  const G3 = new Float32Array(gx * gy * gz), G4 = new Float32Array(gx * gy * gz);
  const cercaG = new Uint8Array(gx * gy * gz);
  for (let k = 0; k < gz; k++) for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
    campoCorazon(mn[0] + i * H, mn[1] + j * H, mn[2] + k * H, c);
    const o = i + gx * (j + gy * k);
    G0[o] = c.solido; G1[o] = c.vMio; G2[o] = c.aMio; G3[o] = c.vEpi; G4[o] = c.vEndo;
  }
  // celda gruesa «cerca» si alguna esquina está a menos de una diagonal de una superficie
  const banda = H * 0.87 * 1.35;
  for (let k = 0; k < gz - 1; k++) for (let j = 0; j < gy - 1; j++) for (let i = 0; i < gx - 1; i++) {
    let cerca = 0;
    for (let e = 0; e < 8 && !cerca; e++) {
      const q = (i + (e & 1)) + gx * ((j + ((e >> 1) & 1)) + gy * (k + ((e >> 2) & 1)));
      if (Math.abs(G0[q]) < banda || Math.abs(G1[q]) < banda || Math.abs(G2[q]) < banda) cerca = 1;
    }
    cercaG[i + gx * (j + gy * k)] = cerca;
  }
  const { o: ob, ey } = MARCO;
  for (let k = 0; k < nz; k++) {
    const kg = Math.floor(k / K), fk = k / K - kg, z = mn[2] + k * h;
    for (let j = 0; j < ny; j++) {
      const jg = Math.floor(j / K), fj = j / K - jg, y = mn[1] + j * h;
      let o = nx * (j + ny * k);
      for (let i = 0; i < nx; i++, o++) {
        const ig = Math.floor(i / K), fi = i / K - ig, x = mn[0] + i * h;
        const g = ig + gx * (jg + gy * kg);
        if (cercaG[g]) {
          campoCorazon(x, y, z, c);
          sol[o] = c.solido; vMio[o] = c.vMio; aMio[o] = c.aMio; vEpi[o] = c.vEpi; vEndo[o] = c.vEndo;
          arterial[o] = c.arterial; venoso[o] = c.venoso; hBase[o] = c.hBase;
        } else {
          const g1 = g + 1, g2 = g + gx, g3 = g + gx + 1, g4 = g + gx * gy, g5 = g4 + 1, g6 = g4 + gx, g7 = g4 + gx + 1;
          const tri = (A: Float32Array) => {
            const a = A[g] + (A[g1] - A[g]) * fi, b = A[g2] + (A[g3] - A[g2]) * fi;
            const cc = A[g4] + (A[g5] - A[g4]) * fi, d = A[g6] + (A[g7] - A[g6]) * fi;
            const w0 = a + (b - a) * fj, w1 = cc + (d - cc) * fj;
            return w0 + (w1 - w0) * fk;
          };
          sol[o] = tri(G0); vMio[o] = tri(G1); aMio[o] = tri(G2);
          vEpi[o] = tri(G3); vEndo[o] = tri(G4); arterial[o] = 1; venoso[o] = 1;
          hBase[o] = (x - ob[0]) * ey[0] + (y - ob[1]) * ey[1] + (z - ob[2]) * ey[2];
        }
      }
    }
  }
  return r;
}

/** Interpolación trilineal de un canal de la rejilla en un punto. */
export function interpolar(r: Rejilla, canal: Float32Array, x: number, y: number, z: number): number {
  const fx = Math.min(r.nx - 1.0001, Math.max(0, (x - r.mn[0]) / r.h));
  const fy = Math.min(r.ny - 1.0001, Math.max(0, (y - r.mn[1]) / r.h));
  const fz = Math.min(r.nz - 1.0001, Math.max(0, (z - r.mn[2]) / r.h));
  const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz);
  const u = fx - i, v = fy - j, w = fz - k;
  const A = (a: number, b: number, c: number) => canal[(i + a) + r.nx * ((j + b) + r.ny * (k + c))];
  const x00 = A(0, 0, 0) + (A(1, 0, 0) - A(0, 0, 0)) * u, x10 = A(0, 1, 0) + (A(1, 1, 0) - A(0, 1, 0)) * u;
  const x01 = A(0, 0, 1) + (A(1, 0, 1) - A(0, 0, 1)) * u, x11 = A(0, 1, 1) + (A(1, 1, 1) - A(0, 1, 1)) * u;
  const y0 = x00 + (x10 - x00) * v, y1 = x01 + (x11 - x01) * v;
  return y0 + (y1 - y0) * w;
}

// ───────────────────────────── mallado: surface nets ─────────────────────────────

export interface Malla {
  pos: Float32Array;
  nor: Float32Array;
  idx: Uint32Array;
}

/**
 * Surface nets (Gibson 1998) sobre valores ya muestreados: un vértice por celda que
 * corta la superficie (promedio de los cruces de sus aristas) y un cuadrilátero por
 * arista de la rejilla con cambio de signo, orientado hacia fuera (valores > 0).
 * `suavizado` = pasadas de Taubin (λ/μ) que quitan la escalera sin encoger; las
 * normales salen de la malla (promedio por área) y nunca son nulas.
 */
export function mallarValores(val: Float32Array, r: Pick<Rejilla, 'mn' | 'h' | 'nx' | 'ny' | 'nz'>, suavizado = 2): Malla {
  const { mn, h, nx, ny, nz } = r;
  const cx = nx - 1, cy = ny - 1, cz = nz - 1;
  const celda = new Int32Array(cx * cy * cz).fill(-1);
  const pos: number[] = [];
  const P = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  const AR: [number, number][] = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const esq = new Float32Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) {
      const v = val[P(i + (c & 1), j + ((c >> 1) & 1), k + ((c >> 2) & 1))];
      esq[c] = v;
      if (v < 0) mask |= 1 << c;
    }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of AR) {
      const va = esq[a], vb = esq[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      const ax = a & 1, ay = (a >> 1) & 1, az = (a >> 2) & 1;
      sx += ax + ((b & 1) - ax) * t; sy += ay + (((b >> 1) & 1) - ay) * t; sz += az + (((b >> 2) & 1) - az) * t; n++;
    }
    celda[i + cx * (j + cy * k)] = pos.length / 3;
    pos.push(mn[0] + (i + sx / n) * h, mn[1] + (j + sy / n) * h, mn[2] + (k + sz / n) * h);
  }
  const idx: number[] = [];
  const C = (i: number, j: number, k: number) => celda[i + cx * (j + cy * k)];
  const quad = (a: number, b: number, c: number, d: number, dentroPrimero: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (dentroPrimero) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 1; i < cx; i++) {
    const v0 = val[P(i, j, k)] < 0;
    if ((val[P(i + 1, j, k)] < 0) !== v0) quad(C(i, j - 1, k - 1), C(i, j, k - 1), C(i, j, k), C(i, j - 1, k), v0);
    if ((val[P(i, j + 1, k)] < 0) !== v0) quad(C(i - 1, j, k - 1), C(i - 1, j, k), C(i, j, k), C(i, j, k - 1), v0);
    if ((val[P(i, j, k + 1)] < 0) !== v0) quad(C(i - 1, j - 1, k), C(i, j - 1, k), C(i, j, k), C(i - 1, j, k), v0);
  }
  const m: Malla = { pos: new Float32Array(pos), nor: new Float32Array(pos.length), idx: new Uint32Array(idx) };
  if (suavizado > 0) taubin(m, suavizado);
  normalesDeMalla(m);
  return m;
}

/** Vecinos por vértice (lista compacta). */
function vecindad(m: Malla): { ini: Int32Array; lst: Int32Array } {
  const nv = m.pos.length / 3;
  const cnt = new Int32Array(nv + 1);
  for (let t = 0; t < m.idx.length; t += 3) for (let e = 0; e < 3; e++) cnt[m.idx[t + e]] += 2;
  const ini = new Int32Array(nv + 1);
  for (let v = 0; v < nv; v++) ini[v + 1] = ini[v] + cnt[v];
  const lst = new Int32Array(ini[nv]);
  const fill = ini.slice(0, nv);
  for (let t = 0; t < m.idx.length; t += 3) {
    const a = m.idx[t], b = m.idx[t + 1], c = m.idx[t + 2];
    lst[fill[a]++] = b; lst[fill[a]++] = c;
    lst[fill[b]++] = a; lst[fill[b]++] = c;
    lst[fill[c]++] = a; lst[fill[c]++] = b;
  }
  return { ini, lst };
}

/** Suavizado de Taubin: λ = 0,5 y μ = −0,53 alternos (no encoge la forma). */
export function taubin(m: Malla, pasadas: number) {
  const { ini, lst } = vecindad(m);
  const nv = m.pos.length / 3;
  const tmp = new Float32Array(m.pos.length);
  for (let p = 0; p < pasadas * 2; p++) {
    const f = p % 2 === 0 ? 0.5 : -0.53;
    for (let v = 0; v < nv; v++) {
      const a = ini[v], b = ini[v + 1];
      if (b === a) { tmp[v * 3] = m.pos[v * 3]; tmp[v * 3 + 1] = m.pos[v * 3 + 1]; tmp[v * 3 + 2] = m.pos[v * 3 + 2]; continue; }
      let sx = 0, sy = 0, sz = 0;
      for (let q = a; q < b; q++) { const w = lst[q] * 3; sx += m.pos[w]; sy += m.pos[w + 1]; sz += m.pos[w + 2]; }
      const n = b - a;
      tmp[v * 3] = m.pos[v * 3] + f * (sx / n - m.pos[v * 3]);
      tmp[v * 3 + 1] = m.pos[v * 3 + 1] + f * (sy / n - m.pos[v * 3 + 1]);
      tmp[v * 3 + 2] = m.pos[v * 3 + 2] + f * (sz / n - m.pos[v * 3 + 2]);
    }
    m.pos.set(tmp);
  }
}

/** Normales por vértice = suma de normales de cara ponderadas por área; respaldo +y. */
export function normalesDeMalla(m: Malla) {
  const N = m.nor; N.fill(0);
  const p = m.pos;
  for (let t = 0; t < m.idx.length; t += 3) {
    const a = m.idx[t] * 3, b = m.idx[t + 1] * 3, c = m.idx[t + 2] * 3;
    const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const q of [a, b, c]) { N[q] += nx; N[q + 1] += ny; N[q + 2] += nz; }
  }
  for (let v = 0; v < N.length; v += 3) {
    const l = Math.sqrt(N[v] * N[v] + N[v + 1] * N[v + 1] + N[v + 2] * N[v + 2]);
    if (l > 1e-12) { N[v] /= l; N[v + 1] /= l; N[v + 2] /= l; } else { N[v] = 0; N[v + 1] = 1; N[v + 2] = 0; }
  }
}

/** Área total y suma de vectores de área (∮ n dA ≈ 0 si la malla es cerrada). */
export function areaYCierre(m: Malla): { area: number; cierre: V3 } {
  let area = 0; const c: V3 = [0, 0, 0];
  for (let t = 0; t < m.idx.length; t += 3) {
    const a = m.idx[t] * 3, b = m.idx[t + 1] * 3, d = m.idx[t + 2] * 3;
    const ux = m.pos[b] - m.pos[a], uy = m.pos[b + 1] - m.pos[a + 1], uz = m.pos[b + 2] - m.pos[a + 2];
    const vx = m.pos[d] - m.pos[a], vy = m.pos[d + 1] - m.pos[a + 1], vz = m.pos[d + 2] - m.pos[a + 2];
    const nx = (uy * vz - uz * vy) / 2, ny = (uz * vx - ux * vz) / 2, nz = (ux * vy - uy * vx) / 2;
    area += Math.sqrt(nx * nx + ny * ny + nz * nz);
    c[0] += nx; c[1] += ny; c[2] += nz;
  }
  return { area, cierre: c };
}

/** Proyecta un punto sobre la superficie cero de un campo (Newton, unos pasos). */
export function proyectar(f: Campo, p: V3, pasos = 6, e = 0.004): V3 {
  let [x, y, z] = p;
  for (let s = 0; s < pasos; s++) {
    const f0 = f(x, y, z);
    const gx = (f(x + e, y, z) - f(x - e, y, z)) / (2 * e), gy = (f(x, y + e, z) - f(x, y - e, z)) / (2 * e), gz = (f(x, y, z + e) - f(x, y, z - e)) / (2 * e);
    const g2 = gx * gx + gy * gy + gz * gz;
    if (g2 < 1e-12) break;
    x -= (f0 * gx) / g2; y -= (f0 * gy) / g2; z -= (f0 * gz) / g2;
    if (Math.abs(f0) < 1e-5) break;
  }
  return [x, y, z];
}
/** Normal (gradiente unitario) de un campo en un punto. */
export function normalCampo(f: Campo, p: V3, e = 0.004): V3 {
  const [x, y, z] = p;
  return norm([f(x + e, y, z) - f(x - e, y, z), f(x, y + e, z) - f(x, y - e, z), f(x, y, z + e) - f(x, y, z - e)]);
}
/** Un canal del campo como función (para proyectar el sistema de conducción). */
export function campoCanal(clave: keyof Canales): Campo {
  const c = nuevoCanales();
  return (x, y, z) => campoCorazon(x, y, z, c)[clave];
}
