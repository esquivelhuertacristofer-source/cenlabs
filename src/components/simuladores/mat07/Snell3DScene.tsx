"use client";

/* ────────────────────────────────────────────────────────────────────────────
   Snell3DScene — banco óptico de refracción, a escala real (1 u = 1 cm).

   Sobre una mesa óptica, un disco goniométrico de aluminio anodizado con la escala
   grabada; en su centro, un bloque semicircular de vidrio/acrílico (transmisión
   física, ior = índice del medio a la λ de la fuente); en el canto, el láser montado
   en un jinete que gira alrededor del disco. El haz se ve porque cruza una bruma
   tenue: cada mota brilla con la potencia del haz que tiene al lado.

   RELOJ ÚNICO. La fase φ del jinete (θ₁ y el sentido en una sola variable, ver
   optica.ts) se anima aquí hacia el valor del store; en CADA cuadro se re-traza el
   banco con esa φ (Snell + Fresnel + Cauchy + Beer–Lambert), se reescriben los haces
   y se publica `faseVis` en el store del banco: el dock lee esa misma φ.

   NO REGALAR. La escena no escribe nada: ni θ₂ ni n₂. El alumno lee θ₂ en el disco
   (la vista «Lupa» mira desde arriba, sin paralaje, donde el haz cruza la escala).
──────────────────────────────────────────────────────────────────────────── */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useShallow } from 'zustand/react/shallow';
import { KitContexto, ControlesBanco, calidadPorDefecto, type Calidad } from '../_kit';
import {
  trazarBanco, faseDe, abbeDe, indiceA, laserDe, rgbHaz, colorLambda, R_ABERTURA, R_BLOQUE, R_DISCO,
  type Haz,
} from './optica';
import { useBancoSnell, type Vista } from './banco';
import { MesaOptica, DiscoGoniometrico, BloqueSemicircular, LaserEnJinete, aMundo, H_HAZ, R_ESCALA } from './piezas';
import { LuzDelBanco, MAX_TRAMOS, type FuenteLuz, type TramoGPU, type DestelloGPU } from './haces';

interface Snell3DSceneProps {
  n1: number;
  n2: number | string;
  n2Misterio: number;
  anguloIncidencia: number;
  status: 'idle' | 'success' | 'error';
}

const DEV = process.env.NODE_ENV !== 'production';
const OBJETIVO_INICIAL: [number, number, number] = [0, 0, 0];
const FONDO = '#070a0e';

/** Nombre y tinte de atenuación de cada medio de la tabla (sólo aspecto). */
export function medioDe(nD: number, misterio: boolean): { nombre: string; tinte: string } {
  if (misterio) return { nombre: 'cristal desconocido', tinte: '#d9efe9' };
  const tabla: [number, string, string][] = [
    [1, 'aire (bloque vacío)', '#ffffff'], [1.333, 'agua', '#cfe6f4'], [1.5, 'vidrio crown', '#d8eee3'],
    [1.544, 'cuarzo', '#eef3f7'], [2.417, 'diamante', '#f7f9fb'],
  ];
  const f = tabla.find(([n]) => Math.abs(n - nD) < 5e-4);
  return f ? { nombre: f[1], tinte: f[2] } : { nombre: `n = ${nD.toFixed(3)}`, tinte: '#e6f1ee' };
}

function useMovimientoReducido(): boolean {
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

const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
function anillo(r: number, y: number, n = 48, c: [number, number] = [0, 0]): THREE.Vector3[] {
  return Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return V3(c[0] + r * Math.cos(a), y, c[1] + r * Math.sin(a)); });
}

/**
 * Distancia y objetivo para que `puntos` quepan centrados en ±mx, ±my (NDC) mirando
 * desde `dir`. Búsqueda binaria de la distancia + recentrado en dos pasadas.
 */
