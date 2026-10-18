"use client";
/**
 * F10 · Motor de CD de imanes permanentes — el banco en 3D (R3F), 1 u = 1 cm.
 *
 *   Motor con la mitad delantera cortada a media longitud del paquete: en el corte se ven
 *   el yugo, los dos imanes en arco, el inducido de chapa con sus cuatro ranuras y los haces
 *   de cobre de las dos bobinas, y sobre él las LÍNEAS DE CAMPO B exactas (lineas.ts). Detrás:
 *   cabezas de bobina, escudo con rodamiento, colector de 4 delgas con sus escobillas de
 *   carbón, acople con la cinta del tacómetro óptico, freno de partículas, batería y regulador.
 *
 * RELOJ ÚNICO. `reloj.paso(dt)` corre aquí en un useFrame de prioridad −1 (antes que nada se
 * dibuje): integra J·dω/dt = τ(θ) − τ_freno con la cámara lenta rotulada. El giro del
 * inducido, las fuerzas de Lorentz, la corriente en la cabeza de bobina, las chispas del
 * conmutador, el testigo del tacómetro y el dock leen ese mismo estado. Ningún useFrame con
 * prioridad > 0 (r3f dejaría de dibujar solo).
 *
 * Sentido: θ y ω positivos = horario visto de frente (desde el corte), el de las rpm del dominio.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ControlesBanco } from '../_kit';
import type { Polo } from '@/domain/fisica';
import type { RelojMotor } from './reloj';
import { ladosActivos, bobinaActiva, configImanes, type TipoCampo } from './motor';
import { lineasCampo, type LineaCampo } from './lineas';
import { COTA, centroHaz } from './geometria';
import { crearMateriales, materialLineas, materialCorriente, texturaDestello, type MatsMotor } from './materiales';
import {
  Estator, Inducido, Escudo, Escobillas, Base, Freno, Tacometro, Bateria, Regulador, Cables, contarNormalesCero, mergeGeos,
  POS_SENSOR,
} from './piezas';
import { cifra, cifraSig } from './formato';

export type Vista = '34' | 'corte' | 'colector';
export type Calidad = 'alta' | 'media';

export interface RotuloF10 { id: string; texto: string; ancla: [number, number, number] }

export interface MotorSceneProps {
  reloj: RelojMotor;
  izq: Polo;
  der: Polo;
  N: number;
  V: number;
  energizado: boolean;
  /** texto del freno para el rótulo (par en N·m) */
  carga: number;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  campo: boolean;
  vista: Vista;
  /** sube para volver al encuadre automático de la vista */
  encuadre?: number;
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#070a0e';
const GRAD = Math.PI / 180;

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    let tex: THREE.CanvasTexture | null = null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(240, 190, 10, 256, 250, 430);
      grad.addColorStop(0, '#1d2833'); grad.addColorStop(0.55, '#0f161d'); grad.addColorStop(1, FONDO);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      // tramado mínimo contra las bandas del degradado
      const img = g.getImageData(0, 0, 512, 512);
      let s = 1993;
      for (let i = 0; i < img.data.length; i += 4) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const d = ((s >> 16) & 3) - 1.5;
        img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d;
      }
      g.putImageData(img, 0, 0);
      tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    scene.background = tex ?? new THREE.Color(FONDO);
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.62;
    return () => { scene.environment = null; scene.background = null; env.dispose(); pm.dispose(); tex?.dispose(); };
  }, [gl, scene, calidad]);
  return null;
}

function Luces({ calidad }: { calidad: Calidad }) {
  const clave = useRef<THREE.SpotLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    l.shadow.bias = -0.0002; l.shadow.normalBias = 0.04; l.shadow.radius = 6;
    l.shadow.camera.near = 30; l.shadow.camera.far = 140; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(-1, -2, -5); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#b9c9da', '#08090c', 0.34]} />
      {/* clave cálida de estudio por delante a la izquierda: charco de luz y sombras suaves */}
      <spotLight ref={clave} position={[-34, 52, 40]} angle={0.42} penumbra={0.9} decay={0} intensity={2.3} color="#fff1df" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* contraluz fría: recorta el yugo, el colector y el freno */}
      <directionalLight position={[34, 26, -46]} intensity={1.05} color="#cfe0ff" />
      <directionalLight position={[40, 14, 30]} intensity={0.36} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6;
