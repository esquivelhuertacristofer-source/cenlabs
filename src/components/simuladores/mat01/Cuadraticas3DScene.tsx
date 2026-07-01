"use client";

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Line, Html, Sparkles, Stars, Float } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────────────────
   Cuadraticas3DScene — Laboratorio geométrico de la parábola (nivel máximo).

   Además de graficar f(x)=ax²+bx+c y la trayectoria objetivo, revela lo que hace
   ÚNICA a una parábola: su FOCO y su DIRECTRIZ (p = 1/4a) y la PROPIEDAD
   REFLECTANTE (todo rayo paralelo al eje de simetría se refleja hacia el foco —
   el principio de las antenas parabólicas). Suma eje de simetría, intercepto-Y,
   partícula viajera con estela, área bajo la curva (integral entre raíces),
   raíces reales/complejas en el plano de Argand 3D y postprocesado cinematográfico.

   Props (interfaz estable con el Piloto): { a, b, c, target, currentRes, escenario? }.
──────────────────────────────────────────────────────────────────────────── */

interface ComplexRoot { real: number; imaginary: number; }
interface Vertex { h: number; k: number; }
interface CurrentRes { delta: number; vertex: Vertex; roots: ComplexRoot[]; nature: string; }
type Escenario = 'parabola_basica' | 'lanzamiento_proyectil' | 'arquitectura_arco' | 'focalizacion_antena';

interface Cuadraticas3DSceneProps {
  a: number;
  b: number;
  c: number;
  target: { a: number; b: number; c: number };
  currentRes: CurrentRes;
  escenario?: Escenario;
}

const YMAX = 16;          // banda vertical visible
const SPAN_CAP = 14;      // ancho máx. de muestreo desde el vértice

interface Theme { accent: string; accent2: string; bg: string; fog: string; dust: string; caption: string; }
const THEMES: Record<Escenario, Theme> = {
  parabola_basica: { accent: '#ec4899', accent2: '#22d3ee', bg: '#050213', fog: '#050213', dust: '#f9a8d4', caption: 'Plano cartesiano · f(x) = ax² + bx + c' },
  lanzamiento_proyectil: { accent: '#fb923c', accent2: '#38bdf8', bg: '#0b0402', fog: '#0b0402', dust: '#fdba74', caption: 'Trayectoria balística · la parábola del tiro' },
  arquitectura_arco: { accent: '#f59e0b', accent2: '#a3e635', bg: '#0a0602', fog: '#0a0602', dust: '#fde68a', caption: 'Arco estructural · la parábola en la arquitectura' },
  focalizacion_antena: { accent: '#22d3ee', accent2: '#c084fc', bg: '#01040a', fog: '#01040a', dust: '#a5f3fc', caption: 'Antena parabólica · foco y propiedad reflectante' },
};

// evalúa la parábola
const fEval = (a: number, b: number, c: number, x: number) => a * x * x + b * x + c;

// ── muestreo adaptativo: mantiene la parábola bien encuadrada ────────────────
function sampleParabola(a: number, b: number, c: number, h: number): THREE.Vector3[] {
  const A = Math.abs(a) < 1e-6 ? 1e-6 : a;
  const span = THREE.MathUtils.clamp(Math.sqrt(28 / Math.abs(A)), 3, SPAN_CAP);
  const pts: THREE.Vector3[] = [];
  const N = 140;
  for (let i = 0; i <= N; i++) {
    const x = h - span + (2 * span * i) / N;
    const y = THREE.MathUtils.clamp(fEval(a, b, c, x), -60, 60);
    pts.push(new THREE.Vector3(x, y, 0));
  }
  return pts;
}

