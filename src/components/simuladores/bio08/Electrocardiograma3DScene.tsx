"use client";

import React, { useEffect, useRef, useMemo, Suspense } from 'react';
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
import { ecgMvB8, tiemposCicloB8, contraccionB8, faseCicloB8 } from '@/domain/biologia';

/* ────────────────────────────────────────────────────────────────────────────
   Electrocardiograma3DScene — corazón 3D + sistema de conducción + monitor ECG.

   UN SOLO RELOJ: `RelojCardiaco` avanza el ciclo en pasos fijos de 10 ms y
   escribe cada muestra del ECG (ecgMvB8, el mismo modelo del dominio). El
   corazón, los nodos y el trazo leen ese mismo reloj, así que nunca se
   desfasan. Un cambio de FC se aplica en el siguiente latido (como en el nodo SA).

   Mecánica (contraccionB8): las aurículas se contraen DESPUÉS de la onda P y
   los ventrículos del QRS al final de la T (sístole); la contracción no ocurre
   "en el pico R" sino que sigue a la despolarización.

   Monitor: barrido de 3 s a 25 mm/s con cuadrícula de 200 ms (cuadro grande)
   y 0.5 mV: la FC se mide contando cuadros grandes entre dos R (FC = 300 / n)
   o con el R-R en segundos (FC = 60 / RR).
──────────────────────────────────────────────────────────────────────────── */

const CRIMSON = new THREE.Color('#f43f5e');
const ELECTRIC = new THREE.Color('#22d3ee');
const CA_OFFSET = new THREE.Vector2(0.0006, 0.0006);

const PASO_MS = 10;
const VENTANA_MS = 3000;
const N_MUESTRAS = VENTANA_MS / PASO_MS;

interface Reloj {
  tCiclo: number;        // ms desde el inicio de la onda P del latido actual
  rr: number;            // R-R del latido actual (ms)
  rrObjetivo: number;    // R-R pedido por la FC actual
  acc: number;           // tiempo pendiente de simular
  muestras: Float32Array;
  cursor: number;        // índice de barrido
}

function RelojCardiaco({ reloj, bpm }: { reloj: React.MutableRefObject<Reloj>; bpm: number }) {
  useEffect(() => { reloj.current.rrObjetivo = 60000 / bpm; }, [reloj, bpm]);
  useFrame((_, delta) => {
    const r = reloj.current;
    r.acc += Math.min(delta * 1000, 200);
    while (r.acc >= PASO_MS) {
      r.acc -= PASO_MS;
      r.tCiclo += PASO_MS;
      if (r.tCiclo >= r.rr) { r.tCiclo -= r.rr; r.rr = r.rrObjetivo; }
      r.muestras[r.cursor] = ecgMvB8(r.tCiclo, r.rr);
      r.cursor = (r.cursor + 1) % N_MUESTRAS;
    }
  });
  return null;
}

