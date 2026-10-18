"use client";
/**
 * B6 · Selección natural — la escena 3D (R3F). Un claro de robledal en Inglaterra, a tamaño real:
 * el roble principal (60 cm de diámetro), sus polillas Biston betularia (5,5 cm) y los carboneros
 * que las cazan (14 cm). Dos vistas:
 *
 *   · BOSQUE (inicial): el modelo completo corre solo. Las aves cazan, las generaciones pasan (cada
 *     relevo es una noche: las supervivientes se van y llegan sus hijas) y el hollín de la corteza
 *     es el del control. Nada se resalta: el contraste con la corteza es lo único que delata.
 *   · RETO: la población del store en el roble; el alumno es el ave (clic sobre lo que vea).
 *
 * RELOJ ÚNICO. El reloj activo avanza aquí, en un useFrame de prioridad −1 (antes de dibujar); las
 * piezas, el dock y la barra de lecturas leen ese mismo objeto.
 *
 * Sin texto ni gráficas en el 3D: los rótulos de piezas son DOM, apagados por defecto (aparecen al
 * pasar el ratón o con «Rótulos», ≤ 8 y sin solaparse). En el reto, ni el cursor ni los rótulos
 * delatan a una polilla camuflada.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { Calidad } from '../_kit';
import { Bosque, Polillas, Aves, Aire, type Fuente } from './piezas';
import { cajaEncuadre, puntoTronco, PERCHAS, type V3 } from './bosque';
import { albedoMedidoCorteza } from './materiales';
import { albedoCorteza } from './seleccion';
import type { RelojBosque, RelojReto, VistaB6 } from './reloj';

export interface Seleccion3DProps {
  relojB: React.MutableRefObject<RelojBosque>;
  relojR: React.MutableRefObject<RelojReto>;
  vista: VistaB6;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** sube para volver al encuadre automático */
  encuadre?: number;
  onListo?: () => void;
  /** reto: el alumno caza la polilla `id` */
  onCazar?: (id: number) => void;
}

const DEV = process.env.NODE_ENV !== 'production';

// ───────────────────────────── ambiente ─────────────────────────────

const COLORES = {
  horizonte: new THREE.Color('#c4d6c9'), horizonteHumo: new THREE.Color('#a39a83'), horizonteNoche: new THREE.Color('#27324a'),
  arriba: new THREE.Color('#34513a'), arribaHumo: new THREE.Color('#3b3a31'), arribaNoche: new THREE.Color('#0c1220'),
  abajo: new THREE.Color('#5a4a35'),
};

function colorDeAmbiente(out: THREE.Color, dia: THREE.Color, humo: THREE.Color, noche: THREE.Color, h: number, n: number) {
  return out.copy(dia).lerp(humo, h).lerp(noche, n);
}

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.24;
    scene.background = new THREE.Color('#9fb2a6');
    return () => { scene.environment = null; scene.background = null; env.dispose(); pm.dispose(); };
  }, [gl, scene, calidad]);
  return null;
}

