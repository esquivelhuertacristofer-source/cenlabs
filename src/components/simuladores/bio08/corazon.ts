/**
 * bio08/corazon.ts — todo lo que la escena necesita del corazón, calculado UNA vez
 * (sin three; corre en un Web Worker y en jest).
 *
 * De la rejilla del campo (anatomia.ts) y del modelo eléctrico (electro.ts) salen:
 *  · mallas visual y de corte con, por vértice: color del tejido, τ y ρ brutos,
 *    proceso (aurícula/ventrículo), excitabilidad, vector de contracción y marca
 *    de cara de sección;
 *  · el sistema de conducción (polilíneas con su tiempo);
 *  · las válvulas (valvas cerradas y abiertas para el morph) y sus cuerdas;
 *  · el torso de vidrio y los electrodos del triángulo de Einthoven.
 *
 * MECÁNICA (esquemática, declarada): cada punto del miocardio se contrae con su
 * propio retardo electromecánico tras SU activación y se relaja tras SU
 * repolarización: c(t) = S↑(t − τ − RE) · (1 − S↓(t − ρ − 10)). El desplazamiento
 * con c = 1 es radial hacia el eje largo (más en el endocardio: la pared se
 * engrosa) más el descenso de la base hacia el ápex (≈ 1 cm); las aurículas se
 * contraen hacia su centro.
 */
import {
  type V3, type Rejilla, type Malla, muestrear, mallarValores, quitadoPorCorte, interpolar, CORTE, MARCO, REF, EJES,
  FORMAS, PAPILARES, VASOS, suma, norm, punto, cruz, dist,
} from './anatomia';
import {
  type Rama, type FuenteDipolo, type Mapeo, construirModeloElectrico, TEJIDO, ELECTRODO,
} from './electro';

export type CalidadCorazon = 'alta' | 'media';
/** Paso de la rejilla (u): 2 mm en alta, 2,6 mm en media. */
export const PASO_REJILLA: Record<CalidadCorazon, number> = { alta: 0.02, media: 0.026 };

export interface MallaCorazon {
  pos: Float32Array; nor: Float32Array; idx: Uint32Array;
  /** color base del tejido (lineal) */
  color: Float32Array;
  /** τ y ρ brutos del proceso de cada vértice (ms; −1e4 si no aplica) */
  tau: Float32Array; rho: Float32Array;
  /** 0 = no excitable, 1 = aurícula, 2 = ventrículo (también da la mecánica) */
  proc: Float32Array;
  /** 0..1: brillo eléctrico (miocardio 1, vasos 0) */
  exc: Float32Array;
  /** desplazamiento con contracción completa del propio punto (vec3) */
  desp: Float32Array;
  /** arrastre del plano AV: desplazamiento de aurículas y raíces de los vasos con la sístole ventricular media (vec3) */
  arrastre: Float32Array;
  /** 1 en la cara de sección del corte */
  sec: Float32Array;
}

export interface MallaValvula {
  /** posiciones cerradas y abiertas (el morph va de una a otra) */
  cerrada: Float32Array; abierta: Float32Array; idx: Uint32Array;
  /** vértices del borde libre a los que se atan las cuerdas, y su anclaje */
  cuerdas: { v: number; ancla: V3 }[];
}

export interface Actividad { aMax: number; vMin: number; vMax: number; rMin: number; rMax: number; tLlegadaAV: number }

export interface DatosCorazon {
  calidad: CalidadCorazon;
  visual: MallaCorazon;
  corte: MallaCorazon;
  ramas: Rama[];
  sa: V3; nodoAV: V3;
  act: Actividad;
  fuente: FuenteDipolo;
  K: number;
  valvulas: { mitral: MallaValvula; tricuspide: MallaValvula; aortica: MallaValvula; pulmonar: MallaValvula };
  /** arterias y venas coronarias (tubos sobre el epicardio, con la mecánica del punto de pared más cercano) */
  coronarias: MallaCorazon;
  /** centro eléctrico (baricentro del miocardio ventricular): origen de la flecha del dipolo */
  centro: V3;
  torso: Malla;
  electrodos: Record<'RA' | 'LA' | 'LL', { piel: V3; vertice: V3; normal: V3 }>;
  /** caja del corazón visual (u) */
  caja: [V3, V3];
  /** valores típicos para la mecánica de las raíces de los vasos */
  tauMedioV: number; rhoMedioV: number;
  ms: Record<string, number>;
}

// ───────────────────────────── colores ─────────────────────────────

