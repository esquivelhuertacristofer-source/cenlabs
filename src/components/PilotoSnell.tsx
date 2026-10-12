"use client";

import React, { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, RefreshCcw, Info, CheckCircle2 } from 'lucide-react';
import { ANGULO_MIN_M7, ANGULO_MAX_M7 } from '@/domain/matematicas';
import Snell3DScene from './simuladores/mat07/Snell3DScene';

const LASER_OPTIONS: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'cyan',   label: 'CYAN',   color: '#22d3ee', bg: 'bg-cyan-400' },
  { id: 'red',    label: 'ROJO',   color: '#ef4444', bg: 'bg-red-500' },
  { id: 'green',  label: 'VERDE',  color: '#22c55e', bg: 'bg-green-500' },
  { id: 'violet', label: 'UV',     color: '#8b5cf6', bg: 'bg-violet-500' },
  { id: 'white',  label: 'PRISMA', color: '#ffffff', bg: 'bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-cyan-400 to-violet-500' },
];

/**
 * MAT-07 · Ley de Snell. El alumno elige θ₁ con el slider, lee θ₂ en el
 * transportador y despeja n₂ = n₁·sen θ₁ / sen θ₂. Ningún panel muestra n₂ ni
 * una magnitud de la que salga directo (como v₂ = c/n₂).
 */
export default function PilotoSnell({ onValidate }: { onValidate?: () => void }) {
  const { optica7, setAnguloM7, setUserInputM7, audio, setAsistente } = useSimuladorStore(
    useShallow((s) => ({
      optica7: s.optica7, setAnguloM7: s.setAnguloM7, setUserInputM7: s.setUserInputM7,
      audio: s.audio, setAsistente: s.setAsistente,
    })),
  );
  const { n1, n2, n2Misterio, anguloIncidencia, status, userInputN2 } = optica7;
  // Láser monocromático por defecto: con luz blanca no hay un único θ₂ que medir.
  const [laserColor, setLaserColor] = useState<'cyan' | 'red' | 'green' | 'violet' | 'white'>('green');

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de óptica. Ajusta el ángulo de incidencia, mide el de refracción (ambos desde la normal) y despeja n₂ con la Ley de Snell.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-full bg-[#0c1222] relative overflow-hidden flex flex-col font-sans text-white">

      {/* ── ESCENA 3D (FULL SCREEN) ── */}
      <div className="absolute inset-0 z-0">
        <Snell3DScene
          n1={n1} n2={n2} n2Misterio={n2Misterio}
          anguloIncidencia={anguloIncidencia}
          status={status}
          laserColor={laserColor}
        />
      </div>

      {/* ── OVERLAY ── */}
      <div className="relative z-10 p-6 flex flex-col h-full pointer-events-none">

        {/* TOP BAR */}
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Zap className="text-cyan-400" size={18} />
                </div>
                <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Óptica de Precisión</h2>
                    <div className="text-[9px] font-bold text-cyan-400/70 uppercase tracking-widest">
                        Ley de Snell • MAT-07
                    </div>
                </div>
            </div>

            <div className="pointer-events-auto">
                <div className="bg-black/50 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl flex items-center gap-6 shadow-2xl">
                    <div className="text-right">
                        <span className="text-[8px] font-black text-slate-500 uppercase block tracking-widest">n₁</span>
                        <span className="text-xl font-black text-white tabular-nums">{n1.toFixed(3)}</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="text-right">
                        <span className="text-[8px] font-black text-slate-500 uppercase block tracking-widest">n₂</span>
                        <span className="text-xl font-black text-cyan-400 tabular-nums">
                            {n2 === 'misterio' ? '???' : (n2 as number).toFixed(3)}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="mt-auto flex justify-between items-end gap-3 pointer-events-auto">
            {/* Fórmula */}
            <div className="bg-black/40 backdrop-blur-md border border-white/5 px-5 py-3 rounded-2xl">
                <div className="flex items-center gap-2 mb-1">
                    <Info size={12} className="text-cyan-400/60" />
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Ley de Snell</span>
                </div>
                <p className="text-sm font-black text-cyan-300/80 font-mono">
                    n₁·sin(θ₁) = n₂·sin(θ₂)
                </p>
            </div>

            {/* Selector de Láser + Controles */}
            <div className="flex flex-wrap items-center justify-end gap-3 min-w-0">
                {/* Selector de color de láser */}
                <div className="bg-black/50 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-2xl flex items-center gap-1.5">
                    {LASER_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setLaserColor(opt.id as any); audio?.playPop(); }}
                        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          laserColor === opt.id
                            ? 'ring-2 ring-white/60 scale-110'
                            : 'opacity-50 hover:opacity-80'
                        }`}
                        title={opt.label}
                      >
                        <div className={`w-5 h-5 rounded-md ${opt.bg}`} />
                      </button>
                    ))}
                </div>

                {/* Ángulo de incidencia θ₁ (desde la normal) */}
                <div className="bg-black/50 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl flex flex-col gap-1 w-48">
                    <div className="flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ángulo θ₁</span>
                        <span className="text-xs font-black font-mono text-cyan-300">{anguloIncidencia}°</span>
                    </div>
                    <input
                        type="range" min={ANGULO_MIN_M7} max={ANGULO_MAX_M7} step={1} value={anguloIncidencia}
                        onChange={e => setAnguloM7(parseInt(e.target.value))}
                        className="w-full accent-cyan-400"
                    />
                </div>

                <button
                    onClick={() => { setAnguloM7(45); setUserInputM7(''); audio?.playPop(); }}
                    title="Reiniciar ángulo y respuesta (el medio no cambia)"
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all group"
                >
                    <RefreshCcw size={18} className="group-active:rotate-180 transition-transform duration-500" />
                </button>

                {/* Entrada de índice n2 */}
                <div className="bg-black/50 backdrop-blur-xl border border-white/10 px-4 py-3 rounded-2xl flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Tu valor n₂</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={userInputN2}
                            onChange={e => setUserInputM7(e.target.value)}
                            placeholder="n₂"
                            className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm font-black font-mono text-white outline-none focus:border-cyan-500 transition-all"
                        />
                    </div>
                    <button
                        onClick={() => onValidate?.()}
                        className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${
                            status === 'success'
                                ? 'bg-emerald-600 border-emerald-400 text-white'
                                : 'bg-cyan-600 border-cyan-500 text-white hover:bg-cyan-500'
                        }`}
                    >
                        {status === 'success' ? 'Calibrado' : 'Calibrar / Verificar'}
                    </button>
                    {status === 'error' && (
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Valor incorrecto</span>
                    )}
                    {status === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}
