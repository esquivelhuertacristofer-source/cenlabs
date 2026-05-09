"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Scale, Droplet, Beaker, Layers, MousePointer2, 
  Info, AlertCircle, CheckCircle2, FlaskConical, 
  Zap, Activity, Target, ShieldCheck, Award, Box, RefreshCw, BookOpen
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import Soluciones3DScene from './simuladores/qmi05/Soluciones3DScene';
import { SUSTANCIAS_SOLUCIONES } from '@/store/slices/quimicaSlice';

export default function PilotoPreparacionSoluciones({ onValidate }: { onValidate?: (v: any) => void }) {
  const { 
    soluciones, addPolvo, toggleTara, transferirPolvo, setAgua, setSal 
  } = useSimuladorStore();

  const { 
    mTarget = 0.5, 
    vTarget = 250, 
    mRequerida = 7.3, 
    sal = SUSTANCIAS_SOLUCIONES[0],
    balanza = { polvo: 0, tara: false, encendida: true },
    matraz = { polvo: 0, agua: 0 },
    status = 'idle'
  } = soluciones || {};

  const [isDripping, setIsDripping] = useState(false);
  const [showReagents, setShowReagents] = useState(false);
  const [showAcademicInfo, setShowAcademicInfo] = useState(false);

  // Molaridad Real
  const masaEfectiva = matraz.polvo * (sal?.purity || 1.0);
  const currentMolarity = matraz.agua > 0 
    ? (masaEfectiva / (sal?.pm || 58.44)) / (matraz.agua / 1000) 
    : 0;
  
  const accuracy = Math.max(0, 100 - Math.abs((currentMolarity - mTarget) / mTarget) * 100);
  const isPrecisionMode = matraz.agua > vTarget - 10;

  // Loop de goteo
  useEffect(() => {
    let interval: any;
    if (isDripping) {
      interval = setInterval(() => {
        setAgua(Math.min(vTarget + 1, useSimuladorStore.getState().soluciones.matraz.agua + 0.1));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isDripping, vTarget, setAgua]);

  return (
    <div className="w-full h-full relative flex flex-col items-center justify-center overflow-hidden font-['Outfit'] select-none">
      
      <div className="absolute inset-0 z-0">
         <Soluciones3DScene solucionesData={soluciones} isPrecisionMode={isPrecisionMode} />
      </div>

      {/* ── TOP OVERLAY (MISSION & STEPS) ── */}
      <header className="absolute top-10 left-10 right-10 flex justify-between items-start z-30 pointer-events-none">
          <div className="flex flex-col gap-3 pointer-events-auto">
             <div className="bg-white/95 backdrop-blur-md p-6 rounded-[2.5rem] border border-slate-200 shadow-2xl flex items-center gap-5">
               <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <Beaker size={28} />
               </div>
               <div>
                  <h1 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900">{sal.nombre} <span className="text-xs text-slate-400 ml-2 font-mono">({sal.formula})</span></h1>
                  <div className="flex items-center gap-4 mt-1">
                     <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                        <Target size={12} /> Meta: {mTarget} M
                     </span>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Volumen: {vTarget} mL
                     </span>
                  </div>
               </div>
               <button 
                 onClick={() => { setShowReagents(!showReagents); audio.playPop(); }}
                 className="ml-4 w-12 h-12 rounded-2xl bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center"
               >
                  <Box size={20} />
               </button>
             </div>
 
             {/* REAGENT SELECTOR PANEL */}
             <AnimatePresence>
               {showReagents && (
                 <motion.div 
                   initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                   className="mt-4 bg-white/95 backdrop-blur-2xl border border-slate-200 p-6 rounded-[2.5rem] shadow-2xl w-[400px] pointer-events-auto"
                 >
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 px-2">Catálogo de Reactivos</div>
                   <div className="grid grid-cols-1 gap-2">
                     {SUSTANCIAS_SOLUCIONES.map((s, idx) => (
                       <button 
                         key={s.formula}
                         onClick={() => { setSal(idx); setShowReagents(false); audio.playSuccess(); }}
                         className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${sal.formula === s.formula ? 'bg-indigo-500 border-indigo-600' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'}`}
                       >
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-inner" style={{ backgroundColor: s.color + '20' }}>
                             <FlaskConical size={16} style={{ color: s.color }} />
                           </div>
                           <div className="text-left">
                             <div className={`text-xs font-black ${sal.formula === s.formula ? 'text-white' : 'text-slate-900'}`}>{s.nombre}</div>
                             <div className={`text-[9px] font-bold ${sal.formula === s.formula ? 'text-white/60' : 'text-slate-400'}`}>{s.formula} • PM: {s.pm}</div>
                           </div>
                         </div>
                         <div className={`w-2 h-2 rounded-full ${sal.formula === s.formula ? 'bg-white' : 'bg-slate-300'}`} />
                       </button>
                     ))}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
 
          <div className="flex flex-col gap-2 items-end pointer-events-auto">
             <div className="flex gap-2">
               <button onClick={() => setShowAcademicInfo(true)} className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-xl"><Info size={24} /></button>
               <button 
                 onClick={() => { setAgua(0); addPolvo(-matraz.polvo); audio.playPop(); }} 
                 className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-xl"
               >
                 <RefreshCw size={24} />
               </button>
             </div>
 
             <div className="bg-slate-900 text-white px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border border-white/10 mt-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Protocolo Diamond State</span>
             </div>
             
             {/* STEP INDICATORS */}
             <div className="flex gap-2 mt-2">
                {[
                   { label: 'Pesar', ok: matraz.polvo > 0 },
                   { label: 'Aforar', ok: matraz.agua > vTarget * 0.95 },
                   { label: 'Validar', ok: status === 'success' }
                ].map((step, i) => (
                   <div key={i} className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${step.ok ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white/80 border-slate-200 text-slate-400'}`}>
                      {step.ok ? <CheckCircle2 size={12} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                      <span className="text-[9px] font-black uppercase tracking-widest">{step.label}</span>
                   </div>
                ))}
             </div>
          </div>
       </header>

       {/* CHECKLIST HUD (DIAMOND STANDARD) */}
       <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-20">
         <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 rounded-[2.5rem] p-8 shadow-2xl">
           <div className="flex items-center justify-between mb-6">
             <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2">
               <Activity size={12} className="animate-pulse" /> Estado del Protocolo
             </span>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Solution Protocol HUD</span>
           </div>
           
           <div className="grid grid-cols-3 gap-6">
             <div className={`p-5 rounded-2xl border transition-all ${matraz.polvo > 0 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-50 border-slate-100'}`}>
               <div className="text-[9px] font-black uppercase text-slate-500 mb-2">Soluto</div>
               <div className={`text-sm font-black italic ${matraz.polvo > 0 ? 'text-cyan-600' : 'text-slate-400'}`}>{matraz.polvo > 0 ? 'TRANSFERIDO' : 'PENDIENTE'}</div>
             </div>
             <div className={`p-5 rounded-2xl border transition-all ${matraz.agua > 0 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-slate-50 border-slate-100'}`}>
               <div className="text-[9px] font-black uppercase text-slate-500 mb-2">Solvente</div>
               <div className={`text-sm font-black italic ${matraz.agua > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{matraz.agua > 0 ? `${matraz.agua.toFixed(0)} mL` : 'VACÍO'}</div>
             </div>
             <div className={`p-5 rounded-2xl border transition-all ${accuracy > 99.5 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-50 border-slate-100'}`}>
               <div className="text-[9px] font-black uppercase text-slate-500 mb-2">Aforo</div>
               <div className={`text-sm font-black italic ${accuracy > 99.5 ? 'text-emerald-600' : 'text-slate-400'}`}>{accuracy > 99.5 ? 'PERFECTO' : 'EN CURSO'}</div>
             </div>
           </div>
         </div>
       </div>

       {/* ── INTERACTIVE CONTROLS (DOCK) ── */}
       <main className="relative z-10 flex-1 w-full flex items-center justify-between px-20">
         
         {/* PANEL DE BALANZA (IZQ) */}
         <section className="flex flex-col gap-6 w-80">
            <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 p-8 rounded-[3.5rem] shadow-2xl">
               <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balanza Analítica</span>
                  <Scale size={18} className="text-cyan-500" />
               </div>
               
               <div className="bg-[#0f172a] p-8 rounded-[2.5rem] flex flex-col items-center mb-6 shadow-2xl border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/30" />
                  <span className="text-4xl font-black text-emerald-400 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
                     {balanza.tara ? "0.000" : balanza.polvo.toFixed(3)}<span className="text-xs ml-1 opacity-50">g</span>
                  </span>
                  <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-[0.3em] mt-2">Analytical Precision</span>
               </div>
  
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => toggleTara()} className={`h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${balanza.tara ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tara</button>
                  <button onClick={() => transferirPolvo()} disabled={balanza.polvo <= 0} className="h-14 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all">Transferir</button>
               </div>
  
               <div className="mt-8 flex flex-col gap-3">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2">Adición de Sólido</span>
                  <button 
                    onMouseDown={() => {
                      const int = setInterval(() => addPolvo(0.005), 50);
                      (window as any)._addInt = int;
                    }}
                    onMouseUp={() => clearInterval((window as any)._addInt)}
                    onMouseLeave={() => clearInterval((window as any)._addInt)}
                    className="w-full h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-2xl group"
                  >
                     <MousePointer2 size={16} className="text-cyan-400 group-hover:scale-110 transition-transform" /> Espátula
                  </button>
               </div>
            </div>
         </section>
  
         {/* PANEL DE CONTROL DE AGUA (DER) */}
         <section className="flex flex-col gap-6 w-80">
            <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 p-8 rounded-[3.5rem] shadow-2xl">
               <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Inyección de Solvente</span>
                  <Droplet size={18} className="text-blue-500" />
               </div>
  
               <div className="flex flex-col gap-4 mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex justify-between items-baseline mb-2">
                     <span className="text-[10px] font-black text-slate-500 uppercase">Volumen Actual</span>
                     <span className="text-2xl font-black italic text-slate-900">{matraz.agua.toFixed(1)} <span className="text-xs font-normal">mL</span></span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                     <motion.div animate={{ width: `${(matraz.agua / vTarget) * 100}%` }} className={`h-full ${matraz.agua > vTarget ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]'}`} />
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
                    className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
                  >
                     <Zap size={18} /> Llenado Rápido
                  </button>
                  
                  <button 
                    onMouseDown={() => setIsDripping(true)}
                    onMouseUp={() => setIsDripping(false)}
                    onMouseLeave={() => setIsDripping(false)}
                    className={`w-full h-16 border-2 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${isPrecisionMode ? 'border-cyan-500 text-cyan-600 bg-cyan-50 shadow-[0_0_25px_rgba(6,182,212,0.3)]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                     <Droplet size={18} /> Goteo de Precisión
                  </button>
               </div>
            </div>
         </section>
       </main>

       {/* ── FOOTER TELEMETRY ── */}
       <footer className="relative z-20 w-full max-w-6xl pb-12 px-10 flex items-end gap-6 pointer-events-none">
          <div className="flex-1 grid grid-cols-3 gap-4 bg-white/90 backdrop-blur-3xl border border-slate-200 p-6 rounded-[2.5rem] shadow-2xl pointer-events-auto">
             <div className="flex flex-col border-r border-slate-200 pr-4">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Molaridad Real</span>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600"><Beaker size={18} /></div>
                   <span className="text-3xl font-black italic tracking-tighter text-slate-900">
                     {currentMolarity.toFixed(4)} <span className="text-xs">M</span>
                   </span>
                </div>
             </div>
  
             <div className="flex flex-col border-r border-slate-200 pr-4 pl-4">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Precisión de Aforo</span>
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
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Sustancia en Solución</span>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500"><Layers size={18} /></div>
                   <span className="text-lg font-black italic tracking-tighter text-slate-900 truncate">
                     {matraz.polvo > 0 ? sal.formula : 'Vacío'}
                   </span>
                </div>
             </div>
          </div>

          <div className="w-72 bg-slate-900 p-6 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group pointer-events-auto">
             <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_#06b6d4]" />
             <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Rigor del Menisco</span>
             <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white italic">{accuracy > 99 ? 'Perfecto' : accuracy > 95 ? 'Aceptable' : 'Fuera de Rango'}</span>
             </div>
          </div>
       </footer>

       {/* ACADEMIC INFO MODAL */}
       <AnimatePresence>
         {showAcademicInfo && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
             className="absolute z-[100] inset-0 flex items-center justify-center p-10 bg-black/80 backdrop-blur-2xl pointer-events-auto"
           >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
               className="max-w-2xl bg-white p-12 rounded-[3.5rem] shadow-2xl relative"
             >
               <button onClick={() => setShowAcademicInfo(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><RefreshCw size={20} /></button>
               <div className="flex items-center gap-4 mb-8">
                  <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-600"><BookOpen size={32} /></div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Protocolo de Soluciones</h2>
               </div>
               <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
                 <p><strong className="text-slate-900">Molaridad (M):</strong> Es la relación entre los moles de soluto y el volumen de la solución en litros. $M = n/V$.</p>
                 <p><strong className="text-slate-900">El Menisco:</strong> Para un aforo exacto, la parte inferior de la curva del líquido (menisco) debe tocar la línea grabada en el matraz.</p>
                 <p><strong className="text-slate-900">Pureza y Estequiometría:</strong> No toda la masa que pesas es soluto puro. Cada reactivo tiene un factor de pureza específico que debes considerar en tus cálculos.</p>
               </div>
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>

    </div>
  );
}
