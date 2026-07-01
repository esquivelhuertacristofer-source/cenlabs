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
   Derivadas3DScene — La derivada como límite geométrico, en 3D premium.
   Concepto real (idéntico a la telemetría del Piloto):
     s(t) = -0.1t³ + 1.5t²          (posición del cohete → curva cian luminosa)
     v(t) = s'(t) = -0.3t² + 3t     (pendiente de la recta tangente en t)
   La TANGENTE magenta se apoya en (t, s(t)) con pendiente v(t) REAL.
   La SECANTE ámbar une (t, s(t)) con (t+h, s(t+h)); h decrece con useFrame para
   mostrar EN VIVO el límite h→0 ⇒ la secante converge a la tangente (la derivada).
   El punto x₀ resaltado con glow. Props derivados del estado REAL del Piloto: { t }.
──────────────────────────────────────────────────────────────────────────── */

// Funciones de la telemetría (consistentes con PilotoDerivadas)
const sFn = (t: number) => -0.1 * Math.pow(t, 3) + 1.5 * Math.pow(t, 2);
const vFn = (t: number) => -0.3 * Math.pow(t, 2) + 3 * t; // s'(t) = pendiente tangente

const T_MIN = 0;
const T_MAX = 10;

// Escalas mundo: mapea dominio t→x y recorrido s→y a un espacio 3D agradable.
const X_SPAN = 14; // ancho del eje t en el mundo
const Y_SCALE = 0.42; // compresión vertical (s(t) alcanza ~25 en t≈10)
const Y_BASE = -3.4; // desplaza la curva hacia abajo para dejar aire arriba

function tToWorldX(t: number) {
  return THREE.MathUtils.mapLinear(t, T_MIN, T_MAX, -X_SPAN / 2, X_SPAN / 2);
}
function sToWorldY(s: number) {
  return s * Y_SCALE + Y_BASE;
}
function worldPoint(t: number) {
  return new THREE.Vector3(tToWorldX(t), sToWorldY(sFn(t)), 0);
}
// pendiente en coordenadas de MUNDO (incluye ambas escalas): dY/dX
const X_PER_T = X_SPAN / (T_MAX - T_MIN);
function worldSlopeAt(t: number) {
  return (vFn(t) * Y_SCALE) / X_PER_T;
}

const CYAN = '#22d3ee'; // curva f(x)
const MAGENTA = '#f472b6'; // tangente
const AMBER = '#fbbf24'; // secante

/* ── Curva f(x) luminosa (puntos + línea generados de la función REAL) ───────── */
function FunctionCurve() {
  const positions = useMemo(() => {
    const SEG = 240;
    const arr = new Float32Array((SEG + 1) * 3);
    for (let i = 0; i <= SEG; i++) {
      const t = THREE.MathUtils.lerp(T_MIN, T_MAX, i / SEG);
      const p = worldPoint(t);
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    }
    return arr;
  }, []);

  const count = positions.length / 3;
  const ptsRef = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ptsRef.current) {
      const mat = ptsRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.18;
    }
  });

  return (
    <points ref={ptsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        size={0.16}
        color={CYAN}
        transparent
        opacity={0.95}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Segmento de recta grueso (cilindro) entre dos puntos ───────────────────── */
function Segment({ a, b, color, radius = 0.045, emissive = 3, opacity = 1 }: {
  a: THREE.Vector3; b: THREE.Vector3; color: string; radius?: number; emissive?: number; opacity?: number;
}) {
  const mid = useMemo(() => new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5), [a, b]);
  const len = useMemo(() => Math.max(a.distanceTo(b), 0.001), [a, b]);
  const quat = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [a, b]);

  return (
    <mesh position={mid} quaternion={quat}>
      <cylinderGeometry args={[radius, radius, len, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={emissive}
        roughness={0.3}
        metalness={0.2}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

/* ── Punto resaltado con glow pulsante ──────────────────────────────────────── */
function GlowPoint({ pos, color, r = 0.22, light = 6 }: { pos: THREE.Vector3; color: string; r?: number; light?: number }) {
  const glowRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (glowRef.current) {
      const g = 1.5 + Math.sin(state.clock.elapsedTime * 3 + pos.x) * 0.25;
      glowRef.current.scale.setScalar(g);
    }
  });
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[r, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.6} roughness={0.2} metalness={0.3} />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[r, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color={color} intensity={light} distance={9} />
    </group>
  );
}

/* ── Plano cartesiano / grid 3D con ejes etiquetados ────────────────────────── */
function CartesianGrid() {
  const y0 = sToWorldY(0);
  return (
    <group>
      {/* rejilla en el plano XY (z=0) */}
      <gridHelper
        args={[X_SPAN + 2, 22, '#334155', '#14263b']}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, y0, -0.05]}
      />
      {/* eje t (X) */}
      <Segment
        a={new THREE.Vector3(-X_SPAN / 2 - 0.5, y0, 0)}
        b={new THREE.Vector3(X_SPAN / 2 + 0.5, y0, 0)}
        color="#64748b"
        radius={0.02}
        emissive={0.6}
      />
      {/* eje s (Y) */}
      <Segment
        a={new THREE.Vector3(-X_SPAN / 2, y0 - 0.3, 0)}
        b={new THREE.Vector3(-X_SPAN / 2, y0 + 9, 0)}
        color="#64748b"
        radius={0.02}
        emissive={0.6}
      />
      <Html position={[X_SPAN / 2 + 0.9, y0, 0]} center distanceFactor={16}>
        <span className="text-cyan-300/70 text-2xl font-black select-none pointer-events-none">t</span>
      </Html>
      <Html position={[-X_SPAN / 2, y0 + 9.6, 0]} center distanceFactor={16}>
        <span className="text-cyan-300/70 text-2xl font-black select-none pointer-events-none">s(t)</span>
      </Html>
    </group>
  );
}

