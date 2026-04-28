"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, RotateCcw, Play, Square, Target, 
  CheckCircle2, ShieldAlert, Activity, Globe, Calculator,
  Database, Plus, Lock, ChevronRight, Binary
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import dynamic from 'next/dynamic';

const PenduloSimple3DScene = dynamic(() => import('./simuladores/fis03/PenduloSimple3DScene'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Inicializando Laboratorio Geofísico...</div>
});

const DIALOGOS = {
  1: "SISTEMA DE CONTROL: Protocolo de validación isócrona. Para descartar variables dependientes erróneas, es imperativo demostrar la independencia de la masa en un péndulo simple.\n\nInstrucción: Manteniendo la longitud constante (2.0m), registre el periodo de oscilación (T) para m = 1.0 kg y m = 5.0 kg. Confirme analíticamente que la variación de masa no altera el periodo.",
  2: "SISTEMA DE CONTROL: Comprobación de linealidad. La relación entre la longitud del péndulo (L) y su periodo (T) no es directamente proporcional.\n\nInstrucción: Registre el periodo para L = 1.0m y L = 4.0m. Observe que un aumento cuadrático en la longitud resulta en un aumento lineal en el periodo, confirmando la relación T ∝ √L.",
  3: "SISTEMA DE CONTROL: Adquisición de datos gravitimétricos. Procederemos a determinar la aceleración gravitacional local (g) mediante análisis estadístico.\n\nInstrucción: Modifique la longitud del péndulo para generar 3 mediciones distintas de periodo (T). Registre cada par de datos (L, T) en la Matriz de Muestreo para proceder con el análisis.",
  4: "SISTEMA DE CONTROL: Fase de Análisis Cuantitativo. La base de datos cuenta con muestras suficientes para minimizar el error de medición.\n\nInstrucción: Utilizando el modelo matemático g = (4π²L)/T², procese los datos de la Matriz de Muestreo (promedio) para calcular el valor exacto de la gravedad local en m/s².",
  5: "SISTEMA DE CONTROL: Validación exitosa. El análisis gravitimétrico coincide con los parámetros esperados dentro del margen de error instrumental. Práctica de laboratorio concluida."
};