const lin = (hex: string): V3 => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((c) => Math.pow(c, 2.2)) as V3;
};
/** Paleta del tejido (sRGB): miocardio carmesí, aurículas más rosadas, arterias y venas. */
export const PALETA = {
  ventriculo: lin('#93303a'), auricula: lin('#b04a53'), arterial: lin('#c25a50'), venoso: lin('#4c5ea6'),
  seccionV: lin('#c26a6c'), seccionA: lin('#c97a7c'),
  coronaria: lin('#b3262d'), venaCoronaria: lin('#4a5a9e'),
};

// ───────────────────────────── muestreo por etiqueta ─────────────────────────────

/** Valor de un campo en p usando sólo nodos con la etiqueta dada (trilineal o el más cercano). */
function muestrearEtiqueta(r: Rejilla, f: Float32Array, tejido: Uint8Array, etiqueta: number, p: V3): number {
  const fx = (p[0] - r.mn[0]) / r.h, fy = (p[1] - r.mn[1]) / r.h, fz = (p[2] - r.mn[2]) / r.h;
  const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz);
  const u = fx - i, v = fy - j, w = fz - k;
  let s = 0, ws = 0;
  for (let c = 0; c < 8; c++) {
    const a = c & 1, b = (c >> 1) & 1, d = (c >> 2) & 1;
    const ii = i + a, jj = j + b, kk = k + d;
    if (ii < 0 || jj < 0 || kk < 0 || ii >= r.nx || jj >= r.ny || kk >= r.nz) continue;
    const o = ii + r.nx * (jj + r.ny * kk);
    if (tejido[o] !== etiqueta || Number.isNaN(f[o])) continue;
    const wt = (a ? u : 1 - u) * (b ? v : 1 - v) * (d ? w : 1 - w) + 1e-6;
    s += f[o] * wt; ws += wt;
  }
  if (ws > 0) return s / ws;
  // el más cercano en un radio de 3 nodos
  let best = NaN, dm = Infinity;
  for (let dk = -3; dk <= 3; dk++) for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) {
    const ii = Math.round(fx) + di, jj = Math.round(fy) + dj, kk = Math.round(fz) + dk;
    if (ii < 0 || jj < 0 || kk < 0 || ii >= r.nx || jj >= r.ny || kk >= r.nz) continue;
    const o = ii + r.nx * (jj + r.ny * kk);
    if (tejido[o] !== etiqueta || Number.isNaN(f[o])) continue;
    const d2 = di * di + dj * dj + dk * dk;
    if (d2 < dm) { dm = d2; best = f[o]; }
  }
  return best;
}

/** Etiqueta de tejido del nodo más cercano (radio 2 nodos), o 0. */
function etiquetaCercana(r: Rejilla, tejido: Uint8Array, p: V3): number {
  const ci = Math.round((p[0] - r.mn[0]) / r.h), cj = Math.round((p[1] - r.mn[1]) / r.h), ck = Math.round((p[2] - r.mn[2]) / r.h);
  let best = 0, dm = Infinity;
  for (let dk = -2; dk <= 2; dk++) for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
    const i = ci + di, j = cj + dj, k = ck + dk;
    if (i < 0 || j < 0 || k < 0 || i >= r.nx || j >= r.ny || k >= r.nz) continue;
    const t = tejido[i + r.nx * (j + r.ny * k)];
    if (!t) continue;
    const x = r.mn[0] + i * r.h - p[0], y = r.mn[1] + j * r.h - p[1], z = r.mn[2] + k * r.h - p[2];
    const d2 = x * x + y * y + z * z;
    if (d2 < dm) { dm = d2; best = t; }
  }
  return best;
}

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ───────────────────────────── atributos de la malla ─────────────────────────────

/** Desplazamiento a contracción completa de un punto del miocardio ventricular. */
export function desplazamientoVentricular(p: V3, w: number): V3 {
  const c = FORMAS.viCav.c, ey = EJES.ey;
  const d = suma(p, c, -1);
  const radial = suma(d, ey, -punto(d, ey));          // del eje largo al punto
  const k = 0.2 + (0.06 - 0.2) * Math.min(1, Math.max(0, w)); // endocardio 20 %, epicardio 6 %
  const hb = punto(suma(p, MARCO.o, -1), ey);          // altura sobre la base (≤ 0)
  const hApex = punto(suma(REF.apex, MARCO.o, -1), ey);
  const f = Math.min(1, Math.max(0, (hb - hApex) / (0 - hApex))); // 0 ápex → 1 base
  return suma(suma([0, 0, 0], radial, -k), ey, -0.1 * f);          // la base baja ≈ 1 cm
}

