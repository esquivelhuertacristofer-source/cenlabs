'use client';
/**
 * mat07/haces.tsx — la LUZ del banco, dibujada con sombreadores propios y baratos:
 *
 *  - HACES: cinta orientada a la cámara por tramo, con perfil gaussiano (núcleo +
 *    halo). Brillo = potencia del tramo (Fresnel en cada cara) × e^(−μ·s) (Beer–
 *    Lambert a lo largo del tramo) × densidad de la bruma en ese punto. Fuera de la
 *    bruma (r > 16–20 cm) el haz sigue existiendo pero ya no hay nada que lo
 *    disperse hacia el ojo: se apaga.
 *  - HUELLAS: la luz que la bruma esparce desde el haz ilumina la cara del disco
 *    justo debajo; para una fuente lineal a altura h el perfil lateral es
 *    ∝ 1/(1 + (x/h)²). Tenue: es ambiente, no la lectura (la lectura se hace en la
 *    vista cenital, sin paralaje).
 *  - DESTELLOS: la luz difundida donde el haz cruza una cara (abertura, cara plana,
 *    cara curva), ∝ potencia que llega.
 *  - BRUMA: miles de motas instanciadas como puntos; cada una brilla según la
 *    potencia de los haces que pasan cerca (gaussiana de la distancia al eje) y
 *    centellea (las partículas giran). Dentro del bloque no hay bruma.
 *
 * Todo en un solo grupo de buffers que se reescribe cuando cambia el trazado (cada
 * cuadro mientras el láser gira): ≤ 24 tramos, 4 llamadas de dibujo en total.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { Calidad } from '../_kit';
import { R_DISCO, R_BLOQUE } from './optica';
import { ESPESOR_BLOQUE, H_HAZ } from './piezas';

export const MAX_TRAMOS = 24;
const MAX_DESTELLOS = 16;

/** Un tramo de haz en coordenadas de mundo, listo para la GPU. */
export interface TramoGPU {
  a: [number, number, number];
  b: [number, number, number];
  /** color lineal × potencia en `a` */
  rgb: [number, number, number];
  mu: number;
  vidrio: boolean;
}
export interface DestelloGPU { c: [number, number, number]; rgb: [number, number, number]; tam: number }

/** Lo que la escena entrega a la luz en cada cambio (versión creciente = hay que reescribir). */
export interface FuenteLuz { version: number; tramos: TramoGPU[]; destellos: DestelloGPU[] }

// ───────────────────────────── sombreadores ─────────────────────────────

