"use client";
/**
 * F6 · Principio de Arquímedes — el banco en 3D (R3F), a escala real (1 u = 1 dm).
 *
 *  · EXPLORAR (estado inicial): el bloque recién soltado sobre el líquido del tanque. Se
 *    hunde, el empuje lo frena y lo devuelve, y oscila amortiguado hasta flotar con la
 *    fracción ρ_c/ρ_l bajo la superficie; si su postura es inestable (GM < 0) vuelca. Los
 *    metales se hunden con arrastre hasta el fondo. La superficie hace ondas.
 *  · RETO: el cilindro problema cuelga del dinamómetro del soporte universal; el alumno lo
 *    baja (la nuez se desliza por la varilla) y lee el dinamómetro en el dock.
 *
 * RELOJ ÚNICO. `reloj.current.avanzar(dt)` corre aquí en un useFrame de prioridad −2
 * (antes que nada se dibuje); las piezas (−1) y el dock (suscrito) leen ese mismo estado.
 * Ningún useFrame con prioridad > 0 (sin compositor, el lienzo saldría negro).
 *
 * NO REGALAR. En el reto, antes de validar, no se dibujan flechas de fuerza: su razón
 * T/W = 1 − ρ_l/ρ_c daría la densidad. Sólo se ve lo que vería el alumno en el banco.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { KitContexto, ControlesBanco, type Calidad } from '../_kit';
import { HILO, MATERIALES, TANQUE, peso, volumen, type IdMaterial, type Liquido, type Postura } from './flotacion';
import type { RelojTanque } from './reloj';
import {
  COTAS, U, Y_BORDE, aEscenaY, useMatsF6, Mesa, Pared, Tanque, Liquido3D, Bloque, CilindroProblema, Soporte, Dinamometro,
  Hilo, geoHilo, geoFlecha, geoPunta, MarcaG, contarNormalesCero, type V3, type MatsF6,
} from './piezas';

export type ModoF6 = 'explorar' | 'reto';

export interface Arquimedes3DProps {
  reloj: React.MutableRefObject<RelojTanque>;
  modo: ModoF6;
  material: IdMaterial;
  postura: Postura;
  liq: Liquido;
  /** reto validado: se pueden dibujar las fuerzas */
  validado: boolean;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** sube para volver al encuadre automático */
  encuadre: number;
  /** divisiones de la escala del dinamómetro (alcance) */
  divisiones: number;
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#070b10';

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.08;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.localClippingEnabled = false;
    (gl as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = calidad === 'alta' ? 1 : 0.5;
    let tex: THREE.CanvasTexture | null = null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(256, 210, 10, 256, 250, 430);
      grad.addColorStop(0, '#1b2732'); grad.addColorStop(0.55, '#0e151c'); grad.addColorStop(1, FONDO);
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
    const pm = new THREE.PMREMGenerator(gl);
    const env = pm.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environment = env;
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.6;
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
    l.target.position.set(-0.4, 1.2, 0); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      <hemisphereLight args={['#b9cad9', '#07090c', 0.32]} />
      <spotLight ref={clave} position={[-5.5, 10, 6.5]} angle={0.48} penumbra={0.9} decay={0} intensity={2.1} color="#fff1df" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      <directionalLight position={[5, 4, -6]} intensity={1.1} color="#cfe0ff" />
      <directionalLight position={[4.5, 2.5, 5]} intensity={0.35} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6; // ToneMappingMode.ACES_FILMIC de postprocessing 6.39
/** Bloom moderado sólo en lo que emite (la línea de flotación, HDR > 1) + ACES + viñeta. Props constantes. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.45} luminanceThreshold={1.4} luminanceSmoothing={0.2} radius={0.5} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.3} darkness={0.55} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

/** Distancia y objetivo para que `puntos` quepan en ±mx, ±my (NDC) mirando desde `dir`. */
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

const DIR_CAMARA = (() => {
  const el = THREE.MathUtils.degToRad(17), az = THREE.MathUtils.degToRad(-13);
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).normalize();
})();

