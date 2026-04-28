"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Sphere, Html, Cylinder, RoundedBox, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Snell3DSceneProps {
  n1: number;
  n2: number | string;
  n2Misterio: number;
  anguloIncidencia: number;
  status: 'idle' | 'success' | 'error';
  laserColor?: 'cyan' | 'red' | 'green' | 'violet' | 'white';
}

// Dispersión cromática: cada color refracta ligeramente diferente (Cauchy)
const SPECTRUM = [
  { name: 'Rojo',     hex: '#ef4444', iorOffset: -0.008 },
  { name: 'Naranja',  hex: '#f97316', iorOffset: -0.005 },
  { name: 'Amarillo', hex: '#eab308', iorOffset: -0.002 },
  { name: 'Verde',    hex: '#22c55e', iorOffset:  0.000 },
  { name: 'Cyan',     hex: '#06b6d4', iorOffset:  0.003 },
  { name: 'Azul',     hex: '#3b82f6', iorOffset:  0.006 },
  { name: 'Violeta',  hex: '#8b5cf6', iorOffset:  0.012 },
];

const LASER_COLORS: Record<string, string> = {
  cyan: '#22d3ee', red: '#ef4444', green: '#22c55e', violet: '#8b5cf6', white: '#ffffff',
};

/* ═══════════════════════════════════════════════════════════
   PARTÍCULAS ANIMADAS — Fluyen a lo largo del rayo láser
   como polvo iluminado en un laboratorio real oscuro
   ═══════════════════════════════════════════════════════════ */
