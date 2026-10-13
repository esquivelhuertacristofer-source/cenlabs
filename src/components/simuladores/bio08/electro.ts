/**
 * bio08/electro.ts — el corazón como TEJIDO EXCITABLE (sin three).
 *
 * Cadena causal, de la anatomía al trazo:
 *  1. Sistema de conducción con su geometría: nodo SA en la unión de la cava
 *     superior con la AD, haz de Bachmann hacia la AI, nodo AV, haz de His, ramas
 *     izquierda (fascículos anterior, posterior y septal) y derecha (con la banda
 *     moderadora) y una red de Purkinje subendocárdica.
 *  2. ACTIVACIÓN = ecuación eikonal  |∇τ|·v = 1  resuelta con Dijkstra sobre la
 *     rejilla del miocardio (26 vecinos). Velocidades: aurícula 0,9 m/s, ventrículo
 *     0,6 m/s, Bachmann 1,6 m/s, His y ramas 2 m/s, Purkinje 2,5 m/s. El anillo
 *     fibroso aísla aurículas de ventrículos: sólo el nodo AV los une.
 *  3. REPOLARIZACIÓN: ρ = τ + DPA, con la DPA más corta donde la activación llega
 *     tarde (pendiente −1,1) y en el epicardio (−20 ms): por eso la onda T sale del
 *     mismo signo que el QRS.
 *  4. DIPOLO CARDIACO por la doble capa equivalente: la fuente es −σ∇Vm y, por el
 *     teorema de la divergencia, D(t) = −K ∮ Vm(x,t) n dA sobre la superficie
 *     cerrada del miocardio (n hacia fuera del tejido). Con Vm = S((t−τ)/w↑) −
 *     S((t−ρ)/w↓) (plantilla logística del potencial de acción) el dipolo se acumula
 *     por «cajones» de τ y de ρ: D(t) = −K Σ ΔA·S(…) + K Σ ΔA′·S(…).
 *     Con todo el tejido en meseta, Vm es uniforme y ∮ n dA = 0 ⇒ D = 0: el
 *     segmento ST sale isoeléctrico sin imponerlo.
 *  5. DERIVACIONES de Einthoven: V = D·û (I: 0°, II: +60°, III: +120°; aVR, aVL y
 *     aVF con módulo √3/2), de modo que I + III = II por construcción.
 *
 * Los tiempos del modelo se ESCALAN a los del dominio (`tiemposCicloB8`: P, PR,
 * QRS y QT de Bazett), de modo que el trazo, la escena y el reto comparten reloj.
 * K se calibra una vez: el vector QRS máximo mide 1,9 mV (adulto típico) a RR 800 ms;
 * la forma, los ejes y los cocientes entre ondas salen del modelo, no de la calibración.
 */
import { tiemposCicloB8 } from '@/domain/biologia';
import {
  type V3, type Rejilla, type Malla, MARCO, REF, FORMAS, EJES, interpolar, mallarValores,
  norm, punto, suma, dist, azar, curva,
} from './anatomia';

// ───────────────────────────── constantes fisiológicas ─────────────────────────────

/** Velocidades de conducción en u/ms (1 m/s = 0,01 u/ms). */
export const VEL = { auricula: 0.009, ventriculo: 0.006, bachmann: 0.016, his: 0.02, purkinje: 0.025 } as const;
/** Pendiente DPA–activación y acortamiento epicárdico (ms). */
export const DPA = { base: 280, pendiente: 1.1, epicardio: 20, auricular: 170 };
/** Anchos de la plantilla logística del potencial de acción (ms del dominio). */
export const ANCHO = { subida: 1.4, bajadaV: 25, bajadaA: 50 };
/** Retardo de Purkinje a músculo (ms). */
const RETARDO_UPM = 4;

// ───────────────────────────── utilidades geométricas ─────────────────────────────

type Campo = (x: number, y: number, z: number) => number;
/** Primer cruce de signo de `f` a lo largo de un rayo (afinado por bisección). */
function cruceRayo(f: Campo, p0: V3, dir: V3, max: number, paso = 0.01, deNegativo = true): { p: V3; d: number } | null {
  let a = 0, fa = f(p0[0], p0[1], p0[2]);
  if (deNegativo && fa >= 0) return null;
  for (let d = paso; d <= max; d += paso) {
    const q = suma(p0, dir, d);
    const fb = f(q[0], q[1], q[2]);
    if ((fa < 0) !== (fb < 0)) {
      let lo = a, hi = d;
      for (let k = 0; k < 12; k++) {
        const m = (lo + hi) / 2, qm = suma(p0, dir, m), fm = f(qm[0], qm[1], qm[2]);
        if ((fm < 0) === (fa < 0)) lo = m; else hi = m;
      }
      const dd = (lo + hi) / 2;
      return { p: suma(p0, dir, dd), d: dd };
    }
    a = d; fa = fb;
  }
  return null;
}

export { EJES };
const CAV_VI = FORMAS.viCav;
/** Punto del eje del VI a la altura s (0 = ápex de la cavidad, 1 = base). */
/** Altura (sobre la base) del centro de la cavidad del VI. */
const H_CAV = punto(suma(CAV_VI.c, MARCO.o, -1), MARCO.ey);
/** Punto del eje del VI a la altura s: 0 = ápex de la cavidad, 1 = justo bajo el plano de la base. */
function ejeVI(s: number): V3 { const b = CAV_VI.semi[1]; const h0 = -b * 0.92, h1 = -0.03 - H_CAV; return suma(CAV_VI.c, EJES.ey, h0 + s * (h1 - h0)); }
const dirAng = (phi: number): V3 => norm(suma(suma([0, 0, 0], EJES.e1, Math.cos(phi)), EJES.e2, Math.sin(phi)));

