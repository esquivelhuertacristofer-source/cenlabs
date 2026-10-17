"use client";
/**
 * Q2 · Leyes de los gases — el banco en 3D (R3F), a escala real (1 u = 1 dm).
 *
 *   Cámara de cuarzo de Ø 26 cm sobre su unidad termostática, pistón con husillo y
 *   volante, manómetro de Bourdon, termómetro bimetálico y botella de gas con su
 *   válvula de aguja. Dentro, la MUESTRA CINÉTICA: esferas que chocan entre sí y con
 *   las paredes, coloreadas por su energía, con estelas cortas.
 *
 * RELOJ ÚNICO. `reloj.current.paso(dt)` corre aquí, en un useFrame de prioridad −1
 * (antes de que nada se dibuje): mueve el pistón a tiempo real, integra las moléculas a
 * cámara lenta (cinetica.ts) y publica la lectura de ESE cuadro. Las esferas, el
 * pistón, el volante, las agujas, el dock y la barra de lecturas leen ese estado.
 *
 * No hay texto ni cifras en 3D: sólo las esferas de los instrumentos y la graduación
 * del cuarzo (como en el aparato real). Los rótulos de piezas son DOM, apagados por
 * defecto, al pasar el ratón o con el botón «Rótulos» (≤ 8, sin solaparse).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { KitContexto, ControlesBanco, type Calidad } from '../_kit';
import { CAMARA, GASES, Y_TAPA, type IdGas } from './cinetica';
import type { RelojGas } from './reloj';
import {
  COTAS, R_EXT, Y_TOPE_TAPA, yPistonDe, yVolanteDe, useMatsQ2, Mesa, UnidadTermostatica, CamaraCuarzo, Tapa, ConjuntoPiston,
  Manometro, Termometro, TuboInox, BotellaGas, SALIDA_BOTELLA, ValvulaAguja, ENTRADA_VALVULA, Manguera, contarNormalesCero, type V3,
} from './piezas';
import { Particulas } from './particulas';

/** Rótulo de pieza; el ancla puede moverse con la pieza (pistón, volante). */
export interface RotuloQ2 { id: string; texto: string; ancla: V3 | (() => V3) }

export interface Gas3DProps {
  reloj: React.MutableRefObject<RelojGas>;
  gas: IdGas;
  temperatura: number;
  moles: number;
  explotado: boolean;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** sube para volver al encuadre automático */
  encuadre?: number;
  /** fracción del ancho del lienzo que tapa, por la derecha, el dock superpuesto (pantallas estrechas) */
  tapado?: number;
  /** la escena ya pintó sus primeros cuadros (el aviso inicial espera a esto) */
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#06090c';

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

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    (gl as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = calidad === 'alta' ? 1 : 0.5;
    // fondo de estudio: degradado radial oscuro con un tramado mínimo (sin bandas)
    let tex: THREE.CanvasTexture | null = null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(256, 210, 10, 256, 250, 430);
      grad.addColorStop(0, '#1d2935'); grad.addColorStop(0.55, '#0f161e'); grad.addColorStop(1, FONDO);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      const img = g.getImageData(0, 0, 512, 512);
      let s = 1237;
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
    // entorno de estudio procedural: reflejos de catálogo, sin red
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.55;
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
    l.shadow.camera.near = 3; l.shadow.camera.far = 30; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(0, 1.6, 0); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#b4c6d8', '#07090c', 0.34]} />
      {/* luz clave de estudio: foco cálido de penumbra ancha → charco de luz y sombras suaves */}
      <spotLight ref={clave} position={[-6.5, 11, 8]} angle={0.42} penumbra={0.9} decay={0} intensity={2.3} color="#fff1df" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* contraluz fría: recorta el cuarzo y los cromados */}
      <directionalLight position={[5, 6, -7]} intensity={1.1} color="#cfe0ff" />
      <directionalLight position={[5, 3, 7]} intensity={0.32} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6; // ToneMappingMode.ACES_FILMIC de postprocessing
/** Bloom moderado sólo en lo que emite (moléculas, placa al rojo, pilotos) + ACES + viñeta. Props constantes. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.5} luminanceThreshold={2} luminanceSmoothing={0.2} radius={0.5} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.28} darkness={0.58} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

/** Distancia y objetivo para que `puntos` quepan en ±mx, ±my (NDC) alrededor de x = cx0, mirando desde `dir`. */
function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number, cx0 = 0) {
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
    let lo = 2, hi = 120;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; const b = caja(m); if ((b.x1 - b.x0) / 2 <= mx && (b.y1 - b.y0) / 2 <= my) hi = m; else lo = m; }
    d = hi;
    const b = caja(d);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const medioAlto = d * Math.tan(THREE.MathUtils.degToRad(fov) / 2), medioAncho = medioAlto * aspecto;
    const derecha = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const arriba = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    tgt.addScaledVector(derecha, (cx - cx0) * medioAncho).addScaledVector(arriba, cy * medioAlto);
  }
  return { pos: tgt.clone().addScaledVector(dir, d), objetivo: tgt };
}

