'use client';
/**
 * bio03/Sintesis3DScene.tsx — el visor de la síntesis de proteínas: la escena molecular
 * (núcleo → poro → citoplasma) y, debajo, el dock con la secuencia y el código genético.
 *
 * UN SOLO RELOJ (`RelojSintesis`): avanza una vez por cuadro dentro del bucle de la
 * escena (prioridad −20); de él leen la polimerasa y el ADN, el ribosoma, los ARNt, la
 * cadena, la cámara, la niebla y el dock. Escala molecular real: 1 u = 1 nm.
 *
 * Sin texto en la escena salvo rótulos cortos de las piezas (apagados por defecto).
 * Lo que NO se muestra en ningún sitio antes de que el alumno elija: la base del ARN
 * que toca ni el ARNt (anticodón) que toca.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping, Vignette } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Pause, Play, Tag, ZoomIn, ZoomOut, X, Layers } from 'lucide-react';
import { calidadPorDefecto } from '../_kit/LabStage';
import type { Calidad } from '../_kit';
import { RelojSintesis, VELOCIDADES } from './reloj';
import {
  mallaDe, formaPolimerasa, formaSubunidadMenor, formaSubunidadMayor, formaARNt, formaFactorLiberacion,
  formaFactorAlargamiento, formaGlobular,
} from './superficie';
import { geometriaDeMalla } from './instancias';
import ActoTranscripcion, { CAJA_TRANSCRIPCION, CAJA_BURBUJA, POS_MG } from './ActoTranscripcion';
import ActoTraduccion, { CAJA_RIBOSOMA, CAJA_SITIOS, CAJA_PEPTIDO, POS_PEPTIDO } from './ActoTraduccion';
import { Cielo, Niebla, Bokeh, ProteinasLejanas, NTPLibres, ARNtLibres } from './Ambiente';
import DockSintesis, { dibujarRueda } from './Dock';
import { caminoTunel, CPT, LARGO_CODON, LARGO_TUNEL, caminoSalidaARN, type V3 } from './molecular';

const DEV = process.env.NODE_ENV !== 'production';
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

type Escena = 'I' | 'II';
type Vista = 'general' | 'detalle';

/** Qué acto se dibuja: el I hasta la mitad de la exportación, el II después. */
const escenaDe = (r: RelojSintesis): Escena => (r.acto === 'transcripcion' ? 'I' : r.acto === 'traduccion' ? 'II' : r.exportacion < 0.5 ? 'I' : 'II');

// ───────────────────────────── render y luces ─────────────────────────────

function AjustesRender() {
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.localClippingEnabled = true;   // cortes de la polimerasa y del ribosoma
  }, [gl]);
  return null;
}

/** Estudio molecular: clave cálida con sombra suave, relleno frío y dos contraluces que recortan las moléculas. */
function Luces({ alta }: { alta: boolean }) {
  return (
    <>
      <hemisphereLight args={['#dbe8ff', '#1a1420', 0.35]} />
      <directionalLight position={[-9, 15, 13]} intensity={2.4} color="#fff2e2" castShadow={alta}
        shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-radius={6}
        shadow-camera-left={-24} shadow-camera-right={24} shadow-camera-top={24} shadow-camera-bottom={-24} shadow-camera-near={1} shadow-camera-far={80} />
      <directionalLight position={[12, -3, 9]} intensity={0.55} color="#bfd6ff" />
      <directionalLight position={[6, 8, -14]} intensity={1.9} color="#a9c8ff" />
      <directionalLight position={[-12, 2, -10]} intensity={1.1} color="#ffc9e4" />
      <Environment resolution={alta ? 256 : 128} frames={1} environmentIntensity={0.8}>
        <color attach="background" args={['#0a1420']} />
        <Lightformer form="rect" intensity={1.3} color="#f2f6ff" position={[0, 8, 3]} rotation-x={Math.PI / 2} scale={[14, 7, 1]} />
        <Lightformer form="rect" intensity={2.4} color="#ffffff" position={[-7, 2, 4]} rotation-y={Math.PI / 2} scale={[1.6, 7, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#cfe0ff" position={[7, 1, 2]} rotation-y={-Math.PI / 2} scale={[1.4, 7, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#ffd9ef" position={[0, 2, -8]} scale={[12, 5, 1]} />
        <Lightformer form="rect" intensity={0.7} color="#ffe8d0" position={[0, 1, 9]} rotation-y={Math.PI} scale={[9, 3, 1]} />
      </Environment>
    </>
  );
}

const TONO_NEUTRO = 8; // ToneMappingMode.NEUTRAL de postprocessing 6.x
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.8} luminanceThreshold={0.88} luminanceSmoothing={0.2} radius={0.66} />
      <Vignette eskil={false} offset={0.3} darkness={0.55} />
      <ToneMapping mode={TONO_NEUTRO} />
    </EffectComposer>
  );
}

