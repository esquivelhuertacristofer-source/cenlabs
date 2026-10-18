"use client";
/**
 * MAT-09 · Sumas de Riemann — el banco de integración en 3D (R3F), 1 u = 1 cm.
 *
 *   Sobre un zócalo de grafito, la regla de aluminio es el eje x; en ella se apoyan las columnas
 *   de cristal de la regla elegida (izquierda, derecha, punto medio, trapecios o Simpson) y por
 *   delante pasa la curva f como tubo de neón. Entre cada techo y la curva, el error: franjas
 *   rayadas rojas donde la columna sobra y cian donde falta. Detrás, la placa de vidrio ahumado
 *   con la retícula grabada; a la derecha, la probeta donde se vierte el área de cada columna.
 *
 * RELOJ ÚNICO. `reloj.current.paso(dt)` corre aquí, en un useFrame de prioridad −1 (antes de
 * dibujar): decide alturas, barrido y nivel. Columnas, franjas, probeta, cuentas, el dock y la
 * barra de lecturas leen ese mismo estado en el mismo cuadro.
 *
 * NO REGALAR. La escena no escribe cifras. En el reto la probeta no lleva la marca de la integral
 * exacta hasta validar (y su escala es fija: no depende de la integral).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { KitContexto, ControlesBanco, type Calidad } from '../_kit';
import {
  ANCHO_PLOT, ALTO_PLOT, Y_BASE, X_IZQ, X_DER, Z_FRENTE, Z_CURVA, Z_PLACA, PLACA, MARCO, ZOCALO, X_POSTE_IZQ, X_POSTE_DER, ALTO_POSTE,
  X_PROBETA, Z_PROBETA, ALTO_ZOCALO, ALTO_REGLA,
} from './banco';
import { nodos as nodosRegla, COLOR_METODO, NOMBRE_METODO, type Metodo } from './riemann';
import type { ModoM9, RelojRiemann } from './reloj';
import {
  useMatsM9, texturaPlaca, texturaRegla, texturaProbeta, Soporte, Placa, Regla, Columnas, FranjasError, TuboNeon, Barrido, Probeta,
  puntosCurva, contarNormalesCero, texHalo, PROBETA, LARGO_REGLA, COLOR_SOBRA, COLOR_FALTA,
} from './piezas';

export interface Riemann3DProps {
  reloj: React.MutableRefObject<RelojRiemann>;
  modo: ModoM9;
  /** cambia cuando cambia la curva (otra función, o el reto): se rehacen neón y grabados */
  clave: string;
  metodo: Metodo;
  /** ¿se puede marcar la integral exacta en la probeta? (exploración, o reto validado) */
  revelaExacta: boolean;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** sube para volver al encuadre automático */
  encuadre: number;
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#05080b';
type V3 = [number, number, number];
export const COLOR_CURVA = '#9ff0ff';

/** Avisa una vez, tras unos cuadros pintados. */
function AvisarListo({ onListo }: { onListo?: () => void }) {
  const n = useRef(0);
  useFrame(() => {
    if (n.current > 3) return;
    n.current++;
    if (n.current === 3) onListo?.();
  });
  return null;
}

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    // fondo de estudio: degradado radial con un tramado mínimo (sin bandas)
    let tex: THREE.CanvasTexture | null = null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(256, 200, 10, 256, 250, 440);
      grad.addColorStop(0, '#1b2734'); grad.addColorStop(0.5, '#0d141c'); grad.addColorStop(1, FONDO);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      const img = g.getImageData(0, 0, 512, 512);
      let s = 9091;
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
    scene.fog = new THREE.Fog(FONDO, 280, 650);
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.55;
    return () => { scene.environment = null; scene.background = null; scene.fog = null; env.dispose(); pm.dispose(); tex?.dispose(); };
  }, [gl, scene, calidad]);
  return null;
}

