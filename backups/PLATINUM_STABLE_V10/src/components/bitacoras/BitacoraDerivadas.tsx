"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Move, Target, Info, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraDerivadas() {
  const { derivada8, setXActualM8, setMostrarDerivadaM8, validarM8 } = useSimuladorStore();
  const { xActual, mostrarDerivada, status } = derivada8;

  // Función: f(x) = 1/3 x^3 - 2x^2 + 3x
  const f = (x: number) => (1/3) * Math.pow(x, 3) - 2 * Math.pow(x, 2) + 3 * x;
  // Derivada: f'(x) = x^2 - 4x + 3
  const df = (x: number) => Math.pow(x, 2) - 4 * x + 3;

  const y = f(xActual);
  const m = df(xActual);

  const getPendienteInfo = () => {
    if (Math.abs(m) < 0.05) return { text: "PLANA (CRÍTICO)", color: "text-cyan-500", icon: "➡" };
    if (m > 0) return { text: "SUBIENDO", color: "text-emerald-500", icon: "↗" };
    return { text: "BAJANDO", color: "text-red-500", icon: "↘" };
  };

  const info = getPendienteInfo();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* HUD HEADER */}
      <div className="bg-[#020617] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
           <Gauge size={14} className="animate-pulse" /> Telemetría Diferencial
        </div>
        <p className="text-xs font-bold text-slate-400 mb-4 leading-relaxed">
          Desliza el punto por la curva para observar cómo cambia la <span className="text-indigo-400">Recta Tangente</span>. Busca los puntos de retorno.
        </p>
        
        <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Punto (x,y)</div>
                <div className="text-xs font-mono font-bold text-indigo-200">
                    ({xActual.toFixed(2)}, {y.toFixed(2)})
                </div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Pendiente (m)</div>
                <div className={`text-xs font-mono font-bold ${info.color}`}>{m.toFixed(2)} {info.icon}</div>
            </div>
        </div>
      </div>

      {/* ESCÁNER DE POSICIÓN */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Move size={12} className="text-indigo-500" /> Explorador X
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-800 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 italic">
                        x = {xActual.toFixed(2)}
                    </span>
                </div>
            </div>

            <input 
              type="range" min="-1" max="5" step="0.1" value={xActual} 
              onChange={(e) => setXActualM8(parseFloat(e.target.value))} 
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
            />

            {/* BOTONES DE MICRO-AJUSTE */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => setXActualM8(Math.max(-1, xActual - 0.01))}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-600 hover:bg-slate-100 transition-all uppercase"
                >
                    <ChevronLeft size={14} /> Micro -0.01
                </button>
                <button 
                    onClick={() => setXActualM8(Math.min(5, xActual + 0.01))}
                    className="flex items-center justify-center gap-2 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-600 hover:bg-slate-100 transition-all uppercase"
                >
                    Micro +0.01 <ChevronRight size={14} />
                </button>
            </div>
        </div>

        {/* MODO INSTRUCTOR TOGGLE */}
        <div className="pt-2 border-t border-slate-50 flex items-center justify-between px-1">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ver Gráfica f'(x)</span>
            <button 
                onClick={() => setMostrarDerivadaM8(!mostrarDerivada)}
                className={`w-12 h-6 rounded-full transition-all relative ${mostrarDerivada ? 'bg-indigo-500' : 'bg-slate-200'}`}
            >
                <motion.div 
                    animate={{ x: mostrarDerivada ? 26 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
            </button>
        </div>
      </div>

      {/* ECUACIÓN TANGENTE DUAL */}
      <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 space-y-3">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Ecuación Tangente</h4>
            <div className="p-4 bg-white rounded-2xl border border-indigo-100 text-sm font-mono font-bold text-slate-700 text-center shadow-sm">
                y - {y.toFixed(2)} = <span className={info.color}>{m.toFixed(2)}</span>(x - {xActual.toFixed(2)})
            </div>
      </div>

      {/* VALIDACIÓN DE PUNTO CRÍTICO */}
      <div className="pt-2">
            <button 
              onClick={validarM8}
              className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
                status === 'success' 
                ? 'bg-emerald-500 text-white shadow-emerald-100' 
                : status === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-[#020617] text-white shadow-slate-200 hover:bg-slate-800'
              }`}
            >
              {status === 'success' ? <><CheckCircle2 size={16} /> Punto Registrado</> : status === 'error' ? <><AlertCircle size={16} /> No es Punto Crítico</> : 'Registrar Punto Crítico'}
            </button>
            
            {status === 'error' && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-[9px] font-bold text-red-500 text-center px-4 leading-relaxed uppercase tracking-tighter">
                   La pendiente debe ser exactamente 0.00. Sigue buscando el vértice de la curva.
                </motion.p>
            )}
      </div>

      <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100 flex gap-3 italic">
         <Info size={18} className="text-indigo-400 shrink-0" />
         <p className="text-[10px] text-indigo-700 leading-relaxed font-medium">
            ¿Sabías que la derivada te dice hacia dónde va la función? Si m es negativa, la función está en plena caída libre hacia un mínimo.
         </p>
      </div>
    </div>
  );
}
