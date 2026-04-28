"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Thermometer, Box, Gauge, Info, RefreshCcw } from 'lucide-react';

export default function BitacoraLeyesGases() {
  const { gases, updateGases, resetGases } = useSimuladorStore();
  
  // Defensive Destructuring
  const { T = 300, V = 10, P = 1.0, pTarget = 3.5, isExploded = false } = gases || {};

  const pressureColor = P > 4.5 ? "text-red-500" : P > 3.5 ? "text-orange-500" : "text-[#219EBC]";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MONITORES PRINCIPALES */}
      <div className="grid grid-cols-1 gap-4">
        {/* Presión Actual */}
        <div className="p-6 bg-[#023047] rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Gauge size={60} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8ECAE6] block mb-1">Presión de Cámara</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black font-mono tracking-tighter ${pressureColor}`}>{P.toFixed(2)}</span>
            <span className="text-sm font-bold text-slate-400">atm</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
            <span>Objetivo:</span>
            <span className="text-white">{pTarget.toFixed(1)} atm</span>
          </div>
        </div>

        {/* Temperatura (T) */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer size={16} className="text-[#FB8500]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Temperatura (K)</span>
            </div>
            <span className="text-lg font-black text-[#023047]">{T} K</span>
          </div>
          <input 
            type="range" min="300" max="600" step="10" 
            value={T} 
            disabled={isExploded} 
            onChange={(e) => updateGases(parseInt(e.target.value), V)} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#FB8500]" 
          />
        </div>

        {/* Volumen (V) */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box size={16} className="text-[#219EBC]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Volumen (L)</span>
            </div>
            <span className="text-lg font-black text-[#023047]">{V} L</span>
          </div>
          <input 
            type="range" min="2" max="10" step="0.5" 
            value={V} 
            disabled={isExploded} 
            onChange={(e) => updateGases(T, parseFloat(e.target.value))} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#219EBC]" 
          />
        </div>
      </div>

      {/* FEEDBACK DINÁMICO */}
      <div className={`p-4 rounded-2xl border ${Math.abs(P - pTarget) <= 0.1 ? 'bg-green-500/10 border-green-500/30' : 'bg-blue-500/5 border-blue-500/20'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Info size={14} className={Math.abs(P - pTarget) <= 0.1 ? 'text-green-500' : 'text-[#219EBC]'} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${Math.abs(P - pTarget) <= 0.1 ? 'text-green-500' : 'text-[#219EBC]'}`}>
            Estado del Sistema
          </span>
        </div>
        <p className="text-[11px] font-bold text-slate-500 leading-tight">
          {Math.abs(P - pTarget) <= 0.1 
            ? "¡Presión Ideal alcanzada! Estás listo para certificar el experimento." 
            : "Recuerda la Ley de Boyle-Mariotte: a temperatura constante, el volumen es inversamente proporcional a la presión."}
        </p>
      </div>

      {isExploded && (
        <button 
          onClick={resetGases}
          className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs flex items-center justify-center gap-2"
        >
          <RefreshCcw size={16} /> Reiniciar Sistema
        </button>
      )}

    </div>
  );
}
