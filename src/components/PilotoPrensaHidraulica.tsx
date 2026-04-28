"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings2, Activity, Gauge, Database, 
  Target, ShieldCheck, AlertCircle, RotateCcw,
  Waves, Cpu, Bot
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import dynamic from 'next/dynamic';

const PrensaHidraulica3DScene = dynamic(() => import('./simuladores/fis05/PrensaHidraulica3DScene'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Cargando Sistemas Hidráulicos...</div>
});

const G = 9.81;

export default function PilotoPrensaHidraulica() {
  const router = useRouter();
  const { prensa5, setPrensa5, setBitacora, bitacoraData, audio, setAsistente } = useSimuladorStore();
  const { f1 = 100, r1 = 1.0, r2 = 2.5, masaCarga = 500 } = prensa5 || {};

  // -- MOTOR FÍSICO (PASCAL) --
  const physics = useMemo(() => {
    const area1 = Math.PI * Math.pow(r1, 2);
    const area2 = Math.PI * Math.pow(r2, 2);
    const ratio = area2 / area1; // Ganancia mecánica
    
    const fuerzaSalida = f1 * ratio;
    const pesoCarga = masaCarga * G;
    
    // Presión en el sistema (P = F/A)
    const presion = f1 / area1; // Pascals

    // Movimiento: Si la fuerza de salida supera el peso, hay elevación
    const netForce = fuerzaSalida - pesoCarga;
    const y2_target = netForce > 0 ? Math.min(1.0, 0.2 + (fuerzaSalida / pesoCarga) * 0.5) : 0.1;
    
    // Conservación de volumen: A1*d1 = A2*d2 -> d1 = d2 * (A2/A1)
    const y1_target = 0.9 - (y2_target * ratio * 0.1);

    return { 
      area1, area2, ratio, fuerzaSalida, pesoCarga, 
      presion, y1_target, y2_target,
      isLifting: fuerzaSalida > pesoCarga
    };
  }, [f1, r1, r2, masaCarga]);

  // Actualizar telemetría centralizada
  useEffect(() => {
    setPrensa5({ 
      ratio: physics.ratio, 
      presion: physics.presion, 
      isLifting: physics.isLifting 
    });
  }, [physics.ratio, physics.presion, physics.isLifting, setPrensa5]);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de hidráulica pesada. Tu objetivo es utilizar el principio de Pascal para elevar cargas industriales optimizando la ventaja mecánica.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // -- ANIMACIÓN LERPEADA --
  const [y1, setY1] = useState(0.8);
  const [y2, setY2] = useState(0.1);

  useEffect(() => {
    const timer = setInterval(() => {
      setY1(prev => prev + (physics.y1_target - prev) * 0.1);
      setY2(prev => prev + (physics.y2_target - prev) * 0.1);
    }, 30);
    return () => clearInterval(timer);
  }, [physics.y1_target, physics.y2_target]);

  const handleValidar = () => {
    if (physics.isLifting && y2 > 0.3) {
      audio?.playSuccess();
      audio?.playNotification();
      setBitacora({
        ...bitacoraData,
        fisica5: `✅ CERTIFICADO: Ley de Pascal verificada. Ganancia mecánica de ${physics.ratio.toFixed(2)}x. Masa de ${masaCarga}kg elevada con ${f1}N de entrada.`
      });
    } else {
      audio?.playError();
      audio?.playNotification();
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      
      {/* 🔮 ESCENA 3D (Fondo) */}
      <div className="absolute inset-0 z-0">
        <PrensaHidraulica3DScene y1={y1} y2={y2} r1={r1} r2={r2} />
      </div>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Sincronía Hidráulica
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Pascal Protocol HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${f1 > 0 ? 'bg-sky-500/10 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Presión P1</div>
              <div className={`text-sm font-black italic ${f1 > 0 ? 'text-sky-400' : 'text-white/20'}`}>{f1 > 0 ? 'ESTÁTICA' : 'CERO'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${physics.isLifting ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Elevación</div>
              <div className={`text-sm font-black italic ${physics.isLifting ? 'text-emerald-400' : 'text-white/20'}`}>{physics.isLifting ? 'ACTIVA' : 'INSUFICIENTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${bitacoraData.fisica5 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Certificación</div>
              <div className={`text-sm font-black italic ${bitacoraData.fisica5 ? 'text-emerald-400' : 'text-white/20'}`}>{bitacoraData.fisica5 ? 'EMITIDA' : 'PENDIENTE'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* GIANT PRESSURE HUD (CENTRAL) */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
         <div className="text-[14rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{(physics.presion / 1000).toFixed(1)}</div>
         <span className="text-xl font-black uppercase tracking-[1.5em] text-white/20">KILOPASCALES_SISTEMA</span>
      </div>

      {/* ── HUD IZQUIERDO: TELEMETRÍA DE PRESIÓN ── */}
      <div className="absolute top-10 left-10 z-30 flex flex-col gap-6 pointer-events-none">
        
        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-sky-500/30 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(14,165,233,0.15)] w-[380px] pointer-events-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-sky-500/20 rounded-2xl shadow-inner"><Gauge className="text-sky-400" size={20} /></div>
            <span className="text-[11px] font-black text-sky-300 uppercase tracking-[0.3em]">Manómetro Principal</span>
          </div>
          
          <div className="space-y-6">
             <div className="flex justify-between items-end border-b border-slate-700/50 pb-6">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Presión Estática</span>
                <div className="text-right">
                   <span className="text-4xl font-black text-white font-mono tracking-tighter">{(physics.presion / 1000).toFixed(2)}</span>
                   <span className="text-[11px] font-black text-slate-400 ml-2 uppercase">kPa</span>
                </div>
             </div>
             <div className="flex justify-between items-center bg-[#020617] p-5 rounded-2xl border border-white/5 shadow-inner">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ganancia Pascal</span>
                <span className="text-2xl font-black text-emerald-400 font-mono italic">x{physics.ratio.toFixed(2)}</span>
             </div>
          </div>
        </motion.div>

        <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-[#0f172a]/60 backdrop-blur-md border border-white/5 p-8 rounded-[2.5rem] flex flex-col gap-5 pointer-events-auto shadow-2xl">
           <div className="flex items-center gap-4">
              <Activity className="text-rose-400" size={16} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estado Hidráulico</span>
           </div>
           <div className="flex items-center gap-5">
              <div className={`h-3 w-3 rounded-full ${physics.isLifting ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-slate-700'}`} />
              <span className="text-sm font-black text-white uppercase tracking-tighter">
                {physics.isLifting ? 'Elevación Nominal' : 'Fuerza Insuficiente'}
              </span>
           </div>
        </motion.div>
      </div>

      {/* ── PANEL DERECHO: CONTROL DE VARIABLES ── */}
      <div className="absolute top-10 right-10 z-40 w-[400px] pointer-events-none">
        <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-700/50 p-10 rounded-[3rem] shadow-2xl pointer-events-auto">
           <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
              <Settings2 className="text-amber-400" size={28} />
              <span className="text-[12px] font-black text-white uppercase tracking-[0.3em]">Módulo de Configuración</span>
           </div>

           <div className="space-y-10 mb-12">
              <ControlSlider label="Radio Entrada (r1)" value={r1} min={0.5} max={1.5} unit="m" color="sky" onChange={(val: number) => setPrensa5({ r1: val })} />
              <ControlSlider label="Radio Salida (r2)" value={r2} min={2.0} max={4.0} unit="m" color="amber" onChange={(val: number) => setPrensa5({ r2: val })} />
              <ControlSlider label="Fuerza Aplicada (F1)" value={f1} min={0} max={2000} unit="N" color="rose" onChange={(val: number) => setPrensa5({ f1: val })} />
              
              <div className="pt-6 border-t border-slate-800">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-5">Masa de Carga (Pistón 2)</span>
                <div className="grid grid-cols-2 gap-4">
                   {[200, 500, 1000, 2000].map(m => (
                     <button key={m} onClick={() => { audio?.playPop(); setPrensa5({ masaCarga: m }); }} className={`py-4 rounded-2xl border-2 font-black text-[11px] transition-all active:scale-95 ${masaCarga === m ? 'bg-amber-600 border-amber-400 text-white shadow-xl shadow-amber-600/30' : 'bg-[#020617] border-white/5 text-slate-500 hover:border-slate-700'}`}>
                        {m} KG
                     </button>
                   ))}
                </div>
              </div>
           </div>

           <button 
             onClick={handleValidar}
             className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl ${physics.isLifting ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}`}
           >
             <Target size={20} /> Validar Presión
           </button>
        </motion.div>
      </div>

      {/* ── CONSOLA INFERIOR: MENSAJE DEL TUTOR ── */}
      <div className="absolute bottom-10 left-10 right-10 z-50 flex gap-6 pointer-events-none">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex-grow bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-700/50 p-6 rounded-[2.5rem] shadow-2xl flex items-center gap-6 pointer-events-auto">
           <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              <Bot className="text-sky-400" size={30} />
              <div className="absolute inset-0 bg-sky-500/10 animate-pulse" />
           </div>
           <p className="text-sm font-medium text-slate-300 leading-relaxed italic">
            "Dr. Quantum: La presión se transmite íntegramente. Al aumentar el área del pistón mayor, multiplicas tu capacidad de carga. Es la magia de la ventaja mecánica industrial aplicada al transporte pesado."
           </p>
        </motion.div>

        <div className="flex-shrink-0 bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-700/50 p-6 rounded-[2.5rem] shadow-xl flex items-center gap-4 pointer-events-auto">
           <button onClick={() => { audio.playPop(); router.push('/alumno/laboratorio/fisica'); }} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 transition-colors">
              <RotateCcw size={20} />
           </button>
        </div>
      </div>

      {/* ── MODAL ÉXITO ── */}
      <AnimatePresence>
        {bitacoraData.fisica5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-10 text-center pointer-events-auto">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-emerald-500/30 rounded-[4rem] p-20 max-w-2xl shadow-[0_0_100px_rgba(16,185,129,0.2)]">
                <ShieldCheck size={100} className="text-emerald-500 mx-auto mb-8" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Misión de Pascal Completada</h3>
                <p className="text-slate-400 text-lg font-medium mb-12">
                   Has demostrado el poder de la ventaja mecánica. Al optimizar el ratio de áreas, has logrado elevar <strong className="text-emerald-400">{masaCarga} kg</strong> con eficiencia industrial.
                </p>
                <button onClick={() => { audio.playSuccess(); router.push('/alumno/laboratorio/fisica'); }} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-emerald-600/30">
                   Emitir Certificado Final
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ControlSlider({ label, value, min, max, unit, color, onChange }: any) {
  const colors: any = {
    sky: 'accent-sky-500',
    amber: 'accent-amber-500',
    rose: 'accent-rose-500'
  };

  return (
    <div className="flex flex-col gap-3">
       <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
          <span className="text-lg font-black text-white italic tracking-tighter">{value?.toFixed(1)} {unit}</span>
       </div>
       <input 
         type="range" min={min} max={max} step={0.1} value={value} 
         onChange={(e) => { audio.playPop(); onChange(parseFloat(e.target.value)); }} 
         className={`w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer ${colors[color]}`} 
       />
    </div>
  );
}
