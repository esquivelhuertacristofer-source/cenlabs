"use client";
/**
 * Q10 · Destilación fraccionada — la columna de platos en 3D (R3F), a escala real (1 u = 10 cm).
 *
 *   Columna DN80 de vidrio con 5 platos de campanas de burbujeo, cortada en MEDIA SECCIÓN
 *   (se ve por dentro: el líquido sobre cada plato, las campanas burbujeando, la cortina que cae
 *   por cada vertedero y el reflujo que entra arriba); cabeza con divisor de reflujo de embudo
 *   basculante y Pt100; condensador Dimroth; hervidor de 1 L en su manta; receptor graduado;
 *   alimentación con bomba peristáltica al plato 3.
 *
 * RELOJ ÚNICO. `reloj.current.paso(dt)` corre en un useFrame de prioridad −1: composición de
 * cada etapa (color), burbujas, gotas, embudo, manta y la escalera del dock salen del mismo cuadro.
 *
 * NO REGALAR. En el reto la escena no escribe ni la pureza que se alcanzará ni la consigna buena:
 * sólo se ve lo que vería el alumno (los colores son el código de composición, igual que en el dock).
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { KitContexto, ControlesBanco, Probeta, Liquido, Cable, esfera, type Calidad } from '../_kit';
import { N_PLATOS, colorComposicion } from './columna';
import type { RelojDestilacion } from './reloj';
import {
  COL, yPlato, CAMPANAS, BALON, MANTA, CABEZA, CONDENSADOR, RECEPTOR, PROBETA, BOMBA, FRASCO_ALIM, BASTIDOR, CONTROL,
  ySuperficieBalon, type V3,
} from './cotas';
import {
  useMatsQ10, Columna, EmbudoDivisor, Electroiman, VidrioCabeza, CondensadorDimroth, BalonHervidor, LiquidoBalon, Manta, Gato,
  RepisaReceptor, BombaPeristaltica, FrascoAlimentacion, Bastidor, CajaControl, Mesa, crearUniformesLiquido, crearMaterialLiquido,
  contarNormalesCero, MAX_ETAPAS_Q10, type MatsQ10,
} from './piezas';
import { cifra } from './formato';

export type VistaQ10 = 'columna' | 'montaje';
export interface RotuloQ10 { id: string; texto: string; ancla: V3 }

export interface Destilacion3DProps {
  reloj: React.MutableRefObject<RelojDestilacion>;
  /** el modo (el reloj ya lo sabe; aquí sólo hace volver a pintar los rótulos) */
  modo: "explorar" | "reto";
  vista: VistaQ10;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  encuadre?: number;
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#06090c';

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.1;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    // el plano de la media sección
    gl.localClippingEnabled = true;
    (gl as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = calidad === 'alta' ? 1 : 0.5;
    let tex: THREE.CanvasTexture | null = null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      // halo frío y alto detrás de la columna: el vidrio y el acero se recortan contra él
      const grad = g.createRadialGradient(256, 190, 10, 256, 230, 400);
      grad.addColorStop(0, '#34495c'); grad.addColorStop(0.45, '#17222d'); grad.addColorStop(1, FONDO);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      const img = g.getImageData(0, 0, 512, 512);
      let s = 1013;
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
    scene.environmentRotation.set(0, 2.3, 0);
    return () => { scene.environment = null; scene.background = null; scene.environmentRotation.set(0, 0, 0); env.dispose(); pm.dispose(); tex?.dispose(); };
  }, [gl, scene, calidad]);
  return null;
}

