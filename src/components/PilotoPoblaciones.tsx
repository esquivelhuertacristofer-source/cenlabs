"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Target, ShieldCheck, CheckCircle2, Bot, Info, Settings2, Play, Pause, RefreshCcw } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

export default function PilotoPoblaciones() {
  const { ecosistema, tickEcosistema, setEcosistema, registrarHallazgo, setBitacora, bitacoraData, stopTimer, setPasoActual, audio, setAsistente } = useSimuladorStore();
  const { poblacionPresas, poblacionDepredadores, historial, status, simulando, tiempoVirtual, parametros } = ecosistema;
  
  // Guard for persisted state migrations
  if (!parametros) return null;
  const [viewMode, setViewMode] = useState<'standard' | 'phase'>('standard');
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

  // Generar trazados para el gráfico
  const generatePath = (data: Array<{ t: number, presas: number, depredadores: number }>, type: 'x' | 'y') => {
    if (data.length < 2) return "";
    const width = 800;
    const height = 200;
    const maxPop = 300; 
    return data.map((p, i) => {
        const xPos = (i / (data.length - 1)) * width;
        const val = type === 'x' ? p.presas : p.depredadores;
        const yPos = height - (Math.min(val, maxPop) / maxPop) * height;
        return `${i === 0 ? 'M' : 'L'} ${xPos} ${yPos}`;
    }).join(" ");
  };

  const generatePhasePath = (data: Array<{ t: number, presas: number, depredadores: number }>) => {
    if (data.length < 2) return "";
    const size = 300;
    const max = 300;
    return data.map((p, i) => {
        const xPos = (Math.min(p.presas, max) / max) * size;
        const yPos = size - (Math.min(p.depredadores, max) / max) * size;
        return `${i === 0 ? 'M' : 'L'} ${xPos} ${yPos}`;
    }).join(" ");
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden bg-[#020617] font-['Outfit'] text-white">
      
      {/* 1. MONITOR DE OSCILACIÓN (ARRIBA) */}
      <div className="p-8 pb-0">
        <div className="bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center mb-8 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-500/10 rounded-2xl">
                    <Activity className="text-blue-400" size={20} />
                 </div>
                 <div>
                    <h4 className="text-[11px] font-black uppercase text-blue-300 tracking-[0.2em] leading-none mb-1">Lotka-Volterra Engine</h4>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest italic">Dinámica Interespecífica</p>
                 </div>
              </div>
              <div className="flex gap-8">
                  <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-[#EC4899] shadow-[0_0_100px_#EC4899]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presas</span>
                      </div>
                      <span className="text-3xl font-black tabular-nums">{poblacionPresas.toFixed(0)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-[#219EBC] shadow-[0_0_10px_#219EBC]" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depredadores</span>
                      </div>
                      <span className="text-3xl font-black tabular-nums">{poblacionDepredadores.toFixed(0)}</span>
                  </div>
              </div>
          </div>

          <div className="h-64 relative">
            <svg width="100%" height="100%" viewBox="0 0 800 200" className="overflow-visible" preserveAspectRatio="none">
                <motion.path 
                    initial={false}
                    animate={{ d: generatePath(historial, 'x') }}
                    fill="none" stroke="#EC4899" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    className="drop-shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                />
                <motion.path 
                    initial={false}
                    animate={{ d: generatePath(historial, 'y') }}
                    fill="none" stroke="#219EBC" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    className="drop-shadow-[0_0_15px_rgba(33,158,188,0.4)]"
                />
            </svg>
            
            <AnimatePresence>
                {status === 'extinction' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-rose-950/60 backdrop-blur-md flex items-center justify-center rounded-3xl border-2 border-rose-500/30">
                        <div className="text-center">
                            <h5 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4">Ecosistema Colapsado</h5>
                            <button onClick={() => setEcosistema({ poblacionPresas: 100, poblacionDepredadores: 20, historial: [], status: 'simulating', tiempoVirtual: 0 })} className="px-10 py-4 bg-white text-rose-600 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">Reiniciar Equilibrio</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 2. DOCK DE CONTROL Y PARÁMETROS */}
      <div className="flex-1 p-8 flex gap-8 h-full min-h-0">
         
         {/* LADO IZQUIERDO: VISUALIZACIÓN */}
         <div className="flex-1 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 relative flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-8 relative z-10">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Simulación Fenotípica</span>
               <button 
                 onClick={() => setViewMode(prev => prev === 'standard' ? 'phase' : 'standard')}
                 className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 transition-all"
               >
                 {viewMode === 'standard' ? 'Diagrama de Fase' : 'Prado Virtual'}
               </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center">
               <AnimatePresence mode="wait">
                  {viewMode === 'standard' ? (
                     <motion.div key="std" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full relative grid grid-cols-10 gap-2 content-start opacity-60">
                        {[...Array(Math.min(Math.floor(poblacionPresas/2), 80))].map((_, i) => (
                           <motion.div key={`p-${i}`} animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: Math.random() }} className="w-2 h-2 bg-[#EC4899] rounded-full blur-[1px]" />
                        ))}
                        {[...Array(Math.min(Math.floor(poblacionDepredadores), 40))].map((_, i) => (
                           <motion.div key={`d-${i}`} animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: Math.random() }} className="w-3 h-3 bg-[#219EBC] rotate-45" />
                        ))}
                     </motion.div>
                  ) : (
                     <motion.div key="ph" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative border-l border-b border-white/20 p-8">
                        <svg width="300" height="300" className="overflow-visible">
                           <motion.path initial={false} animate={{ d: generatePhasePath(historial) }} fill="none" stroke="#FB8500" strokeWidth="3" className="drop-shadow-[0_0_10px_#FB8500]" />
                           <motion.circle animate={{ cx: (Math.min(poblacionPresas, 300) / 300) * 300, cy: 300 - (Math.min(poblacionDepredadores, 300) / 300) * 300 }} r="6" fill="white" className="shadow-lg shadow-white" />
                        </svg>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
         </div>

         {/* LADO DERECHO: SLIDERS */}
         <div className="w-[450px] bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 flex flex-col shadow-2xl">
            <div className="flex items-center gap-3 mb-10">
               <Settings2 className="text-blue-400" size={20} />
               <h4 className="text-xs font-black uppercase tracking-widest">Parámetros de Biosfera</h4>
            </div>

            <div className="space-y-10 flex-1">
               <SliderControl label="Natalidad de Presas (α)" value={parametros.alpha} min={0.1} max={1.5} onChange={(v) => handleUpdateParam('alpha', v)} color="#EC4899" />
               <SliderControl label="Eficacia Depredadora (β)" value={parametros.beta} min={0.001} max={0.1} step={0.001} onChange={(v) => handleUpdateParam('beta', v)} color="#219EBC" />
               <SliderControl label="Mortalidad Depredadores (γ)" value={parametros.gamma} min={0.1} max={1.5} onChange={(v) => handleUpdateParam('gamma', v)} color="#3b82f6" />
               <SliderControl label="Conversión de Biomasa (δ)" value={parametros.delta} min={0.001} max={0.1} step={0.001} onChange={(v) => handleUpdateParam('delta', v)} color="#fb8500" />
            </div>

            <div className="mt-10 pt-10 border-t border-white/10 flex gap-4">
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
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
         {status === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
               <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-blue-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(59,130,246,0.1)]">
                  <CheckCircle2 size={100} className="text-blue-500 mx-auto mb-8" />
                  <h3 className="text-5xl font-black text-white uppercase italic mb-6">Equilibrio Certificado</h3>
                  <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                    Has logrado configurar un ecosistema estable basado en las ecuaciones de **Lotka-Volterra**. La resiliencia del sistema ha sido auditada y registrada exitosamente.
                  </p>
                  <button onClick={() => window.location.reload()} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/30">Finalizar Auditoría Ecológica</button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
};

function SliderControl({ label, value, min, max, step = 0.01, onChange, color }: any) {
  return (
    <div className="space-y-4">
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
