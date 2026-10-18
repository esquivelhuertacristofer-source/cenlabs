"use client";
/**
 * Q7 · Titulación ácido-base — el montaje en 3D (R3F), a escala real (1 u = 10 cm).
 *
 *   Bureta de 50 mL con llave de PTFE en su pinza; matraz Erlenmeyer de 250 mL sobre un
 *   agitador magnético con la barra girando; electrodo combinado de pH en una segunda
 *   pinza, cableado a un pH-metro analógico de banco; tres frascos goteros de indicador.
 *
 * RELOJ ÚNICO. `reloj.current.paso(dt)` corre aquí, en un useFrame de prioridad −1 (antes
 * de dibujar): la llave, la gota que cuelga y cae, el chorro, las estelas y el color del
 * líquido (Beer–Lambert por píxel), la aguja del pH-metro, el dock y la barra de lecturas
 * leen ese mismo estado.
 *
 * NO REGALAR. Ni la escena ni sus rótulos escriben el volumen de equivalencia ni la
 * concentración del reto: sólo se ve lo que vería el alumno en la mesa.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  KitContexto, ControlesBanco, Nuez, Pinza, Bureta, Erlenmeyer, Cable, NUEZ_DX, COLORES_LIQUIDO, esfera,
  defBureta, type Calidad,
} from '../_kit';
import { INDICADORES, INDICADORES_LISTA, V_GOTA_ML, radioChorro, type IdIndicador } from './acidobase';
import { type RelojTitulacion, ERLEN, PUNTA_LOCAL, GOTERO_LOCAL, GOTERO, duracionDosis } from './reloj';
import {
  COTAS, Y_MATRAZ, AGITADOR_CENTRO_PLATO_Z, ELECTRODO_CABLE, PHMETRO_BNC, GOTERO_ALTO,
  useMatsQ7, Mesa, BaseSoporte, Agitador, BarraAgitadora, ElectrodoPH, PHmetroAnalogico, FrascoGotero,
  crearUniformesLiquido, crearMaterialLiquido, LiquidoMatraz, contarNormalesCero, brazoHacia, type V3, type MatsQ7,
} from './piezas';

export type ModoQ7 = 'explorar' | 'reto';
export type VistaQ7 = 'matraz' | 'montaje';
export interface RotuloQ7 { id: string; texto: string; ancla: V3 }

export interface Titulacion3DProps {
  reloj: React.MutableRefObject<RelojTitulacion>;
  modo: ModoQ7;
  vista: VistaQ7;
  calidad: Calidad;
  reducido: boolean;
  rotulos: boolean;
  /** sube para volver al encuadre automático */
  encuadre?: number;
  onListo?: () => void;
}

const DEV = process.env.NODE_ENV !== 'production';
const FONDO = '#06090c';

// ───────────────────────────── geometría del montaje (mundo) ─────────────────────────────

