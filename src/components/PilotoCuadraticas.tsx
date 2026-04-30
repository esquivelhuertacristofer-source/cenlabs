"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  Target, Activity, Zap, ShieldCheck,
  RefreshCcw, Info, BookOpen, Bot,
  FunctionSquare, Pi, Shapes
} from 'lucide-react';
import ComplexPlaneMonitor from './ComplexPlaneMonitor';
import Cuadraticas3DScene from './simuladores/mat01/Cuadraticas3DScene';
import {
  solveQuadratic, formatQuadratic,
  getEquivalentForms, getDomainRangeInfo,
} from '@/utils/mathEngine';
import { audio as audioEngine } from '@/utils/audioEngine';

export default function PilotoCuadraticas() {
  const router = useRouter();
  const { cuadraticas, setCoefsM1, validarM1, registrarHallazgoM1, resetM1, setAsistente, pasoActual, setPasoActual, bitacoraData, setBitacora, registrarHallazgo, stopTimer } = useSimuladorStore();
  const { a, b, c, target, status } = cuadraticas;
  
  const calcReady = (cuadraticas.deltaVerified ?? false) && (cuadraticas.vertexVerified ?? false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Explorador de Cuadráticas. Tu misión es ajustar los coeficientes para interceptar la trayectoria objetivo. Usa el discriminante para predecir las raíces.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // -- MOTOR MATEMÁTICO --
  const currentRes  = useMemo(() => solveQuadratic(a, b, c), [a, b, c]);
  const currentEq   = useMemo(() => formatQuadratic(a, b, c), [a, b, c]);
  const forms       = useMemo(() => getEquivalentForms(a, b, c, currentRes.vertex, currentRes.roots), [a, b, c, currentRes]);
  const domainInfo  = useMemo(() => getDomainRangeInfo(a, b, currentRes.vertex.k, c), [a, b, currentRes.vertex.k, c]);

  const { h: vh, k: vk } = currentRes.vertex;

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (a !== 1 || b !== 0 || c !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (calcReady && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) {
      setPasoActual(3);
      stopTimer();
      registrarHallazgo('mat_cuadraticas_sincronia', {
        coef_a: a,
        coef_b: b,
        coef_c: c,
        target_a: target.a,
        target_b: target.b,
        target_c: target.c,
        delta: currentRes.delta,
        vertice: currentRes.vertex
      });
    }
  }, [a, b, c, calcReady, status, pasoActual, setPasoActual, stopTimer, registrarHallazgo, target, currentRes]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full bg-[#020617] flex items-center justify-center overflow-hidden font-['Outfit'] text-white">
      
      {/* ── GIANT TELEMETRY BACKGROUND ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 z-0">
        <span className="text-[14rem] font-black font-mono text-rose-500 select-none italic">
          {currentRes.delta.toFixed(1)}
        </span>
      </div>

      {/* ── CHECKLIST HUD (DIAMOND STANDARD) ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-rose-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(244,63,94,0.15)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-xl">
                <FunctionSquare className="text-rose-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-widest leading-none">Sincronía Algebraica</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">MAT-01 • Protocolo Parábola</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Parámetros" },
                { step: 2, label: "Cálculo" },
                { step: 3, label: "Sincronía" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-rose-500 border-rose-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                   {pasoActual > s.step ? <ShieldCheck size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                   <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── HUD SUPERIOR: TELEMETRÍA ── */}
      <div className="absolute top-36 left-7 right-7 flex justify-between items-start z-20 pointer-events-none gap-4">
        
        {/* Panel de Formas */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-4 pointer-events-auto max-w-[320px]">
          <div className="bg-black/60 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl group">
             <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4 block">Telemetría de Función</span>
             <div className="font-mono text-2xl font-black text-white mb-6 leading-tight italic tracking-tighter">
                {currentEq}
             </div>
             <div className="grid grid-cols-2 gap-3">
                <DataChip label="Vértice" value={`(${vh.toFixed(1)}, ${vk.toFixed(1)})`} color="slate" />
                <DataChip label="Discriminante" value={currentRes.delta.toFixed(1)} color={currentRes.delta < 0 ? 'rose' : 'emerald'} />
             </div>
          </div>

          <div className="bg-black/40 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/5 space-y-4">
             <EquivFormRow label="Forma Vértice" color="rose" formula={forms.vertexForm} />
             {forms.factored && <EquivFormRow label="Forma Factorizada" color="amber" formula={forms.factored} />}
          </div>
        </motion.div>

        {/* Panel Objetivo */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-4 pointer-events-auto">
          <div className="bg-[#FB8500]/10 backdrop-blur-3xl p-6 rounded-[2.5rem] border border-[#FB8500]/30 shadow-2xl min-w-[280px]">
             <div className="flex justify-between items-start mb-4">
                <span className="text-[9px] font-black text-[#FB8500] uppercase tracking-[0.2em]">Trayectoria Objetivo</span>
                <Target size={18} className="text-[#FB8500] animate-pulse" />
             </div>
             <div className="font-mono text-lg font-bold text-white/90 mb-4 tracking-tighter italic">
                {formatQuadratic(target.a, target.b, target.c)}
             </div>
             <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                   <motion.div 
                     animate={{ width: `${Math.max(5, 100 - Math.abs(a - target.a)*20 - Math.abs(b - target.b)*10)}%` }}
                     className="h-full bg-gradient-to-r from-orange-500 to-amber-500" 
                   />
                </div>
                <span className="text-[9px] font-black text-[#FB8500]">SYNC</span>
             </div>
          </div>

          <ComplexPlaneMonitor roots={currentRes.roots} isVisible={currentRes.delta < 0} />
        </motion.div>
      </div>

      {/* ── ESCENA GRÁFICA 3D ── */}
      <div className="absolute inset-0 z-10 pointer-events-auto">
        <Cuadraticas3DScene a={a} b={b} c={c} target={target} currentRes={currentRes} />
      </div>

      {/* ── DOCK DE CONTROL INFERIOR ── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[1200px] px-8 z-40">
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl flex items-center justify-between gap-10">
          <div className="flex-1 flex gap-12">
            <CoefficientSlider label="Amplitud (a)" value={a} min={-5} max={5} step={0.1} color="rose" onChange={(v: any) => { setCoefsM1(v, b, c); audioEngine?.playPop(); }} />
            <CoefficientSlider label="Simetría (b)" value={b} min={-10} max={10} step={0.5} color="cyan" onChange={(v: any) => { setCoefsM1(a, v, c); audioEngine?.playPop(); }} />
            <CoefficientSlider label="Intercepto (c)" value={c} min={-10} max={10} step={0.5} color="amber" onChange={(v: any) => { setCoefsM1(a, b, v); audioEngine?.playPop(); }} />
          </div>

          <div className="flex items-center gap-4 border-l border-white/10 pl-10">
             <button 
               onClick={() => { 
                 audioEngine?.playSuccess(); 
                 setAsistente({ text: "Punto de telemetría capturado. Los datos han sido registrados en tu Bitácora Algebraica.", pose: "happy" });
                 
                 const nuevoPunto = {
                   id: crypto.randomUUID(),
                   x: vh.toFixed(2),
                   y: vk.toFixed(2),
                   timestamp: "VÉRTICE " + new Date().toLocaleTimeString()
                 };
                 
                 const logsPrevios = bitacoraData?.cuadraticas_points || [];
                 setBitacora({
                   ...bitacoraData,
                   cuadraticas_points: [nuevoPunto, ...logsPrevios].slice(0, 10)
                 });
               }} 
               className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-rose-400 transition-all group"
               title="Registrar Vértice"
             >
                <Activity size={20} className="group-hover:scale-125 transition-transform" />
             </button>
             <button onClick={() => { resetM1(); audioEngine?.playPop(); setAsistente({ text: "Sistemas reiniciados. Ajusta los parámetros para una nueva trayectoria.", pose: "neutral" }); }} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500 transition-all">
                <RefreshCcw size={20} />
             </button>
             <button 
               onClick={() => { const ok = validarM1(); if (ok) audioEngine?.playSuccess(); else audioEngine?.playError(); }}
               disabled={!calcReady && status !== 'success'}
               className={`h-16 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl transition-all ${status === 'success' ? 'bg-emerald-600' : calcReady ? 'bg-rose-600 shadow-rose-600/20' : 'bg-white/10 text-white/20'}`}
             >
                <ShieldCheck size={18} />
                {status === 'success' ? 'Sincronizado' : 'Validar'}
             </button>
          </div>
        </motion.div>
      </div>

      {/* MENSAJE TUTOR / DR. QUANTUM */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
             <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-rose-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(244,63,94,0.15)]">
                <Pi size={100} className="text-rose-500 mx-auto mb-8" />
                <h3 className="text-5xl font-black text-white uppercase italic mb-6">Misión Completada</h3>
                <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">Has interceptado la trayectoria objetivo con precisión milimétrica. La sincronía de la función cuadrática ha sido validada bajo el estándar **Diamond State**.</p>
                <button onClick={() => router.push('/alumno/laboratorio/matematicas')} className="w-full py-6 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-rose-600/30">Cerrar Informe de Trayectoria</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function DataChip({ label, value, color }: any) {
  const colors: any = { rose: 'text-rose-400', emerald: 'text-emerald-400', slate: 'text-slate-400' };
  return (
    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
      <span className="text-[7px] font-black text-slate-500 uppercase block mb-1">{label}</span>
      <span className={`text-[11px] font-black font-mono ${colors[color]}`}>{value}</span>
    </div>
  );
}

function EquivFormRow({ label, color, formula }: any) {
  const colors: any = { rose: 'border-rose-500/30 text-rose-400', amber: 'border-amber-500/30 text-amber-400' };
  return (
    <div>
      <span className="text-[7px] font-black text-slate-500 uppercase block mb-1">{label}</span>
      <div className={`pl-3 border-l-2 ${colors[color]} font-mono text-[10px] font-bold text-white/80`}>{formula}</div>
    </div>
  );
}

function CoefficientSlider({ label, value, min, max, step, color, onChange }: any) {
  const accents: any = { rose: 'accent-rose-500', cyan: 'accent-cyan-400', amber: 'accent-amber-400' };
  return (
    <div className="flex-1 space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-[11px] font-black font-mono text-white bg-white/5 px-2 py-0.5 rounded-lg">{value.toFixed(1)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className={`w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer ${accents[color]}`} />
    </div>
  );
}
