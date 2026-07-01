"use client";

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useRouter } from 'next/navigation';
import TiroParabolico3DScene from './simuladores/fis01/TiroParabolico3DScene';

export default function PilotoTiroParabolico() {
  const router = useRouter();
  const { tiro1, generarSemillaF1, ejecutarDisparoF1, resetF1, setTiro1, audio, setAsistente } = useSimuladorStore();

  const { angulo = 45, velocidad = 25, disparando = false, targetX = 60, resultado = null, distanciaReal = 0, y0 = 0, obsX = 0, obsY = 0, escenario = 'tierra' } = tiro1;

  // Retroalimentación Narrativa Diamond
  useEffect(() => {
    if (disparando) {
       audio?.playPop();
       audio?.playNotification();
    }
  }, [disparando, audio]);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al centro de balística. Tu misión es neutralizar el dron enemigo ajustando el ángulo de tiro y la velocidad inicial. ¡Ojo con el viento y la gravedad local!",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  useEffect(() => {
    if (resultado === 'exito') {
       audio?.playSuccess();
       audio?.playNotification();
    } else if (resultado === 'colision') {
       audio?.playError();
       audio?.playNotification();
    } else if (resultado === 'fallo') {
       audio?.playError();
       audio?.playNotification();
    }
  }, [resultado, audio]);
  const G = escenario === 'luna' ? 1.62 : escenario === 'marte' ? 3.71 : escenario === 'jupiter' ? 24.79 : 9.81;

  // Inicializar en el mount si no hay obstáculo definido
  useEffect(() => {
    if (!obsX) { 
      generarSemillaF1();
    }
  }, [obsX, generarSemillaF1]);

  // Parámetros ambientales para la escena 3D (mismo motor físico)
  const { viento = 0, densidadAire = 1.225 } = tiro1;

  return (
    <div className="flex h-full w-full bg-[#03040a] overflow-hidden font-['Outfit'] relative text-white">

      {/* ── ESCENA 3D — TIRO PARABÓLICO (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <TiroParabolico3DScene
          angulo={angulo}
          velocidad={velocidad}
          g={G}
          viento={viento}
          densidadAire={densidadAire}
          y0={y0}
          obsX={obsX}
          obsY={obsY}
          targetX={targetX}
          volando={disparando}
          escenario={escenario}
          resultado={resultado}
        />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#03040a]/70 via-transparent to-[#03040a]/80" />

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Sincronía Balística
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Cinematics Protocol HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${disparando ? 'bg-sky-500/10 border-sky-500/30 shadow-[0_0_15px_rgba(56,189,248,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Ignición</div>
              <div className={`text-sm font-black italic ${disparando ? 'text-sky-400' : 'text-white/20'}`}>{disparando ? 'ACTIVA' : 'STANDBY'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${Math.abs(distanciaReal - targetX) < 5 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Aproximación</div>
              <div className={`text-sm font-black italic ${Math.abs(distanciaReal - targetX) < 5 ? 'text-amber-400' : 'text-white/20'}`}>{Math.abs(distanciaReal - targetX) < 5 ? 'CRÍTICA' : 'DISTANTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Neutralización</div>
              <div className={`text-sm font-black italic ${resultado === 'exito' ? 'text-emerald-400' : 'text-white/20'}`}>{resultado === 'exito' ? 'CONFIRMADA' : 'PENDIENTE'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* GIANT BALLISTIC HUD (CENTRAL) */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
         <div className="text-[12rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{distanciaReal.toFixed(0)}</div>
         <span className="text-xl font-black uppercase tracking-[1.5em] text-white/20">m_trayectoria</span>
      </div>

      {/* HUGE FEEDBACK TEXT OVERLAY */}
      <AnimatePresence>
        {resultado && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col items-center ${resultado === 'exito' ? 'pointer-events-auto' : 'pointer-events-none'} p-12 rounded-[4rem] backdrop-blur-3xl border shadow-3xl ${
                resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_100px_rgba(16,185,129,0.3)]' : 
                resultado === 'colision' ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_100px_rgba(249,115,22,0.3)]' :
                'bg-red-500/10 border-red-500/50 shadow-[0_0_100px_rgba(239,68,68,0.3)]'}`}
          >
            <h2 className={`text-7xl font-black uppercase tracking-tighter drop-shadow-2xl mb-4 ${
                resultado === 'exito' ? 'text-emerald-400' : 
                resultado === 'colision' ? 'text-orange-500' : 'text-red-500'}`}>
              {resultado === 'exito' ? '¡BLANCO NEUTRALIZADO!' : resultado === 'colision' ? '¡IMPACTO FALLIDO!' : '¡MUNICIÓN PERDIDA!'}
            </h2>
            <p className={`text-2xl font-bold uppercase tracking-[0.3em] ${resultado === 'exito' ? 'text-emerald-200' : resultado === 'colision' ? 'text-orange-200' : 'text-red-200'}`}>
              {resultado === 'exito' ? `Precisión Exacta: ${distanciaReal.toFixed(1)}m`
                : resultado === 'colision' ? `Dron destruido contra muro en X=${obsX}m`
                : `Dron fuera de límite. Cae en X=${distanciaReal.toFixed(1)}m`}
            </p>
            {resultado === 'exito' && (
              <button onClick={() => router.push('/hub')} className="mt-8 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors shadow-lg shadow-emerald-600/30">
                Cerrar Laboratorio
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      
      {/* 📋 LIENZO DE PRÁCTICA — el arco 3D vive en el fondo (z-0); este main deja
          pasar el arrastre / zoom de OrbitControls salvo en los paneles interactivos */}
      <main className="flex-grow h-full w-full relative overflow-hidden flex flex-col z-20 pointer-events-none">

        {/* TELEMETRÍA TÁCTICA HUD - Restaurada a Glassmorphism Absoluto Flotante */}
        <div className="absolute top-8 left-8 z-30 flex flex-col gap-3 pointer-events-auto">
           {/* Grupo Principal: Coordenadas de Misión */}
           <div className="bg-black/60 backdrop-blur-xl px-6 py-4 rounded-2xl border border-sky-500/30 flex flex-col sm:flex-row sm:items-center gap-6 shadow-[0_0_30px_rgba(56,189,248,0.1)] max-w-fit">
              <div className="flex items-center gap-4">
                 <div className="relative w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8] animate-pulse" />
                 <span className="text-sm font-black text-white uppercase tracking-widest leading-none">
                    Tiro Parabólico <br/><span className="text-sky-400 text-[10px]">RADAR TÁCTICO</span>
                 </span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-sky-500/20" />
              <div className="flex gap-4 sm:gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-sky-500/50 uppercase tracking-widest mb-1">Muro X</span>
                  <span className="text-lg font-black text-orange-400 tabular-nums tracking-wider leading-none">{obsX}<span className="text-sky-500/50 text-xs ml-1">m</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-sky-500/50 uppercase tracking-widest mb-1">Muro Y</span>
                  <span className="text-lg font-black text-orange-400 tabular-nums tracking-wider leading-none">{obsY}<span className="text-sky-500/50 text-xs ml-1">m</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-sky-500/50 uppercase tracking-widest mb-1">Distancia Objetivo</span>
                  <span className="text-lg font-black text-red-500 tabular-nums tracking-wider leading-none drop-shadow-[0_0_5px_#ef4444]">{targetX}<span className="text-sky-500/50 text-xs ml-1">m</span></span>
                </div>
              </div>
           </div>
           
           {/* Grupo Secundario: Sensores de Entorno */}
           <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 flex gap-6 max-w-fit relative overflow-hidden">
              <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gravedad Planeta</span>
                   <span className="text-sm font-black text-white tabular-nums tracking-wider leading-none">{G.toFixed(2)}<span className="text-slate-500 text-xs ml-1">m/s²</span></span>
              </div>
              <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Altitud Y₀</span>
                   <span className="text-sm font-black text-white tabular-nums tracking-wider leading-none">{y0.toFixed(1)}<span className="text-slate-500 text-xs ml-1">m</span></span>
              </div>
              <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Viento (Wₓ)</span>
                   <span className={`text-sm font-black tabular-nums tracking-wider leading-none ${tiro1.viento > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {tiro1.viento?.toFixed(1)}<span className="text-slate-500 text-xs ml-1">m/s</span>
                   </span>
              </div>
              <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Densidad Aire</span>
                   <span className="text-sm font-black text-white tabular-nums tracking-wider leading-none">{tiro1.densidadAire?.toFixed(3)}<span className="text-slate-500 text-[8px] ml-1">kg/m³</span></span>
              </div>
           </div>
        </div>

        {/* ── DOCK DE CONTROL INFERIOR ── */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-8 bg-black/70 backdrop-blur-xl border border-white/10 px-10 py-5 rounded-[2.5rem] shadow-2xl pointer-events-auto">
          <div className="flex flex-col gap-1 min-w-[180px]">
            <div className="flex justify-between">
              <span className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Ángulo</span>
              <span className="text-sm font-black text-white">{angulo}°</span>
            </div>
            <input type="range" min={0} max={90} step={1} value={angulo}
              onChange={(e) => setTiro1({ angulo: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-sky-500" />
          </div>
          <div className="flex flex-col gap-1 min-w-[180px]">
            <div className="flex justify-between">
              <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Velocidad</span>
              <span className="text-sm font-black text-white">{velocidad} m/s</span>
            </div>
            <input type="range" min={0} max={100} step={1} value={velocidad}
              onChange={(e) => setTiro1({ velocidad: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500" />
          </div>
          <button
            onClick={() => ejecutarDisparoF1()}
            disabled={disparando || (tiro1.municion ?? 0) <= 0}
            className="h-12 px-8 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg"
          >
            Disparar ({tiro1.municion ?? 0})
          </button>
          <button
            onClick={() => resetF1()}
            className="h-12 px-8 bg-slate-700 hover:bg-slate-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all active:scale-95"
          >
            Nueva Misión
          </button>
        </div>

        {/* MONITOR OSCILOSCOPIO: Vy vs t (Análisis Cinematográfico) */}
        {(disparando || resultado) && (
          <div className="absolute bottom-8 left-8 z-30 w-48 h-32 bg-black/60 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-3 flex flex-col shadow-2xl overflow-hidden pointer-events-auto">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Oscilador Vy</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_#10b981]" />
             </div>
             <div className="flex-grow relative border-l border-b border-sky-500/20">
                <svg viewBox="0 -10 100 20" className="w-full h-full">
                   <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                   <motion.path 
                     d="M 0 5 Q 25 -10 50 0 T 100 5" // Mock visual de onda para el estilo
                     fill="none" stroke="#38bdf8" strokeWidth="0.3" opacity="0.4"
                     animate={{ d: ["M 0 5 Q 25 -10 50 0 T 100 5", "M 0 0 Q 25 10 50 0 T 100 0"] }}
                     transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   />
                   <text x="2" y="-6" fill="#fbbf24" fontSize="3" fontWeight="bold">Vy (m/s)</text>
                </svg>
             </div>
             <span className="text-[7px] font-bold text-slate-500 mt-1 uppercase text-right">Análisis en t=real</span>
          </div>
        )}
      </main>
    </div>
  );
}
