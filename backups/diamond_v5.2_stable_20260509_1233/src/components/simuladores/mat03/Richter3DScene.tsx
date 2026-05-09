"use client";

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Html, Stars, PerspectiveCamera, Line, Box, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';

interface Props { magnitudActual: number; magnitudBase: number; escenario: string; isLightMode: boolean; }

// ── CITY SKYLINE ──
const BUILDING_GRID = (() => {
  const buildings: { x: number; z: number; w: number; d: number; h: number; seed: number }[] = [];
  for (let gx = -4; gx <= 4; gx++) {
    for (let gz = -2; gz <= 2; gz++) {
      if (Math.abs(gx) < 2 && Math.abs(gz) < 1) continue; // Clear center for epicenter
      const seed = Math.abs(Math.sin(gx * 127.1 + gz * 311.7) * 43758.5453) % 1;
      const h = 1.5 + seed * 5;
      const w = 0.6 + seed * 0.6;
      const d = 0.6 + (1 - seed) * 0.5;
      buildings.push({ x: gx * 2.5 + (seed - 0.5) * 0.8, z: gz * 3.5 + (seed - 0.5) * 0.6, w, d, h, seed });
    }
  }
  return buildings;
})();

function Building({ x, z, w, d, h, seed, magnitud }: { x: number; z: number; w: number; d: number; h: number; seed: number; magnitud: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const windowRef = useRef<THREE.Mesh>(null);
  const baseColor = useMemo(() => {
    const c = new THREE.Color();
    c.setHSL(0.6 + seed * 0.1, 0.15, 0.08 + seed * 0.04);
    return c;
  }, [seed]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    const dist = Math.sqrt(x * x + z * z);
    const delay = dist * 0.15;
    const shakeIntensity = magnitud > 3.5 ? Math.pow(1.6, magnitud - 3.5) * 0.008 : 0;
    // Vibration
    const vx = Math.sin(t * (12 + seed * 5) + delay) * shakeIntensity;
    const vz = Math.cos(t * (10 + seed * 4) + delay) * shakeIntensity * 0.8;
    // Progressive lean at high magnitudes
    const leanFactor = magnitud > 5.0 ? (magnitud - 5.0) * 0.12 * (seed > 0.5 ? 1 : -1) * (h / 5) : 0;
    const collapse = magnitud > 7.0 && seed > 0.3 ? Math.min((magnitud - 7.0) * 0.8, 1.8) * (seed > 0.6 ? 1 : 0.5) : 0;
    ref.current.rotation.x = vx + leanFactor * 0.5 + collapse * 0.8;
    ref.current.rotation.z = vz + leanFactor + collapse * 0.3 * (seed > 0.5 ? 1 : -1);
    ref.current.position.y = h / 2 - collapse * h * 0.3;
    // Window flicker
    if (windowRef.current) {
      const mat = windowRef.current.material as THREE.MeshStandardMaterial;
      if (magnitud > 7) {
        mat.emissiveIntensity = Math.random() > 0.7 ? 0.3 : 1.5; // Flickering
      } else {
        mat.emissiveIntensity = 0.8;
      }
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Building body */}
      <mesh ref={ref} position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={baseColor} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Windows (emissive strips) */}
      <mesh ref={windowRef} position={[0, h / 2, d / 2 + 0.01]}>
        <planeGeometry args={[w * 0.8, h * 0.85]} />
        <meshStandardMaterial
          color="#0ea5e9"
          emissive={magnitud > 7 ? "#ef4444" : "#0ea5e9"}
          emissiveIntensity={0.8}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}

function CityGrid({ magnitud }: { magnitud: number }) {
  return (
    <group>
      {BUILDING_GRID.map((b, i) => (
        <Building key={i} {...b} magnitud={magnitud} />
      ))}
    </group>
  );
}

// ── GROUND WITH CRACK ──
function GroundPlane({ magnitud, isLightMode }: { magnitud: number, isLightMode: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!meshRef.current) return;
    const pos = (meshRef.current.geometry as THREE.PlaneGeometry).attributes.position;
    const t = state.clock.getElapsedTime();
    const intensity = Math.pow(1.3, magnitud - 4) * 0.08;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i), py = pos.getY(i);
      const dist = Math.sqrt(px * px + py * py);
      pos.setZ(i, Math.sin(dist * 0.6 - t * (1 + magnitud * 0.15)) * intensity * Math.exp(-dist * 0.03));
    }
    pos.needsUpdate = true;
  });

  return (
    <>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[60, 60, 100, 100]} />
        <meshStandardMaterial color={isLightMode ? "#cbd5e1" : "#080e1a"} metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Grid overlay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[60, 60, 60, 60]} />
        <meshStandardMaterial 
          color={magnitud > 7 ? (isLightMode ? "#be123c" : "#f43f5e") : isLightMode ? "#94a3b8" : "#1e3a5f"} 
          wireframe transparent 
          opacity={magnitud > 7 ? (isLightMode ? 0.2 : 0.08) : (isLightMode ? 0.15 : 0.04)} 
          emissive={magnitud > 7 ? (isLightMode ? "#be123c" : "#f43f5e") : isLightMode ? "#94a3b8" : "#1e3a5f"} 
          emissiveIntensity={isLightMode ? 0.6 : 0.3} 
        />
      </mesh>
    </>
  );
}

