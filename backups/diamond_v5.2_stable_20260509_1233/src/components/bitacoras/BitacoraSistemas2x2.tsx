"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, ChevronDown, ChevronUp, Calculator, BookOpen,
  Binary, Compass, Layers, Sigma, Bot, Volume2, Microscope, Crosshair
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraSistemas2x2({ onValidate }: { onValidate?: () => void }) {
  const { sistemas2x2, validarM2, resetM2, bitacoraData, setBitacora } = useSimuladorStore();
  const { m1, b1, m2, b2, target, status } = sistemas2x2;
  
  const isParallel = Math.abs(m1 - m2) < 0.001;
  const x = !isParallel ? (b2 - b1) / (m1 - m2) : 0;
  const y = !isParallel ? m1 * x + b1 : 0;
  const xTarget = target.x;
  const yTarget = target.y;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Sintoniza los láseres Alpha y Omega. El punto donde se cruzan es la solución única del sistema de ecuaciones. ¡Asegúrate de que las coordenadas coincidan con el objetivo de telemetría para certificar la misión!`;

  const handleReset = () => {
    resetM2();
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = wordCount >= 30;

  // Checks de Hallazgos en Vivo
  const checkX = Math.abs(x - xTarget) < 0.1;
  const checkY = Math.abs(y - yTarget) < 0.1;
  const isIntersecting = checkX && checkY;

  const handleCertify = () => {
    if (onValidate) onValidate();
    else {
      const ok = validarM2();
      if (ok) audio.playSuccess(); else audio.playError();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-indigo-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
             <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Protocolo de Intersección</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la sintonización de haces lineales y la búsqueda de soluciones únicas.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-50 hover:to-indigo-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
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
               className="w-1 bg-indigo-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Crosshair size={14} className="text-indigo-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Sincronía Alpha */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkX ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkX ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Láser Alpha (Coordenada X)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkX ? '✓ Haz Alpha Sincronizado' : '... Calibrando Eje X'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkX ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Sincronía Omega */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkY ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkY ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Láser Omega (Coordenada Y)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkY ? '✓ Haz Omega Sincronizado' : '... Calibrando Eje Y'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkY ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Intersección */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isIntersecting ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isIntersecting ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Intersección de Solución
                  </span>
                  <span className="text-xs font-bold text-white">
                     {isIntersecting ? '✓ Solución Única Encontrada' : '... Buscando Punto de Cruce'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isIntersecting ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE TELEMETRÍA */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Monitor de Coordenadas</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado actual de la intersección lineal</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">X Actual</span>
              <span className="text-lg font-black text-indigo-600 font-mono">{x.toFixed(2)}</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Y Actual</span>
              <span className="text-lg font-black text-indigo-600 font-mono">{y.toFixed(2)}</span>
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Interpretación Gráfica</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué representa el punto de intersección en el contexto de un sistema de ecuaciones lineales..."
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
          onClick={handleCertify}
          disabled={!canValidate && status !== 'success'}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${status === 'success' ? 'bg-emerald-500 text-white' : canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          {status === 'success' ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
          {status === 'success' ? 'Misión Certificada' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}
