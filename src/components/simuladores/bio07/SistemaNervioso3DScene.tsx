'use client';
/**
 * bio07/SistemaNervioso3DScene.tsx — el visor del lab: escena 3D (dos modos) y, debajo,
 * el dock DOM con las trazas.
 *
 *  · NEURONA (estado inicial): motoneurona α en el banco; un potencial de acción la recorre
 *    cada pocos segundos (cable de Hodgkin–Huxley a 18,5 °C, conducción saltatoria en la
 *    fibra mielínica), con los iones Na⁺/K⁺ de cada nodo y la placa motora.
 *  · ARCO REFLEJO: el diorama del reflejo rotuliano; cada golpe del martillo lo dispara el
 *    Piloto (store) y lo anima `RelojArco` con la latencia del dominio.
 *
 * UN SOLO RELOJ POR MODO, avanzado una vez por cuadro (prioridad −2) antes que las piezas
 * (−1) y el dock (suscrito al reloj). Ningún useFrame con prioridad > 0.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Pause, Play, Tag } from 'lucide-react';
import { RelojBanco, LENTOS_BANCO, LENTOS_ARCO, rotuloFactor, type RelojArco } from './reloj';
import { umbralBanco, LARGO_BANCO, type ConfigBanco } from './banco';
import { nodoEn } from './neuro';
import { BancoNeurona3D, ENCUADRE_BANCO, encuadreNodo, type AlPasar } from './banco3d';
import { ArcoReflejo3D, ENCUADRE_ARCO, ENCUADRE_MEDULA } from './piezas';
import { DockBanco, DockArco } from './Dock';
import type { V3 } from './geometria';

export type ModoVisor = 'neurona' | 'arco';
type Vista = 'todo' | 'detalle';
type Calidad = 'alta' | 'media';
const DEV = process.env.NODE_ENV !== 'production';

/** Calidad media SÓLO en móvil, ventana < 820 px o ≤ 2 núcleos (o ?calidad=media). */
function calidadInicial(): Calidad {
  if (typeof window === 'undefined') return 'alta';
  try {
    const q = new URLSearchParams(window.location.search).get('calidad');
    if (q === 'media' || q === 'alta') return q;
  } catch { /* nada */ }
  const movil = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const nucleos = navigator.hardwareConcurrency ?? 8;
  return movil || window.innerWidth < 820 || nucleos <= 2 ? 'media' : 'alta';
}

// ───────────────────────────── estudio ─────────────────────────────

