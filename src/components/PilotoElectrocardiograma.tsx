"use client";

import React, { useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Stethoscope, Syringe, ShieldCheck, RotateCcw, Activity } from 'lucide-react';
import Electrocardiograma3DScene from './simuladores/bio08/Electrocardiograma3DScene';
import { FARMACOS_B8, FC_NORMAL_MIN_B8, FC_NORMAL_MAX_B8 } from '@/domain/biologia';
import type { FarmacoB8 } from '@/store/types';

/**
 * El monitor NO muestra la FC: el alumno la mide en el trazo (R-R o 300 / n.º de
 * cuadros grandes). ritmoBPM solo alimenta la escena. El diagnóstico de llegada
 * se registra antes de tratar; luego titula fármacos hasta ritmo sinusal normal.
 */
export default function PilotoElectrocardiograma({ onValidate }: { onValidate?: () => void }) {
  const cardio = useSimuladorStore((s) => s.cardio);
  const setCardio = useSimuladorStore((s) => s.setCardio);
  const administrarFarmacoB8 = useSimuladorStore((s) => s.administrarFarmacoB8);
  const resetB8 = useSimuladorStore((s) => s.resetB8);
  const { ritmoBPM, dosis, diagnostico, lecturaFC, status } = cardio;
  const [lecturaTexto, setLecturaTexto] = useState('');

  const dosisTotales = Object.values(dosis).reduce((s, x) => s + x, 0);
  const tratamientoIniciado = dosisTotales > 0;

  const administrar = (f: FarmacoB8) => {
    administrarFarmacoB8(f);
    setLecturaTexto(''); // tras un fármaco hay que volver a medir
    audio?.playPop();
  };

  return (
    <div className="w-full h-full relative bg-[#04060f] font-['Outfit'] overflow-hidden text-white flex flex-col">
      <div className="relative flex-1">
        <Electrocardiograma3DScene ritmoBPM={ritmoBPM} />
        <div className="absolute top-6 left-6 z-10 bg-slate-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl max-w-sm pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-rose-300"><Stethoscope size={12} /> Urgencias · paciente monitorizado</div>
          <p className="text-[11px] text-slate-300 mt-2 leading-snug">
            Mide la frecuencia en el trazo, diagnostica el ritmo de llegada y llévalo a ritmo sinusal normal
            ({FC_NORMAL_MIN_B8}–{FC_NORMAL_MAX_B8} lpm) con el fármaco adecuado.
          </p>
        </div>
      </div>

      <div className="h-[46%] shrink-0 overflow-y-auto bg-black/60 border-t border-white/10 p-4 grid grid-cols-2 gap-4 content-start">
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">1 · Diagnóstico de llegada</div>
          <div className="grid grid-cols-2 gap-2">
            {(['bradicardia', 'taquicardia'] as const).map((d) => (
              <button key={d} disabled={tratamientoIniciado} onClick={() => setCardio({ diagnostico: d })}
                className={`py-3 rounded-xl text-[11px] font-black border capitalize disabled:opacity-50 ${diagnostico === d ? 'bg-rose-600 border-rose-400' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                {d === 'bradicardia' ? 'Bradicardia sinusal' : 'Taquicardia sinusal'}
              </button>
            ))}
          </div>
          {tratamientoIniciado && <p className="text-[10px] text-slate-500">El diagnóstico de llegada queda fijo al iniciar el tratamiento.</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Syringe size={14} /> 2 · Tratamiento (bolo IV)</div>
          <div className="space-y-2">
            {(Object.keys(FARMACOS_B8) as FarmacoB8[]).map((f) => {
              const info = FARMACOS_B8[f];
              const agotado = dosis[f] >= info.max;
              return (
                <button key={f} disabled={agotado || diagnostico === null} onClick={() => administrar(f)}
                  className="w-full py-3 px-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-between text-[11px] font-black disabled:opacity-40">
                  <span>{info.nombre} {info.dosis}</span>
                  <span className="font-mono text-slate-400">{dosis[f]}/{info.max}</span>
                </button>
              );
            })}
          </div>
          {diagnostico === null && <p className="text-[10px] text-slate-500">Registra primero el diagnóstico.</p>}
        </div>

        <div className="space-y-2 bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Activity size={14} /> 3 · FC medida en el trazo</div>
          <input type="number" min={20} max={250} step={1} value={lecturaTexto}
            onChange={(e) => {
              setLecturaTexto(e.target.value);
              const v = Math.round(Number(e.target.value));
              setCardio({ lecturaFC: e.target.value !== '' && Number.isFinite(v) ? v : null });
            }}
            placeholder="lpm"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 font-mono text-sm text-white outline-none focus:border-rose-400" />
          <p className="text-[10px] text-slate-500">FC = 60 / R-R (s) · o 300 / n.º de cuadros grandes entre dos R.</p>
          {lecturaFC !== null && <p className="text-[10px] text-slate-400">Registrada: {lecturaFC} lpm</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={() => { resetB8(); setLecturaTexto(''); }} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white"><RotateCcw size={18} /></button>
          <button onClick={() => onValidate?.()}
            className={`flex-1 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest ${status === 'success' ? 'bg-emerald-600' : 'bg-white text-black'}`}>
            <ShieldCheck size={16} /> Validar práctica
          </button>
        </div>
      </div>
    </div>
  );
}
