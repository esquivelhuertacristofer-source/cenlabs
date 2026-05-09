"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, Sparkles, MeshDistortMaterial, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function Photon({ color, speed, intensity }) {
  const meshRef = useRef();
  const initialX = useMemo(() => Math.random() * 20 - 10, []);
  const initialZ = useMemo(() => Math.random() * 10 - 5, []);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    meshRef.current.position.y = 10 - (t % 15);
    meshRef.current.position.x = initialX;
    meshRef.current.position.z = initialZ;
    meshRef.current.scale.setScalar((Math.sin(t * 10) * 0.3 + 0.7) * intensity);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={5} />
    </mesh>
  );
}

function Thylakoid({ position, isActive, intensity }) {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (isActive) {
      const t = state.clock.getElapsedTime();
      meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.05 * intensity);
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[1.5, 1.5, 0.3, 32]} />
      <meshStandardMaterial 
        color={isActive ? "#22c55e" : "#064e3b"} 
        emissive="#22c55e" 
        emissiveIntensity={isActive ? 0.5 * intensity : 0} 
        roughness={0.2}
      />
    </mesh>
  );
}

function Granum({ position, isActive, intensity }) {
  return (
    <group position={position}>
      {[0, 0.4, 0.8, 1.2].map((y) => (
        <Thylakoid key={y} position={[0, y, 0]} isActive={isActive} intensity={intensity} />
      ))}
    </group>
  );
}

function OxygenBubble({ delay }) {
  const meshRef = useRef();
  const initialX = useMemo(() => Math.random() * 6 - 3, []);
  const initialZ = useMemo(() => Math.random() * 6 - 3, []);
  
  useFrame((state) => {
    const t = (state.clock.getElapsedTime() + delay) % 4;
    meshRef.current.position.y = -2 + t * 3;
    meshRef.current.position.x = initialX + Math.sin(t * 2) * 0.5;
    meshRef.current.position.z = initialZ + Math.cos(t * 2) * 0.5;
    meshRef.current.scale.setScalar(t * 0.2);
    meshRef.current.material.opacity = 1 - (t / 4);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.3, 12, 12]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.6} metalness={1} roughness={0} />
    </mesh>
  );
}

function ChloroplastModel({ simulando, colorLuz, intensidad }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
  });

  const lightColor = {
    'blanco': '#ffffff',
    'rojo': '#ef4444',
    'azul': '#3b82f6',
    'verde': '#22c55e',
    'amarillo': '#eab308'
  }[colorLuz] || '#ffffff';

  const normalizedIntensity = Math.min(2, Math.max(0.2, intensidad * 10));

  return (
    <group ref={groupRef}>
      {/* Membrana Exterior */}
      <mesh>
        <sphereGeometry args={[9, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
        <meshStandardMaterial 
          color={lightColor} 
          transparent 
          opacity={0.1} 
          side={THREE.DoubleSide} 
          emissive={lightColor}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Grana (Pilas de Tilacoides) */}
      <Granum position={[3, -2, 0]} isActive={simulando} intensity={normalizedIntensity} />
      <Granum position={[-3, -2, 2]} isActive={simulando} intensity={normalizedIntensity} />
      <Granum position={[0, -2, -4]} isActive={simulando} intensity={normalizedIntensity} />
      <Granum position={[2, -2, 4]} isActive={simulando} intensity={normalizedIntensity} />
      <Granum position={[-4, -2, -2]} isActive={simulando} intensity={normalizedIntensity} />

      {/* Simulación de Fotones (Mucho más visibles) */}
      {simulando && Array.from({ length: 60 }).map((_, i) => (
        <Photon key={i} color={lightColor} speed={2 + Math.random() * 3} intensity={normalizedIntensity} />
      ))}

      {/* Burbujas de Oxígeno (Emergiendo solo si simula) */}
      {simulando && Array.from({ length: 15 }).map((_, i) => (
        <OxygenBubble key={`o2-${i}`} delay={i * 0.5} />
      ))}
    </group>
  );
}

export default function Fotosintesis3DScene({ simulando, colorLuz, intensidad }) {
  const lightColor = {
    'blanco': '#ffffff',
    'rojo': '#ef4444',
    'azul': '#3b82f6',
    'verde': '#22c55e',
    'amarillo': '#eab308'
  }[colorLuz] || '#ffffff';

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 15, 22], fov: 40 }}>
      <color attach="background" args={['#020617']} />
      
      {/* Luz ambiental reactiva al color seleccionado */}
      <ambientLight intensity={0.5} color={lightColor} />
      
      <pointLight position={[10, 10, 10]} intensity={2 * intensidad * 10} color={lightColor} />
      <directionalLight position={[0, 20, 0]} intensity={4 * intensidad * 10} color={lightColor} />
      
      {/* Foco de luz directo sobre el cloroplasto */}
      <spotLight position={[0, 15, 0]} angle={0.6} penumbra={1} intensity={10} color={lightColor} castShadow />

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <Sparkles count={simulando ? 500 : 100} scale={20} size={simulando ? 4 : 1} speed={0.5} color={lightColor} />

      <ChloroplastModel simulando={simulando} colorLuz={colorLuz} intensidad={intensidad} />

      <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.5} minPolarAngle={Math.PI / 4} />
    </Canvas>
  );
}
