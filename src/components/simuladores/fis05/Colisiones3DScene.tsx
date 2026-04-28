"use client";
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Sparkles, Float } from '@react-three/drei';
import type * as THREE from 'three';

interface ColisionesSceneProps {
  phase: 'idle' | 'running' | 'impact' | 'post-impact';
  m1: number;
  m2: number;
  v1i: number;
  v2i: number;
  v1f: number;
  v2f: number;
  e: number;
}

const RAIL_LENGTH = 30;

function MagneticRail() {
  return (
    <group position={[0, -0.5, 0]}>
      {/* Viga Principal */}
      <mesh receiveShadow>
        <boxGeometry args={[RAIL_LENGTH, 0.4, 1.5]} />
        <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Rieles Magnéticos (Líneas luminosas) */}
      <mesh position={[0, 0.21, 0.5]}>
        <boxGeometry args={[RAIL_LENGTH, 0.02, 0.1]} />
        <meshBasicMaterial color="#0ea5e9" />
      </mesh>
      <mesh position={[0, 0.21, -0.5]}>
        <boxGeometry args={[RAIL_LENGTH, 0.02, 0.1]} />
        <meshBasicMaterial color="#0ea5e9" />
      </mesh>

      {/* Marcas de Metraje */}
      {[...Array(21)].map((_, i) => (
        <group key={i} position={[-10 + i, 0.22, 0]}>
          <mesh>
             <boxGeometry args={[0.05, 0.01, 1.6]} />
             <meshBasicMaterial color="#334155" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function EscudoImpacto({ active, positionX }: { active: boolean, positionX: number }) {
  const shieldRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (shieldRef.current && active) {
      shieldRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 20) * 0.2);
    }
  });

  if (!active) return null;

  return (
    <group position={[positionX, 1, 0]}>
      <mesh ref={shieldRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} wireframe />
      </mesh>
      <Sparkles count={50} scale={3} size={4} speed={0.4} color="#f59e0b" />
      <pointLight color="#f59e0b" intensity={2} distance={10} />
    </group>
  );
}

function SceneLogic({ props }: { props: ColisionesSceneProps }) {
  const p1Ref = useRef<THREE.Group>(null);
  const p2Ref = useRef<THREE.Group>(null);
  const glow1Ref = useRef<THREE.PointLight>(null);
  const glow2Ref = useRef<THREE.PointLight>(null);
  
  const [impactPoint, setImpactPoint] = useState(0);
  const timeRef = useRef(0);
  const impactRecorded = useRef(false);
  const posX1Ref = useRef(-8);
  const posX2Ref = useRef(8);

  useEffect(() => {
    if (props.phase === 'idle') {
      posX1Ref.current = -8;
      posX2Ref.current = 8;
      timeRef.current = 0;
      impactRecorded.current = false;
      if (p1Ref.current) p1Ref.current.position.x = -8;
      if (p2Ref.current) p2Ref.current.position.x = 8;
    }
  }, [props.phase]);

  useFrame((state, delta) => {
    if (props.phase === 'idle') return;

    timeRef.current += delta;
    const vScale = 2.0; 

    if (props.phase === 'running') {
      posX1Ref.current = -8 + (props.v1i * vScale * timeRef.current);
      posX2Ref.current = 8 + (props.v2i * vScale * timeRef.current);
      
      if (posX2Ref.current - posX1Ref.current <= 2.0) {
        if (!impactRecorded.current) {
           setImpactPoint((posX1Ref.current + posX2Ref.current) / 2);
           impactRecorded.current = true;
        }
      }
    } else if (props.phase === 'post-impact') {
      posX1Ref.current += (props.v1f * vScale * delta);
      posX2Ref.current += (props.v2f * vScale * delta);
    }

    if (p1Ref.current) p1Ref.current.position.x = posX1Ref.current;
    if (p2Ref.current) p2Ref.current.position.x = posX2Ref.current;
    
    // Rotar anillos
    if (p1Ref.current) p1Ref.current.children[1].rotation.x += (props.phase === 'post-impact' ? props.v1f : props.v1i) * 0.05;
    if (p2Ref.current) p2Ref.current.children[1].rotation.x += (props.phase === 'post-impact' ? props.v2f : props.v2i) * 0.05;
    
    if (glow1Ref.current) glow1Ref.current.intensity = 1 + Math.abs(props.phase === 'post-impact' ? props.v1f : props.v1i) * 0.5;
    if (glow2Ref.current) glow2Ref.current.intensity = 1 + Math.abs(props.phase === 'post-impact' ? props.v2f : props.v2i) * 0.5;
  });

  return (
    <>
      {/* Pod 1 */}
      <group ref={p1Ref} position={[-8, 0.8, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5 * (0.8 + props.m1 * 0.1), 0.5 * (0.8 + props.m1 * 0.1), 1.2 * (0.8 + props.m1 * 0.1), 32]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.6 * (0.8 + props.m1 * 0.1), 0.05, 16, 64]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
        <pointLight ref={glow1Ref} color="#f97316" distance={4} intensity={1} />
      </group>

      {/* Pod 2 */}
      <group ref={p2Ref} position={[8, 0.8, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.5 * (0.8 + props.m2 * 0.1), 0.5 * (0.8 + props.m2 * 0.1), 1.2 * (0.8 + props.m2 * 0.1), 32]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.6 * (0.8 + props.m2 * 0.1), 0.05, 16, 64]} />
          <meshBasicMaterial color="#818cf8" />
        </mesh>
        <pointLight ref={glow2Ref} color="#818cf8" distance={4} intensity={1} />
      </group>

      <EscudoImpacto active={props.phase === 'impact'} positionX={impactPoint} />
    </>
  );
}

export default function Colisiones3DScene(props: ColisionesSceneProps) {
  return (
    <Canvas camera={{ position: [0, 5, 15], fov: 45 }} shadows>
      <color attach="background" args={['#020617']} />
      <fog attach="fog" args={['#020617', 10, 40]} />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[0, 15, 0]} intensity={0.8} angle={0.8} penumbra={0.5} castShadow />
      
      <MagneticRail />
      <SceneLogic props={props} />

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 2.2} 
        minDistance={5} 
        maxDistance={25} 
      />
    </Canvas>
  );
}
