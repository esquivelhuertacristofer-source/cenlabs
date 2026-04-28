"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Thermometer, Snowflake, Flame, Info, RotateCcw, MousePointer2, Zap } from 'lucide-react';

interface Props {
  isWorktableDark?: boolean;
  isProfesor?: boolean;
}

export default function PilotoEquilibrioQuimico({ isWorktableDark = true, isProfesor = false }: Props) {
  const { equilibrio, setUbicacionJeringa, updateTemperaturaP8, resetP8 } = useSimuladorStore();
  
  // Motor de tiempo para inercia térmica
  useEffect(() => {
    const interval = setInterval(() => {
      updateTemperaturaP8(0.5); // dt = 0.5s
    }, 500);
    return () => clearInterval(interval);
  }, [updateTemperaturaP8]);

  const stations = [
    { id: 'hielo', name: 'Baño de Hielo', temp: 0, icon: <Snowflake className="text-blue-400" size={18} />, color: '#BDE0FE' },
    { id: 'mesa', name: 'Temperatura Ambiente', temp: 20, icon: <MousePointer2 className="text-slate-400" size={18} />, color: '#E2E8F0' },
    { id: 'caliente', name: 'Plancha Caliente', temp: 100, icon: <Flame className="text-orange-500" size={18} />, color: '#FFD7BA' }
  ] as const;

  // Helper para obtener el color del gas basado en la temperatura
  // N2O4 (Incoloro) <-> 2NO2 (Café)
  // Endotérmica (Delta H > 0) -> A mayor T, más productos (Café)
  const getGasColor = (temp: number) => {
    const minTemp = 0;
    const maxTemp = 100;
    const ratio = (temp - minTemp) / (maxTemp - minTemp);
    
    // De transparente (rgba 255,255,255,0) a café oscuro (rgba 101, 67, 33, 0.8)
    const r = Math.round(165 * ratio + 255 * (1 - ratio));
    const g = Math.round(100 * ratio + 255 * (1 - ratio));
    const b = Math.round(50 * ratio + 255 * (1 - ratio));
    const a = 0.1 + ratio * 0.7;

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  return (
    <div className={`w-full h-full flex flex-col ${isWorktableDark ? 'bg-[#0A1121]' : 'bg-slate-50'} overflow-hidden relative font-sans`}>
      
      {/* HEADER DE ESTADO */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
             <Zap size={14} className="text-[#FB8500]" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">Reacción: <span className="text-[#8ECAE6]">N₂O₄ ⇌ 2NO₂</span></span>
          </div>
          <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
             <Info size={14} className="text-[#219EBC]" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">Principio de Le Châtelier</span>
          </div>
        </div>
        <button onClick={resetP8} className="px-6 py-3 bg-white/5 text-slate-500 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 hover:text-red-400 flex items-center gap-2">
           <RotateCcw size={14} /> Reset
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-12 gap-20">
        
        {/* ESTACIONES TÉRMICAS */}
        <div className="flex justify-around w-full max-w-5xl gap-10">
          {stations.map(station => (
            <div key={station.id} className="flex flex-col items-center gap-6 group relative">
              <div 
                className="absolute -inset-4 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ backgroundColor: station.color }}
              />
              
              <div className="text-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{station.name}</span>
                <div className="flex items-center justify-center gap-2">
                  {station.icon}
                  <span className="text-2xl font-black text-white font-mono">{station.temp}°C</span>
                </div>
              </div>

              {/* Area de la estación */}
              <div className="w-64 h-24 bg-white/5 border border-white/10 rounded-[2rem] relative shadow-inner overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                <div className="absolute inset-0 flex items-center justify-center gap-6">
                   {equilibrio.jeringas.filter(j => j.ubicacion === station.id).map(jeringa => (
                     <Syringe key={jeringa.id} id={jeringa.id} temp={jeringa.temp} color={getGasColor(jeringa.temp)} />
                   ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* INSTRUCCIÓN FLOTANTE */}
        <div className="bg-slate-900/80 backdrop-blur-2xl px-8 py-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4">
           <div className="w-2 h-2 rounded-full bg-[#FB8500] animate-ping" />
           <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
              Haz clic en una jeringa para cambiar su posición térmica
           </p>
        </div>
      </div>
    </div>
  );
}

function Syringe({ id, temp, color }: { id: number; temp: number; color: string }) {
  const { setUbicacionJeringa } = useSimuladorStore();
  const [showOptions, setShowOptions] = useState(false);

  const locs: ('mesa' | 'caliente' | 'hielo')[] = ['hielo', 'mesa', 'caliente'];

  return (
    <div className="relative group/syringe">
      <motion.div 
        layoutId={`syringe-${id}`}
        whileHover={{ scale: 1.1, y: -5 }}
        onClick={() => setShowOptions(!showOptions)}
        className="cursor-pointer relative z-10"
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#219EBC] px-3 py-1 rounded-full border border-white/20 shadow-xl scale-75">
           <span className="text-[11px] font-black text-white font-mono tracking-tighter">{temp.toFixed(1)}°C</span>
        </div>

        <svg width="45" height="100" viewBox="0 0 45 100" className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
           <rect x="12" y="10" width="22" height="75" rx="3" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
           <motion.rect 
             initial={false}
             animate={{ fill: color }}
             x="13" y="15" width="20" height="65" rx="1.5" 
             transition={{ duration: 0.8 }}
           />
           <rect x="8" y="5" width="30" height="4" rx="1" fill="#475569" />
           <rect x="20" y="0" width="6" height="15" fill="#475569" />
           {[25, 40, 55, 70].map(h => (
              <line key={h} x1="12" y1={h} x2="18" y2={h} stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
           ))}
           <text x="23" y="55" textAnchor="middle" fill="white" fontSize="9" fontWeight="black" opacity="0.3">#{id}</text>
        </svg>
      </motion.div>

      <AnimatePresence>
        {showOptions && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute -top-36 left-1/2 -translate-x-1/2 flex gap-3 bg-slate-950 p-4 rounded-[1.5rem] border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-[100]"
          >
             {locs.map(loc => (
               <button 
                 key={loc}
                 onClick={(e) => { 
                   e.stopPropagation(); 
                   setUbicacionJeringa(id, loc); 
                   setShowOptions(false); 
                 }}
                 className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-[#219EBC] flex flex-col items-center justify-center transition-all group gap-1"
               >
                  {loc === 'hielo' && <Snowflake size={14} className="text-blue-400 group-hover:text-white" />}
                  {loc === 'mesa' && <MousePointer2 size={14} className="text-slate-400 group-hover:text-white" />}
                  {loc === 'caliente' && <Flame size={14} className="text-orange-500 group-hover:text-white" />}
                  <span className="text-[6px] font-black text-white/30 group-hover:text-white uppercase">{loc}</span>
               </button>
             ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
