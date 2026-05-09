"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Crosshair, Settings2, Activity, Target, 
  RefreshCcw, ShieldCheck, Zap, Bot,
  Calculator, MoveHorizontal
} from 'lucide-react';
import Sistemas2x23DScene from './simuladores/mat02/Sistemas2x23DScene';

export default function PilotoSistemas2x2() {
  const router = useRouter();
  const { sistemas2x2, setSistemasCoefsM2, validarM2, generarSemillaM2, resetM2, audio, setAsistente, pasoActual, setPasoActual, bitacoraData } = useSimuladorStore();
  const { m1, b1, m2, b2, target, status } = sistemas2x2;

  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido a la Central de Triangulación. Tu misión es interceptar el objetivo ajustando las pendientes de los haces láser Alpha y Omega.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  const isParallel = Math.abs(m1 - m2) < 0.001;
  const xi = !isParallel ? (b2 - b1) / (m1 - m2) : null;
  const yi = !isParallel ? m1 * xi! + b1 : null;

  const isTargetLocked = xi !== null && Math.abs(xi - target.x) < 0.15 && Math.abs(yi! - target.y) < 0.15;

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (m1 !== 1 || b1 !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if ((m2 !== -1 || b2 !== 4) && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [m1, b1, m2, b2, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">
      
      {/* ── GIANT TELEMETRY BACKGROUND ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
        <span className="text-[14rem] font-black font-mono text-cyan-500 select-none italic">
          {xi !== null ? `${xi.toFixed(1)},${yi!.toFixed(1)}` : 'PARALLEL'}
        </span>
      </div>

      {/* ── CHECKLIST HUD (DIAMOND STANDARD) ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-cyan-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(34,197,94,0.1)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <Crosshair className="text-cyan-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-cyan-300 uppercase tracking-widest leading-none">Protocolo de Triangulación</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MAT-02 • Satelital Sync</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Láser Alpha" },
                { step: 2, label: "Láser Omega" },
                { step: 3, label: "Sincronía" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
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
        <Sistemas2x23DScene 
          m1={m1} b1={b1} m2={m2} b2={b2} 
          target={target} 
          escenario={sistemas2x2.escenario} 
        />
      </div>

      {/* ── HUD SUPERIOR: TELEMETRÍA ── */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none mt-20">
        <div className="flex justify-between items-start">
            <div className="flex gap-4 pointer-events-auto">
                <HUDCard label="Haz Alpha (L1)" value={`y = ${m1}x ${b1 >= 0 ? '+' : ''}${b1}`} icon={<Zap size={14} />} color="#06b6d4" />
                <HUDCard label="Haz Omega (L2)" value={`y = ${m2}x ${b2 >= 0 ? '+' : ''}${b2}`} icon={<Zap size={14} />} color="#f43f5e" />
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl pointer-events-auto">
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 italic">Target Fix</span>
                    <div className="text-2xl font-black text-white italic tracking-tighter">
                       ({target.x}, {target.y})
                    </div>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 italic">Current Intersection</span>
                    <div className={`text-2xl font-black italic tracking-tighter ${isTargetLocked ? 'text-emerald-400' : 'text-rose-500'}`}>
                       {xi !== null ? `(${xi.toFixed(1)}, ${yi!.toFixed(1)})` : 'PARA-LINK'}
                    </div>
                </div>
            </div>
        </div>

        {/* Notificación de Bloqueo */}
        <AnimatePresence>
            {isTargetLocked && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="relative flex flex-col items-center">
                        <Crosshair size={240} className="text-emerald-500/20 animate-spin-slow" strokeWidth={0.5} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-4">Target Locked</span>
                            <div className="px-8 py-3 bg-emerald-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl animate-pulse">
                                Sincronía Crítica
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Dock de Control Inferior */}
        <div className="mt-auto flex justify-between items-end gap-10 pointer-events-auto">
            <div className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] flex-1 shadow-2xl grid grid-cols-2 gap-16">
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-5 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Haz Láser Alpha (L1)</span>
                    </div>
                    <div className="space-y-6">
                        <SimSlider label="Pendiente (m1)" value={m1} min={-5} max={5} step={0.1} color="cyan" onChange={(v: any) => { setSistemasCoefsM2(v, b1, m2, b2); audio?.playPop(); }} />
                        <SimSlider label="Ordenada (b1)" value={b1} min={-10} max={10} step={0.5} color="cyan" onChange={(v: any) => { setSistemasCoefsM2(m1, v, m2, b2); audio?.playPop(); }} />
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-5 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Haz Láser Omega (L2)</span>
                    </div>
                    <div className="space-y-6">
                        <SimSlider label="Pendiente (m2)" value={m2} min={-5} max={5} step={0.1} color="rose" onChange={(v: any) => { setSistemasCoefsM2(m1, b1, v, b2); audio?.playPop(); }} />
                        <SimSlider label="Ordenada (b2)" value={b2} min={-10} max={10} step={0.5} color="rose" onChange={(v: any) => { setSistemasCoefsM2(m1, b1, m2, v); audio?.playPop(); }} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <button onClick={() => { resetM2(); generarSemillaM2(); audio?.playPop(); }} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-xl">
                    <RefreshCcw size={24} />
                </button>
                <button 
                  onClick={() => { const ok = validarM2(); if (ok) audio?.playSuccess(); else audio?.playError(); }}
                  className={`w-20 h-20 rounded-3xl border flex items-center justify-center transition-all shadow-2xl ${status === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-cyan-600 border-cyan-500 text-white hover:scale-105 active:scale-95'}`}
                >
                    {status === 'success' ? <ShieldCheck size={32} /> : <Target size={32} />}
                </button>
            </div>
        </div>
      </div>

      {/* ÉXITO FINAL */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-cyan-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(6,182,212,0.15)]">
                <Crosshair size={100} className="text-cyan-500 mx-auto mb-8" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Triangulación Exitosa</h3>
                <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">Has localizado el objetivo mediante un sistema de ecuaciones lineales perfecto. La sincronía de los haces ha sido validada bajo el estándar **Diamond State**.</p>
                <button onClick={() => router.push('/alumno/laboratorio/matematicas')} className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-cyan-600/30">Cerrar Informe de Sincronía</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

function SimSlider({ label, value, min, max, step, color, onChange }: any) {
    const accent = color === 'cyan' ? 'accent-cyan-400' : 'accent-rose-400';
    const text = color === 'cyan' ? 'text-cyan-400' : 'text-rose-400';
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <span className={`text-[12px] font-black ${text} font-mono bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 shadow-inner`}>{value.toFixed(1)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className={`w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer ${accent}`} />
        </div>
    );
}
