"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  Target, Activity, Zap, ShieldCheck,
  RefreshCcw, Info, BookOpen,
} from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import {
  solveQuadratic, formatQuadratic,
  getEquivalentForms, getDomainRangeInfo,
} from '@/utils/mathEngine';
import ComplexPlaneMonitor from './ComplexPlaneMonitor';

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function PilotoCuadraticas() {
  const { cuadraticas, setCoefsM1, validarM1, registrarHallazgoM1, resetM1 } = useSimuladorStore();
  const { a, b, c, target, status } = cuadraticas;
  const calcReady = (cuadraticas.deltaVerified ?? false) && (cuadraticas.vertexVerified ?? false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Motor Matemático ──────────────────────────────────────────────────────
  const currentRes  = useMemo(() => solveQuadratic(a, b, c), [a, b, c]);
  const currentEq   = useMemo(() => formatQuadratic(a, b, c), [a, b, c]);
  const forms       = useMemo(() => getEquivalentForms(a, b, c, currentRes.vertex, currentRes.roots), [a, b, c, currentRes]);
  const domainInfo  = useMemo(() => getDomainRangeInfo(a, b, currentRes.vertex.k, c), [a, b, currentRes.vertex.k, c]);

  // ── Geometría SVG (1 unidad = 50 px, origen en 500,500) ──────────────────
  const unit = 50;
  const cX = 500, cY = 500;

  const generatePath = (coeffs: { a: number; b: number; c: number }) => {
    const pts: string[] = [];
    for (let x = -11; x <= 11; x += 0.08) {
      const y = coeffs.a * x * x + coeffs.b * x + coeffs.c;
      pts.push(`${cX + x * unit},${cY - y * unit}`);
    }
    return `M ${pts.join(' L ')}`;
  };

  const studentPath = useMemo(() => generatePath({ a, b, c }), [a, b, c]);
  const targetPath  = useMemo(() => generatePath(target), [target]);

  const axisLabels = [-8, -6, -4, -2, 2, 4, 6, 8];
  const symAxisX   = cX + currentRes.vertex.h * unit;
  const interceptYpx = cY - c * unit;
  const { h: vh, k: vk } = currentRes.vertex;

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full bg-[#030712] flex items-center justify-center overflow-hidden font-sans">

      {/* ── FONDO MATEMÁTICO ── */}
      <div className="absolute inset-0 z-0 text-white/5 font-mono text-[7px] pointer-events-none p-4 overflow-hidden leading-tight select-none opacity-20">
        {Array.from({ length: 45 }).map((_, i) => (
          <div key={i} className="whitespace-nowrap">
            {Array.from({ length: 6 }).map(() =>
              `Δ=b²−4ac  x=(−b±√Δ)/2a  f(x)=a(x−h)²+k  r₁+r₂=−b/a  r₁·r₂=c/a  Dom(f)=ℝ  `
            ).join('')}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1d4ed810,transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:100px_100px]" />
      </div>

      {/* ── TOP HUD ── */}
      <div className="absolute top-6 left-7 right-7 flex justify-between items-start z-20 pointer-events-none gap-4">

        {/* ─── HUD Izquierdo ─── */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-3 pointer-events-auto">

          {/* Tarjeta de Telemetría */}
          <div className="bg-black/65 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-white/10 shadow-2xl min-w-[320px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-15 group-hover:opacity-30 transition-opacity">
              <Zap size={22} className="text-rose-500" />
            </div>
            <span className="text-[9px] font-black text-rose-500 uppercase tracking-[0.2em] mb-3 block">Sonda de Telemetría</span>
            <div className="font-mono text-[22px] font-black text-white tracking-wider drop-shadow-lg mb-4 leading-tight">
              {currentEq}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <DataChip label="Vértice (h, k)" value={`(${vh.toFixed(2)}, ${vk.toFixed(2)})`} color="slate" />
              <DataChip
                label={`Δ = b²−4ac ${currentRes.nature === 'complex' ? '→ ℂ' : '→ ℝ'}`}
                value={currentRes.delta.toFixed(2)}
                color={currentRes.delta < 0 ? 'rose' : currentRes.delta === 0 ? 'amber' : 'emerald'}
              />
              <DataChip label="Eje de Simetría" value={`x = ${vh.toFixed(2)}`} color="amber" />
              <DataChip label="Intercepto Y" value={`(0, ${c.toFixed(2)})`} color="cyan" />
            </div>
          </div>

          {/* Panel 3 Formas Equivalentes */}
          <div className="bg-black/50 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/5 shadow-xl max-w-[320px]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">3 Formas Equivalentes</span>
              <span className="text-[7px] font-bold text-amber-400/70 border border-amber-400/20 px-2 py-0.5 rounded-full">≡ Identidad Algebraica</span>
            </div>
            <div className="space-y-3">
              <EquivFormRow label="Estándar  (ax² + bx + c)" color="rose" formula={forms.standard} />
              <EquivFormRow label="Vértice  (a(x−h)² + k)" color="amber" formula={forms.vertexForm} />
              {forms.factored
                ? <EquivFormRow label="Factorizada  (a(x−r₁)(x−r₂))" color="cyan" formula={forms.factored} />
                : (
                  <div className="flex items-center gap-2 pl-3 border-l-2 border-rose-500/25">
                    <span className="text-[9px] font-bold text-rose-500/50 italic">Sin factorización real (Δ &lt; 0)</span>
                  </div>
                )
              }
            </div>
          </div>
        </motion.div>

        {/* ─── HUD Derecho ─── */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-3 pointer-events-auto">

          {/* Tarjeta Objetivo */}
          <div className="bg-[#FB8500]/10 backdrop-blur-3xl p-5 rounded-[2.5rem] border border-[#FB8500]/30 shadow-2xl min-w-[260px] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-5 opacity-10">
              <Target size={30} className="text-[#FB8500]" />
            </div>
            <span className="text-[9px] font-black text-[#FB8500] uppercase tracking-[0.2em] mb-3 block">Trayectoria Objetivo</span>
            <div className="font-mono text-lg font-bold text-white/90 mb-4 tracking-tight">
              {formatQuadratic(target.a, target.b, target.c)}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.max(4, 100 - Math.abs(a - target.a)*18 - Math.abs(b - target.b)*8 - Math.abs(c - target.c)*5)}%` }}
                  className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                  transition={{ type: 'spring', stiffness: 60, damping: 20 }}
                />
              </div>
              <span className="text-[8px] font-black text-[#FB8500] tabular-nums">
                {Math.max(0, Math.floor(100 - Math.abs(a - target.a)*18 - Math.abs(b - target.b)*8))}% SYNC
              </span>
            </div>
          </div>

          {/* Dominio y Rango */}
          <div className="bg-black/50 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={12} className="text-purple-400" />
              <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Dominio y Rango</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black text-slate-500 w-14">Dom(f)</span>
                <span className="text-[11px] font-black text-slate-300 font-mono">{domainInfo.domain}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[8px] font-black text-slate-500 w-14">Ran(f)</span>
                <span className={`text-[11px] font-black font-mono ${a > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {domainInfo.range}
                </span>
              </div>
              <div className="h-px bg-white/5 my-1" />
              <div className="flex items-center gap-2">
                <div className={`w-1 h-5 rounded-full ${a > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className="text-[9px] font-bold text-slate-400">{domainInfo.concavity}</span>
              </div>
            </div>
          </div>

          {/* Monitor Plano Complejo */}
          <ComplexPlaneMonitor roots={currentRes.roots} isVisible={currentRes.delta < 0} />
        </motion.div>
      </div>

      {/* ── ESCENA GRÁFICA ── */}
      <div className="relative w-full max-w-4xl aspect-square z-10 p-12">
        <svg viewBox="0 0 1000 1000" className="w-full h-full overflow-visible">
          <defs>
            {/* Filtro glow para la parábola */}
            <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="9" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Filtro glow suave para marcadores */}
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Degradado de la parábola */}
            <linearGradient id="parabolaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            {/* Grid */}
            <pattern id="gridFine" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.4" opacity="0.04" />
            </pattern>
            <pattern id="gridCoarse" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.8" opacity="0.07" />
            </pattern>
          </defs>

          <rect width="1000" height="1000" fill="url(#gridFine)" />
          <rect width="1000" height="1000" fill="url(#gridCoarse)" />

          {/* ── EJE DE SIMETRÍA (animado) ── */}
          <motion.line
            x1={symAxisX} y1="10" x2={symAxisX} y2="990"
            stroke="#FB8500" strokeWidth="1.5" strokeDasharray="8 5"
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <text
            x={symAxisX + 7} y="42"
            fill="#FB8500" fontSize="12" fontWeight="900" opacity="0.75" fontFamily="monospace"
          >
            x = {vh.toFixed(1)}
          </text>

          {/* ── ETIQUETAS EJE X ── */}
          {axisLabels.map(v => (
            <g key={`xl-${v}`}>
              <line x1={cX + v * unit} y1={cY - 6} x2={cX + v * unit} y2={cY + 6}
                stroke="white" strokeWidth="1.5" opacity="0.25" />
              <text x={cX + v * unit} y={cY + 22} textAnchor="middle"
                fill="white" fontSize="11" opacity="0.22" fontFamily="monospace" fontWeight="700">
                {v}
              </text>
            </g>
          ))}
          {/* Etiqueta origen */}
          <text x={cX - 14} y={cY + 22} textAnchor="end"
            fill="white" fontSize="11" opacity="0.22" fontFamily="monospace" fontWeight="700">0</text>

          {/* ── ETIQUETAS EJE Y ── */}
          {axisLabels.map(v => (
            <g key={`yl-${v}`}>
              <line x1={cX - 6} y1={cY - v * unit} x2={cX + 6} y2={cY - v * unit}
                stroke="white" strokeWidth="1.5" opacity="0.25" />
              <text x={cX - 14} y={cY - v * unit + 4} textAnchor="end"
                fill="white" fontSize="11" opacity="0.22" fontFamily="monospace" fontWeight="700">
                {v}
              </text>
            </g>
          ))}

          {/* ── EJES PRINCIPALES ── */}
          <line x1="0" y1={cY} x2="1000" y2={cY} stroke="white" strokeWidth="2" opacity="0.12" />
          <line x1={cX} y1="0" x2={cX} y2="1000" stroke="white" strokeWidth="2" opacity="0.12" />
          {/* Flechas de los ejes */}
          <polygon points={`1000,${cY} 985,${cY - 7} 985,${cY + 7}`} fill="white" opacity="0.1" />
          <polygon points={`${cX},0 ${cX - 7},15 ${cX + 7},15`} fill="white" opacity="0.1" />

          {/* ── TRAYECTORIA OBJETIVO (Ghost dashed) ── */}
          <motion.path
            d={targetPath} fill="none"
            stroke="white" strokeWidth="2.5" strokeDasharray="14 8"
            animate={{ opacity: [0.1, 0.22, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* ── PARÁBOLA ACTUAL (Neon Trail) ── */}
          <motion.path
            d={studentPath} fill="none"
            stroke="url(#parabolaGrad)" strokeWidth="7" strokeLinecap="round"
            filter="url(#neonGlow)"
            layoutId="parabola"
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          />

          {/* ── PUNTO DE INTERCEPTO Y ── */}
          <motion.g initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}>
            <circle cx={cX} cy={interceptYpx} r="9" fill="#FB8500" opacity="0.2" />
            <circle cx={cX} cy={interceptYpx} r="5" fill="#FB8500" filter="url(#softGlow)" />
            <circle cx={cX} cy={interceptYpx} r="2.5" fill="white" />
            <text x={cX + 13} y={interceptYpx + 4}
              fill="#FB8500" fontSize="11" fontWeight="900" opacity="0.85" fontFamily="monospace">
              (0, {c.toFixed(1)})
            </text>
          </motion.g>

          {/* ── MARCADORES DE INTERÉS ── */}
          <AnimatePresence>
            {/* Vértice */}
            <motion.g key="vertex" initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <circle cx={cX + vh * unit} cy={cY - vk * unit} r="20" fill="white" opacity="0.04" className="animate-ping" />
              <circle cx={cX + vh * unit} cy={cY - vk * unit} r="8" fill="white" filter="url(#softGlow)" opacity="0.6" />
              <circle cx={cX + vh * unit} cy={cY - vk * unit} r="4.5" fill="#f43f5e" stroke="white" strokeWidth="2" />
              <text
                x={cX + vh * unit + 14} y={cY - vk * unit - 10}
                fill="white" fontSize="12" fontWeight="900" opacity="0.65" fontFamily="monospace"
              >
                V({vh.toFixed(1)}, {vk.toFixed(1)})
              </text>
            </motion.g>

            {/* Raíces Reales */}
            {currentRes.delta >= 0 && currentRes.roots.map((root, i) => (
              <motion.g key={`root-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }}>
                <circle cx={cX + root.real * unit} cy={cY} r="14" fill="#22d3ee" opacity="0.12" />
                <circle cx={cX + root.real * unit} cy={cY} r="7" fill="#22d3ee" filter="url(#softGlow)" />
                <circle cx={cX + root.real * unit} cy={cY} r="3.5" fill="white" />
                <text
                  x={cX + root.real * unit} y={cY + 30}
                  textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="900" opacity="0.9" fontFamily="monospace"
                >
                  x{i + 1}={root.real.toFixed(2)}
                </text>
              </motion.g>
            ))}
          </AnimatePresence>
        </svg>
      </div>

      {/* ── DOCK DE CONTROL ── */}
      <div className="absolute bottom-5 left-7 right-7 bg-black/65 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] px-8 py-7 flex items-center gap-8 z-30">

        {/* ID Instrumental */}
        <div className="flex flex-col gap-1 shrink-0">
          <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Instrumental</span>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-rose-500" />
            <span className="text-[11px] font-black text-slate-400">MATH-01</span>
          </div>
        </div>

        {/* Sliders */}
        <div className="flex-1 flex gap-10">
          <CoefficientSlider
            label="Amplitud (a)" value={a} min={-5} max={5} step={0.1} color="rose"
            onChange={(v) => { setCoefsM1(v, b, c); audio.playPop(); }}
          />
          <CoefficientSlider
            label="Simetría (b)" value={b} min={-10} max={10} step={0.5} color="cyan"
            onChange={(v) => { setCoefsM1(a, v, c); audio.playPop(); }}
          />
          <CoefficientSlider
            label="Intercepto (c)" value={c} min={-10} max={10} step={0.5} color="amber"
            onChange={(v) => { setCoefsM1(a, b, v); audio.playPop(); }}
          />
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => { registrarHallazgoM1(); audio.playSuccess(); }}
            className="h-12 px-5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2 text-white/50 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all font-black text-[9px] uppercase tracking-widest"
          >
            <Activity size={15} /> Data Log
          </motion.button>

          <button
            onClick={() => { resetM1(); audio.playRemove(); }}
            className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <RefreshCcw size={17} />
          </button>

          {/* Indicador de cálculos previos */}
          {status !== 'success' && (
            <div className={`flex items-center gap-2 px-4 h-12 rounded-xl border text-[8px] font-black uppercase tracking-widest shrink-0 transition-all ${
              calcReady
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400/70'
            }`}>
              <span className="text-sm">{calcReady ? '✅' : '🔒'}</span>
              <span className="hidden xl:inline">{calcReady ? 'Cálculos OK' : 'Bitác. primero'}</span>
            </div>
          )}

          <button
            onClick={() => { const ok = validarM1(); if (ok) audio.playSuccess(); else audio.playError(); }}
            className={`h-12 px-7 rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.15em] transition-all shadow-xl
              ${status === 'success'
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : calcReady
                ? 'bg-rose-500 text-white shadow-rose-500/20 hover:scale-105 active:scale-95'
                : 'bg-rose-500/40 text-white/60 shadow-none cursor-not-allowed'
              }`}
          >
            <ShieldCheck size={16} />
            {status === 'success' ? 'Validado ✓' : 'Validar Trayectoría'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Componentes ──────────────────────────────────────────────────────────

function DataChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    slate: 'text-slate-200',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
  };
  return (
    <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
      <span className="text-[7px] font-black text-slate-500 uppercase block mb-1">{label}</span>
      <span className={`text-[11px] font-black font-mono ${colorMap[color] ?? 'text-slate-200'}`}>{value}</span>
    </div>
  );
}

function EquivFormRow({ label, color, formula }: { label: string; color: string; formula: string }) {
  const borderMap: Record<string, string> = {
    rose: 'border-rose-500/30 text-rose-400',
    amber: 'border-amber-500/30 text-amber-400',
    cyan: 'border-cyan-500/30 text-cyan-400',
  };
  const [borderClass, labelClass] = (borderMap[color] ?? 'border-white/10 text-white/40').split(' ');
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-[7px] font-black uppercase tracking-widest ${labelClass} opacity-60`}>{label}</span>
      <div className={`font-mono text-[11px] font-bold text-white/85 pl-3 border-l-2 ${borderClass} leading-snug`}>
        {formula}
      </div>
    </div>
  );
}

function CoefficientSlider({
  label, value, min, max, step, color, onChange,
}: {
  label: string; value: number; min: number; max: number;
  step: number; color: string; onChange: (v: number) => void;
}) {
  const accentMap: Record<string, string> = {
    rose: 'accent-rose-500 text-rose-400',
    cyan: 'accent-cyan-400 text-cyan-400',
    amber: 'accent-amber-400 text-amber-400',
  };
  const [accentClass, textClass] = (accentMap[color] ?? 'accent-white text-white').split(' ');
  return (
    <div className="flex flex-col gap-2.5 flex-1 group">
      <div className="flex justify-between items-center">
        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.15em] group-hover:text-white/60 transition-colors">{label}</span>
        <div className="bg-white/5 px-2 py-1 rounded-md border border-white/5 font-mono text-[11px] font-black">
          <span className={textClass}>{value.toFixed(1)}</span>
        </div>
      </div>
      <div className="relative flex items-center">
        <div className="absolute -inset-1.5 bg-gradient-to-r from-transparent via-white/4 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`relative w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer ${accentClass}`}
        />
      </div>
    </div>
  );
}
