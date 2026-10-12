"use client";

import React, { useState, useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { COLORES_NO2, validarQ8 } from '@/domain/quimica';
import { Snowflake, Flame, Thermometer, RotateCcw, CheckCircle2 } from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import EquilibrioQuimico3DScene from './simuladores/qmi08/EquilibrioQuimico3DScene';
import LabLayout, { Lectura, BotonLab } from '@/components/simulador/LabLayout';

interface Props {
  isWorktableDark?: boolean;
  onValidate?: () => void;
}

export default function PilotoEquilibrioQuimico({ onValidate }: Props) {
  const { equilibrio, setUbicacionJeringa, setObservacionP8, updateTemperaturaP8, resetP8, validarP8 } =
    useSimuladorStore(useShallow((s) => ({
      equilibrio: s.equilibrio, setUbicacionJeringa: s.setUbicacionJeringa, setObservacionP8: s.setObservacionP8,
      updateTemperaturaP8: s.updateTemperaturaP8, resetP8: s.resetP8, validarP8: s.validarP8,
    })));

  const [mounted, setMounted] = useState(false);
  const [intentado, setIntentado] = useState(false);

  // Inercia térmica: 2 pasos por segundo (el store no escribe si nada cambia).
  // Las jeringas las pone `entrarLab('quimica-8')` antes de montar el panel.
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      updateTemperaturaP8(0.5);
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, [updateTemperaturaP8]);

  const veredicto = validarQ8(equilibrio);
  const validar = () => {
    setIntentado(true);
    // Un solo juez: el validador de la práctica (quiz + modal comunes).
    if (onValidate) { onValidate(); return; }
    if (validarP8()) audio?.playSuccess(); else audio?.playError();
  };

  const stations = [
    { id: 'hielo', name: 'Baño de hielo', temp: 0, icon: <Snowflake size={16} className="text-sky-300" />, color: '#3b82f6' },
    { id: 'mesa', name: 'Temperatura ambiente', temp: 20, icon: <Thermometer size={16} className="text-slate-300" />, color: '#94a3b8' },
    { id: 'caliente', name: 'Baño caliente', temp: 80, icon: <Flame size={16} className="text-orange-400" />, color: '#f59e0b' },
  ] as const;

  if (!mounted) return null;

  const escena = <EquilibrioQuimico3DScene jeringas={equilibrio.jeringas} />;

  const barraSuperior = (
    <>
      <div className="flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Equilibrio · endotérmico</span>
        <span className="text-[14px] font-bold text-white">N₂O₄ ⇌ 2 NO₂</span>
      </div>
      {/* cuántas jeringas hay en cada baño (no adelanta qué color tendrán) */}
      {stations.map((st) => {
        const n = equilibrio.jeringas.filter((j) => j.ubicacion === st.id).length;
        return <Lectura key={st.id} etiqueta={`${st.temp} °C`} valor={n} unidad={n === 1 ? 'jeringa' : 'jeringas'} />;
      })}
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button aria-label="Reiniciar jeringas" title="Reiniciar jeringas" onClick={() => { resetP8(); setIntentado(false); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RotateCcw size={15} /></button>
      </div>
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(168px,1fr))]">
        {equilibrio.jeringas.map((jeringa) => (
          <SyringeControl
            key={jeringa.id}
            jeringa={jeringa}
            stations={stations}
            setLoc={setUbicacionJeringa}
            observacion={equilibrio.observaciones?.[jeringa.id] ?? ''}
            setObs={setObservacionP8}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <BotonLab onClick={validar}>
          {equilibrio.status === 'success' && <CheckCircle2 size={14} />} Verificar equilibrio
        </BotonLab>
        <span className={`text-[12px] ${equilibrio.status === 'success' ? 'text-emerald-300' : intentado && veredicto.mensaje ? 'text-amber-200' : 'text-slate-400'}`}>
          {equilibrio.status === 'success'
            ? 'Observaciones correctas'
            : intentado && veredicto.mensaje ? veredicto.mensaje : 'Pasa cada jeringa por su baño, espera a que se estabilice y anota el color que ves.'}
        </span>
      </div>
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} />;
}

/* ── Control compacto de una jeringa: temperatura real, baño y color observado ── */
function SyringeControl({
  jeringa,
  stations,
  setLoc,
  observacion,
  setObs,
}: {
  jeringa: { id: number; ubicacion: 'mesa' | 'caliente' | 'hielo'; temp: number };
  stations: readonly { id: string; name: string; temp: number; icon: React.ReactNode; color: string }[];
  setLoc: (id: number, loc: 'mesa' | 'caliente' | 'hielo') => void;
  observacion: string;
  setObs: (id: number, color: string) => void;
}) {
  const tempColor = jeringa.temp > 50 ? '#fb923c' : jeringa.temp < 10 ? '#7dd3fc' : '#e2e8f0';
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Jeringa {jeringa.id}</span>
        <span className="font-mono text-[12px] font-semibold tabular-nums" style={{ color: tempColor }}>{jeringa.temp.toFixed(1)} °C</span>
      </div>
      <div className="flex gap-1.5">
        {stations.map((st) => (
          <button
            key={st.id}
            onClick={() => { setLoc(jeringa.id, st.id as 'mesa' | 'caliente' | 'hielo'); audio?.playPop(); }}
            title={st.name}
            aria-label={`Jeringa ${jeringa.id} al ${st.name}`}
            aria-pressed={jeringa.ubicacion === st.id}
            className={`flex h-8 flex-1 items-center justify-center rounded-lg border transition-colors ${
              jeringa.ubicacion === st.id ? 'border-[#219EBC] bg-[#219EBC]/25' : 'border-white/10 bg-white/5 opacity-70 hover:opacity-100'
            }`}
          >
            {st.icon}
          </button>
        ))}
      </div>
      <select
        aria-label={`Color observado en la jeringa ${jeringa.id}`}
        value={observacion}
        onChange={(e) => setObs(jeringa.id, e.target.value)}
        className="h-8 w-full rounded-lg border border-white/15 bg-white/5 px-2 text-[11px] font-semibold text-white outline-none focus:border-orange-400/60"
      >
        <option value="" className="bg-slate-900">Color observado…</option>
        {COLORES_NO2.map((c) => <option key={c.id} value={c.id} className="bg-slate-900">{c.etiqueta}</option>)}
      </select>
    </div>
  );
}
