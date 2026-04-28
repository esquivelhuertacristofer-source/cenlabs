"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Activity, Box, Zap, RotateCcw } from 'lucide-react';

export default function BitacoraColisiones1D() {
  const { colisiones5, setColisiones5 } = useSimuladorStore();
  const { m1 = 2, v1 = 5, m2 = 2, v2 = 0, tipo = 'elastica', animando = false } = colisiones5 || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MONITORES DE COLISIÓN */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Configuración Dinámica</h3>
        
        {/* Cuerpo 1 */}
        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Cuerpo A (m₁)</span>
            <span className="text-xl font-black text-slate-700">{m1} kg</span>
          </div>
          <input 
            type="range" min="1" max="10" step="1" 
            value={m1} 
            disabled={animando} 
            onChange={(e) => setColisiones5({ m1: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-500" 
          />
        </div>

        {/* Cuerpo 2 */}
        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Cuerpo B (m₂)</span>
            <span className="text-xl font-black text-slate-700">{m2} kg</span>
          </div>
          <input 
            type="range" min="1" max="10" step="1" 
            value={m2} 
            disabled={animando} 
            onChange={(e) => setColisiones5({ m2: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-red-500" 
          />
        </div>

        {/* Selector de Tipo */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
           <button 
             onClick={() => setColisiones5({ tipo: 'elastica' })}
             className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tipo === 'elastica' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
           >
             Elástica
           </button>
           <button 
             onClick={() => setColisiones5({ tipo: 'inelastica' })}
             className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${tipo === 'inelastica' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
           >
             Inelástica
           </button>
        </div>
      </div>

      {/* Botón de Impacto */}
      <button 
        onClick={() => setColisiones5({ animando: true })}
        disabled={animando}
        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${animando ? 'bg-slate-100 text-slate-400' : 'bg-[#023047] text-white shadow-[#023047]/20'}`}
      >
        <Zap size={18} fill="white" /> Iniciar Secuencia
      </button>

      {animando && (
         <button 
           onClick={() => setColisiones5({ animando: false })}
           className="w-full py-3 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-600 flex items-center justify-center gap-2"
         >
           <RotateCcw size={12} /> Resetear
         </button>
      )}

    </div>
  );
}