// ───────────────────────────── reloj y coreografía ─────────────────────────────

interface Coreografia {
  /** núcleo → citoplasma (fondo y niebla) */
  mezcla: React.RefObject<number>;
  /** niebla extra (la cámara cruza el poro) */
  espesor: React.RefObject<number>;
  /** la polimerasa suelta el ARN */
  liberacion: React.RefObject<number>;
  /** el ARNm llega al ribosoma */
  llegada: React.RefObject<number>;
  /** la cámara se aleja (0 → 1 → 0) */
  alejar: React.RefObject<number>;
}

/** Avanza el reloj ÚNICO al principio de cada cuadro y deriva de él la coreografía de la exportación. */
function Motor({ reloj, c }: { reloj: RelojSintesis; c: Coreografia }) {
  useEffect(() => { reloj.escenaActiva = true; return () => { reloj.escenaActiva = false; }; }, [reloj]);
  useFrame((_, dt) => {
    reloj.paso(dt);
    const e = reloj.exportacion;
    const exp = reloj.acto === 'exportacion';
    c.mezcla.current = reloj.acto === 'transcripcion' ? 0 : exp ? sm(0.3, 0.7, e) : 1;
    c.espesor.current = exp ? sm(0.18, 0.5, e) * (1 - sm(0.5, 0.86, e)) : 0;
    c.liberacion.current = exp ? sm(0, 0.34, e) : reloj.acto === 'transcripcion' ? 0 : 1;
    c.llegada.current = exp ? sm(0.5, 0.94, e) : 1;
    c.alejar.current = exp ? sm(0.12, 0.5, e) * (1 - sm(0.5, 0.9, e)) : 0;
  }, -20);
  return null;
}

// ───────────────────────────── cámara ─────────────────────────────

interface Encuadre { centro: V3; semiAlto: number; semiAncho: number; dir: V3 }
const encuadreDe = (esc: Escena, vista: Vista, final = false): Encuadre => {
  if (esc === 'I') return vista === 'general' ? { ...CAJA_TRANSCRIPCION, dir: [0.62, 0.3, 1] } : { ...CAJA_BURBUJA, dir: [0.32, 0.05, 1] };
  // al terminar, la cámara va a la proteína liberada
  if (final) return vista === 'general' ? { ...CAJA_PEPTIDO, dir: [0.2, 0.32, 1] } : { ...CAJA_PEPTIDO, centro: POS_PEPTIDO, semiAlto: 1.9, semiAncho: 2.6, dir: [0.2, 0.32, 1] };
  // desde delante a la izquierda: E·P·A quedan de izquierda a derecha (como en el dock) y los ARNt llegan por el lado lejano
  return vista === 'general' ? { ...CAJA_RIBOSOMA, dir: [-0.42, 0.3, 1] } : { ...CAJA_SITIOS, dir: [-0.14, 0.12, 1] };
};

