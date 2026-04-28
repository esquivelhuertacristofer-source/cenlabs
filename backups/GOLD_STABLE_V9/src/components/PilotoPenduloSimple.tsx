"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, RotateCcw, Play, Square, Target, 
  CheckCircle2, AlertCircle, Info, Binary, Zap,
  Globe, Activity, Scaling, Circle
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Constantes y Estilos de Animación
// ==========================================

const MAX_ANGLE = 15; // Grados para aproximación de ángulos pequeños

// ==========================================
// Componente Principal: PilotoPenduloSimple
// ==========================================

export default function PilotoPenduloSimple() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();

  // -- SEMILLA: GRAVEDAD MISTERIOSA --
  const [seed] = useState(() => ({
    g: parseFloat((Math.random() * (24.7 - 3.7) + 3.7).toFixed(2))
  }));

  // -- ESTADO LOCAL --
  const [pendulo, setPendulo] = useState({
    longitud: 1.5,
    masa: 2.0,
    oscilando: false
  });

  const [cronometro, setCronometro] = useState({
    activo: false,
    tiempo: 0, // En milisegundos
    inicio: 0
  });

  const [gCalculada, setGCalculada] = useState("");
  const [resultado, setResultado] = useState<'exito' | 'error' | null>(null);

  // -- CÁLCULOS FÍSICOS --
  // Periodo T = 2 * PI * sqrt(L / g)
  const T = 2 * Math.PI * Math.sqrt(pendulo.longitud / seed.g);

  // -- CONTROL DEL CRONÓMETRO --
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | null>(null);

  const animateCronometro = (time: number) => {
    if (lastTimeRef.current !== null) {
      setCronometro(prev => ({
        ...prev,
        tiempo: prev.tiempo + (time - lastTimeRef.current!)
      }));
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animateCronometro);
  };

  useEffect(() => {
    if (cronometro.activo) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animateCronometro);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cronometro.activo]);

  // -- HANDLERS --
  const toggleOscilacion = () => {
    setPendulo(prev => ({ ...prev, oscilando: !prev.oscilando }));
  };

  const toggleCronometro = () => {
    setCronometro(prev => ({ ...prev, activo: !prev.activo }));
  };

  const resetCronometro = () => {
    setCronometro({ activo: false, tiempo: 0, inicio: 0 });
  };

  const handleValidar = () => {
    const val = parseFloat(gCalculada);
    const margen = Math.abs(val - seed.g);

    if (margen <= 0.6) {
      setResultado('exito');
      setBitacora({
        ...bitacoraData,
        fisica3: `✅ DESCUBIERTO: g=${seed.g} m/s². Alumno calculó ${val} m/s². L=${pendulo.longitud}m.`
      });
    } else {
      setResultado('error');
    }
  };

  // Formateador de tiempo 00:00.00
  const formatTime = (ms: number) => {
    const safeMs = Math.max(0, ms);
    const totalSeconds = safeMs / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const cents = Math.floor((safeMs % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${cents.toString().padStart(2, '0')}`;
  };


  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit'] relative">
      
      {/* Estilos Dinámicos inyectados para el keyframe variable */}
      <style>{`
        @keyframes swing {
          0% { transform: rotate(${MAX_ANGLE}deg); }
          50% { transform: rotate(-${MAX_ANGLE}deg); }
          100% { transform: rotate(${MAX_ANGLE}deg); }
        }
        @keyframes energyEc {
          0%, 100% { height: 10%; }
          50% { height: 100%; }
        }
        @keyframes energyEp {
          0%, 100% { height: 100%; }
          50% { height: 10%; }
        }
      `}</style>
      
      {/* 🔮 LIENZO SVG (100% del contenedor Piloto) */}
      <main className="flex-grow h-full relative overflow-hidden flex flex-col items-center justify-start py-20">
        {/* Fondo Espacial */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#4c1d9520_0%,transparent_70%)]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

        {/* HUD ENERGÍAS */}
        <div className="absolute top-10 right-10 flex gap-4 z-20">
           <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] flex items-end gap-6 shadow-2xl h-40">
              <div className="flex flex-col items-center gap-3 h-full">
                 <div className="flex-grow w-3 bg-slate-800 rounded-full overflow-hidden relative flex flex-col justify-end">
                    <motion.div 
                      className="w-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      style={{ 
                        height: '10%',
                        animation: pendulo.oscilando ? `energyEc ${T}s infinite ease-in-out` : 'none' 
                      }}
                    />
                 </div>
                 <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">E. Cinética</span>
              </div>
              <div className="flex flex-col items-center gap-3 h-full">
                 <div className="flex-grow w-3 bg-slate-800 rounded-full overflow-hidden relative flex flex-col justify-end">
                    <motion.div 
                      className="w-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                      style={{ 
                        height: '100%',
                        animation: pendulo.oscilando ? `energyEp ${T}s infinite ease-in-out` : 'none' 
                      }}
                    />
                 </div>
                 <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">E. Potencial</span>
              </div>
           </div>
        </div>

        {/* ESCENA SVG */}
        <div className="relative w-full h-full flex items-start justify-center">
           <svg 
            viewBox="0 0 200 200" 
            className="w-full h-full max-w-2xl overflow-visible"
           >
              {/* Soporte */}
              <defs>
                 <linearGradient id="supportGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1e1b4b" />
                    <stop offset="100%" stopColor="#4c1d95" />
                 </linearGradient>
              </defs>
              <rect x="70" y="0" width="60" height="5" rx="2" fill="url(#supportGrad)" />
              <rect x="98.5" y="0" width="3" height="15" fill="#1e1b4b" />
              <circle cx="100" cy="15" r="3" fill="#6d28d9" stroke="#1e1b4b" strokeWidth="1" />

              {/* EL PÉNDULO */}
              <g 
                style={{ 
                  transformOrigin: '100px 15px',
                  animation: pendulo.oscilando ? `swing ${T}s infinite ease-in-out` : `rotate(${MAX_ANGLE}deg)`
                }}
              >
                 {/* Cuerda */}
                 <line 
                  x1="100" y1="15" 
                  x2="100" y2={15 + ((pendulo.longitud || 1.5) * 60)} 
                  stroke="#6366f1" strokeWidth="0.8" strokeDasharray="1,1" 
                  opacity="0.8"
                 />
                 
                 {/* Masa */}
                 <motion.circle 
                  cx="100" cy={15 + ((pendulo.longitud || 1.5) * 60)} 
                  r={3 + ((pendulo.masa || 2) * 0.8)} 
                  fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="1.5"
                  animate={{ r: 3 + ((pendulo.masa || 2) * 0.8) }}
                 />
                 
                 {/* Destello en la masa */}
                 <circle 
                  cx={100 - ((pendulo.masa || 2) * 0.2)} cy={15 + ((pendulo.longitud || 1.5) * 60) - ((pendulo.masa || 2) * 0.2)} 
                  r={1 + ((pendulo.masa || 2) * 0.1)} fill="white" opacity="0.1" 
                 />
              </g>

              {/* Sombra proyectada (Sutil) */}
              <motion.ellipse 
                cx="100" cy={15 + (2.5 * 60) + 10} 
                rx={10 + ((pendulo.masa || 2) * 1)} ry="2" 
                fill="black" opacity="0.1"
                animate={{ 
                  scaleX: pendulo.oscilando ? [1, 1.5, 1] : 1,
                  opacity: pendulo.oscilando ? [0.1, 0.05, 0.1] : 0.1
                }}
                transition={{ duration: T, repeat: Infinity, ease: "easeInOut" }}
              />
           </svg>
        </div>

        {/* FEEDBACK OVERLAY */}
        <AnimatePresence>
           {resultado === 'exito' && (
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center p-20 backdrop-blur-md">
                <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border-t-[12px] border-violet-500">
                   <div className="w-20 h-20 bg-violet-100 text-violet-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={40} /></div>
                   <h3 className="text-3xl font-black text-[#1e1b4b] uppercase tracking-tighter mb-4 italic">¡Misión Cumplida!</h3>
                   <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has descubierto que la gravedad de este entorno es de <span className="text-violet-600 underline">{seed.g} m/s²</span>. Cálculos geofísicos completados.</p>
                   <button 
                    onClick={() => router.push('/alumno/laboratorio/fisica')}
                    className="w-full py-5 bg-[#1e1b4b] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-violet-600 transition-all shadow-xl shadow-violet-900/20"
                   >
                     Finalizar Exploración
                   </button>
                </div>
             </motion.div>
           )}

           {resultado === 'error' && (
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-500 text-white rounded-full flex items-center gap-4 shadow-2xl font-black uppercase text-[10px] tracking-widest border-b-4 border-red-700">
                <AlertCircle size={20} /> Error en el cálculo. El margen es muy alto.
                <button onClick={() => setResultado(null)} className="px-4 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all">Reintentar</button>
             </motion.div>
           )}
        </AnimatePresence>

        {/* MODO INSTRUCTOR (DEMO) */}
        <div className="absolute bottom-10 right-10">
           <button 
            onClick={() => {
               setGCalculada(seed.g.toString());
               setPendulo(p => ({ ...p, oscilando: true }));
            }} 
            className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-3"
           >
             <Binary size={14} className="group-hover:rotate-12 transition-transform" /> Auto-Medir (Demo)
           </button>
        </div>
      </main>
    </div>
  );
}
