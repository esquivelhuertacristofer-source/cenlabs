"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, ShieldCheck, Microscope, Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraConstruccionAtomica() {
  const { particulas, setParticulas, validarEstructura, resetPractica } = useSimuladorStore();
  
  // Defensive defaults
  const { protones = 0, neutrones = 0, electrones = 0, isStable = true, message = "" } = particulas || {};

  const masaAtomica = protones + neutrones;
  const cargaNeta = protones - electrones;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MONITORES DE PARTÍCULAS */}
      <div className="grid grid-cols-1 gap-4">
        {/* Protones */}
        <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center font-black shadow-lg shadow-red-500/20">+</div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Protones</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setParticulas(protones - 1, neutrones, electrones)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all active:scale-95 font-black"
            >
              -
            </button>
            <span className="w-4 text-center font-black text-slate-800">{protones}</span>
            <button 
              onClick={() => setParticulas(protones + 1, neutrones, electrones)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 transition-all active:scale-95 font-black"
            >
              +
            </button>
          </div>
        </div>

        {/* Neutrones */}
        <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center font-black shadow-lg shadow-blue-500/20">n</div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Neutrones</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setParticulas(protones, neutrones - 1, electrones)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all active:scale-95 font-black"
            >
              -
            </button>
            <span className="w-4 text-center font-black text-slate-800">{neutrones}</span>
            <button 
              onClick={() => setParticulas(protones, neutrones + 1, electrones)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all active:scale-95 font-black"
            >
              +
            </button>
          </div>
        </div>

        {/* Electrones */}
        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500 text-white flex items-center justify-center font-black shadow-lg shadow-yellow-500/20">e-</div>
            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Electrones</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setParticulas(protones, neutrones, electrones - 1)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-yellow-600 hover:border-yellow-600 transition-all active:scale-95 font-black"
            >
              -
            </button>
            <span className="w-4 text-center font-black text-slate-800">{electrones}</span>
            <button 
              onClick={() => setParticulas(protones, neutrones, electrones + 1)}
              className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-yellow-600 hover:border-yellow-600 transition-all active:scale-95 font-black"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* TELEMETRÍA ATÓMICA */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Masa Atómica (A)</span>
          <span className="text-xl font-black">{masaAtomica} <span className="text-[10px] text-slate-400">u</span></span>
        </div>
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Carga Neta</span>
          <span className={`text-xl font-black ${cargaNeta === 0 ? 'text-green-400' : 'text-[#FB8500]'}`}>
            {cargaNeta > 0 ? `+${cargaNeta}` : cargaNeta}
          </span>
        </div>
        
        <div className={`p-4 rounded-2xl border ${isStable ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center gap-2 mb-1">
            {isStable ? <ShieldCheck className="text-green-400" size={14}/> : <AlertTriangle className="text-red-400" size={14}/>}
            <span className={`text-[10px] font-black uppercase ${isStable ? 'text-green-400' : 'text-red-400'}`}>
              {isStable ? 'Núcleo Estable' : 'Inestabilidad Nuclear'}
            </span>
          </div>
          <p className="text-[11px] font-bold text-slate-300 leading-tight">
            {isStable ? "El balance de fuerzas nucleares es correcto." : "Demasiados protones o neutrones causan desintegración."}
          </p>
        </div>
      </div>

      <button 
        onClick={() => validarEstructura()}
        className="w-full py-4 bg-[#219EBC] hover:bg-[#FB8500] text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-xs"
      >
        Validar Átomo
      </button>

    </div>
  );
}
