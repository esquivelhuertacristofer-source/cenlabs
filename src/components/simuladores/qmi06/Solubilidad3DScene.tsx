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
   Solubilidad3DScene — Vaso de precipitados 3D con soluto que se disuelve o
   cristaliza según el estado REAL del Piloto (QMI-06).

   Química real (consistente con quimicaSlice):
     límite de solubilidad  S = a · e^(b·T)   (g / 100 mL)
     sal en disolución      = min(salAgregada, S)      → partículas dispersas
     sal precipitada        = max(0, salAgregada − S)  → red cristalina geométrica
     saturación             = salAgregada / S

   Deriva TODO de props { temp, salAgregada, limite, salSolida, saturationRatio,
   color, ubicacion }. Frío azul → caliente ámbar (glow térmico).
──────────────────────────────────────────────────────────────────────────── */

const COOL = new THREE.Color('#38bdf8'); // frío
const WARM = new THREE.Color('#ff9e2c'); // caliente

// Geometría del vaso
const GLASS_R = 2.6;   // radio interior
const WATER_TOP = 3.2; // superficie del líquido (y)
const WATER_BOT = -3.0; // fondo del líquido (y)

type SceneProps = {
  temp: number;
  salAgregada: number;
  limite: number;
  salSolida: number;
  saturationRatio: number;
  color: string;
  ubicacion: 'mesa' | 'parrilla' | 'hielo';
};

// Mezcla térmica 0 (frío) .. 1 (caliente) a partir de la temperatura real (0–100 °C aprox.)
function thermalT(temp: number) {
  return THREE.MathUtils.clamp(temp / 100, 0, 1);
}
function thermalColor(temp: number) {
  return new THREE.Color().lerpColors(COOL, WARM, thermalT(temp));
}

/* ── Partículas de soluto DISUELTO: remolino difuso en el agua ─────────────── */
function DissolvedSwirl({ dissolvedFrac, temp, color }: { dissolvedFrac: number; temp: number; color: string }) {
  const COUNT = 700;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const matRef = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const seeds = useMemo(() => {
    // cada partícula: radio, ángulo base, altura, velocidad angular
    const s = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      s[i * 4] = 0.3 + Math.random() * (GLASS_R - 0.5);            // radio
      s[i * 4 + 1] = Math.random() * Math.PI * 2;                   // ángulo
      s[i * 4 + 2] = WATER_BOT + 0.3 + Math.random() * (WATER_TOP - WATER_BOT - 0.6); // y
      s[i * 4 + 3] = 0.3 + Math.random() * 0.9;                     // vel angular
    }
    return s;
  }, []);

  const baseColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // más temperatura → remolino más agitado
    const agitation = 0.4 + thermalT(temp) * 1.6;
    // cuántas partículas están "activas" (disueltas)
    const active = Math.floor(COUNT * THREE.MathUtils.clamp(dissolvedFrac, 0, 1));
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      if (i >= active) {
        // partícula inactiva → escóndela lejos
        positions[ix + 1] = -999;
        continue;
      }
      const r = seeds[i * 4];
      const a0 = seeds[i * 4 + 1];
      const y0 = seeds[i * 4 + 2];
      const w = seeds[i * 4 + 3];
      const ang = a0 + t * w * agitation;
      const wobble = Math.sin(t * (1 + w) + a0) * 0.18 * agitation;
      positions[ix] = Math.cos(ang) * r;
      positions[ix + 1] = y0 + Math.sin(t * w + a0) * 0.35 * agitation;
      positions[ix + 2] = Math.sin(ang) * r + wobble;
    }
    if (geomRef.current) geomRef.current.attributes.position.needsUpdate = true;
    if (matRef.current) {
      // el color del soluto se calienta ligeramente hacia ámbar
      matRef.current.color.copy(baseColor).lerp(WARM, thermalT(temp) * 0.35);
    }
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        ref={matRef}
        size={0.09}
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Un cristal geométrico (octaedro con caras brillantes) ─────────────────── */
function Crystal({ index, growth, color }: { index: number; growth: number; color: string }) {
  const ref = useRef<THREE.Group>(null);

  // posición apilada en el fondo formando una "red" en espiral áurea
  const { pos, rot, scale } = useMemo(() => {
    const golden = 137.5 * (Math.PI / 180);
    const a = index * golden;
    const ring = Math.sqrt(index) * 0.42;
    const r = Math.min(ring, GLASS_R - 0.35);
    const layer = Math.floor(index / 22);
    return {
      pos: new THREE.Vector3(
        Math.cos(a) * r,
        WATER_BOT + 0.35 + layer * 0.5,
        Math.sin(a) * r,
      ),
      rot: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      scale: 0.28 + (index % 5) * 0.05,
    };
  }, [index]);

  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    // crecen desde 0 con un pequeño rebote y giran lentamente
    const target = growth * scale;
    g.scale.x += (target - g.scale.x) * 0.08;
    g.scale.y = g.scale.z = g.scale.x;
    g.rotation.y += 0.006;
    g.position.y = pos.y + Math.sin(t * 1.2 + index) * 0.02;
  });

  return (
    <group ref={ref} position={pos} rotation={rot} scale={0.001}>
      <mesh>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.4}
          roughness={0.1}
          metalness={0.6}
          flatShading
        />
      </mesh>
      {/* aristas brillantes */}
      <mesh scale={1.02}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