// ───────────────────────────── sistema de conducción ─────────────────────────────

export type Proceso = 'A' | 'AV' | 'V';
/** Un tramo del sistema de conducción: puntos y tiempo de activación BRUTO (ms). */
export interface Rama {
  nombre: string;
  puntos: V3[];
  /** A: ms desde el disparo del SA; AV: fracción 0..1 del retardo nodal; V: ms desde el His */
  t: number[];
  proceso: Proceso;
  radio: number;
  /** ¿acopla con el músculo? (las ramas principales están aisladas) */
  acopla: boolean;
}

/** Endocardio del VI en (s, φ): rayo desde el eje hacia fuera. */
function endoVI(fEndo: Campo, s: number, phi: number): V3 | null {
  const p0 = ejeVI(s);
  const c = cruceRayo(fEndo, p0, dirAng(phi), 0.6, 0.008);
  return c ? suma(c.p, dirAng(phi), -0.004) : null; // un pelo dentro de la cavidad: se ve sobre la pared
}
/** Centro de la cavidad del VD a la altura s (sobre la normal del tabique). */
function centroVD(fEndo: Campo, s: number): V3 | null {
  const p0 = ejeVI(s);
  const sep = cruceRayo(fEndo, p0, EJES.e1, 0.6, 0.006);           // sale del VI (cara izquierda del tabique)
  if (!sep) return null;
  const entra = cruceRayo((x, y, z) => -fEndo(x, y, z), suma(sep.p, EJES.e1, 0.004), EJES.e1, 0.4, 0.004); // entra al VD
  if (!entra) return null;
  const sale = cruceRayo(fEndo, suma(entra.p, EJES.e1, 0.004), EJES.e1, 0.5, 0.004);       // pared libre
  if (!sale) return null;
  return [(entra.p[0] + sale.p[0]) / 2, (entra.p[1] + sale.p[1]) / 2, (entra.p[2] + sale.p[2]) / 2];
}
/** Endocardio del VD en (s, ψ): rayo desde el centro de su cavidad (ψ = 0 → pared libre, π → tabique). */
function endoVD(fEndo: Campo, s: number, psi: number): V3 | null {
  const c = centroVD(fEndo, s);
  if (!c) return null;
  const d = norm(suma(suma([0, 0, 0], EJES.e1, Math.cos(psi)), EJES.e2, Math.sin(psi)));
  const k = cruceRayo(fEndo, c, d, 0.5, 0.006);
  return k ? suma(k.p, d, -0.004) : null;
}

/** Remuestrea una polilínea cada `paso` u y devuelve las longitudes acumuladas. */
function remuestrear(p: V3[], paso: number): { puntos: V3[]; L: number[] } {
  const out: V3[] = [p[0]], L = [0];
  let acc = 0, resto = 0;
  for (let i = 1; i < p.length; i++) {
    const a = p[i - 1], b = p[i], d = dist(a, b);
    let u = paso - resto;
    while (u <= d) {
      out.push(suma(a, suma(b, a, -1), u / d)); acc += paso; L.push(acc);
      u += paso;
    }
    resto = d - (u - paso);
  }
  const last = p[p.length - 1];
  if (dist(out[out.length - 1], last) > 1e-4) { L.push(L[L.length - 1] + dist(out[out.length - 1], last)); out.push(last); }
  return { puntos: out, L };
}

/**
 * Construye el sistema de conducción sobre la rejilla ya muestreada.
 *  · SA y AV se colocan en nodos de tejido auricular (búsqueda en la rejilla).
 *  · His y ramas siguen la cresta y las caras del tabique (rayos al endocardio).
 *  · La red de Purkinje es una retícula subendocárdica en coordenadas (s, ángulo)
 *    con jitter de semilla fija: meridianos del ápex a ⅔ de la altura, dos anillos y
 *    ramitas cortas; su tiempo es el camino más corto por la red a 2,5 m/s desde los
 *    extremos de los fascículos (Dijkstra sobre el grafo de la red).
 */
