import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Bird, Skull, CloudRain, Wind, Timer } from 'lucide-react';

export default function PilotoSeleccionNatural() {
  const { evolucion, tickEvolucion, cazarPolilla } = useSimuladorStore();
  const { ambiente, isRunning, bugs, tiempo } = evolucion;
  const requestRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);

  const animate = (time: number) => {
    if (lastTimeRef.current !== undefined) {
      const dt = (time - lastTimeRef.current) / 1000;
      tickEvolucion(dt);
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isRunning) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = undefined;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRunning]);

  return (
    <div className="w-full h-full relative bg-[#1a1c2c] overflow-hidden cursor-crosshair">
       
       {/* 1. FONDO DE CORTEZA (El Ambiente) */}
       <div className="absolute inset-0 transition-all duration-1000 overflow-hidden">
          <motion.div 
            initial={false}
            animate={{ 
              backgroundColor: ambiente === 'limpio' ? '#f0f4f8' : '#334155',
              backgroundImage: ambiente === 'limpio' 
                ? 'linear-gradient(90deg, #e2e8f0 1px, transparent 1px), linear-gradient(0deg, #e2e8f0 1px, transparent 1px)'
                : 'linear-gradient(90deg, #1e293b 1px, transparent 1px), linear-gradient(0deg, #1e293b 1px, transparent 1px)'
            }}
            style={{ backgroundSize: '100px 100px' }}
            className="w-full h-full relative"
          >
             {/* Textura de Corteza/Musgo/Hollín */}
             <div className={`absolute inset-0 opacity-40 mix-blend-multiply ${ambiente === 'industrial' ? 'bg-black/40 grayscale' : 'bg-green-100/20'}`} />
             <div className="absolute inset-0 bg-repeat opacity-10" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cork-board.png")' }} />
             
             {/* Efectos ambientales */}
             {ambiente === 'industrial' && (
               <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ x: [0, 50, 0], opacity: [0.1, 0.3, 0.1] }}
                      transition={{ duration: 10 + i * 2, repeat: Infinity }}
                      className="absolute w-[800px] h-[400px] bg-slate-900/40 blur-[100px] -left-20"
                      style={{ top: i * 200 }}
                    />
                  ))}
               </div>
             )}
          </motion.div>
       </div>

       {/* 2. ENJAMBRE DE POLILLAS */}
       <div className="absolute inset-0 z-10 pointer-events-none">
          <AnimatePresence>
             {bugs.map((bug) => (
                <Polilla 
                  key={bug.id} 
                  bug={bug} 
                  ambiente={ambiente} 
                  onHunt={() => cazarPolilla(bug.id)} 
                  active={isRunning}
                />
             ))}
          </AnimatePresence>
       </div>

       {/* 3. CAPA DE INTERVENCIÓN (Ave/Mira) */}
       {isRunning && (
         <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 bg-black/40 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full flex items-center gap-4 text-white">
            <div className="flex items-center gap-2">
               <Bird size={18} className="text-[#FB8500]" />
               <span className="text-[10px] font-black uppercase tracking-widest">Temporada de Caza</span>
            </div>
            <div className="w-1 h-6 bg-white/10" />
            <div className="flex items-center gap-2">
               <Timer size={18} className="text-emerald-400" />
               <span className="text-xl font-mono font-black">{Math.ceil(tiempo)}s</span>
            </div>
         </div>
       )}

       {/* UI DE STATUS */}
       {!isRunning && bugs.length === 0 && (
         <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/20 pointer-events-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 backdrop-blur-3xl border border-white/20 p-10 rounded-[4rem] text-center"
            >
               <Bird size={64} className="text-white mx-auto mb-6 opacity-40" />
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2 italic">Depredador Esperando</h3>
               <p className="text-white/60 text-sm font-bold">Inicia el ciclo desde la bitácora para comenzar a cazar.</p>
            </motion.div>
         </div>
       )}

       {/* Indicador de Camuflaje */}
       <div className="absolute bottom-8 left-8 z-30">
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${ambiente === 'limpio' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
             <span className="text-[10px] font-black text-white/40 uppercase">Presión Selectiva: 1.5x Multiplicador</span>
          </div>
       </div>

    </div>
  );
};

const Polilla = ({ bug, ambiente, onHunt, active }: any) => {
  const isTargetClara = bug.tipo === 'clara';
  
  // Lógica de Camuflaje:
  // En ambiente limpio: Claras tienen poca visibilidad (0.2) y Oscuras mucha (1.0).
  // En ambiente industrial: Claras mucha visibilidad (1.0) y Oscuras poca (0.2).
  const visibilidad = (ambiente === 'limpio') 
    ? (isTargetClara ? 0.15 : 1.0) 
    : (isTargetClara ? 1.0 : 0.15);

  if (bug.cazada) {
    return (
      <motion.div 
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 2, y: -20 }}
        className="absolute z-10"
        style={{ left: `${bug.x}%`, top: `${bug.y}%` }}
      >
         <Skull size={24} className="text-white/20" />
      </motion.div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.8 }}
      className="absolute pointer-events-auto z-[100] outline-none group"
      style={{ 
        left: `${bug.x}%`, 
        top: `${bug.y}%`, 
        rotate: `${bug.angle * (180/Math.PI)}deg`,
        opacity: visibilidad 
      }}
      onClick={(e) => {
        e.stopPropagation();
        onHunt();
      }}
    >
       <svg width="60" height="40" viewBox="0 0 100 80" className="drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(251,133,0,0.5)] transition-all">
          {/* Alas */}
          <path d="M50,40 Q10,0 10,40 Q10,80 50,45" fill={isTargetClara ? '#f8fafc' : '#1e293b'} stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          <path d="M50,40 Q90,0 90,40 Q90,80 50,45" fill={isTargetClara ? '#f1f5f9' : '#0f172a'} stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
          {/* Cuerpo */}
          <ellipse cx="50" cy="40" rx="6" ry="15" fill={isTargetClara ? '#cbd5e1' : '#020617'} />
          <path d="M48,25 Q45,15 40,15" stroke="currentColor" fill="none" strokeWidth="2" strokeOpacity={isTargetClara ? 0.3 : 0.8} />
          <path d="M52,25 Q55,15 60,15" stroke="currentColor" fill="none" strokeWidth="2" strokeOpacity={isTargetClara ? 0.3 : 0.8} />
       </svg>
    </motion.button>
  );
};