const DEF_BURETA = defBureta();
/** Punta de la bureta en el mundo (el matraz está en x = z = 0). */
const PUNTA: V3 = [PUNTA_LOCAL[0], Y_MATRAZ + PUNTA_LOCAL[1], PUNTA_LOCAL[2]];
/** La pinza agarra la bureta 4,6 u por encima de la punta. */
const AGARRE_BURETA = 4.6;
/** Varilla del soporte: detrás y a la derecha (los brazos no cruzan por delante de la punta). */
const VARILLA: [number, number] = [0.32, -1.55];
const BRAZO_BURETA = brazoHacia(PUNTA[0] - VARILLA[0], PUNTA[2] - VARILLA[1], NUEZ_DX);
const ALTO_VARILLA = 7.3;
/** El electrodo: del bulbo a la boca del matraz y la dirección de su eje. */
const BULBO: V3 = [COTAS.electrodo.bulbo[0], Y_MATRAZ + COTAS.electrodo.bulbo[1], COTAS.electrodo.bulbo[2]];
const DIR_ELECTRODO = new THREE.Vector3(
  COTAS.electrodo.boca[0] - COTAS.electrodo.bulbo[0], COTAS.electrodo.boca[1] - COTAS.electrodo.bulbo[1], COTAS.electrodo.boca[2] - COTAS.electrodo.bulbo[2],
).normalize();
const Q_ELECTRODO = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), DIR_ELECTRODO);
const enElectrodo = (s: number): V3 => [BULBO[0] + DIR_ELECTRODO.x * s, BULBO[1] + DIR_ELECTRODO.y * s, BULBO[2] + DIR_ELECTRODO.z * s];
/** la pinza abraza el cabezal del electrodo (Ø 14 mm), no el manguito del cable */
const AGARRE_ELECTRODO = enElectrodo(1.45);
const BRAZO_ELECTRODO = brazoHacia(AGARRE_ELECTRODO[0] - VARILLA[0], AGARRE_ELECTRODO[2] - VARILLA[1], NUEZ_DX);
const CABLE_ELECTRODO = enElectrodo(ELECTRODO_CABLE[1]);
const BNC: V3 = (() => {
  const { pos, giro } = COTAS.phmetro;
  const [x, y, z] = PHMETRO_BNC;
  return [pos[0] + x * Math.cos(giro) + z * Math.sin(giro), pos[1] + y, pos[2] - x * Math.sin(giro) + z * Math.cos(giro)];
})();
/** Pose de trabajo del frasco gotero: boquilla sobre la boca, cuerpo hacia arriba, a la derecha y delante. */
const BOQUILLA: V3 = [GOTERO_LOCAL[0], Y_MATRAZ + GOTERO_LOCAL[1], GOTERO_LOCAL[2]];
// la boquilla apunta abajo y el cuerpo sube hacia el alumno (delante de la bureta, sin tocar la llave)
const Q_GOTERO = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-0.1, -0.86, -0.5).normalize());
const BASE_GOTERO = new THREE.Vector3(0, GOTERO_ALTO, 0).applyQuaternion(Q_GOTERO).multiplyScalar(-1).add(new THREE.Vector3(...BOQUILLA));
const COLOR_TAPA: Record<IdIndicador, string> = { fenolftaleina: '#c2185b', naranjaMetilo: '#e65100', azulBromotimol: '#1e5bb8' };

// ───────────────────────────── ambiente ─────────────────────────────

function Ajustes({ calidad }: { calidad: Calidad }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.12;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    (gl as unknown as { transmissionResolutionScale?: number }).transmissionResolutionScale = calidad === 'alta' ? 1 : 0.5;
    let tex: THREE.CanvasTexture | null = null;
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(256, 200, 10, 256, 240, 420);
      // un halo frío detrás del montaje: el vidrio (bureta, matraz) se recorta contra él
      grad.addColorStop(0, '#2c3d4e'); grad.addColorStop(0.5, '#141e28'); grad.addColorStop(1, FONDO);
      g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
      const img = g.getImageData(0, 0, 512, 512);
      let s = 4219;
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
    (scene as unknown as { environmentIntensity: number }).environmentIntensity = 0.55;
    // gira el entorno: el reflejo de su panel de luz cae en el borde del matraz, no en medio (allí parecía una varilla)
    scene.environmentRotation.set(0, 1.9, 0);
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
    l.shadow.camera.near = 3; l.shadow.camera.far = 30; l.shadow.camera.updateProjectionMatrix();
    l.target.position.set(0, 1.4, -0.2); l.target.updateMatrixWorld();
  }, []);
  return (
    <>
      {/* relleno sin brillos especulares (la luz hemisférica sólo ilumina en difuso) */}
      <hemisphereLight args={['#c3d2e2', '#0a0c10', 0.62]} />
      {/* luz clave detrás a la izquierda: recorta el vidrio con brillos en los bordes (no una raya
          en medio del matraz, que se leería como un objeto) y deja un charco de luz en la mesa */}
      <spotLight ref={clave} position={[-6.5, 9, -3.5]} angle={0.42} penumbra={0.9} decay={0} intensity={2.5} color="#fff1df" castShadow
        shadow-mapSize-width={mapa} shadow-mapSize-height={mapa} />
      {/* contraluz fría por la derecha y un frente muy suave */}
      <directionalLight position={[4.5, 4.2, -5.5]} intensity={1.0} color="#cfe0ff" />
      <directionalLight position={[2.0, 3.0, 6.0]} intensity={0.16} color="#e8eef5" />
    </>
  );
}

