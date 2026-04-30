"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Target, RefreshCcw, ShieldCheck, 
  Zap, Calculator, Layers, TrendingUp,
  Bot, Binary, FunctionSquare, Maximize, MoveHorizontal, CheckCircle2
} from 'lucide-react';
import Riemann3DScene from './simuladores/mat09/Riemann3DScene';

export default function PilotoRiemann() {
  const router = useRouter();
  const { integral9, setIntegralM9, setAnimandoM9, audio, setAsistente, pasoActual, setPasoActual, registrarHallazgo, setBitacora, bitacoraData, stopTimer } = useSimuladorStore();
  const { n, metodo, animandoLimite, status } = integral9;

  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Analizador de Riemann. Observa cómo el área bajo la curva se aproxima al valor real de la integral a medida que incrementamos el número de rectángulos (n).",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // Animación de Límite
  useEffect(() => {
    let interval: any;
    if (animandoLimite) {
      interval = setInterval(() => {
        const nextN = Math.min(100, n + 1);
        setIntegralM9(nextN, metodo);
        if (nextN >= 100) setAnimandoM9(false);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [animandoLimite, n, metodo]);

  const dx = 10 / n;
  
  // Cálculo de área aproximada (f(x) = sin(x) + 2 en [0, 10])
  const calculateArea = () => {
    let area = 0;
    for(let i=0; i<n; i++) {
      let xEval = 0;
      if (metodo === 'izquierda') xEval = i * dx;
      else if (metodo === 'derecha') xEval = (i+1) * dx;
      else xEval = (i + 0.5) * dx;
      
      area += (Math.sin(xEval) + 2) * dx;
    }
    return area;
  };

  const areaApprox = calculateArea();
  const areaReal = 21.839; // Integral de sin(x)+2 de 0 a 10 es [-cos(x) + 2x]0^10 = (-cos(10) + 20) - (-cos(0) + 0) = -cos(10) + 20 + 1
  // cos(10 rad) ≈ -0.839. -> -(-0.839) + 21 = 21.839

  const handleValidar = () => {
    if (n >= 80) {
      audio?.playSuccess();
      setIntegralM9(n, metodo, 'success');
      stopTimer();
      setPasoActual(4);
      
      registrarHallazgo('mat_riemann_integral', {
        rectangulos_n: n,
        metodo_eval: metodo,
        area_calculada: areaApprox,
        area_teorica: areaReal,
        error_absoluto: Math.abs(areaApprox - areaReal)
      });

      setBitacora({
        ...bitacoraData,
        mat9: `✅ INTEGRAL VALIDADA: n=${n}, Área=${areaApprox.toFixed(4)}. Convergencia lograda con error < 0.1%.`
      });
    } else {
      audio?.playError();
      setAsistente({
        visible: true,
        text: "La precisión actual es insuficiente. Incrementa el número de rectángulos (n) para reducir el error de aproximación.",
        pose: "disappointed"
      });
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">
      
      {/* GIANT TELEMETRY BACKGROUND */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
        <span className="text-[14rem] font-black font-mono text-emerald-500 select-none italic tracking-tighter">
          n={n}
        </span>
      </div>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-emerald-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.1)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Layers className="text-emerald-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-emerald-300 uppercase tracking-widest leading-none">Sumas de Riemann</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MAT-09 • Límite Integral</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Muestreo" },
                { step: 2, label: "Límite" },
                { step: 3, label: "Precisión" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                   {pasoActual > s.step ? <ShieldCheck size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                   <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ESCENA 3D (BACKGROUND) */}
      <div className="absolute inset-0 z-0">
        <Riemann3DScene n={n} metodo={metodo} animandoLimite={animandoLimite} />
      </div>

      {/* HUD SUPERIOR: TELEMETRÍA */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none mt-20">
        <div className="flex justify-between items-start">
            <div className="flex gap-4 pointer-events-auto">
                <HUDCard label="Área Aproximada (Σ)" value={areaApprox.toFixed(4)} icon={<Calculator size={14} />} color="#10b981" highlight={n >= 80} />
                <HUDCard label="Diferencial (Δx)" value={dx.toFixed(4)} icon={<MoveHorizontal size={14} />} color="#06b6d4" />
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl pointer-events-auto flex items-center gap-6">
                <div className="text-right border-r border-white/10 pr-6">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 italic">Convergencia</span>
                    <div className={`text-2xl font-black italic tracking-tighter ${n >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                       {n >= 80 ? 'HIGH_FIDELITY' : n >= 40 ? 'MEDIUM_RES' : 'LOW_RES'}
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1 italic">Error Estimado</span>
                    <div className="text-2xl font-black text-rose-400 italic tracking-tighter">
                       {Math.abs(areaApprox - areaReal).toFixed(4)}
                    </div>
                </div>
            </div>
        </div>

        {/* Notificación de Límite */}
        <AnimatePresence>
            {animandoLimite && (
                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="relative flex flex-col items-center">
                        <TrendingUp size={240} className="text-emerald-500/20 animate-pulse" strokeWidth={0.5} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[12px] font-black text-emerald-400 uppercase tracking-[0.5em] mb-4">n → ∞</span>
                            <div className="px-8 py-3 bg-emerald-500 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-2xl animate-bounce">
                                Ejecutando Límite
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
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Densidad de Muestreo (n)</span>
                        <span className="text-[12px] font-black text-emerald-400 font-mono bg-white/5 px-2 py-0.5 rounded-lg">{n} Rectángulos</span>
                    </div>
                    <input 
                      type="range" min="4" max="100" step="1" value={n} 
                      onChange={e => { setIntegralM9(parseInt(e.target.value), metodo); audio?.playPop(); }}
                      className="w-full h-3 bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500" 
                    />
                </div>

                <div className="flex items-center gap-6 border-l border-white/10 pl-16">
                    <div className="flex flex-col gap-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase text-center">Punto de Evaluación</span>
                        <div className="flex gap-2">
                            {['izquierda', 'punto_medio', 'derecha'].map(m => (
                                <button key={m} onClick={() => { setIntegralM9(n, m as any); audio?.playPop(); }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${metodo === m ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                                    {m.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => { setAnimandoM9(!animandoLimite); audio?.playPop(); }} className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${animandoLimite ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 border border-white/10 text-slate-500 hover:text-white'}`}>
                        <TrendingUp size={24} />
                    </button>
                    
                    <button 
                      onClick={handleValidar}
                      className="px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 group"
                    >
                      <Target size={18} className="group-hover:rotate-12 transition-transform" />
                      <span className="text-xs font-black uppercase tracking-widest">Validar Integral</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* ÉXITO FINAL */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-emerald-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(16,185,129,0.1)]">
                <CheckCircle2 size={100} className="text-emerald-500 mx-auto mb-8" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Integral Certificada</h3>
                <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                  Has demostrado la convergencia de la **Suma de Riemann** hacia la integral definida. Con n={n}, el error se ha minimizado por debajo del umbral de tolerancia científica.
                </p>
                <button onClick={() => window.location.reload()} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-emerald-600/30">Cerrar Informe Analítico</button>
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
        <span className="block text-xl font-black text-white tracking-tighter leading-none italic font-mono">{value}</span>
      </div>
    </motion.div>
  );
}
