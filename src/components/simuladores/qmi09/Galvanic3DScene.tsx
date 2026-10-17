"use client";
/**
 * Q9 · Celda galvánica — el banco en 3D (R3F), a escala real (1 u = 10 cm).
 *
 *   Dos vasos de 250 mL con 200 mL de la sal de su metal, una varilla de electrodo en
 *   cada uno, el puente salino de KNO₃ en agar y un voltímetro analógico de cero
 *   central sobre su elevador, con la caja de carga entre los bornes.
 *
 * RELOJ ÚNICO. `reloj.current.paso(dt)` corre aquí, en un useFrame de prioridad −1
 * (antes que nada se dibuje): integra la celda (electroquimica.ts) con la cámara rápida
 * elegida y publica la lectura de ESE cuadro. Las varillas (Faraday), el color de las
 * disoluciones (Beer–Lambert), los iones, los electrones, la aguja del voltímetro, el
 * dock y la barra de lecturas leen ese mismo estado.
 *
 * NO REGALAR. En el reto la escena no escribe «ánodo» ni «cátodo» hasta que el alumno
 * valida; sólo muestra lo que se vería en el laboratorio (qué varilla se gasta, hacia
 * dónde va la aguja), que es la evidencia que tiene que interpretar.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { KitContexto, ControlesBanco, cajaRedondeada, tuboPolilinea, type Calidad } from '../_kit';
import { BANCO, METAL, esMetal, type Carga, type IdMetal } from './electroquimica';
import type { RelojCelda } from './reloj';
import {
  COTAS, BORNE, AGARRE, FRENTE_MEDIDOR, useMatsQ9, Mesa, VasoCelda, BarraPortaelectrodo, Varilla, PuenteSalino, Voltimetro,
  PinzaCocodrilo, trazaCable, crearMaterialLiquido, tintarLiquido, contarNormalesCero, type V3, type EscalaV, type MatsQ9,
} from './piezas';
import { IonesVasos, IonesPuente, Electrones } from './iones';

export type ModoQ9 = 'daniell' | 'reto';

export interface RotuloQ9 { id: string; texto: string; ancla: V3 }

export interface Galvanic3DProps {
  reloj: React.MutableRefObject<RelojCelda>;
  modo: ModoQ9;
  izq: IdMetal | null;
  der: IdMetal | null;
  puente: boolean;
  cables: boolean;
  carga: Carga;
  /** metales del reto: los que aún no están en un vaso esperan en la gradilla */
  seedMetales: string[];
  /** el reto ya se validó: se pueden rotular ánodo y cátodo */
  validado: boolean;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** sube para volver al encuadre automático */
  encuadre?: number;
  /** la escena ya pintó sus primeros cuadros (el aviso inicial espera a esto) */
  onListo?: () => void;
}

/** Avisa una vez, tras unos cuadros pintados (en equipos lentos la escena tarda en aparecer). */
function AvisarListo({ onListo }: { onListo?: () => void }) {
  const n = useRef(0);
  useFrame(() => {
    if (n.current > 3) return;
    n.current++;
    if (n.current === 3) onListo?.();
  });
  return null;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#06090c';

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.12;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    (gl as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = calidad === 'alta' ? 1 : 0.5;
    // fondo de estudio: degradado radial oscuro con un tramado mínimo (sin bandas)
    let tex: THREE.CanvasTexture | null = null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(256, 200, 10, 256, 250, 420);
      grad.addColorStop(0, '#1c2834'); grad.addColorStop(0.55, '#0f161e'); grad.addColorStop(1, FONDO);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      const img = g.getImageData(0, 0, 512, 512);
      let s = 991;
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
    // entorno de estudio procedural (RoomEnvironment): reflejos de catálogo, sin red
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.5;
    return () => { scene.environment = null; scene.background = null; env.dispose(); pm.dispose(); tex?.dispose(); };
  }, [gl, scene, calidad]);
  return null;
}

