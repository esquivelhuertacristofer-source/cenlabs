'use client';
/**
 * mat09/piezas.tsx — las piezas del banco de integración (1 u = 1 cm).
 *
 *  - Soporte: zócalo de grafito con filete de latón, postes de aluminio torneados y la placa de
 *    vidrio ahumado con la retícula GRABADA (lienzo a alta resolución con mipmaps y anisotropía).
 *  - Regla de aluminio (el eje x) con su escala grabada: en ella se apoyan las columnas.
 *  - Columnas de cristal: UNA geometría instanciada (dos pasadas: caras traseras y delanteras) cuyo
 *    techo es la parábola por tres nodos que manda el reloj (rectángulo, trapecio o Simpson). El
 *    sombreador hace el vidrio: Fresnel, reflejos de dos softboxes, aristas que captan la luz.
 *  - Franjas de error entre el techo de cada columna y la curva, con rayado fino a 45°: rojo donde
 *    la columna SOBRA (techo > f), cian donde FALTA (techo < f). Su área neta es E = S − I.
 *  - La curva como tubo de neón con vaina de vidrio y derrame de luz sobre la placa.
 *  - Probeta de vidrio con pie hexagonal y escala esmaltada: el líquido sube hasta la suma vertida.
 *
 * Materiales sin ruido de alta frecuencia: superficies lisas con reflejos del entorno.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { tornear, cajaRedondeada, cilindro, tuboPolilinea, bandaSobrePerfil, crearLienzo, texturaDeLienzo, type Calidad } from '../_kit';
import {
  ANCHO_PLOT, ALTO_PLOT, ALTO_ZOCALO, ALTO_REGLA, Y_BASE, X_IZQ, X_DER, FONDO_COL, Z_FRENTE, PLACA, MARCO, GROSOR_VIDRIO, Z_PLACA,
  X_POSTE_IZQ, X_POSTE_DER, ALTO_POSTE, ZOCALO, R_PROBETA, PARED_PROBETA, X_PROBETA, Z_PROBETA, ALTO_VIDRIO_PROBETA, ALTO_PIE,
  HUECO_FRAC, HUECO_MAX,
} from './banco';
import { num, type Curva } from './riemann';
import { MAX_COLUMNAS, type RelojRiemann } from './reloj';

// ───────────────────────────── materiales ─────────────────────────────

export interface MatsM9 {
  vidrio: THREE.MeshPhysicalMaterial;
  marco: THREE.MeshStandardMaterial;
  aluminio: THREE.MeshStandardMaterial;
  regla: THREE.MeshPhysicalMaterial;
  grafito: THREE.MeshPhysicalMaterial;
  laton: THREE.MeshStandardMaterial;
  goma: THREE.MeshStandardMaterial;
  suelo: THREE.MeshStandardMaterial;
}

export function useMatsM9(calidad: Calidad): MatsM9 {
  const m = useMemo<MatsM9>(() => {
    const alta = calidad === 'alta';
    return {
      // vidrio ahumado: casi negro, con barniz que recoge los reflejos del estudio
      vidrio: new THREE.MeshPhysicalMaterial({
        color: '#0f1d29', metalness: 0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05,
        transparent: true, opacity: 0.9, envMapIntensity: 1.1, ior: 1.5, name: 'm9-vidrio',
      }),
      marco: new THREE.MeshStandardMaterial({ color: '#3a4049', metalness: 0.92, roughness: 0.3, envMapIntensity: 1.1, name: 'm9-marco' }),
      aluminio: new THREE.MeshStandardMaterial({ color: '#c3c9cf', metalness: 1, roughness: 0.24, name: 'm9-aluminio' }),
      // regla: aluminio satinado (cepillado fino, sin ruido: sólo rugosidad algo mayor)
      regla: new THREE.MeshPhysicalMaterial({ color: '#b9c0c7', metalness: 1, roughness: 0.34, clearcoat: alta ? 0.4 : 0, clearcoatRoughness: 0.3, name: 'm9-regla' }),
      grafito: new THREE.MeshPhysicalMaterial({ color: '#141920', metalness: 0.25, roughness: 0.42, clearcoat: alta ? 0.7 : 0.3, clearcoatRoughness: 0.22, name: 'm9-grafito' }),
      laton: new THREE.MeshStandardMaterial({ color: '#cfa65a', metalness: 1, roughness: 0.27, name: 'm9-laton' }),
      goma: new THREE.MeshStandardMaterial({ color: '#0e1013', roughness: 0.88, metalness: 0, name: 'm9-goma' }),
      suelo: new THREE.MeshStandardMaterial({ color: '#0a0e13', roughness: 0.62, metalness: 0.18, name: 'm9-suelo' }),
    };
  }, [calidad]);
  useEffect(() => () => { Object.values(m).forEach((x) => (x as THREE.Material).dispose()); }, [m]);
  return m;
}

const familia = () => (typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui');

// ───────────────────────────── grabados ─────────────────────────────

/** Retícula y escala de y grabadas en la placa del fondo (las x van en la regla). */
export function texturaPlaca(c: Curva, calidad: Calidad): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const pxCm = calidad === 'alta' ? 30 : 20;
  const W = Math.round(PLACA.w * pxCm), H = Math.round(PLACA.h * pxCm);
  const lz = crearLienzo(W, H);
  const g = lz.getContext('2d');
  if (!g) return null;
  const ix = (X: number) => (X - PLACA.x0) * pxCm;
  const iy = (Y: number) => (PLACA.y1 - Y) * pxCm;
  const X = (x: number) => X_IZQ + ((x - c.a) / (c.b - c.a)) * ANCHO_PLOT;
  const Y = (y: number) => Y_BASE + (y / c.yMax) * ALTO_PLOT;
  // marcas de y en pasos de 1, 2 o 5 (sin 2,5: grabadas con un decimal se leen peor), como mucho 8
  const pasoY = [0.5, 1, 2, 5, 10, 20].find((p) => c.yMax / p <= 7) ?? 20;
  const my: number[] = [];
  for (let v = 0; v <= c.yMax + 1e-9; v += pasoY) my.push(Number(v.toFixed(6)));
  g.clearRect(0, 0, W, H);
  g.lineCap = 'round';
  const linea = (x0: number, y0: number, x1: number, y1: number, a: number, w: number) => {
    g.strokeStyle = `rgba(205,226,240,${a})`; g.lineWidth = w;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  };
  const L = ix(X_IZQ), R = ix(X_DER), T = iy(Y_BASE + ALTO_PLOT), B = iy(Y_BASE);
  // retícula: x cada media unidad (fina) y cada unidad; y cada media marca y cada marca
  for (let k = 0; k <= 20; k++) { const xv = c.a + ((c.b - c.a) * k) / 20; linea(ix(X(xv)), T, ix(X(xv)), B, k % 2 ? 0.08 : 0.2, pxCm * (k % 2 ? 0.04 : 0.055)); }
  for (let v = pasoY / 2; v <= c.yMax + 1e-9; v += pasoY / 2) {
    const mayor = Math.abs(v / pasoY - Math.round(v / pasoY)) < 1e-6;
    linea(L, iy(Y(v)), R, iy(Y(v)), mayor ? 0.2 : 0.08, pxCm * (mayor ? 0.055 : 0.04));
  }
  // contorno y marcas cortas
  g.strokeStyle = 'rgba(205,226,240,0.34)'; g.lineWidth = pxCm * 0.07; g.strokeRect(L, T, R - L, B - T);
  for (const v of my) linea(L - pxCm * 0.45, iy(Y(v)), L, iy(Y(v)), 0.45, pxCm * 0.06);
  const f = familia();
  const dY = Number.isInteger(pasoY) ? 0 : 1;
  g.fillStyle = 'rgba(220,236,248,0.8)';
  g.font = `600 ${Math.round(pxCm * 1.35)}px ${f}`;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const v of my) g.fillText(num(v, dY), L - pxCm * 0.7, iy(Y(v)));
  g.fillStyle = 'rgba(220,236,248,0.62)';
  g.font = `italic 600 ${Math.round(pxCm * 1.3)}px ${f}`;
  g.textAlign = 'left'; g.textBaseline = 'bottom';
  g.fillText('f(x)', L + pxCm * 0.35, T - pxCm * 0.2);
  const tex = texturaDeLienzo(lz, { mipmaps: true, srgb: true });
  tex.anisotropy = 8;
  return tex;
}

