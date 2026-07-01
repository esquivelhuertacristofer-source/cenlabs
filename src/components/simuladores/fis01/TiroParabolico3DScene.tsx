"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Sparkles,
  Html,
  Line,
  Trail,
  Float,
  Cloud,
  MeshReflectorMaterial,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────────────────
   TiroParabolico3DScene — Campo de tiro balístico cinematográfico.

   Integra el MISMO motor físico que el store (arrastre cuadrático + viento +
   gravedad planetaria) para trazar la trayectoria real, y superpone la parábola
   ideal (vacío) para que el alumno vea el efecto del arrastre. El entorno cambia
   según el planeta (Tierra/Luna/Marte/Júpiter): cielo, suelo, niebla, polvo y
   luz se re-temátican. Suelo reflectante, cañón railgun con carga, proyectil con
   estela, descomposición de vectores vₓ/v_y/v, regla de distancias, diana con
   enganche y onda de impacto.

   Props del estado real: { angulo, velocidad, g, viento, densidadAire, y0,
   obsX, obsY, targetX, volando, escenario, resultado }.
──────────────────────────────────────────────────────────────────────────── */

// Escala mundo: 1 unidad 3D = ESCALA metros.
const ESCALA = 8;
const m2w = (m: number) => m / ESCALA;

type Escenario = 'tierra' | 'luna' | 'marte' | 'jupiter';

interface Theme {
  fog: string;
  bg: string;
  ground: string;
  groundTint: string;
  grid: string;
  accent: string;
  dust: string;
  sun: string;
  sunPos: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  stars: number;
  clouds: boolean;
}

const THEMES: Record<Escenario, Theme> = {
  tierra: {
    fog: '#050b18', bg: '#050b18', ground: '#0a1a12', groundTint: '#12324a',
    grid: '#1f6a45', accent: '#22c55e', dust: '#7dd3fc', sun: '#fde68a',
    sunPos: [10, 18, 8], hemiSky: '#1e3a5f', hemiGround: '#020617', stars: 500, clouds: true,
  },
  luna: {
    fog: '#020204', bg: '#010103', ground: '#15151d', groundTint: '#2a2a38',
    grid: '#454560', accent: '#cbd5e1', dust: '#94a3b8', sun: '#ffffff',
    sunPos: [14, 12, 6], hemiSky: '#1a1a2e', hemiGround: '#000000', stars: 4500, clouds: false,
  },
  marte: {
    fog: '#1a0a06', bg: '#160806', ground: '#2e1207', groundTint: '#5a1f0d',
    grid: '#a3450f', accent: '#f97316', dust: '#fdba74', sun: '#fca5a5',
    sunPos: [9, 15, 10], hemiSky: '#4a1d0f', hemiGround: '#0a0402', stars: 260, clouds: true,
  },
  jupiter: {
    fog: '#160d04', bg: '#120a03', ground: '#241606', groundTint: '#5a3a0c',
    grid: '#a16207', accent: '#fbbf24', dust: '#fde68a', sun: '#fef3c7',
    sunPos: [7, 20, 12], hemiSky: '#4a2c0a', hemiGround: '#0a0602', stars: 220, clouds: true,
  },
};

type Sample = { p: THREE.Vector3; vx: number; vy: number };

/* ── Motor físico compartido con el store (fisicaSlice ejecutarDisparoF1) ────── */
function integrate(
  angulo: number, velocidad: number, g: number, viento: number, K: number, y0: number,
): { samples: Sample[]; maxY: number; t: number } {
  const rad = (angulo * Math.PI) / 180;
  const dt = 0.02;
  let curX = 0, curY = y0, t = 0;
  let vx = velocidad * Math.cos(rad);
  let vy = velocidad * Math.sin(rad);
  const samples: Sample[] = [];
  let maxY = y0;

  while (curY >= 0 && t < 16) {
    samples.push({ p: new THREE.Vector3(m2w(curX), m2w(curY), 0), vx, vy });
    if (curY > maxY) maxY = curY;
    const vTotal = Math.sqrt(vx * vx + vy * vy);
    const fx = -K * vx * vTotal + viento * 0.5;
    const fy = -g - K * vy * vTotal;
    vx += fx * dt; vy += fy * dt;
    curX += vx * dt; curY += vy * dt;
    t += dt;
  }
  if (samples.length < 2) {
    samples.push({ p: new THREE.Vector3(0, m2w(y0), 0), vx: 0, vy: 0 });
    samples.push({ p: new THREE.Vector3(0, 0, 0), vx: 0, vy: 0 });
  }
  return { samples, maxY, t };
}

