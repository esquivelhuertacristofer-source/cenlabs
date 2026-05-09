"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Float, Stars, Text, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface Transformaciones3DSceneProps {
  tx: number;
  ty: number;
  rotacion: number;
  escala: number;
  target: {
    tx: number;
    ty: number;
    rotacion: number;
    escala: number;
  };
  status: 'idle' | 'success' | 'error';
}

function Spaceship({ position, rotation, scale, color, opacity = 1, ghost = false }: { position: [number, number, number], rotation: number, scale: number, color: string, opacity?: number, ghost?: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  return (
    <group position={position} rotation={[0, 0, (rotation * Math.PI) / 180]} scale={scale}>
      {/* Cuerpo de la Nave */}
      <mesh>
        <coneGeometry args={[1, 3, 4]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={ghost ? 0.2 : 1} 
          transparent 
          opacity={opacity} 
          wireframe={ghost}
        />
      </mesh>
      
      {/* Propulsores / Alas */}
      <mesh position={[0, -1, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[1.5, 0.2, 1.5]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>

      {!ghost && (
        <pointLight intensity={2} distance={5} color={color} position={[0, -2, 0]} />
      )}
    </group>
  );
}

export default function Transformaciones3DScene({ tx, ty, rotacion, escala, target, status }: Transformaciones3DSceneProps) {
  return (
    <div className="w-full h-full bg-[#020617]">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 15, 50]} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#0ea5e9" />
        
        <group rotation={[Math.PI / 6, -Math.PI / 6, 0]}>
          {/* Rejilla de Navegación */}
          <Grid 
            infiniteGrid 
            fadeDistance={30} 
            cellColor="#1e293b" 
            sectionColor="#334155" 
            sectionSize={5}
            cellSize={1}
            rotation={[Math.PI / 2, 0, 0]} 
          />

          {/* EJES */}
          <Line points={[[-20, 0, 0], [20, 0, 0]]} color="white" lineWidth={0.5} transparent opacity={0.1} />
          <Line points={[[0, -20, 0], [0, 20, 0]]} color="white" lineWidth={0.5} transparent opacity={0.1} />

          {/* OBJETIVO (FANTASMA) */}
          <Spaceship 
            position={[target.tx, target.ty, 0]} 
            rotation={target.rotacion} 
            scale={target.escala} 
            color="#ffffff" 
            opacity={0.2} 
            ghost 
          />

          {/* NAVE DEL ALUMNO */}
          <Spaceship 
            position={[tx, ty, 0]} 
            rotation={rotacion} 
            scale={escala} 
            color={status === 'success' ? '#10b981' : '#f59e0b'} 
          />
        </group>

        <OrbitControls enablePan={true} enableZoom={true} makeDefault />
      </Canvas>
    </div>
  );
}
