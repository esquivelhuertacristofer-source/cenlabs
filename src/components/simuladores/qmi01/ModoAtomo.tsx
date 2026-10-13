"use client";
/**
 * qmi01/ModoAtomo.tsx — modo «Átomo» (el de inicio): el escenario donde se forja el átomo.
 *
 * Qué se ve y de dónde sale:
 *  · Tres FUENTES vivas desde el segundo cero: cápsula de protones (izquierda),
 *    cápsula de neutrones (derecha) y el anillo de electrones que rodea el plinto.
 *    Son decorativas y no llevan cuenta de nada: no sugieren cuántas partículas faltan.
 *  · Ensamblado: +p / +n → la partícula sale de su cápsula con estela, entra en el
 *    núcleo con un destello y el núcleo se reacomoda (red FCC compacta, transición
 *    suave). −p / −n → vuela de vuelta. +e⁻ → sube del anillo, entra en espiral, se
 *    asienta en su capa y emite UN fotón con
 *        E = E_Slater(Z, e−1) − E_Slater(Z, e),   λ = hc/E      (orbitales.ts)
 *    color espectral; UV e IR con color convencional, y rótulo «fotón 91 nm · UV».
 *    −e⁻ → ionización: el electrón sale y se rotula la energía que cuesta.
 *  · Capas K y L: esferas translúcidas con fresnel que se encienden al ocuparse. Su
 *    radio es ESQUEMÁTICO (capasEsquema: radio de Slater n²/Z_eff comprimido), así
 *    que el catión encoge y el anión crece, pero no a escala (se rotula).
 *  · Electrones: puntos de luz con estela larga en órbitas inclinadas que precesan.
 *    Es un recurso visual: el electrón no recorre una trayectoria (eso lo cuenta el
 *    modo «Orbitales»). Si el modelo no lo liga (Z_eff ≤ 0) deambula, atenuado.
 *  · Núcleo inestable (la lógica nuclear que ya existía): tiembla y suelta chispas;
 *    en el nivel crítico se desintegra.
 *
 * Coste: todo lo que brilla (electrones, estelas, fotones, chispas, partículas de
 * las fuentes, motas) va en UN THREE.Points que se rellena cada cuadro; los
 * nucleones son dos InstancedMesh; el metal, los aros de luz y el vidrio de las
 * tres fuentes y el plinto van fusionados por material. ≈ 15 llamadas de dibujo.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Etiqueta, useCalidad, esfera, tornear } from '../_kit';
import { capasEsquema, energiaCaptura, fotonCaptura, miles, MAX_ELECTRONES } from './orbitales';
import { sitiosNucleo, esProton, radioCumuloUnidad, materialNucleon, COL_PROTON, COL_NEUTRON, type V3 } from './nucleo';

// (toro/cilindro del kit están cacheados y compartidos: aquí se crean propios porque se trasladan)
const toro = (R: number, r: number, segR: number, segT: number) => new THREE.TorusGeometry(R, r, segR, segT);
const cilindro = (r1: number, r2: number, h: number, segs: number, abierto: boolean) => new THREE.CylinderGeometry(r1, r2, h, segs, 1, abierto);

// ───────────────────────────── escenario ─────────────────────────────

export const Y_SUELO = -4.6;
const H_CAP = 2.2;
const R_CAP = 0.44;
const Z_FUENTE = -1.7;
/** posición de la cápsula: x = ∓xF (se acerca al centro en lienzos estrechos para que quepa) */
const fuente = (tipo: 'p' | 'n', xF: number): V3 => [tipo === 'p' ? -xF : xF, Y_SUELO, Z_FUENTE];
/** Encuadre de referencia del modo (átomo de radio 3): la cámara de Atomic3DScene usa los mismos números. */
export const ENCUADRE_ATOMO = { centroY: -0.7, semiAlto: 5.0, semiAltoMin: 4.55, semiAltoMax: 5.9, dirY: 0.28, fov: 35 } as const;
/** semiancho que la cámara reserva para el átomo de radio R (las fuentes se acomodan dentro de lo que quede) */
export const semiAnchoAtomo = (R: number) => R * 1.18 + 0.45;
/**
 * x de las cápsulas para un lienzo de proporción `aspecto` (ancho/alto): pegadas al
 * borde y sin salirse ni con la cámara más cerca que usa el modo (semiAltoMin).
 */
export function xFuentes(aspecto: number): number {
  const tV = Math.tan(THREE.MathUtils.degToRad(ENCUADRE_ATOMO.fov) / 2);
  const tH = tV * Math.max(0.3, aspecto);
  const d = Math.max(ENCUADRE_ATOMO.semiAltoMin / tV, semiAnchoAtomo(2.2) / tH) * 1.04;
  const x = (d - Z_FUENTE * 0.96) * tH - 0.85;
  return Math.round(Math.min(5.0, Math.max(3.2, x)) * 20) / 20;
}
/** boca de la cápsula (de donde sale la partícula) */
const boca = (f: V3): V3 => [f[0], f[1] + H_CAP + 0.36, f[2]];
const R_ANILLO = 2.05;
const Y_ANILLO = Y_SUELO + 0.2;
const H_PLINTO = 0.34;
const Y_CONO = -0.7;
export const COL_ELECTRON = '#ffd88a';
const COL_K = '#4ab8ff';
const COL_L = '#41e0c0';
const COL_HOLO = '#5fd7ff';
/** radios de las capas cuando el modelo no da uno (sin protones): los del carbono */
const R_FANTASMA_K = 1.67;
const R_FANTASMA_L = 3.0;
const MAX_NUC = 64;
const MAX_VUELOS = 24;

/** Radio con el que la cámara encuadra el átomo (Z, e): el de la capa ocupada más externa. */
export function radioEncuadreAtomo(Z: number, e: number): number {
  return capasEsquema(Z, e).exterior ?? R_FANTASMA_L;
}

// ───────────────────────────── utilidades ─────────────────────────────

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const SUAVE = (u: number) => u * u * (3 - 2 * u);
const SALIDA = (u: number) => 1 - Math.pow(1 - u, 3);
const ENTRADA = (u: number) => u * u * u;

function bezier(a: V3, c: V3, b: V3, u: number, out: THREE.Vector3) {
  const v = 1 - u;
  return out.set(
    v * v * a[0] + 2 * v * u * c[0] + u * u * b[0],
    v * v * a[1] + 2 * v * u * c[1] + u * u * b[1],
    v * v * a[2] + 2 * v * u * c[2] + u * u * b[2],
  );
}

/** Órbita esquemática de cada hueco (índice = orden de llenado): inclinación, nodo que precesa, fase. */
interface Orbita { inc: number; nodo: number; prec: number; fase: number; w: number }
const ORBITAS: Orbita[] = Array.from({ length: MAX_ELECTRONES }, (_, k) => {
  if (k < 2) return { inc: k === 0 ? 1.0 : 2.15, nodo: 0.5 + k * 1.6, prec: 0.21, fase: k * Math.PI, w: 1.35 };
  const j = k - 2;
  return { inc: 0.62 + (j * 1.9) / 7, nodo: j * 2.39996 + 0.9, prec: 0.12, fase: j * 0.9 + 0.4, w: 0.82 };
});

/** Posición en la órbita del hueco k, de radio R, en el instante t (elementos orbitales; eje polar +Y). */
function orbita(k: number, R: number, t: number, out: THREE.Vector3) {
  const o = ORBITAS[k];
  const th = o.fase + o.w * t, Om = o.nodo + o.prec * t;
  const cO = Math.cos(Om), sO = Math.sin(Om), ci = Math.cos(o.inc), si = Math.sin(o.inc);
  const c = Math.cos(th), s = Math.sin(th);
  return out.set(R * (c * cO - s * sO * ci), R * s * si, R * (c * sO + s * cO * ci));
}

