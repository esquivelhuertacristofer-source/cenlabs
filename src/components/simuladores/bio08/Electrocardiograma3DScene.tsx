"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Sparkles,
  Html,
  MeshDistortMaterial,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────────────────
   Electrocardiograma3DScene — Corazón 3D latiendo + sistema de conducción
   eléctrica animado + trazo ECG (PQRST) luminoso en tiempo real.

   Sincronización fisiológica real:
   · El ciclo cardíaco dura T = 60 / BPM segundos.
   · Dentro de cada ciclo, la fase eléctrica progresa:
        Onda P (despolarización auricular)  → nodo SA
        segmento PR                          → nodo AV (retraso)
        complejo QRS (despolarización vent.) → Haz de His + Purkinje
        onda T (repolarización ventricular)
   · El corazón pulsa (MeshDistortMaterial + escala) en el pico R.
   · Los nodos/vías se iluminan cuando el impulso los recorre.
   · La onda ECG se dibuja como línea 3D que se desplaza scroll a la izquierda.

   Props derivados del store REAL: { ritmoBPM, faseActual }.
──────────────────────────────────────────────────────────────────────────── */

const CRIMSON = new THREE.Color('#f43f5e'); // rojo vital / miocardio
const ELECTRIC = new THREE.Color('#22d3ee'); // cian eléctrico / impulso

type Fase = 'Diástole' | 'Onda P' | 'QRS' | 'Onda T';

/* Curva PQRST paramétrica: recibe el progreso [0,1) del ciclo y devuelve la
   amplitud (mV escalados) del electrocardiograma. Coincide con la lógica del
   Piloto para que el trazo y el corazón laten al unísono. */
function ecgAmplitude(prog: number): number {
  // Onda P
  if (prog < 0.15) return 0.18 * Math.sin((prog / 0.15) * Math.PI);
  // segmento PR (línea base)
  if (prog < 0.25) return 0;
  // complejo QRS
  if (prog < 0.4) {
    const q = (prog - 0.25) / 0.15;
    if (q < 0.2) return -0.12 * (q / 0.2); // Q
    if (q < 0.5) return 1.0 * ((q - 0.2) / 0.3) - 0.12; // R (ascenso)
    if (q < 0.8) return -0.35 * ((q - 0.5) / 0.3) + 0.88; // caída a S
    return -0.35 + 0.35 * ((q - 0.8) / 0.2); // S → base
  }
  // segmento ST
  if (prog < 0.6) return 0;
  // onda T
  if (prog < 0.85) return 0.3 * Math.sin(((prog - 0.6) / 0.25) * Math.PI);
  // diástole final
  return 0;
}

// Ciclo global compartido: fase del clock -> progreso [0,1)
function cycleProgress(t: number, bpm: number): number {
  const T = 60 / Math.max(30, Math.min(220, bpm));
  return (t % T) / T;
}

