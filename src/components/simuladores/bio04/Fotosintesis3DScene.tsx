"use client";
/**
 * B4 · Fotosíntesis — la escena 3D (R3F). Dos vistas del MISMO estado del modelo:
 *
 *   · CLOROPLASTO (inicial): el orgánulo en media sección con la luz de la lámpara
 *     entrando; fotones absorbidos o no según el espectro, O₂ que sale, la mitocondria que
 *     respira, CO₂ al ciclo de Calvin, ATP y NADPH de los tilacoides al ciclo.
 *   · TILACOIDE: la membrana ampliada (cámara lenta ×1/40) con el fotosistema II, el
 *     citocromo b₆f, el fotosistema I y la ATP sintasa: el esquema Z en marcha, el agua
 *     que se rompe, los H⁺ que acidifican el lumen y el rotor que gira con ellos.
 *
 * RELOJ ÚNICO. `reloj.current.paso(dt)` corre aquí, en un useFrame de prioridad −1 (antes
 * de dibujar). La escena, el dock y la barra de lecturas leen ese mismo objeto.
 *
 * Sin texto ni gráficas en el 3D: los rótulos de piezas son DOM, apagados por defecto
 * (aparecen al pasar el ratón o con «Rótulos», ≤ 8 y sin solaparse).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Calidad } from '../_kit';
import { useMatsCloro, Envoltura, Grana, Trastes, Inclusiones, Estroma, AnilloCalvin, Mitocondria, puntosCloroplasto, CALVIN_ANILLO, MITO, ALMIDON, GRANA, Y_CORTE, type V3 } from './cloroplasto';
import { FenomenoCloroplasto, Haz, LuzLampara, DIR_LUZ, BLANCO_HAZ } from './particulas';
import { VistaTilacoide, puntosTilacoide, ROTULOS_TILACOIDE, ROTULO_PIEZA_TILACOIDE } from './membrana';
import { materialBokeh } from './materiales';
import type { RelojFoto } from './reloj';

export type VistaB4 = 'cloroplasto' | 'tilacoide';

export interface Fotosintesis3DProps {
  reloj: React.MutableRefObject<RelojFoto>;
  vista: VistaB4;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** sube para volver al encuadre automático */
  encuadre?: number;
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#050c0b';

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 0.95;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.localClippingEnabled = true;
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.45;
    scene.background = new THREE.Color(FONDO);
    return () => { scene.environment = null; scene.background = null; env.dispose(); pm.dispose(); };
  }, [gl, scene, calidad]);
  return null;
}

/** Cielo: degradado radial EN PANTALLA (citoplasma verde azulado profundo), sin bandas. */
function Cielo({ vista }: { vista: VistaB4 }) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      a0: { value: new THREE.Color('#173a33') }, a1: { value: new THREE.Color('#0b201d') }, a2: { value: new THREE.Color('#030807') },
    },
    vertexShader: /* glsl */ `void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: /* glsl */ `
      uniform vec2 uRes; uniform vec3 a0; uniform vec3 a1; uniform vec3 a2;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 q = gl_FragCoord.xy / uRes;
        vec2 d = (q - vec2(0.48, 0.56)) * vec2(uRes.x / uRes.y, 1.0);
        float r = length(d) * 1.05;
        vec3 c = mix(mix(a0, a1, smoothstep(0.0, 0.5, r)), a2, smoothstep(0.45, 1.1, r));
        c += (h(gl_FragCoord.xy) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  useEffect(() => {
    // la membrana vive en un medio más azulado (lumen/estroma)
    if (vista === 'tilacoide') { mat.uniforms.a0.value.set('#16343c'); mat.uniforms.a1.value.set('#0a1c22'); }
    else { mat.uniforms.a0.value.set('#173a33'); mat.uniforms.a1.value.set('#0b201d'); }
  }, [vista, mat]);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 16, 12), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const malla = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    const pr = gl.getPixelRatio();
    mat.uniforms.uRes.value.set(size.width * pr, size.height * pr);
    if (malla.current) { malla.current.position.copy(camera.position); malla.current.scale.setScalar((camera as THREE.PerspectiveCamera).far * 0.9); }
  });
  return <mesh ref={malla} geometry={geo} material={mat} renderOrder={-100} frustumCulled={false} raycast={() => null} />;
}

