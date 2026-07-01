"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Sparkles,
  Html,
  Grid,
  Trail,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────────────────
   TiroParabolico3DScene — Trayectoria parabólica 3D con física real del Piloto.
   Integra el mismo motor que el store (arrastre cuadrático + viento + gravedad
   planetaria) para generar la curva real. El proyectil recorre el arco en bucle
   con estela luminosa; se descomponen los vectores vₓ (const) y v_y (variable),
   se marca el alcance con una diana y la altura máxima con un plano guía.
   Props derivados del estado real: { angulo, velocidad, g, viento, densidadAire,
   y0, obsX, obsY, targetX, escenario, volando }.
──────────────────────────────────────────────────────────────────────────── */

// Escala mundo: 1 unidad 3D = ESCALA metros. Mantiene la escena manejable.
const ESCALA = 8; // metros por unidad de mundo
const m2w = (m: number) => m / ESCALA;

const COL_VX = new THREE.Color('#38bdf8'); // vector horizontal
const COL_VY = new THREE.Color('#fbbf24'); // vector vertical
const COL_TRAIL = '#22d3ee';

type Sample = { p: THREE.Vector3; vx: number; vy: number };

/* ── Integra la trayectoria con el MISMO motor físico que el store ───────────── */
function useTrajectory(
  angulo: number,
  velocidad: number,
  g: number,
  viento: number,
  densidadAire: number,
  y0: number,
) {
  return useMemo(() => {
    const rad = (angulo * Math.PI) / 180;
    const K = 0.05 * densidadAire;
    const dt = 0.02;

    let curX = 0;
    let curY = y0;
    let vx = velocidad * Math.cos(rad);
    let vy = velocidad * Math.sin(rad);
    let t = 0;

    const samples: Sample[] = [];
    let maxY = y0;

    while (curY >= 0 && t < 14) {
      samples.push({
        p: new THREE.Vector3(m2w(curX), m2w(curY), 0),
        vx,
        vy,
      });
      if (curY > maxY) maxY = curY;

      const vTotal = Math.sqrt(vx * vx + vy * vy);
      const fx = -K * vx * vTotal + viento * 0.5;
      const fy = -g - K * vy * vTotal;

      vx += fx * dt;
      vy += fy * dt;
      curX += vx * dt;
      curY += vy * dt;
      t += dt;
    }
    if (samples.length < 2) {
      samples.push({ p: new THREE.Vector3(0, m2w(y0), 0), vx: 0, vy: 0 });
      samples.push({ p: new THREE.Vector3(0, 0, 0), vx: 0, vy: 0 });
    }

    const last = samples[samples.length - 1];
    return {
      samples,
      alcance: last.p.x * ESCALA, // metros
      maxY,
      tVuelo: t,
      curve: new THREE.CatmullRomCurve3(samples.map((s) => s.p)),
    };
  }, [angulo, velocidad, g, viento, densidadAire, y0]);
}

/* ── Línea estática de la parábola (puntos luminosos) ───────────────────────── */
function TrajectoryLine({ samples }: { samples: Sample[] }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(samples.length * 3);
    samples.forEach((s, i) => {
      arr[i * 3] = s.p.x;
      arr[i * 3 + 1] = s.p.y;
      arr[i * 3 + 2] = s.p.z;
    });
    return arr;
  }, [samples]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={samples.length} />
      </bufferGeometry>
      <lineBasicMaterial color="#0ea5e9" transparent opacity={0.35} />
    </line>
  );
}

