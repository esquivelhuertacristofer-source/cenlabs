"use client";

import React, { useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Activity, Zap, CheckCircle2, AlertCircle, Info, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraRichter() {
  const { richter, setMagnitudM3, setUserInputM3, toggleLogViewM3, validarM3, generarSemillaM3 } = useSimuladorStore();
  const { magnitudBase, magnitudActual, targetM, userInputFactor, isLogView, status } = richter;

  useEffect(() => {
    if (targetM === 8.0) {
        generarSemillaM3();
    }
  }, []);

  const deltaM = parseFloat((magnitudActual - magnitudBase).toFixed(1));
  const multiplicadorReal = Math.pow(10, 1.5 * deltaM);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="bg-[#1e1b4b] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
           <Activity size={14} className="animate-pulse" /> Monitor Sismológico
        </div>
        <p className="text-xs font-bold text-slate-300 mb-4 leading-relaxed">
          Sismo de referencia: <span className="text-white font-black bg-white/10 px-2 py-0.5 rounded-lg">6.0 Mw</span>. 
          Calcula cuántas veces más energía libera un sismo de magnitud <span className="text-rose-400 font-black">{targetM} Mw</span>.
        </p>
        <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-rose-200">
           log₁₀(E₂/E₁) = 1.5(M₂ - M₁)
        </div>
      </div>

      {/* CONTROL DE MAGNITUD */}
      <div className="space-y-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <BarChart3 size={14} className="text-rose-500" /> Magnitud Simulada
            </h4>
            <button 
                onClick={toggleLogViewM3}
                className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full transition-all ${isLogView ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
                {isLogView ? '📉 Vista Log' : '📊 Vista Lineal'}
            </button>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Intensidad Mw</span>
            <span className="text-lg font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-xl">{magnitudActual.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="6.0" max="9.5" step="0.1" value={magnitudActual} 
            onChange={(e) => setMagnitudM3(parseFloat(e.target.value))} 
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500" 
          />
          <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase px-1">
            <span>Base (6.0)</span>
            <span>Histórico (9.5)</span>
          </div>
        </div>
      </div>

      {/* TELEMETRÍA */}
      <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 space-y-4">
        <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-100">
                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Δ Magnitud</span>
                <span className="text-sm font-black text-slate-800">{deltaM > 0 ? `+${deltaM}` : deltaM}</span>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Factor Energía</span>
                <span className="text-sm font-black text-rose-600 truncate block">
                    {multiplicadorReal < 1000 ? multiplicadorReal.toFixed(1) : Math.round(multiplicadorReal).toLocaleString()}x
                </span>
            </div>
        </div>

        <div className="pt-2 space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Cálculo del Factor (Target: {targetM})</label>
            <div className="relative group">
                <input 
                    type="number"
                    placeholder="Ej. 31.6"
                    value={userInputFactor}
                    onChange={(e) => setUserInputM3(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-5 text-sm font-black text-slate-700 outline-none focus:border-rose-500 transition-all placeholder:text-slate-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-rose-500 transition-colors">
                    <Zap size={16} />
                </div>
            </div>
        </div>

        <button 
          onClick={validarM3}
          className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
            status === 'success' 
            ? 'bg-green-500 text-white shadow-green-200' 
            : status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-[#1e1b4b] text-white shadow-indigo-200 hover:bg-indigo-900'
          }`}
        >
          {status === 'success' ? <><CheckCircle2 size={16} /> Cálculo Correcto</> : status === 'error' ? <><AlertCircle size={16} /> Error en Factor</> : 'Validar Potencia'}
        </button>

        {status === 'error' && (
            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] font-bold text-red-500 text-center px-4">
                Recuerda: E₂/E₁ = 10^(1.5 * ΔM). Para ΔM=1, el factor es ~31.6.
            </motion.p>
        )}
      </div>

      <div className="p-5 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex gap-3 italic">
         <Info size={18} className="text-indigo-400 shrink-0" />
         <p className="text-[10px] text-indigo-600 leading-relaxed font-medium">
            ¿Sabías que un sismo de 9.0 libera 1,000 veces más energía que uno de 7.0? El crecimiento es exponencial, no lineal.
         </p>
      </div>
    </div>
  );
}