const TONO_ACES = 6; // ToneMappingMode.ACES_FILMIC de postprocessing 6.39
/** Bloom moderado sólo en lo que emite (el piloto del agitador) + ACES + viñeta. Props constantes. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.5} luminanceThreshold={1.3} luminanceSmoothing={0.2} radius={0.5} />
      <ToneMapping mode={TONO_ACES} />
      <Vignette offset={0.28} darkness={0.6} />
    </EffectComposer>
  );
}

// ───────────────────────────── encuadre ─────────────────────────────

/** Distancia y objetivo para que `puntos` quepan en ±mx, ±my (NDC) mirando desde `dir` (como en Q9). */
/**
 * `tapa` = fracción del ancho del lienzo que cubre por la derecha el panel superpuesto (modo
 * estrecho de LabLayout): el encuadre usa sólo la parte visible y centra el objeto en ella.
 */
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
    let lo = 1, hi = 120;
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
// desde delante a la derecha: la pinza del electrodo (detrás, a la derecha) no tapa la punta de la bureta
const DIR: Record<VistaQ7, THREE.Vector3> = { matraz: dirCamara(14, 20), montaje: dirCamara(15, 16) };

function puntosEncuadre(vista: VistaQ7): THREE.Vector3[] {
  const P: THREE.Vector3[] = [];
  const R = ERLEN.radioMax;
  // el matraz (base y cuello) y el agitador entero: es el OBJETO del fenómeno
  for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    P.push(new THREE.Vector3(Math.cos(a) * R, Y_MATRAZ, Math.sin(a) * R));
    P.push(new THREE.Vector3(Math.cos(a) * 0.2, Y_MATRAZ + ERLEN.altura, Math.sin(a) * 0.2));
  }
  const L = COTAS.agitador.lado / 2, zA = -AGITADOR_CENTRO_PLATO_Z;
  const yLl = PUNTA[1] + DEF_BURETA.extra.yLlave;
  if (vista === 'matraz') {
    // el plato y el frente del agitador (con su mando), y la punta de la bureta con su gota
    for (const sx of [-1, 1]) P.push(new THREE.Vector3(sx * L * 0.9, Y_MATRAZ, zA + L), new THREE.Vector3(sx * L * 0.9, COTAS.base.alto + 0.05, zA + L));
    P.push(new THREE.Vector3(PUNTA[0], PUNTA[1] + 0.3, PUNTA[2]));
    return P;
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) P.push(new THREE.Vector3(sx * L, COTAS.base.alto, zA + sz * L));
  P.push(new THREE.Vector3(PUNTA[0] - 0.32, yLl + 0.22, PUNTA[2]), new THREE.Vector3(PUNTA[0] + 0.32, yLl + 0.22, PUNTA[2]));
  P.push(new THREE.Vector3(PUNTA[0], PUNTA[1] + DEF_BURETA.altura, PUNTA[2]));
  P.push(new THREE.Vector3(VARILLA[0], COTAS.base.alto + ALTO_VARILLA, VARILLA[1]));
  for (const g of COTAS.goteros) P.push(new THREE.Vector3(g[0] - 0.2, 0, g[2]), new THREE.Vector3(g[0], GOTERO_ALTO, g[2]));
  const { pos, giro } = COTAS.phmetro;
  P.push(new THREE.Vector3(pos[0] + Math.cos(giro) * 0.8, 0, pos[2] - Math.sin(giro) * 0.8));
  P.push(new THREE.Vector3(pos[0], COTAS.phmetro.alto, pos[2]));
  return P;
}
/**
 * Margen del encuadre (NDC). El alto manda en todos los tamaños medidos (1366, 1600, 2020 @1,25 y
 * móvil): la caja del objeto —agitador, matraz y punta con su gota— ocupa el 68 % del alto del
 * lienzo, y el matraz con su agitador ≈ 59 % (estándar: 55–70 %). `__qmi07.ocupacion()` lo mide.
 */
const MARGEN: Record<VistaQ7, [number, number]> = { matraz: [0.9, 0.68], montaje: [0.9, 0.7] };

const facil = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Encuadre con transición suave; re-encuadra al cambiar tamaño o vista si el alumno no movió la cámara. */
/** Fracción del lienzo que tapa el panel lateral superpuesto (0 si va al lado o está plegado). */
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
      // con más de la mitad tapada (móvil) no merece la pena encoger: el alumno pidió el panel
      const v = f > 0.6 ? 0 : Math.round(f * 100) / 100;
      setTapa((x) => (x === v ? x : v));
    };
    medir();
    const id = window.setInterval(medir, 400);
    return () => window.clearInterval(id);
  }, [lienzo]);
  return tapa;
}