function Luces({ calidad }: { calidad: Calidad }) {
  const clave = useRef<THREE.SpotLight>(null);
  const mapaS = calidad === 'alta' ? 2048 : 1024;
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    l.shadow.bias = -0.0003; l.shadow.normalBias = 0.04; l.shadow.radius = 7;
    l.shadow.camera.near = 60; l.shadow.camera.far = 340; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(0, 16, 0); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#b4c6d8', '#06090c', 0.3]} />
      {/* luz clave de estudio: foco cálido de penumbra ancha → charco de luz y sombras suaves */}
      <spotLight ref={clave} position={[-70, 150, 130]} angle={0.45} penumbra={0.9} decay={0} intensity={2.1} color="#fff1df" castShadow
        shadow-mapSize-width={mapaS} shadow-mapSize-height={mapaS} />
      {/* contraluces frías: recortan el marco, los postes y la probeta */}
      <directionalLight position={[80, 60, -90]} intensity={1.0} color="#cfe0ff" />
      <directionalLight position={[60, 30, 100]} intensity={0.28} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6; // ToneMappingMode.ACES_FILMIC de postprocessing
/** Bloom moderado sólo en lo que emite (neón, aristas encendidas, cuentas; HDR > 1) + ACES + viñeta. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.95} luminanceSmoothing={0.25} radius={0.6} levels={6} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number) {
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 1, 4000);
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
  let d = 150;
  for (let pasada = 0; pasada < 3; pasada++) {
    let lo = 20, hi = 1500;
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
  const el = THREE.MathUtils.degToRad(9), az = THREE.MathUtils.degToRad(-9);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
})();

/** Puntos que deben caber: zócalo (frente), placa, postes y probeta. */
export function puntosEncuadre(): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  for (const x of [ZOCALO.x0, ZOCALO.x1]) P.push(new THREE.Vector3(x, 0, ZOCALO.z + ZOCALO.fondo / 2));
  for (const x of [ZOCALO.x0, ZOCALO.x1]) P.push(new THREE.Vector3(x, ALTO_ZOCALO, ZOCALO.z - ZOCALO.fondo / 2));
  for (const x of [X_POSTE_IZQ, X_POSTE_DER]) P.push(new THREE.Vector3(x, ALTO_POSTE + 0.8, Z_PLACA));
  P.push(new THREE.Vector3(PLACA.cx, PLACA.y1 + MARCO.ancho, Z_PLACA));
  P.push(new THREE.Vector3(X_PROBETA, PROBETA.Y_BOCA + 0.3, Z_PROBETA));
  return P;
}
const OBJETIVO: V3 = [(ZOCALO.x0 + ZOCALO.x1) / 2, 20, 0];
/** Fracción de la pantalla que ocupa el banco: el estándar pide 55–70 % del alto. */
const MARGEN_X = 0.95, MARGEN_Y = 0.7;

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Camara({ reducido, encuadre }: { reducido: boolean; encuadre: number }) {
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
    if (ultimoEncuadre.current !== encuadre) { ultimoEncuadre.current = encuadre; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    const p = encuadrar(DIR_CAMARA, new THREE.Vector3(...OBJETIVO), puntosEncuadre(), camera.fov, aspecto, MARGEN_X, MARGEN_Y);
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, camera, reducido, encuadre]);
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

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;
export interface RotuloM9 { id: string; texto: string; ancla: () => V3 | null }

/** Proyecta las anclas (móviles) y coloca los <div> sin solaparse (≤ 8). */
function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloM9[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (rotulos.length === 0) return;
    const cajas: { x: number; y: number; w: number; h: number }[] = [];
    const lista = rotulos.slice(0, 8).map((r) => {
      const a = r.ancla();
      if (!a) return { r, x: 0, y: 0, z: 2 };
      v.set(...a).project(camera);
      return { r, x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, z: v.z };
    }).sort((a, b) => a.y - b.y);
    for (const it of lista) {
      const el = nodos.current.get(it.r.id); if (!el) continue;
      if (it.z >= 1) { el.style.opacity = '0'; continue; }
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

function DiagnosticoDev({ reloj, calidad }: { reloj: React.MutableRefObject<RelojRiemann>; calidad: Calidad }) {
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
  // prioridad NEGATIVA: con una prioridad > 0 r3f deja de dibujar solo y sin compositor el lienzo sale negro
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
    const w = window as unknown as { __mat09?: unknown };
    const pantalla = (x: number, y: number, z: number) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height };
    };
    w.__mat09 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj.current;
        return { modo: r.modo, curva: r.curva.id, metodo: r.metodo, fase: r.fase, auto: r.auto, lectura: r.lectura(), barrido: r.barrido, nVista: r.nVista, version: r.version };
      },
      /** fracción del lienzo que ocupa el banco (alto y ancho) */
      ocupacion() {
        let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
        for (const p of puntosEncuadre()) { const s = pantalla(p.x, p.y, p.z); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); }
        // y el área de trazado sola (placa)
        const a = pantalla(X_IZQ, Y_BASE, 0), b = pantalla(X_DER, Y_BASE + ALTO_PLOT, 0);
        return { alto: (y1 - y0) / size.height, ancho: (x1 - x0) / size.width, trazadoAlto: Math.abs(a.y - b.y) / size.height, lienzo: [size.width, size.height] };
      },
      aPantalla(x: number, y: number, z = Z_FRENTE) { return pantalla(x, y, z); },
      /** sólo desarrollo: adelanta el reloj `s` segundos simulados (las capturas en SwiftShader van a ~1 fps) */
      adelantar(s: number) { const r = reloj.current; const p = r.pausa; r.pausa = false; for (let t = 0; t < s; t += 1 / 30) r.paso(1 / 30); r.pausa = p; r.version++; return { n: r.n, fase: r.fase, nivel: r.nivel }; },
      /** sólo desarrollo: congela (o suelta) el reloj para fotografiar un estado */
      congelar(on: boolean) { reloj.current.pausa = on; reloj.current.version++; return reloj.current.fase; },
      /** sólo desarrollo: el reloj del modo activo (para llevarlo a un estado concreto) */
      reloj: () => reloj.current,
      escena: scene,
      renderer: gl,
    };
    return () => { delete w.__mat09; };
  }, [gl, scene, reloj, calidad, camera, size]);
  return null;
}

