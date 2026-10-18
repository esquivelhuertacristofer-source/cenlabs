"use client";
/**
 * MAT-06 · Transformaciones geométricas — el taller en 3D (R3F), 1 u = 1 cuadro de la rejilla.
 *
 *   Una placa de vidrio ahumado con la rejilla grabada, de pie sobre su zócalo. Delante,
 *   piezas de vidrio tintado con grosor real (la misma placa asimétrica del reto):
 *
 *   TALLER: la figura original (cian) y una copia (ámbar) que VIAJA a su imagen por el camino
 *   de la transformación: gira alrededor del pasador de latón, avanza por los rayos de la
 *   homotecia, se desliza en la traslación o se VOLTEA en la reflexión (medio giro en el
 *   espacio alrededor del eje: se ve su dorso violeta, la orientación invertida). Sobre el
 *   vidrio queda su sombra ortogonal, cuya matriz es la del dock: en la reflexión se
 *   estrecha hasta una línea (det = 0) y renace al revés. Los vértices A, B, C y el pivote P
 *   dejan su camino (arcos, rayos, segmentos perpendiculares al eje). En la composición dos
 *   copias siguen T·R y R·T y llegan a sitios distintos.
 *   RETO: la silueta objetivo grabada a trazos (sin cifras) y la placa del alumno con su T·R·S.
 *
 * RELOJ ÚNICO. `reloj.paso(dt)` corre aquí en un useFrame de prioridad −1 (antes de dibujar):
 * las piezas, la sombra, los caminos, el dock y la barra leen el mismo estado. Ningún
 * useFrame con prioridad > 0 (sin compositor el lienzo saldría negro).
 *
 * NO REGALAR. La escena no escribe cifras; en el reto sólo dibuja la silueta.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ControlesBanco, type Calidad } from '../_kit';
import {
  PIEZA, ORIGINAL, M_ORIGINAL, PUNTOS_CLAVE, aplicar, aplicar4, cajaDe, centroDe, centroide, det2, embeber,
  matrizEn, matrizFinal, mul, normalEje, pose3D, transformar, trs,
  type Mat3, type P2,
} from './transformaciones';
import type { ModoM6, RelojTransf } from './reloj';
import { RANGO, PLACA, GROSOR_PIEZA, HOVER, Z, cajaEncuadre } from './banco';
import { geometriaPieza, geometriaHuella, contarNormalesCero } from './geometria';
import {
  COLOR, rgb, useMatsM6, crearMatsPieza, tintarPieza, texturaPlaca, Placa, crearMatHuella, Haces, Cuentas, Pasador,
  type Haz, type Cuenta,
} from './piezas';

export interface ObjetivoM6 { tx: number; ty: number; rotacion: number; escala: number }
export interface Transformaciones3DProps {
  reloj: RelojTransf;
  modo: ModoM6;
  /** silueta del reto (sólo se dibuja su contorno) */
  objetivo: ObjetivoM6;
  /** reto acoplado y validado */
  exito: boolean;
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
const GRAD = Math.PI / 180;

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
      const grad = g.createRadialGradient(256, 200, 10, 256, 250, 430);
      grad.addColorStop(0, '#1b2734'); grad.addColorStop(0.5, '#0d141c'); grad.addColorStop(1, FONDO);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      const img = g.getImageData(0, 0, 512, 512);
      let s = 4242;
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
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.6;
    return () => { scene.environment = null; scene.background = null; env.dispose(); pm.dispose(); tex?.dispose(); };
  }, [gl, scene, calidad]);
  return null;
}

