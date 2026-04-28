"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, Activity, Info, FlaskConical, MousePointer2, AlertCircle } from 'lucide-react';

const METALES_CONFIG: Record<string, { label: string; color: string; pot: number; desc: string }> = {
  Zn: { label: "Zinc (Zn)", color: "#94A3B8", pot: -0.76, desc: "Metal gris mate. Ánodo común en pilas alcalinas." },
  Cu: { label: "Cobre (Cu)", color: "#B45309", pot: 0.34, desc: "Metal rojizo brillante. Excelente conductor." },
  Ag: { label: "Plata (Ag)", color: "#E2E8F0", pot: 0.80, desc: "Metal blanco brillante. Muy noble." },
  Mg: { label: "Magnesio (Mg)", color: "#475569", pot: -2.37, desc: "Metal gris oscuro. Muy reactivo." }
};

export default function PilotoCeldasGalvanicas({ isWorktableDark = true, isProfesor = false }: { isWorktableDark?: boolean; isProfesor?: boolean }) {
  const { celda, setMetalVaso, togglePuenteSalino, toggleCables, generarSemillaP9 } = useSimuladorStore();
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null);

  useEffect(() => {
    if (!celda.seedMetales || celda.seedMetales.length === 0) generarSemillaP9();
  }, [celda.seedMetales, generarSemillaP9]);

  const handleMetalClick = (m: string) => {
    setSelectedMetal(m);
  };

  const placeMetal = (vaso: 'izq' | 'der') => {
    if (selectedMetal) {
      setMetalVaso(vaso, selectedMetal);
      setSelectedMetal(null);
    }
  };

  // Lógica de dirección de electrones (Anodo -> Catodo)
  const isAnodoIzq = (celda.vasoIzq && celda.vasoDer) ? METALES_CONFIG[celda.vasoIzq].pot < METALES_CONFIG[celda.vasoDer].pot : true;
  const electronFlowReversed = !isAnodoIzq;

  return (
    <div className={`relative w-full h-full flex flex-col items-center justify-center p-8 transition-colors duration-700 ${isWorktableDark ? 'bg-[#0A1120]' : 'bg-[#F1F5F9]'}`}>
      
      {/* 1. SECCIÓN SUPERIOR: VOLTÍMETRO */}
      <div className="absolute top-10 flex flex-col items-center space-y-4">
        <div className="relative w-64 p-6 bg-slate-900 border-x-[8px] border-t-[8px] border-slate-800 rounded-t-[3rem] shadow-2xl overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Digital Voltmeter v2.0</div>
           <div className={`h-20 bg-black/90 rounded-2xl flex items-center justify-center font-mono text-5xl font-black ${celda.voltaje === 0 ? 'text-slate-800' : (celda.voltaje > 0 ? 'text-green-500' : 'text-red-500')} shadow-inner border border-white/5`}>
              {celda.voltaje.toFixed(2)} <span className="text-xl ml-2 opacity-50 font-sans">V</span>
           </div>
           {/* Bornes */}
           <div className="flex justify-between mt-4 px-4">
              <div className="w-4 h-4 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
              <div className="w-4 h-4 bg-slate-900 rounded-full border border-slate-700" title="Negativo (Común)" />
           </div>
        </div>
      </div>

      {/* 2. ESCENARIO CENTRAL: VASOS Y CABLES */}
      <div className="relative w-full max-w-4xl h-[400px] mt-20 flex justify-around items-end">
        
        {/* SVG PARA CABLES Y ELECTRONES */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          
          {/* Path de los cables */}
          <path id="cable-path" d="M 180 320 L 180 200 L 400 100 L 600 100 L 820 200 L 820 320" fill="none" stroke={celda.cablesConectados ? "#334155" : "transparent"} strokeWidth="4" strokeDasharray="8 4" className="transition-all duration-1000" />
          
          {/* Electrones (Animación CSS) */}
          {celda.voltaje !== 0 && celda.puenteSalino && celda.cablesConectados && (
            <motion.circle r="4" fill="#FACC15" filter="url(#glow)">
              <animateMotion 
                dur="2s" 
                repeatCount="indefinite" 
                path={electronFlowReversed ? "M 820 320 L 820 200 L 600 100 L 400 100 L 180 200 L 180 320" : "M 180 320 L 180 200 L 400 100 L 600 100 L 820 200 L 820 320"} 
              />
            </motion.circle>
          )}
          {celda.voltaje !== 0 && celda.puenteSalino && celda.cablesConectados && (
            <motion.circle r="4" fill="#FACC15" filter="url(#glow)">
              <animateMotion 
                dur="2s" begin="0.6s"
                repeatCount="indefinite" 
                path={electronFlowReversed ? "M 820 320 L 820 200 L 600 100 L 400 100 L 180 200 L 180 320" : "M 180 320 L 180 200 L 400 100 L 600 100 L 820 200 L 820 320"} 
              />
            </motion.circle>
          )}
          {celda.voltaje !== 0 && celda.puenteSalino && celda.cablesConectados && (
            <motion.circle r="4" fill="#FACC15" filter="url(#glow)">
              <animateMotion 
                dur="2s" begin="1.2s"
                repeatCount="indefinite" 
                path={electronFlowReversed ? "M 820 320 L 820 200 L 600 100 L 400 100 L 180 200 L 180 320" : "M 180 320 L 180 200 L 400 100 L 600 100 L 820 200 L 820 320"} 
              />
            </motion.circle>
          )}
        </svg>

        {/* VASO IZQUIERDO */}
        <div className="relative group">
           <div className="w-48 h-64 bg-slate-200/20 backdrop-blur-md border border-white/20 rounded-b-[4rem] rounded-t-xl relative overflow-hidden flex flex-col justify-end">
              <div className="absolute inset-0 bg-blue-400/20 shadow-inner" />
              {/* Electrodo Izq */}
              <AnimatePresence>
                {celda.vasoIzq && (
                   <motion.div 
                     initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
                     style={{ backgroundColor: METALES_CONFIG[celda.vasoIzq].color }}
                     className="w-12 h-56 mx-auto rounded-t-lg shadow-xl relative z-20 flex items-center justify-center"
                   >
                     <span className="text-[10px] font-black uppercase text-white/50 rotate-90">{celda.vasoIzq}</span>
                   </motion.div>
                )}
              </AnimatePresence>
           </div>
           <div className="mt-4 text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Solución Izquierda</span>
           </div>
        </div>

        {/* PUENTE SALINO */}
        <div className="relative h-64 flex flex-col justify-center">
           {celda.puenteSalino ? (
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                <div className="w-48 h-12 border-x-8 border-t-8 border-white/30 rounded-t-full bg-white/10 backdrop-blur-sm -mb-2" />
                <div className="flex justify-between w-48 h-20 px-2">
                   <div className="w-8 h-full bg-white/20 border-x-4 border-white/30" />
                   <div className="w-8 h-full bg-white/20 border-x-4 border-white/30" />
                </div>
                <button onClick={togglePuenteSalino} className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform p-2 bg-red-500 rounded-full text-white"><AlertCircle size={16}/></button>
             </motion.div>
           ) : (
             <div className="w-48 h-32 border-2 border-dashed border-slate-800 rounded-3xl flex items-center justify-center opacity-30">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Sin Puente Salino</span>
             </div>
           )}
        </div>

        {/* VASO DERECHO */}
        <div className="relative group">
           <div className="w-48 h-64 bg-slate-200/20 backdrop-blur-md border border-white/20 rounded-b-[4rem] rounded-t-xl relative overflow-hidden flex flex-col justify-end">
              <div className="absolute inset-0 bg-blue-400/20 shadow-inner" />
              {/* Electrodo Der */}
              <AnimatePresence>
                {celda.vasoDer && (
                   <motion.div 
                     initial={{ y: -100 }} animate={{ y: 0 }} exit={{ y: -100 }}
                     style={{ backgroundColor: METALES_CONFIG[celda.vasoDer].color }}
                     className="w-12 h-56 mx-auto rounded-t-lg shadow-xl relative z-20 flex items-center justify-center"
                   >
                     <span className="text-[10px] font-black uppercase text-white/50 rotate-90">{celda.vasoDer}</span>
                   </motion.div>
                )}
              </AnimatePresence>
           </div>
           <div className="mt-4 text-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Solución Derecha</span>
           </div>
        </div>
      </div>

      {/* 3. BANDEJA DE INVENTARIO */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 p-6 bg-slate-950/80 backdrop-blur-2xl rounded-[3rem] border border-slate-800 shadow-2xl">
        <div className="flex gap-4 pr-6 border-r border-slate-800">
           {celda.seedMetales.map((m) => (
             <button 
               key={m}
               onClick={() => handleMetalClick(m)}
               className={`w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${selectedMetal === m ? 'bg-orange-500/20 border-orange-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}
             >
                <div style={{ backgroundColor: METALES_CONFIG[m].color }} className="w-8 h-8 rounded-lg shadow-inner" />
                <span className="text-[10px] font-black text-white">{m}</span>
             </button>
           ))}
        </div>
        
        <div className="flex gap-4">
           <button 
             onClick={togglePuenteSalino}
             className={`w-16 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${celda.puenteSalino ? 'bg-green-500/20 border-green-500' : 'bg-slate-900 border-slate-800'}`}
           >
              <FlaskConical size={20} className={celda.puenteSalino ? 'text-green-400' : 'text-slate-600'} />
              <span className="text-[9px] font-black uppercase text-slate-400">P.Salino</span>
           </button>
           <button 
             onClick={toggleCables}
             className={`px-6 h-20 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${celda.cablesConectados ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-900 border-slate-800'}`}
           >
              <Zap size={20} className={celda.cablesConectados ? 'text-blue-400' : 'text-slate-600'} />
              <span className="text-[9px] font-black uppercase text-slate-400">Conectar Cables</span>
           </button>
        </div>
      </div>

      {/* MODAL DE POSICIONAMIENTO */}
      <AnimatePresence>
        {selectedMetal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 p-8 rounded-[3rem] border border-slate-800 shadow-2xl text-center max-w-xs">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: METALES_CONFIG[selectedMetal].color }}>
                <span className="text-xl font-black text-white/50">{selectedMetal}</span>
              </div>
              <h4 className="text-lg font-black text-white mb-2 uppercase">{METALES_CONFIG[selectedMetal].label}</h4>
              <p className="text-xs text-slate-400 mb-6">{METALES_CONFIG[selectedMetal].desc}</p>
              
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => placeMetal('izq')} className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase">Vaso Izquierdo</button>
                 <button onClick={() => placeMetal('der')} className="py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[10px] font-black uppercase">Vaso Derecho</button>
                 <button onClick={() => setSelectedMetal(null)} className="col-span-2 py-3 bg-red-900/20 text-red-400 rounded-xl text-[10px] font-black uppercase">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBO DE AYUDA (MODO INSTRUCTOR) */}
      {isProfesor && (
        <div className="absolute top-10 right-10 p-6 bg-[#FB8500] text-white rounded-3xl shadow-xl max-w-xs animate-in slide-in-from-right duration-300">
           <div className="flex items-center gap-2 mb-2 font-black uppercase tracking-tighter text-sm">
             <Info size={18} /> Panel de Control Maestro
           </div>
           <p className="text-xs font-bold opacity-90 leading-relaxed mb-4">Metales asignados: {celda.seedMetales.join(' y ')}. Para lograr voltaje POSITIVO, el metal de mayor reducción debe ir a la DERECHA.</p>
           <button onClick={generarSemillaP9} className="w-full py-3 bg-white/20 rounded-xl text-xs font-black uppercase border border-white/30">Aleatorizar Reto</button>
        </div>
      )}
    </div>
  );
}
