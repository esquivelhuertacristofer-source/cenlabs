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

export default function BitacoraPreparacionSoluciones() {
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
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-cyan-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
             <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Analítica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la técnica de aforo, el pesado de soluto y el control del menisco.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Preparación
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-cyan-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Pesaje */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${Math.abs(matraz.polvo - mRequerida) < 0.05 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${Math.abs(matraz.polvo - mRequerida) < 0.05 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Calibración de Masa
                  </span>
                  <span className="text-xs font-bold text-white">
                     {Math.abs(matraz.polvo - mRequerida) < 0.05 ? '✓ Pesaje Preciso' : '... Esperando Pesada'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${Math.abs(matraz.polvo - mRequerida) < 0.05 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Aforo */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${accuracy > 98 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${accuracy > 98 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Exactitud del Aforo
                  </span>
                  <span className="text-xs font-bold text-white">
                     {accuracy > 98 ? '✓ Menisco Optimizado' : '... Diluyendo Solución'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${accuracy > 98 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
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
          onClick={() => { audio.playSuccess(); alert("Certificación Analítica Completada."); }}
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