export function construirConduccion(r: Rejilla, semilla = 7, densidad = 1): { ramas: Rama[]; sa: V3; nodoAV: V3; his: V3[] } {
  // campo de la cavidad ventricular interpolado de la rejilla (rápido para los rayos)
  const fEndo: Campo = (x, y, z) => interpolar(r, r.vEndo, x, y, z);
  const rnd = azar(semilla);
  const ramas: Rama[] = [];

  // nodo SA: pared alta de la AD junto a la cava superior; nodo AV: tabique interauricular
  // bajo, sobre el anillo tricuspídeo (triángulo de Koch)
  const sa = nodoTejido(r, 'aMio', [REF.centroAD[0] - 0.1, REF.centroAD[1] + 0.2, REF.centroAD[2] + 0.06]);
  const objetivoAV: V3 = suma(suma(REF.tricuspide, suma(REF.mitral, REF.tricuspide, -1), 0.38), MARCO.ey, 0.05);
  const nodoAV = nodoTejido(r, 'aMio', suma(objetivoAV, EJES.e1, -0.06));
  // haz de Bachmann: del SA por el techo anterior hasta la AI
  const bach = [sa, [sa[0] + 0.14, sa[1] + 0.06, sa[2] + 0.05], [REF.centroAI[0] - 0.06, REF.centroAI[1] + 0.13, REF.centroAI[2] + 0.12], [REF.centroAI[0] + 0.16, REF.centroAI[1] + 0.12, REF.centroAI[2] + 0.06]]
    .map((p) => nodoTejido(r, 'aMio', p as V3));
  const rb = remuestrear(curvaSuave(bach), 0.02);
  ramas.push({ nombre: 'Bachmann', puntos: rb.puntos, t: rb.L.map((l) => l / VEL.bachmann), proceso: 'A', radio: 0.008, acopla: true });
  // vía internodal (sólo dibujo: la activación auricular la da la eikonal)
  const inter = remuestrear(curvaSuave([sa, nodoTejido(r, 'aMio', [sa[0] + 0.05, sa[1] - 0.14, sa[2] - 0.08]), nodoAV]), 0.02);
  ramas.push({ nombre: 'internodal', puntos: inter.puntos, t: inter.L.map(() => NaN), proceso: 'A', radio: 0.005, acopla: false });

  // cresta del tabique y bifurcación del His
  const crestaVI = endoVI(fEndo, 0.9, 0) ?? suma(ejeVI(0.9), EJES.e1, 0.2);
  const bif = suma(crestaVI, EJES.e1, 0.05);
  const hisIni = suma(nodoAV, MARCO.ey, -0.04);
  const avTramo = remuestrear([nodoAV, suma(nodoAV, MARCO.ey, -0.02), hisIni], 0.008);
  ramas.push({ nombre: 'nodo AV', puntos: avTramo.puntos, t: avTramo.L.map((l, _i, a) => l / (a[a.length - 1] || 1)), proceso: 'AV', radio: 0.016, acopla: false });
  const his = remuestrear(curvaSuave([hisIni, suma(suma(hisIni, suma(bif, hisIni, -1), 0.5), MARCO.ey, -0.02), bif]), 0.01);
  ramas.push({ nombre: 'His', puntos: his.puntos, t: his.L.map((l) => l / VEL.his), proceso: 'V', radio: 0.012, acopla: false });
  const tBif = his.L[his.L.length - 1] / VEL.his;

  // ── rama izquierda y fascículos (cara izquierda del tabique) ──
  const tramoVI = (sphi: [number, number][]) => sphi.map(([s, f]) => endoVI(fEndo, s, f)).filter((p): p is V3 => !!p);
  const tronco = remuestrear(curvaSuave([bif, ...tramoVI([[0.84, 0.02], [0.74, 0.03]])]), 0.012);
  ramas.push({ nombre: 'rama izquierda', puntos: tronco.puntos, t: tronco.L.map((l) => tBif + l / VEL.his), proceso: 'V', radio: 0.011, acopla: false });
  const tTronco = tBif + tronco.L[tronco.L.length - 1] / VEL.his;
  const fuentesVI: { s: number; a: number; t: number }[] = [];
  const fasc: [string, [number, number][]][] = [
    ['fascículo anterior', [[0.74, 0.03], [0.64, 0.6], [0.52, 1.3], [0.44, 2.0]]],
    ['fascículo posterior', [[0.74, 0.03], [0.65, -0.6], [0.54, -1.25], [0.46, -1.9]]],
    ['fascículo septal', [[0.74, 0.03], [0.62, 0.04], [0.5, 0.02]]],
  ];
  for (const [nombre, ruta] of fasc) {
    const fr = remuestrear(curvaSuave(tramoVI(ruta)), 0.012);
    ramas.push({ nombre, puntos: fr.puntos, t: fr.L.map((l) => tTronco + l / VEL.his), proceso: 'V', radio: 0.008, acopla: false });
    const [s, a] = ruta[ruta.length - 1];
    fuentesVI.push({ s, a, t: tTronco + fr.L[fr.L.length - 1] / VEL.his });
  }
  // las primeras fibras septales (tercio medio del tabique izquierdo): lo primero que se activa
  fuentesVI.push({ s: 0.62, a: 0.04, t: tTronco + 0.13 / VEL.his });
  redPurkinje((s, a) => endoVI(fEndo, s, a), fuentesVI, rnd, ramas, 'Purkinje VI', densidad,
    { sNiveles: [0.04, 0.1, 0.17, 0.25, 0.33, 0.41, 0.5, 0.58, 0.66, 0.74, 0.82], anillos: [0.25, 0.5, 0.74], nAng: 26, aMin: -Math.PI, aMax: Math.PI, cerrado: true, meridianoCada: 2 });

  // ── rama derecha (cara derecha del tabique) y banda moderadora ──
  const tramoVD = (spsi: [number, number][]) => spsi.map(([s, p]) => endoVD(fEndo, s, p)).filter((p): p is V3 => !!p);
  const rd = remuestrear(curvaSuave([bif, ...tramoVD([[0.82, Math.PI], [0.68, Math.PI], [0.52, Math.PI]])]), 0.012);
  ramas.push({ nombre: 'rama derecha', puntos: rd.puntos, t: rd.L.map((l) => tBif + l / VEL.his), proceso: 'V', radio: 0.009, acopla: false });
  const tRD = tBif + rd.L[rd.L.length - 1] / VEL.his;
  const fuentesVD: { s: number; a: number; t: number }[] = [{ s: 0.5, a: Math.PI, t: tRD }];
  const bmA = endoVD(fEndo, 0.52, Math.PI), bmB = endoVD(fEndo, 0.42, 0.3);
  if (bmA && bmB) {
    const bm = remuestrear([bmA, bmB], 0.012);
    ramas.push({ nombre: 'banda moderadora', puntos: bm.puntos, t: bm.L.map((l) => tRD + l / VEL.his), proceso: 'V', radio: 0.016, acopla: false });
    fuentesVD.push({ s: 0.42, a: 0.3, t: tRD + bm.L[bm.L.length - 1] / VEL.his });
  }
  redPurkinje((s, a) => endoVD(fEndo, s, a), fuentesVD, rnd, ramas, 'Purkinje VD', densidad * 0.8,
    { sNiveles: [0.12, 0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.68, 0.76, 0.84], anillos: [0.28, 0.52, 0.76], nAng: 22, aMin: -Math.PI, aMax: Math.PI, cerrado: true, meridianoCada: 2 });

  return { ramas, sa, nodoAV, his: his.puntos };
}

