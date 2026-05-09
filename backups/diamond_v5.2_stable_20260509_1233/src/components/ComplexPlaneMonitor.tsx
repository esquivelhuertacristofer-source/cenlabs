/**
 * ComplexPlaneMonitor.tsx
 * Plano de Argand mejorado — Nivel Licenciatura.
 * Muestra raíces complejas en notación cartesiana Y polar (módulo y argumento).
 */
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Root } from '@/utils/mathEngine';

interface ComplexPlaneMonitorProps {
  roots: Root[];
  isVisible: boolean;
}

export default function ComplexPlaneMonitor({ roots, isVisible }: ComplexPlaneMonitorProps) {
  if (!isVisible || roots.length === 0) return null;

  const unit = 16;
  const ctr  = 75; // center of 150×150 canvas

  // Tomamos la raíz con parte imaginaria positiva para la notación polar
  const root = roots.find(r => r.imaginary > 0) ?? roots[0];
  const modulus  = Math.sqrt(root.real ** 2 + root.imaginary ** 2);
  const argDeg   = Math.atan2(root.imaginary, root.real) * (180 / Math.PI);
  const argRad   = Math.atan2(root.imaginary, root.real);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-black/60 backdrop-blur-2xl rounded-[2rem] border border-cyan-500/25 p-4 flex flex-col shadow-2xl w-52"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[8px] font-black text-cyan-400 uppercase tracking-widest">Plano de Argand (ℂ)</span>
        <span className="text-[7px] font-bold text-slate-600 border border-slate-700 px-1.5 py-0.5 rounded-full">Δ &lt; 0</span>
      </div>

      {/* ── GRÁFICO SVG ── */}
      <div className="relative rounded-xl overflow-hidden border border-white/5 mb-3 bg-black/30">
        <svg viewBox={`0 0 ${ctr * 2} ${ctr * 2}`} width="100%" height="150">
          {/* Cuadrícula fina */}
          {[-3, -2, -1, 1, 2, 3].map(v => (
            <g key={v}>
              <line x1={ctr + v * unit} y1="0" x2={ctr + v * unit} y2={ctr * 2} stroke="white" strokeWidth="0.4" opacity="0.07" />
              <line x1="0" y1={ctr + v * unit} x2={ctr * 2} y2={ctr + v * unit} stroke="white" strokeWidth="0.4" opacity="0.07" />
            </g>
          ))}

          {/* Ejes */}
          <line x1="0" y1={ctr} x2={ctr * 2} y2={ctr} stroke="white" strokeWidth="1" opacity="0.2" />
          <line x1={ctr} y1="0" x2={ctr} y2={ctr * 2} stroke="white" strokeWidth="1" opacity="0.2" />

          {/* Etiquetas de ejes */}
          <text x={ctr * 2 - 10} y={ctr - 5} fill="white" fontSize="7" opacity="0.35" fontFamily="monospace">Re</text>
          <text x={ctr + 4} y="12" fill="white" fontSize="7" opacity="0.35" fontFamily="monospace">Im</text>

          {/* Líneas de módulo (del origen a cada raíz) */}
          {roots.map((r, i) => (
            <line
              key={`mod-${i}`}
              x1={ctr} y1={ctr}
              x2={ctr + r.real * unit} y2={ctr - r.imaginary * unit}
              stroke="#22d3ee" strokeWidth="1" opacity="0.35" strokeDasharray="3 2"
            />
          ))}

          {/* Arco del ángulo */}
          <path
            d={`M ${ctr + 15} ${ctr} A 15 15 0 0 ${root.imaginary > 0 ? 0 : 1} ${ctr + 15 * Math.cos(argRad)} ${ctr - 15 * Math.sin(argRad)}`}
            fill="none" stroke="#FB8500" strokeWidth="1" opacity="0.5"
          />
          <text
            x={ctr + 18 * Math.cos(argRad / 2)}
            y={ctr - 18 * Math.sin(argRad / 2) + 3}
            fill="#FB8500" fontSize="7" opacity="0.7" fontFamily="monospace"
          >
            θ
          </text>

          {/* Puntos de las raíces */}
          {roots.map((r, i) => {
            const px = ctr + r.real * unit;
            const py = ctr - r.imaginary * unit;
            return (
              <g key={`pt-${i}`}>
                <circle cx={px} cy={py} r="6" fill="#f43f5e" opacity="0.2" />
                <motion.circle
                  cx={px} cy={py} r="3.5" fill="#f43f5e"
                  animate={{ r: [2.5, 3.5, 2.5] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
                />
                <text
                  x={px + 6} y={py - 5}
                  fill="#f43f5e" fontSize="7.5" fontFamily="monospace" fontWeight="900" opacity="0.9"
                >
                  z{i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* ── NOTACIÓN CARTESIANA ── */}
      <div className="space-y-1 mb-3">
        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Forma Cartesiana</span>
        {roots.map((r, i) => (
          <div key={i} className="text-[9px] font-black font-mono flex gap-1">
            <span className="text-slate-500">z{i + 1} =</span>
            <span className="text-white">{r.real.toFixed(2)}</span>
            <span className="text-cyan-400">{r.imaginary >= 0 ? '+' : '−'}</span>
            <span className="text-white">{Math.abs(r.imaginary).toFixed(2)}i</span>
          </div>
        ))}
      </div>

      {/* ── NOTACIÓN POLAR ── */}
      <div className="border-t border-white/5 pt-3 space-y-1.5">
        <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block">Notación Polar</span>
        <div className="text-[9px] font-black font-mono flex gap-1">
          <span className="text-slate-500">|z| =</span>
          <span className="text-amber-400">{modulus.toFixed(4)}</span>
        </div>
        <div className="text-[9px] font-black font-mono flex gap-1">
          <span className="text-slate-500">θ =</span>
          <span className="text-amber-400">{argDeg.toFixed(2)}°</span>
          <span className="text-slate-600 text-[8px] ml-1">({argRad.toFixed(3)} rad)</span>
        </div>
        <div className="text-[9px] font-black font-mono text-amber-300/60 mt-1">
          z = {modulus.toFixed(2)} · e^(i · {argDeg.toFixed(1)}°)
        </div>
      </div>
    </motion.div>
  );
}