/** Bloom sólo en lo que emite (chispas, testigos, cometas del campo: HDR > 1) + ACES + viñeta. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.6} luminanceThreshold={1.3} luminanceSmoothing={0.2} radius={0.5} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number) {
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 0.5, 600);
  const tgt = objetivo.clone();
  const v = new THREE.Vector3();
  const caja = (d: number) => {
    cam.position.copy(tgt).addScaledVector(dir, d);
    cam.up.set(0, 1, 0); cam.lookAt(tgt);
    cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const p of puntos) { v.copy(p).project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    return { x0, x1, y0, y1 };
  };
  let d = 40;
  for (let pasada = 0; pasada < 3; pasada++) {
    let lo = 4, hi = 400;
    for (let i = 0; i < 44; i++) { const m = (lo + hi) / 2; const b = caja(m); if ((b.x1 - b.x0) / 2 <= mx && (b.y1 - b.y0) / 2 <= my) hi = m; else lo = m; }
    d = hi;
    const b = caja(d);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const medioAlto = d * Math.tan(THREE.MathUtils.degToRad(fov) / 2), medioAncho = medioAlto * aspecto;
    const derecha = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const arriba = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    tgt.addScaledVector(derecha, cx * medioAncho).addScaledVector(arriba, cy * medioAlto);
  }
  return { pos: tgt.clone().addScaledVector(dir, d), objetivo: tgt };
}

const direccion = (azGrad: number, elGrad: number) => {
  const az = azGrad * GRAD, el = elGrad * GRAD;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
};

interface DefVista { dir: THREE.Vector3; objetivo: THREE.Vector3; puntos: THREE.Vector3[]; mx: number; my: number }

function defVista(v: Vista): DefVista {
  const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const circulo = (r: number, z: number, n = 16) => Array.from({ length: n }, (_, i) => P(r * Math.cos((i / n) * Math.PI * 2), r * Math.sin((i / n) * Math.PI * 2), z));
  if (v === 'corte') return { dir: direccion(0, 0), objetivo: P(0, 0, 0), puntos: circulo(COTA.Ro + 0.15, 0, 32), mx: 0.9, my: 0.8 };
  if (v === 'colector') {
    const pts = [...circulo(1.4, COTA.zEscudo[1], 12), ...circulo(1.3, COTA.zColector[1] - 0.2, 12), P(0, 2.95, COTA.zEscobilla), P(0, -2.95, COTA.zEscobilla)];
    return { dir: direccion(74, 16), objetivo: P(0, 0, -5.4), puntos: pts, mx: 0.86, my: 0.72 };
  }
  // el motor manda: corte, escudo, escobillas, acople y tacómetro; el freno asoma por la derecha
  const pts = [
    ...circulo(COTA.Ro, 0, 24),
    ...circulo(COTA.Ro + 0.06, COTA.zEscudo[1], 12),
    P(0, COTA.rColector + 2.0, COTA.zEscobilla), P(0, -(COTA.rColector + 2.0), COTA.zEscobilla),
    ...circulo(COTA.rAcople, COTA.zAcople[1], 8),
    P(POS_SENSOR[0] + 1.0, 0.55, POS_SENSOR[2]),
    P(-2.9, COTA.yBase, -1.0), P(2.9, COTA.yBase, -1.0), P(0, COTA.yBase - 0.8, 2.0),
  ];
  return { dir: direccion(34, 21), objetivo: P(0, -0.5, -4), puntos: pts, mx: 0.9, my: 0.66 };
}

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Camara({ vista, reducido, encuadre }: { vista: Vista; reducido: boolean; encuadre: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const usuario = useRef(false);
  const primera = useRef(true);
  const anim = useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; o0: THREE.Vector3; o1: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    if (!controls) return;
    const f = () => { usuario.current = true; anim.current = null; };
    controls.addEventListener('start', f);
    return () => controls.removeEventListener('start', f);
  }, [controls]);
  const aspecto = size.width / Math.max(1, size.height);
  const ultimo = useRef({ encuadre, vista });
  useLayoutEffect(() => {
    if (!controls) return;
    if (ultimo.current.encuadre !== encuadre || ultimo.current.vista !== vista) { ultimo.current = { encuadre, vista }; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    const d = defVista(vista);
    // en vertical manda el ancho: se deja más margen arriba y abajo
    const p = encuadrar(d.dir, d.objetivo, d.puntos, camera.fov, aspecto, d.mx, aspecto < 1 ? Math.min(d.my, 0.6) : d.my);
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, vista, camera, reducido, encuadre]);
  useFrame((_, dt) => {
    const a = anim.current; if (!a || !controls) return;
    a.t = Math.min(1, a.t + dt / 0.9);
    const e = facil(a.t);
    camera.position.lerpVectors(a.p0, a.p1, e);
    controls.target.lerpVectors(a.o0, a.o1, e);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── líneas de campo ─────────────────────────────

const MAX_LINEAS = 28, PUNTOS = 220, Z_CAMPO = 0.03;

class CintasMotor {
  readonly geo = new THREE.BufferGeometry();
  private pos: Float32Array; private tan: Float32Array; private arco: Float32Array; private b: Float32Array;
  constructor() {
    const nv = MAX_LINEAS * PUNTOS * 2;
    this.pos = new Float32Array(nv * 3); this.tan = new Float32Array(nv * 3);
    this.arco = new Float32Array(nv); this.b = new Float32Array(nv);
    const lado = new Float32Array(nv);
    for (let v = 0; v < nv; v++) lado[v] = v % 2 ? 1 : -1;
    const idx = new Uint32Array(MAX_LINEAS * (PUNTOS - 1) * 6);
    let k = 0;
    for (let l = 0; l < MAX_LINEAS; l++) for (let p = 0; p < PUNTOS - 1; p++) {
      const a = (l * PUNTOS + p) * 2;
      idx[k++] = a; idx[k++] = a + 1; idx[k++] = a + 2;
      idx[k++] = a + 1; idx[k++] = a + 3; idx[k++] = a + 2;
    }
    const g = this.geo;
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('aTan', new THREE.BufferAttribute(this.tan, 3));
    g.setAttribute('aLado', new THREE.BufferAttribute(lado, 1));
    g.setAttribute('aArco', new THREE.BufferAttribute(this.arco, 1));
    g.setAttribute('aB', new THREE.BufferAttribute(this.b, 1));
    g.setDrawRange(0, 0);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), COTA.Ro + 1);
  }
  actualizar(lineas: LineaCampo[]) {
    const L = lineas.slice(0, MAX_LINEAS);
    L.forEach((ln, l) => {
      const n = Math.min(PUNTOS, ln.x.length);
      for (let p = 0; p < PUNTOS; p++) {
        const q = Math.min(n - 1, p);
        const qa = Math.max(0, q - 1), qb = Math.min(n - 1, q + 1);
        let tx = ln.x[qb] - ln.x[qa], ty = ln.y[qb] - ln.y[qa];
        if (q === 0 || q === n - 1) { tx = ln.x[1] - ln.x[n - 2]; ty = ln.y[1] - ln.y[n - 2]; } // lazo cerrado
        const m = Math.hypot(tx, ty) || 1;
        for (let s = 0; s < 2; s++) {
          const v = (l * PUNTOS + p) * 2 + s;
          this.pos[v * 3] = ln.x[q]; this.pos[v * 3 + 1] = ln.y[q]; this.pos[v * 3 + 2] = Z_CAMPO;
          this.tan[v * 3] = tx / m; this.tan[v * 3 + 1] = ty / m; this.tan[v * 3 + 2] = 0;
          this.arco[v] = ln.s[q]; this.b[v] = ln.b[q];
        }
      }
    });
    for (const nm of ['position', 'aTan', 'aArco', 'aB']) (this.geo.getAttribute(nm) as THREE.BufferAttribute).needsUpdate = true;
    this.geo.setDrawRange(0, L.length * (PUNTOS - 1) * 6);
  }
  dispose() { this.geo.dispose(); }
}

function Campo({ tipo, signo, visible, reducido }: { tipo: TipoCampo; signo: number; visible: boolean; reducido: boolean }) {
  const cintas = useMemo(() => new CintasMotor(), []);
  const mat = useMemo(() => materialLineas(), []);
  const size = useThree((s) => s.size);
  const [listo, setListo] = useState<TipoCampo | null>(null);
  useEffect(() => () => { cintas.dispose(); mat.dispose(); }, [cintas, mat]);
  // el trazado (≈ 0,3 s) espera a que la escena haya pintado
  useEffect(() => {
    let vivo = true;
    const t = window.setTimeout(() => {
      if (!vivo) return;
      cintas.actualizar(lineasCampo(tipo));
      setListo(tipo);
    }, listo === null ? 120 : 0);
    return () => { vivo = false; window.clearTimeout(t); };
  }, [tipo, cintas]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { mat.uniforms.uSentido.value = signo; }, [mat, signo]);
  useFrame((_, dt) => {
    const u = mat.uniforms;
    u.uRes.value.set(size.width, size.height);
    if (!reducido) u.uT.value += Math.min(dt, 0.1);
    const meta = listo === tipo ? 1 : 0;
    u.uOpac.value = reducido ? meta : u.uOpac.value + (meta - u.uOpac.value) * Math.min(1, dt * 3.5);
  });
  return <mesh geometry={cintas.geo} material={mat} visible={visible} renderOrder={5} frustumCulled={false} userData={{ pieza: 'campo' }} />;
}

// ───────────────────────────── fuerzas, corriente, chispas ─────────────────────────────

/** Largo de la flecha (cm) para una fuerza F (N): ∝ √F, entre 0,4 y 2,6 cm (se dice en «Modelo»). */
export const largoFlecha = (F: number) => Math.min(2.6, Math.max(0.4, 0.35 + 1.15 * Math.sqrt(Math.abs(F) / 0.25)));

