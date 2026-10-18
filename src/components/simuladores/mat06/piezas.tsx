'use client';
/**
 * mat06/piezas.tsx — las piezas del taller de transformaciones (1 u = 1 cuadro de la rejilla).
 *
 *  - Placa de vidrio ahumado con la rejilla, los ejes y las cifras GRABADOS (lienzo a alta
 *    resolución con mipmaps y anisotropía: un objeto físico, no un cartel), marco de
 *    aluminio anodizado y pie de grafito con postes torneados.
 *  - Piezas de vidrio tintado con grosor real: cara de delante, dorso de otro tono (al
 *    voltearse en una reflexión se ve el dorso) y cantos que brillan como el vidrio de borde.
 *  - Huella: la sombra ortogonal de la pieza sobre la placa, difuminada, del color del signo
 *    del determinante.
 *  - Haces: cintas de luz orientadas a la cámara (aristas, siluetas a trazos, caminos de los
 *    vértices, rayos, eje, vectores), todas en UNA llamada de dibujo.
 *  - Cuentas de los vértices clave (instanciadas) y pasadores de latón para los centros.
 *
 * Materiales sin ruido de alta frecuencia: superficies lisas con reflejos del entorno.
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { tornear, cajaRedondeada, cilindro, crearLienzo, texturaDeLienzo, type Calidad } from '../_kit';
import { PIEZA } from './transformaciones';
import { RANGO, PLACA, Z, COLOR } from './banco';
import { cajaHuella } from './geometria';

// ───────────────────────────── colores ─────────────────────────────

/** Colores de la escena (los mismos del dock): viven en banco.ts para que el dock no arrastre three. */
export { COLOR };

/** Color lineal × intensidad (para los haces aditivos, HDR > 1 florece con el bloom). */
export function rgb(hex: string, k: number): [number, number, number] {
  const c = new THREE.Color(hex);
  return [c.r * k, c.g * k, c.b * k];
}

// ───────────────────────────── materiales ─────────────────────────────

export interface MatsM6 {
  vidrio: THREE.MeshPhysicalMaterial;
  marco: THREE.MeshStandardMaterial;
  aluminio: THREE.MeshStandardMaterial;
  grafito: THREE.MeshPhysicalMaterial;
  laton: THREE.MeshStandardMaterial;
  goma: THREE.MeshStandardMaterial;
}

export function useMatsM6(calidad: Calidad): MatsM6 {
  const m = useMemo<MatsM6>(() => {
    const alta = calidad === 'alta';
    return {
      // vidrio ahumado: casi negro azulado, con barniz que se lleva los reflejos del estudio
      vidrio: new THREE.MeshPhysicalMaterial({
        // reflejos tenues y difusos: un vidrio espejo devolvía las lámparas del estudio como manchas blancas
        color: '#0e1c27', metalness: 0, roughness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.3,
        transparent: true, opacity: 0.93, envMapIntensity: 0.14, specularIntensity: 0.5, ior: 1.5, name: 'm6-vidrio',
      }),
      marco: new THREE.MeshStandardMaterial({ color: '#39414a', metalness: 0.92, roughness: 0.3, envMapIntensity: 1.1, name: 'm6-marco' }),
      aluminio: new THREE.MeshStandardMaterial({ color: '#c3c9cf', metalness: 1, roughness: 0.24, name: 'm6-aluminio' }),
      grafito: new THREE.MeshPhysicalMaterial({ color: '#151a20', metalness: 0.25, roughness: 0.42, clearcoat: alta ? 0.7 : 0.3, clearcoatRoughness: 0.22, name: 'm6-grafito' }),
      laton: new THREE.MeshStandardMaterial({ color: '#d2a95c', metalness: 1, roughness: 0.26, name: 'm6-laton' }),
      goma: new THREE.MeshStandardMaterial({ color: '#0e1013', roughness: 0.88, metalness: 0, name: 'm6-goma' }),
    };
  }, [calidad]);
  useEffect(() => () => { Object.values(m).forEach((x) => (x as THREE.Material).dispose()); }, [m]);
  return m;
}

/**
 * Los tres materiales de una pieza de vidrio tintado: [frente, dorso, cantos].
 * Translúcidos (no escriben profundidad); los cantos emiten un poco, como el vidrio de borde.
 */
