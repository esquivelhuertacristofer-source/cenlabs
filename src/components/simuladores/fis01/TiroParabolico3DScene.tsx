"use client";

import React, { useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Stars,
  Sparkles,
  Html,
  Line,
  Float,
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { simularDisparo, duracionAnimacionMs, type Mision1, type Disparo1 } from '@/domain/fisica';

/* ────────────────────────────────────────────────────────────────────────────
   TiroParabolico3DScene — Campo de tiro balístico cinematográfico.

   Antes de disparar solo muestra el cañón con una guía de apuntado (la
   dirección inicial), el muro y la diana: la trayectoria con arrastre y viento
   es lo que el alumno debe predecir. Tras cada disparo, el proyectil vuela UNA
   vez (misma duración que el veredicto del store) por la trayectoria calculada
   con el MISMO motor (domain/fisica · simularDisparo), queda en el punto de
   impacto y la traza se conserva como referencia para corregir el tiro. El
   entorno cambia según el planeta (Tierra/Luna/Marte/Júpiter).

   Props: { angulo, y0, obsX, obsY, targetX, volando, escenario, ultimoDisparo }.
──────────────────────────────────────────────────────────────────────────── */

// Escala mundo: 1 unidad 3D = ESCALA metros.
const ESCALA = 8;
const m2w = (m: number) => m / ESCALA;

type Escenario = Mision1['escenario'];

interface Theme {
  fog: string;
  bg: string;
  ground: string;
  groundTint: string;
  grid: string;
  accent: string;
  dust: string;
  sun: string;
  sunPos: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  stars: number;
  clouds: boolean;
}

const THEMES: Record<Escenario, Theme> = {
  tierra: {
    fog: '#050b18', bg: '#050b18', ground: '#0a1a12', groundTint: '#12324a',
    grid: '#1f6a45', accent: '#22c55e', dust: '#7dd3fc', sun: '#fde68a',
    sunPos: [10, 18, 8], hemiSky: '#1e3a5f', hemiGround: '#020617', stars: 500, clouds: true,
  },
  luna: {
    fog: '#020204', bg: '#010103', ground: '#15151d', groundTint: '#2a2a38',
    grid: '#454560', accent: '#cbd5e1', dust: '#94a3b8', sun: '#ffffff',
    sunPos: [14, 12, 6], hemiSky: '#1a1a2e', hemiGround: '#000000', stars: 4500, clouds: false,
  },
  marte: {
    fog: '#1a0a06', bg: '#160806', ground: '#2e1207', groundTint: '#5a1f0d',
    grid: '#a3450f', accent: '#f97316', dust: '#fdba74', sun: '#fca5a5',
    sunPos: [9, 15, 10], hemiSky: '#4a1d0f', hemiGround: '#0a0402', stars: 260, clouds: true,
  },
  jupiter: {
    fog: '#160d04', bg: '#120a03', ground: '#241606', groundTint: '#5a3a0c',
    grid: '#a16207', accent: '#fbbf24', dust: '#fde68a', sun: '#fef3c7',
    sunPos: [7, 20, 12], hemiSky: '#4a2c0a', hemiGround: '#0a0602', stars: 220, clouds: true,
  },
};

type Sample = { p: THREE.Vector3; vx: number; vy: number };

/* ── Trayectoria de un disparo YA lanzado (mismo motor que el store: domain/fisica) ──
   Antes de disparar NO se dibuja la trayectoria con arrastre y viento: eso era la
   respuesta del reto. Solo hay una guía de apuntado (dirección inicial del cañón). */
function useTrazaDisparo(ultimo: SceneProps['ultimoDisparo']) {
  return useMemo(() => {
    if (!ultimo) return null;
    const r = simularDisparo(ultimo, ultimo, true);
    const samples: Sample[] = r.muestras.map((m) => ({ p: new THREE.Vector3(m2w(m.x), m2w(m.y), 0), vx: m.vx, vy: m.vy }));
    if (samples.length < 2) samples.push({ p: samples[0]?.p.clone() ?? new THREE.Vector3(), vx: 0, vy: 0 });
    return { samples, maxY: r.maxY, hitX: r.hitX, t: r.t, resultado: r.resultado };
  }, [ultimo]);
}

/* ── Trayectoria real: tubo emisivo con degradado por rapidez ────────────────── */
function TrajectoryTube({ samples, accent }: { samples: Sample[]; accent: string }) {
  const geometry = useMemo(() => {
    const pts = samples.map((s) => s.p);
    const curve = new THREE.CatmullRomCurve3(pts);
    const seg = Math.min(240, Math.max(24, pts.length * 2));
    const geo = new THREE.TubeGeometry(curve, seg, 0.05, 10, false);

    // color por posición a lo largo del tubo: cian (rápido) → color de acento (lento)
    const cold = new THREE.Color('#22d3ee');
    const warm = new THREE.Color(accent);
    const pos = geo.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const ring = 11; // radialSegments+1
    for (let i = 0; i < pos.count; i++) {
      const along = Math.floor(i / ring) / seg;
      const c = cold.clone().lerp(warm, along);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }, [samples, accent]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        emissive="#ffffff"
        emissiveIntensity={0.9}
        toneMapped={false}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}

/* ── Guía de apuntado: prolonga el cañón 12 m en la dirección de tiro ───────── */
function AimGuide({ angulo, y0 }: { angulo: number; y0: number }) {
  const rad = (angulo * Math.PI) / 180;
  const L = m2w(12);
  const points = useMemo(
    () => [new THREE.Vector3(0, m2w(y0), 0), new THREE.Vector3(Math.cos(rad) * L, m2w(y0) + Math.sin(rad) * L, 0)],
    [rad, L, y0],
  );
  return <Line points={points} color="#94a3b8" lineWidth={1.1} dashed dashSize={0.18} gapSize={0.14} transparent opacity={0.55} toneMapped={false} />;
}

/* ── Flecha de vector (cilindro + cono) ──────────────────────────────────────── */
function VectorArrow({ length, color, radius = 0.02 }: { length: number; color: string; radius?: number }) {
  if (length < 0.02) return null;
  return (
    <group>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[radius, radius, length, 10]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0, length + 0.08, 0]}>
        <coneGeometry args={[radius * 3.4, 0.18, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── Proyectil: núcleo brillante + estela + sombra en suelo + vectores ───────── */
function Projectile({
  samples, playing, duracionMs, disparoId, accent, onImpact,
}: {
  samples: Sample[]; playing: boolean; duracionMs: number; disparoId: number; accent: string; onImpact: (x: number) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const vxRef = useRef<THREE.Group>(null);
  const vyRef = useRef<THREE.Group>(null);
  const vRef = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const disparoVisto = useRef<number | null>(null);
  const vmax = useMemo(
    () => Math.max(...samples.map((s) => Math.hypot(s.vx, s.vy)), 1),
    [samples],
  );

  // Estela manual: buffer circular de las últimas posiciones (THREE.Line puro
  // montado vía <primitive> para evitar la colisión del intrínseco <line> con SVG).
  const TRAIL = 46;
  const trailLine = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    g.setDrawRange(0, 0);
    const m = new THREE.LineBasicMaterial({
      color: '#22d3ee', transparent: true, opacity: 0.7,
      toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    return new THREE.Line(g, m);
  }, []);
  const trail = useRef<THREE.Vector3[]>([]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const n = samples.length;
    // Disparo nuevo: arranca desde la boca. Si no está volando, queda en el impacto.
    if (disparoVisto.current !== disparoId) {
      disparoVisto.current = disparoId;
      progress.current = playing ? 0 : n - 1;
      trail.current = [];
    }
    if (playing && progress.current < n - 1) {
      progress.current = Math.min(n - 1, progress.current + (delta * 1000 * (n - 1)) / duracionMs);
      if (progress.current >= n - 1) onImpact(samples[n - 1].p.x);
    }

    const i = Math.floor(progress.current);
    const frac = progress.current - i;
    const a = samples[i];
    const b = samples[Math.min(i + 1, n - 1)];
    ref.current.position.lerpVectors(a.p, b.p, frac);

    // actualiza la estela con la posición mundial actual
    trail.current.push(ref.current.position.clone());
    if (trail.current.length > TRAIL) trail.current.shift();
    const geo = trailLine.geometry;
    const arr = geo.attributes.position.array as Float32Array;
    for (let k = 0; k < trail.current.length; k++) {
      const p = trail.current[k];
      arr[k * 3] = p.x; arr[k * 3 + 1] = p.y; arr[k * 3 + 2] = p.z;
    }
    geo.setDrawRange(0, trail.current.length);
    geo.attributes.position.needsUpdate = true;

    if (shadowRef.current) {
      shadowRef.current.position.x = ref.current.position.x;
      const scale = THREE.MathUtils.clamp(1 - ref.current.position.y * 0.35, 0.25, 1);
      shadowRef.current.scale.set(scale, scale, scale);
      (shadowRef.current.material as THREE.Material).opacity = 0.35 * scale;
    }

    const vx = THREE.MathUtils.lerp(a.vx, b.vx, frac);
    const vy = THREE.MathUtils.lerp(a.vy, b.vy, frac);

    if (vxRef.current) {
      vxRef.current.scale.set(1, Math.max(0.001, (Math.abs(vx) / vmax) * 1.6), 1);
      vxRef.current.rotation.z = vx >= 0 ? -Math.PI / 2 : Math.PI / 2;
    }
    if (vyRef.current) {
      vyRef.current.scale.set(1, Math.max(0.001, (Math.abs(vy) / vmax) * 1.6), 1);
      vyRef.current.rotation.z = vy >= 0 ? 0 : Math.PI;
    }
    if (vRef.current) {
      const speed = Math.hypot(vx, vy);
      vRef.current.scale.set(1, Math.max(0.001, (speed / vmax) * 1.9), 1);
      vRef.current.rotation.z = Math.atan2(vy, vx) - Math.PI / 2;
    }
  });

  return (
    <>
      {/* sombra proyectada en el suelo */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* estela emisiva (THREE.Line en espacio mundial) */}
      <primitive object={trailLine} />

      <group ref={ref}>
        {/* núcleo brillante del proyectil */}
        <mesh>
          <sphereGeometry args={[0.17, 24, 24]} />
          <meshStandardMaterial color="#ecfeff" emissive="#22d3ee" emissiveIntensity={4} toneMapped={false} />
        </mesh>
        {/* halo aditivo */}
        <mesh>
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <pointLight color="#22d3ee" intensity={7} distance={6} />

        {/* vₓ horizontal (cian) */}
        <group ref={vxRef}><VectorArrow length={1} color="#38bdf8" /></group>
        {/* v_y vertical (ámbar) */}
        <group ref={vyRef}><VectorArrow length={1} color="#fbbf24" /></group>
        {/* v resultante (color de acento, más gruesa) */}
        <group ref={vRef}><VectorArrow length={1} color={accent} radius={0.028} /></group>
      </group>
    </>
  );
}

/* ── Onda de impacto en el punto de caída, sincronizada al bucle ─────────────── */
function ImpactWave({ trigger, color }: { trigger: React.MutableRefObject<{ x: number; t: number }>; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const elapsed = state.clock.getElapsedTime() - trigger.current.t;
    const life = 0.9;
    if (elapsed < 0 || elapsed > life) { ref.current.visible = false; return; }
    ref.current.visible = true;
    ref.current.position.x = trigger.current.x;
    const k = elapsed / life;
    const s = 0.2 + k * 2.4;
    ref.current.scale.set(s, s, s);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - k) * 0.85;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} visible={false}>
      <ringGeometry args={[0.55, 0.75, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

/* ── Cañón / railgun con carga luminosa y boca ───────────────────────────────── */
function Launcher({ angulo, y0, accent }: { angulo: number; y0: number; accent: string }) {
  const rad = (angulo * Math.PI) / 180;
  const wy0 = m2w(y0);
  const glow = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (glow.current) {
      const p = 0.6 + Math.sin(state.clock.getElapsedTime() * 4) * 0.4;
      (glow.current.material as THREE.MeshBasicMaterial).opacity = p * 0.8;
    }
  });

  return (
    <group position={[0, wy0, 0]}>
      {/* mástil de plataforma */}
      <mesh position={[0, -wy0 / 2, 0]}>
        <cylinderGeometry args={[0.4, 0.62, Math.max(0.2, wy0), 8]} />
        <meshStandardMaterial color="#0b1220" emissive={accent} emissiveIntensity={0.18} roughness={0.4} metalness={0.7} />
      </mesh>
      {/* base anular */}
      <mesh position={[0, -wy0 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.85, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={0.5} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      {/* núcleo / torreta */}
      <mesh>
        <icosahedronGeometry args={[0.36, 1]} />
        <meshStandardMaterial color="#1e293b" emissive="#0ea5e9" emissiveIntensity={0.7} metalness={0.8} roughness={0.25} flatShading />
      </mesh>
      {/* barril rotado por el ángulo */}
      <group rotation={[0, 0, rad]}>
        <mesh position={[0.6, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.13, 1.2, 18]} />
          <meshStandardMaterial color="#334155" emissive="#38bdf8" emissiveIntensity={0.9} metalness={0.85} roughness={0.15} />
        </mesh>
        {/* rieles del railgun */}
        <mesh position={[0.6, 0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh position={[0.6, -0.11, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 1.2, 8]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {/* boca / carga */}
        <mesh ref={glow} position={[1.2, 0, 0]}>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0.7} toneMapped={false} />
        </mesh>
        <pointLight position={[1.25, 0, 0]} color="#38bdf8" intensity={3} distance={3} />
      </group>
      <Html center distanceFactor={16} position={[0, 0.8, 0]}>
        <div className="text-[10px] font-black text-sky-300 uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
          Y₀ {y0.toFixed(1)}m · θ {angulo}°
        </div>
      </Html>
    </group>
  );
}

/* ── Diana / objetivo con anillos de enganche ────────────────────────────────── */
function Target({ x, label, color, spin = 0.8 }: { x: number; label: string; color: string; spin?: number }) {
  const ref = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) ref.current.rotation.z = t * spin;
    if (pulse.current) {
      const s = 1 + (Math.sin(t * 2) * 0.5 + 0.5) * 0.6;
      pulse.current.scale.set(s, s, s);
      (pulse.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - (s - 1) / 0.6);
    }
  });
  const wx = m2w(x);
  return (
    <Float speed={2} rotationIntensity={0} floatIntensity={0.4} floatingRange={[0, 0.15]}>
      <group position={[wx, 0.02, 0]}>
        <group ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh><ringGeometry args={[0.4, 0.52, 40]} /><meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} toneMapped={false} /></mesh>
          <mesh><ringGeometry args={[0.18, 0.24, 40]} /><meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} toneMapped={false} /></mesh>
          {/* marcas cruzadas de mira */}
          {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => (
            <mesh key={i} rotation={[0, 0, a]} position={[Math.cos(a) * 0.62, Math.sin(a) * 0.62, 0]}>
              <boxGeometry args={[0.14, 0.03, 0.001]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          ))}
          <mesh ref={pulse}><ringGeometry args={[0.5, 0.56, 40]} /><meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} toneMapped={false} /></mesh>
        </group>
        <mesh><sphereGeometry args={[0.09, 16, 16]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
        <pointLight color={color} intensity={3} distance={5} />
        <Html center distanceFactor={16} position={[0, 0.7, 0]}>
          <div className="text-[10px] font-black uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap" style={{ color }}>
            {label} · {x.toFixed(0)}m
          </div>
        </Html>
      </group>
    </Float>
  );
}

/* ── Muro / obstáculo ───────────────────────────────────────────────────────── */
function Obstacle({ x, h }: { x: number; h: number }) {
  if (h <= 0) return null;
  const wx = m2w(x);
  const wh = m2w(h);
  return (
    <group position={[wx, wh / 2, 0]}>
      <mesh>
        <boxGeometry args={[0.3, wh, 0.6]} />
        <meshStandardMaterial color="#3a1508" emissive="#f97316" emissiveIntensity={0.35} roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, wh / 2 + 0.03, 0]}>
        <boxGeometry args={[0.38, 0.06, 0.66]} />
        <meshBasicMaterial color="#fdba74" toneMapped={false} />
      </mesh>
      <Html center distanceFactor={16} position={[0, wh / 2 + 0.45, 0]}>
        <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
          Muro {h.toFixed(0)}m
        </div>
      </Html>
    </group>
  );
}

/* ── Cresta de altura máxima ─────────────────────────────────────────────────── */
function ApexGuide({ maxY, xEnd }: { maxY: number; xEnd: number }) {
  const wy = m2w(maxY);
  const wx = m2w(xEnd);
  return (
    <group>
      <Line points={[[0, wy, 0], [wx, wy, 0]]} color="#fbbf24" lineWidth={1} dashed dashSize={0.14} gapSize={0.1} transparent opacity={0.45} toneMapped={false} />
      <Html center distanceFactor={16} position={[wx * 0.5, wy + 0.28, 0]}>
        <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest select-none pointer-events-none drop-shadow-[0_0_6px_rgba(0,0,0,0.9)] whitespace-nowrap">
          H máx {maxY.toFixed(1)}m
        </div>
      </Html>
    </group>
  );
}

/* ── Regla de distancias en el suelo cada 10 m ───────────────────────────────── */
function DistanceRuler({ maxM, accent }: { maxM: number; accent: string }) {
  const marks = useMemo(() => {
    const arr: number[] = [];
    for (let m = 10; m <= maxM; m += 10) arr.push(m);
    return arr;
  }, [maxM]);
  return (
    <group>
      {marks.map((m) => (
        <group key={m} position={[m2w(m), 0.02, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.03, 0.6]} />
            <meshBasicMaterial color={accent} transparent opacity={0.4} toneMapped={false} />
          </mesh>
          <Html center distanceFactor={20} position={[0, 0, 0.6]}>
            <div className="text-[8px] font-bold text-white/40 tabular-nums select-none pointer-events-none whitespace-nowrap">{m}</div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ── Suelo pulido temático (material estándar, sin pase de reflexión) ─────────── */
function ReflectiveFloor({ theme, centerX }: { theme: Theme; centerX: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, 0]}>
      <planeGeometry args={[140, 70]} />
      <meshStandardMaterial
        color={theme.ground}
        emissive={theme.groundTint}
        emissiveIntensity={0.12}
        metalness={0.85}
        roughness={0.32}
      />
    </mesh>
  );
}

/* ── Rejilla holográfica sobre el suelo ──────────────────────────────────────── */
function HoloGrid({ theme, centerX }: { theme: Theme; centerX: number }) {
  const lines = useMemo(() => {
    const segs: [number, number, number][][] = [];
    const half = 60, depth = 24, step = m2w(10);
    for (let x = -half; x <= half; x += step) segs.push([[x, 0, -depth], [x, 0, depth]]);
    for (let z = -depth; z <= depth; z += step) segs.push([[-half, 0, z], [half, 0, z]]);
    return segs;
  }, []);
  return (
    <group position={[centerX, 0.01, 0]}>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={theme.grid} lineWidth={0.6} transparent opacity={0.25} toneMapped={false} />
      ))}
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
const ABERRACION = new THREE.Vector2(0.0006, 0.0006);

function Scene({ angulo, y0, obsX, obsY, targetX, volando, escenario, ultimoDisparo }: SceneProps) {
  const theme = THEMES[escenario] ?? THEMES.tierra;
  const traza = useTrazaDisparo(ultimoDisparo);
  const alcance = traza ? Math.max(0, traza.hitX) : 0;

  const spanM = Math.max(alcance, targetX, 20);
  const centerXw = m2w(spanM) * 0.5;
  const camDist = THREE.MathUtils.clamp(m2w(spanM) * 0.95 + 6, 9, 38);
  const camX = m2w(spanM) * 0.4;

  // punto/tiempo del último impacto (para la onda), compartido por ref
  const impact = useRef({ x: 0, t: -10 });
  const clockRef = useRef(0);
  useFrame((state) => { clockRef.current = state.clock.getElapsedTime(); });
  const handleImpact = (x: number) => { impact.current = { x, t: clockRef.current }; };

  return (
    <>
      <PerspectiveCamera makeDefault position={[camX, 4.5, camDist]} fov={45} />
      <color attach="background" args={[theme.bg]} />
      <fog attach="fog" args={[theme.fog, 24, 78]} />

      <ambientLight intensity={0.35} />
      <hemisphereLight intensity={0.5} groundColor={theme.hemiGround} color={theme.hemiSky} />
      <directionalLight position={theme.sunPos} intensity={1.1} color={theme.sun} castShadow />
      <pointLight position={[camX, 6, 6]} intensity={0.4} color={theme.accent} />

      <ReflectiveFloor theme={theme} centerX={centerXw} />
      <HoloGrid theme={theme} centerX={centerXw} />
      <DistanceRuler maxM={Math.ceil(spanM / 10) * 10} accent={theme.accent} />

      <Launcher angulo={angulo} y0={y0} accent={theme.accent} />
      <AimGuide angulo={angulo} y0={y0} />
      {traza && ultimoDisparo && (
        <>
          {!volando && <TrajectoryTube samples={traza.samples} accent={theme.accent} />}
          {!volando && <ApexGuide maxY={traza.maxY} xEnd={Math.max(alcance, 1)} />}
          <Projectile
            samples={traza.samples} playing={volando} disparoId={ultimoDisparo.id}
            duracionMs={duracionAnimacionMs(traza.t)} accent={theme.accent} onImpact={handleImpact}
          />
        </>
      )}
      <ImpactWave trigger={impact} color={theme.accent} />

      <Obstacle x={obsX} h={obsY} />
      <Target x={targetX} label="Objetivo" color="#ef4444" />

      {/* polvo atmosférico temático */}
      <Sparkles count={90} scale={[m2w(spanM) + 10, 9, 14]} position={[centerXw, 4, 0]} size={2.4} speed={0.25} color={theme.dust} opacity={0.5} />
      <Stars radius={100} depth={50} count={theme.stars} factor={4} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan enableZoom
        minDistance={5} maxDistance={48}
        target={[centerXw, 1.5, 0]}
        autoRotate={false}
        minPolarAngle={Math.PI / 8}
        maxPolarAngle={Math.PI / 2.03}
      />

      <EffectComposer multisampling={4}>
        <Bloom luminanceThreshold={0.18} mipmapBlur intensity={1.35} radius={0.75} />
        <ChromaticAberration offset={ABERRACION} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.22} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

interface SceneProps {
  angulo: number;
  y0: number;
  obsX: number;
  obsY: number;
  targetX: number;
  volando: boolean;
  escenario: Escenario;
  /** Disparo lanzado (su trayectoria solo se conoce después de disparar). */
  ultimoDisparo: (Mision1 & Disparo1 & { id: number }) | null;
}

export default function TiroParabolico3DScene(props: SceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 1.8]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
    </div>
  );
}
