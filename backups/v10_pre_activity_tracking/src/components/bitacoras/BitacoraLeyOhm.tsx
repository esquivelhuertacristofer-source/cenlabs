"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, Power, RotateCcw, Activity } from 'lucide-react';

export default function BitacoraLeyOhm() {
  const { ohm8, setOhm8, updateScore } = useSimuladorStore();
  const { voltaje = 12, resistencia = 1000, switchOn = false, ledRoto = false } = ohm8 || {};

  const corriente = switchOn && !ledRoto ? voltaje / resistencia : 0;
  const corrienteMA = corriente * 1000;

  const handleToggle = () => {
    setOhm8({ switchOn: !switchOn });
  };

  const handleReset = () => {
    setOhm8({ ledRoto: false, switchOn: false, resistencia: 1000 });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MONITORES ELÉCTRICOS */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Panel de Control E-101</h3>
        
        {/* Multímetro Digital */}
        <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={60} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8ECAE6] block mb-1">Amperímetro (mA)</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black font-mono tracking-tighter ${ledRoto ? 'text-red-500' : 'text-yellow-400'}`}>
              {corrienteMA.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Control de Resistencia */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Resistencia (Ω)</span>
            <span className="text-xl font-black text-[#023047]">{resistencia} Ω</span>
          </div>
          <input 
            type="range" min="10" max="2000" step="10" 
            value={resistencia} 
            disabled={switchOn || ledRoto} 
            onChange={(e) => setOhm8({ resistencia: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-yellow-500" 
          />
        </div>

        {/* Interruptor de Encendido */}
        <div className="flex gap-4">
          <button 
            onClick={handleToggle}
            disabled={ledRoto}
            className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all ${switchOn ? 'bg-red-500 text-white shadow-lg' : 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/20 active:scale-95'}`}
          >
            <Power size={18} /> {switchOn ? 'Abrir Circuito' : 'Cerrar Circuito'}
          </button>

          {ledRoto && (
            <button 
              onClick={handleReset}
              className="p-4 bg-slate-100 text-red-500 rounded-2xl hover:bg-red-50 transition-all active:scale-95"
            >
              <RotateCcw size={20} />
            </button>
          )}
        </div>
      </div>

      {/* FEEDBACK DE SEGURIDAD */}
      <div className={`p-4 rounded-2xl border ${ledRoto ? 'bg-red-500/10 border-red-500/30' : (corrienteMA > 20 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/5 border-green-500/20')}`}>
        <div className="flex items-center gap-2 mb-2">
           <Zap size={14} className={ledRoto ? 'text-red-500' : 'text-yellow-500'} />
           <span className={`text-[10px] font-black uppercase tracking-widest ${ledRoto ? 'text-red-500' : 'text-slate-600'}`}>
              Estado del LED
           </span>
        </div>
        <p className="text-[11px] font-bold text-slate-500 leading-tight">
          {ledRoto 
            ? "¡CORRIENTE EXCESIVA! El diodo LED se ha quemado. Reinicia para continuar." 
            : (corrienteMA > 30 ? "⚠️ ¡Peligro! Te acercas al límite de corriente de 35mA." : "La corriente es segura para los componentes actuales.")}
        </p>
      </div>

    </div>
  );
}
