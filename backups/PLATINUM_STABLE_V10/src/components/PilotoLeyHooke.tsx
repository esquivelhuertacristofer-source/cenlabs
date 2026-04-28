"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, RotateCcw, Play, Square, Target, 
  CheckCircle2, AlertCircle, Info, Binary, Zap,
  Activity, Scaling, Box, Waves
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Constantes y Estilos
// ==========================================

const SPRING_COILS = 12;
const EQUILIBRIUM_Y = 100; // Posición en píxeles del centro de la masa en reposo
const PIXELS_PER_METER = 50; // Escala visual

// ==========================================
// Componente Principal: PilotoLeyHooke
// ==========================================

export default function PilotoLeyHooke() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();

  // -- SEMILLA: CONSTANTE ELÁSTICA MISTERIOSA --
  const [seed] = useState(() => ({
    k: parseFloat((Math.random() * (80 - 15) + 15).toFixed(1))
  }));

  // -- ESTADO LOCAL --
  const [conf, setConf] = useState({
    masa: 2.0,
    amplitud: 0.5,
    oscilando: false,
    t: 0
  });

  const [cronometro, setCronometro] = useState({
    activo: false,
    tiempo: 0,
    lastTick: 0
  });

  const [kCalculada, setKCalculada] = useState("");
  const [resultado, setResultado] = useState<'exito' | 'error' | null>(null);

  // -- REFERENCIAS PARA ANIMACIÓN --
  const requestRef = useRef<number | undefined>(undefined);
  const lastFrameTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>([]); // Historial de posiciones para el osciloscopio

  // -- MOTOR FÍSICO Y GRÁFICO (60FPS) --
  const omega = Math.sqrt(seed.k / conf.masa);
  const currentY = conf.oscilando 
    ? conf.amplitud * Math.cos(omega * conf.t) 
    : conf.amplitud; // Si no oscila, se queda en la posición de estiramiento inicial

  const animate = (time: number) => {
    if (!lastFrameTimeRef.current) lastFrameTimeRef.current = time;
    const deltaTime = (time - lastFrameTimeRef.current) / 1000;
    lastFrameTimeRef.current = time;

    // 1. Actualizar Tiempo de Física
    if (conf.oscilando) {
      setConf(prev => ({ ...prev, t: prev.t + deltaTime }));
    }

    // 2. Actualizar Cronómetro Manual
    if (cronometro.activo) {
      setCronometro(prev => ({ ...prev, tiempo: prev.tiempo + (deltaTime * 1000) }));
    }

    // 3. Dibujar en Osciloscopio (Canvas)
    drawOscilloscope();

    requestRef.current = requestAnimationFrame(animate);
  };

  const drawOscilloscope = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Agregar punto actual al historial
    historyRef.current.push(currentY);
    if (historyRef.current.length > 300) historyRef.current.shift();

    // Limpiar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar Grilla
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for(let i=0; i<canvas.width; i+=20) {
      ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); ctx.stroke();
    }
    for(let i=0; i<canvas.height; i+=20) {
      ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Dibujar Línea Central
    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height/2);
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.stroke();

    // Dibujar Onda
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#06b6d4';
    ctx.beginPath();
    
    historyRef.current.forEach((val, idx) => {
      const x = canvas.width - (historyRef.current.length - idx) * 2;
      const y = canvas.height/2 + (val * PIXELS_PER_METER);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [conf.oscilando, cronometro.activo, conf.masa, conf.amplitud]);

  // -- HANDLERS --
  const toggleOscilacion = () => {
    if (conf.oscilando) {
      setConf(prev => ({ ...prev, oscilando: false, t: 0 }));
    } else {
      setConf(prev => ({ ...prev, oscilando: true, t: 0 }));
    }
  };

  const handleValidar = () => {
    const val = parseFloat(kCalculada);
    if (Math.abs(val - seed.k) <= 2.0) {
      setResultado('exito');
      setBitacora({ 
        ...bitacoraData, 
        fisica4: `✅ RESUELTO: k=${seed.k} N/m. Alumno calculó ${val} N/m. m=${conf.masa}kg.` 
      });
    } else {
      setResultado('error');
    }
  };

  const formatTime = (ms: number) => {
    const safeMs = Math.max(0, ms);
    const totalSeconds = safeMs / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const cents = Math.floor((safeMs % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${cents.toString().padStart(2, '0')}`;
  };

  // Generar path del resorte
  const generateSpringPath = (displacement: number) => {
    const step = (EQUILIBRIUM_Y + displacement * PIXELS_PER_METER) / SPRING_COILS;
    let path = "M 100 0";
    for (let i = 0; i < SPRING_COILS; i++) {
        const y = i * step;
        const nextY = (i + 1) * step;
        const midY = (i + 0.5) * step;
        path += ` L 110 ${midY} L 90 ${nextY}`;
    }
    return path;
  };


  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit'] relative">


      {/* 🔮 LIENZO (100% del contenedor Piloto) */}
      <main className="flex-grow h-full flex overflow-hidden">
        {/* Zona Física (40%) */}
        <div className="w-[40%] h-full border-r border-white/5 relative flex flex-col items-center pt-20">
           <div className="absolute top-0 left-0 w-full h-[20px] bg-slate-900 border-b border-white/10 shadow-xl" />
           <svg width="200" height="500" viewBox="0 0 200 500" className="overflow-visible">
              <path 
                d={generateSpringPath(currentY)} 
                fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              />
              {/* Bloque de Masa */}
              <motion.g animate={{ y: currentY * PIXELS_PER_METER }}>
                 <rect 
                  x={100 - (10 + conf.masa * 2)} y={EQUILIBRIUM_Y} 
                  width={20 + conf.masa * 4} height={20 + conf.masa * 4} 
                  fill="#0f172a" stroke="#06b6d4" strokeWidth="2" rx="4"
                 />
                 <text 
                  x="100" y={EQUILIBRIUM_Y + 12 + conf.masa * 2} 
                  fill="#06b6d4" fontSize="8" fontWeight="black" textAnchor="middle"
                 >
                   {conf.masa} kg
                 </text>
                 
                 {/* Línea Laser Conexión */}
                 <line 
                  x1={100 + (10 + conf.masa * 2)} y1={EQUILIBRIUM_Y + (10 + conf.masa * 2)} 
                  x2={300} y2={EQUILIBRIUM_Y + (10 + conf.masa * 2)} 
                  stroke="#06b6d4" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" 
                 />
              </motion.g>
           </svg>
        </div>

        {/* Zona Osciloscopio (60%) */}
        <div className="w-[60%] h-full p-10 flex flex-col">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                 <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Señal de Desplazamiento Directa (y)</span>
              </div>
              <Waves className="text-slate-800" />
           </div>

           <div className="flex-grow bg-slate-900 rounded-[2.5rem] border border-white/5 relative overflow-hidden shadow-2xl">
              <canvas 
                ref={canvasRef} 
                width={600} height={400} 
                className="w-full h-full"
              />
              <div className="absolute top-4 right-6 text-[8px] font-mono text-slate-700 uppercase tracking-[0.3em]">
                TEKTRONIX-SIM V4.0
              </div>
           </div>
        </div>

        <AnimatePresence>
           {resultado === 'exito' && (
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center p-20 backdrop-blur-md">
                <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border-t-[12px] border-cyan-500">
                   <div className="w-20 h-20 bg-cyan-100 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={40} /></div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">¡Detección Exitosa!</h3>
                   <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has identificado correctamente la constante elástica del sistema industrial: <span className="text-cyan-600 underline font-black">{seed.k} N/m</span>.</p>
                   <button 
                    onClick={() => router.push('/alumno/laboratorio/fisica')}
                    className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-cyan-600 transition-all shadow-xl shadow-cyan-900/20"
                   >
                     Finalizar Reporte
                   </button>
                </div>
             </motion.div>
           )}

           {resultado === 'error' && (
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-500 text-white rounded-full flex items-center gap-4 shadow-2xl font-black uppercase text-[10px] tracking-widest border-b-4 border-red-700">
                <AlertCircle size={20} /> Error de cálculo significativo. Revisa tus mediciones de periodo.
                <button onClick={() => setResultado(null)} className="px-4 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-[8px]">Ok</button>
             </motion.div>
           )}
        </AnimatePresence>

        {/* MODAL INSTRUCTOR */}
        <div className="absolute bottom-10 right-10">
           <button 
            onClick={() => {
               setKCalculada(seed.k.toString());
               setConf(c => ({ ...c, oscilando: true }));
            }} 
            className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-3"
           >
             <Binary size={14} className="group-hover:rotate-12 transition-transform" /> Auto-Descifrar (Demo)
           </button>
        </div>
      </main>
    </div>
  );
}
