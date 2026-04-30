"use client";

import React, { useRef, Suspense, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Float, 
  MeshDistortMaterial, 
  ContactShadows,
  PerspectiveCamera,
  Stars,
  Html,
  MeshWobbleMaterial,
  Sparkles,
  Text
} from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise, Glitch } from '@react-three/postprocessing';
import { useSimuladorStore } from "@/store/simuladorStore";
import * as THREE from 'three';

// CPK Coloring Standard for Atoms
const CPK_COLORS: Record<string, string> = {
  H: "#FFFFFF",
  C: "#222222",
  O: "#FF0000",
  N: "#3050F8",
  Cl: "#1FF01F",
  Na: "#AB5CF2",
  S: "#FFFF30",
  default: "#FF00FF"
};

// Temas visuales por nivel
const THEMES: Record<string, any> = {
  'propano': { color: "#ff4400", emissive: "#ff2200", stars: "#ff8844" },
  'fotosintesis': { color: "#00d4ff", emissive: "#0055ff", stars: "#ffffff" },
  'haber': { color: "#ffcc00", emissive: "#aa8800", stars: "#ffeecc" },
  'metanol': { color: "#9900ff", emissive: "#4400aa", stars: "#cc99ff" },
  'default': { color: "#219EBC", emissive: "#219EBC", stars: "#ffffff" }
};

/**
 * Componente que renderiza una molécula realista (Ball-and-Stick)
 */
