import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Binary, Grid, Info, Box } from 'lucide-react';

export default function PilotoGenetica() {
  const { genetica } = useSimuladorStore();
  const { padre1, padre2, poblacionF1 } = genetica;

  // Lógica del Cuadro de Punnett
  const punnett = useMemo(() => {
    const getGametos = (gen: string) => [gen[0]+gen[2], gen[0]+gen[3], gen[1]+gen[2], gen[1]+gen[3]];
    const g1 = getGametos(padre1);
    const g2 = getGametos(padre2);
    
    return g1.map(c1 => g2.map(c2 => {
        const a = [c1[0], c2[0]].sort().join('');
        const b = [c1[1], c2[1]].sort().join('');
        const isCyan = a.includes('A');
        const isDobles = b.includes('B');
        return { 
            gen: a + b, 
            color: isCyan ? '#219EBC' : '#FF006E',
            wings: isDobles ? 'double' : 'simple'
        };
    }));
  }, [padre1, padre2]);

  return (
    <div className="w-full h-full bg-[#0a0c10] flex flex-col p-8 overflow-hidden">
      
      {/* 1. CUADRO DE PUNNETT (Sección Teórica) */}
      <div className="flex-none mb-10">
         <div className="flex items-center gap-3 mb-4">
            <Grid size={18} className="text-slate-500" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Predicción Probabilística ($16$ Combinaciones)</span>
         </div>
         
         <div className="grid grid-cols-5 gap-2 max-w-xl mx-auto">
            <div /> {/* Espacio vacío */}
            {punnett[0].map((_, i) => (
               <div key={i} className="text-center text-[10px] font-black text-white/40 p-2">
                  {(padre2[0]+padre2[1]+padre2[2]+padre2[3])[i]}
               </div>
            ))}
            {punnett.map((row, i) => (
               <React.Fragment key={i}>
                  <div className="flex items-center justify-center text-[10px] font-black text-white/40">
                     {(padre1[0]+padre1[1]+padre1[2]+padre1[3])[i]}
                  </div>
                  {row.map((cell, j) => (
                     <div 
                       key={j} 
                       className="aspect-square bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center p-1 transition-all hover:bg-white/10"
                       style={{ boxShadow: `inset 0 0 10px ${cell.color}11` }}
                     >
                        <span className="text-[8px] font-mono font-bold text-white mb-1">{cell.gen}</span>
                        <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ color: cell.color, backgroundColor: cell.color }} />
                     </div>
                  ))}
               </React.Fragment>
            ))}
         </div>
      </div>

      {/* 2. TERRARIO EMPÍRICO (Wow Factor) */}
      <div className="flex-1 relative bg-[#05070a] border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-inner">
         <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #219EBC 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
         
         {/* Vidrio de la vitrina */}
         <div className="absolute inset-0 z-20 pointer-events-none border-[12px] border-black/40 rounded-[3rem] shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]" />
         
         {/* Enjambre Bioluminiscente */}
         <div className="absolute inset-8 z-10">
            <AnimatePresence>
               {poblacionF1.map((bug) => (
                  <motion.div
                    key={bug.id}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute group"
                    style={{ left: `${bug.x}%`, top: `${bug.y}%` }}
                  >
                     <InsectSVG fenotipo={bug.fenotipo} />
                     
                     {/* Label flotante al hover */}
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[8px] font-mono px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none">
                        {bug.genotipo}
                     </div>
                  </motion.div>
               ))}
            </AnimatePresence>
         </div>

         {/* Etiquetas de Estado */}
         <div className="absolute bottom-8 right-8 z-30 flex flex-col gap-2">
            <div className="bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
               <span className="text-[10px] font-black text-white/60 uppercase">Ecosistema Activo: {poblacionF1.length} individuos</span>
            </div>
         </div>
      </div>
    </div>
  );
};

const InsectSVG = ({ fenotipo }: { fenotipo: string }) => {
  const isCyan = fenotipo.includes('cyan');
  const isDobles = fenotipo.includes('dobles');
  const color = isCyan ? '#219EBC' : '#FF006E';

  return (
    <svg width="24" height="24" viewBox="0 0 100 100" className="drop-shadow-[0_0_8px_currentColor]" style={{ color }}>
      <motion.g 
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: Math.random() * 2 }}
      >
        {/* Cuerpo */}
        <ellipse cx="50" cy="55" rx="20" ry="30" fill="currentColor" opacity="0.8" />
        <ellipse cx="50" cy="25" rx="12" ry="12" fill="currentColor" />
        
        {/* Alas */}
        {isDobles ? (
          <>
            <motion.path 
              animate={{ rotate: [-20, -40, -20] }}
              d="M35,45 Q10,20 10,45 Q10,70 35,55" fill="white" opacity="0.3" 
            />
            <motion.path 
              animate={{ rotate: [20, 40, 20] }}
              d="M65,45 Q90,20 90,45 Q90,70 65,55" fill="white" opacity="0.3" 
            />
            <motion.path 
              animate={{ rotate: [-10, -30, -10] }}
              d="M35,65 Q5,50 5,65 Q5,80 35,75" fill="white" opacity="0.2" 
            />
            <motion.path 
              animate={{ rotate: [10, 30, 10] }}
              d="M65,65 Q95,50 95,65 Q95,80 65,75" fill="white" opacity="0.2" 
            />
          </>
        ) : (
          <>
            <path d="M40,50 Q20,40 20,55 Q20,70 40,65" fill="white" opacity="0.3" />
            <path d="M60,50 Q80,40 80,55 Q80,70 60,65" fill="white" opacity="0.3" />
          </>
        )}

        {/* Antenas */}
        <path d="M45,15 Q40,5 30,5" stroke="currentColor" fill="none" strokeWidth="2" />
        <path d="M55,15 Q60,5 70,5" stroke="currentColor" fill="none" strokeWidth="2" />
      </motion.g>
    </svg>
  );
};
