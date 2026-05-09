"use client";

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, Sparkles, Html, Box, Cylinder, Torus } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  enfoque: number;
  iluminacion: number;
  isDarkMode: boolean;
  magnificacion: number;
  muestra: string;
  posicionX?: number;
  posicionY?: number;
}

// ── MOTOR DE PARTÍCULAS ULTRA-VISIBLES (CONCENTRADAS EN EL CENTRO) ──
function MolecularSea({ count, color, speed, size = 0.08, jitter = 0.08 }: any) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // RADIO MUCHO MÁS PEQUEÑO PARA QUE SE VEAN EN EL CENTRO
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 5; // Radio reducido para visibilidad inmediata
      
      p[i * 3] = Math.cos(angle) * radius;
      p[i * 3 + 1] = Math.sin(angle) * radius;
      p[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return p;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] += (Math.random() - 0.5) * jitter;
      positions[i3 + 1] += (Math.random() - 0.5) * jitter;
      
      // Mantenerlas en el centro visual
      if (Math.abs(positions[i3]) > 6) positions[i3] *= -0.9;
      if (Math.abs(positions[i3 + 1]) > 6) positions[i3 + 1] *= -0.9;
      
      positions[i3] += Math.sin(time * 0.5 + positions[i3+1]) * 0.01 * speed;
      positions[i3 + 1] += Math.cos(time * 0.5 + positions[i3]) * 0.01 * speed;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[points, 3]} />
      </bufferGeometry>
      <pointsMaterial 
        size={size} 
        color={color} 
        transparent 
        opacity={0.9} // MÁS OPACIDAD
        sizeAttenuation 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function OrganelleDetailed({ type, position, color, scale = 1 }: any) {
  return (
    <Float speed={3} rotationIntensity={2} floatIntensity={2}>
      <group position={position} scale={scale}>
         {type === 'mitochondria' && (
           <mesh>
             <capsuleGeometry args={[0.3, 0.8, 4, 16]} />
             <MeshDistortMaterial color={color} speed={5} distort={0.5} emissive={color} emissiveIntensity={2} />
           </mesh>
         )}
         {type === 'chloroplast' && (
           <mesh>
              <sphereGeometry args={[0.4, 16, 16]} />
              <meshStandardMaterial color="#22c55e" emissive="#4ade80" emissiveIntensity={3} />
           </mesh>
         )}
         {type === 'nucleus' && (
           <Sphere args={[2, 32, 32]}>
              <MeshDistortMaterial color={color} speed={2} distort={0.2} emissive={color} emissiveIntensity={0.5} />
           </Sphere>
         )}
      </group>
    </Float>
  );
}

export default function LivingCellScene({ enfoque, iluminacion, isDarkMode, magnificacion, muestra, posicionX = 0, posicionY = 0 }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      // Movimiento de platina coordinado
      groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, (posicionX / 100) * 4, 0.05);
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, (posicionY / 100) * -4, 0.05);
      
      const zoomMap = { 4: 0.2, 10: 0.8, 40: 2.5, 100: 6 };
      const targetScale = zoomMap[magnificacion as keyof typeof zoomMap] || 1;
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, targetScale, 0.05));
    }
  });

  const content = useMemo(() => {
    const pCount = magnificacion >= 40 ? 10000 : 3000;
    
    if (muestra === 'vegetal') {
      return (
        <group>
          {magnificacion <= 10 ? (
            Array.from({ length: 16 }).map((_, i) => (
              <Box key={i} args={[3, 4, 1]} position={[(i % 4 - 1.5) * 3.5, (Math.floor(i / 4) - 1.5) * 4.5, 0]}>
                 <meshStandardMaterial color="#10b981" wireframe opacity={0.5} transparent />
              </Box>
            ))
          ) : (
            <group>
              <OrganelleDetailed type="nucleus" position={[0, 0, -1]} color="#10b981" scale={1.2} />
              {Array.from({ length: 15 }).map((_, i) => (
                <OrganelleDetailed key={i} type="chloroplast" position={[Math.sin(i) * 3, Math.cos(i) * 3, 0]} />
              ))}
            </group>
          )}
          <MolecularSea key={`sea-veg-${pCount}`} count={pCount} color="#4ade80" speed={1} />
        </group>
      );
    }
    
    if (muestra === 'animal') {
      return (
        <group>
           {magnificacion <= 10 ? (
             Array.from({ length: 12 }).map((_, i) => (
               <Sphere key={i} args={[2.5, 16, 16]} position={[(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, 0]}>
                  <meshStandardMaterial color="#f43f5e" transparent opacity={0.3} wireframe />
               </Sphere>
             ))
           ) : (
             <group>
                <OrganelleDetailed type="nucleus" position={[0, 0, 0]} color="#f43f5e" scale={1.2} />
                {Array.from({ length: 12 }).map((_, i) => (
                  <OrganelleDetailed key={i} type="mitochondria" position={[Math.sin(i) * 4, Math.cos(i) * 3, 0]} color="#e11d48" />
                ))}
             </group>
           )}
           <MolecularSea key={`sea-ani-${pCount}`} count={pCount} color="#fb7185" speed={1} />
        </group>
      );
    }

    const bCount = magnificacion === 100 ? 15000 : 5000;
    return (
      <group>
         <MolecularSea key={`sea-bac-${bCount}`} count={bCount} color="#818cf8" speed={2.5} size={0.04} />
         {Array.from({ length: 100 }).map((_, i) => (
           <BacteriaUnit key={i} />
         ))}
      </group>
    );
  }, [muestra, magnificacion]);

  return (
    <group>
      {/* ILUMINACIÓN FRONTAL POTENTE */}
      <ambientLight intensity={iluminacion / 10} />
      <pointLight position={[0, 0, 5]} intensity={3} color="#fff" />
      <spotLight position={[0, 0, 8]} angle={0.5} penumbra={1} intensity={5} color="#fff" />

      <group ref={groupRef}>
        {content}
      </group>

      <Sparkles count={200} scale={10} size={4} speed={0.5} color="#fff" opacity={0.4} />
    </group>
  );
}

function BacteriaUnit() {
  const ref = useRef<THREE.Group>(null);
  const pos = useMemo(() => [(Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5], []);
  const speed = useMemo(() => 1 + Math.random() * 2, []);
  
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() * speed;
    ref.current.position.x += Math.sin(t + pos[0]) * 0.1;
    ref.current.position.y += Math.cos(t + pos[1]) * 0.1;
  });

  return (
    <group ref={ref} position={pos as any}>
       <Cylinder args={[0.1, 0.1, 0.8, 8]} rotation={[Math.PI/2, 0, 0]}>
          <meshPhongMaterial color="#818cf8" emissive="#4f46e5" emissiveIntensity={5} />
       </Cylinder>
    </group>
  );
}
