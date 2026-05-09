"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Power, RotateCcw, Activity, 
  CheckCircle2, AlertCircle, Binary, 
  Gauge, Battery, Target, Play, Pause, Bot, ShieldCheck
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import Ohm3DScene from './simuladores/fis08/Ohm3DScene';

// ==========================================
// Constantes y Lógica de Colores de Resistencia
// ==========================================

const COLOR_CODES = [
  { val: 0, color: '#000000' }, { val: 1, color: '#92400e' },
  { val: 2, color: '#ef4444' }, { val: 3, color: '#f97316' },
  { val: 4, color: '#facc15' }, { val: 5, color: '#22c55e' },
  { val: 6, color: '#3b82f6' }, { val: 7, color: '#a855f7' },
  { val: 8, color: '#64748b' }, { val: 9, color: '#ffffff' }
];

const getResistorBands = (val: number) => {
  const s = Math.floor(val).toString();
  const digit1 = parseInt(s[0]) || 0;
  const digit2 = s.length > 1 ? parseInt(s[1]) : 0;
  const multiplier = Math.max(0, s.length - (s.length > 1 ? 2 : 1));
  
  return [
    COLOR_CODES[digit1]?.color || '#000',
    COLOR_CODES[digit2]?.color || '#000',
    COLOR_CODES[multiplier]?.color || '#000'
  ];
};

