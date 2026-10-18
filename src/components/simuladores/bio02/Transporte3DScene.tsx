"use client";
/**
 * B2 · Transporte celular — la escena 3D (R3F). Tres vistas:
 *
 *   · MEMBRANA (inicial, ×1/300): la membrana del glóbulo rojo en media sección, a escala de
 *     nanómetros: acuaporina (ósmosis), GLUT1 (difusión facilitada), bomba Na⁺/K⁺ con ATP
 *     (transporte activo) y O₂ que cruza la bicapa (difusión simple). Iones y moléculas reales.
 *   · CÉLULA (×1/10): el mismo glóbulo entero, a escala de micras, con el volumen del modelo.
 *   · RETO (×1/10): la célula del reto (animal o vegetal) con su osmolaridad desconocida.
 *
 * RELOJ ÚNICO. El reloj activo avanza aquí, en un useFrame de prioridad −1 (antes de dibujar);
 * escena, dock y barra de lecturas leen ese mismo objeto.
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
import { VistaMembrana, puntosMembrana, ROTULOS_MEMBRANA, ROTULO_PIEZA_MEMBRANA, PROT, type RotuloB2 } from './membrana';
import { VistaCelula, VistaReto, puntosCelula, puntosVegetal, ROTULO_PIEZA_CELULA } from './celula';
import { R_E } from './forma';
import { materialBokeh } from './materiales';
import type { RelojTransporte, RelojReto, VistaB2 } from './reloj';

export interface Transporte3DProps {
  relojE: React.MutableRefObject<RelojTransporte>;
  relojR: React.MutableRefObject<RelojReto>;
  vista: VistaB2;
  /** tipo de célula del reto (cambia la escena y el encuadre) */
  tipoReto: 'animal' | 'vegetal';
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** sube para volver al encuadre automático */
  encuadre?: number;
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#06121a';
type Escena = 'membrana' | 'celula' | 'animal' | 'vegetal';
const escenaDe = (v: VistaB2, tipo: 'animal' | 'vegetal'): Escena => (v === 'reto' ? tipo : v);

// ───────────────────────────── ambiente ─────────────────────────────

/**
 * Niebla de profundidad: lo lejano se funde con el medio (la membrana que sigue hacia el fondo,
 * los glóbulos vecinos). Mantiene el foco en el corte sin desenfoque de posproceso.
 */
function Niebla({ escena }: { escena: Escena }) {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  useLayoutEffect(() => {
    const f = new THREE.Fog(escena === 'membrana' ? '#0d2a38' : '#0b2230', 10, 100);
    scene.fog = f;
    return () => { scene.fog = null; };
  }, [scene, escena]);
  useFrame(() => {
    const f = scene.fog as THREE.Fog | null; if (!f) return;
    // empieza justo detrás del objetivo y se cierra a ~4 veces su distancia
    const d = controls ? camera.position.distanceTo(controls.target) : 30;
    if (escena === 'membrana') { f.near = d * 0.95; f.far = d * 2.4; }
    else { f.near = d * 1.3; f.far = d * (escena === 'vegetal' ? 4 : 5.5); }
  });
  return null;
}

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.localClippingEnabled = true;
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.5;
    scene.background = new THREE.Color(FONDO);
    return () => { scene.environment = null; scene.background = null; env.dispose(); pm.dispose(); };
  }, [gl, scene, calidad]);
  return null;
}

/**
 * Cielo: degradado EN PANTALLA, sin bandas. En la membrana, plasma (azul petróleo) arriba y
 * citoplasma (vino) abajo, con el cambio a la altura de la bicapa; en la célula, radial.
 */
