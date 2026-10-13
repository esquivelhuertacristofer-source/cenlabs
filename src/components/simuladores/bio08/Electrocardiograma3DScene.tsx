'use client';
/**
 * bio08/Electrocardiograma3DScene.tsx — el visor completo del electrocardiograma:
 * escena 3D (corazón anatómico con su sistema de conducción y la onda eléctrica,
 * vector cardiaco, torso de vidrio con los electrodos y el triángulo de Einthoven)
 * y, debajo, el dock con la tira de papel y el lazo vectorcardiográfico.
 *
 * UN SOLO RELOJ (`RelojCardiaco`): avanza una vez por cuadro dentro del bucle de la
 * escena; de él leen los sombreadores (onda, contracción), las válvulas, la flecha
 * del dipolo, la proyección en la derivación y la pluma de la tira. El nodo SA
 * manda: un cambio de FC (un fármaco) se aplica al empezar el latido siguiente.
 *
 * Lo que NO se muestra en ningún sitio: la FC, el R-R o el diagnóstico.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, Lightformer, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Pause, Play, StepForward, Layers, Spline, Tag, User, Heart } from 'lucide-react';
import { calidadPorDefecto } from '../_kit/LabStage';
import type { CalidadCorazon, DatosCorazon } from './corazon';
import { cargarCorazon } from './datos';
import { RelojCardiaco, VELOCIDADES, valvulas } from './reloj';
import type { Derivacion } from './electro';
import type { V3 } from './anatomia';
import { REF, VASOS } from './anatomia';
import { nuevosUniformes, type UniformesTiempo } from './sombreadores';
import { Corazon, Conduccion, Valvulas, Torso, Electrodos, Einthoven, Dipolo } from './piezas';
import DockECG from './DockECG';

type Vista = 'torax' | 'corazon';
const DEV = process.env.NODE_ENV !== 'production';

// ───────────────────────────── estudio ─────────────────────────────

/** Fondo de estudio: degradado radial oscuro (sin grano visible). */
function FondoEstudio() {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d'); if (!g) return;
    const grad = g.createRadialGradient(256, 230, 20, 256, 256, 400);
    grad.addColorStop(0, '#22334a'); grad.addColorStop(0.45, '#142235'); grad.addColorStop(1, '#060b13');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
    // un pelo de ruido para que el degradado no haga bandas
    const img = g.getImageData(0, 0, 512, 512);
    let s = 7;
    for (let i = 0; i < img.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const d = ((s >> 16) & 3) - 1.5; img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d; }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const antes = scene.background;
    scene.background = tex;
    return () => { scene.background = antes; tex.dispose(); };
  }, [scene]);
  return null;
}

