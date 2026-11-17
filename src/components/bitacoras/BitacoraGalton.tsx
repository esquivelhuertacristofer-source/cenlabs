"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { estadisticaMuestraM10, chiCuadradaM10, hallazgoPrediccionM10, MUESTRA_MIN_M10 } from '@/domain/matematicas';
import { audio } from '@/utils/audioEngine';
import { ShieldCheck, Trash2, BookOpen, Zap, BarChart3, ListChecks } from 'lucide-react';
import { Lienzo, dibujarHistograma, prediccionValida } from '@/components/simuladores/mat10/Dock';
import { useBancoGalton } from '@/components/simuladores/mat10/banco';

type Tono = 'ok' | 'mal' | 'neutro';
const TONOS: Record<Tono, { caja: string; titulo: string; punto: string }> = {
  ok: { caja: 'border-emerald-200 bg-emerald-50', titulo: 'text-emerald-700', punto: 'bg-emerald-500' },
  mal: { caja: 'border-rose-200 bg-rose-50', titulo: 'text-rose-700', punto: 'bg-rose-500' },
  neutro: { caja: 'border-slate-200 bg-slate-50', titulo: 'text-slate-500', punto: 'bg-slate-300' },
};

function Hallazgo({ tono, titulo, valor, pista, dato }: { tono: Tono; titulo: string; valor: string; pista?: string; dato: string }) {
  const t = TONOS[tono];
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition-all ${t.caja}`} data-hallazgo={dato} data-tono={tono}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={`text-[13px] font-bold ${t.titulo}`}>{titulo}</span>
        <span className="font-mono text-[14px] font-bold text-[#023047]">{valor}</span>
        {pista && <span className="text-[13px] font-medium leading-snug text-slate-600">{pista}</span>}
      </div>
      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.punto}`} aria-hidden />
    </div>
  );
}

/**
 * Bitácora de la máquina de Galton: el cuaderno del alumno. Los tres hallazgos y el
 * análisis escrito. El histograma sólo aparece aquí cuando el laboratorio NO enseña su
 * panel «Muestra» (columna estrecha): nunca hay dos histogramas a la vez, y «Soltar 100»
 * y x̄ / s viven en un solo sitio (los mandos y la barra de lecturas del laboratorio).
 * NO REGALA: la binomial del modelo, su normal y la prueba χ² aparecen sólo cuando la
 * validación ha dado por buena la predicción; «Tu predicción» no se pone verde hasta
 * que el alumno valida y coincide con μ = n·p, σ = √(n·p·(1 − p)).
 */