/* ── Corazón 3D latiendo ─────────────────────────────────────────────────── */
function BeatingHeart({ bpm }: { bpm: number }) {
  const group = useRef<THREE.Group>(null);
  // DistortMaterialImpl no se exporta desde drei (tipo nominal). Usamos any en
  // los refs del material distorsionable; es la práctica estándar del repo.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const matA = useRef<any>(null);
  const matB = useRef<any>(null);
  /* eslint-enable @typescript-eslint/no-explicit-any */
  const light = useRef<THREE.PointLight>(null);

  // Geometría de corazón estilizado: dos lóbulos + una punta (cono invertido).
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const prog = cycleProgress(t, bpm);
    const amp = ecgAmplitude(prog);
    // Pulso: contracción brusca en el QRS (R), leve en la sístole auricular.
    const contract = 1 + Math.max(0, amp) * 0.28 + Math.max(0, -amp) * 0.05;
    if (group.current) {
      group.current.scale.setScalar(contract);
      group.current.rotation.y = t * 0.15;
    }
    const distort = 0.28 + Math.max(0, amp) * 0.35;
    if (matA.current) matA.current.distort = distort;
    if (matB.current) matB.current.distort = distort;
    const glow = 1.6 + Math.max(0, amp) * 3.2;
    if (matA.current) matA.current.emissiveIntensity = glow;
    if (matB.current) matB.current.emissiveIntensity = glow;
    if (light.current) light.current.intensity = 6 + Math.max(0, amp) * 40;
  });

  return (
    <group ref={group} position={[-3.6, 0.3, 0]}>
      {/* lóbulo izquierdo */}
      <mesh position={[-0.62, 0.55, 0]} rotation={[0, 0, Math.PI / 4]}>
        <sphereGeometry args={[0.95, 64, 64]} />
        <MeshDistortMaterial
          ref={matA}
          color={CRIMSON}
          emissive={CRIMSON}
          emissiveIntensity={1.6}
          roughness={0.35}
          metalness={0.25}
          distort={0.28}
          speed={2.2}
        />
      </mesh>
      {/* lóbulo derecho */}
      <mesh position={[0.62, 0.55, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <sphereGeometry args={[0.95, 64, 64]} />
        <MeshDistortMaterial
          ref={matB}
          color={CRIMSON}
          emissive={CRIMSON}
          emissiveIntensity={1.6}
          roughness={0.35}
          metalness={0.25}
          distort={0.28}
          speed={2.2}
        />
      </mesh>
      {/* punta ventricular (cono hacia abajo) */}
      <mesh position={[0, -0.75, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1.35, 2.1, 64]} />
        <meshStandardMaterial
          color={CRIMSON}
          emissive={CRIMSON}
          emissiveIntensity={1.6}
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>
      {/* halo interior */}
      <mesh>
        <sphereGeometry args={[1.9, 32, 32]} />
        <meshBasicMaterial color={CRIMSON} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight ref={light} color={CRIMSON} intensity={6} distance={12} />
    </group>
  );
}

/* ── Nodo del sistema de conducción (SA / AV) ────────────────────────────── */
function ConductionNode({
  position,
  bpm,
  window: win,
  label,
}: {
  position: [number, number, number];
  bpm: number;
  window: [number, number];
  label: string;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const heat = useRef(0);

  useFrame((state, delta) => {
    const prog = cycleProgress(state.clock.getElapsedTime(), bpm);
    const active = prog >= win[0] && prog < win[1];
    // subida rápida al activarse, decaimiento suave
    heat.current = active
      ? Math.min(1, heat.current + delta * 8)
      : Math.max(0, heat.current - delta * 3.5);
    const s = 1 + heat.current * 0.9;
    if (mesh.current) {
      mesh.current.scale.setScalar(s);
      const m = mesh.current.material as THREE.MeshStandardMaterial;
      m.emissiveIntensity = 0.6 + heat.current * 6;
    }
    if (light.current) light.current.intensity = heat.current * 14;
  });

  return (
    <group position={position}>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color={ELECTRIC} emissive={ELECTRIC} emissiveIntensity={0.6} roughness={0.2} />
      </mesh>
      <pointLight ref={light} color={ELECTRIC} intensity={0} distance={5} />
      <Html center distanceFactor={14}>
        <div className="text-[9px] font-black uppercase tracking-widest text-cyan-300/80 select-none pointer-events-none whitespace-nowrap drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]">
          {label}
        </div>
      </Html>
    </group>
  );
}

/* ── Pulso de luz que recorre una vía de conducción (línea de puntos) ────── */
function ConductionPath({
  points,
  bpm,
  window: win,
}: {
  points: THREE.Vector3[];
  bpm: number;
  window: [number, number];
}) {
  const COUNT = 26;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const colors = useMemo(() => new Float32Array(COUNT * 3), []);

  // Muestrea la polilínea en COUNT puntos uniformes.
  const sampled = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    return curve.getPoints(COUNT - 1);
  }, [points]);

  useMemo(() => {
    for (let i = 0; i < COUNT; i++) {
      const s = sampled[Math.min(i, sampled.length - 1)];
      positions[i * 3] = s.x;
      positions[i * 3 + 1] = s.y;
      positions[i * 3 + 2] = s.z;
    }
  }, [sampled, positions]);

  useFrame((state) => {
    const prog = cycleProgress(state.clock.getElapsedTime(), bpm);
    const local = (prog - win[0]) / (win[1] - win[0]); // posición del frente [0,1]
    const active = local >= 0 && local <= 1.15;
    for (let i = 0; i < COUNT; i++) {
      const f = i / (COUNT - 1);
      // gaussiana alrededor del frente de onda
      const d = Math.abs(f - local);
      const lit = active ? Math.exp(-(d * d) / 0.006) : 0.04;
      colors[i * 3] = ELECTRIC.r * lit;
      colors[i * 3 + 1] = ELECTRIC.g * lit;
      colors[i * 3 + 2] = ELECTRIC.b * lit;
    }
    if (geomRef.current) geomRef.current.attributes.color.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.14}
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

/* ── Sistema de conducción completo (posicionado junto al corazón) ───────── */
function ConductionSystem({ bpm }: { bpm: number }) {
  const O = new THREE.Vector3(-3.6, 0.3, 0); // centro del corazón

  const sa: [number, number, number] = [O.x - 0.4, O.y + 1.4, 0.2];
  const av: [number, number, number] = [O.x + 0.1, O.y + 0.2, 0.3];

  const hisPath = useMemo(
    () => [
      new THREE.Vector3(av[0], av[1], av[2]),
      new THREE.Vector3(O.x + 0.05, O.y - 0.4, 0.35),
      new THREE.Vector3(O.x, O.y - 1.0, 0.35),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const purkinjeLeft = useMemo(
    () => [
      new THREE.Vector3(O.x, O.y - 1.0, 0.35),
      new THREE.Vector3(O.x - 0.6, O.y - 1.5, 0.3),
      new THREE.Vector3(O.x - 0.9, O.y - 1.9, 0.2),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const purkinjeRight = useMemo(
    () => [
      new THREE.Vector3(O.x, O.y - 1.0, 0.35),
      new THREE.Vector3(O.x + 0.6, O.y - 1.5, 0.3),
      new THREE.Vector3(O.x + 0.9, O.y - 1.9, 0.2),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <group>
      {/* Nodo SA se enciende en la onda P (0–0.15) */}
      <ConductionNode position={sa} bpm={bpm} window={[0, 0.15]} label="Nodo SA" />
      {/* Nodo AV en el retraso PR (0.15–0.25) */}
      <ConductionNode position={av} bpm={bpm} window={[0.15, 0.25]} label="Nodo AV" />
      {/* Haz de His + Purkinje disparan en el QRS (0.25–0.4) */}
      <ConductionPath points={hisPath} bpm={bpm} window={[0.25, 0.34]} />
      <ConductionPath points={purkinjeLeft} bpm={bpm} window={[0.32, 0.4]} />
      <ConductionPath points={purkinjeRight} bpm={bpm} window={[0.32, 0.4]} />
    </group>
  );
}

/* ── Trazo ECG luminoso 3D en tiempo real (osciloscopio flotante) ────────── */
function ECGTrace({ bpm }: { bpm: number }) {
  const SAMPLES = 220;
  const WIDTH = 8.5;
  const X0 = 0.8; // borde izquierdo del trazo
  const Y0 = -0.2;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(SAMPLES * 3), []);
  const buffer = useRef<Float32Array>(new Float32Array(SAMPLES)); // historial de amplitudes
  const lastProg = useRef(0);
  const headMat = useRef<THREE.MeshStandardMaterial>(null);
  const head = useRef<THREE.Mesh>(null);

  useMemo(() => {
    for (let i = 0; i < SAMPLES; i++) {
      positions[i * 3] = X0 + (i / (SAMPLES - 1)) * WIDTH;
      positions[i * 3 + 1] = Y0;
      positions[i * 3 + 2] = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions]);

  useFrame((state) => {
    const prog = cycleProgress(state.clock.getElapsedTime(), bpm);
    // Detecta el paso por 0 (nuevo ciclo) sólo para robustez; muestreamos siempre.
    lastProg.current = prog;
    const amp = ecgAmplitude(prog);
    // desplaza el historial a la izquierda e inserta la nueva muestra al final
    const b = buffer.current;
    for (let i = 0; i < SAMPLES - 1; i++) b[i] = b[i + 1];
    b[SAMPLES - 1] = amp;
    for (let i = 0; i < SAMPLES; i++) {
      positions[i * 3 + 1] = Y0 + b[i] * 1.6;
    }
    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true;
      geomRef.current.computeBoundingSphere();
    }
    // cabezal luminoso al final del trazo
    if (head.current) {
      head.current.position.set(X0 + WIDTH, Y0 + b[SAMPLES - 1] * 1.6, 0);
    }
    if (headMat.current) {
      headMat.current.emissiveIntensity = 3 + Math.max(0, amp) * 8;
    }
  });

  return (
    <group position={[-0.2, 2.9, 0]}>
      {/* panel/rejilla del osciloscopio */}
      <mesh position={[X0 + WIDTH / 2, Y0, -0.15]}>
        <planeGeometry args={[WIDTH + 1.2, 3.6]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.55} />
      </mesh>
      {/* línea base */}
      <mesh position={[X0 + WIDTH / 2, Y0, -0.1]}>
        <boxGeometry args={[WIDTH, 0.01, 0.01]} />
        <meshBasicMaterial color="#164e63" transparent opacity={0.6} />
      </mesh>
      {/* trazo ECG luminoso */}
      <line>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={SAMPLES} />
        </bufferGeometry>
        <lineBasicMaterial color={ELECTRIC} transparent opacity={0.98} blending={THREE.AdditiveBlending} linewidth={2} />
      </line>
      {/* cabezal */}
      <mesh ref={head}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial ref={headMat} color={ELECTRIC} emissive={ELECTRIC} emissiveIntensity={3} />
      </mesh>
      <Html position={[X0 - 0.1, 1.55, 0]} distanceFactor={16}>
        <div className="text-[9px] font-black uppercase tracking-widest text-cyan-300/70 select-none pointer-events-none whitespace-nowrap">
          Trazo ECG • Derivación II
        </div>
      </Html>
    </group>
  );
}

/* ── Escena ──────────────────────────────────────────────────────────────── */
function Scene({ ritmoBPM }: { ritmoBPM: number; faseActual: Fase }) {
  const bpm = Math.max(30, Math.min(220, ritmoBPM));

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.5, 12]} fov={48} />
      <color attach="background" args={['#04060f']} />
      <fog attach="fog" args={['#04060f', 16, 38]} />

      <ambientLight intensity={0.32} />
      <hemisphereLight intensity={0.28} groundColor="#020617" />
      <directionalLight position={[5, 8, 6]} intensity={0.5} color="#fecdd3" />

      <BeatingHeart bpm={bpm} />
      <ConductionSystem bpm={bpm} />
      <ECGTrace bpm={bpm} />

      <Sparkles count={70} scale={[20, 12, 20]} size={2.2} speed={0.25} color="#fca5a5" opacity={0.4} />
      <Sparkles count={50} scale={[16, 10, 16]} size={2} speed={0.35} color="#67e8f9" opacity={0.35} />
      <Stars radius={90} depth={45} count={2800} factor={4} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={7}
        maxDistance={24}
        autoRotate={false}
        autoRotateSpeed={0.45}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
        target={[-1.6, 0.8, 0]}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.12} mipmapBlur intensity={1.7} radius={0.75} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function Electrocardiograma3DScene({
  ritmoBPM,
  faseActual,
}: {
  ritmoBPM: number;
  faseActual: Fase;
}) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene ritmoBPM={ritmoBPM} faseActual={faseActual} />
        </Suspense>
      </Canvas>
    </div>
  );
}
