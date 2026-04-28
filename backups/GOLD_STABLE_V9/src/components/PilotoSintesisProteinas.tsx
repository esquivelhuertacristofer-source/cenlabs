import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Dna, Activity, Info, Zap, AlertTriangle, Wind, Ship, Factory } from 'lucide-react';

export default function PilotoSintesisProteinas() {
  const { sintesis } = useSimuladorStore();
  const { fase, adnPlantilla, arnMensajero, proteina, currentIndex, lastAddedBase, isCorrect, errores } = sintesis;
  
  const [showNucleusTransition, setShowNucleusTransition] = useState(false);

  // Efecto de transición de fase
  useEffect(() => {
    if (fase === 'traduccion') {
       setShowNucleusTransition(true);
       const timer = setTimeout(() => setShowNucleusTransition(false), 2000);
       return () => clearTimeout(timer);
    }
  }, [fase]);

  return (
    <div className={`w-full h-full relative overflow-hidden transition-colors duration-1000 ${fase === 'transcripcion' ? 'bg-[#1a1c2c] bg-radial-at-c from-[#302c59] to-[#1a1c2c]' : 'bg-[#0f172a] bg-radial-at-c from-[#1e293b] to-[#0f172a]'}`}>
      
      {/* Elementos de Fondo (Núcleo vs Citoplasma) */}
      <AnimatePresence>
        {fase === 'transcripcion' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(#8b5cf6 0.5px, transparent 0.5px)', backgroundSize: '40px 40px' }}
          />
        )}
      </AnimatePresence>

      {/* RENDERIZADO POR FASE */}
      <div className="w-full h-full flex flex-col items-center justify-center p-12">
        
        {fase === 'transcripcion' ? (
          <div className="w-full flex flex-col items-center gap-12">
            <h2 className="text-white/20 font-black text-6xl absolute top-12 left-12 pointer-events-none tracking-tighter uppercase italic select-none">Núcleo</h2>
            
            {/* Burbuja de Transcripción */}
            <div className="relative flex flex-col items-center">
              {/* Hebra ADN 1 (Superior) */}
              <div className="flex gap-1">
                {adnPlantilla.split('').map((base, i) => (
                  <motion.div 
                    key={i}
                    animate={{ y: i === arnMensajero.length ? -40 : 0 }}
                    className={`w-12 h-16 rounded-t-xl flex items-center justify-center font-black text-xs text-white ${
                      i < arnMensajero.length ? 'bg-slate-700/50' : (i === arnMensajero.length ? 'bg-[#8b5cf6]' : 'bg-slate-800')
                    }`}
                  >
                    {base}
                  </motion.div>
                ))}
              </div>

              {/* Centro: Espacio de acoplamiento */}
              <div className="h-24 w-full flex items-center">
                 <AnimatePresence mode="wait">
                    {lastAddedBase && (
                       <motion.div
                         key={arnMensajero.length + lastAddedBase}
                         initial={{ y: 200, opacity: 0, scale: 0.5 }}
                         animate={{ y: 0, opacity: 1, scale: 1 }}
                         exit={{ x: -100, opacity: 0 }}
                         className={`mx-auto w-12 h-12 rounded-xl flex items-center justify-center font-black text-white shadow-lg ${isCorrect ? 'bg-[#219EBC]' : 'bg-rose-500 animate-shake'}`}
                       >
                          {lastAddedBase}
                       </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              {/* Hebra ADN Complementaria (Inferior - Solo visual para profundidad) */}
              <div className="flex gap-1 opacity-20">
                {adnPlantilla.split('').map((base, i) => {
                  const comp: Record<string, string> = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
                  return (
                    <motion.div 
                      key={i}
                      animate={{ y: i === arnMensajero.length ? 40 : 0 }}
                      className="w-12 h-16 rounded-b-xl bg-slate-800 flex items-center justify-center font-black text-xs"
                    >
                      {comp[base]}
                    </motion.div>
                  );
                })}
              </div>

              {/* Hebra mRNA Creciendo (Abstracción) */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 flex gap-1 pointer-events-none">
                 {arnMensajero.split('').map((base, i) => (
                   <motion.div
                     key={i}
                     initial={{ scale: 0 }} animate={{ scale: 1 }}
                     className="w-12 h-6 bg-[#219EBC] border-x border-cyan-300/30 first:rounded-l-full last:rounded-r-full"
                   />
                 ))}
              </div>
            </div>

            <div className="mt-20 flex gap-4 items-center bg-white/5 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md">
               <Info size={16} className="text-cyan-400" />
               <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">A → U | T → A | C → G | G → C</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <h2 className="text-white/20 font-black text-6xl absolute top-12 left-12 pointer-events-none tracking-tighter uppercase italic select-none">Citoplasma</h2>
            
            {/* EL RIBOSOMA (Máquina de ensamblaje) */}
            <div className="relative w-full max-w-4xl flex items-center justify-center">
               
               {/* Subunidad Grande (Background) */}
               <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                 className="absolute -top-40 w-96 h-64 bg-slate-800/80 rounded-[5rem] border-4 border-slate-700 flex items-center justify-around p-8 backdrop-blur-xl"
               >
                  <div className="w-24 h-24 bg-slate-900/50 rounded-full flex flex-col items-center justify-center border-2 border-emerald-500/20">
                    <span className="text-[8px] font-black text-emerald-500 uppercase">Sitio E</span>
                  </div>
                  <div className="w-32 h-32 bg-slate-900/50 rounded-full flex flex-col items-center justify-center border-2 border-emerald-500/40">
                    <span className="text-[8px] font-black text-emerald-400 uppercase">Sitio P</span>
                  </div>
                  <div className="w-24 h-24 bg-slate-900/50 rounded-full flex flex-col items-center justify-center border-2 border-emerald-500/20">
                    <span className="text-[8px] font-black text-emerald-500 uppercase">Sitio A</span>
                  </div>
               </motion.div>

               {/* La Hebra de mRNA pasando */}
               <div className="relative w-full h-24 bg-emerald-500/20 rounded-full border border-emerald-500/30 flex items-center overflow-hidden z-10 px-[33%]">
                  <motion.div 
                    animate={{ x: -currentIndex * 48 }}
                    className="flex gap-1"
                  >
                    {arnMensajero.split('').map((base, i) => (
                      <div key={i} className={`w-12 h-16 flex items-center justify-center font-black text-white border-x border-white/5 ${i >= currentIndex && i < currentIndex + 3 ? 'bg-cyan-500/40 text-cyan-200' : 'bg-slate-900/40'}`}>
                        {base}
                      </div>
                    ))}
                  </motion.div>
               </div>

               {/* Subunidad Pequeña (Foreground) */}
               <motion.div 
                 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                 className="absolute -bottom-20 w-[500px] h-32 bg-[#219EBC]/10 border-4 border-[#219EBC]/40 rounded-full backdrop-blur-sm z-20"
               />

               {/* tRNA animado volando (Simulado al avanzar) */}
               <AnimatePresence>
                 {currentIndex > 0 && (
                   <motion.div
                     key={currentIndex}
                     initial={{ y: -300, x: 200, opacity: 0 }}
                     animate={{ y: -100, x: 0, opacity: 1 }}
                     exit={{ opacity: 0, scale: 0.5 }}
                     className="absolute z-30"
                   >
                     <div className="w-12 h-32 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center border-4 border-white">
                           <Zap size={20} className="text-white" />
                        </div>
                        <div className="h-16 w-1 hover:w-2 bg-emerald-500/50" />
                        <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-[8px] font-black text-white/50 border border-white/10 uppercase">
                           tRNA
                        </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

            {/* Proteína Creciendo (Polipéptido) */}
            <div className="mt-40 flex items-center gap-2 h-20">
              {proteina.map((aa, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="group relative"
                >
                  <div 
                    className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center shadow-lg relative overflow-hidden"
                    style={{ backgroundColor: aa.color }}
                  >
                     <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent pointer-events-none" />
                     <span className="text-[7px] font-black text-white uppercase tracking-tighter text-center px-1">{aa.name}</span>
                  </div>
                  {i < proteina.length - 1 && (
                     <div className="absolute top-1/2 -right-3 w-4 h-1 bg-white/20 -translate-y-1/2" />
                  )}
                </motion.div>
              ))}
              {proteina.length > 0 && <Wind className="text-white/20 animate-pulse ml-4" size={40} />}
            </div>
          </div>
        )}
      </div>

      {/* Efecto de Flash Nuclear (Transición) */}
      <AnimatePresence>
        {showNucleusTransition && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center"
          >
             <motion.div 
               animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}
               className="text-[#023047] font-black text-2xl uppercase tracking-[0.5em]"
             >
                Viaje al Citoplasma...
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Telemetría Quickview (Esquina superior derecha) */}
      <div className="absolute top-8 right-8 flex flex-col gap-3">
         <div className="bg-black/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-4">
            <div className="flex flex-col">
               <span className="text-[10px] font-black text-white/40 uppercase">Código Genético</span>
               <span className="text-xl font-mono font-black text-white tracking-widest uppercase">
                  {fase === 'transcripcion' ? adnPlantilla.slice(0, arnMensajero.length) : arnMensajero.slice(currentIndex, currentIndex + 3)}
               </span>
            </div>
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-cyan-400">
               <Dna size={24} />
            </div>
         </div>
      </div>
    </div>
  );
};
