"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RotateCcw, Target, ShieldAlert, Cpu, Calculator, Activity, CheckCircle2,
  Rocket, Zap
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import dynamic from 'next/dynamic';

const PlanoInclinado3DScene = dynamic(() => import('./simuladores/fis02/PlanoInclinado3DScene'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Inicializando Simulador...</div>
});

const G = 9.81;
const LAUNCH_TRACK = 14;

export default function PilotoPlanoInclinado() {
  const router = useRouter();
  const { setBitacora, bitacoraData, plano2, setPlano2, audio, setAsistente } = useSimuladorStore();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [payloadExtra, setPayloadExtra] = useState(0);
  const [thrustPower, setThrustPower] = useState(0);
  const [prediccionInput, setPrediccionInput] = useState("");
  const [alertaCritica, setAlertaCritica] = useState<string | null>(null);

  const { angulo = 15, friccion = 0.25, resultado = null } = plano2 || {};
  const totalMasa = (plano2.masa || 10) + payloadExtra;

  const [physics, setPhysics] = useState({ pos: 0, tiempo: 0, velocidad: 0 });
  const physicsRef = useRef(physics);
  physicsRef.current = physics;
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al Centro de Lanzamientos. Calcula la aceleración teórica usando la Segunda Ley de Newton antes de iniciar la secuencia de ignición.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // ── MOTOR FÍSICO CIENTÍFICO ──
  const stats = useMemo(() => {
    const rad = (angulo * Math.PI) / 180;
    const W = totalMasa * G;
    const N = W * Math.cos(rad);
    const Wx = W * Math.sin(rad);
    const fk = friccion * N;
    const fsMax = (friccion * 1.25) * N; // Inercia estática real
    
    const fNetoBruto = thrustPower - Wx;
    let a = 0;
    let status = "EN TIERRA";

    if (physics.velocidad > 0.05 || isAnimating) {
       const fFinal = fNetoBruto - (fNetoBruto > 0 ? fk : -fk);
       a = fFinal / totalMasa;
       status = "ASCENSIÓN";
    } else {
       if (Math.abs(fNetoBruto) > fsMax) {
          a = (fNetoBruto - (fNetoBruto > 0 ? fk : -fk)) / totalMasa;
          status = "IGNICIÓN";
       } else {
          a = 0;
          status = "ESTÁTICO";
       }
    }
    return { rad, Wx, fk, a, N, fNetoBruto, status };
  }, [angulo, friccion, totalMasa, thrustPower, isAnimating, physics.velocidad > 0.05]);

  const handleStart = () => {
    if (!prediccionInput || isNaN(parseFloat(prediccionInput))) {
       audio?.playError();
       setAlertaCritica("SISTEMA BLOQUEADO: Requiere cálculo de predicción.");
       setAsistente({ text: "¡Alto! Los protocolos de seguridad requieren una predicción teórica de la aceleración antes de iniciar la ignición.", pose: "warning" });
       setTimeout(() => setAlertaCritica(null), 4000);
       return;
    }
    setAlertaCritica(null);
    audio?.playPop();
    audio?.playNotification();
    setAsistente({ text: "Sistemas nominales. Iniciando secuencia de ignición. Monitorea la telemetría en el panel de bitácora.", pose: "happy" });
    setIsAnimating(true);
  };

  const handleReset = useCallback(() => {
    setIsAnimating(false);
    audio?.playPop();
    setPlano2({ resultado: null });
    setPhysics({ pos: 0, tiempo: 0, velocidad: 0 });
    setAlertaCritica(null);
    setAsistente({ text: "Sistema reseteado. ¿Listo para una nueva prueba?", pose: "neutral" });
  }, [setPlano2, audio, setAsistente]);

  const checkValidacionCientifica = useCallback((finalV: number) => {
    const aTeorica = parseFloat(prediccionInput);
    const aReal = stats.a;
    const errorAbsoluto = Math.abs(aTeorica - aReal);

    // Registro automático en bitácora (Estilo Química)
    const nuevoLog = {
      id: crypto.randomUUID(),
      angulo,
      friccion,
      masa: totalMasa,
      a_teorica: aTeorica.toFixed(2),
      a_real: aReal.toFixed(2),
      error: errorAbsoluto.toFixed(3),
      timestamp: new Date().toLocaleTimeString()
    };
    
    const logsPrevios = bitacoraData?.plano_logs || [];
    setBitacora({
      ...bitacoraData,
      plano_logs: [nuevoLog, ...logsPrevios].slice(0, 10)
    });

    if (errorAbsoluto <= 0.1) {
       audio?.playSuccess();
       audio?.playNotification();
       setAsistente({ text: "¡Brillante! Has demostrado que la física clásica funciona bajo presión. Misión certificada.", pose: "happy" });
       setPlano2({ resultado: 'exito' });
    } else {
       audio?.playError();
       audio?.playNotification();
       setAsistente({ text: "Fallo en la validación. La realidad no coincide con tu teoría. Verifica el coeficiente de fricción.", pose: "warning" });
       setAlertaCritica(`ERROR DE CÁLCULO: Diferencia de ${errorAbsoluto.toFixed(2)} m/s². Misión Abortada.`);
       setPlano2({ resultado: 'error' });
    }
  }, [prediccionInput, stats.a, setPlano2, setBitacora, bitacoraData, audio, setAsistente, angulo, friccion, totalMasa]);

  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      const dt = Math.min((time - previousTimeRef.current) / 1000, 0.02);
      let v = physicsRef.current.velocidad + (stats.a * dt);
      
      // Control de retroceso
      if (v < 0 && physicsRef.current.pos <= 0.01) v = 0;
      
      const nextPos = physicsRef.current.pos + (v * dt / LAUNCH_TRACK);

      // Si frena a mitad de camino o llega al final
      if ((v <= 0 && isAnimating && nextPos > 0.1) || nextPos >= 1.0) {
        setIsAnimating(false);
        checkValidacionCientifica(v);
        return;
      }
      
      setPhysics({ pos: nextPos, tiempo: physicsRef.current.tiempo + dt, velocidad: v });
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, [stats.a, isAnimating, checkValidacionCientifica]);

  useEffect(() => {
    if (isAnimating) {
      previousTimeRef.current = 0;
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isAnimating, animate]);

  if (!mounted) return null;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      <div className="absolute inset-0 z-0">
        <PlanoInclinado3DScene 
          angulo={angulo} bloquePos={physics.pos} masa={totalMasa} 
          isDeslizando={isAnimating} fuerzaAplicada={thrustPower} status={stats.status}
        />
      </div>

      {/* ── ALERTA CRÍTICA FLOTANTE ── */}
      <AnimatePresence>
        {alertaCritica && (
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 backdrop-blur-md border border-rose-400 px-8 py-4 rounded-full flex items-center gap-4 shadow-[0_0_40px_rgba(225,29,72,0.6)]">
             <ShieldAlert className="text-white animate-pulse" size={24} />
             <span className="text-white font-black uppercase tracking-widest text-xs">{alertaCritica}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-36 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Estado del Vector de Vuelo
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Dynamics Protocol HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${thrustPower !== 0 ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Thrust</div>
              <div className={`text-sm font-black italic ${thrustPower !== 0 ? 'text-sky-400' : 'text-white/20'}`}>{thrustPower !== 0 ? 'CALIBRADO' : 'CERO'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${prediccionInput ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Predicción</div>
              <div className={`text-sm font-black italic ${prediccionInput ? 'text-amber-400' : 'text-white/20'}`}>{prediccionInput ? 'INGRESADA' : 'PENDIENTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Validación</div>
              <div className={`text-sm font-black italic ${resultado === 'exito' ? 'text-emerald-400' : 'text-white/20'}`}>{resultado === 'exito' ? 'EXITOSA' : 'PENDIENTE'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* GIANT TELEMETRY HUD (CENTRAL) */}
      <div className="absolute top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
         <div className="text-[12rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{stats.a.toFixed(1)}</div>
         <span className="text-xl font-black uppercase tracking-[1em] text-white/20">m/s²</span>
      </div>

      {/* ── PANEL 1: PREDICCIÓN CIENTÍFICA (EL NÚCLEO PEDAGÓGICO) ── */}
      <div className="absolute top-10 left-10 z-30 flex flex-col gap-5">
         <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-sky-500/30 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(14,165,233,0.15)] w-[420px]">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500/20 rounded-2xl"><Calculator className="text-sky-400" size={24} /></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Ordenador de Vuelo</span>
                    <h3 className="text-sm font-black uppercase tracking-widest text-sky-400">DINÁMICA DE NEWTON</h3>
                  </div>
               </div>
               <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${stats.status === 'ASCENSIÓN' ? 'bg-sky-500 text-white shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'bg-slate-800 text-slate-400'}`}>{stats.status}</div>
            </div>
            
            <p className="text-xs text-slate-400 mb-8 font-medium leading-relaxed">
               Calcula la aceleración teórica del sistema considerando el empuje, el peso tangencial y la fricción cinética.
            </p>

            <div className="bg-[#020617] p-6 rounded-[2rem] border border-slate-800 mb-8">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Fórmula de Newton Aplicada</span>
               <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <span className="text-base font-mono text-sky-300 font-bold whitespace-nowrap">a = (F - Wx - Fk) / m_total</span>
               </div>
            </div>

            <div className="relative group">
               <input 
                 type="number" 
                 placeholder="0.00"
                 value={prediccionInput}
                 onChange={(e) => setPrediccionInput(e.target.value)}
                 className="w-full bg-slate-950 border-2 border-slate-800 rounded-[2rem] py-6 px-8 text-white font-mono text-3xl focus:border-sky-500 outline-none transition-all group-hover:border-slate-700 shadow-inner"
               />
               <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-end">
                  <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Aceleración</span>
                  <span className="text-[9px] font-bold text-slate-600">m/s²</span>
               </div>
            </div>
         </motion.div>

         {/* TELEMETRÍA EN VIVO */}
         <div className="bg-[#0f172a]/40 backdrop-blur-md border border-white/5 p-8 rounded-[3rem] flex flex-col gap-5">
            <div className="flex items-center justify-between">
               <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-2"><Activity size={14}/> LIVE TELEMETRY</span>
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <DataBox label="Componente Wx" value={stats.Wx.toFixed(1)} unit="N" color="text-rose-400" />
               <DataBox label="Fuerza Normal" value={stats.N.toFixed(1)} unit="N" color="text-sky-400" />
               <DataBox label="Fricción Cinética" value={stats.fk.toFixed(1)} unit="N" color="text-amber-400" />
               <DataBox label="Fuerza Neta" value={stats.fNetoBruto.toFixed(1)} unit="N" color="text-emerald-400" />
            </div>
         </div>
      </div>

      {/* ── PANEL 2: MONITOR CINEMÁTICO ── */}
      <div className="absolute top-10 right-10 z-40 w-80">
         <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-white/5 p-8 rounded-[3rem] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-sky-400 uppercase tracking-[0.4em]">Radar Doppler</span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase">Kinematic Tracking</span>
               </div>
               <Target size={20} className="text-slate-700" />
            </div>
            
            {/* Gráfica de velocidad visual */}
            <div className="h-40 bg-[#020617] rounded-[2rem] p-4 flex flex-col justify-end border border-slate-800 relative overflow-hidden group">
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(transparent 90%, #0ea5e9 10%)', backgroundSize: '100% 12px' }} />
               <motion.div 
                 animate={{ height: `${Math.min(100, Math.max(2, (physics.velocidad / 15) * 100))}%` }} 
                 className="w-full bg-gradient-to-t from-sky-600 via-sky-400 to-white/40 rounded-t-xl shadow-[0_0_30px_rgba(14,165,233,0.6)] relative z-10 transition-all duration-75" 
               />
               <div className="absolute top-4 right-4 flex items-center gap-2">
                  <Cpu size={14} className="text-sky-500/40" />
               </div>
            </div>
            
            <div className="mt-8 flex flex-col gap-6">
               <div className="flex justify-between items-end border-b border-white/5 pb-4">
                  <div className="flex flex-col">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Velocidad Actual</span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white font-mono tracking-tighter">{physics.velocidad.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">m/s</span>
                     </div>
                  </div>
                  <div className="flex flex-col text-right">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tiempo</span>
                     <div className="flex items-baseline gap-1 justify-end">
                        <span className="text-2xl font-black text-slate-300 font-mono tracking-tighter">{physics.tiempo.toFixed(1)}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase">s</span>
                     </div>
                  </div>
               </div>
               
               <div className="flex justify-between items-center px-2">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Trayectoria Completa</span>
                  <span className="text-[10px] font-black text-sky-400 italic">{(physics.pos * 100).toFixed(0)}%</span>
               </div>
            </div>
         </motion.div>
      </div>

      {/* ── DOCK DE CONTROL INFERIOR (DIAMOND DOCK) ── */}
      <div className="absolute bottom-10 inset-x-0 z-50 flex justify-center pointer-events-none">
         <div className="bg-[#0f172a]/95 backdrop-blur-3xl border border-white/10 p-8 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex items-center gap-12 pointer-events-auto">
            
            <div className="flex gap-12 px-6">
               <ControlSlider label="Ángulo de Elevación" value={angulo} min={0} max={60} unit="°" onChange={(v: number) => setPlano2({ angulo: v })} />
               <ControlSlider label="Thrust (Fuerza Neta)" value={thrustPower} min={-200} max={600} unit="N" onChange={setThrustPower} />
            </div>

            <div className="flex items-center gap-6 border-l border-white/10 pl-12 pr-4">
               <div className="flex flex-col gap-2 items-center">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Carga Útil</span>
                  <button onClick={() => { setPayloadExtra(prev => (prev + 5) % 30); audio?.playPop(); }} className="w-20 h-20 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center text-white transition-all group shadow-xl active:scale-90">
                     <Rocket size={24} className="group-hover:-translate-y-2 transition-transform text-sky-400" />
                     <span className="text-[9px] font-black uppercase mt-2">+{payloadExtra}kg</span>
                  </button>
               </div>

               <div className="flex flex-col gap-2 items-center">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Acción</span>
                  {!isAnimating ? (
                    <button onClick={handleStart} className="h-20 px-14 bg-sky-600 hover:bg-sky-500 text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-[2.5rem] shadow-[0_0_50px_rgba(14,165,233,0.3)] hover:shadow-[0_0_70px_rgba(14,165,233,0.5)] active:scale-95 transition-all">
                      Ignición
                    </button>
                  ) : (
                    <button onClick={() => setIsAnimating(false)} className="h-20 px-14 bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] uppercase tracking-[0.4em] rounded-[2.5rem] shadow-[0_0_50px_rgba(225,29,72,0.3)] active:scale-95 transition-all">
                      Abortar
                    </button>
                  )}
               </div>

               <div className="flex flex-col gap-2 items-center">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Reset</span>
                  <button onClick={handleReset} className="w-20 h-20 bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 border border-white/10 rounded-[2.5rem] flex items-center justify-center text-white/40 hover:text-red-500 transition-all active:rotate-[-45deg] shadow-xl">
                     <RotateCcw size={28} />
                  </button>
               </div>
            </div>
         </div>
      </div>

      {/* ── MODAL DE ÉXITO ACADÉMICO ── */}
      <AnimatePresence>
        {resultado === 'exito' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-[#010409]/95 backdrop-blur-3xl p-10 text-center">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-950 border border-emerald-500/30 rounded-[5rem] p-24 max-w-3xl shadow-[0_0_150px_rgba(16,185,129,0.1)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                <CheckCircle2 size={120} className="text-emerald-500 mx-auto mb-10 drop-shadow-[0_0_30px_rgba(16,185,129,0.4)]" />
                <h3 className="text-6xl font-black text-white uppercase italic mb-8 leading-none tracking-tighter">Predicción Perfecta</h3>
                <p className="text-slate-400 text-xl font-medium mb-16 px-12 leading-relaxed">
                   Has dominado la <span className="text-white italic">Dinámica de Newton</span>. Tu cálculo de aceleración experimental coincide con la telemetría, validando el modelo físico del reactor.
                </p>
                <div className="flex gap-6">
                  <button onClick={handleReset} className="flex-1 py-8 bg-white/5 hover:bg-white/10 text-white font-black rounded-[2.5rem] uppercase tracking-widest text-[10px] transition-all border border-white/10">Repetir Prueba</button>
                  <button onClick={() => router.push('/alumno/laboratorio/fisica')} className="flex-[2] py-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2.5rem] uppercase tracking-widest text-[10px] transition-all shadow-2xl shadow-emerald-600/40 active:scale-95">Registrar en Bitácora</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DataBox({ label, value, unit, color }: any) {
  return (
    <div className="flex flex-col bg-[#020617]/80 p-5 rounded-3xl border border-white/5 shadow-inner">
       <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{label}</span>
       <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-black ${color} font-mono tracking-tighter`}>{value}</span>
          <span className="text-[9px] font-bold text-slate-700 uppercase">{unit}</span>
       </div>
    </div>
  );
}

function ControlSlider({ label, value, min, max, unit, onChange }: any) {
  return (
    <div className="flex flex-col gap-4 min-w-[220px]">
       <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
          <span className="text-xl font-black text-white italic tracking-tighter">{value.toFixed(1)}<span className="text-xs ml-1 opacity-40">{unit}</span></span>
       </div>
       <div className="relative flex items-center h-6">
          <input 
            type="range" 
            min={min} 
            max={max} 
            step={0.5} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))} 
            className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500 border border-white/5" 
          />
       </div>
    </div>
  );
}
