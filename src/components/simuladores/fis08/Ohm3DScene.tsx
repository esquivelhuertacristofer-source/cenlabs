"use client";

import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Box, Cylinder, Sphere, Html, PerspectiveCamera, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  isDarkMode: boolean;
  isSchematic: boolean;
  nivel: number;
  voltaje: number;
  resistencia: number;
  switchOn: boolean;
  ledRoto: boolean;
  bateriaConectada: boolean;
  resistenciaConectada: boolean;
  ledConectado: boolean;
  onToggleConexion: (component: 'bateria' | 'resistencia' | 'led') => void;
  onChangeResistencia: (val: number) => void;
}

// ── CONSTANTES COLOR RESISTENCIA ──
const COLOR_CODES = [
  { val: 0, color: '#000000' }, { val: 1, color: '#92400e' },
  { val: 2, color: '#ef4444' }, { val: 3, color: '#f97316' },
  { val: 4, color: '#facc15' }, { val: 5, color: '#22c55e' },
  { val: 6, color: '#3b82f6' }, { val: 7, color: '#a855f7' },
  { val: 8, color: '#64748b' }, { val: 9, color: '#ffffff' }
];

const getResistorBands = (val: number) => {
  const s = Math.floor(val).toString();
  const digit1 = parseInt(s[0]) || 0;
  const digit2 = s.length > 1 ? parseInt(s[1]) : 0;
  const multiplier = Math.max(0, s.length - (s.length > 1 ? 2 : 1));
  
  return [
    COLOR_CODES[digit1]?.color || '#000',
    COLOR_CODES[digit2]?.color || '#000',
    COLOR_CODES[multiplier]?.color || '#000'
  ];
};

// ── SYMBOLS (SVG FOR SCHEMATIC MODE) ──
const SchematicSymbol = ({ type, color }: { type: string, color: string }) => {
  const symbols: any = {
    battery: <svg viewBox="0 0 100 100" className="w-12 h-12" style={{ stroke: color, fill: 'none', strokeWidth: 4 }}>
      <path d="M 20 40 L 80 40 M 35 60 L 65 60 M 50 20 L 50 40 M 50 60 L 50 80" />
    </svg>,
    resistor: <svg viewBox="0 0 100 100" className="w-12 h-12" style={{ stroke: color, fill: 'none', strokeWidth: 4 }}>
      <path d="M 10 50 L 30 50 L 35 30 L 45 70 L 55 30 L 65 70 L 70 50 L 90 50" />
    </svg>,
    led: <svg viewBox="0 0 100 100" className="w-12 h-12" style={{ stroke: color, fill: 'none', strokeWidth: 4 }}>
      <circle cx="50" cy="50" r="30" />
      <path d="M 40 40 L 60 60 M 60 40 L 40 60" />
      <path d="M 75 25 L 85 15 M 85 15 L 80 15 M 85 15 L 85 20" />
      <path d="M 65 15 L 75 5 M 75 5 L 70 5 M 75 5 L 75 10" />
    </svg>,
    switch: <svg viewBox="0 0 100 100" className="w-12 h-12" style={{ stroke: color, fill: 'none', strokeWidth: 4 }}>
      <circle cx="30" cy="70" r="4" />
      <circle cx="70" cy="70" r="4" />
      <path d="M 30 70 L 65 40" />
    </svg>
  };
  return symbols[type];
};

// ── COMPONENTES ──

function Bateria({ voltaje, conectada, onClick, isDarkMode, isSchematic }: any) {
  const pos: [number, number, number] = conectada ? [-5, 0.5, 0] : [-6, 0.5, 4];
  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {!isSchematic ? (
        <group>
          <Box args={[3, 2, 2]} castShadow>
            <meshStandardMaterial color={conectada ? (isDarkMode ? "#0f172a" : "#1e293b") : "#334155"} metalness={0.8} roughness={0.2} />
          </Box>
          <Cylinder args={[0.3, 0.3, 0.5]} position={[-0.8, 1.25, 0]} castShadow><meshStandardMaterial color="#ef4444" /></Cylinder>
          <Cylinder args={[0.3, 0.3, 0.5]} position={[0.8, 1.25, 0]} castShadow><meshStandardMaterial color="#10b981" /></Cylinder>
        </group>
      ) : (
        <Box args={[3, 2, 2]}><meshBasicMaterial color="#60a5fa" transparent opacity={0.3} wireframe /></Box>
      )}
      <Html position={[0, 1.8, 0]} center pointerEvents="none">
         <div className={`flex flex-col items-center gap-2 transition-all ${isSchematic ? 'scale-125' : ''}`}>
           {isSchematic && <SchematicSymbol type="battery" color="#60a5fa" />}
           <div className={`px-2 py-1 rounded text-[8px] font-black border ${conectada ? 'bg-blue-600/80 text-white border-white/20' : 'bg-slate-800/40 text-slate-400 border-slate-500'}`}>
             {conectada ? `FUENTE: ${voltaje}V` : 'CLIC PARA CONECTAR'}
           </div>
         </div>
      </Html>
    </group>
  );
}