function Luces({ calidad }: { calidad: Calidad }) {
  const clave = useRef<THREE.SpotLight>(null);
  const mapa = calidad === 'alta' ? 2048 : 1024;
  useLayoutEffect(() => {
    const l = clave.current; if (!l) return;
    l.shadow.bias = -0.0003; l.shadow.normalBias = 0.02; l.shadow.radius = 6;
    l.shadow.camera.near = 4; l.shadow.camera.far = 32; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(0, 3.6, -0.3); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#c6d4e3', '#0a0c10', 0.6]} />
      {/* luz clave alta por delante a la izquierda: entra en el corte y dibuja platos y campanas */}
      <spotLight ref={clave} position={[-5.5, 13, 7.5]} angle={0.5} penumbra={0.85} decay={0} intensity={2.4} color="#fff1df" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* contraluz fría por detrás a la derecha: recorta el vidrio y los cantos del corte */}
      <directionalLight position={[5, 8, -6]} intensity={1.05} color="#cfe0ff" />
      <directionalLight position={[2, 4, 8]} intensity={0.22} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6;
/** Bloom moderado sólo en lo que emite (pilotos y manta caliente) + ACES + viñeta. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.45} luminanceThreshold={1.3} luminanceSmoothing={0.2} radius={0.5} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

function encuadrar(dir: THREE.Vector3, objetivo: THREE.Vector3, puntos: THREE.Vector3[], fov: number, aspecto: number, mx: number, my: number, tapa = 0) {
  const mxv = mx - tapa;
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
    let lo = 1, hi = 160;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; const b = caja(m); if ((b.x1 - b.x0) / 2 <= mxv && (b.y1 - b.y0) / 2 <= my) hi = m; else lo = m; }
    d = hi;
    const b = caja(d);
    const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
    const medioAlto = d * Math.tan(THREE.MathUtils.degToRad(fov) / 2), medioAncho = medioAlto * aspecto;
    const derecha = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const arriba = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    tgt.addScaledVector(derecha, (cx + tapa) * medioAncho).addScaledVector(arriba, cy * medioAlto);
  }
  return { pos: tgt.clone().addScaledVector(dir, d), objetivo: tgt };
}

const dirCamara = (elev: number, az: number) => {
  const el = THREE.MathUtils.degToRad(elev), a = THREE.MathUtils.degToRad(az);
  return new THREE.Vector3(Math.sin(a) * Math.cos(el), Math.sin(el), Math.cos(a) * Math.cos(el)).normalize();
};
// casi de frente al corte, un poco desde la derecha (el receptor queda a la vista) y algo alto
// (se ve la superficie del líquido de cada plato)
const DIR: Record<VistaQ10, THREE.Vector3> = { columna: dirCamara(9, 13), montaje: dirCamara(11, 15) };

function puntosEncuadre(vista: VistaQ10): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  if (vista === 'columna') {
    // la columna con sus bridas, de la brida inferior a la cabeza: es el OBJETO del fenómeno
    for (const y of [COL.yBase - 0.06, CABEZA.yTope]) for (const x of [-COL.bridaREx, COL.bridaREx]) P.push(new THREE.Vector3(x, y, 0), new THREE.Vector3(x, y, -COL.bridaREx));
    return P;
  }
  P.push(new THREE.Vector3(FRASCO_ALIM.pos[0] - FRASCO_ALIM.r, 0, FRASCO_ALIM.pos[2]));
  P.push(new THREE.Vector3(RECEPTOR.x + 0.45, 0, 0), new THREE.Vector3(CONTROL.pos[0] + 0.5, 0, CONTROL.pos[2] + 0.4));
  P.push(new THREE.Vector3(0, CONDENSADOR.yTope + 0.34, 0), new THREE.Vector3(-1, 0, 1), new THREE.Vector3(1, 0, 1));
  return P;
}
/**
 * Margen (NDC): la columna —de la brida inferior a la cabeza— ocupa el 64 % del alto del lienzo
 * en la vista «Columna»; el montaje entero, el 66 % en «Montaje» (estándar: 55–70 %).
 * `__qmi10.ocupacion()` lo mide.
 */
const MARGEN: Record<VistaQ10, [number, number]> = { columna: [0.9, 0.64], montaje: [0.92, 0.66] };
const OBJETIVO: Record<VistaQ10, V3> = { columna: [0, 4.9, 0], montaje: [0, 4.6, 0] };

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function useTapaPanel(lienzo: HTMLCanvasElement) {
  const [tapa, setTapa] = useState(0);
  useEffect(() => {
    const medir = () => {
      const panel = lienzo.closest('[data-lab-layout]')?.querySelector('[data-franja=lateral]');
      const rc = lienzo.getBoundingClientRect();
      let f = 0;
      if (panel && rc.width > 0) {
        const rp = panel.getBoundingClientRect();
        if (rp.left < rc.right - 1 && rp.right > rc.left) f = (rc.right - Math.max(rp.left, rc.left)) / rc.width;
      }
      const v = f > 0.6 ? 0 : Math.round(f * 100) / 100;
      setTapa((x) => (x === v ? x : v));
    };
    medir();
    const id = window.setInterval(medir, 400);
    return () => window.clearInterval(id);
  }, [lienzo]);
  return tapa;
}

function Camara({ vista, reducido, encuadre }: { vista: VistaQ10; reducido: boolean; encuadre: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const tapa = useTapaPanel(gl.domElement);
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
  const ultimo = useRef({ encuadre, vista });
  useLayoutEffect(() => {
    if (!controls) return;
    if (ultimo.current.encuadre !== encuadre || ultimo.current.vista !== vista) { ultimo.current = { encuadre, vista }; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    const p = encuadrar(DIR[vista], new THREE.Vector3(...OBJETIVO[vista]), puntosEncuadre(vista), camera.fov, aspecto, MARGEN[vista][0], MARGEN[vista][1], tapa);
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, vista, camera, reducido, encuadre, tapa]);
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

// ───────────────────────────── lo que se mueve ─────────────────────────────

/** Estado React que sigue al reloj sólo cuando cambia lo bastante (volúmenes). */
function useSeguirReloj(reloj: React.MutableRefObject<RelojDestilacion>) {
  const leer = () => { const v = reloj.current.vista; return { herv: v.hervidor.mL, rec: v.receptor.mL, gen: reloj.current.generacion }; };
  const [s, setS] = useState(leer);
  const ref = useRef(s);
  useFrame(() => {
    const n = leer(), u = ref.current;
    if (n.gen !== u.gen || Math.abs(n.herv - u.herv) > 1.5 || Math.abs(n.rec - u.rec) > 0.6 || (n.rec < 0.6) !== (u.rec < 0.6)) { ref.current = n; setS(n); }
  });
  return s;
}

/** Material de líquido incoloro teñido con el código de composición (transmisión en alta). */
function crearLiquidoCodigo(calidad: Calidad, nombre: string): THREE.MeshPhysicalMaterial {
  return calidad === 'alta'
    ? new THREE.MeshPhysicalMaterial({
      color: '#ffffff', metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.3, ior: 1.37,
      attenuationColor: new THREE.Color('#d9d2b8'), attenuationDistance: 0.32, specularIntensity: 1, envMapIntensity: 1,
      emissive: new THREE.Color('#000000'), side: THREE.DoubleSide, name: nombre,
    })
    : new THREE.MeshPhysicalMaterial({
      color: '#d9d2b8', metalness: 0, roughness: 0.08, transparent: true, opacity: 0.72, depthWrite: false,
      emissive: new THREE.Color('#000000'), name: nombre,
    });
}
const tmpColor = new THREE.Color();
function pintarCodigo(m: THREE.MeshPhysicalMaterial, x: number) {
  const [r, g, b] = colorComposicion(x);
  tmpColor.setRGB(r, g, b, THREE.SRGBColorSpace);
  if (m.transmission > 0) { m.attenuationColor.copy(tmpColor); m.color.setRGB(1, 1, 1).lerp(tmpColor, 0.55); }
  else m.color.copy(tmpColor);
  m.emissive.copy(tmpColor).multiplyScalar(0.12);
}

const N_BURB_CAMPANA = 4;
const N_BURB_PLATOS = N_PLATOS * CAMPANAS.length * N_BURB_CAMPANA;
const N_BURB_HERVIDOR = 26;

/** Burbujas que salen de las ranuras de las campanas (el vapor atravesando el líquido de cada plato). */
function BurbujasPlatos({ reloj, mats }: { reloj: React.MutableRefObject<RelojDestilacion>; mats: MatsQ10 }) {
  const burb = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => esfera(1, 10), []);
  // semillas fijas: ángulo de salida (sólo detrás del corte en las campanas cortadas) y fase
  const sem = useMemo(() => {
    let a = 77;
    const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    const b = Array.from({ length: N_BURB_PLATOS }, (_, i) => {
      const c = Math.floor(i / N_BURB_CAMPANA) % CAMPANAS.length;
      const cortada = CAMPANAS[c][1] === 0;
      const ang = cortada ? Math.PI + 0.25 + rnd() * (Math.PI - 0.5) : rnd() * Math.PI * 2;
      return { ang, fase: rnd(), r: 0.6 + rnd() * 0.6 };
    });
    return { b };
  }, []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  useFrame(() => {
    const r = reloj.current, v = r.vista;
    const mb = burb.current;
    if (!mb) return;
    const vap = v.vapor;
    let nb = 0;
    if (vap > 0.01) {
      for (let i = 0; i < N_BURB_PLATOS; i++) {
        const plato = 1 + Math.floor(i / (CAMPANAS.length * N_BURB_CAMPANA));
        const nivel = v.nivel[plato] ?? 1;
        if (nivel < 0.15) continue;
        const c = CAMPANAS[Math.floor(i / N_BURB_CAMPANA) % CAMPANAS.length];
        const s = sem.b[i];
        const t = (r.faseBurbujas * (1.2 + 0.5 * s.r) + s.fase) % 1;
        const y0 = yPlato(plato) + 0.045, y1 = yPlato(plato) + COL.hLiquido * nivel - 0.008;
        const rr = COL.rCampana + 0.012 + 0.02 * t;
        const x = c[0] + Math.cos(s.ang) * rr, z = c[1] + Math.sin(s.ang) * rr;
        if (z > -0.008) continue;
        const rad = 0.014 * s.r * (0.55 + 0.45 * t) * (0.5 + 0.5 * vap);
        tmp.p.set(x, y0 + (y1 - y0) * t, z); tmp.s.set(rad, rad * 0.85, rad);
        tmp.m.compose(tmp.p, tmp.q, tmp.s);
        mb.setMatrixAt(nb++, tmp.m);
      }
    }
    mb.count = nb; mb.instanceMatrix.needsUpdate = true; mb.visible = nb > 0;
  });
  return (
    <group userData={{ pieza: 'liquido' }}>
      <instancedMesh ref={burb} args={[geo, mats.burbuja, N_BURB_PLATOS]} frustumCulled={false} renderOrder={7} />
    </group>
  );
}

/** Ebullición en el balón: burbujas que nacen en el fondo y suben a la superficie. */
function BurbujasHervidor({ reloj, material }: { reloj: React.MutableRefObject<RelojDestilacion>; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => esfera(1, 10), []);
  const sem = useMemo(() => {
    let a = 4242;
    const rnd = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
    return Array.from({ length: N_BURB_HERVIDOR }, () => ({ a: rnd() * Math.PI * 2, r: Math.sqrt(rnd()) * 0.42, fase: rnd(), v: 0.7 + rnd() * 0.6 }));
  }, []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  useFrame(() => {
    const r = reloj.current, v = r.vista, m = ref.current; if (!m) return;
    let n = 0;
    if (v.hervidor.hierve && v.vapor > 0.01) {
      const ySup = ySuperficieBalon(v.hervidor.mL) - 0.01;
      const yFondo = BALON.yCentro - BALON.rInt + 0.03;
      for (const s of sem) {
        const t = (r.faseBurbujas * 0.9 * s.v + s.fase) % 1;
        const y = yFondo + (ySup - yFondo) * t;
        // el radio del bulbo a esa altura limita la posición
        const rb = Math.sqrt(Math.max(0, BALON.rInt ** 2 - (y - BALON.yCentro) ** 2)) - 0.04;
        const rr = Math.min(s.r, Math.max(0, rb));
        const rad = (0.012 + 0.03 * t) * (0.5 + 0.5 * v.vapor);
        tmp.p.set(Math.cos(s.a) * rr, y, Math.sin(s.a) * rr); tmp.s.setScalar(rad);
        tmp.m.compose(tmp.p, tmp.q, tmp.s);
        m.setMatrixAt(n++, tmp.m);
      }
    }
    m.count = n; m.instanceMatrix.needsUpdate = true; m.visible = n > 0;
  });
  return <instancedMesh ref={ref} args={[geo, material, N_BURB_HERVIDOR]} frustumCulled={false} renderOrder={2} />;
}

/** Gotas: del condensador al embudo, el reflujo a la columna, la toma al receptor, la alimentación. */
function Gotas({ reloj, mats }: { reloj: React.MutableRefObject<RelojDestilacion>; mats: MatsQ10 }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => esfera(1, 14), []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3(), c: new THREE.Color() }), []);
  // gota de ~0,05 mL: r = ∛(3V/4π)
  const R0 = Math.cbrt((3 * 0.05e-3) / (4 * Math.PI));
  useFrame(() => {
    const m = ref.current; if (!m) return;
    let n = 0;
    for (const g of reloj.current.gotas) {
      const alarg = 1 + Math.min(0.6, Math.abs(g.vy) * 0.05);
      const rad = g.tipo === 'fondo' || g.tipo === 'alim' ? R0 * 0.85 : R0;
      tmp.p.set(g.p[0], g.p[1], g.p[2]); tmp.s.set(rad / Math.sqrt(alarg), rad * alarg, rad / Math.sqrt(alarg));
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      m.setMatrixAt(n, tmp.m);
      const [r, gg, b] = colorComposicion(g.x);
      m.setColorAt(n, tmp.c.setRGB(r, gg, b, THREE.SRGBColorSpace));
      n++;
    }
    m.count = n; m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.visible = n > 0;
  });
  return <instancedMesh ref={ref} args={[geo, mats.gota, 40]} frustumCulled={false} userData={{ pieza: 'gota' }} />;
}

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;

function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloQ10[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
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
      if (it.z >= 1 || it.x < 0 || it.x > size.width || it.y < 0 || it.y > size.height) { el.style.opacity = '0'; continue; }
      const w = el.offsetWidth || 120, h = el.offsetHeight || 22;
      // a la derecha del ancla si está en la mitad derecha, a la izquierda si no: no tapan la columna
      const derecha = it.x > size.width * 0.5;
      const x = Math.min(size.width - w - 4, Math.max(4, derecha ? it.x + 10 : it.x - w - 10));
      let y = it.y - h / 2;
      for (let k = 0; k < 12; k++) {
        const choca = cajas.find((c) => x < c.x + c.w + 4 && x + w + 4 > c.x && y < c.y + c.h + 3 && y + h + 3 > c.y);
        if (!choca) break;
        y = choca.y + choca.h + 4;
      }
      // fuera de la franja de las pastillas (arriba) y de los rótulos de ritmo y calidad (abajo)
      if (it.y > size.height - 42 || it.y < 30) { el.style.opacity = '0'; continue; }
      y = Math.min(size.height - h - 40, Math.max(38, y));
      cajas.push({ x, y, w, h });
      el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      el.style.opacity = '1';
    }
  });
  return null;
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function DiagnosticoDev({ reloj, calidad }: { reloj: React.MutableRefObject<RelojDestilacion>; calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const medida = useRef({ llamadas: 0, triangulos: 0, fps: 0, n: 0, t0: 0, maxLlamadas: 0 });
  useEffect(() => {
    if (!DEV) return;
    const antes = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = antes; };
  }, [gl]);
  useFrame(() => {
    if (!DEV) return;
    const r = gl.info.render, m = medida.current;
    m.llamadas = r.calls; m.triangulos = r.triangles;
    m.maxLlamadas = Math.max(m.maxLlamadas, r.calls);
    gl.info.reset();
    const ahora = performance.now();
    m.n++;
    if (!m.t0) m.t0 = ahora;
    if (ahora - m.t0 >= 1000) { m.fps = (m.n * 1000) / (ahora - m.t0); m.n = 0; m.t0 = ahora; }
  }, -20);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __qmi10?: unknown };
    w.__qmi10 = {
      salud() {
        const m = medida.current;
        const s = { ...contarNormalesCero(scene), llamadas: m.llamadas, maxLlamadas: m.maxLlamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
        m.maxLlamadas = 0;
        return s;
      },
      estado() {
        const r = reloj.current, v = r.vista;
        return { modo: r.modo, mezcla: r.mezcla.id, op: r.op, x: v.x, T: v.T, nivel: v.nivel, vapor: v.vapor, hervidor: v.hervidor, receptor: v.receptor, tCabeza: v.tCabeza, embudo: v.embudo, gotas: r.gotas.length, escalon: r.escalon, t: r.col.t, historia: r.historia.length };
      },
      /** sólo desarrollo: corre `s` segundos de pantalla de golpe */
      simular(s: number) {
        const r = reloj.current;
        const n = Math.ceil(s / 0.05);
        for (let i = 0; i < n; i++) r.paso(0.05);
        return { x: r.vista.x, t: r.col.t };
      },
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const rc = gl.domElement.getBoundingClientRect();
        return { x: rc.left + (v.x * 0.5 + 0.5) * rc.width, y: rc.top + (-v.y * 0.5 + 0.5) * rc.height };
      },
      /** fracción del alto y del ancho del lienzo que ocupa el objeto encuadrado (estándar: alto 55–70 %) */
      ocupacion(vista: VistaQ10 = 'columna') {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const p of puntosEncuadre(vista)) {
          const v = p.clone().project(camera);
          x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
        }
        return { alto: Math.round(((y1 - y0) / 2) * 1000) / 1000, ancho: Math.round(((x1 - x0) / 2) * 1000) / 1000 };
      },
      /** sólo desarrollo: coloca la cámara (capturas de detalle) */
      mirar(pos: V3, objetivo: V3) {
        camera.position.set(...pos);
        if (controls) { controls.target.set(...objetivo); controls.update(); } else camera.lookAt(...objetivo);
      },
      escena: scene,
      renderer: gl,
    };
    return () => { delete w.__qmi10; };
  }, [gl, scene, reloj, calidad, camera, controls]);
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