function Camara({ vista, reducido, encuadre }: { vista: VistaQ7; reducido: boolean; encuadre: number }) {
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
    const p = encuadrar(DIR[vista], new THREE.Vector3(0, 1.4, 0), puntosEncuadre(vista), camera.fov, aspecto, MARGEN[vista][0], MARGEN[vista][1], tapa);
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

/** Estado React que sigue al reloj sólo cuando cambia lo bastante (volúmenes, llave). */
function useSeguirReloj(reloj: React.MutableRefObject<RelojTitulacion>) {
  const [s, setS] = useState(() => ({ vMatraz: reloj.current.volumen, lectura: reloj.current.vbSalida, llave: reloj.current.apertura, gen: reloj.current.generacion }));
  const ref = useRef(s);
  useFrame(() => {
    const r = reloj.current, u = ref.current;
    const n = { vMatraz: r.volumen, lectura: r.vbSalida, llave: r.apertura, gen: r.generacion };
    if (n.gen !== u.gen || Math.abs(n.vMatraz - u.vMatraz) > 0.4 || Math.abs(n.lectura - u.lectura) > 0.08 || Math.abs(n.llave - u.llave) > 0.02 || (n.llave === 0) !== (u.llave === 0)) {
      ref.current = n; setS(n);
    }
  });
  return s;
}

/** Gotas en caída, la que cuelga de la punta y el chorro. */
function Gotas({ reloj, mats, matIndicador }: { reloj: React.MutableRefObject<RelojTitulacion>; mats: MatsQ7; matIndicador: THREE.Material }) {
  const base = useRef<THREE.InstancedMesh>(null);
  const ind = useRef<THREE.InstancedMesh>(null);
  const colgada = useRef<THREE.Mesh>(null);
  const chorro = useRef<THREE.Mesh>(null);
  const geoGota = useMemo(() => esfera(1, 18), []);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), p: new THREE.Vector3(), s: new THREE.Vector3() }), []);
  const ultChorro = useRef({ q: -1, L: -1 });
  useEffect(() => () => { (chorro.current?.geometry as THREE.BufferGeometry | undefined)?.dispose(); }, []);
  const rGota = Math.cbrt((3 * V_GOTA_ML * 1e-3) / (4 * Math.PI)); // u (1 u³ = 1 L = 1000 mL)
  useFrame(() => {
    const r = reloj.current;
    let nb = 0, ni = 0;
    for (const g of r.gotas) {
      const malla = g.tipo === 'base' ? base.current : ind.current; if (!malla) continue;
      const rad = Math.cbrt((3 * g.vol * 1e-3) / (4 * Math.PI));
      // la gota se estira un poco al caer (más rápida, más alargada)
      const alarg = 1 + Math.min(0.5, Math.abs(g.vy) * 0.06);
      tmp.p.set(g.x, Y_MATRAZ + g.y, g.z); tmp.s.set(rad / Math.sqrt(alarg), rad * alarg, rad / Math.sqrt(alarg));
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      if (g.tipo === 'base') malla.setMatrixAt(nb++, tmp.m); else malla.setMatrixAt(ni++, tmp.m);
    }
    for (const [malla, n] of [[base.current, nb], [ind.current, ni]] as const) {
      if (!malla) continue;
      malla.count = n; malla.instanceMatrix.needsUpdate = true;
      malla.visible = n > 0;
    }
    // la gota que cuelga crece hasta el volumen de Tate
    const c = colgada.current;
    if (c) {
      const f = r.chorro ? 0 : Math.min(1, r.colgando / V_GOTA_ML);
      c.visible = f > 0.02;
      const rad = rGota * Math.cbrt(Math.max(f, 1e-3));
      c.scale.set(rad, rad * (1 + 0.35 * f), rad);
      c.position.set(PUNTA[0], PUNTA[1] - rad * (1 + 0.35 * f) * 0.85, PUNTA[2]);
    }
    // chorro: radio por continuidad con caída libre (más fino abajo)
    const ch = chorro.current;
    if (ch) {
      ch.visible = r.chorro && r.Q > 0;
      if (ch.visible) {
        const L = PUNTA[1] - (Y_MATRAZ + r.ySup);
        const u = ultChorro.current;
        if (Math.abs(u.q - r.Q) > 0.01 || Math.abs(u.L - L) > 0.01) {
          u.q = r.Q; u.L = L;
          const r0 = radioChorro(r.Q, 0) / 10, r1 = radioChorro(r.Q, L * 10) / 10;
          ch.geometry.dispose();
          ch.geometry = new THREE.CylinderGeometry(r0, r1, L, 14, 1, true);
        }
        ch.position.set(PUNTA[0], PUNTA[1] - L / 2, PUNTA[2]);
      }
    }
  });
  return (
    <group userData={{ pieza: 'gota' }}>
      <instancedMesh ref={base} args={[geoGota, mats.gota, 24]} frustumCulled={false} />
      <instancedMesh ref={ind} args={[geoGota, matIndicador, 12]} frustumCulled={false} />
      <mesh ref={colgada} geometry={geoGota} material={mats.gota} visible={false} />
      <mesh ref={chorro} material={mats.gota} visible={false}><cylinderGeometry args={[0.01, 0.01, 0.1, 8, 1, true]} /></mesh>
    </group>
  );
}