/* ── Flecha de vector (cilindro + cono) orientada por un Vector3 ─────────────── */
function VectorArrow({
  origin,
  dir,
  length,
  color,
}: {
  origin: THREE.Vector3;
  dir: THREE.Vector3;
  length: number;
  color: THREE.Color;
}) {
  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    const d = dir.lengthSq() > 1e-6 ? dir.clone().normalize() : new THREE.Vector3(0, 1, 0);
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
    return q;
  }, [dir]);

  if (length < 0.02) return null;

  return (
    <group position={origin} quaternion={quat}>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, length, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0, length + 0.08, 0]}>
        <coneGeometry args={[0.07, 0.18, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── Proyectil que recorre la parábola en bucle + estela + vectores ─────────── */
function Projectile({
  samples,
  playing,
}: {
  samples: Sample[];
  playing: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const vxRef = useRef<THREE.Group>(null);
  const vyRef = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const vmax = useMemo(
    () => Math.max(...samples.map((s) => Math.hypot(s.vx, s.vy)), 1),
    [samples],
  );

  useFrame((_, delta) => {
    if (!ref.current) return;
    const n = samples.length;
    // avanza el índice; velocidad de reproducción cinematográfica
    progress.current += delta * (playing ? 26 : 16);
    if (progress.current >= n - 1) progress.current = 0;

    const i = Math.floor(progress.current);
    const frac = progress.current - i;
    const a = samples[i];
    const b = samples[Math.min(i + 1, n - 1)];

    ref.current.position.lerpVectors(a.p, b.p, frac);

    const vx = THREE.MathUtils.lerp(a.vx, b.vx, frac);
    const vy = THREE.MathUtils.lerp(a.vy, b.vy, frac);

    if (vxRef.current) {
      const len = (Math.abs(vx) / vmax) * 1.6;
      vxRef.current.scale.set(1, Math.max(0.001, len), 1);
      vxRef.current.rotation.z = vx >= 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    if (vyRef.current) {
      const len = (Math.abs(vy) / vmax) * 1.6;
      vyRef.current.scale.set(1, Math.max(0.001, len), 1);
      vyRef.current.rotation.z = vy >= 0 ? 0 : Math.PI;
    }
  });

  const unit = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const zero = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  return (
    <group ref={ref}>
      {/* estela luminosa */}
      <Trail width={4} length={7} color={COL_TRAIL} attenuation={(w) => w * w}>
        <mesh>
          <sphereGeometry args={[0.16, 24, 24]} />
          <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={3.5} toneMapped={false} />
        </mesh>
      </Trail>
      {/* halo del proyectil */}
      <mesh>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color="#22d3ee" intensity={6} distance={5} />

      {/* Vector vₓ (horizontal) — escalado/rotado por scale.y + rotation.z */}
      <group ref={vxRef}>
        <VectorArrow origin={zero} dir={unit} length={1} color={COL_VX} />
      </group>
      {/* Vector v_y (vertical) */}
      <group ref={vyRef}>
        <VectorArrow origin={zero} dir={unit} length={1} color={COL_VY} />
      </group>
    </group>
  );
}

/* ── Cañón / lanzador en el origen, elevado a la altura Y₀ ───────────────────── */
function Launcher({ angulo, y0 }: { angulo: number; y0: number }) {
  const rad = (angulo * Math.PI) / 180;
  const wy0 = m2w(y0);

  return (
    <group position={[0, wy0, 0]}>
      {/* Base / plataforma */}
      <mesh position={[0, -wy0 / 2, 0]}>
        <cylinderGeometry args={[0.45, 0.6, Math.max(0.2, wy0), 6]} />
        <meshStandardMaterial color="#0f172a" emissive="#0ea5e9" emissiveIntensity={0.2} roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Núcleo estabilizador */}
      <mesh>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color="#1e293b" emissive="#0ea5e9" emissiveIntensity={0.6} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Barril del railgun (rota con el ángulo) */}
      <group rotation={[0, 0, rad]}>
        <mesh position={[0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.14, 1.1, 16]} />
          <meshStandardMaterial color="#334155" emissive="#38bdf8" emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Boquilla luminosa */}
        <mesh position={[1.1, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.13, 0.03, 12, 24]} />
          <meshBasicMaterial color="#38bdf8" toneMapped={false} />
        </mesh>
      </group>
      <Html center distanceFactor={16} position={[0, 0.7, 0]}>
        <div className="text-[10px] font-black text-sky-300 uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
          Y₀ {y0.toFixed(1)}m · θ {angulo}°
        </div>
      </Html>
    </group>
  );
}

/* ── Diana / objetivo en el punto de alcance ────────────────────────────────── */
function Target({ x, label, color }: { x: number; label: string; color: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.getElapsedTime() * 0.8;
  });
  const wx = m2w(x);
  return (
    <group position={[wx, 0.02, 0]}>
      <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[0.4, 0.5, 40]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.18, 0.24, 40]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <pointLight color={color} intensity={3} distance={4} />
      <Html center distanceFactor={16} position={[0, 0.6, 0]}>
        <div className="text-[10px] font-black uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap" style={{ color }}>
          {label} · {x.toFixed(0)}m
        </div>
      </Html>
    </group>
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
        <boxGeometry args={[0.3, wh, 0.5]} />
        <meshStandardMaterial color="#7c2d12" emissive="#f97316" emissiveIntensity={0.4} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, wh / 2 + 0.03, 0]}>
        <boxGeometry args={[0.36, 0.06, 0.56]} />
        <meshBasicMaterial color="#fdba74" toneMapped={false} />
      </mesh>
      <Html center distanceFactor={16} position={[0, wh / 2 + 0.4, 0]}>
        <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
          Muro {h.toFixed(0)}m
        </div>
      </Html>
    </group>
  );
}

