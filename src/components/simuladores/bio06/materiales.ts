/**
 * bio06/materiales.ts — texturas, geometrías y materiales del bosque (three, sin React).
 *
 *  · CORTEZA DE ROBLE: una textura de DATOS (no de color) que guarda, por texel, el relieve de las
 *    placas y surcos, la mancha de liquen y la «susceptibilidad» al hollín (rayas verticales que deja
 *    la lluvia), ecualizada para que sea uniforme en [0, 1]. El sombreador cubre de hollín los texeles
 *    con susceptibilidad < h: la fracción de ÁREA ennegrecida es exactamente h, y el albedo medio de lo
 *    limpio y de lo sucio es el de `seleccion.ts` (R_líquenes, R_hollín). La corteza que ve el alumno es
 *    la que ve el ave del modelo.
 *  · POLILLA (Biston betularia): ala anterior y posterior con su contorno, motas «sal y pimienta»,
 *    líneas antemedial y postmedial y mancha discal en la typica; casi negra en la carbonaria. El
 *    dibujo es un patrón en gris LINEAL y el color se escala para que el albedo medio del ala sea el
 *    del modelo (typica 0,38; carbonaria 0,06).
 *  · CARBONERO (Parus major): cuerpo de torno con colores por vértice (capirote negro, mejilla blanca,
 *    pecho amarillo con la corbata negra, dorso oliva), alas con plumas y barra blanca, cola.
 *  · SUELO de hojarasca, HOJAS de roble, haces de luz y motas en el aire.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ALBEDO } from './seleccion';
import { radioTronco, normalTronco, TRONCO, type Rama, puntoRama, radioRama, ENVERGADURA, type V3 } from './bosque';
import { crearLienzo, texturaDeLienzo } from '../_kit';

// ───────────────────────────── ruido periódico (texturas que repiten sin costura) ─────────────────────────────

function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Ruido de valor periódico de período (px, py) celdas; quíntica entre nodos. */
function ruido(px: number, py: number, semilla: number) {
  const r = azar(semilla);
  const tab = new Float32Array(px * py);
  for (let i = 0; i < tab.length; i++) tab[i] = r();
  const q = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  return (x: number, y: number) => {
    const xi = Math.floor(x), yi = Math.floor(y);
    const fx = q(x - xi), fy = q(y - yi);
    const x0 = ((xi % px) + px) % px, y0 = ((yi % py) + py) % py;
    const x1 = (x0 + 1) % px, y1 = (y0 + 1) % py;
    const a = tab[y0 * px + x0], b = tab[y0 * px + x1], c = tab[y1 * px + x0], d = tab[y1 * px + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}
/** fbm periódico en [0,1)²: (u, v) → ~[0, 1]. */
function fbm(fx: number, fy: number, oct: number, semilla: number) {
  const capas = Array.from({ length: oct }, (_, k) => ({ n: ruido(fx << k, fy << k, semilla + k * 101), fx: fx << k, fy: fy << k, a: Math.pow(0.5, k) }));
  const total = capas.reduce((s, c) => s + c.a, 0);
  return (u: number, v: number) => { let s = 0; for (const c of capas) s += c.a * c.n(u * c.fx, v * c.fy); return s / total; };
}

// ───────────────────────────── corteza ─────────────────────────────

export interface DatosCorteza {
  tam: number;
  /** L relativo (media 1) */
  L: Float32Array;
  liquen: Float32Array;
  /** susceptibilidad al hollín, uniforme en [0, 1] */
  S: Float32Array;
  /** por cada nivel de 8 bits de S (lo que lee el sombreador): texeles, ΣL y Σ(0,55 + 0,45·L), con L ya cuantizado */
  niveles: { n: Float64Array; sL: Float64Array; sS: Float64Array };
  datos: THREE.Texture;
  normal: THREE.Texture;
}

let cacheCorteza: DatosCorteza | null = null;
/** Repeticiones de la textura alrededor del roble y largo de cada baldosa (u). */
export const REP_CORTEZA = 3;
export const BALDOSA = (2 * Math.PI * TRONCO.R) / REP_CORTEZA;

export function datosCorteza(): DatosCorteza | null {
  if (cacheCorteza) return cacheCorteza;
  if (typeof document === 'undefined') return null;
  const T = 512, n = T * T;
  const H = new Float32Array(n), L = new Float32Array(n), Lq = new Float32Array(n), S = new Float32Array(n);
  // Relieve de roble: una RED de fisuras alargadas en vertical que se separan y se vuelven a juntar
  // (curvas de nivel de un ruido anisótropo con el dominio alabeado), no un enladrillado.
  const alabeo = fbm(4, 3, 3, 11), fisA = fbm(9, 2, 4, 23), fisB = fbm(16, 4, 3, 29), fisC = fbm(4, 12, 3, 31), corte = fbm(6, 6, 2, 33);
  const fibra = fbm(48, 6, 2, 41), grano = fbm(40, 40, 2, 43);
  const mancha = fbm(3, 3, 4, 37), liqA = fbm(6, 6, 4, 51), liqB = fbm(3, 3, 3, 67), liqBorde = fbm(24, 24, 2, 71);
  const salpica = fbm(64, 40, 2, 89), borron = fbm(5, 5, 4, 131);
  for (let y = 0; y < T; y++) {
    const v = y / T;
    for (let x = 0; x < T; x++) {
      const u = x / T, i = y * T + x;
      const wu = u + (alabeo(u, v) - 0.5) * 0.07, wv = v + (alabeo(v + 0.37, u + 0.11) - 0.5) * 0.05;
      const dA = Math.abs(fisA(wu, wv) - 0.5), dB = Math.abs(fisB(wu, wv) - 0.5), dC = Math.abs(fisC(wu, wv) - 0.5);
      // fisura principal ANCHA y profunda (perfil en V, lomos redondeados), fisuras secundarias y, a
      // trechos, grietas transversales que parten los lomos en bloques
      const perfilA = Math.pow(smooth(0.0, 0.13, dA), 0.55);
      const perfilB = 0.5 + 0.5 * Math.pow(smooth(0.0, 0.04, dB), 0.7);
      const perfilC = 1 - 0.65 * (1 - smooth(0.0, 0.028, dC)) * smooth(0.48, 0.6, corte(u, v));
      const fb = fibra(u, v), gr = grano(u, v);
      const h = Math.min(perfilA, perfilB, perfilC) * (0.78 + 0.14 * fb + 0.08 * gr);
      H[i] = h;
      // líquenes: manchas de borde costroso, sobre todo en los lomos de las placas
      const borde = 0.07 * (liqBorde(u, v) - 0.5);
      const lq = Math.max(smooth(0.6, 0.645, liqA(u, v) + borde), 0.8 * smooth(0.63, 0.68, liqB(u, v) + borde)) * smooth(0.35, 0.8, h);
      Lq[i] = lq;
      const lb = 0.2 + 0.95 * h + 0.2 * (mancha(u, v) - 0.5) + 0.18 * (fb - 0.5) + 0.1 * (gr - 0.5);
      const ll = 1.35 + 0.4 * (liqBorde(v, u) - 0.5);
      L[i] = lb + (ll - lb) * lq;
      // el hollín (y el SO₂ que mata los líquenes) llega antes a las fisuras y a los líquenes; lo último
      // que se ennegrece son las crestas de los lomos que lava la lluvia: con mucho hollín lo limpio queda
      // en hebras finas y verticales, nunca en manchas del tamaño de una polilla (que la camuflarían)
      S[i] = 0.55 * h + 0.3 * salpica(u, v) + 0.06 * borron(u, v) - 0.3 * lq;
    }
  }
  // L con media 1 (el albedo medio de lo limpio es R_líquenes)
  let m = 0; for (let i = 0; i < n; i++) m += L[i];
  m /= n; for (let i = 0; i < n; i++) L[i] /= m;
  // susceptibilidad ecualizada: el rango de cada texel / n → uniforme en [0, 1]
  const orden = Array.from({ length: n }, (_, i) => i).sort((a, b) => S[a] - S[b]);
  for (let r = 0; r < n; r++) S[orden[r]] = (r + 0.5) / n;
  // agregados por nivel de 8 bits, con los MISMOS valores cuantizados que leerá el sombreador
  const niveles = { n: new Float64Array(256), sL: new Float64Array(256), sS: new Float64Array(256) };
  for (let i = 0; i < n; i++) {
    const b = Math.round(S[i] * 255);
    const l8 = (Math.round(Math.min(1, L[i] / 2) * 255) / 255) * 2;
    niveles.n[b]++; niveles.sL[b] += l8; niveles.sS[b] += 0.55 + 0.45 * l8;
  }
  // textura de datos: R = L/2, G = liquen, B = susceptibilidad, A = relieve
  const c = crearLienzo(T, T), g = c.getContext('2d')!;
  const img = g.createImageData(T, T);
  for (let i = 0; i < n; i++) {
    img.data[4 * i] = Math.round(Math.min(1, L[i] / 2) * 255);
    img.data[4 * i + 1] = Math.round(Lq[i] * 255);
    img.data[4 * i + 2] = Math.round(S[i] * 255);
    img.data[4 * i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const datos = texturaDeLienzo(c, { srgb: false, repetir: [1, 1] });
  // mapa de normales del relieve (Sobel periódico; v hacia arriba)
  const cn = crearLienzo(T, T), gn = cn.getContext('2d')!;
  const imn = gn.createImageData(T, T);
  const kz = 9;
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const at = (xx: number, yy: number) => H[(((yy % T) + T) % T) * T + (((xx % T) + T) % T)];
    const du = (at(x + 1, y) - at(x - 1, y)) * 0.5, dv = -(at(x, y + 1) - at(x, y - 1)) * 0.5;
    let nx = -du * kz, ny = -dv * kz, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const i = 4 * (y * T + x);
    imn.data[i] = Math.round((nx * 0.5 + 0.5) * 255); imn.data[i + 1] = Math.round((ny * 0.5 + 0.5) * 255); imn.data[i + 2] = Math.round((nz * 0.5 + 0.5) * 255); imn.data[i + 3] = 255;
  }
  gn.putImageData(imn, 0, 0);
  const normal = texturaDeLienzo(cn, { srgb: false, repetir: [1, 1] });
  cacheCorteza = { tam: T, L, liquen: Lq, S, niveles, datos, normal };
  return cacheCorteza;
}

function smooth(a: number, b: number, x: number) { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

/** Semiancho del borde difuminado del hollín (en unidades de S). */
const BORDE_S = 0.05;
/** Cobertura que aplica el sombreador a un texel de susceptibilidad S con el umbral u (misma fórmula que el GLSL). */
const cubreTexel = (S: number, u: number) => smooth(S - BORDE_S, S + BORDE_S, u);

/** Agregados de la corteza para un umbral u: área cubierta y L medios de lo limpio y de lo cubierto. */
function agregadosCorteza(d: DatosCorteza, u: number) {
  let nL = 0, sL = 0, nS = 0, sS = 0, tot = 0;
  for (let b = 0; b < 256; b++) {
    const k = d.niveles.n[b]; if (!k) continue;
    const w = cubreTexel(b / 255, u);
    tot += k;
    nL += k * (1 - w); sL += d.niveles.sL[b] * (1 - w);
    nS += k * w; sS += d.niveles.sS[b] * w;
  }
  return { nL, sL, nS, sS, tot };
}

/**
 * Umbral del sombreador para que la fracción de ÁREA cubierta sea exactamente h (el borde difuminado
 * y la cuantización a 8 bits la desviarían cerca de 0 y de 1). Va de −BORDE_S (nada) a 1 + BORDE_S (todo).
 */
export function umbralCorteza(h: number): number {
  const d = datosCorteza();
  if (!d) return h;
  if (h <= 0) return -BORDE_S;
  if (h >= 1) return 1 + BORDE_S;
  let lo = -BORDE_S, hi = 1 + BORDE_S;
  for (let i = 0; i < 32; i++) {
    const m = (lo + hi) / 2;
    const a = agregadosCorteza(d, m);
    if (a.nS / a.tot < h) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

/**
 * Como el hollín cubre antes las fisuras y los líquenes, el L medio de lo que queda limpio (y el de lo
 * cubierto) cambia con h. Estos factores lo devuelven a 1 para que el albedo medio de lo limpio sea
 * R_líquenes y el de lo cubierto R_hollín para CUALQUIER h: la corteza dibujada es la del modelo.
 */
export function factoresCorteza(h: number): { umbral: number; kL: number; kS: number; cubierta: number } {
  const d = datosCorteza(); if (!d) return { umbral: h, kL: 1, kS: 1, cubierta: h };
  const umbral = umbralCorteza(h);
  const a = agregadosCorteza(d, umbral);
  return { umbral, kL: a.nL > 0 && a.sL > 0 ? a.nL / a.sL : 1, kS: a.nS > 0 && a.sS > 0 ? a.nS / a.sS : 1, cubierta: a.tot ? a.nS / a.tot : h };
}

/**
 * Albedo medio de la corteza dibujada para un hollín h, texel a texel con los valores cuantizados que
 * lee el sombreador (diagnóstico: debe dar el del modelo) y la fracción de área cubierta.
 */
export function albedoMedidoCorteza(h: number): { albedo: number; cubierta: number } | null {
  const d = datosCorteza(); if (!d) return null;
  const { umbral, kL, kS } = factoresCorteza(h);
  let s = 0, c = 0;
  for (let i = 0; i < d.L.length; i++) {
    const S8 = Math.round(d.S[i] * 255) / 255;
    const l8 = (Math.round(Math.min(1, d.L[i] / 2) * 255) / 255) * 2;
    const cubre = cubreTexel(S8, umbral);
    const limpio = ALBEDO.liquenes * l8 * kL;
    const sucio = ALBEDO.hollin * (0.55 + 0.45 * l8) * kS;
    s += limpio + (sucio - limpio) * cubre;
    c += cubre;
  }
  return { albedo: s / d.L.length, cubierta: c / d.L.length };
}

/** Lleva el hollín h a un material de corteza (umbral de cobertura y factores de albedo). */
export function fijarHollinCorteza(m: THREE.Material, h: number, f = factoresCorteza(h)) {
  const u = m.userData.uniformes as UniformesCorteza | undefined; if (!u) return;
  u.uHollin.value = f.umbral; u.uKL.value = f.kL; u.uKS.value = f.kS;
}

/** Tonos con luminancia 1 (Rec. 709, lineal): el albedo lo pone la R del modelo. */
function tono(hex: string): THREE.Color {
  const c = new THREE.Color(hex);
  const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return c.multiplyScalar(1 / l);
}

export interface UniformesCorteza { uHollin: { value: number }; uMusgo: { value: number }; uKL: { value: number }; uKS: { value: number } }

/**
 * Material de la corteza: hollín por cobertura de área (ver arriba), líquenes, musgo al pie.
 * `repetir`: baldosas en (u, v) de la malla.
 */
export function materialCorteza(repetir: [number, number], musgo = 1): THREE.MeshStandardMaterial {
  const d = datosCorteza();
  const datos = d?.datos.clone() ?? null, normal = d?.normal.clone() ?? null;
  for (const t of [datos, normal]) if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repetir[0], repetir[1]); t.needsUpdate = true; }
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: datos, normalMap: normal, normalScale: new THREE.Vector2(1.15, 1.15), roughness: 0.92, metalness: 0 });
  const uni: UniformesCorteza = { uHollin: { value: 0 }, uMusgo: { value: musgo }, uKL: { value: 1 }, uKS: { value: 1 } };
  const tCorteza = tono('#857b6e'), tLiquen = tono('#b3c29b'), tHollin = tono('#36332f'), tMusgo = tono('#5f7a2e');
  m.userData.uniformes = uni;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni, {
      uRLiq: { value: ALBEDO.liquenes }, uRHol: { value: ALBEDO.hollin },
      uTCor: { value: tCorteza }, uTLiq: { value: tLiquen }, uTHol: { value: tHollin }, uTMus: { value: tMusgo },
    });
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vYMundoB6;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vYMundoB6 = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).y;
        #else
          vYMundoB6 = (modelMatrix * vec4(transformed, 1.0)).y;
        #endif`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying float vYMundoB6;
        uniform float uHollin; uniform float uMusgo; uniform float uRLiq; uniform float uRHol; uniform float uKL; uniform float uKS;
        uniform vec3 uTCor; uniform vec3 uTLiq; uniform vec3 uTHol; uniform vec3 uTMus;`)
      .replace('#include <map_fragment>', `
        vec4 datB6 = texture2D(map, vMapUv);
        float LB6 = datB6.r * 2.0;
        float liqB6 = datB6.g;
        // cobertura de hollín: los texeles con susceptibilidad < h (fracción de área = h)
        // (uHollin es el UMBRAL que hace que el área cubierta sea exactamente h: ver umbralCorteza)
        float cubreB6 = smoothstep(datB6.b - ${BORDE_S.toFixed(3)}, datB6.b + ${BORDE_S.toFixed(3)}, uHollin);
        // musgo al pie del tronco (debajo de la franja de las polillas)
        float musB6 = uMusgo * (1.0 - smoothstep(0.6, 2.2, vYMundoB6)) * smoothstep(0.25, 0.55, datB6.b);
        vec3 tonoB6 = mix(mix(uTCor, uTLiq, liqB6), uTMus, musB6);
        vec3 limpioB6 = uRLiq * LB6 * uKL * tonoB6 * mix(1.0, 0.55, musB6);
        vec3 sucioB6 = uRHol * (0.55 + 0.45 * LB6) * uKS * uTHol;
        diffuseColor.rgb *= mix(limpioB6, sucioB6, cubreB6);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        roughnessFactor = mix(mix(0.93, 0.86, liqB6), 0.78, cubreB6);`);
  };
  m.customProgramCacheKey = () => 'bio06-corteza';
  return m;
}

// ───────────────────────────── geometría del roble y sus ramas ─────────────────────────────

/** Malla del roble principal con la MISMA superficie que usa el reloj (radio y normales analíticas). */
export function geoTronco(segs: number, y0 = -1.2, y1 = TRONCO.alto): THREE.BufferGeometry {
  // anillos: densos en el pie (contrafuertes) y en la franja, más espaciados arriba
  const ys: number[] = [];
  for (let y = y0; y < 3; y += 0.12) ys.push(y);
  for (let y = 3; y < 14; y += 0.25) ys.push(y);
  for (let y = 14; y < y1; y += 0.8) ys.push(y);
  ys.push(y1);
  const filas = ys.length, cols = segs + 1;
  const pos = new Float32Array(filas * cols * 3), nor = new Float32Array(filas * cols * 3), uv = new Float32Array(filas * cols * 2);
  for (let j = 0; j < filas; j++) {
    for (let i = 0; i < cols; i++) {
      const th = (i / segs) * Math.PI * 2 - Math.PI; // la costura queda detrás (θ = ±π)
      const y = ys[j];
      const r = radioTronco(th, y);
      const k = j * cols + i;
      pos[3 * k] = r * Math.sin(th); pos[3 * k + 1] = y; pos[3 * k + 2] = TRONCO.zEje + r * Math.cos(th);
      const n = normalTronco(th, y);
      nor[3 * k] = n[0]; nor[3 * k + 1] = n[1]; nor[3 * k + 2] = n[2];
      uv[2 * k] = (i / segs) * REP_CORTEZA; uv[2 * k + 1] = y / BALDOSA;
    }
  }
  const idx: number[] = [];
  for (let j = 0; j < filas - 1; j++) for (let i = 0; i < segs; i++) {
    const a = j * cols + i, b = a + 1, c = a + cols, d = c + 1;
    idx.push(a, b, d, a, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** Rama como tubo de radio variable (marcos por transporte paralelo); la punta acaba en un cono cerrado. */
export function geoRama(r: Rama, muestras = 40, lados = 14): THREE.BufferGeometry {
  const pts: THREE.Vector3[] = [], rad: number[] = [];
  for (let k = 0; k <= muestras; k++) { const t = k / muestras; pts.push(new THREE.Vector3(...puntoRama(r, t))); rad.push(radioRama(r, t)); }
  const tan = pts.map((p, k) => pts[Math.min(muestras, k + 1)].clone().sub(pts[Math.max(0, k - 1)]).normalize());
  let n = new THREE.Vector3(0, 1, 0).cross(tan[0]).normalize();
  if (n.lengthSq() < 1e-6) n = new THREE.Vector3(1, 0, 0);
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], idx: number[] = [];
  let largo = 0;
  for (let k = 0; k <= muestras; k++) {
    if (k > 0) {
      largo += pts[k].distanceTo(pts[k - 1]);
      // transporte paralelo del marco
      const eje = tan[k - 1].clone().cross(tan[k]);
      const s = eje.length();
      if (s > 1e-6) n.applyAxisAngle(eje.normalize(), Math.asin(Math.min(1, s)));
    }
    const b = tan[k].clone().cross(n).normalize();
    const nn = b.clone().cross(tan[k]).normalize();
    for (let i = 0; i <= lados; i++) {
      const a = (i / lados) * Math.PI * 2;
      const dir = nn.clone().multiplyScalar(Math.cos(a)).addScaledVector(b, Math.sin(a));
      const p = pts[k].clone().addScaledVector(dir, Math.max(0.012, rad[k]));
      pos.push(p.x, p.y, p.z); nor.push(dir.x, dir.y, dir.z);
      uv.push((i / lados) * 1, largo / BALDOSA * 1.6);
    }
  }
  const cols = lados + 1;
  for (let k = 0; k < muestras; k++) for (let i = 0; i < lados; i++) {
    const a = k * cols + i, b2 = a + 1, c = a + cols, d = c + 1;
    idx.push(a, d, b2, a, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** Tronco lejano: cilindro afinado con la v de la textura proporcional a la altura. */
export function geoTroncoLejano(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(0.82, 1, 1, 28, 6, true);
  g.translate(0, 0.5, 0);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * REP_CORTEZA, uv.getY(i) * 8);
  return g;
}

// ───────────────────────────── polilla ─────────────────────────────

/**
 * Ala derecha (anterior + posterior) en coordenadas de ala: x de la base (0) a la punta (1), y de
 * atrás (−) hacia la cabeza (+). 1 = media envergadura. La UV es (x, y + 0,6).
 */
function formaAnterior(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.04, 0.13);
  s.quadraticCurveTo(0.45, 0.2, 0.97, -0.02);     // costa hasta el ápice
  s.quadraticCurveTo(0.9, -0.26, 0.66, -0.38);    // margen externo
  s.quadraticCurveTo(0.38, -0.3, 0.06, -0.13);    // margen interno
  s.quadraticCurveTo(0.02, 0.0, 0.04, 0.13);
  return s;
}
function formaPosterior(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.04, -0.06);
  s.quadraticCurveTo(0.42, -0.22, 0.62, -0.36);
  s.quadraticCurveTo(0.6, -0.56, 0.34, -0.58);
  s.quadraticCurveTo(0.14, -0.55, 0.03, -0.36);
  s.quadraticCurveTo(0.0, -0.2, 0.04, -0.06);
  return s;
}

/** Geometría del ala (lado +1 derecha, −1 izquierda) a tamaño real (u = dm). */
export function geoAla(lado: 1 | -1): THREE.BufferGeometry {
  const ant = new THREE.ShapeGeometry(formaAnterior(), 10);
  const pos = new THREE.ShapeGeometry(formaPosterior(), 10);
  pos.translate(0, 0, -0.004);
  const g = mergeGeometries([pos, ant], false)!;
  const p = g.getAttribute('position') as THREE.BufferAttribute, uv = g.getAttribute('uv') as THREE.BufferAttribute;
  const media = ENVERGADURA / 2;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    uv.setXY(i, x, y + 0.6);
    // ala un poco abombada: el borde se apoya en la corteza
    const comba = 0.035 * Math.sin(Math.PI * Math.min(1, x)) * (1 - Math.abs(y + 0.15));
    p.setXYZ(i, lado * x * media, y * media, (z + comba) * media + 0.004);
  }
  if (lado === -1) {
    // espejo: invierte el sentido de los triángulos para que la cara de arriba siga mirando a +z
    const ix = g.getIndex();
    if (ix) { for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } }
  }
  g.computeVertexNormals();
  return g;
}

/** Cuerpo: abdomen, tórax velludo, cabeza y antenas plumosas (macho). Cabeza hacia +y, dorso +z. */
export function geoCuerpoPolilla(): THREE.BufferGeometry {
  const s = ENVERGADURA / 2;
  const abd = new THREE.LatheGeometry([
    new THREE.Vector2(0.0001, -0.3), new THREE.Vector2(0.03, -0.27), new THREE.Vector2(0.055, -0.18), new THREE.Vector2(0.06, -0.08), new THREE.Vector2(0.045, 0.0), new THREE.Vector2(0.0001, 0.02),
  ], 10);
  abd.scale(s, s, s * 0.8);
  const tor = new THREE.SphereGeometry(0.075 * s, 12, 8); tor.scale(1, 1.25, 0.8); tor.translate(0, 0.07 * s, 0.006);
  const cab = new THREE.SphereGeometry(0.05 * s, 10, 8); cab.translate(0, 0.19 * s, 0.004);
  const antenas = [-1, 1].map((l) => {
    const a = new THREE.ConeGeometry(0.018 * s, 0.32 * s, 5, 1);
    a.scale(1.6, 1, 0.35);
    a.translate(0, 0.16 * s, 0);
    a.rotateZ(-l * 0.95);
    a.translate(l * 0.025 * s, 0.21 * s, 0.003);
    return a;
  });
  const g = mergeGeometries([abd, tor, cab, ...antenas].map((x) => { x.deleteAttribute('uv'); return x; }), false)!;
  g.translate(0, 0, 0.012);
  return g;
}

/** Ala de la presa en el pico: las dos alas plegadas hacia arriba (una sola malla). */
export function geoPresa(): THREE.BufferGeometry {
  const d = geoAla(1), i = geoAla(-1);
  d.rotateY(-1.15); i.rotateY(1.15);
  const c = geoCuerpoPolilla();
  c.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((c.getAttribute('position') as THREE.BufferAttribute).count * 2).fill(0.2), 2));
  return mergeGeometries([d, i, c], false)!;
}

interface PatronAla { tex: THREE.Texture; media: number }
const cachePatron = new Map<string, PatronAla>();

/** Patrón (gris lineal) del ala y su valor medio SOBRE el área del ala. */
export function patronAla(f: 'clara' | 'oscura'): PatronAla | null {
  const ya = cachePatron.get(f); if (ya) return ya;
  if (typeof document === 'undefined') return null;
  const W = 256, Hh = 256;
  const c = crearLienzo(W, Hh), g = c.getContext('2d')!;
  const r = azar(f === 'clara' ? 5 : 9);
  const X = (x: number) => x * W, Y = (y: number) => (1 - (y + 0.6)) * Hh; // y de ala → píxel (v hacia arriba)
  const clara = f === 'clara';
  const gris = (v: number) => { const k = Math.round(Math.max(0, Math.min(1, v)) * 255); return `rgb(${k},${k},${k})`; };
  g.fillStyle = gris(clara ? 0.88 : 0.5); g.fillRect(0, 0, W, Hh);
  // motas «sal y pimienta» (más densas hacia la costa)
  const nm = clara ? 1500 : 420;
  for (let i = 0; i < nm; i++) {
    const x = r(), y = r() * 0.8 - 0.6, cerca = Math.exp(-Math.abs(y - 0.08) * 3);
    if (r() > 0.45 + 0.55 * cerca) continue;
    g.fillStyle = clara ? gris(0.05 + r() * 0.2) : gris(0.62 + r() * 0.25);
    g.globalAlpha = clara ? 0.85 : 0.5;
    g.beginPath(); g.ellipse(X(x), Y(y), 0.7 + r() * (clara ? 1.9 : 1.4), 0.5 + r() * 1.1, r() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  g.globalAlpha = 1;
  // líneas antemedial y postmedial (onduladas, en ambas formas; casi invisibles en la carbonaria)
  g.lineCap = 'round'; g.lineJoin = 'round';
  const linea = (pts: [number, number][], ancho: number, val: number, alfa: number) => {
    g.strokeStyle = gris(val); g.globalAlpha = alfa; g.lineWidth = ancho;
    g.beginPath();
    pts.forEach(([x, y], i) => { const px = X(x) + Math.sin(i * 2.3) * 2.2, py = Y(y); if (i) g.lineTo(px, py); else g.moveTo(px, py); });
    g.stroke(); g.globalAlpha = 1;
  };
  const am: [number, number][] = [[0.3, 0.17], [0.27, 0.08], [0.29, 0.0], [0.24, -0.08], [0.2, -0.17]];
  const pm: [number, number][] = [[0.66, 0.11], [0.62, 0.03], [0.68, -0.06], [0.6, -0.16], [0.5, -0.24], [0.4, -0.27]];
  const ph: [number, number][] = [[0.48, -0.3], [0.44, -0.38], [0.36, -0.46], [0.24, -0.5]];
  linea(am, 3.2, clara ? 0.12 : 0.36, clara ? 0.85 : 0.6);
  linea(pm, 3.4, clara ? 0.1 : 0.36, clara ? 0.9 : 0.6);
  linea(ph, 2.4, clara ? 0.22 : 0.4, clara ? 0.55 : 0.4);
  // mancha discal
  g.fillStyle = gris(clara ? 0.1 : 0.32); g.beginPath(); g.ellipse(X(0.46), Y(0.02), 4.5, 3, 0.4, 0, Math.PI * 2); g.fill();
  // costa con trazos oscuros
  for (let i = 0; i < 14; i++) { const x = 0.1 + i * 0.06; g.fillStyle = gris(clara ? 0.15 : 0.35); g.fillRect(X(x), Y(0.17 - x * 0.18) - 1, 3, 4); }
  // base del ala anterior: la carbonaria conserva a veces una manchita clara
  if (!clara) { g.fillStyle = gris(0.78); g.globalAlpha = 0.6; g.beginPath(); g.ellipse(X(0.08), Y(0.08), 3, 2.2, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; }
  // media del patrón sobre el ÁREA del ala (máscara de las dos formas)
  const mk = crearLienzo(W, Hh), gm = mk.getContext('2d')!;
  gm.fillStyle = '#fff';
  for (const s of [formaAnterior(), formaPosterior()]) {
    const pts = s.getPoints(40);
    gm.beginPath(); pts.forEach((p, i) => (i ? gm.lineTo(X(p.x), Y(p.y)) : gm.moveTo(X(p.x), Y(p.y)))); gm.closePath(); gm.fill();
  }
  const dm = gm.getImageData(0, 0, W, Hh).data, dp = g.getImageData(0, 0, W, Hh).data;
  let sum = 0, cnt = 0;
  for (let i = 0; i < W * Hh; i++) if (dm[4 * i] > 127) { sum += dp[4 * i] / 255; cnt++; }
  const res = { tex: texturaDeLienzo(c, { srgb: false }), media: cnt ? sum / cnt : 0.5 };
  cachePatron.set(f, res);
  return res;
}

/** Materiales de una forma: el color escala el patrón para que el albedo medio sea el del modelo. */
export function materialesPolilla(f: 'clara' | 'oscura') {
  const pat = patronAla(f);
  const R = f === 'clara' ? ALBEDO.typica : ALBEDO.carbonaria;
  const tonoAla = f === 'clara' ? tono('#efe9da') : tono('#2f2a26');
  const k = R / (pat?.media ?? 0.5);
  const ala = new THREE.MeshPhysicalMaterial({
    map: pat?.tex ?? null, color: tonoAla.clone().multiplyScalar(k), roughness: 0.82, metalness: 0, side: THREE.DoubleSide,
    sheen: 0.25, sheenRoughness: 0.7, sheenColor: new THREE.Color(f === 'clara' ? '#ffffff' : '#6d6a66'),
  });
  const cuerpo = new THREE.MeshPhysicalMaterial({
    color: f === 'clara' ? tono('#d8d2c3').multiplyScalar(0.34) : tono('#2a2522').multiplyScalar(0.05),
    roughness: 0.9, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color(f === 'clara' ? '#ffffff' : '#555049'),
  });
  return { ala, cuerpo };
}

// ───────────────────────────── carbonero ─────────────────────────────

const COL_AVE = {
  negro: new THREE.Color('#15171b'), blanco: new THREE.Color('#ecebe4'), amarillo: new THREE.Color('#e8c22f'),
  oliva: new THREE.Color('#7c8c38'), grisAzul: new THREE.Color('#5d6f80'), nuca: new THREE.Color('#dfe6c9'),
};

/** Centro de la cabeza del carbonero (pivote del cuello) en coordenadas del ave. */
export const CABEZA_AVE: V3 = [0, 0.17, 0.42];

/**
 * Carbonero con colores por vértice. Mira hacia +z; 1,6 u sin escalar (la escena lo pone a 14 cm).
 * `parte`: 'cuerpo' (cuerpo, cola y patas) o 'cabeza' (cabeza y pico, centrada en su pivote).
 */
export function geoAve(parte: 'cuerpo' | 'cabeza' = 'cuerpo'): THREE.BufferGeometry {
  // cuerpo de torno a lo largo de z
  const perfil = [[0.0001, -0.42], [0.1, -0.36], [0.2, -0.22], [0.25, -0.04], [0.245, 0.12], [0.2, 0.28], [0.12, 0.38], [0.0001, 0.42]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const cuerpo = new THREE.LatheGeometry(perfil, 22);
  cuerpo.rotateX(Math.PI / 2);          // eje del torno → +z
  cuerpo.scale(0.92, 1, 1);
  const cabeza = new THREE.SphereGeometry(0.19, 22, 16); cabeza.scale(0.95, 0.95, 1.05); cabeza.translate(0, 0.17, 0.42);
  // cola: placa afinada con horquilla
  const sc = new THREE.Shape();
  sc.moveTo(-0.07, 0); sc.lineTo(0.07, 0); sc.lineTo(0.12, -0.55); sc.lineTo(0.02, -0.5); sc.lineTo(0, -0.53); sc.lineTo(-0.02, -0.5); sc.lineTo(-0.12, -0.55); sc.closePath();
  const cola = new THREE.ExtrudeGeometry(sc, { depth: 0.025, bevelEnabled: false });
  cola.rotateX(-Math.PI / 2); cola.rotateX(0.18); cola.translate(0, 0.04, -0.32);
  const pico = new THREE.ConeGeometry(0.045, 0.15, 10); pico.rotateX(Math.PI / 2); pico.translate(0, 0.15, 0.66);
  const patas = [-1, 1].flatMap((l) => {
    const p = new THREE.CylinderGeometry(0.014, 0.012, 0.22, 6); p.translate(l * 0.08, -0.31, 0.04);
    const dedo = new THREE.CylinderGeometry(0.009, 0.007, 0.13, 5); dedo.rotateX(Math.PI / 2); dedo.translate(l * 0.08, -0.42, 0.08);
    const atras = new THREE.CylinderGeometry(0.009, 0.007, 0.08, 5); atras.rotateX(Math.PI / 2); atras.translate(l * 0.08, -0.42, -0.0);
    return [p, dedo, atras];
  });
  const lista = parte === 'cabeza' ? [cabeza, pico] : [cuerpo, cola, ...patas];
  const partes = lista.map((g) => { const x = g.index ? g.toNonIndexed() : g; x.deleteAttribute('uv'); return x; });
  const g = mergeGeometries(partes, false)!;
  // colores por región
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const hx = x, hy = y - 0.17, hz = z - 0.42;
    const enCabeza = hx * hx + hy * hy + hz * hz < 0.215 * 0.215 && z > 0.25;
    if (z > 0.58 && y > 0.08) c.copy(COL_AVE.negro);              // pico
    else if (y < -0.27) c.set('#5c6672');                          // patas
    else if (enCabeza) {
      const mejilla = Math.abs(hx) > 0.07 && hy < 0.04 && hy > -0.13 && hz > -0.1;
      const nuca = hy > 0.06 && hz < -0.12 && Math.abs(hx) < 0.06;
      c.copy(mejilla ? COL_AVE.blanco : nuca ? COL_AVE.nuca : COL_AVE.negro);
    } else if (z < -0.32) c.copy(COL_AVE.grisAzul);                // cola
    else {
      const abajo = y < 0.02;
      const corbata = abajo && Math.abs(x) < 0.05 + 0.03 * Math.max(0, z) && z > -0.28;
      const babero = z > 0.24 && y < 0.1 && y > -0.12;
      if (corbata || babero) c.copy(COL_AVE.negro);
      else if (abajo) c.copy(COL_AVE.amarillo).lerp(COL_AVE.blanco, Math.max(0, Math.min(1, (-z - 0.15) * 2.2)));
      else if (z < -0.22) c.copy(COL_AVE.grisAzul).lerp(COL_AVE.oliva, 0.35);
      else c.copy(COL_AVE.oliva).lerp(COL_AVE.amarillo, Math.max(0, Math.min(1, (0.06 - y) * 4)));
    }
    col[3 * i] = c.r; col[3 * i + 1] = c.g; col[3 * i + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  if (parte === 'cabeza') g.translate(-CABEZA_AVE[0], -CABEZA_AVE[1], -CABEZA_AVE[2]);
  return g;
}

/** Ala del carbonero (derecha; la izquierda es su espejo): placa con borde de plumas. Pivote en el hombro. */
export function geoAlaAve(lado: 1 | -1): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, 0.1);
  s.quadraticCurveTo(0.45, 0.16, 0.86, 0.02);
  // primarias: dientes en el borde de fuga
  const dientes = 7;
  for (let k = 0; k <= dientes; k++) {
    const t = k / dientes;
    const x = 0.86 - t * 0.78, y = -0.04 - 0.22 * Math.sin(t * Math.PI * 0.9);
    s.lineTo(x + 0.03, y - 0.05);
    s.lineTo(x, y);
  }
  s.quadraticCurveTo(0.02, -0.12, 0, 0.1);
  const g = new THREE.ShapeGeometry(s, 8);
  const p = g.getAttribute('position') as THREE.BufferAttribute, uv = g.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    uv.setXY(i, x / 0.9, (y + 0.35) / 0.55);
    p.setXYZ(i, lado * x, 0.02 * Math.sin(x * 3), y * 0.9);
  }
  if (lado === -1) { const ix = g.getIndex(); if (ix) for (let i = 0; i < ix.count; i += 3) { const a = ix.getX(i + 1); ix.setX(i + 1, ix.getX(i + 2)); ix.setX(i + 2, a); } }
  g.computeVertexNormals();
  return g;
}

let texAlaAve: THREE.Texture | null = null;
export function texturaAlaAve(): THREE.Texture | null {
  if (texAlaAve) return texAlaAve;
  if (typeof document === 'undefined') return null;
  const W = 256, Hh = 160, c = crearLienzo(W, Hh), g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0, '#73844a'); gr.addColorStop(0.3, '#5f7287'); gr.addColorStop(1, '#3f4d5c');
  g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
  // barra alar blanca
  g.strokeStyle = '#eef0ea'; g.lineWidth = 9; g.beginPath(); g.moveTo(W * 0.2, Hh * 0.18); g.lineTo(W * 0.62, Hh * 0.3); g.stroke();
  // plumas: raquis y bordes claros
  for (let k = 0; k < 12; k++) {
    const x = W * (0.25 + k * 0.06);
    g.strokeStyle = 'rgba(20,26,34,0.55)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, Hh * 0.35); g.lineTo(x - 10, Hh * 0.98); g.stroke();
    g.strokeStyle = 'rgba(200,214,226,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 5, Hh * 0.4); g.lineTo(x - 4, Hh * 0.98); g.stroke();
  }
  texAlaAve = texturaDeLienzo(c, {});
  return texAlaAve;
}

export function materialesAve() {
  return {
    cuerpo: new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.72, sheen: 0.5, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffffff'), envMapIntensity: 0.8 }),
    ala: new THREE.MeshPhysicalMaterial({ map: texturaAlaAve(), roughness: 0.7, side: THREE.DoubleSide, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color('#dfe8f0') }),
    ojo: new THREE.MeshPhysicalMaterial({ color: '#050506', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 }),
  };
}

// ───────────────────────────── suelo, hojas, aire ─────────────────────────────

let texHojarasca: THREE.Texture | null = null;
/** Hojarasca de roble (formas de hoja, sin grano fino). */
export function texturaHojarasca(): THREE.Texture | null {
  if (texHojarasca) return texHojarasca;
  if (typeof document === 'undefined') return null;
  const T = 512, c = crearLienzo(T, T), g = c.getContext('2d')!;
  const r = azar(303);
  g.fillStyle = '#3b2f22'; g.fillRect(0, 0, T, T);
  const tonos = ['#5b4631', '#6a5136', '#76593a', '#4e3c29', '#80653f', '#5d4b33', '#4b4f2e', '#6e5a3e'];
  for (let i = 0; i < 1100; i++) {
    const x = r() * T, y = r() * T, L = 9 + r() * 14, a = r() * Math.PI;
    for (const [dx, dy] of [[0, 0], [T, 0], [-T, 0], [0, T], [0, -T]]) {
      if (Math.abs(x + dx - T / 2) > T / 2 + L || Math.abs(y + dy - T / 2) > T / 2 + L) continue;
      g.save(); g.translate(x + dx, y + dy); g.rotate(a);
      g.fillStyle = tonos[Math.floor(r() * tonos.length)]; g.globalAlpha = 0.85;
      g.beginPath();
      // hoja lobulada sencilla
      for (let k = 0; k <= 16; k++) { const t = (k / 16) * Math.PI * 2; const rr = 1 + 0.16 * Math.cos(t * 5); const px = Math.cos(t) * L * rr, py = Math.sin(t) * L * 0.45 * rr; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(40,28,16,0.45)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-L, 0); g.lineTo(L, 0); g.stroke();
      g.restore();
    }
  }
  g.globalAlpha = 1;
  texHojarasca = texturaDeLienzo(c, { repetir: [32, 32] });
  return texHojarasca;
}

let texHoja: THREE.Texture | null = null;
/** Hoja de roble con su silueta lobulada (alfa) para las ramas y el dosel. */
export function texturaHoja(): THREE.Texture | null {
  if (texHoja) return texHoja;
  if (typeof document === 'undefined') return null;
  const W = 128, Hh = 256, c = crearLienzo(W, Hh), g = c.getContext('2d')!;
  g.clearRect(0, 0, W, Hh);
  const gr = g.createLinearGradient(0, 0, 0, Hh);
  gr.addColorStop(0, '#6f8f3a'); gr.addColorStop(1, '#4a6a2a');
  g.fillStyle = gr;
  g.beginPath();
  const pts: [number, number][] = [];
  for (let k = 0; k <= 60; k++) {
    const t = k / 60, y = Hh * (0.04 + 0.9 * t);
    const env = Math.sin(Math.PI * Math.pow(t, 0.85)) * W * 0.4;
    const lob = 1 - 0.32 * Math.pow(Math.abs(Math.sin(t * Math.PI * 4.5)), 0.6);
    pts.push([W / 2 + env * lob, y]);
  }
  g.moveTo(W / 2, Hh * 0.04);
  for (const [x, y] of pts) g.lineTo(x, y);
  for (let i = pts.length - 1; i >= 0; i--) g.lineTo(W - pts[i][0], pts[i][1]);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(200,220,150,0.6)'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(W / 2, Hh * 0.04); g.lineTo(W / 2, Hh); g.stroke();
  g.lineWidth = 1.1;
  for (let k = 1; k < 5; k++) { const y = Hh * (0.15 + k * 0.17); g.beginPath(); g.moveTo(W / 2, y); g.lineTo(W * 0.2, y - 18); g.moveTo(W / 2, y); g.lineTo(W * 0.8, y - 18); g.stroke(); }
  texHoja = texturaDeLienzo(c, {});
  return texHoja;
}

/** Plano de hoja (1 u de largo) con el pecíolo en el origen. */
export function geoHoja(): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(0.55, 1.1, 1, 3);
  const p = g.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, 0.06 * Math.sin((y + 0.55) * 2.6)); }
  g.translate(0, 0.55, 0);
  g.computeVertexNormals();
  return g;
}

/** Haz de luz entre los árboles: plano aditivo con caída suave a los lados y hacia abajo. */
export function materialHaz(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    uniforms: { uColor: { value: new THREE.Color('#ffe7b8') }, uFuerza: { value: 0.12 }, uT: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uFuerza; uniform float uT; varying vec2 vUv;
      void main(){
        float lado = smoothstep(0.0, 0.45, vUv.x) * smoothstep(1.0, 0.55, vUv.x);
        float alto = smoothstep(0.0, 0.55, vUv.y);
        float brillo = 0.85 + 0.15 * sin(uT * 0.7 + vUv.x * 9.0);
        gl_FragColor = vec4(uColor * uFuerza * lado * alto * brillo, 1.0);
      }`,
  });
}

/** Motas de polvo/polen (o copos de hollín) que flotan en la luz. */
export function materialMotas(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uEscala: { value: 400 }, uColor: { value: new THREE.Color('#fff2cf') }, uAlfa: { value: 0.5 } },
    vertexShader: /* glsl */ `
      attribute float aTam; uniform float uEscala; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aTam * uEscala / max(1.0, -mv.z), 1.0, 9.0); vA = smoothstep(260.0, 60.0, -mv.z); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uAlfa; varying float vA;
      void main(){ vec2 p = gl_PointCoord * 2.0 - 1.0; float r = dot(p, p); if (r > 1.0) discard;
        gl_FragColor = vec4(uColor, uAlfa * vA * smoothstep(1.0, 0.1, r));
        #include <colorspace_fragment>
      }`,
  });
}

export type { V3 };