function Flecha({ refG, mat }: { refG: React.RefObject<THREE.Group | null>; mat: THREE.Material }) {
  const cuerpo = useMemo(() => { const g = new THREE.CylinderGeometry(0.055, 0.055, 1, 16); g.rotateZ(-Math.PI / 2); g.translate(0.5, 0, 0); return g; }, []);
  const punta = useMemo(() => { const g = new THREE.ConeGeometry(0.17, 0.42, 24); g.rotateZ(-Math.PI / 2); return g; }, []);
  useEffect(() => () => { cuerpo.dispose(); punta.dispose(); }, [cuerpo, punta]);
  return (
    <group ref={refG} visible={false} userData={{ pieza: 'fuerza' }}>
      <mesh name="cuerpo" geometry={cuerpo} material={mat} />
      <mesh name="punta" geometry={punta} material={mat} />
    </group>
  );
}

/** ⊙ (sale) o ⊗ (entra): un solo trazo plano. */
function Simbolo({ refG, mat, punto }: { refG: React.RefObject<THREE.Group | null>; mat: THREE.Material; punto: boolean }) {
  const geo = useMemo(() => {
    const partes: THREE.BufferGeometry[] = [new THREE.RingGeometry(0.17, 0.215, 40)];
    if (punto) partes.push(new THREE.CircleGeometry(0.058, 20));
    else for (const a of [Math.PI / 4, -Math.PI / 4]) { const b = new THREE.PlaneGeometry(0.3, 0.045); b.rotateZ(a); partes.push(b); }
    return mergeGeos(partes);
  }, [punto]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group ref={refG} visible={false} userData={{ pieza: punto ? 'corrienteSale' : 'corrienteEntra' }}>
      <mesh geometry={geo} material={mat} />
    </group>
  );
}

