"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Timer, RotateCcw, Play, Square, Target, 
  CheckCircle2, ShieldAlert, Activity, Database, Plus, Lock, Globe, Calculator, Binary
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

const LeyHooke3DScene = dynamic(() => import('./simuladores/fis04/LeyHooke3DScene'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#010409] flex items-center justify-center text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Inicializando Laboratorio Geofísico...</div>
});

const DIALOGOS = {
  1: "SISTEMA DE CONTROL: Fase 1. Análisis Estructural. Todo amortiguador aeroespacial requiere calibración de rigidez. Proceda a medir la compresión máxima (x) desde el estado de reposo del pistón.\n\nInstrucción: Desactive el impacto. Aplique masas de prueba de 1.0 kg y 2.0 kg. Utilice la Telemetría Láser para registrar la compresión 'x'. Verifique la proporcionalidad de la carga.",
  2: "SISTEMA DE CONTROL: Fase 2. Independencia Cinemática. La constante de rigidez (k) rige la frecuencia natural del ensamblaje mecánico libre de amortiguamiento interno.\n\nInstrucción: Fije la carga en 2.0 kg. Provoque un impacto (oscilación). Mida el periodo (T) para una amplitud inicial de 0.5m y luego para 1.5m. Confirme que la amplitud del impacto no altera el periodo de oscilación.",
  3: "SISTEMA DE CONTROL: Fase 3. Adquisición Tensoriana. Hemos insertado una aleación experimental en el émbolo con una constante 'k' desconocida.\n\nInstrucción: Active el sistema de impacto. Modifique la carga para extraer 3 lecturas distintas del periodo (T). Registre los pares de datos en la Matriz de Telemetría (Botón +).",
  4: "SISTEMA DE CONTROL: Fase 4. Espectroscopía Analítica. El ordenador central cuenta con muestras suficientes para certificar la suspensión.\n\nInstrucción: Utilizando el modelo T = 2π√(m/k), despeje 'k' y calcule el valor exacto de la rigidez del ensamblaje (N/m). Introduzca el resultado para su validación de vuelo.",
  5: "SISTEMA DE CONTROL: Validación de Vuelo Exitosa. El coeficiente de absorción de impacto coincide con las especificaciones del Rover. El tren de aterrizaje está certificado y listo para el despliegue orbital. Práctica concluida."
};

const GRAVEDAD = 9.81;

