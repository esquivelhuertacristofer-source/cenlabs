"use client";

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Sphere, Stars, Html, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface Derivadas3DSceneProps {
  xActual: number;
  mostrarDerivada: boolean;
  status: 'idle' | 'success' | 'error';
}

function FunctionExplorer({ xActual, mostrarDerivada }: { xActual: number, mostrarDerivada: boolean }) {
  const f = (x: number) => (1/3) * Math.pow(x, 3) - 2 * Math.pow(x, 2) + 3 * x;
  const df = (x: number) => Math.pow(x, 2) - 4 * x + 3;

  const points = useMemo(() => {
    const p = [];
    for (let x = -3; x <= 7; x += 0.1) {
      p.push(new THREE.Vector3(x, f(x), 0));
    }
    return p;
  }, []);

  const derivativePoints = useMemo(() => {
    const p = [];
    for (let x = -3; x <= 7; x += 0.1) {
      p.push(new THREE.Vector3(x, df(x), 0));
    }
    return p;
  }, []);

  const yActual = f(xActual);
  const m = df(xActual);

  // Recta Tangente
  const tanLen = 3;
  const startTan = new THREE.Vector3(xActual - tanLen, yActual - m * tanLen, 0);
  const endTan = new THREE.Vector3(xActual + tanLen, yActual + m * tanLen, 0);

  const tangentColor = Math.abs(m) < 0.1 ? '#f59e0b' : m > 0 ? '#10b981' : '#ef4444';

  return (
    <group>
      {/* Curva Principal */}
      <Line points={points} color="white" lineWidth={3} transparent opacity={0.6} />
      
      {/* Curva de la Derivada (Si está activa) */}
      {mostrarDerivada && (
        <Line points={derivativePoints} color="#a5b4fc" lineWidth={1} dashed dashSize={0.2} transparent opacity={0.4} />
      )}

      {/* Recta Tangente */}
      <Line points={[startTan, endTan]} color={tangentColor} lineWidth={6} />
      
      {/* Explorador (Esfera) */}
      <group position={[xActual, yActual, 0]}>
        <Sphere args={[0.3, 16, 16]}>
          <meshStandardMaterial color={tangentColor} emissive={tangentColor} emissiveIntensity={5} />
        </Sphere>
        <pointLight intensity={2} color={tangentColor} />
        
        <Html position={[0, 1.5, 0]} center>
          <div className="flex flex-col items-center gap-1">
             <div className="text-[10px] font-black text-white bg-black/60 px-2 py-0.5 rounded border border-white/20 backdrop-blur-md whitespace-nowrap">
                P({xActual.toFixed(2)}, {yActual.toFixed(2)})
             </div>
             <div className={`text-[8px] font-black px-2 py-0.5 rounded border backdrop-blur-md uppercase tracking-widest ${Math.abs(m) < 0.1 ? 'text-amber-400 border-amber-500/30' : 'text-white border-white/10'}`}>
                m = {m.toFixed(4)}
             </div>
          </div>
        </Html>
      </group>

      {/* Sombras de Proyección */}
      <Line points={[[xActual, 0, 0], [xActual, yActual, 0]]} color="white" lineWidth={0.5} transparent opacity={0.1} dashed dashSize={0.1} />
    </group>
  );
}

export default function Derivadas3DScene(props: Derivadas3DSceneProps) {
  return (
    <div className="w-full h-full bg-[#020617]">
      <Canvas camera={{ position: [5, 5, 20], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 20, 60]} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />

        <group rotation={[0, -Math.PI / 12, 0]}>
          <Grid 
            infiniteGrid 
            fadeDistance={40} 
            cellColor="#1e293b" 
            sectionColor="#334155" 
            sectionSize={5}
            cellSize={1}
            rotation={[Math.PI / 2, 0, 0]} 
          />

          <Line points={[[-20, 0, 0], [20, 0, 0]]} color="white" lineWidth={0.5} transparent opacity={0.1} />
          <Line points={[[0, -20, 0], [0, 20, 0]]} color="white" lineWidth={0.5} transparent opacity={0.1} />

          <FunctionExplorer {...props} />
        </group>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