// ───────────────────────────── el montaje ─────────────────────────────

/** Plato al que apunta un punto del mundo (1..N) por su altura. */
const platoEn = (y: number) => Math.max(1, Math.min(N_PLATOS, Math.round((yPlato(1) + 0.1 - y) / COL.espaciado) + 1));

function textoPieza(pieza: string, punto: THREE.Vector3, r: RelojDestilacion): string | null {
  const v = r.vista, m = r.mezcla, reto = r.modo === 'reto';
  const ligero = reto ? 'etanol' : m.ligero;
  switch (pieza) {
    case 'platos': case 'liquido': {
      const n = platoEn(punto.y);
      return reto
        ? `Plato ${n} · ${cifra(v.T[n], 1)} °C`
        : `Plato ${n}${n === 3 ? ' (alimentación)' : ''} · x ${ligero} ${cifra(v.x[n], 3)} · ${cifra(v.T[n], 1)} °C`;
    }
    case 'columna': return 'Columna DN80 de vidrio · 5 platos de campanas (media sección)';
    case 'embudo': case 'electroiman':
      return reto ? 'Divisor de reflujo · retorno 4 : toma 1' : r.op.total ? 'Divisor de reflujo · reflujo total (no toma)' : `Divisor de reflujo · R = ${cifra(r.op.R, 1)} (retorno ${cifra(r.op.R, 1)} : toma 1)`;
    case 'termometro': return `Pt100 de cabeza · ${cifra(v.tCabeza, 1)} °C`;
    case 'condensador': return 'Condensador Dimroth · serpentín de agua fría';
    case 'toma': return 'Brazo de toma de destilado, con llave';
    case 'hervidor': return `Hervidor: balón de 1 L · ${cifra(v.hervidor.mL, 0)} mL · ${cifra(v.hervidor.T, 1)} °C`;
    case 'manta': return reto ? `Manta calefactora · consigna ${cifra(r.reto?.calorManta ?? 20, 0)} °C` : `Manta calefactora · ${cifra(r.op.Q, 0)} W`;
    case 'receptor': return `Receptor: probeta de 250 mL · ${cifra(v.receptor.mL, 1)} mL`;
    case 'bomba': return reto ? 'Bomba peristáltica · parada (destilación por lotes)' : r.op.total ? 'Bomba peristáltica · parada (reflujo total)' : `Bomba peristáltica · ${cifra(r.alimentacionMLmin, 1)} mL/min`;
    case 'alimentacion': return reto ? 'Frasco de alimentación (no se usa en el reto)' : `Alimentación: ${m.nombre.toLowerCase()} · z ${cifra(m.z, 2)}`;
    case 'control': return 'Caja de control: manta y temporizador del divisor';
    case 'bastidor': return 'Bastidor con abrazaderas';
    case 'gato': return 'Gato de laboratorio';
    case 'gota': return 'Gota de condensado';
    default: return null;
  }
}

