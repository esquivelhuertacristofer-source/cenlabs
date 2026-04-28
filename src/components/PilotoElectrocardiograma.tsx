import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Activity, Heart, Zap } from 'lucide-react';

export default function PilotoElectrocardiograma() {
  const { cardio, setCardio, generarSemillaB8 } = useSimuladorStore();
  const { ritmoBPM, targetBPM, estadoFisiologico } = cardio;

  // Refs para el trazado del ECG (Smooth Scrolling)
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const points = useRef<{ x: number; y: number }[]>([]);
  const lastTime = useRef<number>(0);
  const cycleProgress = useRef<number>(0);

  // Inicialización
  useEffect(() => {
    generarSemillaB8();
    
    // Inicializar puntos de la rejilla
    for (let i = 0; i < 200; i++) {
      points.current.push({ x: i * 5, y: 150 });
    }
  }, []);

  // Bucle de Animación del ECG (60fps)
  useEffect(() => {
    let frameId: number;

    const animate = (time: number) => {
      if (!lastTime.current) lastTime.current = time;
      const deltaTime = time - lastTime.current;
      lastTime.current = time;

      // Un ciclo (T) = 60000 / BPM ms
      const cycleDuration = 60000 / ritmoBPM;
      cycleProgress.current += deltaTime;

      if (cycleProgress.current >= cycleDuration) {
        cycleProgress.current = 0;
      }

      // Definir fase actual para el store (esto dispara actualizaciones lentas, está bien)
      const prog = cycleProgress.current / cycleDuration;
      let currentFase: 'Diástole' | 'Onda P' | 'QRS' | 'Onda T' = 'Diástole';
      if (prog < 0.15) currentFase = 'Onda P';
      else if (prog >= 0.15 && prog < 0.25) currentFase = 'Diástole'; // Intervalo PR
      else if (prog >= 0.25 && prog < 0.40) currentFase = 'QRS';
      else if (prog >= 0.40 && prog < 0.60) currentFase = 'Diástole'; // Segmento ST
      else if (prog >= 0.60 && prog < 0.85) currentFase = 'Onda T';
      else currentFase = 'Diástole';

      // Actualizar store solo si cambia de fase (para no saturar)
      if (cardio.faseActual !== currentFase) {
        setCardio({ faseActual: currentFase });
      }

      // Generar el valor de Y de la onda actual
      let yOffset = 0;
      if (currentFase === 'Onda P') {
        yOffset = -15 * Math.sin((prog / 0.15) * Math.PI);
      } else if (currentFase === 'QRS') {
        const qrsProg = (prog - 0.25) / 0.15;
        if (qrsProg < 0.2) yOffset = 10 * (qrsProg / 0.2); // Q
        else if (qrsProg < 0.5) yOffset = -50 * ((qrsProg - 0.2) / 0.3) + 10; // R
        else if (qrsProg < 0.8) yOffset = 60 * ((qrsProg - 0.5) / 0.3) - 40; // S
        else yOffset = -20 * ((qrsProg - 0.8) / 0.2) + 20; // Vuelta
      } else if (currentFase === 'Onda T') {
        yOffset = -25 * Math.sin(((prog - 0.60) / 0.25) * Math.PI);
      }

      // Desplazar puntos existing y añadir nuevo
      // En un monitor real, la línea avanza. Aquí desplazaremos el path.
      // Pero para simplicidad "Wow", haremos que la línea se dibuje de izq a der y se resetee
      // o que se mueva como osciloscopio real. Haremos osciloscopio real.
      
      const speed = 2; // Velocidad de avance de la línea
      if (pathRef.current) {
        // Shift points
        for (let i = 0; i < points.current.length - 1; i++) {
          points.current[i].y = points.current[i + 1].y;
        }
        points.current[points.current.length - 1].y = 150 + yOffset;

        // Construct D string
        const d = points.current.reduce((acc, p, i) => 
          acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, ""
        );
        pathRef.current.setAttribute("d", d);
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [ritmoBPM, cardio.faseActual]);

  return (
    <div className="w-full h-full relative bg-slate-950 flex flex-col items-center justify-center p-8 overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/5">
      
      {/* Background Grid (Monitor Médico) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-full" style={{ 
          backgroundImage: `linear-gradient(to right, #134e4a 1px, transparent 1px), linear-gradient(to bottom, #134e4a 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-b from-teal-500/5 to-transparent" />
      </div>

      {/* 1. SECCIÓN ANATÓMICA (ARRIBA) */}
      <div className="relative w-full flex-1 flex items-center justify-center">
        <svg viewBox="0 0 400 300" className="h-full max-h-[350px] overflow-visible drop-shadow-[0_0_30px_rgba(30,41,59,0.5)]">
           <defs>
             <filter id="heartGlow">
               <feGaussianBlur stdDeviation="3" />
               <feComposite in="SourceGraphic" operator="over" />
             </filter>
           </defs>

           {/* Corazón Claymorphism */}
           <g transform="translate(200, 150)">
              {/* Aurículas */}
              <motion.path 
                animate={{ 
                  scaleY: cardio.faseActual === 'Onda P' ? 0.85 : 1,
                  fill: cardio.faseActual === 'Onda P' ? '#219EBC' : '#1e293b'
                }}
                d="M-60,-40 C-80,-80 80,-80 60,-40 C40,-20 -40,-20 -60,-40" 
                className="stroke-slate-700 stroke-[3] transition-colors duration-150"
              />

              {/* Ventrículos */}
              <motion.path 
                animate={{ 
                  scale: cardio.faseActual === 'QRS' ? 0.85 : 1,
                  fill: cardio.faseActual === 'QRS' ? '#f43f5e' : '#1e293b'
                }}
                d="M-70,-30 C-90,60 0,110 0,110 C0,110 90,60 70,-30 C50,-50 -50,-50 -70,-30" 
                className="stroke-slate-700 stroke-[3] transition-colors duration-100"
              />

              {/* Sistema de Conducción (Tenuous) */}
              <g opacity="0.3" className="stroke-teal-400 stroke-[2] fill-none">
                <circle cx="-50" cy="-60" r="6" fill="#2dd4bf" stroke="none" className={cardio.faseActual === 'Onda P' ? 'animate-pulse' : ''} /> {/* Nodo SA */}
                <circle cx="0" cy="-10" r="5" fill="#2dd4bf" stroke="none" className={cardio.faseActual === 'QRS' ? 'animate-pulse' : ''} /> {/* Nodo AV */}
                <path d="M-50,-60 Q-20,-40 0,-10" />
                <path d="M0,-10 Q-30,40 -40,80" />
                <path d="M0,-10 Q30,40 40,80" />
              </g>

              {/* Impulso Eléctrico Activo */}
              <AnimatePresence>
                {cardio.faseActual === 'Onda P' && (
                  <motion.circle 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 2, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    cx="-50" cy="-60" r="10" fill="#2dd4bf" filter="url(#heartGlow)"
                  />
                )}
                {cardio.faseActual === 'QRS' && (
                  <motion.path 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    d="M0,-10 Q-30,40 -40,80 M0,-10 Q30,40 40,80" 
                    stroke="#FB8500" strokeWidth="4" fill="none"
                  />
                )}
              </AnimatePresence>
           </g>
        </svg>

        {/* Labels Técnicos */}
        <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2">
           <div className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl backdrop-blur-md flex items-center gap-3">
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronizador Humano</p>
                 <p className={`text-sm font-black uppercase ${ritmoBPM > 140 ? 'text-rose-500' : 'text-teal-400'}`}>
                   {ritmoBPM > 140 ? 'Taquicardia' : ritmoBPM < 60 ? 'Bradicardia' : 'Ritmo Sinusal'}
                 </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${ritmoBPM > 140 ? 'bg-rose-500 animate-ping' : 'bg-teal-500 animate-pulse'}`} />
           </div>
        </div>
      </div>

      {/* 2. OSCILOSCOPIO (ABAJO) */}
      <div className="w-full h-48 bg-slate-950/80 border-t border-white/10 relative">
        <svg 
          ref={svgRef}
          viewBox="0 0 1000 300" 
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path 
            ref={pathRef}
            fill="none" 
            stroke="#2dd4bf" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            filter="drop-shadow(0 0 8px rgba(45, 212, 191, 0.6))"
          />
        </svg>

        {/* Overlay do Monitor */}
        <div className="absolute bottom-4 left-4 flex gap-6">
           <div className="flex flex-col">
              <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Lead II</span>
              <span className="text-sm font-mono font-black text-teal-400">ECG SYNC ON</span>
           </div>
           <div className="flex flex-col">
              <span className="text-[11px] font-black text-white/40 uppercase tracking-widest">Gain</span>
              <span className="text-sm font-mono font-black text-white/80">10 mm/mV</span>
           </div>
        </div>

        <div className="absolute top-4 right-6 flex items-center gap-3">
           <div className="h-6 px-3 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Live Trace</span>
           </div>
        </div>
      </div>

    </div>
  );
};
