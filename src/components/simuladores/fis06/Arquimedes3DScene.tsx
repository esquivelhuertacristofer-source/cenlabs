"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, PerspectiveCamera, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface Arquimedes3DSceneProps {
  densidadObjeto: number;
  densidadFluido: number;
  volumenObjeto: number;
  isSumergido: boolean;
  colorFluido: string;
  colorObjeto: string;
}

function WaterTank({ color, density }: { color: string, density: number }) {
  return (
    <group position={[0, -2, 0]}>
      {/* Contenedor de vidrio */}
      <mesh>
        <boxGeometry args={[10, 10, 10]} />
        <meshPhysicalMaterial 
          transparent 
          opacity={0.15} 
          roughness={0} 
          metalness={0.1} 
          transmission={0.9} 
          thickness={1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* El Fluido */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[9.8, 9, 9.8]} />
        <meshPhysicalMaterial 
          color={color} 
          transparent 
          opacity={0.4} 
          roughness={0} 
          transmission={0.5}
        />
      </mesh>
      {/* Base */}
      <mesh position={[0, -5.2, 0]}>
        <boxGeometry args={[11, 0.5, 11]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

function FloatingBlock({ 
  densidadObjeto, 
  densidadFluido, 
  volumenObjeto, 
  isSumergido, 
  colorObjeto 
}: Arquimedes3DSceneProps) {
  const meshRef = useRef<THREE.Group>(null);
  
  // Fuerza de Peso (W = m*g)
  const g = 9.81;
  const masa = densidadObjeto * volumenObjeto;
  const W = masa * g;
  
  // Fuerza de Empuje (E = rho_f * g * V_sum)
  // En este simulador, si isSumergido es true, V_sum = volumenObjeto
  // Si no, es 0 (está fuera).
  const E = isSumergido ? densidadFluido * g * volumenObjeto : 0;
  
  // Posición Y objetivo
  // Fuera del agua: y = 8
  // Sumergido: y = -2 (centro del tanque)
  const targetY = isSumergido ? -2 : 8;

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
    
    // Animación de flotación si está sumergido
    if (isSumergido) {
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={[0, 8, 0]}>
      {/* El Bloque */}
      <mesh>
        <boxGeometry args={[4, 4, 4]} />
        <meshStandardMaterial color={colorObjeto} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Dinamómetro (Representación simple) */}
      <mesh position={[0, 10, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 20]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>

      {/* Vectores de Fuerza */}
      <group position={[2.5, 0, 0]}>
        {/* Vector Peso (Rojo) */}
        <group scale={[1, -1, 1]}>
           <Arrow length={Math.min(5, W * 0.2)} color="#ef4444" label="W" />
        </group>
        
        {/* Vector Empuje (Azul) */}
        {isSumergido && (
          <group scale={[1, 1, 1]}>
             <Arrow length={Math.min(5, E * 0.2)} color="#3b82f6" label="E" />
          </group>
        )}
      </group>
    </group>
  );
}

function Arrow({ length, color, label }: { length: number, color: string, label: string }) {
  return (
    <group>
      <mesh position={[0, length / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, length]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, length, 0]}>
        <coneGeometry args={[0.3, 0.6, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

export default function Arquimedes3DScene(props: Arquimedes3DSceneProps) {
  return (
    <div className="w-full h-full bg-[#020617]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[20, 10, 25]} fov={40} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        
        {/* Iluminación Estándar Robusta */}
        <ambientLight intensity={0.5} />
        <pointLight position={[20, 30, 10]} intensity={1.5} />
        <spotLight position={[-20, 30, 20]} angle={0.3} penumbra={1} intensity={2} castShadow />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <WaterTank color={props.colorFluido} density={props.densidadFluido} />
        <FloatingBlock {...props} />

        {/* Suelo infinito */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]} receiveShadow>
          <planeGeometry args={[1000, 1000]} />
          <meshStandardMaterial color="#020617" roughness={1} />
        </mesh>
        
        <gridHelper args={[100, 20, 0x1e293b, 0x0f172a]} position={[0, -9.9, 0]} />
      </Canvas>
    </div>
  );
}
