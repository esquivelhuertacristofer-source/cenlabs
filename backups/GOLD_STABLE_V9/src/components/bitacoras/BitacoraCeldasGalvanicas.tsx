"use client";

import React, { useState } from 'react';
import { Activity, Battery } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function BitacoraCeldasGalvanicas() {
  const { celda, validarP9 } = useSimuladorStore();
  const [anodo, setAnodo] = useState("");
  const [catodo, setCatodo] = useState("");
  const [voltaje, setVoltaje] = useState("");

  const handleValidar = () => {
    const v = parseFloat(voltaje);
    if (!anodo || !catodo || isNaN(v)) return alert("Por favor completa todos los campos de la bitácora.");
    
    if (celda.voltaje === 0) return alert("Circuito abierto. Asegúrate de colocar los metales, el puente salino y conectar los cables.");
    if (celda.voltaje < 0) return alert("Polaridad invertida. El voltímetro marca negativo. Ajusta tus conexiones.");

    const ok = validarP9(anodo, catodo, v);
    if (!ok) alert("Error de conceptos o cálculo. Revisa cuál metal tiene el menor potencial (Ánodo) y cuál el mayor (Cátodo).");
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#219EBC]/5 rounded-bl-full" />
        
        <div className="flex items-center gap-3 mb-6">
          <Activity size={20} className="text-[#FB8500]" />
          <h4 className="text-sm font-black text-white uppercase tracking-tighter">Análisis Electroquímico</h4>
        </div>

        <div className="space-y-5">
          {/* ÁNODO */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ánodo (Oxidación)</label>
            <select 
              value={anodo}
              onChange={(e) => setAnodo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-[#FB8500] outline-none"
            >
              <option value="">Seleccionar...</option>
              {celda.seedMetales.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* CÁTODO */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cátodo (Reducción)</label>
            <select 
              value={catodo}
              onChange={(e) => setCatodo(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-bold text-[#219EBC] outline-none"
            >
              <option value="">Seleccionar...</option>
              {celda.seedMetales.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* POTENCIAL */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Potencial de Celda (E°)</label>
            <div className="relative">
              <input 
                type="number" step="0.01" placeholder="0.00"
                value={voltaje}
                onChange={(e) => setVoltaje(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-2xl font-black text-white font-mono outline-none focus:border-[#FB8500]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">V</span>
            </div>
          </div>

          <button 
            onClick={handleValidar}
            disabled={celda.status === 'success'}
            className="w-full py-4 bg-white text-[#023047] rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl h-14 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Battery size={16} /> Validar Circuito
          </button>
        </div>
      </div>
    </div>
  );
}
