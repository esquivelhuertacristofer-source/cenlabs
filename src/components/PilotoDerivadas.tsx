"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ShieldCheck,
  Zap, Gauge, Play, Rocket
} from 'lucide-react';
import Derivadas3DScene from './simuladores/mat08/Derivadas3DScene';

// Función de Telemetría: s(t) = -0.1t³ + 1.5t²  (la curva s(t) se dibuja en la escena 3D)
// Velocidad v(t) = s'(t) = -0.3t² + 3t   (pendiente de la tangente = la derivada)
// Aceleración a(t) = v'(t) = -0.6t + 3
// Máxima Velocidad en t = 5s (donde a(t)=0)
const v = (t: number) => -0.3 * Math.pow(t, 2) + 3 * t;
const a = (t: number) => -0.6 * t + 3;

export default function PilotoDerivadas() {
  const router = useRouter();
  const { derivada8, audio, setAsistente, setPasoActual, bitacoraData, setDerivada8, registrarHallazgo, setBitacora, stopTimer } = useSimuladorStore();
  const { status } = derivada8;

  const [t, setT] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Centro de Control. Tu misión es encontrar el instante de MÁXIMA VELOCIDAD (v_max) usando la derivada de la función de posición del cohete.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  const currentV = v(t);
  const currentA = a(t);

  const isVMax = Math.abs(t - 5) < 0.1;

  // -- LOGICA DE ANIMACIÓN --
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setT(prev => (prev >= 10 ? 0 : prev + 0.05));
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleValidar = () => {
    const error = Math.abs(t - 5);
    if (error <= 0.2) {
      audio?.playSuccess();
      setDerivada8({ ...derivada8, status: 'success' });
      stopTimer();
      setPasoActual(4);
      
      registrarHallazgo('mat_derivada_rocket', {
        tiempo_critico: t,
        velocidad_capturada: currentV,
        aceleracion_inst: currentA,
        error_temporal: error
      });

      setBitacora({
        ...bitacoraData,
        mat8: `✅ TELEMETRÍA VALIDADA: v_max detectada en t=${t.toFixed(2)}s. Velocidad=${currentV.toFixed(2)}m/s. Aceleración=${currentA.toFixed(2)}m/s².`
      });
    } else {
      audio?.playError();
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#03040a] relative overflow-hidden flex flex-col font-['Outfit'] text-white">

      {/* ── ESCENA 3D — DERIVADA COMO LÍMITE (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <Derivadas3DScene t={t} />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#03040a]/75 via-transparent to-[#03040a]/85" />

      {/* TOP HUD: MISSION CRITICAL */}
      <div className="absolute top-10 left-0 right-0 z-50 px-10 flex justify-between items-start pointer-events-none">
        <div className="flex gap-6">
           <HUDCard label="Velocidad (ds/dt)" value={`${currentV.toFixed(2)} m/s`} icon={<Gauge size={16} />} color={isVMax ? "#facc15" : "#3b82f6"} highlight={isVMax} />
           <HUDCard label="Aceleración (dv/dt)" value={`${currentA.toFixed(2)} m/s²`} icon={<Zap size={16} />} color="#ef4444" />
        </div>

        <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl">
           <div className="text-right">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Tiempo de Vuelo</span>
              <span className="text-3xl font-black text-white font-mono italic tracking-tighter">{t.toFixed(2)}<span className="text-sm ml-1 text-slate-500">s</span></span>
           </div>
           <div className="h-12 w-px bg-white/10" />
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Motor Activo</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${isVMax ? 'bg-amber-500 animate-ping' : 'bg-slate-700'}`} />
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Punto de Inflexión</span>
              </div>
           </div>
        </div>
      </div>

      {/* MAIN VISUALIZER: la curva/tangente/secante viven en la escena 3D del
          fondo (z-0). Este hueco deja pasar la interacción con OrbitControls. */}
      <div className="flex-1 relative pointer-events-none" />

      {/* CONTROLS: TIMELINE & VALIDATION */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-5xl px-10">
         <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] p-10 shadow-2xl flex items-center justify-between gap-12 pointer-events-auto">
            
            <div className="flex-1 flex flex-col gap-4">
               <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Línea de Tiempo Diferencial</span>
                  <span className="text-xs font-black text-blue-400 font-mono italic">{t.toFixed(2)}s</span>
               </div>
               <div className="relative">
                  <input 
                    type="range" min="0" max="10" step="0.01" value={t} 
                    onChange={e => { setT(parseFloat(e.target.value)); setIsPlaying(false); }}
                    className="w-full h-3 bg-white/5 rounded-full appearance-none cursor-pointer accent-blue-500 relative z-10" 
                  />
                  {/* Highlight of Critical Area */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-amber-500/20 blur-md rounded-full" />
               </div>
            </div>

            <div className="flex items-center gap-6 border-l border-white/10 pl-12">
               <button 
                 onClick={() => setIsPlaying(!isPlaying)}
                 className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isPlaying ? 'bg-amber-500 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10 border border-white/10'}`}
               >
                 {isPlaying ? <Activity size={24} /> : <Play size={24} fill="currentColor" />}
               </button>
               
               <button 
                 onClick={handleValidar}
                 disabled={status === 'success'}
                 className={`px-12 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center gap-3 shadow-2xl ${status === 'success' ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-500'}`}
               >
                 <ShieldCheck size={18} />
                 Validar Telemetría
               </button>
            </div>
         </div>
      </div>

      {/* SUCCESS MODAL: ROCKET MISSION COMPLETED */}
      <AnimatePresence>
         {status === 'success' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
               <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-blue-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(59,130,246,0.1)]">
                  <Rocket size={80} className="text-blue-500 mx-auto mb-8" />
                  <h3 className="text-5xl font-black text-white uppercase italic mb-6">Misión en Órbita</h3>
                  <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                    Has localizado el punto de **Velocidad Máxima** en t=5.0s, donde la derivada de la posición alcanza su pico y la aceleración se anula.
                    La telemetría ha sido inyectada en el expediente Gold State.
                  </p>
                  <button onClick={() => router.push('/hub')} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-600/30">Cerrar Telemetría</button>
               </motion.div>
            </motion.div>
         )}
      </AnimatePresence>

    </div>
  );
}

function HUDCard({ label, value, icon, color, highlight = false }: { label: string, value: string, icon: React.ReactNode, color: string, highlight?: boolean }) {
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