/** El frasco gotero que dosifica viaja a la boca del matraz, se invierte, gotea y vuelve. */
function FrascosGoteros({ reloj, mats }: { reloj: React.MutableRefObject<RelojTitulacion>; mats: MatsQ7 }) {
  const grupos = useRef<(THREE.Group | null)[]>([]);
  const reposo = useMemo(() => COTAS.goteros.map((p) => new THREE.Vector3(...p)), []);
  const q0 = useMemo(() => new THREE.Quaternion(), []);
  useFrame(() => {
    const D = reloj.current.dosis;
    INDICADORES_LISTA.forEach((id, i) => {
      const g = grupos.current[i]; if (!g) return;
      let k = 0;
      if (D && D.id === id) {
        const T = duracionDosis(D.n);
        k = D.t < GOTERO.llegada ? facil(D.t / GOTERO.llegada) : D.t > T - GOTERO.vuelta ? 1 - facil((D.t - (T - GOTERO.vuelta)) / GOTERO.vuelta) : 1;
      }
      g.position.lerpVectors(reposo[i], BASE_GOTERO, k);
      g.position.y += Math.sin(Math.PI * Math.min(1, k)) * 0.45 * (1 - k);
      g.quaternion.slerpQuaternions(q0, Q_GOTERO, k);
    });
  });
  return (
    <>
      {INDICADORES_LISTA.map((id, i) => (
        <group key={id} ref={(el) => { grupos.current[i] = el; }} position={COTAS.goteros[i]} userData={{ pieza: 'gotero', indicador: id }}>
          <FrascoGotero mats={mats} color={INDICADORES[id].colorFrasco} colorTapa={COLOR_TAPA[id]} />
        </group>
      ))}
    </>
  );
}

// ───────────────────────────── rótulos (DOM) ─────────────────────────────

export type DatoRotulo = { texto: string; x: number; y: number } | null;

/** Proyecta las anclas de los rótulos y coloca los <div> del overlay sin solaparse (≤ 8). */
function ProyectorRotulos({ rotulos, nodos }: { rotulos: RotuloQ7[]; nodos: React.MutableRefObject<Map<string, HTMLDivElement>> }) {
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
      // ancla fuera del encuadre (p. ej. la llave en la vista «Matraz»): el rótulo no se muestra
      if (it.z >= 1 || it.x < 0 || it.x > size.width || it.y < 0 || it.y > size.height) { el.style.opacity = '0'; continue; }
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
      el.style.opacity = '1';
    }
  });
  return null;
}

// ───────────────────────────── diagnóstico (desarrollo) ─────────────────────────────

