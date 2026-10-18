"use client";
/**
 * M5 · El círculo trigonométrico — el instrumento en 3D (R3F). 1 u = el radio del círculo.
 *
 *   Un aro de latón graduado con un disco de vidrio grabado (el círculo unitario) sobre su
 *   columna; a su derecha, en el mismo plinto, el panel de vidrio donde se DESENROLLA la
 *   onda. El punto P = (cos θ, sen θ) gira; el radio, el seno, el coseno y la tangente son
 *   segmentos de luz; la altura de P viaja en horizontal hasta la pluma de la onda, que
 *   está en x = X0 + θ·0,55 (el arco desenrollado). Se arrastra con la mano (en el disco o
 *   en el panel). Modo Fourier: una cadena de epiciclos, uno por armónico, cuya punta
 *   tiene la altura de la suma parcial S_N(θ).
 *
 * RELOJ ÚNICO. `reloj.current.paso(dt)` corre aquí, en un useFrame de prioridad −1 (antes de
 * dibujar), y en ESE mismo cuadro se reescribe toda la luz con la geometría del modelo
 * (trigonometria.ts). El dock y la barra de lecturas leen el mismo reloj.
 *
 * NO REGALAR. La escena sólo muestra lo que el alumno mide (el punto, sus proyecciones y
 * sus capturas). La recta y = v del reto y sus dos soluciones se encienden SÓLO tras validar.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { KitContexto, ControlesBanco, type Calidad } from '../_kit';
import { leer, geometria, aRad, aGrados, norm360, epiciclos, sentidosDe, sumaParcial, ondaObjetivo, type P2 } from './trigonometria';
import { type RelojTrig, xOnda, X0_ONDA, LARGO_ONDA } from './reloj';
import { Cinta, Destellos, type Destello } from './luz';
import {
  useMatsM5, AroGraduado, DiscoVidrio, IndiceLectura, Soporte, PanelOnda, Plinto, Suelo,
  LZ, R_OUT, Y_PLINTO, X_PLINTO, Z_PLINTO, PANEL,
} from './piezas';

export interface RevelacionM5 { funcion: 'sen' | 'cos'; valor: number; soluciones: [number, number] }

export interface Trig3DProps {
  reloj: React.MutableRefObject<RelojTrig>;
  verSeno: boolean;
  verCoseno: boolean;
  verTangente: boolean;
  /** ángulos (°) capturados por el alumno */
  capturados: number[];
  /** la recta del reto y sus soluciones: SÓLO después de validar */
  revelado: RevelacionM5 | null;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** sube para volver al encuadre automático */
  encuadre?: number;
  /** el alumno arrastra el punto (o la pluma de la onda) */
  onArrastre?: (fase: 'inicio' | 'mueve' | 'fin', grados: number) => void;
  /** la escena ya pintó sus primeros cuadros */
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#06090c';

// colores de la luz (lineales; > 1 = HDR, florece en calidad alta)
export const COLOR_M5 = { sen: '#38bdf8', cos: '#e879f9', tan: '#facc15', radio: '#f1f5f9', angulo: '#ffd166', fourier: '#fb923c', captura: '#fbbf24' };

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    (gl as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = calidad === 'alta' ? 1 : 0.5;
    // fondo de estudio: degradado radial oscuro con un tramado mínimo (sin bandas)
    let tex: THREE.CanvasTexture | null = null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(230, 210, 10, 256, 250, 430);
      grad.addColorStop(0, '#1d2a38'); grad.addColorStop(0.5, '#0f1720'); grad.addColorStop(1, FONDO);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      const img = g.getImageData(0, 0, 512, 512);
      let s = 4127;
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
    // entorno de estudio procedural (sin red): reflejos de catálogo en el latón y el vidrio
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
    l.shadow.bias = -0.0004; l.shadow.normalBias = 0.02; l.shadow.radius = 6;
    l.shadow.camera.near = 3; l.shadow.camera.far = 30; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(1.6, -1.2, 0); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#b8c8da', '#07090c', 0.3]} />
      {/* luz clave de estudio: foco cálido de penumbra ancha → charco de luz y sombras suaves */}
      <spotLight ref={clave} position={[-5.5, 7.5, 8.5]} angle={0.62} penumbra={0.95} decay={0} intensity={2.1} color="#fff1df" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* contraluz fría: recorta el canto del aro y los postes */}
      <directionalLight position={[7, 5, -7]} intensity={1.1} color="#cfe0ff" />
      <directionalLight position={[6, 1.5, 7]} intensity={0.3} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6; // ToneMappingMode.ACES_FILMIC de postprocessing
