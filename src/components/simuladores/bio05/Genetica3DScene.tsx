"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

function PeaSeed({ genotype, position, delay }: { genotype: string, position: [number, number, number], delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const isYellow = genotype.includes('A');
  const isSmooth = genotype.includes('B');

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + delay;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.1;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        {isSmooth ? <sphereGeometry args={[0.35, 16, 16]} /> : <icosahedronGeometry args={[0.35, 1]} />}
        <meshStandardMaterial color={isYellow ? "#fbbf24" : "#22c55e"} roughness={0.5} />
      </mesh>
    </group>
  );
}

function ParentChamber({ genotype, position, color }: { genotype: string, position: [number, number, number], color: string }) {
  const isYellow = genotype.includes('A');
  const isSmooth = genotype.includes('B');

  return (
    <group position={position}>
      
      {/* Base */}
      <mesh position={[0, -2, 0]}>
         <cylinderGeometry args={[1.5, 1.8, 0.4, 32]} />
         <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.5} />
      </mesh>
      
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh>
          {isSmooth ? <sphereGeometry args={[0.8, 32, 32]} /> : <icosahedronGeometry args={[0.8, 1]} />}
          <meshStandardMaterial color={isYellow ? "#fbbf24" : "#22c55e"} roughness={0.3} />
        </mesh>
      </Float>

      {/* Cápsula */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 4.5, 32, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function Genetica3DScene({ padre1, padre2, f1, status }: { padre1: string, padre2: string, f1: string[], status?: string }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f8fafc' }}>
      <Canvas camera={{ position: [0, 8, 16], fov: 40 }}>
        <color attach="background" args={['#f8fafc']} />
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, 5, -10]} intensity={0.5} color="#6366f1" />

        <group position={[0, 0.5, 0]}>
          {f1 && f1.length > 0 ? (
            <group position={[-3.5, -0.5, -3.5]}>
              {f1.slice(0, 64).map((gen: string, i: number) => (
                <PeaSeed key={i} genotype={gen} position={[(i % 8) * 1.0, 0, Math.floor(i / 8) * 1.0]} delay={i * 0.05} />
              ))}
            </group>
          ) : (
            <group>
              <ParentChamber genotype={padre1} position={[-5.5, 0, 0]} color="#4f46e5" />
              <ParentChamber genotype={padre2} position={[5.5, 0, 0]} color="#ec4899" />
            </group>
          )}
        </group>

        {/* Suelo */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>

        <ContactShadows position={[0, -1.79, 0]} opacity={0.4} scale={30} blur={2.5} far={4} />
        <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
}
