"use client";

import React, { useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PilotoTransformaciones() {
  const { geometria6, generarSemillaM6 } = useSimuladorStore();
  const { tx, ty, rotacion, escala, target, status } = geometria6;

  useEffect(() => {
    generarSemillaM6();
  }, []);

  const width = 800;
  const height = 600;
  const centerX = width / 2;
  const centerY = height / 2;
  const unitSize = 25; // 1 unidad = 25px

  // Polígono Base (Nave asimétrica)
  // Definido alrededor del origen (0,0) local
  const shipPath = "M 0,-30 L 15,30 L 0,15 L -15,30 Z";

  return (
    <div className="w-full h-full bg-[#020617] relative flex items-center justify-center overflow-hidden">
      {/* Background HUD Grid */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" 
           style={{ 
               backgroundImage: `linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)`, 
               backgroundSize: `${unitSize}px ${unitSize}px`,
               backgroundPosition: `${centerX}px ${centerY}px`
           }} />

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="relative z-10 w-full h-full drop-shadow-[0_0_15px_rgba(14,165,233,0.1)]"
      >
        {/* EJES COORDINADOS */}
        <g stroke="rgba(255,255,255,0.2)" strokeWidth="1">
            <line x1="0" y1={centerY} x2={width} y2={centerY} />
            <line x1={centerX} y1="0" x2={centerX} y2={height} />
        </g>

        {/* LABELS DE EJES */}
        <g fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="black" textAnchor="middle">
            {[-10, -5, 5, 10].map(val => (
                <text key={val} x={centerX + val * unitSize} y={centerY + 15}>{val}</text>
            ))}
            {[-10, -5, 5, 10].map(val => (
                <text key={val} x={centerX - 15} y={centerY - val * unitSize + 4}>{val}</text>
            ))}
        </g>

        {/* SONDA OBJETIVO (FANTASMA) */}
        <g transform={`translate(${centerX + target.tx * unitSize}, ${centerY - target.ty * unitSize}) rotate(${target.rotacion}) scale(${target.escala})`}>
            <path 
                d={shipPath} 
                fill="none" 
                stroke="white" 
                strokeWidth="2" 
                strokeDasharray="5 3" 
                opacity="0.3"
                className="animate-pulse"
            />
            {/* Centro del objetivo */}
            <circle cx="0" cy="0" r="3" fill="white" opacity="0.4" />
        </g>

        {/* SONDA DEL ALUMNO (ACTIVA) */}
        <g transform={`translate(${centerX + tx * unitSize}, ${centerY - ty * unitSize}) rotate(${rotacion}) scale(${escala})`}>
            {/* Rastro de energía (opcional para el wow factor) */}
            <path d={shipPath} fill="rgba(245,158,11,0.1)" stroke="none" />
            
            <motion.path 
                layout
                d={shipPath} 
                fill="none" 
                stroke={status === 'success' ? '#10b981' : '#f59e0b'} 
                strokeWidth="3" 
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_10px_#f59e0b]"
            />

            {/* PIVOTE DE TRANSFORMACIÓN (Lección didáctica) */}
            <circle cx="0" cy="0" r="4" fill="#ef4444" className="drop-shadow-[0_0_8px_#ef4444]" />
            <text x="10" y="5" fill="#ef4444" fontSize="8" fontWeight="black">PIVOTE (0,0)</text>
        </g>

        {/* INDICADORES DE RADAR */}
        <g transform={`translate(60, 60)`}>
            <circle r="40" fill="none" stroke="rgba(14,165,233,0.3)" strokeWidth="1" />
            <circle r="25" fill="none" stroke="rgba(14,165,233,0.2)" strokeWidth="1" />
            <line x1="-40" y1="0" x2="40" y2="0" stroke="rgba(14,165,233,0.2)" />
            <line x1="0" y1="-40" x2="0" y2="40" stroke="rgba(14,165,233,0.2)" />
            <motion.line 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                x1="0" y1="0" x2="40" y2="0" 
                stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round"
                className="origin-center"
            />
            <text y="55" textAnchor="middle" fill="#0ea5e9" fontSize="8" fontWeight="black">BÚSQUEDA_ACTIVA</text>
        </g>

        {/* FEEDBACK VISUAL DE ÉXITO */}
        <AnimatePresence>
            {status === 'success' && (
                <motion.g 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <circle cx={centerX + tx * unitSize} cy={centerY - ty * unitSize} r="100" fill="url(#successGradient)" opacity="0.3" />
                    <defs>
                        <radialGradient id="successGradient">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                    </defs>
                </motion.g>
            )}
        </AnimatePresence>
      </svg>

      {/* Floating HUD Labels */}
      <div className="absolute top-10 left-10 flex flex-col gap-1">
         <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Geometry_Matrix_Engine_v6.0</span>
         <div className="h-0.5 w-full bg-amber-500/20" />
      </div>

      <div className="absolute bottom-10 right-10 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex gap-6">
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Estado Sistema</span>
              <span className={`text-xs font-bold tracking-widest ${status === 'success' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {status === 'success' ? 'LOCKED_ON' : 'CALIBRATING...'}
              </span>
          </div>
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Error Cuadrático</span>
              <span className="text-xs font-bold text-white tracking-widest">
                {status === 'success' ? '0.000%' : 'PENDING_MATCH'}
              </span>
          </div>
      </div>
    </div>
  );
}
