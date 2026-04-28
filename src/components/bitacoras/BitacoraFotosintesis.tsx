"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, Sun, Droplets, Play, Square, RotateCcw
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraFotosintesis() {
  const { fotosintesis, setFotosintesis, bitacoraData } = useSimuladorStore();
  const { distancia, color, oxigenoAcumulado, targetO2, simulando, status, tiempo } = fotosintesis;
  const [conclusionText, setConclusionText] = useState("");

  const quantumMsg = "Controla la intensidad lumínica y la longitud de onda para maximizar la producción de oxígeno. Recuerda que la clorofila absorbe principalmente en el azul y el rojo. ¡Optimiza la fotosíntesis para la supervivencia!";

  const handleReset = () => {
    setFotosintesis({ oxigenoAcumulado: 0, tiempo: 0, status: 'idle', simulando: false });
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = status === 'success' && wordCount >= 30;

  const colorEfficiency: Record<string, string> = {
    'blanco': '70%',
    'rojo': '100%',
    'azul': '120%',
    'verde': '10%',
    'amarillo': '40%'
  };

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Biofotónica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el espectro de absorción y la tasa de producción de oxígeno.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Fotosíntesis
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-emerald-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Eficiencia */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${color === 'azul' || color === 'rojo' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${color === 'azul' || color === 'rojo' ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Eficiencia Espectral
                  </span>
                  <span className="text-xs font-bold text-white">
                     {color === 'azul' || color === 'rojo' ? '✓ Pico de Absorción Detectado' : '... Espectro Subóptimo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${color === 'azul' || color === 'rojo' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Producción */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${status === 'success' ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Acumulación de O₂
                  </span>
                  <span className="text-xs font-bold text-white">
                     {status === 'success' ? `✓ Meta Alcanzada: ${oxigenoAcumulado.toFixed(1)}ml` : '... Produciendo Gas'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE BIOSÍNTESIS */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Zap size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Sonda Bio-Gaseosa</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetría de O₂</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Color de Luz</span>
              <span className="text-sm font-black text-[#023047] uppercase italic">{color}</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Eficiencia</span>
              <span className="text-sm font-black text-emerald-600 font-mono">{colorEfficiency[color] || '50%'}</span>
           </div>
        </div>

        <div className="p-6 bg-slate-900 rounded-[2rem] text-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Oxígeno Acumulado</span>
           <span className="text-4xl font-black text-white font-mono">{oxigenoAcumulado.toFixed(1)}</span>
           <span className="text-xs font-black text-emerald-400 ml-2">ml</span>
        </div>

        <div className="flex gap-3">
          <button
             onClick={() => setFotosintesis({ simulando: !simulando })}
             disabled={status === 'success'}
             className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${simulando ? 'bg-rose-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
          >
             {simulando ? <Square size={14} /> : <Play size={14} />}
             {simulando ? 'Detener' : 'Iniciar'}
          </button>
          <button 
             onClick={() => setFotosintesis({ oxigenoAcumulado: 0, tiempo: 0, status: 'idle' })}
             className="w-14 h-14 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 transition-colors"
          >
             <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Biofotónico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica por qué la luz verde es la menos eficiente para la fotosíntesis y cómo influye la distancia de la fuente lumínica en la tasa de producción de oxígeno..."
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
          onClick={() => { audio.playSuccess(); alert("Certificación de Fotosíntesis Completada."); }}
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