/* ── Plano cartesiano holográfico: rejilla + ejes + ticks + etiquetas ────────── */
function CartesianPlane({ accent, showImag }: { accent: string; showImag: boolean }) {
  const grid = useMemo(() => {
    const seg: [number, number, number][][] = [];
    const R = 20, H = YMAX + 4;
    for (let x = -R; x <= R; x += 1) seg.push([[x, -H, 0], [x, H, 0]]);
    for (let y = -H; y <= H; y += 1) seg.push([[-R, y, 0], [R, y, 0]]);
    return seg;
  }, []);
  const ticks = useMemo(() => {
    const t: number[] = [];
    for (let i = -18; i <= 18; i += 2) if (i !== 0) t.push(i);
    return t;
  }, []);
  return (
    <group>
      {/* rejilla tenue */}
      {grid.map((pts, i) => (
        <Line key={`g${i}`} points={pts} color={accent} lineWidth={0.4} transparent opacity={0.08} toneMapped={false} />
      ))}
      {/* ejes */}
      <Line points={[[-20, 0, 0], [20, 0, 0]]} color="#e2e8f0" lineWidth={2} transparent opacity={0.55} toneMapped={false} />
      <Line points={[[0, -20, 0], [0, 20, 0]]} color="#e2e8f0" lineWidth={2} transparent opacity={0.55} toneMapped={false} />
      {showImag && (
        <Line points={[[0, 0, -18], [0, 0, 18]]} color="#c084fc" lineWidth={2} transparent opacity={0.5} toneMapped={false} />
      )}
      {/* etiquetas de eje X e Y */}
      {ticks.map((n) => (
        <React.Fragment key={`tk${n}`}>
          <Html position={[n, -0.7, 0]} center distanceFactor={26}>
            <div className="text-[8px] font-bold text-white/35 tabular-nums select-none pointer-events-none">{n}</div>
          </Html>
          <Html position={[-0.7, n, 0]} center distanceFactor={26}>
            <div className="text-[8px] font-bold text-white/35 tabular-nums select-none pointer-events-none">{n}</div>
          </Html>
        </React.Fragment>
      ))}
      <Html position={[19.4, 0.9, 0]} center distanceFactor={26}>
        <div className="text-[10px] font-black text-white/60 italic select-none pointer-events-none">x</div>
      </Html>
      <Html position={[1.1, 19.2, 0]} center distanceFactor={26}>
        <div className="text-[10px] font-black text-white/60 italic select-none pointer-events-none">y</div>
      </Html>
      {showImag && (
        <Html position={[0, 0.9, 17.3]} center distanceFactor={26}>
          <div className="text-[10px] font-black text-purple-300/80 italic select-none pointer-events-none">Im</div>
        </Html>
      )}
    </group>
  );
}

/* ── Parábola del alumno: tubo emisivo con degradado por altura ──────────────── */
function ParabolaTube({ points, accent, accent2 }: { points: THREE.Vector3[]; accent: string; accent2: string }) {
  const geometry = useMemo(() => {
    if (points.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, 200, 0.12, 12, false);
    const cold = new THREE.Color(accent2);
    const warm = new THREE.Color(accent);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const ring = 13; // radialSegments + 1
    const segs = Math.max(1, Math.floor(pos.count / ring));
    for (let i = 0; i < pos.count; i++) {
      const along = Math.floor(i / ring) / segs;
      // extremos fríos (cian) → centro cálido (acento): resalta la curvatura
      const t = 1 - Math.abs(along - 0.5) * 2;
      const c = cold.clone().lerp(warm, t);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }, [points, accent, accent2]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry}>
      {/* emissive tenue tintado por los propios vertexColors: conserva el degradado sin quemarse en el Bloom */}
      <meshStandardMaterial vertexColors emissive="#334155" emissiveIntensity={0.3} metalness={0.2} roughness={0.4} toneMapped={false} transparent opacity={0.98} />
    </mesh>
  );
}

/* ── Parábola objetivo: fantasma punteado ────────────────────────────────────── */
function GhostTarget({ points, color }: { points: THREE.Vector3[]; color: string }) {
  if (points.length < 2) return null;
  return (
    <Line points={points} color={color} lineWidth={2.2} dashed dashSize={0.5} gapSize={0.35} transparent opacity={0.5} toneMapped={false} />
  );
}

