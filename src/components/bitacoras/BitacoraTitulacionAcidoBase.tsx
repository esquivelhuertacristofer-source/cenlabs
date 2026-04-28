"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Calculator, CheckCircle2, AlertCircle, Info, ChevronRight, Activity, Beaker, Bot, Volume2, Microscope, ShieldCheck } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraTitulacionAcidoBase() {
  const { titulacion, validarP7 } = useSimuladorStore();
  const [molaridadInput, setMolaridadInput] = useState("");
  const [activeTab, setActiveTab] = useState<'registro' | 'teoria'>('registro');

  // Mensaje para el Dr. Quantum
  const quantumMsg = "Observa el color de la solución con extrema atención. El punto de equivalencia se alcanza en el momento exacto en que el incoloro vira a un rosa muy tenue. Si la solución se vuelve fucsia intenso, habrás sobrepasado el límite y el cálculo de molaridad será inexacto. ¡Usa el modo gota a gota!";

  const handleValidar = () => {
    const ansVal = parseFloat(molaridadInput);
    if (isNaN(ansVal)) return;
    
    if (!titulacion.purgada) {
      audio?.playError();
      alert("⚠️ Error de Procedimiento: No has purgado la bureta. Las burbujas de aire afectan la medición del volumen.");
      return;
    }
    if (!titulacion.indicador) {
      audio?.playError();
      alert("⚠️ Error de Procedimiento: Falta el indicador (Fenolftaleína). Sin él, es imposible determinar visualmente el punto de equivalencia.");
      return;
    }
    
    const ok = validarP7(ansVal);
    if (ok) {
       audio?.playSuccess();
    } else {
       audio?.playError();
       alert("❌ Error de Cálculo: La concentración ingresada no coincide con el volumen de viraje observado. Revisa la fórmula: Ma = (Mb * Vb) / Va");
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 font-['Outfit'] animate-in fade-in slide-in-from-right-4 duration-700 pb-10">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-[#219EBC]/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
             <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Volumétrica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona para recibir instrucciones sobre el control del punto final y el viraje del indicador.
          </p>
          
          <button 
            onClick={() => audio?.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-[#219EBC] to-[#00509d] hover:from-[#8ECAE6] hover:to-[#219EBC] rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-[#219EBC]/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Titulación
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS TÉCNICOS */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-[#219EBC]" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Integridad de Bureta */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${titulacion.purgada ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${titulacion.purgada ? 'text-green-400' : 'text-yellow-400'}`}>
                     Calibración de Bureta
                  </span>
                  <span className="text-xs font-bold text-white">
                     {titulacion.purgada ? '✓ Bureta Purgada' : '⚠ Burbujas Detectadas'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${titulacion.purgada ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-yellow-400 animate-pulse'}`} />
            </div>

            {/* Hallazgo: Sensibilidad Visual */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${titulacion.indicador ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${titulacion.indicador ? 'text-green-400' : 'text-red-400'}`}>
                     Sistema Indicador
                  </span>
                  <span className="text-xs font-bold text-white">
                     {titulacion.indicador ? '✓ Fenolftaleína Activa' : '❌ Sin Sensor Visual'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${titulacion.indicador ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-400'}`} />
            </div>
         </div>
      </div>
      <div className="flex gap-1 p-1 bg-slate-900/50 rounded-2xl border border-white/5">
        <button 
          onClick={() => setActiveTab('registro')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'registro' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Análisis
        </button>
        <button 
          onClick={() => setActiveTab('teoria')}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'teoria' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Procedimiento
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        <AnimatePresence mode="wait">
          {activeTab === 'registro' ? (
            <motion.div 
              key="registro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* STATUS DE EQUIPO */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-4 rounded-3xl border transition-all flex flex-col gap-1 ${titulacion.purgada ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-900/50 border-white/5'}`}>
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Bureta (25mL)</span>
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${titulacion.purgada ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`} />
                      <span className={`text-[10px] font-black uppercase ${titulacion.purgada ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {titulacion.purgada ? 'Purgada' : 'Con Aire'}
                      </span>
                   </div>
                </div>
                <div className={`p-4 rounded-3xl border transition-all flex flex-col gap-1 ${titulacion.indicador ? 'bg-pink-500/10 border-pink-500/20' : 'bg-slate-900/50 border-white/5'}`}>
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Indicador</span>
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${titulacion.indicador ? 'bg-pink-500 shadow-[0_0_8px_#ec4899]' : 'bg-slate-700'}`} />
                      <span className={`text-[10px] font-black uppercase ${titulacion.indicador ? 'text-pink-400' : 'text-slate-500'}`}>
                        {titulacion.indicador ? 'Añadido' : 'Pendiente'}
                      </span>
                   </div>
                </div>
              </div>

              {/* DATOS DE MEDICIÓN */}
              <div className="p-6 bg-slate-950/80 rounded-[2.5rem] border border-white/5 shadow-2xl space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <Activity size={18} className="text-blue-400" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Lectura de Volúmenes</h4>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div>
                          <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Muestra Ácida (Va)</span>
                          <span className="text-sm font-black text-white">10.00 mL</span>
                       </div>
                       <ChevronRight className="text-slate-700" size={16} />
                       <div className="text-right">
                          <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Base Estándar (Mb)</span>
                          <span className="text-sm font-black text-blue-400">0.100 M</span>
                       </div>
                    </div>

                    <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10 group">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Gasto de Titulante (Vb)</label>
                       <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-black font-mono text-blue-400 tracking-tighter">{titulacion.volumenBase.toFixed(2)}</span>
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">mL NaOH</span>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                       <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3 text-center">Concentración Calculada (Ma)</label>
                       <div className="relative">
                          <input 
                            type="number" step="0.001" placeholder="0.000"
                            value={molaridadInput}
                            onChange={(e) => setMolaridadInput(e.target.value)}
                            className="w-full bg-slate-900 border border-white/5 rounded-2xl p-6 text-3xl font-black text-white text-center font-mono outline-none focus:border-pink-500 transition-all shadow-inner"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 font-black text-xl">M</div>
                       </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={handleValidar}
                      disabled={titulacion.status === 'success'}
                      className={`w-full py-5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${titulacion.status === 'success' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-950 hover:bg-slate-100'}`}
                    >
                      {titulacion.status === 'success' ? (
                        <>
                          <CheckCircle2 size={16} /> Concentración Certificada
                        </>
                      ) : (
                        <>
                          <Calculator size={16} /> Validar Punto Final
                        </>
                      )}
                    </motion.button>
                 </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="teoria" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="p-6 bg-slate-950/80 rounded-[2.5rem] border border-white/5 shadow-2xl">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
                       <Info size={18} />
                    </div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Protocolo de Laboratorio</h4>
                 </div>

                 <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                       <span className="text-[8px] font-black text-pink-400 uppercase tracking-widest">1. Preparación</span>
                       <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Añade <span className="text-white">Fenolftaleína</span> al matraz Erlenmeyer. Si la solución es ácida, permanecerá incolora.</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                       <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">2. Titulación</span>
                       <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Abre la llave de la bureta lentamente. Agita constantemente hasta que aparezca un <span className="text-pink-400">rosa tenue</span> que no desaparezca al agitar.</p>
                    </div>
                    <div className="p-6 bg-black/40 rounded-2xl border border-white/10 text-center mt-6">
                       <span className="text-[8px] font-black text-slate-500 uppercase block mb-3">Ecuación de Equivalencia</span>
                       <div className="text-xl font-black text-white font-mono tracking-tighter">Ma · Va = Mb · Vb</div>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 flex gap-4">
                 <AlertCircle className="text-emerald-500 shrink-0" size={18} />
                 <p className="text-[9px] font-bold text-slate-400 leading-relaxed italic">
                   Un goteo excesivo después del viraje (color rosa fuerte) resultará en un error de medición por exceso. Se recomienda un flujo gota a gota cerca del punto final.
                 </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
