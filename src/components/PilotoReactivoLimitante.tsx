"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimuladorStore } from "@/store/simuladorStore";
import {
  Zap, ChevronLeft, ChevronRight, BookOpen,
  RefreshCw, Info, Target, AlertCircle,
  FlaskConical, ArrowRight, MousePointer2,
  CheckCircle2, Trophy, TrendingUp
} from "lucide-react";
import { useRouter } from 'next/navigation';

import Limitante3DScene from './simuladores/qmi04/Limitante3DScene';

export default function PilotoReactivoLimitante() {
  const router = useRouter();
  const { limitante, setInputMass, setReaccionLimitante, generarSemillaP4, validarP4, audio, setAsistente } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showAcademicInfo, setShowAcademicInfo] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [injectingIdx, setInjectingIdx] = useState<number | null>(null);

  const {
    reaccionActual = 0, reacciones = [], inputMasses = [0, 0],
    targetYield = 50,
    results = { moles: [0, 0], limitingIdx: -1, theoreticalYield: 0, excessMass: 0 },
    status = 'idle'
  } = limitante;

  const currentReac = reacciones[reaccionActual] || reacciones[0];

  const injectionInterval = useRef<any>(null);

  useEffect(() => {
    if (injectingIdx !== null) {
      injectionInterval.current = setInterval(() => {
        const currentMass = useSimuladorStore.getState().limitante.inputMasses[injectingIdx];
        setInputMass(injectingIdx, currentMass + 0.5);
        if (Math.random() > 0.7) audio?.playClick();
      }, 50);
    } else {
      clearInterval(injectionInterval.current);
    }
    return () => clearInterval(injectionInterval.current);
  }, [injectingIdx]);

  useEffect(() => {
    setMounted(true);
    if (inputMasses[0] === 0) generarSemillaP4();
    setAsistente({ visible: false });
    return () => setAsistente({ visible: false });
  }, []);

  const currentRatio = useMemo(() => {
    if (results.moles[1] === 0) return 0;
    return parseFloat((results.moles[0] / results.moles[1]).toFixed(2));
  }, [results.moles]);

  const targetRatio = useMemo(() => {
    if (!currentReac?.reactivos) return 1;
    return (currentReac.reactivos[0]?.coef || 1) / (currentReac.reactivos[1]?.coef || 1);
  }, [currentReac]);

  const ratioAccuracy = useMemo(() => {
    if (!targetRatio) return 0;
    const acc = 100 - Math.abs((currentRatio / targetRatio) - 1) * 100;
    return Math.max(0, Math.min(100, acc));
  }, [currentRatio, targetRatio]);

  const yieldAccuracy = useMemo(() => {
    const acc = 100 - Math.abs((results.theoreticalYield / targetYield) - 1) * 100;
    return Math.max(0, Math.min(100, acc));
  }, [results.theoreticalYield, targetYield]);

  const startSynthesis = () => {
    setIsSynthesizing(true);
    audio?.playClick();
    audio?.playNotification();
    setTimeout(() => {
      setIsSynthesizing(false);
      setShowReport(true);
      if (yieldAccuracy > 95 && ratioAccuracy > 95) {
        audio?.playSuccess?.();
        validarP4(results.limitingIdx, results.excessMass);
      } else {
        audio?.playError?.();
      }
    }, 2500);
  };

  if (!mounted || !currentReac) return null;

  return (
    <div className="relative w-full h-full overflow-hidden font-['Outfit'] bg-[#01080E] text-white">

      {/* ── OVERLAY ÉXITO ── */}
      <AnimatePresence>
        {status === 'success' && !showReport && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute z-[120] inset-0 flex items-center justify-center p-10 bg-black/80 backdrop-blur-3xl"
          >
            <motion.div initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md p-1 bg-gradient-to-b from-emerald-500/40 to-transparent rounded-[3.5rem]">
              <div className="bg-[#012a1a] p-12 rounded-[3.4rem] flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
                  <Trophy size={48} />
                </div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2 text-emerald-400">Certificado</h2>
                <p className="text-white/60 text-sm mb-8 leading-relaxed">
                  Has identificado correctamente el reactivo limitante y optimizado la producción.
                </p>
                <button onClick={() => generarSemillaP4()}
                  className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black uppercase text-xs tracking-widest transition-all mb-3">
                  Nueva Misión
                </button>
                <button onClick={() => router.push('/hub')}
                  className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                  Cerrar Laboratorio
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REPORTE ── */}
      <AnimatePresence>
        {showReport && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute z-[110] inset-0 flex items-center justify-center p-10 bg-black/90 backdrop-blur-3xl"
          >
            <motion.div initial={{ scale: 0.85, y: 40 }} animate={{ scale: 1, y: 0 }}
              className={`w-full max-w-xl p-1 bg-gradient-to-b ${yieldAccuracy > 95 ? 'from-emerald-500/30' : 'from-red-500/30'} to-transparent rounded-[3.5rem]`}>
              <div className="bg-[#023047] p-10 rounded-[3.4rem] flex flex-col items-center text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${yieldAccuracy > 95 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {yieldAccuracy > 95 ? <Trophy size={48} /> : <AlertCircle size={48} />}
                </div>
                <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-1">
                  {yieldAccuracy > 95 ? 'Misión Cumplida' : 'Producción Fallida'}
                </h2>
                <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] mb-8">Control de Calidad</p>

                <div className="grid grid-cols-2 gap-4 w-full mb-6">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Eficiencia</span>
                    <span className={`text-3xl font-black font-mono ${yieldAccuracy > 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>{yieldAccuracy.toFixed(1)}%</span>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Desperdicio</span>
                    <span className="text-3xl font-black font-mono text-orange-400">{results.excessMass}g</span>
                  </div>
                </div>

                <div className="bg-black/40 p-5 rounded-[2rem] border border-white/10 w-full text-left mb-8">
                  <p className="text-sm text-white/60 italic leading-relaxed">
                    {yieldAccuracy > 95
                      ? "Proporciones perfectas. Sin desperdicio, producción óptima."
                      : results.theoreticalYield < targetYield
                        ? `Faltan ${(targetYield - results.theoreticalYield).toFixed(1)}g. Inyecta más de ambos reactivos cuidando la proporción.`
                        : `Exceso de ${results.excessMass}g de ${results.limitingIdx === 0 ? currentReac.reactivos[1].formula : currentReac.reactivos[0].formula}. Ajusta el ratio.`
                    }
                  </p>
                </div>

                <div className="flex gap-4 w-full">
                  <button onClick={() => { setShowReport(false); generarSemillaP4(); }}
                    className="flex-1 h-14 bg-white/10 hover:bg-white/20 rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                    Reintentar
                  </button>
                  <button onClick={() => setShowReport(false)}
                    className="flex-1 h-14 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black uppercase text-xs tracking-widest transition-all">
                    Aceptar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INFO ACADÉMICA ── */}
      <AnimatePresence>
        {showAcademicInfo && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute z-[100] inset-0 flex items-center justify-center p-10 bg-black/80 backdrop-blur-2xl"
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="max-w-2xl bg-[#023047] border border-cyan-500/30 p-12 rounded-[3.5rem] shadow-2xl relative">
              <button onClick={() => setShowAcademicInfo(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">Cerrar</button>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-cyan-500/20 rounded-2xl text-cyan-400"><BookOpen size={32} /></div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Reactivo Limitante</h2>
              </div>
              <div className="space-y-5 text-sm text-cyan-100/70 leading-relaxed">
                <p><strong className="text-white">Reactivo Limitante:</strong> El componente que se agota primero y detiene la reacción. Aumentar el otro reactivo no produce más producto.</p>
                <p><strong className="text-white">Reactivo en Exceso:</strong> Lo que sobra una vez que el limitante se consume. Ese sobrante es desperdicio industrial.</p>
                <p><strong className="text-white">Ratio estequiométrico:</strong> La proporción exacta de moles que la ecuación química exige. Ajusta ambas masas para alcanzarlo.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D ENGINE ── */}
      <div className="absolute inset-0 z-0">
        <Limitante3DScene limitanteData={limitante} isRunning={isSynthesizing} />
      </div>

      {/* ── HEADER ── */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-start justify-between px-10 pt-8 pointer-events-none">

        {/* Selector de reacción */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 p-2 rounded-[2rem] pointer-events-auto">
          <button onClick={() => { setReaccionLimitante((reaccionActual + 3) % 4); audio?.playClick?.(); }}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all"><ChevronLeft size={18} /></button>
          <div className="px-4 text-center min-w-[160px]">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em] block">Síntesis 0{reaccionActual + 1}</span>
            <span className="text-lg font-black tracking-tighter uppercase">{currentReac.nombre}</span>
          </div>
          <button onClick={() => { setReaccionLimitante((reaccionActual + 1) % 4); audio?.playClick?.(); }}
            className="p-3 hover:bg-white/10 rounded-2xl transition-all"><ChevronRight size={18} /></button>
        </div>

        {/* Objetivo + acciones */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="px-6 py-3 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/20 rounded-[1.5rem] flex items-center gap-3">
            <FlaskConical size={16} className="text-emerald-400 shrink-0" />
            <div>
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.4em] block leading-none mb-0.5">Objetivo</span>
              <span className="text-xl font-black italic tracking-tighter">{targetYield}g <span className="text-xs font-medium text-white/50">{currentReac.productos[0].formula}</span></span>
            </div>
          </div>
          <button onClick={() => setShowAcademicInfo(true)}
            className="w-12 h-12 rounded-2xl bg-black/50 hover:bg-cyan-500/20 border border-white/10 flex items-center justify-center text-white/40 hover:text-cyan-400 transition-all backdrop-blur-xl">
            <Info size={18} />
          </button>
          <button onClick={() => { generarSemillaP4(); audio?.playClick?.(); }}
            className="w-12 h-12 rounded-2xl bg-black/50 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all backdrop-blur-xl">
            <RefreshCw size={18} />
          </button>
        </div>
      </header>

      {/* ── INYECTORES + GAUGE CENTRAL ── */}
      <div className="absolute inset-0 z-10 flex items-center justify-between px-16 pointer-events-none">

        {/* INYECTOR A */}
        <motion.button
          onMouseDown={() => setInjectingIdx(0)}
          onMouseUp={() => setInjectingIdx(null)}
          onMouseLeave={() => setInjectingIdx(null)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className={`flex flex-col items-center gap-3 p-6 rounded-[3rem] backdrop-blur-2xl border transition-all cursor-pointer pointer-events-auto
            ${injectingIdx === 0
              ? 'bg-cyan-500/15 border-cyan-400/60 shadow-[0_0_40px_rgba(34,211,238,0.15)]'
              : 'bg-black/40 border-white/10'}`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-black text-cyan-400 tracking-widest">{currentReac.reactivos[0].formula}</span>
            <MousePointer2 size={12} className="text-white/20" />
          </div>

          <div className="w-20 h-36 bg-black/50 rounded-[1.5rem] relative overflow-hidden border border-white/5">
            <motion.div
              animate={{ height: `${Math.min(100, (inputMasses[0] / 100) * 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-cyan-700 to-cyan-400 rounded-b-[1.5rem]"
            />
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white/5 italic">A</div>
          </div>

          <div className="text-center">
            <span className="text-2xl font-black font-mono tracking-tighter">{inputMasses[0].toFixed(1)}<span className="text-xs text-white/30">g</span></span>
            <span className="text-[9px] font-black text-cyan-400/60 uppercase block">{results.moles[0]} mol</span>
          </div>

          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest animate-pulse">
            {injectingIdx === 0 ? '● Inyectando' : 'Mantener'}
          </span>
        </motion.button>

        {/* GAUGE CENTRAL */}
        <div className="flex flex-col items-center gap-5 pointer-events-none">

          {/* Precisión */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Precisión de Síntesis</span>
            <motion.span
              key={yieldAccuracy.toFixed(0)}
              initial={{ scale: 0.9, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-6xl font-black italic tracking-tighter ${
                yieldAccuracy > 95 ? 'text-emerald-400' : yieldAccuracy > 70 ? 'text-cyan-400' : 'text-red-400'
              }`}
            >
              {yieldAccuracy.toFixed(0)}<span className="text-2xl">%</span>
            </motion.span>
          </div>

          {/* Barra de progreso */}
          <div className="w-56 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${yieldAccuracy}%` }}
              transition={{ type: 'spring', stiffness: 80 }}
              className={`h-full ${yieldAccuracy > 95 ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]' : yieldAccuracy > 70 ? 'bg-cyan-500' : 'bg-red-500'}`}
            />
          </div>

          {/* Ratio estequiométrico — solo 1 dato, compacto */}
          <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all ${ratioAccuracy > 95 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/60'}`}>
            <TrendingUp size={14} />
            <span className="text-sm font-black font-mono">{currentRatio} : 1</span>
            <span className="text-[9px] font-black text-white/30 uppercase">ratio</span>
          </div>

          {/* Monitor de desperdicio — sutil */}
          <AnimatePresence>
            {results.excessMass > 0.5 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{results.excessMass}g exceso</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* INYECTOR B */}
        <motion.button
          onMouseDown={() => setInjectingIdx(1)}
          onMouseUp={() => setInjectingIdx(null)}
          onMouseLeave={() => setInjectingIdx(null)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          className={`flex flex-col items-center gap-3 p-6 rounded-[3rem] backdrop-blur-2xl border transition-all cursor-pointer pointer-events-auto
            ${injectingIdx === 1
              ? 'bg-yellow-500/15 border-yellow-400/60 shadow-[0_0_40px_rgba(251,191,36,0.15)]'
              : 'bg-black/40 border-white/10'}`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-sm font-black text-yellow-400 tracking-widest">{currentReac.reactivos[1].formula}</span>
            <MousePointer2 size={12} className="text-white/20" />
          </div>

          <div className="w-20 h-36 bg-black/50 rounded-[1.5rem] relative overflow-hidden border border-white/5">
            <motion.div
              animate={{ height: `${Math.min(100, (inputMasses[1] / 100) * 100)}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-yellow-700 to-yellow-400 rounded-b-[1.5rem]"
            />
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black text-white/5 italic">B</div>
          </div>

          <div className="text-center">
            <span className="text-2xl font-black font-mono tracking-tighter">{inputMasses[1].toFixed(1)}<span className="text-xs text-white/30">g</span></span>
            <span className="text-[9px] font-black text-yellow-400/60 uppercase block">{results.moles[1]} mol</span>
          </div>

          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest animate-pulse">
            {injectingIdx === 1 ? '● Inyectando' : 'Mantener'}
          </span>
        </motion.button>
      </div>

      {/* ── FOOTER ── */}
      <footer className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-10 pb-8 gap-6">

        {/* Status strip — compact */}
        <div className="flex items-center gap-6 bg-black/50 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-[2rem]">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-red-400" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Limitante</span>
            <span className="text-base font-black text-red-400 italic ml-1">
              {results.limitingIdx !== -1 ? currentReac.reactivos[results.limitingIdx].formula : '—'}
            </span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className={yieldAccuracy > 95 ? 'text-emerald-400' : 'text-white/20'} />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Producción</span>
            <span className={`text-base font-black italic ml-1 ${yieldAccuracy > 95 ? 'text-emerald-400' : 'text-white'}`}>
              {results.theoreticalYield}g
            </span>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="flex items-center gap-2">
            <ArrowRight size={14} className="text-orange-400" />
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Exceso</span>
            <span className="text-base font-black italic text-orange-400 ml-1">{results.excessMass}g</span>
          </div>
        </div>

        {/* Botón Sintetizar */}
        <motion.button
          disabled={isSynthesizing || inputMasses[0] === 0 || inputMasses[1] === 0}
          onClick={startSynthesis}
          whileHover={!isSynthesizing ? { scale: 1.03 } : {}}
          whileTap={!isSynthesizing ? { scale: 0.96 } : {}}
          className={`flex items-center gap-4 h-16 px-10 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-colors
            ${isSynthesizing
              ? 'bg-white/5 text-white/20 cursor-wait'
              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_10px_30px_rgba(6,182,212,0.25)]'}`}
        >
          {isSynthesizing
            ? <><RefreshCw size={20} className="animate-spin" /> Sintetizando...</>
            : <><Zap size={20} /> Iniciar Ciclo</>
          }
        </motion.button>
      </footer>
    </div>
  );
}
