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
   SistemaNervioso3DScene — Neurona cinemática con potencial de acción vivo.
   Biología real: el impulso viaja por el axón mielinizado saltando de nodo a
   nodo de Ranvier (conducción saltatoria). En la terminal se liberan vesículas
   de neurotransmisores que cruzan la hendidura sináptica hacia la neurona
   receptora. La velocidad y el brillo del pulso derivan del estado real del
   store: integridadMielina (0..100) → velocidad, fuerzaGolpe (0..100) → brillo,
   y `estado` marca la fase del arco reflejo.
   Props: { estado, integridadMielina, fuerzaGolpe, status }.
──────────────────────────────────────────────────────────────────────────── */

type Estado =
  | 'reposo'
  | 'golpe'
  | 'viajando_sensorial'
  | 'sinapsis'
  | 'viajando_motor'
  | 'contraccion';

const CYAN = new THREE.Color('#22d3ee');   // impulso eléctrico
const MAGENTA = new THREE.Color('#e879f9'); // neurotransmisores

// Geometría del axón: recorre de -8 a +7 en X. La sinapsis vive cerca de +8.
const AXON_START = -8;
const AXON_END = 7;
const AXON_LEN = AXON_END - AXON_START;
const N_MYELIN = 9;                 // segmentos de mielina
const SYNAPSE_X = 8.2;             // botón sináptico
const RECEPTOR_X = 10.4;           // neurona receptora
const CLEFT_A = 8.6;              // inicio de la hendidura
const CLEFT_B = 9.9;             // fin de la hendidura

// Un impulso está activo cuando viaja por el axón o cruza la sinapsis.
function pulseActive(estado: Estado) {
  return estado === 'golpe' || estado === 'viajando_sensorial' || estado === 'viajando_motor';
}
function synapseActive(estado: Estado) {
  return estado === 'sinapsis';
}

