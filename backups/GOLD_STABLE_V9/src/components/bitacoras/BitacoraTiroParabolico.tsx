"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Crosshair, Zap, Activity, Binary } from 'lucide-react';

interface BitacoraTiroProps {
  activateAnalysis?: boolean;
}

export default function BitacoraTiroParabolico({ activateAnalysis = false }: BitacoraTiroProps) {
  const { tiro1, setTiro1, bitacoraData, setBitacora } = useSimuladorStore();
  const { angulo = 45, velocidad = 25, disparando = false } = tiro1 || {};

  // Constantes físicas para HUD
  const G = 9.81;
  const targetX = 50; // Ejemplo de target predefinido o dinámico
  const rad = (angulo * Math.PI) / 180;
  const xMax = (Math.pow(velocidad, 2) * Math.sin(2 * rad)) / G;
  const yMax = (Math.pow(velocidad, 2) * Math.pow(Math.sin(rad), 2)) / (2 * G);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MONITORES DE TIRO */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Centro de Balística</h3>
        
        {/* Ángulo */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ángulo (θ)</span>
            <span className="text-xl font-black text-[#023047]">{angulo}°</span>
          </div>
          <input 
            type="range" min="0" max="90" step="1" 
            value={angulo} 
            disabled={disparando} 
            onChange={(e) => setTiro1({ angulo: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500" 
          />
        </div>

        {/* Velocidad */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Velocidad (V₀)</span>
            <span className="text-xl font-black text-[#023047]">{velocidad} m/s</span>
          </div>
          <input 
            type="range" min="10" max="50" step="1" 
            value={velocidad} 
            disabled={disparando} 
            onChange={(e) => setTiro1({ velocidad: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-emerald-500" 
          />
        </div>
      </div>

      {/* HUD TELEMÉTRICO */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-4">
            <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Alcance Máx.</p>
            <p className="text-lg font-black text-slate-700">{xMax.toFixed(1)} m</p>
         </div>
         <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
            <p className="text-[9px] font-black text-emerald-400 uppercase mb-1">Altura Máx.</p>
            <p className="text-lg font-black text-slate-700">{yMax.toFixed(1)} m</p>
         </div>
      </div>

      {/* Botón de Ejecución */}
      <button 
        onClick={() => setTiro1({ disparando: true })}
        disabled={disparando}
        className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${disparando ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-indigo-500/20'}`}
      >
        {disparando ? <Activity className="animate-spin" size={18} /> : <Zap size={18} fill="white" />}
        Iniciar Disparo
      </button>

      {/* Modo Instructor */}
      <div className="pt-4 border-t border-slate-100">
         <button 
           onClick={() => {
              const idealV = Math.sqrt(targetX * G);
              setTiro1({ angulo: 45, velocidad: Math.round(idealV) });
           }}
           className="w-full py-3 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
         >
           <Binary size={12} /> Auto-Calcular Demo
         </button>
      </div>

    </div>
  );
}