function Camara({ escena, vista, alejar, final }: { escena: Escena; vista: Vista; alejar: React.RefObject<number>; final: boolean }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const meta = useRef({ pos: new THREE.Vector3(), obj: new THREE.Vector3(), activa: false });
  const primera = useRef(true);
  const calcular = useCallback(() => {
    const e = encuadreDe(escena, vista, final);
    const aspect = size.width / Math.max(1, size.height);
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const dist = Math.max(e.semiAlto / t, e.semiAncho / (t * aspect));
    const dir = new THREE.Vector3(...e.dir).normalize();
    const obj = new THREE.Vector3(...e.centro);
    return { pos: obj.clone().addScaledVector(dir, dist), obj };
  }, [escena, vista, final, size.width, size.height, camera]);
  useLayoutEffect(() => {
    const { pos, obj } = calcular();
    if (primera.current || !controls) {
      camera.position.copy(pos); camera.lookAt(obj);
      camera.near = 0.5; camera.far = 600; camera.updateProjectionMatrix();
      if (controls) { controls.target.copy(obj); controls.update(); primera.current = false; }
      meta.current.activa = false;
      return;
    }
    meta.current = { pos, obj, activa: true };
  }, [calcular, camera, controls]);
  const dirTmp = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    const m = meta.current;
    const a = alejar.current ?? 0;
    if (a > 0.001 && controls) {
      // exportación: la cámara retrocede (y vuelve) a lo largo de su línea de vista
      const { pos, obj } = calcular();
      dirTmp.copy(pos).sub(obj);
      camera.position.copy(obj).addScaledVector(dirTmp, 1 + 0.9 * a);
      controls.target.copy(obj); controls.update();
      m.activa = true; m.pos.copy(pos); m.obj.copy(obj);
      return;
    }
    if (!m.activa || !controls) return;
    const k = 1 - Math.exp(-dt * 3.2);
    camera.position.lerp(m.pos, k); controls.target.lerp(m.obj, k); controls.update();
    if (camera.position.distanceTo(m.pos) < 0.01 && controls.target.distanceTo(m.obj) < 0.01) m.activa = false;
  });
  return null;
}

/** Giro lento de todo el conjunto (el «gancho» del estado inicial); quieto con pausa. */
function Deriva({ reloj, children }: { reloj: RelojSintesis; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = reloj.t;
    if (g.current) { g.current.rotation.y = 0.24 * Math.sin((2 * Math.PI * t) / 30); g.current.rotation.x = 0.05 * Math.sin((2 * Math.PI * t) / 41); }
  });
  return <group ref={g}>{children}</group>;
}

// ───────────────────────────── superficies (se calculan sin bloquear) ─────────────────────────────

interface Mallas {
  pol: THREE.BufferGeometry | null;
  traduccion: { menor: THREE.BufferGeometry; mayor: THREE.BufferGeometry; arnt: THREE.BufferGeometry; erf: THREE.BufferGeometry; ef: THREE.BufferGeometry } | null;
  lejanas: THREE.BufferGeometry[];
}
/** Calcula las superficies moleculares una a una, cediendo el hilo entre ellas. */
function useMallas(): Mallas {
  const [m, setM] = useState<Mallas>({ pol: null, traduccion: null, lejanas: [] });
  useEffect(() => {
    let vivo = true;
    const hechas: THREE.BufferGeometry[] = [];
    const tarea = <T,>(fn: () => T) => new Promise<T>((res) => setTimeout(() => res(fn()), 0));
    (async () => {
      const g = (f: ReturnType<typeof formaPolimerasa>) => { const x = geometriaDeMalla(mallaDe(f)); hechas.push(x); return x; };
      const pol = await tarea(() => g(formaPolimerasa()));
      if (!vivo) return;
      setM((s) => ({ ...s, pol }));
      const lejanas = await tarea(() => [g(formaGlobular(3, 4.5, '#ffffff')), g(formaGlobular(8, 3.2, '#ffffff')), g(formaGlobular(13, 5.5, '#ffffff'))]);
      if (!vivo) return;
      setM((s) => ({ ...s, lejanas }));
      const menor = await tarea(() => g(formaSubunidadMenor()));
      const mayor = await tarea(() => g(formaSubunidadMayor()));
      const arnt = await tarea(() => g(formaARNt()));
      const erf = await tarea(() => g(formaFactorLiberacion()));
      const ef = await tarea(() => g(formaFactorAlargamiento()));
      if (!vivo) return;
      setM((s) => ({ ...s, traduccion: { menor, mayor, arnt, erf, ef } }));
    })();
    return () => { vivo = false; hechas.forEach((x) => x.dispose()); };
  }, []);
  return m;
}

// ───────────────────────────── rótulos ─────────────────────────────