/** Bloom moderado sólo en lo que emite (la luz pasa de 1 en HDR) + ACES + viñeta. Props constantes. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.62} luminanceThreshold={1.0} luminanceSmoothing={0.25} radius={0.6} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number) {
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 0.05, 400);
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
  let d = 14;
  for (let pasada = 0; pasada < 3; pasada++) {
    let lo = 1, hi = 120;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; const b = caja(m); if ((b.x1 - b.x0) / 2 <= mx && (b.y1 - b.y0) / 2 <= my) hi = m; else lo = m; }
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

const DIR_CAMARA = (() => {
  const el = THREE.MathUtils.degToRad(9), az = THREE.MathUtils.degToRad(-17);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
})();

/** Lo que tiene que caber: el aro con su columna, el panel con sus postes y el plinto. */
function puntosEncuadre(fourier: boolean): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; P.push(new THREE.Vector3(R_OUT * Math.cos(a), R_OUT * Math.sin(a), 0)); }
  for (const x of X_PLINTO) for (const z of Z_PLINTO) P.push(new THREE.Vector3(x, Y_PLINTO - 0.2, z), new THREE.Vector3(x, Y_PLINTO, z));
  P.push(new THREE.Vector3(PANEL.x0 - 0.05, PANEL.y1 + 0.1, 0), new THREE.Vector3(PANEL.x1 + 0.05, PANEL.y1 + 0.1, 0));
  if (fourier) P.push(new THREE.Vector3(-1.95, 0, 0), new THREE.Vector3(-1.5, 1.25, 0), new THREE.Vector3(-1.5, -1.25, 0));
  return P;
}

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Camara({ fourier, reducido, encuadre }: { fourier: boolean; reducido: boolean; encuadre: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const usuario = useRef(false);
  const programa = useRef(false);
  const primera = useRef(true);
  const anim = useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; o0: THREE.Vector3; o1: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    if (!controls) return;
    // sólo cuenta como «el alumno movió la cámara» un cambio que no hicimos nosotros
    const f = () => { if (!programa.current) { usuario.current = true; anim.current = null; } };
    controls.addEventListener('change', f);
    return () => controls.removeEventListener('change', f);
  }, [controls]);
  const aspecto = size.width / Math.max(1, size.height);
  const ultimoEncuadre = useRef(encuadre);
  useLayoutEffect(() => {
    if (!controls) return;
    if (ultimoEncuadre.current !== encuadre) { ultimoEncuadre.current = encuadre; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    // apaisado: el instrumento ocupa ~64 % del alto; en vertical manda el ancho
    const p = encuadrar(DIR_CAMARA, new THREE.Vector3(1.8, -0.3, 0), puntosEncuadre(fourier), camera.fov, aspecto, 0.93, 0.64);
    if (primera.current || reducido) {
      primera.current = false;
      programa.current = true;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      programa.current = false;
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, fourier, camera, reducido, encuadre]);
  useFrame((_, dt) => {
    const a = anim.current; if (!a || !controls) return;
    a.t = Math.min(1, a.t + dt / 0.8);
    const e = facil(a.t);
    programa.current = true;
    camera.position.lerpVectors(a.p0, a.p1, e);
    controls.target.lerpVectors(a.o0, a.o1, e);
    controls.update();
    programa.current = false;
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── utilidades de trazado ─────────────────────────────

/** Polilínea [x, y, z…] de un arco de radio r (centro c) entre a0 y a1 (rad). */
function arco(r: number, a0: number, a1: number, n: number, c: P2 = [0, 0], z = LZ): number[] {
  const out: number[] = [];
  const m = Math.max(2, n);
  for (let i = 0; i < m; i++) { const a = a0 + ((a1 - a0) * i) / (m - 1); out.push(c[0] + r * Math.cos(a), c[1] + r * Math.sin(a), z); }
  return out;
}

/** Segmento discontinuo como varias polilíneas cortas. */
function rayas(a: [number, number, number], b: [number, number, number], raya: number, hueco: number): number[][] {
  const L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  if (L < 1e-6) return [];
  const out: number[][] = [];
  for (let s = 0; s < L; s += raya + hueco) {
    const e = Math.min(L, s + raya);
    const p = (t: number) => [a[0] + ((b[0] - a[0]) * t) / L, a[1] + ((b[1] - a[1]) * t) / L, a[2] + ((b[2] - a[2]) * t) / L];
    out.push([...p(s), ...p(e)]);
  }
  return out;
}

/** Curva de la onda y = f(t) entre t0 y t1 (rad) sobre el panel. */
function curvaOnda(f: (t: number) => number, t0: number, t1: number, n: number, z = LZ): number[] {
  const out: number[] = [];
  const m = Math.max(2, n);
  for (let i = 0; i < m; i++) { const t = t0 + ((t1 - t0) * i) / (m - 1); out.push(xOnda(t), f(t), z); }
  return out;
}

const TAN_MAX_ONDA = 1.25;
const RAMAS_TAN: [number, number][] = (() => {
  const a = Math.atan(TAN_MAX_ONDA);
  return [[0, a], [Math.PI - a, Math.PI + a], [2 * Math.PI - a, 2 * Math.PI]];
})();
const TAN_MAX_CIRCULO = 1.95;

const rgb = (hex: string, k: number): [number, number, number] => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };

// ───────────────────────────── la luz: el fenómeno ─────────────────────────────

interface EstadoVisto { theta: number; P: P2; pluma: P2; punta: P2 | null; sumaParcial: number | null }

function Fenomeno({ p, visto, indice }: { p: Trig3DProps; visto: React.MutableRefObject<EstadoVisto>; indice: React.MutableRefObject<THREE.Group | null> }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const c = useMemo(() => ({
    radio: new Cinta({ color: COLOR_M5.radio, intensidad: 1.5, capacidad: 8, nucleo: 0.007, halo: 0.03 }),
    sen: new Cinta({ color: COLOR_M5.sen, intensidad: 2.6, capacidad: 8, nucleo: 0.009, halo: 0.04 }),
    cos: new Cinta({ color: COLOR_M5.cos, intensidad: 2.6, capacidad: 8, nucleo: 0.009, halo: 0.04 }),
    tan: new Cinta({ color: COLOR_M5.tan, intensidad: 2.2, capacidad: 8, nucleo: 0.008, halo: 0.035 }),
    finas: new Cinta({ color: '#ffffff', intensidad: 1, capacidad: 900, nucleo: 0.004, halo: 0.016, kn: 1.3, kh: 0.18 }),
    arcoAng: new Cinta({ color: COLOR_M5.angulo, intensidad: 1.9, capacidad: 140, nucleo: 0.006, halo: 0.024 }),
    trazaSen: new Cinta({ color: COLOR_M5.sen, intensidad: 2.3, capacidad: 260, nucleo: 0.008, halo: 0.034 }),
    trazaCos: new Cinta({ color: COLOR_M5.cos, intensidad: 2.3, capacidad: 260, nucleo: 0.008, halo: 0.034 }),
    trazaTan: new Cinta({ color: COLOR_M5.tan, intensidad: 2.0, capacidad: 300, nucleo: 0.007, halo: 0.03 }),
    fantasmaSen: new Cinta({ color: COLOR_M5.sen, intensidad: 0.11, capacidad: 260, nucleo: 0.006, halo: 0.02 }),
    fantasmaCos: new Cinta({ color: COLOR_M5.cos, intensidad: 0.11, capacidad: 260, nucleo: 0.006, halo: 0.02 }),
    fantasmaTan: new Cinta({ color: COLOR_M5.tan, intensidad: 0.1, capacidad: 300, nucleo: 0.006, halo: 0.02 }),
    proyeccion: new Cinta({ color: COLOR_M5.sen, intensidad: 0.9, capacidad: 220, nucleo: 0.004, halo: 0.016 }),
    epiCirc: new Cinta({ color: '#bfe3ff', intensidad: 0.62, capacidad: 12 * 97, nucleo: 0.004, halo: 0.014, kn: 1.4, kh: 0.15 }),
    epiBrazos: new Cinta({ color: COLOR_M5.radio, intensidad: 1.6, capacidad: 40, nucleo: 0.007, halo: 0.028 }),
    trazaFourier: new Cinta({ color: COLOR_M5.fourier, intensidad: 2.4, capacidad: 400, nucleo: 0.008, halo: 0.034 }),
    objetivo: new Cinta({ color: '#e2e8f0', intensidad: 0.15, capacidad: 400, nucleo: 0.005, halo: 0.018 }),
    reto: new Cinta({ color: COLOR_M5.captura, intensidad: 1.5, capacidad: 400, nucleo: 0.006, halo: 0.026 }),
    destellos: new Destellos(48),
  }), []);
  useEffect(() => () => { Object.values(c).forEach((x) => x.dispose()); }, [c]);
  // el punto que gira es una fuente de luz pequeña: lame el latón y el vidrio a su paso
  const luzP = useRef<THREE.PointLight>(null);

  useFrame((_, dt) => {
    const r = p.reloj.current;
    // con movimiento reducido el punto arranca quieto (el Piloto no lo pone a girar), pero si
    // el alumno pulsa «Girar», gira
    r.paso(dt);
    const th = r.theta, rad = aRad(th);
    const fourier = r.modo === 'fourier';
    const l = leer(th), G = geometria(th);
    const ds: Destello[] = [];
    const px = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / Math.max(1, size.height);
    Object.values(c).forEach((x) => { if (x instanceof Cinta) x.pixel(px); });
    const Z = LZ;
    const v3 = (q: P2): [number, number, number] => [q[0], q[1], Z];
    const finas: number[][] = [], brFinas: number[][] = [];
    const fina = (pts: number[][], k: number) => { for (const q of pts) { finas.push(q); brFinas.push(new Array(q.length / 3).fill(k)); } };

    // índice de lectura del aro
    if (indice.current) indice.current.rotation.z = rad;

    // ── círculo: radio, seno, coseno, tangente ──
    const circulo = !fourier;
    c.radio.fijar(circulo ? [[0, 0, Z, ...v3(G.P)]] : []);
    c.sen.fijar(circulo && p.verSeno ? [[...v3(G.seno[0]), ...v3(G.seno[1])]] : []);
    c.cos.fijar(circulo && p.verCoseno ? [[...v3(G.coseno[0]), ...v3(G.coseno[1])]] : []);
    if (circulo && p.verTangente && l.tan != null) {
      const tc = Math.max(-TAN_MAX_CIRCULO, Math.min(TAN_MAX_CIRCULO, l.tan));
      const fuera = Math.abs(l.tan) > TAN_MAX_CIRCULO;
      c.tan.fijar([[1, 0, Z, 1, tc, Z]], [[1, fuera ? 0.25 : 1]]);
      // la recta OP prolongada hasta la tangente (pasa por O si T queda del otro lado) y la recta x = 1
      fina(rayas(v3(G.P), [1, tc, Z], 0.05, 0.045), 0.9);
      fina(rayas([1, -TAN_MAX_CIRCULO, Z - 0.002], [1, TAN_MAX_CIRCULO, Z - 0.002], 0.035, 0.05), 0.28);
      ds.push({ p: [1, tc, Z], rgb: rgb(COLOR_M5.tan, fuera ? 0.4 : 1.4), tam: 0.07 });
    } else c.tan.fijar([]);

    // ángulo θ (arco dorado) y ángulo de referencia (arco fino, si θ no está en el primer cuadrante)
    if (circulo && th > 0.5) {
      c.arcoAng.fijar([arco(0.22, 0, rad, Math.ceil(th / 3) + 2)]);
      if (l.cuadrante > 1) {
        const ref = aRad(l.referencia);
        const a0 = l.cuadrante === 2 ? Math.PI - ref : l.cuadrante === 3 ? Math.PI : 2 * Math.PI - ref;
        const pts = arco(0.33, a0, a0 + ref, Math.ceil(l.referencia / 3) + 2);
        finas.push(pts); brFinas.push(new Array(pts.length / 3).fill(0.75));
      }
    } else c.arcoAng.fijar([]);

    // ── la onda desenrollada ──
    const t0 = 0, t1 = rad;
    const nB = Math.max(2, Math.ceil((rad / (2 * Math.PI)) * 240) + 2);
    const nG = 241;
    if (circulo) {
      c.trazaSen.fijar(p.verSeno ? [curvaOnda(Math.sin, t0, t1, nB)] : []);
      c.fantasmaSen.fijar(p.verSeno ? [curvaOnda(Math.sin, 0, 2 * Math.PI, nG)] : []);
      c.trazaCos.fijar(p.verCoseno ? [curvaOnda(Math.cos, t0, t1, nB)] : []);
      c.fantasmaCos.fijar(p.verCoseno ? [curvaOnda(Math.cos, 0, 2 * Math.PI, nG)] : []);
      if (p.verTangente) {
        c.fantasmaTan.fijar(RAMAS_TAN.map(([a, b]) => curvaOnda(Math.tan, a, b, 80)));
        c.trazaTan.fijar(RAMAS_TAN.filter(([a]) => a < rad).map(([a, b]) => curvaOnda(Math.tan, a, Math.min(b, rad), Math.max(2, Math.ceil(((Math.min(b, rad) - a) / (b - a)) * 80)))));
      } else { c.trazaTan.fijar([]); c.fantasmaTan.fijar([]); }
      // la proyección: la altura de P viaja en horizontal hasta la pluma
      const pluma: [number, number, number] = [xOnda(rad), l.sen, Z];
      c.proyeccion.fijar(p.verSeno ? rayas(v3(G.P), pluma, 0.07, 0.05) : []);
      c.proyeccion.color(COLOR_M5.sen, 0.9);
      if (p.verSeno) ds.push({ p: pluma, rgb: rgb(COLOR_M5.sen, 1.6), tam: 0.085 });
      if (p.verCoseno) ds.push({ p: [xOnda(rad), l.cos, Z], rgb: rgb(COLOR_M5.cos, 1.6), tam: 0.085 });
      if (p.verTangente && l.tan != null && Math.abs(l.tan) <= TAN_MAX_ONDA) ds.push({ p: [xOnda(rad), l.tan, Z], rgb: rgb(COLOR_M5.tan, 1.5), tam: 0.075 });
      // cursor vertical del panel (dónde está θ en el eje)
      fina([[xOnda(rad), -1.12, Z - 0.003, xOnda(rad), 1.12, Z - 0.003]], 0.3);
      // el punto P y el pie del seno
      ds.push({ p: v3(G.P), rgb: [2.2, 2.3, 2.4], tam: 0.12 });
      if (p.verSeno || p.verCoseno) ds.push({ p: [l.cos, 0, Z], rgb: rgb(p.verCoseno ? COLOR_M5.cos : COLOR_M5.sen, 0.9), tam: 0.05 });
      visto.current = { theta: th, P: G.P, pluma: [xOnda(rad), l.sen], punta: null, sumaParcial: null };
      c.epiCirc.fijar([]); c.epiBrazos.fijar([]); c.trazaFourier.fijar([]); c.objetivo.fijar([]);
    } else {
      // ── Fourier: cadena de epiciclos ──
      const ts = r.terminos;
      const ch = epiciclos(ts, rad, sentidosDe(r.forma, ts.length));
      const circs: number[][] = [], brC: number[] = [];
      const brazo: number[] = [0, 0, Z];
      ch.forEach((e, i) => {
        const n = Math.max(24, Math.min(96, Math.round(e.r * 120)));
        circs.push(arco(e.r, 0, 2 * Math.PI, n, e.c, Z - 0.001));
        brC.push(i === 0 ? 1 : 0.7);
        brazo.push(e.punta[0], e.punta[1], Z);
        if (i < ch.length - 1) ds.push({ p: [e.punta[0], e.punta[1], Z], rgb: rgb(COLOR_M5.angulo, 0.55), tam: 0.035 });
      });
      c.epiCirc.fijar(circs, brC);
      c.epiBrazos.fijar([brazo]);
      const punta = ch[ch.length - 1].punta;
      const S = sumaParcial(ts, rad);
      const pluma: [number, number, number] = [xOnda(rad), S, Z];
      c.proyeccion.fijar(rayas([punta[0], punta[1], Z], pluma, 0.07, 0.05));
      c.proyeccion.color(COLOR_M5.fourier, 0.9);
      c.trazaFourier.fijar([curvaOnda((t) => sumaParcial(ts, t), 0, rad, Math.max(2, Math.ceil((rad / (2 * Math.PI)) * 380) + 2))]);
      // la onda objetivo, tenue y en tramos (la cuadrada y la sierra saltan: se dibujan con sus verticales)
      const obj: number[] = [];
      for (let i = 0; i <= 360; i++) { const t = (2 * Math.PI * i) / 360; obj.push(xOnda(t), ondaObjetivo(r.forma, t + (i === 360 ? -1e-9 : i === 0 ? 1e-9 : 0)), Z - 0.002); }
      c.objetivo.fijar([obj]);
      ds.push({ p: [punta[0], punta[1], Z], rgb: [2.4, 2.0, 1.4], tam: 0.11 });
      ds.push({ p: pluma, rgb: rgb(COLOR_M5.fourier, 1.7), tam: 0.09 });
      fina([[xOnda(rad), -1.12, Z - 0.003, xOnda(rad), 1.12, Z - 0.003]], 0.3);
      c.trazaSen.fijar([]); c.fantasmaSen.fijar([]); c.trazaCos.fijar([]); c.fantasmaCos.fijar([]); c.trazaTan.fijar([]); c.fantasmaTan.fijar([]);
      visto.current = { theta: th, P: G.P, pluma: [xOnda(rad), S], punta, sumaParcial: S };
    }

    // ── capturas del alumno: cuentas doradas sobre el círculo y su marca en el eje θ ──
    if (circulo) {
      for (const g of p.capturados) {
        const a = aRad(g);
        ds.push({ p: [Math.cos(a), Math.sin(a), Z], rgb: rgb(COLOR_M5.captura, 1.25), tam: 0.07 });
        const pts = [xOnda(a), -0.09, Z, xOnda(a), 0.09, Z];
        finas.push(pts); brFinas.push([1.6, 1.6]);
      }
    }

    // ── el reto, SÓLO tras validar: la recta y = v (o x = v) y sus dos soluciones ──
    const lineasReto: number[][] = [];
    if (circulo && p.revelado) {
      const { funcion, valor, soluciones } = p.revelado;
      if (funcion === 'sen') {
        lineasReto.push(...rayas([-1.25, valor, Z], [xOnda(2 * Math.PI) + 0.08, valor, Z], 0.08, 0.05));
        for (const s of soluciones) ds.push({ p: [xOnda(aRad(s)), valor, Z], rgb: rgb(COLOR_M5.captura, 1.6), tam: 0.1 });
      } else {
        lineasReto.push(...rayas([valor, -1.25, Z], [valor, 1.25, Z], 0.08, 0.05));
        lineasReto.push(...rayas([X0_ONDA, valor, Z], [xOnda(2 * Math.PI) + 0.08, valor, Z], 0.08, 0.05));
        for (const s of soluciones) ds.push({ p: [xOnda(aRad(s)), valor, Z], rgb: rgb(COLOR_M5.captura, 1.6), tam: 0.1 });
      }
      for (const s of soluciones) { const a = aRad(s); ds.push({ p: [Math.cos(a), Math.sin(a), Z], rgb: rgb(COLOR_M5.captura, 2.0), tam: 0.13 }); }
    }
    c.reto.fijar(lineasReto);
    c.finas.fijar(finas, brFinas);
    c.destellos.fijar(ds);
    const luz = luzP.current;
    if (luz) {
      const q = fourier ? (visto.current.punta ?? G.P) : G.P;
      luz.position.set(q[0], q[1], 0.2);
      luz.color.setHex(fourier ? 0xffd2a0 : 0xdff4ff);
    }
  }, -1);

  return (
    <group>
      {Object.values(c).map((x, i) => <primitive key={i} object={x.mesh} />)}
      <pointLight ref={luzP} position={[1, 0, 0.2]} intensity={0.12} distance={1.5} decay={2} />
    </group>
  );
}

// ───────────────────────────── arrastre con la mano ─────────────────────────────

function Asideros({ p }: { p: Trig3DProps }) {
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const gl = useThree((s) => s.gl);
  const plano = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), -LZ), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const activo = useRef<'disco' | 'panel' | null>(null);
  const matInvisible = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }), []);
  useEffect(() => () => matInvisible.dispose(), [matInvisible]);

  const angulo = (e: ThreeEvent<PointerEvent>, cual: 'disco' | 'panel'): number | null => {
    const q = e.ray.intersectPlane(plano, tmp);
    if (!q) return null;
    if (cual === 'disco') {
      if (Math.hypot(q.x, q.y) < 0.08) return null;
      return norm360(aGrados(Math.atan2(q.y, q.x)));
    }
    const t = (q.x - X0_ONDA) / LARGO_ONDA;
    return Math.max(0, Math.min(359.999, t * 360));
  };
  const empezar = (cual: 'disco' | 'panel') => (e: ThreeEvent<PointerEvent>) => {
    if (p.reloj.current.modo !== 'circulo' && cual === 'panel') { /* en Fourier también se puede arrastrar la pluma */ }
    const g = angulo(e, cual);
    if (g == null) return;
    e.stopPropagation();
    (e.target as unknown as { setPointerCapture?: (id: number) => void }).setPointerCapture?.(e.pointerId);
    if (controls) controls.enabled = false;
    activo.current = cual;
    p.reloj.current.arrastrando = true;
    p.reloj.current.fijar(g);
    gl.domElement.style.cursor = 'grabbing';
    p.onArrastre?.('inicio', g);
  };
  const mover = (cual: 'disco' | 'panel') => (e: ThreeEvent<PointerEvent>) => {
    if (activo.current !== cual) { gl.domElement.style.cursor = 'grab'; return; }
    const g = angulo(e, cual);
    if (g == null) return;
    p.reloj.current.fijar(g);
    p.onArrastre?.('mueve', g);
  };
  const soltar = (e: ThreeEvent<PointerEvent>) => {
    if (!activo.current) return;
    (e.target as unknown as { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(e.pointerId);
    activo.current = null;
    if (controls) controls.enabled = true;
    const r = p.reloj.current;
    r.arrastrando = false;
    const g = Math.round(r.theta) % 360;
    r.fijar(g);
    gl.domElement.style.cursor = 'grab';
    p.onArrastre?.('fin', g);
  };
  const fuera = () => { if (!activo.current) gl.domElement.style.cursor = ''; };
  const cx = (PANEL.x0 + PANEL.x1) / 2, cy = (PANEL.y0 + PANEL.y1) / 2;
  return (
    <group>
      <mesh position={[0, 0, LZ + 0.004]} material={matInvisible} userData={{ pieza: 'disco' }}
        onPointerDown={empezar('disco')} onPointerMove={mover('disco')} onPointerUp={soltar} onPointerOut={fuera}>
        <circleGeometry args={[R_OUT + 0.06, 64]} />
      </mesh>
      <mesh position={[cx, cy, LZ + 0.004]} material={matInvisible} userData={{ pieza: 'panel' }}
        onPointerDown={empezar('panel')} onPointerMove={mover('panel')} onPointerUp={soltar} onPointerOut={fuera}>
        <planeGeometry args={[PANEL.x1 - PANEL.x0, PANEL.y1 - PANEL.y0]} />
      </mesh>
    </group>
  );
}

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;
export interface RotuloM5 { id: string; texto: string; ancla: () => [number, number, number] | null }

/** Proyecta las anclas y coloca los <div> sin solaparse (≤ 8), cada cuadro. */
function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloM5[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (rotulos.length === 0) return;
    const cajas: { x: number; y: number; w: number; h: number }[] = [];
    const lista = rotulos.slice(0, 8).map((r) => {
      const a = r.ancla();
      if (!a) return { r, x: -9999, y: -9999, z: 2 };
      v.set(...a).project(camera);
      return { r, x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, z: v.z };
    }).sort((a, b) => a.y - b.y);
    for (const it of lista) {
      const el = nodos.current.get(it.r.id); if (!el) continue;
      if (it.z > 1) { el.style.opacity = '0'; continue; }
      const w = el.offsetWidth || 120, h = el.offsetHeight || 22;
      const x = Math.min(size.width - w - 4, Math.max(4, it.x - w / 2));
      let y = it.y - h - 10;
      for (let k = 0; k < 12; k++) {
        const choca = cajas.find((c) => x < c.x + c.w + 4 && x + w + 4 > c.x && y < c.y + c.h + 3 && y + h + 3 > c.y);
        if (!choca) break;
        y = choca.y + choca.h + 4;
      }
      y = Math.min(size.height - h - 4, Math.max(4, y));
      cajas.push({ x, y, w, h });
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      el.style.opacity = '1';
    }
  });
  return null;
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function contarNormalesCero(scene: THREE.Object3D) {
  let normalesCero = 0, mallas = 0;
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry) return;
    mallas++;
    const n = m.geometry.getAttribute('normal');
    if (!n) return;
    for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
  });
  return { normalesCero, mallas };
}

