"use client";
/**
 * MAT-08 · La derivada — el banco de trazado en 3D (R3F), 1 u = 1 cm.
 *
 *   Dos placas de vidrio ahumado grabado sobre un soporte de aluminio, con el MISMO eje
 *   horizontal: arriba la curva f como tubo de neón cian; abajo, f′. Sobre la curva, P y
 *   Q separados por h; la secante PQ (haz ámbar) con sus catetos h y Δf, y la tangente
 *   (haz magenta). El trazador magenta de la placa de abajo está a la altura f′(x₀) y,
 *   cuando x₀ recorre la curva, deja la traza de f′: la derivada sale de la función.
 *   En el reto, a la derecha, el cohete sube por su torre a la altura s(t) de la curva.
 *
 * RELOJ ÚNICO. `reloj.current.paso(dt)` corre aquí, en un useFrame de prioridad −1 (antes
 * de dibujar): mueve x₀ y h. Las cuentas, los haces, la máscara del neón de f′, el cohete,
 * el dock y la barra de lecturas leen ese mismo estado en el mismo cuadro.
 *
 * NO REGALAR. La escena no escribe cifras. En el reto, v(t) (el neón de abajo), la marca
 * de inflexión y la recta t* sólo aparecen tras validar.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { KitContexto, ControlesBanco, type Calidad } from '../_kit';
import { G_ESTANDAR } from './derivada';
import {
  PLACA_F, PLACA_D, Z_TRAZO, Z_GRABADO, ALTO_ZOCALO, ZOCALO, X_POSTE, X_POSTE_IZQ, ALTO_POSTE, X_TORRE, ALTO_TORRE,
  mapa, recortarRecta, type Mapa,
} from './banco';
import { N_BINS, MAX_MEDICIONES, type ModoM8, type RelojDerivada } from './reloj';
import {
  useMatsM8, texturaGrabado, PlacaGrabada, Soporte, TuboNeon, Haces, Cuenta, Marca, Cohete, TorreLanzamiento, LARGO_COHETE, ESCALA_COHETE,
  crearMascara, escribirMascara, puntosCurva, contarNormalesCero, type Haz, type MandoNeon,
} from './piezas';

export interface Derivadas3DProps {
  reloj: React.MutableRefObject<RelojDerivada>;
  modo: ModoM8;
  /** cambia cuando cambia la curva (otra función u otro cohete): se rehacen tubos y grabados */
  clave: string;
  /** reto validado: se pueden nombrar t* y v(t) */
  validado: boolean;
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

/** Colores de la escena (lineales ×intensidad para los haces): cian f, ámbar secante, magenta tangente/f′. */
export const COLOR = { f: '#38d9f5', secante: '#ffb43a', tangente: '#ff4fa3', critico: '#9ff5cf', inflexion: '#c9a7ff', cohete: '#7fe3ff' };
const lin = (hex: string, k: number): [number, number, number] => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const RGB = {
  tangente: lin(COLOR.tangente, 1.7), secante: lin(COLOR.secante, 1.8), cateto: lin(COLOR.secante, 0.75),
  guia: lin(COLOR.tangente, 0.42), altura: lin(COLOR.cohete, 0.5), tStar: lin(COLOR.inflexion, 0.9),
};

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
      const grad = g.createRadialGradient(256, 190, 10, 256, 240, 430);
      grad.addColorStop(0, '#1a2633'); grad.addColorStop(0.5, '#0d141c'); grad.addColorStop(1, FONDO);
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
    scene.fog = new THREE.Fog(FONDO, 260, 620);
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
    l.shadow.camera.near = 60; l.shadow.camera.far = 320; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(0, 20, 0); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#b4c6d8', '#06090c', 0.3]} />
      {/* luz clave de estudio: foco cálido de penumbra ancha → charco de luz y sombras suaves en el suelo */}
      <spotLight ref={clave} position={[-70, 150, 120]} angle={0.42} penumbra={0.9} decay={0} intensity={2.1} color="#fff1df" castShadow
        shadow-mapSize-width={mapaS} shadow-mapSize-height={mapaS} />
      {/* contraluces frías: recortan el marco y los postes */}
      <directionalLight position={[80, 60, -90]} intensity={1.0} color="#cfe0ff" />
      <directionalLight position={[60, 30, 100]} intensity={0.28} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6; // ToneMappingMode.ACES_FILMIC de postprocessing