interface Rotulo { texto: string; p: V3; dx: number; dy: number }
const ROTULOS_I: Rotulo[] = [
  { texto: 'ARN polimerasa II', p: [1.5, 7.6, 2.6], dx: 70, dy: -24 },
  { texto: 'Hebra molde', p: [9, 0.6, 0.6], dx: 40, dy: 34 },
  { texto: 'Hebra codificante', p: [-1.6, 2.7, 0.9], dx: 64, dy: -46 },
  { texto: 'Mg²⁺ (sitio activo)', p: POS_MG, dx: 86, dy: 30 },
  { texto: 'Embudo de los NTP', p: [1.4, -7.4, 3.4], dx: 70, dy: 18 },
  { texto: 'ARNm (sale 5′ primero)', p: caminoSalidaARN(20, 0), dx: -60, dy: -30 },
];
const ROTULOS_II: Rotulo[] = [
  { texto: 'Subunidad mayor 60S', p: [-8, 14, 2], dx: -60, dy: -24 },
  { texto: 'Subunidad menor 40S', p: [-8, -7, 4], dx: -60, dy: 26 },
  { texto: 'E', p: [-LARGO_CODON, -0.9, 1.2], dx: -10, dy: 34 },
  { texto: 'P', p: [0, -0.9, 1.2], dx: 0, dy: 40 },
  { texto: 'A', p: [LARGO_CODON, -0.9, 1.2], dx: 10, dy: 34 },
  { texto: 'Centro peptidiltransferasa', p: CPT, dx: 80, dy: -40 },
  { texto: 'Túnel de salida', p: caminoTunel(LARGO_TUNEL * 0.8), dx: 70, dy: -24 },
];
const ROTULOS_III: Rotulo[] = [
  { texto: 'Proteína liberada (ovillo)', p: POS_PEPTIDO, dx: 70, dy: -36 },
  { texto: 'ARNm', p: [-5, -0.4, 0], dx: -40, dy: 30 },
];
function Rotulos({ escena, final }: { escena: Escena; final: boolean }) {
  const lista = escena === 'I' ? ROTULOS_I : final ? ROTULOS_III : ROTULOS_II;
  return (
    <>
      {lista.map((r) => {
        const L = Math.hypot(r.dx, r.dy), ang = Math.atan2(r.dy, r.dx);
        return (
          <Html key={r.texto} position={r.p} zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
            <div className="relative h-0 w-0">
              <span className="absolute left-[-3px] top-[-3px] h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              <span className="absolute left-0 top-0 h-px origin-left bg-white/50" style={{ width: L, transform: `rotate(${ang}rad)` }} />
              <span className="absolute whitespace-nowrap rounded border border-white/15 bg-[#0b1422]/85 px-1.5 py-0.5 text-[10.5px] font-medium leading-none text-slate-100"
                style={{ left: r.dx, top: r.dy, transform: `translate(${r.dx < 0 ? '-100%' : r.dx === 0 ? '-50%' : '0'}, -50%)` }}>
                {r.texto}
              </span>
            </div>
          </Html>
        );
      })}
    </>
  );
}

// ───────────────────────────── diagnóstico (sólo desarrollo) ─────────────────────────────

function DiagnosticoDev({ reloj, listo }: { reloj: RelojSintesis; listo: boolean }) {
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
    m.n++; if (!m.t0) m.t0 = ahora;
    if (ahora - m.t0 >= 1000) { m.fps = (m.n * 1000) / (ahora - m.t0); m.n = 0; m.t0 = ahora; }
    // prioridad 0: una prioridad > 0 haría que R3F dejara de pintar solo (pantalla negra sin posproceso).
    // Se lee lo que pintó el cuadro anterior.
  }, 0);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __bio03?: unknown };
    w.__bio03 = {
      listo, reloj, escena: scene, camara: camera,
      salud() {
        let normalesCero = 0, mallas = 0;
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
        return { llamadas: m.llamadas, triangulos: m.triangulos, mallas, normalesCero, conCero, fps: Math.round(m.fps * 10) / 10, acto: reloj.acto, cola: reloj.cola.length };
      },
    };
    return () => { delete w.__bio03; };
  }, [gl, scene, camera, listo, reloj]);
  return null;
}

// ───────────────────────────── visor ─────────────────────────────