const EL_CAM = 13, AZ_CAM = -12;
const DIR_CAMARA = (() => {
  const el = THREE.MathUtils.degToRad(EL_CAM), az = THREE.MathUtils.degToRad(AZ_CAM);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
})();
/** Ángulo de torno (0 = +Z) que mira a la cámara, un poco a la izquierda: ahí va la graduación. */
const CENTRO_GRADUACION = THREE.MathUtils.degToRad(AZ_CAM - 30);

function puntosEncuadre(): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  const { ancho: W, fondo: D } = COTAS.base;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(new THREE.Vector3((sx * W) / 2, 0, (sz * D) / 2));
  // la cámara y el volante con el pistón a 12 L
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) P.push(new THREE.Vector3(Math.cos(a) * COTAS.rBrida, Y_TOPE_TAPA, Math.sin(a) * COTAS.rBrida));
  const yv = yVolanteDe(yPistonDe(12));
  P.push(new THREE.Vector3(-COTAS.rVolante, yv, 0), new THREE.Vector3(COTAS.rVolante, yv, 0));
  // instrumentos y botella
  const m = COTAS.manometro, t = COTAS.termometro, b = COTAS.botella;
  P.push(new THREE.Vector3(m.pos[0] + m.diametro / 2, m.pos[1] + m.diametro / 2, m.pos[2]), new THREE.Vector3(m.pos[0] + m.diametro / 2, m.pos[1] - m.diametro / 2, m.pos[2]));
  P.push(new THREE.Vector3(t.pos[0] + t.diametro / 2, t.pos[1], t.pos[2]), new THREE.Vector3(t.pos[0], COTAS.base.alto, t.pos[2]));
  P.push(new THREE.Vector3(b[0] - 0.5, 3.9, b[2]), new THREE.Vector3(b[0] - 0.5, 0, b[2]));
  return P;
}

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Encuadre con transición suave; re-encuadra al cambiar el tamaño si el alumno no movió la cámara. */
function Camara({ reducido, encuadre, tapado }: { reducido: boolean; encuadre: number; tapado: number }) {
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
    // el banco ocupa ~62 % del alto en apaisado; en vertical manda el ancho
    // con el dock superpuesto (pantalla estrecha), el banco se encuadra en la parte que queda libre
    const f = tapado > 0.05 && tapado < 0.6 ? tapado : 0;
    const p = encuadrar(DIR_CAMARA, new THREE.Vector3(0, 2.6, 0), puntosEncuadre(), camera.fov, aspecto, 0.88 * (1 - f), 0.62, -f);
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, camera, reducido, encuadre, tapado]);
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

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;

/** Proyecta las anclas de los rótulos y coloca los <div> del overlay sin solaparse (≤ 8). */
function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloQ2[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (rotulos.length === 0) return;
    const cajas: { x: number; y: number; w: number; h: number }[] = [];
    const lista = rotulos.slice(0, 8).map((r) => {
      v.set(...(typeof r.ancla === 'function' ? r.ancla() : r.ancla)).project(camera);
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

function DiagnosticoDev({ reloj, calidad }: { reloj: React.MutableRefObject<RelojGas>; calidad: Calidad }) {
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
    const w = window as unknown as { __qmi02?: unknown };
    w.__qmi02 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj.current;
        return {
          macro: r.macro, lectura: r.lectura, factor: r.factor, pausa: r.pausa, version: r.version, yPiston: r.yPiston,
          N: r.sim.N, tiempoReal: r.tiempoReal, ejeV: r.ejeV, trayectoria: r.trayectoria.length, Tmuestra: r.sim.temperaturaMuestra(),
        };
      },
      /** sólo desarrollo: adelanta el reloj `s` segundos de pantalla (a 60 cuadros por segundo) */
      adelantar(s: number) {
        const r = reloj.current;
        for (let i = 0; i < Math.round(s * 60); i++) r.paso(1 / 60);
        return r.lectura;
      },
      /** sólo desarrollo: píxel (CSS) donde cae un punto del mundo */
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const rc = gl.domElement.getBoundingClientRect();
        return { x: rc.left + (v.x * 0.5 + 0.5) * rc.width, y: rc.top + (-v.y * 0.5 + 0.5) * rc.height };
      },
      escena: scene,
      renderer: gl,
    };
    return () => { delete w.__qmi02; };
  }, [gl, scene, reloj, calidad, camera]);
  return null;
}

