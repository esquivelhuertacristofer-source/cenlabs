'use client';
/**
 * bio07/banco3d.tsx — EL BANCO DE LA NEURONA en 3D: motoneurona α (soma con su núcleo y su
 * árbol dendrítico), cono axónico, axón con sus vainas de mielina y nodos de Ranvier,
 * terminal con botones sobre una fibra muscular estriada (placa motora), iones Na⁺/K⁺
 * en los nodos y dos micropipetas de vidrio (A en el soma, B en un nodo).
 *
 * TODO el color sale del cable HH del reloj (`RelojBanco`) en el mismo cuadro: el perfil
 * de V a lo largo del axón se escribe en una textura 1D; el soma y las dendritas toman
 * V del soma; los botones, V del terminal. Los iones avanzan con la carga que de verdad
 * cruzó la membrana de ese nodo (q_Na, q_K del modelo).
 *
 * Esquema no a escala: el grosor de la fibra está exagerado unas 30 veces respecto a
 * su longitud (10 mm de axón; el internodo mide 100·D).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { CONO, NODO, AXON, TERMINAL, HH, type Cable } from './neuro';
import { DUR_ESTIMULO, LARGO_BANCO } from './banco';
import { formaPA, muestraPA } from './arco';
import type { RelojBanco } from './reloj';
import {
  materialMembrana, materialMielina, materialTejido, materialVidrio, materialBrillo, nuevoPerfil, N_PERFIL, vNorm,
  fijarVMembrana, texturaEstriada, azar,
} from './materiales';
import { tuboVariable, fibraMielinica, arbolDendritico, geoSoma, conAtributos, type V3, v3 } from './geometria';
import { Rotulos, type Rotulo } from './rotulos';

// ───────────────────────────── composición ─────────────────────────────

export const SOMA_C: V3 = [-3.0, 1.45, 0];
export const R_SOMA = 0.6;
const DIR_AXON = new THREE.Vector3(0.88, -0.47, 0).normalize();
const PUNTOS_AXON: V3[] = [
  [-2.78, 1.33, 0], [-1.95, 0.98, 0.05], [-0.8, 0.86, 0.12], [0.5, 0.78, 0.08], [1.85, 0.52, 0.0],
  [2.95, -0.05, -0.05], [3.2, -0.85, 0.0], [2.65, -1.45, 0.05], [1.8, -1.66, 0.05],
];
/** Fibra muscular: eje x de X0 a X1 a la altura Y; la placa motora en XP. */
export const MUSCULO = { x0: -0.6, x1: 4.1, y: -2.45, r: 0.36, xP: 1.25, largoReal: 3 /* mm */, v: 2 /* m/s */ };
/** fracción de la curva del axón que ocupan el cono axónico y el segmento inicial */
const U_CONO = 0.06;
/** Retardo de la placa (ms) entre la llegada del PA al terminal y el PA muscular (el del dominio). */
export const RETARDO_PLACA = 0.8;

/** Radio dibujado de la fibra (unidades de escena) para un diámetro D (µm). */
export const radioDibujo = (D: number) => 0.06 + 0.0125 * D;

const CURVA_AXON = new THREE.CatmullRomCurve3(PUNTOS_AXON.map(v3), false, 'centripetal', 0.5);

// ───────────────────────────── geometría dependiente de la fibra ─────────────────────────────

export interface GeoFibra {
  /** el cable para el que se construyó (si el reloj ya cambió de fibra, no se usa) */
  cable: Cable;
  axon: THREE.BufferGeometry;
  cono: THREE.BufferGeometry;
  vainas: THREE.BufferGeometry | null;
  /** núcleos de las células de Schwann (una por internodo): matrices */
  schwann: THREE.Matrix4[];
  terminal: THREE.BufferGeometry;
  botones: THREE.Vector3[];
  rAx: number; rMy: number;
  /** muestreo del perfil: para cada muestra, compartimentos y peso de la interpolación */
  k0: Int32Array; k1: Int32Array; w: Float32Array;
  /** compartimento activo más cercano a cada muestra */
  kAct: Int32Array;
  /** u de la curva de cada compartimento activo (nodos o membrana) */
  uComp: Float32Array;
  /** sitios de iones */
  sitios: SitioIon[];
  /** punto y dirección de la pipeta B */
  puntaB: THREE.Vector3; normalB: THREE.Vector3;
  uB: number;
}

export interface SitioIon { i: number; P: THREE.Vector3; T: THREE.Vector3; N: THREE.Vector3; B: THREE.Vector3; rIn: number; rOut: number; span: number }

/** x (mm del modelo) → u de la curva dibujada, y su inversa. */
function mapeo(c: Cable) {
  const act = c.nodos;
  const xa = c.x[act[0]], xb = c.x[act[act.length - 1]];
  const conoFin = 0.04;
  const largo = CURVA_AXON.getLength();
  const tipoAmi = c.param.tipo === 'amielinica';
  // hueco dibujado del nodo (exagerado: el nodo real mide 1 µm), sin pasar del 30 % del internodo
  const espaciado = largo / Math.max(1, act.length - 1);
  const hueco = tipoAmi ? 0 : Math.min(Math.max(0.11, radioDibujo(c.param.D) * 1.15), 0.3 * espaciado) / largo;
  const ua = U_CONO + hueco / 2, ub = 1 - hueco / 2;
  const uDeX = (x: number) => {
    if (x <= conoFin) return Math.max(0, (x / conoFin) * U_CONO);
    if (x <= xa) return U_CONO + ((x - conoFin) / Math.max(1e-9, xa - conoFin)) * (ua - U_CONO);
    return ua + ((x - xa) / (xb - xa)) * (ub - ua);
  };
  const xDeU = (u: number) => {
    if (u <= U_CONO) return (u / U_CONO) * conoFin;
    if (u <= ua) return conoFin + ((u - U_CONO) / Math.max(1e-9, ua - U_CONO)) * (xa - conoFin);
    return xa + ((u - ua) / (ub - ua)) * (xb - xa);
  };
  return { uDeX, xDeU, hueco };
}

