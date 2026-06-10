"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, Droplet, Beaker, Target, CheckCircle2, RefreshCw,
  FlaskConical, Info, BookOpen, Box, ChevronRight, Calculator,
  Zap, AlertTriangle, Award, Sparkles,
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import dynamic from 'next/dynamic';
const Soluciones3DScene = dynamic(() => import('./simuladores/qmi05/Soluciones3DScene'), { ssr: false });
import { SUSTANCIAS_SOLUCIONES } from '@/store/slices/quimicaSlice';

type Phase = 'prelab' | 'weighing' | 'dissolving' | 'aforo';

// ── Pre-lab calculation overlay ────────────────────────────────────────────────
function PreLabOverlay({
  sal, mTarget, vTarget, mRequerida,
  onConfirm,
}: {
  sal: (typeof SUSTANCIAS_SOLUCIONES)[number];
  mTarget: number; vTarget: number; mRequerida: number;
  onConfirm: () => void;
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [hint, setHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const check = useCallback(() => {
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val)) { setError(true); return; }
    if (Math.abs(val - mRequerida) / mRequerida <= 0.08) {
      audio?.playSuccess?.();
      onConfirm();
    } else {
      setError(true);
      setHint(true);
      audio?.playError?.();
      setTimeout(() => setError(false), 700);
    }
  }, [input, mRequerida, onConfirm]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center p-6"
      style={{ background: 'rgba(1,8,15,0.88)', backdropFilter: 'blur(16px)' }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="bg-[#0d1f38] border border-white/20 rounded-[2.5rem] p-10 max-w-xl w-full shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
            <Calculator size={22} />
          </div>
          <div>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.35em] mb-0.5">Pre-Laboratorio</p>
            <h2 className="text-xl font-black text-white tracking-tight">Cálculo de Masa</h2>
          </div>
        </div>

        {/* Objective */}
        <div className="bg-[#0d1f38]/80 border border-white/20 rounded-2xl p-4 mb-6">
          <p className="text-sm text-slate-200 leading-relaxed">
            Necesitas preparar{' '}
            <span className="font-black text-white">{vTarget} mL</span> de{' '}
            <span className="font-black text-indigo-300">{sal.nombre}</span> a una
            concentración de{' '}
            <span className="font-black text-white">{mTarget} M</span>.
          </p>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            ¿Cuántos gramos necesitas pesar?
          </p>
        </div>

        {/* Formula */}
        <div className="bg-[#0a1628]/90 border border-white/20 rounded-2xl p-5 mb-6 font-mono text-sm">
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-3">Fórmula</p>
          <div className="space-y-1.5 text-slate-200">
            <p><span className="text-indigo-400 font-bold">m</span> = M × V(L) × PM / pureza</p>
            <p><span className="text-indigo-400 font-bold">m</span> = {mTarget} × {(vTarget / 1000).toFixed(3)} × {sal.pm} / {sal.purity}</p>
            <p className="text-slate-200">m = <span className="text-white font-black">_____ g</span></p>
          </div>
        </div>

        {hint && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/15 border border-amber-500/40 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3"
          >
            <Info size={14} className="text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-200">
              La respuesta está entre <strong>{(mRequerida * 0.85).toFixed(1)}</strong> y{' '}
              <strong>{(mRequerida * 1.15).toFixed(1)}</strong> g.
              Revisá la fórmula — tolera ±8% de error.
            </p>
          </motion.div>
        )}

        {/* Input */}
        <div className="flex gap-3">
          <motion.input
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            onKeyDown={e => e.key === 'Enter' && check()}
            placeholder="Escribe tu respuesta en gramos..."
            animate={error ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className={`flex-1 bg-[#0d1f38]/80 border rounded-2xl px-5 py-3.5 text-white font-mono text-sm placeholder:text-slate-500 outline-none transition-all ${
              error ? 'border-red-500/60 bg-red-500/8' : 'border-white/15 focus:border-indigo-500/70'
            }`}
          />
          <button
            onClick={check}
            className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-indigo-900/50"
          >
            <ChevronRight size={16} /> Confirmar
          </button>
        </div>

        <p className="text-[9px] text-slate-500 mt-4 text-center uppercase tracking-widest">
          Debes calcular esto correctamente para acceder al laboratorio
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── Over-dilution error overlay ────────────────────────────────────────────────
function OverDilutionError({ onReset }: { vTarget?: number; onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 flex items-center justify-center p-6"
      style={{ background: 'rgba(120,10,10,0.65)', backdropFilter: 'blur(14px)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="bg-[#180808] border border-red-500/40 rounded-[2.5rem] p-10 max-w-lg shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <AlertTriangle size={22} />
          </div>
          <h2 className="text-xl font-black text-white">¡Solución Contaminada!</h2>
        </div>
        <p className="text-slate-200 text-sm leading-relaxed mb-4">
          Pasaste el volumen de aforo. En química analítica, la sobre-dilución es{' '}
          <strong className="text-red-300">irreversible</strong>: no podés evaporar
          el agua sin alterar la concentración del soluto.
        </p>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          La solución debe desecharse. Hay que preparar una nueva.
        </p>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-900/50"
        >
          <RefreshCw size={14} /> Reiniciar experimento
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Dissolving overlay ─────────────────────────────────────────────────────────
function DissolvingOverlay({ progress }: { progress: number }) {
  return (
    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white/12 backdrop-blur-xl border border-white/20 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-2xl"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Zap size={18} className="text-cyan-300" />
        </motion.div>
        <div>
          <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest mb-1">Disolución en curso</p>
          <div className="w-44 h-1.5 bg-white/15 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress * 100}%` }}
              className="h-full bg-cyan-400 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Success overlay ────────────────────────────────────────────────────────────
function SuccessOverlay({
  mActual, mTarget, sal, precision, onClose,
}: {
  mActual: number; mTarget: number;
  sal: (typeof SUSTANCIAS_SOLUCIONES)[number];
  precision: number;
  onClose?: () => void;
}) {
  const stars = precision >= 99 ? 3 : precision >= 97 ? 2 : 1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,20,10,0.88)', backdropFilter: 'blur(20px)' }}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(16,185,129,0.18) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ scale: 0.88, y: 32 }} animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="relative bg-[#071a10] border border-emerald-500/30 rounded-[3rem] p-12 max-w-lg w-full shadow-[0_40px_120px_rgba(16,185,129,0.25)]"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 rounded-[1.6rem] bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center"
          >
            <Award size={36} className="text-emerald-400" />
          </motion.div>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map(n => (
            <motion.div
              key={n}
              initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2 + n * 0.08, type: 'spring' }}
            >
              <Sparkles
                size={24}
                className={n <= stars ? 'text-amber-400' : 'text-slate-400'}
              />
            </motion.div>
          ))}
        </div>

        <h2 className="text-2xl font-black text-white text-center tracking-tight mb-2">
          ¡Solución Certificada!
        </h2>
        <p className="text-slate-300 text-center text-sm mb-8">
          Preparaste exitosamente una solución de{' '}
          <span className="font-bold text-white">{sal.nombre}</span>
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-[#0d1f38]/80 border border-white/20 rounded-2xl p-4 text-center">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Molaridad</div>
            <div className="text-lg font-black text-emerald-400">{mActual.toFixed(3)} M</div>
            <div className="text-[9px] text-slate-500">objetivo: {mTarget} M</div>
          </div>
          <div className="bg-[#0d1f38]/80 border border-white/20 rounded-2xl p-4 text-center">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precisión</div>
            <div className="text-lg font-black text-emerald-400">{precision.toFixed(1)}%</div>
            <div className="text-[9px] text-slate-500">tolerancia ±5%</div>
          </div>
          <div className="bg-[#0d1f38]/80 border border-white/20 rounded-2xl p-4 text-center">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Error</div>
            <div className="text-lg font-black text-white">
              {Math.abs(mActual - mTarget).toFixed(4)} M
            </div>
            <div className="text-[9px] text-slate-500">desviación</div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={14} /> Continuar
          </button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PilotoPreparacionSoluciones({
  onValidate,
}: {
  onValidate?: () => void;
}) {
  const { soluciones, addPolvo, toggleTara, transferirPolvo, setAgua, setSal, validarP5, resetP5 } =
    useSimuladorStore();

  const {
    mTarget    = 0.5,
    vTarget    = 250,
    mRequerida = 7.3,
    sal        = SUSTANCIAS_SOLUCIONES[0],
    balanza    = { polvo: 0, tara: false, encendida: true },
    matraz     = { polvo: 0, agua: 0 },
    status     = 'idle',
  } = soluciones || {};

  // ── Phases ──────────────────────────────────────────────────────────────────
  const [phase, setPhase]                 = useState<Phase>('prelab');
  const [dissolveProgress, setDissolveProgress] = useState(0);
  const [isOverDiluted, setIsOverDiluted] = useState(false);
  const [showReagents, setShowReagents]   = useState(false);
  const [showInfo, setShowInfo]           = useState(false);
  const [showSuccess, setShowSuccess]     = useState(false);

  // ── Interval refs (no window.xxx hacks) ─────────────────────────────────────
  const polvoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const aguaIntervalRef  = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => {
    if (polvoIntervalRef.current) clearInterval(polvoIntervalRef.current);
    if (aguaIntervalRef.current)  clearInterval(aguaIntervalRef.current);
  }, []);

  // ── Dissolving phase timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'dissolving') return;
    setDissolveProgress(0);
    const start    = Date.now();
    const duration = 3200;
    const iv = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setDissolveProgress(p);
      if (p >= 1) { clearInterval(iv); setPhase('aforo'); }
    }, 50);
    return () => clearInterval(iv);
  }, [phase]);

  // ── Over-dilution guard ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'aforo' && matraz.agua > vTarget + 2) {
      setIsOverDiluted(true);
      audio?.playError?.();
    }
  }, [matraz.agua, vTarget, phase]);

  // ── Sync status from store (external trigger) ────────────────────────────────
  useEffect(() => {
    if (status === 'success') setShowSuccess(true);
  }, [status]);

  // ── Interval helpers ─────────────────────────────────────────────────────────
  const startAddPolvo = () => {
    if (polvoIntervalRef.current) return;
    if (!balanza.tara) return;
    addPolvo(0.005);
    polvoIntervalRef.current = setInterval(() => addPolvo(0.005), 50);
  };
  const startAddPolvoCoarse = () => {
    if (polvoIntervalRef.current) return;
    if (!balanza.tara) return;
    addPolvo(0.05);
    polvoIntervalRef.current = setInterval(() => addPolvo(0.05), 80);
  };
  const stopPolvo = () => {
    if (polvoIntervalRef.current) { clearInterval(polvoIntervalRef.current); polvoIntervalRef.current = null; }
  };

  const startAgua = (amount: number) => {
    if (aguaIntervalRef.current) return;
    aguaIntervalRef.current = setInterval(() => {
      const cur = useSimuladorStore.getState().soluciones?.matraz.agua ?? 0;
      if (cur < vTarget + 1) setAgua(Math.min(vTarget + 1, cur + amount));
    }, 50);
  };
  const stopAgua = () => {
    if (aguaIntervalRef.current) { clearInterval(aguaIntervalRef.current); aguaIntervalRef.current = null; }
  };

  const handleTransfer = () => {
    if (balanza.polvo < 0.001) return;
    transferirPolvo();
    audio?.playSuccess?.();
    setPhase('dissolving');
  };

  const handleReset = () => {
    resetP5();
    setIsOverDiluted(false);
    setPhase('weighing');
    audio?.playPop?.();
  };

  const handleCertify = () => {
    const ok = validarP5();
    if (ok) {
      audio?.playSuccess?.();
      setShowSuccess(true);
      onValidate?.();
    } else {
      audio?.playError?.();
    }
  };

  // ── Derived values ───────────────────────────────────────────────────────────
  const masaEfectiva   = matraz.polvo * (sal?.purity || 1.0);
  const currentM       = matraz.agua > 0
    ? (masaEfectiva / (sal?.pm || 58.44)) / (matraz.agua / 1000) : 0;
  const mAccuracy      = currentM > 0
    ? Math.max(0, 100 - (Math.abs(currentM - mTarget) / mTarget) * 100) : 0;
  const balAccuracy    = mRequerida > 0 && balanza.polvo > 0
    ? Math.max(0, 100 - (Math.abs(balanza.polvo - mRequerida) / mRequerida) * 100) : 0;
  const isPrecision    = matraz.agua > vTarget * 0.88;
  const canTransfer    = balanza.polvo > 0.001 && phase === 'weighing';
  const isAfored       = matraz.agua >= vTarget * 0.98 && matraz.agua <= vTarget + 1.0;
  const canCertify     = isAfored && !isOverDiluted && phase === 'aforo';

  const steps = [
    { label: 'Pre-Lab', done: phase !== 'prelab' },
    { label: 'Pesar',   done: matraz.polvo > 0 },
    { label: 'Disolver',done: phase === 'aforo' || status === 'success' },
    { label: 'Aforar',  done: isAfored },
  ];

  const phaseLabel: Record<Phase, string> = {
    prelab:     'Pre-Laboratorio',
    weighing:   'Pesaje Analítico',
    dissolving: 'Disolución',
    aforo:      'Aforo del Matraz',
  };

  return (
    <div className="w-full h-full relative overflow-hidden font-['Outfit'] select-none">

      {/* ── 3D SCENE ──────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <Soluciones3DScene
          polvo={balanza.polvo}
          tara={balanza.tara}
          matrazPolvo={matraz.polvo}
          matrazAgua={matraz.agua}
          vTarget={vTarget}
          salColor={(sal as typeof SUSTANCIAS_SOLUCIONES[number])?.color ?? '#f8fafc'}
          phase={phase}
          mRequerida={mRequerida}
        />
      </div>

      {/* ── PRE-LAB OVERLAY ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'prelab' && (
          <PreLabOverlay
            sal={sal as typeof SUSTANCIAS_SOLUCIONES[number]}
            mTarget={mTarget}
            vTarget={vTarget}
            mRequerida={mRequerida}
            onConfirm={() => setPhase('weighing')}
          />
        )}
      </AnimatePresence>

      {/* ── OVER-DILUTION ERROR ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOverDiluted && <OverDilutionError vTarget={vTarget} onReset={handleReset} />}
      </AnimatePresence>

      {/* ── DISSOLVING PROGRESS ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'dissolving' && <DissolvingOverlay progress={dissolveProgress} />}
      </AnimatePresence>

      {/* ── SUCCESS OVERLAY ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessOverlay
            mActual={currentM}
            mTarget={mTarget}
            sal={sal as typeof SUSTANCIAS_SOLUCIONES[number]}
            precision={mAccuracy}
            onClose={() => setShowSuccess(false)}
          />
        )}
      </AnimatePresence>

      {/* ── HEADER ────────────────────────────────────────────────────────────── */}
      <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-5 pointer-events-none">

        {/* Mission card + reagent */}
        <div className="flex flex-col gap-2.5 pointer-events-auto">
          <div className="bg-[#0d1f38]/95 backdrop-blur-md border border-white/20 px-5 py-3.5 rounded-[1.8rem] shadow-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-[0.8rem] bg-indigo-600/80 flex items-center justify-center text-white shrink-0">
              <Beaker size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-sm font-black text-white tracking-tight">{sal?.nombre}</h1>
                <span className="text-[9px] font-mono text-slate-400">({sal?.formula})</span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                  <Target size={8} /> {mTarget} M · {vTarget} mL
                </span>
                {phase !== 'prelab' && (
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                    Meta: {mRequerida} g
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => { setShowReagents(!showReagents); audio?.playPop?.(); }}
              aria-label="Catálogo de reactivos"
              aria-expanded={showReagents}
              className="ml-1 w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 text-slate-300 hover:text-white transition-all flex items-center justify-center"
            >
              <Box size={14} />
            </button>
          </div>

          {/* Reagent dropdown */}
          <AnimatePresence>
            {showReagents && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}
                className="bg-[#0d1f38]/98 backdrop-blur-2xl border border-white/20 p-4 rounded-[1.8rem] shadow-2xl w-[320px]"
              >
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 px-1">Catálogo de Reactivos</div>
                <div className="flex flex-col gap-1.5">
                  {SUSTANCIAS_SOLUCIONES.map((s, idx) => (
                    <button key={s.formula}
                      onClick={() => { setSal(idx); setShowReagents(false); audio?.playSuccess?.(); }}
                      className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                        sal?.formula === s.formula
                          ? 'bg-indigo-500/25 border-indigo-500/50 text-white'
                          : 'bg-[#0d1f38]/80 border-white/20 hover:bg-[#0d1f38] text-slate-200'
                      }`}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '30' }}>
                        <FlaskConical size={11} style={{ color: s.color }} />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-[11px] font-black">{s.nombre}</div>
                        <div className="text-[9px] text-slate-400">{s.formula} · PM {s.pm}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Steps + util buttons */}
        <div className="flex flex-col items-end gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            {/* Current phase badge */}
            <div className="bg-[#0d1f38]/95 border border-white/20 px-4 py-2 rounded-full">
              <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">
                {phaseLabel[phase]}
              </span>
            </div>
            <button onClick={() => setShowInfo(true)}
              aria-label="Ver protocolo e información del experimento"
              className="w-9 h-9 rounded-xl bg-[#0d1f38]/90 border border-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all">
              <Info size={14} />
            </button>
            {phase !== 'prelab' && (
              <button onClick={handleReset}
                aria-label="Reiniciar experimento"
                className="w-9 h-9 rounded-xl bg-[#0d1f38]/90 border border-white/20 flex items-center justify-center text-slate-300 hover:text-red-400 transition-all">
                <RefreshCw size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            {steps.map((s, i) => (
              <div key={i} className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest transition-all ${
                s.done
                  ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                  : 'bg-[#0d1f38]/80 border-white/20 text-slate-300'
              }`}>
                {s.done ? <CheckCircle2 size={9} /> : <div className="w-1 h-1 rounded-full bg-slate-500" />}
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── PHASE-SPECIFIC FOOTER CONTROLS ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === 'weighing' && (
          <motion.footer key="weighing"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-20 p-5"
          >
            <div className="flex items-end gap-4 justify-center">

              {/* Balance panel */}
              <div className="bg-[#0d1f38]/97 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-5 shadow-2xl w-72 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Balanza Analítica</span>
                  <Scale size={12} className="text-slate-400" />
                </div>

                {/* Reading */}
                <div className="bg-black/70 rounded-2xl px-3 py-3 flex items-center justify-center border border-white/20">
                  <span className={`text-2xl font-black font-mono tracking-tight ${balanza.tara ? 'text-slate-400' : balAccuracy > 95 ? 'text-emerald-400' : 'text-sky-300'}`}>
                    {balanza.tara ? '0.000' : balanza.polvo.toFixed(3)}
                    <span className="text-xs ml-1 opacity-50">g</span>
                  </span>
                </div>

                {/* Target range */}
                {!balanza.tara && mRequerida > 0 && (
                  <div>
                    <div className="flex justify-between text-[8px] text-slate-400 mb-1">
                      <span>0 g</span>
                      <span className="text-slate-300">Meta: {mRequerida} g</span>
                      <span>{(mRequerida * 1.3).toFixed(1)} g</span>
                    </div>
                    <div className="relative h-2 bg-white/15 rounded-full overflow-hidden">
                      <div className="absolute h-full bg-emerald-500/25 rounded-full"
                        style={{
                          left: `${(mRequerida * 0.95 / (mRequerida * 1.3)) * 100}%`,
                          width: `${(mRequerida * 0.1 / (mRequerida * 1.3)) * 100}%`,
                        }} />
                      <motion.div
                        animate={{ left: `${Math.min(100, (balanza.polvo / (mRequerida * 1.3)) * 100)}%` }}
                        className={`absolute top-0 w-1 h-full rounded-full ${balAccuracy > 95 ? 'bg-emerald-400' : 'bg-sky-400'}`}
                        style={{ transform: 'translateX(-50%)' }}
                      />
                    </div>
                    <div className="text-[8px] text-center mt-1">
                      <span className={balAccuracy > 95 ? 'text-emerald-400 font-black' : 'text-slate-400'}>
                        {balAccuracy > 95 ? '✓ En rango' : `${balAccuracy.toFixed(0)}% de precisión`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tara required notice */}
                {!balanza.tara && (
                  <p className="text-[8px] text-amber-300/80 text-center uppercase tracking-widest">
                    ↑ Activa TARA antes de pesar
                  </p>
                )}

                {/* Controls */}
                <div className="flex gap-2">
                  <button onClick={() => { toggleTara(); audio?.playPop?.(); }}
                    aria-label={balanza.tara ? 'Desactivar tara de la balanza' : 'Activar tara de la balanza'}
                    aria-pressed={balanza.tara}
                    className={`flex-1 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                      balanza.tara ? 'bg-orange-500/90 text-white shadow-md shadow-orange-900/50' : 'bg-white/10 text-slate-200 hover:bg-white/15'
                    }`}>
                    Tara
                  </button>
                  <button
                    onPointerDown={startAddPolvoCoarse} onPointerUp={stopPolvo} onPointerLeave={stopPolvo}
                    disabled={!balanza.tara}
                    aria-label="Añadir reactivo en cantidad gruesa (0.05 g)"
                    className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-20 text-slate-200 font-black text-[9px] uppercase tracking-widest transition-all"
                  >
                    + Grueso
                  </button>
                  <button
                    onPointerDown={startAddPolvo} onPointerUp={stopPolvo} onPointerLeave={stopPolvo}
                    disabled={!balanza.tara}
                    aria-label="Añadir reactivo en cantidad fina (0.005 g)"
                    className="flex-1 h-10 rounded-xl bg-sky-600/70 hover:bg-sky-500/80 disabled:opacity-20 text-white font-black text-[9px] uppercase tracking-widest transition-all"
                  >
                    + Fino
                  </button>
                </div>

                <button onClick={handleTransfer} disabled={!canTransfer}
                  className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 text-white font-black text-[9px] uppercase tracking-widest transition-all shadow-md shadow-indigo-900/50">
                  Transferir al Matraz →
                </button>
              </div>

              {/* Telemetry */}
              <div className="bg-[#0d1f38]/97 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-5 shadow-2xl w-60">
                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-3">Telemetría</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Moles en platillo</div>
                    <div className="text-lg font-black text-slate-100">
                      {balanza.tara ? '--' : ((balanza.polvo * (sal?.purity ?? 1)) / (sal?.pm ?? 58.44)).toFixed(4)}
                      <span className="text-xs text-slate-400 ml-1">mol</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Pureza reactivo</div>
                    <div className="text-lg font-black text-slate-100">
                      {((sal?.purity ?? 1) * 100).toFixed(1)}
                      <span className="text-xs text-slate-400 ml-1">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.footer>
        )}

        {phase === 'aforo' && (
          <motion.footer key="aforo"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-20 p-5"
          >
            <div className="flex items-end gap-4 justify-center">

              {/* Telemetry */}
              <div className="bg-[#0d1f38]/97 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-5 shadow-2xl w-64">
                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-3">Solución en curso</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <div className="text-[7px] text-slate-400 uppercase tracking-wider mb-0.5">Molaridad</div>
                    <div className={`text-xl font-black ${mAccuracy > 95 ? 'text-emerald-400' : 'text-white'}`}>
                      {currentM.toFixed(3)} <span className="text-xs text-slate-400">M</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[7px] text-slate-400 uppercase tracking-wider mb-0.5">Precisión</div>
                    <div className={`text-xl font-black ${mAccuracy > 95 ? 'text-emerald-400' : mAccuracy > 70 ? 'text-amber-400' : 'text-white'}`}>
                      {matraz.agua > 0 ? mAccuracy.toFixed(1) : '--'}
                      <span className="text-xs text-slate-400 ml-0.5">%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[7px] text-slate-400 mb-1">
                    <span>0</span>
                    <span>{matraz.agua.toFixed(1)} / {vTarget} mL</span>
                  </div>
                  <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${Math.min(100, (matraz.agua / vTarget) * 100)}%` }}
                      className={`h-full rounded-full ${matraz.agua > vTarget + 0.1 ? 'bg-red-500' : isPrecision ? 'bg-cyan-400' : 'bg-blue-500'}`}
                    />
                  </div>
                </div>
              </div>

              {/* Water panel */}
              <div className="bg-[#0d1f38]/97 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-5 shadow-2xl w-72 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Solvente (H₂O)</span>
                  <Droplet size={12} className="text-blue-400" />
                </div>

                <button
                  onPointerDown={() => startAgua(1)} onPointerUp={stopAgua} onPointerLeave={stopAgua}
                  disabled={matraz.agua >= vTarget * 0.88}
                  aria-label={`Llenado rápido — añadir agua en volumen grueso hasta el 88% (${(vTarget * 0.88).toFixed(0)} mL)`}
                  className="h-11 rounded-xl bg-blue-600/80 hover:bg-blue-500/90 disabled:opacity-25 text-white font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-blue-900/40"
                >
                  Llenado Rápido
                </button>

                <button
                  onPointerDown={() => { if (isPrecision) startAgua(0.1); }}
                  onPointerUp={stopAgua} onPointerLeave={stopAgua}
                  aria-label="Goteo de precisión — añadir agua gota a gota para ajustar al menisco"
                  disabled={!isPrecision || matraz.agua >= vTarget + 0.5}
                  className={`h-11 rounded-xl border font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all ${
                    isPrecision && matraz.agua < vTarget + 0.5
                      ? 'border-cyan-500/60 text-cyan-300 bg-cyan-500/15 shadow-[0_0_24px_rgba(6,182,212,0.2)]'
                      : 'border-white/20 text-slate-300 bg-[#0d1f38]/80 cursor-not-allowed'
                  }`}
                >
                  {isPrecision ? '● Goteo de Precisión' : 'Goteo (activa al 88%)'}
                </button>

                {isPrecision && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-[8px] text-cyan-300/80 text-center uppercase tracking-widest">
                    Ajusta al menisco con precisión
                  </motion.p>
                )}

                {/* Aforo confirmation */}
                {isAfored && !canCertify && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl px-3 py-2.5 flex items-center gap-2 justify-center">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">Volumen exacto</span>
                  </motion.div>
                )}

                {/* Certify button — appears when perfectly afored */}
                {canCertify && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    onClick={handleCertify}
                    className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 border border-emerald-500/40"
                  >
                    <Award size={14} /> Certificar Solución
                  </motion.button>
                )}
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      {/* ── INFO MODAL ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-10 bg-black/75 backdrop-blur-xl"
            onClick={() => setShowInfo(false)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0d1f38] border border-white/20 p-10 rounded-[3rem] shadow-2xl max-w-xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-500/15 rounded-2xl text-indigo-300 border border-indigo-500/30">
                  <BookOpen size={24} />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">Protocolo de Soluciones</h2>
              </div>
              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <p><strong className="text-white">Molaridad (M):</strong> mol de soluto / L de solución. M = n / V</p>
                <p><strong className="text-white">Masa requerida:</strong>{' '}
                  m = M × V(L) × PM / pureza =&nbsp;
                  <strong className="text-indigo-300">{mRequerida} g</strong> de {sal?.nombre}
                </p>
                <p><strong className="text-white">El Menisco:</strong> La parte inferior de la curva del líquido debe tocar exactamente la línea de calibración.</p>
                <p><strong className="text-white">Tolerancia:</strong> ±0.05 M respecto a {mTarget} M objetivo.</p>
                <p><strong className="text-red-300">Sobre-dilución:</strong> Si pasás el volumen objetivo, la solución se descarta. No es reversible.</p>
              </div>
              <button onClick={() => setShowInfo(false)}
                className="mt-7 px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/15">
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