export default function BitacoraGalton({ onValidate }: { onValidate?: () => void }) {
  const { galton10, resetM10 } = useSimuladorStore(useShallow((s) => ({
    galton10: s.galton10, resetM10: s.resetM10,
  })));
  const dockVisible = useBancoGalton((s) => s.dockVisible);
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

  const hp = hallazgoPrediccionM10(galton10);
  const checkNormal = !!chi && chi.chi2 <= chi.critico;
  const faltan = MUESTRA_MIN_M10 - N;

  return (
    <div className="space-y-3 animate-in fade-in duration-500 font-['Outfit']" data-bitacora="matematicas-10">

      {/* MUESTRA: sólo si el laboratorio no la está enseñando ya en su panel */}
      {!dockVisible && (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm" data-seccion="muestra">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[#219EBC]" />
              <h4 className="text-[14px] font-black tracking-wide text-[#023047]">Muestra</h4>
            </div>
            <span className="font-mono text-[13px] font-bold text-slate-600">N = {N} / {MUESTRA_MIN_M10}</span>
          </div>
          <Lienzo alto={170} etiqueta="Histograma de la muestra: bolitas por contenedor"
            dibujar={(ctx, w, h) => dibujarHistograma(ctx, w, h, { cont: contenedores, prediccion: pred, teoria: validado ? p : null, tema: 'claro' })}
            deps={[contenedores, pred?.mu, pred?.sigma, validado, p]} />
          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] font-semibold text-slate-500">
            <span className="flex items-center gap-1"><i className="inline-block h-2 w-2.5 rounded-[2px] bg-[#7d97b4]" />bolitas por canal</span>
            <span className="flex items-center gap-1" style={{ color: pred ? '#b45309' : undefined }}>
              <i className="inline-block w-3 border-t-2 border-dashed" style={{ borderColor: pred ? '#d97706' : '#94a3b8' }} />tu curva teórica
            </span>
          </p>
        </div>
      )}

      {/* HALLAZGOS */}
      <div className="space-y-2 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <ListChecks size={16} className="text-[#219EBC]" />
          <h4 className="text-[14px] font-black tracking-wide text-[#023047]">Hallazgos</h4>
        </div>
        <Hallazgo dato="prediccion"
          tono={hp.estado === 'correcta' ? 'ok' : hp.estado === 'incorrecta' ? 'mal' : 'neutro'}
          titulo={`Tu predicción (p = ${p.toFixed(2)})`}
          valor={hp.estado === 'vacia' ? 'μ = ? · σ = ?' : `μ = ${prediccionMedia} · σ = ${prediccionSigma}`}
          pista={hp.pista} />
        <Hallazgo dato="muestra" tono={hasEnoughBalls ? 'ok' : 'neutro'} titulo={`Muestra (N ≥ ${MUESTRA_MIN_M10})`}
          valor={`${N} ${N === 1 ? 'bolita' : 'bolitas'}`}
          pista={hasEnoughBalls ? undefined : `Faltan ${faltan}: usa «Soltar 100» en los mandos.`} />
        <Hallazgo dato="chi2" tono={checkNormal ? 'ok' : 'neutro'} titulo="Ajuste χ² a la binomial"
          valor={chi ? `χ² = ${chi.chi2.toFixed(1)} · crítico ${chi.critico.toFixed(1)} · gl ${chi.gl}` : 'se calcula al validar'} />
      </div>

      {/* ANÁLISIS */}
      <div className="space-y-2 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#023047]" />
            <span className="text-[14px] font-black tracking-wide text-[#023047]">Análisis</span>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{wordCount}/30 palabras</span>
        </div>
        <textarea
          value={conclusionText} onChange={(e) => setConclusionText(e.target.value)}
          placeholder="Compara tu μ y tu σ con la media y la desviación de la muestra. ¿Por qué la binomial se parece a una campana (De Moivre–Laplace)?"
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[14px] font-medium leading-snug text-slate-700 placeholder:text-slate-500 focus:border-[#219EBC] focus:outline-none"
        />
      </div>

      {/* ACCIONES */}
      <div className="flex gap-3">
        <button onClick={handleReset} aria-label="Reiniciar la práctica" title="Reiniciar la práctica"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 transition-all hover:bg-sky-50 hover:text-[#219EBC] active:scale-95">
          <Trash2 size={20} />
        </button>
        <button
          onClick={() => onValidate?.()}
          disabled={!canValidate || validado}
          className={`flex min-h-12 flex-1 items-center justify-center gap-2.5 rounded-2xl px-3 text-[14px] font-black tracking-wide shadow-xl transition-all ${
            validado ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
            canValidate ? 'bg-[#023047] text-white shadow-slate-900/20' :
            'cursor-not-allowed bg-slate-200 text-slate-500 shadow-none'
          }`}
        >
          {validado ? <ShieldCheck size={16} /> : <Zap size={16} />}
          {validado ? 'Práctica completada' :
            !hasEnoughBalls ? `Faltan ${faltan} bolitas` :
            !hasEnoughWords ? `Faltan ${30 - wordCount} palabras` :
            'Certificar análisis'}
        </button>
      </div>

      <AnimatePresence>
        {validado && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.6rem] border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
            <p className="mb-1 text-[14px] font-black tracking-wide text-emerald-700">Distribución verificada</p>
            <p className="text-[14px] font-semibold text-slate-600">El azar de cada bolita, sumado diez veces, dibuja la binomial.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
