"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Move, RotateCcw
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraTransformaciones() {
  const { geometria6, setTransformM6, resetM6 } = useSimuladorStore();
  const { tx, ty, rotacion, escala, target, status } = geometria6;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Aplica traslaciones y rotaciones para que el polígono azul coincida exactamente con el objetivo rojo. ¡Usa los vectores de transformación y el factor de escala para certificar la sincronía espacial!`;

  const handleReset = () => {
    resetM6();
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  
  // Checks de Hallazgos en Vivo
  const checkTranslacion = Math.abs(tx - target.tx) < 0.2 && Math.abs(ty - target.ty) < 0.2;
  const checkRotacion = Math.abs((rotacion % 360) - (target.rotacion % 360)) < 5;
  const checkEscala = Math.abs(escala - target.escala) < 0.1;
  const isSynchronized = checkTranslacion && checkRotacion && checkEscala;

  const canValidate = isSynchronized && wordCount >= 30;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Protocolo Isométrico</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la manipulación de vectores en el plano cartesiano.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
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
               className="w-1 bg-cyan-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Move size={14} className="text-cyan-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Traslación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkTranslacion ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkTranslacion ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Vector de Traslación
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkTranslacion ? `✓ Posición Sincronizada` : '... Buscando Coordenadas'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkTranslacion ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Rotación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkRotacion ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkRotacion ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Fase de Rotación
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkRotacion ? `✓ Orientación Correcta` : '... Ajustando Grados'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkRotacion ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Sincronía Total */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isSynchronized ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isSynchronized ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Sincronía Espacial
                  </span>
                  <span className="text-xs font-bold text-white">
                     {isSynchronized ? '✓ Transformación Certificada' : '... Analizando Superposición'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isSynchronized ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE TRANSFORMACIÓN */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Calculadora Isométrica</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estado de la matriz de transformación</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Translación</span>
              <span className="text-xs font-black text-cyan-600 font-mono">({tx.toFixed(1)}, {ty.toFixed(1)})</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Rotación</span>
              <span className="text-xs font-black text-cyan-600 font-mono">{rotacion.toFixed(0)}°</span>
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Teoría de Isometrías</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica la diferencia entre una isometría (como traslación y rotación) y una transformación de escala..."
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
          onClick={() => { audio.playSuccess(); alert("Sincronía Espacial Certificada."); }}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {canValidate ? 'Certificar Misión' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}
