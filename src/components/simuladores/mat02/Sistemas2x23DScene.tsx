"use client";

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Sphere, Sparkles, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

interface Sistemas2x23DSceneProps {
  m1: number;
  b1: number;
  m2: number;
  b2: number;
  target: { x: number; y: number };
  escenario: 'rastreo_satelital' | 'interseccion_rutas' | 'triangulacion_torres';
}

function SignalPulse({ position, color }: { position: THREE.Vector3, color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
    useFrame(({ clock }) => {
      if (meshRef.current) {
        const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.15; // Reducido de 10x a 3x y amplitud de 0.2 a 0.15
        meshRef.current.scale.set(s, s, s);
        meshRef.current.rotation.y += 0.01; // Reducido de 0.05 a 0.01
      }
    });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} wireframe />
      </mesh>
      <Sphere args={[0.2, 16, 16]}>
        <meshBasicMaterial color="white" />
      </Sphere>
      <Sparkles count={30} scale={2} size={4} speed={0.5} color={color} />
      <pointLight color={color} intensity={2} distance={10} />
    </group>
  );
}

function SceneLogic({ m1, b1, m2, b2, target, escenario }: Sistemas2x23DSceneProps) {
  const isParallel = Math.abs(m1 - m2) < 0.01;
  
  const intersection = useMemo(() => {
    if (isParallel) return null;
    const x = (b2 - b1) / (m1 - m2);
    const y = m1 * x + b1;
    return new THREE.Vector3(x, y, 0);
  }, [m1, b1, m2, b2, isParallel]);

  const targetPos = new THREE.Vector3(target.x, target.y, 0);

  // Generar puntos para las líneas (haces láser)
  const line1Points = useMemo(() => [
    new THREE.Vector3(-20, m1 * -20 + b1, 0),
    new THREE.Vector3(20, m1 * 20 + b1, 0)
  ], [m1, b1]);

  const line2Points = useMemo(() => [
    new THREE.Vector3(-20, m2 * -20 + b2, 0),
    new THREE.Vector3(20, m2 * 20 + b2, 0)
  ], [m2, b2]);

  const isLocked = intersection && intersection.distanceTo(targetPos) < 0.2;

  return (
    <>
      <ambientLight intensity={0.5} />
      <Grid infiniteGrid fadeDistance={40} sectionColor="#1e293b" cellColor="#1e293b" />
      
      {/* EJES Y COORDENADAS */}
      <Line key="axis-x" points={[[-20, 0, 0], [20, 0, 0]]} color="white" lineWidth={1} opacity={0.3} transparent />
      <Line key="axis-y" points={[[0, -20, 0], [0, 20, 0]]} color="white" lineWidth={1} opacity={0.3} transparent />
      
      {[-10, -5, 5, 10].map(val => (
        <React.Fragment key={`axis-label-${val}`}>
          <Html position={[val, -0.5, 0]} center><span className="text-[7px] text-white/40 font-mono">{val}</span></Html>
          <Html position={[-0.5, val, 0]} center><span className="text-[7px] text-white/40 font-mono">{val}</span></Html>
        </React.Fragment>
      ))}

      {/* SEÑAL OBJETIVO (SATÉLITE) */}
      <group key="target-group" position={targetPos}>
        <Float key="target-float" speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
          <Sphere key="target-sphere" args={[0.4, 16, 16]}>
            <meshBasicMaterial color={isLocked ? "#10b981" : "#22d3ee"} />
          </Sphere>
          <mesh key="target-torus" rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.7, 0.03, 16, 100]} />
            <meshBasicMaterial color={isLocked ? "#10b981" : "#22d3ee"} transparent opacity={0.5} />
          </mesh>
        </Float>
        <Html key="target-label" position={[0, 1.2, 0]} center>
          <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest backdrop-blur-md transition-all ${isLocked ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'}`}>
            {isLocked ? "COORDINATES MATCHED" : (
              escenario === 'rastreo_satelital' ? "SATELLITE BEACON" :
              escenario === 'interseccion_rutas' ? "ROUTE JUNCTION" :
              "SIGNAL TOWER"
            )}
          </div>
        </Html>
      </group>

      {/* HACES LÁSER CON ECUACIONES FLOTANTES */}
      <group key="laser-1-group">
        <Line key="laser-1" points={line1Points} color="#22d3ee" lineWidth={6} />
        <Html position={[10, m1 * 10 + b1 + 1, 0]} center>
          <div className="bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-mono text-cyan-400">
            L1: y = {m1.toFixed(1)}x {b1 >= 0 ? '+' : ''}{b1.toFixed(1)}
          </div>
        </Html>
      </group>

      <group key="laser-2-group">
        <Line key="laser-2" points={line2Points} color="#f0abfc" lineWidth={6} />
        <Html position={[-10, m2 * -10 + b2 + 1, 0]} center>
          <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-mono text-fuchsia-400">
            L2: y = {m2.toFixed(1)}x {b2 >= 0 ? '+' : ''}{b2.toFixed(1)}
          </div>
        </Html>
      </group>

      {/* PUNTO DE INTERSECCIÓN */}
      {intersection && (
        <group key="intersection-group">
          <SignalPulse key="intersection-pulse" position={intersection} color={isParallel ? "#ef4444" : isLocked ? "#10b981" : "#ffffff"} />
          {!isLocked && (
            <Html position={[intersection.x, intersection.y - 1.2, 0]} center>
              <div className="text-[8px] font-black text-white/50 bg-black/40 px-2 py-1 rounded-md">
                INT: ({intersection.x.toFixed(1)}, {intersection.y.toFixed(1)})
              </div>
            </Html>
          )}
        </group>
      )}

      {/* ALERTA PARALELISMO */}
      {isParallel && (
        <Html center position={[0, 5, 0]}>
          <div className="bg-rose-600/90 text-white px-6 py-2 rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-2xl animate-pulse">
            SISTEMA INCONSISTENTE: m1 = m2
          </div>
        </Html>
      )}
    </>
  );
}

export default function Sistemas2x23DScene(props: Sistemas2x23DSceneProps) {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 0, 25], fov: 40 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 20, 70]} />
        <SceneLogic {...props} />
        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          minDistance={10} 
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2} // Restringir a plano frontal por defecto pero permitir rotación leve si se desea (descomentar para libertad)
        />
      </Canvas>
    </div>
  );
}