/* ── Área bajo la curva entre raíces reales (integral definida) ───────────────── */
function AreaUnderCurve({ a, b, c, r1, r2, accent }: { a: number; b: number; c: number; r1: number; r2: number; accent: string }) {
  const geometry = useMemo(() => {
    const lo = Math.min(r1, r2), hi = Math.max(r1, r2);
    if (hi - lo < 0.05) return null;
    const shape = new THREE.Shape();
    const N = 60;
    shape.moveTo(lo, 0);
    for (let i = 0; i <= N; i++) {
      const x = lo + ((hi - lo) * i) / N;
      shape.lineTo(x, fEval(a, b, c, x));
    }
    shape.lineTo(hi, 0);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  }, [a, b, c, r1, r2]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} position={[0, 0, -0.02]}>
      <meshBasicMaterial color={accent} transparent opacity={0.14} side={THREE.DoubleSide} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/* ── Eje de simetría ─────────────────────────────────────────────────────────── */
function AxisOfSymmetry({ h, k, up }: { h: number; k: number; up: boolean }) {
  const top = up ? YMAX + 3 : k;
  const bot = up ? k : -YMAX - 3;
  return (
    <group>
      <Line points={[[h, bot, 0], [h, top, 0]]} color="#fbbf24" lineWidth={1.2} dashed dashSize={0.3} gapSize={0.2} transparent opacity={0.45} toneMapped={false} />
      <Html position={[h + 0.4, up ? YMAX + 2 : -YMAX - 2, 0]} center distanceFactor={24}>
        <div className="text-[8px] font-black text-amber-400/80 uppercase tracking-widest select-none pointer-events-none whitespace-nowrap">x = {h.toFixed(1)}</div>
      </Html>
    </group>
  );
}

/* ── Foco + Directriz: la definición geométrica de la parábola ────────────────── */
function FocusDirectrix({ h, k, p, accent }: { h: number; k: number; p: number; accent: string }) {
  const focusY = k + p;
  const dirY = k - p;
  const pulse = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (pulse.current) {
      const s = 1 + (Math.sin(state.clock.getElapsedTime() * 2.5) * 0.5 + 0.5) * 0.8;
      pulse.current.scale.set(s, s, s);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - (s - 1) / 0.8);
    }
  });
  return (
    <group>
      {/* directriz */}
      <Line points={[[-18, dirY, 0], [18, dirY, 0]]} color="#f43f5e" lineWidth={1.4} dashed dashSize={0.4} gapSize={0.28} transparent opacity={0.5} toneMapped={false} />
      <Html position={[14.5, dirY - 0.6, 0]} center distanceFactor={24}>
        <div className="text-[7px] font-black text-rose-400/70 uppercase tracking-widest select-none pointer-events-none whitespace-nowrap">directriz</div>
      </Html>
      {/* foco */}
      <group position={[h, focusY, 0]}>
        <mesh>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial color="#fff7ed" emissive={accent} emissiveIntensity={2.4} toneMapped={false} />
        </mesh>
        <mesh ref={pulse} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.5, 40]} />
          <meshBasicMaterial color={accent} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <pointLight color={accent} intensity={2} distance={6} />
        <Html position={[0.65, 0.35, 0]} center distanceFactor={24}>
          <div className="text-[7px] font-black uppercase tracking-widest select-none pointer-events-none whitespace-nowrap" style={{ color: accent }}>Foco</div>
        </Html>
      </group>
    </group>
  );
}

