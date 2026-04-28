"use client";

import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';

interface Riemann3DSceneProps {
  n: number;
  metodo: 'izquierda' | 'derecha' | 'punto_medio';
  animandoLimite: boolean;
}

function RiemannBars({ n, metodo }: { n: number, metodo: string }) {
  const f = (x: number) => -Math.pow(x, 2) + 10 * x;
  const dx = 10 / n;

  const bars = useMemo(() => {
    const b = [];
    for (let i = 0; i < n; i++) {
      let x_eval = 0;
      if (metodo === 'izquierda') x_eval = i * dx;
      else if (metodo === 'derecha') x_eval = (i + 1) * dx;
      else x_eval = i * dx + dx / 2;
      
      const h = f(x_eval);
      const xPos = i * dx + dx / 2 - 5; // Centrado en el origen de la escena (-5 a 5)
      
      b.push({
        x: xPos,
        h: h,
        w: dx,
        id: i
      });
    }
    return b;
  }, [n, metodo, dx]);

  const curvePoints = useMemo(() => {
    const p = [];
    for (let x = 0; x <= 10; x += 0.2) {
      p.push(new THREE.Vector3(x - 5, f(x), 0));
    }
    return p;
  }, []);

  return (
    <group>
      {/* Curva Principal */}
      <Line points={curvePoints} color="#10b981" lineWidth={5} />
      
      {/* Barras de Riemann */}
      {bars.map((bar) => (
        <mesh key={bar.id} position={[bar.x, bar.h / 2, 0]}>
          <boxGeometry args={[bar.w * 0.95, bar.h, bar.w * 0.95]} />
          <meshStandardMaterial 
            color="#10b981" 
            transparent 
            opacity={0.3} 
            emissive="#10b981"
            emissiveIntensity={0.5}
          />
          <meshBasicMaterial color="#10b981" wireframe transparent opacity={0.2} />
        </mesh>
      ))}

      {/* Etiquetas de Telemetría Flotante */}
      {n < 20 && bars.map((bar, idx) => (
         idx % 5 === 0 && (
            <Html key={`lbl-${idx}`} position={[bar.x, bar.h + 1, 0]} center>
                <div className="text-[6px] font-black text-emerald-400 bg-black/40 px-1 rounded border border-emerald-500/20">
                    ΔA: {(bar.h * dx).toFixed(2)}
                </div>
            </Html>
         )
      ))}
    </group>
  );
}

export default function Riemann3DScene(props: Riemann3DSceneProps) {
  return (
    <div className="w-full h-full bg-[#020617]">
      <Canvas camera={{ position: [15, 15, 20], fov: 40 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 20, 70]} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 20, 10]} intensity={2} color="#10b981" />

        <group rotation={[0, -Math.PI / 6, 0]}>
          <Grid 
            infiniteGrid 
            fadeDistance={50} 
            cellColor="#1e293b" 
            sectionColor="#334155" 
            sectionSize={5}
            cellSize={1}
            rotation={[Math.PI / 2, 0, 0]} 
          />

          <Line points={[[-10, 0, 0], [10, 0, 0]]} color="white" lineWidth={0.5} transparent opacity={0.1} />
          <Line points={[[0, 0, 0], [0, 30, 0]]} color="white" lineWidth={0.5} transparent opacity={0.1} />

          <RiemannBars {...props} />
        </group>

        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