function Cielo({ escena }: { escena: Escena }) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) }, uCorte: { value: 0.5 }, uModo: { value: 0 },
      f0: { value: new THREE.Color('#174456') }, f1: { value: new THREE.Color('#071a24') },
      d0: { value: new THREE.Color('#47202c') }, d1: { value: new THREE.Color('#14070c') },
    },
    vertexShader: /* glsl */ `void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: /* glsl */ `
      uniform vec2 uRes; uniform float uCorte; uniform float uModo;
      uniform vec3 f0; uniform vec3 f1; uniform vec3 d0; uniform vec3 d1;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 q = gl_FragCoord.xy / uRes;
        vec2 d = (q - vec2(0.5, 0.55)) * vec2(uRes.x / uRes.y, 1.0);
        float r = length(d);
        vec3 c;
        if (uModo < 0.5) {
          // arriba plasma, abajo citoplasma; cada uno más oscuro hacia su borde
          float arriba = smoothstep(uCorte - 0.04, uCorte + 0.04, q.y);
          vec3 cf = mix(f0, f1, smoothstep(0.0, 1.0, (q.y - uCorte) / max(0.2, 1.0 - uCorte)) * 0.85 + smoothstep(0.3, 1.0, abs(d.x)) * 0.25);
          vec3 cd = mix(d0, d1, smoothstep(0.0, 1.0, (uCorte - q.y) / max(0.2, uCorte)) * 0.85 + smoothstep(0.3, 1.0, abs(d.x)) * 0.25);
          c = mix(cd, cf, arriba);
        } else {
          c = mix(mix(f0, f1, smoothstep(0.0, 0.62, r)), f1 * 0.45, smoothstep(0.5, 1.2, r));
        }
        c += (h(gl_FragCoord.xy) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  useEffect(() => {
    const u = mat.uniforms;
    if (escena === 'membrana') { u.uModo.value = 0; u.f0.value.set('#1a4a5c'); u.f1.value.set('#081c27'); }
    else if (escena === 'vegetal') { u.uModo.value = 1; u.f0.value.set('#1d4038'); u.f1.value.set('#08151a'); }
    else { u.uModo.value = 1; u.f0.value.set('#1f4a58'); u.f1.value.set('#081a23'); }
  }, [escena, mat]);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 16, 12), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const malla = useRef<THREE.Mesh>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera }) => {
    const pr = gl.getPixelRatio();
    mat.uniforms.uRes.value.set(size.width * pr, size.height * pr);
    // altura en pantalla de la bicapa (en el plano del corte)
    v.set(0, 0, 0).project(camera);
    mat.uniforms.uCorte.value = THREE.MathUtils.clamp(v.y * 0.5 + 0.5, 0.05, 0.95);
    if (malla.current) { malla.current.position.copy(camera.position); malla.current.scale.setScalar((camera as THREE.PerspectiveCamera).far * 0.9); }
  });
  return <mesh ref={malla} geometry={geo} material={mat} renderOrder={-100} frustumCulled={false} raycast={() => null} />;
}

/** Lo que queda fuera de foco (bokeh): en la membrana, el medio de cada lado; en la célula, otros glóbulos. */
function Bokeh({ alta, escena, dt }: { alta: boolean; escena: Escena; dt: () => number }) {
  const n = escena === 'membrana' ? (alta ? 70 : 45) : alta ? 200 : 110;
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const { geo, vel } = useMemo(() => {
    let s = 7741;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tam = new Float32Array(n), vel = new Float32Array(n * 3);
    const membrana = escena === 'membrana';
    const k = membrana ? 1 : escena === 'vegetal' ? 6 : 1.4;
    const palF = ['#8fd3e8', '#a9e3d6', '#cfe8f2'].map((h) => new THREE.Color(h));
    const palD = ['#f0a7a0', '#e9b48c', '#d98fa3'].map((h) => new THREE.Color(h));
    const palC = ['#e0505a', '#c93a48', '#f08a7c', '#9fd3e0'].map((h) => new THREE.Color(h));
    for (let i = 0; i < n; i++) {
      let x: number, y: number, z: number, c: THREE.Color;
      if (membrana) {
        const arriba = rnd() < 0.55;
        x = (rnd() - 0.5) * 120; z = -14 - rnd() * 60; y = (arriba ? 1 : -1) * (3.5 + rnd() * 26);
        c = arriba ? palF[Math.floor(rnd() * 3)] : palD[Math.floor(rnd() * 3)];
      } else {
        const r = 14 + 40 * Math.pow(rnd(), 0.7), th = rnd() * Math.PI * 2;
        x = Math.cos(th) * r * 1.4; y = (rnd() - 0.5) * r * 1.1; z = -10 - rnd() * 55;
        c = palC[Math.floor(rnd() * palC.length)];
      }
      pos[3 * i] = x * k; pos[3 * i + 1] = y * k; pos[3 * i + 2] = z * k;
      const b = membrana ? 0.12 + 0.18 * rnd() : 0.22 + 0.32 * rnd();
      col[3 * i] = c.r * b; col[3 * i + 1] = c.g * b; col[3 * i + 2] = c.b * b;
      tam[i] = (membrana ? 2.2 : 1.6) * k * (0.35 + 1.4 * rnd() * rnd());
      vel[3 * i] = (rnd() - 0.5) * 0.25 * k; vel[3 * i + 1] = (rnd() - 0.5) * 0.15 * k; vel[3 * i + 2] = (rnd() - 0.5) * 0.2 * k;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
    return { geo: g, vel };
  }, [n, escena]);
  const mat = useMemo(() => materialBokeh(), []);
  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const pr = gl.getPixelRatio();
    mat.uniforms.uEscala.value = (size.height * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    const d = dt();
    if (!d) return;
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < n * 3; i++) (p.array as Float32Array)[i] += vel[i] * d;
    p.needsUpdate = true;
  });
  return <points geometry={geo} material={mat} renderOrder={1} frustumCulled={false} raycast={() => null} />;
}

