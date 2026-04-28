"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, FlaskConical, Microscope, Thermometer, Droplets
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraDestilacion() {
  const { destilacion, validarP10 } = useSimuladorStore();
  const [purezaInput, setPurezaInput] = useState("");
  const [conclusionText, setConclusionText] = useState("");

  const quantumMsg = "Monitorea el termómetro del cabezal de destilación. Para obtener etanol de alta pureza, la temperatura debe estabilizarse cerca de los 78.4°C. Si excedes los 85°C, disminuirás la pureza.";

  const handleReset = () => {
    setPurezaInput("");
    setConclusionText("");
    audio.playPop();
  };

  const handleValidar = () => {
    const val = parseFloat(purezaInput);
    if (isNaN(val)) return alert("Ingresa un valor numérico para la pureza.");
    const ok = validarP10(val);
    if (ok) {
      audio.playSuccess();
    } else {
      audio.playError();
      alert("❌ Error de Análisis: La pureza registrada no coincide con los parámetros de recolección.");
    }
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = destilacion.status === 'success' && wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-blue-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
             <span className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría de Separación</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el control de isoterma y la pureza del destilado.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Purificación
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-blue-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Isoterma */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${destilacion.tempMezcla > 77 && destilacion.tempMezcla < 82 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${destilacion.tempMezcla > 77 && destilacion.tempMezcla < 82 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Estabilidad Térmica
                  </span>
                  <span className="text-xs font-bold text-white">
                     {destilacion.tempMezcla > 77 && destilacion.tempMezcla < 82 ? '✓ Isoterma de Etanol Alcanzada' : '... Calentando Sistema'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${destilacion.tempMezcla > 77 && destilacion.tempMezcla < 82 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Recuperación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${destilacion.volDestilado > 30 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${destilacion.volDestilado > 30 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Recuperación de Solvente
                  </span>
                  <span className="text-xs font-bold text-white">
                     {destilacion.volDestilado > 30 ? `✓ Fracción Recuperada: ${destilacion.volDestilado.toFixed(1)}mL` : '... Flujo de Destilado Bajo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${destilacion.volDestilado > 30 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE DESTILACIÓN */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Balance de Masa</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lectura de Pureza</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Temperatura</span>
              <span className="text-sm font-black text-[#023047] font-mono">{destilacion.tempMezcla.toFixed(1)}°C</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Destilado</span>
              <span className="text-sm font-black text-blue-600 font-mono">{destilacion.volDestilado.toFixed(1)} mL</span>
           </div>
        </div>

        <div className="space-y-4">
           <div className="relative">
              <input 
                type="number" step="0.1" placeholder="00.0"
                value={purezaInput}
                onChange={(e) => setPurezaInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-4xl font-black text-[#023047] text-center font-mono outline-none focus:border-blue-500 transition-all shadow-inner"
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">%</div>
           </div>

           <button 
             onClick={handleValidar}
             disabled={destilacion.status === 'success'}
             className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${destilacion.status === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
           >
             {destilacion.status === 'success' ? 'Pureza Certificada' : 'Validar Fracción'}
           </button>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Fraccionamiento</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica el principio físico detrás de la destilación y por qué la temperatura del cabezal se mantiene constante durante la recolección del etanol..."
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
          onClick={() => { audio.playSuccess(); alert("Certificación de Purificación Completada."); }}
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