type FnPos = (t: number, out: THREE.Vector3) => THREE.Vector3;
interface Seg { a: number; f: FnPos }
/** Una partícula en movimiento: su trayectoria es una lista de tramos en el tiempo (así la estela es su pasado). */
interface Movil {
  tipo: 'p' | 'n' | 'e';
  segs: Seg[];
  /** instante en que acaba el vuelo (Infinity = asentado) */
  fin: number;
  /** instante de salida (antes espera en la fuente) */
  sale: number;
  slot: number;
  llegado: boolean;
  alLlegar?: () => void;
}

function posicion(m: Movil, t: number, out: THREE.Vector3) {
  for (let i = m.segs.length - 1; i > 0; i--) if (t >= m.segs[i].a) return m.segs[i].f(t, out);
  return m.segs[0].f(t, out);
}

const cacheSitios = new Map<number, V3[]>();
function sitiosUnidad(n: number): V3[] {
  let s = cacheSitios.get(n);
  if (!s) { s = sitiosNucleo(n, 1); cacheSitios.set(n, s); }
  return s;
}

// ───────────────────────────── sombreadores ─────────────────────────────

const VERT_BRILLO = /* glsl */ `
  attribute vec3 aCol;
  attribute float aTam;
  attribute float aAlfa;
  uniform float uPx;
  varying vec3 vCol;
  varying float vA;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aTam * uPx / max(0.05, -mv.z), 1.0, 320.0);
    vCol = aCol;
    vA = aAlfa;
  }
`;
const FRAG_BRILLO = /* glsl */ `
  varying vec3 vCol;
  varying float vA;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d2 = dot(c, c) * 4.0;
    if (d2 > 1.0) discard;
    float k = exp(-d2 * 7.0) + 0.16 * exp(-d2 * 2.0) * (1.0 - d2);
    gl_FragColor = vec4(vCol, vA * k);
    #include <colorspace_fragment>
  }
`;

const VERT_FRESNEL = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vO;
  varying vec3 vW;
  void main() {
    vO = position;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = cameraPosition - w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

/** Capa electrónica: borde fresnel + paralelos tenues que suben despacio + pulso al ocuparse. */
const FRAG_CAPA = /* glsl */ `
  uniform vec3 uCol;
  uniform float uI;
  uniform float uT;
  uniform float uPulso;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vO;
  void main() {
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float rim = pow(f, 2.4);
    float lat = vO.y * 7.0 + uT * 0.3;
    float lin = 1.0 - smoothstep(0.0, 1.5, abs(fract(lat) - 0.5) / max(fwidth(lat), 1e-4));
    float a = uI * (0.03 + 0.8 * rim + 0.09 * lin * (0.35 + rim)) + uPulso * (0.18 + 0.9 * rim);
    gl_FragColor = vec4(uCol * (1.0 + 0.6 * uPulso), a);
    #include <colorspace_fragment>
  }
`;

/** Vidrio de contención (cápsulas y anillo): fresnel teñido + banda de barrido que sube. */
const VERT_VIDRIO = /* glsl */ `
  attribute vec3 aCol;
  attribute float aBanda;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  varying vec3 vCol;
  varying float vBanda;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = cameraPosition - w.xyz;
    vCol = aCol;
    vBanda = aBanda;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const FRAG_VIDRIO = /* glsl */ `
  uniform float uT;
  uniform float uSuelo;
  uniform float uAlto;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  varying vec3 vCol;
  varying float vBanda;
  void main() {
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float a = 0.05 + 0.6 * pow(f, 2.2);
    float h = (vW.y - uSuelo) / uAlto;
    float barrido = exp(-pow((fract(uT * 0.22) * 1.3 - 0.15 - h) / 0.035, 2.0)) * vBanda;
    gl_FragColor = vec4(vCol, a + 0.5 * barrido);
    #include <colorspace_fragment>
  }
`;

/** Cono de luz del plinto: degradado vertical, borde más brillante y vetas que giran. */
const FRAG_CONO = /* glsl */ `
  uniform vec3 uCol;
  uniform float uT;
  uniform float uBase;
  uniform float uAlto;
  uniform float uI;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    float h = clamp((vW.y - uBase) / uAlto, 0.0, 1.0);
    float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
    float vetas = 0.65 + 0.35 * sin(atan(vW.z, vW.x) * 14.0 + uT * 0.7 + h * 4.0);
    float a = pow(1.0 - h, 1.7) * (0.05 + 0.22 * pow(f, 1.3)) * vetas * uI;
    gl_FragColor = vec4(uCol, a);
    #include <colorspace_fragment>
  }
`;

const VERT_SUELO = /* glsl */ `
  varying vec2 vXZ;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vXZ = w.xz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
/** Suelo del laboratorio: rejilla polar tenue, halo del plinto con arcos que giran y charcos de luz de las fuentes. */
const FRAG_SUELO = /* glsl */ `
  uniform float uT;
  uniform float uRS;
  uniform float uRA;
  uniform vec3 uHolo;
  uniform vec3 uColP;
  uniform vec3 uColN;
  uniform vec3 uColE;
  uniform vec2 uFp;
  uniform vec2 uFn;
  uniform float uPulso;
  varying vec2 vXZ;
  const float TAU = 6.283185307;
  float linea(float v, float ancho) {
    return 1.0 - smoothstep(0.0, ancho, abs(fract(v + 0.5) - 0.5) / max(fwidth(v), 1e-4));
  }
  void main() {
    float r = length(vXZ);
    float ang = atan(vXZ.y, vXZ.x);
    float fade = 1.0 - smoothstep(uRS * 0.35, uRS, r);
    vec3 col = vec3(0.03, 0.058, 0.09);
    // rejilla polar
    float g = linea(r / 0.9, 1.2) * 0.30 + linea(ang / (TAU / 32.0), 1.0) * 0.16 * smoothstep(1.9, 3.0, r);
    col += vec3(0.11, 0.22, 0.30) * g * fade;
    // plinto: halo + arcos holográficos que giran
    col += uHolo * (0.42 + 0.5 * uPulso) * exp(-pow(max(r - 1.0, 0.0) / 0.4, 2.0)) * step(0.95, r);
    float arcos = (1.0 - smoothstep(0.012, 0.03, abs(r - 1.5))) * step(0.42, fract((ang + uT * 0.35) / (TAU / 5.0)));
    float marcas = (1.0 - smoothstep(0.03, 0.06, abs(r - 2.45))) * step(0.82, fract((ang - uT * 0.2) / (TAU / 48.0)));
    col += uHolo * (arcos * 0.9 + marcas * 0.55);
    // anillo de electrones: reflejo dorado
    col += uColE * 0.32 * exp(-pow((r - uRA) / 0.3, 2.0));
    // charcos de luz bajo las cápsulas
    col += uColP * 0.5 * exp(-pow(length(vXZ - uFp) / 0.85, 2.0));
    col += uColN * 0.4 * exp(-pow(length(vXZ - uFn) / 0.85, 2.0));
    gl_FragColor = vec4(col, fade);
    #include <colorspace_fragment>
  }
`;

// ───────────────────────────── memoria de brillos ─────────────────────────────