/** Luz de estudio: clave cálida con sombra suave, relleno frío y contraluces. `k` = escala de la vista. */
function Luces({ calidad, escena }: { calidad: Calidad; escena: Escena }) {
  const clave = useRef<THREE.DirectionalLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  const k = escena === 'membrana' ? 1 : escena === 'vegetal' ? 1.9 : 0.36;
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -26 * k; c.right = 26 * k; c.top = 18 * k; c.bottom = -18 * k; c.near = 1; c.far = 120 * k; c.updateProjectionMatrix();
    l.shadow.bias = -0.0004; l.shadow.normalBias = 0.03 * k; l.shadow.radius = 5;
    l.shadow.needsUpdate = true;
  }, [k]);
  return (
    <>
      <hemisphereLight args={['#d8eef8', '#2a1218', 0.4]} />
      <directionalLight ref={clave} position={[-16 * k, 26 * k, 22 * k]} intensity={1.55} color="#fff0e0" castShadow shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      <directionalLight position={[20 * k, 6 * k, 18 * k]} intensity={0.45} color="#c8e0ff" />
      <directionalLight position={[8 * k, 14 * k, -26 * k]} intensity={0.95} color="#bfe8ff" />
      <directionalLight position={[-18 * k, -12 * k, -10 * k]} intensity={0.5} color="#ffd2c8" />
    </>
  );
}

