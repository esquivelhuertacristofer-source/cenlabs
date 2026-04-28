"use client";

import React from 'react';
import { Thermometer } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function BitacoraSolubilidadCristalizacion() {
  const { solubilidad, bitacoraData, validarP6 } = useSimuladorStore();

  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#219EBC]/5 rounded-bl-[4rem]" />
        <div className="flex items-center gap-3 mb-6">
          <Thermometer size={20} className="text-[#FB8500]" />
          <h4 className="text-sm font-black text-white uppercase tracking-tighter">Monitoreo Térmico</h4>
        </div>
        <div className="space-y-6">
          <div className="text-center p-6 bg-slate-900/50 rounded-3xl border border-slate-800 relative">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Temperatura Actual</span>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-4xl font-black font-mono tracking-tighter ${solubilidad.temp > 50 ? 'text-orange-500' : (solubilidad.temp < 10 ? 'text-blue-400' : 'text-white')}`}>
                {solubilidad.temp}
              </span>
              <span className="text-lg font-bold text-slate-500">°C</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
              <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">
                <span>Precipitado (Sólido)</span>
                <span className="text-[#FB8500]">{bitacoraData?.salSolida || '0.0'} g</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${Math.min(100, (parseFloat(bitacoraData?.salSolida || '0') / 80) * 100)}%` }} className="h-full bg-[#FB8500]" />
              </div>
            </div>
            <button 
              onClick={() => {
                const ok = validarP6();
                if (!ok) alert("La solución aun no es pura o la temperatura es todavía alta (< 10°C) o la masa sólida es insuficiente.");
              }}
              disabled={solubilidad.ubicacion !== 'hielo' || solubilidad.status === 'success'}
              className="w-full py-4 bg-white text-[#023047] rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
            >
              Validar Cristalización
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
