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
   DilatacionTermica3DScene — Dilatación lineal de un metal, en 3D volumétrico.
   Física real: ΔL = α · L₀ · ΔT  (valores idénticos al store del Piloto).
   • Una barra metálica se ESCALA en longitud según ΔL real (amplificado para verse).
   • La red cristalina (malla de átomos) VIBRA con amplitud creciente = más calor,
     y la separación media entre átomos crece con la temperatura (la red se abre).
   • Glow térmico: gris frío → rojo/naranja incandescente → rojo vivo. Emisión ↑.
   • Regla graduada + marcador de elongación ΔL. Bloom, Stars, Sparkles, OrbitControls.
   Props: { alpha, longitud, tempIni, tempFin, color, encendido }.
──────────────────────────────────────────────────────────────────────────── */

const COLD = new THREE.Color('#94a3b8'); // metal frío (gris azulado)
const HOT = new THREE.Color('#ff4d1c');  // incandescente al rojo vivo
const WHITE_HOT = new THREE.Color('#ffd7a0');

// ΔT normalizado 0..1 (rango de trabajo del Piloto: 20 → 120 °C ⇒ ΔT máx 100)
function heatFactor(tempFin: number, tempIni: number) {
  return THREE.MathUtils.clamp((tempFin - tempIni) / 100, 0, 1);
}

// Longitud base de la barra en unidades de escena
const BASE_BAR_LEN = 8;
// Amplificación visual del ΔL real (ΔL suele ser fracciones de mm sobre L₀ en mm)
const DL_GAIN = 900;

/* ── Color térmico del metal según ΔT ──────────────────────────────────────── */
function thermalColor(hf: number) {
  const c = COLD.clone().lerp(HOT, THREE.MathUtils.clamp(hf * 1.3, 0, 1));
  if (hf > 0.7) c.lerp(WHITE_HOT, (hf - 0.7) / 0.3 * 0.4);
  return c;
}