/** Fuerzas de Lorentz y símbolos de corriente sobre los lados de la bobina alimentada (marco fijo). */
function Fuerzas({ reloj, N, visible }: { reloj: RelojMotor; N: number; visible: boolean }) {
  const f0 = useRef<THREE.Group>(null), f1 = useRef<THREE.Group>(null);
  const sEntra = useRef<THREE.Group>(null), sSale = useRef<THREE.Group>(null);
  const matF = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb24a').multiplyScalar(1.05), toneMapped: false }), []);
  const matS = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color('#eaf6ff'), toneMapped: false, side: THREE.DoubleSide }), []);
  useEffect(() => () => { matF.dispose(); matS.dispose(); }, [matF, matS]);
  const rc = useMemo(() => centroHaz(0, N).length(), [N]);
  useFrame(() => {
    const { c, p, e } = reloj;
    const I = reloj.lectura().I;
    const hay = visible && I > 1e-6;
    const { lados } = ladosActivos(c, p.N, I, e.theta);
    [f0, f1].forEach((ref, k) => {
      const g = ref.current; if (!g) return;
      const l = lados[k];
      const F = Math.abs(l.Fphi);
      g.visible = hay && F > 1e-6;
      if (!g.visible) return;
      const cx = rc * Math.cos(l.phi), cy = rc * Math.sin(l.phi);
      g.position.set(cx, cy, 0.09);
      // dirección: signo(Fφ)·φ̂
      const ang = l.phi + (l.Fphi >= 0 ? Math.PI / 2 : -Math.PI / 2);
      g.rotation.set(0, 0, ang);
      const L = largoFlecha(F);
      const cuerpo = g.getObjectByName('cuerpo')!, punta = g.getObjectByName('punta')!;
      cuerpo.scale.set(Math.max(0.01, L - 0.4), 1, 1);
      punta.position.set(L - 0.21, 0, 0);
      g.userData.F = F;
    });
    // símbolos: lado derecho ⊗ (entra), izquierdo ⊙ (sale)
    const sim: [React.RefObject<THREE.Group | null>, number][] = [[sEntra, lados[0].phi], [sSale, lados[1].phi]];
    for (const [ref, phi] of sim) {
      const g = ref.current; if (!g) continue;
      g.visible = hay;
      g.position.set(rc * Math.cos(phi), rc * Math.sin(phi), 0.075);
    }
  });
  return (
    <group>
      <Flecha refG={f0} mat={matF} />
      <Flecha refG={f1} mat={matF} />
      <Simbolo refG={sEntra} mat={matS} punto={false} />
      <Simbolo refG={sSale} mat={matS} punto />
    </group>
  );
}

