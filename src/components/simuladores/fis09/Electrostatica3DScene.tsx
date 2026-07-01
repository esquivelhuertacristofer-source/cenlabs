"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Sparkles,
  Html,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────────────────
   Electrostatica3DScene — Campo eléctrico volumétrico con líneas de campo vivas.
   Física real: E(r) = Σ qᵢ (r−rᵢ)/|r−rᵢ|³  ·  potencial V = Σ qᵢ/|r−rᵢ|
   Las partículas fluyen a lo largo de +E (carga de prueba positiva): salen de las
   cargas + y son absorbidas por las − → dibujan las líneas de campo en tiempo real.
   Props idénticos a los datos del store: { q1, q2, distancia, isAtraccion }.
──────────────────────────────────────────────────────────────────────────── */

const WARM = new THREE.Color('#ff5a36'); // carga / potencial positivo
const COOL = new THREE.Color('#38bdf8'); // carga / potencial negativo
const BOUNDS = 7.5;

// Mapea la distancia del slider (0.1–2.5) a una separación 3D agradable
function sepFromDistancia(d: number) {
  return THREE.MathUtils.mapLinear(THREE.MathUtils.clamp(d, 0.1, 2.5), 0.1, 2.5, 2.4, 9.5);
}
function chargeRadius(q: number) {
  return 0.42 + Math.min(0.4, Math.abs(q) * 0.06);
}

type Charge = { pos: THREE.Vector3; q: number };

/* ── Campo de partículas que fluyen por las líneas de campo ─────────────────── */
function FieldFlow({ charges }: { charges: Charge[] }) {
  const COUNT = 900;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const colors = useMemo(() => new Float32Array(COUNT * 3), []);

  const posCharges = useMemo(() => charges.filter((c) => c.q > 0), [charges]);

  // Reubica una partícula: nace en la superficie de una carga + (emisor),
  // o en la cáscara exterior si todas son negativas (campo entrante).
  const reseed = (arr: Float32Array, i: number) => {
    const ix = i * 3;
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ).normalize();
    if (posCharges.length > 0) {
      const c = posCharges[(Math.random() * posCharges.length) | 0];
      const r = chargeRadius(c.q) + 0.15 + Math.random() * 0.3;
      arr[ix] = c.pos.x + dir.x * r;
      arr[ix + 1] = c.pos.y + dir.y * r;
      arr[ix + 2] = c.pos.z + dir.z * r;
    } else {
      arr[ix] = dir.x * BOUNDS;
      arr[ix + 1] = dir.y * BOUNDS;
      arr[ix + 2] = dir.z * BOUNDS;
    }
  };

  useMemo(() => {
    for (let i = 0; i < COUNT; i++) reseed(positions, i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, posCharges]);

  const p = useMemo(() => new THREE.Vector3(), []);
  const E = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      p.set(positions[ix], positions[ix + 1], positions[ix + 2]);
      E.set(0, 0, 0);
      let V = 0;
      let absorbed = false;
      for (const c of charges) {
        const dx = p.x - c.pos.x;
        const dy = p.y - c.pos.y;
        const dz = p.z - c.pos.z;
        const r2 = dx * dx + dy * dy + dz * dz;
        const r = Math.sqrt(r2) + 1e-3;
        if (r < chargeRadius(c.q) + 0.12) absorbed = true;
        const inv3 = c.q / (r2 * r + 1e-3);
        E.x += dx * inv3;
        E.y += dy * inv3;
        E.z += dz * inv3;
        V += c.q / r;
      }
      const mag = E.length() + 1e-4;
      const speed = THREE.MathUtils.clamp(mag * 0.4, 0.25, 7);
      positions[ix] += (E.x / mag) * speed * dt;
      positions[ix + 1] += (E.y / mag) * speed * dt;
      positions[ix + 2] += (E.z / mag) * speed * dt;

      // Color según el signo del potencial local
      const t = THREE.MathUtils.clamp(V * 2.2 + 0.5, 0, 1);
      colors[ix] = COOL.r + (WARM.r - COOL.r) * t;
      colors[ix + 1] = COOL.g + (WARM.g - COOL.g) * t;
      colors[ix + 2] = COOL.b + (WARM.b - COOL.b) * t;

      if (absorbed || p.length() > BOUNDS * 1.5) reseed(positions, i);
    }
    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true;
      geomRef.current.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.13}
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Orbe de carga ──────────────────────────────────────────────────────────── */
function ChargeOrb({ charge }: { charge: Charge }) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const positive = charge.q > 0;
  const color = positive ? '#ff5a36' : '#38bdf8';
  const R = chargeRadius(charge.q);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 3) * 0.05;
    if (ref.current) ref.current.scale.setScalar(pulse);
    if (glowRef.current) {
      const g = 1.6 + Math.sin(t * 2 + charge.pos.x) * 0.15;
      glowRef.current.scale.setScalar(g);
    }
  });

  return (
    <group position={charge.pos}>
      <mesh ref={ref}>
        <sphereGeometry args={[R, 48, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.4}
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>
      {/* halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[R, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color={color} intensity={Math.abs(charge.q) * 6 + 8} distance={14} />
      {/* signo + / − */}
      <Html center distanceFactor={11}>
        <div
          style={{ color: '#fff' }}
          className="text-3xl font-black select-none pointer-events-none drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]"
        >
          {positive ? '+' : '−'}
        </div>
      </Html>
    </group>
  );
}

