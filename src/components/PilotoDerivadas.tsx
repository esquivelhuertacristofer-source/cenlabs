"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Target, RefreshCcw, ShieldCheck, 
  Zap, Compass, Calculator, TrendingUp,
  Bot, Binary, MoveHorizontal
} from 'lucide-react';
import Derivadas3DScene from './simuladores/mat08/Derivadas3DScene';

export default function PilotoDerivadas() {
  const router = useRouter();
  const { derivada8, resetM8, audio, setAsistente, pasoActual, setPasoActual, bitacoraData, setDerivada8 } = useSimuladorStore();
  const { xActual, mostrarDerivada, status } = derivada8;

  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Explorador Diferencial. Desliza el punto sobre la curva para encontrar el punto crítico donde la pendiente de la recta tangente es exactamente cero.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  const m = Math.pow(xActual, 2) - 4 * xActual + 3;
  const isCritical = Math.abs(m) < 0.05;

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (xActual !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (mostrarDerivada && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [xActual, mostrarDerivada, status, pasoActual, setPasoActual]);

  const handleUpdate = (data: any) => {
    setDerivada8({ ...derivada8, ...data });
    audio?.playPop();
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">
      
      {/* ── GIANT TELEMETRY BACKGROUND ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
        <span className="text-[14rem] font-black font-mono text-indigo-500 select-none italic">
          {m.toFixed(3)}
        </span>
      </div>

      {/* ── CHECKLIST HUD (DIAMOND STANDARD) ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-indigo-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(99,102,241,0.1)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 rounded-xl">
                <Calculator className="text-indigo-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none">Análisis Diferencial</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MAT-08 • Razón de Cambio</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Posición" },
                { step: 2, label: "Tangente" },
                { step: 3, label: "Sincronía" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                   {pasoActual > s.step ? <ShieldCheck size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                   <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ESCENA 3D (BACKGROUND) ── */}
      <div className="absolute inset-0 z-0">
        <Derivadas3DScene 
          xActual={xActual} 
          mostrarDerivada={mostrarDerivada} 
          status={status}
        />
      </div>

      {/* ── HUD SUPERIOR: TELEMETRÍA ── */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none mt-20">
        <div className="flex justify-between items-start">
            <div className="flex gap-4 pointer-events-auto">
                <HUDCard label="Pendiente (dy/dx)" value={m.toFixed(4)} icon={<TrendingUp size={14} />} color={isCritical ? "#facc15" : "#6366f1"} highlight={isCritical} />
                <HUDCard label="Coordenada X" value={xActual.toFixed(2)} icon={<MoveHorizontal size={14} />} color="#3b82f6" />
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl pointer-events-auto">
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 italic">Estado del Sistema</span>
                    <div className={`text-2xl font-black italic tracking-tighter ${isCritical ? 'text-amber-400' : 'text-slate-400'}`}>
                       {isCritical ? 'CRITICAL_ZERO' : 'SCANNING_CURVE'}
                    </div>
                </div>
                <div className="h-12 w-px bg-white/10" />
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 italic">Concavidad</span>
                    <div className="text-2xl font-black text-indigo-400 italic tracking-tighter uppercase">
                       {2 * xActual - 4 > 0 ? 'Convexa ∪' : 'Cóncava ∩'}
                    </div>
                </div>
            </div>
        </div>

        {/* Notificación de Punto Crítico */}
        <AnimatePresence>
            {isCritical && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="relative flex flex-col items-center">
                        <TrendingUp size={240} className="text-amber-500/20 animate-pulse" strokeWidth={0.5} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[12px] font-black text-amber-400 uppercase tracking-[0.5em] mb-4">Slope Zero Detected</span>
                            <div className="px-8 py-3 bg-amber-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl animate-bounce">
                                Punto Crítico
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Dock de Control Inferior */}
        <div className="mt-auto flex justify-between items-end gap-10 pointer-events-auto">
            <div className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] flex-1 shadow-2xl flex items-center justify-between gap-16">
                <div className="flex-1 space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Desplazamiento en la Curva</span>
                        <span className="text-[12px] font-black text-indigo-400 font-mono bg-white/5 px-2 py-0.5 rounded-lg">{xActual.toFixed(2)} units</span>
                    </div>
                    <input 
                      type="range" min="0" max="4" step="0.01" value={xActual} 
                      onChange={e => handleUpdate({ xActual: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500" 
                    />
                </div>

                <div className="flex items-center gap-6 border-l border-white/10 pl-16">
                    <button 
                      onClick={() => handleUpdate({ mostrarDerivada: !mostrarDerivada })}
                      className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${mostrarDerivada ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                    >
                        {mostrarDerivada ? 'Ocultar Tangente' : 'Mostrar Tangente'}
                    </button>
                    <button onClick={() => { resetM8(); audio?.playPop(); }} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-xl">
                        <RefreshCcw size={24} />
                    </button>
                </div>
            </div>

            <button 
              onClick={() => {
                if (isCritical) {
                  audio?.playSuccess();
                  setDerivada8({ ...derivada8, status: 'success' });
                  setPasoActual(3);
                } else {
                  audio?.playError();
                }
              }}
              className={`w-20 h-20 rounded-3xl border flex items-center justify-center transition-all shadow-2xl ${status === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-indigo-600 border-indigo-500 text-white hover:scale-105 active:scale-95'}`}
            >
                {status === 'success' ? <ShieldCheck size={32} /> : <Target size={32} />}
            </button>
        </div>
      </div>

      {/* ÉXITO FINAL */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-indigo-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(99,102,241,0.15)]">
                <Calculator size={100} className="text-indigo-500 mx-auto mb-8" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Derivada Certificada</h3>
                <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">Has localizado el punto de inflexión donde la tasa de cambio instantánea se anula. El análisis diferencial ha sido validado bajo el estándar **Diamond State**.</p>
                <button onClick={() => router.push('/alumno/laboratorio/matematicas')} className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-indigo-600/30">Cerrar Informe Diferencial</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

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
        <span className="block text-2xl font-black text-white tracking-tighter leading-none italic font-mono">{value}</span>
      </div>
    </motion.div>
  );
}
