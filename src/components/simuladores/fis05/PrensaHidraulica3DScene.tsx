"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface PrensaProps {
  y1: number; // Altura pistón 1 (0 a 1)
  y2: number; // Altura pistón 2 (0 a 1)
  r1: number; // Radio pistón 1
  r2: number; // Radio pistón 2
}

function HydraulicSystem({ y1, y2, r1, r2 }: PrensaProps) {
  const fluidRef = useRef<THREE.Group>(null);

  // Escalamiento visual: r1 y r2 suelen ser 1 y 2-4
  // y1 y y2 se mapean a alturas físicas (-2 a 2 por ejemplo)
  const h1 = -2 + (y1 * 4);
  const h2 = -2 + (y2 * 4);

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
        {/* Fluido P1 */}
        <mesh position={[0, -2.5 + (y1 * 2.5), 0]}>
          <cylinderGeometry args={[r1, r1, y1 * 5, 32]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} metalness={0.5} roughness={0.2} />
        </mesh>
        {/* El Émbolo */}
        <mesh position={[0, h1, 0]} castShadow>
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
        <mesh position={[0, -2.5 + (y2 * 2.5), 0]}>
          <cylinderGeometry args={[r2, r2, y2 * 5, 32]} />
          <meshStandardMaterial color="#0ea5e9" transparent opacity={0.6} metalness={0.5} roughness={0.2} />
        </mesh>
        {/* El Émbolo Mayor */}
        <mesh position={[0, h2, 0]} castShadow>
          <cylinderGeometry args={[r2 + 0.1, r2 + 0.1, 0.4, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* CARGA (Un bloque pesado o vehículo simulado) */}
        <group position={[0, h2 + 1.2, 0]}>
           <mesh castShadow>
              <boxGeometry args={[r2 * 1.5, 1.5, r2 * 1.5]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.6} roughness={0.3} />
           </mesh>
           {/* Detalles estéticos de carga */}
           <mesh position={[0, 0.8, 0]}>
              <boxGeometry args={[r2 * 1.2, 0.2, r2 * 1.2]} />
              <meshStandardMaterial color="#020617" />
           </mesh>
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