function atributos(m: Malla, r: Rejilla, el: ReturnType<typeof construirModeloElectrico>, conCorte: boolean): MallaCorazon {
  const nv = m.pos.length / 3;
  const color = new Float32Array(nv * 3), tau = new Float32Array(nv), rho = new Float32Array(nv), proc = new Float32Array(nv);
  const exc = new Float32Array(nv), desp = new Float32Array(nv * 3), arrastre = new Float32Array(nv * 3), sec = new Float32Array(nv);
  const { act } = el;
  const { n: nC, p0: pC, techo } = CORTE;
  for (let v = 0; v < nv; v++) {
    const p: V3 = [m.pos[v * 3], m.pos[v * 3 + 1], m.pos[v * 3 + 2]];
    const vm = interpolar(r, r.vMio, p[0], p[1], p[2]), am = interpolar(r, r.aMio, p[0], p[1], p[2]);
    const ar = interpolar(r, r.arterial, p[0], p[1], p[2]), ve = interpolar(r, r.venoso, p[0], p[1], p[2]);
    const hb = interpolar(r, r.hBase, p[0], p[1], p[2]);
    // cara de sección: sobre el plano y bajo el techo del corte
    let s = 0;
    if (conCorte) {
      const d = (p[0] - pC[0]) * nC[0] + (p[1] - pC[1]) * nC[1] + (p[2] - pC[2]) * nC[2];
      s = smooth(r.h * 0.9, r.h * 0.2, Math.abs(d)) * smooth(techo + 0.01, techo - r.h, hb);
    }
    sec[v] = s;
    // color: mezcla por cercanía a cada tejido
    const wv = Math.exp(-Math.max(0, vm) / 0.015), wa = Math.exp(-Math.max(0, am) / 0.015);
    const wr = Math.exp(-Math.max(0, ar) / 0.015) * 0.9, wn = Math.exp(-Math.max(0, ve) / 0.015) * 0.9;
    const ws = wv + wa + wr + wn + 1e-6;
    const cv = s > 0.5 ? PALETA.seccionV : PALETA.ventriculo, ca = s > 0.5 ? PALETA.seccionA : PALETA.auricula;
    for (let q = 0; q < 3; q++) color[v * 3 + q] = (cv[q] * wv + ca[q] * wa + PALETA.arterial[q] * wr + PALETA.venoso[q] * wn) / ws;
    // tejido y tiempos
    const et = etiquetaCercana(r, act.tejido, p);
    const dMio = Math.min(vm, am);
    exc[v] = et ? 1 - smooth(0.0, 0.03, dMio) : 0;
    if (et) {
      tau[v] = muestrearEtiqueta(r, act.tau, act.tejido, et, p);
      rho[v] = muestrearEtiqueta(r, act.rho, act.tejido, et, p);
      proc[v] = et;
      if (Number.isNaN(tau[v]) || Number.isNaN(rho[v])) { tau[v] = -1e4; rho[v] = -1e4; proc[v] = 0; exc[v] = 0; }
    } else { tau[v] = -1e4; rho[v] = -1e4; proc[v] = 0; }
    // contracción
    let d: V3 = [0, 0, 0];
    if (proc[v] === TEJIDO.ventriculo) {
      const dEndo = Math.max(0, interpolar(r, r.vEndo, p[0], p[1], p[2])), dEpi = Math.max(0, -interpolar(r, r.vEpi, p[0], p[1], p[2]));
      const w = dEndo + dEpi > 1e-6 ? dEndo / (dEndo + dEpi) : 1;
      d = desplazamientoVentricular(p, w);
    } else if (proc[v] === TEJIDO.auricula) {
      const c = dist(p, REF.centroAI) < dist(p, REF.centroAD) ? REF.centroAI : REF.centroAD;
      d = suma([0, 0, 0], suma(c, p, -1), 0.12);
    }
    // el plano AV desciende con la sístole: arrastra lo que no es ventrículo, cada vez menos al alejarse
    if (proc[v] !== TEJIDO.ventriculo) {
      const w = Math.exp(-Math.max(0, vm) / 0.07);
      if (w > 0.02) for (let q = 0; q < 3; q++) arrastre[v * 3 + q] = -0.1 * w * EJES.ey[q];
    }
    desp[v * 3] = d[0]; desp[v * 3 + 1] = d[1]; desp[v * 3 + 2] = d[2];
  }
  suavizarAtributo(m, desp, 3, 4);
  suavizarAtributo(m, arrastre, 3, 2);
  return { pos: m.pos, nor: m.nor, idx: m.idx, color, tau, rho, proc, exc, desp, arrastre, sec };
}