function MoleculeModel({ formula, atomos, scale = 1, isBalanced = false, color }: any) {
  const groupRef = useRef<THREE.Group>(null);

  // Generar posiciones deterministas pero "naturales" para los átomos
  const atomList = useMemo(() => {
    const list: any[] = [];
    let i = 0;
    Object.entries(atomos).forEach(([symbol, count]: [string, any]) => {
      for (let j = 0; j < count; j++) {
        // Layout simple en espiral/esfera
        const phi = Math.acos(-1 + (2 * i) / 10);
        const theta = Math.sqrt(10 * Math.PI) * phi;
        const radius = 0.5 + (count > 5 ? 0.3 : 0);
        
        list.push({
          symbol,
          pos: [
            radius * Math.cos(theta) * Math.sin(phi),
            radius * Math.sin(theta) * Math.sin(phi),
            radius * Math.cos(phi)
          ],
          color: CPK_COLORS[symbol] || CPK_COLORS.default
        });
        i++;
      }
    });
    return list;
  }, [atomos]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
      groupRef.current.rotation.x += 0.005;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {atomList.map((atom, i) => (
        <mesh key={i} position={atom.pos}>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial 
            color={isBalanced ? "#00ffcc" : atom.color} 
            emissive={isBalanced ? "#00ffcc" : atom.color} 
            emissiveIntensity={isBalanced ? 2 : 0.5}
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>
      ))}
      {/* Enlaces (Bonds) simplificados con líneas brillantes */}
      {atomList.length > 1 && atomList.map((atom, i) => i > 0 && (
        <group key={`bond-${i}`} rotation={[0, 0, 0]}>
          <mesh position={[atom.pos[0]/2, atom.pos[1]/2, atom.pos[2]/2]}>
            <boxGeometry args={[0.05, 0.05, 0.5]} />
            <meshStandardMaterial color="#444" transparent opacity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PlasmaCore({ isBalanced, pulse, masaTotal, theme }: { isBalanced: boolean, pulse: boolean, masaTotal: number, theme: any }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const flashRef = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [targetScale, setTargetScale] = useState(1);
  const [flashIntensity, setFlashIntensity] = useState(0);
  
  const baseScale = 1.0 + (masaTotal / 1000);
  
  useEffect(() => {
    setTargetScale(baseScale * 1.5);
    const timer = setTimeout(() => setTargetScale(baseScale), 150);
    return () => clearTimeout(timer);
  }, [pulse, baseScale]);

  useEffect(() => {
    if (isBalanced) {
      setFlashIntensity(800);
      const timer = setTimeout(() => setFlashIntensity(0), 800);
      return () => clearTimeout(timer);
    }
  }, [isBalanced]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
      meshRef.current.rotation.y = t * 0.8;
      meshRef.current.rotation.z = t * 0.3;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 1.5;
      ringRef.current.rotation.y = t * 1.2;
      ringRef.current.scale.setScalar(targetScale * 1.8 + Math.sin(t * 5) * 0.1);
    }
    if (flashRef.current) {
      flashRef.current.intensity = THREE.MathUtils.lerp(flashRef.current.intensity, flashIntensity, 0.05);
    }
  });

  return (
    <group>
      <pointLight ref={flashRef} position={[0, 0, 0]} color={isBalanced ? "#00ffcc" : "#ffffff"} distance={25} />
      
      <Float speed={isBalanced ? 1.5 : 10} rotationIntensity={isBalanced ? 0.5 : 5} floatIntensity={isBalanced ? 0.5 : 4}>
        {/* Núcleo Principal */}
        <mesh ref={meshRef}>
          <octahedronGeometry args={[1.6, 2]} />
          <MeshDistortMaterial
            color={isBalanced ? "#00ffcc" : theme.color}
            speed={isBalanced ? 2 : 8}
            distort={isBalanced ? 0.1 : 0.6}
            radius={1}
            emissive={isBalanced ? "#00ffcc" : theme.emissive}
            emissiveIntensity={isBalanced ? 12 : 4}
            metalness={1}
            roughness={0}
          />
        </mesh>
        
        {/* Capa de Energía Interna */}
        <mesh scale={0.8}>
           <sphereGeometry args={[1.5, 32, 32]} />
           <MeshWobbleMaterial 
             color={isBalanced ? "#ffffff" : theme.color} 
             factor={isBalanced ? 0.1 : 2.0} 
             speed={isBalanced ? 1 : 25} 
             emissive={isBalanced ? "#ffffff" : theme.emissive}
             emissiveIntensity={isBalanced ? 20 : 8}
           />
        </mesh>

        {/* Anillo de Estabilidad */}
        <mesh ref={ringRef}>
          <torusGeometry args={[1.8, 0.02, 16, 100]} />
          <meshStandardMaterial color={isBalanced ? "#00ffcc" : theme.color} emissive={isBalanced ? "#00ffcc" : theme.emissive} emissiveIntensity={10} />
        </mesh>

        {isBalanced && <Sparkles count={200} scale={6} size={6} speed={3} color="#00ffcc" />}

        <Html position={[0, -3.2, 0]} center>
          <div className="flex flex-col items-center gap-1 pointer-events-none">
             <div className={`px-6 py-2 rounded-xl border-2 font-black text-[10px] tracking-[0.4em] uppercase backdrop-blur-xl transition-all duration-700 ${isBalanced ? 'bg-emerald-500/30 border-emerald-400 text-emerald-400 shadow-[0_0_50px_#10b981]' : 'bg-black/40 border-white/10 text-white/30'}`}>
               {isBalanced ? 'Fusión Certificada' : 'Ajuste Estequiométrico'}
             </div>
          </div>
        </Html>
      </Float>
    </group>
  );
}

function GridFloor() {
  return (
    <group position={[0, -8, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#0a1121" 
          metalness={0.8} 
          roughness={0.2} 
          emissive="#001a2c"
          emissiveIntensity={0.5}
        />
      </mesh>
      <gridHelper args={[100, 50, "#219EBC", "#023047"]} position={[0, 0.01, 0]} opacity={0.2} transparent />
    </group>
  );
}

function Molecules({ reactivos, productos, isBalanced, coeficientes, onIncrement, theme }: any) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <group>
      {reactivos.map((r: any, i: number) => {
        const coef = coeficientes[i] || 1;
        const angle = (i / reactivos.length) * Math.PI * 0.7 - Math.PI/2.5;
        const radius = 10;
        const x = Math.sin(angle) * -radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <group 
            key={`reac-${i}`} position={[x, (i - 0.5) * 5, z]}
            onPointerOver={() => setHovered(i)}
            onPointerOut={() => setHovered(null)}
            onClick={() => onIncrement(i, 1)}
          >
            <Float speed={hovered === i ? 12 : 2.5} rotationIntensity={1.5} floatIntensity={2}>
              <MoleculeModel 
                formula={r.formula} 
                atomos={r.atomos} 
                scale={(0.8 + coef * 0.1) * (hovered === i ? 1.4 : 1)}
                isBalanced={isBalanced}
                color={theme.color}
              />
              
              <Html distanceFactor={15} position={[0, -1.8, 0]} center>
                <div className="flex flex-col items-center select-none cursor-pointer group">
                   <div className={`flex items-center gap-3 bg-[#023047]/90 px-5 py-2 rounded-2xl border-2 transition-all duration-300 ${hovered === i ? 'border-cyan-400 scale-110 shadow-[0_0_20px_rgba(34,211,238,0.3)]' : 'border-white/10'}`}>
                      <span className="text-xl font-black text-white">{coef}</span>
                      <span className="text-xs font-black text-cyan-400/80 tracking-widest">{r.formula}</span>
                   </div>
                   <div className="mt-2 h-1 w-0 group-hover:w-full bg-cyan-400 transition-all duration-300 rounded-full" />
                </div>
              </Html>
            </Float>

            {/* Vínculo de Energía */}
            {!isBalanced && (
              <Sparkles count={20} scale={2} size={2} color={theme.color} />
            )}
          </group>
        );
      })}

      {productos.map((p: any, i: number) => {
        const idx = reactivos.length + i;
        const coef = coeficientes[idx] || 1;
        const angle = (i / productos.length) * Math.PI * 0.7 - Math.PI/2.5;
        const radius = 10;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        return (
          <group 
            key={`prod-${i}`} position={[x, (i - 0.5) * 5, z]}
            onPointerOver={() => setHovered(idx)}
            onPointerOut={() => setHovered(null)}
            onClick={() => onIncrement(idx, 1)}
          >
            <Float speed={hovered === idx ? 12 : 2.5} rotationIntensity={1.5} floatIntensity={2}>
              <MoleculeModel 
                formula={p.formula} 
                atomos={p.atomos} 
                scale={(0.8 + coef * 0.1) * (hovered === idx ? 1.4 : 1)}
                isBalanced={isBalanced}
                color={theme.color}
              />
              <Html distanceFactor={15} position={[0, -1.8, 0]} center>
                <div className="flex flex-col items-center select-none cursor-pointer group">
                   <div className={`flex items-center gap-3 bg-[#023047]/90 px-5 py-2 rounded-2xl border-2 transition-all duration-300 ${hovered === idx ? 'border-orange-400 scale-110 shadow-[0_0_20px_rgba(251,133,0,0.3)]' : 'border-white/10'}`}>
                      <span className="text-xl font-black text-white">{coef}</span>
                      <span className="text-xs font-black text-orange-400/80 tracking-widest">{p.formula}</span>
                   </div>
                   <div className="mt-2 h-1 w-0 group-hover:w-full bg-orange-400 transition-all duration-300 rounded-full" />
                </div>
              </Html>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

export default function Fusion3DScene({ balanceo }: { balanceo: any }) {
  const { setCoeficiente, audio } = useSimuladorStore();
  const [pulse, setPulse] = useState(false);
  const [glitch, setGlitch] = useState(false);

  if (!balanceo) return null;
  const { isBalanced, reacciones, reaccionActual, coeficientes, masaReactivos } = balanceo;
  const currentReac = reacciones[reaccionActual] || reacciones[0];
  const theme = THEMES[currentReac.id] || THEMES.default;

  const handleIncrement = (idx: number, delta: number) => {
    const newVal = (coeficientes[idx] || 1) + delta;
    setCoeficiente(idx, newVal);
    setPulse(true);
    setGlitch(true);
    audio?.playClick();
    setTimeout(() => {
      setPulse(false);
      setGlitch(false);
    }, 200);
  };

  return (
    <div className="w-full h-full relative bg-[#010B13]">
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={['#010B13']} />
        
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 2, 22]} fov={35} />
          
          <ambientLight intensity={0.4} />
          <spotLight position={[20, 20, 20]} angle={0.15} penumbra={1} intensity={2} castShadow />
          <pointLight position={[-10, 10, 10]} intensity={100} color={isBalanced ? "#00ffcc" : theme.color} />
          
          <PlasmaCore isBalanced={isBalanced} pulse={pulse} masaTotal={masaReactivos} theme={theme} />
          <Molecules 
            reactivos={currentReac.reactivos} 
            productos={currentReac.productos}
            isBalanced={isBalanced} 
            coeficientes={coeficientes} 
            onIncrement={handleIncrement}
            theme={theme}
          />

          <GridFloor />
          <ContactShadows position={[0, -7.9, 0]} opacity={0.5} scale={40} blur={2} far={15} />
          <Stars radius={100} depth={50} count={isBalanced ? 12000 : 3000} factor={4} saturation={0} fade speed={isBalanced ? 2 : 0.2} />
          
          {/* Enhanced lighting instead of external HDR preset */}
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={50} color="#ffffff" />
          <pointLight position={[-10, -10, -10]} intensity={20} color={theme.color} />

          <OrbitControls 
            enableZoom={true}
            enablePan={false} 
            minPolarAngle={Math.PI / 6} 
            maxPolarAngle={Math.PI / 1.8} 
            minDistance={15}
            maxDistance={40}
          />

          <EffectComposer multisampling={8}>
            <Bloom 
              luminanceThreshold={0.2} 
              mipmapBlur 
              intensity={isBalanced ? 5.0 : 2.5} 
              radius={0.5} 
            />
            <ChromaticAberration offset={new THREE.Vector2(0.0015, 0.0015)} />
            <Vignette offset={0.1} darkness={1.3} />
            <Noise opacity={0.05} />
            {glitch && <Glitch delay={[0, 0]} duration={[0.1, 0.2]} strength={[0.1, 0.3]} />}
          </EffectComposer>
        </Suspense>
      </Canvas>
      
      {/* HUD de Telemetría 3D (Opcional) */}
      <div className="absolute top-8 right-8 flex flex-col items-end gap-2 pointer-events-none">
          <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col">
              <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Masa Reactivos</span>
              <span className="text-xl font-black text-white tabular-nums">{masaReactivos.toFixed(3)} u.m.a</span>
          </div>
          <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl flex flex-col">
              <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Masa Productos</span>
              <span className="text-xl font-black text-white tabular-nums">{balanceo.masaProductos.toFixed(3)} u.m.a</span>
          </div>
      </div>
    </div>
  );
}

