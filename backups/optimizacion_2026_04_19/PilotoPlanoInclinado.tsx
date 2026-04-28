"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, RotateCcw, Activity, ArrowRight, Target, 
  CheckCircle2, AlertCircle, Info, ChevronRight, Binary, Scaling, Layers,
  Compass, Zap, Gauge, ZapOff, Timer, Play, Pause
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import dynamic from 'next/dynamic';

// Carga perezosa de la escena 3D para evitar problemas de SSR y mejorar performance
const PlanoInclinado3DScene = dynamic(() => import('./simuladores/fis02/PlanoInclinado3DScene'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Iniciando Motor Físico 3D...</p>
      </div>
    </div>
  )
});

// ==========================================
// Tipos y Constantes
// ==========================================

const G = 9.81;
const RAMP_LENGTH = 10;

interface RampaState {
  angulo: number;
  deslizando: boolean;
  bloquePos: number;
  resultado: 'exito' | 'error' | null;
  tiempo: number;
  aceleracion: number;
}

const MISIONES_RAMPA = {
  hielo: { nombre: 'Pista de Hielo', muS: 0.10, muK: 0.05, masa: 5, color: '#bae6fd' },
  madera: { nombre: 'Maderera', muS: 0.45, muK: 0.35, masa: 12, color: '#92400e' },
  caucho: { nombre: 'Caucho/Asfalto', muS: 0.80, muK: 0.65, masa: 25, color: '#1e293b' },
  misterio: { nombre: 'Material ?', muS: 0.5, muK: 0.4, masa: 10, color: '#6366f1' }
};

