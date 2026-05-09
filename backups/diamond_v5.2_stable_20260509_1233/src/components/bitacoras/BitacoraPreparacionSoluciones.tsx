"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, FlaskConical, Scale
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraPreparacionSoluciones({ onValidate }: { onValidate?: () => void }) {
  const { soluciones, validarP5 } = useSimuladorStore();
  const [conclusionText, setConclusionText] = useState("");

  const { 
    sal = { nombre: 'Cloruro de Sodio', formula: 'NaCl', pm: 58.44, purity: 0.985 }, 
    matraz = { polvo: 0, agua: 0 }, 
    mRequerida = 7.305, 
    mTarget = 0.5, 
    status = 'idle' 
  } = soluciones || {};

  const quantumMsg = "Para preparar la solución con precisión, primero aplica la TARA en la balanza para descontar el peso del vidrio de reloj. Luego, añade el solvente lentamente; el menisco debe quedar exactamente sobre la línea de aforo.";

  const masaEfectiva = (matraz?.polvo || 0) * (sal?.purity || 0.985);
  const currentMolarity = (matraz?.agua || 0) > 0 
    ? ((masaEfectiva / (sal?.pm || 58.44)) / ((matraz?.agua || 0) / 1000)) 
    : 0;
  
  const accuracy = Math.max(0, 100 - Math.abs((currentMolarity - mTarget) / mTarget) * 100);

  const handleReset = () => {
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = status === 'success' && wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-[#023047] p-8 rounded-[2.5rem] shadow-2xl border border-cyan-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
           <Bot size={80} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
             <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
             <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Protocolo de Preparación Activo</span>
          </div>
          
          <h4 className="text-white text-2xl font-black leading-tight mb-4 tracking-tighter uppercase italic">Guía de Aforo Analítico</h4>
          <p className="text-[11px] text-slate-300 font-medium mb-8 leading-relaxed max-w-sm">
            Para una molaridad nominal, pesa el reactivo con precisión de miligramos. Al diluir, usa el modo goteo cuando el menisco esté a 5mL de la marca de aforo.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-cyan-900/40 border border-white/10"
          >
            <Volume2 size={18} fill="currentColor" />
            Escuchar Instrucciones de Dr. Quantum
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-[#023047]/5 rounded-[2.5rem] border border-[#023047]/10 p-8 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600">
               <Microscope size={16} />
            </div>
            <h4 className="text-[10px] font-black text-[#023047] uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>
 
         <div className="space-y-4">
            {/* Hallazgo: Pesaje */}
            <div className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${Math.abs(matraz.polvo - mRequerida) < 0.05 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 shadow-sm'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${Math.abs(matraz.polvo - mRequerida) < 0.05 ? 'text-emerald-600' : 'text-slate-400'}`}>
                     Calibración de Masa
                  </span>
                  <span className={`text-xs font-bold ${Math.abs(matraz.polvo - mRequerida) < 0.05 ? 'text-emerald-900' : 'text-slate-600'}`}>
                     {Math.abs(matraz.polvo - mRequerida) < 0.05 ? '✓ Pesaje Preciso' : '... Esperando Pesada'}
                  </span>
               </div>
               <div className={`w-3 h-3 rounded-full ${Math.abs(matraz.polvo - mRequerida) < 0.05 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-200'}`} />
            </div>
 
            {/* Hallazgo: Aforo */}
            <div className={`p-5 rounded-2xl border transition-all flex items-center justify-between ${accuracy > 98 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 shadow-sm'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${accuracy > 98 ? 'text-emerald-600' : 'text-slate-400'}`}>
                     Exactitud del Aforo
                  </span>
                  <span className={`text-xs font-bold ${accuracy > 98 ? 'text-emerald-900' : 'text-slate-600'}`}>
                     {accuracy > 98 ? '✓ Menisco Optimizado' : '... Diluyendo Solución'}
                  </span>
               </div>
               <div className={`w-3 h-3 rounded-full ${accuracy > 98 ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-200'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR ANALÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Concentración Molar</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">M = n / V (L)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Masa ({sal.formula})</span>
              <span className="text-sm font-black text-[#023047] font-mono">{matraz.polvo.toFixed(3)} g</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Volumen H₂O</span>
              <span className="text-sm font-black text-cyan-600 font-mono">{matraz.agua.toFixed(1)} mL</span>
           </div>
        </div>

        <div className="p-6 bg-slate-900 rounded-[2rem] text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Molaridad Resultante</span>
           <span className="text-4xl font-black text-white font-mono">{currentMolarity.toFixed(3)}</span>
           <span className="text-xs font-black text-cyan-400 ml-2">M</span>
        </div>

        <button 
          onClick={() => { const ok = validarP5(); if(ok) audio.playSuccess(); else audio.playError(); }}
          disabled={status === 'success'}
          className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {status === 'success' ? 'Protocolo Certificado' : 'Validar Preparación'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Preparación</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica la importancia de considerar la pureza del reactivo en el cálculo de la masa y cómo un error en el aforo afecta la molaridad final de la solución..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-cyan-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-cyan-50 text-slate-400 hover:text-cyan-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { 
            if (onValidate) onValidate();
            else { audio.playSuccess(); alert("Certificación Analítica Completada."); }
          }}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {canValidate ? 'Misión Certificada' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}
