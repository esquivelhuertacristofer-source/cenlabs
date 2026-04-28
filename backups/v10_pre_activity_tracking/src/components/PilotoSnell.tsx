"use client";

import React, { useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PilotoSnell() {
  const { optica7, generarSemillaM7 } = useSimuladorStore();
  const { n1, n2, n2Misterio, anguloIncidencia, status } = optica7;

  useEffect(() => {
    generarSemillaM7();
  }, []);

  const width = 800;
  const height = 600;
  const cx = width / 2;
  const cy = height / 2;
  const beamLength = 400;

  // Parámetros Físicos
  const realN2 = n2 === 'misterio' ? n2Misterio : (n2 as number);
  const theta1Rad = (anguloIncidencia * Math.PI) / 180;
  
  // v2 = arcsin(n1/n2 * sin(v1))
  const sinTheta2 = (n1 / realN2) * Math.sin(theta1Rad);
  const isTIR = sinTheta2 > 1.0;
  const theta2Rad = isTIR ? 0 : Math.asin(sinTheta2);
  const theta2Deg = (theta2Rad * 180) / Math.PI;

  // Coordenadas de los rayos (Geometría Polar -> Cartesiana)
  // Rayo Incidente (Viene de arriba a la izquierda)
  const x1 = cx - beamLength * Math.sin(theta1Rad);
  const y1 = cy - beamLength * Math.cos(theta1Rad);

  // Rayo Refractado (Va hacia abajo a la derecha)
  const x2 = cx + beamLength * Math.sin(theta2Rad);
  const y2 = cy + beamLength * Math.cos(theta2Rad);

  // Rayo Reflejado (Rebota hacia arriba a la derecha)
  const x3 = cx + beamLength * Math.sin(theta1Rad);
  const y3 = cy - beamLength * Math.cos(theta1Rad);

  // Colores de los medios
  const getMediumColor = (n: number | string) => {
    if (n === 'misterio') return 'rgba(34, 211, 238, 0.15)'; // Cyan misterioso
    const val = n as number;
    if (val === 1.0) return 'rgba(255, 255, 255, 0.02)'; // Aire (Transparente)
    if (val === 1.33) return 'rgba(14, 165, 233, 0.1)'; // Agua (Azul)
    if (val === 1.50) return 'rgba(148, 163, 184, 0.15)'; // Vidrio (Gris)
    if (val === 2.42) return 'rgba(255, 255, 255, 0.1)'; // Diamante (Blanco)
    return 'rgba(255, 255, 255, 0.05)';
  };

  return (
    <div className="w-full h-full bg-[#020617] relative flex items-center justify-center overflow-hidden">
      {/* Background HUD Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="relative z-10 w-full h-full drop-shadow-[0_0_20px_rgba(14,165,233,0.1)]"
      >
        {/* MEDIOS (Rectángulos de fondo) */}
        <rect x="0" y="0" width={width} height={cy} fill={getMediumColor(n1)} stroke="rgba(255,255,255,0.05)" />
        <rect x="0" y={cy} width={width} height={cy} fill={getMediumColor(n2)} stroke="rgba(255,255,255,0.05)" />

        {/* INTERFAZ Y NORMAL */}
        <line x1="0" y1={cy} x2={width} y2={cy} stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="10 5" />
        <line x1={cx} y1="0" x2={cx} y2={height} stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="4 4" />

        {/* ARCOS DE ÁNGULOS */}
        <g stroke="rgba(255,255,255,0.2)" fill="none" strokeWidth="1">
            {/* Arco θ1 */}
            <path d={`M ${cx} ${cy - 60} A 60 60 0 0 0 ${cx - 60 * Math.sin(theta1Rad)} ${cy - 60 * Math.cos(theta1Rad)}`} />
            <text x={cx - 35} y={cy - 65} fill="white" fontSize="12" fontWeight="black" textAnchor="middle">θ₁</text>
            
            {/* Arco θ2 */}
            {!isTIR && (
                <g>
                   <path d={`M ${cx} ${cy + 60} A 60 60 0 0 1 ${cx + 60 * Math.sin(theta2Rad)} ${cy + 60 * Math.cos(theta2Rad)}`} />
                   <text x={cx + 35} y={cy + 75} fill="white" fontSize="12" fontWeight="black" textAnchor="middle">θ₂</text>
                </g>
            )}
        </g>

        {/* RAYOS LÁSER */}
        <g strokeLinecap="round">
            {/* Rayo Incidente */}
            <line x1={x1} y1={y1} x2={cx} y2={cy} stroke="#22d3ee" strokeWidth="4" className="drop-shadow-[0_0_8px_#22d3ee]" />
            <circle cx={x1} cy={y1} r={6} fill="#22d3ee" className="animate-pulse" />

            {/* Rayo Reflejado (Tenue) */}
            <line 
                x1={cx} y1={cy} x2={x3} y2={y3} 
                stroke="#22d3ee" 
                strokeWidth={isTIR ? "4" : "1"} 
                strokeOpacity={isTIR ? "1" : "0.3"} 
                className={isTIR ? "drop-shadow-[0_0_12px_#22d3ee]" : ""}
            />

            {/* Rayo Refractado */}
            {!isTIR && (
                <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#f472b6" strokeWidth="4" strokeOpacity="0.8" className="drop-shadow-[0_0_8px_#f472b6]" />
            )}
            
            {/* Punto de Colisión */}
            <circle cx={cx} cy={cy} r={5} fill="white" className="drop-shadow-[0_0_10px_white]" />
        </g>

        {/* FEEDBACK DE R.I.T. */}
        <AnimatePresence>
            {isTIR && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <rect x={cx + 10} y={cy - 40} width="160" height="30" rx="4" fill="rgba(239, 68, 68, 0.2)" stroke="rgba(239, 68, 68, 0.5)" />
                    <text x={cx + 20} y={cy - 20} fill="#f87171" fontSize="10" fontWeight="black" className="uppercase tracking-widest">
                        Reflexión Total Interna
                    </text>
                </motion.g>
            )}
        </AnimatePresence>

        {/* LABELS DE MEDIOS */}
        <g fill="rgba(255,255,255,0.4)" fontSize="10" fontWeight="black" textAnchor="end">
            <text x={width - 20} y={cy - 20} className="uppercase tracking-widest">Medio 1: {n1.toFixed(2)}</text>
            <text x={width - 20} y={cy + 30} className="uppercase tracking-widest">Medio 2: {n2 === 'misterio' ? '???' : (n2 as number).toFixed(2)}</text>
        </g>
      </svg>

      {/* Floating HUD Labels */}
      <div className="absolute top-10 left-10 flex flex-col gap-1">
         <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Refraction_Snell_Engine_v7.0</span>
         <div className="h-0.5 w-full bg-cyan-500/20" />
      </div>

      <div className="absolute bottom-10 right-10 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex gap-6">
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Velocidad v₂</span>
              <span className="text-xs font-bold text-white tracking-widest">{(1/realN2).toFixed(3)} c</span>
          </div>
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Ángulo Crítico</span>
              <span className="text-xs font-bold text-cyan-400 tracking-widest">
                {realN2 < n1 ? `${(Math.asin(realN2/n1) * 180 / Math.PI).toFixed(1)}°` : 'N/A'}
              </span>
          </div>
      </div>
    </div>
  );
}
