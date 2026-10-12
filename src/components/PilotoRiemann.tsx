"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, ShieldCheck, Calculator, Layers, TrendingUp, MoveHorizontal, CheckCircle2,
} from 'lucide-react';
import Riemann3DScene from './simuladores/mat09/Riemann3DScene';
import {
  sumaRiemannM9, errorRelativoM9, TOLERANCIA_M9, NOMBRE_METODO_M9,
  A_M9, B_M9, N_MIN_M9, N_MAX_M9, type MetodoM9,
} from '@/domain/matematicas';

/**
 * MAT-09 · Sumas de Riemann de f(x) = 0.1·x² + 1 en [0, 10].
 * El reto (semilla) fija el MÉTODO y su tolerancia de error relativo; el alumno
 * busca la partición n que la cumple. La UI muestra el error relativo de la
 * suma elegida contra la integral exacta, con el mismo umbral que el validador.
 */
export default function PilotoRiemann({ onValidate }: { onValidate?: () => void }) {
  const { integral9, setIntegralM9, setAnimandoM9, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      integral9: s.integral9, setIntegralM9: s.setIntegralM9, setAnimandoM9: s.setAnimandoM9,
      audio: s.audio, setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  const { n: nStore, metodo, metodoReto, animandoLimite, status } = integral9;
  const tol = TOLERANCIA_M9[metodoReto];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: `Bienvenido al Analizador de Riemann. Reto: aproxima el área bajo f(x) = 0.1x² + 1 en [0, 10] con ${NOMBRE_METODO_M9[metodoReto]} y un error relativo menor a ${(tol * 100).toFixed(1)} %.`,
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animación de límite n → N_MAX en estado LOCAL (20 pasos/s); el store recibe
  // la n final al terminar o al detenerla.
  const [nAnim, setNAnim] = useState(nStore);
  const nAnimRef = useRef(nStore);
  useEffect(() => {
    if (!animandoLimite) return;
    nAnimRef.current = nStore;
    setNAnim(nStore);
    const id = setInterval(() => {
      const sig = Math.min(N_MAX_M9, nAnimRef.current + 1);
      nAnimRef.current = sig;
      setNAnim(sig);
      if (sig >= N_MAX_M9) { clearInterval(id); setIntegralM9(sig, metodo); setAnimandoM9(false); }
    }, 50);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animandoLimite]);
  const detener = () => { setIntegralM9(nAnimRef.current, metodo); setAnimandoM9(false); };
  const n = animandoLimite ? nAnim : nStore;

  const dx = (B_M9 - A_M9) / n;
  const areaApprox = sumaRiemannM9(n, metodo);
  const errRel = errorRelativoM9(n, metodo);
  const cumple = metodo === metodoReto && errRel < tol;

  useEffect(() => {
    if (nStore !== 4 && pasoActual === 0) setPasoActual(1);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [nStore, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">

      {/* GIANT TELEMETRY BACKGROUND */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
        <span className="text-[14rem] font-black font-mono text-emerald-500 select-none italic tracking-tighter">
          n={n}
        </span>
      </div>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
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

      {/* ESCENA 3D (BACKGROUND) */}
      <div className="absolute inset-0 z-0">
        <Riemann3DScene n={n} metodo={metodo} animandoLimite={animandoLimite} />
      </div>

      {/* HUD SUPERIOR: TELEMETRÍA */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none mt-20">
        <div className="flex justify-between items-start">
            <div className="flex gap-4 pointer-events-auto">
                <HUDCard label={`Suma (${NOMBRE_METODO_M9[metodo]})`} value={areaApprox.toFixed(4)} icon={<Calculator size={14} />} color="#10b981" />
                <HUDCard label="Ancho Δx" value={dx.toFixed(4)} icon={<MoveHorizontal size={14} />} color="#06b6d4" />
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl pointer-events-auto flex items-center gap-6">
                <div className="text-right border-r border-white/10 pr-6">
                    <span className="text-[9px] font-black text-amber-400 uppercase block mb-1 italic">Reto</span>
                    <div className="text-sm font-black text-white tracking-tight">
                       {NOMBRE_METODO_M9[metodoReto]} · error &lt; {(tol * 100).toFixed(1)} %
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 mt-1">f(x) = 0.1x² + 1 en [0, 10]</div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 italic">Error relativo</span>
                    <div className={`text-2xl font-black italic tracking-tighter ${cumple ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {(errRel * 100).toFixed(3)} %
                    </div>
                </div>
            </div>
        </div>

        {/* Notificación de Límite */}
        <AnimatePresence>
            {animandoLimite && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="relative flex flex-col items-center">
                        <TrendingUp size={240} className="text-emerald-500/20" strokeWidth={0.5} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-4">n → ∞</span>
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
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Partición (n)</span>
                        <span className="text-[12px] font-black text-emerald-400 font-mono bg-white/5 px-2 py-0.5 rounded-lg">{n} Rectángulos</span>
                    </div>
                    <input
                      type="range" min={N_MIN_M9} max={N_MAX_M9} step="1" value={n}
                      onChange={e => { if (animandoLimite) setAnimandoM9(false); setIntegralM9(parseInt(e.target.value), metodo); audio?.playPop(); }}
                      className="w-full h-3 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500"
                    />
                </div>

                <div className="flex items-center gap-6 border-l border-white/10 pl-16">
                    <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase text-center">Punto de Evaluación</span>
                        <div className="flex gap-2">
                            {(['izquierda', 'punto_medio', 'derecha'] as MetodoM9[]).map(mt => (
                                <button key={mt} onClick={() => { setIntegralM9(n, mt); audio?.playPop(); }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${metodo === mt ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                                    {mt.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => { if (animandoLimite) detener(); else setAnimandoM9(true); audio?.playPop(); }} title="Animar n → 100" className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${animandoLimite ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 border border-white/10 text-slate-500 hover:text-white'}`}>
                        <TrendingUp size={24} />
                    </button>

                    <button
                      onClick={() => { if (animandoLimite) detener(); onValidate?.(); }}
                      className={`px-10 py-5 text-white rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 group ${status === 'success' ? 'bg-emerald-500' : 'bg-emerald-600 hover:bg-emerald-500'}`}
                    >
                      {status === 'success' ? <CheckCircle2 size={18} /> : <Target size={18} className="group-hover:rotate-12 transition-transform" />}
                      <span className="text-xs font-black uppercase tracking-widest">Validar Integral</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}

function HUDCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="px-8 py-5 rounded-[2rem] border border-white/10 flex items-center gap-5 transition-all bg-[#0A1121]/80 backdrop-blur-md shadow-2xl">
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
