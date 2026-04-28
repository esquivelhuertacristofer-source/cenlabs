"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Target, RefreshCcw, ShieldCheck, 
  Zap, Calculator, Layers, TrendingUp,
  Bot, Binary, FunctionSquare, Maximize
} from 'lucide-react';
import Riemann3DScene from './simuladores/mat09/Riemann3DScene';

export default function PilotoRiemann() {
  const router = useRouter();
  const { integral9, setIntegralM9, setAnimandoM9, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore();
  const { n, metodo, animandoLimite, status } = integral9;

  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Analizador de Riemann. Observa cómo el área bajo la curva se aproxima al valor real de la integral a medida que incrementamos el número de rectángulos (n).",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // Animación de Límite
  useEffect(() => {
    let interval: any;
    if (animandoLimite) {
      interval = setInterval(() => {
        setIntegralM9(Math.min(100, n + 1), metodo);
        if (n >= 100) setAnimandoM9(false);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [animandoLimite, n, metodo, setIntegralM9, setAnimandoM9]);

  const dx = 10 / n;

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (n > 5) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (animandoLimite && pasoActual < 2) setPasoActual(2);
    if (n >= 80 && pasoActual < 3) setPasoActual(3);
  }, [n, animandoLimite, pasoActual, setPasoActual]);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">
      
      {/* ── GIANT TELEMETRY BACKGROUND ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
        <span className="text-[14rem] font-black font-mono text-emerald-500 select-none italic">
          n={n}
        </span>
      </div>

      {/* ── CHECKLIST HUD (DIAMOND STANDARD) ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-emerald-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.1)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Layers className="text-emerald-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-emerald-300 uppercase tracking-widest leading-none">Sumas de Riemann</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MAT-09 • Límite Integral</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Muestreo" },
                { step: 2, label: "Límite" },
                { step: 3, label: "Precisión" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                   {pasoActual > s.step ? <ShieldCheck size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                   <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ESCENA 3D (BACKGROUND) ── */}
      <div className="absolute inset-0 z-0">
        <Riemann3DScene n={n} metodo={metodo} animandoLimite={animandoLimite} />
      </div>

      {/* ── HUD SUPERIOR: TELEMETRÍA ── */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none mt-20">
        <div className="flex justify-between items-start">
            <div className="flex gap-4 pointer-events-auto">
                <HUDCard label="Ancho de Intervalo (Δx)" value={dx.toFixed(4)} icon={<MoveHorizontal size={14} />} color="#10b981" />
                <HUDCard label="Número de Rectángulos (n)" value={n.toString()} icon={<Activity size={14} />} color="#06b6d4" />
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl pointer-events-auto">
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 italic">Precisión de Integración</span>
                    <div className={`text-2xl font-black italic tracking-tighter ${n >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                       {n >= 80 ? 'HIGH_FIDELITY' : n >= 40 ? 'MEDIUM_RES' : 'LOW_RES'}
                    </div>
                </div>
            </div>
        </div>

        {/* Notificación de Límite */}
        <AnimatePresence>
            {animandoLimite && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="relative flex flex-col items-center">
                        <TrendingUp size={240} className="text-emerald-500/20 animate-pulse" strokeWidth={0.5} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-4">n → ∞</span>
                            <div className="px-8 py-3 bg-emerald-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl animate-bounce">
                                Límite en Proceso
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Dock de Control Inferior */}
        <div className="mt-auto flex justify-between items-end gap-10 pointer-events-auto">
            <div className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] flex-1 shadow-2xl flex items-center justify-between gap-16">
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Densidad de Muestreo (n)</span>
                        <span className="text-[12px] font-black text-emerald-400 font-mono bg-white/5 px-2 py-0.5 rounded-lg">{n} Rectángulos</span>
                    </div>
                    <input 
                      type="range" min="4" max="100" step="1" value={n} 
                      onChange={e => { setIntegralM9(parseInt(e.target.value), metodo); audio?.playPop(); }}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500" 
                    />
                </div>

                <div className="flex items-center gap-6 border-l border-white/10 pl-16">
                    <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase text-center">Punto de Evaluación</span>
                        <div className="flex gap-2">
                            {['izquierda', 'punto_medio', 'derecha'].map(m => (
                                <button key={m} onClick={() => { setIntegralM9(n, m as any); audio?.playPop(); }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${metodo === m ? 'bg-emerald-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                                    {m.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => { setAnimandoM9(!animandoLimite); audio?.playPop(); }} className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${animandoLimite ? 'bg-emerald-600 text-white' : 'bg-white/5 border border-white/10 text-slate-500'}`}>
                        <TrendingUp size={24} />
                    </button>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}

function HUDCard({ label, value, icon, color }: any) {
  return (
    <div className={`px-8 py-5 rounded-[2rem] border border-white/10 flex items-center gap-5 transition-all bg-[#0A1121]/80 backdrop-blur-md shadow-2xl`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</span>
        <span className="block text-xl font-black text-white tracking-tighter leading-none italic font-mono">{value}</span>
      </div>
    </div>
  );
}

function MoveHorizontal(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 8 22 12 18 16" />
      <polyline points="6 8 2 12 6 16" />
      <line x1="2" x2="22" y1="12" y2="12" />
    </svg>
  )
}