function FondoEstudio() {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d'); if (!g) return;
    const grad = g.createRadialGradient(256, 220, 20, 256, 256, 420);
    grad.addColorStop(0, '#1d2f45'); grad.addColorStop(0.5, '#111f31'); grad.addColorStop(1, '#060b13');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
    const img = g.getImageData(0, 0, 512, 512);
    let s = 11;
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

function Luces({ alta }: { alta: boolean }) {
  return (
    <>
      <hemisphereLight args={['#dfe8f2', '#1b1512', 0.25]} />
      <directionalLight position={[-4, 6, 7]} intensity={2.4} color="#fff3e6" />
      <directionalLight position={[6, -1, 5]} intensity={0.6} color="#cfe0ff" />
      <directionalLight position={[3, 4, -6]} intensity={1.8} color="#bcd6ff" />
      <directionalLight position={[-5, 0, -5]} intensity={0.9} color="#ffd9cf" />
      <Environment resolution={alta ? 256 : 128} frames={1} environmentIntensity={0.8}>
        <color attach="background" args={['#0b121c']} />
        <Lightformer form="rect" intensity={1.2} color="#f4f7fb" position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={2.4} position={[-5, 1.5, 3]} rotation-y={Math.PI / 2} scale={[1.4, 6, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#d8e6ff" position={[5, 1, 1]} rotation-y={-Math.PI / 2} scale={[1.2, 6, 1]} />
        <Lightformer form="rect" intensity={0.8} color="#ffe7d6" position={[0, 1, 7]} rotation-y={Math.PI} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#c9dcff" position={[0, 2, -6]} scale={[10, 4, 1]} />
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

const TONO_NEUTRO = 8; // ToneMappingMode.NEUTRAL de postprocessing
/** Bloom moderado sólo en emisores (umbral alto) y sólo en calidad alta. Props constantes. */
function Posproceso() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.62} luminanceThreshold={0.92} luminanceSmoothing={0.2} radius={0.6} />
      <ToneMapping mode={TONO_NEUTRO} />
    </EffectComposer>
  );
}

// ───────────────────────────── cámara ─────────────────────────────

interface Encuadre { centro: V3; semiAlto: number; semiAncho: number; dir: V3 }

function Camara({ encuadre }: { encuadre: Encuadre }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const meta = useRef<{ pos: THREE.Vector3; obj: THREE.Vector3; activa: boolean }>({ pos: new THREE.Vector3(), obj: new THREE.Vector3(), activa: false });
  const primera = useRef(true);
  const clave = JSON.stringify(encuadre);
  const calcular = useCallback(() => {
    const e = JSON.parse(clave) as Encuadre;
    const aspect = size.width / Math.max(1, size.height);
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const dist = Math.max(e.semiAlto / t, e.semiAncho / (t * aspect));
    const dir = new THREE.Vector3(...e.dir).normalize();
    const obj = new THREE.Vector3(...e.centro);
    return { pos: obj.clone().addScaledVector(dir, dist), obj, dist };
  }, [clave, size.width, size.height, camera]);
  useLayoutEffect(() => {
    const { pos, obj, dist } = calcular();
    if (controls) { controls.minDistance = dist * 0.35; controls.maxDistance = dist * 1.6; }
    if (primera.current || !controls) {
      camera.position.copy(pos); camera.lookAt(obj);
      if (controls) { controls.target.copy(obj); controls.update(); primera.current = false; }
      camera.near = 0.05; camera.far = 200; camera.updateProjectionMatrix();
      meta.current.activa = false;
      return;
    }
    meta.current = { pos, obj, activa: true };
  }, [calcular, camera, controls]);
  useFrame((_, dt) => {
    const m = meta.current; if (!m.activa || !controls) return;
    const k = 1 - Math.exp(-dt * 4.5);
    camera.position.lerp(m.pos, k); controls.target.lerp(m.obj, k); controls.update();
    if (camera.position.distanceTo(m.pos) < 0.004 && controls.target.distanceTo(m.obj) < 0.004) m.activa = false;
  }, -3);
  return null;
}

// ───────────────────────────── tiempo ─────────────────────────────

function Motor({ modo, banco, arco }: { modo: ModoVisor; banco: RelojBanco; arco: RelojArco }) {
  useFrame((_, dt) => { if (modo === 'neurona') banco.avanzar(dt); else arco.avanzar(dt); }, -2);
  return null;
}

// ───────────────────────────── diagnóstico (sólo desarrollo) ─────────────────────────────

function DiagnosticoDev({ ops }: { ops: Record<string, unknown> }) {
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
  }, -10);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __bio07?: unknown };
    w.__bio07 = {
      ...ops,
      escena: scene,
      camara: () => ({ pos: camera.position.toArray().map((x) => +x.toFixed(3)) }),
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
        return { llamadas: m.llamadas, triangulos: m.triangulos, mallas, normalesCero, conCero, fps: Math.round(m.fps * 10) / 10, pixeles: gl.getPixelRatio() };
      },
    };
    return () => { delete w.__bio07; };
  }, [gl, scene, camera, ops]);
  return null;
}

// ───────────────────────────── visor ─────────────────────────────

