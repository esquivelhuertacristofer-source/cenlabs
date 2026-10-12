"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Sparkles,
  Html,
  Float,
  ContactShadows,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ────────────────────────────────────────────────────────────────────────────
   SeleccionNatural3DScene — Ecosistema evolutivo 3D (polillas de Manchester).
   Biología real: selección natural dependiente del ambiente. Sobre un tronco
   (corteza) los fenotipos claro/oscuro tienen fitness inverso según el ambiente:
     · ambiente 'limpio'     → corteza clara → el fenotipo CLARO se camufla (apto)
     · ambiente 'industrial' → corteza hollín → el fenotipo OSCURO se camufla (apto)
   El alumno actúa como depredador. NINGUNA polilla se resalta: todas tienen el
   mismo material, brillo y aleteo; lo único que las delata es el contraste con
   la corteza (eso es justamente lo que se estudia).
   Todo deriva del estado REAL del store: { bugs, ambiente, generacion }.
──────────────────────────────────────────────────────────────────────────── */

type Bug = {
  id: number;
  tipo: 'clara' | 'oscura';
  x: number;      // 0..100 (posición del store en %)
  y: number;      // 0..100
  angle: number;
  cazada: boolean;
};

const CLARA = new THREE.Color('#e2e8f0'); // fenotipo claro (alelo recesivo q)
const OSCURA = new THREE.Color('#1e293b'); // fenotipo oscuro (alelo dominante p)
const CA_OFFSET = new THREE.Vector2(0.0006, 0.0006);
const FIELD = 16;   // extensión del terreno
const FIELD_Y = -1.4;

// Mapea x/y (%) del store a coordenadas 3D sobre el terreno.
function mapPos(x: number, y: number): [number, number, number] {
  const gx = THREE.MathUtils.mapLinear(x, 0, 100, -FIELD / 2, FIELD / 2);
  const gz = THREE.MathUtils.mapLinear(y, 0, 100, -FIELD / 2, FIELD / 2);
  return [gx, FIELD_Y, gz];
}

/* ── Un organismo (polilla). Se posa sobre la corteza y aletea. Mismo material
      y mismo movimiento para ambos fenotipos: solo cambia el color del ala. ─── */