/** Bloom moderado sólo en lo que emite (neón, haces y cuentas, HDR > 1) + ACES + viñeta. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.95} luminanceSmoothing={0.25} radius={0.62} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.58} />
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
  const el = THREE.MathUtils.degToRad(8), az = THREE.MathUtils.degToRad(-8);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
})();

/** Puntos que deben caber: zócalo, postes y (en el reto) la torre. */
export function puntosEncuadre(reto: boolean): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  for (const x of [ZOCALO.x0, ZOCALO.x1]) for (const z of [-ZOCALO.fondo / 2, ZOCALO.fondo / 2]) P.push(new THREE.Vector3(x, 0, z));
  for (const x of [X_POSTE_IZQ, X_POSTE]) P.push(new THREE.Vector3(x, ALTO_POSTE + 0.8, 0));
  P.push(new THREE.Vector3(PLACA_F.cx, PLACA_F.cy + PLACA_F.h / 2 + 1.1, 1));
  if (reto) { P.push(new THREE.Vector3(X_TORRE + 2.8, ALTO_TORRE, -1.0)); P.push(new THREE.Vector3(X_TORRE + 4.2, 0, 2.2)); }
  return P;
}
const OBJETIVO: V3 = [0, 30, 0];
/** Fracción del alto (y del ancho) de la pantalla que ocupa el banco: el estándar pide 55–70 % del alto. */
const MARGEN_X = 0.92, MARGEN_Y = 0.68;

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
    if (ultimoEncuadre.current !== encuadre) { ultimoEncuadre.current = encuadre; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    const p = encuadrar(DIR_CAMARA, new THREE.Vector3(...OBJETIVO), puntosEncuadre(reto), camera.fov, aspecto, MARGEN_X, MARGEN_Y);
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, reto, camera, reducido, encuadre]);
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
export interface RotuloM8 { id: string; texto: string; ancla: () => V3 }

/** Proyecta las anclas (móviles) y coloca los <div> sin solaparse (≤ 8). */
function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloM8[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
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
      el.style.opacity = it.z < 1 ? '1' : '0';
    }
  });
  return null;
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function DiagnosticoDev({ reloj, calidad, reto, mapaRef }: { reloj: React.MutableRefObject<RelojDerivada>; calidad: Calidad; reto: boolean; mapaRef: React.MutableRefObject<Mapa> }) {
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
    const w = window as unknown as { __mat08?: unknown };
    const pantalla = (x: number, y: number, z: number) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return { x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height };
    };
    w.__mat08 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj.current;
        return { modo: r.modo, curva: r.curva.id, formula: r.curva.formula, fase: r.fase, lectura: r.lectura(), recorrido: r.recorrido, hAuto: r.hAuto, vuelo: r.vuelo, trazado: r.fraccionTrazada(), mediciones: r.mediciones.length, revelado: r.revelado, version: r.version };
      },
      /** fracción del lienzo que ocupa el banco (alto y ancho) */
      ocupacion() {
        let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
        for (const p of puntosEncuadre(reto)) { const s = pantalla(p.x, p.y, p.z); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y); x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); }
        return { alto: (y1 - y0) / size.height, ancho: (x1 - x0) / size.width, lienzo: [size.width, size.height] };
      },
      /** píxel (CSS, relativo al lienzo) de un punto de la curva: x de la función, y de f */
      aPantalla(x: number, y: number, z = Z_TRAZO) { return pantalla(x, y, z); },
      punto(xf: number, yf: number) { const M = mapaRef.current; return pantalla(M.X(xf), M.YF(yf), Z_TRAZO); },
      /** sólo desarrollo: adelanta el reloj `s` segundos simulados (las capturas en SwiftShader van a ~1 fps) */
      adelantar(s: number) { const r = reloj.current; for (let t = 0; t < s; t += 1 / 30) r.paso(1 / 30); return { x0: r.x0, fase: r.fase, trazado: r.fraccionTrazada() }; },
      escena: scene,
      renderer: gl,
    };
    return () => { delete w.__mat08; };
  }, [gl, scene, reloj, calidad, camera, size, reto, mapaRef]);
  return null;
}

