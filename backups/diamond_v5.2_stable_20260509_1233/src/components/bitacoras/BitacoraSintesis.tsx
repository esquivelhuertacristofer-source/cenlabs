"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, Terminal, Database, AlertTriangle
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraSintesis() {
  const { sintesis, resetB3 } = useSimuladorStore();
  const { fase, proteina, arnMensajero, errores, status } = sintesis;
  const [conclusionText, setConclusionText] = useState("");

  const quantumMsg = "Dirige la síntesis de proteínas. Empareja los nucleótidos de ARN con la plantilla de ADN durante la transcripción. Luego, observa cómo el ribosoma traduce el mensaje en aminoácidos. ¡Cuidado con las mutaciones!";

  const handleReset = () => {
    resetB3();
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = status === 'success' && wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#1e1b4b] to-[#0f172a] p-6 rounded-[2.5rem] shadow-2xl border border-purple-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
             <span className="text-[10px] font-black text-purple-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Genómica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la transcripción y traducción del dogma central de la biología.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-purple-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Síntesis
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-purple-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Secuenciación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${arnMensajero.length > 0 ? 'bg-purple-500/10 border-purple-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${arnMensajero.length > 0 ? 'text-purple-400' : 'text-slate-500'}`}>
                     Secuenciación mRNA
                  </span>
                  <span className="text-xs font-bold text-white">
                     {arnMensajero.length > 0 ? `✓ ${arnMensajero.length} nucleótidos ensamblados` : '... Esperando Polimerización'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${arnMensajero.length > 0 ? 'bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Errores */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${errores === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${errores === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     Fidelidad Genética
                  </span>
                  <span className="text-xs font-bold text-white">
                     {errores === 0 ? '✓ Sin Mutaciones Detectadas' : `⚠ ${errores} Mutaciones Puntuales`}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${errores === 0 ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE BIO-INFORMÁTICA */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
            <Terminal size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Secuenciador V3</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado de Síntesis</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Fase Actual</span>
              <span className="text-sm font-black text-[#023047] uppercase italic">{fase}</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Proteína</span>
              <span className="text-sm font-black text-purple-600 font-mono">{proteina.length} AA</span>
           </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-[2rem] overflow-hidden">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 text-center">Cadena de ARNm</span>
           <div className="flex flex-wrap gap-1 justify-center min-h-[2rem]">
              {arnMensajero.split('').map((base, i) => (
                 <span key={i} className="text-xs font-black font-mono text-purple-400 bg-purple-500/10 px-1 rounded">{base}</span>
              ))}
           </div>
        </div>

        {status === 'success' && (
           <button 
             onClick={() => audio.playSuccess()}
             className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 animate-bounce"
           >
             Proteína Sintetizada con Éxito
           </button>
        )}
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Genómico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Describe la relación entre la secuencia de bases del ADN y la secuencia de aminoácidos en la proteína. ¿Cómo influyen las mutaciones en la estructura final de la macromolécula?..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-purple-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-purple-50 text-slate-400 hover:text-purple-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Certificación Genómica Completada."); }}
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
