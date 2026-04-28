"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, Play, Square, RotateCcw, TrendingUp, Heart
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraPoblaciones() {
  const { ecosistema, setEcosistema, resetB10 } = useSimuladorStore();
  const { poblacionPresas, poblacionDepredadores, alfa, beta, gamma, tiempoVirtual, simulando, status } = ecosistema;
  const [conclusionText, setConclusionText] = useState("");

  const quantumMsg = "Monitorea la dinámica de poblaciones. Ajusta las tasas de crecimiento (alfa) y depredación (beta) para alcanzar un equilibrio estable de Lotka-Volterra. ¡Asegúrate de que ninguna especie se extinga en 50 años!";

  const handleReset = () => {
    resetB10();
    setConclusionText("");
    audio.playPop();
  };

  const isStable = poblacionPresas > 5 && poblacionDepredadores > 2;
  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = status === 'success' && wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] p-6 rounded-[2.5rem] shadow-2xl border border-blue-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
             <span className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Ecológica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el modelo de Lotka-Volterra y el equilibrio depredador-presa.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Ecológico
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-blue-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Estabilidad */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isStable ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isStable ? 'text-blue-400' : 'text-slate-500'}`}>
                     Equilibrio Dinámico
                  </span>
                  <span className="text-xs font-bold text-white">
                     {isStable ? '✓ Coexistencia de Especies' : '... Riesgo de Extinción'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isStable ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
            </div>

            {/* Hallazgo: Tiempo */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${tiempoVirtual >= 25 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${tiempoVirtual >= 25 ? 'text-blue-400' : 'text-slate-500'}`}>
                     Longevidad del Sistema
                  </span>
                  <span className="text-xs font-bold text-white">
                     {tiempoVirtual >= 25 ? `✓ Simulación: ${tiempoVirtual.toFixed(1)} años` : '... Ejecutando Proyección'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${tiempoVirtual >= 25 ? 'bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR ECOLÓGICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Estado del Biotopo</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Censo Poblacional</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-pink-500 uppercase block mb-1">Presas (Conejos)</span>
              <span className="text-2xl font-black text-[#023047]">{poblacionPresas.toFixed(0)}</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-blue-500 uppercase block mb-1">Depredadores (Lobos)</span>
              <span className="text-2xl font-black text-[#023047]">{poblacionDepredadores.toFixed(0)}</span>
           </div>
        </div>

        <div className="flex gap-3">
          <button
             onClick={() => setEcosistema({ simulando: !simulando })}
             disabled={status === 'success'}
             className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${simulando ? 'bg-amber-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
          >
             {simulando ? <Square size={14} /> : <Play size={14} />}
             {simulando ? 'Pausar' : 'Iniciar'}
          </button>
          <button 
             onClick={handleReset}
             className="w-14 h-14 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 transition-colors"
          >
             <RotateCcw size={18} />
          </button>
        </div>

        {tiempoVirtual >= 50 && (
           <button 
             onClick={() => { setEcosistema({ status: 'success' }); audio.playSuccess(); }}
             className="w-full py-3 rounded-xl bg-blue-500 text-white font-black text-[9px] uppercase tracking-widest animate-pulse"
           >
             Certificar Equilibrio Ecológico
           </button>
        )}
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Ecológico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Describe las oscilaciones observadas en las poblaciones de presas y depredadores. ¿Cómo influyen las tasas de natalidad y mortalidad en la estabilidad a largo plazo del ecosistema?..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-blue-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Certificación Ecológica Completada."); }}
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