function BeamParticles({ start, end, color, count = 30, speed = 2 }: {
  start: THREE.Vector3; end: THREE.Vector3; color: string; count?: number; speed?: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const offsets = useMemo(() => Array.from({ length: count }, () => Math.random()), [count]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      offsets[i] = (offsets[i] + delta * speed * (0.3 + Math.random() * 0.2)) % 1;
      const t = offsets[i];
      dummy.position.lerpVectors(start, end, t);
      // Small random scatter perpendicular to beam
      dummy.position.x += (Math.random() - 0.5) * 0.15;
      dummy.position.z += (Math.random() - 0.5) * 0.15;
      const s = 0.03 + Math.sin(t * Math.PI) * 0.06; // fade in/out
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════
   POLVO FLOTANTE — Partículas ambientales en el aire
   ═══════════════════════════════════════════════════════════ */
function FloatingDust({ count = 200 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() =>
    Array.from({ length: count }, () => ({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40,
      ),
      speed: 0.05 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
    })), [count]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      dummy.position.set(
        p.pos.x + Math.sin(t * p.speed + p.phase) * 0.5,
        p.pos.y + Math.cos(t * p.speed * 0.7 + p.phase) * 0.3,
        p.pos.z + Math.sin(t * p.speed * 0.5) * 0.4,
      );
      dummy.scale.setScalar(0.03 + Math.sin(t + p.phase) * 0.015);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#6b7280" transparent opacity={0.25} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════════════════
   CAÑÓN LÁSER — Dispositivo emisor de haz óptico
   ═══════════════════════════════════════════════════════════ */
function LaserDevice({ position, angle }: { position: THREE.Vector3; angle: number }) {
  const glowRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      (glowRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        4 + Math.sin(clock.getElapsedTime() * 8) * 1.5;
    }
  });
  return (
    <group position={position} rotation={[0, 0, -angle]}>
      {/* Cuerpo */}
      <Cylinder args={[0.18, 0.22, 2.5, 16]} position={[0, -1.25, 0]}>
        <meshStandardMaterial color="#0f172a" metalness={0.95} roughness={0.1} />
      </Cylinder>
      {/* Base trasera */}
      <Cylinder args={[0.28, 0.28, 0.4, 16]} position={[0, -2.7, 0]}>
        <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
      </Cylinder>
      {/* Anillo emisor */}
      <Cylinder args={[0.24, 0.24, 0.15, 16]} ref={glowRef} position={[0, 0, 0]}>
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={4} />
      </Cylinder>
      {/* Luz puntual que emana del cañón */}
      <pointLight position={[0, 0.2, 0]} color="#22d3ee" intensity={2} distance={5} />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   ARCO DE ÁNGULO — Visualización pedagógica del ángulo
   ═══════════════════════════════════════════════════════════ */
function AngleArc({ angle, radius, color, side }: {
  angle: number; radius: number; color: string; side: 'incident' | 'refracted';
}) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 32;
    const startAngle = side === 'incident' ? 0 : Math.PI;
    const endAngle = side === 'incident' ? angle : Math.PI + angle;
    for (let i = 0; i <= segments; i++) {
      const a = startAngle + (endAngle - startAngle) * (i / segments);
      pts.push(new THREE.Vector3(Math.sin(a) * radius, Math.cos(a) * radius, 0));
    }
    return pts;
  }, [angle, radius, side]);

  if (angle < 0.02) return null;

  return <Line points={points} color={color} lineWidth={2} transparent opacity={0.6} />;
}

/* ═══════════════════════════════════════════════════════════
   LÍNEA NORMAL — Punteada, referencia pedagógica clave
   ═══════════════════════════════════════════════════════════ */
function NormalLine() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 40;
    for (let i = 0; i < segments; i++) {
      // Dashed: alternate short segments
      if (i % 2 === 0) {
        pts.push(new THREE.Vector3(0, 8 - (i / segments) * 16, 0));
        pts.push(new THREE.Vector3(0, 8 - ((i + 1) / segments) * 16, 0));
      }
    }
    return pts;
  }, []);

  return (
    <group>
      {Array.from({ length: 20 }).map((_, i) => {
        const y1 = 8 - (i * 2 / 40) * 16;
        const y2 = 8 - ((i * 2 + 1) / 40) * 16;
        return (
          <Line
            key={i}
            points={[new THREE.Vector3(0, y1, 0), new THREE.Vector3(0, y2, 0)]}
            color="#94a3b8"
            lineWidth={1}
            transparent
            opacity={0.4}
          />
        );
      })}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   BLOQUE DE CRISTAL — Prisma con bordes biselados
   ═══════════════════════════════════════════════════════════ */
function GlassBlock({ n2Color, ior }: { n2Color: string; ior: number }) {
  const edgeRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (edgeRef.current) {
      (edgeRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.15;
    }
  });

  return (
    <group position={[0, -5, 0]}>
      {/* Bloque principal de cristal con transmisión física */}
      <RoundedBox args={[20, 10, 20]} radius={0.3} smoothness={4}>
        <meshPhysicalMaterial
          color={n2Color}
          transmission={0.92}
          opacity={1}
          transparent
          roughness={0.02}
          thickness={10}
          ior={ior}
          clearcoat={1}
          clearcoatRoughness={0.05}
          side={THREE.DoubleSide}
          envMapIntensity={0.5}
        />
      </RoundedBox>
      {/* Borde superior del cristal (arista luminosa) */}
      <mesh ref={edgeRef} position={[0, 5.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          color={n2Color}
          emissive={n2Color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Etiqueta del medio */}
      <Html position={[10.5, 0, 0]} center zIndexRange={[100, 0]}>
        <div className="text-[9px] font-black text-cyan-400/50 uppercase tracking-widest whitespace-nowrap"
          style={{ textShadow: '0 0 10px rgba(34,211,238,0.5)' }}>
          MEDIO 2 (n₂)
        </div>
      </Html>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   INTERFAZ SUPERIOR (AIRE) — Etiqueta visual
   ═══════════════════════════════════════════════════════════ */
function AirLabel() {
  return (
    <Html position={[10.5, 5, 0]} center zIndexRange={[100, 0]}>
      <div className="text-[9px] font-black text-white/30 uppercase tracking-widest whitespace-nowrap">
        MEDIO 1 (n₁ = AIRE)
      </div>
    </Html>
  );
}

/* ═══════════════════════════════════════════════════════════
   CAUSTIC IMPACT — Punto de impacto brillante y pulsante
   ═══════════════════════════════════════════════════════════ */
function CausticImpact({ isTIR }: { isTIR: boolean }) {
  const ref = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ref.current) {
      const s = 0.15 + Math.sin(t * 6) * 0.05;
      ref.current.scale.setScalar(s / 0.15);
      (ref.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 6 + Math.sin(t * 8) * 3;
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.3);
      (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = isTIR ? 4 : 1;
    }
  });

  return (
    <group>
      <Sphere ref={ref} args={[0.15, 16, 16]}>
        <meshStandardMaterial
          color={isTIR ? "#ef4444" : "#ffffff"}
          emissive={isTIR ? "#ef4444" : "#ffffff"}
          emissiveIntensity={6}
        />
      </Sphere>
      {/* Anillo de impacto */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshStandardMaterial
          color={isTIR ? "#ef4444" : "#22d3ee"}
          emissive={isTIR ? "#ef4444" : "#22d3ee"}
          emissiveIntensity={1}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Luz puntual en el impacto */}
      <pointLight
        color={isTIR ? "#ef4444" : "#22d3ee"}
        intensity={isTIR ? 5 : 2}
        distance={8}
      />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   MESA ÓPTICA — Base del laboratorio
   ═══════════════════════════════════════════════════════════ */
function OpticalTable() {
  return (
    <group position={[0, -10.5, 0]}>
      {/* Superficie */}
      <RoundedBox args={[28, 0.8, 28]} radius={0.15} smoothness={2}>
        <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
      </RoundedBox>
      {/* Agujeros de montaje (patrón de mesa óptica real) */}
      {Array.from({ length: 5 }).map((_, ix) =>
        Array.from({ length: 5 }).map((_, iz) => (
          <Cylinder
            key={`${ix}-${iz}`}
            args={[0.1, 0.1, 0.82, 8]}
            position={[(ix - 2) * 5, 0, (iz - 2) * 5]}
          >
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </Cylinder>
        ))
      )}
      {/* Patas */}
      {[[-12, -12], [12, -12], [-12, 12], [12, 12]].map(([x, z], i) => (
        <Cylinder key={i} args={[0.4, 0.5, 4, 8]} position={[x, -2.5, z]}>
          <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
        </Cylinder>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   CORE — Lógica principal de refracción y renderizado
   ═══════════════════════════════════════════════════════════ */
function RefractionCore({ n1, n2, n2Misterio, anguloIncidencia, laserColor = 'cyan' }: Snell3DSceneProps) {
  const realN2 = n2 === 'misterio' ? n2Misterio : (n2 as number);
  const theta1Rad = (anguloIncidencia * Math.PI) / 180;
  const isWhite = laserColor === 'white';
  const baseHex = LASER_COLORS[laserColor] || '#22d3ee';

  const sinTheta2 = (n1 / realN2) * Math.sin(theta1Rad);
  const isTIR = sinTheta2 > 1.0;
  const theta2Rad = isTIR ? 0 : Math.asin(sinTheta2);

  const beamLength = 12;

  const start = new THREE.Vector3(-Math.sin(theta1Rad) * beamLength, Math.cos(theta1Rad) * beamLength, 0);
  const center = new THREE.Vector3(0, 0, 0);
  const endRefracted = new THREE.Vector3(Math.sin(theta2Rad) * beamLength, -Math.cos(theta2Rad) * beamLength, 0);
  const endReflected = new THREE.Vector3(Math.sin(theta1Rad) * beamLength, Math.cos(theta1Rad) * beamLength, 0);

  const incidentHDR = new THREE.Color(isWhite ? '#ffffff' : baseHex).multiplyScalar(isWhite ? 3 : 4);
  const reflectedHDR = new THREE.Color(isTIR ? '#ef4444' : (isWhite ? '#ffffff' : baseHex)).multiplyScalar(4);

  // Rainbow refracted rays (only when white light)
  const spectrumRays = useMemo(() => {
    if (!isWhite || isTIR) return [];
    return SPECTRUM.map(c => {
      const effN2 = realN2 + c.iorOffset;
      const sT2 = (n1 / effN2) * Math.sin(theta1Rad);
      if (sT2 > 1) return null;
      const t2 = Math.asin(sT2);
      return {
        ...c,
        end: new THREE.Vector3(Math.sin(t2) * beamLength, -Math.cos(t2) * beamLength, 0),
        hdr: new THREE.Color(c.hex).multiplyScalar(3),
      };
    }).filter(Boolean) as { name: string; hex: string; iorOffset: number; end: THREE.Vector3; hdr: THREE.Color }[];
  }, [isWhite, isTIR, realN2, n1, theta1Rad, beamLength]);

  return (
    <group>
      <NormalLine />
      <AngleArc angle={theta1Rad} radius={3} color={isWhite ? '#ffffff' : baseHex} side="incident" />
      {!isTIR && !isWhite && <AngleArc angle={theta2Rad} radius={3} color="#f472b6" side="refracted" />}

      {/* Dispositivo láser (el color del anillo cambia) */}
      <LaserDevice position={start} angle={theta1Rad} />

      {/* Rayo Incidente */}
      <Line points={[start, center]} color={incidentHDR} lineWidth={isWhite ? 5 : 4} />
      <BeamParticles start={start} end={center} color={isWhite ? '#e2e8f0' : baseHex} count={25} speed={3} />

      {/* Rayo Reflejado */}
      <Line points={[center, endReflected]} color={reflectedHDR} lineWidth={isTIR ? 4 : 1.5} transparent opacity={isTIR ? 1 : 0.12} />
      {isTIR && <BeamParticles start={center} end={endReflected} color="#ef4444" count={25} speed={3} />}

      {/* ═══ MODO ARCOÍRIS (luz blanca) ═══ */}
      {isWhite && !isTIR && spectrumRays.map((ray, i) => (
        <group key={ray.name}>
          <Line points={[center, ray.end]} color={ray.hdr} lineWidth={3} />
          <BeamParticles start={center} end={ray.end} color={ray.hex} count={12} speed={1.5 + i * 0.15} />
          <Sphere args={[0.15, 8, 8]} position={ray.end}>
            <meshStandardMaterial color={ray.hex} emissive={ray.hex} emissiveIntensity={4} />
          </Sphere>
        </group>
      ))}

      {/* ═══ MODO COLOR ÚNICO ═══ */}
      {!isWhite && !isTIR && (
        <group>
          <Line points={[center, endRefracted]} color={new THREE.Color(baseHex).multiplyScalar(4)} lineWidth={4} />
          <BeamParticles start={center} end={endRefracted} color={baseHex} count={25} speed={2} />
        </group>
      )}

      <CausticImpact isTIR={isTIR} />

      {/* Etiquetas */}
      <Html position={[start.x * 0.5, start.y * 0.5 + 1.5, 0]} center zIndexRange={[100, 0]}>
        <div className="text-[10px] font-black text-cyan-300 bg-black/70 px-3 py-1 rounded-lg border border-cyan-500/40 backdrop-blur-md"
          style={{ textShadow: '0 0 8px rgba(34,211,238,0.6)' }}>
          θ₁ = {anguloIncidencia}°
        </div>
      </Html>

      {!isTIR && !isWhite && (
        <Html position={[endRefracted.x * 0.4, endRefracted.y * 0.4 - 1.5, 0]} center zIndexRange={[100, 0]}>
          <div className="text-[10px] font-black text-pink-300 bg-black/70 px-3 py-1 rounded-lg border border-pink-500/40 backdrop-blur-md"
            style={{ textShadow: '0 0 8px rgba(244,114,182,0.6)' }}>
            θ₂ = {((theta2Rad * 180) / Math.PI).toFixed(1)}°
          </div>
        </Html>
      )}

      {isWhite && !isTIR && (
        <Html position={[3, -4, 0]} center zIndexRange={[100, 0]}>
          <div className="text-[10px] font-black text-white bg-black/70 px-4 py-2 rounded-xl border border-white/20 backdrop-blur-md text-center"
            style={{ textShadow: '0 0 8px rgba(255,255,255,0.4)' }}>
            <span className="block text-[8px] text-white/50 uppercase tracking-widest mb-1">Dispersión Cromática</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-cyan-400 to-violet-400 font-black text-sm">
              ESPECTRO VISIBLE
            </span>
          </div>
        </Html>
      )}

      {isTIR && (
        <Html position={[4, 1, 0]} center zIndexRange={[100, 0]}>
          <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-black text-red-400 bg-red-500/15 px-5 py-2.5 rounded-full border border-red-500/50 backdrop-blur-xl animate-pulse"
              style={{ textShadow: '0 0 12px rgba(239,68,68,0.8)' }}>
              ⚠ REFLEXIÓN TOTAL INTERNA
            </div>
          </div>
        </Html>
      )}
      <AirLabel />
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════
   ESCENA PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
export default function Snell3DScene(props: Snell3DSceneProps) {
  const realN2 = props.n2 === 'misterio' ? props.n2Misterio : (props.n2 as number);
  const n2Color = props.n2 === 'misterio' ? '#06b6d4' : '#0ea5e9';

  return (
    <div className="w-full h-full bg-[#0c1222]">
      <Canvas
        camera={{ position: [18, 8, 22], fov: 42 }}
        gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <color attach="background" args={['#0c1222']} />
        <fog attach="fog" args={['#0c1222', 35, 80]} />

        {/* ── ILUMINACIÓN CINEMÁTICA ── */}
        <ambientLight intensity={0.15} />
        <directionalLight position={[10, 20, 5]} intensity={0.3} color="#e2e8f0" />
        <spotLight position={[0, 25, 0]} intensity={0.8} angle={0.4} penumbra={1} color="#22d3ee" />
        <pointLight position={[-15, 10, -15]} intensity={0.3} color="#8b5cf6" />
        <pointLight position={[15, 10, 15]} intensity={0.3} color="#06b6d4" />

        {/* ── POLVO FLOTANTE ── */}
        <FloatingDust count={150} />

        {/* ── MESA ÓPTICA ── */}
        <OpticalTable />

        {/* ── BLOQUE DE CRISTAL ── */}
        <GlassBlock n2Color={n2Color} ior={realN2 || 1.5} />

        {/* ── REFRACCIÓN ── */}
        <RefractionCore {...props} />

        {/* ── CONTROLES DE CÁMARA ── */}
        <OrbitControls
          makeDefault
          enablePan={false}
          minDistance={15}
          maxDistance={50}
          maxPolarAngle={Math.PI / 1.6}
          autoRotate
          autoRotateSpeed={0.3}
        />

        {/* ── POST-PROCESAMIENTO ── */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.6} mipmapBlur intensity={1.2} radius={0.7} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
