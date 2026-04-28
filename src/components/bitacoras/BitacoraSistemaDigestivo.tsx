"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, FlaskConical, Droplets, Thermometer, Play
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraSistemaDigestivo() {
  const { digestion, setDigestion, resetB9 } = useSimuladorStore();
  const { macronutriente, enzimaSeleccionada, nivelPH, estado, monomerosAbsorbidos, status } = digestion;
  const [conclusionText, setConclusionText] = useState("");

  const quantumMsg = "Monitorea la actividad enzimática. Ajusta el pH para optimizar la digestión de macromoléculas. Recuerda que la pepsina requiere un ambiente altamente ácido para ser funcional. ¡Observa la hidrólisis!";

  const handleReset = () => {
    resetB9();
    setConclusionText("");
    audio.playPop();
  };

  const rules: Record<string, { enzima: string, phRange: [number, number] }> = {
    almidon: { enzima: 'amilasa', phRange: [6.5, 7.5] },
    proteina: { enzima: 'pepsina', phRange: [1.5, 2.5] },
    lipido: { enzima: 'lipasa', phRange: [7.5, 8.5] }
  };

  const rule = rules[macronutriente];
  const isPHOk = nivelPH >= rule.phRange[0] && nivelPH <= rule.phRange[1];
  const isEnzymeOk = enzimaSeleccionada === rule.enzima;

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = status === 'success' && wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#3d0a0a] to-[#0f172a] p-6 rounded-[2.5rem] shadow-2xl border border-rose-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
             <span className="text-[10px] font-black text-rose-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Metabólica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la cinética enzimática y la desnaturalización por pH.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-rose-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Digestivo
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-rose-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: pH */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isPHOk ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isPHOk ? 'text-rose-400' : 'text-slate-500'}`}>
                     Entorno Enzimático
                  </span>
                  <span className="text-xs font-bold text-white">
                     {isPHOk ? '✓ pH Óptimo Alcanzado' : '... pH Subóptimo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isPHOk ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Hidrólisis */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${estado === 'digerido' ? 'bg-rose-500/10 border-rose-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${estado === 'digerido' ? 'text-rose-400' : 'text-slate-500'}`}>
                     Proceso de Hidrólisis
                  </span>
                  <span className="text-xs font-bold text-white">
                     {estado === 'digerido' ? '✓ Degradación Exitosa' : (estado === 'desnaturalizado' ? '⚠ Enzima Desnaturalizada' : '... Esperando Reacción')}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${estado === 'digerido' ? 'bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR METABÓLICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Absorción Intestinal</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Métrica de Nutrientes</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Polímero</span>
              <span className="text-sm font-black text-[#023047] uppercase italic">{macronutriente}</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">pH Actual</span>
              <span className="text-sm font-black text-rose-600 font-mono">{nivelPH.toFixed(1)}</span>
           </div>
        </div>

        <div className="p-6 bg-slate-900 rounded-[2rem] text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Absorción Sanguínea</span>
           <span className="text-4xl font-black text-white font-mono">{monomerosAbsorbidos}</span>
           <span className="text-xs font-black text-rose-400 ml-2">%</span>
        </div>

        <button 
          onClick={() => { if(isEnzymeOk && isPHOk) { setDigestion({ estado: 'digerido' }); audio.playSuccess(); } else { setDigestion({ estado: isEnzymeOk ? 'desnaturalizado' : 'intacto' }); audio.playError(); } }}
          disabled={estado === 'digerido'}
          className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${estado === 'digerido' ? 'bg-emerald-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {estado === 'digerido' ? 'Digestión Completada' : 'Inyectar Enzima Seleccionada'}
        </button>

        {monomerosAbsorbidos === 100 && (
           <button 
             onClick={() => { setDigestion({ status: 'success' }); audio.playSuccess(); }}
             className="w-full py-3 rounded-xl bg-rose-500 text-white font-black text-[9px] uppercase tracking-widest animate-pulse"
           >
             Certificar Proceso Metabólico
           </button>
        )}
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Metabólico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica por qué cada enzima requiere un pH específico para funcionar y qué sucede con la estructura de la proteína enzimática cuando el entorno es demasiado ácido o alcalino..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-rose-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Certificación Metabólica Completada."); }}
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
