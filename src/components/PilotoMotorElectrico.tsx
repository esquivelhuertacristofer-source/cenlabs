"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Compass, Activity, Target, ShieldCheck,
  Gauge, Power, Workflow, Bot
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import MotorElectrico3DScene from './simuladores/fis10/MotorElectrico3DScene';

const K_RPM_SCALE = 1.041;

export default function PilotoMotorElectrico() {
  const router = useRouter();
  const { motor10, setMotor10, resetF10, setBitacora, bitacoraData, stopTimer, setPasoActual, audio, setAsistente, registrarHallazgo } = useSimuladorStore();
  const { 
    imanIzq = 'N', imanDer = 'S', voltaje = 0, 
    espiras = 10, interruptor = false, encendido = false 
  } = motor10 || {};

  const [alphaInput, setAlphaInput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de electromecánica. Tu misión es configurar un motor de corriente continua optimizando el torque magnético. Asegúrate de que los imanes generen un campo polarizado.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // -- CÁLCULOS FÍSICOS --
  const B = useMemo(() => {
    if (imanIzq === 'N' && imanDer === 'S') return 1;
    if (imanIzq === 'S' && imanDer === 'N') return -1;
    return 0;
  }, [imanIzq, imanDer]);

  const rpmCalculadas = encendido ? Math.floor(K_RPM_SCALE * voltaje * B * espiras) : 0;
  const absRPM = Math.abs(rpmCalculadas);
  const currentDir = rpmCalculadas > 0 ? 'CW' : (rpmCalculadas < 0 ? 'CCW' : 'STILL');

  // -- EFECTOS DE AUDIO --
  useEffect(() => {
    if (encendido && absRPM > 0) {
       const interval = setInterval(() => {
          audio?.playPop(); // Simulación de zumbido de motor (hum)
       }, Math.max(50, 500 / (absRPM/100 + 1)));
       return () => clearInterval(interval);
    }
  }, [encendido, absRPM, audio]);

  const handleValidar = () => {
    const val = parseFloat(alphaInput);
    if (isNaN(val)) {
       audio?.playError();
       return;
    }
    const error = Math.abs(val - absRPM) / (absRPM || 1);
    
    if (error <= 0.05 && absRPM > 500) {
      audio?.playSuccess();
      audio?.playNotification();
      stopCwAnimation();
      
      registrarHallazgo('fis_motor_efficiency', {
        voltaje,
        espiras,
        rpm_estimadas: val,
        rpm_reales: absRPM,
        error_relativo: error,
        sentido: currentDir
      });

      setBitacora({ 
        ...bitacoraData, 
        fisica10: `✅ VALIDADO: Motor P10. RPM=${absRPM}. V=${voltaje}V, N=${espiras}, B=${B}. Eficiencia Certificada.` 
      });
      stopTimer();
      setPasoActual(4);
    } else {
      audio?.playError();
      if (absRPM === 0 && voltaje > 0) {
        audio?.playNotification();
      } else if (absRPM <= 500 && encendido) {
        audio?.playNotification();
      } else if (!encendido) {
        audio?.playNotification();
      } else {
        audio?.playNotification();
      }
    }
  };

  // Turn motor off after success state is recorded
  useEffect(() => {
    if (motor10?.resultado === 'exito') {
      setMotor10({ encendido: false });
    }
  }, [motor10?.resultado]);

  const stopCwAnimation = () => {
    setMotor10({ rpm: absRPM, resultado: 'exito' });
  };

  const handleUpdate = (data: any) => {
    setMotor10(data);
    audio?.playPop();
  };

  if (!mounted) return null;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">

      {/* ── ESCENA 3D — MOTOR DC (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <MotorElectrico3DScene
          voltaje={voltaje}
          campoB={B}
          espiras={espiras}
          rpm={rpmCalculadas}
          encendido={encendido}
        />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#010409]/70 via-transparent to-[#010409]/80" />

      {/* ── ESCENA DE LABORATORIO ELECTROMECÁNICO ── */}
      <main className="flex-grow h-full relative flex flex-col p-12 overflow-hidden z-10 pointer-events-none">

         {/* CHECKLIST HUD (DIAMOND STANDARD) */}
         <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} className="animate-pulse" /> Sincronía Electromecánica
                </span>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Motor Protocol HUD</span>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className={`p-5 rounded-2xl border transition-all ${encendido ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-white/5 border-white/5'}`}>
                  <div className="text-[9px] font-black uppercase text-white/40 mb-2">Energía DC</div>
                  <div className={`text-sm font-black italic ${encendido ? 'text-orange-400' : 'text-white/20'}`}>{encendido ? 'ACTIVE' : 'OFFLINE'}</div>
                </div>
                <div className={`p-5 rounded-2xl border transition-all ${absRPM > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                  <div className="text-[9px] font-black uppercase text-white/40 mb-2">Rotación</div>
                  <div className={`text-sm font-black italic ${absRPM > 0 ? 'text-emerald-400' : 'text-white/20'}`}>{absRPM > 0 ? currentDir : 'STOPPED'}</div>
                </div>
                <div className={`p-5 rounded-2xl border transition-all ${bitacoraData.fisica10 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                  <div className="text-[9px] font-black uppercase text-white/40 mb-2">Certificación</div>
                  <div className={`text-sm font-black italic ${bitacoraData.fisica10 ? 'text-emerald-400' : 'text-white/20'}`}>{bitacoraData.fisica10 ? 'PASSED' : 'PENDING'}</div>
                </div>
              </div>
            </div>
         </div>

         {/* GIANT RPM HUD (CENTRAL) */}
         <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
            <div className="text-[14rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{absRPM}</div>
            <span className="text-xl font-black uppercase tracking-[1em] text-white/20">REVOLUCIONES_POR_MINUTO</span>
         </div>

         {/* HUD SUPERIOR: TELEMETRÍA DE MOTOR */}
         <div className="flex justify-between items-start z-30 pointer-events-none">
            <div className="flex gap-4">
              <HUDCard label="Flujo Magnético (B)" value={B === 1 ? 'N → S' : (B === -1 ? 'S → N' : 'NULLED')} icon={<Compass size={14} />} color="#3b82f6" />
              <HUDCard label="Bobinado (N)" value={`${espiras} Vueltas`} icon={<Workflow size={14} />} color="#facc15" />
              <HUDCard label="Tensión (V)" value={`${voltaje} V DC`} icon={<Zap size={14} />} color="#ef4444" />
            </div>

            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl">
                <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Velocidad Angular</h4>
                   <div className={`text-3xl font-black font-mono tracking-tighter ${absRPM > 2000 ? 'text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-emerald-400'}`}>
                      {absRPM} <span className="text-[10px] text-slate-500 uppercase ml-1 font-sans">RPM</span>
                   </div>
                </div>
                <Gauge className={`text-emerald-400 ${absRPM > 0 ? 'animate-spin-slow' : 'opacity-20'}`} size={32} />
            </div>
         </div>

         {/* BANCO DE PRUEBAS — el motor DC 3D vive en el fondo (z-0). Este hueco
             deja pasar la interacción con OrbitControls (arrastrar / zoom). */}
         <div className="flex-grow" />

         {/* ── PANEL DE CONTROL INFERIOR (DOCK) ── */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-6xl z-40">
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl flex items-center justify-between gap-10 pointer-events-auto"
            >
               {/* Selectores de Ingeniería */}
               <div className="flex gap-8 items-center border-r border-white/10 pr-10">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bobinado N</span>
                    <div className="flex gap-2">
                      {[10, 50, 100].map(n => (
                        <button key={n} onClick={() => handleUpdate({ espiras: n })} className={`w-12 h-10 rounded-xl text-[10px] font-black transition-all ${espiras === n ? 'bg-orange-600 text-white' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tensión DC (V)</span>
                    <input 
                      type="range" min="0" max="24" step="1" value={voltaje}
                      onChange={(e) => handleUpdate({ voltaje: parseInt(e.target.value) })}
                      className="w-32 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-orange-500"
                    />
                  </div>
               </div>

               {/* Suministro y Validación */}
               <div className="flex-1 flex gap-6 items-center">
                  <button 
                    onClick={() => handleUpdate({ encendido: !encendido })}
                    className={`h-16 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all ${encendido ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                  >
                    <Power size={16} /> {encendido ? 'Cortar Energía' : 'Energizar Motor'}
                  </button>

                  <div className="flex-1 relative">
                    <input 
                      type="number" placeholder="Estima las RPM finales..." value={alphaInput}
                      onChange={(e) => setAlphaInput(e.target.value)}
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-black text-xl placeholder:text-white/10 focus:outline-none focus:border-orange-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest">RPM</span>
                  </div>

                  <button 
                    onClick={handleValidar}
                    className="h-16 px-10 bg-orange-600 hover:bg-orange-500 rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 group"
                  >
                    <Target size={18} className="text-white group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-black text-white uppercase">Validar Eficiencia</span>
                  </button>
               </div>
            </motion.div>
         </div>

         {/* MENSAJE TUTOR / ÉXITO */}
         <AnimatePresence>
            {bitacoraData.fisica10 ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12 pointer-events-auto">
                 <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-orange-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(249,115,22,0.15)]">
                    <ShieldCheck size={100} className="text-orange-500 mx-auto mb-8" />
                    <h3 className="text-5xl font-black text-white uppercase italic mb-6">Motor Certificado</h3>
                    <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                       Has calibrado con éxito un motor industrial de alta precisión. Con esta validación, has completado satisfactoriamente el programa de **Física Diamond State**.
                    </p>
                    <div className="flex gap-4">
                      <button onClick={() => resetF10()} className="flex-1 py-6 bg-white/10 hover:bg-white/20 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors">
                        Reiniciar
                      </button>
                      <button onClick={() => router.push('/alumno/laboratorio/fisica')} className="flex-1 py-6 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-orange-600/30">
                        Finalizar Programa de Física
                      </button>
                    </div>
                 </motion.div>
               </motion.div>
            ) : (
               <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute top-40 right-12 z-30 max-w-xs bg-[#0f172a]/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                     <Bot className="text-orange-400" size={24} />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Dr. Quantum: E-Drive</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                    "El torque depende directamente del flujo B, la corriente I (voltaje) y el número de espiras N. Si los imanes se repelen, el campo se anula y el motor no girará. ¡Asegúrate de configurar polos opuestos N-S!"
                  </p>
               </motion.div>
            )}
         </AnimatePresence>

      </main>
    </div>
  );
}

function HUDCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  return (
    <div className={`px-8 py-5 rounded-[2rem] border border-white/10 flex items-center gap-5 transition-all bg-[#0A1121]/80 backdrop-blur-md shadow-2xl`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</span>
        <span className="block text-2xl font-black text-white tracking-tighter leading-none">{value}</span>
      </div>
    </div>
  );
}