function Potentiometer({ value, onChange, isDarkMode, isSchematic }: any) {
  const rotation = (value / 1000) * Math.PI * 1.5;
  const pos: [number, number, number] = [0, 0.5, 0];

  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onChange((value + 200) % 2000 || 100); }}>
       {!isSchematic ? (
         <group>
            <Box args={[2, 1, 2]} castShadow><meshStandardMaterial color={isDarkMode ? "#1e293b" : "#94a3b8"} /></Box>
            <Cylinder args={[0.6, 0.6, 0.5]} position={[0, 0.75, 0]} rotation={[0, rotation, 0]} castShadow>
               <meshStandardMaterial color="#fbbf24" />
               <Box args={[0.1, 0.2, 0.6]} position={[0, 0.1, 0.3]}><meshStandardMaterial color="#000" /></Box>
            </Cylinder>
         </group>
       ) : (
         <Box args={[2, 1, 2]}><meshBasicMaterial color="#fbbf24" transparent opacity={0.3} wireframe /></Box>
       )}
       <Html position={[0, 1.5, 0]} center>
         <div className="flex flex-col items-center gap-1">
           <div className={`px-2 py-1 rounded text-[7px] font-black cursor-pointer pointer-events-auto transition-all ${isSchematic ? 'bg-yellow-500 text-black scale-110 shadow-[0_0_20px_rgba(251,191,36,0.5)]' : 'bg-black/60 text-white/50 border border-white/10'}`}>
             AJUSTAR (CLIC)
           </div>
         </div>
       </Html>
    </group>
  );
}

function Resistencia({ resistencia, corrienteMA, conectada, onClick, isDarkMode, isSchematic }: any) {
  const bands = useMemo(() => getResistorBands(resistencia), [resistencia]);
  const pos: [number, number, number] = conectada ? [0, 0.5, 3] : [3, 0.5, 4.5];
  const heatColor = corrienteMA > 25 ? "#ef4444" : (isDarkMode ? "#e2e8f0" : "#cbd5e1");

  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {!isSchematic ? (
        <group>
          <Cylinder args={[0.05, 0.05, 4]} rotation={[0, 0, Math.PI / 2]} castShadow><meshStandardMaterial color="#94a3b8" /></Cylinder>
          <Cylinder args={[0.3, 0.3, 2]} rotation={[0, 0, Math.PI / 2]} castShadow>
             <meshStandardMaterial color={heatColor} emissive={corrienteMA > 25 ? "#ff0000" : "#000"} emissiveIntensity={corrienteMA > 25 ? 0.5 : 0} />
          </Cylinder>
          {bands.map((color, idx) => (
            <Cylinder key={idx} args={[0.31, 0.31, 0.2]} rotation={[0, 0, Math.PI / 2]} position={[-0.6 + (idx * 0.4), 0, 0]}><meshStandardMaterial color={color} /></Cylinder>
          ))}
        </group>
      ) : (
        <Cylinder args={[0.3, 0.3, 2]} rotation={[0, 0, Math.PI / 2]}><meshBasicMaterial color="#60a5fa" wireframe /></Cylinder>
      )}
      <Html position={[0, 1.2, 0]} center pointerEvents="none">
         <div className="flex flex-col items-center gap-2">
            {isSchematic && <SchematicSymbol type="resistor" color="#60a5fa" />}
            <div className={`px-2 py-1 rounded text-[8px] font-mono border ${conectada ? 'bg-black/80 text-white border-white/20' : 'bg-slate-800/40 text-slate-400 border-slate-500'}`}>
              {conectada ? `${resistencia} Ω` : 'RESISTOR'}
            </div>
         </div>
      </Html>
    </group>
  );
}

