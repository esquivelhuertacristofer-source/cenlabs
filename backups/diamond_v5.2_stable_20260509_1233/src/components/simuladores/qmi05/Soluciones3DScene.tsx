"use client";

import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera,
  Stars,
  Html,
  Float,
  ContactShadows,
  Cylinder
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';

function VolumetricFlask({ waterLevel, color, vTarget = 250 }: { waterLevel: number, color: string, vTarget: number }) {
  const liquidRef = useRef<THREE.Mesh>(null);
  const glassRef = useRef<THREE.Mesh>(null);
 
  // Física de llenado NO LINEAL (Simulando cuerpo ancho y cuello estrecho)
  const calculateHeight = (vol: number) => {
    const ratioToTarget = vol / vTarget;
    if (ratioToTarget < 0.8) return (ratioToTarget / 0.8) * 3; // Cuerpo ancho
    return 3 + ((ratioToTarget - 0.8) / 0.2) * 5.5; // Cuello estrecho
  };
 
  const h = calculateHeight(waterLevel);
 
  useFrame((state) => {
    if (liquidRef.current) {
      liquidRef.current.position.y = -4 + h / 2;
      liquidRef.current.scale.y = h > 0.01 ? h : 0.001;
      // Ajustar el radio superior según sube por el cuello
      if (waterLevel > vTarget * 0.8) {
        liquidRef.current.scale.x = 0.2;
        liquidRef.current.scale.z = 0.2;
      } else {
        liquidRef.current.scale.x = 1;
        liquidRef.current.scale.z = 1;
      }
    }
  });
 
  return (
    <group position={[0, 0, 0]}>
      {/* Cuerpo del Matraz (Cristal) */}
      <mesh ref={glassRef}>
        <latheGeometry args={[
          [
            new THREE.Vector2(0, -4),
            new THREE.Vector2(2.5, -3.5),
            new THREE.Vector2(3, -2),
            new THREE.Vector2(2.5, -0.5),
            new THREE.Vector2(0.6, 0.5),
            new THREE.Vector2(0.6, 5),
            new THREE.Vector2(0.8, 5),
            new THREE.Vector2(0.8, 0.6),
            new THREE.Vector2(2.7, -0.4),
            new THREE.Vector2(3.2, -2),
            new THREE.Vector2(2.7, -3.6),
            new THREE.Vector2(0, -4.2),
          ], 32
        ]} />
        <meshPhysicalMaterial 
          transparent 
          opacity={0.3} 
          roughness={0} 
          metalness={0.8} 
          thickness={3} 
          transmission={1} 
          ior={1.45}
          color="#e2e8f0"
          emissive="#ffffff"
          emissiveIntensity={0.05}
        />
      </mesh>
 
      {/* Línea de Aforo (La marca de precisión) */}
      <mesh position={[0, 4, 0]}>
        <torusGeometry args={[0.62, 0.01, 8, 32]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={5} />
      </mesh>
 
      {/* Líquido Volumétrico */}
      <mesh ref={liquidRef} position={[0, -4, 0]}>
        <cylinderGeometry args={[0.58, 2.8, 1, 32]} />
        <meshPhysicalMaterial 
          color={color} 
          transparent 
          opacity={0.9} 
          emissive={color} 
          emissiveIntensity={0.4} 
          roughness={0}
          metalness={0.3}
          transmission={0.5}
          ior={1.33}
        />
        {/* Tapa del Menisco (Superficie) */}
        <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.6, 32]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2} transparent opacity={0.3} />
        </mesh>
      </mesh>
 
      {/* Etiquetas de Aforo */}
      <Html position={[1.5, 4, 0]} center>
         <div className="flex flex-col items-start pointer-events-none">
            <span className="text-[8px] font-black text-red-500 uppercase tracking-widest whitespace-nowrap bg-white/10 px-2 py-1 rounded-sm backdrop-blur-sm">Aforo Preciso</span>
            <span className="text-[14px] font-black text-white/60 tracking-tighter">{vTarget} mL</span>
         </div>
      </Html>
    </group>
  );
}
 
export default function Soluciones3DScene({ 
  solucionesData, 
  isPrecisionMode 
}: { 
  solucionesData: any, 
  isPrecisionMode: boolean 
}) {
  const { matraz = { agua: 0, polvo: 0 }, sal = { nombre: 'NaCl', color: '#ffffff' }, vTarget = 250 } = solucionesData || {};
  
  // Color dinámico basado en concentración y reactivo
  const liquidColor = useMemo(() => {
    if (!matraz || matraz.polvo === 0) return "#dbeafe"; // Water color
    return sal.color || "#ffffff";
  }, [matraz?.polvo, sal?.color]);
 
  return (
    <div className="w-full h-full relative bg-[#01080E]">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#01080E']} />
        
        <Suspense fallback={null}>
          <PerspectiveCamera 
            makeDefault 
            position={isPrecisionMode ? [0, 4, 6] : [0, 2, 16]} 
            fov={isPrecisionMode ? 20 : 35} 
          />
          
          <ambientLight intensity={0.6} />
          <pointLight position={[10, 10, 10]} intensity={200} color="#ffffff" />
          <spotLight position={[-5, 10, 5]} angle={0.15} penumbra={1} intensity={150} castShadow />
          
          {/* Luces de Estudio para el Cristal */}
          <directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />
          <directionalLight position={[-5, 5, -5]} intensity={0.8} color="#89CFF0" />
          <rectAreaLight width={10} height={10} position={[0, 10, 0]} intensity={3} color="#ffffff" />
 
          <Float speed={1.2} rotationIntensity={0.1} floatIntensity={0.3}>
            <VolumetricFlask waterLevel={matraz.agua} color={liquidColor} vTarget={vTarget} />
          </Float>

          {/* Piso del laboratorio */}
          <ContactShadows 
            position={[0, -5, 0]} 
            opacity={0.4} 
            scale={20} 
            blur={2} 
            far={10} 
            color="#000000" 
          />

          <OrbitControls 
            enableZoom={true} 
            enablePan={false} 
            minDistance={5} 
            maxDistance={25}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
          />

          <EffectComposer multisampling={4}>
            <Bloom luminanceThreshold={0.5} mipmapBlur intensity={0.8} radius={0.4} />
            <Vignette offset={0.1} darkness={1} />
          </EffectComposer>
        </Suspense>
      </Canvas>

      {/* Indicador de Precisión */}
      {isPrecisionMode && (
        <div className="absolute inset-0 border-[40px] border-cyan-500/10 pointer-events-none flex flex-col items-center justify-center">
           <div className="mt-auto mb-20 bg-cyan-500 text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl animate-pulse">
              Modo de Aforo de Precisión Activado
           </div>
        </div>
      )}
    </div>
  );
}