function DiagnosticoDev({ reloj, calidad }: { reloj: React.MutableRefObject<RelojTitulacion>; calidad: Calidad }) {
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
    const w = window as unknown as { __qmi07?: unknown };
    w.__qmi07 = {
      salud() {
        const m = medida.current;
        return { ...contarNormalesCero(scene), llamadas: m.llamadas, triangulos: m.triangulos, fps: Math.round(m.fps * 10) / 10, calidad, pixelRatio: gl.getPixelRatio() };
      },
      estado() {
        const r = reloj.current;
        return { sistema: r.sistema, indicador: r.indicador, vb: r.vb, lectura: r.vbSalida, ph: r.lectura.ph, Q: r.Q, chorro: r.chorro, apertura: r.apertura, auto: r.auto, plumas: r.plumas.length, historia: r.historia.length, dosis: r.dosis, t: r.t };
      },
      /** sólo desarrollo: hace correr el reloj `s` segundos simulados de golpe */
      simular(s: number) {
        const r = reloj.current;
        const n = Math.ceil(s / 0.05);
        const f = r.factor; r.factor = 1;
        for (let i = 0; i < n; i++) r.paso(0.05);
        r.factor = f;
        return { vb: r.vb, ph: r.lectura.ph };
      },
      aPantalla(x: number, y: number, z: number) {
        const v = new THREE.Vector3(x, y, z).project(camera);
        const rc = gl.domElement.getBoundingClientRect();
        return { x: rc.left + (v.x * 0.5 + 0.5) * rc.width, y: rc.top + (-v.y * 0.5 + 0.5) * rc.height };
      },
      /** fracción del alto y del ancho del lienzo que ocupa el objeto encuadrado (estándar: alto 55–70 %) */
      ocupacion(vista: VistaQ7 = 'matraz') {
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        for (const p of puntosEncuadre(vista)) {
          const v = p.clone().project(camera);
          x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
        }
        return { alto: Math.round(((y1 - y0) / 2) * 1000) / 1000, ancho: Math.round(((x1 - x0) / 2) * 1000) / 1000 };
      },
      escena: scene,
      renderer: gl,
    };
    return () => { delete w.__qmi07; };
  }, [gl, scene, reloj, calidad, camera]);
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

const ROTULO_PIEZA: Record<string, string> = {
  soporte: 'Soporte universal',
  agitador: 'Agitador magnético',
  barra: 'Barra agitadora de PTFE',
  electrodo: 'Electrodo combinado de pH (vidrio + Ag/AgCl)',
  phmetro: 'pH-metro analógico · escala pH y mV',
  matraz: 'Matraz Erlenmeyer de 250 mL',
  bureta: 'Bureta de 50 mL · clase A, ±0,05 mL',
  gota: 'NaOH 0,1 M',
};

