"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion } from 'framer-motion';
import {
  Activity, ShieldCheck,
  Gauge, Play, Rocket, CheckCircle2,
} from 'lucide-react';
import Derivadas3DScene from './simuladores/mat08/Derivadas3DScene';
import { posicionM8, velocidadM8, T_MAX_M8 } from '@/domain/matematicas';

/**
 * MAT-08 · La derivada. Telemetría de un cohete: s(t) = −k·t³ + m·t² (dato).
 * La recta tangente de la escena tiene pendiente v(t) = s'(t). El reto es marcar
 * el instante de VELOCIDAD MÁXIMA: donde v'(t) = a(t) = 0 (inflexión de s).
 * El instante marcado se escribe en el store (`derivada8.xActual`), que es lo
 * que lee el validador; la animación corre en estado local.
 */
export default function PilotoDerivadas({ onValidate }: { onValidate?: () => void }) {
  const { derivada8, setXActualM8, setAsistente } = useSimuladorStore(
    useShallow((s) => ({ derivada8: s.derivada8, setXActualM8: s.setXActualM8, setAsistente: s.setAsistente })),
  );
  const { status, k, m, xActual } = derivada8;
  const cohete = { k, m };

  const [t, setT] = useState(xActual);
  const tRef = useRef(xActual);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al Centro de Control. Encuentra el instante de MÁXIMA VELOCIDAD del cohete: la velocidad es la derivada de la posición, y es máxima donde su propia derivada se anula.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el store cambia desde fuera (reinicio, bitácora), el cursor lo sigue.
  useEffect(() => { if (!isPlaying) { tRef.current = xActual; setT(xActual); } }, [xActual, isPlaying]);

  // -- ANIMACIÓN (local, requestAnimationFrame; 1 s de vuelo por segundo real) --
  useEffect(() => {
    if (!isPlaying) return;
    let raf = 0, prev = performance.now();
    const paso = (now: number) => {
      let nt = tRef.current + (now - prev) / 1000;
      prev = now;
      if (nt > T_MAX_M8) nt = 0;
      tRef.current = nt;
      setT(nt);
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  const marcar = (nt: number) => { tRef.current = nt; setT(nt); setXActualM8(Math.round(nt * 100) / 100); };
  const togglePlay = () => {
    if (isPlaying) { setIsPlaying(false); setXActualM8(Math.round(tRef.current * 100) / 100); }
    else setIsPlaying(true);
  };
  const validar = () => {
    setIsPlaying(false);
    setXActualM8(Math.round(tRef.current * 100) / 100);
    onValidate?.();
  };

  const currentS = posicionM8(cohete, t);
  const currentV = velocidadM8(cohete, t);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#03040a] relative overflow-hidden flex flex-col font-['Outfit'] text-white">

      {/* ── ESCENA 3D — DERIVADA COMO LÍMITE (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <Derivadas3DScene t={t} coef={cohete} />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#03040a]/75 via-transparent to-[#03040a]/85" />

      {/* TOP HUD */}
      <div className="absolute top-10 left-0 right-0 z-50 px-10 flex justify-between items-start pointer-events-none">
        <div className="flex gap-6">
           <HUDCard label="Posición s(t)" value={`${currentS.toFixed(2)} m`} icon={<Rocket size={16} />} color="#22d3ee" />
           <HUDCard label="Velocidad v(t) = s'(t)" value={`${currentV.toFixed(2)} m/s`} icon={<Gauge size={16} />} color="#3b82f6" />
        </div>

        <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl">
           <div className="text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Trayectoria del cohete</span>
              <span className="text-lg font-black text-white font-mono italic tracking-tighter">s(t) = −{k}·t³ + {m}·t²</span>
           </div>
           <div className="h-12 w-px bg-white/10" />
           <div className="text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Tiempo de Vuelo</span>
              <span className="text-3xl font-black text-white font-mono italic tracking-tighter">{t.toFixed(2)}<span className="text-sm ml-1 text-slate-500">s</span></span>
           </div>
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motor Activo</span>
           </div>
        </div>
      </div>

      <div className="flex-1 relative pointer-events-none" />

      {/* CONTROLS: TIMELINE & VALIDATION */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-10">
         <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 shadow-2xl flex items-center justify-between gap-12 pointer-events-auto">

            <div className="flex-1 flex flex-col gap-4">
               <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Instante marcado t</span>
                  <span className="text-xs font-black text-blue-400 font-mono italic">{t.toFixed(2)} s</span>
               </div>
               <input
                 type="range" min="0" max={T_MAX_M8} step="0.01" value={t}
                 onChange={e => { setIsPlaying(false); marcar(parseFloat(e.target.value)); }}
                 className="w-full h-3 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500"
               />
            </div>

            <div className="flex items-center gap-6 border-l border-white/10 pl-12">
               <button
                 onClick={togglePlay}
                 className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isPlaying ? 'bg-amber-500 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10 border border-white/10'}`}
               >
                 {isPlaying ? <Activity size={24} /> : <Play size={24} fill="currentColor" />}
               </button>

               <button
                 onClick={validar}
                 className={`px-12 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center gap-3 shadow-2xl ${status === 'success' ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'}`}
               >
                 {status === 'success' ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
                 {status === 'success' ? 'Instante correcto' : 'Validar Telemetría'}
               </button>
            </div>
         </div>
      </div>

    </div>
  );
}

function HUDCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <motion.div
      className={`px-8 py-5 rounded-[2rem] border border-white/10 flex items-center gap-5 transition-all bg-[#0A1121]/80 backdrop-blur-md shadow-2xl`}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</span>
        <span className="block text-2xl font-black text-white tracking-tighter leading-none italic font-mono">{value}</span>
      </div>
    </motion.div>
  );
}
