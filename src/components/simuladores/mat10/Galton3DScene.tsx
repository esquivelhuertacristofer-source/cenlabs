"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Galton3DScene — una máquina de Galton de sobremesa en un estudio, a escala real
   (1 u = 1 cm): tablero de nogal con frente de vidrio, 55 clavos de latón, tabiques
   de aluminio, bolitas de acero de 6 mm que se APILAN de verdad en los canales, y un
   nivel de burbuja en el travesaño. El tablero gira α en su plano sobre su eje: así
   se fija p (galton.ts, modelo de impacto: tan α = (2p − 1)·w/h).

   RELOJ ÚNICO. `MaquinaBolas` avanza la física en cada cuadro (prioridad −1), cuenta
   en el store cada bolita en el cuadro en que se posa y publica en el banco la α que
   se está viendo; el giro del tablero, la burbuja, el dock y la barra leen eso mismo.

   NO REGALAR. La escena no escribe nada: ni μ ni σ ni curva alguna. Sólo la escala
   grabada del propio instrumento (k = 0…10) y la del nivel.
──────────────────────────────────────────────────────────────────────────── */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useShallow } from 'zustand/react/shallow';
import { KitContexto, ControlesBanco, calidadPorDefecto, type Calidad } from '../_kit';
import { useBancoGalton, type Vista } from './banco';
import { MaquinaBolas, type DiagBolas } from './bolas';
import {
  Tablero, NivelBurbuja, Lengueta, Soporte, Estudio, useMaterialesGalton,
  X_EXT, Y_SUP_EXT, Y_INF_EXT, Y_PIVOTE, Y_TECHO, ALTO_PEANA,
} from './piezas';
import { X_PARED, Y_FONDO, Y_TABIQUE, Y_ULTIMA } from './galton';

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#07090d';
/** Altura del eje de giro sobre la mesa (la peana mide ALTO_PEANA y el eje queda 1,6 cm por encima). */
export const Y_EJE_MUNDO = ALTO_PEANA + 1.6;
/** Del tablero al mundo (con α = 0). */
const aMundo = (x: number, y: number, z = 0) => new THREE.Vector3(x, Y_EJE_MUNDO + (y - Y_PIVOTE), z);

export function useMovimientoReducido(): boolean {
  const [r, setR] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setR(mq.matches);
    f();
    mq.addEventListener?.('change', f);
    return () => mq.removeEventListener?.('change', f);
  }, []);
  return r;
}

// ───────────────────────────── encuadre ─────────────────────────────

/**
 * Distancia y objetivo para que `puntos` quepan centrados en ±mx, ±my (NDC) mirando
 * desde `dir`. Búsqueda binaria de la distancia + recentrado en dos pasadas.
 */
