"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Activity, Box, Settings, Zap } from 'lucide-react';

export default function BitacoraLeyHooke() {
  const { hooke4, setHooke4 } = useSimuladorStore();
  const { k = 100, masa = 2, estiramiento = 0, animando = false } = hooke4 || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CONTROLES DE HOOKE */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Constantes Elásticas</h3>
        
        {/* Constante Elástica (k) */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings size={14} className="text-[#FB8500]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Constante (k)</span>
            </div>
            <span className="text-xl font-black text-[#023047]">{k} N/m</span>
          </div>
          <input 
            type="range" min="50" max="500" step="10" 
            value={k} 
            disabled={animando} 
            onChange={(e) => setHooke4({ k: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#FB8500]" 
          />
        </div>

        {/* Masa suspendida */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box size={14} className="text-[#219EBC]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Masa (m)</span>
            </div>
            <span className="text-xl font-black text-[#023047]">{masa} kg</span>
          </div>
          <input 
            type="range" min="0.5" max="10" step="0.5" 
            value={masa} 
            disabled={animando} 
            onChange={(e) => setHooke4({ masa: parseFloat(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#219EBC]" 
          />
        </div>
      </div>

      {/* TELEMETRÍA */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl space-y-4">
         <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Elongación (x)</span>
            <span className="text-xl font-black">{estiramiento.toFixed(2)} <span className="text-[10px] text-slate-400">m</span></span>
         </div>
         <div className="flex items-center justify-between pointer-events-none opacity-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Fuerza (F=kx)</span>
            <span className="text-xl font-black">{(k * estiramiento).toFixed(1)} <span className="text-[10px] text-slate-400">N</span></span>
         </div>
      </div>

      <button 
        onClick={() => setHooke4({ animando: !animando })}
        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${animando ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-emerald-600 text-white shadow-emerald-500/20'}`}
      >
        <Activity size={18} /> {animando ? 'Parar Oscilación' : 'Activar Sistema'}
      </button>

    </div>
  );
}
