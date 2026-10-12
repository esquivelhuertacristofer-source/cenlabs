"use client";

import React, { useState } from 'react';
import { Trash2, ShieldCheck, BookOpen, Bot, Volume2, Table } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { FARMACOS_B8 } from '@/domain/biologia';
import type { FarmacoB8 } from '@/store/types';

export default function BitacoraElectrocardiograma({ onValidate }: { onValidate?: () => void }) {
  const cardio = useSimuladorStore((s) => s.cardio);
  const resetB8 = useSimuladorStore((s) => s.resetB8);
  // ritmoBPM, tipo y fcInicial NO se muestran: la FC se mide en el trazo.
  const { dosis, diagnostico, lecturaFC } = cardio;
  const [conclusionText, setConclusionText] = useState("");

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  // El veredicto lo da el juez de dominio (validarLab); aquí solo se exige el análisis escrito.
  const canValidate = wordCount >= 30;

  const handleReset = () => {
    resetB8();
    setConclusionText("");
    audio.playPop();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-rose-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Bot size={60} className="text-white" /></div>
        <div className="relative z-10">
          <h4 className="text-white font-black text-lg leading-tight mb-2">Historia clínica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            La onda P es la despolarización auricular; el QRS, la ventricular; la T, su repolarización. La contracción
            (sístole) llega DESPUÉS de cada despolarización. El ritmo sinusal normal va de 60 a 100 lpm.
          </p>
          <button onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-800 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95">
            <Volume2 size={18} fill="currentColor" className="text-white" /> Solicitar informe cardiológico
          </button>
        </div>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-3">
        <div className="flex items-center gap-2"><Table size={14} className="text-rose-600" /><span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Hoja de tratamiento</span></div>
        <div className="text-[11px] text-slate-600">Diagnóstico de llegada: <b>{diagnostico ?? '—'}</b></div>
        <table className="w-full text-[11px] font-mono text-slate-600">
          <tbody>
            {(Object.keys(FARMACOS_B8) as FarmacoB8[]).map((f) => (
              <tr key={f}><td>{FARMACOS_B8[f].nombre} {FARMACOS_B8[f].dosis}</td><td className="text-right">{dosis[f]} bolo(s)</td></tr>
            ))}
          </tbody>
        </table>
        <div className="text-[11px] text-slate-600">Última FC medida: <b className="font-mono">{lecturaFC === null ? '—' : `${lecturaFC} lpm`}</b></div>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><BookOpen size={14} className="text-[#023047]" /><span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis clínico</span></div>
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
        </div>
        <textarea value={conclusionText} onChange={(e) => setConclusionText(e.target.value)}
          placeholder="¿Cómo mediste la FC en el trazo? ¿Por qué elegiste ese fármaco y cómo actúa sobre el nodo SA (simpático, parasimpático, receptores β1 o muscarínicos)?"
          rows={4}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-rose-500 italic" />
      </div>

      <div className="flex gap-3">
        <button onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200">
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