function encuadrar(dir: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number) {
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 0.1, 4000);
  const tgt = puntos.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / puntos.length);
  const caja = (d: number) => {
    cam.position.copy(tgt).addScaledVector(dir, d);
    cam.up.set(0, 1, 0);
    cam.lookAt(tgt);
    cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const v = new THREE.Vector3();
    for (const p of puntos) {
      v.copy(p).project(cam);
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
    return { x0, x1, y0, y1 };
  };
  let d = 100;
  for (let pasada = 0; pasada < 3; pasada++) {
    let lo = 5, hi = 2000;
    for (let i = 0; i < 44; i++) {
      const mid = (lo + hi) / 2;
      const b = caja(mid);
      if ((b.x1 - b.x0) / 2 <= mx && (b.y1 - b.y0) / 2 <= my) hi = mid; else lo = mid;
    }
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

const direccion = (azimut: number, elevacion: number) => {
  const az = THREE.MathUtils.degToRad(azimut), el = THREE.MathUtils.degToRad(elevacion);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
};
const DIR_TABLERO = direccion(17, 6);
const DIR_DETALLE = direccion(12, 3);

function rect(x0: number, x1: number, y0: number, y1: number, z0 = -1.2, z1 = 1.2) {
  const out: THREE.Vector3[] = [];
  for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) out.push(aMundo(x, y, z));
  return out;
}

function presetVista(vista: Vista, aspecto: number, fov: number) {
  if (vista === 'clavos') {
    // la tolva y las diez filas, de cerca: las bolitas se ven de 6 mm
    return encuadrar(DIR_DETALLE, rect(-11.4, 11.4, Y_ULTIMA - 1.6, Y_TECHO + 0.4), fov, aspecto, 0.94, 0.9);
  }
  if (vista === 'pilas') {
    return encuadrar(DIR_DETALLE, rect(-X_PARED - 0.6, X_PARED + 0.6, Y_INF_EXT, Y_TABIQUE + 1.2), fov, aspecto, 0.94, 0.9);
  }
  // tablero entero y peana: el tablero ocupa ~70 % del alto del lienzo
  const pts = [...rect(-X_EXT, X_EXT, Y_INF_EXT, Y_SUP_EXT), ...rect(-18, 18, Y_PIVOTE - 1.6 - ALTO_PEANA, Y_PIVOTE - 1.6, -6.6, 6.4)];
  return encuadrar(DIR_TABLERO, pts, fov, aspecto, 0.86, 0.79);
}

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Vistas con transición suave; re-encuadra al cambiar el tamaño si el alumno no ha movido la cámara. */
function CamaraVistas({ vista, pulso, reducido }: { vista: Vista; pulso: number; reducido: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const usuario = useRef(false);
  const anim = useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; o0: THREE.Vector3; o1: THREE.Vector3; t: number; dur: number } | null>(null);
  const primera = useRef(true);
  useEffect(() => {
    if (!controls) return;
    const f = () => { usuario.current = true; anim.current = null; };
    controls.addEventListener('start', f);
    return () => controls.removeEventListener('start', f);
  }, [controls]);
  const aspecto = size.width / Math.max(1, size.height);
  useLayoutEffect(() => {
    if (!controls) return;
    usuario.current = false;
    const p = presetVista(vista, aspecto, camera.fov);
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0, dur: 1.0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulso, vista, controls]);
  useLayoutEffect(() => {
    if (!controls || primera.current || usuario.current) return;
    const p = presetVista(vista, aspecto, camera.fov);
    if (anim.current) { anim.current.p1 = p.pos; anim.current.o1 = p.objetivo; }
    else { camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height]);
  useFrame((_, dt) => {
    const a = anim.current;
    if (!a || !controls) return;
    a.t = Math.min(1, a.t + dt / a.dur);
    const e = facil(a.t);
    camera.position.lerpVectors(a.p0, a.p1, e);
    controls.target.lerpVectors(a.o0, a.o1, e);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.12;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    scene.background = new THREE.Color(FONDO);
  }, [gl, scene]);
  return null;
}

const CENTRO = aMundo(0, (Y_SUP_EXT + Y_INF_EXT) / 2);

function Luces({ calidad }: { calidad: Calidad }) {
  const clave = useRef<THREE.SpotLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    l.shadow.bias = -0.00015; l.shadow.normalBias = 0.02; l.shadow.radius = 5;
    l.shadow.camera.near = 60; l.shadow.camera.far = 260; l.shadow.camera.updateProjectionMatrix();
    l.target.position.copy(CENTRO).setY(CENTRO.y - 4); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#aebdd2', '#07080b', 0.32]} />
      {/* clave: foco de estudio cálido, arriba a la izquierda y por delante → sombras de las bolitas sobre el fondo */}
      <spotLight ref={clave} position={[-62, 112, 96]} angle={0.21} penumbra={0.95} decay={0} intensity={3.6} color="#fff1e0" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* contraluz fría: recorta el canto del marco y los clavos */}
      <directionalLight position={[48, 60, -70]} intensity={0.9} color="#cfe0ff" />
      {/* relleno bajo por la derecha */}
      <directionalLight position={[70, 22, 60]} intensity={0.35} color="#ffe9d2" />
    </>
  );
}

/**
 * Estudio de reflejos procedural (sin red): tiras verticales a los lados (los brillos
 * de cada bolita y de los clavos), un techo suave y una tira baja delante a la
 * izquierda que el vidrio devuelve como un velo diagonal muy tenue.
 */
function Reflejos({ calidad }: { calidad: Calidad }) {
  return (
    <Environment resolution={calidad === 'alta' ? 256 : 128} frames={1} environmentIntensity={1}>
      <color attach="background" args={['#040507']} />
      {/* tiras verticales a los lados: el brillo de cada bolita y el canto de los clavos */}
      <Lightformer form="rect" intensity={3.4} color="#f3f6fa" position={[-70, 40, 40]} scale={[10, 80, 1]} target={[0, 28, 0]} />
      <Lightformer form="rect" intensity={2.4} color="#dfe8ff" position={[75, 40, 20]} scale={[7, 80, 1]} target={[0, 28, 0]} />
      {/* techo suave */}
      <Lightformer form="rect" intensity={2.2} color="#fff2e2" position={[0, 120, 30]} scale={[110, 50, 1]} target={[0, 28, 0]} />
      {/* frente amplio y tenue: lo que ven los metales de cara al alumno (tabiques, placa, latón);
          el vidrio, a incidencia normal, sólo devuelve un 4 % */}
      <Lightformer form="rect" intensity={0.85} color="#f1ece4" position={[10, 34, 160]} scale={[150, 70, 1]} target={[0, 28, 0]} />
      {/* tira baja delante a la izquierda: su reflejo en el vidrio es la banda que delata el cristal */}
      <Lightformer form="rect" intensity={1.1} color="#ffffff" position={[-52, 14, 150]} scale={[9, 80, 1]} target={[0, 28, 0]} />
      <Lightformer form="rect" intensity={0.8} color="#ffe6c8" position={[0, 20, -90]} scale={[120, 30, 1]} target={[0, 28, 0]} />
    </Environment>
  );
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function DiagnosticoDev({ diag }: { diag: React.MutableRefObject<DiagBolas> }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const medida = useRef({ llamadas: 0, triangulos: 0, fps: 0, n: 0, t0: 0 });
  useEffect(() => {
    if (!DEV) return;
    const antes = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = antes; };
  }, [gl]);
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
    const w = window as unknown as { __mat10?: unknown };
    w.__mat10 = {
      salud() {
        let normalesCero = 0, mallas = 0;
        scene.traverse((o) => {
          const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
          if (!g || !(o as THREE.Mesh).isMesh) return;
          mallas++;
          const n = g.getAttribute('normal');
          if (!n) return;
          for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
        });
        const m = medida.current;
        return { llamadas: m.llamadas, triangulos: m.triangulos, mallas, normalesCero, fps: Math.round(m.fps * 10) / 10 };
      },
      escena: scene,
      renderer: gl,
      camara: camera,
      estado: () => ({ ...diag.current }),
    };
    return () => { delete w.__mat10; };
  }, [gl, scene, camera, diag]);
  return null;
}

