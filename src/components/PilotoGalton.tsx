"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Activity, RefreshCcw, BarChart3, Zap 
} from 'lucide-react';
import Galton3DScene from './simuladores/mat10/Galton3DScene';

export default function PilotoGalton() {
  const { galton10, resetM10, setGalton10, audio, setAsistente, generarSemillaM10 } = useSimuladorStore();
  const { probabilidad, contenedores } = galton10;

  const totalBolitas = contenedores.reduce((a, b) => a + b, 0);
  const n_rows = 10;
  const mu = n_rows * probabilidad;
  const sigma = Math.sqrt(n_rows * probabilidad * (1 - probabilidad));

  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido a la Máquina de Galton. Observa cómo el azar individual se convierte en una distribución normal colectiva.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#f1f5f9] relative overflow-hidden flex flex-col font-['Outfit']">
      
      {/* ── 3D SCENE (full background) ── */}
      <div className="absolute inset-0 z-0">
        <Galton3DScene probabilidad={probabilidad} contenedores={contenedores} />
      </div>

      {/* ── OVERLAY (corners only — NO center clutter) ── */}
      <div className="relative z-10 p-5 flex flex-col h-full pointer-events-none">
        
        {/* TOP ROW */}
        <div className="flex justify-between items-start">
          {/* Left: Title + key metrics */}
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-md px-5 py-3 rounded-2xl flex items-center gap-4">
              <div className="p-2 bg-amber-50 rounded-xl">
                <BarChart3 className="text-amber-500" size={16} />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Máquina de Galton</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">MAT-10 • Distribución Binomial</p>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="pointer-events-auto flex gap-2">
            <MetricCard label="n" value={totalBolitas.toString()} icon={<Activity size={12} />} color="#10b981" />
            <MetricCard label="p" value={`${(probabilidad * 100).toFixed(0)}%`} icon={<Zap size={12} />} color="#f59e0b" />
            <MetricCard label="μ" value={mu.toFixed(1)} icon={<span className="text-[10px] font-black">μ</span>} color="#6366f1" />
            <MetricCard label="σ" value={sigma.toFixed(2)} icon={<span className="text-[10px] font-black">σ</span>} color="#ec4899" />
          </div>
        </div>

        {/* BOTTOM: Probability slider + Reset */}
        <div className="mt-auto pointer-events-auto">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-md px-6 py-4 rounded-2xl flex items-center gap-6 max-w-[600px]">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sesgo de Probabilidad</span>
                <span className="text-xs font-black text-amber-600 font-mono bg-amber-50 px-2 py-0.5 rounded-md">
                  p = {probabilidad.toFixed(2)}
                </span>
              </div>
              <input 
                type="range" min="0.1" max="0.9" step="0.05" value={probabilidad} 
                onChange={e => { setGalton10({ ...galton10, probabilidad: parseFloat(e.target.value) }); audio?.playPop(); }}
                className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-amber-500
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500 [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-md" 
              />
            </div>
            <button 
              onClick={() => { resetM10(); audio?.playPop(); }} 
              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-all active:scale-95"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-md px-4 py-2.5 rounded-xl flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}12`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <span className="block text-sm font-black text-slate-800 tabular-nums font-mono leading-none">{value}</span>
      </div>
    </div>
  );
}