export function crearMatsPieza(frente: string, dorso: string, opacidad = 0.46): THREE.Material[] {
  const cara = (c: string) => new THREE.MeshPhysicalMaterial({
    color: c, emissive: c, emissiveIntensity: 0.16, roughness: 0.07, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04,
    transparent: true, opacity: opacidad, depthWrite: false, envMapIntensity: 1.7, specularIntensity: 1, ior: 1.5,
  });
  const canto = new THREE.MeshPhysicalMaterial({
    color: frente, emissive: frente, emissiveIntensity: 0.5, roughness: 0.2, metalness: 0, transparent: true,
    opacity: Math.min(1, opacidad + 0.4), depthWrite: false, envMapIntensity: 1.2,
  });
  return [cara(frente), cara(dorso), canto];
}

/** Cambia el tinte de una pieza ya creada (p. ej. al acoplar en el reto). */
export function tintarPieza(mats: THREE.Material[], frente: string) {
  const [f, , c] = mats as THREE.MeshPhysicalMaterial[];
  f.color.set(frente); f.emissive.set(frente);
  c.color.set(frente); c.emissive.set(frente);
}

// ───────────────────────────── grabado de la placa ─────────────────────────────

const familia = () => (typeof document !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'system-ui');

/**
 * Rejilla grabada en la placa: líneas finas en cada unidad, más marcadas cada 5, los ejes
 * con sus flechas y las cifras de −10 a 10 junto a los ejes (coma y signo menos tipográfico).
 */
export function texturaPlaca(calidad: Calidad): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const pxU = calidad === 'alta' ? 64 : 40;
  const L = PLACA.lado;
  const W = Math.round(L * pxU);
  const c = crearLienzo(W, W);
  const g = c.getContext('2d');
  if (!g) return null;
  const X = (x: number) => (x + L / 2) * pxU;
  const Y = (y: number) => (L / 2 - y) * pxU;
  g.clearRect(0, 0, W, W);
  g.lineCap = 'round';
  const linea = (x0: number, y0: number, x1: number, y1: number, a: number, w: number) => {
    g.strokeStyle = `rgba(205,226,240,${a})`; g.lineWidth = w * pxU;
    g.beginPath(); g.moveTo(X(x0), Y(y0)); g.lineTo(X(x1), Y(y1)); g.stroke();
  };
  for (let n = -RANGO; n <= RANGO; n++) {
    if (n === 0) continue;
    const mayor = n % 5 === 0;
    const a = Math.abs(n) === RANGO ? 0.34 : mayor ? 0.24 : 0.12;
    const w = mayor ? 0.045 : 0.028;
    linea(n, -RANGO, n, RANGO, a, w);
    linea(-RANGO, n, RANGO, n, a, w);
  }
  // ejes con flecha
  const ext = RANGO + 0.75;
  linea(-RANGO, 0, ext, 0, 0.72, 0.07);
  linea(0, -RANGO, 0, ext, 0.72, 0.07);
  g.fillStyle = 'rgba(214,232,246,0.85)';
  for (const [ax, ay, dx, dy] of [[ext + 0.3, 0, 1, 0], [0, ext + 0.3, 0, 1]] as const) {
    g.beginPath();
    g.moveTo(X(ax), Y(ay));
    g.lineTo(X(ax - dx * 0.5 - dy * 0.22), Y(ay - dy * 0.5 + dx * 0.22));
    g.lineTo(X(ax - dx * 0.5 + dy * 0.22), Y(ay - dy * 0.5 - dx * 0.22));
    g.closePath(); g.fill();
  }
  // marcas en los ejes
  for (let n = -RANGO; n <= RANGO; n++) {
    if (n === 0) continue;
    linea(n, -0.16, n, 0.16, 0.7, 0.04);
    linea(-0.16, n, 0.16, n, 0.7, 0.04);
  }
  // cifras grabadas
  const f = familia();
  const cifra = (n: number) => (n < 0 ? `−${-n}` : String(n));
  g.fillStyle = 'rgba(222,238,250,0.9)';
  g.font = `600 ${Math.round(pxU * 0.46)}px ${f}`;
  g.textAlign = 'center'; g.textBaseline = 'top';
  for (let n = -RANGO; n <= RANGO; n++) if (n !== 0) g.fillText(cifra(n), X(n), Y(-0.26));
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let n = -RANGO; n <= RANGO; n++) if (n !== 0) g.fillText(cifra(n), X(-0.24), Y(n));
  g.textAlign = 'right'; g.textBaseline = 'top';
  g.fillText('0', X(-0.2), Y(-0.24));
  g.fillStyle = 'rgba(222,238,250,0.72)';
  g.font = `italic 600 ${Math.round(pxU * 0.6)}px ${f}`;
  g.textAlign = 'center'; g.textBaseline = 'bottom';
  g.fillText('x', X(ext + 0.1), Y(0.32));
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillText('y', X(0.42), Y(ext + 0.15));
  const tex = texturaDeLienzo(c, { mipmaps: true, srgb: true });
  tex.anisotropy = 8;
  return tex;
}

