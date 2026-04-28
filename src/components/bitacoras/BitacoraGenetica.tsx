"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, Dna, Users, BarChart3, RotateCcw
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraGenetica() {
  const { genetica, setGenetica, generarF1, resetB5 } = useSimuladorStore();
  const { padre1, padre2, tamanioMuestra, poblacionF1, status } = genetica;
  const [conclusionText, setConclusionText] = useState("");

  const quantumMsg = "Realiza los cruces parentales y observa la distribución fenotípica en la F1. Recuerda que la segregación independiente de los alelos sigue las leyes de Mendel. ¡La variabilidad genética es la base de la biodiversidad!";

  const countFenotipos = () => {
    const counts = { 'amarillo-liso': 0, 'amarillo-rugoso': 0, 'verde-liso': 0, 'verde-rugoso': 0 };
    poblacionF1.forEach(gen => {
      const isYellow = gen.includes('A');
      const isSmooth = gen.includes('B');
      
      if (isYellow && isSmooth) counts['amarillo-liso']++;
      else if (isYellow && !isSmooth) counts['amarillo-rugoso']++;
      else if (!isYellow && isSmooth) counts['verde-liso']++;
      else counts['verde-rugoso']++;
    });
    return counts;
  };

  const actuals = countFenotipos();
  const total = poblacionF1.length || 1;

  const fenotiposData = [
    { id: 'amarillo-liso', label: 'Amarillo / Liso', color: '#fbbf24', teorico: 56.25 },
    { id: 'amarillo-rugoso', label: 'Amarillo / Rugoso', color: '#f59e0b', teorico: 18.75 },
    { id: 'verde-liso', label: 'Verde / Liso', color: '#22c55e', teorico: 18.75 },
    { id: 'verde-rugoso', label: 'Verde / Rugoso', color: '#15803d', teorico: 6.25 },
  ];

  const handleReset = () => {
    resetB5();
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = status === 'success' && wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] p-6 rounded-[2.5rem] shadow-2xl border border-indigo-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
             <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Genética</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre las leyes de Mendel y la segregación de alelos.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Genético
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Dna size={14} className="text-indigo-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Cruce */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${status === 'success' ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'success' ? 'text-indigo-400' : 'text-slate-500'}`}>
                     Fecundación F1
                  </span>
                  <span className="text-xs font-bold text-white">
                     {status === 'success' ? '✓ Población F1 Generada' : '... Esperando Cruce'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Muestra */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${tamanioMuestra >= 100 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${tamanioMuestra >= 100 ? 'text-indigo-400' : 'text-slate-500'}`}>
                     Nivel de Confianza
                  </span>
                  <span className="text-xs font-bold text-white">
                     {tamanioMuestra >= 100 ? '✓ Muestra Representativa' : '... Aumentar Tamaño N'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${tamanioMuestra >= 100 ? 'bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE FENOTIPOS */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Distribución F1</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Métrica de Mendel</p>
          </div>
        </div>

        <div className="space-y-3">
           {fenotiposData.map((f) => {
              const actual = (actuals[f.id as keyof typeof actuals] / total) * 100;
              return (
                 <div key={f.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: f.color }}>{f.label}</span>
                       <span className="text-[10px] font-black text-[#023047]">{actual.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${actual}%` }}
                         className="h-full"
                         style={{ backgroundColor: f.color }}
                       />
                    </div>
                 </div>
              );
           })}
        </div>

        <button 
          onClick={() => { generarF1(); audio.playSuccess(); }}
          disabled={status === 'success'}
          className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${status === 'success' ? 'bg-indigo-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {status === 'success' ? 'Cruces Registrados' : 'Generar Cruce F1'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Genético</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica cómo la segregación independiente de los alelos resulta en las proporciones fenotípicas observadas y cómo influye el tamaño de la muestra en la precisión de los resultados..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-indigo-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Certificación Genética Completada."); }}
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
