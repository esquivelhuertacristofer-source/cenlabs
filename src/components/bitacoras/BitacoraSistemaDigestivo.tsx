"use client";

import React, { useState } from 'react';
import { Trash2, ShieldCheck, BookOpen, Bot, Volume2, Table } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { ENZIMAS_B9, MACRONUTRIENTES_B9 } from '@/domain/biologia';

export default function BitacoraSistemaDigestivo({ onValidate }: { onValidate?: () => void }) {
  const digestion = useSimuladorStore((s) => s.digestion);
  const resetB9 = useSimuladorStore((s) => s.resetB9);
  const { macronutriente, ensayo } = digestion;
  const [conclusionText, setConclusionText] = useState("");

  const handleReset = () => {
    resetB9();
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  // El veredicto lo da el juez de dominio (validarLab); aquí solo se exige el análisis escrito.
  const canValidate = wordCount >= 30;
  const sustrato = MACRONUTRIENTES_B9[macronutriente];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      <div className="bg-gradient-to-br from-[#431407] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-orange-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Bot size={60} className="text-white" /></div>
        <div className="relative z-10">
          <h4 className="text-white font-black text-lg leading-tight mb-2">Muestra: {sustrato.alimento}</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Cada enzima reconoce un sustrato (especificidad) y trabaja en un intervalo de pH; fuera de él su actividad cae y, en
            algunos casos, se desnaturaliza. Son dos fenómenos distintos: distínguelos en tus tubos.
          </p>
          <button onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-800 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95">
            <Volume2 size={18} fill="currentColor" className="text-white" /> Solicitar informe digestivo
          </button>
        </div>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-2">
        <div className="flex items-center gap-2"><Table size={14} className="text-orange-600" /><span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Último tubo</span></div>
        {!ensayo ? <p className="text-[11px] text-slate-400 italic">Aún no has incubado ningún tubo.</p> : (
          <div className="text-[11px] text-slate-600 space-y-1">
            <div>{ENZIMAS_B9[ensayo.enzima].nombre} · pH {ensayo.pH.toFixed(1)} · {ensayo.bilis ? 'con' : 'sin'} sales biliares</div>
            <div>Hidrólisis: <b className="font-mono">{Math.round(ensayo.hidrolisis * 100)} %</b></div>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><BookOpen size={14} className="text-[#023047]" /><span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis bioquímico</span></div>
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
        </div>
        <textarea value={conclusionText} onChange={(e) => setConclusionText(e.target.value)}
          placeholder="¿Qué diferencia hay entre un tubo sin reacción por especificidad y uno con la enzima desnaturalizada? ¿Qué papel tuvo el pH (y la bilis, si aplica)? ¿Dónde actúa tu enzima y dónde se absorben sus productos?"
          rows={4}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-orange-500 italic" />
      </div>

      <div className="flex gap-3">
        <button onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200">
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