/* ── Soma (cuerpo neuronal) con dendritas ramificadas ─────────────────────── */
function Soma({ intensity }: { intensity: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const dendrites = useMemo(() => {
    const arr: { dir: THREE.Vector3; len: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const el = (Math.random() - 0.5) * 1.4;
      const dir = new THREE.Vector3(
        -Math.abs(Math.cos(a)) - 0.4,   // apuntan hacia -X (lejos del axón)
        Math.sin(a) * 1.1 + el * 0.3,
        Math.cos(a * 1.7) * 1.1,
      ).normalize();
      arr.push({ dir, len: 1.8 + Math.random() * 1.6 });
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulse = 1 + Math.sin(t * 2.2) * 0.05;
    if (ref.current) ref.current.scale.setScalar(pulse);
    if (glowRef.current) glowRef.current.scale.setScalar(1.5 + Math.sin(t * 1.7) * 0.12);
  });

  return (
    <group position={[AXON_START - 0.6, 0, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[2, 48, 48]} />
        <meshStandardMaterial
          color="#0e7490"
          emissive={CYAN}
          emissiveIntensity={0.6 + intensity * 1.4}
          roughness={0.35}
          metalness={0.3}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2, 24, 24]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* núcleo */}
      <mesh position={[0.2, 0.2, 0.4]}>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color="#155e75" emissive={CYAN} emissiveIntensity={1.4} roughness={0.2} />
      </mesh>
      <pointLight color={CYAN} intensity={6 + intensity * 8} distance={16} />

      {/* dendritas ramificadas */}
      {dendrites.map((d, i) => {
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.dir);
        const mid = d.dir.clone().multiplyScalar(1.7 + d.len / 2);
        // rama hija
        const childDir = d.dir.clone().add(new THREE.Vector3(0, 0.6, 0.4)).normalize();
        const childQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), childDir);
        const childBase = d.dir.clone().multiplyScalar(1.7 + d.len * 0.65);
        return (
          <group key={i}>
            <group position={[mid.x, mid.y, mid.z]} quaternion={quat}>
              <mesh>
                <cylinderGeometry args={[0.07, 0.18, d.len, 10]} />
                <meshStandardMaterial color="#0e7490" emissive={CYAN} emissiveIntensity={0.5 + intensity} roughness={0.4} />
              </mesh>
            </group>
            <group position={[childBase.x, childBase.y, childBase.z]} quaternion={childQuat}>
              <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.03, 0.09, 1.2, 8]} />
                <meshStandardMaterial color="#0e7490" emissive={CYAN} emissiveIntensity={0.5 + intensity} roughness={0.4} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

/* ── Axón con vainas de mielina segmentadas y nodos de Ranvier ────────────── */
function Axon({ integridad }: { integridad: number }) {
  const gap = AXON_LEN / N_MYELIN;
  const sheathLen = gap * (0.55 + integridad * 0.35); // mielina más gruesa = mejor aislamiento
  const nodesRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    // sutil latido en los nodos de Ranvier
    if (!nodesRef.current) return;
    const t = state.clock.getElapsedTime();
    nodesRef.current.children.forEach((c, i) => {
      const s = 1 + Math.sin(t * 4 + i) * 0.08;
      c.scale.setScalar(s);
    });
  });

  return (
    <group>
      {/* núcleo del axón (fibra desnuda) */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[(AXON_START + AXON_END) / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.18, AXON_LEN + 1, 16]} />
        <meshStandardMaterial color="#0369a1" emissive={CYAN} emissiveIntensity={0.4} roughness={0.5} />
      </mesh>

      {/* vainas de mielina */}
      {Array.from({ length: N_MYELIN }).map((_, i) => {
        const cx = AXON_START + gap * (i + 0.5);
        return (
          <mesh key={i} rotation={[0, 0, Math.PI / 2]} position={[cx, 0, 0]}>
            <capsuleGeometry args={[0.42, sheathLen, 8, 20]} />
            <meshStandardMaterial
              color="#f8fafc"
              emissive="#a5f3fc"
              emissiveIntensity={0.25 + integridad * 0.5}
              roughness={0.3}
              metalness={0.15}
            />
          </mesh>
        );
      })}

      {/* nodos de Ranvier (huecos entre vainas) */}
      <group ref={nodesRef}>
        {Array.from({ length: N_MYELIN - 1 }).map((_, i) => {
          const cx = AXON_START + gap * (i + 1);
          return (
            <mesh key={i} position={[cx, 0, 0]}>
              <sphereGeometry args={[0.24, 16, 16]} />
              <meshStandardMaterial color="#0e7490" emissive={CYAN} emissiveIntensity={1.2} roughness={0.3} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/* ── Potencial de acción: anillo luminoso que salta de nodo a nodo ────────── */
function ActionPotential({ estado, integridad, intensity }: {
  estado: Estado; integridad: number; intensity: number;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const active = pulseActive(estado);
  // Mielina alta → conducción saltatoria rápida.
  const speed = 0.35 + integridad * 1.0;

  useFrame((state) => {
    const ring = ringRef.current;
    const core = coreRef.current;
    if (!ring || !core) return;
    if (!active) { ring.visible = false; core.visible = false; if (lightRef.current) lightRef.current.intensity = 0; return; }
    ring.visible = true; core.visible = true;

    // Progreso 0..1 con "saltos" cuantizados hacia los nodos (conducción saltatoria).
    const raw = (state.clock.getElapsedTime() * speed) % 1;
    const jumps = N_MYELIN;
    const stepped = Math.floor(raw * jumps) / jumps;
    const eased = stepped + (raw * jumps - Math.floor(raw * jumps)) ** 4 / jumps; // aterriza rápido en cada nodo
    const x = AXON_START + eased * AXON_LEN;

    ring.position.x = x; core.position.x = x;
    const flick = 0.85 + Math.sin(state.clock.getElapsedTime() * 40) * 0.15;
    const scl = (0.7 + intensity * 0.6) * flick;
    ring.scale.setScalar(scl);
    core.scale.setScalar(scl);
    if (lightRef.current) {
      lightRef.current.position.x = x;
      lightRef.current.intensity = (12 + intensity * 25) * flick;
    }
  });

  return (
    <group>
      <mesh ref={ringRef} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.7, 0.16, 16, 40]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.95} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.32, 20, 20]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <pointLight ref={lightRef} color={CYAN} distance={12} />
    </group>
  );
}

/* ── Botón sináptico terminal ─────────────────────────────────────────────── */
function SynapticBouton({ active }: { active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.scale.setScalar(active ? 1 + Math.sin(t * 8) * 0.08 : 1);
  });
  return (
    <group position={[SYNAPSE_X, 0, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[1.1, 40, 40]} />
        <meshStandardMaterial
          color="#0e7490"
          emissive={CYAN}
          emissiveIntensity={active ? 2.4 : 0.7}
          roughness={0.3}
          metalness={0.3}
        />
      </mesh>
      {active && <pointLight color={MAGENTA} intensity={18} distance={10} />}
    </group>
  );
}

/* ── Neurona receptora (postsináptica) ────────────────────────────────────── */
function Receptor({ estado }: { estado: Estado }) {
  const ref = useRef<THREE.Mesh>(null);
  const excited = estado === 'sinapsis' || estado === 'viajando_motor' || estado === 'contraccion';
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.scale.setScalar(excited ? 1 + Math.sin(t * 5) * 0.06 : 1);
  });
  return (
    <group position={[RECEPTOR_X, 0, 0]}>
      <mesh ref={ref}>
        <sphereGeometry args={[1.8, 40, 40]} />
        <meshStandardMaterial
          color="#701a75"
          emissive={MAGENTA}
          emissiveIntensity={excited ? 1.8 : 0.4}
          roughness={0.4}
          metalness={0.25}
        />
      </mesh>
      {/* dendrita receptora que se aleja */}
      <mesh position={[2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.3, 2.4, 12]} />
        <meshStandardMaterial color="#701a75" emissive={MAGENTA} emissiveIntensity={excited ? 1.2 : 0.3} roughness={0.4} />
      </mesh>
      <pointLight color={MAGENTA} intensity={excited ? 12 : 3} distance={14} />
    </group>
  );
}

/* ── Vesículas de neurotransmisores cruzando la hendidura sináptica ───────── */
function Neurotransmitters({ active }: { active: boolean }) {
  const COUNT = 260;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }).map(() => ({
        y: (Math.random() - 0.5) * 1.6,
        z: (Math.random() - 0.5) * 1.6,
        speed: 0.4 + Math.random() * 0.9,
        phase: Math.random(),
      })),
    [],
  );

  useFrame((state) => {
    if (!geomRef.current) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const s = seeds[i];
      const prog = active ? ((t * s.speed + s.phase) % 1) : 0;
      const ix = i * 3;
      // cruzan la hendidura de CLEFT_A → CLEFT_B con dispersión creciente
      positions[ix] = CLEFT_A + prog * (CLEFT_B - CLEFT_A);
      positions[ix + 1] = s.y * (0.4 + prog * 1.1);
      positions[ix + 2] = s.z * (0.4 + prog * 1.1);
    }
    geomRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points visible={active}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.22}
        color={MAGENTA}
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

