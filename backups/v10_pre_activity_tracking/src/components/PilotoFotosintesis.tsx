import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Sun, Droplets, Zap, Activity, Info, Lightbulb } from 'lucide-react';

export default function PilotoFotosintesis() {
  const { fotosintesis, tickFotosintesis, bitacoraData } = useSimuladorStore();
  const { distancia, color, oxigenoAcumulado, targetO2, simulando } = fotosintesis;
  const tasaBPM = bitacoraData.tasaBPM || 0;

  // Tick logic
  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (simulando) tickFotosintesis(dt);
    }, 100);
    return () => clearInterval(interval);
  }, [simulando, tickFotosintesis]);

  // Bubble system logic
  const [bubbles, setBubbles] = useState<{ id: number; x: number; size: number }[]>([]);
  
  useEffect(() => {
    if (!simulando || tasaBPM === 0) return;
    
    const bubbleInterval = setInterval(() => {
      // Tasa ajustada para visualización (tasaBPM / 10 por segundo aprox)
      const count = Math.ceil(tasaBPM / 60);
      for (let i = 0; i < count; i++) {
        setBubbles(prev => [...prev.slice(-40), { 
          id: Date.now() + i, 
          x: 45 + Math.random() * 10, // Cerca del centro de la planta
          size: 4 + Math.random() * 8
        }]);
      }
    }, 1000);
    
    return () => clearInterval(bubbleInterval);
  }, [simulando, tasaBPM]);

  const colorMap = {
    blanco: 'rgba(255, 255, 255,',
    rojo: 'rgba(239, 68, 68,',
    azul: 'rgba(59, 130, 246,',
    verde: 'rgba(16, 185, 129,'
  };

  const lightIntensity = useMemo(() => {
    // 1cm -> 0.4 opacity, 10cm -> 0.05 opacity
    return 0.4 / (distancia * 0.5);
  }, [distancia]);

  return (
    <div className="w-full h-full relative bg-[#0f172a] overflow-hidden flex flex-col items-center justify-center p-12">
      
      {/* 1. EL RIEL Y LA LÁMPARA */}
      <div className="absolute top-20 left-12 right-12 h-2 bg-slate-800 rounded-full border border-white/5">
         <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 100%' }} />
         
         {/* Lámpara Deslizable */}
         <motion.div 
           animate={{ x: `${(distancia - 1) * 11}%` }}
           transition={{ type: 'spring', stiffness: 100 }}
           className="absolute -top-6 left-0 w-24 h-16 group pointer-events-none"
         >
            <div className="w-24 h-8 bg-slate-600 rounded-t-xl border-t border-x border-white/20" />
            <div className="w-20 h-4 bg-slate-700 mx-auto rounded-b-xl border-b border-x border-white/10" />
            
            {/* Haz de Luz */}
            <motion.div 
              animate={{ 
                backgroundColor: colorMap[color] + ' 1)',
                opacity: lightIntensity * 2,
                boxShadow: `0 20px 60px ${colorMap[color]} 0.5)`
              }}
              className="absolute top-12 left-1/2 -translate-x-1/2 w-32 h-[400px] blur-3xl opacity-30 origin-top"
              style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
            />
            
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-white/50 text-[8px] font-black uppercase">
               Bio-Lamp v1
            </div>
         </motion.div>
      </div>

      {/* 2. EL BIORREACTOR (Vaso de Precipitados) */}
      <div className="relative mt-40">
         {/* Vaso de Vidrio */}
         <div className="relative w-80 h-[450px] border-x-4 border-b-4 border-white/20 rounded-b-[4rem] overflow-hidden bg-slate-900/40 backdrop-blur-md">
            
            {/* El Agua y el Tinte Reactivo */}
            <motion.div 
              animate={{ 
                backgroundColor: colorMap[color] + ' 1)',
                opacity: lightIntensity 
              }}
              className="absolute inset-0 z-0 transition-all duration-500"
            />

            {/* Planta Acuática (Elodea Abstracción) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-64 z-10 flex items-end">
               <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <motion.path 
                    animate={{ d: simulando ? ["M50,120 Q48,90 52,60", "M50,120 Q52,90 48,60", "M50,120 Q48,90 52,60"] : "M50,120 Q50,90 50,60" }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    d="M50,120 Q50,90 50,60" stroke="#065f46" strokeWidth="4" fill="none" 
                  />
                  {/* Hojas */}
                  {[20, 40, 60, 80, 100].map((y, i) => (
                    <g key={i} transform={`translate(0, ${120-y})`}>
                       <motion.path 
                         animate={{ rotate: simulando ? [0, 5, 0] : 0 }} 
                         d="M50,0 Q70,-10 80,0 Q70,10 50,0" fill="#10b981" opacity="0.8" 
                       />
                       <motion.path 
                         animate={{ rotate: simulando ? [0, -5, 0] : 0 }} 
                         d="M50,0 Q30,-10 20,0 Q30,10 50,0" fill="#10b981" opacity="0.8" 
                       />
                    </g>
                  ))}
               </svg>
            </div>

            {/* Burbujas de Oxígeno */}
            <AnimatePresence>
               {bubbles.map(b => (
                  <motion.div
                    key={b.id}
                    initial={{ y: 350, x: `${b.x}%`, opacity: 0, scale: 0.5 }}
                    animate={{ 
                      y: 50, 
                      opacity: [0, 0.8, 0.8, 0], 
                      x: [`${b.x}%`, `${b.x + (Math.random() * 4 - 2)}%`, `${b.x}%`],
                      scale: 1 
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3, ease: "easeOut" }}
                    className="absolute bg-white/40 border border-white/60 rounded-full blur-[1px] z-20"
                    style={{ width: b.size, height: b.size }}
                  />
               ))}
            </AnimatePresence>

            {/* Tubo de Recolección Invertido */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-[380px] border-x-4 border-t-4 border-white/20 rounded-t-full bg-slate-800/30 z-30">
               {/* Gas Acumulado (Desplazamiento) */}
               <motion.div 
                 animate={{ height: `${(oxigenoAcumulado / targetO2) * 100}%` }}
                 className="absolute top-0 left-0 right-0 bg-white/10 backdrop-blur-sm border-b-2 border-white/30 flex items-center justify-center overflow-hidden"
               >
                  <motion.div 
                    animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}
                    className="text-[8px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap rotate-90"
                  >
                     O₂ Recolectado
                  </motion.div>
               </motion.div>
               
               {/* Marcas de Graduación */}
               <div className="absolute inset-0 flex flex-col justify-between py-8 px-2">
                  {[...Array(11)].map((_, i) => (
                    <div key={i} className="flex items-center gap-1">
                       <div className="w-2 h-0.5 bg-white/20" />
                       <span className="text-[6px] font-bold text-white/20">{(10-i)*5}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Base del Reactor */}
         <div className="w-[400px] h-12 bg-slate-800 -mx-10 rounded-xl border-t border-white/10 flex items-center justify-around px-12">
            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
            <div className="w-48 h-2 bg-slate-900 rounded-full overflow-hidden">
               <motion.div animate={{ opacity: simulando ? [0.3, 1, 0.3] : 0.3 }} className="w-full h-full bg-emerald-500" />
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
         </div>
      </div>

      {/* Etiquetas Flotantes */}
      <div className="absolute left-20 bottom-20 flex flex-col gap-4">
         <div className="flex items-center gap-3 text-white/30 font-black text-[10px] uppercase tracking-widest bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <Lightbulb size={16} className="text-yellow-400" />
            <span>Ley de la Inversa del Cuadrado (d={distancia}cm)</span>
         </div>
         <div className="flex items-center gap-3 text-white/30 font-black text-[10px] uppercase tracking-widest bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
            <Zap size={16} className="text-emerald-400" />
            <span>Eficiencia Cuántica: {(100 / (distancia*distancia)).toFixed(1)}%</span>
         </div>
      </div>
    </div>
  );
};
