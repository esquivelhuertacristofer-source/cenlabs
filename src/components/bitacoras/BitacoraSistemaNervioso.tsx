"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, Hammer, Timer, TrendingUp, AlertCircle, Stethoscope
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraSistemaNervioso() {
  const { sistemaNervioso, setB7State, dispararReflejo, resetB7 } = useSimuladorStore();
  const { fuerzaGolpe, integridadMielina, latenciaMedida, velocidadConduccion, estado, status } = sistemaNervioso;
  const [conclusionText, setConclusionText] = useState("");

  const quantumMsg = "Monitorea la velocidad de conducción nerviosa. Un estímulo de fuerza suficiente desencadenará el arco reflejo. Recuerda que la mielina actúa como aislante eléctrico, incrementando la velocidad de los impulsos. ¡Analiza la latencia!";

  const handleReset = () => {
    resetB7();
    setConclusionText("");
    audio.playPop();
  };

  const isHealthy = latenciaMedida > 0 && latenciaMedida < 30;
  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = status === 'success' && wordCount >= 30;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Neurológica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el arco reflejo y la conducción saltatoria en neuronas mielinizadas.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Neurológico
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
            {/* Hallazgo: Conducción */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${integridadMielina > 80 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${integridadMielina > 80 ? 'text-cyan-400' : 'text-slate-500'}`}>
                     Vaina de Mielina
                  </span>
                  <span className="text-xs font-bold text-white">
                     {integridadMielina > 80 ? '✓ Integridad Estructural Óptima' : '... Detectada Desmielinización'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${integridadMielina > 80 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Reflejo */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isHealthy ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isHealthy ? 'text-cyan-400' : 'text-slate-500'}`}>
                     Arco Reflejo
                  </span>
                  <span className="text-xs font-bold text-white">
                     {isHealthy ? `✓ Respuesta en ${latenciaMedida.toFixed(1)} ms` : '... Esperando Estímulo Válido'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE TELEMETRÍA NEUROLÓGICA */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Sonda Neuronal</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Potencial de Acción</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Velocidad</span>
              <span className="text-sm font-black text-[#023047] font-mono">{(integridadMielina * 1.2).toFixed(1)} m/s</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Estado</span>
              <span className="text-sm font-black text-cyan-600 uppercase italic">{estado}</span>
           </div>
        </div>

        <button 
          onClick={() => { dispararReflejo(); audio.playPop(); }}
          disabled={estado !== 'reposo'}
          className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${estado !== 'reposo' ? 'bg-emerald-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {estado !== 'reposo' ? 'Estímulo en Proceso' : 'Aplicar Estímulo (Martillo)'}
        </button>

        <button 
          onClick={() => { setB7State({ status: 'success' }); audio.playSuccess(); }}
          disabled={!isHealthy || status === 'success'}
          className={`w-full py-3 rounded-xl font-black text-[9px] uppercase tracking-widest border transition-all ${status === 'success' ? 'border-emerald-500 text-emerald-600' : 'border-slate-200 text-slate-400'}`}
        >
          {status === 'success' ? 'Respuesta Registrada' : 'Sincronizar Diagnóstico'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Neurológico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Describe el arco reflejo y explica cómo la integridad de la vaina de mielina influye en la velocidad de conducción nerviosa y el tiempo de latencia..."
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
          onClick={() => { audio.playSuccess(); alert("Certificación Neurológica Completada."); }}
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
