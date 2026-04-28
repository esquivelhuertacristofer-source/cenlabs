"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, Gauge, Power, Weight, Activity } from 'lucide-react';

export default function BitacoraMotorElectrico() {
  const { motor10, setMotor10 } = useSimuladorStore();
  const { voltaje = 12, carga = 5, rpm = 0, encendido = false } = motor10 || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MONITORES ELECTROMECÁNICOS */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Power Supply & Mechanical Load</h3>
        
        {/* Voltaje de Entrada */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-yellow-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tensión (V)</span>
            </div>
            <span className="text-xl font-black text-[#023047]">{voltaje} V</span>
          </div>
          <input 
            type="range" min="0" max="24" step="1" 
            value={voltaje} 
            disabled={encendido}
            onChange={(e) => setMotor10({ voltaje: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-yellow-500" 
          />
        </div>

        {/* Carga Mecánica */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Weight size={14} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Torque / Carga</span>
            </div>
            <span className="text-xl font-black text-[#023047]">{carga} kg</span>
          </div>
          <input 
            type="range" min="1" max="20" step="1" 
            value={carga} 
            disabled={encendido}
            onChange={(e) => setMotor10({ carga: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500" 
          />
        </div>
      </div>

      {/* TELEMETRÍA (RPM) */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
         <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Velocidad Angular</span>
            <div className="flex items-baseline gap-1">
               <span className={`text-3xl font-black font-mono ${encendido ? 'text-green-400' : 'text-slate-500'}`}>
                  {encendido ? Math.max(0, Math.round((voltaje * 100) / (carga * 0.5))) : '0'}
               </span>
               <span className="text-sm text-slate-400">RPM</span>
            </div>
         </div>
         <Gauge size={32} className={`transition-all ${encendido ? 'text-green-400 animate-spin-slow' : 'text-slate-600'}`} />
      </div>

      <button 
        onClick={() => setMotor10({ encendido: !encendido })}
        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${encendido ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-[#FB8500] text-white shadow-[#FB8500]/20'}`}
      >
        <Power size={18} /> {encendido ? 'Corte de Energía' : 'Energizar Motor'}
      </button>

      {encendido && (
         <div className="flex items-center gap-2 justify-center py-2">
            <Activity size={14} className="text-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Motor Operando</span>
         </div>
      )}

    </div>
  );
}
