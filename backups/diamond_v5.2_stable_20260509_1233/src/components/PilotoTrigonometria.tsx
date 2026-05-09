"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Circle, Eye, EyeOff, Target, Waves, Zap, 
  Activity, Pause, Play, RotateCcw, ShieldCheck, 
  Bot, Binary, FunctionSquare
} from 'lucide-react';
import Trigonometria3DScene from './simuladores/mat05/Trigonometria3DScene';

export default function PilotoTrigonometria() {
  const router = useRouter();
  const { trigonometria, setAnguloM5, setAnimandoM5, setTogglesM5, resetM5, validarM5, registrarHallazgoM5, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore();
  const { angulo, animando, verSeno, verCoseno, status, hallazgos = [] } = trigonometria;
  const [verTangente, setVerTangente] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Analizador de Funciones Circulares. Observa cómo el Seno y el Coseno se proyectan en los ejes X e Y mientras el vector recorre el círculo unitario.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  useEffect(() => {
    let interval: any;
    if (animando) {
      interval = setInterval(() => {
        setAnguloM5((angulo + 1) % 360);
      }, 30);
    }
    return () => clearInterval(interval);
  }, [animando, angulo, setAnguloM5]);

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (angulo !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (hallazgos.length > 0 && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [angulo, hallazgos.length, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">
      
      {/* ── GIANT TELEMETRY BACKGROUND ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
        <span className="text-[14rem] font-black font-mono text-cyan-500 select-none italic">
          {angulo.toFixed(0)}°
        </span>
      </div>

      {/* ── CHECKLIST HUD (DIAMOND STANDARD) ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-cyan-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(34,211,238,0.1)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-xl">
                <Circle className="text-cyan-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-cyan-300 uppercase tracking-widest leading-none">Analizador de Funciones</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MAT-05 • Círculo Unitario</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Fase" },
                { step: 2, label: "Muestreo" },
                { step: 3, label: "Sincronía" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                   {pasoActual > s.step ? <ShieldCheck size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                   <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ESCENA 3D (BACKGROUND) ── */}
      <div className="absolute inset-0 z-0">
        <Trigonometria3DScene angulo={angulo} verSeno={verSeno} verCoseno={verCoseno} verTangente={verTangente} />
      </div>

      {/* ── HUD SUPERIOR: DATOS TIEMPO REAL ── */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none mt-20">
        <div className="flex justify-between items-start">
            <div className="flex gap-4 pointer-events-auto">
                <DataCard label="Seno (sin θ)" value={Math.sin(angulo * Math.PI / 180).toFixed(4)} color="cyan" active={verSeno} onToggle={() => setTogglesM5(!verSeno, verCoseno)} />
                <DataCard label="Coseno (cos θ)" value={Math.cos(angulo * Math.PI / 180).toFixed(4)} color="fuchsia" active={verCoseno} onToggle={() => setTogglesM5(verSeno, !verCoseno)} />
                <DataCard label="Tangente (tan θ)" value={Math.abs(Math.cos(angulo * Math.PI / 180)) < 0.01 ? '∞' : Math.tan(angulo * Math.PI / 180).toFixed(4)} color="yellow" active={verTangente} onToggle={() => setVerTangente(!verTangente)} />
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl pointer-events-auto">
                <div className="text-right">
                    <span className="text-[9px] font-black text-slate-500 uppercase block mb-1">Identidad Fundamental</span>
                    <div className="text-xl font-black text-white italic tracking-tighter">
                       sin²θ + cos²θ = 1.0000
                    </div>
                </div>
            </div>
        </div>

        {/* Panel Lateral de Hallazgos */}
        <div className="absolute left-10 top-40 flex flex-col gap-4 w-[240px] pointer-events-auto">
            <div className="bg-[#0A1121]/80 backdrop-blur-3xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                    <Activity size={16} className="text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Muestras de Fase</span>
                </div>
                <div className="space-y-2 min-h-[200px] max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {hallazgos.length === 0 ? (
                        <div className="h-[200px] border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                            <Waves className="text-white/5 mb-4" size={32} />
                            <p className="text-[9px] font-bold text-slate-600 uppercase leading-tight">Captura puntos críticos para validar.</p>
                        </div>
                    ) : (
                        hallazgos.map((h) => (
                            <motion.div key={h.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between">
                                <span className="text-[11px] font-black text-cyan-400">{h.angulo}°</span>
                                <div className="flex gap-3">
                                    <span className="text-[9px] font-mono text-slate-500">S:{h.sin.toFixed(2)}</span>
                                    <span className="text-[9px] font-mono text-slate-500">C:{h.cos.toFixed(2)}</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
                <button 
                  onClick={() => { registrarHallazgoM5(); audio?.playSuccess(); }} 
                  disabled={animando}
                  className={`w-full mt-6 py-4 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all ${animando ? 'bg-white/5 text-slate-600 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg'}`}
                >
                    <Zap size={14} /> {animando ? 'Pausar Captura' : 'Capturar Hallazgo'}
                </button>
            </div>
        </div>

        {/* Dock de Control Inferior */}
        <div className="mt-auto flex justify-between items-end gap-10 pointer-events-auto">
            <div className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] flex-1 shadow-2xl flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-5 bg-cyan-500 rounded-full" />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Ajuste Manual de Ángulo</span>
                    </div>
                    <div className="flex gap-3">
                        {[0, 45, 90, 180, 270].map(val => (
                            <button key={val} onClick={() => { setAnimandoM5(false); setAnguloM5(val); audio?.playPop(); }} className="px-5 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black hover:bg-cyan-600 hover:text-white transition-all">{val}°</button>
                        ))}
                    </div>
                </div>
                <div className="relative pt-2">
                    <input type="range" min="0" max="359" step="1" value={angulo} onChange={(e) => { setAnimandoM5(false); setAnguloM5(parseInt(e.target.value)); }} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500" />
                </div>
            </div>

            <div className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 p-6 rounded-[3rem] w-[380px] shadow-2xl flex items-center justify-around gap-6">
                <button 
                  onClick={() => { setAnimandoM5(!animando); audio?.playPop(); }}
                  className={`w-24 h-24 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 transition-all ${animando ? 'bg-fuchsia-600 shadow-fuchsia-600/20' : 'bg-cyan-600 shadow-cyan-600/20 hover:scale-105'}`}
                >
                  {animando ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                  <span className="text-[9px] font-black uppercase tracking-widest">{animando ? 'PAUSA' : 'GIRAR'}</span>
                </button>
                <div className="flex flex-col gap-4 flex-1">
                    <button onClick={() => { const ok = validarM5(); if (ok) audio?.playSuccess(); else audio?.playError(); }} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 hover:text-white transition-all">
                      <Target size={16} className="text-cyan-400" /> Validar Fase
                    </button>
                    <button onClick={() => { resetM5(); audio?.playPop(); }} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
                      <RotateCcw size={16} /> Resetear
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* ÉXITO FINAL */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-cyan-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(34,211,238,0.15)]">
                <Circle size={100} className="text-cyan-500 mx-auto mb-8" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Armonía de Fase</h3>
                <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">Has analizado las funciones trigonométricas con precisión absoluta. La sincronía del círculo unitario ha sido validada bajo el estándar **Diamond State**.</p>
                <button onClick={() => router.push('/alumno/laboratorio/matematicas')} className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-cyan-600/30">Cerrar Informe Analítico</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function DataCard({ label, value, color, active, onToggle }: any) {
    const isCyan = color === 'cyan';
    const isFuchsia = color === 'fuchsia';
    const isYellow = color === 'yellow';

    return (
        <div className={`w-[200px] bg-black/60 backdrop-blur-2xl border ${active ? (isCyan ? 'border-cyan-500/50' : isFuchsia ? 'border-fuchsia-500/50' : 'border-yellow-500/50') : 'border-white/10'} p-5 rounded-[2rem] flex flex-col gap-3 transition-all relative overflow-hidden pointer-events-auto`}>
            {active && <div className={`absolute top-0 left-0 w-full h-1 ${isCyan ? 'bg-cyan-500' : isFuchsia ? 'bg-fuchsia-500' : 'bg-yellow-500'}`} />}
            <div className="flex justify-between items-center">
                <span className={`text-[9px] font-black uppercase tracking-widest ${active ? (isCyan ? 'text-cyan-400' : isFuchsia ? 'text-fuchsia-400' : 'text-yellow-400') : 'text-slate-500'}`}>{label}</span>
                <button onClick={onToggle} className={`p-1.5 rounded-lg transition-all ${active ? 'bg-white/10 text-white' : 'bg-white/5 text-slate-600 hover:text-slate-400'}`}>
                    {active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
            </div>
            <div className="text-3xl font-black tracking-tighter text-white italic font-mono">{value}</div>
            <div className={`h-1.5 w-full bg-white/5 rounded-full overflow-hidden`}>
                <motion.div animate={{ width: isYellow && value === '∞' ? '100%' : `${Math.min(100, Math.abs(parseFloat(value)) * 100)}%` }} className={`h-full ${isCyan ? 'bg-cyan-500' : isFuchsia ? 'bg-fuchsia-500' : 'bg-yellow-500'}`} />
            </div>
        </div>
    );
}
