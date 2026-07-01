"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Sparkles,
  Html,
  Float,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────────────────
   SistemaDigestivo3DScene — Tracto digestivo 3D volumétrico y vivo.
   Un bolo alimenticio viaja por una curva boca → esófago → estómago →
   intestino delgado → grueso. En el órgano activo (según la etapa REAL del
   Piloto) el bolo se descompone y libera partículas de nutrientes (monómeros)
   mientras enzimas orbitan actuando. El órgano correspondiente se ilumina.

   Props derivados del store:
     macronutriente : 'almidon' | 'proteina' | 'lipido'
     enzima         : 'amilasa' | 'pepsina' | 'lipasa' | null
     nivelPH        : number (1..14)
     estado         : 'intacto' | 'desnaturalizado' | 'digerido' | 'absorbido'
     progreso       : 0..1  (fracción de absorción / avance del bolo)
     compatible     : boolean (enzima+pH óptimos)
──────────────────────────────────────────────────────────────────────────── */

type Estado = 'intacto' | 'desnaturalizado' | 'digerido' | 'absorbido';

const NUTRIENTE_HEX: Record<string, string> = {
  almidon: '#10b981',  // glucosa (verde)
  proteina: '#8b5cf6', // aminoácido (violeta)
  lipido: '#fbbf24',   // ácido graso (amarillo)
};

// Órganos del tracto: posición (nodo de la curva), radio del glow y etiqueta.
type Organo = {
  key: string;
  label: string;
  pos: THREE.Vector3;
  color: string;
  // Fracción del recorrido [tIni, tFin] donde este órgano está "en escena".
  tIni: number;
  tFin: number;
};

const ORGANOS: Organo[] = [
  { key: 'boca',     label: 'Boca',              pos: new THREE.Vector3(-6.5, 5.2, 0),   color: '#f472b6', tIni: 0.00, tFin: 0.14 },
  { key: 'esofago',  label: 'Esófago',           pos: new THREE.Vector3(-3.2, 2.4, 0),   color: '#fb7185', tIni: 0.14, tFin: 0.30 },
  { key: 'estomago', label: 'Estómago',          pos: new THREE.Vector3(-2.4, -1.6, 0),  color: '#ef4444', tIni: 0.30, tFin: 0.55 },
  { key: 'delgado',  label: 'Intestino Delgado', pos: new THREE.Vector3(1.8, -3.4, 0),   color: '#f59e0b', tIni: 0.55, tFin: 0.82 },
  { key: 'grueso',   label: 'Intestino Grueso',  pos: new THREE.Vector3(5.6, -1.2, 0),   color: '#a16207', tIni: 0.82, tFin: 1.00 },
];

// Curva suave que atraviesa el tracto completo (Catmull-Rom por los órganos).
function useTractCurve() {
  return useMemo(() => {
    const pts = [
      new THREE.Vector3(-7.4, 6.2, 0.2),
      ORGANOS[0].pos.clone(),
      new THREE.Vector3(-4.8, 3.6, -0.3),
      ORGANOS[1].pos.clone(),
      new THREE.Vector3(-3.0, 0.4, 0.4),
      ORGANOS[2].pos.clone(),
      new THREE.Vector3(-0.6, -3.0, -0.3),
      ORGANOS[3].pos.clone(),
      new THREE.Vector3(3.6, -4.2, 0.4),
      ORGANOS[4].pos.clone(),
      new THREE.Vector3(6.4, 1.2, 0),
    ];
    return new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  }, []);
}

/* ── Tubo del tracto: la "carretera" translúcida por la que viaja el bolo. ───── */
function TractTube({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const geom = useMemo(
    () => new THREE.TubeGeometry(curve, 240, 0.55, 20, false),
    [curve],
  );
  return (
    <mesh geometry={geom}>
      <meshPhysicalMaterial
        color="#fecaca"
        transparent
        opacity={0.14}
        roughness={0.35}
        metalness={0.05}
        transmission={0.7}
        thickness={1.2}
        emissive="#fb7185"
        emissiveIntensity={0.25}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ── Órgano: masa orgánica translúcida que se ilumina cuando está activa. ────── */
function OrganMass({
  organo,
  active,
  intensity,
  compatible,
}: {
  organo: Organo;
  active: boolean;
  intensity: number;
  compatible: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const R = organo.key === 'estomago' ? 2.1 : organo.key.includes('intestino') || organo.key === 'delgado' || organo.key === 'grueso' ? 1.7 : 1.15;
  const col = active && !compatible ? '#94a3b8' : organo.color;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 2.4 + organo.pos.x) * (active ? 0.06 : 0.02);
    if (ref.current) ref.current.scale.setScalar(pulse);
    if (glowRef.current) {
      const g = (active ? 1.9 : 1.3) + Math.sin(t * 3 + organo.pos.y) * 0.12;
      glowRef.current.scale.setScalar(g);
    }
  });

  const emissive = active ? 1.6 + intensity * 2.4 : 0.25;

  return (
    <group position={organo.pos}>
      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.25}>
        <mesh ref={ref}>
          <sphereGeometry args={[R, 48, 48]} />
          <meshPhysicalMaterial
            color={col}
            emissive={col}
            emissiveIntensity={emissive}
            roughness={0.3}
            metalness={0.15}
            transmission={0.35}
            thickness={1.5}
            transparent
            opacity={active ? 0.82 : 0.5}
          />
        </mesh>
      </Float>

      {/* halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[R, 24, 24]} />
        <meshBasicMaterial
          color={col}
          transparent
          opacity={active ? 0.16 : 0.05}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {active && <pointLight color={col} intensity={6 + intensity * 10} distance={12} />}

      {/* etiqueta del órgano */}
      <Html center distanceFactor={16} position={[0, R + 0.9, 0]}>
        <div
          className="select-none pointer-events-none whitespace-nowrap px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest"
          style={{
            color: '#fff',
            background: active ? `${col}cc` : 'rgba(15,23,42,0.6)',
            border: `1px solid ${active ? '#ffffff66' : '#ffffff22'}`,
            boxShadow: active ? `0 0 20px ${col}` : 'none',
            backdropFilter: 'blur(6px)',
          }}
        >
          {organo.label}
        </div>
      </Html>
    </group>
  );
}

