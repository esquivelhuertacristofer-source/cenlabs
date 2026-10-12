'use client';
/**
 * _kit/LabStage.tsx — ESCENARIO de laboratorio para los labs base.
 *
 *   <Canvas …><LabStage fondo="laboratorio" calidad="alta">…piezas…</LabStage></Canvas>
 * o directamente:
 *   <LabCanvas fondo="laboratorio" calidad="media" camara={{ posicion:[0,3,7], objetivo:[0,1,0] }}>…</LabCanvas>
 *
 * Convenciones: 1 u = 1 dm. La CUBIERTA de la mesa está en y = 0 (una pieza con
 * position y=0 se apoya en la mesa). +Z apunta al alumno; la pared está al fondo (−Z).
 *
 * Luz: clave con sombras + relleno + cielo/suelo; reflejos con un <Environment>
 * PROCEDURAL hecho de <Lightformer> (sin `preset` ni HDR remoto: tiene que
 * funcionar sin internet). Tone mapping neutro (Khronos PBR Neutral: respeta los
 * colores de los indicadores y de los líquidos). Sin Stars/Sparkles/bloom.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { EffectComposer, N8AO, Vignette, SMAA } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { KitContexto, useMateriales, type Calidad } from './materiales';
import { cajaRedondeada } from './geometria';
import { azar, dibujarMoteado, texturaCompartida } from './texturas';

export type Fondo = 'laboratorio' | 'pizarron' | 'campo';
type V3 = [number, number, number];

export interface CamaraBanco {
  posicion?: V3;
  objetivo?: V3;
  fov?: number;
}
export interface LimitesControles {
  minDistancia?: number;
  maxDistancia?: number;
  /** ángulo polar máximo (rad desde la vertical). Por defecto 1,45 ≈ 83°: no baja de la mesa */
  maxPolar?: number;
  minPolar?: number;
  /** caja donde puede moverse el objetivo al desplazar (pan) */
  cajaObjetivo?: [V3, V3];
  paneo?: boolean;
  rotacionAuto?: boolean;
}

export interface LabStageProps {
  fondo?: Fondo;
  calidad?: Calidad;
  /** encuadre inicial */
  camara?: CamaraBanco;
  /** OrbitControls con límites (false = sin controles) */
  controles?: boolean | LimitesControles;
  /** mesa: dimensiones en u (sólo fondo laboratorio). false = sin mesa */
  mesa?: false | { ancho?: number; fondo?: number; color?: string };
  /** sombras dinámicas (por defecto sí) */
  sombras?: boolean;
  /** postproceso sobrio (AO + viñeta); apagado por defecto */
  postproceso?: boolean;
  /** extensión del suelo del fondo "campo" (u) */
  extensionCampo?: number;
  children?: React.ReactNode;
}

const CAM_DEF: Record<Fondo, Required<CamaraBanco>> = {
  laboratorio: { posicion: [0, 4.2, 9.5], objetivo: [0, 1.2, 0], fov: 35 },
  pizarron: { posicion: [0, 0, 14], objetivo: [0, 0, 0], fov: 35 },
  campo: { posicion: [-6, 5, 16], objetivo: [6, 1.5, 0], fov: 45 },
};
const FONDO_COLOR: Record<Fondo, string> = { laboratorio: '#dfe3e6', pizarron: '#34434b', campo: '#b9d3e6' };

