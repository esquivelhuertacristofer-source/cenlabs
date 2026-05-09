"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Target, RefreshCcw, ShieldCheck, 
  Zap, Activity, Compass, Bot, 
  Move, RotateCw, Maximize
} from 'lucide-react';
import Transformaciones3DScene from './simuladores/mat06/Transformaciones3DScene';

export default function PilotoTransformaciones() {
  const router = useRouter();
  const { geometria6, generarSemillaM6, resetM6, setTransformM6, validarM6, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore();
  const { tx, ty, rotacion, escala, target, status } = geometria6;

  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Centro de Control Vectorial. Tu misión es alinear la nave con las coordenadas objetivo usando traslaciones, rotaciones y escalas.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tx === 0 && ty === 0 && rotacion === 0 && escala === 1) {
      generarSemillaM6();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTargetLocked = Math.abs(tx - target.tx) < 0.2 && 
                         Math.abs(ty - target.ty) < 0.2 && 
                         Math.abs(rotacion - target.rotacion) < 5 && 
                         Math.abs(escala - target.escala) < 0.1;

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (tx !== 0 || ty !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (rotacion !== 0 && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [tx, ty, rotacion, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">
      
      {/* ── GIANT TELEMETRY BACKGROUND ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
        <span className="text-[14rem] font-black font-mono text-amber-500 select-none italic">
          {tx.toFixed(1)},{ty.toFixed(1)}
        </span>
      </div>

      {/* ── CHECKLIST HUD (DIAMOND STANDARD) ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-amber-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(245,158,11,0.1)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Rocket className="text-amber-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-amber-300 uppercase tracking-widest leading-none">Navegación Vectorial</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MAT-06 • Transformaciones</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Traslación" },
                { step: 2, label: "Rotación" },
                { step: 3, label: "Sincronía" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-amber-600 border-amber-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
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
        <Transformaciones3DScene tx={tx} ty={ty} rotacion={rotacion} escala={escala} target={target} status={status} />
      </div>

      {/* ── HUD SUPERIOR: TELEMETRÍA ── */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none mt-20">
        <div className="flex justify-between items-start">
            <div className="flex gap-4 pointer-events-auto">
                <HUDCard label="Vector Traslación" value={`T(${tx.toFixed(1)}, ${ty.toFixed(1)})`} icon={<Move size={14} />} color="#f59e0b" />
                <HUDCard label="Rotación / Escala" value={`${rotacion}° | x${escala.toFixed(1)}`} icon={<RotateCw size={14} />} color="#10b981" />
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl pointer-events-auto">
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 italic">Target Vector</span>
                    <div className="text-xl font-black text-white italic tracking-tighter">
                       T({target.tx}, {target.ty}) R({target.rotacion}°) S({target.escala})
                    </div>
                </div>
            </div>
        </div>

        {/* Notificación de Bloqueo */}
        <AnimatePresence>
            {isTargetLocked && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="relative flex flex-col items-center">
                        <Compass size={240} className="text-emerald-500/20 animate-spin-slow" strokeWidth={0.5} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-4">Vector Match</span>
                            <div className="px-8 py-3 bg-emerald-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl animate-pulse">
                                Sincronía Vectorial
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Dock de Control Inferior */}
        <div className="mt-auto flex justify-between items-end gap-10 pointer-events-auto">
            <div className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] flex-1 shadow-2xl grid grid-cols-2 gap-16">
                <div className="space-y-6">
                    <SimSlider label="Traslación X" value={tx} min={-5} max={5} step={0.1} color="amber" onChange={(v: any) => { setTransformM6(v, ty, rotacion, escala); audio?.playPop(); }} />
                    <SimSlider label="Traslación Y" value={ty} min={-5} max={5} step={0.1} color="amber" onChange={(v: any) => { setTransformM6(tx, v, rotacion, escala); audio?.playPop(); }} />
                </div>
                <div className="space-y-6">
                    <SimSlider label="Rotación (°)" value={rotacion} min={0} max={360} step={5} color="emerald" onChange={(v: any) => { setTransformM6(tx, ty, v, escala); audio?.playPop(); }} />
                    <SimSlider label="Escala" value={escala} min={0.5} max={2} step={0.1} color="emerald" onChange={(v: any) => { setTransformM6(tx, ty, rotacion, v); audio?.playPop(); }} />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <button onClick={() => { resetM6(); generarSemillaM6(); audio?.playPop(); }} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-xl">
                    <RefreshCcw size={24} />
                </button>
                <button 
                  onClick={() => { const ok = validarM6(); if (ok) audio?.playSuccess(); else audio?.playError(); }}
                  className={`w-20 h-20 rounded-3xl border flex items-center justify-center transition-all shadow-2xl ${status === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-amber-600 border-amber-500 text-white hover:scale-105 active:scale-95'}`}
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
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-amber-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(245,158,11,0.15)]">
                <Rocket size={100} className="text-amber-500 mx-auto mb-8" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Misión Exitosa</h3>
                <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">Has alineado los vectores de la nave con precisión absoluta. El análisis de transformaciones lineales ha sido validado bajo el estándar **Diamond State**.</p>
                <button onClick={() => router.push('/alumno/laboratorio/matematicas')} className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-amber-600/30">Cerrar Informe de Vuelo</button>
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
    const accent = color === 'amber' ? 'accent-amber-500' : 'accent-emerald-500';
    const text = color === 'amber' ? 'text-amber-400' : 'text-emerald-400';
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