/** Placa de vidrio ahumado con su grabado, marco de aluminio y pie de grafito. */
export function Placa({ tex, mats }: { tex: THREE.Texture | null; mats: MatsM6 }) {
  const matGrabado = useMemo(() => new THREE.MeshBasicMaterial({
    map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: '#d6eaf7', name: 'm6-grabado',
  }), [tex]);
  useEffect(() => () => matGrabado.dispose(), [matGrabado]);
  const L = PLACA.lado, a = PLACA.marco, fz = PLACA.fondoMarco;
  const zc = -PLACA.grosor / 2;
  const yMarco = -(L / 2 + a);
  const largoPoste = 1.8;
  const yZocalo = yMarco - largoPoste;
  const remate = useMemo(() => tornear([[0.001, 0], [0.62, 0], [0.62, 0.22], [0.48, 0.42], [0.001, 0.46]], 32), []);
  useEffect(() => () => remate.dispose(), [remate]);
  return (
    <group>
      <mesh geometry={cajaRedondeada(L, L, PLACA.grosor, 0.08, 2)} material={mats.vidrio} position={[0, 0, zc]} renderOrder={0} />
      {tex && (
        <mesh position={[0, 0, Z.grabado]} material={matGrabado} renderOrder={1}>
          <planeGeometry args={[L, L]} />
        </mesh>
      )}
      {/* marco: dos largueros y dos montantes de aristas redondeadas */}
      <group userData={{ pieza: 'placa' }}>
      <mesh geometry={cajaRedondeada(L + 2 * a, a, fz, 0.2, 3)} material={mats.marco} position={[0, L / 2 + a / 2, zc]} />
      <mesh geometry={cajaRedondeada(L + 2 * a, a, fz, 0.2, 3)} material={mats.marco} position={[0, -L / 2 - a / 2, zc]} />
      <mesh geometry={cajaRedondeada(a, L, fz, 0.2, 3)} material={mats.marco} position={[-L / 2 - a / 2, 0, zc]} />
      <mesh geometry={cajaRedondeada(a, L, fz, 0.2, 3)} material={mats.marco} position={[L / 2 + a / 2, 0, zc]} />
      {/* pie: dos postes torneados sobre un zócalo de grafito con filete de latón */}
      {[-L * 0.32, L * 0.32].map((x) => (
        <group key={x} position={[x, yZocalo, zc]}>
          <mesh geometry={cilindro(0.34, 0.34, largoPoste, 28)} material={mats.aluminio} position={[0, largoPoste / 2, 0]} />
          <mesh geometry={remate} material={mats.aluminio} rotation-x={Math.PI} position={[0, largoPoste + 0.02, 0]} />
        </group>
      ))}
      <mesh geometry={cajaRedondeada(L * 0.86, 1.3, 5.2, 0.4, 4)} material={mats.grafito} position={[0, yZocalo - 0.65, zc]} />
      <mesh geometry={cajaRedondeada(L * 0.86 - 1, 0.12, 0.12, 0.05, 2)} material={mats.laton} position={[0, yZocalo - 0.45, zc + 2.62]} />
      </group>
    </group>
  );
}

// ───────────────────────────── huella (sombra ortogonal) ─────────────────────────────

let TEX_HUELLA: THREE.Texture | null = null;
/** Silueta de la pieza difuminada (alfa en el canal rojo), sobre la caja de `cajaHuella()`. */
export function texturaHuella(): THREE.Texture | null {
  if (TEX_HUELLA || typeof document === 'undefined') return TEX_HUELLA;
  const [x0, y0, x1, y1] = cajaHuella();
  const N = 256;
  const sx = N / (x1 - x0), sy = N / (y1 - y0);
  const c = crearLienzo(N, N), g = c.getContext('2d');
  if (!g) return null;
  g.fillStyle = '#000'; g.fillRect(0, 0, N, N);
  const camino = () => {
    g.beginPath();
    PIEZA.forEach(([x, y], i) => { const X = (x - x0) * sx, Y = (y1 - y) * sy; if (i) g.lineTo(X, Y); else g.moveTo(X, Y); });
    g.closePath();
  };
  // halo ancho y suave + núcleo: la luz que el vidrio tintado deja pasar.
  // shadowBlur (no ctx.filter, que Safari no tiene) para difuminar el borde.
  g.save(); g.shadowColor = 'rgba(255,255,255,0.9)'; g.shadowBlur = 22; g.fillStyle = 'rgba(255,255,255,0.45)'; camino(); g.fill(); g.restore();
  g.save(); g.shadowColor = 'rgba(255,255,255,1)'; g.shadowBlur = 6; g.fillStyle = 'rgba(255,255,255,0.8)'; camino(); g.fill(); g.restore();
  TEX_HUELLA = texturaDeLienzo(c, { mipmaps: true, srgb: false });
  return TEX_HUELLA;
}

