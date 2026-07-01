"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useRouter } from 'next/navigation';
import { audio } from '@/utils/audioEngine';
import {
  Flame, Snowflake, Layout,
  RotateCcw, Info, ArrowRight,
  Waves, Gauge, Activity, CheckCircle2
} from 'lucide-react';
import Solubilidad3DScene from './simuladores/qmi06/Solubilidad3DScene';

export default function PilotoSolubilidadCristalizacion() {
  const router = useRouter();
  const { solubilidad, setUbicacionVaso, addSalSolubilidad, setSustanciaSolubilidad, updateTemperaturaP6, resetP6, validarP6 } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const tempInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (tempInterval.current) clearInterval(tempInterval.current);
    tempInterval.current = setInterval(() => {
      updateTemperaturaP6(0.5);
    }, 100);
    return () => { if (tempInterval.current) clearInterval(tempInterval.current); };
  }, [solubilidad.ubicacion, updateTemperaturaP6]);

  // Fallback substances to avoid crashes if store state hasn't updated yet
  const sustanciasFallback = [
    { id: 'kno3', nombre: 'Nitrato de Potasio', formula: 'KNO₃', color: '#ffffff', a: 13.3, b: 0.02, desc: 'Alta dependencia térmica.' },
    { id: 'nacl', nombre: 'Cloruro de Sodio', formula: 'NaCl', color: '#f8fafc', a: 35.7, b: 0.001, desc: 'Curva casi plana.' },
    { id: 'cuso4', nombre: 'Sulfato de Cobre (II)', formula: 'CuSO₄', color: '#3b82f6', a: 14.3, b: 0.025, desc: 'Cristales azules vibrantes.' },
    { id: 'kclo3', nombre: 'Clorato de Potasio', formula: 'KClO₃', color: '#e2e8f0', a: 3.3, b: 0.04, desc: 'Muy baja solubilidad en frío.' }
  ];

  const sustancias = solubilidad.sustancias || sustanciasFallback;
  const sIdx = (typeof solubilidad.sustanciaIdx === 'number') ? solubilidad.sustanciaIdx : 0;
  const sActual = sustancias[sIdx] || sustancias[0];

  const limite = sActual.a * Math.exp(sActual.b * solubilidad.temp);
  const salSolida = Math.max(0, solubilidad.salAgregada - limite);
  const saturationRatio = Math.min(1, solubilidad.salAgregada / (limite || 1));

  // Alerta de Cristalización Narrativa
  useEffect(() => {
    if (salSolida > 1 && solubilidad.ubicacion === 'hielo') {
      audio?.playNotification();
    }
  }, [salSolida > 1, solubilidad.ubicacion === 'hielo']);

  if (!mounted) return null;

  const estaciones = [
    { id: 'parrilla' as const, label: 'Estación Térmica', icon: Flame, color: '#fb8500' },
    { id: 'mesa' as const, label: 'Zona de Trabajo', icon: Layout, color: '#ffffff' },
    { id: 'hielo' as const, label: 'Cámara Criogénica', icon: Snowflake, color: '#219ebc' },
  ];

  return (
    <div className="relative w-full h-full bg-[#020617] overflow-hidden font-sans text-white">

      {/* ── ESCENA 3D — VASO DE PRECIPITADOS / CRISTALIZACIÓN (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <Solubilidad3DScene
          temp={solubilidad.temp}
          salAgregada={solubilidad.salAgregada}
          limite={limite}
          salSolida={salSolida}
          saturationRatio={saturationRatio}
          color={sActual.color}
          ubicacion={solubilidad.ubicacion}
        />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#020617]/75 via-transparent to-[#020617]/85" />

      {/* ── CAPA DE INTERFAZ ── */}
      <main className="absolute inset-0 z-10 flex flex-col pointer-events-none">

        {/* CHECKLIST HUD (DIAMOND STANDARD) */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[600px] max-w-[92vw] pointer-events-none z-20">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} className="animate-pulse" /> Estado del Reactor Térmico
              </span>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Solubility Status HUD</span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border transition-all ${solubilidad.salAgregada > 0 ? 'bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[9px] font-black uppercase text-white/40 mb-2">Reactivo</div>
                <div className={`text-sm font-black italic ${solubilidad.salAgregada > 0 ? 'text-orange-400' : 'text-white/20'}`}>{solubilidad.salAgregada > 0 ? 'CARGADO' : 'PENDIENTE'}</div>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${solubilidad.temp > 25 ? 'bg-red-500/10 border-red-500/30' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[9px] font-black uppercase text-white/40 mb-2">Energía</div>
                <div className={`text-sm font-black italic ${solubilidad.temp > 25 ? 'text-red-400' : 'text-white/20'}`}>{solubilidad.temp > 25 ? 'ALTA' : 'AMBIENTE'}</div>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${salSolida > 0 ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'bg-white/5 border-white/5'}`}>
                <div className="text-[9px] font-black uppercase text-white/40 mb-2">Precipitación</div>
                <div className={`text-sm font-black italic ${salSolida > 0 ? 'text-cyan-400' : 'text-white/20'}`}>{salSolida > 0 ? 'ACTIVA' : 'SOLUBLE'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── TELEMETRÍA TÉRMICA (SUPERIOR IZQUIERDA) ── */}
        <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none z-20">
          <div className="px-5 py-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full flex items-center gap-3 w-fit pointer-events-auto">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Thermal Telemetry</span>
          </div>
          <h2 className="text-6xl font-black text-white italic tracking-tighter flex items-baseline gap-3 drop-shadow-[0_2px_20px_rgba(0,0,0,0.8)]">
            {solubilidad.temp.toFixed(1)} <span className="text-2xl text-slate-500 not-italic uppercase tracking-widest font-bold">deg.C</span>
          </h2>
          <div className="mt-1 text-xs font-black text-[#FB8500] uppercase tracking-widest flex items-center gap-2">
            <Info size={14} />
            <span>Substancia: {sActual.nombre}</span>
          </div>
        </div>

        {/* ── ESTADO QUÍMICO (SUPERIOR DERECHA) ── */}
        <div className="absolute top-8 right-8 flex flex-col items-end gap-4 pointer-events-none z-20">
          <div className="p-6 bg-slate-900/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl flex items-center gap-8 pointer-events-auto">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Masa Soluto</span>
              <span className="text-3xl font-black text-white tabular-nums">{solubilidad.salAgregada.toFixed(1)}g</span>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Estado Químico</span>
              <div className={`px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter ${salSolida > 0 ? 'bg-orange-500 text-black' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                {salSolida > 0 ? 'SOBRESATURADA' : (saturationRatio > 0.9 ? 'SATURADA' : 'INSATURADA')}
              </div>
            </div>
          </div>

          {/* Selector de estación térmica */}
          <div className="flex gap-2 pointer-events-auto">
            {estaciones.map((e) => {
              const Icon = e.icon;
              const active = solubilidad.ubicacion === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => { setUbicacionVaso(e.id); audio.playPop(); audio.playNotification(); }}
                  title={e.label}
                  className={`group flex items-center gap-2 px-4 py-3 rounded-2xl border transition-all active:scale-95 ${active ? 'bg-white/10 border-white/30 shadow-[0_0_25px_rgba(255,255,255,0.12)]' : 'bg-slate-900/60 border-white/10 hover:bg-white/5'}`}
                >
                  <Icon className="w-4 h-4 transition-colors" style={{ color: active ? e.color : '#64748b' }} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-slate-500'}`}>{e.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── PANEL DE CONTROL INFERIOR (DIAMOND DOCK) ── */}
        <div className="absolute bottom-8 inset-x-8 flex justify-between items-end z-[100]">

          {/* Dock de Acciones con Selector de Substancias */}
          <div className="group p-3 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex items-center gap-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] pointer-events-auto">
            <div className="flex flex-col px-6 border-r border-white/10">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Selector de Reactivo</span>
              <div className="flex gap-2">
                {sustancias.map((s: (typeof sustanciasFallback)[number], i: number) => (
                  <button
                    key={s.id}
                    onClick={() => { setSustanciaSolubilidad(i); audio.playPop(); }}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border ${sIdx === i ? 'bg-orange-500 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.4)] text-black' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                    title={s.nombre}
                  >
                    <span className="text-[9px] font-black">{s.formula.slice(0, 3)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 p-1">
              <button
                onClick={() => { addSalSolubilidad(20); audio.playPop(); }}
                disabled={solubilidad.salAgregada >= 200}
                className="group relative flex items-center gap-4 px-10 py-6 bg-orange-500 hover:bg-orange-400 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl shadow-orange-500/30 overflow-hidden"
              >
                <span>Añadir 20g</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const ok = validarP6();
                  if (ok) { audio.playSuccess(); } else { audio.playError(); }
                }}
                className="px-8 py-6 bg-cyan-600 hover:bg-cyan-500 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl shadow-cyan-600/30"
              >
                Verificar Cristalización
              </button>

              <button
                onClick={() => { resetP6(); audio.playRemove(); }}
                className="w-20 h-20 bg-slate-800 hover:bg-red-500 text-white rounded-[2.5rem] flex items-center justify-center transition-all border border-white/5 shadow-xl"
                title="Reset Reactor"
              >
                <RotateCcw className="w-7 h-7" />
              </button>
            </div>
          </div>

          {/* HUD DE RENDIMIENTO (DERECHA) */}
          <div className="flex flex-col gap-4 items-end pointer-events-auto">
            <div className="p-6 bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-2xl min-w-[320px]">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Gauge className="w-4 h-4 text-[#219ebc]" />
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Capacidad Máxima</span>
                </div>
                <span className="text-xs font-black text-white italic">{limite.toFixed(1)}g</span>
              </div>

              <div className="relative h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 p-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${saturationRatio * 100}%` }}
                  className={`h-full rounded-full transition-colors duration-1000 ${saturationRatio >= 1 ? 'bg-orange-500 shadow-[0_0_30px_#f97316]' : 'bg-[#219EBC] shadow-[0_0_30px_#219ebc]'}`}
                />
              </div>

              <p className="mt-3 text-[9px] text-slate-500 leading-tight italic font-bold">{sActual.desc}</p>
            </div>

            <div className="flex gap-3">
              <div className="px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest italic">H₂O Pura: 100mL</span>
              </div>
              <div className="px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
                <Gauge className="w-4 h-4 text-slate-400" />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest italic">1.0 ATM</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {solubilidad.status === 'success' && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-xl pointer-events-auto">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-[#071a10] border border-emerald-500/40 rounded-[3rem] p-12 max-w-md text-center shadow-[0_40px_100px_rgba(16,185,129,0.2)]"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-[1.6rem] bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">¡Cristalización Exitosa!</h2>
            <p className="text-sm text-slate-300 mb-8">Lograste la sobresaturación en condiciones de enfriamiento. Los cristales precipitan correctamente.</p>
            <button onClick={resetP6} className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Nuevo Experimento
            </button>
            <button onClick={() => router.push('/hub')} className="w-full mt-3 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
              Cerrar Laboratorio
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
