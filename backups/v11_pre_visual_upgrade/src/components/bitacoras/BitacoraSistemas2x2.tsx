"use client";

import React, { useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Target, Activity, Zap, CheckCircle2, AlertCircle, Radar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraSistemas2x2() {
  const { sistemas2x2, setSistemasCoefsM2, validarM2, generarSemillaM2 } = useSimuladorStore();
  const { m1, b1, m2, b2, target, status } = sistemas2x2;

  useEffect(() => {
    if (target.x === 5 && target.y === 0) {
        generarSemillaM2();
    }
  }, []);

  // Motor Matemático de Intersección
  const isParallel = Math.abs(m1 - m2) < 0.001;
  const xi = !isParallel ? (b2 - b1) / (m1 - m2) : 0;
  const yi = !isParallel ? m1 * xi + b1 : 0;

  const isTargetLocked = !isParallel && Math.abs(xi - target.x) < 0.1 && Math.abs(yi - target.y) < 0.1;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400 opacity-10 blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
          <Radar size={14} className="animate-pulse" /> Triangulación de Satélite
        </div>
        <p className="text-xs font-bold text-slate-300 mb-4 leading-relaxed">
          Señal detectada en <span className="text-white font-black bg-white/10 px-2 py-0.5 rounded-lg ml-1">P({target.x}, {target.y})</span>. Ajusta las trayectorias L1 y L2 para interceptar la señal.
        </p>
      </div>

      {/* TRAYECTORIA 1 (CYAN) */}
      <div className="space-y-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h4 className="text-[11px] font-black uppercase text-cyan-600 tracking-widest flex items-center gap-2">
          <Activity size={14} /> Trayectoria 1 (L1)
        </h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
              <span>Pendiente m1</span>
              <span className="text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-lg">{m1.toFixed(1)}</span>
            </div>
            <input type="range" min="-5" max="5" step="0.5" value={m1} onChange={(e) => setSistemasCoefsM2(parseFloat(e.target.value), b1, m2, b2)} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
              <span>Ordenada b1</span>
              <span className="text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-lg">{b1}</span>
            </div>
            <input type="range" min="-10" max="10" step="1" value={b1} onChange={(e) => setSistemasCoefsM2(m1, parseInt(e.target.value), m2, b2)} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
          </div>
        </div>
      </div>

      {/* TRAYECTORIA 2 (FUCSIA) */}
      <div className="space-y-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h4 className="text-[11px] font-black uppercase text-fuchsia-600 tracking-widest flex items-center gap-2">
          <Zap size={14} /> Trayectoria 2 (L2)
        </h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
              <span>Pendiente m2</span>
              <span className="text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-lg">{m2.toFixed(1)}</span>
            </div>
            <input type="range" min="-5" max="5" step="0.5" value={m2} onChange={(e) => setSistemasCoefsM2(m1, b1, parseFloat(e.target.value), b2)} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
              <span>Ordenada b2</span>
              <span className="text-fuchsia-600 bg-fuchsia-50 px-2 py-0.5 rounded-lg">{b2}</span>
            </div>
            <input type="range" min="-10" max="10" step="1" value={b2} onChange={(e) => setSistemasCoefsM2(m1, b1, m2, parseInt(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
          </div>
        </div>
      </div>

      {/* TELEMETRÍA DEL RADAR */}
      <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 shadow-xl ${isTargetLocked ? 'bg-emerald-500 border-emerald-400 rotate-1' : 'bg-slate-900 border-white/10'}`}>
        <div className="flex items-center gap-2 mb-4">
           <Radar size={16} className={isTargetLocked ? 'text-white' : 'text-emerald-400'} />
           <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isTargetLocked ? 'text-white' : 'text-emerald-400'}`}>
             {isTargetLocked ? 'TARGET LOCKED' : 'Telemetría de Radar'}
           </h4>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-6">
            <div className={`p-4 rounded-2xl ${isTargetLocked ? 'bg-emerald-600/50' : 'bg-white/5'} backdrop-blur-md`}>
                <span className={`text-[8px] font-black uppercase block mb-1 ${isTargetLocked ? 'text-emerald-100' : 'text-slate-400'}`}>Intersección Actual</span>
                {!isParallel ? (
                   <span className="text-sm font-black text-white">({xi.toFixed(1)}, {yi.toFixed(1)})</span>
                ) : (
                   <span className="text-xs font-black text-red-400 uppercase tracking-tighter flex items-center gap-2">
                     <AlertCircle size={12} /> Trayectorias Paralelas
                   </span>
                )}
            </div>
        </div>

        <button 
          onClick={validarM2}
          disabled={isParallel}
          className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 ${
            isTargetLocked 
            ? 'bg-white text-emerald-600 shadow-2xl animate-bounce' 
            : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50'
          }`}
        >
          {isTargetLocked ? <><CheckCircle2 size={16} /> Triangular Posición</> : 'Alinear Señales'}
        </button>
      </div>
    </div>
  );
}
