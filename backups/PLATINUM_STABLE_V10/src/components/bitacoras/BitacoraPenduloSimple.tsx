"use client";

import React, { useMemo } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Timer, Ruler, Box, Zap, BarChart3, TrendingUp } from 'lucide-react';
import { calculateLinearRegression } from '@/utils/mathUtils';

interface BitacoraPenduloProps {
  activateAnalysis?: boolean;
}

export default function BitacoraPenduloSimple({ activateAnalysis = false }: BitacoraPenduloProps) {
  const { pendulo3, setPendulo3 } = useSimuladorStore();
  const { longitud = 2, masa = 1, anguloInicial = 45, animando = false, periodo = 0 } = pendulo3 || {};

  // Análisis Científico: Regresión de T² vs L
  // T = 2pi * sqrt(L/g) => T² = (4pi²/g) * L
  const regressionData = useMemo(() => {
    // Generamos puntos de referencia basados en la física real
    const points = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0].map(L => {
      const T = 2 * Math.PI * Math.sqrt(L / 9.81);
      return { x: L, y: T * T };
    });
    return calculateLinearRegression(points);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CONTROLES DE PÉNDULO */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Variables del Sistema</h3>
        
        {/* Longitud */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ruler size={14} className="text-[#219EBC]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Longitud (L)</span>
            </div>
            <span className="text-xl font-black text-[#023047]">{longitud.toFixed(1)} m</span>
          </div>
          <input 
            type="range" min="0.5" max="4" step="0.1" 
            value={longitud} 
            disabled={animando} 
            onChange={(e) => setPendulo3({ longitud: parseFloat(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#219EBC]" 
          />
        </div>

        {/* Masa */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box size={14} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Masa (m)</span>
            </div>
            <span className="text-xl font-black text-[#023047]">{masa} kg</span>
          </div>
          <input 
            type="range" min="0.1" max="5" step="0.1" 
            value={masa} 
            disabled={animando} 
            onChange={(e) => setPendulo3({ masa: parseFloat(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-400" 
          />
        </div>

        {/* ANÁLISIS CIENTÍFICO (SOLO SI SE ACTIVA) */}
        {activateAnalysis && regressionData && (
          <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl space-y-3 animate-in zoom-in-95">
             <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <TrendingUp size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Análisis de Regresión (T² vs L)</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-2xl border border-indigo-200">
                   <p className="text-[9px] font-black text-indigo-400 uppercase">Ecuación Ajustada</p>
                   <p className="text-xs font-mono font-black text-indigo-700">{regressionData.formula}</p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-indigo-200">
                   <p className="text-[9px] font-black text-indigo-400 uppercase">Precisión (R²)</p>
                   <p className="text-xs font-mono font-black text-indigo-700">{regressionData.r2.toFixed(4)}</p>
                </div>
             </div>
             <p className="text-[9px] font-bold text-indigo-400 italic">
               El modelo sugiere una aceleración gravitatoria g ≈ {(4 * Math.PI * Math.PI / regressionData.slope).toFixed(2)} m/s²
             </p>
          </div>
        )}
      </div>

      {/* TELEMETRÍA */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Periodo (T)</span>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black font-mono">{periodo > 0 ? periodo.toFixed(2) : '--'}</span>
               <span className="text-sm text-slate-400">s</span>
            </div>
         </div>
         <Timer size={32} className="text-[#8ECAE6] opacity-30" />
      </div>

      <button 
        onClick={() => setPendulo3({ animando: !animando })}
        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${animando ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-[#219EBC] text-white shadow-[#219EBC]/20'}`}
      >
        <Zap size={18} fill="white" /> {animando ? 'Detener Sistema' : 'Soltar Péndulo'}
      </button>

    </div>
  );
}