/* ── Bolo alimenticio: viaja por la curva; encoge al descomponerse. ─────────── */
function Bolo({
  curve,
  progreso,
  macroHex,
  estado,
}: {
  curve: THREE.CatmullRomCurve3;
  progreso: number;
  macroHex: string;
  estado: Estado;
}) {
  const ref = useRef<THREE.Group>(null);
  const tRef = useRef(0);

  useFrame((_, delta) => {
    if (!ref.current) return;
    // El bolo persigue la posición objetivo (progreso) suavemente.
    const target = THREE.MathUtils.clamp(progreso, 0.02, 0.99);
    tRef.current += (target - tRef.current) * Math.min(1, delta * 1.6);
    const t = THREE.MathUtils.clamp(tRef.current, 0.001, 0.999);
    const p = curve.getPointAt(t);
    ref.current.position.copy(p);
    ref.current.rotation.y += delta * 1.2;
    ref.current.rotation.x += delta * 0.7;

    // Al avanzar (más digerido) el bolo se encoge.
    const shrink = estado === 'absorbido' ? 0.25 : THREE.MathUtils.lerp(0.85, 0.35, progreso);
    ref.current.scale.setScalar(shrink);
  });

  const desnaturalizado = estado === 'desnaturalizado';
  const col = desnaturalizado ? '#94a3b8' : macroHex;

  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial
          color={col}
          emissive={col}
          emissiveIntensity={desnaturalizado ? 0.6 : 2.2}
          roughness={0.4}
          metalness={0.2}
          flatShading
        />
      </mesh>
      <pointLight color={col} intensity={4} distance={5} />
    </group>
  );
}

