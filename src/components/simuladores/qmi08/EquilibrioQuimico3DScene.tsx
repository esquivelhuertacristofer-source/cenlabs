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
   EquilibrioQuimico3DScene — Reactor de equilibrio dinámico N₂O₄ ⇌ 2NO₂.
   Química real (reacción ENDOTÉRMICA hacia la derecha):
     · N₂O₄ (incoloro/frío)  ⇌  2 NO₂ (café/caliente)
     · Le Châtelier: subir T desplaza el equilibrio → productos (más NO₂, más café).
       bajar T desplaza → reactivos (más N₂O₄, incoloro).
   El "grado de avance" (fracción de moléculas convertidas a NO₂) se deriva de la
   TEMPERATURA REAL de las jeringas del store. Cada molécula del reactor decide,
   frame a frame, en qué población está: si la fracción-producto sube, moléculas
   cruzan de reactivo→producto (y viceversa) → equilibrio dinámico visible.
   Props idénticos a los datos del store: { temp } (media de las jeringas 0–80°C).
──────────────────────────────────────────────────────────────────────────── */

const REACTANT = new THREE.Color('#67e8f9'); // N₂O₄ — cian frío (incoloro idealizado)
const PRODUCT = new THREE.Color('#f97316'); // 2NO₂ — café/naranja caliente
const REACTOR_R = 5.2;

// Fracción de avance hacia productos (0 = todo N₂O₄, 1 = todo NO₂) según T (0–80°C)
function productFraction(temp: number) {
  const t = THREE.MathUtils.clamp(temp, 0, 80) / 80;
  // curva tipo Van't Hoff suavizada: endotérmica → crece con T
  return THREE.MathUtils.clamp(0.12 + t * 0.78, 0, 1);
}

type Mol = {
  base: THREE.Vector3;   // posición angular estable en el reactor
  phase: number;         // fase de orbitación
  radius: number;        // radio orbital
  isProduct: boolean;    // población actual
};

/* ── Nube de moléculas interconvirtiéndose (equilibrio dinámico) ────────────── */
function MoleculeCloud({ target }: { target: number }) {
  const COUNT = 720;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const colors = useMemo(() => new Float32Array(COUNT * 3), []);

  const mols = useMemo<Mol[]>(() => {
    const arr: Mol[] = [];
    for (let i = 0; i < COUNT; i++) {
      // distribución esférica dentro del reactor
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = REACTOR_R * Math.cbrt(Math.random());
      const base = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi) * 0.72,
        r * Math.sin(phi) * Math.sin(theta),
      );
      arr.push({
        base,
        phase: Math.random() * Math.PI * 2,
        radius: 0.15 + Math.random() * 0.35,
        isProduct: Math.random() < 0.12,
      });
    }
    return arr;
  }, []);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);

    // ¿cuántas moléculas deberían ser producto ahora?
    let productCount = 0;
    for (const m of mols) if (m.isProduct) productCount++;
    const desired = Math.round(target * COUNT);
    const diff = desired - productCount;
    // tasa de conversión proporcional al desequilibrio → relajación hacia el objetivo
    const flips = Math.min(Math.abs(diff), Math.max(1, Math.round(Math.abs(diff) * dt * 2.2)));
    if (diff > 0) {
      // convertir reactivo → producto (forward)
      for (let n = 0, tried = 0; n < flips && tried < COUNT * 2; tried++) {
        const idx = (Math.random() * COUNT) | 0;
        if (!mols[idx].isProduct) { mols[idx].isProduct = true; n++; }
      }
    } else if (diff < 0) {
      for (let n = 0, tried = 0; n < flips && tried < COUNT * 2; tried++) {
        const idx = (Math.random() * COUNT) | 0;
        if (mols[idx].isProduct) { mols[idx].isProduct = false; n++; }
      }
    }

    for (let i = 0; i < COUNT; i++) {
      const m = mols[i];
      const ix = i * 3;
      // orbitación viva alrededor de su base → movimiento browniano ordenado
      const wobble = Math.sin(t * 1.3 + m.phase) * m.radius;
      const wob2 = Math.cos(t * 0.9 + m.phase * 1.7) * m.radius;
      tmp.set(
        m.base.x + wobble,
        m.base.y + wob2 * 0.8 + Math.sin(t * 0.6 + m.phase) * 0.25,
        m.base.z + Math.cos(t * 1.1 + m.phase) * m.radius,
      );
      positions[ix] = tmp.x;
      positions[ix + 1] = tmp.y;
      positions[ix + 2] = tmp.z;

      const c = m.isProduct ? PRODUCT : REACTANT;
      // parpadeo sutil para dar vida
      const flick = 0.82 + Math.sin(t * 4 + m.phase) * 0.18;
      colors[ix] = c.r * flick;
      colors[ix + 1] = c.g * flick;
      colors[ix + 2] = c.b * flick;
    }
    void dt;

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
        size={0.22}
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

