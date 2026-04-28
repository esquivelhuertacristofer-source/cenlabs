"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, Layers, Target, Info, CheckCircle2, AlertCircle, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

const MEDIOS = [
  { id: 1.00, nombre: "Aire (1.00)" },
  { id: 1.33, nombre: "Agua (1.33)" },
  { id: 1.50, nombre: "Vidrio (1.50)" },
  { id: 2.42, nombre: "Diamante (2.42)" },
];

export default function BitacoraSnell() {
  const { optica7, setOpticaM7, setUserInputM7, validarM7 } = useSimuladorStore();
  const { n1, n2, n2Misterio, anguloIncidencia, userInputN2, status } = optica7;

  // Cálculo de Refracción (Ley de Snell)
  const realN2 = n2 === 'misterio' ? n2Misterio : (n2 as number);
  const theta1Rad = (anguloIncidencia * Math.PI) / 180;
  const sinTheta2 = (n1 / realN2) * Math.sin(theta1Rad);
  
  const isTIR = sinTheta2 > 1.0;
  const theta2Deg = isTIR ? 0 : (Math.asin(sinTheta2) * 180) / Math.PI;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* HUD HEADER */}
      <div className="bg-[#020617] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
           <Zap size={14} className="animate-pulse" /> Laboratorio Óptico
        </div>
        <p className="text-xs font-bold text-slate-400 mb-4 leading-relaxed">
          Dispara el láser y mide la desviación angular. Tu misión es identificar el <span className="text-cyan-400">Cristal Misterioso</span> calculando su índice.
        </p>
        
        <div className="flex gap-2">
            <div className="flex-1 p-2 bg-white/5 rounded-xl border border-white/5 text-center">
                <div className="text-[8px] font-black text-slate-500 uppercase">sin(θ₁)</div>
                <div className="text-sm font-mono font-bold text-cyan-200">{Math.sin(theta1Rad).toFixed(4)}</div>
            </div>
            <div className="flex-1 p-2 bg-white/5 rounded-xl border border-white/5 text-center">
                <div className="text-[8px] font-black text-slate-500 uppercase">θ₂ Medido</div>
                <div className={`text-sm font-mono font-bold ${isTIR ? 'text-red-400' : 'text-fuchsia-200'}`}>
                    {isTIR ? 'R.I.T.' : `${theta2Deg.toFixed(1)}°`}
                </div>
            </div>
        </div>
      </div>

      {/* SELECTORES DE MEDIO */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 transition-all hover:shadow-md">
        
        <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 pl-1">
                <Layers size={14} className="text-cyan-500" /> Configuración de Medios
            </h4>
            
            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter pl-1">Medio Superior (n₁)</label>
                <select 
                    value={n1} 
                    onChange={(e) => setOpticaM7(parseFloat(e.target.value), n2, anguloIncidencia)}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-cyan-500 transition-colors"
                >
                    {MEDIOS.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
            </div>

            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter pl-1">Medio Inferior (n₂)</label>
                <select 
                    value={n2.toString()} 
                    onChange={(e) => {
                        const val = e.target.value === 'misterio' ? 'misterio' : parseFloat(e.target.value);
                        setOpticaM7(n1, val as any, anguloIncidencia);
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-cyan-500 transition-colors"
                >
                    <option value="misterio">Cristal Misterioso (?)</option>
                    {MEDIOS.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
            </div>
        </div>

        {/* ÁNGULO DE INCIDENCIA */}
        <div className="space-y-3 pt-2 border-t border-slate-50">
            <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Target size={12} className="text-cyan-500" /> Ángulo θ₁
                </h4>
                <span className="text-lg font-black text-slate-800 tracking-tighter">{anguloIncidencia}°</span>
            </div>
            <input 
              type="range" min="0" max="89" step="1" value={anguloIncidencia} 
              onChange={(e) => setOpticaM7(n1, n2, parseInt(e.target.value))} 
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
            />
        </div>
      </div>

      {/* VALIDACIÓN DE MATERIAL */}
      <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 space-y-4">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Identificador de Materia</h4>
        
        <div className="relative">
            <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
                type="number" step="0.01" placeholder="Ej: 1.54"
                value={userInputN2}
                onChange={(e) => setUserInputM7(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-cyan-500 transition-all placeholder:text-slate-300 shadow-inner"
            />
        </div>

        <button 
          onClick={validarM7}
          className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
            status === 'success' 
            ? 'bg-emerald-500 text-white shadow-emerald-100' 
            : status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-[#020617] text-white shadow-slate-200 hover:bg-slate-800'
          }`}
        >
          {status === 'success' ? <><CheckCircle2 size={16} /> Material Identificado</> : status === 'error' ? <><AlertCircle size={16} /> Cálculo Incorrecto</> : 'Validar Material'}
        </button>

        {status === 'error' && (
            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] font-bold text-red-500 text-center px-4 leading-relaxed tracking-tighter italic">
                Pista: n₂ = ({n1} · {Math.sin(theta1Rad).toFixed(4)}) / {Math.sin((theta2Deg * Math.PI) / 180).toFixed(4)}
            </motion.p>
        )}
      </div>

      <div className="p-5 bg-cyan-50/50 rounded-3xl border border-cyan-100 flex gap-3 italic">
         <Info size={18} className="text-cyan-400 shrink-0" />
         <p className="text-[10px] text-cyan-700 leading-relaxed font-medium">
            Cuando la luz viaja de un medio denso a uno más ligero, existe un ángulo crítico. Superarlo convierte al cristal en un espejo perfecto.
         </p>
      </div>
    </div>
  );
}
