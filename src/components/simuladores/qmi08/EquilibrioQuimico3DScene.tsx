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
import { fraccionNO2, tonoMezclaNO2 } from '@/domain/quimica';

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
   Props: las TRES jeringas del store ({ id, temp, ubicacion }). Cada una se
   dibuja con su propio tinte: el alumno debe observar el color de cada jeringa,
   así que la escena no puede mostrar una media.
   La fracción de NO₂ es la de van 't Hoff del dominio (Kp298 = 0.148 atm,
   ΔH° = +57.2 kJ/mol): a 0 °C ≈ 0.13, a 20 °C ≈ 0.27 (ya ámbar, no incoloro) y a
   80 °C ≈ 0.86.
──────────────────────────────────────────────────────────────────────────── */

const REACTANT = new THREE.Color('#e2e8f0'); // N₂O₄ — gas incoloro (puntos claros)
const PRODUCT = new THREE.Color('#b45309'); // NO₂ — café rojizo
const REACTOR_R = 5.2;
const ABERRACION = new THREE.Vector2(0.0006, 0.0006);

type JeringaVista = { id: number; temp: number; ubicacion: 'mesa' | 'caliente' | 'hielo' };
const NOMBRE_BANO: Record<JeringaVista['ubicacion'], string> = { hielo: 'Hielo', mesa: 'Ambiente', caliente: 'Caliente' };

type Mol = {
  base: THREE.Vector3;   // posición angular estable en el reactor
  phase: number;         // fase de orbitación
  radius: number;        // radio orbital
  isProduct: boolean;    // población actual
};

/* ── Nube de moléculas interconvirtiéndose (equilibrio dinámico) ────────────── */
function MoleculeCloud({ target }: { target: number }) {
  const COUNT = 360;
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
function ReactorGlass({ target, tono }: { target: number; tono: string }) {
  const ref = useRef<THREE.Mesh>(null);
  // tinte real de la mezcla (casi incoloro → ámbar → café rojizo)
  const tint = useMemo(() => new THREE.Color(tono), [tono]);

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
          opacity={0.12 + target * 0.45}
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

/* ── Ecuación flotante N₂O₄ ⇌ 2NO₂ ──────────────────────────────────────────── */
function EquationBanner() {
  return (
    <Html center position={[0, REACTOR_R + 1.2, 0]} distanceFactor={14}>
      <div className="flex items-center gap-3 select-none pointer-events-none whitespace-nowrap">
        <span className="text-4xl font-black text-slate-200">N₂O₄</span>
        <span className="text-4xl font-black text-white">⇌</span>
        <span className="text-4xl font-black text-amber-600">2 NO₂</span>
      </div>
    </Html>
  );
}

/* ── Una jeringa (sistema cerrado) con su propio equilibrio ─────────────────── */
function SistemaJeringa({ jeringa, x }: { jeringa: JeringaVista; x: number }) {
  const target = fraccionNO2(jeringa.temp);
  const tono = tonoMezclaNO2(jeringa.temp);
  return (
    <group position={[x, 0, 0]} scale={0.55}>
      <ReactorGlass target={target} tono={tono} />
      <MoleculeCloud target={target} />
      <Html center position={[0, -(REACTOR_R + 1.6), 0]} distanceFactor={14}>
        <div className="select-none pointer-events-none whitespace-nowrap text-center">
          <div className="text-2xl font-black text-white">Jeringa #{jeringa.id}</div>
          <div className="text-xl font-bold text-slate-300">{NOMBRE_BANO[jeringa.ubicacion]} · {jeringa.temp.toFixed(1)} °C</div>
        </div>
      </Html>
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ jeringas }: { jeringas: JeringaVista[] }) {
  const separacion = 8.5;
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 20]} fov={45} />
      <color attach="background" args={['#04060f']} />
      <fog attach="fog" args={['#04060f', 22, 48]} />

      <ambientLight intensity={0.5} />
      <hemisphereLight intensity={0.35} groundColor="#020617" />
      <pointLight position={[0, 6, 8]} color="#ffffff" intensity={20} distance={40} />

      {jeringas.map((j, i) => (
        <SistemaJeringa key={j.id} jeringa={j} x={(i - (jeringas.length - 1) / 2) * separacion} />
      ))}
      <EquationBanner />

      <Sparkles count={50} scale={[24, 16, 24]} size={2.4} speed={0.35} color="#cbd5e1" opacity={0.3} />
      <Stars radius={90} depth={45} count={2800} factor={4} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={11}
        maxDistance={34}
        autoRotate={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.6}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.25} mipmapBlur intensity={1.2} radius={0.6} />
        <ChromaticAberration offset={ABERRACION} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function EquilibrioQuimico3DScene({ jeringas }: { jeringas: JeringaVista[] }) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene jeringas={jeringas} />
        </Suspense>
      </Canvas>
    </div>
  );
}
