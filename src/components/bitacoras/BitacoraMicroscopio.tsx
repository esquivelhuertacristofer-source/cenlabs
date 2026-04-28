"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Microscope, Sun, Camera, RotateCcw, ZoomIn, Layers, Droplet, Move, Crosshair, ChevronRight,
  Maximize2, ZoomOut, Settings2, Lightbulb, Focus
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { OBJECTIVES, calculateAbbeLimit, calculateTotalMagnification } from '@/utils/opticEngine';

export default function BitacoraMicroscopio({ onValidate }: { onValidate?: () => void }) {
  const { 
    microscopio, setMicroscopio, generarSemillaB1, validarB1, resetB1,
    tomarCaptura
  } = useSimuladorStore();
  
  const { 
    muestra = 'vegetal', objetivoMag = 4, enfoqueZ = 0, focoIdealZ = 50, iluminacion = 50, 
    diafragmaIris = 100, aceiteInmersionAplicado = false, posicionX = 0, posicionY = 0,
    status, magnificacionVerified, abbeVerified, capturas = []
  } = microscopio || {};

  const [conclusionText, setConclusionText] = useState("");
  const [magInput, setMagInput] = useState('');
  const [abbeInput, setAbbeInput] = useState('');

  const safeObjMag = (OBJECTIVES[objetivoMag as keyof typeof OBJECTIVES] ? objetivoMag : 4) as keyof typeof OBJECTIVES;
  const curObj = OBJECTIVES[safeObjMag];

  const quantumMsg = "Ajusta la iluminación Köhler y el enfoque micrométrico para observar los orgánulos. Recuerda que para el objetivo de 100x es obligatorio aplicar aceite de inmersión para evitar la refracción del aire.";

  const handleCapture = () => {
    const url = muestra === 'vegetal' ? '/assets/bio/plant_cells.png' : 
                muestra === 'animal' ? '/assets/bio/animal_cells.png' :
                muestra === 'bacteria' ? '/assets/bio/bacteria_sample.png' :
                '/assets/bio/nerve_sample.png';
    tomarCaptura(url);
    audio.playPop();
  };

  const handleVerifyCalculations = () => {
    const realMag = calculateTotalMagnification(curObj.mag);
    const realAbbe = calculateAbbeLimit(curObj.na, curObj.mag === 100, aceiteInmersionAplicado);

    const parsedMag = parseInt(magInput);
    const parsedAbbe = parseFloat(abbeInput);

    const magOk = parsedMag === realMag;
    const abbeOk = Math.abs(parsedAbbe - realAbbe) < 2.0;

    if (magOk && abbeOk) {
      setMicroscopio({ magnificacionVerified: true, abbeVerified: true });
      audio.playSuccess();
    } else {
      audio.playError();
      // No alert here, Dr. Quantum can handle feedback via pose or audio if needed, 
      // but for simple calculation error, the red flash/audio is enough or a local toast.
    }
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const isFocused = Math.abs(enfoqueZ - focoIdealZ) <= (objetivoMag === 100 ? 1 : objetivoMag === 40 ? 3 : 8);
  const canValidate = status === 'success' && wordCount >= 30 && magnificacionVerified;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-emerald-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
             <span className="text-[10px] font-black text-emerald-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Óptica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el manejo del revólver, el enfoque y la resolución de Abbe.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Óptico
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-emerald-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isFocused ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isFocused ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Planicidad de Campo
                  </span>
                  <span className="text-xs font-bold text-white">
                     {isFocused ? '✓ Enfoque Crítico Alcanzado' : '... Calibrando Micrométrico'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isFocused ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${iluminacion > 60 && iluminacion < 95 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${iluminacion > 60 && iluminacion < 95 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Sincronía Köhler
                  </span>
                  <span className="text-xs font-bold text-white">
                     {iluminacion > 60 && iluminacion < 95 ? '✓ Iluminación Optimizada' : '... Ajustando Reóstato'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${iluminacion > 60 && iluminacion < 95 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE TELEMETRÍA ÓPTICA */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Protocolo de Análisis</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cálculos de Resolución</p>
          </div>
        </div>

        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Magnificación Total</label>
                 <input type="number" value={magInput} onChange={e => setMagInput(e.target.value)} placeholder="Ej: 400" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-black text-[#023047] outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Límite Abbe (nm)</label>
                 <input type="number" step="0.1" value={abbeInput} onChange={e => setAbbeInput(e.target.value)} placeholder="Ej: 220" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-black text-[#023047] outline-none focus:border-emerald-500" />
              </div>
           </div>

           <button 
             onClick={handleVerifyCalculations}
             className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${magnificacionVerified ? 'bg-emerald-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
           >
             {magnificacionVerified ? 'Telemetría Validada' : 'Sincronizar Óptica'}
           </button>
        </div>
      </div>

      {/* GALERÍA DE MICROGRAFÍAS */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <Camera size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Banco de Capturas</span>
             </div>
             <button onClick={handleCapture} className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase rounded-full hover:bg-emerald-600 transition-colors">Nueva Captura</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
             {capturas.length > 0 ? capturas.map((cap, i) => (
                <div key={i} className="aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative group">
                   <div className="relative w-full h-full">
                     <Image 
                       src={cap} 
                       alt="micro" 
                       fill
                       className="object-cover grayscale group-hover:grayscale-0 transition-all" 
                     />
                   </div>
                   <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
             )) : (
                <div className="col-span-3 py-10 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center opacity-30">
                   <Camera size={30} className="text-slate-300" />
                   <span className="text-[8px] font-black uppercase mt-2">Sin micrografías</span>
                </div>
             )}
          </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Microscópico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué es el límite de resolución de Abbe y por qué el uso de aceite de inmersión mejora la resolución en objetivos de alta magnificación..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-emerald-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={() => { resetB1(); setConclusionText(""); audio.playPop(); }}
          className="w-14 h-14 bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { 
            if (onValidate) onValidate();
            else {
              if (validarB1()) audio.playSuccess();
              else audio.playError();
            }
          }}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {canValidate ? 'Misión Certificada' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}
