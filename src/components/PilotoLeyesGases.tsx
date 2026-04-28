"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  AlertTriangle, Thermometer, Gauge, Box, 
  RefreshCcw, CheckCircle2, Flame, Info, 
  Wind, Activity, Zap, Beaker, ChevronRight,
  TrendingUp, Scaling, Atom, Rocket, MousePointer2,
  Clock, Binary, Droplets, Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { audio } from '@/utils/audioEngine';
import dynamic from 'next/dynamic';

const Gas3DScene = dynamic(() => import('./simuladores/qmi02/Gas3DScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#1e293b] flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 border-4 border-[#38bdf8]/20 border-t-[#38bdf8] rounded-full animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#38bdf8]">Cargando Cámara de Presión...</span>
    </div>
  )
});

export default function PilotoLeyesGases({ isWorktableDark, isProfesor }: { isWorktableDark: boolean, isProfesor: boolean }) {
  const router = useRouter();
  const updateGases = useSimuladorStore(state => state.updateGases);
  const resetGases = useSimuladorStore(state => state.resetGases);
  const generarSemillaGases = useSimuladorStore(state => state.generarSemillaGases);
  const stopTimer = useSimuladorStore(state => state.stopTimer);
  const pasoActual = useSimuladorStore(state => state.pasoActual);
  const setPasoActual = useSimuladorStore(state => state.setPasoActual);

  // Selectores atómicos para el estado de los gases
  const T = useSimuladorStore(state => state.gases.T || 300);
  const V = useSimuladorStore(state => state.gases.V || 10);
  const P = useSimuladorStore(state => state.gases.P || 1.0);
  const n = useSimuladorStore(state => state.gases.n || 0.406);
  const pTarget = useSimuladorStore(state => state.gases.pTarget || 3.5);
  const isExploded = useSimuladorStore(state => state.gases.isExploded || false);
  const gasType = useSimuladorStore(state => state.gases.gasType || 'He');

  const [mounted, setMounted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!pTarget) generarSemillaGases();
  }, [generarSemillaGases, pTarget]);

  // Efecto para Audio de Error (Explosión)
  useEffect(() => {
    if (isExploded) {
      audio.playError();
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
    }
  }, [isExploded]);

  const handleValidar = () => {
    const error = Math.abs(P - pTarget);
    if (error < 0.1) {
      setShowSuccess(true);
      audio.playNotification();
      stopTimer();
      setPasoActual(5);
    } else {
      audio.playError();
      audio.playNotification();
    }
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full relative select-none font-['Outfit'] overflow-hidden bg-[#0A1121]">
      
      {/* 1. MOTOR 3D INMERSIVO (FULL SCREEN) */}
      <div className="absolute inset-0 z-0">
        <Gas3DScene 
          temperature={T}
          volume={V}
          moles={n}
          isExploded={isExploded}
          gasType={gasType as any}
        />
      </div>

      {/* 2. HUD SUPERIOR (TELEMETRÍA DIAMOND) */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex gap-4">
          <HUDCard 
            label="Temperatura" 
            value={`${T.toFixed(0)}K`} 
            icon={<Thermometer size={14} />} 
            color="#EF4444" 
          />
          <HUDCard 
            label="Volumen" 
            value={`${V.toFixed(1)}L`} 
            icon={<Box size={14} />} 
            color="#38bdf8" 
          />
          <HUDCard 
            label="Moles (n)" 
            value={`${n.toFixed(3)}`} 
            icon={<Atom size={14} />} 
            color="#A855F7" 
          />
        </div>

        <div className="flex gap-4">
          <HUDCard 
            label="Presión Actual" 
            value={`${P.toFixed(2)} atm`} 
            icon={<Gauge size={14} />} 
            color={P > 6.0 ? "#EF4444" : "#22C55E"} 
            highlight={P > 6.0}
          />
          <HUDCard 
            label="Objetivo" 
            value={`${pTarget.toFixed(2)} atm`} 
            icon={<Target size={14} />} 
            color="#F59E0B" 
            isStatic
          />
        </div>
      </div>

      {/* 3. PANEL DE CONTROL (DOCK INFERIOR) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full max-w-4xl px-8 pointer-events-auto">
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-[#0A1121]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 shadow-[0_40px_100px_rgba(0,0,0,0.5)] flex items-center justify-between gap-12"
        >
          {/* Controles de Variables */}
          <div className="flex-1 flex gap-12 items-center">
            {/* Slider Temperatura */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Termostato (K)</span>
                <span className="text-xs font-black text-red-400">{T}K</span>
              </div>
              <input 
                type="range" min="100" max="1000" step="10" value={T}
                onChange={(e) => updateGases(parseInt(e.target.value), V, n)}
                className="w-full accent-red-500 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Slider Volumen */}
            <div className="flex-1 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Compresor (V)</span>
                <span className="text-xs font-black text-blue-400">{V.toFixed(1)}L</span>
              </div>
              <input 
                type="range" min="2" max="15" step="0.1" value={V}
                onChange={(e) => updateGases(T, parseFloat(e.target.value), n)}
                className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer"
              />
            </div>

            {/* Inyección de Moles */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Masa</span>
              <button 
                onClick={() => updateGases(T, V, Math.min(2.0, n + 0.05))}
                className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 hover:bg-purple-500 hover:text-white transition-all active:scale-90"
                title="Inyectar Gas"
              >
                <Wind size={20} />
              </button>
            </div>
          </div>

          {/* Botón de Acción Principal */}
          <div className="flex items-center gap-4 border-l border-white/10 pl-12">
            <button 
              onClick={handleValidar}
              className="group h-16 px-10 bg-gradient-to-br from-[#22C55E] to-[#16A34A] rounded-3xl flex items-center gap-4 shadow-xl shadow-green-500/20 hover:scale-105 active:scale-95 transition-all"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 size={18} className="text-white" />
              </div>
              <div className="text-left">
                <span className="block text-[9px] font-black uppercase tracking-widest text-green-100/60 leading-none">Protocolo</span>
                <span className="block text-sm font-black text-white uppercase tracking-tighter">Validar</span>
              </div>
            </button>

            <button 
              onClick={resetGases}
              className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
              title="Reiniciar"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </motion.div>
      </div>

      {/* 4. OVERLAYS DE ESTADO (EXPLOSIÓN / ÉXITO) */}
      <AnimatePresence>
        {isExploded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-red-950/40 backdrop-blur-2xl flex items-center justify-center p-12">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#0A1121] p-12 rounded-[3.5rem] border border-red-500/30 shadow-2xl text-center max-w-lg">
              <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-500/20 animate-pulse">
                <AlertTriangle size={56} />
              </div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 italic">Falla de Contención</h2>
              <p className="text-white/40 font-bold mb-10 leading-relaxed text-sm">La presión interna superó el límite de seguridad de <span className="text-red-500">7.0 atm</span>, provocando una descompresión explosiva. Reinicie el sistema para continuar.</p>
              <button onClick={resetGases} className="w-full py-6 bg-red-500 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-red-500/30 hover:bg-red-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                <RefreshCcw size={20} /> Reiniciar Cámara
              </button>
            </motion.div>
          </motion.div>
        )}

        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#0A1121]/60 backdrop-blur-2xl flex items-center justify-center p-12">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white p-12 rounded-[3.5rem] shadow-2xl text-center max-w-lg border-t-[12px] border-green-500">
              <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner animate-bounce">
                <CheckCircle2 size={56} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">Misión Cumplida</h2>
              <p className="text-slate-500 font-bold mb-10 leading-relaxed text-sm">Has alcanzado el punto de equilibrio térmico y barométrico con éxito. Los datos han sido registrados en la bitácora central.</p>
              <button onClick={() => router.push('/alumno/laboratorio/quimica')} className="w-full py-6 bg-slate-950 text-white font-black uppercase tracking-widest rounded-2xl shadow-xl hover:bg-green-600 transition-all active:scale-95">
                Continuar Lab Hub
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. HERRAMIENTAS LATERALES */}
      <div className="absolute top-1/2 -translate-y-1/2 right-8 flex flex-col gap-4 z-20">
        <ToolButton 
          icon={<Binary size={18} />} 
          label="Auto-Cal" 
          onClick={() => {
            const R = 0.08206;
            const targetT = (pTarget * V) / (n * R);
            updateGases(Math.round(targetT), V, n);
          }}
        />
        <ToolButton 
          icon={<Droplets size={18} />} 
          label="Tipo" 
          onClick={() => {
            const types: any[] = ['He', 'Ne', 'CO2'];
            const next = types[(types.indexOf(gasType) + 1) % types.length];
            useSimuladorStore.getState().setGasType(next);
          }}
        />
      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function HUDCard({ label, value, icon, color, highlight = false, isStatic = false }: any) {
  return (
    <motion.div 
      animate={highlight ? { scale: [1, 1.05, 1], borderColor: [color, "#FFF", color] } : {}}
      transition={{ duration: 0.5, repeat: highlight ? Infinity : 0 }}
      className={`px-6 py-4 rounded-3xl border border-white/10 flex items-center gap-4 transition-all ${isStatic ? 'bg-white/5' : 'bg-[#0A1121]/60 backdrop-blur-md shadow-2xl'}`}
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/30 leading-none mb-1">{label}</span>
        <span className="block text-lg font-black text-white tracking-tighter leading-none">{value}</span>
      </div>
    </motion.div>
  );
}

function ToolButton({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="group flex items-center gap-3 bg-[#0A1121]/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all active:scale-90"
    >
      <div className="text-white/40 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="hidden group-hover:block text-[9px] font-black uppercase tracking-widest text-white animate-in slide-in-from-right-2 fade-in">{label}</span>
    </button>
  );
}