/* ── Red cristalina precipitada en el fondo ─────────────────────────────────── */
function CrystalBed({ count, growth, color }: { count: number; growth: number; color: string }) {
  const crystals = useMemo(() => Array.from({ length: count }, (_, i) => i), [count]);
  if (count === 0) return null;
  return (
    <group>
      {crystals.map((i) => (
        <Crystal key={i} index={i} growth={growth} color={color} />
      ))}
    </group>
  );
}

/* ── Vaso de precipitados de vidrio translúcido con agua ────────────────────── */
function Beaker({ temp, saturationRatio }: { temp: number; saturationRatio: number }) {
  const waterRef = useRef<THREE.Mesh>(null);
  const waterMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const tt = thermalT(temp);
    if (waterRef.current) {
      // ligera ondulación de la superficie del agua
      waterRef.current.position.y = (WATER_TOP + WATER_BOT) / 2 + Math.sin(t * 1.5) * 0.02;
    }
    if (waterMatRef.current) {
      const c = thermalColor(temp);
      waterMatRef.current.color.copy(c);
      waterMatRef.current.emissive.copy(c);
      // el agua saturada brilla más
      waterMatRef.current.emissiveIntensity = 0.12 + saturationRatio * 0.25 + Math.sin(t * 2) * 0.02;
    }
    if (glowRef.current) {
      glowRef.current.color.copy(thermalColor(temp));
      glowRef.current.intensity = 6 + tt * 14 + Math.sin(t * 3) * (tt * 3);
    }
  });

  const waterH = WATER_TOP - WATER_BOT;
  const waterMidY = (WATER_TOP + WATER_BOT) / 2;

  return (
    <group>
      {/* Cuerpo de vidrio */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[GLASS_R + 0.15, GLASS_R + 0.15, WATER_TOP - WATER_BOT + 1.4, 64, 1, true]} />
        <meshPhysicalMaterial
          color="#dbeafe"
          transparent
          opacity={0.12}
          roughness={0.05}
          metalness={0}
          transmission={0.9}
          thickness={0.5}
          ior={1.45}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Fondo del vaso */}
      <mesh position={[0, WATER_BOT - 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[GLASS_R + 0.15, 64]} />
        <meshPhysicalMaterial
          color="#bfdbfe"
          transparent
          opacity={0.25}
          roughness={0.1}
          transmission={0.7}
          thickness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Reborde superior */}
      <mesh position={[0, WATER_TOP + 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[GLASS_R + 0.15, 0.06, 16, 64]} />
        <meshStandardMaterial color="#e0f2fe" emissive="#93c5fd" emissiveIntensity={0.6} roughness={0.2} metalness={0.3} />
      </mesh>

      {/* Agua */}
      <mesh ref={waterRef} position={[0, waterMidY, 0]}>
        <cylinderGeometry args={[GLASS_R, GLASS_R, waterH, 64]} />
        <meshStandardMaterial
          ref={waterMatRef}
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={0.15}
          transparent
          opacity={0.28}
          roughness={0.15}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>

      {/* Superficie brillante del agua */}
      <mesh position={[0, WATER_TOP, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[GLASS_R, 64]} />
        <meshBasicMaterial color={thermalColor(temp)} transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Luz térmica desde dentro del vaso */}
      <pointLight ref={glowRef} position={[0, waterMidY, 0]} distance={16} />
    </group>
  );
}

