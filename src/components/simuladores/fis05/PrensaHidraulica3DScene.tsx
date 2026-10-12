"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface PrensaProps {
  y1: number; // Nivel del fluido bajo el émbolo 1 (0 a 1, fracción de la altura del cilindro)
  y2: number; // Nivel del fluido bajo el émbolo 2 (0 a 1)
  r1: number; // Radio pistón 1
  r2: number; // Radio pistón 2
}

function HydraulicSystem({ y1, y2, r1, r2 }: PrensaProps) {
  // Las alturas objetivo llegan acotadas a [0, 1]; la escena se acerca a ellas
  // suavemente en useFrame (antes era un setInterval de 30 ms en el panel que
  // además reconstruía las geometrías del fluido en cada tick).
  const fluido1 = useRef<THREE.Mesh>(null);
  const fluido2 = useRef<THREE.Mesh>(null);
  const embolo1 = useRef<THREE.Mesh>(null);
  const grupo2 = useRef<THREE.Group>(null);
  const actual = useRef({ y1: THREE.MathUtils.clamp(y1, 0, 1), y2: THREE.MathUtils.clamp(y2, 0, 1) });

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-6 * Math.min(delta, 0.1));
    const c = actual.current;
    c.y1 += (THREE.MathUtils.clamp(y1, 0, 1) - c.y1) * k;
    c.y2 += (THREE.MathUtils.clamp(y2, 0, 1) - c.y2) * k;
    // Columna de fluido de altura y·5 desde el fondo del cilindro (−2.5), y émbolo encima.
    const h1 = Math.max(0.001, c.y1 * 5);
    const h2 = Math.max(0.001, c.y2 * 5);
    if (fluido1.current) { fluido1.current.scale.y = h1; fluido1.current.position.y = -2.5 + h1 / 2; }
    if (fluido2.current) { fluido2.current.scale.y = h2; fluido2.current.position.y = -2.5 + h2 / 2; }
    if (embolo1.current) embolo1.current.position.y = -2.5 + h1 + 0.2;
    if (grupo2.current) grupo2.current.position.y = -2.5 + h2 + 0.2;
  });

  return (
    <group position={[0, -2, 0]}>
      {/* Pistón 1 (Entrada - Izquierda) */}
      <group position={[-5, 0, 0]}>
        {/* Cilindro de Vidrio */}
        <mesh>
          <cylinderGeometry args={[r1 + 0.2, r1 + 0.2, 5, 32]} />
          <meshPhysicalMaterial
            transparent opacity={0.2} transmission={0.9}
            thickness={0.5} roughness={0} metalness={0.1}
          />
        </mesh>
        {/* Fluido P1 (altura por escala: geometría de altura 1) */}
        <mesh ref={fluido1}>
          <cylinderGeometry args={[r1, r1, 1, 32]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} metalness={0.5} roughness={0.2} />
        </mesh>
        {/* El Émbolo */}
        <mesh ref={embolo1} castShadow>
          <cylinderGeometry args={[r1 + 0.1, r1 + 0.1, 0.4, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Pistón 2 (Salida - Derecha) */}
      <group position={[5, 0, 0]}>
        {/* Cilindro de Vidrio */}
        <mesh>
          <cylinderGeometry args={[r2 + 0.2, r2 + 0.2, 5, 32]} />
          <meshPhysicalMaterial
            transparent opacity={0.2} transmission={0.9}
            thickness={0.5} roughness={0} metalness={0.1}
          />
        </mesh>
        {/* Fluido P2 */}
        <mesh ref={fluido2}>
          <cylinderGeometry args={[r2, r2, 1, 32]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} metalness={0.5} roughness={0.2} />
        </mesh>
        {/* Émbolo mayor + carga, solidarios */}
        <group ref={grupo2}>
          <mesh castShadow>
            <cylinderGeometry args={[r2 + 0.1, r2 + 0.1, 0.4, 32]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
          </mesh>
          <group position={[0, 0.95, 0]}>
            <mesh castShadow>
              <boxGeometry args={[r2 * 1.5, 1.5, r2 * 1.5]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <boxGeometry args={[r2 * 1.2, 0.2, r2 * 1.2]} />
              <meshStandardMaterial color="#020617" />
            </mesh>
          </group>
        </group>
      </group>

      {/* Tubería de Conexión */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -2.3, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 10, 16]} />
        <meshStandardMaterial color="#0ea5e9" metalness={0.5} roughness={0.2} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -2.3, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 10.2, 16]} />
        <meshPhysicalMaterial transparent opacity={0.1} transmission={0.9} />
      </mesh>

      {/* Suelo de Laboratorio */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.6, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#0f172a" roughness={0.8} />
      </mesh>
      <gridHelper args={[50, 25, 0x334155, 0x1e293b]} position={[0, -2.59, 0]} />
    </group>
  );
}

export default function PrensaHidraulica3DScene(props: PrensaProps) {
  return (
    <div className="w-full h-full bg-[#020617]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[12, 8, 15]} fov={40} />
        <OrbitControls minDistance={10} maxDistance={30} maxPolarAngle={Math.PI / 2.1} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
        <spotLight position={[-10, 20, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />

        <HydraulicSystem {...props} />
      </Canvas>
    </div>
  );
}
