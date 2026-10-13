"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Stethoscope, Syringe, ShieldCheck, RotateCcw, Activity } from 'lucide-react';
import { FARMACOS_B8, FC_NORMAL_MIN_B8, FC_NORMAL_MAX_B8 } from '@/domain/biologia';
import type { FarmacoB8 } from '@/store/types';
import type { Derivacion } from './simuladores/bio08/electro';
import LabLayout, { Lectura, GrupoControles, BotonLab } from './simulador/LabLayout';

const Electrocardiograma3DScene = dynamic(() => import('./simuladores/bio08/Electrocardiograma3DScene'), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-[#060b13] text-[11px] font-semibold text-rose-200">Preparando el electrocardiógrafo…</div>,
});

/**
 * El monitor NO muestra la FC: el alumno la mide en la tira de papel (R-R o 300 / n.º
 * de cuadros grandes). ritmoBPM sólo alimenta el nodo SA del modelo. El diagnóstico
 * de llegada se registra antes de tratar; luego titula fármacos hasta ritmo sinusal
 * normal. La escena (corazón, vector, Einthoven) y la tira leen el mismo reloj.
 */
export default function PilotoElectrocardiograma({ onValidate }: { onValidate?: () => void }) {
  const cardio = useSimuladorStore((s) => s.cardio);
  const setCardio = useSimuladorStore((s) => s.setCardio);
  const administrarFarmacoB8 = useSimuladorStore((s) => s.administrarFarmacoB8);
  const resetB8 = useSimuladorStore((s) => s.resetB8);
  const { ritmoBPM, dosis, diagnostico, lecturaFC, status } = cardio;
  const [lecturaTexto, setLecturaTexto] = useState('');
  const [derivacion, setDerivacion] = useState<Derivacion>('II');

  const dosisTotales = Object.values(dosis).reduce((s, x) => s + x, 0);
  const tratamientoIniciado = dosisTotales > 0;

  const administrar = (f: FarmacoB8) => {
    administrarFarmacoB8(f);
    setLecturaTexto(''); // tras un fármaco hay que volver a medir
    audio?.playPop();
  };

  return (
    <LabLayout
      escena={<Electrocardiograma3DScene ritmoBPM={ritmoBPM} derivacion={derivacion} onDerivacion={setDerivacion} />}
      barraSuperior={
        <>
          <Lectura etiqueta="Derivación" valor={derivacion} />
          <Lectura etiqueta="Papel" valor="25 mm/s" title="10 mm/mV" />
          <Lectura etiqueta="Cuadro grande" valor="0,2 s" title="5 mm = 0,2 s = 0,5 mV" />
          <Lectura etiqueta="Normal" valor={`${FC_NORMAL_MIN_B8}–${FC_NORMAL_MAX_B8}`} unidad="lpm" />
          {lecturaFC !== null && <Lectura etiqueta="FC registrada" valor={lecturaFC} unidad="lpm" acento />}
        </>
      }
      tituloPanel="Urgencias"
      panelLateral={
        <div className="flex flex-col gap-3 text-slate-300">
          <p className="flex gap-2 text-[12px] leading-snug"><Stethoscope size={16} className="mt-0.5 shrink-0 text-rose-300" />
            Mide la FC en la tira (FC = 300 / cuadros grandes entre dos R), diagnostica y lleva al paciente a {FC_NORMAL_MIN_B8}–{FC_NORMAL_MAX_B8} lpm.</p>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-[11px]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fármacos administrados</span>
            <ul className="mt-1 space-y-0.5 font-mono">
              {(Object.keys(FARMACOS_B8) as FarmacoB8[]).map((f) => <li key={f} className="flex justify-between"><span>{FARMACOS_B8[f].nombre}</span><span>{dosis[f]}/{FARMACOS_B8[f].max}</span></li>)}
            </ul>
          </div>
          <details className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] leading-snug text-slate-300">
            <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-slate-400">Cómo está hecho el modelo</summary>
            <div className="mt-2 space-y-1.5">
              <p>La activación recorre el corazón 3D desde el nodo SA (aurículas), el nodo AV, el haz de His, sus ramas y la red de Purkinje: tiempo de llegada τ de la ecuación eikonal |∇τ|·v = 1 (aurícula 0,9 m/s, ventrículo 0,6 m/s, Purkinje 2,5 m/s).</p>
              <p>Vector cardiaco: D(t) = −K∮V<sub>m</sub>(t)·n dA sobre la pared (capa doble equivalente), con V<sub>m</sub> = 1 entre la despolarización τ y la repolarización ρ. La repolarización empieza antes en el epicardio y en las zonas tardías: por eso la T sale en el mismo sentido que el QRS.</p>
              <p>Cada derivación es una proyección: V = D·û. I = LA − RA, II = LL − RA, III = LL − LA, de modo que I + III = II.</p>
              <p>Simplificaciones: triángulo de Einthoven ideal (torso homogéneo), K calibrado para un QRS de 1,9 mV, tiempos del dominio (PR 160 ms, QRS 90 ms, QT de Bazett), mecánica esquemática (cada punto se contrae ≈ 25 ms después de activarse) y fármacos que sólo cambian la frecuencia del SA. Las fibras de Purkinje se dibujan más gruesas para que se vean.</p>
            </div>
          </details>
        </div>
      }
      controles={
        <GrupoControles>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-300">1 · Diagnóstico de llegada</span>
            <div className="flex gap-1">
              {(['bradicardia', 'taquicardia'] as const).map((d) => (
                <button key={d} type="button" disabled={tratamientoIniciado} onClick={() => setCardio({ diagnostico: d })} aria-pressed={diagnostico === d}
                  className={`h-8 rounded-lg border px-2.5 text-[11px] font-semibold disabled:opacity-50 ${diagnostico === d ? 'border-rose-400 bg-rose-700/70 text-white' : 'border-white/15 bg-white/[0.04] text-slate-300 hover:text-white'}`}>
                  {d === 'bradicardia' ? 'Bradicardia sinusal' : 'Taquicardia sinusal'}
                </button>
              ))}
            </div>
            {tratamientoIniciado
              ? <span className="text-[10px] text-slate-500">Queda fijo al iniciar el tratamiento.</span>
              : diagnostico === null && <span className="text-[10px] text-slate-500">Regístralo antes de tratar.</span>}
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300"><Syringe size={12} /> 2 · Tratamiento (bolo IV)</span>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(FARMACOS_B8) as FarmacoB8[]).map((f) => {
                const info = FARMACOS_B8[f];
                return (
                  <button key={f} type="button" disabled={dosis[f] >= info.max || diagnostico === null} onClick={() => administrar(f)}
                    className="h-8 rounded-lg border border-white/15 bg-white/[0.04] px-2.5 text-[11px] font-semibold text-slate-200 hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-40">
                    {info.nombre} {info.dosis} <span className="font-mono text-slate-400">{dosis[f]}/{info.max}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex w-36 flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300"><Activity size={12} /> 3 · FC medida (lpm)</span>
            <input type="number" min={20} max={250} step={1} value={lecturaTexto} placeholder="lpm"
              onChange={(e) => {
                setLecturaTexto(e.target.value);
                const v = Math.round(Number(e.target.value));
                setCardio({ lecturaFC: e.target.value !== '' && Number.isFinite(v) ? v : null });
              }}
              className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
          </label>
          <BotonLab variante="secundario" onClick={() => { resetB8(); setLecturaTexto(''); }} title="Nuevo paciente"><RotateCcw size={14} /> Reiniciar</BotonLab>
          <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}><ShieldCheck size={14} /> Validar práctica</BotonLab>
        </GrupoControles>
      }
    />
  );
}
