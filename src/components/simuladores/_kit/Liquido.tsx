'use client';
/**
 * _kit/Liquido.tsx — líquido que llena un recipiente del kit según SU perfil.
 *
 *   <Liquido recipiente="vaso-250" volumenML={150} color="#e04f9a" />
 *   <Liquido recipiente={defErlenmeyer(250)} volumenML={80} />
 *
 * Se coloca en las MISMAS coordenadas locales que la pieza de vidrio (y = 0 en la
 * base del vidrio); los componentes de cristalería ya lo hacen con su prop
 * `liquido`.
 *
 * Convención del menisco (la del laboratorio): el FONDO del menisco —el centro de
 * la superficie— está exactamente a alturaParaVolumen(volumen); el líquido sube
 * por la pared un poco más (menisco cóncavo del agua sobre vidrio). Así, cuando el
 * volumen es el nominal de un matraz aforado, el fondo del menisco queda tangente
 * a la marca, que es como se enrasa.
 *
 * La geometría se crea UNA vez por recipiente (número de vértices fijo) y, cuando
 * cambia el volumen, se reescriben las posiciones en el sitio: animar el volumen
 * (una titulación) no crea geometría por fotograma.
 */
import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { obtenerRecipiente, desplazar, type DefRecipiente, type P2 } from './perfiles';
import { sanearNormales } from './geometria';
import { useMateriales } from './materiales';

export interface PropsLiquido {
  recipiente: DefRecipiente | string;
  volumenML: number;
  color?: string;
  /** 0 = superficie plana; 1 = menisco del agua (sutil). */
  menisco?: number;
  /** material propio (por defecto el líquido compartido del color) */
  material?: THREE.Material;
  sombra?: boolean;
  segmentos?: number;
}

const FILAS = 44;     // filas de la pared
const ANILLOS = 9;    // anillos del menisco
const HUECO = 0.0018; // separación respecto al vidrio (evita z-fighting)

interface Trayecto { pts: P2[]; acum: number[] }
const trayectos = new Map<string, Trayecto>();
function trayecto(def: DefRecipiente): Trayecto {
  let t = trayectos.get(def.id);
  if (!t) {
    // cavidad desplazada HACIA DENTRO (lado izquierdo del avance)
    const pts = desplazar(def.interior, -HUECO).map(([r, y]) => [Math.max(0, r), y] as P2);
    const acum = [0];
    for (let i = 1; i < pts.length; i++) acum.push(acum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    t = { pts, acum };
    trayectos.set(def.id, t);
  }
  return t;
}

/** Punto del trayecto a la longitud de arco s. */
function enArco(t: Trayecto, s: number, out: P2) {
  const { pts, acum } = t;
  if (s <= 0) { out[0] = pts[0][0]; out[1] = pts[0][1]; return; }
  for (let i = 1; i < pts.length; i++) {
    if (acum[i] >= s) {
      const u = (s - acum[i - 1]) / Math.max(1e-12, acum[i] - acum[i - 1]);
      out[0] = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u;
      out[1] = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u;
      return;
    }
  }
  const u = pts[pts.length - 1]; out[0] = u[0]; out[1] = u[1];
}

/** Longitud de arco a la que el trayecto alcanza la altura y (primera vez). */
function arcoDeAltura(t: Trayecto, y: number): number {
  const { pts, acum } = t;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i][1] >= y) {
      const dy = pts[i][1] - pts[i - 1][1];
      const u = dy > 1e-12 ? (y - pts[i - 1][1]) / dy : 1;
      return acum[i - 1] + (acum[i] - acum[i - 1]) * Math.max(0, Math.min(1, u));
    }
  }
  return acum[acum.length - 1];
}

function radioEn(t: Trayecto, y: number): number {
  const p: P2 = [0, 0];
  enArco(t, arcoDeAltura(t, y), p);
  return p[0];
}

const trigs = new Map<number, { sin: Float32Array; cos: Float32Array }>();
function trig(S: number) {
  let t = trigs.get(S);
  if (!t) {
    t = { sin: new Float32Array(S), cos: new Float32Array(S) };
    for (let j = 0; j < S; j++) { const f = (j / S) * Math.PI * 2; t.sin[j] = Math.sin(f); t.cos[j] = Math.cos(f); }
    trigs.set(S, t);
  }
  return t;
}