function marco(u: number) {
  const P = CURVA_AXON.getPointAt(u);
  const T = CURVA_AXON.getTangentAt(u).normalize();
  const ref = Math.abs(T.z) < 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0);
  const B = new THREE.Vector3().crossVectors(T, ref).normalize();
  const N = new THREE.Vector3().crossVectors(B, T).normalize();
  return { P, T, N, B };
}

export function construirFibra(c: Cable): GeoFibra {
  const { tipo, D } = c.param;
  const R = radioDibujo(D);
  const mielinica = tipo !== 'amielinica';
  const rAx = mielinica ? R * 0.7 : R;
  const rMyCompleta = R;
  const rMy = tipo === 'desmielinizada' ? rAx + (rMyCompleta - rAx) / 3 : rMyCompleta;
  const { uDeX, xDeU, hueco } = mapeo(c);
  const largo = CURVA_AXON.getLength();

  // nodos de Ranvier (u en la curva)
  const nodosU: number[] = [];
  if (mielinica) for (const i of c.nodos) nodosU.push(uDeX(c.x[i]));

  // cono axónico + segmento inicial: del interior del soma al primer nodo, adelgazando
  const rCono0 = Math.max(rAx * 2.4, 0.3);
  const cono = tuboVariable(CURVA_AXON, (u) => {
    const s = Math.min(1, u / U_CONO);
    return rAx + (rCono0 - rAx) * Math.pow(1 - s, 2.2);
  }, { u0: 0, u1: U_CONO + hueco * 0.5, segs: 26, radial: 18, perfil: [0, U_CONO + hueco * 0.5] });

  const fibra = fibraMielinica(CURVA_AXON, {
    rAx, rMy, nodos: nodosU, hueco, mielina: mielinica, u0: U_CONO + hueco * 0.25, u1: 1, segsPorU: Math.round(largo / Math.max(0.012, rAx * 0.45)),
    radial: 14,
  });

  // núcleos de Schwann: uno por internodo, a media vaina, alternando de lado
  const schwann: THREE.Matrix4[] = [];
  if (mielinica) {
    const lim = [U_CONO, ...nodosU, 1];
    for (let k = 1; k < lim.length - 1; k++) {
      const a = lim[k], b = lim[k + 1];
      if (b - a < hueco * 2) continue;
      const u = (a + b) / 2;
      const { P, T, N, B } = marco(u);
      const ang = (k % 2 ? 0.9 : -0.9) + (k % 3) * 0.4;
      const radial = N.clone().multiplyScalar(Math.cos(ang)).addScaledVector(B, Math.sin(ang));
      const pos = P.clone().addScaledVector(radial, rMy * 0.97);
      const L = Math.min((b - a) * largo * 0.32, 0.36);
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(T, radial, new THREE.Vector3().crossVectors(T, radial)));
      m.compose(pos, q, new THREE.Vector3(L / 2, rMy * 0.16, rMy * 0.42));
      schwann.push(m);
    }
  }

  // terminal: del último nodo a la placa, y tres ramas con sus botones sobre la fibra muscular
  const fin = CURVA_AXON.getPointAt(1);
  const yTop = MUSCULO.y + MUSCULO.r;
  const centroPlaca = new THREE.Vector3(MUSCULO.xP, yTop + 0.02, 0.05);
  const tronco = new THREE.CatmullRomCurve3([
    fin, fin.clone().add(new THREE.Vector3(-0.28, -0.05, 0)), new THREE.Vector3(MUSCULO.xP + 0.2, yTop + 0.22, 0.04), centroPlaca.clone().add(new THREE.Vector3(0, 0.08, 0)),
  ], false, 'centripetal');
  const rT = Math.max(0.035, rAx * 0.75);
  const partes: THREE.BufferGeometry[] = [tuboVariable(tronco, (u) => rT * (1 - 0.35 * u), { segs: 30, radial: 12, perfil: [1, 1] })];
  const botones: THREE.Vector3[] = [];
  const ramas: [number, number][] = [[-0.42, 0.12], [0.36, 0.2], [0.05, -0.28]];
  for (const [dx, dz] of ramas) {
    // la rama corre pegada a la superficie del cilindro (y = √(r² − z²))
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 6; k++) {
      const s = k / 6;
      const x = MUSCULO.xP + dx * s, z = 0.05 + dz * s;
      const y = MUSCULO.y + Math.sqrt(Math.max(0, MUSCULO.r ** 2 - z * z)) + 0.035 + 0.05 * (1 - s);
      pts.push(new THREE.Vector3(x, y, z));
    }
    pts[0].copy(centroPlaca).add(new THREE.Vector3(0, 0.07, 0));
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    partes.push(tuboVariable(curva, (u) => rT * 0.62 * (1 - 0.3 * u), { segs: 18, radial: 10, perfil: [1, 1], tapaFin: true }));
    botones.push(pts[pts.length - 1].clone());
  }
  const terminal = partes.length === 1 ? partes[0] : (() => {
    const g = new THREE.BufferGeometry();
    // unir (todas traen los mismos atributos)
    return mergeSimple(partes, g);
  })();

  // muestreo del perfil: u → x → compartimentos vecinos (x ordenado)
  const k0 = new Int32Array(N_PERFIL), k1 = new Int32Array(N_PERFIL), w = new Float32Array(N_PERFIL);
  const xs = c.x;
  for (let s = 0; s < N_PERFIL; s++) {
    const u = s / (N_PERFIL - 1);
    const x = xDeU(u);
    let j = 1;
    while (j < c.n - 1 && xs[j] < x) j++;
    const a = Math.max(0, j - 1), b = j;
    k0[s] = a; k1[s] = b;
    w[s] = xs[b] === xs[a] ? 0 : Math.min(1, Math.max(0, (x - xs[a]) / (xs[b] - xs[a])));
  }
  const uComp = new Float32Array(c.n);
  for (let i = 0; i < c.n; i++) uComp[i] = c.tipo[i] === TERMINAL ? 1 : uDeX(Math.max(0, c.x[i]));

  // sitios de iones: cada nodo (mielínica) o ~36 puntos de la membrana continua
  const sitios: SitioIon[] = [];
  const activos = c.nodos.filter((i) => c.tipo[i] === NODO || c.tipo[i] === AXON);
  const paso = mielinica ? 1 : Math.max(1, Math.floor(activos.length / 36));
  for (let k = 0; k < activos.length; k += paso) {
    const i = activos[k];
    const u = uComp[i];
    if (u < U_CONO || u > 0.995) continue;
    const { P, T, N, B } = marco(u);
    sitios.push({ i, P, T, N, B, rIn: rAx * 0.8, rOut: (mielinica ? rMy : rAx) * 1.28 + 0.03, span: mielinica ? hueco * largo * 1.1 : (paso * (xs[activos[1]] - xs[activos[0]]) / (xs[activos[activos.length - 1]] - xs[activos[0]])) * largo * 0.9 });
  }
  // el cono axónico también abre canales (densidad de nodo): un sitio
  const iCono = (() => { for (let i = 0; i < c.n; i++) if (c.tipo[i] === CONO) return i; return -1; })();
  if (iCono >= 0) {
    const { P, T, N, B } = marco(U_CONO * 0.75);
    sitios.unshift({ i: iCono + 2, P, T, N, B, rIn: rAx, rOut: rAx * 1.9 + 0.04, span: 0.18 });
  }

  // pipeta B: en el compartimento que registra el banco (el nodo del 85 %)
  const banco85 = c.nodos.reduce((m, i) => (Math.abs(c.x[i] - LARGO_BANCO * 0.85) < Math.abs(c.x[m] - LARGO_BANCO * 0.85) ? i : m), c.nodos[0]);
  const uB = uComp[banco85];
  const mB = marco(uB);
  // por delante (z+) y hacia fuera de la curva (abajo a la derecha)
  const fuera = mB.B.clone();
  if (fuera.dot(new THREE.Vector3(1, -1, 0)) < 0) fuera.negate();
  const normalB = fuera.multiplyScalar(0.55).add(new THREE.Vector3(0, 0, 0.83)).normalize();
  const puntaB = mB.P.clone().addScaledVector(normalB, rAx * 1.02);

  // compartimento activo (nodo, cono o membrana) más cercano a cada muestra: de él sale el destello
  const kAct = new Int32Array(N_PERFIL);
  const activosTodos: number[] = [];
  for (let i = 1; i < c.n; i++) if (c.k[i] > 0) activosTodos.push(i);
  for (let s = 0; s < N_PERFIL; s++) {
    const x = xDeU(s / (N_PERFIL - 1));
    let mejor = activosTodos[0], dmin = Infinity;
    for (const i of activosTodos) { const d = Math.abs(xs[i] - x); if (d < dmin) { dmin = d; mejor = i; } }
    kAct[s] = mejor;
  }

  return { cable: c, axon: fibra.axon, cono, vainas: fibra.vainas, schwann, terminal, botones, rAx, rMy, k0, k1, w, kAct, uComp, sitios, puntaB, normalB, uB };
}

