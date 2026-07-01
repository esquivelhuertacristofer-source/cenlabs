"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float,
  Stars,
  Sparkles,
  ContactShadows,
  PerspectiveCamera,
  OrbitControls,
  MeshDistortMaterial,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';

// ── Espectro y eficiencia (consistente con tickFotosintesis del store) ──────────
const SPECTRUM: Record<string, { hex: string; eff: number }> = {
  blanco:   { hex: '#ffffff', eff: 0.7 },
  rojo:     { hex: '#ef4444', eff: 1.0 },
  azul:     { hex: '#3b82f6', eff: 1.2 },
  verde:    { hex: '#22c55e', eff: 0.1 },
  amarillo: { hex: '#eab308', eff: 0.4 },
};

const SUN_Y = 17;          // altura de la fuente de luz
const CANOPY_Y = 3.4;      // "tapa" del cloroplasto donde rebota la luz verde
const GRANA_Y = -0.4;      // plano del estroma donde se absorbe la luz útil

// ── Fotón: cae desde el sol. Si es verde, REBOTA (clorofila refleja el verde);
//    en cualquier otro color, se absorbe en los grana y dispara la fase clara. ──
function Photon({ hex, isGreen, speed, phase, seedX, seedZ, active }: {
  hex: string; isGreen: boolean; speed: number; phase: number; seedX: number; seedZ: number; active: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    if (!active) { m.visible = false; return; }
    m.visible = true;

    const t = ((state.clock.elapsedTime * speed) + phase) % 1; // 0..1 ciclo
    const mat = m.material as THREE.MeshBasicMaterial;

    if (isGreen) {
      // Desciende hasta la membrana y rebota hacia arriba, desvaneciéndose.
      if (t < 0.5) {
        const k = t / 0.5;
        m.position.y = THREE.MathUtils.lerp(SUN_Y, CANOPY_Y, k);
        m.position.x = seedX * (1 - k * 0.25);
        m.position.z = seedZ * (1 - k * 0.25);
        mat.opacity = 1;
      } else {
        const k = (t - 0.5) / 0.5;
        m.position.y = THREE.MathUtils.lerp(CANOPY_Y, CANOPY_Y + 9, k);
        m.position.x = seedX * (0.75 + k * 0.6);   // se dispersa al reflejarse
        m.position.z = seedZ * (0.75 + k * 0.6);
        mat.opacity = 1 - k;
      }
      m.scale.setScalar(0.18);
    } else {
      // Absorción: penetra hasta los grana y se apaga (energía capturada).
      m.position.y = THREE.MathUtils.lerp(SUN_Y, GRANA_Y, t);
      m.position.x = seedX * (1 - t * 0.55);        // converge hacia el centro
      m.position.z = seedZ * (1 - t * 0.55);
      const fade = t < 0.82 ? 1 : 1 - (t - 0.82) / 0.18;
      mat.opacity = fade;
      m.scale.setScalar(0.16 + Math.sin(t * Math.PI) * 0.06);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={hex} transparent toneMapped={false} />
    </mesh>
  );
}

function PhotonField({ hex, isGreen, irradiance, active }: {
  hex: string; isGreen: boolean; irradiance: number; active: boolean;
}) {
  const count = Math.round(18 + irradiance * 62); // 18..80 según irradiancia
  const seeds = useMemo(() =>
    Array.from({ length: 80 }).map(() => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 6.5;
      return {
        seedX: Math.cos(a) * r,
        seedZ: Math.sin(a) * r,
        speed: 0.22 + Math.random() * 0.3,
        phase: Math.random(),
      };
    }), []);

  return (
    <group>
      {seeds.slice(0, count).map((s, i) => (
        <Photon key={i} hex={hex} isGreen={isGreen} active={active}
          speed={s.speed} phase={s.phase} seedX={s.seedX} seedZ={s.seedZ} />
      ))}
    </group>
  );
}

// ── Pila de tilacoides (un granum). Brillo y latido según productividad. ────────
function Granum({ position, productivity, active }: {
  position: [number, number, number]; productivity: number; active: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  const discs = [0, 0.34, 0.68, 1.02, 1.36];

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const pulse = active ? 1 + Math.sin(t * 3 + position[0]) * 0.04 * productivity : 1;
    ref.current.scale.y = pulse;
  });

  const glow = active ? 0.4 + productivity * 4.5 : 0.08;

  return (
    <group ref={ref} position={position}>
      {discs.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[1.15, 1.15, 0.22, 40]} />
          <meshStandardMaterial
            color={active ? '#34d399' : '#0f3d2e'}
            emissive="#10b981"
            emissiveIntensity={glow}
            roughness={0.25}
            metalness={0.1}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Chispa de la cadena transportadora de electrones, saltando entre grana. ─────
function ElectronSpark({ a, b, phase, productivity }: {
  a: [number, number, number]; b: [number, number, number]; phase: number; productivity: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const va = useMemo(() => new THREE.Vector3(...a), [a]);
  const vb = useMemo(() => new THREE.Vector3(...b), [b]);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = ((state.clock.elapsedTime * (0.5 + productivity)) + phase) % 1;
    m.position.lerpVectors(va, vb, t);
    m.position.y += Math.sin(t * Math.PI) * 1.2; // arco
    (m.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI);
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.13, 8, 8]} />
      <meshBasicMaterial color="#fde047" transparent toneMapped={false} />
    </mesh>
  );
}

