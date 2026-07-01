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
   MotorElectrico3DScene — Motor de corriente continua (DC) volumétrico.
   Física real: una espira portadora de corriente I en un campo magnético B
   experimenta un torque τ = N·B·I·A·sinθ (fuerza de Laplace F = I·L×B sobre
   cada lado de la bobina). El conmutador invierte la corriente cada media vuelta
   para mantener el sentido de giro. La velocidad angular deriva de las RPM
   REALES del store (signo = sentido, magnitud = |rpm|).
   Props idénticos a los datos del store: { voltaje, campoB, espiras, rpm, encendido }.
──────────────────────────────────────────────────────────────────────────── */

const COPPER = new THREE.Color('#e8873a');       // cobre incandescente
const COPPER_HOT = new THREE.Color('#ffd28a');   // cobre sobrecalentado
const N_COLOR = '#ef4444';                        // polo Norte (rojo)
const S_COLOR = '#3b82f6';                        // polo Sur (azul)

const MAG_X = 3.2;   // separación de los polos del imán
const COIL_R = 1.55; // radio aparente de la bobina

/* ── Líneas de campo magnético entre los polos (curvas luminosas) ───────────── */
function FieldLines({ B, encendido }: { B: number; encendido: boolean }) {
  // B = +1 → N(izq) a S(der); B = -1 → S(izq) a N(der); B = 0 → polos iguales (sin flujo neto)
  const lines = useMemo(() => {
    const arr: THREE.Vector3[][] = [];
    if (B === 0) return arr;
    const rows = 5;
    for (let r = 0; r < rows; r++) {
      const y = THREE.MathUtils.mapLinear(r, 0, rows - 1, -1.1, 1.1);
      const bow = 0.6 + Math.abs(y) * 0.4;
      const pts: THREE.Vector3[] = [];
      const seg = 40;
      for (let s = 0; s <= seg; s++) {
        const t = s / seg;
        const x = THREE.MathUtils.lerp(-MAG_X + 0.55, MAG_X - 0.55, t);
        const z = Math.sin(t * Math.PI) * bow * (r % 2 === 0 ? 1 : -1);
        pts.push(new THREE.Vector3(x, y, z));
      }
      arr.push(pts);
    }
    return arr;
  }, [B]);

  const geoms = useMemo(
    () => lines.map((pts) => new THREE.BufferGeometry().setFromPoints(pts)),
    [lines],
  );

  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.children.forEach((c, i) => {
      const mat = (c as THREE.Line).material as THREE.LineBasicMaterial;
      mat.opacity = (encendido ? 0.55 : 0.28) + Math.sin(t * 2 + i) * 0.12;
    });
  });

  const fieldColor = B > 0 ? '#93c5fd' : '#fca5a5';

  return (
    <group ref={groupRef}>
      {geoms.map((g, i) => (
        <primitive
          key={i}
          object={new THREE.Line(
            g,
            new THREE.LineBasicMaterial({
              color: fieldColor,
              transparent: true,
              opacity: 0.4,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          )}
        />
      ))}
    </group>
  );
}

/* ── Polo del imán (bloque N o S con etiqueta y halo) ───────────────────────── */
function MagnetPole({ x, pole }: { x: number; pole: 'N' | 'S' }) {
  const color = pole === 'N' ? N_COLOR : S_COLOR;
  const faceDir = x < 0 ? 1 : -1; // cara enfrentada hacia el centro
  return (
    <group position={[x, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.1, 3.4, 2.4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          roughness={0.35}
          metalness={0.65}
        />
      </mesh>
      {/* cara polar luminosa mirando a la bobina */}
      <mesh position={[faceDir * 0.58, 0, 0]} rotation={[0, faceDir > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <planeGeometry args={[2.2, 3.2]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <pointLight color={color} intensity={7} distance={9} position={[faceDir * 0.8, 0, 0]} />
      <Html center distanceFactor={11} position={[faceDir * 0.62, 0, 0]}>
        <div className="text-4xl font-black select-none pointer-events-none text-white drop-shadow-[0_0_12px_rgba(0,0,0,0.9)]">
          {pole}
        </div>
      </Html>
    </group>
  );
}

/* ── Bobina de cobre giratoria (rotor) ──────────────────────────────────────── */
function Coil({ angularVel, espiras, hot, current }: {
  angularVel: number; espiras: number; hot: boolean; current: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.05);
    ref.current.rotation.x += angularVel * dt; // gira sobre el eje X (eje del motor)
  });

  // nº de vueltas de alambre representadas (escala visual del bobinado)
  const turns = Math.max(1, Math.min(6, Math.round(espiras / 18)));
  const baseColor = hot ? COPPER_HOT : COPPER;
  const emissive = hot ? '#ff3b1f' : '#ff7a1a';
  const emissiveIntensity = hot ? 3.2 : 0.6 + Math.min(1.4, current * 0.9);

  const wireMat = useMemo(
    () => (
      <meshStandardMaterial
        color={baseColor}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.2}
        metalness={0.95}
      />
    ),
    [baseColor, emissive, emissiveIntensity],
  );

  return (
    <group ref={ref}>
      {/* eje del rotor */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.11, 0.11, MAG_X * 2 + 1.2, 20]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={1} />
      </mesh>

      {/* espiras rectangulares apiladas (bobinado sobre el rotor) */}
      {Array.from({ length: turns }).map((_, i) => {
        const off = (i - (turns - 1) / 2) * 0.16;
        return (
          <group key={i} position={[off, 0, 0]}>
            {/* lado superior (paralelo al eje) */}
            <mesh position={[0, COIL_R, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 2.6, 12]} />
              {wireMat}
            </mesh>
            {/* lado inferior */}
            <mesh position={[0, -COIL_R, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 2.6, 12]} />
              {wireMat}
            </mesh>
            {/* conexiones frontal / trasera (cierran la espira) */}
            <mesh position={[1.3, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, COIL_R * 2, 12]} />
              {wireMat}
            </mesh>
            <mesh position={[-1.3, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, COIL_R * 2, 12]} />
              {wireMat}
            </mesh>
          </group>
        );
      })}

      {/* núcleo del rotor */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 2.6, 24]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.8} emissive={hot ? '#7f1d1d' : '#000'} emissiveIntensity={hot ? 1.5 : 0} />
      </mesh>

      {/* partículas de corriente viajando por el alambre superior/inferior */}
      <CurrentInWire current={current} />
    </group>
  );
}

/* ── Corriente fluyendo por el alambre de la bobina (partículas) ────────────── */
function CurrentInWire({ current }: { current: number }) {
  const COUNT = 40;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(COUNT * 3), []);
  const phase = useMemo(() => Array.from({ length: COUNT }).map(() => Math.random()), []);

  useFrame((state) => {
    if (!geomRef.current || current <= 0.001) {
      if (geomRef.current) geomRef.current.attributes.position.needsUpdate = true;
      return;
    }
    const t = state.clock.getElapsedTime();
    const speed = 0.25 + current * 0.9;
    for (let i = 0; i < COUNT; i++) {
      // recorrido perimetral de la espira (4 tramos) como parámetro 0..1
      const u = (phase[i] + t * speed) % 1;
      let x: number, y: number;
      if (u < 0.25) { x = -1.3 + (u / 0.25) * 2.6; y = COIL_R; }
      else if (u < 0.5) { x = 1.3; y = COIL_R - ((u - 0.25) / 0.25) * COIL_R * 2; }
      else if (u < 0.75) { x = 1.3 - ((u - 0.5) / 0.25) * 2.6; y = -COIL_R; }
      else { x = -1.3; y = -COIL_R + ((u - 0.75) / 0.25) * COIL_R * 2; }
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 0;
    }
    geomRef.current.attributes.position.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color="#fde047"
        transparent
        opacity={Math.min(1, 0.3 + current)}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Conmutador + escobillas con chispas ────────────────────────────────────── */
function Commutator({ angularVel, spinning }: { angularVel: number; spinning: boolean }) {
  const drumRef = useRef<THREE.Group>(null);
  const sparkRef = useRef<THREE.Points>(null);
  const SPARKS = 24;
  const sparkPos = useMemo(() => new Float32Array(SPARKS * 3), []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (drumRef.current) drumRef.current.rotation.x += angularVel * dt;
    // chispas en el contacto escobilla-conmutador
    if (sparkRef.current) {
      const geom = sparkRef.current.geometry;
      for (let i = 0; i < SPARKS; i++) {
        if (spinning && Math.random() < 0.5) {
          sparkPos[i * 3] = (Math.random() - 0.5) * 0.3;
          sparkPos[i * 3 + 1] = 0.55 + Math.random() * 0.45;
          sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        } else {
          sparkPos[i * 3 + 1] = -100; // fuera de vista
        }
      }
      geom.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[-(MAG_X + 0.9), 0, 0]}>
      {/* tambor del conmutador (dos segmentos) */}
      <group ref={drumRef}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.7, 24, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#f59e0b" metalness={1} roughness={0.25} emissive="#b45309" emissiveIntensity={0.4} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.7, 24, 1, false, Math.PI, Math.PI]} />
          <meshStandardMaterial color="#d97706" metalness={1} roughness={0.25} emissive="#78350f" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* escobillas de carbón (arriba y abajo) */}
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.35]} />
        <meshStandardMaterial color="#111827" roughness={0.9} metalness={0.2} />
      </mesh>
      <mesh position={[0, -0.62, 0]}>
        <boxGeometry args={[0.5, 0.35, 0.35]} />
        <meshStandardMaterial color="#111827" roughness={0.9} metalness={0.2} />
      </mesh>

      {/* chispas */}
      <points ref={sparkRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkPos, 3]} count={SPARKS} />
        </bufferGeometry>
        <pointsMaterial size={0.13} color="#fff7cc" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  );
}

