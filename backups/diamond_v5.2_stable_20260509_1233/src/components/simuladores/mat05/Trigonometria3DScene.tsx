"use client";

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Sphere, Sparkles, Html, Float, Stars, Text, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface Trigonometria3DSceneProps {
  angulo: number;
  verSeno: boolean;
  verCoseno: boolean;
  verTangente?: boolean;
  amplitud?: number;
  frecuencia?: number;
}

function TrigonometricCore({ angulo, verSeno, verCoseno, verTangente = true, amplitud = 5, frecuencia = 1 }: Trigonometria3DSceneProps) {
  const rad = (angulo * Math.PI) / 180;
  
  const x = Math.cos(rad) * amplitud;
  const y = Math.sin(rad) * amplitud;

  // Cálculo de la Tangente (Precisión matemática con límite para evitar infinitos visuales)
  const tanValue = Math.tan(rad);
  const tanY = Math.abs(tanValue) > 20 ? Math.sign(tanValue) * 20 : tanValue * amplitud;
  const hasTangent = Math.abs(Math.cos(rad)) > 0.01;

  return (
    <group>
      {/* ── TRIÁNGULO DE PITÁGORAS INTERNO ── */}
      <mesh>
        <Line 
          points={[[0, 0, 0], [x, 0, 0], [x, y, 0], [0, 0, 0]]} 
          color="white" 
          lineWidth={1} 
          transparent 
          opacity={0.2} 
        />
        <meshBasicMaterial transparent opacity={0.05} color="#0ea5e9" side={THREE.DoubleSide} />
      </mesh>

      {/* ── VECTOR PRINCIPAL (HIPOTENUSA) ── */}
      <group>
        <Line 
          points={[[0, 0, 0], [x, y, 0]]} 
          color="white" 
          lineWidth={4} 
        />
        <Sphere args={[0.25, 16, 16]} position={[x, y, 0]}>
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={2} />
        </Sphere>
      </group>

      {/* ── PROYECCIÓN SENO (OPUESTO) ── */}
      {verSeno && (
        <group>
          <Line 
            points={[[x, 0, 0], [x, y, 0]]} 
            color="#22d3ee" 
            lineWidth={6} 
          />
          <Sparkles position={[x, y / 2, 0]} count={15} scale={[0.1, Math.abs(y), 0.1]} size={2} color="#22d3ee" />
          <Html position={[x + 0.5, y / 2, 0]} center>
            <div className="text-[10px] font-black text-cyan-400 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-cyan-500/30">
              SEN: {Math.sin(rad).toFixed(3)}
            </div>
          </Html>
        </group>
      )}

      {/* ── PROYECCIÓN COSENO (ADYACENTE) ── */}
      {verCoseno && (
        <group>
          <Line 
            points={[[0, 0, 0], [x, 0, 0]]} 
            color="#e879f9" 
            lineWidth={6} 
          />
          <Html position={[x / 2, -1, 0]} center>
            <div className="text-[10px] font-black text-fuchsia-400 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-fuchsia-500/30">
              COS: {Math.cos(rad).toFixed(3)}
            </div>
          </Html>
        </group>
      )}

      {/* ── PROYECCIÓN TANGENTE (EXTERNA) ── */}
      {verTangente && hasTangent && (
        <group>
          {/* Línea Tangente Auxiliar */}
          <Line 
            points={[[amplitud, -20, 0], [amplitud, 20, 0]]} 
            color="white" 
            lineWidth={0.5} 
            transparent 
            opacity={0.1} 
          />
          {/* Segmento de Tangente */}
          <Line 
            points={[[amplitud, 0, 0], [amplitud, tanY, 0]]} 
            color="#facc15" 
            lineWidth={4} 
          />
          {/* Conector desde el origen pasando por el punto del círculo */}
          <Line 
            points={[[x, y, 0], [amplitud, tanY, 0]]} 
            color="#facc15" 
            lineWidth={1} 
            dashed 
            dashSize={0.2} 
          />
          <Html position={[amplitud + 1.5, tanY / 2, 0]} center>
            <div className="text-[10px] font-black text-yellow-400 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm border border-yellow-500/30">
              TAN: {tanValue.toFixed(3)}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

function WaveDynamicTunnel({ angulo, verSeno, verCoseno, amplitud = 5 }: Trigonometria3DSceneProps) {
  const pointsSeno = useMemo(() => {
    const p = [];
    for (let i = 0; i < 150; i++) {
      const z = -i * 0.3;
      const stepAngle = (angulo - i * 4) * (Math.PI / 180);
      p.push(new THREE.Vector3(0, Math.sin(stepAngle) * amplitud, z));
    }
    return p;
  }, [angulo, amplitud]);

  const pointsCoseno = useMemo(() => {
    const p = [];
    for (let i = 0; i < 150; i++) {
      const z = -i * 0.3;
      const stepAngle = (angulo - i * 4) * (Math.PI / 180);
      p.push(new THREE.Vector3(Math.cos(stepAngle) * amplitud, 0, z));
    }
    return p;
  }, [angulo, amplitud]);

  return (
    <group>
      {verSeno && (
        <group>
           <Line points={pointsSeno} color="#22d3ee" lineWidth={2} transparent opacity={0.4} />
           {/* Glow lateral de la onda */}
           <Line points={pointsSeno} color="#22d3ee" lineWidth={10} transparent opacity={0.05} />
        </group>
      )}
      {verCoseno && (
        <group>
           <Line points={pointsCoseno} color="#e879f9" lineWidth={2} transparent opacity={0.4} />
           <Line points={pointsCoseno} color="#e879f9" lineWidth={10} transparent opacity={0.05} />
        </group>
      )}
    </group>
  );
}

export default function Trigonometria3DScene(props: Trigonometria3DSceneProps) {
  const gridRef = useRef<THREE.Group>(null);

  return (
    <div className="w-full h-full bg-[#020617]">
      <Canvas camera={{ position: [15, 10, 20], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 20, 60]} />
        
        <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={1.5} />
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#0ea5e9" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#e879f9" />

        <group rotation={[0, -Math.PI / 8, 0]}>
          {/* ── CÍRCULO UNITARIO (ANILLO DE PODER) ── */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[5, 0.04, 16, 100]} />
            <meshStandardMaterial 
              color="#0ea5e9" 
              emissive="#0ea5e9" 
              emissiveIntensity={4} 
              transparent 
              opacity={0.3} 
            />
          </mesh>

          {/* ── REJILLA CUÁNTICA RECTANGULAR ── */}
          <Grid 
            infiniteGrid 
            fadeDistance={40} 
            cellColor="#1e293b" 
            sectionColor="#334155" 
            sectionSize={5}
            cellSize={1}
            rotation={[Math.PI / 2, 0, 0]} 
          />

          {/* ── EJES DE COORDENADAS HOLOGRÁFICOS ── */}
          <Line points={[[-20, 0, 0], [20, 0, 0]]} color="white" lineWidth={0.5} transparent opacity={0.1} />
          <Line points={[[0, -20, 0], [0, 20, 0]]} color="white" lineWidth={0.5} transparent opacity={0.1} />

          <TrigonometricCore {...props} />
          <WaveDynamicTunnel {...props} />
          
          {/* ── MARCADORES DE GRADOS Y OBJETIVOS ── */}
          {[0, 90, 180, 270].map(deg => {
             const r = (deg * Math.PI) / 180;
             const dist = 5;
             const isNear = Math.abs(props.angulo - deg) < 5 || Math.abs(props.angulo - 360 - deg) < 5;
             
             return (
               <group key={deg} position={[Math.cos(r) * dist, Math.sin(r) * dist, 0]}>
                 <Sphere args={[0.15, 8, 8]}>
                    <meshStandardMaterial 
                      color={isNear ? "#22d3ee" : "#ffffff"} 
                      emissive={isNear ? "#22d3ee" : "#ffffff"} 
                      emissiveIntensity={isNear ? 5 : 0.5} 
                      transparent 
                      opacity={0.3} 
                    />
                 </Sphere>
                 {isNear && <Sparkles count={5} scale={0.5} size={2} color="#22d3ee" />}
                 <Html position={[0, 0.8, 0]} center>
                    <span className={`text-[8px] font-black tracking-widest transition-all ${isNear ? 'text-cyan-400' : 'text-white/20'}`}>
                      {deg}°
                    </span>
                 </Html>
               </group>
             );
          })}
        </group>

        <OrbitControls 
          enablePan={true} 
          minDistance={10} 
          maxDistance={50} 
          autoRotate={false}
          makeDefault 
        />
      </Canvas>
    </div>
  );
}