/** Luz de estudio: clave cálida, relleno frío y dos contraluces que recortan el corazón del fondo. */
function Luces({ alta }: { alta: boolean }) {
  return (
    <>
      <hemisphereLight args={['#dfe8f2', '#1b1512', 0.22]} />
      <directionalLight position={[-3, 5, 6]} intensity={2.7} color="#fff3e6" />
      <directionalLight position={[5, -0.5, 4]} intensity={0.55} color="#cfe0ff" />
      <directionalLight position={[2.5, 3, -6]} intensity={2.2} color="#bcd6ff" />
      <directionalLight position={[-4, 1, -5]} intensity={1.1} color="#ffd9cf" />
      <Environment resolution={alta ? 256 : 128} frames={1} environmentIntensity={0.85}>
        <color attach="background" args={['#0b121c']} />
        <Lightformer form="rect" intensity={1.2} color="#f4f7fb" position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={2.6} position={[-5, 1.5, 3]} rotation-y={Math.PI / 2} scale={[1.4, 6, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#d8e6ff" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[1.2, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffe7d6" position={[0, 1, 7]} rotation-y={Math.PI} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#c9dcff" position={[0, 2, -6]} scale={[10, 4, 1]} />
      </Environment>
    </>
  );
}

function AjustesRender() {
  const gl = useThree((s) => s.gl);
  useLayoutEffect(() => {
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl]);
  return null;
}

const TONO_NEUTRO = 8; // ToneMappingMode.NEUTRAL de postprocessing 6.39
/** Bloom sólo en emisores (umbral alto) y sólo en calidad alta. Props constantes a propósito. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.9} luminanceSmoothing={0.2} radius={0.62} />
      <ToneMapping mode={TONO_NEUTRO} />
    </EffectComposer>
  );
}

// ───────────────────────────── cámara ─────────────────────────────

interface Encuadre { centro: V3; semiAlto: number; semiAncho: number; dir: V3 }
const ENCUADRES: Record<Vista, Encuadre> = {
  // el corazón (2,3 u de alto con los grandes vasos) ocupa ≈ 2/3 del alto; caben el triángulo y los electrodos
  torax: { centro: [0.0, -0.22, 0], semiAlto: 1.6, semiAncho: 1.62, dir: [0.12, 0.16, 1] },
  // de cerca, mirando un poco más de frente al corte de cuatro cámaras
  corazon: { centro: [0.0, 0.06, -0.15], semiAlto: 1.24, semiAncho: 1.0, dir: [0.2, 0.3, 1] },
};

function CamaraECG({ vista }: { vista: Vista }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const meta = useRef<{ pos: THREE.Vector3; obj: THREE.Vector3; activa: boolean }>({ pos: new THREE.Vector3(), obj: new THREE.Vector3(), activa: false });
  const primera = useRef(true);
  const calcular = useCallback(() => {
    const e = ENCUADRES[vista];
    const aspect = size.width / Math.max(1, size.height);
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const dist = Math.max(e.semiAlto / t, e.semiAncho / (t * aspect));
    const dir = new THREE.Vector3(...e.dir).normalize();
    const obj = new THREE.Vector3(...e.centro);
    return { pos: obj.clone().addScaledVector(dir, dist), obj };
  }, [vista, size.width, size.height, camera]);
  useLayoutEffect(() => {
    const { pos, obj } = calcular();
    if (primera.current || !controls) {
      camera.position.copy(pos); camera.lookAt(obj);
      if (controls) { controls.target.copy(obj); controls.update(); primera.current = false; }
      camera.near = 0.05; camera.far = 100; camera.updateProjectionMatrix();
      meta.current.activa = false;
      return;
    }
    meta.current = { pos, obj, activa: true };
  }, [calcular, camera, controls]);
  useFrame((_, dt) => {
    const m = meta.current; if (!m.activa || !controls) return;
    const k = 1 - Math.exp(-dt * 5);
    camera.position.lerp(m.pos, k); controls.target.lerp(m.obj, k); controls.update();
    if (camera.position.distanceTo(m.pos) < 0.005 && controls.target.distanceTo(m.obj) < 0.005) m.activa = false;
  });
  return null;
}

// ───────────────────────────── tiempo ─────────────────────────────

/** Avanza el reloj y pasa sus tiempos a los uniformes (antes que cualquier otra pieza). */
function Motor({ reloj, u, datos, valv }: { reloj: RelojCardiaco; u: UniformesTiempo; datos: DatosCorazon; valv: React.MutableRefObject<{ av: number; sigmoidea: number; cV: number }> }) {
  useFrame((_, dt) => {
    reloj.avanzar(dt * 1000);
    const m = reloj.mapeo, mod = reloj.modelo; if (!m || !mod) return;
    const a = datos.act, t = reloj.tCicloSuave;
    u.uT.value = t; u.uRR.value = m.rr; u.uKA.value = m.kA;
    u.uVDep0.value = m.vDep[0]; u.uSV.value = m.vDep[1] / (a.vMax - a.vMin);
    u.uVRep0.value = m.vRep[0]; u.uSR.value = m.vRep[1] / (a.rMax - a.rMin);
    u.uVMin.value = a.vMin; u.uRMin.value = a.rMin;
    u.uTAV.value = m.tAV; u.uTHis.value = m.tHis; u.uKV.value = m.kV;
    u.uDurA.value = m.aDep[1]; u.uDurV.value = m.vDep[1];
    const v = valvulas(t, m, mod);
    u.uCV.value = v.cV;
    valv.current = v;
  }, -1);
  return null;
}

// ───────────────────────────── rótulos ─────────────────────────────

type Modo = 'corte' | 'entero';
interface Rotulo {
  texto: string; p: V3; dx: number; dy: number; vistas: Vista[]; modos: Modo[];
  /** el ancla se lleva a la superficie visible del corazón (rayo desde la cámara) */
  superficie?: boolean;
}
function listaRotulos(d: DatosCorazon): Rotulo[] {
  const medio = (n: string): V3 | null => { const r = d.ramas.find((x) => x.nombre === n); return r ? r.puntos[Math.floor(r.puntos.length / 2)] : null; };
  const ultimo = (n: string): V3 | null => { const r = d.ramas.find((x) => x.nombre === n); return r ? r.puntos[r.puntos.length - 1] : null; };
  const purk = d.ramas.filter((x) => x.nombre.startsWith('Purkinje VI'));
  const pk = purk.length ? purk[Math.floor(purk.length * 0.35)].puntos[0] : null;
  const ambos: Vista[] = ['torax', 'corazon'], cerca: Vista[] = ['corazon'], lejos: Vista[] = ['torax'];
  const todo: Modo[] = ['corte', 'entero'], corte: Modo[] = ['corte'];
  const L: (Rotulo | null | false)[] = [
    { texto: 'Nodo SA', p: d.sa, dx: -70, dy: -8, vistas: ambos, modos: todo },
    { texto: 'Nodo AV', p: d.nodoAV, dx: -96, dy: 28, vistas: ambos, modos: corte },
    !!medio('His') && { texto: 'Haz de His', p: medio('His')!, dx: -104, dy: 50, vistas: cerca, modos: corte },
    !!ultimo('rama izquierda') && { texto: 'Rama izquierda', p: ultimo('rama izquierda')!, dx: 84, dy: -40, vistas: cerca, modos: corte },
    !!medio('rama derecha') && { texto: 'Rama derecha', p: medio('rama derecha')!, dx: -112, dy: 64, vistas: cerca, modos: corte },
    !!pk && { texto: 'Red de Purkinje', p: pk, dx: 88, dy: 46, vistas: cerca, modos: corte },
    { texto: 'AD', p: REF.centroAD, dx: -86, dy: -4, vistas: ambos, modos: todo, superficie: true },
    { texto: 'AI', p: REF.centroAI, dx: 62, dy: 30, vistas: cerca, modos: corte },
    { texto: 'VD', p: REF.centroVD, dx: -26, dy: 50, vistas: ambos, modos: todo, superficie: true },
    { texto: 'VI', p: [REF.centroVI[0] + 0.12, REF.centroVI[1] - 0.05, REF.centroVI[2]], dx: 70, dy: 22, vistas: ambos, modos: todo, superficie: true },
    { texto: 'Aorta', p: VASOS.aorta.puntos[19], dx: 56, dy: -20, vistas: ambos, modos: todo },
    { texto: 'Tronco pulmonar', p: VASOS.tronco.puntos[8], dx: 92, dy: -2, vistas: cerca, modos: todo },
    { texto: 'Vena cava sup.', p: VASOS.cavaSup.puntos[9], dx: -62, dy: 46, vistas: cerca, modos: todo },
    { texto: 'RA', p: d.electrodos.RA.piel, dx: -24, dy: 24, vistas: lejos, modos: todo },
    { texto: 'LA', p: d.electrodos.LA.piel, dx: 24, dy: 24, vistas: lejos, modos: todo },
    { texto: 'LL', p: d.electrodos.LL.piel, dx: 36, dy: 0, vistas: lejos, modos: todo },
  ];
  return L.filter((x): x is Rotulo => !!x);
}

/**
 * Rótulos cortos de las partes (apagados por defecto). Sólo los de lo que se ve en
 * esa vista y ese modo: con el corazón entero no se rotula lo que queda dentro.
 */
function Rotulos({ datos, vista, corte }: { datos: DatosCorazon; vista: Vista; corte: boolean }) {
  const modo: Modo = corte ? 'corte' : 'entero';
  const lista = useMemo(() => {
    const sel = listaRotulos(datos).filter((r) => r.vistas.includes(vista) && r.modos.includes(modo));
    if (!sel.some((r) => r.superficie) || modo === 'corte') return sel;
    // anclas en la superficie visible: un rayo (una sola vez) desde fuera hacia el punto
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(datos.visual.pos, 3));
    g.setIndex(new THREE.BufferAttribute(datos.visual.idx, 1));
    const malla = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ side: THREE.FrontSide }));
    const ray = new THREE.Raycaster();
    const dir = new THREE.Vector3(...ENCUADRES[vista].dir).normalize();
    const out = sel.map((r) => {
      if (!r.superficie) return r;
      ray.set(new THREE.Vector3(...r.p).addScaledVector(dir, 3), dir.clone().negate());
      const hit = ray.intersectObject(malla, false)[0];
      return hit ? { ...r, p: [hit.point.x, hit.point.y, hit.point.z] as V3 } : r;
    });
    g.dispose(); (malla.material as THREE.Material).dispose();
    return out;
  }, [datos, vista, modo]);
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

