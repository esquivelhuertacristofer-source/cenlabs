"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, MoveHorizontal, ShieldAlert, Activity } from 'lucide-react';

export default function BitacoraElectrostatica() {
  const { electrostatica9, setElectrostatica9 } = useSimuladorStore();
  const { q1 = 1, q2 = -1, distancia = 0.5 } = electrostatica9 || {};

  // Ley de Coulomb: F = k * |q1 * q2| / r^2
  const K = 8.987e9;
  const q1_true = q1 * 1e-6; // microCoulombs
  const q2_true = q2 * 1e-6;
  const fuerza = (K * Math.abs(q1_true * q2_true)) / Math.pow(distancia, 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MONITORES DE CARGA */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Configuración de Cargas</h3>
        
        {/* Carga 1 (q1) */}
        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 font-mono">q₁ (μC)</span>
            <span className="text-xl font-black text-slate-700">{q1 > 0 ? '+' : ''}{q1}</span>
          </div>
          <input 
            type="range" min="-10" max="10" step="1" 
            value={q1} 
            onChange={(e) => setElectrostatica9({ q1: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-500" 
          />
        </div>

        {/* Carga 2 (q2) */}
        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 font-mono">q₂ (μC)</span>
            <span className="text-xl font-black text-slate-700">{q2 > 0 ? '+' : ''}{q2}</span>
          </div>
          <input 
            type="range" min="-10" max="10" step="1" 
            value={q2} 
            onChange={(e) => setElectrostatica9({ q2: parseInt(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-red-500" 
          />
        </div>

        {/* Distancia (r) */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MoveHorizontal size={14} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Separación (r)</span>
            </div>
            <span className="text-xl font-black text-[#023047]">{distancia.toFixed(2)} m</span>
          </div>
          <input 
            type="range" min="0.1" max="2" step="0.05" 
            value={distancia} 
            onChange={(e) => setElectrostatica9({ distancia: parseFloat(e.target.value) })} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500" 
          />
        </div>
      </div>

      {/* RESULTADO (FUERZA) */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl space-y-4">
         <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Fuerza de Coulomb</span>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black font-mono text-yellow-400">{fuerza.toFixed(3)}</span>
               <span className="text-sm text-slate-400">N</span>
            </div>
         </div>
         
         <div className="flex items-center gap-2 py-2 border-t border-white/5">
            <ShieldAlert size={14} className={q1 * q2 < 0 ? 'text-blue-400' : 'text-red-400'} />
            <span className={`text-[10px] font-black uppercase tracking-widest ${q1 * q2 < 0 ? 'text-blue-400' : 'text-red-400'}`}>
               {q1 * q2 < 0 ? 'Atracción' : (q1 * q2 > 0 ? 'Repulsión' : 'Carga Neutra')}
            </span>
         </div>
      </div>

    </div>
  );
}
