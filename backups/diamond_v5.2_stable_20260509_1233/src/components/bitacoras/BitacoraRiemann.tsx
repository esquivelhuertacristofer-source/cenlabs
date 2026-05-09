"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Layers, Sigma, Plus
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraRiemann() {
  const { integral9, setIntegralM9, resetM9, validarP10 } = useSimuladorStore();
  const { n, metodo, status } = integral9;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Aproxima el área bajo la curva mediante sumas de Riemann. Aumenta el número de rectángulos (n) para reducir el error de aproximación. ¡Observa cómo la suma tiende al valor exacto de la integral definida conforme n tiende a infinito!`;

  const handleReset = () => {
    resetM9();
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = n >= 20 && wordCount >= 30;

  // Hallazgos en vivo
  const checkDensity = n > 10;
  const checkDeltaX = n > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-amber-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
             <span className="text-[10px] font-black text-amber-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Protocolo de Integración</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la discretización de áreas y la convergencia de la suma de Riemann.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
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
               className="w-1 bg-amber-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Sigma size={14} className="text-amber-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Densidad */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkDensity ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkDensity ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Densidad de Muestreo (n)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkDensity ? `✓ Rectángulos activos: ${n}` : '... Incrementando Particiones'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkDensity ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Delta X */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkDeltaX ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkDeltaX ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Sincronía de Base (Δx)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkDeltaX ? `✓ Ancho de intervalo calculado` : '... Esperando Definición de n'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkDeltaX ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Precisión */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${n >= 40 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${n >= 40 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Convergencia de Área
                  </span>
                  <span className="text-xs font-bold text-white">
                     {n >= 40 ? '✓ Densidad de Partición Alta' : '... Incrementando n'}
                  </span>
               </div>
                <div className={`w-2 h-2 rounded-full ${n >= 40 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE ÁREA */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Monitor de Convergencia</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cálculo diferencial vs integral</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Área Σ Riemann</span>
              <span className="text-sm font-black text-[#023047] font-mono">{metodo}</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Error Absoluto</span>
              <span className="text-sm font-black font-mono text-amber-600">Calculando...</span>
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Límite</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué sucede con el error de aproximación cuando el número de rectángulos (n) aumenta significativamente..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-amber-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-amber-50 text-slate-400 hover:text-amber-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { setIntegralM9(Math.min(100, n + 10), metodo); audio.playPop(); }}
          className="w-14 h-14 bg-slate-100 hover:bg-amber-50 text-slate-400 hover:text-amber-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Plus size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Perfil de Integración Certificado."); }}
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
