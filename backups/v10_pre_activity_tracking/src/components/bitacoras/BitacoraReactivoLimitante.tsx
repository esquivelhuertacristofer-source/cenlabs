"use client";

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function BitacoraReactivoLimitante() {
  const { limitante, validarP4 } = useSimuladorStore();
  const [ansLimitante, setAnsLimitante] = useState("");
  const [ansExceso, setAnsExceso] = useState("");

  const handleIniciar = () => {
    const masaExceso = parseFloat(ansExceso);
    if (isNaN(masaExceso)) return alert("Por favor ingresa un valor numérico para el exceso.");
    validarP4(ansLimitante, masaExceso);
  };

  return (
    <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings size={20} className="text-[#219EBC]" />
        <h4 className="text-sm font-black text-white uppercase tracking-tighter">Factores de Haber</h4>
      </div>
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Limitante</label>
          <select 
            value={ansLimitante} 
            onChange={(e) => setAnsLimitante(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white transition-colors outline-none"
          >
            <option value="">Seleccionar...</option>
            <option value="N2">N₂</option>
            <option value="H2">H₂</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exceso (g)</label>
          <input 
            type="number" 
            step="0.1" 
            placeholder="0.0" 
            value={ansExceso} 
            onChange={(e) => setAnsExceso(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none" 
          />
        </div>
        <button 
          onClick={handleIniciar} 
          disabled={!ansLimitante || !ansExceso || limitante.isRunning} 
          className="w-full py-4 bg-[#219EBC] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all"
        >
          Iniciar Síntesis
        </button>
      </div>
    </div>
  );
}