// ───────────────────────────── el banco ─────────────────────────────

function Banco({ p, rotulo, publicarRotulos, nodos, mapaRef }: {
  p: Derivadas3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloM8[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
  mapaRef: React.MutableRefObject<Mapa>;
}) {
  const { reloj, modo, clave, calidad, reducido, encuadre, validado } = p;
  const reto = modo === 'reto';
  const mats = useMatsM8(calidad);
  const alta = calidad === 'alta';

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.current.paso(dt); }, -1);

  // ── lo que depende de la curva ──
  const curva = useMemo(() => reloj.current.curva, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  const rangos = useMemo(() => reloj.current.rangos, [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  const M = useMemo(() => mapa(rangos), [rangos]);
  mapaRef.current = M;
  const [a, b] = curva.dominio;
  const n = alta ? 360 : 200;
  const ptsF = useMemo(() => puntosCurva(curva.f, a, b, n, M.X, M.YF, Z_TRAZO), [curva, a, b, n, M]);
  const ptsD = useMemo(() => puntosCurva(curva.d1, a, b, n, M.X, M.YD, Z_TRAZO), [curva, a, b, n, M]);
  const vx = curva.v === 't' ? 't (s)' : 'x';
  const texF = useMemo(() => texturaGrabado(PLACA_F, rangos.x, rangos.f, { x: vx, y: reto ? 's (m)' : 'f(x)' }, calidad), [rangos, vx, reto, calidad]);
  const texD = useMemo(() => texturaGrabado(PLACA_D, rangos.x, rangos.d, { x: vx, y: reto ? 'v (m/s)' : "f '(x)" }, calidad), [rangos, vx, reto, calidad]);
  useEffect(() => () => { texF?.dispose(); texD?.dispose(); }, [texF, texD]);

  // máscara del neón de f′: las casillas por donde pasó el trazador (o lo revelado tras validar)
  const mascara = useMemo(() => crearMascara(N_BINS), []);
  useEffect(() => () => mascara.dispose(), [mascara]);
  const versionTraza = useRef(-1);
  const mandoD = useRef<MandoNeon>({ alfa: 1 });

  // ── piezas móviles ──
  const refP = useRef<THREE.Group>(null), refQ = useRef<THREE.Group>(null), refQm = useRef<THREE.Group>(null), refPluma = useRef<THREE.Group>(null);
  const refCohete = useRef<THREE.Group>(null);
  const empuje = useRef(1);
  const haces = useRef<Haz[]>([]);
  const criticos = reloj.current.criticos, inflex = reloj.current.inflexiones;
  const refsMarcas = useRef<(THREE.Group | null)[]>([]);
  const refsMed = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    const r = reloj.current, c = r.curva, l = r.lectura();
    if (r.versionTraza !== versionTraza.current) { versionTraza.current = r.versionTraza; escribirMascara(mascara, r.visitado); }
    mandoD.current.alfa = r.desvanecer;
    const F = PLACA_F, z = Z_TRAZO;
    const P: V3 = [M.X(l.x0), M.YF(l.fx), z];
    const cen = l.metodo === 'centrada';
    const xq = l.x0 + l.h;
    const Q: V3 = cen ? [M.X(l.x0 + l.hAbs), M.YF(c.f(l.x0 + l.hAbs)), z] : [M.X(xq), M.YF(l.fP), z];
    const Qm: V3 = [M.X(l.x0 - l.hAbs), M.YF(l.fM), z];
    const pluma: V3 = [M.X(l.x0), M.YD(l.d1), z];
    refP.current?.position.set(...P);
    refQ.current?.position.set(...Q);
    if (refQm.current) { refQm.current.visible = cen; refQm.current.position.set(...Qm); }
    refPluma.current?.position.set(...pluma);

    const hs: Haz[] = [];
    // tangente: pendiente f′(x₀) en las unidades de la escena
    const tg = recortarRecta(P[0], P[1], (l.d1 * M.sf) / M.sx, F.x0, F.x1, F.y0, F.y1);
    if (tg) hs.push({ a: [tg[0][0], tg[0][1], z], b: [tg[1][0], tg[1][1], z], rgb: RGB.tangente, ancho: 0.07 });
    // secante: por P y Q (o por Q₋ y Q₊ en la centrada)
    const base = cen ? Qm : P;
    const sc = recortarRecta(base[0], base[1], (l.d * M.sf) / M.sx, F.x0, F.x1, F.y0, F.y1);
    if (sc) hs.push({ a: [sc[0][0], sc[0][1], z + 0.02], b: [sc[1][0], sc[1][1], z + 0.02], rgb: RGB.secante, ancho: 0.065 });
    // catetos del cociente incremental: h (horizontal) y Δf (vertical)
    const A = cen ? Qm : P;
    if (Math.abs(Q[0] - A[0]) > 0.45) {
      const esquina: V3 = [Q[0], A[1], z - 0.05];
      hs.push({ a: [A[0], A[1], z - 0.05], b: esquina, rgb: RGB.cateto, ancho: 0.045, rayas: 0.55 });
      if (Math.abs(Q[1] - A[1]) > 0.3) hs.push({ a: esquina, b: [Q[0], Q[1], z - 0.05], rgb: RGB.cateto, ancho: 0.045, rayas: 0.55 });
    }
    // guía vertical de P al trazador: la pendiente de arriba es la altura de abajo
    hs.push({ a: [P[0], P[1] - 0.75, z - 0.1], b: [P[0], pluma[1] + 0.75, z - 0.1], rgb: RGB.guia, ancho: 0.035 });
    // reto: altura del cohete
    if (r.modo === 'reto') hs.push({ a: [P[0] + 0.7, P[1], z - 0.1], b: [X_TORRE - 0.9, P[1], z - 0.1], rgb: RGB.altura, ancho: 0.035, rayas: 0.7 });
    // reto validado: la recta t* en las dos placas (aparece con la revelación)
    if (r.modo === 'reto' && validado) for (const q of inflex) if (r.descubierto(q.x)) {
      hs.push({ a: [M.X(q.x), F.y0, z - 0.2], b: [M.X(q.x), F.y1, z - 0.2], rgb: RGB.tStar, ancho: 0.04, rayas: 0.9 });
      hs.push({ a: [M.X(q.x), PLACA_D.y0, z - 0.2], b: [M.X(q.x), PLACA_D.y1, z - 0.2], rgb: RGB.tStar, ancho: 0.04, rayas: 0.9 });
    }
    haces.current = hs;

    // puntos notables: aparecen cuando el trazador los descubre (en el reto, sólo al revelar)
    const notables = [...criticos, ...inflex];
    notables.forEach((q, i) => {
      const enF = refsMarcas.current[i * 2], enD = refsMarcas.current[i * 2 + 1];
      const ver = r.descubierto(q.x) && (r.modo === 'explorar' || validado);
      if (enF) { enF.visible = ver; enF.position.set(M.X(q.x), M.YF(c.f(q.x)), z + 0.05); }
      if (enD) { enD.visible = ver; enD.position.set(M.X(q.x), M.YD(c.d1(q.x)), z + 0.05); }
    });
    // mediciones del alumno (reto)
    refsMed.current.forEach((g, i) => {
      if (!g) return;
      const m = r.modo === 'reto' ? r.mediciones[i] : undefined;
      g.visible = !!m;
      if (m) g.position.set(M.X(m.t), M.YD(m.v), z + 0.03);
    });
    // cohete: a la altura s(t); llama ∝ (a + g)/g
    if (refCohete.current) refCohete.current.position.set(X_TORRE, M.YF(l.fx), 0.6);
    empuje.current = (l.d2 + G_ESTANDAR) / G_ESTANDAR;
  });

  // ── rótulos ──
  const nombre = (pieza: string): string | null => {
    switch (pieza) {
      case 'placaF': return reto ? 'Telemetría s(t) · vidrio grabado' : 'Placa de f(x) · vidrio ahumado grabado';
      case 'placaD': return reto ? 'Placa de v(t) = s′(t)' : 'Placa de f′(x): la pendiente, punto a punto';
      case 'curvaF': return curva.formula;
      case 'curvaD': return reto ? (validado ? curva.formulaD : null) : curva.formulaD;
      case 'P': return reto ? 'P = (t, s(t))' : 'P = (x₀, f(x₀))';
      case 'Q': return reto ? 'Q = (t + h, s(t + h))' : 'Q = (x₀ + h, f(x₀ + h))';
      case 'pluma': return reto ? 'v(t): la pendiente de la tangente' : 'f′(x₀): la pendiente de la tangente';
      case 'cohete': return 'Cohete · altura s(t); llama ∝ empuje a + g';
      case 'torre': return 'Torre de lanzamiento';
      case 'soporte': return 'Soporte de aluminio y grafito';
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

  const rotulos = useMemo<RotuloM8[]>(() => {
    if (!p.rotulos) return [];
    const r = reloj;
    const lec = () => r.current.lectura();
    const lista: RotuloM8[] = [
      { id: 'f', texto: reto ? 's(t) · posición' : 'f(x)', ancla: () => [M.X(a + 0.92 * (b - a)), M.YF(curva.f(a + 0.92 * (b - a))) + 0.8, Z_TRAZO] },
      { id: 'tg', texto: 'tangente · pendiente f′(x₀)', ancla: () => { const l = lec(); return [M.X(l.x0) - 6, M.YF(l.fx) - (6 * l.d1 * M.sf) / M.sx + 0.6, Z_TRAZO]; } },
      { id: 'sc', texto: 'secante PQ · pendiente Δf/h', ancla: () => { const l = lec(); return [M.X(l.x0 + l.h * 1.15), M.YF(curva.f(l.x0 + l.h)) + 1.6, Z_TRAZO]; } },
      { id: 'P', texto: 'P', ancla: () => { const l = lec(); return [M.X(l.x0), M.YF(l.fx) + 0.4, Z_TRAZO]; } },
      { id: 'd', texto: reto ? (validado ? 'v(t) = s′(t)' : 'v(t) · tus mediciones') : 'f′(x) · la traza', ancla: () => { const l = lec(); return [M.X(l.x0), M.YD(l.d1) + 0.5, Z_TRAZO]; } },
      { id: 'vid', texto: 'vidrio grabado', ancla: () => [PLACA_F.x0 + 3, PLACA_F.y1 - 1, Z_GRABADO] },
    ];
    if (reto) lista.push({ id: 'co', texto: 'cohete · altura s(t)', ancla: () => [X_TORRE, M.YF(r.current.lectura().fx) + LARGO_COHETE * ESCALA_COHETE + 0.6, 0.6] });
    else if (criticos.length) lista.push({ id: 'cr', texto: 'f′ = 0 · punto crítico', ancla: () => [M.X(criticos[0].x), M.YF(curva.f(criticos[0].x)) + 1.4, Z_TRAZO] });
    return lista.slice(0, 8);
  }, [p.rotulos, reto, validado, M, a, b, curva, criticos, reloj]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  const notables = [...criticos, ...inflex];
  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara reto={reto} reducido={reducido} encuadre={encuadre} />
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.3, 0]} receiveShadow material={mats.suelo}>
        <planeGeometry args={[900, 900]} />
      </mesh>
      <Soporte mats={mats} />
      <PlacaGrabada placa={PLACA_F} tex={texF} mats={mats} pieza="placaF" />
      <PlacaGrabada placa={PLACA_D} tex={texD} mats={mats} pieza="placaD" />
      {/* las curvas: f entera; f′ sólo donde pasó el trazador */}
      <TuboNeon key={`f${clave}${calidad}`} pts={ptsF} color={COLOR.f} intensidad={2.3} calidad={calidad} zVidrio={Z_GRABADO + 0.01} pieza="curvaF" />
      <TuboNeon key={`d${clave}${calidad}`} pts={ptsD} color={COLOR.tangente} intensidad={2.1} radio={0.15} calidad={calidad} zVidrio={Z_GRABADO + 0.01}
        mascara={mascara} x0={PLACA_F.x0} x1={PLACA_F.x1} mando={mandoD} pieza="curvaD" />
      <Haces fuente={haces} />
      <group ref={refQ} userData={{ pieza: 'Q' }}><Cuenta color={COLOR.secante} radio={0.42} halo={2.8} /></group>
      <group ref={refQm} userData={{ pieza: 'Q' }}><Cuenta color={COLOR.secante} radio={0.42} halo={2.8} /></group>
      <group ref={refP} userData={{ pieza: 'P' }}><Cuenta color="#ffffff" radio={0.55} halo={3.6} brillo={1.9} /></group>
      <group ref={refPluma} userData={{ pieza: 'pluma' }}><Cuenta color={COLOR.tangente} radio={0.48} halo={3.4} brillo={1.8} /></group>
      {notables.map((q, i) => (
        <React.Fragment key={`${clave}-${i}`}>
          <group ref={(g) => { refsMarcas.current[i * 2] = g; }} visible={false}>
            <Marca color={q.tipo === 'inflexion' ? COLOR.inflexion : COLOR.critico} rombo={q.tipo === 'inflexion'} radio={q.tipo === 'inflexion' ? 0.85 : 1.0} />
          </group>
          <group ref={(g) => { refsMarcas.current[i * 2 + 1] = g; }} visible={false}>
            <Marca color={q.tipo === 'inflexion' ? COLOR.inflexion : COLOR.critico} rombo={q.tipo === 'inflexion'} radio={0.7} />
          </group>
        </React.Fragment>
      ))}
      {Array.from({ length: MAX_MEDICIONES }, (_, i) => (
        <group key={i} ref={(g) => { refsMed.current[i] = g; }} visible={false}>
          <Cuenta color="#ffd1e8" radio={0.3} halo={1.8} brillo={1.4} />
        </group>
      ))}
      {reto && (
        <>
          <TorreLanzamiento mats={mats} yPlataforma={PLACA_F.y0} />
          <group ref={refCohete}><Cohete mats={mats} empuje={empuje} animar={!reducido} scale={ESCALA_COHETE} /></group>
        </>
      )}
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
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-m8="">
      {d.texto}
    </div>
  );
}

export default function Derivadas3DScene(props: Derivadas3DProps) {
  const { calidad, modo } = props;
  const alta = calidad === 'alta';
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloM8[]>([]);
  const mapaRef = useRef<Mapa>(mapa(props.reloj.current.rangos));
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-m8="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 40, 160], fov: 30, near: 1, far: 2000 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes calidad={calidad} />
          <Luces calidad={calidad} />
          <ControlesBanco objetivo={OBJETIVO} fondo="laboratorio"
            limites={{ minDistancia: 25, maxDistancia: 420, maxPolar: 1.5, minPolar: 0.25, paneo: true, cajaObjetivo: [[-40, 0, -20], [48, 60, 20]] }} />
          <Banco p={props} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} mapaRef={mapaRef} />
          <DiagnosticoDev reloj={props.reloj} calidad={calidad} reto={modo === 'reto'} mapaRef={mapaRef} />
          <AvisarListo onListo={props.onListo} />
          {alta && <Posproceso />}
        </KitContexto.Provider>
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1420]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-m8={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