function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number) {
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 0.1, 2000);
  const tgt = objetivo.clone();
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
  let d = 60;
  for (let pasada = 0; pasada < 3; pasada++) {
    let lo = 3, hi = 600;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      const b = caja(m);
      if ((b.x1 - b.x0) / 2 <= mx && (b.y1 - b.y0) / 2 <= my) hi = m; else lo = m;
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

const DIR_34 = (() => { const el = THREE.MathUtils.degToRad(57), az = THREE.MathUtils.degToRad(9); return V3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize(); })();
const DIR_CENIT = V3(0, 1, 0.012).normalize();

function presetVista(vista: Vista, aspecto: number, fov: number, lupa: [number, number, number] | null) {
  if (vista === 'cenital') {
    return encuadrar(DIR_CENIT, V3(0, 0, 0), anillo(R_DISCO + 0.4, 0), fov, aspecto, 0.92, 0.92);
  }
  if (vista === 'lupa') {
    const c = lupa ?? [0, 0, 0];
    return encuadrar(DIR_CENIT, V3(c[0], 0, c[2]), anillo(4.3, 0, 32, [c[0], c[2]]), fov, aspecto, 0.96, 0.96);
  }
  // 3/4: el disco (con el canto y el jinete en cualquier posición) en ±0,9 del ancho y ±0,66 del alto
  const pts = [...anillo(R_DISCO + 0.3, 0), ...anillo(R_DISCO, -0.8), ...anillo(R_DISCO + 0.6, H_HAZ + 1.3, 24)];
  return encuadrar(DIR_34, V3(0, 0, 0), pts, fov, aspecto, 0.9, 0.66);
}

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Vistas con transición suave; re-encuadra al cambiar el tamaño si el alumno no ha movido la cámara. */
function CamaraVistas({ vista, pulso, lupa }: { vista: Vista; pulso: number; lupa: [number, number, number] | null }) {
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
  const lupaClave = lupa ? lupa.map((v) => v.toFixed(2)).join(',') : '';
  // al pulsar una vista: transición (la primera vez, salto)
  useLayoutEffect(() => {
    if (!controls) return;
    usuario.current = false;
    const p = presetVista(vista, aspecto, camera.fov, lupa);
    if (primera.current) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0, dur: 0.95 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulso, vista, controls]);
  // al cambiar el tamaño del lienzo o el punto de la lupa: re-encuadre (si el alumno no movió la cámara)
  useLayoutEffect(() => {
    if (!controls || primera.current || usuario.current) return;
    const p = presetVista(vista, aspecto, camera.fov, lupa);
    if (vista === 'lupa' && anim.current == null) {
      anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0, dur: 0.6 };
    } else if (anim.current) {
      anim.current.p1 = p.pos; anim.current.o1 = p.objetivo;
    } else {
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, lupaClave]);
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

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    (gl as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = calidad === 'alta' ? 1 : 0.5;
    scene.background = new THREE.Color(FONDO);
    scene.fog = new THREE.Fog(FONDO, 75, 170);
    return () => { scene.fog = null; };
  }, [gl, scene, calidad]);
  return null;
}

function Luces({ calidad }: { calidad: Calidad }) {
  const clave = useRef<THREE.SpotLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    l.shadow.bias = -0.0002; l.shadow.normalBias = 0.03; l.shadow.radius = 7;
    l.shadow.camera.near = 20; l.shadow.camera.far = 160; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(0, -1, 0); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#9fb3c6', '#06080b', 0.28]} />
      {/* luz clave de estudio: foco cenital cálido con penumbra ancha → charco de luz sobre la mesa y sombras suaves */}
      <spotLight ref={clave} position={[-22, 62, 30]} angle={0.42} penumbra={0.85} decay={0} intensity={3.4} color="#fff2e2" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* contraluz fría: recorta cantos y el disipador del láser */}
      <directionalLight position={[30, 20, -34]} intensity={1.1} color="#cfe0ff" />
      <directionalLight position={[22, 10, 30]} intensity={0.3} color="#e8eef5" />
    </>
  );
}

/**
 * Estudio de reflejos procedural (sin red), pensado para el vidrio: el softbox
 * detrás y arriba (a la elevación de la cámara) es el reflejo que dibuja la cara
 * superior del bloque; el frontal alto, la banda de la cara curva; las tiras
 * laterales, los cantos. Los Lightformer sólo existen en el mapa de entorno.
 */