// ── GROUND CRACK (glowing fissure) ──
function GroundCrack({ magnitud, isLightMode }: { magnitud: number, isLightMode: boolean }) {
  if (magnitud < 5) return null;
  const crackWidth = (magnitud - 5) * 0.08;
  const crackLength = 4 + (magnitud - 5) * 4;
  const intensity = Math.min((magnitud - 5) / 4, 1);
  const color = magnitud > 7 ? (isLightMode ? "#9f1239" : "#ef4444") : (isLightMode ? "#9a3412" : "#fb923c");
  
  const crackPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 30; i++) {
      const t = (i / 30 - 0.5) * crackLength;
      const wobble = Math.sin(i * 2.7) * 0.3 + Math.sin(i * 1.3) * 0.15;
      pts.push(new THREE.Vector3(t, 0.05, wobble));
    }
    return pts;
  }, [crackLength]);

  return (
    <group>
      <Line points={crackPoints} color={color} lineWidth={2 + crackWidth * 10} transparent opacity={intensity * 0.8} />
      <Line points={crackPoints} color={color} lineWidth={8 + crackWidth * 30} transparent opacity={intensity * 0.15} />
      {/* Glow from below */}
      {magnitud > 6 && (
        <pointLight position={[0, -0.5, 0]} color={color} intensity={intensity * 3} distance={8} decay={2} />
      )}
    </group>
  );
}

// ── EPICENTER ENERGY SPHERE ──
function Epicenter({ magnitud, isLightMode }: { magnitud: number, isLightMode: boolean }) {
  const coreRef = useRef<THREE.Mesh>(null);
  const glow1 = useRef<THREE.Mesh>(null);
  const glow2 = useRef<THREE.Mesh>(null);
  const size = Math.pow(1.2, magnitud - 4) * 0.4;
  const color = magnitud > 8 ? (isLightMode ? "#be123c" : "#f43f5e") : magnitud > 6 ? (isLightMode ? "#c2410c" : "#fb923c") : (isLightMode ? "#ca8a04" : "#facc15");

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const p = 1 + Math.sin(t * (1.5 + magnitud * 0.2)) * 0.12;
    if (coreRef.current) { coreRef.current.scale.setScalar(size * p); coreRef.current.rotation.y += 0.01; coreRef.current.rotation.x += 0.004; }
    if (glow1.current) { glow1.current.scale.setScalar(size * p * 2); (glow1.current.material as any).opacity = 0.05 + Math.sin(t * 3) * 0.02; }
    if (glow2.current) { glow2.current.scale.setScalar(size * p * 4); (glow2.current.material as any).opacity = 0.02 + Math.sin(t * 2) * 0.01; }
  });

  return (
    <group position={[0, size * 1.5 + 0.5, 0]}>
      <Sphere ref={glow2} args={[1, 24, 24]}><meshStandardMaterial color={color} transparent opacity={0.02} emissive={color} emissiveIntensity={2} side={THREE.BackSide} /></Sphere>
      <Sphere ref={glow1} args={[1, 24, 24]}><meshStandardMaterial color={color} transparent opacity={0.05} emissive={color} emissiveIntensity={1.5} /></Sphere>
      <Sphere ref={coreRef} args={[1, 48, 48]}>
        <MeshDistortMaterial color={color} emissive={color} emissiveIntensity={magnitud > 7 ? 3 : 1.5} roughness={0.02} metalness={0.98} distort={0.12 + magnitud * 0.03} speed={2 + magnitud * 0.4} transparent opacity={0.92} />
      </Sphere>
    </group>
  );
}

