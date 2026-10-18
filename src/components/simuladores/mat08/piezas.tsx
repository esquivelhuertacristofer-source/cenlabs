'use client';
/**
 * mat08/piezas.tsx — las piezas del banco de trazado de la derivada (1 u = 1 cm).
 *
 *  - Soporte: zócalo de grafito con filete de latón, dos postes de aluminio torneados
 *    con brida y remate, y marcos de aluminio anodizado con sus mordazas.
 *  - Placas de vidrio ahumado con la retícula y la escala GRABADAS (lienzo a alta
 *    resolución con mipmaps y anisotropía: un objeto físico, no un cartel).
 *  - Tubos de neón: núcleo emisivo y vaina de vidrio con brillo de borde (Fresnel); la
 *    luz que derraman sobre el vidrio es una cinta aditiva de caída gaussiana. El de f′
 *    se descubre con una máscara (las casillas por donde pasó el trazador).
 *  - Haces: cintas orientadas a la cámara con núcleo y halo gaussianos (secante,
 *    tangente, catetos h y Δf, guías), todas en una sola llamada de dibujo.
 *  - Cohete del reto (tobera de campana, cuerpo, ojiva ojival, aletas en flecha) y su
 *    torre de celosía. La llama mide ∝ (a + g)/g: el empuje por unidad de masa.
 *
 * Materiales sin ruido de alta frecuencia: superficies lisas con reflejos del entorno.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeElements } from '@react-three/fiber';
import { tornear, cajaRedondeada, cilindro, tuboPolilinea, extruir, crearLienzo, texturaDeLienzo, type Calidad, type P2 } from '../_kit';
import {
  PLACA_F, PLACA_D, MARCO, GROSOR_VIDRIO, Z_GRABADO, ALTO_ZOCALO, X_POSTE, X_POSTE_IZQ, ALTO_POSTE, ZOCALO,
  X_TORRE, ALTO_TORRE, type Placa,
} from './banco';
import { marcas, num } from './derivada';

type GroupProps = ThreeElements['group'];

// ───────────────────────────── materiales ─────────────────────────────

export interface MatsM8 {
  vidrio: THREE.MeshPhysicalMaterial;
  marco: THREE.MeshStandardMaterial;
  aluminio: THREE.MeshStandardMaterial;
  grafito: THREE.MeshPhysicalMaterial;
  laton: THREE.MeshStandardMaterial;
  goma: THREE.MeshStandardMaterial;
  suelo: THREE.MeshStandardMaterial;
  blanco: THREE.MeshPhysicalMaterial;
  rojo: THREE.MeshPhysicalMaterial;
  tobera: THREE.MeshStandardMaterial;
  oscuro: THREE.MeshStandardMaterial;
  acero: THREE.MeshStandardMaterial;
  ventana: THREE.MeshPhysicalMaterial;
}

export function useMatsM8(calidad: Calidad): MatsM8 {
  const m = useMemo<MatsM8>(() => {
    const alta = calidad === 'alta';
    return {
      // vidrio ahumado: casi negro, con capa de barniz que se lleva los reflejos del estudio
      vidrio: new THREE.MeshPhysicalMaterial({
        color: '#122331', metalness: 0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05,
        transparent: true, opacity: 0.9, envMapIntensity: 1.15, specularIntensity: 1, ior: 1.5, name: 'm8-vidrio',
      }),
      marco: new THREE.MeshStandardMaterial({ color: '#3b424b', metalness: 0.92, roughness: 0.3, envMapIntensity: 1.1, name: 'm8-marco' }),
      aluminio: new THREE.MeshStandardMaterial({ color: '#c3c9cf', metalness: 1, roughness: 0.24, name: 'm8-aluminio' }),
      grafito: new THREE.MeshPhysicalMaterial({ color: '#151a20', metalness: 0.25, roughness: 0.42, clearcoat: alta ? 0.7 : 0.3, clearcoatRoughness: 0.22, name: 'm8-grafito' }),
      laton: new THREE.MeshStandardMaterial({ color: '#cfa65a', metalness: 1, roughness: 0.27, name: 'm8-laton' }),
      goma: new THREE.MeshStandardMaterial({ color: '#0e1013', roughness: 0.88, metalness: 0, name: 'm8-goma' }),
      suelo: new THREE.MeshStandardMaterial({ color: '#0a0e13', roughness: 0.62, metalness: 0.18, name: 'm8-suelo' }),
      blanco: new THREE.MeshPhysicalMaterial({ color: '#e9edf0', roughness: 0.36, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.18, name: 'm8-blanco' }),
      rojo: new THREE.MeshPhysicalMaterial({ color: '#b8322a', roughness: 0.38, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.2, name: 'm8-rojo' }),
      tobera: new THREE.MeshStandardMaterial({ color: '#8f8a86', metalness: 1, roughness: 0.3, side: THREE.DoubleSide, name: 'm8-tobera' }),
      oscuro: new THREE.MeshStandardMaterial({ color: '#20262d', roughness: 0.5, metalness: 0.3, name: 'm8-oscuro' }),
      acero: new THREE.MeshStandardMaterial({ color: '#4c5560', roughness: 0.4, metalness: 0.85, name: 'm8-acero' }),
      ventana: new THREE.MeshPhysicalMaterial({ color: '#0f2a3a', roughness: 0.05, metalness: 0, clearcoat: 1, envMapIntensity: 1.6, name: 'm8-ventana' }),
    };
  }, [calidad]);
  useEffect(() => () => { Object.values(m).forEach((x) => (x as THREE.Material).dispose()); }, [m]);
  return m;
}

// ───────────────────────────── grabado del vidrio ─────────────────────────────

const familia = () => (typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui');

/**
 * Retícula y escala grabadas en una placa: líneas finas cada media división, gruesas en
 * las marcas, el eje y = 0 y el contorno del área de trazado, números en los márgenes.
 */