/** Une geometrías con los mismos atributos indexadas (sin dependencias). */
function mergeSimple(partes: THREE.BufferGeometry[], g: THREE.BufferGeometry) {
  const nombres = Object.keys(partes[0].attributes);
  let nV = 0, nI = 0;
  for (const p of partes) { nV += p.getAttribute('position').count; nI += p.index ? p.index.count : p.getAttribute('position').count; }
  for (const nom of nombres) {
    const it = partes[0].getAttribute(nom).itemSize;
    const arr = new Float32Array(nV * it);
    let o = 0;
    for (const p of partes) { const a = p.getAttribute(nom).array as Float32Array; arr.set(a, o); o += a.length; }
    g.setAttribute(nom, new THREE.BufferAttribute(arr, it));
  }
  const idx = new Uint32Array(nI);
  let oi = 0, base = 0;
  for (const p of partes) {
    const n = p.getAttribute('position').count;
    if (p.index) { const ix = p.index.array; for (let k = 0; k < ix.length; k++) idx[oi++] = ix[k] + base; }
    else for (let k = 0; k < n; k++) idx[oi++] = k + base;
    base += n;
    p.dispose();
  }
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

// ───────────────────────────── piezas fijas ─────────────────────────────

/** Soma, núcleo y árbol dendrítico (no dependen de la fibra). */
function useGeoSoma() {
  return useMemo(() => {
    const c = v3(SOMA_C);
    const arbol = arbolDendritico(SOMA_C, R_SOMA, { semilla: 11, ramas: 7, largo: 0.95, r0: 0.11, niveles: 2, aplastar: 0.42, excluir: [DIR_AXON.x, DIR_AXON.y, DIR_AXON.z] });
    const lob = [...arbol.bases, DIR_AXON.clone()];
    const soma = geoSoma(R_SOMA, lob, 5, 72);
    const nucleo = new THREE.SphereGeometry(0.24, 40, 28);
    const nucleolo = new THREE.SphereGeometry(0.075, 24, 16);
    return { centro: c, soma, dendritas: arbol.geo, nucleo, nucleolo };
  }, []);
}

/** Fibra muscular estriada con su placa motora y sus núcleos periféricos. */
function useGeoMusculo() {
  return useMemo(() => {
    const curva = new THREE.LineCurve3(new THREE.Vector3(MUSCULO.x0, MUSCULO.y, 0), new THREE.Vector3(MUSCULO.x1, MUSCULO.y, 0));
    const fibra = tuboVariable(curva, (u) => {
      const e = Math.min(u, 1 - u) / 0.06;
      return MUSCULO.r * (e >= 1 ? 1 : 0.55 + 0.45 * Math.sin((Math.PI / 2) * e));
    }, { segs: 120, radial: 36, tapaIni: true, tapaFin: true, uv: true });
    const placa = conAtributos(new THREE.SphereGeometry(1, 36, 18));
    const rnd = azar(21);
    const nucleos: THREE.Matrix4[] = [];
    for (let k = 0; k < 9; k++) {
      const x = MUSCULO.x0 + 0.35 + (k + 0.5) * ((MUSCULO.x1 - MUSCULO.x0 - 0.7) / 9) + (rnd() - 0.5) * 0.2;
      if (Math.abs(x - MUSCULO.xP) < 0.45) continue;
      const a = (rnd() - 0.5) * 2.2 + (k % 2 ? Math.PI : 0) * 0.35;
      const dir = new THREE.Vector3(0, Math.cos(a), Math.sin(a));
      const pos = new THREE.Vector3(x, MUSCULO.y, 0).addScaledVector(dir, MUSCULO.r * 0.97);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      nucleos.push(new THREE.Matrix4().compose(pos, q, new THREE.Vector3(0.13, 0.035, 0.05)));
    }
    return { fibra, placa, nucleos };
  }, []);
}

/**
 * Vecindario del fondo (decorado, sin modelo): otras motoneuronas, un oligodendrocito y
 * fibras de paso, lejos y tenues, para que la neurona registrada no flote en el vacío.
 * Todo en UNA geometría (una llamada de dibujo).
 */
function useGeoVecindario() {
  return useMemo(() => {
    const partes: THREE.BufferGeometry[] = [];
    const mover = (g: THREE.BufferGeometry, m: THREE.Matrix4) => { g.applyMatrix4(m); partes.push(g); };
    const vecinas: { p: V3; s: number; giro: number; semilla: number }[] = [
      { p: [5.8, 3.5, -8], s: 1.0, giro: 2.5, semilla: 31 },
      { p: [-8.8, -3.2, -8], s: 1.15, giro: -0.6, semilla: 47 },
      { p: [9.6, -3.2, -12], s: 1.25, giro: 1.4, semilla: 53 },
      { p: [-10.5, 5.2, -13], s: 1.1, giro: 3.6, semilla: 61 },
    ];
    for (const v of vecinas) {
      const arbol = arbolDendritico([0, 0, 0], 0.55, { semilla: v.semilla, ramas: 6, largo: 1.0, r0: 0.1, niveles: 2, aplastar: 0.5, excluir: [1, 0, 0] });
      const soma = geoSoma(0.55, [...arbol.bases, new THREE.Vector3(1, 0, 0)], v.semilla, 40);
      const rnd = azar(v.semilla + 3);
      const pts: THREE.Vector3[] = [new THREE.Vector3(0.45, 0, 0)];
      for (let i = 1; i <= 6; i++) pts.push(new THREE.Vector3(0.45 + i * 1.3, (rnd() - 0.5) * 0.9, (rnd() - 0.5) * 0.6));
      const axon = conAtributos(tuboVariable(new THREE.CatmullRomCurve3(pts), (u) => 0.09 - 0.03 * u, { segs: 50, radial: 10 }));
      const m = new THREE.Matrix4().compose(v3(v.p), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), v.giro), new THREE.Vector3(v.s, v.s, v.s));
      for (const g of [arbol.geo, soma, axon]) mover(g, m);
    }
    // oligodendrocito: cuerpo pequeño y prolongaciones que abrazan fibras vecinas
    const oli = arbolDendritico([0, 0, 0], 0.22, { semilla: 71, ramas: 5, largo: 0.7, r0: 0.045, niveles: 1, aplastar: 0.6 });
    const oliSoma = geoSoma(0.22, oli.bases, 71, 28);
    const mo = new THREE.Matrix4().compose(new THREE.Vector3(2.6, 3.9, -5.5), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1));
    for (const g of [oli.geo, oliSoma]) mover(g, mo);
    // fibras de paso (mielinizadas, sin detalle)
    const rnd = azar(83);
    const fibras: [V3, V3, number][] = [[[-12, 4.8, -10], [12, 3.4, -11], 0.12], [[-12, -5.4, -7], [12, -4.6, -9], 0.1], [[-13, 7.5, -16], [13, 6.0, -15], 0.14]];
    for (const [a, b, r] of fibras) {
      const pa = v3(a), pb = v3(b);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 8; i++) pts.push(pa.clone().lerp(pb, i / 8).add(new THREE.Vector3(0, (rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.8)));
      // vainas: cuentas alargadas separadas por estrechamientos (nodos)
      partes.push(conAtributos(tuboVariable(new THREE.CatmullRomCurve3(pts), (u) => r * (0.55 + 0.45 * Math.pow(Math.abs(Math.sin(u * Math.PI * 9)), 0.25)), { segs: 220, radial: 12 })));
    }
    return unirGeo(partes);
  }, []);
}