export default function PilotoPenduloSimple() {
  const router = useRouter();
  const { setBitacora, bitacoraData, audio, setAsistente } = useSimuladorStore();

  // -- SEMILLA: GRAVEDAD MISTERIOSA --
  const [seed] = useState(() => ({
    g: parseFloat((Math.random() * (24.7 - 3.7) + 3.7).toFixed(2))
  }));

  // -- MAQUINA DE ESTADOS PEDAGÓGICA --
  const [fase, setFase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [alertaCritica, setAlertaCritica] = useState<string | null>(null);

  // Estados Físicos
  const [longitud, setLongitud] = useState(2.0); 
  const [masa, setMasa] = useState(1.0); 
  const [isOscilando, setIsOscilando] = useState(false);
  
  // Cronómetro
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0); 
  
  // Inputs de Fase
  const [inputT_M1, setInputT_M1] = useState("");
  const [inputT_M5, setInputT_M5] = useState("");
  const [inputT_L1, setInputT_L1] = useState("");
  const [inputT_L4, setInputT_L4] = useState("");
  const [inputG, setInputG] = useState("");
  
  // Registro de Muestras (Fase 3)
  const [muestras, setMuestras] = useState<{L: number, T: number}[]>([]);

  // Periodo Real para cálculos matemáticos
  const T_real = 2 * Math.PI * Math.sqrt(longitud / seed.g);

  // Forzar parámetros según la fase para guiar al alumno
  useEffect(() => {
    if (fase === 1) setLongitud(2.0); // Bloqueado en fase 1
    if (fase === 2) setMasa(2.0); // Bloqueado en fase 2
  }, [fase]);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de geofísica. Tu misión es determinar la aceleración gravitacional local mediante el análisis de un péndulo simple. Empieza validando la independencia de la masa.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // -- LÓGICA DEL CRONÓMETRO --
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);

  const animateCronometro = useCallback((time: number) => {
    if (lastTimeRef.current !== null) {
      setTiempoTranscurrido(prev => prev + (time - lastTimeRef.current!));
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animateCronometro);
  }, []);

  useEffect(() => {
    if (cronometroActivo) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animateCronometro);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cronometroActivo, animateCronometro]);

  const formatTime = (ms: number) => {
    const safeMs = Math.max(0, ms);
    const totalSeconds = safeMs / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const cents = Math.floor((safeMs % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${cents.toString().padStart(2, '0')}`;
  };

  // -- SISTEMA DE VALIDACIÓN POR FASES --
  const showAlert = (msg: string) => {
    setAlertaCritica(msg);
    setTimeout(() => setAlertaCritica(null), 5000);
  };

  const getExactT = (l: number, g: number) => 2 * Math.PI * Math.sqrt(l / g);

  const handleValidarFase = () => {
    // FASE 1: Calibración de Masa
    if (fase === 1) {
      const v1 = parseFloat(inputT_M1);
      const v5 = parseFloat(inputT_M5);
      if (isNaN(v1) || isNaN(v5)) {
        audio?.playError();
        return showAlert("Debes medir e ingresar ambos periodos.");
      }
      
      const targetT = getExactT(2.0, seed.g);
      if (Math.abs(v1 - targetT) < 0.2 && Math.abs(v5 - targetT) < 0.2) {
        audio?.playSuccess();
        audio?.playNotification();
        setFase(2);
        setIsOscilando(false); setTiempoTranscurrido(0); setCronometroActivo(false);
      } else {
        audio?.playError();
        audio?.playNotification();
        showAlert("Error de medición. Detén el cronómetro EXACTAMENTE al completar 1 oscilación.");
      }
    }
    // FASE 2: Relación de Longitud
    else if (fase === 2) {
      const vl1 = parseFloat(inputT_L1);
      const vl4 = parseFloat(inputT_L4);
      if (isNaN(vl1) || isNaN(vl4)) {
        audio?.playError();
        return showAlert("Debes medir e ingresar ambos periodos.");
      }
      
      const targetT1 = getExactT(1.0, seed.g);
      const targetT4 = getExactT(4.0, seed.g);
      
      if (Math.abs(vl1 - targetT1) < 0.2 && Math.abs(vl4 - targetT4) < 0.2) {
        audio?.playSuccess();
        audio?.playNotification();
        setFase(3);
        setIsOscilando(false); setTiempoTranscurrido(0); setCronometroActivo(false);
      } else {
        audio?.playError();
        showAlert("Medición inexacta. Recuerda: Periodo es ida y vuelta completo.");
      }
    }
    // FASE 3: Toma de Muestras (Avanza automáticamente si hay 3)
    else if (fase === 3) {
      if (muestras.length >= 3) {
        audio?.playSuccess();
        setFase(4);
        setIsOscilando(false);
      } else {
        audio?.playError();
        showAlert("Necesitas registrar al menos 3 muestras en la base de datos.");
      }
    }
    // FASE 4: Análisis Final de Gravedad
    else if (fase === 4) {
      const g = parseFloat(inputG);
      if (isNaN(g)) {
        audio?.playError();
        return showAlert("Ingresa un valor numérico válido.");
      }
      
      if (Math.abs(g - seed.g) < 0.5) {
        audio?.playSuccess();
        audio?.playNotification();
        setFase(5);
        setBitacora({
          ...bitacoraData,
          fisica3: `✅ AUDITORÍA GEOFÍSICA: g=${seed.g} m/s² descubierta usando regresión de ${muestras.length} muestras.`
        });
      } else {
        audio?.playError();
        audio?.playNotification();
        showAlert("ERROR GRAVIMÉTRICO: Los cálculos no coinciden.");
      }
    }
  };

  const handleAgregarMuestra = () => {
    if (tiempoTranscurrido === 0) return showAlert("Usa el cronómetro para medir un periodo antes de registrar.");
    
    // Evitar muestras duplicadas de la misma longitud
    if (muestras.some(m => m.L === longitud)) {
      return showAlert(`Ya tienes una muestra registrada para L = ${longitud}m.`);
    }

    const tMedido = tiempoTranscurrido / 1000; // En segundos
    setMuestras([...muestras, { L: longitud, T: parseFloat(tMedido.toFixed(2)) }]);
    audio?.playPop();
    
    // Resetear cronómetro automáticamente para facilitar el workflow
    setCronometroActivo(false);
    setTiempoTranscurrido(0);
    setIsOscilando(false);
    
    if (muestras.length === 2) {
      setTimeout(() => {
        setAlertaCritica("Muestras recolectadas. Análisis estadístico desbloqueado.");
        setFase(4);
      }, 2000);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      
      {/* 🔮 ESCENA 3D (Background interactivo) */}
      <div className="absolute inset-0 z-0">
        <PenduloSimple3DScene longitud={longitud} masa={masa} isOscilando={isOscilando} gravedad={seed.g} />
      </div>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Sincronía Gravitatoria
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Pendulum Protocol HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${isOscilando ? 'bg-sky-500/10 border-sky-500/30 shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Cinemática</div>
              <div className={`text-sm font-black italic ${isOscilando ? 'text-sky-400' : 'text-white/20'}`}>{isOscilando ? 'OSCILANDO' : 'ESTÁTICA'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${muestras.length > 0 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Registros</div>
              <div className={`text-sm font-black italic ${muestras.length > 0 ? 'text-indigo-400' : 'text-white/20'}`}>{muestras.length}/3 ADQ</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${fase === 5 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Validación</div>
              <div className={`text-sm font-black italic ${fase === 5 ? 'text-emerald-400' : 'text-white/20'}`}>{fase === 5 ? 'COMPLETADA' : 'FASE ' + fase}</div>
            </div>
          </div>
        </div>
      </div>

      {/* GIANT GRAVITY HUD (CENTRAL) */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
         <div className="text-[14rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{seed.g.toFixed(1)}</div>
         <span className="text-xl font-black uppercase tracking-[1em] text-white/20">GRAVEDAD_LOCAL_M/S2</span>
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

      {/* ── PANEL IZQUIERDO: CRONÓMETRO DE PRECISIÓN ── */}
      <div className="absolute top-10 left-10 z-30 flex flex-col gap-5">
         <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-sky-500/30 p-8 rounded-[3rem] shadow-[0_0_50px_rgba(14,165,233,0.15)] w-[380px]">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-sky-500/20 rounded-2xl shadow-inner"><Timer className="text-sky-400" size={20} /></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Telemetría Temporal</span>
               </div>
               <div className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border ${isOscilando ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                  <Activity size={12} className={isOscilando ? 'animate-pulse' : ''} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{isOscilando ? 'Oscilando' : 'Reposo'}</span>
               </div>
            </div>
            
            <div className="bg-[#020617] rounded-[2rem] p-8 border border-slate-800 mb-8 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />
               <span className="text-6xl font-black text-sky-400 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                 {formatTime(tiempoTranscurrido)}
               </span>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.5em] mt-3">MM : SS . MS</span>
            </div>

            <div className="flex justify-between gap-4">
               <button 
                onClick={() => { audio?.playPop(); setCronometroActivo(!cronometroActivo); }} 
                className={`flex-1 py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${cronometroActivo ? 'bg-rose-600 text-white shadow-rose-600/20 hover:bg-rose-500' : 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-500'}`}
               >
                 {cronometroActivo ? <Square size={18} fill="white"/> : <Play size={18} fill="white"/>} {cronometroActivo ? 'Parar' : 'Iniciar'}
               </button>
               <button 
                onClick={() => { audio?.playPop(); setCronometroActivo(false); setTiempoTranscurrido(0); }} 
                className="w-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-95"
               >
                 <RotateCcw size={22} />
               </button>
            </div>
         </motion.div>

         {/* PANEL EXTRA: MATRIZ DE DATOS (Solo visible a partir de Fase 3) */}
         <AnimatePresence>
           {fase >= 3 && fase < 5 && (
              <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-indigo-500/30 p-8 rounded-[3rem] w-[380px] shadow-2xl">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/20 rounded-2xl"><Database className="text-indigo-400" size={20} /></div>
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Registros (n={muestras.length}/3)</span>
                    </div>
                    {fase === 3 && (
                      <button onClick={handleAgregarMuestra} className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-2xl transition-all active:scale-90 shadow-lg shadow-indigo-600/30">
                        <Plus size={20} />
                      </button>
                    )}
                 </div>
                 <div className="space-y-3">
                    <div className="grid grid-cols-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700/50 pb-3 mb-3 text-center">
                       <span>Longitud</span>
                       <span>Periodo</span>
                       <span>T²</span>
                    </div>
                    {muestras.length === 0 ? (
                      <div className="text-center py-8 text-slate-600 text-[11px] uppercase font-bold tracking-[0.2em] italic">Awaiting Telemetry...</div>
                    ) : (
                      muestras.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-3 text-sm font-mono text-slate-300 text-center bg-[#020617] py-4 rounded-2xl border border-white/5 transition-all hover:border-indigo-500/30 group">
                           <span className="font-black text-white/40">{m.L}m</span>
                           <span className="text-sky-400 font-black">{m.T}s</span>
                           <span className="text-indigo-400 font-black">{(m.T * m.T).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                 </div>
              </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* ── PANEL DERECHO: ORDENADOR DE ANÁLISIS GEOFÍSICO ── */}
      <div className="absolute top-10 right-10 z-40 w-[400px] flex flex-col gap-5">
         <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/95 backdrop-blur-2xl border border-amber-500/20 p-8 rounded-[2.5rem] shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
               <div className="flex items-center gap-3">
                  <Globe className="text-amber-400" size={24} />
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em]">Fase Analítica {fase}/4</span>
               </div>
               <Calculator size={20} className="text-slate-600" />
            </div>

            {/* INPUTS DINÁMICOS SEGÚN FASE */}
            <div className="space-y-5 mb-8">
               {fase === 1 && (
                  <>
                    <InputFase label="Periodo a Masa = 1kg (s)" value={inputT_M1} onChange={setInputT_M1} />
                    <InputFase label="Periodo a Masa = 5kg (s)" value={inputT_M5} onChange={setInputT_M5} />
                  </>
               )}
               {fase === 2 && (
                  <>
                    <InputFase label="Periodo a L = 1m (s)" value={inputT_L1} onChange={setInputT_L1} />
                    <InputFase label="Periodo a L = 4m (s)" value={inputT_L4} onChange={setInputT_L4} />
                  </>
               )}
               {fase === 3 && (
                  <div className="text-center py-6 border border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
                     <Binary className="mx-auto text-slate-500 mb-2 animate-pulse" size={30} />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recolectando Muestras en HUD Izquierdo...</span>
                  </div>
               )}
               {fase >= 4 && (
                  <>
                    <div className="bg-[#020617] p-5 rounded-2xl border border-amber-500/30 mb-4 flex justify-between items-center">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Ecuación Gravitatoria</span>
                          <span className="text-sm font-mono text-white font-bold">g = (4π² · L) / T²</span>
                       </div>
                    </div>
                    <InputFase label="Gravedad (g) Calculada (m/s²)" value={inputG} onChange={setInputG} highlight />
                  </>
               )}
            </div>

            {fase !== 3 && fase !== 5 && (
              <button 
                onClick={handleValidarFase} 
                className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] shadow-[0_0_30px_rgba(217,119,6,0.2)] hover:shadow-[0_0_40px_rgba(217,119,6,0.4)] active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Target size={18} /> Validar Datos
              </button>
            )}
         </motion.div>
      </div>

      {/* ── CONSOLA DEL DR. QUANTUM (Panel Inferior) ── */}
      <div className="absolute bottom-10 left-10 right-10 z-50 flex gap-6 pointer-events-none">
         
         {/* Diálogo Narrativo */}
         <motion.div key={fase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-grow bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-700/50 p-6 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex items-center gap-6 pointer-events-auto">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
               {/* Avatar Dr. Quantum genérico */}
               <div className="w-full h-full bg-[url('https://api.dicebear.com/7.x/bottts/svg?seed=Quantum&backgroundColor=1e293b')] bg-cover" />
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-line">
               {DIALOGOS[fase]}
            </p>
         </motion.div>

         {/* Controles Físicos (Bloqueables) */}
         <div className="flex-shrink-0 bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-700/50 p-6 rounded-[2.5rem] shadow-xl flex items-center gap-8 pointer-events-auto">
            <ControlSlider 
              label="Longitud (L)" value={longitud} min={1.0} max={6.0} step={1.0} unit="m" color="sky" 
              onChange={setLongitud} locked={fase === 1 || fase === 4} 
            />
            <ControlSlider 
              label="Masa (m)" value={masa} min={1.0} max={5.0} step={1.0} unit="kg" color="emerald" 
              onChange={setMasa} locked={fase === 2 || fase === 4} 
            />
            <div className="pl-4 border-l border-slate-700">
               <button 
                onClick={() => {
                  const nextState = !isOscilando;
                  setIsOscilando(nextState);
                  audio.playPop();
                  if (nextState) {
                    audio.playNotification();
                  }
                }} 
                className={`h-14 w-14 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-lg ${isOscilando ? 'bg-rose-600 text-white shadow-rose-600/30' : 'bg-sky-600 text-white shadow-sky-600/30'}`}
               >
                 {isOscilando ? <Square fill="currentColor" size={20} /> : <Play fill="currentColor" size={20} className="ml-1" />}
               </button>
            </div>
         </div>
      </div>

      {/* ── MODAL DE ÉXITO FINAL ── */}
      <AnimatePresence>
        {fase === 5 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[200] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-10 text-center">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-amber-500/30 rounded-[4rem] p-20 max-w-2xl shadow-[0_0_100px_rgba(217,119,6,0.2)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
                <CheckCircle2 size={100} className="text-amber-500 mx-auto mb-8 relative z-10" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6 leading-none tracking-tighter relative z-10">Laboratorio Superado</h3>
                <p className="text-slate-400 text-lg font-medium mb-12 px-8 relative z-10">
                  El análisis estadístico confirma que la aceleración gravitacional local es <strong className="text-amber-400">{seed.g} m/s²</strong>. <br/><br/>
                  Los datos recogidos validan la independencia de la masa respecto al periodo y confirman empíricamente la relación cuadrática de la longitud.
                </p>
                <button 
                  onClick={() => router.push('/alumno/laboratorio/fisica')} 
                  className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-amber-600/30 relative z-10"
                >
                  Registrar en Bitácora Final
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
         type="number" 
         placeholder="0.00"
         value={value}
         onChange={(e) => onChange(e.target.value)}
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
          <span className={`text-sm font-black italic tracking-tighter ${color === 'sky' ? 'text-sky-300' : 'text-emerald-300'}`}>
            {value.toFixed(1)}{unit}
          </span>
       </div>
       <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
        disabled={locked}
        className={`w-full h-1.5 bg-slate-700 rounded-full appearance-none ${locked ? 'cursor-not-allowed' : 'cursor-pointer'} ${color === 'sky' ? 'accent-sky-500' : 'accent-emerald-500'}`} 
       />
    </div>
  );
}
