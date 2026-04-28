"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { AlertTriangle, Thermometer, Gauge, Box, RefreshCcw, CheckCircle2, Flame, Info, Wind } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { audio } from '@/utils/audioEngine';

export default function PilotoLeyesGases({ isWorktableDark, isProfesor }: { isWorktableDark: boolean, isProfesor: boolean }) {
  const router = useRouter();
  const { gases, updateGases, resetGases, generarSemillaGases, stopTimer } = useSimuladorStore();
  
  // Defensive Destructuring with Gold Standard fallbacks
  const { T = 300, V = 10, P = 1.0, pTarget = 3.5, isExploded = false } = gases || {};

  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!pTarget) generarSemillaGases();
  }, [generarSemillaGases, pTarget]);

  const guiaMensaje = useMemo(() => {
    if (isExploded) return { text: "¡SISTEMA COLAPSADO! La cámara ha estallado por sobrepresión.", type: "error" };
    if (showSuccess) return { text: "¡Práctica finalizada con éxito!", type: "success" };
    if (Math.abs(P - pTarget) <= 0.1) return { text: "¡Presión Ideal alcanzada! Presiona VALIDAR.", type: "success" };
    if (P > 4.5) return { text: "¡PRESIÓN CRÍTICA! El contenedor está al límite.", type: "warning" };
    return { text: "Manipula T y V para alcanzar el objetivo.", type: "info" };
  }, [P, pTarget, isExploded, showSuccess]);

  const handleValidar = () => {
    if (showSuccess) return;
    setShowSuccess(true);
    stopTimer();
    audio.playSuccess();
    setTimeout(() => {
      if (!isProfesor) router.push('/alumno/laboratorio/quimica');
    }, 5000);
  };

  // Lógica Física del Manómetro (Gold Standard)
  const needleRotation = ((P || 1) / 5) * 180 - 90;
  const pistonPos = 15 + ((10 - V) / 8) * 60;
  const particleSpeed = 2 - ((T - 300) / 300) * 1.5;
  const pressureColor = P > 4.5 ? "#EF4444" : P > 3.5 ? "#F59E0B" : "#219EBC";

  if (!mounted) return <div className="w-full h-full bg-[#F8FAFC] flex items-center justify-center font-black animate-pulse text-[#219EBC]">PREPARANDO CÁMARA DE PRESIÓN...</div>;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative p-8 select-none perspective-1000">
      
      {/* BACKGROUND HEAT GLOW (VFX) */}
      <motion.div 
         animate={{ opacity: (T - 300) / 300 * 0.4 }}
         className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-500 blur-[120px] rounded-full -z-10"
      />

      {/* MANÓMETRO CIRCULAR PREMIUM (SVG SHADERS) */}
      <div className="absolute top-24 right-16 w-56 h-56 z-40 group">
         <motion.div 
            whileHover={{ scale: 1.1, rotate: 2 }}
            className="relative w-full h-full p-2 bg-slate-100 dark:bg-slate-800 rounded-full shadow-2xl border-4 border-slate-200 dark:border-slate-700"
         >
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
               <defs>
                  <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                     <stop offset="0%" stopColor="#219EBC" />
                     <stop offset="70%" stopColor="#FB8500" />
                     <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
               </defs>
               {/* Escala */}
               <path d="M 40 160 A 80 80 0 1 1 160 160" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="8" strokeLinecap="round" />
               <path d="M 40 160 A 80 80 0 1 1 160 160" fill="none" stroke="url(#gaugeGradient)" strokeWidth="8" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (P / 5 * 251)} className="transition-all duration-500" />
               
               {/* Marcadores */}
               {[0, 1, 2, 3, 4, 5].map(v => {
                  const angle = (v / 5) * 180 - 180;
                  const x = 100 + Math.cos(angle * Math.PI / 180) * 65;
                  const y = 100 + Math.sin(angle * Math.PI / 180) * 65;
                  return <text key={v} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[12px] font-black fill-slate-400 dark:fill-slate-500">{v}</text>;
               })}

               {/* Aguja */}
               <motion.g animate={{ rotate: needleRotation }} style={{ originX: "100px", originY: "100px" }}>
                  <path d="M 100 100 L 100 30" stroke="currentColor" className="text-[#023047] dark:text-white" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="100" cy="100" r="10" className="fill-[#023047] dark:fill-white" />
               </motion.g>
            </svg>
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Presión ATM</span>
               <span className="text-xl font-black text-[#023047] dark:text-white" style={{ color: pressureColor }}>{P.toFixed(2)}</span>
            </div>
         </motion.div>
      </div>

      {/* DASHBOARD DE MÉTRICAS (PREMIUM FLOATING) */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6 z-40">
        <motion.div whileHover={{ y: -5 }} className="px-8 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl flex flex-col items-center">
           <span className="text-[10px] font-black text-[#219EBC] uppercase tracking-[0.2em] mb-1">Presión Meta</span>
           <span className="text-3xl font-black text-[#023047] dark:text-white">{pTarget.toFixed(1)} <span className="text-sm opacity-50">atm</span></span>
        </motion.div>
      </div>

      {/* CÁMARA DE GAS (VFX INTEGRATION) */}
      <div className="relative w-[350px] h-[500px] flex items-end justify-center perspective-1000">
         
         <AnimatePresence mode="wait">
            <motion.div 
               key={guiaMensaje.text} 
               initial={{ y: 20, opacity: 0 }} 
               animate={{ y: 0, opacity: 1 }} 
               className={`absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] px-8 py-5 rounded-[2rem] shadow-2xl border backdrop-blur-2xl z-[50] flex items-center gap-4 text-sm font-bold ${guiaMensaje.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' : guiaMensaje.type === 'warning' ? 'bg-orange-500/10 border-orange-500/30 text-orange-500' : 'bg-blue-500/10 border-blue-500/20 text-[#023047] dark:text-[#8ECAE6]'}`}
            >
               <div className={`p-2 rounded-xl ${guiaMensaje.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {guiaMensaje.type === 'error' ? <AlertTriangle size={20}/> : <Info size={20}/>}
               </div>
               <p className="leading-tight">{guiaMensaje.text}</p>
            </motion.div>
         </AnimatePresence>

         <div className={`relative w-64 h-[400px] border-x-8 border-b-8 rounded-b-[3rem] overflow-hidden backdrop-blur-md transition-all duration-700 ${isWorktableDark ? 'bg-white/5 border-slate-700/50' : 'bg-[#219EBC]/5 border-[#219EBC]/30'} shadow-[inset_0_0_100px_rgba(255,255,255,0.05)]`}>
             {/* Partículas de Gas Interactivas */}
             {mounted && !isExploded && Array.from({ length: 30 }).map((_, i) => (
                <motion.div 
                  key={i} 
                  initial={{ x: Math.random() * 240, y: Math.random() * 400 }} 
                  animate={{ 
                     x: [Math.random() * 240, Math.random() * 240], 
                     y: [Math.random() * 400, Math.random() * 400] 
                  }} 
                  transition={{ duration: particleSpeed + Math.random(), repeat: Infinity, ease: "linear" }} 
                  className="absolute w-2 h-2 rounded-full bg-[#8ECAE6] shadow-[0_0_10px_#8ECAE6] z-10" 
                />
             ))}

             {/* Émbolo Móvil (Soft-Claymorphism) */}
             <motion.div 
                animate={{ top: `${pistonPos}%` }} 
                transition={{ type: 'spring', stiffness: 40, damping: 20 }} 
                className="absolute left-0 w-full z-20 flex flex-col items-center"
             >
                <div className="w-full h-12 bg-gradient-to-b from-slate-400 to-slate-600 shadow-2xl border-y border-white/20" />
                <div className="w-4 h-64 bg-slate-500 shadow-inner" />
             </motion.div>

             {/* Sombreado de Presión */}
             <motion.div 
                animate={{ opacity: P / 6 }}
                className="absolute inset-0 bg-[#219EBC]/20 pointer-events-none transition-opacity"
             />
         </div>

         {/* Mechero Bunsen (SVG) */}
         <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-32 z-30">
            <motion.div 
               animate={{ y: [0, -2, 0] }} transition={{ duration: 2, repeat: Infinity }}
               className="relative w-full h-full grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all"
            >
               <div className="w-8 h-20 bg-slate-400 mx-auto rounded-t-lg" />
               <AnimatePresence>
                  {T > 300 && (
                     <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: (T - 300) / 300 + 0.5 }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-gradient-to-t from-orange-500 to-yellow-300 blur-[2px] rounded-full origin-bottom"
                     />
                  )}
               </AnimatePresence>
            </motion.div>
         </div>
      </div>

      {/* CONTROLES ESTILO CONSOLA (GOLD STANDARD) */}
      <div className="absolute bottom-16 w-full max-w-4xl px-12 py-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3.5rem] border border-white/20 shadow-[0_50px_120px_rgba(0,0,0,0.15)] flex items-center justify-between gap-16 z-[60]">
         
         <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-[#FB8500] tracking-[0.2em] mb-1">Energía Térmica</span>
                  <span className="text-xl font-mono font-black text-[#023047] dark:text-white">{T} K</span>
               </div>
               <Thermometer size={20} className="text-[#FB8500]" />
            </div>
            <input type="range" min="300" max="600" step="10" value={T} disabled={isExploded || showSuccess} onChange={(e) => updateGases(parseInt(e.target.value), V)} className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#FB8500] hover:scale-[1.02] transition-transform" />
         </div>

         <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-[#219EBC] tracking-[0.2em] mb-1">Volumen Volátila</span>
                  <span className="text-xl font-mono font-black text-[#023047] dark:text-white">{V} L</span>
               </div>
               <Box size={20} className="text-[#219EBC]" />
            </div>
            <input type="range" min="2" max="10" step="0.5" value={V} disabled={isExploded || showSuccess} onChange={(e) => updateGases(T, parseFloat(e.target.value))} className="w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-[#219EBC] hover:scale-[1.02] transition-transform" />
         </div>

         <motion.button 
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            disabled={Math.abs(P - pTarget) > 0.1 || isExploded || showSuccess} 
            onClick={handleValidar} 
            className={`w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center shadow-2xl transition-all ${Math.abs(P - pTarget) <= 0.1 && !showSuccess ? 'bg-green-500 text-white shadow-green-500/30 border-b-8 border-green-700' : 'bg-slate-200 text-slate-400 border-b-4 border-slate-300'}`}
         >
            {showSuccess ? <CheckCircle2 size={32} /> : <div className="flex flex-col items-center"><span className="text-[8px] font-black uppercase mb-1">Listo</span><CheckCircle2 size={28} /></div>}
         </motion.button>
      </div>

      {/* OVERLAY DE EXPLOSIÓN */}
      <AnimatePresence>
         {isExploded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-red-600/20 backdrop-blur-2xl z-[100] flex items-center justify-center p-12">
               <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white p-12 rounded-[3.5rem] border-4 border-red-500 shadow-2xl text-center max-w-md">
                  <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse"><AlertTriangle size={56} /></div>
                  <h2 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Cámara Colapsada!</h2>
                  <p className="text-slate-500 font-bold mb-10 leading-relaxed text-sm">La presión interna superó el límite de seguridad del contenedor metálico.</p>
                  <button onClick={resetGases} className="w-full py-5 bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-500/30 hover:bg-red-600 transition-all active:scale-95">Reiniciar Sistema</button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
