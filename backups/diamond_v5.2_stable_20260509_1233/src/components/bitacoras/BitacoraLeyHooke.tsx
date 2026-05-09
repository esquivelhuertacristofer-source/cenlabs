"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Ruler, Box
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraLeyHooke() {
  const { hooke4, setHooke4 } = useSimuladorStore();
  const { k, masa, estiramiento, animando, resultado } = hooke4;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Analiza la relación entre la carga aplicada y la deformación del resorte. Según la Ley de Hooke, la fuerza elástica es proporcional a la compresión (F = kx). Utiliza estos datos para determinar la constante de rigidez k del amortiguador.`;

  const handleReset = () => {
    setHooke4({ animando: false, resultado: null });
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = resultado === 'exito' && wordCount >= 30;

  // Hallazgos en vivo
  const checkK = k !== 100;
  const checkMasa = masa > 5;
  const checkStretch = estiramiento > 0.1;
  const checkCompresion = estiramiento > 0.05;

  // Cálculos
  const g = 9.81;
  const fuerza = masa * g;
  const energiaPotencial = 0.5 * k * estiramiento * estiramiento;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-indigo-400/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
             <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Calibración de Suspensión</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la Ley de Hooke y la constante de rigidez mecánica.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Elasticidad
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
            <Activity size={14} className="text-indigo-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Rigidez */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkK ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${resultado === 'exito' ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Calibración de Rigidez (k)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {resultado === 'exito' ? '✓ Estiramiento Certificado' : '... Analizando Constante'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${estiramiento > 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Carga */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkMasa ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkMasa ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Estrés Mecánico Rover
                  </span>
                  <span className="text-xs font-bold text-white">
                     {estiramiento > 0 ? `✓ ΔL = ${(estiramiento * 100).toFixed(1)} cm Detectada` : '... Esperando Carga'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkMasa ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Compresión */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkCompresion ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkCompresion ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Telemetría Láser (x)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkCompresion ? `✓ Compresión: ${(estiramiento * 100).toFixed(1)} cm` : '... Midiendo Deformación'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkCompresion ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR ELÁSTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Calculadora de Hooke</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Métricas de Energía y Fuerza</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Fuerza (F)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{fuerza.toFixed(2)} N</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Energía Elástica</span>
              <span className="text-sm font-black text-indigo-600 font-mono">{energiaPotencial.toFixed(3)} J</span>
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Elástico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué es la constante de rigidez k y cómo varía la energía potencial elástica almacenada al duplicar la compresión del resorte..."
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
          onClick={() => { audio.playSuccess(); alert("Perfil de Elasticidad Certificado."); }}
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
