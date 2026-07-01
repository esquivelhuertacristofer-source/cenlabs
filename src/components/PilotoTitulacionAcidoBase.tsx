"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useRouter } from 'next/navigation';
import {
  XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';
import {
  RotateCcw, Activity, Droplets, Target, MousePointer2, Zap, FlaskConical
} from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import Titulacion3DScene from './simuladores/qmi07/Titulacion3DScene';

export default function PilotoTitulacionAcidoBase() {
  const router = useRouter();
  const {
    titulacion, addDropNaOH, toggleIndicadorP7, togglePurgaP7, resetP7, generarSemillaP7, validarP7
  } = useSimuladorStore();

  const [mounted, setMounted] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [valveValue, setValveValue] = useState(0);
  const [ansCa, setAnsCa] = useState('');
  const flowInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    if (titulacion.history.length <= 1) generarSemillaP7();
  }, []);

  useEffect(() => {
    if (valveValue > 10) {
      const speed = Math.max(25, 400 - (valveValue * 4));
      const amount = valveValue > 85 ? 0.75 : (valveValue > 45 ? 0.3 : 0.08);
      flowInterval.current = setInterval(() => {
        addDropNaOH(amount);
      }, speed);
    } else {
      if (flowInterval.current) clearInterval(flowInterval.current);
    }
    return () => { if (flowInterval.current) clearInterval(flowInterval.current); };
  }, [valveValue]);

  const currentPH = titulacion.history[titulacion.history.length - 1]?.ph || 1.0;

  // Punto de equivalencia: Veq = (ca·va)/cb  (mL)
  const equivalenceVolume = titulacion.cb > 0
    ? (titulacion.ca * titulacion.va) / titulacion.cb
    : 25;

  // Alerta de Viraje Narrativa
  useEffect(() => {
    if (currentPH > 8.15 && currentPH < 8.5 && titulacion.indicador) {
       audio?.playNotification();
    }
    if (currentPH >= 9.5 && titulacion.indicador) {
       audio?.playError();
       audio?.playNotification();
    }
  }, [currentPH > 8.2, titulacion.indicador]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-screen bg-[#03040a] overflow-hidden flex flex-col font-['Outfit'] text-white">

      {/* ── ESCENA 3D — TITULACIÓN ÁCIDO-BASE (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <Titulacion3DScene
          volumenBase={titulacion.volumenBase}
          ph={currentPH}
          indicador={titulacion.indicador}
          equivalenceVolume={equivalenceVolume}
          flowRate={valveValue / 100}
          history={titulacion.history}
        />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#03040a]/70 via-transparent to-[#03040a]/85" />

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/50 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Monitoreo Analítico
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Titration Protocol HUD</span>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${titulacion.purgada ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Bureta</div>
              <div className={`text-sm font-black italic ${titulacion.purgada ? 'text-blue-400' : 'text-white/20'}`}>{titulacion.purgada ? 'PURGADA' : 'CON AIRE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${titulacion.indicador ? 'bg-pink-500/10 border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Indicador</div>
              <div className={`text-sm font-black italic ${titulacion.indicador ? 'text-pink-400' : 'text-white/20'}`}>{titulacion.indicador ? 'FENOLFTALEÍNA' : 'FALTANTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${currentPH > 7 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Estado</div>
              <div className={`text-sm font-black italic ${currentPH > 8.2 ? 'text-pink-500' : currentPH > 7 ? 'text-emerald-400' : 'text-white/20'}`}>{currentPH > 8.2 ? 'VIRADO' : currentPH > 7 ? 'NEUTRO' : 'ÁCIDO'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CAPA DE PANELES (deja pasar la interacción con OrbitControls) ── */}
      <main className="flex-1 flex relative z-10 p-12 gap-12 overflow-hidden pointer-events-none">

        {/* PANEL IZQUIERDO: TELEMETRÍA */}
        <div className="w-[420px] flex flex-col gap-8 justify-center">
           <motion.div
              initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="p-10 bg-black/50 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-3xl pointer-events-auto"
           >
              <div className="flex items-center gap-6 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
                    <Activity size={24} className="text-pink-500 animate-pulse" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Status de Acidez</span>
                    <h3 className="text-2xl font-black tracking-tight">ANALIZADOR pH</h3>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                    <div className="flex items-baseline gap-4">
                       <span className="text-6xl font-black font-mono tracking-tighter text-white">{currentPH.toFixed(2)}</span>
                       <span className={`text-[11px] font-black px-4 py-1.5 rounded-full border border-current bg-current/10 ${currentPH > 8.2 ? 'text-pink-400' : 'text-blue-400'}`}>
                          {currentPH > 8.2 ? 'VIRAJE' : 'ÁCIDO'}
                       </span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col gap-2">
                       <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Base (mL)</span>
                       <span className="text-2xl font-black font-mono text-blue-400">{titulacion.volumenBase.toFixed(2)}</span>
                    </div>
                    <div className={`p-6 rounded-[2rem] border transition-all flex flex-col gap-2 ${titulacion.indicador ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' : 'bg-white/5 border-white/5 text-white/20'}`}>
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Indicador</span>
                       <span className="text-xs font-black uppercase">{titulacion.indicador ? 'Añadido' : 'Faltante'}</span>
                    </div>
                 </div>
              </div>
           </motion.div>

           <div className="p-8 bg-black/30 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 flex items-center gap-6 group hover:bg-white/5 transition-all pointer-events-auto">
              <Target className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
              <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-widest">
                 Busca el punto donde la disolución cambie a un <span className="text-pink-400">rosa tenue persistente</span>.
              </p>
           </div>
        </div>

        {/* CENTRO: hueco que deja interactuar con la escena 3D (OrbitControls) */}
        <div className="flex-1" />

        {/* PANEL DERECHO: CURVA Y CONTROLES */}
        <div className="w-[520px] flex flex-col gap-8 justify-center">
           <motion.div
              initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="flex-1 bg-black/50 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-12 flex flex-col shadow-3xl overflow-hidden relative group pointer-events-auto"
           >
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={100} className="text-blue-400" /></div>

              <div className="mb-10 relative z-10">
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] block mb-2">Monitor Analítico</span>
                 <h3 className="text-4xl font-black tracking-tighter">CURVA DE VALORACIÓN</h3>
              </div>

              <div className="flex-1 min-h-[350px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={titulacion.history}>
                       <defs>
                          <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.05)" vertical={false} />
                       <XAxis dataKey="vol" hide />
                       <YAxis hide domain={[0, 14]} />
                       <Area type="monotone" dataKey="ph" stroke="#ec4899" strokeWidth={8} fill="url(#curveGrad)" isAnimationActive={false} dot={false} />
                       <ReferenceLine y={7} stroke="rgba(255,255,255,0.15)" strokeDasharray="15 10" />
                    </AreaChart>
                 </ResponsiveContainer>

                 <div className="absolute top-0 right-0 bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2 text-right">Muestra Añadida</span>
                    <div className="flex items-baseline justify-end gap-3">
                       <span className="text-5xl font-black font-mono tracking-tighter text-blue-400">{titulacion.volumenBase.toFixed(2)}</span>
                       <span className="text-xs font-black text-white/30 uppercase">mL</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-10">
                 <button
                    onClick={() => {
                      togglePurgaP7();
                      audio.playPop();
                      audio.playNotification();
                    }}
                    className={`h-28 rounded-[2.5rem] border-2 flex flex-col items-center justify-center gap-3 transition-all ${titulacion.purgada ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-xl' : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10'}`}
                 >
                    <RotateCcw size={24} className={!titulacion.purgada ? 'animate-spin-slow' : ''} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Cargar Bureta</span>
                 </button>
                 <button
                    onClick={() => {
                      toggleIndicadorP7();
                      audio.playPop();
                      audio.playNotification();
                    }}
                    className={`h-28 rounded-[2.5rem] border-2 flex flex-col items-center justify-center gap-3 transition-all ${titulacion.indicador ? 'bg-pink-600/20 border-pink-500/50 text-pink-400 shadow-xl' : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10'}`}
                 >
                    <Droplets size={24} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Indicador</span>
                 </button>
              </div>

              {/* CONTROL DE VÁLVULA / GOTEO (arrastrar) */}
              <div className="mt-8 p-6 bg-white/5 rounded-[2rem] border border-white/10">
                 <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Apertura de Válvula</span>
                    <span className="text-sm font-black font-mono text-blue-400">{valveValue.toFixed(0)}%</span>
                 </div>
                 <div
                    className="relative h-12 rounded-2xl bg-black/40 border border-white/10 cursor-ew-resize overflow-hidden select-none"
                    onMouseDown={() => setIsRotating(true)}
                    onMouseUp={() => setIsRotating(false)}
                    onMouseLeave={() => setIsRotating(false)}
                    onMouseMove={(e) => {
                       if (!isRotating) return;
                       const rect = e.currentTarget.getBoundingClientRect();
                       const pct = ((e.clientX - rect.left) / rect.width) * 100;
                       setValveValue(Math.min(100, Math.max(0, pct)));
                    }}
                    onClick={(e) => {
                       const rect = e.currentTarget.getBoundingClientRect();
                       const pct = ((e.clientX - rect.left) / rect.width) * 100;
                       setValveValue(Math.min(100, Math.max(0, pct)));
                    }}
                 >
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600/60 to-blue-400/60" style={{ width: `${valveValue}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-white/50 pointer-events-none">
                       Arrastra para controlar el goteo
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>

      </main>

      {/* ── FOOTER DE CONTROL ── */}
      <div className="h-32 bg-black/50 border-t border-white/5 backdrop-blur-3xl px-12 flex items-center justify-between z-[100] pointer-events-auto">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
               <MousePointer2 size={24} className="text-blue-400 animate-bounce" />
               <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">Arrastra la válvula para controlar el goteo</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-4 text-pink-400">
               <FlaskConical size={24} />
               <span className="text-[11px] font-black uppercase tracking-[0.4em]">Vira a Rosa en pH 8.2</span>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <button onClick={() => { resetP7(); setValveValue(0); }} className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-white/10 transition-all border border-white/5 shadow-xl group">
               <RotateCcw size={24} className="group-hover:rotate-[-180deg] transition-transform duration-700" />
            </button>
            <div className="flex items-center gap-3">
               <input
                 type="number"
                 step="0.001"
                 placeholder="[HCl] mol/L"
                 value={ansCa}
                 onChange={e => setAnsCa(e.target.value)}
                 className="w-36 h-16 bg-white/5 border border-white/10 rounded-2xl px-4 text-white font-mono text-sm placeholder:text-white/20 outline-none focus:border-blue-400/60 transition-all"
               />
               <button
                 onClick={() => {
                   const val = parseFloat(ansCa);
                   if (isNaN(val)) return;
                   const ok = validarP7(val);
                   if (ok) { audio?.playSuccess(); } else { audio?.playError(); }
                 }}
                 className="h-16 px-12 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
               >
                 Finalizar y Enviar Datos
               </button>
            </div>
         </div>
      </div>

      {titulacion.status === 'success' && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-xl pointer-events-auto">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[#071220] border border-blue-500/40 rounded-[3rem] p-12 max-w-md text-center shadow-[0_40px_100px_rgba(59,130,246,0.2)]"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-[1.6rem] bg-blue-500/20 border border-blue-500/40 flex items-center justify-center">
              <Target size={36} className="text-blue-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">¡Titulación Completada!</h2>
            <p className="text-sm text-slate-300 mb-4">Concentración calculada correctamente.</p>
            <div className="mb-8 px-6 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <span className="text-blue-300 font-black font-mono">[HCl] = {titulacion.ca?.toFixed(3)} mol/L</span>
            </div>
            <button onClick={resetP7} className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Nueva Titulación
            </button>
            <button onClick={() => router.push('/hub')} className="w-full mt-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Cerrar Laboratorio
            </button>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}
