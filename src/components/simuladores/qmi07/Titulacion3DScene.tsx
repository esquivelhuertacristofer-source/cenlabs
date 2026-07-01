"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
   Titulacion3DScene — Titulación ácido-base volumétrica en 3D premium.

   Una BURETA de vidrio gotea titulante (NaOH) sobre un MATRAZ ERLENMEYER que
   contiene el analito (HCl). El pH real proviene del store; el líquido del
   matraz interpola incoloro → rosa fenolftaleína al cruzar el punto de viraje
   (~pH 8.2). Gotas animadas (useFrame) caen desde la punta de la bureta, y un
   remolino de partículas del indicador se mezcla en la disolución. Una curva de
   titulación pH vs volumen flota en 3D a la derecha.

   Props derivados del estado REAL del Piloto:
     volumenBase        — mL de titulante añadido (titulacion.volumenBase)
     ph                 — pH actual (último history)
     indicador          — fenolftaleína presente
     equivalenceVolume  — Veq = ca·va/cb  (mL en el punto de equivalencia)
     flowRate           — 0..1 apertura de la válvula (activa el goteo)
     history            — [{vol, ph}] para la curva flotante
──────────────────────────────────────────────────────────────────────────── */

const CLEAR = new THREE.Color('#dff2ff');   // disolución incolora (pre-viraje)
const PINK = new THREE.Color('#ec4899');    // rosa fenolftaleína (viraje)
const TITRANT = new THREE.Color('#7dd3fc'); // titulante en la bureta

// Geometría de la escena (unidades world)
const FLASK_BASE_Y = -3.2;   // fondo del matraz
const BURETTE_TIP_Y = 1.2;   // punta de la bureta (donde nace la gota)
const BURETTE_TOP_Y = 7.0;   // tope de la bureta

// Color de la disolución en función del pH y del indicador
function solutionColor(ph: number, indicador: boolean, target: THREE.Color) {
  if (!indicador) {
    target.copy(CLEAR);
    return 0.16;
  }
  // Fenolftaleína: incolora < 8.2, rosa creciente hasta ~10
  const t = THREE.MathUtils.clamp((ph - 8.2) / 1.6, 0, 1);
  target.copy(CLEAR).lerp(PINK, t);
  return 0.16 + t * 0.72; // opacidad
}

/* ── Gota de titulante que cae de la bureta al matraz ───────────────────────── */
function Drop({ phase, speed, active, surfaceY }: {
  phase: number; speed: number; active: boolean; surfaceY: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    if (!active) { m.visible = false; return; }
    m.visible = true;
    const t = ((state.clock.elapsedTime * speed) + phase) % 1;
    m.position.y = THREE.MathUtils.lerp(BURETTE_TIP_Y, surfaceY, t);
    m.position.x = Math.sin(phase * 30) * 0.02;
    // estira al caer, se aplasta al impactar
    const stretch = t < 0.9 ? 1 + t * 0.5 : 0.4;
    m.scale.set(0.8, stretch, 0.8);
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.opacity = t < 0.92 ? 0.9 : (1 - t) / 0.08 * 0.9;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.09, 12, 12]} />
      <meshBasicMaterial color={TITRANT} transparent toneMapped={false} />
    </mesh>
  );
}

