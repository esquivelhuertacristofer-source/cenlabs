"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  Target, Activity, ShieldCheck,
  RefreshCcw, BookOpen, FunctionSquare, Pi, CheckCircle2,
} from 'lucide-react';
import ComplexPlaneMonitor from './ComplexPlaneMonitor';
import Cuadraticas3DScene from './simuladores/mat01/Cuadraticas3DScene';
import {
  solveQuadratic, formatQuadratic,
  getEquivalentForms, getDomainRangeInfo,
} from '@/utils/mathEngine';
import { puntosObjetivoM1 } from '@/domain/matematicas';
import { audio as audioEngine } from '@/utils/audioEngine';

/**
 * MAT-01 · Deducir f(x) = ax² + bx + c de una trayectoria.
 * El objetivo NO se muestra como ecuación: el alumno recibe tres puntos medidos
 * (x = −1, 0, 1) y la curva guía, y tiene que deducir a, b y c. Δ y el vértice
 * se comprueban en la bitácora (consola de cálculo). El veredicto lo da el
 * validador del store vía `onValidate` (botón del header o el de este panel).
 */
export default function PilotoCuadraticas({ onValidate }: { onValidate?: () => void }) {
  const { cuadraticas, setCoefsM1, registrarHallazgoM1, resetM1, setAsistente, pasoActual, setPasoActual, bitacoraData, setBitacora, stopTimer } = useSimuladorStore(
    useShallow((s) => ({
      cuadraticas: s.cuadraticas, setCoefsM1: s.setCoefsM1, registrarHallazgoM1: s.registrarHallazgoM1, resetM1: s.resetM1,
      setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
      bitacoraData: s.bitacoraData, setBitacora: s.setBitacora, stopTimer: s.stopTimer,
    })),
  );
  const { a, b, c, target, status } = cuadraticas;

  const calcReady = (cuadraticas.deltaVerified ?? false) && (cuadraticas.vertexVerified ?? false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al Explorador de Cuadráticas. Tienes tres puntos medidos de la trayectoria objetivo: deduce a, b y c y ajusta tu parábola para que pase por ellos.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- MOTOR MATEMÁTICO --
  const currentRes  = useMemo(() => solveQuadratic(a, b, c), [a, b, c]);
  const currentEq   = useMemo(() => formatQuadratic(a, b, c), [a, b, c]);
  const forms       = useMemo(() => getEquivalentForms(a, b, c, currentRes.vertex, currentRes.roots), [a, b, c, currentRes]);
  const domainInfo  = useMemo(() => getDomainRangeInfo(a, b, currentRes.vertex.k, c), [a, b, currentRes.vertex.k, c]);
  const puntos      = useMemo(() => puntosObjetivoM1(target), [target]);

  const { h: vh, k: vk } = currentRes.vertex;

  // -- GEOMETRÍA DE LA PARÁBOLA: parámetro focal p = 1/4a --
  const focusReady = Math.abs(a) >= 0.06;
  const p = 1 / (4 * (Math.abs(a) < 1e-6 ? 1e-6 : a));
  const focusY = vk + p;
  const directrixY = vk - p;

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (a !== 1 || b !== 0 || c !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (calcReady && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) {
      setPasoActual(3);
      stopTimer();
      registrarHallazgoM1();
    }
  }, [a, b, c, calcReady, status, pasoActual, setPasoActual, stopTimer, registrarHallazgoM1]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full bg-[#020617] flex items-center justify-center overflow-hidden font-['Outfit'] text-white">

      {/* ── CHECKLIST HUD (DIAMOND STANDARD) ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-rose-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(244,63,94,0.15)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-xl">
                <FunctionSquare className="text-rose-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-widest leading-none">Sincronía Algebraica</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MAT-01 • Protocolo Parábola</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Parámetros" },
                { step: 2, label: "Cálculo" },
                { step: 3, label: "Sincronía" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-rose-500 border-rose-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                   {pasoActual > s.step ? <ShieldCheck size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                   <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── HUD SUPERIOR: TELEMETRÍA ── */}
      <div className="absolute top-36 left-7 right-7 flex justify-between items-start z-20 pointer-events-none gap-4">

        {/* Panel de Formas (de TU parábola) */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-4 pointer-events-auto max-w-[320px]">
          <div className="bg-black/60 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl group">
             <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 block">Tu función</span>
             <div className="font-mono text-2xl font-black text-white mb-6 leading-tight italic tracking-tighter">
                {currentEq}
             </div>
             <div className="grid grid-cols-2 gap-3">
                <DataChip label="Foco" value={focusReady ? `(${vh.toFixed(1)}, ${focusY.toFixed(1)})` : '—'} color="cyan" />
                <DataChip label="Directriz" value={focusReady ? `y = ${directrixY.toFixed(1)}` : '—'} color="rose" />
             </div>
          </div>

          <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/5 space-y-4">
             <EquivFormRow label="Forma Vértice" color="rose" formula={forms.vertexForm} />
             {forms.factored && <EquivFormRow label="Forma Factorizada" color="amber" formula={forms.factored} />}
             <div className="grid grid-cols-2 gap-3 pt-1">
                <DataChip label="Vieta · Suma (−b/a)" value={Number.isFinite(domainInfo.vietaSum) ? domainInfo.vietaSum.toFixed(2) : '—'} color="cyan" />
                <DataChip label="Vieta · Producto (c/a)" value={Number.isFinite(domainInfo.vietaProduct) ? domainInfo.vietaProduct.toFixed(2) : '—'} color="amber" />
             </div>
          </div>
        </motion.div>

        {/* Panel Objetivo: SOLO datos medidos, nunca la ecuación */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-4 pointer-events-auto">
          <div className="bg-[#FB8500]/10 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-[#FB8500]/30 shadow-2xl min-w-[280px]">
             <div className="flex justify-between items-start mb-3">
                <span className="text-[9px] font-black text-[#FB8500] uppercase tracking-[0.2em]">Puntos medidos de la trayectoria</span>
                <Target size={18} className="text-[#FB8500] animate-pulse" />
             </div>
             <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <span className="text-[8px] font-black text-slate-500 uppercase">x</span>
                <span className="text-[8px] font-black text-slate-500 uppercase">y medida</span>
                <span className="text-[8px] font-black text-slate-500 uppercase">tu f(x)</span>
                {puntos.map((pt) => {
                  const tuyo = a * pt.x * pt.x + b * pt.x + c;
                  const ok = Math.abs(tuyo - pt.y) < 0.05;
                  return (
                    <React.Fragment key={pt.x}>
                      <span className="text-sm font-black text-white">{pt.x}</span>
                      <span className="text-sm font-black text-[#FB8500]">{pt.y.toFixed(1)}</span>
                      <span className={`text-sm font-black ${ok ? 'text-emerald-400' : 'text-slate-300'}`}>{tuyo.toFixed(1)}</span>
                    </React.Fragment>
                  );
                })}
             </div>
             <p className="text-[9px] text-slate-400 mt-3 leading-snug max-w-[260px]">
               Plantea f(−1), f(0) y f(1) con a, b, c desconocidos y resuelve el sistema.
             </p>
          </div>

          <ComplexPlaneMonitor roots={currentRes.roots} isVisible={currentRes.delta < 0} />
        </motion.div>
      </div>

      {/* ── ESCENA GRÁFICA 3D ── */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <Cuadraticas3DScene a={a} b={b} c={c} target={target} currentRes={currentRes} escenario={cuadraticas.escenario as any} puntosObjetivo={puntos} />
      </div>

      {/* ── DOCK DE CONTROL INFERIOR ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[1200px] px-8 z-40">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl flex items-center justify-between gap-10">
          <div className="flex-1 flex gap-12">
            <CoefficientSlider label="Amplitud (a)" value={a} min={-5} max={5} step={0.1} color="rose" onChange={(v: number) => { setCoefsM1(v, b, c); audioEngine?.playPop(); }} />
            <CoefficientSlider label="Simetría (b)" value={b} min={-10} max={10} step={0.5} color="cyan" onChange={(v: number) => { setCoefsM1(a, v, c); audioEngine?.playPop(); }} />
            <CoefficientSlider label="Intercepto (c)" value={c} min={-10} max={10} step={0.5} color="amber" onChange={(v: number) => { setCoefsM1(a, b, v); audioEngine?.playPop(); }} />
          </div>

          <div className="flex items-center gap-4 border-l border-white/10 pl-10">
             <button
               onClick={() => {
                 audioEngine?.playSuccess();
                 setAsistente({ text: "Punto de telemetría capturado. Los datos han sido registrados en tu Bitácora Algebraica.", pose: "happy" });

                 const nuevoPunto = {
                   id: `p-${Date.now().toString(36)}`,
                   x: vh.toFixed(2),
                   y: vk.toFixed(2),
                   timestamp: "VÉRTICE " + new Date().toLocaleTimeString()
                 };

                 const logsPrevios = bitacoraData?.cuadraticas_points || [];
                 setBitacora({
                   ...bitacoraData,
                   cuadraticas_points: [nuevoPunto, ...logsPrevios].slice(0, 10)
                 });
               }}
               className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-rose-400 transition-all group"
               title="Registrar Vértice"
             >
                <Activity size={20} className="group-hover:scale-125 transition-transform" />
             </button>
             <button onClick={() => { resetM1(); audioEngine?.playPop(); setAsistente({ text: "Coeficientes reiniciados. La trayectoria objetivo sigue siendo la misma.", pose: "neutral" }); }} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500 transition-all">
                <RefreshCcw size={20} />
             </button>
             {/* Estado de los cálculos de la bitácora (se verifican allí, no aquí) */}
             <div className="flex flex-col gap-1.5">
               <CalcChip ok={cuadraticas.deltaVerified ?? false} icon={<BookOpen size={11} />} label="Δ comprobado" />
               <CalcChip ok={cuadraticas.vertexVerified ?? false} icon={<Pi size={11} />} label="Vértice comprobado" />
             </div>
             <button
               onClick={() => onValidate?.()}
               className={`h-16 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all ${status === 'success' ? 'bg-emerald-600' : 'bg-rose-600 shadow-rose-600/20 hover:bg-rose-500'}`}
             >
                <ShieldCheck size={18} />
                {status === 'success' ? 'Sincronizado' : 'Validar'}
             </button>
          </div>
        </motion.div>
      </div>

      {/* AVISO DE ESTADO (no modal) */}
      <AnimatePresence>
        {(status === 'success' || (status === 'error' && cuadraticas.mensajeFeedback)) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-44 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className={`px-6 py-3 rounded-2xl border backdrop-blur-xl text-[11px] font-black flex items-center gap-2 ${status === 'success' ? 'bg-emerald-600/90 border-emerald-400 text-white' : 'bg-rose-950/90 border-rose-500/50 text-rose-200'}`}>
              {status === 'success' && <CheckCircle2 size={14} />}
              {cuadraticas.mensajeFeedback}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function CalcChip({ ok, icon, label }: { ok: boolean; icon: React.ReactNode; label: string }) {
  return (
    <div className={`px-3 py-1.5 rounded-xl border text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${ok ? 'bg-emerald-700/60 border-emerald-500/50 text-emerald-200' : 'bg-white/5 border-white/10 text-slate-500'}`} title={ok ? '' : 'Compruébalo en la bitácora'}>
      {icon}{label}{ok ? ' ✓' : ' · bitácora'}
    </div>
  );
}

function DataChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = { rose: 'text-rose-400', emerald: 'text-emerald-400', slate: 'text-slate-400', cyan: 'text-cyan-400', amber: 'text-amber-400' };
  return (
    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
      <span className="text-[7px] font-black text-slate-500 uppercase block mb-1">{label}</span>
      <span className={`text-[11px] font-black font-mono ${colors[color]}`}>{value}</span>
    </div>
  );
}

function EquivFormRow({ label, color, formula }: { label: string; color: string; formula: string }) {
  const colors: Record<string, string> = { rose: 'border-rose-500/30 text-rose-400', amber: 'border-amber-500/30 text-amber-400' };
  return (
    <div>
      <span className="text-[7px] font-black text-slate-500 uppercase block mb-1">{label}</span>
      <div className={`pl-3 border-l-2 ${colors[color]} font-mono text-[10px] font-bold text-white/80`}>{formula}</div>
    </div>
  );
}

function CoefficientSlider({ label, value, min, max, step, color, onChange }: { label: string; value: number; min: number; max: number; step: number; color: string; onChange: (v: number) => void }) {
  const accents: Record<string, string> = { rose: 'accent-rose-500', cyan: 'accent-cyan-400', amber: 'accent-amber-400' };
  return (
    <div className="flex-1 space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-[11px] font-black font-mono text-white bg-white/5 px-2 py-0.5 rounded-lg">{value.toFixed(1)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className={`w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer ${accents[color]}`} />
    </div>
  );
}
