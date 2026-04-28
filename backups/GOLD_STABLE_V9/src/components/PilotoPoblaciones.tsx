import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';


export default function PilotoPoblaciones() {
  const { ecosistema, tickEcosistema } = useSimuladorStore();
  const { poblacionPresas, poblacionDepredadores, historial, status, simulando, tiempoVirtual } = ecosistema;
  
  const [viewMode, setViewMode] = useState<'standard' | 'phase'>('standard');
  const requestRef = useRef<number>(undefined!);
  const lastTimeRef = useRef<number>(undefined!);


  const animate = (time: number) => {
    if (lastTimeRef.current !== undefined && simulando) {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      // Escalar dt para que el tiempo virtual fluya a una velocidad razonable
      tickEcosistema(deltaTime * 1.5); 
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [simulando]);

  // Generar trazados para el gráfico
  const generatePath = (data: Array<{ t: number, x: number, y: number }>, type: 'x' | 'y') => {
    if (data.length < 2) return "";
    const width = 800;
    const height = 200;
    const maxPop = 300; // Normalizar a 300 para visualización
    
    return data.map((p, i) => {
        const xPos = (i / (data.length - 1)) * width;
        const val = type === 'x' ? p.x : p.y;
        const yPos = height - (Math.min(val, maxPop) / maxPop) * height;
        return `${i === 0 ? 'M' : 'L'} ${xPos} ${yPos}`;
    }).join(" ");
  };

  // Generar diagrama de fase
  const generatePhasePath = (data: Array<{ t: number, x: number, y: number }>) => {
    if (data.length < 2) return "";
    const size = 300;
    const max = 300;
    return data.map((p, i) => {
        const xPos = (Math.min(p.x, max) / max) * size;
        const yPos = size - (Math.min(p.y, max) / max) * size;
        return `${i === 0 ? 'M' : 'L'} ${xPos} ${yPos}`;
    }).join(" ");
  };

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden bg-[#0A1121] p-6 gap-6">
      
      {/* 1. OSCILOSCOPIO ECOLÓGICO (ARRIBA) */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden backdrop-blur-md">
        <div className="flex justify-between items-center mb-6 relative z-10">
            <h4 className="text-[11px] font-black uppercase text-[#219EBC] tracking-[0.2em] flex items-center gap-2">
                <Activity size={12} /> Monitor Cuantitativo
            </h4>
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#EC4899] shadow-[0_0_8px_#EC4899]" />
                    <span className="text-[10px] font-black text-white/60 uppercase">Presas</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#219EBC] shadow-[0_0_8px_#219EBC]" />
                    <span className="text-[10px] font-black text-white/60 uppercase">Depredadores</span>
                </div>
            </div>
        </div>

        <svg width="100%" height="100%" viewBox="0 0 800 200" className="overflow-visible" preserveAspectRatio="none">
            {/* Grid */}
            {[0, 50, 100, 150, 200].map(y => (
                <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            
            {/* Líneas de Población */}
            <motion.path 
                initial={false}
                animate={{ d: generatePath(historial, 'x') }}
                fill="none" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                className="drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]"
            />
            <motion.path 
                initial={false}
                animate={{ d: generatePath(historial, 'y') }}
                fill="none" stroke="#219EBC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                className="drop-shadow-[0_0_8px_rgba(33,158,188,0.5)]"
            />

            {/* Marcador de Tiempo Actual */}
            <line x1="800" y1="0" x2="800" y2="200" stroke="#FB8500" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {/* Alerta de Extinción Overlay */}
        <AnimatePresence>
            {status === 'extinction' && (
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-red-950/40 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                >
                    <div className="text-center">
                        <h5 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">EXTINCIÓN</h5>
                        <p className="text-[11px] font-bold text-red-400 uppercase tracking-widest italic">Equilibrio Roto - Colapso Sistémico</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* 2. EL PRADO VIRTUAL / DIAGRAMA DE FASE (ABAJO) */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden">
        <div className="flex justify-between items-center mb-4 text-white/40 text-[10px] font-black uppercase tracking-widest relative z-10">
            <span>Representación Fenotípica</span>
            <button 
                onClick={() => setViewMode(prev => prev === 'standard' ? 'phase' : 'standard')}
                className="px-4 py-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
            >
                {viewMode === 'standard' ? 'Ver Espacio de Estados' : 'Ver Prado Virtual'}
            </button>
        </div>

        <div className="flex-1 relative">
            <AnimatePresence mode="wait">
                {viewMode === 'standard' ? (
                    <motion.div 
                        key="meadow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full relative"
                    >
                        {/* El Prado de Partículas */}
                        <div className="absolute inset-0 grid grid-cols-12 gap-1 content-start pointer-events-none opacity-40">
                            {/* Partículas de Presas (Randomizadas por densidad) */}
                            {[...Array(Math.min(Math.floor(poblacionPresas / 2), 144))].map((_, i) => (
                                <motion.div 
                                    key={`presa-${i}`}
                                    initial={{ scale: 0 }} animate={{ scale: [0.8, 1.2, 0.8] }}
                                    transition={{ repeat: Infinity, duration: 2 + Math.random(), delay: Math.random() }}
                                    className="w-1.5 h-1.5 bg-[#EC4899] rounded-full blur-[1px] shadow-[0_0_5px_#EC4899]"
                                />
                            ))}
                            {/* Partículas de Depredadores */}
                            {[...Array(Math.min(Math.floor(poblacionDepredadores), 60))].map((_, i) => (
                                <motion.div 
                                    key={`dep-${i}`}
                                    initial={{ scale: 0, x: Math.random() * 20 }} 
                                    animate={{ 
                                        scale: [1, 1.5, 1],
                                        x: [0, 10, 0],
                                        y: [0, -5, 0]
                                    }}
                                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                                    className="w-2 h-2 bg-[#219EBC] rounded-sm transform rotate-45 border border-[#8ECAE6]"
                                />
                            ))}
                        </div>
                        {/* Mensaje de Densidad */}
                        <div className="absolute bottom-4 right-4 text-right">
                             <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Densidad Poblacional Máxima: 1000u/km²</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="phase" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center p-4"
                    >
                        <div className="relative border-l border-b border-white/20 p-2">
                            <span className="absolute -left-10 top-1/2 -rotate-90 text-[9px] font-black text-[#219EBC] uppercase tracking-widest">Predadores (y)</span>
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-[#EC4899] uppercase tracking-widest">Presas (x)</span>
                            <svg width="300" height="300" className="overflow-visible">
                                <motion.path 
                                    initial={false}
                                    animate={{ d: generatePhasePath(historial) }}
                                    fill="none" stroke="#FB8500" strokeWidth="2" strokeOpacity="0.8"
                                    className="drop-shadow-[0_0_8px_#FB8500]"
                                />
                                <motion.circle 
                                    animate={{ cx: (Math.min(poblacionPresas, 300) / 300) * 300, cy: 300 - (Math.min(poblacionDepredadores, 300) / 300) * 300 }}
                                    r="5" fill="white" className="shadow-lg shadow-white/50"
                                />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

      </div>

    </div>
  );
};
