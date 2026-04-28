"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function PilotoPitagoras() {
  const { pitagoras } = useSimuladorStore();
  const { catetoA, catetoB, llenado } = pitagoras;

  // Escala para el lienzo (unidades a píxeles)
  const scale = 25;
  const realC = Math.sqrt(catetoA * catetoA + catetoB * catetoB);
  
  // Ángulo de la hipotenusa para rotar el cuadrado mayor
  const angleRad = Math.atan2(catetoB, catetoA);
  const angleDeg = (angleRad * 180) / Math.PI;

  return (
    <div className="w-full h-full bg-[#0A1121] relative flex items-center justify-center overflow-hidden perspective-1000">
      {/* Background Grid - Cyberpunk Style */}
      <div className="absolute inset-0 z-0 opacity-20" 
           style={{ backgroundImage: 'radial-gradient(#219EBC 0.5px, transparent 0.5px), radial-gradient(#219EBC 0.5px, #0A1121 0.5px)', backgroundSize: '20px 20px' }} />

      {/* Main Container */}
      <motion.div 
        layout
        className="relative z-10"
        style={{ width: (catetoA + realC) * scale, height: (catetoB + realC) * scale }}
      >
        {/* TRIÁNGULO CENTRAL */}
        <svg 
            viewBox={`0 0 ${(catetoA + 10) * scale} ${(catetoB + 10) * scale}`} 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_0_15px_rgba(33,158,188,0.3)]"
            style={{ width: (catetoA + 5) * scale, height: (catetoB + 5) * scale }}
        >
            <motion.path 
                d={`M 0,${catetoB * scale} L ${catetoA * scale},${catetoB * scale} L 0,0 Z`}
                fill="rgba(33,158,188,0.1)"
                stroke="#219EBC"
                strokeWidth="3"
                strokeLinejoin="round"
                initial={false}
                animate={{ d: `M 0,${catetoB * scale} L ${catetoA * scale},${catetoB * scale} L 0,0 Z` }}
            />
            {/* Etiquetas de Catetos */}
            <text x={(catetoA * scale) / 2} y={catetoB * scale + 20} fill="#8ECAE6" fontSize="12" fontWeight="bold" textAnchor="middle">a = {catetoA}</text>
            <text x="-25" y={(catetoB * scale) / 2} fill="#8ECAE6" fontSize="12" fontWeight="bold" transform={`rotate(-90, -25, ${(catetoB * scale) / 2})`} textAnchor="middle">b = {catetoB}</text>
        </svg>

        {/* CUADRADO A (Abajo) */}
        <motion.div 
            layout
            className="absolute border-2 border-blue-400/30 bg-blue-500/5 overflow-hidden"
            style={{ 
                left: '50%', top: '50%',
                marginLeft: -(catetoA * scale) / 2, 
                marginTop: (catetoB * scale) / 2,
                width: catetoA * scale, height: catetoA * scale 
            }}
        >
            <motion.div 
                animate={{ height: `${100 - llenado}%` }}
                className="absolute bottom-0 left-0 w-full bg-blue-500/40 backdrop-blur-sm"
            />
            <div className="absolute inset-0 flex items-center justify-center font-black text-blue-400/20 text-2xl uppercase select-none">a²</div>
        </motion.div>

        {/* CUADRADO B (Izquierda) */}
        <motion.div 
            layout
            className="absolute border-2 border-blue-400/30 bg-blue-500/5 overflow-hidden"
            style={{ 
                left: '50%', top: '50%',
                marginLeft: -(catetoA * scale) / 2 - catetoB * scale, 
                marginTop: -(catetoB * scale) / 2,
                width: catetoB * scale, height: catetoB * scale 
            }}
        >
            <motion.div 
                animate={{ height: `${100 - llenado}%` }}
                className="absolute bottom-0 left-0 w-full bg-blue-500/40 backdrop-blur-sm"
            />
            <div className="absolute inset-0 flex items-center justify-center font-black text-blue-400/20 text-2xl uppercase select-none">b²</div>
        </motion.div>

        {/* CUADRADO C (Hipotenusa) */}
        <motion.div 
            layout
            className="absolute border-2 border-blue-400 shadow-[0_0_30px_rgba(33,158,188,0.2)] bg-blue-500/5 overflow-hidden origin-top-left"
            style={{ 
                left: '50%', top: '50%',
                marginLeft: -(catetoA * scale) / 2, 
                marginTop: -(catetoB * scale) / 2,
                width: realC * scale, height: realC * scale,
                rotate: -angleDeg
            }}
        >
            <motion.div 
                animate={{ height: `${llenado}%` }}
                className="absolute bottom-0 left-0 w-full bg-blue-500/60 backdrop-blur-md border-t border-blue-300"
            />
            <div className="absolute inset-0 flex items-center justify-center font-black text-blue-400/40 text-4xl uppercase select-none">c²</div>
            {/* Glow effect on water surface */}
            <motion.div 
                animate={{ opacity: llenado > 0 ? 1 : 0, bottom: `${llenado}%` }}
                className="absolute left-0 w-full h-1 bg-white/40 blur-sm z-20"
            />
        </motion.div>

        {/* Partículas de "energía" fluyendo */}
        <AnimatePresence>
            {llenado > 0 && llenado < 100 && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute z-30 pointer-events-none">
                        {/* Stream from A to C */}
                        <motion.div 
                            animate={{ x: [0, 50], y: [0, -50], opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-1 h-1 bg-blue-300 rounded-full"
                            style={{ left: '50%', top: '70%' }}
                        />
                         <motion.div 
                            animate={{ x: [-50, 0], y: [0, -50], opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
                            className="w-1 h-1 bg-blue-300 rounded-full"
                            style={{ left: '30%', top: '50%' }}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
      </motion.div>

      {/* Floating HUD Labels */}
      <div className="absolute bottom-10 left-10 space-y-2">
         <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3 px-5 rounded-2xl">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Dinámico: {llenado === 100 ? 'Transferencia Completa' : llenado > 0 ? 'Transfiriendo Áreas...' : 'Reposo Escalar'}</span>
         </div>
      </div>

      <div className="absolute top-10 right-10 flex flex-col items-end gap-2">
         <span className="text-[10px] font-black text-blue-400/60 uppercase tracking-widest">Lienzo_Pitagoras_v4.0</span>
         <div className="h-0.5 w-12 bg-blue-500/30" />
      </div>

      {/* Water Flow Animation HUD overlay */}
      <AnimatePresence>
        {llenado > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="absolute inset-0 pointer-events-none border-[16px] border-blue-500/10 pointer-events-none z-50" 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
