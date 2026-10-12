"use client";

import React, { useState } from 'react';
import { Trash2, ShieldCheck, BookOpen, Bot, Volume2, Table } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraSeleccion({ onValidate }: { onValidate?: () => void }) {
  const evolucion = useSimuladorStore((s) => s.evolucion);
  const resetB6 = useSimuladorStore((s) => s.resetB6);
  const { ambiente, historial, bugs } = evolucion;
  const [conclusionText, setConclusionText] = useState("");

  const handleReset = () => {
    resetB6();
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  // El veredicto lo da el juez de dominio (validarLab); aquí solo se exige el análisis escrito.
  const canValidate = wordCount >= 30;
  // Fenotipos de la población inicial de la generación actual (antes de cazar).
  const fOscurasActual = bugs.length ? bugs.filter((b) => b.tipo === 'oscura').length / bugs.length : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-emerald-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Bot size={60} className="text-white" /></div>
        <div className="relative z-10">
          <h4 className="text-white font-black text-lg leading-tight mb-2">Selección natural · <i>Biston betularia</i></h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Corteza {ambiente === 'industrial' ? 'ennegrecida por hollín' : 'clara con líquenes'}. El alelo C (oscuro) domina sobre c (claro):
            solo las claras son cc, por eso q se estima con √(fracción de claras).
          </p>
          <button onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95">
            <Volume2 size={18} fill="currentColor" className="text-white" /> Solicitar informe evolutivo
          </button>
        </div>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-3">
        <div className="flex items-center gap-2"><Table size={14} className="text-emerald-600" /><span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Registro por generación</span></div>
        <table className="w-full text-[11px] font-mono text-slate-600">
          <thead><tr className="text-[9px] uppercase text-slate-400"><th className="text-left">Gen</th><th className="text-right">% oscuras</th><th className="text-right">q est.</th></tr></thead>
          <tbody>
            {historial.length === 0 && (
              <tr><td>1</td><td className="text-right">{(fOscurasActual * 100).toFixed(0)}</td><td className="text-right">{Math.sqrt(1 - fOscurasActual).toFixed(2)}</td></tr>
            )}
            {historial.map((h) => (
              <tr key={h.gen}><td>{h.gen}</td><td className="text-right">{(h.fOscuras * 100).toFixed(0)}</td><td className="text-right">{Math.sqrt(Math.max(0, 1 - h.fOscuras)).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><BookOpen size={14} className="text-[#023047]" /><span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis evolutivo</span></div>
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
        </div>
        <textarea value={conclusionText} onChange={(e) => setConclusionText(e.target.value)}
          placeholder="¿Qué polillas veías primero sobre esta corteza? ¿Cómo cambió la frecuencia del fenotipo oscuro y de q de una generación a otra? ¿Por qué el alelo recesivo no desaparece aunque lo cacen?"
          rows={4}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-emerald-500 italic" />
      </div>

      <div className="flex gap-3">
        <button onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200">
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
