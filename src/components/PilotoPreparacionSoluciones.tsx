"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplet, Beaker, Target, CheckCircle2, RefreshCw,
  FlaskConical, Info, BookOpen, ChevronRight, Calculator,
  AlertTriangle, Award,
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { aforoCorrecto, sobrepasaAforo, toleranciaAforo, TOLERANCIA_Q5_REL } from '@/domain/quimica';
import { audio } from '@/utils/audioEngine';
import dynamic from 'next/dynamic';
import LabLayout, { Lectura, BotonLab } from '@/components/simulador/LabLayout';
const Soluciones3DScene = dynamic(() => import('./simuladores/qmi05/Soluciones3DScene'), { ssr: false });
import { SUSTANCIAS_SOLUCIONES } from '@/store/slices/quimicaSlice';

type Phase = 'prelab' | 'weighing' | 'dissolving' | 'aforo';
type Sal = (typeof SUSTANCIAS_SOLUCIONES)[number];

/** Fórmula con subíndices (sin HTML crudo). */
function Formula({ f }: { f: string }) {
  return <>{f.split(/(\d+)/).map((t, i) => (/^\d+$/.test(t) ? <sub key={i}>{t}</sub> : <React.Fragment key={i}>{t}</React.Fragment>))}</>;
}

// ── Pre-laboratorio: el cálculo se hace con la mesa a la vista ────────────────────
function PreLab({
  sal, mTarget, vTarget, mRequerida, onConfirm,
}: {
  sal: Sal; mTarget: number; vTarget: number; mRequerida: number; onConfirm: () => void;
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-300"><Calculator size={13} /> Pre-laboratorio · cálculo de masa</span>
        <span className="text-[13px] text-slate-200">
          Prepara <b className="text-white">{vTarget} mL</b> de <b className="text-indigo-300">{sal.nombre}</b> a <b className="text-white">{mTarget} M</b>. ¿Cuántos gramos pesas?
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-white/10 bg-[#0a1628]/90 px-3 py-1.5 font-mono text-[12px] text-slate-200">
        <span><span className="font-bold text-indigo-400">m</span> = M × V(L) × PM / pureza</span>
        <span><span className="font-bold text-indigo-400">m</span> = {mTarget} × {(vTarget / 1000).toFixed(3)} × {sal.pm} / {sal.purity}</span>
      </div>
      {hint && (
        <div className="flex items-center gap-2 text-[12px] text-amber-200">
          <Info size={13} className="shrink-0 text-amber-400" />
          Revisa las unidades: el volumen va en litros (mL ÷ 1000) y la masa se divide entre la pureza (en fracción, no en %). Se acepta ±8 % de error.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <motion.input
          ref={inputRef}
          value={input}
          inputMode="decimal"
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          placeholder="Escribe tu respuesta en gramos..."
          animate={error ? { x: [-8, 8, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
          className={`h-9 min-w-[220px] flex-1 rounded-lg border bg-white/5 px-3 font-mono text-[13px] text-white outline-none placeholder:text-slate-500 ${error ? 'border-red-500/60' : 'border-white/15 focus:border-indigo-400/70'}`}
        />
        <BotonLab onClick={check}><ChevronRight size={14} /> Confirmar</BotonLab>
      </div>
    </div>
  );
}

/** Lupa del cuello del matraz: el menisco (ampliado) frente a la marca de aforo y su banda de tolerancia. */
function LupaMenisco({ agua, vTarget, tol }: { agua: number; vTarget: number; tol: number }) {
  const delta = (agua - vTarget) / Math.max(tol, 1e-6);          // en unidades de tolerancia
  const K = 12;                                                    // px por tolerancia
  const y = 46 - Math.max(-3.6, Math.min(3.6, delta)) * K;
  const dentro = Math.abs(delta) <= 1;
  const color = delta > 1 ? '#ef4444' : dentro ? '#34d399' : '#38bdf8';
  return (
    <svg width="132" height="92" viewBox="0 0 132 92" role="img" aria-label="Lupa del menisco frente a la marca de aforo" className="shrink-0 rounded-lg border border-white/10 bg-white/[0.03]">
      <rect x="16" y="0" width="22" height="92" fill="#cfe6ef" opacity="0.08" />
      <path d={`M16 ${y} Q27 ${y + 5} 38 ${y} L38 92 L16 92 Z`} fill={color} opacity="0.55" />
      <path d={`M16 ${y} Q27 ${y + 5} 38 ${y}`} stroke={color} strokeWidth="1.5" fill="none" />
      <line x1="16" y1="0" x2="16" y2="92" stroke="#cfe6ef" strokeWidth="1.5" opacity="0.7" />
      <line x1="38" y1="0" x2="38" y2="92" stroke="#cfe6ef" strokeWidth="1.5" opacity="0.7" />
      <rect x="12" y={46 - K} width="30" height={2 * K} fill="#34d399" opacity="0.12" />
      <line x1="8" y1="46" x2="46" y2="46" stroke="#f8fafc" strokeWidth="2" />
      <text x="52" y="43" fontSize="9" fill="#f8fafc" fontWeight="700">marca</text>
      <text x="52" y="54" fontSize="9" fill="#94a3b8">{vTarget} mL</text>
      <text x="52" y="22" fontSize="8" fill="#94a3b8">±{tol.toFixed(1)} mL</text>
      <text x="52" y="82" fontSize="8" fill="#94a3b8">lupa ×</text>
    </svg>
  );
}

// Masa del vidrio de reloj vacío: es lo que marca la balanza antes de tarar.
const VIDRIO_RELOJ_G = 12.5;

const btnPulso = 'h-9 flex-1 min-w-[88px] rounded-lg px-2 text-[11px] font-bold uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-30';

// ── Main component ─────────────────────────────────────────────────────────────
export default function PilotoPreparacionSoluciones({
  onValidate,
}: {
  onValidate?: () => void;
}) {
  const { soluciones, addPolvo, toggleTara, transferirPolvo, setAgua, setSal, validarP5, resetP5 } =
    useSimuladorStore(useShallow((s) => ({
      soluciones: s.soluciones, addPolvo: s.addPolvo, toggleTara: s.toggleTara,
      transferirPolvo: s.transferirPolvo, setAgua: s.setAgua, setSal: s.setSal,
      validarP5: s.validarP5, resetP5: s.resetP5,
    })));

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
  const [showInfo, setShowInfo]           = useState(false);

  // ── Interval refs (no window.xxx hacks) ─────────────────────────────────────
  const polvoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const aguaIntervalRef  = useRef<NodeJS.Timeout | null>(null);

  // La semilla la pone `entrarLab('quimica-5')` antes de montar este panel.
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
    if (phase === 'aforo' && sobrepasaAforo(matraz.agua, vTarget)) {
      setIsOverDiluted(true);
      audio?.playError?.();
    }
  }, [matraz.agua, vTarget, phase]);

  // ── Interval helpers ─────────────────────────────────────────────────────────
  // Mantener pulsado añade (o retira, con monto negativo) de forma continua.
  const startPolvo = (amount: number, everyMs: number) => {
    if (polvoIntervalRef.current) return;
    if (!balanza.tara) return;
    addPolvo(amount);
    polvoIntervalRef.current = setInterval(() => addPolvo(amount), everyMs);
  };
  const stopPolvo = () => {
    if (polvoIntervalRef.current) { clearInterval(polvoIntervalRef.current); polvoIntervalRef.current = null; }
  };

  // El llenado rápido se detiene solo al 88 %; el goteo puede pasarse de la
  // marca (y entonces la solución se pierde), como con una piseta real.
  const startAgua = (amount: number, limite: number) => {
    if (aguaIntervalRef.current) return;
    const gota = () => {
      const cur = useSimuladorStore.getState().soluciones?.matraz.agua ?? 0;
      if (cur < limite) setAgua(Math.min(limite, cur + amount));
    };
    gota();
    aguaIntervalRef.current = setInterval(gota, 50);
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
    stopPolvo(); stopAgua();
    resetP5();
    setIsOverDiluted(false);
    setPhase('prelab');
    audio?.playPop?.();
  };

  // Un solo juez: el validador de la práctica (SimuladorClient → validarLab).
  const handleCertify = () => {
    if (onValidate) onValidate();
    else if (!validarP5()) audio?.playError?.();
  };

  // ── Derived values ───────────────────────────────────────────────────────────
  const balAccuracy    = mRequerida > 0 && balanza.polvo > 0
    ? Math.max(0, 100 - (Math.abs(balanza.polvo - mRequerida) / mRequerida) * 100) : 0;
  const enRangoMasa    = balAccuracy >= 100 - TOLERANCIA_Q5_REL * 100;
  const isPrecision    = matraz.agua >= vTarget * 0.88;
  const canTransfer    = balanza.polvo > 0.001 && phase === 'weighing';
  const isAfored       = aforoCorrecto(matraz.agua, vTarget);
  const tolAforo       = toleranciaAforo(vTarget);
  const canCertify     = isAfored && !isOverDiluted && phase === 'aforo';
  const lecturaBalanza = balanza.tara ? balanza.polvo : VIDRIO_RELOJ_G;
  const salActual      = sal as Sal;

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

  // ── Escena (área garantizada) ────────────────────────────────────────────────
  const escena = (
    <div className="relative h-full w-full">
      <Soluciones3DScene
        polvo={balanza.polvo}
        tara={balanza.tara}
        matrazPolvo={matraz.polvo}
        matrazAgua={matraz.agua}
        vTarget={vTarget}
        salColor={salActual?.color ?? '#f8fafc'}
        salFormula={salActual?.formula}
        salNombre={salActual?.nombre}
        phase={phase}
        progresoDisolucion={dissolveProgress}
      />

      {/* Sobre-dilución: tarjeta compacta, la mesa sigue a la vista */}
      <AnimatePresence>
        {isOverDiluted && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute left-1/2 top-3 z-30 flex w-[min(92%,520px)] -translate-x-1/2 items-start gap-3 rounded-xl border border-red-500/50 bg-[#1b0b0b]/95 p-3 shadow-2xl"
            role="alert"
          >
            <AlertTriangle size={20} className="mt-0.5 shrink-0 text-red-400" />
            <div className="min-w-0 flex-1">
              <h2 className="text-[14px] font-black text-white">¡Solución contaminada!</h2>
              <p className="mt-0.5 text-[12px] leading-snug text-slate-300">
                Pasaste el volumen de aforo. La sobre-dilución es <strong className="text-red-300">irreversible</strong>: no se puede evaporar el agua sin alterar la concentración. Hay que preparar una nueva solución.
              </p>
              <button onClick={handleReset}
                className="mt-2 flex h-8 items-center gap-1.5 rounded-lg bg-red-600 px-3 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-red-500">
                <RefreshCw size={13} /> Reiniciar experimento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Protocolo (a petición del alumno) */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4"
            onClick={() => setShowInfo(false)}
          >
            <div onClick={(e) => e.stopPropagation()}
              className="relative max-h-full max-w-xl overflow-y-auto rounded-2xl border border-indigo-400/30 bg-[#0d1f38] p-6 shadow-2xl">
              <div className="mb-3 flex items-center gap-3">
                <BookOpen className="text-indigo-300" size={26} />
                <h2 className="text-lg font-black text-white">Protocolo de soluciones</h2>
              </div>
              <div className="space-y-2.5 text-[13px] leading-relaxed text-slate-300">
                <p><strong className="text-white">Molaridad (M):</strong> mol de soluto / L de solución. M = n / V</p>
                <p><strong className="text-white">Masa requerida:</strong>{' '}
                  m = M × V(L) × PM / pureza
                  {phase !== 'prelab' && <> =&nbsp;<strong className="text-indigo-300">{mRequerida} g</strong> de {salActual?.nombre}</>}
                </p>
                <p><strong className="text-white">El menisco:</strong> la parte inferior de la curva del líquido debe tocar exactamente la línea de calibración del cuello.</p>
                <p><strong className="text-white">Tolerancia:</strong> la molaridad debe quedar a ±5 % de {mTarget} M, y el menisco a ±{tolAforo.toFixed(1)} mL de la marca de {vTarget} mL.</p>
                <p><strong className="text-red-300">Sobre-dilución:</strong> si pasas el volumen objetivo, la solución se descarta. No es reversible.</p>
              </div>
              <button onClick={() => setShowInfo(false)}
                className="mt-5 rounded-lg border border-white/15 bg-white/10 px-5 py-2 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-white/15">
                Entendido
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ── Barra superior ───────────────────────────────────────────────────────────
  const barraSuperior = (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/80 text-white"><Beaker size={15} /></div>
        <div className="flex flex-col leading-tight">
          <span className="text-[13px] font-bold text-white">{salActual?.nombre} <span className="font-mono text-[10px] font-normal text-slate-400">(<Formula f={salActual?.formula ?? ''} />)</span></span>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-300"><Target size={9} /> {mTarget} M · {vTarget} mL{phase !== 'prelab' ? ` · meta ${mRequerida} g` : ''}</span>
        </div>
      </div>
      <span className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-200">
        {({ prelab: 1, weighing: 2, dissolving: 3, aforo: 4 } as Record<Phase, number>)[phase]}/4 · {phaseLabel[phase]}
      </span>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button onClick={() => setShowInfo(true)} aria-label="Ver protocolo e información del experimento" title="Protocolo"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><Info size={15} /></button>
        {phase !== 'prelab' && (
          <button onClick={handleReset} aria-label="Reiniciar experimento" title="Reiniciar"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-red-400"><RefreshCw size={15} /></button>
        )}
      </div>
    </>
  );

  // ── Panel lateral: catálogo de reactivos ─────────────────────────────────────
  const panelLateral = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1" aria-label="Progreso de la práctica">
        {steps.map((st, i) => (
          <span key={i} className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${st.done ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-white/[0.03] text-slate-400'}`}>
            {st.done ? <CheckCircle2 size={9} /> : <span className="h-1 w-1 rounded-full bg-slate-500" />}{st.label}
          </span>
        ))}
      </div>
      <div>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Catálogo de reactivos</div>
        <div className="flex flex-col gap-1.5" role="group" aria-label="Catálogo de reactivos">
          {SUSTANCIAS_SOLUCIONES.map((s, idx) => (
            <button key={s.formula}
              aria-pressed={salActual?.formula === s.formula}
              onClick={() => {
                // Otro reactivo es otro cálculo: se vuelve al pre-laboratorio.
                stopPolvo(); stopAgua();
                setSal(idx); setIsOverDiluted(false); setPhase('prelab');
                audio?.playSuccess?.();
              }}
              className={`flex items-center gap-2.5 rounded-lg border p-2 text-left transition-colors ${salActual?.formula === s.formula
                ? 'border-indigo-400/50 bg-indigo-500/20 text-white'
                : 'border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/10'}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ backgroundColor: s.color + '33' }}>
                <FlaskConical size={12} style={{ color: s.color }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-bold leading-tight">{s.nombre}</span>
                <span className="block text-[10px] text-slate-400"><Formula f={s.formula} /> · PM {s.pm}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] leading-snug text-slate-300">
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Reactivo en uso</div>
        <div><b className="text-white">PM</b> {salActual?.pm} g/mol</div>
        <div><b className="text-white">Pureza</b> {((salActual?.purity ?? 1) * 100).toFixed(1)} %</div>
        <div className="mt-1 text-slate-400">Cambiar de reactivo reinicia la práctica en el pre-laboratorio.</div>
      </div>
    </div>
  );

  // ── Controles por fase ───────────────────────────────────────────────────────
  let controles: React.ReactNode;
  if (phase === 'prelab') {
    controles = (
      <PreLab sal={salActual} mTarget={mTarget} vTarget={vTarget} mRequerida={mRequerida} onConfirm={() => setPhase('weighing')} />
    );
  } else if (phase === 'weighing') {
    controles = (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-baseline gap-1.5 rounded-lg border border-white/15 bg-black/60 px-3 py-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Balanza</span>
            <span className={`font-mono text-[20px] font-black tabular-nums ${!balanza.tara ? 'text-slate-400' : enRangoMasa ? 'text-emerald-400' : 'text-sky-300'}`}>{lecturaBalanza.toFixed(3)}</span>
            <span className="text-[11px] text-slate-400">g</span>
          </div>
          <Lectura etiqueta="Moles en platillo" valor={!balanza.tara ? '--' : ((balanza.polvo * (salActual?.purity ?? 1)) / (salActual?.pm ?? 58.44)).toFixed(4)} unidad="mol" />
          <Lectura etiqueta="Pureza" valor={((salActual?.purity ?? 1) * 100).toFixed(1)} unidad="%" />
          {balanza.tara && mRequerida > 0 && (
            <div className="min-w-[170px] flex-1">
              <div className="mb-0.5 flex justify-between text-[9px] text-slate-400">
                <span>0 g</span><span className="text-slate-300">Meta {mRequerida} g (±5 %)</span><span>{(mRequerida * 1.3).toFixed(1)} g</span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/15">
                <div className="absolute h-full rounded-full bg-emerald-500/30"
                  style={{ left: `${((1 - TOLERANCIA_Q5_REL) / 1.3) * 100}%`, width: `${((2 * TOLERANCIA_Q5_REL) / 1.3) * 100}%` }} />
                <div className={`absolute top-0 h-full w-1 rounded-full ${enRangoMasa ? 'bg-emerald-400' : 'bg-sky-400'}`}
                  style={{ left: `${Math.min(100, (balanza.polvo / (mRequerida * 1.3)) * 100)}%`, transform: 'translateX(-50%)' }} />
              </div>
              <div className="mt-0.5 text-center text-[10px]">
                <span className={enRangoMasa ? 'font-bold text-emerald-400' : 'text-slate-400'}>
                  {enRangoMasa ? '✓ En rango' : balanza.polvo > mRequerida ? 'Te pasaste: retira con la espátula' : 'Sigue añadiendo'}
                </span>
              </div>
            </div>
          )}
        </div>
        {!balanza.tara && (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/90">Activa TARA con el vidrio de reloj vacío antes de pesar</p>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <button onClick={() => { toggleTara(); audio?.playPop?.(); }}
            aria-label={balanza.tara ? 'Desactivar tara de la balanza' : 'Activar tara de la balanza'}
            aria-pressed={balanza.tara}
            className={`${btnPulso} ${balanza.tara ? 'bg-orange-500/90 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>
            Tara
          </button>
          <button
            onPointerDown={() => startPolvo(0.1, 80)} onPointerUp={stopPolvo} onPointerLeave={stopPolvo}
            disabled={!balanza.tara}
            aria-label="Añadir reactivo en cantidad gruesa (0.1 g)"
            className={`${btnPulso} bg-white/10 text-slate-200 hover:bg-white/15`}>
            + Grueso
          </button>
          <button
            onPointerDown={() => startPolvo(0.005, 60)} onPointerUp={stopPolvo} onPointerLeave={stopPolvo}
            disabled={!balanza.tara}
            aria-label="Añadir reactivo en cantidad fina (0.005 g)"
            className={`${btnPulso} bg-sky-600/70 text-white hover:bg-sky-500/80`}>
            + Fino
          </button>
          <button
            onPointerDown={() => startPolvo(-0.005, 60)} onPointerUp={stopPolvo} onPointerLeave={stopPolvo}
            disabled={!balanza.tara || balanza.polvo <= 0}
            aria-label="Retirar reactivo con la espátula (0.005 g)"
            className={`${btnPulso} bg-white/10 text-slate-200 hover:bg-white/15`}>
            − Retirar
          </button>
          <button onClick={handleTransfer} disabled={!canTransfer}
            className={`${btnPulso} min-w-[170px] bg-indigo-600 text-white hover:bg-indigo-500`}>
            Transferir al Matraz →
          </button>
        </div>
      </div>
    );
  } else if (phase === 'dissolving') {
    controles = (
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-200">Disolución en curso</span>
        <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-cyan-400" style={{ width: `${dissolveProgress * 100}%` }} />
        </div>
        <span className="font-mono text-[12px] text-slate-300">{Math.round(dissolveProgress * 100)} %</span>
      </div>
    );
  } else {
    controles = (
      <div className="flex items-stretch gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Lectura etiqueta="Soluto transferido" valor={matraz.polvo.toFixed(3)} unidad="g" />
            <Lectura etiqueta="Aforo" valor={`${vTarget} ± ${tolAforo.toFixed(1)}`} unidad="mL" />
            <Lectura etiqueta="Agua añadida" valor={matraz.agua.toFixed(1)} unidad="mL" acento={isAfored} />
            <div className="min-w-[120px] flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-white/15">
                <div className={`h-full rounded-full ${sobrepasaAforo(matraz.agua, vTarget) ? 'bg-red-500' : isPrecision ? 'bg-cyan-400' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, (matraz.agua / vTarget) * 100)}%` }} />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Droplet size={12} className="text-blue-400" /> Piseta</span>
            <button
              onPointerDown={() => startAgua(1, vTarget * 0.88)} onPointerUp={stopAgua} onPointerLeave={stopAgua}
              disabled={matraz.agua >= vTarget * 0.88}
              aria-label={`Llenado rápido — añadir agua en volumen grueso hasta el 88% (${(vTarget * 0.88).toFixed(0)} mL)`}
              className={`${btnPulso} min-w-[130px] bg-blue-600/80 text-white hover:bg-blue-500/90`}>
              Llenado Rápido
            </button>
            <button
              onPointerDown={() => { if (isPrecision) startAgua(0.05, vTarget + 5); }}
              onPointerUp={stopAgua} onPointerLeave={stopAgua}
              aria-label="Goteo de precisión — añadir agua gota a gota para ajustar al menisco"
              disabled={!isPrecision || isOverDiluted}
              className={`${btnPulso} min-w-[170px] border ${isPrecision && !isOverDiluted ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300' : 'border-white/15 bg-white/[0.04] text-slate-300'}`}>
              {isPrecision ? '● Goteo de Precisión' : 'Goteo (activa al 88%)'}
            </button>
            {isAfored && !canCertify && (
              <span className="flex h-9 items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                <CheckCircle2 size={14} /> Volumen exacto
              </span>
            )}
            {canCertify && (
              <button onClick={handleCertify}
                className="flex h-9 min-w-[170px] flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-600 px-3 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-emerald-500">
                <Award size={14} /> Certificar Solución
              </button>
            )}
          </div>
          {isPrecision && !isAfored && (
            <p className="text-[10px] uppercase tracking-wider text-cyan-300/80">Ajusta el menisco a la marca del cuello con el goteo de precisión</p>
          )}
        </div>
        {isPrecision && <LupaMenisco agua={matraz.agua} vTarget={vTarget} tol={tolAforo} />}
      </div>
    );
  }

  // El éxito lo anuncia el flujo común (quiz + modal); aquí sólo una nota en la franja de controles.
  if (status === 'success') {
    controles = (
      <div className="flex flex-col gap-2">
        {controles}
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-[12px] font-semibold text-emerald-300">
          <CheckCircle2 size={14} /> Solución preparada dentro de tolerancia
        </div>
      </div>
    );
  }

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} panelLateral={panelLateral} tituloPanel="Reactivos" />;
}