function unirGeo(partes: THREE.BufferGeometry[]) {
  const g = new THREE.BufferGeometry();
  mergeSimple(partes, g);
  return g;
}

/** Micropipeta de vidrio: punta en `punta`, eje hacia `dir` (afuera). */
export function geoPipeta(punta: THREE.Vector3, dir: THREE.Vector3, largo = 4.2) {
  const fin = punta.clone().addScaledVector(dir, largo);
  const curva = new THREE.LineCurve3(punta, fin);
  const rPunta = 0.008, rCaña = 0.1, taper = 1.5 / largo;
  const r = (u: number) => (u >= taper ? rCaña : rPunta + (rCaña - rPunta) * Math.pow(u / taper, 1.6));
  const vidrio = tuboVariable(curva, r, { segs: 80, radial: 24 });
  const solucion = tuboVariable(curva, (u) => Math.max(0.003, r(u) * 0.72), { u0: 0.004, u1: 1, segs: 60, radial: 16 });
  const alambre = tuboVariable(curva, () => 0.011, { u0: taper * 0.9, u1: 1, segs: 20, radial: 8, tapaIni: true });
  return { vidrio, solucion, alambre };
}

// ───────────────────────────── materiales ─────────────────────────────

function useMateriales() {
  return useMemo(() => {
    const perfilAxon = nuevoPerfil();
    const perfilMusculo = nuevoPerfil();
    const est = texturaEstriada();
    return {
      perfilAxon, perfilMusculo,
      axon: materialMembrana({ color: '#6d9fb3', perfil: perfilAxon, ganancia: 1.0 }),
      soma: materialMembrana({ color: '#7fb0c2', perfil: null, ganancia: 0.85, alfa: [0.9, 0.98] }),
      dendritas: materialMembrana({ color: '#76a8bb', perfil: null, ganancia: 0.7 }),
      terminal: materialMembrana({ color: '#7fb0c2', perfil: null, ganancia: 1.0 }),
      mielina: materialMielina(perfilAxon),
      schwann: materialTejido({ color: '#c9b9d6', rugosidad: 0.5, sheen: 0.6, fuerzaBorde: 0.2 }),
      nucleo: materialTejido({ color: '#5b4a86', rugosidad: 0.45, sheen: 0.7, clearcoat: 0.3, fuerzaBorde: 0.25, borde: '#c8b8ff' }),
      nucleolo: materialTejido({ color: '#2c2148', rugosidad: 0.4, sheen: 0.4, fuerzaBorde: 0.1 }),
      musculo: materialMembrana({ color: '#ffffff', perfil: perfilMusculo, mapa: est, ganancia: 0.75, rugosidad: 0.5, caliente: '#ff9d5c' }),
      placa: materialMembrana({ color: '#d98f86', perfil: null, ganancia: 0.9, rugosidad: 0.45 }),
      nucleoMusc: materialTejido({ color: '#5a3f78', rugosidad: 0.45, sheen: 0.5, fuerzaBorde: 0.15 }),
      vidrio: materialVidrio(),
      solucion: materialTejido({ color: '#bfe2ff', rugosidad: 0.2, sheen: 0, clearcoat: 0.4, fuerzaBorde: 0.3, alfa: [0.08, 0.3] }),
      alambre: new THREE.MeshPhysicalMaterial({ color: '#c9ced6', metalness: 1, roughness: 0.3, envMapIntensity: 1.1 }),
      na: materialBrillo('#ffd34d', 2.4),
      k: materialBrillo('#b48cff', 2.4),
      vesicula: materialBrillo('#9ff3d9', 1.6),
      chispa: materialBrillo('#9fe8ff', 3.2),
      vecino: materialTejido({ color: '#172c3a', rugosidad: 0.7, sheen: 0.25, clearcoat: 0, fuerzaBorde: 0.3, potenciaBorde: 2.2, borde: '#4f93b5' }),
    };
  }, []);
}

