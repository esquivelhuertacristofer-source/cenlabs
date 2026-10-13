"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { estadisticaMuestraM10, chiCuadradaM10, leerNumero, MUESTRA_MIN_M10 } from '@/domain/matematicas';
import { audio } from '@/utils/audioEngine';
import { ShieldCheck, Trash2, BookOpen, Zap, BarChart3, ListChecks } from 'lucide-react';
import { Lienzo, dibujarHistograma, prediccionValida } from '@/components/simuladores/mat10/Dock';

/**
 * Bitácora de la máquina de Galton: el cuaderno del alumno. La muestra (mismo
 * histograma que el dock), los tres hallazgos y el análisis escrito.
 * NO REGALA: la binomial del modelo, su normal y la prueba χ² aparecen sólo cuando la
 * validación ha dado por buena la predicción.
 */
export default function BitacoraGalton({ onValidate }: { onValidate?: () => void }) {
  const { galton10, lanzarBolitasM10, resetM10 } = useSimuladorStore(useShallow((s) => ({
    galton10: s.galton10, lanzarBolitasM10: s.lanzarBolitasM10, resetM10: s.resetM10,
  })));
  const { probabilidad: p, status, contenedores, prediccionMedia, prediccionSigma } = galton10;
  const muestra = estadisticaMuestraM10(contenedores);
  const N = muestra.N;
  const validado = status === 'success';
  const chi = validado ? chiCuadradaM10(contenedores, p) : null;
  const pred = prediccionValida(prediccionMedia, prediccionSigma);

  const [conclusionText, setConclusionText] = useState('');
  const handleReset = () => { resetM10(); setConclusionText(''); audio.playPop(); };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const hasEnoughBalls = N >= MUESTRA_MIN_M10;
  const hasEnoughWords = wordCount >= 30;
  const canValidate = hasEnoughBalls && hasEnoughWords;

  const checkProb = Number.isFinite(leerNumero(prediccionMedia)) && Number.isFinite(leerNumero(prediccionSigma));
  const checkNormal = !!chi && chi.chi2 <= chi.critico;

  const Hallazgo = ({ ok, titulo, valor }: { ok: boolean; titulo: string; valor: string }) => (
    <div className={`flex items-center justify-between rounded-2xl border px-4 py-2 transition-all ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-slate-100 bg-slate-50'}`}>
      <div className="flex min-w-0 flex-col">
        <span className={`text-[9px] font-black uppercase tracking-widest ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>{titulo}</span>
        <span className="truncate font-mono text-[12px] font-bold text-[#023047]">{valor}</span>
      </div>
      <div className={`h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-emerald-500' : 'bg-slate-300'}`} />
    </div>
  );

  return (
    <div className="space-y-3 animate-in fade-in duration-500 font-['Outfit']">

      {/* MUESTRA */}
      <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-[#219EBC]" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#023047]">Muestra</h4>
          </div>
          <span className="font-mono text-[11px] font-bold text-slate-500">N = {N} / {MUESTRA_MIN_M10}</span>
        </div>
        <Lienzo alto={112} etiqueta="Histograma de la muestra"
          dibujar={(ctx, w, h) => dibujarHistograma(ctx, w, h, { cont: contenedores, prediccion: pred, teoria: validado ? p : null, tema: 'claro' })}
          deps={[contenedores, pred?.mu, pred?.sigma, validado, p]} />
        <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-[12px] font-bold text-[#023047]">
          <span className="rounded-xl bg-slate-50 px-3 py-1.5"><span className="mr-1 text-[10px] text-slate-400">x̄</span>{N ? muestra.media.toFixed(2) : '—'}</span>
          <span className="rounded-xl bg-slate-50 px-3 py-1.5"><span className="mr-1 text-[10px] text-slate-400">s</span>{N ? muestra.sigma.toFixed(2) : '—'}</span>
        </div>
        <button
          onClick={() => { lanzarBolitasM10(); audio.playPop(); }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#219EBC] py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-[#1b87a1] active:scale-95"
        >
          <Zap size={14} fill="currentColor" /> Soltar 100 bolitas
        </button>
      </div>

      {/* HALLAZGOS */}
      <div className="space-y-1.5 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <ListChecks size={15} className="text-[#219EBC]" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#023047]">Hallazgos</h4>
        </div>
        <Hallazgo ok={checkProb} titulo={`Tu predicción (p = ${p.toFixed(2)})`} valor={checkProb ? `μ = ${prediccionMedia} · σ = ${prediccionSigma}` : 'escribe μ y σ'} />
        <Hallazgo ok={hasEnoughBalls} titulo={`Muestra (N ≥ ${MUESTRA_MIN_M10})`} valor={`${N} ${N === 1 ? 'bolita' : 'bolitas'}`} />
        <Hallazgo ok={checkNormal} titulo="Ajuste χ² a la binomial" valor={chi ? `χ² = ${chi.chi2.toFixed(1)} · crítico ${chi.critico.toFixed(1)} · gl ${chi.gl}` : 'al validar'} />
      </div>

      {/* ANÁLISIS */}
      <div className="space-y-2 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-[#023047]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#023047]">Análisis</span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
        </div>
        <textarea
          value={conclusionText} onChange={(e) => setConclusionText(e.target.value)}
          placeholder="Compara tu μ y σ con x̄ y s. ¿Por qué la binomial se parece a una campana (De Moivre–Laplace)?"
          rows={3}
          className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-3 text-[11px] font-medium italic text-slate-600 focus:border-[#219EBC] focus:outline-none"
        />
      </div>

      {/* ACCIONES */}
      <div className="flex gap-3">
        <button onClick={handleReset} aria-label="Reiniciar la práctica"
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 transition-all hover:bg-sky-50 hover:text-[#219EBC] active:scale-95">
          <Trash2 size={20} />
        </button>
        <button
          onClick={() => onValidate?.()}
          disabled={!canValidate || validado}
          className={`flex flex-1 items-center justify-center gap-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all ${
            validado ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
            canValidate ? 'bg-[#023047] text-white shadow-slate-900/20' :
            'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none'
          }`}
        >
          {validado ? <ShieldCheck size={16} /> : <Zap size={16} />}
          {validado ? 'Práctica completada' :
            !hasEnoughBalls ? `Faltan ${MUESTRA_MIN_M10 - N} bolitas` :
            !hasEnoughWords ? `Faltan ${30 - wordCount} palabras` :
            'Certificar análisis'}
        </button>
      </div>

      <AnimatePresence>
        {validado && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.6rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
            <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">Distribución verificada</p>
            <p className="text-xs font-bold italic text-slate-600">El azar de cada bolita, sumado diez veces, dibuja la binomial.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
