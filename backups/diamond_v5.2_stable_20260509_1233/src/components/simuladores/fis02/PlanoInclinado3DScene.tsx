"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Html } from '@react-three/drei';
import * as THREE from 'three';

interface SceneProps {
  angulo: number;
  bloquePos: number; 
  masa: number;
  isDeslizando: boolean;
  fuerzaAplicada: number;
  status: string;
}

// ── SISTEMA DE FUEGO DEL MOTOR (SIN LUCES DINÁMICAS QUE CRASHEAN) ──
function ThrusterFlames({ active, power }: { active: boolean, power: number }) {
  const fireGroup = useRef<THREE.Group>(null);
  const isBraking = power < 0;
  // Usamos un color fijo en el render inicial para evitar recompilación de shaders
  const colorStr = isBraking ? "#ff003c" : "#00f6ff";

  useFrame((state) => {
    if (fireGroup.current) {
      if (active && power !== 0) {
        fireGroup.current.visible = true;
        fireGroup.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 40) * 0.2);
      } else {
        fireGroup.current.visible = false;
      }
    }
  });

  return (
    <group ref={fireGroup} position={[0, -1.8, 0]} visible={false}>
      {/* Cono de fuego usando BasicMaterial (no requiere luces, no crashea) */}
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 1.2, 16]} />
        <meshBasicMaterial color={colorStr} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ── COHETE MULTI-ETAPA (MATERIALES BÁSICOS Y ESTABLES) ──
function RocketModel({ active, power, pos }: { active: boolean, power: number, pos: number }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (group.current && active && power > 0 && pos < 0.99) {
      group.current.position.x = (Math.random() - 0.5) * 0.05;
      group.current.position.z = (Math.random() - 0.5) * 0.05;
    } else if (group.current) {
      group.current.position.x = 0;
      group.current.position.z = 0;
    }
  });

  return (
    <group ref={group} rotation={[0, 0, -Math.PI / 2]}>
       {/* Fuselaje */}
       <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.45, 3, 16]} />
          <meshLambertMaterial color="#f8fafc" />
       </mesh>
       {/* Punta */}
       <mesh position={[0, 2, 0]} castShadow>
          <coneGeometry args={[0.4, 1.2, 16]} />
          <meshLambertMaterial color="#020617" />
       </mesh>
       {/* Aletas */}
       {[-1, 1].map(side => (
         <mesh key={side} position={[side * 0.45, -1, 0]} rotation={[0, 0, side * 0.15]} castShadow>
            <boxGeometry args={[0.7, 1.2, 0.08]} />
            <meshLambertMaterial color="#0f172a" />
         </mesh>
       ))}
       {/* Tobera */}
       <mesh position={[0, -1.6, 0]}>
          <cylinderGeometry args={[0.25, 0.45, 0.5, 16]} />
          <meshLambertMaterial color="#1e293b" />
       </mesh>
       
       <ThrusterFlames active={active} power={power} />
    </group>
  );
}

// ── SEGUIMIENTO DE CÁMARA (RESPETANDO ORBIT CONTROLS) ──
function CinematicCamera({ isDeslizando, rocketPos, angulo, controlsRef }: { isDeslizando: boolean, rocketPos: number, angulo: number, controlsRef: any }) {
  const { camera } = useThree();
  const rad = (angulo * Math.PI) / 180;
  
  useFrame(() => {
    if (isDeslizando && controlsRef.current) {
      // Cálculo basado en el nuevo centro del cohete
      const rX = -10 + (rocketPos * 16) * Math.cos(rad);
      const rY = (rocketPos * 16) * Math.sin(rad);
      
      const targetCamX = rX + 15;
      const targetCamY = Math.max(8, rY + 5); 
      const distanceZ = 25 + (rY * 1.5); 
      
      camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, distanceZ), 0.05);
      controlsRef.current.target.lerp(new THREE.Vector3(rX, rY, 0), 0.05);
      controlsRef.current.update();
    }
  });
  return null;
}

export default function PlanoInclinado3DScene({ angulo, bloquePos, masa, isDeslizando, fuerzaAplicada, status }: SceneProps) {
  const rad = (angulo * Math.PI) / 180;
  const controlsRef = useRef<any>(null);
  
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [20, 15, 30], fov: 40 }}>
      {/* CIELO Y LUZ BÁSICA MUY ESTABLE */}
      <color attach="background" args={["#87CEEB"]} />
      <Sky sunPosition={[50, 20, 50]} turbidity={0.1} rayleigh={0.5} />
      
      <ambientLight intensity={1.5} color="#ffffff" />
      <directionalLight position={[30, 50, 20]} intensity={2.5} castShadow shadow-mapSize={[1024, 1024]} />
      
      <CinematicCamera isDeslizando={isDeslizando} rocketPos={bloquePos} angulo={angulo} controlsRef={controlsRef} />

      {/* Todo el escenario se eleva para evitar clipping */}
      <group position={[0, -2, 0]}>
        
        {/* PISTA DE LANZAMIENTO */}
        {/* PIVOTE CORREGIDO: Rotamos exactamente desde el extremo izquierdo e inferior */}
        <group position={[-10, 0, 0]} rotation={[0, 0, rad]}>
           
           {/* El centro del chasis ahora está desplazado la mitad de su longitud hacia la derecha 
               y la mitad de su altura hacia arriba. Así el punto [0,0,0] es la esquina inferior izquierda. */}
           <mesh position={[9, 0.5, 0]} receiveShadow castShadow>
              <boxGeometry args={[18, 1, 3.5]} />
              <meshLambertMaterial color="#1e293b" />
           </mesh>
           
           {/* Rieles (Usamos BasicMaterial para evitar recálculo de shader con la emisión) */}
           {[-1.2, 1.2].map(side => (
             <mesh key={side} position={[9, 1.05, side]}>
                <boxGeometry args={[18, 0.1, 0.3]} />
                <meshBasicMaterial color="#00f6ff" />
             </mesh>
           ))}

           {/* Marcadores */}
           {[0, 4, 8, 12, 16].map(d => (
             <Html key={d} position={[d, -0.5, 2.5]} center distanceFactor={20}>
               <div className="bg-black/90 border border-cyan-500/50 px-3 py-1 rounded text-[12px] font-black text-cyan-400 font-mono">
                 {d}M
               </div>
             </Html>
           ))}

           {/* COHETE (Montado sobre la superficie de la pista Y=1.4) */}
           <group position={[bloquePos * 16, 1.5, 0]}>
              <RocketModel active={isDeslizando || status === "IGNICIÓN"} power={fuerzaAplicada} pos={bloquePos} />
           </group>
        </group>

        {/* ESTRUCTURA DE SOPORTE */}
        <mesh position={[2, -2.5, 0]} castShadow>
           <cylinderGeometry args={[0.6, 0.6, 5, 16]} />
           <meshLambertMaterial color="#475569" />
        </mesh>

        {/* SUELO (CONCRETO ESTABLE) */}
        <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshLambertMaterial color="#cbd5e1" />
        </mesh>
        <gridHelper args={[200, 40, 0x94a3b8, 0x94a3b8]} position={[0, 0.01, 0]} />
      </group>

      <OrbitControls 
        ref={controlsRef} 
        makeDefault 
        enablePan={false} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={10} 
        maxDistance={60} 
      />
    </Canvas>
  );
}
