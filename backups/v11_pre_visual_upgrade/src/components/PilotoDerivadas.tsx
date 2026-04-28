"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PilotoDerivadas() {
  const { derivada8 } = useSimuladorStore();
  const { xActual, mostrarDerivada, status } = derivada8;

  // Parámetros de escalado
  const width = 800;
  const height = 600;
  
  // Rango X: [-2, 6] (8 unidades totales)
  const scaleX = width / 8;
  const offsetX = 2 * scaleX; // Desplazamiento desde el borde izquierdo para el -2

  // Rango Y: [-5, 5] (10 unidades totales)
  const scaleY = height / 10;
  const centerY = height / 2;

  // Funciones Matemáticas
  const f = (x: number) => (1/3) * Math.pow(x, 3) - 2 * Math.pow(x, 2) + 3 * x;
  const df = (x: number) => Math.pow(x, 2) - 4 * x + 3;

  // Conversión a coordenadas de pantalla (Invertir Y)
  const toPX = (x: number) => offsetX + x * scaleX;
  const toPY = (y: number) => centerY - y * scaleY;

  // Generar puntos de la curva principal
  const points = [];
  for (let x = -2; x <= 6; x += 0.1) {
    points.push(`${toPX(x)},${toPY(f(x))}`);
  }
  const curvePath = `M ${points.join(" L ")}`;

  // Generar puntos de la derivada (Modo Instructor)
  const derivativePoints = [];
  if (mostrarDerivada) {
    for (let x = -2; x <= 6; x += 0.1) {
        derivativePoints.push(`${toPX(x)},${toPY(df(x))}`);
    }
  }
  const derivativePath = `M ${derivativePoints.join(" L ")}`;

  // Recta Tangente (Basada en m = df(xActual))
  const m = df(xActual);
  const yActual = f(xActual);
  
  // Dibujamos un segmento de longitud visual (ej. ±3 unidades de x)
  const xLeft = xActual - 3;
  const xRight = xActual + 3;
  const yLeft = yActual + m * (xLeft - xActual);
  const yRight = yActual + m * (xRight - xActual);

  const getTangentColor = () => {
    if (Math.abs(m) < 0.05) return '#f59e0b'; // Dorado brillante / Cyan
    if (m > 0) return '#10b981'; // Esmeralda (Sube)
    return '#ef4444'; // Rojo (Baja)
  };

  return (
    <div className="w-full h-full bg-[#020617] relative flex items-center justify-center overflow-hidden">
      {/* Background HUD Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ 
               backgroundImage: `linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)`, 
               backgroundSize: `${scaleX}px ${scaleY}px`,
               backgroundPosition: `${offsetX}px ${centerY}px`
           }} />

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="relative z-10 w-full h-full drop-shadow-[0_0_15px_rgba(99,102,241,0.1)]"
      >
        {/* EJES CARTESIANOS */}
        <g stroke="rgba(255,255,255,0.2)" strokeWidth="1">
            <line x1="0" y1={centerY} x2={width} y2={centerY} />
            <line x1={offsetX} y1="0" x2={offsetX} y2={height} />
        </g>

        {/* LABELS DE EJES */}
        <g fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="black" textAnchor="middle">
            {[-2, 0, 2, 4, 6].map(val => (
                <text key={val} x={toPX(val)} y={centerY + 15}>{val}</text>
            ))}
            {[-4, -2, 2, 4].map(val => (
                <text key={val} x={offsetX - 15} y={toPY(val) + 4}>{val}</text>
            ))}
        </g>

        {/* GRÁFICA DE LA DERIVADA (MODO INSTRUCTOR) */}
        <AnimatePresence>
            {mostrarDerivada && (
                <motion.path 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    d={derivativePath}
                    fill="none"
                    stroke="#a5b4fc"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                />
            )}
        </AnimatePresence>

        {/* CURVA PRINCIPAL f(x) */}
        <path 
            d={curvePath} 
            fill="none" 
            stroke="white" 
            strokeWidth="3" 
            strokeOpacity="0.4"
            strokeLinecap="round"
        />

        {/* RECTA TANGENTE DINÁMICA */}
        <motion.line 
            layout
            x1={toPX(xLeft)} y1={toPY(yLeft)} 
            x2={toPX(xRight)} y2={toPY(yRight)} 
            stroke={getTangentColor()} 
            strokeWidth={Math.abs(m) < 0.05 ? "4" : "2"} 
            className="drop-shadow-[0_0_10px_currentColor]"
            style={{ color: getTangentColor() }}
        />

        {/* PUNTO EXPLORADOR */}
        <motion.circle 
            cx={toPX(xActual)} 
            cy={toPY(yActual)} 
            r="6" 
            fill={getTangentColor()}
            className="drop-shadow-[0_0_12px_currentColor]"
            style={{ color: getTangentColor() }}
        />

        {/* TRIÁNGULO DE PENDIENTE (Delta Y / Delta X) */}
        {Math.abs(m) > 0.05 && (
            <g transform={`translate(${toPX(xActual + 0.2)}, ${toPY(yActual)})`} opacity="0.6">
                <path 
                    d={`M 0,0 L ${0.5 * scaleX},0 L ${0.5 * scaleX},${-m * 0.5 * scaleY} Z`} 
                    fill="rgba(255,255,255,0.05)" 
                    stroke="rgba(255,255,255,0.3)" 
                    strokeWidth="1" 
                />
                <text x="25" y={-m * 0.25 * scaleY} fill="white" fontSize="8" fontWeight="black" textAnchor="start">
                    m = {m.toFixed(2)}
                </text>
            </g>
        )}

        {/* INDICADORES DE CRÍTICO */}
        {status === 'success' && (
            <g transform={`translate(${toPX(xActual)}, ${toPY(yActual) - 40})`}>
                <motion.path 
                    initial={{ y: 0 }}
                    animate={{ y: -10 }}
                    transition={{ repeat: Infinity, duration: 0.5, repeatType: "reverse" }}
                    d="M 0,0 L -5,-10 L 5,-10 Z" 
                    fill="#f59e0b" 
                />
                <text y="-25" textAnchor="middle" fill="#f59e0b" fontSize="10" fontWeight="black" className="uppercase tracking-[0.2em]">
                    Punto Crítico Detectado
                </text>
            </g>
        )}
      </svg>

      {/* Floating HUD Labels */}
      <div className="absolute top-10 left-10 flex flex-col gap-1">
         <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Cálculo_Diferencial_Engine_v8.0</span>
         <div className="h-0.5 w-full bg-indigo-500/20" />
      </div>

      <div className="absolute bottom-10 right-10 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex gap-6">
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Tasa Instantánea</span>
              <span className={`text-xs font-bold tracking-widest ${Math.abs(m) < 0.05 ? 'text-cyan-400' : 'text-white'}`}>
                {m.toFixed(4)}
              </span>
          </div>
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Concavidad</span>
              <span className="text-xs font-bold text-indigo-400 tracking-widest">
                {2 * xActual - 4 > 0 ? 'CONVEXA ∪' : 'CÓNCAVA ∩'}
              </span>
          </div>
      </div>
    </div>
  );
}
