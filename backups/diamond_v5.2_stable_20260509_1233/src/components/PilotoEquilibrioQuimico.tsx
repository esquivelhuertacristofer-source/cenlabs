"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Snowflake, Flame, Thermometer, MousePointer2, RotateCcw, 
  Zap, Info, Activity, Gauge, TrendingUp, FlaskConical, Waves, Wind
} from 'lucide-react';
import { audio } from '@/utils/audioEngine';

interface Props {
  isWorktableDark?: boolean;
}

export default function PilotoEquilibrioQuimico({ isWorktableDark = true }: Props) {
  const { equilibrio, setUbicacionJeringa, updateTemperaturaP8, resetP8, generarSemillaP8, audio } = useSimuladorStore();
  
  const [mounted, setMounted] = useState(false);
  const mouseX = useSpring(useMotionValue(0), { damping: 40, stiffness: 120 });
  const mouseY = useSpring(useMotionValue(0), { damping: 40, stiffness: 120 });
  const rotateX = useTransform(mouseY, [-500, 500], [8, -8]);
  const rotateY = useTransform(mouseX, [-500, 500], [-10, 10]);

  // Motor de tiempo para inercia térmica
  useEffect(() => {
    setMounted(true);
    if (equilibrio.jeringas.length === 0) generarSemillaP8();
    
    const interval = setInterval(() => {
      updateTemperaturaP8(0.5);
    }, 500);
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [updateTemperaturaP8]);

  const stations = [
    { id: 'hielo', name: 'Baño de Hielo', temp: 0, icon: <Snowflake size={28} className="text-blue-400" />, color: '#3b82f6', glow: 'shadow-[0_0_80px_rgba(59,130,246,0.3)]' },
    { id: 'mesa', name: 'Temp. Ambiente', temp: 20, icon: <MousePointer2 size={28} className="text-slate-400" />, color: '#94a3b8', glow: 'shadow-[0_0_80px_rgba(148,163,184,0.2)]' },
    { id: 'caliente', name: 'Plancha Caliente', temp: 100, icon: <Flame size={28} className="text-orange-500" />, color: '#f59e0b', glow: 'shadow-[0_0_80px_rgba(245,158,11,0.3)]' }
  ] as const;

  const getGasColor = (temp: number) => {
    const ratio = Math.min(1, Math.max(0, (temp - 0) / 100));
    // N2O4 (Incoloro) <-> 2NO2 (Café)
    const r = Math.round(255 * (1 - ratio) + 101 * ratio);
    const g = Math.round(255 * (1 - ratio) + 67 * ratio);
    const b = Math.round(255 * (1 - ratio) + 33 * ratio);
    const a = 0.05 + ratio * 0.85;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  };

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full bg-[#010409] overflow-hidden flex flex-col font-['Outfit'] perspective-[2500px] text-white">
      
      {/* ── ESCENARIO CINEMÁTICO ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] bg-[#0d1117] transform-gpu skew-x-[-15deg] scale-y-[0.4] origin-bottom opacity-40 shadow-[0_-100px_200px_rgba(0,0,0,0.8)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[1200px] h-[1200px] bg-blue-500/5 blur-[200px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[1000px] h-[1000px] bg-orange-500/5 blur-[200px] rounded-full" />
      </div>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-64 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Sincronía Termodinámica
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Equilibrium Status HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${equilibrio.jeringas.length > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Reactivos</div>
              <div className={`text-sm font-black italic ${equilibrio.jeringas.length > 0 ? 'text-orange-400' : 'text-white/20'}`}>{equilibrio.jeringas.length > 0 ? 'ESTABILIZADOS' : 'PENDIENTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Energía</div>
              <div className={`text-sm font-black italic ${equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? 'text-red-400' : 'text-white/20'}`}>{equilibrio.jeringas.some(j => j.ubicacion === 'caliente') ? 'ABSORCIÓN' : 'AMBIENTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? 'bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Exotérmico</div>
              <div className={`text-sm font-black italic ${equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? 'text-blue-400' : 'text-white/20'}`}>{equilibrio.jeringas.some(j => j.ubicacion === 'hielo') ? 'LIBERACIÓN' : 'INACTIVO'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HUD SUPERIOR ── */}
      <div className="absolute top-12 left-12 right-12 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex gap-8 pointer-events-auto">
           <div className="px-12 py-10 bg-black/40 backdrop-blur-[50px] rounded-[3.5rem] border border-white/10 flex items-center gap-10 shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
              <div className="relative">
                 <Activity className="text-orange-500 animate-pulse" size={48} />
                 <div className="absolute inset-0 bg-orange-500/30 blur-3xl rounded-full" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.5em] mb-3">Reacción en Equilibrio</span>
                 <div className="flex items-center gap-6">
                    <h3 className="text-4xl font-black tracking-tighter text-white">N₂O₄ ⇌ 2NO₂</h3>
                    <span className="px-4 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full text-[10px] font-black text-orange-400 uppercase tracking-widest">Endotérmica</span>
                 </div>
              </div>
           </div>
           
           <div className="px-10 py-10 bg-black/40 backdrop-blur-[50px] rounded-[3.5rem] border border-white/10 flex items-center gap-6 shadow-2xl">
              <Info className="text-blue-400" size={32} />
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Mecanismo</span>
                 <span className="text-sm font-black uppercase text-blue-100/60 tracking-widest">Le Châtelier</span>
              </div>
           </div>
        </div>

        <button onClick={resetP8} className="h-28 w-28 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-white/10 transition-all pointer-events-auto group">
           <RotateCcw size={36} className="group-hover:rotate-[-180deg] transition-transform duration-1000" />
        </button>
      </div>

      {/* ── ESCENA ISOMÉTRICA CENTRAL ── */}
      <motion.div 
        style={{ rotateX, rotateY }}
        className="flex-1 flex items-center justify-center preserve-3d mt-20"
      >
        <div className="relative flex gap-24 items-end preserve-3d p-20">
           
           {stations.map((station, i) => (
             <div key={station.id} className="relative flex flex-col items-center preserve-3d group">
                
                {/* Steam Particles for Hot Plate */}
                {station.id === 'caliente' && <SteamParticles />}
                
                {/* Etiqueta de la Estación */}
                <motion.div 
                   initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                   className="mb-12 text-center"
                >
                   <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] block mb-3">{station.name}</span>
                    <div className="flex items-center justify-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/5">
                       {station.icon}
                       <span className="text-4xl font-black font-mono tracking-tighter text-white">{station.temp}°C</span>
                    </div>
                </motion.div>

                {/* BAÑO TÉRMICO (CONTENEDOR 3D VOLUMÉTRICO) */}
                <div className={`relative w-80 h-44 bg-white/5 border border-white/10 rounded-[3rem] shadow-[inset_0_20px_50px_rgba(255,255,255,0.05)] overflow-hidden preserve-3d group transition-all duration-700 ${station.glow} hover:scale-105`}>
                   {/* Capa de Reflejo de Cristal */}
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-black/30 pointer-events-none" />
                   
                   {/* Efecto de contenido */}
                   {station.id === 'hielo' && (
                     <>
                        <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-[6px]" />
                        <div className="absolute top-0 left-0 right-0 h-4 bg-blue-200/20 blur-[2px]" />
                     </>
                   )}
                   {station.id === 'caliente' && (
                     <motion.div 
                        animate={{ opacity: [0.05, 0.2, 0.05] }} transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-orange-600/10 blur-xl" 
                     />
                   )}

                   {/* JERINGAS EN ESTA POSICIÓN */}
                   <div className="absolute inset-0 flex items-center justify-center gap-10">
                      <AnimatePresence mode="popLayout">
                        {equilibrio.jeringas.filter(j => j.ubicacion === station.id).map(jeringa => (
                          <Syringe3D 
                             key={jeringa.id} 
                             jeringa={jeringa} 
                             color={getGasColor(jeringa.temp)} 
                             setLoc={setUbicacionJeringa}
                          />
                        ))}
                      </AnimatePresence>
                   </div>
                </div>

                {/* Sombra Dinámica */}
                <div className="absolute bottom-[-40px] w-64 h-16 bg-black/60 blur-3xl rounded-full" />
             </div>
           ))}

        </div>
      </motion.div>

      {/* ── FOOTER TOOLTIP HUD ── */}
      <div className="absolute bottom-16 left-12 right-12 z-50 flex items-center justify-center pointer-events-none">
         <div className="bg-black/60 backdrop-blur-3xl px-16 py-8 rounded-full border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex items-center gap-16 pointer-events-auto">
            <div className="flex items-center gap-6">
               <MousePointer2 size={28} className="text-blue-400 animate-bounce" />
               <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em]">Interacción: Clic en Jeringa para desplazar</span>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex items-center gap-6">
               <FlaskConical size={28} className="text-orange-400" />
               <span className="text-[11px] font-black text-white/50 uppercase tracking-[0.4em]">Observación: Color Café = NO₂ (Endotérmico)</span>
            </div>
         </div>
      </div>

      <style jsx>{`
        .preserve-3d { transform-style: preserve-3d; backface-visibility: hidden; }
      `}</style>
    </div>
  );
}