/** Escala de la regla: marcas cada 0,1 de x (las de 0,5 más largas) y números enteros grabados. */
export function texturaRegla(c: Curva, ancho: number, alto: number, calidad: Calidad): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const pxCm = calidad === 'alta' ? 36 : 24;
  const W = Math.round(ancho * pxCm), H = Math.round(alto * pxCm);
  const lz = crearLienzo(W, H);
  const g = lz.getContext('2d');
  if (!g) return null;
  g.clearRect(0, 0, W, H);
  const x0 = (W - ANCHO_PLOT * pxCm) / 2;
  const ix = (x: number) => x0 + ((x - c.a) / (c.b - c.a)) * ANCHO_PLOT * pxCm;
  g.strokeStyle = 'rgba(12,16,22,0.9)';
  g.lineCap = 'butt';
  for (let k = 0; k <= 100; k++) {
    const xv = c.a + ((c.b - c.a) * k) / 100;
    const largo = k % 10 === 0 ? 0.62 : k % 5 === 0 ? 0.42 : 0.24;
    g.lineWidth = pxCm * (k % 10 === 0 ? 0.07 : 0.045);
    g.beginPath(); g.moveTo(ix(xv), 0); g.lineTo(ix(xv), H * largo * 0.62); g.stroke();
  }
  const f = familia();
  g.fillStyle = 'rgba(12,16,22,0.92)';
  g.font = `700 ${Math.round(H * 0.36)}px ${f}`;
  g.textAlign = 'center'; g.textBaseline = 'bottom';
  for (let k = 0; k <= 10; k++) { const xv = c.a + ((c.b - c.a) * k) / 10; g.fillText(num(xv, 0), ix(xv), H * 0.94); }
  g.font = `italic 700 ${Math.round(H * 0.36)}px ${f}`;
  g.textAlign = 'left';
  g.fillText('x', ix(c.b) + pxCm * 1.0, H * 0.94);
  const tex = texturaDeLienzo(lz, { mipmaps: true, srgb: true });
  tex.anisotropy = 8;
  return tex;
}

/** Escala esmaltada de la probeta (unidades de área): marca cada unidad, número cada décima parte del fondo. */
export function texturaProbeta(escala: number, calidad: Calidad): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const H = calidad === 'alta' ? 1536 : 1024, W = Math.round(H * 0.42);
  const lz = crearLienzo(W, H);
  const g = lz.getContext('2d');
  if (!g) return null;
  g.clearRect(0, 0, W, H);
  // v = 0 abajo (el lienzo va de arriba abajo)
  const iy = (s: number) => H - (s / escala) * H;
  const mayor = escala >= 60 ? 10 : 5, menor = escala >= 60 ? 2 : 1;
  const cx = W * 0.5;
  g.strokeStyle = 'rgba(240,248,255,0.92)';
  g.lineCap = 'round';
  for (let s = 0; s <= escala + 1e-9; s += menor) {
    const esMayor = Math.abs(s / mayor - Math.round(s / mayor)) < 1e-9;
    const media = !esMayor && Math.abs(s / (mayor / 2) - Math.round(s / (mayor / 2))) < 1e-9;
    const l = esMayor ? W * 0.3 : media ? W * 0.2 : W * 0.12;
    g.lineWidth = esMayor ? H * 0.0032 : H * 0.0022;
    const y = Math.min(H - 2, Math.max(2, iy(s)));
    g.beginPath(); g.moveTo(cx - l, y); g.lineTo(cx, y); g.stroke();
  }
  const f = familia();
  g.fillStyle = 'rgba(240,248,255,0.95)';
  g.font = `700 ${Math.round(H * 0.026)}px ${f}`;
  g.textAlign = 'left'; g.textBaseline = 'middle';
  for (let s = mayor; s <= escala + 1e-9; s += mayor) g.fillText(num(s, 0), cx + W * 0.04, iy(s));
  const tex = texturaDeLienzo(lz, { mipmaps: true, srgb: true });
  tex.anisotropy = 8;
  return tex;
}

// ───────────────────────────── soporte, placa y regla ─────────────────────────────

/** Une geometrías ya transformadas (copias: las del kit están en caché y no se tocan). */
function unir(partes: { g: THREE.BufferGeometry; m: THREE.Matrix4 }[]): THREE.BufferGeometry {
  const gs = partes.map(({ g, m }) => {
    const c0 = g.clone();
    const c = c0.index === null ? c0 : c0.toNonIndexed();
    if (c !== c0) c0.dispose();
    c.applyMatrix4(m);
    for (const k of Object.keys(c.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') c.deleteAttribute(k);
    if (!c.getAttribute('uv')) c.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(c.getAttribute('position').count * 2), 2));
    return c;
  });
  const u = mergeGeometries(gs, false) ?? new THREE.BufferGeometry();
  gs.forEach((g) => g.dispose());
  u.computeBoundingSphere();
  return u;
}
const tr = (x: number, y: number, z: number, rx = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), new THREE.Vector3(1, 1, 1));