/** UN THREE.Points para todo lo que brilla; se rellena cada cuadro (sólo se sube lo usado). */
class Brillos {
  readonly geo = new THREE.BufferGeometry();
  n = 0;
  private readonly p: Float32Array;
  private readonly c: Float32Array;
  private readonly s: Float32Array;
  private readonly a: Float32Array;
  constructor(readonly max: number) {
    this.p = new Float32Array(max * 3);
    this.c = new Float32Array(max * 3);
    this.s = new Float32Array(max);
    this.a = new Float32Array(max);
    const at = (arr: Float32Array, k: number) => new THREE.BufferAttribute(arr, k).setUsage(THREE.DynamicDrawUsage);
    this.geo.setAttribute('position', at(this.p, 3));
    this.geo.setAttribute('aCol', at(this.c, 3));
    this.geo.setAttribute('aTam', at(this.s, 1));
    this.geo.setAttribute('aAlfa', at(this.a, 1));
    this.geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
  }
  poner(x: number, y: number, z: number, col: THREE.Color, brillo: number, tam: number, alfa: number) {
    if (this.n >= this.max || !(alfa > 0.003)) return;
    const i = this.n++, i3 = i * 3;
    this.p[i3] = x; this.p[i3 + 1] = y; this.p[i3 + 2] = z;
    this.c[i3] = col.r * brillo; this.c[i3 + 1] = col.g * brillo; this.c[i3 + 2] = col.b * brillo;
    this.s[i] = tam; this.a[i] = alfa;
  }
  ponerV(v: THREE.Vector3, col: THREE.Color, brillo: number, tam: number, alfa: number) {
    this.poner(v.x, v.y, v.z, col, brillo, tam, alfa);
  }
  terminar() {
    this.geo.setDrawRange(0, this.n);
    for (const k of ['position', 'aCol', 'aTam', 'aAlfa']) {
      const at = this.geo.getAttribute(k) as THREE.BufferAttribute;
      at.clearUpdateRanges();
      at.addUpdateRange(0, Math.max(1, this.n) * at.itemSize);
      at.needsUpdate = true;
    }
  }
}

// ───────────────────────────── geometrías del escenario ─────────────────────────────

function conColor(g: THREE.BufferGeometry, col: THREE.Color, brillo: number, banda = 0) {
  const n = g.getAttribute('position').count;
  const c = new Float32Array(n * 3), b = new Float32Array(n).fill(banda);
  for (let i = 0; i < n; i++) { c[i * 3] = col.r * brillo; c[i * 3 + 1] = col.g * brillo; c[i * 3 + 2] = col.b * brillo; }
  g.setAttribute('aCol', new THREE.BufferAttribute(c, 3));
  g.setAttribute('aBanda', new THREE.BufferAttribute(b, 1));
  return g;
}
const mover = (g: THREE.BufferGeometry, p: V3) => g.translate(p[0], p[1], p[2]);
const soloPNU = (g: THREE.BufferGeometry) => {
  const r = g.index ? g.toNonIndexed() : g.clone();
  for (const k of Object.keys(r.attributes)) if (!['position', 'normal', 'uv'].includes(k)) r.deleteAttribute(k);
  return r;
};

function geometriasEscenario(alta: boolean, xF: number) {
  const segs = alta ? 48 : 28;
  const metal: THREE.BufferGeometry[] = [];
  const aros: THREE.BufferGeometry[] = [];
  const vidrio: THREE.BufferGeometry[] = [];
  const cP = new THREE.Color(COL_PROTON), cN = new THREE.Color(COL_NEUTRON), cE = new THREE.Color(COL_ELECTRON), cH = new THREE.Color(COL_HOLO);
  for (const [tipo, f] of [['p', fuente('p', xF)], ['n', fuente('n', xF)]] as ['p' | 'n', V3][]) {
    const col = tipo === 'p' ? cP : cN;
    metal.push(mover(tornear([[0, 0], [0.64, 0], [0.68, 0.05], [0.68, 0.24], [0.6, 0.3], [0.52, 0.34], [0.52, 0.4], [0, 0.4]], segs), f));
    metal.push(mover(tornear([[0, H_CAP - 0.02], [0.52, H_CAP - 0.02], [0.56, H_CAP + 0.02], [0.56, H_CAP + 0.16], [0.4, H_CAP + 0.26], [0.2, H_CAP + 0.3], [0.2, H_CAP + 0.36], [0, H_CAP + 0.36]], segs), f));
    aros.push(conColor(mover(toro(0.5, 0.022, 8, segs * 2).rotateX(Math.PI / 2), [f[0], f[1] + 0.42, f[2]]), col, tipo === 'p' ? 2.4 : 1.8));
    aros.push(conColor(mover(toro(0.5, 0.022, 8, segs * 2).rotateX(Math.PI / 2), [f[0], f[1] + H_CAP - 0.04, f[2]]), col, tipo === 'p' ? 2.4 : 1.8));
    aros.push(conColor(mover(toro(0.2, 0.03, 8, segs).rotateX(Math.PI / 2), [f[0], f[1] + H_CAP + 0.36, f[2]]), col, 3));
    vidrio.push(conColor(mover(cilindro(R_CAP, R_CAP, H_CAP - 0.42, segs, true), [f[0], f[1] + 0.4 + (H_CAP - 0.42) / 2, f[2]]), col, tipo === 'p' ? 1.0 : 0.85, 1));
  }
  // plinto
  metal.push(mover(tornear([[0, 0], [1.24, 0], [1.28, 0.06], [1.28, 0.2], [1.14, 0.29], [0.98, H_PLINTO], [0, H_PLINTO]], alta ? 72 : 40), [0, Y_SUELO, 0]));
  aros.push(conColor(mover(toro(0.99, 0.024, 8, 140).rotateX(Math.PI / 2), [0, Y_SUELO + H_PLINTO, 0]), cH, 2.6));
  aros.push(conColor(mover(toro(0.62, 0.016, 8, 100).rotateX(Math.PI / 2), [0, Y_SUELO + H_PLINTO + 0.005, 0]), cH, 1.8));
  // anillo de electrones (vidrio dorado tumbado)
  vidrio.push(conColor(mover(toro(R_ANILLO, 0.11, alta ? 16 : 10, alta ? 160 : 96).rotateX(Math.PI / 2), [0, Y_ANILLO, 0]), cE, 0.75, 0));
  const fusion = (l: THREE.BufferGeometry[], extra: boolean) => {
    const prep = l.map((g) => {
      const r = g.index ? g.toNonIndexed() : g;
      if (!extra) for (const k of Object.keys(r.attributes)) if (!['position', 'normal', 'uv'].includes(k)) r.deleteAttribute(k);
      return r;
    });
    const m = mergeGeometries(prep, false)!;
    l.forEach((g) => g.dispose());
    return m;
  };
  return { metal: fusion(metal.map(soloPNU), false), aros: fusion(aros, true), vidrio: fusion(vidrio, true) };
}

// ───────────────────────────── componente ─────────────────────────────

export interface PropsModoAtomo {
  protons: number;
  neutrons: number;
  electrons: number;
  instability: number;
  pausa: boolean;
  /** rótulo flotante del fotón (DOM, encima del lienzo) */
  rotuloFoton?: React.RefObject<HTMLDivElement | null>;
}

interface Destello { t0: number; x: number; y: number; z: number; col: THREE.Color; tam: number; vida: number }
interface Chispa { t0: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; vida: number }
interface FotonVuelo { t0: number; o: V3; d: V3; lam: number; col: THREE.Color; vida: number }
interface Rotulo { texto: string; color: string; t0: number; vida: number; ancla: THREE.Vector3; foton?: FotonVuelo }