/** Fija la cámara al montar y cuando cambian los valores (no en cada render). */
export function useCamaraBanco(c: CamaraBanco = {}, fondo: Fondo = 'laboratorio') {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const d = CAM_DEF[fondo];
  const p = c.posicion ?? d.posicion, o = c.objetivo ?? d.objetivo, fov = c.fov ?? d.fov;
  const clave = [...p, ...o, fov].join(',');
  useLayoutEffect(() => {
    camera.position.set(p[0], p[1], p[2]);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      (camera as THREE.PerspectiveCamera).fov = fov;
      (camera as THREE.PerspectiveCamera).near = 0.05;
      (camera as THREE.PerspectiveCamera).far = fondo === 'campo' ? 6000 : 400;
      camera.updateProjectionMatrix();
    }
    camera.lookAt(o[0], o[1], o[2]);
    if (controls && 'target' in controls) { controls.target.set(o[0], o[1], o[2]); controls.update(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, camera, controls]);
}

/** OrbitControls con límites: no atraviesa la mesa, no se aleja al infinito. */
export function ControlesBanco({ objetivo, limites = {}, fondo = 'laboratorio' }: { objetivo?: V3; limites?: LimitesControles; fondo?: Fondo }) {
  const ref = useRef<OrbitControlsImpl>(null);
  const caja = limites.cajaObjetivo;
  const def = CAM_DEF[fondo];
  const o = objetivo ?? def.objetivo;
  const onChange = useMemo(() => {
    if (!caja) return undefined;
    return () => {
      const c = ref.current; if (!c) return;
      const t = c.target;
      const x = Math.min(caja[1][0], Math.max(caja[0][0], t.x));
      const y = Math.min(caja[1][1], Math.max(caja[0][1], t.y));
      const z = Math.min(caja[1][2], Math.max(caja[0][2], t.z));
      if (x !== t.x || y !== t.y || z !== t.z) {
        const dx = x - t.x, dy = y - t.y, dz = z - t.z;
        t.set(x, y, z);
        c.object.position.x += dx; c.object.position.y += dy; c.object.position.z += dz;
      }
    };
  }, [caja]);
  return (
    <OrbitControls
      ref={ref}
      makeDefault
      target={o}
      enableDamping
      dampingFactor={0.09}
      minDistance={limites.minDistancia ?? 1.2}
      maxDistance={limites.maxDistancia ?? (fondo === 'campo' ? 400 : 28)}
      maxPolarAngle={limites.maxPolar ?? (fondo === 'pizarron' ? Math.PI : 1.45)}
      minPolarAngle={limites.minPolar ?? 0.05}
      enablePan={limites.paneo ?? true}
      autoRotate={limites.rotacionAuto ?? false}
      autoRotateSpeed={0.6}
      onChange={onChange}
    />
  );
}

// ───────────────────────────── fondos ─────────────────────────────

function texAzulejo() {
  return texturaCompartida('azulejo', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#d5d8da'; ctx.fillRect(0, 0, w, h); // junta
    const n = 4, s = w / n, j = 2;
    const rnd = azar(21);
    for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
      const v = 226 + Math.floor(rnd() * 8);
      const g = ctx.createLinearGradient(i * s, k * s, i * s + s, k * s + s);
      g.addColorStop(0, `rgb(${v},${v + 1},${v + 2})`); g.addColorStop(1, `rgb(${v - 6},${v - 5},${v - 4})`);
      ctx.fillStyle = g;
      ctx.fillRect(i * s + j, k * s + j, s - 2 * j, s - 2 * j);
    }
  }, { repetir: [10, 2] });
}

function texPasto() {
  return texturaCompartida('pasto', 512, 512, (ctx, w, h) => {
    dibujarMoteado(ctx, w, h, '#5f7f3a', [
      { color: '#4a6a2b', n: 2600, r: [1, 3], alfa: 0.5 },
      { color: '#7d9a4c', n: 2200, r: [0.8, 2.4], alfa: 0.45 },
      { color: '#8d8a55', n: 300, r: [1.5, 4], alfa: 0.25 },
    ], 33);
    const rnd = azar(34);
    ctx.lineWidth = 1;
    for (let i = 0; i < 2500; i++) {
      const x = rnd() * w, y = rnd() * h, l = 3 + rnd() * 6;
      ctx.strokeStyle = rnd() > 0.5 ? 'rgba(120,150,70,0.5)' : 'rgba(60,85,35,0.5)';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - 0.5) * 2, y - l); ctx.stroke();
    }
  });
}
function texTierra() {
  return texturaCompartida('tierra', 512, 512, (ctx, w, h) => {
    dibujarMoteado(ctx, w, h, '#9b8462', [
      { color: '#7d6849', n: 2400, r: [1, 3], alfa: 0.5 },
      { color: '#b8a17c', n: 1800, r: [0.8, 2.5], alfa: 0.45 },
      { color: '#6b6560', n: 220, r: [2, 5], alfa: 0.4 },
    ], 41);
  });
}

