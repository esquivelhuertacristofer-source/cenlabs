"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, Scale, Plus, Minus, Terminal
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

export default function BitacoraBalanceoEcuaciones({ onValidate }: { onValidate?: () => void }) {
  const { balanceo, setCoeficiente } = useSimuladorStore();
  const [conclusionText, setConclusionText] = useState("");

  const { 
    reaccionActual = 0, 
    reacciones = [], 
    coeficientes = [], 
    isBalanced = false, 
    masaReactivos = 0,
    masaProductos = 0
  } = balanceo;

  const currentReac = reacciones[reaccionActual];
  
  const handleCoefChange = (idx: number, delta: number) => {
    const newVal = Math.max(1, (coeficientes[idx] || 1) + delta);
    setCoeficiente(idx, newVal);
    audio.playPop();
  };

  const handleReset = () => {
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = isBalanced && wordCount >= 50;

  if (!currentReac) return null;

  // Función para convertir formula a LaTeX
  const toLatex = (formula: string) => {
    return formula.replace(/(\d+)/g, '_{$1}');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-cyan-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
             <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.2em]">Sincronía Cuántica Activa</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Protocolo de Fusión {currentReac.id.toUpperCase()}</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Estamos operando en el reactor central. La estabilidad del sistema depende de la igualdad de masas moleculares.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Recibir Informe de Telemetría
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-cyan-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Monitor de Estabilidad Atómica</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Conservación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${Math.abs(masaReactivos - masaProductos) < 0.01 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${Math.abs(masaReactivos - masaProductos) < 0.01 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Masa Molar Total
                  </span>
                  <span className="text-xs font-bold text-white">
                     {Math.abs(masaReactivos - masaProductos) < 0.01 ? '✓ Lavoisier Verificado' : '... Detectando Diferencia de Masa'}
                  </span>
               </div>
               <div className={`text-xs font-black tabular-nums ${Math.abs(masaReactivos - masaProductos) < 0.01 ? 'text-emerald-400' : 'text-slate-400'}`}>
                 Δ {Math.abs(masaReactivos - masaProductos).toFixed(3)}
               </div>
            </div>

            {/* Hallazgo: Sincronía */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isBalanced ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Estado de Fusión
                  </span>
                  <span className="text-xs font-bold text-white">
                     {isBalanced ? '✓ Reactor Estable (100%)' : '... Inestabilidad de Coeficientes'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isBalanced ? 'bg-emerald-400 shadow-[0_0_15px_#10b981]' : 'bg-slate-600 animate-pulse'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR ESTEQUIOMÉTRICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Shapes size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Inyectores de Masa</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{currentReac.nombre}</p>
          </div>
        </div>

        <div className="space-y-6">
           {/* Reactivos */}
           <div className="grid gap-2">
             <div className="px-2 flex justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Reactivos</span>
             </div>
             {currentReac.reactivos.map((mol: any, idx: number) => (
               <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-cyan-200 transition-colors">
                  <div className="flex flex-col">
                     <span className="text-sm font-black text-[#023047]">
                        <InlineMath math={toLatex(mol.formula)} />
                     </span>
                     <span className="text-[8px] font-bold text-slate-400 uppercase">{mol.molar} g/mol</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                     <button onClick={() => handleCoefChange(idx, -1)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 flex items-center justify-center font-black">-</button>
                     <span className="w-6 text-center font-black text-[#023047] text-lg">{coeficientes[idx] || 1}</span>
                     <button onClick={() => handleCoefChange(idx, 1)} className="w-8 h-8 rounded-lg bg-[#023047] text-white shadow-lg active:scale-95 flex items-center justify-center font-black">+</button>
                  </div>
               </div>
             ))}
           </div>
           
           <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-slate-100 flex-1" />
              <Zap size={14} className="text-slate-300" />
              <div className="h-px bg-slate-100 flex-1" />
           </div>

           {/* Productos */}
           <div className="grid gap-2">
             <div className="px-2 flex justify-between">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Productos</span>
             </div>
             {currentReac.productos.map((mol: any, idx: number) => {
               const gIdx = currentReac.reactivos.length + idx;
               return (
                 <div key={gIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-orange-200 transition-colors">
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-orange-600">
                          <InlineMath math={toLatex(mol.formula)} />
                       </span>
                       <span className="text-[8px] font-bold text-slate-400 uppercase">{mol.molar} g/mol</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                       <button onClick={() => handleCoefChange(gIdx, -1)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 flex items-center justify-center font-black">-</button>
                       <span className="w-6 text-center font-black text-[#023047] text-lg">{coeficientes[gIdx] || 1}</span>
                       <button onClick={() => handleCoefChange(gIdx, 1)} className="w-8 h-8 rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center font-black">+</button>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Informe de Certificación (Ley de Lavoisier)</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 50 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/50</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica la importancia de la conservación de la materia en este proceso industrial y por qué los coeficientes deben ser números enteros según el modelo atómico..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-cyan-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={onValidate}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white shadow-cyan-900/40' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {canValidate ? 'Certificar Misión' : 'Someter a Auditoría'}
        </button>
      </div>

    </div>
  );
}