/** Nodo de la rejilla con tejido (canal < 0) más cercano a un punto guía. */
function nodoTejido(r: Rejilla, clave: 'aMio' | 'vMio', p: V3): V3 {
  const ch = r[clave];
  let mejor = -1, dm = Infinity;
  const ci = Math.round((p[0] - r.mn[0]) / r.h), cj = Math.round((p[1] - r.mn[1]) / r.h), ck = Math.round((p[2] - r.mn[2]) / r.h);
  const R = Math.ceil(0.3 / r.h);
  for (let k = Math.max(0, ck - R); k <= Math.min(r.nz - 1, ck + R); k++)
    for (let j = Math.max(0, cj - R); j <= Math.min(r.ny - 1, cj + R); j++)
      for (let i = Math.max(0, ci - R); i <= Math.min(r.nx - 1, ci + R); i++) {
        const o = i + r.nx * (j + r.ny * k);
        if (!(ch[o] < 0)) continue;
        const d = (i - ci) ** 2 + (j - cj) ** 2 + (k - ck) ** 2 + ch[o] / r.h; // prefiere el centro de la pared
        if (d < dm) { dm = d; mejor = o; }
      }
  if (mejor < 0) return p;
  const k = Math.floor(mejor / (r.nx * r.ny)), j = Math.floor((mejor - k * r.nx * r.ny) / r.nx), i = mejor - r.nx * (j + r.ny * k);
  return [r.mn[0] + i * r.h, r.mn[1] + j * r.h, r.mn[2] + k * r.h];
}

/** Suaviza una polilínea corta (Catmull-Rom) para que los haces no se vean quebrados. */
function curvaSuave(p: V3[]): V3[] { return p.length < 3 ? p : curva(p, 6); }

interface OpcRed { sNiveles: number[]; anillos: number[]; nAng: number; aMin: number; aMax: number; cerrado: boolean; meridianoCada: number }
/**
 * Red de Purkinje en retícula (s, ángulo) con jitter: meridianos y anillos más
 * ramitas; tiempos por el camino más corto desde las fuentes (Dijkstra en el grafo).
 */
function redPurkinje(
  sup: (s: number, a: number) => V3 | null, fuentes: { s: number; a: number; t: number }[], rnd: () => number,
  ramas: Rama[], nombre: string, densidad: number, o: OpcRed,
) {
  const S = o.sNiveles, nA = Math.max(8, Math.round(o.nAng * Math.sqrt(densidad)));
  const angulo = (k: number) => o.aMin + ((o.aMax - o.aMin) * k) / nA;
  // nodos de la retícula (con jitter) y sus puntos 3D
  const nodo = new Map<string, number>();
  const pts: V3[] = [], sa: [number, number][] = [];
  const id = (i: number, k: number): number => {
    const kk = o.cerrado ? ((k % nA) + nA) % nA : k;
    const key = i + ':' + kk;
    const ya = nodo.get(key);
    if (ya !== undefined) return ya;
    const s = S[i] + (i > 0 && i < S.length - 1 ? (rnd() - 0.5) * 0.035 : 0);
    const a = angulo(kk) + (rnd() - 0.5) * ((o.aMax - o.aMin) / nA) * 0.5;
    const p = sup(s, a);
    const n = p ? pts.length : -1;
    if (p) { pts.push(p); sa.push([s, a]); }
    nodo.set(key, n);
    return n;
  };
  const aristas: [number, number][] = [];
  const unir = (a: number, b: number) => { if (a >= 0 && b >= 0 && a !== b && dist(pts[a], pts[b]) < 0.2) aristas.push([a, b]); };
  for (let k = 0; k < nA; k += o.meridianoCada) for (let i = 0; i < S.length - 1; i++) unir(id(i, k), id(i + 1, k));
  for (const sA of o.anillos) {
    const i = S.indexOf(sA);
    if (i < 0) continue;
    for (let k = 0; k < (o.cerrado ? nA : nA - 1); k++) unir(id(i, k), id(i, k + 1));
  }
  // ramitas: de un nodo a un punto cercano en dirección aleatoria (hojas)
  const nRamitas = Math.round(pts.length * 0.9 * densidad);
  const base = pts.length;
  for (let q = 0; q < nRamitas; q++) {
    const n = Math.floor(rnd() * base);
    const [s, a] = sa[n];
    const ang = rnd() * Math.PI * 2, l = 0.03 + rnd() * 0.05;
    const s2 = s + Math.sin(ang) * l, a2 = a + (Math.cos(ang) * l) / 0.22;
    if (s2 < 0.02 || s2 > S[S.length - 1] + 0.04) continue;
    const p = sup(s2, a2);
    if (!p) continue;
    pts.push(p); sa.push([s2, a2]);
    unir(n, pts.length - 1);
  }
  // grafo y Dijkstra desde las fuentes (cada fuente se engancha a su nodo más cercano)
  const ady: number[][] = pts.map(() => []);
  for (const [a, b] of aristas) { ady[a].push(b); ady[b].push(a); }
  const t = new Float64Array(pts.length).fill(Infinity);
  const cola = new Monticulo(1024);
  for (const f of fuentes) {
    const p = sup(f.s, f.a);
    if (!p) continue;
    let mejor = -1, dm = Infinity;
    for (let n = 0; n < base; n++) { const d = dist(p, pts[n]); if (d < dm) { dm = d; mejor = n; } }
    if (mejor < 0) continue;
    const tt = f.t + dm / VEL.purkinje;
    if (tt < t[mejor]) { t[mejor] = tt; cola.push(tt, mejor); }
  }
  while (cola.size) {
    const t0 = cola.topT(), n = cola.pop();
    if (t0 > t[n]) continue;
    for (const m of ady[n]) {
      const tt = t0 + dist(pts[n], pts[m]) / VEL.purkinje;
      if (tt < t[m]) { t[m] = tt; cola.push(tt, m); }
    }
  }
  // cada arista se dibuja como un tramo curvo pegado a la pared (punto medio proyectado)
  for (const [a, b] of aristas) {
    if (!Number.isFinite(t[a]) || !Number.isFinite(t[b])) continue;
    const [s1, a1] = sa[a], [s2, a2] = sa[b];
    const medio = sup((s1 + s2) / 2, (a1 + a2) / 2);
    const P = medio ? [pts[a], medio, pts[b]] : [pts[a], pts[b]];
    const rm = remuestrear(curvaSuave(P), 0.012);
    const L = rm.L[rm.L.length - 1] || 1;
    // tiempo lineal a lo largo del tramo entre los de sus extremos (el frente entra por el más temprano)
    const ta = t[a], tb = t[b];
    const tt = rm.L.map((l) => Math.min(ta + l / VEL.purkinje, tb + (L - l) / VEL.purkinje));
    ramas.push({ nombre, puntos: rm.puntos, t: tt, proceso: 'V', radio: 0.0045, acopla: true });
  }
}

