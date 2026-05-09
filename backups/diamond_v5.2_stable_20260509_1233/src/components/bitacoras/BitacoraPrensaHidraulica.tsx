"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Waves, Gauge, ArrowBigUp
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraPrensaHidraulica() {
  const { prensa5, setPrensa5 } = useSimuladorStore();
  const { f1, r1, r2, isLifting, resultado } = prensa5;
  const a1 = Math.PI * Math.pow(r1, 2);
  const a2 = Math.PI * Math.pow(r2, 2);

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `El principio de Pascal establece que la presión aplicada en un punto de un fluido incompresible se transmite sin pérdida a todos los rincones del sistema. Al aumentar el área del émbolo de salida, multiplicamos la fuerza original.`;

  const handleReset = () => {
    setPrensa5({ f1: 10, r1: 0.1, r2: 0.5, resultado: null });
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = resultado === 'exito' && wordCount >= 30;

  // Hallazgos en vivo
  const checkRatio = (a2 / a1) > 4;
  const checkPressure = f1 > 0;
  const checkLift = resultado === 'exito';

  // Cálculos
  const P_kpa = (f1 / a1) / 1000;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Ingeniería Hidrostática</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el Principio de Pascal y la optimización de la ventaja mecánica industrial.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Pascal
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center opacity-30">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-cyan-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Waves size={14} className="text-cyan-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Ventaja */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkRatio ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkRatio ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Ventaja Mecánica (A2/A1)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkRatio ? `✓ Ganancia de Fuerza: x${(a2 / a1).toFixed(2)}` : '... Incrementando r2'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkRatio ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Presión */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkPressure ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Transmisión de Presión
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkPressure ? `✓ P = ${P_kpa.toFixed(2)} kPa Telemétrica` : '... Aplicando Fuerza F1'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkPressure ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Elevación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkLift ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkLift ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Elevación Táctica
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkLift ? '✓ Elevación de Carga Exitosa' : '... Calibrando Pistón'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkLift ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR HIDRÁULICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Gauge size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Manómetro de Precisión</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">P1 = P2 (Isobarismo)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Radio Primario (r1)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{r1.toFixed(1)} cm</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Radio Salida (r2)</span>
              <span className="text-sm font-black text-cyan-600 font-mono">{r2.toFixed(1)} cm</span>
           </div>
        </div>

        <button 
          onClick={() => { setPrensa5({ isLifting: true }); audio.playPop(); }}
          disabled={isLifting}
          className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isLifting ? 'bg-slate-100 text-slate-400' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {isLifting ? 'Sistema en Elevación...' : 'Aplicar Presión'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Hidrostático</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué es la ventaja mecánica y por qué la presión se mantiene constante en todo el fluido a pesar de la diferencia de áreas..."
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
          onClick={() => { audio.playSuccess(); alert("Misión Hidráulica Certificada."); }}
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