function Luces({ calidad }: { calidad: Calidad }) {
  const clave = useRef<THREE.SpotLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    l.shadow.bias = -0.0003; l.shadow.normalBias = 0.02; l.shadow.radius = 6;
    l.shadow.camera.near = 2; l.shadow.camera.far = 20; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(0, 0.45, -0.25); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#b4c6d8', '#07090c', 0.32]} />
      {/* luz clave de estudio: foco cálido de penumbra ancha → charco de luz y sombras suaves */}
      <spotLight ref={clave} position={[-3.6, 6.2, 4.2]} angle={0.5} penumbra={0.9} decay={0} intensity={2.2} color="#fff1df" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* contraluz fría: recorta el vidrio y el contorno del voltímetro */}
      <directionalLight position={[3.5, 3.2, -4.5]} intensity={1.05} color="#cfe0ff" />
      <directionalLight position={[3.0, 2.0, 4.0]} intensity={0.32} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6; // ToneMappingMode.ACES_FILMIC de postprocessing 6.39
/** Bloom moderado sólo en lo que emite (iones y electrones, HDR > 1) + ACES + viñeta. Props constantes. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1.25} luminanceSmoothing={0.2} radius={0.55} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.28} darkness={0.6} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

/**
 * Distancia y objetivo para que `puntos` quepan en ±mx, ±my (NDC) mirando desde `dir`.
 * Búsqueda binaria de la distancia + recentrado en tres pasadas (como en el banco de Snell).
 */
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
  let d = 10;
  for (let pasada = 0; pasada < 3; pasada++) {
    let lo = 1, hi = 80;
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
  const el = THREE.MathUtils.degToRad(20), az = THREE.MathUtils.degToRad(-11);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
})();

/** Puente tumbado sobre la mesa, delante (las patas hacia el fondo). */
const REPOSO_PUENTE: V3 = [0, 0.072, 1.27];
/** Gradilla de los electrodos aún sin colocar: detrás del vaso derecho. */
const GRADILLA: V3 = [1.42, 0, -0.62];