export function texturaGrabado(p: Placa, rx: [number, number], ry: [number, number], titulos: { x: string; y: string }, calidad: Calidad): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const pxCm = calidad === 'alta' ? 34 : 22;
  const W = Math.round(p.w * pxCm), H = Math.round(p.h * pxCm);
  const c = crearLienzo(W, H);
  const g = c.getContext('2d');
  if (!g) return null;
  // del sistema de la escena (cm) al lienzo (px); y hacia abajo
  const ix = (X: number) => (X - (p.cx - p.w / 2)) * pxCm;
  const iy = (Y: number) => (p.cy + p.h / 2 - Y) * pxCm;
  const X = (x: number) => p.x0 + ((x - rx[0]) / (rx[1] - rx[0])) * (p.x1 - p.x0);
  const Y = (y: number) => p.y0 + ((y - ry[0]) / (ry[1] - ry[0])) * (p.y1 - p.y0);
  const mx = marcas(rx[0], rx[1], 8), my = marcas(ry[0], ry[1], p.y1 - p.y0 > 16 ? 6 : 4);
  const pasoX = mx.length > 1 ? mx[1] - mx[0] : 1, pasoY = my.length > 1 ? my[1] - my[0] : 1;
  g.clearRect(0, 0, W, H);
  g.lineCap = 'round';
  const linea = (x0: number, y0: number, x1: number, y1: number, a: number, w: number) => {
    g.strokeStyle = `rgba(205,226,240,${a})`; g.lineWidth = w;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
  };
  const L = ix(p.x0), R = ix(p.x1), T = iy(p.y1), B = iy(p.y0);
  // retícula menor (media división) y mayor
  for (let v = Math.ceil(rx[0] / (pasoX / 2)) * (pasoX / 2); v <= rx[1] + 1e-9; v += pasoX / 2) linea(ix(X(v)), T, ix(X(v)), B, 0.1, pxCm * 0.045);
  for (let v = Math.ceil(ry[0] / (pasoY / 2)) * (pasoY / 2); v <= ry[1] + 1e-9; v += pasoY / 2) linea(L, iy(Y(v)), R, iy(Y(v)), 0.1, pxCm * 0.045);
  for (const v of mx) linea(ix(X(v)), T, ix(X(v)), B, 0.22, pxCm * 0.06);
  for (const v of my) linea(L, iy(Y(v)), R, iy(Y(v)), 0.22, pxCm * 0.06);
  // contorno y ejes
  g.strokeStyle = 'rgba(205,226,240,0.36)'; g.lineWidth = pxCm * 0.07; g.strokeRect(L, T, R - L, B - T);
  if (ry[0] < 0 && ry[1] > 0) linea(L, iy(Y(0)), R, iy(Y(0)), 0.62, pxCm * 0.1);
  if (rx[0] < 0 && rx[1] > 0) linea(ix(X(0)), T, ix(X(0)), B, 0.5, pxCm * 0.09);
  // marcas cortas en el borde
  for (const v of mx) linea(ix(X(v)), B, ix(X(v)), B + pxCm * 0.45, 0.45, pxCm * 0.06);
  for (const v of my) linea(L - pxCm * 0.45, iy(Y(v)), L, iy(Y(v)), 0.45, pxCm * 0.06);
  // números grabados
  const f = familia();
  const dX = pasoX < 1 ? (pasoX < 0.1 ? 2 : 1) : 0, dY = pasoY < 1 ? (pasoY < 0.1 ? 2 : 1) : 0;
  g.fillStyle = 'rgba(220,236,248,0.8)';
  g.font = `600 ${Math.round(pxCm * 1.4)}px ${f}`;
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (const v of mx) g.fillText(num(v, dX), ix(X(v)), B + pxCm * 0.55);
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (const v of my) g.fillText(num(v, dY), L - pxCm * 0.65, iy(Y(v)));
  // títulos de los ejes (cortos, en cursiva)
  g.fillStyle = 'rgba(220,236,248,0.62)';
  g.font = `italic 600 ${Math.round(pxCm * 1.3)}px ${f}`;
  g.textAlign = 'right'; g.textBaseline = 'bottom';
  g.fillText(titulos.x, R - pxCm * 0.3, B - pxCm * 0.25);
  g.textAlign = 'left'; g.textBaseline = 'bottom';
  g.fillText(titulos.y, L + pxCm * 0.35, T - pxCm * 0.15);
  const tex = texturaDeLienzo(c, { mipmaps: true, srgb: true });
  tex.anisotropy = 8;
  return tex;
}

