"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, TreePine, Factory, Play, RefreshCcw, Timer, Users, Bird
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraSeleccion() {
  const { evolucion, setEvolucion, resetB6 } = useSimuladorStore();
  const { ambiente, generacion, clara, oscura, tiempo, isRunning, historial } = evolucion;
  const [conclusionText, setConclusionText] = useState("");

  const quantumMsg = "Observa cómo la selección natural actúa sobre la población de polillas. El mimetismo es una ventaja adaptativa clave; las polillas con fenotipo similar al fondo sobreviven más. ¡Asegúrate de completar 5 generaciones!";

  const handleReset = () => {
    resetB6();
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = generacion >= 5 && wordCount >= 30;

  const iniciarCaza = () => {
    const total = 20;
    const nClaras = Math.round((clara / 100) * total);
    const bugs = [];
    for (let i = 0; i < total; i++) {
      bugs.push({
        id: i,
        tipo: (i < nClaras ? 'clara' : 'oscura') as 'clara' | 'oscura',
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        angle: Math.random() * Math.PI * 2,
        speed: 8 + Math.random() * 7,
        cazada: false
      });
    }
    setEvolucion({ isRunning: true, tiempo: 30, bugs, cazadasClaras: 0, cazadasOscuras: 0 });
    audio.playPop();
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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Evolutiva</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la presión selectiva y el mimetismo en el ecosistema.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Selección
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
            {/* Hallazgo: Generación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${generacion >= 3 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${generacion >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Estabilidad Generacional
                  </span>
                  <span className="text-xs font-bold text-white">
                     {generacion >= 3 ? `✓ Gen ${generacion} Alcanzada` : '... Evolucionando Especie'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${generacion >= 3 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Adaptación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${Math.abs(clara - oscura) > 20 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${Math.abs(clara - oscura) > 20 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Presión Selectiva
                  </span>
                  <span className="text-xs font-bold text-white">
                     {Math.abs(clara - oscura) > 20 ? '✓ Divergencia Fenotípica' : '... Analizando Proporciones'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${Math.abs(clara - oscura) > 20 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR EVOLUTIVO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Dinámica de Población</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Frecuencia Alélica</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Claras</span>
              <span className="text-2xl font-black text-[#023047]">{clara.toFixed(0)}%</span>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                 <motion.div animate={{ width: `${clara}%` }} className="h-full bg-slate-400" />
              </div>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Oscuras</span>
              <span className="text-2xl font-black text-[#023047]">{oscura.toFixed(0)}%</span>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                 <motion.div animate={{ width: `${oscura}%` }} className="h-full bg-slate-900" />
              </div>
           </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={iniciarCaza}
            disabled={isRunning}
            className={`flex-1 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${isRunning ? 'bg-slate-100 text-slate-400' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
          >
            <Bird size={16} />
            {isRunning ? 'Depredación en Curso' : 'Iniciar Caza'}
          </button>
          <div className="w-20 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white">
             <span className="text-[8px] font-black text-emerald-400 uppercase">Tiempo</span>
             <span className="text-sm font-mono font-black">{Math.ceil(tiempo)}s</span>
          </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Evolutivo</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica cómo el cambio en el ambiente influye en la tasa de supervivencia de los diferentes fenotipos y describe el proceso de adaptación observado a través de las generaciones..."
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
          onClick={() => { audio.playSuccess(); alert("Certificación Evolutiva Completada."); }}
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
