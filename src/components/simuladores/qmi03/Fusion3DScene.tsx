"use client";

import React, { useRef, Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Float, 
  MeshDistortMaterial, 
  ContactShadows,
  PerspectiveCamera,
  Stars,
  Html,
  MeshWobbleMaterial,
  Sparkles
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import { useSimuladorStore } from "@/store/simuladorStore";
import * as THREE from 'three';

// Temas visuales por nivel
const THEMES: Record<string, any> = {
  'r1': { color: "#ff4400", emissive: "#ff2200", stars: "#ff8844" },
  'r2': { color: "#00d4ff", emissive: "#0055ff", stars: "#ffffff" },
  'r3': { color: "#ffcc00", emissive: "#aa8800", stars: "#ffeecc" },
  'r4': { color: "#9900ff", emissive: "#4400aa", stars: "#cc99ff" },
  'default': { color: "#219EBC", emissive: "#219EBC", stars: "#ffffff" }
};

function PlasmaCore({ isBalanced, pulse, masaTotal, theme }: { isBalanced: boolean, pulse: boolean, masaTotal: number, theme: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const [targetScale, setTargetScale] = useState(1);
  const [flashIntensity, setFlashIntensity] = useState(0);
  
  const baseScale = 0.8 + (masaTotal / 700);
  
  useEffect(() => {
    setTargetScale(baseScale * 1.4);
    const timer = setTimeout(() => setTargetScale(baseScale), 100);
    return () => clearTimeout(timer);
  }, [pulse, baseScale]);

  useEffect(() => {
    if (isBalanced) {
      setFlashIntensity(500);
      const timer = setTimeout(() => setFlashIntensity(0), 500);
      return () => clearTimeout(timer);
    }
  }, [isBalanced]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      meshRef.current.rotation.y = t * 0.5;
    }
    if (flashRef.current) {
      flashRef.current.intensity = THREE.MathUtils.lerp(flashRef.current.intensity, flashIntensity, 0.1);
    }
  });

  return (
    <group>
      <pointLight ref={flashRef} position={[0, 0, 0]} color="#ffffff" distance={20} />
      
      <Float speed={isBalanced ? 1 : 8} rotationIntensity={isBalanced ? 0.2 : 4} floatIntensity={isBalanced ? 0.2 : 3}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[1.5, 64, 64]} />
          <MeshDistortMaterial
            color={isBalanced ? "#00ffcc" : theme.color}
            speed={isBalanced ? 1 : 6}
            distort={isBalanced ? 0.05 : 0.8}
            radius={1}
            emissive={isBalanced ? "#00ffcc" : theme.emissive}
            emissiveIntensity={isBalanced ? 10 : 3}
            metalness={0.9}
            roughness={0}
          />
        </mesh>
        
        <mesh scale={0.85}>
           <sphereGeometry args={[1.5, 32, 32]} />
           <MeshWobbleMaterial 
             color={isBalanced ? "#ffffff" : theme.color} 
             factor={isBalanced ? 0.2 : 1.5} 
             speed={isBalanced ? 2 : 20} 
             emissive={isBalanced ? "#ffffff" : theme.emissive}
             emissiveIntensity={isBalanced ? 15 : 6}
           />
        </mesh>

        {isBalanced && <Sparkles count={100} scale={4} size={4} speed={2} color="#00ffcc" />}

        <Html position={[0, -2.8, 0]} center>
          <div className="flex flex-col items-center gap-1 pointer-events-none">
             <div className={`px-4 py-1 rounded-full border-2 font-black text-[9px] tracking-[0.3em] uppercase backdrop-blur-md transition-all ${isBalanced ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_30px_#10b981]' : 'bg-white/5 border-white/20 text-white/40'}`}>
               {isBalanced ? '¡Fusión Completa!' : 'Inestabilidad de Masa'}
             </div>
          </div>
        </Html>
      </Float>
    </group>
  );
}