function crearGeometria(S: number): THREE.BufferGeometry {
  const nv = 1 + FILAS * S + ANILLOS * S + 1;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
  const idx: number[] = [];
  const pared = (i: number, j: number) => 1 + i * S + (j % S);
  const capa = (k: number, j: number) => 1 + FILAS * S + k * S + (j % S);
  const centro = nv - 1;
  for (let j = 0; j < S; j++) idx.push(0, pared(0, j + 1), pared(0, j)); // fondo (normal hacia abajo)
  for (let i = 0; i < FILAS - 1; i++) for (let j = 0; j < S; j++) {
    const A = pared(i, j), B = pared(i, j + 1), C = pared(i + 1, j), D = pared(i + 1, j + 1);
    idx.push(A, B, C, B, D, C);
  }
  for (let k = 0; k < ANILLOS - 1; k++) for (let j = 0; j < S; j++) {
    const A = capa(k, j), B = capa(k, j + 1), C = capa(k + 1, j), D = capa(k + 1, j + 1);
    idx.push(A, B, C, B, D, C);
  }
  for (let j = 0; j < S; j++) idx.push(centro, capa(ANILLOS - 1, j), capa(ANILLOS - 1, j + 1));
  g.setIndex(idx);
  return g;
}

/** Reescribe la geometría para un volumen dado. Devuelve false si está vacío. */
function escribir(g: THREE.BufferGeometry, def: DefRecipiente, volumenML: number, menisco: number, S: number): boolean {
  if (!(volumenML > 0.0005)) return false;
  const t = trayecto(def);
  const yTope = t.pts[t.pts.length - 1][1] - 0.002;
  let h = def.alturaParaVolumen(volumenML);
  const R0 = Math.max(1e-4, radioEn(t, h));
  const m = menisco * Math.min(0.018, 0.8 * R0);
  if (h + m > yTope) { h = Math.max(t.pts[0][1] + 1e-4, yTope - m); }
  const yPared = h + m;
  const sTope = arcoDeAltura(t, yPared);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const arr = pos.array as Float32Array;
  const { sin, cos } = trig(S);
  const p: P2 = [0, 0];
  // fondo
  arr[0] = 0; arr[1] = t.pts[0][1]; arr[2] = 0;
  let R = 0;
  for (let i = 0; i < FILAS; i++) {
    enArco(t, (sTope * i) / (FILAS - 1), p);
    const r = p[0], y = i === FILAS - 1 ? yPared : p[1];
    if (i === FILAS - 1) R = r;
    for (let j = 0; j < S; j++) {
      const k = (1 + i * S + j) * 3;
      arr[k] = r * sin[j]; arr[k + 1] = y; arr[k + 2] = r * cos[j];
    }
  }
  // menisco: y(r) = h + m·(e^{−(R−r)/λ} − e^{−R/λ}) / (1 − e^{−R/λ})
  const lam = Math.max(1e-4, Math.min(0.02, 0.45 * R));
  const e0 = Math.exp(-R / lam);
  for (let k = 0; k < ANILLOS; k++) {
    const r = R * Math.pow(1 - k / ANILLOS, 0.55);
    const y = m > 0 ? h + (m * (Math.exp(-(R - r) / lam) - e0)) / (1 - e0) : yPared;
    for (let j = 0; j < S; j++) {
      const q = (1 + FILAS * S + k * S + j) * 3;
      arr[q] = r * sin[j]; arr[q + 1] = y; arr[q + 2] = r * cos[j];
    }
  }
  const c = (pos.count - 1) * 3;
  arr[c] = 0; arr[c + 1] = m > 0 ? h : yPared; arr[c + 2] = 0;
  pos.needsUpdate = true;
  g.computeVertexNormals();
  sanearNormales(g);
  g.computeBoundingSphere();
  return true;
}

export function Liquido({ recipiente, volumenML, color = '#cfe6ef', menisco = 1, material, sombra = true, segmentos }: PropsLiquido) {
  const def = typeof recipiente === 'string' ? obtenerRecipiente(recipiente) : recipiente;
  const mats = useMateriales();
  const S = segmentos ?? (mats.calidad === 'alta' ? 56 : 32);
  const geo = useMemo(() => crearGeometria(S), [S]);
  useEffect(() => () => geo.dispose(), [geo]);
  const [visible, setVisible] = React.useState(volumenML > 0);
  useLayoutEffect(() => {
    const ok = escribir(geo, def, volumenML, menisco, S);
    setVisible(ok);
  }, [geo, def, volumenML, menisco, S]);
  const mat = material ?? mats.liquido(color);
  return <mesh geometry={geo} material={mat} visible={visible} castShadow={sombra} renderOrder={1} />;
}

/** Altura de la superficie (fondo del menisco) para un volumen, en coords. de la pieza. */
export function alturaSuperficie(recipiente: DefRecipiente | string, volumenML: number): number {
  const def = typeof recipiente === 'string' ? obtenerRecipiente(recipiente) : recipiente;
  return def.alturaParaVolumen(volumenML);
}
