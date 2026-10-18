"use client";

import React, { useState } from 'react';
import { Trash2, ShieldCheck, BookOpen, Bot, Volume2, Table } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

/** Cifra con coma decimal (la bitácora se lee en español). */
const cifra = (x: number, d: number) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—');

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
  // Lo que el alumno anota: la fracción de oscuras al nacer cada generación y su estimación de q.
  const filas = historial.length === 0
    ? [{ gen: 1, fOscuras: fOscurasActual }]
    : historial.map((h) => ({ gen: h.gen, fOscuras: h.fOscuras }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-emerald-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Bot size={60} className="text-white" /></div>
        <div className="relative z-10">
          <h4 className="text-white font-black text-lg leading-tight mb-2">Selección natural · <i>Biston betularia</i></h4>
          <p className="text-[12px] text-slate-200 font-medium mb-6 leading-relaxed">
            En el reto, corteza {ambiente === 'industrial' ? 'ennegrecida por hollín' : 'clara con líquenes'}. El alelo C (oscuro) domina sobre c (claro):
            sólo las claras son cc, por eso q se estima con √(fracción de claras).
          </p>
          <button onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95">
            <Volume2 size={18} fill="currentColor" className="text-white" /> Solicitar informe evolutivo
          </button>
        </div>
      </div>

      {/* registro: tarjeta clara con texto oscuro, cifras con coma */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Table size={14} className="text-emerald-600" />
          <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Registro del reto · por generación</span>
        </div>
        <table className="w-full text-[13px] font-mono tabular-nums text-[#023047]">
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              <th className="pb-1.5 text-left font-black">Gen.</th>
              <th className="pb-1.5 text-right font-black">Oscuras al nacer</th>
              <th className="pb-1.5 text-right font-black">q est. = √claras</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.gen} className="border-t border-slate-100">
                <td className="py-1.5 font-bold">{f.gen}</td>
                <td className="py-1.5 text-right">{cifra(f.fOscuras * 100, 0)} %</td>
                <td className="py-1.5 text-right font-bold text-emerald-700">{cifra(Math.sqrt(Math.max(0, 1 - f.fOscuras)), 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><BookOpen size={14} className="text-[#023047]" /><span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis evolutivo</span></div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{wordCount}/30</span>
        </div>
        <textarea value={conclusionText} onChange={(e) => setConclusionText(e.target.value)}
          placeholder="¿Qué polillas veías primero sobre esta corteza? ¿Cómo cambió la frecuencia del fenotipo oscuro y de q de una generación a otra? ¿Por qué el alelo recesivo no desaparece aunque lo cacen?"
          rows={4}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[12px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500" />
      </div>

      <div className="flex gap-3">
        <button onClick={handleReset} aria-label="Reiniciar la práctica"
          className="w-14 h-14 bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200">
          <Trash2 size={20} />
        </button>
        <button onClick={() => onValidate?.()} disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}>
          <ShieldCheck size={16} /> {canValidate ? 'Someter análisis' : 'Escribe tu análisis (30 palabras)'}
        </button>
      </div>
    </div>
  );
}