// ───────────────────────────── eikonal (Dijkstra) ─────────────────────────────

/** Montículo binario mínimo de (tiempo, nodo). */
class Monticulo {
  t: Float64Array; n: Int32Array; size = 0;
  constructor(cap: number) { this.t = new Float64Array(cap); this.n = new Int32Array(cap); }
  push(t: number, n: number) {
    if (this.size >= this.t.length) { const t2 = new Float64Array(this.t.length * 2); t2.set(this.t); this.t = t2; const n2 = new Int32Array(this.n.length * 2); n2.set(this.n); this.n = n2; }
    let i = this.size++;
    while (i > 0) { const p = (i - 1) >> 1; if (this.t[p] <= t) break; this.t[i] = this.t[p]; this.n[i] = this.n[p]; i = p; }
    this.t[i] = t; this.n[i] = n;
  }
  pop(): number {
    const top = this.n[0];
    const t = this.t[--this.size], n = this.n[this.size];
    let i = 0;
    for (;;) {
      let c = 2 * i + 1; if (c >= this.size) break;
      if (c + 1 < this.size && this.t[c + 1] < this.t[c]) c++;
      if (this.t[c] >= t) break;
      this.t[i] = this.t[c]; this.n[i] = this.n[c]; i = c;
    }
    this.t[i] = t; this.n[i] = n;
    return top;
  }
  topT() { return this.t[0]; }
}

export const TEJIDO = { ninguno: 0, auricula: 1, ventriculo: 2 } as const;

export interface Activacion {
  /** etiqueta de tejido por nodo de la rejilla */
  tejido: Uint8Array;
  /** tiempo de activación bruto (ms): aurícula desde el SA, ventrículo desde el His; NaN fuera */
  tau: Float32Array;
  /** tiempo de repolarización bruto (ms, misma referencia) */
  rho: Float32Array;
  /** extremos brutos */
  aMax: number; vMin: number; vMax: number; rMin: number; rMax: number;
  /** tiempo auricular de llegada al nodo AV (ms brutos) */
  tLlegadaAV: number;
  /** nodos de tejido que la activación no alcanzó (islas): auriculares y ventriculares */
  sinAlcanzar: [number, number];
}

