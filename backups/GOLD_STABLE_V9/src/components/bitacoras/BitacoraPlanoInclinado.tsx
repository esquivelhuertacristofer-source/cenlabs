"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { TrendingUp, Box, Zap, Settings } from 'lucide-react';

interface BitacoraPlanoProps {
  activateAnalysis?: boolean;
}

export default function BitacoraPlanoInclinado({ activateAnalysis = false }: BitacoraPlanoProps) {
  const { plano2, setPlano2 } = useSimuladorStore();
  const { angulo = 30, friccion = 0.1, masa = 5, animando = false } = plano2 || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CONTROLES DE PLANO */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Parámetros de Inclinación</h3>
        
        {/* Ángulo */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ángulo (θ)</span>
            <span className="text-xl font-black text-[#023047]">{angulo}°</span>
          </div>
          <input 
            type="range" min="0" max="60" step="1" 
            value={angulo} 
            disabled={animando} 
            onChange={(e) => setPlano2({ angulo: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#FB8500]" 
          />
        </div>

        {/* Fricción */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Coef. Rozamiento (μ)</span>
            <span className="text-xl font-black text-[#023047]">{friccion.toFixed(2)}</span>
          </div>
          <input 
            type="range" min="0" max="0.5" step="0.01" 
            value={friccion} 
            disabled={animando} 
            onChange={(e) => setPlano2({ friccion: parseFloat(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#219EBC]" 
          />
        </div>

        {/* Masa */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Masa del Bloque</span>
            <span className="text-xl font-black text-[#023047]">{masa} kg</span>
          </div>
          <input 
            type="range" min="1" max="20" step="1" 
            value={masa} 
            disabled={animando} 
            onChange={(e) => setPlano2({ masa: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-400" 
          />
        </div>
      </div>

      {/* Botón de Ejecución */}
      <button 
        onClick={() => setPlano2({ animando: true })}
        disabled={animando}
        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${animando ? 'bg-slate-100 text-slate-400' : 'bg-[#FB8500] text-white shadow-[#FB8500]/20'}`}
      >
        <Zap size={18} fill="white" /> Iniciar Descenso
      </button>

      {/* Info Física */}
      <div className="bg-slate-50 p-4 rounded-2xl">
         <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-[#219EBC]" />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fuerza Resultante</span>
         </div>
         <p className="text-[11px] font-bold text-slate-400 uppercase italic">
            F = m·g·sen(θ) - μ·m·g·cos(θ)
         </p>
      </div>

    </div>
  );
}
