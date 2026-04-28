"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Thermometer, Ruler, Flame, Info } from 'lucide-react';

export default function BitacoraDilatacionTermica() {
  const { dilatacion7, setDilatacion7 } = useSimuladorStore();
  const { material = 'hierro', tempIni = 20, tempFin = 100, longitud = 10 } = dilatacion7 || {};

  // Coeficientes de dilatación lineal (alpha * 10^-6)
  const coefs: Record<string, number> = {
    hierro: 11.7,
    aluminio: 23.1,
    cobre: 17.0,
    vidrio: 3.3
  };

  const deltaT = tempFin - tempIni;
  const alphaClasico = coefs[material] || 11.7;
  const deltaL = alphaClasico * 1e-6 * longitud * deltaT;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MONITORES TÉRMICOS */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Variables Termofísicas</h3>
        
        {/* Selector de Material */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
           {['hierro', 'aluminio', 'cobre', 'vidrio'].map((m) => (
             <button 
               key={m}
               onClick={() => setDilatacion7({ material: m })}
               className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${material === m ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400'}`}
             >
               {m === 'hierro' ? 'Fe' : (m === 'aluminio' ? 'Al' : (m === 'cobre' ? 'Cu' : 'Vidrio'))}
             </button>
           ))}
        </div>

        {/* Temperatura Final */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer size={14} className="text-[#FB8500]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Temp. Final (T_f)</span>
            </div>
            <span className="text-xl font-black text-[#023047]">{tempFin} °C</span>
          </div>
          <input 
            type="range" min="20" max="500" step="10" 
            value={tempFin} 
            onChange={(e) => setDilatacion7({ tempFin: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#FB8500]" 
          />
        </div>
      </div>

      {/* RESULTADO (EXPANSIÓN) */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl space-y-4">
         <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Expansión Lineal (ΔL)</span>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black font-mono text-orange-400">{(deltaL * 1000).toFixed(3)}</span>
               <span className="text-sm text-slate-400">mm</span>
            </div>
         </div>
         
         <div className="flex items-center justify-between pt-4 border-t border-white/5 opacity-60">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Longitud Final</span>
            <span className="text-sm font-bold">{(longitud + deltaL).toFixed(6)} m</span>
         </div>
      </div>

      <div className="bg-orange-500/5 p-4 rounded-2xl border border-orange-500/20 flex gap-3">
         <Flame size={16} className="text-[#FB8500] shrink-0" />
         <p className="text-[10px] font-bold text-slate-500 italic leading-snug">
            Propiedad de los sólidos: Al aumentar la temperatura, la energía cinética de las moléculas aumenta, provocando un mayor espacio promedio entre ellas.
         </p>
      </div>

    </div>
  );
}