/** Resuelve la activación (eikonal por Dijkstra) y la repolarización sobre la rejilla. */
export function resolverActivacion(r: Rejilla, cond: ReturnType<typeof construirConduccion>): Activacion {
  const { nx, ny, nz, h } = r;
  const N = nx * ny * nz;
  const tejido = new Uint8Array(N);
  // las paredes auriculares miden 1,5 nodos: se admite medio nodo de margen para que no queden islas
  const tolV = h * 0.3, tolA = h * 0.75;
  for (let i = 0; i < N; i++) tejido[i] = r.vMio[i] < tolV ? TEJIDO.ventriculo : r.aMio[i] < tolA ? TEJIDO.auricula : TEJIDO.ninguno;
  // en doble precisión: con Float32 el redondeo hace que «t0 > tau» descarte nodos válidos
  const tau64 = new Float64Array(N).fill(Infinity);
  const heap = new Monticulo(1 << 16);
  const idx = (p: V3) => {
    const i = Math.round((p[0] - r.mn[0]) / h), j = Math.round((p[1] - r.mn[1]) / h), k = Math.round((p[2] - r.mn[2]) / h);
    return { i, j, k };
  };
  const sembrar = (p: V3, t: number, radio: number, tipo: number, v: number) => {
    const c = idx(p), R = Math.ceil(radio / h);
    for (let dk = -R; dk <= R; dk++) for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      const i = c.i + di, j = c.j + dj, k = c.k + dk;
      if (i < 0 || j < 0 || k < 0 || i >= nx || j >= ny || k >= nz) continue;
      const o = i + nx * (j + ny * k);
      if (tejido[o] !== tipo) continue;
      const q: V3 = [r.mn[0] + i * h, r.mn[1] + j * h, r.mn[2] + k * h];
      const d = dist(p, q);
      if (d > radio) continue;
      const tt = t + d / v;
      if (tt < tau64[o]) { tau64[o] = tt; heap.push(tt, o); }
    }
  };
  // semillas auriculares: SA y haz de Bachmann
  sembrar(cond.sa, 0, 0.045, TEJIDO.auricula, VEL.auricula);
  for (const rm of cond.ramas) if (rm.proceso === 'A' && rm.acopla) rm.puntos.forEach((p, i) => sembrar(p, rm.t[i], 0.03, TEJIDO.auricula, VEL.auricula));
  // semillas ventriculares: uniones Purkinje-músculo (ramas que acoplan)
  for (const rm of cond.ramas) if (rm.proceso === 'V' && rm.acopla) rm.puntos.forEach((p, i) => sembrar(p, rm.t[i] + RETARDO_UPM, 0.03, TEJIDO.ventriculo, VEL.ventriculo));
  // vecinos (26) y sus distancias
  const off: number[] = [], len: number[] = [];
  for (let dk = -1; dk <= 1; dk++) for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
    if (!di && !dj && !dk) continue;
    off.push(di + nx * (dj + ny * dk)); len.push(h * Math.sqrt(di * di + dj * dj + dk * dk));
  }
  const hecho = new Uint8Array(N);
  while (heap.size) {
    const t0 = heap.topT();
    const o = heap.pop();
    if (hecho[o] || t0 > tau64[o]) continue;
    hecho[o] = 1;
    const tipo = tejido[o];
    const v = tipo === TEJIDO.auricula ? VEL.auricula : VEL.ventriculo;
    const k = Math.floor(o / (nx * ny)), j = Math.floor((o - k * nx * ny) / nx), i = o - nx * (j + ny * k);
    if (i < 1 || j < 1 || k < 1 || i >= nx - 1 || j >= ny - 1 || k >= nz - 1) continue;
    for (let q = 0; q < 26; q++) {
      const w = o + off[q];
      if (tejido[w] !== tipo || hecho[w]) continue;
      const tt = t0 + len[q] / v;
      if (tt < tau64[w]) { tau64[w] = tt; heap.push(tt, w); }
    }
  }
  const tau = Float32Array.from(tau64);
  // extremos y repolarización
  let aMax = 0, vMin = Infinity, vMax = -Infinity;
  const sinAlcanzar: [number, number] = [0, 0];
  for (let o = 0; o < N; o++) {
    if (!Number.isFinite(tau[o])) { if (tejido[o]) sinAlcanzar[tejido[o] - 1]++; tau[o] = NaN; continue; }
    if (tejido[o] === TEJIDO.auricula) aMax = Math.max(aMax, tau[o]);
    else if (tejido[o] === TEJIDO.ventriculo) { vMin = Math.min(vMin, tau[o]); vMax = Math.max(vMax, tau[o]); }
  }
  const rho = new Float32Array(N).fill(NaN);
  let rMin = Infinity, rMax = -Infinity;
  for (let o = 0; o < N; o++) {
    const t = tau[o];
    if (Number.isNaN(t)) continue;
    if (tejido[o] === TEJIDO.ventriculo) {
      const dEndo = Math.max(0, r.vEndo[o]), dEpi = Math.max(0, -r.vEpi[o]);
      const w = dEndo + dEpi > 1e-6 ? dEndo / (dEndo + dEpi) : 0;  // 0 endocardio → 1 epicardio
      const v = t + DPA.base - DPA.pendiente * (t - vMin) - DPA.epicardio * w;
      rho[o] = v; rMin = Math.min(rMin, v); rMax = Math.max(rMax, v);
    } else rho[o] = t + DPA.auricular;
  }
  dilatar(r, tau, 3); dilatar(r, rho, 3);
  // llegada al nodo AV
  const tLlegadaAV = muestrearCampo(r, tau, cond.nodoAV);
  return { tejido, tau, rho, aMax, vMin, vMax, rMin, rMax, tLlegadaAV, sinAlcanzar };
}

/** Extiende un campo con NaN fuera del tejido: cada nodo vacío toma la media de sus vecinos llenos. */
function dilatar(r: Rejilla, f: Float32Array, pasadas: number) {
  const { nx, ny, nz } = r;
  const vec = [1, -1, nx, -nx, nx * ny, -nx * ny];
  const copia = new Float32Array(f.length);
  for (let p = 0; p < pasadas; p++) {
    copia.set(f);
    for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) {
      const fila = nx * (j + ny * k);
      for (let i = 1; i < nx - 1; i++) {
        const o = i + fila;
        if (copia[o] === copia[o]) continue;            // ya tiene valor (no NaN)
        let s = 0, n = 0;
        for (let q = 0; q < 6; q++) { const v = copia[o + vec[q]]; if (v === v) { s += v; n++; } }
        if (n) f[o] = s / n;
      }
    }
  }
}