// ── Burbuja de O₂: emerge de los grana y asciende (solo si hay producción). ─────
function OxygenBubble({ delay, productivity }: { delay: number; productivity: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => ({ x: Math.random() * 5 - 2.5, z: Math.random() * 5 - 2.5 }), []);

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const span = 5;
    const t = ((state.clock.elapsedTime + delay) % span) / span; // 0..1
    m.position.y = GRANA_Y + t * 9;
    m.position.x = seed.x + Math.sin(t * 5) * 0.4;
    m.position.z = seed.z + Math.cos(t * 5) * 0.4;
    const s = (0.12 + t * 0.34) * (0.4 + productivity);
    m.scale.setScalar(s);
    (m.material as THREE.MeshPhysicalMaterial).opacity = (1 - t) * 0.7;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshPhysicalMaterial
        color="#a7f3d0" transparent opacity={0.6}
        roughness={0} metalness={0} transmission={0.9} thickness={0.5}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Molécula de glucosa (C₆H₁₂O₆): anillo hexagonal de carbonos, el producto. ──
function Glucose({ delay, productivity }: { delay: number; productivity: number }) {
  const ref = useRef<THREE.Group>(null);
  const seed = useMemo(() => ({ x: Math.random() * 4 - 2, z: Math.random() * 4 - 2 }), []);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const span = 7;
    const t = (((state.clock.elapsedTime + delay) % span) / span);
    g.position.y = GRANA_Y + 0.5 + t * 7;
    g.position.x = seed.x;
    g.position.z = seed.z;
    g.rotation.y = state.clock.elapsedTime * 0.8;
    g.rotation.x = state.clock.elapsedTime * 0.5;
    const vis = t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15;
    g.scale.setScalar((0.5 + productivity * 0.5) * vis);
  });

  return (
    <group ref={ref}>
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.45, 0, Math.sin(a) * 0.45]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.4} roughness={0.3} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