function Led({ switchOn, ledRoto, corrienteMA, conectada, onClick, isDarkMode, isSchematic }: any) {
  const isGlowing = conectada && switchOn && !ledRoto && corrienteMA > 0;
  const intensity = Math.min((corrienteMA / 20) * 12, 25); 
  const pos: [number, number, number] = conectada ? [5, 1, 0] : [7, 1, -2];
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (isGlowing && meshRef.current) meshRef.current.position.x = Math.sin(state.clock.elapsedTime * 50) * (corrienteMA > 30 ? 0.02 : 0);
  });

  return (
    <group position={pos} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {!isSchematic ? (
        <Sphere args={[0.8, 32, 32]} ref={meshRef}>
           <meshStandardMaterial 
              color={ledRoto ? '#334155' : (isGlowing ? '#4ade80' : '#166534')} 
              emissive={isGlowing ? '#4ade80' : '#000000'}
              emissiveIntensity={isGlowing ? intensity : 0}
              transparent opacity={0.9} 
           />
        </Sphere>
      ) : (
        <Sphere args={[0.8, 16, 16]}><meshBasicMaterial color="#4ade80" wireframe /></Sphere>
      )}
      {isGlowing && <Sparkles count={80} scale={3} size={6} speed={1.5} color="#4ade80" />}
      <Html position={[0, 1.8, 0]} center pointerEvents="none">
         <div className="flex flex-col items-center gap-2">
            {isSchematic && <SchematicSymbol type="led" color="#4ade80" />}
            <div className={`px-2 py-1 rounded text-[8px] font-black border ${ledRoto ? 'bg-red-500/20 text-red-500 border-red-500' : 'bg-emerald-500/20 text-emerald-500 border-emerald-500'}`}>
               {ledRoto ? 'LED_OFF' : 'DIODO_LED'}
            </div>
         </div>
      </Html>
    </group>
  );
}

function Wires({ nivel, switchOn, ledRoto, corrienteMA, bateriaConectada, resistenciaConectada, ledConectado, isDarkMode, isSchematic }: any) {
  const curves = useMemo(() => {
    const list = [];
    if (nivel === 1) list.push(new THREE.CatmullRomCurve3([new THREE.Vector3(-4.2, 1.25, 0), new THREE.Vector3(-4.2, 0.5, 3), new THREE.Vector3(5, 0.5, 3), new THREE.Vector3(5, -0.75, -0.3)]));
    else {
      list.push(new THREE.CatmullRomCurve3([new THREE.Vector3(-4.2, 1.25, 0), new THREE.Vector3(-4.2, 0.5, 3), new THREE.Vector3(-2, 0.5, 3)]));
      list.push(new THREE.CatmullRomCurve3([new THREE.Vector3(2, 0.5, 3), new THREE.Vector3(5, 0.5, 3), new THREE.Vector3(5, -0.75, -0.3)]));
    }
    list.push(new THREE.CatmullRomCurve3([new THREE.Vector3(5, -0.6, 0.3), new THREE.Vector3(5, 0.5, -3), new THREE.Vector3(0, 0.5, -3)]));
    list.push(new THREE.CatmullRomCurve3([new THREE.Vector3(-1, 0.5, -3), new THREE.Vector3(-5.8, 0.5, -3), new THREE.Vector3(-5.8, 1.25, 0)]));
    return list;
  }, [nivel]);

  const isFlowing = switchOn && !ledRoto && bateriaConectada && resistenciaConectada && ledConectado;

  return (
    <group>
      {curves.map((curve, idx) => (
        <mesh key={idx}>
          <tubeGeometry args={[curve, 40, isSchematic ? 0.03 : 0.08, 8, false]} />
          <meshStandardMaterial 
            color={isFlowing ? (isSchematic ? "#00ffff" : "#facc15") : (isDarkMode ? "#334155" : "#cbd5e1")} 
            emissive={isFlowing ? "#00ffff" : "#000"} emissiveIntensity={isFlowing ? 3 : 0}
          />
        </mesh>
      ))}
      <group position={[-0.5, 0.5, -3]}>
         <Box args={[1.5, 0.15, 0.4]} position={[0.5, switchOn ? 0 : 0.4, 0]} rotation={[0, 0, switchOn ? 0 : -Math.PI/4]}>
            <meshStandardMaterial color="#ef4444" />
         </Box>
         {isSchematic && <Html position={[0.5, 1, 0]} center><SchematicSymbol type="switch" color="#60a5fa" /></Html>}
      </group>
    </group>
  );
}