// ── SHOCKWAVE RINGS ──
function Shockwave({ magnitud, delay, color }: { magnitud: number; delay: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.getElapsedTime() * (0.2 + magnitud * 0.04) + delay) % 6;
    ref.current.scale.set(0.5 + t * 3, 0.5 + t * 3, 0.5 + t * 3);
    (ref.current.material as any).opacity = Math.max(0, 0.5 - t * 0.085);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
      <ringGeometry args={[0.8, 1, 128]} />
      <meshStandardMaterial color={color} transparent opacity={0.4} emissive={color} emissiveIntensity={1.5} side={THREE.DoubleSide} />
    </mesh>
  );
}

// ── DEBRIS PARTICLES (fly off buildings at high mag) ──
function DebrisSystem({ magnitud }: { magnitud: number }) {
  const count = magnitud > 6 ? Math.floor((magnitud - 6) * 25) : 0;
  const particles = useMemo(() => Array.from({ length: Math.min(count, 80) }, (_, i) => ({
    startX: (Math.random() - 0.5) * 20,
    startZ: (Math.random() - 0.5) * 15,
    speed: 0.5 + Math.random() * 2,
    phase: Math.random() * Math.PI * 2,
    maxH: 1 + Math.random() * 4,
    size: 0.03 + Math.random() * 0.06,
  })), [count]);

  return (
    <group>
      {particles.map((p, i) => <DebrisParticle key={i} {...p} magnitud={magnitud} />)}
    </group>
  );
}

function DebrisParticle({ startX, startZ, speed, phase, maxH, size, magnitud }: any) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = (state.clock.getElapsedTime() * speed + phase) % 4;
    ref.current.position.x = startX + Math.sin(t * 3) * 0.5;
    ref.current.position.y = t * maxH * (1 - t / 4);
    ref.current.position.z = startZ + Math.cos(t * 2) * 0.3;
    ref.current.rotation.x += 0.05;
    ref.current.rotation.z += 0.03;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial color="#94a3b8" emissive="#f97316" emissiveIntensity={0.3} />
    </mesh>
  );
}

// ── DUST CLOUDS (low-lying fog at high magnitudes) ──
function DustClouds({ magnitud }: { magnitud: number }) {
  if (magnitud < 6) return null;
  const count = Math.floor((magnitud - 5) * 3);
  return (
    <group>
      {Array.from({ length: count }, (_, i) => <DustCloud key={i} index={i} magnitud={magnitud} />)}
    </group>
  );
}

function DustCloud({ index, magnitud }: { index: number; magnitud: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const seed = Math.sin(index * 73.17) * 0.5 + 0.5;
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.position.x = Math.sin(t * 0.15 + index * 2) * 12;
    ref.current.position.z = Math.cos(t * 0.1 + index * 3) * 8;
    (ref.current.material as any).opacity = 0.03 + Math.sin(t + index) * 0.015;
  });
  return (
    <Sphere ref={ref} args={[1.5 + seed * 2, 16, 16]} position={[0, 0.5 + seed, 0]}>
      <meshStandardMaterial color="#64748b" transparent opacity={0.04} emissive="#94a3b8" emissiveIntensity={0.1} />
    </Sphere>
  );
}