/* ── Propiedad reflectante: rayos paralelos al eje que se enfocan ─────────────── */
function ReflectionRays({ a, b, c, h, k, p, accent }: { a: number; b: number; c: number; h: number; k: number; p: number; accent: string }) {
  const focusY = k + p;
  const rays = useMemo(() => {
    const A = Math.abs(a) < 1e-6 ? 1e-6 : a;
    const span = THREE.MathUtils.clamp(Math.sqrt(20 / Math.abs(A)), 2, SPAN_CAP - 1);
    const arr: { x: number; yPar: number; yTop: number }[] = [];
    const xs = [-0.7, 0.7];
    for (const f of xs) {
      const x = h + f * span;
      const yPar = fEval(a, b, c, x);
      const yTop = a > 0 ? YMAX + 2 : -YMAX - 2;
      arr.push({ x, yPar, yTop });
    }
    return arr;
  }, [a, b, c, h]);

  const photons = useRef<THREE.Group[]>([]);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    rays.forEach((r, i) => {
      const g = photons.current[i];
      if (!g) return;
      const ph = (t * 0.35 + i * 0.22) % 1;
      if (ph < 0.5) {
        const s = ph / 0.5; // baja paralelo al eje
        g.position.set(r.x, THREE.MathUtils.lerp(r.yTop, r.yPar, s), 0);
      } else {
        const s = (ph - 0.5) / 0.5; // se refleja hacia el foco
        g.position.set(THREE.MathUtils.lerp(r.x, h, s), THREE.MathUtils.lerp(r.yPar, focusY, s), 0);
      }
    });
  });

  return (
    <group>
      {rays.map((r, i) => (
        <group key={`ray${i}`}>
          {/* rayo entrante paralelo al eje */}
          <Line points={[[r.x, r.yTop, 0], [r.x, r.yPar, 0]]} color={accent} lineWidth={0.8} transparent opacity={0.16} toneMapped={false} />
          {/* rayo reflejado hacia el foco */}
          <Line points={[[r.x, r.yPar, 0], [h, focusY, 0]]} color={accent} lineWidth={0.8} transparent opacity={0.28} toneMapped={false} />
          {/* fotón viajero */}
          <group ref={(el) => { if (el) photons.current[i] = el; }}>
            <mesh>
              <sphereGeometry args={[0.1, 14, 14]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            <pointLight color={accent} intensity={1.2} distance={2.5} />
          </group>
        </group>
      ))}
    </group>
  );
}

/* ── Partícula viajera sobre la parábola con estela ──────────────────────────── */
function Traveler({ points, accent }: { points: THREE.Vector3[]; accent: string }) {
  const ref = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const TRAIL = 40;
  const trailLine = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    g.setDrawRange(0, 0);
    const m = new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.8, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false });
    return new THREE.Line(g, m);
  }, [accent]);
  const trail = useRef<THREE.Vector3[]>([]);

  useFrame((_, delta) => {
    if (!ref.current || points.length < 2) return;
    progress.current += delta * 22;
    const n = points.length;
    if (progress.current >= n - 1) { progress.current = 0; trail.current = []; }
    const i = Math.floor(progress.current);
    const frac = progress.current - i;
    const a = points[i];
    const bpt = points[Math.min(i + 1, n - 1)];
    ref.current.position.lerpVectors(a, bpt, frac);

    trail.current.push(ref.current.position.clone());
    if (trail.current.length > TRAIL) trail.current.shift();
    const arr = trailLine.geometry.attributes.position.array as Float32Array;
    for (let k = 0; k < trail.current.length; k++) {
      const p = trail.current[k];
      arr[k * 3] = p.x; arr[k * 3 + 1] = p.y; arr[k * 3 + 2] = p.z;
    }
    trailLine.geometry.setDrawRange(0, trail.current.length);
    trailLine.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <primitive object={trailLine} />
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[0.15, 20, 20]} />
          <meshStandardMaterial color="#ffffff" emissive={accent} emissiveIntensity={2.6} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.3, 20, 20]} />
          <meshBasicMaterial color={accent} transparent opacity={0.14} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <pointLight color={accent} intensity={3} distance={4.5} />
      </group>
    </>
  );
}

/* ── Vértice con anillos de enganche ─────────────────────────────────────────── */
function VertexMarker({ h, k, up, accent }: { h: number; k: number; up: boolean; accent: string }) {
  const ring = useRef<THREE.Group>(null);
  useFrame((state) => { if (ring.current) ring.current.rotation.z = state.clock.getElapsedTime() * 0.8; });
  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.25} floatingRange={[0, 0.12]}>
      <group position={[h, k, 0]}>
        <mesh>
          <sphereGeometry args={[0.24, 24, 24]} />
          <meshStandardMaterial color="#ffffff" emissive={accent} emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
        <group ref={ring} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh><ringGeometry args={[0.42, 0.5, 40]} /><meshBasicMaterial color={accent} transparent opacity={0.8} side={THREE.DoubleSide} toneMapped={false} /></mesh>
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((ang, i) => (
            <mesh key={i} position={[Math.cos(ang) * 0.62, Math.sin(ang) * 0.62, 0]} rotation={[0, 0, ang]}>
              <boxGeometry args={[0.16, 0.03, 0.001]} />
              <meshBasicMaterial color={accent} toneMapped={false} />
            </mesh>
          ))}
        </group>
        <Sparkles count={12} scale={1.4} size={2.4} speed={0.4} color={accent} />
        <Html position={[0.8, up ? -0.7 : 0.7, 0]} center distanceFactor={22}>
          <div className="text-[8px] font-black uppercase tracking-widest select-none pointer-events-none whitespace-nowrap" style={{ color: accent }}>
            Vértice · {up ? 'mín' : 'máx'}
          </div>
        </Html>
      </group>
    </Float>
  );
}

