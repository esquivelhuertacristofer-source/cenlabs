"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Dna, Zap, RotateCcw, ShieldCheck, Calculator } from 'lucide-react';
import Genetica3DScene from './simuladores/bio05/Genetica3DScene';
import { FENOTIPOS_B5, TAMANIOS_B5, N_MIN_B5, chiCuadradaB5, claseFenotipoB5 } from '@/domain/biologia';
import type { ProporcionB5 } from '@/store/types';

const fenotipoDe = (g: string) => FENOTIPOS_B5[claseFenotipoB5(g)];

export default function PilotoGenetica({ onValidate }: { onValidate?: () => void }) {
  const genetica = useSimuladorStore((s) => s.genetica);
  const setGenetica = useSimuladorStore((s) => s.setGenetica);
  const generarF1 = useSimuladorStore((s) => s.generarF1);
  const resetB5 = useSimuladorStore((s) => s.resetB5);
  const { padre1, padre2, prediccion, tamanioMuestra, poblacionF1, cruza, status } = genetica;

  const [cruzando, setCruzando] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  // AaBb × AaBb es la autofecundación de la F1 de Mendel: su descendencia es la F2.
  const etiquetaDescendencia = padre1 === 'AaBb' && padre2 === 'AaBb' ? 'Descendencia (F2)' : 'Descendencia';
  const sumaPred = prediccion.reduce((s, x) => s + x, 0);

  const setPred = (i: number, v: string) => {
    const n = Math.max(0, Math.min(99, Math.floor(Number(v) || 0)));
    const p = [...prediccion] as ProporcionB5;
    p[i] = n;
    setGenetica({ prediccion: p });
  };

  const cruzar = () => {
    if (cruzando || sumaPred <= 0) return;
    setCruzando(true);
    timer.current = setTimeout(() => {
      generarF1();
      setCruzando(false);
      timer.current = null;
    }, 1200);
  };

  const chi = cruza ? chiCuadradaB5(cruza.observados, cruza.prediccion) : null;
  const sumaCruza = cruza ? cruza.prediccion.reduce((s, x) => s + x, 0) : 0;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020617] font-['Outfit'] flex flex-col">
      <div className="relative flex-1">
        <Genetica3DScene padre1={padre1} padre2={padre2} f1={poblacionF1} status={status} />
        <div className="absolute top-6 left-6 z-10 bg-black/75 backdrop-blur-xl border-l-4 border-indigo-500 p-5 rounded-r-2xl max-w-sm pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300"><Dna size={12} /> Cruza de la misión</div>
          <div className="mt-2 text-lg font-black text-white font-mono">{padre1} × {padre2}</div>
          <div className="text-[11px] text-slate-300">{fenotipoDe(padre1)} × {fenotipoDe(padre2)}</div>
          <div className="mt-2 text-[10px] text-slate-400">A = amarilla (dominante) · a = verde · B = lisa (dominante) · b = rugosa</div>
        </div>
        {cruzando && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 bg-black/70 border border-indigo-500/40 rounded-2xl text-[11px] font-black uppercase tracking-widest text-indigo-300">
            Polinizando y cosechando {tamanioMuestra} semillas…
          </div>
        )}
      </div>

      <div className="h-[46%] shrink-0 overflow-y-auto bg-black/60 border-t border-white/10 p-4 grid grid-cols-2 gap-4 content-start text-white">
        <div className="space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">1 · Tu predicción (proporción entera)</div>
          <div className="grid grid-cols-2 gap-2">
            {FENOTIPOS_B5.map((f, i) => (
              <label key={f} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-300">{f}</span>
                <input type="number" min={0} max={99} step={1} value={prediccion[i]} disabled={cruzando}
                  onChange={(e) => setPred(i, e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 font-mono text-sm text-white outline-none focus:border-indigo-400" />
              </label>
            ))}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Proporción: {prediccion.join(' : ')}</div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">2 · Tamaño de la muestra</div>
          <div className="grid grid-cols-5 gap-2">
            {TAMANIOS_B5.map((n) => (
              <button key={n} disabled={cruzando} onClick={() => setGenetica({ tamanioMuestra: n })}
                className={`py-2 rounded-xl text-[11px] font-black border ${tamanioMuestra === n ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/10 text-slate-400'}`}>{n}</button>
            ))}
          </div>
        </div>

        <button onClick={cruzar} disabled={cruzando || sumaPred <= 0}
          className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest transition-all ${sumaPred > 0 && !cruzando ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-white/5 text-slate-500'}`}>
          <Zap size={16} /> {sumaPred > 0 ? '3 · Realizar la cruza' : 'Escribe tu predicción primero'}
        </button>

        {cruza && (
          <div className="space-y-3 bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{etiquetaDescendencia} · n = {cruza.n}</div>
            <table className="w-full text-[11px] font-mono">
              <thead><tr className="text-[9px] uppercase text-slate-500"><th className="text-left">Fenotipo</th><th className="text-right">Obs.</th><th className="text-right">Esp.</th></tr></thead>
              <tbody>
                {FENOTIPOS_B5.map((f, i) => (
                  <tr key={f}><td>{f}</td><td className="text-right">{cruza.observados[i]}</td>
                    <td className="text-right">{sumaCruza > 0 ? ((cruza.n * cruza.prediccion[i]) / sumaCruza).toFixed(1) : '—'}</td></tr>
                ))}
              </tbody>
            </table>
            {chi && (
              <div className="text-[11px] font-mono text-slate-200 flex items-start gap-2">
                <Calculator size={14} className="shrink-0 mt-0.5 text-indigo-300" />
                <span>
                  χ² = {Number.isFinite(chi.chi2) ? chi.chi2.toFixed(2) : '∞'} · gl = {chi.gl} · crítico (α = 0.05) = {chi.critico}
                  <br />
                  {chi.chi2 <= chi.critico ? 'Los datos NO contradicen tu predicción.' : 'Los datos contradicen tu predicción (se rechaza).'}
                  {cruza.n < N_MIN_B5 && <><br /><span className="text-amber-300">Con menos de {N_MIN_B5} semillas la prueba tiene poco poder.</span></>}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => resetB5()} disabled={cruzando} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white"><RotateCcw size={18} /></button>
          <button onClick={() => onValidate?.()} disabled={cruzando || !cruza}
            className={`flex-1 rounded-2xl flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest ${cruza && !cruzando ? 'bg-white text-black' : 'bg-white/5 text-slate-500'}`}>
            <ShieldCheck size={16} /> Validar práctica
          </button>
        </div>
      </div>
    </div>
  );
}