const TONO_ACES = 6;
/** Bloom moderado SÓLO en lo que emite (el destello de la fosforilación, HDR > 1) + ACES + viñeta. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.5} luminanceThreshold={1.3} luminanceSmoothing={0.2} radius={0.5} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.5} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number) {
  const cam = new THREE.PerspectiveCamera(fov, aspecto, 0.05, 600);
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
    let lo = 0.5, hi = 400;
    for (let i = 0; i < 44; i++) { const m = (lo + hi) / 2; const b = caja(m); if ((b.x1 - b.x0) / 2 <= mx && (b.y1 - b.y0) / 2 <= my) hi = m; else lo = m; }
    d = hi;
    const b = caja(d);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const medioAlto = d * Math.tan(THREE.MathUtils.degToRad(fov) / 2), medioAncho = medioAlto * aspecto;
    const derecha = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const arriba = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    tgt.addScaledVector(derecha, cx * medioAncho).addScaledVector(arriba, cy * medioAlto);
  }
  return { pos: tgt.clone().addScaledVector(dir, d), objetivo: tgt, d };
}

const dirDe = (elev: number, az: number) => {
  const el = THREE.MathUtils.degToRad(elev), a = THREE.MathUtils.degToRad(az);
  return new THREE.Vector3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)).normalize();
};
const ENCUADRE: Record<Escena, { dir: THREE.Vector3; objetivo: THREE.Vector3; puntos: () => THREE.Vector3[]; my: number; cerca: number }> = {
  membrana: { dir: dirDe(15, -8), objetivo: new THREE.Vector3(0, 0, -1.5), puntos: puntosMembrana, my: 0.64, cerca: 0.5 },
  celula: { dir: dirDe(10, 0), objetivo: new THREE.Vector3(0, 0, 0), puntos: puntosCelula, my: 0.62, cerca: 0.2 },
  animal: { dir: dirDe(10, 0), objetivo: new THREE.Vector3(0, 0, 0), puntos: puntosCelula, my: 0.62, cerca: 0.2 },
  vegetal: { dir: dirDe(14, -10), objetivo: new THREE.Vector3(0, 0, 0), puntos: puntosVegetal, my: 0.62, cerca: 1 },
};
const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function Camara({ escena, reducido, encuadre }: { escena: Escena; reducido: boolean; encuadre: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const size = useThree((s) => s.size);
  const usuario = useRef(false);
  const primera = useRef(true);
  const ultima = useRef(escena);
  const anim = useRef<{ p0: THREE.Vector3; p1: THREE.Vector3; o0: THREE.Vector3; o1: THREE.Vector3; t: number } | null>(null);
  useEffect(() => {
    if (!controls) return;
    if (DEV) camera.userData.__ctl = controls;
    const f = () => { usuario.current = true; anim.current = null; };
    controls.addEventListener('start', f);
    return () => controls.removeEventListener('start', f);
  }, [controls, camera]);
  const aspecto = size.width / Math.max(1, size.height);
  const ultimoEncuadre = useRef(encuadre);
  useLayoutEffect(() => {
    if (!controls) return;
    if (ultimoEncuadre.current !== encuadre) { ultimoEncuadre.current = encuadre; usuario.current = false; }
    const cambio = ultima.current !== escena;
    ultima.current = escena;
    if (cambio) usuario.current = false;
    if (!primera.current && usuario.current) return;
    const e = ENCUADRE[escena];
    // apaisado: el objeto ocupa ~62–64 % del alto; en vertical manda el ancho
    const p = encuadrar(e.dir, e.objetivo, e.puntos(), camera.fov, aspecto, 0.9, e.my);
    camera.near = e.cerca; camera.far = Math.max(200, p.d * 8); camera.updateProjectionMatrix();
    const ctl = controls as unknown as { minDistance: number; maxDistance: number };
    ctl.minDistance = p.d * 0.35; ctl.maxDistance = p.d * 2.2;
    if (primera.current || reducido || cambio) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      anim.current = null;
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, escena, camera, reducido, encuadre]);
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

/** RELOJ ÚNICO: avanza el reloj de la vista activa antes que nada del cuadro (prioridad negativa). */
function Motor({ relojE, relojR, vista }: { relojE: Transporte3DProps['relojE']; relojR: Transporte3DProps['relojR']; vista: VistaB2 }) {
  useFrame((_, dt) => {
    const ahora = performance.now();
    if (vista === 'reto') relojR.current.paso(dt, ahora); else relojE.current.paso(dt, ahora);
  }, -1);
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

type DatoRotulo = { texto: string; x: number; y: number } | null;

const ROTULOS_CELULA: RotuloB2[] = [
  { id: 'glo', texto: 'Glóbulo rojo', ancla: [R_E * 0.9, R_E * 0.55, 0] },
  { id: 'pla', texto: 'Plasma (medio)', ancla: [-R_E * 1.6, R_E * 1.05, 0] },
  { id: 'agu', texto: 'Agua (gotas de 0,2 fL)', ancla: [-R_E * 1.15, -R_E * 0.75, 0.5] },
];
const ROTULOS_VEGETAL: RotuloB2[] = [
  { id: 'par', texto: 'Pared celular', ancla: [-20, 14.5, 0] },
  { id: 'pro', texto: 'Membrana y citoplasma', ancla: [14, 9, -4] },
  { id: 'vac', texto: 'Vacuola', ancla: [4, 0, -6] },
  { id: 'nuc', texto: 'Núcleo', ancla: [-15.5, 4.5, -5] },
];
const rotulosDe = (e: Escena): RotuloB2[] => (e === 'membrana' ? ROTULOS_MEMBRANA : e === 'vegetal' ? ROTULOS_VEGETAL : ROTULOS_CELULA);

function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloB2[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
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

function DiagnosticoDev({ relojE, relojR, calidad, escena }: { relojE: Transporte3DProps['relojE']; relojR: Transporte3DProps['relojR']; calidad: Calidad; escena: Escena }) {
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
    const w = window as unknown as { __bio02?: unknown };
    w.__bio02 = {
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
          if (c) conCero.push(`${(o.userData?.pieza as string) || o.name || g.type}:${c}`);
          normalesCero += c;
        });
        const m = medida.current;
        return { mallas, normalesCero, conCero, llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, escena, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const e = relojE.current, l = e.lectura, r = relojR.current;
        let volMalla: number | null = null;
        scene.traverse((o) => { if (o.userData?.pieza === 'globulo') volMalla = ((o as THREE.Mesh).geometry.userData.volumen as number) ?? null; });
        return {
          escena,
          exploracion: { t: e.estado.t, factor: e.factor, pausa: e.pausa, medio: e.medio, V: l.V, vRel: l.vRel, dVdt: l.dVdt, tonicidad: l.tonicidad, osmIn: l.osmIn, gIn: l.gIn, sat: l.sat, pO2In: l.pO2In, ciclos: l.bomba.ciclos, giros: l.glut.giros, neto: l.glut.neto, aguaTetramero: l.aguaTetramero, o2Parche: l.o2Parche, generacion: e.generacion, tAnim: e.tAnim, historia: e.historia.length },
          reto: { V: r.V, t: r.t, lisada: r.lisada, tendencia: r.tendencia, dVdt: r.dVdt, cfg: { ...r.cfg, osm0: undefined }, factor: r.factor, historia: r.historia.length },
          volMalla,
        };
      },
      camara(px: number, py: number, pz: number, tx: number, ty: number, tz: number) {
        const ctl = (camera.userData.__ctl as OrbitControlsImpl | undefined);
        camera.position.set(px, py, pz);
        if (ctl) { ctl.target.set(tx, ty, tz); ctl.update(); } else camera.lookAt(tx, ty, tz);
        return true;
      },
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const rc = gl.domElement.getBoundingClientRect();
        return { x: rc.left + (v.x * 0.5 + 0.5) * rc.width, y: rc.top + (-v.y * 0.5 + 0.5) * rc.height };
      },
      proteinas: { aqp: PROT.aqp.toArray(), glut: PROT.glut.toArray(), bomba: PROT.bomba.toArray() },
      /** sólo desarrollo: triángulos por pieza (sin contar la pasada de sombras) */
      presupuesto() {
        const out: Record<string, number> = {};
        scene.traverse((o) => {
          const m = o as THREE.Mesh; if (!m.isMesh || !o.visible) return;
          const g = m.geometry; const n = g.index ? g.index.count / 3 : g.getAttribute('position').count / 3;
          const k = (m as unknown as THREE.InstancedMesh).isInstancedMesh ? (m as unknown as THREE.InstancedMesh).count : 1;
          let p: THREE.Object3D | null = o; while (p && !p.userData?.pieza) p = p.parent;
          const clave = `${(p?.userData?.pieza as string) ?? 'otro'}${m.castShadow ? '*' : ''}`;
          out[clave] = (out[clave] ?? 0) + Math.round(n * k);
        });
        return out;
      },
      instancias() {
        const out: Record<string, number> = {};
        scene.traverse((o) => { const m = o as THREE.InstancedMesh; if (m.isInstancedMesh) out[(o.userData?.pieza as string) || m.uuid.slice(0, 6)] = m.count; });
        return out;
      },
    };
    return () => { delete w.__bio02; };
  }, [gl, scene, camera, relojE, relojR, calidad, escena]);
  return null;
}