// ───────────────────────────── cuentas en los nodos (imperativas) ─────────────────────────────

const MAX_NODOS = 513;
/**
 * Cuentas en los puntos donde la regla evalúa f. Se rehacen cuando cambian las columnas; durante el
 * llenado aparecen al pasar el barrido. Sólo si hay sitio entre ellas (≥ 0,9 cm de escena).
 */
function CuentasNodos({ reloj }: { reloj: React.MutableRefObject<RelojRiemann> }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geoS = useMemo(() => new THREE.SphereGeometry(0.42, 18, 12), []);
  const matS = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: true }), []);
  const geoH = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_NODOS * 3), 3));
    g.setDrawRange(0, 0);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 20, 0), 80);
    return g;
  }, []);
  const matH = useMemo(() => new THREE.PointsMaterial({ map: texHalo(), color: '#ffffff', size: 3.2, sizeAttenuation: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  useEffect(() => () => { geoS.dispose(); matS.dispose(); geoH.dispose(); matH.dispose(); }, [geoS, matS, geoH, matH]);
  const cache = useRef<{ r: RelojRiemann | null; vc: number; xs: number[]; met: Metodo | null }>({ r: null, vc: -1, xs: [], met: null });
  const ultima = useRef<{ r: RelojRiemann | null; v: number }>({ r: null, v: -1 });
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const r = reloj.current, m = ref.current;
    if (!m) return;
    if (ultima.current.r === r && ultima.current.v === r.version) return;
    ultima.current = { r, v: r.version };
    const c = r.curva;
    if (cache.current.r !== r || cache.current.vc !== r.versionCols || cache.current.met !== r.metodo) {
      cache.current = { r, vc: r.versionCols, xs: nodosRegla(c, r.n, r.metodo), met: r.metodo };
      const col = new THREE.Color(COLOR_METODO[r.metodo]);
      // color saturado del método: sobre el neón casi blanco de la curva, una cuenta blanca no se vería
      matS.color.copy(col).multiplyScalar(1.25);
      matH.color.copy(col).multiplyScalar(1.1);
    }
    const xs = cache.current.xs;
    const paso = (ANCHO_PLOT * (c.b - c.a)) / Math.max(1, xs.length) / (c.b - c.a);
    const hay = paso >= 0.9;
    const l = r.lectura();
    const xMax = l.xBarrido ?? (r.fase === 'vaciar' ? -Infinity : Infinity);
    const sx = ANCHO_PLOT / (c.b - c.a), sy = ALTO_PLOT / c.yMax;
    const P = geoH.getAttribute('position') as THREE.BufferAttribute;
    let k = 0;
    if (hay) for (const x of xs) {
      if (x > xMax + 1e-9) break;
      if (k >= MAX_NODOS) break;
      const X = X_IZQ + (x - c.a) * sx, Y = Y_BASE + c.f(x) * sy;
      o.position.set(X, Y, Z_CURVA + 0.25); o.updateMatrix(); m.setMatrixAt(k, o.matrix);
      P.setXYZ(k, X, Y, Z_CURVA + 0.3);
      k++;
    }
    m.count = k; m.instanceMatrix.needsUpdate = true;
    P.needsUpdate = true; geoH.setDrawRange(0, k);
  });
  return (
    <group userData={{ pieza: 'nodos' }}>
      <instancedMesh ref={ref} args={[geoS, matS, MAX_NODOS]} frustumCulled={false} renderOrder={8} />
      <points geometry={geoH} material={matH} frustumCulled={false} renderOrder={9} raycast={() => null} />
    </group>
  );
}