/* ── Vector de fuerza sobre una carga (Ley de Coulomb) ──────────────────────── */
function ForceArrow({ from, toward, attract, magnitude }: { from: THREE.Vector3; toward: THREE.Vector3; attract: boolean; magnitude: number }) {
  const len = THREE.MathUtils.clamp(0.6 + Math.log10(magnitude + 1) * 0.9, 0.6, 4);
  const dir = useMemo(() => {
    const d = new THREE.Vector3().subVectors(toward, from).normalize();
    if (!attract) d.negate(); // repulsión: apunta alejándose
    return d;
  }, [from, toward, attract]);

  const quat = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [dir]);

  const start = useMemo(() => {
    const off = dir.clone().multiplyScalar(chargeRadius(1) + 0.35);
    return new THREE.Vector3().addVectors(from, off);
  }, [from, dir]);

  return (
    <group position={start} quaternion={quat}>
      <mesh position={[0, len / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, len, 12]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0, len + 0.18, 0]}>
        <coneGeometry args={[0.16, 0.42, 16]} />
        <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={3} />
      </mesh>
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ q1, q2, distancia, isAtraccion }: { q1: number; q2: number; distancia: number; isAtraccion: boolean }) {
  const sep = sepFromDistancia(distancia);
  const c1: Charge = useMemo(() => ({ pos: new THREE.Vector3(-sep / 2, 0, 0), q: q1 }), [sep, q1]);
  const c2: Charge = useMemo(() => ({ pos: new THREE.Vector3(sep / 2, 0, 0), q: q2 }), [sep, q2]);
  const charges = useMemo(() => [c1, c2], [c1, c2]);
  const F = (89.87 * Math.abs(q1 * q2)) / Math.pow(Math.max(distancia, 0.05), 2);
  const showForce = q1 !== 0 && q2 !== 0;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 16]} fov={45} />
      <color attach="background" args={['#03040a']} />
      <fog attach="fog" args={['#03040a', 18, 40]} />

      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.3} groundColor="#020617" />

      <FieldFlow charges={charges} />
      <ChargeOrb charge={c1} />
      <ChargeOrb charge={c2} />

      {showForce && (
        <>
          <ForceArrow from={c1.pos} toward={c2.pos} attract={isAtraccion} magnitude={F} />
          <ForceArrow from={c2.pos} toward={c1.pos} attract={isAtraccion} magnitude={F} />
        </>
      )}

      {/* eje / regla de separación */}
      <mesh position={[0, -0.001, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, sep, 8]} />
        <meshBasicMaterial color="#334155" transparent opacity={0.5} />
      </mesh>

      <Sparkles count={60} scale={[18, 10, 18]} size={2} speed={0.3} color="#93c5fd" opacity={0.4} />
      <Stars radius={80} depth={40} count={2500} factor={4} saturation={0} fade speed={0.6} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={9}
        maxDistance={28}
        autoRotate={false}
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.5} radius={0.7} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function Electrostatica3DScene({
  q1,
  q2,
  distancia,
  isAtraccion,
}: {
  q1: number;
  q2: number;
  distancia: number;
  isAtraccion: boolean;
}) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene q1={q1} q2={q2} distancia={distancia} isAtraccion={isAtraccion} />
        </Suspense>
      </Canvas>
    </div>
  );
}
