import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface HookeSceneProps {
  k: number;
  masa: number;
  amplitud: number;
  isOscilando: boolean;
  tiempoOscilacion: number;
}

const GRAVEDAD = 9.81;

function StrutAndMass({ k, masa, amplitud, isOscilando, tiempoOscilacion }: HookeSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const emboloRef = useRef<THREE.Mesh>(null);
  const massRef = useRef<THREE.Mesh>(null);

  const L0 = 4.0; // Longitud natural de la suspensión descargada

  useFrame(() => {
    // 1. Estiramiento estático (equilibrio)
    const yEquilibrio = (masa * GRAVEDAD) / k; 
    
    // 2. Desplazamiento cinemático (oscilación o impacto)
    let yDinamico = 0;
    if (isOscilando) {
      const omega = Math.sqrt(k / masa);
      yDinamico = amplitud * Math.cos(omega * tiempoOscilacion);
    } else {
      yDinamico = amplitud;
    }

    const L_actual = L0 + yEquilibrio + yDinamico;

    // Actualizamos posición de la carga (Masa)
    if (massRef.current) {
      massRef.current.position.y = -L_actual - 0.25; // Offset por tamaño de carga
      const scale = 0.5 + (masa * 0.1);
      massRef.current.scale.set(scale, 1, scale);
    }

    // Actualizamos posición del émbolo interior (Chrome rod)
    if (emboloRef.current) {
      // El émbolo tiene longitud 6. Para que su base esté pegada a la carga:
      emboloRef.current.position.y = -L_actual + 3;
    }
  });

  return (
    <group ref={groupRef} position={[0, 4, 0]}>
      {/* Soporte Superior Estructural */}
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[4, 0.5, 4]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Outer Cylinder (Carcasa del Amortiguador) */}
      <mesh position={[0, -1.5, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 3, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Detalles de la Carcasa (Aletas de refrigeración) */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0, -0.5 - (i * 0.5), 0]}>
          <cylinderGeometry args={[0.9, 0.9, 0.1, 32]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}

      {/* Inner Cylinder (Émbolo Telescópico) */}
      <mesh ref={emboloRef} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 6, 32]} />
        <meshStandardMaterial color="#e2e8f0" metalness={1} roughness={0.05} />
      </mesh>

      {/* Masa / Carga de Prueba */}
      <mesh ref={massRef} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.5, 32]} />
        <meshStandardMaterial color="#fb8500" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function TelemetriaLaser() {
  return (
    <group position={[-4, 4, 0]}>
      {/* Poste Sensor */}
      <mesh position={[0, -6, 0]}>
        <boxGeometry args={[0.2, 12, 0.2]} />
        <meshStandardMaterial color="#023047" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Marcas Holográficas */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => (
        <group key={m} position={[0, -m, 0]}>
          <mesh position={[0.4, 0, 0]}>
             <boxGeometry args={[0.8, 0.02, 0.1]} />
             <meshBasicMaterial color="#219EBC" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function LeyHooke3DScene(props: HookeSceneProps) {
  return (
    <Canvas camera={{ position: [0, 1, 10], fov: 50 }} shadows>
      <color attach="background" args={['#020617']} />
      
      {/* Iluminación Industrial */}
      <ambientLight intensity={0.5} />
      <spotLight position={[8, 12, 8]} intensity={1.2} angle={0.5} penumbra={0.8} castShadow color="#ffffff" />
      <pointLight position={[-5, 5, -5]} intensity={0.8} color="#219ebc" />
      <pointLight position={[5, -5, 5]} intensity={0.5} color="#fb8500" />

      <StrutAndMass {...props} />
      <TelemetriaLaser />

      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8} 
        minDistance={6} 
        maxDistance={18} 
      />

      {/* Rejilla de Laboratorio Rover */}
      <gridHelper args={[30, 30, '#219ebc', '#0f172a']} position={[0, -8, 0]} />
    </Canvas>
  );
}