function Mesa({ ancho = 18, fondo = 7.5, color }: { ancho?: number; fondo?: number; color?: string }) {
  const m = useMateriales();
  const grosor = 0.32;
  const matMesa = useMemo(() => {
    if (!color) return m.resinaMesa;
    const c = (m.resinaMesa as THREE.MeshPhysicalMaterial).clone(); c.color.set(color); return c;
  }, [color, m]);
  useEffect(() => () => { if (matMesa !== m.resinaMesa) matMesa.dispose(); }, [matMesa, m]);
  const tex = texAzulejo();
  const matPared = useMemo(() => new THREE.MeshStandardMaterial({ color: tex ? '#ffffff' : '#eceeef', map: tex, roughness: 0.35 }), [tex]);
  const matMuro = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d8dcdf', roughness: 0.9 }), []);
  const matMueble = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8c959c', roughness: 0.6 }), []);
  const matSuelo = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9aa0a3', roughness: 0.8 }), []);
  useEffect(() => () => { matPared.dispose(); matMuro.dispose(); matMueble.dispose(); matSuelo.dispose(); }, [matPared, matMuro, matMueble, matSuelo]);
  const zPared = -fondo / 2 - 0.02;
  return (
    <group>
      {/* cubierta de resina con canto redondeado; la superficie queda en y = 0 */}
      <mesh geometry={cajaRedondeada(ancho, grosor, fondo, 0.06, 3)} material={matMesa} position={[0, -grosor / 2, 0]} receiveShadow />
      {/* mueble bajo la cubierta, retranqueado (no se ven patas) */}
      <mesh geometry={cajaRedondeada(ancho - 0.6, 8.6, fondo - 0.9, 0.03, 1)} material={matMueble} position={[0, -grosor - 4.3, -0.25]} />
      {/* zócalo de azulejo y muro */}
      {/* la pared NO recibe sombras: en un laboratorio con luz difusa de techo apenas se ven */}
      <mesh position={[0, 3, zPared]} material={matPared}>
        <planeGeometry args={[ancho + 30, 6]} />
      </mesh>
      <mesh position={[0, 6 + 7, zPared - 0.001]} material={matMuro}>
        <planeGeometry args={[ancho + 30, 14]} />
      </mesh>
      <mesh position={[0, -9.2, 10]} rotation-x={-Math.PI / 2} material={matSuelo} receiveShadow>
        <planeGeometry args={[120, 60]} />
      </mesh>
    </group>
  );
}

function Campo({ extension = 1500 }: { extension?: number }) {
  const pasto = texPasto(), tierra = texTierra();
  const matPasto = useMemo(() => {
    const t = pasto?.clone(); if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(extension / 6, extension / 6); t.needsUpdate = true; }
    return new THREE.MeshStandardMaterial({ color: '#ffffff', map: t ?? null, roughness: 0.95 });
  }, [pasto, extension]);
  const matTierra = useMemo(() => {
    const t = tierra?.clone(); if (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(extension / 8, 3); t.needsUpdate = true; }
    return new THREE.MeshStandardMaterial({ color: '#ffffff', map: t ?? null, roughness: 1 });
  }, [tierra, extension]);
  useEffect(() => () => { matPasto.map?.dispose(); matPasto.dispose(); matTierra.map?.dispose(); matTierra.dispose(); }, [matPasto, matTierra]);
  // cielo: esfera con degradado por vértice (sin sombreador remoto)
  const cielo = useMemo(() => {
    const g = new THREE.SphereGeometry(extension * 2.5, 32, 16);
    const p = g.getAttribute('position');
    const col = new Float32Array(p.count * 3);
    const zen = new THREE.Color('#5d93c8'), hor = new THREE.Color('#dfeaf1'), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / (extension * 2.5);
      c.copy(hor).lerp(zen, Math.pow(Math.max(0, y), 0.55));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [extension]);
  const matCielo = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }), []);
  // colinas lejanas: anillo de lomas bajas (una sola geometría)
  const colinas = useMemo(() => {
    const n = 90, R = extension * 0.95;
    const pts: number[] = [];
    const rnd = azar(9);
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2;
      const hgt = 18 + 40 * Math.pow(Math.sin(a * 3 + 1) * 0.5 + 0.5, 2) + rnd() * 16;
      pts.push(Math.sin(a) * R, 0, Math.cos(a) * R, Math.sin(a) * R, hgt, Math.cos(a) * R);
    }
    const idx: number[] = [];
    for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setIndex(idx); g.computeVertexNormals();
    return g;
  }, [extension]);
  const matColinas = useMemo(() => new THREE.MeshStandardMaterial({ color: '#6d8a6a', roughness: 1, side: THREE.DoubleSide }), []);
  useEffect(() => () => { cielo.dispose(); colinas.dispose(); matCielo.dispose(); matColinas.dispose(); }, [cielo, colinas, matCielo, matColinas]);
  return (
    <group>
      <mesh geometry={cielo} material={matCielo} renderOrder={-10} />
      <mesh rotation-x={-Math.PI / 2} material={matPasto} receiveShadow>
        <planeGeometry args={[extension * 2, extension * 2]} />
      </mesh>
      {/* franja de tierra a lo largo de +X (la línea de tiro) */}
      <mesh rotation-x={-Math.PI / 2} position={[extension / 2 - 20, 0.002, 0]} material={matTierra} receiveShadow>
        <planeGeometry args={[extension + 40, 14]} />
      </mesh>
      <mesh geometry={colinas} material={matColinas} />
    </group>
  );
}