/** Trilineal que ignora los nodos sin valor (NaN). */
export function muestrearCampo(r: Rejilla, f: Float32Array, p: V3): number {
  const fx = Math.min(r.nx - 1.0001, Math.max(0, (p[0] - r.mn[0]) / r.h));
  const fy = Math.min(r.ny - 1.0001, Math.max(0, (p[1] - r.mn[1]) / r.h));
  const fz = Math.min(r.nz - 1.0001, Math.max(0, (p[2] - r.mn[2]) / r.h));
  const i = Math.floor(fx), j = Math.floor(fy), k = Math.floor(fz);
  const u = fx - i, v = fy - j, w = fz - k;
  let s = 0, ws = 0;
  for (let c = 0; c < 8; c++) {
    const a = c & 1, b = (c >> 1) & 1, d = (c >> 2) & 1;
    const val = f[(i + a) + r.nx * ((j + b) + r.ny * (k + d))];
    if (Number.isNaN(val)) continue;
    const wt = (a ? u : 1 - u) * (b ? v : 1 - v) * (d ? w : 1 - w);
    s += val * wt; ws += wt;
  }
  return ws > 1e-9 ? s / ws : NaN;
}

// ───────────────────────────── doble capa → dipolo ─────────────────────────────

/** Vectores de área acumulados por cajón de tiempo normalizado u ∈ [0, 1]. */
export interface Cajones { n: number; ax: Float64Array; ay: Float64Array; az: Float64Array }
const N_CAJONES = 120;

function acumular(m: Malla, valor: (p: V3) => number, lo: number, hi: number): Cajones {
  const c: Cajones = { n: N_CAJONES, ax: new Float64Array(N_CAJONES), ay: new Float64Array(N_CAJONES), az: new Float64Array(N_CAJONES) };
  const P = m.pos;
  for (let t = 0; t < m.idx.length; t += 3) {
    const a = m.idx[t] * 3, b = m.idx[t + 1] * 3, d = m.idx[t + 2] * 3;
    const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2];
    const vx = P[d] - P[a], vy = P[d + 1] - P[a + 1], vz = P[d + 2] - P[a + 2];
    const nx = (uy * vz - uz * vy) / 2, ny = (uz * vx - ux * vz) / 2, nz = (ux * vy - uy * vx) / 2;
    const cen: V3 = [(P[a] + P[b] + P[d]) / 3, (P[a + 1] + P[b + 1] + P[d + 1]) / 3, (P[a + 2] + P[b + 2] + P[d + 2]) / 3];
    const v = valor(cen);
    const u = Number.isNaN(v) ? 0.5 : Math.min(1, Math.max(0, (v - lo) / Math.max(1e-6, hi - lo)));
    const k = Math.min(N_CAJONES - 1, Math.floor(u * N_CAJONES));
    c.ax[k] += nx; c.ay[k] += ny; c.az[k] += nz;
  }
  return c;
}

export interface FuenteDipolo {
  aDep: Cajones; aRep: Cajones; vDep: Cajones; vRep: Cajones;
  /** área de cada superficie (u²), para diagnóstico */
  areaA: number; areaV: number;
}

/** Mallas cerradas del miocardio y sus cajones de τ y ρ. */
export function construirFuente(r: Rejilla, act: Activacion): FuenteDipolo {
  const mV = mallarValores(r.vMio, r, 1), mA = mallarValores(r.aMio, r, 1);
  const area = (m: Malla) => { let s = 0; for (let t = 0; t < m.idx.length; t += 3) { const a = m.idx[t] * 3, b = m.idx[t + 1] * 3, d = m.idx[t + 2] * 3; const P = m.pos; const ux = P[b] - P[a], uy = P[b + 1] - P[a + 1], uz = P[b + 2] - P[a + 2], vx = P[d] - P[a], vy = P[d + 1] - P[a + 1], vz = P[d + 2] - P[a + 2]; s += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) / 2; } return s; };
  return {
    aDep: acumular(mA, (p) => muestrearCampo(r, act.tau, p), 0, act.aMax),
    aRep: acumular(mA, (p) => muestrearCampo(r, act.rho, p), DPA.auricular, act.aMax + DPA.auricular),
    vDep: acumular(mV, (p) => muestrearCampo(r, act.tau, p), act.vMin, act.vMax),
    vRep: acumular(mV, (p) => muestrearCampo(r, act.rho, p), act.rMin, act.rMax),
    areaA: area(mA), areaV: area(mV),
  };
}

// ───────────────────────────── tiempos del dominio ─────────────────────────────

/**
 * Mapeo de los tiempos brutos del modelo a los del ciclo del dominio para un RR:
 * cada proceso es t = t0 + u·L con u ∈ [0, 1] su tiempo normalizado.
 */
export interface Mapeo {
  rr: number;
  aDep: [number, number]; aRep: [number, number]; vDep: [number, number]; vRep: [number, number];
  /** escala ms del dominio por ms bruto (auricular y ventricular) */
  kA: number; kV: number;
  /** inicio del His y llegada al nodo AV (ms del dominio) */
  tHis: number; tAV: number;
  ciclo: ReturnType<typeof tiemposCicloB8>;
}
export function mapear(rr: number, act: Pick<Activacion, 'aMax' | 'vMin' | 'vMax' | 'tLlegadaAV'>): Mapeo {
  const c = tiemposCicloB8(rr);
  const kA = c.p / act.aMax;
  const qrs = c.qrsFin - c.pr;
  const kV = qrs / (act.vMax - act.vMin);
  // la T del dominio ocupa [tIni, tFin]; la repolarización se reparte dentro, con margen para la cola logística
  const m = 2.2 * ANCHO.bajadaV * Math.min(1, (c.tFin - c.tIni) / 160);
  return {
    rr,
    aDep: [0, c.p],
    aRep: [DPA.auricular * kA, c.p],
    vDep: [c.pr, qrs],
    vRep: [c.tIni + m, Math.max(10, c.tFin - c.tIni - 2 * m)],
    kA, kV,
    tHis: c.pr - act.vMin * kV,
    tAV: act.tLlegadaAV * kA,
    ciclo: c,
  };
}