/** Promedio con los vecinos (Laplaciano) de un atributo vectorial: el campo de contracción queda continuo. */
function suavizarAtributo(m: Malla, a: Float32Array, dim: number, pasadas: number) {
  const nv = m.pos.length / 3;
  const acc = new Float32Array(a.length), cnt = new Float32Array(nv);
  for (let p = 0; p < pasadas; p++) {
    acc.set(a); cnt.fill(1);
    for (let t = 0; t < m.idx.length; t += 3) {
      for (let e = 0; e < 3; e++) {
        const i = m.idx[t + e], j = m.idx[t + ((e + 1) % 3)];
        for (let q = 0; q < dim; q++) { acc[i * dim + q] += a[j * dim + q]; acc[j * dim + q] += a[i * dim + q]; }
        cnt[i]++; cnt[j]++;
      }
    }
    for (let v = 0; v < nv; v++) for (let q = 0; q < dim; q++) a[v * dim + q] = acc[v * dim + q] / cnt[v];
  }
}

// ───────────────────────────── válvulas ─────────────────────────────

function base2(n: V3, ref: V3): [V3, V3] {
  const u1 = norm(suma(ref, n, -punto(ref, n)));
  return [u1, norm(cruz(n, u1))];
}
interface Valva { a0: number; a1: number; largo: number }
/**
 * Válvula como valvas en retícula (s a lo largo del anillo, v del anillo al borde
 * libre). Cerrada: las valvas convergen a la línea (o punto) de coaptación y se
 * abomban hacia la aurícula / el seno. Abierta: cuelgan en el sentido del flujo.
 */
