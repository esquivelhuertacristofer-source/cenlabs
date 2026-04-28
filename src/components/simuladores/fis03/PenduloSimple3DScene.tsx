"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, SoftShadows, Grid, Sky } from '@react-three/drei';
import * as THREE from 'three';

interface PenduloSceneProps {
  longitud: number;
  masa: number;
  isOscilando: boolean;
  gravedad: number;
}

const MAX_ANGLE_DEG = 15;
const MAX_ANGLE_RAD = (MAX_ANGLE_DEG * Math.PI) / 180;

function PendulumModel({ longitud, masa, isOscilando, gravedad }: PenduloSceneProps) {
  const pivotRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const T = 2 * Math.PI * Math.sqrt(longitud / gravedad);

  useFrame((state, delta) => {
    if (!pivotRef.current) return;
    
    if (isOscilando) {
      timeRef.current += delta;
      // Movimiento armónico simple
      pivotRef.current.rotation.z = Math.cos((2 * Math.PI / T) * timeRef.current) * MAX_ANGLE_RAD;
    } else {
      timeRef.current = 0;
      // Posición inicial antes de soltar (ángulo máximo)
      pivotRef.current.rotation.z = MAX_ANGLE_RAD;
    }
  });

  // El radio de la masa aumenta un poco visualmente según el valor de 'masa'
  const radioMasa = 0.2 + (masa * 0.05);

  return (
    <group position={[0, 4, 0]}>
      {/* Pivote Superior */}
      <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
         <cylinderGeometry args={[0.05, 0.05, 0.5, 16]} />
         <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Brazo de soporte horizontal */}
      <mesh position={[-1, 0, -0.2]}>
         <boxGeometry args={[3, 0.1, 0.1]} />
         <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
      </mesh>
      
      {/* Poste vertical del soporte */}
      <mesh position={[-2.4, -4, -0.2]} castShadow receiveShadow>
         <cylinderGeometry args={[0.1, 0.15, 8, 32]} />
         <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Base del soporte */}
      <mesh position={[-2.4, -7.9, -0.2]} castShadow receiveShadow>
         <cylinderGeometry args={[0.8, 0.8, 0.2, 32]} />
         <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} />
      </mesh>

      {/* EL PÉNDULO (Agrupado en el pivote) */}
      <group ref={pivotRef}>
        {/* Cuerda */}
        <mesh position={[0, -longitud / 2, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, longitud, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.5} roughness={0.5} />
        </mesh>
        
        {/* Masa (Bob) */}
        <mesh position={[0, -longitud, 0]} castShadow receiveShadow>
          <sphereGeometry args={[radioMasa, 32, 32]} />
          <meshStandardMaterial color="#38bdf8" metalness={0.6} roughness={0.1} />
        </mesh>

        {/* Punto láser de medición (pequeña esfera emisiva en el centro de la masa) */}
        <mesh position={[0, -longitud, 0.9 * radioMasa]}>
           <sphereGeometry args={[0.02, 16, 16]} />
           <meshBasicMaterial color="#ff0055" />
        </mesh>
      </group>
    </group>
  );
}

export default function PenduloSimple3DScene({ longitud, masa, isOscilando, gravedad }: PenduloSceneProps) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 45 }}>
      <SoftShadows size={10} samples={16} focus={0.5} />
      
      {/* Iluminación Ambiental y Cielo */}
      <color attach="background" args={["#020617"]} />
      <Sky sunPosition={[10, 20, 50]} turbidity={0.1} rayleigh={0.1} inclination={0.49} />
      
      <ambientLight intensity={1.5} color="#e2e8f0" />
      <directionalLight 
        position={[10, 20, 15]} 
        intensity={3} 
        castShadow 
        shadow-mapSize={[2048, 2048]} 
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-camera-left={-10}
        shadow-camera-right={10}
      />
      <pointLight position={[-5, 2, 5]} intensity={1.5} color="#38bdf8" distance={20} />

      <PendulumModel longitud={longitud} masa={masa} isOscilando={isOscilando} gravedad={gravedad} />

      {/* Grid de Laboratorio */}
      <Grid 
        position={[0, -4.5, 0]} 
        args={[30, 30]} 
        cellSize={1} 
        cellThickness={1} 
        cellColor="#1e293b" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor="#334155" 
        fadeDistance={25} 
        fadeStrength={1} 
      />

      {/* Sombras de Contacto */}
      <ContactShadows position={[0, -4.49, 0]} opacity={0.5} scale={20} blur={2} far={10} color="#000000" />

      {/* Controles de Cámara (Limitados para no perder el péndulo) */}
      <OrbitControls 
        makeDefault 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8} 
        minDistance={5} 
        maxDistance={20} 
        target={[0, -1, 0]}
      />
    </Canvas>
  );
}
