"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows, 
  Float, 
  Text,
  Html,
  Line,
  MeshWobbleMaterial
} from '@react-three/drei';
import * as THREE from 'three';

interface SceneProps {
  angulo: number;
  bloquePos: number; // 0 to 1 (normalized position on ramp)
  muS: number;
  masa: number;
  isDeslizando: boolean;
  materialId?: string;
}

// ==========================================
// Componente: Vector3D con Etiqueta Dinámica
// ==========================================
function Vector3D({ 
  origin, 
  dir, 
  length, 
  color, 
  label,
  value 
}: { 
  origin: [number, number, number], 
  dir: [number, number, number], 
  length: number, 
  color: string,
  label: string,
  value?: number
}) {
  const points = useMemo(() => [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(dir[0] * length, dir[1] * length, dir[2] * length)
  ], [dir, length]);

  return (
    <group position={origin}>
      <Line
        points={points}
        color={color}
        lineWidth={3}
      />
      {/* Arrow Head */}
      <mesh position={[dir[0] * length, dir[1] * length, dir[2] * length]} quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize())}>
        <coneGeometry args={[0.08, 0.25, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Label & Value */}
      <Html position={[dir[0] * length * 1.1, dir[1] * length * 1.1, dir[2] * length * 1.1]} center>
        <div className="flex flex-col items-center">
          <div 
            className="px-2 py-0.5 bg-black/80 backdrop-blur-md border border-white/20 rounded text-[9px] font-black text-white whitespace-nowrap uppercase tracking-widest shadow-xl flex items-center gap-2"
            style={{ borderColor: color }}
          >
            <span style={{ color: color }}>●</span> {label}
          </div>
          {value !== undefined && (
            <div className="text-[10px] font-mono font-bold text-white/80 mt-0.5">
              {value.toFixed(1)} N
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ==========================================
// Componente: HydraulicPiston
// ==========================================
function HydraulicPiston({ angulo }: { angulo: number }) {
  const rad = (angulo * Math.PI) / 180;
  
  // Posición del pivote de la rampa
  const pivotX = -4;
  const pivotY = -2;
  
  // Punto de anclaje del pistón en la rampa (8 unidades desde el pivote)
  const anchorL = 8;
  const targetX = pivotX + Math.cos(rad) * anchorL;
  const targetY = pivotY + Math.sin(rad) * anchorL;
  
  // Base del pistón fija en el suelo
  const baseX = pivotX + anchorL;
  const baseY = -2;
  
  // Cálculo de longitud y ángulo del pistón
  const dx = targetX - baseX;
  const dy = targetY - baseY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const pistonAngle = Math.atan2(dy, dx);

  return (
    <group position={[baseX, baseY, 0]}>
      {/* Base cilíndrica */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.4, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Cuerpo del pistón (Exterior) */}
      <group rotation={[0, 0, pistonAngle + Math.PI/2]}>
        <mesh position={[0, dist/4, 0]}>
          <cylinderGeometry args={[0.15, 0.15, dist/2, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Barra interna (Cromo) */}
        <mesh position={[0, dist*0.75, 0]}>
          <cylinderGeometry args={[0.08, 0.08, dist/2, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0} />
        </mesh>
      </group>
    </group>
  );
}

// ==========================================
// Componente: Rampa
// ==========================================
function Rampa({ angulo }: { angulo: number }) {
  const rad = (angulo * Math.PI) / 180;
  
  return (
    <group rotation={[0, 0, -rad]} position={[-4, -2, 0]}>
      {/* Base de la rampa (Superficie de deslizamiento) */}
      <mesh position={[4, -0.1, 0]}>
        <boxGeometry args={[10, 0.2, 4]} />
        <meshStandardMaterial 
          color="#0f172a" 
          metalness={0.9} 
          roughness={0.1} 
          emissive="#6366f1"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Marcadores de distancia */}
      {[0, 2, 4, 6, 8, 10].map((d) => (
        <group key={d} position={[d, 0.1, 2.1]}>
          <Html center rotation={[-Math.PI/2, 0, 0]} transform>
            <div className="text-[10px] font-black text-indigo-400/50 whitespace-nowrap">
              {d}m
            </div>
          </Html>
        </group>
      ))}

      {/* Grid sobre la rampa */}
      <gridHelper 
        args={[10, 10, 0x6366f1, 0x312e81]} 
        rotation={[Math.PI / 2, 0, 0]} 
        position={[4, 0.01, 0]} 
      />
    </group>
  );
}

// ==========================================
// Componente: Bloque
// ==========================================
function Bloque({ 
  angulo, 
  pos, 
  masa, 
  muS,
  materialId 
}: { 
  angulo: number, 
  pos: number, 
  masa: number,
  muS: number,
  materialId?: string 
}) {
  const rad = (angulo * Math.PI) / 180;
  const W_val = masa * 9.81;
  const N_val = W_val * Math.cos(rad);
  const Wx_val = W_val * Math.sin(rad);
  const fsMax = muS * N_val;
  
  // Escala visual para vectores
  const vecScale = 0.05;

  // Propiedades del material según materialId
  const matProps = useMemo(() => {
    switch (materialId) {
      case 'hielo': return { color: '#bae6fd', roughness: 0.05, metalness: 0.1, transmission: 0.6, thickness: 1 };
      case 'madera': return { color: '#78350f', roughness: 0.8, metalness: 0, transmission: 0 };
      case 'caucho': return { color: '#111827', roughness: 0.9, metalness: 0.1, transmission: 0 };
      default: return { color: '#6366f1', roughness: 0.5, metalness: 0.5, transmission: 0 };
    }
  }, [materialId]);
  
  return (
    <group rotation={[0, 0, -rad]} position={[-4, -2, 0]}>
      <group position={[pos * 8, 0.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            {...matProps}
            emissive={matProps.color}
            emissiveIntensity={0.1}
          />
        </mesh>
        
        {/* Bordes brillantes */}
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
          <lineBasicMaterial color={matProps.color} transparent opacity={0.5} />
        </lineSegments>

        {/* VECTORES */}
        {/* Peso (W) - Siempre hacia abajo global */}
        <group rotation={[0, 0, rad]}>
          <Vector3D origin={[0, 0, 0]} dir={[0, -1, 0]} length={W_val * vecScale} color="#ef4444" label="W" value={W_val} />
        </group>

        {/* Normal (N) - Perpendicular a la rampa */}
        <Vector3D origin={[0, 0, 0]} dir={[0, 1, 0]} length={N_val * vecScale} color="#3b82f6" label="Normal" value={N_val} />

        {/* Componente X (Wx) - Paralela a la rampa (abajo) */}
        <Vector3D origin={[0, 0, 0]} dir={[1, 0, 0]} length={Wx_val * vecScale} color="#f59e0b" label="Wx" value={Wx_val} />

        {/* Fricción (f) - Paralela a la rampa (arriba) */}
        <Vector3D origin={[0, 0, 0]} dir={[-1, 0, 0]} length={Math.min(Wx_val, fsMax) * vecScale} color="#10b981" label="f" value={Math.min(Wx_val, fsMax)} />
      </group>
    </group>
  );
}

// ==========================================
// Componente Principal: Scene
// ==========================================
export default function PlanoInclinado3DScene({ angulo, bloquePos, muS, masa, isDeslizando, materialId }: SceneProps) {
  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
      <PerspectiveCamera makeDefault position={[10, 6, 12]} fov={35} />
      
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1.5} castShadow shadow-mapSize={1024} />
      <pointLight position={[-10, 5, -5]} intensity={1} color="#6366f1" />
      <spotLight position={[0, 15, 0]} angle={0.3} penumbra={1} intensity={1.2} castShadow />
      
      <group position={[0, 1, 0]}>
        <Rampa angulo={angulo} />
        <HydraulicPiston angulo={angulo} />
        <Bloque angulo={angulo} pos={bloquePos} masa={masa} muS={muS} materialId={materialId} />
      </group>

      {/* Suelo de Laboratorio */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial 
          color="#020617" 
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>
      
      <gridHelper args={[50, 50, 0x1e1b4b, 0x0f172a]} position={[0, -1.99, 0]} />
      
      <ContactShadows 
        position={[0, -1.98, 0]} 
        opacity={0.4} 
        scale={20} 
        blur={2} 
        far={4.5} 
      />
      
      {/* Brillo Volumétrico sutil en el fondo */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh position={[-15, 5, -10]}>
          <sphereGeometry args={[2, 32, 32]} />
          <MeshWobbleMaterial color="#312e81" opacity={0.2} transparent factor={0.6} speed={2} />
        </mesh>
      </Float>

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8} 
        minDistance={10}
        maxDistance={25}
        makeDefault
      />
    </Canvas>
  );
}