function Luces() {
  return (
    <>
      <hemisphereLight args={['#b4c6d8', '#06090c', 0.35]} />
      {/* luz clave de estudio arriba a la izquierda y contraluces frías que recortan el marco y el vidrio */}
      <spotLight position={[-48, 62, 42]} angle={0.5} penumbra={0.9} decay={0} intensity={2.2} color="#fff1df" />
      <directionalLight position={[40, 25, -30]} intensity={0.9} color="#cfe0ff" />
      <directionalLight position={[25, 10, 45]} intensity={0.35} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6; // ToneMappingMode.ACES_FILMIC de postprocessing
/** Bloom moderado sólo en lo que emite (haces, cuentas, cantos del vidrio) + ACES + viñeta. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.95} luminanceSmoothing={0.25} radius={0.55} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number) {
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 0.5, 2000);
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

const direccion = (azGrad: number, elGrad: number) => {
  const az = azGrad * GRAD, el = elGrad * GRAD;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
};
/** Taller: un poco de lado y desde arriba (se lee el grosor); reto: casi de frente (paralaje mínimo). */
const DIR = { explorar: direccion(-11, 9), reto: direccion(-4, 4) };
/** El cuadro de lo que importa ocupa ~66 % del alto del lienzo. */
const MARGEN_X = 0.93, MARGEN_Y = 0.66;

interface DefEncuadre { dir: THREE.Vector3; puntos: THREE.Vector3[]; centro: THREE.Vector3 }
const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Camara({ def, reducido, encuadre, clave }: { def: DefEncuadre; reducido: boolean; encuadre: number; clave: string }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const usuario = useRef(false);
  const primera = useRef(true);
  const meta = useRef<{ pos: THREE.Vector3; obj: THREE.Vector3 } | null>(null);
  const anim = useRef<{ p0: THREE.Vector3; o0: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    if (!controls) return;
    const f = () => { usuario.current = true; anim.current = null; };
    controls.addEventListener('start', f);
    return () => controls.removeEventListener('start', f);
  }, [controls]);
  const aspecto = size.width / Math.max(1, size.height);
  const ultimo = useRef({ encuadre, clave });
  useLayoutEffect(() => {
    if (!controls) return;
    // un cambio de modo o el botón de encuadre devuelven el mando al encuadre automático
    if (ultimo.current.encuadre !== encuadre || ultimo.current.clave !== clave) { ultimo.current = { encuadre, clave }; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    const vertical = aspecto < 1;
    const p = encuadrar(def.dir, def.centro, def.puntos, camera.fov, aspecto, vertical ? 0.95 : MARGEN_X, vertical ? 0.6 : MARGEN_Y);
    meta.current = { pos: p.pos, obj: p.objetivo };
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      anim.current = null;
      return;
    }
    anim.current = { p0: camera.position.clone(), o0: controls.target.clone(), t: 0 };
  }, [controls, aspecto, def, camera, reducido, encuadre, clave]);
  useFrame((_, dt) => {
    const a = anim.current, m = meta.current;
    if (!a || !m || !controls) return;
    a.t = Math.min(1, a.t + dt / 1.1);
    const e = facil(a.t);
    camera.position.lerpVectors(a.p0, m.pos, e);
    controls.target.lerpVectors(a.o0, m.obj, e);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;
export interface RotuloM6 { id: string; texto: string; ancla: () => V3 }

function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloM6[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (rotulos.length === 0) return;
    const cajas: { x: number; y: number; w: number; h: number }[] = [];
    const lista = rotulos.slice(0, 8).map((r) => {
      v.set(...r.ancla()).project(camera);
      return { r, x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, z: v.z };
    }).sort((a, b) => a.y - b.y);
    for (const it of lista) {
      const el = nodos.current.get(it.r.id); if (!el) continue;
      const dentro = it.z < 1 && it.x > 0 && it.x < size.width && it.y > 0 && it.y < size.height;
      el.style.opacity = dentro ? '1' : '0';
      if (!dentro) continue;
      const w = el.offsetWidth || 120, h = el.offsetHeight || 22;
      const x = Math.min(size.width - w - 4, Math.max(4, it.x - w / 2));
      let y = Math.max(40, it.y - h - 8);
      for (let k = 0; k < 12; k++) {
        const choca = cajas.find((c) => x < c.x + c.w + 4 && x + w + 4 > c.x && y < c.y + c.h + 3 && y + h + 3 > c.y);
        if (!choca) break;
        y = choca.y + choca.h + 4;
      }
      y = Math.min(size.height - h - 36, y);
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
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-m6="">
      {d.texto}
    </div>
  );
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function DiagnosticoDev({ reloj, calidad, def }: { reloj: RelojTransf; calidad: Calidad; def: DefEncuadre }) {
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
    const w = window as unknown as { __mat06?: unknown };
    w.__mat06 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const l = reloj.lectura();
        return { modo: reloj.modo, tipo: reloj.tipo, fase: reloj.fase, u: reloj.u, t: l.t, det: l.det, M: l.M, recorrido: reloj.recorrido, pausa: reloj.pausa, ciclos: reloj.ciclos, pose: reloj.pose, meta: reloj.meta };
      },
      /** fracción del alto y del ancho del lienzo que ocupa el cuadro de lo que importa */
      ocupacion() {
        const v = new THREE.Vector3();
        let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
        for (const p of def.puntos) { v.copy(p).project(camera); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); }
        return { alto: (y1 - y0) / 2, ancho: (x1 - x0) / 2, lienzo: [size.width, size.height] };
      },
      /** píxeles por unidad de la rejilla en el centro del encuadre */
      pxPorUnidad() {
        const a = def.centro.clone().setZ(0), b = a.clone().add(new THREE.Vector3(1, 0, 0));
        a.project(camera); b.project(camera);
        return ((b.x - a.x) / 2) * size.width;
      },
      /** sólo desarrollo: adelanta el reloj `s` segundos simulados (SwiftShader va a pocos fps) */
      adelantar(s: number) { for (let t = 0; t < s; t += 1 / 30) reloj.paso(1 / 30); return reloj.lectura().t; },
      /** sólo desarrollo (capturas): estación y punto del viaje, en pausa */
      fijar(tipo?: string, u?: number) {
        if (tipo) reloj.setTipo(tipo as Parameters<RelojTransf['setTipo']>[0]);
        if (typeof u === 'number') reloj.setAvance(u);
        return reloj.lectura().t;
      },
      escena: scene,
    };
    return () => { delete w.__mat06; };
  }, [gl, scene, reloj, calidad, camera, def, size]);
  return null;
}