function Molecules({ reactivos, productos, isBalanced, coeficientes, onIncrement, theme }: any) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <group>
      {reactivos.map((r: any, i: number) => {
        const coef = coeficientes[i] || 1;
        const angle = (i / reactivos.length) * Math.PI * 0.6 - Math.PI/3;
        const radius = 8;
        const x = Math.sin(angle) * -radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <group 
            key={`reac-${i}`} position={[x, (i - 1) * 3, z]}
            onPointerOver={() => setHovered(i)}
            onPointerOut={() => setHovered(null)}
            onClick={() => onIncrement(i, 1)}
          >
            <Float speed={hovered === i ? 10 : 2} rotationIntensity={1}>
              <mesh scale={(0.6 + coef * 0.1) * (hovered === i ? 1.3 : 1)}>
                <octahedronGeometry args={[0.4]} />
                <meshStandardMaterial 
                  color={hovered === i ? "#ffffff" : (isBalanced ? "#00ffcc" : theme.color)} 
                  emissive={hovered === i ? "#ffffff" : (isBalanced ? "#00ffcc" : theme.emissive)} 
                  emissiveIntensity={hovered === i ? 8 : 2} 
                />
              </mesh>
              <Html distanceFactor={15} position={[0, -0.8, 0]} center>
                <div className="flex flex-col items-center select-none cursor-pointer">
                   <div className={`flex items-center gap-2 bg-black/80 px-4 py-1.5 rounded-full border transition-all ${hovered === i ? 'border-cyan-400 scale-110' : 'border-white/10'}`}>
                      <span className="text-[16px] font-black text-white">{coef}</span>
                      <span className="text-[10px] font-bold text-white/50">{r.formula}</span>
                   </div>
                </div>
              </Html>
            </Float>
          </group>
        );
      })}

      {productos.map((p: any, i: number) => {
        const idx = reactivos.length + i;
        const coef = coeficientes[idx] || 1;
        const angle = (i / productos.length) * Math.PI * 0.6 - Math.PI/3;
        const radius = 8;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <group 
            key={`prod-${i}`} position={[x, (i - 1) * 3, z]}
            onPointerOver={() => setHovered(idx)}
            onPointerOut={() => setHovered(null)}
            onClick={() => onIncrement(idx, 1)}
          >
            <Float speed={hovered === idx ? 10 : 2} rotationIntensity={1}>
              <mesh scale={(0.6 + coef * 0.1) * (hovered === idx ? 1.3 : 1)}>
                <boxGeometry args={[0.6, 0.6, 0.6]} />
                <meshStandardMaterial 
                  color={hovered === idx ? "#ffffff" : (isBalanced ? "#00ffcc" : theme.color)} 
                  emissive={hovered === idx ? "#ffffff" : (isBalanced ? "#00ffcc" : theme.emissive)} 
                  emissiveIntensity={hovered === idx ? 8 : 2} 
                />
              </mesh>
              <Html distanceFactor={15} position={[0, -0.8, 0]} center>
                <div className="flex flex-col items-center select-none cursor-pointer">
                   <div className={`flex items-center gap-2 bg-black/80 px-4 py-1.5 rounded-full border transition-all ${hovered === idx ? 'border-orange-400 scale-110' : 'border-white/10'}`}>
                      <span className="text-[16px] font-black text-white">{coef}</span>
                      <span className="text-[10px] font-bold text-white/50">{p.formula}</span>
                   </div>
                </div>
              </Html>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

export default function Fusion3DScene({ balanceo }: { balanceo: any }) {
  const { setCoeficiente, audio } = useSimuladorStore();
  const [pulse, setPulse] = useState(false);
  const lastCoefs = useRef("");

  if (!balanceo) return null;
  const { isBalanced, reacciones, reaccionActual, coeficientes, masaReactivos } = balanceo;
  const currentReac = reacciones[reaccionActual] || reacciones[0];
  const theme = THEMES[currentReac.id] || THEMES.default;

  const handleIncrement = (idx: number, delta: number) => {
    const newVal = (coeficientes[idx] || 1) + delta;
    setCoeficiente(idx, newVal);
    setPulse(true);
    audio?.playClick();
    setTimeout(() => setPulse(false), 200);
  };

  return (
    <div className="w-full h-full relative bg-[#010B13]">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#010B13']} />
        
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 1, 18]} fov={35} />
          
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={150} color="#ffffff" />
          <pointLight position={[-10, -10, 10]} intensity={250} color={isBalanced ? "#00ffcc" : theme.color} />
          
          <PlasmaCore isBalanced={isBalanced} pulse={pulse} masaTotal={masaReactivos} theme={theme} />
          <Molecules 
            reactivos={currentReac.reactivos} 
            productos={currentReac.productos}
            isBalanced={isBalanced} 
            coeficientes={coeficientes} 
            onIncrement={handleIncrement}
            theme={theme}
          />

          <ContactShadows position={[0, -6, 0]} opacity={0.3} scale={40} blur={3} far={15} />
          <Stars radius={50} depth={50} count={isBalanced ? 8000 : 2000} factor={4} saturation={0} fade speed={isBalanced ? 1 : 0.1} />
          
          <OrbitControls 
            enableZoom={true}
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.5} 
            minDistance={12}
            maxDistance={30}
          />

          <EffectComposer multisampling={4}>
            <Bloom luminanceThreshold={0.1} mipmapBlur intensity={isBalanced ? 4.5 : 1.8} radius={0.4} />
            <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
            <Vignette offset={0.1} darkness={1.2} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
