"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { useSimuladorStore } from "@/store/simuladorStore";
import { 
  Activity, ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, 
  Lock, BookOpen, Info
} from "lucide-react";
import { audio } from '@/utils/audioEngine';

import Fusion3DScene from './simuladores/qmi03/Fusion3DScene';

export default function PilotoBalanceoEcuaciones() {
  const { balanceo, setReaccion, resetBalanceo, setCoeficiente } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showAcademicInfo, setShowAcademicInfo] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const hudX = useTransform(mouseX, [-500, 500], [-10, 10]);

  useEffect(() => { setMounted(true); }, []);

  const { 
    reaccionActual = 0, reacciones = [], coeficientes = [], isBalanced = false, 
    atomosReactivos = {}, atomosProductos = {}, masaReactivos = 0, masaProductos = 0,
    reaccionesCompletadas = []
  } = balanceo || {};

  const currentReac = reacciones[reaccionActual] || reacciones[0];
  const isCurrentCompleted = reaccionesCompletadas.includes(currentReac?.id);
  const nextUnlocked = isCurrentCompleted;

  const allSymbols = useMemo(() => Array.from(new Set([
    ...Object.keys(atomosReactivos || {}),
    ...Object.keys(atomosProductos || {})
  ])), [atomosReactivos, atomosProductos]);

  const handleCoefChange = (idx: number, delta: number) => {
    const newVal = Math.max(1, (coeficientes[idx] || 1) + delta);
    setCoeficiente(idx, newVal);
    audio?.playClick();
  };

  useEffect(() => {
    if (isBalanced && !isCurrentCompleted) {
      setShowLevelUp(true);
      audio?.playSuccess();
      audio?.playNotification();
      const timer = setTimeout(() => setShowLevelUp(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isBalanced, isCurrentCompleted, audio, currentReac?.nombre]);

  if (!mounted || !currentReac) return null;

  const handleLevelChange = (delta: number) => {
    const nextIdx = (reaccionActual + delta + reacciones.length) % reacciones.length;
    if (delta > 0 && !nextUnlocked) {
       return;
    }
    setReaccion(nextIdx);
    audio?.playClick();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between overflow-hidden font-['Outfit'] bg-[#010B13] text-white">
      
      {/* ── INFO ACADÉMICA ── */}
      <AnimatePresence>
        {showAcademicInfo && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-[100] inset-0 flex items-center justify-center p-10 bg-black/80 backdrop-blur-2xl pointer-events-auto"
          >
            <div className="max-w-2xl bg-[#023047] border border-cyan-500/30 p-10 rounded-[3rem] shadow-2xl relative">
              <button onClick={() => setShowAcademicInfo(false)} className="absolute top-6 right-6 text-white/40 hover:text-white">Cerrar</button>
              <BookOpen className="text-cyan-400 mb-6" size={48} />
              <h2 className="text-3xl font-black mb-4 uppercase italic tracking-tighter">Guía para el Docente</h2>
              <div className="space-y-4 text-sm text-cyan-100/70 leading-relaxed">
                <p><strong className="text-white">Objetivo:</strong> Demostrar la Ley de Conservación de la Materia mediante el balanceo de ecuaciones estequiométricas.</p>
                <p><strong className="text-white">Mecánica:</strong> El alumno debe ajustar los coeficientes para igualar el número de átomos en reactivos y productos. El sistema monitoriza la masa molar en tiempo real.</p>
                <p><strong className="text-white">Progreso:</strong> Los niveles están bloqueados para asegurar que el alumno domina reacciones simples antes de pasar a síntesis complejas.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ALERTA DE NIVEL COMPLETADO ── */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }} animate={{ y: 50, opacity: 1 }} exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 z-50 bg-emerald-500 text-white px-8 py-4 rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center gap-4 border border-emerald-400/50 backdrop-blur-xl"
          >
            <ShieldCheck size={32} className="animate-bounce" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Sincronía Detectada</span>
              <span className="text-xl font-black italic">PRÓXIMA REACCIÓN DESBLOQUEADA</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D ENGINE ── */}
      <div className="absolute inset-0 z-0">
         <Fusion3DScene balanceo={balanceo} />
      </div>

      {/* ── TOP HUD ── */}
      <header className="relative z-30 w-full px-12 pt-10 flex items-start justify-between pointer-events-none">
        <motion.div style={{ x: hudX }} className="flex flex-col pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-2 h-2 rounded-full ${isBalanced ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-orange-500 animate-pulse'} `} />
            <span className="text-[10px] font-black text-[#8ECAE6] uppercase tracking-[0.4em]">Protocolo de Forge Atómico</span>
          </div>
          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-[2rem] border border-white/10 shadow-2xl">
            <button onClick={() => handleLevelChange(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"><ChevronLeft size={20} /></button>
            <div className="flex flex-col min-w-[200px] items-center">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em] mb-1">Cámara de Reacción {reaccionActual + 1}</span>
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">{currentReac.nombre}</h1>
            </div>
            <button 
              onClick={() => handleLevelChange(1)} 
              className={`p-3 border rounded-2xl transition-all relative ${nextUnlocked ? 'bg-white/5 border-white/10 hover:bg-white/10 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400/50 cursor-not-allowed group'}`}
            >
              {nextUnlocked ? <ChevronRight size={20} /> : <Lock size={20} />}
              {!nextUnlocked && (
                <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-32 py-2 px-3 bg-red-500 text-white text-[8px] font-black uppercase rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Balancea para Desbloquear
                </div>
              )}
            </button>
          </div>
        </motion.div>

        <div className="flex items-center gap-4 pointer-events-auto">
           <button 
             onClick={() => setShowAcademicInfo(true)}
             className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 transition-all font-black text-[10px] uppercase tracking-widest"
           >
             <Info size={16} /> Objetivos Pedagógicos
           </button>
           <button onClick={resetBalanceo} className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 transition-all hover:text-white shadow-2xl"><RefreshCw size={18} /></button>
        </div>
      </header>

      {/* ── DATA OVERLAYS ── */}
      <main className="relative z-10 flex-1 w-full flex items-center justify-center pointer-events-none">
        
        {/* CHECKLIST HUD (DIAMOND STANDARD) */}
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[500px] pointer-events-none">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} className="animate-pulse" /> Sincronía del Reactor
              </span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Lavoisier Protocol</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border transition-all ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[8px] font-black uppercase text-white/40 mb-1">Equilibrio Atómico</div>
                <div className={`text-xs font-black italic ${isBalanced ? 'text-emerald-400' : 'text-white'}`}>{isBalanced ? 'CONSERVADO' : 'EN DESFASE'}</div>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${Math.abs(masaReactivos - masaProductos) < 0.01 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[8px] font-black uppercase text-white/40 mb-1">Masa Σm(R) = Σm(P)</div>
                <div className={`text-xs font-black italic ${Math.abs(masaReactivos - masaProductos) < 0.01 ? 'text-emerald-400' : 'text-white'}`}>{Math.abs(masaReactivos - masaProductos) < 0.01 ? 'SYNC AL 100%' : `${Math.abs(masaReactivos - masaProductos).toFixed(1)}g DELTA`}</div>
              </div>
              <div className="p-4 rounded-2xl border border-white/5 bg-white/5">
                <div className="text-[8px] font-black uppercase text-white/40 mb-1">Nivel Actual</div>
                <div className="text-xs font-black text-white italic">{reaccionActual + 1} DE {reacciones.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL IZQUIERDO */}
        <section className="absolute left-12 top-1/2 -translate-y-1/2 w-64 z-20 pointer-events-auto">
          <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
            <h3 className="text-[10px] font-black text-[#8ECAE6] uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
              <Activity size={12} className="text-cyan-400" /> Reactivos (Entrada)
            </h3>
            {allSymbols.map(sym => (
              <div key={sym} className="mb-4">
                <div className="flex justify-between text-[10px] font-black font-mono mb-1">
                  <span className="text-white/60">{sym}</span>
                  <span className="text-cyan-400">{atomosReactivos[sym] || 0}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${Math.min(100, (atomosReactivos[sym] || 0) * 10)}%` }} className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* PANEL DERECHO */}
        <section className="absolute right-12 top-1/2 -translate-y-1/2 w-64 z-20 pointer-events-auto">
           <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl">
            <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
              <Activity size={12} className="text-orange-400" /> Productos (Salida)
            </h3>
            {allSymbols.map(sym => (
              <div key={sym} className="mb-4">
                <div className="flex justify-between text-[10px] font-black font-mono mb-1">
                  <span className="text-white/60">{sym}</span>
                  <span className="text-orange-400">{atomosProductos[sym] || 0}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${Math.min(100, (atomosProductos[sym] || 0) * 10)}%` }} className="h-full bg-orange-500 shadow-[0_0_10px_#f97316]" />
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* BARRA DE MASA CENTRAL (DIAMOND TELEMETRY) */}
        <div className="absolute top-[500px] left-1/2 -translate-x-1/2 pointer-events-auto">
           <motion.div layout className="flex items-center gap-12 px-12 py-8 bg-black/80 rounded-[3rem] border border-white/10 shadow-2xl backdrop-blur-3xl min-w-[500px] justify-between">
              <div className="text-center">
                <span className="text-[10px] font-black text-cyan-400 block uppercase mb-2 tracking-widest">Inyectado (R)</span>
                <span className="text-4xl font-black font-mono text-cyan-100 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">{masaReactivos.toFixed(1)}<span className="text-xs ml-1 opacity-40">g</span></span>
              </div>
              
              <div className="flex-1 flex flex-col items-center">
                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative mb-4">
                    <motion.div 
                      animate={{ 
                        left: `${(masaReactivos / (masaReactivos + masaProductos || 1)) * 100}%` 
                      }} 
                      className="absolute top-0 w-2 h-full bg-white shadow-[0_0_20px_white]" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-transparent to-orange-500/20" />
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${isBalanced ? 'text-emerald-400' : 'text-white/20'}`}>
                    {isBalanced ? 'Sincronía Atómica' : 'Equilibrando Materia'}
                 </span>
              </div>

              <div className="text-center">
                <span className="text-[10px] font-black text-orange-400 block uppercase mb-2 tracking-widest">Producido (P)</span>
                <span className="text-4xl font-black font-mono text-orange-100 drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]">{masaProductos.toFixed(1)}<span className="text-xs ml-1 opacity-40">g</span></span>
              </div>
           </motion.div>
        </div>
      </main>

      {/* ── DIAMOND DOCK (COEFFICIENT CONTROLS) ── */}
      <footer className="relative z-40 w-full flex flex-col items-center gap-6 pb-12">
        <div className="flex items-center gap-8 px-10 py-6 bg-slate-950/60 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
           {/* REACTIVOS DOCK */}
           <div className="flex items-center gap-4 pr-8 border-r border-white/5">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest rotate-180 [writing-mode:vertical-lr]">Reactivos</span>
              {currentReac.reactivos.map((mol: any, idx: number) => (
                <div key={idx} className="flex flex-col items-center gap-3">
                  <span className="text-[10px] font-black text-white/40 font-mono" dangerouslySetInnerHTML={{ __html: mol.formula.replace(/(\d+)/g, '<sub>$1</sub>') }} />
                  <div className="flex flex-col items-center bg-white/5 rounded-2xl p-1 border border-white/5">
                    <button onClick={() => handleCoefChange(idx, 1)} className="p-2 hover:bg-cyan-500 text-white rounded-xl transition-all active:scale-90"><ChevronLeft size={16} className="rotate-90" /></button>
                    <div className="w-10 text-center font-black text-2xl text-cyan-400 font-mono py-2">{coeficientes[idx] || 1}</div>
                    <button onClick={() => handleCoefChange(idx, -1)} className="p-2 hover:bg-white/10 text-white/40 rounded-xl transition-all active:scale-90"><ChevronLeft size={16} className="-rotate-90" /></button>
                  </div>
                </div>
              ))}
           </div>

           <div className="text-2xl font-black text-white/20">→</div>

           {/* PRODUCTOS DOCK */}
           <div className="flex items-center gap-4 pl-8">
              {currentReac.productos.map((mol: any, idx: number) => {
                const globalIdx = currentReac.reactivos.length + idx;
                return (
                  <div key={globalIdx} className="flex flex-col items-center gap-3">
                    <span className="text-[10px] font-black text-white/40 font-mono" dangerouslySetInnerHTML={{ __html: mol.formula.replace(/(\d+)/g, '<sub>$1</sub>') }} />
                    <div className="flex flex-col items-center bg-white/5 rounded-2xl p-1 border border-white/5">
                      <button onClick={() => handleCoefChange(globalIdx, 1)} className="p-2 hover:bg-orange-500 text-white rounded-xl transition-all active:scale-90"><ChevronLeft size={16} className="rotate-90" /></button>
                      <div className="w-10 text-center font-black text-2xl text-orange-400 font-mono py-2">{coeficientes[globalIdx] || 1}</div>
                      <button onClick={() => handleCoefChange(globalIdx, -1)} className="p-2 hover:bg-white/10 text-white/40 rounded-xl transition-all active:scale-90"><ChevronLeft size={16} className="-rotate-90" /></button>
                    </div>
                  </div>
                );
              })}
              <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest [writing-mode:vertical-lr]">Productos</span>
           </div>
        </div>

        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">Ajusta los coeficientes para lograr el equilibrio atómico</p>
      </footer>

    </div>
  );
}
