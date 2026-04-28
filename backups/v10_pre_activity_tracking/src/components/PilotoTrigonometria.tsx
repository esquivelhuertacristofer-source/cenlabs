"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function PilotoTrigonometria() {
  const { trigonometria, setAnguloM5 } = useSimuladorStore();
  const { angulo, animando, verSeno, verCoseno } = trigonometria;
  
  const requestRef = useRef<number>(0);

  const animate = (time: number) => {
    if (animando) {
      setAnguloM5((angulo + 1) % 360);
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [animando, angulo]);

  // Dimensiones del lienzo SVG
  const width = 800;
  const height = 400;
  
  const circleCX = 200;
  const circleCY = 200;
  const radius = 120;
  
  const graphStartX = 400;
  const graphWidth = 360; // 1 pixel per degree
  
  // Coordenadas del punto en el círculo
  const rad = (angulo * Math.PI) / 180;
  const px = circleCX + radius * Math.cos(rad);
  const py = circleCY - radius * Math.sin(rad); // Minus because SVG Y is down

  // Trayectorias de las ondas (Pre-calculadas para el trazo)
  const sinePath = useMemo(() => {
    let d = `M ${graphStartX},${circleCY}`;
    for (let i = 0; i <= 360; i++) {
        const r = (i * Math.PI) / 180;
        const x = graphStartX + i;
        const y = circleCY - radius * Math.sin(r);
        d += ` L ${x},${y}`;
    }
    return d;
  }, [radius, circleCY, graphStartX]);

  const cosinePath = useMemo(() => {
    let d = `M ${graphStartX},${circleCY - radius}`;
    for (let i = 0; i <= 360; i++) {
        const r = (i * Math.PI) / 180;
        const x = graphStartX + i;
        const y = circleCY - radius * Math.cos(r);
        d += ` L ${x},${y}`;
    }
    return d;
  }, [radius, circleCY, graphStartX]);

  return (
    <div className="w-full h-full bg-[#020617] relative flex items-center justify-center overflow-hidden">
      {/* Background HUD */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#0ea5e9 1px, transparent 1px), linear-gradient(90deg, #0ea5e9 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="relative z-10 w-[95%] h-[95%] drop-shadow-[0_0_20px_rgba(14,165,233,0.1)]"
      >
        {/* GUÍAS Y EJES */}
        <g stroke="rgba(255,255,255,0.05)" strokeWidth="1">
            {/* Ejes Círculo */}
            <line x1={circleCX - radius - 20} y1={circleCY} x2={circleCX + radius + 20} y2={circleCY} />
            <line x1={circleCX} y1={circleCY - radius - 20} x2={circleCX} y2={circleCY + radius + 20} />
            {/* Ejes Gráfica */}
            <line x1={graphStartX} y1={circleCY} x2={graphStartX + graphWidth + 20} y2={circleCY} />
            <line x1={graphStartX} y1={circleCY - radius - 10} x2={graphStartX} y2={circleCY + radius + 10} stroke="rgba(255,255,255,0.2)" />
        </g>

        {/* CÍRCULO UNITARIO */}
        <circle cx={circleCX} cy={circleCY} r={radius} fill="none" stroke="rgba(14,165,233,0.2)" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* ONDAS ESTÁTICAS (Guía) */}
        {verSeno && <path d={sinePath} fill="none" stroke="rgba(34,211,238,0.1)" strokeWidth="2" />}
        {verCoseno && <path d={cosinePath} fill="none" stroke="rgba(232,121,249,0.1)" strokeWidth="2" />}

        {/* ONDAS ACTIVAS (Progreso) */}
        {verSeno && (
          <path 
            d={sinePath} 
            fill="none" 
            stroke="#22d3ee" 
            strokeWidth="3" 
            strokeDasharray={`${angulo} 1000`}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_#22d3ee]"
          />
        )}
        {verCoseno && (
          <path 
            d={cosinePath} 
            fill="none" 
            stroke="#e879f9" 
            strokeWidth="3" 
            strokeDasharray={`${angulo} 1000`}
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_#e879f9]"
          />
        )}

        {/* LÁSERES DE PROYECCIÓN */}
        {verSeno && (
            <g>
                {/* Proyección Vertical en Círculo */}
                <line x1={px} y1={circleCY} x2={px} y2={py} stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                {/* Láser Horizontal hacia Gráfica */}
                <line 
                    x1={px} y1={py} 
                    x2={graphStartX + angulo} y2={py} 
                    stroke="#22d3ee" strokeWidth="2" strokeDasharray="5 5"
                    className="animate-pulse"
                />
                <circle cx={graphStartX + angulo} cy={py} r={4} fill="#22d3ee" className="drop-shadow-[0_0_5px_#22d3ee]" />
            </g>
        )}

        {verCoseno && (
            <g>
                {/* Proyección Horizontal en Círculo */}
                <line x1={circleCX} y1={py} x2={px} y2={py} stroke="#e879f9" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                {/* Láser desde base X hacia Gráfica (Mapeo visual: X del círculo -> Y de la gráfica) */}
                <line 
                    x1={px} y1={py} 
                    x2={graphStartX + angulo} y2={circleCY - (px - circleCX)} 
                    stroke="#e879f9" strokeWidth="2" strokeDasharray="5 5"
                    opacity="0.3"
                />
                <circle cx={graphStartX + angulo} cy={circleCY - radius * Math.cos(rad)} r={4} fill="#e879f9" className="drop-shadow-[0_0_5px_#e879f9]" />
            </g>
        )}

        {/* VECTOR GIRATORIO */}
        <g strokeLinecap="round">
            {/* Sombras del vector */}
            <line x1={circleCX} y1={circleCY} x2={px} y2={py} stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <line x1={circleCX} y1={circleCY} x2={px} y2={py} stroke="white" strokeWidth="3" />
            <circle cx={px} cy={py} r={6} fill="white" className="drop-shadow-[0_0_10px_white]" />
            <circle cx={circleCX} cy={circleCY} r={4} fill="#0ea5e9" />
        </g>

        {/* LABELS DE EJES */}
        <g fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="black" textAnchor="middle">
            <text x={graphStartX + 90} y={circleCY + 15}>90°</text>
            <text x={graphStartX + 180} y={circleCY + 15}>180°</text>
            <text x={graphStartX + 270} y={circleCY + 15}>270°</text>
            <text x={graphStartX + 360} y={circleCY + 15}>360°</text>
            
            <text x={graphStartX - 15} y={circleCY - radius}>+1</text>
            <text x={graphStartX - 15} y={circleCY + radius}>-1</text>
            
            <text x={circleCX} y={circleCY - radius - 30} fill="#0ea5e9" fontSize="12">CÍRCULO UNITARIO</text>
            <text x={graphStartX + 180} y={circleCY - radius - 30} fill="#0ea5e9" fontSize="12">OSCILOSCOPIO DIGITAL</text>
        </g>
      </svg>

      {/* Floating HUD Labels */}
      <div className="absolute top-10 left-10 flex flex-col gap-1">
         <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Trigonometric_Engine_v5.0</span>
         <div className="h-0.5 w-full bg-cyan-500/20" />
      </div>

      <div className="absolute bottom-10 right-10 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex gap-6">
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Frecuencia de Giro</span>
              <span className="text-xs font-bold text-white tracking-widest">{animando ? '60.00 Hz' : '0.00 Hz'}</span>
          </div>
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Modo de Escaneo</span>
              <span className="text-xs font-bold text-cyan-400 tracking-widest">{verSeno && verCoseno ? 'DUAL_WAVE' : verSeno ? 'SINE_ONLY' : 'COS_ONLY'}</span>
          </div>
      </div>
    </div>
  );
}
