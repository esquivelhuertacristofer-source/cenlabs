"use client";

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  ZoomIn, Sun, Box, Camera, RotateCcw,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Info, Cpu, Target
} from 'lucide-react';

export default function BitacoraMicroscopio() {
  const { 
    microscopio, setMicroscopio, validarB1, resetB1, generarSemillaB1,
    pasoActual, setPasoActual, bitacoraData 
  } = useSimuladorStore();
  
  const { aumento, iluminacion, muestra, status, objetivo, posicionX, posicionY } = microscopio;
  
  const [joystickActive, setJoystickActive] = useState<string | null>(null);

  // Efecto de inicialización
  useEffect(() => {
    generarSemillaB1();
  }, []);

  // Control de Joystick
  useEffect(() => {
    if (!joystickActive) return;
    const interval = setInterval(() => {
      setMicroscopio({
        posicionX: joystickActive === 'L' ? posicionX - 10 : (joystickActive === 'R' ? posicionX + 10 : posicionX),
        posicionY: joystickActive === 'U' ? posicionY - 10 : (joystickActive === 'D' ? posicionY + 10 : posicionY),
      });
    }, 50);
    return () => clearInterval(interval);
  }, [joystickActive, posicionX, posicionY]);

  // Manejo de Zoom Logarítmico
  // Slider 0-100 -> Map to 1x - 10000x
  const zoomSliderValue = Math.log10(aumento) * 25; // 0-100 scale

  const handleZoomChange = (val: number) => {
    const newAumento = Math.pow(10, val / 25);
    setMicroscopio({ aumento: Math.round(newAumento) });
  };

  const currentOrganelle = aumento > 2000 
    ? (muestra === 'vegetal' ? 'Cloroplasto' : 'Mitocondria')
    : (aumento > 400 ? 'Núcleo' : 'Pared Celular / Membrana');

  return (
    <div className="flex flex-col h-full bg-[#050505] border-l border-teal-500/20 p-6 font-sans text-slate-300">
      
      {/* HEADER TÉCNICO */}
       <div className="mb-8 p-4 bg-teal-500/5 rounded-2xl border border-teal-500/20">
          <div className="flex items-center gap-3 text-teal-400 mb-2 font-mono text-xs tracking-widest uppercase">
            <Cpu size={14} className="animate-pulse" />
            <span>Telemetry Link established</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-teal-400 to-cerulean-400 bg-clip-text text-transparent">
            {objetivo ? `Objetivo: ${objetivo}` : 'Cargando Práctica...'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Sujeto: Célula Eucariota ({muestra})</p>
       </div>

       <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* SELECTOR DE MUESTRA (PORTAOBJETOS) */}
          <section>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-3 block">1. Preparación de Muestra</label>
            <div className="grid grid-cols-2 gap-3">
              {['vegetal', 'animal'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMicroscopio({ muestra: type as any, aumento: 1 })}
                  className={`p-3 rounded-xl border transition-all duration-300 flex items-center gap-2 ${
                    muestra === type 
                    ? 'bg-teal-500/20 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.3)] text-teal-400' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <Box size={14} />
                  <span className="text-xs capitalize">{type}</span>
                </button>
              ))}
            </div>
          </section>

          {/* CONTROLES ÓPTICOS (ZOOM & LUZ) */}
          <section className="space-y-6">
            <label className="text-[10px] uppercase tracking-wider text-slate-500 block">2. Ajustes Ópticos</label>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ZoomIn size={14} />
                  <span>Aumento Total</span>
                </div>
                <span className="text-sm font-mono text-teal-400">{aumento}x</span>
              </div>
              <input 
                type="range" min="0" max="100" value={zoomSliderValue}
                onChange={(e) => handleZoomChange(parseInt(e.target.value))}
                className="w-full accent-teal-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sun size={14} />
                  <span>Brillo Condensador</span>
                </div>
                <span className="text-sm font-mono text-teal-400">{iluminacion}%</span>
              </div>
              <input 
                type="range" min="0" max="100" value={iluminacion}
                onChange={(e) => setMicroscopio({ iluminacion: parseInt(e.target.value) })}
                className="w-full accent-orange-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </section>

          {/* D-PAD (JOYSTICK DE MOVIMIENTO) */}
          <section>
            <label className="text-[10px] uppercase tracking-wider text-slate-500 mb-4 block">3. Navegación de Platina</label>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-2 bg-white/5 p-4 rounded-3xl border border-white/5 shadow-inner">
                <div />
                <JoystickBtn icon={<ChevronUp />} onStart={() => setJoystickActive('U')} onEnd={() => setJoystickActive(null)} />
                <div />
                <JoystickBtn icon={<ChevronLeft />} onStart={() => setJoystickActive('L')} onEnd={() => setJoystickActive(null)} />
                <div className="w-10 h-10 flex items-center justify-center text-teal-500/30 font-mono text-[8px]">POS</div>
                <JoystickBtn icon={<ChevronRight />} onStart={() => setJoystickActive('R')} onEnd={() => setJoystickActive(null)} />
                <div />
                <JoystickBtn icon={<ChevronDown />} onStart={() => setJoystickActive('D')} onEnd={() => setJoystickActive(null)} />
                <div />
              </div>
            </div>
          </section>

          {/* ANALIZADOR DE IA (Finesse) */}
          <section className="p-4 bg-cerulean-500/10 border border-cerulean-500/20 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-cerulean-400 font-bold uppercase tracking-tight">AI SPECIMEN SCANNER</span>
              <Target size={12} className="text-cerulean-400 animate-spin-slow" />
            </div>
            <div className="h-1 bg-white/5 rounded-full mb-3 overflow-hidden">
               <motion.div 
                 className="h-full bg-cerulean-400" 
                 animate={{ width: aumento / 100 + '%' }} 
               />
            </div>
            <div className="flex items-center gap-2">
              <Info size={14} className="text-cerulean-400" />
              <span className="text-[11px] text-slate-400 italic">
                {currentOrganelle} detectado bajo la lente...
              </span>
            </div>
          </section>

       </div>

       {/* ACCIONES FINALES */}
       <div className="mt-8 pt-6 border-t border-white/5 space-y-4">
          <button
            onClick={() => {
              if (validarB1()) {
                setPasoActual(4); // Completado
              }
            }}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-500 ${
              status === 'success' 
              ? 'bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.5)]' 
              : 'bg-gradient-to-r from-teal-500 to-cerulean-600 text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-teal-500/20'
            }`}
          >
            <Camera size={20} />
            {status === 'success' ? 'PRÁCTICA COMPLETADA' : 'CAPTURAR MICROGRAFÍA'}
          </button>

          <button
            onClick={resetB1}
            className="w-full py-3 text-xs text-slate-500 hover:text-white flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={12} />
            Reiniciar Calibración
          </button>
       </div>

    </div>
  );
};

const JoystickBtn = ({ icon, onStart, onEnd }: { icon: React.ReactNode, onStart: () => void, onEnd: () => void }) => (
  <button
    onMouseDown={onStart} onMouseUp={onEnd} onMouseLeave={onEnd}
    onTouchStart={onStart} onTouchEnd={onEnd}
    className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 active:bg-teal-500/20 active:border-teal-500/50 transition-all text-slate-400"
  >
    {icon}
  </button>
);
