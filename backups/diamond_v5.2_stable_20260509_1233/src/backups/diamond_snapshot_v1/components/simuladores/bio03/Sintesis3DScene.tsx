"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Sparkles, MeshDistortMaterial, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Estilo de la primera iteración: Palitos y Esferas Sólidas
function DNASegment({ position, rotation, color, delay = 0, isActive }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() + delay;
    meshRef.current.position.y = position[1] + Math.sin(t) * (isActive ? 0.3 : 0.1);
    if (isActive) meshRef.current.rotation.y += 0.05;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <cylinderGeometry args={[0.1, 0.1, 1.2, 8]} />
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={isActive ? 3 : 0.8} 
      />
    </mesh>
  );
}

function DNAHelix({ currentIndex }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
  });

  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      const y = (i - 10) * 0.8;
      const angle = i * 0.5;
      pts.push({ angle, y, index: i });
    }
    return pts;
  }, []);

  return (
    <group ref={groupRef}>
      {points.map((p, i) => {
        const radius = i === currentIndex ? 4 : 2; // Apertura reactiva
        const pos1 = [Math.cos(p.angle) * radius, p.y, Math.sin(p.angle) * radius];
        const pos2 = [Math.cos(p.angle + Math.PI) * radius, p.y, Math.sin(p.angle + Math.PI) * radius];
        const color = i % 2 === 0 ? "#219EBC" : "#FB8500";

        return (
          <group key={i}>
            <mesh position={pos1}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={i === currentIndex ? 5 : 1} />
            </mesh>
            <mesh position={pos2}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={i === currentIndex ? 5 : 1} />
            </mesh>
            <DNASegment 
              position={[(pos1[0] + pos2[0])/2, p.y, (pos1[2] + pos2[2])/2]} 
              rotation={[0, 0, Math.PI / 2 + p.angle]}
              color={color}
              delay={i * 0.1}
              isActive={i === currentIndex}
            />
          </group>
        );
      })}
    </group>
  );
}

function Ribosome({ proteinaCount }) {
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;
    groupRef.current.position.y = Math.cos(t) * 0.2;
  });

  return (
    <group ref={groupRef}>
      {/* Subunidad Grande - Estilo Sólido (No más manchas negras) */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[2.5, 32, 32]} />
        <MeshDistortMaterial 
          color="#3b82f6" 
          speed={2} 
          distort={0.2} 
          roughness={0.2} 
          metalness={0.8}
          emissive="#1e40af"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Subunidad Pequeña */}
      <mesh position={[0, -1, 0]}>
        <capsuleGeometry args={[2, 2, 4, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.5} emissive="#0f172a" />
      </mesh>

      {/* Cadena de Proteína */}
      <group position={[0, 3, 0]}>
         {Array.from({ length: proteinaCount }).map((_, i) => (
           <Float key={i} speed={3} rotationIntensity={2} floatIntensity={2}>
              <mesh position={[0, i * 0.7, 0]}>
                 <sphereGeometry args={[0.3, 16, 16]} />
                 <meshStandardMaterial color={new THREE.Color().setHSL((i * 0.2) % 1, 0.8, 0.5)} emissive="white" emissiveIntensity={0.5} />
              </mesh>
           </Float>
         ))}
      </group>
    </group>
  );
}

export default function Sintesis3DScene({ fase, currentIndex, proteinaCount }) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 15], fov: 45 }}>
      <color attach="background" args={['#020617']} />
      
      {/* Iluminación MASIVA para evitar manchas oscuras */}
      <ambientLight intensity={1.5} />
      <pointLight position={[10, 10, 10]} intensity={4} color="#ffffff" />
      <pointLight position={[-10, -10, -10]} intensity={2} color="#8b5cf6" />
      <directionalLight position={[0, 5, 10]} intensity={2} />
      <spotLight position={[0, 10, 0]} intensity={2} angle={0.5} />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={300} scale={20} size={2} speed={0.5} color="#ffffff" />

      <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
        {fase === 'transcripcion' ? (
          <DNAHelix currentIndex={currentIndex} />
        ) : (
          <Ribosome proteinaCount={proteinaCount} />
        )}
      </Float>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#020617" transparent opacity={0.5} />
      </mesh>
    </Canvas>
  );
}
