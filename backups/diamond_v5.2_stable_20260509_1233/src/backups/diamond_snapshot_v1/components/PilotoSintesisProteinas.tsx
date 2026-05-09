"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Dna, Zap, Cpu, Terminal, Diamond, MousePointer2, Keyboard, ArrowRight, RotateCcw, CheckCircle } from 'lucide-react';
import Sintesis3DScene from './simuladores/bio03/Sintesis3DScene';

export default function PilotoSintesisProteinas({ setShowSuccess }) {
  const { sintesis, addNucleotido, advanceRibosoma, resetB3 } = useSimuladorStore();
  
  const s = sintesis || { 
    fase: 'transcripcion', 
    adnPlantilla: 'TACCAGGGTTACATT', 
    arnMensajero: '', 
    proteina: [], 
    currentIndex: 0, 
    errores: 0,
    status: 'idle'
  };
  
  const { fase, adnPlantilla, arnMensajero, proteina, currentIndex, errores, status } = s;
  const [showTransition, setShowTransition] = useState(false);

  const handleInput = useCallback((val: string) => {
    if (fase === 'transcripcion') {
      addNucleotido(val.toUpperCase());
    }
  }, [fase, addNucleotido]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (['A', 'U', 'C', 'G', 'T'].includes(key)) {
        handleInput(key);
      }
      if (e.key === 'Enter' && fase === 'traduccion') {
        advanceRibosoma();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput, fase, advanceRibosoma]);

  useEffect(() => {
    if (fase === 'traduccion' && arnMensajero.length > 0 && currentIndex === 0) {
       setShowTransition(true);
       const timer = setTimeout(() => setShowTransition(false), 2500);
       return () => clearTimeout(timer);
    }
  }, [fase, arnMensajero.length, currentIndex]);

  useEffect(() => {
    if (status === 'success' && setShowSuccess) {
      setShowSuccess(true);
    }
  }, [status, setShowSuccess]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020617] font-['Outfit']">
      
      {/* HEADER DE CONTROL DIAMOND */}
      <div className="absolute top-6 left-0 right-0 z-[200] px-10 flex justify-between items-center pointer-events-none">
         <div className="flex items-center gap-3 bg-purple-600/90 backdrop-blur-xl border-2 border-white/40 px-6 py-2 rounded-full shadow-2xl">
            <Diamond size={16} className="text-white animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">PROTOCOLO DIAMOND v3.2 - BIO-03</span>
         </div>

         {/* BOTÓN REINICIAR */}
         <button 
           onClick={() => resetB3()}
           className="pointer-events-auto flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 px-6 py-2 rounded-full backdrop-blur-md transition-all group"
         >
            <RotateCcw size={16} className="text-white/60 group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Reiniciar Práctica</span>
         </button>
      </div>

      <div className="absolute inset-0 z-0">
        <Sintesis3DScene 
          fase={fase} 
          currentIndex={fase === 'transcripcion' ? arnMensajero.length : currentIndex} 
          proteinaCount={proteina.length} 
          adnPlantilla={adnPlantilla}
        />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none p-10 flex flex-col justify-between">
        <div className="flex justify-between items-start pt-12">
           <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-black/70 backdrop-blur-3xl border-l-8 border-purple-500 p-8 rounded-r-3xl shadow-2xl">
              <div className="flex items-center gap-3 mb-2"><Terminal className="text-purple-400" size={20} /><span className="text-xs font-black text-purple-400 uppercase tracking-[0.4em]">Núcleo de Secuenciación Genética</span></div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic">{fase === 'transcripcion' ? 'Núcleo / Transcripción' : 'Citoplasma / Traducción'}</h2>
              <div className="mt-4 flex items-center gap-6">
                 <div className="flex flex-col"><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Errores de Secuencia</span><span className={`text-2xl font-mono font-black ${errores > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>{errores}</span></div>
                 <div className="w-px h-10 bg-white/10" /><div className="flex flex-col"><span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Estabilidad Genética</span><span className="text-2xl font-mono font-black text-cyan-400">{Math.max(0, 100 - errores * 5)}%</span></div>
              </div>
           </motion.div>
        </div>

        <div className="w-full flex justify-center">
           <div className="w-full max-w-5xl bg-black/80 backdrop-blur-3xl rounded-[3rem] border-2 border-white/10 p-10 shadow-2xl">
              <div className="flex flex-col gap-8 text-center">
                 <div className="flex flex-col gap-3">
                    <span className="text-xs font-black text-white/30 uppercase tracking-[0.3em]">Plantilla de ADN (Hebra Maestra)</span>
                    <div className="flex gap-2 justify-center">
                       {adnPlantilla.split('').map((base, i) => (
                         <div key={i} className={`w-12 h-14 flex items-center justify-center font-mono text-2xl font-black border-2 rounded-xl transition-all duration-500 ${i === arnMensajero.length && fase === 'transcripcion' ? 'bg-purple-600 border-white text-white scale-110 shadow-[0_0_20px_#8b5cf6]' : i < arnMensajero.length ? 'border-purple-500/20 text-purple-300/10' : 'border-white/5 text-white/20'}`}>{base}</div>
                       ))}
                    </div>
                 </div>
                 <div className="flex flex-col gap-3">
                    <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em]">Ensamblaje de ARNm (Transcrito)</span>
                    <div className="flex gap-2 min-h-[56px] justify-center">
                       {arnMensajero.split('').map((base, i) => (
                         <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-12 h-14 flex items-center justify-center font-mono text-2xl font-black rounded-xl border-2 border-cyan-500 bg-cyan-500/20 text-cyan-400 ${i >= currentIndex && i < currentIndex + 3 && fase === 'traduccion' ? 'ring-4 ring-cyan-400 shadow-[0_0_20px_#06b6d4]' : ''}`}>{base}</motion.div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-6">
           {fase === 'transcripcion' ? (
              <div className="flex gap-6 pointer-events-auto">
                 {['A', 'U', 'C', 'G'].map((base) => (
                    <motion.button key={base} whileHover={{ scale: 1.1, y: -10 }} whileTap={{ scale: 0.9 }} onClick={() => addNucleotido(base)} className={`w-24 h-24 rounded-3xl border-4 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden ${base === 'A' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : base === 'U' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : base === 'C' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-orange-500/20 border-orange-500 text-orange-400'}`}><span className="text-4xl font-black font-mono">{base}</span><span className="text-[10px] font-black opacity-40">ENTRADA</span></motion.button>
                 ))}
              </div>
           ) : (
              <motion.button 
                initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => advanceRibosoma()}
                className="pointer-events-auto h-24 px-12 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-[2rem] flex items-center gap-6 shadow-2xl border-4 border-white/20 group"
              >
                 <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{status === 'success' ? 'Misión Cumplida' : 'Acción Ribosómica'}</span>
                    <span className="text-2xl font-black text-white uppercase italic">{status === 'success' ? 'Ver Certificación' : 'Ensamblar Aminoácido'}</span>
                 </div>
                 <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:bg-white/40 transition-all">
                    {status === 'success' ? <CheckCircle size={32} className="text-white" /> : <ArrowRight size={32} className="text-white" />}
                 </div>
              </motion.button>
           )}
           <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-3"><Keyboard size={14} className="text-white/40" /><span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{fase === 'transcripcion' ? 'Usa [A, U, C, G] para transcribir' : 'Pulsa [Enter] para traducir'}</span></div>
        </div>
      </div>

      <AnimatePresence>
        {showTransition && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-[#020617] flex flex-col items-center justify-center">
             <motion.div animate={{ scale: [1, 1.5, 1], rotate: [0, 90, 0] }} transition={{ duration: 2, repeat: Infinity }}><Zap className="text-purple-500 shadow-[0_0_50px_#8b5cf6]" size={100} /></motion.div>
             <h3 className="text-white text-5xl font-black uppercase tracking-[0.5em] mt-12 italic">Translocación</h3>
             <p className="text-purple-400 font-bold mt-4 uppercase tracking-[0.2em] animate-pulse text-center max-w-md">El ARNm viaja desde el Núcleo hacia el Ribosoma a través del Retículo Endoplasmático.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