// ───────────────────────────── luces ─────────────────────────────

function Luces({ fondo, calidad, sombras }: { fondo: Fondo; calidad: Calidad; sombras: boolean }) {
  const clave = useRef<THREE.DirectionalLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    const cam = l.shadow.camera as THREE.OrthographicCamera;
    const s = fondo === 'campo' ? 40 : 12;
    cam.left = -s; cam.right = s; cam.top = s; cam.bottom = -s; cam.near = 0.5; cam.far = fondo === 'campo' ? 200 : 60;
    cam.updateProjectionMatrix();
    l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02;
    l.shadow.radius = 4;
    l.target.position.set(0, 0, 0); l.target.updateMatrixWorld();
  }, [fondo]);
  if (fondo === 'pizarron') {
    return (
      <>
        <hemisphereLight args={['#f2f5f7', '#3a464d', 1.1]} />
        <directionalLight position={[4, 8, 10]} intensity={1.6} />
        <directionalLight position={[-6, -2, 8]} intensity={0.5} />
      </>
    );
  }
  if (fondo === 'campo') {
    return (
      <>
        <hemisphereLight args={['#cfe3f5', '#5d6b45', 1.0]} />
        <directionalLight ref={clave} position={[-30, 50, 25]} intensity={2.6} color="#fff4e2" castShadow={sombras}
          shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      </>
    );
  }
  return (
    <>
      <hemisphereLight args={['#eef2f6', '#5d666c', 0.35]} />
      <directionalLight ref={clave} position={[-5, 11, 7]} intensity={2.7} color="#fff8ee" castShadow={sombras}
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      <directionalLight position={[7, 5, 6]} intensity={0.75} color="#eef4ff" />
      <directionalLight position={[0, 6, -8]} intensity={0.45} />
    </>
  );
}

