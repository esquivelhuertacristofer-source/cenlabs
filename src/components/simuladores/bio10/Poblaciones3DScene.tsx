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
   Poblaciones3DScene — Ecosistema vivo Lotka–Volterra en 3D.
   Modelo (integrado con RK4 en el Piloto, mismo paso que el juez):
     dx/dt = α·x − β·x·y     (presas)
     dy/dt = δ·x·y − γ·y     (depredadores)
   El NÚMERO DE INSTANCIAS visibles de cada especie refleja N(t). Una curva N vs t
   flota en 3D dibujada desde `historial`. Lotka-Volterra clásico NO tiene
   capacidad de carga K (las presas crecen sin límite sin depredadores), así que
   no se dibuja ninguna asíntota ni hacinamiento.
   Props: { presas, depredadores, historial, simulando }.
──────────────────────────────────────────────────────────────────────────── */

type Punto = { t: number; presas: number; depredadores: number };

const PREY = new THREE.Color('#ec4899');   // presas
const PRED = new THREE.Color('#22d3ee');   // depredadores
const CA_OFFSET = new THREE.Vector2(0.0006, 0.0006);
const FIELD_R = 9;                          // radio del prado
const MAX_PREY = 220;                       // tope de esferas de presa
const MAX_PRED = 90;                        // tope de esferas de depredador

// Distribuye n puntos en el disco del prado (semillas estables por índice).
function discoSeeds(max: number) {
  const arr: { x: number; z: number; phase: number; wob: number }[] = [];
  for (let i = 0; i < max; i++) {
    const a = i * 2.399963; // ángulo áureo → reparto uniforme
    const r = Math.sqrt((i + 0.5) / max) * FIELD_R;
    arr.push({
      x: Math.cos(a) * r,
      z: Math.sin(a) * r,
      phase: Math.random() * Math.PI * 2,
      wob: 0.6 + Math.random() * 0.9,
    });
  }
  return arr;
}

/* ── Enjambre de organismos (instancias). visibles = N escalado. ──────────────── */
function Swarm({
  count,
  max,
  baseColor,
  isPredator,
}: {
  count: number;
  max: number;
  baseColor: THREE.Color;
  isPredator: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => discoSeeds(max), [max]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const visible = Math.min(count, max);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.getElapsedTime();
    const squeeze = 1;
    for (let i = 0; i < max; i++) {
      const s = seeds[i];
      if (i < visible) {
        const bob = Math.sin(t * s.wob + s.phase) * (isPredator ? 0.5 : 0.25);
        const drift = isPredator ? Math.sin(t * 0.4 + s.phase) * 0.6 : 0;
        dummy.position.set(
          s.x * squeeze + drift,
          (isPredator ? 1.6 : 0.6) + bob,
          s.z * squeeze + Math.cos(t * 0.4 + s.phase) * (isPredator ? 0.6 : 0),
        );
        const sc = (isPredator ? 0.42 : 0.3) * (1 + Math.sin(t * 2 + s.phase) * 0.08);
        dummy.scale.setScalar(sc);
        dummy.rotation.y = t * (isPredator ? 0.8 : 0.2) + s.phase;
      } else {
        dummy.scale.setScalar(0.0001); // ocultar sin cambiar count
      }
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, max]} castShadow>
      {isPredator ? (
        <coneGeometry args={[0.5, 1.1, 6]} />
      ) : (
        <sphereGeometry args={[0.5, 14, 14]} />
      )}
      <meshStandardMaterial
        color={baseColor}
        emissive={baseColor}
        emissiveIntensity={1.1}
        roughness={0.35}
        metalness={0.2}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ── Curva flotante N vs tiempo (presas y depredadores) desde `historial`. ────── */
function GrowthCurve({
  historial,
  which,
  color,
  maxPop,
}: {
  historial: Punto[];
  which: 'presas' | 'depredadores';
  color: string;
  maxPop: number;
}) {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const COUNT = 200; // vértices máximos de la traza
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);

  const PANEL_W = 12;   // ancho del gráfico en el mundo
  const PANEL_H = 6;    // alto
  const PANEL_Y = 6.5;  // altura de flotación
  const PANEL_Z = -9;   // detrás del prado

  useFrame(() => {
    const geom = geomRef.current;
    if (!geom) return;
    const data = historial.slice(-COUNT);
    const n = data.length;
    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      if (i < n && n > 1) {
        const v = which === 'presas' ? data[i].presas : data[i].depredadores;
        positions[ix] = (i / (n - 1) - 0.5) * PANEL_W;
        positions[ix + 1] = PANEL_Y + (THREE.MathUtils.clamp(v, 0, maxPop) / maxPop) * PANEL_H;
        positions[ix + 2] = PANEL_Z;
      } else {
        // colapsa los vértices sobrantes al primer punto para no dibujar basura
        const j = Math.max(0, (n - 1)) * 3;
        positions[ix] = positions[j] || -PANEL_W / 2;
        positions[ix + 1] = positions[j + 1] || PANEL_Y;
        positions[ix + 2] = PANEL_Z;
      }
    }
    geom.attributes.position.needsUpdate = true;
    geom.setDrawRange(0, Math.max(2, Math.min(n, COUNT)));
  });

  return (
    <line>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.95} toneMapped={false} />
    </line>
  );
}

