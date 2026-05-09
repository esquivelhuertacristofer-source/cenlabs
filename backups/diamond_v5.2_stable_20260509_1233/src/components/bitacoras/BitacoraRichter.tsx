"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Waves
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraRichter({ onValidate }: { onValidate?: () => void }) {
  const { richter, setMagnitudM3, toggleLogViewM3, audio: storeAudio } = useSimuladorStore();
  const { magnitudActual, magnitudBase, isLogView, status } = richter;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Ajusta la magnitud del sismo. Recuerda que la escala de Richter es logarítmica; cada unidad de aumento representa aproximadamente 32 veces más energía liberada. ¡Analiza el impacto energético para certificar el informe sísmico!`;

  const handleReset = () => {
    setMagnitudM3(3.0);
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = wordCount >= 30;

  // Hallazgos en vivo
  const checkMagnitud = magnitudActual !== 3.0;
  const checkLog = isLogView;
  const multiplicadorEnergetico = Math.pow(10, 1.5 * (magnitudActual - magnitudBase));

  const handleCertify = () => {
    if (onValidate) onValidate();
    else {
      audio.playSuccess();
      alert("Análisis Sísmico Registrado. Por favor usa el botón superior para finalizar.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-rose-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
             <span className="text-[10px] font-black text-rose-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Centro de Alerta Sísmica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir un informe sobre la relación exponencial entre la magnitud y la energía sísmica.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-rose-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Telemetría
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center opacity-30">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-rose-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Waves size={14} className="text-rose-500" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Magnitud */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkMagnitud ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white border-slate-100'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkMagnitud ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Magnitud de Momento (Mw)
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                     {checkMagnitud ? `✓ Magnitud registrada: ${magnitudActual.toFixed(1)}` : '... Esperando Ondas Sísmicas'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkMagnitud ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
            </div>

            {/* Hallazgo: Log View */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkLog ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white border-slate-100'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkLog ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Escala Logarítmica
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                     {checkLog ? '✓ Perspectiva Logarítmica Activa' : '... Visualizando Escala Lineal'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkLog ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>

            {/* Hallazgo: Multiplicador */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${multiplicadorEnergetico > 10 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white border-slate-100'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${multiplicadorEnergetico > 10 ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Diferencial Energético
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                     {multiplicadorEnergetico > 1 ? `✓ x${Math.round(multiplicadorEnergetico).toLocaleString()} veces más energía` : '... Calculando Delta E'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${multiplicadorEnergetico > 10 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR SISMOLÓGICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Monitor de Energía</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cálculo de magnitud vs energía liberada</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
           <div>
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Fórmula Logarítmica</span>
              <span className="text-xs font-black text-[#023047] font-mono italic">log(E) = 1.5Mw + 4.8</span>
           </div>
           <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">E Liberada</span>
              <span className="text-sm font-black text-rose-600 font-mono">{(Math.pow(10, 1.5 * magnitudActual + 4.8) / 1e9).toFixed(1)} GJ</span>
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Impacto</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica por qué un pequeño incremento en la magnitud de la escala de Richter resulta en un aumento tan masivo de la energía liberada..."
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
          onClick={handleCertify}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {wordCount >= 30 ? 'Certificar Informe' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}