function puntosEncuadre(modo: ModoF6, alturaAro: number): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  const ox = COTAS.ix + COTAS.vidrio, oz = COTAS.iz + COTAS.vidrio;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    P.push(new THREE.Vector3(sx * ox, 0, sz * oz));
    P.push(new THREE.Vector3(sx * ox, Y_BORDE + (modo === 'explorar' ? 0.12 : 0), sz * oz));
  }
  if (modo === 'reto') {
    // la varilla (no la base entera), la nuez y el dinamómetro completo con su aro
    P.push(new THREE.Vector3(COTAS.xVarilla - 0.2, 0.1, 0.3), new THREE.Vector3(COTAS.xVarilla - 0.2, alturaAro + 0.32, 0));
    // aire sobre el aro: la franja de arriba (modo y aviso) no tapa el dinamómetro ni la nuez
    P.push(new THREE.Vector3(0.2, alturaAro + 0.6, 0));
  }
  return P;
}

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Encuadre con transición suave; re-encuadra al cambiar el tamaño si el alumno no movió la cámara. */
function Camara({ modo, alturaAro, reducido, encuadre }: { modo: ModoF6; alturaAro: number; reducido: boolean; encuadre: number }) {
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
  const ultimoModo = useRef(modo);
  const aro = Math.round(alturaAro * 4) / 4; // no re-encuadrar por cada milímetro del soporte
  useLayoutEffect(() => {
    if (!controls) return;
    if (ultimoEncuadre.current !== encuadre || ultimoModo.current !== modo) { ultimoEncuadre.current = encuadre; ultimoModo.current = modo; usuario.current = false; }
    if (!primera.current && usuario.current) return;
    // apaisado: el banco ocupa ~64 % del alto; en vertical manda el ancho
    const p = encuadrar(DIR_CAMARA, new THREE.Vector3(0, 1.6, 0), puntosEncuadre(modo, aro), camera.fov, aspecto, 0.88, modo === 'explorar' ? 0.78 : 0.88);
    if (primera.current || reducido) {
      primera.current = false;
      camera.position.copy(p.pos); controls.target.copy(p.objetivo); controls.update();
      return;
    }
    anim.current = { p0: camera.position.clone(), p1: p.pos, o0: controls.target.clone(), o1: p.objetivo, t: 0 };
  }, [controls, aspecto, modo, aro, camera, reducido, encuadre]);
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

// ───────────────────────────── el cuerpo y sus fuerzas ─────────────────────────────

interface Refs {
  cuerpo: React.RefObject<THREE.Group | null>;
}

const ESC_FLECHA = 1.45; // u para la fuerza de referencia
const MAX_PESO = 1.1; // u: el peso de los cuerpos pesados no pasa de aquí (escala común a todas las flechas)

/** Flecha vertical (asta + punta) cuyo largo se fija cada cuadro. */
function Flecha({ mat, grupo, asta, punta }: { mat: THREE.Material; grupo: React.RefObject<THREE.Group | null>; asta: React.RefObject<THREE.Mesh | null>; punta: React.RefObject<THREE.Mesh | null> }) {
  const gA = useMemo(() => geoFlecha(0.022), []);
  const gP = useMemo(() => geoPunta(0.022), []);
  useEffect(() => () => gP.dispose(), [gP]);
  return (
    <group ref={grupo} visible={false}>
      <mesh ref={asta} geometry={gA} material={mat} renderOrder={20} />
      <mesh ref={punta} geometry={gP} material={mat} renderOrder={20} />
    </group>
  );
}

function useFlecha() {
  return { grupo: useRef<THREE.Group>(null), asta: useRef<THREE.Mesh>(null), punta: useRef<THREE.Mesh>(null) };
}
/** Coloca una flecha vertical desde (x, y, z) con largo `l` (u; con signo: + hacia arriba). */
function ponerFlecha(f: ReturnType<typeof useFlecha>, x: number, y: number, z: number, l: number, visible: boolean) {
  const g = f.grupo.current, a = f.asta.current, p = f.punta.current;
  if (!g || !a || !p) return;
  const lAbs = Math.abs(l);
  g.visible = visible && lAbs > 0.03;
  if (!g.visible) return;
  g.position.set(x, y, z);
  g.rotation.set(0, 0, l < 0 ? Math.PI : 0);
  const punta = Math.min(0.14, lAbs * 0.45);
  const asta = Math.max(0.001, lAbs - punta);
  a.scale.set(1, asta, 1); a.position.set(0, asta / 2, 0);
  p.position.set(0, asta, 0); p.scale.set(1, punta / 0.143, 1);
}

function Banco({ p, rotulo, publicarRotulos, nodos }: {
  p: Arquimedes3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloF6[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { reloj, modo, material, postura, liq, validado, calidad, reducido, encuadre, divisiones } = p;
  const reto = modo === 'reto';
  const mats = useMatsF6(calidad, divisiones);

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.current.avanzar(dt); }, -2);

  const refs: Refs = { cuerpo: useRef<THREE.Group>(null) };
  const fP = useFlecha(), fE = useFlecha(), fN = useFlecha(), fT = useFlecha();
  const marcaG = useRef<THREE.Group>(null), marcaB = useRef<THREE.Mesh>(null);
  const nuez = useRef<THREE.Group>(null), dina = useRef<THREE.Group>(null), muelle = useRef<THREE.Mesh>(null), movil = useRef<THREE.Group>(null);
  const hilo = useRef<THREE.Mesh>(null);
  const ultimoHilo = useRef('');

  // altura del aro en el estado de partida (para el encuadre del reto)
  const alturaAro = reto ? aEscenaY(reloj.current.m.ySoporte) + COTAS.largoDin : 0;
  const [aroEncuadre, setAroEncuadre] = useState(alturaAro);
  useEffect(() => { if (reto) setAroEncuadre(aEscenaY(Math.max(reloj.current.m.ySoporte, reloj.current.soporteObjetivo ?? 0)) + COTAS.largoDin); }, [reto, reloj]);

  const canto = postura === 'canto' && !reto;
  useFrame(() => {
    const r = reloj.current, s = r.s, c = r.m.c;
    mats.nivel.uNivel.value = aEscenaY(s.ys);
    const g = refs.cuerpo.current;
    if (g) {
      g.position.set(0, aEscenaY(s.y), 0);
      g.rotation.set(0, 0, s.th + (canto ? Math.PI / 2 : 0));
    }
    // fuerzas: escala común con la mayor de las de referencia (peso o empuje total)
    const ref = Math.max(peso(c), liq.rho * 9.81 * volumen(c));
    const k = Math.min(ESC_FLECHA / ref, MAX_PESO / peso(c));
    const zF = (c.L / 2) * U + 0.03;
    const mostrar = !reto || validado;
    const yG = aEscenaY(s.y);
    ponerFlecha(fP, 0, yG, zF, -s.P * k, mostrar);
    ponerFlecha(fE, s.xB * U, aEscenaY(s.yB), zF, s.E * k, mostrar && s.V > 1e-9);
    // apoyo del fondo: desde el punto más bajo hacia arriba
    const bajo = s.y - (Math.abs(c.b * Math.sin(s.th)) + Math.abs(c.h * Math.cos(s.th))) / 2;
    ponerFlecha(fN, 0, aEscenaY(bajo) + 0.01, zF + 0.02, s.N * k, mostrar && s.N > 0.02);
    const yAtado = aEscenaY(s.y + c.h / 2) + 0.11;
    ponerFlecha(fT, 0, yAtado, 0.05, s.T * k, mostrar && r.m.colgado);
    if (marcaG.current) { marcaG.current.position.set(0, yG, zF - 0.005); marcaG.current.visible = !reto || validado; }
    if (marcaB.current) { marcaB.current.position.set(s.xB * U, aEscenaY(s.yB), zF - 0.004); marcaB.current.visible = (!reto || validado) && s.V > 1e-9; }
    // soporte y dinamómetro
    if (reto) {
      const aro = aEscenaY(r.m.ySoporte) + COTAS.largoDin;
      if (dina.current) dina.current.position.set(0, aro, 0);
      if (nuez.current) nuez.current.position.y = aro + 0.23;
      const ext = s.ext * U;
      if (movil.current) movil.current.position.y = -0.42 - ext;
      if (muelle.current) muelle.current.scale.set(1, 0.09 + ext, 1);
      // hilo: del gancho a la armella
      const yGancho = aro - COTAS.largoDin - ext;
      const yArmella = aEscenaY(s.y + c.h / 2) + 0.072 + 0.042;
      const flojo = Math.max(0, (yGancho - yArmella) - HILO * U);
      const clave = `${yGancho.toFixed(4)}|${yArmella.toFixed(4)}`;
      if (hilo.current && clave !== ultimoHilo.current) {
        ultimoHilo.current = clave;
        hilo.current.geometry.dispose();
        hilo.current.geometry = geoHilo([0.05, yGancho + 0.01, 0], [0, yArmella, 0], flojo * 0.5);
      }
    }
  }, -1);

  // rótulo al pasar el ratón (DOM, nítido)
  const nombreCuerpo = reto ? 'Cilindro problema (material desconocido)' : `Bloque de ${MATERIALES[material].nombre.toLowerCase()} · ${MATERIALES[material].rho} kg/m³ · 256 cm³`;
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    const textos: Record<string, string> = {
      tanque: `Tanque de vidrio · ${Math.round(TANQUE.largo * 100)} × ${Math.round(TANQUE.ancho * 100)} × ${Math.round(TANQUE.alto * 100)} cm`,
      liquido: `${liq.nombre} · ${liq.rho} kg/m³`,
      cuerpo: nombreCuerpo,
      dinamometro: 'Dinamómetro de muelle',
      soporte: 'Soporte universal con nuez',
    };
    const texto = pieza ? textos[pieza] ?? null : null;
    rotulo.current(texto ? { texto, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  // rótulos con el botón «Rótulos» (≤ 8): anclas que se mueven con el cuerpo
  const rotulos = useMemo<RotuloF6[]>(() => {
    if (!p.rotulos) return [];
    const r: RotuloF6[] = [];
    r.push({ id: 'cu', texto: reto ? 'Cilindro problema' : `Bloque de ${MATERIALES[material].nombre.toLowerCase()}`, ancla: () => [0, aEscenaY(reloj.current.s.y + reloj.current.m.c.h / 2) + 0.12, 0] });
    r.push({ id: 'li', texto: liq.nombre, ancla: () => [COTAS.ix * 0.72, aEscenaY(reloj.current.s.ys) - 0.5, COTAS.iz] });
    r.push({ id: 'ta', texto: 'Tanque de vidrio', ancla: () => [-COTAS.ix * 0.75, Y_BORDE, COTAS.iz] });
    if (!reto || validado) {
      r.push({ id: 'g', texto: 'G · centro de masa', ancla: () => [-0.55, aEscenaY(reloj.current.s.y), (reloj.current.m.c.L / 2) * U] });
      r.push({ id: 'b', texto: 'B · centro de empuje', ancla: () => [reloj.current.s.xB * U + 0.55, aEscenaY(reloj.current.s.yB), (reloj.current.m.c.L / 2) * U] });
    }
    if (reto) {
      r.push({ id: 'di', texto: 'Dinamómetro', ancla: () => [0.2, aEscenaY(reloj.current.m.ySoporte) + COTAS.largoDin - 0.6, 0] });
      r.push({ id: 'so', texto: 'Soporte universal', ancla: () => [COTAS.xVarilla, 2.6, 0] });
    }
    return r.slice(0, 8);
  }, [p.rotulos, reto, material, liq, validado, reloj]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara modo={modo} alturaAro={aroEncuadre} reducido={reducido} encuadre={encuadre} />
      <Mesa mats={mats} />
      <Pared mats={mats} />
      <Tanque mats={mats} />
      <Liquido3D reloj={reloj} liq={liq} calidad={calidad} />
      <group ref={refs.cuerpo}>
        {reto ? <CilindroProblema c={reloj.current.m.c} mats={mats} /> : <Bloque material={material} mats={mats} />}
      </group>
      {/* fuerzas y centros, en el plano de la cara delantera */}
      <Flecha mat={mats.flechaP} {...fP} />
      <Flecha mat={mats.flechaE} {...fE} />
      <Flecha mat={mats.flechaN} {...fN} />
      <Flecha mat={mats.flechaT} {...fT} />
      <group ref={marcaG}><MarcaG mats={mats} /></group>
      <mesh ref={marcaB} material={mats.marcaB}><circleGeometry args={[0.04, 20]} /></mesh>
      {reto && (
        <>
          <Soporte mats={mats} grupoNuez={nuez} />
          <group ref={dina}><Dinamometro mats={mats} muelle={muelle} movil={movil} /></group>
          <Hilo mats={mats} malla={hilo} />
        </>
      )}
      <ProyectorRotulos rotulos={rotulos} nodos={nodos} />
    </group>
  );
}

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;
export interface RotuloF6 { id: string; texto: string; ancla: () => V3 }

/** Proyecta las anclas de los rótulos y coloca los <div> del overlay sin solaparse (≤ 8). */
function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloF6[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
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
      let y = it.y - h - 6;
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

function DiagnosticoDev({ reloj, calidad }: { reloj: React.MutableRefObject<RelojTanque>; calidad: Calidad }) {
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
    const w = window as unknown as { __fis06?: unknown };
    w.__fis06 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixeles: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj.current, s = r.s;
        return { t: s.t, y: s.y, th: s.th, ys: s.ys, V: s.V, E: s.E, P: s.P, N: s.N, T: s.T, factor: r.factor, pausa: r.pausa, ySoporte: r.m.ySoporte, objetivo: r.soporteObjetivo };
      },
      /** sólo desarrollo: adelanta el modelo `seg` segundos */
      adelantar(seg: number) { reloj.current.integrar(seg); return reloj.current.s.t; },
      /** sólo desarrollo: píxel (CSS) donde cae un punto de la escena */
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const r = gl.domElement.getBoundingClientRect();
        return { x: r.left + (v.x * 0.5 + 0.5) * r.width, y: r.top + (-v.y * 0.5 + 0.5) * r.height };
      },
      escena: scene,
    };
    return () => { delete w.__fis06; };
  }, [gl, scene, reloj, calidad, camera]);
  return null;
}

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