function valvula(centro: V3, n: V3, ref: V3, R: number, valvas: Valva[], tipo: 'av' | 'sigmoidea', lineaCoapt = false): MallaValvula {
  const [u1, u2] = base2(n, ref);
  const NS = 12, NV = 7;
  const cerrada: number[] = [], abierta: number[] = [], idx: number[] = [];
  const bordes: number[] = [];
  for (const va of valvas) {
    const base = cerrada.length / 3;
    for (let j = 0; j < NV; j++) for (let i = 0; i < NS; i++) {
      const s = i / (NS - 1), v = j / (NV - 1);
      const th = va.a0 + (va.a1 - va.a0) * s;
      const A = suma(suma(centro, u1, R * Math.cos(th)), u2, R * Math.sin(th));
      let Q: V3;
      if (lineaCoapt) {
        // coaptación sobre la línea de las comisuras (eje u2), corrida hacia la valva posterior
        Q = suma(suma(centro, u2, R * 0.92 * Math.sin(th)), u1, -0.025);
      } else Q = centro;
      const lobulo = Math.sin(Math.PI * s);
      let pc: V3, pa: V3;
      if (tipo === 'av') {
        // 0,96: el borde libre no colapsa en un punto (triángulos degenerados = normales nulas)
        pc = suma(suma(A, suma(Q, A, -1), v * 0.96), n, 0.03 * v - 0.03 * Math.sin(Math.PI * v) * (0.4 + 0.6 * lobulo));
        pa = suma(suma(A, n, va.largo * v * (0.55 + 0.45 * lobulo)), suma(centro, A, -1), 0.22 * v);
      } else {
        pc = suma(suma(A, suma(Q, A, -1), v * 0.97), n, -0.05 * Math.sin(Math.PI * v * 0.9) * lobulo + 0.015 * v);
        pa = suma(suma(A, suma(centro, A, -1), 0.06 * v), n, va.largo * v * (0.5 + 0.5 * lobulo));
      }
      cerrada.push(...pc); abierta.push(...pa);
      if (j === NV - 1 && i % 3 === 1) bordes.push(cerrada.length / 3 - 1);
    }
    for (let j = 0; j < NV - 1; j++) for (let i = 0; i < NS - 1; i++) {
      const a = base + j * NS + i, b = a + 1, c = a + NS, d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  return { cerrada: new Float32Array(cerrada), abierta: new Float32Array(abierta), idx: new Uint32Array(idx), cuerdas: bordes.map((v) => ({ v, ancla: [0, 0, 0] as V3 })) };
}

function construirValvulas(ramas: Rama[]) {
  const deg = Math.PI / 180;
  const nAV = norm([-MARCO.ey[0], -MARCO.ey[1], -MARCO.ey[2]]);             // hacia el ventrículo
  const haciaAorta = suma(REF.aortica, REF.mitral, -1);
  const mitral = valvula(REF.mitral, nAV, haciaAorta, 0.115, [
    { a0: -58 * deg, a1: 58 * deg, largo: 0.2 }, { a0: 58 * deg, a1: 302 * deg, largo: 0.13 },
  ], 'av', true);
  const tricuspide = valvula(REF.tricuspide, nAV, suma(REF.aortica, REF.tricuspide, -1), 0.125, [
    { a0: 0, a1: 120 * deg, largo: 0.15 }, { a0: 120 * deg, a1: 240 * deg, largo: 0.15 }, { a0: 240 * deg, a1: 360 * deg, largo: 0.13 },
  ], 'av');
  const ao = VASOS.aorta.puntos, pu = VASOS.tronco.puntos;
  const iAo = ao.findIndex((p) => dist(p, REF.aortica) < 1e-6), iPu = pu.findIndex((p) => dist(p, REF.pulmonar) < 1e-6);
  const nAo = norm(suma(ao[Math.min(ao.length - 1, iAo + 2)], REF.aortica, -1));
  const nPu = norm(suma(pu[Math.min(pu.length - 1, iPu + 2)], REF.pulmonar, -1));
  const cusp = (n: number) => [0, 1, 2].map((k) => ({ a0: (k * 120 + 2) * deg, a1: (k * 120 + 118) * deg, largo: n }));
  const aortica = valvula(REF.aortica, nAo, [0, 0, 1], 0.112, cusp(0.12), 'sigmoidea');
  const pulmonar = valvula(REF.pulmonar, nPu, [1, 0, 0], 0.112, cusp(0.12), 'sigmoidea');
  // cuerdas: la mitral a los dos papilares del VI; la tricúspide a la banda moderadora y al tabique
  const anclaje = (m: MallaValvula, anclas: V3[]) => {
    for (const c of m.cuerdas) {
      const p: V3 = [m.cerrada[c.v * 3], m.cerrada[c.v * 3 + 1], m.cerrada[c.v * 3 + 2]];
      let best = anclas[0];
      for (const a of anclas) if (dist(a, p) < dist(best, p)) best = a;
      c.ancla = best;
    }
  };
  anclaje(mitral, PAPILARES.map((p) => p.punta));
  const bm = ramas.find((r) => r.nombre === 'banda moderadora');
  const rd = ramas.find((r) => r.nombre === 'rama derecha');
  const anclasT: V3[] = [];
  if (bm) anclasT.push(bm.puntos[bm.puntos.length - 1]);
  if (rd) anclasT.push(rd.puntos[Math.floor(rd.puntos.length * 0.6)]);
  if (anclasT.length) anclaje(tricuspide, anclasT); else tricuspide.cuerdas = [];
  aortica.cuerdas = []; pulmonar.cuerdas = [];
  return { mitral, tricuspide, aortica, pulmonar };
}

// ───────────────────────────── coronarias ─────────────────────────────

/**
 * Coronarias esquemáticas sobre el epicardio ventricular: tronco común, descendente
 * anterior (por el surco interventricular anterior, que se busca como el pliegue
 * de menor radio entre VD y VI), circunfleja y coronaria derecha por el surco
 * auriculoventricular, y la vena cardiaca mayor con el seno coronario. No llevan
 * actividad eléctrica: sólo acompañan la contracción de la pared que tocan.
 */
function coronarias(r: Rejilla, visual: MallaCorazon): MallaCorazon {
  const { ey, e1, e2 } = EJES;
  const o = MARCO.o;
  const hApex = punto(suma(REF.apex, o, -1), ey);
  const dir = (phi: number): V3 => norm(suma(suma([0, 0, 0], e1, Math.cos(phi)), e2, Math.sin(phi)));
  /** punto del epicardio ventricular a la altura h en la dirección φ (rayo desde el eje largo) */
  const epi = (h: number, phi: number): { p: V3; rad: number } | null => {
    const c0 = suma(o, ey, h), d = dir(phi);
    let a = 0, b = -1;
    for (let t = 0.02; t < 1.2; t += 0.01) { const q = suma(c0, d, t); if (interpolar(r, r.vEpi, q[0], q[1], q[2]) > 0) { b = t; break; } a = t; }
    if (b < 0) return null;
    for (let k = 0; k < 18; k++) { const m = (a + b) / 2; const q = suma(c0, d, m); if (interpolar(r, r.vEpi, q[0], q[1], q[2]) > 0) b = m; else a = m; }
    return { p: suma(c0, d, b), rad: b };
  };
  const deg = Math.PI / 180;
  // surco interventricular anterior: pliegue de menor radio entre 15° y 125°
  const lad: V3[] = [], gcv: V3[] = [];
  let phiPrev = 70 * deg;
  for (let h = -0.07; h > hApex + 0.06; h -= 0.04) {
    let mejor: { p: V3; rad: number; phi: number } | null = null;
    for (let f = phiPrev - 25 * deg; f <= phiPrev + 25 * deg; f += 2 * deg) {
      if (f < 15 * deg || f > 125 * deg) continue;
      const e = epi(h, f);
      if (e && (!mejor || e.rad < mejor.rad)) mejor = { ...e, phi: f };
    }
    if (!mejor) continue;
    phiPrev = phiPrev * 0.5 + mejor.phi * 0.5;
    const e = epi(h, phiPrev);
    if (!e) continue;
    lad.push(suma(e.p, dir(phiPrev), 0.006));
    const ev = epi(h, phiPrev + 9 * deg);
    if (ev) gcv.push(suma(ev.p, dir(phiPrev + 9 * deg), 0.005));
  }
  // en el ápex la descendente lo rodea un poco
  lad.push(suma(REF.apex, ey, 0.01));
  // surco auriculoventricular
  const anillo = (f0: number, f1: number, h: number, sep: number) => {
    const out: V3[] = [];
    const n = Math.max(2, Math.ceil(Math.abs(f1 - f0) / (6 * deg)));
    for (let i = 0; i <= n; i++) { const f = f0 + ((f1 - f0) * i) / n; const e = epi(h, f); if (e) out.push(suma(e.p, dir(f), sep)); }
    return out;
  };
  const rca = anillo(28 * deg, -150 * deg, -0.05, 0.008);
  const lcx = anillo(78 * deg, 215 * deg, -0.05, 0.008);
  const seno = anillo(88 * deg, 250 * deg, -0.015, 0.008);
  // orígenes en la raíz aórtica (senos derecho e izquierdo)
  const raizD = suma(REF.aortica, [-0.03, -0.03, 0.1]), raizI = suma(REF.aortica, [0.1, -0.01, 0.02]);
  const tronco: V3[] = lcx.length ? [raizI, suma(suma(raizI, suma(lcx[0], raizI, -1), 0.5), [0, 0.02, 0.04]), lcx[0]] : [];
  const conLad: V3[] = lad.length && lcx.length ? [lcx[0], ...lad] : [];
  const rcaComp: V3[] = rca.length ? [raizD, suma(suma(raizD, suma(rca[0], raizD, -1), 0.5), [0, 0, 0.03]), ...rca] : [];
  const vena: V3[] = gcv.length && seno.length ? [...gcv.slice().reverse(), ...seno] : [];
  const vasos: { c: V3[]; r0: number; r1: number; color: V3 }[] = [
    { c: tronco, r0: 0.02, r1: 0.019, color: PALETA.coronaria },
    { c: conLad, r0: 0.017, r1: 0.007, color: PALETA.coronaria },
    { c: lcx, r0: 0.016, r1: 0.009, color: PALETA.coronaria },
    { c: rcaComp, r0: 0.018, r1: 0.01, color: PALETA.coronaria },
    { c: vena, r0: 0.011, r1: 0.019, color: PALETA.venaCoronaria },
  ];
  const pos: number[] = [], nor: number[] = [], col: number[] = [], idx: number[] = [], src: number[] = [];
  const nS = 9;
  // vértice de la malla visual más cercano a cada punto de la línea central (de él hereda la mecánica)
  const cercano = (p: V3) => {
    let best = 0, dm = Infinity;
    const P = visual.pos;
    for (let i = 0; i < P.length; i += 3) { const dx = P[i] - p[0], dy = P[i + 1] - p[1], dz = P[i + 2] - p[2]; const d2 = dx * dx + dy * dy + dz * dz; if (d2 < dm) { dm = d2; best = i / 3; } }
    return best;
  };
  for (const v of vasos) {
    if (v.c.length < 2) continue;
    // remuestreo cada 0,015 u con Catmull-Rom
    const pts: V3[] = [];
    for (let i = 0; i < v.c.length - 1; i++) {
      const a = v.c[Math.max(0, i - 1)], b = v.c[i], c = v.c[i + 1], d = v.c[Math.min(v.c.length - 1, i + 2)];
      const n = Math.max(1, Math.ceil(dist(b, c) / 0.015));
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t;
        const q: V3 = [0, 0, 0];
        for (let j = 0; j < 3; j++) q[j] = 0.5 * (2 * b[j] + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2 + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t3);
        pts.push(q);
      }
    }
    pts.push(v.c[v.c.length - 1]);
    const base = pos.length / 3;
    let N: V3 = [0, 1, 0];
    for (let i = 0; i < pts.length; i++) {
      const T = norm(suma(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)], -1));
      N = suma(N, T, -punto(N, T));
      if (Math.hypot(N[0], N[1], N[2]) < 1e-6) N = cruz(T, Math.abs(T[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]);
      N = norm(N);
      const B = cruz(T, N);
      const rr = v.r0 + (v.r1 - v.r0) * (i / (pts.length - 1));
      const s0 = cercano(pts[i]);
      for (let k = 0; k < nS; k++) {
        const a = (k / nS) * Math.PI * 2;
        const d = norm(suma(suma([0, 0, 0], N, Math.cos(a)), B, Math.sin(a)));
        const q = suma(pts[i], d, rr);
        pos.push(q[0], q[1], q[2]); nor.push(d[0], d[1], d[2]); col.push(v.color[0], v.color[1], v.color[2]); src.push(s0);
      }
    }
    for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < nS; k++) {
      const a = base + i * nS + k, b = base + i * nS + ((k + 1) % nS), c = a + nS, d = b + nS;
      idx.push(a, b, c, b, d, c);
    }
  }
  const nv = pos.length / 3;
  const m: MallaCorazon = {
    pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint32Array(idx), color: new Float32Array(col),
    tau: new Float32Array(nv), rho: new Float32Array(nv), proc: new Float32Array(nv), exc: new Float32Array(nv),
    desp: new Float32Array(nv * 3), arrastre: new Float32Array(nv * 3), sec: new Float32Array(nv),
  };
  for (let i = 0; i < nv; i++) {
    const s0 = src[i];
    m.tau[i] = visual.tau[s0]; m.rho[i] = visual.rho[s0]; m.proc[i] = visual.proc[s0]; m.exc[i] = 0;
    for (let q = 0; q < 3; q++) { m.desp[i * 3 + q] = visual.desp[s0 * 3 + q]; m.arrastre[i * 3 + q] = visual.arrastre[s0 * 3 + q]; }
  }
  return m;
}

