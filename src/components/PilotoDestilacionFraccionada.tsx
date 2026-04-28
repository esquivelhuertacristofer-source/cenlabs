"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Flame, Thermometer, Wind, Droplets, Info, Timer, Play, RotateCcw, Activity, Gauge, Zap } from 'lucide-react';
import Destilacion3DScene from './simuladores/qmi10/Destilacion3DScene';

export default function PilotoDestilacionFraccionada({ isWorktableDark = true, isProfesor = false }: { isWorktableDark?: boolean; isProfesor?: boolean }) {
  const { destilacion, setCalorManta, updateDestilacion, resetP10, audio } = useSimuladorStore();
  const [lastTick, setLastTick] = useState(Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Loop de simulación local (más fluido que el tick global)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTick) / 1000;
      updateDestilacion(dt);
      setLastTick(now);
    }, 100);
    return () => clearInterval(interval);
  }, [lastTick, updateDestilacion]);

  const temp = destilacion.tempMezcla;
  const volEtanol = destilacion.volEtanolMatraz;
  const volAgua = destilacion.volAguaMatraz;
  const volDestilado = destilacion.volDestilado;
  const pur = destilacion.purezaDestilado;

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden font-['Outfit'] bg-[#010409] text-white">
      
      {/* ── ESCENARIO 3D (MOTOR DIAMOND) ── */}
      <div className="absolute inset-0 z-0">
        <Destilacion3DScene 
           temp={temp}
           volMezcla={volEtanol + volAgua}
           volDestilado={volDestilado}
           pureza={pur}
        />
      </div>

      {/* ── CAPA DE INTERFAZ HUD DIAMOND ── */}
      <div className="absolute inset-0 z-10 pointer-events-none p-12 flex flex-col justify-between">
        
        {/* Superior: Status Térmico */}
        <div className="flex justify-between items-start">
           <motion.div 
             initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
             className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] pointer-events-auto shadow-2xl"
           >
              <div className="flex items-center gap-4 mb-4">
                 <div className={`w-3 h-3 rounded-full animate-pulse ${temp > 75 ? 'bg-orange-500 shadow-[0_0_15px_#f97316]' : 'bg-slate-500'}`} />
                 <span className="text-[10px] font-black text-[#8ECAE6] uppercase tracking-[0.4em]">Distillation Monitor v2.0</span>
              </div>
              
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Cámara de Ebullición</span>
                 <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-black font-mono tracking-tighter ${temp > 95 ? 'text-red-500' : 'text-white'} drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]`}>
                       {temp.toFixed(1)}<span className="text-xl text-slate-500 ml-1">°C</span>
                    </span>
                 </div>
              </div>
              
              <div className="mt-6 flex gap-2 w-48">
                 {[1,2,3,4,5,6].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${temp > (20 + i * 15) ? (temp > 95 ? 'bg-red-500 shadow-[0_0_5px_#ef4444]' : 'bg-orange-500 shadow-[0_0_5px_#f97316]') : 'bg-slate-800'}`} />
                 ))}
              </div>
           </motion.div>

           <motion.div 
             initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
             className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] pointer-events-auto text-right shadow-2xl"
           >
              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3">Pureza del Destilado</div>
              <div className="space-y-4">
                 <div className="flex flex-col items-end">
                    <span className="text-5xl font-black text-white font-mono italic drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]">{pur.toFixed(1)}<span className="text-xl ml-1 text-slate-500">%</span></span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Fracción de Etanol (C₂H₅OH)</span>
                 </div>
                 <div className="h-2 w-56 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <motion.div 
                       animate={{ width: `${pur}%`, backgroundColor: pur > 90 ? '#10b981' : '#3b82f6' }}
                       className="h-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                 </div>
              </div>
           </motion.div>
        </div>

        {/* CHECKLIST HUD (DIAMOND STANDARD) */}
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[550px] pointer-events-none">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} className="animate-pulse" /> Sincronía Vapor-Líquido
              </span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Phase Transition HUD</span>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className={`p-5 rounded-2xl border transition-all ${temp >= 78 ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[9px] font-black uppercase text-white/40 mb-2">Ebullición</div>
                <div className={`text-sm font-black italic ${temp >= 78 ? 'text-orange-400' : 'text-white/20'}`}>{temp >= 78 ? 'ACTIVA (78°C)' : 'LATENTE'}</div>
              </div>
              <div className={`p-5 rounded-2xl border transition-all ${volDestilado > 0 ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[9px] font-black uppercase text-white/40 mb-2">Destilado</div>
                <div className={`text-sm font-black italic ${volDestilado > 0 ? 'text-cyan-400' : 'text-white/20'}`}>{volDestilado.toFixed(1)} <span className="text-[10px]">mL</span></div>
              </div>
              <div className={`p-5 rounded-2xl border transition-all ${pur > 95 ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[9px] font-black uppercase text-white/40 mb-2">Grado Alcohólico</div>
                <div className={`text-sm font-black italic ${pur > 95 ? 'text-emerald-400' : 'text-white/20'}`}>{pur > 95 ? 'PREMIUM' : 'DILUIDO'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* GIANT TEMPERATURE HUD (CENTRAL) */}
        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
           <div className="text-[14rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{temp.toFixed(0)}</div>
        </div>

        {/* Inferior: Control de Manta y Volumen */}
        <div className="flex justify-between items-end mb-8 px-4">
           <div className="flex flex-col gap-6 pointer-events-auto">
              <div className="flex items-center gap-3 text-white/40 px-2">
                 <Wind size={18} className="animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">Flujo de Condensación Activo</span>
              </div>
              
              <div className="p-8 bg-slate-950/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center gap-12">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Potencia Manta Térmica</span>
                    <div className="flex items-center gap-6">
                       <span className="text-5xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">{destilacion.calorManta}<span className="text-xl text-orange-500 ml-1">°</span></span>
                       <div className="flex gap-2">
                          <button 
                            onClick={() => { setCalorManta(destilacion.calorManta - 5); audio?.playPop(); }}
                            className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all font-black text-xl text-white active:scale-90"
                          >-</button>
                          <button 
                            onClick={() => {
                              const nextCalor = destilacion.calorManta + 5;
                              setCalorManta(nextCalor);
                              audio?.playPop();
                              if (nextCalor > 95) {
                                audio?.playNotification();
                              } else if (nextCalor >= 78 && nextCalor <= 85) {
                                audio?.playNotification();
                              }
                            }}
                            className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all font-black text-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-90"
                          >+</button>
                       </div>
                    </div>
                 </div>
                 
                 <div className="h-16 w-px bg-white/10" />
                 
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Contenedor Colector</span>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20"><Droplets size={20} /></div>
                       <span className="text-3xl font-black text-white font-mono">{volDestilado.toFixed(1)} <span className="text-xs text-slate-500">mL</span></span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-6 pointer-events-auto">
              <button 
                onClick={() => { resetP10(); audio?.playPop(); }} 
                className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-white/10 transition-all shadow-xl group"
              >
                 <RotateCcw size={28} className="group-hover:rotate-[-180deg] transition-transform duration-700" />
              </button>
           </div>
        </div>
      </div>

      {/* GLOBO DE INSTRUCTOR (DIAMOND PANEL) */}
      {isProfesor && (
        <div className="absolute top-1/2 -translate-y-1/2 right-12 p-10 bg-gradient-to-br from-[#023047] to-[#0A1121] text-white rounded-[3.5rem] shadow-2xl max-w-sm z-30 border border-cyan-500/30">
           <div className="flex items-center gap-4 mb-6 font-black uppercase tracking-tighter text-lg italic text-cyan-400">
             <div className="p-3 bg-cyan-500/20 rounded-2xl"><Activity size={24} /></div>
             Master Distiller
           </div>
           <p className="text-xs font-medium opacity-70 leading-relaxed mb-8 italic">
             "El Etanol tiene su punto de ebullición en ~78.4°C. Mantén la manta entre 85-90°C para una destilación controlada. Si tocas los 100°C, el agua también evaporará y arruinarás la pureza."
           </p>
           <div className="h-px bg-white/10 mb-8" />
           <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 tracking-widest">
                 <span>Eficiencia Fraccionada</span>
                 <span className="text-white">98.2%</span>
              </div>
              <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                 <div className="h-full w-[98.2%] bg-cyan-500 shadow-[0_0_10px_#06b6d4]" />
              </div>
           </div>
        </div>
      )}

      {/* Decoración HUD Extra */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-[5]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '80px 80px' }} />
    </div>
  );
}
