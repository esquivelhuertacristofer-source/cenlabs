"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, CheckCircle2, Bot, Settings2, Play, Pause } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import Poblaciones3DScene from './simuladores/bio10/Poblaciones3DScene';

export default function PilotoPoblaciones() {
  const router = useRouter();
  const { ecosistema, tickEcosistema, setEcosistema, registrarHallazgo, setBitacora, bitacoraData, stopTimer, setPasoActual, audio, setAsistente } = useSimuladorStore();
  const { poblacionPresas, poblacionDepredadores, historial, status, simulando, tiempoVirtual, parametros } = ecosistema;

  const requestRef = useRef<number>(undefined!);
  const lastTimeRef = useRef<number>(undefined!);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al Laboratorio de Ecología Matemática. Ajusta los parámetros de natalidad y depredación para estabilizar el sistema Lotka-Volterra sin llegar a la extinción.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  const animate = (time: number) => {
    if (lastTimeRef.current !== undefined && simulando) {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      tickEcosistema(deltaTime * 1.5);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [simulando]);

  const handleValidar = () => {
    const minHistory = 50;
    if (historial.length > minHistory && status !== 'extinction') {
      audio?.playSuccess();
      setEcosistema({ status: 'success', simulando: false });
      stopTimer();
      setPasoActual(4);

      registrarHallazgo('bio_poblaciones_stability', {
        parametros,
        presas_final: poblacionPresas,
        depredadores_final: poblacionDepredadores,
        ciclos_completados: Math.floor(tiempoVirtual / 10)
      });

      setBitacora({
        ...bitacoraData,
        bio10: `✅ ESTABILIDAD ECOLÓGICA VALIDADA: Parámetros α=${parametros.alpha}, γ=${parametros.gamma}. Equilibrio dinámico mantenido por ${tiempoVirtual.toFixed(1)}s.`
      });
    } else {
      audio?.playError();
      setAsistente({
        visible: true,
        text: "El ecosistema aún es inestable o no hay suficientes datos históricos para certificar el equilibrio.",
        pose: "disappointed"
      });
    }
  };

  const handleUpdateParam = (key: keyof typeof parametros, val: number) => {
    setEcosistema({ parametros: { ...parametros, [key]: val } });
    audio?.playPop();
  };

  if (!mounted || !parametros) return null;

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden bg-[#02040a] font-['Outfit'] text-white">

      {/* ── ESCENA 3D — ECOSISTEMA LOTKA-VOLTERRA (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <Poblaciones3DScene
          presas={poblacionPresas}
          depredadores={poblacionDepredadores}
          historial={historial}
          parametros={parametros}
          simulando={simulando}
        />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#02040a]/70 via-transparent to-[#02040a]/85" />

      {/* ── CAPA DE INTERFAZ (deja pasar OrbitControls salvo en paneles) ── */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">

        {/* 1. MONITOR DE OSCILACIÓN (ARRIBA) */}
        <div className="p-8 pb-0">
          <div className="bg-black/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] px-10 py-6 relative overflow-hidden shadow-2xl pointer-events-auto">
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <Activity className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase text-blue-300 tracking-[0.2em] leading-none mb-1">Lotka-Volterra Engine</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Dinámica Interespecífica 3D</p>
                  </div>
                </div>
                <div className="flex gap-8">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-[#EC4899] shadow-[0_0_10px_#EC4899]" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presas</span>
                        </div>
                        <span className="text-3xl font-black tabular-nums">{poblacionPresas.toFixed(0)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-[#22d3ee] shadow-[0_0_10px_#22d3ee]" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depredadores</span>
                        </div>
                        <span className="text-3xl font-black tabular-nums">{poblacionDepredadores.toFixed(0)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]" />
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ciclo (t)</span>
                        </div>
                        <span className="text-3xl font-black tabular-nums">{tiempoVirtual.toFixed(1)}</span>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* Hueco central: la simulación 3D vive detrás (z-0) y recibe arrastre/zoom. */}
        <div className="flex-1" />

        {/* Overlay de COLAPSO (extinción) sobre la escena 3D */}
        <AnimatePresence>
            {status === 'extinction' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-rose-950/50 backdrop-blur-md flex items-center justify-center pointer-events-auto">
                    <div className="text-center">
                        <h5 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-6 drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]">Ecosistema Colapsado</h5>
                        <button onClick={() => setEcosistema({ poblacionPresas: 100, poblacionDepredadores: 20, historial: [], status: 'simulating', tiempoVirtual: 0 })} className="px-10 py-4 bg-white text-rose-600 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">Reiniciar Equilibrio</button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* 2. DOCK DE PARÁMETROS (DERECHA, flotante sobre la escena) */}
        <div className="absolute top-1/2 -translate-y-1/2 right-8 w-[420px] bg-slate-900/70 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col shadow-2xl pointer-events-auto">
            <div className="flex items-center gap-3 mb-8">
              <Settings2 className="text-blue-400" size={20} />
              <h4 className="text-xs font-black uppercase tracking-widest">Parámetros de Biosfera</h4>
            </div>

            <div className="space-y-7 flex-1">
              <SliderControl label="Natalidad de Presas (α)" value={parametros.alpha} min={0.1} max={1.5} onChange={(v: number) => handleUpdateParam('alpha', v)} color="#EC4899" />
              <SliderControl label="Eficacia Depredadora (β)" value={parametros.beta} min={0.001} max={0.1} step={0.001} onChange={(v: number) => handleUpdateParam('beta', v)} color="#22d3ee" />
              <SliderControl label="Mortalidad Depredadores (γ)" value={parametros.gamma} min={0.1} max={1.5} onChange={(v: number) => handleUpdateParam('gamma', v)} color="#3b82f6" />
              <SliderControl label="Conversión de Biomasa (δ)" value={parametros.delta} min={0.001} max={0.1} step={0.001} onChange={(v: number) => handleUpdateParam('delta', v)} color="#fb8500" />
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 flex gap-4">
              <button
                onClick={() => setEcosistema({ simulando: !simulando })}
                className={`flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all ${simulando ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' : 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'}`}
              >
                {simulando ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                {simulando ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                onClick={handleValidar}
                className="flex-1 h-16 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
              >
                <ShieldCheck size={18} /> Validar Ciclo
              </button>
            </div>
        </div>

        {/* ASISTENTE (izquierda) */}
        <AnimatePresence>
          {status !== 'success' && (
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }} className="absolute bottom-10 left-8 z-30 max-w-xs bg-[#0f172a]/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl pointer-events-auto">
              <div className="flex items-center gap-3 mb-4">
                <Bot className="text-blue-400" size={24} />
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Dr. Bio: Ecosistema</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">&quot;Las esferas rosadas son presas y los conos cian son depredadores: su número refleja N(t) en vivo. Observa la curva flotante N vs t y la asíntota K. Estabiliza el ciclo sin que el enjambre se hacine (ámbar) ni colapse.&quot;</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
         {status === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12 pointer-events-auto">
               <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-blue-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(59,130,246,0.1)]">
                  <CheckCircle2 size={100} className="text-blue-500 mx-auto mb-8" />
                  <h3 className="text-5xl font-black text-white uppercase italic mb-6">Equilibrio Certificado</h3>
                  <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                    Has logrado configurar un ecosistema estable basado en las ecuaciones de **Lotka-Volterra**. La resiliencia del sistema ha sido auditada y registrada exitosamente.
                  </p>
                  <button onClick={() => router.push('/hub')} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/30">Finalizar Auditoría Ecológica</button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
};

function SliderControl({ label, value, min, max, step = 0.01, onChange, color }: { label: string, value: number, min: number, max: number, step?: number, onChange: (v: number) => void, color: string }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
         <span className="text-xs font-black font-mono" style={{ color }}>{value.toFixed(3)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: color }}
      />
    </div>
  );
}