// ───────────────────────────── torso y electrodos ─────────────────────────────

/**
 * Triángulo de Einthoven dibujado (u): los electrodos van en la piel anterior, en
 * la colocación de Mason-Likar de los monitores (fosas infraclaviculares y abdomen
 * inferior izquierdo). Las derivaciones se calculan con las direcciones ideales
 * (−150°, −30°, +90°); el dibujo es la idealización equilátera.
 */
export const EINTHOVEN = { centro: [-0.04, -0.12, 0.0] as V3, radio: 1.42, zTriangulo: 0.62 };

function campoTorso(x: number, y: number, z: number) {
  const el = (cx: number, cy: number, cz: number, a: number, b: number, c: number) => {
    const qx = (x - cx) / a, qy = (y - cy) / b, qz = (z - cz) / c;
    const k0 = Math.sqrt(qx * qx + qy * qy + qz * qz);
    const k1 = Math.sqrt(qx * qx / (a * a) + qy * qy / (b * b) + qz * qz / (c * c)) || 1e-9;
    return (k0 * (k0 - 1)) / k1;
  };
  const sm = (a: number, b: number, k: number) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const pecho = el(-0.06, 0.25, -0.2, 1.62, 1.75, 1.0);
  const abdomen = el(-0.06, -1.7, -0.22, 1.42, 1.25, 0.92);
  const hombros = el(-0.06, 1.45, -0.32, 2.15, 0.48, 0.72);
  const cuello = el(-0.06, 2.15, -0.35, 0.46, 0.7, 0.45);
  let d = sm(sm(pecho, abdomen, 0.6), hombros, 0.5);
  d = sm(d, cuello, 0.3);
  // cortes limpios arriba (cuello) y abajo (cadera)
  d = Math.max(d, y - 2.55, -2.75 - y);
  return d;
}