function Montaje({ p, rotulo, publicarRotulos, nodos }: {
  p: Titulacion3DProps;
  rotulo: React.MutableRefObject<(d: DatoRotulo) => void>;
  publicarRotulos: (r: RotuloQ7[]) => void;
  nodos: React.MutableRefObject<Map<string, HTMLDivElement>>;
}) {
  const { reloj, calidad, reducido, encuadre = 0, vista } = p;
  const mats = useMatsQ7(calidad);

  // RELOJ ÚNICO: antes que cualquier otra cosa del cuadro
  useFrame((_, dt) => { reloj.current.paso(dt); }, -1);

  // SOMBRAS a demanda: lo que proyecta sombra está quieto salvo el frasco gotero cuando
  // dosifica y el nivel de la bureta; el mapa se rehace entonces (y cada 30 cuadros), no en
  // cada cuadro (ahorra ~50 llamadas de dibujo por cuadro)
  const gl = useThree((st) => st.gl);
  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => { gl.shadowMap.autoUpdate = true; };
  }, [gl, calidad]);
  const sombraN = useRef(0);
  useFrame(() => {
    // cada 30 cuadros (0,5 s a 60 Hz) o mientras el frasco gotero se mueve
    if (reloj.current.dosis || ++sombraN.current >= 30) { sombraN.current = 0; gl.shadowMap.needsUpdate = true; }
  });
  const s = useSeguirReloj(reloj);

  // líquido del matraz: Beer–Lambert por píxel con las estelas
  const uniformes = useMemo(() => crearUniformesLiquido(), []);
  const matLiquido = useMemo(() => crearMaterialLiquido(calidad, uniformes), [calidad, uniformes]);
  useEffect(() => () => matLiquido.dispose(), [matLiquido]);
  useEffect(() => {
    if (!DEV) return;
    const w = window as unknown as { __qmi07u?: unknown };
    w.__qmi07u = uniformes;
    return () => { delete w.__qmi07u; };
  }, [uniformes]);
  useFrame(() => {
    const r = reloj.current, u = uniformes;
    u.uCentroQ7.value.set(0, Y_MATRAZ, 0);
    u.uYSupQ7.value = r.ySup;
    u.uABulkQ7.value.set(...r.lectura.aBulk);
    const M = r.manchas;
    for (let k = 0; k < M.n; k++) {
      u.uManchaQ7.value[k].set(M.centros[k * 4], M.centros[k * 4 + 1], M.centros[k * 4 + 2], Math.max(1e-4, M.centros[k * 4 + 3]));
      u.uDaQ7.value[k].set(M.da[k * 3], M.da[k * 3 + 1], M.da[k * 3 + 2]);
    }
    u.uNQ7.value = M.n;
  });

  // material de las gotas de indicador (la disolución madre, opaca para verse dentro del vidrio)
  const [idInd, setIdInd] = useState<IdIndicador | null>(reloj.current.indicador);
  useFrame(() => { const id = reloj.current.indicador; if (id !== idInd) setIdInd(id); });
  const matGotaInd = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: idInd ? INDICADORES[idInd].colorFrasco : '#dfe9ee', roughness: 0.05, clearcoat: 1, metalness: 0, name: 'q7-gota-indicador',
  }), [idInd]);
  useEffect(() => () => matGotaInd.dispose(), [matGotaInd]);

  const angBarra = useMemo(() => () => reloj.current.angBarra, [reloj]);
  const lecturaPH = useMemo(() => () => reloj.current.lectura.ph, [reloj]);
  const [rpm, setRpm] = useState(reloj.current.rpm);
  const [purgada, setPurgada] = useState(reloj.current.purgada);
  useFrame(() => { const r = reloj.current; if (r.rpm !== rpm) setRpm(r.rpm); if (r.purgada !== purgada) setPurgada(r.purgada); });

  // rótulo al pasar el ratón
  const alMover = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData?.pieza) o = o.parent;
    const pieza = o?.userData?.pieza as string | undefined;
    let texto: string | null = pieza ? ROTULO_PIEZA[pieza] ?? null : null;
    if (pieza === 'agitador' || pieza === 'mando') texto = `Agitador magnético · ${Math.round(reloj.current.rpm)} rpm`;
    if (pieza === 'gotero') { const id = o!.userData.indicador as IdIndicador; const ind = INDICADORES[id]; texto = `${ind.nombre} · vira en pH ${String(ind.rango[0]).replace('.', ',')}–${String(ind.rango[1]).replace('.', ',')}`; }
    if (pieza === 'matraz') texto = `Matraz Erlenmeyer · ${String(reloj.current.sistema.va)} mL de muestra + agua`;
    rotulo.current(texto ? { texto, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY } : null);
  };

  // rótulos con el botón «Rótulos» (≤ 8)
  const yLl = PUNTA[1] + DEF_BURETA.extra.yLlave;
  const rotulos = useMemo<RotuloQ7[]>(() => {
    if (!p.rotulos) return [];
    return [
      { id: 'bu', texto: 'Bureta 50 mL · NaOH', ancla: [PUNTA[0], vista === 'matraz' ? PUNTA[1] + 0.4 : yLl + 1.6, PUNTA[2]] },
      { id: 'll', texto: 'Llave de PTFE', ancla: [PUNTA[0] + 0.3, yLl, PUNTA[2]] },
      { id: 'ma', texto: 'Erlenmeyer 250 mL', ancla: [-ERLEN.radioMax * 0.9, Y_MATRAZ + 0.55, 0.2] },
      { id: 'el', texto: 'Electrodo de pH', ancla: [AGARRE_ELECTRODO[0], AGARRE_ELECTRODO[1] + 0.1, AGARRE_ELECTRODO[2]] },
      { id: 'ba', texto: 'Barra agitadora', ancla: [0.15, Y_MATRAZ + 0.05, 0.25] },
      { id: 'ag', texto: 'Agitador magnético', ancla: [-0.4, COTAS.base.alto + 0.35, 0.8] },
      { id: 'ph', texto: 'pH-metro', ancla: [COTAS.phmetro.pos[0], COTAS.phmetro.alto + 0.05, COTAS.phmetro.pos[2]] },
    ];
  }, [p.rotulos, yLl, vista]);
  useEffect(() => { publicarRotulos(rotulos); }, [rotulos, publicarRotulos]);

  return (
    <group onPointerMove={alMover} onPointerOut={() => rotulo.current(null)}>
      <Camara vista={vista} reducido={reducido} encuadre={encuadre} />
      <Mesa mats={mats} />
      <BaseSoporte mats={mats} varilla={VARILLA} alturaVarilla={ALTO_VARILLA} />
      {/* pinzas: la de la bureta y la del electrodo, en la misma varilla */}
      <group position={[VARILLA[0], COTAS.base.alto, VARILLA[1]]}>
        <Nuez altura={PUNTA[1] + AGARRE_BURETA + 0.02 - COTAS.base.alto} giro={BRAZO_BURETA.giro}>
          <Pinza tipo="bureta" diametro={0.135} largo={BRAZO_BURETA.largo}>
            <Bureta position={[0, -AGARRE_BURETA, 0]} lecturaML={s.lectura} llave={s.llave} colorLiquido={COLORES_LIQUIDO.agua} userData={{ pieza: 'bureta' }} />
            {/* burbuja de aire atrapada en el vástago mientras no se purga */}
            {!purgada && <mesh geometry={esfera(0.017, 14)} material={mats.cromo} position={[0, -AGARRE_BURETA + 0.34, 0]} scale={[1, 2.4, 1]} />}
          </Pinza>
        </Nuez>
        <Nuez altura={AGARRE_ELECTRODO[1] + 0.02 - COTAS.base.alto} giro={BRAZO_ELECTRODO.giro}>
          <Pinza tipo="bureta" diametro={0.142} largo={BRAZO_ELECTRODO.largo} colorForro="#3a434d" />
        </Nuez>
      </group>
      {/* agitador con el matraz encima */}
      <Agitador mats={mats} rpm={rpm} position={[0, COTAS.base.alto, -AGITADOR_CENTRO_PLATO_Z]} />
      <group position={[0, Y_MATRAZ, 0]}>
        <group userData={{ pieza: 'matraz' }}><Erlenmeyer capacidad={250} /></group>
        <LiquidoMatraz volumenML={s.vMatraz} material={matLiquido} />
        <group position={[0, ERLEN.y0, 0]}><BarraAgitadora mats={mats} angulo={angBarra} /></group>
      </group>
      {/* electrodo de pH y su cable al pH-metro */}
      <group position={BULBO} quaternion={Q_ELECTRODO}><ElectrodoPH mats={mats} /></group>
      <Cable desde={CABLE_ELECTRODO} hasta={BNC} holgura={0.12} color="#1c1f23" grosor={0.016} ySuelo={0} />
      <PHmetroAnalogico mats={mats} lectura={lecturaPH} position={COTAS.phmetro.pos} rotation-y={COTAS.phmetro.giro} />
      <FrascosGoteros reloj={reloj} mats={mats} />
      <Gotas reloj={reloj} mats={mats} matIndicador={matGotaInd} />
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
      style={{ left: d.x + 14, top: d.y + 12 }} data-rotulo-raton-q7="">
      {d.texto}
    </div>
  );
}