// ───────────────────────────── rótulo al pasar el ratón (DOM) ─────────────────────────────

type DatoRotulo = { texto: string; x: number; y: number } | null;
function RotuloDom({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-10 max-w-[260px] rounded-md border border-white/15 bg-[#0b1220]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }}>
      {d.texto}
    </div>
  );
}

const NOMBRES: Record<string, string> = {
  clavo: 'Clavo de latón Ø 3,4 mm · cada uno, una decisión',
  bola: 'Bolita de acero Ø 6 mm',
  reserva: 'Reserva de bolitas en la tolva',
  tolva: 'Tolva · suelta las bolitas de una en una',
  tabique: 'Tabique de aluminio · canal de 21 mm',
  placa: 'Placa grabada · k = desvíos a la derecha',
  nivel: 'Nivel de burbuja · 0,87 cm por grado',
  marco: 'Marco de nogal',
  fondo: 'Fondo lacado',
  eje: 'Eje de giro · inclina el tablero',
  peana: 'Peana de nogal',
};

// ───────────────────────────── la máquina ─────────────────────────────

function Maquina({ calidad, reducido, rotulo, diag }: {
  calidad: Calidad; reducido: boolean;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>; diag: React.MutableRefObject<DiagBolas>;
}) {
  const { vista, vistaPulso } = useBancoGalton(useShallow((s) => ({ vista: s.vista, vistaPulso: s.vistaPulso })));
  const m = useMaterialesGalton(calidad);
  const alfa = useRef(0);
  const giro = useRef<THREE.Group>(null);
  // después del reloj (prioridad −1): el tablero muestra la α de este cuadro
  useFrame(() => { if (giro.current) giro.current.rotation.z = -alfa.current; });

  const alMover = (e: ThreeEvent<PointerEvent>) => {
    // sólo cuenta lo más cercano: sin esto, la mesa y el fondo (detrás) borran el rótulo
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    rotulo.current(pieza && NOMBRES[pieza] ? { texto: NOMBRES[pieza], x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <CamaraVistas vista={vista} pulso={vistaPulso} reducido={reducido} />
      <Estudio m={m} calidad={calidad} />
      <group position={[0, Y_EJE_MUNDO, 0]}>
        <Soporte m={m} calidad={calidad} />
        <group ref={giro}>
          <group position={[0, -Y_PIVOTE, 0]}>
            <Tablero m={m} calidad={calidad} />
            <Lengueta m={m} />
            <NivelBurbuja m={m} alfa={alfa} calidad={calidad} />
            <MaquinaBolas m={m} calidad={calidad} reducido={reducido} alfaRef={alfa} diag={diag} />
          </group>
        </group>
      </group>
    </group>
  );
}

export default function Galton3DScene() {
  const [calidad] = useState<Calidad>(calidadPorDefecto);
  const reducido = useMovimientoReducido();
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const diag = useRef<DiagBolas>({ t: 0, alfa: 0, alfaObjetivo: 0, enVuelo: 0, cola: 0, soltadas: 0, posadas: 0, semilla: 0, lleno: false, estaticas: 0 });
  const alta = calidad === 'alta';
  return (
    <div className="absolute inset-0" data-calidad={calidad}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.25]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [20, 30, 120], fov: 28, near: 1, far: 1200 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes />
          <Luces calidad={calidad} />
          <Reflejos calidad={calidad} />
          <ControlesBanco objetivo={[CENTRO.x, CENTRO.y, CENTRO.z]} fondo="laboratorio"
            limites={{ minDistancia: 18, maxDistancia: 260, maxPolar: 1.68, minPolar: 0.7, paneo: true, cajaObjetivo: [[-26, 2, -10], [26, 56, 10]] }} />
          <Maquina calidad={calidad} reducido={reducido} rotulo={rotulo} diag={diag} />
          <DiagnosticoDev diag={diag} />
        </KitContexto.Provider>
      </Canvas>
      <RotuloDom fijar={rotulo} />
    </div>
  );
}