/* ── Plano guía de altura máxima ────────────────────────────────────────────── */
function MaxHeightGuide({ maxY, xEnd }: { maxY: number; xEnd: number }) {
  const wy = m2w(maxY);
  const wx = m2w(xEnd);
  const positions = useMemo(
    () => new Float32Array([0, wy, 0, wx, wy, 0]),
    [wy, wx],
  );
  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={2} />
        </bufferGeometry>
        <lineBasicMaterial color="#fbbf24" transparent opacity={0.5} />
      </line>
      <Html center distanceFactor={16} position={[wx * 0.5, wy + 0.25, 0]}>
        <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
          H máx {maxY.toFixed(1)}m
        </div>
      </Html>
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({
  angulo,
  velocidad,
  g,
  viento,
  densidadAire,
  y0,
  obsX,
  obsY,
  targetX,
  volando,
}: SceneProps) {
  const { samples, alcance, maxY } = useTrajectory(angulo, velocidad, g, viento, densidadAire, y0);

  // Encuadre de cámara según el alcance (se aleja para tiros largos)
  const camDist = THREE.MathUtils.clamp(m2w(Math.max(alcance, 20)) * 0.9 + 6, 8, 34);
  const camX = m2w(Math.max(alcance, 10)) * 0.4;

  return (
    <>
      <PerspectiveCamera makeDefault position={[camX, 4, camDist]} fov={45} />
      <color attach="background" args={['#03040a']} />
      <fog attach="fog" args={['#03040a', 26, 70]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight intensity={0.35} groundColor="#020617" color="#1e3a5f" />
      <directionalLight position={[8, 16, 10]} intensity={0.8} color="#93c5fd" />

      {/* Suelo con grid holográfico */}
      <Grid
        position={[m2w(Math.max(alcance, 20)) * 0.5, 0, 0]}
        args={[60, 30]}
        cellSize={m2w(10)}
        cellThickness={0.6}
        cellColor="#1e3a5f"
        sectionSize={m2w(50)}
        sectionThickness={1.1}
        sectionColor="#0ea5e9"
        fadeDistance={60}
        fadeStrength={1.5}
        infiniteGrid
      />

      <Launcher angulo={angulo} y0={y0} />
      <TrajectoryLine samples={samples} />
      <MaxHeightGuide maxY={maxY} xEnd={Math.max(alcance, 1)} />
      <Projectile samples={samples} playing={volando} />

      <Obstacle x={obsX} h={obsY} />
      <Target x={targetX} label="Objetivo" color="#ef4444" />
      <Target x={alcance} label="Alcance" color="#10b981" />

      <Sparkles count={70} scale={[m2w(alcance) + 8, 8, 12]} position={[m2w(alcance) * 0.5, 4, 0]} size={2} speed={0.3} color="#93c5fd" opacity={0.4} />
      <Stars radius={90} depth={45} count={2800} factor={4} saturation={0} fade speed={0.6} />

      <OrbitControls
        enablePan
        enableZoom
        minDistance={5}
        maxDistance={45}
        target={[m2w(Math.max(alcance, 10)) * 0.5, 1.5, 0]}
        autoRotate={!volando}
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.02}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.5} radius={0.7} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
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
}

export default function TiroParabolico3DScene(props: SceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