/* ── Núcleo: tangente fija + secante convergente animada (límite h→0) ────────── */
function TangentSecant({ t }: { t: number }) {
  const p0 = useMemo(() => worldPoint(t), [t]);
  const slope = vFn(t); // pendiente real ds/dt = v(t)
  const wSlope = worldSlopeAt(t);

  // Endpoints de la TANGENTE (recta con pendiente real que pasa por p0).
  const tanHalf = 3.2; // media longitud en X-mundo
  const tanA = useMemo(
    () => new THREE.Vector3(p0.x - tanHalf, p0.y - wSlope * tanHalf, 0),
    [p0, wSlope],
  );
  const tanB = useMemo(
    () => new THREE.Vector3(p0.x + tanHalf, p0.y + wSlope * tanHalf, 0),
    [p0, wSlope],
  );

  // h animado que decrece hacia 0 para mostrar el límite; ciclo con reinicio.
  const hRef = useRef(2.4);
  const secMeshRef = useRef<THREE.Mesh>(null);
  const secPointRef = useRef<THREE.Mesh>(null);
  const htmlSlopeRef = useRef<HTMLSpanElement>(null);

  useFrame((_, delta) => {
    let h = hRef.current - Math.min(delta, 0.05) * 0.5;
    if (h < 0.1) h = 2.4;
    hRef.current = h;

    // El segundo punto de la secante se clampa dentro del dominio.
    const t2 = THREE.MathUtils.clamp(t + h, T_MIN, T_MAX);
    const a = worldPoint(t);
    const b = worldPoint(t2);

    if (secMeshRef.current) {
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      const len = Math.max(a.distanceTo(b), 0.001);
      const dir = new THREE.Vector3().subVectors(b, a).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      secMeshRef.current.position.copy(mid);
      secMeshRef.current.quaternion.copy(q);
      secMeshRef.current.scale.set(1, len, 1);
    }
    if (secPointRef.current) {
      secPointRef.current.position.copy(b);
    }
    if (htmlSlopeRef.current) {
      const secSlope = (sFn(t2) - sFn(t)) / (t2 - t || 1e-3);
      htmlSlopeRef.current.textContent = `h=${h.toFixed(2)}  ·  Δs/Δt=${secSlope.toFixed(2)}`;
    }
  });

  return (
    <group>
      {/* proyección vertical del punto al eje t */}
      <Segment a={new THREE.Vector3(p0.x, sToWorldY(0), 0)} b={p0} color="#475569" radius={0.012} emissive={0.4} opacity={0.5} />

      {/* recta TANGENTE (pendiente = v(t) real) */}
      <Segment a={tanA} b={tanB} color={MAGENTA} radius={0.05} emissive={3.4} />
      <Html position={[tanB.x, tanB.y + 0.3, 0]} center distanceFactor={15}>
        <div className="pointer-events-none select-none whitespace-nowrap px-3 py-1.5 rounded-xl bg-black/70 border border-pink-400/40 backdrop-blur-md shadow-[0_0_20px_rgba(244,114,182,0.4)]">
          <span className="text-pink-300 text-sm font-black font-mono">f&apos;(t) = {slope.toFixed(2)}</span>
        </div>
      </Html>

      {/* recta SECANTE (converge a la tangente cuando h→0) */}
      <mesh ref={secMeshRef}>
        <cylinderGeometry args={[0.04, 0.04, 1, 12]} />
        <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={2.8} roughness={0.35} transparent opacity={0.92} />
      </mesh>
      <mesh ref={secPointRef}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={2.6} />
      </mesh>

      {/* punto x₀ resaltado */}
      <GlowPoint pos={p0} color={MAGENTA} r={0.24} />

      {/* etiqueta del límite (h y pendiente de la secante) */}
      <Html position={[p0.x, p0.y - 1.15, 0]} center distanceFactor={15}>
        <div className="pointer-events-none select-none whitespace-nowrap px-3 py-1.5 rounded-xl bg-black/70 border border-amber-400/40 backdrop-blur-md">
          <span ref={htmlSlopeRef} className="text-amber-300 text-xs font-black font-mono">h=2.40 · Δs/Δt=0.00</span>
        </div>
      </Html>
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ t }: { t: number }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 3, 16]} fov={45} />
      <color attach="background" args={['#03040a']} />
      <fog attach="fog" args={['#03040a', 20, 46]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight intensity={0.35} groundColor="#020617" />
      <directionalLight position={[6, 10, 8]} intensity={0.5} />

      <CartesianGrid />
      <FunctionCurve />
      <TangentSecant t={t} />

      <Sparkles count={70} scale={[20, 12, 14]} size={2} speed={0.3} color="#67e8f9" opacity={0.4} />
      <Stars radius={80} depth={40} count={2600} factor={4} saturation={0} fade speed={0.6} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={9}
        maxDistance={30}
        autoRotate
        autoRotateSpeed={0.45}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.7}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.15} mipmapBlur intensity={1.6} radius={0.72} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function Derivadas3DScene({ t }: { t: number }) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene t={t} />
        </Suspense>
      </Canvas>
    </div>
  );
}