// ── El cloroplasto completo (envoltura lente + estroma + grana + cadenas). ──────
function Chloroplast({ hex, isGreen, irradiance, productivity, active }: {
  hex: string; isGreen: boolean; irradiance: number; productivity: number; active: boolean;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.08;
  });

  // Disposición de los grana sobre el estroma.
  const grana: [number, number, number][] = [
    [3, GRANA_Y, 0], [-3, GRANA_Y, 1.6], [0.5, GRANA_Y, -3.4],
    [-1.6, GRANA_Y, -1.4], [2, GRANA_Y, 3.2],
  ];

  return (
    <group ref={ref}>
      {/* Envoltura (doble membrana) — forma de lente biconvexa */}
      <mesh scale={[1, 0.5, 1]}>
        <sphereGeometry args={[6.6, 64, 64]} />
        <MeshDistortMaterial
          color={'#064e3b'}
          transparent opacity={0.22}
          roughness={0.1} metalness={0.2}
          transmission={0.6} thickness={2}
          distort={0.12} speed={1.2}
          emissive={'#022c22'} emissiveIntensity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Estroma luminoso interior */}
      <mesh scale={[1, 0.5, 1]}>
        <sphereGeometry args={[6.0, 32, 32]} />
        <meshBasicMaterial
          color={active ? '#10b981' : '#053b2c'}
          transparent opacity={active ? 0.06 + productivity * 0.12 : 0.04}
          toneMapped={false}
        />
      </mesh>

      {grana.map((p, i) => (
        <Granum key={i} position={p} productivity={productivity} active={active} />
      ))}

      {/* Cadena transportadora de electrones entre grana adyacentes */}
      {active && productivity > 0.04 && grana.map((p, i) => {
        const q = grana[(i + 1) % grana.length];
        return (
          <ElectronSpark key={`e${i}`}
            a={[p[0], p[1] + 0.7, p[2]]} b={[q[0], q[1] + 0.7, q[2]]}
            phase={i / grana.length} productivity={productivity} />
        );
      })}

      {/* Reflejo de luz verde rasante sobre la membrana (la "trampa verde") */}
      {isGreen && (
        <mesh position={[0, CANOPY_Y - 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.5, 6.4, 48]} />
          <meshBasicMaterial color={hex} transparent opacity={0.18 + irradiance * 0.25} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

// ── Fuente de luz: sol cuyo tamaño/brillo aparente sigue el inverso del cuadrado.
function SpectrumSun({ hex, irradiance }: { hex: string; irradiance: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const r = 0.7 + irradiance * 2.2; // grande de cerca, pequeño de lejos

  useFrame((state) => {
    const p = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.03;
    if (ref.current) ref.current.scale.setScalar(p);
    if (haloRef.current) haloRef.current.scale.setScalar(p * 1.6);
  });

  return (
    <group position={[0, SUN_Y, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[r, 32, 32]} />
        <meshBasicMaterial color={hex} toneMapped={false} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[r, 32, 32]} />
        <meshBasicMaterial color={hex} transparent opacity={0.15} toneMapped={false} />
      </mesh>
      <pointLight color={hex} intensity={20 + irradiance * 120} distance={60} decay={1.5} />
    </group>
  );
}

// ── Haz de luz volumétrico (god-ray) del sol al cloroplasto. ────────────────────
function LightBeam({ hex, irradiance }: { hex: string; irradiance: number }) {
  const h = SUN_Y - CANOPY_Y;
  return (
    <mesh position={[0, (SUN_Y + CANOPY_Y) / 2, 0]}>
      {/* cono: vértice arriba (sol), base abajo (cloroplasto) */}
      <coneGeometry args={[7, h, 48, 1, true]} />
      <meshBasicMaterial
        color={hex} transparent opacity={0.04 + irradiance * 0.1}
        side={THREE.DoubleSide} depthWrite={false}
        blending={THREE.AdditiveBlending} toneMapped={false}
      />
    </mesh>
  );
}

export default function Fotosintesis3DScene({ simulando, colorLuz, intensidad }: {
  simulando: boolean; colorLuz: string; intensidad: number;
}) {
  const spec = SPECTRUM[colorLuz] || SPECTRUM.blanco;
  const hex = spec.hex;
  const isGreen = colorLuz === 'verde';

  // intensidad = 300/d² (≈3 lejos … 300 cerca) → irradiancia normalizada 0.1..1
  const irradiance = THREE.MathUtils.clamp(Math.sqrt(intensidad / 300), 0.1, 1);
  // Productividad real = irradiancia × eficiencia espectral (0..~1)
  const productivity = THREE.MathUtils.clamp(irradiance * (spec.eff / 1.2), 0, 1);
  const active = simulando;

  const o2Count = active ? Math.round(productivity * 16) : 0;     // 0 con luz verde
  const glucoseCount = active ? Math.round(productivity * 4) : 0;

  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: [0, 8, 24], fov: 42 }}>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 28, 60]} />

      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[0, 8, 24]} fov={42} />

        <ambientLight intensity={0.35 + irradiance * 0.25} color={hex} />
        <hemisphereLight args={['#0b2e22', '#020617', 0.5]} />
        <directionalLight position={[6, 14, 8]} intensity={0.6 + irradiance * 1.2} color={hex} castShadow />

        <SpectrumSun hex={hex} irradiance={irradiance} />
        {active && <LightBeam hex={hex} irradiance={irradiance} />}

        <Float speed={1.1} rotationIntensity={0.15} floatIntensity={0.4}>
          <Chloroplast hex={hex} isGreen={isGreen} irradiance={irradiance} productivity={productivity} active={active} />
        </Float>

        {active && <PhotonField hex={hex} isGreen={isGreen} irradiance={irradiance} active={active} />}

        {Array.from({ length: o2Count }).map((_, i) => (
          <OxygenBubble key={`o2-${i}`} delay={i * 0.35} productivity={productivity} />
        ))}
        {Array.from({ length: glucoseCount }).map((_, i) => (
          <Glucose key={`glu-${i}`} delay={i * 1.3 + 0.5} productivity={productivity} />
        ))}

        <ContactShadows position={[0, -3.6, 0]} opacity={0.45} scale={36} blur={2.4} far={10} color="#022c22" />
        <Stars radius={120} depth={50} count={4000} factor={4} saturation={0} fade speed={0.6} />
        <Sparkles count={active ? 140 : 50} scale={26} size={active ? 3 : 1.4} speed={0.4} color={hex} opacity={0.5} />

        <OrbitControls
          enableZoom enablePan={false}
          minDistance={14} maxDistance={40}
          maxPolarAngle={Math.PI / 2.05} minPolarAngle={Math.PI / 5}
          autoRotate={!active} autoRotateSpeed={0.4}
        />

        <EffectComposer multisampling={8}>
          <Bloom luminanceThreshold={0.25} mipmapBlur intensity={active ? 1.9 : 1.1} radius={0.6} />
          <ChromaticAberration offset={new THREE.Vector2(0.0008, 0.0008)} />
          <Vignette offset={0.18} darkness={1.0} />
          <Noise opacity={0.035} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
