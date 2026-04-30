"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, AlertTriangle, Atom
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraConstruccionAtomica({ onValidate }: { onValidate?: () => void }) {
  const { particulas, setParticulas, validarEstructura, bitacoraData } = useSimuladorStore();
  const [conclusionText, setConclusionText] = useState("");

  const { protones = 0, neutrones = 0, electrones = 0, targetZ = 1, targetA = 1, targetCharge = 0 } = particulas || {};
  const masaAtomica = protones + neutrones;
  const cargaNeta = protones - electrones;

  // Lógica de Mensaje Dinámico
  let quantumMsg = "";
  if (protones === 0) {
    quantumMsg = "¡Bienvenido al Reactor de Fusión! Añade Protones al núcleo; recuerda que ellos determinan el Número Atómico.";
  } else if (protones === targetZ && masaAtomica === targetA && cargaNeta === targetCharge) {
    quantumMsg = "Has logrado una configuración atómica perfecta y estable. Estoy listo para certificar este hallazgo.";
  } else {
    quantumMsg = "Analiza la relación entre partículas. Recuerda que la estabilidad nuclear depende del balance entre protones y neutrones.";
  }

  const handleReset = () => {
    setParticulas(0, 0, 0);
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const isCorrect = protones === targetZ && masaAtomica === targetA && cargaNeta === targetCharge;
  const canValidate = isCorrect && wordCount >= 30;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Ingeniería Subatómica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la síntesis de isótopos y la estabilidad del núcleo.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Cuántico
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
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${protones === targetZ ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${protones === targetZ ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Identidad Atómica (Z)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {protones === targetZ ? '✓ Elemento Sincronizado' : '... Ajustando Protones'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${protones === targetZ ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${masaAtomica === targetA ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${masaAtomica === targetA ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Estabilidad Nuclear (A)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {masaAtomica === targetA ? '✓ Isótopo Estable' : '... Ajustando Neutrones'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${masaAtomica === targetA ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE PARTÍCULAS */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
            <Atom size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Balance Subatómico</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetría de Núcleo</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
           <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
              <span className="text-[8px] font-black text-red-400 uppercase block mb-1">P+</span>
              <span className="text-xs font-black text-red-700">{protones}</span>
           </div>
           <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
              <span className="text-[8px] font-black text-blue-400 uppercase block mb-1">N⁰</span>
              <span className="text-xs font-black text-blue-700">{neutrones}</span>
           </div>
           <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-center">
              <span className="text-[8px] font-black text-yellow-500 uppercase block mb-1">e-</span>
              <span className="text-xs font-black text-yellow-700">{electrones}</span>
           </div>
        </div>

        <div className="p-4 bg-slate-900 rounded-2xl flex items-center justify-between">
           <div>
              <span className="text-[8px] font-black text-slate-500 uppercase block">Carga Neta</span>
              <span className={`text-xs font-black ${cargaNeta === 0 ? 'text-emerald-400' : 'text-orange-400'}`}>{cargaNeta > 0 ? `+${cargaNeta}` : cargaNeta}</span>
           </div>
           <div className="text-right">
              <span className="text-[8px] font-black text-slate-500 uppercase block">Masa Atómica</span>
              <span className="text-xs font-black text-white">{masaAtomica} u</span>
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Estructura</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué define la identidad de un elemento químico y por qué es necesario un balance entre protones y neutrones para la estabilidad del núcleo..."
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
          onClick={() => { useSimuladorStore.getState().registrarHallazgo(); audio.playSuccess(); }}
          disabled={!isCorrect}
          className={`px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 ${isCorrect ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
           <Zap size={14} />
           Registrar Isótopo
        </button>
        <button 
          onClick={() => { 
            if (onValidate) onValidate();
            else { audio.playSuccess(); alert("Síntesis Atómica Certificada."); }
          }}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {canValidate ? 'Finalizar Misión' : 'Someter Análisis'}
        </button>
      </div>

      {/* HISTORIAL DE ISÓTOPOS (DIAMOND LOG) */}
      {(bitacoraData.hallazgos?.length || 0) > 0 && (
        <div className="bg-[#0A1121] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <Table size={16} className="text-cyan-400" />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Bitácora de Síntesis</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Historial de Nucleosíntesis</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20">
                  <th className="p-4 text-[8px] font-black text-slate-500 uppercase tracking-widest">Hora</th>
                  <th className="p-4 text-[8px] font-black text-slate-500 uppercase tracking-widest">Símbolo</th>
                  <th className="p-4 text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">A</th>
                  <th className="p-4 text-[8px] font-black text-slate-500 uppercase tracking-widest text-center">Z</th>
                  <th className="p-4 text-[8px] font-black text-slate-500 uppercase tracking-widest text-right">Carga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bitacoraData.hallazgos?.slice(-5).reverse().map((h: any) => (
                  <tr key={h.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 text-[10px] font-mono text-slate-400">{h.timestamp}</td>
                    <td className="p-4 font-black text-cyan-400 text-xs italic group-hover:translate-x-1 transition-transform inline-block">
                      {["H","He","Li","Be","B","C","N","O","F","Ne"][h.z - 1] || 'X'}
                    </td>
                    <td className="p-4 text-center font-mono text-xs text-white">{h.a}</td>
                    <td className="p-4 text-center font-mono text-xs text-white">{h.z}</td>
                    <td className={`p-4 text-right font-black text-[10px] ${h.carga === 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {h.carga > 0 ? `+${h.carga}` : h.carga}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