/** Material aditivo de una huella (color y fuerza se cambian por cuadro). */
export function crearMatHuella(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: '#ffffff', map: texturaHuella(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: true,
  });
}

// ───────────────────────────── haces de luz ─────────────────────────────

export const MAX_HACES = 420;
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
  vec3 d = normalize(aB - aA + vec3(1e-6, 1e-7, 0.0));
  vec3 aCam = cameraPosition - P;
  float dist = length(aCam);
  vec3 lado = normalize(cross(d, aCam / dist));
  float sig = max(aP.z, 0.85 * uPxMundo * dist);
  float W = 4.5 * sig;
  // un poco más largo que el tramo: las juntas de una polilínea no dejan huecos
  vec3 Pext = P + d * (aP.x * 2.0 - 1.0) * 0.6 * sig;
  vRgb = aRgb * mix(1.0, aP.z / sig, 0.55);
  vX = aP.y * W; vSig = sig; vS = aP.x * length(aB - aA); vRayas = aP.w;
  gl_Position = projectionMatrix * viewMatrix * vec4(Pext + lado * aP.y * W, 1.0);
}`;
const FRAG_HAZ = /* glsl */ `
varying vec3 vRgb;
varying float vX;
varying float vSig;
varying float vS;
varying float vRayas;
void main() {
  float x = abs(vX) / vSig;
  float k = exp(-0.5 * x * x) + 0.18 * exp(-0.5 * x * x / 9.0);
  if (vRayas > 0.0) { float f = fract(vS / vRayas); k *= smoothstep(0.0, 0.08, f) * (1.0 - smoothstep(0.52, 0.6, f)); }
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
  return <mesh geometry={geo} material={mat} frustumCulled={false} renderOrder={8} raycast={() => null} />;
}

// ───────────────────────────── cuentas de los vértices ─────────────────────────────

export const MAX_CUENTAS = 12;
export interface Cuenta { p: [number, number, number]; color: string; radio: number; brillo: number }

/** Cuentas luminosas instanciadas (vértices clave y pivotes). */
export function Cuentas({ fuente }: { fuente: React.MutableRefObject<Cuenta[]> }) {
  const geo = useMemo(() => new THREE.SphereGeometry(1, 20, 14), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: true }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  const malla = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, MAX_CUENTAS);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_CUENTAS * 3), 3);
    m.count = 0;
    m.frustumCulled = false;
    m.renderOrder = 9;
    m.raycast = () => undefined;
    return m;
  }, [geo, mat]);
  const o = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const cs = fuente.current, n = Math.min(MAX_CUENTAS, cs.length);
    for (let i = 0; i < n; i++) {
      const c = cs[i];
      o.position.set(c.p[0], c.p[1], c.p[2]); o.scale.setScalar(c.radio); o.updateMatrix();
      malla.setMatrixAt(i, o.matrix);
      col.set(c.color).multiplyScalar(c.brillo);
      malla.setColorAt(i, col);
    }
    malla.count = n;
    malla.instanceMatrix.needsUpdate = true;
    if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
  });
  return <primitive object={malla} />;
}

// ───────────────────────────── pasador de latón (centro) ─────────────────────────────

/** Pasador torneado clavado en la placa: marca el centro de un giro o de una homotecia. */
export function Pasador({ mats, ...g }: { mats: MatsM6 } & React.ComponentProps<'group'>) {
  const geo = useMemo(() => tornear([
    [0.001, 0], [0.34, 0], [0.34, 0.06], [0.22, 0.12], [0.13, 0.16], [0.11, 0.62], [0.16, 0.66], [0.2, 0.74], [0.17, 0.82], [0.001, 0.85],
  ], 36), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const anillo = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd58a').multiplyScalar(1.6), toneMapped: true }), []);
  useEffect(() => () => anillo.dispose(), [anillo]);
  return (
    <group {...g}>
      <mesh geometry={geo} material={mats.laton} rotation-x={Math.PI / 2} />
      <mesh material={anillo} position={[0, 0, 0.02]}>
        <torusGeometry args={[0.46, 0.035, 8, 48]} />
      </mesh>
    </group>
  );
}
