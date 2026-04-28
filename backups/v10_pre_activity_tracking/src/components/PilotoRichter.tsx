"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Maximize2, Layers } from 'lucide-react';

export default function PilotoRichter() {
  const { richter } = useSimuladorStore();
  const { magnitudActual, magnitudBase, isLogView } = richter;

  const [wavePoints, setWavePoints] = useState<number[]>([]);

  // Telemetría Matemática
  const deltaM = magnitudActual - magnitudBase;
  const multiplicadorEnergetico = Math.pow(10, 1.5 * deltaM);
  
  // En escala lineal (volumen), el radio crece como la raíz cúbica del multiplicador.
  // r2/r1 = (10^(1.5 * deltaM))^(1/3) = 10^(0.5 * deltaM)
  const radioLineal = Math.pow(10, 0.5 * deltaM);
  
  // En escala logarítmica, el radio crece linealmente con deltaM para representar la escala de magnitud.
  const radioLog = 1 + deltaM * 2; 

  const currentVisualRadius = isLogView ? radioLog : radioLineal;
  const zoomScale = 1 / Math.max(1, currentVisualRadius * 0.4);

  // Animación del Sismógrafo
  useEffect(() => {
    const interval = setInterval(() => {
      setWavePoints(prev => {
        const amplitude = Math.pow(10, magnitudActual - 6.0) * 5; // Amplitud escala con magnitud Richter (base 10)
        const nextPoint = (Math.random() - 0.5) * amplitude;
        const newArr = [...prev, nextPoint];
        if (newArr.length > 100) newArr.shift();
        return newArr;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [magnitudActual]);

  const polylinePath = useMemo(() => {
    return wavePoints.map((y, x) => `${x * 10},${100 + y}`).join(' ');
  }, [wavePoints]);

  return (
    <div className="w-full h-full bg-[#030712] flex flex-col p-8 gap-6 font-sans overflow-hidden">
      
      {/* SECCIÓN 1: SISMÓGRAFO (Papel Continuo) */}
      <div className="h-2/5 bg-slate-900 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#fff_1px,_transparent_1px)] bg-[size:20px_20px]" />
        
        <div className="absolute top-6 left-8 flex items-center gap-3">
             <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
             <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} /> Registro de Ondas (Mw {magnitudActual.toFixed(1)})
             </span>
        </div>

        <svg width="100%" height="100%" viewBox="0 0 1000 200" preserveAspectRatio="none">
          <motion.polyline 
            points={polylinePath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinejoin="round"
            filter="drop-shadow(0 0 8px rgba(244,63,94,0.5))"
          />
          {/* Líneas de Escala */}
          <line x1="0" y1="100" x2="1000" y2="100" stroke="white" strokeWidth="0.5" opacity="0.1" strokeDasharray="5 5" />
        </svg>

        <div className="absolute bottom-6 right-8 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
            Análisis de Amplitud Temporal
        </div>
      </div>

      {/* SECCIÓN 2: COMPARADOR DE ENERGÍA (Burbujas de Potencia) */}
      <div className="h-3/5 bg-slate-950 rounded-[3.5rem] border border-white/5 relative overflow-hidden flex items-center justify-center p-12 shadow-inner">
        
        <div className="absolute top-8 left-10 flex flex-col gap-2 z-10">
            <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Layers size={16} className="text-indigo-400" /> Comparador de Energía
            </h3>
            <p className="text-[10px] text-slate-500 font-bold max-w-[200px]">
                {isLogView 
                    ? "Escala Logarítmica: El radio crece linealmente con la magnitud." 
                    : "Escala Real (Volumen): El radio crece para representar la energía total."}
            </p>
        </div>

        <motion.div 
          animate={{ scale: zoomScale }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          className="relative flex items-center justify-center"
        >
            {/* ESFERA ACTUAL (Potencia) */}
            <motion.div 
                animate={{ width: currentVisualRadius * 150, height: currentVisualRadius * 150 }}
                transition={{ type: "spring", stiffness: 40 }}
                className="rounded-full bg-gradient-to-br from-rose-600/20 to-fuchsia-600/40 border-4 border-rose-500/50 shadow-[0_0_100px_rgba(244,63,94,0.2)] flex items-center justify-center relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />
                <AnimatePresence>
                    {currentVisualRadius > 1.5 && (
                        <motion.span 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-white font-black text-2xl drop-shadow-lg z-10"
                            style={{ scale: 1 / zoomScale }}
                        >
                            {Math.round(multiplicadorEnergetico).toLocaleString()}x
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* ESFERA BASE (6.0 Mw) */}
            <div className="absolute w-[150px] h-[150px] rounded-full bg-gradient-to-br from-cyan-400 to-indigo-600 border-2 border-white/20 shadow-xl flex items-center justify-center z-20">
                <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Base</span>
                    <span className="text-xs font-black text-white">6.0 Mw</span>
                </div>
            </div>
        </motion.div>

        {/* LEYENDA HUD */}
        <div className="absolute bottom-8 right-10 flex flex-col items-end gap-2 text-right">
             <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Auto-Zoom Activo</span>
                <Maximize2 size={12} className="text-green-500" />
             </div>
             <div className="text-[10px] text-slate-600 font-bold max-w-[150px]">
                {magnitudActual > 8.5 ? "La energía es tan masiva que el sismo base se reduce a un punto." : ""}
             </div>
        </div>

      </div>

    </div>
  );
}
