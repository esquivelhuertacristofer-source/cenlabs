"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, PerspectiveCamera, 
  Float, MeshDistortMaterial, ContactShadows,
  Sparkles, Stars, MeshWobbleMaterial
} from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// ── NUBE DE ENERGÍA QUÍMICA (Glow Particles) ──
function BioEnergy({ count, color, speed = 1 }: any) {
  return (
    <Sparkles 
      count={count}
      scale={8}
      size={6}
      speed={speed}
      color={color}
      opacity={0.4}
      noise={1}
    />
  );
}

// ── ERITROCITO "DIAMOND GLOW" ──
function Eritrocito({ volumen }: { volumen: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const safeVol = isNaN(volumen) ? 100 : volumen;
  const scale = safeVol / 100;
  const isStressed = safeVol > 165;

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const f = Math.max(0.2, Math.min(1.0, 0.35 * (safeVol / 100)));
    meshRef.current.scale.set(scale * 1.5, scale * f, scale * 1.5);
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <MeshWobbleMaterial 
          color={isStressed ? "#ff0000" : "#ef4444"}
          factor={isStressed ? 1 : 0.2} 
          speed={isStressed ? 5 : 1}
          emissive={isStressed ? "#ff0000" : "#991b1b"}
          emissiveIntensity={isStressed ? 15 : 2}
          transparent
          opacity={0.8}
          roughness={0}
          metalness={0.8}
        />
      </mesh>
      {/* Brillo interno (Core) */}
      <mesh scale={[0.8, 0.8, 0.8]}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

// ── CÉLULA VEGETAL "DIAMOND GLOW" ──
function CelulaVegetal({ volumen }: { volumen: number }) {
  const safeVol = isNaN(volumen) ? 100 : volumen;
  const vScale = Math.max(0.4, Math.min(0.98, safeVol / 140));
  const isTurgid = safeVol > 125;

  return (
    <group>
      {/* Pared de Cristal */}
      <mesh>
        <boxGeometry args={[4.4, 5, 4.4]} />
        <meshStandardMaterial 
          color="#10b981" 
          transparent 
          opacity={0.2} 
          roughness={0} 
          metalness={1}
          emissive="#059669"
          emissiveIntensity={0.5}
        />
      </mesh>
      {/* Membrana Vibrante */}
      <mesh scale={[vScale, vScale * 1.1, vScale]}>
        <boxGeometry args={[4, 4.6, 4]} />
        <MeshWobbleMaterial 
          color={isTurgid ? "#22c55e" : "#059669"}
          factor={isTurgid ? 0.2 : 0.05}
          speed={2}
          emissive={isTurgid ? "#22c55e" : "#064e3b"}
          emissiveIntensity={isTurgid ? 5 : 1}
          transparent
          opacity={0.6}
        />
      </mesh>
      {/* Vacuola de Luz */}
      <mesh scale={[vScale * 0.6, vScale * 0.8, vScale * 0.6]}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

export default function Transporte3DScene({ tipo, volumen, concExt, glucosaExt = 0 }: any) {
  return (
    <div className="w-full h-full relative bg-gradient-to-b from-[#020617] to-[#010409]">
      <Canvas dpr={[1, 2]}>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 5, 12]} fov={35} />
          <OrbitControls enablePan={false} makeDefault />
          
          {/* Iluminación Dramática */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={10} color="#38bdf8" />
          <pointLight position={[-10, -10, -10]} intensity={10} color="#f43f5e" />
          <spotLight position={[0, 20, 0]} intensity={15} angle={0.5} penumbra={1} color="#ffffff" />

          {/* Partículas Estilo Diamond */}
          <BioEnergy count={40} color="#4ade80" speed={0.5} /> {/* NaCl */}
          <BioEnergy count={30} color="#fbbf24" speed={0.3} /> {/* Glucosa */}
          
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            {tipo === 'animal' ? <Eritrocito volumen={volumen} /> : <CelulaVegetal volumen={volumen} />}
          </Float>

          <Stars radius={50} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
          <ContactShadows position={[0, -5, 0]} opacity={0.5} scale={20} blur={2} far={10} color="#000000" />
        </Suspense>
      </Canvas>
      
      {/* HUD Overlay Cinematográfico */}
      <div className="absolute inset-0 pointer-events-none border-[40px] border-[#38bdf8]/5 rounded-[4rem] mix-blend-screen" />
      
      {/* Escáner Sutil */}
      <motion.div 
        animate={{ top: ['10%', '90%', '10%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent z-50 pointer-events-none"
      />
    </div>
  );
}
