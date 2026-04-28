"use client";

import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Float, 
  MeshDistortMaterial, 
  PerspectiveCamera,
  Stars,
  Html,
  MeshWobbleMaterial,
  Sparkles
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { motion, AnimatePresence } from "framer-motion";
import * as THREE from 'three';

// Partícula que representa una molécula de reactivo o exceso
function MoleculeParticle({ color, position, speed = 1 }: { color: string, position: [number, number, number], speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPos = useRef(new THREE.Vector3(...position));
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (meshRef.current) {
      // Movimiento errático tipo Browniano ligero
      meshRef.current.position.x = initialPos.current.x + Math.sin(t + initialPos.current.z) * 0.5;
      meshRef.current.position.y = initialPos.current.y + Math.cos(t + initialPos.current.x) * 0.5;
      meshRef.current.position.z = initialPos.current.z + Math.sin(t * 0.5) * 0.5;
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  );
}

function SynthesisCore({ isRunning, isBalanced, themeColor }: { isRunning: boolean, isBalanced: boolean, themeColor: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.2;
      meshRef.current.rotation.z = t * 0.1;
      const scale = isRunning ? 1.2 + Math.sin(t * 10) * 0.1 : 1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef}>
          <octahedronGeometry args={[2, 0]} />
          <MeshDistortMaterial
            color={isBalanced ? "#00ffcc" : themeColor}
            speed={isRunning ? 10 : 2}
            distort={isRunning ? 0.6 : 0.3}
            radius={1}
            emissive={isBalanced ? "#00ffcc" : themeColor}
            emissiveIntensity={isRunning ? 10 : 2}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Aura de energía */}
        <mesh scale={1.2}>
          <octahedronGeometry args={[2, 0]} />
          <MeshWobbleMaterial 
            color={themeColor} 
            factor={isRunning ? 1 : 0.2} 
            speed={isRunning ? 5 : 1} 
            transparent 
            opacity={0.3} 
          />
        </mesh>
      </Float>

      {isBalanced && <Sparkles count={50} scale={5} size={3} speed={2} color="#00ffcc" />}
      {isRunning && <Sparkles count={100} scale={3} size={2} speed={5} color="#ffffff" />}
    </group>
  );
}

export default function Limitante3DScene({ 
  limitanteData, 
  isRunning 
}: { 
  limitanteData: any, 
  isRunning: boolean 
}) {
  const { results, inputMasses, reaccionActual, reacciones = [] } = limitanteData;
  const currentReac = reacciones[reaccionActual] || { nombre: 'Default' };
  
  // Colores por reactivo
  const colorA = "#22d3ee"; // Cyan
  const colorB = "#fbbf24"; // Ambar
  const isBalanced = results.excessMass < 0.1 && inputMasses[0] > 0 && inputMasses[1] > 0;

  // Generar posiciones para las partículas de exceso
  const excessParticles = useMemo(() => {
    const particles = [];
    const count = Math.min(30, Math.floor(results.excessMass / 2));
    const color = results.limitingIdx === 0 ? colorB : colorA;
    
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 5 + Math.random() * 3;
      particles.push({
        id: i,
        color,
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        ] as [number, number, number],
        speed: 0.5 + Math.random()
      });
    }
    return particles;
  }, [results.excessMass, results.limitingIdx]);

  return (
    <div className="w-full h-full relative bg-[#01080E]">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#01080E']} />
        
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 2, 15]} fov={40} />
          
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={100} color="#ffffff" />
          <pointLight position={[-10, -10, 10]} intensity={50} color={colorA} />
          <pointLight position={[0, 0, -5]} intensity={50} color={colorB} />

          <SynthesisCore 
            isRunning={isRunning} 
            isBalanced={isBalanced} 
            themeColor={isBalanced ? "#00ffcc" : "#219EBC"} 
          />

          {/* Partículas de Exceso */}
          {excessParticles.map(p => (
            <MoleculeParticle key={p.id} color={p.color} position={p.position} speed={p.speed} />
          ))}

          {/* Efectos de Ambiente */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            minDistance={10} 
            maxDistance={25}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.8}
          />

          <EffectComposer multisampling={4}>
            <Bloom luminanceThreshold={0.2} mipmapBlur intensity={isBalanced ? 3 : 1.2} radius={0.4} />
            <ChromaticAberration offset={new THREE.Vector2(0.0005, 0.0005)} />
            <Vignette offset={0.1} darkness={1.1} />
          </EffectComposer>

          {/* Etiquetas de Exceso en 3D */}
          {results.excessMass > 0.1 && (
            <Html center position={[0, 4, 0]} distanceFactor={15}>
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/50 backdrop-blur-md flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] pointer-events-none"
               >
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest whitespace-nowrap">
                    Exceso Detectado: {results.excessMass}g de {results.limitingIdx === 0 ? currentReac.reactivos?.[1]?.formula : currentReac.reactivos?.[0]?.formula}
                  </span>
               </motion.div>
            </Html>
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
