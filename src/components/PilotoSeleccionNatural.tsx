"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Bird, Activity, ShieldCheck, CheckCircle2, Play, RefreshCcw } from 'lucide-react';
import SeleccionNatural3DScene from './simuladores/bio06/SeleccionNatural3DScene';

export default function PilotoSeleccionNatural() {
  const { evolucion, tickEvolucion, cazarPolilla, setEvolucion, generarSemillaB6, validarB6, finalizarGeneracion, setBitacora, bitacoraData, stopTimer, setPasoActual, audio, setAsistente } = useSimuladorStore();
  const { ambiente, isRunning, bugs, tiempo, status, generacion } = evolucion;
  const router = useRouter();

  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const isRunningRef = useRef(isRunning);
  const [mounted, setMounted] = useState(false);

  // Keep isRunningRef in sync
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    setMounted(true);
    generarSemillaB6();
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de Genética de Poblaciones. Tu misión es actuar como el agente de selección natural para demostrar cómo el ambiente industrial favorece a las polillas oscuras sobre las claras.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  const animate = (time: number) => {
    if (lastTimeRef.current !== undefined && isRunningRef.current) {
      const dt = (time - lastTimeRef.current) / 1000;
      tickEvolucion(dt);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = undefined;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning]);

  // Cálculos Hardy-Weinberg
  const claras = bugs.filter(b => b.tipo === 'clara' && !b.cazada).length;
  const oscuras = bugs.filter(b => b.tipo === 'oscura' && !b.cazada).length;
  const q_freq = claras / (claras + oscuras || 1); // Frecuencia del alelo recesivo (clara)
  const p_freq = 1 - q_freq; // Frecuencia del alelo dominante (oscura)

  const handleHunt = (id: number) => {
    if (!isRunning) return;
    cazarPolilla(id);
    audio?.playPop();
  };

  const handleValidar = () => {
    const ok = validarB6();
    if (ok) {
      audio?.playSuccess();
      setEvolucion({ isRunning: false });
      stopTimer();
      setPasoActual(4);
      setBitacora({
        ...bitacoraData,
        bio6: `✅ SELECCIÓN NATURAL VALIDADA: Ambiente ${ambiente}. Frecuencia Oscura (p)=${p_freq.toFixed(2)}. Adaptación fenotípica demostrada.`
      });
    } else {
      audio?.playError();
      setAsistente({
        visible: true,
        text: "La presión selectiva aún no es suficiente. Debes eliminar a los individuos menos aptos para el ambiente actual.",
        pose: "disappointed"
      });
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative bg-[#020617] overflow-hidden font-['Outfit'] text-white">

       {/* 1. ECOSISTEMA 3D — escena evolutiva a pantalla completa (fondo z-0).
           Cada polilla es clickeable (actúa como depredador) mientras corre. */}
       <div className="absolute inset-0 z-0">
          <SeleccionNatural3DScene
            bugs={bugs}
            ambiente={ambiente}
            generacion={generacion}
            onHunt={handleHunt}
          />
       </div>

       {/* velo de contraste para legibilidad del HUD */}
       <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#020617]/70 via-transparent to-[#020617]/80" />

       {/* Capa de interfaz — deja pasar la interacción salvo en los paneles */}
       <main className="absolute inset-0 z-10 pointer-events-none">

       {/* 3. TOP HUD: GENÉTICA DE POBLACIONES */}
       <div className="absolute top-10 left-0 right-0 z-50 px-10 flex justify-between items-start">
          <div className="flex gap-6 pointer-events-auto">
             <HUDCard label="Alelo Dominante (p)" value={p_freq.toFixed(2)} icon={<Activity size={14} />} color={ambiente === 'industrial' ? "#3b82f6" : "#94a3b8"} highlight={ambiente === 'industrial' && p_freq > 0.8} />
             <HUDCard label="Alelo Recesivo (q)" value={q_freq.toFixed(2)} icon={<Activity size={14} />} color={ambiente === 'limpio' ? "#10b981" : "#94a3b8"} highlight={ambiente === 'limpio' && q_freq > 0.8} />
          </div>

          <div className="bg-black/60 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl pointer-events-auto">
             <div className="text-right">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Presión Selectiva</span>
                <span className="text-2xl font-black text-amber-400 italic tracking-tighter uppercase">{ambiente === 'industrial' ? 'Industrial' : 'Natural'}</span>
             </div>
             <div className="h-12 w-px bg-white/10" />
             <div className="text-right">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Tiempo</span>
                <span className="text-3xl font-black text-white font-mono">{Math.ceil(tiempo)}s</span>
             </div>
          </div>
       </div>

       {/* 4. DOCK DE CONTROL INFERIOR */}
       <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-5xl px-10 pointer-events-none">
          <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-8 shadow-2xl flex items-center justify-between gap-12 pointer-events-auto">
             <div className="flex items-center gap-6">
                <div className="p-4 bg-amber-500/10 rounded-2xl">
                   <Bird className="text-amber-500" size={24} />
                </div>
                <div>
                   <h4 className="text-xs font-black text-white uppercase tracking-widest">Agente de Selección</h4>
                   <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Haz clic sobre las polillas resaltadas para alterar las frecuencias alélicas.</p>
                </div>
             </div>

             <div className="h-16 w-px bg-white/10" />

             <div className="flex items-center gap-4">
                <div className="flex flex-col gap-1 items-end mr-4">
                   <span className="text-[9px] font-black text-slate-500 uppercase">Individuos Restantes</span>
                   <span className="text-2xl font-black text-white">{claras + oscuras}</span>
                </div>
                <button
                  onClick={() => setEvolucion({ isRunning: true })}
                  disabled={isRunning || status === 'success'}
                  className="px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center gap-3 shadow-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40"
                >
                  <Play size={16} fill="currentColor" />
                  Iniciar
                </button>
                <button
                  onClick={() => { finalizarGeneracion(); setEvolucion({ tiempo: 30, isRunning: false }); }}
                  disabled={isRunning || tiempo > 0 || generacion >= 3 || status === 'success'}
                  className="px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center gap-3 shadow-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40"
                >
                  <Activity size={16} />
                  Sig. Generación ({generacion}/3)
                </button>
                <button
                  onClick={() => setEvolucion({ ambiente: ambiente === 'limpio' ? 'industrial' : 'limpio' })}
                  className="px-8 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center gap-3 shadow-2xl bg-slate-600 hover:bg-slate-500"
                >
                  <RefreshCcw size={16} />
                  Cambiar Ambiente
                </button>
                <button
                  onClick={handleValidar}
                  className={`px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center gap-3 shadow-2xl ${status === 'success' ? 'bg-emerald-600' : 'bg-amber-600 hover:bg-amber-500'}`}
                >
                  <ShieldCheck size={18} />
                  Validar Selección
                </button>
             </div>
          </div>
       </div>

       {/* SUCCESS MODAL */}
       <AnimatePresence>
          {status === 'success' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12 pointer-events-auto">
                <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-emerald-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                   <CheckCircle2 size={100} className="text-emerald-500 mx-auto mb-8" />
                   <h3 className="text-5xl font-black text-white uppercase italic mb-6">Selección Validada</h3>
                   <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                     Has demostrado el desplazamiento del **Equilibrio de Hardy-Weinberg** bajo presión selectiva.
                     La frecuencia del alelo favorable ha superado el 80%, consolidando la adaptación evolutiva del enjambre.
                   </p>
                   <button onClick={() => router.push('/hub')} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-all shadow-lg shadow-emerald-600/30">Finalizar Ciclo Evolutivo</button>
                </motion.div>
             </motion.div>
          )}
       </AnimatePresence>

       </main>
    </div>
  );
};

function HUDCard({ label, value, icon, color, highlight = false }: any) {
  return (
    <motion.div
      animate={highlight ? { scale: [1, 1.05, 1], borderColor: [color, "#FFF", color] } : {}}
      transition={{ duration: 0.5, repeat: highlight ? Infinity : 0 }}
      className={`px-8 py-5 rounded-[2rem] border border-white/10 flex items-center gap-5 transition-all bg-[#0A1121]/80 backdrop-blur-md shadow-2xl`}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</span>
        <span className="block text-xl font-black text-white tracking-tighter leading-none italic font-mono">{value}</span>
      </div>
    </motion.div>
  );
}
