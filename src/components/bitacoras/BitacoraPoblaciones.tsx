"use client";

import React, { useState } from 'react';
import { Trash2, ShieldCheck, BookOpen, Bot, Volume2, Table } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraPoblaciones({ onValidate }: { onValidate?: () => void }) {
  const ecosistema = useSimuladorStore((s) => s.ecosistema);
  const resetB10 = useSimuladorStore((s) => s.resetB10);
  const { parametros, corrida, presasIniciales, depredadoresIniciales } = ecosistema;
  const [conclusionText, setConclusionText] = useState("");

  const handleReset = () => {
    resetB10();
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  // El veredicto lo da el juez de dominio (validarLab); aquí solo se exige el análisis escrito.
  const canValidate = wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      <div className="bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] p-6 rounded-[2.5rem] shadow-2xl border border-blue-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Bot size={60} className="text-white" /></div>
        <div className="relative z-10">
          <h4 className="text-white font-black text-lg leading-tight mb-2">Lotka-Volterra</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            dx/dt = αx − βxy · dy/dt = δxy − γy. Arranque: {presasIniciales} presas y {depredadoresIniciales} depredadores.
            El modelo no tiene capacidad de carga: sin depredadores las presas crecerían sin límite.
          </p>
          <button onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95">
            <Volume2 size={18} fill="currentColor" className="text-white" /> Solicitar informe ecológico
          </button>
        </div>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-2">
        <div className="flex items-center gap-2"><Table size={14} className="text-blue-600" /><span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Última corrida</span></div>
        {!corrida ? <p className="text-[11px] text-slate-400 italic">Aún no has corrido la simulación.</p> : (
          <div className="text-[11px] text-slate-600 space-y-1 font-mono">
            <div>α {corrida.parametros.alpha.toFixed(2)} · β {corrida.parametros.beta.toFixed(3)} · γ {corrida.parametros.gamma.toFixed(2)} · δ {corrida.parametros.delta.toFixed(3)}</div>
            <div>{corrida.extincion ? `Colapso (${corrida.extincion}) en el año ${corrida.t.toFixed(1)}` : `Coexistencia ${corrida.t.toFixed(0)} años`}</div>
          </div>
        )}
        <div className="text-[10px] text-slate-400 font-mono">Parámetros actuales: α {parametros.alpha.toFixed(2)} · β {parametros.beta.toFixed(3)} · γ {parametros.gamma.toFixed(2)} · δ {parametros.delta.toFixed(3)}</div>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><BookOpen size={14} className="text-[#023047]" /><span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis ecológico</span></div>
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
        </div>
        <textarea value={conclusionText} onChange={(e) => setConclusionText(e.target.value)}
          placeholder="¿Por qué colapsó el ecosistema con los parámetros iniciales? ¿Qué cambiaste y cómo se relaciona con el punto de equilibrio (γ/δ, α/β)? ¿Por qué el pico de depredadores llega después del de presas?"
          rows={4}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-blue-500 italic" />
      </div>

      <div className="flex gap-3">
        <button onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200">
          <Trash2 size={20} />
        </button>
        <button onClick={() => onValidate?.()} disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
          <ShieldCheck size={16} /> {canValidate ? 'Someter análisis' : 'Escribe tu análisis (30 palabras)'}
        </button>
      </div>
    </div>
  );
}