export default function PilotoPlanoInclinado() {
  const router = useRouter();
  const { setBitacora, bitacoraData, stopTimer, setPasoActual } = useSimuladorStore();

  // -- ESTADO DE MISIÓN --
  const [misionId, setMisionId] = useState<keyof typeof MISIONES_RAMPA>('madera');
  const [seed, setSeed] = useState(() => ({
    masa: MISIONES_RAMPA.madera.masa,
    muS: MISIONES_RAMPA.madera.muS,
    muK: MISIONES_RAMPA.madera.muK
  }));

  const [rampa, setRampa] = useState<RampaState>({
    angulo: 0,
    deslizando: false,
    bloquePos: 0.1, 
    resultado: null,
    tiempo: 0,
    aceleracion: 0
  });

  const [teoricoInput, setTeoricoInput] = useState("");
  const [intentos, setIntentos] = useState(0);
  const lastTimeRef = useRef<number>(0);

  // Efecto para cambiar semilla cuando cambia misión
  useEffect(() => {
    const m = MISIONES_RAMPA[misionId];
    if (misionId === 'misterio') {
       const ms = parseFloat((Math.random() * (0.6 - 0.2) + 0.2).toFixed(2));
       setSeed({ masa: Math.floor(Math.random() * 40 + 5), muS: ms, muK: parseFloat((ms * 0.7).toFixed(2)) });
    } else {
       setSeed({ masa: m.masa, muS: m.muS, muK: m.muK });
    }
    handleReset();
  }, [misionId]);

  // -- CÁLCULOS FÍSICOS EN VIVO --
  const rad = (rampa.angulo * Math.PI) / 180;
  const W = seed.masa * G;
  const N = W * Math.cos(rad);
  const Wx = W * Math.sin(rad);
  const fsMax = seed.muS * N;
  const fk = seed.muK * N;
  const anguloCritico = Math.atan(seed.muS) * (180 / Math.PI);

  // -- LÓGICA DE ANIMACIÓN Y FÍSICA --
  useEffect(() => {
    let frameId: number;
    
    if (rampa.deslizando && rampa.bloquePos < 1.0) {
      // Cálculo de aceleración neta: a = (Wx - fk) / m
      const a = Math.max(0, (Wx - fk) / seed.masa);
      
      const animate = (time: number) => {
        if (!lastTimeRef.current) lastTimeRef.current = time;
        const dt = (time - lastTimeRef.current) / 1000; // delta time en segundos
        lastTimeRef.current = time;

        setRampa(prev => {
          // Ecuación de movimiento: d = d0 + v0*t + 0.5*a*t^2
          // Para simplificar la animación usamos una integración simple:
          const v = a * prev.tiempo;
          const ds = v * dt;
          const nextPos = prev.bloquePos + (ds / RAMP_LENGTH);
          
          if (nextPos >= 1.0) {
            return { ...prev, bloquePos: 1.0, aceleracion: a };
          }
          
          frameId = requestAnimationFrame(animate);
          return { 
            ...prev, 
            bloquePos: nextPos, 
            tiempo: prev.tiempo + dt,
            aceleracion: a
          };
        });
      };
      frameId = requestAnimationFrame(animate);
    } else {
      lastTimeRef.current = 0;
    }
    
    return () => cancelAnimationFrame(frameId);
  }, [rampa.deslizando, Wx, fk]);

  // -- TRIGGER DE DESLIZAMIENTO --
  useEffect(() => {
    if (!rampa.deslizando && Wx > fsMax + 0.05) {
      setRampa(prev => ({ ...prev, deslizando: true }));
    }
  }, [Wx, fsMax, rampa.deslizando]);

  // -- HANDLERS --
  const handleReset = () => {
    setRampa({ angulo: 0, deslizando: false, bloquePos: 0.1, resultado: null, tiempo: 0, aceleracion: 0 });
    setTeoricoInput("");
  };

  const handleValidar = () => {
    const val = parseFloat(teoricoInput);
    // El alumno debe calcular la aceleración teórica: a = g(sinθ - μk cosθ)
    const aTeorica = Math.max(0, G * (Math.sin(rad) - seed.muK * Math.cos(rad)));
    const precision = Math.abs(val - aTeorica);
    
    if (precision <= 0.2) {
      setRampa(prev => ({ ...prev, resultado: 'exito' }));
      setBitacora({ 
        ...bitacoraData, 
        fisica2: `✅ ACELERACIÓN VALIDADA: a_calc=${val} m/s², a_real=${aTeorica.toFixed(2)} m/s². θ=${rampa.angulo}°` 
      });
    } else {
      setIntentos(prev => prev + 1);
      setRampa(prev => ({ ...prev, resultado: 'error' }));
    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#020617] font-['Outfit'] relative">
      
      {/* ── ESCENA 3D ── */}
      <div className="absolute inset-0 z-0">
        <PlanoInclinado3DScene 
          angulo={rampa.angulo}
          bloquePos={rampa.bloquePos}
          muS={seed.muS}
          masa={seed.masa}
          isDeslizando={rampa.deslizando}
          materialId={misionId}
        />
      </div>

      {/* ── TOP HUD (TELEMETRÍA DIAMOND) ── */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-10 pointer-events-none">
        <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex gap-4 pointer-events-auto">
          {/* Parámetros Base */}
          <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] flex items-center gap-6 shadow-2xl">
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Masa del Bloque</span>
               <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">{seed.masa}</span>
                  <span className="text-xs font-bold text-slate-500">kg</span>
               </div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col">
               <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Coeficientes μ</span>
               <span className="text-2xl font-black text-white">{seed.muS.toFixed(2)} <span className="text-slate-500 text-sm">/ {seed.muK.toFixed(2)}</span></span>
            </div>
          </div>

          {/* Dinámica de Fluidos/Fuerzas */}
          <div className="bg-slate-900/60 backdrop-blur-3xl border border-white/10 p-5 rounded-[2rem] flex items-center gap-6 shadow-2xl">
            <div className="flex flex-col text-center">
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Aceleración</span>
               <div className="flex items-baseline gap-1 justify-center">
                  <span className="text-2xl font-black text-white font-mono">{rampa.aceleracion.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">m/s²</span>
               </div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="flex flex-col text-center min-w-[100px]">
               <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest mb-1">Tiempo de Descenso</span>
               <div className="flex items-center justify-center gap-2 text-2xl font-black text-white font-mono">
                  <Timer size={18} className="text-sky-500" />
                  {rampa.tiempo.toFixed(2)}s
               </div>
            </div>
          </div>
        </motion.div>

        {/* Alerta de Seguridad */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-[1.5rem] flex flex-col gap-1 pointer-events-auto shadow-xl">
           <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${rampa.deslizando ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Estado del Sistema</span>
           </div>
           <span className="text-xs font-black text-white uppercase italic">
             {rampa.deslizando ? '¡Deslizamiento Detectado!' : 'Equilibrio Estático'}
           </span>
        </motion.div>
      </div>

      {/* ── PANEL DE CONTROL (DOCK) ── */}
      <div className="absolute bottom-10 inset-x-10 z-20 flex justify-center pointer-events-none">
         <motion.div 
          initial={{ y: 50, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-6 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.7)] flex items-center gap-10 pointer-events-auto"
         >
            {/* Selector de Misión / Material */}
            <div className="flex flex-col gap-2 border-r border-white/10 pr-8">
               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest px-1">Entorno Experimental</span>
               <div className="flex gap-2">
                 {(Object.keys(MISIONES_RAMPA) as Array<keyof typeof MISIONES_RAMPA>).map((mId) => (
                   <button
                     key={mId}
                     onClick={() => setMisionId(mId)}
                     className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${misionId === mId ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                   >
                     {MISIONES_RAMPA[mId].nombre.split(' ')[0]}
                   </button>
                 ))}
               </div>
            </div>

            {/* Actuador de Ángulo */}
            <div className="flex flex-col gap-3 min-w-[150px]">
               <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Gauge size={12} /> Inclinador Hidráulico
                  </span>
                  <span className="text-lg font-black text-white italic">{rampa.angulo.toFixed(1)}°</span>
               </div>
               <input 
                type="range" 
                min="0" 
                max="60" 
                step="0.1"
                value={rampa.angulo}
                disabled={rampa.deslizando}
                onChange={(e) => setRampa(prev => ({ ...prev, angulo: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
               />
            </div>

            <div className="w-px h-14 bg-white/10" />

            {/* Input de Cálculo de Aceleración */}
            <div className="flex flex-col gap-2">
               <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-1 flex items-center gap-2">
                 <Binary size={12} /> Calcular Aceleración (m/s²)
               </span>
               <div className="flex gap-2">
                  <input 
                    type="number"
                    placeholder="0.00"
                    value={teoricoInput}
                    onChange={(e) => setTeoricoInput(e.target.value)}
                    className="w-28 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white font-black text-center focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-800 text-lg"
                  />
                  <button 
                    onClick={handleValidar}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-black px-8 rounded-2xl transition-all flex items-center gap-3 uppercase text-[11px] tracking-widest shadow-lg shadow-amber-500/20"
                  >
                    <Target size={18} /> Validar
                  </button>
               </div>
            </div>

            <div className="w-px h-14 bg-white/10" />

            {/* Herramientas de Sistema */}
            <div className="flex gap-4">
               <button 
                onClick={handleReset}
                className="w-16 h-16 rounded-[1.5rem] bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center text-slate-500 hover:text-red-400 transition-all group shadow-inner"
                title="Reiniciar Simulación"
               >
                  <RotateCcw size={24} className="group-hover:rotate-180 transition-transform duration-500" />
               </button>
               
               <div className="flex flex-col justify-center">
                  <button 
                    onClick={() => {
                       // Resolver ángulo crítico
                       const target = parseFloat(anguloCritico.toFixed(1)) + 0.1;
                       setRampa(prev => ({ ...prev, angulo: target }));
                    }}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-tighter transition-all mb-1"
                  > Forzar Deslizamiento </button>
                  <button 
                    onClick={() => {
                       const aTeorica = Math.max(0, G * (Math.sin(rad) - seed.muK * Math.cos(rad)));
                       setTeoricoInput(aTeorica.toFixed(2));
                    }}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[9px] font-black text-slate-500 hover:text-white uppercase tracking-tighter transition-all"
                  > Auto-Calcular </button>
               </div>
            </div>
         </motion.div>
      </div>

      {/* ── FEEDBACK DE RESULTADOS ── */}
      <AnimatePresence>
        {rampa.resultado === 'exito' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-8">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[4rem] p-16 max-w-xl w-full text-center shadow-[0_50px_120px_rgba(0,0,0,0.6)] relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-3 bg-emerald-500" />
              <div className="w-28 h-28 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-10 shadow-inner">
                <CheckCircle2 size={56} strokeWidth={3} />
              </div>
              <h3 className="text-5xl font-black text-[#023047] uppercase tracking-tighter mb-4 italic leading-none">Misión Cumplida</h3>
              <p className="text-slate-500 text-xl font-bold mb-10 leading-relaxed px-6">Has sincronizado la teoría con la realidad física. El bloque ha descendido con la aceleración calculada.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-12">
                 <div className="bg-slate-50 p-6 rounded-3xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Aceleración</span>
                    <span className="text-2xl font-black text-[#023047]">{rampa.aceleracion.toFixed(2)} m/s²</span>
                 </div>
                 <div className="bg-slate-50 p-6 rounded-3xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Tiempo Final</span>
                    <span className="text-2xl font-black text-[#023047]">{rampa.tiempo.toFixed(2)}s</span>
                 </div>
              </div>

              <button 
                onClick={() => router.push('/alumno/laboratorio/fisica')}
                className="w-full py-7 bg-[#023047] hover:bg-[#034e75] text-white font-black text-sm uppercase tracking-[0.3em] rounded-[2.5rem] transition-all shadow-2xl flex items-center justify-center gap-4 group"
              >
                Cerrar Protocolo <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        )}

        {rampa.resultado === 'error' && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-48 left-1/2 -translate-x-1/2 px-12 py-6 bg-red-600 text-white rounded-[2.5rem] flex items-center gap-8 shadow-[0_30px_60px_rgba(220,38,38,0.4)] z-50 border-b-8 border-red-900">
            <AlertCircle size={32} />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest opacity-70">Error de Sincronización</span>
              <span className="text-lg font-black uppercase italic">Cálculo fuera de rango (±0.2)</span>
            </div>
            <button 
              onClick={() => setRampa(p => ({ ...p, resultado: null }))} 
              className="px-8 py-3 bg-white text-red-600 font-black rounded-2xl hover:bg-slate-100 transition-all uppercase text-xs"
            > Reintentar </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GRADIENTES AMBIENTALES */}
      <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-1/3 h-full bg-gradient-to-l from-black/50 to-transparent pointer-events-none" />
      
    </div>
  );
}
