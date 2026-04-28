"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { 
  Target, Tablet, X, Info, ShieldCheck, 
  FlaskConical, MousePointer2, Thermometer, Droplet, Zap,
  ChevronLeft, ChevronRight, RefreshCw, BookOpen, Scale,
  Layers, Beaker, AlertCircle, Activity
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

import Soluciones3DScene from './simuladores/qmi05/Soluciones3DScene';

export default function PilotoPreparacionSoluciones() {
  const { soluciones, addPolvo, toggleTara, transferirPolvo, setAgua, setHolding, toggleJar, audio, setAsistente } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const [showAcademicInfo, setShowAcademicInfo] = useState(false);
  const [isDripping, setIsDripping] = useState(false);
  
  const { 
    sal = { nombre: 'Cloruro de Sodio', formula: 'NaCl', pm: 58.44, purity: 0.985 }, 
    balanza = { polvo: 0, tara: false, encendida: true }, 
    matraz = { polvo: 0, agua: 0 }, 
    interaccion = { holding: null, jarraAbierta: false },
    mTarget = 0.5, vTarget = 250
  } = soluciones || {};

  const isPrecisionMode = matraz.agua > vTarget * 0.9 && matraz.agua < vTarget * 1.05;

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "La preparación de soluciones requiere paciencia. Pesa el soluto con exactitud y, al llegar a la marca de aforo, usa el 'Modo Goteo' para no pasarte.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // Molaridad y Precisión
  const effectivePolvo = matraz.polvo * (sal?.purity || 1.0);
  const currentMolarity = matraz.agua > 0 ? (effectivePolvo / (sal?.pm || 58.44)) / (matraz.agua / 1000) : 0;
  const accuracy = Math.max(0, 100 - Math.abs((currentMolarity - mTarget) / mTarget) * 100);

  // Lógica de Goteo y Alertas de Voz
  useEffect(() => {
    let interval: any;
    if (isDripping) {
      interval = setInterval(() => {
        const nextAgua = useSimuladorStore.getState().soluciones.matraz.agua + 0.1;
        setAgua(Math.min(vTarget + 5, nextAgua));
        if (Math.random() > 0.8) audio?.playClick?.();
        
        // Alerta de proximidad al aforo
        if (nextAgua > vTarget - 0.5 && nextAgua < vTarget) {
           // Podríamos añadir un sonido de advertencia suave aquí
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isDripping, vTarget, setAgua, audio]);

  // Alerta de Overfill y Éxito de Aforo
  useEffect(() => {
    if (matraz.agua > vTarget + 0.5) {
      audio?.playError();
      audio?.playNotification();
    } else if (Math.abs(matraz.agua - vTarget) < 0.05 && matraz.polvo > 0) {
      audio?.playSuccess();
      audio?.playNotification();
    }
  }, [matraz.agua > vTarget + 0.5, Math.abs(matraz.agua - vTarget) < 0.05]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full bg-[#F8FAFC] overflow-hidden flex flex-col items-center justify-between font-['Outfit'] select-none">
      
      {/* ── ALERTA DE ERROR (OVERFILL) ── */}
      <AnimatePresence>
        {matraz.agua > vTarget + 0.5 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
            className="absolute z-[120] bottom-40 left-1/2 -translate-x-1/2 bg-red-600 text-white px-10 py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(220,38,38,0.5)] border-2 border-red-400 flex flex-col items-center gap-2"
          >
             <div className="flex items-center gap-3">
                <AlertCircle size={24} className="animate-bounce" />
                <span className="text-lg font-black uppercase italic tracking-tighter">¡Solución Arruinada!</span>
             </div>
             <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest text-center">Has pasado la línea de aforo. La concentración es inexacta.<br/>Reinicia el material para volver a intentar.</p>
             <button 
               onClick={() => { setAgua(0); audio?.playPop?.(); }}
               className="mt-4 px-6 py-2 bg-white text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
             >
                Resetear Matraz
             </button>
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
              className="max-w-2xl bg-white p-12 rounded-[3.5rem] shadow-2xl relative"
            >
              <button onClick={() => setShowAcademicInfo(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">Cerrar</button>
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-4 bg-cyan-500/10 rounded-2xl text-cyan-600"><BookOpen size={32} /></div>
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Protocolo de Soluciones</h2>
              </div>
              <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                <p><strong className="text-slate-900">Molaridad (M):</strong> Es la relación entre los moles de soluto y el volumen de la solución en litros. $M = n/V$.</p>
                <p><strong className="text-slate-900">El Menisco:</strong> Para un aforo exacto, la parte inferior de la curva del líquido (menisco) debe tocar la línea grabada en el matraz.</p>
                <p><strong className="text-slate-900">Pureza y Estequiometría:</strong> No toda la masa que pesas es soluto puro. El simulador calcula automáticamente la corrección por pureza ($98.5\%$).</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D ENGINE ── */}
      <div className="absolute inset-0 z-0">
         <Soluciones3DScene solucionesData={soluciones} isPrecisionMode={isPrecisionMode} />
      </div>

      {/* ── TOP HUD ── */}
      <header className="relative z-10 w-full px-12 pt-10 flex items-start justify-between pointer-events-none">
        <div className="flex flex-col pointer-events-auto">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Solvent & Solute Management</span>
          </div>
          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-4 rounded-[2rem] border border-slate-200 shadow-xl">
            <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-600"><Layers size={20} /></div>
            <div className="flex flex-col min-w-[200px]">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em] mb-1">Reactivo Actual</span>
              <h1 className="text-xl font-black tracking-tighter uppercase italic text-slate-900">{sal.nombre} <span className="text-xs text-slate-400 ml-2 font-mono">({sal.formula})</span></h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 pointer-events-auto">
           <div className="px-8 py-4 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-[2rem] flex flex-col items-center shadow-xl">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.5em] mb-1">Molaridad Objetivo</span>
              <div className="flex items-center gap-3">
                 <Target size={18} className="text-cyan-500" />
                 <span className="text-2xl font-black italic tracking-tighter text-slate-900">{mTarget} <span className="text-xs">M</span></span>
              </div>
           </div>
           <button onClick={() => setShowAcademicInfo(true)} className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-cyan-500 transition-all shadow-lg"><Info size={24} /></button>
           <button 
             onClick={() => { setAgua(0); addPolvo(-matraz.polvo); audio?.playPop?.(); }} 
             className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-lg"
             title="Limpiar Material"
           >
             <RefreshCw size={24} />
           </button>
        </div>
      </header>
      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-20">
        <div className="bg-white/40 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Estado del Protocolo
            </span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Solution Protocol HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${matraz.polvo > 0 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-100 border-slate-200'}`}>
              <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Soluto</div>
              <div className={`text-sm font-black italic ${matraz.polvo > 0 ? 'text-cyan-600' : 'text-slate-300'}`}>{matraz.polvo > 0 ? 'TRANSFERIDO' : 'PENDIENTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${matraz.agua > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-100 border-slate-200'}`}>
              <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Solvente</div>
              <div className={`text-sm font-black italic ${matraz.agua > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{matraz.agua > 0 ? `${matraz.agua.toFixed(0)} mL` : 'VACÍO'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${accuracy > 99.5 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 border-slate-200'}`}>
              <div className="text-[9px] font-black uppercase text-slate-400 mb-2">Aforo</div>
              <div className={`text-sm font-black italic ${accuracy > 99.5 ? 'text-emerald-600' : 'text-slate-300'}`}>{accuracy > 99.5 ? 'PERFECTO' : 'EN CURSO'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE CONTROLS (DOCK) ── */}
      <main className="relative z-10 flex-1 w-full flex items-center justify-between px-20">
        
        {/* PANEL DE BALANZA (IZQ) */}
        <section className="flex flex-col gap-6 w-80">
           <div className="bg-white/80 backdrop-blur-2xl border border-slate-200 p-8 rounded-[3.5rem] shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balanza Analítica</span>
                 <Scale size={18} className="text-cyan-500" />
              </div>
              
              <div className="bg-[#0f172a] p-6 rounded-3xl flex flex-col items-center mb-6 shadow-inner border border-white/5">
                 <span className="text-4xl font-black text-emerald-400 font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                    {balanza.tara ? "0.000" : balanza.polvo.toFixed(3)}<span className="text-xs ml-1 opacity-50">g</span>
                 </span>
                 <span className="text-[8px] font-black text-emerald-900 uppercase tracking-widest mt-1">Status: Stable</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => toggleTara()} className={`h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${balanza.tara ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>Tara</button>
                 <button onClick={() => transferirPolvo()} disabled={balanza.polvo <= 0} className="h-12 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all">Transferir</button>
              </div>

              <div className="mt-8 flex flex-col gap-2">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Adición de Sólido</span>
                 <button 
                   onMouseDown={() => {
                     const int = setInterval(() => addPolvo(0.005), 50);
                     (window as any)._addInt = int;
                   }}
                   onMouseUp={() => clearInterval((window as any)._addInt)}
                   onMouseLeave={() => clearInterval((window as any)._addInt)}
                   className="w-full h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                 >
                    <MousePointer2 size={16} className="text-cyan-400" /> Espátula
                 </button>
              </div>
           </div>
        </section>

        {/* PANEL DE CONTROL DE AGUA (DER) */}
        <section className="flex flex-col gap-6 w-80">
           <div className="bg-white/80 backdrop-blur-2xl border border-slate-200 p-8 rounded-[3.5rem] shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inyección de Solvente</span>
                 <Droplet size={18} className="text-blue-500" />
              </div>

              <div className="flex flex-col gap-4 mb-8">
                 <div className="flex justify-between items-baseline px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Volumen Actual</span>
                    <span className="text-2xl font-black italic text-slate-900">{matraz.agua.toFixed(1)} <span className="text-xs font-normal">mL</span></span>
                 </div>
                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <motion.div animate={{ width: `${(matraz.agua / vTarget) * 100}%` }} className={`h-full ${matraz.agua > vTarget ? 'bg-red-500' : 'bg-blue-500'}`} />
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                 <button 
                   onMouseDown={() => {
                     const int = setInterval(() => setAgua(Math.min(vTarget + 10, useSimuladorStore.getState().soluciones.matraz.agua + 1)), 50);
                     (window as any)._waterInt = int;
                   }}
                   onMouseUp={() => clearInterval((window as any)._waterInt)}
                   onMouseLeave={() => clearInterval((window as any)._waterInt)}
                   className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl transition-all"
                 >
                    <Zap size={18} /> Llenado Rápido
                 </button>
                 
                 <button 
                   onMouseDown={() => setIsDripping(true)}
                   onMouseUp={() => setIsDripping(false)}
                   onMouseLeave={() => setIsDripping(false)}
                   className={`w-full h-16 border-2 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${isPrecisionMode ? 'border-cyan-500 text-cyan-600 bg-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                 >
                    <Droplet size={18} /> Goteo de Precisión
                 </button>
              </div>
           </div>
        </section>

      </main>

      {/* ── FOOTER TELEMETRY ── */}
      <footer className="relative z-20 w-full max-w-6xl pb-12 px-10 flex items-end gap-6">
         
         <div className="flex-1 grid grid-cols-3 gap-4 bg-white/40 backdrop-blur-3xl border border-slate-200 p-6 rounded-[2.5rem] shadow-2xl">
            <div className="flex flex-col border-r border-slate-200 pr-4">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Molaridad Real</span>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600"><Beaker size={18} /></div>
                  <span className="text-3xl font-black italic tracking-tighter text-slate-900">
                    {currentMolarity.toFixed(4)} <span className="text-xs">M</span>
                  </span>
               </div>
            </div>

            <div className="flex flex-col border-r border-slate-200 pr-4 pl-4">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Precisión de Aforo</span>
               <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accuracy > 95 ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'}`}>
                    <Target size={18} />
                  </div>
                  <span className={`text-3xl font-black italic tracking-tighter ${accuracy > 95 ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {accuracy.toFixed(1)} <span className="text-xs">%</span>
                  </span>
               </div>
            </div>

            <div className="flex flex-col pl-4">
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Sustancia en Solución</span>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400"><Layers size={18} /></div>
                  <span className="text-lg font-black italic tracking-tighter text-slate-900 truncate">
                    {matraz.polvo > 0 ? sal.formula : 'Vacío'}
                  </span>
               </div>
            </div>
         </div>

         <div className="w-72 bg-slate-900 p-6 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_#06b6d4]" />
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Rigor del Menisco</span>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-black text-white italic">{accuracy > 99 ? 'Perfecto' : accuracy > 95 ? 'Aceptable' : 'Fuera de Rango'}</span>
            </div>
            <p className="text-[7px] text-white/20 uppercase mt-2 tracking-widest">Control de Calidad QMI-05</p>
         </div>

      </footer>
    </div>
  );
}
