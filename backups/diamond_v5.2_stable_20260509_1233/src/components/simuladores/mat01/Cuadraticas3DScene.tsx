"use client";

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Sphere, Text, Sparkles, Html } from '@react-three/drei';
import * as THREE from 'three';

interface ComplexRoot {
  real: number;
  imaginary: number;
}

interface Vertex {
  h: number;
  k: number;
}

interface CurrentRes {
  delta: number;
  vertex: Vertex;
  roots: ComplexRoot[];
  nature: string;
}

interface Cuadraticas3DSceneProps {
  a: number;
  b: number;
  c: number;
  target: { a: number; b: number; c: number };
  currentRes: CurrentRes;
}

function SceneLogic({ a, b, c, target, currentRes }: Cuadraticas3DSceneProps) {
  const { delta, vertex, roots } = currentRes;
  const isComplex = delta < 0;

  // Generar puntos de la parábola del estudiante
  const studentPoints = useMemo(() => {
    const pts = [];
    for (let x = -12; x <= 12; x += 0.2) {
      const y = a * x * x + b * x + c;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    return pts;
  }, [a, b, c]);

  // Generar puntos de la parábola objetivo
  const targetPoints = useMemo(() => {
    const pts = [];
    for (let x = -12; x <= 12; x += 0.2) {
      const y = target.a * x * x + target.b * x + target.c;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    return pts;
  }, [target]);

  const targetColor = "#FB8500";
  const studentColor = isComplex ? "#a855f7" : "#ec4899"; // Morado si complejo, rosa si real

  return (
    <>
      {/* GRILLAS */}
      {/* Grilla Principal XY (Plano Real) */}
      <group key="grid-real-group" rotation={[0, 0, 0]} position={[0, 0, -0.01]}>
         <Grid key="grid-real" infiniteGrid fadeDistance={40} sectionColor="#ffffff" cellColor="#ffffff" sectionThickness={1.5} cellThickness={0.5} />
      </group>

      {/* Grilla Secundaria XZ (Plano Complejo) - Solo visible si hay raíces imaginarias */}
      <group key="grid-complex-group" position={[0, 0, 0]}>
         <Grid key="grid-complex" infiniteGrid fadeDistance={40} sectionColor="#a855f7" cellColor="#c084fc" sectionThickness={isComplex ? 2 : 0} cellThickness={isComplex ? 1 : 0} />
      </group>

      {/* EJES PRINCIPALES */}
      <Line key="axis-x" points={[[-20, 0, 0], [20, 0, 0]]} color="white" lineWidth={2} opacity={0.3} transparent />
      <Line key="axis-y" points={[[0, -20, 0], [0, 20, 0]]} color="white" lineWidth={2} opacity={0.3} transparent />
      {isComplex && (
        <Line key="axis-z" points={[[0, 0, -20], [0, 0, 20]]} color="#a855f7" lineWidth={2} opacity={0.4} transparent />
      )}

      {/* LUCES */}
      <ambientLight key="ambient-light" intensity={0.5} />
      <pointLight key="point-light-1" position={[0, 10, 10]} intensity={1} color={studentColor} />
      <pointLight key="point-light-2" position={[0, -10, -10]} intensity={0.5} color="#22d3ee" />

      {/* TRAYECTORIAS */}
      <Line key="target-parabola" points={targetPoints} color={targetColor} lineWidth={4} dashed dashSize={0.5} gapSize={0.5} opacity={0.5} transparent />
      <Line key="student-parabola" points={studentPoints} color={studentColor} lineWidth={6} />

      {/* VÉRTICE */}
      <group position={[vertex.h, vertex.k, 0]}>
        <Sphere args={[0.3, 16, 16]}>
           <meshBasicMaterial color={studentColor} />
        </Sphere>
        <Sparkles count={20} scale={2} size={3} speed={0.4} color={studentColor} />
      </group>

      {/* RAÍCES */}
      {roots.map((root, i) => {
        // En el plano 3D: X = parte real, Y = f(x) que es 0, Z = parte imaginaria
        const rootPos = new THREE.Vector3(root.real, 0, i === 0 ? root.imaginary : -root.imaginary);
        const isRootComplex = root.imaginary !== 0;

        return (
          <group key={`root-${i}`}>
            {/* Esfera de la Raíz */}
            <group position={rootPos}>
              <Sphere args={[0.4, 32, 32]}>
                <meshStandardMaterial color={isRootComplex ? "#c084fc" : "#22d3ee"} emissive={isRootComplex ? "#a855f7" : "#0891b2"} emissiveIntensity={2} toneMapped={false} />
              </Sphere>
              <pointLight color={isRootComplex ? "#c084fc" : "#22d3ee"} intensity={2} distance={5} />
              <Html position={[0, 0.8, 0]} center zIndexRange={[100, 0]}>
                 <div className="bg-black/80 backdrop-blur border border-white/20 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap pointer-events-none">
                    x = {root.real.toFixed(2)} {isRootComplex ? `${i === 0 ? '+' : '-'} ${Math.abs(root.imaginary).toFixed(2)}i` : ''}
                 </div>
              </Html>
            </group>

            {/* Línea conectiva desde el vértice a la raíz compleja para mostrar la proyección */}
            {isRootComplex && (
              <Line 
                points={[[vertex.h, vertex.k, 0], [rootPos.x, rootPos.y, rootPos.z]]} 
                color="#c084fc" 
                lineWidth={2} 
                dashed 
                dashSize={0.2} 
                gapSize={0.2} 
                opacity={0.8} 
                transparent 
              />
            )}
          </group>
        );
      })}
    </>
  );
}

export default function Cuadraticas3DScene(props: Cuadraticas3DSceneProps) {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 5, 20], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 20, 60]} />
        <SceneLogic {...props} />
        {/* OrbitControls restringido para no perder el plano XY principal */}
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          minDistance={5} 
          maxDistance={40} 
          maxPolarAngle={Math.PI / 1.5} // No bajar demasiado
          minPolarAngle={0} 
        />
      </Canvas>
      
      {/* CAPA DE INSTRUCCIONES 3D */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10 flex gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white/50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          Plano Real (XY)
        </div>
        {props.currentRes.delta < 0 && (
          <div className="bg-purple-500/10 backdrop-blur-md border border-purple-500/30 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2 animate-in fade-in zoom-in duration-500">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#a855f7]" />
            Plano Complejo Activado (XZ)
          </div>
        )}
      </div>
    </div>
  );
}