/** Partículas desenfocadas del citoplasma (bokeh), con deriva lenta. */
function Bokeh({ alta, reloj }: { alta: boolean; reloj: React.MutableRefObject<RelojFoto> }) {
  const n = alta ? 260 : 130;
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const { geo, vel } = useMemo(() => {
    let s = 9137;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tam = new Float32Array(n), vel = new Float32Array(n * 3);
    const pal = ['#9be8c8', '#7fd6d0', '#c9f0a8', '#ffe2a8', '#a8d8ff'].map((h) => new THREE.Color(h));
    for (let i = 0; i < n; i++) {
      const r = 9 + 26 * Math.pow(rnd(), 0.7), th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
      pos[3 * i] = r * Math.sin(ph) * Math.cos(th); pos[3 * i + 1] = r * Math.cos(ph) * 0.6; pos[3 * i + 2] = r * Math.sin(ph) * Math.sin(th) - 6;
      const c = pal[Math.floor(rnd() * pal.length)], k = 0.25 + 0.35 * rnd();
      col[3 * i] = c.r * k; col[3 * i + 1] = c.g * k; col[3 * i + 2] = c.b * k;
      tam[i] = 0.12 + 0.9 * rnd() * rnd();
      vel[3 * i] = (rnd() - 0.5) * 0.12; vel[3 * i + 1] = (rnd() - 0.5) * 0.08; vel[3 * i + 2] = (rnd() - 0.5) * 0.12;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
    return { geo: g, vel };
  }, [n]);
  const mat = useMemo(() => materialBokeh(new THREE.Color('#0b1d1a')), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  useFrame(() => {
    const pr = gl.getPixelRatio();
    mat.uniforms.uEscala.value = (size.height * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    const d = reloj.current.dtAnim;
    if (!d) return;
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < n * 3; i++) (p.array as Float32Array)[i] += vel[i] * d;
    p.needsUpdate = true;
  });
  return <points geometry={geo} material={mat} renderOrder={1} frustumCulled={false} raycast={() => null} />;
}

function Luces({ calidad }: { calidad: Calidad }) {
  const clave = useRef<THREE.DirectionalLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 40; c.updateProjectionMatrix();
    l.shadow.bias = -0.0004; l.shadow.normalBias = 0.025; l.shadow.radius = 6;
  }, []);
  return (
    <>
      <hemisphereLight args={['#d6f5e6', '#0b1210', 0.34]} />
      {/* clave cálida con sombra suave */}
      <directionalLight ref={clave} position={[-9, 7, 9]} intensity={1.5} color="#fff1e0" castShadow shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* relleno frío y dos contraluces que recortan las siluetas */}
      <directionalLight position={[9, 2, 8]} intensity={0.45} color="#c8e2ff" />
      <directionalLight position={[6, 7, -12]} intensity={1.0} color="#bfe6ff" />
      <directionalLight position={[-10, 1, -8]} intensity={0.55} color="#ffe0c8" />
    </>
  );
}

const TONO_ACES = 6;
/** Bloom moderado SÓLO en lo que emite (fotones, destellos, portadores; HDR > 1) + ACES + viñeta. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={1.1} luminanceSmoothing={0.25} radius={0.6} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

/** Distancia y objetivo para que `puntos` quepan en ±mx, ±my (NDC) mirando desde `dir` (búsqueda binaria + recentrado). */
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