// ───────────────────────────── el banco ─────────────────────────────

/** Nombre de la pieza bajo el puntero (rótulo al pasar el ratón). */
export type AlPasar = (nombre: string | null, e?: ThreeEvent<PointerEvent>) => void;

const N_NA = 10, N_K = 7;
/**
 * Destello de un compartimento activo a partir de SU cruce del umbral (−20 mV, del modelo):
 * sube mientras V se acerca al umbral y decae 50 µs después de cruzarlo. Así el destello
 * marca el nodo que está disparando y se le ve saltar al siguiente (≈ 41 µs por internodo).
 */
export function destelloCruce(t: number, tCruce: number, V: number, subiendo: boolean) {
  if (tCruce > 0 && t >= tCruce) return Math.exp(-(t - tCruce) / 0.05);
  if (!subiendo) return 0;
  const r = Math.min(1, Math.max(0, (V + 50) / 30));
  return r * r;
}
const forma = () => formaPA();

export function BancoNeurona3D({ reloj, alPasar, rotulos, onPuntaB }: {
  reloj: RelojBanco; alPasar?: AlPasar; rotulos?: boolean; onPuntaB?: (p: THREE.Vector3) => void;
}) {
  const mats = useMateriales();
  const gs = useGeoSoma();
  const gm = useGeoMusculo();
  const gv = useGeoVecindario();
  const version = reloj.banco.versionFibra;
  const gf = useMemo(() => construirFibra(reloj.banco.cable), [reloj, version]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => {
    gf.axon.dispose(); gf.cono.dispose(); gf.vainas?.dispose(); gf.terminal.dispose();
  }, [gf]);
  useEffect(() => { onPuntaB?.(gf.puntaB.clone()); }, [gf, onPuntaB]);
  const tipo = reloj.banco.cfg.tipo;
  const listaRotulos = useMemo(() => rotulosBanco(gf, tipo), [gf, tipo]);

  // pipetas: A sobre el soma (arriba a la derecha), B en el nodo del 85 %
  const pipA = useMemo(() => {
    const d = new THREE.Vector3(0.5, 0.78, 0.38).normalize();
    const punta = v3(SOMA_C).addScaledVector(d, R_SOMA * 0.985);
    return { ...geoPipeta(punta, new THREE.Vector3(0.36, 1, 0.5).normalize()), punta };
  }, []);
  const pipB = useMemo(() => {
    const dir = gf.normalB.clone().multiplyScalar(0.5).add(new THREE.Vector3(0.85, 0.12, 0.35)).normalize();
    return { ...geoPipeta(gf.puntaB, dir), punta: gf.puntaB };
  }, [gf]);
  useEffect(() => () => { for (const g of [pipB.vidrio, pipB.solucion, pipB.alambre]) g.dispose(); }, [pipB]);

  // iones (instanciados): Na⁺ fuera de cada nodo; K⁺ salen
  const naRef = useRef<THREE.InstancedMesh>(null);
  const kRef = useRef<THREE.InstancedMesh>(null);
  const vesRef = useRef<THREE.InstancedMesh>(null);
  const chispa = useRef<THREE.Mesh>(null);
  const ionGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const iones = useMemo(() => {
    const rnd = azar(3 + version);
    const na = gf.sitios.flatMap((s, si) => Array.from({ length: N_NA }, (_, j) => ({
      s: si, ang: ((j + rnd() * 0.8) / N_NA) * Math.PI * 2, ax: (rnd() - 0.5) * s.span, r: s.rOut * (1 + 0.18 * rnd()), um: (j + 0.5) / N_NA * 0.75 + rnd() * 0.12, fase: rnd() * 6.28,
    })));
    const k = gf.sitios.flatMap((s, si) => Array.from({ length: N_K }, (_, j) => ({
      s: si, ang: ((j + rnd()) / N_K) * Math.PI * 2 + 0.3, ax: (rnd() - 0.5) * s.span, r: s.rOut * (1.02 + 0.2 * rnd()), um: (j + 0.5) / N_K * 0.7 + rnd() * 0.15, fase: rnd() * 6.28,
    })));
    return { na, k, escNa: new Float32Array(na.length).fill(1), escK: new Float32Array(k.length), posNa: na.map(() => new THREE.Vector3()), posK: k.map(() => new THREE.Vector3()), listo: false };
  }, [gf, version]);
  const vesiculas = useMemo(() => {
    const rnd = azar(9);
    return gf.botones.flatMap((b, bi) => Array.from({ length: 7 }, (_, j) => ({
      b: bi, off: new THREE.Vector3((rnd() - 0.5) * 0.08, 0.02 + rnd() * 0.05, (rnd() - 0.5) * 0.08), retardo: 0.12 + 0.05 * j + rnd() * 0.04, esc: 0.018,
    })));
  }, [gf]);

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3(), r: new THREE.Vector3() }), []);
  const tPared = useRef(0);

  useFrame((_, dtPared) => {
    tPared.current += dtPared;
    const b = reloj.banco, c = b.cable;
    if (gf.cable !== c) return; // la fibra cambió y React aún no ha rehecho la geometría
    const F = forma();
    // ── perfil del axón: R = V, G = subida (frente)
    const datos = mats.perfilAxon.image.data as Uint8Array;
    const Vp = reloj.Vprev, dtM = Math.max(1e-6, reloj.dtCuadro);
    for (let s = 0; s < N_PERFIL; s++) {
      const a = gf.k0[s], bb = gf.k1[s], w = gf.w[s];
      const V = c.V[a] + (c.V[bb] - c.V[a]) * w;
      const ka = gf.kAct[s];
      const sub = destelloCruce(c.t, c.tCruce[ka], c.V[ka], c.V[ka] > Vp[ka]);
      datos[4 * s] = Math.round(vNorm(V) * 255);
      datos[4 * s + 1] = Math.round(sub * 255);
    }
    mats.perfilAxon.needsUpdate = true;
    // ── soma, dendritas y terminal
    const dVs = reloj.dtCuadro > 0 ? (c.V[0] - Vp[0]) / dtM : 0;
    fijarVMembrana(mats.soma, c.V[0], destelloCruce(c.t, c.tCruce[0], c.V[0], dVs > 0) * 0.55);
    fijarVMembrana(mats.dendritas, HH.Vreposo + (c.V[0] - HH.Vreposo) * 0.85, 0);
    const iT = c.n - 1;
    const dVt = reloj.dtCuadro > 0 ? (c.V[iT] - Vp[iT]) / dtM : 0;
    fijarVMembrana(mats.terminal, c.V[iT], destelloCruce(c.t, c.tCruce[iT], c.V[iT], dVt > 0));
    // ── placa motora y fibra muscular: PEP y PA muscular que se propaga desde la placa
    const tB = b.t0Barrido >= 0 ? c.t : -1;
    const tLlega = b.llegadaTerminal;
    const datosM = mats.perfilMusculo.image.data as Uint8Array;
    const L = MUSCULO.x1 - MUSCULO.x0;
    const uP = (MUSCULO.xP - MUSCULO.x0) / L;
    let Vplaca: number = HH.Vreposo;
    for (let s = 0; s < N_PERFIL; s++) {
      const u = s / (N_PERFIL - 1);
      const dist = Math.abs(u - uP) * MUSCULO.largoReal; // mm
      let V: number = HH.Vreposo, sub = 0;
      if (tLlega > 0 && tB >= 0) {
        const tEP = tLlega + RETARDO_PLACA;
        // potencial de placa: sube desde la liberación y decae con la distancia (λ ≈ 0,5 mm)
        const pep = 32 * Math.min(1, Math.max(0, (tB - tLlega - 0.25) / (RETARDO_PLACA - 0.25))) * Math.exp(-dist / 0.5);
        const tau = (tB - tEP - dist / MUSCULO.v) / 1.8; // el PA muscular dura ≈ 1,8 veces el del nodo
        const pa = muestraPA(F, tau);
        V = tau > F.tau0 ? Math.max(pa.V, HH.Vreposo + pep * (tau < 0.3 ? 1 : 0)) : HH.Vreposo + pep;
        const pa2 = muestraPA(F, tau - 0.01);
        sub = tau >= 0 ? Math.exp(-tau / 0.05) : pa.V > pa2.V ? Math.min(1, Math.max(0, (pa.V + 50) / 30)) ** 2 : 0;
        if (s === Math.round(uP * (N_PERFIL - 1))) Vplaca = V;
      }
      datosM[4 * s] = Math.round(vNorm(V) * 255);
      datosM[4 * s + 1] = Math.round(sub * 0.8 * 255);
    }
    mats.perfilMusculo.needsUpdate = true;
    fijarVMembrana(mats.placa, Vplaca, 0);

    // ── iones
    const k = 1 - Math.exp(-dtPared * 10);
    const w = tPared.current;
    const na = naRef.current, kk = kRef.current;
    if (na && kk) {
      const s0 = 0.016 + 0.0012 * c.param.D;
      for (let j = 0; j < iones.na.length; j++) {
        const io = iones.na[j], st = gf.sitios[io.s];
        const f = Math.min(1, c.qNa[st.i] / Math.max(1e-12, b.qRef[st.i]));
        const p = Math.min(1, Math.max(0, (f - io.um) / 0.25));
        const r = io.r + (st.rIn * 0.5 - io.r) * p;
        const ang = io.ang + 0.15 * Math.sin(w * 0.7 + io.fase);
        tmp.r.copy(st.N).multiplyScalar(Math.cos(ang)).addScaledVector(st.B, Math.sin(ang));
        tmp.p.copy(st.P).addScaledVector(tmp.r, r).addScaledVector(st.T, io.ax * (1 - 0.6 * p) + 0.012 * Math.sin(w * 1.3 + io.fase));
        const esc = s0 * (1 - Math.min(1, Math.max(0, (p - 0.65) / 0.35)));
        if (!iones.listo) { iones.posNa[j].copy(tmp.p); iones.escNa[j] = esc; }
        iones.posNa[j].lerp(tmp.p, k);
        iones.escNa[j] += (esc - iones.escNa[j]) * k;
        tmp.s.setScalar(Math.max(1e-5, iones.escNa[j]));
        tmp.m.compose(iones.posNa[j], tmp.q.identity(), tmp.s);
        na.setMatrixAt(j, tmp.m);
      }
      for (let j = 0; j < iones.k.length; j++) {
        const io = iones.k[j], st = gf.sitios[io.s];
        const f = Math.min(1, b.qK[st.i] / Math.max(1e-12, b.qRef[st.i]));
        const p = Math.min(1, Math.max(0, (f - io.um) / 0.25));
        const r = st.rIn + (io.r - st.rIn) * p;
        const ang = io.ang + 0.12 * Math.sin(w * 0.6 + io.fase);
        tmp.r.copy(st.N).multiplyScalar(Math.cos(ang)).addScaledVector(st.B, Math.sin(ang));
        tmp.p.copy(st.P).addScaledVector(tmp.r, r).addScaledVector(st.T, io.ax + 0.012 * Math.sin(w * 1.1 + io.fase));
        const esc = s0 * 0.95 * Math.min(1, p / 0.12);
        if (!iones.listo) { iones.posK[j].copy(tmp.p); iones.escK[j] = esc; }
        iones.posK[j].lerp(tmp.p, k);
        iones.escK[j] += (esc - iones.escK[j]) * k;
        tmp.s.setScalar(Math.max(1e-5, iones.escK[j]));
        tmp.m.compose(iones.posK[j], tmp.q.identity(), tmp.s);
        kk.setMatrixAt(j, tmp.m);
      }
      iones.listo = true;
      na.instanceMatrix.needsUpdate = true; kk.instanceMatrix.needsUpdate = true;
    }
    // ── vesículas: se funden con la membrana tras la llegada del PA al terminal
    const ves = vesRef.current;
    if (ves) {
      for (let j = 0; j < vesiculas.length; j++) {
        const vs = vesiculas[j];
        const bot = gf.botones[vs.b];
        let p = 0;
        if (tLlega > 0 && tB >= 0) p = Math.min(1, Math.max(0, (tB - tLlega - vs.retardo) / 0.18));
        tmp.p.copy(bot).add(tmp.r.copy(vs.off).multiplyScalar(1 - p)).add(tmp.s.set(0, -0.05 * p, 0));
        const objetivo = 0.018 * (1 - Math.min(1, Math.max(0, (p - 0.6) / 0.4)));
        vs.esc += (objetivo - vs.esc) * (p > 0 ? 1 : k * 0.5);
        tmp.s.setScalar(Math.max(1e-5, vs.esc));
        tmp.m.compose(tmp.p, tmp.q.identity(), tmp.s);
        ves.setMatrixAt(j, tmp.m);
      }
      ves.instanceMatrix.needsUpdate = true;
    }
    // ── chispa del estímulo en la punta de la pipeta A
    if (chispa.current) {
      const s = c.t - b.t0Barrido;
      const on = b.t0Barrido >= 0 && b.pulsos.some((p0) => s > p0 && s <= p0 + DUR_ESTIMULO);
      const m = chispa.current;
      const obj = on ? 0.05 : 0.0001;
      m.scale.setScalar(m.scale.x + (obj - m.scale.x) * (on ? 1 : k));
    }
  }, -1);

  const pasar = (nombre: string) => ({
    onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); alPasar?.(nombre, e); },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); alPasar?.(nombre, e); },
    onPointerOut: () => alPasar?.(null),
  });
  const sinRayo = () => null;

  return (
    <group>
      {/* soma y dendritas */}
      <mesh geometry={gs.soma} material={mats.soma} position={gs.centro} {...pasar('Soma')} renderOrder={2} />
      <mesh geometry={gs.nucleo} material={mats.nucleo} position={gs.centro.clone().add(new THREE.Vector3(-0.06, 0.05, 0.02))} raycast={sinRayo} />
      <mesh geometry={gs.nucleolo} material={mats.nucleolo} position={gs.centro.clone().add(new THREE.Vector3(-0.02, 0.1, 0.2))} raycast={sinRayo} />
      <mesh geometry={gs.dendritas} material={mats.dendritas} {...pasar('Dendritas')} />
      {/* axón */}
      <mesh geometry={gf.cono} material={mats.axon} {...pasar('Cono axónico')} />
      <mesh geometry={gf.axon} material={mats.axon} {...pasar(reloj.banco.cfg.tipo === 'amielinica' ? 'Axón sin mielina' : 'Nodo de Ranvier')} />
      {gf.vainas && <mesh geometry={gf.vainas} material={mats.mielina} {...pasar('Vaina de mielina')} renderOrder={3} />}
      {gf.schwann.length > 0 && <Instancias matrices={gf.schwann} material={mats.schwann} nombre="Célula de Schwann" pasar={pasar} />}
      {/* terminal y placa motora */}
      <mesh geometry={gf.terminal} material={mats.terminal} {...pasar('Botón terminal')} />
      {gf.botones.map((p, i) => (
        <mesh key={i} position={p} scale={[0.085, 0.06, 0.085]} material={mats.terminal} geometry={gm.placa} {...pasar('Botón terminal')} />
      ))}
      <instancedMesh ref={vesRef} args={[ionGeo, mats.vesicula, vesiculas.length]} raycast={sinRayo} frustumCulled={false} />
      <mesh geometry={gm.placa} material={mats.placa} position={[MUSCULO.xP - 0.02, MUSCULO.y + MUSCULO.r - 0.02, 0.05]} scale={[0.62, 0.09, 0.34]} {...pasar('Placa motora')} />
      <mesh geometry={gm.fibra} material={mats.musculo} {...pasar('Fibra muscular')} />
      <Instancias matrices={gm.nucleos} material={mats.nucleoMusc} nombre="Fibra muscular" pasar={pasar} />
      {/* iones */}
      <instancedMesh key={`na${version}`} ref={naRef} args={[ionGeo, mats.na, iones.na.length]} raycast={sinRayo} frustumCulled={false} />
      <instancedMesh key={`k${version}`} ref={kRef} args={[ionGeo, mats.k, iones.k.length]} raycast={sinRayo} frustumCulled={false} />
      {/* pipetas */}
      <Pipeta g={pipA} mats={mats} nombre="Pipeta A (estímulo y registro)" pasar={pasar} />
      <mesh ref={chispa} geometry={ionGeo} material={mats.chispa} position={pipA.punta} scale={0.0001} raycast={sinRayo} />
      <Pipeta g={pipB} mats={mats} nombre="Pipeta B (registro)" pasar={pasar} />
      {/* vecindario del fondo (decorado) */}
      <mesh geometry={gv} material={mats.vecino} raycast={sinRayo} />
      {rotulos && <Rotulos lista={listaRotulos} />}
    </group>
  );
}

