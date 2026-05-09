"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Dna, Zap, Cpu, Terminal, Diamond, Play, RotateCcw, BarChart3, Info, ChevronRight, Hash, FlaskConical, Beaker, Layers, Sparkles } from 'lucide-react';
import Genetica3DScene from './simuladores/bio05/Genetica3DScene';

export default function PilotoGenetica({ setShowSuccess }: { setShowSuccess: (val: boolean) => void }) {
  const { genetica, setGenetica, generarF1, resetB5 } = useSimuladorStore();
  const [loading, setLoading] = useState(false);
  
  const g = genetica || {
    padre1: 'AaBb',
    padre2: 'AaBb',
    poblacionF1: [],
    tamanioMuestra: 100,
    status: 'idle'
  };

  const { padre1, padre2, poblacionF1, status } = g;

  useEffect(() => {
    if (status === 'success' && setShowSuccess) {
      setShowSuccess(true);
    }
  }, [status, setShowSuccess]);

  const stats = useMemo(() => {
    if (!poblacionF1.length) return null;
    const totals = { amarillas: 0, verdes: 0, lisas: 0, rugosas: 0 };
    poblacionF1.forEach(gen => {
      if (gen.includes('A')) totals.amarillas++; else totals.verdes++;
      if (gen.includes('B')) totals.lisas++; else totals.rugosas++;
    });
    return totals;
  }, [poblacionF1]);

  const handleCruce = () => {
    setLoading(true);
    setTimeout(() => {
      generarF1();
      setLoading(false);
    }, 1500);
  };

  const traits = [
    { label: 'COLOR', dominant: 'A (Amarillo)', recessive: 'a (Verde)', color: '#fbbf24' },
    { label: 'FORMA', dominant: 'B (Liso)', recessive: 'b (Rugoso)', color: '#22c55e' }
  ];

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020617] font-['Outfit']">
      
      {/* HUD SUPERIOR DIAMOND */}
      <div className="absolute top-6 left-0 right-0 z-[200] px-10 flex justify-between items-center pointer-events-none">
         <div className="flex items-center gap-3 bg-indigo-600/90 backdrop-blur-xl border-2 border-white/40 px-6 py-2 rounded-full shadow-2xl">
            <Dna size={16} className="text-white animate-pulse" />
            <span className="text-xs font-black text-white uppercase tracking-[0.2em]">SISTEMA DE HIBRIDACIÓN DIAMOND v5.2</span>
         </div>

         <div className="flex gap-4 pointer-events-auto">
            <button onClick={() => resetB5()} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 px-6 py-2 rounded-full backdrop-blur-md transition-all group">
               <RotateCcw size={16} className="text-white/60 group-hover:rotate-180 transition-transform duration-500" />
               <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Reiniciar Genoma</span>
            </button>
         </div>
      </div>

      {/* ESCENA 3D */}
      <div className="absolute inset-0 z-0">
        <Genetica3DScene padre1={padre1} padre2={padre2} f1={poblacionF1} status={status} />
      </div>

      {/* UI INTERACTIVA */}
      <div className="absolute inset-0 z-10 pointer-events-none p-10 flex flex-col justify-between">
        
        <div className="flex justify-between items-start pt-12">
           {/* Panel de Control Principal */}
           <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-black/80 backdrop-blur-3xl border-l-8 border-indigo-500 p-8 rounded-r-[3rem] shadow-2xl max-w-md pointer-events-auto border-y border-white/5">
              <div className="flex items-center gap-3 mb-2"><Sparkles className="text-indigo-400" size={20} /><span className="text-xs font-black text-indigo-400 uppercase tracking-[0.4em]">Laboratorio de Herencia</span></div>
              <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none mb-4">Cruce de<br/>Variedades</h2>
              
              <div className="space-y-6">
                 {/* Leyenda de Rasgos */}
                 <div className="grid grid-cols-2 gap-2 bg-white/5 p-4 rounded-2xl border border-white/10">
                    {traits.map(t => (
                      <div key={t.label} className="space-y-1">
                         <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{t.label}</span>
                         <div className="flex flex-col text-[10px] font-bold">
                            <span className="text-white">Dom: {t.dominant}</span>
                            <span className="text-white/40">Rec: {t.recessive}</span>
                         </div>
                      </div>
                    ))}
                 </div>

                 <div className="space-y-4">
                    <div className="flex flex-col gap-3">
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Selección Genotípica</span>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <span className="text-[9px] font-bold text-indigo-400">PADRE P1</span>
                             <select value={padre1} onChange={(e) => setGenetica({ padre1: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-white outline-none focus:border-indigo-500 transition-all">
                                {['AABB', 'AaBb', 'aabb', 'AAbb', 'aaBB'].map(g => <option key={g} value={g} className="bg-[#020617]">{g}</option>)}
                             </select>
                          </div>
                          <div className="space-y-2">
                             <span className="text-[9px] font-bold text-pink-400">PADRE P2</span>
                             <select value={padre2} onChange={(e) => setGenetica({ padre2: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-black text-white outline-none focus:border-pink-500 transition-all">
                                {['AABB', 'AaBb', 'aabb', 'AAbb', 'aaBB'].map(g => <option key={g} value={g} className="bg-[#020617]">{g}</option>)}
                             </select>
                          </div>
                       </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleCruce}
                      disabled={loading}
                      className={`w-full py-6 rounded-3xl flex items-center justify-center gap-4 shadow-2xl border-b-4 transition-all relative overflow-hidden ${loading ? 'bg-indigo-900/50 border-indigo-900' : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-800'}`}
                    >
                       {loading ? (
                         <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-lg font-black text-white uppercase italic tracking-widest">Secuenciando...</span>
                         </div>
                       ) : (
                         <>
                            <Zap size={24} className="text-white" fill="white" />
                            <span className="text-lg font-black text-white uppercase italic tracking-widest text-shadow-lg">Ejecutar Hibridación</span>
                         </>
                       )}
                    </motion.button>
                 </div>
              </div>
           </motion.div>

           {/* Info Tip Contextual */}
           <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-indigo-900/40 backdrop-blur-xl border-r-8 border-indigo-500 p-6 rounded-l-3xl shadow-2xl max-w-xs">
              <div className="flex items-center gap-2 mb-3"><Info size={16} className="text-indigo-400" /><span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Guía de Mendel</span></div>
              <p className="text-xs text-white/80 leading-relaxed font-medium italic">
                "Si un progenitor es homocigoto dominante (AA), toda su descendencia heredará el rasgo Amarillo, sin importar el otro padre. ¡Eso es la Ley de Uniformidad!"
              </p>
           </motion.div>
        </div>

        {/* Panel de Resultados Premium */}
        <AnimatePresence>
           {status === 'success' && stats && (
              <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full flex justify-center pointer-events-auto pb-6">
                 <div className="bg-black/90 backdrop-blur-3xl rounded-[3.5rem] border-2 border-white/10 p-10 shadow-[0_0_100px_rgba(79,70,229,0.2)] flex items-center gap-16">
                    
                    <div className="flex gap-10">
                       <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_30px_rgba(251,191,36,0.4)] flex items-center justify-center border-4 border-white/20">
                             <Layers size={24} className="text-white" />
                          </div>
                          <div className="text-center">
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Semillas Amarillas</span>
                             <span className="text-3xl font-black text-white tabular-nums">{stats.amarillas}%</span>
                          </div>
                       </div>
                       <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center border-4 border-white/20">
                             <Layers size={24} className="text-white" />
                          </div>
                          <div className="text-center">
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Semillas Verdes</span>
                             <span className="text-3xl font-black text-white tabular-nums">{stats.verdes}%</span>
                          </div>
                       </div>
                    </div>
                    
                    <div className="w-px h-20 bg-white/10" />

                    <div className="flex gap-10">
                       <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-3xl bg-white/5 border-2 border-white/20 flex flex-col items-center justify-center shadow-xl">
                             <span className="text-[10px] font-black text-white">LISA</span>
                          </div>
                          <div className="text-center">
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Fenotipo Liso</span>
                             <span className="text-3xl font-black text-white tabular-nums">{stats.lisas}%</span>
                          </div>
                       </div>
                       <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex flex-col items-center justify-center shadow-xl">
                             <span className="text-[8px] font-black text-white/60">RUGOSA</span>
                          </div>
                          <div className="text-center">
                             <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Fenotipo Rugoso</span>
                             <span className="text-3xl font-black text-white tabular-nums">{stats.rugosas}%</span>
                          </div>
                       </div>
                    </div>

                 </div>
              </motion.div>
           )}
        </AnimatePresence>
      </div>

    </div>
  );
}