function DiagnosticoDev({ listo, irA, reloj }: { listo: boolean; irA: (ms: number) => void; reloj: RelojCardiaco }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const medida = useRef({ llamadas: 0, triangulos: 0, lineas: 0, fps: 0, n: 0, t0: 0 });
  useEffect(() => {
    if (!DEV) return;
    const antes = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = antes; };
  }, [gl]);
  useFrame(() => {
    if (!DEV) return;
    const r = gl.info.render, m = medida.current;
    m.llamadas = r.calls; m.triangulos = r.triangles; m.lineas = r.lines;
    gl.info.reset();
    const ahora = performance.now();
    m.n++; if (!m.t0) m.t0 = ahora;
    if (ahora - m.t0 >= 1000) { m.fps = (m.n * 1000) / (ahora - m.t0); m.n = 0; m.t0 = ahora; }
  }, -10);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __bio08?: unknown };
    w.__bio08 = {
      listo,
      irA,
      /** lleva el reloj a una fase con nombre (sólo para las capturas de desarrollo) */
      irFase(f: 'P' | 'QRS' | 'ST' | 'T' | 'D') {
        const m = reloj.mapeo; if (!m) return;
        const c = m.ciclo;
        irA(f === 'D' ? m.rr - 60 : f === 'P' ? 0.5 * m.aDep[1] : f === 'QRS' ? m.vDep[0] + 0.45 * m.vDep[1] : f === 'ST' ? (c.qrsFin + c.tIni) / 2 : m.vRep[0] + 0.5 * m.vRep[1]);
      },
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
        return { llamadas: m.llamadas, triangulos: m.triangulos, lineas: m.lineas, mallas, normalesCero, conCero, fps: Math.round(m.fps * 10) / 10 };
      },
    };
    return () => { delete w.__bio08; };
  }, [gl, scene, listo, irA, reloj]);
  return null;
}