/* ── Red cristalina: malla de átomos que vibran; amplitud ∝ temperatura ─────── */
function CrystalLattice({ hf, spanX, baseColor }: { hf: number; spanX: number; baseColor: THREE.Color }) {
  const NX = 14, NY = 3, NZ = 3;
  const COUNT = NX * NY * NZ;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Posiciones de reposo de la red + fase aleatoria por átomo
  const nodes = useMemo(() => {
    const arr: { base: THREE.Vector3; phase: number; freq: number }[] = [];
    for (let ix = 0; ix < NX; ix++) {
      for (let iy = 0; iy < NY; iy++) {
        for (let iz = 0; iz < NZ; iz++) {
          const x = (ix / (NX - 1) - 0.5); // -0.5..0.5
          const y = (iy - (NY - 1) / 2) * 0.55;
          const z = (iz - (NZ - 1) / 2) * 0.55;
          arr.push({
            base: new THREE.Vector3(x, y, z),
            phase: Math.random() * Math.PI * 2,
            freq: 8 + Math.random() * 6,
          });
        }
      }
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.getElapsedTime();
    // La red se "abre": separación crece ~1% + hf y amplitud de vibración ∝ hf
    const spread = 1 + hf * 0.18;
    const amp = 0.02 + hf * 0.16;
    for (let i = 0; i < COUNT; i++) {
      const n = nodes[i];
      const jx = Math.sin(t * n.freq + n.phase) * amp;
      const jy = Math.cos(t * n.freq * 1.1 + n.phase) * amp;
      const jz = Math.sin(t * n.freq * 0.9 + n.phase * 1.3) * amp;
      dummy.position.set(
        n.base.x * spanX * spread + jx,
        n.base.y * spread + jy,
        n.base.z * spread + jz,
      );
      const s = 0.11 + hf * 0.03;
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      // átomos más calientes hacia el centro-brillo
      tmpColor.copy(baseColor).lerp(WHITE_HOT, hf * 0.5);
      mesh.setColorAt(i, tmpColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        emissive={'#ff7a2f'}
        emissiveIntensity={0.6 + hf * 2.6}
        roughness={0.3}
        metalness={0.7}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ── Enlaces (resortes) entre átomos adyacentes en X: sugieren la red vibrante ── */
function LatticeBonds({ hf, spanX }: { hf: number; spanX: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const N = 13;
  const bonds = useMemo(() => Array.from({ length: N }), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const amp = 0.03 + hf * 0.12;
    groupRef.current.children.forEach((c, i) => {
      c.position.y = Math.sin(t * (9 + i) + i) * amp;
    });
  });

  const spread = 1 + hf * 0.18;
  return (
    <group ref={groupRef}>
      {bonds.map((_, i) => {
        const x = ((i + 0.5) / (N) - 0.5) * spanX * spread;
        const len = (spanX * spread) / N;
        return (
          <mesh key={i} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, len * 0.7, 6]} />
            <meshStandardMaterial
              color={'#fbbf24'}
              emissive={'#f97316'}
              emissiveIntensity={0.4 + hf * 2}
              transparent
              opacity={0.35 + hf * 0.4}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── La barra metálica: se expande en longitud según ΔL real ────────────────── */
function MetalBar({ hf, deltaLScene, baseColor }: { hf: number; deltaLScene: number; baseColor: THREE.Color }) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const barRef = useRef<THREE.Mesh>(null);
  const spanX = BASE_BAR_LEN + deltaLScene;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (matRef.current) {
      const c = thermalColor(hf);
      matRef.current.color.copy(c);
      matRef.current.emissive.copy(HOT);
      matRef.current.emissiveIntensity = hf * (3.2 + Math.sin(t * 4) * 0.25 * hf);
    }
    if (barRef.current) {
      // ligero "respiro" térmico
      barRef.current.scale.y = 1 + Math.sin(t * 3) * 0.01 * hf;
    }
  });

  return (
    <group>
      {/* Cuerpo sólido semitransparente que envuelve la red */}
      <mesh ref={barRef}>
        <boxGeometry args={[spanX, 1.5, 1.5]} />
        <meshStandardMaterial
          ref={matRef}
          color={baseColor}
          metalness={0.85}
          roughness={0.25}
          transparent
          opacity={0.32}
          toneMapped={false}
        />
      </mesh>

      {/* Red cristalina + enlaces dentro de la barra */}
      <CrystalLattice hf={hf} spanX={spanX} baseColor={baseColor} />
      <LatticeBonds hf={hf} spanX={spanX} />

      {/* Foco térmico que emana de la barra caliente */}
      <pointLight color={'#ff6a2c'} intensity={hf * 24} distance={22} decay={1.5} />
    </group>
  );
}

/* ── Soportes / bancada del banco de pruebas ───────────────────────────────── */
function TestBench({ span }: { span: number }) {
  const half = span / 2;
  return (
    <group position={[0, -1.4, 0]}>
      {/* riel base */}
      <mesh position={[0, -0.25, 0]}>
        <boxGeometry args={[BASE_BAR_LEN + 4, 0.3, 2.4]} />
        <meshStandardMaterial color={'#0f172a'} metalness={0.6} roughness={0.4} />
      </mesh>
      {/* soporte fijo (izquierda) */}
      <mesh position={[-half - 0.2, 0.55, 0]}>
        <boxGeometry args={[0.5, 1.6, 2]} />
        <meshStandardMaterial color={'#1e293b'} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* soporte deslizante (derecha) */}
      <mesh position={[half + 0.2, 0.55, 0]}>
        <boxGeometry args={[0.5, 1.6, 2]} />
        <meshStandardMaterial color={'#1e293b'} metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ── Llama del quemador bajo la barra cuando se calienta ────────────────────── */
function Burner({ active, hf }: { active: boolean; hf: number }) {
  const COUNT = 120;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const speeds = useMemo(() => Array.from({ length: COUNT }, () => 0.6 + Math.random() * 1.4), []);

  useMemo(() => {
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * BASE_BAR_LEN * 0.9;
      positions[i * 3 + 1] = -2 + Math.random() * 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
  }, [positions]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3 + 1] += speeds[i] * dt * (0.6 + hf);
      if (positions[i * 3 + 1] > -0.4) {
        positions[i * 3] = (Math.random() - 0.5) * BASE_BAR_LEN * 0.9;
        positions[i * 3 + 1] = -2.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      }
    }
    if (geomRef.current) geomRef.current.attributes.position.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        color={'#ff8a3d'}
        size={0.22}
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Regla graduada + marcador de elongación ΔL ────────────────────────────── */
function ElongationRuler({ deltaLScene, deltaLmm }: { deltaLScene: number; deltaLmm: number }) {
  const start = BASE_BAR_LEN / 2;      // borde derecho en frío
  const end = start + deltaLScene;     // borde derecho en caliente
  const ticks = 12;

  return (
    <group position={[0, -2.6, 0]}>
      {/* riel de la regla */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[BASE_BAR_LEN + 2.5, 0.06, 0.2]} />
        <meshBasicMaterial color={'#334155'} />
      </mesh>
      {/* graduaciones */}
      {Array.from({ length: ticks }).map((_, i) => {
        const x = -start - 0.5 + (i / (ticks - 1)) * (BASE_BAR_LEN + 1.5);
        return (
          <mesh key={i} position={[x, 0.12, 0]}>
            <boxGeometry args={[0.015, 0.18, 0.02]} />
            <meshBasicMaterial color={'#475569'} />
          </mesh>
        );
      })}
      {/* marcador FRÍO (referencia L₀) */}
      <mesh position={[start, 0.2, 0]}>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color={'#38bdf8'} emissive={'#38bdf8'} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* marcador CALIENTE (borde dilatado) */}
      <mesh position={[end, 0.2, 0]}>
        <boxGeometry args={[0.05, 0.6, 0.05]} />
        <meshStandardMaterial color={'#f97316'} emissive={'#f97316'} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      {/* barra de ΔL entre marcadores */}
      {deltaLScene > 0.01 && (
        <mesh position={[(start + end) / 2, 0.32, 0]}>
          <boxGeometry args={[deltaLScene, 0.06, 0.06]} />
          <meshStandardMaterial color={'#fde047'} emissive={'#fde047'} emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
      )}
      {/* etiqueta ΔL */}
      <Html position={[end + 0.6, 0.35, 0]} center distanceFactor={12}>
        <div className="text-[11px] font-black text-amber-300 whitespace-nowrap select-none pointer-events-none drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
          ΔL = {deltaLmm.toFixed(3)} mm
        </div>
      </Html>
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ alpha, longitud, tempIni, tempFin, color, encendido }: {
  alpha: number; longitud: number; tempIni: number; tempFin: number; color: string; encendido: boolean;
}) {
  const hf = heatFactor(tempFin, tempIni);
  const deltaLmm = alpha * longitud * (tempFin - tempIni); // ΔL real en mm
  const deltaLScene = Math.min(deltaLmm * DL_GAIN / longitud, 5); // amplificado y acotado
  const baseColor = useMemo(() => new THREE.Color(color || '#CBD5E1'), [color]);
  const span = BASE_BAR_LEN + deltaLScene;

  const groupRef = useRef<THREE.Group>(null);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3.5, 15]} fov={45} />
      <color attach="background" args={['#010409']} />
      <fog attach="fog" args={['#010409', 20, 44]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight intensity={0.35} groundColor="#020617" />
      <directionalLight position={[6, 10, 8]} intensity={0.8} />

      <group ref={groupRef} position={[0, 0.6, 0]}>
        <MetalBar hf={hf} deltaLScene={deltaLScene} baseColor={baseColor} />
        <TestBench span={span} />
        <Burner active={encendido || hf > 0.02} hf={hf} />
        <ElongationRuler deltaLScene={deltaLScene} deltaLmm={deltaLmm} />
      </group>

      <Sparkles count={70} scale={[20, 12, 20]} size={2} speed={0.3} color="#fdba74" opacity={0.4} />
      <Stars radius={80} depth={40} count={2400} factor={4} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={9}
        maxDistance={28}
        autoRotate={false}
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.18} mipmapBlur intensity={1.5} radius={0.7} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function DilatacionTermica3DScene({
  alpha,
  longitud,
  tempIni,
  tempFin,
  color,
  encendido,
}: {
  alpha: number;
  longitud: number;
  tempIni: number;
  tempFin: number;
  color: string;
  encendido: boolean;
}) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene
            alpha={alpha}
            longitud={longitud}
            tempIni={tempIni}
            tempFin={tempFin}
            color={color}
            encendido={encendido}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