/** Cielo del bosque: bruma luminosa en el horizonte entre los troncos y el dosel oscuro arriba. */
function Cielo({ fuente }: { fuente: Fuente }) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: { cH: { value: new THREE.Color() }, cA: { value: new THREE.Color() }, cB: { value: COLORES.abajo.clone() }, uSol: { value: new THREE.Vector3(-0.45, 0.62, -0.64).normalize() }, uBrillo: { value: 1 } },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: /* glsl */ `
      uniform vec3 cH; uniform vec3 cA; uniform vec3 cB; uniform vec3 uSol; uniform float uBrillo; varying vec3 vDir;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vDir);
        vec3 c = d.y > 0.0 ? mix(cH, cA, smoothstep(0.02, 0.55, d.y)) : mix(cH, cB, smoothstep(0.0, 0.25, -d.y));
        // resplandor del sol filtrado por el dosel
        c += vec3(1.0, 0.93, 0.78) * pow(max(0.0, dot(d, uSol)), 9.0) * 0.32 * uBrillo;
        c += (h(gl_FragCoord.xy) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }), []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 24, 16), []);
  useEffect(() => () => { mat.dispose(); geo.dispose(); }, [mat, geo]);
  const malla = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    const f = fuente();
    colorDeAmbiente(mat.uniforms.cH.value, COLORES.horizonte, COLORES.horizonteHumo, COLORES.horizonteNoche, f.hollin, f.noche);
    colorDeAmbiente(mat.uniforms.cA.value, COLORES.arriba, COLORES.arribaHumo, COLORES.arribaNoche, f.hollin, f.noche);
    mat.uniforms.uBrillo.value = (1 - f.noche) * (1 - 0.5 * f.hollin);
    if (malla.current) { malla.current.position.copy(camera.position); malla.current.scale.setScalar((camera as THREE.PerspectiveCamera).far * 0.9); }
  });
  return <mesh ref={malla} geometry={geo} material={mat} renderOrder={-100} frustumCulled={false} raycast={() => null} />;
}

/** Niebla de profundidad del color de la bruma: los robles lejanos se funden en ella. */
function Niebla({ fuente }: { fuente: Fuente }) {
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  useLayoutEffect(() => {
    scene.fog = new THREE.Fog('#c4d6c9', 40, 200);
    return () => { scene.fog = null; };
  }, [scene]);
  useFrame(() => {
    const f = fuente();
    const fog = scene.fog as THREE.Fog | null; if (!fog) return;
    colorDeAmbiente(fog.color, COLORES.horizonte, COLORES.horizonteHumo, COLORES.horizonteNoche, f.hollin, f.noche);
    const d = controls ? camera.position.distanceTo(controls.target) : 40;
    // con hollín el aire es más espeso (esmog)
    fog.near = d * (1.0 - 0.2 * f.hollin);
    fog.far = d * (3.2 - 0.8 * f.hollin);
  });
  return null;
}

/** Luz de bosque: sol cálido con sombra suave, cielo filtrado por el dosel, relleno y contraluz. */
function Luces({ fuente, calidad }: { fuente: Fuente; calidad: Calidad }) {
  const sol = useRef<THREE.DirectionalLight>(null), hemi = useRef<THREE.HemisphereLight>(null);
  const relleno = useRef<THREE.DirectionalLight>(null), contra = useRef<THREE.DirectionalLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  const obj = useMemo(() => { const o = new THREE.Object3D(); o.position.set(0, 8, -2); return o; }, []);
  useLayoutEffect(() => {
    const l = sol.current; if (!l) return;
    l.target = obj;
    const c = l.shadow.camera as THREE.OrthographicCamera;
    c.left = -15; c.right = 15; c.top = 15; c.bottom = -12; c.near = 5; c.far = 110; c.updateProjectionMatrix();
    l.shadow.bias = -0.0005; l.shadow.normalBias = 0.04; l.shadow.radius = 4;
    l.shadow.needsUpdate = true;
  }, [obj, mapa]);
  const c = useMemo(() => ({
    sol: new THREE.Color('#fff0d8'), solHumo: new THREE.Color('#ffd49a'), solNoche: new THREE.Color('#8ea6ff'),
    cielo: new THREE.Color('#d6e6ff'), cieloHumo: new THREE.Color('#c9bea2'), cieloNoche: new THREE.Color('#41558a'),
    tmp: new THREE.Color(),
  }), []);
  useFrame(() => {
    const f = fuente();
    const dia = 1 - f.noche;
    if (sol.current) { sol.current.intensity = (2.9 - 0.7 * f.hollin) * (0.12 + 0.88 * dia); colorDeAmbiente(sol.current.color, c.sol, c.solHumo, c.solNoche, f.hollin, f.noche); }
    if (hemi.current) { hemi.current.intensity = 0.5 * (0.5 + 0.5 * dia); colorDeAmbiente(hemi.current.color, c.cielo, c.cieloHumo, c.cieloNoche, f.hollin, f.noche); }
    if (relleno.current) relleno.current.intensity = 0.22 * (0.5 + 0.5 * dia);
    if (contra.current) contra.current.intensity = (1.1 - 0.3 * f.hollin) * (0.2 + 0.8 * dia);
  });
  return (
    <>
      <primitive object={obj} />
      <hemisphereLight ref={hemi} args={['#d6e6ff', '#5a4632', 0.5]} />
      <directionalLight ref={sol} position={[-34, 32, 16]} intensity={2.9} color="#fff0d8" castShadow shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      <directionalLight ref={relleno} position={[22, 10, 24]} intensity={0.22} color="#d5e4ff" />
      <directionalLight ref={contra} position={[16, 22, -34]} intensity={1.1} color="#ffdcae" />
    </>
  );
}

const TONO_ACES = 6;
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.32} luminanceThreshold={1.15} luminanceSmoothing={0.25} radius={0.55} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.32} darkness={0.5} />
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
const DIRECCION = dirDe(2, 9);
const PUNTOS_CAJA = cajaEncuadre().puntos.map((p) => new THREE.Vector3(...p));
const CENTRO_CAJA = PUNTOS_CAJA.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / PUNTOS_CAJA.length);
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
    if (!primera.current && usuario.current) return;
    // apaisado: la franja con las aves ocupa ~70 % del alto; en vertical manda el ancho
    const p = encuadrar(DIRECCION, CENTRO_CAJA, PUNTOS_CAJA, camera.fov, aspecto, 0.94, 0.7);
    camera.near = 0.3; camera.far = Math.max(600, p.d * 12); camera.updateProjectionMatrix();
    const ctl = controls as unknown as { minDistance: number; maxDistance: number };
    ctl.minDistance = p.d * 0.4; ctl.maxDistance = p.d * 1.8;
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      anim.current = null;
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, camera, reducido, encuadre]);
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
function Motor({ relojB, relojR, vista }: { relojB: Seleccion3DProps['relojB']; relojR: Seleccion3DProps['relojR']; vista: VistaB6 }) {
  useFrame((_, dt) => {
    const ahora = performance.now();
    if (vista === 'reto') relojR.current.paso(dt, ahora); else relojB.current.paso(dt, ahora);
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
interface RotuloB6 { id: string; texto: string; ancla: (f: ReturnType<Fuente>) => V3 | null }

const primeraPosada = (f: ReturnType<Fuente>, fen: 'clara' | 'oscura'): V3 | null => {
  const p = f.polillas.find((x) => x.modo === 'posada' && x.visible && x.fenotipo === fen && Math.abs(x.lugar.th) < 0.6);
  return p ? [p.pos[0], p.pos[1] + 0.12, p.pos[2]] : null;
};
const ROTULOS_BOSQUE: RotuloB6[] = [
  { id: 'ave', texto: 'Carbonero común · depredador', ancla: (f) => { const a = f.avesEsc.find((x) => x.i === 0 && x.visible); return a ? [a.pos[0], a.pos[1] + 0.5, a.pos[2]] : PERCHAS[0]; } },
  { id: 'typ', texto: 'Polilla typica (clara)', ancla: (f) => primeraPosada(f, 'clara') },
  { id: 'car', texto: 'Polilla carbonaria (oscura)', ancla: (f) => primeraPosada(f, 'oscura') },
  { id: 'cor', texto: 'Corteza: líquenes y hollín', ancla: () => puntoTronco(-0.72, 2.1, 0.1) },
];
const ROTULOS_RETO: RotuloB6[] = [
  { id: 'ave', texto: 'Carbonero · el ave eres tú', ancla: (f) => { const a = f.avesEsc[0]; return a ? [a.pos[0], a.pos[1] + 0.5, a.pos[2]] : PERCHAS[0]; } },
  { id: 'cor', texto: 'Corteza de roble', ancla: () => puntoTronco(-0.72, 2.1, 0.1) },
];
const HOVER: Record<string, (h: number) => string> = {
  'polilla-clara': () => 'Polilla typica (clara) · genotipo cc',
  'polilla-oscura': () => 'Polilla carbonaria (oscura) · CC o Cc',
  ave: () => 'Carbonero común (Parus major)',
  roble: (h) => `Corteza de roble · ${Math.round(h * 100)} % cubierta de hollín`,
  rama: () => 'Rama de roble (percha de las aves)',
};

function ProyectorRotulos({ rotulos, nodos, fuente }: { rotulos: RotuloB6[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>>; fuente: Fuente }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (rotulos.length === 0) return;
    const f = fuente();
    const cajas: { x: number; y: number; w: number; h: number }[] = [];
    const lista = rotulos.slice(0, 8).map((r) => {
      const a = r.ancla(f);
      if (!a) return { r, x: -9999, y: -9999, z: 2 };
      v.set(a[0], a[1], a[2]).project(camera);
      return { r, x: (v.x * 0.5 + 0.5) * size.width, y: (-v.y * 0.5 + 0.5) * size.height, z: v.z };
    }).sort((a, b) => a.y - b.y);
    for (const it of lista) {
      const el = nodos.current.get(it.r.id); if (!el) continue;
      if (it.z >= 1) { el.style.opacity = '0'; continue; }
      const w = el.offsetWidth || 110, h = el.offsetHeight || 22;
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

function DiagnosticoDev({ relojB, relojR, vista, calidad }: { relojB: Seleccion3DProps['relojB']; relojR: Seleccion3DProps['relojR']; vista: VistaB6; calidad: Calidad }) {
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
    const w = window as unknown as { __bio06?: unknown };
    const aPantalla = (x: number, y: number, z: number) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      const rc = gl.domElement.getBoundingClientRect();
      return { x: rc.left + (v.x * 0.5 + 0.5) * rc.width, y: rc.top + (-v.y * 0.5 + 0.5) * rc.height, dentro: Math.abs(v.x) < 1 && Math.abs(v.y) < 1 && v.z < 1 };
    };
    w.__bio06 = {
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
        return { mallas, normalesCero, conCero, llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, vista, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const b = relojB.current, r = relojR.current;
        const cuenta = (ps: { visible: boolean; modo: string; fenotipo: string }[]) => ({
          claras: ps.filter((p) => p.visible && p.modo === 'posada' && p.fenotipo === 'clara').length,
          oscuras: ps.filter((p) => p.visible && p.modo === 'posada' && p.fenotipo === 'oscura').length,
        });
        return {
          vista,
          bosque: {
            gen: b.gen, anio: b.anio, fase: b.fase, hollin: b.hollin, aves: b.aves, N: b.N, pC: b.pC, durDia: b.durDia, durGen: b.durGeneracion, noche: b.noche,
            temporada: b.temporada, posadas: cuenta(b.polillas), avesModo: b.avesEsc.map((a) => `${a.i}:${a.modo}`), historia: b.historia.length,
            pronostico: b.pronostico && { g0: b.pronostico.g0, fijaC: b.pronostico.fijaC, pierdeC: b.pronostico.pierdeC, tFijaC: b.pronostico.tFijaC },
            seleccion: b.seleccion, velocidad: b.velocidad, pausa: b.pausa, t: b.t,
          },
          reto: { hollin: r.hollin, posadas: cuenta(r.polillas), ave: r.avesEsc.map((a) => `${a.modo}:${a.cola.length}`), noche: r.noche },
        };
      },
      /** sólo desarrollo: dónde está en pantalla cada polilla posada del reloj activo (para las sondas) */
      polillasEnPantalla() {
        const fuente = vista === 'reto' ? relojR.current : relojB.current;
        return fuente.polillas.filter((p) => p.visible && p.modo === 'posada' && !p.marcada).map((p) => ({ id: p.id, fenotipo: p.fenotipo, ...aPantalla(p.pos[0], p.pos[1], p.pos[2]) }));
      },
      albedo(h: number) { return { medido: albedoMedidoCorteza(h), modelo: albedoCorteza(h) }; },
      camara(px: number, py: number, pz: number, tx: number, ty: number, tz: number) {
        const ctl = (camera.userData.__ctl as OrbitControlsImpl | undefined);
        camera.position.set(px, py, pz);
        if (ctl) { ctl.target.set(tx, ty, tz); ctl.update(); } else camera.lookAt(tx, ty, tz);
        return true;
      },
      aPantalla,
      /** sólo desarrollo: qué atraviesa un rayo desde el punto (x, y) de la ventana */
      rayo(x: number, y: number) {
        const rc = gl.domElement.getBoundingClientRect();
        const ray = new THREE.Raycaster();
        ray.setFromCamera(new THREE.Vector2(((x - rc.left) / rc.width) * 2 - 1, -((y - rc.top) / rc.height) * 2 + 1), camera);
        return ray.intersectObject(scene, true).slice(0, 6).map((h) => {
          let p: THREE.Object3D | null = h.object; while (p && !p.userData?.pieza) p = p.parent;
          return `${(p?.userData?.pieza as string) ?? h.object.type}${h.instanceId !== undefined ? '#' + h.instanceId : ''}@${h.distance.toFixed(2)}`;
        });
      },
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
    };
    return () => { delete w.__bio06; };
  }, [gl, scene, camera, relojB, relojR, calidad, vista]);
  return null;
}

// ───────────────────────────── contenido ─────────────────────────────

function Contenido({ p, rotulo, publicarRotulos, nodos }: {
  p: Seleccion3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloB6[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { relojB, relojR, vista, calidad, reducido, encuadre = 0, onCazar } = p;
  const reto = vista === 'reto';
  const fuente = useMemo<Fuente>(() => () => (reto ? relojR.current : relojB.current), [reto, relojB, relojR]);
  const rotulos = useMemo<RotuloB6[]>(() => (p.rotulos ? (reto ? ROTULOS_RETO : ROTULOS_BOSQUE) : []), [p.rotulos, reto]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);
  const hover = (e: ThreeEvent<PointerEvent>, pieza: string) => {
    e.stopPropagation();
    const fn = HOVER[pieza];
    rotulo.current(fn ? { texto: fn(fuente().hollin), x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };
  return (
    <group onPointerOut={() => rotulo.current(null)}>
      <Motor relojB={relojB} relojR={relojR} vista={vista} />
      <Camara reducido={reducido} encuadre={encuadre} />
      <Cielo fuente={fuente} />
      <Niebla fuente={fuente} />
      <Luces fuente={fuente} calidad={calidad} />
      {/* en el reto la corteza no lleva rótulo al pasar el ratón: taparía las polillas mientras se caza */}
      <Bosque fuente={fuente} calidad={calidad} onHover={reto ? undefined : hover} />
      {/* en el reto, pasar el ratón por una polilla NO dice nada (delataría a las camufladas) */}
      <Polillas key={vista} fuente={fuente} onCazar={reto ? onCazar : undefined} onHover={reto ? undefined : hover} />
      <Aves fuente={fuente} onHover={hover} />
      <Aire fuente={fuente} calidad={calidad} />
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} fuente={fuente} />
      <DiagnosticoDev relojB={relojB} relojR={relojR} vista={vista} calidad={calidad} />
    </group>
  );
}

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[260px] rounded-md border border-white/15 bg-[#0d1a14]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-b6="">
      {d.texto}
    </div>
  );
}

export default function SeleccionNatural3DScene(props: Seleccion3DProps) {
  const { calidad, vista } = props;
  const alta = calidad === 'alta';
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloB6[]>([]);
  return (
    <div className={`absolute inset-0 ${vista === 'reto' ? 'cursor-crosshair' : ''}`} data-calidad={calidad} data-escena-b6="" data-vista-b6={vista}>
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [4, 8, 40], fov: 30, near: 0.3, far: 600 }}
      >
        <Ajustes calidad={calidad} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.09} enablePan={false}
          minPolarAngle={Math.PI * 0.3} maxPolarAngle={Math.PI * 0.56} minAzimuthAngle={-1.1} maxAzimuthAngle={1.1} />
        <Contenido p={props} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} />
        <AvisarListo onListo={props.onListo} />
        {alta && <Posproceso />}
      </Canvas>
      <RotuloRaton fijar={rotulo} />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {lista.map((r) => (
          <div key={r.id} ref={(el) => { if (el) nodos.current.set(r.id, el); else nodos.current.delete(r.id); }}
            className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-white/20 bg-[#0d1a14]/85 px-2 py-0.5 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-b6={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
