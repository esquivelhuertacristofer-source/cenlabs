"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useSimuladorStore } from "@/store/simuladorStore";
import { 
  Zap, ChevronLeft, ChevronRight, BookOpen,
  RefreshCw, Info, Target, AlertCircle, Activity,
  FlaskConical, Gauge, ArrowRight, MousePointer2,
  CheckCircle2, XCircle, Trophy, TrendingUp, DollarSign
} from "lucide-react";

import Limitante3DScene from './simuladores/qmi04/Limitante3DScene';

export default function PilotoReactivoLimitante() {
  const { limitante, setInputMass, setReaccionLimitante, generarSemillaP4, audio, setAsistente } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [showAcademicInfo, setShowAcademicInfo] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [injectingIdx, setInjectingIdx] = useState<number | null>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const hudX = useTransform(mouseX, [-500, 500], [-10, 10]);

  const { 
    reaccionActual = 0, reacciones = [], inputMasses = [0, 0], 
    targetYield = 50,
    results = { moles: [0, 0], limitingIdx: -1, theoreticalYield: 0, excessMass: 0 },
    status = 'idle'
  } = limitante;

  const currentReac = reacciones[reaccionActual] || reacciones[0];

  // Logic for continuous injection (Valve)
  const injectionInterval = useRef<any>(null);

  useEffect(() => {
    if (injectingIdx !== null) {
      injectionInterval.current = setInterval(() => {
        setInputMass(injectingIdx, inputMasses[injectingIdx] + 0.5);
        if (Math.random() > 0.7) audio?.playClick();
      }, 50);
    } else {
      clearInterval(injectionInterval.current);
    }
    return () => clearInterval(injectionInterval.current);
  }, [injectingIdx, inputMasses]);

  useEffect(() => { 
    setMounted(true); 
    if (inputMasses[0] === 0) generarSemillaP4();
    
    setAsistente({
      visible: true,
      text: "¡Misión de Producción Activa! Mantén pulsados los tanques para inyectar masa. Tu objetivo es alcanzar el Rendimiento Teórico solicitado sin generar desperdicio.",
      pose: "thinking"
    });

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
        audio?.playNotification();
      } else {
        audio?.playError?.();
        audio?.playNotification();
      }
    }, 2500);
  };

  if (!mounted || !currentReac) return null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden font-['Outfit'] bg-[#01080E] text-white">
      
      {/* ── REPORTE DE CALIDAD (RESULT MODAL) ── */}
      <AnimatePresence>
        {showReport && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute z-[110] inset-0 flex items-center justify-center p-10 bg-black/90 backdrop-blur-3xl"
          >
            <motion.div 
              initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
              className={`w-full max-w-xl p-1 bg-gradient-to-b ${yieldAccuracy > 95 ? 'from-emerald-500/30' : 'from-red-500/30'} to-transparent rounded-[3.5rem]`}
            >
               <div className="bg-[#023047] p-10 rounded-[3.4rem] relative flex flex-col items-center text-center">
                  
                  {/* Icono de Estado */}
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${yieldAccuracy > 95 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {yieldAccuracy > 95 ? <Trophy size={48} /> : <AlertCircle size={48} />}
                  </div>

                  <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-2">
                    {yieldAccuracy > 95 ? 'Misión Cumplida' : 'Producción Fallida'}
                  </h2>
                  <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-8">Reporte de Control de Calidad #404</p>

                  <div className="grid grid-cols-2 gap-4 w-full mb-8">
                     <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Puntaje de Eficiencia</span>
                        <span className={`text-3xl font-black font-mono ${yieldAccuracy > 90 ? 'text-emerald-400' : 'text-yellow-400'}`}>{yieldAccuracy.toFixed(1)}%</span>
                     </div>
                     <div className="bg-white/5 p-6 rounded-3xl border border-white/10">
                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest block mb-1">Materia Perdida</span>
                        <span className="text-3xl font-black font-mono text-orange-400">{results.excessMass}g</span>
                     </div>
                  </div>

                  {/* Feedback Dinámico */}
                  <div className="bg-black/40 p-6 rounded-[2rem] border border-white/10 w-full text-left mb-10">
                     <div className="flex items-center gap-2 mb-2 text-cyan-400">
                        <Info size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Análisis del Ing. de Planta:</span>
                     </div>
                     <p className="text-sm text-white/70 italic leading-relaxed">
                        {yieldAccuracy > 95 
                          ? "¡Excelente trabajo! Has optimizado la masa de ambos reactivos. No hay desperdicio significativo y la producción es pura." 
                          : results.theoreticalYield < targetYield 
                            ? `Te faltaron ${(targetYield - results.theoreticalYield).toFixed(1)}g de producto. Inyecta más de ambos reactivos, pero cuida la proporción.`
                            : `Lograste la masa, pero generaste mucho desperdicio. Te sobró ${results.excessMass}g de ${results.limitingIdx === 0 ? currentReac.reactivos[1].formula : currentReac.reactivos[0].formula}. ¡Ajusta el ratio!`
                        }
                     </p>
                  </div>

                  <div className="flex gap-4 w-full">
                     <button 
                       onClick={() => { setShowReport(false); generarSemillaP4(); }}
                       className="flex-1 h-16 bg-white/10 hover:bg-white/20 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
                     >
                        Reintentar
                     </button>
                     <button 
                       onClick={() => setShowReport(false)}
                       className="flex-1 h-16 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                     >
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
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="max-w-2xl bg-[#023047] border border-cyan-500/30 p-12 rounded-[3.5rem] shadow-2xl relative"
            >
              <button onClick={() => setShowAcademicInfo(false)} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors">Cerrar</button>
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-4 bg-cyan-500/20 rounded-2xl text-cyan-400"><BookOpen size={32} /></div>
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter">Guía de Estequiometría</h2>
              </div>
              <div className="space-y-6 text-sm text-cyan-100/70 leading-relaxed">
                <p><strong className="text-white">Diferencia con QMI-03:</strong> Mientras que QMI-03 enseña a balancear la *ecuación* (teoría), QMI-04 enseña a gestionar la *producción* (práctica). Aquí el alumno debe enfrentar el hecho de que en la vida real la materia no viene en paquetes perfectos.</p>
                <p><strong className="text-white">Eficiencia Industrial:</strong> El "Monitor de Pérdida" muestra físicamente cuánta materia se desperdicia por no tener proporciones ideales. Esto introduce conceptos de economía circular y optimización de recursos.</p>
                <p><strong className="text-white">Reactivo Limitante:</strong> Es el componente que detiene la reacción. Al verlo visualmente como el "único que se agota", el alumno deja de memorizar fórmulas y empieza a entender la lógica molecular.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D REACTOR ENGINE ── */}
      <div className="absolute inset-0 z-0">
         <Limitante3DScene limitanteData={limitante} isRunning={isSynthesizing} />
      </div>

      {/* ── TOP HUD ── */}
      <header className="relative z-10 w-full px-12 pt-10 flex items-start justify-between pointer-events-none">
        <motion.div style={{ x: hudX }} className="flex flex-col pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${yieldAccuracy > 98 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-cyan-500 animate-pulse'} `} />
            <span className="text-[10px] font-black text-[#8ECAE6] uppercase tracking-[0.4em]">Stochiometric Analysis Unit</span>
          </div>
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-[2rem] border border-white/10">
            <button onClick={() => { setReaccionLimitante((reaccionActual + 3) % 4); audio?.playClick?.(); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><ChevronLeft size={20} /></button>
            <div className="flex flex-col min-w-[200px] items-center">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em] mb-1">Cámara de Síntesis 0{reaccionActual + 1}</span>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">{currentReac.nombre}</h1>
            </div>
            <button onClick={() => { setReaccionLimitante((reaccionActual + 1) % 4); audio?.playClick?.(); }} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><ChevronRight size={20} /></button>
          </div>
        </motion.div>

        {/* MISSION CARD */}
        <div className="flex items-center gap-4 pointer-events-auto">
           <div className="px-8 py-4 bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-[2rem] flex flex-col items-center shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-1">Misión de Producción</span>
              <div className="flex items-center gap-3">
                 <FlaskConical size={18} className="text-emerald-400" />
                 <span className="text-2xl font-black italic tracking-tighter">OBJETIVO: {targetYield}g <span className="text-xs">de {currentReac.productos[0].formula}</span></span>
              </div>
           </div>
           <button onClick={() => setShowAcademicInfo(true)} className="w-14 h-14 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400 transition-all"><Info size={24} /></button>
           <button onClick={() => { generarSemillaP4(); audio?.playClick?.(); }} className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 transition-all hover:text-white"><RefreshCw size={24} /></button>
        </div>
      </header>
      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-20">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Estado del Reactor Nuclear
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Limiting Reactant HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${results.moles[0] > 0 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Reactivo A</div>
              <div className={`text-sm font-black italic ${results.moles[0] > 0 ? 'text-cyan-400' : 'text-white/20'}`}>{results.moles[0] > 0 ? 'CARGADO' : 'VACÍO'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${results.moles[1] > 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Reactivo B</div>
              <div className={`text-sm font-black italic ${results.moles[1] > 0 ? 'text-yellow-400' : 'text-white/20'}`}>{results.moles[1] > 0 ? 'CARGADO' : 'VACÍO'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${yieldAccuracy > 90 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Eficiencia</div>
              <div className={`text-sm font-black italic ${yieldAccuracy > 90 ? 'text-emerald-400' : 'text-white/20'}`}>{yieldAccuracy > 90 ? 'OPTIMIZADA' : 'BAJA'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── VALVES (TACTILE INTERACTION) ── */}
      <main className="relative z-10 flex-1 w-full flex items-center justify-between px-20">
        
        {/* INYECTOR A */}
        <section className="flex flex-col items-center gap-6 pointer-events-auto">
           <motion.button 
             onMouseDown={() => setInjectingIdx(0)}
             onMouseUp={() => setInjectingIdx(null)}
             onMouseLeave={() => setInjectingIdx(null)}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className={`flex flex-col items-center bg-white/5 backdrop-blur-2xl border ${injectingIdx === 0 ? 'border-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.2)]' : 'border-white/10'} p-6 rounded-[3.5rem] transition-all cursor-pointer`}
           >
              <div className="w-full flex justify-between items-center mb-4">
                 <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{currentReac.reactivos[0].formula}</span>
                 <MousePointer2 size={14} className="text-white/20" />
              </div>
              
              <div className="flex flex-col items-center font-mono mb-4">
                 <span className="text-4xl font-black tracking-tighter">{inputMasses[0].toFixed(1)}<span className="text-xs text-white/30">g</span></span>
              </div>

              <div className="w-24 h-40 bg-black/40 rounded-[2rem] relative overflow-hidden p-1 border border-white/5">
                 <motion.div 
                   animate={{ height: `${Math.min(100, (inputMasses[0] / 100) * 100)}%` }}
                   className="absolute bottom-1 left-1 right-1 bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-[1.8rem]"
                 />
                 <div className="absolute inset-0 flex items-center justify-center font-black text-white/5 text-4xl italic">A</div>
              </div>
              
              <div className="mt-4 text-[8px] font-black text-white/40 uppercase tracking-widest animate-pulse">Mantener para Inyectar</div>
           </motion.button>
           <div className="px-4 py-2 bg-black/60 rounded-xl border border-cyan-500/20 text-center">
              <span className="text-[10px] font-black text-cyan-400/70 block uppercase">Moles Disponibles</span>
              <span className="text-xl font-black font-mono">{results.moles[0]}</span>
           </div>
        </section>

        {/* CENTRAL GAUGE */}
        <div className="relative flex flex-col items-center pointer-events-none">
           <div className="mb-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                 <FlaskConical size={14} className={isSynthesizing ? 'text-cyan-400 animate-bounce' : 'text-emerald-400'} />
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Precisión de Síntesis</span>
              </div>
              <div className="text-5xl font-black italic tracking-tighter flex items-baseline gap-2">
                 {yieldAccuracy.toFixed(1)}<span className="text-xl text-emerald-400">%</span>
              </div>
           </div>
           
           <div className="w-64 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 mb-8">
              <motion.div 
                animate={{ width: `${yieldAccuracy}%` }}
                className={`h-full shadow-[0_0_15px] transition-colors ${yieldAccuracy > 95 ? 'bg-emerald-500 shadow-emerald-500' : yieldAccuracy > 70 ? 'bg-cyan-500 shadow-cyan-500' : 'bg-red-500 shadow-red-500'}`}
              />
           </div>

           <div className="flex gap-4">
              <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center min-w-[140px]">
                 <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Ratio Estequiométrico</span>
                 <span className={`text-xl font-black italic ${ratioAccuracy > 95 ? 'text-emerald-400' : 'text-white'}`}>{currentRatio} : 1</span>
              </div>
              <div className="px-6 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex flex-col items-center min-w-[140px]">
                 <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-1">Eficiencia de Ratio</span>
                 <span className="text-xl font-black italic text-emerald-400">{ratioAccuracy.toFixed(1)}%</span>
              </div>
           </div>

           {/* MONITOR DE DESPERDICIO */}
           <AnimatePresence>
              {results.excessMass > 0.5 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                  className="absolute -right-36 top-0 flex flex-col items-center gap-2"
                >
                   <div className="w-2 h-40 bg-white/5 rounded-full relative overflow-hidden border border-white/10">
                      <motion.div 
                        animate={{ height: `${Math.min(100, (results.excessMass / 50) * 100)}%` }}
                        className="absolute bottom-0 w-full bg-orange-500 shadow-[0_0_20px_#f97316]"
                      />
                   </div>
                   <span className="text-[7px] font-black text-orange-400 uppercase [writing-mode:vertical-lr] rotate-180 tracking-[0.4em]">Materia de Desecho</span>
                </motion.div>
              )}
           </AnimatePresence>
        </div>

        {/* INYECTOR B */}
        <section className="flex flex-col items-center gap-6 pointer-events-auto">
           <motion.button 
             onMouseDown={() => setInjectingIdx(1)}
             onMouseUp={() => setInjectingIdx(null)}
             onMouseLeave={() => setInjectingIdx(null)}
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             className={`flex flex-col items-center bg-white/5 backdrop-blur-2xl border ${injectingIdx === 1 ? 'border-yellow-400 shadow-[0_0_40px_rgba(251,191,36,0.2)]' : 'border-white/10'} p-6 rounded-[3.5rem] transition-all cursor-pointer`}
           >
              <div className="w-full flex justify-between items-center mb-4">
                 <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{currentReac.reactivos[1].formula}</span>
                 <MousePointer2 size={14} className="text-white/20" />
              </div>
              
              <div className="flex flex-col items-center font-mono mb-4">
                 <span className="text-4xl font-black tracking-tighter">{inputMasses[1].toFixed(1)}<span className="text-xs text-white/30">g</span></span>
              </div>

              <div className="w-24 h-40 bg-black/40 rounded-[2rem] relative overflow-hidden p-1 border border-white/5">
                 <motion.div 
                   animate={{ height: `${Math.min(100, (inputMasses[1] / 100) * 100)}%` }}
                   className="absolute bottom-1 left-1 right-1 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-[1.8rem]"
                 />
                 <div className="absolute inset-0 flex items-center justify-center font-black text-white/5 text-4xl italic">B</div>
              </div>

              <div className="mt-4 text-[8px] font-black text-white/40 uppercase tracking-widest animate-pulse">Mantener para Inyectar</div>
           </motion.button>
           <div className="px-4 py-2 bg-black/60 rounded-xl border border-yellow-500/20 text-center">
              <span className="text-[10px] font-black text-yellow-400/70 block uppercase">Moles Disponibles</span>
              <span className="text-xl font-black font-mono">{results.moles[1]}</span>
           </div>
        </section>

      </main>

      {/* ── FOOTER DASHBOARD ── */}
      <footer className="relative z-20 w-full max-w-6xl pb-12 px-10 flex items-end gap-6">
         
         {/* RESULTADOS DE SÍNTESIS */}
         <div className="flex-1 grid grid-cols-3 gap-4 bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl">
            <div className="flex flex-col">
               <span className="text-[8px] font-black text-red-400 uppercase tracking-[0.4em] mb-1">Limitante Crítico</span>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400"><Target size={18} /></div>
                  <span className="text-2xl font-black italic tracking-tighter text-red-500">
                    {results.limitingIdx !== -1 ? currentReac.reactivos[results.limitingIdx].formula : '---'}
                  </span>
               </div>
            </div>

            <div className="flex flex-col">
               <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-1">Rendimiento Actual</span>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"><Activity size={18} /></div>
                  <span className={`text-2xl font-black italic tracking-tighter ${yieldAccuracy > 95 ? 'text-emerald-400' : 'text-white'}`}>
                    {results.theoreticalYield} <span className="text-xs">g</span>
                  </span>
               </div>
            </div>

            <div className="flex flex-col">
               <span className="text-[8px] font-black text-orange-400 uppercase tracking-[0.4em] mb-1">Materia en Exceso</span>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400"><ArrowRight size={18} /></div>
                  <span className="text-2xl font-black italic tracking-tighter text-orange-400">
                    {results.excessMass} <span className="text-xs">g</span>
                  </span>
               </div>
            </div>
         </div>

         <button 
           disabled={isSynthesizing || inputMasses[0] === 0 || inputMasses[1] === 0}
           onClick={startSynthesis}
           className={`group relative h-24 px-12 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all overflow-hidden ${isSynthesizing ? 'bg-white/5 text-white/20' : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_15px_40px_rgba(6,182,212,0.3)] active:scale-95'}`}
         >
           <div className="relative z-10 flex flex-col items-center">
              {isSynthesizing ? (
                <>
                  <RefreshCw size={24} className="animate-spin mb-1" />
                  <span>Sintetizando...</span>
                </>
              ) : (
                <>
                  <Zap size={24} className="mb-1" />
                  <span>Iniciar Ciclo</span>
                </>
              )}
           </div>
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
         </button>

      </footer>

      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