function Montaje({ p, rotulo, publicarRotulos, nodos }: {
  p: Destilacion3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloQ10[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { reloj, calidad, reducido, encuadre = 0, vista } = p;
  const mats = useMatsQ10(calidad);

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.current.paso(dt); }, -1);

  // sombras a demanda: lo que las proyecta no se mueve (el embudo y el rotor no proyectan), así que
  // el mapa se rehace al montar y al cambiar de mezcla o de modo — no en cada cuadro
  const gl = useThree((st) => st.gl);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl, calidad]);
  const sombraN = useRef(0);
  const genSombra = useRef(-1);
  useFrame(() => {
    const g = reloj.current.generacion;
    if (g !== genSombra.current || sombraN.current < 2) { genSombra.current = g; sombraN.current++; gl.shadowMap.needsUpdate = true; }
  });

  const s = useSeguirReloj(reloj);

  // líquido de los platos: color y nivel por etapa, cortinas, plato resaltado por la escalera del dock
  const uniformes = useMemo(() => crearUniformesLiquido(), []);
  const matPlatos = useMemo(() => crearMaterialLiquido(uniformes, calidad), [uniformes, calidad]);
  useEffect(() => () => matPlatos.dispose(), [matPlatos]);
  const matHervidor = useMemo(() => crearLiquidoCodigo(calidad, 'q10-liquido-hervidor'), [calidad]);
  const matReceptor = useMemo(() => crearLiquidoCodigo(calidad, 'q10-liquido-receptor'), [calidad]);
  const matFrasco = useMemo(() => crearLiquidoCodigo(calidad, 'q10-liquido-frasco'), [calidad]);
  const matBurbHervidor = useMemo(() => (calidad === 'alta'
    ? new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.03, transmission: 1, thickness: 0.02, ior: 1.0, side: THREE.DoubleSide, envMapIntensity: 1.8, name: 'q10-burbuja-hervidor' })
    : mats.burbuja), [calidad, mats]);
  useEffect(() => () => { matHervidor.dispose(); matReceptor.dispose(); matFrasco.dispose(); if (matBurbHervidor !== mats.burbuja) matBurbHervidor.dispose(); }, [matHervidor, matReceptor, matFrasco, matBurbHervidor, mats]);
  useFrame(() => {
    const r = reloj.current, v = r.vista, u = uniformes;
    for (let i = 0; i < MAX_ETAPAS_Q10; i++) {
      const k = Math.min(i, N_PLATOS);
      const [cr, cg, cb] = colorComposicion(v.x[k] ?? 0);
      u.uColorEtapaQ10.value[i].setRGB(cr, cg, cb, THREE.SRGBColorSpace);
      u.uNivelQ10.value[i] = i === 0 ? (v.R > 0 && v.vapor > 0.01 ? Math.max(0.2, v.nivel[1] ?? 1) : 0) : (v.nivel[k] ?? 1);
    }
    u.uTiempoQ10.value = r.faseFlujo;
    const e = r.etapaResaltada;
    u.uResaltadoQ10.value = e >= 1 && e <= N_PLATOS ? e : -1;
    u.uPulsoQ10.value = e >= 1 && e <= N_PLATOS ? 0.6 + 0.4 * Math.sin(r.tv * 6) : 0;
    pintarCodigo(matHervidor, v.hervidor.x);
    pintarCodigo(matReceptor, v.receptor.x);
    pintarCodigo(matFrasco, v.z);
  });

  const posEmbudo = useMemo(() => () => reloj.current.vista.embudo, [reloj]);
  const enToma = useMemo(() => () => reloj.current.vista.embudo > 0.5, [reloj]);
  const calor = useMemo(() => () => reloj.current.vista.hervidor.calor, [reloj]);
  const calentando = useMemo(() => () => reloj.current.vista.hervidor.calor > 0.05, [reloj]);
  const bombeando = useMemo(() => () => reloj.current.vista.alimentando && !reloj.current.pausa, [reloj]);

  // rótulo al pasar el ratón
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    const texto = pieza ? textoPieza(pieza, e.point, reloj.current) : null;
    rotulo.current(texto ? { texto, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  // rótulos con el botón «Rótulos» (≤ 8)
  const reto = p.modo === 'reto';
  const rotulos = useMemo<RotuloQ10[]>(() => {
    if (!p.rotulos) return [];
    return [
      { id: 'co', texto: 'Condensador Dimroth', ancla: [CONDENSADOR.rCamisa + 0.02, 8.4, 0] },
      { id: 'pt', texto: 'Pt100 de cabeza', ancla: [-0.55, 7.75, 0] },
      { id: 'di', texto: 'Divisor de reflujo', ancla: [-CABEZA.rExt - 0.2, CABEZA.yEmbudo, 0] },
      { id: 'p1', texto: 'Plato 1', ancla: [COL.bridaREx, yPlato(1), 0] },
      reto
        ? { id: 'ca', texto: 'Campanas de burbujeo', ancla: [-COL.bridaREx, yPlato(3), 0] }
        : { id: 'al', texto: 'Alimentación · plato 3', ancla: [-COL.rExt - 0.1, yPlato(3) + 0.5, -0.12] },
      { id: 'p5', texto: 'Plato 5', ancla: [COL.bridaREx, yPlato(5), 0] },
      { id: 're', texto: 'Receptor 250 mL', ancla: [RECEPTOR.x + 0.22, RECEPTOR.yRepisa + 1.4, 0] },
      { id: 'he', texto: 'Hervidor y manta', ancla: [-MANTA.rExt, 1.2, 0.2] },
    ];
  }, [p.rotulos, reto]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  // tubos: alimentación (frasco → bomba → boquilla del plato 3), agua del condensador y cables
  const yAlim = yPlato(3) + 0.5;
  const salidaBomba: V3 = [BOMBA.pos[0] + 0.18, BOMBA.alto * 0.55, BOMBA.pos[2] + BOMBA.fondo / 2 + 0.05];
  const boquilla = useMemo(() => new THREE.CylinderGeometry(0.03, 0.03, 0.16, 14).rotateZ(Math.PI / 2), []);
  useEffect(() => () => boquilla.dispose(), [boquilla]);
  const entradaBomba: V3 = [BOMBA.pos[0] - 0.12, BOMBA.alto * 0.55, BOMBA.pos[2] + BOMBA.fondo / 2 + 0.05];

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara vista={vista} reducido={reducido} encuadre={encuadre} />
      <Mesa mats={mats} />
      <Bastidor mats={mats} />
      {/* hervidor */}
      <Gato mats={mats} />
      <Manta mats={mats} calor={calor} />
      <BalonHervidor />
      <LiquidoBalon mL={s.herv} material={matHervidor} />
      <BurbujasHervidor reloj={reloj} material={matBurbHervidor} />
      {/* columna, cabeza y condensador */}
      <Columna mats={mats} matLiquido={matPlatos} calidad={calidad} />
      <BurbujasPlatos reloj={reloj} mats={mats} />
      <EmbudoDivisor mats={mats} posicion={posEmbudo} />
      <Electroiman mats={mats} activo={enToma} />
      <VidrioCabeza mats={mats} />
      <CondensadorDimroth mats={mats} />
      <Gotas reloj={reloj} mats={mats} />
      {/* receptor */}
      <RepisaReceptor mats={mats} />
      <group position={[RECEPTOR.x, RECEPTOR.yRepisa, RECEPTOR.z]} userData={{ pieza: 'receptor' }}>
        <Probeta capacidad={250} colorEscala="#1d4f9e" />
        {s.rec > 0.6 && <Liquido recipiente={PROBETA} volumenML={s.rec} material={matReceptor} />}
      </group>
      {/* alimentación */}
      <FrascoAlimentacion matLiquido={matFrasco} />
      <BombaPeristaltica mats={mats} girando={bombeando} />
      <Cable desde={[FRASCO_ALIM.pos[0] + 0.05, FRASCO_ALIM.alto + 0.12, FRASCO_ALIM.pos[2]]} hasta={entradaBomba} holgura={0.25} grosor={0.016} color="#b9c6cb" ySuelo={0} />
      <Cable desde={salidaBomba} hasta={[-COL.rExt - 0.16, yAlim, -0.12]} holgura={0.3} grosor={0.016} color="#b9c6cb" />
      <mesh geometry={boquilla} material={mats.acero} position={[-COL.rExt - 0.08, yAlim, -0.12]} userData={{ pieza: 'alimentacion' }} />
      {/* agua del condensador (sale por detrás) y cables del Pt100 y del electroimán al bastidor */}
      <Cable desde={[0.07, CONDENSADOR.yTope + 0.29, 0.05]} hasta={[0.45, 7.6, -1.5]} holgura={0.3} grosor={0.03} color="#4f6f80" />
      <Cable desde={[-0.06, CONDENSADOR.yTope + 0.29, -0.05]} hasta={[-0.45, 7.6, -1.5]} holgura={0.3} grosor={0.03} color="#4f6f80" />
      <Cable desde={[-0.6, 7.8, 0]} hasta={[-BASTIDOR.x, 7.4, BASTIDOR.z + 0.04]} holgura={0.12} grosor={0.01} color="#1c1f23" />
      <Cable desde={[MANTA.rExt - 0.05, MANTA.yBase + 0.1, -0.35]} hasta={[CONTROL.pos[0] - 0.2, 0.18, CONTROL.pos[2] - 0.3]} holgura={0.15} grosor={0.016} color="#1c1f23" ySuelo={0} />
      <CajaControl mats={mats} calentando={calentando} toma={enToma} />
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} />
    </group>
  );
}

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[280px] rounded-md border border-white/15 bg-[#0b1220]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-q10="">
      {d.texto}
    </div>
  );
}

export default function Destilacion3DScene(props: Destilacion3DProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloQ10[]>([]);
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-q10="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false, }}
        camera={{ position: [0, 5, 14], fov: 30, near: 0.05, far: 200 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes calidad={calidad} />
          <Luces calidad={calidad} />
          <ControlesBanco objetivo={OBJETIVO.columna} fondo="laboratorio"
            limites={{ minDistancia: 1.2, maxDistancia: 34, maxPolar: 1.5, minPolar: 0.12, paneo: true, cajaObjetivo: [[-3, 0, -2], [3, 10, 2]] }} />
          <Montaje p={props} rotulo={rotulo} publicarRotulos={setLista} nodos={nodos} />
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
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-q10={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
