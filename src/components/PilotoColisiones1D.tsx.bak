"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Square, ShieldCheck, Activity, Target, 
  RotateCcw, Sparkles, Gauge, Lock, Globe, Database, Plus, ShieldAlert
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import Colisiones3DScene from './simuladores/fis05/Colisiones3DScene';

const DIALOGOS = {
  1: "SISTEMA DE CONTROL: Fase 1. Calibración Inicial. Para predecir el impacto, determine el Momento Lineal Total (p) del sistema antes de la colisión.\n\nInstrucción: Despeje el momento total usando p = m₁v₁ + m₂v₂. Introduzca el resultado en el panel analítico.",
  2: "SISTEMA DE CONTROL: Fase 2. Escudo Elástico. En un choque elástico ideal (e=1), la energía cinética se conserva.\n\nInstrucción: Fije el escudo en e=1. Inicie la colisión magnética. Analice la velocidad final del Pod 2 tras el impacto para validar su modelo.",
  3: "SISTEMA DE CONTROL: Fase 3. Acoplamiento Inelástico. Reduzca la eficiencia del escudo a e=0 para simular una colisión inelástica perfecta.\n\nInstrucción: Cambie el coeficiente a e=0. Dispare la colisión. Mida la velocidad final del sistema acoplado (v1=v2) y calcule la pérdida térmica.",
  4: "SISTEMA DE CONTROL: Fase 4. Análisis de Disipación. Determine cuánta energía cinética se transformó en calor durante la fusión magnética.\n\nInstrucción: Usando K = ½mv², calcule la Energía Cinética Inicial y Final de la Fase 3. Introduzca el porcentaje de disipación térmica. [Disipación = 100 - (Kf/Ki)*100]"
};

