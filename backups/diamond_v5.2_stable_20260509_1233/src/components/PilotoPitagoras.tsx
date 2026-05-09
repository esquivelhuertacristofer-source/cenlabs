"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Square, Triangle, Droplets, Target, 
  RefreshCcw, Activity, ShieldCheck, Zap, 
  Info, Ruler, Bot, Shapes
} from 'lucide-react';
import Pitagoras3DScene from './simuladores/mat04/Pitagoras3DScene';

export default function PilotoPitagoras() {
  const router = useRouter();
  const { pitagoras, setCatetosM4, setLlenadoM4, setUserInputM4, validarM4, generarSemillaM4, resetM4, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore();
  
  const [mounted, setMounted] = useState(false);
  const [isPouring, setIsPouring] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Laboratorio de Geometría de Fluidos. Tu misión es verificar el Teorema de Pitágoras llenando el volumen del cuadrado de la hipotenusa con el fluido de los catetos.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  if (!pitagoras) return null;

  const { catetoA = 3, catetoB = 4, llenado = 0, userInputC = '', status = 'idle', escenario = 'pitagoras_basico' } = pitagoras;

  const areaA = (catetoA || 3) * (catetoA || 3);
  const areaB = (catetoB || 4) * (catetoB || 4);
  const sumAreas = areaA + areaB;

  // Animación de llenado
  useEffect(() => {
    if (!isPouring) return;
    const interval = setInterval(() => {
      if (llenado < 100) {
        setLlenadoM4(Math.min(100, llenado + 1));
      } else {
        setIsPouring(false);
        clearInterval(interval);
        audio?.playSuccess();
      }
    }, 20);
    return () => clearInterval(interval);
  }, [isPouring, llenado, setLlenadoM4]);

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (catetoA !== 3 || catetoB !== 4) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (userInputC !== '' && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [catetoA, catetoB, userInputC, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  return (
    <div className="w-full h-full bg-[#020617] relative overflow-hidden flex flex-col font-['Outfit'] text-white">
      
      {/* ── GIANT TELEMETRY BACKGROUND ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
        <span className="text-[14rem] font-black font-mono text-emerald-500 select-none italic">
          {sumAreas.toFixed(1)}u²
        </span>
      </div>

      {/* ── CHECKLIST HUD (DIAMOND STANDARD) ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-emerald-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(34,197,94,0.1)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Shapes className="text-emerald-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-emerald-300 uppercase tracking-widest leading-none">Geometría de Fluidos</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MAT-04 • Teorema de Pitágoras</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Dimensiones" },
                { step: 2, label: "Cálculo" },
                { step: 3, label: "Validación" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
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
        <Pitagoras3DScene catetoA={catetoA || 3} catetoB={catetoB || 4} llenado={llenado} escenario={escenario || 'pitagoras_basico'} />
      </div>

      {/* ── HUD SUPERIOR ── */}
      <div className="relative z-10 p-10 flex flex-col h-full pointer-events-none mt-20">
        <div className="flex justify-between items-start">
            <div className="flex gap-4 pointer-events-auto">
                <HUDCard label="Suma de Áreas (a²+b²)" value={`${sumAreas.toFixed(1)} u²`} icon={<Activity size={14} />} color="#10b981" />
                <HUDCard label="Catetos Activos" value={`${catetoA} | ${catetoB}`} icon={<Triangle size={14} />} color="#06b6d4" />
            </div>

            <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl pointer-events-auto">
                <span className="text-[9px] font-black text-slate-500 uppercase block mb-2 italic">Entorno de Simulación</span>
                <select 
                  value={escenario}
                  onChange={(e) => { generarSemillaM4(e.target.value as any); audio?.playPop(); }}
                  className="bg-emerald-500/10 text-emerald-400 text-[11px] font-black px-6 py-2.5 rounded-full border border-emerald-500/30 outline-none hover:bg-emerald-500/20 transition-all cursor-pointer appearance-none"
                >
                  <option value="pitagoras_basico">📐 TEOREMA BÁSICO</option>
                  <option value="diseno_rampas">🏗️ DISEÑO DE RAMPAS</option>
                  <option value="navegacion_maritima">🚢 NAVEGACIÓN MARÍTIMA</option>
                </select>
            </div>
        </div>

        {/* Dock de Control Inferior */}
        <div className="mt-auto flex justify-between items-end gap-10 pointer-events-auto">
            <div className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] flex-1 shadow-2xl grid grid-cols-2 gap-16">
                <div className="space-y-8">
                    <SimSlider label="Longitud Cateto A" value={catetoA || 3} min={1} max={10} step={1} color="cyan" onChange={(v: any) => { setCatetosM4(v, catetoB || 4); audio?.playPop(); }} />
                </div>
                <div className="space-y-8">
                    <SimSlider label="Longitud Cateto B" value={catetoB || 4} min={1} max={10} step={1} color="emerald" onChange={(v: any) => { setCatetosM4(catetoA || 3, v); audio?.playPop(); }} />
                </div>
            </div>

            <div className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] w-[400px] shadow-2xl flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hipotenusa Calculada (c)</span>
                   <div className="relative">
                      <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                        type="text" value={userInputC} onChange={(e) => setUserInputM4(e.target.value)}
                        placeholder="Valor de c..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xl font-black text-white focus:outline-none focus:border-emerald-500 transition-all font-mono"
                      />
                   </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => { setIsPouring(true); audio?.playSuccess(); }}
                    disabled={isPouring || llenado === 100}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-white/30 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all"
                  >
                    <Droplets size={18} className={isPouring ? 'animate-bounce' : ''} />
                    Verter Fluido
                  </button>
                  <button onClick={() => { resetM4(); audio?.playPop(); setLlenadoM4(0); setIsPouring(false); }} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 transition-all shadow-xl">
                    <RefreshCcw size={24} />
                  </button>
                  <button 
                    onClick={() => { const ok = validarM4(); if (ok) audio?.playSuccess(); else audio?.playError(); }}
                    className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all shadow-2xl ${status === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-emerald-600 border-emerald-500 text-white hover:scale-105 active:scale-95'}`}
                  >
                    {status === 'success' ? <ShieldCheck size={28} /> : <Target size={28} />}
                  </button>
                </div>
            </div>
        </div>
      </div>

      {/* ÉXITO FINAL */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-emerald-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(16,185,129,0.15)]">
                <Triangle size={100} className="text-emerald-500 mx-auto mb-8 rotate-90" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Teorema Validado</h3>
                <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">Has demostrado que la suma de los cuadrados de los catetos es igual al cuadrado de la hipotenusa mediante la transferencia de fluidos. La simulación ha sido validada bajo el estándar **Diamond State**.</p>
                <button onClick={() => router.push('/alumno/laboratorio/matematicas')} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-emerald-600/30">Cerrar Informe Geométrico</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function HUDCard({ label, value, icon, color }: any) {
  return (
    <div className={`px-8 py-5 rounded-[2rem] border border-white/10 flex items-center gap-5 transition-all bg-[#0A1121]/80 backdrop-blur-md shadow-2xl`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</span>
        <span className="block text-2xl font-black text-white tracking-tighter leading-none italic font-mono">{value}</span>
      </div>
    </div>
  );
}

function SimSlider({ label, value, min, max, step, color, onChange }: any) {
    const accent = color === 'cyan' ? 'accent-cyan-400' : 'accent-emerald-400';
    const text = color === 'cyan' ? 'text-cyan-400' : 'text-emerald-400';
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <span className={`text-[12px] font-black ${text} font-mono bg-white/5 px-2 py-0.5 rounded-lg border border-white/5 shadow-inner`}>{value.toFixed(1)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className={`w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer ${accent}`} />
        </div>
    );
}