/** Chispas en el contacto escobilla–delga al conmutar (dura 70 ms de pantalla). */
function Chispas({ reloj, reducido }: { reloj: RelojMotor; reducido: boolean }) {
  const tex = useMemo(() => texturaDestello(), []);
  const mat = useMemo(() => new THREE.SpriteMaterial({ map: tex ?? undefined, color: new THREE.Color('#bcd8ff'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }), [tex]);
  useEffect(() => () => { mat.dispose(); tex?.dispose(); }, [mat, tex]);
  const a = useRef<THREE.Sprite>(null), b = useRef<THREE.Sprite>(null);
  useFrame(() => {
    const r = reloj;
    const I = r.lectura().I;
    const tReal = (r.e.t - r.tConmuta) / Math.max(1e-9, r.factor);
    const k = reducido ? 0 : Math.max(0, 1 - tReal / 0.07) * Math.min(1, I / 0.6);
    for (const s of [a.current, b.current]) {
      if (!s) continue;
      s.visible = k > 0.01;
      s.scale.setScalar(0.35 + 0.45 * k);
    }
    mat.color.setRGB(0.74 * 3 * k, 0.85 * 3 * k, 3 * k);
  });
  const z = COTA.zEscobilla + 0.32, r = COTA.rColector + 0.02;
  return (
    <group>
      <sprite ref={a} material={mat} position={[0.22, r, z]} visible={false} />
      <sprite ref={b} material={mat} position={[-0.22, -r, z]} visible={false} />
    </group>
  );
}

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;

const ROT_ARRIBA = 46;
const ROT_ABAJO = 40;

function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloF10[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (rotulos.length === 0) return;
    const cajas: { x: number; y: number; w: number; h: number }[] = [];
    const lista = rotulos.slice(0, 8).map((r) => {
      v.set(...r.ancla).project(camera);
      return { r, x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, z: v.z };
    }).sort((a, b) => a.y - b.y);
    for (const it of lista) {
      const el = nodos.current.get(it.r.id); if (!el) continue;
      const dentro = it.z < 1 && it.x > 0 && it.x < size.width && it.y > 0 && it.y < size.height;
      el.style.opacity = dentro ? '1' : '0';
      if (!dentro) continue;
      const w = el.offsetWidth || 120, h = el.offsetHeight || 22;
      const x = Math.min(size.width - w - 4, Math.max(4, it.x - w / 2));
      // franjas reservadas: botones del lienzo arriba (≈ 44 px) y pausa/calidad abajo (≈ 40 px)
      let y = Math.max(ROT_ARRIBA, it.y - h - 8);
      for (let k = 0; k < 12; k++) {
        const choca = cajas.find((c) => x < c.x + c.w + 4 && x + w + 4 > c.x && y < c.y + c.h + 3 && y + h + 3 > c.y);
        if (!choca) break;
        y = choca.y + choca.h + 4;
      }
      y = Math.min(size.height - h - ROT_ABAJO, y);
      cajas.push({ x, y, w, h });
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }
  });
  return null;
}

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[280px] rounded-md border border-white/15 bg-[#0b1220]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-f10="">
      {d.texto}
    </div>
  );
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function DiagnosticoDev({ reloj, calidad, vista }: { reloj: RelojMotor; calidad: Calidad; vista: Vista }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const medida = useRef({ llamadas: 0, triangulos: 0, fps: 0, n: 0, t0: 0 });
  useEffect(() => {
    if (!DEV) return;
    const antes = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = antes; };
  }, [gl]);
  // prioridad NEGATIVA: con > 0 r3f deja de dibujar solo y el lienzo sale negro
  useFrame(() => {
    if (!DEV) return;
    const r = gl.info.render, m = medida.current;
    m.llamadas = r.calls; m.triangulos = r.triangles;
    gl.info.reset();
    const ahora = performance.now();
    m.n++;
    if (!m.t0) m.t0 = ahora;
    if (ahora - m.t0 >= 1000) { m.fps = (m.n * 1000) / (ahora - m.t0); m.n = 0; m.t0 = ahora; }
  }, -20);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __fis10?: unknown };
    w.__fis10 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulosDibujados: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj;
        return { p: r.p, theta: r.e.theta, omega: r.e.omega, rpm: r.rpm, t: r.e.t, factor: r.factor, ventana: r.ventana, lectura: r.lectura(), tacho: r.tacho, regimen: r.reg, bobina: r.bobina, pausa: r.pausa };
      },
      /** sólo desarrollo: lleva el motor a su régimen */
      regimen() { reloj.arrancarEnRegimen(); return reloj.reg; },
      /** sólo desarrollo: pausa y fija el ángulo del inducido (capturas) */
      angulo(gr: number) { reloj.pausa = true; reloj.e.theta = gr * GRAD; reloj.e.tau = 0; return reloj.e.theta; },
      pausa(p: boolean) { reloj.pausa = p; },
      /** fracción del alto del lienzo que ocupan los puntos del encuadre */
      fraccion() {
        const d = defVista(vista);
        const v = new THREE.Vector3();
        let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
        for (const p of d.puntos) { v.copy(p).project(camera); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); }
        return { alto: (y1 - y0) / 2, ancho: (x1 - x0) / 2, lienzo: { w: size.width, h: size.height } };
      },
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const r = gl.domElement.getBoundingClientRect();
        return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
      },
      escena: scene,
    };
    return () => { delete w.__fis10; };
  }, [gl, scene, reloj, calidad, camera, vista, size]);
  return null;
}