/* ── Vapor ascendente cuando está caliente en la parrilla ───────────────────── */
function Steam({ active }: { active: boolean }) {
  const COUNT = 40;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const seeds = useMemo(() => {
    const s = new Float32Array(COUNT * 2);
    for (let i = 0; i < COUNT; i++) {
      s[i * 2] = Math.random();
      s[i * 2 + 1] = (Math.random() * 2 - 1) * (GLASS_R - 0.6);
    }
    return s;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      if (!active) { positions[ix + 1] = -999; continue; }
      const ph = seeds[i * 2];
      const off = seeds[i * 2 + 1];
      const rise = ((t * 0.4 + ph) % 1);
      positions[ix] = off * 0.6 + Math.sin(t * 1.3 + i) * 0.4;
      positions[ix + 1] = WATER_TOP + rise * 5;
      positions[ix + 2] = Math.cos(t + i) * 0.6;
    }
    if (geomRef.current) geomRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial size={0.55} color="#ffffff" transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ temp, salAgregada, salSolida, saturationRatio, color, ubicacion }: SceneProps) {
  // fracción de soluto disuelto (0..1): cuánto de lo agregado permanece en disolución
  const dissolved = Math.max(0, salAgregada - salSolida);
  const dissolvedFrac = THREE.MathUtils.clamp(dissolved / 60, 0, 1);

  // número de cristales precipitados y su crecimiento
  const numCristales = Math.min(120, Math.floor(salSolida * 1.1));
  const growth = THREE.MathUtils.clamp(salSolida / 20, 0.4, 1.4);

  const isCaliente = ubicacion === 'parrilla' && temp > 70;
  const label =
    salSolida > 0.5 ? 'SOBRESATURADA · CRISTALIZANDO'
    : saturationRatio > 0.9 ? 'SATURADA'
    : 'INSATURADA';
  const labelColor = salSolida > 0.5 ? '#fb923c' : saturationRatio > 0.9 ? '#facc15' : '#38bdf8';

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3.5, 13]} fov={45} />
      <color attach="background" args={['#03040a']} />
      <fog attach="fog" args={['#03040a', 16, 42]} />

      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.35} groundColor="#020617" color="#bae6fd" />
      <directionalLight position={[6, 10, 6]} intensity={0.6} />

      <group position={[0, -0.4, 0]}>
        <Beaker temp={temp} saturationRatio={saturationRatio} />
        <DissolvedSwirl dissolvedFrac={dissolvedFrac} temp={temp} color={color} />
        <CrystalBed count={numCristales} growth={growth} color={color} />
        <Steam active={isCaliente} />

        {/* etiqueta flotante de estado de saturación */}
        <Html position={[0, WATER_TOP + 1.6, 0]} center distanceFactor={13}>
          <div
            className="px-4 py-1.5 rounded-full font-black text-[11px] uppercase tracking-widest select-none pointer-events-none whitespace-nowrap"
            style={{
              color: '#fff',
              background: `${labelColor}22`,
              border: `1px solid ${labelColor}`,
              boxShadow: `0 0 24px ${labelColor}66`,
              backdropFilter: 'blur(6px)',
            }}
          >
            {label}
          </div>
        </Html>
      </group>

      {/* base / pedestal reflectante */}
      <mesh position={[0, WATER_BOT - 0.8 - 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[5.5, 64]} />
        <meshStandardMaterial color="#0b1120" roughness={0.4} metalness={0.6} />
      </mesh>

      <Sparkles count={70} scale={[14, 10, 14]} size={2} speed={0.25} color="#bae6fd" opacity={0.4} />
      <Stars radius={80} depth={40} count={2500} factor={4} saturation={0} fade speed={0.6} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={8}
        maxDistance={24}
        autoRotate
        autoRotateSpeed={0.5}
        target={[0, 0, 0]}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.9}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.18} mipmapBlur intensity={1.4} radius={0.72} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function Solubilidad3DScene(props: SceneProps) {
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