/** Estudio de reflejos hecho con Lightformers (procedural, sin red). */
function Reflejos({ fondo, calidad }: { fondo: Fondo; calidad: Calidad }) {
  const res = calidad === 'alta' ? 256 : 128;
  if (fondo === 'campo') {
    return (
      <Environment resolution={res} frames={1} environmentIntensity={0.9}>
        <color attach="background" args={['#9ec2df']} />
        <Lightformer form="rect" intensity={1.6} color="#ffffff" position={[0, 8, 0]} rotation-x={Math.PI / 2} scale={[30, 30, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#7a9a55" position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[30, 30, 1]} />
        <Lightformer form="circle" intensity={8} color="#fff1d6" position={[-6, 7, 4]} scale={2} />
      </Environment>
    );
  }
  return (
    <Environment resolution={res} frames={1} environmentIntensity={fondo === 'pizarron' ? 0.6 : 1}>
      <color attach="background" args={[fondo === 'pizarron' ? '#3b4950' : '#6d7479']} />
      {/* techo difuso: lo que reflejan las superficies metálicas horizontales */}
      <Lightformer form="rect" intensity={0.55} color="#eef2f5" position={[0, 7, 1]} rotation-x={Math.PI / 2} scale={[24, 18, 1]} />
      {/* paneles del techo */}
      <Lightformer form="rect" intensity={2.2} position={[0, 6, -1]} rotation-x={Math.PI / 2} scale={[10, 2.2, 1]} />
      <Lightformer form="rect" intensity={2.2} position={[0, 6, 3]} rotation-x={Math.PI / 2} scale={[10, 2.2, 1]} />
      {/* tiras verticales laterales: el brillo alargado que hace leer "vidrio" */}
      <Lightformer form="rect" intensity={3} position={[-5, 2, 2]} rotation-y={Math.PI / 2} scale={[1.2, 7, 1]} />
      <Lightformer form="rect" intensity={2.2} position={[5, 2, 1]} rotation-y={-Math.PI / 2} scale={[1.2, 7, 1]} />
      {/* ventana al frente, cálida y suave */}
      <Lightformer form="rect" intensity={0.9} color="#fff3e0" position={[0, 2, 7]} rotation-y={Math.PI} scale={[9, 4, 1]} />
      {/* pared del fondo y mesa: grises que dan contraste a los bordes */}
      <Lightformer form="rect" intensity={0.25} color="#dfe3e6" position={[0, 1, -6]} scale={[14, 6, 1]} />
      <Lightformer form="rect" intensity={0.3} color="#b9bec2" position={[0, -3, 0]} rotation-x={-Math.PI / 2} scale={[14, 10, 1]} />
    </Environment>
  );
}

/** Ajustes del renderer: tone mapping neutro y sombras PCF. */
function AjustesRender({ calidad, fondo }: { calidad: Calidad; fondo: Fondo }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = fondo === 'campo' ? 1.0 : 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.type = THREE.PCFShadowMap;
    // la pasada de transmisión del vidrio a media resolución en calidad media
    (gl as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = calidad === 'alta' ? 1 : 0.5;
  }, [gl, calidad, fondo]);
  useLayoutEffect(() => {
    scene.background = new THREE.Color(FONDO_COLOR[fondo]);
    scene.fog = fondo === 'campo' ? new THREE.Fog('#cfdfe9', 600, 2600) : null;
    return () => { scene.fog = null; };
  }, [scene, fondo]);
  return null;
}

/** Escenario: va DENTRO de un <Canvas>. */
export function LabStage({
  fondo = 'laboratorio', calidad = 'alta', camara, controles = true, mesa, sombras = true,
  postproceso = false, extensionCampo, children,
}: LabStageProps) {
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const limites = typeof controles === 'object' ? controles : {};
  return (
    <KitContexto.Provider value={ctx}>
      <AjustesRender calidad={calidad} fondo={fondo} />
      <Luces fondo={fondo} calidad={calidad} sombras={sombras} />
      <Reflejos fondo={fondo} calidad={calidad} />
      {fondo === 'laboratorio' && mesa !== false && <Mesa {...(mesa || {})} />}
      {fondo === 'campo' && <Campo extension={extensionCampo} />}
      {controles !== false && <ControlesBanco objetivo={camara?.objetivo} limites={limites} fondo={fondo} />}
      <EncuadreInicial camara={camara} fondo={fondo} />
      {children}
      {postproceso && calidad === 'alta' && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={0.6} intensity={1.6} distanceFalloff={0.8} halfRes />
          <SMAA />
          <Vignette offset={0.32} darkness={0.42} />
        </EffectComposer>
      )}
    </KitContexto.Provider>
  );
}

function EncuadreInicial({ camara, fondo }: { camara?: CamaraBanco; fondo: Fondo }) {
  useCamaraBanco(camara, fondo);
  return null;
}

/**
 * Calidad gráfica por defecto según el equipo. Las escuelas usan portátiles con
 * GPU integrada: ahí la pasada de transmisión del vidrio y las sombras de 2048
 * cuestan fotogramas. Sin `calidad` explícita, un equipo modesto (≤4 hilos,
 * ≤4 GB declarados, táctil/móvil) recibe «media». `?calidad=alta|media` en la
 * URL lo fuerza, para comparar.
 */
export function calidadPorDefecto(): Calidad {
  if (typeof window === 'undefined') return 'media';
  const forzada = new URLSearchParams(window.location.search).get('calidad');
  if (forzada === 'alta' || forzada === 'media') return forzada;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const hilos = nav.hardwareConcurrency ?? 4;
  const memoria = nav.deviceMemory ?? 8;
  const movil = /Android|iPhone|iPad|Mobile/i.test(nav.userAgent);
  return hilos <= 4 || memoria <= 4 || movil ? 'media' : 'alta';
}