const VERT_CINTA = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute vec3 aRgb;
attribute vec4 aP; // t, lado, mu, vidrio
uniform float uPxMundo;
uniform float uNucleo;
uniform float uHalo;
uniform float uPlano;   // 1 = huella sobre el disco
uniform float uYPlano;
varying vec3 vRgb;
varying float vX;
varying float vSigN;
varying float vSigH;
varying float vS;
varying float vMu;
varying float vVidrio;
varying vec3 vPos;
void main() {
  vec3 A = aA, B = aB;
  if (uPlano > 0.5) { A.y = uYPlano; B.y = uYPlano; }
  vec3 P = mix(A, B, aP.x);
  vec3 d = normalize(B - A);
  vec3 aCam = cameraPosition - P;
  float dist = length(aCam);
  vec3 lado = uPlano > 0.5 ? normalize(cross(vec3(0.0, 1.0, 0.0), d)) : normalize(cross(d, aCam / dist));
  float px = uPxMundo * dist;
  float sigN = max(uNucleo, 0.75 * px);
  float sigH = max(uHalo, 2.2 * px);
  float W = uPlano > 0.5 ? 3.0 * uHalo : 3.0 * sigH;
  vec3 Q = P + lado * aP.y * W;
  vRgb = aRgb; vX = aP.y * W; vSigN = sigN; vSigH = sigH;
  vS = aP.x * length(B - A); vMu = aP.z; vVidrio = aP.w; vPos = P;
  gl_Position = projectionMatrix * viewMatrix * vec4(Q, 1.0);
}`;

const FRAG_CINTA = /* glsl */ `
uniform float uKn;
uniform float uKh;
uniform float uR0;
uniform float uR1;
uniform float uDensVidrio;
uniform float uPlano;
uniform float uHalo;
uniform float uRDisco;
uniform float uNucleo;
varying vec3 vRgb;
varying float vX;
varying float vSigN;
varying float vSigH;
varying float vS;
varying float vMu;
varying float vVidrio;
varying vec3 vPos;
void main() {
  float x = abs(vX);
  float P = exp(-vMu * vS);
  float r = length(vPos.xz);
  float dens = vVidrio > 0.5 ? uDensVidrio : 1.0 - smoothstep(uR0, uR1, r);
  float perfil;
  if (uPlano > 0.5) {
    // fuente lineal a altura h: 1/(1 + (x/h)²), recortada suave al borde de la cinta
    float h = uHalo / 1.2;
    perfil = uKh / (1.0 + (x / h) * (x / h)) * (1.0 - smoothstep(0.55, 1.0, x / (3.0 * uHalo)));
    perfil *= 1.0 - smoothstep(uRDisco - 0.5, uRDisco - 0.15, r);
  } else {
    // si el núcleo se ensancha hasta el píxel mínimo, baja su pico (no inventa potencia)
    float k = mix(1.0, uNucleo / vSigN, 0.6);
    perfil = uKn * k * exp(-0.5 * x * x / (vSigN * vSigN)) + uKh * exp(-0.5 * x * x / (vSigH * vSigH));
  }
  vec3 c = vRgb * P * dens * perfil;
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const VERT_DESTELLO = /* glsl */ `
attribute vec3 aC;
attribute vec3 aRgb;
attribute vec3 aQ; // esquina (x, y) y tamaño
varying vec3 vRgb;
varying vec2 vQ;
void main() {
  vec4 mv = viewMatrix * vec4(aC, 1.0);
  mv.xy += aQ.xy * aQ.z;
  vRgb = aRgb; vQ = aQ.xy;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG_DESTELLO = /* glsl */ `
uniform float uK;
varying vec3 vRgb;
varying vec2 vQ;
void main() {
  float d2 = dot(vQ, vQ);
  float f = exp(-d2 * 9.0) + 0.18 * exp(-d2 * 2.2);
  f *= 1.0 - smoothstep(0.85, 1.0, sqrt(d2));
  gl_FragColor = vec4(vRgb * f * uK, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const VERT_BRUMA = /* glsl */ `
#define MAXT ${MAX_TRAMOS}
uniform vec4 uA[MAXT];
uniform vec4 uB[MAXT];
uniform vec4 uC[MAXT];
uniform int uN;
uniform float uT;
uniform float uSig;
uniform float uK;
uniform float uEscala;
uniform float uR0;
uniform float uR1;
uniform float uRB;
uniform float uTB;
attribute vec4 aSemilla; // fase, tamaño, ritmo del centelleo, amplitud de deriva
varying vec3 vCol;
void main() {
  vec3 p = position;
  float ph = aSemilla.x;
  float am = aSemilla.w;
  // deriva lenta (convección suave hacia +x) y vaivén browniano
  p += vec3(sin(uT * 0.11 + ph * 6.2831) * am + uT * 0.06, sin(uT * 0.23 + ph * 11.0) * 0.16, cos(uT * 0.09 + ph * 4.1) * am);
  p.x = mod(p.x + 21.0, 42.0) - 21.0;
  bool enBloque = p.z > 0.0 && length(p.xz) < uRB && p.y < uTB;
  vec3 col = vec3(0.0);
  if (!enBloque) {
    for (int i = 0; i < MAXT; i++) {
      if (i >= uN) break;
      if (uB[i].w > 0.5) continue; // tramo dentro del vidrio: ahí no hay bruma
      vec3 A = uA[i].xyz;
      vec3 AB = uB[i].xyz - A;
      float L = uC[i].w;
      float t = clamp(dot(p - A, AB) / (L * L), 0.0, 1.0);
      vec3 e = p - (A + AB * t);
      col += uC[i].rgb * exp(-uA[i].w * t * L) * exp(-0.5 * dot(e, e) / (uSig * uSig));
    }
  }
  float dens = 1.0 - smoothstep(uR0, uR1, length(p.xz));
  float tw = 0.3 + 0.7 * pow(0.5 + 0.5 * sin(uT * aSemilla.z + ph * 40.0), 3.0);
  vCol = col * dens * tw * uK;
  float lum = max(max(vCol.r, vCol.g), vCol.b);
  if (lum < 0.003) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(uEscala * aSemilla.y / -mv.z, 1.0, 7.0);
}`;
const FRAG_BRUMA = /* glsl */ `
varying vec3 vCol;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  float a = exp(-d * d * 3.2) * (1.0 - smoothstep(0.75, 1.0, d));
  gl_FragColor = vec4(vCol * a, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// ───────────────────────────── geometrías ─────────────────────────────

function geometriaCintas(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const nV = MAX_TRAMOS * 4;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  g.setAttribute('aRgb', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  g.setAttribute('aP', new THREE.BufferAttribute(new Float32Array(nV * 4), 4));
  const idx: number[] = [];
  for (let i = 0; i < MAX_TRAMOS; i++) { const b = i * 4; idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
  g.setIndex(idx);
  g.setDrawRange(0, 0);
  return g;
}

function escribirCintas(g: THREE.BufferGeometry, tramos: TramoGPU[]) {
  const n = Math.min(MAX_TRAMOS, tramos.length);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const A = g.getAttribute('aA') as THREE.BufferAttribute, B = g.getAttribute('aB') as THREE.BufferAttribute;
  const C = g.getAttribute('aRgb') as THREE.BufferAttribute, P = g.getAttribute('aP') as THREE.BufferAttribute;
  for (let i = 0; i < n; i++) {
    const tr = tramos[i];
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k, t = k < 2 ? 0 : 1, lado = k % 2 === 0 ? -1 : 1;
      A.setXYZ(v, tr.a[0], tr.a[1], tr.a[2]);
      B.setXYZ(v, tr.b[0], tr.b[1], tr.b[2]);
      pos.setXYZ(v, t ? tr.b[0] : tr.a[0], t ? tr.b[1] : tr.a[1], t ? tr.b[2] : tr.a[2]);
      C.setXYZ(v, tr.rgb[0], tr.rgb[1], tr.rgb[2]);
      P.setXYZW(v, t, lado, tr.mu, tr.vidrio ? 1 : 0);
    }
  }
  [pos, A, B, C, P].forEach((a) => { a.needsUpdate = true; });
  g.setDrawRange(0, n * 6);
}

function geometriaDestellos(): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  const nV = MAX_DESTELLOS * 4;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  g.setAttribute('aC', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  g.setAttribute('aRgb', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  g.setAttribute('aQ', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
  const idx: number[] = [];
  for (let i = 0; i < MAX_DESTELLOS; i++) { const b = i * 4; idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
  g.setIndex(idx);
  g.setDrawRange(0, 0);
  return g;
}

function escribirDestellos(g: THREE.BufferGeometry, ds: DestelloGPU[]) {
  const n = Math.min(MAX_DESTELLOS, ds.length);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const C = g.getAttribute('aC') as THREE.BufferAttribute, R = g.getAttribute('aRgb') as THREE.BufferAttribute;
  const Q = g.getAttribute('aQ') as THREE.BufferAttribute;
  const esq = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (let i = 0; i < n; i++) {
    const d = ds[i];
    for (let k = 0; k < 4; k++) {
      const v = i * 4 + k;
      pos.setXYZ(v, d.c[0], d.c[1], d.c[2]);
      C.setXYZ(v, d.c[0], d.c[1], d.c[2]);
      R.setXYZ(v, d.rgb[0], d.rgb[1], d.rgb[2]);
      Q.setXYZ(v, esq[k][0], esq[k][1], d.tam);
    }
  }
  [pos, C, R, Q].forEach((a) => { a.needsUpdate = true; });
  g.setDrawRange(0, n * 6);
}

/** Motas de bruma: concentradas en la capa del haz (todas las trayectorias van a h = H_HAZ). */
function geometriaBruma(n: number): THREE.BufferGeometry {
  let s = 1234567;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const gauss = () => { const u = Math.max(1e-9, rnd()), v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const pos = new Float32Array(n * 3), sem = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const r = 21 * Math.sqrt(rnd()), a = rnd() * Math.PI * 2;
    pos[i * 3] = r * Math.cos(a);
    pos[i * 3 + 1] = Math.min(3.6, Math.max(0.06, H_HAZ + gauss() * 0.3));
    pos[i * 3 + 2] = r * Math.sin(a);
    sem[i * 4] = rnd(); sem[i * 4 + 1] = 0.6 + rnd() * 1.4; sem[i * 4 + 2] = 0.6 + rnd() * 2.4; sem[i * 4 + 3] = 0.25 + rnd() * 0.7;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSemilla', new THREE.BufferAttribute(sem, 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, H_HAZ, 0), 30);
  return g;
}

// ───────────────────────────── componente ─────────────────────────────

const aditivo = { transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending } as const;

/**
 * Dibuja la luz del banco. `fuente` es un objeto mutable que la escena actualiza
 * (con `version` creciente) ANTES de este cuadro: así escena, haz y dock comparten
 * el mismo instante.
 */
export function LuzDelBanco({ fuente, calidad, animar }: { fuente: React.MutableRefObject<FuenteLuz>; calidad: Calidad; animar: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const geoCintas = useMemo(geometriaCintas, []);
  const geoDest = useMemo(geometriaDestellos, []);
  const nMotas = calidad === 'alta' ? 22000 : 7000;
  const geoBruma = useMemo(() => geometriaBruma(nMotas), [nMotas]);
  useEffect(() => () => { geoCintas.dispose(); geoDest.dispose(); }, [geoCintas, geoDest]);
  useEffect(() => () => geoBruma.dispose(), [geoBruma]);

  const matHaz = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT_CINTA, fragmentShader: FRAG_CINTA, ...aditivo,
    uniforms: {
      uPxMundo: { value: 0.001 }, uNucleo: { value: 0.045 }, uHalo: { value: 0.32 }, uPlano: { value: 0 }, uYPlano: { value: 0 },
      uKn: { value: 2.4 }, uKh: { value: 0.3 }, uR0: { value: 15.5 }, uR1: { value: 20 }, uDensVidrio: { value: 0.75 },
      uRDisco: { value: R_DISCO },
    },
  }), []);
  const matHuella = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT_CINTA, fragmentShader: FRAG_CINTA, ...aditivo,
    uniforms: {
      uPxMundo: { value: 0.001 }, uNucleo: { value: 0.05 }, uHalo: { value: H_HAZ * 1.2 }, uPlano: { value: 1 }, uYPlano: { value: 0.006 },
      uKn: { value: 0 }, uKh: { value: 0.085 }, uR0: { value: 15.5 }, uR1: { value: 20 }, uDensVidrio: { value: 0.75 },
      uRDisco: { value: R_DISCO },
    },
  }), []);
  const matDest = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT_DESTELLO, fragmentShader: FRAG_DESTELLO, ...aditivo,
    uniforms: { uK: { value: 1.6 } },
  }), []);
  const matBruma = useMemo(() => {
    const vacio = () => Array.from({ length: MAX_TRAMOS }, () => new THREE.Vector4());
    return new THREE.ShaderMaterial({
      vertexShader: VERT_BRUMA, fragmentShader: FRAG_BRUMA, ...aditivo,
      uniforms: {
        uA: { value: vacio() }, uB: { value: vacio() }, uC: { value: vacio() }, uN: { value: 0 },
        uT: { value: 0 }, uSig: { value: 0.26 }, uK: { value: 3.0 }, uEscala: { value: 100 },
        uR0: { value: 15.5 }, uR1: { value: 20.5 }, uRB: { value: R_BLOQUE + 0.05 }, uTB: { value: ESPESOR_BLOQUE + 0.05 },
      },
    });
  }, []);
  useEffect(() => () => { matHaz.dispose(); matHuella.dispose(); matDest.dispose(); matBruma.dispose(); }, [matHaz, matHuella, matDest, matBruma]);

  const version = useRef(-1);
  const t = useRef(0);
  useFrame((_, dt) => {
    const f = fuente.current;
    if (f.version !== version.current) {
      version.current = f.version;
      escribirCintas(geoCintas, f.tramos);
      escribirDestellos(geoDest, f.destellos);
      const u = matBruma.uniforms;
      const n = Math.min(MAX_TRAMOS, f.tramos.length);
      for (let i = 0; i < MAX_TRAMOS; i++) {
        const tr = f.tramos[i];
        if (i < n && tr) {
          const L = Math.hypot(tr.b[0] - tr.a[0], tr.b[1] - tr.a[1], tr.b[2] - tr.a[2]);
          (u.uA.value as THREE.Vector4[])[i].set(tr.a[0], tr.a[1], tr.a[2], tr.mu);
          (u.uB.value as THREE.Vector4[])[i].set(tr.b[0], tr.b[1], tr.b[2], tr.vidrio ? 1 : 0);
          (u.uC.value as THREE.Vector4[])[i].set(tr.rgb[0], tr.rgb[1], tr.rgb[2], Math.max(1e-4, L));
        }
      }
      u.uN.value = n;
    }
    // tamaño del píxel en el mundo a distancia 1 (para el ancho mínimo de la cinta)
    const pxMundo = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, size.height);
    matHaz.uniforms.uPxMundo.value = pxMundo;
    matHuella.uniforms.uPxMundo.value = pxMundo;
    matBruma.uniforms.uEscala.value = (size.height * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) * 0.07;
    if (animar) { t.current += Math.min(dt, 0.1); matBruma.uniforms.uT.value = t.current; }
  });

  return (
    <group>
      <mesh geometry={geoCintas} material={matHuella} frustumCulled={false} renderOrder={4} />
      <mesh geometry={geoCintas} material={matHaz} frustumCulled={false} renderOrder={5} />
      <points geometry={geoBruma} material={matBruma} frustumCulled={false} renderOrder={6} />
      <mesh geometry={geoDest} material={matDest} frustumCulled={false} renderOrder={7} />
    </group>
  );
}