function Reflejos({ calidad }: { calidad: Calidad }) {
  return (
    <Environment resolution={calidad === 'alta' ? 256 : 128} frames={1} environmentIntensity={1}>
      <color attach="background" args={['#040507']} />
      {/* tiras VERTICALES detrás: en la cara de arriba del bloque dejan dos estrías de brillo (lo que hace leer «vidrio») y el resto se ve claro */}
      <Lightformer form="rect" intensity={3.2} color="#eef3f8" position={[-9, 30, -21]} scale={[2.2, 34, 1]} />
      <Lightformer form="rect" intensity={1.8} color="#eef3f8" position={[6, 30, -21]} scale={[1.2, 34, 1]} />
      <Lightformer form="rect" intensity={2.2} color="#fff4e6" position={[0, 30, 24]} scale={[60, 16, 1]} />
      <Lightformer form="rect" intensity={0.6} position={[0, 44, 2]} scale={[40, 30, 1]} />
      <Lightformer form="rect" intensity={4} position={[-40, 8, 4]} scale={[4, 30, 1]} />
      <Lightformer form="rect" intensity={3} color="#dfe9ff" position={[40, 8, -4]} scale={[4, 30, 1]} />
    </Environment>
  );
}

const TONO_NEUTRO = 8; // ToneMappingMode.NEUTRAL de postprocessing (no lo re-exporta @react-three/postprocessing)
/** Bloom moderado sólo en lo que emite (núcleos de haz > 1 en HDR) + tono neutro + viñeta. Props constantes. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.92} luminanceSmoothing={0.22} radius={0.72} />
      <ToneMapping mode={TONO_NEUTRO} />
      <Vignette offset={0.26} darkness={0.62} />
    </EffectComposer>
  );
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

interface Diag { fase: number; objetivo: number; haces: Haz[] }
function DiagnosticoDev({ diag }: { diag: React.MutableRefObject<Diag> }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const medida = useRef({ llamadas: 0, triangulos: 0, puntos: 0, fps: 0, n: 0, t0: 0 });
  useEffect(() => {
    if (!DEV) return;
    const antes = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = antes; };
  }, [gl]);
  useFrame(() => {
    if (!DEV) return;
    const r = gl.info.render, m = medida.current;
    m.llamadas = r.calls; m.triangulos = r.triangles; m.puntos = r.points;
    gl.info.reset();
    const ahora = performance.now();
    m.n++;
    if (!m.t0) m.t0 = ahora;
    if (ahora - m.t0 >= 1000) { m.fps = (m.n * 1000) / (ahora - m.t0); m.n = 0; m.t0 = ahora; }
    // prioridad NEGATIVA: con una prioridad > 0, r3f deja de dibujar solo (en calidad media,
    // sin compositor, la escena se quedaría en negro). Se lee lo acumulado en el cuadro anterior.
  }, -20);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __mat07?: unknown };
    w.__mat07 = {
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
        return { llamadas: m.llamadas, triangulos: m.triangulos, puntos: m.puntos, mallas, normalesCero, fps: Math.round(m.fps * 10) / 10 };
      },
      /** la escena y el renderer, para sondas de desarrollo */
      escena: scene,
      renderer: gl,
      /** estado del reloj único: la fase que se ve, la pedida y los haces trazados con ella */
      estado() {
        const d = diag.current;
        return {
          fase: d.fase, objetivo: d.objetivo,
          haces: d.haces.map((h) => ({ tipo: h.tipo, medio: h.medio, p: h.p, lambdaNm: h.lambdaNm, a: h.a, b: h.b })),
        };
      },
    };
    return () => { delete w.__mat07; };
  }, [gl, scene, diag]);
  return null;
}

// ───────────────────────────── rótulo al pasar el ratón (DOM) ─────────────────────────────

