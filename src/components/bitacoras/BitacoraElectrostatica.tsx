"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, MoveHorizontal, Gauge
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraElectrostatica() {
  const { electrostatica9, setElectrostatica9 } = useSimuladorStore();
  const { q1, q2, distancia, resultado } = electrostatica9;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `La fuerza electrostática es una de las interacciones fundamentales del universo. A diferencia de la gravedad, puede ser de atracción o repulsión dependiendo de la polaridad de las cargas.`;

  const handleReset = () => {
    setElectrostatica9({ q1: 1, q2: -1, distancia: 0.5, resultado: null });
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = (q1 !== 0 || q2 !== 0) && wordCount >= 30;

  // Hallazgos en vivo
  const checkPolarity = q1 * q2 !== 0;
  const checkDistance = distancia < 0.3;
  const checkCharges = Math.abs(q1) > 5 || Math.abs(q2) > 5;

  // Cálculos
  const K = 8.987e9;
  const q1_true = q1 * 1e-6;
  const q2_true = q2 * 1e-6;
  const fuerza = (K * Math.abs(q1_true * q2_true)) / Math.pow(distancia, 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-blue-400/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
             <span className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Fuerzas Fundamentales</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la interacción de campos y la Ley de Coulomb en el vacío.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Campo
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center opacity-30">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-blue-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Zap size={14} className="text-blue-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Polaridad */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkPolarity ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkPolarity ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Vector de Interacción
                  </span>
                  <span className="text-xs font-bold text-white">
                     {q1 * q2 < 0 ? '✓ ATRACCIÓN (Opuestos)' : (q1 * q2 > 0 ? '✓ REPULSIÓN (Iguales)' : '... Definiendo Cargas')}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkPolarity ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Magnitud */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkCharges ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Intensidad de Campo (q)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {resultado === 'exito' ? '✓ Magnitud Electrostática Validada' : '... Mapeando Interacción'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkCharges ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Distancia */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkDistance ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkDistance ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Escala Radial (r)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkDistance ? `✓ Separación Crítica: ${distancia.toFixed(2)}m` : '... Acercando Cargas'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${resultado === 'exito' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR ELECTROSTÁTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Calculadora de Coulomb</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">K = 8.987e9 N·m²/C²</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Fuerza Neta (F)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{fuerza.toFixed(4)} N</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Interacción</span>
              <span className={`text-[10px] font-black uppercase ${q1 * q2 < 0 ? 'text-blue-600' : 'text-indigo-600'}`}>
                 {q1 * q2 < 0 ? 'Atracción' : (q1 * q2 > 0 ? 'Repulsión' : 'Neutro')}
              </span>
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Campo</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica cómo cambia la fuerza electrostática si duplicas la distancia entre las cargas y por qué la dirección de la fuerza depende del signo de q1 y q2..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-blue-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Perfil Electrostático Certificado."); }}
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
