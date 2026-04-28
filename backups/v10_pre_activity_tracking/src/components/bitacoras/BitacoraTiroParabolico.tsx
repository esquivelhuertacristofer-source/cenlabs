"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Crosshair, Zap, Activity, Binary } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';

interface BitacoraTiroProps {
  activateAnalysis?: boolean;
}

export default function BitacoraTiroParabolico({ activateAnalysis = false }: BitacoraTiroProps) {
  const tiro1 = useSimuladorStore(state => state.tiro1);
  const setTiro1 = useSimuladorStore(state => state.setTiro1);
  const ejecutarDisparoF1 = useSimuladorStore(state => state.ejecutarDisparoF1);
  const generarSemillaF1 = useSimuladorStore(state => state.generarSemillaF1);
  const { angulo = 45, velocidad = 25, disparando = false, targetX = 50, y0 = 0, obsX = 0, obsY = 0, municion = 3, escenario = 'tierra' } = tiro1;
  
  // Escenarios con sus Gravedades para el HUD
  const scenarios = [
    { id: 'tierra', label: 'Tierra', g: 9.81, color: 'sky' },
    { id: 'luna', label: 'Luna', g: 1.62, color: 'slate' },
    { id: 'marte', label: 'Marte', g: 3.71, color: 'rose' },
    { id: 'jupiter', label: 'Júpiter', g: 24.79, color: 'amber' }
  ];

  const currentG = scenarios.find(s => s.id === escenario)?.g || 9.81;

  const handleScenarioChange = (id: any) => {
    setTiro1({ escenario: id });
    setTimeout(() => generarSemillaF1(), 50);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* MISION SELECTOR - Diamond State Tabs */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selección de Misión Táctica</h3>
        <div className="grid grid-cols-4 gap-2">
           {scenarios.map(s => (
             <button
               key={s.id}
               onClick={() => handleScenarioChange(s.id)}
               disabled={disparando}
               className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter transition-all border ${
                  escenario === s.id 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
                  : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
               }`}
             >
               {s.label}
             </button>
           ))}
        </div>
      </div>

      {/* MONITORES DE TIRO */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        
        {/* Ángulo */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Ángulo Caleo (θ)</span>
           <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
             <input 
               type="number" min="0" max="90" step="0.1" 
               value={angulo} 
               disabled={disparando || municion === 0} 
               onChange={(e) => setTiro1({ angulo: parseFloat(e.target.value) || 0 })} 
               className="w-full bg-transparent p-3 text-lg font-black text-[#023047] text-center focus:outline-none focus:bg-indigo-50/50" 
             />
             <div className="pr-4 text-slate-400 font-black">°</div>
           </div>
        </div>

        {/* Velocidad */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Impulso Inicial (V₀)</span>
           <div className="flex items-center bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
              <input 
                type="number" min="1" max="300" step="0.1" 
                value={velocidad} 
                disabled={disparando || municion === 0} 
                onChange={(e) => setTiro1({ velocidad: parseFloat(e.target.value) || 0 })} 
                className="w-full bg-transparent p-3 text-lg font-black text-[#023047] text-center focus:outline-none focus:bg-indigo-50/50" 
              />
              <div className="pr-4 text-slate-400 font-black text-xs">m/s</div>
           </div>
        </div>
      </div>

      {/* MUNICIONES RESTANTES */}
      <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Munición Táctica</span>
         <div className="flex gap-2">
           {[1, 2, 3].map(i => (
             <div key={i} className={`h-3 w-8 rounded-full ${i <= municion ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-slate-800'}`} />
           ))}
         </div>
      </div>

      {/* HUD TELEMÉTRICO DE ENTORNO */}
      <div className="grid grid-cols-2 gap-4">
         <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-4 relative overflow-hidden group">
            <p className="text-[9px] font-black text-orange-400 uppercase mb-1">Muro Hmax</p>
            <p className="text-xl font-black text-slate-700 tabular-nums">{obsY.toFixed(1)} m</p>
            <div className="text-[8px] font-bold text-slate-500 mt-1">en X = {obsX}m</div>
            <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity"><Zap size={24} className="text-orange-400" /></div>
         </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 relative overflow-hidden group">
             <p className="text-[9px] font-black text-red-500 uppercase mb-1">Entorno Táctico</p>
             <p className="text-xl font-black text-slate-700 tabular-nums uppercase">{escenario}</p>
             <div className="text-[8px] font-bold text-slate-500 mt-1">G = {currentG} m/s²</div>
             <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity"><Crosshair size={24} className="text-red-500" /></div>
          </div>
      </div>

      {/* Botón de Ejecución */}
      {municion > 0 ? (
        <button 
          onClick={() => ejecutarDisparoF1()}
          disabled={disparando}
          className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${disparando ? 'bg-slate-100 text-slate-400' : 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-white shadow-sky-500/20'}`}
        >
          {disparando ? <Activity className="animate-spin" size={18} /> : <Zap size={18} fill="white" />}
          Lanzar Pulso Electromagnético
        </button>
      ) : (
        <button 
          onClick={() => generarSemillaF1()}
          className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/20 animate-pulse"
        >
          Solicitar Nueva Coordenada Target
        </button>
      )}

      {/* Modo Universitario: ADVERTENCIA */}
      <div className="pt-4 border-t border-slate-100">
         <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden group">
            <div className="flex gap-3">
              <Binary className="text-slate-400 shrink-0 mt-0.5" size={14} />
               <div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Ecuación de Trayectoria</span>
                 <div className="text-[11px] text-slate-600 mb-2 overflow-x-auto py-1">
                   <BlockMath math="y = y_0 + x \tan(\theta) - \frac{g x^2}{2 v_0^2 \cos^2(\theta)}" />
                 </div>
                 <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                   El terreno no es simétrico. Usa la ecuación anterior para calcular el impacto en <InlineMath math="y=0" /> o para asegurar que la trayectoria libre el obstáculo en <InlineMath math="x_{obs}" />.
                 </p>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