/* ── Corazón: aurículas (lóbulos) y ventrículos (cono) se contraen por separado ── */
function BeatingHeart({ reloj }: { reloj: React.MutableRefObject<Reloj> }) {
  const group = useRef<THREE.Group>(null);
  const auL = useRef<THREE.Mesh>(null);
  const auR = useRef<THREE.Mesh>(null);
  const vent = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const { tCiclo, rr } = reloj.current;
    const c = contraccionB8(tCiclo, rr);
    const sa = 1 - 0.14 * c.auriculas;
    const sv = 1 - 0.2 * c.ventriculos;
    auL.current?.scale.setScalar(sa);
    auR.current?.scale.setScalar(sa);
    if (vent.current) vent.current.scale.set(sv, 1 - 0.12 * c.ventriculos, sv);
    if (group.current) group.current.rotation.y = state.clock.getElapsedTime() * 0.15;
    if (light.current) light.current.intensity = 6 + c.ventriculos * 20;
  });

  return (
    <group ref={group} position={[-3.6, 0.3, 0]}>
      <mesh ref={auL} position={[-0.62, 0.55, 0]} rotation={[0, 0, Math.PI / 4]}>
        <sphereGeometry args={[0.95, 64, 64]} />
        <MeshDistortMaterial color={CRIMSON} emissive={CRIMSON} emissiveIntensity={1.2} roughness={0.35} metalness={0.25} distort={0.2} speed={1.5} />
      </mesh>
      <mesh ref={auR} position={[0.62, 0.55, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <sphereGeometry args={[0.95, 64, 64]} />
        <MeshDistortMaterial color={CRIMSON} emissive={CRIMSON} emissiveIntensity={1.2} roughness={0.35} metalness={0.25} distort={0.2} speed={1.5} />
      </mesh>
      <mesh ref={vent} position={[0, -0.75, 0]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[1.35, 2.1, 64]} />
        <meshStandardMaterial color={CRIMSON} emissive={CRIMSON} emissiveIntensity={1.2} roughness={0.35} metalness={0.25} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.9, 32, 32]} />
        <meshBasicMaterial color={CRIMSON} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight ref={light} color={CRIMSON} intensity={6} distance={12} />
      <Html position={[0, 1.9, 0]} center distanceFactor={14}>
        <div className="text-[9px] font-black uppercase tracking-widest text-rose-300/80 select-none pointer-events-none whitespace-nowrap">Aurículas</div>
      </Html>
      <Html position={[0, -2.1, 0]} center distanceFactor={14}>
        <div className="text-[9px] font-black uppercase tracking-widest text-rose-300/80 select-none pointer-events-none whitespace-nowrap">Ventrículos</div>
      </Html>
    </group>
  );
}

type Tramo = 'sa' | 'av' | 'his' | 'purkinje';
/** Ventana (ms) de cada tramo de conducción dentro del ciclo. */
function ventanaTramo(tramo: Tramo, rr: number): [number, number] {
  const c = tiemposCicloB8(rr);
  const qrs = c.qrsFin - c.pr;
  if (tramo === 'sa') return [0, c.p];
  if (tramo === 'av') return [c.p, c.pr];
  if (tramo === 'his') return [c.pr, c.pr + 0.5 * qrs];
  return [c.pr + 0.3 * qrs, c.qrsFin];
}

