"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Sparkles, OrbitControls, ContactShadows, Text, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function PeaSeed({ genotype, position, delay }) {
  const meshRef = useRef();
  const isYellow = genotype.includes('A');
  const isSmooth = genotype.includes('B');

  useFrame((state) => {
    const t = state.clock.getElapsedTime() + delay;
    meshRef.current.position.y = position[1] + Math.sin(t * 1.5) * 0.2;
    meshRef.current.rotation.y += 0.01;
    meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        {isSmooth ? (
          <sphereGeometry args={[0.35, 32, 32]} />
        ) : (
          <icosahedronGeometry args={[0.35, 1]} /> // Aspecto rugoso geométrico
        )}
        <meshStandardMaterial 
          color={isYellow ? "#fbbf24" : "#22c55e"} 
          emissive={isYellow ? "#b45309" : "#166534"}
          emissiveIntensity={0.5}
          roughness={isSmooth ? 0.1 : 0.8}
          metalness={0.3}
        />
      </mesh>
      
      {/* Halo de Energía */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial 
          color={isYellow ? "#fbbf24" : "#22c55e"} 
          transparent 
          opacity={0.1} 
          wireframe
        />
      </mesh>

      <Text
        position={[0, 0.6, 0]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {genotype}
      </Text>
    </group>
  );
}

function DNABond({ position }) {
  const ref = useRef();
  useFrame((state) => {
    ref.current.rotation.y = state.clock.getElapsedTime() * 2;
  });

  return (
    <group ref={ref} position={position}>
      {Array.from({ length: 10 }).map((_, i) => (
        <mesh key={i} position={[0, i * 0.2 - 1, 0]} rotation={[0, i * 0.5, 0]}>
          <boxGeometry args={[0.8, 0.05, 0.05]} />
          <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={2} />
        </mesh>
      ))}
    </group>
  );
}

function Population({ f1 }) {
  return (
    <group position={[-3.5, 0, -3.5]}>
      {f1.slice(0, 64).map((gen, i) => {
        const x = (i % 8) * 1.0;
        const z = Math.floor(i / 8) * 1.0;
        return (
          <PeaSeed 
            key={i} 
            genotype={gen} 
            position={[x, 0, z]} 
            delay={i * 0.05} 
          />
        );
      })}
    </group>
  );
}

function ParentChamber({ genotype, position, label, color }) {
  const isYellow = genotype.includes('A');
  const isSmooth = genotype.includes('B');

  return (
    <group position={position}>
      <Text position={[0, 2.8, 0]} fontSize={0.5} color="white" anchorX="center">
        {label}
      </Text>
      
      {/* Cápsula de Cristal */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 4, 16, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} metalness={1} roughness={0} />
      </mesh>

      <Float speed={3} rotationIntensity={1} floatIntensity={1}>
        <mesh>
          {isSmooth ? <sphereGeometry args={[0.8, 32, 32]} /> : <icosahedronGeometry args={[0.8, 1]} />}
          <MeshDistortMaterial 
            color={isYellow ? "#fbbf24" : "#22c55e"} 
            speed={2} 
            distort={0.1} 
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
      </Float>

      <Text position={[0, -1.2, 0]} fontSize={0.7} color="white" anchorX="center">
        {genotype}
      </Text>
      
      {/* Base Tecnológica */}
      <mesh position={[0, -2, 0]}>
         <cylinderGeometry args={[1.8, 2, 0.2, 32]} />
         <meshStandardMaterial color="#1e1b4b" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

export default function Genetica3DScene({ padre1, padre2, f1, status }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 12, 20], fov: 40 }}>
      <color attach="background" args={['#020617']} />
      
      <ambientLight intensity={0.5} />
      <hemisphereLight intensity={1} groundColor="#000000" color="#6366f1" />
      <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
      <spotLight position={[0, 20, 0]} angle={0.4} penumbra={1} intensity={5} castShadow />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={200} scale={20} size={3} speed={0.5} color="#6366f1" />

      {f1.length > 0 ? (
        <Population f1={f1} />
      ) : (
        <group>
           <ParentChamber genotype={padre1} position={[-6, 0, 0]} label="PROGENITOR P1" color="#4f46e5" />
           <ParentChamber genotype={padre2} position={[6, 0, 0]} label="PROGENITOR P2" color="#ec4899" />
           
           {/* Hélice de ADN entre padres */}
           <DNABond position={[0, 0, 0]} />
        </group>
      )}

      <ContactShadows position={[0, -2, 0]} opacity={0.6} scale={25} blur={2.5} far={5} />
      <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.5} minPolarAngle={Math.PI / 6} />
    </Canvas>
  );
}