/** Logística. */
const S = (x: number) => (x > 40 ? 1 : x < -40 ? 0 : 1 / (1 + Math.exp(-x)));

/** Dipolo cardiaco (paciente, unidades de K) en el tiempo `t` (ms) del ciclo. */
export function dipolo(f: FuenteDipolo, m: Mapeo, t: number, K: number, out: V3 = [0, 0, 0]): V3 {
  out[0] = 0; out[1] = 0; out[2] = 0;
  const sumar = (c: Cajones, [t0, L]: [number, number], w: number, signo: number) => {
    for (let b = 0; b < c.n; b++) {
      const ax = c.ax[b], ay = c.ay[b], az = c.az[b];
      if (ax === 0 && ay === 0 && az === 0) continue;
      const tb = t0 + ((b + 0.5) / c.n) * L;
      const s = S((t - tb) / w) * signo * K;
      out[0] += ax * s; out[1] += ay * s; out[2] += az * s;
    }
  };
  // D = −K ∮ Vm n dA,  Vm = S↑ − S↓
  sumar(f.aDep, m.aDep, ANCHO.subida, -1);
  sumar(f.aRep, m.aRep, ANCHO.bajadaA, +1);
  sumar(f.vDep, m.vDep, ANCHO.subida, -1);
  sumar(f.vRep, m.vRep, ANCHO.bajadaV, +1);
  return out;
}

// ───────────────────────────── derivaciones de Einthoven ─────────────────────────────

export type Derivacion = 'I' | 'II' | 'III' | 'aVR' | 'aVL' | 'aVF';
export const DERIVACIONES: Derivacion[] = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF'];
/**
 * Electrodos ideales del triángulo de Einthoven, como direcciones desde el corazón
 * en el plano frontal: brazo derecho a −150°, izquierdo a −30°, pierna izquierda a
 * +90° (ángulos hexaxiales: 0° = izquierda del paciente, positivos hacia abajo).
 */
export const ELECTRODO: Record<'RA' | 'LA' | 'LL', V3> = {
  RA: [-Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), 0],
  LA: [Math.cos(Math.PI / 6), Math.sin(Math.PI / 6), 0],
  LL: [0, -1, 0],
};
/** φ_e = D·ê_e/√3 (la constante deja |û_I| = 1). */
const fi = (D: V3, e: V3) => punto(D, e) / Math.sqrt(3);
export function potencialesElectrodos(D: V3) { return { RA: fi(D, ELECTRODO.RA), LA: fi(D, ELECTRODO.LA), LL: fi(D, ELECTRODO.LL) }; }
/** Voltaje de cada derivación (mV) a partir de los potenciales de los electrodos. */
export function derivaciones(D: V3): Record<Derivacion, number> {
  const { RA, LA, LL } = potencialesElectrodos(D);
  return {
    I: LA - RA, II: LL - RA, III: LL - LA,
    aVR: RA - (LA + LL) / 2, aVL: LA - (RA + LL) / 2, aVF: LL - (RA + LA) / 2,
  };
}
/** Vector de cada derivación (V = D·û). */
export const VECTOR_DERIVACION: Record<Derivacion, V3> = (() => {
  const e = ELECTRODO, k = 1 / Math.sqrt(3);
  const d = (a: V3, b: V3, c = 1): V3 => [(a[0] - b[0]) * k * c, (a[1] - b[1]) * k * c, (a[2] - b[2]) * k * c];
  const media = (a: V3, b: V3): V3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  return { I: d(e.LA, e.RA), II: d(e.LL, e.RA), III: d(e.LL, e.LA), aVR: d(e.RA, media(e.LA, e.LL)), aVL: d(e.LA, media(e.RA, e.LL)), aVF: d(e.LL, media(e.RA, e.LA)) };
})();
/** Ángulo hexaxial (grados) de un vector en el plano frontal. */
export const anguloFrontal = (v: V3) => (Math.atan2(-v[1], v[0]) * 180) / Math.PI;

// ───────────────────────────── modelo completo ─────────────────────────────

export interface ModeloElectrico {
  conduccion: ReturnType<typeof construirConduccion>;
  act: Activacion;
  fuente: FuenteDipolo;
  /** constante de calibración: |D| máximo del QRS = 1,9 mV a RR 800 ms */
  K: number;
}
export const QRS_MAX_REFERENCIA = 1.9;
export function construirModeloElectrico(r: Rejilla, densidad = 1): ModeloElectrico {
  const conduccion = construirConduccion(r, 7, densidad);
  const act = resolverActivacion(r, conduccion);
  const fuente = construirFuente(r, act);
  const m = mapear(800, act);
  let pico = 0;
  for (let t = m.vDep[0]; t <= m.vDep[0] + m.vDep[1]; t += 0.5) { const D = dipolo(fuente, m, t, 1); pico = Math.max(pico, Math.hypot(D[0], D[1], D[2])); }
  const K = pico > 0 ? QRS_MAX_REFERENCIA / pico : 1;
  return { conduccion, act, fuente, K };
}
