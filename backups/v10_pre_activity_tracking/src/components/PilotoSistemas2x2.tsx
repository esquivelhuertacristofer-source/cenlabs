"use client";

import React, { useMemo } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, Target, Crosshair } from 'lucide-react';

export default function PilotoSistemas2x2() {
  const { sistemas2x2 } = useSimuladorStore();
  const { m1, b1, m2, b2, target, status } = sistemas2x2;

  // Escala: 1 unidad = 50 píxeles. Centro (0,0) en (500,500).
  const unitSize = 50;
  const center = 500;

  const toScreen = (x: number, y: number) => ({
    x: center + x * unitSize,
    y: center - y * unitSize
  });

  // Cálculo de Intersección
  const isParallel = Math.abs(m1 - m2) < 0.001;
  const xi = !isParallel ? (b2 - b1) / (m1 - m2) : null;
  const yi = !isParallel ? m1 * xi! + b1 : null;
  const intersectPos = xi !== null ? toScreen(xi, yi!) : null;

  const isTargetLocked = xi !== null && Math.abs(xi - target.x) < 0.1 && Math.abs(yi! - target.y) < 0.1;

  // Generar línea infinita (de -15 a 15 para cubrir todo el canvas)
  const generateLine = (m: number, b: number) => {
    const p1 = toScreen(-15, m * -15 + b);
    const p2 = toScreen(15, m * 15 + b);
    return `M ${p1.x},${p1.y} L ${p2.x},${p2.y}`;
  };

  const line1Path = useMemo(() => generateLine(m1, b1), [m1, b1]);
  const line2Path = useMemo(() => generateLine(m2, b2), [m2, b2]);
  const targetPos = useMemo(() => toScreen(target.x, target.y), [target]);

  return (
    <div className="w-full h-full bg-[#060B14] flex items-center justify-center p-8 overflow-hidden font-sans">
      <div className="relative w-full h-full max-w-4xl aspect-square bg-slate-950 rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
        
        {/* SVG RADAR */}
        <svg viewBox="0 0 1000 1000" className="w-full h-full">
          <defs>
            <radialGradient id="radarPulse" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </radialGradient>
            <filter id="glow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
          </defs>

          {/* GRID CIRCULAR (Radar Style) */}
          {[2, 4, 6, 8, 10].map((r) => (
             <circle 
               key={r} 
               cx="500" cy="500" 
               r={r * 50} 
               fill="none" 
               stroke="white" 
               strokeWidth="0.5" 
               opacity="0.1" 
             />
          ))}
          
          <line x1="0" y1="500" x2="1000" y2="500" stroke="white" strokeWidth="1" opacity="0.1" />
          <line x1="500" y1="0" x2="500" y2="1000" stroke="white" strokeWidth="1" opacity="0.1" />

          {/* PUNTO OBJETIVO (SIGNAL) */}
          <g>
             <circle cx={targetPos.x} cy={targetPos.y} r="30" fill="url(#radarPulse)" className="animate-ping" />
             <circle cx={targetPos.x} cy={targetPos.y} r="8" fill={isTargetLocked ? "#10b981" : "#22d3ee"} filter="url(#glow)" />
             <circle cx={targetPos.x} cy={targetPos.y} r="12" fill="none" stroke={isTargetLocked ? "#10b981" : "#22d3ee"} strokeWidth="1.5" className="animate-pulse" />
          </g>

          {/* RECTAS */}
          <motion.path 
            d={line1Path} 
            stroke="#22d3ee" 
            strokeWidth="4" 
            fill="none" 
            opacity={0.8} 
            filter="url(#glow)"
            transition={{ type: "spring", stiffness: 100 }}
          />
          <motion.path 
            d={line2Path} 
            stroke="#f0abfc" 
            strokeWidth="4" 
            fill="none" 
            opacity={0.8} 
            filter="url(#glow)"
            transition={{ type: "spring", stiffness: 100 }}
          />

          {/* PUNTO DE COLISIÓN */}
          <AnimatePresence>
            {intersectPos && (
              <motion.g 
                initial={{ scale: 0 }} 
                animate={{ scale: 1, x: intersectPos.x, y: intersectPos.y }} 
                className="drop-shadow-2xl"
              >
                <circle cx="0" cy="0" r="10" fill="white" filter="url(#glow)" />
                <circle cx="0" cy="0" r="15" fill="none" stroke="white" strokeWidth="1" opacity="0.5" strokeDasharray="4 4" className="animate-spin-slow" />
                
                {/* LÍNEAS DE TRIANGULACIÓN */}
                <line x1="0" y1="-20" x2="0" y2="20" stroke="white" strokeWidth="1" />
                <line x1="-20" y1="0" x2="20" y2="0" stroke="white" strokeWidth="1" />
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* HUD DE RADAR */}
        <div className="absolute top-8 right-8 flex flex-col gap-3">
             <div className="bg-black/60 p-4 rounded-3xl border border-white/5 backdrop-blur-xl flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Crosshair className="text-cyan-400" size={24} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Señal Satelital</span>
                    <span className="text-sm font-black text-white uppercase italic">Active Scanning...</span>
                 </div>
             </div>
        </div>

        {/* HUD STATUS */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4">
           {isTargetLocked && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }}
                className="bg-emerald-500/20 border border-emerald-500/50 backdrop-blur-xl px-8 py-3 rounded-full flex items-center gap-3 shadow-2xl shadow-emerald-500/20"
              >
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                 <span className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em]">Target Locked - Preparen Lanzamiento</span>
              </motion.div>
           )}
        </div>

      </div>
    </div>
  );
}
