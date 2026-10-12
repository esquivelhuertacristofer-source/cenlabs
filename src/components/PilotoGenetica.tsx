"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, RotateCcw, ShieldCheck, Calculator } from 'lucide-react';
import Genetica3DScene from './simuladores/bio05/Genetica3DScene';
import LabLayout, { Lectura, GrupoControles, BotonLab, Segmentado } from './simulador/LabLayout';
import { FENOTIPOS_B5, TAMANIOS_B5, N_MIN_B5, chiCuadradaB5, claseFenotipoB5 } from '@/domain/biologia';
import type { ProporcionB5 } from '@/store/types';

const fenotipoDe = (g: string) => FENOTIPOS_B5[claseFenotipoB5(g)];

export default function PilotoGenetica({ onValidate }: { onValidate?: () => void }) {
  const genetica = useSimuladorStore((s) => s.genetica);
  const setGenetica = useSimuladorStore((s) => s.setGenetica);
  const generarF1 = useSimuladorStore((s) => s.generarF1);
  const resetB5 = useSimuladorStore((s) => s.resetB5);
  const { padre1, padre2, prediccion, tamanioMuestra, cruza } = genetica;

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

  const barra = (
    <>
      <Lectura etiqueta="Cruza de la misión" valor={`${padre1} × ${padre2}`} acento />
      <Lectura etiqueta="Fenotipos" valor={`${fenotipoDe(padre1)} × ${fenotipoDe(padre2)}`} />
      <Lectura etiqueta="Alelos" valor="A amarilla (dom.) · a verde · B lisa (dom.) · b rugosa" />
      {cruzando && <Lectura etiqueta="Estado" valor={`Polinizando y cosechando ${tamanioMuestra} semillas…`} acento />}
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2.5">
      <GrupoControles>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">1 · Tu predicción (proporción entera)</span>
          <div className="flex gap-1.5">
            {FENOTIPOS_B5.map((f, i) => (
              <label key={f} className="flex flex-col gap-0.5 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1">
                <span className="text-[10px] font-semibold text-slate-300">{f}</span>
                <input type="number" min={0} max={99} step={1} value={prediccion[i]} disabled={cruzando}
                  onChange={(e) => setPred(i, e.target.value)}
                  className="w-16 rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[13px] text-white outline-none focus:border-[#219EBC]" />
              </label>
            ))}
          </div>
        </div>
        <Segmentado etiqueta="2 · Tamaño de la muestra" opciones={TAMANIOS_B5.map((n) => ({ valor: String(n), texto: String(n) }))} valor={String(tamanioMuestra)}
          onChange={(v) => { if (!cruzando) setGenetica({ tamanioMuestra: Number(v) }); }} />
        <BotonLab onClick={cruzar} deshabilitado={cruzando || sumaPred <= 0}>
          <Zap size={14} /> {sumaPred > 0 ? '3 · Realizar la cruza' : 'Escribe tu predicción primero'}
        </BotonLab>
        <BotonLab variante="secundario" onClick={() => resetB5()} deshabilitado={cruzando}><RotateCcw size={14} /> Reiniciar</BotonLab>
        <BotonLab variante="acento" onClick={() => onValidate?.()} deshabilitado={cruzando || !cruza}><ShieldCheck size={14} /> Validar práctica</BotonLab>
      </GrupoControles>
      {cruza && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8ECAE6]">{etiquetaDescendencia} · n = {cruza.n}</span>
          <div className="flex flex-wrap gap-1.5">
            {FENOTIPOS_B5.map((f, i) => (
              <span key={f} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[11px] text-slate-200">
                {f}: <b className="text-white">{cruza.observados[i]}</b> obs · {sumaCruza > 0 ? ((cruza.n * cruza.prediccion[i]) / sumaCruza).toFixed(1) : '—'} esp
              </span>
            ))}
          </div>
          {chi && (
            <div className="flex items-start gap-2 font-mono text-[11px] text-slate-200">
              <Calculator size={14} className="mt-0.5 shrink-0 text-[#8ECAE6]" />
              <span>
                χ² = {Number.isFinite(chi.chi2) ? chi.chi2.toFixed(2) : '∞'} · gl = {chi.gl} · crítico (α = 0.05) = {chi.critico} ·{' '}
                {chi.chi2 <= chi.critico ? 'Los datos NO contradicen tu predicción.' : 'Los datos contradicen tu predicción (se rechaza).'}
                {cruza.n < N_MIN_B5 && <span className="text-amber-300"> Con menos de {N_MIN_B5} semillas la prueba tiene poco poder.</span>}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <LabLayout
      escena={<Genetica3DScene padre1={padre1} padre2={padre2} cruza={cruza} cruzando={cruzando} />}
      barraSuperior={barra} controles={controles}
    />
  );
}