function Syringe3D({ jeringa, color, setLoc }: { jeringa: any; color: string; setLoc: any }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative preserve-3d">
      <motion.div
        layoutId={`syringe-diamond-v2-${jeringa.id}`}
        initial={{ scale: 0, y: 100 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.15, y: -20 }}
        onClick={() => { audio.playPop(); setShowMenu(!showMenu); }}
        className="cursor-pointer flex flex-col items-center group/sy"
      >
         {/* Temperatura Label */}
         <div className="bg-slate-900/90 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/20 mb-6 shadow-2xl scale-90 group-hover/sy:scale-110 transition-transform">
            <span className="text-xs font-black font-mono text-white tracking-tighter">{jeringa.temp.toFixed(1)}°C</span>
         </div>

         {/* CUERPO DE JERINGA ELITE */}
         <div className="relative w-16 h-40 preserve-3d">
            {/* Cristal Principal */}
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[6px] border border-white/30 rounded-2xl overflow-hidden shadow-[inset_0_5px_15px_rgba(255,255,255,0.1)]">
               {/* Gas Interno con Gradiente de Profundidad */}
               <motion.div 
                  animate={{ backgroundColor: color }}
                  className="absolute bottom-0 left-0 right-0 h-[85%] rounded-b-2xl transition-colors duration-1500 ease-in-out shadow-[inset_0_-10px_30px_rgba(0,0,0,0.2)]"
               >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/20" />
               </motion.div>
               {/* Graduación Industrial */}
               <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_11px,rgba(255,255,255,0.1)_11px,rgba(255,255,255,0.1)_12px)] opacity-60" />
            </div>
            
            {/* Émbolo y Accesorios Metal */}
            <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 w-10 h-3 bg-slate-400 rounded-full border border-white/20 shadow-2xl" />
            <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-10 bg-gradient-to-r from-slate-500 to-slate-700 rounded-full" />
         </div>
         
         <span className="mt-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] group-hover/sy:text-white transition-colors">Unit #{jeringa.id}</span>
      </motion.div>

      {/* Menú de Destino Elite */}
      <AnimatePresence>
         {showMenu && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.8, y: 30 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             exit={{ opacity: 0, scale: 0.8, y: 30 }}
             className="absolute bottom-full left-1/2 -translate-x-1/2 mb-28 flex gap-5 bg-black/60 backdrop-blur-[40px] p-8 rounded-[3rem] border border-white/10 shadow-[0_100px_150px_rgba(0,0,0,0.8)] z-[200]"
           >
              {[
                { id: 'hielo', icon: <Snowflake size={24} className="text-white/40 group-hover:text-white group-hover:scale-110 transition-all" />, color: 'hover:bg-blue-600 shadow-blue-600/20' },
                { id: 'mesa', icon: <MousePointer2 size={24} className="text-white/40 group-hover:text-white group-hover:scale-110 transition-all" />, color: 'hover:bg-slate-600 shadow-slate-600/20' },
                { id: 'caliente', icon: <Flame size={24} className="text-white/40 group-hover:text-white group-hover:scale-110 transition-all" />, color: 'hover:bg-orange-600 shadow-orange-600/20' }
              ].map(loc => (
                <button 
                  key={loc.id}
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setLoc(jeringa.id, loc.id); 
                    setShowMenu(false); 
                    audio.playPop();
                    if (loc.id === 'caliente') {
                      audio.playNotification();
                    } else if (loc.id === 'hielo') {
                      audio.playNotification();
                    } else {
                      audio.playNotification();
                    }
                  }}
                  className={`w-20 h-20 rounded-3xl bg-white/5 flex flex-col items-center justify-center transition-all ${loc.color} group gap-2 shadow-xl border border-white/5 hover:scale-110 active:scale-90`}
                >
                   {loc.icon}
                   <span className="text-[8px] font-black text-white/20 group-hover:text-white uppercase tracking-widest">{loc.id}</span>
                </button>
              ))}
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}

function SteamParticles() {
  return (
    <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-40 h-60 pointer-events-none flex justify-center">
       {[...Array(6)].map((_, i) => (
         <motion.div
           key={i}
           initial={{ y: 200, opacity: 0, x: (Math.random() - 0.5) * 40 }}
           animate={{ 
             y: -50, 
             opacity: [0, 0.4, 0], 
             x: (Math.random() - 0.5) * 80,
             scale: [0.5, 1.5, 2]
           }}
           transition={{ 
             duration: 3 + Math.random() * 2, 
             repeat: Infinity, 
             delay: i * 0.8 
           }}
           className="absolute bottom-0 w-8 h-8 bg-white/10 blur-2xl rounded-full"
         />
       ))}
    </div>
  );
}