function Organism({ bug, onHunt }: {
  bug: Bug; onHunt: (id: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const seed = useMemo(() => Math.random() * Math.PI * 2, []);
  const base = useMemo(() => mapPos(bug.x, bug.y), [bug.x, bug.y]);
  const color = bug.tipo === 'clara' ? CLARA : OSCURA;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // aleteo (idéntico para ambos fenotipos)
    const flap = Math.sin(t * 6 + seed) * 0.25;
    if (wingL.current) wingL.current.rotation.y = flap;
    if (wingR.current) wingR.current.rotation.y = -flap;
    // deriva suave sobre la corteza + flotación
    if (group.current) {
      group.current.position.x = base[0] + Math.sin(t * 0.4 + seed) * 0.35;
      group.current.position.z = base[2] + Math.cos(t * 0.35 + seed) * 0.35;
      group.current.position.y = base[1] + 0.25 + Math.sin(t * 1.2 + seed) * 0.08;
      group.current.rotation.y = bug.angle + Math.sin(t * 0.3 + seed) * 0.3;
    }
  });

  const hunt = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onHunt(bug.id);
  };

  return (
    <group ref={group} position={base} onClick={hunt}>
      {/* cuerpo */}
      <mesh castShadow>
        <capsuleGeometry args={[0.12, 0.42, 8, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.55}
          metalness={0.1}
        />
      </mesh>
      {/* alas */}
      <mesh ref={wingL} position={[-0.02, 0, 0]}>
        <planeGeometry args={[0.85, 0.6]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          metalness={0.15}
          side={THREE.DoubleSide}
          transparent
          opacity={0.96}
        />
      </mesh>
      <mesh ref={wingR} position={[0.02, 0, 0]}>
        <planeGeometry args={[0.85, 0.6]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          metalness={0.15}
          side={THREE.DoubleSide}
          transparent
          opacity={0.96}
        />
      </mesh>
    </group>
  );
}

/* ── Terreno / corteza cuyo tono cambia con el ambiente. ─────────────────────── */
function Terrain({ ambiente }: { ambiente: 'limpio' | 'industrial' }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null);
  const target = useMemo(
    () => new THREE.Color(ambiente === 'limpio' ? '#cbd5e1' : '#0b1120'),
    [ambiente],
  );
  useFrame(() => {
    if (ref.current) ref.current.color.lerp(target, 0.05);
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, FIELD_Y, 0]} receiveShadow>
      <circleGeometry args={[FIELD * 0.85, 64]} />
      <meshStandardMaterial
        ref={ref}
        color={ambiente === 'limpio' ? '#cbd5e1' : '#0b1120'}
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
}

/* ── Histograma flotante de FENOTIPOS vivos (no de alelos: los heterocigotos Cc
      son oscuros, así que % oscuras ≠ p). ────────────────────────────────────── */
function FrequencyBars({ p, q, generacion }: { p: number; q: number; generacion: number }) {
  const pPct = Math.round(p * 100);
  const qPct = Math.round(q * 100);
  return (
    <Html position={[0, 6.2, 0]} center distanceFactor={16} style={{ pointerEvents: 'none' }}>
      <div className="w-[260px] select-none font-['Outfit'] text-white">
        <div className="text-center text-[11px] font-black uppercase tracking-[0.25em] text-slate-300 mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          Gen {generacion} · Fenotipos vivos
        </div>
        <div className="flex gap-2 items-end h-24">
          <div className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="text-lg font-black text-blue-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{pPct}%</span>
            <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-700 to-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)]" style={{ height: `${Math.max(4, pPct * 0.7)}%` }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-300 mt-1">Oscuras</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-end h-full">
            <span className="text-lg font-black text-emerald-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">{qPct}%</span>
            <div className="w-full rounded-t-lg bg-gradient-to-t from-emerald-700 to-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.6)]" style={{ height: `${Math.max(4, qPct * 0.7)}%` }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300 mt-1">Claras</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ bugs, ambiente, generacion, onHunt }: {
  bugs: Bug[]; ambiente: 'limpio' | 'industrial'; generacion: number; onHunt: (id: number) => void;
}) {
  const vivos = useMemo(() => bugs.filter((b) => !b.cazada), [bugs]);

  const claras = vivos.filter((b) => b.tipo === 'clara').length;
  const oscuras = vivos.filter((b) => b.tipo === 'oscura').length;
  const q = claras / (claras + oscuras || 1);
  const p = 1 - q;

  const bg = ambiente === 'limpio' ? '#0a1220' : '#04060d';

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 7, 17]} fov={45} />
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 20, 46]} />

      <ambientLight intensity={ambiente === 'limpio' ? 0.6 : 0.28} />
      <hemisphereLight intensity={0.4} groundColor="#020617" />
      <directionalLight position={[8, 16, 6]} intensity={ambiente === 'limpio' ? 1.1 : 0.5} castShadow />

      <Terrain ambiente={ambiente} />

      {vivos.map((bug) => (
        <Organism key={bug.id} bug={bug} onHunt={onHunt} />
      ))}

      <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.3}>
        <FrequencyBars p={p} q={q} generacion={generacion} />
      </Float>

      <ContactShadows position={[0, FIELD_Y + 0.02, 0]} opacity={0.4} scale={FIELD * 1.6} blur={2.4} far={8} color="#000000" />

      <Sparkles
        count={ambiente === 'industrial' ? 120 : 50}
        scale={[FIELD * 1.4, 8, FIELD * 1.4]}
        size={ambiente === 'industrial' ? 4 : 2}
        speed={0.25}
        color={ambiente === 'industrial' ? '#64748b' : '#93c5fd'}
        opacity={ambiente === 'industrial' ? 0.5 : 0.35}
      />
      <Stars radius={90} depth={45} count={2600} factor={4} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={10}
        maxDistance={30}
        autoRotate={false}
        autoRotateSpeed={0.45}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.05}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.4} radius={0.7} />
        <ChromaticAberration offset={CA_OFFSET} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.0} />
      </EffectComposer>
    </>
  );
}

export default function SeleccionNatural3DScene({
  bugs,
  ambiente,
  generacion,
  onHunt,
}: {
  bugs: Bug[];
  ambiente: 'limpio' | 'industrial';
  generacion: number;
  onHunt: (id: number) => void;
}) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene bugs={bugs} ambiente={ambiente} generacion={generacion} onHunt={onHunt} />
        </Suspense>
      </Canvas>
    </div>
  );
}