export default function PilotoColisiones1D() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();

  // Limpiar bitácora al entrar
  useEffect(() => {
    useSimuladorStore.getState().setBitacora({
      ...useSimuladorStore.getState().bitacoraData,
      fisica5: null
    });
  }, []);

  // -- MAQUINA DE ESTADOS PEDAGÓGICA --
  const [fase, setFase] = useState<1 | 2 | 3 | 4>(1);
  const [alertaCritica, setAlertaCritica] = useState<string | null>(null);

  // -- SEMILLA FIJA DE RETO --
  const [seed] = useState(() => ({
    m1: 3.0,
    m2: 2.0,
    v1i: 5.0,
    v2i: -2.0
  }));

  // -- ESTADO DEL SISTEMA --
  const [e, setE] = useState(1.0);
  const [phase3D, setPhase3D] = useState<'idle' | 'running' | 'impact' | 'post-impact'>('idle');

  // -- INPUTS DEL USUARIO --
  const [inputP, setInputP] = useState("");
  const [inputV2F, setInputV2F] = useState("");
  const [inputVAcoplado, setInputVAcoplado] = useState("");
  const [inputDisipacion, setInputDisipacion] = useState("");

  // -- MOTOR FÍSICO --
  const physics = useMemo(() => {
    const { m1, m2, v1i, v2i } = seed;
    
    // v1f = [(m1 - e*m2)*v1i + (m2 + e*m2)*v2i] / (m1+m2)
    // v2f = [(m1 + e*m1)*v1i + (m2 - e*m1)*v2i] / (m1+m2)
    const v1f = ((m1 - e * m2) * v1i + (m2 + e * m2) * v2i) / (m1 + m2);
    const v2f = ((m1 + e * m1) * v1i + (m2 - e * m1) * v2i) / (m1 + m2);
    
    const pi = m1 * v1i + m2 * v2i;
    const ki = 0.5 * m1 * (v1i**2) + 0.5 * m2 * (v2i**2);
    const kf = 0.5 * m1 * (v1f**2) + 0.5 * m2 * (v2f**2);
    const disipacion = 100 - (kf / ki) * 100;

    return { v1f, v2f, pi, ki, kf, disipacion };
  }, [seed, e]);

  const showAlert = (msg: string) => {
    setAlertaCritica(msg);
    setTimeout(() => setAlertaCritica(null), 6000);
  };

  const dispararColision = async () => {
    if (phase3D !== 'idle') return;
    setPhase3D('running');
    
    // Simular el timing
    setTimeout(() => {
      setPhase3D('impact');
      setTimeout(() => setPhase3D('post-impact'), 500);
    }, 1500); // Tarda ~1.5s en chocar visualmente basado en la escala visual
  };

  const handleValidarFase = () => {
    if (fase === 1) {
      const pCalc = parseFloat(inputP);
      if (Math.abs(pCalc - physics.pi) < 0.2) {
        setFase(2);
      } else {
        showAlert(`Error: El momento inicial no es ${pCalc}. Multiplique las masas por sus velocidades (cuidado con los signos) y súmelas.`);
      }
    } 
    else if (fase === 2) {
      const v2Calc = parseFloat(inputV2F);
      if (e !== 1.0) return showAlert("Debe fijar el coeficiente 'e' en 1.0 para esta prueba.");
      if (phase3D !== 'post-impact') return showAlert("Ejecute la colisión magnética primero.");
      
      if (Math.abs(v2Calc - physics.v2f) < 0.2) {
        setPhase3D('idle');
        setFase(3);
        setE(0.0);
      } else {
        showAlert("Discrepancia detectada en la velocidad del Pod 2.");
      }
    }
    else if (fase === 3) {
      const vAcoplada = parseFloat(inputVAcoplado);
      if (e !== 0.0) return showAlert("El escudo debe estar en e=0 para acoplamiento.");
      if (phase3D !== 'post-impact') return showAlert("Ejecute la colisión primero.");
      
      if (Math.abs(vAcoplada - physics.v2f) < 0.2) {
        setFase(4);
      } else {
        showAlert("Error. Al acoplarse, ambos pods comparten la misma velocidad. Calcule pTotal / MasaTotal.");
      }
    }
    else if (fase === 4) {
      const disCalc = parseFloat(inputDisipacion);
      if (Math.abs(disCalc - physics.disipacion) < 2.0) {
        setBitacora({
          ...bitacoraData,
          fisica5: `✅ CERTIFICADO: Análisis de colisiones validado. Momento Conservado (${physics.pi} kg·m/s). Disipación Térmica Inelástica: ${physics.disipacion.toFixed(1)}%.`
        });
      } else {
        showAlert("Cálculo térmico erróneo. Determine K_inicial y K_final de la fase inelástica.");
      }
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#020617] font-['Outfit'] relative">
      
      {/* 🔮 ESCENA 3D (Fondo) */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <Colisiones3DScene 
          phase={phase3D} m1={seed.m1} m2={seed.m2} 
          v1i={seed.v1i} v2i={seed.v2i} 
          v1f={physics.v1f} v2f={physics.v2f} e={e} 
        />
      </div>

      <AnimatePresence>
        {alertaCritica && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 backdrop-blur-md border border-rose-400 px-8 py-4 rounded-full flex items-center gap-4 shadow-[0_0_40px_rgba(225,29,72,0.6)]">
             <ShieldAlert className="text-white animate-pulse" size={24} />
             <span className="text-white font-black uppercase tracking-widest text-xs">{alertaCritica}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── PANEL IZQUIERDO: TELEMETRÍA ── */}
      <div className="absolute top-10 left-10 z-30 flex flex-col gap-5 pointer-events-none">
         
         {/* HUD: Vectores Iniciales */}
         <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-sky-500/30 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(14,165,233,0.15)] w-[360px] pointer-events-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-sky-500/20 rounded-xl"><Target className="text-sky-400" size={16} /></div>
              <span className="text-[10px] font-black text-sky-300 uppercase tracking-[0.2em]">Condiciones Iniciales</span>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pod 1 (Masa/Vel)</span>
                  <span className="text-sm font-mono font-bold text-orange-400">{seed.m1}kg | {seed.v1i}m/s</span>
               </div>
               <div className="flex justify-between items-center bg-slate-900/80 p-3 rounded-xl border border-slate-700">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Pod 2 (Masa/Vel)</span>
                  <span className="text-sm font-mono font-bold text-indigo-400">{seed.m2}kg | {seed.v2i}m/s</span>
               </div>
            </div>
         </motion.div>

         {/* HUD: Energía Dinámica (Solo en fase >= 2) */}
         <AnimatePresence>
         {fase >= 2 && (
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-emerald-500/30 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] w-[360px] relative overflow-hidden group pointer-events-auto">
               <div className="absolute top-0 left-0 h-1 bg-emerald-500 w-1/3" />
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-emerald-500/20 rounded-xl"><Sparkles className="text-emerald-400" size={16} /></div>
                 <span className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em]">Cinética del Sistema</span>
               </div>
               <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-700">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Energía Total (K)</span>
                  <span className="text-xl font-mono font-bold text-emerald-400">{(phase3D === 'post-impact' ? physics.kf : physics.ki).toFixed(1)} J</span>
               </div>
            </motion.div>
         )}
         </AnimatePresence>
      </div>

      {/* ── PANEL DERECHO: ORDENADOR ANALÍTICO ── */}
      <div className="absolute top-10 right-10 z-40 w-[400px] flex flex-col gap-5 pointer-events-none">
         <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/95 backdrop-blur-2xl border border-amber-500/20 p-8 rounded-[2.5rem] shadow-2xl pointer-events-auto">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
               <div className="flex items-center gap-3">
                  <Globe className="text-amber-400" size={24} />
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em]">Fase {fase}/4</span>
               </div>
            </div>

            <div className="space-y-5 mb-8">
               {fase === 1 && (
                  <InputFase label="Momento Total (P) [kg·m/s]" value={inputP} onChange={setInputP} />
               )}
               {fase === 2 && (
                  <InputFase label="Velocidad Final Pod 2 (m/s)" value={inputV2F} onChange={setInputV2F} />
               )}
               {fase === 3 && (
                  <InputFase label="Velocidad Sistema Acoplado (m/s)" value={inputVAcoplado} onChange={setInputVAcoplado} />
               )}
               {fase === 4 && (
                  <InputFase label="Disipación Térmica (%)" value={inputDisipacion} onChange={setInputDisipacion} highlight />
               )}
            </div>

            {!bitacoraData.fisica5 && (
              <button onClick={handleValidarFase} className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] shadow-[0_0_30px_rgba(217,119,6,0.2)] hover:shadow-[0_0_40px_rgba(217,119,6,0.4)] transition-all flex items-center justify-center gap-3">
                <Target size={18} /> Procesar Datos
              </button>
            )}
         </motion.div>
      </div>

      {/* ── CONSOLA DE SISTEMA DE CONTROL ── */}
      <div className="absolute bottom-10 left-10 right-10 z-50 flex gap-6 pointer-events-none">
         
         <motion.div key={fase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-grow bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-700/50 p-6 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex items-center gap-6 pointer-events-auto">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center flex-shrink-0">
               <Database className="text-slate-400" size={30} />
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-line">
               {DIALOGOS[fase as keyof typeof DIALOGOS]}
            </p>
         </motion.div>

         <div className="flex-shrink-0 bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-700/50 p-6 rounded-[2.5rem] shadow-xl flex items-center gap-8 pointer-events-auto">
            <ControlSlider 
              label="Escudo Restitución (e)" value={e} min={0.0} max={1.0} step={0.5} unit="" color="emerald" 
              onChange={setE} locked={fase === 1 || fase === 4} 
            />
            
            <div className="pl-4 border-l border-slate-700 flex gap-3">
               <button 
                onClick={dispararColision} 
                disabled={phase3D !== 'idle' || fase === 1 || fase === 4}
                className={`h-14 w-14 rounded-full flex items-center justify-center transition-all shadow-lg ${phase3D !== 'idle' || fase === 1 || fase === 4 ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-600' : 'bg-sky-600 text-white hover:bg-sky-500 shadow-sky-600/30'}`}
               >
                 <Play fill="currentColor" size={20} className="ml-1" />
               </button>
               <button 
                onClick={() => setPhase3D('idle')} 
                className="h-14 w-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 text-slate-300 transition-all"
               >
                 <RotateCcw size={20} />
               </button>
            </div>
         </div>
      </div>

      {/* ── MODAL ÉXITO FINAL ── */}
      <AnimatePresence>
        {bitacoraData.fisica5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-10 text-center pointer-events-auto">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-amber-500/30 rounded-[4rem] p-20 max-w-2xl shadow-[0_0_100px_rgba(217,119,6,0.2)]">
                <ShieldCheck size={100} className="text-amber-500 mx-auto mb-8" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Certificación Magnética</h3>
                <p className="text-slate-400 text-lg font-medium mb-12">
                  Has comprobado matemáticamente las Leyes de Conservación del universo.<br/><br/>
                  El momento lineal total se mantiene en <strong className="text-amber-400">{physics.pi} kg·m/s</strong>.
                </p>
                <button onClick={() => router.push('/alumno/laboratorio/fisica')} className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-amber-600/30">
                  Volver al Hub Espacial
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function InputFase({ label, value, onChange, highlight = false }: any) {
  return (
    <div className="relative group">
       <input 
         type="number" placeholder="0.00" value={value} onChange={(e) => onChange(e.target.value)}
         className={`w-full bg-slate-900 border ${highlight ? 'border-amber-500/50' : 'border-slate-700'} rounded-2xl py-4 px-5 text-white font-mono text-xl outline-none transition-all focus:border-white`}
       />
       <div className={`absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase tracking-widest ${highlight ? 'text-amber-500' : 'text-slate-500'}`}>
         {label}
       </div>
    </div>
  );
}

function ControlSlider({ label, value, min, max, step, unit, color, onChange, locked = false }: any) {
  return (
    <div className={`flex flex-col gap-3 min-w-[140px] transition-opacity ${locked ? 'opacity-40' : 'opacity-100'}`}>
       <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
             {locked && <Lock size={10} />} {label}
          </span>
          <span className={`text-sm font-black italic tracking-tighter text-emerald-300`}>{value.toFixed(1)}{unit}</span>
       </div>
       <input 
        type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} disabled={locked}
        className={`w-full h-1.5 bg-slate-700 rounded-full appearance-none ${locked ? 'cursor-not-allowed' : 'cursor-pointer'} accent-emerald-500`} 
       />
    </div>
  );
}