// ───────────────────────────── escena ─────────────────────────────

interface Capas { corte: boolean; rotulos: boolean; vista: Vista }

function Escena({ datos, reloj, u, derivacion, capas, alta }: {
  datos: DatosCorazon; reloj: RelojCardiaco; u: UniformesTiempo; derivacion: Derivacion; capas: Capas; alta: boolean;
}) {
  const valv = useRef({ av: 1, sigmoidea: 0, cV: 0 });
  return (
    <>
      <Motor reloj={reloj} u={u} datos={datos} valv={valv} />
      <Corazon datos={datos} u={u} corte={capas.corte} alta={alta} />
      <Conduccion datos={datos} u={u} reloj={reloj} alta={alta} />
      {capas.corte && <Valvulas datos={datos} estado={valv} />}
      <Torso datos={datos} />
      <Electrodos datos={datos} />
      <Einthoven datos={datos} derivacion={derivacion} reloj={reloj} />
      <Dipolo datos={datos} reloj={reloj} />
      {capas.rotulos && <Rotulos datos={datos} vista={capas.vista} corte={capas.corte} />}
    </>
  );
}

// ───────────────────────────── visor ─────────────────────────────

const etiquetaVelocidad = (v: number) => (v === 1 ? '×1' : `×1/${Math.round(1 / v)}`);

