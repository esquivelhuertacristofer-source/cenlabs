"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Flame, Thermometer, Wind, Droplets, Info, Timer, Play, RotateCcw } from 'lucide-react';

export default function PilotoDestilacionFraccionada({ isWorktableDark = true, isProfesor = false }: { isWorktableDark?: boolean; isProfesor?: boolean }) {
  const { destilacion, setCalorManta, updateDestilacion, resetP10 } = useSimuladorStore();
  const [lastTick, setLastTick] = useState(Date.now());

  // Loop de simulación local (más fluido que el tick global)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTick) / 1000;
      updateDestilacion(dt);
      setLastTick(now);
    }, 100);
    return () => clearInterval(interval);
  }, [lastTick, updateDestilacion]);

  const temp = destilacion.tempMezcla;
  const volEtanol = destilacion.volEtanolMatraz;
  const volAgua = destilacion.volAguaMatraz;
  const volDestilado = destilacion.volDestilado;
  const pur = destilacion.purezaDestilado;

  // Escala de animaciones
  const boilingIntensity = Math.max(0, (temp - 70) / 30);
  const vaporOpacity = Math.min(0.8, Math.max(0, (temp - 75) / 20));

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center p-8 transition-colors duration-700 ${isWorktableDark ? 'bg-[#0A1120]' : 'bg-[#F1F5F9]'}`}>
      
      {/* 1. SECCIÓN DE CRISTALERÍA (MONTAJE) */}
      <div className="relative w-full max-w-5xl h-[550px] flex items-end justify-center perspective-1000">
         
         {/* MANTA DE CALENTAMIENTO */}
         <div className="absolute left-[15%] bottom-0 flex flex-col items-center">
            <div className="w-64 h-24 bg-slate-800 rounded-t-[3rem] border-x-[8px] border-t-[8px] border-slate-700 shadow-2xl relative overflow-hidden">
               <div className={`absolute inset-0 bg-orange-600/20 transition-opacity duration-1000 ${temp > 50 ? 'opacity-100' : 'opacity-0'}`} />
               <div className="flex flex-col items-center justify-center h-full relative z-10">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Heating Mantle</span>
                  <div className="flex items-center gap-4 text-white">
                     <button onClick={() => setCalorManta(destilacion.calorManta - 5)} className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all font-black text-xs">-5</button>
                     <div className="w-20 text-center font-mono text-2xl font-black bg-black/40 rounded-lg py-1 border border-white/5">{destilacion.calorManta}°</div>
                     <button onClick={() => setCalorManta(destilacion.calorManta + 5)} className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all font-black text-xs">+5</button>
                  </div>
               </div>
            </div>

            {/* MATRAZ BOLA (MEZCLA) */}
            <div className="relative -mb-4 z-20 group">
               <div className="w-48 h-48 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl flex items-end justify-center overflow-hidden">
                  {/* Mezcla Líquida */}
                  <motion.div 
                    animate={{ height: `${((volEtanol + volAgua) / 100) * 80}%` }}
                    className="w-full bg-[#1e40af]/30 relative transition-all duration-1000"
                  >
                     {/* Burbujas de Ebullición */}
                     <AnimatePresence>
                        {temp > 75 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: boilingIntensity }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-wrap justify-around p-4">
                             {[...Array(12)].map((_, i) => (
                               <motion.div 
                                 key={i}
                                 animate={{ y: [0, -40, -80], opacity: [0, 1, 0], scale: [0.5, 1, 0.8] }}
                                 transition={{ duration: 1 / boilingIntensity, repeat: Infinity, delay: Math.random() * 2 }}
                                 className="w-2 h-2 bg-white/40 rounded-full"
                               />
                             ))}
                          </motion.div>
                        )}
                     </AnimatePresence>
                  </motion.div>
               </div>
               {/* Cuello del matraz */}
               <div className="w-10 h-32 bg-white/5 backdrop-blur-xl border-x border-white/20 mx-auto -mt-48 relative z-10" />
            </div>
         </div>

         {/* COLUMNA DE FRACCIONAMIENTO + REFRIGERANTE (SVG) */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-30">
            <defs>
              <filter id="glass-glow">
                <feGaussianBlur stdDeviation="3" result="glow"/>
                <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Columna Vertical */}
            <rect x="361" y="220" width="38" height="150" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" rx="4" />
            
            {/* Vapor SVG */}
            {temp > 75 && (
              <motion.rect 
                initial={{ height: 0 }}
                animate={{ height: 140, opacity: vaporOpacity }}
                x="365" y="225" width="30" fill="url(#vapor-grad)" 
              />
            )}
            <linearGradient id="vapor-grad" x1="0%" y1="100%" x2="0%" y2="0%">
               <stop offset="0%" stopColor="white" stopOpacity="0.2" />
               <stop offset="100%" stopColor="white" stopOpacity="0.6" />
            </linearGradient>

            {/* Codo y Brazo Lateral */}
            <path d="M 380 220 L 380 180 L 450 180 L 750 350" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="36" strokeLinecap="round" />
            <path d="M 380 220 L 380 180 L 450 180 L 750 350" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="30" strokeLinecap="round" />
            
            {/* Camisa de Agua del Refrigerante */}
            <path d="M 500 208 L 720 333" fill="none" stroke="rgba(33, 158, 188, 0.15)" strokeWidth="50" strokeLinecap="round" />

            {/* Goteo (Partículas SVG) */}
            {temp > 78 && (
               <motion.circle r="3" fill="#60a5fa" filter="url(#glass-glow)">
                  <animateMotion 
                    dur={temp > 98 ? "0.4s" : "1.2s"} 
                    repeatCount="indefinite" 
                    path="M 770 360 L 770 450" 
                  />
               </motion.circle>
            )}
         </svg>

         {/* MATRAZ RECEPTOR (ERLENMEYER) */}
         <div className="absolute right-[15%] bottom-0 flex flex-col items-center">
            <div className="relative w-40 h-48">
               {/* Cuerpo Erlenmeyer */}
               <svg viewBox="0 0 100 120" className="w-full h-full">
                  <path d="M 40 10 L 60 10 L 60 40 L 95 110 L 5 110 L 40 40 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  {/* Líquido Recogido */}
                  <motion.path 
                    animate={{ d: `M ${50 - (volDestilado/1.2)} 110 L ${50 + (volDestilado/1.2)} 110 L ${50 + (volDestilado/2)} ${110 - volDestilado*1.2} L ${50 - (volDestilado/2)} ${110 - volDestilado*1.2} Z` }}
                    fill={pur < 95 ? "rgba(100,116,139,0.5)" : "rgba(34,197,94,0.3)"}
                    className="transition-colors duration-1000"
                  />
               </svg>
            </div>
            <div className="mt-4 text-center">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Matraz Receptor</span>
               <span className="text-xs font-black text-white font-mono">{volDestilado.toFixed(1)} mL</span>
            </div>
         </div>
      </div>

      {/* 2. OVERLAY DE CONTROL MAESTRO */}
      {isProfesor && (
        <div className="absolute top-10 right-10 p-6 bg-[#FB8500] text-white rounded-3xl shadow-xl max-w-xs animate-in slide-in-from-right duration-300 pointer-events-auto">
           <div className="flex items-center gap-2 mb-2 font-black uppercase tracking-tighter text-sm">
             <Info size={18} /> Panel de Destilación Pro
           </div>
           <p className="text-xs font-bold opacity-90 leading-relaxed mb-4">Mezcla: 50/50 Alcohol Agua. El etanol evapora primero. No dejes que suba a 100°C o contaminarás la muestra.</p>
           <button onClick={resetP10} className="w-full py-3 bg-white/20 rounded-xl text-xs font-black uppercase border border-white/30 flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Resetear Mezcla
           </button>
        </div>
      )}

      {/* 3. ALERTAS DE TERMO-DAÑO */}
      <AnimatePresence>
        {temp > 98 && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute top-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-500 text-white rounded-full flex items-center gap-3 shadow-2xl border-b-4 border-red-700">
             <Wind className="animate-bounce" size={18} />
             <span className="text-xs font-black uppercase tracking-widest">¡¡CRÍTICO!! Co-evaporación de Agua Detectada</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
