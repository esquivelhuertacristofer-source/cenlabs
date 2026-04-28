"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Target, Zap, Activity, RotateCcw, Play, CheckCircle2, AlertCircle, Info, ChevronRight, Binary, Crosshair } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Tipos y Constantes
// ==========================================

const G = 9.81; // Gravedad terrestre en m/s²

interface CanonState {
  angulo: number;
  velocidad: number;
  disparando: boolean;
  resultado: 'exito' | 'fallo' | null;
  distanciaReal: number;
}

// ==========================================
// Componente Principal: PilotoTiroParabolico
// ==========================================

export default function PilotoTiroParabolico() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();
  
  // -- ESTADO LOCAL --
  const [targetX, setTargetX] = useState(0);
  const [canon, setCanon] = useState<CanonState>({
    angulo: 45,
    velocidad: 20,
    disparando: false,
    resultado: null,
    distanciaReal: 0
  });
  const [intentos, setIntentos] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  
  // -- MOTOR DE FÍSICA CALCULADO (LIVE) --
  const rad = (canon.angulo * Math.PI) / 180;
  const v0x = canon.velocidad * Math.cos(rad);
  const v0y = canon.velocidad * Math.sin(rad);
  
  const tVuelo = (2 * v0y) / G;
  const xMax = (Math.pow(canon.velocidad, 2) * Math.sin(2 * rad)) / G;
  const yMax = (Math.pow(v0y, 2)) / (2 * G);

  // Inicialización aleatoria del blanco
  useEffect(() => {
    const seed = Math.floor(Math.random() * (80 - 20 + 1)) + 20;
    setTargetX(seed);
  }, []);

  // -- ANIMACIÓN Y LANZAMIENTO --
  const ballControls = useAnimation();
  const vectorYControls = useAnimation();

  const handleFire = async () => {
    if (canon.disparando) return;
    
    setCanon(prev => ({ ...prev, disparando: true, resultado: null }));
    setIntentos(prev => prev + 1);

    // Generar puntos de la trayectoria para el path SVG
    // (Solo visual, la bala sigue el cálculo real)
    
    // Animación de la bala
    // Usamos una duración proporcional al tiempo de vuelo real
    const animDuration = tVuelo * 0.5; // Escala de tiempo para la simulación (2x real para no aburrir)

    await ballControls.start({
      pathOffset: [0, 1],
      transition: { duration: animDuration, ease: "linear" }
    });

    // Evaluación de impacto
    const precision = Math.abs(xMax - targetX);
    const esExito = precision < 2.0;

    setCanon(prev => ({ 
      ...prev, 
      disparando: false, 
      resultado: esExito ? 'exito' : 'fallo',
      distanciaReal: xMax
    }));

    if (esExito) {
      setBitacora({ ...bitacoraData, tiroFisica: `🎯 ¡IMPACTO! Blanco alcanzado a ${targetX}m con ángulo ${canon.angulo}° y V0 ${canon.velocidad}m/s.` });
      setShowValidation(true);
    } else {
      setBitacora({ ...bitacoraData, tiroFisica: `❌ Fallo: El proyectil aterrizó a ${xMax.toFixed(1)}m. Objetivo a ${targetX}m.` });
    }
  };

  const reset = () => {
    setCanon(prev => ({ ...prev, disparando: false, resultado: null }));
    ballControls.set({ pathOffset: 0 });
  };

  // Generación dinámica del Path de la parábola ideal
  const pathData = useMemo(() => {
    let points = "";
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
        const t = (tVuelo / steps) * i;
        const x = v0x * t;
        const y = 100 - (v0y * t - 0.5 * G * t * t);
        points += `${i === 0 ? 'M' : 'L'} ${x} ${y} `;
    }
    return points;
  }, [v0x, v0y, tVuelo]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit']">
      
      {/* 📋 LIENZO DE PRÁCTICA (100% del contenedor Piloto) */}
      <main className="flex-grow h-full relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#6366f108_0%,transparent_40%)] pointer-events-none" />
        
        {/* Cabecera del Lienzo */}
        <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
           <div className="bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-6 shadow-2xl">
              <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Motor Cinemático 2D</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-2">
                 <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Gravedad:</span>
                 <span className="text-sm font-black text-white">9.81 m/s²</span>
              </div>
           </div>
        </div>

        {/* Lienzo SVG */}
        <div className="flex-grow w-full relative">
           <svg 
            viewBox="0 0 100 100" 
            className="w-full h-full preserve-3d"
            preserveAspectRatio="xMidYMax meet"
           >
              {/* Suelo */}
              <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              
              {/* Blanco (Target) */}
              <g transform={`translate(${targetX}, 100)`}>
                 <motion.circle 
                   r="1" 
                   fill="rgba(99,102,241,0.2)" 
                   animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.4, 0.2] }}
                   transition={{ repeat: Infinity, duration: 2 }}
                 />
                 <circle r="0.4" fill="#6366f1" />
                 <rect x="-0.1" y="-4" width="0.2" height="4" fill="#6366f1" />
                 <path d="M0.1 -4 L2 -3 L0.1 -2" fill="#6366f1" />
              </g>

              {/* Trayectoria Previa (Guía) */}
              <motion.path 
                d={pathData} 
                fill="none" 
                stroke="rgba(99,102,241,0.15)" 
                strokeWidth="0.3" 
                strokeDasharray="1 1"
              />

              {/* El Cañón (Origen) */}
              <g transform="translate(0, 100)">
                 <g transform={`rotate(${-canon.angulo})`}>
                    <rect x="0" y="-1.5" width="5" height="3" fill="#1e1b4b" rx="0.5" stroke="#6366f1" strokeWidth="0.2" />
                    <rect x="1" y="-1.6" width="3" height="0.2" fill="#6366f1" opacity="0.5" />
                 </g>
                 <circle cx="0" cy="0" r="1.5" fill="#0f172a" stroke="#6366f1" strokeWidth="0.3" />
              </g>

              {/* EL PROYECTIL (Bala) */}
              <motion.g
                initial={{ pathOffset: 0 }}
                animate={ballControls}
              >
                {/* 
                  Nota: Para seguir el path usamos el truco de la bala invisible que ancla 
                  la posición real mediante CSS offset-path. 
                */}
                <motion.g 
                  style={{ 
                    offsetPath: `path('${pathData}')`,
                    offsetDistance: "0%"
                  }}
                  animate={{ 
                    offsetDistance: canon.disparando ? "100%" : "0%" 
                  }}
                  transition={{ 
                    duration: canon.disparando ? tVuelo * 1.5 : 0, 
                    ease: "linear" 
                  }}
                  className="z-50"
                >
                  <circle r="0.6" fill="#6366f1" className="shadow-[0_0_10px_#6366f1]" />
                  <circle r="1" fill="rgba(99,102,241,0.3)" />
                  
                  {/* VECTORES DINÁMICOS (Wow Factor) */}
                  {canon.disparando && (
                    <g>
                      {/* Vx (Constante) */}
                      <line x1="0" y1="0" x2="3" y2="0" stroke="#10b981" strokeWidth="0.2" markerEnd="url(#arrowhead-v)" />
                      <text x="3.5" y="0.5" fill="#10b981" fontSize="1.5" fontWeight="bold">Vx</text>
                      
                      {/* Vy (Variable) */}
                      <motion.g
                        animate={{ 
                          scaleY: [1, 0, -1],
                        }}
                        transition={{ duration: tVuelo * 1.5, ease: "linear" }}
                      >
                         <line x1="0" y1="0" x2="0" y2="-4" stroke="#ef4444" strokeWidth="0.2" markerEnd="url(#arrowhead-v)" />
                         <text x="0.5" y="-4.5" fill="#ef4444" fontSize="1.5" fontWeight="bold">Vy</text>
                      </motion.g>
                    </g>
                  )}
                </motion.g>
              </motion.g>

              {/* Definición de Marcadores (Flechas) */}
              <defs>
                <marker id="arrowhead-v" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
                </marker>
              </defs>
           </svg>
        </div>

        {/* 📋 PARTE 4: FEEDBACK Y VALIDACIÓN */}
        <AnimatePresence>
          {canon.resultado && !canon.disparando && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50"
            >
              <div className={`p-6 rounded-[32px] border backdrop-blur-xl shadow-2xl flex flex-col items-center text-center ${canon.resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/20' : 'bg-red-500/10 border-red-500/20 shadow-red-500/20'}`}>
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${canon.resultado === 'exito' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {canon.resultado === 'exito' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                 </div>
                 <h3 className={`text-2xl font-black mb-2 ${canon.resultado === 'exito' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {canon.resultado === 'exito' ? '¡IMPACTO CONFIRMADO!' : 'TIRO FALLIDO'}
                 </h3>
                 <p className="text-slate-400 font-bold mb-6">
                    {canon.resultado === 'exito' 
                      ? `Has neutralizado la baliza con precisión milimétrica.` 
                      : `El proyectil impactó a ${canon.distanciaReal.toFixed(1)}m. Necesitas ${targetX}m.`}
                 </p>
                 
                 <div className="flex w-full gap-3">
                   <button 
                     onClick={reset}
                     className="flex-grow py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-widest transition-all"
                   >
                     REINTENTAR
                   </button>
                   {canon.resultado === 'exito' && (
                     <button 
                       onClick={() => {
                         router.push('/alumno/laboratorio/fisica');
                       }}
                       className="flex-grow py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                     >
                       VALIDAR
                     </button>
                   )}
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