// ───────────────────────────── el taller ─────────────────────────────

const N_CAMINO = 30;
const sinRayo = () => null;

/** Tramos de un polígono cerrado como haces. */
function contorno(hs: Haz[], pts: V3[], color: [number, number, number], ancho: number, rayas?: number) {
  for (let i = 0; i < pts.length; i++) hs.push({ a: pts[i], b: pts[(i + 1) % pts.length], rgb: color, ancho, rayas });
}
/** Flecha de a a b (cuerpo y dos barbas). */
function flecha(hs: Haz[], a: V3, b: V3, color: [number, number, number], ancho: number, rayas?: number) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  if (L < 0.3) return;
  const ux = dx / L, uy = dy / L, k = Math.min(0.55, L * 0.3);
  hs.push({ a, b, rgb: color, ancho, rayas });
  for (const s of [1, -1]) {
    const c = Math.cos(s * 0.45), sn = Math.sin(s * 0.45);
    const vx = -(ux * c - uy * sn) * k, vy = -(ux * sn + uy * c) * k;
    hs.push({ a: b, b: [b[0] + vx, b[1] + vy, b[2]], rgb: color, ancho });
  }
}

function Taller({ p, rotulo, publicarRotulos, nodos, def }: {
  p: Transformaciones3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloM6[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
  def: DefEncuadre;
}) {
  const { reloj, modo, objetivo, exito, calidad, reducido, encuadre } = p;
  const reto = modo === 'reto';
  const mats = useMatsM6(calidad);
  const tex = useMemo(() => texturaPlaca(calidad), [calidad]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.paso(dt); }, -1);
  // re-render cuando cambia la estación (pasadores, eje y rótulos)
  const [, setVer] = useState(0);
  const firma = useRef('');
  useEffect(() => reloj.suscribir(() => {
    const f = `${reloj.tipo}|${reloj.p.centro}`;
    if (f !== firma.current) { firma.current = f; setVer((v) => v + 1); }
  }), [reloj]);
  const tipo = reloj.tipo, prm = reloj.p;

  // ── piezas de vidrio ──
  const geoPieza = useMemo(() => geometriaPieza(GROSOR_PIEZA), []);
  const geoHuella = useMemo(() => geometriaHuella(), []);
  useEffect(() => () => { geoPieza.dispose(); geoHuella.dispose(); }, [geoPieza, geoHuella]);
  const matsOrig = useMemo(() => crearMatsPieza(COLOR.original, COLOR.original, 0.34), []);
  const matsImg = useMemo(() => crearMatsPieza(COLOR.imagen, COLOR.dorso, 0.5), []);
  const matsImg2 = useMemo(() => crearMatsPieza(COLOR.rama2, COLOR.dorso, 0.5), []);
  const hImg = useMemo(() => crearMatHuella(), []), hImg2 = useMemo(() => crearMatHuella(), []), hObj = useMemo(() => crearMatHuella(), []), hOrig = useMemo(() => crearMatHuella(), []);
  useEffect(() => () => { [...matsOrig, ...matsImg, ...matsImg2, hImg, hImg2, hObj, hOrig].forEach((m) => m.dispose()); }, [matsOrig, matsImg, matsImg2, hImg, hImg2, hObj, hOrig]);
  useEffect(() => { tintarPieza(matsImg, reto && exito ? COLOR.exito : COLOR.imagen); }, [matsImg, reto, exito]);

  const refOrig = useRef<THREE.Mesh>(null), refImg = useRef<THREE.Mesh>(null), refImg2 = useRef<THREE.Mesh>(null);
  const refHImg = useRef<THREE.Mesh>(null), refHImg2 = useRef<THREE.Mesh>(null), refHObj = useRef<THREE.Mesh>(null), refHOrig = useRef<THREE.Mesh>(null);
  const haces = useRef<Haz[]>([]);
  const cuentas = useRef<Cuenta[]>([]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);

  const hover = reto ? HOVER.reto : HOVER.explorar;
  const centro = centroDe(prm);
  const conCentro = !reto && (tipo === 'rotacion' || tipo === 'homotecia' || tipo === 'composicion');

  useFrame(() => {
    const l = reloj.lectura();
    const hs: Haz[] = [];
    const cs: Cuenta[] = [];
    const zF = hover + GROSOR_PIEZA / 2 + 0.005;           // cara de delante de una pieza en reposo
    const colA = (id: string) => COLOR[id as 'A' | 'B' | 'C' | 'P'];
    const poner = (ref: React.RefObject<THREE.Mesh | null>, arr: number[] | null) => {
      const m = ref.current; if (!m) return;
      m.visible = !!arr;
      if (arr) { m4.fromArray(arr); m.matrix.copy(m4); m.matrixWorldNeedsUpdate = true; }
    };
    const huella = (ref: React.RefObject<THREE.Mesh | null>, mat: THREE.MeshBasicMaterial, M: Mat3 | null, color: string, k: number) => {
      const m = ref.current; if (!m) return;
      m.visible = !!M;
      if (!M) return;
      m4.fromArray(embeber(M, Z.huella)); m.matrix.copy(m4); m.matrixWorldNeedsUpdate = true;
      mat.color.set(color).multiplyScalar(k);
    };
    /** Vértices de la cara de delante de una pieza con pose 3D. */
    const caraDe = (pose: number[]): V3[] => PIEZA.map(([x, y]) => aplicar4(pose, x, y, GROSOR_PIEZA / 2 + 0.005));

    if (reto) {
      const M = l.M;
      const pose = embeber(M, hover);
      poner(refImg, pose); poner(refImg2, null); poner(refOrig, null);
      const Mobj = trs(objetivo.tx, objetivo.ty, objetivo.rotacion, objetivo.escala);
      huella(refHObj, hObj, Mobj, COLOR.objetivo, 0.2);
      huella(refHImg, hImg, M, exito ? COLOR.exito : COLOR.imagen, 0.3);
      huella(refHImg2, hImg2, null, '#000', 0); huella(refHOrig, hOrig, null, '#000', 0);
      // silueta objetivo grabada a trazos (sin cifras)
      contorno(hs, transformar(Mobj, PIEZA).map(([x, y]) => [x, y, Z.haz] as V3), rgb(COLOR.objetivo, 0.8), 0.03, 0.62);
      // aristas de la placa del alumno
      contorno(hs, caraDe(pose), rgb(exito ? COLOR.exito : COLOR.imagen, 1.5), 0.05);
      for (const q of l.puntos) {
        const [x, y] = q.ahora;
        cs.push({ p: [x, y, zF + 0.04], color: colA(q.id), radio: q.id === 'P' ? 0.15 : 0.12, brillo: q.id === 'P' ? 1.6 : 1.9 });
      }
    } else {
      const t = l.t;
      const comp = tipo === 'composicion';
      const pose0 = pose3D(tipo, prm, t, M_ORIGINAL, hover, 0);
      const pose1 = comp ? pose3D(tipo, prm, t, M_ORIGINAL, hover, 1) : null;
      poner(refOrig, embeber(M_ORIGINAL, hover));
      poner(refImg, pose0); poner(refImg2, pose1);
      // sombras ortogonales: su matriz es la del dock (det con signo → color)
      const S0 = mul(l.M, M_ORIGINAL);
      huella(refHImg, hImg, S0, l.det >= 0 ? COLOR.imagen : COLOR.dorso, 0.34 * Math.min(1, 0.25 + Math.abs(l.det)));
      huella(refHImg2, hImg2, l.M2 ? mul(l.M2, M_ORIGINAL) : null, COLOR.rama2, 0.3);
      huella(refHOrig, hOrig, M_ORIGINAL, COLOR.original, 0.16);
      huella(refHObj, hObj, null, '#000', 0);

      // contornos: original (cian), destino a trazos y la pieza que viaja
      contorno(hs, ORIGINAL.map(([x, y]) => [x, y, zF] as V3), rgb(COLOR.original, 1.0), 0.04);
      const destino = transformar(matrizFinal(tipo, prm, 0), ORIGINAL);
      contorno(hs, destino.map(([x, y]) => [x, y, Z.haz] as V3), rgb(COLOR.imagen, 0.5), 0.026, 0.5);
      contorno(hs, caraDe(pose0), rgb(COLOR.imagen, 1.25), 0.045);
      if (comp && pose1) {
        const destino2 = transformar(matrizFinal(tipo, prm, 1), ORIGINAL);
        contorno(hs, destino2.map(([x, y]) => [x, y, Z.haz] as V3), rgb(COLOR.rama2, 0.5), 0.026, 0.5);
        contorno(hs, caraDe(pose1), rgb(COLOR.rama2, 1.25), 0.045);
      }

      // caminos de los vértices clave hasta este instante (en la reflexión, el de su sombra)
      const zCam = tipo === 'reflexion' ? Z.haz : zF;
      const ramas: (0 | 1)[] = comp ? [0, 1] : [0];
      for (const rama of ramas) {
        // en la composición, sólo el camino del pivote de cada rama (ocho caminos se enredan)
        for (const q of comp ? l.puntos.filter((x) => x.id === 'P') : l.puntos) {
          let prev: V3 | null = null;
          const n = Math.max(1, Math.ceil(N_CAMINO * t));
          for (let i = 0; i <= n; i++) {
            const s = (t * i) / n;
            const [x, y] = aplicar(matrizEn(tipo, prm, s, rama), q.orig);
            const pt: V3 = [x, y, zCam];
            if (prev) hs.push({ a: prev, b: pt, rgb: comp ? rgb(rama ? COLOR.rama2 : COLOR.imagen, 0.9) : rgb(colA(q.id), 0.85), ancho: comp ? 0.035 : 0.03 });
            prev = pt;
          }
        }
      }

      // lo que define la transformación: centro, eje, vector o rayos
      if (tipo === 'rotacion' || (comp && t > 0)) {
        // radios del centro al pivote, antes y ahora: el ángulo girado
        const P0 = l.puntos.find((q) => q.id === 'P')!;
        hs.push({ a: [centro[0], centro[1], zCam], b: [P0.orig[0], P0.orig[1], zCam], rgb: rgb('#ffffff', 0.35), ancho: 0.025, rayas: 0.3 });
        if (tipo === 'rotacion') hs.push({ a: [centro[0], centro[1], zCam], b: [P0.ahora[0], P0.ahora[1], zCam], rgb: rgb('#ffffff', 0.6), ancho: 0.03 });
      }
      if (tipo === 'homotecia') {
        const Mf = matrizFinal(tipo, prm);
        for (const q of l.puntos) {
          if (q.id === 'P') continue;
          const img = aplicar(Mf, q.orig);
          // el rayo pasa por el centro, el vértice original y su imagen
          const lejos = Math.hypot(img[0] - centro[0], img[1] - centro[1]) > Math.hypot(q.orig[0] - centro[0], q.orig[1] - centro[1]) ? img : q.orig;
          const otro = lejos === img ? q.orig : img;
          const ext = (a: P2, b: P2, f: number): V3 => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, Z.haz];
          hs.push({ a: [centro[0], centro[1], Z.haz], b: ext(centro, lejos, 1.08), rgb: rgb(COLOR.rayo, 0.55), ancho: 0.025 });
          // con k < 0 el otro extremo queda al otro lado del centro
          hs.push({ a: [centro[0], centro[1], Z.haz], b: [otro[0], otro[1], Z.haz], rgb: rgb(COLOR.rayo, 0.55), ancho: 0.025 });
        }
      }
      if (tipo === 'reflexion') {
        const [nx, ny] = normalEje(prm.alfa);
        const ux = ny, uy = -nx;               // dirección del eje
        // recorta el eje a la placa
        let L = Infinity;
        if (Math.abs(ux) > 1e-9) L = Math.min(L, (RANGO + 0.4) / Math.abs(ux));
        if (Math.abs(uy) > 1e-9) L = Math.min(L, (RANGO + 0.4) / Math.abs(uy));
        hs.push({ a: [-ux * L, -uy * L, Z.haz], b: [ux * L, uy * L, Z.haz], rgb: rgb(COLOR.eje, 1.5), ancho: 0.05 });
      }
      if (tipo === 'traslacion') {
        const P0 = l.puntos.find((q) => q.id === 'P')!;
        flecha(hs, [P0.orig[0], P0.orig[1], zF], [P0.ahora[0], P0.ahora[1], zF], rgb(COLOR.vector, 1.3), 0.04);
      }
      if (comp && l.u >= 0.999) {
        // las dos llegadas no coinciden: T·R ≠ R·T
        const P0 = l.puntos.find((q) => q.id === 'P')!;
        if (P0.ahora2) flecha(hs, [P0.ahora[0], P0.ahora[1], zF], [P0.ahora2[0], P0.ahora2[1], zF], rgb(COLOR.vector, 1.0), 0.03, 0.3);
      }

      // cuentas de los vértices clave de la(s) pieza(s) que viajan
      const conCuentas = (pose: number[], b: number) => {
        for (const k of PUNTOS_CLAVE) {
          const [x, y] = k.p;
          cs.push({ p: aplicar4(pose, x, y, GROSOR_PIEZA / 2 + 0.06), color: colA(k.id), radio: k.id === 'P' ? 0.15 : 0.12, brillo: b });
        }
      };
      conCuentas(pose0, 1.9);
      if (pose1) conCuentas(pose1, 1.6);
    }
    haces.current = hs;
    cuentas.current = cs;
  });

  // ── rótulos ──
  const nombre = (pieza: string): string | null => {
    switch (pieza) {
      case 'placa': return 'Placa de vidrio grabada · 1 cuadro = 1 unidad';
      case 'original': return 'Figura original';
      case 'imagen': return reto ? 'Tu placa: M = T·R·S aplicada a la pieza' : 'Imagen: la figura transformada por M';
      case 'imagen2': return 'Imagen por R·T (primero traslada, luego gira)';
      case 'centro': return `Centro ${prm.centro === 'C' ? 'C' : 'O'} (pasador de latón)`;
      case 'objetivo': return 'Silueta objetivo: grabada, sin cifras';
      default: return null;
    }
  };
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const t = o ? nombre(o.userData.pieza as string) : null;
    rotulo.current(t ? { texto: t, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  const rotulos = useMemo<RotuloM6[]>(() => {
    if (!p.rotulos) return [];
    const zF = hover + GROSOR_PIEZA / 2;
    const arriba = (pts: readonly P2[]): V3 => { const c = cajaDe(pts); return [(c.x0 + c.x1) / 2, c.y1 + 0.25, zF]; };
    if (reto) {
      return [
        { id: 'obj', texto: 'Silueta objetivo', ancla: () => arriba(transformar(trs(objetivo.tx, objetivo.ty, objetivo.rotacion, objetivo.escala), PIEZA)) },
        { id: 'tu', texto: 'Tu placa', ancla: () => arriba(transformar(reloj.matriz(0), PIEZA)) },
        { id: 'pl', texto: 'Placa grabada', ancla: () => [RANGO - 2, -RANGO + 1.2, 0] },
      ];
    }
    const lista: RotuloM6[] = [
      { id: 'or', texto: 'Figura original', ancla: () => arriba(ORIGINAL) },
      { id: 'im', texto: tipo === 'composicion' ? 'T·R' : 'Imagen', ancla: () => arriba(transformar(matrizFinal(tipo, prm, 0), ORIGINAL)) },
    ];
    if (tipo === 'composicion') lista.push({ id: 'im2', texto: 'R·T', ancla: () => arriba(transformar(matrizFinal(tipo, prm, 1), ORIGINAL)) });
    if (conCentro) lista.push({ id: 'ce', texto: `Centro ${prm.centro}`, ancla: () => [centro[0], centro[1] - 0.7, 0.6] });
    if (tipo === 'reflexion') {
      const [nx, ny] = normalEje(prm.alfa);
      lista.push({ id: 'ej', texto: 'Eje de reflexión', ancla: () => [ny * 6.5, -nx * 6.5, Z.haz] });
    }
    return lista.slice(0, 8);
  }, [p.rotulos, reto, tipo, prm, objetivo, hover, reloj, conCentro, centro]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara def={def} reducido={reducido} encuadre={encuadre} clave={modo} />
      <Placa tex={tex} mats={mats} />
      {/* sombras ortogonales sobre el vidrio */}
      <mesh ref={refHOrig} raycast={sinRayo} geometry={geoHuella} material={hOrig} matrixAutoUpdate={false} frustumCulled={false} renderOrder={2} visible={false} />
      <mesh ref={refHObj} geometry={geoHuella} material={hObj} matrixAutoUpdate={false} frustumCulled={false} renderOrder={2} visible={false} userData={{ pieza: 'objetivo' }} />
      <mesh ref={refHImg} raycast={sinRayo} geometry={geoHuella} material={hImg} matrixAutoUpdate={false} frustumCulled={false} renderOrder={2} visible={false} />
      <mesh ref={refHImg2} raycast={sinRayo} geometry={geoHuella} material={hImg2} matrixAutoUpdate={false} frustumCulled={false} renderOrder={2} visible={false} />
      {/* piezas de vidrio */}
      <mesh ref={refOrig} geometry={geoPieza} material={matsOrig} matrixAutoUpdate={false} frustumCulled={false} renderOrder={3} visible={false} userData={{ pieza: 'original' }} />
      <mesh ref={refImg2} geometry={geoPieza} material={matsImg2} matrixAutoUpdate={false} frustumCulled={false} renderOrder={4} visible={false} userData={{ pieza: 'imagen2' }} />
      <mesh ref={refImg} geometry={geoPieza} material={matsImg} matrixAutoUpdate={false} frustumCulled={false} renderOrder={5} visible={false} userData={{ pieza: 'imagen' }} />
      {conCentro && <Pasador mats={mats} position={[centro[0], centro[1], 0]} userData={{ pieza: 'centro' }} />}
      <Haces fuente={haces} />
      <Cuentas fuente={cuentas} />
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} />
    </group>
  );
}

