"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audio } from '@/utils/audioEngine';
import { useSimuladorStore } from '@/store/simuladorStore';
import { calculateTotalMagnification } from '@/utils/opticEngine';
import Microscopio3DScene from './simuladores/bio01/Microscopio3DScene';
import { 
  Camera, Zap, Crosshair, 
  Settings2, Search, Info, Activity,
  Maximize2, Move, Database, Droplets,
  Focus, Gauge, Layers
} from 'lucide-react';

export default function PilotoMicroscopioVirtual() {
  const { microscopio, setMicroscopio, tomarCaptura } = useSimuladorStore();
  const { 
    muestra = 'vegetal', objetivoMag = 4, iluminacion = 80, 
    posicionX = 0, posicionY = 0, targetOrganelle,
    enfoqueMacro = 50, enfoqueMicro = 5
  } = microscopio || {};

  const [isScanning, setIsScanning] = useState(false);
  const [identified, setIdentified] = useState(false);

  const totalMag = calculateTotalMagnification(objetivoMag as any);
  
  // LÓGICA DE ENFOQUE REALISTA (Suma de Macro + Micro)
  const enfoqueTotal = useMemo(() => {
    return enfoqueMacro + (enfoqueMicro / 10);
  }, [enfoqueMacro, enfoqueMicro]);

  // El punto de enfoque ideal es 50.5
  const blurSurface = Math.abs(enfoqueTotal - 50.5) * 0.8; 

  const handleScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    audio?.playLoading();
    setTimeout(() => {
      setIsScanning(false);
      if (blurSurface < 0.5) {
        setIdentified(true);
        audio?.playSuccess();
        setTimeout(() => setIdentified(false), 4000);
      } else {
        audio?.playError();
      }
    }, 2000);
  };

  const muestrasDisponibles = [
    { id: 'vegetal', label: 'Corte de Allium Cepa', color: 'bg-emerald-500', icon: '🌱' },
    { id: 'animal', label: 'Mucosa Bucal', color: 'bg-rose-500', icon: '🧬' },
    { id: 'bacteria', label: 'Frotis Bacteriano', color: 'bg-indigo-500', icon: '👾' }
  ];

  return (
    <div className="w-full h-full bg-[#020617] flex font-sans text-white overflow-hidden p-4 gap-4">
      
      {/* ── VISOR ÓPTICO CIENTÍFICO ── */}
      <div className="relative flex-[3] bg-black rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]">
        
        {/* HUD DE TELEMETRÍA (DIAMOND STATE) */}
        <div className="absolute top-10 left-10 z-[60] flex flex-col gap-3 pointer-events-none">
            <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_#10b981]" />
                <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase tracking-[0.3em] text-emerald-400">ANALYZER_ONLINE</span>
                    <span className="text-[8px] text-emerald-500/50 font-bold uppercase tracking-widest">Specimen: {muestra}</span>
                </div>
            </div>
            <div className="h-px w-32 bg-gradient-to-r from-emerald-500/50 to-transparent" />
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
               OPTICAL_MAG: {totalMag}X
            </div>
        </div>

        <div className="relative flex-1 bg-[#050505] overflow-hidden flex items-center justify-center">
            
            {/* ESCENA 3D (LOD DINÁMICO) */}
            <div className="absolute inset-0 z-10 transition-all duration-100" style={{ filter: `blur(${blurSurface}px) contrast(1.1) saturate(1.2)` }}>
                <Microscopio3DScene 
                  isDarkMode={true}
                  muestra={muestra}
                  objetivoMag={objetivoMag}
                  enfoqueZ={enfoqueTotal}
                  posicionX={posicionX}
                  posicionY={posicionY}
                  iluminacion={iluminacion}
                />
            </div>

            {/* Máscara Ocular de Lente Realista */}
            <div className="absolute inset-0 z-50 pointer-events-none shadow-[inset_0_0_400px_rgba(0,0,0,1)] border-[110px] border-black rounded-[4rem]" />
            <div className="absolute inset-0 z-[51] pointer-events-none opacity-20 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
            
            {/* Retícula de Medición */}
            <div className="absolute inset-0 z-40 pointer-events-none opacity-10 flex items-center justify-center">
                <div className="w-[600px] h-[600px] border-[0.5px] border-emerald-500 rounded-full flex items-center justify-center">
                   <div className="w-full h-px bg-emerald-500/30 absolute" />
                   <div className="w-px h-full bg-emerald-500/30 absolute" />
                </div>
            </div>

            <AnimatePresence>
                {identified && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute z-[70] px-12 py-8 bg-black/80 backdrop-blur-3xl border border-emerald-500/50 rounded-[3rem] shadow-[0_0_60px_rgba(16,185,129,0.3)] text-center"
                    >
                        <Layers size={32} className="mx-auto mb-4 text-emerald-400" />
                        <h4 className="text-xl font-black uppercase tracking-[0.4em] text-white">{targetOrganelle || 'Estructura Detectada'}</h4>
                        <div className="mt-4 h-1 w-full bg-emerald-950 rounded-full overflow-hidden">
                           <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1 }} className="h-full bg-emerald-400" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Action Dock (Premium Professional) */}
        <div className="p-10 bg-black/98 border-t border-white/5 flex justify-between items-center z-[80] backdrop-blur-3xl">
            <div className="flex gap-6">
                <button 
                  onClick={handleScan} 
                  className="px-14 py-6 bg-emerald-600 text-white rounded-3xl text-[13px] font-black uppercase tracking-[0.3em] hover:bg-emerald-500 transition-all flex items-center gap-4 shadow-2xl shadow-emerald-500/40 active:scale-95"
                >
                    <Search size={22} /> {isScanning ? 'Procesando...' : 'Analizar Imagen'}
                </button>
                <button 
                  onClick={() => tomarCaptura('')} 
                  className="px-14 py-6 bg-white/5 border border-white/10 rounded-3xl text-[13px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/10 transition-all flex items-center gap-4"
                >
                    <Camera size={22} /> Capturar
                </button>
            </div>
            <div className="text-right">
               <div className="text-[14px] font-black text-emerald-400 tracking-widest">SYSTEM_OPTIMAL</div>
               <div className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.5em]">CEN Optical Precision v9.0</div>
            </div>
        </div>
      </div>

      {/* ── PANEL DE HARDWARE CIENTÍFICO (REALISMO MÁXIMO) ── */}
      <div className="w-[450px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        
        {/* BANCO DE MUESTRAS */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[3rem] p-8 space-y-6">
            <div className="flex justify-between items-center text-[12px] font-black uppercase text-slate-500 tracking-widest">
               <label>Preparación Biológica</label>
               <Database size={16} className="text-indigo-400" />
            </div>
            <div className="grid grid-cols-1 gap-3">
               {muestrasDisponibles.map(m => (
                 <button 
                   key={m.id}
                   onClick={() => { audio?.playPop(); setMicroscopio({ muestra: m.id as any }); }}
                   className={`p-5 rounded-[2rem] flex items-center justify-between border transition-all ${muestra === m.id ? `bg-white/10 border-white/20 shadow-xl` : 'bg-transparent border-white/5 opacity-40 hover:opacity-100'}`}
                 >
                   <div className="flex items-center gap-4">
                      <span className="text-2xl">{m.icon}</span>
                      <div className="text-left">
                         <div className={`text-[12px] font-black uppercase ${muestra === m.id ? 'text-white' : 'text-slate-400'}`}>{m.label}</div>
                         <div className="text-[8px] text-slate-500 font-bold">BIO_REF_{m.id.toUpperCase()}_092</div>
                      </div>
                   </div>
                   {muestra === m.id && <div className={`w-3 h-3 rounded-full ${m.color} shadow-[0_0_10px_currentColor]`} />}
                 </button>
               ))}
            </div>
        </div>

        {/* CONTROLES DE INSTRUMENTACIÓN (DERECHA) */}
        <div className="bg-white/[0.02] border border-white/10 rounded-[3rem] p-10 space-y-12 flex flex-col shadow-2xl">
            
            {/* TORRETA DE OBJETIVOS */}
            <div className="space-y-6">
                <div className="flex justify-between items-center text-[11px] font-black uppercase text-slate-500 tracking-widest">
                   <label>Revólver Portaobjetivos</label>
                   <Settings2 size={16} className="text-blue-400" />
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {[4, 10, 40, 100].map(mag => (
                        <button 
                          key={mag}
                          onClick={() => { audio?.playPop(); setMicroscopio({ objetivoMag: mag as any }); }}
                          className={`py-6 rounded-2xl text-[13px] font-black border transition-all ${objetivoMag === mag ? 'bg-blue-600 border-blue-400 text-white shadow-2xl shadow-blue-500/40 scale-105' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/20'}`}
                        >
                            {mag}x
                        </button>
                    ))}
                </div>
            </div>

            {/* SISTEMA DE ENFOQUE DUAL (MACRO + MICRO) */}
            <div className="space-y-10 pt-8 border-t border-white/5">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                          <Focus size={18} className="text-emerald-400" /> Mandos de Enfoque
                       </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="space-y-3">
                           <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase"><span>Tornillo Macrométrico (Grueso)</span><span>{enfoqueMacro}</span></div>
                           <input type="range" min="0" max="100" value={enfoqueMacro} onChange={e => setMicroscopio({ enfoqueMacro: parseInt(e.target.value) })}
                             className="w-full h-2.5 bg-white/10 rounded-full appearance-none accent-emerald-500 cursor-pointer" />
                        </div>
                        <div className="space-y-3">
                           <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase"><span>Tornillo Micrométrico (Fino)</span><span>{enfoqueMicro}</span></div>
                           <input type="range" min="0" max="10" step="0.1" value={enfoqueMicro} onChange={e => setMicroscopio({ enfoqueMicro: parseFloat(e.target.value) })}
                             className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-emerald-400 cursor-pointer" />
                        </div>
                    </div>
                </div>

                {/* DESPLAZAMIENTO MECÁNICO DE PLATINA */}
                <div className="space-y-8">
                    <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                       <Move size={18} className="text-rose-400" /> Controles de Platina
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <div className="text-[10px] text-slate-500 font-black uppercase text-center">Eje X (Lateral)</div>
                           <div className="flex justify-center">
                              <input type="range" min="-500" max="500" value={posicionX} onChange={e => setMicroscopio({ posicionX: parseInt(e.target.value) })}
                                className="w-32 h-2 bg-white/10 rounded-full appearance-none accent-rose-500 cursor-pointer rotate-0" />
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="text-[10px] text-slate-500 font-black uppercase text-center">Eje Y (Vertical)</div>
                           <div className="flex justify-center">
                              <input type="range" min="-500" max="500" value={posicionY} onChange={e => setMicroscopio({ posicionY: parseInt(e.target.value) })}
                                className="w-32 h-2 bg-white/10 rounded-full appearance-none accent-rose-500 cursor-pointer rotate-0" />
                           </div>
                        </div>
                    </div>
                </div>

                {/* ILUMINACIÓN Y CONDENSADOR */}
                <div className="space-y-4">
                    <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-2"><Droplets size={16} /> Intensidad Lumínica</div>
                        <span className="text-amber-400">{iluminacion}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={iluminacion} onChange={e => setMicroscopio({ iluminacion: parseInt(e.target.value) })}
                      className="w-full h-2.5 bg-white/10 rounded-full appearance-none accent-amber-500 cursor-pointer" />
                </div>
            </div>

            <div className="p-8 bg-blue-500/10 border border-blue-500/20 rounded-[3rem] flex gap-5">
                <Gauge size={24} className="text-blue-400 shrink-0" />
                <p className="text-[11px] font-bold text-blue-300 leading-relaxed uppercase italic">
                    El enfoque micrométrico es crítico en 100x. Ajusta el mando fino para observar estructuras sub-celulares.
                </p>
            </div>
        </div>
      </div>

    </div>
  );
}
