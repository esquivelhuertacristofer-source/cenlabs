"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { 
  Zap, Cloud, AlertTriangle, CheckCircle2, 
  ArrowRight, Factory, Droplets, Info 
} from 'lucide-react';

export default function PilotoReactivoLimitante({ isWorktableDark = true, isProfesor = false }: { isWorktableDark?: boolean, isProfesor?: boolean }) {
  const { limitante, generarSemillaP4, resetP4 } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const [displayN2, setDisplayN2] = useState(limitante.mN2);
  const [displayH2, setDisplayH2] = useState(limitante.mH2);
  const controls = useAnimation();

  useEffect(() => {
    setMounted(true);
    generarSemillaP4();
    return () => resetP4();
  }, [generarSemillaP4, resetP4]);

  // Animación de los números (Odómetro)
  useEffect(() => {
    if (limitante.isRunning && limitante.status === 'success') {
      const duration = 2.5;
      const startN2 = limitante.mN2;
      const startH2 = limitante.mH2;
      
      const targetN2 = limitante.limitanteReal === 'N2' ? 0 : limitante.excesoReal;
      const targetH2 = limitante.limitanteReal === 'H2' ? 0 : limitante.excesoReal;

      audio.playPop();

      let startTime: number;
      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / (duration * 1000), 1);
        
        setDisplayN2(parseFloat((startN2 - (startN2 - targetN2) * progress).toFixed(1)));
        setDisplayH2(parseFloat((startH2 - (startH2 - targetH2) * progress).toFixed(1)));
        
        if (progress < 1) requestAnimationFrame(animate);
        else audio.playSuccess();
      };
      requestAnimationFrame(animate);
    }
  }, [limitante.isRunning, limitante.status, limitante.mN2, limitante.mH2, limitante.limitanteReal, limitante.excesoReal]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col items-center justify-center p-8">
      
      {/* HUD Superior */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
         <div className="px-6 py-3 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl flex items-center gap-4 shadow-2xl">
            <div className="text-right">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Proceso de Haber</span>
               <h4 className="text-xs font-black text-white italic">N₂ + 3H₂ → 2NH₃</h4>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Reactor Online</span>
            </div>
         </div>
      </div>

      {/* ESCENARIO INDUSTRIAL */}
      <div className="relative w-full max-w-5xl h-[500px] mt-10">
         
         {/* TUBOS SVG */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 1000 500">
            {/* Tubo N2 */}
            <path 
               d="M 250 150 L 250 250 L 500 250" 
               fill="none" 
               stroke="#1e293b" 
               strokeWidth="12" 
               strokeLinecap="round" 
            />
            <path 
               d="M 250 150 L 250 250 L 500 250" 
               fill="none" 
               stroke="#3b82f6" 
               strokeWidth="2" 
               strokeDasharray="4 12" 
               className={limitante.isRunning && limitante.status === 'success' ? 'animate-[dash_1s_linear_infinite]' : 'opacity-0'}
            />

            {/* Tubo H2 */}
            <path 
               d="M 750 150 L 750 250 L 500 250" 
               fill="none" 
               stroke="#1e293b" 
               strokeWidth="12" 
               strokeLinecap="round" 
            />
            <path 
               d="M 750 150 L 750 250 L 500 250" 
               fill="none" 
               stroke="#fbbf24" 
               strokeWidth="2" 
               strokeDasharray="4 12" 
               className={limitante.isRunning && limitante.status === 'success' ? 'animate-[dash_1s_linear_infinite]' : 'opacity-0'}
            />
            
            <style>{`
               @keyframes dash {
                  to { stroke-dashoffset: -16; }
               }
            `}</style>
         </svg>

         {/* TANQUES */}
         <div className="absolute inset-0 flex justify-between items-start pt-10">
            
            {/* Tanque N2 */}
            <motion.div 
               animate={limitante.status === 'error' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
               className="relative flex flex-col items-center gap-4 ml-20"
            >
               <div className="w-32 h-44 bg-gradient-to-b from-slate-700 to-slate-900 rounded-[2rem] border-x-4 border-slate-600 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800">
                     <span className="text-[10px] font-black text-blue-400">N₂</span>
                  </div>
                  {/* Líquido/Indicador */}
                  <motion.div 
                     initial={{ height: '70%' }}
                     animate={{ height: limitante.isRunning && limitante.status === 'success' ? (limitante.limitanteReal === 'N2' ? '0%' : '30%') : '70%' }}
                     className="absolute bottom-0 left-0 right-0 bg-blue-500/20 backdrop-blur-sm border-t border-blue-400/50"
                  />
               </div>
               {/* Display Digital */}
               <div className="bg-black border-2 border-slate-800 rounded-xl px-4 py-2 shadow-inner">
                  <span className="font-mono text-xl font-black text-blue-400 tracking-tighter">
                     {displayN2.toFixed(1)} <span className="text-[10px] text-slate-500 ml-1">g</span>
                  </span>
               </div>
            </motion.div>

            {/* Tanque H2 */}
            <motion.div 
               animate={limitante.status === 'error' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
               className="relative flex flex-col items-center gap-4 mr-20"
            >
               <div className="w-32 h-44 bg-gradient-to-b from-slate-700 to-slate-900 rounded-[2rem] border-x-4 border-slate-600 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800">
                     <span className="text-[10px] font-black text-yellow-400">H₂</span>
                  </div>
                  {/* Líquido/Indicador */}
                  <motion.div 
                     initial={{ height: '70%' }}
                     animate={{ height: limitante.isRunning && limitante.status === 'success' ? (limitante.limitanteReal === 'H2' ? '0%' : '30%') : '70%' }}
                     className="absolute bottom-0 left-0 right-0 bg-yellow-500/20 backdrop-blur-sm border-t border-yellow-400/50"
                  />
               </div>
               {/* Display Digital */}
               <div className="bg-black border-2 border-slate-800 rounded-xl px-4 py-2 shadow-inner">
                  <span className="font-mono text-xl font-black text-yellow-400 tracking-tighter">
                     {displayH2.toFixed(1)} <span className="text-[10px] text-slate-500 ml-1">g</span>
                  </span>
               </div>
            </motion.div>
         </div>

         {/* REACTOR CENTRAL */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <motion.div 
               animate={
                  limitante.isRunning 
                     ? (limitante.status === 'success' ? { scale: [1, 1.1, 1], rotate: 360 } : { x: [0, -10, 10, -10, 10, 0] })
                     : {}
               }
               transition={limitante.status === 'success' ? { repeat: Infinity, duration: 2 } : { duration: 0.5 }}
               className={`w-52 h-52 rounded-[3.5rem] bg-gradient-to-br from-slate-800 to-slate-950 border-4 ${limitante.status === 'error' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.5)]' : (limitante.status === 'success' ? 'border-green-400 shadow-[0_0_50px_rgba(74,222,128,0.4)]' : 'border-slate-700 shadow-2xl')} flex flex-col items-center justify-center gap-2 relative overflow-hidden`}
            >
               <div className="absolute inset-0 bg-[#219EBC]/5 opacity-50" />
               <Factory className={`${limitante.status === 'success' ? 'text-green-400 animate-pulse' : (limitante.status === 'error' ? 'text-red-500' : 'text-slate-600')} transition-colors`} size={64} />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Haber Reactor</span>
               
               {/* Moléculas Huérfanas (Floating on Success) */}
               {limitante.status === 'success' && (
                  <div className="absolute inset-0">
                     {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div 
                           key={i}
                           initial={{ opacity: 0, x: 0, y: 0 }}
                           animate={{ 
                              opacity: [0, 1, 0.5, 0], 
                              x: [0, Math.sin(i) * 50], 
                              y: [0, Math.cos(i) * -50] 
                           }}
                           transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                           className={`absolute w-3 h-3 rounded-full ${limitante.limitanteReal === 'N2' ? 'bg-yellow-400' : 'bg-blue-400'} blur-[1px]`}
                           style={{ left: '50%', top: '50%' }}
                        />
                     ))}
                  </div>
               )}
            </motion.div>
            
            {/* Feedback HUD */}
            <AnimatePresence>
               {limitante.status === 'error' && (
                  <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20 }}
                     className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 bg-red-500/20 backdrop-blur-xl border border-red-500/50 rounded-2xl p-3 text-center"
                  >
                     <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Falla de Calibración</p>
                     <p className="text-xs font-bold text-white leading-tight">Desbalance en el flujo detectado. Revisa tus números.</p>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

      </div>

      {/* PANEL DE INFORMACIÓN INFERIOR */}
      <div className="absolute bottom-10 flex gap-8 z-20">
         <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2rem] flex flex-col items-center shadow-xl">
            <span className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Consumo en Tiempo Real</span>
            <div className="flex gap-10">
               <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                     <Droplets size={14} className="text-blue-400" />
                     <span className="text-xs font-black text-white italic">N₂ (g)</span>
                  </div>
                  <span className="font-mono text-lg font-black text-blue-400">{displayN2.toFixed(1)}</span>
               </div>
               <div className="w-px h-10 bg-slate-800" />
               <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                     <Droplets size={14} className="text-yellow-400" />
                     <span className="text-xs font-black text-white italic">H₂ (g)</span>
                  </div>
                  <span className="font-mono text-lg font-black text-yellow-400">{displayH2.toFixed(1)}</span>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