/* ── Intercepto con el eje Y ─────────────────────────────────────────────────── */
function YIntercept({ c }: { c: number }) {
  return (
    <group position={[0, c, 0]}>
      <mesh>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#a3e635" emissive="#65a30d" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── Raíces reales y complejas (plano de Argand 3D) ──────────────────────────── */
function Roots({ roots, vertex }: { roots: ComplexRoot[]; vertex: Vertex }) {
  const spin = useRef<THREE.Group[]>([]);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    spin.current.forEach((g) => { if (g) g.rotation.z = t * 1.2; });
  });
  // raíz doble (Δ=0): las dos raíces reales coinciden y caen sobre el vértice.
  // Se colapsa a un solo marcador para no encimar etiquetas.
  const isDoubleReal =
    roots.length === 2 &&
    roots[0].imaginary === 0 && roots[1].imaginary === 0 &&
    Math.abs(roots[0].real - roots[1].real) < 1e-3;
  const shown = isDoubleReal ? [roots[0]] : roots;

  return (
    <>
      {shown.map((root, i) => {
        const isComplex = root.imaginary !== 0;
        const z = i === 0 ? root.imaginary : -root.imaginary;
        const pos = new THREE.Vector3(root.real, isComplex ? 0 : 0, z);
        const color = isComplex ? '#c084fc' : '#22d3ee';
        const emis = isComplex ? '#a855f7' : '#0891b2';
        return (
          <group key={`root${i}`}>
            <group position={pos}>
              <mesh>
                <sphereGeometry args={[0.26, 28, 28]} />
                <meshStandardMaterial color={color} emissive={emis} emissiveIntensity={1.8} toneMapped={false} />
              </mesh>
              <group ref={(el) => { if (el) spin.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]}>
                <mesh><ringGeometry args={[0.42, 0.5, 36]} /><meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} toneMapped={false} /></mesh>
              </group>
              <pointLight color={color} intensity={1.3} distance={4.5} />
              <Html position={[0, isComplex ? 0.75 : -0.9, 0]} center distanceFactor={22} zIndexRange={[100, 0]}>
                <div className="text-[8px] font-black uppercase tracking-widest select-none pointer-events-none whitespace-nowrap" style={{ color }}>
                  {isComplex ? `raíz ${root.real.toFixed(1)} ${i === 0 ? '+' : '−'} ${Math.abs(root.imaginary).toFixed(1)}i` : `raíz x = ${root.real.toFixed(1)}`}
                </div>
              </Html>
            </group>
            {isComplex && (
              <Line points={[[vertex.h, vertex.k, 0], [pos.x, pos.y, pos.z]]} color="#c084fc" lineWidth={1.4} dashed dashSize={0.2} gapSize={0.2} transparent opacity={0.55} toneMapped={false} />
            )}
          </group>
        );
      })}
    </>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function SceneLogic({ a, b, c, target, currentRes, escenario = 'parabola_basica' }: Cuadraticas3DSceneProps) {
  const { delta, vertex, roots } = currentRes;
  const theme = THEMES[escenario] ?? THEMES.parabola_basica;
  const isComplex = delta < 0;
  const up = a >= 0;

  const studentPts = useMemo(() => sampleParabola(a, b, c, vertex.h), [a, b, c, vertex.h]);
  const targetH = -target.b / (2 * (Math.abs(target.a) < 1e-6 ? 1e-6 : target.a));
  const targetPts = useMemo(() => sampleParabola(target.a, target.b, target.c, targetH), [target, targetH]);

  // parámetro focal p = 1/(4a); se oculta si la parábola es casi plana
  const showFocus = Math.abs(a) >= 0.06;
  const p = 1 / (4 * (Math.abs(a) < 1e-6 ? 1e-6 : a));

  // raíces reales para el área bajo la curva
  const realRoots = roots.filter((r) => r.imaginary === 0).map((r) => r.real);
  const hasArea = realRoots.length >= 2;

  // encuadre de cámara centrado en el vértice
  const camTarget: [number, number, number] = [
    THREE.MathUtils.clamp(vertex.h * 0.6, -8, 8),
    THREE.MathUtils.clamp(vertex.k * 0.4, -4, 8),
    0,
  ];

  return (
    <>
      <PerspectiveCamera makeDefault position={[camTarget[0] * 0.5, 3, 22]} fov={46} />
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.fog, 26, 72]} />

      <ambientLight intensity={0.45} />
      <pointLight position={[0, 12, 12]} intensity={1.1} color={theme.accent} />
      <pointLight position={[0, -12, -8]} intensity={0.5} color={theme.accent2} />
      <directionalLight position={[8, 14, 10]} intensity={0.5} color="#ffffff" />

      <CartesianPlane accent={theme.accent} showImag={isComplex} />

      {hasArea && <AreaUnderCurve a={a} b={b} c={c} r1={realRoots[0]} r2={realRoots[1]} accent={theme.accent} />}

      <GhostTarget points={targetPts} color="#fb8500" />
      <AxisOfSymmetry h={vertex.h} k={vertex.k} up={up} />
      {showFocus && <FocusDirectrix h={vertex.h} k={vertex.k} p={p} accent={theme.accent2} />}
      {showFocus && <ReflectionRays a={a} b={b} c={c} h={vertex.h} k={vertex.k} p={p} accent={theme.accent2} />}

      <ParabolaTube points={studentPts} accent={theme.accent} accent2={theme.accent2} />
      <Traveler points={studentPts} accent={theme.accent} />

      <VertexMarker h={vertex.h} k={vertex.k} up={up} accent={theme.accent} />
      <YIntercept c={c} />
      <Roots roots={roots} vertex={vertex} />

      <Sparkles count={38} scale={[42, 34, 20]} position={[0, 2, 0]} size={1.8} speed={0.15} color={theme.dust} opacity={0.28} />
      <Stars radius={120} depth={60} count={900} factor={3.4} saturation={0} fade speed={0.35} />

      <OrbitControls
        enablePan enableZoom
        minDistance={6} maxDistance={44}
        target={camTarget}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 1.45}
      />

      <EffectComposer multisampling={4}>
        {/* umbral más alto + intensidad menor: solo brillan focos/vértice, no toda la curva */}
        <Bloom luminanceThreshold={0.62} mipmapBlur intensity={0.62} radius={0.5} />
        <ChromaticAberration offset={new THREE.Vector2(0.00018, 0.00018)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.28} darkness={0.92} />
      </EffectComposer>
    </>
  );
}

export default function Cuadraticas3DScene(props: Cuadraticas3DSceneProps) {
  const theme = THEMES[props.escenario ?? 'parabola_basica'] ?? THEMES.parabola_basica;
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas dpr={[1, 1.8]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <SceneLogic {...props} />
      </Canvas>

      {/* CAPA DE LEYENDA 3D */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex flex-wrap justify-center gap-3 px-4">
        <LegendChip color={theme.accent} label="Parábola f(x)" pulse />
        <LegendChip color="#fb8500" label="Objetivo" />
        <LegendChip color={theme.accent2} label="Foco · reflexión" />
        <LegendChip color="#f43f5e" label="Directriz" />
        {props.currentRes.delta < 0 && (
          <LegendChip color="#c084fc" label="Plano complejo (Im)" pulse />
        )}
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <div className="text-[9px] font-black uppercase tracking-widest text-white/30 select-none whitespace-nowrap">{theme.caption}</div>
      </div>
    </div>
  );
}

function LegendChip({ color, label, pulse }: { color: string; label: string; pulse?: boolean }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${pulse ? 'animate-pulse' : ''}`} style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      {label}
    </div>
  );
}
