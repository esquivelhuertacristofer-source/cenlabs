"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Zap, Info, AlertTriangle, CheckCircle2, 
  ShieldCheck, Atom, Plus, Minus, Power,
  Cpu, Activity, Target
} from 'lucide-react';
import Image from 'next/image';

export default function PilotoConstruccionAtomica({ isWorktableDark = true, isProfesor = false }: { isWorktableDark?: boolean, isProfesor?: boolean }) {
  const { particulas, setParticulas, validarEstructura, registrarHallazgo, resetPractica } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  
  // Imágnes externas (Rutas configuradas en el plan)
  const paths = {
    bg: '/assets/art/fondos/atom_bg.png',
    proton: '/assets/art/simuladores/proton.png',
    neutron: '/assets/art/simuladores/neutron.png',
    electron: '/assets/art/simuladores/electron.png'
  };

  const [assetErrors, setAssetErrors] = useState<Record<string, boolean>>({});
  const handleAssetError = (key: string) => setAssetErrors(prev => ({ ...prev, [key]: true }));

  useEffect(() => {
    setMounted(true);
  }, []);

  const { protones = 0, neutrones = 0, electrones = 0, isStable = true, message = "" } = particulas || {};
  const masaAtomica = protones + neutrones;
  const cargaNeta = protones - electrones;

  // Datos de los primeros 10 elementos para feedback dinámico
  const currentElement = useMemo(() => {
    const list: Record<number, { sym: string, name: string, color: string }> = {
      0: { sym: "Vacío", name: "Espacio Vacío", color: "#64748B" },
      1: { sym: "H", name: "Hidrógeno", color: "#FB8500" },
      2: { sym: "He", name: "Helio", color: "#FFB703" },
      3: { sym: "Li", name: "Litio", color: "#E63946" },
      4: { sym: "Be", name: "Berilio", color: "#F1FAEE" },
      5: { sym: "B", name: "Boro", color: "#A8DADC" },
      6: { sym: "C", name: "Carbono", color: "#457B9D" },
      7: { sym: "N", name: "Nitrógeno", color: "#1D3557" },
      8: { sym: "O", name: "Oxígeno", color: "#219EBC" },
      9: { sym: "F", name: "Flúor", color: "#8ECAE6" },
      10: { sym: "Ne", name: "Neón", color: "#FFD60A" },
    };
    return list[protones] || { sym: "?", name: "Elemento Pesado", color: "#64748B" };
  }, [protones]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden font-sans">
      
      {/* FONTO ARTÍSTICO O FALLBACK */}
      <div className="absolute inset-0 z-0">
        {!assetErrors.bg ? (
          <Image 
            src={paths.bg} 
            alt="Lab Background" 
            fill 
            className="object-cover opacity-60"
            onError={() => handleAssetError('bg')}
          />
        ) : (
          <div className="absolute inset-0 bg-[#0A1121]">
            <div className="absolute inset-0 bg-[radial-gradient(#219EBC_1px,transparent_1px)] [background-size:40px_40px] opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#023047]/20 to-[#0A1121]" />
          </div>
        )}
      </div>

      {/* MONITOR SUPERIOR (HUD) */}
      <div className="absolute top-12 left-12 right-12 flex justify-between items-start z-20 pointer-events-none">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex gap-4 pointer-events-auto">
           <div className="w-24 h-24 bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-white/10 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
              <span className="text-[10px] font-black text-[#219EBC] absolute top-2 opacity-50 uppercase tracking-widest">Z-Index</span>
              <span className="text-4xl font-black text-white mt-1">{protones}</span>
              <div className="absolute bottom-0 inset-x-0 h-1 bg-[#219EBC]/30" style={{ width: `${(protones/10)*100}%` }} />
           </div>
           <div className="flex flex-col justify-center">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{currentElement.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                 <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cargaNeta === 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`}>
                    {cargaNeta === 0 ? 'ESTADO NEUTRO' : `IÓN (${cargaNeta > 0 ? '+' : ''}${cargaNeta})`}
                 </div>
                 {protones > 0 && (
                   <div className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-white/50 tracking-widest uppercase">
                     Masa: {masaAtomica}u
                   </div>
                 )}
              </div>
           </div>
        </motion.div>

        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="pointer-events-auto">
           <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full animate-pulse ${isStable ? 'bg-green-500' : 'bg-red-500'}`} />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Estabilidad del Núcleo</span>
              </div>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed max-w-[180px]">
                {message || "Monitorizando colisiones subatómicas..."}
              </p>
           </div>
        </motion.div>
      </div>

      {/* ESCENA DEL ÁTOMO (Responsiva) */}
      <div className="relative w-full max-w-[650px] aspect-square flex items-center justify-center z-10 scale-90 md:scale-100 lg:scale-110 transition-transform">
        
        {/* Órbitas */}
        <div className="absolute inset-0 flex items-center justify-center">
           {[220, 380, 520].map((size, idx) => {
              const capMap = [2, 8, 10]; // electrones max por capa
              const threshold = idx === 0 ? 0 : capMap.slice(0, idx).reduce((a, b) => a + b, 0);
              const countInThisShell = Math.max(0, Math.min(capMap[idx], electrones - threshold));
              
              if (size === 520 && protones < 11) return null; // Solo mostrar shell 3 si hay suficientes electrones

              return (
                <div key={size} className="absolute flex items-center justify-center">
                  <motion.div 
                    animate={{ rotate: idx % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 20 + idx * 10, repeat: Infinity, ease: "linear" }}
                    className="relative rounded-full border border-white/10 border-dashed"
                    style={{ width: size, height: size }}
                  >
                    {Array.from({ length: countInThisShell }).map((_, i) => (
                      <div 
                        key={i} 
                        className="absolute top-1/2 left-1/2"
                        style={{ transform: `rotate(${(i * (360/countInThisShell))}deg) translate(${size/2}px)` }}
                      >
                         <ParticleAsset 
                            type="electron" 
                            size={32} 
                            path={paths.electron} 
                            error={assetErrors.electron} 
                            onError={() => handleAssetError('electron')}
                         />
                      </div>
                    ))}
                  </motion.div>
                </div>
              );
           })}
        </div>

        {/* NÚCLEO */}
        <motion.div 
          animate={{ scale: [1, 1.02, 1] }} 
          transition={{ duration: 3, repeat: Infinity }}
          className="relative w-32 h-32 flex items-center justify-center"
        >
          {/* Glow del núcleo */}
          <div className="absolute inset-0 bg-[#219EBC] blur-[80px] opacity-20 rounded-full" />
          
          <div className="relative z-10 w-full h-full flex items-center justify-center">
             <AnimatePresence>
                {[...Array(protones)].map((_, i) => {
                  const angle = i * 137.5; // Ángulo áureo para distribución natural
                  const radius = 8 + Math.sqrt(i) * 12;
                  return (
                    <motion.div 
                      key={`p-${i}`} 
                      initial={{ scale: 0, opacity: 0 }} 
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                        x: Math.cos(angle * Math.PI / 180) * radius,
                        y: Math.sin(angle * Math.PI / 180) * radius,
                      }} 
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute"
                    >
                      <ParticleAsset 
                         type="proton" 
                         size={44} 
                         path={paths.proton} 
                         error={assetErrors.proton} 
                         onError={() => handleAssetError('proton')}
                      />
                    </motion.div>
                  );
                })}
                {[...Array(neutrones)].map((_, i) => {
                  const angle = (i + protones) * 137.5;
                  const radius = 8 + Math.sqrt(i + protones) * 12;
                  return (
                    <motion.div 
                      key={`n-${i}`} 
                      initial={{ scale: 0, opacity: 0 }} 
                      animate={{ 
                        scale: 1, 
                        opacity: 1,
                        x: Math.cos(angle * Math.PI / 180) * radius,
                        y: Math.sin(angle * Math.PI / 180) * radius,
                      }} 
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute"
                    >
                      <ParticleAsset 
                         type="neutron" 
                         size={44} 
                         path={paths.neutron} 
                         error={assetErrors.neutron} 
                         onError={() => handleAssetError('neutron')}
                      />
                    </motion.div>
                  );
                })}
             </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* PANEL DE CONTROL FÍSICO (PLATINUM DESIGN - Responsivo) */}
      <div className="absolute bottom-6 md:bottom-10 inset-x-4 md:inset-x-10 h-auto min-h-[100px] md:h-32 bg-white/5 backdrop-blur-3xl rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.5)] flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start px-6 md:px-10 py-4 md:py-0 gap-6 md:gap-10 z-30">
        
        {/* Módulo Protones */}
        <ControlModule 
           label="PROTONES" 
           count={protones} 
           color="bg-red-500" 
           onAdd={() => setParticulas(protones + 1, neutrones, electrones)}
           onSub={() => setParticulas(protones - 1, neutrones, electrones)}
        />

        <div className="w-px h-16 bg-white/10" />

        {/* Módulo Neutrones */}
        <ControlModule 
           label="NEUTRONES" 
           count={neutrones} 
           color="bg-blue-500" 
           onAdd={() => setParticulas(protones, neutrones + 1, electrones)}
           onSub={() => setParticulas(protones, neutrones - 1, electrones)}
        />

        <div className="w-px h-16 bg-white/10" />

        {/* Módulo Electrones */}
        <ControlModule 
           label="ELECTRONES" 
           count={electrones} 
           color="bg-yellow-400" 
           onAdd={() => setParticulas(protones, neutrones, electrones + 1)}
           onSub={() => setParticulas(protones, neutrones, electrones - 1)}
        />

        <div className="flex-1" />

        {/* Master Action */}
        <div className="flex items-center gap-4">
           <button 
             onClick={() => resetPractica()}
             className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
             title="Reiniciar Reactor"
           >
              <Power size={24} />
           </button>
           <button 
             onClick={() => registrarHallazgo()}
             className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-[#219EBC] hover:bg-[#219EBC]/10 transition-all"
             title="Registrar en Bitácora"
           >
              <Activity size={24} />
           </button>
           <button 
             onClick={() => validarEstructura()}
             className="h-16 px-10 rounded-2xl bg-[#219EBC] hover:bg-[#8ECAE6] text-white flex items-center gap-3 shadow-xl shadow-[#219EBC]/20 transition-all group"
           >
              <Target size={20} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[12px] font-black uppercase tracking-widest">Validar Estructura</span>
           </button>
        </div>
      </div>

    </div>
  );
}

function ControlModule({ label, count, color, onAdd, onSub }: any) {
  return (
    <div className="flex items-center gap-6">
       <div className="flex flex-col">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{label}</span>
          <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-white leading-none">{count}</span>
             <div className={`w-1.5 h-1.5 rounded-full ${count > 0 ? color : 'bg-white/10'}`} />
          </div>
       </div>
       <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
          <button onClick={onSub} className="w-10 h-10 flex items-center justify-center hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><Minus size={16} /></button>
          <button onClick={onAdd} className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-white shadow-xl transition-all"><Plus size={16} /></button>
       </div>
    </div>
  );
}

function ParticleAsset({ type, size, path, error, onError }: any) {
  if (error) {
    const colors: any = { proton: 'bg-red-500', neutron: 'bg-blue-500', electron: 'bg-yellow-400' };
    return <div className={`rounded-full ${colors[type]} shadow-xl border border-white/20`} style={{ width: size, height: size }}>
       {type === 'proton' && <span className="flex h-full w-full items-center justify-center text-[10px] font-black text-white">+</span>}
    </div>;
  }
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image 
        src={path} 
        alt={type} 
        width={size} 
        height={size} 
        className="object-contain"
        onError={onError}
      />
    </div>
  );
}