/** Placa de vidrio ahumado con su grabado y su marco de aluminio. */
export function PlacaGrabada({ placa, tex, mats, pieza }: { placa: Placa; tex: THREE.Texture | null; mats: MatsM8; pieza: string }) {
  const matGrabado = useMemo(() => new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: true, color: '#d8ecf8', name: 'm8-grabado',
  }), [tex]);
  useEffect(() => () => matGrabado.dispose(), [matGrabado]);
  const { cx, cy, w, h } = placa;
  const a = MARCO.ancho, fz = MARCO.fondo;
  return (
    <group userData={{ pieza }}>
      <mesh geometry={cajaRedondeada(w, h, GROSOR_VIDRIO, 0.12, 2)} material={mats.vidrio} position={[cx, cy, 0]} renderOrder={0} />
      {tex && (
        <mesh position={[cx, cy, Z_GRABADO]} material={matGrabado} renderOrder={1}>
          <planeGeometry args={[w, h]} />
        </mesh>
      )}
      {/* marco: dos largueros y dos montantes con aristas redondeadas */}
      <mesh geometry={cajaRedondeada(w + 2 * a, a, fz, 0.22, 3)} material={mats.marco} position={[cx, cy + h / 2 + a / 2, 0]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(w + 2 * a, a, fz, 0.22, 3)} material={mats.marco} position={[cx, cy - h / 2 - a / 2, 0]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(a, h, fz, 0.22, 3)} material={mats.marco} position={[cx - w / 2 - a / 2, cy, 0]} castShadow />
      <mesh geometry={cajaRedondeada(a, h, fz, 0.22, 3)} material={mats.marco} position={[cx + w / 2 + a / 2, cy, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── soporte ─────────────────────────────

/** Zócalo, postes y mordazas. */
export function Soporte({ mats }: { mats: MatsM8 }) {
  const brida = useMemo(() => tornear([[0.001, 0], [1.9, 0], [1.9, 0.35], [1.35, 0.55], [0.8, 0.75], [0.8, 0.8], [0.001, 0.8]], 40), []);
  const remate = useMemo(() => tornear([[0.001, 0], [0.82, 0], [0.82, 0.35], [0.62, 0.62], [0.2, 0.75], [0.001, 0.76]], 40), []);
  useEffect(() => () => { brida.dispose(); remate.dispose(); }, [brida, remate]);
  const largo = ZOCALO.x1 - ZOCALO.x0, cxZ = (ZOCALO.x0 + ZOCALO.x1) / 2;
  const altoPoste = ALTO_POSTE - ALTO_ZOCALO - 0.8;
  const mordazas: [number, number][] = [];
  for (const p of [PLACA_F, PLACA_D]) for (const y of p === PLACA_F ? [p.cy - p.h * 0.28, p.cy + p.h * 0.28] : [p.cy]) mordazas.push([p.cx, y]);
  return (
    <group userData={{ pieza: 'soporte' }}>
      {/* zócalo de grafito con filete de latón */}
      <mesh geometry={cajaRedondeada(largo, ALTO_ZOCALO, ZOCALO.fondo, 0.5, 4)} material={mats.grafito} position={[cxZ, ALTO_ZOCALO / 2, 0]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(largo - 1.2, 0.16, 0.16, 0.06, 2)} material={mats.laton} position={[cxZ, ALTO_ZOCALO - 0.55, ZOCALO.fondo / 2 + 0.02]} />
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} geometry={cilindro(1.0, 1.15, 0.5, 24)} material={mats.goma} position={[cxZ + sx * (largo / 2 - 3), -0.05, sz * (ZOCALO.fondo / 2 - 2.5)]} />
      ))}
      {[X_POSTE_IZQ, X_POSTE].map((x) => (
        <group key={x} position={[x, ALTO_ZOCALO, 0]}>
          <mesh geometry={brida} material={mats.aluminio} castShadow />
          <mesh geometry={cilindro(0.72, 0.72, altoPoste, 40)} material={mats.aluminio} position={[0, 0.8 + altoPoste / 2, 0]} castShadow />
          <mesh geometry={remate} material={mats.aluminio} position={[0, 0.8 + altoPoste, 0]} castShadow />
        </group>
      ))}
      {/* mordazas: del poste al marco, con dos tornillos de latón */}
      {mordazas.map(([cx, y], i) => {
        const p = y > PLACA_D.cy + PLACA_D.h ? PLACA_F : PLACA_D;
        return [-1, 1].map((s) => {
          const xMarco = cx + s * (p.w / 2 + MARCO.ancho);
          const xPoste = s < 0 ? X_POSTE_IZQ : X_POSTE;
          const largoM = Math.abs(xPoste - xMarco) + 0.6;
          const xc = (xPoste + xMarco) / 2;
          return (
            <group key={`${i}${s}`} position={[xc, y, 0]}>
              <mesh geometry={cajaRedondeada(largoM, 2.2, 2.2, 0.35, 3)} material={mats.marco} castShadow />
              {[-0.55, 0.55].map((dy) => (
                <mesh key={dy} geometry={cilindro(0.26, 0.26, 0.2, 20)} material={mats.laton} position={[0, dy, 1.16]} rotation-x={Math.PI / 2} />
              ))}
            </group>
          );
        });
      })}
    </group>
  );
}