/* ── Hendidura sináptica (marco visual del espacio intersináptico) ────────── */
function SynapticCleft({ active }: { active: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    mat.opacity = active ? 0.18 + Math.sin(state.clock.getElapsedTime() * 6) * 0.08 : 0.05;
  });
  const cx = (CLEFT_A + CLEFT_B) / 2;
  return (
    <mesh ref={ref} position={[cx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[1.5, 1.5, CLEFT_B - CLEFT_A, 32, 1, true]} />
      <meshBasicMaterial color={MAGENTA} transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ── Escena ───────────────────────────────────────────────────────────────── */
function Scene({ estado, integridadMielina, fuerzaGolpe, status }: SceneProps) {
  const integridad = THREE.MathUtils.clamp(integridadMielina / 100, 0, 1);
  const intensity = THREE.MathUtils.clamp(fuerzaGolpe / 100, 0.15, 1);
  const synActive = synapseActive(estado);
  const success = status === 'success';

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 5, 22]} fov={48} />
      <color attach="background" args={['#04050d']} />
      <fog attach="fog" args={['#04050d', 26, 55]} />

      <ambientLight intensity={0.32} />
      <hemisphereLight intensity={0.3} groundColor="#020617" color="#164e63" />

      <Soma intensity={intensity} />
      <Axon integridad={integridad} />
      <ActionPotential estado={estado} integridad={integridad} intensity={intensity} />
      <SynapticBouton active={synActive} />
      <SynapticCleft active={synActive} />
      <Neurotransmitters active={synActive || success} />
      <Receptor estado={estado} />

      {/* etiqueta de la hendidura */}
      <Html position={[(CLEFT_A + CLEFT_B) / 2, 2.4, 0]} center distanceFactor={16}>
        <div className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300/80 select-none pointer-events-none drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
          Hendidura Sináptica
        </div>
      </Html>

      <Sparkles count={70} scale={[26, 12, 20]} size={2} speed={0.3} color="#67e8f9" opacity={0.4} />
      <Stars radius={90} depth={45} count={2800} factor={4} saturation={0} fade speed={0.6} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={12}
        maxDistance={40}
        autoRotate
        autoRotateSpeed={0.45}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.18} mipmapBlur intensity={1.7} radius={0.72} />
        <ChromaticAberration offset={new THREE.Vector2(0.0007, 0.0007)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

interface SceneProps {
  estado: Estado;
  integridadMielina: number;
  fuerzaGolpe: number;
  status: 'idle' | 'success' | 'error';
}

export default function SistemaNervioso3DScene(props: SceneProps) {
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
