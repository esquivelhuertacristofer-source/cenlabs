"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Zap, Info, AlertTriangle, CheckCircle2, ShieldCheck, Microscope } from 'lucide-react';

export default function PilotoConstruccionAtomica({ isWorktableDark, isProfesor }: { isWorktableDark: boolean, isProfesor: boolean }) {
  const { particulas, setParticulas, validarEstructura, resetPractica } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  
  // Defensive defaults
  const { protones = 0, neutrones = 0, electrones = 0, isStable = true, message = "" } = particulas || {};

  useEffect(() => {
    setMounted(true);
  }, []);

  const masaAtomica = protones + neutrones;
  const cargaNeta = protones - electrones;

  // Calculamos el elemento actual basado en Z (protones)
  const elementData = useMemo(() => {
    const list: Record<number, { sym: string, name: string, color: string }> = {
      1: { sym: "H", name: "Hidrógeno", color: "#FB8500" },
      2: { sym: "He", name: "Helio", color: "#FFB703" },
      6: { sym: "C", name: "Carbono", color: "#219EBC" },
      7: { sym: "N", name: "Nitrógeno", color: "#8ECAE6" },
      8: { sym: "O", name: "Oxígeno", color: "#023047" },
    };
    return list[protones] || { sym: "?", name: "Desconocido", color: "#64748B" };
  }, [protones]);

  if (!mounted) return <div className="p-20 text-center font-black animate-pulse text-[#219EBC]">INICIALIZANDO NÚCLEO...</div>;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 select-none perspective-1000 overflow-hidden">
      
      {/* BACKGROUND SHADER GRID */}
      <div className={`absolute inset-0 -z-10 opacity-30 transition-colors duration-1000 ${isWorktableDark ? 'bg-[#060B14]' : 'bg-slate-50'}`}>
         <div className="absolute inset-0 bg-[radial-gradient(#219EBC_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* TITULO DINÁMICO (PREMIUM OVERLAY) */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-12 left-12 z-40"
      >
        <div className="flex items-center gap-4">
           <div className="w-20 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border-2 border-[#219EBC]/30 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#219EBC]/5 group-hover:bg-[#219EBC]/10 transition-colors" />
              <span className="text-[10px] font-black text-[#219EBC] absolute top-2">Z={protones}</span>
              <span className="text-3xl font-black text-[#023047] dark:text-white mt-1">{elementData.sym}</span>
              <span className="text-[9px] font-bold text-slate-400 absolute bottom-2">{masaAtomica} u</span>
           </div>
           <div className="flex flex-col">
              <h2 className="text-2xl font-black text-[#023047] dark:text-white uppercase tracking-tighter">{elementData.name}</h2>
              <div className="flex items-center gap-2">
                 <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${cargaNeta === 0 ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-[#FB8500]/10 text-[#FB8500] border border-[#FB8500]/20'}`}>
                    {cargaNeta === 0 ? 'Atomo Neutro' : `Ion (${cargaNeta > 0 ? '+' : ''}${cargaNeta})`}
                 </div>
                 {isStable && <span className="flex items-center gap-1 text-[10px] font-bold text-green-500"><ShieldCheck size={12}/> Estable</span>}
              </div>
           </div>
        </div>
      </motion.div>

      {/* STAGE CENTRAL: EL ÁTOMO (GOLD STANDARD VFX) */}
      <div className="relative w-[600px] h-[600px] flex items-center justify-center">
         
         {/* ORBITAS CON SOMBREADO */}
         <div className="absolute inset-0 flex items-center justify-center -z-10">
            {/* Capa K */}
            <motion.div 
               animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
               className="absolute w-[220px] h-[220px] rounded-full border-[1.5px] border-dashed border-slate-300 dark:border-slate-700/50 flex items-center justify-center"
            >
               {Array.from({ length: Math.min(electrones, 2) }).map((_, i) => (
                  <motion.div 
                    key={`e-k-${i}`} 
                    className="absolute w-4 h-4 rounded-full bg-[#FFD60A] shadow-[0_0_15px_#FFD60A] border border-white/50"
                    style={{ transform: `rotate(${(i * 180)}deg) translate(110px)` }}
                  />
               ))}
            </motion.div>
            {/* Capa L */}
            <motion.div 
               animate={{ rotate: -360 }} transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
               className="absolute w-[400px] h-[400px] rounded-full border-[1.5px] border-dashed border-slate-300 dark:border-slate-700/50"
            >
                {Array.from({ length: Math.max(0, electrones - 2) }).map((_, i) => (
                  <motion.div 
                    key={`e-l-${i}`} 
                    className="absolute w-4 h-4 rounded-full bg-[#FFD60A] shadow-[0_0_20px_#FFD60A] border border-white/50"
                    style={{ transform: `rotate(${(i * 45)}deg) translate(200px)` }}
                  />
               ))}
            </motion.div>
         </div>

         {/* NÚCLEO PULSANTE (SOFT CLAYMORPHISM) */}
         <motion.div 
            animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-40 h-40 rounded-full flex flex-wrap items-center justify-center gap-1 p-4 overflow-hidden"
         >
            {/* Sombras del Núcleo */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 z-10 pointer-events-none" />
            <div className={`absolute inset-0 blur-[40px] opacity-20 -z-10 ${cargaNeta === 0 ? 'bg-green-400' : 'bg-[#FB8500]'}`} />

            {/* Render de Partículas (Protones / Neutrones) */}
            <AnimatePresence>
               {Array.from({ length: protones }).map((_, i) => (
                  <motion.div 
                    key={`p-${i}`} 
                    initial={{ scale: 0, x: 20 }} animate={{ scale: 1, x: 0 }} exit={{ scale: 0 }}
                    whileHover={{ scale: 1.2, zIndex: 50 }}
                    className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg border border-red-300 flex items-center justify-center text-[8px] font-black text-white"
                  >+</motion.div>
               ))}
               {Array.from({ length: neutrones }).map((_, i) => (
                  <motion.div 
                    key={`n-${i}`} 
                    initial={{ scale: 0, x: -20 }} animate={{ scale: 1, x: 0 }} exit={{ scale: 0 }}
                    whileHover={{ scale: 1.2, zIndex: 50 }}
                    className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg border border-blue-300"
                  />
               ))}
            </AnimatePresence>
         </motion.div>
      </div>

      {/* El Pilot ahora solo se encarga del escenario visual del átomo */}

      {/* TOOLTIPS / MENSAJES (PREMIUM INTEGRATION) */}
      <AnimatePresence>
         {message && (
            <motion.div 
               initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
               className="absolute top-40 right-12 max-w-[280px] p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-2xl z-50 pointer-events-none"
            >
               <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${isStable ? 'text-green-500' : 'text-[#FB8500]'}`}>
                     {isStable ? <Microscope size={24}/> : <AlertTriangle size={24}/>}
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Detección de IA</span>
                     <p className="text-xs font-bold text-[#023047] dark:text-slate-200 leading-relaxed">{message}</p>
                  </div>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
