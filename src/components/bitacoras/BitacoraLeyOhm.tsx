"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Gauge, Thermometer, Power
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

export default function BitacoraLeyOhm({ onValidate }: { onValidate?: () => void }) {
  const { ohm8, setOhm8 } = useSimuladorStore();
  const { voltaje, resistencia, switchOn, ledRoto, resultado } = ohm8;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `La Ley de Ohm es la columna vertebral de la electrónica. Establece que la intensidad de corriente es directamente proporcional al voltaje aplicado e inversamente proporcional a la resistencia del circuito.`;

  const handleReset = () => {
    setOhm8({ voltaje: 12, resistencia: 1000, switchOn: false, ledRoto: false, resultado: null });
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = switchOn && !ledRoto && wordCount >= 50;

  // Hallazgos en vivo
  const checkVoltaje = voltaje > 15;
  const checkResistencia = resistencia !== 1000;
  const checkPower = (voltaje * voltaje) / resistencia > 0.5;

  // Cálculos
  const corriente = switchOn && !ledRoto ? voltaje / resistencia : 0;
  const corrienteMA = corriente * 1000;
  const potencia = voltaje * corriente;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
           <Bot size={60} className="text-[#023047]" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-yellow-500 animate-ping" />
             <span className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-[#023047] font-black text-lg leading-tight mb-2">Análisis de Conductancia</h4>
          <div className="text-[11px] text-slate-500 font-medium mb-6 leading-relaxed space-y-2">
            <p>Presiona el botón para recibir instrucciones sobre la relación entre Voltaje, Corriente y Resistencia.</p>
            <div className="bg-slate-50 p-3 rounded-xl text-center border border-slate-100 text-[#023047]">
               <InlineMath math="V = I \cdot R" />
               <span className="mx-4 text-slate-300">|</span>
               <InlineMath math="P = I^2 \cdot R" />
            </div>
          </div>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-[#023047] hover:bg-[#054a6d] rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-900/10"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Óhmico
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center opacity-30">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-yellow-500 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-yellow-500" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Amperímetro */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white border-slate-100'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${switchOn ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Flujo de Electrones (I)
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                     {switchOn ? (ledRoto ? '⚠ CIRC. ABIERTO' : `✓ ${corrienteMA.toFixed(2)} mA Detectados`) : '... Circuito Abierto'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${resultado === 'exito' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
            </div>

            {/* Hallazgo: Resistencia */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkResistencia ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white border-slate-100'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkResistencia ? 'text-emerald-600' : 'text-slate-500'}`}>
                     Impedancia de Carga (R)
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                     {resultado === 'exito' ? '✓ Curva de Ohm Certificada' : '... Analizando Linealidad'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkResistencia ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </div>

            {/* Hallazgo: Potencia */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkPower ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white border-slate-100'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkPower ? 'text-orange-600' : 'text-slate-500'}`}>
                     Disipación Joule (P)
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                     {checkPower ? `✓ P = ${potencia.toFixed(3)} W (Estrés)` : '... Carga Segura'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkPower ? 'bg-orange-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-slate-300'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR ELECTRÓNICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Calculadora V-I-R</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetría de Circuito</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Voltaje (V)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{voltaje.toFixed(1)} V</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Potencia (P)</span>
              <span className={`text-sm font-black font-mono ${potencia > 0.1 ? 'text-yellow-600' : 'text-slate-400'}`}>{potencia.toFixed(3)} W</span>
           </div>
        </div>

        <button 
          onClick={() => { setOhm8({ switchOn: !switchOn }); audio.playPop(); }}
          className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${switchOn ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {switchOn ? 'Abrir Circuito' : 'Cerrar Circuito'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Óhmico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 50 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/50</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué sucede con la corriente cuando mantienes el voltaje constante pero reduces la resistencia a la mitad..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-yellow-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-yellow-50 text-slate-400 hover:text-yellow-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { 
            if (onValidate) onValidate();
            else {
              audio.playSuccess();
            }
          }}
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