/* ── Nutrientes liberados: monómeros que escapan del bolo cuando se digiere. ── */
function NutrientRelease({
  curve,
  progreso,
  macroHex,
  active,
}: {
  curve: THREE.CatmullRomCurve3;
  progreso: number;
  macroHex: string;
  active: boolean;
}) {
  const COUNT = 260;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }).map(() => ({
        phase: Math.random(),
        speed: 0.35 + Math.random() * 0.5,
        spread: 0.4 + Math.random() * 1.6,
        ang: Math.random() * Math.PI * 2,
      })),
    [],
  );

  useFrame((state) => {
    if (!geomRef.current) return;
    const emit = THREE.MathUtils.clamp(progreso, 0.02, 0.99);
    const origin = curve.getPointAt(emit);
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const life = (time * s.speed + s.phase) % 1; // 0..1
      const grow = life * s.spread;
      const ix = i * 3;
      // Los monómeros brotan del bolo y descienden hacia la sangre.
      positions[ix] = origin.x + Math.cos(s.ang) * grow;
      positions[ix + 1] = origin.y - life * 3.2 + Math.sin(s.ang) * grow * 0.4;
      positions[ix + 2] = origin.z + Math.sin(s.ang) * grow;
    }
    geomRef.current.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        color={macroHex}
        size={0.18}
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/* ── Enzimas: orbitan el bolo actuando (cortando el polímero). ──────────────── */
function EnzymeSwarm({
  curve,
  progreso,
  compatible,
  active,
}: {
  curve: THREE.CatmullRomCurve3;
  progreso: number;
  compatible: boolean;
  active: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const N = 7;
  const seeds = useMemo(
    () =>
      Array.from({ length: N }).map((_, i) => ({
        ang: (i / N) * Math.PI * 2,
        r: 1.1 + Math.random() * 0.6,
        speed: 0.8 + Math.random() * 0.8,
        yoff: Math.random() * Math.PI * 2,
      })),
    [],
  );
  const meshes = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((state) => {
    if (!active) return;
    const emit = THREE.MathUtils.clamp(progreso, 0.02, 0.99);
    const origin = curve.getPointAt(emit);
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < N; i++) {
      const m = meshes.current[i];
      if (!m) continue;
      const s = seeds[i];
      const a = s.ang + t * s.speed;
      m.position.set(
        origin.x + Math.cos(a) * s.r,
        origin.y + Math.sin(t * 1.5 + s.yoff) * 0.5,
        origin.z + Math.sin(a) * s.r,
      );
      m.rotation.y = a * 2;
    }
  });

  if (!active) return null;
  const col = compatible ? '#219ebc' : '#64748b';

  return (
    <group ref={groupRef}>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(el) => { meshes.current[i] = el; }}>
          <tetrahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color={col}
            emissive={col}
            emissiveIntensity={compatible ? 2.4 : 0.6}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ── Torrente sanguíneo: partículas que fluyen bajo el intestino (absorción). ─ */
function BloodStream({ intensity }: { intensity: number }) {
  const COUNT = 120;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }).map(() => ({
        x: Math.random() * 16 - 8,
        y: -6 - Math.random() * 1.6,
        z: Math.random() * 4 - 2,
        speed: 1.5 + Math.random() * 2,
      })),
    [],
  );

  useFrame((_, delta) => {
    if (!geomRef.current) return;
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      s.x += s.speed * delta * (0.4 + intensity);
      if (s.x > 9) s.x = -9;
      const ix = i * 3;
      positions[ix] = s.x;
      positions[ix + 1] = s.y;
      positions[ix + 2] = s.z;
    }
    geomRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        color="#f87171"
        size={0.22}
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({
  macronutriente,
  enzima,
  nivelPH,
  estado,
  progreso,
  compatible,
}: {
  macronutriente: string;
  enzima: string | null;
  nivelPH: number;
  estado: Estado;
  progreso: number;
  compatible: boolean;
}) {
  const curve = useTractCurve();
  const macroHex = NUTRIENTE_HEX[macronutriente] || '#10b981';

  // La digestión ocurre cuando el bolo avanza (digerido/absorbido).
  const digiriendo = estado === 'digerido' || estado === 'absorbido';
  const boloT = digiriendo ? THREE.MathUtils.clamp(0.02 + progreso * 0.97, 0.02, 0.99) : 0.05;

  // Órgano activo = el que contiene la posición actual del bolo.
  const organoActivoIdx = useMemo(() => {
    if (!digiriendo) return 0;
    return ORGANOS.findIndex((o) => boloT >= o.tIni && boloT <= o.tFin);
  }, [boloT, digiriendo]);

  const intensity = THREE.MathUtils.clamp(progreso, 0.1, 1);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 20]} fov={48} />
      <color attach="background" args={['#05030a']} />
      <fog attach="fog" args={['#05030a', 24, 52]} />

      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#3b0d16', '#020617', 0.4]} />
      <directionalLight position={[8, 10, 12]} intensity={0.8} color="#fecaca" />

      <TractTube curve={curve} />

      {ORGANOS.map((o, i) => (
        <OrganMass
          key={o.key}
          organo={o}
          active={digiriendo && i === organoActivoIdx}
          intensity={intensity}
          compatible={compatible}
        />
      ))}

      {/* Bolo viajando */}
      <Bolo curve={curve} progreso={boloT} macroHex={macroHex} estado={estado} />

      {/* Nutrientes liberándose y enzimas actuando */}
      <NutrientRelease curve={curve} progreso={boloT} macroHex={macroHex} active={digiriendo && compatible} />
      <EnzymeSwarm curve={curve} progreso={boloT} compatible={compatible} active={digiriendo && enzima !== null} />

      {/* Torrente sanguíneo bajo el intestino */}
      <BloodStream intensity={digiriendo ? intensity : 0.05} />

      {/* Indicador de pH flotante */}
      <Html position={[0, 8, 0]} center distanceFactor={20}>
        <div
          className="select-none pointer-events-none px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em]"
          style={{
            color: '#fff',
            background:
              nivelPH < 6 ? 'rgba(244,63,94,0.4)' : nivelPH > 8 ? 'rgba(6,182,212,0.4)' : 'rgba(16,185,129,0.4)',
            border: '1px solid #ffffff33',
            backdropFilter: 'blur(6px)',
          }}
        >
          pH {nivelPH.toFixed(1)}
        </div>
      </Html>

      <Sparkles count={70} scale={[24, 16, 16]} size={2} speed={0.3} color="#fecaca" opacity={0.4} />
      <Stars radius={90} depth={45} count={3000} factor={4} saturation={0} fade speed={0.6} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={12}
        maxDistance={34}
        autoRotate={false}
        autoRotateSpeed={0.45}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.18} mipmapBlur intensity={1.7} radius={0.7} />
        <ChromaticAberration offset={new THREE.Vector2(0.0007, 0.0007)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function SistemaDigestivo3DScene({
  macronutriente,
  enzima,
  nivelPH,
  estado,
  progreso,
  compatible,
}: {
  macronutriente: string;
  enzima: string | null;
  nivelPH: number;
  estado: Estado;
  progreso: number;
  compatible: boolean;
}) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene
            macronutriente={macronutriente}
            enzima={enzima}
            nivelPH={nivelPH}
            estado={estado}
            progreso={progreso}
            compatible={compatible}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