// ───────────────────────────── el banco ─────────────────────────────

function Banco({ p, rotulo, publicarRotulos }: {
  p: Riemann3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloM9[]) => void;
}) {
  const { reloj, clave, calidad, reducido, encuadre, metodo, revelaExacta } = p;
  const mats = useMatsM9(calidad);
  const alta = calidad === 'alta';

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.current.paso(dt); }, -1);

  // ── lo que depende de la curva ──
  const curva = useMemo(() => reloj.current.curva, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  const ptsF = useMemo(() => puntosCurva(curva, alta ? 360 : 200, Z_CURVA), [curva, alta]);
  const texP = useMemo(() => texturaPlaca(curva, calidad), [curva, calidad]);
  const texR = useMemo(() => texturaRegla(curva, LARGO_REGLA - 0.3, ALTO_REGLA - 0.12, calidad), [curva, calidad]);
  const texE = useMemo(() => texturaProbeta(curva.escalaProbeta, calidad), [curva, calidad]);
  useEffect(() => () => { texP?.dispose(); texR?.dispose(); texE?.dispose(); }, [texP, texR, texE]);
  const color = COLOR_METODO[metodo];

  // ── rótulos al pasar el ratón ──
  const nombre = (pieza: string, e: ThreeEvent<PointerEvent>): string | null => {
    switch (pieza) {
      case 'curva': return `${curva.formula} · tubo de neón`;
      case 'columnas': return `Columna de cristal (${NOMBRE_METODO[metodo].toLowerCase()}): su área es la de la regla en ese tramo`;
      case 'franjas': {
        const g = (e.object as THREE.Mesh).geometry as THREE.BufferGeometry;
        const s = e.face ? (g.getAttribute('aSigno') as THREE.BufferAttribute | undefined)?.getX(e.face.a) ?? 0 : 0;
        return s > 0 ? 'Sobra: la columna rebasa la curva (cuenta de más)' : 'Falta: la curva rebasa la columna (área sin contar)';
      }
      case 'nodos': return metodo === 'trapecio' || metodo === 'simpson' ? 'Nodo xᵢ: donde la regla evalúa f' : 'x*: donde se evalúa f(x*) en cada tramo';
      case 'probeta': return 'Probeta: el área vertida, Σ de las columnas (u²)';
      case 'marca': return 'Marca de la integral exacta';
      case 'regla': return 'Regla de aluminio: el eje x';
      case 'placa': return 'Placa de vidrio ahumado con la retícula grabada';
      case 'soporte': return 'Soporte de aluminio y zócalo de grafito';
      default: return null;
    }
  };
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const t = o ? nombre(o.userData.pieza as string, e) : null;
    rotulo.current(t ? { texto: t, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  const rotulos = useMemo<RotuloM9[]>(() => {
    if (!p.rotulos) return [];
    const r = reloj;
    const sx = ANCHO_PLOT / (curva.b - curva.a), sy = ALTO_PLOT / curva.yMax;
    const X = (x: number) => X_IZQ + (x - curva.a) * sx, Y = (y: number) => Y_BASE + y * sy;
    /** la columna con más sobra (s = 1) o más falta (s = −1) en su centro */
    const extremo = (s: 1 | -1): V3 | null => {
      const k = r.current;
      let mejor = -1, val = 0.02 * curva.yMax;
      for (let i = 0; i < k.nVista; i++) {
        const xm = (k.vx0[i] + k.vx1[i]) / 2, d = s * (k.vqm[i] - curva.f(xm));
        if (d > val) { val = d; mejor = i; }
      }
      if (mejor < 0) return null;
      const xm = (k.vx0[mejor] + k.vx1[mejor]) / 2;
      return [X(xm), Y(Math.max(k.vqm[mejor], curva.f(xm))) + 0.6, Z_FRENTE];
    };
    const lista: RotuloM9[] = [
      { id: 'f', texto: curva.formula, ancla: () => [X(curva.a + 0.9 * (curva.b - curva.a)), Y(curva.f(curva.a + 0.9 * (curva.b - curva.a))) + 1.2, Z_CURVA] },
      { id: 'col', texto: 'columna · f(x*)·Δx', ancla: () => { const k = r.current; const i = Math.floor(k.nVista * 0.3); return k.nVista ? [X((k.vx0[i] + k.vx1[i]) / 2), Y_BASE + 2.2, Z_FRENTE] : null; } },
      { id: 'sobra', texto: 'sobra', ancla: () => extremo(1) },
      { id: 'falta', texto: 'falta', ancla: () => extremo(-1) },
      { id: 'probeta', texto: 'probeta · Σ vertida', ancla: () => [X_PROBETA, PROBETA.Y_BOCA + 1.0, Z_PROBETA] },
      { id: 'regla', texto: 'regla · eje x', ancla: () => [X_IZQ + 3, ALTO_ZOCALO + ALTO_REGLA * 0.3, Z_FRENTE + 1.2] },
      { id: 'placa', texto: 'vidrio grabado', ancla: () => [PLACA.x0 + 3.5, PLACA.y1 - 1.5, Z_PLACA] },
    ];
    if (revelaExacta) lista.push({ id: 'exacta', texto: '∫ exacta', ancla: () => [X_PROBETA + PROBETA.R_EXT + 0.6, Y_BASE + (curva.exacta / curva.escalaProbeta) * ALTO_PLOT, Z_PROBETA] });
    return lista.slice(0, 8);
  }, [p.rotulos, revelaExacta, curva, reloj]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  // zona del área de trazado para el ratón (las columnas instanciadas no se pueden «tocar»)
  const matInvisible = useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), []);
  useEffect(() => () => matInvisible.dispose(), [matInvisible]);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara reducido={reducido} encuadre={encuadre} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, 0]} receiveShadow material={mats.suelo}>
        <planeGeometry args={[900, 900]} />
      </mesh>
      <Soporte mats={mats} />
      <Placa tex={texP} mats={mats} />
      <Regla tex={texR} mats={mats} />
      <mesh position={[(X_IZQ + X_DER) / 2, Y_BASE + ALTO_PLOT / 2, Z_FRENTE - 0.2]} material={matInvisible} userData={{ pieza: 'columnas' }} renderOrder={-1}>
        <planeGeometry args={[ANCHO_PLOT, ALTO_PLOT]} />
      </mesh>
      <Columnas reloj={reloj} color={color} />
      <FranjasError reloj={reloj} visible />
      <TuboNeon key={`f${clave}${calidad}`} pts={ptsF} color={COLOR_CURVA} intensidad={2.2} calidad={calidad} zDerrame={Z_PLACA + 0.37} />
      <CuentasNodos reloj={reloj} />
      <Barrido reloj={reloj} color={color} />
      <Probeta reloj={reloj} mats={mats} color={color} escala={curva.escalaProbeta} texEscala={texE}
        exacta={revelaExacta ? curva.exacta : null} calidad={calidad} />
    </group>
  );
}

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[280px] rounded-md border border-white/15 bg-[#0b1220]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-m9="">
      {d.texto}
    </div>
  );
}

export const COLORES_ERROR = { sobra: COLOR_SOBRA, falta: COLOR_FALTA };

export default function Riemann3DScene(props: Riemann3DProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloM9[]>([]);
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-m9="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 40, 170], fov: 30, near: 1, far: 2000 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes calidad={calidad} />
          <Luces calidad={calidad} />
          <ControlesBanco objetivo={OBJETIVO} fondo="laboratorio"
            limites={{ minDistancia: 25, maxDistancia: 460, maxPolar: 1.5, minPolar: 0.25, paneo: true, cajaObjetivo: [[-45, 0, -20], [48, 60, 20]] }} />
          <Banco p={props} rotulo={rotulo} publicarRotulos={setLista} />
          <ProyectorRotulos rotulos={lista} nodos={nodos} />
          <DiagnosticoDev reloj={props.reloj} calidad={calidad} />
          <AvisarListo onListo={props.onListo} />
          {alta && <Posproceso />}
        </KitContexto.Provider>
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1420]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-m9={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