// ───────────────────────────── contenido ─────────────────────────────

function Contenido({ p, rotulo, publicarRotulos, nodos }: {
  p: Transporte3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloB2[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { relojE, relojR, vista, calidad, reducido, encuadre = 0, tipoReto } = p;
  const escena = escenaDe(vista, tipoReto);
  const alta = calidad === 'alta';
  const rotulos = useMemo<RotuloB2[]>(() => (p.rotulos ? rotulosDe(escena).slice(0, 8) : []), [p.rotulos, escena]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    let texto: string | null = null;
    if (pieza) texto = (escena === 'membrana' ? ROTULO_PIEZA_MEMBRANA[pieza] : ROTULO_PIEZA_CELULA[pieza]) ?? null;
    if (pieza === 'hb') texto = `Hemoglobina · ${Math.round(relojE.current.lectura.sat * 100)} % con O₂`;
    rotulo.current(texto ? { texto, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };
  const dt = () => (vista === 'reto' ? relojR.current.dtPantalla : relojE.current.dtPantalla);
  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Motor relojE={relojE} relojR={relojR} vista={vista} />
      <Camara escena={escena} reducido={reducido} encuadre={encuadre} />
      <Cielo escena={escena} />
      <Niebla escena={escena} />
      <Bokeh alta={alta} escena={escena} dt={dt} />
      <Luces calidad={calidad} escena={escena} />
      {escena === 'membrana' && <VistaMembrana reloj={relojE} calidad={calidad} />}
      {escena === 'celula' && <VistaCelula reloj={relojE} calidad={calidad} />}
      {(escena === 'animal' || escena === 'vegetal') && <VistaReto key={escena} reloj={relojR} calidad={calidad} />}
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} />
      <DiagnosticoDev relojE={relojE} relojR={relojR} calidad={calidad} escena={escena} />
    </group>
  );
}

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[260px] rounded-md border border-white/15 bg-[#0a1820]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-b2="">
      {d.texto}
    </div>
  );
}

export default function Transporte3DScene(props: Transporte3DProps) {
  const { calidad, vista, tipoReto } = props;
  const alta = calidad === 'alta';
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloB2[]>([]);
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-b2="" data-vista-b2={vista} data-escena-b2-tipo={escenaDe(vista, tipoReto)}>
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 6, 40], fov: 30, near: 0.5, far: 400 }}
      >
        <Ajustes calidad={calidad} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.09} enablePan={false} minDistance={4} maxDistance={160} maxPolarAngle={Math.PI * 0.8} />
        <Contenido p={props} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} />
        <AvisarListo onListo={props.onListo} />
        {alta && <Posproceso />}
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0a1820]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-b2={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