function puntosEncuadre(reto: boolean): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  const R = BANCO.vaso.radioMax;
  for (const sx of [-1, 1]) for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    P.push(new THREE.Vector3(sx * COTAS.xVaso + Math.cos(a) * R, 0, Math.sin(a) * R));
    P.push(new THREE.Vector3(sx * COTAS.xVaso + Math.cos(a) * R, COTAS.yBorde, Math.sin(a) * R));
  }
  for (const sx of [-1, 1]) P.push(new THREE.Vector3(sx * (COTAS.xVarilla + 0.3), COTAS.yTopeVarilla + 0.12, 0));
  const zM = COTAS.zMedidor, hM = COTAS.altoElevador + COTAS.altoCaja;
  for (const sx of [-1, 1]) {
    P.push(new THREE.Vector3(sx * COTAS.anchoCaja / 2, hM, zM + COTAS.fondoCaja / 2));
    P.push(new THREE.Vector3(sx * COTAS.anchoCaja / 2, hM, zM - COTAS.fondoCaja / 2));
  }
  if (reto) {
    P.push(new THREE.Vector3(-0.82, 0.05, REPOSO_PUENTE[2] + 0.07), new THREE.Vector3(0.82, 0.05, REPOSO_PUENTE[2] + 0.07));
    P.push(new THREE.Vector3(GRADILLA[0] + 0.22, 1.3, GRADILLA[2]));
  }
  return P;
}

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Encuadre con transición suave; re-encuadra al cambiar el tamaño si el alumno no movió la cámara. */
function Camara({ reto, reducido, encuadre }: { reto: boolean; reducido: boolean; encuadre: number }) {
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
  const ultimoEncuadre = useRef(encuadre);
  useLayoutEffect(() => {
    if (!controls) return;
    // «Encuadrar» devuelve el control al encuadre automático
    if (ultimoEncuadre.current !== encuadre) { ultimoEncuadre.current = encuadre; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    // apaisado: el banco ocupa ~64 % del alto; en vertical manda el ancho
    const p = encuadrar(DIR_CAMARA, new THREE.Vector3(0, 0.75, -0.3), puntosEncuadre(reto), camera.fov, aspecto, 0.9, 0.64);
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, reto, camera, reducido, encuadre]);
  useFrame((_, dt) => {
    const a = anim.current; if (!a || !controls) return;
    a.t = Math.min(1, a.t + dt / 0.8);
    const e = facil(a.t);
    camera.position.lerpVectors(a.p0, a.p1, e);
    controls.target.lerpVectors(a.o0, a.o1, e);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── piezas que se mueven (reto) ─────────────────────────────

/** Grupo que viaja a `destino` describiendo un arco (sin re-render por cuadro). */
function Movil({ destino, giroX = 0, children, reducido, userData }: {
  destino: V3; giroX?: number; children: React.ReactNode; reducido: boolean; userData?: Record<string, unknown>;
}) {
  const g = useRef<THREE.Group>(null);
  const est = useRef<{ desde: THREE.Vector3; hasta: THREE.Vector3; g0: number; g1: number; t: number } | null>(null);
  const clave = destino.join(',') + '|' + giroX;
  const primera = useRef(true);
  useLayoutEffect(() => {
    const o = g.current; if (!o) return;
    if (primera.current || reducido) {
      primera.current = false;
      o.position.set(...destino); o.rotation.x = giroX;
      est.current = null;
      return;
    }
    est.current = { desde: o.position.clone(), hasta: new THREE.Vector3(...destino), g0: o.rotation.x, g1: giroX, t: 0 };
  }, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame((_, dt) => {
    const o = g.current, e = est.current; if (!o || !e) return;
    e.t = Math.min(1, e.t + dt / 0.9);
    const k = facil(e.t);
    o.position.lerpVectors(e.desde, e.hasta, k);
    o.position.y += Math.sin(Math.PI * k) * Math.min(0.7, 0.25 + e.desde.distanceTo(e.hasta) * 0.3);
    o.rotation.x = e.g0 + (e.g1 - e.g0) * k;
    if (e.t >= 1) est.current = null;
  });
  return <group ref={g} userData={userData}>{children}</group>;
}

/** La punta de las mordazas pasa 3 mm más allá del eje de la varilla; el cable sale 29 mm detrás. */
const PUNTA_PINZA = 0.03;
const LARGO_PINZA = 0.29;
const signo = (lado: 'izq' | 'der') => (lado === 'izq' ? -1 : 1);
/** Salida del cable con la pinza mordiendo la varilla (la usan el cable y los electrones). */
function salidaEnVarilla(lado: 'izq' | 'der'): V3 {
  const a = AGARRE(lado);
  return [a[0] + signo(lado) * (LARGO_PINZA - PUNTA_PINZA), a[1], a[2]];
}

/** Cable cuyo extremo de pinza puede estar en vuelo: se reconstruye cuando ese extremo se mueve. */
function CableVivo({ salida, borne, material }: { salida: React.MutableRefObject<THREE.Vector3>; borne: V3; material: THREE.Material }) {
  const malla = useRef<THREE.Mesh>(null);
  const ultimo = useRef(new THREE.Vector3(1e9, 0, 0));
  useEffect(() => {
    const m = malla.current;
    return () => { (m?.geometry as THREE.BufferGeometry | undefined)?.dispose(); };
  }, []);
  useFrame(() => {
    const m = malla.current; if (!m) return;
    const p = salida.current;
    if (p.distanceToSquared(ultimo.current) < 1e-8) return;
    ultimo.current.copy(p);
    const geo = tuboPolilinea(trazaCable([p.x, p.y, p.z], borne), 0.017, 12, true);
    m.geometry.dispose();
    m.geometry = geo;
  });
  return <mesh ref={malla} material={material} castShadow><bufferGeometry /></mesh>;
}

/**
 * Pinza de cocodrilo que viaja entre su reposo (tumbada en el elevador, junto a su
 * borne) y lo alto de la varilla, con las mordazas abiertas en Z para morderla.
 * Publica en `salida` dónde sale el cable en cada cuadro.
 */
function PinzaViva({ lado, conectada, mats, salida, reducido }: {
  lado: 'izq' | 'der'; conectada: boolean; mats: MatsQ9; salida: React.MutableRefObject<THREE.Vector3>; reducido: boolean;
}) {
  const g = useRef<THREE.Group>(null);
  const sx = signo(lado);
  const enVarilla = useMemo(() => { const a = AGARRE(lado); return new THREE.Vector3(a[0] - sx * PUNTA_PINZA, a[1], a[2]); }, [lado, sx]);
  const enReposo = useMemo(() => {
    const b = BORNE[lado === 'izq' ? 'com' : 'v'];
    return new THREE.Vector3(b[0] + sx * 0.09, COTAS.altoElevador + 0.034, FRENTE_MEDIDOR + 0.05);
  }, [lado, sx]);
  const t = useRef(conectada ? 1 : 0);
  useFrame((_, dt) => {
    const o = g.current; if (!o) return;
    const obj = conectada ? 1 : 0;
    t.current = reducido ? obj : t.current + Math.sign(obj - t.current) * Math.min(Math.abs(obj - t.current), dt / 0.9);
    const k = facil(t.current);
    o.position.lerpVectors(enReposo, enVarilla, k);
    o.position.y += Math.sin(Math.PI * k) * 0.35;
    salida.current.set(o.position.x + sx * LARGO_PINZA, o.position.y, o.position.z);
  });
  // el cuerpo de la pinza mira hacia fuera (±X); las mordazas se abren en Z
  return (
    <group ref={g} userData={{ pieza: 'pinza' }}>
      <group rotation={[Math.PI / 2, lado === 'izq' ? Math.PI : 0, 0, 'YXZ']}>
        <PinzaCocodrilo funda={lado === 'izq' ? mats.silNegro : mats.silRojo} mats={mats} />
      </group>
    </group>
  );
}

/** Gradilla de polipropileno con los electrodos por colocar. */
function Gradilla({ mats }: { mats: MatsQ9 }) {
  return (
    <group position={GRADILLA} userData={{ pieza: 'gradilla' }}>
      <mesh geometry={cajaRedondeada(0.42, 0.16, 0.2, 0.025, 2)} material={mats.pp} position={[0, 0.08, 0]} castShadow receiveShadow />
    </group>
  );
}

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;

/** Proyecta las anclas de los rótulos y coloca los <div> del overlay sin solaparse (≤ 8). */
function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloQ9[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
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
      const w = el.offsetWidth || 120, h = el.offsetHeight || 22;
      const x = Math.min(size.width - w - 4, Math.max(4, it.x - w / 2));
      let y = it.y - h - 8;
      for (let k = 0; k < 12; k++) {
        const choca = cajas.find((c) => x < c.x + c.w + 4 && x + w + 4 > c.x && y < c.y + c.h + 3 && y + h + 3 > c.y);
        if (!choca) break;
        y = choca.y + choca.h + 4;
      }
      y = Math.min(size.height - h - 4, Math.max(4, y));
      cajas.push({ x, y, w, h });
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      el.style.opacity = it.z < 1 ? '1' : '0';
    }
  });
  return null;
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function DiagnosticoDev({ reloj, calidad }: { reloj: React.MutableRefObject<RelojCelda>; calidad: Calidad }) {
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
  // prioridad NEGATIVA: con una prioridad > 0, r3f deja de dibujar solo y sin compositor el lienzo sale negro
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
    const w = window as unknown as { __qmi09?: unknown };
    w.__qmi09 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj.current;
        return { montaje: r.montaje, estado: r.estado, lectura: r.lectura, factor: r.factor, pausa: r.pausa, qMax: r.qMax, historia: r.historia.length, version: r.version, agotada: r.agotada() };
      },
      /** sólo desarrollo: adelanta el reloj hasta que haya pasado la fracción `f` de la carga máxima */
      adelantar(f: number) {
        const r = reloj.current;
        for (let i = 0; i < 4000 && Math.abs(r.estado.q) < f * r.qMax && !r.agotada(); i++) r.paso(0.02);
        return { q: r.estado.q, qMax: r.qMax };
      },
      /** sólo desarrollo: píxel (CSS, relativo al lienzo) donde cae un punto del mundo */
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const r = gl.domElement.getBoundingClientRect();
        return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
      },
      escena: scene,
      renderer: gl,
    };
    return () => { delete w.__qmi09; };
  }, [gl, scene, reloj, calidad, camera]);
  return null;
}

