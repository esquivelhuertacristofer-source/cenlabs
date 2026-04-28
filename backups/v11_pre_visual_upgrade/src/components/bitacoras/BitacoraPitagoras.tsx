"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Beaker, Activity, Zap, CheckCircle2, AlertCircle, Droplets, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraPitagoras() {
  const { pitagoras, setCatetosM4, setLlenadoM4, setUserInputM4, validarM4, resetM4 } = useSimuladorStore();
  const { catetoA, catetoB, llenado, userInputC, status } = pitagoras;

  const realC = Math.sqrt(catetoA * catetoA + catetoB * catetoB);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="bg-[#0f172a] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
           <Droplets size={14} className="animate-pulse" /> Hidrostática Geométrica
        </div>
        <p className="text-xs font-bold text-slate-300 mb-4 leading-relaxed">
          Demuestra el teorema de Pitágoras. El agua de los cuadrados a² y b² debe llenar exactamente el cuadrado c².
        </p>
        <div className="p-3 bg-blue-900/40 rounded-xl border border-blue-400/20 font-mono text-[11px] text-blue-200 text-center">
           a² + b² = c²
        </div>
      </div>

      {/* DIMENSIONES DE CATETOS */}
      <div className="space-y-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-blue-500" /> Dimensionar Triángulo
        </h4>
        
        <div className="space-y-4">
          <div className="space-y-2 group">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Cateto Base (a)</span>
              <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-0.5 rounded-lg group-hover:scale-110 transition-transform">{catetoA}u</span>
            </div>
            <input 
              type="range" min="3" max="8" step="1" value={catetoA} 
              onChange={(e) => setCatetosM4(parseInt(e.target.value), catetoB)} 
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500" 
            />
          </div>

          <div className="space-y-2 group">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Cateto Altura (b)</span>
              <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-0.5 rounded-lg group-hover:scale-110 transition-transform">{catetoB}u</span>
            </div>
            <input 
              type="range" min="3" max="8" step="1" value={catetoB} 
              onChange={(e) => setCatetosM4(catetoA, parseInt(e.target.value))} 
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-500" 
            />
          </div>
        </div>
      </div>

      {/* FLUJO DE ÁREAS */}
      <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 space-y-6 transition-all duration-300">
        <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Animación de Áreas</h4>
            <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center gap-4">
                <button 
                  onClick={() => setLlenadoM4(llenado === 100 ? 0 : 100)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${llenado > 0 ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                >
                  <Droplets size={20} className={llenado > 0 ? "animate-bounce" : ""} />
                </button>
                <div className="flex-1">
                    <div className="flex justify-between text-[10px] font-black text-slate-500 mb-1">
                        <span>Transferencia</span>
                        <span>{llenado}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div animate={{ width: `${llenado}%` }} className="h-full bg-blue-500" />
                    </div>
                </div>
            </div>
        </div>

        <div className="pt-2 space-y-3">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Calcular Hipotenusa (c)</label>
            <div className="relative">
                <input 
                    type="number"
                    placeholder="Ej. 5.0"
                    value={userInputC}
                    onChange={(e) => setUserInputM4(e.target.value)}
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 px-5 text-sm font-black text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
                    <Zap size={16} />
                </div>
            </div>
        </div>

        <button 
          onClick={validarM4}
          className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
            status === 'success' 
            ? 'bg-emerald-500 text-white shadow-emerald-200' 
            : status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-[#0f172a] text-white shadow-blue-200 hover:bg-slate-800'
          }`}
        >
          {status === 'success' ? <><CheckCircle2 size={16} /> Teorema Validado</> : status === 'error' ? <><AlertCircle size={16} /> Error en Cálculo</> : 'Aceptar Hipotenusa'}
        </button>

        {status === 'error' && (
            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] font-bold text-red-500 text-center px-4 leading-relaxed">
                Recuerda que c = √(a² + b³). Para a={catetoA} y b={catetoB}, c ≈ {realC.toFixed(2)}.
            </motion.p>
        )}
      </div>

      <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 flex gap-3 italic">
         <Info size={18} className="text-blue-400 shrink-0" />
         <p className="text-[10px] text-blue-600 leading-relaxed font-medium">
            Al activar el flujo, estás visualizando cómo la suma de las superficies de los cuadrados pequeños es equivalente a la superficie del cuadrado mayor.
         </p>
      </div>
    </div>
  );
}
