import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Info, AlertTriangle, Droplets, Zap, Eye, EyeOff } from 'lucide-react';

export default function PilotoTransporteCelular() {
  const { transporte, tickTransporte } = useSimuladorStore();
  const { concExt, concInt, tipoCelula, verParticulas, volumen, status } = transporte;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; type: 'water' | 'solute'; speed: number }[]>([]);

  // Tick de simulación
  useEffect(() => {
    const interval = setInterval(() => {
      tickTransporte(0.05); // 50ms tick
    }, 50);
    return () => clearInterval(interval);
  }, [tickTransporte]);

  // Generación de partículas
  useEffect(() => {
    if (!verParticulas) {
      setParticles([]);
      return;
    }

    interface Particle {
      id: number;
      x: number;
      y: number;
      type: 'water' | 'solute';
      speed: number;
    }

    const newParticles: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      type: i % 4 === 0 ? 'solute' : 'water',
      speed: 0.5 + Math.random() * 1
    }));
    setParticles(newParticles);
  }, [verParticulas]);

  // Movimiento de partículas (Efecto ósmosis)
  useEffect(() => {
    if (!verParticulas) return;
    
    const moveInterval = setInterval(() => {
      setParticles(prev => prev.map(p => {
        let newX = p.x;
        let newY = p.y;
        
        // Dirección preferencial del agua según gradiente
        if (p.type === 'water') {
          const moveTowardCenter = concInt > concExt ? 0.2 : -0.2;
          const distToCenter = Math.sqrt(Math.pow(p.x - 50, 2) + Math.pow(p.y - 50, 2));
          
          if (concInt > concExt) {
             // Hipotónico: Agua entra
             newX += (50 - p.x) * 0.01;
             newY += (50 - p.y) * 0.01;
          } else if (concInt < concExt) {
             // Hipertónico: Agua sale
             newX -= (50 - p.x) * 0.01;
             newY -= (50 - p.y) * 0.01;
          }
        }

        // Movimiento browniano básico
        newX += (Math.random() - 0.5) * 0.5;
        newY += (Math.random() - 0.5) * 0.5;

        // Wrap around
        if (newX < 0) newX = 100;
        if (newX > 100) newX = 0;
        if (newY < 0) newY = 100;
        if (newY > 100) newY = 0;

        return { ...p, x: newX, y: newY };
      }));
    }, 100);
    
    return () => clearInterval(moveInterval);
  }, [verParticulas, concExt, concInt]);

  const getTonicityLabel = () => {
    const diff = concExt - concInt;
    if (Math.abs(diff) < 0.05) return { label: 'ISOTÓNICO', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
    if (diff > 0) return { label: 'HIPERTÓNICO', color: 'text-rose-400', bg: 'bg-rose-400/10' };
    return { label: 'HIPOTÓNICO', color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
  };

  const tonicity = getTonicityLabel();

  return (
    <div ref={containerRef} className="w-full h-full bg-[#023047] relative overflow-hidden flex items-center justify-center">
      {/* Grid de fondo */}
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#8ECAE6 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Contenedor de cristal (Vaso de precipitados) */}
      <div className="relative w-[500px] h-[500px] border-4 border-white/20 rounded-[3rem] bg-gradient-to-b from-white/5 to-[#219EBC]/10 backdrop-blur-sm flex items-center justify-center">
        
        {/* Nivel de fluido */}
        <motion.div 
          animate={{ height: `${80 + (100 - volumen) * 0.1}%` }}
          className="absolute bottom-0 left-0 right-0 bg-[#8ECAE6]/20 rounded-b-[2.5rem] border-t border-white/30"
        />

        {/* Partículas */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              className={`absolute w-1.5 h-1.5 rounded-full ${p.type === 'water' ? 'bg-cyan-400' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,133,0,0.5)]'}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          ))}
        </div>

        {/* CÉLULA */}
        <div className="relative z-10">
          {tipoCelula === 'animal' ? (
            <motion.div
              animate={{ 
                scale: volumen / 100, 
                rotate: volumen > 160 ? [0, -1, 1, 0] : 0,
                x: volumen > 160 ? [0, -2, 2, 0] : 0
              }}
              transition={{ 
                scale: { type: 'spring', stiffness: 50, damping: 15 },
                rotate: { repeat: Infinity, duration: 0.1 },
                x: { repeat: Infinity, duration: 0.1 }
              }}
              className="relative"
            >
              {/* Eritrocito (Círculo bicóncavo simplificado) */}
              <div className={`w-40 h-40 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 shadow-2xl border-4 border-rose-400/50 flex items-center justify-center overflow-hidden`}>
                <div className="w-20 h-20 rounded-full bg-rose-800/30 blur-xl px-2" />
                {volumen > 170 && (
                   <div className="absolute inset-0 bg-white/30 animate-pulse" />
                )}
              </div>
              
              {/* Etiquetas internas */}
              <div className="absolute inset-0 flex items-center justify-center font-black text-rose-100 text-[10px] pointer-events-none">
                {volumen > 165 ? 'LISIS CRÍTICA' : `${volumen.toFixed(0)}% VOL`}
              </div>
            </motion.div>
          ) : (
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Pared Celular (Rígida) */}
              <div className="absolute inset-0 border-[6px] border-emerald-600/50 rounded-3xl bg-emerald-900/10" />
              
              {/* Membrana y Vacuola (Deformable) */}
              <motion.div
                animate={{ scale: Math.max(0.4, volumen / 100) }}
                className="w-full h-full p-2"
              >
                <div className="w-full h-full border-4 border-emerald-400/80 bg-emerald-500/30 rounded-2xl flex items-center justify-center">
                  <motion.div 
                    animate={{ scale: Math.max(0.3, volumen / 100) }}
                    className="w-2/3 h-2/3 bg-cyan-400/40 border-2 border-cyan-200/50 rounded-xl flex items-center justify-center"
                  >
                     <span className="text-[8px] font-black text-white/50 uppercase">Vacuola</span>
                  </motion.div>
                </div>
              </motion.div>
              
              <div className="absolute -bottom-8 w-full text-center">
                 <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Modelo Vegetal</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HUD de Telemetría (Esquina superior derecha) */}
      <div className="absolute top-8 right-8 space-y-4">
        <div className="bg-[#023047]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl w-64 border-l-4 border-cyan-500">
           <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Monitor Osmótico</span>
              <Droplets size={14} className="text-cyan-400" />
           </div>
           
           <div className="space-y-3">
              <div className="flex justify-between items-center text-white">
                 <span className="text-xs font-bold opacity-60">Medio:</span>
                 <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${tonicity.color} ${tonicity.bg}`}>
                    {tonicity.label}
                 </span>
              </div>
              <div className="flex justify-between items-center text-white">
                 <span className="text-xs font-bold opacity-60">Temp. Sistema:</span>
                 <span className="text-xs font-mono font-black">298 K (25°C)</span>
              </div>
           </div>
        </div>

        {status === 'error' && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-rose-500/20 border border-rose-500/50 rounded-2xl p-4 backdrop-blur-md flex items-center gap-3"
          >
            <AlertTriangle className="text-rose-500" size={20} />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-rose-500 uppercase">Alerta Crítica</span>
              <span className="text-[9px] font-bold text-rose-100">Integridad de membrana comprometida</span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Leyenda de Partículas */}
      <div className="absolute bottom-8 right-8 flex gap-6 bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter">H₂O</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter">Soluto (NaCl)</span>
         </div>
      </div>
    </div>
  );
};