/* ── Panel del gráfico: marco y etiquetas HTML. ───────────────────────────────── */
function CurvePanel({ historial, maxPop }: { historial: Punto[]; maxPop: number }) {
  const PANEL_W = 12;
  const PANEL_H = 6;
  const PANEL_Y = 6.5;
  const PANEL_Z = -9;

  return (
    <group>
      {/* fondo translúcido del gráfico */}
      <mesh position={[0, PANEL_Y + PANEL_H / 2, PANEL_Z - 0.05]}>
        <planeGeometry args={[PANEL_W + 1.2, PANEL_H + 1.4]} />
        <meshBasicMaterial color="#0b1120" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>

      {/* eje base (t) */}
      <mesh position={[0, PANEL_Y, PANEL_Z]}>
        <boxGeometry args={[PANEL_W, 0.03, 0.03]} />
        <meshBasicMaterial color="#334155" />
      </mesh>
      {/* eje vertical (N) */}
      <mesh position={[-PANEL_W / 2, PANEL_Y + PANEL_H / 2, PANEL_Z]}>
        <boxGeometry args={[0.03, PANEL_H, 0.03]} />
        <meshBasicMaterial color="#334155" />
      </mesh>

      <GrowthCurve historial={historial} which="presas" color="#ec4899" maxPop={maxPop} />
      <GrowthCurve historial={historial} which="depredadores" color="#22d3ee" maxPop={maxPop} />

      <Html position={[PANEL_W / 2 + 0.6, PANEL_Y + PANEL_H, PANEL_Z]} center distanceFactor={16}>
        <div className="text-[11px] font-black text-slate-400 select-none pointer-events-none whitespace-nowrap drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
          {Math.round(maxPop)}
        </div>
      </Html>
      <Html position={[-PANEL_W / 2 - 0.2, PANEL_Y + PANEL_H + 0.4, PANEL_Z]} center distanceFactor={16}>
        <div className="text-[11px] font-black text-slate-300 uppercase tracking-widest select-none pointer-events-none whitespace-nowrap drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
          N vs t · Lotka-Volterra
        </div>
      </Html>
    </group>
  );
}

/* ── Prado / terreno del ecosistema. ─────────────────────────────────────────── */
function Terrain() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <circleGeometry args={[FIELD_R + 1.5, 64]} />
      <meshStandardMaterial
        color="#062017"
        emissive="#0e7c53"
        emissiveIntensity={0.15}
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ presas, depredadores, historial, simulando }: SceneProps) {
  // Escala vertical de la curva: el máximo observado (mín. 50) con un 10 % de margen.
  const maxPop = useMemo(() => {
    let m = Math.max(50, presas, depredadores);
    for (const h of historial) m = Math.max(m, h.presas, h.depredadores);
    return Math.min(5000, m * 1.1);
  }, [historial, presas, depredadores]);

  // Escala N(t) → nº de instancias visibles (≤ tope razonable).
  const preyCount = Math.round(THREE.MathUtils.clamp((presas / 300) * MAX_PREY, 0, MAX_PREY));
  const predCount = Math.round(THREE.MathUtils.clamp((depredadores / 300) * MAX_PRED, 0, MAX_PRED));


  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 8, 20]} fov={46} />
      <color attach="background" args={['#02040a']} />
      <fog attach="fog" args={['#02040a', 24, 52]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#123', '#010409', 0.5]} />
      <directionalLight position={[8, 16, 6]} intensity={1.1} color="#e0f2fe" castShadow />
      <Terrain />

      <Swarm count={preyCount} max={MAX_PREY} baseColor={PREY} isPredator={false} />
      <Swarm count={predCount} max={MAX_PRED} baseColor={PRED} isPredator />

      <CurvePanel historial={historial} maxPop={maxPop} />

      <Sparkles
        count={simulando ? 90 : 40}
        scale={[FIELD_R * 2.2, 10, FIELD_R * 2.2]}
        size={2}
        speed={simulando ? 0.5 : 0.2}
        color="#a7f3d0"
        opacity={0.45}
      />
      <Stars radius={90} depth={45} count={2800} factor={4} saturation={0} fade speed={0.6} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={11}
        maxDistance={34}
        autoRotate={false}
        autoRotateSpeed={0.45}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 3, -2]}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.7} />
        <ChromaticAberration offset={CA_OFFSET} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

interface SceneProps {
  presas: number;
  depredadores: number;
  historial: Punto[];
  simulando: boolean;
}

export default function Poblaciones3DScene(props: SceneProps) {
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
