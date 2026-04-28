"use client";

import React, { useEffect, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, RefreshCcw, Info } from 'lucide-react';
import Snell3DScene from './simuladores/mat07/Snell3DScene';

const LASER_OPTIONS: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'cyan',   label: 'CYAN',   color: '#22d3ee', bg: 'bg-cyan-400' },
  { id: 'red',    label: 'ROJO',   color: '#ef4444', bg: 'bg-red-500' },
  { id: 'green',  label: 'VERDE',  color: '#22c55e', bg: 'bg-green-500' },
  { id: 'violet', label: 'UV',     color: '#8b5cf6', bg: 'bg-violet-500' },
  { id: 'white',  label: 'PRISMA', color: '#ffffff', bg: 'bg-gradient-to-r from-red-500 via-yellow-400 via-green-500 via-cyan-400 to-violet-500' },
];

export default function PilotoSnell() {
  const { optica7, generarSemillaM7, resetM7, audio, setAsistente } = useSimuladorStore();
  const { n1, n2, n2Misterio, anguloIncidencia, status } = optica7;
  const [laserColor, setLaserColor] = useState<'cyan' | 'red' | 'green' | 'violet' | 'white'>('white');

  useEffect(() => {
    generarSemillaM7();
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de óptica avanzada. Tu misión es analizar la refracción del haz láser al cruzar entre medios. Calcula el índice n2 usando la Ley de Snell.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  useEffect(() => {
    if (status === 'success') {
      audio?.playSuccess();
      audio?.playNotification();
    }
  }, [status, audio]);

  const realN2 = n2 === 'misterio' ? n2Misterio : (n2 as number);
  const velocityV2 = 1 / realN2;

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
        <div className="mt-auto flex justify-between items-end pointer-events-auto">
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
            <div className="flex items-center gap-3">
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

                <button 
                    onClick={() => { resetM7(); generarSemillaM7(); audio?.playPop(); }}
                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:bg-white/10 hover:text-white transition-all group"
                >
                    <RefreshCcw size={18} className="group-active:rotate-180 transition-transform duration-500" />
                </button>

                <div className="bg-black/50 backdrop-blur-xl border border-white/5 px-5 py-3 rounded-2xl flex items-center gap-6">
                    <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">V₂</span>
                        <span className="text-sm font-black text-white font-mono tabular-nums">{velocityV2.toFixed(4)} c</span>
                    </div>
                    <div className="h-8 w-px bg-white/5" />
                    <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Estado</span>
                        <span className={`text-[10px] font-black tracking-widest uppercase ${status === 'success' ? 'text-emerald-400' : 'text-cyan-400 animate-pulse'}`}>
                            {status === 'success' ? 'CALIBRADO' : 'ANALIZANDO'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