function useTrajectory(
  angulo: number, velocidad: number, g: number, viento: number, densidadAire: number, y0: number,
) {
  return useMemo(() => {
    // Debe coincidir con el motor del store (fisicaSlice ejecutarDisparoF1).
    const K = 0.003 * densidadAire;
    const real = integrate(angulo, velocidad, g, viento, K, y0);
    // Parábola ideal: sin arrastre ni viento (K=0). Enseña el efecto del aire.
    const ideal = integrate(angulo, velocidad, g, 0, 0, y0);

    const last = real.samples[real.samples.length - 1];
    return {
      samples: real.samples,
      idealSamples: ideal.samples,
      alcance: last.p.x * ESCALA,
      idealAlcance: ideal.samples[ideal.samples.length - 1].p.x * ESCALA,
      maxY: real.maxY,
      tVuelo: real.t,
    };
  }, [angulo, velocidad, g, viento, densidadAire, y0]);
}

/* ── Trayectoria real: tubo emisivo con degradado por rapidez ────────────────── */
function TrajectoryTube({ samples, accent }: { samples: Sample[]; accent: string }) {
  const geometry = useMemo(() => {
    const pts = samples.map((s) => s.p);
    const curve = new THREE.CatmullRomCurve3(pts);
    const seg = Math.min(240, Math.max(24, pts.length * 2));
    const geo = new THREE.TubeGeometry(curve, seg, 0.05, 10, false);

    // color por posición a lo largo del tubo: cian (rápido) → color de acento (lento)
    const cold = new THREE.Color('#22d3ee');
    const warm = new THREE.Color(accent);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const ring = 11; // radialSegments+1
    for (let i = 0; i < pos.count; i++) {
      const along = Math.floor(i / ring) / seg;
      const c = cold.clone().lerp(warm, along);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }, [samples, accent]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        emissive="#ffffff"
        emissiveIntensity={0.9}
        toneMapped={false}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

/* ── Parábola ideal (vacío): línea punteada tenue de referencia ──────────────── */
function IdealTrajectory({ samples }: { samples: Sample[] }) {
  const points = useMemo(
    () => samples.filter((_, i) => i % 2 === 0).map((s) => s.p),
    [samples],
  );
  if (points.length < 2) return null;
  return (
    <Line
      points={points}
      color="#94a3b8"
      lineWidth={1.1}
      dashed
      dashSize={0.18}
      gapSize={0.14}
      transparent
      opacity={0.4}
      toneMapped={false}
    />
  );
}

/* ── Flecha de vector (cilindro + cono) ──────────────────────────────────────── */
function VectorArrow({ length, color, radius = 0.02 }: { length: number; color: string; radius?: number }) {
  if (length < 0.02) return null;
  return (
    <group>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[radius, radius, length, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0, length + 0.08, 0]}>
        <coneGeometry args={[radius * 3.4, 0.18, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── Proyectil: núcleo brillante + estela + sombra en suelo + vectores ───────── */
function Projectile({
  samples, playing, accent, onLoop,
}: {
  samples: Sample[]; playing: boolean; accent: string; onLoop: (x: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const vxRef = useRef<THREE.Group>(null);
  const vyRef = useRef<THREE.Group>(null);
  const vRef = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const vmax = useMemo(
    () => Math.max(...samples.map((s) => Math.hypot(s.vx, s.vy)), 1),
    [samples],
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    const n = samples.length;
    progress.current += delta * (playing ? 30 : 14);
    if (progress.current >= n - 1) {
      progress.current = 0;
      const endX = samples[n - 1].p.x;
      onLoop(endX);
    }

    const i = Math.floor(progress.current);
    const frac = progress.current - i;
    const a = samples[i];
    const b = samples[Math.min(i + 1, n - 1)];
    ref.current.position.lerpVectors(a.p, b.p, frac);

    if (shadowRef.current) {
      shadowRef.current.position.x = ref.current.position.x;
      const scale = THREE.MathUtils.clamp(1 - ref.current.position.y * 0.35, 0.25, 1);
      shadowRef.current.scale.set(scale, scale, scale);
      (shadowRef.current.material as THREE.Material).opacity = 0.35 * scale;
    }

    const vx = THREE.MathUtils.lerp(a.vx, b.vx, frac);
    const vy = THREE.MathUtils.lerp(a.vy, b.vy, frac);

    if (vxRef.current) {
      vxRef.current.scale.set(1, Math.max(0.001, (Math.abs(vx) / vmax) * 1.6), 1);
      vxRef.current.rotation.z = vx >= 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    if (vyRef.current) {
      vyRef.current.scale.set(1, Math.max(0.001, (Math.abs(vy) / vmax) * 1.6), 1);
      vyRef.current.rotation.z = vy >= 0 ? 0 : Math.PI;
    }
    if (vRef.current) {
      const speed = Math.hypot(vx, vy);
      vRef.current.scale.set(1, Math.max(0.001, (speed / vmax) * 1.9), 1);
      vRef.current.rotation.z = Math.atan2(vy, vx) - Math.PI / 2;
    }
  });

  return (
    <>
      {/* sombra proyectada en el suelo */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      <group ref={ref}>
        <Trail width={5} length={8} color={'#22d3ee'} attenuation={(w) => w * w}>
          <mesh>
            <sphereGeometry args={[0.17, 24, 24]} />
            <meshStandardMaterial color="#ecfeff" emissive="#22d3ee" emissiveIntensity={4} toneMapped={false} />
          </mesh>
        </Trail>
        {/* halo aditivo */}
        <mesh>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <pointLight color="#22d3ee" intensity={7} distance={6} />

        {/* vₓ horizontal (cian) */}
        <group ref={vxRef}><VectorArrow length={1} color="#38bdf8" /></group>
        {/* v_y vertical (ámbar) */}
        <group ref={vyRef}><VectorArrow length={1} color="#fbbf24" /></group>
        {/* v resultante (color de acento, más gruesa) */}
        <group ref={vRef}><VectorArrow length={1} color={accent} radius={0.028} /></group>
      </group>
    </>
  );
}

/* ── Onda de impacto en el punto de caída, sincronizada al bucle ─────────────── */
function ImpactWave({ trigger, color }: { trigger: React.MutableRefObject<{ x: number; t: number }>; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const elapsed = state.clock.getElapsedTime() - trigger.current.t;
    const life = 0.9;
    if (elapsed < 0 || elapsed > life) { ref.current.visible = false; return; }
    ref.current.visible = true;
    ref.current.position.x = trigger.current.x;
    const k = elapsed / life;
    const s = 0.2 + k * 2.4;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.85;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} visible={false}>
      <ringGeometry args={[0.55, 0.75, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

/* ── Cañón / railgun con carga luminosa y boca ───────────────────────────────── */
function Launcher({ angulo, y0, accent }: { angulo: number; y0: number; accent: string }) {
  const rad = (angulo * Math.PI) / 180;
  const wy0 = m2w(y0);
  const glow = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (glow.current) {
      const p = 0.6 + Math.sin(state.clock.getElapsedTime() * 4) * 0.4;
      (glow.current.material as THREE.MeshBasicMaterial).opacity = p * 0.8;
    }
  });

  return (
    <group position={[0, wy0, 0]}>
      {/* mástil de plataforma */}
      <mesh position={[0, -wy0 / 2, 0]}>
        <cylinderGeometry args={[0.4, 0.62, Math.max(0.2, wy0), 8]} />
        <meshStandardMaterial color="#0b1220" emissive={accent} emissiveIntensity={0.18} roughness={0.4} metalness={0.7} />
      </mesh>
      {/* base anular */}
      <mesh position={[0, -wy0 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.85, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* núcleo / torreta */}
      <mesh>
        <icosahedronGeometry args={[0.36, 1]} />
        <meshStandardMaterial color="#1e293b" emissive="#0ea5e9" emissiveIntensity={0.7} metalness={0.8} roughness={0.25} flatShading />
      </mesh>
      {/* barril rotado por el ángulo */}
      <group rotation={[0, 0, rad]}>
        <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.13, 1.2, 18]} />
          <meshStandardMaterial color="#334155" emissive="#38bdf8" emissiveIntensity={0.9} metalness={0.85} roughness={0.15} />
        </mesh>
        {/* rieles del railgun */}
        <mesh position={[0.6, 0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh position={[0.6, -0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {/* boca / carga */}
        <mesh ref={glow} position={[1.2, 0, 0]}>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0.7} toneMapped={false} />
        </mesh>
        <pointLight position={[1.25, 0, 0]} color="#38bdf8" intensity={3} distance={3} />
      </group>
      <Html center distanceFactor={16} position={[0, 0.8, 0]}>
        <div className="text-[10px] font-black text-sky-300 uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
          Y₀ {y0.toFixed(1)}m · θ {angulo}°
        </div>
      </Html>
    </group>
  );
}

/* ── Diana / objetivo con anillos de enganche ────────────────────────────────── */
function Target({ x, label, color, spin = 0.8 }: { x: number; label: string; color: string; spin?: number }) {
  const ref = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) ref.current.rotation.z = t * spin;
    if (pulse.current) {
      const s = 1 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.6;
      pulse.current.scale.set(s, s, s);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - (s - 1) / 0.6);
    }
  });
  const wx = m2w(x);
  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.4} floatingRange={[0, 0.15]}>
      <group position={[wx, 0.02, 0]}>
        <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh><ringGeometry args={[0.4, 0.52, 40]} /><meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} toneMapped={false} /></mesh>
          <mesh><ringGeometry args={[0.18, 0.24, 40]} /><meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} /></mesh>
          {/* marcas cruzadas de mira */}
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => (
            <mesh key={i} rotation={[0, 0, a]} position={[Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0]}>
              <boxGeometry args={[0.14, 0.03, 0.001]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          ))}
          <mesh ref={pulse}><ringGeometry args={[0.5, 0.56, 40]} /><meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} /></mesh>
        </group>
        <mesh><sphereGeometry args={[0.09, 16, 16]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
        <pointLight color={color} intensity={3} distance={5} />
        <Html center distanceFactor={16} position={[0, 0.7, 0]}>
          <div className="text-[10px] font-black uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap" style={{ color }}>
            {label} · {x.toFixed(0)}m
          </div>
        </Html>
      </group>
    </Float>
  );
}

/* ── Muro / obstáculo ───────────────────────────────────────────────────────── */
function Obstacle({ x, h }: { x: number; h: number }) {
  if (h <= 0) return null;
  const wx = m2w(x);
  const wh = m2w(h);
  return (
    <group position={[wx, wh / 2, 0]}>
      <mesh>
        <boxGeometry args={[0.3, wh, 0.6]} />
        <meshStandardMaterial color="#3a1508" emissive="#f97316" emissiveIntensity={0.35} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, wh / 2 + 0.03, 0]}>
        <boxGeometry args={[0.38, 0.06, 0.66]} />
        <meshBasicMaterial color="#fdba74" toneMapped={false} />
      </mesh>
      <Html center distanceFactor={16} position={[0, wh / 2 + 0.45, 0]}>
        <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
          Muro {h.toFixed(0)}m
        </div>
      </Html>
    </group>
  );
}

/* ── Cresta de altura máxima ─────────────────────────────────────────────────── */
function ApexGuide({ maxY, xEnd }: { maxY: number; xEnd: number }) {
  const wy = m2w(maxY);
  const wx = m2w(xEnd);
  return (
    <group>
      <Line points={[[0, wy, 0], [wx, wy, 0]]} color="#fbbf24" lineWidth={1} dashed dashSize={0.14} gapSize={0.1} transparent opacity={0.45} toneMapped={false} />
      <Html center distanceFactor={16} position={[wx * 0.5, wy + 0.28, 0]}>
        <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
          H máx {maxY.toFixed(1)}m
        </div>
      </Html>
    </group>
  );
}

/* ── Regla de distancias en el suelo cada 10 m ───────────────────────────────── */
function DistanceRuler({ maxM, accent }: { maxM: number; accent: string }) {
  const marks = useMemo(() => {
    const arr: number[] = [];
    for (let m = 10; m <= maxM; m += 10) arr.push(m);
    return arr;
  }, [maxM]);
  return (
    <group>
      {marks.map((m) => (
        <group key={m} position={[m2w(m), 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.03, 0.6]} />
            <meshBasicMaterial color={accent} transparent opacity={0.4} toneMapped={false} />
          </mesh>
          <Html center distanceFactor={20} position={[0, 0, 0.6]}>
            <div className="text-[8px] font-bold text-white/40 tabular-nums select-none pointer-events-none whitespace-nowrap">{m}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ── Suelo reflectante temático ──────────────────────────────────────────────── */
function ReflectiveFloor({ theme, centerX }: { theme: Theme; centerX: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, 0]}>
      <planeGeometry args={[120, 60]} />
      <MeshReflectorMaterial
        resolution={512}
        mixBlur={1}
        mixStrength={theme.stars > 2000 ? 25 : 40}
        blur={[300, 100]}
        mirror={0.35}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.2}
        depthScale={1}
        roughness={0.9}
        metalness={0.2}
        color={theme.ground}
      />
    </mesh>
  );
}

/* ── Rejilla holográfica sobre el suelo ──────────────────────────────────────── */
function HoloGrid({ theme, centerX }: { theme: Theme; centerX: number }) {
  const lines = useMemo(() => {
    const segs: [number, number, number][][] = [];
    const half = 60, depth = 24, step = m2w(10);
    for (let x = -half; x <= half; x += step) segs.push([[x, 0, -depth], [x, 0, depth]]);
    for (let z = -depth; z <= depth; z += step) segs.push([[-half, 0, z], [half, 0, z]]);
    return segs;
  }, []);
  return (
    <group position={[centerX, 0.01, 0]}>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={theme.grid} lineWidth={0.6} transparent opacity={0.25} toneMapped={false} />
      ))}
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({
  angulo, velocidad, g, viento, densidadAire, y0, obsX, obsY, targetX, volando, escenario,
}: SceneProps) {
  const theme = THEMES[escenario] ?? THEMES.tierra;
  const { samples, idealSamples, alcance, maxY } = useTrajectory(angulo, velocidad, g, viento, densidadAire, y0);

  const spanM = Math.max(alcance, targetX, 20);
  const centerXw = m2w(spanM) * 0.5;
  const camDist = THREE.MathUtils.clamp(m2w(spanM) * 0.95 + 6, 9, 38);
  const camX = m2w(spanM) * 0.4;

  // punto/tiempo del último impacto (para la onda), compartido por ref
  const impact = useRef({ x: samples[samples.length - 1].p.x, t: -10 });
  const clockRef = useRef(0);
  useFrame((state) => { clockRef.current = state.clock.getElapsedTime(); });
  const handleLoop = (x: number) => { impact.current = { x, t: clockRef.current }; };

  return (
    <>
      <PerspectiveCamera makeDefault position={[camX, 4.5, camDist]} fov={45} />
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.fog, 24, 78]} />

      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.5} groundColor={theme.hemiGround} color={theme.hemiSky} />
      <directionalLight position={theme.sunPos} intensity={1.1} color={theme.sun} castShadow />
      <pointLight position={[camX, 6, 6]} intensity={0.4} color={theme.accent} />

      <ReflectiveFloor theme={theme} centerX={centerXw} />
      <HoloGrid theme={theme} centerX={centerXw} />
      <DistanceRuler maxM={Math.ceil(spanM / 10) * 10} accent={theme.accent} />

      <Launcher angulo={angulo} y0={y0} accent={theme.accent} />
      <IdealTrajectory samples={idealSamples} />
      <TrajectoryTube samples={samples} accent={theme.accent} />
      <ApexGuide maxY={maxY} xEnd={Math.max(alcance, 1)} />
      <Projectile samples={samples} playing={volando} accent={theme.accent} onLoop={handleLoop} />
      <ImpactWave trigger={impact} color={theme.accent} />

      <Obstacle x={obsX} h={obsY} />
      <Target x={targetX} label="Objetivo" color="#ef4444" />
      <Target x={alcance} label="Alcance" color="#10b981" spin={-0.6} />

      {/* polvo atmosférico temático */}
      <Sparkles count={80} scale={[m2w(spanM) + 10, 9, 14]} position={[centerXw, 4, 0]} size={2.4} speed={0.25} color={theme.dust} opacity={0.45} />
      {theme.clouds && (
        <Float speed={0.6} floatIntensity={1} rotationIntensity={0}>
          <Cloud position={[centerXw, m2w(maxY) + 5, -10]} opacity={0.06} speed={0.1} bounds={[16, 3, 6]} color={theme.dust} segments={12} />
        </Float>
      )}
      <Stars radius={100} depth={50} count={theme.stars} factor={4} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan enableZoom
        minDistance={5} maxDistance={48}
        target={[centerXw, 1.5, 0]}
        autoRotate={false}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.03}
      />

      <EffectComposer multisampling={4}>
        <Bloom luminanceThreshold={0.18} mipmapBlur intensity={1.35} radius={0.75} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.22} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

interface SceneProps {
  angulo: number;
  velocidad: number;
  g: number;
  viento: number;
  densidadAire: number;
  y0: number;
  obsX: number;
  obsY: number;
  targetX: number;
  volando: boolean;
  escenario: Escenario;
  resultado?: 'exito' | 'fallo' | 'colision' | null;
}

export default function TiroParabolico3DScene(props: SceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 1.8]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
