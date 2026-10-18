"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Activity, Zap, CheckCircle2, Star, Table, Info,
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, TrendingUp, MousePointer2
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { posicionM8, velocidadM8 } from '@/domain/matematicas';
import { audio } from '@/utils/audioEngine';

/** Coma decimal y signo menos tipográfico, como el dock y la barra del lab (−0 se escribe 0). */
const decimal = (v: number, d: number) => {
  const t = (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
  return t.replace('-', '−').replace('.', ',');
};

export default function BitacoraDerivadas({ onValidate }: { onValidate?: () => void }) {
  const { derivada8, resetM8 } = useSimuladorStore(useShallow((s) => ({ derivada8: s.derivada8, resetM8: s.resetM8 })));
  const { xActual, status, k, m } = derivada8;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `La posición del cohete es s(t) = −${k}·t³ + ${m}·t². Su derivada v(t) = s'(t) es la pendiente de la recta tangente. La velocidad es MÁXIMA donde su propia derivada, la aceleración a(t) = v'(t), se anula: deriva dos veces y resuelve a(t) = 0.`;

  const handleReset = () => {
    resetM8();
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = wordCount >= 30;

  // Cálculos en vivo: la MISMA función del panel, la escena y el validador.
  const cohete = { k, m };
  const vMarcada = velocidadM8(cohete, xActual);
  const sMarcada = posicionM8(cohete, xActual);
  const checkZeroSlope = xActual > 0; // ya hay un instante marcado

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
            La velocidad del cohete es la pendiente de la tangente a s(t). Busca el instante en que esa velocidad es máxima: ahí la aceleración se anula.
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
      {/* (fondo claro: el panel lateral es blanco; con bg-white/5 y texto blanco no se leía nada) */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-indigo-500" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Rastreo */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${xActual !== 0 ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex flex-col">
                   <span className={`text-[8px] font-black uppercase tracking-widest ${xActual !== 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Rastreo de Tangente
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                      {xActual !== 0 ? `✓ Tangente en t = ${decimal(xActual, 2)} s` : '... Esperando Movimiento'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${xActual !== 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
            </div>

            {/* Hallazgo: Pendiente Cero */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkZeroSlope ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkZeroSlope ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Instante marcado
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                     {checkZeroSlope ? `✓ t = ${decimal(xActual, 2)} s · s = ${decimal(sMarcada, 1)} m` : '... Marca un instante en el panel'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkZeroSlope ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            </div>

            {/* Hallazgo: Capturas */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${status === 'success' ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex flex-col">
                   <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Validación
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                      {status === 'success' ? '✓ Velocidad máxima localizada' : '... Pendiente de validar'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
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
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Monitor s'(t)</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Velocidad en el instante marcado</p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
           <div>
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">v(t) = pendiente de la tangente</span>
              <span className="text-sm font-black font-mono text-indigo-600">{decimal(vMarcada, 3)} m/s</span>
           </div>
           <div className="text-right">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Estado</span>
              <span className="text-[10px] font-black text-[#023047] uppercase">{vMarcada > 0 ? 'Ascenso' : vMarcada < 0 ? 'Descenso' : 'Reposo'}</span>
           </div>
        </div>

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
          onClick={() => onValidate?.()}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          Someter Análisis
        </button>
      </div>

    </div>
  );
}
