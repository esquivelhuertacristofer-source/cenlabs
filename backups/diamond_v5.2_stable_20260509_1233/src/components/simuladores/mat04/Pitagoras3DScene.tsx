"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Stars, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface Pitagoras3DSceneProps {
  catetoA: number;
  catetoB: number;
  llenado: number;
  escenario: 'pitagoras_basico' | 'diseno_rampas' | 'navegacion_maritima';
}

function FluidBox({ size, fillLevel, color, position, rotation }: { size: number, fillLevel: number, color: string, position: [number, number, number], rotation?: [number, number, number] }) {
  const safeSize = Math.max(0.1, size);
  const fillH = Math.max(0.001, safeSize * (fillLevel / 100));

  return (
    <group position={position} rotation={rotation}>
      {/* Contenedor de Cristal */}
      <Box args={[safeSize, safeSize, 1.2]}>
        <meshPhysicalMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.08} 
          transmission={0.4}
          thickness={0.5}
          roughness={0}
        />
      </Box>
      
      {/* Líquido */}
      <mesh position={[0, -safeSize/2 + fillH/2, 0]}>
        <boxGeometry args={[safeSize - 0.05, fillH, 1.1]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={1.5}
          transparent 
          opacity={0.7} 
        />
      </mesh>

      {/* Bordes Neon */}
      <Box args={[safeSize, safeSize, 1.2]}>
        <meshStandardMaterial color={color} wireframe transparent opacity={0.5} />
      </Box>

      {/* Etiqueta */}
      <Html position={[0, 0, 0.8]} center>
        <div className="bg-black/90 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white shadow-lg">
           {(safeSize * safeSize).toFixed(1)} u²
        </div>
      </Html>
    </group>
  );
}

function TrianglePrism({ a, b }: { a: number, b: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(a, 0);
    s.lineTo(0, b);
    s.lineTo(0, 0);
    return s;
  }, [a, b]);

  return (
    <group>
      {/* Cuerpo del Prisma (Obsidiana con reflejos) */}
      <mesh position={[0, 0, -0.25]}>
        <extrudeGeometry args={[shape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 }]} />
        <meshPhysicalMaterial 
          color="#0f172a" 
          metalness={0.9} 
          roughness={0.1} 
          clearcoat={1}
          reflectivity={1}
          side={THREE.DoubleSide} 
        />
      </mesh>
      
      {/* Borde sutilmente iluminado */}
      <mesh position={[0, 0, 0.26]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color="#334155" wireframe transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function SceneLogic({ catetoA, catetoB, llenado, escenario }: Pitagoras3DSceneProps) {
  const a = Math.max(0.1, catetoA || 3);
  const b = Math.max(0.1, catetoB || 4);
  const h = Math.sqrt(a * a + b * b);
  const angle = Math.atan2(b, -a);

  const fillA = Math.max(0, 100 - llenado);
  const fillB = Math.max(0, 100 - llenado);
  const fillC = llenado;

  // Variaciones visuales según escenario
  const isNavy = escenario === 'navegacion_maritima';
  const isConstruction = escenario === 'diseno_rampas';

  return (
    <group position={[-a/3, -b/3, 0]}>
      {isNavy ? (
        <fog attach="fog" args={['#001e3c', 10, 50]} />
      ) : (
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
      )}
      
      <ambientLight intensity={isNavy ? 0.3 : 0.5} />
      <pointLight position={[15, 15, 15]} intensity={2} color={isNavy ? '#60a5fa' : '#ffffff'} />
      
      <group scale={1.3}>
        <TrianglePrism a={a} b={b} />

        {/* Lado A */}
        <FluidBox 
          size={a} 
          fillLevel={fillA} 
          color={isConstruction ? "#f59e0b" : "#06b6d4"} 
          position={[a/2, -a/2, 0]} 
        />

        {/* Lado B */}
        <FluidBox 
          size={b} 
          fillLevel={fillB} 
          color={isConstruction ? "#fbbf24" : "#10b981"} 
          position={[-b/2, b/2, 0]} 
        />

        {/* Lado C */}
        <FluidBox 
          size={h} 
          fillLevel={fillC} 
          color={isNavy ? "#3b82f6" : "#6366f1"} 
          position={[
            a/2 + (b/h)*(h/2),
            b/2 + (a/h)*(h/2),
            0
          ]}
          rotation={[0, 0, angle]}
        />
      </group>

      <Grid 
        infiniteGrid 
        fadeDistance={50} 
        cellColor={isNavy ? "#1e3a8a" : "#1e293b"} 
        sectionColor={isNavy ? "#3b82f6" : "#334155"} 
        position={[0, -10, 0]} 
      />
    </group>
  );
}

export default function Pitagoras3DScene(props: Pitagoras3DSceneProps) {
  return (
    <div className="w-full h-full bg-[#020617]">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 35], fov: 35 }}>
        <color attach="background" args={['#020617']} />
        <SceneLogic {...props} />
        <OrbitControls enablePan={false} minDistance={10} maxDistance={80} />
      </Canvas>
    </div>
  );
}