/** Canvas preconfigurado (dpr y sombras según calidad) + LabStage. */
export function LabCanvas({ className, style, children, onCreated, frameloop, ...stage }: LabStageProps & {
  className?: string; style?: React.CSSProperties; onCreated?: (s: { gl: THREE.WebGLRenderer }) => void;
  frameloop?: 'always' | 'demand' | 'never';
}) {
  const [calidadAuto] = React.useState(calidadPorDefecto);
  const calidad = stage.calidad ?? calidadAuto;
  const fondo = stage.fondo ?? 'laboratorio';
  const d = CAM_DEF[fondo];
  return (
    <Canvas
      className={className}
      style={{ width: '100%', height: '100%', ...style }}
      shadows={stage.sombras === false ? false : 'percentage'}
      dpr={calidad === 'alta' ? [1, 1.75] : [1, 1.25]}
      gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
      camera={{ position: stage.camara?.posicion ?? d.posicion, fov: stage.camara?.fov ?? d.fov, near: 0.05, far: fondo === 'campo' ? 6000 : 400 }}
      onCreated={onCreated as never}
      frameloop={frameloop}
    >
      <LabStage {...stage} calidad={calidad}>{children}</LabStage>
    </Canvas>
  );
}

/**
 * Encuadra automáticamente una caja envolvente (min, max) con la cámara actual,
 * mirando desde la dirección actual (o la dada). Recalcula al cambiar la caja o
 * el tamaño del lienzo.
 */
export function useFitCamera(
  bounds: [V3, V3] | THREE.Box3 | null | undefined,
  { margen = 1.15, direccion }: { margen?: number; direccion?: V3 } = {},
) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const clave = bounds
    ? (bounds instanceof THREE.Box3 ? [...bounds.min.toArray(), ...bounds.max.toArray()] : [...bounds[0], ...bounds[1]]).map((v) => v.toFixed(4)).join(',')
    : '';
  const dirClave = direccion ? direccion.join(',') : '';
  useLayoutEffect(() => {
    if (!bounds) return;
    const box = bounds instanceof THREE.Box3 ? bounds : new THREE.Box3(new THREE.Vector3(...bounds[0]), new THREE.Vector3(...bounds[1]));
    const centro = box.getCenter(new THREE.Vector3());
    const tam = box.getSize(new THREE.Vector3());
    const dir = direccion
      ? new THREE.Vector3(...direccion).normalize()
      : camera.position.clone().sub(controls?.target ?? centro).normalize();
    if (!(dir.lengthSq() > 0)) dir.set(0, 0, 1);
    const aspect = size.width / Math.max(1, size.height);
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const cam = camera as THREE.PerspectiveCamera;
      const fovV = THREE.MathUtils.degToRad(cam.fov);
      const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
      // proyección de la caja sobre los ejes de la cámara (aprox. con su esfera en profundidad)
      const radio = tam.length() / 2;
      const dV = (Math.max(tam.y, tam.z * 0.3) / 2) / Math.tan(fovV / 2);
      const dH = (Math.max(tam.x, tam.z * 0.3) / 2) / Math.tan(fovH / 2);
      const dist = Math.max(dV, dH) * margen + radio * 0.15;
      cam.position.copy(centro).addScaledVector(dir, dist);
      cam.near = Math.max(0.01, dist / 200); cam.far = dist * 50 + radio * 4;
      cam.updateProjectionMatrix();
    } else {
      const cam = camera as THREE.OrthographicCamera;
      cam.zoom = Math.min(size.width / (tam.x * margen), size.height / (tam.y * margen));
      cam.position.copy(centro).addScaledVector(dir, 50);
      cam.updateProjectionMatrix();
    }
    camera.lookAt(centro);
    if (controls && 'target' in controls) { controls.target.copy(centro); controls.update(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, dirClave, size.width, size.height, camera, controls, margen]);
}

/** Componente equivalente a useFitCamera, para usar en JSX. */
export function EncuadrarCaja(props: { caja: [V3, V3]; margen?: number; direccion?: V3 }) {
  useFitCamera(props.caja, { margen: props.margen, direccion: props.direccion });
  return null;
}

/** Gira un grupo a velocidad constante (para vitrinas). */
export function Giratorio({ velocidad = 0.3, children }: { velocidad?: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (g.current) g.current.rotation.y += dt * velocidad; });
  return <group ref={g}>{children}</group>;
}