function AvisarListo({ onListo }: { onListo?: () => void }) {
  const n = useRef(0);
  useFrame(() => {
    if (n.current > 3) return;
    n.current++;
    if (n.current === 3) onListo?.();
  });
  return null;
}

// ───────────────────────────── el banco ─────────────────────────────

function Banco({ p, mats, rotulo, publicarRotulos, nodos }: {
  p: MotorSceneProps; mats: MatsMotor;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloF10[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { reloj, izq, der, N, V, energizado, carga, reducido, vista, encuadre = 0 } = p;
  const cfg = useMemo(() => configImanes(izq, der), [izq, der]);

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.paso(dt); }, -1);

  // el inducido gira con el ángulo del modelo (+ horario visto de frente = rotación −θ en z)
  const rotor = useRef<THREE.Group>(null);
  useFrame(() => { if (rotor.current) rotor.current.rotation.z = -reloj.e.theta; });

  // corriente: trazos en la cabeza de la bobina alimentada y brillo de su cobre
  const flujo = useMemo(() => [materialCorriente(), materialCorriente()] as [THREE.ShaderMaterial, THREE.ShaderMaterial], []);
  useEffect(() => () => flujo.forEach((m) => m.dispose()), [flujo]);
  useFrame((_, dt) => {
    const I = reloj.lectura().I;
    const { bobina } = bobinaActiva(reloj.e.theta);
    const env = (x: number) => x - 2 * Math.PI * Math.floor(x / (2 * Math.PI) + 0.5);
    for (const k of [0, 1] as const) {
      const activa = k === bobina && I > 1e-6;
      const u = flujo[k].uniforms;
      // ¿la ranura de inicio de su cabeza (0° la A, 90° la B) es ahora el lado derecho (⊗)?
      const inicio = env((k === 0 ? 0 : Math.PI / 2) - reloj.e.theta);
      u.uSentido.value = Math.abs(inicio) <= Math.PI / 2 ? 1 : -1;
      const meta = activa ? Math.min(1.6, 0.55 + 0.75 * Math.sqrt(I)) : 0;
      u.uInt.value += (meta - u.uInt.value) * Math.min(1, dt * 18);
      if (!reducido) u.uT.value += Math.min(dt, 0.1) * (0.7 + 0.9 * Math.min(1, I));
      const brillo = activa ? Math.min(0.55, 0.12 + 0.3 * Math.sqrt(I)) : 0;
      for (const m of [mats.esmalte[k], mats.cobreCorte[k]]) m.emissiveIntensity += (brillo - m.emissiveIntensity) * Math.min(1, dt * 18);
    }
  });

  // tacómetro: punto rojo del emisor y testigo verde con cada pulso
  const led = useRef<THREE.Mesh>(null), punto = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const m = led.current?.material as THREE.MeshBasicMaterial | undefined;
    if (!m) return;
    const tReal = (reloj.e.t - reloj.tacho.tPulso) / Math.max(1e-9, reloj.factor);
    const on = tReal >= 0 && tReal < 0.09;
    m.color.set(on ? '#7dffa0' : '#1a3a22');
    if (on) m.color.multiplyScalar(2.4);
  });

  const perilla = useRef<THREE.Group>(null), palanca = useRef<THREE.Group>(null);

  // rótulo al pasar el ratón
  const textoPieza = useCallback((o: THREE.Object3D | null): string | null => {
    let x: THREE.Object3D | null = o;
    while (x && !x.userData?.pieza) x = x.parent;
    if (!x) return null;
    const u = x.userData as Record<string, unknown>;
    const l = reloj.lectura();
    switch (u.pieza) {
      case 'yugo': return 'Yugo de acero: cierra el circuito magnético';
      case 'iman': return `Imán ${u.lado === 'izq' ? 'izquierdo' : 'derecho'} · polo ${u.polo} hacia el inducido`;
      case 'inducido': return 'Inducido de chapa magnética con 4 ranuras';
      case 'bobina': {
        const activa = bobinaActiva(reloj.e.theta).bobina === u.bobina && l.I > 0;
        return `Bobina ${u.bobina === 0 ? 'A' : 'B'} · ${N} espiras${activa ? ' · la alimenta el conmutador ahora' : ''}`;
      }
      case 'salidas': return 'Salidas de las bobinas a las delgas';
      case 'eje': return 'Eje de acero';
      case 'colector': return 'Conmutador: 4 delgas de cobre aisladas con mica';
      case 'escobilla': return `Escobilla de carbón (${u.arriba ? '+' : '−'})`;
      case 'portaescobillas': return 'Anillo portaescobillas';
      case 'escudo': return 'Escudo trasero con rodamiento';
      case 'acople': return 'Acople elástico con la cinta del tacómetro';
      case 'tacometro': return 'Tacómetro óptico: un pulso por vuelta';
      case 'freno': return `Freno de partículas magnéticas · ${cifra(carga, 3)} N·m`;
      case 'bateria': return 'Batería: dos de 12 V en serie';
      case 'regulador': return `Regulador · ${cifra(V, 1)} V${energizado ? '' : ' · circuito abierto'}`;
      case 'cables': return 'Cables a las escobillas';
      case 'base': case 'silla': return 'Placa base y sillas del motor';
      case 'campo': return 'Líneas de campo B: entre dos vecinas pasa el mismo flujo';
      case 'fuerza': return `Fuerza de Lorentz sobre el lado: F = N·I·L·B = ${cifraSig(Number(x.userData.F ?? 0), 2)} N`;
      case 'corrienteEntra': return 'Corriente hacia dentro (⊗)';
      case 'corrienteSale': return 'Corriente hacia fuera (⊙)';
      default: return null;
    }
  }, [reloj, N, carga, V, energizado]);
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const t = textoPieza(e.object);
    rotulo.current(t ? { texto: t, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  // rótulos fijos (≤ 8)
  const rotulos = useMemo<RotuloF10[]>(() => {
    if (!p.rotulos) return [];
    const r: RotuloF10[] = [
      { id: 'iz', texto: `Imán ${izq}`, ancla: [-(COTA.Rm + COTA.Ry) / 2, 0.9, 0] },
      { id: 'de', texto: `Imán ${der}`, ancla: [(COTA.Rm + COTA.Ry) / 2, -0.9, 0] },
      { id: 'in', texto: 'Inducido', ancla: [0, -1.2, 0] },
      { id: 'yu', texto: 'Yugo', ancla: [-2.2, -2.2, 0] },
      { id: 'co', texto: 'Conmutador', ancla: [0, -0.4, COTA.zColector[1]] },
      { id: 'es', texto: 'Escobilla', ancla: [0, COTA.rColector + 1.2, COTA.zEscobilla] },
      { id: 'ta', texto: 'Tacómetro', ancla: [POS_SENSOR[0] + 0.3, 0.6, POS_SENSOR[2]] },
      { id: 'fr', texto: 'Freno', ancla: [COTA.rFreno + 0.2, 0.6, (COTA.zFreno[0] + COTA.zFreno[1]) / 2] },
    ];
    // sólo lo que se ve desde cada vista: de frente, el corte tapa conmutador, tacómetro y freno
    const visibles: Record<Vista, string[] | null> = { '34': null, corte: ['iz', 'de', 'in', 'yu'], colector: ['co', 'es', 'ta', 'fr'] };
    const v = visibles[p.vista];
    return v ? r.filter((x) => v.includes(x.id)) : r;
  }, [p.rotulos, p.vista, izq, der]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara vista={vista} reducido={reducido} encuadre={encuadre} />
      <Base mats={mats} />
      <Estator mats={mats} izq={izq} der={der} />
      <group ref={rotor}>
        <Inducido mats={mats} N={N} corriente={flujo} />
      </group>
      <Escudo mats={mats} />
      <Escobillas mats={mats} />
      <Freno mats={mats} />
      <Tacometro mats={mats} led={led} punto={punto} />
      <Bateria mats={mats} />
      <Regulador mats={mats} V={V} energizado={energizado} perilla={perilla} palanca={palanca} />
      <Cables mats={mats} />
      <Campo tipo={cfg.tipo} signo={cfg.signo} visible={p.campo} reducido={reducido} />
      <Fuerzas reloj={reloj} N={N} visible />
      <Chispas reloj={reloj} reducido={reducido} />
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} />
    </group>
  );
}

export default function MotorElectrico3DScene(props: MotorSceneProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const mats = useMemo(() => crearMateriales(calidad), [calidad]);
  useEffect(() => () => mats.todos.forEach((m) => m.dispose()), [mats]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloF10[]>([]);
  const dprMedia = typeof window !== 'undefined' ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-f10="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 2] : [dprMedia, dprMedia]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [20, 14, 34], fov: 30, near: 0.5, far: 600 }}
        onPointerMissed={() => rotulo.current(null)}
      >
        <Ajustes calidad={calidad} />
        <Luces calidad={calidad} />
        <ControlesBanco objetivo={[-1, 0, -5]} fondo="laboratorio"
          limites={{ minDistancia: 8, maxDistancia: 140, maxPolar: 1.62, minPolar: 0.12, paneo: true, cajaObjetivo: [[-10, -5, -15], [8, 6, 4]] }} />
        <Banco p={props} mats={mats} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} />
        <DiagnosticoDev reloj={props.reloj} calidad={calidad} vista={props.vista} />
        <AvisarListo onListo={props.onListo} />
        {alta && <Posproceso />}
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1420]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-f10={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