export default function PilotoLeyOhm() {
  const router = useRouter();
  const { ohm8, setOhm8, setBitacora, bitacoraData, stopTimer, setPasoActual, audio, setAsistente, registrarHallazgo } = useSimuladorStore();
  const { voltaje = 12, resistencia = 1000, switchOn = false, ledRoto = false } = ohm8 || {};

  const [alphaInput, setAlphaInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSchematic, setIsSchematic] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de electrónica. Tu misión es configurar una resistencia de carga para proteger el LED de una sobreintensidad. Usa la ley de Ohm: V = I · R.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // -- CÁLCULOS FÍSICOS --
  const corriente = switchOn && !ledRoto ? voltaje / resistencia : 0;
  const corrienteMA = corriente * 1000;
  const potencia = voltaje * corriente;

  // -- EFECTO DE PROTECCIÓN Y AUDIO --
  useEffect(() => {
    if (corrienteMA > 40 && !ledRoto) {
      audio?.playError();
      audio?.playNotification();
      setOhm8({ ledRoto: true, switchOn: false });
    }
    if (switchOn && !ledRoto) {
       const interval = setInterval(() => audio?.playPop(), 1000 / (corrienteMA + 1));
       return () => clearInterval(interval);
    }
  }, [corrienteMA, ledRoto, switchOn, setOhm8, audio]);

  const handleValidar = () => {
    const val = parseFloat(alphaInput);
    if (isNaN(val)) {
       audio?.playError();
       return;
    }
    const error = Math.abs(val - resistencia) / resistencia;
    
    if (error <= 0.05 && switchOn && !ledRoto) {
      audio?.playSuccess();
      stopTimer();
      setPasoActual(4);
      
      // Registrar hallazgo eléctrico granular
      registrarHallazgo('fisica_ohm_validacion', {
        voltaje,
        resistencia_objetivo: resistencia,
        resistencia_ingresada: val,
        intensidad_ma: parseFloat(corrienteMA.toFixed(2)),
        potencia_w: parseFloat(potencia.toFixed(3)),
        error_relativo: parseFloat(error.toFixed(4))
      });

      setBitacora({ 
        ...bitacoraData, 
        fisica8: `✅ VALIDADO: V=${voltaje}V. R=${resistencia}Ω. I=${corrienteMA.toFixed(2)}mA. Potencia=${potencia.toFixed(3)}W.` 
      });
    } else {
      audio?.playError();
      if (ledRoto) {
        audio?.playNotification();
      } else if (!switchOn) {
        audio?.playNotification();
      } else {
        audio?.playNotification();
      }
    }
  };

  const toggleSwitch = () => {
    if (ledRoto) {
      audio?.playError();
      return;
    }
    // Solo permitir encender si el nivel está completado correctamente
    const nivelCompletado = (ohm8.nivel === 1 && ohm8.bateriaConectada && ohm8.ledConectado) ||
                           (ohm8.nivel === 2 && ohm8.bateriaConectada && ohm8.resistenciaConectada && ohm8.ledConectado) ||
                           (ohm8.nivel === 3 && ohm8.bateriaConectada && ohm8.resistenciaConectada && ohm8.ledConectado);
    
    if (!nivelCompletado && !switchOn) {
      audio?.playError();
      return;
    }

    setOhm8({ switchOn: !switchOn });
    audio?.playPop();
  };

  const toggleConexion = (component: 'bateria' | 'resistencia' | 'led') => {
    const { nivel, bateriaConectada, resistenciaConectada } = ohm8;
    audio?.playPop();

    if (nivel === 1) {
      if (component === 'bateria') setOhm8({ bateriaConectada: !ohm8.bateriaConectada });
      if (component === 'led') {
        if (!bateriaConectada) { audio?.playError(); return; } // Orden estricto
        setOhm8({ ledConectado: !ohm8.ledConectado });
      }
    } else if (nivel >= 2) {
      if (component === 'bateria') setOhm8({ bateriaConectada: !ohm8.bateriaConectada });
      if (component === 'resistencia') {
        if (!bateriaConectada) { audio?.playError(); return; }
        setOhm8({ resistenciaConectada: !ohm8.resistenciaConectada });
      }
      if (component === 'led') {
        if (!resistenciaConectada) { audio?.playError(); return; }
        setOhm8({ ledConectado: !ohm8.ledConectado });
      }
    }
  };

  const cambiarNivel = (n: number) => {
    audio?.playNotification();
    setOhm8({ nivel: n, switchOn: false, ledRoto: false, bateriaConectada: false, resistenciaConectada: false, ledConectado: false });
  };

  if (!mounted) return null;

  return (
    <div className={`flex h-full w-full overflow-hidden font-['Outfit'] relative transition-colors duration-500 ${isDarkMode ? 'bg-[#010409] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* ── ESCENA DE LABORATORIO ELECTRÓNICO ── */}
      <main className="flex-grow h-full relative flex flex-col p-12 overflow-hidden">
         
         {/* CHECKLIST HUD (BOTTOM-RIGHT) */}
         <div className="absolute bottom-48 right-12 w-[300px] pointer-events-none z-50">
            <div className={`backdrop-blur-3xl border rounded-[2.5rem] p-6 shadow-2xl ${isDarkMode ? 'bg-black/40 border-white/10' : 'bg-white/60 border-black/10'}`}>
              <div className="flex items-center justify-between mb-6">
                 <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2">
                   <Activity size={12} className="animate-pulse" /> {
                     ohm8.nivel === 1 ? 'Módulo 01: Circuito Base' :
                     ohm8.nivel === 2 ? 'Módulo 02: Resistencia' :
                     'Módulo 03: Certificación'
                   }
                 </span>
                 <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-white/20' : 'text-slate-900/40'}`}>Ohm Protocol HUD</span>
               </div>
              
               <div className="flex flex-col gap-2 mb-4">
                 <button 
                   onClick={() => setIsDarkMode(!isDarkMode)}
                   className={`w-full py-2 border rounded-xl text-[8px] font-black uppercase transition-all pointer-events-auto ${isDarkMode ? 'bg-white/5 border-white/10 text-blue-400 hover:bg-blue-500/10' : 'bg-slate-200 border-slate-300 text-blue-600 hover:bg-slate-300'}`}
                 >
                   Filtro {isDarkMode ? 'Día' : 'Noche'}
                 </button>
                 <button 
                   onClick={() => setIsSchematic(!isSchematic)}
                   className={`w-full py-2 border rounded-xl text-[8px] font-black uppercase transition-all pointer-events-auto ${isSchematic ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : (isDarkMode ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-600')}`}
                 >
                   Vista {isSchematic ? 'Física' : 'Esquemática'}
                 </button>
               </div>
              
              <div className="flex flex-col gap-4">
                <div className={`p-4 rounded-2xl border transition-all ${switchOn ? (isDarkMode ? 'bg-blue-500/10 border-blue-500/30' : 'bg-blue-500/5 border-blue-500/20') : (isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-200/50 border-slate-300')}`}>
                  <div className={`text-[8px] font-black uppercase mb-1 ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>Conducción</div>
                  <div className={`text-[10px] font-black italic ${switchOn ? 'text-blue-500' : (isDarkMode ? 'text-white/20' : 'text-slate-400')}`}>{switchOn ? 'ACTIVA' : 'OFFLINE'}</div>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${ledRoto ? 'bg-red-500/10 border-red-500/30' : (corrienteMA > 0 ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-500/5 border-emerald-500/20') : (isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-200/50 border-slate-300'))}`}>
                  <div className={`text-[8px] font-black uppercase mb-1 ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>Estado LED</div>
                  <div className={`text-[10px] font-black italic ${ledRoto ? 'text-red-500' : (corrienteMA > 0 ? 'text-emerald-500' : (isDarkMode ? 'text-white/20' : 'text-slate-400'))}`}>{ledRoto ? 'RUPTURA' : (corrienteMA > 0 ? 'NOMINAL' : 'ESPERA')}</div>
                </div>
                <div className={`p-4 rounded-2xl border transition-all ${bitacoraData.fisica8 ? (isDarkMode ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-500/5 border-emerald-500/20') : (isDarkMode ? 'bg-white/5 border-white/5' : 'bg-slate-200/50 border-slate-300')}`}>
                  <div className={`text-[8px] font-black uppercase mb-1 ${isDarkMode ? 'text-white/40' : 'text-slate-500'}`}>Impedancia</div>
                  <div className={`text-[10px] font-black italic ${bitacoraData.fisica8 ? 'text-emerald-500' : (isDarkMode ? 'text-white/20' : 'text-slate-400')}`}>{bitacoraData.fisica8 ? 'CERTIFICADA' : 'PENDIENTE'}</div>
                </div>
              </div>
            </div>
         </div>

         {/* HOLOGRAPHIC HEADER (RE-INTEGRATED TEXT) */}
         <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-40">
            <div className={`text-6xl font-black font-mono leading-none tracking-tighter italic transition-colors ${isDarkMode ? 'text-white/10' : 'text-slate-900/10'}`}>
              {resistencia.toFixed(0)} <span className="text-2xl not-italic">Ω</span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-[1em] transition-colors ${isDarkMode ? 'text-white/20' : 'text-slate-900/30'}`}>IMPEDANCIA_ACTUAL</span>
         </div>

         {/* HUD SUPERIOR: TELEMETRÍA DE CARGA */}
         <div className="flex justify-between items-start z-30 pointer-events-none">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <HUDCard label="Fuente de Poder (V)" value={`${voltaje} V`} icon={<Battery size={14} />} color="#3b82f6" highlight={switchOn} />
                <HUDCard label="Intensidad (I)" value={`${corrienteMA.toFixed(2)} mA`} icon={<Zap size={14} />} color={corrienteMA > 30 ? "#ef4444" : "#facc15"} highlight={switchOn} />
              </div>
              {/* LEVEL SELECTOR HUD */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-3 rounded-2xl flex gap-2 pointer-events-auto">
                {[1, 2, 3].map(n => (
                  <button 
                    key={n} onClick={() => cambiarNivel(n)}
                    className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${ohm8.nivel === n ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                  >
                    Módulo 0{n}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE OSCILLOSCOPE (DIAMOND STATE FEATURE) */}
            <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] flex flex-col gap-4 shadow-2xl w-[300px]">
                <div className="flex justify-between items-center">
                   <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest italic">Live Oscilloscope</h4>
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20" />
                   </div>
                </div>
                
                <div className="h-24 w-full bg-black/40 rounded-xl relative overflow-hidden border border-white/5">
                   <svg viewBox="0 0 100 40" className="w-full h-full">
                      {/* Grid */}
                      <path d="M 0 20 L 100 20 M 50 0 L 50 40" stroke="white" strokeWidth="0.1" opacity="0.2" />
                      {/* Sinusoidal ripple approximation */}
                      <motion.path 
                        animate={{ d: switchOn ? [
                          "M 0 20 Q 25 10 50 20 T 100 20",
                          "M 0 20 Q 25 30 50 20 T 100 20",
                          "M 0 20 Q 25 10 50 20 T 100 20"
                        ] : "M 0 20 L 100 20" }}
                        transition={{ repeat: Infinity, duration: 0.1 / (corriente + 0.01), ease: "linear" }}
                        stroke={corrienteMA > 35 ? "#ef4444" : "#60a5fa"}
                        strokeWidth="1" fill="none"
                      />
                   </svg>
                   <div className="absolute bottom-2 right-3 text-[8px] font-black text-white/20 uppercase tracking-widest">Time/Div: 2ms</div>
                </div>

                <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                   <span>Freq: {switchOn ? '60.0 Hz' : '0.0 Hz'}</span>
                   <span>Vpp: {switchOn ? `${(voltaje * 1.05).toFixed(1)}V` : '0.0V'}</span>
                </div>
            </div>
         </div>

         {/* ESCENA 3D (DIAMOND STATE) */}
           <div className="flex-grow relative z-10 w-full h-full min-h-[400px] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
               <Ohm3DScene 
                 isDarkMode={isDarkMode}
                 isSchematic={isSchematic}
                 nivel={ohm8.nivel}
                 voltaje={voltaje} 
                 resistencia={resistencia} 
                 switchOn={switchOn} 
                 ledRoto={ledRoto} 
                 bateriaConectada={ohm8.bateriaConectada ?? false}
                 resistenciaConectada={ohm8.resistenciaConectada ?? false}
                 ledConectado={ohm8.ledConectado ?? false}
                 onToggleConexion={toggleConexion}
                 onChangeResistencia={(val: number) => setOhm8({ resistencia: val })}
               />
           </div>

         {/* ── PANEL DE CONTROL INFERIOR (DOCK) ── */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-6xl z-40">
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl flex items-center justify-between gap-10"
            >
               {/* Selectores de Resistencia */}
               <div className="flex gap-8 items-center border-r border-white/10 pr-10">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Impedancia de Carga</span>
                    <div className="flex gap-2">
                      {[100, 220, 470, 1000].map(r => (
                        <button key={r} onClick={() => { audio.playPop(); setOhm8({ resistencia: r, ledRoto: false }); }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${resistencia === r ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                          {r} Ω
                        </button>
                      ))}
                    </div>
                  </div>
               </div>

               {/* Acción Eléctrica */}
               <div className="flex-1 flex gap-6 items-center">
                  <div className="flex-1 relative">
                    <input 
                      type="number" placeholder="Resistencia para 20mA..." value={alphaInput}
                      onChange={(e) => setAlphaInput(e.target.value)}
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-black text-xl placeholder:text-white/10 focus:outline-none focus:border-blue-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest">Ω (R=V/I)</span>
                  </div>

                  <button 
                    onClick={toggleSwitch}
                    className={`h-16 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all ${switchOn ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                  >
                    {switchOn ? <Pause size={16} /> : <Play size={16} />}
                    {switchOn ? 'Abrir Circuito' : 'Cerrar Circuito'}
                  </button>
               </div>

               {/* Validación */}
               <div className="flex items-center gap-4">
                  <button onClick={handleValidar} className="h-16 px-10 bg-blue-600 hover:bg-blue-500 rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 group">
                     <Target size={18} className="text-white group-hover:rotate-12 transition-transform" />
                     <span className="text-xs font-black text-white uppercase">Validar V=IR</span>
                  </button>

                  <button onClick={() => { audio.playPop(); setAlphaInput(""); setOhm8({ ledRoto: false, switchOn: false, resistencia: 1000 }); }} className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                     <RotateCcw size={20} />
                  </button>
               </div>
            </motion.div>
         </div>

         {/* MENSAJE TUTOR / ÉXITO */}
         <AnimatePresence>
            {bitacoraData.fisica8 ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
                 <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-blue-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(59,130,246,0.15)]">
                    <ShieldCheck size={100} className="text-blue-500 mx-auto mb-8" />
                    <h3 className="text-5xl font-black text-white uppercase italic mb-6">Ingeniería Certificada</h3>
                    <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                       Has diseñado un circuito de protección perfecto. La relación entre voltaje, intensidad y resistencia ha sido validada bajo el estándar **Diamond State**.
                    </p>
                    <button onClick={() => router.push('/alumno/laboratorio/fisica')} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-blue-600/30">
                       Cerrar Informe de Carga
                    </button>
                 </motion.div>
               </motion.div>
            ) : (
               <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute top-40 right-12 z-30 max-w-xs bg-[#0f172a]/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                     <Bot className="text-blue-400" size={24} />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Dr. Quantum: E-Lab</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                     "El LED es un componente delicado. Si la corriente supera los 35mA, la potencia disipada lo destruirá. Calcula la resistencia necesaria usando R = V / 0.02 para un flujo seguro de 20mA."
                  </p>
               </motion.div>
            )}
         </AnimatePresence>

      </main>
    </div>
  );
}

function HUDCard({ label, value, icon, color, highlight = false, isStatic = false }: any) {
  return (
    <motion.div 
      animate={highlight ? { scale: [1, 1.05, 1], borderColor: [color, "#FFF", color] } : {}}
      transition={{ duration: 0.5, repeat: highlight ? Infinity : 0 }}
      className={`px-8 py-5 rounded-[2rem] border border-white/10 flex items-center gap-5 transition-all ${isStatic ? 'bg-white/5' : 'bg-[#0A1121]/80 backdrop-blur-md shadow-2xl'}`}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</span>
        <span className="block text-2xl font-black text-white tracking-tighter leading-none">{value}</span>
      </div>
    </motion.div>
  );
}
