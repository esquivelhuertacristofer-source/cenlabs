"use client";

import React, { useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function PilotoRiemann() {
  const { integral9, setIntegralM9, setAnimandoM9 } = useSimuladorStore();
  const { n, metodo, animandoLimite } = integral9;

  // Animación de Límite (Incremento automático de N)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (animandoLimite) {
      interval = setInterval(() => {
        setIntegralM9(Math.min(100, n + 1), metodo);
        if (n >= 100) setAnimandoM9(false);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [animandoLimite, n, metodo, setIntegralM9, setAnimandoM9]);

  // Plano Cartesiano
  const width = 800;
  const height = 600;
  
  // Rango X: [-1, 11] (12 unidades)
  const scaleX = width / 12;
  const offsetX = scaleX;

  // Rango Y: [0, 30] (30 unidades)
  const scaleY = height / 30;
  const bottomY = height;

  // Funciones Matemáticas
  const f = (x: number) => -Math.pow(x, 2) + 10 * x;
  const dx = 10 / n;

  // Conversión a coordenadas de pantalla (Invertir Y)
  const toPX = (x: number) => offsetX + x * scaleX;
  const toPY = (y: number) => bottomY - y * scaleY;

  // Generar puntos de la parábola
  const points = [];
  for (let x = 0; x <= 10; x += 0.2) {
    points.push(`${toPX(x)},${toPY(f(x))}`);
  }
  const curvePath = `M ${toPX(0)},${toPY(0)} L ${points.join(" L ")} L ${toPX(10)},${toPY(0)}`;

  // Generar Rectángulos de Riemann
  const rects = [];
  for (let i = 0; i < n; i++) {
    let x_eval = 0;
    if (metodo === 'izquierda') x_eval = i * dx;
    else if (metodo === 'derecha') x_eval = (i + 1) * dx;
    else x_eval = i * dx + dx / 2; // Punto Medio
    
    const h = f(x_eval);
    const rectX = i * dx;
    
    rects.push({
      x: toPX(rectX),
      y: toPY(h),
      w: dx * scaleX,
      h: h * scaleY,
      id: i
    });
  }

  return (
    <div className="w-full h-full bg-[#020617] relative flex items-center justify-center overflow-hidden">
      {/* Background HUD Grid */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ 
               backgroundImage: `linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)`, 
               backgroundSize: `${scaleX}px ${scaleY}px`,
               backgroundPosition: `${offsetX}px ${bottomY}px`
           }} />

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="relative z-10 w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.1)]"
      >
        {/* EJES CARTESIANOS */}
        <g stroke="rgba(255,255,255,0.2)" strokeWidth="1">
            <line x1="0" y1={bottomY} x2={width} y2={bottomY} />
            <line x1={offsetX} y1={0} x2={offsetX} y2={height} />
        </g>

        {/* LABELS DE X */}
        <g fill="rgba(255,255,255,0.2)" fontSize="10" fontWeight="black" textAnchor="middle">
            {[0, 2, 4, 6, 8, 10].map(val => (
                <text key={val} x={toPX(val)} y={bottomY - 10}>{val}</text>
            ))}
        </g>

        {/* RECTÁNGULOS DE RIEMANN */}
        <g>
            {rects.map((r) => (
                <motion.rect
                    key={r.id}
                    layoutId={`rect-${r.id}`}
                    initial={false}
                    animate={{ x: r.x, y: r.y, width: r.w, height: r.h }}
                    fill="rgba(16, 185, 129, 0.2)"
                    stroke="rgba(16, 185, 129, 0.5)"
                    strokeWidth={n > 50 ? "0.5" : "1"}
                />
            ))}
        </g>

        {/* CURVA f(x) (EL DOMO) */}
        <path 
            d={curvePath} 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="4" 
            strokeLinecap="round"
            className="drop-shadow-[0_0_12px_#10b981]"
        />

        {/* PUNTOS DE MUESTRA (Solo si n es pequeño para no saturar) */}
        {n < 30 && rects.map((r, idx) => (
            <circle 
                key={`dot-${idx}`}
                cx={metodo === 'izquierda' ? r.x : metodo === 'derecha' ? r.x + r.w : r.x + r.w/2}
                cy={r.y}
                r="3"
                fill="white"
                opacity="0.6"
            />
        ))}

        {/* INDICADOR DE LÍMITE */}
        <AnimatePresence>
            {animandoLimite && (
                <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <text x={toPX(5)} y={toPY(28)} textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="black" className="uppercase tracking-[0.4em]">
                        n → ∞ | Integral de Área
                    </text>
                </motion.g>
            )}
        </AnimatePresence>
      </svg>

      {/* Floating HUD Labels */}
      <div className="absolute top-10 left-10 flex flex-col gap-1">
         <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Riemann_Integration_Engine_v9.0</span>
         <div className="h-0.5 w-full bg-emerald-500/20" />
      </div>

      <div className="absolute bottom-10 right-10 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex gap-6">
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Ancho Δx</span>
              <span className="text-xs font-bold text-white tracking-widest">
                {dx.toFixed(3)}
              </span>
          </div>
          <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase">Resolución</span>
              <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">
                {n >= 50 ? 'ALTA_FIDELIDAD' : 'BAJA_FIDELIDAD'}
              </span>
          </div>
      </div>
    </div>
  );
}