export default function ModoAtomo({ protons, neutrons, electrons, instability, pausa, rotuloFoton }: PropsModoAtomo) {
  const calidad = useCalidad();
  const alta = calidad === 'alta';
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);

  // ── geometrías y materiales (una vez) ──
  const size0 = useThree((s) => s.size);
  const xF = xFuentes(size0.width / Math.max(1, size0.height));
  const xFRef = useRef(xF);
  xFRef.current = xF;
  const esc = useMemo(() => geometriasEscenario(alta, xF), [alta, xF]);
  useEffect(() => () => { esc.metal.dispose(); esc.aros.dispose(); esc.vidrio.dispose(); }, [esc]);
  const mats = useMemo(() => {
    const metal = new THREE.MeshStandardMaterial({ color: '#2a3642', metalness: 0.85, roughness: 0.3, envMapIntensity: 1.3, name: 'qmi01-metal' });
    const aros = new THREE.ShaderMaterial({
      vertexShader: /* glsl */ `attribute vec3 aCol; varying vec3 vCol; void main() { vCol = aCol; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `varying vec3 vCol;
      void main() {
        gl_FragColor = vec4(vCol, 1.0);
        #include <colorspace_fragment>
      }`,
    });
    const vidrio = new THREE.ShaderMaterial({
      vertexShader: VERT_VIDRIO, fragmentShader: FRAG_VIDRIO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uT: { value: 0 }, uSuelo: { value: Y_SUELO + 0.4 }, uAlto: { value: H_CAP - 0.42 } },
    });
    const capa = (c: string) => new THREE.ShaderMaterial({
      vertexShader: VERT_FRESNEL, fragmentShader: FRAG_CAPA, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uCol: { value: new THREE.Color(c) }, uI: { value: 0.1 }, uT: { value: 0 }, uPulso: { value: 0 } },
    });
    const cono = new THREE.ShaderMaterial({
      vertexShader: VERT_FRESNEL, fragmentShader: FRAG_CONO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uCol: { value: new THREE.Color(COL_HOLO) }, uT: { value: 0 }, uBase: { value: Y_SUELO + H_PLINTO }, uAlto: { value: Y_CONO - (Y_SUELO + H_PLINTO) }, uI: { value: 1 } },
    });
    const suelo = new THREE.ShaderMaterial({
      vertexShader: VERT_SUELO, fragmentShader: FRAG_SUELO, transparent: true, depthWrite: false,
      uniforms: {
        uT: { value: 0 }, uRS: { value: 15 }, uRA: { value: R_ANILLO }, uHolo: { value: new THREE.Color(COL_HOLO) },
        uColP: { value: new THREE.Color(COL_PROTON) }, uColN: { value: new THREE.Color(COL_NEUTRON) }, uColE: { value: new THREE.Color(COL_ELECTRON) },
        uFp: { value: new THREE.Vector2(-5, Z_FUENTE) }, uFn: { value: new THREE.Vector2(5, Z_FUENTE) }, uPulso: { value: 0 },
      },
    });
    const brillo = new THREE.ShaderMaterial({
      vertexShader: VERT_BRILLO, fragmentShader: FRAG_BRILLO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPx: { value: 600 } },
    });
    const nucleon = materialNucleon('#ffffff', alta);
    return { metal, aros, vidrio, capaK: capa(COL_K), capaL: capa(COL_L), cono, suelo, brillo, nucleon };
  }, [alta]);
  useEffect(() => () => { Object.values(mats).forEach((m) => m.dispose()); }, [mats]);

  const geoCono = useMemo(() => cilindro(1.9, 0.95, Y_CONO - (Y_SUELO + H_PLINTO), alta ? 64 : 36, true).translate(0, (Y_CONO + Y_SUELO + H_PLINTO) / 2, 0), [alta]);
  const geoSuelo = useMemo(() => new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2).translate(0, Y_SUELO, 0), []);
  useEffect(() => () => { geoCono.dispose(); geoSuelo.dispose(); }, [geoCono, geoSuelo]);
  const geoCapa = esfera(1, alta ? 72 : 40);
  const geoNucleon = esfera(1, alta ? 28 : 18);

  const brillos = useMemo(() => new Brillos(alta ? 3200 : 1700), [alta]);
  useEffect(() => () => brillos.geo.dispose(), [brillos]);

  const refNuc = useRef<THREE.InstancedMesh>(null);
  const refVuelos = useRef<THREE.InstancedMesh>(null);
  const refK = useRef<THREE.Mesh>(null);
  const refL = useRef<THREE.Mesh>(null);

  // ── estado de la animación (fuera de React: se toca en cada cuadro) ──
  const S = useRef({
    iniciado: false,
    t: 0,
    tReal: 0,
    tipos: [] as ('p' | 'n')[],
    cur: new Float32Array(MAX_NUC * 3),
    vis: new Float32Array(MAX_NUC * 3),
    versionColores: -1,
    version: 0,
    entrantes: [] as Movil[],
    salientes: [] as Movil[],
    electrones: [] as Movil[],
    destellos: [] as Destello[],
    chispas: [] as Chispa[],
    fotones: [] as FotonVuelo[],
    rotulo: null as Rotulo | null,
    textoRotulo: '',
    rK: R_FANTASMA_K, rL: R_FANTASMA_L, rN: 0.26,
    rSlot: new Float32Array(MAX_ELECTRONES).fill(R_FANTASMA_L),
    pulsoK: 0, pulsoL: 0, pulsoN: 0,
    expl: 0, acumChispa: 0, semilla: 7,
  });
  const props = useRef({ protons, neutrons, electrons, instability, pausa });
  props.current = { protons, neutrons, electrons, instability, pausa };

  const tmp = useMemo(() => ({
    v: new THREE.Vector3(), w: new THREE.Vector3(), u: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(),
    s: new THREE.Vector3(), c: new THREE.Color(), d2: new THREE.Vector2(),
    cP: new THREE.Color(COL_PROTON), cN: new THREE.Color(COL_NEUTRON), cE: new THREE.Color(COL_ELECTRON), cK: new THREE.Color(COL_K),
    cL: new THREE.Color(COL_L), cH: new THREE.Color(COL_HOLO), cNuc: new THREE.Color('#ff9a72'), cChispa: new THREE.Color('#ffb36b'),
    cBlanco: new THREE.Color('#fff4e0'), cMota: new THREE.Color('#9fd8ff'),
  }), []);

  useFrame((state, dtCrudo) => {
    const st = S.current;
    const P = props.current;
    // por debajo de 10 fps la animación va más lenta en vez de saltar
    const dt = Math.min(0.1, dtCrudo);
    const quieto = P.pausa;
    st.tReal += dt;
    if (!quieto) st.t += dt;
    const t = st.t;
    const rnd = () => { st.semilla = (st.semilla * 16807) % 2147483647; return st.semilla / 2147483647; };

    // ───── 1. reconciliar con el store (lo que el alumno pulsó) ─────
    const cuenta = (tipo: 'p' | 'n') => st.tipos.reduce((s, x) => s + (x === tipo ? 1 : 0), 0);
    const pVisActual = () => cuenta('p');
    const eAsentados = () => st.electrones.reduce((s, m) => s + (m.llegado ? 1 : 0), 0);

    const agregarAlNucleo = (tipo: 'p' | 'n', desde: V3 | null) => {
      if (st.tipos.length >= MAX_NUC) { st.tipos.push(tipo); return; }
      const i = st.tipos.length;
      st.tipos.push(tipo);
      if (desde) { st.cur[i * 3] = desde[0]; st.cur[i * 3 + 1] = desde[1]; st.cur[i * 3 + 2] = desde[2]; }
      else { const s = sitiosUnidad(i + 1)[i] ?? [0, 0, 0]; st.cur.set([s[0] * st.rN, s[1] * st.rN, s[2] * st.rN], i * 3); }
      st.version++;
    };
    const quitarDelNucleo = (tipo: 'p' | 'n'): V3 => {
      const j = st.tipos.lastIndexOf(tipo);
      const p: V3 = j < MAX_NUC ? [st.vis[j * 3], st.vis[j * 3 + 1], st.vis[j * 3 + 2]] : [0, 0, 0];
      st.tipos.splice(j, 1);
      if (j < MAX_NUC) { st.cur.copyWithin(j * 3, (j + 1) * 3); st.vis.copyWithin(j * 3, (j + 1) * 3); }
      st.version++;
      return p;
    };
    const destello = (p: V3 | THREE.Vector3, col: THREE.Color, tam: number, vida: number) => {
      const [x, y, z] = Array.isArray(p) ? p : [p.x, p.y, p.z];
      st.destellos.push({ t0: st.tReal, x, y, z, col, tam, vida });
    };
    const rotular = (texto: string, color: string, ancla: THREE.Vector3, vida: number, foton?: FotonVuelo) => {
      st.rotulo = { texto, color, t0: st.tReal, vida, ancla: ancla.clone(), foton };
    };

    const instantaneo = quieto || !st.iniciado;
    const T_NUC = 0.8;

    const lanzarNucleon = (tipo: 'p' | 'n', retardo: number) => {
      const A = boca(fuente(tipo, xFRef.current));
      const t0 = t + retardo;
      const rc = radioCumuloUnidad(Math.max(1, st.tipos.length + 1)) * st.rN;
      const dl = Math.hypot(A[0], A[1], A[2]);
      const B: V3 = [(A[0] / dl) * rc, (A[1] / dl) * rc, (A[2] / dl) * rc];
      const C: V3 = [A[0] * 0.45, A[1] * 0.2 + 3.0, A[2] * 0.45 + 0.8];
      const m: Movil = {
        tipo, slot: -1, llegado: false, sale: t0, fin: t0 + T_NUC,
        segs: [
          { a: -Infinity, f: (_t, o) => o.set(A[0], A[1], A[2]) },
          { a: t0, f: (tt, o) => bezier(A, C, B, SUAVE(clamp01((tt - t0) / T_NUC)), o) },
        ],
      };
      m.alLlegar = () => {
        agregarAlNucleo(tipo, B);
        destello(B, tipo === 'p' ? tmp.cP : tmp.cBlanco, 1.1, 0.4);
        st.pulsoN = 1;
      };
      st.entrantes.push(m);
    };
    const enviarAFuente = (tipo: 'p' | 'n', desde: V3, previo?: Movil) => {
      const A = boca(fuente(tipo, xFRef.current));
      const t0 = t;
      const C: V3 = [(desde[0] + A[0]) * 0.5, Math.max(desde[1], A[1]) + 2.4, (desde[2] + A[2]) * 0.5 + 0.6];
      const segs: Seg[] = previo ? [...previo.segs] : [{ a: -Infinity, f: (_t, o) => o.set(desde[0], desde[1], desde[2]) }];
      segs.push({ a: t0, f: (tt, o) => bezier(desde, C, A, SUAVE(clamp01((tt - t0) / T_NUC)), o) });
      const m: Movil = { tipo, slot: -1, llegado: false, sale: previo ? previo.sale : t0, fin: t0 + T_NUC, segs };
      m.alLlegar = () => destello(A, tipo === 'p' ? tmp.cP : tmp.cN, 0.7, 0.3);
      st.salientes.push(m);
    };

    // electrones: puntos de salida en el anillo, por delante
    const puntoAnillo = (): V3 => {
      const a = 0.25 + rnd() * 2.6;
      return [R_ANILLO * Math.cos(a), Y_ANILLO, R_ANILLO * Math.sin(a)];
    };
    const T1 = 0.75, T2 = 1.15;
    const asentado = (k: number): Seg => ({ a: -Infinity, f: (tt, o) => orbita(k, st.rSlot[k], tt, o) });
    const lanzarElectron = (k: number, retardo: number) => {
      const Sx = puntoAnillo();
      const t0 = t + retardo;
      const giro = (2 * Math.PI) / ORBITAS[k].w;
      const X = (u: number) => -(1 - SALIDA(u)) * giro;
      const e0 = new THREE.Vector3();
      const m: Movil = {
        tipo: 'e', slot: k, llegado: false, sale: t0, fin: t0 + T1 + T2,
        segs: [
          { a: -Infinity, f: (_t, o) => o.set(Sx[0], Sx[1], Sx[2]) },
          { a: t0, f: (tt, o) => {
            orbita(k, st.rSlot[k] * 1.9, t0 + T1 + X(0), e0);
            const C: V3 = [(Sx[0] + e0.x) * 0.5, Math.max(Sx[1], e0.y) + 1.6, (Sx[2] + e0.z) * 0.5 + 0.5];
            return bezier(Sx, C, [e0.x, e0.y, e0.z], SUAVE(clamp01((tt - t0) / T1)), o);
          } },
          { a: t0 + T1, f: (tt, o) => {
            const u = clamp01((tt - t0 - T1) / T2);
            return orbita(k, st.rSlot[k] * (1 + 0.9 * (1 - SALIDA(u))), tt + X(u), o);
          } },
          { a: t0 + T1 + T2, f: (tt, o) => orbita(k, st.rSlot[k], tt, o) },
        ],
      };
      m.alLlegar = () => alAsentarse(m);
      st.electrones[k] = m;
    };
    const alAsentarse = (m: Movil) => {
      m.llegado = true;
      m.fin = Infinity;
      const Z = pVisActual();
      const k = m.slot;
      posicion(m, t, tmp.v);
      if (k < 2) st.pulsoK = 1; else st.pulsoL = 1;
      const f = fotonCaptura(Z, k + 1);
      if (f) {
        // sale hacia fuera y algo hacia la cámara, para que se vea volar
        // hacia fuera y hacia arriba (lejos de los paneles de abajo), algo hacia la cámara
        tmp.w.set(tmp.v.x, Math.abs(tmp.v.y), tmp.v.z).normalize();
        if (!(tmp.w.lengthSq() > 0.5)) tmp.w.set(0.6, 0.8, 0);
        tmp.u.copy(state.camera.position).sub(tmp.v).normalize();
        tmp.w.addScaledVector(tmp.u, 0.3).add(tmp.s.set(0, 0.75, 0)).normalize();
        const fv: FotonVuelo = { t0: st.tReal, o: [tmp.v.x, tmp.v.y, tmp.v.z], d: [tmp.w.x, tmp.w.y, tmp.w.z], lam: f.lambdaNm, col: new THREE.Color(f.color), vida: 2.0 };
        if (!quieto) st.fotones.push(fv);
        destello(tmp.v, fv.col, 1.5, 0.45);
        const banda = f.banda === 'visible' ? 'visible' : f.banda;
        rotular(`fotón ${miles(Math.round(f.lambdaNm))} nm · ${banda} · ${f.energiaEv.toFixed(1)} eV`, f.color, tmp.v, quieto ? 3.2 : 2.8, quieto ? undefined : fv);
      } else if (Z > 0 && energiaCaptura(Z, k + 1) <= 0 && capasEsquema(Z, k + 1)[k < 2 ? 'K' : 'L'].zEff > 0) {
        rotular('sin fotón: Slater no explica la afinidad electrónica', '#94a3b8', tmp.v, 3.2);
      } else {
        rotular('no queda ligado (Z_eff ≤ 0): sin fotón', '#94a3b8', tmp.v, 3.0);
      }
    };
    const ionizar = (m: Movil) => {
      const k = m.slot;
      const Z = pVisActual();
      const E = energiaCaptura(Z, k + 1);
      posicion(m, t, tmp.v);
      rotular(E > 0 ? `ionizar: +${E.toFixed(1)} eV` : 'sale sin coste: el modelo no lo ligaba', E > 0 ? '#ffd88a' : '#94a3b8', tmp.v, 2.6);
      const t0 = t;
      const giro = (2 * Math.PI) / ORBITAS[k].w;
      const Ta = 0.55, Tb = 0.8;
      const Sx = puntoAnillo();
      const x0 = new THREE.Vector3();
      m.segs = [
        ...m.segs,
        { a: t0, f: (tt, o) => {
          const u = clamp01((tt - t0) / Ta);
          return orbita(k, st.rSlot[k] * (1 + 0.9 * ENTRADA(u)), tt + ENTRADA(u) * giro, o);
        } },
        { a: t0 + Ta, f: (tt, o) => {
          orbita(k, st.rSlot[k] * 1.9, t0 + Ta + giro, x0);
          const C: V3 = [(Sx[0] + x0.x) * 0.5, Math.max(Sx[1], x0.y) + 1.4, (Sx[2] + x0.z) * 0.5 + 0.5];
          return bezier([x0.x, x0.y, x0.z], C, Sx, SUAVE(clamp01((tt - t0 - Ta) / Tb)), o);
        } },
      ];
      m.llegado = false;
      m.fin = t0 + Ta + Tb;
      m.alLlegar = () => destello(Sx, tmp.cE, 0.6, 0.3);
      st.salientes.push(m);
    };
    const devolverElectron = (m: Movil) => {
      // venía de camino y se pide quitarlo: da la vuelta desde donde está
      posicion(m, t, tmp.v);
      const P0: V3 = [tmp.v.x, tmp.v.y, tmp.v.z];
      const Sx = puntoAnillo();
      const t0 = t;
      const C: V3 = [(P0[0] + Sx[0]) * 0.5, Math.max(P0[1], Sx[1]) + 1.2, (P0[2] + Sx[2]) * 0.5];
      m.segs = [...m.segs, { a: t0, f: (tt, o) => bezier(P0, C, Sx, SUAVE(clamp01((tt - t0) / 0.7)), o) }];
      m.fin = t0 + 0.7;
      m.alLlegar = undefined;
      st.salientes.push(m);
    };

    // primera vez (o al volver a este modo): el núcleo se monta ya mezclado, sin vuelos
    if (!st.iniciado) {
      const p0 = Math.max(0, Math.round(P.protons)), n0 = Math.max(0, Math.round(P.neutrons));
      const tot = p0 + n0;
      for (let i = 0; i < tot; i++) agregarAlNucleo(esProton(i, tot, p0) ? 'p' : 'n', null);
    }
    // electrones primero: si se quitan a la vez protones y electrones (Reiniciar), la
    // energía de ionización se calcula con el núcleo aún entero
    {
      const objetivo = Math.max(0, Math.min(MAX_ELECTRONES, Math.round(P.electrons)));
      let d = objetivo - st.electrones.length;
      let k = 0;
      while (d > 0) {
        const slot = st.electrones.length;
        if (instantaneo) {
          st.electrones[slot] = { tipo: 'e', slot, llegado: true, sale: -Infinity, fin: Infinity, segs: [asentado(slot)] };
          st.rSlot[slot] = slot < 2 ? st.rK : st.rL;
          if (st.iniciado) { const m = st.electrones[slot]; m.alLlegar = undefined; alAsentarse(m); }
        } else lanzarElectron(slot, k++ * 0.16);
        d--;
      }
      let nIon = 0, eIon = 0;
      while (d < 0) {
        const m = st.electrones.pop()!;
        if (m.llegado) { nIon++; eIon += Math.max(0, energiaCaptura(pVisActual(), m.slot + 1)); }
        if (instantaneo) {
          if (st.iniciado && m.llegado) {
            const E = energiaCaptura(pVisActual(), m.slot + 1);
            posicion(m, t, tmp.v);
            rotular(E > 0 ? `ionizar: +${E.toFixed(1)} eV` : 'sale sin coste: el modelo no lo ligaba', E > 0 ? '#ffd88a' : '#94a3b8', tmp.v, 3.0);
          }
        }
        else if (m.llegado) ionizar(m);
        else if (t >= m.sale) devolverElectron(m);
        d++;
      }
      // varios a la vez (p. ej. Reiniciar): un solo rótulo con la energía total
      if (nIon > 1 && st.iniciado) {
        tmp.v.set(0, st.rL * 0.8, 0);
        rotular(`ionizar ${nIon} e⁻: +${miles(Math.round(eIon))} eV`, '#ffd88a', tmp.v, 3.0);
      }
    }
    // nucleones
    for (const tipo of ['p', 'n'] as const) {
      const objetivo = Math.max(0, Math.round(tipo === 'p' ? P.protons : P.neutrons));
      const enNucleo = cuenta(tipo);
      const llegando = st.entrantes.filter((m) => m.tipo === tipo);
      let d = objetivo - enNucleo - llegando.length;
      const masivo = Math.abs(d) > 10;
      let k = 0;
      while (d > 0) {
        if (instantaneo || masivo) agregarAlNucleo(tipo, null);
        else lanzarNucleon(tipo, k++ * 0.11);
        d--;
      }
      while (d < 0) {
        const ult = st.entrantes.filter((m) => m.tipo === tipo).pop();
        if (ult) {
          st.entrantes.splice(st.entrantes.indexOf(ult), 1);
          if (!instantaneo && t >= ult.sale) { posicion(ult, t, tmp.v); enviarAFuente(tipo, [tmp.v.x, tmp.v.y, tmp.v.z], ult); }
        } else {
          const p = quitarDelNucleo(tipo);
          if (!instantaneo && !masivo && st.salientes.length < MAX_VUELOS) enviarAFuente(tipo, p);
        }
        d++;
      }
    }
    // en pausa, lo que estuviera en vuelo termina ya
    if (quieto) {
      for (const m of st.entrantes) m.alLlegar?.();
      st.entrantes.length = 0;
      st.salientes.length = 0;
      st.fotones.length = 0;
      for (const m of st.electrones) if (!m.llegado) { m.llegado = true; m.fin = Infinity; m.segs = [asentado(m.slot)]; }
    }
    st.iniciado = true;

    // ───── 2. vuelos que terminan ─────
    for (let i = st.entrantes.length - 1; i >= 0; i--) {
      const m = st.entrantes[i];
      if (t >= m.fin) { st.entrantes.splice(i, 1); m.alLlegar?.(); }
    }
    for (let i = st.salientes.length - 1; i >= 0; i--) {
      const m = st.salientes[i];
      if (t >= m.fin) { st.salientes.splice(i, 1); m.alLlegar?.(); }
    }
    for (const m of st.electrones) if (!m.llegado && t >= m.fin) m.alLlegar?.();

    // ───── 3. capas: radio esquemático del estado que YA está montado ─────
    const Zvis = pVisActual();
    const eVis = eAsentados();
    const capas = capasEsquema(Zvis, eVis);
    const rKobj = Zvis > 0 && capas.K.radio !== null ? capas.K.radio : R_FANTASMA_K;
    let rLobj = Zvis > 0 && capas.L.radio !== null ? capas.L.radio : R_FANTASMA_L;
    rLobj = Math.max(rLobj, rKobj + 0.7);
    const kSuave = 1 - Math.exp(-dt / 0.35);
    st.rK += (rKobj - st.rK) * kSuave;
    st.rL += (rLobj - st.rL) * kSuave;
    const rErrante = Math.max(st.rL, 3.2) + 0.9;
    const ligK = Zvis > 0 && capas.K.zEff > 0, ligL = Zvis > 0 && capas.L.zEff > 0;
    for (let k = 0; k < MAX_ELECTRONES; k++) {
      const lig = k < 2 ? ligK : ligL;
      const obj = lig ? (k < 2 ? st.rK : st.rL) : rErrante + 0.35 * Math.sin(0.6 * t + k);
      st.rSlot[k] += (obj - st.rSlot[k]) * (1 - Math.exp(-dt / 0.4));
    }
    st.pulsoK *= Math.exp(-dt / 0.45);
    st.pulsoL *= Math.exp(-dt / 0.45);
    st.pulsoN *= Math.exp(-dt / 0.35);
    const ocK = capas.K.ocupacion, ocL = capas.L.ocupacion;
    const uK = mats.capaK.uniforms, uL = mats.capaL.uniforms;
    uK.uI.value = ocK > 0 && ligK ? 0.45 + 0.25 * (ocK / 2) : 0.08;
    uL.uI.value = ocL > 0 && ligL ? 0.42 + 0.28 * (ocL / 8) : 0.07;
    uK.uPulso.value = st.pulsoK; uL.uPulso.value = st.pulsoL;
    uK.uT.value = t; uL.uT.value = t;
    refK.current?.scale.setScalar(st.rK);
    refL.current?.scale.setScalar(st.rL);

    // ───── 4. núcleo ─────
    const total = Math.min(MAX_NUC, st.tipos.length);
    const rNobj = total > 0 ? Math.min(0.28, (0.34 * st.rK) / radioCumuloUnidad(total)) : 0.28;
    st.rN += (rNobj - st.rN) * (1 - Math.exp(-dt / 0.3));
    const sit = sitiosUnidad(total);
    const kPos = 1 - Math.exp(-dt / 0.13);
    const nivel = P.instability;
    st.expl = nivel >= 3 && total > 0 ? Math.min(1, st.expl + dt * 0.55) : Math.max(0, st.expl - dt * 2);
    const ex = st.expl;
    const temblor = (nivel >= 2 ? 0.16 : nivel >= 1 ? 0.05 : 0) * st.rN * (1 - ex);
    const nuc = refNuc.current;
    if (nuc) {
      for (let i = 0; i < total; i++) {
        const s = sit[i];
        for (let a = 0; a < 3; a++) st.cur[i * 3 + a] += (s[a] * st.rN - st.cur[i * 3 + a]) * kPos;
        const resp = 1 + 0.035 * Math.sin(2.1 * t + i * 1.7) * (quieto ? 0 : 1);
        const k = resp * (1 + ex * 7);
        const jx = temblor * Math.sin(t * 47 + i * 2.3), jy = temblor * Math.sin(t * 53 + i * 1.1), jz = temblor * Math.sin(t * 59 + i * 0.7);
        const x = st.cur[i * 3] * k + jx, y = st.cur[i * 3 + 1] * k + jy, z = st.cur[i * 3 + 2] * k + jz;
        st.vis[i * 3] = x; st.vis[i * 3 + 1] = y; st.vis[i * 3 + 2] = z;
        tmp.m.compose(tmp.v.set(x, y, z), tmp.q.identity(), tmp.s.setScalar(st.rN * (1 - 0.85 * ex)));
        nuc.setMatrixAt(i, tmp.m);
      }
      nuc.count = total;
      nuc.instanceMatrix.needsUpdate = true;
      if (st.versionColores !== st.version) {
        for (let i = 0; i < total; i++) nuc.setColorAt(i, st.tipos[i] === 'p' ? tmp.cP : tmp.cN);
        if (nuc.instanceColor) nuc.instanceColor.needsUpdate = true;
        st.versionColores = st.version;
      }
    }

    // ───── 5. todo lo que brilla ─────
    const B = brillos;
    B.n = 0;
    const cam = state.camera as THREE.PerspectiveCamera;
    gl.getDrawingBufferSize(tmp.d2);
    mats.brillo.uniforms.uPx.value = tmp.d2.y / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    const rCumulo = total > 0 ? radioCumuloUnidad(total) * st.rN : 0;

    // halo del núcleo (detrás de los nucleones: la prueba de profundidad recorta su centro)
    if (total > 0) {
      const parpadeo = nivel >= 2 ? 0.14 + 0.12 * Math.abs(Math.sin(t * 23)) : nivel >= 1 ? 0.04 : 0;
      B.poner(0, 0, 0, nivel >= 2 ? tmp.cChispa : tmp.cNuc, 1.0 + 1.6 * st.pulsoN, rCumulo * 4.2 + 0.4, (0.16 + parpadeo + 0.3 * st.pulsoN) * (1 - ex));
    }

    // electrones (cabeza + estela larga que es su propio pasado)
    const M = alta ? 84 : 36;
    const VENT = 1.5;
    const dibujarE = (m: Movil, atenuar: number) => {
      if (t < m.sale - 1e-6) return;
      const k = m.slot;
      const lig = k < 2 ? ligK : ligL;
      const a0 = (m.llegado && !lig ? 0.35 : 1) * atenuar;
      posicion(m, t, tmp.v);
      B.ponerV(tmp.v, tmp.cE, 3.2, 0.3, a0);
      B.ponerV(tmp.v, tmp.cE, 1.0, 1.05, 0.22 * a0);
      const tint = k < 2 ? tmp.cK : tmp.cL;
      for (let j = 1; j < M; j++) {
        const tj = t - (j / M) * VENT;
        if (tj < m.sale) break;
        posicion(m, tj, tmp.w);
        const s = j / M;
        tmp.c.copy(tmp.cE).lerp(tint, Math.min(1, s * 1.3));
        B.poner(tmp.w.x, tmp.w.y, tmp.w.z, tmp.c, 1.8 * (1 - s) + 0.5, 0.15 * (1 - s) + 0.12, a0 * Math.pow(1 - s, 1.5) * 0.8);
      }
    };
    for (const m of st.electrones) if (m) dibujarE(m, 1);
    for (const m of st.salientes) if (m.tipo === 'e') dibujarE(m, Math.min(1, (m.fin - t) / 0.3));

    // nucleones en vuelo: malla + estela
    const vuelos = refVuelos.current;
    let nv = 0;
    const dibujarN = (m: Movil) => {
      if (m.tipo === 'e' || t < m.sale - 1e-6) return;
      posicion(m, t, tmp.v);
      const col = m.tipo === 'p' ? tmp.cP : tmp.cN;
      const nace = clamp01((t - m.sale) / 0.15);
      if (vuelos && nv < MAX_VUELOS) {
        tmp.m.compose(tmp.v, tmp.q.identity(), tmp.s.setScalar(st.rN * (0.4 + 0.6 * nace)));
        vuelos.setMatrixAt(nv, tmp.m);
        vuelos.setColorAt(nv, col);
        nv++;
      }
      B.ponerV(tmp.v, col, 1.6, 0.9, 0.2);
      for (let j = 1; j < 18; j++) {
        const tj = t - j * 0.022;
        if (tj < m.sale) break;
        posicion(m, tj, tmp.w);
        const s = j / 18;
        B.poner(tmp.w.x, tmp.w.y, tmp.w.z, col, 2.2, 0.2 * (1 - s) + 0.05, 0.7 * (1 - s));
      }
    };
    st.entrantes.forEach(dibujarN);
    st.salientes.forEach(dibujarN);
    if (vuelos) {
      vuelos.count = nv;
      vuelos.instanceMatrix.needsUpdate = true;
      if (vuelos.instanceColor) vuelos.instanceColor.needsUpdate = true;
    }

    // fotones: paquete de ondas que sale disparado (ondulación esquemática ∝ λ)
    tmp.u.copy(cam.position);
    for (let i = st.fotones.length - 1; i >= 0; i--) {
      const f = st.fotones[i];
      const edad = st.tReal - f.t0;
      if (edad > f.vida) { st.fotones.splice(i, 1); continue; }
      const v = 4.6;
      const hx = f.o[0] + f.d[0] * v * edad, hy = f.o[1] + f.d[1] * v * edad, hz = f.o[2] + f.d[2] * v * edad;
      // perpendicular a la dirección y a la visual: la onda se ve de canto
      tmp.w.set(hx - tmp.u.x, hy - tmp.u.y, hz - tmp.u.z);
      tmp.v.set(f.d[0], f.d[1], f.d[2]).cross(tmp.w).normalize();
      const lv = Math.min(1.3, Math.max(0.24, 0.3 * Math.pow(f.lam / 91, 0.45)));
      const L = Math.max(1.5, 2.6 * lv);
      const desv = 1 - clamp01((edad - (f.vida - 0.45)) / 0.45);
      const n = alta ? 64 : 32;
      for (let j = 0; j < n; j++) {
        const s = (j / (n - 1)) * L;
        const env = Math.pow(Math.sin((Math.PI * s) / L), 1.3);
        const a = 0.15 * env * Math.sin((2 * Math.PI * s) / lv - edad * 9);
        B.poner(hx - f.d[0] * s + tmp.v.x * a, hy - f.d[1] * s + tmp.v.y * a, hz - f.d[2] * s + tmp.v.z * a, f.col, 2.8, 0.12, env * desv);
      }
      B.poner(hx, hy, hz, f.col, 2.4, 0.55, 0.45 * desv);
      if (st.rotulo?.foton === f) st.rotulo.ancla.set(hx, hy, hz);
    }

    // destellos
    for (let i = st.destellos.length - 1; i >= 0; i--) {
      const d = st.destellos[i];
      const u = (st.tReal - d.t0) / d.vida;
      if (u >= 1) { st.destellos.splice(i, 1); continue; }
      B.poner(d.x, d.y, d.z, d.col, 3.0, d.tam * (0.5 + u), Math.pow(1 - u, 2) * 0.9);
    }

    // chispas del núcleo inestable
    if (total > 0 && nivel >= 1 && !quieto) {
      const tasa = nivel >= 3 ? (ex < 0.6 ? 120 : 0) : nivel >= 2 ? 38 : 4;
      st.acumChispa += tasa * dt;
      while (st.acumChispa >= 1 && st.chispas.length < 220) {
        st.acumChispa -= 1;
        const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
        const dx = Math.sin(ph) * Math.cos(th), dy = Math.cos(ph), dz = Math.sin(ph) * Math.sin(th);
        const sp = 1.2 + rnd() * 2.6 * (nivel >= 3 ? 2 : 1);
        st.chispas.push({ t0: st.tReal, x: dx * rCumulo, y: dy * rCumulo, z: dz * rCumulo, vx: dx * sp, vy: dy * sp + 0.3, vz: dz * sp, vida: 0.5 + rnd() * 0.55 });
      }
    }
    for (let i = st.chispas.length - 1; i >= 0; i--) {
      const c = st.chispas[i];
      const e = st.tReal - c.t0;
      if (e > c.vida) { st.chispas.splice(i, 1); continue; }
      const u = e / c.vida;
      B.poner(c.x + c.vx * e, c.y + c.vy * e, c.z + c.vz * e, tmp.cChispa, 3.6, 0.15, (1 - u) * 0.95);
      for (let j = 1; j <= 3; j++) {
        const ej = Math.max(0, e - j * 0.025);
        B.poner(c.x + c.vx * ej, c.y + c.vy * ej, c.z + c.vz * ej, tmp.cChispa, 2.4, 0.11 - j * 0.02, (1 - u) * (0.6 - j * 0.15));
      }
    }

    // partículas de las fuentes (decorativas: no cuentan nada)
    const nCap = alta ? 22 : 12;
    for (const tipo of ['p', 'n'] as const) {
      const f = fuente(tipo, xFRef.current);
      const col = tipo === 'p' ? tmp.cP : tmp.cN;
      for (let j = 0; j < nCap; j++) {
        const fr = ((j * 0.618034) % 1);
        const a = j * 2.39996 + t * (0.5 + 0.5 * fr) * (j % 2 ? 1 : -1);
        const h = ((j / nCap + t * (0.04 + 0.05 * fr)) % 1);
        const r = R_CAP * (0.25 + 0.5 * fr);
        B.poner(f[0] + r * Math.cos(a), f[1] + 0.55 + h * (H_CAP - 0.75), f[2] + r * Math.sin(a), col, tipo === 'p' ? 2.4 : 1.7, 0.16, 0.85);
      }
    }
    const nAn = alta ? 46 : 24;
    for (let j = 0; j < nAn; j++) {
      const fr = (j * 0.618034) % 1;
      const a = (j / nAn) * Math.PI * 2 + t * (0.55 + 0.25 * fr);
      const tub = 0.05 * Math.sin(j * 1.7 + t * 3);
      B.poner((R_ANILLO + tub) * Math.cos(a), Y_ANILLO + 0.04 * Math.cos(j + t * 2.3), (R_ANILLO + tub) * Math.sin(a), tmp.cE, 2.6, 0.12, 0.9);
    }
    // motas que suben por el cono del plinto
    const nMot = alta ? 34 : 16;
    for (let j = 0; j < nMot; j++) {
      const fr = (j * 0.618034) % 1;
      const h = (fr + t * (0.07 + 0.05 * ((j * 0.37) % 1))) % 1;
      const y = Y_SUELO + H_PLINTO + h * (Y_CONO - Y_SUELO - H_PLINTO);
      const r = (0.2 + 0.65 * ((j * 0.731) % 1)) * (1.1 + 0.9 * h);
      const a = j * 2.39996 + t * 0.2;
      B.poner(r * Math.cos(a), y, r * Math.sin(a), tmp.cMota, 1.6, 0.07, 0.6 * (1 - h) * Math.min(1, h * 6));
    }

    B.terminar();

    // ───── 6. uniformes del escenario ─────
    mats.vidrio.uniforms.uT.value = t;
    mats.cono.uniforms.uT.value = t;
    mats.cono.uniforms.uI.value = 1 + 0.6 * st.pulsoN;
    mats.suelo.uniforms.uT.value = t;
    mats.suelo.uniforms.uPulso.value = st.pulsoN;
    mats.suelo.uniforms.uFp.value.set(-xFRef.current, Z_FUENTE);
    mats.suelo.uniforms.uFn.value.set(xFRef.current, Z_FUENTE);

    // ───── 7. rótulo del fotón / ionización (DOM proyectado) ─────
    const el = rotuloFoton?.current;
    if (el) {
      const r = st.rotulo;
      const edad = r ? st.tReal - r.t0 : Infinity;
      if (!r || edad > r.vida) {
        if (el.style.opacity !== '0') el.style.opacity = '0';
        if (r) st.rotulo = null;
      } else {
        if (st.textoRotulo !== r.texto) { el.textContent = r.texto; el.style.borderColor = r.color; st.textoRotulo = r.texto; }
        tmp.w.copy(r.ancla).project(cam);
        const W = size.width, H = size.height;
        const mitad = Math.min(W / 2 - 6, el.offsetWidth / 2 + 8);
        const x = Math.min(W - mitad, Math.max(mitad, ((tmp.w.x + 1) / 2) * W));
        // fuera de las franjas de los paneles DOM (arriba, la barra y el rótulo; abajo, las cajas)
        const y = Math.min(H * 0.72, Math.max(H * 0.25 + 34, ((1 - tmp.w.y) / 2) * H));
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -150%)`;
        const op = Math.min(1, edad / 0.15) * (1 - clamp01((edad - (r.vida - 0.6)) / 0.6));
        el.style.opacity = op.toFixed(3);
      }
    }
  });

  // para las capturas de prueba: ¿queda algo volando? (sólo en desarrollo)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') return;
    const w = window as unknown as { __qmi01Atomo?: unknown };
    w.__qmi01Atomo = {
      ocupado: () => {
        const st = S.current;
        return st.entrantes.length + st.salientes.length + st.fotones.length + st.electrones.filter((m) => !m.llegado).length;
      },
    };
    return () => { delete w.__qmi01Atomo; };
  }, []);

  // limpia el rótulo al salir del modo
  useEffect(() => () => { const el = rotuloFoton?.current; if (el) el.style.opacity = '0'; }, [rotuloFoton]);

  return (
    <group>
      {/* escenario */}
      <mesh geometry={geoSuelo} material={mats.suelo} renderOrder={-2} />
      <mesh geometry={esc.metal} material={mats.metal} />
      <mesh geometry={esc.aros} material={mats.aros} />
      <mesh geometry={esc.vidrio} material={mats.vidrio} renderOrder={4} />
      <mesh geometry={geoCono} material={mats.cono} renderOrder={3} />
      <Etiqueta texto="p^+" position={[-xF, Y_SUELO + H_CAP + 0.95, Z_FUENTE]} tamano={0.34} color="#ffc2b8" fondo="rgba(9,17,27,0.55)" peso={700} />
      <Etiqueta texto="n" position={[xF, Y_SUELO + H_CAP + 0.95, Z_FUENTE]} tamano={0.34} color="#dfe6ef" fondo="rgba(9,17,27,0.55)" peso={700} />
      <Etiqueta texto="e^−" position={[R_ANILLO * 0.82 + 0.5, Y_ANILLO + 0.5, R_ANILLO * 0.62]} tamano={0.32} color="#ffe6ad" fondo="rgba(9,17,27,0.55)" peso={700} />
      {/* núcleo y nucleones en vuelo */}
      <instancedMesh ref={refNuc} args={[geoNucleon, mats.nucleon, MAX_NUC]} frustumCulled={false} />
      <instancedMesh ref={refVuelos} args={[geoNucleon, mats.nucleon, MAX_VUELOS]} frustumCulled={false} />
      {/* capas K y L */}
      <mesh ref={refK} geometry={geoCapa} material={mats.capaK} renderOrder={5} />
      <mesh ref={refL} geometry={geoCapa} material={mats.capaL} renderOrder={6} />
      {/* todo lo que brilla */}
      <points geometry={brillos.geo} material={mats.brillo} frustumCulled={false} renderOrder={8} />
    </group>
  );
}