/** Lo que el encuadre debe enseñar: original + imagen(es) + centro (taller) o pieza + silueta (reto). */
function defEncuadre(reloj: RelojTransf, modo: ModoM6, objetivo: ObjetivoM6): DefEncuadre {
  let caja;
  if (modo === 'reto') {
    caja = cajaDe(PIEZA);
    caja = cajaDe(transformar(trs(objetivo.tx, objetivo.ty, objetivo.rotacion, objetivo.escala), PIEZA), caja);
    caja = cajaEncuadre(caja, [[0, 0]]);
  } else {
    const tipo = reloj.tipo, prm = reloj.p;
    caja = cajaDe(ORIGINAL);
    caja = cajaDe(transformar(matrizFinal(tipo, prm, 0), ORIGINAL), caja);
    if (tipo === 'composicion') caja = cajaDe(transformar(matrizFinal(tipo, prm, 1), ORIGINAL), caja);
    const extra: P2[] = tipo === 'rotacion' || tipo === 'homotecia' || tipo === 'composicion' ? [centroDe(prm)] : [];
    caja = cajaEncuadre(caja, extra);
  }
  const puntos = [
    new THREE.Vector3(caja.x0, caja.y0, 0), new THREE.Vector3(caja.x1, caja.y0, 0),
    new THREE.Vector3(caja.x0, caja.y1, 0), new THREE.Vector3(caja.x1, caja.y1, 0),
  ];
  const c = centroide([[caja.x0, caja.y0], [caja.x1, caja.y1]]);
  return { dir: modo === 'reto' ? DIR.reto : DIR.explorar, puntos, centro: new THREE.Vector3(c[0], c[1], 0) };
}