function Instancias({ matrices, material, nombre, pasar }: { matrices: THREE.Matrix4[]; material: THREE.Material; nombre: string; pasar: (n: string) => object }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 24, 14), []);
  useEffect(() => {
    const m = ref.current; if (!m) return;
    matrices.forEach((x, i) => m.setMatrixAt(i, x));
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [matrices]);
  return <instancedMesh key={matrices.length} ref={ref} args={[geo, material, matrices.length]} {...pasar(nombre)} />;
}

function Pipeta({ g, mats, nombre, pasar }: {
  g: { vidrio: THREE.BufferGeometry; solucion: THREE.BufferGeometry; alambre: THREE.BufferGeometry };
  mats: ReturnType<typeof useMateriales>; nombre: string; pasar: (n: string) => object;
}) {
  return (
    <group>
      <mesh geometry={g.alambre} material={mats.alambre} raycast={() => null} />
      <mesh geometry={g.solucion} material={mats.solucion} renderOrder={4} raycast={() => null} />
      <mesh geometry={g.vidrio} material={mats.vidrio} renderOrder={5} {...pasar(nombre)} />
    </group>
  );
}

// ───────────────────────────── anclas de rótulos y cámara ─────────────────────────────

/** Puntos de los rótulos del banco (≤ 8) y desplazamiento de la etiqueta en px. */
export function rotulosBanco(gf: Pick<GeoFibra, 'puntaB' | 'uB'>, tipo: string): Rotulo[] {
  const P = (u: number) => { const p = CURVA_AXON.getPointAt(u); return [p.x, p.y, p.z] as V3; };
  const out = [
    { texto: 'Soma', p: [SOMA_C[0] - 0.3, SOMA_C[1] - 0.35, 0.45] as V3, dx: -70, dy: 34 },
    { texto: 'Cono axónico', p: P(U_CONO * 0.6), dx: 10, dy: 54 },
    { texto: tipo === 'amielinica' ? 'Axón sin mielina' : 'Vaina de mielina', p: P(0.3), dx: 0, dy: -46 },
    { texto: 'Pipeta A', p: [SOMA_C[0] + 0.75, SOMA_C[1] + 1.35, 0.55] as V3, dx: 56, dy: -8 },
    { texto: 'Pipeta B', p: [gf.puntaB.x + 0.9, gf.puntaB.y - 0.15, gf.puntaB.z + 0.35] as V3, dx: 40, dy: 26 },
    { texto: 'Placa motora', p: [MUSCULO.xP - 0.35, MUSCULO.y + MUSCULO.r, 0.1] as V3, dx: -96, dy: -30 },
    { texto: 'Fibra muscular', p: [MUSCULO.x1 - 0.6, MUSCULO.y - MUSCULO.r * 0.6, 0.2] as V3, dx: 30, dy: 30 },
  ];
  if (tipo !== 'amielinica') out.splice(3, 0, { texto: 'Nodo de Ranvier', p: P(gf.uB), dx: -120, dy: -12 });
  return out;
}

/** Encuadre del banco completo y del nodo de la pipeta B. */
export const ENCUADRE_BANCO = { centro: [-0.5, 0.36, 0] as V3, semiAlto: 4.5, semiAncho: 4.9, dir: [-0.12, 0.12, 1] as V3 };
export function encuadreNodo(gf: Pick<GeoFibra, 'puntaB'>) {
  return { centro: [gf.puntaB.x, gf.puntaB.y, gf.puntaB.z - 0.15] as V3, semiAlto: 1.05, semiAncho: 1.6, dir: [0.2, 0.22, 1] as V3 };
}
