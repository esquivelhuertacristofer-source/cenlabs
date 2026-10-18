"use client";

import React, { useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Bot, Volume2, ShieldCheck, Trash2, BookOpen, Microscope } from 'lucide-react';

/** Cifra con coma decimal (la bitácora se lee en español). */
const cifra = (x: number, d: number) => (Number.isFinite(x) ? x.toFixed(d).replace('.', ',') : '—');

export default function BitacoraTransporte({ onValidate }: { onValidate?: () => void }) {
  const transporte = useSimuladorStore((s) => s.transporte);
  const resetB2 = useSimuladorStore((s) => s.resetB2);
  const { concExt, glucosaExt, volumen, tipoCelula, lisada } = transporte;
  const [conclusionText, setConclusionText] = useState("");

  const handleReset = () => {
    resetB2();
    setConclusionText("");
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = wordCount >= 30;
  // Solo la morfología que se OBSERVA (no se calcula aquí si el medio es isotónico).
  const morfologia = lisada ? 'Hemólisis (membrana rota)'
    : volumen > 130 ? 'Hinchada' : volumen < 90 ? (tipoCelula === 'animal' ? 'Crenada' : 'Plasmolizada') : 'Forma normal';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">

      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-cyan-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Bot size={60} className="text-white" /></div>
        <div className="relative z-10">
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Osmótica</h4>
          <p className="text-[11px] text-slate-300 font-medium mb-6 leading-relaxed">
            Prepara un medio, espera a que el volumen se estabilice y anótalo. Con Boyle–van ’t Hoff
            (Osm<sub>int</sub>·V = constante) calcula la osmolaridad del citoplasma y prepara el medio isotónico.
          </p>
          <button onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95">
            <Volume2 size={18} fill="currentColor" className="text-white" /> Solicitar informe de transporte
          </button>
        </div>
      </div>

      {/* observación: tarjeta clara con texto oscuro (antes el valor era blanco sobre blanco) */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Microscope size={14} className="text-cyan-600" />
          <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Observación de la muestra</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Morfología</span>
            <span className="text-[13px] font-bold text-[#023047]">{morfologia}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">V/V₀ estable</span>
            <span className="text-[13px] font-black text-cyan-700 font-mono">{cifra(volumen, 1)} %</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">NaCl del medio</span>
            <span className="text-[13px] font-black text-[#023047] font-mono">{cifra(concExt, 3)} M</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-1">Glucosa del medio</span>
            <span className="text-[13px] font-black text-[#023047] font-mono">{cifra(glucosaExt, 2)} M</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Osm del medio = 2·[NaCl] + [glucosa] = <b className="font-mono text-[#023047]">{cifra(2 * concExt + glucosaExt, 3)} Osm/L</b>
        </p>
      </div>

      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-[#023047]" />
            <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis osmótico</span>
          </div>
          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{wordCount}/30</span>
        </div>
        <textarea
          value={conclusionText} onChange={(e) => setConclusionText(e.target.value)}
          placeholder="Explica cómo calculaste la osmolaridad del citoplasma a partir del volumen de equilibrio, y por qué el agua va hacia el lado de mayor osmolaridad..."
          rows={4}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-[11px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={handleReset} aria-label="Reiniciar la práctica"
          className="w-14 h-14 bg-slate-100 hover:bg-cyan-50 text-slate-500 hover:text-cyan-600 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200">
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