// ── EMERGENCY LIGHTS (flashing red/blue at high mag) ──
function EmergencyLights({ magnitud, isLightMode }: { magnitud: number, isLightMode: boolean }) {
  const ref1 = useRef<THREE.PointLight>(null);
  const ref2 = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!ref1.current || !ref2.current) return;
    if (magnitud < 7) { ref1.current.intensity = 0; ref2.current.intensity = 0; return; }
    const t = state.clock.getElapsedTime();
    const flash = Math.sin(t * 6) > 0 ? 1 : 0;
    ref1.current.intensity = flash * (magnitud - 6) * (isLightMode ? 1.5 : 0.8);
    ref2.current.intensity = (1 - flash) * (magnitud - 6) * (isLightMode ? 1.2 : 0.6);
  });

  return (
    <>
      <pointLight ref={ref1} position={[-12, 3, -5]} color={isLightMode ? "#dc2626" : "#ef4444"} intensity={0} distance={20} />
      <pointLight ref={ref2} position={[12, 3, 5]} color={isLightMode ? "#2563eb" : "#3b82f6"} intensity={0} distance={20} />
    </>
  );
}

// ── SEISMOGRAPH STATIONS ──
function Seismograph({ magnitud, color, position, label, isLightMode }: { magnitud: number; color: string; position: [number, number, number]; label: string; isLightMode: boolean }) {
  const lineRef = useRef<THREE.Group>(null);
  const amp = Math.pow(1.8, magnitud - 5);
  const wave = useMemo(() => {
    const pts = [];
    for (let x = -3.5; x <= 3.5; x += 0.07) { pts.push(new THREE.Vector3(x, Math.sin(x * 10) * Math.exp(-x * x * 0.8) * amp, 0)); }
    return pts;
  }, [amp]);

  useFrame((s) => { if (lineRef.current) lineRef.current.rotation.y = Math.sin(s.clock.getElapsedTime() * 0.3) * 0.04; });

  return (
    <group position={position}>
      <Box args={[8, 0.1, 3]} position={[0, -0.05, 0]}><meshStandardMaterial color={isLightMode ? "#e2e8f0" : "#060d1b"} metalness={isLightMode ? 0.3 : 0.95} roughness={0.05} /></Box>
      <Box args={[8.02, 0.008, 3.02]} position={[0, 0.01, 0]}><meshStandardMaterial color={color} transparent opacity={isLightMode ? 0.6 : 0.3} emissive={color} emissiveIntensity={isLightMode ? 3 : 2} /></Box>
      <group ref={lineRef} position={[0, 0.8, 0]}>
        <Line points={wave} color={color} lineWidth={3} />
        {magnitud > 5 && <group position={[0, 0, 0.35]}><Line points={wave.map(p => new THREE.Vector3(p.x, p.y * 0.4, 0))} color={color} lineWidth={1} transparent opacity={0.08} /></group>}
      </group>
      <Html position={[0, -1.2, 0]} center>
        <div className={`text-center backdrop-blur-xl p-2 rounded-lg border min-w-[80px] ${isLightMode ? 'bg-white/90 border-slate-300' : 'bg-black/80 border-white/5'}`}>
          <div className="text-[6px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
          <div className={`text-sm font-black font-mono ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{magnitud.toFixed(1)} <span className="text-[7px] text-slate-500">Mw</span></div>
        </div>
      </Html>
    </group>
  );
}

// ── MAIN SCENE ──
function Scene({ magnitudActual, magnitudBase, isLightMode }: Props) {
  const deltaM = magnitudActual - magnitudBase;
  const energyFactor = Math.pow(10, 1.5 * deltaM);
  const coreColor = magnitudActual > 8 ? (isLightMode ? "#be123c" : "#f43f5e") : magnitudActual > 6 ? (isLightMode ? "#c2410c" : "#fb923c") : (isLightMode ? "#ca8a04" : "#facc15");
  const rings = Math.min(Math.floor(magnitudActual / 1.5), 7);

  // Dynamic camera FOV based on magnitude
  const { camera } = useThree();
  useFrame(() => {
    const targetFov = 30 + (magnitudActual > 7 ? (magnitudActual - 7) * 3 : 0);
    (camera as THREE.PerspectiveCamera).fov += (targetFov - (camera as THREE.PerspectiveCamera).fov) * 0.02;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  });

  return (
    <>
      {!isLightMode && <Stars radius={200} depth={100} count={6000} factor={3} saturation={0} fade speed={0.5} />}
      <ambientLight intensity={magnitudActual > 7 ? 0.3 : (isLightMode ? 1.0 : 0.6)} />
      <directionalLight position={[10, 20, 5]} intensity={isLightMode ? 2.0 : 1.2} color="#ffffff" castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[0, 8, 0]} color={coreColor} intensity={magnitudActual > 7 ? 4 : 1.5} distance={50} decay={2} />
      {/* Fill light to illuminate building faces */}
      <pointLight position={[-15, 10, 15]} color={isLightMode ? "#ffffff" : "#a5b4fc"} intensity={isLightMode ? 1.5 : 0.8} distance={60} />

      <GroundPlane magnitud={magnitudActual} isLightMode={isLightMode} />
      <GroundCrack magnitud={magnitudActual} isLightMode={isLightMode} />
      <CityGrid magnitud={magnitudActual} />
      <Epicenter magnitud={magnitudActual} isLightMode={isLightMode} />
      <DebrisSystem magnitud={magnitudActual} />
      <DustClouds magnitud={magnitudActual} />
      <EmergencyLights magnitud={magnitudActual} isLightMode={isLightMode} />

      {Array.from({ length: rings }, (_, i) => (
        <Shockwave key={i} magnitud={magnitudActual} delay={i * 0.9} color={coreColor} />
      ))}

      <Seismograph magnitud={magnitudBase} color={isLightMode ? "#0284c7" : "#22d3ee"} position={[-10, 0, 8]} label="Estación Ref." isLightMode={isLightMode} />
      <Seismograph magnitud={magnitudActual} color={magnitudActual > 7 ? (isLightMode ? "#be123c" : "#f43f5e") : (isLightMode ? "#c2410c" : "#fb923c")} position={[10, 0, 8]} label="Estación Exp." isLightMode={isLightMode} />

      {/* Energy HUD */}
      <Html position={[0, 9, 0]} center>
        <div className={`backdrop-blur-2xl border px-6 py-4 rounded-2xl text-center shadow-2xl transition-colors ${isLightMode ? 'bg-white/90 border-slate-200' : 'bg-black/90 border-white/10'}`}>
          <div className="text-[7px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Diferencial Energético</div>
          <div className={`text-3xl font-black italic tracking-tighter font-mono ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
            {energyFactor > 1e6 ? (energyFactor/1e6).toFixed(1) + 'M' : energyFactor > 1000 ? (energyFactor/1000).toFixed(1) + 'k' : Math.round(energyFactor).toLocaleString()}×
          </div>
          <div className="mt-2 flex gap-3 justify-center">
            <div><span className="text-[6px] font-black text-cyan-500 uppercase block">Amplitud</span><span className={`text-[9px] font-black font-mono ${isLightMode ? 'text-slate-700' : 'text-white'}`}>×{Math.pow(10, deltaM).toFixed(deltaM < 1 ? 1 : 0)}</span></div>
            <div className={`w-px h-4 ${isLightMode ? 'bg-slate-300' : 'bg-white/10'}`} />
            <div><span className="text-[6px] font-black text-rose-500 uppercase block">Energía</span><span className={`text-[9px] font-black font-mono ${isLightMode ? 'text-slate-700' : 'text-white'}`}>×{Math.pow(31.6, deltaM).toFixed(deltaM < 1 ? 1 : 0)}</span></div>
          </div>
        </div>
      </Html>
    </>
  );
}

export default function Richter3DScene(props: Props) {
  return (
    <div className={`w-full h-full absolute inset-0 transition-colors duration-1000 ${props.isLightMode ? 'bg-[#f8fafc]' : 'bg-[#020617]'}`}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.6 }}>
        <PerspectiveCamera makeDefault position={[0, 12, 28]} fov={30} />
        {/* <fog attach="fog" args={[props.isLightMode ? '#f8fafc' : '#020617', 25, 55]} /> */}
        <Scene {...props} />
        <OrbitControls enablePan={true} maxPolarAngle={Math.PI / 2.2} minPolarAngle={Math.PI / 8} minDistance={5} maxDistance={100} />
      </Canvas>
    </div>
  );
}