// ───────────────────────────── neón ─────────────────────────────

const VERT_TUBO = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying float vX;
void main() {
  vX = position.x;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;

const MASCARA = /* glsl */ `
uniform sampler2D uMask;
uniform float uUsarMask;
uniform float uX0;
uniform float uX1;
float mascara(float x) {
  if (uUsarMask < 0.5) return 1.0;
  return texture2D(uMask, vec2(clamp((x - uX0) / (uX1 - uX0), 0.0, 1.0), 0.5)).r;
}`;

const FRAG_NUCLEO = /* glsl */ `
uniform vec3 uColor;
uniform float uK;
uniform float uAlfa;
varying vec3 vN;
varying vec3 vV;
varying float vX;
${MASCARA}
void main() {
  if (mascara(vX) < 0.5) discard;
  float c = abs(dot(normalize(vN), normalize(vV)));
  // el centro del filamento es casi blanco; el borde, del color del gas
  vec3 col = mix(uColor, vec3(1.0), 0.32 * c * c) * uK * (0.7 + 0.5 * c);
  gl_FragColor = vec4(col * uAlfa, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const FRAG_VAINA = /* glsl */ `
uniform vec3 uColor;
uniform float uAlfa;
varying vec3 vN;
varying vec3 vV;
varying float vX;
${MASCARA}
void main() {
  if (mascara(vX) < 0.5) discard;
  vec3 N = normalize(vN), V = normalize(vV);
  float c = abs(dot(N, V));
  float fr = pow(1.0 - c, 2.2);
  // brillo especular de un softbox arriba a la izquierda (en el espacio de la vista)
  vec3 Lz = normalize(vec3(-0.35, 0.75, 0.55));
  float esp = pow(max(dot(reflect(-V, N), Lz), 0.0), 70.0);
  vec3 col = uColor * 0.55 * c + vec3(0.82, 0.9, 1.0) * (0.5 * fr + 1.4 * esp);
  float a = clamp(0.08 + 0.7 * fr + esp, 0.0, 1.0) * uAlfa;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const VERT_DERRAME = /* glsl */ `
attribute float aLado;
attribute float aFin;
varying float vLado;
varying float vFin;
varying float vX;
void main() {
  vLado = aLado; vFin = aFin; vX = position.x;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG_DERRAME = /* glsl */ `
uniform vec3 uColor;
uniform float uK;
uniform float uAlfa;
varying float vLado;
varying float vFin;
varying float vX;
${MASCARA}
void main() {
  float m = mascara(vX);
  if (m < 0.5) discard;
  float k = exp(-4.5 * vLado * vLado) * uK * vFin * vFin * (3.0 - 2.0 * vFin);
  gl_FragColor = vec4(uColor * k * uAlfa, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Máscara 1D (N casillas) para descubrir un tubo: 255 = dibujado. */
export function crearMascara(n: number): THREE.DataTexture {
  const t = new THREE.DataTexture(new Uint8Array(n * 4), n, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}
export function escribirMascara(t: THREE.DataTexture, visitado: Uint8Array) {
  const d = t.image.data as Uint8Array;
  for (let i = 0; i < visitado.length; i++) { const v = visitado[i] ? 255 : 0; d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  t.needsUpdate = true;
}

/**
 * Cinta plana sobre el vidrio a lo largo de la curva (la luz que el neón derrama).
 * Se prolonga `ancho` más allá de cada extremo y se apaga ahí (aFin: 0 → 1), para que el derrame
 * acabe en un halo redondo y no en un corte recto que, junto al vidrio oscuro, parece una cuña negra.
 */
function geometriaDerrame(pts0: Float32Array, ancho: number, z: number): THREE.BufferGeometry {
  const n0 = pts0.length / 3;
  const ext = (i: number, j: number): [number, number, number] => {
    const dx = pts0[i * 3] - pts0[j * 3], dy = pts0[i * 3 + 1] - pts0[j * 3 + 1], L = Math.hypot(dx, dy) || 1;
    return [pts0[i * 3] + (dx / L) * ancho, pts0[i * 3 + 1] + (dy / L) * ancho, pts0[i * 3 + 2]];
  };
  const pts = new Float32Array((n0 + 2) * 3);
  pts.set(ext(0, 1), 0); pts.set(pts0, 3); pts.set(ext(n0 - 1, n0 - 2), (n0 + 1) * 3);
  const n = n0 + 2;
  const pos = new Float32Array(n * 2 * 3), lado = new Float32Array(n * 2), nor = new Float32Array(n * 2 * 3), fin = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
    let tx = pts[b * 3] - pts[a * 3], ty = pts[b * 3 + 1] - pts[a * 3 + 1];
    const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
    const f = i === 0 || i === n - 1 ? 0 : 1;
    for (let s = 0; s < 2; s++) {
      const sg = s ? 1 : -1, k = (i * 2 + s);
      pos[k * 3] = pts[i * 3] - ty * ancho * sg; pos[k * 3 + 1] = pts[i * 3 + 1] + tx * ancho * sg; pos[k * 3 + 2] = z;
      nor[k * 3 + 2] = 1; lado[k] = sg; fin[k] = f;
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < n - 1; i++) { const p = i * 2; idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aLado', new THREE.BufferAttribute(lado, 1));
  g.setAttribute('aFin', new THREE.BufferAttribute(fin, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

export interface MandoNeon { alfa: number }

/**
 * Tubo de neón por los puntos `pts` (escena), con su derrame de luz sobre el vidrio.
 * `mascara` (opcional) descubre sólo las casillas dibujadas entre x0 y x1 de la escena.
 */
export function TuboNeon({ pts, color, intensidad = 2.2, radio = 0.17, calidad, mascara, x0, x1, zVidrio, mando, pieza }: {
  pts: Float32Array; color: string; intensidad?: number; radio?: number; calidad: Calidad;
  mascara?: THREE.Texture | null; x0?: number; x1?: number; zVidrio: number; mando?: React.MutableRefObject<MandoNeon>; pieza: string;
}) {
  const alta = calidad === 'alta';
  const geoN = useMemo(() => tuboPolilinea(pts, radio, alta ? 10 : 7, true), [pts, radio, alta]);
  // la vaina sin tapas: una tapa vista de canto taparía el extremo encendido del filamento con un disco gris
  const geoV = useMemo(() => tuboPolilinea(pts, radio * 2.25, alta ? 18 : 10, false), [pts, radio, alta]);
  const geoD = useMemo(() => geometriaDerrame(pts, 2.4, zVidrio), [pts, zVidrio]);
  useEffect(() => () => { geoN.dispose(); geoV.dispose(); geoD.dispose(); }, [geoN, geoV, geoD]);
  const unif = useMemo(() => {
    const c = new THREE.Color(color);
    const m = { uMask: { value: mascara ?? null }, uUsarMask: { value: mascara ? 1 : 0 }, uX0: { value: x0 ?? 0 }, uX1: { value: x1 ?? 1 } };
    return {
      n: { ...m, uColor: { value: c.clone() }, uK: { value: intensidad }, uAlfa: { value: 1 } },
      v: { ...m, uColor: { value: c.clone() }, uAlfa: { value: 1 } },
      d: { ...m, uColor: { value: c.clone() }, uK: { value: 0.2 }, uAlfa: { value: 1 } },
    };
  }, [color, intensidad, mascara, x0, x1]);
  const mats = useMemo(() => ({
    n: new THREE.ShaderMaterial({ vertexShader: VERT_TUBO, fragmentShader: FRAG_NUCLEO, uniforms: unif.n, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
    v: new THREE.ShaderMaterial({ vertexShader: VERT_TUBO, fragmentShader: FRAG_VAINA, uniforms: unif.v, transparent: true, depthWrite: false }),
    d: new THREE.ShaderMaterial({ vertexShader: VERT_DERRAME, fragmentShader: FRAG_DERRAME, uniforms: unif.d, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  }), [unif]);
  useEffect(() => () => { mats.n.dispose(); mats.v.dispose(); mats.d.dispose(); }, [mats]);
  useFrame(() => {
    const a = mando?.current.alfa ?? 1;
    mats.n.uniforms.uAlfa.value = a; mats.v.uniforms.uAlfa.value = a; mats.d.uniforms.uAlfa.value = a;
  });
  return (
    <group userData={{ pieza }}>
      <mesh geometry={geoD} material={mats.d} renderOrder={2} frustumCulled={false} />
      <mesh geometry={geoN} material={mats.n} renderOrder={3} />
      <mesh geometry={geoV} material={mats.v} renderOrder={4} />
    </group>
  );
}

// ───────────────────────────── haces de luz ─────────────────────────────

export const MAX_HACES = 14;
export interface Haz { a: [number, number, number]; b: [number, number, number]; rgb: [number, number, number]; ancho: number; rayas?: number }

const VERT_HAZ = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute vec3 aRgb;
attribute vec4 aP; // t, lado, ancho, rayas
uniform float uPxMundo;
varying vec3 vRgb;
varying float vX;
varying float vSig;
varying float vS;
varying float vRayas;
void main() {
  vec3 P = mix(aA, aB, aP.x);
  vec3 d = normalize(aB - aA + vec3(1e-6, 0.0, 0.0));
  vec3 aCam = cameraPosition - P;
  float dist = length(aCam);
  vec3 lado = normalize(cross(d, aCam / dist));
  float sig = max(aP.z, 0.85 * uPxMundo * dist);
  float W = 4.5 * sig;
  vRgb = aRgb * mix(1.0, aP.z / sig, 0.55);
  vX = aP.y * W; vSig = sig; vS = aP.x * length(aB - aA); vRayas = aP.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(P + lado * aP.y * W, 1.0);
}`;
const FRAG_HAZ = /* glsl */ `
varying vec3 vRgb;
varying float vX;
varying float vSig;
varying float vS;
varying float vRayas;
void main() {
  float x = abs(vX) / vSig;
  float k = exp(-0.5 * x * x) + 0.2 * exp(-0.5 * x * x / 9.0);
  if (vRayas > 0.0) { float f = fract(vS / vRayas); k *= smoothstep(0.0, 0.1, f) * (1.0 - smoothstep(0.5, 0.6, f)); }
  gl_FragColor = vec4(vRgb * k, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/** Los haces de la escena: `fuente.current` se reescribe cada cuadro (antes de dibujar). */
export function Haces({ fuente }: { fuente: React.MutableRefObject<Haz[]> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const nV = MAX_HACES * 4;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
    g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
    g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
    g.setAttribute('aRgb', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
    g.setAttribute('aP', new THREE.BufferAttribute(new Float32Array(nV * 4), 4));
    const idx: number[] = [];
    for (let i = 0; i < MAX_HACES; i++) { const b = i * 4; idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
    g.setIndex(idx);
    g.setDrawRange(0, 0);
    return g;
  }, []);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT_HAZ, fragmentShader: FRAG_HAZ, transparent: true, depthWrite: false, depthTest: true,
    blending: THREE.AdditiveBlending, uniforms: { uPxMundo: { value: 0.001 } },
  }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(() => {
    const hs = fuente.current, n = Math.min(MAX_HACES, hs.length);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const A = geo.getAttribute('aA') as THREE.BufferAttribute, B = geo.getAttribute('aB') as THREE.BufferAttribute;
    const C = geo.getAttribute('aRgb') as THREE.BufferAttribute, P = geo.getAttribute('aP') as THREE.BufferAttribute;
    for (let i = 0; i < n; i++) {
      const h = hs[i];
      for (let k = 0; k < 4; k++) {
        const v = i * 4 + k, t = k < 2 ? 0 : 1, lado = k % 2 === 0 ? -1 : 1;
        A.setXYZ(v, h.a[0], h.a[1], h.a[2]); B.setXYZ(v, h.b[0], h.b[1], h.b[2]);
        pos.setXYZ(v, t ? h.b[0] : h.a[0], t ? h.b[1] : h.a[1], t ? h.b[2] : h.a[2]);
        C.setXYZ(v, h.rgb[0], h.rgb[1], h.rgb[2]);
        P.setXYZW(v, t, lado, h.ancho, h.rayas ?? 0);
      }
    }
    [pos, A, B, C, P].forEach((x) => { x.needsUpdate = true; });
    geo.setDrawRange(0, n * 6);
    mat.uniforms.uPxMundo.value = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, size.height);
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={6} />;
}

// ───────────────────────────── cuentas y halos ─────────────────────────────

let TEX_HALO: THREE.Texture | null = null;
function texHalo(): THREE.Texture | null {
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

/** Cuenta luminosa: esfera de vidrio con núcleo caliente y halo (sprite aditivo). */
export function Cuenta({ color, radio = 0.5, halo = 3.2, brillo = 1.6, ...g }: GroupProps & { color: string; radio?: number; halo?: number; brillo?: number }) {
  const matN = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(brillo), toneMapped: true }), [color, brillo]);
  const matH = useMemo(() => new THREE.SpriteMaterial({ map: texHalo(), color: new THREE.Color(color).multiplyScalar(0.9), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }), [color]);
  useEffect(() => () => { matN.dispose(); matH.dispose(); }, [matN, matH]);
  return (
    <group {...g}>
      <mesh material={matN}><sphereGeometry args={[radio, 24, 16]} /></mesh>
      <sprite material={matH} scale={[halo, halo, 1]} renderOrder={7} />
    </group>
  );
}

/** Anillo que marca un punto notable (punto crítico: aro; inflexión: rombo). */
export function Marca({ color, rombo = false, radio = 1.0, ...g }: GroupProps & { color: string; rombo?: boolean; radio?: number }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(1.5), toneMapped: true }), [color]);
  const matH = useMemo(() => new THREE.SpriteMaterial({ map: texHalo(), color: new THREE.Color(color).multiplyScalar(0.45), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }), [color]);
  useEffect(() => () => { mat.dispose(); matH.dispose(); }, [mat, matH]);
  return (
    <group {...g}>
      <mesh material={mat} rotation-z={rombo ? Math.PI / 4 : 0}>
        <torusGeometry args={[radio, 0.075, 8, rombo ? 4 : 40]} />
      </mesh>
      <sprite material={matH} scale={[radio * 4, radio * 4, 1]} renderOrder={7} />
    </group>
  );
}

// ───────────────────────────── cohete y torre ─────────────────────────────

export const LARGO_COHETE = 7.2;
const R_COHETE = 0.5;
/** escala del cohete en la escena (el modelo mide 7,2 cm; se dibuja a 1,5×) */
export const ESCALA_COHETE = 1.5;

const VERT_LLAMA = /* glsl */ `
varying float vU;
varying vec3 vN;
varying vec3 vV;
uniform float uLargo;
void main() {
  vU = clamp(-position.y / uLargo, 0.0, 1.0);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz; vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}`;
const FRAG_LLAMA = /* glsl */ `
uniform float uT;
uniform float uK;
varying float vU;
varying vec3 vN;
varying vec3 vV;
void main() {
  float c = abs(dot(normalize(vN), normalize(vV)));
  // del blanco azulado de la garganta al naranja y a nada
  vec3 col = mix(vec3(1.0, 0.95, 0.85), vec3(1.0, 0.55, 0.18), smoothstep(0.05, 0.5, vU));
  col = mix(col, vec3(0.9, 0.25, 0.08), smoothstep(0.5, 1.0, vU));
  // diamantes de choque: bandas tenues fijas a lo largo del chorro
  float banda = 0.85 + 0.15 * cos(vU * 26.0 - uT * 3.0);
  float a = (1.0 - smoothstep(0.35, 1.0, vU)) * pow(c, 1.4) * banda * uK;
  gl_FragColor = vec4(col * a * 2.2, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

/**
 * Cohete de sondeo: origen en la salida de la tobera, eje +Y. `empuje` (ref) es (a + g)/g:
 * la llama mide 2,8 cm × empuje.
 */
export function Cohete({ mats, empuje, animar, ...g }: GroupProps & { mats: MatsM8; empuje: React.MutableRefObject<number>; animar: boolean }) {
  const geos = useMemo(() => {
    const tobera = tornear([[0.34, 0], [0.31, 0.1], [0.24, 0.3], [0.17, 0.48], [0.15, 0.56], [0.001, 0.58]], 40);
    const cola = tornear([[0.2, 0.52], [0.36, 0.62], [R_COHETE, 0.9], [R_COHETE, 0.92]], 40);
    const cuerpo = tornear([[R_COHETE, 0.9], [R_COHETE, 5.1]], 48);
    const banda = tornear([[R_COHETE + 0.012, 2.95], [R_COHETE + 0.012, 3.35]], 48);
    const ogiva: P2[] = [];
    // ojiva tangente: radio de curvatura ρ = (R² + L²)/(2R)
    const L = LARGO_COHETE - 5.1, rho = (R_COHETE ** 2 + L ** 2) / (2 * R_COHETE);
    for (let i = 0; i <= 24; i++) {
      const y = (L * i) / 24;
      const r = Math.sqrt(Math.max(0, rho * rho - y * y)) + R_COHETE - rho;
      ogiva.push([Math.max(0.001, r), 5.1 + y]);
    }
    const nariz = tornear(ogiva, 48);
    const forma = new THREE.Shape();
    forma.moveTo(0, 0.95); forma.lineTo(0, 2.45); forma.lineTo(0.95, 1.35); forma.lineTo(0.95, 0.72); forma.closePath();
    const aleta = extruir(forma, 0.07, 6);
    aleta.translate(R_COHETE - 0.02, 0, -0.035);
    return { tobera, cola, cuerpo, banda, nariz, aleta };
  }, []);
  useEffect(() => () => { Object.values(geos).forEach((x) => x.dispose()); }, [geos]);
  const llama = useRef<THREE.Mesh>(null);
  const geoLlama = useMemo(() => {
    const p: P2[] = [];
    for (let i = 0; i <= 20; i++) { const u = i / 20; p.push([Math.max(0.002, 0.3 * (1 + 0.9 * u) * (1 - u * u * 0.85)), -u]); }
    return tornear(p.reverse(), 28);
  }, []);
  useEffect(() => () => geoLlama.dispose(), [geoLlama]);
  const matLlama = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT_LLAMA, fragmentShader: FRAG_LLAMA, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide, uniforms: { uT: { value: 0 }, uK: { value: 1 }, uLargo: { value: 1 } },
  }), []);
  useEffect(() => () => matLlama.dispose(), [matLlama]);
  useFrame((_, dt) => {
    const l = llama.current; if (!l) return;
    const largo = 2.8 * Math.max(0, empuje.current);
    l.scale.set(1, Math.max(0.01, largo), 1);
    matLlama.uniforms.uLargo.value = 1;
    if (animar) matLlama.uniforms.uT.value += Math.min(dt, 0.1);
  });
  return (
    <group {...g} userData={{ pieza: 'cohete' }}>
      <mesh geometry={geos.tobera} material={mats.tobera} castShadow />
      <mesh geometry={geos.cola} material={mats.oscuro} castShadow />
      <mesh geometry={geos.cuerpo} material={mats.blanco} castShadow />
      <mesh geometry={geos.banda} material={mats.rojo} />
      <mesh geometry={geos.nariz} material={mats.rojo} castShadow />
      {[0, 1, 2, 3].map((k) => <mesh key={k} geometry={geos.aleta} material={mats.rojo} rotation-y={(k * Math.PI) / 2 + Math.PI / 4} castShadow />)}
      <mesh geometry={cilindro(0.16, 0.16, 0.05, 24)} material={mats.ventana} position={[0, 4.4, R_COHETE - 0.01]} rotation-x={Math.PI / 2} />
      <mesh geometry={cilindro(0.06, 0.06, 0.9, 12)} material={mats.aluminio} position={[0, 2.2, -R_COHETE - 0.05]} />
      <mesh ref={llama} geometry={geoLlama} material={matLlama} renderOrder={8} />
    </group>
  );
}

/** Torre de lanzamiento de celosía con la plataforma a la altura s = 0. */
export function TorreLanzamiento({ mats, yPlataforma }: { mats: MatsM8; yPlataforma: number }) {
  const lado = 1.6, x0 = X_TORRE + 1.9, z0 = -1.0;
  const { travesanos, diagonales } = useMemo(() => {
    const paso = 2.4, niveles = Math.floor(ALTO_TORRE / paso);
    const tr: THREE.Matrix4[] = [], dg: THREE.Matrix4[] = [];
    const q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
    for (let i = 1; i <= niveles; i++) {
      const y = i * paso;
      for (const [dx, dz, rot] of [[0, -lado / 2, 0], [0, lado / 2, 0], [-lado / 2, 0, Math.PI / 2], [lado / 2, 0, Math.PI / 2]] as const) {
        q.setFromEuler(new THREE.Euler(0, rot, 0)); p.set(x0 + dx, y, z0 + dz);
        tr.push(new THREE.Matrix4().compose(p.clone(), q.clone(), s));
      }
      const ang = Math.atan2(paso, lado) * (i % 2 ? 1 : -1);
      for (const dz of [-lado / 2, lado / 2]) {
        q.setFromEuler(new THREE.Euler(0, 0, ang)); p.set(x0, y - paso / 2, z0 + dz);
        dg.push(new THREE.Matrix4().compose(p.clone(), q.clone(), new THREE.Vector3(Math.hypot(paso, lado) / lado, 1, 1)));
      }
    }
    return { travesanos: tr, diagonales: dg };
  }, [lado, x0, z0]);
  const refT = useRef<THREE.InstancedMesh>(null), refD = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    travesanos.forEach((m, i) => refT.current?.setMatrixAt(i, m));
    diagonales.forEach((m, i) => refD.current?.setMatrixAt(i, m));
    if (refT.current) { refT.current.instanceMatrix.needsUpdate = true; refT.current.computeBoundingSphere(); }
    if (refD.current) { refD.current.instanceMatrix.needsUpdate = true; refD.current.computeBoundingSphere(); }
  }, [travesanos, diagonales]);
  const geoBarra = useMemo(() => new THREE.BoxGeometry(lado, 0.16, 0.16), [lado]);
  useEffect(() => () => geoBarra.dispose(), [geoBarra]);
  return (
    <group userData={{ pieza: 'torre' }}>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz], i) => (
        <mesh key={i} geometry={cajaRedondeada(0.3, ALTO_TORRE, 0.3, 0.05, 1)} material={mats.acero} position={[x0 + (sx * lado) / 2, ALTO_TORRE / 2, z0 + (sz * lado) / 2]} castShadow />
      ))}
      <instancedMesh ref={refT} args={[geoBarra, mats.acero, travesanos.length]} castShadow />
      <instancedMesh ref={refD} args={[geoBarra, mats.acero, diagonales.length]} />
      {/* losa de la torre y plataforma de lanzamiento */}
      <mesh geometry={cajaRedondeada(6.4, 0.5, 5.2, 0.12, 2)} material={mats.grafito} position={[X_TORRE + 1.0, 0.25, -0.4]} receiveShadow castShadow />
      <mesh geometry={cajaRedondeada(4.4, 0.32, 3.2, 0.08, 2)} material={mats.acero} position={[X_TORRE + 0.7, yPlataforma - 0.16, -0.3]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(0.3, 1.2, 0.3, 0.05, 1)} material={mats.acero} position={[X_TORRE + 0.7, yPlataforma - 0.9, -1.5]} />
    </group>
  );
}

// ───────────────────────────── utilidades ─────────────────────────────

/** Puntos (escena) de y = g(x) entre a y b, en `n` tramos. */
export function puntosCurva(g: (x: number) => number, a: number, b: number, n: number, X: (x: number) => number, Y: (y: number) => number, z: number): Float32Array {
  const p = new Float32Array((n + 1) * 3);
  for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; p[i * 3] = X(x); p[i * 3 + 1] = Y(g(x)); p[i * 3 + 2] = z; }
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