// ───────────────────────────── el banco ─────────────────────────────

const ROTULO_PIEZA: Record<string, string> = {
  camara: 'Cámara de cuarzo · V = área × altura',
  bridas: 'Bridas y tirantes de acero inoxidable',
  piston: 'Pistón de aluminio con juntas tóricas',
  husillo: 'Husillo de 5 mm de paso y volante: fijan el volumen',
  placa: 'Placa termostática: el fondo y el cuarzo están a la T fijada',
  termostato: 'Unidad termostática (consigna y pilotos de calor y frío)',
  manometro: 'Manómetro de Bourdon · atm y kPa',
  termometro: 'Termómetro bimetálico · K y °C',
  valvula: 'Válvula de aguja: entrada de gas',
};

const Y0_PISTON = yPistonDe(10);
const GIRO_BOTELLA = 0.5;

function Banco({ p, rotulo, publicarRotulos, nodos }: {
  p: Gas3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloQ2[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { reloj, calidad, reducido, encuadre = 0, gas, temperatura, moles } = p;
  const mats = useMatsQ2(calidad);

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.current.paso(dt); }, -1);

  // pistón, husillo y volante siguen al reloj; con la explosión, la tapa y el pistón salen despedidos
  const superior = useRef<THREE.Group>(null);
  const conjunto = useRef<THREE.Group>(null);
  const giro = useRef(0);
  const vuelo = useRef({ activo: false, t: 0 });
  useFrame((_, dtR) => {
    const sup = superior.current, c = conjunto.current; if (!sup || !c) return;
    const r = reloj.current;
    if (r.macro.explotado) {
      const v = vuelo.current;
      if (!v.activo) { v.activo = true; v.t = 0; }
      v.t += reducido ? 3 : Math.min(dtR, 0.05);
      const t = v.t;
      sup.position.set(0.9 * t, 7.5 * t - 4.9 * t * t, -0.4 * t);
      sup.rotation.set(0.5 * t, 0, -0.9 * t);
      sup.visible = t < 2.2;
      return;
    }
    vuelo.current.activo = false;
    sup.position.set(0, 0, 0); sup.rotation.set(0, 0, 0); sup.visible = true;
    c.position.y = r.yPiston;
    // al bajar el pistón (comprimir) el volante gira en sentido horario visto desde arriba
    giro.current = ((r.yPiston - Y0_PISTON) / COTAS.pasoHusillo) * 2 * Math.PI;
  });

  const lecturaP = useMemo(() => () => reloj.current.lectura.P, [reloj]);
  const lecturaT = useMemo(() => () => reloj.current.macro.T, [reloj]);

  // tuberías: del fondo al manómetro y entrada de gas
  const m = COTAS.manometro, val = COTAS.valvula, bot = COTAS.botella;
  const tuboManometro = useMemo<V3[]>(() => [
    [R_EXT + 0.35, COTAS.base.alto + 0.06, 0.45], [m.pos[0], COTAS.base.alto + 0.06, 0.45], [m.pos[0], m.pos[1] - m.diametro / 2 - 0.3, m.pos[2] - 0.06],
  ], [m]);
  const tuboEntrada = useMemo<V3[]>(() => [
    [val[0] + 0.12, val[1] + 0.17, val[2]], [-R_EXT - 0.18, val[1] + 0.17, val[2]], [-R_EXT - 0.18, val[1] + 0.17, 0], [-COTAS.rBrida + 0.05, val[1] + 0.17, 0],
  ], [val]);
  // la salida del regulador, girada con la botella
  const salida: V3 = [
    bot[0] + SALIDA_BOTELLA[0] * Math.cos(GIRO_BOTELLA) + SALIDA_BOTELLA[2] * Math.sin(GIRO_BOTELLA),
    bot[1] + SALIDA_BOTELLA[1],
    bot[2] - SALIDA_BOTELLA[0] * Math.sin(GIRO_BOTELLA) + SALIDA_BOTELLA[2] * Math.cos(GIRO_BOTELLA),
  ];
  const entrada: V3 = [val[0] + ENTRADA_VALVULA[0], val[1] + ENTRADA_VALVULA[1], val[2] + ENTRADA_VALVULA[2]];
  const t = COTAS.termometro;

  // rótulo al pasar el ratón (DOM, nítido)
  const nombreGas = GASES[gas];
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    let texto: string | null = pieza ? ROTULO_PIEZA[pieza] ?? null : null;
    if (pieza === 'gas') texto = `Moléculas de ${nombreGas.formula}: el color es su energía ½mv²`;
    if (pieza === 'botella') texto = `Botella de ${nombreGas.nombre.toLowerCase()} (${nombreGas.formula}) con regulador`;
    rotulo.current(texto ? { texto, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  // rótulos con el botón «Rótulos» (≤ 8)
  const rotulos = useMemo<RotuloQ2[]>(() => {
    if (!p.rotulos) return [];
    return [
      { id: 'ca', texto: 'Cámara de cuarzo', ancla: [-R_EXT * 0.7, Y_TAPA - 0.5, R_EXT * 0.7] },
      { id: 'pi', texto: 'Pistón', ancla: () => [R_EXT * 0.6, reloj.current.yPiston + 0.15, R_EXT * 0.8] },
      { id: 'vo', texto: 'Husillo y volante', ancla: () => [COTAS.rVolante, yVolanteDe(reloj.current.yPiston) + 0.1, 0] },
      { id: 'pl', texto: 'Placa termostática', ancla: [0, CAMARA.yFondo + 0.05, R_EXT] },
      { id: 'ma', texto: 'Manómetro', ancla: [m.pos[0], m.pos[1] + m.diametro / 2 + 0.05, m.pos[2]] },
      { id: 'te', texto: 'Termómetro', ancla: [t.pos[0], t.pos[1] + t.diametro / 2 + 0.05, t.pos[2]] },
      { id: 'va', texto: 'Válvula de entrada', ancla: [val[0], val[1] + 0.85, val[2]] },
      { id: 'bo', texto: `Botella de ${nombreGas.formula}`, ancla: [bot[0], 4.1, bot[2]] },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.rotulos, gas]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara reducido={reducido} encuadre={encuadre} tapado={p.tapado ?? 0} />
      <Mesa mats={mats} />
      <UnidadTermostatica mats={mats} temperatura={temperatura} />
      <CamaraCuarzo mats={mats} centroGraduacion={CENTRO_GRADUACION} temperatura={temperatura} />
      <group ref={superior}>
        <Tapa mats={mats} />
        <ConjuntoPiston ref={conjunto} mats={mats} giro={giro} position={[0, reloj.current.yPiston, 0]} />
      </group>
      {/* el fenómeno */}
      <Particulas reloj={reloj} calidad={calidad} estelas={!reducido} />
      {/* manómetro con su toma en el fondo de la cámara */}
      <TuboInox puntos={tuboManometro} mats={mats} />
      <Manometro mats={mats} lectura={lecturaP} reducido={reducido} position={m.pos} rotation-y={m.giro} />
      {/* termómetro bimetálico sobre su poste (marca la T de la placa y del cuarzo) */}
      <TuboInox puntos={[[t.pos[0], COTAS.base.alto, t.pos[2]], [t.pos[0], t.pos[1] - t.diametro / 2 + 0.02, t.pos[2]]]} mats={mats} radio={0.035} />
      <Termometro mats={mats} lectura={lecturaT} reducido={reducido} position={t.pos} rotation-y={t.giro} />
      {/* entrada de gas: botella → manguera → válvula de aguja → fondo de la cámara */}
      <BotellaGas gas={gas} mats={mats} position={bot} rotation-y={GIRO_BOTELLA} />
      <Manguera desde={salida} hasta={entrada} mats={mats} holgura={0.9} />
      <ValvulaAguja mats={mats} giro={Math.round(moles * 20) * 0.9} reducido={reducido} position={val} />
      <TuboInox puntos={tuboEntrada} mats={mats} radio={0.04} />
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
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-q2="">
      {d.texto}
    </div>
  );
}

export default function Gas3DScene(props: Gas3DProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloQ2[]>([]);
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-q2="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 4, 16], fov: 30, near: 0.05, far: 200 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes calidad={calidad} />
          <Luces calidad={calidad} />
          <ControlesBanco objetivo={[0, 2.6, 0]} fondo="laboratorio"
            limites={{ minDistancia: 3, maxDistancia: 34, maxPolar: 1.48, minPolar: 0.12, paneo: true, cajaObjetivo: [[-3.5, 0, -2.5], [3.5, 6.5, 2.5]] }} />
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
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-q2={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