export default function Transformaciones3DScene(props: Transformaciones3DProps) {
  const { calidad, reloj, modo, objetivo } = props;
  const alta = calidad === 'alta';
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloM6[]>([]);
  // el encuadre cambia con la estación, sus mandos y la silueta del reto
  const [firma, setFirma] = useState('');
  const calcular = useCallback(() => `${modo}|${reloj.tipo}|${JSON.stringify(reloj.p)}|${objetivo.tx}|${objetivo.ty}|${objetivo.rotacion}|${objetivo.escala}`, [modo, reloj, objetivo]);
  useEffect(() => {
    setFirma(calcular());
    return reloj.suscribir(() => { const f = calcular(); setFirma((v) => (v === f ? v : f)); });
  }, [reloj, calcular]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const def = useMemo(() => defEncuadre(reloj, modo, objetivo), [firma]);
  const dprMedia = typeof window !== 'undefined' ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-m6="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        dpr={alta ? [1, 2] : [dprMedia, dprMedia]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 4, 40], fov: 30, near: 0.5, far: 2000 }}
        onPointerMissed={() => rotulo.current(null)}
      >
        <Ajustes calidad={calidad} />
        <Luces />
        <ControlesBanco objetivo={[0, 0, 0]} fondo="pizarron"
          limites={{ minDistancia: 6, maxDistancia: 120, maxPolar: Math.PI * 0.82, minPolar: Math.PI * 0.18, paneo: true, cajaObjetivo: [[-12, -12, -2], [12, 12, 4]] }} />
        <Taller p={props} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} def={def} />
        <DiagnosticoDev reloj={reloj} calidad={calidad} def={def} />
        <AvisarListo onListo={props.onListo} />
        {alta && <Posproceso />}
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1420]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-m6={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}