function construirTorso(): { malla: Malla; electrodos: DatosCorazon['electrodos'] } {
  const h = 0.06;
  const mn: V3 = [-2.6, -2.9, -1.5], mx: V3 = [2.4, 2.75, 1.0];
  const nx = Math.ceil((mx[0] - mn[0]) / h) + 1, ny = Math.ceil((mx[1] - mn[1]) / h) + 1, nz = Math.ceil((mx[2] - mn[2]) / h) + 1;
  const val = new Float32Array(nx * ny * nz);
  for (let k = 0, o = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++, o++) val[o] = campoTorso(mn[0] + i * h, mn[1] + j * h, mn[2] + k * h);
  const malla = mallarValores(val, { mn, h, nx, ny, nz }, 3);
  // electrodos: vértices del triángulo ideal proyectados a la piel anterior
  const { centro, radio } = EINTHOVEN;
  const electrodos = {} as DatosCorazon['electrodos'];
  for (const k of ['RA', 'LA', 'LL'] as const) {
    const e = ELECTRODO[k];
    const vertice: V3 = [centro[0] + e[0] * radio, centro[1] + e[1] * radio, EINTHOVEN.zTriangulo];
    let z = 1.0;
    while (z > -0.5 && campoTorso(vertice[0], vertice[1], z) > 0) z -= 0.005;
    const e2 = 0.01, x = vertice[0], y = vertice[1];
    const normal = norm([
      campoTorso(x + e2, y, z) - campoTorso(x - e2, y, z), campoTorso(x, y + e2, z) - campoTorso(x, y - e2, z), campoTorso(x, y, z + e2) - campoTorso(x, y, z - e2),
    ]);
    electrodos[k] = { piel: [x, y, z], vertice, normal };
  }
  return { malla, electrodos };
}

