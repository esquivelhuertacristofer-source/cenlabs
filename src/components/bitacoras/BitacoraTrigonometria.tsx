"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Activity, Zap, CheckCircle2, Star, Table, Info,
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, MoveHorizontal, RotateCw
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

/** Coma decimal y signo menos tipográfico, como el dock del lab (−0 se escribe 0). */
const decimal = (v: number) => {
  const t = (Math.abs(v) < 5e-5 ? 0 : v).toFixed(4);
  return t.replace('-', '−').replace('.', ',');
};

export default function BitacoraTrigonometria({ onValidate }: { onValidate?: () => void }) {
  const { trigonometria, registrarHallazgoM5, resetM5 } = useSimuladorStore(
    useShallow((s) => ({ trigonometria: s.trigonometria, registrarHallazgoM5: s.registrarHallazgoM5, resetM5: s.resetM5 })),
  );
  const { angulo, hallazgos, objetivo, animando } = trigonometria;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Explora las funciones trigonométricas en el círculo unitario: el seno es la ordenada y el coseno la abscisa del vector. Resuelve la ecuación del reto: tiene dos soluciones en una vuelta, una en cada cuadrante donde la función tiene ese signo.`;

  const handleReset = () => {
    resetM5();
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = (hallazgos?.length || 0) >= 2 && wordCount >= 30;

  // Hallazgos en vivo
  const checkRotation = angulo !== 0;
  // notable = múltiplo de 30° o de 45° (120°, 135°, 210°… también lo son)
  const gEntero = Math.round(angulo);
  const isNotable = gEntero % 30 === 0 || gEntero % 45 === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">

      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-emerald-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
             <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>

          <h4 className="text-white font-black text-lg leading-tight mb-2">Protocolo Trigonométrico</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Pulsa para oír el aviso del protocolo.
          </p>

          <button
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
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
               className="w-1 bg-emerald-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white rounded-[2rem] border border-slate-200 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <RotateCw size={14} className="text-emerald-400" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Rotación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkRotation ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkRotation ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Fase de Ángulo (θ)
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                     {checkRotation ? `✓ Ángulo: ${Math.round(angulo)}°` : '... Esperando Rotación'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkRotation ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Ángulo Notable */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isNotable ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isNotable ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Detección Notable
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                     {isNotable ? '✓ Ángulo Notable Localizado' : '... Buscando Múltiplos de 30/45'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isNotable ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Capturas */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${(hallazgos?.length || 0) >= 2 ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${(hallazgos?.length || 0) >= 2 ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Base de Datos Trig.
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                     {objetivo ? `Reto: ${objetivo.funcion} θ = ${objetivo.texto} · ${hallazgos?.length || 0} muestra(s)` : '...'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${(hallazgos?.length || 0) >= 2 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE FUNCIONES */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Calculadora Unitaria</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Valores de Seno y Coseno en tiempo real</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Coseno (X)</span>
              <span className="text-lg font-black text-emerald-600 font-mono">{decimal(Math.cos(angulo * Math.PI / 180))}</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Seno (Y)</span>
              <span className="text-lg font-black text-emerald-600 font-mono">{decimal(Math.sin(angulo * Math.PI / 180))}</span>
           </div>
        </div>

        <button
          onClick={() => { registrarHallazgoM5(); audio.playPop(); }}
          disabled={animando}
          title={animando ? 'Detén el giro para capturar' : undefined}
          className="w-full py-3 bg-[#023047] hover:bg-[#054a6d] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-40"
        >
          Capturar Punto en Bitácora
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Relación Geométrica</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Describe cómo varían el seno y el coseno al moverte por los cuatro cuadrantes del círculo unitario..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-emerald-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
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
