"use client";

import React, { useMemo } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PilotoCuadraticas() {
  const { cuadraticas } = useSimuladorStore();
  const { a, b, c, target } = cuadraticas;

  // Escala: 1 unidad = 50 píxeles. Centro (0,0) en (500,500).
  const unitSize = 50;
  const center = 500;

  const toScreen = (x: number, y: number) => ({
    x: center + x * unitSize,
    y: center - y * unitSize // Y invertida en SVG
  });

  // Generar puntos para una parábola f(x) = ax² + bx + c
  const generatePath = (coeffs: { a: number, b: number, c: number }) => {
    let points = [];
    for (let x = -10.5; x <= 10.5; x += 0.1) {
      const y = coeffs.a * x * x + coeffs.b * x + coeffs.c;
      const screen = toScreen(x, y);
      points.push(`${screen.x},${screen.y}`);
    }
    return `M ${points.join(' L ')}`;
  };

  const studentPath = useMemo(() => generatePath({ a, b, c }), [a, b, c]);
  const targetPath = useMemo(() => generatePath(target), [target]);

  // Telemetría para marcadores
  const delta = b * b - 4 * a * c;
  const vx = -b / (2 * a || 0.001);
  const vy = a * vx * vx + b * vx + c;
  const vertexPos = toScreen(vx, vy);

  const x1 = delta >= 0 ? (-b + Math.sqrt(delta)) / (2 * a) : null;
  const x2 = delta >= 0 ? (-b - Math.sqrt(delta)) / (2 * a) : null;
  const roots = [x1, x2].filter(r => r !== null).map(r => toScreen(r!, 0));

  const yIntercept = toScreen(0, c);

  return (
    <div className="w-full h-full bg-slate-950 flex items-center justify-center p-8 overflow-hidden">
      <div className="relative w-full h-full max-w-4xl aspect-square bg-[#060B14] rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
        
        {/* SVG CARTESIANO */}
        <svg viewBox="0 0 1000 1000" className="w-full h-full">
          {/* GRID */}
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.5" opacity="0.1" />
            </pattern>
            <pattern id="gridSmall" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.2" opacity="0.05" />
            </pattern>
          </defs>
          <rect width="1000" height="1000" fill="url(#gridSmall)" />
          <rect width="1000" height="1000" fill="url(#grid)" />

          {/* EJES */}
          <line x1="0" y1="500" x2="1000" y2="500" stroke="white" strokeWidth="2" opacity="0.3" />
          <line x1="500" y1="0" x2="500" y2="1000" stroke="white" strokeWidth="2" opacity="0.3" />

          {/* ETIQUETAS EJES */}
          <text x="980" y="490" fill="white" className="text-[14px] font-black opacity-40">X</text>
          <text x="515" y="25" fill="white" className="text-[14px] font-black opacity-40">Y</text>

          {/* TRAYECTORIA OBJETIVO */}
          <motion.path 
            d={targetPath}
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeDasharray="8 8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ duration: 1 }}
          />

          {/* PARÁBOLA DEL ALUMNO */}
          <path 
            d={studentPath}
            fill="none"
            stroke="url(#gradRose)"
            strokeWidth="6"
            strokeLinecap="round"
            className="drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]"
          />

          <linearGradient id="gradRose" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>

          {/* MARCADORES */}
          <AnimatePresence>
            {/* Vértice */}
            <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <circle cx={vertexPos.x} cy={vertexPos.y} r="8" fill="#f43f5e" className="animate-pulse" />
                <circle cx={vertexPos.x} cy={vertexPos.y} r="12" fill="none" stroke="#f43f5e" strokeWidth="1" opacity="0.5" />
            </motion.g>

            {/* Raíces */}
            {roots.map((root, i) => (
               <motion.circle 
                 key={`root-${i}`}
                 initial={{ scale: 0 }} 
                 animate={{ scale: 1 }} 
                 exit={{ scale: 0 }}
                 cx={root.x} 
                 cy={root.y} 
                 r="6" 
                 fill="#22d3ee" 
                 className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
               />
            ))}

            {/* Corte Y */}
            <motion.circle 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              cx={yIntercept.x} cy={yIntercept.y} r="6" fill="#fbbf24" 
            />
          </AnimatePresence>
        </svg>

        {/* HUD DE LEYENDA (INTERNAL MAIN) */}
        <div className="absolute top-8 left-8 flex flex-col gap-2">
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5">
                <div className="w-3 h-3 bg-rose-500 rounded-full" />
                <span className="text-[10px] font-black text-rose-100 uppercase tracking-widest">f(x) Actual</span>
            </div>
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5">
                <div className="w-3 h-3 bg-white/30 rounded-full border border-white border-dashed" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Objetivo</span>
            </div>
        </div>

        {/* HUD PUNTOS CLAVE */}
        <div className="absolute bottom-8 left-8 flex gap-4">
             <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-white/5">
                <div className="w-2 h-2 bg-rose-500 rounded-full" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Vértice</span>
             </div>
             <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-white/5">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Raíces Reales</span>
             </div>
             <div className="flex items-center gap-2 bg-black/60 px-4 py-2 rounded-xl border border-white/5">
                <div className="w-2 h-2 bg-amber-400 rounded-full" />
                <span className="text-[9px] font-bold text-slate-400 uppercase">Corte Y (c)</span>
             </div>
        </div>

      </div>
    </div>
  );
}
