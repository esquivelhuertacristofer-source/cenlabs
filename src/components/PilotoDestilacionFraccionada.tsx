"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { Wind, Droplets, RotateCcw, Activity, CheckCircle2, Thermometer } from 'lucide-react';
import { validarQ10, PUREZA_REQUERIDA_Q10, VOL_REQUERIDO_Q10 } from '@/domain/quimica';
import Destilacion3DScene from './simuladores/qmi10/Destilacion3DScene';

// La simulación avanza 4 veces por segundo con el tiempo real transcurrido.
const PASO_DESTILACION_MS = 250;

export default function PilotoDestilacionFraccionada({ isWorktableDark = true, isProfesor = false, onValidate }: { isWorktableDark?: boolean; isProfesor?: boolean; onValidate?: () => void }) {
  const { destilacion, setCalorManta, updateDestilacion, resetP10, validarP10, audio } = useSimuladorStore(useShallow((s) => ({
    destilacion: s.destilacion, setCalorManta: s.setCalorManta, updateDestilacion: s.updateDestilacion,
    resetP10: s.resetP10, validarP10: s.validarP10, audio: s.audio,
  })));
  const [intentado, setIntentado] = useState(false);
  // useRef en lugar de useState para lastTick — evita stale closure en el setInterval
  const lastTickRef = useRef(Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Loop de simulación local (más fluido que el tick global)
  // Corrección stale closure: el intervalo NO depende de lastTick como estado.
  // Actualiza lastTickRef.current directamente sin re-crear el intervalo en cada tick.
  useEffect(() => {
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(1, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      updateDestilacion(dt);
    }, PASO_DESTILACION_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const temp = destilacion.tempMezcla;
  const volEtanol = destilacion.volEtanolMatraz;
  const volAgua = destilacion.volAguaMatraz;
  const volDestilado = destilacion.volDestilado;
  // Alcoholímetro: % v/v de etanol del destilado ACUMULADO (lo que juzga el validador).
  const pur = destilacion.purezaDestilado;
  const tempCabeza = destilacion.tempCabeza;
  const tasa = destilacion.tasa;
  const hierve = tasa > 0;
  const simStatus = destilacion.status;
  const veredicto = validarQ10(destilacion);

  const puedeValidar = volDestilado >= VOL_REQUERIDO_Q10;

  const handleCertificar = () => {
    audio?.playClick?.();
    setIntentado(true);
    // Un solo juez: el validador de la práctica (quiz + modal comunes).
    if (onValidate) { onValidate(); return; }
    if (validarP10()) audio?.playSuccess?.(); else audio?.playError?.();
  };

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden font-['Outfit'] bg-[#010409] text-white">

      {/* Aviso pequeño, no modal: el éxito lo anuncia el flujo común (quiz + modal). */}
      {(simStatus === 'success' || (intentado && simStatus === 'error' && veredicto.mensaje)) && (
        <div className={`absolute top-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none rounded-full px-5 py-2 flex items-center gap-2 shadow-xl border ${simStatus === 'success' ? 'bg-emerald-600/90 border-emerald-400/50' : 'bg-amber-600/90 border-amber-400/50'}`}>
          <CheckCircle2 size={14} className="text-white" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">
            {simStatus === 'success' ? 'Destilado certificado' : veredicto.mensaje}
          </span>
        </div>
      )}

      {/* ── ESCENARIO 3D (MOTOR DIAMOND) ── */}
      <div className="absolute inset-0 z-0">
        <Destilacion3DScene
           temp={temp}
           volMezcla={((volEtanol + volAgua) / 200) * 100}
           volDestilado={volDestilado}
           pureza={pur}
           tasa={tasa}
        />
      </div>

      {/* ── CAPA DE INTERFAZ HUD DIAMOND ── */}
      <div className="absolute inset-0 z-10 pointer-events-none p-12 flex flex-col justify-between">

        {/* Superior: Status Térmico */}
        <div className="flex justify-between items-start">
           <motion.div
             initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
             className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] pointer-events-auto shadow-2xl"
           >
              <div className="flex items-center gap-4 mb-4">
                 <div className={`w-3 h-3 rounded-full animate-pulse ${temp > 75 ? 'bg-orange-500 shadow-[0_0_15px_#f97316]' : 'bg-slate-500'}`} />
                 <span className="text-[10px] font-black text-[#8ECAE6] uppercase tracking-[0.4em]">Distillation Monitor v2.0</span>
              </div>

              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Matraz (líquido)</span>
                 <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black font-mono tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                       {temp.toFixed(1)}<span className="text-xl text-slate-500 ml-1">°C</span>
                    </span>
                 </div>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-4 mb-1 flex items-center gap-1"><Thermometer size={10} /> Cabeza de columna (vapor)</span>
                 <span className="text-3xl font-black font-mono tracking-tighter text-amber-200">
                    {tempCabeza.toFixed(1)}<span className="text-base text-slate-500 ml-1">°C</span>
                 </span>
              </div>

              <div className="mt-6 flex gap-2 w-48">
                 {[1,2,3,4,5,6].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${temp > (20 + i * 12) ? 'bg-orange-500 shadow-[0_0_5px_#f97316]' : 'bg-slate-800'}`} />
                 ))}
              </div>
           </motion.div>

           <motion.div
             initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
             className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[3rem] pointer-events-auto text-right shadow-2xl"
           >
              <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3">Alcoholímetro del colector</div>
              <div className="space-y-4">
                 <div className="flex flex-col items-end">
                    <span className="text-5xl font-black text-white font-mono italic drop-shadow-[0_0_20px_rgba(34,211,238,0.2)]">{volDestilado > 0 ? pur.toFixed(1) : '--'}<span className="text-xl ml-1 text-slate-500">% v/v</span></span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Etanol en el destilado acumulado</span>
                 </div>
                 <div className="h-2 w-56 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <motion.div
                       animate={{ width: `${pur}%`, backgroundColor: pur >= PUREZA_REQUERIDA_Q10 ? '#10b981' : '#3b82f6' }}
                       className="h-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                    />
                 </div>
                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Caudal: {(tasa * 60).toFixed(1)} mL/min</div>
              </div>
           </motion.div>
        </div>

        {/* CHECKLIST HUD (DIAMOND STANDARD) */}
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[550px] pointer-events-none">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} className="animate-pulse" /> Sincronía Vapor-Líquido
              </span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Phase Transition HUD</span>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className={`p-5 rounded-2xl border transition-all ${hierve ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[9px] font-black uppercase text-white/40 mb-2">Ebullición</div>
                <div className={`text-sm font-black italic ${hierve ? 'text-orange-400' : 'text-white/20'}`}>{hierve ? `ACTIVA (${temp.toFixed(0)} °C)` : 'LATENTE'}</div>
              </div>
              <div className={`p-5 rounded-2xl border transition-all ${volDestilado > 0 ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[9px] font-black uppercase text-white/40 mb-2">Destilado</div>
                <div className={`text-sm font-black italic ${volDestilado > 0 ? 'text-cyan-400' : 'text-white/20'}`}>{volDestilado.toFixed(1)} <span className="text-[10px]">mL</span></div>
              </div>
              <div className={`p-5 rounded-2xl border transition-all ${volDestilado > 0 && pur >= PUREZA_REQUERIDA_Q10 ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[9px] font-black uppercase text-white/40 mb-2">Grado Alcohólico</div>
                <div className={`text-sm font-black italic ${volDestilado > 0 && pur >= PUREZA_REQUERIDA_Q10 ? 'text-emerald-400' : 'text-white/20'}`}>{volDestilado === 0 ? 'SIN DESTILADO' : pur >= PUREZA_REQUERIDA_Q10 ? `≥ ${PUREZA_REQUERIDA_Q10} % v/v` : `< ${PUREZA_REQUERIDA_Q10} % v/v`}</div>
              </div>
            </div>
          </div>
        </div>

        {/* GIANT TEMPERATURE HUD (CENTRAL) */}
        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
           <div className="text-[14rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{temp.toFixed(0)}</div>
        </div>

        {/* Inferior: Control de Manta y Volumen */}
        <div className="flex justify-between items-end mb-8 px-4">
           <div className="flex flex-col gap-6 pointer-events-auto">
              <div className="flex items-center gap-3 text-white/40 px-2">
                 <Wind size={18} className="animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">{hierve ? 'Condensando destilado' : 'Sin ebullición'}</span>
              </div>

              <div className="p-8 bg-slate-950/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center gap-12">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Manta calefactora (consigna)</span>
                    <div className="flex items-center gap-6">
                       <span className="text-5xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">{destilacion.calorManta}<span className="text-xl text-orange-500 ml-1">°C</span></span>
                       <div className="flex gap-2">
                          {[-5, -1].map((d) => (
                            <button key={d} aria-label={`Bajar la manta ${-d} °C`}
                              onClick={() => { setCalorManta(destilacion.calorManta + d); audio?.playPop(); }}
                              className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all font-black text-sm text-white active:scale-90"
                            >{d}</button>
                          ))}
                          {[1, 5].map((d) => (
                            <button key={d} aria-label={`Subir la manta ${d} °C`}
                              onClick={() => { setCalorManta(destilacion.calorManta + d); audio?.playPop(); }}
                              className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all font-black text-sm shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-90"
                            >+{d}</button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="h-16 w-px bg-white/10" />

                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Contenedor Colector</span>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20"><Droplets size={20} /></div>
                       <span className="text-3xl font-black text-white font-mono">{volDestilado.toFixed(1)} <span className="text-xs text-slate-500">mL</span></span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-6 pointer-events-auto">
              {/* BOTÓN DE VALIDACIÓN: visible cuando volDestilado > 50 */}
              <AnimatePresence>
                {puedeValidar && simStatus !== 'success' && (
                  <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    onClick={handleCertificar}
                    className="h-20 px-8 bg-emerald-500 hover:bg-emerald-400 text-black rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 flex items-center gap-3"
                  >
                    <CheckCircle2 size={22} />
                    Certificar Destilación
                  </motion.button>
                )}
              </AnimatePresence>

              <button
                aria-label="Reiniciar la destilación"
                onClick={() => { resetP10(); setIntentado(false); audio?.playPop(); }}
                className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-white/10 transition-all shadow-xl group"
              >
                 <RotateCcw size={28} className="group-hover:rotate-[-180deg] transition-transform duration-700" />
              </button>
           </div>
        </div>
      </div>

      {/* GLOBO DE INSTRUCTOR (DIAMOND PANEL) */}
      {isProfesor && (
        <div className="absolute top-1/2 -translate-y-1/2 right-12 p-10 bg-gradient-to-br from-[#023047] to-[#0A1121] text-white rounded-[3.5rem] shadow-2xl max-w-sm z-30 border border-cyan-500/30">
           <div className="flex items-center gap-4 mb-6 font-black uppercase tracking-tighter text-lg italic text-cyan-400">
             <div className="p-3 bg-cyan-500/20 rounded-2xl"><Activity size={24} /></div>
             Master Distiller
           </div>
           <p className="text-xs font-medium opacity-70 leading-relaxed mb-8 italic">
             "La mezcla 1:1 hierve hacia los 83 °C y la cabeza de la columna marca ~78 °C mientras sube vapor rico en etanol. Con la manta apenas por encima de la ebullición (85–95 °C) la columna trabaja casi a reflujo y el destilado supera el 85 % v/v; si se calienta a fondo, la columna se inunda y el destilado sale más aguado."
           </p>
        </div>
      )}

      {/* Decoración HUD Extra */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-[5]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '80px 80px' }} />
    </div>
  );
}