/** Zócalo, postes, marco y mordazas (todo lo de aluminio en una sola malla). */
export function Soporte({ mats }: { mats: MatsM9 }) {
  const largo = ZOCALO.x1 - ZOCALO.x0, cxZ = (ZOCALO.x0 + ZOCALO.x1) / 2;
  const geos = useMemo(() => {
    const brida = tornear([[0.001, 0], [1.9, 0], [1.9, 0.35], [1.35, 0.55], [0.8, 0.75], [0.8, 0.8], [0.001, 0.8]], 40);
    const remate = tornear([[0.001, 0], [0.82, 0], [0.82, 0.35], [0.62, 0.62], [0.2, 0.75], [0.001, 0.76]], 40);
    const altoPoste = ALTO_POSTE - ALTO_ZOCALO - 0.8;
    const poste = cilindro(0.72, 0.72, altoPoste, 40);
    const alu: { g: THREE.BufferGeometry; m: THREE.Matrix4 }[] = [];
    for (const x of [X_POSTE_IZQ, X_POSTE_DER]) {
      alu.push({ g: brida, m: tr(x, ALTO_ZOCALO, Z_PLACA) });
      alu.push({ g: poste, m: tr(x, ALTO_ZOCALO + 0.8 + altoPoste / 2, Z_PLACA) });
      alu.push({ g: remate, m: tr(x, ALTO_ZOCALO + 0.8 + altoPoste, Z_PLACA) });
    }
    // marco de la placa (anodizado oscuro) y mordazas del poste al marco
    const a = MARCO.ancho, fz = MARCO.fondo;
    const marco: { g: THREE.BufferGeometry; m: THREE.Matrix4 }[] = [
      { g: cajaRedondeada(PLACA.w + 2 * a, a, fz, 0.22, 3), m: tr(PLACA.cx, PLACA.y1 + a / 2, Z_PLACA) },
      { g: cajaRedondeada(PLACA.w + 2 * a, a, fz, 0.22, 3), m: tr(PLACA.cx, PLACA.y0 - a / 2, Z_PLACA) },
      { g: cajaRedondeada(a, PLACA.h, fz, 0.22, 3), m: tr(PLACA.x0 - a / 2, PLACA.cy, Z_PLACA) },
      { g: cajaRedondeada(a, PLACA.h, fz, 0.22, 3), m: tr(PLACA.x1 + a / 2, PLACA.cy, Z_PLACA) },
    ];
    for (const y of [PLACA.cy - PLACA.h * 0.3, PLACA.cy + PLACA.h * 0.3]) for (const s of [-1, 1]) {
      const xMarco = s < 0 ? PLACA.x0 - a : PLACA.x1 + a, xPoste = s < 0 ? X_POSTE_IZQ : X_POSTE_DER;
      marco.push({ g: cajaRedondeada(Math.abs(xPoste - xMarco) + 0.6, 2.2, 2.2, 0.35, 3), m: tr((xPoste + xMarco) / 2, y, Z_PLACA) });
    }
    const tornillos: { g: THREE.BufferGeometry; m: THREE.Matrix4 }[] = [];
    for (const y of [PLACA.cy - PLACA.h * 0.3, PLACA.cy + PLACA.h * 0.3]) for (const s of [-1, 1]) {
      const xMarco = s < 0 ? PLACA.x0 - a : PLACA.x1 + a, xPoste = s < 0 ? X_POSTE_IZQ : X_POSTE_DER;
      for (const dy of [-0.55, 0.55]) tornillos.push({ g: cilindro(0.26, 0.26, 0.2, 20), m: tr((xPoste + xMarco) / 2, y + dy, Z_PLACA + 1.16, Math.PI / 2) });
    }
    // filete de latón del zócalo
    tornillos.push({ g: cajaRedondeada(largo - 1.2, 0.16, 0.16, 0.06, 2), m: tr(cxZ, ALTO_ZOCALO - 0.55, ZOCALO.z + ZOCALO.fondo / 2 + 0.02) });
    const r = { alu: unir(alu), marco: unir(marco), laton: unir(tornillos) };
    brida.dispose(); remate.dispose();
    return r;
  }, [largo, cxZ]);
  useEffect(() => () => { geos.alu.dispose(); geos.marco.dispose(); geos.laton.dispose(); }, [geos]);
  const patas = useMemo(() => {
    const p: { g: THREE.BufferGeometry; m: THREE.Matrix4 }[] = [];
    for (const [sx, sz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) p.push({ g: cilindro(1.0, 1.15, 0.5, 24), m: tr(cxZ + sx * (largo / 2 - 3), -0.05, ZOCALO.z + sz * (ZOCALO.fondo / 2 - 2.5)) });
    return unir(p);
  }, [cxZ, largo]);
  useEffect(() => () => patas.dispose(), [patas]);
  return (
    <group userData={{ pieza: 'soporte' }}>
      <mesh geometry={cajaRedondeada(largo, ALTO_ZOCALO, ZOCALO.fondo, 0.5, 4)} material={mats.grafito} position={[cxZ, ALTO_ZOCALO / 2, ZOCALO.z]} castShadow receiveShadow />
      <mesh geometry={patas} material={mats.goma} />
      <mesh geometry={geos.alu} material={mats.aluminio} castShadow />
      <mesh geometry={geos.marco} material={mats.marco} castShadow receiveShadow />
      <mesh geometry={geos.laton} material={mats.laton} />
    </group>
  );
}

/** Placa de vidrio ahumado con su retícula grabada. */
export function Placa({ tex, mats }: { tex: THREE.Texture | null; mats: MatsM9 }) {
  const matGrabado = useMemo(() => new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: true, color: '#d8ecf8', name: 'm9-grabado',
  }), [tex]);
  useEffect(() => () => matGrabado.dispose(), [matGrabado]);
  return (
    <group userData={{ pieza: 'placa' }}>
      <mesh geometry={cajaRedondeada(PLACA.w, PLACA.h, GROSOR_VIDRIO, 0.12, 2)} material={mats.vidrio} position={[PLACA.cx, PLACA.cy, Z_PLACA]} renderOrder={0} />
      {tex && (
        <mesh position={[PLACA.cx, PLACA.cy, Z_PLACA + GROSOR_VIDRIO / 2 + 0.012]} material={matGrabado} renderOrder={1}>
          <planeGeometry args={[PLACA.w, PLACA.h]} />
        </mesh>
      )}
    </group>
  );
}