/* ── Remolino del indicador mezclándose dentro de la disolución ─────────────── */
function IndicatorSwirl({ color, intensity, surfaceY }: {
  color: THREE.Color; intensity: number; surfaceY: number;
}) {
  const COUNT = 260;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const groupRef = useRef<THREE.Points>(null);

  const seeds = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    const data = [] as { r: number; a: number; y: number; s: number }[];
    for (let i = 0; i < COUNT; i++) {
      const r = Math.sqrt(Math.random()) * 1.25;
      const a = Math.random() * Math.PI * 2;
      const y = Math.random();
      data.push({ r, a, y, s: 0.4 + Math.random() * 0.8 });
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = FLASK_BASE_Y + y;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return { positions: arr, data };
  }, []);

  const colors = useMemo(() => new Float32Array(COUNT * 3), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pos = seeds.positions;
    const top = surfaceY;
    for (let i = 0; i < COUNT; i++) {
      const d = seeds.data[i];
      const ang = d.a + t * (0.5 + d.s) * (0.4 + intensity); // agitación magnética
      const rr = d.r * (0.7 + d.r * 0.3);
      const yy = FLASK_BASE_Y + (Math.sin(t * d.s + i) * 0.5 + 0.5) * Math.max(0.2, top - FLASK_BASE_Y - 0.2);
      pos[i * 3] = Math.cos(ang) * rr;
      pos[i * 3 + 1] = Math.min(top - 0.1, yy);
      pos[i * 3 + 2] = Math.sin(ang) * rr;
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true;
      geomRef.current.attributes.color.needsUpdate = true;
    }
  });

  return (
    <points ref={groupRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[seeds.positions, 3]} count={COUNT} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} count={COUNT} />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        vertexColors
        transparent
        opacity={0.35 + intensity * 0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

/* ── Matraz Erlenmeyer de vidrio con disolución de nivel/color dinámicos ─────── */
function Erlenmeyer({ fill, color, opacity, indicador, intensity }: {
  fill: number; color: THREE.Color; opacity: number; indicador: boolean; intensity: number;
}) {
  const liquidRef = useRef<THREE.MeshPhysicalMaterial>(null);
  // altura de la disolución: base + nivel según volumen añadido
  const surfaceY = FLASK_BASE_Y + 0.2 + fill * 2.4;

  useFrame(() => {
    if (liquidRef.current) {
      liquidRef.current.color.copy(color);
      liquidRef.current.opacity = opacity;
    }
  });

  return (
    <group>
      {/* Cuerpo cónico de vidrio (Erlenmeyer) */}
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.55, 2.0, 3.4, 48, 1, true]} />
        <meshPhysicalMaterial
          color="#cfe8ff"
          roughness={0.05}
          metalness={0}
          transmission={1}
          thickness={0.6}
          ior={1.45}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Cuello del matraz */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 1.4, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#cfe8ff"
          roughness={0.05}
          transmission={1}
          thickness={0.4}
          ior={1.45}
          transparent
          opacity={0.28}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Reborde de la boca */}
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.52, 0.06, 12, 32]} />
        <meshStandardMaterial color="#e2f2ff" roughness={0.1} metalness={0.3} transparent opacity={0.5} />
      </mesh>

      {/* Disolución: cono truncado escalado según el nivel */}
      <mesh position={[0, (FLASK_BASE_Y + surfaceY) / 2 + 0.05, 0]}>
        <cylinderGeometry args={[
          THREE.MathUtils.lerp(2.0, 0.55, (surfaceY - FLASK_BASE_Y) / 3.4) * 0.94,
          1.9,
          Math.max(0.15, surfaceY - FLASK_BASE_Y),
          48,
        ]} />
        <meshPhysicalMaterial
          ref={liquidRef}
          color={color}
          roughness={0.15}
          transmission={0.7}
          thickness={1.2}
          ior={1.33}
          transparent
          opacity={opacity}
          toneMapped={false}
        />
      </mesh>
      {/* Menisco brillante en la superficie */}
      <mesh position={[0, surfaceY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.88, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Remolino del indicador mezclándose */}
      {indicador && <IndicatorSwirl color={color} intensity={intensity} surfaceY={surfaceY} />}
    </group>
  );
}

