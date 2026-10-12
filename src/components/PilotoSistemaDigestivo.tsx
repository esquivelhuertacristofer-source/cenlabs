'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { FlaskConical, Play, ShieldCheck, RotateCcw, Droplet } from 'lucide-react';
import SistemaDigestivo3DScene from './simuladores/bio09/SistemaDigestivo3DScene';
import { ENZIMAS_B9, MACRONUTRIENTES_B9, ORGANOS_B9 } from '@/domain/biologia';
import type { EnzimaB9, OrganoB9, IncubacionB9 } from '@/store/types';

const ENZIMAS: EnzimaB9[] = ['amilasa', 'pepsina', 'tripsina', 'lipasa'];
const ORGANOS: OrganoB9[] = ['boca', 'estomago', 'delgado', 'grueso'];

function describirEnsayo(e: IncubacionB9): string {
  const pct = Math.round(e.hidrolisis * 100);
  switch (e.resultado) {
    case 'sin_reaccion': return 'Sin hidrólisis: el sustrato quedó intacto, igual que el tubo control sin enzima.';
    case 'desnaturalizada': return 'Sin hidrólisis y la enzima precipitó: perdió su estructura de forma irreversible.';
    case 'parcial': return `Hidrólisis parcial: se degradó el ${pct} % del sustrato en 30 min.`;
    default: return `Hidrólisis completa: se degradó el ${pct} % del sustrato en 30 min.`;
  }
}

export default function PilotoSistemaDigestivo({ onValidate }: { onValidate?: () => void }) {
  const digestion = useSimuladorStore((s) => s.digestion);
  const setDigestion = useSimuladorStore((s) => s.setDigestion);
  const incubarB9 = useSimuladorStore((s) => s.incubarB9);
  const resetB9 = useSimuladorStore((s) => s.resetB9);
  const { macronutriente, enzimaSeleccionada, nivelPH, bilis, ensayo, organoRespuesta, absorcionRespuesta, status } = digestion;

  const [incubando, setIncubando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const incubar = () => {
    if (!enzimaSeleccionada || incubando) return;
    setIncubando(true);
    audio?.playPop();
    timer.current = setTimeout(() => {
      incubarB9();
      setIncubando(false);
      timer.current = null;
    }, 1500);
  };

  const sustrato = MACRONUTRIENTES_B9[macronutriente];
  const reacciona = !!ensayo && ensayo.hidrolisis > 0;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#05030a] font-['Outfit'] relative text-white">
      <div className="relative flex-1">
        <SistemaDigestivo3DScene
          macronutriente={macronutriente}
          enzima={enzimaSeleccionada}
          nivelPH={nivelPH}
          hidrolisis={ensayo?.hidrolisis ?? 0}
          reacciona={reacciona}
          organoRespuesta={organoRespuesta}
          absorbiendo={status === 'success'}
        />
        <div className="absolute top-6 left-6 z-10 bg-[#0f172a]/80 backdrop-blur-xl border border-rose-500/30 p-5 rounded-2xl max-w-sm pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-rose-300"><FlaskConical size={12} /> Tubo de ensayo · 37 °C</div>
          <div className="text-lg font-black mt-1">{sustrato.alimento}</div>
          <div className="text-[11px] text-slate-300">Sustrato: {sustrato.nombre}. Encuentra la enzima y las condiciones que lo hidrolizan por completo, y dónde ocurre en el cuerpo.</div>
        </div>
        {incubando && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-black/70 border border-rose-500/40 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-300">
            Incubando 30 min…
          </div>
        )}
      </div>

      <div className="h-[46%] shrink-0 overflow-y-auto bg-black/60 border-t border-white/10 p-4 grid grid-cols-2 gap-4 content-start">
        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">1 · Enzima</div>
          <div className="grid grid-cols-2 gap-2">
            {ENZIMAS.map((e) => (
              <button key={e} disabled={incubando} onClick={() => setDigestion({ enzimaSeleccionada: e })}
                className={`py-3 rounded-xl text-[11px] font-black border ${enzimaSeleccionada === e ? 'bg-[#219EBC] border-transparent' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                {ENZIMAS_B9[e].nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400"><span>2 · pH del tampón</span><span className="text-white font-mono">{nivelPH.toFixed(1)}</span></div>
          <input type="range" min={1} max={12} step={0.5} value={nivelPH} disabled={incubando}
            onChange={(e) => setDigestion({ nivelPH: parseFloat(e.target.value) })}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#219EBC]" />
          <button disabled={incubando} onClick={() => setDigestion({ bilis: !bilis })}
            className={`w-full py-3 rounded-xl text-[11px] font-black border flex items-center justify-center gap-2 ${bilis ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-white/5 border-white/10 text-slate-400'}`}>
            <Droplet size={14} /> {bilis ? 'Con sales biliares' : 'Sin sales biliares'}
          </button>
        </div>

        <button onClick={incubar} disabled={!enzimaSeleccionada || incubando}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest ${enzimaSeleccionada && !incubando ? 'bg-rose-600 hover:bg-rose-500' : 'bg-white/5 text-slate-500'}`}>
          <Play size={16} /> 3 · Incubar 30 min
        </button>

        {ensayo && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] space-y-1">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Último tubo: {ENZIMAS_B9[ensayo.enzima].nombre} · pH {ensayo.pH.toFixed(1)} · {ensayo.bilis ? 'con' : 'sin'} bilis</div>
            <div className="font-bold">{describirEnsayo(ensayo)}</div>
          </div>
        )}

        <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
          <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            4 · ¿En qué órgano actúa la enzima de tu último tubo?
            <select value={organoRespuesta ?? ''} onChange={(e) => setDigestion({ organoRespuesta: (e.target.value || null) as OrganoB9 | null })}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white normal-case tracking-normal">
              <option value="">—</option>
              {ORGANOS.map((o) => <option key={o} value={o}>{ORGANOS_B9[o]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
            5 · ¿Dónde se absorben los productos ({sustrato.monomero})?
            <select value={absorcionRespuesta ?? ''} onChange={(e) => setDigestion({ absorcionRespuesta: (e.target.value || null) as OrganoB9 | null })}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white normal-case tracking-normal">
              <option value="">—</option>
              {ORGANOS.map((o) => <option key={o} value={o}>{ORGANOS_B9[o]}</option>)}
            </select>
          </label>
        </div>

        <div className="flex gap-3">
          <button onClick={() => resetB9()} disabled={incubando} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white"><RotateCcw size={18} /></button>
          <button onClick={() => onValidate?.()} disabled={incubando || !ensayo}
            className={`flex-1 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest ${ensayo && !incubando ? 'bg-white text-black' : 'bg-white/5 text-slate-500'}`}>
            <ShieldCheck size={16} /> Validar práctica
          </button>
        </div>
        {status === 'success' && <p className="text-[11px] font-bold text-emerald-400 text-center">Digestión y absorción correctas.</p>}
      </div>
    </div>
  );
}
