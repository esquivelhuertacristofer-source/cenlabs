"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, FlaskConical, Microscope, Settings
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraReactivoLimitante({ onValidate }: { onValidate?: () => void }) {
  const { limitante, validarP4, resetP4 } = useSimuladorStore();
  const [ansLimitante, setAnsLimitante] = useState("");
  const [ansExceso, setAnsExceso] = useState("");
  const [conclusionText, setConclusionText] = useState("");

  const { reacciones = [], reaccionActual = 0, status = 'idle', isRunning = false } = limitante;
  const currentReac = reacciones[reaccionActual];

  // Mensaje para el Dr. Quantum
  const quantumMsg = "Para identificar el reactivo limitante, calcula los moles disponibles de cada reactivo dividiendo su masa entre su masa molar. El que produzca la menor cantidad de producto según la estequiometría será el limitante.";

  useEffect(() => {
    setAnsLimitante("");
    setAnsExceso("");
    setConclusionText("");
  }, [reaccionActual]);
  const handleReset = () => {
    resetP4();
    setAnsLimitante("");
    setAnsExceso("");
    setConclusionText("");
    audio.playPop();
  };


  const handleValidar = () => {
    const masaExceso = parseFloat(ansExceso);
    if (ansLimitante === "") return alert("Selecciona un reactivo limitante.");
    if (isNaN(masaExceso)) return alert("Ingresa un valor numérico para el exceso.");
    
    const isOk = validarP4(parseInt(ansLimitante), masaExceso);
    if (isOk) {
      audio.playSuccess();
    } else {
      audio.playError();
    }
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = status === 'success' && wordCount >= 30;

  if (!currentReac) return null;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Estequiométrica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el cálculo del reactivo limitante y el exceso de masa.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Síntesis
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-cyan-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'success' ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Identificación de Sustancias
                  </span>
                  <span className="text-xs font-bold text-white">
                     {status === 'success' ? '✓ Reactivo Limitante Validado' : '... Analizando Reactivos'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'success' ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Precisión de Masa
                  </span>
                  <span className="text-xs font-bold text-white">
                     {status === 'success' ? '✓ Exceso de Masa Confirmado' : '... Verificando Rendimiento'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* FORMULARIO DE CÁLCULO INDUSTRIAL */}
      <div className="p-8 bg-white border border-slate-200 rounded-[3rem] shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Panel de Control</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{currentReac.nombre}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reactivo Limitante</label>
            <select 
              value={ansLimitante} 
              onChange={(e) => setAnsLimitante(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-black text-[#023047] focus:border-cyan-500 outline-none"
            >
              <option value="">Seleccionar...</option>
              {currentReac.reactivos.map((r: any, idx: number) => (
                <option key={r.formula} value={idx}>{r.formula} ({r.molar} g/mol)</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exceso de Masa (g)</label>
            <div className="relative">
              <input 
                type="number" step="0.001" placeholder="0.000" 
                value={ansExceso} onChange={(e) => setAnsExceso(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm font-black text-[#023047] focus:border-orange-500 outline-none font-mono" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">GRAMOS</span>
            </div>
          </div>

          <button 
            onClick={handleValidar} 
            disabled={status === 'success' || !ansLimitante || !ansExceso} 
            className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
              status === 'success' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-[#023047] text-white hover:bg-[#054a6d]'
            }`}
          >
            {status === 'success' ? "Estequiometría Sincronizada" : "Validar Cálculos"}
          </button>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Estequiométrico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué es un reactivo limitante y cómo influye en el rendimiento máximo de una reacción química..."
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
          onClick={() => { 
            if (onValidate) onValidate();
            else { audio.playSuccess(); alert("Certificación de Síntesis Completada."); }
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