function RotuloRaton({ fijar }: { fijar: React.MutableRefObject<(d: DatoRotulo) => void> }) {
  const [d, setD] = useState<DatoRotulo>(null);
  useEffect(() => { fijar.current = setD; return () => { fijar.current = () => undefined; }; }, [fijar]);
  if (!d) return null;
  return (
    <div className="pointer-events-none absolute z-20 max-w-[260px] rounded-md border border-white/15 bg-[#0b1220]/90 px-2 py-1 text-[11px] font-semibold text-slate-100 shadow-lg backdrop-blur"
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-f6="">
      {d.texto}
    </div>
  );
}

export default function Arquimedes3DScene(props: Arquimedes3DProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloF6[]>([]);
  const publicar = useCallback((r: RotuloF6[]) => setLista(r), []);
  const dprMedia = typeof window !== 'undefined' ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-f6="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [dprMedia, dprMedia]}
        gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 3, 12], fov: 30, near: 0.05, far: 200 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes calidad={calidad} />
          <Luces calidad={calidad} />
          <ControlesBanco objetivo={[0, 1.6, 0]} fondo="laboratorio"
            limites={{ minDistancia: 2.5, maxDistancia: 30, maxPolar: 1.48, minPolar: 0.2, paneo: true, cajaObjetivo: [[-4, 0, -2], [3, 7, 2]] }} />
          <Banco p={props} rotulo={rotulo} publicarRotulos={publicar} nodos={nodos} />
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
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-f6={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { MatsF6 };
