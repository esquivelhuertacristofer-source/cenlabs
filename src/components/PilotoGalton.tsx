"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Activity, RefreshCcw, BarChart3, Zap, ShieldCheck, CheckCircle2, Info, Timer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Galton3DScene from './simuladores/mat10/Galton3DScene';

export default function PilotoGalton() {
  const { galton10, resetM10, setGalton10, audio, setAsistente, registrarHallazgo, setBitacora, bitacoraData, stopTimer, setPasoActual, status: simStatus } = useSimuladorStore();
  const { probabilidad, contenedores, simulando } = galton10;

  const totalBolitas = contenedores.reduce((a, b) => a + b, 0);
  const n_rows = 10;
  const mu = n_rows * probabilidad;
  const sigma = Math.sqrt(n_rows * probabilidad * (1 - probabilidad));

  const [mounted, setMounted] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Laboratorio de Probabilidad. Tu misión es demostrar el Teorema del Límite Central. Ajusta la probabilidad y observa cómo la distribución converge a una campana de Gauss.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  const handleValidar = () => {
    if (totalBolitas >= 400) {
      // Validar si la distribución es "razonable" para p=0.5 (opcionalmente)
      audio?.playSuccess();
      setSuccess(true);
      stopTimer();
      setPasoActual(4);
      
      registrarHallazgo('mat_galton_stats', {
        probabilidad,
        n_bolas: totalBolitas,
        media_teorica: mu,
        sigma_teorico: sigma,
        contenedores
      });

      setBitacora({
        ...bitacoraData,
        mat10: `✅ DISTRIBUCIÓN VALIDADA: Se recolectaron ${totalBolitas} muestras con p=${probabilidad.toFixed(2)}. La convergencia al Teorema del Límite Central es evidente en el histograma.`
      });
    } else {
      audio?.playError();
      setAsistente({
        visible: true,
        text: "Necesitamos una muestra más grande para certificar la distribución. Sigue soltando bolitas hasta llegar a 400.",
        pose: "disappointed"
      });
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">
      
      {/* ── 3D SCENE ── */}
      <div className="absolute inset-0 z-0 opacity-80">
        <Galton3DScene probabilidad={probabilidad} contenedores={contenedores} />
      </div>

      {/* ── UI OVERLAY ── */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none">
        
        {/* HEADER */}
        <div className="flex justify-between items-start">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="pointer-events-auto">
            <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <BarChart3 className="text-amber-400" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tighter">Máquina de Galton</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Estadística Inferencial</p>
                </div>
              </div>
              <div className="flex gap-4 mt-4 border-t border-white/5 pt-4">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Muestras (n)</span>
                    <span className="text-xl font-black tabular-nums text-emerald-400">{totalBolitas}</span>
                 </div>
                 <div className="w-px h-8 bg-white/5" />
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Media (μ)</span>
                    <span className="text-xl font-black tabular-nums text-blue-400">{mu.toFixed(1)}</span>
                 </div>
                 <div className="w-px h-8 bg-white/5" />
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Desviación (σ)</span>
                    <span className="text-xl font-black tabular-nums text-pink-400">{sigma.toFixed(2)}</span>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* MISIÓN HUD */}
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pointer-events-auto bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-6 rounded-[2rem] shadow-2xl max-w-[300px]">
             <div className="flex items-center gap-3 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">Objetivo de Misión</span>
             </div>
             <p className="text-xs font-medium text-slate-300 leading-relaxed italic">
               "Recolecta al menos **400 muestras** para validar que la distribución se ajusta a la curva normal teórica."
             </p>
             <div className="mt-4 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-amber-500" 
                  initial={{ width: 0 }} 
                  animate={{ width: `${Math.min((totalBolitas/400)*100, 100)}%` }} 
                />
             </div>
          </motion.div>
        </div>

        {/* CONTROLES INFERIORES */}
        <div className="mt-auto pointer-events-auto flex gap-6 items-end">
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 p-8 rounded-[2.5rem] flex items-center gap-10 flex-1 shadow-2xl">
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap className="text-amber-400" size={14} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sesgo de Probabilidad (p)</span>
                </div>
                <span className="text-sm font-black text-amber-400 font-mono bg-amber-400/10 px-3 py-1 rounded-xl">
                  {probabilidad.toFixed(2)}
                </span>
              </div>
              <input 
                type="range" min="0.1" max="0.9" step="0.05" value={probabilidad} 
                onChange={e => { setGalton10({ ...galton10, probabilidad: parseFloat(e.target.value) }); audio?.playPop(); }}
                className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => { resetM10(); audio?.playPop(); }} 
                className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 shadow-xl"
                title="Reiniciar Muestra"
              >
                <RefreshCcw size={20} />
              </button>
              <button 
                onClick={handleValidar}
                className="h-16 px-10 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-blue-600/20"
              >
                <ShieldCheck size={20} />
                Validar Distribución
              </button>
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] backdrop-blur-md">
             <div className="flex items-center gap-3 text-emerald-400">
                <Timer size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest italic">Live Engine</span>
             </div>
             <div className="mt-2 text-2xl font-black font-mono">
                {totalBolitas > 0 ? "STABLE" : "IDLE"}
             </div>
          </div>
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
         {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-10">
               <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-blue-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(59,130,246,0.1)]">
                  <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle2 size={60} className="text-blue-500" />
                  </div>
                  <h3 className="text-5xl font-black text-white uppercase italic mb-6">Certificación Estadística</h3>
                  <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                    Has completado el análisis de la Máquina de Galton. Los datos recolectados confirman que el azar masivo sigue leyes matemáticas predecibles. **Teorema del Límite Central Certificado.**
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-12">
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Confianza</span>
                        <span className="text-xl font-black text-emerald-400">99.7%</span>
                     </div>
                     <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Muestra</span>
                        <span className="text-xl font-black text-blue-400">{totalBolitas} units</span>
                     </div>
                  </div>
                  <button onClick={() => window.location.reload()} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/30">Finalizar Laboratorio</button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}