/* ── Envolvente de cristal del reactor (matraz esférico) ────────────────────── */
function ReactorGlass({ target }: { target: number }) {
  const ref = useRef<THREE.Mesh>(null);
  // el tinte del gas dentro del matraz va de incoloro a café según el avance
  const tint = useMemo(() => REACTANT.clone().lerp(PRODUCT, target), [target]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.08;
    }
  });

  return (
    <group>
      {/* gas volumétrico teñido */}
      <mesh>
        <sphereGeometry args={[REACTOR_R + 0.6, 48, 48]} />
        <meshBasicMaterial
          color={tint}
          transparent
          opacity={0.06 + target * 0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>
      {/* cristal del matraz */}
      <mesh ref={ref}>
        <sphereGeometry args={[REACTOR_R + 0.7, 64, 64]} />
        <meshStandardMaterial
          color="#dbeafe"
          transparent
          opacity={0.05}
          roughness={0.05}
          metalness={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* anillo ecuatorial luminoso */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[REACTOR_R + 0.7, 0.05, 16, 96]} />
        <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
}

/* ── Ecuación luminosa flotante N₂O₄ ⇌ 2NO₂ ─────────────────────────────────── */
function EquationBanner({ target }: { target: number }) {
  return (
    <Html center position={[0, REACTOR_R + 2.4, 0]} distanceFactor={14}>
      <div className="flex items-center gap-3 select-none pointer-events-none whitespace-nowrap">
        <span
          className="text-4xl font-black drop-shadow-[0_0_14px_rgba(103,232,249,0.7)]"
          style={{ color: '#67e8f9', opacity: 0.6 + (1 - target) * 0.4 }}
        >
          N₂O₄
        </span>
        <span className="text-4xl font-black text-white drop-shadow-[0_0_16px_rgba(255,255,255,0.6)]">⇌</span>
        <span
          className="text-4xl font-black drop-shadow-[0_0_14px_rgba(249,115,22,0.8)]"
          style={{ color: '#f97316', opacity: 0.6 + target * 0.4 }}
        >
          2 NO₂
        </span>
      </div>
    </Html>
  );
}

/* ── Balanza de desplazamiento del equilibrio ───────────────────────────────── */
function EquilibriumScale({ target }: { target: number }) {
  const beamRef = useRef<THREE.Group>(null);
  // desplazamiento: -1 (reactivos) .. +1 (productos)
  const shift = target * 2 - 1;

  useFrame(() => {
    if (beamRef.current) {
      const goal = -shift * 0.42; // inclina hacia el lado dominante
      beamRef.current.rotation.z += (goal - beamRef.current.rotation.z) * 0.08;
    }
  });

  const Y = -(REACTOR_R + 2.2);

  return (
    <group position={[0, Y, 0]}>
      {/* pivote */}
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.35, 0.9, 4]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.3} />
      </mesh>
      <group ref={beamRef} position={[0, 0.8, 0]}>
        {/* brazo */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 6.4, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} emissive="#1e293b" emissiveIntensity={0.5} />
        </mesh>
        {/* platillo reactivos (izq) */}
        <mesh position={[-3, -0.5, 0]}>
          <sphereGeometry args={[0.55, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color={REACTANT.getStyle()} emissive={REACTANT.getStyle()} emissiveIntensity={1.4 + (1 - target) * 1.6} metalness={0.5} roughness={0.3} />
        </mesh>
        {/* platillo productos (der) */}
        <mesh position={[3, -0.5, 0]}>
          <sphereGeometry args={[0.55, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color={PRODUCT.getStyle()} emissive={PRODUCT.getStyle()} emissiveIntensity={1.4 + target * 1.6} metalness={0.5} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ temp }: { temp: number }) {
  const target = productFraction(temp);
  const warm = target; // 0 frío → 1 caliente

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 20]} fov={45} />
      <color attach="background" args={['#04060f']} />
      <fog attach="fog" args={['#04060f', 22, 48]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight intensity={0.35} groundColor="#020617" />
      {/* luz que cambia de fría a cálida con el desplazamiento */}
      <pointLight
        position={[0, 0, 0]}
        color={REACTANT.clone().lerp(PRODUCT, warm).getStyle()}
        intensity={16 + warm * 14}
        distance={26}
      />

      <ReactorGlass target={target} />
      <MoleculeCloud target={target} />
      <EquationBanner target={target} />
      <EquilibriumScale target={target} />

      <Sparkles count={70} scale={[24, 16, 24]} size={2.4} speed={0.35} color={warm > 0.5 ? '#fdba74' : '#a5f3fc'} opacity={0.4} />
      <Stars radius={90} depth={45} count={2800} factor={4} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={11}
        maxDistance={34}
        autoRotate
        autoRotateSpeed={0.55}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.6}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.6} radius={0.72} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function EquilibrioQuimico3DScene({ temp }: { temp: number }) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene temp={temp} />
        </Suspense>
      </Canvas>
    </div>
  );
}
