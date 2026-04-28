"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, TrendingUp, MousePointer2
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraDerivadas() {
  const { derivada8, setXActualM8, resetM8, validarM8 } = useSimuladorStore();
  const { xActual, status } = derivada8;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Identifica los puntos críticos de la función. Mueve el cursor hasta que la pendiente (m) de la recta tangente sea exactamente cero. ¡En ese instante habrás localizado un máximo o mínimo local!`;

  const handleReset = () => {
    resetM8();
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = wordCount >= 30;

  // Cálculos en vivo
  const f_prime = 3 * xActual * xActual - 3; // Ejemplo para f(x) = x^3 - 3x + 2
  const checkZeroSlope = Math.abs(f_prime) < 0.2;
  const isCritical = Math.abs(xActual - 1) < 0.1 || Math.abs(xActual + 1) < 0.1;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Análisis de Pendientes</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la localización de puntos estacionarios mediante la derivada.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-indigo-600/20"
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
            <TrendingUp size={14} className="text-indigo-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Rastreo */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${xActual !== 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                   <span className={`text-[8px] font-black uppercase tracking-widest ${xActual !== 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Rastreo de Tangente
                  </span>
                  <span className="text-xs font-bold text-white">
                      {xActual !== 0 ? `✓ Posición: ${xActual.toFixed(2)}` : '... Esperando Movimiento'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${xActual !== 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Pendiente Cero */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkZeroSlope ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkZeroSlope ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Detección de Punto Crítico
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkZeroSlope ? '✓ Pendiente m ≈ 0 Localizada' : '... Buscando Mínimo/Máximo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkZeroSlope ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Capturas */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                   <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'success' ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Base de Datos Derivada
                  </span>
                  <span className="text-xs font-bold text-white">
                      {status === 'success' ? '✓ Análisis de Inflexión OK' : '... Buscando Puntos Críticos'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE PENDIENTE */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Monitor f'(x)</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valor instantáneo de la derivada</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
           <div>
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Pendiente (m)</span>
              <span className={`text-sm font-black font-mono ${checkZeroSlope ? 'text-emerald-500' : 'text-indigo-600'}`}>{f_prime.toFixed(4)}</span>
           </div>
           <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Estado</span>
              <span className="text-[10px] font-black text-[#023047] uppercase">{checkZeroSlope ? 'Punto Estacionario' : 'En Crecimiento'}</span>
           </div>
        </div>

        <button 
          onClick={() => { validarM8(); audio.playPop(); }}
          className="w-full py-3 bg-[#023047] hover:bg-[#054a6d] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
        >
          Capturar Punto Crítico
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Interpretación del Cálculo</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué relación existe entre el valor de la derivada y el crecimiento o decrecimiento de la función..."
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
          onClick={() => { audio.playSuccess(); alert("Perfil de Derivadas Certificado."); }}
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
