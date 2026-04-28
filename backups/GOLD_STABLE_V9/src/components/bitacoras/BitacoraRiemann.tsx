"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Columns, List, Activity, Info, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraRiemann() {
  const { integral9, setIntegralM9, setAnimandoM9, validarM9 } = useSimuladorStore();
  const { n, metodo, animandoLimite, status } = integral9;

  const areaTeorica = 166.67;
  
  // Motor Matemático Local para Telemetría
  const f = (x: number) => -Math.pow(x, 2) + 10 * x;
  const dx = 10 / n;
  let areaAprox = 0;

  for (let i = 0; i < n; i++) {
    let x_eval = 0;
    if (metodo === 'izquierda') x_eval = i * dx;
    else if (metodo === 'derecha') x_eval = (i + 1) * dx;
    else x_eval = i * dx + dx / 2; // Punto Medio
    
    areaAprox += f(x_eval) * dx;
  }

  const errorAbsoluto = Math.abs(areaTeorica - areaAprox);
  const errorRelativo = (errorAbsoluto / areaTeorica) * 100;

  const getErrorColor = () => {
    if (errorRelativo > 5) return 'text-red-500';
    if (errorRelativo > 1) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* HUD HEADER */}
      <div className="bg-[#020617] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
           <TrendingUp size={14} className="animate-pulse" /> Escáner de Integración
        </div>
        <p className="text-xs font-bold text-slate-400 mb-4 leading-relaxed">
          Aproxima el área bajo el domo. A medida que incrementas la <span className="text-emerald-400">Resolución (n)</span>, el error tiende a cero.
        </p>
        
        <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Área Aproximada</div>
                <div className="text-sm font-mono font-bold text-emerald-200">
                    {areaAprox.toFixed(2)} <span className="text-[8px] text-white/50">u²</span>
                </div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Margen de Error</div>
                <div className={`text-sm font-mono font-bold ${getErrorColor()}`}>
                    {errorRelativo.toFixed(2)}%
                </div>
            </div>
        </div>
      </div>

      {/* CONTROLES DE RESOLUCIÓN */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Columns size={12} className="text-emerald-500" /> Resolución (n)
                </h4>
                <span className="text-lg font-black text-slate-800 bg-slate-50 px-4 py-1 rounded-full border border-slate-100 italic">
                    {n} <span className="text-[8px] uppercase tracking-tighter text-slate-400 ml-1">bloques</span>
                </span>
            </div>
            <input 
              type="range" min="2" max="100" step="1" value={n} 
              onChange={(e) => setIntegralM9(parseInt(e.target.value), metodo)} 
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
            />
        </div>

        {/* SELECTOR DE MÉTODO */}
        <div className="space-y-3 pt-2 border-t border-slate-50">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 pl-1">
                <List size={14} className="text-emerald-500" /> Algoritmo de Suma
            </h4>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
                {(['izquierda', 'derecha', 'punto_medio'] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => setIntegralM9(n, m)}
                        className={`py-2 px-1 rounded-xl text-[8px] font-black uppercase transition-all tracking-tighter ${
                            metodo === m ? 'bg-white text-emerald-600 shadow-sm scale-[1.02]' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        {m.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>

        {/* MODO INSTRUCTOR TOGGLE */}
        <div className="pt-2 flex items-center justify-between px-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Animar Límite (n→∞)</span>
            <button 
                onClick={() => setAnimandoM9(!animandoLimite)}
                className={`w-12 h-6 rounded-full transition-all relative ${animandoLimite ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
                <motion.div 
                    animate={{ x: animandoLimite ? 26 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
            </button>
        </div>
      </div>

      {/* VALIDACIÓN DE INTEGRAL */}
      <div className="pt-2">
            <button 
              onClick={() => validarM9(errorRelativo)}
              className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
                status === 'success' 
                ? 'bg-emerald-500 text-white shadow-emerald-100' 
                : status === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-[#020617] text-white shadow-slate-200 hover:bg-slate-800'
              }`}
            >
              {status === 'success' ? <><CheckCircle2 size={16} /> Integral Validada</> : status === 'error' ? <><AlertCircle size={16} /> Error Demasiado Alto</> : 'Validar Área Integral'}
            </button>
            
            {status === 'error' && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-[9px] font-bold text-red-500 text-center px-4 leading-relaxed uppercase tracking-tighter">
                   El margen de error debe ser menor al 0.50% para que el motor de energía sea estable. Aumenta la resolución.
                </motion.p>
            )}
      </div>

      <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 flex gap-3 italic">
         <Activity size={18} className="text-emerald-400 shrink-0" />
         <p className="text-[10px] text-emerald-700 leading-relaxed font-medium">
            Observa cómo la suma de Punto Medio es mucho más precisa incluso con pocos rectángulos. Es el principio de la integración numérica.
         </p>
      </div>
    </div>
  );
}
