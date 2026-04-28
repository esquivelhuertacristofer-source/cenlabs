"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Zap, Activity, Info, FlaskConical, MousePointer2, AlertCircle, ShieldCheck, Battery, RefreshCcw, Box, ArrowRightLeft } from 'lucide-react';
import Galvanic3DScene from './simuladores/qmi09/Galvanic3DScene';
import { audio } from '@/utils/audioEngine';

const METALES_CONFIG: Record<string, { label: string; color: string; pot: number; desc: string }> = {
  Zn: { label: "Zinc (Zn)", color: "#94A3B8", pot: -0.76, desc: "Metal gris mate. Ánodo común en pilas alcalinas." },
  Cu: { label: "Cobre (Cu)", color: "#B45309", pot: 0.34, desc: "Metal rojizo brillante. Excelente conductor." },
  Ag: { label: "Plata (Ag)", color: "#E2E8F0", pot: 0.80, desc: "Metal blanco brillante. Muy noble." },
  Mg: { label: "Magnesio (Mg)", color: "#475569", pot: -2.37, desc: "Metal gris oscuro. Muy reactivo." }
};

export default function PilotoCeldasGalvanicas({ isWorktableDark = true, isProfesor = false }: { isWorktableDark?: boolean; isProfesor?: boolean }) {
  const { celda, setMetalVaso, togglePuenteSalino, toggleCables, generarSemillaP9 } = useSimuladorStore();
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null);
  const [hoveredMetal, setHoveredMetal] = useState<string | null>(null);

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
      audio?.playPop();
    }
  };

  const isCircuitComplete = celda.vasoIzq && celda.vasoDer && celda.puenteSalino && celda.cablesConectados;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden font-['Outfit'] bg-[#010409] text-white">
      
      {/* ── ESCENARIO 3D (MOTOR DIAMOND STATE) ── */}
      <div className="absolute inset-0 z-0">
        <Galvanic3DScene 
          metalIzq={celda.vasoIzq}
          metalDer={celda.vasoDer}
          puenteSalino={celda.puenteSalino}
          cablesConectados={celda.cablesConectados}
          voltaje={celda.voltaje}
        />
      </div>

      {/* ── CAPA DE INTERFAZ HUD DIAMOND ── */}
      <div className="absolute inset-0 z-10 pointer-events-none p-10 flex flex-col justify-between">
        
        {/* Superior: Status y Info Estándar */}
        <div className="flex justify-between items-start">
           <motion.div 
             initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
             className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] pointer-events-auto shadow-2xl"
           >
              <div className="flex items-center gap-3 mb-2">
                 <div className={`w-2 h-2 rounded-full animate-pulse ${isCircuitComplete ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-500'}`} />
                 <span className="text-[10px] font-black text-[#8ECAE6] uppercase tracking-widest">Protocolo Galvánico v4.2</span>
              </div>
              <div className="flex flex-col gap-1">
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Integridad del Circuito</span>
                 <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i <= (celda.puenteSalino ? 3 : 0) + (celda.cablesConectados ? 2 : 0) ? 'bg-cyan-500 shadow-[0_0_5px_rgba(6,182,212,0.5)]' : 'bg-slate-800'}`} />
                    ))}
                 </div>
              </div>
           </motion.div>

           <motion.div 
             initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
             className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] pointer-events-auto text-right shadow-2xl"
           >
              <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Molaridad del Electrolito</div>
              <div className="text-2xl font-black text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">1.00 <span className="text-xs text-slate-500">M [std]</span></div>
              <div className="text-[8px] font-bold text-slate-500 mt-2 tracking-widest uppercase">25°C | 1 atm | STP</div>
           </motion.div>
        </div>

        {/* CHECKLIST HUD (DIAMOND STANDARD) */}
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[500px] pointer-events-none">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} className="animate-pulse" /> Estado del Generador
              </span>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest italic">Electro-Kinetic HUD</span>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border transition-all ${celda.vasoIzq && celda.vasoDer ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[8px] font-black uppercase text-white/40 mb-1">Electrodos</div>
                <div className={`text-xs font-black italic ${celda.vasoIzq && celda.vasoDer ? 'text-emerald-400' : 'text-white'}`}>{celda.vasoIzq && celda.vasoDer ? 'MONTADOS' : 'PENDIENTE'}</div>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${celda.puenteSalino ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[8px] font-black uppercase text-white/40 mb-1">Puente Salino</div>
                <div className={`text-xs font-black italic ${celda.puenteSalino ? 'text-emerald-400' : 'text-white'}`}>{celda.puenteSalino ? 'ACTIVO' : 'DISCONECTO'}</div>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${celda.cablesConectados ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[8px] font-black uppercase text-white/40 mb-1">Cables / Carga</div>
                <div className={`text-xs font-black italic ${celda.cablesConectados ? 'text-emerald-400' : 'text-white'}`}>{celda.cablesConectados ? 'CERRADO' : 'ABIERTO'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* GIANT TELEMETRY: VOLTAGE (THE DIAMOND PIECE) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pointer-events-none">
           <AnimatePresence>
             {isCircuitComplete && (
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                 className="flex flex-col items-center"
               >
                 <motion.div 
                   animate={{ 
                     color: celda.voltaje > 0 ? '#10b981' : '#f43f5e',
                     textShadow: celda.voltaje > 0 ? '0 0 50px rgba(16,185,129,0.5)' : '0 0 50px rgba(244,63,94,0.5)'
                   }}
                   className="text-[12rem] font-black font-mono leading-none tracking-tighter italic"
                 >
                    {celda.voltaje > 0 ? '+' : ''}{celda.voltaje.toFixed(2)}
                 </motion.div>
                 <div className="px-8 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full text-2xl font-black uppercase tracking-[0.5em] italic">VOLTS (E°cell)</div>
               </motion.div>
             )}
             {!isCircuitComplete && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center opacity-20 grayscale">
                 <div className="text-[8rem] font-black font-mono leading-none tracking-tighter italic text-white/30">0.00</div>
                 <div className="text-sm font-black uppercase tracking-widest text-white/30">CIRCUITO ABIERTO</div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Inferior: Identificadores de Vaso */}
        <div className="flex justify-between items-end px-20 mb-24">
           <AnimatePresence>
             {celda.vasoIzq && (
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Battery size={14} className="text-rose-400" />
                    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Ánodo (-)</span>
                  </div>
                  <div className="text-3xl font-black text-white uppercase italic">{celda.vasoIzq}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">Oxidación Activa</div>
               </motion.div>
             )}
           </AnimatePresence>

           <AnimatePresence>
             {celda.vasoDer && (
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="p-6 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2rem] text-right shadow-2xl">
                  <div className="flex items-center gap-2 justify-end mb-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Cátodo (+)</span>
                    <Battery size={14} className="text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-white uppercase italic">{celda.vasoDer}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">Reducción Activa</div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* ── BANDEJA DE INVENTARIO (DIAMOND DESIGN) ── */}
      <motion.div 
        initial={{ y: 100 }} animate={{ y: 0 }}
        className="absolute bottom-10 z-20 flex items-center gap-8 p-6 bg-slate-950/60 backdrop-blur-3xl rounded-[3.5rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] pointer-events-auto"
      >
        <div className="flex gap-4 pr-8 border-r border-white/10">
           {celda.seedMetales.map((m) => (
             <button 
               key={m}
               onMouseEnter={() => setHoveredMetal(m)}
               onMouseLeave={() => setHoveredMetal(null)}
               onClick={() => handleMetalClick(m)}
               className={`group relative w-24 h-28 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 border-2 transition-all duration-500 ${selectedMetal === m ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]' : 'bg-slate-900/50 border-white/5 hover:border-white/20'}`}
             >
                <div style={{ backgroundColor: METALES_CONFIG[m].color }} className="w-12 h-12 rounded-2xl shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                <span className="text-[11px] font-black text-white group-hover:text-cyan-400 transition-colors uppercase italic">{m}</span>
                
                {/* Micro-tooltip de potencial */}
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-md text-white text-[9px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 shadow-2xl">
                   E° = {METALES_CONFIG[m].pot > 0 ? '+' : ''}{METALES_CONFIG[m].pot.toFixed(2)} V
                </div>
             </button>
           ))}
        </div>
        
        <div className="flex gap-5">
           <button 
             onClick={() => {
               togglePuenteSalino();
               audio?.playPop();
               if (!celda.puenteSalino) {
                 audio?.playNotification();
               }
             }}
             className={`w-24 h-28 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 border-2 transition-all duration-500 ${celda.puenteSalino ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-slate-900/50 border-white/5 hover:border-white/20'}`}
           >
              <div className={`p-3 rounded-2xl ${celda.puenteSalino ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                <RefreshCcw size={24} className={celda.puenteSalino ? 'animate-spin-slow' : ''} />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Puente</span>
           </button>

           <button 
             onClick={() => {
               toggleCables();
               audio?.playPop();
               if (!celda.cablesConectados) {
                 audio?.playNotification();
               }
             }}
             className={`px-10 h-28 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 border-2 transition-all duration-500 ${celda.cablesConectados ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)]' : 'bg-slate-900/50 border-white/5 hover:border-white/20'}`}
           >
              <div className={`p-3 rounded-2xl ${celda.cablesConectados ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                <Zap size={24} />
              </div>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Conectar</span>
           </button>
        </div>
      </motion.div>

      {/* MODAL DE POSICIONAMIENTO DIAMOND */}
      <AnimatePresence>
        {selectedMetal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl pointer-events-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-[#0f172a] p-12 rounded-[4rem] border border-white/10 shadow-2xl text-center max-w-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
              
              <div className="w-32 h-32 mx-auto mb-8 rounded-[2.5rem] flex items-center justify-center shadow-inner relative group transition-transform duration-700 hover:rotate-12" style={{ backgroundColor: METALES_CONFIG[selectedMetal].color }}>
                <span className="text-4xl font-black text-black/30 drop-shadow-lg">{selectedMetal}</span>
                <div className="absolute -bottom-3 -right-3 bg-slate-900 px-4 py-2 rounded-2xl border border-white/10 text-white text-sm font-black shadow-2xl">
                   {METALES_CONFIG[selectedMetal].pot > 0 ? '+' : ''}{METALES_CONFIG[selectedMetal].pot.toFixed(2)}V
                </div>
              </div>

              <h4 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter italic">{METALES_CONFIG[selectedMetal].label}</h4>
              <p className="text-sm text-slate-400 mb-10 leading-relaxed px-4 font-medium opacity-80">{METALES_CONFIG[selectedMetal].desc}</p>
              
              <div className="grid grid-cols-2 gap-5">
                 <button 
                   onClick={() => placeMetal('izq')}
                   className="py-5 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase border border-white/10 transition-all flex items-center justify-center gap-2 hover:border-rose-500/50 hover:text-rose-400"
                 >
                   <ArrowRightLeft size={16} className="rotate-180" /> Ánodo (-)
                 </button>
                 <button 
                   onClick={() => placeMetal('der')}
                   className="py-5 bg-white/5 hover:bg-white/10 text-white rounded-[2rem] text-[10px] font-black uppercase border border-white/10 transition-all flex items-center justify-center gap-2 hover:border-emerald-500/50 hover:text-emerald-400"
                 >
                   Cátodo (+) <ArrowRightLeft size={16} />
                 </button>
                 <button onClick={() => setSelectedMetal(null)} className="col-span-2 py-5 bg-rose-500/10 text-rose-500 rounded-[2rem] text-[10px] font-black uppercase border border-rose-500/20 hover:bg-rose-500/20 transition-all tracking-widest mt-2">Cancelar Operación</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBO DE AYUDA (MODO INSTRUCTOR DIAMOND) */}
      {isProfesor && (
        <div className="absolute top-10 right-10 p-10 bg-gradient-to-br from-[#023047] to-[#0A1121] text-white rounded-[3rem] shadow-2xl max-w-sm animate-in slide-in-from-right duration-700 z-30 border border-cyan-500/30">
           <div className="flex items-center gap-4 mb-6 font-black uppercase tracking-tighter text-lg italic text-cyan-400">
             <div className="p-3 bg-cyan-500/20 rounded-2xl"><Activity size={24} /></div>
             Panel Maestro
           </div>
           <p className="text-xs font-medium opacity-70 leading-relaxed mb-8">
             Reto configurado con: <span className="text-white font-black">{celda.seedMetales.join(' • ')}</span>. 
             <br/><br/>
             Para lograr un <span className="text-cyan-400 font-black">VOLTAJE POSITIVO</span>, el metal con mayor potencial de reducción (E°) debe situarse en el <span className="text-emerald-400 font-black">CÁTODO</span>.
           </p>
           <button onClick={generarSemillaP9} className="w-full py-5 bg-cyan-500 text-white rounded-2xl text-[10px] font-black uppercase shadow-[0_10px_30px_rgba(6,182,212,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
             <RefreshCcw size={16} /> Reconfigurar Estación
           </button>
        </div>
      )}

      {/* Decoración HUD Extra */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-[5]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '60px 60px' }} />
    </div>
  );
}
