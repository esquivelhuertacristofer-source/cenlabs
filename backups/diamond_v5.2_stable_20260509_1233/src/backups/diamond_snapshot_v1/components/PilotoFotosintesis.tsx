"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Sun, Wind, Thermometer, Droplets, Lightbulb, Play, Square, Info, Zap, Diamond, BarChart3, ChevronRight, RotateCcw, Target, Rocket, FlaskConical, CheckCircle2 } from 'lucide-react';
import Fotosintesis3DScene from './simuladores/bio04/Fotosintesis3DScene';

export default function PilotoFotosintesis({ setShowSuccess }) {
  const { fotosintesis, setFotosintesis, tickFotosintesis, resetB4, generarSemillaB4 } = useSimuladorStore();
  
  const f = fotosintesis || {
    escenario: 'optimizacion_espectro',
    distancia: 5,
    color: 'blanco',
    oxigenoAcumulado: 0,
    tiempo: 0,
    simulando: false,
    targetO2: 50,
    status: 'idle'
  };

  const { escenario, distancia, color, oxigenoAcumulado, simulando, targetO2, status } = f;

  // Limpiar estado al entrar para evitar éxitos persistentes
  useEffect(() => {
    resetB4();
  }, []);

  useEffect(() => {
    let interval: any;
    if (simulando && status !== 'success') {
      interval = setInterval(() => tickFotosintesis(0.1), 100);
    }
    return () => clearInterval(interval);
  }, [simulando, status, tickFotosintesis]);

  // Asegurar que el modal se dispare al completar la meta
  useEffect(() => {
    if (status === 'success' && oxigenoAcumulado >= targetO2) {
      if (setShowSuccess) setShowSuccess(true);
    }
  }, [status, oxigenoAcumulado, targetO2, setShowSuccess]);

  const scenarios = {
    'optimizacion_espectro': {
      title: 'Enigma del Espectro',
      desc: 'Encuentra la combinación de color y distancia que maximice la producción de O2.',
      icon: <FlaskConical className="text-emerald-400" />
    },
    'ley_distancia': {
      title: 'Inverso del Cuadrado',
      desc: 'Investiga cómo la intensidad lumínica decae con el cuadrado de la distancia.',
      icon: <Target className="text-blue-400" />
    },
    'supervivencia_marte': {
      title: 'Misión Marte 2050',
      desc: 'Produce 100ml de O2 en tiempo récord para sustentar la base de investigación.',
      icon: <Rocket className="text-orange-400" />
    }
  };

  const currentEsc = scenarios[escenario] || scenarios['optimizacion_espectro'];

  const colors = [
    { id: 'blanco', label: 'Luz Blanca', hex: '#ffffff', eff: '70%' },
    { id: 'rojo', label: 'Luz Roja', hex: '#ef4444', eff: '100%' },
    { id: 'azul', label: 'Luz Azul', hex: '#3b82f6', eff: '120%' },
    { id: 'verde', label: 'Luz Verde', hex: '#22c55e', eff: '10%' },
    { id: 'amarillo', label: 'Luz Amarilla', hex: '#eab308', eff: '40%' },
  ];

  const progress = (oxigenoAcumulado / targetO2) * 100;

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020617] font-['Outfit']">
      
      {/* HEADER DE CONTROL DIAMOND */}
      <div className="absolute top-6 left-0 right-0 z-[200] px-10 flex justify-between items-center pointer-events-none">
         <div className="flex items-center gap-3 bg-emerald-600/90 backdrop-blur-xl border-2 border-white/40 px-6 py-2 rounded-full shadow-2xl">
            <Sun size={16} className="text-white animate-spin-slow" />
            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">PROTOCOLO DIAMOND v4.2 - FOTOSÍNTESIS</span>
         </div>

         <div className="flex gap-4 pointer-events-auto">
            <button 
              onClick={() => resetB4()}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 px-6 py-2 rounded-full backdrop-blur-md transition-all group"
            >
               <RotateCcw size={16} className="text-white/60 group-hover:rotate-180 transition-transform duration-500" />
               <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Reiniciar Nivel</span>
            </button>
            <button 
              onClick={() => generarSemillaB4()}
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-6 py-2 rounded-full backdrop-blur-md transition-all"
            >
               <Zap size={16} className="text-emerald-400" />
               <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Siguiente Misión</span>
            </button>
         </div>
      </div>

      <div className="absolute inset-0 z-0">
        <Fotosintesis3DScene 
          simulando={simulando} 
          colorLuz={color} 
          intensidad={300/(distancia*distancia)} 
        />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none p-10 flex flex-col justify-between">
        <div className="flex justify-between items-start pt-12">
           <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-black/70 backdrop-blur-3xl border-l-8 border-emerald-500 p-8 rounded-r-3xl shadow-2xl max-w-md">
              <div className="flex items-center gap-3 mb-2">{currentEsc.icon}<span className="text-xs font-black text-emerald-400 uppercase tracking-[0.4em]">{currentEsc.title}</span></div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">Reactor Biológico</h2>
              <p className="text-xs text-white/60 mt-2 font-medium leading-relaxed">{currentEsc.desc}</p>
              
              <div className="mt-8 space-y-6">
                 <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-black text-white/40 uppercase tracking-widest">
                       <span>Oxígeno Producido (O₂)</span>
                       <span>{Math.floor(oxigenoAcumulado)} / {targetO2} ml</span>
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                       <motion.div 
                         className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                       <span className="text-[9px] font-black text-white/40 uppercase block mb-1">Eficiencia Actual</span>
                       <span className="text-xl font-black text-emerald-400 font-mono">
                         {color === 'verde' ? 'CRÍTICA' : color === 'azul' ? 'MÁXIMA' : 'ESTABLE'}
                       </span>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                       <span className="text-[9px] font-black text-white/40 uppercase block mb-1">Irradiación</span>
                       <span className="text-xl font-black text-yellow-400 font-mono">{(300/(distancia*distancia)).toFixed(1)} W/m²</span>
                    </div>
                 </div>
              </div>
           </motion.div>

           <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-emerald-900/40 backdrop-blur-xl border-r-8 border-emerald-500 p-6 rounded-l-3xl shadow-2xl max-w-xs">
              <div className="flex items-center gap-2 mb-3"><Info size={16} className="text-emerald-400" /><span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Dato Científico</span></div>
              <p className="text-xs text-white/80 leading-relaxed font-medium">
                {color === 'verde' ? "La luz verde es reflejada por los pigmentos, por eso no impulsa la fotosíntesis." : "La luz azul y roja activan los fotosistemas para liberar electrones y producir oxígeno."}
              </p>
           </motion.div>
        </div>

        <div className="w-full flex justify-center pb-6">
           <div className="bg-black/80 backdrop-blur-3xl rounded-[3rem] border-2 border-white/10 p-8 shadow-2xl flex items-center gap-10 pointer-events-auto">
              <div className="flex flex-col gap-4">
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Distancia</span>
                 <input type="range" min="1" max="10" step="0.5" value={distancia} onChange={(e) => setFotosintesis({ distancia: parseFloat(e.target.value) })} className="w-48 accent-emerald-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer" />
                 <div className="flex justify-between text-[10px] font-mono text-white/40"><span>1m</span><span>10m</span></div>
              </div>
              <div className="w-px h-16 bg-white/10" />
              <div className="flex flex-col gap-4">
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Espectro</span>
                 <div className="flex gap-3">
                    {colors.map((c) => (
                      <button key={c.id} onClick={() => setFotosintesis({ color: c.id as any })} className={`w-10 h-10 rounded-xl border-2 transition-all ${color === c.id ? 'border-white scale-110 shadow-lg' : 'border-white/10 opacity-40'}`} style={{ backgroundColor: c.hex }} />
                    ))}
                 </div>
              </div>
              <div className="w-px h-16 bg-white/10" />
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setFotosintesis({ simulando: !simulando })} className={`h-16 px-8 rounded-2xl flex items-center gap-4 shadow-2xl border-2 transition-all ${simulando ? 'bg-rose-500/20 border-rose-500 text-rose-400' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'}`}>
                {simulando ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                <span className="text-sm font-black uppercase tracking-widest">{simulando ? 'Detener' : 'Iniciar'}</span>
              </motion.button>
           </div>
        </div>
      </div>

      <AnimatePresence>
         {status === 'success' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[1000] bg-[#020617]/90 backdrop-blur-xl flex items-center justify-center p-10">
              <motion.div initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-black/80 p-16 rounded-[4rem] border-4 border-emerald-500 text-center shadow-[0_0_100px_rgba(16,185,129,0.5)] max-w-2xl">
                 <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-emerald-500">
                    <CheckCircle2 size={48} className="text-emerald-400" />
                 </div>
                 <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">¡Misión Cumplida!</h2>
                 <p className="text-emerald-400 font-bold mt-4 uppercase tracking-[0.3em]">Protocolo {currentEsc.title} Completado</p>
                 <div className="mt-12 flex flex-col gap-4">
                    <button onClick={() => generarSemillaB4()} className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-6 rounded-3xl flex items-center justify-center gap-4 transition-all text-2xl uppercase italic tracking-widest shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
                       Siguiente Misión <ChevronRight size={32} />
                    </button>
                    <button onClick={() => resetB4()} className="text-white/40 hover:text-white text-xs font-black uppercase tracking-[0.5em] transition-colors mt-4">
                       Reiniciar Investigación Actual
                    </button>
                 </div>
              </motion.div>
           </motion.div>
         )}
      </AnimatePresence>
    </div>
  );
}
