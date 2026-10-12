"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { solubilidadA, TABLAS_SOLUBILIDAD, type TablaSolubilidad } from '@/domain/quimica';
import { audio } from '@/utils/audioEngine';
import {
  Flame, Snowflake, Layout,
  RotateCcw, Info, ArrowRight,
  Waves, Gauge, Activity, CheckCircle2
} from 'lucide-react';
import Solubilidad3DScene from './simuladores/qmi06/Solubilidad3DScene';

type Sustancia = { id: string; nombre: string; formula: string; color: string; tabla: TablaSolubilidad; desc: string };

// Respaldo por si el store aún no trae el catálogo (mismas tablas CRC del dominio).
const SUSTANCIAS_RESPALDO: Sustancia[] = [
  { id: 'kno3', nombre: 'Nitrato de Potasio', formula: 'KNO₃', color: '#ffffff', tabla: TABLAS_SOLUBILIDAD.kno3, desc: 'Muy dependiente de la temperatura.' },
  { id: 'nacl', nombre: 'Cloruro de Sodio', formula: 'NaCl', color: '#f8fafc', tabla: TABLAS_SOLUBILIDAD.nacl, desc: 'Curva casi plana.' },
  { id: 'cuso4', nombre: 'Sulfato de Cobre (II)', formula: 'CuSO₄', color: '#3b82f6', tabla: TABLAS_SOLUBILIDAD.cuso4, desc: 'Cristaliza como pentahidrato azul.' },
  { id: 'kclo3', nombre: 'Clorato de Potasio', formula: 'KClO₃', color: '#e2e8f0', tabla: TABLAS_SOLUBILIDAD.kclo3, desc: 'Muy poco soluble en frío.' },
];

// La temperatura avanza 4 veces por segundo con el tiempo real (dt en s); el
// store no escribe si el cambio es despreciable.
const PASO_TERMICO_MS = 250;

export default function PilotoSolubilidadCristalizacion({ onValidate }: { onValidate?: () => void }) {
  const { solubilidad, setUbicacionVaso, addSalSolubilidad, setSustanciaSolubilidad, updateTemperaturaP6, resetP6, validarP6 } =
    useSimuladorStore(useShallow((s) => ({
      solubilidad: s.solubilidad, setUbicacionVaso: s.setUbicacionVaso, addSalSolubilidad: s.addSalSolubilidad,
      setSustanciaSolubilidad: s.setSustanciaSolubilidad, updateTemperaturaP6: s.updateTemperaturaP6,
      resetP6: s.resetP6, validarP6: s.validarP6,
    })));
  const [mounted, setMounted] = useState(false);
  const tempInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ultimo = performance.now();
    tempInterval.current = setInterval(() => {
      const ahora = performance.now();
      updateTemperaturaP6(Math.min(1, (ahora - ultimo) / 1000));
      ultimo = ahora;
    }, PASO_TERMICO_MS);
    return () => { if (tempInterval.current) clearInterval(tempInterval.current); };
  }, [updateTemperaturaP6]);

  const sustancias: Sustancia[] = solubilidad.sustancias?.length ? solubilidad.sustancias : SUSTANCIAS_RESPALDO;
  const sIdx = (typeof solubilidad.sustanciaIdx === 'number') ? solubilidad.sustanciaIdx : 0;
  const sActual = sustancias[sIdx] || sustancias[0];

  // Solubilidad tabulada (CRC) interpolada a la temperatura actual, g / 100 g de agua.
  const limite = solubilidadA(sActual.tabla, solubilidad.temp);
  const salSolida = Math.max(0, solubilidad.salAgregada - limite);
  const saturationRatio = Math.min(1, solubilidad.salAgregada / (limite || 1));
  const estadoQuimico = salSolida > 0.05
    ? 'SATURADA + CRISTALES'
    : solubilidad.salAgregada / (limite || 1) > 0.98 ? 'SATURADA' : 'INSATURADA';

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
                {estadoQuimico}
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
                {sustancias.map((s, i) => (
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
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Añadir sal</span>
                <div className="flex gap-1.5">
                  {[1, 5, 20].map((g) => (
                    <button
                      key={g}
                      onClick={() => { addSalSolubilidad(g); audio.playPop(); }}
                      disabled={solubilidad.salAgregada + g > 300}
                      className="flex items-center gap-1 px-4 py-4 bg-orange-500 hover:bg-orange-400 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-orange-500/30"
                    >
                      +{g} g {g === 20 && <ArrowRight className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  // Un solo juez: el validador de la práctica (quiz + modal comunes).
                  if (onValidate) { onValidate(); return; }
                  if (validarP6()) audio.playSuccess(); else audio.playError();
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

              <p className="mt-3 text-[9px] text-slate-400 leading-tight italic font-bold">{sActual.desc} Solubilidad a {solubilidad.temp.toFixed(0)} °C según tablas CRC, por 100 g de agua.</p>
              <div className={`mt-3 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${solubilidad.disueltoEnCaliente ? 'text-emerald-400' : 'text-slate-500'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {solubilidad.disueltoEnCaliente ? 'Disolución en caliente lograda' : 'Aún sin disolución en caliente'}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest italic">H₂O Pura: 100 g</span>
              </div>
              <div className="px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
                <Gauge className="w-4 h-4 text-slate-400" />
                <span className="text-[9px] font-black text-white/80 uppercase tracking-widest italic">1.0 ATM</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Aviso pequeño, no modal: el éxito lo anuncia el flujo común (quiz + modal). */}
      {solubilidad.status === 'success' && (
        <div className="absolute top-44 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-emerald-600/90 border border-emerald-400/50 rounded-full px-5 py-2 flex items-center gap-2 shadow-xl">
          <CheckCircle2 size={14} className="text-white" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest">Cristalización por enfriamiento lograda</span>
        </div>
      )}

    </div>
  );
}
