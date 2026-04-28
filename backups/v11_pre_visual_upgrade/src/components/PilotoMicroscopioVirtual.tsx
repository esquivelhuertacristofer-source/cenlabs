"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { OBJECTIVES, calculateAbbeLimit, calculateTotalMagnification, calculateFocusBlur } from '@/utils/opticEngine';

export default function PilotoMicroscopioVirtual() {
  const { microscopio } = useSimuladorStore();
  const { 
    muestra = 'vegetal', objetivoMag = 4, enfoqueZ = 0, focoIdealZ = 50, iluminacion = 50, 
    diafragmaIris = 100, aceiteInmersionAplicado = false,
    posicionX = 0, posicionY = 0 
  } = microscopio || {};

  const safeObjMag = (OBJECTIVES[objetivoMag as keyof typeof OBJECTIVES] ? objetivoMag : 4) as keyof typeof OBJECTIVES;
  const currentObj = OBJECTIVES[safeObjMag];
  
  // Real-time calculated specs
  const totalMag = calculateTotalMagnification(safeObjMag);
  const abbeLimit = calculateAbbeLimit(currentObj.na, safeObjMag === 100, aceiteInmersionAplicado);
  
  // Z-Stacking (Multi-layered focal points)
  const blurSurface = calculateFocusBlur(enfoqueZ || 0, focoIdealZ || 50, currentObj.dof);
  const blurDeep = calculateFocusBlur(enfoqueZ || 0, (focoIdealZ || 50) - 12, currentObj.dof);

  // Determinar el background
  const bgImage = useMemo(() => {
    switch(muestra) {
      case 'vegetal': return '/assets/bio/plant_cells.png';
      case 'animal': return '/assets/bio/animal_cells.png';
      case 'bacteria': return '/assets/bio/bacteria_sample.png';
      case 'nervioso': return '/assets/bio/nerve_sample.png';
      default: return '/assets/bio/plant_cells.png';
    }
  }, [muestra]);

  // Escala visual (Simulación Logarítmica para que el salto de 4x a 100x no rompa los límites del CSS)
  // 4x -> 1
  // 10x -> 2.5
  // 40x -> 10
  // 100x -> 25
  const scaleValue = useMemo(() => {
    return safeObjMag / 4;
  }, [safeObjMag]);

  // Simulamos la aberración cromática severa si falta aceite de inmersión en NA>1
  const severeAberration = (safeObjMag === 100 && !aceiteInmersionAplicado) 
    ? 'drop-shadow(6px 0 0 rgba(255,100,100,0.6)) drop-shadow(-6px 0 0 rgba(100,100,255,0.6)) contrast(0.5)' 
    : '';

  const chromaticAberration = (blurSurface > 2 && safeObjMag >= 40) 
    ? `drop-shadow(3px 0 0 rgba(255,0,0,0.4)) drop-shadow(-3px 0 0 rgba(0,0,255,0.4))` 
    : '';

  // Köhler Illumination: Diafragma Iris afecta el contraste inversamente a la apertura
  const irisContrast = 1 + ((100 - diafragmaIris) * 0.015); // Si está en 10 (cerrado), aumenta el contraste brutalmente
  const irisBrightness = (iluminacion / 100) * (diafragmaIris / 100); 

  // Estilo de iluminación (viñeta, diafragma y brillo)
  const lightStyle = {
    filter: `brightness(${irisBrightness}) contrast(${irisContrast}) saturate(1.2)`,
    background: `radial-gradient(circle, transparent 20%, rgba(0,0,0,${Math.max(0, 0.95 - irisBrightness)}) 80%)`,
  };

  // Simulación de "arrastre" de la platina (movimiento inverso)
  const platinaX = -posicionX * scaleValue;
  const platinaY = -posicionY * scaleValue;

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden cursor-move select-none">
      
      {/* ── MÁSCARA DEL OCULAR (Bordes negros circulares) ── */}
      <div className="absolute inset-0 z-50 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,1)] border-[60px] border-black rounded-full" />
      
      {/* ── RETÍCULA MICROMÉTRICA (Graticule) ── */}
      <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center opacity-30 mix-blend-difference">
        <svg viewBox="0 0 100 100" className="w-[800px] h-[800px]">
          {/* Eje X */}
          <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeWidth="0.2" />
          {/* Eje Y */}
          <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeWidth="0.2" />
          {/* Marcas de graduación centrales */}
          {Array.from({ length: 21 }).map((_, i) => {
            if (i === 10) return null; // Centro
            const pos = 30 + (i * 2);
            return (
              <g key={i}>
                <line x1={pos} y1="49" x2={pos} y2="51" stroke="white" strokeWidth="0.2" />
                <line x1="49" y1={pos} x2="51" y2={pos} stroke="white" strokeWidth="0.2" />
              </g>
            );
          })}
          {/* Círculos guía */}
          <circle cx="50" cy="50" r="10" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1,2" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="white" strokeWidth="0.1" strokeDasharray="1,2" />
        </svg>
      </div>

      {/* ── CONTENEDOR DE LA MUESTRA FOTORREALISTA ── */}
      <motion.div 
        className="relative w-[1500px] h-[1500px] flex items-center justify-center overflow-hidden"
        style={{ 
          willChange: 'transform, filter', 
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}
        animate={{ 
          scale: scaleValue,
          x: platinaX,
          y: platinaY,
        }}
        transition={{ type: 'spring', stiffness: 40, damping: 20 }}
      >
        {/* DEEP LAYER (Z-STACKING) */}
        <motion.div
           className="absolute w-[1800px] h-[1800px] bg-center bg-repeat opacity-50 rotate-180"
           style={{
             backgroundImage: `url('${bgImage}')`,
             backgroundSize: '1000px 1000px',
             filter: `blur(${blurDeep}px) ${chromaticAberration} ${severeAberration}`
           }}
           animate={{
              filter: `blur(${blurDeep}px) ${chromaticAberration} ${severeAberration}`
           }}
           transition={{ duration: 0.2 }}
        />

        {/* SURFACE LAYER (Foco Primario) */}
        <motion.div
           className="w-full h-full bg-center bg-repeat"
           style={{
             backgroundImage: `url('${bgImage}')`,
             backgroundSize: '800px 800px',
             filter: `blur(${blurSurface}px) ${chromaticAberration} ${severeAberration}`
           }}
           animate={{
              filter: `blur(${blurSurface}px) ${chromaticAberration} ${severeAberration}`
           }}
           transition={{ duration: 0.2 }}
        />

        {/* BROWNIAN MOTION DEBRIS (Living particles overlay) */}
        <motion.div
           className="absolute w-[3000px] h-[3000px] bg-repeat opacity-60 pointer-events-none"
           style={{
             backgroundImage: 'url("https://www.transparenttextures.com/patterns/stardust.png")',
             backgroundSize: '200px 200px',
             filter: `blur(${blurSurface + 1}px) invert(1)`
           }}
           animate={{
             backgroundPosition: ['0% 0%', '100% 50%', '50% 100%', '0% 0%']
           }}
           transition={{ duration: 250, repeat: Infinity, ease: 'linear' }}
        />

        {/* Polvo en la lente (Inmóvil respecto al objetivo) */}
        <div className="absolute inset-0 pointer-events-none opacity-20"
             style={{ 
               backgroundImage: 'url("https://www.transparenttextures.com/patterns/dust.png")',
               filter: `blur(${Math.max(0, 5 - blurSurface)}px)` // Si enfocas la muestra, desenfocas el polvo de la lente
             }} 
        />
      </motion.div>

      {/* ── FILTRO DE ILUMINACIÓN Y VIÑETA (Condensador) ── */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-500 z-30"
        style={lightStyle}
      />

      {/* ── HUD DE TELEMETRÍA CIENTÍFICA ── */}
      <div className="absolute top-8 left-8 p-4 bg-black/60 backdrop-blur-md border border-emerald-500/30 rounded-xl font-mono text-[10px] text-emerald-400 z-[60]">
        <div className="flex items-center gap-2 mb-3 border-b border-emerald-500/30 pb-2">
          <div className={`w-2 h-2 rounded-full ${blurSurface < 0.5 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="font-bold tracking-widest">{blurSurface < 0.5 ? 'FOCAL LOCK SECURED' : 'OUT OF FOCUS'}</span>
        </div>
        
        <div className="space-y-1.5 opacity-90">
          <div className="flex justify-between gap-6">
            <span className="text-emerald-500/70">SPECIMEN:</span>
            <span className="uppercase text-white font-bold">{muestra}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-emerald-500/70">OBJECTIVE:</span>
            <span className="text-white font-bold">{safeObjMag}x (NA {currentObj.na.toFixed(2)})</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-emerald-500/70">TOTAL MAG:</span>
            <span className="text-emerald-300 font-bold">{totalMag}x</span>
          </div>
          <div className="flex justify-between gap-6 mt-2 pt-2 border-t border-emerald-500/20">
            <span className="text-emerald-500/70">ABBE LIMIT (d):</span>
            <span className="text-teal-300 font-bold">{abbeLimit.toFixed(1)} nm</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-emerald-500/70">Z-PLANE:</span>
            <span className="text-white font-bold">{enfoqueZ.toFixed(2)} µm</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-emerald-500/70">LUMENS:</span>
            <span className="text-white font-bold">{iluminacion}%</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
