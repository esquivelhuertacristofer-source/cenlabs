"use client";

import React, { useState, useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { COLORES_NO2, tonoMezclaNO2, validarQ8 } from '@/domain/quimica';
import {
  Snowflake, Flame, MousePointer2, RotateCcw,
  Info, Activity, FlaskConical, CheckCircle2
} from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import EquilibrioQuimico3DScene from './simuladores/qmi08/EquilibrioQuimico3DScene';

interface Props {
  isWorktableDark?: boolean;
  onValidate?: () => void;
}

export default function PilotoEquilibrioQuimico({ isWorktableDark = true, onValidate }: Props) {
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
    { id: 'hielo', name: 'Baño de Hielo', temp: 0, icon: <Snowflake size={22} className="text-blue-400" />, color: '#3b82f6' },
    { id: 'mesa', name: 'Temp. Ambiente', temp: 20, icon: <MousePointer2 size={22} className="text-slate-400" />, color: '#94a3b8' },
    { id: 'caliente', name: 'Plancha Caliente', temp: 80, icon: <Flame size={22} className="text-orange-500" />, color: '#f59e0b' },
  ] as const;


  if (!mounted) return null;

  return (
    <div className="relative w-full h-full bg-[#04060f] overflow-hidden flex flex-col font-['Outfit'] text-white">

      {/* ── ESCENA 3D — REACTOR DE EQUILIBRIO (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <EquilibrioQuimico3DScene jeringas={equilibrio.jeringas} />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#04060f]/70 via-transparent to-[#04060f]/85" />

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Sincronía Termodinámica
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Equilibrium Status HUD</span>
          </div>

          {/* Cuántas jeringas hay en cada baño (no adelanta qué color tendrán) */}
          <div className="grid grid-cols-3 gap-4">
            {stations.map((st) => {
              const n = equilibrio.jeringas.filter(j => j.ubicacion === st.id).length;
              return (
                <div key={st.id} className={`p-4 rounded-2xl border transition-all ${n > 0 ? 'bg-white/10 border-white/25' : 'bg-white/5 border-white/5'}`}>
                  <div className="text-[9px] font-black uppercase text-white/50 mb-2">{st.name} · {st.temp} °C</div>
                  <div className={`text-sm font-black italic ${n > 0 ? 'text-white' : 'text-white/30'}`}>{n} jeringa{n === 1 ? '' : 's'}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── HUD SUPERIOR ── */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex gap-6 pointer-events-auto">
          <div className="px-8 py-6 bg-black/40 backdrop-blur-[50px] rounded-[2.5rem] border border-white/10 flex items-center gap-6 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            <div className="relative">
              <Activity className="text-orange-500 animate-pulse" size={38} />
              <div className="absolute inset-0 bg-orange-500/30 blur-3xl rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Reacción en Equilibrio</span>
              <div className="flex items-center gap-4">
                <h3 className="text-3xl font-black tracking-tighter text-white">N₂O₄ ⇌ 2NO₂</h3>
                <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 rounded-full text-[9px] font-black text-orange-400 uppercase tracking-widest">Endotérmica</span>
              </div>
            </div>
          </div>

          <div className="px-7 py-6 bg-black/40 backdrop-blur-[50px] rounded-[2.5rem] border border-white/10 flex items-center gap-5 shadow-2xl">
            <Info className="text-blue-400" size={26} />
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Mecanismo</span>
              <span className="text-sm font-black uppercase text-blue-100/60 tracking-widest">Le Châtelier</span>
            </div>
          </div>
        </div>

        <button aria-label="Reiniciar jeringas" onClick={() => { resetP8(); setIntentado(false); }} className="h-20 w-20 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-white/10 transition-all pointer-events-auto group">
          <RotateCcw size={30} className="group-hover:rotate-[-180deg] transition-transform duration-1000" />
        </button>
      </div>

      {/* ── CAPA INTERACTIVA (deja pasar OrbitControls por el centro) ── */}
      <main className="flex-grow relative z-10 pointer-events-none">
        {/* hueco central: aquí el reactor 3D recibe arrastre / zoom */}
        <div className="flex-grow" />

        {/* ── PANEL DE CONTROL DE JERINGAS (Le Châtelier) ── */}
        <div className="absolute bottom-40 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
          <div className="bg-black/50 backdrop-blur-3xl px-8 py-6 rounded-[3rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex items-center gap-6">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Estrés Térmico</span>
            {equilibrio.jeringas.map(jeringa => (
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
        </div>

        {/* ── VALIDACIÓN ── */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-4 bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl pointer-events-auto">
          <span className="text-[10px] font-black text-white/50 uppercase tracking-widest px-3">
            {equilibrio.status === 'success'
              ? 'Observaciones correctas'
              : intentado && veredicto.mensaje ? veredicto.mensaje : 'Registra el color de cada jeringa'}
          </span>
          <button
            onClick={validar}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-orange-500/30 flex items-center gap-2"
          >
            {equilibrio.status === 'success' && <CheckCircle2 size={14} />} Verificar Equilibrio
          </button>
        </div>
      </main>

      {/* ── FOOTER TOOLTIP HUD ── */}
      <div className="absolute top-64 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-none">
        <div className="bg-black/50 backdrop-blur-3xl px-10 py-4 rounded-full border border-white/10 shadow-2xl flex items-center gap-10">
          <div className="flex items-center gap-4">
            <MousePointer2 size={22} className="text-blue-400 animate-bounce" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Mueve cada jeringa entre baños para estresar el sistema</span>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="flex items-center gap-4">
            <FlaskConical size={22} className="text-orange-400" />
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Espera a que se estabilice y anota su color</span>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Control compacto de una jeringa: muestra temp real y permite reubicarla ── */
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
  const tempColor = jeringa.temp > 50 ? '#f97316' : jeringa.temp < 10 ? '#38bdf8' : '#e2e8f0';

  return (
    <div className="flex flex-col items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">#{jeringa.id}</span>
        <span className="text-xs font-black font-mono tracking-tighter" style={{ color: tempColor }}>
          {jeringa.temp.toFixed(1)}°C
        </span>
        {/* Lo que se ve a través del vidrio: el tono real de la mezcla */}
        <span aria-hidden className="w-5 h-5 rounded-md border border-white/30" style={{ background: tonoMezclaNO2(jeringa.temp) }} />
      </div>
      <div className="flex gap-1.5">
        {stations.map(st => (
          <button
            key={st.id}
            onClick={() => {
              setLoc(jeringa.id, st.id as 'mesa' | 'caliente' | 'hielo');
              audio?.playPop();
              audio?.playNotification();
            }}
            title={st.name}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border hover:scale-110 active:scale-90 ${
              jeringa.ubicacion === st.id
                ? 'bg-white/15 border-white/40 shadow-lg'
                : 'bg-white/5 border-white/5 opacity-50 hover:opacity-100'
            }`}
            style={jeringa.ubicacion === st.id ? { boxShadow: `0 0 18px ${st.color}55` } : undefined}
          >
            {st.icon}
          </button>
        ))}
      </div>
      <select
        aria-label={`Color observado en la jeringa ${jeringa.id}`}
        value={observacion}
        onChange={e => setObs(jeringa.id, e.target.value)}
        className="w-44 bg-white/5 border border-white/10 rounded-xl px-2 py-1.5 text-white text-[10px] font-bold outline-none focus:border-orange-400/60 transition-all"
      >
        <option value="" className="bg-slate-900">Color observado…</option>
        {COLORES_NO2.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.etiqueta}</option>)}
      </select>
    </div>
  );
}
