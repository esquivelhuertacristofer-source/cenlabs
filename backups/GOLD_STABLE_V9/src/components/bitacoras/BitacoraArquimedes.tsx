"use client";

import React, { useState } from 'react';
import { Droplets, Box, Shield } from 'lucide-react';

const G = 9.81;
const FLUIDOS: Record<string, { nombre: string; densidad: number }> = {
  agua: { nombre: 'Agua', densidad: 1000 },
  aceite: { nombre: 'Aceite de Oliva', densidad: 920 },
  glicerina: { nombre: 'Glicerina', densidad: 1261 },
};

export default function BitacoraArquimedes() {
  const [fluido, setFluido] = useState<'agua' | 'aceite' | 'glicerina'>('agua');
  const [densidadCuerpo, setDensidadCuerpo] = useState(800);
  const [volumenCuerpo] = useState(0.001); // m³ fijo

  const rhoFluido = FLUIDOS[fluido].densidad;
  const masaCuerpo = densidadCuerpo * volumenCuerpo;
  const peso = masaCuerpo * G;
  const empuje = rhoFluido * G * volumenCuerpo;
  const sumergido = Math.min(1, densidadCuerpo / rhoFluido);
  const estadoFlotacion = densidadCuerpo < rhoFluido ? 'Flota' : densidadCuerpo === rhoFluido ? 'Neutro' : 'Hundido';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* SELECTOR DE FLUIDO */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Propiedades de Fluido y Cuerpo</h3>
        
        <div className="flex p-1 bg-slate-100 rounded-2xl">
           <button 
             onClick={() => setFluido('agua')}
             className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${fluido === 'agua' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400'}`}
           >
             Agua
           </button>
           <button 
             onClick={() => setFluido('aceite')}
             className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${fluido === 'aceite' ? 'bg-yellow-600 text-white shadow-lg shadow-yellow-600/20' : 'text-slate-400'}`}
           >
             Aceite
           </button>
           <button 
             onClick={() => setFluido('glicerina')}
             className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${fluido === 'glicerina' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400'}`}
           >
             Glicerina
           </button>
        </div>

        {/* Densidad del Cuerpo */}
        <div className="p-6 bg-white border border-slate-200 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box size={14} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Densidad del Cuerpo (ρ)</span>
            </div>
            <span className="text-xl font-black text-[#023047]">{densidadCuerpo} <span className="text-[10px] text-slate-400">kg/m³</span></span>
          </div>
          <input 
            type="range" min="100" max="1500" step="50" 
            value={densidadCuerpo} 
            onChange={(e) => setDensidadCuerpo(parseInt(e.target.value))} 
            className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-400" 
          />
        </div>
      </div>

      {/* FUERZAS */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
          <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mb-1">Peso (W)</p>
          <p className="text-lg font-black text-red-600">{peso.toFixed(2)} <span className="text-[10px]">N</span></p>
        </div>
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
          <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Empuje (E)</p>
          <p className="text-lg font-black text-blue-600">{empuje.toFixed(2)} <span className="text-[10px]">N</span></p>
        </div>
      </div>

      {/* RESULTADO */}
      <div className="bg-[#023047] rounded-3xl p-6 text-white shadow-xl space-y-4">
         <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">Estado de Flotación</span>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${estadoFlotacion === 'Flota' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : estadoFlotacion === 'Neutro' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
               {estadoFlotacion}
            </span>
         </div>
         
         <div className="relative h-4 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 h-full bg-[#219EBC] transition-all duration-700"
              style={{ width: `${sumergido * 100}%` }}
            />
         </div>
         <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest">
            {(sumergido * 100).toFixed(0)}% Vol. Sumergido
         </p>
      </div>

      <div className="bg-blue-500/5 p-4 rounded-2xl border border-blue-500/20 flex gap-3">
         <Shield size={16} className="text-[#219EBC] shrink-0" />
         <p className="text-[10px] font-bold text-slate-500 italic leading-snug">
            Principio de Arquímedes: Todo cuerpo sumergido experimenta un empuje vertical hacia arriba igual al peso del fluido desalojado.
         </p>
      </div>

    </div>
  );
}
