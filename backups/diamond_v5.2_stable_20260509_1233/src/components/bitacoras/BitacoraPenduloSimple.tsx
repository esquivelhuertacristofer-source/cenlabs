"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Timer, Ruler, Box
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraPenduloSimple() {
  const { pendulo3, setPendulo3 } = useSimuladorStore();
  const { longitud, masa, anguloInicial, oscilando, resultado, periodo } = pendulo3;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Ajusta la longitud de la cuerda y observa cómo varía el periodo de oscilación. Recuerda que, para ángulos pequeños, el péndulo sigue un Movimiento Armónico Simple donde el periodo depende únicamente de la longitud y la gravedad, siendo independiente de la masa del bloque.`;

  const handleReset = () => {
    setPendulo3({ oscilando: false, resultado: null, periodo: 0 });
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = resultado === 'exito' && wordCount >= 30;

  // Hallazgos en vivo
  const checkAngle = anguloInicial < 15;
  const checkLength = longitud !== 2.0;
  const checkMass = masa !== 1.0;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Análisis de Isocronismo</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el Movimiento Armónico Simple y el cálculo experimental de la gravedad.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Gravimétrico
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
            <Activity size={14} className="text-cyan-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Isocronismo */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkAngle ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkAngle ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Condición de Isocronismo
                  </span>
                  <span className="text-xs font-bold text-white">
                     {resultado === 'exito' ? '✓ Isocronismo Confirmado' : '... Calibrando Péndulo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkAngle ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Telemetría T */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${periodo > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${periodo > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Periodo T Detectado
                  </span>
                  <span className="text-xs font-bold text-white">
                     {periodo > 0 ? `✓ T = ${periodo.toFixed(2)}s Capturado` : '... Esperando Ciclo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${periodo > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Independencia de Masa */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${oscilando ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkMass ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Prueba de Independencia (m)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {oscilando ? '✓ Oscilación en Curso' : '... Sistema en Reposo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${resultado === 'exito' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR GRAVIMÉTRICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Monitor de Periodo</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetría T vs L</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Longitud (L)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{longitud.toFixed(2)} m</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Periodo (T)</span>
              <span className={`text-sm font-black font-mono ${periodo > 0 ? 'text-cyan-600' : 'text-slate-300'}`}>{periodo > 0 ? periodo.toFixed(2) : '0.00'} s</span>
           </div>
        </div>

        <button 
          onClick={() => { setPendulo3({ oscilando: !oscilando }); audio.playPop(); }}
          className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${oscilando ? 'bg-red-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {oscilando ? 'Detener Oscilación' : 'Soltar Péndulo'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Isocronismo</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica por qué el periodo de un péndulo simple es independiente de su masa y cómo influye la longitud en el tiempo de oscilación..."
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
          onClick={() => { audio.playSuccess(); alert("Misión Gravimétrica Certificada."); }}
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