export default function PilotoLeyHooke() {
  const router = useRouter();
  const { setBitacora, bitacoraData, audio, setAsistente, registrarHallazgo, stopTimer, setPasoActual } = useSimuladorStore();

  useEffect(() => {
    // Limpiar estado de aprobación de sesión anterior
    useSimuladorStore.getState().setBitacora({
      ...useSimuladorStore.getState().bitacoraData,
      fisica4: null
    });
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio geofísico. Tu misión es certificar el tren de aterrizaje de un Rover midiendo la rigidez estructural de los amortiguadores. Sigue el protocolo de calibración.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // -- SEMILLA: CONSTANTE K MISTERIOSA --
  const [seed] = useState(() => ({
    k: parseFloat((Math.random() * (60 - 20) + 20).toFixed(1))
  }));

  // -- MAQUINA DE ESTADOS PEDAGÓGICA --
  const [fase, setFase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [alertaCritica, setAlertaCritica] = useState<string | null>(null);

  // Estados Físicos
  const [masa, setMasa] = useState(1.0); 
  const [amplitud, setAmplitud] = useState(0.5); 
  const [isOscilando, setIsOscilando] = useState(false);
  
  // Cronómetro y Telemetría
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0); 
  const [tiempoFisico, setTiempoFisico] = useState(0); // Para la onda y la animación
  
  // Inputs de Fase
  const [inputX_M1, setInputX_M1] = useState("");
  const [inputX_M2, setInputX_M2] = useState("");
  const [inputT_A05, setInputT_A05] = useState("");
  const [inputT_A15, setInputT_A15] = useState("");
  const [inputK, setInputK] = useState("");
  
  // Registro de Muestras (Fase 3)
  const [muestras, setMuestras] = useState<{m: number, T: number}[]>([]);

  // Telemetría calculada en tiempo real
  const elongacionEstatica = (masa * GRAVEDAD) / seed.k;

  // Forzar parámetros según la fase
  useEffect(() => {
    if (fase === 1) { setIsOscilando(false); }
    if (fase === 2) { setMasa(2.0); }
    audio?.playNotification();
  }, [fase, audio]);

  // -- LÓGICA DEL TIEMPO (Cronómetro y Física) --
  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);

  const animateTiempo = useCallback((time: number) => {
    if (lastTimeRef.current !== null) {
      const delta = time - lastTimeRef.current;
      if (cronometroActivo) setTiempoTranscurrido(prev => prev + delta);
      if (isOscilando) setTiempoFisico(prev => prev + (delta / 1000));
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animateTiempo);
  }, [cronometroActivo, isOscilando]);

  useEffect(() => {
    if (cronometroActivo || isOscilando) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animateTiempo);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      lastTimeRef.current = null;
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [cronometroActivo, isOscilando, animateTiempo]);

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
    audio?.playError();
    setAlertaCritica(msg);
    setTimeout(() => setAlertaCritica(null), 6000);
  };

  const getExactT = (m: number, k: number) => 2 * Math.PI * Math.sqrt(m / k);
  const getExactX = (m: number, k: number) => (m * GRAVEDAD) / k;

  const handleValidarFase = () => {
    // FASE 1: Estática
    if (fase === 1) {
      const x1 = parseFloat(inputX_M1);
      const x2 = parseFloat(inputX_M2);
      if (isNaN(x1) || isNaN(x2)) return showAlert("Lecturas de elongación (x) incompletas.");
      
      const targetX1 = getExactX(1.0, seed.k);
      const targetX2 = getExactX(2.0, seed.k);
      
      if (Math.abs(x1 - targetX1) < 0.1 && Math.abs(x2 - targetX2) < 0.1) {
        audio?.playSuccess();
        setFase(2);
      } else {
        showAlert("Discrepancia detectada. Revise el Sensor Láser de Elongación Total en el panel de telemetría.");
      }
    }
    // FASE 2: Cinemática
    else if (fase === 2) {
      const t1 = parseFloat(inputT_A05);
      const t2 = parseFloat(inputT_A15);
      if (isNaN(t1) || isNaN(t2)) return showAlert("Mediciones de periodo (T) incompletas.");
      
      const targetT = getExactT(2.0, seed.k);
      
      if (Math.abs(t1 - targetT) < 0.2 && Math.abs(t2 - targetT) < 0.2) {
        audio?.playSuccess();
        setFase(3);
        setIsOscilando(false); setTiempoTranscurrido(0); setCronometroActivo(false);
      } else {
        showAlert("Inconsistencia temporal. Recuerde usar el cronómetro midiendo una oscilación completa (ida y vuelta).");
      }
    }
    // FASE 3: Muestreo
    else if (fase === 3) {
      if (muestras.length >= 3) {
        audio?.playSuccess();
        setFase(4);
        setIsOscilando(false);
      } else {
        showAlert("Protocolo requiere un mínimo de 3 registros empíricos en la base de datos.");
      }
    }
    // FASE 4: Regresión Analítica
    else if (fase === 4) {
      const kCalc = parseFloat(inputK);
      if (isNaN(kCalc)) return showAlert("Formato numérico de rigidez inválido.");
      
      if (Math.abs(kCalc - seed.k) < 1.0) {
        audio?.playSuccess();
        setFase(5);
        
        registrarHallazgo('fis_hooke_rigidez', {
          k_semilla: seed.k,
          k_calculada: kCalc,
          muestras_data: muestras
        });

        stopTimer();
        setPasoActual(4);

        setBitacora({
          ...bitacoraData,
          fisica4: `✅ APROBADO: Tren de aterrizaje certificado con rigidez estructural de k=${seed.k} N/m tras superación de prueba de rebote con ${muestras.length} cargas de prueba.`
        });
      } else {
        showAlert(`Fallo de Certificación. La rigidez real no es ${kCalc}. Aplique el modelo: k = (4π²m)/T² a sus datos telemetricos.`);
      }
    }
  };

  const handleAgregarMuestra = () => {
    if (tiempoTranscurrido === 0) return showAlert("Cronómetro inactivo. Debe medir un periodo antes de registrar el evento.");
    
    if (muestras.some(m => m.m === masa)) {
      return showAlert(`Dato redundante. Ya existe un registro para Masa = ${masa}kg.`);
    }

    const tMedido = tiempoTranscurrido / 1000;
    setMuestras([...muestras, { m: masa, T: parseFloat(tMedido.toFixed(2)) }]);
    audio?.playPop();
    
    setCronometroActivo(false);
    setTiempoTranscurrido(0);
    setIsOscilando(false);
    
    if (muestras.length === 2) {
      setTimeout(() => {
        setAlertaCritica("Muestras recolectadas. Análisis cuantitativo desbloqueado.");
        setFase(4);
      }, 2000);
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      
      {/* 🔮 ESCENA 3D (Background interactivo) */}
      <div className="absolute inset-0 z-0">
        <LeyHooke3DScene k={seed.k} masa={masa} amplitud={amplitud} isOscilando={isOscilando} tiempoOscilacion={tiempoFisico} />
      </div>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Sincronía de Elasticidad
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Hooke Protocol HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${fase >= 2 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Estática</div>
              <div className={`text-sm font-black italic ${fase >= 2 ? 'text-amber-400' : 'text-white/20'}`}>{fase >= 2 ? 'VALIDADA' : 'PENDIENTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${fase >= 3 ? 'bg-sky-500/10 border-sky-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Cinemática</div>
              <div className={`text-sm font-black italic ${fase >= 3 ? 'text-sky-400' : 'text-white/20'}`}>{fase >= 3 ? 'VALIDADA' : 'PENDIENTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${fase >= 5 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Certificación</div>
              <div className={`text-sm font-black italic ${fase >= 5 ? 'text-emerald-400' : 'text-white/20'}`}>{fase >= 5 ? 'COMPLETA' : 'PENDIENTE'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* GIANT ELASTICITY HUD (CENTRAL) */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
         <div className="text-[14rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{seed.k.toFixed(0)}</div>
         <span className="text-xl font-black uppercase tracking-[1em] text-white/20">RIGIDEZ_NEWTON/M</span>
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

      {/* ── PANEL IZQUIERDO: TELEMETRÍA Y CRONÓMETRO ── */}
      <div className="absolute top-10 left-10 z-30 flex flex-col gap-5">
         
         {/* HUD: Sensor Láser */}
         <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-cyan-500/30 p-6 rounded-[2rem] shadow-[0_0_50px_rgba(6,182,212,0.15)] w-[360px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-cyan-500/20 rounded-xl"><Target className="text-cyan-400" size={16} /></div>
              <span className="text-[10px] font-black text-cyan-300 uppercase tracking-[0.2em]">Telemetría de Pistón</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/80 p-4 rounded-xl border border-slate-700">
               <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Compresión Estática (x)</span>
               <span className="text-xl font-mono font-bold text-cyan-400">{elongacionEstatica.toFixed(2)} m</span>
            </div>
         </motion.div>

         {/* HUD: Cronómetro */}
         <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-sky-500/30 p-8 rounded-[2.5rem] shadow-[0_0_50px_rgba(14,165,233,0.15)] w-[360px]">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-sky-500/20 rounded-xl"><Timer className="text-sky-400" size={20} /></div>
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Sensores de Impacto</span>
               </div>
               <div className={`px-2 py-1 rounded-md flex items-center gap-2 ${isOscilando ? 'bg-sky-500/20 text-sky-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  <Activity size={12} className={isOscilando ? 'animate-pulse' : ''} />
                  <span className="text-[8px] font-black uppercase tracking-widest">{isOscilando ? 'Resonancia' : 'Bloqueado'}</span>
               </div>
            </div>
            
            <div className="bg-[#020617] rounded-3xl p-6 border border-slate-800 mb-6 flex flex-col items-center justify-center shadow-inner">
               <span className="text-5xl font-black text-sky-400 font-mono tracking-tighter drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                 {formatTime(tiempoTranscurrido)}
               </span>
            </div>

            <div className="flex justify-between gap-3">
               <button 
                onClick={() => setCronometroActivo(!cronometroActivo)} 
                className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${cronometroActivo ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'}`}
               >
                 {cronometroActivo ? <Square size={16}/> : <Play size={16}/>} {cronometroActivo ? 'Parar' : 'Iniciar'}
               </button>
               <button onClick={() => { setCronometroActivo(false); setTiempoTranscurrido(0); }} className="px-6 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-2xl flex items-center justify-center text-slate-300">
                 <RotateCcw size={18} />
               </button>
            </div>
         </motion.div>

         {/* PANEL EXTRA: MATRIZ DE DATOS (Solo visible a partir de Fase 3) */}
         <AnimatePresence>
           {fase >= 3 && fase < 5 && (
              <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/80 backdrop-blur-3xl border border-indigo-500/30 p-6 rounded-[2.5rem] w-[360px]">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Database className="text-indigo-400" size={18} />
                      <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Muestreo (n={muestras.length}/3)</span>
                    </div>
                    {fase === 3 && (
                      <button onClick={handleAgregarMuestra} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl transition-colors"><Plus size={16} /></button>
                    )}
                 </div>
                 <div className="space-y-2">
                    <div className="grid grid-cols-2 text-[9px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-700 pb-2 mb-2 text-center">
                       <span>Masa (m)</span>
                       <span>Periodo (T)</span>
                    </div>
                    {muestras.length === 0 ? (
                      <div className="text-center py-4 text-slate-600 text-[10px] uppercase font-bold tracking-widest">Base Vacía</div>
                    ) : (
                      muestras.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-2 text-sm font-mono text-slate-300 text-center bg-slate-800/50 py-2 rounded-lg">
                           <span>{m.m}kg</span>
                           <span className="text-sky-400">{m.T}s</span>
                        </div>
                      ))
                    )}
                 </div>
              </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* ── PANEL DERECHO: ORDENADOR DE ANÁLISIS ── */}
      <div className="absolute top-10 right-10 z-40 w-[400px] flex flex-col gap-5">
         <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-[#0f172a]/95 backdrop-blur-2xl border border-amber-500/20 p-8 rounded-[2.5rem] shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-700/50 pb-4">
               <div className="flex items-center gap-3">
                  <Globe className="text-amber-400" size={24} />
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em]">Inspección Mecánica {fase}/4</span>
               </div>
               <Calculator size={20} className="text-slate-600" />
            </div>

            <div className="space-y-5 mb-8">
               {fase === 1 && (
                  <>
                    <InputFase label="Compresión x a m=1kg (m)" value={inputX_M1} onChange={setInputX_M1} />
                    <InputFase label="Compresión x a m=2kg (m)" value={inputX_M2} onChange={setInputX_M2} />
                  </>
               )}
               {fase === 2 && (
                  <>
                    <InputFase label="Periodo T a impacto A=0.5m (s)" value={inputT_A05} onChange={setInputT_A05} />
                    <InputFase label="Periodo T a impacto A=1.5m (s)" value={inputT_A15} onChange={setInputT_A15} />
                  </>
               )}
               {fase === 3 && (
                  <div className="text-center py-6 border border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
                     <Binary className="mx-auto text-slate-500 mb-2 animate-pulse" size={30} />
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registrando datos de impacto de aterrizaje...</span>
                  </div>
               )}
               {fase >= 4 && (
                  <>
                    <div className="bg-[#020617] p-5 rounded-2xl border border-amber-500/30 mb-4 flex justify-between items-center">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Modelo de Rigidez</span>
                          <span className="text-sm font-mono text-white font-bold">k = (4π² · m) / T²</span>
                       </div>
                    </div>
                    <InputFase label="Constante calculada 'k' (N/m)" value={inputK} onChange={setInputK} highlight />
                  </>
               )}
            </div>

            {fase !== 3 && fase !== 5 && (
              <button onClick={handleValidarFase} className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-[0.3em] rounded-[1.5rem] shadow-[0_0_30px_rgba(217,119,6,0.2)] hover:shadow-[0_0_40px_rgba(217,119,6,0.4)] transition-all flex items-center justify-center gap-3">
                <Target size={18} /> Enviar Diagnóstico
              </button>
            )}
         </motion.div>
      </div>

      {/* ── CONSOLA DE SISTEMA DE CONTROL (Panel Inferior) ── */}
      <div className="absolute bottom-10 left-10 right-10 z-50 flex gap-6 pointer-events-none">
         
         <motion.div key={fase} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-grow bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-700/50 p-6 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] flex items-center gap-6 pointer-events-auto">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center flex-shrink-0">
               <Binary className="text-slate-400" size={30} />
            </div>
            <p className="text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-line">
               {DIALOGOS[fase]}
            </p>
         </motion.div>

         <div className="flex-shrink-0 bg-[#0f172a]/90 backdrop-blur-3xl border border-slate-700/50 p-6 rounded-[2.5rem] shadow-xl flex items-center gap-8 pointer-events-auto">
            <ControlSlider 
              label="Carga (m)" value={masa} min={1.0} max={5.0} step={1.0} unit="kg" color="emerald" 
              onChange={setMasa} locked={fase === 2 || fase === 4} 
            />
            <ControlSlider 
              label="Impacto (A)" value={amplitud} min={0.5} max={2.0} step={0.5} unit="m" color="sky" 
              onChange={setAmplitud} locked={fase === 1 || fase === 4} 
            />
            <div className="pl-4 border-l border-slate-700">
               <button 
                onClick={() => {
                  if (!isOscilando) audio.playPop();
                  setIsOscilando(!isOscilando);
                }} 
                disabled={fase === 1 || fase === 4}
                className={`h-14 w-14 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-lg ${(fase === 1 || fase === 4) ? 'opacity-30 cursor-not-allowed bg-slate-800 text-slate-600' : isOscilando ? 'bg-rose-600 text-white shadow-rose-600/30' : 'bg-sky-600 text-white shadow-sky-600/30'}`}
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
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-amber-500/30 rounded-[4rem] p-20 max-w-2xl shadow-[0_0_100px_rgba(217,119,6,0.2)]">
                <CheckCircle2 size={100} className="text-amber-500 mx-auto mb-8" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Tren Certificado</h3>
                <p className="text-slate-400 text-lg font-medium mb-12">
                  El sistema ha verificado la rigidez estructural. La constante elástica real del pistón es de <strong className="text-amber-400">{seed.k} N/m</strong>. <br/><br/>
                  La telemetría de impactos cumple los requerimientos orbitales.
                </p>
                <button onClick={() => router.push('/alumno/laboratorio/fisica')} className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-amber-600/30">
                  Emitir Certificado Final
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
          <span className={`text-sm font-black italic tracking-tighter ${color === 'sky' ? 'text-sky-300' : 'text-emerald-300'}`}>{value.toFixed(1)}{unit}</span>
       </div>
       <input 
        type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} disabled={locked}
        className={`w-full h-1.5 bg-slate-700 rounded-full appearance-none ${locked ? 'cursor-not-allowed' : 'cursor-pointer'} ${color === 'sky' ? 'accent-sky-500' : 'accent-emerald-500'}`} 
       />
    </div>
  );
}