function DiagnosticoDev({ reloj, calidad, visto }: { reloj: React.MutableRefObject<RelojTrig>; calidad: Calidad; visto: React.MutableRefObject<EstadoVisto> }) {
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
  // prioridad NEGATIVA: con una prioridad > 0 r3f deja de dibujar solo y, sin compositor, el lienzo sale negro
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
    const w = window as unknown as { __mat05?: unknown };
    w.__mat05 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj.current, l = leer(r.theta), v = visto.current;
        return {
          theta: r.theta, girando: r.girando, arrastrando: r.arrastrando, modo: r.modo, forma: r.forma, n: r.n, version: r.version,
          sen: l.sen, cos: l.cos, tan: l.tan, cuadrante: l.cuadrante, referencia: l.referencia,
          // lo que la escena dibujó en el último cuadro (reloj único: debe coincidir con el modelo)
          visto: v,
        };
      },
      /** sólo desarrollo: fija θ (°) como si el alumno arrastrara y soltara */
      fijar(g: number) { reloj.current.girando = false; reloj.current.fijar(g); },
      /** sólo desarrollo: píxel (CSS, de la página) donde cae un punto del mundo */
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const rc = gl.domElement.getBoundingClientRect();
        return { x: rc.left + (v.x * 0.5 + 0.5) * rc.width, y: rc.top + (-v.y * 0.5 + 0.5) * rc.height };
      },
      escena: scene,
      renderer: gl,
    };
    return () => { delete w.__mat05; };
  }, [gl, scene, reloj, calidad, camera, visto]);
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

