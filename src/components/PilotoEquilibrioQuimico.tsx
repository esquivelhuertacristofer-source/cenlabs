"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useRouter } from 'next/navigation';
import {
  Snowflake, Flame, MousePointer2, RotateCcw,
  Info, Activity, FlaskConical
} from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import EquilibrioQuimico3DScene from './simuladores/qmi08/EquilibrioQuimico3DScene';

interface Props {
  isWorktableDark?: boolean;
}

export default function PilotoEquilibrioQuimico({ isWorktableDark = true }: Props) {
  const router = useRouter();
  const { equilibrio, setUbicacionJeringa, updateTemperaturaP8, resetP8, generarSemillaP8, validarP8 } = useSimuladorStore();

  const [mounted, setMounted] = useState(false);
  const [d1, setD1] = useState('');
  const [d2, setD2] = useState('');
  const [d3, setD3] = useState('');

  // Motor de tiempo para inercia térmica
  useEffect(() => {
    setMounted(true);
    if (equilibrio.jeringas.length === 0) generarSemillaP8();

    const interval = setInterval(() => {
      updateTemperaturaP8(0.5);
    }, 500);
    return () => {
      clearInterval(interval);
    };
  }, [updateTemperaturaP8]);

  const stations = [
    { id: 'hielo', name: 'Baño de Hielo', temp: 0, icon: <Snowflake size={22} className="text-blue-400" />, color: '#3b82f6' },
    { id: 'mesa', name: 'Temp. Ambiente', temp: 20, icon: <MousePointer2 size={22} className="text-slate-400" />, color: '#94a3b8' },
    { id: 'caliente', name: 'Plancha Caliente', temp: 80, icon: <Flame size={22} className="text-orange-500" />, color: '#f59e0b' },
  ] as const;

  // Temperatura media real de las jeringas → conduce el desplazamiento del reactor 3D
  const avgTemp = equilibrio.jeringas.length > 0
    ? equilibrio.jeringas.reduce((s, j) => s + j.temp, 0) / equilibrio.jeringas.length
    : 20;

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full bg-[#04060f] overflow-hidden flex flex-col font-['Outfit'] text-white">

      {/* ── ESCENA 3D — REACTOR DE EQUILIBRIO (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <EquilibrioQuimico3DScene temp={avgTemp} />
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

          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl border transition-all ${equilibrio.jeringas.length > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Reactivos</div>
              <div className={`text-sm font-black italic ${equilibrio.jeringas.length > 0 ? 'text-orange-400' : 'text-white/20'}`}>{equilibrio.jeringas.length > 0 ? 'ESTABILIZADOS' : 'PENDIENTE'}</div>
            </div>
            <div className={`p-4 rounded-2xl border transition-all ${equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Energía</div>
              <div className={`text-sm font-black italic ${equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? 'text-red-400' : 'text-white/20'}`}>{equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? 'ABSORCIÓN' : 'AMBIENTE'}</div>
            </div>
            <div className={`p-4 rounded-2xl border transition-all ${equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Exotérmico</div>
              <div className={`text-sm font-black italic ${equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? 'text-blue-400' : 'text-white/20'}`}>{equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? 'LIBERACIÓN' : 'INACTIVO'}</div>
            </div>
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

        <button onClick={resetP8} className="h-20 w-20 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-white/10 transition-all pointer-events-auto group">
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
              />
            ))}
          </div>
        </div>

        {/* ── PANEL DE OBSERVACIONES + VALIDACIÓN ── */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-5 bg-black/60 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl pointer-events-auto">
          {[
            { label: 'Hielo', val: d1, set: setD1 },
            { label: 'Caliente', val: d2, set: setD2 },
            { label: 'Ambiente', val: d3, set: setD3 },
          ].map(({ label, val, set }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</span>
              <select
                value={val}
                onChange={e => set(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs font-bold outline-none focus:border-orange-400/60 transition-all"
              >
                <option value="">Seleccionar...</option>
                <option value="transparente">Transparente (N₂O₄)</option>
                <option value="incoloro">Incoloro</option>
                <option value="cafe">Café (NO₂)</option>
              </select>
            </div>
          ))}
          <button
            onClick={() => {
              const ok = validarP8(d1, d2, d3);
              if (ok) { audio?.playSuccess(); } else { audio?.playError(); }
            }}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-orange-500/30"
          >
            Verificar Equilibrio
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
            <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Café = NO₂ (calor desplaza →)</span>
          </div>
        </div>
      </div>

      {equilibrio.status === 'success' && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-xl pointer-events-auto">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0a1a0a] border border-orange-500/40 rounded-[3rem] p-12 max-w-md text-center shadow-[0_40px_100px_rgba(245,158,11,0.2)]"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-[1.6rem] bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
              <Activity size={36} className="text-orange-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">¡Equilibrio Comprendido!</h2>
            <p className="text-sm text-slate-300 mb-8">Identificaste correctamente el comportamiento del sistema N₂O₄ ⇌ 2NO₂ según Le Châtelier.</p>
            <button onClick={resetP8} className="px-10 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Nuevo Experimento
            </button>
            <button onClick={() => router.push('/hub')} className="w-full mt-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Cerrar Laboratorio
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

/* ── Control compacto de una jeringa: muestra temp real y permite reubicarla ── */
function SyringeControl({
  jeringa,
  stations,
  setLoc,
}: {
  jeringa: { id: number; ubicacion: 'mesa' | 'caliente' | 'hielo'; temp: number };
  stations: readonly { id: string; name: string; temp: number; icon: React.ReactNode; color: string }[];
  setLoc: (id: number, loc: 'mesa' | 'caliente' | 'hielo') => void;
}) {
  const tempColor = jeringa.temp > 50 ? '#f97316' : jeringa.temp < 10 ? '#38bdf8' : '#e2e8f0';

  return (
    <div className="flex flex-col items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">#{jeringa.id}</span>
        <span className="text-xs font-black font-mono tracking-tighter" style={{ color: tempColor }}>
          {jeringa.temp.toFixed(1)}°C
        </span>
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
    </div>
  );
}
