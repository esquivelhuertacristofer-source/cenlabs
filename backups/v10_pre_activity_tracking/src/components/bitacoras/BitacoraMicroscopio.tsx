"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { OBJECTIVES, calculateAbbeLimit, calculateTotalMagnification } from '@/utils/opticEngine';
import { 
  ZoomIn, Sun, Camera, RotateCcw,
  CheckCircle2, Activity, Target, AlignVerticalSpaceAround, Crosshair, BookOpen,
  Grid, Image as ImageIcon, Layers, Move, Droplet, Microscope, ChevronRight, CornerDownRight
} from 'lucide-react';

export default function BitacoraMicroscopio() {
  const { 
    microscopio, setMicroscopio, generarSemillaB1, validarB1, resetB1,
    pasoActual, setPasoActual, bitacoraData, tomarCaptura
  } = useSimuladorStore();
  
  const { 
    muestra = 'vegetal', objetivoMag = 4, enfoqueZ = 0, focoIdealZ = 50, iluminacion = 50, 
    diafragmaIris = 100, aceiteInmersionAplicado = false, posicionX = 0, posicionY = 0,
    status, magnificacionVerified, abbeVerified, capturas = []
  } = microscopio || {};

  const safeObjMag = (OBJECTIVES[objetivoMag as keyof typeof OBJECTIVES] ? objetivoMag : 4) as keyof typeof OBJECTIVES;

  // Local state for calculations
  const [magInput, setMagInput] = useState('');
  const [abbeInput, setAbbeInput] = useState('');
  const [calcFeedback, setCalcFeedback] = useState<'idle' | 'correct' | 'error'>('idle');
  const [conclusionText, setConclusionText] = useState('');

  // Efecto de inicialización
  useEffect(() => {
    if (!microscopio.targetOrganelle) generarSemillaB1();
  }, []);

  const handleObjectiveChange = (mag: number) => {
    const blurBump = (Math.random() - 0.5) * 5; 
    setMicroscopio({ 
      objetivoMag: mag as any,
      enfoqueZ: Math.max(0, Math.min(100, enfoqueZ + blurBump)),
      magnificacionVerified: false,
      abbeVerified: false
    });
    setCalcFeedback('idle');
  };

  const handleVerifyCalculations = () => {
    const curObj = OBJECTIVES[safeObjMag];
    const realMag = calculateTotalMagnification(curObj.mag);
    const realAbbe = calculateAbbeLimit(curObj.na, curObj.mag === 100, aceiteInmersionAplicado);

    const parsedMag = parseInt(magInput);
    const parsedAbbe = parseFloat(abbeInput);

    const magOk = parsedMag === realMag;
    const abbeOk = Math.abs(parsedAbbe - realAbbe) < 2.0;

    if (magOk && abbeOk) {
      setCalcFeedback('correct');
      setMicroscopio({ magnificacionVerified: true, abbeVerified: true });
    } else {
      setCalcFeedback('error');
    }
  };

  const handleCapture = () => {
    const url = muestra === 'vegetal' ? '/assets/bio/plant_cells.png' : 
                muestra === 'animal' ? '/assets/bio/animal_cells.png' :
                muestra === 'bacteria' ? '/assets/bio/bacteria_sample.png' :
                '/assets/bio/nerve_sample.png';
    tomarCaptura(url);
  };

  const handleSampleChange = (s: typeof muestra) => {
    const sampleConfig: Record<string, { organelle: string, focus: number }> = {
      'vegetal': { organelle: 'Pared Celular', focus: 45 },
      'animal': { organelle: 'Núcleo Celular', focus: 62 },
      'bacteria': { organelle: 'Cocos / Bacilos', focus: 38 },
      'nervioso': { organelle: 'Soma y Axón', focus: 55 }
    };
    const config = sampleConfig[s];
    setMicroscopio({ 
      muestra: s, 
      targetOrganelle: config.organelle, 
      focoIdealZ: config.focus,
      enfoqueZ: 0,
      aceiteInmersionAplicado: false,
      status: 'idle',
      magnificacionVerified: false,
      abbeVerified: false
    });
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const wordCountOk = wordCount >= 30;
  const canValidate = magnificacionVerified && abbeVerified && wordCountOk;

  return (
    <div className="flex flex-col h-full bg-[#020617] border-l border-emerald-500/10 text-slate-300 font-['Outfit'] overflow-hidden">
      
      {/* ── HEADER TÉCNICO (GLASS) ── */}
      <div className="p-5 bg-gradient-to-b from-emerald-500/10 to-transparent border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/70">
            <Activity size={12} className="animate-pulse" />
            <span>Optic-Sys v2.0 Diamond</span>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400">
            STABLE_LINK
          </div>
        </div>
        <h2 className="text-xl font-black text-white leading-none">
          {microscopio.targetOrganelle || 'Iniciando...'}
        </h2>
        <div className="mt-2 flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
           <span className="text-[10px] font-bold text-slate-500 uppercase">Muestra: {muestra}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        
        {/* ── 1. LAMINARIO (SLIDE BOX) ── */}
        <section>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block flex items-center gap-2">
            <Layers size={12} /> Colección de Laminillas
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['vegetal', 'animal', 'bacteria', 'nervioso'] as const).map((s) => (
              <button
                key={s}
                onClick={() => handleSampleChange(s)}
                className={`group relative aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${
                  muestra === s 
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                  : 'border-white/5 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className={`text-[10px] font-black uppercase transition-colors ${muestra === s ? 'text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`}>
                  {s.slice(0,3)}
                </div>
                {muestra === s && <motion.div layoutId="activeSample" className="absolute inset-0 border-2 border-emerald-500 rounded-2xl" />}
              </button>
            ))}
          </div>
        </section>

        {/* ── 2. TORRETA DE OBJETIVOS ── */}
        <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <RotateCcw size={12} /> Revólver
            </span>
            <span className="text-[10px] font-mono text-emerald-500/50">{safeObjMag}X</span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[4, 10, 40, 100].map((mag) => {
              const obj = OBJECTIVES[mag as keyof typeof OBJECTIVES];
              const isSelected = safeObjMag === mag;
              return (
                <button
                  key={mag}
                  onClick={() => handleObjectiveChange(mag)}
                  className={`flex flex-col items-center gap-2 p-2 rounded-2xl border transition-all ${
                    isSelected 
                    ? 'border-emerald-500 bg-emerald-500/20 shadow-lg' 
                    : 'border-white/5 bg-black/40 hover:border-white/20'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full border-2 border-slate-700 bg-slate-900 flex items-center justify-center relative shadow-inner overflow-hidden">
                     <div className="w-full h-1.5 absolute top-1" style={{ backgroundColor: obj.colorRing }} />
                     <ZoomIn size={12} className={isSelected ? 'text-emerald-400' : 'text-slate-600'} />
                  </div>
                  <span className={`text-[10px] font-black ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`}>{mag}X</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {safeObjMag === 100 && (
              <motion.button 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                onClick={() => setMicroscopio({ aceiteInmersionAplicado: true })}
                disabled={aceiteInmersionAplicado}
                className={`w-full mt-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border flex items-center justify-center gap-2 transition-all ${
                  aceiteInmersionAplicado 
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                  : 'bg-white/5 text-amber-400 border-amber-400/30 animate-pulse hover:bg-amber-400/10'
                }`}
              >
                <Droplet size={14} />
                {aceiteInmersionAplicado ? 'Inmersión Activa' : 'Aplicar Aceite (100x)'}
              </motion.button>
            )}
          </AnimatePresence>
        </section>

        {/* ── 3. MECHANICAL STAGE (JOYPAD) ── */}
        <section className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-5">
           <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Move size={12} /> Platina Mecánica
              </span>
           </div>
           
           <div className="flex gap-6 items-center">
              <div className="relative w-24 h-24 rounded-full bg-black/60 border border-white/10 shadow-inner flex items-center justify-center group">
                 <div className="absolute inset-0 rounded-full border border-emerald-500/10 animate-ping opacity-10" />
                 
                 <button onMouseDown={() => setMicroscopio({ posicionY: Math.max(-350, posicionY - 15) })} className="absolute top-1 p-2 hover:text-emerald-400"><ChevronRight size={16} className="-rotate-90" /></button>
                 <button onMouseDown={() => setMicroscopio({ posicionY: Math.min(350, posicionY + 15) })} className="absolute bottom-1 p-2 hover:text-emerald-400"><ChevronRight size={16} className="rotate-90" /></button>
                 <button onMouseDown={() => setMicroscopio({ posicionX: Math.max(-350, posicionX - 15) })} className="absolute left-1 p-2 hover:text-emerald-400"><ChevronRight size={16} className="rotate-180" /></button>
                 <button onMouseDown={() => setMicroscopio({ posicionX: Math.min(350, posicionX + 15) })} className="absolute right-1 p-2 hover:text-emerald-400"><ChevronRight size={16} /></button>
                 
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/20 shadow-2xl flex items-center justify-center cursor-move active:scale-95 transition-transform text-white/20 group-hover:text-emerald-500">
                    <Crosshair size={14} />
                 </div>
              </div>

              <div className="flex-1 space-y-4">
                 <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase block">Macrométrico</span>
                    <input type="range" min="0" max="100" step="0.5" value={enfoqueZ} onChange={e => setMicroscopio({ enfoqueZ: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-white/5 rounded-full appearance-none accent-emerald-500 cursor-pointer" />
                 </div>
                 <div className="space-y-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase block">Micrométrico</span>
                    <input type="range" min={enfoqueZ - 5} max={enfoqueZ + 5} step="0.05" value={enfoqueZ} onChange={e => setMicroscopio({ enfoqueZ: Math.max(0, Math.min(100, parseFloat(e.target.value))) })}
                      className="w-full h-0.5 bg-white/5 rounded-full appearance-none accent-teal-400 cursor-pointer" />
                 </div>
              </div>
           </div>
        </section>

        {/* ── 4. ILUMINACIÓN KÖHLER ── */}
        <section className="grid grid-cols-2 gap-4">
           <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
              <span className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1"><Sun size={10} /> Luz</span>
              <input type="range" min="0" max="100" value={iluminacion} onChange={e => setMicroscopio({ iluminacion: parseInt(e.target.value) })}
                className="w-full h-0.5 bg-white/5 appearance-none accent-amber-500" />
           </div>
           <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
              <span className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-1"><Droplet size={10} /> Iris</span>
              <input type="range" min="10" max="100" value={diafragmaIris} onChange={e => setMicroscopio({ diafragmaIris: parseInt(e.target.value) })}
                className="w-full h-0.5 bg-white/5 appearance-none accent-teal-500" />
           </div>
        </section>

        {/* ── 5. PROTOCOLO ANALÍTICO ── */}
        <section className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-[2rem] p-5 space-y-4">
           <div className="flex items-center gap-2 text-emerald-400">
              <Microscope size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Protocolo Óptico</span>
           </div>

           <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                 <span className="text-[8px] text-slate-500 font-bold uppercase">Magnificación</span>
                 <input type="number" value={magInput} onChange={e => { setMagInput(e.target.value); setCalcFeedback('idle'); }} placeholder="Ej: 400"
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-emerald-100 focus:border-emerald-500/50 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                 <span className="text-[8px] text-slate-500 font-bold uppercase">Límite Abbe (nm)</span>
                 <input type="number" step="0.1" value={abbeInput} onChange={e => { setAbbeInput(e.target.value); setCalcFeedback('idle'); }} placeholder="Ej: 220.0"
                    className="w-full bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-emerald-100 focus:border-emerald-500/50 outline-none transition-all" />
              </div>
           </div>

           <button onClick={handleVerifyCalculations} className="w-full py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all">
              Sincronizar Telemetría
           </button>

           <AnimatePresence>
              {calcFeedback !== 'idle' && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className={`p-3 rounded-xl text-[9px] font-black text-center ${calcFeedback === 'correct' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                  {calcFeedback === 'correct' ? '✅ ÓPTICA VALIDADA' : '❌ ERROR DE CÁLCULO'}
                </motion.div>
              )}
           </AnimatePresence>
        </section>

        {/* ── 6. OBSERVACIONES ── */}
        <section className="space-y-3">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><BookOpen size={12} /> Análisis</span>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCountOk ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-600 bg-white/5'}`}>
                {wordCount} / 30 Palabras
              </span>
           </div>
           <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="¿Cómo influye el NA en la resolución?..."
             className="w-full h-24 bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-slate-300 focus:border-emerald-500/30 outline-none transition-all resize-none" />
        </section>

        {/* ── 7. GALERÍA DE CAPTURAS ── */}
        <section className="space-y-3 pb-4">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><ImageIcon size={12} /> Micrografías</span>
           </div>
           <div className="grid grid-cols-3 gap-2">
              {capturas.length > 0 ? capturas.map((cap, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="aspect-video rounded-xl border border-white/10 bg-black/60 overflow-hidden group relative">
                    <img src={cap} alt={`Cap ${i}`} className="w-full h-full object-cover opacity-40 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <ZoomIn size={14} className="text-white" />
                    </div>
                </motion.div>
              )) : (
                <div className="col-span-3 py-6 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center opacity-30">
                   <Camera size={20} className="mb-2" />
                   <span className="text-[8px] font-black uppercase">Sin capturas</span>
                </div>
              )}
           </div>
        </section>

      </div>

      {/* ── ACCIONES FINALES ── */}
      <div className="p-6 bg-gradient-to-t from-black to-transparent border-t border-white/5 space-y-4">
         <div className="flex gap-2">
            <button 
              onClick={handleCapture}
              className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2">
              <Camera size={16} /> Capturar
            </button>
            <button 
              onClick={() => {
                if (validarB1() && canValidate) setPasoActual(4);
                else alert("Completa el protocolo y la observación.");
              }}
              disabled={!canValidate}
              className={`flex-[2] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                canValidate 
                ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/40' 
                : 'bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed'
              }`}>
              {status === 'success' ? 'PRÁCTICA COMPLETADA' : 'Enviar a Revisión'}
            </button>
         </div>
      </div>

    </div>
  );
}
