"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  RefreshCcw, BarChart3, Zap, ShieldCheck, CheckCircle2, Play,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Galton3DScene from './simuladores/mat10/Galton3DScene';
import {
  estadisticaMuestraM10, chiCuadradaM10, MUESTRA_MIN_M10, FILAS_M10,
} from '@/domain/matematicas';

/**
 * MAT-10 · Máquina de Galton. Cada bolita decide FILAS_M10 = 10 veces (derecha
 * con probabilidad p), así que el contenedor final sigue una Binomial(10, p).
 * El alumno PREDICE μ y σ teóricas (no se muestran), recolecta ≥ 200 bolitas y
 * el validador comprueba la predicción y el ajuste χ² del histograma.
 * Fuente: De Moivre–Laplace (la binomial se aproxima por N(np, np(1−p))).
 */
export default function PilotoGalton({ onValidate }: { onValidate?: () => void }) {
  const {
    galton10, lanzarBolitasM10, vaciarGaltonM10, setProbabilidadM10, setPrediccionM10, audio, setAsistente,
  } = useSimuladorStore(useShallow((s) => ({
    galton10: s.galton10, lanzarBolitasM10: s.lanzarBolitasM10, vaciarGaltonM10: s.vaciarGaltonM10,
    setProbabilidadM10: s.setProbabilidadM10, setPrediccionM10: s.setPrediccionM10,
    audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { probabilidad, contenedores, status, prediccionMedia, prediccionSigma, bolitasPendientes } = galton10;

  const muestra = useMemo(() => estadisticaMuestraM10(contenedores), [contenedores]);
  const chi = useMemo(() => chiCuadradaM10(contenedores, probabilidad), [contenedores, probabilidad]);
  const N = muestra.N;

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al Laboratorio de Probabilidad. Cada bolita choca con 10 clavos y en cada uno va a la derecha con probabilidad p. Predice la media μ y la desviación σ del contenedor donde cae, y comprueba tu predicción con al menos 200 bolitas.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  const fmt = (v: number, d: number) => (Number.isFinite(v) ? v.toFixed(d) : '—');

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">

      {/* ── 3D SCENE ── */}
      <div className="absolute inset-0 z-0 opacity-80">
        <Galton3DScene probabilidad={probabilidad} contenedores={contenedores} />
      </div>

      {/* ── UI OVERLAY ── */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none">

        {/* HEADER */}
        <div className="flex flex-wrap justify-between items-start gap-4 min-w-0">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <BarChart3 className="text-amber-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter">Máquina de Galton</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">{FILAS_M10} filas · Binomial(10, p)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 border-t border-white/5 pt-4">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Muestras (N)</span>
                    <span className="text-xl font-black tabular-nums text-emerald-400">{N}</span>
                 </div>
                 <div className="w-px h-8 bg-white/5" />
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Media muestral x̄</span>
                    <span className="text-xl font-black tabular-nums text-blue-400">{fmt(muestra.media, 2)}</span>
                 </div>
                 <div className="w-px h-8 bg-white/5" />
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Desv. muestral s</span>
                    <span className="text-xl font-black tabular-nums text-pink-400">{fmt(muestra.sigma, 2)}</span>
                 </div>
                 <div className="w-px h-8 bg-white/5" />
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase">χ² (crítico α=0.001)</span>
                    <span className={`text-xl font-black tabular-nums ${N >= MUESTRA_MIN_M10 ? (chi.chi2 <= chi.critico ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-500'}`}>
                      {N > 0 ? `${chi.chi2.toFixed(1)} / ${chi.critico.toFixed(1)}` : '—'}
                    </span>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* MISIÓN HUD: predicción teórica */}
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pointer-events-auto bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl max-w-[340px]">
             <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Tu predicción teórica (p = {probabilidad.toFixed(2)})</span>
             </div>
             <p className="text-[11px] font-medium text-slate-300 leading-relaxed">
               Calcula con la binomial (no copies la muestra) la media y la desviación del contenedor final. Luego recolecta al menos {MUESTRA_MIN_M10} bolitas.
             </p>
             <div className="grid grid-cols-2 gap-3 mt-4">
               <label className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-slate-500 uppercase">μ teórica</span>
                 <input
                   type="text" inputMode="decimal" value={prediccionMedia} placeholder="μ"
                   onChange={(e) => setPrediccionM10(e.target.value, prediccionSigma)}
                   className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                 />
               </label>
               <label className="flex flex-col gap-1">
                 <span className="text-[9px] font-black text-slate-500 uppercase">σ teórica</span>
                 <input
                   type="text" inputMode="decimal" value={prediccionSigma} placeholder="σ"
                   onChange={(e) => setPrediccionM10(prediccionMedia, e.target.value)}
                   className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                 />
               </label>
             </div>
             <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-amber-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((N / MUESTRA_MIN_M10) * 100, 100)}%` }}
                />
             </div>
             <span className="text-[9px] font-bold text-slate-500 mt-1 block">{N} / {MUESTRA_MIN_M10} bolitas</span>
          </motion.div>
        </div>

        {/* CONTROLES INFERIORES */}
        <div className="mt-auto pointer-events-auto flex gap-6 items-end">
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] flex flex-wrap items-center gap-6 flex-1 min-w-0 shadow-2xl">
            <div className="flex-1 min-w-[200px] space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="text-amber-400" size={14} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Probabilidad de ir a la derecha (p)</span>
                </div>
                <span className="text-sm font-black text-amber-400 font-mono bg-amber-400/10 px-3 py-1 rounded-xl">
                  {probabilidad.toFixed(2)}
                </span>
              </div>
              <input
                type="range" min="0.1" max="0.9" step="0.05" value={probabilidad}
                onChange={e => { setProbabilidadM10(parseFloat(e.target.value)); audio?.playPop(); }}
                className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
              <span className="text-[9px] font-bold text-slate-500 block">Cambiar p vacía la máquina: cada muestra corresponde a una sola p.</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { lanzarBolitasM10(); audio?.playPop(); }}
                className="h-16 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 transition-all active:scale-95 shadow-xl"
                title="Soltar 100 bolitas"
              >
                <Play size={18} fill="currentColor" />
                Soltar 100{bolitasPendientes > 0 ? ' …' : ''}
              </button>
              <button
                onClick={() => { vaciarGaltonM10(); audio?.playPop(); }}
                className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl"
                title="Vaciar la máquina"
              >
                <RefreshCcw size={20} />
              </button>
              <button
                onClick={() => onValidate?.()}
                className={`h-16 px-6 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-600/20 ${status === 'success' ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {status === 'success' ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
                Validar Distribución
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