function Base({ isDarkMode, isSchematic }: { isDarkMode: boolean, isSchematic: boolean }) {
  return (
    <group>
      <Box args={[20, 0.5, 14]} position={[0, -0.25, 0]}>
        <meshStandardMaterial 
          color={isSchematic ? "#001a33" : (isDarkMode ? "#020617" : "#f1f5f9")} 
          roughness={0.5} 
          metalness={isDarkMode ? 0.8 : 0.1} 
        />
      </Box>
      <gridHelper args={[20, 20, isSchematic ? "#00ccff" : "#3b82f6", isSchematic ? "#003366" : "#cbd5e1"]} position={[0, 0.01, 0]} />
    </group>
  );
}

function Multimetro({ valor, label, isDarkMode }: any) {
  return (
    <group position={[0, 0.5, -5]}>
      <Box args={[2.8, 1.2, 3.8]} castShadow>
        <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.2} />
      </Box>
      <Box args={[2.2, 0.1, 1.4]} position={[0, 0.6, -0.6]}>
        <meshStandardMaterial color="#1e293b" />
      </Box>
      <Html position={[0, 0.7, -0.6]} rotation={[-Math.PI/2, 0, 0]} transform pointerEvents="none">
        <div className="bg-[#a3b18a] w-[120px] h-[60px] flex flex-col items-center justify-center font-mono border-2 border-black/40 shadow-inner">
           <div className="text-[10px] text-black/40 uppercase font-black">{label}</div>
           <div className="text-2xl text-black font-black leading-none">{valor}</div>
        </div>
      </Html>
      <Cylinder args={[0.5, 0.5, 0.3]} position={[0, 0.6, 1]}>
        <meshStandardMaterial color="#0f172a" />
      </Cylinder>
    </group>
  );
}

export default function Ohm3DScene({ 
  isDarkMode, isSchematic, nivel, voltaje, resistencia, switchOn, ledRoto, 
  bateriaConectada, resistenciaConectada, ledConectado, onToggleConexion, onChangeResistencia 
}: Props) {
  const isFlowing = switchOn && !ledRoto && bateriaConectada && (nivel === 1 ? true : resistenciaConectada) && ledConectado;
  const corrienteMA = isFlowing ? (voltaje / resistencia) * 1000 : 0;

  return (
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: isDarkMode ? 1.5 : 2.2 }}>
        <PerspectiveCamera makeDefault position={[12, 12, 12]} fov={35} />
        <ambientLight intensity={isSchematic ? 1.5 : (isDarkMode ? 0.8 : 1.8)} />
        {!isSchematic && <spotLight position={[15, 25, 10]} intensity={isDarkMode ? 4 : 10} castShadow />}
        <directionalLight position={[-10, 15, -10]} intensity={isDarkMode ? 1.5 : 2.5} />
        
        <Base isDarkMode={isDarkMode} isSchematic={isSchematic} />
        <Bateria voltaje={voltaje} conectada={bateriaConectada} onClick={() => onToggleConexion('bateria')} isDarkMode={isDarkMode} isSchematic={isSchematic} />
        {nivel >= 2 && <Resistencia resistencia={resistencia} corrienteMA={corrienteMA} conectada={resistenciaConectada} onClick={() => onToggleConexion('resistencia')} isDarkMode={isDarkMode} isSchematic={isSchematic} />}
        {nivel === 3 && <Potentiometer value={resistencia} onChange={onChangeResistencia} isDarkMode={isDarkMode} isSchematic={isSchematic} />}
        <Led switchOn={switchOn} ledRoto={ledRoto} corrienteMA={corrienteMA} conectada={ledConectado} onClick={() => onToggleConexion('led')} isDarkMode={isDarkMode} isSchematic={isSchematic} />
        <Wires nivel={nivel} switchOn={switchOn} ledRoto={ledRoto} corrienteMA={corrienteMA} bateriaConectada={bateriaConectada} resistenciaConectada={nivel === 1 ? true : resistenciaConectada} ledConectado={ledConectado} isDarkMode={isDarkMode} isSchematic={isSchematic} />
        {nivel >= 2 && <Multimetro valor={isFlowing ? `${corrienteMA.toFixed(1)}mA` : "0.00mA"} label="AMPERIMETER" isDarkMode={isDarkMode} />}
        <OrbitControls enablePan={true} maxPolarAngle={Math.PI / 2.1} minPolarAngle={Math.PI / 10} minDistance={5} maxDistance={40} />
      </Canvas>
  );
}