// ───────────────────────────── construcción completa ─────────────────────────────

export function construirCorazon(calidad: CalidadCorazon = 'alta'): DatosCorazon {
  const ms: Record<string, number> = {};
  let t0 = Date.now();
  const marca = (k: string) => { const t = Date.now(); ms[k] = t - t0; t0 = t; };
  const h = PASO_REJILLA[calidad];
  const r = muestrear(h);
  marca('muestreo');
  const el = construirModeloElectrico(r, calidad === 'alta' ? 1 : 0.7);
  marca('electrico');
  const { act } = el;
  const tauMedioV = act.vMin + 0.45 * (act.vMax - act.vMin), rhoMedioV = (act.rMin + act.rMax) / 2;
  const visual = atributos(mallarValores(r.solido, r, 2), r, el, false);
  marca('visual');
  const cut = new Float32Array(r.solido.length);
  for (let k = 0, o = 0; k < r.nz; k++) for (let j = 0; j < r.ny; j++) for (let i = 0; i < r.nx; i++, o++)
    cut[o] = Math.max(r.solido[o], -quitadoPorCorte(r.mn[0] + i * h, r.mn[1] + j * h, r.mn[2] + k * h, r.hBase[o]));
  const corte = atributos(mallarValores(cut, r, 2), r, el, true);
  marca('corte');
  const coronas = coronarias(r, visual);
  marca('coronarias');
  const valvulas = construirValvulas(el.conduccion.ramas);
  const { malla: torso, electrodos } = construirTorso();
  marca('torso');
  // centro eléctrico: baricentro del miocardio ventricular
  let cx = 0, cy = 0, cz = 0, n = 0;
  for (let k = 0, o = 0; k < r.nz; k++) for (let j = 0; j < r.ny; j++) for (let i = 0; i < r.nx; i++, o++)
    if (act.tejido[o] === TEJIDO.ventriculo) { cx += i; cy += j; cz += k; n++; }
  const centro: V3 = [r.mn[0] + (cx / n) * h, r.mn[1] + (cy / n) * h, r.mn[2] + (cz / n) * h];
  const mn: V3 = [Infinity, Infinity, Infinity], mx: V3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < visual.pos.length; i += 3) for (let q = 0; q < 3; q++) { mn[q] = Math.min(mn[q], visual.pos[i + q]); mx[q] = Math.max(mx[q], visual.pos[i + q]); }
  return {
    calidad, visual, corte, coronarias: coronas, caja: [mn, mx], ramas: el.conduccion.ramas, sa: el.conduccion.sa, nodoAV: el.conduccion.nodoAV,
    act: { aMax: act.aMax, vMin: act.vMin, vMax: act.vMax, rMin: act.rMin, rMax: act.rMax, tLlegadaAV: act.tLlegadaAV },
    fuente: el.fuente, K: el.K, valvulas, centro, torso, electrodos, tauMedioV, rhoMedioV, ms,
  };
}

/** Arreglos transferibles (para devolverlos desde el Worker sin copiar). */
export function transferibles(d: DatosCorazon): ArrayBuffer[] {
  const out: ArrayBuffer[] = [];
  const add = (a: { buffer: ArrayBufferLike }) => { if (a.buffer instanceof ArrayBuffer && !out.includes(a.buffer)) out.push(a.buffer); };
  for (const m of [d.visual, d.corte, d.coronarias]) Object.values(m).forEach((a) => add(a as Float32Array));
  for (const v of Object.values(d.valvulas)) { add(v.cerrada); add(v.abierta); add(v.idx); }
  add(d.torso.pos); add(d.torso.nor); add(d.torso.idx);
  return out;
}

export type { Mapeo };