/* ── Bureta de vidrio con columna de titulante ──────────────────────────────── */
function Burette({ level, flowRate }: { level: number; flowRate: number }) {
  // level: 0..1 fracción de titulante que queda en la bureta
  const h = BURETTE_TOP_Y - BURETTE_TIP_Y;
  const colH = Math.max(0.05, level * h);
  const colCenter = BURETTE_TIP_Y + colH / 2 + 0.3;

  return (
    <group position={[0, 0, 0]}>
      {/* Tubo de vidrio */}
      <mesh position={[0, BURETTE_TIP_Y + h / 2 + 0.3, 0]}>
        <cylinderGeometry args={[0.26, 0.26, h + 0.6, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#d6ecff"
          roughness={0.03}
          transmission={1}
          thickness={0.3}
          ior={1.45}
          transparent
          opacity={0.24}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Columna de titulante */}
      <mesh position={[0, colCenter, 0]}>
        <cylinderGeometry args={[0.2, 0.2, colH, 24]} />
        <meshPhysicalMaterial
          color={TITRANT}
          emissive={TITRANT}
          emissiveIntensity={0.6}
          roughness={0.1}
          transmission={0.5}
          thickness={0.4}
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>
      {/* Punta / llave */}
      <mesh position={[0, BURETTE_TIP_Y + 0.05, 0]}>
        <coneGeometry args={[0.2, 0.55, 24]} />
        <meshPhysicalMaterial color="#d6ecff" roughness={0.05} transmission={1} thickness={0.3} transparent opacity={0.3} />
      </mesh>
      {/* Válvula (llave de paso) — brilla al fluir */}
      <mesh position={[0, BURETTE_TIP_Y + 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.09, 0.09, 0.7, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={flowRate > 0.05 ? 2.4 : 0.4}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      {/* Pinza de soporte */}
      <mesh position={[-0.6, BURETTE_TIP_Y + h / 2 + 0.3, 0]}>
        <boxGeometry args={[0.8, 0.14, 0.14]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
      </mesh>
    </group>
  );
}

/* ── Soporte universal (varilla + base) ─────────────────────────────────────── */
function Stand() {
  return (
    <group>
      <mesh position={[-1.3, 1.5, -0.2]}>
        <cylinderGeometry args={[0.08, 0.08, 12, 16]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[-0.7, FLASK_BASE_Y - 0.9, -0.2]}>
        <boxGeometry args={[2.6, 0.25, 1.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.6} />
      </mesh>
    </group>
  );
}

/* ── Curva de titulación pH vs volumen flotando en 3D ───────────────────────── */
function TitrationCurve({ history, equivalenceVolume, ph }: {
  history: { vol: number; ph: number }[]; equivalenceVolume: number; ph: number;
}) {
  const W = 4.2;
  const H = 3.0;
  const maxVol = Math.max(equivalenceVolume * 1.8, 5);

  const points = useMemo(() => {
    if (history.length < 2) return null;
    const pts: THREE.Vector3[] = history.map((h) => new THREE.Vector3(
      THREE.MathUtils.clamp(h.vol / maxVol, 0, 1) * W - W / 2,
      (h.ph / 14) * H - H / 2,
      0,
    ));
    return pts;
  }, [history, maxVol]);

  const geom = useMemo(() => {
    if (!points) return null;
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const eqX = THREE.MathUtils.clamp(equivalenceVolume / maxVol, 0, 1) * W - W / 2;

  return (
    <group position={[6.5, 1.5, -1]} rotation={[0, -0.5, 0]}>
      {/* Marco */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[W + 0.7, H + 0.9]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      {/* Ejes */}
      <mesh position={[-W / 2, 0, 0]}>
        <boxGeometry args={[0.02, H, 0.02]} />
        <meshBasicMaterial color="#475569" />
      </mesh>
      <mesh position={[0, -H / 2, 0]}>
        <boxGeometry args={[W, 0.02, 0.02]} />
        <meshBasicMaterial color="#475569" />
      </mesh>
      {/* Línea de equivalencia */}
      <mesh position={[eqX, 0, 0]}>
        <boxGeometry args={[0.015, H, 0.015]} />
        <meshBasicMaterial color="#ec4899" transparent opacity={0.6} />
      </mesh>
      {/* Curva */}
      {geom && (
        <primitive object={new THREE.Line(
          geom,
          new THREE.LineBasicMaterial({ color: '#38bdf8', linewidth: 2 }),
        )} />
      )}
      <Html center position={[0, H / 2 + 0.35, 0]} distanceFactor={12}>
        <div className="text-[10px] font-black text-sky-300 uppercase tracking-widest whitespace-nowrap select-none pointer-events-none">
          Curva de Valoración
        </div>
      </Html>
      <Html center position={[eqX, -H / 2 - 0.3, 0]} distanceFactor={12}>
        <div className="text-[9px] font-black text-pink-400 uppercase tracking-widest whitespace-nowrap select-none pointer-events-none">
          V. equiv. {equivalenceVolume.toFixed(1)} mL
        </div>
      </Html>
      <Html center position={[-W / 2 - 0.5, 0, 0]} distanceFactor={12}>
        <div className="text-[9px] font-black text-slate-400 select-none pointer-events-none">pH {ph.toFixed(1)}</div>
      </Html>
    </group>
  );
}

/* ── Escena ─────────────────────────────────────────────────────────────────── */
function Scene({ volumenBase, ph, indicador, equivalenceVolume, flowRate, history }: {
  volumenBase: number; ph: number; indicador: boolean; equivalenceVolume: number; flowRate: number;
  history: { vol: number; ph: number }[];
}) {
  const solColor = useMemo(() => new THREE.Color(), []);
  const opacity = solutionColor(ph, indicador, solColor);

  // Nivel del matraz: crece con el volumen añadido (normalizado)
  const fill = THREE.MathUtils.clamp(volumenBase / Math.max(equivalenceVolume * 1.6, 8), 0, 1);
  // Nivel de la bureta: baja conforme se añade titulante
  const buretteLevel = THREE.MathUtils.clamp(1 - volumenBase / Math.max(equivalenceVolume * 2, 12), 0.05, 1);

  const surfaceY = FLASK_BASE_Y + 0.2 + fill * 2.4;

  // intensidad de agitación / brillo cerca del viraje
  const nearEq = 1 - THREE.MathUtils.clamp(Math.abs(volumenBase - equivalenceVolume) / (equivalenceVolume * 0.4 + 1), 0, 1);
  const active = flowRate > 0.03;

  // Gotas activas proporcionales al caudal
  const dropCount = active ? Math.round(2 + flowRate * 6) : 0;
  const drops = useMemo(() => Array.from({ length: 8 }).map(() => ({
    phase: Math.random(),
    speed: 1.4 + Math.random() * 0.8,
  })), []);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 1.5, 13]} fov={45} />
      <color attach="background" args={['#03040a']} />
      <fog attach="fog" args={['#03040a', 16, 42]} />

      <ambientLight intensity={0.4} />
      <hemisphereLight args={['#1e3a8a', '#020617', 0.5]} />
      <directionalLight position={[5, 10, 6]} intensity={1.1} color="#e0f2fe" />
      <pointLight position={[0, surfaceY + 0.5, 3]} color={indicador ? '#ec4899' : '#7dd3fc'} intensity={2 + nearEq * 6} distance={12} />

      <Stand />
      <Burette level={buretteLevel} flowRate={flowRate} />

      <Float speed={0.6} rotationIntensity={0.05} floatIntensity={0.1}>
        <Erlenmeyer
          fill={fill}
          color={solColor}
          opacity={opacity}
          indicador={indicador}
          intensity={0.3 + nearEq * 0.8}
        />
      </Float>

      {/* Gotas cayendo */}
      {drops.slice(0, dropCount).map((d, i) => (
        <Drop key={i} phase={d.phase} speed={d.speed} active={active} surfaceY={surfaceY} />
      ))}

      {/* Curva flotante */}
      <TitrationCurve history={history} equivalenceVolume={equivalenceVolume} ph={ph} />

      <ContactShadows position={[0, FLASK_BASE_Y - 0.75, 0]} opacity={0.5} scale={16} blur={2.4} far={8} color="#020617" />
      <Sparkles count={70} scale={[16, 12, 16]} size={2} speed={0.25} color={indicador && ph > 8.2 ? '#f9a8d4' : '#93c5fd'} opacity={0.4} />
      <Stars radius={80} depth={40} count={2500} factor={4} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan={false}
        enableZoom
        minDistance={8}
        maxDistance={24}
        autoRotate
        autoRotateSpeed={0.4}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.9}
        target={[0, -0.5, 0]}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.4} radius={0.7} />
        <ChromaticAberration offset={new THREE.Vector2(0.0006, 0.0006)} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function Titulacion3DScene({
  volumenBase,
  ph,
  indicador,
  equivalenceVolume,
  flowRate,
  history,
}: {
  volumenBase: number;
  ph: number;
  indicador: boolean;
  equivalenceVolume: number;
  flowRate: number;
  history: { vol: number; ph: number }[];
}) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene
            volumenBase={volumenBase}
            ph={ph}
            indicador={indicador}
            equivalenceVolume={equivalenceVolume}
            flowRate={flowRate}
            history={history}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