export const LARGO_REGLA = ANCHO_PLOT + 6;
export const FONDO_REGLA = FONDO_COL + 2.2;
/** Regla de aluminio sobre el zócalo: su cara de arriba es y = 0 y la de delante lleva la escala de x. */
export function Regla({ tex, mats }: { tex: THREE.Texture | null; mats: MatsM9 }) {
  const cx = (X_IZQ + X_DER) / 2 + 1.2;
  const matG = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, color: '#ffffff', roughness: 0.7, metalness: 0, name: 'm9-escala' }), [tex]);
  useEffect(() => () => matG.dispose(), [matG]);
  return (
    <group userData={{ pieza: 'regla' }}>
      <mesh geometry={cajaRedondeada(LARGO_REGLA, ALTO_REGLA, FONDO_REGLA, 0.12, 3)} material={mats.regla} position={[cx, ALTO_ZOCALO + ALTO_REGLA / 2, 0.3]} castShadow receiveShadow />
      {tex && (
        <mesh position={[cx, ALTO_ZOCALO + ALTO_REGLA / 2, 0.3 + FONDO_REGLA / 2 + 0.006]} material={matG}>
          <planeGeometry args={[LARGO_REGLA - 0.3, ALTO_REGLA - 0.12]} />
        </mesh>
      )}
    </group>
  );
}

// ───────────────────────────── columnas de cristal ─────────────────────────────

const SEG_TECHO = 10;

/**
 * Columna unidad: la posición guarda (u, v, w) — u ∈ [0, 1] a lo ancho, v ∈ {0, 1} base/techo,
 * w ∈ {−1, 1} detrás/delante — y el sombreador la lleva a su sitio. aCara: 0 frente/fondo,
 * 1 techo (su normal sale de la pendiente del techo), 2 base, 3 extremos.
 */
function geometriaColumna(): THREE.InstancedBufferGeometry {
  const pos: number[] = [], nor: number[] = [], cara: number[] = [], idx: number[] = [];
  const v = (u: number, vv: number, w: number, n: [number, number, number], k: number) => {
    pos.push(u, vv, w); nor.push(...n); cara.push(k); return pos.length / 3 - 1;
  };
  // delante (+z) y detrás (−z)
  for (const w of [1, -1]) {
    const b: number[] = [], t: number[] = [];
    for (let i = 0; i <= SEG_TECHO; i++) { const u = i / SEG_TECHO; b.push(v(u, 0, w, [0, 0, w], 0)); t.push(v(u, 1, w, [0, 0, w], 0)); }
    for (let i = 0; i < SEG_TECHO; i++) {
      if (w > 0) idx.push(b[i], b[i + 1], t[i + 1], b[i], t[i + 1], t[i]);
      else idx.push(b[i], t[i + 1], b[i + 1], b[i], t[i], t[i + 1]);
    }
  }
  // techo
  {
    const f: number[] = [], d: number[] = [];
    for (let i = 0; i <= SEG_TECHO; i++) { const u = i / SEG_TECHO; f.push(v(u, 1, 1, [0, 1, 0], 1)); d.push(v(u, 1, -1, [0, 1, 0], 1)); }
    for (let i = 0; i < SEG_TECHO; i++) idx.push(f[i], f[i + 1], d[i + 1], f[i], d[i + 1], d[i]);
  }
  // base
  {
    const a = v(0, 0, 1, [0, -1, 0], 2), b = v(1, 0, 1, [0, -1, 0], 2), c = v(1, 0, -1, [0, -1, 0], 2), d = v(0, 0, -1, [0, -1, 0], 2);
    idx.push(a, c, b, a, d, c);
  }
  // extremos
  for (const [u, s] of [[0, -1], [1, 1]] as const) {
    const a = v(u, 0, -1, [s, 0, 0], 3), b = v(u, 0, 1, [s, 0, 0], 3), c = v(u, 1, 1, [s, 0, 0], 3), d = v(u, 1, -1, [s, 0, 0], 3);
    if (s < 0) idx.push(a, b, c, a, c, d); else idx.push(a, c, b, a, d, c);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aCara', new THREE.Float32BufferAttribute(cara, 1));
  g.setIndex(idx);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(MAX_COLUMNAS * 4), 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('iQ', new THREE.InstancedBufferAttribute(new Float32Array(MAX_COLUMNAS * 4), 4).setUsage(THREE.DynamicDrawUsage));
  g.instanceCount = 0;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 80);
  return g;
}

const VERT_COL = /* glsl */ `
attribute float aCara;
attribute vec4 iA; // x0, x1 (escena), y base, fondo
attribute vec4 iQ; // q0, qm, q1 (alturas de escena sobre la base), brillo
uniform float uHuecoFrac;
uniform float uHuecoMax;
varying vec3 vN;
varying vec3 vV;
varying vec4 vA; // x local, ancho, y local, techo local
varying vec3 vB; // z local, fondo, brillo
varying float vCara;
float techo(float u) { return iQ.x * (1.0 - u) * (1.0 - 2.0 * u) + iQ.y * 4.0 * u * (1.0 - u) + iQ.z * u * (2.0 * u - 1.0); }
float dtecho(float u) { return iQ.x * (4.0 * u - 3.0) + iQ.y * (4.0 - 8.0 * u) + iQ.z * (4.0 * u - 1.0); }
void main() {
  float w0 = iA.y - iA.x;
  float g = min(uHuecoMax, w0 * uHuecoFrac);
  float x = mix(iA.x + g, iA.y - g, position.x);
  float u = (x - iA.x) / w0;
  float t = max(techo(u), 0.0);
  float y = iA.z + position.y * t;
  float z = position.z * iA.w * 0.5;
  vec3 n = normal;
  if (aCara > 0.5 && aCara < 1.5) n = normalize(vec3(-dtecho(u) / w0, 1.0, 0.0));
  vec4 mw = modelMatrix * vec4(x, y, z, 1.0);
  vec4 mv = viewMatrix * mw;
  vV = -mv.xyz;
  vN = normalize(normalMatrix * n);
  vA = vec4(x - (iA.x + g), w0 - 2.0 * g, y - iA.z, t);
  vB = vec3(z + iA.w * 0.5, iA.w, iQ.w);
  vCara = aCara;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG_COL = /* glsl */ `