const dirDe = (elev: number, az: number) => {
  const el = THREE.MathUtils.degToRad(elev), a = THREE.MathUtils.degToRad(az);
  return new THREE.Vector3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)).normalize();
};
const ENCUADRE: Record<VistaB4, { dir: THREE.Vector3; objetivo: THREE.Vector3; puntos: () => THREE.Vector3[] }> = {
  cloroplasto: { dir: dirDe(44, -24), objetivo: new THREE.Vector3(0, -0.3, 0), puntos: puntosCloroplasto },
  tilacoide: { dir: dirDe(10, 8), objetivo: new THREE.Vector3(0, 0.5, 0), puntos: puntosTilacoide },
};
const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Encuadre con transición suave; re-encuadra al cambiar el tamaño o la vista si el alumno no movió la cámara. */
function Camara({ vista, reducido, encuadre }: { vista: VistaB4; reducido: boolean; encuadre: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const usuario = useRef(false);
  const primera = useRef(true);
  const ultimaVista = useRef(vista);
  const anim = useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; o0: THREE.Vector3; o1: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    if (!controls) return;
    if (DEV) camera.userData.__ctl = controls;
    const f = () => { usuario.current = true; anim.current = null; };
    controls.addEventListener('start', f);
    return () => controls.removeEventListener('start', f);
  }, [controls]);
  const aspecto = size.width / Math.max(1, size.height);
  const ultimoEncuadre = useRef(encuadre);
  useLayoutEffect(() => {
    if (!controls) return;
    if (ultimoEncuadre.current !== encuadre) { ultimoEncuadre.current = encuadre; usuario.current = false; }
    const cambioVista = ultimaVista.current !== vista;
    ultimaVista.current = vista;
    if (cambioVista) usuario.current = false;
    if (!primera.current && usuario.current) return;
    const e = ENCUADRE[vista];
    // apaisado: el objeto ocupa ~64 % del alto; en vertical manda el ancho
    const p = encuadrar(e.dir, e.objetivo, e.puntos(), camera.fov, aspecto, 0.9, 0.62);
    camera.near = vista === 'tilacoide' ? 0.2 : 0.1; camera.far = 260; camera.updateProjectionMatrix();
    // al cambiar de vista la cortina tapa el salto: se coloca directo
    if (primera.current || reducido || cambioVista) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      anim.current = null;
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, vista, camera, reducido, encuadre]);
  useFrame((_, dt) => {
    const a = anim.current; if (!a || !controls) return;
    a.t = Math.min(1, a.t + dt / 0.8);
    const k = facil(a.t);
    camera.position.lerpVectors(a.p0, a.p1, k);
    controls.target.lerpVectors(a.o0, a.o1, k);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── reloj y aviso ─────────────────────────────

/** RELOJ ÚNICO: avanza antes que cualquier otra cosa del cuadro (prioridad negativa). */
function Motor({ reloj }: { reloj: React.MutableRefObject<RelojFoto> }) {
  useFrame((_, dt) => { reloj.current.paso(dt, performance.now()); }, -1);
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

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export interface RotuloB4 { id: string; texto: string; ancla: V3 }
type DatoRotulo = { texto: string; x: number; y: number } | null;

const ROTULO_PIEZA_CLORO: Record<string, string> = {
  envoltura: 'Envoltura: membranas externa e interna',
  estroma: 'Estroma (Rubisco y ribosomas)',
  granum: 'Granum: tilacoides apilados',
  lumen: 'Lumen del tilacoide (color = pH)',
  traste: 'Lamela del estroma',
  almidon: 'Grano de almidón',
  globulo: 'Plastoglóbulo (lípidos)',
  calvin: 'Ciclo de Calvin (esquema)',
  rubisco: 'Rubisco: fija el CO₂',
  mitocondria: 'Mitocondria: respira O₂',
};
const ROTULOS_CLORO: RotuloB4[] = [
  { id: 'env', texto: 'Envoltura doble', ancla: [-3.0, Y_CORTE, 1.85] },
  { id: 'gra', texto: 'Granum', ancla: [GRANA[6].x, Y_CORTE + 0.05, GRANA[6].z] },
  { id: 'est', texto: 'Estroma', ancla: [-0.2, -0.6, 0.62] },
  { id: 'cal', texto: 'Ciclo de Calvin', ancla: [CALVIN_ANILLO.c[0], CALVIN_ANILLO.c[1] + 0.2, CALVIN_ANILLO.c[2] - 0.3] },
  { id: 'alm', texto: 'Almidón', ancla: ALMIDON[2].p },
  { id: 'mit', texto: 'Mitocondria', ancla: [MITO.p[0], MITO.p[1] + 0.1, MITO.p[2]] },
  { id: 'luz', texto: 'Luz de la lámpara', ancla: [BLANCO_HAZ.x - DIR_LUZ.x * 3.6, BLANCO_HAZ.y - DIR_LUZ.y * 3.6, BLANCO_HAZ.z - DIR_LUZ.z * 3.6] },
  { id: 'lum', texto: 'Lumen (pH)', ancla: [GRANA[8].x, Y_CORTE, GRANA[8].z] },
];

/** Proyecta las anclas y coloca los <div> del overlay sin solaparse (≤ 8). */
function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloB4[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
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
      const w = el.offsetWidth || 110, h = el.offsetHeight || 22;
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

function DiagnosticoDev({ reloj, calidad, vista }: { reloj: React.MutableRefObject<RelojFoto>; calidad: Calidad; vista: VistaB4 }) {
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
    const w = window as unknown as { __bio04?: unknown };
    w.__bio04 = {
      salud() {
        let mallas = 0, normalesCero = 0;
        const conCero: string[] = [];
        scene.traverse((o) => {
          const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
          if (!g || !(o as THREE.Mesh).isMesh) return;
          mallas++;
          const n = g.getAttribute('normal');
          if (!n) return;
          let c = 0;
          for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) c++;
          if (c) conCero.push(`${o.name || g.type}:${c}`);
          normalesCero += c;
        });
        const m = medida.current;
        return { mallas, normalesCero, conCero, llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, vista, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj.current;
        return { cond: r.cond, I: r.I, neta: r.neta, bruta: r.bruta, burbujasMin: r.burbujasMin, ph: r.ph, tasas: r.tasas, ensayo: r.ensayo, ultimo: r.ultimo, tAnim: r.tAnim, pausa: r.pausa, version: r.version, trazador: r.trazador };
      },
      /** sólo desarrollo: coloca la cámara (para inspeccionar de cerca) */
      camara(px: number, py: number, pz: number, tx: number, ty: number, tz: number) {
        const c = (camera as unknown as { userData: Record<string, unknown> });
        const ctl = (c.userData.__ctl as OrbitControlsImpl | undefined);
        camera.position.set(px, py, pz);
        if (ctl) { ctl.target.set(tx, ty, tz); ctl.update(); } else camera.lookAt(tx, ty, tz);
        return true;
      },
      /** sólo desarrollo: píxel (CSS) donde cae un punto del mundo */
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const rc = gl.domElement.getBoundingClientRect();
        return { x: rc.left + (v.x * 0.5 + 0.5) * rc.width, y: rc.top + (-v.y * 0.5 + 0.5) * rc.height };
      },
      reloj,
      /** sólo desarrollo: cuántas instancias dibuja cada malla instanciada (para sondear el fenómeno) */
      instancias() {
        const out: Record<string, number> = {};
        let i = 0;
        scene.traverse((o) => { const m = o as THREE.InstancedMesh; if (m.isInstancedMesh) out[`${i++}:${(m.material as THREE.Material).type}`] = m.count; });
        return out;
      },
    };
    return () => { delete w.__bio04; };
  }, [gl, scene, camera, reloj, calidad, vista]);
  return null;
}

// ───────────────────────────── vistas ─────────────────────────────

function VistaCloroplasto({ reloj, calidad }: { reloj: React.MutableRefObject<RelojFoto>; calidad: Calidad }) {
  const mats = useMatsCloro();
  const alta = calidad === 'alta';
  return (
    <group>
      <Envoltura mats={mats} />
      <Grana mats={mats} reloj={reloj} />
      <Trastes mats={mats} />
      <Inclusiones mats={mats} />
      <Estroma alta={alta} reloj={reloj} />
      <AnilloCalvin mats={mats} />
      <Mitocondria mats={mats} />
      <Haz reloj={reloj} />
      <LuzLampara reloj={reloj} />
      <FenomenoCloroplasto reloj={reloj} calidad={calidad} />
    </group>
  );
}

function Contenido({ p, rotulo, publicarRotulos, nodos }: {
  p: Fotosintesis3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloB4[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { reloj, vista, calidad, reducido, encuadre = 0 } = p;
  const alta = calidad === 'alta';
  const rotulos = useMemo<RotuloB4[]>(() => (p.rotulos ? (vista === 'cloroplasto' ? ROTULOS_CLORO : ROTULOS_TILACOIDE).slice(0, 8) : []), [p.rotulos, vista]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    // r3f entrega una llamada por intersección (de cerca a lejos): manda la más cercana
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    let texto: string | null = null;
    if (pieza) texto = (vista === 'cloroplasto' ? ROTULO_PIEZA_CLORO[pieza] : ROTULO_PIEZA_TILACOIDE[pieza]) ?? null;
    if (pieza === 'lumen' || pieza === 'lumenM') texto = `Lumen: pH ${reloj.current.ph.toFixed(1).replace('.', ',')}`;
    rotulo.current(texto ? { texto, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };
  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Motor reloj={reloj} />
      <Camara vista={vista} reducido={reducido} encuadre={encuadre} />
      <Cielo vista={vista} />
      <Bokeh alta={alta} reloj={reloj} />
      {vista === 'cloroplasto' ? <VistaCloroplasto reloj={reloj} calidad={calidad} /> : <VistaTilacoide reloj={reloj} calidad={calidad} />}
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} />
    </group>
  );
}

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[260px] rounded-md border border-white/15 bg-[#0b1714]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-b4="">
      {d.texto}
    </div>
  );
}

export default function Fotosintesis3DScene(props: Fotosintesis3DProps) {
  const { calidad, vista } = props;
  const alta = calidad === 'alta';
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloB4[]>([]);
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-b4="" data-vista-b4={vista}>
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 4, 16], fov: 30, near: 0.1, far: 260 }}
      >
        <Ajustes calidad={calidad} />
        <Luces calidad={calidad} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.09} enablePan={false} minDistance={4} maxDistance={60} maxPolarAngle={Math.PI * 0.62} />
        <Contenido p={props} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} />
        <DiagnosticoDev reloj={props.reloj} calidad={calidad} vista={vista} />
        <AvisarListo onListo={props.onListo} />
        {alta && <Posproceso />}
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      {/* rótulos fijos («Rótulos»): los coloca la escena cada cuadro, sin solaparse */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1714]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-b4={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
