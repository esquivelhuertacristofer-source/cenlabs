"use client";

import React from 'react';
import { Thermometer, Beaker, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function BitacoraDestilacion() {
  const { destilacion, bitacoraData, validarP10 } = useSimuladorStore();
  const temp = destilacion.tempMezcla;
  const vol = destilacion.volDestilado;
  const pur = destilacion.purezaDestilado;

  return (
    <div className="space-y-4">
      <div className="p-6 bg-slate-950 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#219EBC]/5 rounded-bl-full pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6">
          <Activity size={20} className="text-[#FB8500]" />
          <h4 className="text-sm font-black text-white uppercase tracking-tighter">Telemetría de Destilación</h4>
        </div>

        <div className="space-y-6">
          {/* TEMP DISPLAY */}
          <div className="text-center p-6 bg-slate-900/50 rounded-3xl border border-slate-800 relative group overflow-hidden">
             <div className={`absolute inset-0 bg-red-600/5 opacity-0 transition-opacity ${temp > 95 ? 'opacity-100' : ''}`} />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Temperatura Termómetro</span>
             <div className="flex items-center justify-center gap-2">
                <Thermometer size={24} className={temp > 85 ? 'text-red-500 animate-pulse' : 'text-[#219EBC]'} />
                <span className={`text-4xl font-black font-mono tracking-tighter ${temp > 95 ? 'text-red-500' : 'text-white'}`}>
                   {temp.toFixed(1)}
                </span>
                <span className="text-lg font-bold text-slate-500 flex items-center">°C</span>
             </div>
          </div>

          <div className="space-y-4">
             {/* VOLUMEN */}
             <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                      <Beaker size={14} className="text-blue-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Volumen Recuperado</span>
                   </div>
                   <span className="text-xs font-black text-white font-mono">{vol.toFixed(1)} <small className="text-slate-500 font-bold">/ 50.0 mL</small></span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                   <motion.div animate={{ width: `${(vol / 50) * 100}%` }} className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                </div>
             </div>

             {/* PUREZA */}
             <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                      <Zap size={14} className="text-[#FB8500]" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pureza Etanol</span>
                   </div>
                   <span className={`text-xs font-black font-mono ${pur < 95 ? 'text-red-400' : 'text-[#FB8500]'}`}>{pur.toFixed(1)} %</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                   <motion.div animate={{ width: `${pur}%`, backgroundColor: pur < 95 ? '#f87171' : '#FB8500' }} className="h-full shadow-[0_0_10px_rgba(251,133,0,0.5)]" />
                </div>
             </div>
          </div>

          <button 
            onClick={() => {
              const ok = validarP10();
              if (!ok) alert("La pureza es insuficiente o el volumen recolectado no es de 50 mL. ¡Controla bien el calor!");
            }}
            disabled={destilacion.status === 'success' || vol < 49.5}
            className="w-full py-4 bg-white text-[#023047] rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
          >
            Validar Extracción
          </button>
        </div>
      </div>

      <div className="p-5 bg-[#219EBC]/5 border border-[#219EBC]/20 rounded-3xl text-center">
         <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
            Ebullición Fraccionada: El Etanol evapora a 78°C. El agua a 100°C. Mantente en el rango medio.
         </p>
      </div>
    </div>
  );
}
