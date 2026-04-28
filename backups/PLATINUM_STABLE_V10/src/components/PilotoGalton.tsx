"use client";

import React, { useMemo } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion } from 'framer-motion';

export default function PilotoGalton() {
  const { galton10 } = useSimuladorStore();
  const { probabilidad, contenedores } = galton10;

  const totalBolitas = contenedores.reduce((a, b) => a + b, 0);
  const n_rows = 10;
  const n_bins = n_rows + 1;

  // Parámetros de Dibujo
  const svgW = 800;
  const svgH = 600;
  const margin = 80;
  const usableW = svgW - margin * 2;
  const binW = usableW / n_bins;
  const bottomY = svgH - 50;
  const triangleTopY = 100;
  const binHMax = 200;

  // Generar Posiciones de Clavos (Triángulo intercalado)
  const pegs = useMemo(() => {
    const p = [];
    for (let row = 0; row < n_rows; row++) {
      const rowY = triangleTopY + (row * (usableW / n_rows)) * 0.4;
      const rowWidth = (row + 1) * binW;
      const startX = svgW / 2 - rowWidth / 2 + binW / 2;
      for (let i = 0; i <= row; i++) {
        p.push({ x: startX + i * binW, y: rowY, id: `peg-${row}-${i}` });
      }
    }
    return p;
  }, [usableW, binW, n_rows, svgW]);

  // Generar Curva de Gauss Teórica
  const mu = n_rows * probabilidad;
  const sigma = Math.sqrt(n_rows * probabilidad * (1 - probabilidad));
  
  const gaussPoints = useMemo(() => {
    const pts = [];
    if (sigma === 0) return "";
    for (let x = -0.5; x <= n_rows + 0.5; x += 0.1) {
      // Fórmula de Densidad Normal
      const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
      const y = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
      
      // Mapeo a pantalla (Escalado para que quepa en binHMax)
      // El valor máximo de la normal es en mu: 1 / (sigma * sqrt(2pi))
      const yNorm = y / (1 / (sigma * Math.sqrt(2 * Math.PI)));
      pts.push(`${margin + (x + 0.5) * binW},${bottomY - yNorm * binHMax}`);
    }
    return `M ${pts.join(" L ")}`;
  }, [mu, sigma, margin, binW, bottomY, n_rows, binHMax]);

  return (
    <div className="w-full h-full bg-[#020617] relative flex items-center justify-center overflow-hidden">
      {/* Background HUD Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ 
               backgroundImage: `linear-gradient(#f59e0b 1px, transparent 1px), linear-gradient(90deg, #f59e0b 1px, transparent 1px)`, 
               backgroundSize: `40px 40px`,
           }} />

      <svg 
        viewBox={`0 0 ${svgW} ${svgH}`} 
        className="relative z-10 w-full h-full drop-shadow-[0_0_15px_rgba(245,158,11,0.05)]"
      >
        {/* CLAVOS (PEGS) */}
        {pegs.map(peg => (
            <circle 
                key={peg.id} 
                cx={peg.x} 
                cy={peg.y} 
                r="3" 
                fill="rgba(255,255,255,0.4)" 
                className="drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]"
            />
        ))}

        {/* CONTENEDORES (BINS) */}
        <g stroke="rgba(255,255,255,0.1)" strokeWidth="1">
            {new Array(n_bins + 1).fill(0).map((_, i) => (
                <line 
                    key={`line-${i}`}
                    x1={margin + i * binW} y1={bottomY} 
                    x2={margin + i * binW} y2={bottomY - binHMax - 20} 
                />
            ))}
            <line x1={margin} y1={bottomY} x2={svgW - margin} y2={bottomY} strokeWidth="2" stroke="white" opacity="0.2" />
        </g>

        {/* HISTOGRAMA DE BOLITAS */}
        <g>
            {contenedores.map((count, i) => {
                // Cálculo de altura proporcional al máximo de la distribución o al contenedor más alto
                const maxInBins = Math.max(...contenedores, 1);
                const h = totalBolitas === 0 ? 0 : (count / maxInBins) * binHMax;
                
                return (
                    <motion.rect
                        key={`bin-${i}`}
                        initial={false}
                        animate={{ height: h, y: bottomY - h }}
                        x={margin + i * binW + 4}
                        width={binW - 8}
                        fill="url(#galtonGradient)"
                        rx="4"
                        className="drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    />
                );
            })}
        </g>

        {/* CAMPANA DE GAUSS FANTASMA */}
        <motion.path 
            initial={{ opacity: 0 }}
            animate={{ opacity: totalBolitas > 20 ? 0.6 : 0.1 }}
            d={gaussPoints}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="5 5"
            className="drop-shadow-[0_0_12px_#f59e0b]"
        />

        {/* DECORACIÓN HUD */}
        <text x={svgW / 2} y={50} textAnchor="middle" fill="white" fillOpacity="0.4" fontSize="12" fontWeight="black" className="uppercase tracking-[0.5em]">
           Máquina de Galton - Distribución Binomial
        </text>

        {/* GRADIENTES */}
        <defs>
            <linearGradient id="galtonGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
        </defs>

        {/* INDICADORES DE BINS (X-AXIS) */}
        <g fill="rgba(255,255,255,0.3)" fontSize="8" fontWeight="bold" textAnchor="middle">
            {contenedores.map((_, i) => (
                <text key={`lbl-${i}`} x={margin + i * binW + binW/2} y={bottomY + 15}>
                    {i}
                </text>
            ))}
        </g>

        {/* MENSAJE DE ESTADO */}
        {totalBolitas > 0 && totalBolitas < 100 && (
            <text x={svgW - margin} y={bottomY - binHMax - 40} textAnchor="end" fill="#f59e0b" fontSize="10" fontWeight="black" className="uppercase animate-pulse italic">
                Aumentando Muestra...
            </text>
        )}
      </svg>

      {/* Floating HUD Labels */}
      <div className="absolute top-10 left-10 flex flex-col gap-1">
         <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Central_Limit_Theorem_Platform</span>
         <div className="h-0.5 w-full bg-amber-500/20" />
      </div>

      <div className="absolute bottom-10 right-10 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex gap-6">
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">n Total</span>
              <span className="text-xs font-bold text-white tracking-widest">
                {totalBolitas.toLocaleString()} esferas
              </span>
          </div>
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Probabilidad Actual</span>
              <span className="text-xs font-bold text-amber-400 tracking-widest uppercase">
                {(probabilidad * 100).toFixed(1)}% Derecha
              </span>
          </div>
      </div>
    </div>
  );
}