function Boton({ activo, onClick, children, titulo, ancho }: { activo?: boolean; onClick: () => void; children: React.ReactNode; titulo: string; ancho?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={titulo} aria-label={titulo} aria-pressed={activo}
      className={`flex h-7 items-center justify-center gap-1 rounded-md border text-[11px] font-semibold transition-colors ${ancho ? 'px-2' : 'w-7'} ${activo ? 'border-violet-300/60 bg-violet-400/20 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}
const etiquetaVel = (v: number) => (v === 1 ? '×1' : `×1/${Math.round(1 / v)}`);
const fmtLenta = (f: number) => `×1/${f >= 100 ? Math.round(f / 10) * 10 : Math.round(f)}`;

export interface VisorSintesisProps {
  reloj: RelojSintesis;
  /** el visor avisa de la calidad efectiva */
  onCalidad?: (c: Calidad) => void;
}

export default function VisorSintesis({ reloj, onCalidad }: VisorSintesisProps) {
  const [calidad] = useState<Calidad>(() => calidadPorDefecto());
  const alta = calidad === 'alta';
  useEffect(() => { onCalidad?.(calidad); }, [calidad, onCalidad]);
  const mallas = useMallas();
  const escena = useSyncExternalStore(reloj.suscribir.bind(reloj), () => escenaDe(reloj), () => escenaDe(reloj));
  const exportando = useSyncExternalStore(reloj.suscribir.bind(reloj), () => reloj.acto === 'exportacion', () => false);
  const final = useSyncExternalStore(reloj.suscribir.bind(reloj), () => reloj.hecho.terminada && !reloj.actual, () => false);
  const [vista, setVista] = useState<Vista>('general');
  const [rotulos, setRotulos] = useState(false);
  const [corte, setCorte] = useState(true);
  const [velocidad, setVelocidad] = useState<number>(1);
  const [pausa, setPausa] = useState<boolean>(reloj.pausa);
  const [ruedaGrande, setRuedaGrande] = useState(false);
  useEffect(() => { reloj.velocidad = velocidad; }, [reloj, velocidad]);
  useEffect(() => { reloj.pausa = pausa; }, [reloj, pausa]);

  const c: Coreografia = {
    mezcla: useRef(escena === 'II' ? 1 : 0), espesor: useRef(0), liberacion: useRef(0), llegada: useRef(1), alejar: useRef(0),
  };
  const listo = !!mallas.pol;
  const lenta = useSyncExternalStore(reloj.suscribir.bind(reloj), () => Math.round(reloj.camaraLenta), () => 0);

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#05090f]" data-visor="sintesis">
      <div className="relative min-h-0 flex-1">
        <Canvas
          dpr={alta ? [1, 1.75] : [1, 1.25]}
          shadows={alta ? 'percentage' : false}
          gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
          camera={{ position: [6, 4, 40], fov: 30, near: 0.5, far: 600 }}
          style={{ width: '100%', height: '100%' }}
        >
          <AjustesRender />
          <Cielo mezcla={c.mezcla} />
          <Niebla mezcla={c.mezcla} espesor={c.espesor} />
          <Luces alta={alta} />
          <OrbitControls makeDefault enableDamping dampingFactor={0.09} enablePan={false} minDistance={6} maxDistance={140} />
          <Camara escena={escena} vista={vista} alejar={c.alejar} final={final} />
          <Motor reloj={reloj} c={c} />
          <Deriva reloj={reloj}>
            {escena === 'I'
              ? <ActoTranscripcion reloj={reloj} alta={alta} geoPolimerasa={mallas.pol} liberacion={c.liberacion} corte={corte} />
              : <ActoTraduccion reloj={reloj} alta={alta} geo={mallas.traduccion} llegada={c.llegada} corte={corte} />}
            {rotulos && !exportando && <Rotulos escena={escena} final={final} />}
          </Deriva>
          {escena === 'I' && <NTPLibres reloj={reloj} alta={alta} />}
          {escena === 'II' && mallas.traduccion && <ARNtLibres reloj={reloj} geoARNt={mallas.traduccion.arnt} geoEF={mallas.traduccion.ef} />}
          {mallas.lejanas.length > 0 && (
            <ProteinasLejanas reloj={reloj} geos={mallas.lejanas} n={alta ? 12 : 8}
              colores={escena === 'I' ? ['#6f93ad', '#7c8fb0', '#8a80b4', '#5f8f9a'] : ['#8a72b4', '#b0866f', '#6f86ac', '#9c6f9a']} />
          )}
          <Bokeh alta={alta} mezcla={c.mezcla} />
          <DiagnosticoDev reloj={reloj} listo={listo} />
          {alta && <Posproceso />}
        </Canvas>

        {!listo && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-white/10 bg-[#0b1422]/80 px-3 py-1.5 text-[11px] font-semibold text-violet-200">Plegando las moléculas…</span>
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Vista y tiempo">
            <Boton activo={vista === 'detalle'} onClick={() => setVista((v) => (v === 'general' ? 'detalle' : 'general'))}
              titulo={vista === 'general' ? (escena === 'I' ? 'Acercar a la burbuja' : final ? 'Acercar a la proteína' : 'Acercar a los sitios E·P·A') : 'Vista completa'}>
              {vista === 'general' ? <ZoomIn size={14} /> : <ZoomOut size={14} />}
            </Boton>
            <Boton activo={corte} onClick={() => setCorte((v) => !v)} titulo={corte ? 'Ver la máquina entera (translúcida)' : 'Ver la máquina en corte'}><Layers size={14} /></Boton>
            <Boton activo={rotulos} onClick={() => setRotulos((r) => !r)} titulo="Rótulos de las piezas"><Tag size={14} /></Boton>
            <span className="mx-0.5 w-px self-stretch bg-white/10" />
            <Boton activo={pausa} onClick={() => setPausa((p) => !p)} titulo={pausa ? 'Reanudar la agitación térmica' : 'Pausar la agitación térmica'}>{pausa ? <Play size={14} /> : <Pause size={14} />}</Boton>
            {VELOCIDADES.map((v) => (
              <Boton key={v} ancho activo={velocidad === v} onClick={() => setVelocidad(v)} titulo={v === 1 ? 'Velocidad normal de la animación' : 'Más lento'}>{etiquetaVel(v)}</Boton>
            ))}
          </div>
          <span className="rounded bg-[#0b1422]/70 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-200/90" title="Respecto a la velocidad real: la Pol II añade ≈ 50 nt/s y el ribosoma ≈ 5,6 codones/s">
            {fmtLenta(lenta)} — cámara lenta
          </span>
        </div>

        {exportando && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
            <span className="rounded-full border border-white/15 bg-[#0f1a2b]/85 px-3.5 py-1.5 text-center text-[12px] font-semibold text-slate-100 backdrop-blur">
              El ARNm sale del núcleo por un poro nuclear y llega a un ribosoma
            </span>
          </div>
        )}

        {ruedaGrande && <RuedaGrande reloj={reloj} onCerrar={() => setRuedaGrande(false)} />}
      </div>
      <DockSintesis reloj={reloj} onAmpliarRueda={() => setRuedaGrande(true)} />
    </div>
  );
}

/** La rueda del código genético, grande, sobre la escena. */
function RuedaGrande({ reloj, onCerrar }: { reloj: RelojSintesis; onCerrar: () => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [lado, setLado] = useState(0);
  useLayoutEffect(() => {
    const el = caja.current?.parentElement; if (!el) return;
    const ro = new ResizeObserver(([e]) => setLado(Math.floor(Math.min(e.contentRect.height - 24, e.contentRect.width - 24, 520))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!lienzo.current || lado < 60) return;
    const d = () => dibujarRueda(lienzo.current!, lado, reloj, true);
    d();
    return reloj.suscribir(() => { if (reloj.actual) d(); });
  }, [lado, reloj]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onCerrar]);
  return (
    <div ref={caja} className="absolute inset-0 z-20 flex items-center justify-center bg-[#05090f]/75 backdrop-blur-sm" onClick={onCerrar}>
      <div className="relative rounded-2xl border border-white/10 bg-[#0a1220] p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <canvas ref={lienzo} style={{ width: lado, height: lado }} role="img" aria-label="Rueda del código genético: 64 codones, AUG de inicio y UAA, UAG, UGA de paro" />
        <button type="button" onClick={onCerrar} className="absolute right-2 top-2 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Cerrar"><X size={16} /></button>
      </div>
    </div>
  );
}