/* ── Vector de torque (eje) + par de fuerzas de Laplace sobre la bobina ─────── */
function TorqueVector({ rpm, B }: { rpm: number; B: number }) {
  // el torque apunta a lo largo del eje del motor (+X o −X según el sentido de giro)
  const cw = rpm > 0;
  const dir = cw ? 1 : -1;
  const len = THREE.MathUtils.clamp(0.8 + Math.log10(Math.abs(rpm) + 1) * 0.9, 0.8, 3.6);
  const x0 = (MAG_X + 1.6) * dir;

  return (
    <group position={[x0, 0, 0]} rotation={[0, 0, dir > 0 ? -Math.PI / 2 : Math.PI / 2]}>
      <mesh position={[0, len / 2, 0]}>
        <cylinderGeometry args={[0.05, 0.05, len, 12]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} />
      </mesh>
      <mesh position={[0, len + 0.18, 0]}>
        <coneGeometry args={[0.17, 0.44, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} />
      </mesh>
      <Html center distanceFactor={12} position={[0, len + 0.7, 0]}>
        <div className="text-[10px] font-black uppercase tracking-widest text-cyan-300 select-none pointer-events-none drop-shadow-[0_0_8px_rgba(0,0,0,0.9)]">
          τ {B > 0 ? '(N→S)' : '(S→N)'}
        </div>
      </Html>
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ voltaje, campoB, espiras, rpm, encendido }: {
  voltaje: number; campoB: number; espiras: number; rpm: number; encendido: boolean;
}) {
  const spinning = encendido && Math.abs(rpm) > 0;
  // velocidad angular en rad/s (visualmente escalada desde las RPM reales)
  const angularVel = spinning ? (rpm / 60) * Math.PI * 2 * 0.06 : 0;
  const current = encendido ? THREE.MathUtils.clamp(voltaje / 24, 0, 1) : 0;
  const isHot = encendido && campoB === 0 && voltaje > 0; // motor bloqueado → sobrecalienta

  // polos: campoB +1 → N(izq)/S(der); −1 → S(izq)/N(der); 0 → mismos polos (N/N)
  const leftPole: 'N' | 'S' = campoB >= 0 ? 'N' : 'S';
  const rightPole: 'N' | 'S' = campoB > 0 ? 'S' : 'N';

  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 4.5, 12]} fov={45} />
      <color attach="background" args={['#03040a']} />
      <fog attach="fog" args={['#03040a', 20, 44]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight intensity={0.35} groundColor="#020617" />
      <directionalLight position={[6, 10, 8]} intensity={0.8} />

      <MagnetPole x={-MAG_X} pole={leftPole} />
      <MagnetPole x={MAG_X} pole={rightPole} />

      <FieldLines B={campoB} encendido={encendido} />

      <Coil angularVel={angularVel} espiras={espiras} hot={isHot} current={current} />
      <Commutator angularVel={angularVel} spinning={spinning} />

      {spinning && <TorqueVector rpm={rpm} B={campoB} />}

      {/* base / bancada del motor */}
      <mesh position={[0, -2.1, 0]} receiveShadow>
        <boxGeometry args={[MAG_X * 2 + 4, 0.3, 4]} />
        <meshStandardMaterial color="#0b1220" roughness={0.6} metalness={0.5} />
      </mesh>

      <Sparkles count={70} scale={[16, 9, 16]} size={2} speed={spinning ? 0.6 : 0.25} color={isHot ? '#fca5a5' : '#fdba74'} opacity={0.4} />
      <Stars radius={80} depth={40} count={2500} factor={4} saturation={0} fade speed={0.6} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={7}
        maxDistance={26}
        autoRotate={false}
        autoRotateSpeed={0.5}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.15} mipmapBlur intensity={isHot ? 2.2 : 1.5} radius={0.7} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function MotorElectrico3DScene({
  voltaje,
  campoB,
  espiras,
  rpm,
  encendido,
}: {
  voltaje: number;
  campoB: number;
  espiras: number;
  rpm: number;
  encendido: boolean;
}) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene voltaje={voltaje} campoB={campoB} espiras={espiras} rpm={rpm} encendido={encendido} />
        </Suspense>
      </Canvas>
    </div>
  );
}