// ───────────────────────────── el banco ─────────────────────────────

const ROTULO_PIEZA: Record<string, string> = {
  voltimetro: 'Voltímetro analógico de cero central · 10 MΩ',
  barra: 'Barra portaelectrodo de polipropileno',
  gradilla: 'Gradilla con los electrodos por colocar',
  iones: 'Iones disueltos (cada esfera ≈ 4 mmol)',
  pinza: 'Pinza de cocodrilo',
};

function Banco({ p, rotulo, publicarRotulos, nodos }: {
  p: Galvanic3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloQ9[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { reloj, modo, izq, der, puente, cables, carga, seedMetales, validado, calidad, reducido, encuadre = 0 } = p;
  const reto = modo === 'reto';
  const mats = useMatsQ9(calidad);
  const animar = !reducido;

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.current.paso(dt); }, -1);

  // líquidos: un material por vaso, teñido con Beer–Lambert con la concentración del modelo
  const liqIzq = useMemo(() => crearMaterialLiquido(calidad), [calidad]);
  const liqDer = useMemo(() => crearMaterialLiquido(calidad), [calidad]);
  useEffect(() => () => { liqIzq.dispose(); liqDer.dispose(); }, [liqIzq, liqDer]);
  const ultimo = useRef({ i: -1, d: -1, mi: '', md: '' });
  useFrame(() => {
    const l = reloj.current.lectura, u = ultimo.current;
    if (izq && (Math.abs(l.cIzq - u.i) > 1e-4 || u.mi !== izq)) { tintarLiquido(liqIzq, izq, l.cIzq, calidad); u.i = l.cIzq; u.mi = izq; }
    if (der && (Math.abs(l.cDer - u.d) > 1e-4 || u.md !== der)) { tintarLiquido(liqDer, der, l.cDer, calidad); u.d = l.cDer; u.md = der; }
  });

  const volIzq = useMemo(() => () => reloj.current.estado.vIzq, [reloj]);
  const volDer = useMemo(() => () => reloj.current.estado.vDer, [reloj]);
  const lectura = useMemo(() => () => reloj.current.lectura.V, [reloj]);

  // escala del voltímetro: la menor que contiene la fem estándar de la pareja montada
  const escala: EscalaV = useMemo(() => {
    if (!esMetal(izq) || !esMetal(der) || izq === der) return 5;
    return Math.abs(METAL[der].E0 - METAL[izq].E0) <= 1.4 ? 1.5 : 5;
  }, [izq, der]);

  // pinzas y cables
  const salidaIzq = useRef(new THREE.Vector3()), salidaDer = useRef(new THREE.Vector3());
  // traza de los electrones (circuito cerrado): varilla izq. → pinza → COM → (interior) → + → pinza → varilla der.
  const { traza, oculto } = useMemo(() => {
    const ci = trazaCable(salidaEnVarilla('izq'), BORNE.com, 46);
    const cd = trazaCable(salidaEnVarilla('der'), BORNE.v, 46);
    const inv: number[] = [];
    for (let i = cd.length / 3 - 1; i >= 0; i--) inv.push(cd[i * 3], cd[i * 3 + 1], cd[i * 3 + 2]);
    const ai = AGARRE('izq'), ad = AGARRE('der');
    const t = [ai[0], ai[1], ai[2], ...ci, ...inv, ad[0], ad[1], ad[2]];
    let L0 = 0;
    const nHastaCom = 1 + ci.length / 3;
    for (let i = 1; i < nHastaCom; i++) L0 += Math.hypot(t[i * 3] - t[i * 3 - 3], t[i * 3 + 1] - t[i * 3 - 2], t[i * 3 + 2] - t[i * 3 - 1]);
    const L1 = L0 + Math.abs(BORNE.v[0] - BORNE.com[0]);
    return { traza: t, oculto: [L0 - 0.02, L1 + 0.02] as [number, number] };
  }, []);

  // ¿qué lado es el ánodo? (a 1 M lo decide E°; en la celda de Daniell el Zn siempre)
  const anodo: 'izq' | 'der' | null = esMetal(izq) && esMetal(der) && izq !== der ? (METAL[izq].E0 < METAL[der].E0 ? 'izq' : 'der') : null;
  const revela = !reto || validado;
  const nombreVarilla = (m: IdMetal, lado: 'izq' | 'der' | null) => {
    const base = `Electrodo de ${METAL[m].nombre} (${m})`;
    if (!revela || !lado || !anodo) return base;
    return `${base} · ${anodo === lado ? 'ánodo (−): se oxida' : `cátodo (+): el ${METAL[m].ion} se reduce sobre él`}`;
  };
  // versión corta para los rótulos fijos (ocho a la vez no caben con la frase entera)
  const rotuloVarilla = (m: IdMetal, lado: 'izq' | 'der') => {
    if (!revela || !anodo) return `Electrodo de ${METAL[m].nombre} (${m})`;
    return anodo === lado ? `Ánodo (−) · ${m} se oxida` : `Cátodo (+) · ${METAL[m].ion} se reduce`;
  };
  const textoCarga = carga === 'abierta' ? 'Caja de carga · abierta: sólo el voltímetro' : `Caja de carga · ${carga >= 1000 ? carga / 1000 + ' kΩ' : carga + ' Ω'}`;

  // rótulo al pasar el ratón (DOM, nítido)
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    // r3f entrega una llamada por cada intersección (de cerca a lejos): manda la más cercana
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    let texto: string | null = pieza ? ROTULO_PIEZA[pieza] ?? null : null;
    if (pieza === 'varilla') { const m = o!.userData.metal as IdMetal; texto = nombreVarilla(m, izq === m ? 'izq' : der === m ? 'der' : null); }
    if (pieza === 'vaso') { const lado = o!.userData.lado as 'izq' | 'der'; const m = lado === 'izq' ? izq : der; texto = m ? `${METAL[m].sal}(aq) · 200 mL` : 'Vaso de 250 mL (vacío)'; }
    if (pieza === 'puente') texto = 'Puente salino · KNO₃ en agar';
    if (pieza === 'carga') texto = textoCarga;
    if (pieza === 'electrones') texto = revela ? 'Electrones por el cable: del ánodo al cátodo' : 'Electrones por el cable';
    rotulo.current(texto ? { texto, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  // rótulos con el botón «Rótulos» (≤ 8): mismas frases
  const rotulos = useMemo<RotuloQ9[]>(() => {
    if (!p.rotulos) return [];
    const r: RotuloQ9[] = [];
    if (izq) r.push({ id: 'vi', texto: rotuloVarilla(izq, 'izq'), ancla: [-COTAS.xVarilla, COTAS.yTopeVarilla + 0.16, 0] });
    if (der) r.push({ id: 'vd', texto: rotuloVarilla(der, 'der'), ancla: [COTAS.xVarilla, COTAS.yTopeVarilla + 0.16, 0] });
    if (izq) r.push({ id: 'si', texto: `${METAL[izq].sal}(aq)`, ancla: [-COTAS.xVaso, 0.22, BANCO.vaso.radioMax] });
    if (der) r.push({ id: 'sd', texto: `${METAL[der].sal}(aq)`, ancla: [COTAS.xVaso, 0.22, BANCO.vaso.radioMax] });
    if (puente) r.push({ id: 'pu', texto: 'Puente salino · KNO₃', ancla: [0.42, COTAS.yTecho + 0.07, 0.05] });
    r.push({ id: 'vo', texto: 'Voltímetro', ancla: [0, COTAS.altoElevador + COTAS.altoCaja + 0.02, COTAS.zMedidor] });
    r.push({ id: 'ca', texto: 'Caja de carga', ancla: [0, BORNE.com[1] + 0.13, BORNE.com[2]] });
    if (cables && anodo && puente) r.push({ id: 'el', texto: revela ? 'e⁻: ánodo → cátodo' : 'e⁻', ancla: [BORNE.com[0] - 0.36, BORNE.com[1] + 0.3, BORNE.com[2] + 0.36] });
    return r.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.rotulos, izq, der, puente, cables, revela, anodo]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  // varillas: cada metal es UNA varilla que viaja entre la gradilla y su vaso
  const metales: IdMetal[] = reto ? seedMetales.filter(esMetal) : [izq, der].filter(esMetal);
  const sinColocar = metales.filter((m) => m !== izq && m !== der);
  const destinoVarilla = (m: IdMetal): V3 => {
    if (m === izq) return [-COTAS.xVarilla, COTAS.ySuperficie, 0];
    if (m === der) return [COTAS.xVarilla, COTAS.ySuperficie, 0];
    const i = sinColocar.indexOf(m);
    return [GRADILLA[0] + (i - (sinColocar.length - 1) / 2) * 0.16, 0.035 + BANCO.hSumergidaCm / 10, GRADILLA[2]];
  };
  const circuito = !!anodo && puente && cables;
  // el encuadre se abre para la gradilla y el puente en reposo sólo mientras falte algo por montar
  const extendido = reto && (sinColocar.length > 0 || !puente);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara reto={extendido} reducido={reducido} encuadre={encuadre} />
      <Mesa mats={mats} />
      {/* vasos con su disolución (vacíos en el reto mientras no tengan electrodo) */}
      <group userData={{ pieza: 'vaso', lado: 'izq' }}>
        <VasoCelda x={-COTAS.xVaso} material={izq ? liqIzq : null} />
      </group>
      <group userData={{ pieza: 'vaso', lado: 'der' }}>
        <VasoCelda x={COTAS.xVaso} material={der ? liqDer : null} />
      </group>
      <BarraPortaelectrodo x={-COTAS.xVaso} mats={mats} />
      <BarraPortaelectrodo x={COTAS.xVaso} mats={mats} />
      {reto && <Gradilla mats={mats} />}
      {metales.map((m) => (
        <Movil key={m} destino={destinoVarilla(m)} reducido={reducido}>
          <Varilla metal={m} mats={mats} volumen={m === izq ? volIzq : m === der ? volDer : undefined} />
        </Movil>
      ))}
      {/* puente salino: en su sitio o tumbado delante */}
      <Movil destino={puente ? [0, COTAS.yTecho, 0] : REPOSO_PUENTE} giroX={puente ? 0 : Math.PI / 2} reducido={reducido} userData={{ pieza: 'puente' }}>
        <PuenteSalino mats={mats} />
        <IonesPuente reloj={reloj} animar={animar && puente} />
      </Movil>
      {/* voltímetro con la caja de carga */}
      <Voltimetro mats={mats} lectura={lectura} escala={escala} carga={carga} position={[0, 0, COTAS.zMedidor]} />
      {/* pinzas y cables de prueba */}
      <PinzaViva lado="izq" conectada={cables} mats={mats} salida={salidaIzq} reducido={reducido} />
      <PinzaViva lado="der" conectada={cables} mats={mats} salida={salidaDer} reducido={reducido} />
      <CableVivo salida={salidaIzq} borne={BORNE.com} material={mats.silNegro} />
      <CableVivo salida={salidaDer} borne={BORNE.v} material={mats.silRojo} />
      {/* el fenómeno */}
      <IonesVasos reloj={reloj} izq={izq} der={der} puente={puente} animar={animar} calidad={calidad} />
      <Electrones reloj={reloj} traza={traza} oculto={oculto} visible={circuito} animar={animar} />
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
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-q9="">
      {d.texto}
    </div>
  );
}

export default function Galvanic3DScene(props: Galvanic3DProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloQ9[]>([]);
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-q9="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 3, 8], fov: 32, near: 0.05, far: 200 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes calidad={calidad} />
          <Luces calidad={calidad} />
          <ControlesBanco objetivo={[0, 0.75, -0.3]} fondo="laboratorio"
            limites={{ minDistancia: 1.6, maxDistancia: 16, maxPolar: 1.45, minPolar: 0.15, paneo: true, cajaObjetivo: [[-2.5, 0, -1.6], [2.5, 2, 1.6]] }} />
          <Banco p={props} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} />
          <DiagnosticoDev reloj={props.reloj} calidad={calidad} />
          <AvisarListo onListo={props.onListo} />
          {alta && <Posproceso />}
        </KitContexto.Provider>
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      {/* rótulos fijos («Rótulos»): los coloca la escena cada cuadro, sin solaparse */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1420]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-q9={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
