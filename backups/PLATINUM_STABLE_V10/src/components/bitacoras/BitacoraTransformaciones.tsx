"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Move, RotateCw, Maximize, Target, Info, CheckCircle2, AlertCircle, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraTransformaciones() {
  const { geometria6, setTransformM6, validarM6 } = useSimuladorStore();
  const { tx, ty, rotacion, escala, status } = geometria6;

  const areaBase = 10; // Área base del polígono arbitraria
  const currentArea = areaBase * Math.pow(escala, 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* HUD HEADER */}
      <div className="bg-[#020617] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
           <Rocket size={14} className="animate-pulse" /> Consola de Navegación
        </div>
        <p className="text-xs font-bold text-slate-400 mb-4 leading-relaxed">
          Manipula los vectores de transformación para acoplar la sonda. El pivote de escala y rotación es el <span className="text-amber-400">Origen (0,0)</span>.
        </p>
        
        {/* TELEMETRÍA */}
        <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Vector Posición</div>
                <div className="text-xs font-mono font-bold text-amber-200">
                    V = <span className="text-white">[</span> {tx}, {ty} <span className="text-white">]</span>
                </div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Área Relativa</div>
                <div className="text-xs font-mono font-bold text-cyan-200">{currentArea.toFixed(1)} u²</div>
            </div>
        </div>
      </div>

      {/* CONTROLES DE VUELO */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        
        {/* ESCALA (MODIFICACIÓN DE TAMAÑO) */}
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Maximize size={12} className="text-amber-500" /> Homotecia (S)
                </h4>
                <span className="text-sm font-black text-slate-800">{escala.toFixed(1)}x</span>
            </div>
            <input 
              type="range" min="0.5" max="3.0" step="0.5" value={escala} 
              onChange={(e) => setTransformM6(tx, ty, rotacion, parseFloat(e.target.value))} 
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500" 
            />
        </div>

        {/* ROTACIÓN (ORIENTACIÓN) */}
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <RotateCw size={12} className="text-amber-500" /> Isometría (θ)
                </h4>
                <span className="text-sm font-black text-slate-800">{rotacion}°</span>
            </div>
            <input 
              type="range" min="0" max="360" step="15" value={rotacion} 
              onChange={(e) => setTransformM6(tx, ty, parseInt(e.target.value), escala)} 
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500" 
            />
        </div>

        {/* TRASLACIÓN X/Y */}
        <div className="space-y-4 pt-2 border-t border-slate-50">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 pl-1 mb-2">
                <Move size={12} className="text-amber-500" /> Traslación (T)
            </h4>
            
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1">
                    <span>EJE X</span>
                    <span className="text-slate-800 font-black">{tx}</span>
                </div>
                <input 
                  type="range" min="-10" max="10" step="1" value={tx} 
                  onChange={(e) => setTransformM6(parseInt(e.target.value), ty, rotacion, escala)} 
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-800" 
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-500 px-1">
                    <span>EJE Y</span>
                    <span className="text-slate-800 font-black">{ty}</span>
                </div>
                <input 
                  type="range" min="-10" max="10" step="1" value={ty} 
                  onChange={(e) => setTransformM6(tx, parseInt(e.target.value), rotacion, escala)} 
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-800" 
                />
            </div>
        </div>
      </div>

      {/* VALIDACIÓN */}
      <div className="pt-2">
            <button 
              onClick={validarM6}
              className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
                status === 'success' 
                ? 'bg-emerald-500 text-white shadow-emerald-100' 
                : status === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-[#020617] text-white shadow-slate-200 hover:bg-slate-800'
              }`}
            >
              {status === 'success' ? <><CheckCircle2 size={16} /> Acoplamiento Perfecto</> : status === 'error' ? <><AlertCircle size={16} /> Posición Incorrecta</> : 'Validar Acoplamiento'}
            </button>
            
            {status === 'error' && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-[9px] font-bold text-red-500 text-center px-4 leading-relaxed uppercase tracking-tighter">
                   Error en las coordenadas del radar. Ajusta Escala, luego Rotación y finalmente Traslación.
                </motion.p>
            )}
      </div>

      <div className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 flex gap-3 italic">
         <Info size={18} className="text-amber-400 shrink-0" />
         <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
            ¿Sabías que el orden importa? En matemáticas, las transformaciones no siempre son conmutativas. Experimenta cambiando la rotación antes que la escala.
         </p>
      </div>
    </div>
  );
}