function Boton({ activo, onClick, children, titulo, ancho }: { activo?: boolean; onClick: () => void; children: React.ReactNode; titulo: string; ancho?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={titulo} aria-label={titulo} aria-pressed={activo}
      className={`flex h-7 items-center justify-center gap-1 rounded-md border text-[11px] font-semibold transition-colors ${ancho ? 'px-2' : 'w-7'} ${activo ? 'border-sky-300/60 bg-sky-400/20 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

export interface VisorECGProps {
  ritmoBPM: number;
  derivacion: Derivacion;
  onDerivacion: (d: Derivacion) => void;
}

export default function VisorECG({ ritmoBPM, derivacion, onDerivacion }: VisorECGProps) {
  const [calidad] = useState<CalidadCorazon>(() => calidadPorDefecto());
  const alta = calidad === 'alta';
  const reducido = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const reloj = useMemo(() => new RelojCardiaco(Math.max(20, ritmoBPM)), []); // eslint-disable-line react-hooks/exhaustive-deps
  const u = useMemo(() => nuevosUniformes(), []);
  const [datos, setDatos] = useState<DatosCorazon | null>(null);
  const [error, setError] = useState(false);
  const [vista, setVista] = useState<Vista>('torax');
  const [corte, setCorte] = useState(true);
  const [iso, setIso] = useState(false);
  const [rotulos, setRotulos] = useState(false);
  const [velocidad, setVelocidad] = useState<number>(1 / 3);
  const [pausa, setPausa] = useState<boolean>(!!reducido);

  useEffect(() => { reloj.fijarFC(ritmoBPM); }, [reloj, ritmoBPM]);
  useEffect(() => { reloj.velocidad = velocidad; }, [reloj, velocidad]);
  useEffect(() => { reloj.pausa = pausa; }, [reloj, pausa]);
  useEffect(() => { u.uIso.value = iso ? 1 : 0; }, [u, iso]);

  /** Lleva el reloj a `ms` del ciclo siguiente (en pausa): para el estado inicial sin movimiento y para las capturas. */
  const irA = useCallback((ms: number) => {
    if (!reloj.mapeo) return;
    reloj.paso(reloj.rr - reloj.tCiclo + Math.max(0, Math.min(reloj.rr - 4, ms)));
  }, [reloj]);

  useEffect(() => {
    let vivo = true;
    cargarCorazon(calidad).then((d) => {
      if (!vivo) return;
      if (!reloj.modelo) {
        reloj.fijarModelo({ fuente: d.fuente, K: d.K, act: d.act, tauMedioV: d.tauMedioV, rhoMedioV: d.rhoMedioV });
        // historia para que la tira salga llena y arranque con la onda a la vista
        reloj.paso(12000);
        const m = reloj.mapeo!;
        irA(reducido ? m.vDep[0] + 0.5 * m.vDep[1] : m.vDep[0] - 30);
      }
      setDatos(d);
    }).catch(() => { if (vivo) setError(true); });
    return () => { vivo = false; };
  }, [calidad, reloj, irA, reducido]);

  const listo = !!datos;
  const capas = useMemo<Capas>(() => ({ corte, rotulos, vista }), [corte, rotulos, vista]);

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#060b13]" data-visor="ecg">
      <div className="relative min-h-0 flex-1">
        <Canvas
          dpr={alta ? [1, 1.75] : [1, 1.25]}
          gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
          camera={{ position: [0.3, 0.4, 9], fov: 32, near: 0.05, far: 100 }}
          style={{ width: '100%', height: '100%' }}
        >
          <AjustesRender />
          <FondoEstudio />
          <Luces alta={alta} />
          <OrbitControls makeDefault enableDamping dampingFactor={0.09} enablePan={false} minDistance={2.2} maxDistance={16} />
          <CamaraECG vista={vista} />
          {datos && <Escena datos={datos} reloj={reloj} u={u} derivacion={derivacion} capas={capas} alta={alta} />}
          <DiagnosticoDev listo={listo} irA={irA} reloj={reloj} />
          {alta && <Posproceso />}
        </Canvas>

        {!listo && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-white/10 bg-[#0b1422]/80 px-3 py-1.5 text-[11px] font-semibold text-rose-200">
              {error ? 'No se pudo construir el corazón' : 'Construyendo el corazón…'}
            </span>
          </div>
        )}

        {/* vista y capas; debajo, el tiempo */}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          <div className="flex gap-1" role="toolbar" aria-label="Vista">
            <Boton activo={vista === 'torax'} onClick={() => setVista('torax')} titulo="Vista del tórax: corazón, electrodos y triángulo de Einthoven"><User size={14} /></Boton>
            <Boton activo={vista === 'corazon'} onClick={() => setVista('corazon')} titulo="Vista del corazón de cerca"><Heart size={14} /></Boton>
            <span className="mx-0.5 w-px self-stretch bg-white/10" />
            <Boton activo={corte} onClick={() => setCorte((c) => !c)} titulo="Corte de cuatro cámaras"><Layers size={14} /></Boton>
            <Boton activo={iso} onClick={() => setIso((c) => !c)} titulo="Mapa de isócronas de activación (líneas cada 10 ms)"><Spline size={14} /></Boton>
            <Boton activo={rotulos} onClick={() => setRotulos((c) => !c)} titulo="Rótulos de las partes"><Tag size={14} /></Boton>
          </div>
          <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Tiempo">
            <Boton activo={pausa} onClick={() => setPausa((p) => !p)} titulo={pausa ? 'Reanudar' : 'Pausa'}>{pausa ? <Play size={14} /> : <Pause size={14} />}</Boton>
            <Boton onClick={() => { setPausa(true); reloj.paso(10); }} titulo="Avanzar 10 ms"><StepForward size={14} /></Boton>
            <span className="mx-0.5 w-px self-stretch bg-white/10" />
            {VELOCIDADES.map((v) => (
              <Boton key={v} ancho activo={velocidad === v} onClick={() => setVelocidad(v)} titulo={v === 1 ? 'Tiempo real' : `Cámara lenta ${etiquetaVelocidad(v)}`}>{etiquetaVelocidad(v)}</Boton>
            ))}
          </div>
          <span className="rounded bg-[#0b1422]/70 px-1.5 py-0.5 text-[10.5px] font-medium text-amber-200/90">
            {velocidad === 1 ? 'tiempo real' : `${etiquetaVelocidad(velocidad)} — cámara lenta`}
          </span>
        </div>
        {iso && (
          <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md border border-white/10 bg-[#0b1422]/80 px-2 py-1 text-[10px] text-slate-300">
            <span>se activa antes</span>
            <span className="h-2 w-16 rounded-sm" style={{ background: 'linear-gradient(90deg,#fff3b3,#fab238,#db4d29,#801f61,#29146b)' }} />
            <span>después</span>
          </div>
        )}

      </div>
      <DockECG reloj={reloj} derivacion={derivacion} onDerivacion={onDerivacion} listo={listo} />
    </div>
  );
}
