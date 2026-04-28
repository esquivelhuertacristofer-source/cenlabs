"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, FlaskConical, Microscope, Thermometer, TrendingUp
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraEquilibrioQuimico() {
  const { equilibrio, validarP8 } = useSimuladorStore();
  const [conclusionText, setConclusionText] = useState('');

  const quantumMsg = "Observa el cambio de color en las jeringas. El gas incoloro es el dímero N2O4, mientras que el gas café es el monómero NO2. Según Le Châtelier, si la reacción es endotérmica, el aumento de temperatura desplazará el equilibrio hacia el color café.";

  const handleReset = () => {
    // El reset se maneja usualmente re-ubicando jeringas en el simulador
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const hasAnalysis = equilibrio.jeringas.some(j => j.ubicacion !== 'mesa');
  const canValidate = hasAnalysis && wordCount >= 30;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría de Le Châtelier</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la interpretación cromática del desplazamiento del equilibrio térmico.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Equilibrio
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
            {/* Hallazgo: Estrés Térmico */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Estrés Térmico (+)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? '✓ Formación de NO₂ (Pardo)' : '... Ambiente Neutro'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Baño Criogénico */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Estrés Térmico (-)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? '✓ Formación de N₂O₄ (Incoloro)' : '... Sin Frío Extremo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE UNIDADES */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Monitoreo de Unidades</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetría In-Situ</p>
          </div>
        </div>

        <div className="space-y-2">
           {equilibrio.jeringas.map((j) => (
             <div key={j.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                   <span className="text-[8px] font-black text-slate-400 uppercase block">Jeringa #{j.id}</span>
                   <span className="text-[10px] font-black text-[#023047] uppercase italic">{j.ubicacion === 'mesa' ? 'Ambiente' : j.ubicacion === 'hielo' ? 'Criogenia' : 'Puntilla'}</span>
                </div>
                <div className="text-right">
                   <div className="flex items-center gap-2">
                      <Thermometer size={12} className={j.temp > 50 ? 'text-orange-500' : 'text-blue-400'} />
                      <span className={`text-xs font-black font-mono ${j.temp > 50 ? 'text-orange-600' : 'text-blue-600'}`}>{j.temp.toFixed(1)}°C</span>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Desplazamiento</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué sucede con la concentración de NO2 cuando se sumerge la jeringa en agua caliente y cómo se justifica esto mediante el Principio de Le Châtelier..."
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
          onClick={() => { audio.playSuccess(); alert("Misión de Equilibrio Certificada."); }}
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
