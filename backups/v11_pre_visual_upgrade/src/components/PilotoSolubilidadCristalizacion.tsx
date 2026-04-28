"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { 
  Flame, Snowflake, Thermometer, Zap, 
  RotateCcw, Info, ArrowRight, Layout,
  MousePointer2, AlertCircle
} from 'lucide-react';

export default function PilotoSolubilidadCristalizacion({ isWorktableDark = true, isProfesor = false }: { isWorktableDark?: boolean, isProfesor?: boolean }) {
  const { solubilidad, setUbicacionVaso, addSalKNO3, updateTemperaturaP6, resetP6 } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const tempInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      resetP6();
      if (tempInterval.current) clearInterval(tempInterval.current);
    };
  }, [resetP6]);

  // Manejo de temperatura en tiempo real
  useEffect(() => {
    if (tempInterval.current) clearInterval(tempInterval.current);
    
    tempInterval.current = setInterval(() => {
      updateTemperaturaP6(0.5); // dt = 0.5 por tick
    }, 100);

    return () => { if (tempInterval.current) clearInterval(tempInterval.current); };
  }, [solubilidad.ubicacion, updateTemperaturaP6]);

  if (!mounted) return null;

  // Cálculo de cristales para renderizado
  const limite = 0.015 * Math.pow(solubilidad.temp, 2) + 0.65 * solubilidad.temp + 13;
  const salSolida = Math.max(0, solubilidad.salAgregada - limite);
  const numCristales = Math.min(60, Math.floor(salSolida / 1.5));

  return (
    <div className="relative w-full h-full bg-[#0A1121] overflow-hidden flex flex-col items-center justify-center p-8">
      
      {/* HUD SUPERIOR: ESTADO TÉRMICO */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20">
         <div className="px-8 py-4 bg-slate-900/80 backdrop-blur-2xl border border-slate-800 rounded-[2.5rem] flex items-center gap-6 shadow-2xl">
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Temperatura Termopar</span>
               <div className="flex items-center gap-2">
                  <Thermometer className={`w-5 h-5 ${solubilidad.temp > 50 ? 'text-orange-500' : 'text-blue-400'}`} />
                  <span className={`text-2xl font-black font-mono tracking-tighter ${solubilidad.temp > 50 ? 'text-orange-500' : 'text-blue-400'}`}>
                     {solubilidad.temp.toFixed(1)} <span className="text-sm">°C</span>
                  </span>
               </div>
            </div>
            <div className="w-px h-10 bg-slate-800" />
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Estado del Soluto</span>
               <span className="text-sm font-black text-white uppercase tracking-tighter">
                  {salSolida > 0 ? (solubilidad.temp > 50 ? 'Precipitado Caliente' : 'Cristalización Activa') : 'Solución Insaturada'}
               </span>
            </div>
         </div>
      </div>

      {/* ÁREA DE TRABAJO: LAS 3 ESTACIONES */}
      <div className="relative w-full max-w-6xl h-[450px] flex justify-between items-end pb-12 mt-12">
         
         {/* ESTACIÓN 1: PARRILLA (CALOR) */}
         <div className="relative flex flex-col items-center gap-4 group">
            <div className={`absolute -inset-8 bg-orange-600/10 blur-3xl rounded-full opacity-60 transition-opacity ${solubilidad.ubicacion === 'parrilla' ? 'opacity-100' : 'opacity-0'}`} />
            <div className="w-48 h-24 bg-gradient-to-b from-slate-700 to-slate-900 rounded-3xl border-x-4 border-slate-600 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
               <div className={`absolute inset-0 bg-orange-500/10 animate-pulse transition-opacity ${solubilidad.ubicacion === 'parrilla' ? 'opacity-100' : 'opacity-0'}`} />
               <Flame className={`w-8 h-8 ${solubilidad.ubicacion === 'parrilla' ? 'text-orange-500 animate-bounce' : 'text-slate-600'}`} />
               <span className="text-[10px] font-black text-slate-500 uppercase mt-1">Hot Plate v2</span>
            </div>
            <button 
               onClick={() => { setUbicacionVaso('parrilla'); audio.playPop(); }}
               className="relative z-50 px-6 py-2 bg-slate-800 hover:bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/5 shadow-lg cursor-pointer"
            >
               Mover a Parrilla
            </button>
         </div>

         {/* ESTACIÓN 2: MESA (CENTRO) */}
         <div className="relative flex flex-col items-center gap-4">
            <div className="w-56 h-12 bg-slate-800/40 backdrop-blur-md rounded-full border border-white/5 border-b-4 border-slate-700 shadow-inner" />
            <button 
               onClick={() => { setUbicacionVaso('mesa'); audio.playPop(); }}
               className="relative z-50 px-6 py-2 bg-slate-800 hover:bg-white hover:text-slate-950 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/5 shadow-lg cursor-pointer"
            >
               Mesa de Trabajo
            </button>
         </div>

         {/* ESTACIÓN 3: HIELO (FRÍO) */}
         <div className="relative flex flex-col items-center gap-4 group">
            <div className={`absolute -inset-8 bg-blue-600/10 blur-3xl rounded-full opacity-60 transition-opacity ${solubilidad.ubicacion === 'hielo' ? 'opacity-100' : 'opacity-0'}`} />
            <div className="w-48 h-32 bg-gradient-to-b from-blue-900/40 to-blue-950/60 backdrop-blur-xl rounded-t-3xl border-x-4 border-blue-400/20 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center">
               <div className="absolute top-0 inset-x-0 h-4 bg-white/10" />
               {/* Cubos de Hielo Flotando (Simplificados) */}
               <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                     <motion.div 
                        key={i}
                        animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
                        transition={{ duration: 2 + i, repeat: Infinity, ease: "easeInOut" }}
                        className="w-6 h-6 bg-white/20 backdrop-blur-xl border border-white/30 rounded-lg"
                     />
                  ))}
               </div>
               <Snowflake className={`w-8 h-8 mt-4 ${solubilidad.ubicacion === 'hielo' ? 'text-blue-400 animate-spin-slow' : 'text-slate-700'}`} />
            </div>
            <button 
               onClick={() => { setUbicacionVaso('hielo'); audio.playPop(); }}
               className="relative z-50 px-6 py-2 bg-slate-800 hover:bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/5 shadow-lg cursor-pointer"
            >
               Baño de Hielo
            </button>
            <style>{`
               @keyframes spin-slow {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
               }
               .animate-spin-slow { animation: spin-slow 8s linear infinite; }
            `}</style>
         </div>

         {/* EL VASO DE PRECIPITADOS (MOVIBLE) */}
         <motion.div 
            layout
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className={`absolute bottom-32 z-30 pointer-events-none flex flex-col items-center
               ${solubilidad.ubicacion === 'parrilla' ? 'left-[4%] -translate-x-0' : (solubilidad.ubicacion === 'hielo' ? 'left-[96%] -translate-x-full' : 'left-1/2 -translate-x-1/2')}`}
         >
            <div className="relative w-36 h-48 bg-white/[0.03] backdrop-blur-md rounded-b-[2rem] border-[3px] border-white/10 shadow-2xl relative group overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-2 bg-white/20 border-b border-white/10" />
               
               {/* Líquido (100mL fijo) */}
               <motion.div 
                  initial={{ height: '70%' }}
                  animate={{ height: '70%', background: solubilidad.temp > 50 ? 'rgba(251, 133, 0, 0.05)' : 'rgba(33, 158, 188, 0.05)' }}
                  className="absolute bottom-0 left-0 right-0 border-t border-white/10"
               >
                  {/* Partículas de Vapor al Calentar */}
                  {solubilidad.temp > 60 && solubilidad.ubicacion === 'parrilla' && (
                     <div className="absolute -top-10 inset-x-0 flex justify-around">
                        {Array.from({ length: 3 }).map((_, i) => (
                           <motion.div 
                              key={i}
                              animate={{ y: -50, opacity: [0, 0.5, 0], scale: [0.5, 1.2, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                              className="w-4 h-4 bg-white/20 rounded-full blur-md"
                           />
                        ))}
                     </div>
                  )}

                  {/* CRISTALES / PRECIPITADO */}
                  <div className="absolute bottom-2 inset-x-2 flex flex-wrap-reverse justify-center gap-1">
                     <AnimatePresence>
                        {Array.from({ length: numCristales }).map((_, i) => (
                           <motion.div 
                              key={i}
                              initial={{ scale: 0, rotate: 0 }}
                              animate={{ 
                                 scale: 1, 
                                 rotate: i * 45,
                                 y: [0, -2, 0]
                              }}
                              transition={{ 
                                 type: 'spring', 
                                 delay: i * 0.02,
                                 y: { repeat: Infinity, duration: 3, delay: i * 0.1 }
                              }}
                              className={`w-3 h-3 shadow-lg ${solubilidad.temp < 15 ? 'bg-blue-100 shadow-blue-400/50' : 'bg-white shadow-white/20'}`}
                              style={{ 
                                 clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                                 opacity: 0.8
                              }}
                           />
                        ))}
                     </AnimatePresence>
                  </div>
               </motion.div>
            </div>
            
            {/* Sombras dinámicas */}
            <div className="w-24 h-4 mt-2 bg-black/40 blur-xl rounded-full" />
         </motion.div>

      </div>

      {/* PANEL DE ACCIÓN INFERIOR */}
      <div className="absolute bottom-10 left-10 flex flex-col gap-4">
         <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] flex flex-col gap-4 shadow-2xl">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Inyección de Reactivo</span>
            <button 
               onClick={() => { addSalKNO3(10); audio.playPop(); }}
               className="px-10 py-5 bg-[#FB8500] hover:bg-[#FFB703] text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3"
            >
               <Zap className="w-4 h-4" /> Añadir 10g KNO₃
            </button>
            <div className="text-center">
               <span className="text-[10px] font-black text-[#FB8500] uppercase tracking-[0.2em]">Total agregado: {solubilidad.salAgregada}g</span>
            </div>
         </div>
      </div>

    </div>
  );
}
