"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { RefreshCcw, ShieldCheck, CheckCircle2, Play } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
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

  const chiOk = N >= MUESTRA_MIN_M10 && chi.chi2 <= chi.critico;
  const campo = 'h-8 w-24 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 font-mono text-[13px] font-semibold text-white outline-none focus:border-[#FB8500]';
  return (
    <LabLayout
      tituloPanel="Predicción"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta="Muestras N" valor={`${N} / ${MUESTRA_MIN_M10}`} acento={N >= MUESTRA_MIN_M10} />
          <Lectura etiqueta="Media x̄" valor={fmt(muestra.media, 2)} />
          <Lectura etiqueta="Desv. s" valor={fmt(muestra.sigma, 2)} />
          <div className={`flex shrink-0 items-baseline gap-1.5 rounded-lg border px-2 py-1 ${N >= MUESTRA_MIN_M10 ? (chiOk ? 'border-emerald-400/50 bg-emerald-500/10' : 'border-rose-400/40 bg-rose-500/10') : 'border-white/10 bg-white/[0.04]'}`}
            title="Estadístico χ² contra su valor crítico (α = 0.001)">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">χ² / crítico</span>
            <span className={`font-mono text-[13px] font-semibold tabular-nums ${N >= MUESTRA_MIN_M10 ? (chiOk ? 'text-emerald-300' : 'text-rose-300') : 'text-slate-400'}`}>
              {N > 0 ? `${chi.chi2.toFixed(1)} / ${chi.critico.toFixed(1)}` : '—'}
            </span>
          </div>
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          Galton · {FILAS_M10} filas · Binomial(10, p)
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Galton3DScene probabilidad={probabilidad} contenedores={contenedores} />
          <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold text-slate-200">
            <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-3 rounded-sm bg-[#f97316]" />Bolitas en cada contenedor</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-3 bg-[#ff5d73]" />Curva normal esperada</span>
            <span className="flex items-center gap-1.5"><i className="inline-block h-0.5 w-3 bg-[#ffe08a]" />Esperado binomial</span>
          </div>
        </div>
      }
      panelLateral={
        <div className="space-y-3">
          <p className="text-[12px] leading-snug text-slate-300">
            Cada bolita choca con {FILAS_M10} clavos y en cada uno va a la derecha con probabilidad p = {probabilidad.toFixed(2)}. El contenedor final es el número de desvíos a la derecha.
          </p>
          <p className="text-[12px] leading-snug text-slate-300">
            Calcula con la binomial (no copies la muestra) la media y la desviación del contenedor final. Luego recolecta al menos {MUESTRA_MIN_M10} bolitas y valida.
          </p>
        </div>
      }
      controles={
        <div className="space-y-2">
          <GrupoControles className="items-end">
            <Deslizador etiqueta="Probabilidad de ir a la derecha (p)" valor={probabilidad} min={0.1} max={0.9} paso={0.05} decimales={2} ancho="w-60"
              onChange={(v) => { setProbabilidadM10(v); audio?.playPop(); }} />
            <BotonLab variante="acento" title="Soltar 100 bolitas" onClick={() => { lanzarBolitasM10(); audio?.playPop(); }}>
              <Play size={14} fill="currentColor" /> Soltar 100{bolitasPendientes > 0 ? ' …' : ''}
            </BotonLab>
            <BotonLab variante="secundario" title="Vaciar la máquina" onClick={() => { vaciarGaltonM10(); audio?.playPop(); }}>
              <RefreshCcw size={14} /> Vaciar
            </BotonLab>
          </GrupoControles>
          <GrupoControles className="items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Tu μ teórica</span>
              <input type="text" inputMode="decimal" value={prediccionMedia} placeholder="μ" onChange={(e) => setPrediccionM10(e.target.value, prediccionSigma)} className={campo} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Tu σ teórica</span>
              <input type="text" inputMode="decimal" value={prediccionSigma} placeholder="σ" onChange={(e) => setPrediccionM10(prediccionMedia, e.target.value)} className={campo} />
            </label>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
              {status === 'success' ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />} {status === 'success' ? 'Distribución correcta' : 'Validar distribución'}
            </BotonLab>
            {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Revisa tu predicción y la muestra.</span>}
          </GrupoControles>
          <span className="block text-[10px] text-slate-500">Cambiar p vacía la máquina: cada muestra corresponde a una sola p.</span>
        </div>
      }
    />
  );
}
