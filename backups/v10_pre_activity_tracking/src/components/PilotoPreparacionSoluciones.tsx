"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { 
  Zap, Droplets, Scale, AlertCircle, CheckCircle2, 
  RotateCcw, Info, FlaskConical, Beaker 
} from 'lucide-react';

export default function PilotoPreparacionSoluciones({ isWorktableDark = true, isProfesor = false }: { isWorktableDark?: boolean, isProfesor?: boolean }) {
  const { soluciones, addPolvo, toggleTara, transferirPolvo, setAgua, generarSemillaP5, resetP5 } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const [isWaterPressed, setIsWaterPressed] = useState(false);
  const waterInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    generarSemillaP5();
    return () => resetP5();
  }, [generarSemillaP5, resetP5]);

  // Manejo de llenado de agua continuo
  useEffect(() => {
    if (isWaterPressed && soluciones.status !== 'success') {
      waterInterval.current = setInterval(() => {
        setAgua(1); // Añade 1mL cada 50ms (rápido pero controlable)
      }, 50);
    } else {
      if (waterInterval.current) clearInterval(waterInterval.current);
    }
    return () => { if (waterInterval.current) clearInterval(waterInterval.current); };
  }, [isWaterPressed, setAgua, soluciones.status]);

  if (!mounted) return null;

  const displayWeight = soluciones.balanza.tara 
    ? soluciones.balanza.polvo 
    : 12.5 + soluciones.balanza.polvo;

  return (
    <div className="relative w-full h-full bg-[#0A1121] overflow-hidden flex items-center justify-center p-8 gap-12">
      
      {/* ESCENARIO IZQUIERDO: PESADO */}
      <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-left duration-1000">
         <div className="relative group">
            <div className="absolute -inset-4 bg-[#219EBC]/5 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
            
            {/* BALANZA ANALÍTICA SVG */}
            <div className="relative w-64 h-80 bg-slate-200 rounded-[2rem] shadow-2xl border-b-[10px] border-slate-400 flex flex-col items-center p-6 pt-12 overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-2 bg-slate-300" />
               
               {/* Plato de Pesado */}
               <div className="relative w-40 h-8 bg-slate-300 rounded-full shadow-inner border-b-2 border-slate-400 mb-12">
                  <motion.div 
                    animate={{ y: soluciones.balanza.polvo > 0 ? 2 : 0 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-100 rounded-full border-b-4 border-slate-300"
                  />
                  {/* Vidrio de Reloj */}
                  <motion.div className="absolute -top-6 left-1/2 -translate-x-1/2 w-28 h-6 bg-white/40 backdrop-blur-md rounded-full border border-white/60 shadow-sm flex items-center justify-center">
                     {soluciones.balanza.polvo > 0 && (
                        <div className="w-16 h-2 bg-slate-100 blur-[2px] rounded-full opacity-60" />
                     )}
                  </motion.div>
               </div>

               {/* Pantalla LED */}
               <div className="w-full bg-[#020202] rounded-2xl p-4 border-2 border-slate-800 shadow-inner mb-6 relative group/led">
                  <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover/led:opacity-100 transition-opacity" />
                  <div className="flex justify-between items-end">
                     <span className="text-[10px] font-black text-green-950 uppercase tracking-widest">NET WT</span>
                     <span className="font-mono text-3xl font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]">
                        {displayWeight.toFixed(2)} <span className="text-sm opacity-50 ml-1">g</span>
                     </span>
                  </div>
               </div>

               {/* Botones Balanza */}
               <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => { toggleTara(); audio.playPop(); }}
                    className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${soluciones.balanza.tara ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-slate-300 text-slate-600 hover:bg-slate-400'}`}
                  >
                     TARA / ZERO
                  </button>
                  <button 
                    onClick={() => { transferirPolvo(); audio.playSuccess(); }}
                    disabled={soluciones.balanza.polvo === 0 || soluciones.status === 'transferred' || soluciones.status === 'success'}
                    className="py-3 bg-[#023047] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#219EBC] transition-all disabled:opacity-30"
                  >
                     TRANSFERIR
                  </button>
               </div>
            </div>
         </div>

         {/* CONTROLES ESPÁTULA */}
         <div className="p-6 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] w-full flex flex-col gap-4 shadow-2xl">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center px-4">Dosificación de Soluto (NaCl)</span>
            <div className="flex gap-2">
               {[0.01, 0.1, 1.0].map((val) => (
                  <button 
                    key={val}
                    onClick={() => { addPolvo(val); audio.playPop(); }}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-black text-[10px] transition-all active:scale-95"
                  >
                     +{val < 1 ? (val * 1000) + 'mg' : val + 'g'}
                  </button>
               ))}
               <button 
                  onClick={() => { addPolvo(-1.0); audio.playPop(); }}
                  className="w-12 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-black text-xs"
               >
                  -
               </button>
            </div>
         </div>
      </div>

      {/* SEPARADOR CENTRAL */}
      <div className="h-64 w-px bg-slate-800 hidden lg:block" />

      {/* ESCENARIO DERECHO: MATRAZ */}
      <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-right duration-1000">
         <div className="relative group">
            {/* MATRAZ AFORADO SVG */}
            <svg width="240" height="400" viewBox="0 0 240 400" className="relative drop-shadow-2xl">
               {/* Cuerpo Matraz */}
               <path 
                 d="M 120 40 L 120 200 L 40 340 A 80 80 0 1 0 200 340 L 120 200 Z" 
                 fill="none" 
                 stroke="white" 
                 strokeWidth="2" 
                 strokeOpacity="0.3"
               />
               
               {/* Líquido (Curvo con clipPath) */}
               <defs>
                  <clipPath id="flaskClip">
                     <path d="M 120 40 L 120 200 L 40 340 A 80 80 0 1 0 200 340 L 120 200 Z" />
                  </clipPath>
               </defs>
               
               <motion.rect 
                  clipPath="url(#flaskClip)"
                  x="0" 
                  y={400 - (soluciones.matraz.agua * 1.3)} // El 1.3 es para escalar el llenado visual
                  width="240" 
                  height="400" 
                  fill="#8ECAE6" 
                  fillOpacity="0.4"
                  initial={{ height: 0 }}
                  animate={{ y: 400 - (soluciones.matraz.agua * (320 / soluciones.vTarget)) }}
                  transition={{ type: 'spring', damping: 20 }}
               />

               {/* Línea de Aforo (Marca Roja) */}
               <line x1="100" y1="80" x2="140" y2="80" stroke="#FF0000" strokeWidth="2" strokeDasharray="4 2" />
               <text x="145" y="85" fill="#FF0000" fontSize="10" fontWeight="bold">AFORO</text>

               {/* Polvo sedimentado */}
               {soluciones.matraz.polvo > 0 && (
                  <motion.path 
                    d="M 60 360 Q 120 380 180 360 L 180 380 L 60 380 Z"
                    fill="white"
                    fillOpacity="0.6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
               )}
            </svg>

            {/* Floating Info */}
            <div className="absolute top-1/2 -right-32 flex flex-col gap-3">
               <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Molaridad Target</span>
                  <span className="text-lg font-black text-[#FB8500] font-mono">{soluciones.mTarget} M</span>
               </div>
               <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Volumen Matraz</span>
                  <span className="text-lg font-black text-[#219EBC] font-mono">{soluciones.vTarget} mL</span>
               </div>
            </div>
         </div>

         {/* BOTÓN PISETA */}
         <div className="flex flex-col items-center gap-4">
            <motion.button 
               onMouseDown={() => setIsWaterPressed(true)}
               onMouseUp={() => setIsWaterPressed(false)}
               onMouseLeave={() => setIsWaterPressed(false)}
               onTouchStart={() => setIsWaterPressed(true)}
               onTouchEnd={() => setIsWaterPressed(false)}
               whileTap={{ scale: 0.95 }}
               className={`w-20 h-24 bg-gradient-to-b from-[#8ECAE6] to-[#219EBC] rounded-t-full rounded-b-[2rem] border-x-4 border-[#8ECAE6]/50 shadow-xl flex flex-col items-center justify-end pb-4 transition-all ${isWaterPressed ? 'translate-y-2' : ''}`}
            >
               <Droplets className="text-white mb-1 animate-bounce" />
               <span className="text-[10px] font-black text-white uppercase tracking-tighter">AGUA</span>
            </motion.button>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mantener para Llenar</span>
         </div>
      </div>

      {/* ALERTAS Y FEEDBACK */}
      <AnimatePresence>
         {soluciones.matraz.agua > soluciones.vTarget && (
            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 50 }}
               className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-500/20 backdrop-blur-xl border border-red-500/50 p-4 px-8 rounded-full flex items-center gap-3 z-50 shadow-2xl"
            >
               <AlertCircle className="text-red-500" />
               <span className="text-sm font-black text-white uppercase tracking-tighter">¡Te has pasado del aforo! Solución sobre-diluida.</span>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
