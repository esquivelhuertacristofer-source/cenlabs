"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Droplets
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraPitagoras() {
  const { pitagoras, setCatetosM4, setLlenadoM4, validarM4, resetM4 } = useSimuladorStore();
  const { catetoA, catetoB, llenado, status } = pitagoras;

  const [conclusionText, setConclusionText] = useState('');
  const [userInputC, setUserInputC] = useState('');
  const [feedbackC, setFeedbackC] = useState<'idle' | 'correct' | 'wrong'>('idle');

  const quantumMsg = `Ajusta los catetos A y B para formar el triángulo. Luego, trasvasa el fluido de los cuadrados de los catetos hacia el cuadrado de la hipotenusa. ¡Verás que el área c² es exactamente igual a a² + b²!`;

  const handleReset = () => {
    resetM4();
    setConclusionText('');
    setUserInputC('');
    setFeedbackC('idle');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const hipotenusaReal = Math.sqrt(catetoA * catetoA + catetoB * catetoB);

  const checkC = () => {
    const val = parseFloat(userInputC);
    const ok = !isNaN(val) && Math.abs(val - hipotenusaReal) < 0.2;
    setFeedbackC(ok ? 'correct' : 'wrong');
    if (ok) audio.playSuccess(); else audio.playError();
  };

  const canValidate = feedbackC === 'correct' && wordCount >= 30;

  // Hallazgos en vivo
  const checkA = catetoA !== 3;
  const checkB = catetoB !== 4;
  const isFilled = llenado > 0.95;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Protocolo de Pitágoras</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el trasvase de áreas y la validación de la hipotenusa.
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
            <Shapes size={14} className="text-amber-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Dimensionamiento */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkA && checkB ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkA && checkB ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Configuración de Catetos
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkA && checkB ? '✓ Dimensiones Sincronizadas' : '... Ajustando Catetos'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkA && checkB ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Trasvase */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isFilled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isFilled ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Trasvase de Fluido (Área)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {isFilled ? '✓ Área Transferida a c²' : '... Operando Válvulas'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isFilled ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Validación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${feedbackC === 'correct' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${feedbackC === 'correct' ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Certificación Geométrica
                  </span>
                  <span className="text-xs font-bold text-white">
                     {feedbackC === 'correct' ? '✓ Teorema Verificado' : '... Calculando Hipotenusa'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${feedbackC === 'correct' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* CONSOLA DE CÁLCULO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Calculadora de Hipotenusa</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verifica el valor de c = √(a² + b²)</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Estimado de c</span>
            {feedbackC === 'correct' && <span className="text-[8px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">Correcto</span>}
          </div>
          <div className="flex gap-2">
            <input 
              type="number" value={userInputC} placeholder="Ingresa c..."
              onChange={e => { setUserInputC(e.target.value); setFeedbackC('idle'); }}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-amber-500"
            />
            <button onClick={checkC} className="px-4 bg-[#023047] text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Check</button>
          </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Observación de Áreas</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué sucede con el fluido cuando trasvasas de los catetos a la hipotenusa y cómo esto demuestra el teorema..."
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
          onClick={() => { const ok = validarM4(); if (ok) audio.playSuccess(); else audio.playError(); }}
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