// ───────────────────────────── el instrumento ─────────────────────────────

const ROTULO_PIEZA: Record<string, string> = {
  aro: 'Aro de latón · escala grabada de 1° en 1°',
  disco: 'Disco de vidrio · círculo unitario de radio 1 (arrástralo)',
  indice: 'Índice de lectura de θ',
  panel: 'Panel de la onda · eje θ en radianes (arrastra la pluma)',
  soporte: 'Columna de bronce',
  plinto: 'Plinto lacado',
};

function Instrumento({ p, rotulo, publicarRotulos, nodos, visto }: {
  p: Trig3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloM5[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
  visto: React.MutableRefObject<EstadoVisto>;
}) {
  const mats = useMatsM5(p.calidad);
  const indice = useRef<THREE.Group>(null);
  const [fourier, setFourier] = useState(p.reloj.current.modo === 'fourier');
  // el modo vive en el reloj: la escena re-encuadra cuando cambia
  useFrame(() => { const f = p.reloj.current.modo === 'fourier'; if (f !== fourier) setFourier(f); });

  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    const texto = pieza ? ROTULO_PIEZA[pieza] ?? null : null;
    rotulo.current(texto ? { texto, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  // rótulos con el botón «Rótulos» (≤ 8), anclados a lo que se mueve
  const rotulos = useMemo<RotuloM5[]>(() => {
    if (!p.rotulos) return [];
    const r = p.reloj;
    const G = () => geometria(r.current.theta);
    if (fourier) {
      return [
        { id: 'epi', texto: 'Epiciclos: un círculo por armónico', ancla: () => [-0.9, 0.95, LZ] },
        { id: 'punta', texto: 'Punta: altura = suma de armónicos', ancla: () => { const v = visto.current.punta; return v ? [v[0], v[1], LZ] : null; } },
        { id: 'suma', texto: 'Suma parcial S_N(θ)', ancla: () => [xOnda(aRad(r.current.theta)), visto.current.sumaParcial ?? 0, LZ] },
        { id: 'obj', texto: 'Onda objetivo', ancla: () => [X0_ONDA + LARGO_ONDA * 0.82, 1.05, LZ] },
        { id: 'esc', texto: 'Escala en grados (latón)', ancla: () => [R_OUT * Math.cos(2.6), R_OUT * Math.sin(2.6), 0] },
      ];
    }
    const out: RotuloM5[] = [
      { id: 'circ', texto: 'Círculo unitario · r = 1', ancla: () => [Math.cos(2.36), Math.sin(2.36), LZ] },
      { id: 'radio', texto: 'Radio = 1', ancla: () => { const q = G().P; return [q[0] * 0.55, q[1] * 0.55, LZ]; } },
    ];
    if (p.verSeno) out.push({ id: 'sen', texto: 'sen θ: la altura de P', ancla: () => { const s = G().seno; return [s[0][0], (s[0][1] + s[1][1]) / 2, LZ]; } });
    if (p.verCoseno) out.push({ id: 'cos', texto: 'cos θ: la abscisa de P', ancla: () => { const s = G().coseno; return [(s[0][0] + s[1][0]) / 2, 0, LZ]; } });
    if (p.verTangente) out.push({ id: 'tan', texto: 'tan θ sobre la tangente x = 1', ancla: () => { const t = G().tangente; return t ? [1, Math.max(-1.9, Math.min(1.9, t[1][1])) / 2, LZ] : null; } });
    out.push({ id: 'esc', texto: 'Escala en grados', ancla: () => [R_OUT * Math.cos(2.6), R_OUT * Math.sin(2.6), 0] });
    out.push({ id: 'onda', texto: 'La onda: altura de P frente a θ', ancla: () => [X0_ONDA + LARGO_ONDA * 0.5, 1.12, LZ] });
    out.push({ id: 'eje', texto: 'Eje θ: el arco desenrollado', ancla: () => [X0_ONDA + LARGO_ONDA * 0.9, -0.05, LZ] });
    return out.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.rotulos, fourier, p.verSeno, p.verCoseno, p.verTangente]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara fourier={fourier} reducido={p.reducido} encuadre={p.encuadre ?? 0} />
      <Suelo calidad={p.calidad} />
      <Plinto mats={mats} />
      <Soporte mats={mats} />
      <AroGraduado mats={mats} calidad={p.calidad} />
      <DiscoVidrio mats={mats} calidad={p.calidad} />
      <group ref={indice}><IndiceLectura mats={mats} /></group>
      <PanelOnda mats={mats} calidad={p.calidad} />
      <Fenomeno p={p} visto={visto} indice={indice} />
      <Asideros p={p} />
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} />
    </group>
  );
}

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[260px] rounded-md border border-white/15 bg-[#0b1220]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-m5="">
      {d.texto}
    </div>
  );
}

function Trigonometria3DScene(props: Trig3DProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const visto = useRef<EstadoVisto>({ theta: 0, P: [1, 0], pluma: [X0_ONDA, 0], punta: null, sumaParcial: null });
  const [lista, setLista] = useState<RotuloM5[]>([]);
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-m5="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 1, 14], fov: 30, near: 0.05, far: 200 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes calidad={calidad} />
          <Luces calidad={calidad} />
          <ControlesBanco objetivo={[1.8, -0.3, 0]} fondo="laboratorio"
            limites={{ minDistancia: 3, maxDistancia: 40, maxPolar: 1.62, minPolar: 0.35, paneo: true, cajaObjetivo: [[-2, -2, -1], [6, 1.5, 1]] }} />
          <Instrumento p={props} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} visto={visto} />
          <DiagnosticoDev reloj={props.reloj} calidad={calidad} visto={visto} />
          <AvisarListo onListo={props.onListo} />
          {alta && <Posproceso />}
        </KitContexto.Provider>
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1420]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)', opacity: 0 }} data-rotulo-m5={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(Trigonometria3DScene);