export default function Titulacion3DScene(props: Titulacion3DProps) {
  const { calidad } = props;
  const alta = calidad === 'alta';
  const ctx = useMemo(() => ({ calidad }), [calidad]);
  const rotulo = useRef<(d: DatoRotulo) => void>(() => undefined);
  const nodos = useRef(new Map<string, HTMLDivElement>());
  const [lista, setLista] = useState<RotuloQ7[]>([]);
  return (
    <div className="absolute inset-0" data-calidad={calidad} data-escena-q7="">
      <Canvas
        key={calidad}
        style={{ width: '100%', height: '100%' }}
        shadows="percentage"
        dpr={alta ? [1, 1.75] : [1, 1.5]}
        gl={{ antialias: !alta, powerPreference: 'high-performance', alpha: false, stencil: false }}
        camera={{ position: [0, 3, 9], fov: 30, near: 0.05, far: 200 }}
      >
        <KitContexto.Provider value={ctx}>
          <Ajustes calidad={calidad} />
          <Luces calidad={calidad} />
          <ControlesBanco objetivo={[0, 1.4, 0]} fondo="laboratorio"
            limites={{ minDistancia: 1.4, maxDistancia: 26, maxPolar: 1.45, minPolar: 0.15, paneo: true, cajaObjetivo: [[-3, 0, -2], [3, 9, 2]] }} />
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
            style={{ transform: 'translate(-9999px, -9999px)' }} data-rotulo-q7={r.id}>
            {r.texto}
          </div>
        ))}
      </div>
    </div>
  );
}
