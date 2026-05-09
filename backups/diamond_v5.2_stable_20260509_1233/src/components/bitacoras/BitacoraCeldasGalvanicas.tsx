"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, Battery, Beaker
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraCeldasGalvanicas({ onValidate }: { onValidate?: () => void }) {
  const { celda, validarP9 } = useSimuladorStore();
  const [anodo, setAnodo] = useState("");
  const [catodo, setCatodo] = useState("");
  const [voltaje, setVoltaje] = useState("");
  const [conclusionText, setConclusionText] = useState("");

  const quantumMsg = "Identifica los metales en los vasos. El ánodo siempre será el metal con el potencial de reducción más negativo. No olvides instalar el puente salino para completar el circuito iónico.";

  const handleReset = () => {
    setAnodo("");
    setCatodo("");
    setVoltaje("");
    setConclusionText("");
    audio.playPop();
  };

  const handleValidar = () => {
    const v = parseFloat(voltaje);
    if (!anodo || !catodo || isNaN(v)) return alert("Completa todos los campos de registro.");
    
    if (celda.voltaje === 0) {
      audio.playError();
      alert("⚠️ Error de Circuito: No se detecta flujo de electrones. Verifica el puente salino.");
      return;
    }

    const ok = validarP9(anodo, catodo, v);
    if (ok) {
      audio.playSuccess();
    } else {
      audio.playError();
      alert("❌ Validación fallida: Los datos no coinciden con la configuración teórica.");
    }
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = celda.status === 'success' && wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-orange-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
             <span className="text-[10px] font-black text-orange-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Electroquímica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre potenciales de reducción y la configuración de la celda galvánica.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Redox
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-orange-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Puente Salino */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${celda.puenteSalino ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${celda.puenteSalino ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Circuito Iónico
                  </span>
                  <span className="text-xs font-bold text-white">
                     {celda.puenteSalino ? '✓ Puente Salino Instalado' : '... Esperando Conexión'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${celda.puenteSalino ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: FEM */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${celda.voltaje > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${celda.voltaje > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Energía Libre (ΔG)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {celda.voltaje > 0 ? `✓ FEM: ${celda.voltaje.toFixed(2)}V Detectada` : '... Sin Diferencia de Potencial'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${celda.voltaje > 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE CELDA */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Cálculo de Potencial</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">E°celda = E°cat - E°ano</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Ánodo (-)</label>
                <select value={anodo} onChange={e => setAnodo(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] font-black text-[#023047] focus:border-orange-500 outline-none">
                   <option value="">Metal...</option>
                   {celda.seedMetales.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Cátodo (+)</label>
                <select value={catodo} onChange={e => setCatodo(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-[10px] font-black text-[#023047] focus:border-blue-500 outline-none">
                   <option value="">Metal...</option>
                   {celda.seedMetales.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
             </div>
          </div>

          <div className="relative">
             <input 
               type="number" step="0.01" placeholder="0.00"
               value={voltaje} onChange={e => setVoltaje(e.target.value)}
               className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-4xl font-black text-[#023047] text-center font-mono outline-none focus:border-orange-500 transition-all shadow-inner"
             />
             <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">V</div>
          </div>

          <button 
            onClick={handleValidar}
            disabled={celda.status === 'success'}
            className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${celda.status === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
          >
            {celda.status === 'success' ? 'Celda Certificada' : 'Validar Potencial'}
          </button>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Redox</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica el funcionamiento de la celda galvánica, el papel del puente salino y por qué el metal elegido como ánodo sufre una reacción de oxidación..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-orange-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { 
            if (onValidate) onValidate();
            else { audio.playSuccess(); alert("Certificación Redox Completada."); }
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