uniform vec3 uColor;
uniform float uPasada; // 0: caras traseras, 1: delanteras
varying vec3 vN;
varying vec3 vV;
varying vec4 vA;
varying vec3 vB;
varying float vCara;
void main() {
  float t = vA.w;
  if (t < 0.015) discard;
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(vV);
  float c = clamp(abs(dot(N, V)), 0.0, 1.0);
  float fr = pow(1.0 - c, 3.0);
  vec3 R = reflect(-V, N);
  // estudio: un softbox grande arriba a la izquierda y otro lateral
  float sb1 = pow(max(dot(R, normalize(vec3(-0.45, 0.78, 0.45))), 0.0), 60.0);
  float sb2 = pow(max(dot(R, normalize(vec3(0.85, 0.2, 0.5))), 0.0), 24.0) * 0.35;
  // aristas: la segunda menor distancia a las caras de la caja (la menor es la de la propia cara)
  float dx = min(vA.x, vA.y - vA.x);
  float dy = min(vA.z, t - vA.z);
  float dz = min(vB.x, vB.y - vB.x);
  float m1 = min(dx, min(dy, dz));
  float m3 = max(dx, max(dy, dz));
  float m2 = dx + dy + dz - m1 - m3;
  float aw = fwidth(m2) * 1.6 + 0.003;
  // columnas muy finas en pantalla: las aristas se apagan para no hacer una pared de luz
  float px = vA.y / max(fwidth(vA.x), 1e-5);
  float arista = (1.0 - smoothstep(0.0, aw, m2)) * mix(0.2, 1.0, smoothstep(6.0, 30.0, px));
  float esTecho = step(0.5, vCara) * (1.0 - step(1.5, vCara));
  float luz = vB.z;
  float l1 = min(luz, 1.0);
  float altura = clamp(vA.z / max(t, 1e-3), 0.0, 1.0);
  vec3 cuerpo = uColor * (0.17 + 0.15 * altura) * (0.4 + 0.6 * l1);
  vec3 borde = mix(uColor, vec3(1.0), 0.3) * (0.38 + 0.6 * luz);
  vec3 col = cuerpo + uColor * 0.45 * fr + vec3(0.86, 0.93, 1.0) * (1.3 * sb1 + sb2) + borde * arista
           + uColor * esTecho * (0.3 + 0.35 * l1);
  float a = 0.08 + 0.08 * l1 + 0.42 * fr + sb1 + 0.4 * sb2 + 0.8 * arista + esTecho * (0.18 + 0.14 * l1);
  if (uPasada < 0.5) a *= 0.45;
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.95));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Las columnas de cristal: escribe sus atributos desde el reloj cuando cambia. */
export function Columnas({ reloj, color }: { reloj: React.MutableRefObject<RelojRiemann>; color: string }) {
  const geo = useMemo(() => geometriaColumna(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const mats = useMemo(() => {
    const u = () => ({ uColor: { value: new THREE.Color(color) }, uHuecoFrac: { value: HUECO_FRAC }, uHuecoMax: { value: HUECO_MAX }, uPasada: { value: 0 } });
    const atras = new THREE.ShaderMaterial({ vertexShader: VERT_COL, fragmentShader: FRAG_COL, uniforms: u(), transparent: true, depthWrite: false, side: THREE.BackSide });
    const delante = new THREE.ShaderMaterial({ vertexShader: VERT_COL, fragmentShader: FRAG_COL, uniforms: u(), transparent: true, depthWrite: false, side: THREE.FrontSide });
    delante.uniforms.uPasada.value = 1;
    return { atras, delante };
  }, [color]);
  useEffect(() => () => { mats.atras.dispose(); mats.delante.dispose(); }, [mats]);
  const vista = useRef<{ r: RelojRiemann | null; v: number }>({ r: null, v: -1 });
  useFrame(() => {
    const r = reloj.current;
    if (r === vista.current.r && r.version === vista.current.v) return;
    vista.current = { r, v: r.version };
    const c = r.curva;
    const sx = ANCHO_PLOT / (c.b - c.a), sy = ALTO_PLOT / c.yMax;
    const A = geo.getAttribute('iA') as THREE.InstancedBufferAttribute, Q = geo.getAttribute('iQ') as THREE.InstancedBufferAttribute;
    const a = A.array as Float32Array, q = Q.array as Float32Array;
    const n = r.nVista;
    for (let i = 0; i < n; i++) {
      a[i * 4] = X_IZQ + (r.vx0[i] - c.a) * sx; a[i * 4 + 1] = X_IZQ + (r.vx1[i] - c.a) * sx; a[i * 4 + 2] = Y_BASE; a[i * 4 + 3] = FONDO_COL;
      q[i * 4] = r.vq0[i] * sy; q[i * 4 + 1] = r.vqm[i] * sy; q[i * 4 + 2] = r.vq1[i] * sy; q[i * 4 + 3] = r.vluz[i];
    }
    A.needsUpdate = true; Q.needsUpdate = true;
    geo.instanceCount = n;
  });
  return (
    <group userData={{ pieza: 'columnas' }}>
      <mesh geometry={geo} material={mats.atras} frustumCulled={false} renderOrder={2} />
      <mesh geometry={geo} material={mats.delante} frustumCulled={false} renderOrder={3} />
    </group>
  );
}

// ───────────────────────────── franjas de error ─────────────────────────────

const MAX_V_FRANJA = 9000;
const VERT_FRANJA = /* glsl */ `
attribute float aSigno;
varying float vSigno;
varying vec2 vXY;
void main() {
  vSigno = aSigno;
  vXY = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG_FRANJA = /* glsl */ `
uniform vec3 uSobra;
uniform vec3 uFalta;
uniform float uPaso;
varying float vSigno;
varying vec2 vXY;
void main() {
  vec3 c = vSigno > 0.0 ? uSobra : uFalta;
  // rayado técnico a 45°: rayas finas de bajo contraste que se desvanecen si son más finas que ~2 px
  float t = fract((vXY.x + vXY.y) / uPaso);
  float fw = fwidth((vXY.x + vXY.y) / uPaso);
  float raya = smoothstep(0.0, fw * 1.5, t) * (1.0 - smoothstep(0.22, 0.22 + fw * 1.5, t));
  raya *= 1.0 - smoothstep(0.25, 0.6, fw);
  gl_FragColor = vec4(c * (0.5 + 0.75 * raya), 0.34 + 0.32 * raya);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const COLOR_SOBRA = '#ff4d6d';
export const COLOR_FALTA = '#4fe3ff';

/**
 * Las franjas entre el techo de cada columna y la curva, en el plano de la cara de delante. En cada
 * tramo donde el signo de (techo − f) cambia se inserta el cruce exacto (interpolado), así cada
 * triángulo es de un solo color.
 */
export function FranjasError({ reloj, visible }: { reloj: React.MutableRefObject<RelojRiemann>; visible: boolean }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_V_FRANJA * 3), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSigno', new THREE.BufferAttribute(new Float32Array(MAX_V_FRANJA), 1).setUsage(THREE.DynamicDrawUsage));
    g.setDrawRange(0, 0);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 80);
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT_FRANJA, fragmentShader: FRAG_FRANJA, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uSobra: { value: new THREE.Color(COLOR_SOBRA) }, uFalta: { value: new THREE.Color(COLOR_FALTA) }, uPaso: { value: 0.42 } },
  }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const vista = useRef<{ r: RelojRiemann | null; v: number }>({ r: null, v: -1 });
  useFrame(() => {
    const r = reloj.current;
    if (r === vista.current.r && r.version === vista.current.v) return;
    vista.current = { r, v: r.version };
    const c = r.curva, sx = ANCHO_PLOT / (c.b - c.a), sy = ALTO_PLOT / c.yMax;
    const P = geo.getAttribute('position') as THREE.BufferAttribute, S = geo.getAttribute('aSigno') as THREE.BufferAttribute;
    const p = P.array as Float32Array, s = S.array as Float32Array;
    const z = Z_FRENTE + 0.03;
    let nv = 0;
    // triángulo (dos vértices por muestra: curva y techo); se emiten como lista de triángulos
    const tri = (xa: number, fa: number, ta: number, xb: number, fb: number, tb: number, sg: number) => {
      if (nv + 6 > MAX_V_FRANJA) return;
      const put = (x: number, y: number) => { p[nv * 3] = X_IZQ + (x - c.a) * sx; p[nv * 3 + 1] = Y_BASE + y * sy; p[nv * 3 + 2] = z; s[nv] = sg; nv++; };
      put(xa, fa); put(xb, fb); put(xb, tb);
      put(xa, fa); put(xb, tb); put(xa, ta);
    };
    const n = r.nVista;
    const K = Math.max(3, Math.min(64, Math.ceil(360 / Math.max(1, n))));
    for (let i = 0; i < n; i++) {
      const x0 = r.vx0[i], x1 = r.vx1[i], w = x1 - x0;
      const q0 = r.vq0[i], qm = r.vqm[i], q1 = r.vq1[i];
      const top = (x: number) => { const u = (x - x0) / w; return q0 * (1 - u) * (1 - 2 * u) + qm * 4 * u * (1 - u) + q1 * u * (2 * u - 1); };
      // columna aún sin crecer: no hay franja (no se ha vertido)
      if (Math.max(q0, qm, q1) < 1e-4) continue;
      let xa = x0, fa = c.f(xa), ta = top(xa);
      for (let j = 1; j <= K; j++) {
        const xb = x0 + (w * j) / K, fb = c.f(xb), tb = top(xb);
        const da = ta - fa, db = tb - fb;
        if (da * db < 0) {
          const k = da / (da - db), xc = xa + (xb - xa) * k, yc = fa + (fb - fa) * k;
          tri(xa, fa, ta, xc, yc, yc, Math.sign(da));
          tri(xc, yc, yc, xb, fb, tb, Math.sign(db));
        } else tri(xa, fa, ta, xb, fb, tb, Math.sign(da + db) || 1);
        xa = xb; fa = fb; ta = tb;
      }
    }
    P.needsUpdate = true; S.needsUpdate = true;
    geo.setDrawRange(0, nv);
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={4} visible={visible} userData={{ pieza: 'franjas' }} />;
}

// ───────────────────────────── neón ─────────────────────────────

const VERT_TUBO = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG_NUCLEO = /* glsl */ `
uniform vec3 uColor;
uniform float uK;
varying vec3 vN;
varying vec3 vV;
void main() {
  float c = abs(dot(normalize(vN), normalize(vV)));
  vec3 col = mix(uColor, vec3(1.0), 0.35 * c * c) * uK * (0.7 + 0.5 * c);
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const FRAG_VAINA = /* glsl */ `
uniform vec3 uColor;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec3 N = normalize(vN), V = normalize(vV);
  float c = abs(dot(N, V));
  float fr = pow(1.0 - c, 2.2);
  vec3 Lz = normalize(vec3(-0.35, 0.75, 0.55));
  float esp = pow(max(dot(reflect(-V, N), Lz), 0.0), 70.0);
  vec3 col = uColor * 0.5 * c + vec3(0.82, 0.9, 1.0) * (0.5 * fr + 1.4 * esp);
  gl_FragColor = vec4(col, clamp(0.06 + 0.65 * fr + esp, 0.0, 1.0));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const VERT_DERRAME = /* glsl */ `
attribute float aLado;
varying float vLado;
void main() {
  vLado = aLado;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG_DERRAME = /* glsl */ `
uniform vec3 uColor;
uniform float uK;
varying float vLado;
void main() {
  float k = exp(-4.5 * vLado * vLado) * uK;
  gl_FragColor = vec4(uColor * k, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Cinta plana sobre la placa a lo largo de la curva (la luz que el neón derrama en el vidrio). */
function geometriaDerrame(pts: Float32Array, ancho: number, z: number): THREE.BufferGeometry {
  const n = pts.length / 3;
  const pos = new Float32Array(n * 6), lado = new Float32Array(n * 2), nor = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    let tx = pts[b * 3] - pts[a * 3], ty = pts[b * 3 + 1] - pts[a * 3 + 1];
    const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
    for (let s = 0; s < 2; s++) {
      const sg = s ? 1 : -1, k = i * 2 + s;
      pos[k * 3] = pts[i * 3] - ty * ancho * sg; pos[k * 3 + 1] = pts[i * 3 + 1] + tx * ancho * sg; pos[k * 3 + 2] = z;
      nor[k * 3 + 2] = 1; lado[k] = sg;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) { const p = i * 2; idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aLado', new THREE.BufferAttribute(lado, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/** La curva: tubo de neón con su vaina de vidrio y el derrame de luz sobre la placa del fondo. */
export function TuboNeon({ pts, color, intensidad = 2.2, radio = 0.17, calidad, zDerrame }: {
  pts: Float32Array; color: string; intensidad?: number; radio?: number; calidad: Calidad; zDerrame: number;
}) {
  const alta = calidad === 'alta';
  const geoN = useMemo(() => tuboPolilinea(pts, radio, alta ? 10 : 7, true), [pts, radio, alta]);
  const geoV = useMemo(() => tuboPolilinea(pts, radio * 2.2, alta ? 18 : 10, false), [pts, radio, alta]);
  const geoD = useMemo(() => {
    const q = new Float32Array(pts);
    for (let i = 2; i < q.length; i += 3) q[i] = zDerrame;
    return geometriaDerrame(q, 2.2, zDerrame);
  }, [pts, zDerrame]);
  useEffect(() => () => { geoN.dispose(); geoV.dispose(); geoD.dispose(); }, [geoN, geoV, geoD]);
  const mats = useMemo(() => {
    const c = new THREE.Color(color);
    return {
      n: new THREE.ShaderMaterial({ vertexShader: VERT_TUBO, fragmentShader: FRAG_NUCLEO, uniforms: { uColor: { value: c.clone() }, uK: { value: intensidad } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
      v: new THREE.ShaderMaterial({ vertexShader: VERT_TUBO, fragmentShader: FRAG_VAINA, uniforms: { uColor: { value: c.clone() } }, transparent: true, depthWrite: false }),
      d: new THREE.ShaderMaterial({ vertexShader: VERT_DERRAME, fragmentShader: FRAG_DERRAME, uniforms: { uColor: { value: c.clone() }, uK: { value: 0.16 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    };
  }, [color, intensidad]);
  useEffect(() => () => { mats.n.dispose(); mats.v.dispose(); mats.d.dispose(); }, [mats]);
  return (
    <group userData={{ pieza: 'curva' }}>
      <mesh geometry={geoD} material={mats.d} renderOrder={1} frustumCulled={false} />
      <mesh geometry={geoN} material={mats.n} renderOrder={6} />
      <mesh geometry={geoV} material={mats.v} renderOrder={7} />
    </group>
  );
}

// ───────────────────────────── nodos de evaluación y barrido ─────────────────────────────

let TEX_HALO: THREE.Texture | null = null;
export function texHalo(): THREE.Texture | null {
  if (TEX_HALO || typeof document === 'undefined') return TEX_HALO;
  const c = crearLienzo(128, 128), g = c.getContext('2d');
  if (!g) return null;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.18, 'rgba(255,255,255,0.55)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  TEX_HALO = texturaDeLienzo(c, { mipmaps: true, srgb: false });
  return TEX_HALO;
}

const VERT_HAZ = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG_HAZ = /* glsl */ `
uniform vec3 uColor;
uniform float uK;
varying vec2 vUv;
void main() {
  float x = (vUv.x - 0.5) * 2.0;
  float k = exp(-9.0 * x * x) * smoothstep(0.0, 0.12, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y)) * uK;
  gl_FragColor = vec4(uColor * k, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** El frente del barrido mientras se vierte: una cortina de luz vertical en la x que avanza. */
export function Barrido({ reloj, color }: { reloj: React.MutableRefObject<RelojRiemann>; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT_HAZ, fragmentShader: FRAG_HAZ, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(color) }, uK: { value: 1.2 } },
  }), [color]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const m = ref.current; if (!m) return;
    const l = reloj.current.lectura(), c = reloj.current.curva;
    m.visible = l.xBarrido !== null;
    if (l.xBarrido !== null) m.position.set(X_IZQ + ((l.xBarrido - c.a) / (c.b - c.a)) * ANCHO_PLOT, Y_BASE + ALTO_PLOT * 0.52, Z_FRENTE + 0.12);
  });
  return (
    <mesh ref={ref} material={mat} renderOrder={5} visible={false}>
      <planeGeometry args={[1.6, ALTO_PLOT * 1.04]} />
    </mesh>
  );
}

// ───────────────────────────── probeta ─────────────────────────────

const FRAG_VIDRIO = /* glsl */ `
uniform vec3 uColor;
uniform float uBase;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec3 N = normalize(vN), V = normalize(vV);
  if (!gl_FrontFacing) N = -N;
  float c = clamp(abs(dot(N, V)), 0.0, 1.0);
  float fr = pow(1.0 - c, 2.5);
  vec3 R = reflect(-V, N);
  float sb1 = pow(max(dot(R, normalize(vec3(-0.45, 0.78, 0.45))), 0.0), 50.0);
  float sb2 = pow(max(dot(R, normalize(vec3(0.85, 0.2, 0.5))), 0.0), 20.0) * 0.5;
  // franja vertical del softbox en el vidrio cilíndrico
  float franja = pow(max(dot(R, normalize(vec3(-0.62, 0.08, 0.78))), 0.0), 26.0);
  vec3 col = uColor * (0.12 + 0.7 * fr) + vec3(0.9, 0.95, 1.0) * (1.4 * sb1 + sb2 + 1.1 * franja);
  float a = uBase + 0.55 * fr + sb1 + 0.5 * sb2 + 0.7 * franja;
  gl_FragColor = vec4(col, clamp(a, 0.0, 0.9));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
/** Vidrio claro: casi invisible de frente y brillante en los bordes y los reflejos (Fresnel). */
export function materialVidrio(color: string, base = 0.03): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: VERT_TUBO, fragmentShader: FRAG_VIDRIO, transparent: true, depthWrite: false, side: THREE.FrontSide,
    uniforms: { uColor: { value: new THREE.Color(color) }, uBase: { value: base } },
  });
}

const R_EXT = R_PROBETA + PARED_PROBETA;
const Y_FONDO_EXT = Y_BASE - 0.5;
const Y_BOCA = Y_BASE + ALTO_VIDRIO_PROBETA;
/** Ángulo del torno que mira hacia la cámara (LatheGeometry mide desde +Z hacia +X). */
const CENTRO_ESCALA = -0.16;

/** Probeta graduada con pie hexagonal; el líquido sube hasta `reloj.nivel` (unidades de área). */
export function Probeta({ reloj, mats, color, escala, texEscala, exacta, calidad }: {
  reloj: React.MutableRefObject<RelojRiemann>; mats: MatsM9; color: string; escala: number;
  texEscala: THREE.Texture | null; exacta: number | null; calidad: Calidad;
}) {
  const alta = calidad === 'alta';
  const geos = useMemo(() => {
    const seg = alta ? 64 : 40;
    // pared: por fuera de abajo arriba, labio con pico abierto, y por dentro de arriba abajo
    const vidrio = tornear([
      [0.001, Y_FONDO_EXT], [R_EXT - 0.35, Y_FONDO_EXT], [R_EXT, Y_FONDO_EXT + 0.35], [R_EXT, Y_BOCA - 0.7],
      [R_EXT + 0.32, Y_BOCA - 0.18], [R_EXT + 0.3, Y_BOCA], [R_PROBETA + 0.06, Y_BOCA], [R_PROBETA, Y_BOCA - 0.3],
      [R_PROBETA, Y_BASE + 0.25], [R_PROBETA - 0.25, Y_BASE], [0.001, Y_BASE],
    ], seg);
    // pie hexagonal con chaflanes (caras planas: normales por cara)
    const pieT = tornear([[0.001, ALTO_ZOCALO], [4.3, ALTO_ZOCALO], [4.55, ALTO_ZOCALO + 0.22], [4.55, ALTO_ZOCALO + ALTO_PIE - 0.25], [4.2, ALTO_ZOCALO + ALTO_PIE], [R_EXT, ALTO_ZOCALO + ALTO_PIE], [R_EXT, Y_FONDO_EXT + 0.05], [0.001, Y_FONDO_EXT + 0.05]], 6, Math.PI / 6);
    const pie = pieT.toNonIndexed(); pie.computeVertexNormals(); pieT.dispose();
    const banda = bandaSobrePerfil(() => R_EXT + 0.004, Y_BASE, Y_BASE + ALTO_PLOT, { arco: 1.25, centro: CENTRO_ESCALA, filas: 8, segmentos: 24 });
    // líquido: cilindro de alto 1 (se escala) y menisco cóncavo (agua moja el vidrio)
    const liquido = new THREE.CylinderGeometry(R_PROBETA - 0.03, R_PROBETA - 0.03, 1, seg, 1, true);
    liquido.translate(0, 0.5, 0);
    const pm: [number, number][] = [];
    for (let i = 0; i <= 12; i++) { const r = ((R_PROBETA - 0.03) * i) / 12; pm.push([Math.max(0.001, r), 0.32 * (r / (R_PROBETA - 0.03)) ** 4]); }
    const menisco = tornear(pm, seg);
    const aro = new THREE.TorusGeometry(R_PROBETA - 0.05, 0.05, 8, seg);
    aro.rotateX(Math.PI / 2);
    const marca = new THREE.TorusGeometry(R_EXT + 0.14, 0.075, 10, seg);
    marca.rotateX(Math.PI / 2);
    return { vidrio, pie, banda, liquido, menisco, aro, marca };
  }, [alta]);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); }, [geos]);
  const matsL = useMemo(() => {
    const c = new THREE.Color(color);
    return {
      liquido: new THREE.MeshPhysicalMaterial({
        color: c.clone().multiplyScalar(0.55), emissive: c.clone(), emissiveIntensity: 0.22, roughness: 0.15, metalness: 0,
        clearcoat: 0.6, transparent: true, opacity: 0.78, depthWrite: true, side: THREE.FrontSide, envMapIntensity: 1.2, name: 'm9-liquido',
      }),
      menisco: new THREE.MeshPhysicalMaterial({
        color: c.clone().multiplyScalar(0.7), emissive: c.clone(), emissiveIntensity: 0.4, roughness: 0.05, clearcoat: 1,
        transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6, name: 'm9-menisco',
      }),
      aro: new THREE.MeshBasicMaterial({ color: c.clone().multiplyScalar(1.6), toneMapped: true, name: 'm9-aro' }),
      marca: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd27a').multiplyScalar(1.5), toneMapped: true, name: 'm9-marca' }),
      escala: new THREE.MeshBasicMaterial({ map: texEscala, transparent: true, depthWrite: false, toneMapped: true, name: 'm9-escala-probeta' }),
      vidrio: materialVidrio('#cfeaff', 0.025),
      pie: materialVidrio('#9fd6f0', 0.1),
    };
  }, [color, texEscala]);
  useEffect(() => () => { Object.values(matsL).forEach((m) => m.dispose()); }, [matsL]);
  const refL = useRef<THREE.Mesh>(null), refM = useRef<THREE.Mesh>(null), refA = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const r = reloj.current;
    const s = Math.max(0, Math.min(escala * 1.04, r.nivel));
    const alto = (s / escala) * ALTO_PLOT;
    const vis = alto > 0.03;
    if (refL.current) { refL.current.visible = vis; refL.current.scale.set(1, Math.max(1e-3, alto), 1); }
    if (refM.current) { refM.current.visible = vis; refM.current.position.y = Y_BASE + alto - 0.02; }
    if (refA.current) { refA.current.visible = vis; refA.current.position.y = Y_BASE + alto + 0.3; }
  });
  const yExacta = exacta === null ? null : Y_BASE + (exacta / escala) * ALTO_PLOT;
  return (
    <group position={[X_PROBETA, 0, Z_PROBETA]} userData={{ pieza: 'probeta' }}>
      <mesh geometry={geos.pie} material={matsL.pie} renderOrder={1} />
      <mesh ref={refL} geometry={geos.liquido} material={matsL.liquido} position={[0, Y_BASE, 0]} renderOrder={2} />
      <mesh ref={refM} geometry={geos.menisco} material={matsL.menisco} renderOrder={3} />
      <mesh ref={refA} geometry={geos.aro} material={matsL.aro} renderOrder={4} />
      <mesh geometry={geos.vidrio} material={matsL.vidrio} renderOrder={5} />
      {texEscala && <mesh geometry={geos.banda} material={matsL.escala} renderOrder={6} />}
      {yExacta !== null && <mesh geometry={geos.marca} material={matsL.marca} position={[0, yExacta, 0]} renderOrder={7} userData={{ pieza: 'marca' }} />}
    </group>
  );
}
export const PROBETA = { R_EXT, Y_BOCA };

// ───────────────────────────── utilidades ─────────────────────────────

/** Puntos (escena) de la curva entre a y b, en `n` tramos, en el plano z. */
export function puntosCurva(c: Curva, n: number, z: number): Float32Array {
  const p = new Float32Array((n + 1) * 3);
  const sx = ANCHO_PLOT / (c.b - c.a), sy = ALTO_PLOT / c.yMax;
  for (let i = 0; i <= n; i++) { const x = c.a + ((c.b - c.a) * i) / n; p[i * 3] = X_IZQ + (x - c.a) * sx; p[i * 3 + 1] = Y_BASE + c.f(x) * sy; p[i * 3 + 2] = z; }
  return p;
}

/** Cuenta mallas y normales nulas de una escena (una normal nula deja la pantalla negra). */
export function contarNormalesCero(o: THREE.Object3D): { mallas: number; normalesCero: number } {
  let mallas = 0, normalesCero = 0;
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    mallas++;
    const n = (m.geometry as THREE.BufferGeometry | undefined)?.getAttribute('normal');
    if (!n) return;
    for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
  });
  return { mallas, normalesCero };
}
