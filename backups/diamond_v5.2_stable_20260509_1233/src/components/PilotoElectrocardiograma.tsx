"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Activity, Heart, Zap, ShieldCheck, Thermometer, Droplets, Bot, RotateCcw, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PilotoElectrocardiograma() {
  const { cardio, setCardio, generarSemillaB8, registrarHallazgo, setBitacora, bitacoraData, stopTimer, setPasoActual } = useSimuladorStore();
  const { ritmoBPM, targetBPM, estadoFisiologico, status } = cardio;

  const [dosage, setDosage] = useState(0);
  const [lastDrug, setLastDrug] = useState<string | null>(null);
  
  // Refs para el trazado del ECG
  const pathRef = useRef<SVGPathElement>(null);
  const points = useRef<{ x: number; y: number }[]>([]);
  const lastTime = useRef<number>(0);
  const cycleProgress = useRef<number>(0);

  // Inicialización
  useEffect(() => {
    generarSemillaB8();
    // Inicializar puntos de la rejilla
    points.current = [];
    for (let i = 0; i < 200; i++) {
      points.current.push({ x: i * 5, y: 150 });
    }
  }, []);

  // Bucle de Animación del ECG (60fps)
  useEffect(() => {
    let frameId: number;

    const animate = (time: number) => {
      if (!lastTime.current) lastTime.current = time;
      const deltaTime = time - lastTime.current;
      lastTime.current = time;

      const cycleDuration = 60000 / ritmoBPM;
      cycleProgress.current += deltaTime;

      if (cycleProgress.current >= cycleDuration) {
        cycleProgress.current = 0;
      }

      const prog = cycleProgress.current / cycleDuration;
      let currentFase: 'Diástole' | 'Onda P' | 'QRS' | 'Onda T' = 'Diástole';
      if (prog < 0.15) currentFase = 'Onda P';
      else if (prog >= 0.15 && prog < 0.25) currentFase = 'Diástole';
      else if (prog >= 0.25 && prog < 0.40) currentFase = 'QRS';
      else if (prog >= 0.40 && prog < 0.60) currentFase = 'Diástole';
      else if (prog >= 0.60 && prog < 0.85) currentFase = 'Onda T';
      else currentFase = 'Diástole';

      if (cardio.faseActual !== currentFase) {
        setCardio({ faseActual: currentFase });
      }

      let yOffset = 0;
      if (currentFase === 'Onda P') {
        yOffset = -15 * Math.sin((prog / 0.15) * Math.PI);
      } else if (currentFase === 'QRS') {
        const qrsProg = (prog - 0.25) / 0.15;
        if (qrsProg < 0.2) yOffset = 10 * (qrsProg / 0.2);
        else if (qrsProg < 0.5) yOffset = -60 * ((qrsProg - 0.2) / 0.3) + 10;
        else if (qrsProg < 0.8) yOffset = 70 * ((qrsProg - 0.5) / 0.3) - 50;
        else yOffset = -20 * ((qrsProg - 0.8) / 0.2) + 20;
      } else if (currentFase === 'Onda T') {
        yOffset = -25 * Math.sin(((prog - 0.60) / 0.25) * Math.PI);
      }

      if (pathRef.current) {
        for (let i = 0; i < points.current.length - 1; i++) {
          points.current[i].y = points.current[i + 1].y;
        }
        points.current[points.current.length - 1].y = 150 + yOffset;

        const d = points.current.reduce((acc, p, i) => 
          acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, ""
        );
        pathRef.current.setAttribute("d", d);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [ritmoBPM, cardio.faseActual]);

  const aplicarFarmaco = (tipo: 'Adrenalina' | 'Acetilcolina') => {
    const delta = tipo === 'Adrenalina' ? 10 : -10;
    const newBPM = Math.max(30, Math.min(220, ritmoBPM + delta));
    setCardio({ ritmoBPM: newBPM });
    setLastDrug(tipo);
    setDosage(prev => prev + 1);
    
    registrarHallazgo('bio_cardio_farmaco', {
      tipo,
      bpm_anterior: ritmoBPM,
      bpm_nuevo: newBPM,
      dosis_total: dosage + 1
    });
  };

  const handleValidar = () => {
    const error = Math.abs(ritmoBPM - targetBPM);
    if (error <= 5) {
      setCardio({ status: 'success' });
      stopTimer();
      setPasoActual(4);
      registrarHallazgo('bio_cardio_estabilizacion', {
        bpm_final: ritmoBPM,
        target_bpm: targetBPM,
        dosis_usadas: dosage,
        precision: 100 - (error / targetBPM * 100)
      });
      setBitacora({
        ...bitacoraData,
        bio8: `✅ PACIENTE ESTABILIZADO: BPM=${ritmoBPM} (Objetivo: ${targetBPM}). Dosis totales: ${dosage}.`
      });
    } else {
      setCardio({ status: 'error' });
      setTimeout(() => setCardio({ status: 'idle' }), 2000);
    }
  };

  return (
    <div className="w-full h-full relative bg-[#020617] font-['Outfit'] overflow-hidden text-white">
      
      {/* MONITOR GRID BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-full" style={{ 
          backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* TOP HUD: STATUS & TELEMETRY */}
      <div className="absolute top-8 left-0 right-0 z-50 px-10 flex justify-between items-start">
        <div className="flex flex-col gap-4">
           <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-6 shadow-2xl">
              <div className="relative">
                <Heart size={40} className={`text-rose-500 transition-transform duration-150 ${cardio.faseActual === 'QRS' ? 'scale-125' : 'scale-100'}`} fill="currentColor" />
                <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full" />
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-1">Ritmo Cardíaco</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white tabular-nums tracking-tighter">{ritmoBPM}</span>
                  <span className="text-sm font-bold text-slate-500 uppercase">BPM</span>
                </div>
              </div>
           </div>

           <div className="bg-indigo-600/20 backdrop-blur-xl border border-indigo-500/30 p-4 rounded-[1.8rem] flex items-center gap-4">
              <Activity size={20} className="text-indigo-400 animate-pulse" />
              <div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Objetivo de Estabilización</span>
                <span className="text-lg font-black text-white tracking-widest">{targetBPM} BPM</span>
              </div>
           </div>
        </div>

        <div className="flex flex-col gap-4 items-end">
           <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-4 rounded-3xl text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Fase del Ciclo</span>
              <span className="text-xl font-black text-teal-400 uppercase italic tracking-tighter">{cardio.faseActual}</span>
           </div>
           <button onClick={() => generarSemillaB8()} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group">
              <RotateCcw size={20} className="text-white/40 group-hover:rotate-180 transition-transform duration-500" />
           </button>
        </div>
      </div>

      {/* MAIN VIEW: ANATOMICAL + OSCILLOSCOPE */}
      <div className="absolute inset-0 flex flex-col pt-40">
        
        {/* HEART SIMULATION AREA */}
        <div className="flex-1 relative flex items-center justify-center">
           <svg viewBox="0 0 400 300" className="h-full max-h-[400px] overflow-visible drop-shadow-[0_0_80px_rgba(244,63,94,0.15)]">
              <g transform="translate(200, 150)">
                 {/* Aurículas */}
                 <motion.path 
                   animate={{ 
                     scale: cardio.faseActual === 'Onda P' ? 1.1 : 1,
                     fill: cardio.faseActual === 'Onda P' ? '#219EBC' : '#1e293b'
                   }}
                   d="M-60,-40 C-80,-80 80,-80 60,-40 C40,-20 -40,-20 -60,-40" 
                   className="stroke-slate-700 stroke-[4] transition-colors"
                 />
                 {/* Ventrículos */}
                 <motion.path 
                   animate={{ 
                     scale: cardio.faseActual === 'QRS' ? 1.05 : 1,
                     fill: cardio.faseActual === 'QRS' ? '#f43f5e' : '#1e293b'
                   }}
                   d="M-70,-30 C-90,60 0,110 0,110 C0,110 90,60 70,-30 C50,-50 -50,-50 -70,-30" 
                   className="stroke-slate-700 stroke-[4] transition-colors"
                 />
                 
                 {/* Conduction System */}
                 <g className="fill-none stroke-teal-400/30 stroke-[2]">
                    <circle cx="-50" cy="-60" r="5" fill={cardio.faseActual === 'Onda P' ? '#2dd4bf' : 'none'} />
                    <circle cx="0" cy="-10" r="4" fill={cardio.faseActual === 'QRS' ? '#2dd4bf' : 'none'} />
                    <path d="M-50,-60 Q-20,-40 0,-10" strokeDasharray="4 4" />
                    <path d="M0,-10 Q-30,40 -40,80" strokeDasharray="4 4" />
                    <path d="M0,-10 Q30,40 40,80" strokeDasharray="4 4" />
                 </g>
              </g>
           </svg>

           {/* LABELS DE ESTADO */}
           <div className="absolute left-12 top-1/2 -translate-y-1/2 flex flex-col gap-6">
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado Sistólico</span>
                 <p className="text-sm font-bold text-white/80">{ritmoBPM > 140 ? 'Taquicardia Severa' : ritmoBPM < 50 ? 'Bradicardia' : 'Ritmo Sinusal Normal'}</p>
              </div>
              <div className="space-y-1">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Última Intervención</span>
                 <p className="text-sm font-bold text-teal-400">{lastDrug || 'Ninguna'}</p>
              </div>
           </div>
        </div>

        {/* OSCILLOSCOPE BOTTOM */}
        <div className="h-64 bg-black/60 backdrop-blur-3xl border-t border-white/10 relative overflow-hidden">
           <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="w-full h-full">
              <path 
                ref={pathRef}
                fill="none" 
                stroke="#2dd4bf" 
                strokeWidth="5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                filter="drop-shadow(0 0 12px rgba(45, 212, 191, 0.4))"
              />
           </svg>
           
           {/* Monitor Overlays */}
           <div className="absolute top-4 left-6 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Live Trace • Lead II</span>
           </div>

           <div className="absolute bottom-6 right-8 flex gap-4">
              <div className="bg-slate-900/80 border border-white/10 px-6 py-3 rounded-2xl flex flex-col items-center">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Frecuencia (f)</span>
                 <span className="text-lg font-black text-white">{(ritmoBPM / 60).toFixed(2)} Hz</span>
              </div>
              <div className="bg-slate-900/80 border border-white/10 px-6 py-3 rounded-2xl flex flex-col items-center">
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Intervalo R-R</span>
                 <span className="text-lg font-black text-white">{(60000 / ritmoBPM).toFixed(0)} ms</span>
              </div>
           </div>
        </div>
      </div>

      {/* INTERACTIVE CONTROLS: DRUGS & VALIDATION */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-10">
         <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 shadow-[0_0_80px_rgba(0,0,0,0.5)] flex items-center justify-between gap-12">
            
            <div className="flex gap-6 items-center flex-1">
               <div className="p-3 bg-teal-500/10 rounded-2xl">
                 <Droplets className="text-teal-400" size={24} />
               </div>
               <div className="flex-1 grid grid-cols-2 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => aplicarFarmaco('Adrenalina')}
                    className="py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-900/20 border-b-4 border-rose-800"
                  >
                    + Adrenalina
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => aplicarFarmaco('Acetilcolina')}
                    className="py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-900/20 border-b-4 border-indigo-800"
                  >
                    - Acetilcolina
                  </motion.button>
               </div>
            </div>

            <div className="h-20 w-px bg-white/10" />

            <div className="flex items-center gap-8">
               <div className="text-right">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Dosis Suministradas</span>
                  <span className="text-3xl font-black text-white tabular-nums">{dosage}</span>
               </div>
               
               <motion.button 
                 whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                 onClick={handleValidar}
                 className={`px-12 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center gap-3 shadow-2xl ${status === 'error' ? 'bg-rose-600 animate-shake' : 'bg-teal-600 hover:bg-teal-500'}`}
               >
                 <ShieldCheck size={18} />
                 Validar Estabilidad
               </motion.button>
            </div>
         </div>
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
         {status === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
               <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-teal-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(45,212,191,0.1)]">
                  <div className="w-24 h-24 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 size={60} className="text-teal-400" />
                  </div>
                  <h3 className="text-5xl font-black text-white uppercase italic mb-6">Paciente Crítico Estabilizado</h3>
                  <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                    Has logrado sincronizar el ritmo cardíaco con una precisión del **{(100 - (Math.abs(ritmoBPM - targetBPM)/targetBPM)*100).toFixed(1)}%**. 
                    Los parámetros hemodinámicos han sido registrados en la bitácora médica digital.
                  </p>
                  <div className="flex flex-col gap-4">
                    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex justify-between items-center">
                       <span className="text-xs font-black text-slate-500 uppercase">Hallazgos Registrados</span>
                       <span className="text-teal-400 font-mono">BIO-08 SECURE</span>
                    </div>
                    <button onClick={() => window.location.reload()} className="w-full py-6 bg-teal-600 hover:bg-teal-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-all shadow-lg shadow-teal-600/30">Finalizar Misión Médica</button>
                  </div>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