function Boton({ activo, onClick, children, titulo, ancho, deshabilitado }: { activo?: boolean; onClick: () => void; children: React.ReactNode; titulo: string; ancho?: boolean; deshabilitado?: boolean }) {
  return (
    <button type="button" onClick={onClick} title={titulo} aria-label={titulo} aria-pressed={activo} disabled={deshabilitado}
      className={`flex h-7 items-center justify-center gap-1 rounded-md border text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${ancho ? 'px-2' : 'w-7'} ${activo ? 'border-sky-300/60 bg-sky-400/20 text-white' : 'border-white/10 bg-[#0b1422]/75 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

const redondear = (x: number, p: number) => Math.round(x / p) * p;
/** «×1/5 000» con 2 cifras significativas (el factor del momento, también en las transiciones). */
function factorLegible(f: number) {
  const n = 1 / f;
  const e = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1));
  return rotuloFactor(1 / (Math.round(n / e) * e));
}

export interface VisorProps {
  modo: ModoVisor;
  onModo: (m: ModoVisor) => void;
  relojArco: RelojArco;
  /** fuerza del martillo elegida (para la altura del martillo en reposo) */
  fuerza: number;
  distancia: number;
  /** ¿validado? (revela la conducción de cada tramo y v) */
  validado: boolean;
  ocupado: boolean;
}

export default function VisorSistemaNervioso({ modo, onModo, relojArco, fuerza, distancia, validado, ocupado }: VisorProps) {
  const [calidad, setCalidad] = useState<Calidad>(calidadInicial);
  const alta = calidad === 'alta';
  const reducido = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const banco = useMemo(() => {
    const u = umbralBanco('mielinica', 12);
    return new RelojBanco({ tipo: 'mielinica', D: 12, estimulo: redondear(u * 1.6, 0.05), doble: 0 });
  }, []);
  const [cfg, setCfg] = useState<ConfigBanco>(() => ({ ...banco.banco.cfg }));
  const [lentoB, setLentoB] = useState<number>(LENTOS_BANCO[1]);
  const [lentoA, setLentoA] = useState<number>(LENTOS_ARCO[1]);
  const [pausa, setPausa] = useState(false);
  const [rotulos, setRotulos] = useState(false);
  const [vista, setVista] = useState<Vista>('todo');
  const [puntaB, setPuntaB] = useState<THREE.Vector3 | null>(null);
  const [aviso, setAviso] = useState<0 | 1 | 2>(0);

  useEffect(() => { banco.lento = lentoB; }, [banco, lentoB]);
  useEffect(() => { relojArco.lento = lentoA; }, [relojArco, lentoA]);
  useEffect(() => { banco.pausa = pausa; relojArco.pausa = pausa; }, [banco, relojArco, pausa]);
  useEffect(() => { setVista('todo'); }, [modo]);

  // movimiento reducido: un fotograma quieto con el PA a medio axón
  useEffect(() => {
    if (!reducido) return;
    irAFrente(banco, 0.5);
    setPausa(true);
  }, [reducido, banco]);

  // aviso de uso: una sola vez, se desvanece
  useEffect(() => {
    let visto = false;
    try { visto = window.localStorage.getItem('bio07:aviso') === '1'; } catch { /* sin almacenamiento */ }
    if (visto) return;
    setAviso(1);
    const t1 = window.setTimeout(() => setAviso(2), 4200);
    const t2 = window.setTimeout(() => setAviso(0), 5200);
    try { window.localStorage.setItem('bio07:aviso', '1'); } catch { /* nada */ }
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []);

  const onCfg = useCallback((c: Partial<ConfigBanco>) => {
    const antes = banco.banco.cfg;
    const nueva = { ...antes, ...c };
    if (c.tipo !== undefined || c.D !== undefined) {
      // el estímulo conserva su proporción respecto al umbral de la fibra nueva
      const r = antes.estimulo / Math.max(1e-6, banco.banco.umbral);
      nueva.estimulo = redondear(r * umbralBanco(nueva.tipo, nueva.D), 0.05);
      if (c.tipo !== undefined && c.tipo !== antes.tipo) setLentoB(c.tipo === 'amielinica' ? LENTOS_BANCO[0] : LENTOS_BANCO[1]);
    }
    banco.configurar(nueva);
    setCfg({ ...banco.banco.cfg });
  }, [banco]);
  const estimular = useCallback(() => { setPausa(false); banco.estimular(); }, [banco]);

  // rótulo de la pieza bajo el puntero (DOM directo, sin re-render)
  const tip = useRef<HTMLDivElement>(null);
  const alPasar = useCallback<AlPasar>((nombre, e) => {
    const el = tip.current; if (!el) return;
    if (!nombre || !e) { el.style.opacity = '0'; return; }
    el.textContent = nombre;
    el.style.opacity = '1';
    el.style.transform = `translate(${e.nativeEvent.offsetX + 14}px, ${e.nativeEvent.offsetY + 12}px)`;
  }, []);

  // factor de cámara lenta del momento (DOM directo, cada cuadro)
  const etiqueta = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const f = () => {
      const el = etiqueta.current; if (!el) return;
      if (modo === 'neurona') el.textContent = `${factorLegible(banco.factor)} · ${banco.factor < 1 / 400 ? 'cámara lenta' : 'avance rápido'}`;
      else {
        const fase = relojArco.fase;
        el.textContent = fase === 'reposo' ? `${rotuloFactor(lentoA)} · cámara lenta`
          : `${factorLegible(relojArco.factor)} · ${fase === 'martillo' ? 'martillo' : fase === 'impulso' ? 'impulso nervioso' : 'contracción'}`;
      }
    };
    f();
    const a = banco.suscribir(f), b = relojArco.suscribir(f);
    return () => { a(); b(); };
  }, [modo, banco, relojArco, lentoA]);

  const ops = useMemo(() => ({
    listo: true,
    modo: (m: ModoVisor) => onModo(m),
    pausa: (p: boolean) => setPausa(p),
    bancoFrente: (f: number) => { irAFrente(banco, f); setPausa(true); },
    arcoIrA: (t: number) => { relojArco.irA(t); },
    banco: () => ({ t: banco.banco.cable.t, factor: banco.factor, v: banco.banco.vMedida, umbral: banco.banco.umbral, cfg: banco.banco.cfg }),
    arco: () => ({ t: relojArco.t, fase: relojArco.fase, activo: relojArco.activo, ensayo: relojArco.ensayo ? { L: relojArco.ensayo.L, supra: relojArco.ensayo.supra } : null }),
  }), [banco, relojArco, onModo]);

  const encuadre: Encuadre = modo === 'neurona'
    ? (vista === 'detalle' && puntaB ? encuadreNodo({ puntaB }) : ENCUADRE_BANCO)
    : (vista === 'detalle' ? ENCUADRE_MEDULA : ENCUADRE_ARCO);
  const lentos = modo === 'neurona' ? LENTOS_BANCO : LENTOS_ARCO;
  const lento = modo === 'neurona' ? lentoB : lentoA;

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#060b13]" data-visor="nervioso">
      <div className="relative min-h-0 flex-1">
        <Canvas
          dpr={alta ? [1, 2] : [Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1), Math.min(1.5, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)]}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
          camera={{ position: [0, 0, 14], fov: 30, near: 0.05, far: 200 }}
          style={{ width: '100%', height: '100%' }}
          onPointerMissed={() => alPasar(null)}
        >
          <AjustesRender />
          <FondoEstudio />
          <Luces alta={alta} />
          <OrbitControls makeDefault enableDamping dampingFactor={0.09} enablePan={false}
            minPolarAngle={Math.PI / 2 - 0.65} maxPolarAngle={Math.PI / 2 + 0.55} minAzimuthAngle={-0.85} maxAzimuthAngle={0.85} />
          <Camara encuadre={encuadre} />
          <Motor modo={modo} banco={banco} arco={relojArco} />
          {modo === 'neurona'
            ? <BancoNeurona3D reloj={banco} alPasar={alPasar} rotulos={rotulos} onPuntaB={setPuntaB} />
            : <ArcoReflejo3D reloj={relojArco} fuerza={fuerza} alPasar={alPasar} rotulos={rotulos} />}
          <DiagnosticoDev ops={ops} />
          {alta && <Posproceso />}
        </Canvas>

        <div ref={tip} className="pointer-events-none absolute left-0 top-0 z-20 whitespace-nowrap rounded border border-white/15 bg-[#0b1422]/90 px-1.5 py-0.5 text-[11px] font-medium text-slate-100 opacity-0 transition-opacity" />

        {/* modo */}
        <div className="absolute left-2 top-2 flex rounded-lg border border-white/10 bg-[#0b1422]/75 p-0.5" role="group" aria-label="Escena">
          {(['neurona', 'arco'] as const).map((m) => (
            <button key={m} type="button" onClick={() => onModo(m)} aria-pressed={modo === m} disabled={ocupado && m !== modo}
              className={`h-7 rounded-md px-2.5 text-[11px] font-semibold transition-colors disabled:opacity-40 ${modo === m ? 'bg-sky-500/80 text-white' : 'text-slate-300 hover:text-white'}`}>
              {m === 'neurona' ? 'Neurona' : 'Arco reflejo'}
            </button>
          ))}
        </div>

        {/* tiempo: pausa, cámara lenta y su factor real */}
        <div className="absolute bottom-2 left-2 flex flex-col items-start gap-1">
          <span ref={etiqueta} className="rounded bg-[#0b1422]/75 px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-amber-200/90" />
          <div className="flex items-center gap-1" role="toolbar" aria-label="Tiempo">
            <Boton activo={pausa} onClick={() => setPausa((p) => !p)} titulo={pausa ? 'Reanudar' : 'Pausa'}>{pausa ? <Play size={14} /> : <Pause size={14} />}</Boton>
            {lentos.map((v) => (
              <Boton key={v} ancho activo={lento === v} onClick={() => (modo === 'neurona' ? setLentoB(v) : setLentoA(v))} titulo={`Cámara lenta ${rotuloFactor(v)}`}>{rotuloFactor(v)}</Boton>
            ))}
          </div>
        </div>

        {/* vista, rótulos y calidad */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <Boton ancho activo={vista === 'todo'} onClick={() => setVista('todo')} titulo="Vista completa">Todo</Boton>
          <Boton ancho activo={vista === 'detalle'} onClick={() => setVista('detalle')} titulo={modo === 'neurona' ? 'De cerca: el nodo de la pipeta B y sus iones' : 'De cerca: la médula'}>{modo === 'neurona' ? 'Nodo' : 'Médula'}</Boton>
          <span className="mx-0.5 h-5 w-px bg-white/10" />
          <Boton ancho activo={rotulos} onClick={() => setRotulos((r) => !r)} titulo="Rótulos de las partes"><Tag size={13} /> Rótulos</Boton>
          <Boton ancho onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} titulo="Cambiar la calidad de imagen">Calidad: {calidad}</Boton>
        </div>

        {aviso > 0 && (
          <div className={`pointer-events-none absolute left-1/2 top-12 -translate-x-1/2 rounded-full border border-white/10 bg-[#0b1422]/85 px-3 py-1 text-[11px] text-slate-200 transition-opacity duration-1000 ${aviso === 2 ? 'opacity-0' : 'opacity-100'}`}>
            Arrastra para girar · pasa el ratón por una pieza
          </div>
        )}
      </div>
      {modo === 'neurona'
        ? <DockBanco reloj={banco} cfg={cfg} onCfg={onCfg} onEstimular={estimular} umbral={banco.banco.umbral} />
        : <DockArco reloj={relojArco} revelar={validado} distancia={distancia} />}
    </div>
  );
}

/** Estimula y avanza el modelo hasta que el PA llega a la fracción `f` del axón (y lo deja ahí). */
function irAFrente(r: RelojBanco, f: number) {
  const b = r.banco, c = b.cable;
  b.estimular();
  const i = nodoEn(c, LARGO_BANCO * Math.min(0.98, Math.max(0.02, f)));
  let n = 0;
  while (c.tCruce[i] < 0 && n++ < 40000) { r.Vprev.set(c.V); b.avanzar(0.004, 0.002); }
  r.dtCuadro = 0.004;
  r.factor = r.lento;
}
