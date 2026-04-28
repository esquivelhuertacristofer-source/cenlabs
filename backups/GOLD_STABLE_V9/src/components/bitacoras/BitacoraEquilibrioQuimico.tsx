"use client";

import React from 'react';
import { Thermometer } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function BitacoraEquilibrioQuimico() {
  const { equilibrio, validarP8 } = useSimuladorStore();

  const handleValidar = () => {
    const d1 = (document.getElementById('p8-d1') as HTMLSelectElement)?.value;
    const d2 = (document.getElementById('p8-d2') as HTMLSelectElement)?.value;
    const d3 = (document.getElementById('p8-d3') as HTMLSelectElement)?.value;
    
    if (!d1 || !d2 || !d3) return alert("Por favor completa todas las deducciones.");
    
    const ok = validarP8(d1, d2, d3);
    if (!ok) alert("Deducciones incorrectas. Observa el color: ¿A qué temperatura se vuelve más café el gas?");
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Thermometer size={20} className="text-[#219EBC]" />
          <h4 className="text-sm font-black text-white uppercase tracking-tighter">Deducción de Le Châtelier</h4>
        </div>
        
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
          Analiza el desplazamiento del equilibrio según la temperatura observada:
        </p>

        <div className="space-y-5">
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Al CALENTAR (100°C), el equilibrio se desplaza a:</label>
            <select id="p8-d1" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-pink-400 outline-none focus:border-pink-500">
              <option value="">Seleccionar...</option>
              <option value="Reactivos">Reactivos (Incoloro)</option>
              <option value="Productos">Productos (Café)</option>
            </select>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Al ENFRIAR (0°C), el equilibrio se desplaza a:</label>
            <select id="p8-d2" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-blue-400 outline-none focus:border-blue-500">
              <option value="">Seleccionar...</option>
              <option value="Reactivos">Reactivos (Incoloro)</option>
              <option value="Productos">Productos (Café)</option>
            </select>
          </div>

          <div className="p-4 bg-[#219EBC]/10 border border-[#219EBC]/20 rounded-2xl space-y-3">
            <label className="text-[10px] font-black text-[#219EBC] uppercase tracking-widest">Tipo de Reacción (ΔH):</label>
            <select id="p8-d3" className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-white outline-none">
              <option value="">Seleccionar...</option>
              <option value="Exotérmica">Exotérmica (-ΔH)</option>
              <option value="Endotérmica">Endotérmica (+ΔH)</option>
            </select>
          </div>

          <button 
            onClick={handleValidar}
            disabled={equilibrio.status === 'success'}
            className="w-full py-4 bg-white text-[#023047] rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            Validar Deducción
          </button>
        </div>
      </div>
    </div>
  );
}