type DatoRotulo = { texto: string; x: number; y: number } | null;
function RotuloDom({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-10 rounded-md border border-white/15 bg-[#0b1220]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }}>
      {d.texto}
    </div>
  );
}

// ───────────────────────────── el banco ─────────────────────────────

function Banco({ props, calidad, reducido, rotulo, diag }: {
  props: Snell3DSceneProps; calidad: Calidad; reducido: boolean;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>; diag: React.MutableRefObject<Diag>;
}) {
  const { laser, sentido, pol, vista, vistaPulso, setFaseVis } = useBancoSnell(useShallow((s) => ({
    laser: s.laser, sentido: s.sentido, pol: s.pol, vista: s.vista, vistaPulso: s.vistaPulso, setFaseVis: s.setFaseVis,
  })));
  const misterio = props.n2 === 'misterio';
  const nD = misterio ? props.n2Misterio : Number(props.n2);
  const V = abbeDe(nD, misterio);
  const lam = laserDe(laser).lambdaNm;
  const nBloque = indiceA(nD, V, lam);
  const medio = medioDe(nD, misterio);
  const objetivo = faseDe(sentido, props.anguloIncidencia);
  const colorFuente = useMemo(() => {
    const c = lam == null ? [1, 1, 1] : colorLambda(lam);
    return new THREE.Color(c[0], c[1], c[2]);
  }, [lam]);

  // punto de lectura de la lupa (con la fase PEDIDA, para que la cámara no persiga la animación)
  const lupa = useMemo<[number, number, number] | null>(() => {
    const { haces } = trazarBanco({ fase: objetivo, n1: props.n1, nD, V, laser, pol });
    const medidos = haces.filter((h) => (sentido === 'aire-bloque' ? h.tipo === 'salida' && h.medio === 'aire' && Math.hypot(...h.a) > R_BLOQUE - 0.01 && h.b[1] < 0 : h.tipo === 'refractado'));
    if (!medidos.length) return [0, 0, 0];
    let sx = 0, sy = 0, sp = 0;
    for (const h of medidos) { const L = Math.hypot(...h.b); sx += (h.b[0] / L) * h.p; sy += (h.b[1] / L) * h.p; sp += h.p; }
    const L = Math.hypot(sx, sy) || 1;
    const r = R_ESCALA + 0.6;
    return aMundo([(sx / L) * r, (sy / L) * r], 0);
  }, [objetivo, props.n1, nD, V, laser, pol, sentido]);

  // potencia y color que entran en el vidrio (con la fase pedida): alimentan el brillo de los cantos
  const canto = useMemo<[number, number, number]>(() => {
    const { haces } = trazarBanco({ fase: objetivo, n1: props.n1, nD, V, laser, pol });
    const dentro = haces.filter((h) => h.medio === 'vidrio' && h.tipo !== 'reflejado');
    const c: [number, number, number] = [0, 0, 0];
    for (const h of dentro) { const k = rgbHaz(h, laser === 'white'); c[0] += k[0]; c[1] += k[1]; c[2] += k[2]; }
    return c;
  }, [objetivo, props.n1, nD, V, laser, pol]);
  const fuente = useRef<FuenteLuz>({ version: 0, tramos: [], destellos: [] });
  const fase = useRef(objetivo);
  const firma = `${props.n1}|${nD}|${V}|${laser}|${pol}`;
  const firmaVista = useRef('');
  const publicada = useRef<number | null>(null);
  const grupoLaser = useRef<THREE.Group>(null);

  const colocarLaser = (f: number) => {
    const g = grupoLaser.current; if (!g) return;
    const fi = THREE.MathUtils.degToRad(f);
    const u: [number, number] = [-Math.sin(fi), Math.cos(fi)];
    const p = aMundo([u[0] * R_ABERTURA, u[1] * R_ABERTURA]);
    g.position.set(p[0], p[1], p[2]);
    g.rotation.set(0, Math.atan2(u[1], u[0]), 0);
  };

  const retrazar = (f: number) => {
    const { haces } = trazarBanco({ fase: f, n1: props.n1, nD, V, laser, pol });
    const blanca = laser === 'white';
    const tramos: TramoGPU[] = haces.slice(0, MAX_TRAMOS).map((h) => ({
      a: aMundo(h.a), b: aMundo(h.b), rgb: rgbHaz(h, blanca), mu: h.mu, vidrio: h.medio === 'vidrio',
    }));
    // destellos: abertura, punto de incidencia y cruces de la cara curva (∝ potencia que llega)
    const destellos: DestelloGPU[] = [];
    const escala = (c: [number, number, number], k: number): [number, number, number] => [c[0] * k, c[1] * k, c[2] * k];
    const inc = haces.find((h) => h.tipo === 'incidente');
    if (inc) destellos.push({ c: aMundo(inc.a), rgb: escala(rgbHaz(inc, blanca), 0.9), tam: 0.32 });
    for (const h of haces) {
      const rA = Math.hypot(...h.a), rB = Math.hypot(...h.b);
      const L = Math.hypot(h.b[0] - h.a[0], h.b[1] - h.a[1]);
      const llega = Math.exp(-h.mu * L);
      if (rB < 1e-6) destellos.push({ c: aMundo(h.b), rgb: escala(rgbHaz(h, blanca), 0.55 * llega), tam: 0.42 }); // llega al centro
      else if (Math.abs(rB - R_BLOQUE) < 1e-6) destellos.push({ c: aMundo(h.b), rgb: escala(rgbHaz(h, blanca), 0.3 * llega), tam: 0.3 });
      else if (Math.abs(rA - R_BLOQUE) < 1e-6 && h.medio === 'aire' && h.tipo !== 'incidente') { /* el mismo cruce, ya contado */ }
    }
    fuente.current = { version: fuente.current.version + 1, tramos, destellos };
    diag.current = { fase: f, objetivo, haces };
  };

  // RELOJ ÚNICO: corre ANTES que la luz (prioridad −1) para que haz y dock vean la misma φ
  useFrame((_, dt) => {
    let f = fase.current;
    if (reducido) f = objetivo;
    else {
      const d = objetivo - f;
      if (Math.abs(d) < 0.004) f = objetivo;
      else {
        const paso = d * (1 - Math.exp(-Math.min(dt, 0.1) / 0.1));
        const max = 330 * Math.min(dt, 0.1);
        f += Math.sign(paso) * Math.min(Math.abs(paso), max);
      }
    }
    const cambio = f !== fase.current || firmaVista.current !== firma || fuente.current.version === 0;
    fase.current = f;
    if (cambio) { retrazar(f); colocarLaser(f); firmaVista.current = firma; }
    diag.current.objetivo = objetivo;
    const pub = publicada.current;
    if (pub === null || Math.abs(f - pub) > 0.05 || (f === objetivo && pub !== objetivo)) { publicada.current = f; setFaseVis(f); }
  }, -1);
  useLayoutEffect(() => { colocarLaser(fase.current); });
  useEffect(() => () => setFaseVis(null), [setFaseVis]);

  // rótulos de piezas al pasar el ratón (en DOM, nítidos)
  const nombres: Record<string, string> = {
    disco: 'Disco goniométrico · escala grabada, 1° por marca',
    bloque: `Bloque semicircular · ${medio.nombre}`,
    laser: laserDe(laser).nombre,
    jinete: 'Jinete y portaláser en V',
    polarizador: pol === 's' ? 'Polarizador · eje s (⊥ al plano de incidencia)' : 'Polarizador · eje p (en el plano de incidencia)',
  };
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    rotulo.current(pieza ? { texto: nombres[pieza] ?? pieza, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <CamaraVistas vista={vista} pulso={vistaPulso} lupa={lupa} />
      <MesaOptica calidad={calidad} />
      <DiscoGoniometrico calidad={calidad} />
      <BloqueSemicircular calidad={calidad} ior={nBloque} dispersion={Number.isFinite(V) ? Math.min(1, 20 / V) : 0} tinte={medio.tinte} canto={canto} />
      <group ref={grupoLaser}>
        <LaserEnJinete colorHaz={colorFuente} encendido pol={pol} />
      </group>
      <LuzDelBanco fuente={fuente} calidad={calidad} animar={!reducido} />
    </group>
  );
}

export default function Snell3DScene(props: Snell3DSceneProps) {
  const [calidad] = useState<Calidad>(calidadPorDefecto);
  const reducido = useMovimientoReducido();
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const diag = useRef<Diag>({ fase: 0, objetivo: 0, haces: [] });
  const alta = calidad === 'alta';
  return (
    <div className="absolute inset-0" data-calidad={calidad}>
      <Canvas
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.25]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 48, 34], fov: 30, near: 0.5, far: 600 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes calidad={calidad} />
          <Luces calidad={calidad} />
          <Reflejos calidad={calidad} />
          <ControlesBanco objetivo={OBJETIVO_INICIAL} fondo="laboratorio"
            limites={{ minDistancia: 6, maxDistancia: 150, maxPolar: 1.32, minPolar: 0, paneo: true, cajaObjetivo: [[-17, -3, -17], [17, 4, 17]] }} />
          <Banco props={props} calidad={calidad} reducido={reducido} rotulo={rotulo} diag={diag} />
          <DiagnosticoDev diag={diag} />
          {alta && <Posproceso />}
        </KitContexto.Provider>
      </Canvas>
      <RotuloDom fijar={rotulo} />
    </div>
  );
}