function ConductionNode({ position, reloj, tramo, label }: {
  position: [number, number, number]; reloj: React.MutableRefObject<Reloj>; tramo: Tramo; label: string;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const heat = useRef(0);

  useFrame((_, delta) => {
    const { tCiclo, rr } = reloj.current;
    const [a, b] = ventanaTramo(tramo, rr);
    const active = tCiclo >= a && tCiclo < b;
    heat.current = active ? Math.min(1, heat.current + delta * 12) : Math.max(0, heat.current - delta * 4);
    if (mesh.current) {
      mesh.current.scale.setScalar(1 + heat.current * 0.9);
      (mesh.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + heat.current * 6;
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
        <div className="text-[9px] font-black uppercase tracking-widest text-cyan-300/80 select-none pointer-events-none whitespace-nowrap drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]">{label}</div>
      </Html>
    </group>
  );
}

function ConductionPath({ points, reloj, tramo }: {
  points: THREE.Vector3[]; reloj: React.MutableRefObject<Reloj>; tramo: Tramo;
}) {
  const COUNT = 26;
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const colors = useMemo(() => new Float32Array(COUNT * 3), []);
  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    const sampled = new THREE.CatmullRomCurve3(points).getPoints(COUNT - 1);
    sampled.forEach((s, i) => { arr[i * 3] = s.x; arr[i * 3 + 1] = s.y; arr[i * 3 + 2] = s.z; });
    return arr;
  }, [points]);

  useFrame(() => {
    const { tCiclo, rr } = reloj.current;
    const [a, b] = ventanaTramo(tramo, rr);
    const local = (tCiclo - a) / (b - a);
    const active = local >= 0 && local <= 1.15;
    for (let i = 0; i < COUNT; i++) {
      const d = Math.abs(i / (COUNT - 1) - local);
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
      <pointsMaterial size={0.14} vertexColors transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
}

const O = new THREE.Vector3(-3.6, 0.3, 0);
const SA_POS: [number, number, number] = [O.x - 0.4, O.y + 1.4, 0.2];
const AV_POS: [number, number, number] = [O.x + 0.1, O.y + 0.2, 0.3];
const HIS_PATH = [new THREE.Vector3(...AV_POS), new THREE.Vector3(O.x + 0.05, O.y - 0.4, 0.35), new THREE.Vector3(O.x, O.y - 1.0, 0.35)];
const PURK_L = [new THREE.Vector3(O.x, O.y - 1.0, 0.35), new THREE.Vector3(O.x - 0.6, O.y - 1.5, 0.3), new THREE.Vector3(O.x - 0.9, O.y - 1.9, 0.2)];
const PURK_R = [new THREE.Vector3(O.x, O.y - 1.0, 0.35), new THREE.Vector3(O.x + 0.6, O.y - 1.5, 0.3), new THREE.Vector3(O.x + 0.9, O.y - 1.9, 0.2)];

function ConductionSystem({ reloj }: { reloj: React.MutableRefObject<Reloj> }) {
  return (
    <group>
      <ConductionNode position={SA_POS} reloj={reloj} tramo="sa" label="Nodo SA" />
      <ConductionNode position={AV_POS} reloj={reloj} tramo="av" label="Nodo AV" />
      <ConductionPath points={HIS_PATH} reloj={reloj} tramo="his" />
      <ConductionPath points={PURK_L} reloj={reloj} tramo="purkinje" />
      <ConductionPath points={PURK_R} reloj={reloj} tramo="purkinje" />
    </group>
  );
}

/* ── Monitor ECG de barrido con cuadrícula de 200 ms / 0.5 mV ─────────────── */
const ANCHO = 8.5;
const X0 = 0.8;
const Y0 = -0.6;
const U_POR_MV = (ANCHO / (VENTANA_MS / 200)) * 2; // 1 mV = 10 mm = 2 cuadros grandes

function ECGTrace({ reloj }: { reloj: React.MutableRefObject<Reloj> }) {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const head = useRef<THREE.Mesh>(null);
  const faseRef = useRef<HTMLDivElement>(null);
  const ultimaFase = useRef('');
  const positions = useMemo(() => {
    const arr = new Float32Array(N_MUESTRAS * 3);
    for (let i = 0; i < N_MUESTRAS; i++) { arr[i * 3] = X0 + (i / (N_MUESTRAS - 1)) * ANCHO; arr[i * 3 + 1] = Y0; }
    return arr;
  }, []);
  const rejilla = useMemo(() => {
    const v: number[] = [];
    const cuadros = VENTANA_MS / 200;
    for (let k = 0; k <= cuadros; k++) { const x = X0 + (k / cuadros) * ANCHO; v.push(x, Y0 - 0.5 * U_POR_MV, -0.1, x, Y0 + 1.5 * U_POR_MV, -0.1); }
    for (let m = -0.5; m <= 1.5001; m += 0.5) { const y = Y0 + m * U_POR_MV; v.push(X0, y, -0.1, X0 + ANCHO, y, -0.1); }
    return new Float32Array(v);
  }, []);

  useFrame(() => {
    const r = reloj.current;
    for (let i = 0; i < N_MUESTRAS; i++) positions[i * 3 + 1] = Y0 + r.muestras[i] * U_POR_MV;
    if (geomRef.current) geomRef.current.attributes.position.needsUpdate = true;
    const ic = (r.cursor - 1 + N_MUESTRAS) % N_MUESTRAS;
    head.current?.position.set(positions[ic * 3], positions[ic * 3 + 1], 0);
    const fase = faseCicloB8(r.tCiclo, r.rr);
    if (fase !== ultimaFase.current && faseRef.current) { ultimaFase.current = fase; faseRef.current.textContent = fase; }
  });

  return (
    <group position={[-0.2, 2.4, 0]}>
      <mesh position={[X0 + ANCHO / 2, Y0 + 0.5 * U_POR_MV, -0.15]}>
        <planeGeometry args={[ANCHO + 0.6, 2 * U_POR_MV + 0.6]} />
        <meshBasicMaterial color="#020617" transparent opacity={0.7} />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[rejilla, 3]} count={rejilla.length / 3} />
        </bufferGeometry>
        <lineBasicMaterial color="#7f1d1d" transparent opacity={0.7} />
      </lineSegments>
      <line>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={N_MUESTRAS} />
        </bufferGeometry>
        <lineBasicMaterial color={ELECTRIC} transparent opacity={0.98} />
      </line>
      <mesh ref={head}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={ELECTRIC} toneMapped={false} />
      </mesh>
      <Html position={[X0, Y0 + 1.5 * U_POR_MV + 0.45, 0]} distanceFactor={16}>
        <div className="select-none pointer-events-none whitespace-nowrap">
          <div className="text-[9px] font-black uppercase tracking-widest text-cyan-300/70">Derivación II · 25 mm/s · cuadro grande = 200 ms</div>
          <div ref={faseRef} className="text-[10px] font-black text-teal-300">—</div>
        </div>
      </Html>
    </group>
  );
}

function Scene({ ritmoBPM }: { ritmoBPM: number }) {
  const bpm = Math.max(30, Math.min(220, ritmoBPM));
  const reloj = useRef<Reloj>({
    tCiclo: 0, rr: 60000 / bpm, rrObjetivo: 60000 / bpm, acc: 0,
    muestras: new Float32Array(N_MUESTRAS), cursor: 0,
  });

  return (
    <>
      {/* El reloj va PRIMERO: su useFrame se suscribe antes que el de los lectores. */}
      <RelojCardiaco reloj={reloj} bpm={bpm} />
      <PerspectiveCamera makeDefault position={[0.8, 1.5, 14]} fov={48} />
      <color attach="background" args={['#04060f']} />
      <fog attach="fog" args={['#04060f', 16, 38]} />

      <ambientLight intensity={0.32} />
      <hemisphereLight intensity={0.28} groundColor="#020617" />
      <directionalLight position={[5, 8, 6]} intensity={0.5} color="#fecdd3" />

      <BeatingHeart reloj={reloj} />
      <ConductionSystem reloj={reloj} />
      <ECGTrace reloj={reloj} />

      <Sparkles count={70} scale={[20, 12, 20]} size={2.2} speed={0.25} color="#fca5a5" opacity={0.4} />
      <Stars radius={90} depth={45} count={2800} factor={4} saturation={0} fade speed={0.5} />

      <OrbitControls
        enablePan={false} enableZoom minDistance={7} maxDistance={24}
        minPolarAngle={Math.PI / 6} maxPolarAngle={Math.PI / 1.7} target={[0.8, 1.2, 0]}
      />

      <EffectComposer multisampling={8}>
        <Bloom luminanceThreshold={0.12} mipmapBlur intensity={1.4} radius={0.75} />
        <ChromaticAberration offset={CA_OFFSET} radialModulation={false} modulationOffset={0} />
        <Vignette offset={0.2} darkness={1.05} />
      </EffectComposer>
    </>
  );
}

export default function Electrocardiograma3DScene({ ritmoBPM }: { ritmoBPM: number }) {
  return (
    <div className="w-full h-full">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <Suspense fallback={null}>
          <Scene ritmoBPM={ritmoBPM} />
        </Suspense>
      </Canvas>
    </div>
  );
}
